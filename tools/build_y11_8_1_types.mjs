// Builds LessonData/y11-8-1-types.json: Year 11, 8.1 L2: Data Types, Input and Output, rebuilt from scratch for a
// low-ability, mostly EAL class (James, 2026-10-01), replacing the older combined lesson y11-8-1-l1 in the menu.
//   node tools/build_y11_8_1_types.mjs
// The five data types, the real June 2026 data-type questions, INPUT, OUTPUT and sequence. Plenary drill: y11-8-1-types.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-8-1-types';
const P = 'y11ty';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A boxed program; numbered adds line numbers.
const code = (lines, numbered = false) => '<div class="lesson-code">' +
  lines.map((l, i) => `<div class="lesson-code-line">${numbered ? (i + 1) + '&nbsp;&nbsp;' : ''}${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length))}</div>`).join('') + '</div>';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '', why = null) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} mark${parts.length > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (why ? tps(why[0], `<p>${why[1]}</p>`) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
function mcStep(id, label, heading, lead, items, why = null) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (why ? tps(why[0], `<p>${why[1]}</p>`) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`,
    items };
}
const num = (n) => `^\\s*${String(n).replace('.', '\\.')}\\s*$`;
const VARW = '^\\s*(an?\\s+)?variables?\\s*\\.?\\s*$';
const CONW = '^\\s*(an?\\s+)?constants?\\s*\\.?\\s*$';
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

const steps = [];

const T5 = {
  INTEGER: '^\\s*(an?\\s+)?integers?\\s*$', REAL: '^\\s*(an?\\s+)?real(\\s+number)?\\s*$', CHAR: '^\\s*(an?\\s+)?(char|character)s?\\s*$',
  STRING: '^\\s*(an?\\s+)?strings?\\s*$', BOOLEAN: '^\\s*(an?\\s+)?boolean\\s*$',
};
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%"><tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';

// ---------------------------------------------------------------- Do Now (8.1 L1 and Unit 7)
steps.push(checkStep('do-now', 'Do Now: Variables and Constants (1 of 2)', 'Do Now: Variables and Constants (1 of 2)', 'From last lesson. Write <strong>variable</strong> or <strong>constant</strong>.', [
  { label: 'The number of seconds in a minute: 60', answer: CONW, feedback: 'Does it ever change?' },
  { label: 'A player\'s score in a game', answer: VARW, feedback: 'Does it stay the same while the game runs?' },
  { line: true, label: 'Write the line that makes a constant called MaxLives with the value 3', answer: '^\\s*CONSTANT\\s+MaxLives\\s*(<-|\\u2190|=)\\s*3\\s*$', feedback: 'CONSTANT, the name, an arrow, the value.' },
], '', ['Why is a score a variable?', 'It changes while the game runs.']));
{
  const prog = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 10', 'FOR Count <- 1 TO 2', '  Total <- Total - 3', 'NEXT Count', 'OUTPUT Total'];
  steps.push(checkStep('do-now-2', 'Do Now: Trace (2 of 2)', 'Do Now: Trace (2 of 2)', 'From Unit 7. Trace the program.', [
    { label: 'What is output?', answer: num(4), feedback: 'Total starts at 10. Take 3 away each time the loop runs.' },
  ], code(prog, true), ['Why does line 1 say INTEGER?', 'Total only ever holds whole numbers.']));
}

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Data Types, Input and Output',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">8.1 Programming Concepts</p><h2 class="lesson-h2">Data Types, Input and Output</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> every variable has a <strong>data type</strong>: the kind of value it stores.', '<strong>Then:</strong> INPUT puts a typed value in a variable. OUTPUT shows it.']) +
    tps('Why does a program need to know what kind of value it stores?', '<p>So it knows what it can do with it. You can add two numbers, but not two names.</p>') });

// ---------------------------------------------------------------- the five types: predict then reveal
steps.push({ id: 'types', label: 'The Five Data Types',
  content: '<h2 class="lesson-h2">The Five Data Types</h2>' +
    tps('Predict: which type is best for 3.75? For \'Y\'? Why not INTEGER for both?', '<p>3.75 is <strong>REAL</strong>: it has a decimal point. \'Y\' is <strong>CHAR</strong>: one character.</p><p>INTEGER only stores whole numbers.</p>', 'Show the worked answer') +
    table([
      ['<strong>INTEGER</strong>', 'a whole number', '16, 25, -3'],
      ['<strong>REAL</strong>', 'a number with a decimal point', '3.75, 1.68'],
      ['<strong>CHAR</strong>', 'one character', '\'Y\', \'A\', \'7\''],
      ['<strong>STRING</strong>', 'many characters', '"Muhammed", "Room12"'],
      ['<strong>BOOLEAN</strong>', 'TRUE or FALSE', 'TRUE'],
    ], ['Type', 'It stores', 'Examples']) });

steps.push(mcStep('types-check', 'Check: Tick the Type', 'Check: Tick the Type', 'Cambridge IGCSE 0478/22, June 2026, Question 2 and 0478/23, June 2026, Question 2.', [
  { prompt: 'A programming data type used to store a single letter, symbol or number input from the keyboard', options: ['Boolean', 'char', 'integer', 'real'], correct: 1,
    explain: 'char stores one character: one letter, one symbol or one digit.' },
  { prompt: 'A programming data type used to store any combination of letters and numbers', options: ['char', 'Boolean', 'string', 'real'], correct: 2,
    explain: 'string stores many characters, letters and numbers together.' },
], ['Why is \'7\' a CHAR here and not an INTEGER?', 'It is one key from the keyboard, stored as a character. We are not doing maths with it.']));

// ---------------------------------------------------------------- compare
steps.push({ id: 'compare', label: 'Compare: Same Digits, Different Types',
  content: '<h2 class="lesson-h2">Compare: Same Digits, Different Types</h2>' +
    tps('Both store 16. What is different? Which one can you do maths with?',
      '<p>A stores the <strong>number</strong> 16, so A + 1 is 17.</p><p>B stores the <strong>text</strong> "16", two characters. You cannot do maths with it.</p>') +
    columns('<p style="margin:0 0 6px;font-weight:700;text-align:center">A: an age</p>' + code(['DECLARE Age : INTEGER', 'Age <- 16']),
      '<p style="margin:0 0 6px;font-weight:700;text-align:center">B: a room name</p>' + code(['DECLARE Room : STRING', 'Room <- "16"'])) });

// ---------------------------------------------------------------- activity 1: the real exam table
steps.push(checkStep('student-table', 'Your Turn: Choose the Types', 'Your Turn: Choose the Types', 'Cambridge IGCSE 0478/21, June 2026, Question 3. Write the best data type for each variable.', [
  { label: 'Age: the age of the student, for example 16', answer: T5.INTEGER, feedback: 'Is 16 a whole number, or does it have a decimal point?' },
  { label: 'TelephoneNumber: for example +44 7846398573', answer: T5.STRING, feedback: 'Look at the + and the space. Can a number type hold them?' },
  { label: 'Teenager: whether the student is a teenager, for example TRUE', answer: T5.BOOLEAN, feedback: 'It can only be TRUE or FALSE.' },
], '', ['Why is the telephone number not an INTEGER?', 'It has a + and a space. We never do maths with a phone number.']));

// ---------------------------------------------------------------- input and output: predict then reveal
steps.push({ id: 'input-output', label: 'INPUT and OUTPUT',
  content: '<h2 class="lesson-h2">INPUT and OUTPUT</h2>' +
    tps('Predict: the user types Mai. What is output? Why is "Hello " in quotes, but Name is not?',
      '<p>Output: <strong>Hello Mai</strong>.</p><p>Text in quotes is shown exactly as it is. A name without quotes is a variable, so its <strong>value</strong> is shown.</p>', 'Show the worked answer') +
    columns(code(['DECLARE Name : STRING', 'INPUT Name', 'OUTPUT "Hello ", Name'], true),
      facts(['<strong>INPUT</strong> takes a value from the user and stores it in a variable.', '<strong>OUTPUT</strong> shows text or a value.', 'The lines run <strong>in order</strong>, one at a time: this is <strong>sequence</strong>.'])) });

// ---------------------------------------------------------------- activity 2: Trace Tables with input
steps.push({ id: 'activity-2', label: 'Activity: Trace a Sequence', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-2`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Lines in Sequence',
    context: 'The lines run in order, one at a time. Complete the trace table.',
    code: ['DECLARE Number : INTEGER', 'DECLARE Answer : INTEGER', 'Number = 6', 'Answer = Number * 2', 'Number = Answer + 1', 'print(Number)'],
    cols: ['Line', 'Number', 'Answer', 'Output'],
    answers: [
      { Line: '3', Number: '6', Answer: '', Output: '' },
      { Line: '4', Number: '', Answer: '12', Output: '' },
      { Line: '5', Number: '13', Answer: '', Output: '' },
      { Line: '6', Number: '', Answer: '', Output: '13' },
    ],
  },
  content: '<h2 class="lesson-h2">Activity: Trace a Sequence</h2>' +
    tps('Line 5 changes Number again. Why is the output 13, not 6?', '<p>The lines run in order. By line 6, line 5 has already put 13 in Number.</p>') +
    `<div id="${P}-embed-2" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- write the lines
steps.push(checkStep('write-lines', 'Your Turn: Write the Lines', 'Your Turn: Write the Lines', 'Type each whole line.', [
  { line: true, label: 'Declare a variable called Price that stores a number with a decimal point', answer: '^\\s*DECLARE\\s+Price\\s*:\\s*REAL\\s*$', feedback: 'DECLARE, the name, a colon, then the type for decimals.' },
  { line: true, label: 'Take a value from the user and store it in Price', answer: '^\\s*INPUT\\s+Price\\s*$', feedback: 'Which keyword takes a value from the user? Then the name.' },
  { line: true, label: 'Show the value of Price', answer: '^\\s*OUTPUT\\s+Price\\s*$', feedback: 'Which keyword shows a value? Then the name.' },
], '', ['Why must the DECLARE line come first?', 'The lines run in order. The variable must exist before INPUT can store a value in it.']));

// ---------------------------------------------------------------- plenary
steps.push({ id: 'plenary', label: 'Plenary: Data Types Drill', type: 'embedded-app', appId: 'drill-y11-8-1-types', embedContainerId: `${P}-plenary`,
  content: '<h2 class="lesson-h2">Plenary: Data Types Drill</h2>' +
    tps('Why practise with new values every time?', '<p>If you can do it with any values, you really understand it.</p>') +
    `<p class="lesson-lead">The five types, choosing a type, INPUT and OUTPUT, and writing the lines. Your progress is saved.</p><div id="${P}-plenary"></div>` });

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now', 0, 'constant') && !T('do-now', 0, 'variable') && T('do-now', 1, 'variable'), 'dn');
assert(T('do-now', 2, 'CONSTANT MaxLives <- 3') && !T('do-now', 2, 'MaxLives <- 3'), 'dn line');
assert(T('do-now-2', 0, '4') && !T('do-now-2', 0, '7'), 'dn2');
assert(T('student-table', 0, 'integer') && !T('student-table', 0, 'real') && T('student-table', 1, 'String') && !T('student-table', 1, 'integer') && T('student-table', 2, 'Boolean') && !T('student-table', 2, 'string'), 'table');
assert(T('write-lines', 0, 'DECLARE Price : REAL') && !T('write-lines', 0, 'DECLARE Price : INTEGER') && T('write-lines', 1, 'input price') && !T('write-lines', 1, 'OUTPUT Price') && T('write-lines', 2, 'OUTPUT Price') && !T('write-lines', 2, 'INPUT Price'), 'write');

const lesson = { id: ID, label: '8.1 L2: Data Types, Input and Output', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it as 8.1 L2, in place of the older combined lesson (built from an agent's plan, never planned by James).
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find((y) => y.id === 'year11').units.find((u) => u.code === '8.1');
unit.lessons = unit.lessons.filter((l) => l !== 'y11-8-1-l1');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y11-8-1-vc') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 8.1 is now ${unit.lessons.join(', ')}`);
