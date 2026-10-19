// Builds LessonData/y9-3-1-pseudocode.json: Year 9, 3.1 Following and Correcting Pseudocode, its three drills
// (Drills/data/y9-3-1-ext.js, y9-3-1-code.js, y9-3-1-pseudocode.js), and registers the lesson as the first lesson of
// the Year 9 "Pseudocode and Software Development" unit (Term 1b).
//   node tools/build_y9_3_1.mjs
// Objective 9CT.01: follow and understand pseudocode line by line; edit and correct pseudocode so that it produces
// the intended result. Only what Year 9 has met: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT, IF ... THEN
// ... ELSE ... ENDIF (IF ... THEN on one line), one-dimensional arrays from index 1. No WHILE, REPEAT, STEP, MOD, DIV.
// Term 1b rule (James, 2026-10-18): every slide's core question is a WHY. Predict-then-explain, compare slides, and
// checks that ask for reasons. Targets the 2.6 race and Term 1a test weak spots: following code as written, the
// value on the line (> and >=), blaming the line where the wrong output shows, the IF inside the loop with a counter,
// and OUTPUT that should be INPUT.
// Every output, trace value and answer on a slide is worked out here by shared/pseudocode-engine.js; the drills
// compute theirs with the same engine when each card is drawn. The drill files are written from the functions
// below (their source text is copied as it is), then loaded and drawn many times as a self-check.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-3-1-pseudocode';
const P = 'y9l31';
const A = '&larr;';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
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
    const text = esc(l.trim()).replace(/&lt;-/g, A);
    const n = numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : '';
    return '<div class="lesson-code-line">' + n + '&nbsp;'.repeat(lead) + text + '</div>';
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
const plain = (l) => l.replace(/<-/g, '←');
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- the engine
// arrays: { Name: [values] } are stored straight after the line that DECLAREs them (the slide shows the values in a
// table instead). inputs: the values typed in, one per INPUT. watch: [lineNo, expr] records expr each time that line
// has run (marked outputs, removed from the program's own outputs).
const MARK = '#watch#';
function runProg(lines, { arrays = {}, inputs = [], watch = null } = {}) {
  let src = lines.slice();
  if (watch) src.splice(watch[0], 0, `OUTPUT "${MARK}"`, `OUTPUT ${watch[1]}`);
  for (const [name, vals] of Object.entries(arrays)) {
    const at = src.findIndex((l) => new RegExp(`^\\s*DECLARE\\s+${name}\\s*:\\s*ARRAY`).test(l));
    assert(at >= 0, `array ${name} is declared`);
    src.splice(at + 1, 0, ...vals.map((v, i) => `${name}[${i + 1}] <- ${v}`));
  }
  const r = runPseudocode(src.join('\n'), {}, 20000, inputs.map(String));
  if (r.error) return { error: r.error.message, outputs: [], watched: [] };
  const outputs = [], watched = [];
  for (let i = 0; i < r.outputs.length; i++) {
    if (r.outputs[i] === MARK) { watched.push(String(r.outputs[i + 1])); i++; } else outputs.push(String(r.outputs[i]));
  }
  return { error: null, outputs, watched, vars: r.vars };
}
function out(lines, opts) { const r = runProg(lines, opts); assert(!r.error, `program runs: ${r.error}\n${lines.join('\n')}`); return r.outputs; }
function watch(lines, lineNo, expr, opts = {}) { const r = runProg(lines, { ...opts, watch: [lineNo, expr] }); assert(!r.error, 'watch runs: ' + r.error); return r.watched; }
const one = (lines, opts) => { const o = out(lines, opts); assert(o.length === 1, 'one output: ' + o.join()); return o[0]; };

// ---------------------------------------------------------------- slide helpers
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
const num = (n) => `^\\s*${n}\\s*\\.?\\s*$`;
const lineRe = (n) => `^\\s*(line\\s*)?0?${n}\\s*\\.?\\s*$`;
const word = (w) => `^\\s*["']?\\s*${w}\\s*["']?\\s*\\.?\\s*$`;
const ARW = '\\s*(<-|←|&larr;)\\s*';
// An IF line typed by the student: "IF Score >= 30 THEN", also "> 29", the value first, THEN optional.
function ifRe(v, alts) {
  return `^\\s*if\\s+(${alts.map(([op, n]) => `${v}\\s*${op.replace(/[<>]/g, (c) => c)}\\s*${n}`).join('|')})\\s*(then)?\\s*\\.?\\s*$`;
}
const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
const wcell = 'padding:6px 10px;text-align:center;font:700 18px var(--font-mono, monospace);min-width:38px';
const note = (t) => `<div class="wt-note">${t}</div>`;
function codeWT(lines, hl = []) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = esc(l.trim()).replace(/&lt;-/g, A);
    return `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">` + String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' + '&nbsp;'.repeat(lead) + text + '</div>';
  }).join('') + '</div>';
}

// ---------------------------------------------------------------- Do Now 1: a slow trace, exactly as written
const DN1 = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 3 TO 6', '    Total <- Total + 3', 'NEXT Count', 'OUTPUT Total'];
const DN1_PASS = watch(DN1, 5, 'Total');
const DN1_OUT = one(DN1);
const DN1_MEANT = [3, 4, 5, 6].reduce((a, b) => a + b);
assert(DN1_PASS.length === 4 && DN1_OUT !== String(DN1_MEANT), 'Do Now 1 has a bug that changes the output');
const WT1P = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 2 TO 4', '    Total <- Total + 10', 'NEXT Count', 'OUTPUT Total'];
const WT1 = watch(WT1P, 5, 'Total'), WT1_OUT = one(WT1P);
const WT_TRACE = { title: 'Walk me through it: follow a loop exactly as written', steps: [
  { text: 'This is a similar program. It <strong>should</strong> add up 2, 3 and 4. We follow what each line <strong>says</strong>, not what it should do.', visual: codeWT(WT1P) },
  { text: 'Line 3 sets Total to <strong>0</strong>, once, before the loop.', visual: codeWT(WT1P, [3]) + note('Total = 0') },
  { text: 'Line 4: Count will be 2, then 3, then 4. That is <strong>3 passes</strong>.', visual: codeWT(WT1P, [4]) + note('Total = 0') },
  { text: `Pass 1, Count = 2. Line 5 says add <strong>10</strong>, not Count. Total = 0 + 10 = <strong>${WT1[0]}</strong>.`, visual: codeWT(WT1P, [5]) + note(`Total = ${WT1[0]}`) },
  { text: `Pass 2, Count = 3. Line 5 still adds 10. Total = ${WT1[0]} + 10 = <strong>${WT1[1]}</strong>.`, visual: codeWT(WT1P, [5]) + note(`Total = ${WT1[1]}`) },
  { text: `Pass 3, Count = 4. Total = ${WT1[1]} + 10 = <strong>${WT1[2]}</strong>.`, visual: codeWT(WT1P, [5]) + note(`Total = ${WT1[2]}`) },
  { text: `The loop ends. Line 7 outputs <strong>${WT1_OUT}</strong>. It should be 9, but the computer only does what line 5 says. Now trace your program the same way.`, visual: codeWT(WT1P, [7]) + note(`Output: ${WT1_OUT}`) },
] };
steps.push(checkStep('do-now', 'Do Now: Question 1', 'Do Now: Follow the Loop', 'From 2.2 Loops and 2.6 Trace Tables. This program should add up 3, 4, 5 and 6. Follow it exactly as it is written.', [
  { label: 'What is Total after the first pass?', answer: num(DN1_PASS[0]), feedback: 'Count is 3 on the first pass. What does line 5 add?' },
  { label: 'What is Total after the second pass?', answer: num(DN1_PASS[1]), feedback: 'Read line 5 again. Does it add Count, or something else?' },
  { label: 'What does the program output?', answer: num(DN1_OUT), feedback: 'Follow every pass. The computer does what line 5 says, not what the program should do.' },
], ['Why must you follow what each line says, not what the program should do?', 'The computer cannot see what we meant. It only does what each line says, one line at a time.'], codeBlock(DN1, true)));
steps[steps.length - 1].walkthrough = WT_TRACE;

// ---------------------------------------------------------------- Do Now 2: the value on the line, with a counter
const DN2 = ['DECLARE Score : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Wins : INTEGER', 'Wins <- 0', 'FOR Count <- 1 TO 4', '    INPUT Score',
  '    IF Score > 30 THEN', '        Wins <- Wins + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Wins'];
const DN2_IN = [30, 45, 12, 31];
const DN2_OUT = one(DN2, { inputs: DN2_IN });
const DN2_FIXED = DN2.map((l) => l.replace('Score > 30', 'Score >= 30'));
assert(one(DN2_FIXED, { inputs: DN2_IN }) !== DN2_OUT, 'the value on the line changes the Do Now 2 count');
const DN2_TF = one(['DECLARE Score : INTEGER', 'Score <- 30', 'IF Score > 30 THEN', '    OUTPUT "TRUE"', 'ELSE', '    OUTPUT "FALSE"', 'ENDIF']);
const WT2P = ['DECLARE Temp : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Hot : INTEGER', 'Hot <- 0', 'FOR Count <- 1 TO 3', '    INPUT Temp',
  '    IF Temp > 25 THEN', '        Hot <- Hot + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Hot'];
const WT2_IN = [25, 19, 32];
const WT2_HOT = watch(WT2P, 8, 'Hot', { inputs: WT2_IN });
const WT2_OUT = one(WT2P, { inputs: WT2_IN });
assert(WT2_HOT.length === 1 && WT2_OUT === WT2_HOT[0], 'walkthrough 2 counts one day');
const WT_BOUND = { title: 'Walk me through it: the value on the line', steps: [
  { text: 'A similar program. A hot day is <strong>25 or more</strong>. The user types 25, then 19, then 32.', visual: codeWT(WT2P) },
  { text: 'Line 4 sets Hot to <strong>0</strong>, once, before the loop.', visual: codeWT(WT2P, [4]) + note('Hot = 0') },
  { text: 'Pass 1: line 6 stores the first number typed, <strong>25</strong>, in Temp.', visual: codeWT(WT2P, [6]) + note('Temp = 25, Hot = 0') },
  { text: 'Line 7: is 25 &gt; 25? <strong>No.</strong> 25 is equal to 25, not more. The condition is FALSE, so line 8 does not run.', visual: codeWT(WT2P, [7]) + note('Hot = 0') },
  { text: 'Pass 2: Temp is 19. Is 19 &gt; 25? FALSE. Line 8 does not run.', visual: codeWT(WT2P, [6, 7]) + note('Hot = 0') },
  { text: `Pass 3: Temp is 32. Is 32 &gt; 25? TRUE. Line 8 runs: Hot = 0 + 1 = <strong>${WT2_HOT[0]}</strong>.`, visual: codeWT(WT2P, [7, 8]) + note(`Hot = ${WT2_HOT[0]}`) },
  { text: `Line 11 outputs <strong>${WT2_OUT}</strong>. The day of 25 was not counted, but the rule says it should be. Check your value on the line the same way.`, visual: codeWT(WT2P, [11]) + note(`Output: ${WT2_OUT}`) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: The Value on the Line', 'From 2.2 and 2.6. A player wins a round with a score of 30 or more. The user types 30, 45, 12, 31.', [
  { label: 'The first score is 30. Is Score &gt; 30 TRUE or FALSE?', answer: word(DN2_TF), feedback: 'Is 30 more than 30, or equal to it?' },
  { label: 'What does the program output?', answer: num(DN2_OUT), feedback: 'Check each score against line 7. Equal is not more.' },
  { line: true, label: 'Write line 7 so that a score of 30 wins.', answer: ifRe('score', [['>=', 30], ['>', 29]]) + `|^\\s*if\\s+30\\s*<=\\s*score\\s*(then)?\\s*$`, feedback: 'Which operator means more than OR equal to?' },
], ['Why test a program with many inputs, not just one?', 'One input can hide an error. Different inputs take different paths through the program, so more mistakes show up.'], codeBlock(DN2, true)));
steps[steps.length - 1].walkthrough = WT_BOUND;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-3-1-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from Term 1a: number systems, loops, arrays, and errors. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Following and Correcting Pseudocode',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Pseudocode and Software Development</p><h2 class="lesson-h2">Following and Correcting Pseudocode</h2><p>Year 9, 3.1</p></div>' +
    facts(['<strong>Today:</strong> read a program one line at a time, and correct it so it does its job.',
      '<strong>You already know:</strong> DECLARE, FOR loops, IF, arrays and trace tables.',
      '<strong>Activities:</strong> trace a program with an error, then correct programs and run them.']) +
    why('A program gives the wrong answer. Is that the computer\'s fault, or the program\'s? Why?', 'The program\'s. The computer does exactly what each line says, in order. It cannot guess what we meant.') });

