// Builds LessonData/y8-3-1-models.json: Year 8, 3.1 Models and Simulators (8MD.01: identify key features of models
// such as simulators; explain the role of data in making a model represent a real-life system), its four drills
// (Drills/data/y8-3-1-ext.js, y8-3-1-parts.js, y8-3-1-data.js, y8-3-1-models.js), and registers the lesson in a new
// Year 8 unit "Data Models and Collection" after the existing Year 8 units.
//   node tools/build_y8_3_1.mjs
// EAL-light and Term 1b "why" shape: one idea per slide, a teacher-only Think, Pair, Share under every heading,
// predict-then-explain teaching slides, compare slides. Year 8 has no exam board papers, so nothing carries a
// citation. Do Now programs and Extension programs run through shared/pseudocode-engine.js; model answers are
// worked out by the small rules below.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { runPseudocode } = require(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const ID = 'y8-3-1-models';
const P = 'y831';
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const escH = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const codeLine = (l) => escH(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length));
const code = (lines) => '<div class="lesson-code">' + lines.map((l, i) => `<div class="lesson-code-line">${i + 1}&nbsp;&nbsp;${codeLine(l)}</div>`).join('') + '</div>';
const codeWT = (lines, hl = []) => '<div class="lesson-code">' + lines.map((l, i) =>
  `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">${i + 1}&nbsp;&nbsp;${codeLine(l)}</div>`).join('') + '</div>';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const caption = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const cell = 'padding:6px 12px;text-align:center;font:700 17px var(--font-mono, monospace)';
function arrayTable(name, values, hlIdx = []) {
  return `<p style="margin:0 0 6px"><strong>${name}</strong></p><table class="donow-table" style="margin:0 0 8px">` +
    `<tr><th style="${cell};text-align:left">Index</th>${values.map((v, i) => `<td style="${cell};color:var(--muted)">${i + 1}</td>`).join('')}</tr>` +
    `<tr><th style="${cell};text-align:left">Value</th>${values.map((v, i) => `<td style="${cell}"${hlIdx.includes(i + 1) ? ' class="wt-hl"' : ''}>${v}</td>`).join('')}</tr></table>`;
}
const tcell = 'padding:7px 12px;text-align:left;font-size:17px';
const table = (head, rows) => '<table class="donow-table" style="width:100%">' +
  '<tr>' + head.map((h) => `<th style="${tcell}">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="${tcell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';
// A model drawn as three boxes: what goes in, the rule, what comes out.
const flowBox = 'flex:1;border:2px solid var(--brand);border-radius:10px;padding:8px 10px;background:var(--surface-2);font-size:16px;line-height:1.35';
function ipo(inp, rule, out) {
  const box = (t, b) => `<div style="${flowBox}"><div style="font-weight:700;color:var(--brand);margin-bottom:4px">${t}</div>${b}</div>`;
  const arrow = '<div style="align-self:center;font-size:24px;color:var(--brand)">&rarr;</div>';
  return `<div style="display:flex;gap:8px;align-items:stretch;margin:6px 0 10px">${box('Inputs (data)', inp)}${arrow}${box('Rules', rule)}${arrow}${box('Outputs', out)}</div>`;
}
const box = (t) => `<div style="${flowBox}">${t}</div>`;

function run(lines, inputs = [], setup = []) {
  const r = runPseudocode(setup.concat(lines).join('\n'), {}, 5000, inputs.map(String));
  if (r.error) throw new Error(`Program failed: ${r.error.message}\n${lines.join('\n')}`);
  return r.outputs.map(String);
}
const fill = (name, type, values) => [`DECLARE ${name} : ARRAY[1:${values.length}] OF ${type}`]
  .concat(values.map((v, i) => `${name}[${i + 1}] <- ${type === 'STRING' ? '"' + v + '"' : v}`));

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
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
function selfMarked(id, label, heading, lead, items) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>${lead}<div id="${P}-${id}"></div>`, items };
}
const num = (n, unit = '') => `^\\s*${n}\\s*${unit ? `(${unit})?` : ''}\\s*$`;
const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
const MODEL = '^\\s*(yes,?\\s*)?(it\\s+is\\s+)?(an?\\s+)?(computer\\s+)?model\\s*[.!]?\\s*$';
const MODEL_OR_SIM = '^\\s*(yes,?\\s*)?(it\\s+is\\s+)?(an?\\s+)?((computer\\s+)?model|(flight\\s+)?simulator|model\\s*(,|and|or|\\/)\\s*(a\\s+)?simulator)\\s*[.!]?\\s*$';
const NOT_MODEL = '^\\s*(no,?\\s*)?((it\\s+is\\s+)?not(\\s+an?)?(\\s+model)?|no)\\s*[.!]?\\s*$';
const ROLE = {
  input: '^\\s*(it\\s+is\\s+)?(an?\\s+)?inputs?(\\s+data)?\\s*[.!]?\\s*$',
  rule: '^\\s*(it\\s+is\\s+)?(an?\\s+)?(rules?|calculations?)\\s*[.!]?\\s*$',
  output: '^\\s*(it\\s+is\\s+)?(an?\\s+)?(outputs?|predictions?|results?)\\s*[.!]?\\s*$',
};

