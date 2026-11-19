// Tests shared/exam-question.js (the exam-style question renderer) and the blocks checks in
// tools/build_exam_game_questions.mjs (no answer may ride in a question's blocks).
//   node tools/test_exam_question.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = process.env.BC_SHELL || path.resolve(ROOT, '../../Apps Script/bloomsbury-computing-main');
const EQ = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'exam-question.js'));
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL ' + m); } };
const count = (s, re) => (s.match(re) || []).length;

// ---- renderer, one block type at a time
const para = EQ.html([{ type: 'para', text: 'Line one\nA < B & "C"' }]);
ok(/<p class="eq-para">Line one\nA &lt; B &amp; &quot;C&quot;<\/p>/.test(para), 'para escapes and keeps line breaks');

const table = EQ.html([{ type: 'table', caption: 'Instruction set', head: ['Opcode', 'Command'], rows: [['0001', 'LOAD'], ['', 'ADD']], highlight: [[0, 1]] }]);
ok(count(table, /<th>/g) === 2 && count(table, /<td/g) === 4, 'table: 2 headings, 4 cells');
ok(/<td class="is-hl">LOAD<\/td>/.test(table), 'table: highlight');
ok(/<td class="is-blank"><\/td>/.test(table), 'table: empty cell drawn blank');
ok(/<p class="eq-cap">Instruction set<\/p>/.test(table), 'table: caption');

const tt = EQ.html([{ type: 'truthTable', inputs: ['A', 'B'], outputs: ['X'], rows: [[0, 0, 0], [0, 1, null], [1, 0, null], [1, 1, 1]] }]);
ok(count(tt, /<tr>/g) === 5, 'truth table: heading row and 4 rows');
ok(count(tt, /aria-label="blank"><\/td>/g) === 2, 'truth table: the 2 null cells are blank');
ok(count(tt, /class="is-out"/g) === 5, 'truth table: the output column is ruled off');
ok(/<td class="is-out">1<\/td>/.test(tt), 'truth table: a given output shows');

