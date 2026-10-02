// Builds LessonData/y9-2-3-arrays.json: Year 9, 2.3 Data Types and Arrays, and registers it in the Year 9
// "Algorithm Design and Text Programming" unit after 2.2.
//   node tools/build_y9_2_3.mjs
// Objectives (Term 1a plan): identify and describe the Integer, Real, Character, String and Boolean data types;
// explain the purpose of a one-dimensional array; access data from an array using a text-based language
// (9P.01, 9P.02, 9P.04). Only what Year 9 has met: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT and
// IF ... THEN ... ENDIF, with IF ... THEN on one line. No STEP, MOD, DIV, WHILE or REPEAT. Arrays start at index 1.
// EAL-light shape (James, 2026-09-30): short sentences, a teacher-only Think, Pair, Share under every heading,
// predict-then-reveal, compare slides. Do Now: a Unit 1 question and a 2.2 loop question, then the Do Now Extension
// drill (James, 2026-10-02). The data type questions are real and cited; the array questions are written in 0478
// style with no citation (James agreed for Year 9, 2026-09-28). Activities: a Trace Tables trace of an array total,
// and the y9-2-3-code drill. Plenary: the y9-2-3-arrays drill.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-2-3-arrays';
const P = 'y9l23';
const A = '&larr;';
const ARROW = '\\s*(<-|\u2190)\\s*';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&(?!(larr|nbsp|amp|lt|gt);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);

function codeBlock(lines, numbered = false) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = esc(l.trim()).replace(/&amp;larr;/g, A).replace(/&lt;-/g, A);
    const num = numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : '';
    return '<div class="lesson-code-line">' + num + '&nbsp;'.repeat(lead) + text + '</div>';
  }).join('') + '</div>';
}
// An array drawn as two rows: the index above, the value below.
const cell = 'padding:5px 12px;text-align:center;font:700 17px var(--font-mono, monospace)';
function arrayTable(name, values) {
  return `<p style="margin:0 0 6px"><strong>${name}</strong></p><table class="donow-table" style="margin:0 0 4px">` +
    `<tr><th style="${cell};text-align:left">Index</th>${values.map((v, i) => `<td style="${cell};color:var(--muted)">${i + 1}</td>`).join('')}</tr>` +
    `<tr><th style="${cell};text-align:left">Value</th>${values.map((v) => `<td style="${cell}">${v}</td>`).join('')}</tr></table>`;
}
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%">' +
  '<tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';