// Think, Pair, Share under each heading: one short why question, answer hidden until the teacher clicks.
// On a check slide it never gives or presupposes an answer on that slide (tools/tps-leak-check.mjs in the shell).
const TPS = {
  'do-now': ['Why is only one word output each time?', 'IF chooses one path. TRUE runs the THEN line. FALSE runs the ELSE line.'],
  'do-now-2': ['Why does a linear search start at index 1?', 'It checks the items in order, one at a time, so it cannot miss one.'],
  'title': ['How does a weather forecast know about tomorrow before it happens?', 'A computer works it out from data about today. Today we see how.'],
  'model-check': ['Why might two people disagree about one of these? What question settles it?', 'Use the meaning: is it a computer version of a real system that works things out? Check each one against that.'],
  'features-check': ['Why does the job of a part decide what it is called?', 'The same number can go in to one system and come out of another. Ask what it does here.'],
  'activity-1': ['Why name the parts before you trust a prediction?', 'If you know what goes in and how it is worked out, you can check where a wrong answer came from.'],
  'why-check': ['What makes an explanation worth 2 marks?', 'Two different reasons. Each one says what it means for the pilot, joined with because or so.'],
  'data-check': ['Why does a computer never notice that its data is wrong?', 'It only follows its steps. It cannot look at the real world to check.'],
  'activity-2': ['Why change only one input at a time?', 'Then you know which change made the output different.'],
  'practice': ['Why check a prediction against the real thing later?', 'If they are different, the data or the steps need fixing.'],
  'plenary': ['Why practise with new numbers every time?', 'If you can do it with any numbers, you really understand it.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (Term 1a selection): >= with the value on the line
const DN1 = ['DECLARE Temp : INTEGER', 'INPUT Temp', 'IF Temp >= 25 THEN', '  OUTPUT "Hot"', 'ELSE', '  OUTPUT "Cool"', 'ENDIF'];
assert(run(DN1, [25])[0] === 'Hot' && run(DN1, [18])[0] === 'Cool', 'do-now 1');
const WSEL = ['DECLARE Speed : INTEGER', 'INPUT Speed', 'IF Speed >= 40 THEN', '  OUTPUT "Fast"', 'ELSE', '  OUTPUT "Slow"', 'ENDIF'];
assert(run(WSEL, [40])[0] === 'Fast' && run(WSEL, [32])[0] === 'Slow', 'walkthrough 1');
const WT_SEL = { title: 'Walk me through it: selection', steps: [
  { text: 'This is a different program with the same kind of question. Do the same steps with your program.', visual: codeWT(WSEL) },
  { text: 'Line 2: the user types <strong>40</strong>. INPUT puts 40 in Speed.', visual: codeWT(WSEL, [2]) + note('Speed = 40') },
  { text: 'Line 3 asks: is Speed &gt;= 40? <strong>&gt;=</strong> means more than <strong>or equal to</strong>.', visual: codeWT(WSEL, [3]) },
  { text: 'Is 40 more than or equal to 40? It is equal, so <strong>yes</strong>. The question is TRUE.', visual: codeWT(WSEL, [3]) + note('40 &gt;= 40 is TRUE') },
  { text: 'TRUE: run the line after <strong>THEN</strong>. The output is Fast.', visual: codeWT(WSEL, [4]) + note('Output: Fast') },
  { text: 'Now the user types <strong>32</strong>. Is 32 more than or equal to 40? <strong>No.</strong> FALSE.', visual: codeWT(WSEL, [3]) + note('32 &gt;= 40 is FALSE') },
  { text: 'FALSE: skip the THEN line. Run the line after <strong>ELSE</strong>. The output is Slow. Now do your question.', visual: codeWT(WSEL, [6]) + note('Output: Slow') },
] };
steps.push(checkStep('do-now', 'Do Now: Selection (1 of 2)', 'Do Now: Selection (1 of 2)', 'From Term 1a: selection.', [
  { label: 'The user types 25. What is output?', answer: word('hot'), feedback: 'Read the symbol on line 3. Is 25 more than or equal to 25?' },
  { label: 'The user types 18. What is output?', answer: word('cool'), feedback: 'Is the question on line 3 TRUE or FALSE for 18? FALSE runs the ELSE line.' },
], code(DN1)));
steps[steps.length - 1].walkthrough = WT_SEL;

// ---------------------------------------------------------------- Do Now 2 (Term 1a arrays and linear search)
const NAMES = ['Tom', 'Ana', 'Mia', 'Leo', 'Sam'];
assert(run(['OUTPUT Names[2]'], [], fill('Names', 'STRING', NAMES))[0] === 'Ana' && NAMES.indexOf('Leo') + 1 === 4, 'do-now 2');
const PETS = ['Cat', 'Dog', 'Fish', 'Bird', 'Frog', 'Duck'];
assert(run(['OUTPUT Pets[3]'], [], fill('Pets', 'STRING', PETS))[0] === 'Fish' && PETS.indexOf('Frog') + 1 === 5, 'walkthrough 2');
const WT_ARR = { title: 'Walk me through it: arrays and searching', steps: [
  { text: 'This is a different array with the same two questions. Do the same steps with your array.', visual: arrayTable('Pets', PETS) },
  { text: 'Pets[3]: the 3 in [ ] is the <strong>index</strong>. Find 3 in the Index row.', visual: arrayTable('Pets', PETS) + note('Look for index 3') },
  { text: 'Read the value under index 3: <strong>Fish</strong>. So Pets[3] is Fish.', visual: arrayTable('Pets', PETS, [3]) + note('Pets[3] = Fish') },
  { text: 'A linear search for "Frog" starts at index 1. Check 1: Cat. Not Frog.', visual: arrayTable('Pets', PETS, [1]) + note('Checked: 1 item') },
  { text: 'Then Dog, then Fish, then Bird. None of them is Frog.', visual: arrayTable('Pets', PETS, [2, 3, 4]) + note('Checked so far: Cat, Dog, Fish, Bird') },
  { text: 'Check 5: <strong>Frog</strong>. Found it, so the search stops.', visual: arrayTable('Pets', PETS, [5]) + note('Checked: 5 items') },
  { text: 'It checked 5 items: the found item counts too. Now do the same with your array.', visual: arrayTable('Pets', PETS) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Arrays (2 of 2)', 'Do Now: Arrays (2 of 2)', 'From Term 1a: arrays and linear search.', [
  { label: 'What does OUTPUT Names[2] output?', answer: word('ana'), feedback: 'Find index 2 in the top row. Read the value under it.' },
  { label: 'A linear search for "Leo" starts at index 1. How many items does it check?', answer: num(4, '\\s*(items?|checks?|times?)'), feedback: 'Check one item at a time from index 1. Count them, and count the one you find too.' },
], arrayTable('Names', NAMES)));
steps[steps.length - 1].walkthrough = WT_ARR;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-3-1-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on selection, loops, arrays and searching. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '3.1: Models and Simulators',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Data Models and Collection</p><h2 class="lesson-h2">3.1: Models and Simulators</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> what a model is, and its parts.', '<strong>The big question:</strong> why does a model need good data?']) });

// ---------------------------------------------------------------- what is a model
steps.push({ id: 'what-is-model', label: 'What Is a Model?',
  content: '<h2 class="lesson-h2">What Is a Model?</h2>' +
    tps('Predict: why would a company test a new car on a computer before it builds one?',
      '<p>Building a real car to test is slow and costs a lot. A computer version can be tried first.</p><p><strong>Why?</strong> The computer version acts like the real car, so it shows problems early.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A <strong>model</strong> is a simple computer version of a real system. It works things out, so it can <strong>predict</strong> what will happen.</p>' +
    columns(facts([
      'A weather forecast predicts tomorrow\'s rain.',
      'A traffic model shows how long the queue gets.',
      'A rabbit model predicts how many rabbits there will be.',
    ]), facts([
      'A <strong>simulator</strong> is a model you use like the real thing.',
      'A <strong>flight simulator</strong>: a pilot flies, and the screen acts like a real plane.',
      'A model is <strong>simpler</strong> than the real system.',
    ])) });

steps.push(checkStep('model-check', 'Your Turn: Model or Not?', 'Your Turn: Model or Not?', 'Type <strong>model</strong> or <strong>not a model</strong> for each one.', [
  { line: true, label: 'A computer program that predicts tomorrow\'s rain.', answer: MODEL, feedback: 'Is it a computer version of a real system? Does it work something out?' },
  { line: true, label: 'A photo of a storm.', answer: NOT_MODEL, feedback: 'Can it work out what happens next, or does it only show one moment?' },
  { line: true, label: 'A list of the names in your class.', answer: NOT_MODEL, feedback: 'Does it work anything out or predict anything?' },
  { line: true, label: 'A program that trains pilots to land a plane.', answer: MODEL_OR_SIM, feedback: 'Does it act like a real system and work out what happens?' },
]));

// ---------------------------------------------------------------- key features
const rabbits = (start, years) => start * 2 ** years;
assert(rabbits(20, 3) === 160, 'rabbits');
steps.push({ id: 'key-features', label: 'The Parts of a Model',
  content: '<h2 class="lesson-h2">The Parts of a Model</h2>' +
    tps('Predict: how many rabbits after 3 years? Why do we need the rule to work it out?',
      '<p>20, then 40, then 80, then <strong>160</strong>.</p><p><strong>Why?</strong> The input alone is only the start. The rule says how it changes each year.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A rabbit model.</p>' +
    ipo('20 rabbits at the start', 'Each year, the number of rabbits doubles.', 'Rabbits after 3 years') +
    facts([
      '<strong>Inputs:</strong> the data that goes in.',
      '<strong>Rules:</strong> the calculations that work out the answer.',
      '<strong>Outputs:</strong> the predictions that come out.',
      '<strong>Simplified:</strong> it leaves out things like foxes and weather.',
    ]) });

const queue = (arrive, go, minutes) => { let w = 0; for (let m = 0; m < minutes; m++) w = w + arrive - go; return w; };
assert(queue(6, 4, 3) === 6, 'queue');
steps.push(checkStep('features-check', 'Your Turn: Name the Parts', 'Your Turn: Name the Parts', 'A traffic light model. Type <strong>input</strong>, <strong>rule</strong> or <strong>output</strong> for (a) to (c).', [
  { line: true, label: '6 cars arrive each minute.', answer: ROLE.input, feedback: 'Is it data that goes in, a calculation, or what comes out?' },
  { line: true, label: 'Each minute: waiting = waiting + arriving - going.', answer: ROLE.rule, feedback: 'Does it say how to work something out?' },
  { line: true, label: 'The number of cars waiting after 3 minutes.', answer: ROLE.output, feedback: 'Is it given at the start, or worked out at the end?' },
  { label: 'How many cars are waiting after 3 minutes?', answer: num(6, '\\s*cars?'), feedback: 'Start at 0. Each minute, add the cars that arrive. Take away the cars that go.' },
], box('<strong>Traffic light model</strong><br>0 cars are waiting at the start.<br>6 cars arrive each minute.<br>The green light lets 4 cars go each minute.')));

steps.push(embed('activity-1', 'Activity 1: Parts of a Model', 'drill-y8-3-1-parts', 'Activity 1: Parts of a Model',
  'Is it a model? Which part is the input, the rule, the output? Your progress is saved.'));

// ---------------------------------------------------------------- why use a model
steps.push({ id: 'why-models', label: 'Why Use a Model?',
  content: '<h2 class="lesson-h2">Why Use a Model?</h2>' +
    tps('Predict: a new pilot must practise an engine failure. Why not practise in a real plane?',
      '<p>A mistake in a real plane could kill people and wreck the plane.</p><p><strong>Why?</strong> In a simulator, a crash hurts no one and costs nothing. The pilot can try again.</p>', 'Show the worked answer') +
    table(['Reason', 'Example'], [
      ['<strong>Safer</strong>', 'A pilot can crash a simulator. Nobody is hurt.'],
      ['<strong>Cheaper</strong>', 'No real bridge is built and broken.'],
      ['<strong>Faster</strong>', '100 years of rabbits in one second.'],
      ['<strong>"What if?"</strong>', 'Change one input and run it again.'],
    ]) });

steps.push({ id: 'compare-test', label: 'Compare: Real Test or Model?',
  content: '<h2 class="lesson-h2">Compare: Real Test or Model?</h2>' +
    tps('You must test 50 bridge designs. Which way would you choose? Why?',
      '<p>The model. 50 real bridges would cost a fortune and take years.</p><p><strong>Why?</strong> In the model you change the design and run it again in seconds, and nothing real breaks.</p>') +
    '<p class="lesson-lead">Testing a new bridge: how much weight can it hold?</p>' +
    table(['', 'Real test', 'Model'], [
      ['Cost', 'Build a real bridge', 'A computer'],
      ['Danger', 'It can fall on people', 'Nobody is hurt'],
      ['Time', 'Months', 'Seconds'],
      ['Try again?', 'Build it again', 'Change an input, run again'],
    ]) });

steps.push(selfMarked('why-check', 'Explain: Why a Flight Simulator?', 'Explain: Why a Flight Simulator?',
  '<p class="lesson-lead">New pilots learn to land in a flight simulator first.</p>', [
    { id: 'why-sim', prompt: 'Explain why pilots train in a flight simulator. [2]', marks: 2,
      modelAnswer: 'It is safer, because a crash in a simulator hurts no one (1). It is cheaper, because no real plane is damaged (1).' },
  ]));

// ---------------------------------------------------------------- data
assert(rabbits(200, 3) === 1600, 'rabbits typo');
steps.push({ id: 'data-matters', label: 'Why the Data Matters',
  content: '<h2 class="lesson-h2">Why the Data Matters</h2>' +
    tps('Someone types 200 instead of 20. Predict the output. Why is the rule not to blame?',
      '<p>200, 400, 800, <strong>1600</strong> rabbits. The real island has about 160.</p><p><strong>Why?</strong> The rule is right. The input was wrong, so the output is wrong too.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">The data makes a model match the real system.</p>' +
    ipo('20 rabbits (counted)', 'Doubles each year', '160 after 3 years') +
    facts([
      'Wrong data in gives a wrong prediction out.',
      'We call this <strong>garbage in, garbage out</strong>.',
      'Good data is <strong>correct</strong>, <strong>up to date</strong> and <strong>complete</strong>.',
    ]) });

const savings = (start, add, weeks) => start + add * weeks;
assert(savings(100, 10, 4) === 140 && savings(0, 10, 4) === 40, 'compare-data');
steps.push({ id: 'compare-data', label: 'Compare: Good Data, Missing Data',
  content: '<h2 class="lesson-h2">Compare: Good Data, Missing Data</h2>' +
    tps('Both use the same rule. Predict each output. Why does only one match the real account?',
      '<p>A: 100 + 4 x 10 = <strong>140</strong>. B: 0 + 4 x 10 = <strong>40</strong>.</p><p><strong>Why?</strong> B is missing the start amount, so it begins at 0. The rule cannot fix missing data.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A savings model. Rule: each week, add 10. Real account after 4 weeks: 140.</p>' +
    columns(caption('Model A: start data 100') + ipo('Start: 100', 'Add 10 a week', 'After 4 weeks: ?'),
      caption('Model B: start data missing') + ipo('Start: (missing)', 'Add 10 a week', 'After 4 weeks: ?')) });

assert(savings(50, 15, 3) === 95 && savings(5, 15, 3) === 50, 'data-check');
steps.push(checkStep('data-check', 'Your Turn: Change the Data', 'Your Turn: Change the Data', 'A savings model. Rule: each week, add 15.', [
  { label: 'The start is 50. What does it predict after 3 weeks?', answer: num(95), feedback: 'Start with the start amount. Add 15 for each week.' },
  { label: 'Someone types the start as 5 by mistake. What does it predict after 3 weeks?', answer: num(50), feedback: 'Use the typed start, not the real one. Then add 15 for each week.' },
  { line: true, label: 'Wrong data in, wrong prediction out. What do we call this?', answer: 'garbage\\s+in,?\\s*(and\\s+)?garbage\\s+out', feedback: 'It has four words. Look back at the slide on why the data matters.' },
]));

steps.push(embed('activity-2', 'Activity 2: Change the Data', 'drill-y8-3-1-data', 'Activity 2: Change the Data',
  'Run each model in your head. Then change the data and predict again. Your progress is saved.'));

// ---------------------------------------------------------------- practice
const fish = (start, add, years) => start + add * years;
assert(fish(30, 12, 2) === 54, 'practice');
steps.push(checkStep('practice', 'Practice: A Fish Pond Model', 'Practice: A Fish Pond Model', 'Use the model for (a) to (c).', [
  { label: 'What does it predict after 2 years?', answer: num(54, '\\s*fish'), feedback: 'Start with the fish at the start. Add 12 for each year.' },
  { line: true, label: '"30 fish at the start". Input, rule or output?', answer: ROLE.input, feedback: 'Is it given at the start, or worked out?' },
  { line: true, label: 'Birds eat fish, but the model leaves them out. Will the real pond have more or fewer fish than it predicts?', answer: '^\\s*(it\\s+will\\s+have\\s+)?(fewer|less)(\\s+fish)?\\s*[.!]?\\s*$', feedback: 'What do the birds do to the number of fish?' },
], box('<strong>Fish pond model</strong><br>Input: 30 fish at the start.<br>Rule: each year, add 12 fish.<br>Output: fish after some years.')));

steps.push(embed('plenary', 'Plenary: Models and Simulators', 'drill-y8-3-1-models', 'Plenary: Models and Simulators',
  'Models, their parts, why we use them, and why the data matters. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '');
  t.content += tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, 'Hot') && V('do-now', 0, '"hot"') && !V('do-now', 0, 'Cool') && V('do-now', 1, 'cool') && !V('do-now', 1, 'Hot'), 'do-now marks');
assert(V('do-now-2', 0, 'Ana') && !V('do-now-2', 0, 'Tom') && V('do-now-2', 1, '4') && V('do-now-2', 1, '4 items') && !V('do-now-2', 1, '3') && !V('do-now-2', 1, '5'), 'do-now-2 marks');
assert(V('model-check', 0, 'model') && V('model-check', 0, 'It is a model') && !V('model-check', 0, 'not a model') && V('model-check', 1, 'not a model') && V('model-check', 1, 'Not') && !V('model-check', 1, 'model') && V('model-check', 2, 'no') && V('model-check', 3, 'a model') && V('model-check', 3, 'simulator') && V('model-check', 3, 'a flight simulator') && !V('model-check', 3, 'not a model'), 'model-check marks');
assert(V('features-check', 0, 'input') && V('features-check', 0, 'an input') && !V('features-check', 0, 'output') && !V('features-check', 0, 'rule') && V('features-check', 1, 'rule') && V('features-check', 1, 'a calculation') && !V('features-check', 1, 'input') && V('features-check', 2, 'output') && V('features-check', 2, 'prediction') && !V('features-check', 2, 'input') && V('features-check', 3, '6') && V('features-check', 3, '6 cars') && !V('features-check', 3, '18'), 'features-check marks');
assert(V('data-check', 0, '95') && !V('data-check', 0, '50') && V('data-check', 1, '50') && !V('data-check', 1, '95') && V('data-check', 2, 'garbage in, garbage out') && V('data-check', 2, 'Garbage in garbage out') && !V('data-check', 2, 'garbage'), 'data-check marks');
assert(V('practice', 0, '54') && V('practice', 0, '54 fish') && !V('practice', 0, '42') && V('practice', 1, 'input') && !V('practice', 1, 'output') && V('practice', 2, 'fewer') && V('practice', 2, 'less') && !V('practice', 2, 'more'), 'practice marks');
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) {
    const runW = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
    assert(!rx.test(runW), `feedback leaks the answer: ${k}${p.suffix} "${runW}"`);
  }
}
const plain = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };
for (const s of steps.filter((x) => x.validatorKey)) {
  const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, 'i'));
  const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
  // The array tables' Index rows are the slide's own table, so the check reads the text and notes.
  if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual.replace(/<table[\s\S]*?<\/table>/g, ' '))));
  for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
}
{
  const a = plain(WT_SEL.steps.map((x) => x.text + ' ' + x.visual).join(' ')).toLowerCase();
  assert(!/\bhot\b|\bcool\b|\b25\b|\b18\b|temp/.test(a), 'selection walkthrough leaks an answer');
  const b = plain(WT_ARR.steps.map((x) => x.text).join(' ')).toLowerCase();
  assert(!/\bana\b|\bleo\b|\b4 items|checked: 4/.test(b), 'array walkthrough leaks an answer');
  assert(!/Ana|Leo|Tom|Mia/.test(JSON.stringify(WT_ARR)), 'array walkthrough reuses the Do Now array');
}
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
const TEACH = [[/\bmodels?\b/i, 'what-is-model'], [/\bsimulat\w*/i, 'what-is-model'], [/\brules?\b/i, 'key-features'], [/\bsimplif\w*/i, 'key-features'], [/garbage/i, 'data-matters']];
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    TEACH.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
{
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478|0860/.test(all), 'citation found');
  assert(!/mario|party/i.test(all), 'game mention');
}