// ---------------------------------------------------------------- one line at a time: predict then reveal
const LBL = ['DECLARE A : INTEGER', 'DECLARE B : INTEGER', 'A <- 4', 'B <- A + 3', 'A <- B * 2', 'OUTPUT A'];
const lv = (n, v) => watch(LBL, n, v)[0];
const LBL_ROWS = [['3', lv(3, 'A'), ''], ['4', '', lv(4, 'B')], ['5', lv(5, 'A'), ''], ['6', '', '']];
const LBL_OUT = one(LBL);
steps.push({ id: 'line-by-line', label: 'One Line at a Time',
  content: '<h2 class="lesson-h2">One Line at a Time</h2>' +
    tps('Predict: what does line 6 output? Why is A not 4 any more?',
      `<p>Line 4 makes B ${LBL_ROWS[1][2]}. Line 5 uses that B: A = ${LBL_ROWS[1][2]} * 2 = <strong>${LBL_OUT}</strong>.</p><p>The new value replaces the old 4. The old value is gone.</p>` +
      table(LBL_ROWS.slice(0, 3), ['Line', 'A', 'B']), 'Show the worked answer') +
    columns(codeBlock(LBL, true),
      facts(['The computer runs <strong>one line at a time</strong>, from the top.', 'A line changes only the variable on the <strong>left</strong> of the arrow.',
        'A new value <strong>replaces</strong> the old one.', 'A line uses the values the variables hold <strong>now</strong>.'])) });

// ---------------------------------------------------------------- hinge 1: follow it exactly (a copy, then a change)
const H1 = ['DECLARE X : INTEGER', 'DECLARE Y : INTEGER', 'X <- 5', 'Y <- X', 'X <- X + 4', 'OUTPUT Y'];
const H1_OUT = one(H1);
const H1_X = watch(H1, 5, 'X')[0];
assert(H1_OUT === '5' && H1_X === '9', 'hinge 1 values');
steps.push(mcStep('hinge-1', 'Hinge Question: Follow It Exactly', 'Hinge Question: Follow It Exactly', 'Follow the program one line at a time. Choose the best answer.', [
  { prompt: 'What does line 6 output?', options: [H1_X, '0', H1_OUT, '14'], correct: 2,
    explain: `Line 4 copies ${H1_OUT} into Y. Line 5 changes only X, so Y is still ${H1_OUT}. (${H1_X} thinks Y changes with X. 0 thinks Y is empty.)` },
], ['Does copying link two variables forever? Test it: A &larr; 3, B &larr; A, A &larr; 8.', 'No. B is still 3. B &larr; A copies the value once. Changing A later does not change B.'], codeBlock(H1, true)));

// ---------------------------------------------------------------- order matters 1: OUTPUT inside or after the loop
const DBL_IN = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'Number <- 3', 'FOR Count <- 1 TO 4', '    Number <- Number * 2', '    OUTPUT Number', 'NEXT Count'];
const DBL_AFTER = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'Number <- 3', 'FOR Count <- 1 TO 4', '    Number <- Number * 2', 'NEXT Count', 'OUTPUT Number'];
const DBL_A = out(DBL_IN), DBL_B = out(DBL_AFTER);
assert(DBL_A.length === 4 && DBL_B.length === 1, 'output inside or after');
steps.push({ id: 'compare-output', label: 'Compare: OUTPUT Inside or After the Loop',
  content: '<h2 class="lesson-h2">Compare: OUTPUT Inside or After the Loop</h2>' +
    tps('Both should output the last value of Number, once. Predict what A and B output. Why are they different?',
      `<p><strong>A</strong> outputs ${DBL_A.join(', ')}. <strong>B</strong> outputs ${DBL_B[0]}.</p><p>A line inside the loop runs on <strong>every pass</strong>. A line after NEXT runs <strong>once</strong>, when the loop has finished.</p>`, 'Show the worked answer') +
    columns(label('A') + codeBlock(DBL_IN, true), label('B') + codeBlock(DBL_AFTER, true)) +
    facts(['The lines are the same. Only <strong>one line has moved</strong>.', 'So the order of the lines changes the result.']) });

// ---------------------------------------------------------------- order matters 2: Total <- 0 before or inside the loop
const SUM_BEFORE = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 2 TO 5', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
const SUM_INSIDE = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'FOR Count <- 2 TO 5', '    Total <- 0', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
const SB = one(SUM_BEFORE), SI = one(SUM_INSIDE);
assert(SB === '14' && SI === '5', 'reset compare');
steps.push({ id: 'compare-reset', label: 'Compare: Total \u2190 0 Before or Inside the Loop',
  content: `<h2 class="lesson-h2">Compare: Total ${A} 0 Before or Inside the Loop</h2>` +
    tps(`Both should output 2 + 3 + 4 + 5 = ${SB}. What does B really output? Why?`,
      `<p><strong>A</strong> outputs ${SB}. <strong>B</strong> outputs <strong>${SI}</strong>.</p><p>In B, Total goes back to 0 at the start of every pass, so only the last Count is left. A sets Total to 0 once, before the loop starts.</p>`, 'Show the worked answer') +
    columns(label('A') + codeBlock(SUM_BEFORE, true), label('B') + codeBlock(SUM_INSIDE, true)) +
    facts(['A line <strong>before</strong> the loop runs once.', 'A line <strong>inside</strong> the loop runs on every pass.']) });

// ---------------------------------------------------------------- hinge 2: the IF after the loop (Term 1a test b3)
const H2 = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Big : INTEGER', 'Big <- 0', 'FOR Count <- 1 TO 5', '    INPUT Number', 'NEXT Count',
  'IF Number >= 10 THEN', '    Big <- Big + 1', 'ENDIF', 'OUTPUT Big'];
const H2_FIXED = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Big : INTEGER', 'Big <- 0', 'FOR Count <- 1 TO 5', '    INPUT Number',
  '    IF Number >= 10 THEN', '        Big <- Big + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Big'];
const H2_IN = [12, 3, 15, 8, 20];
const H2_OUT = one(H2, { inputs: H2_IN }), H2_GOOD = one(H2_FIXED, { inputs: H2_IN });
assert(H2_OUT === '1' && H2_GOOD === '3', 'hinge 2 values');
steps.push(mcStep('hinge-2', 'Hinge Question: Where Is the IF?', 'Hinge Question: Where Is the IF?',
  `This program should count the numbers that are 10 or more. The user types ${H2_IN.join(', ')}. It outputs ${H2_OUT}, not ${H2_GOOD}.`, [
    { prompt: `Why does it output ${H2_OUT}?`,
      options: ['Big ← 0 must go inside the loop', 'The loop must go to 6, not 5', 'The IF checks only the last Number', 'IF Number >= 10 must use >'], correct: 2,
      explain: `The IF is after NEXT, so it runs once, on the last number, ${H2_IN[4]}. Move it inside the loop, after INPUT, so it checks every number: then it outputs ${H2_GOOD}.` },
  ], ['How can a trace table help you find what is wrong?', 'Write each value as it changes. Compare it with what should happen. The first row that is different shows where it goes wrong.'], codeBlock(H2, true)));

// ---------------------------------------------------------------- compare: > 13 and >= 13 (the value on the line)
const AGE_A = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age > 13 THEN', '    OUTPUT "Join"', 'ELSE', '    OUTPUT "Too young"', 'ENDIF'];
const AGE_B = AGE_A.map((l) => l.replace('Age > 13', 'Age >= 13'));
const AGE_ROWS = [12, 13, 14].map((a) => [String(a), one(AGE_A, { inputs: [a] }), one(AGE_B, { inputs: [a] })]);
assert(AGE_ROWS.filter((r) => r[1] !== r[2]).map((r) => r[0]).join() === '13', 'only 13 differs');
steps.push({ id: 'compare-boundary', label: 'Compare: More Than, or More Than or Equal To?',
  content: '<h2 class="lesson-h2">Compare: More Than, or More Than or Equal To?</h2>' +
    tps('Members must be 13 or over. Predict: the user types 13. What do A and B output? Why?',
      `<p><strong>A</strong> outputs ${AGE_ROWS[1][1]}: 13 is not more than 13. <strong>B</strong> outputs ${AGE_ROWS[1][2]}: 13 is equal to 13.</p>` +
      table(AGE_ROWS.map((r) => [r[0], r[1], r[2]]), ['Age typed', 'A outputs', 'B outputs']), 'Show the worked answer') +
    columns(label('A') + codeBlock(AGE_A), label('B') + codeBlock(AGE_B)) +
    facts(['&gt; means more than. &gt;= means more than <strong>or equal to</strong>.', 'Always test the value <strong>exactly on the line</strong>. That is where they differ.']) });

// ---------------------------------------------------------------- check: the value on the line (< and <=)
const COLD = ['DECLARE Temp : INTEGER', 'DECLARE Day : INTEGER', 'DECLARE Cold : INTEGER', 'Cold <- 0', 'FOR Day <- 1 TO 5', '    INPUT Temp',
  '    IF Temp < 20 THEN', '        Cold <- Cold + 1', '    ENDIF', 'NEXT Day', 'OUTPUT Cold'];
