// Builds LessonData/y11-8-1-arith.json: Year 11, 8.1 L3: Arithmetic Operators, and registers it in the Year 11
// 8.1 Programming Concepts unit after y11-8-1-types.
//   node tools/build_y11_8_1_arith.mjs
// Scheme of work item "Operators: Arithmetic, Relational and Logical", split so this lesson has one idea: the
// arithmetic operators + - * / ^ and the integer-division operators DIV and MOD (syllabus 8.1 4(f)). Relational and
// logical operators come next. Written for a low-ability, mostly EAL class: short sentences, a teacher-only Think,
// Pair, Share under every heading, predict-then-reveal, a compare slide. Do Now: two real 0478 Paper 2 questions on
// 8.1 L1 and L2 with a Walk me through it each, then the y11-8-1-arith-ext Extension drill. Activities: a Trace Tables
// trace using DIV and MOD, and the y11-8-1-arith-code drill (write the lines, run against a reference). Plenary: the
// y11-8-1-arith drill. Every exam answer below is checked by running it through shared/pseudocode-engine.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-8-1-arith';
const P = 'y11ar';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
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
const why = (q, a) => tps(q, `<p>${a}</p>`);

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '', whyQ = null) {
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
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
function mcStep(id, label, heading, lead, items, whyQ = null) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`,
    items };
}
function selfMarked(id, label, heading, lead, items, whyQ) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
const num = (n) => `^\\s*${String(n).replace('.', '\\.')}\\s*$`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
// Runs a program through the site's pseudocode engine and returns its outputs.
function run(src, vars = {}) {
  const r = runPseudocode(src, vars);
  if (r.error) throw new Error(`Program failed: ${r.error.message}\n${src}`);
  return r.outputs;
}
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%"><tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';

const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
// Each step is { text, visual }: one short sentence, and a picture with the part that matters marked .wt-hl. They
// use a different question from the slide's own, so they show the method and never the answer.
const note = (t) => `<div class="wt-note">${t}</div>`;
function codeWT(lines, hl = []) {
  return '<div class="lesson-code">' + lines.map((l, i) =>
    `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">${esc(l)}</div>`).join('') + '</div>';
}
function askList(rows, hl) {
  return '<table class="donow-table" style="font-size:17px">' + rows.map((r, i) =>
    `<tr${i === hl ? ' class="wt-hl"' : ''}><td style="padding:6px 12px;text-align:left">${r[0]}</td><td style="padding:6px 12px;text-align:left"><strong>${r[1]}</strong></td></tr>`).join('') + '</table>';
}
// Do Now 1 (a data type for 'M'), worked with 4.5.
const ASK = (a, b, c) => [['Is it only TRUE or FALSE?', a], ['Is it a number?', b], ['Does it have a decimal point?', c]];
const WT_TYPE = { title: 'Walk me through it: choose a data type', steps: [
  { text: 'We will find the best data type for <strong>4.5</strong>. Your question has a different value, so you still do the working yourself.', visual: '<div class="wt-big">4.5</div>' },
  { text: 'Ask: is it only TRUE or FALSE? <strong>No.</strong> So it is not Boolean.', visual: askList(ASK('No', '', ''), 0) },
  { text: 'Ask: is it a number? <strong>Yes.</strong> 4.5 is a number. It is not in quote marks.', visual: askList(ASK('No', 'Yes', ''), 1) },
  { text: 'Ask: does it have a decimal point? <strong>Yes</strong>: 4<span class="wt-hl">.</span>5', visual: askList(ASK('No', 'Yes', 'Yes'), 2) },
  { text: 'A number with a decimal point is <strong>real</strong>. Integer stores whole numbers only, so it cannot store 4.5.', visual: '<div class="wt-big">4.5 &rarr; <span class="wt-hl">real</span></div>' },
  { text: 'Now ask the same questions about the value in your question. Look at the quote marks too: they mean text.', visual: askList(ASK('?', '?', '?'), -1) },
] };
// Do Now 2 (declare Name, Age and Found), worked with Height (1.65) and Grade ('B').
const WT_DECLARE = { title: 'Walk me through it: declare variables', steps: [
  { text: 'A similar question: <strong>Height</strong> holds a height in metres, such as 1.65. <strong>Grade</strong> holds one letter, such as \'B\'.', visual: note('Height: 1.65 &nbsp;&nbsp; Grade: \'B\'') },
  { text: 'Every line starts with the keyword <strong>DECLARE</strong>.', visual: codeWT(['DECLARE'], [1]) },
  { text: 'Then the variable\'s name, then a <strong>colon</strong>.', visual: codeWT(['DECLARE Height :'], [1]) },
  { text: '1.65 is a number with a decimal point. So the type is <strong>REAL</strong>.', visual: codeWT(['DECLARE Height : REAL'], [1]) },
  { text: '\'B\' is one character. So the type is <strong>CHAR</strong>. One line for each variable.', visual: codeWT(['DECLARE Height : REAL', 'DECLARE Grade : CHAR'], [2]) },
  { text: 'Check each line: DECLARE, the name, a colon, the type. Now do the same for Name, Age and Found.', visual: codeWT(['DECLARE Height : REAL', 'DECLARE Grade : CHAR'], [1, 2]) },
] };

