// Builds LessonData/y7-3-1-constructs.json: Year 7, 3.1 Choosing Algorithm Constructs (7CT.08: select and use
// appropriate constructs in flowcharts, limited to sequence and selection), its three drills
// (Drills/data/y7-3-1-choose.js, y7-3-1-build.js, y7-3-1-constructs.js), and registers the lesson in a new Year 7
// unit "Software Development and Physical Computing" after the existing Year 7 units.
//   node tools/build_y7_3_1.mjs
// The Do Now Extension drill Drills/data/y7-3-1-ext.js is written by hand (copied from y7-revision-2-ext); this
// builder only checks it.
// EAL-light and Term 1b "why" shape: one idea per slide, a teacher-only Think, Pair, Share under every heading,
// predict-then-explain teaching slides, compare slides (the same problem built with sequence only and with
// selection). Year 7 has no exam board papers, so nothing carries a citation. Flowcharts are drawn by
// Drills/flowchart-core.js and every answer below comes from running the flowchart.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-3-1-constructs';
const P = 'y731';
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- pieces (as in build_y7_rev2.mjs)
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
// hl: shape numbers to highlight (0 = Start, in node order).
function chart(flow, maxH = 400, hl = []) {
  let i = -1;
  const svg = FC.svg(flow, !!flow.numbered).replace(/<(rect|polygon) class="fc-[btd]"/g, (m) => {
    i++;
    return hl.includes(i) ? m + ' style="stroke:var(--warn);stroke-width:5;fill:rgba(253,214,99,.3)"' : m;
  });
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    svg.replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
}
// A decision with its own path of boxes for True and for False, after any boxes in pre; both paths reach End.
// Node order (for box numbers): Start, pre..., decision, True path..., End, False path...
function choice(pre, question, tBoxes, fBoxes) {
  const nodes = [{ id: 's', type: 'terminal', text: 'Start' }], edges = [];
  let last = 's';
  pre.forEach((b, i) => { nodes.push({ id: 'p' + i, type: b[0], text: b[1] }); edges.push({ from: last, to: 'p' + i, label: null }); last = 'p' + i; });
  nodes.push({ id: 'd', type: 'decision', text: question }); edges.push({ from: last, to: 'd', label: null });
  const pathOf = (boxes, tag, label) => {
    let prev = 'd';
    boxes.forEach((b, i) => { const id = tag + i; nodes.push({ id, type: b[0], text: b[1] }); edges.push({ from: prev, to: id, label: i ? null : label }); prev = id; });
    edges.push({ from: prev, to: 'e', label: null });
  };
  pathOf(tBoxes, 't', 'True');
  nodes.push({ id: 'e', type: 'terminal', text: 'End' });
  pathOf(fBoxes, 'f', 'False');
  return { nodes, edges };
}
const branch = (q, t, f) => choice([], q, [t], [f]);
const say = (w) => ['io', `Say "${w}"`];
const move = (n) => ['process', `Move ${n} steps`];
const point = (d) => ['process', `Point in direction ${d}`];
const TURN = ['process', 'Turn right 90 degrees'];
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
const SYM_IO = '^\\s*(an?\\s+)?(input\\s*(or|\\/|and)?\\s*output|output|input|sloping|parallelogram)(\\s+(symbol|shape|box))?\\s*$';
const SEQ = '^\\s*(it\\s+needs\\s+)?(an?\\s+)?(sequence|steps\\s+in\\s+order)(\\s+construct)?\\s*[.!]?\\s*$';
const SEL = '^\\s*(it\\s+needs\\s+)?(an?\\s+)?(selection|decision)(\\s+construct)?\\s*[.!]?\\s*$';
const bigTable = (html) => html.replace('<table class="donow-table">', '<table class="donow-table" style="font-size:17px;width:100%">')
  .replace(/<t([hd])>/g, '<t$1 style="padding:7px 12px;text-align:left;font-size:17px">');

