// Builds LessonData/y11-8-1-vc.json: Year 11, 8.1 L1: Variables and Constants, the first lesson of 8.1 Programming
// Concepts after the Unit 7 recap, and registers it first in the Year 11 8.1 unit.
//   node tools/build_y11_8_1_vc.mjs
// Written for a low-ability class of mostly EAL learners (James, 2026-09-30 and 2026-10-01): one idea (a named value
// that can change, or cannot), short sentences, predict-then-reveal teaching slides, a teacher-only Think, Pair,
// Share "why" under every heading, and two programs side by side to compare. Plenary drill: y11-8-1-vc.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-8-1-vc';
const P = 'y11vc';
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

// ---------------------------------------------------------------- Do Now (Unit 7)
steps.push(mcStep('do-now', 'Do Now: Iteration (1 of 2)', 'Do Now: Iteration (1 of 2)',
  'From Unit 7. Question 1 is from Cambridge IGCSE 0478/22, June 2026, Question 1.', [
    { prompt: 'Two types of pseudocode statements used for iteration are', options: ['CASE and IF', 'FOR … NEXT and IF', 'FOR … NEXT and WHILE … DO … ENDWHILE', 'REPEAT … UNTIL and CASE'], correct: 2,
      explain: 'FOR and WHILE both repeat lines. IF and CASE make a choice: that is selection.' },
    { prompt: 'Which statement is used for selection?', options: ['FOR … NEXT', 'IF … THEN … ENDIF', 'WHILE … ENDWHILE'], correct: 1,
      explain: 'Selection chooses what to do. IF chooses between paths.' },
  ], ['Why do we have both selection and iteration?', 'Selection chooses what to do. Iteration repeats lines, so we do not have to write them again and again.']));

{
  const prog = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '  Total <- Total + 2', 'NEXT Count', 'OUTPUT Total'];
  steps.push(checkStep('do-now-2', 'Do Now: Trace a Loop (2 of 2)', 'Do Now: Trace a Loop (2 of 2)', 'From Unit 7. Trace the program.', [
    { label: 'How many times does line 5 run?', answer: num(3) + '|^\\s*3\\s*times?\\s*$', feedback: 'Count goes 1, 2, 3. Line 5 runs once for each value.' },
    { label: 'What is output?', answer: num(6), feedback: 'Total starts at 0. Add 2 each time line 5 runs.' },
  ], code(prog, true), ['Why does line 1 say DECLARE?', 'Every variable must be declared before it is used: its name and its data type.']));
}

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Variables and Constants',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">8.1 Programming Concepts</p><h2 class="lesson-h2">Variables and Constants</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> a <strong>variable</strong> is a named value that <strong>can change</strong>. A <strong>constant</strong> is a named value that <strong>cannot change</strong>.',
      '<strong>You will:</strong> trace them, choose between them, and write the lines that make them.',
      '<strong>Think, pair, share:</strong> why do programs give names to values at all?']) });

// ---------------------------------------------------------------- a variable: predict then reveal
steps.push({ id: 'variable', label: 'A Variable',
  content: '<h2 class="lesson-h2">A Variable</h2>' +
    tps('Predict: what is output? Why is Score called a <strong>variable</strong>?',
      '<p>Output: <strong>10</strong>. Score is 0, then 5, then 10.</p><p>Its value <strong>changes</strong> (it <strong>varies</strong>) while the program runs. That is why it is a variable.</p>', 'Show the worked answer') +
    columns(code(['DECLARE Score : INTEGER', 'Score <- 0', 'Score <- Score + 5', 'Score <- Score + 5', 'OUTPUT Score'], true),
      facts(['A <strong>variable</strong> is a <strong>name</strong> for a value.', 'Its value <strong>can change</strong> while the program runs.', '<strong>DECLARE</strong> it first: its name and its data type.', '<code>&lt;-</code> puts a new value in it.'])) });

{
  const prog = ['DECLARE Lives : INTEGER', 'Lives <- 3', 'Lives <- Lives - 1', 'OUTPUT Lives'];
  steps.push(checkStep('variable-check', 'Check: Trace the Variable', 'Check: Trace the Variable', null, [
    { label: 'What is the name of the variable?', answer: '^\\s*lives\\s*$', feedback: 'Look at line 1. The name comes after DECLARE.' },
    { label: 'What is output?', answer: num(2), feedback: 'Lives starts at 3. Line 3 takes 1 away.' },
  ], code(prog, true), ['Why can line 3 change Lives?', 'Lives is a variable. A variable can be given a new value at any time.']));
}