// ---------------------------------------------------------------- Do Now (8.1 L1 and L2) and its extension
steps.push(mcStep('do-now', 'Do Now: Data Types (1 of 2)', 'Do Now: Data Types (1 of 2)', 'From 8.1 L2. Cambridge IGCSE 0478/23, November 2025, Question 3.', [
  { prompt: 'Tick one box to identify the most appropriate data type to store \'M\'', options: ['integer', 'char', 'real', 'Boolean'], correct: 1,
    explain: '\'M\' is one character in quote marks.' },
], ['Why are there quote marks around M?', 'They show it is text, not a number or a variable.']));
steps[steps.length - 1].walkthrough = WT_TYPE;
const DECL = (name, type) => `^\\s*DECLARE\\s+${name}\\s*:\\s*${type}\\s*$`;
steps.push(checkStep('do-now-2', 'Do Now: Declare Variables (2 of 2)', 'Do Now: Declare Variables (2 of 2)',
  'From 8.1 L1 and L2. Cambridge IGCSE 0478/23, November 2025, Question 9(a). Name holds the name of a person. Age holds the age of a person as a whole number. Found holds a flag that can be set to TRUE or FALSE. Write pseudocode statements to declare the variables Name, Age and Found.', [
    { line: true, label: 'Declare Name', answer: DECL('Name', 'STRING'), feedback: 'DECLARE, the name, a colon, then the type for many characters.' },
    { line: true, label: 'Declare Age', answer: DECL('Age', 'INTEGER'), feedback: 'An age is a whole number. Which type stores whole numbers?' },
    { line: true, label: 'Declare Found', answer: DECL('Found', '(BOOLEAN|BOOL)'), feedback: 'It can only be TRUE or FALSE.' },
  ], '', ['Why must every variable be declared first?', 'The program must know its name and what kind of value it stores before it can use it.']));
steps[steps.length - 1].walkthrough = WT_DECLARE;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-8-1-arith-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 8.1 L1 and L2: variables, constants, data types, INPUT and OUTPUT. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Arithmetic Operators',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">8.1 Programming Concepts</p><h2 class="lesson-h2">Arithmetic Operators</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> an <strong>operator</strong> is a symbol that does maths with values.', '<strong>Then:</strong> DIV and MOD: dividing into whole groups, and what is left over.',
      '<strong>Activities:</strong> trace a program, then write lines and run them.']) +
    why('Why does a program need to do maths?', 'To work out totals, prices, scores and times from the values it stores.') });

// ---------------------------------------------------------------- the five operators: predict then reveal
steps.push({ id: 'operators', label: 'Five Arithmetic Operators',
  content: '<h2 class="lesson-h2">Five Arithmetic Operators</h2>' +
    tps('Predict: what is 7 / 2? What is 7 ^ 2?', '<p>7 / 2 = <strong>3.5</strong>. / gives a number with a decimal point when it does not divide exactly.</p><p>7 ^ 2 = 7 * 7 = <strong>49</strong>.</p>', 'Show the worked answer') +
    table([
      ['<strong>+</strong>', 'add', '7 + 2'],
      ['<strong>-</strong>', 'subtract', '7 - 2'],
      ['<strong>*</strong>', 'multiply', '7 * 2'],
      ['<strong>/</strong>', 'divide', '7 / 2'],
      ['<strong>^</strong>', 'raised to the power of', '7 ^ 2'],
    ], ['Operator', 'It means', 'Example']) +
    facts(['In a program: <code>Area &lt;- Length * Width</code>']) });

