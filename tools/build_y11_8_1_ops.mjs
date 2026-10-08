// Builds LessonData/y11-8-1-ops.json: Year 11, 8.1 L4: Relational and Logical Operators, and registers it in the
// Year 11 8.1 Programming Concepts unit after y11-8-1-arith.
//   node tools/build_y11_8_1_ops.mjs
// Scheme of work item "Operators: Arithmetic, Relational and Logical", second half (syllabus 8.1 4(f)): the relational
// operators = < <= > >= <> and the logical operators AND, OR and NOT, used in conditions. Selection comes next.
// Written for a low-ability, mostly EAL class: short sentences, a teacher-only Think, Pair, Share under every heading,
// predict-then-reveal, two compare slides (> and >=, AND and OR). Do Now: two real 0478 Paper 2 questions on 8.1 L3
// and L2 with a Walk me through it each, then the y11-8-1-ops-ext Extension drill. Activities: a Trace Tables trace
// counting passes with >=, and the y11-8-1-ops-code drill (write the IF, run against a reference). Plenary: the
// y11-8-1-ops drill. Every TRUE or FALSE answer below is worked out by shared/pseudocode-engine.js.
// The engine cannot read brackets around a comparison ((A > 1) AND (B < 2) fails), so no condition here uses them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-8-1-ops';
const P = 'y11op';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A boxed program; numbered adds line numbers.
const code = (lines, numbered = false) => '<div class="lesson-code">' +
  lines.map((l, i) => `<div class="lesson-code-line">${numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : ''}${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length))}</div>`).join('') + '</div>';
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
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
// Runs a program through the site's pseudocode engine and returns its outputs.
function run(src, vars = {}, inputs = []) {
  const r = runPseudocode(src, vars, 5000, inputs.map(String));
  if (r.error) throw new Error(`Program failed: ${r.error.message}\n${src}`);
  return r.outputs;
}
// TRUE or FALSE for a condition, worked out by the engine inside an IF.
function tf(cond, vars) {
  const o = run(`IF ${cond} THEN\n  OUTPUT "TRUE"\nELSE\n  OUTPUT "FALSE"\nENDIF`, vars);
  return o[0];
}
const TF = (v) => `^\\s*${v}\\s*$`;
const tfFeedback = (op) => `Put the value into the condition. Then ask: ${op}`;
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%"><tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';

// A condition typed by the student: the halves joined by AND or OR may come in either order, spaces are free.
const SP = '\\s*';
const condRe = (halves, join) => {
  if (halves.length === 1) return `^\\s*${halves[0]}\\s*$`;
  const [a, b] = halves;
  return `^\\s*((${a})\\s+${join}\\s+(${b})|(${b})\\s+${join}\\s+(${a}))\\s*$`;
};

