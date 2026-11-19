// Answering in the exam's own spaces: shared/exam-question.js serialise turns ticks and filled cells into the plain text
// the shell marks (ExamGame.gs examGameKeywordMark_, its key marks and the LAN party's C# port read the same text).
// Run: node tools/test_exam_question_answers.mjs   (reads the shell's ExamGame*.gs like tools/build_exam_game_questions.mjs)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = process.env.BC_SHELL || path.resolve(ROOT, '../../Apps Script/bloomsbury-computing-main');
const EQ = require(path.join(ROOT, 'shared', 'exam-question.js'));
const ctx = vm.createContext({});
for (const f of ['ExamGame.gs'].concat(fs.readdirSync(SHELL).filter((f) => /^ExamGameSet\w+\.gs$/.test(f)).sort())) {
  vm.runInContext(fs.readFileSync(path.join(SHELL, f), 'utf8'), ctx, { filename: f });
}
const all = vm.runInContext('examGameAllSets_()', ctx);
const find = (qid) => { for (const s of Object.values(all)) for (const q of s.questions) if (q.qid === qid) return q; return null; };
const mark = (q, a) => ctx.examGameKeywordMark_(q, a);
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('FAIL ' + m); } };
const eq = (a, b, m) => ok(a === b, m + '\n  got:  ' + JSON.stringify(a) + '\n  want: ' + JSON.stringify(b));

// March 2022 Q3(a): the tick grid. Block 1 is the grid; tick columns are 1 (AND) and 2 (OR).
const g = find('y11g-22m12-3a');
ok(g && g.marks === 3 && g.blocks[1].type === 'tickGrid', 'Q3(a) is one 3-mark tick grid');
const gi = g.blocks.findIndex((b) => b.type === 'tickGrid'), t = (r, c) => 'b' + gi + 'r' + r + 'c' + c;
const full = { [t(0, 1)]: 1, [t(0, 2)]: 1, [t(2, 2)]: 1 };
eq(EQ.serialise(g.blocks, full, ''), 'Row 1: AND, OR.\nRow 2: none.\nRow 3: OR.', 'grid serialises one line per row');
eq(mark(g, EQ.serialise(g.blocks, full, '')), 3, 'grid: full marks');
eq(mark(g, EQ.serialise(g.blocks, { [t(0, 1)]: 1, [t(2, 2)]: 1 }, '')), 2, 'grid: row 1 part wrong loses only its mark');
eq(mark(g, EQ.serialise(g.blocks, { [t(0, 1)]: 1, [t(0, 2)]: 1, [t(1, 2)]: 1, [t(2, 2)]: 1 }, '')), 2, 'grid: a tick in the empty row loses that row');
eq(mark(g, EQ.serialise(g.blocks, { [t(2, 2)]: 1 }, '')), 2, 'grid: the empty row 2 is right with no tick');
eq(EQ.serialise(g.blocks, {}, ''), '', 'grid: nothing ticked sends nothing');
ok(!EQ.needsWriting(g.blocks), 'grid: no typing box');

// Blank truth table cells: the window question (8 blanks, scale) and Nov 2023 Q6(a) (a line and 4 blanks).
const w = find('y11g-24n23-8'), wi = w.blocks.findIndex((b) => b.type === 'truthTable');
const cells = (bits, i, col) => Object.fromEntries(bits.split('').map((v, r) => ['b' + i + 'r' + r + 'c' + col, v]));
eq(EQ.serialise(w.blocks, cells('00100000', wi, 3), ''), 'W: 00100000', 'truth table column serialises top row first');
eq(mark(w, 'W: 00100000'), 4, 'window: 8 right is 4 marks');
eq(mark(w, EQ.serialise(w.blocks, cells('0010', wi, 3), '')), 2, 'window: 4 filled, 4 left empty');
const d = find('y11g-23n23-6a'), li = d.blocks.findIndex((b) => b.type === 'line'), ti = d.blocks.findIndex((b) => b.type === 'truthTable');
const ds = Object.assign({ ['b' + li + 'v']: 'AND' }, cells('0001', ti, 2));
eq(EQ.serialise(d.blocks, ds, ''), 'Logic gate: AND\nX: 0001', 'answer line then truth table');
eq(mark(d, EQ.serialise(d.blocks, ds, '')), 2, 'Q6(a): full marks');

// Register boxes and the working lines (typed text goes where the lines block is).
const r = find('tc-23j11-1c'), ri = r.blocks.findIndex((b) => b.type === 'register');
const rs = Object.fromEntries('10110010'.split('').map((v, i) => ['b' + ri + 'c' + i, v]));
eq(EQ.serialise(r.blocks, rs, '78 = 01001110, flip 10110001, add 1'), '78 = 01001110, flip 10110001, add 1\nRegister: 10110010', 'working then register');
eq(EQ.serialise(r.blocks, { ['b' + ri + 'c0']: '1' }, ''), 'Register: 1???????', 'an empty register box is ?');
ok(EQ.needsWriting(r.blocks), 'a show-your-working question keeps the typing box');

// Tick boxes (options) and a blank table cell.
const o = find('y11g-24n21-2'), oi = o.blocks.findIndex((b) => b.type === 'options');
eq(EQ.serialise(o.blocks, { ['b' + oi + 'o2']: 1 }, ''), 'Option C: truth table.', 'options serialise');
eq(mark(o, 'Option C: truth table.'), 1, 'options: C is right');
eq(mark(o, EQ.serialise(o.blocks, { ['b' + oi + 'o1']: 1, ['b' + oi + 'o2']: 1 }, '')), 0, 'options: two ticks earn nothing');
const tb = find('tc-26j13-8di'), tbi = tb.blocks.findIndex((b) => b.type === 'table');
eq(EQ.serialise(tb.blocks, { ['b' + tbi + 'r0c1']: '35', ['b' + tbi + 'r1c1']: '-22' }, ''), '00100011: 35\n11101010: -22', 'table blank cells serialise by row');
eq(mark(tb, '00100011: 35\n11101010: -22'), 2, 'table cells: full marks');

// Every set: student-facing text and the questions file never carry a note of ours.
const file = fs.readFileSync(path.join(ROOT, 'shared', 'exam-game-questions.json'), 'utf8');
for (const s of Object.values(all)) for (const q of s.questions) {
  ok(!/\(adapted|^adapted from/im.test(q.text), q.qid + ' shows an adaptation note');
  if (q.adaptNote) ok(!q.text.includes(q.adaptNote) && !file.includes(JSON.stringify(q.adaptNote).slice(1, -1)), q.qid + ' adaptNote reaches students');
}
ok(!/adaptNote|markBy|"key"/.test(file), 'the questions file has no hidden fields');

console.log(fails ? `${fails} failed, ${passes} passed` : `All ${passes} checks passed.`);
process.exit(fails ? 1 : 0);
