// Builds shared/exam-game-questions.json: the Exam Game question texts, so a game (TowerDefence/) shows a round at once
// instead of asking the server. Reads the shell's ExamGame.gs and ExamGameSet*.gs in a node vm, as its tests do.
// ONLY { setId, title, year, unit, questions: [{ qid, text, marks, blocks? }] } is written (blocks: the question drawn as
// in the exam, checked below so no answer can ride in them; shared/exam-question.js draws them; year and unit are set-level labels
// for the topic pickers, and every set must have both): mark schemes, model answers, checks, points,
// reveal and fallback stay on the server, and this script fails if any other field gets in.
// It also writes the file's version into shared/exam-game-client.js (QFILE_G), so browsers load the new file.
//
//   node tools/build_exam_game_questions.mjs           rewrite the file
//   node tools/build_exam_game_questions.mjs --check   exit 1 if it does not match the server sets
//
// When a set changes in the shell: run this, commit and push the pages repo, then deploy the shell.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = process.env.BC_SHELL || path.resolve(ROOT, '../../Apps Script/bloomsbury-computing-main');
const OUT = path.join(ROOT, 'shared', 'exam-game-questions.json');
const CLIENT = path.join(ROOT, 'shared', 'exam-game-client.js');
const check = process.argv.includes('--check');

const files = ['ExamGame.gs'].concat(fs.readdirSync(SHELL).filter((f) => /^ExamGameSet\w+\.gs$/.test(f)).sort());
const ctx = vm.createContext({ console });
for (const f of files) vm.runInContext(fs.readFileSync(path.join(SHELL, f), 'utf8'), ctx, { filename: f });
const all = vm.runInContext('examGameAllSets_()', ctx);
const listed = vm.runInContext('examGameSets_()', ctx);

// A combined set (combine in the shell, e.g. y10-unit3-1-practice) has questions: [] and qids: the questions it draws from
// the other sets, which shared/exam-game-client.js fills in (an older client sees an empty topic, never a broken file).
const sets = listed.map(({ setId }) => all[setId].combine ? {
  setId,
  title: String(all[setId].title),
  year: String(all[setId].year || ''),
  unit: String(all[setId].unit || ''),
  questions: [],
  qids: all[setId].questions.map((q) => String(q.qid))
} : {
  setId,
  title: String(all[setId].title),
  year: String(all[setId].year || ''),
  unit: String(all[setId].unit || ''),
  questions: all[setId].questions.map((q) => {
    const o = { qid: String(q.qid), text: String(q.text), marks: Number(q.marks) };
    if (q.blocks) o.blocks = JSON.parse(JSON.stringify(q.blocks));
    return o;
  })
});
const data = { v: 1, sets };

// Only these fields, ever.
const fail = (m) => { console.error('FAIL ' + m); process.exit(1); };

