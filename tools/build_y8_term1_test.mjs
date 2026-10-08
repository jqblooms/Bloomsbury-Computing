// Builds the Year 8 Term 1 Test: the test itself (written into the shell repo's TestBank.gs, between the y8-term1
// markers) and the lesson y8-term1-test (20 minutes on the y8-term1-revision drill, then a link to the Tests page).
//   node tools/build_y8_term1_test.mjs
// James, 2026-10-08: the Year 7 test was finished in 5 minutes because the answers were obvious (two-button choices,
// one-step flowcharts). So this test is built to make students work: nearly every mark needs a program traced,
// choices are hinge questions (four options, each the answer a common mistake gives), and no question's answer can
// be read off the screen. Bands: accessible (sequence, a symbol, an index), middle (> and >=, FOR loops, array
// totals, linear search) and stretch (values changed before a test, output inside a loop, a WHILE loop, a search
// that resets its flag, finding and fixing a logic error, writing a program). Only what Year 8 met in L1 to L7:
// DECLARE, <-, INPUT, OUTPUT, IF ... THEN ... ELSE ... ENDIF, FOR ... NEXT, WHILE ... DO ... ENDWHILE, arrays from
// index 1, a Found flag. Every answer comes from running the program in shared/pseudocode-engine.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

function run(lines, inputs = [], setup = []) {
  const r = runPseudocode(setup.concat(lines).join('\n'), {}, 5000, inputs.map(String));
  if (r.error) throw new Error(r.error.message + '\n' + lines.join('\n'));
  return r.outputs.map(String);
}
const out = (lines, inputs, setup) => run(lines, inputs, setup).join(',');
const fill = (name, vals) => ['DECLARE ' + name + ' : ARRAY[1:' + vals.length + '] OF INTEGER'].concat(vals.map((v, i) => `${name}[${i + 1}] <- ${v}`));
const grid = (vals) => ({ header: ['Index'].concat(vals.map((v, i) => String(i + 1))), rows: [['Value'].concat(vals.map(String))] });
const choice = (q) => Object.assign({ type: 'choice', marks: 1 }, q);

// ---------------------------------------------------------------- programs and their answers
const SEQ = ['DECLARE A : INTEGER', 'DECLARE B : INTEGER', 'A <- 4', 'B <- A + 3', 'A <- B * 2', 'OUTPUT A'];
assert(out(SEQ) === '14', 'SEQ');
const SWAP = ['DECLARE X : INTEGER', 'DECLARE Y : INTEGER', 'X <- 5', 'Y <- 9', 'X <- Y', 'Y <- X', 'OUTPUT X', 'OUTPUT Y'];
assert(out(SWAP) === '9,9', 'SWAP');
const DOUBLE = ['DECLARE Price : INTEGER', 'INPUT Price', 'Price <- Price * 2', 'IF Price >= 30 THEN', '  OUTPUT "Big"', 'ELSE', '  OUTPUT "Small"', 'ENDIF'];
assert(out(DOUBLE, [15]) === 'Big' && out(DOUBLE, [14]) === 'Small', 'DOUBLE');
const PASS = ['DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark > 40 THEN', '  OUTPUT "Pass"', 'ELSE', '  OUTPUT "Fail"', 'ENDIF'];
const passes = [39, 40, 41, 50].filter((m) => out(PASS, [m]) === 'Pass').length;
assert(passes === 2, 'PASS ' + passes);
const TWOIF = ['DECLARE Score : INTEGER', 'Score <- 12', 'IF Score > 10 THEN', '  Score <- Score - 5', 'ENDIF', 'IF Score > 10 THEN', '  OUTPUT "High"', 'ELSE', '  OUTPUT "Low"', 'ENDIF'];
assert(out(TWOIF) === 'Low', 'TWOIF');
const ADULT = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age > 18 THEN', '  OUTPUT "Adult"', 'ELSE', '  OUTPUT "Child"', 'ENDIF'];
const ADULT_FIX = ADULT.slice(); ADULT_FIX[2] = 'IF Age >= 18 THEN';
assert(out(ADULT, [18]) === 'Child' && out(ADULT_FIX, [18]) === 'Adult' && out(ADULT_FIX, [17]) === 'Child', 'ADULT');

