// Builds shared/exam-game-questions.json: the Exam Game question texts, so a game (TowerDefence/) shows a round at once
// instead of asking the server. Reads the shell's ExamGame.gs and ExamGameSet*.gs in a node vm, as its tests do.
// ONLY { setId, title, questions: [{ qid, text, marks }] } is written: mark schemes, model answers, checks, points,
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

const sets = listed.map(({ setId }) => ({
  setId,
  title: String(all[setId].title),
  questions: all[setId].questions.map((q) => ({ qid: String(q.qid), text: String(q.text), marks: Number(q.marks) }))
}));
const data = { v: 1, sets };

// Only these fields, ever.
const fail = (m) => { console.error('FAIL ' + m); process.exit(1); };
if (Object.keys(data).join() !== 'v,sets') fail('top-level fields');
const qids = new Set();
for (const s of sets) {
  if (Object.keys(s).join() !== 'setId,title,questions') fail(s.setId + ' set fields');
  if (!s.questions.length) fail(s.setId + ' has no questions');
  for (const q of s.questions) {
    if (Object.keys(q).join() !== 'qid,text,marks') fail(q.qid + ' fields');
    if (!q.qid || !q.text || !(q.marks >= 1)) fail(q.qid + ' empty qid, text or marks');
    if (qids.has(q.qid)) fail(q.qid + ' duplicate qid');
    qids.add(q.qid);
  }
}
// The texts must not carry an answer either: no mark scheme or model answer text from the server appears in the file.
const json = JSON.stringify(data);
for (const s of Object.values(all)) for (const q of s.questions) {
  for (const k of ['ms', 'model', 'fallback', 'howText']) {
    const v = typeof q[k] === 'string' ? q[k].trim() : '';
    if (v.length > 40 && !q.text.includes(v) && json.includes(JSON.stringify(v).slice(1, -1))) fail(q.qid + ' ' + k + ' found in the file');
  }
}

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
