// Data Bridge teacher mode (BridgeBuilder/js/teacher.js): the Shift + D, E, V detector, the teacher gate, and the
// guard that keeps teacher play out of the saved game and the lesson slide result.
// Run: node tools/test_bridge_teacher.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
require(path.join(here, '..', 'BridgeBuilder', 'js', 'teacher.js'));
const T = globalThis.BBTeacher;

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }
const body = { tagName: 'BODY' };
const key = (k, o = {}) => ({ key: k, shiftKey: true, target: body, ...o });

// 1. The detector
{
  let hits = 0; const d = T.makeDetector(() => hits++);
  d(key('Shift'), 0); d(key('D'), 10); d(key('E'), 300); d(key('V'), 600);
  ok(hits === 1, 'Shift + D, E, V unlocks');
  d(key('d'), 1000); d(key('e'), 1100); d(key('v'), 1200);
  ok(hits === 2, 'lower case (Caps Lock) works too');
  d(key('D'), 2000); d(key('E'), 2500); d(key('V'), 4200);
  ok(hits === 2, 'slower than 2 s does not unlock');
  d(key('D'), 5000); d(key('E', { shiftKey: false }), 5100); d(key('V'), 5200);
  ok(hits === 2, 'letting go of Shift breaks the sequence');
  d(key('d', { shiftKey: false }), 6000); d(key('e', { shiftKey: false }), 6100); d(key('v', { shiftKey: false }), 6200);
  ok(hits === 2, 'without Shift nothing happens');
  for (const target of [{ tagName: 'TEXTAREA' }, { tagName: 'INPUT', type: 'text' }, { tagName: 'INPUT', type: 'number' }, { tagName: 'DIV', isContentEditable: true }]) {
    d(key('D', { target }), 7000); d(key('E', { target }), 7100); d(key('V', { target }), 7200);
  }
  ok(hits === 2, 'typing in an answer box or text field never unlocks');
  d(key('D'), 8000); d(key('E', { target: { tagName: 'TEXTAREA' } }), 8100); d(key('V'), 8200);
  ok(hits === 2, 'a key in a text field in the middle resets it');
  d(key('D'), 9000); d(key('D'), 9100); d(key('E'), 9200); d(key('V'), 9300);
  ok(hits === 3, 'a repeated D starts again from that D');
  d(key('D'), 10000); d(key('PageDown'), 10100); d(key('E'), 10200); d(key('V'), 10300);
  ok(hits === 4, 'PageDown is ignored and never breaks the sequence');
  let prevented = false; d({ key: 'PageUp', shiftKey: true, target: body, preventDefault() { prevented = true; } }, 11000);
  ok(!prevented, 'PageUp is never captured');
  d(key('D', { ctrlKey: true }), 12000); d(key('E', { ctrlKey: true }), 12100); d(key('V', { ctrlKey: true }), 12200);
  ok(hits === 4, 'Ctrl + Shift does not count');
}

// 2. The gate
{
  let asked = 0;
  const ask = r => () => { asked++; return Promise.resolve(r); };
  ok(await T.gate({ standalone: false, ask: ask({ teacher: false }) }) === false, 'a student is refused');
  ok(await T.gate({ standalone: false, ask: ask({ teacher: true }) }) === true, 'a teacher is allowed');
  ok(await T.gate({ standalone: false, ask: ask({}) }) === false, 'no teacher flag is a no');
  ok(await T.gate({ standalone: false, ask: ask({ teacher: 'yes' }) }) === false, 'only teacher === true counts');
  ok(await T.gate({ standalone: false, ask: () => Promise.reject(new Error('Unknown request.')) }) === false, 'an older shell (unknown op) is a no');
  ok(await T.gate({ standalone: false, ask: () => { throw new Error('x'); } }) === false, 'a throw is a no');
  const before = asked;
  ok(await T.gate({ standalone: true, ask: ask({ teacher: false }) }) === true && asked === before, 'standalone is allowed without asking');
}

// 3. The relay request: whoami goes to the parent, only the parent's answer for that reqId counts
{
  const listeners = [], sent = [];
  const parent = { postMessage(m) { sent.push(m); } };
  const win = { parent, addEventListener: (t, f) => listeners.push(f), removeEventListener: (t, f) => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); } };
  const p = T.askWhoami(win, 1000);
  ok(sent.length === 1 && sent[0].type === 'BC_EXAM_GAME_REQUEST' && sent[0].op === 'whoami', 'asks the shell with op whoami');
  const reqId = sent[0].reqId;
  listeners.slice().forEach(f => f({ source: {}, data: { type: 'BC_EXAM_GAME_RESULT', reqId, ok: true, result: { teacher: true } } }));
  listeners.slice().forEach(f => f({ source: parent, data: { type: 'BC_EXAM_GAME_RESULT', reqId: 'other', ok: true, result: { teacher: true } } }));
  listeners.slice().forEach(f => f({ source: parent, data: { type: 'BC_EXAM_GAME_RESULT', reqId, ok: true, result: { teacher: false } } }));
  ok((await p).teacher === false, 'only the parent\'s answer for this request is used');
  ok(listeners.length === 0, 'the listener is removed');
}

// 4. The guard: teacher mode never writes the saved game and never sends the slide result
{
  const stored = [], posted = [];
  const g = T.makeGuard({ store: (k, v) => stored.push([k, v]), post: m => posted.push(m) });
  g.store('game:x', { round: 3 }); g.post({ type: 'BC_APP_RESULT', complete: false });
  ok(stored.length === 1 && posted.length === 1, 'normal play saves and reports');
  g.set(true);
  g.store('game:x', { round: 9 }); g.store('best:x', 9); g.store('done:x', true);
  g.post({ type: 'BC_APP_RESULT', complete: true });
  ok(stored.length === 1 && posted.length === 1, 'teacher mode writes no save, best or done, and sends no completion');
  g.set(false);
  g.store('game:x', { round: 3 });
  ok(stored.length === 2 && stored[1][1].round === 3, 'after exit the normal save works again');
}

console.log(fails ? `${fails} failed, ${passes} passed` : `All ${passes} checks passed.`);
process.exit(fails ? 1 : 0);
