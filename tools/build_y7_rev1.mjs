// Builds LessonData/y7-revision-1.json: Year 7, Revision 1: Reading Flowcharts, the first of two lessons before the
// Term 1 exam, and registers it in a Year 7 "Term 1 Exam Revision" unit.
//   node tools/build_y7_rev1.mjs
// Lessons 1 and 2 only: the four symbols, reading a flowchart, finding and fixing a box, key-press loops. Written
// for a class of mostly EAL learners (James, 2026-09-30: lessons had been too heavy): one idea per slide, short
// sentences, the same words every time, typed answers rather than multiple choice. The practice is the same kind
// of question as the exam, never the exam's own questions. Drill: y7-revision-1 (the class race runs it too).
// Flowcharts are drawn by Drills/flowchart-core.js, the same code as the drill and the Year 7 lessons.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-revision-1';
const P = 'y7r1';
const re = (source) => ({ __regex: true, source, flags: 'i' });

// ---------------------------------------------------------------- pieces (as in build_y7_l5.mjs)
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
function chart(flow, maxH = 400) {
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    FC.svg(flow, !!flow.numbered).replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
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
const numbered = (flow) => Object.assign(flow, { numbered: true });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

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
const SYM = {
  terminal: '^\\s*(an?\\s+)?(start\\s*(\\/|or|and)?\\s*end|terminal|terminator|rounded(\\s+box)?)(\\s+(symbol|shape|box))?\\s*$',
  process: '^\\s*(an?\\s+)?(process|rectangle)(\\s+(symbol|shape|box))?\\s*$',
  io: '^\\s*(an?\\s+)?(input\\s*(or|\\/|and)?\\s*output|output|input|sloping|parallelogram)(\\s+(symbol|shape|box))?\\s*$',
  decision: '^\\s*(an?\\s+)?(decision|diamond)(\\s+(symbol|shape|box))?\\s*$',
};
// A table readable from the back of the room: 17px text, roomy cells, text left-aligned.
const bigTable = (html) => html.replace('<table class="donow-table">', '<table class="donow-table" style="font-size:17px;width:100%">')
  .replace(/<t([hd])>/g, '<t$1 style="padding:7px 12px;text-align:left;font-size:17px">');
// Think, Pair, Share under each slide's heading (James, 2026-09-30: the lesson said what to do but never why;
// students should be asked why, not told, with plenty of think-pair-share). Each asks one short question:
// think alone, tell a partner, share with the class. The answer stays hidden until the teacher clicks it after
// the sharing. On the two teaching slides it is a prediction, and the worked answer is what the click reveals.
// Styled by .lesson-tps in the shell.
const TPS = {
  'do-now': ['Why does every symbol need a name?', 'So everyone reads a flowchart the same way. The exam uses these names too.'],
  'key-words': ['Why does each job have its own shape?', 'You can see what a box does before you read the words in it.'],
  'read-check': ['Why does a Say box not add any steps?', 'Say only shows a message. Only Move boxes move the sprite.'],
  'fix': ['Why do we check every box against what it should do?', 'A mistake is where the flowchart and the plan are different. Checking each box finds it.'],
  'loops-check': ['Why does "not pressed" move the sprite 0 steps?', 'The False arrow goes back to the decision. It never reaches the Move box.'],
  'practice': ['Why must box A be a decision?', 'It asks a question about the key. It needs a True arrow and a False arrow.'],
  'plenary': ['Why practise with new numbers every time?', 'If you can do it with any numbers, you really understand it.'],
};
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });

// A small drawing of one symbol, in the site colours, for the key words table.
function shape(kind) {
  const s = 'fill="var(--surface-2)" stroke-width="2"';
  const body = {
    terminal: `<rect x="4" y="6" width="92" height="32" rx="16" ${s} stroke="var(--muted)"/>`,
    process: `<rect x="4" y="6" width="92" height="32" rx="3" ${s} stroke="var(--brand)"/>`,
    io: `<polygon points="16,6 96,6 84,38 4,38" ${s} stroke="var(--brand)"/>`,
    decision: `<polygon points="50,2 96,22 50,42 4,22" fill="rgba(253,214,99,.12)" stroke="var(--warn)" stroke-width="2"/>`,
    arrow: `<line x1="10" y1="22" x2="80" y2="22" stroke="var(--brand)" stroke-width="3"/><polygon points="80,14 94,22 80,30" fill="var(--brand)"/>`,
  }[kind];
  return `<svg viewBox="0 0 100 44" width="120" height="53" role="img" aria-label="${kind} shape">${body}</svg>`;
}