const lesson = { id: ID, label: '3.1: Models and Simulators', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drills
// Helpers shared by the drills, written out as source into each data file (the drill runs them).
function prelude() {
  function pick(l) { return l[Math.floor(Math.random() * l.length)]; }
  function range(a, b, s) { s = s || 1; return a + s * Math.floor(Math.random() * (Math.floor((b - a) / s) + 1)); }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numRe(n, unit) { return new RegExp("^\\s*" + n + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*$", "i"); }
  function wordRe(w) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + esc(w).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"); }
  function others(ans, list) {
    var out = [];
    list.concat([ans + 10, ans + 1, ans * 2, ans + 5, ans + 3]).forEach(function (v) { if (v !== ans && v > 0 && out.indexOf(String(v)) < 0 && out.length < 3) out.push(String(v)); });
    return out;
  }
  // `example` is another draw of the same kind, with a different answer that appears nowhere in it, worked through.
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      for (var i = 0; i < 120 && !ex; i++) {
        var e = gen();
        var text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
        var copied = c.prompt.split("\n").filter(function (l) { return l.trim().length > 12 && e.prompt.toLowerCase().indexOf(l.trim().toLowerCase()) >= 0; }).length;
        if (copied < 2 && String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) ex = e;
      }
      var example = ex ? "A similar question:\n" + ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer : null;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong, example: example, working: c.working, note: c.note };
    } };
  }
  // An explain card: the answer is always the same kind of idea, so it has nudges and no worked example.
  function explain(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: [c.answer], keywords: [c.re], distractors: c.wrong, working: c.working, note: c.note };
    } };
  }
}

