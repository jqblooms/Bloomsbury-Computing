// Builds LessonData/y8-revision-1.json: Year 8, Revision 1: Reading Pseudocode, the first of two lessons before the
// Unit 1 assessment, and registers it in a Year 8 "Term 1 Exam Revision" unit.
//   node tools/build_y8_rev1.mjs
// L7 went beyond the class (James, 2026-10-01: low ability, mostly EAL), so this re-teaches the core the assessment
// will test, slowly: sequence (INPUT, OUTPUT, the arrow), selection, FOR loops and the four flowchart symbols. Short
// programs written the way L1 to L6 write them (IF ... THEN on one line, Yes/No decisions, DECLARE first). Every
// slide asks why (a teacher-only Think, Pair, Share), teaching slides are predict-then-reveal, and one slide puts two
// programs side by side. Plenary drill: y8-revision-1.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y8-revision-1';
const P = 'y8r1';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const code = (lines, numbered = false) => '<div class="lesson-code">' +
  lines.map((l, i) => `<div class="lesson-code-line">${numbered ? (i + 1) + '&nbsp;&nbsp;' : ''}${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length))}</div>`).join('') + '</div>';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const caption = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
function chart(flow, maxH = 380) {
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    FC.svg(flow, !!flow.numbered).replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `)
    .replace(/>True</g, '>Yes<').replace(/>False</g, '>No<') + '</div>';   // laid out by True/False, labelled the Year 8 way
}

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '', why = null) {
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
    content: `<h2 class="lesson-h2">${heading}</h2>` + (why ? tps(why[0], `<p>${why[1]}</p>`) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
function mcStep(id, label, heading, lead, items, why = null) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (why ? tps(why[0], `<p>${why[1]}</p>`) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`,
    items };
}
const num = (n) => `^\\s*${n}\\s*$`;
const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

const steps = [];