// ---------------------------------------------------------------- a constant: predict then reveal
steps.push({ id: 'constant', label: 'A Constant',
  content: '<h2 class="lesson-h2">A Constant</h2>' +
    tps('Pi is always 3.142. Why make it a <strong>constant</strong>, and not a variable?',
      '<p>Its value must <strong>never change</strong>. As a constant, nothing in the program can change it by mistake.</p><p>If it ever needs a new value, you change <strong>one line</strong>.</p><p>Output: 3.142 &times; 2 &times; 2 = <strong>12.568</strong>.</p>', 'Show the worked answer') +
    columns(code(['CONSTANT Pi <- 3.142', 'DECLARE Radius : REAL', 'DECLARE Area : REAL', 'Radius <- 2', 'Area <- Pi * Radius * Radius', 'OUTPUT Area'], true),
      facts(['A <strong>constant</strong> is a <strong>name</strong> for a value.', 'Its value <strong>cannot change</strong> while the program runs.', 'Make it with <strong>CONSTANT</strong> and give its value once.', 'Use its name, like a variable.'])) });

// ---------------------------------------------------------------- compare
steps.push({ id: 'compare', label: 'Compare: Variable and Constant',
  content: '<h2 class="lesson-h2">Compare: Variable and Constant</h2>' +
    tps('What is the same? What is different? In which program could Price change?',
      '<p><strong>Same:</strong> both store 9.99 in Price. Both output 19.98.</p><p><strong>Different:</strong> A makes Price with DECLARE, so it is a variable. B makes Price with CONSTANT, so it can never change.</p><p>Price could change only in <strong>A</strong>.</p>') +
    columns('<p style="margin:0 0 6px;font-weight:700;text-align:center">Program A</p>' + code(['DECLARE Price : REAL', 'DECLARE Total : REAL', 'Price <- 9.99', 'Total <- Price * 2', 'OUTPUT Total']),
      '<p style="margin:0 0 6px;font-weight:700;text-align:center">Program B</p>' + code(['CONSTANT Price <- 9.99', 'DECLARE Total : REAL', 'Total <- Price * 2', 'OUTPUT Total'])) });

steps.push(mcStep('words-check', 'Check: Which One?', 'Check: Which One?', null, [
  { prompt: 'A named value that can change while the program runs is a', options: ['constant', 'variable', 'keyword'], correct: 1,
    explain: 'A variable can change. A constant cannot.' },
  { prompt: 'Which keyword makes a constant?', options: ['DECLARE', 'OUTPUT', 'CONSTANT'], correct: 2,
    explain: 'CONSTANT Pi <- 3.142 makes a constant. DECLARE makes a variable.' },
], ['Why do both use a name?', 'So the program can use the value again by its name, in many places.']));

// ---------------------------------------------------------------- activity 1: the restaurant (real scenario)
steps.push(checkStep('restaurant', 'Your Turn: The Restaurant', 'Your Turn: The Restaurant',
  'From Cambridge IGCSE 0478/21, November 2025, Question 4(a): a meal for an adult costs $9.99 and a meal for a child costs $6.99. Tables of 6 or more people get a 15% discount. Write <strong>variable</strong> or <strong>constant</strong> for each value.', [
    { label: 'The price of an adult meal, $9.99', answer: CONW, feedback: 'Is it the same for every table?' },
    { label: 'The number of adults at a table', answer: VARW, feedback: 'Is it the same for every table, or does the waiter type it in?' },
    { label: 'The 15% discount', answer: CONW, feedback: 'Does the discount change from table to table?' },
    { label: 'The total cost for a table', answer: VARW, feedback: 'Is the total the same for every table?' },
  ], '', ['Why is the number of adults a variable?', 'It is different for every table. The program finds it out while it runs.']));

// ---------------------------------------------------------------- the two lines
steps.push({ id: 'two-lines', label: 'Writing the Two Lines',
  content: '<h2 class="lesson-h2">Writing the Two Lines</h2>' +
    tps('Why does DECLARE need a data type, but CONSTANT does not?', '<p>A constant is given its value on the same line, so the value shows its type.</p><p>A variable has no value yet, so we must say what type of value it will hold.</p>') +
    columns('<p style="margin:0 0 6px;font-weight:700">A variable: name, colon, data type</p>' + code(['DECLARE Adults : INTEGER', 'DECLARE TotalCost : REAL', 'Adults <- 4']) +
      '<p style="margin:6px 0 0">INTEGER: a whole number. REAL: a number with a decimal point.</p>',
      '<p style="margin:0 0 6px;font-weight:700">A constant: name, arrow, value</p>' + code(['CONSTANT AdultPrice <- 9.99', 'CONSTANT ChildPrice <- 6.99', 'CONSTANT Discount <- 0.15'])) });

steps.push(checkStep('write-lines', 'Your Turn: Write the Lines', 'Your Turn: Write the Lines', 'Type each whole line.', [
  { line: true, label: 'Make a constant called ChildPrice with the value 6.99', answer: '^\\s*CONSTANT\\s+ChildPrice\\s*(<-|\\u2190|=)\\s*6\\.99\\s*$', feedback: 'Start with CONSTANT. Then the name, an arrow, and the value.' },
  { line: true, label: 'Declare a variable called Children that stores a whole number', answer: '^\\s*DECLARE\\s+Children\\s*:\\s*INTEGER\\s*$', feedback: 'Start with DECLARE. Then the name, a colon, and the data type for whole numbers.' },
  { line: true, label: 'Store 3 in the variable Children', answer: '^\\s*Children\\s*(<-|\\u2190|=)\\s*3\\s*$', feedback: 'The name goes on the left of the arrow. The value goes on the right.' },
], '', ['Why use the name ChildPrice and not just type 6.99 everywhere?', 'The name tells you what the number means. If the price changes, you change one line.']));

