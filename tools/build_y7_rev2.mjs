// Builds LessonData/y7-revision-2.json: Year 7, Revision 2: Decisions and Sub-routines, the second and last lesson
// before the Term 1 exam, and registers it in the Year 7 "Term 1 Exam Revision" unit after y7-revision-1.
//   node tools/build_y7_rev2.mjs
// Revision 1 covered Lessons 1 and 2. This lesson covers Lessons 3 and 4: AND, OR, NOT and comparisons, then
// sub-routines and CALL, and ends with exam-style practice across all four lessons. Same style as
// build_y7_rev1.mjs: EAL-light, one idea per slide, typed answers, a teacher-only Think, Pair, Share under every
// heading, predict-then-reveal teaching slides and Compare slides. Do Now: two recap slides on Revision 1 (each
// with a Walk me through it), then the y7-revision-2-ext Extension drill. Plenary: the y7-revision-2 drill.
// Year 7 has no exam board papers, so nothing carries a citation. Flowcharts are drawn by Drills/flowchart-core.js
// and every answer below comes from running the flowchart.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-revision-2';
const P = 'y7r2';
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- pieces (as in build_y7_rev1.mjs)
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
// hl: shape numbers to highlight (0 = Start, in node order; a sub-routine's shapes follow Main's).
function chart(flow, maxH = 400, hl = []) {
  let i = -1;
  const svg = FC.svg(flow, !!flow.numbered).replace(/<(rect|polygon) class="fc-[btd]"/g, (m) => {
    i++;
    return hl.includes(i) ? m + ' style="stroke:var(--warn);stroke-width:5;fill:rgba(253,214,99,.3)"' : m;
  });
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    svg.replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
}
function keyLoop(key, dir, step) {
  return { nodes: [
    { id: 's', type: 'terminal', text: 'Start' }, { id: 'd', type: 'decision', text: key + ' pressed?' },
    { id: 'p', type: 'process', text: 'Point in direction ' + dir }, { id: 'm', type: 'process', text: 'Move ' + step + ' steps' },
  ], edges: [
    { from: 's', to: 'd', label: null }, { from: 'd', to: 'p', label: 'True' }, { from: 'p', to: 'm', label: null },
    { from: 'm', to: 'd', label: null }, { from: 'd', to: 'd', label: 'False' },
  ] };
}
// One decision: True runs one box, False runs another, both reach End (as in the Year 7 recap drill).
function branch(question, trueBox, falseBox) {
  return { nodes: [
    { id: 's', type: 'terminal', text: 'Start' }, { id: 'd', type: 'decision', text: question },
    { id: 't', type: trueBox[0], text: trueBox[1] }, { id: 'e', type: 'terminal', text: 'End' }, { id: 'f', type: falseBox[0], text: falseBox[1] },
  ], edges: [
    { from: 's', to: 'd', label: null }, { from: 'd', to: 't', label: 'True' }, { from: 'd', to: 'f', label: 'False' },
    { from: 't', to: 'e', label: null }, { from: 'f', to: 'e', label: null },
  ] };
}
const say = (w) => ['io', `Say "${w}"`];
const withSub = (main, name, sub) => Object.assign(main, { subs: { [name]: sub } });
const numbered = (flow) => Object.assign(flow, { numbered: true });

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '') {
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
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
const num = (n, unit = '') => `^\\s*(box\\s*)?${n < 0 ? '[-\\u2212]\\s*' + Math.abs(n) : n}\\s*${unit ? `(${unit})?` : ''}\\s*$`;
const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
const sayBox = (w) => `^\\s*(say\\s*:?\\s*)?["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*$`;
const moveBox = (n) => `^\\s*move\\s*:?\\s*${n}(\\s*steps?)?\\s*$`;
const once = '^\\s*(1|one|once)(\\s*times?)?\\s*$';
const arrow = (tf) => `^\\s*(the\\s+)?${tf}(\\s+arrow)?\\s*$`;
const bit = (v) => `^\\s*(${v}|${v ? 'true' : 'false'})\\s*$`;
// Words said in order, with commas, "then" or "and" between them.
const inOrder = (ws) => '^\\s*' + ws.map((w) => `["'\\u201c]?${w}["'\\u201d]?`).join('\\s*(,|;|then|and|\\s)\\s*(then\\s+)?') + '\\s*\\.?\\s*$';
const SYM_DECISION = '^\\s*(an?\\s+)?(decision|diamond)(\\s+(symbol|shape|box))?\\s*$';
const SYM_IO = '^\\s*(an?\\s+)?(input\\s*(or|\\/|and)?\\s*output|output|input|sloping|parallelogram)(\\s+(symbol|shape|box))?\\s*$';
const bigTable = (html) => html.replace('<table class="donow-table">', '<table class="donow-table" style="font-size:17px;width:100%">')
  .replace(/<t([hd])>/g, '<t$1 style="padding:7px 12px;text-align:left;font-size:17px">');

// Think, Pair, Share under each slide's heading (James, 2026-09-30): one short question, answer hidden until the
// teacher clicks. On teaching slides it is a prediction and the click shows the worked answer.
const TPS = {
  'do-now': ['Why do we read one box at a time?', 'The computer runs one box at a time. We read it the same way, so we get the same answer.'],
  'do-now-2': ['Why does "not pressed" add no steps?', 'The False arrow goes back to the decision. It never reaches the Move box.'],
  'key-words': ['Why does a decision give 1 or 0?', 'A decision has only two arrows. 1 follows True and 0 follows False.'],
  'logic-check': ['Why can OR be True when only one key is pressed?', 'OR needs at least one part to be 1. One pressed key is enough.'],
  'compare-check': ['Why must you put the numbers in first?', 'The decision compares the two numbers. You need the numbers to get 1 or 0.'],
  'activity-1': ['Why must box A be a decision?', 'It asks a question. It needs a True arrow and a False arrow.'],
  'call-check': ['Why is a sub-routine written only once?', 'Each CALL runs the same flowchart again. We never copy its boxes.'],
  'activity-2': ['Why use a sub-routine here?', 'The same boxes are needed twice. We write them once and CALL them twice.'],
  'exam-1': ['Which lesson is this question from? How do you know?', 'Lesson 2: a key-press loop. A decision checks a key and both arrows go back.'],
  'exam-2': ['What do you do first with a comparison?', 'Put the two numbers into the question. Then decide: 1 (True) or 0 (False).'],
  'exam-3': ['Where does Main carry on after a sub-routine ends?', 'Just after the CALL. Never back at Main\'s own Start.'],
  'plenary': ['Why practise with new numbers every time?', 'If you can do it with any numbers, you really understand it.'],
};
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const paneTitle = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
function compare(id, label, lead, a, b, question, answer, maxH = 330) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2><p class="lesson-lead">${lead}</p>` +
    tps(question, answer) + columns(paneTitle('Flowchart A') + chart(a, maxH), paneTitle('Flowchart B') + chart(b, maxH)) };
}
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (Lesson 1): read a flowchart
const DN1 = numbered(FC.line([['process', 'Move 40 steps'], say('Hello'), ['process', 'Move 50 steps'], say('Wave')]));
const dn1 = FC.run(DN1);
assert(dn1.steps === 90 && dn1.said.join() === 'Hello,Wave', 'do-now 1');
// Walk me through it: a similar flowchart with other numbers and words. Shapes: 0 Start, 1 Move 10, 2 Say Hi, 3 Move 20, 4 Say Bye, 5 End.
const W1 = numbered(FC.line([['process', 'Move 10 steps'], say('Hi'), ['process', 'Move 20 steps'], say('Bye')]));
const w1 = FC.run(W1);
assert(w1.steps === 30 && w1.said.join() === 'Hi,Bye', 'walkthrough 1');
const WT_READ = { title: 'Walk me through it: read a flowchart', steps: [
  { text: 'This is a different flowchart. Your question has other numbers, so you still do the working yourself.', visual: chart(W1, 300) },
  { text: 'Begin at <strong>Start</strong>. The sprite has moved 0 steps.', visual: chart(W1, 300, [0]) + note('Steps so far: ' + hl('0')) },
  { text: 'Follow the arrow. <strong>Move 10 steps</strong>: add 10.', visual: chart(W1, 300, [1]) + note('Steps so far: ' + hl('10')) },
  { text: '<strong>Say "Hi"</strong> shows a message. It does not move the sprite.', visual: chart(W1, 300, [2]) + note('Steps so far: 10. Said: ' + hl('Hi')) },
  { text: '<strong>Move 20 steps</strong>: add 20. 10 + 20 = 30.', visual: chart(W1, 300, [3]) + note('Steps so far: ' + hl('30')) },
  { text: '<strong>Say "Bye"</strong>. This is the last Say box before End.', visual: chart(W1, 300, [4]) + note('Said: Hi, then ' + hl('Bye')) },
  { text: 'At <strong>End</strong>: 30 steps altogether. The last thing it says is Bye.', visual: chart(W1, 300, [5]) + note('Altogether: ' + hl('30 steps')) },
  { text: 'Symbols: look at the <strong>shape</strong>. Box 2 is a rectangle, so it is a <strong>Process</strong>. Now name your box from its shape.', visual: chart(W1, 300, [1]) + note(hl('Rectangle') + ' = Process') },
] };
steps.push(checkStep('do-now', 'Do Now: Read the Flowchart', 'Do Now: Read the Flowchart', 'From Lesson 1. Begin at Start. Follow the arrows.', [
  { label: 'How many steps does the sprite move altogether?', answer: num(dn1.steps, 'steps?'), feedback: 'Find every Move box. Add their numbers together.' },
  { label: 'What does the sprite say last?', answer: word('wave'), feedback: 'Find the last Say box before End.' },
  { label: 'What is the name of the symbol for box 3?', answer: SYM_IO, feedback: 'Look at the shape of box 3, not the words inside.' },
], chart(DN1, 285)));
steps[steps.length - 1].walkthrough = WT_READ;

// ---------------------------------------------------------------- Do Now 2 (Lesson 2): a key-press loop
const DN2 = numbered(keyLoop('Down arrow', 180, 10));
const dn2 = FC.run(DN2, { presses: [1, 1, 0, 1, 1] });
assert(dn2.steps === 40 && dn2.direction === 180, 'do-now 2');
// Walk me through it: Right arrow, 5 steps, pressed, not pressed, pressed. Shapes: 0 Start, 1 decision, 2 Point, 3 Move.
const W2 = keyLoop('Right arrow', 90, 5);
const w2 = FC.run(W2, { presses: [1, 0, 1] });
assert(w2.steps === 10 && w2.direction === 90, 'walkthrough 2');
const WT_LOOP = { title: 'Walk me through it: a key-press loop', steps: [
  { text: 'This is a different loop. The right arrow is checked 3 times: pressed, not pressed, pressed.', visual: chart(W2, 300) },
  { text: 'Check 1: the decision asks about the key. It is <strong>pressed</strong>, so follow <strong>True</strong>.', visual: chart(W2, 300, [1]) + note('Check 1: ' + hl('pressed')) },
  { text: '<strong>Point in direction 90</strong>: the sprite faces right.', visual: chart(W2, 300, [2]) + note('Facing: ' + hl('90 (right)')) },
  { text: '<strong>Move 5 steps</strong>. Then the arrow goes back to the decision.', visual: chart(W2, 300, [3]) + note('Steps so far: ' + hl('5')) },
  { text: 'Check 2: <strong>not pressed</strong>. Follow <strong>False</strong>. It goes straight back. No move.', visual: chart(W2, 300, [1]) + note('Steps so far: ' + hl('5')) },
  { text: 'Check 3: <strong>pressed</strong>. True: Point, then Move 5 steps. 5 + 5 = 10.', visual: chart(W2, 300, [2, 3]) + note('Steps so far: ' + hl('10')) },
  { text: 'No more checks. 2 presses x 5 steps = <strong>10 steps</strong>. Now count the presses in your question.', visual: chart(W2, 300) + note('Altogether: ' + hl('10 steps')) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Key-Press Loop', 'Do Now: Key-Press Loop', 'From Lesson 2. The down arrow is checked 5 times: pressed, pressed, not pressed, pressed, pressed.', [
  { label: 'How many steps does the sprite move?', answer: num(dn2.steps, 'steps?'), feedback: 'Count the presses. Each press runs the Move box once.' },
  { label: 'The key is pressed. Which box number comes next?', answer: num(3), feedback: 'Pressed follows the True arrow. Follow it to a box.' },
  { label: 'Box 3 says Point in direction 180. Which way does the sprite face?', answer: '^\\s*(it\\s+(faces|points)\\s+)?down(wards?)?\\s*$', feedback: 'Right is 90, left is -90 and up is 0. Which way is left over?' },
], chart(DN2, 340)));
steps[steps.length - 1].walkthrough = WT_LOOP;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-revision-2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from all four flowchart lessons. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Revision 2: Decisions and Sub-routines',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Computational Thinking</p><h2 class="lesson-h2">Revision 2: Decisions and Sub-routines</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> Lessons 3 and 4. Then exam practice from all four lessons.', '<strong>Next lesson:</strong> the exam.']) +
    tps('Why do we practise every kind of question before the exam?', 'The exam has questions from all four lessons. Practice shows you what you know, and what to learn again.') });

// ---------------------------------------------------------------- Lesson 3: AND, OR, NOT
steps.push({ id: 'key-words', label: 'Key Words: AND, OR, NOT',
  content: '<h2 class="lesson-h2">Key Words: AND, OR, NOT</h2><p class="lesson-lead">1 means True. 0 means False. Example: Up is 1 (pressed), Right is 0 (not pressed).</p>' +
    bigTable('<table class="donow-table"><thead><tr><th>Word</th><th>Rule</th><th>Example</th></tr></thead><tbody>' +
      '<tr><td><strong>AND</strong></td><td>1 only when <strong>both</strong> parts are 1.</td><td>Up AND Right is 0.</td></tr>' +
      '<tr><td><strong>OR</strong></td><td>1 when <strong>at least one</strong> part is 1.</td><td>Up OR Right is 1.</td></tr>' +
      '<tr><td><strong>NOT</strong></td><td><strong>Swaps</strong> the value: 1 becomes 0, 0 becomes 1.</td><td>NOT Up is 0.</td></tr>' +
      '<tr><td><strong>Decision</strong></td><td>1 follows the <strong>True</strong> arrow. 0 follows the <strong>False</strong> arrow.</td><td>0: follow False.</td></tr>' +
      '</tbody></table>') });

{
  const f = branch('Left AND Down pressed?', say('Slide'), say('Stand'));
  const r = FC.run(f, { keys: { Left: 1, Down: 0 } });
  assert(r.said[0] === 'Stand', 'read-logic');
  const table = bigTable('<table class="donow-table"><thead><tr><th>Box</th><th>What happens</th></tr></thead><tbody>' +
    '<tr><td>Left AND Down pressed?</td><td>Left is 1. Down is 0. AND needs both: <strong>0</strong>.</td></tr>' +
    '<tr><td>0</td><td>Follow the <strong>False</strong> arrow.</td></tr>' +
    '<tr><td>Say "Stand"</td><td>The sprite says <strong>Stand</strong>.</td></tr></tbody></table>');
  steps.push({ id: 'read-logic', label: 'Read a Decision with AND',
    content: '<h2 class="lesson-h2">Read a Decision with AND</h2><p class="lesson-lead">Left is pressed. Down is not pressed.</p>' +
      columns(chart(f, 380), tps('Predict: what does the sprite say? Why?', table +
        '<p><strong>Why?</strong> Only one key is pressed. AND needs both keys.</p>', 'Show the worked answer')) });
}

{
  const A = branch('Left AND Down pressed?', say('Slide'), say('Stand'));
  const B = branch('Left OR Down pressed?', say('Slide'), say('Stand'));
  const k = { keys: { Left: 1, Down: 0 } };
  assert(FC.run(A, k).said[0] === 'Stand' && FC.run(B, k).said[0] === 'Slide', 'compare-andor');
  steps.push(compare('compare-andor', 'Compare: AND or OR?', 'The same keys for both: Left is pressed (1). Down is not pressed (0).', A, B,
    'What is the same? What is different? What does each sprite say?',
    '<p><strong>Same:</strong> the same keys and the same boxes.</p><p><strong>Different:</strong> one word. A uses AND: 1 AND 0 is 0, so A says <strong>Stand</strong>. B uses OR: 1 OR 0 is 1, so B says <strong>Slide</strong>.</p>'));
}

{
  const f = branch('Up OR Right pressed?', say('Run'), say('Rest'));
  const a = FC.run(f, { keys: { Up: 0, Right: 1 } }).said[0], b = FC.run(f, { keys: { Up: 0, Right: 0 } }).said[0];
  const notUp = FC.evaluate('NOT Up', { Up: 1 });
  assert(a === 'Run' && b === 'Rest' && notUp === 0, 'logic-check');
  steps.push(checkStep('logic-check', 'Your Turn: AND, OR, NOT', 'Your Turn: AND, OR, NOT', 'Use the flowchart for (a) and (b).', [
    { label: 'Up is not pressed. Right is pressed. What does the sprite say?', answer: word('run'), feedback: 'Write 1 or 0 for each key. OR needs at least one 1.' },
    { label: 'Neither key is pressed. What does the sprite say?', answer: word('rest'), feedback: 'Both keys are 0. Is there at least one 1?' },
    { line: true, label: 'New decision: NOT Up pressed? Up is pressed. True or False arrow?', answer: arrow(notUp ? 'true' : 'false'), feedback: 'Up is 1. NOT swaps the value. Which arrow does the new value follow?' },
  ], chart(f, 340)));
}

// ---------------------------------------------------------------- Lesson 3: comparisons
{
  const f = branch('Score > Target?', say('Win'), say('Try again'));
  const r = FC.run(f, { values: { Score: 15, Target: 20 } });
  assert(r.said[0] === 'Try again', 'comparisons');
  steps.push({ id: 'comparisons', label: 'Comparing Numbers',
    content: '<h2 class="lesson-h2">Comparing Numbers</h2><p class="lesson-lead">A decision can compare two numbers. The answer is 1 (True) or 0 (False).</p>' +
      columns(chart(f, 360), facts(['<strong>&gt;</strong> bigger than', '<strong>&lt;</strong> smaller than', '<strong>=</strong> the same', '<strong>&lt;&gt;</strong> not the same']) +
        tps('Predict: Score is 15. Target is 20. What does the sprite say?',
          '<p>Put the numbers in: 15 &gt; 20? Is 15 bigger than 20? No: <strong>0</strong>.</p><p>0 follows the False arrow. The sprite says <strong>Try again</strong>.</p>', 'Show the worked answer')) });
}

{
  const f = branch('Speed > Limit?', say('Slow down'), say('Keep going'));
  const v = FC.evaluate('Speed > Limit', { Speed: 35, Limit: 30 });
  const b = FC.run(f, { values: { Speed: 35, Limit: 30 } }).said[0], c = FC.run(f, { values: { Speed: 30, Limit: 30 } }).said[0];
  assert(v === 1 && b === 'Slow down' && c === 'Keep going', 'compare-check');
  steps.push(checkStep('compare-check', 'Your Turn: Comparisons', 'Your Turn: Comparisons', 'Speed is 35. Limit is 30.', [
    { label: 'What is Speed > Limit: 1 or 0?', answer: bit(v), feedback: 'Put the numbers in. Is the first number bigger than the second?' },
    { label: 'What does the sprite say?', answer: word('slow\\s+down'), feedback: 'Use your answer to (a). 1 follows True. 0 follows False.' },
    { line: true, label: 'Now Speed is 30 and Limit is 30. What does the sprite say?', answer: word('keep\\s+going'), feedback: 'Is 30 bigger than 30? Then follow that arrow.' },
  ], chart(f, 340)));
}

{
  const A = branch('Score > Target?', say('Win'), say('Try again'));
  const B = branch('Score = Target?', say('Win'), say('Try again'));
  const v = { values: { Score: 20, Target: 20 } };
  assert(FC.run(A, v).said[0] === 'Try again' && FC.run(B, v).said[0] === 'Win', 'compare-boundary');
  steps.push(compare('compare-boundary', 'Compare: Bigger Than, or the Same?', 'The same numbers for both: Score is 20. Target is 20.', A, B,
    'What is the same? What is different? What does each sprite say?',
    '<p><strong>Same:</strong> the same numbers and the same Say boxes.</p><p><strong>Different:</strong> the sign. A: is 20 bigger than 20? No: 0, so A says <strong>Try again</strong>. B: is 20 the same as 20? Yes: 1, so B says <strong>Win</strong>.</p><p>Always check the sign carefully.</p>'));
}

// ---------------------------------------------------------------- Activity 1: fill in the decision
{
  const model = branch('Up AND Right pressed?', say('Diagonal'), say('Wait'));
  assert(FC.run(model, { keys: { Up: 1, Right: 1 } }).said[0] === 'Diagonal' && FC.run(model, { keys: { Up: 1, Right: 0 } }).said[0] === 'Wait', 'activity-1 model');
  assert(FC.evaluate('Coins > Price', { Coins: 9, Price: 5 }) === 1 && FC.evaluate('Guess = Number', { Guess: 4, Number: 4 }) === 1 && FC.evaluate('Guess <> Number', { Guess: 3, Number: 4 }) === 1, 'activity-1 signs');
  const blank = branch('A', say('Diagonal'), say('Wait'));
  steps.push(checkStep('activity-1', 'Activity 1: Fill In the Decision', 'Activity 1: Fill In the Decision',
    'It should say "Diagonal" only when Up and Right are <strong>both</strong> pressed.', [
      { line: true, label: 'What should box A say?', answer: '^\\s*(is\\s+|are\\s+)?(both\\s+)?(up(\\s+arrow)?\\s+(and|&)\\s+right|right(\\s+arrow)?\\s+(and|&)\\s+up)(\\s+(arrows?|keys?))?(\\s+(both\\s+)?pressed)?\\s*\\??\\s*$', feedback: 'A is a decision about two keys. Which word needs both parts to be 1?' },
      { label: 'Say "Buy" when Coins is bigger than Price. Which sign goes in Coins ? Price?', answer: '^\\s*>\\s*$', feedback: 'Type the sign, not words. Look back at the four signs on Comparing Numbers.' },
      { label: 'Say "Correct" when Guess is the same as Number. Which sign?', answer: '^\\s*={1,2}\\s*$', feedback: 'Type the sign that means the two numbers match.' },
      { label: 'Say "Try again" when Guess is not the same as Number. Which sign?', answer: '^\\s*<\\s*>\\s*$', feedback: 'This sign is made of two signs together. Which two?' },
    ], chart(blank, 380)));
}

// ---------------------------------------------------------------- Lesson 4: sub-routines
{
  const f = withSub(FC.line([['call', 'CALL DrawSide'], ['call', 'CALL DrawSide']]), 'DrawSide', FC.line([['process', 'Move 40 steps'], ['process', 'Turn right 90 degrees']]));
  const r = FC.run(f);
  assert(r.steps === 80, 'subroutines');
  steps.push({ id: 'subroutines', label: 'Sub-routines and CALL',
    content: '<h2 class="lesson-h2">Sub-routines and CALL</h2><p class="lesson-lead">A <strong>sub-routine</strong> is a named part of an algorithm. It is written once, as its own flowchart.</p>' +
      columns(chart(f, 360), facts([
        '<strong>CALL</strong> jumps to the sub-routine. It runs from its own Start.',
        '<strong>At its End,</strong> Main carries on just after the CALL.',
        '<strong>Written once, used many times.</strong>',
      ]) + tps('Predict: how many steps does the sprite move altogether? How many times is DrawSide written out?',
        '<p>Each CALL runs DrawSide once: 40 + 40 = <strong>80 steps</strong>.</p><p>DrawSide is written out <strong>once</strong>. It is CALLed twice.</p>', 'Show the worked answer')) });
}

{
  const f = withSub(FC.line([['call', 'CALL Clap'], say('Great'), ['call', 'CALL Clap'], ['call', 'CALL Clap']]), 'Clap', FC.line([say('Clap'), ['process', 'Move 10 steps']]));
  const r = FC.run(f);
  const claps = r.said.filter((s) => s === 'Clap').length;
  assert(claps === 3 && r.steps === 30 && r.said[1] === 'Great', 'call-check');
  steps.push(checkStep('call-check', 'Your Turn: Follow the CALL', 'Your Turn: Follow the CALL', 'Begin at Main\'s Start.', [
    { label: 'How many times is "Clap" said altogether?', answer: num(claps, 'times?'), feedback: 'Each CALL runs the whole sub-routine once. Count the CALL boxes.' },
    { line: true, label: 'Clap reaches its End the first time. Which box in Main runs next?', answer: sayBox('great'), feedback: 'Main carries on just after the first CALL.' },
    { label: 'How many steps does the sprite move altogether?', answer: num(r.steps, 'steps?'), feedback: 'Find the Move box in Clap. Each CALL runs it once.' },
  ], chart(f, 330)));
}

{
  const HOP = FC.line([['process', 'Move 10 steps'], say('Hop')]);
  const A = withSub(FC.line([['call', 'CALL Hop'], ['call', 'CALL Hop']]), 'Hop', HOP);
  const B = withSub(FC.line([['call', 'CALL Hop'], ['process', 'Move 20 steps'], ['call', 'CALL Hop']]), 'Hop', HOP);
  const ra = FC.run(A), rb = FC.run(B);
  assert(ra.steps === 20 && rb.steps === 40 && ra.said.join() === 'Hop,Hop' && rb.said.join() === 'Hop,Hop', 'compare-call');
  const mainOnly = (f) => ({ nodes: f.nodes, edges: f.edges });
  steps.push({ id: 'compare-call', label: 'Compare: Two Mains, One Sub-routine',
    content: '<h2 class="lesson-h2">Compare: Two Mains, One Sub-routine</h2><p class="lesson-lead">Main A and Main B both CALL the same sub-routine, Hop.</p>' +
      tps('What is the same? What is different? How many steps does each sprite move?',
        '<p><strong>Same:</strong> both CALL Hop twice, so both say Hop, Hop.</p><p><strong>Different:</strong> B has a Move box between the CALLs. A moves 10 + 10 = <strong>20 steps</strong>. B moves 10 + 20 + 10 = <strong>40 steps</strong>.</p>') +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;align-items:start">' +
      `<div>${paneTitle('Main A')}${chart(mainOnly(A), 300)}</div><div>${paneTitle('Main B')}${chart(mainOnly(B), 300)}</div><div>${paneTitle('Sub-routine: Hop')}${chart(HOP, 300)}</div></div>` });
}

// ---------------------------------------------------------------- Activity 2: fill in the sub-routine
{
  const model = withSub(FC.line([['call', 'CALL Side'], ['call', 'CALL Side']]), 'Side', FC.line([['process', 'Move 50 steps'], ['process', 'Turn right 90 degrees'], say('Done')]));
  const r = FC.run(model);
  assert(r.steps === 100 && r.said.length === 2, 'activity-2 model');
  const blank = withSub(FC.line([['call', 'A'], ['call', 'CALL Side']]), 'Side', FC.line([['process', 'B'], ['process', 'Turn right 90 degrees'], say('Done')]));
  steps.push(checkStep('activity-2', 'Activity 2: Fill In the Sub-routine', 'Activity 2: Fill In the Sub-routine',
    'It should run the sub-routine <strong>Side</strong> two times. Each side moves <strong>50 steps</strong>, turns, then says "Done".', [
      { line: true, label: 'What should box A say?', answer: '^\\s*call\\s+side\\s*$', feedback: 'A must run the sub-routine. Copy the box under it.' },
      { line: true, label: 'What should box B say?', answer: moveBox(50), feedback: 'Read what each side should do first. Use the words of a Move box.' },
      { label: 'How many steps does the sprite move altogether?', answer: num(r.steps, 'steps?'), feedback: 'How many CALLs? How many steps for each one?' },
      { label: 'How many times is "Done" said?', answer: num(r.said.length, 'times?'), feedback: 'Each CALL runs every box in Side once.' },
    ], chart(blank, 380)));
}

// ---------------------------------------------------------------- exam practice across all four lessons
{
  const f = numbered(keyLoop('Left arrow', '?', 10));
  const run = FC.run(keyLoop('Left arrow', -90, 10), { presses: [0, 1, 1, 0] });
  assert(run.steps === 20 && run.direction === -90, 'exam-1');
  steps.push(checkStep('exam-1', 'Exam Practice 1', 'Exam Practice 1', 'It should move the sprite <strong>left</strong> each time the left arrow is pressed.', [
    { label: 'What number replaces the ? in Point in direction ?', answer: num(-90, 'degrees?'), feedback: 'Right is 90. Left is the opposite way.' },
    { line: true, label: 'Checks: not pressed, pressed, pressed, not pressed. How many steps?', answer: num(run.steps, 'steps?'), feedback: 'Only a press reaches the Move box. Count the presses.' },
    { label: 'What is the name of the symbol for box 2?', answer: SYM_DECISION, feedback: 'Look at the shape of box 2. It has a True arrow and a False arrow.' },
  ], chart(f, 330)));
}

{
  const f = numbered(branch('Points < Goal?', say('Keep going'), say('Level up')));
  const a = FC.run(f, { values: { Points: 18, Goal: 25 } }).said[0], b = FC.run(f, { values: { Points: 25, Goal: 25 } }).said[0];
  assert(a === 'Keep going' && b === 'Level up' && f.nodes[2].type === 'io', 'exam-2');
  steps.push(checkStep('exam-2', 'Exam Practice 2', 'Exam Practice 2', 'Use the flowchart for every part.', [
    { label: 'Points is 18. Goal is 25. What does the sprite say?', answer: word('keep\\s+going'), feedback: 'Put the numbers in. Is the first number smaller than the second?' },
    { label: 'Points is 25. Goal is 25. What does the sprite say?', answer: word('level\\s+up'), feedback: 'Is 25 smaller than 25? Then follow that arrow.' },
    { label: 'What is the name of the symbol for box 3?', answer: SYM_IO, feedback: 'Look at the shape of box 3, not the words inside.' },
  ], chart(f, 340)));
}

{
  const f = withSub(FC.line([say('Ready'), ['call', 'CALL Jump'], ['process', 'Move 30 steps'], ['call', 'CALL Jump']]), 'Jump', FC.line([['process', 'Move 10 steps'], say('Up')]));
  const r = FC.run(f);
  assert(r.steps === 50 && r.said.join() === 'Ready,Up,Up', 'exam-3');
  steps.push(checkStep('exam-3', 'Exam Practice 3', 'Exam Practice 3', 'Begin at Main\'s Start.', [
    { label: 'How many steps does the sprite move altogether?', answer: num(r.steps, 'steps?'), feedback: 'Add the Move box in Main, and the Move box in Jump for each CALL.' },
    { line: true, label: 'Jump reaches its End the first time. Which box in Main runs next?', answer: moveBox(30), feedback: 'Main carries on just after the first CALL. Write that whole box.' },
    { line: true, label: 'Write everything the sprite says, in order.', answer: inOrder(r.said.map((s) => s.toLowerCase())), feedback: 'Follow Main. At each CALL, go through Jump, then come back. Write each Say on the way.' },
  ], chart(f, 330)));
}

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Revision 2 Drill', 'drill-y7-revision-2', 'Plenary: Revision 2 Drill',
  'AND, OR, NOT, comparisons and sub-routines. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, '90') && V('do-now', 0, '90 steps') && !V('do-now', 0, '40') && V('do-now', 1, 'Wave') && V('do-now', 1, '"Wave"') && !V('do-now', 1, 'Hello'), 'do-now marks');
assert(V('do-now', 2, 'Input or output') && V('do-now', 2, 'output') && !V('do-now', 2, 'Process'), 'do-now symbol');
assert(V('do-now-2', 0, '40') && !V('do-now-2', 0, '50') && V('do-now-2', 1, '3') && !V('do-now-2', 1, '2') && V('do-now-2', 2, 'down') && !V('do-now-2', 2, 'up'), 'do-now-2 marks');
assert(V('logic-check', 0, 'Run') && !V('logic-check', 0, 'Rest') && V('logic-check', 1, 'rest') && V('logic-check', 2, 'False') && V('logic-check', 2, 'the false arrow') && !V('logic-check', 2, 'True'), 'logic-check marks');
assert(V('compare-check', 0, '1') && V('compare-check', 0, 'true') && !V('compare-check', 0, '0') && V('compare-check', 1, 'Slow down') && V('compare-check', 2, 'keep going') && !V('compare-check', 2, 'slow down'), 'compare-check marks');
assert(V('activity-1', 0, 'Up AND Right pressed?') && V('activity-1', 0, 'right and up pressed') && !V('activity-1', 0, 'Up OR Right pressed?') && !V('activity-1', 0, 'Up pressed?'), 'activity-1 A');
assert(V('activity-1', 1, '>') && !V('activity-1', 1, '<') && V('activity-1', 2, '=') && !V('activity-1', 2, '<>') && V('activity-1', 3, '<>') && !V('activity-1', 3, '='), 'activity-1 signs marks');
assert(V('call-check', 0, '3') && !V('call-check', 0, '1') && V('call-check', 1, 'Say "Great"') && V('call-check', 1, 'say great') && !V('call-check', 1, 'CALL Clap') && V('call-check', 2, '30'), 'call-check marks');
assert(V('activity-2', 0, 'CALL Side') && !V('activity-2', 0, 'Side') && V('activity-2', 1, 'Move 50 steps') && !V('activity-2', 1, 'Move 100 steps') && V('activity-2', 2, '100') && V('activity-2', 3, '2'), 'activity-2 marks');
assert(V('exam-1', 0, '-90') && V('exam-1', 0, '−90') && !V('exam-1', 0, '90') && V('exam-1', 1, '20') && V('exam-1', 2, 'decision') && V('exam-1', 2, 'diamond'), 'exam-1 marks');
assert(V('exam-2', 0, 'Keep going') && !V('exam-2', 0, 'Level up') && V('exam-2', 1, 'level up') && V('exam-2', 2, 'Input or output') && !V('exam-2', 2, 'Decision'), 'exam-2 marks');
assert(V('exam-3', 0, '50') && V('exam-3', 1, 'Move 30 steps') && !V('exam-3', 1, 'CALL Jump') && V('exam-3', 2, 'Ready, Up, Up') && V('exam-3', 2, 'ready then up then up') && V('exam-3', 2, '"Ready", "Up", "Up"') && !V('exam-3', 2, 'Up, Ready, Up') && !V('exam-3', 2, 'Ready, Up'), 'exam-3 marks');
// Feedback nudges and never contains an accepted answer (every 1 to 6 word run is tested against its own pattern).
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) {
    const run = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
    assert(!rx.test(run), `feedback leaks the answer: ${k}${p.suffix} "${run}"`);
  }
}
// The walkthroughs show the method with other numbers and never the Do Now answers.
{
  const s = JSON.stringify(WT_READ.steps.map((x) => x.text + ' ' + x.visual.replace(/<svg[\s\S]*?<\/svg>/g, ''))).toLowerCase();
  assert(!/\b90\b/.test(s) && !/wave/.test(s) && !/input|output|sloping/.test(s), 'read walkthrough leaks an answer');
  const t = JSON.stringify(WT_LOOP.steps.map((x) => x.text + ' ' + x.visual.replace(/<svg[\s\S]*?<\/svg>/g, ''))).toLowerCase();
  assert(!/\b40\b/.test(t) && !/down/.test(t) && !/180/.test(t) && !/box 3/.test(t), 'loop walkthrough leaks an answer');
  assert(!/Move 40|Move 50|Wave|Down arrow/.test(JSON.stringify([WT_READ, WT_LOOP])), 'walkthrough charts reuse the Do Now chart');
}
// No dashes, no exam board citations.
{
  const all = JSON.stringify(steps);
  assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478/.test(all), 'citation found');
}

const lesson = { id: ID, label: 'Revision 2: Decisions and Sub-routines', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 7's Term 1 Exam Revision unit, after Revision 1.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y7 = all.years.find((y) => y.id === 'year7');
const unit = y7.units.find((u) => u.title === 'Term 1 Exam Revision');
if (!unit.lessons.includes(ID)) {
  const at = unit.lessons.indexOf('y7-revision-1');
  unit.lessons.splice(at < 0 ? unit.lessons.length : at + 1, 0, ID);
}
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; unit: ${unit.lessons.join(', ')}`);
