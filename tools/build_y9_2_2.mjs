// Builds LessonData/y9-2-2-loops.json: Year 9, 2.2 Loops and Combined Constructs.
//   node tools/build_y9_2_2.mjs
// Objectives (Term 1a plan): develop text-based programs with count-controlled loops; combine sequence,
// selection and count-controlled iteration; predict the outcome of an algorithm that uses count-controlled
// iteration (9P.03, 9CT.06, 9CT.07, 9CT.09). Only what Year 9 has met is used: DECLARE, assignment, INPUT,
// OUTPUT, FOR ... TO ... NEXT and IF ... THEN ... ELSE ... ENDIF, with IF ... THEN on one line (the layout the
// drill interpreter and the Trace Tables translation use). No STEP, MOD, DIV, WHILE or REPEAT.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-2-2-loops';
const P = 'y9l22';                       // prefix for element ids
const A = '&larr;';                      // assignment arrow on slides
const ARROW = '\\s*(<-|\u2190)\\s*';     // typed answers accept <- or the arrow
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&(?!(larr|nbsp|amp|lt|gt);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function codeBlock(lines, numbered = false) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = esc(l.trim()).replace(/&amp;larr;/g, A).replace(/&lt;-/g, A);
    const num = numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : '';
    return '<div class="lesson-code-line">' + num + '&nbsp;'.repeat(lead) + text + '</div>';
  }).join('') + '</div>';
}

