// Tests Fact Chain's pure logic (FactChain/js/logic.js) and checks every pack in FactChain/packs/ against it.
// Run: node tools/test_fact_chain.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const L = require('../FactChain/js/logic.js');
const S = require('../MasterySets/js/scheduler.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL ' + m); } };

// A small sample pack, only for this test.
const fde = {
  id: 'y10-fde', title: 'The Fetch Stage', part: 'buses',
  chain: [
    { text: 'The PC holds the address of the next instruction.', gaps: ['PC', 'address', 'next instruction'], accept: { PC: ['program counter'] }, hl: ['pc'] },
    { text: 'The address is copied from the PC to the MAR.', gaps: ['MAR', 'copied'], accept: { MAR: ['memory address register'], copied: [] }, hl: ['pc', 'mar'] },
    { text: 'The address is sent along the address bus to RAM.', gaps: ['address bus', 'RAM'], hl: ['addressBus', 'ram'] },
    { text: 'The instruction comes back on the data bus to the MDR.', gaps: ['data bus', 'MDR'], hl: ['dataBus', 'mdr'] }
  ],
  quick: [
    { id: 'q1', q: 'Which register holds the address of the next instruction?', accept: ['program counter', 'pc'], model: 'Program counter (PC)' },
    { id: 'q2', q: 'How many cycles a second is 2.4 GHz?', accept: ['2.4 billion', '2400000000'], model: '2.4 billion' },
    { id: 'q3', q: 'Name the three stages.', accept: ['fetch, decode and execute'], model: 'Fetch, decode and execute' }
  ],
  spot: [{ wrong: 'The MDR holds the address of the next instruction.', fix: ['pc', 'program counter'], model: 'The PC holds the address of the next instruction.' }]
};

// Normalising and whole words
ok(L.norm('Fetch, decode & execute!') === 'fetch decode and execute', 'norm punctuation');
ok(L.norm('2.4 billion.') === '2.4 billion', 'norm keeps a decimal point');
ok(L.norm('2,400,000,000') === '2400000000', 'norm thousands commas');
ok(L.hasAny('it is 2.4 billion cycles', ['2.4 billion']), 'decimal phrase');
ok(!L.hasAny('24 billion', ['2.4 billion']), '24 is not 2.4');
ok(L.hasAny('Fetch, then decode and execute', ['fetch, decode and execute']) === false, 'phrase words must be next to each other');
ok(L.hasAny('fetch decode and execute', ['fetch, decode and execute']), 'commas ignored');
ok(L.hasAny('the PC', ['pc']) && !L.hasAny('the PCs are', ['mar']), 'short word exact');
ok(!L.hasAny('MDR', ['mar']), 'MAR and MDR are different');
ok(L.hasAny('the buses', ['bus']) && L.hasAny('registers', ['register']) && L.hasAny('addresses', ['address']), 'plurals');
ok(L.hasAny('progam counter', ['program counter']), 'one typo in a long word');
ok(!L.hasAny('prgam cunter', ['program counter']), 'two typos in a word');
ok(!L.hasAny('topic', ['pc']), 'no part-word match');
ok(!L.hasAny('2.4 million', ['billion']), 'million is not a typo of billion');
ok(L.hasAny('anything', []) === false, 'empty accept list');

// Gaps
ok(L.gapRight(fde.chain[0], 'PC', 'pc') && L.gapRight(fde.chain[0], 'PC', 'Program Counter') && !L.gapRight(fde.chain[0], 'PC', 'MAR'), 'gap accepts');
ok(L.gapRight(fde.chain[1], 'copied', 'copied') && !L.gapRight(fde.chain[1], 'copied', ''), 'empty accept list for a gap');
ok(!L.gapRight(fde.chain[0], 'address', 'the address of the next instruction in memory now'), 'gap box with too much');
const a = L.blanks(fde.chain[0], 0), b = L.blanks(fde.chain[0], 1);
ok(a.filter((x) => x.type === 'gap').length === 1 && a.find((x) => x.type === 'gap').gap === 'PC', 'round A blanks gap 1');
ok(b.filter((x) => x.type === 'gap').length === 2, 'round B blanks 2');
ok(L.blanks(fde.chain[0], 2) === null, 'round C whole line');
ok(a.map((x) => x.type === 'gap' ? x.gap : x.text).join('') === fde.chain[0].text, 'blanks rebuild the line');

// Whole line and recall
ok(L.lineFound(fde.chain[0], 'program counter has the address of the next instruction'), 'line found with an accept');
ok(!L.lineFound(fde.chain[0], 'PC holds the address'), 'line needs every gap');
const r = L.recall(fde.chain, 'the PC holds the address of the next instruction\naddress goes on the address bus to RAM\nsomething about memory');
ok(r.found.join() === 'true,false,true,false' && r.unmatched.join() === 'something about memory', 'recall found and unmatched');
const r2 = L.recall(fde.chain, 'PC has the address of the next instruction. It is copied to the MAR. Then the data bus brings it to the MDR.');
ok(r2.found.join() === 'true,true,false,true', 'recall finds facts in sentences on one line');

