// Builds LessonData/y8-revision-2.json: Year 8, Revision 2: Arrays and Searching, the second and last lesson before
// the Unit 1 assessment, and registers it in the Year 8 "Term 1 Exam Revision" unit after y8-revision-1.
//   node tools/build_y8_rev2.mjs
// Revision 1 re-taught sequence, selection, FOR loops and the four flowchart symbols, and told the class the next lesson
// would be arrays and searching. The unit's other assessable content (L3 Arrays and L4 Linear Search, 8CT.04/8CT.05 in
// the 0860 scheme, read with trace tables) is taught here, slowly, for a low-ability, mostly EAL class: an array's
// index and value, adding up an array in a loop, and a linear search with a Found flag. Then mixed practice across
// the unit in the style of the test (Year 8 has no exam board papers, so no citations), then the plenary drill.
// Programs are written the way L1 to L6 write them (IF ... THEN on one line, DECLARE first). Every slide asks why
// (a teacher-only Think, Pair, Share), teaching slides are predict-then-reveal, and two slides compare side by side.
// Every program on a slide is run through shared/pseudocode-engine.js here, so each answer is checked by running it.
// Do Now: two recap slides on Revision 1, each with a Walk me through it, then the y8-revision-2-ext drill.
// Plenary drill: y8-revision-2.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { runPseudocode } = require(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const ID = 'y8-revision-2';
const P = 'y8r2';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const codeLine = (l) => esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length));
const code = (lines, numbered = false, tight = false) => `<div class="lesson-code"${tight ? ' style="line-height:1.25;padding-top:10px;padding-bottom:10px"' : ''}>` +
  lines.map((l, i) => `<div class="lesson-code-line">${numbered ? (i + 1) + '&nbsp;&nbsp;' : ''}${codeLine(l)}</div>`).join('') + '</div>';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const caption = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const cell = 'padding:5px 12px;text-align:center;font:700 17px var(--font-mono, monospace)';