const validators = {};
// A short-answer card: parts = [{ label, answer: regex source, feedback, long? }]
function checkStep(id, label, heading, lead, parts, extra = '', source = '') {
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
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div>` +
    (source ? `<p class="exam-source">${source}</p>` : '') + '</div>';
  return {
    id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    // A program sits beside its questions, so the slide fits a laptop screen without shrinking.
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card),
  };
}
const num = (n) => `^\\s*${n}\\s*$`;

const steps = [];

// ---------------------------------------------------------------- Do Now: Unit 1, real questions
steps.push({ id: 'do-now', label: 'Do Now: Question 1', type: 'exam-do-now', questionSetKey: 'y10-1-1-l3-plenary',
  content: '<h2 class="lesson-h2">Do Now</h2><p class="lesson-lead">A recap question from Unit 1, Number Systems: hexadecimal to denary.</p><div id="donow-root"></div>' });
steps.push({ id: 'do-now-2', label: 'Do Now: Question 2', type: 'exam-do-now', questionSetKey: 'y10-1-1-l2', trackingSuffix: '-2',
  content: '<h2 class="lesson-h2">Do Now</h2><p class="lesson-lead">One more from Unit 1: denary to binary.</p><div id="donow-root"></div>' });

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Loops and Combined Constructs',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithm Design and Text Programming</p><h2 class="lesson-h2">Loops and Combined Constructs</h2><p>Year 9, 2.2</p></div>' +
    '<ul class="lesson-facts"><li><strong>Concept:</strong> The count-controlled loop: FOR ... TO ... NEXT.</li>' +
    '<li><strong>Activity 1:</strong> Trace a loop in a trace table and predict what it outputs.</li>' +
    '<li><strong>Activity 2:</strong> Write loops that are run and checked straight away.</li>' +
    '<li><strong>Also today:</strong> Putting decisions inside loops.</li></ul>' });

// ---------------------------------------------------------------- concept 1
steps.push({ id: 'concept', label: 'Count-Controlled Loops',
  content: '<h2 class="lesson-h2">Count-Controlled Loops</h2><p class="lesson-lead">A count-controlled loop repeats its lines a set number of times. In Cambridge pseudocode it is written FOR ... TO ... NEXT.</p>' +
    codeBlock(['DECLARE Count : INTEGER', 'FOR Count <- 1 TO 5', '    OUTPUT "Hello"', 'NEXT Count']) +
    '<ul class="lesson-facts"><li>The <strong>counter</strong> (Count) must be declared first, as an INTEGER.</li>' +
    '<li>Count starts at the first value (1) and goes up by 1 on each pass, up to the last value (5).</li>' +
    '<li>The lines between FOR and NEXT run once per pass: here, 5 times.</li>' +
    '<li>Number of passes = last value &minus; first value + 1.</li></ul>' });

steps.push(checkStep('check-loops', 'Check: Reading a FOR Loop', 'Check: Reading a FOR Loop',
  'Use this loop for parts (a) and (b).',
  [
    { label: 'How many times does the loop run?', answer: num('7(\\s*times?)?'), feedback: 'Count takes 3, 4, 5, 6, 7, 8 and 9: that is 9 - 3 + 1 = 7 passes.' },
    { label: 'What is the last value this loop outputs?', answer: num('9'), feedback: 'The last pass is when Count equals the TO value, 9.' },
    { label: 'Write the FOR line for a loop where Count goes from 1 to 20.', answer: `^\\s*for\\s+count${ARROW}1\\s+to\\s+20\\s*$`, feedback: 'FOR, the counter, the arrow and the first value, then TO and the last value: FOR Count <- 1 TO 20.' },
  ],
  codeBlock(['DECLARE Count : INTEGER', 'FOR Count <- 3 TO 9', '    OUTPUT Count', 'NEXT Count'])));

// ---------------------------------------------------------------- worked example (student steps through)
steps.push({ id: 'worked', label: 'Worked Example: Trace a Loop', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-worked`,
  embedQuery: 'view=walkthrough&lang=cambridge', embedView: 'walkthrough',
  algorithm: {
    title: 'Adding in a Loop',
    context: 'Step through the program one line at a time and watch the trace table fill in.',
    code: ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total = 0', 'for Count in range(1, 4):', '    Total = Total + 5', 'print(Total)'],
    cols: ['Line', 'Total', 'Count', 'Output'],
    answers: [
      { Line: '3', Total: '0', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '1', Output: '' }, { Line: '5', Total: '5', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '2', Output: '' }, { Line: '5', Total: '10', Count: '', Output: '' },
      { Line: '4', Total: '', Count: '3', Output: '' }, { Line: '5', Total: '15', Count: '', Output: '' },
      { Line: '6', Total: '', Count: '', Output: '15' },
    ],
  },
  content: `<h2 class="lesson-h2">Worked Example: Trace a Loop</h2><p class="lesson-lead">Step through the loop and watch Count and Total change on every pass.</p><div id="${P}-embed-worked" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- activity 1: trace a loop yourself
steps.push({ id: 'activity-1', label: 'Activity 1: Trace a Loop', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Doubling in a Loop',
    context: 'Complete the trace table for this program.',
    code: ['DECLARE Score : INTEGER', 'DECLARE Count : INTEGER', 'Score = 1', 'for Count in range(1, 5):', '    Score = Score * 2', 'print(Score)'],
    cols: ['Line', 'Score', 'Count', 'Output'],
    answers: [
      { Line: '3', Score: '1', Count: '', Output: '' },
      { Line: '4', Score: '', Count: '1', Output: '' }, { Line: '5', Score: '2', Count: '', Output: '' },
      { Line: '4', Score: '', Count: '2', Output: '' }, { Line: '5', Score: '4', Count: '', Output: '' },
      { Line: '4', Score: '', Count: '3', Output: '' }, { Line: '5', Score: '8', Count: '', Output: '' },
      { Line: '4', Score: '', Count: '4', Output: '' }, { Line: '5', Score: '16', Count: '', Output: '' },
      { Line: '6', Score: '', Count: '', Output: '16' },
    ],
  },
  content: `<h2 class="lesson-h2">Activity 1: Trace a Loop</h2><p class="lesson-lead">Fill in a row whenever a variable changes or something is output.</p><div id="${P}-embed-1" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- exam question (adapted, real)
const CHECK_DIGIT = codeBlock(['DECLARE Total : INTEGER', 'DECLARE Digit : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 10', '    OUTPUT "Please enter digit ", Count', '    INPUT Digit', '    Total <- Total + (Digit / Count)', 'NEXT Count', 'OUTPUT "The total is ", Total'], true);
const CHECK_DIGIT_LEAD = 'This algorithm should input the 5 digits of a number, one at a time, and total each digit multiplied by its position (the first digit is in position 1). It contains two errors.';
const CHECK_DIGIT_SOURCE = 'Adapted from Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 6(a)';
steps.push(checkStep('exam-errors', 'Exam Question: Find the Errors (1 of 2)', 'Exam Question: Find the Errors', CHECK_DIGIT_LEAD,
  [
    { label: 'Give the line number of the error in the loop.', answer: '^\\s*(line\\s*)?0?5\\s*$', feedback: 'Line 05: a 5-digit number needs 5 passes, but the loop runs 10 times.' },
    { label: 'Write the corrected line.', answer: `^\\s*for\\s+count${ARROW}1\\s+to\\s+5\\s*$`, feedback: 'FOR Count <- 1 TO 5 runs once for each of the 5 digits.' },
  ], CHECK_DIGIT, CHECK_DIGIT_SOURCE));
steps.push(checkStep('exam-errors-2', 'Exam Question: Find the Errors (2 of 2)', 'Exam Question: Find the Errors', CHECK_DIGIT_LEAD,
  [
    { label: 'Give the line number of the other error.', answer: '^\\s*(line\\s*)?0?8\\s*$', feedback: 'Line 08: each digit should be MULTIPLIED by its position, not divided.' },
    { label: 'Write the corrected line.', answer: `^\\s*total${ARROW}total\\s*\\+\\s*(\\(\\s*digit\\s*\\*\\s*count\\s*\\)|digit\\s*\\*\\s*count|\\(\\s*count\\s*\\*\\s*digit\\s*\\)|count\\s*\\*\\s*digit)\\s*$`, feedback: 'Total <- Total + (Digit * Count): * multiplies, / divides.' },
  ], CHECK_DIGIT, CHECK_DIGIT_SOURCE));

// ---------------------------------------------------------------- concept 2
steps.push({ id: 'concept-2', label: 'Decisions Inside Loops',
  content: '<h2 class="lesson-h2">Decisions Inside Loops</h2><p class="lesson-lead">Real programs combine all three constructs: sequence, selection (IF) and iteration (FOR).</p>' +
    '<div class="lesson-do-now-columns"><div>' +
    codeBlock(['DECLARE Passes : INTEGER', 'DECLARE Mark : INTEGER', 'DECLARE Count : INTEGER', 'Passes <- 0', 'FOR Count <- 1 TO 5', '    INPUT Mark', '    IF Mark >= 50 THEN', '        Passes <- Passes + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Passes']) +
    '</div><ul class="lesson-facts"><li><strong>Before the loop:</strong> set the starting value once (Passes &larr; 0).</li>' +
    '<li><strong>Inside the loop:</strong> the IF is checked on every pass, but Passes only goes up when it is TRUE.</li>' +
    '<li><strong>After the loop:</strong> output the result once, when the loop has finished.</li></ul></div>' });

steps.push(checkStep('check-combine', 'Check: Decisions Inside Loops', 'Check: Decisions Inside Loops',
  'This program runs, and the user types 45, 60, 50, 38, 72.',
  [
    { label: 'What does the program output?', answer: num('3'), feedback: '60, 50 and 72 are 50 or more (50 counts, because >= includes it): 3 passes.' },
    { label: 'How many times is the IF condition checked?', answer: num('5(\\s*times?)?'), feedback: 'The IF is inside the loop, so it is checked on all 5 passes.' },
    { label: 'Should Passes <- 0 go before, inside or after the loop?', answer: '^\\s*(it\\s+(goes|should\\s+go)\\s+)?before(\\s+the\\s+loop)?\\s*$', feedback: 'Before the loop: inside it, Passes would be reset to 0 on every pass.' },
  ],
  codeBlock(['DECLARE Passes : INTEGER', 'DECLARE Mark : INTEGER', 'DECLARE Count : INTEGER', 'Passes <- 0', 'FOR Count <- 1 TO 5', '    INPUT Mark', '    IF Mark >= 50 THEN', '        Passes <- Passes + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Passes'])));

// ---------------------------------------------------------------- activity 2: write loops (code drill)
steps.push({ id: 'activity-2', label: 'Activity 2: Write the Loop', type: 'embedded-app', appId: 'drill-y9-2-2-code', embedContainerId: `${P}-embed-2`,
  content: `<h2 class="lesson-h2">Activity 2: Write the Loop</h2><p class="lesson-lead">Write each program in Cambridge pseudocode. It is run with test values and checked straight away.</p><div id="${P}-embed-2"></div>` });

// ---------------------------------------------------------------- checked practice
steps.push(checkStep('practice', 'Checked Practice', 'Checked Practice', '',
  [
    { label: 'Predict what this program outputs.', answer: num('10'), feedback: 'Count 1 and 2 take the THEN branch (+3 each), Count 3 and 4 take ELSE (+2 each): 3 + 3 + 2 + 2 = 10.' },
    { label: 'A loop must run exactly 6 times, starting at 4. What number goes after TO?', answer: num('9'), feedback: 'Pass 1 is 4, so pass 6 is 9: FOR Count <- 4 TO 9.' },
  ],
  codeBlock(['DECLARE Score : INTEGER', 'DECLARE Count : INTEGER', 'Score <- 0', 'FOR Count <- 1 TO 4', '    IF Count <= 2 THEN', '        Score <- Score + 3', '    ELSE', '        Score <- Score + 2', '    ENDIF', 'NEXT Count', 'OUTPUT Score'])));

// ---------------------------------------------------------------- plenary drill
steps.push({ id: 'plenary', label: 'Plenary: Loops and Combined Constructs', type: 'embedded-app', appId: 'drill-y9-2-2-loops', embedContainerId: `${P}-plenary-drill`,
  content: `<h2 class="lesson-h2">Plenary: Loops and Combined Constructs</h2><div id="${P}-plenary-drill"></div>` });

const lesson = { id: ID, label: '2.2: Loops and Combined Constructs', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson));

// Register it in Year 9 (a new unit after Number Systems).
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y9 = all.years.find(y => y.id === 'year9');
let unit = y9.units.find(u => u.title === 'Algorithm Design and Text Programming');
if (!unit) { unit = { code: '', title: 'Algorithm Design and Text Programming', lessons: [] }; y9.units.push(unit); }
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