const FOR2 = ['DECLARE Count : INTEGER', 'FOR Count <- 2 TO 5', '  OUTPUT Count * 2', 'NEXT Count'];
assert(out(FOR2) === '4,6,8,10', 'FOR2');
const TIMES = ['DECLARE Count : INTEGER', 'FOR Count <- 3 TO 8', '  OUTPUT "Hi"', 'NEXT Count'];
assert(run(TIMES).length === 6, 'TIMES');
const DOWN = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 20', 'FOR Count <- 1 TO 4', '  Total <- Total - Count', 'NEXT Count', 'OUTPUT Total'];
assert(out(DOWN) === '10', 'DOWN');
const INSIDE = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '  Total <- Total + 5', '  OUTPUT Total', 'NEXT Count'];
assert(out(INSIDE) === '5,10,15', 'INSIDE');
const WHILE = ['DECLARE Number : INTEGER', 'Number <- 20', 'WHILE Number > 5 DO', '  Number <- Number - 6', 'ENDWHILE', 'OUTPUT Number'];
assert(out(WHILE) === '2', 'WHILE');

const MARKS = [7, 12, 5, 9, 15];
const SET = fill('Marks', MARKS);
const PART = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 2 TO 4', '  Total <- Total + Marks[Index]', 'NEXT Index', 'OUTPUT Total'];
assert(out(PART, [], SET) === '26', 'PART');
const OVER = ['DECLARE Tally : INTEGER', 'DECLARE Index : INTEGER', 'Tally <- 0', 'FOR Index <- 1 TO 5', '  IF Marks[Index] > 8 THEN', '    Tally <- Tally + 1', '  ENDIF', 'NEXT Index', 'OUTPUT Tally'];
assert(out(OVER, [], SET) === '3', 'OVER');
const SEARCH = ['DECLARE Search : INTEGER', 'DECLARE Found : BOOLEAN', 'DECLARE Index : INTEGER', 'INPUT Search', 'Found <- FALSE', 'FOR Index <- 1 TO 5',
  '  IF Marks[Index] = Search THEN', '    Found <- TRUE', '  ENDIF', 'NEXT Index', 'IF Found = TRUE THEN', '  OUTPUT "Found"', 'ELSE', '  OUTPUT "Not found"', 'ENDIF'];
assert(out(SEARCH, [9], SET) === 'Found' && out(SEARCH, [10], SET) === 'Not found', 'SEARCH');
const SEARCH_GAP = SEARCH.map((l, i) => (i === 6 ? '  ....................' : l));
const RESET = SEARCH.slice(0, 7).concat(['    Found <- TRUE', '  ELSE', '    Found <- FALSE', '  ENDIF'], SEARCH.slice(9));
const resetFound = [7, 12, 5, 15].filter((v) => out(RESET, [v], SET) === 'Found');
assert(resetFound.join() === '15', 'RESET ' + resetFound);

const TEMPS = [9, 10, 14, 10, 6, 11];
const SETT = fill('Temps', TEMPS);
const BUG = ['DECLARE Warm : INTEGER', 'DECLARE Index : INTEGER', 'Warm <- 0', 'FOR Index <- 1 TO 6', '  IF Temps[Index] > 10 THEN', '    Warm <- Warm + 1', '  ENDIF', 'NEXT Index', 'OUTPUT Warm'];
assert(out(BUG, [], SETT) === '2', 'BUG');
const BUG_FIX = BUG.slice(); BUG_FIX[4] = '  IF Temps[Index] >= 10 THEN';
assert(out(BUG_FIX, [], SETT) === '4', 'BUG_FIX');