// Blocks (drawn by shared/exam-question.js): each type may carry only its own fields, of the right kind. A blank the
// student works out is null (truth table) or simply absent (register bits, the sum's carry row and answer boxes), so
// there is nowhere for an answer to sit; and no answer-like field name may appear anywhere inside.
const ANSWER_KEYS = /^(model|ms|points|reveal|fallback|check|answer|answers|solution|correct|key|result|sum|carries|how|howText|guidance|adaptNote|markBy)$/i;
const isStr = (v) => typeof v === 'string';
const strs = (v) => Array.isArray(v) && v.every(isStr);
const BLOCKS = {
  para: { text: isStr },
  table: { head: strs, rows: (v) => Array.isArray(v) && v.every(strs), caption: isStr,
    highlight: (v) => Array.isArray(v) && v.every((x) => Array.isArray(x) && x.length === 2 && x.every(Number.isInteger)) },
  truthTable: { inputs: strs, outputs: strs, caption: isStr,
    rows: (v) => Array.isArray(v) && v.every((r) => Array.isArray(r) && r.every((c) => c === 0 || c === 1 || c === null)) },
  gate: { gate: (v) => /^(NOT|AND|OR|NAND|NOR|XOR)$/.test(v), inputs: strs, output: isStr, showName: (v) => v === true },
  register: { bits: (v) => /^[01]{4,16}$/.test(v), size: (v) => v === 8 || v === 16, caption: isStr,
    heads: (v) => v === 'tc' || v === 'bin' || (Array.isArray(v) && v.every(Number.isFinite)) },
  sum: { rows: (v) => Array.isArray(v) && v.length >= 2 && v.every((r) => /^[01]{1,16}$/.test(r)), carry: (v) => v === true, boxes: (v) => v === true },
  code: { lines: strs, lang: (v) => v === 'python' || v === 'pseudocode', numbered: (v) => v === true },
  options: { items: (v) => strs(v) && v.length >= 2 && v.length <= 8 },
  tickGrid: { head: (v) => strs(v) && v.length >= 2, rows: (v) => Array.isArray(v) && v.length >= 1 && v.every((r) => strs(r) && r.length >= 1), caption: isStr },
  line: { label: isStr },
  lines: { rows: (v) => Number.isInteger(v) && v >= 1 && v <= 8 }
};
const REQUIRED = { para: ['text'], table: ['head', 'rows'], truthTable: ['inputs', 'outputs', 'rows'], gate: ['gate'], register: [], sum: ['rows'], code: ['lines'], options: ['items'], tickGrid: ['head', 'rows'], line: [], lines: [] };
function walkKeys(v, where) {
  if (Array.isArray(v)) v.forEach((x) => walkKeys(x, where));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) { if (ANSWER_KEYS.test(k)) fail(where + ' has an answer-like field "' + k + '" in its blocks'); walkKeys(v[k], where); }
}
// The answers the server keeps for a question (the final bits, the sum and its carries): none may appear in its blocks.
function answersOf(q) {
  const out = [], add = (v) => { if (v != null && String(v).trim().length >= 4) out.push(String(v).trim()); };
  add((q.check || {}).bin);
  if (q.add) { add(q.add.sum); add(q.add.carries); }
  return out;
}
function checkBlocks(q, srcQ) {
  if (!Array.isArray(q.blocks) || !q.blocks.length) fail(q.qid + ' blocks must be a non-empty list');
  walkKeys(q.blocks, q.qid);
  q.blocks.forEach((b, i) => {
    const where = q.qid + ' block ' + i + ' (' + (b && b.type) + ')';
    const spec = b && BLOCKS[b.type];
    if (!spec) fail(where + ': unknown block type');
    for (const k of Object.keys(b)) if (k !== 'type' && !(k in spec)) fail(where + ': field "' + k + '" is not allowed');
    for (const k of Object.keys(b)) if (k !== 'type' && !spec[k](b[k])) fail(where + ': bad ' + k);
    for (const k of REQUIRED[b.type]) if (!(k in b)) fail(where + ': needs ' + k);
    if (b.type === 'truthTable' && b.rows.some((r) => r.length !== b.inputs.length + b.outputs.length)) fail(where + ': row length');
    if (b.type === 'truthTable' && b.rows.some((r) => r.slice(0, b.inputs.length).includes(null))) fail(where + ': input cells cannot be blank');
    if (b.type === 'register' && b.bits && b.size && b.bits.length !== b.size) fail(where + ': bits and size differ');
    if (b.type === 'tickGrid' && b.rows.some((r) => r.length >= b.head.length)) fail(where + ': every row needs at least one tick column');
  });
  const blob = JSON.stringify(q.blocks);
  for (const a of answersOf(srcQ)) if (blob.includes(a)) fail(q.qid + ' blocks contain the answer ' + a);
  // A truth table's blank output cells stand for the answer: a table may not be all blank in one column and also spell
  // that column out somewhere else in the blocks (for example as a para or table cell).
  for (const b of q.blocks.filter((x) => x.type === 'truthTable')) {
    const n = b.inputs.length;
    for (let c = n; c < n + b.outputs.length; c++) {
      if (!b.rows.every((r) => r[c] === null)) continue;
      const strings = [];
      JSON.parse(blob, (k, v) => { if (typeof v === 'string') strings.push(v); return v; });
      const m = String(srcQ.model || '').match(/\b[01]{3,}\b/g) || [];
      if (m.some((bits) => bits.length === b.rows.length && strings.some((s) => s.includes(bits)))) fail(q.qid + ' blocks spell out a blank truth table column');
    }
  }
}
if (Object.keys(data).join() !== 'v,sets') fail('top-level fields');
const qids = new Set();
const realSets = sets.filter((s) => !s.qids);
for (const s of sets.filter((x) => x.qids)) {
  if (Object.keys(s).join() !== 'setId,title,year,unit,questions,qids' || s.questions.length) fail(s.setId + ' combined set fields');
  if (!/^Year (6|7|8|9|10|11)$/.test(s.year) || !s.unit) fail(s.setId + ' needs year and unit');
  if (!s.qids.length) fail(s.setId + ' has no questions');
  for (const qid of s.qids) if (!realSets.some((r) => r.questions.some((q) => q.qid === qid))) fail(s.setId + ' lists ' + qid + ', which no set has');
}
for (const s of realSets) {
  if (Object.keys(s).join() !== 'setId,title,year,unit,questions') fail(s.setId + ' set fields');
  // Every set is grouped by year and unit in the games' topic pickers.
  if (!/^Year (6|7|8|9|10|11)$/.test(s.year)) fail(s.setId + ' needs year: \'Year 7\' to \'Year 11\' (got "' + s.year + '")');
  if (!s.unit) fail(s.setId + ' needs unit');
  if (!s.questions.length) fail(s.setId + ' has no questions');
  for (const q of s.questions) {
    const keys = Object.keys(q).join();
    if (keys !== 'qid,text,marks' && keys !== 'qid,text,marks,blocks') fail(q.qid + ' fields');
    if (q.blocks) checkBlocks(q, all[s.setId].questions.find((x) => x.qid === q.qid));
    if (!q.qid || !q.text || !(q.marks >= 1)) fail(q.qid + ' empty qid, text or marks');
    if (qids.has(q.qid)) fail(q.qid + ' duplicate qid');
    qids.add(q.qid);
  }
}
// The texts must not carry an answer either: no mark scheme or model answer text from the server appears in the file.
const json = JSON.stringify(data);
for (const s of Object.values(all)) for (const q of s.questions) {
  for (const k of ['ms', 'model', 'fallback', 'howText', 'adaptNote']) {
    const v = typeof q[k] === 'string' ? q[k].trim() : '';
    if (v.length > 40 && !q.text.includes(v) && json.includes(JSON.stringify(v).slice(1, -1))) fail(q.qid + ' ' + k + ' found in the file');
  }
}

