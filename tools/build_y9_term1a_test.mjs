// Builds LessonData/y9-term1a-test.json: Year 9, Term 1a Test, and registers it in the Year 9 "Algorithm Design and
// Text Programming" unit after 2.6.
//   node tools/build_y9_term1a_test.mjs
// James, 2026-10-05: 20 minutes of revision with the y9-term1a-revision drill (similar questions to the test, never
// the same), then the 30-minute test on the site's Tests page. The test itself lives in the shell (TestBank.gs) and
// opens for a class only once James sets its start time in the dashboard. The revision drill takes the place of the
// Do Now: it leans on what the 2.6 race showed was weakest (following code with a bug exactly, >= boundaries).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-term1a-test';
const P = 'y9t1a';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);

const steps = [];

steps.push({ id: 'title', label: 'Term 1a Test',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithm Design and Text Programming</p><h2 class="lesson-h2">Term 1a Test</h2><p>Year 9</p></div>' +
    facts(['<strong>First:</strong> 20 minutes of revision practice.',
      '<strong>Then:</strong> a 30-minute test on this website.',
      '<strong>Topics:</strong> number systems, loops, data types and arrays, errors and trace tables.']) +
    why('Which topic do you find hardest?', 'Practise that topic most in the next 20 minutes.') });

steps.push({ id: 'revision', label: 'Revision Practice', type: 'embedded-app', appId: 'drill-y9-term1a-revision', embedContainerId: `${P}-revision`,
  content: '<h2 class="lesson-h2">Revision Practice</h2>' +
    why('A program has a bug. Do you follow what it should do, or what it says?', 'What it says, one line at a time. Write every change in a trace table.') +
    '<p class="lesson-lead">20 minutes. The questions are like the test, with different numbers. Choose a topic or practise them all.</p>' +
    `<div id="${P}-revision"></div>` });

steps.push({ id: 'how-it-works', label: 'How the Test Works',
  content: '<h2 class="lesson-h2">How the Test Works</h2>' +
    why('Your answers save as you type. Why does that help?', 'If the computer crashes, you lose nothing. Open the site again and carry on.') +
    facts(['You have <strong>30 minutes</strong> from when you press <strong>Start</strong>.',
      'Your answers <strong>save as you type</strong>.',
      'During the test you <strong>cannot open the rest of the website</strong>.',
      'The notepad works, but it starts <strong>empty</strong>. Your old notes come back after the test.',
      'Press <strong>Hand in</strong> when you finish. When time runs out, it hands in for you.']) });

steps.push({ id: 'test', label: 'The Test', type: 'app-link', appId: 'tests', buttonId: `${P}-open-test`,
  content: '<h2 class="lesson-h2">The Test</h2>' +
    why('You finish early. What should you do?', 'Check every answer. Trace each program again, one line at a time.') +
    '<p class="lesson-lead">Wait until your teacher says the test is open. Then press the button, and press Start.</p>' +
    `<p><button type="button" class="donow-btn" id="${P}-open-test">Open the test</button></p>` });

const lesson = { id: ID, label: 'Term 1a Test', steps, validators: {}, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 9, after 2.6 in the Algorithm Design and Text Programming unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y9 = all.years.find((y) => y.id === 'year9');
const unit = y9.units.find((u) => u.title === 'Algorithm Design and Text Programming');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y9-2-6-errors') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps; unit: ${unit.lessons.join(', ')}`);