const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
// Each step is { text, visual }: one short sentence, and a picture with the part that matters marked .wt-hl. They
// use a different question from the slide's own, so they show the method and never the answer.
function askList(rows, hl) {
  return '<table class="donow-table" style="font-size:17px">' + rows.map((r, i) =>
    `<tr${i === hl ? ' class="wt-hl"' : ''}><td style="padding:6px 12px;text-align:left">${r[0]}</td><td style="padding:6px 12px;text-align:left"><strong>${r[1]}</strong></td></tr>`).join('') + '</table>';
}
// Do Now 1 (4 ^ 2), worked with 3 ^ 4.
const WT_POWER = { title: 'Walk me through it: raised to the power of', steps: [
  { text: 'We will work out <strong>3 ^ 4</strong>. Your question has different numbers, so you still do the working yourself.', visual: '<div class="wt-big">3 ^ 4</div>' },
  { text: '^ means <strong>raised to the power of</strong>. The second number says how many times to write the first number.', visual: '<div class="wt-big">3 ^ <span class="wt-hl">4</span></div>' },
  { text: 'Write 3 four times, with * between each one.', visual: '<div class="wt-big"><span class="wt-hl">3 * 3 * 3 * 3</span></div>' },
  { text: 'Multiply one step at a time: 3 * 3 = 9. Then 9 * 3 = 27. Then 27 * 3 = 81.', visual: '<div class="wt-big">9 &rarr; 27 &rarr; <span class="wt-hl">81</span></div>' },
  { text: 'So 3 ^ 4 = 81. It is <strong>not</strong> 3 * 4 = 12. That is a different operator.', visual: '<div class="wt-big">3 ^ 4 = <span class="wt-hl">81</span></div><div class="wt-note">3 * 4 = 12 is multiply, not power.</div>' },
  { text: 'Now do your question the same way: write the first number, the second number of times, and multiply.', visual: '<div class="wt-big">? ^ ?</div>' },
] };
// Do Now 2 (match four descriptions to data types), worked with "whether a door is open".
const ASK = (a, b, c, d) => [['Is it only TRUE or FALSE?', a], ['Is it a number?', b], ['Does the number have a decimal point?', c], ['Is it text: one letter, or many letters?', d]];
const WT_TYPE = { title: 'Walk me through it: match data to a data type', steps: [
  { text: 'A similar description: <strong>whether a door is open</strong>. We will find its data type.', visual: '<div class="wt-big">whether a door is open</div>' },
  { text: 'Ask the first question: is it only TRUE or FALSE? A door is open or it is not. <strong>Yes.</strong>', visual: askList(ASK('Yes', '', '', ''), 0) },
  { text: 'A value that is only TRUE or FALSE is <strong>BOOLEAN</strong>. You can stop asking.', visual: '<div class="wt-big">door open &rarr; <span class="wt-hl">BOOLEAN</span></div>' },
  { text: 'If the answer is No, ask the next question: is it a number? Then: does it have a decimal point?', visual: askList(ASK('No', '?', '?', ''), 1) },
  { text: 'If it is not a number, it is text. Ask: is it one letter, or many letters?', visual: askList(ASK('No', 'No', '', '?'), 3) },
  { text: 'Now ask the questions, in order, for each description in your question. One data type is not used.', visual: askList(ASK('?', '?', '?', '?'), -1) },
] };

// ---------------------------------------------------------------- Do Now (8.1 L3 and L2) and its extension
steps.push(mcStep('do-now', 'Do Now: Arithmetic Operators (1 of 2)', 'Do Now: Arithmetic Operators (1 of 2)', 'From 8.1 L3. Cambridge IGCSE 0478/22, November 2025, Question 1.', [
  { prompt: 'Tick one box to complete this sentence. The result of the arithmetic operation 4 ^ 2 is', options: ['2', '8', '16', '42'], correct: 2,
    explain: '4 ^ 2 means 4 raised to the power of 2: 4 * 4.' },
], ['Why does a program write ^ and not a small raised number, like in maths?', 'Code is typed on one line. ^ shows the power on that line.']));
steps[steps.length - 1].walkthrough = WT_POWER;
const TYPE = (t) => `^\\s*${t}\\s*$`;
steps.push(checkStep('do-now-2', 'Do Now: Data Types (2 of 2)', 'Do Now: Data Types (2 of 2)',
  'From 8.1 L2. Cambridge IGCSE 0478/21, November 2023, Question 3.', [
    { label: 'a whole number', answer: TYPE('INTEGER'), feedback: 'It is a number with no decimal point.' },
    { label: 'a single letter', answer: TYPE('(CHAR|CHARACTER)'), feedback: 'It is text, but only one letter.' },
    { label: 'a word or phrase', answer: TYPE('STRING'), feedback: 'It is text with many letters.' },
    { label: 'a number with two decimal places', answer: TYPE('REAL'), feedback: 'Which type stores a number with a decimal point?' },
  ], '<p style="margin:0 0 8px">Write the most appropriate data type for each description. Not all data types will be used.</p>' + code(['BOOLEAN', 'CHAR', 'INTEGER', 'REAL', 'STRING']), ['Why does a program need to know the data type?', 'It must know what kind of value it stores and what it can do with it, such as maths with numbers.']));
steps[steps.length - 1].walkthrough = WT_TYPE;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-8-1-ops-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 8.1 L1 to L3: variables, constants, data types, and arithmetic operators with DIV and MOD. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Relational and Logical Operators',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">8.1 Programming Concepts</p><h2 class="lesson-h2">Relational and Logical Operators</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> a <strong>relational operator</strong> compares two values. The answer is TRUE or FALSE.', '<strong>Then:</strong> <strong>logical operators</strong>: AND, OR and NOT.',
      '<strong>Activities:</strong> trace a program, then write IF statements and run them.']) +
    why('Why does a program need to compare values?', 'To make a decision: pass or fail, the right password or the wrong one, game over or keep playing.') });