// Notes of ours are never shown: no adaptNote text and no '(adapted' in anything students see.
for (const s of Object.values(all)) for (const q of s.questions) if (q.adaptNote && json.includes(JSON.stringify(String(q.adaptNote)).slice(1, -1))) fail(q.qid + ' adaptNote found in the file');
if (/\(adapted/i.test(json)) fail('a question shows an (adapted ...) note: move it to adaptNote');

const text = JSON.stringify(data, null, 1) + '\n';
const g = crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
const client = fs.readFileSync(CLIENT, 'utf8');
const clientNext = client.replace(/var QFILE_G = '[0-9a-f]*';/, `var QFILE_G = '${g}';`);
if (!/var QFILE_G = '/.test(client)) fail('QFILE_G not found in shared/exam-game-client.js');
const count = sets.reduce((n, s) => n + s.questions.length, 0);

if (check) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (cur !== text) fail('shared/exam-game-questions.json does not match the server sets. Run: node tools/build_exam_game_questions.mjs');
  if (clientNext !== client) fail('QFILE_G in shared/exam-game-client.js is not ' + g + '. Run: node tools/build_exam_game_questions.mjs');
  console.log(`up to date: ${sets.length} sets, ${count} questions (g=${g})`);
} else {
  fs.writeFileSync(OUT, text);
  if (clientNext !== client) fs.writeFileSync(CLIENT, clientNext);
  console.log(`wrote shared/exam-game-questions.json: ${sets.length} sets, ${count} questions (g=${g})`);
}
