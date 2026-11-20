// Drills/ai-check.js: the Haiku second check for typed drill answers (aiFallback drills).
//   node tools/test_drill_ai_check.mjs
// Keyword right -> no call; keyword wrong + Haiku yes -> right; Haiku no -> wrong; any failure, timeout or no
// shell -> wrong. Also the relay message the shell receives and the two Y10 3.1.R drills carrying both flags.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'Drills', 'ai-check.js'), 'utf8');

function load(reply) {
  const listeners = [], sent = [], timers = [];
  const win = {
    addEventListener: (t, f) => listeners.push(f),
    removeEventListener: (t, f) => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); },
    parent: null
  };
  win.parent = reply === 'noShell' ? win : {
    postMessage: (msg) => {
      sent.push(msg);
      if (reply === 'silent') return;
      if (reply === 'throw') throw new Error('gone');
      const d = { type: 'BC_EXAM_GAME_RESULT', reqId: msg.reqId, ...reply };
      Promise.resolve().then(() => listeners.slice().forEach((f) => f({ data: { ...d, reqId: 'other' }, source: win.parent })))
        .then(() => listeners.slice().forEach((f) => f({ data: d, source: win.parent })));
    }
  };
  const ctx = vm.createContext({ window: win, Promise, Date, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout: () => {} });
  vm.runInContext(src, ctx);
  return { api: win.DrillAiCheck, sent, timers, listeners };
}

const payload = { drillId: 'y10-3-1-r', cardId: 'pl-09', prompt: 'Describe the role of a register.', answers: ['It temporarily stores data'], note: 'n', hint: '', answer: 'keeps data for a short time' };

// decide: the rule itself.
{
  const { api } = load({ ok: true, result: { correct: true } });
  let asked = 0;
  const ask = (v) => () => { asked++; return v; };
  assert.equal(await api.decide(true, true, ask(Promise.resolve(false))), true, 'keyword right is right');
  assert.equal(asked, 0, 'keyword right never asks Haiku');
  assert.equal(await api.decide(false, true, ask(Promise.resolve(true))), true, 'Haiku yes is right');
  assert.equal(await api.decide(false, true, ask(Promise.resolve(false))), false, 'Haiku no is wrong');
  assert.equal(await api.decide(false, true, ask(Promise.reject(new Error('x')))), false, 'Haiku failure is wrong');
  assert.equal(await api.decide(false, true, () => { throw new Error('x'); }), false, 'a throw is wrong');
  assert.equal(await api.decide(false, true, ask(Promise.resolve('yes'))), false, 'only true counts');
  const n = asked;
  assert.equal(await api.decide(false, false, ask(Promise.resolve(true))), false, 'flag off keeps the keyword result');
  assert.equal(asked, n, 'flag off never asks');
}

// ask: through the relay.
{
  const t = load({ ok: true, result: { correct: true, reason: 'same' } });
  assert.equal(await t.api.ask(payload), true);
  assert.equal(t.sent[0].type, 'BC_EXAM_GAME_REQUEST'); assert.equal(t.sent[0].op, 'drillCheck');
  assert.equal(t.sent[0].payload.answer, payload.answer);
  assert.ok(JSON.stringify(t.sent[0]).length < 5000, 'within the relay size limit');
  assert.equal(t.listeners.length, 0, 'listener removed');
  const big = load({ ok: true, result: { correct: true } });
  await big.api.ask({ ...payload, prompt: 'x'.repeat(9000), answers: Array(20).fill('y'.repeat(900)), note: 'z'.repeat(5000), answer: 'w'.repeat(5000) });
  assert.ok(JSON.stringify(big.sent[0]).length < 5000, 'a huge card is cut to fit');
}
assert.equal(await load({ ok: true, result: { correct: false } }).api.ask(payload), false, 'Haiku no');
assert.equal(await load({ ok: true, result: { correct: false, unavailable: true } }).api.ask(payload), false, 'unavailable');
assert.equal(await load({ ok: false, error: 'Sign in to play.' }).api.ask(payload), false, 'signed out');
assert.equal(await load('noShell').api.ask(payload), false, 'no shell');
assert.equal(await load('throw').api.ask(payload), false, 'postMessage throws');
{
  const t = load('silent');
  const p = t.api.ask(payload);
  assert.equal(t.timers[0].ms, 15000);
  t.timers[0].f();
  assert.equal(await p, false, 'timeout is wrong');
}

// The two Y10 3.1.R drills carry both flags; the engine reads them.
for (const id of ['y10-3-1-r', 'y10-3-1-r2']) {
  const ctx = { DrillData: { register: (k, d) => { ctx.out = d; } } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
  assert.equal(ctx.out.aiFallback, true, id + ' aiFallback'); assert.equal(ctx.out.waitForNext, true, id + ' waitForNext');
}
const engine = fs.readFileSync(path.join(ROOT, 'Drills', 'engine.js'), 'utf8');
assert.ok(/drill\.aiFallback/.test(engine) && /drill\.waitForNext/.test(engine));
assert.ok(fs.readFileSync(path.join(ROOT, 'Drills', 'index.html'), 'utf8').includes('"ai-check.js"'));
console.log('test_drill_ai_check: all passed');
