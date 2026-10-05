// Builds LessonData/y9-2-6-errors.json: Year 9, 2.6 Errors and Trace Tables, and registers it in the Year 9
// "Algorithm Design and Text Programming" unit after 2.3.
//   node tools/build_y9_2_6.mjs
// Term 1a plan item 2.6: syntax errors and logic errors, and using a trace table to find a logic error, then
// fixing it. Only what Year 9 has met: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT, IF ... THEN ...
// ELSE ... ENDIF (IF ... THEN on one line) and one-dimensional arrays from index 1. No STEP, MOD, DIV, WHILE or REPEAT.
// EAL-light shape (James, 2026-09-30): short sentences, a teacher-only Think, Pair, Share under every heading,
// predict-then-reveal, compare slides. Do Now: a real data type question and a 2.3 array question, then the Do Now
// Extension drill (James, 2026-10-02). The exam question is adapted from a real paper and cited; the other checks are
// 0478 style with no citation (James agreed for Year 9, 2026-09-28). Activities: a Trace Tables trace of a program
// with a logic error, and the y9-2-6-code drill (fix the program). Plenary: the y9-2-6-errors drill.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-2-6-errors';
const P = 'y9l26';
const A = '&larr;';
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
const cell = 'padding:5px 12px;text-align:center;font:700 17px var(--font-mono, monospace)';
function arrayTable(name, values) {
  return `<p style="margin:0 0 6px"><strong>${name}</strong></p><table class="donow-table" style="margin:0 0 4px">` +
    `<tr><th style="${cell};text-align:left">Index</th>${values.map((v, i) => `<td style="${cell};color:var(--muted)">${i + 1}</td>`).join('')}</tr>` +
    `<tr><th style="${cell};text-align:left">Value</th>${values.map((v) => `<td style="${cell}">${v}</td>`).join('')}</tr></table>`;
}
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%">' +
  '<tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';
const label = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;