// ---------------------------------------------------------------- the test
const symOpts = ['Start/End', 'Process', 'Input/Output', 'Decision'];
const test = {
  id: 'y8-term1', title: 'Year 8 Term 1 Test', subtitle: 'Algorithms: pseudocode, selection, loops, arrays, searching and flowcharts', year: 'year8', minutes: 30,
  sections: [
    { title: 'Sequence and Selection', questions: [
      { id: 'a1', type: 'short', input: 'number', marks: 1, prompt: 'What does this program output?', code: SEQ, accept: ['14'],
        scheme: 'B = 4 + 3 = 7. Then A = 7 x 2 = 14. (8 forgets that A changes; 7 outputs B.)' },
      choice({ id: 'a2', prompt: 'This program is meant to swap X and Y. What does it actually output?', code: SWAP,
        options: ['9 then 9', '9 then 5', '5 then 9', '5 then 5'], answer: '9 then 9', scheme: 'X <- Y makes X 9. Then Y <- X copies that 9 back. The 5 is lost.' }),
      { id: 'a3', type: 'short', input: 'text', marks: 1, prompt: 'The user types 15. What does this program output?', code: DOUBLE, numbered: true,
        accept: ['Big'], scheme: 'Line 3 makes Price 30 first. 30 >= 30 is true, so Big.' },
      { id: 'a4', type: 'short', input: 'number', marks: 1, prompt: 'The user runs this program four times and types 39, then 40, then 41, then 50. How many times does it output Pass?', code: PASS,
        accept: [String(passes)], scheme: '41 and 50 pass. 40 is not more than 40, so it fails.' },
      { id: 'a5', type: 'short', input: 'text', marks: 1, prompt: 'What does this program output?', code: TWOIF, numbered: true,
        accept: ['Low'], scheme: 'The first IF changes Score to 7. The second IF tests 7, so Low.' },
      { id: 'a6', type: 'short', input: 'code', marks: 1, prompt: 'Someone aged 18 should see Adult, but this program outputs Child. Write the correct line 3.', code: ADULT, numbered: true,
        accept: ['IF Age >= 18 THEN', 'IF Age > 17 THEN', 'IF 18 <= Age THEN'], placeholder: 'IF ...', scheme: 'IF Age >= 18 THEN (or IF Age > 17 THEN)' }
    ] },
    { title: 'Loops', questions: [
      { id: 'b1', type: 'short', input: 'list', marks: 1, prompt: 'Write every output of this program, in order.', code: FOR2,
        accept: ['4,6,8,10'], placeholder: 'For example: 1, 2, 3', scheme: '4, 6, 8, 10' },
      { id: 'b2', type: 'short', input: 'number', marks: 1, prompt: 'How many times does this program output Hi?', code: TIMES,
        accept: ['6'], scheme: '3, 4, 5, 6, 7, 8: six times. (5 is 8 - 3, a common slip.)' },
      { id: 'b3', type: 'table', marks: 3, prompt: 'Complete the trace table. Write Count and Total for each pass of the loop. Write the output in the last row.', code: DOWN,
        columns: ['Count', 'Total', 'OUTPUT'], rows: 6, given: { '0,1': '20' },
        key: [['', '20', ''], ['1', '19', ''], ['2', '17', ''], ['3', '14', ''], ['4', '10', ''], ['', '', '10']],
        points: [
          { text: 'Count is 1, 2, 3, 4', cells: [[1, 0], [2, 0], [3, 0], [4, 0]] },
          { text: 'Total is 19, 17, 14, 10', cells: [[1, 1], [2, 1], [3, 1], [4, 1]] },
          { text: 'OUTPUT 10, once, at the end', cells: [[5, 2]] }
        ] },
      choice({ id: 'b4', prompt: 'What does this program output?', code: INSIDE,
        options: ['5, 10, 15', '15', '5, 5, 5', '0, 5, 10'], answer: '5, 10, 15', scheme: 'OUTPUT is inside the loop, so it runs on every pass, after Total changes.' }),
      { id: 'b5', type: 'short', input: 'number', marks: 1, prompt: 'What does this program output?', code: WHILE,
        accept: ['2'], scheme: '20, 14, 8, 2. The loop stops when Number is no longer more than 5.' }
    ] },
    { title: 'Arrays and Searching', questions: [
      { id: 'c1', type: 'short', input: 'number', marks: 1, prompt: 'The array Marks holds five values. What is the value of Marks[4]?', code: [SET[0]], grid: grid(MARKS),
        accept: ['9'], scheme: 'Index 4 holds 9.' },
      choice({ id: 'c2', prompt: 'Marks holds the same values. Which index holds the value 12?', grid: grid(MARKS), options: ['2', '12', '1', '3'], answer: '2',
        scheme: '12 is the value. It is at index 2.' }),
      { id: 'c3', type: 'short', input: 'number', marks: 1, prompt: 'Marks holds the same values. What does this program output?', grid: grid(MARKS), code: PART,
        accept: ['26'], scheme: 'Only index 2 to 4: 12 + 5 + 9 = 26.' },
      { id: 'c4', type: 'short', input: 'number', marks: 1, prompt: 'Marks holds the same values. What does this program output?', grid: grid(MARKS), code: OVER,
        accept: ['3'], scheme: '12, 9 and 15 are more than 8.' },
      { id: 'c5', type: 'short', input: 'code', marks: 1, prompt: 'This linear search looks through Marks for the number the user types. Line 7 is missing. Write line 7.', code: SEARCH_GAP, numbered: true,
        accept: ['IF Marks[Index] = Search THEN', 'IF Search = Marks[Index] THEN'], placeholder: 'IF ...', scheme: 'IF Marks[Index] = Search THEN' },
      { id: 'c6', type: 'short', input: 'number', marks: 1,
        prompt: 'This search has a logic error. Marks holds the same values. The user runs it four times and searches for 7, then 12, then 5, then 15. How many times does it output Found?',
        grid: grid(MARKS), code: RESET, numbered: true, accept: ['1'],
        scheme: 'The ELSE sets Found back to FALSE for every later item. Only 15, the last item, still gives Found.' },
      { id: 'c7', type: 'long', codeAnswer: true, marks: 3,
        prompt: 'The array Prices holds 8 whole numbers, at index 1 to 8. Write a program that adds up all 8 prices and outputs the total. Declare every variable you use.',
        scheme: 'One mark each:\n- variables declared, and the total set to 0 before the loop\n- a FOR loop from 1 TO 8 that adds Prices[Index] to the total\n- OUTPUT of the total after the loop, not inside it\n\nExample:\nDECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 8\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total' }
    ] },
    { title: 'Flowcharts and Errors', questions: [
      choice({ id: 'd1', prompt: 'In a flowchart, which shape is used for line 4?', code: DOUBLE, numbered: true, options: symOpts, answer: 'Decision' }),
      choice({ id: 'd2', prompt: 'In a flowchart, which shape is used for line 2?', code: DOUBLE, numbered: true, options: symOpts, answer: 'Input/Output' }),
      { id: 'd3', type: 'short', input: 'number', marks: 1, prompt: 'This program should count the days that are 10 degrees or warmer. Follow it exactly as it is written. What does it actually output?',
        grid: grid(TEMPS), code: BUG, numbered: true, accept: ['2'], scheme: '14 and 11. The two 10s are not counted, because 10 > 10 is false.' },
      { id: 'd4', type: 'long', codeAnswer: true, marks: 2, prompt: 'Look at the same program. Write the line number of the error and the correct line.',
        grid: grid(TEMPS), code: BUG, numbered: true,
        scheme: 'One mark each:\n- line 5\n- IF Temps[Index] >= 10 THEN (or > 9)' }
    ] }
  ]
};
assert(/^IF/.test(DOUBLE[3]) && /^INPUT/.test(DOUBLE[1]), 'symbol lines');

