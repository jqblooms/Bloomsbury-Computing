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
ok(L.rounds(fde).join() === 'see,gap0,gap1,gap2,order,recall,spot,quick', 'rounds');
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
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.js')) : [];
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

console.log(`${checks - fails} of ${checks} checks passed`);
process.exit(fails ? 1 : 0);