const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ = null, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, heading, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`, items };
}
function selfMarked(id, label, heading, lead, items, whyQ) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const num = (n, unit = '') => `^\\s*${n}${unit ? `(\\s*${unit})?` : ''}\\s*\\.?\\s*$`;
const T5 = {
  INTEGER: '^\\s*(integer|int)\\s*\\.?\\s*$', REAL: '^\\s*(real|float)\\s*\\.?\\s*$', CHAR: '^\\s*(char|character)\\s*\\.?\\s*$',
  STRING: '^\\s*(string|str)\\s*\\.?\\s*$', BOOLEAN: '^\\s*(boolean|bool)\\s*\\.?\\s*$',
};
const steps = [];

// ---------------------------------------------------------------- Do Now (Unit 1 and 2.2) and its extension
steps.push({ id: 'do-now', label: 'Do Now: Question 1', type: 'exam-do-now', questionSetKey: 'y10-1-1-l3-2',
  content: '<h2 class="lesson-h2">Do Now</h2>' + why('Why do we use hexadecimal at all?', 'It is shorter than binary, so it is easier for people to read and copy.') +
    '<p class="lesson-lead">A recap question from Number Systems: hexadecimal.</p><div id="donow-root"></div>' });
const DN_PROG = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 2 TO 5', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
steps.push(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: Loops', 'From 2.2 Loops. Use this program for both parts.', [
  { label: 'How many times does the loop run?', answer: num(4, 'times?'), feedback: 'List the values Count takes, from the number after the arrow to the number after TO.' },
  { label: 'What does the program output?', answer: num(14), feedback: 'Total starts at 0. On each pass, add the value of Count onto Total.' },
], ['Why does Total &larr; 0 go before the loop?', 'So it is set only once. Inside the loop, Total would go back to 0 on every pass.'], codeBlock(DN_PROG)));
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-2-3-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from Number Systems and 2.2 Loops. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Data Types and Arrays',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithm Design and Text Programming</p><h2 class="lesson-h2">Data Types and Arrays</h2><p>Year 9, 2.3</p></div>' +
    facts(['<strong>Today:</strong> every value has a <strong>data type</strong>. Then: one name that stores <strong>many</strong> values.',
      '<strong>You already know:</strong> DECLARE, variables and FOR loops.',
      '<strong>Activities:</strong> trace a program in a trace table, then write your own code.']) +
    why('DECLARE Count : INTEGER. Why does the line say INTEGER?', 'It tells the computer what kind of value Count stores: whole numbers.') });

// ---------------------------------------------------------------- data types: predict then reveal
steps.push({ id: 'types', label: 'The Five Data Types',
  content: '<h2 class="lesson-h2">The Five Data Types</h2>' +
    tps('Predict: which type is best for 3.75? For \'Y\'? Why not INTEGER for both?',
      '<p>3.75 is <strong>REAL</strong>: it has a decimal point. \'Y\' is <strong>CHAR</strong>: one character.</p><p>INTEGER only stores whole numbers.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A <strong>data type</strong> is the kind of value a variable stores.</p>' +
    table([
      ['<strong>INTEGER</strong>', 'a whole number', '16, 25, -3'],
      ['<strong>REAL</strong>', 'a number with a decimal point', '3.75, 1.68'],
      ['<strong>CHAR</strong>', 'one character', '\'Y\', \'A\', \'7\''],
      ['<strong>STRING</strong>', 'many characters', '"Mai", "Room12"'],
      ['<strong>BOOLEAN</strong>', 'TRUE or FALSE', 'TRUE, FALSE'],
    ], ['Type', 'It stores', 'Examples']) });

steps.push(mcStep('types-check', 'Exam Question: Tick the Type', 'Exam Question: Tick the Type',
  'Cambridge IGCSE 0478/22, June 2026, Question 2 and 0478/23, June 2026, Question 2.', [
    { prompt: 'A programming data type used to store a single letter, symbol or number input from the keyboard', options: ['Boolean', 'char', 'integer', 'real'], correct: 1,
      explain: 'char stores one character: one letter, one symbol or one digit.' },
    { prompt: 'A programming data type used to store any combination of letters and numbers', options: ['char', 'Boolean', 'string', 'real'], correct: 2,
      explain: 'string stores many characters, letters and numbers together.' },
  ], ['Why is \'7\' a CHAR here, not an INTEGER?', 'It is one key from the keyboard, stored as a character. We are not doing maths with it.']));

steps.push({ id: 'compare-types', label: 'Compare: Same Digits, Different Types',
  content: '<h2 class="lesson-h2">Compare: Same Digits, Different Types</h2>' +
    tps('Both store 16. What is different? Which one can you do maths with?',
      '<p>A stores the <strong>number</strong> 16, so Age + 1 is 17.</p><p>B stores the <strong>text</strong> "16": two characters. You cannot do maths with it.</p>') +
    columns('<p style="margin:0 0 6px;font-weight:700;text-align:center">A: an age</p>' + codeBlock(['DECLARE Age : INTEGER', 'Age <- 16']),
      '<p style="margin:0 0 6px;font-weight:700;text-align:center">B: a room name</p>' + codeBlock(['DECLARE Room : STRING', 'Room <- "16"'])) });

steps.push(checkStep('types-table', 'Exam Question: Choose the Types', 'Exam Question: Choose the Types',
  'Cambridge IGCSE 0478/21, June 2026, Question 3. Write the best data type for each variable.', [
    { label: 'Age: the age of the student, for example 16', answer: T5.INTEGER, feedback: 'Is 16 a whole number, or does it have a decimal point?' },
    { label: 'TelephoneNumber: for example +44 7846398573', answer: T5.STRING, feedback: 'Look at the + and the space. Can a number type hold them?' },
    { label: 'Teenager: whether the student is a teenager, for example TRUE', answer: T5.BOOLEAN, feedback: 'How many different values can it have?' },
  ], ['Why is the telephone number not an INTEGER?', 'It has a + and a space. And we never do maths with a telephone number.']));

// ---------------------------------------------------------------- why arrays: compare, predict then reveal
steps.push({ id: 'array-why', label: 'Why Arrays?',
  content: '<h2 class="lesson-h2">Why Arrays?</h2>' +
    tps('Predict: you need to store 30 marks. How many DECLARE lines would A need? How many does B need?',
      '<p>A needs <strong>30</strong> DECLARE lines, one for each mark.</p><p>B needs <strong>one</strong>: ARRAY[1:30].</p>', 'Show the worked answer') +
    columns('<p style="margin:0 0 6px;font-weight:700;text-align:center">A: separate variables</p>' + codeBlock(['DECLARE Mark1 : INTEGER', 'DECLARE Mark2 : INTEGER', 'DECLARE Mark3 : INTEGER', 'DECLARE Mark4 : INTEGER']),
      '<p style="margin:0 0 6px;font-weight:700;text-align:center">B: one array</p>' + codeBlock(['DECLARE Marks : ARRAY[1:4] OF INTEGER']) +
      facts(['An <strong>array</strong> is one name that stores many values.', 'Every value has the <strong>same data type</strong>: OF INTEGER.'])) });

// ---------------------------------------------------------------- index and element: predict then reveal
const MARKS = [6, 3, 8, 5];
steps.push({ id: 'array-index', label: 'Index and Element',
  content: '<h2 class="lesson-h2">Index and Element</h2>' +
    tps('Predict: what is Marks[3]? Is the 3 a mark, or a position?',
      '<p>Marks[3] is <strong>8</strong>.</p><p>The 3 is a <strong>position</strong>: go to index 3 and read the value there.</p>', 'Show the worked answer') +
    columns(codeBlock(['DECLARE Marks : ARRAY[1:4] OF INTEGER']) + arrayTable('Marks', MARKS),
      facts(['Each value in an array is an <strong>element</strong>.', 'Its position number is its <strong>index</strong>. The first index is 1.',
        '<strong>Marks[3]</strong> means the element at index 3.', '[1:4] gives the first and last index: 4 elements.'])) });

steps.push({ id: 'compare-index', label: 'Compare: Index or Value?',
  content: '<h2 class="lesson-h2">Compare: Index or Value?</h2>' +
    tps('Predict what A, B and C output. Why are B and C different?',
      '<p><strong>A:</strong> Marks[3] is <strong>8</strong>.</p><p><strong>B:</strong> 8 + 1 = <strong>9</strong>. The 1 is added to the value.</p><p><strong>C:</strong> 3 + 1 = 4, so it outputs Marks[4]: <strong>5</strong>. The 1 is added to the index.</p>') +
    arrayTable('Marks', MARKS) +
    '<div class="lesson-do-now-columns" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
    [['A', 'OUTPUT Marks[3]'], ['B', 'OUTPUT Marks[3] + 1'], ['C', 'OUTPUT Marks[3 + 1]']].map(([k, l]) =>
      `<div><p style="margin:0 0 6px;font-weight:700;text-align:center">${k}</p>${codeBlock([l])}</div>`).join('') + '</div>' });

const NAMES = ['"Ali"', '"Mai"', '"Ben"', '"Joy"', '"Sam"'];
steps.push(checkStep('array-check', 'Check: Read the Array', 'Check: Read the Array', '', [
  { label: 'What does OUTPUT Names[2] output?', answer: '^\\s*["\']?\\s*mai\\s*["\']?\\s*\\.?\\s*$', feedback: 'Go to index 2 in the top row and read the value under it.' },
  { label: 'Which index holds "Joy"?', answer: num(4, '(index)?'), feedback: 'Find "Joy" in the bottom row, then read the number above it.' },
  { line: true, label: 'Write the line that outputs "Sam".', answer: '^\\s*output\\s+names\\s*\\[\\s*5\\s*\\]\\s*$', feedback: 'OUTPUT, the array name, then the index in square brackets.' },
  { label: 'What data type is each element?', answer: T5.STRING, feedback: 'Read the end of the DECLARE line.' },
], ['Why is the answer to (c) not OUTPUT "Sam"?', 'Both show Sam. But Names[5] reads the array, so it still works if the name at index 5 changes.'],
  codeBlock(['DECLARE Names : ARRAY[1:5] OF STRING']) + arrayTable('Names', NAMES)));

// ---------------------------------------------------------------- loops and arrays: predict then reveal
steps.push({ id: 'array-loop', label: 'Loops and Arrays',
  content: '<h2 class="lesson-h2">Loops and Arrays</h2>' +
    tps('Predict: Index goes 1, 2, 3, 4. What does this program output?',
      '<p>6, then 3, then 8, then 5.</p><p>On each pass, Index is the next position, so Marks[Index] is the next element.</p>', 'Show the worked answer') +
    columns(codeBlock(['DECLARE Index : INTEGER', 'FOR Index <- 1 TO 4', '    OUTPUT Marks[Index]', 'NEXT Index']) + arrayTable('Marks', MARKS),
      facts(['The loop counter is used as the <strong>index</strong>.', 'Each pass visits the <strong>next element</strong>.', 'The same three lines work for 4 elements or 400: change the number after TO.'])) });

// ---------------------------------------------------------------- activity 1: trace an array total
const SCORES = [7, 2, 9, 4];
steps.push({ id: 'activity-1', label: 'Activity 1: Trace an Array', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Adding Up an Array',
    context: 'The array Scores is already filled: Scores[1] = 7, Scores[2] = 2, Scores[3] = 9, Scores[4] = 4. Complete the trace table.',
    code: ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total = 0', 'for Index in range(1, 5):', '    Total = Total + Scores[Index]', 'print(Total)'],
    cols: ['Line', 'Total', 'Index', 'Output'],
    answers: [
      { Line: '3', Total: '0', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '1', Output: '' }, { Line: '5', Total: '7', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '2', Output: '' }, { Line: '5', Total: '9', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '3', Output: '' }, { Line: '5', Total: '18', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '4', Output: '' }, { Line: '5', Total: '22', Index: '', Output: '' },
      { Line: '6', Total: '', Index: '', Output: '22' },
    ],
  },
  content: `<h2 class="lesson-h2">Activity 1: Trace an Array</h2>` +
    why('Why does Total go up by a different amount on each pass?', 'Each pass adds a different element: Scores[1], then Scores[2], then Scores[3], then Scores[4].') +
    `<p class="lesson-lead">Fill in a row whenever a variable changes or something is output.</p><div id="${P}-embed-1" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- exam-style questions (0478 style, uncited)