// ---------------------------------------------------------------- Do Now (L1)
steps.push(mcStep('do-now', 'Do Now: Key Words (1 of 2)', 'Do Now: Key Words (1 of 2)', 'From Lesson 1.', [
  { prompt: 'Which symbol stores a value in a variable?', options: ['=', '<-', '+', '>'], correct: 1, explain: 'The arrow <- stores the value on its right in the variable on its left.' },
  { prompt: 'Which keyword takes a value typed in by the user?', options: ['OUTPUT', 'DECLARE', 'INPUT'], correct: 2, explain: 'INPUT takes a value from the user.' },
], ['Why do we need both INPUT and OUTPUT?', 'INPUT brings a value in from the user. OUTPUT shows the answer back to them.']));
steps.push(checkStep('do-now-2', 'Do Now: Trace (2 of 2)', 'Do Now: Trace (2 of 2)', 'From Lesson 1. Trace the program.', [
  { label: 'What is the value of Number after line 2?', answer: num(4), feedback: 'Line 2 stores 4 in Number.' },
  { label: 'What is output?', answer: num(7), feedback: 'Line 3 adds 3 to the value from line 2.' },
], code(['DECLARE Number : INTEGER', 'Number <- 4', 'Number <- Number + 3', 'OUTPUT Number'], true),
  ['Why is the output not 4?', 'Line 3 changes Number before line 4 outputs it. The lines run in order.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Revision 1: Reading Pseudocode',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithms</p><h2 class="lesson-h2">Revision 1: Reading Pseudocode</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> read a program and say what it outputs.', '<strong>Three ideas:</strong> sequence, selection, loops. Then flowcharts.', '<strong>Next lesson:</strong> arrays and searching. <strong>Then:</strong> the assessment.']) +
    tps('Why do programmers write pseudocode before real code?', '<p>It is easy to read and check. You can plan the steps without worrying about a real language.</p>') });

// ---------------------------------------------------------------- key words
steps.push({ id: 'key-words', label: 'Key Words',
  content: '<h2 class="lesson-h2">Key Words</h2>' +
    tps('Which of these key words come in pairs? Why?', '<p>IF goes with ENDIF. FOR goes with NEXT. The second word shows where the block <strong>ends</strong>.</p>') +
    '<table class="donow-table" style="font-size:17px;width:100%">' +
    [['DECLARE Age : INTEGER', 'make a variable (a name for a value)'], ['Age &lt;- 12', 'store a value'], ['INPUT Age', 'take a value from the user'], ['OUTPUT Age', 'show a value'],
      ['IF ... THEN ... ELSE ... ENDIF', 'choose what to do (<strong>selection</strong>)'], ['FOR ... NEXT', 'repeat lines (<strong>a loop</strong>)']]
      .map((r) => `<tr><td style="padding:7px 12px;text-align:left;font-family:monospace">${r[0]}</td><td style="padding:7px 12px;text-align:left">${r[1]}</td></tr>`).join('') + '</table>' });

// ---------------------------------------------------------------- sequence
steps.push({ id: 'sequence', label: 'Sequence: One Line at a Time',
  content: '<h2 class="lesson-h2">Sequence: One Line at a Time</h2>' +
    tps('Predict: the user types 12. What is output? Why?', '<p>Output: <strong>13</strong>.</p><p>Line 2 stores 12 in Age. Line 3 adds 1. Line 4 shows Age. The lines run <strong>in order</strong>, one at a time: this is <strong>sequence</strong>.</p>', 'Show the worked answer') +
    columns(code(['DECLARE Age : INTEGER', 'INPUT Age', 'Age <- Age + 1', 'OUTPUT Age'], true),
      facts(['The computer runs <strong>line 1</strong>, then <strong>line 2</strong>, then <strong>line 3</strong>.', 'Write down the value after each line.', 'A new value <strong>replaces</strong> the old one.'])) });
steps.push(checkStep('sequence-check', 'Check: Sequence', 'Check: Sequence', null, [
  { label: 'What is the value of A after line 5?', answer: num(7), feedback: 'Line 5 adds B to A. What are A and B before line 5?' },
  { label: 'What is the value of B at the end?', answer: num(2), feedback: 'Does any line after line 4 change B?' },
], code(['DECLARE A : INTEGER', 'DECLARE B : INTEGER', 'A <- 5', 'B <- 2', 'A <- A + B', 'OUTPUT A'], true),
  ['Why does B stay 2?', 'No line after line 4 stores a new value in B.']));

// ---------------------------------------------------------------- selection
const PASS = ['DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark >= 50 THEN', '  OUTPUT "Pass"', 'ELSE', '  OUTPUT "Fail"', 'ENDIF'];
steps.push({ id: 'selection', label: 'Selection: Choosing a Path',
  content: '<h2 class="lesson-h2">Selection: Choosing a Path</h2>' +
    tps('Predict: the user types 70. Then 30. What is output each time? Why only one OUTPUT?',
      '<p>70: 70 &gt;= 50 is TRUE, so <strong>Pass</strong>. 30: FALSE, so <strong>Fail</strong>.</p><p>IF chooses <strong>one</strong> path. TRUE runs the THEN line. FALSE runs the ELSE line.</p>', 'Show the worked answer') +
    columns(code(PASS, true), facts(['<code>&gt;=</code> means <strong>more than or equal to</strong>.', '<code>&gt;</code> means <strong>more than</strong>.', 'TRUE: the line after <strong>THEN</strong> runs.', 'FALSE: the line after <strong>ELSE</strong> runs.', '<strong>ENDIF</strong> ends the choice.'])) });
steps.push({ id: 'compare', label: 'Compare: >= and >',
  content: '<h2 class="lesson-h2">Compare: &gt;= and &gt;</h2>' +
    tps('The user types 50 into both. What does each one output? Why are they different?',
      '<p>A outputs <strong>Pass</strong>: 50 &gt;= 50 is TRUE.</p><p>B outputs <strong>Fail</strong>: 50 &gt; 50 is FALSE. 50 is not more than 50.</p>') +
    columns(caption('Program A') + code(['INPUT Mark', 'IF Mark >= 50 THEN', '  OUTPUT "Pass"', 'ELSE', '  OUTPUT "Fail"', 'ENDIF']),
      caption('Program B') + code(['INPUT Mark', 'IF Mark > 50 THEN', '  OUTPUT "Pass"', 'ELSE', '  OUTPUT "Fail"', 'ENDIF'])) });
steps.push(checkStep('selection-check', 'Check: Selection', 'Check: Selection', null, [
  { label: 'The user types 30. What is output?', answer: word('hot'), feedback: 'Is 30 more than 25? TRUE runs the THEN line.' },
  { label: 'The user types 25. What is output?', answer: word('cold'), feedback: 'Is 25 more than 25? Read the > carefully.' },
  { label: 'The user types 25. Which line number runs: 5 or 7?', answer: num(7), feedback: 'FALSE runs the line after ELSE.' },
], code(['DECLARE Temp : INTEGER', 'INPUT Temp', 'IF Temp > 25 THEN', '  OUTPUT "Hot"', 'ELSE', '  OUTPUT "Cold"', 'ENDIF'], true),
  ['Why does 25 give Cold?', '25 is not more than 25, so Temp > 25 is FALSE.']));

// ---------------------------------------------------------------- loops
steps.push({ id: 'loop', label: 'Loops: Repeating Lines',
  content: '<h2 class="lesson-h2">Loops: Repeating Lines</h2>' +
    tps('Predict: how many times is Hi output? Why use a loop, and not write OUTPUT four times?',
      '<p>Count goes 1, 2, 3, 4, so Hi is output <strong>4 times</strong>.</p><p>A loop is shorter. To output it 100 times, you only change 4 to 100.</p>', 'Show the worked answer') +
    columns(code(['DECLARE Count : INTEGER', 'FOR Count <- 1 TO 4', '  OUTPUT "Hi"', 'NEXT Count'], true),
      facts(['<strong>FOR Count &lt;- 1 TO 4</strong>: Count starts at 1 and goes up to 4.', 'The lines between FOR and NEXT run <strong>once for each value</strong>.', '<strong>NEXT</strong> adds 1 to Count and goes back to the top.'])) });

// activity 1: a running total in Trace Tables (Python in, Cambridge pseudocode shown)
steps.push({ id: 'activity-1', label: 'Activity 1: Trace a Loop', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Adding in a Loop',
    context: 'Complete the trace table. Write a new row each time Total or Count changes, or something is output.',
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
  content: '<h2 class="lesson-h2">Activity 1: Trace a Loop</h2>' +
    tps('Why does Total start at 0?', '<p>Nothing has been added yet. If it started at 5, the total would be 5 too big.</p>') +
    `<div id="${P}-embed-1" class="lesson-embed"></div>` });

steps.push(checkStep('loop-check', 'Check: Loops', 'Check: Loops', null, [
  { label: 'How many times does line 5 run?', answer: num(3) + '|^\\s*3\\s*times?\\s*$', feedback: 'Count goes 1, 2, 3. Line 5 runs once for each value.' },
  { label: 'What is output?', answer: num(6), feedback: 'Total starts at 0. Add 2 each time line 5 runs.' },
], code(['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '  Total <- Total + 2', 'NEXT Count', 'OUTPUT Total'], true),
  ['Why is OUTPUT after NEXT, not inside the loop?', 'So the total is shown once, at the end. Inside the loop it would be shown every time.']));

// ---------------------------------------------------------------- flowcharts
const flow = Object.assign({ nodes: [
  { id: 's', type: 'terminal', text: 'Start' }, { id: 'i', type: 'io', text: 'INPUT Mark' }, { id: 'd', type: 'decision', text: 'Mark >= 50?' },
  { id: 'p', type: 'io', text: 'OUTPUT "Pass"' }, { id: 'f', type: 'io', text: 'OUTPUT "Fail"' }, { id: 'e', type: 'terminal', text: 'End' },
], edges: [
  { from: 's', to: 'i', label: null }, { from: 'i', to: 'd', label: null }, { from: 'd', to: 'p', label: 'True' }, { from: 'd', to: 'f', label: 'False' },
  { from: 'p', to: 'e', label: null }, { from: 'f', to: 'e', label: null },
] }, { numbered: true });
const SYM = {
  terminal: '^\\s*(an?\\s+)?(terminal|terminator|start\\s*(\\/|or|and)?\\s*end)(\\s+(symbol|shape|box))?\\s*$',
  io: '^\\s*(an?\\s+)?(input\\s*(\\/|or|and)?\\s*output|input|output)(\\s+(symbol|shape|box))?\\s*$',
  decision: '^\\s*(an?\\s+)?(decision|diamond)(\\s+(symbol|shape|box))?\\s*$',
};
steps.push({ id: 'flowchart', label: 'Flowcharts: The Same Program',
  content: '<h2 class="lesson-h2">Flowcharts: The Same Program</h2>' +
    tps('This flowchart and this pseudocode do the same thing. Which shape is the IF? Why does it have two arrows?',
      '<p>The <strong>diamond</strong> (Decision) is the IF.</p><p>It has two arrows because there are two paths: <strong>Yes</strong> (TRUE, the THEN line) and <strong>No</strong> (FALSE, the ELSE line).</p>') +
    columns(chart(flow, 380), code(PASS) + facts(['Rounded box: <strong>Terminal</strong> (Start, End)', 'Rectangle: <strong>Process</strong> (store a value)', 'Sloping box: <strong>Input/Output</strong>', 'Diamond: <strong>Decision</strong> (IF)'])) });
steps.push(checkStep('flowchart-check', 'Check: Flowchart Symbols', 'Check: Flowchart Symbols', null, [
  { label: 'What is the name of the shape for box 3?', answer: SYM.decision, feedback: 'Box 3 asks a question. It has a Yes and a No arrow.' },
  { label: 'What is the name of the shape for box 6?', answer: SYM.terminal, feedback: 'Box 6 shows where the flowchart stops.' },
  { label: 'Mark is 40. Which box number runs: 4 or 5?', answer: num(5), feedback: 'Is 40 >= 50? Follow the No arrow if it is FALSE.' },
], chart(flow, 380), ['Why is box 2 a sloping box?', 'It takes a value in from the user. Input and output use the sloping box.']));

// activity 2: Flowchart Blitz, flowchart to pseudocode (met in L6)
steps.push({ id: 'activity-2', label: 'Activity 2: Flowchart to Pseudocode', type: 'app-link', buttonId: `${P}-activity2-btn`, appId: 'flowchartblitz',
  content: '<h2 class="lesson-h2">Activity 2: Flowchart to Pseudocode</h2>' +
    tps('Why does a Decision become IF ... THEN ... ELSE ... ENDIF?', '<p>A Decision chooses between two paths. IF chooses between the THEN line and the ELSE line.</p>') +
    '<p class="lesson-lead">Open Flowchart Blitz. Choose <strong>Flowchart to Pseudocode</strong>.</p>' +
    facts(['Read the flowchart from Start to End.', 'Write one line for each shape.', 'Start with DECLARE for each new variable.']) +
    `<div class="lesson-app-link"><button type="button" class="donow-btn" id="${P}-activity2-btn">Open Flowchart Blitz</button></div>` });

// ---------------------------------------------------------------- plenary
steps.push({ id: 'plenary', label: 'Plenary: Revision 1 Drill', type: 'embedded-app', appId: 'drill-y8-revision-1', embedContainerId: `${P}-plenary`,
  content: '<h2 class="lesson-h2">Plenary: Revision 1 Drill</h2>' +
    tps('Why practise with new numbers every time?', '<p>If you can do it with any numbers, you really understand it.</p>') +
    `<p class="lesson-lead">Key words, sequence, selection and loops. Your progress is saved.</p><div id="${P}-plenary"></div>` });

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now-2', 0, '4') && !T('do-now-2', 0, '7') && T('do-now-2', 1, '7') && !T('do-now-2', 1, '4'), 'dn2');
assert(T('sequence-check', 0, '7') && !T('sequence-check', 0, '5') && T('sequence-check', 1, '2') && !T('sequence-check', 1, '7'), 'seq');
assert(T('selection-check', 0, 'Hot') && T('selection-check', 0, '"Hot"') && !T('selection-check', 0, 'Cold') && T('selection-check', 1, 'cold') && !T('selection-check', 1, 'hot') && T('selection-check', 2, '7') && !T('selection-check', 2, '5'), 'sel');
assert(T('loop-check', 0, '3') && T('loop-check', 0, '3 times') && !T('loop-check', 0, '2') && T('loop-check', 1, '6') && !T('loop-check', 1, '2'), 'loop');
assert(T('flowchart-check', 0, 'decision') && T('flowchart-check', 0, 'a diamond') && !T('flowchart-check', 0, 'process') && T('flowchart-check', 1, 'Terminal') && T('flowchart-check', 1, 'start/end') && !T('flowchart-check', 1, 'decision') && T('flowchart-check', 2, '5') && !T('flowchart-check', 2, '4'), 'flow');
assert(FC.svg(flow, true).includes('<svg'), 'flowchart svg');

const lesson = { id: ID, label: 'Revision 1: Reading Pseudocode', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 8, in a Term 1 Exam Revision unit after the Algorithms unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y8 = all.years.find((y) => y.id === 'year8');
let unit = y8.units.find((u) => u.title === 'Term 1 Exam Revision');
if (!unit) { unit = { code: '', title: 'Term 1 Exam Revision', lessons: [] }; y8.units.push(unit); }
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