const qs = test.sections.flatMap((s) => s.questions);
assert(new Set(qs.map((q) => q.id)).size === qs.length, 'unique ids');
qs.filter((q) => q.type === 'choice').forEach((q) => assert(q.options.length === 4 && q.options.includes(q.answer), 'hinge has 4 options ' + q.id));
const total = qs.reduce((t, q) => t + q.marks, 0);
assert(!/[–—]/.test(JSON.stringify(test)), 'dash in test');

// ---------------------------------------------------------------- write it into TestBank.gs
const bankPath = path.join(SHELL, 'TestBank.gs');
let bank = fs.readFileSync(bankPath, 'utf8');
const crlf = bank.includes('\r\n'); bank = bank.replace(/\r\n/g, '\n');
const BEGIN = '  // BEGIN y8-term1 (generated by the pages repo tools/build_y8_term1_test.mjs; edit that, not this)';
const END = '  // END y8-term1';
const block = BEGIN + '\n  ' + JSON.stringify(test) + ',\n' + END;
if (bank.includes(BEGIN)) bank = bank.replace(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END), () => block);
else bank = bank.replace('var TEST_BANK = [\n', () => 'var TEST_BANK = [\n' + block + '\n');
fs.writeFileSync(bankPath, crlf ? bank.replace(/\n/g, '\r\n') : bank);

