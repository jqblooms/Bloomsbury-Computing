// Builds LessonData/y8-algorithms-l7.json: Year 8, Algorithms L7 Finding and Fixing Errors, and registers it in the
// Year 8 Algorithms unit after L6.
//   node tools/build_y8_l7.mjs
// Unit 8.1 plan: "identifying logical errors in algorithms and correcting them" and debugging tasks in flowcharts and
// pseudocode. L8 is the design rehearsal and L9 the unit assessment.
// Do Now: the y8-algorithms-l7-recap drill (two cards per lesson so far). Activities: Bug Hunt, pseudocode (fixes
// checked by running tests) then flowcharts. Exam questions: adapted from 0478/23 June 2026 Q4 and 0478/21 June 2026
// Q7 (find-the-errors questions; only the errors Year 8 can reach). Plenary: the y8-algorithms-l7 drill.
// Every algorithm on a slide is checked here with the pseudocode engine: the corrected version runs and gives the
// right output, so a slide can never show a "fixed" algorithm that does not work.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { runPseudocode } = require(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const ID = 'y8-algorithms-l7';
const P = 'y8l7';
const re = (source) => ({ __regex: true, source, flags: 'i' });

// ---------------------------------------------------------------- pieces
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function codeBlock(lines, mark = []) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const n = String(i + 1).padStart(2, '0');
    const text = esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length));
    return `<div class="lesson-code-line${mark.includes(i + 1) ? ' lesson-code-active' : ''}">${n}&nbsp;&nbsp;${text}</div>`;
  }).join('') + '</div>';
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b, cls = '') => `<div class="lesson-do-now-columns${cls ? ' ' + cls : ''}"><div>${a}</div><div>${b}</div></div>`;
const purpose = (text) => `<p class="lesson-purpose"><strong>What it should do:</strong> ${text}</p>`;
const task = (h, body) => `<div class="lesson-flow-task"><h3>${h}</h3>${body}</div>`;

const validators = {};
function mc(id, label, heading, lead, items) {
  return { id, label, type: 'multiple-choice', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2><p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
// parts = [{ label, answer: regex source, feedback }]; `beside` is shown to the left of the questions.
function checkStep(id, label, heading, lead, parts, beside = '', above = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} marks</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (beside ? columns(beside, above + card, 'is-code-wide') : above + card) };
}
function embed(id, label, appId, heading, lead) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
// A corrected line typed with any spacing and letter case; `<-` or the arrow.
function lineAnswer(...accepted) {
  const TOKEN = /"[^"]*"|<-|<=|>=|[A-Za-z_][A-Za-z0-9_]*|\d+|[\[\]():,+\-*/=<>]/g;
  const one = (l) => l.match(TOKEN).map((t) => t === '<-' ? '(<-|←)' : t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*');
  return '^\\s*(' + accepted.map(one).join('|') + ')\\s*$';
}
const KIND = { syntax: '^\\s*(a\\s+)?syntax(\\s+error)?\\s*$', logic: '^\\s*(a\\s+)?logic(al)?(\\s+error)?\\s*$' };

// Runs an algorithm and checks what it outputs, so every corrected algorithm on a slide is known to work.
function mustOutput(lines, inputs, expected, givens = {}) {
  const r = runPseudocode(lines.join('\n'), givens, 5000, inputs);
  const got = r.error ? 'error: ' + r.error.message : r.outputs.map(String).join(' | ');
  if (got !== expected.join(' | ')) throw new Error(`Algorithm check failed: expected ${expected.join(' | ')}, got ${got}\n${lines.join('\n')}`);
}

const steps = [];

// ---------------------------------------------------------------- Do Now
steps.push(embed('do-now', 'Do Now: Recap Drill', 'drill-y8-algorithms-l7-recap', 'Do Now: Recap Drill',
  'Ten questions, two from each lesson so far: L1 and L2 Sequence and Selection, L3 Arrays, L4 Linear Search, L5 Iteration and Data Types, and L6 Flowcharts.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Finding and Fixing Errors',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithms, Pseudocode and Python</p><h2 class="lesson-h2">Finding and Fixing Errors</h2><p>Year 8</p></div>' +
    facts(['Tell a syntax error from a logic error.', 'Find a logic error by testing with values and tracing.', 'Correct errors in pseudocode and in flowcharts.']) });