const validators = {};
function checkStep(id, lbl, heading, lead, parts, whyQ = null, extra = '') {
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
  return { id, label: lbl, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, lbl, heading, lead, items, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label: lbl, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, `<div id="${cid}"></div>`) : `<div id="${cid}"></div>`), items };
}
function selfMarked(id, lbl, heading, lead, items, whyQ) {
  return { id, label: lbl, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, lbl, appId, heading, lead, whyQ) {
  return { id, label: lbl, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const num = (n, unit = '') => `^\\s*${n}${unit ? `(\\s*${unit})?` : ''}\\s*\\.?\\s*$`;
const word = (w) => `^\\s*["']?\\s*${w}\\s*["']?\\s*\\.?\\s*$`;
const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
// Each walkthrough step is { text, visual }: one short sentence, and a picture with the part that matters marked
// .wt-hl (the shell's lesson-engine.html draws it in a panel inside the slide). It uses different numbers from the
// slide's own question, so it shows the method and never the answer.
const PV = [128, 64, 32, 16, 8, 4, 2, 1];
const wcell = 'padding:6px 10px;text-align:center;font:700 18px var(--font-mono, monospace);min-width:38px';
function pvTable(bits, hl = []) {
  const c = (i) => (hl.includes(i) ? ' class="wt-hl"' : '');
  return '<table class="donow-table"><tr><th style="' + wcell + ';text-align:left">Place value</th>' + PV.map((v, i) => `<th${c(i)} style="${wcell}">${v}</th>`).join('') + '</tr>' +
    '<tr><th style="' + wcell + ';text-align:left">Bit</th>' + PV.map((v, i) => `<td${c(i)} style="${wcell}">${bits[i] == null ? '' : bits[i]}</td>`).join('') + '</tr></table>';
}
const note = (t) => `<div class="wt-note">${t}</div>`;
function arrWT(name, values, idxHL = [], valHL = []) {
  return `<div><p style="margin:0 0 6px;text-align:center"><strong>${name}</strong></p><table class="donow-table">` +
    `<tr><th style="${wcell};text-align:left">Index</th>${values.map((v, i) => `<td${idxHL.includes(i + 1) ? ' class="wt-hl"' : ''} style="${wcell};color:var(--muted)">${i + 1}</td>`).join('')}</tr>` +
    `<tr><th style="${wcell};text-align:left">Value</th>${values.map((v, i) => `<td${valHL.includes(i + 1) ? ' class="wt-hl"' : ''} style="${wcell}">${v}</td>`).join('')}</tr></table></div>`;
}
function codeWT(lines, hl = []) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = esc(l.trim()).replace(/&amp;larr;/g, A).replace(/&lt;-/g, A);
    return `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">` + String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' + '&nbsp;'.repeat(lead) + text + '</div>';
  }).join('') + '</div>';
}
// Do Now 1 (denary to 8-bit binary), worked with 75: 01001011.
const WT_BINARY = { title: 'Walk me through it: denary to 8-bit binary', steps: [
  { text: 'We will change <strong>75</strong> into 8-bit binary. Your question uses different numbers, so you still do the working yourself.', visual: '<div class="wt-big">75</div>' },
  { text: 'Write the 8 place values. Start with 1 on the right. Each one is <strong>double</strong> the one next to it.', visual: pvTable([], [0, 1, 2, 3, 4, 5, 6, 7]) },
  { text: 'Start on the left. Is 128 bigger than 75? <strong>Yes</strong>, so it does not fit. Write <strong>0</strong>.', visual: pvTable(['0'], [0]) + note('Left: 75') },
  { text: 'Does 64 fit into 75? <strong>Yes.</strong> Write <strong>1</strong>. Take it away: 75 - 64 = 11.', visual: pvTable(['0', '1'], [1]) + note('Left: 11') },
  { text: 'Does 32 fit into 11? <strong>No</strong>: write 0. Does 16 fit into 11? <strong>No</strong>: write 0.', visual: pvTable(['0', '1', '0', '0'], [2, 3]) + note('Left: 11') },
  { text: 'Does 8 fit into 11? <strong>Yes.</strong> Write <strong>1</strong>. Take it away: 11 - 8 = 3.', visual: pvTable(['0', '1', '0', '0', '1'], [4]) + note('Left: 3') },
  { text: 'Does 4 fit into 3? <strong>No</strong>: write 0. Does 2 fit into 3? <strong>Yes</strong>: write 1. 3 - 2 = 1.', visual: pvTable(['0', '1', '0', '0', '1', '0', '1'], [5, 6]) + note('Left: 1') },
  { text: 'Does 1 fit into 1? <strong>Yes.</strong> Write <strong>1</strong>. Nothing is left, so we are done.', visual: pvTable(['0', '1', '0', '0', '1', '0', '1', '1'], [7]) + note('Left: 0') },
  { text: 'Read the bits from left to right: <strong>01001011</strong>. Count them: there must be 8.', visual: pvTable(['0', '1', '0', '0', '1', '0', '1', '1'], [0, 1, 2, 3, 4, 5, 6, 7]) },
  { text: 'Check: add the place values that have a 1. 64 + 8 + 2 + 1 = 75. It matches. Now do the same for each number in your question.', visual: pvTable(['0', '1', '0', '0', '1', '0', '1', '1'], [1, 4, 6, 7]) },
] };
// Do Now 2 (read an array, then total it in a loop), worked with Scores = 5, 2, 7, 4: Scores[3] = 7, total 18.
const WS = [5, 2, 7, 4];
const WPROG = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 4', '    Total <- Total + Scores[Index]', 'NEXT Index', 'OUTPUT Total'];
const WT_ARRAY = { title: 'Walk me through it: arrays and a loop', steps: [
  { text: 'This is a different array, called <strong>Scores</strong>. Your question uses Marks, so you still do the working yourself.', visual: arrWT('Scores', WS) },
  { text: 'The top row is the <strong>index</strong>: the position, 1, 2, 3, 4.', visual: arrWT('Scores', WS, [1, 2, 3, 4]) },
  { text: 'The bottom row is the <strong>value</strong> stored at each position.', visual: arrWT('Scores', WS, [], [1, 2, 3, 4]) },
  { text: '<strong>OUTPUT Scores[3]</strong> means: go to index 3.', visual: arrWT('Scores', WS, [3]) + codeWT(['OUTPUT Scores[3]'], [1]) },
  { text: 'Read the value under index 3. It is <strong>7</strong>. So OUTPUT Scores[3] outputs 7.', visual: arrWT('Scores', WS, [3], [3]) + codeWT(['OUTPUT Scores[3]'], [1]) },
  { text: 'Now the loop. Line 3 sets Total to <strong>0</strong> before the loop starts.', visual: codeWT(WPROG, [3]) + note('Total = 0') },
  { text: 'Line 4: the loop runs with Index = 1, then 2, then 3, then 4.', visual: codeWT(WPROG, [4]) + note('Total = 0') },
  { text: 'Index = 1. Line 5 adds Scores[1], which is 5. Total = 0 + 5 = <strong>5</strong>.', visual: arrWT('Scores', WS, [1], [1]) + codeWT(WPROG, [5]) + note('Total = 5') },
  { text: 'Index = 2. Add Scores[2], which is 2. Total = 5 + 2 = <strong>7</strong>.', visual: arrWT('Scores', WS, [2], [2]) + codeWT(WPROG, [5]) + note('Total = 7') },
  { text: 'Index = 3. Add Scores[3], which is 7. Total = 7 + 7 = <strong>14</strong>.', visual: arrWT('Scores', WS, [3], [3]) + codeWT(WPROG, [5]) + note('Total = 14') },
  { text: 'Index = 4. Add Scores[4], which is 4. Total = 14 + 4 = <strong>18</strong>.', visual: arrWT('Scores', WS, [4], [4]) + codeWT(WPROG, [5]) + note('Total = 18') },
  { text: 'The loop has finished. Line 7 outputs Total: <strong>18</strong>. Now do the same with Marks in your question.', visual: codeWT(WPROG, [7]) + note('Output: 18') },
] };

