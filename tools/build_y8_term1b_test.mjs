// Builds the Year 8 Term 1b Test: the test itself (written into the shell repo's TestBank.gs, between the y8-term1b
// markers) and the lesson y8-term1b-test (20 minutes on the y8-term1b-practice drill, then a link to the Tests page).
//   node tools/build_y8_term1b_test.mjs
// Same format as tools/build_y8_term1_test.mjs (the model): choices are hinge questions (four options, each wrong one
// the answer a common mistake gives), most marks are typed answers found by tracing a program, and no question gives
// away another. Content is Unit 2 as taught in Term 1b: 2.1 library functions (MOD, DIV, ROUND, LENGTH, UCASE,
// RANDOM), 2.2 data types and CONSTANT, 2.3 IF, ELSE, nested IF, > and >=, testing every branch, 2.4 AND, OR, NOT
// and ranges. Bands: accessible (a library function call, a data type, a rule's sign), middle (ROUND, RANDOM ranges,
// a constant with a >= boundary, a value changed before a nested IF, AND and OR counts, an OR trace table) and
// stretch (LENGTH with a space then MOD, checks in the wrong order, an AND that can never be TRUE, AND NOT and OR on
// the same values, reasons for a constant). Every answer comes from running the program in shared/pseudocode-engine.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = process.env.BC_SHELL_DIR || path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const DRY = process.argv.includes("--dry"); // checks only, writes nothing
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

function exec(lines, inputs = []) { return runPseudocode(lines.join('\n'), {}, 5000, inputs.map(String)); }
function run(lines, inputs = []) {
  const r = exec(lines, inputs);
  if (r.error) throw new Error(r.error.message + '\n' + lines.join('\n'));
  return r.outputs.map((v) => (typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v)));
}
const out = (lines, inputs) => run(lines, inputs).join(',');
const errLine = (lines, inputs) => { const r = exec(lines, inputs); return r.error ? r.error.line : null; };
const choice = (q) => Object.assign({ type: 'choice', marks: 1 }, q);
const ifElse = (cond, a, b) => ['IF ' + cond + ' THEN', '  OUTPUT "' + a + '"', 'ELSE', '  OUTPUT "' + b + '"', 'ENDIF'];

// ---------------------------------------------------------------- 2.1 library functions
const DIVP = ['DECLARE Minutes : INTEGER', 'INPUT Minutes', 'OUTPUT DIV(Minutes, 60)'];
assert(out(DIVP, [200]) === '3', 'DIV');
const MODP = ['DECLARE People : INTEGER', 'DECLARE Left : INTEGER', 'People <- 45', 'Left <- MOD(People, 6)', 'OUTPUT Left'];
assert(out(MODP) === '3', 'MOD');
const ROUNDP = ['DECLARE Total : INTEGER', 'Total <- 53', 'OUTPUT ROUND(Total / 6, 1)'];
assert(out(ROUNDP) === '8.8', 'ROUND');
const LENP = ['DECLARE Town : STRING', 'DECLARE Size : INTEGER', 'INPUT Town', 'Size <- LENGTH(Town)', 'OUTPUT MOD(Size, 4)'];
assert(out(LENP, ['Chiang Mai']) === '2', 'LENGTH');
const RANDP = ['DECLARE Spin : INTEGER', 'Spin <- ROUND(RANDOM() * 8, 0) + 2', 'OUTPUT Spin'];
{ const seen = new Set(run(['DECLARE Spin : INTEGER', 'DECLARE I : INTEGER', 'FOR I <- 1 TO 400', '  Spin <- ROUND(RANDOM() * 8, 0) + 2', '  OUTPUT Spin', 'NEXT I']).map(Number)); // RANDOM is seeded per run, so draw many in one run
  assert(Math.min(...seen) === 2 && Math.max(...seen) === 10 && seen.size === 9, 'RANDOM range ' + [...seen]); }
const CALLS = ['DECLARE Name : STRING', 'DECLARE Score : INTEGER', 'INPUT Name', 'INPUT Score', 'OUTPUT UCASE(Name)', 'OUTPUT Score + 10',
  'OUTPUT ROUND(Score / 3, 0)', 'OUTPUT LENGTH(Name)'];
