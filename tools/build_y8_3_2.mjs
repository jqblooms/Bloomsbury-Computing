// Builds LessonData/y8-3-2-data.json: Year 8, 3.2 Data Requirements for Models (8MD.01: identify the data required
// for a given model or application; 8MD.07: explain why different applications require different data), its two
// drills (Drills/data/y8-3-2-ext.js, y8-3-2-data.js), and registers the lesson after y8-3-1-models.
//   node tools/build_y8_3_2.mjs
// Same shape as tools/build_y8_3_1.mjs: EAL-light and Term 1b "why" (one idea per slide, a teacher-only Think, Pair,
// Share under every heading, predict-then-reveal, compare slides side by side). Year 8 has no exam board papers, so
// nothing carries a citation. Hands-on (James, 2026-10-21: no copy/write activities, not too easy): four slides are
// Model Lab activities (ModelLab/ in this repo, registry id model-lab, one activity per slide by embedQuery
// activity=<name>), checked as the student works, with limited runs, checks or a run of right answers, and each posts
// its result as the slide's answer (BC_APP_RESULT). The models, data items, applications and briefs live in
// ModelLab/bank.js, which this builder also copies into the plenary drill, so the app and the drill always agree.
// The Extension reuses the 3.1 card kinds, taken from tools/build_y8_3_1.mjs (prelude and modelPrelude).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const BANK_SRC = fs.readFileSync(path.join(ROOT, 'ModelLab', 'bank.js'), 'utf8');
const MLB = require(path.join(ROOT, 'ModelLab', 'bank.js'));
const ID = 'y8-3-2-data';
const P = 'y832';
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- pieces (as in build_y8_3_1.mjs)
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const caption = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const tcell = 'padding:5px 10px;text-align:left;font-size:16px';
const table = (head, rows) => '<table class="donow-table" style="width:100%">' +
  (head ? '<tr>' + head.map((h) => `<th style="${tcell}">${h}</th>`).join('') + '</tr>' : '') +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="${tcell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';
const flowBox = 'border:2px solid var(--brand);border-radius:10px;padding:8px 12px;background:var(--surface-2);font-size:16px;line-height:1.4';
const box = (t) => `<div style="${flowBox}">${t}</div>`;
const blank = '<span style="display:inline-block;padding:0 6px;border-radius:6px;background:var(--bad-soft);color:var(--bad);font-weight:700">blank</span>';

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
// A Model Lab activity on a slide: it posts its result as BC_APP_RESULT, saved as the slide's answer.
const lab = (id, label, heading, activity) => ({ id, label, type: 'embedded-app', appId: 'model-lab', embedQuery: `activity=${activity}`,
  embedContainerId: `${P}-${id}`, content: `<h2 class="lesson-h2">${heading}</h2><div id="${P}-${id}"></div>` });