// ---------------------------------------------------------------- Do Now (2.3) and its extension
steps.push({ id: 'do-now', label: 'Do Now: Question 1', type: 'exam-do-now', questionSetKey: 'y10-1-1-l2-2', walkthrough: WT_BINARY,
  content: '<h2 class="lesson-h2">Do Now</h2>' + why('How do you check a binary answer?', 'Convert it back: add up the place values that have a 1 under them.') +
    '<p class="lesson-lead">A recap question from Number Systems.</p><div id="donow-root"></div>' });
const DN = [4, 9, 2, 7];
steps.push(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: Arrays', 'From 2.3 Arrays. The array Marks holds the values in the table.', [
  { label: 'What does OUTPUT Marks[2] output?', answer: num(9), feedback: 'Go to index 2 in the top row and read the value under it.' },
  { label: 'What does the program on the right output?', answer: num(22), feedback: 'Total starts at 0. Each pass adds the next value in Marks.' },
], ['Why does the loop go from 1 TO 4?', 'Marks has 4 elements, at index 1 to index 4.'],
  arrayTable('Marks', DN) + codeBlock(['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 4', '    Total <- Total + Marks[Index]', 'NEXT Index', 'OUTPUT Total'])));
steps[steps.length - 1].walkthrough = WT_ARRAY;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-2-6-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.2 Loops and 2.3 Data Types and Arrays. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Errors and Trace Tables',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithm Design and Text Programming</p><h2 class="lesson-h2">Errors and Trace Tables</h2><p>Year 9, 2.6</p></div>' +
    facts(['<strong>Today:</strong> two kinds of error, and how to find them.',
      '<strong>You already know:</strong> FOR loops, IF, arrays and trace tables.',
      '<strong>Activities:</strong> trace a program to find its error, then fix programs and run them.']) +
    why('A program runs but gives the wrong answer. Is that still an error?', 'Yes. A program can run and still be wrong. Today we learn to find both kinds of error.') });

// ---------------------------------------------------------------- two kinds of error: compare, predict then reveal
const TOTAL4 = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    Total <- Total + Count', 'NEXT Count'];
steps.push({ id: 'two-errors', label: 'Two Kinds of Error',
  content: '<h2 class="lesson-h2">Two Kinds of Error</h2>' +
    tps('Predict: both programs should output 10. Which one will not run at all? Which one runs but gives the wrong answer?',
      '<p><strong>A</strong> will not run: OUTPT is not a keyword. That is a <strong>syntax error</strong>.</p><p><strong>B</strong> runs, but it multiplies, so Total stays 0. That is a <strong>logic error</strong>.</p>', 'Show the worked answer') +
    columns(label('A') + codeBlock(TOTAL4.concat(['OUTPT Total'])) + facts(['<strong>Syntax error:</strong> a line breaks the rules of the language.', 'The program <strong>will not run</strong>.']),
      label('B') + codeBlock(['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    Total <- Total * Count', 'NEXT Count', 'OUTPUT Total']) +
      facts(['<strong>Logic error:</strong> the program runs.', 'But the <strong>answer is wrong</strong>.'])) });