const COLD_IN = [20, 25, 18, 20, 31];
const COLD_OUT = one(COLD, { inputs: COLD_IN });
const COLD_GOOD = one(COLD.map((l) => l.replace('Temp < 20', 'Temp <= 20')), { inputs: COLD_IN });
assert(COLD_OUT === '1' && COLD_GOOD === '3', 'check-boundary values');
steps.push(checkStep('check-boundary', 'Check: The Value on the Line', 'Check: The Value on the Line',
  `This program should count the cold days: 20 or less. The user types ${COLD_IN.join(', ')}.`, [
    { label: 'What does it output, exactly as written?', answer: num(COLD_OUT), feedback: 'Check each number with line 7. Is 20 &lt; 20 TRUE?' },
    { label: 'What should it output?', answer: num(COLD_GOOD), feedback: 'Count the numbers that are 20 or less.' },
    { line: true, label: 'Write the correct line 7.', answer: ifRe('temp', [['<=', 20], ['<', 21]]) + `|^\\s*if\\s+20\\s*>=\\s*temp\\s*(then)?\\s*$`, feedback: '"20 or less" includes 20 itself. Which operator is TRUE when Temp is 20?' },
  ], ['Why does the question give the rule in words, as well as the code?', 'The words say what the program should do. Compare each line with them to find the error.'], codeBlock(COLD, true)));

// ---------------------------------------------------------------- four steps to correct a program
steps.push({ id: 'how-to-correct', label: 'Four Steps to Correct a Program',
  content: '<h2 class="lesson-h2">Four Steps to Correct a Program</h2>' +
    tps('Why is the last step "fix, then trace again", and not just "fix"?', 'A fix is a guess until you test it. A new trace proves the program now does its job.') +
    columns('<ol class="lesson-facts">' +
      '<li><strong>Purpose:</strong> say what the program should do, and what it should output.</li>' +
      '<li><strong>Trace:</strong> follow it exactly as it is written.</li>' +
      '<li><strong>Find:</strong> the first line that makes a value go wrong.</li>' +
      '<li><strong>Fix and prove:</strong> change that line, then trace again.</li></ol>',
      facts(['The <strong>purpose</strong> of a program is the job it should do.', 'You can only see an error when you know the purpose.',
        'A correction is finished when a new trace gives the purpose.'])) });

// ---------------------------------------------------------------- where it shows, where it starts
const PRICES = [5, 12, 3, 10];
const PR = ['DECLARE Prices : ARRAY[1:4] OF INTEGER', 'DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 2 TO 4',
  '    Total <- Total + Prices[Index]', 'NEXT Index', 'OUTPUT Total'];
const PR_FIX = PR.map((l) => l.replace('FOR Index <- 2 TO 4', 'FOR Index <- 1 TO 4'));
const PR_OUT = one(PR, { arrays: { Prices: PRICES } }), PR_GOOD = one(PR_FIX, { arrays: { Prices: PRICES } });
const PR_TRACE = watch(PR_FIX, 6, 'Total', { arrays: { Prices: PRICES } });
assert(PR_GOOD === String(PRICES.reduce((a, b) => a + b)) && PR_OUT !== PR_GOOD && PR_TRACE[PR_TRACE.length - 1] === PR_GOOD, 'prices values');
steps.push({ id: 'shows-starts', label: 'Where It Shows, Where It Starts',
  content: '<h2 class="lesson-h2">Where It Shows, Where It Starts</h2>' +
    tps(`Purpose: output the total of the four prices, ${PR_GOOD}. It outputs ${PR_OUT}. The wrong number shows on line 8. Is line 8 the line to fix? Why?`,
      `<p>No. Line 8 only shows Total. Total was already wrong, because line 5 starts at 2, so Prices[1] is never added.</p><p>Fix line 5: FOR Index ${A} 1 TO 4. Trace again: Total is ${PR_TRACE.join(', ')}. It outputs ${PR_GOOD}.</p>`, 'Show the worked answer') +
    columns(codeBlock(PR, true), arrayTable('Prices', PRICES) +
      facts(['The line where a wrong value <strong>shows</strong> is often not the line that <strong>causes</strong> it.', 'Follow the wrong value back up the program to where it first goes wrong.'])) });

// ---------------------------------------------------------------- hinge 3: which line causes it? (OUTPUT for INPUT)
const H3 = ['DECLARE Mark : INTEGER', 'DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    OUTPUT Mark',
  '    Total <- Total + Mark', 'NEXT Count', 'OUTPUT Total'];
const H3_IN = [5, 8, 2, 6];
const H3_OUT = out(H3, { inputs: H3_IN });
const H3_GOOD = one(H3.map((l) => l.replace('OUTPUT Mark', 'INPUT Mark')), { inputs: H3_IN });
assert(H3_OUT.every((v) => v === '0') && H3_GOOD === '21', 'hinge 3 values');
steps.push(mcStep('hinge-3', 'Hinge Question: Which Line Causes It?', 'Hinge Question: Which Line Causes It?',
  `Purpose: input four marks and output their total. The user types ${H3_IN.join(', ')}. The program outputs ${H3_OUT.join(', ')}.`, [
    { prompt: 'Which line causes the wrong result?', options: ['Line 9', 'Line 6', 'Line 7', 'Line 4'], correct: 1,
      explain: `Line 6 should be INPUT Mark. With OUTPUT, Mark never gets the marks typed in, so line 7 adds 0 each time. Line 9 only shows the wrong total. After the fix, a new trace gives ${H3_GOOD}.` },
  ], ['Why read the purpose before you look for the error?', 'The purpose tells you what each value should be. Then a trace shows which line first makes a value wrong.'], codeBlock(H3, true)));

// ---------------------------------------------------------------- activity 1: trace a program with an error
const ACT_IN = [6, 9, 4, 8];
const ACT = ['DECLARE Price : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Total : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    INPUT Price', '    Total <- Price', 'NEXT Count', 'OUTPUT Total'];
const ACT_FIX = ACT.map((l) => l.replace('Total <- Price', 'Total <- Total + Price'));
const ACT_TOT = watch(ACT, 7, 'Total', { inputs: ACT_IN });
const ACT_OUT = one(ACT, { inputs: ACT_IN }), ACT_GOOD = one(ACT_FIX, { inputs: ACT_IN });
assert(ACT_GOOD === String(ACT_IN.reduce((a, b) => a + b)) && ACT_OUT === String(ACT_IN[3]) && ACT_OUT !== '7', 'activity values');
const trRows = [{ Line: '4', Price: '', Count: '', Total: '0', Output: '' }];
ACT_IN.forEach((p, i) => {
  trRows.push({ Line: '5', Price: '', Count: String(i + 1), Total: '', Output: '' });
  trRows.push({ Line: '6', Price: String(p), Count: '', Total: '', Output: '' });
  trRows.push({ Line: '7', Price: '', Count: '', Total: ACT_TOT[i], Output: '' });
});
trRows.push({ Line: '8', Price: '', Count: '', Total: '', Output: ACT_OUT });
steps.push({ id: 'activity-1', label: 'Activity 1: Trace and Find the Error', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Find the Line That Causes It',
    context: `This program should input four prices and output their total. The user types ${ACT_IN.join(', ')}. Trace it exactly as it is written. What does it really output?`,
    code: ['DECLARE Price : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Total : INTEGER', 'Total = 0', 'for Count in range(1, 5):', '    Price = int(input())', '    Total = Price', 'print(Total)'],
    cols: ['Line', 'Price', 'Count', 'Total', 'Output'],
    answers: trRows,
  },
  content: '<h2 class="lesson-h2">Activity 1: Trace and Find the Error</h2>' +
    why('Step 1: what is the purpose of this program? Why work it out before you trace?', 'The purpose says what it SHOULD output. The trace shows what it really does. Then you can compare.') +
    `<p class="lesson-lead">Trace the program. Then correct it on the next slide.</p><div id="${P}-embed-1" class="lesson-embed"></div>` });

steps.push(checkStep('fix-check', 'Check: Correct the Program', 'Check: Correct the Program', `Purpose: input four prices and output their total. The user types ${ACT_IN.join(', ')}. Use your trace table.`, [
  { label: 'What does the program really output?', answer: num(ACT_OUT), feedback: 'Look at the Output column of your trace table.' },
  { label: 'Which line causes the wrong result?', answer: lineRe(7), feedback: 'Which line changes Total? Does it keep the old total?' },
  { line: true, label: 'Write the correct line.', answer: `^\\s*total${ARW}(total\\s*\\+\\s*price|price\\s*\\+\\s*total)\\s*$`, feedback: 'Total must keep what it had, and add the new Price.' },
  { label: 'Trace again with the same prices. What does it output now?', answer: num(ACT_GOOD), feedback: 'Total starts at 0 and grows by each price.' },
], ['Why write a new row each time a value changes?', 'Each row shows one moment in the program. Then you can point to the exact line where a value first goes wrong.'], codeBlock(ACT, true)));

// ---------------------------------------------------------------- exam question (adapted from a real paper, cited)
const LIST = ['DECLARE List : ARRAY[1:1000] OF INTEGER', 'DECLARE Max : INTEGER', 'DECLARE Min : INTEGER', 'DECLARE Counter : INTEGER', 'Max <- List[1]', 'Min <- List[1]',
  'FOR Counter <- 2 TO 1000', '    IF List[Counter] < Max THEN', '        Max <- List[Counter]', '    ENDIF', '    IF List[Count] < Min THEN', '        Min <- List[Counter]', '    ENDIF',
  'NEXT Counter', 'OUTPUT Max', 'OUTPUT Min'];
{
  const vals = Array.from({ length: 1000 }, (_, i) => 1 + ((i * 7919 + 13) % 997));
  const fixed = LIST.map((l) => l.replace('List[Counter] < Max', 'List[Counter] > Max').replace('List[Count] < Min', 'List[Counter] < Min'));
  const r = out(fixed, { arrays: { List: vals } });
  assert(r[0] === String(Math.max(...vals)) && r[1] === String(Math.min(...vals)), 'the corrected max and min algorithm works');
  assert(runProg(LIST, { arrays: { List: vals } }).error, 'the given algorithm fails on line 11');
  const half = LIST.map((l) => l.replace('List[Count] < Min', 'List[Counter] < Min'));
  assert(out(half, { arrays: { List: vals } })[0] !== String(Math.max(...vals)), 'line 8 alone gives the wrong Max');
}
// Split over two slides (the 16-line program fills a slide on its own at 1366x768).
const MAXMIN_LEAD = 'Adapted from Cambridge IGCSE 0478/22, May/June 2024, Question 7(b). This algorithm should find the largest value (Max) and the smallest value (Min) in the array List of 1000 positive numbers. It has two errors.';
steps.push(checkStep('exam-maxmin', 'Exam Question: Correct the Algorithm (1 of 2)', 'Exam Question: Correct the Algorithm (1 of 2)', MAXMIN_LEAD, [
    { line: true, label: 'Line 08: write the correct line.', answer: `^\\s*if\\s+(list\\s*\\[\\s*counter\\s*\\]\\s*>\\s*max|max\\s*<\\s*list\\s*\\[\\s*counter\\s*\\])\\s*(then)?\\s*$`, feedback: 'Max should change when a value is BIGGER than Max.' },
  ], ['Why can a program run with no error message and still be wrong?', 'The computer only checks the rules, not the purpose. A line can follow every rule and still do the wrong job.'], codeBlock(LIST, true)));