const TEMPS = ['31.5', '33.0', '30.5', '34.0', '32.5', '29.5', '31.0'];
steps.push(checkStep('exam-temps', 'Exam-Style Question: Temperatures', 'Exam-Style Question: Temperatures',
  'A program stores the temperature, in &deg;C, at midday for each day of one week.', [
    { label: 'How many elements does Temps have?', answer: num(7, '(elements?)?'), feedback: 'Look at [1:7] in the DECLARE line.' },
    { label: 'Give the data type of each element.', answer: T5.REAL, feedback: 'Look at the values. Do they have a decimal point?' },
    { label: 'What is the value of Temps[4]?', answer: '^\\s*34(\\.0)?\\s*(&deg;|°)?\\s*c?\\s*$', feedback: 'Go to index 4 and read the value there.' },
    { line: true, label: 'Write the line that outputs the temperature for day 6.', answer: '^\\s*output\\s+temps\\s*\\[\\s*6\\s*\\]\\s*$', feedback: 'Day 6 is index 6. OUTPUT, the name, then the index in square brackets.' },
  ], ['Why is each element REAL and not INTEGER?', 'The temperatures have a decimal point, such as 31.5.'],
  codeBlock(['DECLARE Temps : ARRAY[1:7] OF REAL']) + arrayTable('Temps', TEMPS)));
