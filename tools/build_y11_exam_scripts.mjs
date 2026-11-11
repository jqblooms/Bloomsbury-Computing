// Builds LessonData/y11-exam-scripts.json: Year 11 independent practice, "Exam Scripts: Robots and the CPU". One
// What to do slide, then the Exam Scripts app (pages ExamScripts/, registry id exam-scripts) on its own slide.
//   node tools/build_y11_exam_scripts.mjs
// It adds an "Exam Practice" unit at the end of Year 11 in lessons.json (once). The scripts and their mark scheme
// sources are in ExamScripts/js/scripts.js; the logic test is tools/test_exam_scripts.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-exam-scripts';
const P = 'y11-es';
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

const steps = [
  {
    id: 'what-to-do', label: 'What to Do',
    content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Exam Practice</p><h2 class="lesson-h2">Exam Scripts: Robots and the CPU</h2><p>Year 11</p></div>' +
      '<p class="lesson-lead"><strong>What to do:</strong> learn real Paper 1 answers by writing them. Go to the next slide and start.</p>' +
      '<ul class="lesson-facts">' +
      '<li>Each script is a short exam answer from a real mark scheme: robots, sensors and AI, and the CPU and the fetch-decode-execute cycle.</li>' +
      '<li>First you copy the answer. Each time you get full marks, you get less help, until you write it in a blank box.</li>' +
      '<li>If you miss a mark point, you see what the mark needs, and some help comes back.</li>' +
      '<li>A script is <strong>secure</strong> when you write it from a blank box twice, with other scripts in between.</li>' +
      '<li>Keep going until every script is secure. Your progress is saved, so you can stop and come back on any computer.</li>' +
      '</ul>'
  },
  {
    id: 'scripts', label: 'Exam Scripts', type: 'embedded-app', appId: 'exam-scripts', embedContainerId: `${P}-scripts`,
    content: `<h2 class="lesson-h2">Exam Scripts</h2><div id="${P}-scripts"></div>`
  }
];

const all = JSON.stringify(steps);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

const lesson = { id: ID, label: 'Exam Scripts: Robots and the CPU', steps, validators: {}, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: an Exam Practice unit at the end of Year 11
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const y11 = (data.years || data).find((y) => y.id === 'year11');
    assert(y11, 'year11 in lessons.json');
    y11.units.push({ code: '', title: 'Exam Practice', lessons: [ID] });
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps`);