steps[steps.length - 1].content = steps[steps.length - 1].content.replace('<div class="lesson-do-now-columns">', '<div class="lesson-do-now-columns is-code-wide">');
steps.push(checkStep('exam-maxmin-2', 'Exam Question: Correct the Algorithm (2 of 2)', 'Exam Question: Correct the Algorithm (2 of 2)', MAXMIN_LEAD, [
    { label: 'Which other line has an error? (Use the line numbers.)', answer: lineRe(11), feedback: 'Read every variable name. Which name was never declared?' },
    { line: true, label: 'Write the correct line for it.', answer: `^\\s*if\\s+(list\\s*\\[\\s*counter\\s*\\]\\s*<\\s*min|min\\s*>\\s*list\\s*\\[\\s*counter\\s*\\])\\s*(then)?\\s*$`, feedback: 'The loop variable is Counter.' },
  ], ['Why do Max and Min both start as List[1], not 0?', 'List[1] is a real value from the list. A Min of 0 would never change, because every number in List is bigger.'], codeBlock(LIST, true)));
steps[steps.length - 1].content = steps[steps.length - 1].content.replace('<div class="lesson-do-now-columns">', '<div class="lesson-do-now-columns is-code-wide">');

// ---------------------------------------------------------------- compare: two fixes, trace both
const TF_BAD = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    Total <- Total + Count', '    OUTPUT Total', 'NEXT Count'];
const TF_A = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
const TF_B = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'OUTPUT Total', 'FOR Count <- 1 TO 4', '    Total <- Total + Count', 'NEXT Count'];
const TFO = out(TF_BAD), TFA = one(TF_A), TFB = one(TF_B);
assert(TFO.length === 4 && TFA === '10' && TFB === '0', 'two fixes');
steps.push({ id: 'compare-fixes', label: 'Compare: Two Fixes, One Works',
  content: '<h2 class="lesson-h2">Compare: Two Fixes, One Works</h2>' +
    tps(`Purpose: output the total of 1 to 4, once. The program output ${TFO.join(', ')}. Both fixes move the OUTPUT line. Trace both. Which one works? Why?`,
      `<p><strong>A</strong> outputs ${TFA}, once: it does the job.</p><p><strong>B</strong> outputs ${TFB}: OUTPUT runs before the loop has added anything. Only a new trace shows which fix works.</p>`, 'Show the worked answer') +
    columns(label('Fix A') + codeBlock(TF_A, true), label('Fix B') + codeBlock(TF_B, true)) +
    facts([`The program before the fix output <strong>${TFO.join(', ')}</strong>: OUTPUT was inside the loop.`, 'A fix is correct only when a new trace gives the purpose.']) });

// ---------------------------------------------------------------- activity 2: correct the program (code drill)
steps.push(embed('activity-2', 'Activity 2: Correct the Program', 'drill-y9-3-1-code', 'Activity 2: Correct the Program',
  'Each program has one error. It is already in the box. Read the purpose, find the line that causes the error, correct it, then press Run and check.',
  ['Why is your program run with new values each time?', 'A correct program must do its job for any values, not only one set. New values catch a fix that only works by luck.']));

// ---------------------------------------------------------------- exam-style question: three errors (0478 style, uncited)
const AGES = ['DECLARE Age : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Adults : INTEGER', 'Adults <- 0', 'FOR Count <- 1 TO 6', '    OUTPUT Age',
  '    IF Age > 18 THEN', '        Adults <- Adults + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Count'];
{
  const ages = [18, 25, 9, 40, 17, 18];
  const fixed = AGES.map((l) => l.replace('OUTPUT Age', 'INPUT Age').replace('Age > 18', 'Age >= 18').replace('OUTPUT Count', 'OUTPUT Adults'));
  assert(one(fixed, { inputs: ages }) === '4', 'ages corrected');
  assert(out(AGES, { inputs: ages }).slice(0, 6).every((v) => v === '0'), 'ages never stored');
  assert(one(fixed.map((l) => l.replace('Age >= 18', 'Age > 18')), { inputs: ages }) === '2', 'an age of 18 is missed by >');
}
steps.push(checkStep('exam-ages', 'Exam-Style Question: Three Errors', 'Exam-Style Question: Three Errors',
  'This algorithm should input the ages of 6 visitors, count how many are 18 or over, then output the count. It has three errors.', [
    { label: 'The ages typed in are never stored. Which line causes this?', answer: lineRe(6), feedback: 'Which line should take in what the user types?' },
    { line: true, label: 'Write the correct line 6.', answer: word('input\\s+age'), feedback: 'The age must come IN to the program.' },
    { line: true, label: 'A visitor aged 18 is not counted. Write the correct line 7.', answer: ifRe('age', [['>=', 18], ['>', 17]]) + `|^\\s*if\\s+18\\s*<=\\s*age\\s*(then)?\\s*$`, feedback: '"18 or over" includes 18. Which operator is TRUE when Age is 18?' },
    { line: true, label: 'Line 11 does not output the count. Write the correct line 11.', answer: word('output\\s+adults'), feedback: 'Which variable counts the visitors aged 18 or over?' },
  ], ['Why does the question say what the algorithm SHOULD do?', 'To find an error, compare what each line does with what it should do. Each difference is an error to correct.'], codeBlock(AGES, true)));

// ---------------------------------------------------------------- exam-style question: explain (self-marked)
steps.push(selfMarked('exam-explain', 'Exam-Style Question: Explain the Method (1 of 2)', 'Exam-Style Question: Explain the Method (1 of 2)',
  'Answer in full sentences. This part has 2 marks: give two connected points.', [
    { id: 'shows-line', prompt: 'A student says: "The error is on the OUTPUT line, because that is where the wrong number appears." Explain why the student may be wrong. [2]', marks: 2,
      modelAnswer: 'The OUTPUT line only shows the value of a variable. That value may have been made wrong by an earlier line, such as the FOR line or an assignment, so the earlier line is the one to correct.' },
  ], ['This part has 2 marks. How do you plan the answer?', 'Make one point. Then join a second point to it with "so" or "because". Two connected points earn two marks.']));
steps.push(selfMarked('exam-explain-2', 'Exam-Style Question: Explain the Method (2 of 2)', 'Exam-Style Question: Explain the Method (2 of 2)',
  'Answer in full sentences. This part has 2 marks: give two connected points.', [
    { id: 'trace-again', prompt: 'Explain why a corrected program should be traced again. [2]', marks: 2,
      modelAnswer: 'The correction might not fix the error, or it might cause a new error. Tracing again shows whether the program now gives the output its purpose needs.' },
  ], ['Why does a 2-mark answer need full sentences?', 'Each mark needs a clear point. A full sentence shows exactly what you mean. One word rarely earns a mark.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Following and Correcting Pseudocode Drill', 'drill-y9-3-1-pseudocode', 'Plenary: Following and Correcting Pseudocode Drill',
  'Follow programs line by line, see why order matters, test the value on the line, and find, fix and prove. Your progress is saved.',
  ['Why does each card ask what the program DOES, not what it should do?', 'To correct a program, you must first see exactly what it does. Then you can compare it with its purpose.']));

// ---------------------------------------------------------------- lesson self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, DN1_PASS[0]) && V('do-now', 1, DN1_PASS[1]) && V('do-now', 2, DN1_OUT) && !V('do-now', 2, String(DN1_MEANT)), 'do-now');
assert(V('do-now-2', 0, 'FALSE') && V('do-now-2', 0, 'false') && !V('do-now-2', 0, 'TRUE') && V('do-now-2', 1, DN2_OUT) && !V('do-now-2', 1, '3'), 'do-now-2 a, b');
for (const ok of ['IF Score >= 30 THEN', 'if score>=30 then', 'IF Score > 29 THEN', 'IF Score >= 30', 'IF 30 <= Score THEN']) assert(V('do-now-2', 2, ok), 'do-now-2 accepts ' + ok);
for (const bad of ['IF Score > 30 THEN', 'IF Score <= 30 THEN', 'IF Score >= 31 THEN', 'IF Score = 30 THEN']) assert(!V('do-now-2', 2, bad), 'do-now-2 rejects ' + bad);
assert(V('check-boundary', 0, '1') && V('check-boundary', 1, '3') && !V('check-boundary', 0, '3'), 'check-boundary numbers');
for (const ok of ['IF Temp <= 20 THEN', 'if temp<=20', 'IF Temp < 21 THEN', 'IF 20 >= Temp THEN']) assert(V('check-boundary', 2, ok), 'cold accepts ' + ok);
for (const bad of ['IF Temp < 20 THEN', 'IF Temp >= 20 THEN', 'IF Temp <= 21 THEN', 'IF Temp = 20 THEN']) assert(!V('check-boundary', 2, bad), 'cold rejects ' + bad);
assert(V('fix-check', 0, ACT_OUT) && !V('fix-check', 0, ACT_GOOD) && V('fix-check', 1, '7') && V('fix-check', 1, 'line 7') && !V('fix-check', 1, '9') && V('fix-check', 3, ACT_GOOD), 'fix-check numbers');
for (const ok of ['Total <- Total + Price', 'total ← total + price', 'Total<-Price+Total']) assert(V('fix-check', 2, ok), 'fix accepts ' + ok);
for (const bad of ['Total <- Price', 'Total <- Total + 1', 'Price <- Total + Price']) assert(!V('fix-check', 2, bad), 'fix rejects ' + bad);
for (const ok of ['IF List[Counter] > Max THEN', 'if list[counter]>max', 'IF Max < List[Counter] THEN']) assert(V('exam-maxmin', 0, ok), 'max accepts ' + ok);
for (const bad of ['IF List[Counter] < Max THEN', 'IF List[Count] > Max THEN']) assert(!V('exam-maxmin', 0, bad), 'max rejects ' + bad);
assert(V('exam-maxmin-2', 0, '11') && V('exam-maxmin-2', 0, 'Line 11') && !V('exam-maxmin-2', 0, '12'), 'maxmin line');
for (const ok of ['IF List[Counter] < Min THEN', 'if list[counter] < min']) assert(V('exam-maxmin-2', 1, ok), 'min accepts ' + ok);
for (const bad of ['IF List[Count] < Min THEN', 'IF List[Counter] > Min THEN']) assert(!V('exam-maxmin-2', 1, bad), 'min rejects ' + bad);
assert(V('exam-ages', 0, '6') && V('exam-ages', 0, 'Line 06') && !V('exam-ages', 0, '11') && V('exam-ages', 1, 'INPUT Age') && !V('exam-ages', 1, 'OUTPUT Age'), 'ages a, b');
for (const ok of ['IF Age >= 18 THEN', 'IF Age > 17 THEN', 'IF 18 <= Age THEN']) assert(V('exam-ages', 2, ok), 'ages accepts ' + ok);
for (const bad of ['IF Age > 18 THEN', 'IF Age >= 17 THEN']) assert(!V('exam-ages', 2, bad), 'ages rejects ' + bad);
assert(V('exam-ages', 3, 'OUTPUT Adults') && !V('exam-ages', 3, 'OUTPUT Count'), 'ages d');
// The walkthroughs show the method with other programs and never the Do Now answers.
{ const s = WT_TRACE.steps.map((x) => x.text + x.visual).join(' ');
  assert(!new RegExp(`\\b(${DN1_OUT}|${DN1_MEANT})\\b`).test(s) && !/Total = (3|6)\b/.test(s), 'trace walkthrough shows a Do Now answer'); }
{ const s = WT_BOUND.steps.map((x) => x.text + x.visual).join(' ');
  assert(!/\b30\b/.test(s) && !/&gt;=|>=/.test(s) && WT2_OUT !== DN2_OUT, 'boundary walkthrough shows a Do Now answer'); }
// Every MC answer is not always in the same place.
const mcCorrect = steps.filter((s) => s.type === 'multiple-choice').map((s) => s.items[0].correct);
assert(new Set(mcCorrect).size > 1, 'MC correct positions vary');
// Every slide asks a why: a Think, Pair, Share under every heading (the title slide has one under its facts).
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it; nothing Year 9 has not met.
const text = (s) => JSON.stringify([s.content, s.items || '', s.algorithm || '', s.walkthrough || '']);
const firstAt = (rx) => steps.findIndex((s) => rx.test(text(s)));
assert(firstAt(/purpose/i) === steps.findIndex((s) => s.id === 'how-to-correct'), 'purpose used before it is taught');
assert(firstAt(/\bMax\b/) === steps.findIndex((s) => s.id === 'exam-maxmin'), 'Max outside the exam question');
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV)\b/.test(all), 'a construct Year 9 has not met');
assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'em or en dash');
assert(!/mario/i.test(all), 'game mention');
// Every program on a slide declares its variables (the engine runs each one, and it requires DECLARE).
assert(steps.length >= 20, 'slide count');