assert(out(CALLS, ['Nok', 20]) === 'NOK,30,7,3', 'CALLS runs');
const callLines = CALLS.filter((l) => /\b(UCASE|ROUND|LENGTH|MOD|DIV|RANDOM)\(/.test(l)).length;
assert(callLines === 3, 'CALLS count');

// ---------------------------------------------------------------- 2.2 data types and constants
const LIVES = ['DECLARE Name : STRING', 'DECLARE Lives : INTEGER', 'Name <- "Mali"', 'Lives <- "5"', 'OUTPUT Lives + 1'];
assert(errLine(LIVES) === 4, 'LIVES error line');
const DIST = ['DECLARE Town : STRING', 'DECLARE Distance : INTEGER', 'Town <- "Songkhla"', 'Distance <- 28.5', 'OUTPUT Distance'];
const DIST_FIX = DIST.slice(); DIST_FIX[1] = 'DECLARE Distance : REAL';
assert(errLine(DIST) === 4 && out(DIST_FIX) === '28.5', 'DIST');
const TICKETS = ['CONSTANT Price <- 35', 'DECLARE Tickets : INTEGER', 'DECLARE Total : INTEGER', 'INPUT Tickets', 'Total <- Tickets * Price',
  'IF Total >= 140 THEN', '  Total <- Total - 20', 'ENDIF', 'OUTPUT Total'];
assert(out(TICKETS, [4]) === '120', 'TICKETS');

// ---------------------------------------------------------------- 2.3 conditional statements
const SPEED = ['DECLARE Speed : INTEGER', 'INPUT Speed'].concat(ifElse('Speed <= 60', 'Safe', 'Too fast'));
const safe = [58, 60, 61, 75].filter((s) => out(SPEED, [s]) === 'Safe').length;
assert(safe === 2, 'SPEED ' + safe);
const MEDAL = ['DECLARE Points : INTEGER', 'INPUT Points', 'Points <- Points + 4', 'IF Points >= 70 THEN', '  OUTPUT "Gold"', 'ELSE',
  '  IF Points >= 40 THEN', '    OUTPUT "Silver"', '  ELSE', '    OUTPUT "Bronze"', '  ENDIF', 'ENDIF'];
assert(out(MEDAL, [66]) === 'Gold', 'MEDAL');
const ORDER = ['DECLARE Score : INTEGER', 'INPUT Score', 'IF Score >= 40 THEN', '  OUTPUT "Pass"', 'ELSE', '  IF Score >= 75 THEN', '    OUTPUT "Merit"',
  '  ELSE', '    OUTPUT "Fail"', '  ENDIF', 'ENDIF'];
{ const outs = new Set(); for (let s = 0; s <= 100; s++) outs.add(out(ORDER, [s])); assert(!outs.has('Merit') && outs.has('Pass'), 'ORDER never Merit'); }
const RIDE5 = ['DECLARE Age : INTEGER', 'INPUT Age'].concat(ifElse('Age < 5', 'Free', 'Pay 30 baht'));
const RIDE5_FIX = RIDE5.slice(); RIDE5_FIX[2] = 'IF Age <= 5 THEN';
const wrongAges = [3, 5, 8, 12].filter((a) => out(RIDE5, [a]) !== (a <= 5 ? 'Free' : 'Pay 30 baht'));
assert(wrongAges.join() === '5', 'RIDE5 ' + wrongAges);
assert([3, 5, 6, 8].every((a) => out(RIDE5_FIX, [a]) === (a <= 5 ? 'Free' : 'Pay 30 baht')), 'RIDE5 fix');

// ---------------------------------------------------------------- 2.4 AND, OR and NOT
const RIDE = ['DECLARE Age : INTEGER', 'DECLARE Height : INTEGER', 'INPUT Age', 'INPUT Height'].concat(ifElse('Age >= 8 AND Height >= 120', 'Ride', 'Sorry'));
const pairs = [[8, 125], [12, 118], [7, 130], [11, 120]];
const rides = pairs.filter((p) => out(RIDE, p) === 'Ride').length;
assert(rides === 2, 'RIDE ' + rides);
const FREE = ['DECLARE Age : INTEGER', 'INPUT Age'].concat(ifElse('Age < 6 OR Age >= 60', 'Free', 'Pay'));
const FREE_AGES = [6, 60, 4];
const tf = (b) => (b ? 'TRUE' : 'FALSE');
const freeKey = FREE_AGES.map((a) => [String(a), tf(a < 6), tf(a >= 60), out(FREE, [a])]);
assert(JSON.stringify(freeKey) === JSON.stringify([['6', 'FALSE', 'FALSE', 'Pay'], ['60', 'FALSE', 'TRUE', 'Free'], ['4', 'TRUE', 'FALSE', 'Free']]), 'FREE key');
const rangeOk = (cond) => { const p = ['DECLARE Num : INTEGER', 'INPUT Num'].concat(ifElse(cond, 'In', 'Out'));
  for (let n = -5; n <= 20; n++) if ((out(p, [n]) === 'In') !== (n >= 1 && n <= 10)) return false; return true; };
const RANGE_OPTS = ['IF Num >= 1 AND Num <= 10 THEN', 'IF Num >= 1 OR Num <= 10 THEN', 'IF Num > 1 AND Num < 10 THEN', 'IF Num <= 1 AND Num >= 10 THEN'];
assert(RANGE_OPTS.filter((o) => rangeOk(o.replace(/^IF | THEN$/g, ''))).length === 1 && rangeOk('Num >= 1 AND Num <= 10'), 'RANGE');
const LOCK = ['DECLARE Locked : BOOLEAN', 'DECLARE Code : INTEGER', 'Locked <- TRUE', 'INPUT Code', 'IF Code = 4321 THEN', '  Locked <- FALSE', 'ENDIF']
  .concat(ifElse('NOT Locked', 'Open', 'Closed'));
assert(out(LOCK, [4321]) === 'Open' && out(LOCK, [1234]) === 'Closed', 'LOCK');
const SEATS = ['DECLARE Adults : INTEGER', 'DECLARE Children : INTEGER', 'DECLARE Seats : INTEGER', 'INPUT Adults', 'INPUT Children', 'Seats <- Adults + Children']
  .concat(ifElse('Seats < 1 AND Seats > 8', 'Rejected', 'Accepted'));
assert(out(SEATS, [6, 5]) === 'Accepted', 'SEATS');
const PRICE = ['DECLARE Age : INTEGER', 'DECLARE Member : BOOLEAN', 'DECLARE Price : INTEGER', 'Age <- 16', 'Member <- FALSE', 'Price <- 80',
  'IF Age < 16 AND NOT Member THEN', '  Price <- Price - 20', 'ENDIF', 'IF Age >= 16 OR Member THEN', '  Price <- Price - 10', 'ENDIF', 'OUTPUT Price'];
assert(out(PRICE) === '70', 'PRICE');

// ---------------------------------------------------------------- the test
const TYPES = ['INTEGER', 'REAL', 'STRING', 'BOOLEAN'];
const test = {
  id: 'y8-term1b', title: 'Year 8 Term 1b Test', subtitle: 'Library functions, data types and constants, IF statements, AND, OR and NOT', year: 'year8', minutes: 30,
  sections: [
    { title: 'Library Functions', questions: [
      { id: 'a1', type: 'short', input: 'number', marks: 1, prompt: 'The user types 200. What does this program output?', code: DIVP, accept: ['3'],
        scheme: 'DIV gives the whole number of times 60 goes into 200: 3. (3.33 divides; 20 is the remainder.)' },
      { id: 'a2', type: 'short', input: 'number', marks: 1, prompt: 'How many lines of this program call a library function?', code: CALLS, numbered: true, accept: [String(callLines)],
        scheme: 'Lines 5, 7 and 8 (UCASE, ROUND, LENGTH). DECLARE, INPUT and OUTPUT are part of the language.' },
      choice({ id: 'a3', prompt: '45 people sit in rows of 6. What does this program output?', code: MODP,
        options: ['3', '7', '7.5', '39'], answer: '3', scheme: 'MOD gives the remainder: 6 x 7 = 42, and 45 - 42 = 3.' }),
      { id: 'a4', type: 'short', input: 'number', marks: 1, prompt: 'What does this program output?', code: ROUNDP, accept: ['8.8'],
        scheme: '53 / 6 = 8.833..., rounded to 1 decimal place: 8.8.' },
      choice({ id: 'a5', prompt: 'RANDOM() gives a number from 0 to 1. Which whole numbers can Spin hold?', code: RANDP,
        options: ['2 to 10', '0 to 8', '2 to 8', '3 to 10'], answer: '2 to 10',
        scheme: 'RANDOM() * 8 is 0 to 8. ROUND makes it a whole number 0 to 8. Adding 2 gives 2 to 10.' }),
      { id: 'a6', type: 'short', input: 'number', marks: 1, prompt: 'The user types Chiang Mai. What does this program output?', code: LENP, numbered: true, accept: ['2'],
        scheme: 'LENGTH("Chiang Mai") is 10, because the space is a character. MOD(10, 4) is 2. (1 forgets the space.)' }
    ] },
    { title: 'Data Types and Constants', questions: [
      choice({ id: 'b1', prompt: 'A variable records whether a student has paid for a school trip. Which data type should it have?',
        options: TYPES, answer: 'BOOLEAN', scheme: 'Paid or not paid: only TRUE or FALSE.' }),
      { id: 'b2', type: 'short', input: 'number', marks: 1, prompt: 'This program stops with an error. On which line does it stop?', code: LIVES, numbered: true, accept: ['4'],
        scheme: 'Line 4: "5" in quotes is text, and Lives is an INTEGER.' },
      { id: 'b3', type: 'short', input: 'text', marks: 1, prompt: 'This program stops on line 4. Which data type should line 2 use?', code: DIST, numbered: true,
        accept: ['REAL'], scheme: 'REAL: 28.5 has a decimal part. An INTEGER holds whole numbers only.' },
      { id: 'b4', type: 'short', input: 'number', marks: 1, prompt: 'The user types 4. What does this program output?', code: TICKETS, numbered: true, accept: ['120'],
        scheme: 'Total = 4 x 35 = 140. 140 >= 140 is TRUE, so Total becomes 120. (140 misses the equal case.)' },
      { id: 'b5', type: 'long', marks: 2,
        prompt: 'A cinema program uses the ticket price on many lines. Give two reasons why the programmer should store the price as a constant, not type 35 on every line.',
        scheme: 'One mark each, two different reasons:\n- the price is changed in one place only, and every line uses the new value (no line is missed)\n- the name (Price) says what the number means, so the program is easier to read\n- the value cannot be changed by mistake while the program runs' }
    ] },
    { title: 'Conditional Statements', questions: [
      choice({ id: 'c1', prompt: 'The rule: you can join the club if you are 12 or older. Which line follows the rule?',
        options: ['IF Age >= 12 THEN', 'IF Age > 12 THEN', 'IF Age <= 12 THEN', 'IF Age < 12 THEN'], answer: 'IF Age >= 12 THEN',
        scheme: '"12 or older" includes 12, so >=.' }),
      { id: 'c2', type: 'short', input: 'number', marks: 1, prompt: 'The user runs this program four times and types 58, then 60, then 61, then 75. How many times does it output Safe?',
        code: SPEED, accept: [String(safe)], scheme: '58 and 60. 60 <= 60 is TRUE.' },
      { id: 'c3', type: 'short', input: 'text', marks: 1, prompt: 'The user types 66. What does this program output?', code: MEDAL, numbered: true, accept: ['Gold'],
        scheme: 'Line 3 makes Points 70 first (66 + 4). 70 >= 70 is TRUE, so Gold.' },
      choice({ id: 'c4', prompt: 'Which scores make this program output Merit?', code: ORDER, numbered: true,
        options: ['No score can', '75 or more', '40 to 74', 'Less than 40'], answer: 'No score can',
        scheme: 'Every score of 75 or more is also 40 or more, so line 3 is TRUE first and the Merit check is skipped.' }),
      { id: 'c5', type: 'short', input: 'number', marks: 1,
        prompt: 'The rule: children aged 5 or under ride free. Everyone else pays 30 baht. A tester types each of these ages: 3, 5, 8, 12. Which age gives the wrong output?',
        code: RIDE5, numbered: true, accept: ['5'], scheme: '5 should be free, but 5 < 5 is FALSE, so it outputs Pay 30 baht.' },
      { id: 'c6', type: 'short', input: 'code', marks: 1, prompt: 'Look at the same program. Write the correct line 3.', code: RIDE5, numbered: true,
        accept: ['IF Age <= 5 THEN', 'IF Age < 6 THEN', 'IF 5 >= Age THEN', 'IF 6 > Age THEN'], placeholder: 'IF ...', scheme: 'IF Age <= 5 THEN (or IF Age < 6 THEN)' }
    ] },
    { title: 'AND, OR and NOT', questions: [
      { id: 'd1', type: 'short', input: 'number', marks: 1,
        prompt: 'The user runs this program four times. Age and Height typed in: 8 and 125, then 12 and 118, then 7 and 130, then 11 and 120. How many times does it output Ride?',
        code: RIDE, accept: [String(rides)], scheme: '8 and 125, 11 and 120. With AND, both conditions must be TRUE.' },
      { id: 'd2', type: 'table', marks: 3, prompt: 'Complete the table for each Age typed in. Write TRUE or FALSE for each condition, then the output.', code: FREE, numbered: true,
        columns: ['Age', 'Age < 6', 'Age >= 60', 'OUTPUT'], rows: 3, given: { '0,0': '6', '1,0': '60', '2,0': '4' },
        key: freeKey,
        points: [
          { text: 'Age 6: FALSE, FALSE, Pay', cells: [[0, 1], [0, 2], [0, 3]] },
          { text: 'Age 60: FALSE, TRUE, Free', cells: [[1, 1], [1, 2], [1, 3]] },
          { text: 'Age 4: TRUE, FALSE, Free', cells: [[2, 1], [2, 2], [2, 3]] }
        ] },
      choice({ id: 'd3', prompt: 'A quiz accepts a number from 1 to 10. Which line lets in only the numbers 1 to 10?',
        options: RANGE_OPTS, answer: RANGE_OPTS[0], scheme: 'A number inside a range needs both conditions, joined with AND, and both include the end numbers.' }),
      { id: 'd4', type: 'short', input: 'text', marks: 1, prompt: 'The user types 4321. What does this program output?', code: LOCK, numbered: true, accept: ['Open'],
        scheme: 'Line 6 makes Locked FALSE. NOT FALSE is TRUE, so Open.' },
      { id: 'd5', type: 'short', input: 'text', marks: 1,
        prompt: 'The rule: a booking must be for 1 to 8 seats. The user types 6, then 5. What does this program output?', code: SEATS, numbered: true, accept: ['Accepted'],
        scheme: 'Seats is 11. 11 < 1 is FALSE, so the AND is FALSE. No number is less than 1 and more than 8, so it always outputs Accepted.' },
      { id: 'd6', type: 'short', input: 'number', marks: 1, prompt: 'What does this program output?', code: PRICE, numbered: true, accept: ['70'],
        scheme: 'Line 7: 16 < 16 is FALSE, so no 20 off. Line 10: 16 >= 16 is TRUE, so 10 off. 80 - 10 = 70.' }
    ] }
  ]
};
const qs = test.sections.flatMap((s) => s.questions);

// Topics for the dashboard's Practice tab, and the drill suggested for each. 2.4 has no drill of its own, so its
// topics go to the revision drill.
const TOPIC = {
  a1: 'Library functions', a2: 'Library functions', a3: 'Library functions', a4: 'ROUND and RANDOM', a5: 'ROUND and RANDOM', a6: 'Library functions',
  b1: 'Data types', b2: 'Data types', b3: 'Data types', b4: 'Constants', b5: 'Constants',
  c1: 'Comparing with > and >=', c2: 'Comparing with > and >=', c5: 'Comparing with > and >=', c6: 'Comparing with > and >=', c3: 'Nested IF', c4: 'Nested IF',
  d1: 'AND and OR', d2: 'AND and OR', d3: 'AND and OR', d5: 'AND and OR', d4: 'NOT', d6: 'NOT'
};
qs.forEach((q) => { assert(TOPIC[q.id], 'topic for ' + q.id); q.topic = TOPIC[q.id]; });
test.topicDrills = {
  'Library functions': 'y8-2-1-predict', 'ROUND and RANDOM': 'y8-2-1-libraries', 'Data types': 'y8-2-2-types', 'Constants': 'y8-2-2-data-types',
  'Comparing with > and >=': 'y8-2-3-conditions', 'Nested IF': 'y8-2-3-branch', 'AND and OR': 'y8-term1b-practice', 'NOT': 'y8-term1b-practice',
  '*': 'y8-term1b-practice'
};
Object.values(test.topicDrills).forEach((d) => assert(fs.existsSync(path.join(ROOT, 'Drills', 'data', d + '.js')), 'drill file ' + d));
assert(new Set(qs.map((q) => q.id)).size === qs.length, 'unique ids');
qs.filter((q) => q.type === 'choice').forEach((q) => assert(q.options.length === 4 && new Set(q.options).size === 4 && q.options.includes(q.answer), 'hinge has 4 options ' + q.id));
const total = qs.reduce((t, q) => t + q.marks, 0);
assert(!/[–—]/.test(JSON.stringify(test)), 'dash in test');

// ---------------------------------------------------------------- write it into TestBank.gs
const bankPath = path.join(SHELL, 'TestBank.gs');
let bank = fs.readFileSync(bankPath, 'utf8');
const crlf = bank.includes('\r\n'); bank = bank.replace(/\r\n/g, '\n');
const BEGIN = '  // BEGIN y8-term1b (generated by the pages repo tools/build_y8_term1b_test.mjs; edit that, not this)';
const END = '  // END y8-term1b';
const block = BEGIN + '\n  ' + JSON.stringify(test) + ',\n' + END;
if (bank.includes(BEGIN)) bank = bank.replace(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END), () => block);
else bank = bank.replace('  // END y8-term1\n', () => '  // END y8-term1\n' + block + '\n');
assert(bank.includes(BEGIN), 'placed in TestBank.gs');
if (!DRY) fs.writeFileSync(bankPath, crlf ? bank.replace(/\n/g, '\r\n') : bank);