// ---------------------------------------------------------------- concept 1: two kinds of error
const syntaxExample = ['DECLARE Total : INTEGER', 'Total = 0', 'OUTPT Total'];
const logicExample = ['DECLARE Price, Cost : INTEGER', 'Price <- 4', 'Cost <- Price + 3', 'OUTPUT Cost'];
mustOutput(logicExample, [], ['7']);
steps.push({ id: 'concept', label: 'Two Kinds of Error',
  content: '<h2 class="lesson-h2">Two Kinds of Error</h2><p class="lesson-lead">An error in an algorithm is either a syntax error or a logic error.</p>' +
    facts([
      'A <strong>syntax error</strong> breaks a rule of writing the language, such as a misspelt keyword or <code>=</code> instead of <code>&lt;-</code>. The algorithm <strong>cannot run at all</strong>, and the error message gives the line.',
      'A <strong>logic error</strong> follows every rule, so the algorithm <strong>runs</strong>, but it gives the <strong>wrong output</strong>. Nothing tells you which line it is on.'
    ]) +
    columns(task('Syntax errors: line 2 and line 3', codeBlock(syntaxExample, [2, 3]) + '<p>Line 2 needs <code>&lt;-</code>; line 3 is misspelt.</p>'),
      task('Logic error: line 3', codeBlock(logicExample, [3]) + '<p>Cost should be 3 items at 4 each. It runs, but outputs 7, not 12: line 3 should use <code>*</code>.</p>')) });

steps.push(mc('check-kinds', 'Check: Syntax or Logic?', 'Check: Syntax or Logic?', 'Decide which kind of error each line has.', [
  { prompt: 'The algorithm should repeat 5 times. One line is: FOR Count 1 TO 5', options: ['Syntax error', 'Logic error'], correct: 0,
    explain: 'The arrow <- is missing, which breaks the rules of a FOR line, so the algorithm cannot run.' },
  { prompt: 'The algorithm should output "Pass" for a Mark of 50 or more. One line is: IF Mark < 50 THEN', options: ['Syntax error', 'Logic error'], correct: 1,
    explain: 'The line is written correctly, so it runs, but it sends the wrong marks to "Pass": a logic error.' }
]));

// ---------------------------------------------------------------- worked example: testing finds a logic error
const passBug = ['DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark > 50 THEN', '    OUTPUT "Pass"', 'ELSE', '    OUTPUT "Fail"', 'ENDIF'];
const passFixed = passBug.slice(); passFixed[2] = 'IF Mark >= 50 THEN';
mustOutput(passBug, [50], ['Fail']);
mustOutput(passFixed, [49], ['Fail']); mustOutput(passFixed, [50], ['Pass']); mustOutput(passFixed, [72], ['Pass']);
const testTable = '<table class="donow-table"><thead><tr><th>Test value</th><th>Should output</th><th>Actually outputs</th></tr></thead><tbody>' +
  '<tr><td>72</td><td>Pass</td><td>Pass</td></tr><tr><td>49</td><td>Fail</td><td>Fail</td></tr><tr><td><strong>50</strong></td><td><strong>Pass</strong></td><td><strong>Fail</strong></td></tr></tbody></table>';
steps.push({ id: 'testing', label: 'Finding a Logic Error: Test It',
  content: '<h2 class="lesson-h2">Finding a Logic Error: Test It</h2><p class="lesson-lead">Purpose: output "Pass" if Mark is 50 or more, otherwise "Fail".</p>' +
    columns(codeBlock(passBug),
      testTable + facts([
        'For each <strong>test value</strong>, work out what it <em>should</em> output from the purpose, then trace what it <em>actually</em> outputs.',
        'Test a value <strong>exactly on the limit</strong> (50 here), and one each side. 72 and 49 both look fine; only 50 shows the error.',
        'Trace 50 line by line: line 3 asks 50 &gt; 50, which is FALSE. The fix is line 3: <code>IF Mark &gt;= 50 THEN</code>.'
      ])) });