const lesson = { id: ID, label: '3.1: Following and Correcting Pseudocode', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ================================================================= the drills
// Each function's body is written out as the drill's data file, exactly as it is typed here.
function DRILL_EXT() {
// Year 9, 3.1 Do Now Extension: Term 1a (number systems, 2.2 loops, 2.3 arrays, 2.6 errors and trace tables).
// Loaded by Drills/index.html?drill=y9-3-1-ext
// For students who finish the Do Now early. Every card has an `example`, a similar question worked through with
// different values, then two `working` nudges. An example never shows the card's own answer. Every answer that comes
// from a program is worked out by running it in shared/pseudocode-engine.js (loaded before this file). The question
// comes first and the program after it.
DrillData.register("y9-3-1-ext", {
  title: "Year 9 Extension: Term 1a Review",
  subtitle: "3.1 Do Now Extension",
  choiceOnly: true,
  categories: [
    ["ex-num", "Number Systems"],
    ["ex-loops", "Loops (2.2)"],
    ["ex-arrays", "Arrays (2.3)"],
    ["ex-errors", "Errors and Trace Tables (2.6)"]
  ],
  cards: (function () {
    var A = "\u2190";
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function run(lines, inputs) {
      var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(String);
    }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) + 2, Number(ans) - 1, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function bits(n) { return ("00000000" + n.toString(2)).slice(-8); }
    function lineRe(n) { return new RegExp("^\\s*(line\\s*)?0?" + n + "\\s*\\.?\\s*$", "i"); }
    // Draw until the answer is not one of the worked example's own numbers.
    function avoid(make, example) {
      var c, tries = 0;
      do { c = make(); tries++; } while (tries < 50 && new RegExp("(^|[^0-9A-Za-z])" + c.answers[0] + "($|[^0-9A-Za-z])").test(example));
      c.example = example;
      return c;
    }

    return [
      // ------------------------------------------------ number systems
      { id: "ex-01", category: "ex-num", randomize: function () {
          var ex = "Example: change 75 into 8-bit binary.\nPlace values: 128 64 32 16 8 4 2 1.\n128 does not fit: 0. 64 fits: 1, and 75 - 64 = 11 is left.\n32 and 16 do not fit: 0 0. 8 fits: 1, 11 - 8 = 3 left.\n4 does not fit: 0. 2 fits: 1, 1 left. 1 fits: 1.\nSo 75 is 01001011.";
          return avoid(function () {
            var n; do { n = drillRange(20, 250); } while (n === 75 || n === 128);
            var b = bits(n), wrong = [];
            [0, 3, 6, 7].forEach(function (i) { var w = b.slice(0, i) + (b[i] === "1" ? "0" : "1") + b.slice(i + 1); if (wrong.length < 3 && w !== b) wrong.push(w); });
            return { prompt: "Convert the denary number " + n + " into 8-bit binary.", answers: [b], keywords: [new RegExp("^\\s*" + b + "\\s*$")], distractors: wrong,
              working: ["Write the eight place values, from 128 on the left.", "Does each place value fit into what is left? Write 1 if it fits, 0 if not."],
              note: n + " in 8-bit binary is " + b + "." };
          }, ex);
        } },
      { id: "ex-02", category: "ex-num", randomize: function () {
          var ex = "Example: convert 10010110 into denary.\nPlace values: 128 64 32 16 8 4 2 1.\nThe 1s are under 128, 16, 4 and 2.\n128 + 16 + 4 + 2 = 150.";
          return avoid(function () {
            var n; do { n = drillRange(20, 250); } while (n === 150 || n === 128);
            var b = bits(n), low = n & -n, rev = parseInt(b.split("").reverse().join(""), 2);
            return { prompt: "Convert the binary number " + b + " into denary.", answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - low, rev, n + 16]),
              working: ["Write the place values above the bits, from 128 on the left.", "Add up the place values that have a 1 under them."],
              note: b + " is " + n + " in denary." };
          }, ex);
        } },
      { id: "ex-03", category: "ex-num", randomize: function () {
          var H = "0123456789ABCDEF";
          var ex = "Example: convert the hexadecimal number 3C into denary.\nThe left digit is worth 16 each: 3 x 16 = 48.\nC is 12.\n48 + 12 = 60.";
          return avoid(function () {
            var n; do { n = drillRange(26, 250); } while (n === 60 || n === 48);
            var h = H[Math.floor(n / 16)] + H[n % 16];
            return { prompt: "Convert the hexadecimal number " + h + " into denary.", answers: [String(n)], keywords: [drillNumberRe(n)],
              distractors: others(n, [Math.floor(n / 16) * 10 + (n % 16), Math.floor(n / 16) + (n % 16), n + 16]),
              working: ["The left digit counts lots of 16.", "A is 10, B is 11, up to F, which is 15. Add the right digit."],
              note: h + " = " + Math.floor(n / 16) + " x 16 + " + (n % 16) + " = " + n + "." };
          }, ex);
        } },
      // ------------------------------------------------ 2.2 loops
      { id: "ex-04", category: "ex-loops", randomize: function () {
          var ex = "Example: FOR Count " + A + " 3 TO 7\nCount takes the values 3, 4, 5, 6, 7.\nThat is 5 values, so the loop runs 5 times.";
          return avoid(function () {
            var a = drillRange(2, 6), b = a + drillRange(3, 8);
            var lines = ["DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    OUTPUT Count", "NEXT Count"];
            var n = run(lines).length;
            return { prompt: "How many times does this loop run?\n" + show(lines), answers: [String(n)], keywords: [new RegExp("^\\s*" + n + "\\s*(times?)?\\s*\\.?\\s*$", "i")], distractors: others(n, [n - 1, b - a, b]),
              working: ["List the values Count takes, from the first number to the last.", "Count them. The first and the last both count."],
              note: "Count takes " + a + " to " + b + ": " + n + " times." };
          }, ex);
        } },
      { id: "ex-05", category: "ex-loops", randomize: function () {
          var ex = "Example: the same program with FOR Count " + A + " 1 TO 4.\nTotal starts at 0.\nPass 1: 0 + 1 = 1. Pass 2: 1 + 2 = 3. Pass 3: 3 + 3 = 6. Pass 4: 6 + 4 = 10.\nAfter the loop it outputs 10.";
          return avoid(function () {
            var a = drillRange(2, 4), b = a + drillRange(2, 3);
            var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- " + a + " TO " + b, "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
            var t = run(lines)[0];
            return { prompt: "What does this program output?\n" + show(lines), answers: [t], keywords: [drillNumberRe(Number(t))], distractors: others(t, [Number(t) - b, Number(t) - a, b]),
              working: ["Total starts at 0. Each pass adds the value of Count.", "Write Total after every pass."],
              note: "Total is the sum of " + a + " to " + b + ": " + t + "." };
          }, ex);
        } },
      // ------------------------------------------------ 2.3 arrays
      { id: "ex-06", category: "ex-arrays", randomize: function () {
          var ex = "Example: Heights holds 120, 140, 130 at index 1 to 3.\nOUTPUT Heights[2]\nIndex 2 is the second position. Its value is 140.\nThe number in the square brackets is a position, not a value.";
          return avoid(function () {
            var vals = [], i = drillRange(1, 5);
            while (vals.length < 5) { var v = drillRange(3, 29); if (vals.indexOf(v) === -1 && v !== i) vals.push(v); }
            var lines = ["DECLARE Marks : ARRAY[1:5] OF INTEGER"].concat(vals.map(function (v, k) { return "Marks[" + (k + 1) + "] <- " + v; })).concat(["OUTPUT Marks[" + i + "]"]);
            var a = run(lines)[0];
            return { prompt: "Marks holds " + vals.join(", ") + " at index 1 to 5. What does this line output?\nOUTPUT Marks[" + i + "]",
              answers: [a], keywords: [drillNumberRe(Number(a))], distractors: others(a, [i, vals[i % 5], vals[(i + 3) % 5]]),
              working: ["The number in the square brackets is a position.", "Count along the positions from the start."],
              note: "Marks[" + i + "] is " + a + "." };
          }, ex);
        } },
      { id: "ex-07", category: "ex-arrays", randomize: function () {
          var ex = "Example: Ages holds 9, 14, 12, 16, and the IF is Ages[Index] > 12.\n9: no. 14: yes. 12: no, 12 is equal, not more. 16: yes.\nSo the program outputs 2.";
          return avoid(function () {
            var k = drillRange(10, 20), vals = [k], v;
            while (vals.length < 5) { v = drillRange(k - 8, k + 8); if (v !== k && vals.indexOf(v) === -1) vals.push(v); }
            vals.sort(function () { return Math.random() - 0.5; });
            var lines = ["DECLARE Temps : ARRAY[1:5] OF INTEGER", "DECLARE Index : INTEGER", "DECLARE Count : INTEGER", "Count <- 0", "FOR Index <- 1 TO 5", "    IF Temps[Index] > " + k + " THEN", "        Count <- Count + 1", "    ENDIF", "NEXT Index", "OUTPUT Count"];
            var full = lines.slice(0, 1).concat(vals.map(function (x, j) { return "Temps[" + (j + 1) + "] <- " + x; })).concat(lines.slice(1));
            var a = run(full)[0];
            return { prompt: "Temps holds " + vals.join(", ") + " at index 1 to 5. What does this program output?\n" + show(lines),
              answers: [a], keywords: [drillNumberRe(Number(a))], distractors: others(a, [Number(a) + 1, 5 - Number(a), 5]),
              working: ["Check each value against the number in the IF.", "Equal does not count: the value must be more."],
              note: "Only the values more than " + k + " are counted: " + a + "." };
          }, ex);
        } },
      // ------------------------------------------------ 2.6 errors and trace tables
      { id: "ex-08", category: "ex-errors", randomize: function () {
          var ex = "Example: the same bug with FOR Count " + A + " 1 TO 3.\nEvery pass starts with Total " + A + " 0.\nPass 1: 0 + 1 = 1. Pass 2: 0 + 2 = 2. Pass 3: 0 + 3 = 3.\nIt outputs 3, not 6.";
          return avoid(function () {
            var a = drillRange(2, 4), b = a + drillRange(2, 4);
            var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    Total <- 0", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
            var o = run(lines)[0], sum = 0;
            for (var c = a; c <= b; c++) sum += c;
            return { prompt: "This program should add up " + a + " to " + b + ". Follow it exactly as it is written. What does it output?\n" + show(lines),
              answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [sum, 0, a]),
              working: ["What happens to Total at the start of every pass?", "After the last pass, what is left in Total?"],
              note: "Total goes back to 0 every pass, so only the last Count is left: " + o + "." };
          }, ex);
        } },
      { id: "ex-09", category: "ex-errors", randomize: function () {
          var v = drillPick([
            { q: "This program should add up 1 to 5. Which line has the error?", lines: ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"], line: 4, wrong: [3, 5, 7],
              ex: "Example: a loop should run 6 times, but the FOR line says 1 TO 5.\nThe FOR line decides how many passes there are, so the FOR line has the error.", why: "Line 4 stops at 4. It should be 1 TO 5." },
            { q: "This program should output each number doubled: 2, 4, 6, 8. Which line has the error?", lines: ["DECLARE Count : INTEGER", "FOR Count <- 1 TO 4", "    OUTPUT Count + 2", "NEXT Count"], line: 3, wrong: [1, 2, 4],
              ex: "Example: a program should output each number tripled, but it says OUTPUT Count + 3.\nThe OUTPUT line makes the numbers, so that line has the error: it should be Count * 3.", why: "Line 3 adds 2. It should be OUTPUT Count * 2." },
            { q: "This program should output the total of 1 to 4. Which line has the error?", lines: ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    Total <- Total + Count", "NEXT Count", "OUTPUT Count"], line: 7, wrong: [3, 5, 6],
              ex: "Example: a program adds up Score in a loop, then its last line is OUTPUT Number.\nThe loop is right, but the last line outputs the wrong variable.", why: "Line 7 outputs Count. It should output Total." }]);
          return { prompt: v.q + "\n" + show(numbered(v.lines)), answers: ["Line " + v.line], keywords: [lineRe(v.line)],
            distractors: v.wrong.map(function (n) { return "Line " + n; }), example: v.ex,
            working: ["Say what each line does to each variable.", "Which line first makes the result different from what it should be?"], note: v.why };
        } },
      { id: "ex-10", category: "ex-errors", randomize: function () {
          var v = drillPick([["Mark", "Pass", "Fail", "the pass mark"], ["Points", "Win", "Lose", "the winning score"], ["Height", "Ride", "Wait", "the height limit"]]);
          var k = drillRange(4, 14) * 5;
          var lines = ["DECLARE " + v[0] + " : INTEGER", v[0] + " <- " + k, "IF " + v[0] + " > " + k + " THEN", "    OUTPUT \"" + v[1] + "\"", "ELSE", "    OUTPUT \"" + v[2] + "\"", "ENDIF"];
          var o = run(lines)[0];
          return { prompt: "The rule is " + k + " or more. Follow this program exactly as it is written. What does it output?\n" + show(lines),
            answers: [o], keywords: [new RegExp("^\\s*[\"']?\\s*" + o + "\\s*[\"']?\\s*\\.?\\s*$", "i")], distractors: [o === v[1] ? v[2] : v[1]],
            example: "Example: the rule is 20 or more, and the program says IF Temp > 20 THEN OUTPUT \"Hot\" ELSE OUTPUT \"Cold\".\nTemp is 20. Is 20 > 20? No: 20 is equal, not more.\nSo the ELSE part runs, and it outputs Cold.",
            working: ["Put the value into the condition. Is it more than the number?", "Equal is not more. Which part runs when the condition is FALSE?"],
            note: k + " is not more than " + k + ", so the ELSE part runs. It should be >= " + k + "." };
        } }
    ];
  })()
});
}