function mcStep(id, label, heading, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `${extra}<div id="${cid}"></div>`, items };
}
// Self-marked written answers: modelAnswer is the shortest answer that earns the marks; scheme lists the mark scheme
// points, one mark each (AI marking reads it from the published JSON: shell docs/lessons.md, AI marking).
function selfMarked(id, label, heading, lead, items) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>${lead}<div id="${P}-${id}"></div>`, items };
}
const num = (n, unit = '') => `^\\s*${n}\\s*${unit ? `(${unit})?` : ''}\\s*$`;
const ROLE = {
  input: '^\\s*(it\\s+is\\s+)?(an?\\s+)?inputs?(\\s+data)?\\s*[.!]?\\s*$',
  rule: '^\\s*(it\\s+is\\s+)?(an?\\s+)?(rules?|calculations?)\\s*[.!]?\\s*$',
  output: '^\\s*(it\\s+is\\s+)?(an?\\s+)?(outputs?|predictions?|results?)\\s*[.!]?\\s*$',
};
const NO_CHANGE = "^\\s*(no(\\s*,?\\s*(it\\s+)?(does\\s*n[o']?t|will\\s+not|won'?t)(\\s+change)?|\\s*,?\\s*(it\\s+)?(stays|is)\\s+the\\s+same)?|(it\\s+)?(does\\s*n[o']?t|will\\s+not|won'?t)(\\s+change)?|(it\\s+)?(stays|is)\\s+the\\s+same|(the\\s+)?same|unchanged)\\s*[.!]?\\s*$";

// Think, Pair, Share under each heading: one short why question, answer hidden until the teacher clicks.
// On a check slide it never gives or presupposes an answer on that slide (tools/tps-leak-check.mjs in the shell).
const TPS = {
  'do-now': ['Why does a model need a rule as well as the start amount?', 'The start is only where it begins. The rule says how it changes each week.'],
  'do-now-2': ['Why does a queue get longer when more cars arrive than go?', 'Each minute, the cars that arrive are added and the cars that go are taken away. More in than out means it grows.'],
  'title': ['A sat nav and a weather app run on the same phone. Why might they need different data?', 'They do different jobs. Today we find out how the job decides the data.'],
  'needs-check': ['Why read the rule before you look at the options?', 'The rule says exactly what the model works with. An option can sound sensible and still not be in the rule.'],
  'activity-1': ['Why run the model after you choose the data?', 'The run shows what the rule really used. A blank or a wrong number shows up as a wrong prediction.'],
  'what-if': ['Why predict before you run it?', 'A prediction shows what you think the rule does. If the run is different, you find out which idea to fix.'],
  'why-missing': ['What makes an explanation worth 2 marks?', 'Two points, where the second one follows from the first. Join them with so.'],
  'compare-apps': ['Why would a fitness app need your heart rate, but a savings app would not?', 'Heart rate changes the energy you used. It never changes the money you will have.'],
  'activity-2': ['Why check each item against each application, one at a time?', 'An item can matter to one application, to both, or to neither. Checking each one stops you guessing.'],
  'why-apps': ['Why is "they need different data" not enough for 2 marks?', 'It only repeats the question. A mark needs a reason, and the second mark needs a link to it.'],
  'practice': ['Why read the whole brief before you choose any data?', 'Each part of the brief says something that changes the answer. Miss one part and the model misses data it needs.'],
  'plenary': ['Why practise with a new model every time?', 'If you can find the data for any model, you really understand it.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (3.1): run a savings model, name a part, a typo
const sav = (start, add, weeks) => start + add * weeks;
assert(sav(40, 15, 4) === 100 && sav(4, 15, 4) === 64, 'do-now 1');
assert(sav(30, 8, 5) === 70 && sav(3, 8, 5) === 43, 'walkthrough 1');
const WT_MODEL = { title: 'Walk me through it: using a model', steps: [
  { text: 'This is a different model with the same three questions. Do the same steps with yours.', visual: box('<strong>Coin jar model</strong><br>Rule: each week, add 8.<br>Start: 30 in the jar.') },
  { text: 'Predict after 5 weeks. Begin with the start: <strong>30</strong>.', visual: box('Start: ' + hl('30') + '<br>Rule: each week, add 8.') + note('So far: 30') },
  { text: 'The rule adds 8 once for <strong>every</strong> week. 5 weeks of 8 is 40.', visual: box('Start: 30<br>Rule: ' + hl('each week, add 8') + '.') + note('5 x 8 = 40') },
  { text: 'Add it to the start: 30 + 40 = <strong>70</strong>.', visual: note('30 + 5 x 8 = ' + hl('70')) },
  { text: 'Which part is "each week, add 8"? Ask: is it given at the start, does it say how to work something out, or is it worked out at the end?', visual: box('Start: 30<br>Rule: ' + hl('each week, add 8') + '.') },
  { text: 'It says how to work the answer out, so it is the <strong>rule</strong>. Ask the same three things about your part.', visual: note('"each week, add 8" = the rule') },
  { text: 'Someone types the start as 3, not 30. The model only knows what it is given, so it uses 3: 3 + 40 = <strong>43</strong>.', visual: note('3 + 5 x 8 = ' + hl('43')) },
] };
steps.push(checkStep('do-now', 'Do Now: Using a Model (1 of 2)', 'Do Now: Using a Model (1 of 2)', 'From 3.1: models and their parts.', [
  { label: 'What does the model predict after 4 weeks?', answer: num(100), feedback: 'Begin with the start. Add 15 once for every week.' },
  { line: true, label: '"Start: 40 in the account". Input, rule or output?', answer: ROLE.input, feedback: 'Is it given at the start, a way to work something out, or worked out at the end?' },
  { label: 'Someone types the start as 4 by mistake. What does it predict after 4 weeks?', answer: num(64), feedback: 'The model only knows the start it is given. Use the typed start, then add 15 for each week.' },
], box('<strong>Savings model</strong><br>Rule: each week, add 15.<br>Start: 40 in the account.')));
steps[steps.length - 1].walkthrough = WT_MODEL;

// ---------------------------------------------------------------- Do Now 2 (3.1): the traffic queue, what a model leaves out
const queue = (start, arrive, go, minutes) => { let w = start; for (let m = 0; m < minutes; m++) w = Math.max(0, w + arrive - go); return w; };
assert(queue(2, 6, 4, 3) === 8, 'do-now 2');
assert(queue(0, 7, 3, 4) === 16, 'walkthrough 2');
const qbox = (start, arrive, go, hlRow = -1) => box('<strong>Traffic light model</strong><br>' + [
  `${start} cars wait at the start.`, `${arrive} cars arrive each minute.`, `The green light lets ${go} go each minute.`].map((t, i) => i === hlRow ? hl(t) : t).join('<br>'));
const WT_QUEUE = { title: 'Walk me through it: the traffic model', steps: [
  { text: 'This is a different traffic model, with two questions like yours. Use these steps on yours.', visual: qbox(0, 7, 3) },
  { text: 'Each minute, <strong>add</strong> the cars that arrive: 7.', visual: qbox(0, 7, 3, 1) + note('+7 each minute') },
  { text: 'Each minute, <strong>take away</strong> the cars that go: 3. So each minute the queue grows by 7 - 3 = 4.', visual: qbox(0, 7, 3, 2) + note('7 - 3 = 4 more each minute') },
  { text: 'Start at the cars waiting at the start, then add 4 for every minute. After 4 minutes: 0 + 4 x 4 = <strong>16</strong>.', visual: qbox(0, 7, 3, 0) + note('0 + 4 x 4 = ' + hl('16 cars')) },
  { text: 'The model leaves out the drivers\' names. Look at what the model works with: cars arriving and cars going.', visual: qbox(0, 7, 3) },
  { text: 'Names are never added or taken away, so they cannot change the number waiting. The prediction stays at 16. Now ask this about your question.', visual: note('Names: never used') },
] };
steps.push(checkStep('do-now-2', 'Do Now: What a Model Leaves Out (2 of 2)', 'Do Now: What a Model Leaves Out (2 of 2)', 'From 3.1: running a model, and what it leaves out.', [
  { label: 'How many cars are waiting after 3 minutes?', answer: num(8, '\\s*cars?'), feedback: 'Begin with the cars at the start. Each minute, add the cars that arrive and take away the cars that go.' },
  { line: true, label: 'The model leaves out the colour of each car. Does that change its prediction? Type yes or no.', answer: NO_CHANGE, feedback: 'Does the model add or take away anything to do with colour?' },
], qbox(2, 6, 4)));
steps[steps.length - 1].walkthrough = WT_QUEUE;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-3-2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on models, their parts and their data from 3.1. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '3.2: Data Requirements for Models',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Data Models and Collection</p><h2 class="lesson-h2">3.2: Data Requirements for Models</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> find the data a model needs.', '<strong>The big question:</strong> why do different apps need different data?']) });

// ---------------------------------------------------------------- the data a model needs
assert(queue(2, 7, 4, 5) === 17 && queue(2, 7, 0, 5) === 37, 'compare-missing');
steps.push({ id: 'data-needs', label: 'What Data Does a Model Need?',
  content: '<h2 class="lesson-h2">What Data Does a Model Need?</h2>' +
    tps('Predict: which numbers must someone count before this model can run? Why?',
      '<p>The cars waiting at 8 am, the cars that arrive each minute, the cars that go each minute, and the number of minutes.</p><p><strong>Why?</strong> The rule uses each one. Without one of them, the rule cannot be worked out.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">The <strong>data requirements</strong> of a model are the data it needs to work.</p>' +
    columns(box('<strong>Traffic light model</strong><br>It predicts the cars waiting at the end.<br><strong>Rule:</strong> each minute, cars waiting = cars waiting + cars that arrive - cars that go.'),
      facts([
        'Read the rule. Find each thing it <strong>uses</strong>.',
        'Each one is data the model <strong>needs</strong>.',
        'Data the rule never uses is <strong>not needed</strong>, like the colour of each car.',
      ])) });

steps.push(mcStep('needs-check', 'Your Turn: Needed or Not?', 'Your Turn: Needed or Not?', '', [
  { prompt: 'Rabbit model. Rule: each year, the rabbits double. Which data does it need?',
    options: ['The rabbits on the island now', 'The number of foxes on the island', 'The size of the island', 'How much each rabbit weighs'], correct: 0,
    explain: 'The rule only doubles the rabbits. It never uses foxes, size or weight, so the model does not need them.' },
  { prompt: 'Trip model. Rule: cost = price of the coach + price of one ticket x students going. Which data is NOT needed?',
    options: ['The price of one ticket', 'The number of students going', 'How far away the trip is', 'The price of the coach'], correct: 2,
    explain: 'The rule never uses the distance. The price of the coach is already in the rule.' },
]));

// ---------------------------------------------------------------- data must be the right data: this system, now
const trip = (coach, ticket, students) => coach + ticket * students;
assert(trip(3000, 150, 40) === 9000 && trip(3000, 100, 40) === 7000, 'compare-near');
steps.push({ id: 'compare-near', label: 'Compare: This Year\'s Data, Last Year\'s Data',
  content: '<h2 class="lesson-h2">Compare: This Year\'s Data, Last Year\'s Data</h2>' +
    tps('Both use the same rule. Predict each cost. Why does only one match the real cost?',
      '<p>A: 3000 + 150 x 40 = <strong>9000</strong>. B: 3000 + 100 x 40 = <strong>7000</strong>.</p><p><strong>Why?</strong> Tickets cost 150 this year. B uses last year\'s price, so the rule gets the wrong number.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">School trip model. Rule: cost = price of the coach + price of one ticket x number of students going.</p>' +
    columns(caption('Model A') + table(null, [['Price of the coach', '3000'], ['Price of one ticket <strong>this year</strong>', '150'], ['Number of students going', '40'], ['<strong>Cost</strong>', '?']]),
      caption('Model B') + table(null, [['Price of the coach', '3000'], ['Price of one ticket <strong>last year</strong>', '100'], ['Number of students going', '40'], ['<strong>Cost</strong>', '?']])) +
    facts(['The data must be about <strong>this</strong> system, <strong>now</strong>.', 'Old data, or data about something else, gives a wrong prediction.']) });

steps.push(lab('activity-1', 'Activity 1: Choose the Data', 'Activity 1: Choose the Data', 'pick'));

// ---------------------------------------------------------------- missing data
steps.push({ id: 'compare-missing', label: 'Compare: All the Data, One Item Missing',
  content: '<h2 class="lesson-h2">Compare: All the Data, One Item Missing</h2>' +
    tps('Both use the same rule. Predict each output. Why is B so far out when its rule is right?',
      '<p>A: 2 + (7 - 4) x 5 = <strong>17</strong> cars. B: 2 + (7 - 0) x 5 = <strong>37</strong> cars.</p><p><strong>Why?</strong> B has no number for the cars that go. The rule takes away 0 each minute, so no car ever leaves.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">Traffic light model. Rule: each minute, cars waiting = cars waiting + cars that arrive - cars that go.</p>' +
    columns(caption('Model A: all the data') + table(null, [['Cars waiting at 8 am', '2'], ['Cars that arrive each minute', '7'], ['Cars that go each minute', '4'], ['Number of minutes', '5'], ['<strong>Cars waiting at the end</strong>', '?']]),
      caption('Model B: one item missing') + table(null, [['Cars waiting at 8 am', '2'], ['Cars that arrive each minute', '7'], ['Cars that go each minute', blank], ['Number of minutes', '5'], ['<strong>Cars waiting at the end</strong>', '?']])) +
    facts(['A blank counts as 0, so the rule works out the wrong answer.', 'Data the rule never uses changes nothing, and takes time to collect.']) });

steps.push(lab('what-if', 'What If? Predict, Then Run It', 'What If? Predict, Then Run It', 'run'));

steps.push(selfMarked('why-missing', 'Explain: Why Missing Data Matters', 'Explain: Why Missing Data Matters',
  '', [
    { id: 'why-missing', prompt: 'A traffic light model has this rule: each minute, cars waiting = cars waiting + cars that arrive - cars that go. It is not given the number of cars the green light lets go each minute. Explain why its prediction will be wrong.', marks: 2,
      modelAnswer: 'The rule takes away the cars that go, so it needs that number (1). With it blank, no cars go, so it predicts a queue that is too long (1).',
      scheme: ['The rule uses / needs the cars that go (it takes them away each minute)',
        'With it missing (blank / 0) no cars leave, so the predicted queue is too long / too big / more than the real queue'] },
  ]));

// ---------------------------------------------------------------- different applications, different data
steps.push({ id: 'apps', label: 'Different Applications, Different Data',
  content: '<h2 class="lesson-h2">Different Applications, Different Data</h2>' +
    tps('Predict: does a sat nav need the air pressure? Why or why not?',
      '<p>No.</p><p><strong>Why?</strong> Air pressure does not change the journey time, so the sat nav never uses it.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">An <strong>application</strong> (app) is a program that does a job for its users.</p>' +
    columns(box('<strong>Weather app</strong><br>It works out: the chance of rain tomorrow.<br>It needs: air pressure, how wet the air is, wind, where you are.'),
      box('<strong>Sat nav</strong><br>It works out: the fastest way and the journey time.<br>It needs: where you are, where you want to go, the roads, how fast the traffic is moving.')) +
    facts(['A different job means a different output.', 'A different output needs a different rule, so it needs different data.']) });

steps.push(mcStep('compare-apps', 'Compare: Same Data, Two Applications', 'Compare: Same Data, Two Applications', '', [
  { prompt: 'Why do both need the wind speed and direction?',
    options: ['Wind changes the rain and the plane\'s path', 'Wind is easy to measure, so both collect it', 'The simulator copies the weather app\'s data', 'Every application needs the same data'], correct: 0,
    explain: 'Wind changes where the rain goes, and it pushes the plane.' },
  { prompt: 'Why does only the simulator need the control stick?',
    options: ['The weather app cannot measure the stick', 'Only the plane\'s path depends on the stick', 'The stick is part of every computer', 'The weather app is older than the simulator'], correct: 1,
    explain: 'The stick moves the plane. It never changes the rain.' },
], table(null, [['<strong>Weather app</strong>', 'works out the chance of rain', 'needs air pressure, how wet the air is, wind'], ['<strong>Flight simulator</strong>', 'works out how the plane moves', 'needs the control stick, engine power, wind']])));

steps.push(lab('activity-2', 'Activity 2: Two Applications, Different Data', 'Activity 2: Two Applications, Different Data', 'compare'));

steps.push(selfMarked('why-apps', 'Explain: Why Applications Need Different Data', 'Explain: Why Applications Need Different Data',
  '', [
    { id: 'why-apps', prompt: 'A weather app and a sat nav run on the same phone. Explain why the two applications need different data.', marks: 2,
      modelAnswer: 'They work out different things: the chance of rain and the journey time (1). So their rules use different data, like air pressure and traffic speed (1).',
      scheme: ['They do different jobs / work out different outputs (the chance of rain; the journey time or the way)',
        'So their rules use different data, with an example only one of them needs (air pressure / how wet the air is; where you want to go / traffic speed / the roads)'] },
  ]));

// ---------------------------------------------------------------- practice: the hardest task
steps.push(lab('practice', 'Practice: Design the Data', 'Practice: Design the Data', 'design'));

steps.push(embed('plenary', 'Plenary: Data Requirements for Models', 'drill-y8-3-2-data', 'Plenary: Data Requirements for Models',
  'The data a model needs, what missing or wrong data does, and why applications need different data. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '');
  t.content += tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, '100') && !V('do-now', 0, '55') && !V('do-now', 0, '160') && V('do-now', 1, 'input') && V('do-now', 1, 'an input') && !V('do-now', 1, 'rule') && !V('do-now', 1, 'output'), 'do-now marks');
assert(V('do-now', 2, '64') && !V('do-now', 2, '100') && !V('do-now', 2, '19'), 'do-now typo');
assert(V('do-now-2', 0, '8') && V('do-now-2', 0, '8 cars') && !V('do-now-2', 0, '18') && !V('do-now-2', 0, '6'), 'do-now-2 queue');
for (const s of ['no', 'No.', 'no it does not', 'No, it stays the same', 'it does not change', "doesn't change", 'it stays the same', 'same', 'No it doesnt']) assert(V('do-now-2', 1, s), 'no-change accepts ' + s);
for (const s of ['yes', 'yes it does', 'it changes', 'no idea what', 'it gets bigger']) assert(!V('do-now-2', 1, s), 'no-change rejects ' + s);
// Feedback nudges and never contains an accepted answer (every 1 to 6 word run is tested against its own pattern).
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
  if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
  for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
}
// The walkthroughs show the method on another model and never give the Do Now answers.
{
  const a = plain(JSON.stringify(WT_MODEL.steps.map((x) => x.text + ' ' + x.visual))).toLowerCase();
  assert(!/\b100\b|\b64\b|\binputs?\b|\b40\b in the account|\b15\b/.test(a), 'model walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_QUEUE.steps.map((x) => x.text + ' ' + x.visual))).toLowerCase();
  assert(!/\b8 cars\b|=\s*8\b|\bno\b|colour/.test(b), 'queue walkthrough leaks an answer');
}
// Multiple choice: the TPS never repeats the right option, and options give no length tell.
for (const s of steps.filter((x) => x.type === 'multiple-choice')) {
  const t = plain((s.content.match(/<details class="lesson-tps">([\s\S]*?)<\/details>/) || ['', ''])[1]).toLowerCase();
  for (const it of s.items) {
    const right = it.options[it.correct];
    assert(!t.includes(right.toLowerCase()), `${s.id}: TPS gives "${right}"`);
    const others = it.options.filter((o, i) => i !== it.correct).map((o) => o.length);
    assert(right.length <= 1.15 * Math.max(...others), `${s.id}: the right option is clearly the longest`);
  }
}
// The self-marked slides' Think, Pair, Share never states the model answer's ideas.
assert(!/takes? away|too long|blank|no cars/i.test(TPS['why-missing'].join(' ')), 'why-missing TPS gives the answer');
assert(!/different (things|outputs?|jobs?)|work out/i.test(TPS['why-apps'].join(' ')), 'why-apps TPS gives the answer');
// Every slide asks a why: a Think, Pair, Share on every slide except the Extension.
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it (the title slide only names today's topic).
const TEACH = [[/data requirements?/i, 'data-needs'], [/\bapplications?\b/i, 'apps'], [/\bapps?\b/i, 'apps'], [/sat nav/i, 'apps']];
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    TEACH.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
{
  const all = JSON.stringify(steps) + JSON.stringify(validators) + BANK_SRC;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478|0860/.test(JSON.stringify(steps)), 'citation found');
  assert(!/mario|party/i.test(all), 'game mention');
  // Forms and validation are the next two lessons.
  const shown = steps.map((s) => s.label + ' ' + plain(s.content) + ' ' + JSON.stringify([s.items || [], s.walkthrough || ''])).join(' ');
  assert(!/\bforms?\b|validat/i.test(shown + BANK_SRC.replace(/^\s*\/\/.*$/gm, '')), 'a term from 3.3 or 3.4');
}

const lesson = { id: ID, label: '3.2: Data Requirements for Models', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== the bank, checked
{
  for (const m of MLB.MODELS) {
    assert(m.data.length >= 2 && m.near.length >= 1 && m.extra.length >= 5, m.id + ' items');
    for (let n = 0; n < 200; n++) {
      const v = MLB.values(m), out = m.calc(v);
      assert(Number.isInteger(out) && out >= 0, `${m.id}: prediction ${out}`);
      for (const nr of m.near) assert(m.calc(MLB.withSlot(v, nr.slot, MLB.nearValue(m, nr, v))) !== out, `${m.id}: near item ${nr.text} gives the same prediction`);
      for (const s of m.blank) assert(MLB.predict(m, MLB.withSlot(v, s, null)) !== out, `${m.id}: blank ${s} changes nothing`);
    }
  }
  for (const b of MLB.BRIEFS) for (let n = 0; n < 300; n++) {
    const v = {}; b.data.forEach((d) => { v[d.slot] = MLB.between(d.min, d.max, d.step); });
    const out = b.calc(v);
    assert(Number.isInteger(out) && out > 0, `${b.id}: answer ${out}`);
    for (const nr of b.near) assert(b.calc(MLB.withSlot(v, nr.slot, MLB.briefNear(b, nr, v))) !== out, `${b.id}: near item ${nr.text} gives the same answer`);
    assert(b.data.length + b.near.length + b.extra.length >= 10, b.id + ' has ten items');
  }
  for (let n = 0; n < 2000; n++) for (const lvl of [0, 1]) {
    const r = MLB.whatIf(lvl, null);
    assert(lvl === 0 || r.dir !== 'same', 'level 1 what-if never "same"');
    assert(Number.isInteger(r.now) && r.now >= 0, 'what-if value ' + r.now);
  }
  for (const p of MLB.PAIRS) for (let n = 0; n < 50; n++) {
    const items = MLB.pairRound(p);
    assert(items.length === 8 && new Set(items.map((x) => x.text)).size === 8, 'pair round of 8');
    for (const x of items) {
      const uses = MLB.ITEMS[x.id][1];
      const want = (uses.includes(p[0]) ? 1 : 0) + (uses.includes(p[1]) ? 2 : 0);
      assert({ a: 1, b: 2, both: 3, neither: 0 }[x.where] === want, `pair ${p[0]}/${p[1]}: ${x.text} is ${x.where}`);
    }
  }
}

// ======================================================================== drills
// The Extension: the 3.1 card kinds, taken from tools/build_y8_3_1.mjs so they stay the same.
const SRC31 = fs.readFileSync(path.join(ROOT, 'tools', 'build_y8_3_1.mjs'), 'utf8');
function fnSource(src, name, next) {
  const a = src.indexOf('function ' + name + '() {'), b = src.indexOf(next, a);
  assert(a >= 0 && b > a, `${name} in build_y8_3_1.mjs`);
  const s = src.slice(a, b).trimEnd();
  return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}'));
}
const PRELUDE_31 = fnSource(SRC31, 'prelude', 'function termOnePrelude');
const MODEL_31 = fnSource(SRC31, 'modelPrelude', 'const body =');
const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };

function extCards() {
  return [
    card("x-model-1", "x-parts", modelGen),
    card("x-model-2", "x-parts", modelGen),
    card("x-role-1", "x-parts", roleGen),
    card("x-role-2", "x-parts", roleGen),
    card("x-sav", "x-run", savGen),
    card("x-rab", "x-run", rabGen),
    card("x-queue", "x-run", queueGen),
    card("x-sav-change", "x-data", savChangeGen),
    card("x-queue-change", "x-data", queueChangeGen),
    card("x-typo", "x-data", typoGen)
  ];
}

// The plenary: every card is drawn from ModelLab/bank.js (MLBANK), the same models, items and briefs as the app.
function plenPrelude() {
  var B = MLBANK;
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numRe(n, unit) { return new RegExp("^\\s*" + n + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*[.!]?\\s*$", "i"); }
  function others(ans, list) {
    var out = [];
    list.concat([ans + 10, ans * 2, ans + 1, ans + 5, ans + 3]).forEach(function (v) { if (v !== ans && v >= 0 && out.indexOf(String(v)) < 0 && out.length < 3) out.push(String(v)); });
    return out;
  }
  var low = B.lower;
  var UNIT_RE = { cars: "\\s*cars?", rabbits: "\\s*rabbits?", fish: "\\s*fish", metres: "\\s*(m|metres?|meters?)", baht: "\\s*(baht|thb)", "": "", "%": "\\s*%" };
  var DIR = { higher: "Higher", lower: "Lower", same: "The same" };
  var DIR_RE = {
    higher: /^\s*(it\s+(will\s+be|is|gets|goes)\s+)?(higher|bigger|more|larger|greater|up|increases?)(\s+than\s+before)?\s*[.!]?\s*$/i,
    lower: /^\s*(it\s+(will\s+be|is|gets|goes)\s+)?(lower|smaller|less|fewer|down|decreases?)(\s+than\s+before)?\s*[.!]?\s*$/i,
    same: /^\s*((it\s+(will\s+be|is|stays)\s+)?(the\s+)*same|no\s+change|unchanged|(it\s+)?(does\s*n[o']?t|will\s+not|won'?t)\s+change)\s*[.!]?\s*$/i
  };
  function dataLines(m, v) { return m.data.map(function (d) { return d.text + ": " + v[d.slot]; }).join("\n"); }
  function head(m) { return m.name + ". It predicts " + m.out + ".\nRule: " + m.rule; }
  // A typed card with a worked example: another draw of the same kind, with a different answer.
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      for (var i = 0; i < 120 && !ex; i++) {
        var e = gen(), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
        if (e.key !== c.key && String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) ex = e;
      }
      var example = ex ? "A similar question:\n" + ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer : null;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong, example: example, working: c.working, note: c.note };
    } };
  }
  function explain(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: [c.answer], keywords: [c.re], distractors: c.wrong, working: c.working, note: c.note };
    } };
  }
  // Pick every true answer: buttons, never typed; each draw shows a few true answers among wrong ones.
  function multi(id, category, gen) {
    return { id: id, category: category, type: "multi", show: 5, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: c.answers, distractors: c.wrong, working: c.working, note: c.note };
    } };
  }

  // ---------------------------------------------------------------- the data a model needs
  function needGen() {
    var m = B.pick(B.MODELS);
    return { prompt: head(m) + "\nPick every data item this model needs.", answers: m.data.map(function (d) { return d.text; }),
      wrong: m.near.map(function (n) { return n.text; }).concat(m.extra),
      working: ["Find each thing the rule uses. Each one is needed.", "Check each item: is it about this system, now? Does the rule use it?"],
      note: "The rule uses: " + m.data.map(function (d) { return low(d.text); }).join("; ") + "." };
  }
  function notNeededGen() {
    var m = B.pick(B.MODELS.filter(function (x) { return x.data.length >= 4; })), ex = B.pick(m.extra);
    return { prompt: head(m) + "\nWhich data item does this model NOT need?", answers: [ex], wrong: m.data.map(function (d) { return d.text; }),
      working: ["Go through the items one at a time. Does the rule use it?", "The one the rule never uses is not needed."],
      note: "The rule never uses " + low(ex) + "." };
  }
  function countGen() {
    var m = B.pick(B.MODELS), list = m.data.map(function (d) { return d.text; });
    if (B.rand(2)) list.push(B.pick(m.near).text);
    list = B.shuffle(list.concat(B.shuffle(m.extra).slice(0, 2)));
    var n = m.data.length;
    return { key: m.id, prompt: head(m) + "\nHow many of these data items does this model need?\n" + list.map(function (t) { return "- " + t; }).join("\n"),
      answer: n, re: numRe(n, "\\s*(data\\s+)?(items?)?"), wrong: others(n, [list.length, n - 1, n + 1].filter(function (x) { return x > 0; })),
      steps: ["The rule uses: " + m.data.map(function (d) { return low(d.text); }).join("; ") + ".", "Every other item is never used, or is about another time or place.", "So it needs " + n + "."],
      working: ["Read the rule. Find each thing it uses.", "Check each item against the rule. Old data, or data about something else, does not count."],
      note: "It needs " + m.data.map(function (d) { return low(d.text); }).join("; ") + ": " + n + " items." };
  }
  function designGen() {
    var b = B.pick(B.BRIEFS);
    return { prompt: b.who + " asks: \"" + b.ask + "\"\n" + b.says + "\nPick every data item the model must collect.", answers: b.data.map(function (d) { return d.text; }),
      wrong: b.near.map(function (n) { return n.text; }).concat(b.extra),
      working: ["Find each thing the brief says changes the answer.", "Check each item: is it about today, this place and this event?"],
      note: "It must collect: " + b.data.map(function (d) { return low(d.text); }).join("; ") + "." };
  }

  // ---------------------------------------------------------------- missing or wrong data
  function whatIfText(r) { return head(r.m) + "\n" + dataLines(r.m, r.v) + "\nIt predicts " + r.old + ".\nWhat if? " + r.text; }
  function dirGen() {
    var r = B.whatIf(0, null), ans = DIR[r.dir];
    return { key: r.m.id, prompt: whatIfText(r) + "\nWill the prediction be higher, lower or the same?", answer: ans, re: DIR_RE[r.dir],
      wrong: ["Higher", "Lower", "The same", "It cannot run"].filter(function (x) { return x !== ans; }),
      steps: [r.why, "New: " + r.m.work(r.nv) + " = " + r.now + ". Before, it was " + r.old + "."],
      working: ["Find the data item that changes. Does the rule use it?", "If it does, is the new number bigger or smaller? Does the rule add it, take it away or multiply by it?"],
      note: r.why };
  }
  function newGen() {
    var r = B.whatIf(1, null);
    return { key: r.m.id, prompt: whatIfText(r) + "\nWhat does the model predict now?", answer: r.now, re: numRe(r.now, UNIT_RE[r.m.unit]),
      wrong: others(r.now, [r.old, r.old + r.now, Math.abs(r.old - r.now)]),
      steps: ["Copy the rule and put in the new number.", r.m.work(r.nv) + " = " + r.now + "."],
      working: ["Copy the rule. Put the new number where the old one was.", "Work it out in order: times before add or take away."],
      note: r.m.work(r.nv) + " = " + r.now + ". " + r.why };
  }
  function whyMissingGen() {
    var m = B.pick(B.MODELS), d = B.dataOf(m, B.pick(m.blank));
    return { prompt: head(m) + "\nThe model is not given " + low(d.text) + ". Why will its prediction be wrong?",
      answer: "The rule uses it, so with a blank the rule works out the wrong answer.",
      re: /(?=.*\b(rule|model|calculat\w*|uses?|used|needs?|needed)\b)(?=.*(\bblank|\b0\b|\bzero|\bmissing|\bwithout|\bnot\s+given|\bno\s+(data|value|number)|\bnothing|\bempty))(?=.*\b(wrong|incorrect|too\s+(big|small|high|low|many|few|much|little)|different|not\s+(match\w*|right|correct)|lower|higher|less|more|off)\b)/i,
      wrong: ["The computer runs too slowly, so the prediction is not ready in time.", "The rule is wrong, so a new rule must be written for this model.", "A model always gives the right answer, so it will not be wrong at all."],
      working: ["What does the rule do with " + low(d.text) + "?", "A blank counts as 0. What does that do to the answer?"],
      note: "The rule uses " + low(d.text) + ". A blank counts as 0, so the rule works out the wrong answer." };
  }

  // ---------------------------------------------------------------- different applications
  var APP_RE = {
    weather: "(the\\s+)?weather(\\s+app(lication)?)?", satnav: "(the\\s+)?sat\\s*-?\\s*nav(\\s+app(lication)?)?",
    flight: "(the\\s+)?(flight\\s+)?simulator|(the\\s+)?flight(\\s+sim)?", fitness: "(the\\s+)?fitness(\\s+app(lication)?)?", savings: "(the\\s+)?savings?(\\s+app(lication)?)?"
  };
  var BOTH_RE = "both(\\s+of\\s+them)?(\\s+(apps|applications))?", NEITHER_RE = "neither(\\s+of\\s+them)?|none(\\s+of\\s+them)?";
  function whole(s) { return new RegExp("^\\s*(" + s + ")\\s*[.!]?\\s*$", "i"); }
  function whichGen() {
    var p = B.pick(B.PAIRS), x = B.pick(B.pairRound(p)), A = B.APPS[p[0]], Bp = B.APPS[p[1]];
    var label = { a: A.name, b: Bp.name, both: "Both", neither: "Neither" }, ans = label[x.where];
    var re = whole(x.where === "a" ? APP_RE[p[0]] : x.where === "b" ? APP_RE[p[1]] : x.where === "both" ? BOTH_RE : NEITHER_RE);
    var usesA = x.where === "a" || x.where === "both", usesB = x.where === "b" || x.where === "both";
    return { key: x.id, prompt: "A " + low(A.name) + " works out " + A.job + ".\nA " + low(Bp.name) + " works out " + Bp.job + ".\nWhich one needs \"" + x.text + "\"? Type " + low(A.name) + ", " + low(Bp.name) + ", both or neither.",
      answer: ans, re: re, wrong: ["a", "b", "both", "neither"].filter(function (k) { return k !== x.where; }).map(function (k) { return label[k]; }),
      steps: ["Does " + low(x.text) + " change " + A.job + "? " + (usesA ? "Yes." : "Not at all."), "Does it change " + Bp.job + "? " + (usesB ? "Yes." : "Not at all.")],
      working: ["Ask about the first application: does this data change what it works out?", "Then ask the same about the second one."],
      note: "\"" + x.text + "\": " + (x.where === "both" ? "both need it" : x.where === "neither" ? "neither needs it" : "only the " + low(ans) + " needs it") + "." };
  }
  function sideOf(app) {
    var yes = [], no = [];
    B.PAIRS.forEach(function (p) {
      var i = p.indexOf(app); if (i < 0 || i > 1) return;
      (i === 0 ? p[2] : p[3]).concat(p[4]).forEach(function (k) { if (yes.indexOf(k) < 0) yes.push(k); });
      (i === 0 ? p[3] : p[2]).concat(p[5]).forEach(function (k) { if (no.indexOf(k) < 0) no.push(k); });
    });
    return { yes: yes, no: no.filter(function (k) { return yes.indexOf(k) < 0; }) };
  }
  function appNeedsGen() {
    var app = B.pick(Object.keys(B.APPS)), A = B.APPS[app], s = sideOf(app);
    var text = function (k) { return B.ITEMS[k][0]; };
    return { prompt: "A " + low(A.name) + " works out " + A.job + ".\nPick every data item it needs.", answers: s.yes.map(text), wrong: s.no.map(text),
      working: ["Take one item at a time.", "Does it change " + A.job + "? Only then is it needed."],
      note: "It needs: " + s.yes.map(function (k) { return low(text(k)); }).join("; ") + "." };
  }
  function whyDiffGen() {
    var p = B.pick(B.PAIRS), side = B.rand(2), A = B.APPS[p[side]], Bp = B.APPS[p[1 - side]], k = B.pick(side ? p[3] : p[2]), t = low(B.ITEMS[k][0]);
    return { prompt: "Why does a " + low(A.name) + " need " + t + ", but a " + low(Bp.name) + " does not? Pick every true reason.",
      answers: ["It changes what the " + low(A.name) + " works out", "What the " + low(Bp.name) + " works out does not depend on it"],
      wrong: ["The " + low(Bp.name) + " already has it, so never asks", "It is easy for the " + low(A.name) + " to measure", "The " + low(A.name) + " is newer, so it stores more",
        "Every application must collect less data"],
      working: ["What does each application work out?", "Which of those answers changes when this data changes?"],
      note: t.charAt(0).toUpperCase() + t.slice(1) + " changes " + A.job + ", but not " + Bp.job + "." };
  }
  function whyBothGen() {
    var p = B.pick(B.PAIRS.filter(function (x) { return x[4].length; })), A = B.APPS[p[0]], Bp = B.APPS[p[1]], t = low(B.ITEMS[p[4][0]][0]);
    return { prompt: "A " + low(A.name) + " and a " + low(Bp.name) + " both need " + t + ". Why? Pick every true reason.",
      answers: ["It changes what the " + low(A.name) + " works out", "It changes what the " + low(Bp.name) + " works out"],
      wrong: ["One collects it, so the other copies it", "Every application needs the same data", "It is the easiest data to measure", "Both were made by the same company"],
      working: ["What does each one work out?", "Does this data change the first answer? The second?"],
      note: "It changes " + A.job + " and " + Bp.job + ", so both need it." };
  }
  function whyAppsTypedGen() {
    var ids = B.shuffle(Object.keys(B.APPS)), A = B.APPS[ids[0]], Bp = B.APPS[ids[1]];
    return { prompt: "A " + low(A.name) + " and a " + low(Bp.name) + " need different data. Why?",
      answer: "They work out different things, so their rules use different data.",
      re: /(?=.*\b(different|differ\w*|own|not\s+the\s+same)\b)(?=.*\b(outputs?|predict\w*|works?\s+out|jobs?|answers?|results?|questions?|do|does|tasks?|purposes?|things)\b)(?=.*\b(rules?|uses?|needs?|data|inputs?|depends?)\b)/i,
      wrong: ["They are made by different companies, so they cannot share any data.", "One is newer than the other, so it can store far more of the data.", "Every application must collect less data, so each one has a limit."],
      working: ["What does the " + low(A.name) + " work out? And the " + low(Bp.name) + "?", "What does a different output mean for the rule and its data?"],
      note: "The " + low(A.name) + " works out " + A.job + "; the " + low(Bp.name) + " works out " + Bp.job + ". Different outputs, so different rules and different data." };
  }

  // ---------------------------------------------------------------- why
  function whyExtraGen() {
    var m = B.pick(B.MODELS), ex = B.pick(m.extra);
    return { prompt: head(m) + "\nWhy does this model not need " + low(ex) + "? Pick every true reason.",
      answers: ["The rule never uses it", "It would not change the prediction"],
      wrong: ["It would make the prediction more correct", "It is too hard to measure", "A model must use all the data there is", "It turns the rule into a new rule"],
      working: ["Read the rule. Is this item anywhere in it?", "Can data the rule leaves out change what it works out?"],
      note: "The rule never uses " + low(ex) + ", so it cannot change the prediction." };
  }
  function whyNearGen() {
    var m = B.pick(B.MODELS), n = B.pick(m.near), d = B.dataOf(m, n.slot);
    return { prompt: head(m) + "\nThe rule needs " + low(d.text) + ". Why is " + low(n.text) + " the wrong data? Pick every true reason.",
      answers: ["It is not the data the rule asks for", "The prediction would not match the real system"],
      wrong: ["Old data is always more correct than new", "The rule does not use any numbers", "It makes the model run more slowly", "Computers cannot store data like this"],
      working: ["Is it about this system, now?", "What happens to the prediction when the rule gets the wrong number?"],
      note: n.why + " The rule gets the wrong number, so the prediction is wrong." };
  }
  function whyAppsGen() {
    return { prompt: "Why do different applications need different data? Pick every true reason.",
      answers: ["They work out different things", "Their rules use different data", "Data that changes nothing is not needed"],
      wrong: ["Newer applications always need more data", "Every application must collect the same data", "One piece of data can only be used once", "Bigger phones can store more of the data"],
      working: ["What does each application work out?", "Which data does each rule use?"],
      note: "Each application works out something different, so its rule uses different data." };
  }
}
function plenCards() {
  return [
    multi("pl-need-1", "pl-need", needGen),
    multi("pl-need-2", "pl-need", needGen),
    multi("pl-not-needed", "pl-need", notNeededGen),
    card("pl-count", "pl-need", countGen),
    multi("pl-design-1", "pl-need", designGen),
    multi("pl-design-2", "pl-need", designGen),
    card("pl-dir-1", "pl-missing", dirGen),
    card("pl-dir-2", "pl-missing", dirGen),
    card("pl-new-1", "pl-missing", newGen),
    card("pl-new-2", "pl-missing", newGen),
    explain("pl-why-missing", "pl-missing", whyMissingGen),
    card("pl-which-1", "pl-apps", whichGen),
    card("pl-which-2", "pl-apps", whichGen),
    multi("pl-app-needs", "pl-apps", appNeedsGen),
    multi("pl-why-diff", "pl-apps", whyDiffGen),
    multi("pl-why-both", "pl-apps", whyBothGen),
    explain("pl-why-apps-typed", "pl-apps", whyAppsTypedGen),
    multi("pl-why-extra", "pl-why", whyExtraGen),
    multi("pl-why-near", "pl-why", whyNearGen),
    multi("pl-why-apps", "pl-why", whyAppsGen)
  ];
}

const DRILLS = [
  ['y8-3-2-ext', 'Do Now Extension: 3.1 models, their parts, running a model and changing its data. Every card has a worked example on another draw.',
    'Year 8 Extension: 3.1 Challenge', '3.2 Do Now Extension',
    [['x-parts', 'Models and Their Parts'], ['x-run', 'Run the Model'], ['x-data', 'Change the Data']], [PRELUDE_31, MODEL_31], extCards],
  ['y8-3-2-data', 'Plenary: the data a model needs, missing or wrong data, and why applications need different data.',
    'Year 8, 3.2: Data Requirements for Models', 'Data a model needs',
    [['pl-need', 'Data a Model Needs'], ['pl-missing', 'Missing or Wrong Data'], ['pl-apps', 'Different Applications'], ['pl-why', 'Why?']],
    [BANK_SRC.replace(/^if \(typeof module[^\n]*\n?/m, ''), body(plenPrelude)], plenCards],
];
for (const [id, about, title, subtitle, cats, parts, fn] of DRILLS) {
  const src = `// Year 8, 3.2 Data Requirements for Models. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_y8_3_2.mjs: edit that (or ModelLab/bank.js), then run it. Every answer is worked out when the card is drawn.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {${parts.join('\n')}\n${body(fn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  const code = src.replace(/^\s*\/\/.*$/gm, '');
  // The Extension comes before every 3.2 term.
  if (id === 'y8-3-2-ext') assert(!/data requirement|\bapplications?\b|\bapps?\b|\bneeded\b/i.test(code), 'the Extension uses a 3.2 term');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does: its answer passes, no distractor passes, no working step or