function termOnePrelude() {
  function run(lines, inputs, setup) {
    var r = PseudocodeEngine.runPseudocode((setup || []).concat(lines).join("\n"), {}, 5000, (inputs || []).map(String));
    if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
    return r.outputs.map(String);
  }
  function fill(name, type, values) {
    return ["DECLARE " + name + " : ARRAY[1:" + values.length + "] OF " + type].concat(values.map(function (v, i) { return name + "[" + (i + 1) + "] <- " + (type === "STRING" ? "\"" + v + "\"" : v); }));
  }
  function distinct(n, from, to) { var out = []; while (out.length < n) { var v = range(from, to); if (out.indexOf(v) < 0) out.push(v); } return out; }
  var PAIRS = [["Hot", "Cold"], ["Pass", "Fail"], ["Win", "Lose"], ["Fast", "Slow"], ["Big", "Small"], ["Open", "Shut"], ["High", "Low"], ["Go", "Stop"]];
  var VARS = ["Score", "Speed", "Mark", "Age", "Coins", "Points"];
  var ITEMS = ["Cat", "Dog", "Fish", "Bird", "Frog", "Duck", "Goat", "Lion", "Bear", "Wolf", "Deer", "Seal"];
  var OPWORD = { ">": "more than", ">=": "more than or equal to", "<": "less than" };

  function selGen(op, onLine) { return function () {
    var name = pick(VARS), k = range(20, 60, 5), w = pick(PAIRS);
    var v = onLine ? pick([k, k, k + range(1, 6), k - range(1, 6)]) : pick([k + range(1, 9), k - range(1, 9)]);
    var lines = ["DECLARE " + name + " : INTEGER", "INPUT " + name, "IF " + name + " " + op + " " + k + " THEN", "  OUTPUT \"" + w[0] + "\"", "ELSE", "  OUTPUT \"" + w[1] + "\"", "ENDIF"];
    var ans = run(lines, [v])[0], t = ans === w[0];
    return { prompt: "The user types " + v + ". What is output?\n" + lines.join("\n"), answer: ans, re: wordRe(ans),
      wrong: [t ? w[1] : w[0], name, "TRUE"],
      steps: ["INPUT puts " + v + " in " + name + ".", op + " means " + OPWORD[op] + ". Is " + v + " " + OPWORD[op] + " " + k + "? " + (t ? "Yes, so it is TRUE." : "No, so it is FALSE."), t ? "TRUE runs the line after THEN." : "FALSE runs the line after ELSE."],
      working: ["Put the number into the IF line. Read the symbol carefully.", "TRUE runs the THEN line. FALSE runs the ELSE line."],
      note: v + " " + op + " " + k + " is " + (t ? "TRUE" : "FALSE") + ", so the output is " + ans + "." };
  }; }
  function loopTotalGen() {
    var n = range(3, 6), a = range(2, 9), s = pick([0, 0, range(1, 10)]), T = pick(["Total", "Sum", "Amount"]), C = pick(["Count", "Turn", "Go"]);
    var lines = ["DECLARE " + T + " : INTEGER", "DECLARE " + C + " : INTEGER", T + " <- " + s, "FOR " + C + " <- 1 TO " + n, "  " + T + " <- " + T + " + " + a, "NEXT " + C, "OUTPUT " + T];
    var ans = Number(run(lines)[0]);
    return { prompt: "What is output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [a * (n - 1) + s, a * n, s + a, ans - a]),
      steps: [T + " starts at " + s + ".", C + " goes from 1 to " + n + ", so line 5 runs " + n + " times.", "Each time, add " + a + ": " + s + " + " + n + " x " + a + " = " + ans + "."],
      working: ["How many times does the loop run? Count from the start value to the end value.", "Start at the first value of the total. Add the same number each time."],
      note: s + " + " + n + " x " + a + " = " + ans + "." };
  }
  function loopTimesGen() {
    var s = range(1, 4), e = s + range(2, 6), C = pick(["Count", "Num", "Step", "Day", "Lap"]);
    var lines = ["DECLARE " + C + " : INTEGER", "FOR " + C + " <- " + s + " TO " + e, "  OUTPUT " + C, "NEXT " + C];
    var ans = run(lines).length;
    return { prompt: "How many numbers are output?\n" + lines.join("\n"), answer: ans, re: numRe(ans, "\\s*(numbers?|times?)"),
      wrong: others(ans, [e - s, e, e + 1]),
      steps: [C + " starts at " + s + " and stops after " + e + ".", "List them: " + run(lines).join(", ") + ".", "Count the list, the first and last too."],
      working: ["Write down every value the loop variable takes.", "Include the start value and the end value."],
      note: C + " goes " + run(lines).join(", ") + ": " + ans + " numbers." };
  }
  function arrReadGen() {
    var vals = distinct(5, 1, 20), i = range(1, 5);
    var ans = Number(run(["OUTPUT Marks[" + i + "]"], [], fill("Marks", "INTEGER", vals))[0]);
    return { prompt: "Marks holds " + vals.join(", ") + " (index 1 first).\nWhat does OUTPUT Marks[" + i + "] output?", answer: ans, re: numRe(ans),
      wrong: others(ans, [i, vals[(i) % 5], vals[(i + 3) % 5]]),
      steps: ["The number in [ ] is the index: " + i + ".", "Count along from index 1 to index " + i + ".", "The value there is " + ans + "."],
      working: ["The number in [ ] is the position, not the value.", "Index 1 is the first value. Count along."],
      note: "Index " + i + " holds " + ans + "." };
  }
  function arrIndexGen() {
    var vals = distinct(5, 1, 20), i = range(1, 5), v = vals[i - 1];
    var ans = vals.indexOf(v) + 1;
    return { prompt: "Marks holds " + vals.join(", ") + " (index 1 first).\nWhich index holds the value " + v + "?", answer: ans, re: numRe(ans),
      wrong: others(ans, [v, ans + 1, ans - 1].filter(function (x) { return x > 0 && x <= 20; })),
      steps: ["Find " + v + " in the list.", "Count its position from 1.", "It is at index " + ans + "."],
      working: ["Find the value in the list first.", "Then count its position, starting at 1."],
      note: v + " is item " + ans + " in the list." };
  }
  function arrTotalGen() {
    var vals = distinct(4, 1, 12), T = pick(["Total", "Sum"]), I = pick(["Index", "Pos", "Place"]), A = pick(["Marks", "Scores", "Points"]);
    var lines = ["DECLARE " + T + " : INTEGER", "DECLARE " + I + " : INTEGER", T + " <- 0", "FOR " + I + " <- 1 TO 4", "  " + T + " <- " + T + " + " + A + "[" + I + "]", "NEXT " + I, "OUTPUT " + T];
    var ans = Number(run(lines, [], fill(A, "INTEGER", vals))[0]);
    return { prompt: A + " holds " + vals.join(", ") + " (index 1 first). What is output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [ans - vals[3], ans - vals[0], vals[3]]),
      steps: [T + " starts at 0.", I + " goes 1 to 4, so every value is added once.", vals.join(" + ") + " = " + ans + "."],
      working: ["The loop visits index 1, 2, 3 and 4.", "Add every value in the array."],
      note: vals.join(" + ") + " = " + ans + "." };
  }
  function searchGen() {
    var n = range(5, 6), list = [];
    while (list.length < n) { var it = pick(ITEMS); if (list.indexOf(it) < 0) list.push(it); }
    var p = range(2, n), target = list[p - 1], checks = 0;
    for (var i = 0; i < list.length; i++) { checks++; if (list[i] === target) break; }
    return { prompt: "Animals holds " + list.join(", ") + " (index 1 first).\nA linear search for \"" + target + "\" starts at index 1. How many items does it check?", answer: checks, re: numRe(checks, "\\s*(items?|checks?|times?)"),
      wrong: others(checks, [checks - 1, n, checks + 1].filter(function (x) { return x > 0; })),
      steps: ["Check one item at a time from index 1.", "It checks " + list.slice(0, checks).join(", ") + ".", "It stops when it finds " + target + ". That is " + checks + " checks."],
      working: ["Start at index 1. Check one item at a time.", "Stop when you find it, and count that one too."],
      note: "It checks " + list.slice(0, checks).join(", ") + ": " + checks + " items." };
  }
}