function arrayTable(name, values) {
  return `<p style="margin:0 0 6px"><strong>${name}</strong></p><table class="donow-table" style="margin:0 0 8px">` +
    `<tr><th style="${cell};text-align:left">Index</th>${values.map((v, i) => `<td style="${cell};color:var(--muted)">${i + 1}</td>`).join('')}</tr>` +
    `<tr><th style="${cell};text-align:left">Value</th>${values.map((v) => `<td style="${cell}">${v}</td>`).join('')}</tr></table>`;
}
const tcell = 'padding:4px 10px;text-align:center;font:600 16px var(--font-mono, monospace)';
const trace = (head, rows) => '<table class="donow-table" style="margin:0 auto">' +
  '<tr>' + head.map((h) => `<th style="${tcell}">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="${tcell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';

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
const num = (n) => `^\\s*${n}\\s*$`;
const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// Run a program (with any hidden setup lines first) and return its outputs and variables.
function run(lines, inputs = [], setup = []) {
  const r = runPseudocode(setup.concat(lines).join('\n'), {}, 5000, inputs.map(String));
  if (r.error) throw new Error(`Program failed: ${r.error.message}\n${lines.join('\n')}`);
  return r;
}
const fill = (name, type, values) => [`DECLARE ${name} : ARRAY[1:${values.length}] OF ${type}`]
  .concat(values.map((v, i) => `${name}[${i + 1}] <- ${type === 'STRING' ? '"' + v + '"' : v}`));
const out = (lines, inputs, setup) => run(lines, inputs, setup).outputs.map(String).join(' | ');

// ---------------------------------------------------------------- "Walk me through it" pictures (copied from build_y9_2_6.mjs)
const wcell = 'padding:6px 10px;text-align:center;font:700 18px var(--font-mono, monospace);min-width:38px';
const note = (t) => `<div class="wt-note">${t}</div>`;
function codeWT(lines, hl = []) {
  return '<div class="lesson-code">' + lines.map((l, i) =>
    `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">` + (i + 1) + '&nbsp;&nbsp;' + codeLine(l) + '</div>').join('') + '</div>';
}
function cmpWT(rows, hl = []) {
  return '<table class="donow-table">' + rows.map((r, i) => `<tr${hl.includes(i) ? ' class="wt-hl"' : ''}>` +
    r.map((c) => `<td style="${wcell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';
}

// Do Now 1 (selection, >= with the number on the line), worked with a different program: Speed > 30, Fast or Slow.
const WSEL = ['DECLARE Speed : INTEGER', 'INPUT Speed', 'IF Speed > 30 THEN', '  OUTPUT "Fast"', 'ELSE', '  OUTPUT "Slow"', 'ENDIF'];
const WT_SEL = { title: 'Walk me through it: selection', steps: [
  { text: 'This is a different program. Your question uses different values, so you still do the working yourself.', visual: codeWT(WSEL) },
  { text: 'Line 2: the user types <strong>30</strong>. INPUT puts 30 in Speed.', visual: codeWT(WSEL, [2]) + note('Speed = 30') },
  { text: 'Line 3 asks a question: is Speed &gt; 30?', visual: codeWT(WSEL, [3]) + note('Speed = 30') },
  { text: '&gt; means <strong>more than</strong>. Is 30 more than 30? <strong>No.</strong> So the question is FALSE.', visual: codeWT(WSEL, [3]) + note('30 &gt; 30 is FALSE') },
  { text: 'FALSE: skip the THEN line. Run the line after <strong>ELSE</strong>. The output is Slow.', visual: codeWT(WSEL, [6]) + note('Output: Slow') },
  { text: 'Now the user types <strong>45</strong>. Is 45 more than 30? <strong>Yes.</strong> So the question is TRUE.', visual: codeWT(WSEL, [3]) + note('45 &gt; 30 is TRUE') },
  { text: 'TRUE: run the line after <strong>THEN</strong>. The output is Fast.', visual: codeWT(WSEL, [4]) + note('Output: Fast') },
  { text: 'Read the symbol carefully. When the two numbers are the same, &gt; and &gt;= give different answers. Now do your question.',
    visual: cmpWT([['30 &gt; 30', 'FALSE'], ['30 &gt;= 30', 'TRUE']], [0, 1]) },
] };
// Do Now 2 (a FOR loop adding to a total), worked with a different program: 1 TO 3, add 5 each time, output 15.
const WLOOP = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '  Total <- Total + 5', 'NEXT Count', 'OUTPUT Total'];
const WT_LOOP = { title: 'Walk me through it: a loop', steps: [
  { text: 'This is a different program. Your question uses different values, so you still do the working yourself.', visual: codeWT(WLOOP) },
  { text: 'Line 3 sets Total to <strong>0</strong> before the loop starts.', visual: codeWT(WLOOP, [3]) + note('Total = 0') },
  { text: 'The FOR line: Count goes 1, then 2, then 3.', visual: codeWT(WLOOP, [4]) + note('Total = 0') },
  { text: 'Count = 1. Line 5 adds 5. Total = 0 + 5 = <strong>5</strong>.', visual: codeWT(WLOOP, [5]) + note('Count = 1, Total = 5') },
  { text: 'Count = 2. Line 5 adds 5 again. Total = 5 + 5 = <strong>10</strong>.', visual: codeWT(WLOOP, [5]) + note('Count = 2, Total = 10') },
  { text: 'Count = 3. Line 5 adds 5 again. Total = 10 + 5 = <strong>15</strong>.', visual: codeWT(WLOOP, [5]) + note('Count = 3, Total = 15') },
  { text: 'Count has reached 3, the end value, so the loop stops. Line 5 ran <strong>3 times</strong>: once for each value of Count.', visual: codeWT(WLOOP, [6]) + note('Total = 15') },
  { text: 'Line 7 outputs Total: <strong>15</strong>. Now do the same with the program in your question.', visual: codeWT(WLOOP, [7]) + note('Output: 15') },
] };

const steps = [];

// ---------------------------------------------------------------- Do Now (Revision 1)
const DN1 = ['DECLARE Score : INTEGER', 'INPUT Score', 'IF Score >= 40 THEN', '  OUTPUT "Win"', 'ELSE', '  OUTPUT "Lose"', 'ENDIF'];
steps.push(checkStep('do-now', 'Do Now: Selection (1 of 2)', 'Do Now: Selection (1 of 2)', 'From Revision 1.', [
  { label: 'The user types 40. What is output?', answer: word('win'), feedback: 'Read the symbol on line 3. Is 40 more than or equal to 40?' },
  { label: 'The user types 35. What is output?', answer: word('lose'), feedback: 'Is the question on line 3 TRUE or FALSE for 35? FALSE runs the ELSE line.' },
], code(DN1, true), ['Why is only one word output each time?', 'IF chooses one path. TRUE runs the THEN line. FALSE runs the ELSE line.']));
steps[steps.length - 1].walkthrough = WT_SEL;
const DN2 = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 4', '  Total <- Total + 3', 'NEXT Count', 'OUTPUT Total'];
steps.push(checkStep('do-now-2', 'Do Now: Loops (2 of 2)', 'Do Now: Loops (2 of 2)', 'From Revision 1.', [
  { label: 'How many times does line 5 run?', answer: num(4) + '|^\\s*4\\s*times?\\s*$', feedback: 'Count starts at 1. When does it stop?' },
  { label: 'What is output?', answer: num(12), feedback: 'Total starts at 0. Add 3 each time line 5 runs.' },
], code(DN2, true), ['Why does Total start at 0?', 'Nothing has been added yet. The loop adds to it.']));
steps[steps.length - 1].walkthrough = WT_LOOP;

// ---------------------------------------------------------------- Do Now Extension: harder questions on Revision 1
steps.push({ id: 'do-now-ext', label: 'Extension: Do Now Challenge', type: 'embedded-app', appId: 'drill-y8-revision-2-ext', embedContainerId: `${P}-do-now-ext`,
  content: '<h2 class="lesson-h2">Extension: Do Now Challenge</h2>' +
    '<p class="lesson-lead"><strong>Extension:</strong> finished the Do Now? Try these harder questions on sequence, selection, loops and flowcharts. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.</p>' +
    `<div id="${P}-do-now-ext"></div>` });

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Revision 2: Arrays and Searching',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithms</p><h2 class="lesson-h2">Revision 2: Arrays and Searching</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> read an array, then trace a search.', '<strong>Then:</strong> practice questions like the test.', '<strong>Next lesson:</strong> the assessment.']) +
    tps('Why keep many values in one array, and not in many variables?', '<p>One name holds them all. One loop can visit every value. Ten variables would need ten lines.</p>') });

// ---------------------------------------------------------------- key words
steps.push({ id: 'key-words', label: 'Key Words',
  content: '<h2 class="lesson-h2">Key Words</h2>' +
    tps('Look at Marks[2]. Which part is the name? Which part is the index?', '<p><strong>Marks</strong> is the name of the array. <strong>2</strong> is the index: the position.</p>') +
    '<table class="donow-table" style="font-size:17px;width:100%">' +
    [['DECLARE Marks : ARRAY[1:4] OF INTEGER', 'make an <strong>array</strong>: 4 values, one name'], ['index', 'the position number, in [ ]'], ['Marks[2]', 'the value at index 2'],
      ['DECLARE Found : BOOLEAN', 'a <strong>BOOLEAN</strong> stores TRUE or FALSE'], ['linear search', 'check each item, one at a time, from index 1'], ['trace table', 'write each new value when it changes']]
      .map((r) => `<tr><td style="padding:7px 12px;text-align:left;font-family:monospace">${r[0]}</td><td style="padding:7px 12px;text-align:left">${r[1]}</td></tr>`).join('') + '</table>' });

// ---------------------------------------------------------------- arrays: index and value
const MARKS = [6, 9, 5, 8];
const ARR = fill('Marks', 'INTEGER', MARKS).concat(['OUTPUT Marks[3]']);
assert(out(ARR) === '5', 'arrays slide');
steps.push({ id: 'arrays', label: 'Arrays: Index and Value',
  content: '<h2 class="lesson-h2">Arrays: Index and Value</h2>' +
    tps('Predict: what does line 6 output? Why is it not 3?',
      '<p>Output: <strong>5</strong>.</p><p>3 is the <strong>index</strong>, the position. Go to index 3 and read the <strong>value</strong> there: 5.</p>', 'Show the worked answer') +
    columns(code(ARR, true), arrayTable('Marks', MARKS) + facts(['The top row is the <strong>index</strong> (the position).', 'The bottom row is the <strong>value</strong>.', 'Marks[3]: go to index 3, read the value.', 'Index 1 is the first item.'])) });
const SCORES = [7, 3, 10, 5];
assert(out(['OUTPUT Scores[1]', 'OUTPUT Scores[4]'], [], fill('Scores', 'INTEGER', SCORES)) === '7 | 5' && SCORES.indexOf(10) + 1 === 3, 'arrays check');
steps.push(checkStep('arrays-check', 'Check: Index and Value', 'Check: Index and Value', null, [
  { label: 'What does OUTPUT Scores[1] output?', answer: num(7), feedback: 'Find index 1 in the top row. Read the value under it.' },
  { label: 'What does OUTPUT Scores[4] output?', answer: num(5), feedback: 'Find index 4 in the top row. Read the value under it.' },
  { label: 'Which index holds the value 10?', answer: num(3) + '|^\\s*index\\s*3\\s*$', feedback: 'Find 10 in the bottom row. Read the number above it.' },
], arrayTable('Scores', SCORES), ['Why do we need the index?', 'It tells the computer which value to use. Scores alone is the whole array.']));

// ---------------------------------------------------------------- arrays and loops: adding up
const PRICES = [4, 9, 2];
const TOTAL = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 3', '  Total <- Total + Prices[Index]', 'NEXT Index', 'OUTPUT Total'];
assert(out(TOTAL, [], fill('Prices', 'INTEGER', PRICES)) === '15', 'total slide');
steps.push({ id: 'array-loop', label: 'Arrays and Loops: Adding Up',
  content: '<h2 class="lesson-h2">Arrays and Loops: Adding Up</h2>' +
    tps('Predict: what is output? Fill in a trace table to check.',
      columns(trace(['Index', 'Total', 'Output'], [['', '0', ''], ['1', '4', ''], ['2', '13', ''], ['3', '15', ''], ['', '', '15']]),
        '<p>Output: <strong>15</strong>.</p><p>Each time round, Index is the next position, so line 5 adds the next value: 4, then 9, then 2.</p>'), 'Show the trace table') +
    columns(arrayTable('Prices', PRICES) + code(TOTAL, true),
      facts(['Index goes 1, 2, 3.', 'Line 5 uses <strong>Prices[Index]</strong>: the value at that index.', 'So each time round, it adds the <strong>next</strong> value.', 'In a <strong>trace table</strong>, write a new row each time a value changes.'])) });

// activity 1: trace an array total in Trace Tables (Python in, Cambridge pseudocode shown)
const POINTS = [5, 8, 2, 6];
assert(out(['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 4', '  Total <- Total + Points[Index]', 'NEXT Index', 'OUTPUT Total'], [], fill('Points', 'INTEGER', POINTS)) === '21', 'activity 1');
steps.push({ id: 'activity-1', label: 'Activity 1: Trace an Array Total', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Adding Up an Array',
    context: 'The array Points is already filled: Points[1] = 5, Points[2] = 8, Points[3] = 2, Points[4] = 6. Complete the trace table.',
    code: ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total = 0', 'for Index in range(1, 5):', '    Total = Total + Points[Index]', 'print(Total)'],
    cols: ['Line', 'Total', 'Index', 'Output'],
    answers: [
      { Line: '3', Total: '0', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '1', Output: '' }, { Line: '5', Total: '5', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '2', Output: '' }, { Line: '5', Total: '13', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '3', Output: '' }, { Line: '5', Total: '15', Index: '', Output: '' },
      { Line: '4', Total: '', Index: '4', Output: '' }, { Line: '5', Total: '21', Index: '', Output: '' },
      { Line: '6', Total: '', Index: '', Output: '21' },
    ],
  },
  content: '<h2 class="lesson-h2">Activity 1: Trace an Array Total</h2>' +
    tps('Why does the loop go up to 4?', '<p>Points has 4 values, at index 1 to index 4. The loop visits every one.</p>') +
    `<div id="${P}-embed-1" class="lesson-embed"></div>` });

const COINS = [5, 2, 6];
const CTOTAL = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 3', '  Total <- Total + Coins[Index]', 'NEXT Index', 'OUTPUT Total'];
assert(out(CTOTAL, [], fill('Coins', 'INTEGER', COINS)) === '13' && COINS[0] + COINS[1] === 7, 'array loop check');
steps.push(checkStep('array-loop-check', 'Check: Adding Up an Array', 'Check: Adding Up an Array', null, [
  { label: 'What is Total after line 5 runs with Index = 2?', answer: num(7), feedback: 'Index = 1 adds Coins[1]. Index = 2 adds Coins[2]. Add both to 0.' },
  { label: 'What is output?', answer: num(13), feedback: 'Keep adding: one value for each index, 1 to 3.' },
], arrayTable('Coins', COINS) + code(CTOTAL, true), ['Why is OUTPUT after NEXT?', 'So the total is shown once, after every value has been added.']));

// ---------------------------------------------------------------- linear search
const PETS = ['Cat', 'Dog', 'Fish'];
const SEARCH = (arr, n, type) => [`DECLARE Search : ${type}`, 'DECLARE Found : BOOLEAN', 'DECLARE Index : INTEGER', 'INPUT Search', 'Found <- FALSE',
  `FOR Index <- 1 TO ${n}`, `  IF ${arr}[Index] = Search THEN`, '    Found <- TRUE', '  ENDIF', 'NEXT Index',
  'IF Found = TRUE THEN', '  OUTPUT "Found"', 'ELSE', '  OUTPUT "Not Found"', 'ENDIF'];
const PSEARCH = SEARCH('Pets', 3, 'STRING');
assert(out(PSEARCH, ['Dog'], fill('Pets', 'STRING', PETS)) === 'Found' && out(PSEARCH, ['Cow'], fill('Pets', 'STRING', PETS)) === 'Not Found', 'search slide');
steps.push({ id: 'search', label: 'Linear Search: Check Each Item',
  content: '<h2 class="lesson-h2">Linear Search: Check Each Item</h2>' +
    tps('Predict: the user types Dog. What is output? At which index does it match?',
      '<p>Output: <strong>Found</strong>.</p><p>Index 1: Cat is not Dog. Index 2: Dog = Dog, so line 8 sets Found to TRUE. After the loop, Found = TRUE, so line 12 runs.</p>', 'Show the worked answer') +
    columns(code(PSEARCH, true, true), arrayTable('Pets', PETS.map((p) => `"${p}"`)) +
      facts(['Found starts as <strong>FALSE</strong> (line 5).', 'The loop checks each item, from index 1.', 'A match sets Found to <strong>TRUE</strong> (line 8).', 'After the loop, line 11 checks Found.'])) });

const NUMS = [4, 7, 9, 2];
const NSEARCH = SEARCH('Numbers', 4, 'INTEGER');
assert(out(NSEARCH, [9], fill('Numbers', 'INTEGER', NUMS)) === 'Found' && out(NSEARCH, [5], fill('Numbers', 'INTEGER', NUMS)) === 'Not Found', 'compare slide');
const cmpRows = (search) => NUMS.map((v, i) => [String(i + 1), String(v), `${v} = ${search}?`, '?']);
steps.push({ id: 'compare', label: 'Compare: Found and Not Found',
  content: '<h2 class="lesson-h2">Compare: Found and Not Found</h2>' +
    tps('The same search runs twice. What is Found at the end each time? What is the same? What is different?',
      '<p>Search 9: index 3 matches, so Found becomes TRUE and stays TRUE. Output: <strong>Found</strong>.</p><p>Search 5: nothing matches, so Found stays FALSE. Output: <strong>Not Found</strong>.</p><p>Same: the loop checks all 4 items both times. Nothing sets Found back to FALSE.</p>') +
    `<p class="lesson-lead">The array Numbers holds 4, 7, 9, 2. The program is the search from the last slide.</p>` +
    columns(caption('The user types 9') + trace(['Index', 'Numbers[Index]', 'Match?', 'Found'], cmpRows(9)),
      caption('The user types 5') + trace(['Index', 'Numbers[Index]', 'Match?', 'Found'], cmpRows(5))) });

const CODES = [3, 8, 6, 1];
const CSEARCH = SEARCH('Codes', 4, 'INTEGER');
{ const r = run(CSEARCH, [6], fill('Codes', 'INTEGER', CODES)); assert(r.vars.Found === true && r.outputs.join() === 'Found', 'search check a/b'); }
assert(out(CSEARCH, [7], fill('Codes', 'INTEGER', CODES)) === 'Not Found', 'search check c');
steps.push(checkStep('search-check', 'Check: Linear Search', 'Check: Linear Search', 'Codes holds 3, 8, 6, 1 at index 1 to 4.', [
  { label: 'The user types 6. What is Found after the loop?', answer: word('true'), feedback: 'Check each value in Codes. Does any of them equal 6?' },
  { label: 'The user types 6. What is output?', answer: word('found'), feedback: 'Line 11 checks Found after the loop. Which OUTPUT line runs?' },
  { label: 'The user types 7. What is output?', answer: word('not\\s*found'), feedback: 'Is 7 anywhere in Codes? If nothing matches, what is Found?' },
], code(CSEARCH, true, true), ['Why does the search check every item, even after a match?', 'The FOR loop always runs from 1 to 4. It does not stop early.']));

// activity 2: trace a linear search in Trace Tables
const NUMS2 = [5, 3, 8, 1];
assert(out(['DECLARE Search : INTEGER', 'DECLARE Found : BOOLEAN', 'DECLARE Index : INTEGER', 'Search <- 8', 'Found <- FALSE', 'FOR Index <- 1 TO 4', '  IF Numbers[Index] = Search THEN', '    Found <- TRUE', '  ENDIF', 'NEXT Index',
  'IF Found = TRUE THEN', '  OUTPUT "Found"', 'ELSE', '  OUTPUT "Not Found"', 'ENDIF'], [], fill('Numbers', 'INTEGER', NUMS2)) === 'Found', 'activity 2');
steps.push({ id: 'activity-2', label: 'Activity 2: Trace a Search', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-2`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Linear Search',
    context: 'The array Numbers is already filled: Numbers[1] = 5, Numbers[2] = 3, Numbers[3] = 8, Numbers[4] = 1. Complete the trace table.',
    code: ['DECLARE Search : INTEGER', 'DECLARE Found : BOOLEAN', 'DECLARE Index : INTEGER', 'Search = 8', 'Found = False', 'for Index in range(1, 5):',
      '    if Numbers[Index] == Search:', '        Found = True', 'if Found == True:', '    print("Found")', 'else:', '    print("Not Found")'],
    cols: ['Line', 'Search', 'Found', 'Index', 'Output'],
    answers: [
      { Line: '4', Search: '8', Found: '', Index: '', Output: '' },
      { Line: '5', Search: '', Found: 'FALSE', Index: '', Output: '' },
      { Line: '6', Search: '', Found: '', Index: '1', Output: '' },
      { Line: '6', Search: '', Found: '', Index: '2', Output: '' },
      { Line: '6', Search: '', Found: '', Index: '3', Output: '' },
      { Line: '8', Search: '', Found: 'TRUE', Index: '', Output: '' },
      { Line: '6', Search: '', Found: '', Index: '4', Output: '' },
      { Line: '10', Search: '', Found: '', Index: '', Output: 'Found' },
    ],
  },
  content: '<h2 class="lesson-h2">Activity 2: Trace a Search</h2>' +
    tps('Why is there no new Found row when Index is 4?', '<p>Numbers[4] is 1, not 8, so line 8 does not run. Found keeps its value, TRUE.</p>') +
    `<div id="${P}-embed-2" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- mixed practice, in the style of the test
const PR1 = ['DECLARE Price : INTEGER', 'INPUT Price', 'Price <- Price * 2', 'IF Price > 20 THEN', '  OUTPUT "Big"', 'ELSE', '  OUTPUT "Small"', 'ENDIF'];
assert(out(PR1, [8]) === 'Small' && out(PR1, [12]) === 'Big', 'practice 1');
const SYM_DECISION = '^\\s*(an?\\s+)?(decision|diamond)(\\s+(symbol|shape|box))?\\s*$';
steps.push(checkStep('practice-1', 'Practice: Like the Test (1 of 3)', 'Practice: Like the Test (1 of 3)', 'Sequence, selection and flowcharts.', [
  { label: 'The user types 8. What is output?', answer: word('small'), feedback: 'Work out Price after line 3 first. Then answer the question on line 4.' },
  { label: 'The user types 12. What is output?', answer: word('big'), feedback: 'Line 3 changes Price before the IF. Is the new value more than 20?' },
  { label: 'In a flowchart, what is the name of the shape for line 4?', answer: SYM_DECISION, feedback: 'Line 4 asks a question with a Yes and a No path.' },
], code(PR1, true), ['Why must you do line 3 before line 4?', 'The lines run in order. Line 4 uses the new value of Price.']));

const PR2 = SEARCH('Ages', 4, 'INTEGER');
const AGES = [12, 15, 11, 14];
assert(PR2[7] === '    Found <- TRUE' && out(PR2, [13], fill('Ages', 'INTEGER', AGES)) === 'Not Found' && out(PR2, [11], fill('Ages', 'INTEGER', AGES)) === 'Found', 'practice 2');
const PR2SHOWN = PR2.map((l, i) => (i === 7 ? '    ....................' : l));
steps.push(checkStep('practice-2', 'Practice: Like the Test (2 of 3)', 'Practice: Like the Test (2 of 3)', 'A linear search. Ages holds 12, 15, 11, 14 at index 1 to 4.', [
  { line: true, label: 'Line 8 is missing. Write line 8.', answer: '^\\s*found\\s*(<-|←|<--)\\s*true\\s*$', feedback: 'What should happen to the flag when an item matches?' },
  { label: 'The user types 13. What is output?', answer: word('not\\s*found'), feedback: 'Check each age in turn. Is any of them 13?' },
], code(PR2SHOWN, true, true), ['Why does line 5 set Found to FALSE before the loop?', 'Nothing has been found yet. Only a match changes it to TRUE.']));

const BAGS = [6, 4, 9, 3];
const PR3 = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 3', '  Total <- Total + Bags[Index]', 'NEXT Index', 'OUTPUT Total'];
assert(out(PR3, [], fill('Bags', 'INTEGER', BAGS)) === '19', 'practice 3');
steps.push(checkStep('practice-3', 'Practice: Like the Test (3 of 3)', 'Practice: Like the Test (3 of 3)', 'Arrays and loops. Read the FOR line carefully.', [
  { label: 'How many times does line 5 run?', answer: num(3) + '|^\\s*3\\s*times?\\s*$', feedback: 'Look at the numbers on the FOR line. Where does Index stop?' },
  { label: 'What is output?', answer: num(19), feedback: 'Add only the values the loop visits. Which index does it stop at?' },
], arrayTable('Bags', BAGS) + code(PR3, true), ['Bags holds 4 values. Why is Bags[4] not added?', 'The loop stops at 3, so Index is never 4.']));

// ---------------------------------------------------------------- plenary
steps.push({ id: 'plenary', label: 'Plenary: Revision 2 Drill', type: 'embedded-app', appId: 'drill-y8-revision-2', embedContainerId: `${P}-plenary`,
  content: '<h2 class="lesson-h2">Plenary: Revision 2 Drill</h2>' +
    tps('Which question type do you find hardest? What will you practise before the test?', '<p>Answers will vary. Use the drill to find out: the cards you get wrong come back more often.</p>') +
    `<p class="lesson-lead">Arrays, adding up, linear search and mixed questions. Your progress is saved.</p><div id="${P}-plenary"></div>` });

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now', 0, 'Win') && T('do-now', 0, '"win"') && !T('do-now', 0, 'Lose') && T('do-now', 1, 'Lose') && !T('do-now', 1, 'Win'), 'dn1');
assert(T('do-now-2', 0, '4') && T('do-now-2', 0, '4 times') && !T('do-now-2', 0, '3') && T('do-now-2', 1, '12') && !T('do-now-2', 1, '3') && !T('do-now-2', 1, '15'), 'dn2');
assert(T('arrays-check', 0, '7') && !T('arrays-check', 0, '1') && T('arrays-check', 1, '5') && !T('arrays-check', 1, '4') && T('arrays-check', 2, '3') && T('arrays-check', 2, 'index 3') && !T('arrays-check', 2, '10'), 'arr');
assert(T('array-loop-check', 0, '7') && !T('array-loop-check', 0, '2') && T('array-loop-check', 1, '13') && !T('array-loop-check', 1, '6'), 'loop');
assert(T('search-check', 0, 'TRUE') && !T('search-check', 0, 'false') && T('search-check', 1, 'Found') && !T('search-check', 1, 'Not Found') && T('search-check', 2, 'Not Found') && T('search-check', 2, 'notfound') && !T('search-check', 2, 'Found'), 'search');
assert(T('practice-1', 0, 'Small') && !T('practice-1', 0, 'Big') && T('practice-1', 1, 'big') && !T('practice-1', 1, 'small') && T('practice-1', 2, 'Decision') && T('practice-1', 2, 'a diamond') && !T('practice-1', 2, 'process'), 'p1');
assert(T('practice-2', 0, 'Found <- TRUE') && T('practice-2', 0, 'found<-true') && T('practice-2', 0, 'Found ← TRUE') && !T('practice-2', 0, 'Found <- FALSE') && !T('practice-2', 0, 'Found = TRUE') && T('practice-2', 1, 'Not Found') && !T('practice-2', 1, 'Found'), 'p2');
assert(T('practice-3', 0, '3') && !T('practice-3', 0, '4') && T('practice-3', 1, '19') && !T('practice-3', 1, '22'), 'p3');
// The walkthroughs show the method with other programs and never the Do Now answers.
{ const s = JSON.stringify(WT_SEL); assert(!/\bwin\b|\blose\b|\b40\b|\b35\b/i.test(s), 'selection walkthrough leaks an answer'); }
{ const s = JSON.stringify(WT_LOOP.steps.map((x) => x.text + x.visual)); assert(!/\b12\b/.test(s) && !/\b4\b/.test(WT_LOOP.steps.map((x) => x.text).join(' ')), 'loop walkthrough leaks an answer'); }
assert(out(WSEL, [30]) === 'Slow' && out(WSEL, [45]) === 'Fast' && out(WLOOP) === '15' && out(DN1, [40]) === 'Win' && out(DN1, [35]) === 'Lose' && out(DN2) === '12', 'walkthrough and do now programs');
// No dashes anywhere in the lesson text.
const lesson = { id: ID, label: 'Revision 2: Arrays and Searching', steps, validators, pseudocodeValidators: {} };
const json = JSON.stringify(lesson, null, 1);
assert(!/[–—]|&mdash;|&ndash;/.test(json), 'dash in lesson');
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), json + '\n');

// Register it in Year 8's Term 1 Exam Revision unit, straight after Revision 1.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y8 = all.years.find((y) => y.id === 'year8');
const unit = y8.units.find((u) => u.title === 'Term 1 Exam Revision');
assert(unit && unit.lessons.includes('y8-revision-1'), 'Revision 1 is registered');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y8-revision-1') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