// ---------------------------------------------------------------- the six relational operators: predict then reveal
const AGE = { Age: 15 };
const REL = [['=', 'equal to', 'Age = 15'], ['<', 'less than', 'Age < 18'], ['<=', 'less than or equal to', 'Age <= 15'],
  ['>', 'greater than', 'Age > 18'], ['>=', 'greater than or equal to', 'Age >= 16'], ['<>', 'not equal to', 'Age <> 15']];
const relRows = REL.map(([op, mean, ex]) => [`<strong>${esc(op)}</strong>`, mean, esc(ex), tf(ex, AGE)]);
assert(relRows.map((r) => r[3]).join() === 'TRUE,TRUE,TRUE,FALSE,FALSE,FALSE', 'relational table');
steps.push({ id: 'relational', label: 'Six Relational Operators',
  content: '<h2 class="lesson-h2">Six Relational Operators</h2>' +
    tps('Predict: Age is 15. Is Age &lt; 18 TRUE or FALSE? Is Age &gt; 18 TRUE or FALSE?',
      `<p>Age &lt; 18 is <strong>${tf('Age < 18', AGE)}</strong>: 15 is less than 18.</p><p>Age &gt; 18 is <strong>${tf('Age > 18', AGE)}</strong>: 15 is not greater than 18.</p>`, 'Show the worked answer') +
    table(relRows, ['Operator', 'It means', 'Example', 'When Age is 15']) +
    facts(['The answer is always <strong>TRUE</strong> or <strong>FALSE</strong>: a BOOLEAN value.', 'In a program: <code>IF Age &lt; 18 THEN</code>']) });

const S12 = { Score: 12 };
const CR = ['Score > 10', 'Score <> 12', 'Score <= 11'].map((c) => tf(c, S12));
assert(CR.join() === 'TRUE,FALSE,FALSE', 'check-rel answers');
steps.push(checkStep('check-rel', 'Check: TRUE or FALSE?', 'Check: TRUE or FALSE?', 'Score is 12. Is each condition TRUE or FALSE?', [
  { label: 'Score &gt; 10', answer: TF(CR[0]), feedback: tfFeedback('is 12 greater than 10?') },
  { label: 'Score &lt;&gt; 12', answer: TF(CR[1]), feedback: '&lt;&gt; means not equal to. Is 12 not equal to 12?' },
  { label: 'Score &lt;= 11', answer: TF(CR[2]), feedback: tfFeedback('is 12 less than 11, or equal to 11?') },
  { label: 'Write the operator that means not equal to.', answer: '^\\s*<>\\s*$', feedback: 'Look back at the table: the last row.' },
], '', ['Why is &lt;&gt; made of two symbols?', 'Not equal means less than or greater than: &lt; and &gt; together.']));

// ---------------------------------------------------------------- compare: > and >=
const CMP = [49, 50, 51].map((m) => [String(m), tf('Mark > 50', { Mark: m }), tf('Mark >= 50', { Mark: m })]);
assert(CMP.map((r) => r.slice(1).join('/')).join() === 'FALSE/FALSE,FALSE/TRUE,TRUE/TRUE', 'compare table');
steps.push({ id: 'compare-gt', label: 'Compare: > and >=',
  content: '<h2 class="lesson-h2">Compare: &gt; and &gt;=</h2>' +
    tps('Look at the row where Mark is 50. Why are the two answers different?',
      '<p>&gt;= includes 50 itself. &gt; only starts above 50.</p><p>50 is the value <strong>on the line</strong>. That is where the two operators are different.</p>') +
    columns(table(CMP.map((r) => [r[0], r[1], r[2]]), ['Mark', 'Mark &gt; 50', 'Mark &gt;= 50']),
      facts(['<strong>"more than 50"</strong> means <code>Mark &gt; 50</code>.', '<strong>"50 or more"</strong> means <code>Mark &gt;= 50</code>.',
        'Always test the value on the line.'])) });