// ---------------------------------------------------------------- exam question 1: 0478/23 June 2026 Q4
const runners = ['DECLARE Runners : ARRAY[1:250] OF STRING', 'DECLARE Times : ARRAY[1:250] OF INTEGER', 'DECLARE Index : INTEGER',
  'DECLARE RunName : STRING', 'DECLARE RunTime : STRING', 'FOR Index <- 1 TO 250', '    OUTPUT "Enter name, then time in seconds"',
  '    INPUT RunName', '    OUTPUT RunTime', '    Runners[Index] <- RunMins', '    Times[Index] <- RunTime', 'NEXT Index'];
{
  const fixed = runners.slice(); fixed[4] = 'DECLARE RunTime : INTEGER'; fixed[8] = '    INPUT RunTime'; fixed[9] = '    Runners[Index] <- RunName';
  const small = fixed.map((l) => l.replace(/250/g, '2'));
  const r = runPseudocode(small.join('\n'), {}, 5000, ['Ana', '1500', 'Ben', '1720']);
  if (r.error || r.vars.Runners[1] !== 'Ben' || r.vars.Times[0] !== 1500) throw new Error('runners check failed: ' + JSON.stringify(r.error || r.vars));
}
steps.push(checkStep('exam-1', 'Exam Question: Find the Errors', 'Exam Question: Find the Errors',
  'Based on Cambridge IGCSE 0478/23, June 2026, Question 4(a).',
  [
    { line: true, label: 'Correct line 05.', answer: lineAnswer('DECLARE RunTime : INTEGER'),
      feedback: 'Line 05: what kind of value is a whole number of seconds? Keep the rest of the DECLARE line.' },
    { line: true, label: 'Correct line 09.', answer: lineAnswer('INPUT RunTime'),
      feedback: 'Line 09: the time has to come from the user before line 11 can store it.' },
    { line: true, label: 'Correct line 10.', answer: lineAnswer('Runners[Index] <- RunName'),
      feedback: 'Line 10: Runners holds names. Which variable holds the name that was just input?' }
  ], codeBlock(runners), purpose('Store 250 runners&apos; names and times (whole seconds) in Runners and Times. Three errors.')));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Bug Hunt, Pseudocode', 'bughunt-code', 'Activity 1: Bug Hunt, Pseudocode',
  'Fix 6 errors: click the line with the error, say syntax or logic, then type the corrected line.'));

// ---------------------------------------------------------------- exam question 2: 0478/21 June 2026 Q7
const average = ['DECLARE Counter, Total, Number : INTEGER', 'DECLARE Average : INTEGER',
  'Counter <- 0', 'Total <- 0', 'INPUT Number', 'WHILE Number > 0 DO', '    Total <- Total + 1', '    Counter <- Counter + 1', '    INPUT Number',
  'ENDWHILE', 'Average <- Counter / Total', 'OUTPUT Average'];
{
  const fixed = average.slice(); fixed[1] = 'DECLARE Average : REAL'; fixed[6] = '    Total <- Total + Number'; fixed[10] = 'Average <- Total / Counter';
  mustOutput(fixed, [4, 5, 0], ['4.5']);
  mustOutput(fixed, [6, 9, 12, 0], ['9']);
  mustOutput(average.map((l, i) => (i === 1 ? fixed[1] : l)), [6, 9, 12, 0], ['1']);   // the logic errors on their own: runs, wrong output
}
steps.push(checkStep('exam-2', 'Exam Question: Errors That Still Run', 'Exam Question: Errors That Still Run',
  'Based on Cambridge IGCSE 0478/21, June 2026, Question 7.',
  [
    { line: true, label: 'Correct line 02.', answer: lineAnswer('DECLARE Average : REAL'),
      feedback: 'Line 02: which data type holds a number with a decimal point?' },
    { line: true, label: 'Correct line 07.', answer: lineAnswer('Total <- Total + Number', 'Total <- Number + Total'),
      feedback: 'Line 07: test it with 6, 9, 12 then 0. Total should reach 27. What should be added each time round the loop?' },
    { line: true, label: 'Correct line 11.', answer: lineAnswer('Average <- Total / Counter'),
      feedback: 'Line 11: an average is the total divided by how many numbers there were.' }
  ], codeBlock(average), purpose('Input whole numbers until 0 is input, then output their average, such as 4.5. Three errors.')));