// ---------------------------------------------------------------- the lesson
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const LID = 'y8-term1b-test';
const steps = [
  { id: 'title', label: 'Term 1b Test',
    content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Programming, Logic and Testing</p><h2 class="lesson-h2">Term 1b Test</h2><p>Year 8</p></div>' +
      facts(['<strong>First:</strong> 20 minutes of revision practice.', '<strong>Then:</strong> a 30-minute test on this website.',
        '<strong>Topics:</strong> library functions, data types and constants, IF and nested IF, AND, OR and NOT.']) +
      tps('Which topic do you find hardest?', 'Practise that topic most in the next 20 minutes.') },
  { id: 'revision', label: 'Revision Practice', type: 'embedded-app', appId: 'drill-y8-term1b-practice', embedContainerId: 'y8t1b-revision',
    content: '<h2 class="lesson-h2">Revision Practice</h2>' +
      tps('A program changes a variable, then an IF tests it. Which value does the IF use?', 'The new value. Lines run in order, top to bottom.') +
      '<p class="lesson-lead">20 minutes. Practise every topic. Trace each program one line at a time.</p><div id="y8t1b-revision"></div>' },
  { id: 'how-it-works', label: 'How the Test Works',
    content: '<h2 class="lesson-h2">How the Test Works</h2>' +
      tps('A condition joins two checks with AND. How can you check your answer?', 'Write TRUE or FALSE above each check first. Then join them.') +
      facts(['You have <strong>30 minutes</strong> from when you press <strong>Start</strong>.', 'Your answers <strong>save as you type</strong>.',
        'During the test you <strong>cannot open the rest of the website</strong>.', 'The notepad works, but it starts <strong>empty</strong>. Use it to trace the programs.',
        'Press <strong>Hand in</strong> when you finish. When time runs out, it hands in for you.']) },
  { id: 'test', label: 'The Test', type: 'app-link', appId: 'tests', buttonId: 'y8t1b-open-test',
    content: '<h2 class="lesson-h2">The Test</h2>' + tps('You finish early. What should you do?', 'Trace every program again. Check each answer one line at a time.') +
      '<p class="lesson-lead">30 minutes. Wait until your teacher says the test is open. Then press the button, and press Start.</p>' +
      '<p><button type="button" class="donow-btn" id="y8t1b-open-test">Open the test</button></p>' }
];
assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash in lesson');
if (!DRY) fs.writeFileSync(path.join(ROOT, 'LessonData', LID + '.json'), JSON.stringify({ id: LID, label: 'Term 1b Test', steps, validators: {}, pseudocodeValidators: {} }, null, 1) + '\n');
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const units = all.years.find((y) => y.id === 'year8').units;
const unit = units.find((u) => /term 1b/i.test(u.title)) || units.find((u) => u.title === 'Programming, Logic and Testing');
if (!unit.lessons.includes(LID)) unit.lessons.push(LID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
if (!DRY) fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`y8-term1b: ${qs.length} questions, ${total} marks; lesson ${LID}; unit ${unit.title}: ${unit.lessons.join(', ')}`);