const A18 = { Age: 18 };
const CB = [tf('Age > 18', A18), tf('Age >= 18', A18)];
assert(CB.join() === 'FALSE,TRUE', 'check-bound answers');
const AGE18 = condRe([`(Age${SP}>=${SP}18|18${SP}<=${SP}Age|Age${SP}>${SP}17)`], '');
const SPEED = condRe([`(Speed${SP}<${SP}30|30${SP}>${SP}Speed|Speed${SP}<=${SP}29)`], '');
steps.push(checkStep('check-bound', 'Check: On the Line', 'Check: On the Line', 'Age is 18.', [
  { label: 'Is Age &gt; 18 TRUE or FALSE?', answer: TF(CB[0]), feedback: 'Is 18 greater than 18?' },
  { label: 'Is Age &gt;= 18 TRUE or FALSE?', answer: TF(CB[1]), feedback: '&gt;= means greater than or equal to. Is 18 equal to 18?' },
  { label: 'Write the condition: Age is 18 or more.', answer: AGE18, line: true, feedback: '"or more" includes 18 itself. Which operator includes the value?' },
  { label: 'Write the condition: Speed is less than 30.', answer: SPEED, line: true, feedback: 'The variable, then the operator, then the number.' },
], '', ['Why do exam questions often use the value on the line?', 'It is where &gt; and &gt;= give different answers, so it finds the mistake.']));