function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const paneTitle = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
const problem = (t) => `<p class="lesson-lead"><strong>Problem:</strong> ${t}</p>`;
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
function selfMarked(id, label, heading, lead, items) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>${lead}<div id="${P}-${id}"></div>`, items };
}
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;

// Think, Pair, Share under each slide's heading: one short why question, answer hidden until the teacher clicks.
// On a check slide it never gives or presupposes an answer on that slide (tools/tps-leak-check.mjs in the shell).
const TPS = {
  'do-now': ['Why do we put the number into a decision, not just read the sign?', 'The same decision can go either way. Score &gt; 50? is True for 70 and False for 20.'],
  'do-now-2': ['Why does a Say box not change the number of steps?', 'Say only shows a message. Only Move boxes move the sprite.'],
  'title': ['Why might a flowchart work for one Score, but not for another?', 'Some flowcharts do the same thing every time. Some problems need different things for different numbers. Today we learn to tell them apart.'],
  'sequence-check': ['Why do we follow the arrows from Start, one box at a time?', 'The computer runs the boxes in the order of the arrows. If we read them the same way, we get the same answer as the computer.'],
  'selection-check': ['Why is = different from &gt; in a decision?', '= asks: are they the same? &gt; asks: is the first bigger? For 9 and 7, = is False but &gt; is True.'],
  'clue-check': ['Why read the whole problem before you draw any boxes?', 'One small word can change the shape of the flowchart. Read it all, find the clue words, then plan.'],
  'activity-1': ['Why test a flowchart with more than one number?', 'One number follows only one path. Try a number for True and a number for False to check both paths.'],
  'why-check': ['What makes an explanation worth 2 marks?', 'Two connected points: what the flowchart does now, and what it needs. Join them with "so" or "because".'],
  'build-it': ['How do you check a finished flowchart?', 'Try every path. Follow it once for True and once for False. Does it do what the problem says each time?'],
  'activity-2': ['Why read the problem again after you fill in a box?', 'To check the box does what the problem says, for every number or key.'],
  'practice': ['Why start again at Start for each new Score?', 'Each new number can take a different path at the decision. Follow the whole flowchart again, box by box.'],
  'plenary': ['Why practise with new numbers every time?', 'If you can do it with any numbers, you really understand it.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (Lesson 3): follow a decision
const DN1 = numbered(branch('Points > 30?', say('Level up'), say('Keep going')));
const dn1 = (v) => FC.run(DN1, { values: { Points: v } });
assert(dn1(45).said[0] === 'Level up' && dn1(30).said[0] === 'Keep going' && dn1(12).said[0] === 'Keep going' && DN1.nodes[4].text === 'Say "Keep going"', 'do-now 1');
// Walk me through it: a different flowchart (a Say box first, so the box numbers differ).
// Shapes: 0 Start, 1 Say Hi, 2 decision, 3 Say Shop, 4 End, 5 Say Wait.
const W1 = numbered(choice([say('Hi')], 'Coins > 10?', [say('Shop')], [say('Wait')]));
assert(FC.run(W1, { values: { Coins: 15 } }).said.join() === 'Hi,Shop' && FC.run(W1, { values: { Coins: 10 } }).said.join() === 'Hi,Wait', 'walkthrough 1');
const WT_DEC = { title: 'Walk me through it: follow a decision', steps: [
  { text: 'This is a different flowchart. We try it twice: Coins is 15, then Coins is 10.', visual: chart(W1, 300) },
  { text: 'Begin at <strong>Start</strong>. Box 2 says "Hi". Then the arrow goes to the decision, box 3.', visual: chart(W1, 300, [0, 1]) },
  { text: 'Coins is 15. Put the number in: is 15 bigger than 10? Yes, so it is <strong>True</strong>.', visual: chart(W1, 300, [2]) + note('15 &gt; 10? ' + hl('True')) },
  { text: 'Follow the <strong>True</strong> arrow. It reaches box 4: Say "Shop".', visual: chart(W1, 300, [3]) + note('Said: Hi, then ' + hl('Shop')) },
  { text: 'Now Coins is 10. Is 10 bigger than 10? No. 10 is the same, not bigger, so it is <strong>False</strong>.', visual: chart(W1, 300, [2]) + note('10 &gt; 10? ' + hl('False')) },
  { text: 'Follow the <strong>False</strong> arrow to the box it reaches. Read the number on that box: 6. It says "Wait".', visual: chart(W1, 300, [5]) + note('Next box: ' + hl('6')) },
  { text: 'Now do the same with your numbers: put the number in, then follow that arrow.', visual: chart(W1, 300) },
] };
steps.push(checkStep('do-now', 'Do Now: Follow the Decision', 'Do Now: Follow the Decision', 'From Lesson 3. Begin at Start. Put the number into the decision.', [
  { label: 'Points is 45. What does the sprite say?', answer: word('level\\s+up'), feedback: 'Put the number in. Is 45 bigger than 30? Then follow that arrow.' },
  { label: 'Points is 30. What does the sprite say?', answer: word('keep\\s+going'), feedback: 'Is 30 bigger than 30? Then follow that arrow.' },
  { label: 'Points is 12. Which box number runs after box 2?', answer: num(5), feedback: 'Is 12 bigger than 30? Follow that arrow and read the number on its box.' },
], chart(DN1, 300)));
steps[steps.length - 1].walkthrough = WT_DEC;

// ---------------------------------------------------------------- Do Now 2 (Lessons 1 and 2): read a flowchart
const DN2 = numbered(FC.line([point(180), move(20), say('Ready'), move(30)]));
const dn2 = FC.run(DN2);
assert(dn2.steps === 50 && dn2.direction === 180 && DN2.nodes[3].type === 'io', 'do-now 2');
// Walk me through it: the same three questions on Say Go, Point in direction -90, Move 15, Move 25, so its method
// worked on the Do Now gives each answer. Shapes: 0 Start, 1 Say, 2 Point, 3 Move, 4 Move, 5 End.
const W2 = numbered(FC.line([say('Go'), point(-90), move(15), move(25)]));
const w2 = FC.run(W2);
assert(w2.steps === 40 && w2.direction === -90 && W2.nodes[1].type === 'io', 'walkthrough 2');
const WT_LINE = { title: 'Walk me through it: read a flowchart', steps: [
  { text: 'This is a different flowchart with the same three questions. Your flowchart has other numbers, so you still do the working yourself.', visual: chart(W2, 300) },
  { text: 'Begin at Start. Box 2: <strong>Say "Go"</strong> shows a message. It does not move the sprite.', visual: chart(W2, 300, [1]) + note('Steps so far: ' + hl('0')) },
  { text: 'Next: <strong>Point in direction -90</strong>. Up is 0. Each 90 is a quarter turn: 90 is right, -90 is left. 180 is a half turn, so it faces the opposite way to up.', visual: chart(W2, 300, [2]) + note('-90: facing ' + hl('left')) },
  { text: 'Next: <strong>Move 15 steps</strong>.', visual: chart(W2, 300, [3]) + note('Steps so far: ' + hl('15')) },
  { text: 'Next: <strong>Move 25 steps</strong>. 15 + 25 = 40.', visual: chart(W2, 300, [4]) + note('Steps so far: ' + hl('40')) },
  { text: 'At <strong>End</strong>: 40 steps altogether. It still faces left, because no box after the Point box turned it.', visual: chart(W2, 300, [5]) + note('Altogether: ' + hl('40 steps') + ', facing left') },
  { text: 'Symbols: an <strong>input or output</strong> box has <strong>sloping sides</strong>. Find the box with sloping sides: here it is box 2, the Say box. Now find yours by its shape.', visual: chart(W2, 300, [1]) + note('Sloping sides: ' + hl('box 2')) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Read the Flowchart', 'Do Now: Read the Flowchart', 'From Lessons 1 and 2. Begin at Start. Follow the arrows.', [
  { label: 'How many steps does the sprite move altogether?', answer: num(dn2.steps, 'steps?'), feedback: 'Find every Move box. Add their numbers together.' },
  { label: 'Which way does the sprite face at the end?', answer: '^\\s*(it\\s+(faces|points)\\s+)?down(wards?)?\\s*$', feedback: 'Up is 0. 180 is a half turn from up. Which way is that?' },
  { label: 'Which box number is an input or output symbol?', answer: num(4), feedback: 'Look at the shapes, not the words inside. Which box has sloping sides?' },
], chart(DN2, 340)));
steps[steps.length - 1].walkthrough = WT_LINE;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-3-1-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from the whole Flowcharts unit. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '3.1: Choosing Algorithm Constructs',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Software Development and Physical Computing</p><h2 class="lesson-h2">3.1: Choosing Algorithm Constructs</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> choose the right kind of flowchart for a problem.', '<strong>The big question:</strong> why does one problem need a decision, and another does not?']) });

// ---------------------------------------------------------------- sequence
{
  const f = FC.line([point(90), move(30), say('Done')]);
  const a = FC.run(f), b = FC.run(f);
  assert(a.steps === 30 && b.steps === 30 && a.said.join() === b.said.join(), 'sequence');
  steps.push({ id: 'sequence', label: 'Sequence: Steps in Order',
    content: '<h2 class="lesson-h2">Sequence: Steps in Order</h2>' +
      tps('Predict: the sprite runs this flowchart two times. Is anything different the second time? Why?',
        '<p>No. The same boxes run in the same order: face right, 30 steps, then say Done.</p><p><strong>Why?</strong> There is only one path. Nothing in it can change what happens.</p>', 'Show the worked answer') +
      '<p class="lesson-lead">A <strong>construct</strong> is a way to join the boxes of an algorithm. The first construct is <strong>sequence</strong>.</p>' +
      columns(chart(f, 330), facts([
        'Boxes run <strong>one after another</strong>, in order.',
        'There is <strong>one path</strong> from Start to End.',
        '<strong>Every box runs, every time.</strong>',
      ])) });
}

{
  const A = FC.line([say('Ready'), move(50), say('Done')]);
  const B = FC.line([say('Done'), move(50), say('Ready')]);
  const ra = FC.run(A), rb = FC.run(B);
  assert(ra.steps === rb.steps && ra.said.join() === 'Ready,Done' && rb.said.join() === 'Done,Ready', 'compare-order');
  steps.push({ id: 'compare-order', label: 'Compare: Same Boxes, New Order',
    content: '<h2 class="lesson-h2">Compare: Same Boxes, New Order</h2>' +
      tps('What is the same? What is different? Which sprite says Ready before it moves? Why does the order matter?',
        '<p><strong>Same:</strong> the same three boxes, 50 steps each.</p><p><strong>Different:</strong> the order. A says Ready, moves, then says Done. B says Done before it has moved.</p><p><strong>Why?</strong> In a sequence the boxes run in order, so the order is the plan.</p>') +
      '<p class="lesson-lead">The same three boxes, in a different order.</p>' +
      columns(paneTitle('Flowchart A') + chart(A, 320), paneTitle('Flowchart B') + chart(B, 320)) });
}

{
  const f = numbered(FC.line([say('Hello'), move(20), TURN, move(40)]));
  const a = FC.run(f), b = FC.run(f);
  assert(a.steps === 60 && b.steps === 60 && f.nodes[3].text === 'Turn right 90 degrees', 'sequence-check');
  steps.push(checkStep('sequence-check', 'Your Turn: Sequence', 'Your Turn: Sequence', 'Begin at Start. Follow the arrows.', [
    { label: 'How many steps does the sprite move altogether?', answer: num(a.steps, 'steps?'), feedback: 'Find every Move box. Add their numbers together.' },
    { label: 'The sprite runs it again. How many steps does it move this time?', answer: num(b.steps, 'steps?'), feedback: 'Which boxes run the second time? Follow the arrows again from Start.' },
    { label: 'Which box number runs straight after box 3?', answer: num(4), feedback: 'Find box 3. Follow the arrow out of it.' },
  ], chart(f, 360)));
}

// ---------------------------------------------------------------- when sequence fails
{
  const f = FC.line([say('Well done')]);
  assert(FC.run(f).said[0] === 'Well done', 'sequence-fails');
  steps.push({ id: 'sequence-fails', label: 'When Steps in Order Are Not Enough',
    content: '<h2 class="lesson-h2">When Steps in Order Are Not Enough</h2>' +
      tps('Predict: Score is 20. What does this flowchart say? Is that right? Why?',
        '<p>It says <strong>Well done</strong>. That is wrong: 20 is not bigger than 50.</p><p><strong>Why?</strong> A sequence runs every box every time. No box looks at Score, so it cannot say anything else.</p>', 'Show the worked answer') +
      problem('say "Well done" <strong>only when</strong> Score is bigger than 50.') +
      columns(paneTitle('A sequence for the problem') + chart(f, 230), facts([
        'Score is 80. It says Well done. <strong>Right.</strong>',
        'Score is 20. What does it say?',
        'A good algorithm works for <strong>every</strong> Score.',
      ])) });
}

// ---------------------------------------------------------------- selection
{
  const f = branch('Score > 50?', say('Well done'), say('Try again'));
  const a = FC.run(f, { values: { Score: 80 } }).said[0], b = FC.run(f, { values: { Score: 20 } }).said[0];
  assert(a === 'Well done' && b === 'Try again', 'selection');
  steps.push({ id: 'selection', label: 'Selection: A Decision Chooses the Path',
    content: '<h2 class="lesson-h2">Selection: A Decision Chooses the Path</h2>' +
      tps('Predict: Score is 80, then Score is 20. What does it say each time? Why can it say different things?',
        '<p>80 &gt; 50 is True: <strong>Well done</strong>. 20 &gt; 50 is False: <strong>Try again</strong>.</p><p><strong>Why?</strong> The decision looks at Score, so a different Score can take a different path.</p>', 'Show the worked answer') +
      '<p class="lesson-lead">The second construct is <strong>selection</strong>. A decision asks a question. The answer chooses the path.</p>' +
      columns(chart(f, 330), facts([
        'True: follow the <strong>True</strong> path.',
        'False: follow the <strong>False</strong> path.',
        '<strong>Only one path runs</strong> each time.',
      ])) });
}

{
  const A = FC.line([say('Buy')]);
  const B = branch('Coins > Price?', say('Buy'), say('Save up'));
  const v = { values: { Coins: 3, Price: 8 } };
  assert(FC.run(A, v).said[0] === 'Buy' && FC.run(B, v).said[0] === 'Save up' && FC.run(B, { values: { Coins: 9, Price: 8 } }).said[0] === 'Buy', 'compare-constructs');
  steps.push({ id: 'compare-constructs', label: 'Compare: Sequence or Selection?',
    content: '<h2 class="lesson-h2">Compare: Sequence or Selection?</h2>' +
      tps('Coins is 3. Price is 8. What does each flowchart say? Which one works for every Coins and Price? Why?',
        '<p>A says <strong>Buy</strong>. Wrong: 3 is not bigger than 8. B: 3 &gt; 8 is False, so it says <strong>Save up</strong>. Right.</p><p><strong>Why?</strong> Only B works every time, because its decision looks at the numbers. A always says Buy.</p>') +
      problem('say "Buy" only when Coins is bigger than Price. Otherwise say "Save up".') +
      columns(paneTitle('A: sequence') + chart(A, 300), paneTitle('B: selection') + chart(B, 300)) });
}

{
  const f = numbered(branch('Lives = 0?', say('Game over'), say('Play on')));
  const a = FC.run(f, { values: { Lives: 0 } }), b = FC.run(f, { values: { Lives: 2 } });
  assert(a.said.join() === 'Game over' && b.said.join() === 'Play on' && b.said.length === 1, 'selection-check');
  steps.push(checkStep('selection-check', 'Your Turn: Which Path?', 'Your Turn: Which Path?', 'Put the number into the decision. Follow that arrow.', [
    { label: 'Lives is 0. What does the sprite say?', answer: word('game\\s+over'), feedback: 'Put 0 into the decision. Is 0 the same as 0?' },
    { label: 'Lives is 2. What does the sprite say?', answer: word('play\\s+on'), feedback: 'Is 2 the same as 0? Then follow that arrow.' },
    { label: 'Lives is 2. How many of the two Say boxes run?', answer: '^\\s*(1|one|only\\s+(1|one))(\\s+(of\\s+them|box(es)?|say\\s+box(es)?))?\\s*$', feedback: 'Follow the arrows from Start to End. Count the Say boxes you pass.' },
  ], chart(f, 340)));
}

// ---------------------------------------------------------------- clue words
steps.push({ id: 'clue-words', label: 'Clue Words in the Problem',
  content: '<h2 class="lesson-h2">Clue Words in the Problem</h2>' +
    tps('Why does the word "otherwise" tell you there is a False path?', '<p>Otherwise means: when the answer is False, do this instead. So there are two paths, and a decision chooses one.</p>') +
    '<p class="lesson-lead">Read the problem first. Does what happens <strong>depend</strong> on a number or a key?</p>' +
    bigTable('<table class="donow-table"><thead><tr><th>Clue</th><th>Example problem</th><th>Construct</th></tr></thead><tbody>' +
      '<tr><td><strong>if</strong></td><td><strong>If</strong> Up is pressed, say "Jump".</td><td>Selection</td></tr>' +
      '<tr><td><strong>only when</strong></td><td>Say "Win" <strong>only when</strong> Score is bigger than 10.</td><td>Selection</td></tr>' +
      '<tr><td><strong>otherwise</strong></td><td>... <strong>Otherwise</strong> say "Try again".</td><td>Selection (the False path)</td></tr>' +
      '<tr><td>No clue word</td><td>Move 10 steps, then say "Hi".</td><td>Sequence</td></tr>' +
      '</tbody></table>') });

steps.push(checkStep('clue-check', 'Your Turn: Sequence or Selection?', 'Your Turn: Sequence or Selection?', 'Type <strong>sequence</strong> or <strong>selection</strong> for each problem.', [
  { line: true, label: 'Move 20 steps, then say "Hi".', answer: SEQ, feedback: 'Look for a clue word. Does anything depend on a number or a key?' },
  { line: true, label: 'Say "Cold" only when Temp is smaller than 10.', answer: SEL, feedback: 'Look for a clue word. Does anything depend on a number or a key?' },
  { line: true, label: 'If Space is pressed, say "Jump". Otherwise say "Wait".', answer: SEL, feedback: 'Find a clue word: if, only when, otherwise. Is there one?' },
  { line: true, label: 'Point in direction 0, then move 30 steps.', answer: SEQ, feedback: 'Find a clue word: if, only when, otherwise. Is there one?' },
]));

steps.push(embed('activity-1', 'Activity 1: Sequence or Selection?', 'drill-y7-3-1-choose', 'Activity 1: Sequence or Selection?',
  'Choose the construct for each problem. Test flowcharts with numbers. Your progress is saved.'));

// ---------------------------------------------------------------- explain why
steps.push(selfMarked('why-check', 'Explain: Why a Decision Is Needed', 'Explain: Why a Decision Is Needed',
  problem('say "Pass" only when Mark is bigger than 40. Otherwise say "Try again".'), [
    { id: 'why-decision', prompt: 'Explain why a sequence alone cannot solve this problem. [2]', marks: 2,
      modelAnswer: 'A sequence runs every box every time, so it would say the same thing for every Mark (1 mark). The problem needs a decision, Mark > 40?, to choose which Say box runs (1 mark).' },
  ]));

// ---------------------------------------------------------------- build a selection
{
  const model = branch('Up arrow pressed?', say('Jump'), say('Stand'));
  assert(FC.run(model, { presses: [1] }).said[0] === 'Jump' && FC.run(model, { presses: [0] }).said[0] === 'Stand', 'build-it model');
  const blank = numbered(branch('A', ['io', 'B'], ['io', 'C']));
  steps.push(checkStep('build-it', 'Build It: Fill In the Decision', 'Build It: Fill In the Decision',
    '<strong>Problem:</strong> if the Up arrow is pressed, say "Jump". Otherwise say "Stand".', [
      { line: true, label: 'What should box A say?', answer: '^\\s*(is\\s+)?(the\\s+)?up(\\s+arrow)?(\\s+key)?\\s+(is\\s+)?pressed\\s*\\??\\s*$', feedback: 'A asks the question after "if". Use the words of a key decision.' },
      { line: true, label: 'What should box B say? It is on the True path.', answer: sayBox('jump'), feedback: 'True: the key is pressed. What does the problem say then?' },
      { line: true, label: 'What should box C say? It is on the False path.', answer: sayBox('stand'), feedback: 'False is the "otherwise" part of the problem.' },
      { label: 'Which construct does it use: sequence or selection?', answer: SEL, feedback: 'Does it choose a path, or run every box every time?' },
    ], chart(blank, 330)));
}

steps.push(embed('activity-2', 'Activity 2: Build the Flowchart', 'drill-y7-3-1-build', 'Activity 2: Build the Flowchart',
  'Fill in the missing box so the flowchart solves the problem. Your progress is saved.'));

// ---------------------------------------------------------------- both together
{
  const f = choice([point(90), move(40)], 'Coins > 5?', [say('Shop')], [say('Home')]);
  const a = FC.run(f, { values: { Coins: 9 } }), b = FC.run(f, { values: { Coins: 2 } });
  assert(a.steps === 40 && b.steps === 40 && a.said[0] === 'Shop' && b.said[0] === 'Home', 'both');
  steps.push({ id: 'both', label: 'Sequence and Selection Together',
    content: '<h2 class="lesson-h2">Sequence and Selection Together</h2>' +
      tps('Predict: which boxes run every time? Which boxes run only sometimes? Why?',
        '<p><strong>Every time:</strong> Point in direction 90 and Move 40 steps. They are a sequence before the decision.</p><p><strong>Sometimes:</strong> Say "Shop" or Say "Home". The decision chooses one of them.</p>', 'Show the worked answer') +
      '<p class="lesson-lead">Most algorithms use <strong>both</strong> constructs.</p>' +
      columns(chart(f, 380), facts([
        'Steps that always happen: <strong>sequence</strong>.',
        'A step that depends on a number or a key: <strong>selection</strong>.',
        'Use a decision only where the problem needs a choice.',
      ])) });
}

{
  const f = numbered(choice([move(30), say('Ready')], 'Score > Target?', [move(20)], [say('Try again')]));
  const a = FC.run(f, { values: { Score: 9, Target: 6 } }), b = FC.run(f, { values: { Score: 6, Target: 6 } });
  assert(a.steps === 50 && b.steps === 30 && b.said.join() === 'Ready,Try again', 'practice');
  steps.push(checkStep('practice', 'Practice: Choose and Use', 'Practice: Choose and Use', 'Use the flowchart for (a) and (b).', [
    { label: 'Score is 9. Target is 6. How many steps altogether?', answer: num(a.steps, 'steps?'), feedback: 'Add the Move box before the decision. Then put the numbers in and follow that arrow.' },
    { label: 'Score is 6. Target is 6. How many steps altogether?', answer: num(b.steps, 'steps?'), feedback: 'Is 6 bigger than 6? Then follow that arrow.' },
    { line: true, label: 'New problem: say "Hi", then move 10 steps. Sequence or selection?', answer: SEQ, feedback: 'Look for a clue word: if, only when, otherwise. Is there one?' },
  ], chart(f, 380)));
}

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Choosing Algorithm Constructs', 'drill-y7-3-1-constructs', 'Plenary: Choosing Algorithm Constructs',
  'Sequence, selection, and choosing between them. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
// The title slide's TPS goes under its facts.
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '');
  t.content += tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, 'Level up') && V('do-now', 0, '"level up"') && !V('do-now', 0, 'Keep going') && V('do-now', 1, 'keep going') && !V('do-now', 1, 'Level up'), 'do-now marks');
assert(V('do-now', 2, '5') && V('do-now', 2, 'box 5') && !V('do-now', 2, '3'), 'do-now box');
assert(V('do-now-2', 0, '50') && V('do-now-2', 0, '50 steps') && !V('do-now-2', 0, '30') && V('do-now-2', 1, 'down') && !V('do-now-2', 1, 'up') && V('do-now-2', 2, '4') && V('do-now-2', 2, 'box 4') && !V('do-now-2', 2, '2'), 'do-now-2 marks');
assert(V('sequence-check', 0, '60') && V('sequence-check', 1, '60 steps') && !V('sequence-check', 1, '120') && V('sequence-check', 2, '4') && !V('sequence-check', 2, '5'), 'sequence-check marks');
assert(V('selection-check', 0, 'Game over') && !V('selection-check', 0, 'Play on') && V('selection-check', 1, 'play on') && V('selection-check', 2, '1') && V('selection-check', 2, 'one') && !V('selection-check', 2, '2'), 'selection-check marks');
assert(V('clue-check', 0, 'sequence') && V('clue-check', 0, 'Sequence.') && !V('clue-check', 0, 'selection') && V('clue-check', 1, 'Selection') && V('clue-check', 1, 'a decision') && !V('clue-check', 1, 'sequence') && V('clue-check', 2, 'selection') && V('clue-check', 3, 'sequence'), 'clue-check marks');
assert(V('build-it', 0, 'Up arrow pressed?') && V('build-it', 0, 'up pressed') && V('build-it', 0, 'Is the up arrow pressed?') && !V('build-it', 0, 'Down arrow pressed?') && !V('build-it', 0, 'NOT Up arrow pressed?'), 'build-it A');
assert(V('build-it', 1, 'Say "Jump"') && V('build-it', 1, 'say jump') && !V('build-it', 1, 'Say "Stand"') && V('build-it', 2, 'Say "Stand"') && V('build-it', 3, 'selection') && !V('build-it', 3, 'sequence'), 'build-it marks');
assert(V('practice', 0, '50') && !V('practice', 0, '30') && V('practice', 1, '30') && !V('practice', 1, '50') && V('practice', 2, 'sequence') && !V('practice', 2, 'selection'), 'practice marks');
// Feedback nudges and never contains an accepted answer (every 1 to 6 word run is tested against its own pattern).
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) {
    const run = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
    assert(!rx.test(run), `feedback leaks the answer: ${k}${p.suffix} "${run}"`);
  }
}
const plain = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
// Every piece of TPS text and walkthrough text (whole, sentences, phrases, words) fails the slide's own marking.
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };
for (const s of steps.filter((x) => x.validatorKey)) {
  const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, 'i'));
  const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
  if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
  for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
}
// The walkthroughs show the method with other numbers and never the Do Now answers.
{
  const a = plain(JSON.stringify(WT_DEC.steps.map((x) => x.text + ' ' + x.visual))).toLowerCase();
  assert(!/level up|keep going|\b45\b|\b30\b|\b12\b|box 5/.test(a), 'decision walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_LINE.steps.map((x) => x.text + ' ' + x.visual))).toLowerCase();
  assert(!/\b50\b|down|\b4\b/.test(b), 'line walkthrough leaks an answer');
  assert(!/Points|Level up|Ready|Move 20|Move 30/.test(JSON.stringify([WT_DEC, WT_LINE])), 'walkthrough charts reuse the Do Now chart');
}
// Every slide asks a why: a Think, Pair, Share on every slide except the Extension.
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it (the title slide only names today's topic).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/\bconstructs?\b/i, 'sequence'], [/\bsequences?\b/i, 'sequence'], [/\bselections?\b/i, 'selection'], [/\bclue words?\b/i, 'clue-words']];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
// No dashes, no citations, no game mention, Year 7 words only.
{
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478/.test(all), 'citation found');
  assert(!/mario|party/i.test(all), 'game mention');
  assert(!/\b(variable|counter|assign\w*|WHILE|REPEAT|FOR|IF|THEN|ELSE)\b/.test(all.replace(/"IF"/g, '')), 'a word Year 7 has not met');
}

const lesson = { id: ID, label: '3.1: Choosing Algorithm Constructs', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drills
// Helpers shared by the three drills, written out as source into each data file (the drill runs them).
function prelude() {
  var FC = FlowchartCore;
  var WORDS = ["Hello", "Ready", "Go", "Done", "Hi", "Stop", "Yes", "Bye", "Wave", "Jump", "Clap", "Spin"];
  var NAMES = ["Score", "Coins", "Points", "Speed", "Mark"];
  var KEYS = [["Up arrow", "Up"], ["Down arrow", "Down"], ["Left arrow", "Left"], ["Right arrow", "Right"], ["Space", "Space"]];
  var DIRS = [["right", 90], ["left", -90], ["up", 0], ["down", 180]];
  var SEQ_RE = /^\s*(it\s+needs\s+)?(an?\s+)?(sequence|steps\s+in\s+order)(\s+construct)?\s*[.!]?\s*$/i;
  var SEL_RE = /^\s*(it\s+needs\s+)?(an?\s+)?(selection|decision)(\s+construct)?\s*[.!]?\s*$/i;
  var TURN = ["process", "Turn right 90 degrees"];

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function range(a, b, step) { return drillRange(a, b, step); }
  function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }
  function words(n) { return shuffled(WORDS).slice(0, n); }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numRe(n, unit) {
    var body = (n < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(n);
    return new RegExp("^\\s*(box\\s*)?" + body + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*$", "i");
  }
  function wordRe(w) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + esc(w).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"); }
  function sayRe(w) { return new RegExp("^\\s*(say\\s*:?\\s*)?[\"'\\u201c]?\\s*" + esc(w).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*$", "i"); }
  function moveRe(n) { return new RegExp("^\\s*move\\s*:?\\s*" + n + "(\\s*steps?)?\\s*$", "i"); }
  function pointRe(d) { return new RegExp("^\\s*point\\s+in\\s+direction\\s*:?\\s*" + (d < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(d) + "(\\s*degrees?)?\\s*$", "i"); }
  function boxRe(b) {
    var t = b[1], m;
    if ((m = /^Move (\d+) steps$/.exec(t))) return moveRe(m[1]);
    if ((m = /^Say "(.*)"$/.exec(t))) return sayRe(m[1]);
    if ((m = /^Point in direction (-?\d+)$/.exec(t))) return pointRe(+m[1]);
    return /^\s*turn\s+right\s*:?\s*90(\s*degrees?)?\s*$/i;
  }
  function orderRe(list) {
    return new RegExp("^\\s*" + list.map(function (w) { return "[\"'\\u201c]?" + esc(w) + "[\"'\\u201d]?"; }).join("\\s*(,|;|then|and|\\s)\\s*(then\\s+)?") + "\\s*\\.?\\s*$", "i");
  }
  function others(ans, list) { return drillWrongNumbers(ans, list.concat([ans + 10, ans + 20, ans - 10, ans + 1]).filter(function (v) { return v !== ans && v > 0; }), 3); }
  function keyWord(v) { return v ? "pressed" : "not pressed"; }
  function say(w) { return ["io", "Say \"" + w + "\""]; }
  function move(n) { return ["process", "Move " + n + " steps"]; }
  function point(d) { return ["process", "Point in direction " + d]; }
  function numbered(f) { f.numbered = true; return f; }
  // A decision with a path of boxes for True and for False, after the boxes in pre. Box numbers: Start, pre...,
  // the decision, the True path..., End, the False path...
  function choice(pre, question, tBoxes, fBoxes) {
    var nodes = [{ id: "s", type: "terminal", text: "Start" }], edges = [], last = "s";
    pre.forEach(function (b, i) { nodes.push({ id: "p" + i, type: b[0], text: b[1] }); edges.push({ from: last, to: "p" + i, label: null }); last = "p" + i; });
    nodes.push({ id: "d", type: "decision", text: question }); edges.push({ from: last, to: "d", label: null });
    function path(boxes, tag, label) {
      var prev = "d";
      boxes.forEach(function (b, i) { var id = tag + i; nodes.push({ id: id, type: b[0], text: b[1] }); edges.push({ from: prev, to: id, label: i ? null : label }); prev = id; });
      edges.push({ from: prev, to: "e", label: null });
    }
    path(tBoxes, "t", "True");
    nodes.push({ id: "e", type: "terminal", text: "End" });
    path(fBoxes, "f", "False");
    return { nodes: nodes, edges: edges };
  }

  // A problem that needs only steps in order.
  function seqProblem() {
    var d = pick(DIRS), n = range(10, 50, 10), m = range(10, 50, 10), w = words(2), form = range(0, 3), boxes, text;
    if (form === 0) { boxes = [point(d[1]), move(n)]; text = "Point in direction " + d[1] + ", then move " + n + " steps."; }
    else if (form === 1) { boxes = [say(w[0]), move(n), say(w[1])]; text = "Say \"" + w[0] + "\", then move " + n + " steps, then say \"" + w[1] + "\"."; }
    else if (form === 2) { boxes = [move(n), TURN, move(m)]; text = "Move " + n + " steps, turn right 90 degrees, then move " + m + " more steps."; }
    else { boxes = [point(d[1]), move(n), say(w[0])]; text = "Point in direction " + d[1] + ". Move " + n + " steps. Then say \"" + w[0] + "\"."; }
    return { text: text, boxes: boxes };
  }
  // A problem that needs a decision: a key, or a number compared with a fixed number. Two paths, two Say boxes.
  function selProblem(compareOnly) {
    var w = words(2), form = range(0, 3), sp = { w1: w[0], w2: w[1] };
    if (!compareOnly && Math.random() < 0.35) {
      var k = pick(KEYS); sp.kind = "key"; sp.key = k; sp.q = k[0] + " pressed?";
      sp.cond = (k[1] === "Space" ? "Space" : "the " + k[0]) + " is pressed";
      sp.decRe = new RegExp("^\\s*(is\\s+)?(the\\s+)?" + esc(k[1]) + "(\\s+(arrow|key|bar))?(\\s+key)?\\s+(is\\s+)?pressed\\s*\\??\\s*$", "i");
      var other = pick(KEYS.filter(function (x) { return x[1] !== k[1]; }));
      sp.wrongDec = [other[0] + " pressed?", "NOT " + sp.q, "Say \"" + w[0] + "\""];
    } else {
      sp.kind = "compare"; sp.name = pick(NAMES); sp.k = range(10, 60, 10); sp.op = pick([">", "<"]);
      sp.q = sp.name + " " + sp.op + " " + sp.k + "?";
      sp.cond = sp.name + " is " + (sp.op === ">" ? "bigger" : "smaller") + " than " + sp.k;
      var rev = sp.op === ">" ? "<" : ">", big = sp.op === ">" ? "(bigger|greater|more|larger)" : "(smaller|less|lower)", nm = esc(sp.name);
      sp.decRe = new RegExp("^\\s*(is\\s+)?(" + nm + "\\s*" + sp.op + "\\s*" + sp.k + "|" + sp.k + "\\s*" + rev + "\\s*" + nm + "|" + nm + "\\s+(is\\s+)?" + big + "\\s+than\\s+" + sp.k + ")\\s*\\??\\s*$", "i");
      sp.wrongDec = [sp.name + " " + rev + " " + sp.k + "?", sp.name + " = " + sp.k + "?", "Say \"" + w[0] + "\""];
    }
    var W1 = "say \"" + w[0] + "\"", W2 = "say \"" + w[1] + "\"";
    if (form === 0) { sp.text = "If " + sp.cond + ", " + W1 + ". Otherwise " + W2 + "."; sp.clues = ["if", "otherwise"]; }
    else if (form === 1) { sp.text = "S" + W1.slice(1) + " only when " + sp.cond + ". Otherwise " + W2 + "."; sp.clues = ["only when", "otherwise"]; }
    else if (form === 2) { sp.text = "If " + sp.cond + ", " + W1 + ". If not, " + W2 + "."; sp.clues = ["if", "if not"]; }
    else { sp.text = "S" + W1.slice(1) + " if " + sp.cond + ". Otherwise " + W2 + "."; sp.clues = ["if", "otherwise"]; }
    sp.flow = function () { return choice([], sp.q, [say(w[0])], [say(w[1])]); };
    sp.opts = function (v) { if (sp.kind === "key") return { presses: [v] }; var o = { values: {} }; o.values[sp.name] = v; return o; };
    sp.value = function () {
      if (sp.kind === "key") return range(0, 1);
      return pick([sp.k, sp.k + range(1, 15), sp.k - range(1, 9), sp.k + range(1, 15), sp.k - range(1, 9)]);
    };
    sp.given = function (v) { return sp.kind === "key" ? (sp.key[1] === "Space" ? "Space" : "The " + sp.key[0]) + " is " + keyWord(v) + "." : sp.name + " is " + v + "."; };
    return sp;
  }

  // As in the Year 7 recap drills: `example` is another draw of the same kind, with a different answer that
  // appears nowhere in it, worked through step by step.
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null, exSteps = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      [function (s) { return s; }, function (s) { return s.replace(/ The sprite has moved \d+ steps so far\./, ""); }].forEach(function (tidy) {
        for (var i = 0; i < 80 && !ex; i++) {
          var e = gen(), st = e.steps.map(tidy);
          var text = ((e.flow ? FC.describe(e.flow) : "") + " " + e.prompt + " " + st.join(" ") + " " + e.answer).toLowerCase();
          if (String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) { ex = e; exSteps = st; }
        }
      });
      var example = !ex ? null : (ex.flow ? "A similar flowchart: " + FC.describe(ex.flow) + "\n" : "A similar question:\n") +
        ex.prompt + "\n" + exSteps.join("\n") + "\nAnswer: " + ex.answer;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
        flow: c.flow, example: example, working: c.working, note: c.note, trace: c.steps };
    } };
  }
  // An explain card: the answer is always the same idea, so it has nudges and no worked example.
  function explain(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: [c.answer], keywords: [c.re], distractors: c.wrong, working: c.working, note: c.note };
    } };
  }

  // ---------------------------------------------------------------- card kinds
  function whichGen() {
    var seq = Math.random() < 0.5, p = seq ? seqProblem() : selProblem();
    return { flow: null, prompt: "Problem: " + p.text + "\nWhich construct does it need: sequence or selection?", answer: seq ? "Sequence" : "Selection", re: seq ? SEQ_RE : SEL_RE,
      wrong: [seq ? "Selection" : "Sequence", "Sub-routine", "Key-press loop"],
      steps: seq ? ["Look for a clue word: if, only when, otherwise. There is none.", "Nothing depends on a number or a key. Every box runs every time, in order."]
        : ["Look for a clue word. This problem says \"" + p.clues[0] + "\".", "What happens depends on " + (p.kind === "key" ? "a key" : p.name) + ", so a decision must choose the path."],
      working: ["Look for a clue word: if, only when, otherwise.", "Does what happens depend on a number or a key? Then a decision must choose the path."],
      note: seq ? "No clue word: the same boxes run every time, in order. Sequence." : "The clue word \"" + p.clues[0] + "\" shows a choice. A decision chooses the path: selection." };
  }
  function clueGen() {
    var p = selProblem(), alts = p.clues.concat(p.clues.indexOf("only when") >= 0 ? ["only", "when"] : []);
    return { flow: null, prompt: "Problem: " + p.text + "\nWhich word in the problem shows that it needs a decision?", answer: p.clues[0],
      re: new RegExp("^\\s*[\"'\\u201c]?\\s*(" + alts.map(function (c) { return esc(c).replace(/ /g, "\\s+"); }).join("|") + ")\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"),
      wrong: ["then", "say", "is"],
      steps: ["Read the whole problem.", "\"" + p.clues[0] + "\" shows the sprite does not always do the same thing."],
      working: ["Find the part of the problem that asks about a number or a key.", "Which word tells you the sprite does not always do the same thing?"],
      note: "\"" + p.clues.join("\" and \"") + "\" show a choice, so the problem needs a decision." };
  }
  function runGen(boundary) {
    return function () {
      var p = selProblem(boundary), v = boundary ? p.k : p.value(), flow = p.flow(), r = FC.run(flow, p.opts(v)), ans = r.said[0];
      return { flow: flow, prompt: p.given(v) + " What does the sprite say?", answer: ans, re: wordRe(ans), wrong: [ans === p.w1 ? p.w2 : p.w1, "True", "False"],
        steps: [r.trace[1], "Say \"" + ans + "\"."],
        working: [boundary ? "Put the number into the decision. Is it really bigger, or smaller? Check equal numbers carefully." : "Put the number or the key into the decision. Is it True or False?", "Follow that arrow to its Say box."],
        note: r.trace[1] };
    };
  }
  function breakGen() {
    var name = pick(NAMES), k = range(20, 60, 10), w = words(2), says = Math.random() < 0.5 ? 0 : 1, bad = [], good = [];
    for (var v = 1; v <= 100; v++) ((v > k) !== (says === 0) ? bad : good).push(v);
    var ans = pick(bad), when = says === 0 ? k + " or less" : "bigger than " + k;
    return { flow: FC.line([say(w[says])]),
      prompt: "Problem: say \"" + w[0] + "\" only when " + name + " is bigger than " + k + ". Otherwise say \"" + w[1] + "\".\nThis flowchart was drawn for it. Type a " + name + " from 1 to 100 that shows it is wrong.",
      answer: ans, re: new RegExp("^\\s*(" + bad.join("|") + ")\\s*$"), wrong: drillWrongNumbers(ans, shuffled(good), 3),
      steps: ["This flowchart always says \"" + w[says] + "\". It never looks at " + name + ".", "The problem says \"" + w[1 - says] + "\" when " + name + " is " + when + ".", "Any " + name + " like that shows the flowchart is wrong."],
      working: ["Follow this flowchart. Does it ever look at " + name + "?", "Find a number where the problem says something different from this flowchart."],
      note: "This flowchart always says \"" + w[says] + "\". When " + name + " is " + when + " it should say \"" + w[1 - says] + "\". It needs a decision." };
  }
  function whyFailsGen() {
    var p = selProblem();
    return { prompt: "Problem: " + p.text + "\nWhy can a sequence alone not solve this problem?",
      answer: "A sequence runs every box every time, so a decision is needed to choose the path",
      re: /^(?=.*\b(every|always|same|all|each)\b)(?=.*\b(decision|choose|chooses|choice|path|paths|depends?|different|question)\b).*$/i,
      wrong: ["A sequence has too few Move boxes, so it cannot reach the End box", "A sequence cannot use Say boxes, so the sprite cannot talk", "A sequence is too slow, so the sprite would move too few steps"],
      working: ["In a sequence, which boxes run? Do they change from one run to the next?", "The problem says different things for different numbers. What can choose between them?"],
      note: "A sequence runs every box every time. Only a decision can choose a different path for a different number or key." };
  }
  function whyNoDecGen() {
    var p = seqProblem();
    return { prompt: "Problem: " + p.text + "\nWhy does it not need a decision?",
      answer: "Nothing depends on a number or a key, so the same boxes run every time",
      re: /\b(same|every\s*time|always|one\s+path|no\s+(choice|clue|question|if|otherwise)|nothing\s+(depends|changes)|(does\s*not|doesn.?t|never)\s+(depend|change))/i,
      wrong: ["It is too long, so a decision would not fit in the flowchart", "It has a Move box, so a decision cannot be used with it", "It ends at End, so a decision would stop the sprite"],
      working: ["Look for a clue word: if, only when, otherwise. Is there one?", "Does anything in the problem depend on a number or a key?"],
      note: "No clue word and no choice: the same boxes run every time, in order. A sequence is enough." };
  }
  function whyOrderGen() {
    var w = pick(WORDS), n = range(20, 50, 10);
    return { prompt: "Flowchart A: Say \"" + w + "\", then Move " + n + " steps. Flowchart B: Move " + n + " steps, then Say \"" + w + "\". They have the same boxes. Why do they not do the same thing?",
      answer: "The boxes run in order, so B moves before it says " + w,
      re: /\b(order|first|before|after|then|later|sooner|start)\b/i,
      wrong: ["B has more boxes than A, so it takes longer", "A has a decision in it, but B has none", "B never reaches End, so it stops early"],
      working: ["In a sequence, which box runs first?", "Compare the first box of A with the first box of B."],
      note: "A sequence runs its boxes in order. A says " + w + " and then moves. B moves and then says " + w + "." };
  }
  function whyTestGen() {
    var p = selProblem(true);
    return { prompt: "Problem: " + p.text + "\nWhy test its flowchart with two numbers, not just one?",
      answer: "One number follows only one path, so a second number is needed to test the other path",
      re: /^(?=.*\b(paths?|arrows?|true|false|branch\w*|ways?)\b)(?=.*\b(both|other|each|every|second|two|all|one)\b).*$/i,
      wrong: ["One number is too small, so the sprite cannot move", "Two numbers make the flowchart run faster than one", "The decision needs two numbers to reach its End"],
      working: ["The decision follows one arrow for each number. Which arrows have you tested?", "A decision has a True arrow and a False arrow."],
      note: "Each number follows only one path. Test one number for True and one for False." };
  }
  function decGen(withPre) {
    return function () {
      var p = selProblem(), pre = withPre ? [move(range(10, 40, 10))] : [], flow = numbered(choice(pre, "?", [say(p.w1)], [say(p.w2)]));
      var n = pre.length + 2, text = withPre ? pre[0][1] + ". Then: " + p.text.charAt(0).toLowerCase() + p.text.slice(1) : p.text;
      return { flow: flow, prompt: "Problem: " + text + "\nWrite the decision for box " + n + ".", answer: p.q, re: p.decRe, wrong: p.wrongDec,
        steps: ["The clue word \"" + p.clues[0] + "\" shows the problem needs a decision.", "It asks about " + (p.kind === "key" ? "the key" : p.name) + ": " + p.q, "True path: Say \"" + p.w1 + "\". False path: Say \"" + p.w2 + "\"."],
        working: ["Find the part after the clue word. It is the question the decision asks.", p.kind === "key" ? "Write the key, then the word pressed, then a question mark." : "Write the name, the sign, then the number. > is bigger than, < is smaller than."],
        note: "Box " + n + " is " + p.q + " Its True arrow goes to Say \"" + p.w1 + "\"." };
    };
  }
  function pathGen(isTrue) {
    return function () {
      var p = selProblem(), blank = ["io", "?"];
      var flow = numbered(choice([], p.q, [isTrue ? blank : say(p.w1)], [isTrue ? say(p.w2) : blank]));
      var n = isTrue ? 3 : 5, w = isTrue ? p.w1 : p.w2, ans = "Say \"" + w + "\"";
      return { flow: flow, prompt: "Problem: " + p.text + "\nWrite box " + n + ", on the " + (isTrue ? "True" : "False") + " path.", answer: ans, re: sayRe(w),
        wrong: ["Say \"" + (isTrue ? p.w2 : p.w1) + "\"", "Move 10 steps", p.q],
        steps: ["Box " + n + " is on the " + (isTrue ? "True" : "False") + " path.", isTrue ? "True: " + p.cond + ". The problem says: say \"" + w + "\"." : "False: the other part of the problem. It says: say \"" + w + "\"."],
        working: ["True is what happens when the answer to the question is yes. False is the other part of the problem.", "Write the whole box: Say, then the word in quotes."],
        note: "Box " + n + " is " + ans + "." };
    };
  }
  function seqFillGen() {
    var p = seqProblem(), i = range(0, p.boxes.length - 1), boxes = p.boxes.slice(), ans = boxes[i], rx = boxRe(ans);
    boxes[i] = [ans[0], "?"];
    var flow = numbered(FC.line(boxes)), n = i + 2, wrong = [];
    p.boxes.map(function (b) { return b[1]; }).concat(["Start", "End", "Turn left 90 degrees", "Move 5 steps"]).forEach(function (t) {
      if (wrong.length < 3 && wrong.indexOf(t) < 0 && !rx.test(t)) wrong.push(t);
    });
    return { flow: flow, prompt: "Problem: " + p.text + "\nWrite box " + n + ".", answer: ans[1], re: rx, wrong: wrong,
      steps: ["The boxes run in the same order as the problem.", "Box " + n + " is part " + (i + 1) + " of the problem: " + ans[1] + "."],
      working: ["The boxes run in the same order as the problem. Box 1 is Start.", "Count along the problem to part " + (i + 1) + ". Write it as a box."],
      note: "Box " + n + " is " + ans[1] + "." };
  }
  function seqStepsGen() {
    var a = range(10, 40, 10), b = range(10, 40, 10), c = range(5, 25, 5);
    var flow = FC.line(shuffled([move(a), move(b), say(pick(WORDS)), pick([TURN, point(pick(DIRS)[1])]), move(c)])), r = FC.run(flow, {});
    return { flow: flow, prompt: "How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
      wrong: others(r.steps, [a + b, a + c, b + c, r.steps + 10, r.steps - 5]), steps: r.trace,
      working: ["Every box runs, in order. Find each Move box.", "Add their numbers together. Say, Turn and Point boxes do not move the sprite."],
      note: "Every box runs: " + a + " + " + b + " + " + c + " = " + r.steps + " steps." };
  }
  function seqOrderGen() {
    var w = words(3), a = range(10, 50, 10);
    var flow = FC.line(shuffled([say(w[0]), say(w[1]), move(a), say(w[2])])), r = FC.run(flow, {}), ans = r.said.join(", ");
    return { flow: flow, prompt: "Write everything the sprite says, in order.", answer: ans, re: orderRe(r.said),
      wrong: [r.said.slice().reverse().join(", "), r.said.slice(1).concat(r.said.slice(0, 1)).join(", "), r.said.slice(0, 2).join(", ")],
      steps: r.trace, working: ["Begin at Start and follow the arrows, one box at a time.", "Write each Say box as you reach it. Move boxes say nothing."],
      note: "In order: " + ans + "." };
  }
  function seqCountGen() {
    var n = range(3, 6), pool = [move(range(10, 50, 10)), say(pick(WORDS)), TURN, point(pick(DIRS)[1]), move(range(10, 50, 10)), say(pick(WORDS))];
    var flow = FC.line(shuffled(pool).slice(0, n));
    return { flow: flow, prompt: "The sprite runs this flowchart. How many of the boxes between Start and End run?", answer: n, re: numRe(n, "(boxes)?"),
      wrong: others(n, [1, 2, n - 1, n + 1]), steps: ["There is no decision, so there is only one path.", "Every box on that path runs. Count them."],
      working: ["Is there a decision? If not, how many paths are there?", "Count every box between Start and End."],
      note: "A sequence: all " + n + " boxes run, every time." };
  }
  function selCountGen() {
    var name = pick(NAMES), k = range(10, 50, 10), a = range(10, 30, 10), b = range(10, 30, 10), c = range(10, 40, 10);
    var flow = choice([], name + " > " + k + "?", [move(a), move(b)], [move(c)]);
    var v = pick([k, k + range(1, 9), k - range(1, 9)]), vals = {}; vals[name] = v;
    var r = FC.run(flow, { values: vals });
    return { flow: flow, prompt: name + " is " + v + ". How many steps does the sprite move?", answer: r.steps, re: numRe(r.steps, "steps?"),
      wrong: others(r.steps, [a + b + c, a + b, c, a + c, b + c]), steps: r.trace,
      working: ["Put the number into the decision. Is it True or False?", "Only the boxes on that path run. Add their Move numbers."],
      note: r.trace[1] + " Only that path runs: " + r.steps + " steps." };
  }
  function bothStepsGen() {
    var pre = range(10, 40, 10), name = pick(NAMES), k = range(10, 50, 10), extra = range(10, 30, 10), w = pick(WORDS);
    var flow = choice([move(pre), say(w)], name + " > " + k + "?", [move(extra)], [say("Try again")]);
    var v = pick([k, k + range(1, 9), k - range(1, 9)]), vals = {}; vals[name] = v;
    var r = FC.run(flow, { values: vals });
    return { flow: flow, prompt: name + " is " + v + ". How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
      wrong: others(r.steps, [pre + extra, pre, extra, pre * 2]), steps: r.trace,
      working: ["The boxes before the decision run every time.", "Then put the number into the decision and follow only that path."],
      note: "The Move before the decision always runs. " + r.trace[3] + " So " + r.steps + " steps." };
  }
}
const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };

function chooseCards() {
  return [
    card("ch-which-1", "ch-which", whichGen),
    card("ch-which-2", "ch-which", whichGen),
    card("ch-clue", "ch-which", clueGen),
    card("ch-run", "ch-test", runGen(false)),
    card("ch-break", "ch-test", breakGen),
    explain("ch-why-fails", "ch-why", whyFailsGen),
    explain("ch-why-nodec", "ch-why", whyNoDecGen)
  ];
}
function buildCards() {
  return [
    card("bd-decision", "bd-sel", decGen(false)),
    card("bd-true", "bd-sel", pathGen(true)),
    card("bd-false", "bd-sel", pathGen(false)),
    card("bd-seq-1", "bd-seq", seqFillGen),
    card("bd-seq-2", "bd-seq", seqFillGen),
    card("bd-both-decision", "bd-both", decGen(true)),
    card("bd-both-steps", "bd-both", bothStepsGen)
  ];
}
function plenaryCards() {
  return [
    card("pl-seq-steps", "pl-seq", seqStepsGen),
    card("pl-seq-order", "pl-seq", seqOrderGen),
    card("pl-seq-count", "pl-seq", seqCountGen),
    card("pl-seq-fill", "pl-seq", seqFillGen),
    card("pl-sel-say", "pl-sel", runGen(false)),
    card("pl-sel-boundary", "pl-sel", runGen(true)),
    card("pl-sel-steps", "pl-sel", selCountGen),
    card("pl-sel-decision", "pl-sel", decGen(false)),
    card("pl-choose-1", "pl-choose", whichGen),
    card("pl-choose-2", "pl-choose", whichGen),
    card("pl-choose-clue", "pl-choose", clueGen),
    card("pl-choose-break", "pl-choose", breakGen),
    card("pl-choose-both", "pl-choose", bothStepsGen),
    explain("pl-why-fails", "pl-why", whyFailsGen),
    explain("pl-why-nodec", "pl-why", whyNoDecGen),
    explain("pl-why-order", "pl-why", whyOrderGen),
    explain("pl-why-test", "pl-why", whyTestGen)
  ];
}

const DRILLS = [
  ['y7-3-1-choose', 'Activity 1: read a problem and choose sequence or selection; test a flowchart with numbers; say why.',
    'Year 7, 3.1: Sequence or Selection?', 'Choosing a construct',
    [['ch-which', 'Sequence or Selection?'], ['ch-test', 'Test the Flowchart'], ['ch-why', 'Why?']], chooseCards],
  ['y7-3-1-build', 'Activity 2: fill in the missing box (a decision, a True or False path, or a step in order) so the flowchart solves the problem.',
    'Year 7, 3.1: Build the Flowchart', 'Fill in the missing box',
    [['bd-sel', 'Build a Selection'], ['bd-seq', 'Build a Sequence'], ['bd-both', 'Both Together']], buildCards],
  ['y7-3-1-constructs', 'Plenary: sequence, selection, choosing between them, and why.',
    'Year 7, 3.1: Choosing Algorithm Constructs', 'Sequence and selection',
    [['pl-seq', 'Sequence'], ['pl-sel', 'Selection'], ['pl-choose', 'Choosing a Construct'], ['pl-why', 'Why?']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = `// Year 7, 3.1 Choosing Algorithm Constructs. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_y7_3_1.mjs: edit that, then run it. Every answer comes from running the card's own\n// flowchart (Drills/flowchart-core.js), in Year 7's words.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {${body(prelude)}\n${body(fn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does: its answer passes, no distractor passes, no working step or