steps.push(checkStep('check-ops', 'Check: Use the Operators', 'Check: Use the Operators', 'Work out each one.', [
  { label: 'What is 6 * 4?', answer: num(24), feedback: '* means multiply.' },
  { label: 'What is 9 / 2?', answer: num(4.5), feedback: '/ means divide. Does 2 go into 9 exactly?' },
  { label: 'What is 3 ^ 2?', answer: num(9), feedback: '^ means raised to the power of: 3 times itself.' },
  { label: 'Write the operator that means raised to the power of.', answer: '^\\s*\\^\\s*$', feedback: 'Look back at the table: the last row.' },
], '', ['Why is 3 ^ 2 not 6?', '3 ^ 2 is 3 * 3. 6 is 3 * 2, a different operator.']));

// ---------------------------------------------------------------- DIV and MOD: predict then reveal
const dot = '<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:var(--accent, #6aa9ff);margin:2px"></span>';
const bag = (n) => `<span style="display:inline-block;border:2px solid var(--muted, #999);border-radius:8px;padding:4px 6px;margin:4px">${dot.repeat(n)}</span>`;
steps.push({ id: 'div-mod', label: 'DIV and MOD',
  content: '<h2 class="lesson-h2">DIV and MOD</h2>' +
    tps('Predict: 17 sweets go into bags of 5. How many full bags? How many sweets are left over?',
      '<p><strong>3</strong> full bags, so DIV(17, 5) returns 3.</p><p><strong>2</strong> sweets left over, so MOD(17, 5) returns 2.</p>', 'Show the worked answer') +
    columns(`<p style="margin:0 0 6px;font-weight:700;text-align:center">17 sweets, bags of 5</p><div style="text-align:center">${bag(5)}${bag(5)}${bag(5)}<br>${dot}${dot}</div>`,
      facts(['<strong>DIV(17, 5)</strong>: how many <strong>full groups</strong> of 5?', 'DIV gives the <strong>quotient</strong>: the whole number part. The <strong>fractional part</strong> is thrown away.',
        '<strong>MOD(17, 5)</strong>: how many are <strong>left over</strong>?', 'MOD gives the <strong>remainder</strong>.'])) });

// ---------------------------------------------------------------- compare: / DIV MOD, same numbers
const CMP = [[17, 5], [20, 5], [7, 2]];
const cmpRows = CMP.map(([a, b]) => {
  const [d, q, m] = run(`OUTPUT ${a} / ${b}\nOUTPUT DIV(${a}, ${b})\nOUTPUT MOD(${a}, ${b})`);
  return [`${a} and ${b}`, `${a} / ${b} = ${d}`, `DIV(${a}, ${b}) = ${q}`, `MOD(${a}, ${b}) = ${m}`];
});
assert(cmpRows[0].join() === '17 and 5,17 / 5 = 3.4,DIV(17, 5) = 3,MOD(17, 5) = 2' && cmpRows[1][3] === 'MOD(20, 5) = 0', 'compare table');
steps.push({ id: 'compare', label: 'Compare: /, DIV and MOD',
  content: '<h2 class="lesson-h2">Compare: /, DIV and MOD</h2>' +
    tps('Look at each row. What is the same about / and DIV? When does MOD give 0?',
      '<p>DIV is the / answer with the fractional part thrown away.</p><p>MOD gives 0 when the numbers divide exactly: 20 bags of 5, nothing left.</p>') +
    table(cmpRows, ['Numbers', '/ divide', 'DIV quotient', 'MOD remainder']) +
    facts(['Exam papers also write <strong>17 DIV 5</strong> and <strong>17 MOD 5</strong>. They mean the same as DIV(17, 5) and MOD(17, 5).']) });

steps.push(checkStep('check-divmod', 'Check: DIV and MOD', 'Check: DIV and MOD', 'Work out each one.', [
  { label: 'DIV(23, 5)', answer: num(run('OUTPUT DIV(23, 5)')[0]), feedback: 'How many full groups of 5 fit into 23?' },
  { label: 'MOD(23, 5)', answer: num(run('OUTPUT MOD(23, 5)')[0]), feedback: 'Take away the full groups of 5. What is left?' },
  { label: 'MOD(12, 4)', answer: num(run('OUTPUT MOD(12, 4)')[0]), feedback: 'Does 4 go into 12 exactly?' },
  { label: 'DIV(9, 2)', answer: num(run('OUTPUT DIV(9, 2)')[0]), feedback: 'Work out 9 / 2, then throw away the fractional part.' },
], '', ['Why is MOD(12, 4) a useful check?', 'It tells you if 4 goes into 12 exactly: the remainder is 0.']));