steps.push(mcStep('hinge-1', 'Hinge Question: Which Error Is Which?', 'Hinge Question: Which Error Is Which?', 'Each line has one error. Choose the best answer.', [
  { prompt: 'This loop should run 5 times. Which line RUNS, but gives the wrong answer (a logic error)?',
    options: ['OUTPT Count', 'FOR Count ← 1 5', 'FOR Count ← 1 TO 4', 'DECLARE Count INTEGER'], correct: 2,
    explain: 'FOR Count ← 1 TO 4 follows the rules, so it runs, but it runs 4 times. The other three break the rules, so they will not run.' },
  { prompt: 'Total should be Total + Count. Which line will NOT run at all (a syntax error)?',
    options: ['Total ← Total - Count', 'Total ← Total * Count', 'Total Total + Count', 'Total ← Count + 1'], correct: 2,
    explain: 'Total Total + Count is missing the arrow, so it breaks the rules. The other three run, but give the wrong answer.' },
], ['Which kind of error is harder to find? Why?', 'A logic error. The program runs, so nothing tells you it is wrong. You have to check the answer.']));

// ---------------------------------------------------------------- a trace table finds a logic error: predict then reveal
const RESET = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'FOR Count <- 1 TO 4', '    Total <- 0', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
steps.push({ id: 'trace-finds', label: 'A Trace Table Finds the Error',
  content: '<h2 class="lesson-h2">A Trace Table Finds the Error</h2>' +
    tps('Predict: this should output 10. What is Total after each pass? What does it really output?',
      '<p>Total is 1, then 2, then 3, then 4. It outputs <strong>4</strong>.</p><p>Line 4 sets Total back to 0 on every pass. It belongs <strong>before</strong> the loop.</p>', 'Show the worked answer') +
    columns(codeBlock(RESET, true),
      table([['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], ['Count', 'Total after the pass']) +
      facts(['A trace table shows every value, one line at a time.', 'You can see the moment it goes wrong.'])) });

// ---------------------------------------------------------------- worked method: find and fix (modelled)
steps.push({ id: 'how-to-fix', label: 'How to Find and Fix an Error',
  content: '<h2 class="lesson-h2">How to Find and Fix an Error</h2>' +
    tps('Why do you need to know what the program SHOULD do before you trace it?', 'You find a logic error by comparing what it should do with what it really does. Without the first, you cannot see the difference.') +
    columns('<ol class="lesson-facts">' +
      '<li><strong>Say</strong> what the program should output.</li>' +
      '<li><strong>Trace</strong> it exactly as it is written.</li>' +
      '<li><strong>Find</strong> the first line where the trace goes wrong.</li>' +
      '<li><strong>Fix</strong> that line, then trace or run it again.</li></ol>' +
      facts(['A syntax error is easier: the program stops and the error message names the line.']),
      '<p style="margin:0 0 6px;font-weight:700">Worked example: the program on the last slide</p>' +
      table([['1. Say', 'It should output 10.'], ['2. Trace', 'Total is 1, 2, 3, 4. It outputs 4.'], ['3. Find', 'Line 4 sets Total to 0 on every pass.'], ['4. Fix', 'Move Total &larr; 0 to before the FOR line.']], ['Step', 'What I did']) +
      '<p style="margin:8px 0 0"><strong>In the exam, write:</strong> Line 4: Total &larr; 0 should come before the FOR loop.</p>') });

// ---------------------------------------------------------------- activity 1: trace a program with a logic error
const BOUND = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
steps.push({ id: 'activity-1', label: 'Activity 1: Trace and Find the Error', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Find the Logic Error',
    context: 'This program should add up the numbers 1 to 5 and output 15. Trace it exactly as it is written. What does it really output?',
    code: ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total = 0', 'for Count in range(1, 5):', '    Total = Total + Count', 'print(Total)'],
    cols: ['Line', 'Total', 'Count', 'Output'],
    answers: [
      { Line: '3', Total: '0', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '1', Output: '' }, { Line: '5', Total: '1', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '2', Output: '' }, { Line: '5', Total: '3', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '3', Output: '' }, { Line: '5', Total: '6', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '4', Output: '' }, { Line: '5', Total: '10', Count: '', Output: '' },
      { Line: '6', Total: '', Count: '', Output: '10' },
    ],
  },
  content: `<h2 class="lesson-h2">Activity 1: Trace and Find the Error</h2>` +
    why('Step 1: what SHOULD this program output? Predict, then trace to check.', 'It should output 1 + 2 + 3 + 4 + 5 = 15. The trace shows what it really outputs.') +
    `<p class="lesson-lead">Trace the program. Then answer the questions on the next slide.</p><div id="${P}-embed-1" class="lesson-embed"></div>` });

steps.push(checkStep('fix-check', 'Check: Fix the Error', 'Check: Fix the Error', 'This program should add up the numbers 1 to 5. Use your trace table.', [
  { label: 'What does the program really output?', answer: num(10), feedback: 'Look at the Output column of your trace table.' },
  { label: 'What should it output?', answer: num(15), feedback: 'Add 1 + 2 + 3 + 4 + 5.' },
  { label: 'Which line has the error? (Use the line numbers.)', answer: '^\\s*(line\\s*)?0?4\\s*\\.?\\s*$', feedback: 'Which line decides how many times the loop runs?' },
  { line: true, label: 'Write the correct line.', answer: '^\\s*for\\s+count\\s*(<-|←)\\s*1\\s+to\\s+5\\s*$', feedback: 'Keep the FOR line the same. Change only the last number.' },
], ['Is this a syntax error or a logic error? How do you know?', 'A logic error. The program runs and outputs a number, but the number is wrong.'], codeBlock(BOUND, true)));

// ---------------------------------------------------------------- compare: > or >= (a boundary logic error)
steps.push({ id: 'compare-boundary', label: 'Compare: More Than, or More Than or Equal?',
  content: '<h2 class="lesson-h2">Compare: More Than, or More Than or Equal?</h2>' +
    tps('The pass mark is 50 or more. Mark is 50. Predict what A and B output. Which one has a logic error?',
      '<p><strong>A</strong> outputs <strong>Fail</strong>: 50 is not more than 50.</p><p><strong>B</strong> outputs <strong>Pass</strong>: 50 is equal to 50. A has the logic error.</p>', 'Show the worked answer') +
    columns(label('A') + codeBlock(['Mark <- 50', 'IF Mark > 50 THEN', '    OUTPUT "Pass"', 'ELSE', '    OUTPUT "Fail"', 'ENDIF']),
      label('B') + codeBlock(['Mark <- 50', 'IF Mark >= 50 THEN', '    OUTPUT "Pass"', 'ELSE', '    OUTPUT "Fail"', 'ENDIF'])) +
    facts(['&gt; means more than. &gt;= means more than <strong>or equal to</strong> (from 2.2).', 'Logic errors often hide here: try the value exactly on the line, 50.']) });

// ---------------------------------------------------------------- exam question (adapted, cited)
const RUN = ['DECLARE Runners : ARRAY[1:250] OF STRING', 'DECLARE Times : ARRAY[1:250] OF INTEGER', 'DECLARE RunName : STRING', 'DECLARE RunTime : STRING',
  'DECLARE Index : INTEGER', 'FOR Index <- 1 TO 250', '    INPUT RunName', '    OUTPUT RunTime', '    Runners[Index] <- RunTime', '    Times[Index] <- RunTime', 'NEXT Index'];
steps.push(checkStep('exam-runners', 'Exam Question: Find the Errors', 'Exam Question: Find the Errors',
  'Adapted from Cambridge IGCSE 0478/23, May/June 2026, Question 4(a). This algorithm should input the name and the finish time, in whole seconds, of 250 runners and store them in the arrays Runners and Times. It has three errors.', [
    { label: 'Line 4: write the correct data type for RunTime.', answer: '^\\s*(integer|int)\\s*\\.?\\s*$', feedback: 'A finish time in whole seconds is a whole number.' },
    { label: 'Line 8: write the keyword that should replace OUTPUT.', answer: word('input'), feedback: 'The time must come IN to the program from the user.' },
    { label: 'Line 9: write the variable that should be stored in Runners[Index].', answer: word('runname'), feedback: 'Runners stores names. Which variable holds the name?' },
  ], ['Why does the question tell you what the algorithm should do?', 'To find an error, you compare what each line does with what the algorithm should do.'], codeBlock(RUN, true)));

// ---------------------------------------------------------------- hinge before Activity 2: choosing the fix
const ADD2 = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    Total <- Total + 2', 'NEXT Count', 'OUTPUT Total'];
steps.push(mcStep('hinge-2', 'Hinge Question: Choose the Fix', 'Hinge Question: Choose the Fix', 'This program should add up 1 to 4 and output 10. It outputs 8.', [
  { prompt: 'Which change fixes it?',
    options: ['Change Total + 2 to Total + Count', 'Change TO 4 to TO 5', 'Move Total ← 0 inside the loop', 'Change OUTPUT Total to OUTPUT Count'], correct: 0,
    explain: 'Each pass should add Count (1, 2, 3, 4), not 2. The loop already runs the right number of times.' },
], ['How can you check your fix before you run it?', 'Trace it: 0 + 1 + 2 + 3 + 4 = 10, which is what it should output.'], codeBlock(ADD2, true)));

// ---------------------------------------------------------------- activity 2: fix the program (code drill)
steps.push(embed('activity-2', 'Activity 2: Fix the Program', 'drill-y9-2-6-code', 'Activity 2: Fix the Program',
  'Each program has one error. It is already in the box. Find the error, fix it, then press Run and check.',
  ['A syntax error stops the program. How do you know when you have fixed one?', 'The program runs. For a logic error, it must also give the right answer.']));

// ---------------------------------------------------------------- exam-style question, self-marked
steps.push(selfMarked('exam-explain', 'Exam-Style Question: Two Kinds of Error', 'Exam-Style Question: Two Kinds of Error',
  'Use the words syntax and logic in your answer.', [
    { id: 'two-kinds', prompt: 'Describe the difference between a syntax error and a logic error. [2]', marks: 2,
      modelAnswer: 'A syntax error breaks the rules of the programming language, so the program will not run. A logic error does not stop the program running, but it gives the wrong result.' },
  ], ['This question has 2 marks. What do you need to say?', 'One point about a syntax error (breaks the rules, will not run) and one about a logic error (runs, wrong result).']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Errors and Trace Tables Drill', 'drill-y9-2-6-errors', 'Plenary: Errors and Trace Tables Drill',
  'Syntax or logic, find the line, follow a program with a bug, and fix the line. Your progress is saved.',
  ['Why follow a program with a bug exactly as it is written?', 'To see what it really does. That shows you where it goes wrong.']));

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now-2', 0, '9') && !V('do-now-2', 0, '2') && V('do-now-2', 1, '22') && !V('do-now-2', 1, '21'), 'do-now-2');
assert(V('fix-check', 0, '10') && V('fix-check', 1, '15') && V('fix-check', 2, '4') && V('fix-check', 2, 'line 4') && !V('fix-check', 2, '5'), 'fix-check numbers');
assert(V('fix-check', 3, 'FOR Count <- 1 TO 5') && V('fix-check', 3, 'for count ← 1 to 5') && !V('fix-check', 3, 'FOR Count <- 1 TO 4'), 'fix-check line');
assert(V('exam-runners', 0, 'INTEGER') && !V('exam-runners', 0, 'STRING') && V('exam-runners', 1, 'input') && V('exam-runners', 2, 'RunName') && !V('exam-runners', 2, 'RunTime'), 'exam-runners');
assert(DN[1] === 9 && DN.reduce((a, b) => a + b) === 22, 'do-now values');
// The walkthroughs show the method with other numbers and never the Do Now answers.
{ const s = JSON.stringify(WT_BINARY); assert(!s.includes('10100111') && !s.includes('11010110'), 'binary walkthrough leaks an answer'); }
{ const s = WT_ARRAY.steps.map((x) => x.text).join(' '); assert(!/\b22\b/.test(s) && !/\b9\b/.test(s), 'array walkthrough leaks an answer'); }
assert((75).toString(2).padStart(8, '0') === '01001011' && WS[2] === 7 && WS.reduce((a, b) => a + b) === 18, 'walkthrough numbers');
{ let t = 0; const run = [1, 2, 3, 4].map((c) => (t += c)); assert(run.join() === '1,3,6,10' && t === 10, 'activity-1 trace'); }
assert([1, 2, 3, 4, 5].reduce((a, b) => a + b) === 15, 'should output 15');

const lesson = { id: ID, label: '2.6: Errors and Trace Tables', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 9, after 2.3 in the Algorithm Design and Text Programming unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y9 = all.years.find((y) => y.id === 'year9');
const unit = y9.units.find((u) => u.title === 'Algorithm Design and Text Programming');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y9-2-3-arrays') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; unit: ${unit.lessons.join(', ')}`);