for (const g of ['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR']) {
  const h = EQ.html([{ type: 'gate', gate: g, output: 'X' }]);
  ok(/<svg viewBox=/.test(h), g + ' gate: svg');
  ok(!new RegExp('>' + g + '<').test(h) && !/eq-gate-name/.test(h), g + ' gate: the name is not shown unless showName');
  ok(count(h, /<path d="M16 /g) === (g === 'NOT' ? 1 : 2), g + ' gate: input wires');
  ok(count(h, /<circle/g) === (/^N/.test(g) ? 1 : 0), g + ' gate: bubble only on NOT, NAND, NOR');
  ok(/>X<\/text>/.test(h) && />A<\/text>/.test(h), g + ' gate: labels');
}
ok(/eq-gate-name">AND</.test(EQ.html([{ type: 'gate', gate: 'AND', showName: true }])), 'gate: showName');
ok(EQ.gateSvg('MAYBE') === '', 'gate: unknown gate draws nothing');

const reg = EQ.html([{ type: 'register', bits: '01111010', heads: 'tc' }]);
ok(count(reg, /<td>[01]<\/td>/g) === 8 && /<th>-128<\/th>/.test(reg) && count(reg, /<th>/g) === 8, 'register: 8 bits under -128 to 1');
const empty = EQ.html([{ type: 'register', caption: 'Register:' }]);
ok(count(empty, /<td aria-label="blank"><\/td>/g) === 8 && /Register:/.test(empty), 'register: empty 8 boxes with caption');
ok(count(EQ.html([{ type: 'register', size: 16 }]), /<td/g) === 16, 'register: 16-bit');

const sum = EQ.html([{ type: 'sum', rows: ['00110011', '01100001'], carry: true, boxes: true }]);
ok(count(sum, /eq-box/g) === 16, 'sum: 8 carry boxes and 8 answer boxes');
ok(count(sum, /<td class="eq-d">[01]<\/td>/g) === 16, 'sum: 16 digits in columns');
ok(/<td class="eq-sign">\+<\/td>/.test(sum), 'sum: plus sign on the last row');
ok(!/10010100/.test(sum.replace(/<[^>]+>/g, '')), 'sum: the total is never drawn');

const code = EQ.html([{ type: 'code', lang: 'pseudocode', lines: ['DECLARE A : INTEGER', 'A <- 5'], numbered: true }]);
ok(/<pre class="eq-code"/.test(code) && /A &lt;- 5/.test(code) && count(code, /eq-ln/g) === 2, 'code: numbered, escaped');

const opts = EQ.html([{ type: 'options', items: ['flowchart', 'trace table', 'truth table', 'variable'] }]);
ok(count(opts, /eq-tick/g) === 4 && />D<\/td><td>variable/.test(opts), 'options: 4 lettered tick boxes');

ok(EQ.html([]) === '' && EQ.html(null) === '', 'no blocks: empty');
ok(EQ.html([{ type: 'nope' }]) === '<div class="eq"></div>', 'unknown block: skipped');

// ---- every question in the built file renders, and its blocks never draw a known answer
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared', 'exam-game-questions.json'), 'utf8'));
let withBlocks = 0;
for (const s of data.sets) for (const q of s.questions) if (q.blocks) {
  withBlocks++;
  const h = EQ.html(q.blocks);
  ok(h.length > 20 && !/undefined|NaN/.test(h), q.qid + ' renders');
  ok(!/undefined|NaN/.test(q.text), q.qid + ' plain text');
}
ok(withBlocks >= 80, 'at least 80 questions have blocks (' + withBlocks + ')');

// ---- the builder rejects answers inside blocks (run against a copy of the shell with one question changed)
function builderWith(change) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eg-blocks-'));
  for (const f of fs.readdirSync(SHELL).filter((f) => /^ExamGame(Set\w+)?\.gs$/.test(f))) fs.copyFileSync(path.join(SHELL, f), path.join(dir, f));
  const f = path.join(dir, change.file), src = fs.readFileSync(f, 'utf8');
  if (!src.includes(change.from)) throw new Error('test setup: ' + change.from + ' not in ' + change.file);
  fs.writeFileSync(f, src.replace(change.from, change.to));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build_exam_game_questions.mjs'), '--check'], { env: { ...process.env, BC_SHELL: dir }, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return (r.stdout || '') + (r.stderr || '');
}
const tt6a = "{ type: \"truthTable\", inputs: [\"A\", \"B\"], outputs: [\"X\"], rows: [[0, 0, null], [0, 1, null], [1, 0, null], [1, 1, null]] }";
let out = builderWith({ file: 'ExamGameSetY11Gates.gs', from: tt6a, to: tt6a.replace(' }', ', answer: "0001" }') });
ok(/FAIL y11g-23n23-6a has an answer-like field "answer"/.test(out), 'builder rejects an answer field in a block: ' + out.trim());
out = builderWith({ file: 'ExamGameSetY11Gates.gs', from: tt6a, to: tt6a.replace(' }', ' }, { type: "para", text: "X is 0001" }') });
ok(/FAIL y11g-23n23-6a blocks spell out a blank truth table column/.test(out), 'builder rejects a blank column spelled out: ' + out.trim());
out = builderWith({ file: 'ExamGameSetShifts.gs', from: '{ type: "register" }', to: '{ type: "register", bits: "00001111" }' });
ok(/FAIL ls-23j12-2bi blocks contain the answer 00001111/.test(out), 'builder rejects the answer bits in a register: ' + out.trim());
out = builderWith({ file: 'ExamGameSetShifts.gs', from: '{ type: "register" }', to: '{ type: "register", value: "x" }' });
ok(/field "value" is not allowed/.test(out), 'builder rejects unknown fields: ' + out.trim());
out = builderWith({ file: 'ExamGameSetAddition.gs', from: 'carry: true, boxes: true', to: 'carry: true, boxes: true, rows2: 1' });
ok(/FAIL add-/.test(out), 'builder rejects extra sum fields: ' + out.trim());
out = builderWith({ file: 'ExamGameSetY11Gates.gs', from: tt6a, to: tt6a });
ok(/^up to date/.test(out.trim()), 'unchanged copy passes the check: ' + out.trim());

console.log(checks + ' checks, ' + withBlocks + ' questions with blocks, ' + (fails ? fails + ' FAILED' : 'all passed'));
process.exit(fails ? 1 : 0);