function DRILL_CODE() {
// Year 9, 3.1: Following and Correcting Pseudocode (Activity 2: correct the program)
// Loaded by Drills/index.html?drill=y9-3-1-code
// Code cards: the editor opens holding a program with ONE error (`starter`). The question states the purpose and
// what goes wrong; the student finds the line that causes it, corrects it and runs it. It must give the same output
// as the reference with new values each time (typed-in values and array values are redrawn on every card).
// Fix the Order: a line is in the wrong place. Fix the Line: one line says the wrong thing.
DrillData.register("y9-3-1-code", {
  title: "Year 9, 3.1: Correct the Program",
  subtitle: "Each program has one error. Read the purpose, find the line, correct it, run it.",
  codeDrill: true,
  categories: [
    ["code-order", "Fix the Order"],
    ["code-line", "Fix the Line"]
  ],
  cards: (function () {
    function nums(n, from, to) { var o = []; while (o.length < n) o.push(from + Math.floor(Math.random() * (to - from + 1))); return o; }
    function withValue(n, from, to, must, times) {
      var o = nums(n - times, from, to);
      for (var i = 0; i < times; i++) o.splice(Math.floor(Math.random() * (o.length + 1)), 0, must);
      return o;
    }
    return [
      {
        id: "code-order-1", category: "code-order",
        prompt: "This program should output the total of 1 to 5, once, at the end. It outputs 1, 3, 6, 10, 15. Move one line, then run it.",
        starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 5\n    Total <- Total + Count\n    OUTPUT Total\nNEXT Count",
        reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 5\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-order-2", category: "code-order",
        prompt: "This program should add up 2 to 6 and output 20. It outputs 6. Move one line, then run it.",
        starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nFOR Count <- 2 TO 6\n    Total <- 0\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
        reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 2 TO 6\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-order-3", category: "code-order",
        prompt: "This program should count how many of the 5 numbers typed in are 10 or more. It only ever checks the last number. Move the IF so it checks every number, then run it.",
        inputs: function () {
          var o;
          do { o = withValue(5, 1, 20, 10, 1); } while (o.filter(function (v) { return v >= 10; }).length < 2);
          return o;
        },
        starter: "DECLARE Number : INTEGER\nDECLARE Count : INTEGER\nDECLARE Big : INTEGER\nBig <- 0\nFOR Count <- 1 TO 5\n    INPUT Number\nNEXT Count\nIF Number >= 10 THEN\n    Big <- Big + 1\nENDIF\nOUTPUT Big",
        reference: "DECLARE Number : INTEGER\nDECLARE Count : INTEGER\nDECLARE Big : INTEGER\nBig <- 0\nFOR Count <- 1 TO 5\n    INPUT Number\n    IF Number >= 10 THEN\n        Big <- Big + 1\n    ENDIF\nNEXT Count\nOUTPUT Big",
        checkVars: ["Big"],
        checkOutput: true
      },
      {
        id: "code-order-4", category: "code-order",
        prompt: "This program should output the total of the 4 numbers typed in. It always outputs 0. Move one line, then run it.",
        inputs: function () { return nums(4, 2, 30); },
        starter: "DECLARE Number : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nOUTPUT Total\nFOR Count <- 1 TO 4\n    INPUT Number\n    Total <- Total + Number\nNEXT Count",
        reference: "DECLARE Number : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Number\n    Total <- Total + Number\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-line-1", category: "code-line",
        prompt: "This program should input 4 marks and output their total. It ignores every mark typed in. Correct the line that causes it, then run it.",
        inputs: function () { return nums(4, 1, 20); },
        starter: "DECLARE Mark : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    OUTPUT Mark\n    Total <- Total + Mark\nNEXT Count\nOUTPUT Total",
        reference: "DECLARE Mark : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Mark\n    Total <- Total + Mark\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-line-2", category: "code-line",
        prompt: "This program should count the marks of 50 or more. A mark of exactly 50 is not counted. Correct the line that causes it, then run it.",
        inputs: function () { return withValue(5, 30, 70, 50, 2); },
        starter: "DECLARE Mark : INTEGER\nDECLARE Count : INTEGER\nDECLARE Passes : INTEGER\nPasses <- 0\nFOR Count <- 1 TO 5\n    INPUT Mark\n    IF Mark > 50 THEN\n        Passes <- Passes + 1\n    ENDIF\nNEXT Count\nOUTPUT Passes",
        reference: "DECLARE Mark : INTEGER\nDECLARE Count : INTEGER\nDECLARE Passes : INTEGER\nPasses <- 0\nFOR Count <- 1 TO 5\n    INPUT Mark\n    IF Mark >= 50 THEN\n        Passes <- Passes + 1\n    ENDIF\nNEXT Count\nOUTPUT Passes",
        checkVars: ["Passes"],
        checkOutput: true
      },
      {
        id: "code-line-3", category: "code-line",
        prompt: "This program should output the total of all four values in Prices (see Given). The wrong total shows at the end, but the error is earlier: one value is never added. Correct it, then run it.",
        setup: { "Prices": [5, 12, 3, 10] },
        starter: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 2 TO 4\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total",
        reference: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-line-4", category: "code-line",
        prompt: "This program should input 4 prices and output their total. It outputs only the last price. Correct the line that causes it, then run it.",
        inputs: function () { return nums(4, 2, 25); },
        starter: "DECLARE Price : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Price\n    Total <- Price\nNEXT Count\nOUTPUT Total",
        reference: "DECLARE Price : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Price\n    Total <- Total + Price\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      }
    ];
  })()
});
}

function DRILL_PLENARY() {
// Year 9, 3.1: Following and Correcting Pseudocode (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-3-1-pseudocode
// Four categories, mirroring the lesson: follow a program line by line; why the order of the lines changes the
// result; the value on the line (> and >=, < and <=); and find, fix and prove a correction. Number and word answers
// are worked out by running the card's own program in shared/pseudocode-engine.js when the card is drawn.
// Explanation cards need two connected ideas. The question comes first and the program after it.
DrillData.register("y9-3-1-pseudocode", {
  title: "Year 9, 3.1: Following and Correcting Pseudocode",
  subtitle: "Line by line, order, the value on the line, and find, fix, prove",
  choiceOnly: true,
  categories: [
    ["pl-line", "Line by Line"],
    ["pl-order", "Order Matters"],
    ["pl-bound", "The Value on the Line"],
    ["pl-fix", "Find, Fix, Prove"]
  ],
  cards: (function () {
    var A = "\u2190";
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    // Run a program in the pseudocode engine. watch: [line, expr] also records expr each time that line has run.
    function run(lines, inputs, watch) {
      var src = lines.slice();
      if (watch) src.splice(watch[0], 0, "OUTPUT \"#w#\"", "OUTPUT " + watch[1]);
      var r = PseudocodeEngine.runPseudocode(src.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + src.join("\n"));
      var o = [], w = [];
      for (var i = 0; i < r.outputs.length; i++) {
        if (r.outputs[i] === "#w#") { w.push(String(r.outputs[i + 1])); i++; } else o.push(String(r.outputs[i]));
      }
      return { out: o, watched: w };
    }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) + 2, Number(ans) - 1, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function lineRe(n) { return new RegExp("^\\s*(line\\s*)?0?" + n + "\\s*\\.?\\s*$", "i"); }
    function nums(n, from, to, avoid) { var o = [], v; while (o.length < n) { v = drillRange(from, to); if (!avoid || avoid.indexOf(v) === -1) o.push(v); } return o; }
    function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }

    return [
      // ------------------------------------------------ Line by Line
      { id: "l-chain", category: "pl-line", randomize: function () {
          var a = drillRange(2, 6), b = drillRange(2, 5), c = drillRange(2, 3);
          var lines = ["DECLARE A : INTEGER", "DECLARE B : INTEGER", "A <- " + a, "B <- A + " + b, "A <- B * " + c, "OUTPUT A"];
          var o = run(lines).out[0];
          return { prompt: "Follow this program one line at a time. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [a * c, a + b, a + b + c]),
            working: ["Line 4 uses the value A holds now.", "Line 5 uses the new B. The old value of A is replaced."],
            note: "B = " + a + " + " + b + " = " + (a + b) + ". Then A = " + (a + b) + " * " + c + " = " + o + "." };
        } },
      { id: "l-copy", category: "pl-line", randomize: function () {
          var a = drillRange(3, 9), b = drillRange(2, 6);
          var lines = ["DECLARE X : INTEGER", "DECLARE Y : INTEGER", "X <- " + a, "Y <- X", "X <- X + " + b, "OUTPUT Y"];
          var o = run(lines).out[0];
          return { prompt: "Follow this program exactly as it is written. What does line 6 output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [a + b, b, 0]),
            working: ["Line 4 copies the value of X into Y.", "Does line 5 change Y, or only X?"],
            note: "Y got a copy of " + a + " on line 4. Line 5 changes only X." };
        } },
      { id: "l-pass", category: "pl-line", randomize: function () {
          var a = drillRange(2, 7), k = drillRange(2, 4);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- " + a + " TO " + (a + 3), "    Total <- Total + Count * " + k, "NEXT Count", "OUTPUT Total"];
          var r = run(lines, [], [5, "Total"]), second = r.watched[1];
          return { prompt: "Trace this program slowly. What is Total after the SECOND pass of the loop?\n" + show(numbered(lines)),
            answers: [second], keywords: [drillNumberRe(Number(second))], distractors: others(second, [Number(r.out[0]), Number(r.watched[0]), Number(r.watched[2])]),
            working: ["Pass 1 uses the first value of Count. Work out line 5.", "Pass 2 uses the next value. Add it to Total, then stop."],
            note: "Total after each pass: " + r.watched.join(", ") + "." };
        } },
      { id: "l-why", category: "pl-line",
        prompt: "Why does this program output 5, and not 9?\n" + "01 DECLARE X : INTEGER\n02 DECLARE Y : INTEGER\n03 X \u2190 5\n04 Y \u2190 X\n05 X \u2190 X + 4\n06 OUTPUT Y",
        answers: ["Y got a copy of 5; line 5 changes only X"],
        keywords: [/^(?=.*\b(cop(y|ied|ies)|stor(e|ed|es)|gave|given|got|gets|value|5)\b)(?=.*(only\s+(changes\s+)?x\b|not\s+y\b|x\s+(changes|is\s+changed|was\s+changed)|chang(e|es|ed)\s+(only\s+)?x\b|after|later|separate))/i],
        distractors: ["Y always keeps the first value it sees", "OUTPUT cannot show the new value of X", "X + 4 is a syntax error, so it stops"],
        working: ["What did line 4 put into Y?", "Which variable does line 5 change?"],
        note: "Line 4 copies 5 into Y. Line 5 changes only X, so Y is still 5." },

      // ------------------------------------------------ Order Matters
      { id: "o-inside", category: "pl-order", randomize: function () {
          var n = drillRange(3, 7);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO " + n, "    Total <- Total + Count", "    OUTPUT Total", "NEXT Count"];
          var c = run(lines).out.length;
          return { prompt: "This program should output the total once. Follow it exactly as it is written. How many numbers does it output?\n" + show(numbered(lines)),
            answers: [String(c)], keywords: [new RegExp("^\\s*" + c + "\\s*(numbers?|times?)?\\s*\\.?\\s*$", "i")], distractors: others(c, [1, c - 1, c + 1]),
            working: ["Which lines are between FOR and NEXT?", "A line inside the loop runs on every pass."],
            note: "OUTPUT is inside the loop, so it runs on all " + c + " passes. It belongs after NEXT." };
        } },
      { id: "o-reset", category: "pl-order", randomize: function () {
          var a = drillRange(2, 5), b = a + drillRange(2, 4);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    Total <- 0", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
          var o = run(lines).out[0], sum = 0;
          for (var c = a; c <= b; c++) sum += c;
          return { prompt: "This program should add up " + a + " to " + b + ". Follow it exactly as it is written. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [sum, 0, a]),
            working: ["What happens to Total at the start of every pass?", "After the last pass, what is left in Total?"],
            note: "Line 4 sets Total back to 0 on every pass, so only the last Count is left. It belongs before the loop." };
        } },
      { id: "o-ifafter", category: "pl-order", randomize: function () {
          var typed, good;
          do { typed = nums(5, 2, 25); good = typed.filter(function (v) { return v >= 10; }).length; } while (good < 2);
          var lines = ["DECLARE Number : INTEGER", "DECLARE Count : INTEGER", "DECLARE Big : INTEGER", "Big <- 0", "FOR Count <- 1 TO 5", "    INPUT Number", "NEXT Count",
            "IF Number >= 10 THEN", "    Big <- Big + 1", "ENDIF", "OUTPUT Big"];
          var o = run(lines, typed).out[0];
          return { prompt: "This program should count the numbers that are 10 or more. The user types " + typed.join(", ") + ". Follow it exactly as it is written. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [good, good - 1, 5]),
            working: ["Is the IF inside the loop, or after NEXT?", "After the loop, Number holds only the last value typed."],
            note: "The IF runs once, after the loop, on the last number only. It should be inside the loop, after INPUT." };
        } },
      { id: "o-why", category: "pl-order",
        prompt: "Why does putting Total \u2190 0 inside the loop give the wrong total?",
        answers: ["Total goes back to 0 on every pass"],
        keywords: [/^(?=.*\b(every|each)\b)(?=.*(\b0\b|zero|reset|start(s|ed)?\s+again|back))/i],
        distractors: ["Total can never hold the value 0", "The loop then runs one extra time", "OUTPUT then runs before the loop"],
        working: ["How many times does a line inside the loop run?", "What happens to the total so far when Total is set to 0?"],
        note: "Inside the loop, Total \u2190 0 runs on every pass, so the total so far is lost. It belongs before the loop." },

      // ------------------------------------------------ The Value on the Line
      { id: "b-equal", category: "pl-bound", randomize: function () {
          var op = drillPick([">", ">", "<"]);
          var v = op === ">" ? drillPick([["Mark", "Pass", "Fail"], ["Score", "Win", "Lose"], ["Age", "Join", "Wait"]]) : drillPick([["Temp", "Cold", "Warm"], ["Price", "Cheap", "Dear"]]);
          var k = drillRange(3, 14) * 5;
          var rule = op === ">" ? k + " or more" : k + " or less";
          var lines = ["DECLARE " + v[0] + " : INTEGER", v[0] + " <- " + k, "IF " + v[0] + " " + op + " " + k + " THEN", "    OUTPUT \"" + v[1] + "\"", "ELSE", "    OUTPUT \"" + v[2] + "\"", "ENDIF"];
          var o = run(lines).out[0];
          return { prompt: "The rule says " + v[1] + " for " + rule + ". Follow this program exactly as it is written. What does it output?\n" + show(lines),
            answers: [o], keywords: [new RegExp("^\\s*[\"']?\\s*" + o + "\\s*[\"']?\\s*\\.?\\s*$", "i")], distractors: [o === v[1] ? v[2] : v[1]],
            working: ["Put the value into the condition. Is it TRUE or FALSE?", "Equal is not more, and not less. Which part runs when the condition is FALSE?"],
            note: k + " " + op + " " + k + " is FALSE, so the ELSE part runs. The rule needs " + op + "=." };
        } },
      { id: "b-count", category: "pl-bound", randomize: function () {
          var k = drillRange(4, 9) * 10, typed = shuffled([k, k].concat(nums(3, k - 15, k + 15, [k])));
          var lines = ["DECLARE Mark : INTEGER", "DECLARE Count : INTEGER", "DECLARE Passes : INTEGER", "Passes <- 0", "FOR Count <- 1 TO 5", "    INPUT Mark",
            "    IF Mark > " + k + " THEN", "        Passes <- Passes + 1", "    ENDIF", "NEXT Count", "OUTPUT Passes"];
          var o = run(lines, typed).out[0], good = typed.filter(function (m) { return m >= k; }).length;
          return { prompt: "A pass is " + k + " or more. The user types " + typed.join(", ") + ". Follow this program exactly as it is written. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [good, good - 1, 5]),
            working: ["Check each mark with line 7, one at a time.", "A mark exactly on the line: is it more?"],
            note: "Only the marks more than " + k + " count: " + o + ". The two marks of " + k + " are missed. It should be >= " + k + "." };
        } },
      { id: "b-fix", category: "pl-bound", randomize: function () {
          var k = drillRange(4, 9) * 10 + drillPick([0, 5]);
          var lines = ["DECLARE Score : INTEGER", "INPUT Score", "IF Score > " + k + " THEN", "    OUTPUT \"Bonus\"", "ENDIF"];
          return { prompt: "A bonus is for a score of " + k + " or more. Which line should replace line 3?\n" + show(numbered(lines)),
            answers: ["IF Score >= " + k + " THEN"], keywords: [new RegExp("^\\s*if\\s+(score\\s*(>=\\s*" + k + "|>\\s*" + (k - 1) + ")|" + k + "\\s*<=\\s*score)\\s*(then)?\\s*\\.?\\s*$", "i")],
            distractors: ["IF Score <= " + k + " THEN", "IF Score = " + k + " THEN", "IF Score > " + (k + 1) + " THEN"],
            working: ["Does \"or more\" include the number itself?", "Which comparison is TRUE when the score is exactly on the line?"],
            note: ">= means more than or equal to, so a score of " + k + " gets the bonus." };
        } },
      { id: "b-why", category: "pl-bound",
        prompt: "Members must be 13 or over. Why does IF Age > 13 THEN not let a member aged 13 join?",
        answers: ["13 is not more than 13, so it needs >="],
        keywords: [/^(?=.*(not\s+(more|greater|bigger|over|larger)|equal|same))(?=.*(>=|or\s+equal|greater\s+than\s+or|more\s+than\s+or|equal\s+to))/i],
        distractors: ["13 is a syntax error in the IF line", "The IF runs before the INPUT line", "Age must be stored as a STRING"],
        working: ["Is 13 > 13 TRUE or FALSE?", "Which operator also includes the value itself?"],
        note: "13 > 13 is FALSE: 13 is equal, not more. Age >= 13 includes 13." },

      // ------------------------------------------------ Find, Fix, Prove
      { id: "f-input", category: "pl-fix", randomize: function () {
          var v = drillPick([["Mark", "marks"], ["Price", "prices"], ["Score", "scores"]]);
          var typed = nums(4, 2, 20);
          var lines = ["DECLARE " + v[0] + " : INTEGER", "DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    OUTPUT " + v[0],
            "    Total <- Total + " + v[0], "NEXT Count", "OUTPUT Total"];
          var o = run(lines, typed).out;
          return { prompt: "This program should input 4 " + v[1] + " and output their total. The user types " + typed.join(", ") + ". It outputs " + o.join(", ") + ". Which line causes it?\n" + show(numbered(lines)),
            answers: ["Line 6"], keywords: [lineRe(6)], distractors: ["Line 9", "Line 7", "Line 4"],
            working: ["Which line should take in what the user types?", "Is that line an INPUT, or an OUTPUT?"],
            note: "Line 6 should be INPUT " + v[0] + ". The wrong total shows on line 9, but it starts on line 6." };
        } },
      { id: "f-start", category: "pl-fix", randomize: function () {
          var vals = nums(4, 3, 15), sum = vals.reduce(function (a, b) { return a + b; }, 0);
          var lines = ["DECLARE Values : ARRAY[1:4] OF INTEGER", "DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total <- 0", "FOR Index <- 2 TO 4",
            "    Total <- Total + Values[Index]", "NEXT Index", "OUTPUT Total"];
          var full = lines.slice(0, 1).concat(vals.map(function (x, j) { return "Values[" + (j + 1) + "] <- " + x; })).concat(lines.slice(1));
          var o = run(full).out[0];
          return { prompt: "Values holds " + vals.join(", ") + " at index 1 to 4. This program should output their total, " + sum + ". It outputs " + o + ". Which line causes it?\n" + show(numbered(lines)),
            answers: ["Line 5"], keywords: [lineRe(5)], distractors: ["Line 8", "Line 6", "Line 4"],
            working: ["Which values of Index does the loop use?", "Is the first value in the array ever added?"],
            note: "Line 5 starts at 2, so Values[1] is never added. The wrong total shows on line 8, but the cause is line 5." };
        } },
      { id: "f-write", category: "pl-fix",
        prompt: "This program should input 4 prices and output their total. It outputs only the last price. Which line should replace line 7?\n" +
          "01 DECLARE Price : INTEGER\n02 DECLARE Total : INTEGER\n03 DECLARE Count : INTEGER\n04 Total \u2190 0\n05 FOR Count \u2190 1 TO 4\n06     INPUT Price\n07     Total \u2190 Price\n08 NEXT Count\n09 OUTPUT Total",
        answers: ["Total \u2190 Total + Price"], keywords: [/^\s*total\s*(<-|\u2190)\s*(total\s*\+\s*price|price\s*\+\s*total)\s*\.?\s*$/i],
        distractors: ["Total \u2190 Price + 1", "Price \u2190 Total + Price", "Total \u2190 Total + 1"],
        working: ["Should Total keep its old value on each pass?", "What must be added to Total on each pass?"],
        note: "Total \u2190 Total + Price keeps the total so far and adds the new price." },
      { id: "f-prove", category: "pl-fix", randomize: function () {
          var typed = nums(4, 2, 20);
          var lines = ["DECLARE Price : INTEGER", "DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    INPUT Price",
            "    Total <- Total + Price", "NEXT Count", "OUTPUT Total"];
          var o = run(lines, typed).out[0];
          return { prompt: "Line 7 was Total " + A + " Price. It has been corrected. The user types " + typed.join(", ") + ". Trace it again. What does it output now?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [typed[3], Number(o) - typed[0], Number(o) + 1]),
            working: ["Total starts at 0. Each pass adds the price typed.", "Write Total after every pass."],
            note: "Total after each pass: " + run(lines, typed, [7, "Total"]).watched.join(", ") + ". The new trace gives the total, so the fix works." };
        } },
      { id: "f-why", category: "pl-fix",
        prompt: "Why should you trace a program again after you correct it?",
        answers: ["To check the fix gives the right output"],
        keywords: [/^(?=.*\b(prove|proves|check|checks|test|tests|see|show|shows|sure|confirm)\b)(?=.*\b(right|correct|works?|purpose|expected|job|new\s+error|another\s+error)\b)/i],
        distractors: ["To make the corrected program run faster", "To change the purpose of the program", "To find the line where the error shows"],
        working: ["Could a fix be wrong, or cause a new error?", "What must the new trace give?"],
        note: "A fix is a guess until it is tested. The new trace must give what the purpose says." }
    ];
  })()
});
}