steps.push(selfMarked('exam-purpose', 'Exam-Style Question: Why Use an Array?', 'Exam-Style Question: Why Use an Array?',
  'The program could use seven separate variables, one for each day, instead of the array Temps.', [
    { id: 'array-purpose', prompt: 'Explain the purpose of an array. [2]', marks: 2,
      modelAnswer: 'An array stores many values of the same data type under one name (identifier). Each value is found by its index, so a loop can visit every value with very little code.' },
  ], ['This question has 2 marks. What two ideas do you need?', 'What an array stores (many values, one name, same data type), and why that helps (an index, so a loop can visit every value).']));

// ---------------------------------------------------------------- activity 2: write array code (code drill)
steps.push(embed('activity-2', 'Activity 2: Write the Array Code', 'drill-y9-2-3-code', 'Activity 2: Write the Array Code',
  'Write each program in Cambridge pseudocode. The array is already filled. Your code is run and checked straight away.',
  ['Why are the numbers in the array different every time?', 'So your code must read the array. Typing the answer number will not work.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Data Types and Arrays Drill', 'drill-y9-2-3-arrays', 'Plenary: Data Types and Arrays Drill',
  'Data types, what an array is for, reading an array by its index, and loops over an array. Your progress is saved.',
  ['Why practise with new arrays every time?', 'If you can read any array, you really understand indexes.']));

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now-2', 0, '4') && V('do-now-2', 0, '4 times') && !V('do-now-2', 0, '5') && V('do-now-2', 1, '14') && !V('do-now-2', 1, '15'), 'do-now-2');
assert(V('types-table', 0, 'integer') && V('types-table', 1, 'String') && V('types-table', 2, 'BOOLEAN') && !V('types-table', 1, 'integer'), 'types-table');
assert(V('array-check', 0, 'Mai') && V('array-check', 0, '"Mai"') && !V('array-check', 0, 'Ben') && V('array-check', 1, '4') && V('array-check', 2, 'OUTPUT Names[5]') && !V('array-check', 2, 'OUTPUT "Sam"') && V('array-check', 3, 'string'), 'array-check');
assert(V('exam-temps', 0, '7') && V('exam-temps', 1, 'real') && V('exam-temps', 2, '34.0') && V('exam-temps', 2, '34') && !V('exam-temps', 2, '32.5') && V('exam-temps', 3, 'output temps[6]') && !V('exam-temps', 3, 'output temps[5]'), 'exam-temps');
// The worked answers: the Do Now loop adds 2 + 3 + 4 + 5 over 4 passes; Marks[3] = 8, Marks[3] + 1 = 9, Marks[4] = 5;
// Names[2] = "Mai", "Joy" is at index 4, "Sam" at 5; the Scores trace runs 7, 9, 18, 22; Temps[4] = 34.0.
assert([2, 3, 4, 5].reduce((a, b) => a + b) === 14, 'do-now total');
assert(MARKS[2] === 8 && MARKS[2] + 1 === 9 && MARKS[3] === 5, 'compare');
assert(NAMES[1] === '"Mai"' && NAMES.indexOf('"Joy"') + 1 === 4 && NAMES.indexOf('"Sam"') + 1 === 5, 'names');
{ let t = 0; const run = SCORES.map((s) => (t += s)); assert(run.join() === '7,9,18,22', 'scores trace'); }
assert(TEMPS[3] === '34.0' && TEMPS.length === 7, 'temps');

const lesson = { id: ID, label: '2.3: Data Types and Arrays', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 9, after 2.2 in the Algorithm Design and Text Programming unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y9 = all.years.find((y) => y.id === 'year9');
let unit = y9.units.find((u) => u.title === 'Algorithm Design and Text Programming');
if (!unit) { unit = { code: '', title: 'Algorithm Design and Text Programming', lessons: [] }; y9.units.push(unit); }
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; unit: ${unit.lessons.join(', ')}`);