// ---------------------------------------------------------------- exam question: 355 and 10
const R355 = run('OUTPUT 355 DIV 10\nOUTPUT 355 / 10\nOUTPUT 355 MOD 10');
assert(R355.join() === '35,35.5,5', '355 results match the mark scheme');
steps.push(checkStep('exam-355', 'Exam Question: DIV, / and MOD', 'Exam Question: DIV, / and MOD',
  'Cambridge IGCSE 0478/23, June 2025, Question 2. Three uses of arithmetic operators are shown. Write the correct result for each. Use one of: 5, 355, 35, 35.5 (one is not used).', [
    { label: '355 DIV 10', answer: num(R355[0]), feedback: 'How many full groups of 10 fit into 355?' },
    { label: '355 / 10', answer: num(R355[1]), feedback: 'Normal division: the answer can have a decimal point.' },
    { label: '355 MOD 10', answer: num(R355[2]), feedback: 'After the full groups of 10, what is left over?' },
  ], '', ['355 DIV 10 is written without brackets. Does it mean something different?', 'No. 355 DIV 10 means the same as DIV(355, 10).']));

// ---------------------------------------------------------------- activity 1: Trace Tables with DIV and MOD
const TR = run('DECLARE Minutes : INTEGER\nDECLARE Hours : INTEGER\nDECLARE Mins : INTEGER\nMinutes <- 135\nHours <- DIV(Minutes, 60)\nMins <- MOD(Minutes, 60)\nOUTPUT Hours\nOUTPUT Mins');
assert(TR.join() === '2,15', 'activity-1 trace');
steps.push({ id: 'activity-1', label: 'Activity 1: Trace Hours and Minutes', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Hours and Minutes',
    context: 'This program changes 135 minutes into hours and minutes. Complete the trace table.',
    code: ['DECLARE Minutes : INTEGER', 'DECLARE Hours : INTEGER', 'DECLARE Mins : INTEGER', 'Minutes = 135', 'Hours = DIV(Minutes, 60)', 'Mins = MOD(Minutes, 60)', 'print(Hours)', 'print(Mins)'],
    cols: ['Line', 'Minutes', 'Hours', 'Mins', 'Output'],
    answers: [
      { Line: '4', Minutes: '135', Hours: '', Mins: '', Output: '' },
      { Line: '5', Minutes: '', Hours: String(TR[0]), Mins: '', Output: '' },
      { Line: '6', Minutes: '', Hours: '', Mins: String(TR[1]), Output: '' },
      { Line: '7', Minutes: '', Hours: '', Mins: '', Output: String(TR[0]) },
      { Line: '8', Minutes: '', Hours: '', Mins: '', Output: String(TR[1]) },
    ],
  },
  content: '<h2 class="lesson-h2">Activity 1: Trace Hours and Minutes</h2>' +
    why('Why does line 5 use DIV and not / ?', 'Hours is an INTEGER. / can give a number with a decimal point. DIV always gives a whole number.') +
    `<div id="${P}-embed-1" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- exam questions: name the operator
steps.push(mcStep('exam-quotient', 'Exam Question: Which Operator?', 'Exam Question: Which Operator?', 'Cambridge IGCSE 0478/21, November 2025, Question 3.', [
  { prompt: 'Tick one box to identify the operator that returns the quotient of a calculation with the fractional part discarded.', options: ['/', 'DIV', '^', 'MOD'], correct: 1,
    explain: 'DIV returns the quotient, the whole number part. / keeps the fractional part. MOD returns the remainder.' },
], ['What does "discarded" mean here?', 'Thrown away. The fractional part, after the decimal point, is thrown away.']));

const NOT_ARITH = '^(?=.*>(?!=))(?=.*<=)(?=.*\\bAND\\b)(?=.*\\bNOT\\b)(?!.*(\\+|\\*|\\^|/|\\bDIV\\b|\\bMOD\\b))[\\s,;>=<a-z]*$';
steps.push(checkStep('exam-not-arith', 'Exam Question: Not Arithmetic', 'Exam Question: Not Arithmetic',
  'Cambridge IGCSE 0478/21, June 2026, Question 2. Identify four operators that are <strong>not</strong> arithmetic operators from the list.', [
    { label: 'Write the four operators, with a space between each one.', answer: NOT_ARITH, marks: 4, feedback: 'Cross out the seven arithmetic operators from today. Write the four that are left.' },
  ], code(['/    >    <=    +    *', '^    AND  DIV   MOD  NOT']),
  ['How can you answer this without knowing what AND means?', 'You know the arithmetic operators. Any operator that is not one of them is the answer.']));

// ---------------------------------------------------------------- activity 2: write the lines (code drill)
steps.push(embed('activity-2', 'Activity 2: Write the Lines', 'drill-y11-8-1-arith-code', 'Activity 2: Write the Lines',
  'Write the lines in the box. Press Run. Your program must give the same answer as the model program, with new values each time.',
  ['Why is your program tested with new values each time?', 'It must work for any value, not just one. Then you know your operator is right.']));

// ---------------------------------------------------------------- exam question, self-marked
steps.push(selfMarked('exam-purpose', 'Exam Question: MOD and DIV', 'Exam Question: MOD and DIV',
  'Cambridge IGCSE 0478/21, June 2025, Question 5. Write your answer, then mark it against the mark scheme.', [
    { id: 'mod-div', prompt: 'Two library routines used in programming are MOD and DIV. State the purpose of each of the library routines. Give one example pseudocode statement for each of the library routines. [4]', marks: 4,
      modelAnswer: 'MOD returns the remainder of a division calculation. Example: X <- MOD(10, 3). DIV is integer division: it returns the quotient of a division. Example: Y <- DIV(10, 3).' },
  ], ['This question has 4 marks. What do you need to write?', 'A purpose and an example for MOD, then a purpose and an example for DIV.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Arithmetic Operators Drill', 'drill-y11-8-1-arith', 'Plenary: Arithmetic Operators Drill',
  'The five operators, DIV and MOD, tracing programs and writing the lines. Your progress is saved.',
  ['Why practise with new values every time?', 'If you can do it with any values, you really understand it.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now-2', 0, 'DECLARE Name : STRING') && !T('do-now-2', 0, 'DECLARE Name : CHAR') && T('do-now-2', 1, 'declare age : integer') && !T('do-now-2', 1, 'DECLARE Age : REAL') && T('do-now-2', 2, 'DECLARE Found : BOOLEAN') && !T('do-now-2', 2, 'DECLARE Found : STRING'), 'do-now-2');
assert(T('check-ops', 0, '24') && !T('check-ops', 0, '10') && T('check-ops', 1, '4.5') && !T('check-ops', 1, '4') && T('check-ops', 2, '9') && !T('check-ops', 2, '6') && T('check-ops', 3, '^') && !T('check-ops', 3, '*'), 'check-ops');
assert(T('check-divmod', 0, '4') && T('check-divmod', 1, '3') && T('check-divmod', 2, '0') && T('check-divmod', 3, '4') && !T('check-divmod', 3, '4.5') && !T('check-divmod', 1, '4.6'), 'check-divmod');
assert(T('exam-355', 0, '35') && !T('exam-355', 0, '35.5') && T('exam-355', 1, '35.5') && T('exam-355', 2, '5') && !T('exam-355', 2, '355'), 'exam-355');
for (const ok of ['> <= AND NOT', 'NOT, AND, <=, >', 'and not > <=']) assert(T('exam-not-arith', 0, ok), 'not-arith accepts ' + ok);
for (const bad of ['> <= AND', '>= <= AND NOT', '> <= AND NOT MOD', '> <= AND NOT /', '<= AND NOT']) assert(!T('exam-not-arith', 0, bad), 'not-arith rejects ' + bad);
// The walkthroughs show the method with other values and never the Do Now answers.
assert(!/char/i.test(JSON.stringify(WT_TYPE)), 'type walkthrough names the Do Now answer');
{ const s = JSON.stringify(WT_DECLARE); assert(!/STRING|INTEGER|BOOLEAN|DECLARE (Name|Age|Found)/.test(s), 'declare walkthrough shows a Do Now answer'); }
// No dashes anywhere in the lesson text.
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'em or en dash');

const lesson = { id: ID, label: '8.1 L3: Arithmetic Operators', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it as 8.1 L3, after y11-8-1-types.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const lessons = JSON.parse(raw);
const unit = lessons.years.find((y) => y.id === 'year11').units.find((u) => u.code === '8.1');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y11-8-1-types') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(lessons, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 8.1 is now ${unit.lessons.join(', ')}`);
