// Builds LessonData/y7-flowcharts-l5.json: Year 7, 7CT.01 L5, Flowcharts Recap.
//   node tools/build_y7_l5.mjs
// A drill-heavy recap of L1 to L4, the lesson before the unit test: each earlier lesson gets one recap slide, a
// checked question and a drill; the plenary is the recap drill (y7-flowcharts-recap), which mixes every kind of
// question with fresh values. Year 7 has no exam board papers, so the Do Now and checks are recap questions
// without citations (as in Year 6). Flowcharts are drawn by Drills/flowchart-core.js, the same code the drill
// uses, in Year 7's own blocks and words (True / False paths, Move, Point in direction, Say, CALL).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-flowcharts-l5';
const P = 'y7l5';
const re = (source) => ({ __regex: true, source, flags: 'i' });

// A flowchart on a slide, themed with the site's tokens.
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
function chart(flow, maxH = 420) {
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    FC.svg(flow, !!flow.numbered).replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
}
function branch(before, question, trueBoxes, falseBoxes) {
  const nodes = [{ id: 's', type: 'terminal', text: 'Start' }], edges = [];
  let prev = 's';
  before.forEach((b, i) => { nodes.push({ id: 'p' + i, type: b[0], text: b[1] }); edges.push({ from: prev, to: 'p' + i, label: null }); prev = 'p' + i; });
  nodes.push({ id: 'd', type: 'decision', text: question }); edges.push({ from: prev, to: 'd', label: null });
  trueBoxes.forEach((b, i) => { nodes.push({ id: 't' + i, type: b[0], text: b[1] }); if (i) edges.push({ from: 't' + (i - 1), to: 't' + i, label: null }); });
  nodes.push({ id: 'e', type: 'terminal', text: 'End' });
  falseBoxes.forEach((b, i) => { nodes.push({ id: 'f' + i, type: b[0], text: b[1] }); if (i) edges.push({ from: 'f' + (i - 1), to: 'f' + i, label: null }); });
  edges.push({ from: 'd', to: 't0', label: 'True' }, { from: 'd', to: 'f0', label: 'False' });
  edges.push({ from: 't' + (trueBoxes.length - 1), to: 'e', label: null }, { from: 'f' + (falseBoxes.length - 1), to: 'e', label: null });
  return { nodes, edges };
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

const validators = {};
// A checked question: parts = [{ label, answer: regex source, feedback }]; `extra` sits beside it.
function checkStep(id, label, heading, lead, parts, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const marks = parts.length;
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${marks} mark${marks > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return {
    id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card),
  };
}
const num = (n, unit = '') => `^\\s*${n}\\s*${unit ? `(${unit})?` : ''}\\s*$`;
const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
const IO = '^\\s*(an?\\s+)?(input\\s*(or|/|and)?\\s*output|output|input|sloping|parallelogram)(\\s+(symbol|shape|box))?\\s*$';
const drill = (id, label, heading, lead, drillId) => ({ id, label, type: 'embedded-app', appId: 'drill-' + drillId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
const facts = (items) => '<ul class="lesson-facts">' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
const concept = (id, label, lead, left, right) => ({ id, label,
  content: `<h2 class="lesson-h2">${label}</h2><p class="lesson-lead">${lead}</p><div class="lesson-do-now-columns"><div>${left}</div><div>${right}</div></div>` });

const steps = [];

// ---------------------------------------------------------------- Do Now: recap of L1 to L4
steps.push(checkStep('do-now', 'Do Now: Reading a Flowchart', 'Do Now: Reading a Flowchart',
  'A recap of Lesson 1. Read the flowchart from Start to End.',
  [
    { label: 'How many steps does the sprite move altogether?', answer: num('50', 'steps?'), feedback: 'Two Move boxes: 30 + 20 = 50 steps.' },
    { label: 'What does the sprite say?', answer: word('ready'), feedback: 'The Say box outputs "Ready".' },
    { label: 'Name the symbol used for Say "Ready".', answer: IO, feedback: 'Say is an output, so it uses the sloping input or output symbol.' },
  ],
  chart(FC.line([['process', 'Move 30 steps'], ['io', 'Say "Ready"'], ['process', 'Move 20 steps']]))));
steps.push(checkStep('do-now-2', 'Do Now: Decisions and Sub-routines', 'Do Now: Decisions and Sub-routines',
  'A recap of Lessons 3 and 4. Up is 1 and Right is 0.',
  [
    { label: 'What is Up AND Right: 1 or 0?', answer: '^\\s*(0|false)\\s*$', feedback: 'AND is only 1 when both parts are 1. Right is 0, so Up AND Right is 0.' },
    { label: 'What is Up OR Right: 1 or 0?', answer: '^\\s*(1|true)\\s*$', feedback: 'OR is 1 when at least one part is 1. Up is 1, so Up OR Right is 1.' },
    { label: 'After a sub-routine reaches its End, where does Main carry on?', answer: '^(?=.*\\b(after|next|below|following|under)\\b)(?=.*\\bcall\\b).*$', feedback: 'Main carries on from the box straight after the CALL, not from its own Start.' },
  ]));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Flowcharts Recap',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Computational Thinking</p><h2 class="lesson-h2">Flowcharts Recap</h2><p>Year 7, 7CT.01 L5</p></div>' +
    facts(['<strong>Today:</strong> everything from Lessons 1 to 4, ready for the test next lesson.',
      '<strong>For each lesson:</strong> a reminder, a check, then a drill to practise it.',
      '<strong>Plenary:</strong> one drill that mixes every kind of question, with new values each time.']) });

// ---------------------------------------------------------------- Lesson 1: reading and correcting
steps.push(concept('recap-1', 'Recap: Reading and Correcting Flowcharts', 'Every shape has one job. Follow the arrows from Start to End.',
  chart(branch([['process', 'Move 50 steps']], 'Space pressed?', [['io', 'Say "Jump"']], [['io', 'Say "Wait"']])),
  facts(['<strong>Rounded:</strong> Start and End.', '<strong>Rectangle (process):</strong> an instruction, such as Move, Turn or Point in direction.',
    '<strong>Sloping (input or output):</strong> information in or out, such as Say.', '<strong>Diamond (decision):</strong> a question with a True path and a False path.',
    '<strong>To correct a flowchart:</strong> compare every box with the requirement, fix the wrong one, then test again.'])));
const errFlow = FC.line([['process', 'Point in direction 90'], ['process', 'Move 40 steps'], ['io', 'Say "Done"']]);
errFlow.numbered = true;
steps.push(checkStep('check-1', 'Check: Find the Error', 'Check: Find the Error',
  'This flowchart should make the sprite face left, move 40 steps, then say "Done".',
  [
    { label: 'Which box number is wrong?', answer: '^\\s*(box\\s*)?2\\s*$', feedback: 'Box 2 points the sprite right (90). Left is -90.' },
    { label: 'Write the corrected box.', answer: '^\\s*point\\s+in\\s+direction\\s*:?\\s*[-\\u2212]\\s*90(\\s*degrees?)?\\s*$', feedback: 'Point in direction -90 makes the sprite face left.' },
  ], chart(errFlow)));
steps.push(drill('activity-1', 'Activity 1: Symbols and Sequence', 'Activity 1: Symbols and Sequence', 'Practise naming the symbols and reading flowcharts in order.', 'y7-flowcharts-foundations'));

// ---------------------------------------------------------------- Lesson 2: inputs, decisions and loops
steps.push(concept('recap-2', 'Recap: Inputs, Decisions and Loops', 'A key press is an input. A decision checks it, again and again.',
  chart(keyLoop('Right arrow', 90, 10)),
  facts(['<strong>True:</strong> the key is pressed, so point and move.', '<strong>False:</strong> the key is not pressed, so go straight back and check again.',
    '<strong>Both paths go back to the decision:</strong> it keeps checking until Stop is pressed. This is an infinite loop.',
    '<strong>Directions:</strong> right 90, left -90, up 0, down 180.'])));
steps.push(checkStep('check-2', 'Check: A Keyboard Loop', 'Check: A Keyboard Loop', 'Use this flowchart for every part.',
  [
    { label: 'The left arrow is checked 4 times: pressed, pressed, not pressed, pressed. How many steps does the sprite move?', answer: num('15', 'steps?'), feedback: 'Pressed 3 times, 5 steps each time: 15 steps.' },
    { label: 'The left arrow is not pressed. Which box comes next?', answer: '^(?!.*\\b(move|point|end|start)\\b)(?=.*\\b(decision|pressed|check|checks|again|same)\\b).*$', feedback: 'The False arrow goes back to the decision, Left arrow pressed?, to check again.' },
    { label: 'What number makes the sprite face down?', answer: num('180', 'degrees?'), feedback: 'Right is 90, left is -90, up is 0 and down is 180.' },
  ], chart(keyLoop('Left arrow', -90, 5))));

// ---------------------------------------------------------------- Lesson 3: AND, OR, NOT and comparisons
const table = (op) => `<table class="donow-table"><thead><tr><th>Up</th><th>Right</th><th>Up ${op} Right</th></tr></thead><tbody>` +
  [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td><td>${op === 'AND' ? a & b : a | b}</td></tr>`).join('') + '</tbody></table>';
steps.push(concept('recap-3', 'Recap: AND, OR, NOT and Comparisons', '1 means True and 0 means False.',
  `<div style="display:flex;gap:14px;justify-content:center">${table('AND')}${table('OR')}</div>`,
  facts(['<strong>AND</strong> is 1 only when both parts are 1.', '<strong>OR</strong> is 1 when at least one part is 1.',
    '<strong>NOT</strong> swaps the value: NOT 1 is 0, NOT 0 is 1.',
    '<strong>Comparisons:</strong> &gt; bigger than, &lt; smaller than, = the same, &lt;&gt; not the same. Each gives 1 or 0.'])));
steps.push(checkStep('check-3', 'Check: Logic and Comparisons', 'Check: Logic and Comparisons', 'Space is 0 and Enter is 1. Score is 12 and Target is 20.',
  [
    { label: 'What is Space OR Enter: 1 or 0?', answer: '^\\s*(1|true)\\s*$', feedback: 'Enter is 1, and OR needs at least one 1: 1.' },
    { label: 'What is NOT Space: 1 or 0?', answer: '^\\s*(1|true)\\s*$', feedback: 'Space is 0, and NOT swaps it: 1.' },
    { label: 'What is Score > Target: 1 or 0?', answer: '^\\s*(0|false)\\s*$', feedback: '12 is not bigger than 20: 0.' },
  ]));
steps.push(drill('activity-2', 'Activity 2: Decisions, Loops and Logic', 'Activity 2: Decisions, Loops and Logic', 'Inputs, movement, infinite loops, AND, OR, NOT and comparisons.', 'y7-flowcharts-control'));

// ---------------------------------------------------------------- Lesson 4: sub-routines
const square = { ...FC.line([['call', 'CALL DrawSide'], ['process', 'Turn right 90 degrees'], ['call', 'CALL DrawSide']]), subs: { DrawSide: FC.line([['process', 'Move 50 steps'], ['process', 'Turn right 90 degrees']]) } };
steps.push(concept('recap-4', 'Recap: Sub-routines', 'A sub-routine is a named part of an algorithm, written once as its own flowchart.',
  chart(square),
  facts(['<strong>CALL</strong> jumps to the sub-routine and runs it from its own Start.', '<strong>At its End,</strong> Main carries on from just after the CALL.',
    '<strong>Written once, used many times:</strong> each CALL runs the same flowchart again.'])));
const beep = { ...FC.line([['io', 'Say "Hi"'], ['call', 'CALL Beep'], ['call', 'CALL Beep'], ['io', 'Say "Bye"']]), subs: { Beep: FC.line([['io', 'Say "Beep"'], ['io', 'Say "Boop"']]) } };
steps.push(checkStep('check-4', 'Check: Following CALL', 'Check: Following CALL', '',
  [
    { label: 'How many times is "Beep" said altogether?', answer: num('2', 'times?'), feedback: 'Beep is CALLed twice and says "Beep" once each time: 2.' },
    { label: 'What is the very last thing the sprite says?', answer: word('bye'), feedback: 'After the second CALL, Main carries on to Say "Bye", then End.' },
    { label: 'How many times is the Beep sub-routine written out?', answer: '^\\s*(1|one|once)(\\s*times?)?\\s*$', feedback: 'It is written once and CALLed twice.' },
  ], chart(beep)));
steps.push(drill('activity-3', 'Activity 3: Sub-routines', 'Activity 3: Sub-routines', 'CALL, where control goes, and reusing a sub-routine.', 'y7-flowcharts-subroutines'));

// ---------------------------------------------------------------- checked practice, test style
steps.push(checkStep('practice', 'Test Practice', 'Test Practice', 'Coins is 8 and Price is 10.',
  [
    { label: 'Is Coins < Price 1 or 0?', answer: '^\\s*(1|true)\\s*$', feedback: '8 is smaller than 10: 1, so the True path runs.' },
    { label: 'What does the sprite say?', answer: word('buy'), feedback: 'Coins < Price is 1 (True), so the sprite says "Buy".' },
    { label: 'Which symbol is the question Coins < Price? drawn in?', answer: '^\\s*(a\\s+)?(decision|diamond)(\\s+(symbol|shape|box))?\\s*$', feedback: 'A question with True and False paths is a decision: a diamond.' },
  ], chart(branch([], 'Coins < Price?', [['io', 'Say "Buy"']], [['io', 'Say "Save up"']]))));

// ---------------------------------------------------------------- plenary: the recap drill
steps.push(drill('plenary', 'Plenary: Flowcharts Recap', 'Plenary: Flowcharts Recap', 'Every kind of question from Lessons 1 to 4, with new values each time. Master them ready for the test.', 'y7-flowcharts-recap'));

const lesson = { id: ID, label: '7CT.01 L5: Flowcharts Recap', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson));

// Register it after L4 in Year 7's Computational Thinking unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find(y => y.id === 'year7').units.find(u => u.code === '7CT.01');
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