// ---------------------------------------------------------------- the lesson
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const LID = 'y8-term1-test';
const steps = [
  { id: 'title', label: 'Term 1 Test',
    content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithms</p><h2 class="lesson-h2">Term 1 Test</h2><p>Year 8</p></div>' +
      facts(['<strong>First:</strong> 20 minutes of revision practice.', '<strong>Then:</strong> a 30-minute test on this website.',
        '<strong>Topics:</strong> sequence, selection, FOR and WHILE loops, arrays, linear search, flowchart symbols, finding errors.']) +
      tps('Which topic do you find hardest?', 'Practise that topic most in the next 20 minutes.') },
  { id: 'revision', label: 'Revision Practice', type: 'embedded-app', appId: 'drill-y8-term1-revision', embedContainerId: 'y8t1-revision',
    content: '<h2 class="lesson-h2">Revision Practice</h2>' + tps('A program changes a variable, then an IF tests it. Which value does the IF use?', 'The new value. Lines run in order, top to bottom.') +
      '<p class="lesson-lead">20 minutes. Practise every topic. Trace each program one line at a time.</p><div id="y8t1-revision"></div>' },
  { id: 'how-it-works', label: 'How the Test Works',
    content: '<h2 class="lesson-h2">How the Test Works</h2>' + tps('Every question needs you to trace a program. How can you check an answer?', 'Trace it again, one line at a time. Write down each variable as it changes.') +
      facts(['You have <strong>30 minutes</strong> from when you press <strong>Start</strong>.', 'Your answers <strong>save as you type</strong>.', 'During the test you <strong>cannot open the rest of the website</strong>.',
        'The notepad works, but it starts <strong>empty</strong>. Use it to trace the programs.', 'Press <strong>Hand in</strong> when you finish. When time runs out, it hands in for you.']) },
  { id: 'test', label: 'The Test', type: 'app-link', appId: 'tests', buttonId: 'y8t1-open-test',
    content: '<h2 class="lesson-h2">The Test</h2>' + tps('You finish early. What should you do?', 'Trace every program again. Check each answer one line at a time.') +
      '<p class="lesson-lead">Wait until your teacher says the test is open. Then press the button, and press Start.</p><p><button type="button" class="donow-btn" id="y8t1-open-test">Open the test</button></p>' }
];
fs.writeFileSync(path.join(ROOT, 'LessonData', LID + '.json'), JSON.stringify({ id: LID, label: 'Term 1 Test', steps, validators: {}, pseudocodeValidators: {} }, null, 1) + '\n');
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find((y) => y.id === 'year8').units.find((u) => u.title === 'Term 1 Exam Revision');
if (!unit.lessons.includes(LID)) unit.lessons.push(LID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`y8-term1: ${qs.length} questions, ${total} marks; lesson ${LID}; unit: ${unit.lessons.join(', ')}`);