// Two flowcharts side by side for the same idea, so pairs can compare them (James, 2026-09-30: several examples
// of the same thing, seen from different sides, then discussed). Every answer comes from running both charts.
function compare(id, label, lead, a, b, question, answer) {
  const pane = (name, f) => `<div><p style="margin:0 0 6px;font-weight:700;text-align:center">${name}</p>${chart(f, 330)}</div>`;
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2><p class="lesson-lead">${lead}</p>` +
    tps(question, answer) + columns(pane('Flowchart A', a), pane('Flowchart B', b)) };
}

const steps = [];

// ---------------------------------------------------------------- Do Now: name the symbols
{
  const f = numbered({ nodes: [
    { id: 's', type: 'terminal', text: 'Start' }, { id: 'm', type: 'process', text: 'Move 40 steps' },
    { id: 'd', type: 'decision', text: 'Up arrow pressed?' }, { id: 't', type: 'io', text: 'Say "Up"' },
    { id: 'e', type: 'terminal', text: 'End' }, { id: 'f', type: 'io', text: 'Say "Wait"' },
  ], edges: [
    { from: 's', to: 'm', label: null }, { from: 'm', to: 'd', label: null }, { from: 'd', to: 't', label: 'True' },
    { from: 'd', to: 'f', label: 'False' }, { from: 't', to: 'e', label: null }, { from: 'f', to: 'e', label: null },
  ] });
  steps.push(checkStep('do-now', 'Do Now: Name the Symbols', 'Do Now: Name the Symbols', 'From Lesson 1. Write the name of each symbol.', [
    { label: 'Box 1', answer: SYM.terminal, feedback: 'Box 1: look at its shape. Where does a flowchart begin and stop?' },
    { label: 'Box 2', answer: SYM.process, feedback: 'Box 2: it is an instruction, like Move. What is that symbol called?' },
    { label: 'Box 3', answer: SYM.decision, feedback: 'Box 3: it asks a question with a True and a False arrow.' },
    { label: 'Box 4', answer: SYM.io, feedback: 'Box 4: it shows a message. Which symbol shows messages?' },
  ], chart(f, 380)));
}

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Revision 1: Reading Flowcharts',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Computational Thinking</p><h2 class="lesson-h2">Revision 1: Reading Flowcharts</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> read a flowchart. Say what the sprite does.', '<strong>Think, pair, share:</strong> why do programmers draw a flowchart before they write code?', '<strong>Next lesson:</strong> Revision 2. <strong>Then:</strong> the exam.']) });

// ---------------------------------------------------------------- key words
{
  const row = (kind, name, job) => `<tr><td style="text-align:center;padding:6px 12px">${shape(kind)}</td><td style="padding:6px 12px;font-size:17px"><strong>${name}</strong></td><td style="padding:6px 12px;font-size:17px;text-align:left">${job}</td></tr>`;
  steps.push({ id: 'key-words', label: 'Key Words: The Symbols',
    content: '<h2 class="lesson-h2">Key Words: The Symbols</h2><p class="lesson-lead">Every shape has one job.</p>' +
      bigTable('<table class="donow-table"><thead><tr><th>Shape</th><th>Name</th><th>Job</th></tr></thead><tbody>' +
      row('terminal', 'Start/End', 'Where the flowchart starts and stops.') +
      row('process', 'Process', 'An instruction. Example: Move 10 steps.') +
      row('io', 'Input or output', 'A message. Example: Say "Hello".') +
      row('decision', 'Decision', 'A question. It has a True arrow and a False arrow.') +
      row('arrow', 'Arrow', 'Shows the order. Follow the arrows.') +
      '</tbody></table>') });
}

// ---------------------------------------------------------------- I do: read a flowchart
{
  const f = FC.line([['process', 'Move 20 steps'], ['io', 'Say "Hi"'], ['process', 'Move 30 steps'], ['io', 'Say "Bye"']]);
  const r = FC.run(f);
  assert(r.steps === 50 && r.said.join() === 'Hi,Bye', 'i-do');
  const table = '<table class="donow-table"><thead><tr><th>Box</th><th>What happens</th><th>Steps so far</th></tr></thead><tbody>' +
    '<tr><td>Start</td><td>Begin here.</td><td>0</td></tr>' +
    '<tr><td>Move 20 steps</td><td>The sprite moves.</td><td>20</td></tr>' +
    '<tr><td>Say "Hi"</td><td>The sprite says Hi.</td><td>20</td></tr>' +
    '<tr><td>Move 30 steps</td><td>The sprite moves.</td><td>50</td></tr>' +
    '<tr><td>Say "Bye"</td><td>The sprite says Bye.</td><td>50</td></tr>' +
    '<tr><td>End</td><td>Stop.</td><td><strong>50</strong></td></tr></tbody></table>';
  const bigger = bigTable(table);
  steps.push({ id: 'read', label: 'Read a Flowchart',
    content: '<h2 class="lesson-h2">Read a Flowchart</h2><p class="lesson-lead">Begin at Start. Follow the arrows. One box at a time. <strong>Altogether</strong> means all added up.</p>' +
      columns(chart(f, 400), tps('Predict: how many steps does the sprite move altogether? What does it say?',
        bigger + '<p>The sprite moves <strong>50 steps</strong> altogether. It says <strong>Hi</strong>, then <strong>Bye</strong>.</p>' +
        '<p><strong>Why one box at a time?</strong> The computer runs one box at a time, so we read it the same way.</p>', 'Show the worked answer')) });
}

// ---------------------------------------------------------------- we do: read one
{
  const f = FC.line([['io', 'Say "Ready"'], ['process', 'Move 10 steps'], ['process', 'Move 40 steps'], ['io', 'Say "Go"'], ['process', 'Move 20 steps']]);
  const r = FC.run(f);
  assert(r.steps === 70 && r.said[r.said.length - 1] === 'Go', 'we-do');
  steps.push(checkStep('read-check', 'Your Turn: Read It', 'Your Turn: Read It', 'Follow the arrows, one box at a time.', [
    { label: 'How many steps does the sprite move altogether?', answer: num(r.steps, 'steps?'), feedback: 'Find every Move box. Add their numbers together.' },
    { label: 'What does the sprite say first?', answer: word('ready'), feedback: 'Find the first Say box after Start.' },
    { label: 'What does the sprite say last?', answer: word('go'), feedback: 'Find the last Say box before End.' },
  ], chart(f, 360)));
}

{
  const A = FC.line([['process', 'Move 20 steps'], ['io', 'Say "Hi"'], ['process', 'Move 30 steps']]);
  const B = FC.line([['process', 'Move 30 steps'], ['process', 'Move 20 steps'], ['io', 'Say "Hi"']]);
  const ra = FC.run(A), rb = FC.run(B);
  assert(ra.steps === 50 && rb.steps === 50, 'compare read');
  steps.push(compare('compare-read', 'Compare: Same Boxes, New Order', 'Read both flowcharts. One box at a time.', A, B,
    'What is the same? What is different?',
    '<p><strong>Same:</strong> both move 50 steps altogether, and both say Hi.</p><p><strong>Different:</strong> A says Hi after 20 steps. B says Hi after 50 steps. The order of the boxes changes what happens.</p>'));
}

// ---------------------------------------------------------------- find and fix
{
  const f = numbered(FC.line([['process', 'Point in direction 180'], ['process', 'Move 60 steps'], ['io', 'Say "Here"']]));
  steps.push(checkStep('fix', 'Find the Wrong Box', 'Find the Wrong Box', 'It should: face <strong>right</strong>, move 60 steps, then say "Here".', [
    { label: 'Which box number is wrong?', answer: num(2), feedback: 'Check each box against what it should do. Which one does not match?' },
    { line: true, label: 'Write the correct box.', answer: '^\\s*point\\s+in\\s+direction\\s*:?\\s*90(\\s*degrees?)?\\s*$', feedback: 'Use the direction numbers under the flowchart. Keep the words Point in direction.' },
  ], chart(f, 380) + '<p style="margin-top:8px">Right is 90. Left is -90. Up is 0. Down is 180.</p>'));
}

{
  const A = numbered(FC.line([['process', 'Point in direction -90'], ['process', 'Move 40 steps'], ['io', 'Say "Hi"']]));
  const B = numbered(FC.line([['process', 'Point in direction 0'], ['process', 'Move 30 steps'], ['io', 'Say "Hi"']]));
  steps.push(compare('compare-fix', 'Compare: Two Wrong Flowcharts', 'Both should: face <strong>up</strong>, move 30 steps, then say "Hi".', A, B,
    'Which box is wrong in each flowchart? How do you know?',
    '<p><strong>A:</strong> box 2 is wrong. -90 faces left; up is 0. Box 3 is also wrong: it moves 40, not 30.</p><p><strong>B:</strong> every box matches. B is correct.</p><p>Check <strong>every</strong> box: a flowchart can have more than one mistake, or none.</p>'));
}

// ---------------------------------------------------------------- key-press loops
{
  const f = keyLoop('Right arrow', 90, 10);
  const r = FC.run(f, { presses: [1, 0, 1] });
  assert(r.steps === 20, 'loop i-do');
  steps.push({ id: 'loops', label: 'Key-Press Loops',
    content: '<h2 class="lesson-h2">Key-Press Loops</h2><p class="lesson-lead">A key press is an <strong>input</strong>. The decision checks it.</p>' +
      columns(chart(f, 400), facts([
        '<strong>Pressed:</strong> follow the <strong>True</strong> arrow. Point, then Move.',
        '<strong>Not pressed:</strong> follow the <strong>False</strong> arrow. No move.',
        'Right 90. Left -90. Up 0. Down 180.',
      ]) + tps('Predict: the key is pressed, not pressed, pressed. How many steps? Why do both arrows go back to the decision?',
        '<p>Pressed, not pressed, pressed: 10 + 0 + 10 = <strong>20 steps</strong>.</p>' +
        '<p>Both arrows go back so the program <strong>checks the key again</strong>. The player can press it at any time.</p>', 'Show the worked answer')) });
}
{
  const f = numbered(keyLoop('Up arrow', 0, 5));
  const r = FC.run(f, { presses: [1, 1, 0, 1, 0] });
  assert(r.steps === 15, 'loop check ' + r.steps);
  steps.push(checkStep('loops-check', 'Your Turn: Key-Press Loops', 'Your Turn: Key-Press Loops', 'The up arrow is checked 5 times: pressed, pressed, not pressed, pressed, not pressed.', [
    { label: 'How many steps does the sprite move?', answer: num(r.steps, 'steps?'), feedback: 'Count the presses. Each press runs the Move box once.' },
    { label: 'The key is not pressed. Which box number comes next?', answer: num(2), feedback: 'Not pressed follows the False arrow. Follow it to a box.' },
    { label: 'Box 3 says Point in direction 0. Which way does the sprite face?', answer: '^\\s*(it\\s+(faces|points)\\s+)?up(wards?)?\\s*$', feedback: 'Look at the direction numbers on the last slide. Which one is 0?' },
  ], chart(f, 400)));
}

{
  const A = keyLoop('Right arrow', 90, 10), B = keyLoop('Left arrow', -90, 10);
  const ra = FC.run(A, { presses: [1, 1, 0] }), rb = FC.run(B, { presses: [1, 1, 0] });
  assert(ra.steps === 20 && rb.steps === 20 && rb.direction === -90, 'compare loops');
  steps.push(compare('compare-loops', 'Compare: Two Key-Press Loops', 'Each key is pressed, pressed, not pressed.', A, B,
    'What is the same? What is different? Where does each sprite end up?',
    '<p><strong>Same:</strong> the same shape: decision, Point, Move, and both arrows go back. Both move 20 steps.</p><p><strong>Different:</strong> the key and the direction. A moves 20 steps right. B moves 20 steps left.</p>'));
}

// ---------------------------------------------------------------- practice: fill in the flowchart
{
  const model = keyLoop('Left arrow', -90, 20);
  assert(FC.run(model, { presses: [1] }).steps === 20 && FC.run(model, { presses: [1] }).direction === -90, 'practice model');
  steps.push(checkStep('practice', 'Practice: Fill In the Flowchart', 'Practice: Fill In the Flowchart', 'It should move the sprite <strong>left 20 steps</strong> each time the left arrow is pressed.', [
    { line: true, label: 'What should box A say?', answer: '^\\s*(is\\s+(the\\s+)?)?left(\\s+arrow)?(\\s+key)?\\s+pressed\\s*\\??\\s*$', feedback: 'A is the decision. It asks a question about the left arrow.' },
    { label: 'What number is B?', answer: num(-90, 'degrees?'), feedback: 'B is the direction. Left is the opposite way to right.' },
    { label: 'What number is C?', answer: num(20, 'steps?'), feedback: 'Read what it should do: how many steps?' },
    { line: true, label: 'Why does the arrow from the Move box go back to box A?', answer: '^(?=.*\\b(check|checks|checked|checking|again|repeat|repeats|keep|keeps|loop|loops)\\b)(?=.*\\b(key|keys|arrow|press|pressed|decision)\\b).*$', feedback: 'What happens if the player presses the key again? The flowchart must look at the key again.' },
  ], chart((() => { const f = keyLoop('A', 'B', 'C'); f.nodes[1].text = 'A'; return f; })(), 380)));
}

// ---------------------------------------------------------------- drill
steps.push(embed('plenary', 'Plenary: Revision 1 Drill', 'drill-y7-revision-1', 'Plenary: Revision 1 Drill',
  'Symbols, reading, fixing and key-press loops. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
const lesson = { id: ID, label: 'Revision 1: Reading Flowcharts', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 7, in a Term 1 Exam Revision unit after the flowcharts unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y7 = all.years.find((y) => y.id === 'year7');
let unit = y7.units.find((u) => u.title === 'Term 1 Exam Revision');
if (!unit) { unit = { code: '', title: 'Term 1 Exam Revision', lessons: [] }; y7.units.push(unit); }
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