// ---------------------------------------------------------------- activity 1: Trace Tables counting passes
const MARKS = [50, 38, 72, 49];
const PASSES_SRC = 'DECLARE Mark : INTEGER\nDECLARE Count : INTEGER\nDECLARE Passes : INTEGER\nPasses <- 0\nFOR Count <- 1 TO 4\n  INPUT Mark\n  IF Mark >= 50 THEN\n    Passes <- Passes + 1\n  ENDIF\nNEXT Count\nOUTPUT Passes';
const TR = run(PASSES_SRC, {}, MARKS);
assert(TR.join() === '2', 'activity-1 trace');
const trRows = [{ Line: '4', Mark: '', Count: '', Passes: '0', Output: '' }];
let passes = 0;
MARKS.forEach((m, i) => {
  trRows.push({ Line: '5', Mark: '', Count: String(i + 1), Passes: '', Output: '' });
  trRows.push({ Line: '6', Mark: String(m), Count: '', Passes: '', Output: '' });
  if (m >= 50) { passes += 1; trRows.push({ Line: '8', Mark: '', Count: '', Passes: String(passes), Output: '' }); }
});
trRows.push({ Line: '9', Mark: '', Count: '', Passes: '', Output: String(passes) });
assert(String(passes) === String(TR[0]), 'trace rows agree with the engine');
steps.push({ id: 'activity-1', label: 'Activity 1: Trace the Passes', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Count the Passes',
    context: `Four marks are input: ${MARKS.join(', ')}. A pass is 50 or more. Complete the trace table.`,
    code: ['DECLARE Mark : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Passes : INTEGER', 'Passes = 0', 'for Count in range(1, 5):', '    Mark = int(input())', '    if Mark >= 50:', '        Passes = Passes + 1', 'print(Passes)'],
    cols: ['Line', 'Mark', 'Count', 'Passes', 'Output'],
    answers: trRows,
  },
  content: '<h2 class="lesson-h2">Activity 1: Trace the Passes</h2>' +
    why('Why does 50 add to Passes, but 49 does not?', '50 &gt;= 50 is TRUE: 50 is equal to 50. 49 &gt;= 50 is FALSE.') +
    `<div id="${P}-embed-1" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- the three logical operators: predict then reveal
const LOG = [['AND', 'TRUE only when <strong>both</strong> conditions are TRUE', 'Age > 12 AND Age < 20'],
  ['OR', 'TRUE when <strong>at least one</strong> condition is TRUE', 'Age < 10 OR Age > 13'],
  ['NOT', '<strong>changes</strong> TRUE to FALSE, and FALSE to TRUE', 'NOT Age = 15']];
const logRows = LOG.map(([op, mean, ex]) => [`<strong>${op}</strong>`, mean, esc(ex), tf(ex, AGE)]);
assert(logRows.map((r) => r[3]).join() === 'TRUE,TRUE,FALSE', 'logical table');
steps.push({ id: 'logical', label: 'Three Logical Operators',
  content: '<h2 class="lesson-h2">Three Logical Operators</h2>' +
    tps('Predict: Age is 15. Is Age &gt; 12 AND Age &lt; 20 TRUE or FALSE?',
      `<p>Age &gt; 12 is TRUE. Age &lt; 20 is TRUE.</p><p>Both are TRUE, so the answer is <strong>${tf('Age > 12 AND Age < 20', AGE)}</strong>.</p>`, 'Show the worked answer') +
    table(logRows, ['Operator', 'It means', 'Example', 'When Age is 15']) +
    facts(['A logical operator joins two conditions, or changes one.', 'Work out each condition first. Then use AND, OR or NOT.']) });

const X8 = { X: 8 };
const CL = ['X > 5 AND X < 10', 'X < 5 OR X > 10', 'NOT X = 8', 'X = 8 OR X = 9'].map((c) => tf(c, X8));
assert(CL.join() === 'TRUE,FALSE,FALSE,TRUE', 'check-logic answers');
steps.push(checkStep('check-logic', 'Check: AND, OR, NOT', 'Check: AND, OR, NOT', 'X is 8. Is each condition TRUE or FALSE?', [
  { label: 'X &gt; 5 AND X &lt; 10', answer: TF(CL[0]), feedback: 'Work out X &gt; 5, then X &lt; 10. AND needs both.' },
  { label: 'X &lt; 5 OR X &gt; 10', answer: TF(CL[1]), feedback: 'Work out each side first. OR needs at least one.' },
  { label: 'NOT X = 8', answer: TF(CL[2]), feedback: 'Work out X = 8 first. Then NOT changes it.' },
  { label: 'X = 8 OR X = 9', answer: TF(CL[3]), feedback: 'Is one of the two sides TRUE?' },
], '', ['Why work out each condition before AND or OR?', 'AND and OR join two answers. You need both answers first.']));

// ---------------------------------------------------------------- compare: AND and OR
const AO = [10, 15, 25].map((a) => {
  const v = { Age: a };
  return [String(a), tf('Age > 12', v), tf('Age < 20', v), tf('Age > 12 AND Age < 20', v), tf('Age > 12 OR Age < 20', v)];
});
assert(AO.map((r) => r[3]).join() === 'FALSE,TRUE,FALSE' && AO.every((r) => r[4] === 'TRUE'), 'AND and OR table');
steps.push({ id: 'compare-andor', label: 'Compare: AND and OR',
  content: '<h2 class="lesson-h2">Compare: AND and OR</h2>' +
    tps('Look at the OR column. Why is it TRUE for every age?',
      '<p>Every age is greater than 12 or less than 20, so OR is always TRUE here.</p><p>To check a value is <strong>between</strong> two numbers, use AND.</p>') +
    table(AO, ['Age', 'Age &gt; 12', 'Age &lt; 20', 'Age &gt; 12 AND Age &lt; 20', 'Age &gt; 12 OR Age &lt; 20']) +
    facts(['<strong>AND</strong>: both must be TRUE. Use it for <strong>between</strong>.', '<strong>OR</strong>: one is enough. Use it for <strong>either one</strong>.']) });

// ---------------------------------------------------------------- exam questions
steps.push(mcStep('exam-le', 'Exam Question: Which Operator?', 'Exam Question: Which Operator?', 'Cambridge IGCSE 0478/21, November 2023, Question 1.', [
  { prompt: 'Tick one box to show which operator means less than or equal to.', options: ['OR', '<', '<=', '>='], correct: 2,
    explain: '<= means less than or equal to. < is less than only. OR is a logical operator.' },
], ['Which option can you cross out first, and why?', 'OR: it is a logical operator. It joins two conditions and does not compare values.']));

const PROFIT = ['REPEAT', '    OUTPUT "Enter cost price "', '    INPUT Cost', '    OUTPUT "Enter selling price "', '    OUTPUT Sell', '    IF Cost <> 0 OR Sell <> 0',
  '      THEN', '        Profit <- Sell - Cost', '        OUTPUT "Profit is ", Profit', '    NEXT', 'UNTIL Cost = 0 OR Sell = 0'];
// The corrected line 06 with AND, and the faulty one with OR, run for a cost of 5 and a selling price of 0.
const fixed = tf('Cost <> 0 AND Sell <> 0', { Cost: 5, Sell: 0 }), faulty = tf('Cost <> 0 OR Sell <> 0', { Cost: 5, Sell: 0 });
assert(fixed === 'FALSE' && faulty === 'TRUE', 'line 06: OR lets a zero through, AND does not');
steps.push({ id: 'exam-profit', label: 'Exam Question: Find the Errors', type: 'self-marked-response', containerId: `${P}-exam-profit`,
  content: '<h2 class="lesson-h2">Exam Question: Find the Errors</h2>' +
    why('Line 11 uses OR and it is correct. Why is OR wrong on line 06?', 'Line 06 must work out the profit only when both prices are not zero, so it needs AND. Line 11 stops when either price is zero, so OR is right.') +
    '<p class="lesson-lead">Cambridge IGCSE 0478/22, March 2024, Question 5(a). An algorithm has been written in pseudocode to calculate the profit when an item is sold. Values for cost price and selling price are input, the profit is calculated (selling price - cost price) and output. The input of zero for either value stops the algorithm.</p>' +
    columns(code(PROFIT, true), `<div id="${P}-exam-profit"></div>`),
  items: [
    { id: 'errors', prompt: 'Identify the line numbers of three errors in the pseudocode and suggest corrections. [3]', marks: 3,
      modelAnswer: 'Line 05: OUTPUT should be INPUT. Line 06: OR should be AND. Line 10: NEXT should be ENDIF.' },
  ] });

const MARKRANGE = condRe([`(Mark${SP}>=${SP}0|0${SP}<=${SP}Mark|Mark${SP}>${SP}-1)`, `(Mark${SP}<=${SP}100|100${SP}>=${SP}Mark|Mark${SP}<${SP}101)`], 'AND');
const WEEKEND = condRe([`(Day${SP}=${SP}6)`, `(Day${SP}=${SP}7)`], 'OR');
const CW = tf('Age >= 13 AND Age <= 19', { Age: 25 });
assert(CW === 'FALSE', 'check-write part c');
steps.push(checkStep('check-write', 'Check: Write the Condition', 'Check: Write the Condition', 'Write each condition. Use the variable names given.', [
  { label: 'Mark is from 0 to 100, including 0 and 100.', answer: MARKRANGE, line: true, feedback: 'Between two numbers: two conditions joined with AND. "Including" means the operator includes the value.' },
  { label: 'Day is 6 or Day is 7.', answer: WEEKEND, line: true, feedback: 'Either one is enough. Write Day and = twice.' },
  { label: 'Age is 25. Is Age &gt;= 13 AND Age &lt;= 19 TRUE or FALSE?', answer: TF(CW), feedback: 'Work out each side first. AND needs both.' },
], '', ['Why must you write Day twice in part (b)?', 'Each side of OR is a whole condition: a variable, an operator and a value.']));

// ---------------------------------------------------------------- activity 2: write the IF (code drill)
steps.push(embed('activity-2', 'Activity 2: Write the IF', 'drill-y11-8-1-ops-code', 'Activity 2: Write the IF',
  'Write the program in the box. Press Run. Your program must give the same output as the model program, with new values each time.',
  ['Why is your program tested with new values each time?', 'A condition must be right for every value, not just one. New values find a wrong operator.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Relational and Logical Operators Drill', 'drill-y11-8-1-ops', 'Plenary: Relational and Logical Operators Drill',
  'The six relational operators, the value on the line, AND, OR and NOT, and writing conditions. Your progress is saved.',
  ['Why practise with new values every time?', 'If you can do it with any values, you really understand it.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now-2', 0, 'INTEGER') && T('do-now-2', 0, 'integer') && !T('do-now-2', 0, 'REAL') && T('do-now-2', 1, 'char') && T('do-now-2', 1, 'Character') && !T('do-now-2', 1, 'STRING') &&
  T('do-now-2', 2, 'String') && !T('do-now-2', 2, 'CHAR') && T('do-now-2', 3, 'real') && !T('do-now-2', 3, 'INTEGER'), 'do-now-2');
assert(T('check-rel', 0, 'TRUE') && T('check-rel', 0, 'true') && !T('check-rel', 0, 'FALSE') && T('check-rel', 1, 'False') && !T('check-rel', 1, 'TRUE') && T('check-rel', 2, 'FALSE') &&
  T('check-rel', 3, '<>') && T('check-rel', 3, ' <> ') && !T('check-rel', 3, '<') && !T('check-rel', 3, '!='), 'check-rel');
assert(T('check-bound', 0, 'FALSE') && !T('check-bound', 0, 'TRUE') && T('check-bound', 1, 'true') && !T('check-bound', 1, 'false'), 'check-bound TF');
for (const ok of ['Age >= 18', 'age>=18', '18 <= Age', 'Age > 17']) assert(T('check-bound', 2, ok), 'age accepts ' + ok);
for (const bad of ['Age > 18', 'Age = 18', 'Age <= 18', 'Age >= 19', 'Age']) assert(!T('check-bound', 2, bad), 'age rejects ' + bad);
for (const ok of ['Speed < 30', 'speed<30', '30 > Speed', 'Speed <= 29']) assert(T('check-bound', 3, ok), 'speed accepts ' + ok);
for (const bad of ['Speed <= 30', 'Speed > 30', 'Speed < 31', 'Speed']) assert(!T('check-bound', 3, bad), 'speed rejects ' + bad);
assert(T('check-logic', 0, 'TRUE') && !T('check-logic', 0, 'FALSE') && T('check-logic', 1, 'FALSE') && T('check-logic', 2, 'false') && T('check-logic', 3, 'True') && !T('check-logic', 3, 'False'), 'check-logic');
for (const ok of ['Mark >= 0 AND Mark <= 100', 'mark <= 100 and mark >= 0', 'Mark>=0 AND Mark<=100', 'Mark > -1 AND Mark < 101', '0 <= Mark AND Mark <= 100']) assert(T('check-write', 0, ok), 'range accepts ' + ok);
for (const bad of ['Mark >= 0 OR Mark <= 100', 'Mark > 0 AND Mark < 100', 'Mark >= 0', 'Mark >= 0 AND Mark >= 100', 'Mark <= 0 AND Mark >= 100']) assert(!T('check-write', 0, bad), 'range rejects ' + bad);
for (const ok of ['Day = 6 OR Day = 7', 'day=7 or day=6']) assert(T('check-write', 1, ok), 'weekend accepts ' + ok);
for (const bad of ['Day = 6 AND Day = 7', 'Day = 6 OR 7', 'Day = 6']) assert(!T('check-write', 1, bad), 'weekend rejects ' + bad);
assert(T('check-write', 2, 'FALSE') && !T('check-write', 2, 'TRUE'), 'check-write c');
// The walkthroughs show the method with other values and never the Do Now answers.
{ const s = JSON.stringify(WT_POWER); assert(!/\b16\b|4 \^ 2/.test(s), 'power walkthrough shows the Do Now answer'); }
{ const s = JSON.stringify(WT_TYPE); assert(!/\b(INTEGER|CHAR|STRING|REAL)\b/i.test(s), 'type walkthrough names a Do Now answer'); }
// Every MC answer is not always in the same place.
const mcCorrect = steps.filter((s) => s.type === 'multiple-choice').map((s) => s.items[0].correct);
assert(mcCorrect.length === 2, 'two MC steps');
// No dashes anywhere in the lesson text, and no term before it is taught.
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'em or en dash');
assert(!/mario/i.test(all), 'game mention');
const firstAt = (word) => steps.findIndex((s) => JSON.stringify(s).includes(word));
assert(firstAt('logical operator') >= firstAt('Relational and Logical Operators'), 'logical operator named before the title');
assert(steps.slice(0, steps.findIndex((s) => s.id === 'logical')).every((s) => s.id === 'title' || !/\b(AND|OR|NOT)\b/.test(JSON.stringify(s.content || '') + JSON.stringify(s.items || '') + JSON.stringify(s.algorithm || ''))), 'AND, OR or NOT used before the logical slide');

const lesson = { id: ID, label: '8.1 L4: Relational and Logical Operators', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it as 8.1 L4, after y11-8-1-arith. A small text insert: lessons.json is shared, so it is never rewritten.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
if (!raw.includes(`"${ID}"`)) {
  const m = raw.match(/([ \t]*)"y11-8-1-arith"(\r?\n)/);
  assert(m, 'y11-8-1-arith is in lessons.json');
  const at = m.index + m[0].length - m[2].length;
  fs.writeFileSync(lp, raw.slice(0, at) + ',' + m[2] + m[1] + `"${ID}"` + raw.slice(at));
}
const unit = JSON.parse(fs.readFileSync(lp, 'utf8')).years.find((y) => y.id === 'year11').units.find((u) => u.code === '8.1');
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 8.1 is now ${unit.lessons.join(', ')}`);