// example gives the answer away, and every Extension card has a worked example.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ext = fs.readFileSync(path.join(ROOT, 'Drills', 'data', 'y7-3-1-ext.js'), 'utf8');
  assert(!/\b(sequence|selection|construct)s?\b/i.test(ext.replace(/^\/\/.*$/gm, '')), 'the Extension uses a term before it is taught');
  for (const id of ['y7-3-1-ext', ...DRILLS.map((d) => d[0])]) {
    const ctx = { console, Math, DrillData: { register: (k, d) => { ctx.out = d; ctx.key = k; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'flowchart-core.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(ctx.key === id, `${id} registers as ${ctx.key}`);
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
    for (const card of d.cards) {
      for (let n = 0; n < 300; n++) {
        const r = { ...card, ...card.randomize() };
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        assert(pass(ans.toLowerCase()) || /^[\d, ]+$/.test(ans) || /["]/.test(ans), `${id} ${card.id}: "${ans}" in lower case fails`);
        for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
        assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length && !r.distractors.map(String).includes(ans), `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        if (r.working && !inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
        if (r.example) {
          const whole = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!(ans.length >= 3 && whole.test(r.example.toLowerCase()) && !whole.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        }
        if (id === 'y7-3-1-ext') assert(r.example, `${id} ${card.id}: no worked example`);
        assert(!/[\u2013\u2014]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors])), `${id} ${card.id}: dash`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: read it just before writing, change only
// Year 7, and write it back in the same format.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y7 = all.years.find((y) => y.id === 'year7');
const UNIT = 'Software Development and Physical Computing';
let unit = y7.units.find((u) => u.title === UNIT), changed = false;
if (!unit) { unit = { code: '7CT.08', title: UNIT, lessons: [] }; y7.units.push(unit); changed = true; }
if (!unit.lessons.includes(ID)) { unit.lessons.push(ID); changed = true; }
if (changed) {
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; Year 7 units: ${y7.units.map((u) => u.title + ' [' + u.lessons.join(', ') + ']').join('; ')}`);