// Order shuffle is never right
for (let i = 0; i < 50; i++) ok(L.shuffleOrder(4).some((v, k) => v !== k), 'shuffle differs');
ok(L.rounds(fde).join() === 'see,gap0,gap1,gap2,recall,spot,quick', 'rounds: no order without a real sequence');
ok(L.rounds(Object.assign({}, fde, { sequences: [[0, 1, 2]] })).join() === 'see,gap0,gap1,gap2,order,recall,spot,quick', 'rounds: order for a real sequence');
ok(L.packProblems(fde).length === 0, 'sample pack is valid');
ok(L.packProblems({ id: 'x', chain: [{ text: 'a b', gaps: ['c'] }, { text: 'd', gaps: ['d'] }] }).length === 1, 'gap not in text found');

// Progress
const st = L.create();
L.packRec(st, 'y10-fde').facts = 3;
const st2 = L.repair(JSON.parse(JSON.stringify(st)));
L.packRec(st2, 'y10-fde').step = 2;
ok(L.progress(st2) > L.progress(st) && L.progress(L.repair(null)) === 0, 'progress order');

// Quick-fire with the Practice Sets scheduler: one set
const q = S.create([3]), ids = fde.quick.map((x) => x.id);
let n = 0, res;
do { S.next(q, ids); res = S.answer(q, ids, true); n++; } while (!res.finished && n < 50);
ok(res.finished && n === 6, 'quick-fire all right needs 6 answers, got ' + n);

// Every real pack
const dir = path.join(ROOT, 'FactChain', 'packs');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js') : [];
for (const f of files) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx);
  const id = f.replace(/\.js$/, ''), p = ctx.window.FACT_CHAIN_PACKS && ctx.window.FACT_CHAIN_PACKS[id];
  const probs = L.packProblems(p);
  ok(!probs.length, `${id}: ${probs.join('; ')}`);
  if (probs.length) continue;
  p.chain.forEach((c, i) => {
    ok(L.lineFound(c, c.text), `${id} line ${i + 1} not found in its own text`);
    c.gaps.forEach((g) => ok(L.gapRight(c, g, g), `${id} line ${i + 1} gap "${g}" rejects itself`));
    (c.hl || []).forEach((h) => ok(['cpu', 'pc', 'mar', 'mdr', 'cir', 'acc', 'alu', 'cu', 'clock', 'cache', 'core', 'addressBus', 'dataBus', 'controlBus', 'ram', 'sensor', 'adc', 'actuator', 'device'].includes(h), `${id} line ${i + 1} hl ${h}`));
  });
  (p.quick || []).forEach((x) => {
    x.accept.forEach((a) => ok(L.hasAny(a, x.accept), `${id} ${x.id} accept "${a}" fails itself`));
    if (x.model && !L.hasAny(x.model, x.accept)) console.log(`note: ${id} ${x.id} model "${x.model}" does not pass its own keywords`);
  });
  (p.spot || []).forEach((s, i) => { if (s.model) ok(L.hasAny(s.model, s.fix), `${id} spot ${i + 1} model fails its fix`); });
  console.log(`${id}: ${p.chain.length} lines, ${(p.quick || []).length} quick, ${(p.spot || []).length} spot`);
}

// ---------------------------------------------------------------- Data Bridge fact rounds (FactChain/js/rounds.js)
const FR = require('../FactChain/js/rounds.js');
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const big = { id: 'big', title: 'Big', chain: Array.from({ length: 8 }, (_, i) => ({ text: `Fact number ${i} is about word${i}.`, gaps: [`word${i}`, 'about'] })),
  quick: Array.from({ length: 6 }, (_, i) => ({ id: 'q' + i, q: 'Q' + i, accept: ['answer' + i] })),
  spot: Array.from({ length: 5 }, (_, i) => ({ wrong: 'Wrong ' + i, fix: ['fix' + i], model: 'fix' + i })), sequences: [[1, 2, 4, 6, 7]] };