// Model drills: the systems, their parts, and the small rules every number comes from.
function modelPrelude() {
  var SYSTEMS = [
    { name: "a weather forecast", input: ["today's temperature readings", "the wind speed now"], rule: ["falling air pressure and wet air mean rain is likely"], output: ["tomorrow's chance of rain"] },
    { name: "traffic lights", input: ["the cars that arrive each minute"], rule: ["each green light lets 5 cars go"], output: ["the number of cars waiting"] },
    { name: "a flight simulator", input: ["the pilot pushes the stick forward"], rule: ["pushing the stick forward makes the nose go down"], output: ["the screen shows the ground coming closer"] },
    { name: "rabbits on an island", input: ["the rabbits at the start"], rule: ["the number of rabbits doubles each year"], output: ["the rabbits after 5 years"] },
    { name: "a savings account", input: ["the money at the start", "the money saved each week"], rule: ["add the money saved each week"], output: ["the money after one year"] },
    { name: "a new bridge", input: ["the weight of the lorries", "the length of the bridge"], rule: ["a longer bridge bends more under the same weight"], output: ["how far the bridge bends"] }
  ];
  var ROLE_RE = {
    input: /^\s*(it\s+is\s+)?(an?\s+)?inputs?(\s+data)?\s*[.!]?\s*$/i,
    rule: /^\s*(it\s+is\s+)?(an?\s+)?(rules?|calculations?)\s*[.!]?\s*$/i,
    output: /^\s*(it\s+is\s+)?(an?\s+)?(outputs?|predictions?|results?)\s*[.!]?\s*$/i
  };
  var ROLE_STEP = { input: "It is data given to the system before it runs.", rule: "It says how to work something out.", output: "It is what the system works out at the end." };
  var MODEL_RE = /^\s*(yes,?\s*)?(it\s+is\s+)?(an?\s+)?(computer\s+)?model\s*[.!]?\s*$/i;
  var NOT_RE = /^\s*(no,?\s*)?((it\s+is\s+)?not(\s+an?)?(\s+model)?|no)\s*[.!]?\s*$/i;
  var THINGS = [
    { t: "A computer program that predicts tomorrow's rain from today's readings.", yes: true, why: "It works out what will happen from data." },
    { t: "A flight simulator that trains pilots to land.", yes: true, why: "It acts like a real plane and works out what happens." },
    { t: "A program that shows how long a traffic queue gets when the light is red.", yes: true, why: "It works out the queue from the cars arriving." },
    { t: "A program that predicts how many rabbits live on an island in 10 years.", yes: true, why: "It works out the future number from a rule." },
    { t: "A program that tests how much weight a new bridge can hold before it is built.", yes: true, why: "It acts like the real bridge and works out the result." },
    { t: "A photo of a storm.", yes: false, why: "It only shows one moment. It works nothing out." },
    { t: "A list of the names in your class.", yes: false, why: "It only stores names. It predicts nothing." },
    { t: "A video of last year's football match.", yes: false, why: "It only shows what already happened." },
    { t: "A real plane flying to Bangkok.", yes: false, why: "It is the real system, not a computer version of it." },
    { t: "A letter typed in a word processor.", yes: false, why: "It works nothing out." }
  ];
  var CAP = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };

  function roleGen() {
    var s = pick(SYSTEMS), role = pick(["input", "rule", "output"]), part = pick(s[role]);
    var ans = CAP(role), all = ["Input", "Rule", "Output"];
    return { prompt: "A model of " + s.name + ".\nPart: \"" + part + "\".\nIs this part an input, a rule or an output?", answer: ans, re: ROLE_RE[role],
      wrong: all.filter(function (r) { return r !== ans; }).concat(["A simulator"]),
      steps: ["Ask: does it go in, does it work something out, or does it come out?", ROLE_STEP[role]],
      working: ["Does it go in at the start, or come out at the end?", "A part that says how to work something out is neither of those."],
      note: ROLE_STEP[role] };
  }
  function modelGen() {
    var th = pick(THINGS), ans = th.yes ? "Model" : "Not a model";
    return { prompt: th.t + "\nIs it a model? Type model or not a model.", answer: ans, re: th.yes ? MODEL_RE : NOT_RE,
      wrong: th.yes ? ["Not a model", "A photo", "An output"] : ["Model", "A simulator", "A rule"],
      steps: ["A model is a computer version of a real system that works things out.", th.why],
      working: ["Is it a computer version of a real system?", "Does it work anything out or predict anything?"],
      note: th.why };
  }
  var LEAVE = [
    ["A traffic model counts the cars, but leaves out the colour of each car.", "The colour"],
    ["A rabbit model counts the rabbits, but leaves out each rabbit's name.", "The names", "do"],
    ["A flight simulator leaves out the smell of the real cockpit.", "The smell"],
    ["A savings model leaves out the colour of the bank's front door.", "The door colour"]
  ];
  function simpleGen() {
    var l = pick(LEAVE);
    return { prompt: l[0] + "\nWhy is it still useful?", answer: l[1] + " " + (l[2] || "does") + " not change the result, so the model can stay simple.",
      re: /(?=.*\b(not|no|never|doesn'?t|don'?t|nothing)\b.*\b(chang\w*|matter\w*|affect\w*|need\w*|important|use\w*|help\w*))(?=.*\b(simple\w*|easier|faster|quicker|less|smaller)\b)/i,
      wrong: ["It looks more real, because the left out part makes the screen look better.", "Leaving it out changes the prediction, so the model becomes more exciting.", "The computer stores more data, so the model can keep every small detail."],
      working: ["Would the left out part change the prediction?", "What does leaving it out do to the model?"],
      note: "A good model leaves out what does not change the result, so it stays simple." };
  }
  // Explain why a model is used: each needs the reason and what it means.
  function pilotGen() {
    var job = pick(["land in a storm", "deal with an engine failure", "land for the first time"]);
    return { prompt: "A new pilot practises how to " + job + " in a flight simulator.\nWhy use a simulator, not a real plane?", answer: "It is safer, because a crash in a simulator hurts no one.",
      re: /(?=.*\b(safe|safer|safely|safety|danger\w*|risk\w*|hurt\w*|injur\w*|die|dies|kill\w*)\b)(?=.*\b(crash\w*|mistakes?|no\s*one|nobody|people|pilots?|passengers?|real|wrong)\b)/i,
      wrong: ["It is faster, because a simulator plane flies at a much higher speed.", "It is more fun, because the screen shows a game with points.", "It is newer, because real planes are too old to use for lessons."],
      working: ["What could go wrong in a real plane?", "Who could be hurt, and does that happen in a simulator?"],
      note: "Safer: a mistake in a simulator hurts no one." };
  }
  function bridgeGen() {
    var what = pick(["a new bridge", "a new tall tower", "a new dam"]);
    return { prompt: "Engineers test " + what + " in a model before they build it.\nWhy test it in a model first?", answer: "It is cheaper, because nothing real is built and broken.",
      re: /(?=.*\b(cheap\w*|cost\w*|money|pay|expensive|fast\w*|quick\w*|time|safe\w*|danger\w*)\b)(?=.*\b(real|build\w*|built|broke\w*|break\w*|fall\w*|collaps\w*|materials?|people|hurt|wast\w*)\b)/i,
      wrong: ["It looks better, because a model shows it in bright colours.", "Engineers like it more, because drawing a picture is fun.", "The model is always right, so the real one never needs checking."],
      working: ["What would a real test cost, or risk?", "What happens to the real thing if the test fails?"],
      note: "Cheaper and safer: nothing real is built, broken or falls on people." };
  }
  function whatIfGen() {
    var q = pick(["What if twice as many cars arrive?", "What if the rabbits only grow by half each year?", "What if the wind is twice as strong?"]);
    return { prompt: "\"" + q + "\"\nWhy is a model good for testing a question like this?", answer: "You can change the input and run it again, and nothing real is harmed.",
      re: /(?=.*\b(chang\w*|try|tries|trying|again|many|different|test\w*)\b)(?=.*\b(safe\w*|danger\w*|harm\w*|hurt\w*|real|risk\w*|damag\w*|quick\w*|fast\w*|seconds?|cheap\w*)\b)/i,
      wrong: ["A model gives one fixed answer, so there is only one thing to ask.", "It is a guess, because a computer cannot work anything out.", "The weather decides the answer, so a model cannot help with it."],
      working: ["What do you change in the model to ask it?", "What would happen if you tried it for real?"],
      note: "Change one input and run again: fast, and nothing real is harmed." };
  }
  // The data cards. Every number comes from these rules.
  function savings(start, add, weeks) { return start + add * weeks; }
  function rabbits(start, years) { var r = start; for (var y = 0; y < years; y++) r = r * 2; return r; }
  function queue(arrive, go, minutes) { var w = 0; for (var m = 0; m < minutes; m++) w = w + arrive - go; return w; }
  function savGen() {
    var s = range(20, 200, 10), a = range(5, 25, 5), w = range(2, 6), ans = savings(s, a, w);
    return { prompt: "A savings model. Rule: each week, add " + a + ".\nThe start is " + s + ". What does it predict after " + w + " weeks?", answer: ans, re: numRe(ans),
      wrong: others(ans, [s + a, a * w, s + a * (w - 1)]),
      steps: ["Start with the start amount: " + s + ".", w + " weeks of " + a + " is " + (a * w) + ".", s + " + " + (a * w) + " = " + ans + "."],
      working: ["Start with the start amount.", "Add the same amount once for every week."],
      note: s + " + " + w + " x " + a + " = " + ans + "." };
  }
  function savChangeGen() {
    var s1 = range(20, 100, 10), s2 = s1 + range(10, 60, 10), a = range(5, 20, 5), w = range(2, 5), ans = savings(s2, a, w) - savings(s1, a, w);
    return { prompt: "A savings model. Rule: each week, add " + a + ". It runs for " + w + " weeks.\nThe start changes from " + s1 + " to " + s2 + ". How much bigger is the new prediction?", answer: ans, re: numRe(ans),
      wrong: others(ans, [ans + a * w, a * w, s2]),
      steps: ["Old: " + s1 + " + " + w + " x " + a + " = " + savings(s1, a, w) + ".", "New: " + s2 + " + " + w + " x " + a + " = " + savings(s2, a, w) + ".", savings(s2, a, w) + " - " + savings(s1, a, w) + " = " + ans + "."],
      working: ["Work out the old prediction, then the new one.", "The weekly part is the same both times. What changed?"],
      note: "Only the start changed, so the prediction grows by the same amount: " + ans + "." };
  }
  function rabGen() {
    var s = range(5, 40, 5), y = range(1, 3), ans = rabbits(s, y), list = [];
    for (var i = 1; i <= y; i++) list.push(rabbits(s, i));
    return { prompt: "A rabbit model. Rule: each year, the number of rabbits doubles.\nThe start is " + s + " rabbits. What does it predict after " + y + " year" + (y > 1 ? "s" : "") + "?", answer: ans, re: numRe(ans, "\\s*rabbits?"),
      wrong: others(ans, [s * y, s + 2 * y, ans / 2, ans * 2]),
      steps: ["Start: " + s + " rabbits.", "Double once for each year: " + list.join(", ") + ".", "After " + y + " year" + (y > 1 ? "s" : "") + ": " + ans + "."],
      working: ["Doubles means times 2.", "Do it once for every year, using the new number each time."],
      note: s + " doubled " + y + " time" + (y > 1 ? "s" : "") + " is " + ans + "." };
  }
  function queueGen() {
    var a = range(5, 9), g = range(2, a - 1), m = range(2, 5), ans = queue(a, g, m);
    return { prompt: "A traffic light model. 0 cars wait at the start.\n" + a + " cars arrive each minute. The green light lets " + g + " go each minute.\nHow many cars are waiting after " + m + " minutes?", answer: ans, re: numRe(ans, "\\s*cars?"),
      wrong: others(ans, [a * m, (a + g) * m, a - g]),
      steps: ["Each minute: add " + a + ", take away " + g + ". That is " + (a - g) + " more cars each minute.", m + " minutes of " + (a - g) + " is " + ans + "."],
      working: ["How many more cars wait after one minute?", "Do that once for every minute."],
      note: "(" + a + " - " + g + ") x " + m + " = " + ans + " cars." };
  }
  function queueChangeGen() {
    var a = range(5, 8), g = range(2, a - 1), d = range(1, 3), m = range(2, 5), ans = queue(a + d, g, m) - queue(a, g, m);
    return { prompt: "A traffic light model. The green light lets " + g + " cars go each minute. It runs for " + m + " minutes.\nThe cars arriving each minute change from " + a + " to " + (a + d) + ". How many more cars are waiting at the end?", answer: ans, re: numRe(ans, "\\s*(more\\s+)?cars?"),
      wrong: others(ans, [d, queue(a + d, g, m), a + d]),
      steps: ["Old: (" + a + " - " + g + ") x " + m + " = " + queue(a, g, m) + ".", "New: (" + (a + d) + " - " + g + ") x " + m + " = " + queue(a + d, g, m) + ".", queue(a + d, g, m) + " - " + queue(a, g, m) + " = " + ans + "."],
      working: ["Work out the queue with the old data, then with the new data.", "Find the difference."],
      note: d + " more each minute for " + m + " minutes: " + ans + " more cars." };
  }
  function typoGen() {
    var s = range(10, 40, 10) * 10, t = s / 10, a = range(5, 20, 5), w = range(2, 5), ans = savings(t, a, w);
    return { prompt: "A savings model. Rule: each week, add " + a + ".\nThe real start is " + s + ", but someone types " + t + " by mistake. What does the model predict after " + w + " weeks?", answer: ans, re: numRe(ans),
      wrong: others(ans, [savings(s, a, w), t, a * w]),
      steps: ["The model only knows the data it is given: " + t + ".", t + " + " + w + " x " + a + " = " + ans + "."],
      working: ["The model cannot see the real start. Which number does it use?", "Then add the weekly amount once for each week."],
      note: "It uses the typed " + t + ": " + ans + ". The real account has " + savings(s, a, w) + ". Garbage in, garbage out." };
  }
  function gigoGen() {
    var why = pick(["readings from last month", "readings from a broken thermometer", "readings that were typed in wrong"]);
    return { prompt: "A weather model uses " + why + ".\nWhy may its forecast for tomorrow be wrong?", answer: "The data is wrong or old, so the prediction does not match the real weather.",
      re: /(?=.*(\b(old|bad|broken|incorrect|mistakes?|out\s+of\s+date|last\s+month|garbage)\b|\b(data|readings?|inputs?|thermometer)\b.*\b(wrong|not\s+(new|current|correct|right))\b|\bwrong\s+(data|readings?|inputs?)\b))(?=.*\b(outputs?|predictions?|predicts?|forecasts?|results?|answers?|match\w*|today|tomorrow|now|real|garbage\s+out)\b)/i,
      wrong: ["The computer is too slow to finish the forecast before tomorrow.", "It rained today, so a model cannot forecast tomorrow at all.", "Models are always right, so the forecast cannot be wrong."],
      working: ["What is wrong with the data it uses?", "What does that do to what comes out?"],
      note: "Wrong or old data in gives a wrong forecast out: garbage in, garbage out." };
  }
  function missingGen() {
    return { prompt: "A rabbit model leaves out the foxes that eat rabbits.\nWhy does it predict more rabbits than really live on the island?", answer: "Foxes eat rabbits, but the model has no foxes, so fewer rabbits really live.",
      re: /(?=.*\b(eat\w*|eaten|hunt\w*|kill\w*)\b)(?=.*\b(left\s+out|leaves?\s+out|missing|no\s+fox\w*|not\s+in|does\s*n[o']t|ignor\w*|without|fewer|less|die\w*)\b)/i,
      wrong: ["Rabbits run fast, so the model cannot count all of them.", "The island is big, so there is room for more rabbits than it says.", "The rule is right, so the model always matches the island."],
      working: ["What do foxes do to the real rabbits?", "Does the model know about that?"],
      note: "The model is missing data about foxes, so it predicts too many rabbits." };
  }
}
const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };

function extCards() {
  return [
    card("x-sel-1", "x-sel", selGen(">", false)),
    card("x-sel-2", "x-sel", selGen(">=", true)),
    card("x-sel-3", "x-sel", selGen("<", true)),
    card("x-loop-1", "x-loop", loopTotalGen),
    card("x-loop-2", "x-loop", loopTimesGen),
    card("x-arr-1", "x-arr", arrReadGen),
    card("x-arr-2", "x-arr", arrIndexGen),
    card("x-arr-3", "x-arr", arrTotalGen),
    card("x-search-1", "x-search", searchGen),
    card("x-search-2", "x-search", searchGen)
  ];
}
function partsCards() {
  return [
    card("pt-model-1", "pt-model", modelGen),
    card("pt-model-2", "pt-model", modelGen),
    card("pt-model-3", "pt-model", modelGen),
    card("pt-role-1", "pt-parts", roleGen),
    card("pt-role-2", "pt-parts", roleGen),
    card("pt-role-3", "pt-parts", roleGen),
    explain("pt-simple", "pt-simple", simpleGen)
  ];
}
function dataCards() {
  return [
    card("dt-sav", "dt-run", savGen),
    card("dt-rab", "dt-run", rabGen),
    card("dt-queue", "dt-run", queueGen),
    card("dt-sav-change", "dt-change", savChangeGen),
    card("dt-queue-change", "dt-change", queueChangeGen),
    card("dt-typo", "dt-wrong", typoGen),
    explain("dt-gigo", "dt-wrong", gigoGen)
  ];
}
function plenaryCards() {
  return [
    card("pl-model-1", "pl-model", modelGen),
    card("pl-model-2", "pl-model", modelGen),
    card("pl-role-1", "pl-parts", roleGen),
    card("pl-role-2", "pl-parts", roleGen),
    card("pl-role-3", "pl-parts", roleGen),
    explain("pl-simple", "pl-parts", simpleGen),
    explain("pl-why-pilot", "pl-why", pilotGen),
    explain("pl-why-bridge", "pl-why", bridgeGen),
    explain("pl-why-whatif", "pl-why", whatIfGen),
    card("pl-sav", "pl-data", savGen),
    card("pl-rab", "pl-data", rabGen),
    card("pl-queue", "pl-data", queueGen),
    card("pl-queue-change", "pl-data", queueChangeGen),
    card("pl-typo", "pl-data", typoGen),
    explain("pl-gigo", "pl-data", gigoGen),
    explain("pl-missing", "pl-data", missingGen)
  ];
}

const DRILLS = [
  ['y8-3-1-ext', 'Do Now Extension: Term 1a selection, loops, arrays and linear search.', 'Year 8 Extension: Term 1a Challenge', '3.1 Do Now Extension',
    [['x-sel', 'Selection'], ['x-loop', 'Loops'], ['x-arr', 'Arrays'], ['x-search', 'Linear Search']], extCards, [termOnePrelude]],
  ['y8-3-1-parts', 'Activity 1: model or not, and which part is an input, a rule or an output.', 'Year 8, 3.1: Parts of a Model', 'Inputs, rules and outputs',
    [['pt-model', 'Model or Not?'], ['pt-parts', 'Inputs, Rules, Outputs'], ['pt-simple', 'What It Leaves Out']], partsCards, [modelPrelude]],
  ['y8-3-1-data', 'Activity 2: run a small model, change its data, and see what wrong data does.', 'Year 8, 3.1: Change the Data', 'Predict the output',
    [['dt-run', 'Run the Model'], ['dt-change', 'Change the Data'], ['dt-wrong', 'Wrong Data']], dataCards, [modelPrelude]],
  ['y8-3-1-models', 'Plenary: models, their parts, why we use them, and why the data matters.', 'Year 8, 3.1: Models and Simulators', 'Models and data',
    [['pl-model', 'Model or Not?'], ['pl-parts', 'Parts of a Model'], ['pl-why', 'Why Use a Model?'], ['pl-data', 'Why the Data Matters']], plenaryCards, [modelPrelude]],
];
for (const [id, about, title, subtitle, cats, fn, extra] of DRILLS) {
  const src = `// Year 8, 3.1 Models and Simulators. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_y8_3_1.mjs: edit that, then run it. Every answer is worked out in code when the card is drawn.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {${body(prelude)}\n${extra.map(body).join('\n')}\n${body(fn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, Math };
    ctx.DrillData = { register: (k, d) => { ctx.out = d; ctx.key = k; } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    const srcText = fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8');
    vm.runInContext(srcText, ctx);
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
        assert(pass(ans.toLowerCase()), `${id} ${card.id}: "${ans}" in lower case fails`);
        for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
        assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length && !r.distractors.map(String).includes(ans), `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        if (r.working && !inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
        assert(r.working && r.working.length === 2, `${id} ${card.id}: two nudges`);
        if (r.example) {
          const whole = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!(ans.length >= 3 && whole.test(r.example.toLowerCase()) && !whole.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        }
        if (id === 'y8-3-1-ext') assert(r.example, `${id} ${card.id}: no worked example`);
        assert(!/[\u2013\u2014]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors])), `${id} ${card.id}: dash`);
      }
    }
    // Explain cards need two connected ideas: one idea alone fails.
    if (id !== 'y8-3-1-ext') {
      const byId = Object.fromEntries(d.cards.map((c) => [c.id, c]));
      const fails = { 'pl-why-pilot': ['It is safer.', 'A crash.', 'It is cheaper.'], 'pl-why-bridge': ['It is cheaper.', 'The bridge.'],
        'pl-gigo': ['The data is old.', 'The forecast is wrong.'], 'pl-missing': ['Foxes.', 'It has no foxes.'], 'pl-simple': ['It is simple.', 'It does not matter.'],
        'pl-why-whatif': ['You can change it.', 'It is real.'] };
      for (const [cid, list] of Object.entries(fails)) if (byId[cid]) {
        const r = byId[cid].randomize();
        for (const s of list) assert(!r.keywords.some((k) => k.test(s)), `${id} ${cid}: one idea "${s}" passes`);
      }
      const goods = { 'pl-why-pilot': ['If you crash nobody gets hurt so it is safer'], 'pl-gigo': ['the data is old so the forecast will be wrong'], 'pl-missing': ['foxes eat rabbits but they are not in the model'], 'pl-why-bridge': ['it costs less because you do not build a real bridge'] };
      for (const [cid, list] of Object.entries(goods)) if (byId[cid]) {
        const r = byId[cid].randomize();
        for (const s of list) assert(r.keywords.some((k) => k.test(s)), `${id} ${cid}: good answer "${s}" fails`);
      }
    }
    // No term before the slide that teaches it.
    const code = srcText.replace(/^\/\/.*$/gm, '');
    if (id === 'y8-3-1-ext') assert(!/\bmodels?\b|simulat|\brules?\b|garbage/i.test(code), 'the Extension uses a term before it is taught');
    if (id === 'y8-3-1-parts') {
      const used = partsCards.toString() + body(modelPrelude).split('function savings')[0];
      assert(!/garbage/i.test(partsCards.toString()), 'parts drill uses garbage');
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: read it just before writing, change only
// Year 8, and write it back in the same format.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y8 = all.years.find((y) => y.id === 'year8');
const UNIT = 'Data Models and Collection';
let unit = y8.units.find((u) => u.title === UNIT), changed = false;
if (!unit) { unit = { code: '', title: UNIT, lessons: [] }; y8.units.push(unit); changed = true; }
if (!unit.lessons.includes(ID)) { unit.lessons.push(ID); changed = true; }
if (changed) {
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; Year 8 units: ${y8.units.map((u) => u.title + ' [' + u.lessons.join(', ') + ']').join('; ')}`);