// ---------------------------------------------------------------- activity 2: find the bug
{
  const prog = ['CONSTANT MaxLives <- 3', 'DECLARE Lives : INTEGER', 'Lives <- MaxLives', 'MaxLives <- 5', 'OUTPUT Lives'];
  steps.push(checkStep('find-bug', 'Your Turn: Find the Error', 'Your Turn: Find the Error', 'This program has one error.', [
    { label: 'Which line has the error?', answer: '^\\s*(line\\s*)?4\\s*$', feedback: 'Find the name made with CONSTANT. Which line tries to give it a new value?' },
    { line: true, label: 'Why is it an error?', answer: '^(?=.*\\b(constants?|maxlives)\\b)(?=.*\\b(chang\\w*|new\\s+value|reassign\\w*|assign\\w*|update\\w*)\\b).*$', feedback: 'Say what kind of name MaxLives is, and what line 4 tries to do to it.' },
  ], code(prog, true), ['Why does the computer stop a constant from changing?', 'A constant should be the same all the time. If it changed, every line that uses it would get the wrong value.']));
}

// ---------------------------------------------------------------- plenary
steps.push({ id: 'plenary', label: 'Plenary: Variables and Constants Drill', type: 'embedded-app', appId: 'drill-y11-8-1-vc', embedContainerId: `${P}-plenary`,
  content: '<h2 class="lesson-h2">Plenary: Variables and Constants Drill</h2>' +
    tps('Why practise with new values every time?', '<p>If you can do it with any values, you really understand it.</p>') +
    `<p class="lesson-lead">What they are, tracing, choosing, and writing the lines. Your progress is saved.</p><div id="${P}-plenary"></div>` });

// ---------------------------------------------------------------- self-checks: every regex against right and wrong answers
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now-2', 0, '3') && T('do-now-2', 0, '3 times') && !T('do-now-2', 0, '6'), 'do-now-2 a');
assert(T('do-now-2', 1, '6') && !T('do-now-2', 1, '3'), 'do-now-2 b');
assert(T('variable-check', 0, 'Lives') && !T('variable-check', 0, 'INTEGER'), 'var name');
assert(T('variable-check', 1, '2') && !T('variable-check', 1, '3'), 'var out');
assert(T('restaurant', 0, 'constant') && T('restaurant', 0, 'a constant') && !T('restaurant', 0, 'variable'), 'rest 0');
assert(T('restaurant', 1, 'Variable') && !T('restaurant', 1, 'constant'), 'rest 1');
assert(T('write-lines', 0, 'CONSTANT ChildPrice <- 6.99') && T('write-lines', 0, 'constant ChildPrice ← 6.99') && T('write-lines', 0, 'CONSTANT ChildPrice<-6.99') && !T('write-lines', 0, 'DECLARE ChildPrice : REAL') && !T('write-lines', 0, 'ChildPrice <- 6.99'), 'write 0');
assert(T('write-lines', 1, 'DECLARE Children : INTEGER') && T('write-lines', 1, 'declare Children:integer') && !T('write-lines', 1, 'DECLARE Children : REAL') && !T('write-lines', 1, 'CONSTANT Children <- 3'), 'write 1');
assert(T('write-lines', 2, 'Children <- 3') && T('write-lines', 2, 'Children ← 3') && !T('write-lines', 2, '3 <- Children'), 'write 2');
assert(T('find-bug', 0, '4') && T('find-bug', 0, 'line 4') && !T('find-bug', 0, '1'), 'bug line');
assert(T('find-bug', 1, 'MaxLives is a constant so it cannot be changed') && T('find-bug', 1, 'you cant change a constant') && T('find-bug', 1, 'it tries to give the constant a new value')
  && !T('find-bug', 1, 'it is a constant') && !T('find-bug', 1, 'the value changes'), 'bug why');

const lesson = { id: ID, label: '8.1 L1: Variables and Constants', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it first in the Year 11 8.1 unit; the older combined lesson becomes 8.1 L2.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find((y) => y.id === 'year11').units.find((u) => u.code === '8.1');
if (!unit.lessons.includes(ID)) unit.lessons.unshift(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
const oldPath = path.join(ROOT, 'LessonData', 'y11-8-1-l1.json');
const old = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
if (old.label !== '8.1 L2: Data Types, Input and Output') {
  old.label = '8.1 L2: Data Types, Input and Output';
  fs.writeFileSync(oldPath, JSON.stringify(old, null, 2) + '\n');
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