// ---------------------------------------------------------------- concept 2: errors in flowcharts
steps.push({ id: 'concept-flow', label: 'Errors in Flowcharts',
  content: '<h2 class="lesson-h2">Errors in Flowcharts</h2><p class="lesson-lead">A flowchart can have the same kinds of mistake. Check it box by box against the purpose.</p>' +
    facts([
      '<strong>The wrong shape</strong>: every box must use the symbol for its job. Ask for or display a value: Input/Output. Store or calculate a value: Process. A Yes/No question: Decision. Start and End: Terminal.',
      '<strong>The wrong question</strong>: a Decision that asks "Is Mark greater than 50?" when the purpose says 50 or more. Test a value exactly on the limit, as with pseudocode.',
      '<strong>The wrong path</strong>: follow the Yes path, then the No path. Each must do what the purpose says for that answer.',
      '<strong>A missing input</strong>: "Display the value of Age" before Age has been asked for. A value must be input before it is compared or used.'
    ]) });

steps.push(mc('check-flow', 'Check: Errors in Flowcharts', 'Check: Errors in Flowcharts', 'Two flowchart errors to find.', [
  { prompt: 'A flowchart should display "Pass" for a Mark of 50 or more. Its decision asks "Is Mark greater than 50?". Which Mark shows the error?', options: ['49', '50', '51', '100'], correct: 1,
    explain: '50 should pass, but "Is 50 greater than 50?" is No, so it goes down the wrong path. Every other value gets the right answer.' },
  { prompt: 'A flowchart box "Store Price * Quantity in Cost" is drawn as a parallelogram. Which symbol should it be?', options: ['Terminal', 'Input/Output', 'Decision', 'Process'], correct: 3,
    explain: 'Storing a calculated value is a Process, drawn as a rectangle. A parallelogram is for asking for or displaying a value.' }
]));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Bug Hunt, Flowcharts', 'bughunt-flow', 'Activity 2: Bug Hunt, Flowcharts',
  'Fix 6 flowcharts: click the box with the error, then choose the change that fixes it.'));

// ---------------------------------------------------------------- checked practice
steps.push(checkStep('practice', 'Checked Practice', 'Checked Practice', 'Syntax or logic, the value that shows the error, and a fix.', [
  { label: 'A line reads OUTPT Total. Is this a syntax error or a logic error?', answer: KIND.syntax,
    feedback: 'Could the computer understand a misspelt keyword? If not, the algorithm cannot run.' },
  { label: 'An algorithm should count the temperatures above 30, but uses IF Temps[Index] < 30 THEN. Syntax or logic error?', answer: KIND.logic,
    feedback: 'The line is written correctly, so the algorithm runs. Is its output right?' },
  { line: true, label: 'Write the corrected version of the line Count = Count + 1', answer: lineAnswer('Count <- Count + 1', 'Count <- 1 + Count'),
    feedback: 'Storing a value in a variable uses the arrow <-, not =.' },
  { label: 'Pass is 60 or more, but the algorithm uses IF Mark > 60 THEN. Which Mark value shows the error?', answer: '^\\s*60\\s*$',
    feedback: 'Try a value exactly on the limit: is it "60 or more"? Is it "more than 60"?' }
]));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Finding and Fixing Errors', 'drill-y8-algorithms-l7', 'Plenary: Finding and Fixing Errors',
  'Complete a drill batch. Your progress is saved for your teacher.'));

const lesson = { id: ID, label: 'L7: Finding and Fixing Errors', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 8, after L6.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y8 = all.years.find((y) => y.id === 'year8');
const unit = y8.units.find((u) => u.lessons.includes('y8-algorithms-l6'));
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y8-algorithms-l6') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