// example gives the answer away, no length tell, and every Extension card has a worked example.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, Math };
    ctx.DrillData = { register: (k, d) => { ctx.out = d; ctx.key = k; } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(ctx.key === id, `${id} registers as ${ctx.key}`);
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
    for (const card of d.cards) {
      for (let n = 0; n < 300; n++) {
        const r = { ...card, ...card.randomize() };
        if (card.type === 'multi') {
          const all = r.answers.concat(r.distractors).map(String);
          assert(r.answers.length >= 1 && r.distractors.length >= 4 && new Set(all).size === all.length, `${id} ${card.id}: options ${JSON.stringify(all)}`);
          const longest = Math.max(...r.distractors.map((w) => String(w).length));
          for (const a of r.answers) assert(String(a).length <= 1.2 * longest, `${id} ${card.id}: "${a}" is clearly the longest option`);
          assert(r.working && r.working.length >= 2 && !r.working.some((w) => r.answers.some((a) => w.includes(a))), `${id} ${card.id}: nudges`);
          assert(!/[\u2013\u2014]/.test(JSON.stringify(r)), `${id} ${card.id}: dash`);
          continue;
        }
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        assert(pass(ans.toLowerCase()), `${id} ${card.id}: "${ans}" in lower case fails`);
        if (ans.length > 20 && r.distractors?.length) assert(ans.length <= 1.12 * Math.max(...r.distractors.map((w) => String(w).length)), `${id} ${card.id}: the answer is clearly the longest option ("${ans}")`);
        for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
        assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length && !r.distractors.map(String).includes(ans), `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        if (r.working && !inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
        assert(r.working && r.working.length === 2, `${id} ${card.id}: two nudges`);
        if (r.example) {
          const wholeRe = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!(ans.length >= 3 && wholeRe.test(r.example.toLowerCase()) && !wholeRe.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        }
        if (id === 'y8-3-2-ext') assert(r.example, `${id} ${card.id}: no worked example`);
        assert(!/[\u2013\u2014]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors])), `${id} ${card.id}: dash`);
      }
    }
    // Typed explain cards need two connected ideas: one idea alone fails, a good answer passes.
    if (id === 'y8-3-2-data') {
      const byId = Object.fromEntries(d.cards.map((c) => [c.id, c]));
      const fails = { 'pl-why-missing': ['It is missing.', 'The prediction will be wrong.', 'It needs the data.', 'The rule is wrong.'],
        'pl-why-apps-typed': ['They are different.', 'They need different data.', 'Because they are different apps.', 'They do different things.'] };
      const goods = { 'pl-why-missing': ['the rule needs it and it is blank so the answer is wrong', 'without it the model uses 0 so the prediction is too high', 'the rule uses that number, so if it is missing the prediction will be wrong'],
        'pl-why-apps-typed': ['they work out different things so they need different data', 'they do different jobs, so their rules use different data', 'each one predicts something different, so it needs its own data'] };
      for (const [cid, list] of Object.entries(fails)) { const r = byId[cid].randomize(); for (const s of list) assert(!r.keywords.some((k) => k.test(s)), `${cid}: one idea "${s}" passes`); }
      for (const [cid, list] of Object.entries(goods)) { const r = byId[cid].randomize(); for (const s of list) assert(r.keywords.some((k) => k.test(s)), `${cid}: good answer "${s}" fails`); }
      const dir = byId['pl-dir-1'];
      for (let n = 0; n < 200; n++) {
        const r = dir.randomize(), ok = (s) => r.keywords[0].test(s);
        const a = r.answers[0];
        const forms = { Higher: ['higher', 'it will be higher', 'bigger', 'more', 'it goes up'], Lower: ['lower', 'it is lower', 'smaller', 'less', 'fewer'], 'The same': ['the same', 'same', 'no change', 'it stays the same', "it doesn't change"] }[a];
        forms.forEach((f) => assert(ok(f), `pl-dir accepts "${f}" for ${a}`));
      }
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: a surgical edit (add this id after
// y8-3-1-models), re-reading the file just before writing so another builder's change is never lost.
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y8-3-1-models"(\r?\n)([ \t]*)\]/.exec(raw);
    assert(m, 'y8-3-1-models is the last lesson of its unit in lessons.json');
    const out = raw.slice(0, m.index) + `\n${m[1]}"y8-3-1-models",${m[2]}${m[1]}"${ID}"${m[2]}${m[3]}]` + raw.slice(m.index + m[0].length);
    JSON.parse(out);
    assert(fs.readFileSync(lp, 'utf8') === raw, 'lessons.json changed while building: run the builder again');
    fs.writeFileSync(lp, out);
  }
  const all = JSON.parse(fs.readFileSync(lp, 'utf8'));
  const unit = all.years.find((y) => y.id === 'year8').units.find((u) => u.lessons.includes(ID));
  console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; unit: ${unit.title} [${unit.lessons.join(', ')}]`);
}