const DRILL_DIR = path.join(ROOT, 'Drills', 'data');
function writeDrill(id, fn) {
  const src = fn.toString();
  const body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}')).replace(/^\r?\n/, '').replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(body), `em or en dash in ${id}`);
  assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV)\b/.test(body), `a construct Year 9 has not met in ${id}`);
  fs.writeFileSync(path.join(DRILL_DIR, id + '.js'), body);
  return body;
}
const drillSrc = { 'y9-3-1-ext': writeDrill('y9-3-1-ext', DRILL_EXT), 'y9-3-1-code': writeDrill('y9-3-1-code', DRILL_CODE), 'y9-3-1-pseudocode': writeDrill('y9-3-1-pseudocode', DRILL_PLENARY) };

// Load each drill as the page does (engine, helpers, data) and draw every card many times.
const registered = {};
const ctx = vm.createContext({ console, Math, JSON, DrillData: { register: (id, d) => { registered[id] = d; } } });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
for (const [id, src] of Object.entries(drillSrc)) vm.runInContext(src, ctx, { filename: id + '.js' });
const typedMatch = (card, s) => (card.keywords || []).some((k) => k.test(s));
for (const id of ['y9-3-1-ext', 'y9-3-1-pseudocode']) {
  const d = registered[id];
  assert(d && d.cards.length, id + ' registered');
  for (const card of d.cards) {
    for (let t = 0; t < (card.randomize ? 300 : 1); t++) {
      const c = card.randomize ? { ...card, ...card.randomize() } : card;
      const where = `${id} ${card.id}`;
      assert(c.prompt && c.answers && c.answers.length && c.keywords && c.keywords.length, where + ' fields');
      assert(typedMatch(c, c.answers[0]), `${where}: own answer "${c.answers[0]}" fails its keywords`);
      assert(c.distractors && c.distractors.length >= 1, where + ' distractors');
      for (const x of c.distractors) assert(!typedMatch(c, x) && x !== c.answers[0], `${where}: distractor "${x}" passes`);
      if (!['ex-10', 'b-equal'].includes(card.id)) assert(c.distractors.length === 3, `${where}: three distractors (${c.distractors.join(' | ')})`);
      assert(c.working && c.working.length === 2, where + ' two working nudges');
      if (id === 'y9-3-1-ext') {
        assert(c.example, where + ' example');
        const ans = String(c.answers[0]).toLowerCase();
        if (ans.length >= 3) assert(!new RegExp('(^|[^a-z0-9])' + ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(c.example.toLowerCase()), `${where}: example contains the answer ${ans}`);
      }
      const ansRe = new RegExp('(^|[^\\w.-])' + String(c.answers[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w|\\.\\d)', 'i');
      if (!ansRe.test(c.prompt)) for (const w of c.working) assert(!ansRe.test(w), `${where}: working shows the answer: ${w}`);
      const q = c.prompt.split('\n')[0];
      assert(!/^(DECLARE|\d\d )/.test(q), `${where}: the question comes before the program`);
    }
  }
}
// Explanation cards: right ideas pass, half an idea fails.
{
  const card = (id) => registered['y9-3-1-pseudocode'].cards.find((c) => c.id === id);
  const ok = (id, s) => typedMatch(card(id), s);
  for (const s of ['Y got a copy of 5 and line 5 only changes X', 'Y stores the value 5. X changes after that', 'Y was given 5 before X was changed']) assert(ok('l-why', s), 'l-why accepts ' + s);
  for (const s of ['Y is 5', 'X changes', 'Because of line 5']) assert(!ok('l-why', s), 'l-why rejects ' + s);
  for (const s of ['Total goes back to 0 on every pass', 'it resets each time the loop runs', 'each pass Total starts again at zero']) assert(ok('o-why', s), 'o-why accepts ' + s);
  for (const s of ['Total is 0', 'it runs every pass', 'it resets']) assert(!ok('o-why', s), 'o-why rejects ' + s);
  for (const s of ['13 is equal to 13 so you need >=', '13 is not more than 13, it should be greater than or equal']) assert(ok('b-why', s), 'b-why accepts ' + s);
  for (const s of ['13 is not more than 13', 'use >=', '13 is the same']) assert(!ok('b-why', s), 'b-why rejects ' + s);
  for (const s of ['to check the fix works', 'to prove it gives the correct output', 'to make sure there is no new error']) assert(ok('f-why', s), 'f-why accepts ' + s);
  for (const s of ['to check it', 'it is correct', 'to see']) assert(!ok('f-why', s), 'f-why rejects ' + s);
}
// Code cards: every reference runs and every starter gives a different result, with many random draws.
for (const card of registered['y9-3-1-code'].cards) {
  for (let t = 0; t < 40; t++) {
    const setup = {};
    for (const [k, v] of Object.entries(card.setup || {})) setup[k] = Array.isArray(v) ? v.map(() => 1 + Math.floor(Math.random() * 20)) : v;
    const typed = typeof card.inputs === 'function' ? card.inputs(setup) : card.inputs;
    const ref = runPseudocode(card.reference, setup, 5000, typed);
    const st = runPseudocode(card.starter, setup, 5000, typed);
    assert(!ref.error, `${card.id} reference: ${ref.error && ref.error.message}`);
    assert(st.error || JSON.stringify(st.outputs) !== JSON.stringify(ref.outputs), `${card.id}: the starter already gives the right output`);
  }
  assert(card.starter.split('\n').length === card.reference.split('\n').length, `${card.id}: one line changed or moved`);
}
{
  const r = runPseudocode(registered['y9-3-1-code'].cards[0].starter, {}, 5000, []);
  assert(r.outputs.join(', ') === '1, 3, 6, 10, 15', 'code-order-1 prompt matches its starter');
  assert(runPseudocode(registered['y9-3-1-code'].cards[1].starter, {}, 5000, []).outputs.join() === '6' && runPseudocode(registered['y9-3-1-code'].cards[1].reference, {}, 5000, []).outputs.join() === '20', 'code-order-2 prompt matches');
}

// ================================================================= register the lesson
// Year 9 Term 1b starts a new unit, after the existing Year 9 units. lessons.json is shared with other builders, so it
// is read straight before the write and only this unit is touched.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all9 = JSON.parse(raw);
const indent = (raw.match(/\n( +)"/) || [, ' '])[1];
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const roundTrip = JSON.stringify(all9, null, indent).replace(/\n/g, nl) + (/\r?\n$/.test(raw) ? nl : '');
assert(roundTrip === raw, 'lessons.json is in the standard layout, so it can be written back unchanged apart from this unit');
const y9 = all9.years.find((y) => y.id === 'year9');
const UNIT = 'Pseudocode and Software Development';
let unit = y9.units.find((u) => u.title === UNIT);
if (!unit) { unit = { code: '', title: UNIT, lessons: [] }; y9.units.push(unit); }
if (!unit.lessons.includes(ID)) unit.lessons.unshift(ID);
fs.writeFileSync(lp, JSON.stringify(all9, null, indent).replace(/\n/g, nl) + (/\r?\n$/.test(raw) ? nl : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; drills: ` +
  Object.entries(registered).map(([k, d]) => `${k} (${d.cards.length})`).join(', ') + `; Year 9 units: ${y9.units.map((u) => u.title + ' [' + u.lessons.join(', ') + ']').join('; ')}`);