ok(FR.stagesFor(big).join() === 'gap0,gap1,gap2,order,spot,quick,recall', 'all stages');
ok(FR.stagesFor({ chain: big.chain, sequences: big.sequences }).join() === 'gap0,gap1,gap2,order,recall', 'stages skip missing spot and quick');
ok(FR.stagesFor({ chain: big.chain }).join() === 'gap0,gap1,gap2,recall', 'no order stage without a real sequence');
ok(FR.build(big, 'order', rnd).items.every((it) => it.lines.every((l) => big.sequences[0].includes(l)) && it.lines.every((l, k) => k === 0 || big.sequences[0].indexOf(l) === big.sequences[0].indexOf(it.lines[k - 1]) + 1)), 'order items are runs of the sequence');
ok(FR.stageFor(big, 1) === 'gap0' && FR.stageFor(big, 7) === 'recall' && FR.stageFor(big, 8) === 'gap0', 'stages cycle with the round');
for (const st of FR.STAGES) {
  const r = FR.build(big, st, rnd);
  ok(r.items.length >= 1 && r.items.length <= 5, st + ' has 1 to 5 items');
}
const g0 = FR.build(big, 'gap0', rnd);
ok(g0.items.length === 4 && g0.items.every((it, k) => k === 0 || it.line === g0.items[k - 1].line + 1), 'gap items are lines next to each other');
const it0 = g0.items[0];
ok(FR.markGap(big, it0, ['word' + it0.line]).right && !FR.markGap(big, it0, ['nope']).right, 'gap marking by logic.js');
const g2 = { kind: 'gap', k: 2, line: 3, w: 1 };
ok(FR.markGap(big, g2, 'fact 3 is about word3').right && !FR.markGap(big, g2, 'word3').right, 'whole line marking');
ok(FR.cueLine(big, 0) === null && FR.cueLine(big, 3) === big.chain[2], 'cue line');
const ord = FR.build(big, 'order', rnd).items[0];
ok(ord.start.some((v, k) => v !== k), 'order starts shuffled');
ok(FR.markOrder(ord, ord.lines.slice()).right && !FR.markOrder(ord, ord.lines.slice().reverse()).right, 'order marking');
ok(FR.markSpot(big, { i: 2 }, 'fix2') && !FR.markSpot(big, { i: 2 }, 'fix3'), 'spot marking');
ok(FR.markQuick(big, { i: 1 }, 'answer1') && !FR.markQuick(big, { i: 1 }, 'answer2'), 'quick marking');
const rc = FR.markRecall(big, { kind: 'recall', need: 3, w: 3 }, 'fact 1 about word1\nfact 2 about word2\nsomething else');
ok(rc.count === 2 && rc.unmatched.join() === 'something else', 'recall counts found facts');
const bodies = FR.recallAiBodies(big, { need: 3 }, rc);
ok(bodies.length && bodies.every((b) => b.body.drillId === 'factchain-big' && /^line\d+$/.test(b.body.cardId) && b.body.answer === 'something else'), 'recall Haiku bodies');
ok(FR.aiBody(big, { kind: 'quick', i: 0 }, 'x').cardId === 'q0', 'quick card id is the Fact Chain one');
ok(FR.aiBody(big, { kind: 'gap', k: 0, line: 4 }, 'x').cardId === 'line5', 'gap card id');
ok(FR.aiBody(big, { kind: 'order', lines: [0] }, 'x') === null, 'order never goes to Haiku');
// Learn: a missed item swapped for a new one of the same kind, never one already in the round
const qr = FR.build(big, 'quick', rnd);
for (let i = 0; i < 20; i++) {
  const n = FR.swap(big, qr, 0, rnd);
  ok(n.kind === 'quick' && !qr.items.some((x) => x.i === n.i), 'swap gives a new quick item');
}
const again = FR.again(qr, rnd);
ok(again.length === qr.items.length && again.map((x) => x.i).sort().join() === qr.items.map((x) => x.i).sort().join(), 'Play redo keeps the same items');
// Coins: the first pass pays per unit; a clean redo pays half for the ones missed
const rate = FR.rate(120, 4);
ok(FR.firstPay(rate, 3) === 90 && FR.redoPay(rate, 1) === 15 && FR.firstPay(rate, 4) === 120, 'coin rule');
// Topics and packs
const idx = { groups: { g1: { title: 'Group', year: 'Year 8', packs: ['big', 'missing'] } } };
const tps = FR.topics(idx, { big });
ok(tps.length === 1 && tps[0].setId === 'facts:big' && tps[0].year === 'Year 8' && tps[0].unit === 'Fact Chain', 'a missing pack is skipped');
ok(FR.packsFor(idx, { big }, 'facts:g1').length === 1 && FR.packsFor(idx, { big }, 'facts:big')[0] === big, 'packs for a topic');
ok(FR.isFacts('facts:g1') && !FR.isFacts('y8-logic'), 'fact topic ids');
// The registry: both groups, and a note for any listed pack whose file is not there yet
{
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, 'index.js'), 'utf8'), ctx);
  const groups = ctx.window.FACT_CHAIN_INDEX.groups;
  for (const g of Object.keys(groups)) for (const id of groups[g].packs) {
    if (!fs.existsSync(path.join(dir, id + '.js'))) console.log(`note: index lists ${id} (group ${g}) but the file is not there yet`);
  }
  ok(groups['y10-3-1'] && groups['y8-term1b'], 'index has the Year 10 and Year 8 groups');
}
// Every real pack builds every round, and any code field is a list of lines
for (const f of files) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx);
  const p = ctx.window.FACT_CHAIN_PACKS[f.replace(/\.js$/, '')];
  if (!p || L.packProblems(p).length) continue;
  for (let n = 1; n <= 10; n++) { const r = FR.build(p, FR.stageFor(p, n), rnd); ok(r.items.length > 0, `${p.id} round ${n} builds`); }
  [p.chain, p.quick || [], p.spot || []].forEach((list) => list.forEach((x) => { if (x.code != null) ok(Array.isArray(x.code) && x.code.every((l) => typeof l === 'string'), `${p.id} code is a list of lines`); }));
}

console.log(`${checks - fails} of ${checks} checks passed`);
process.exit(fails ? 1 : 0);
