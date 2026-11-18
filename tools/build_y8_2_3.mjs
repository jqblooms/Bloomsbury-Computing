// Builds LessonData/y8-2-3-conditions.json: Year 8, Unit 2 Programming, Logic and Testing, 2.3 Conditional Statements
// (8P.04: develop text-based programs that use conditional selection statements; 8CT.07: predict which branch runs,
// and test that a conditional algorithm gives the intended outcome), its three drills (Drills/data/y8-2-3-branch.js,
// y8-2-3-code.js, y8-2-3-conditions.js), and registers the lesson after 2.2.
//   node tools/build_y8_2_3.mjs
// Cambridge pseudocode as in 2.1 and 2.2 (shared pieces in tools/y8_unit2_kit.mjs). Every slide output comes from
// shared/pseudocode-engine.js. The engine has no CASE, so three outcomes use an IF inside the ELSE of another IF
// (nested), as Cambridge pseudocode writes it. AND, OR and NOT are 2.4; the words normal, boundary and erroneous test
// data are 2.6, so testing here is "one value for each branch, and the number written in the condition".
// The Extension reuses the 2.2 plenary drill. Three PyScratch Task slides embed pages PyScratchTask/ (tasks in
// PyScratchTask/tasks/y8-2-3.js): task 1 after Activity 1, 2 and 3 after Activity 2. Circuit Siege uses the
// y8-data-types set (2.1 and 2.2 questions, spaced retrieval).
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, assert, code, facts, columns, caption, note, hl, tps, table, run, outs, runError, num, word, NO,
  makeLesson, checkLesson, drillKit, body, writeDrill, registerY8Unit2, esc,
} from './y8_unit2_kit.mjs';

const ID = 'y8-2-3-conditions';
const P = 'y823';
const { validators, checkStep, embed, mcStep, selfMarked, V } = makeLesson(P);
const TYPE_RE = {
  INTEGER: '^\\s*(an?\\s+)?(integer|int)\\s*[.!]?\\s*$',
  REAL: '^\\s*(an?\\s+)?real(\\s+number)?\\s*[.!]?\\s*$',
};
const NO_EVER = "^\\s*(no|nope|never|it\\s+(can\\s*not|can'?t|can\\s+never|never|will\\s+not|won'?t)\\b.*|not\\s+ever)\\s*[.!]?\\s*$";

const TPS = {
  'do-now': ['Why does a program check the data type when a value is stored, and not later?', 'The wrong kind of value would cause problems in every line that uses it. Stopping at once shows exactly where it went in.'],
  'do-now-2': ['Why is the team size a constant and not a variable?', 'It is set once and the program never needs to change it while it runs.'],
  'operators-check': ['Why write the value of Coins into each condition before you decide?', 'Then you compare two numbers you can see, and nothing is kept only in your head.'],
  'predict-edge': ['Why put the typed value into the IF line before you choose?', 'The IF line is where the program decides. Your answer depends on what that line gives.'],
  'predict-edge-2': ['Why does the symbol matter as much as the number in an IF line?', 'Two IF lines with the same number but different symbols can choose different branches.'],
  'order-check': ['Why read the rule above the program before you trace it?', 'The rule says what should happen. The trace shows what does happen. You need both to spot a mistake.'],
  'activity-1': ['Why predict first, then check?', 'A wrong prediction shows you which rule to look at again.'],
  'pyscratch-1': ['Why type in more than one value when you test your fix?', 'A fix for one value can break another. Each value tries a different part of the program.'],
  'test-check': ['Why does a tester write down the expected output before running the program?', 'So the real output can be compared with it. Without it, a wrong output can look fine.'],
  'activity-2': ['Why does the drill type in new values every time?', 'A program must work for any value it is given, not just one.'],
  'pyscratch-2': ['Why is the program still right for a score of 60 after your change?', 'Your change must only add a new outcome. The old ones must still work the same way.'],
  'pyscratch-3': ['Why does Check my program change Limit and run your program again?', 'If the result changes too, the IF really uses the constant. A number typed into the IF would not change.'],
  'practice': ['Why can a program have no error message and still be wrong?', 'The computer runs what is written, not what the programmer meant.'],
  'how-to-play': ['Why do the questions come between the waves?', 'You need coins for towers, and right answers earn them. Thinking well keeps your base safe.'],
  'game': ['Why read the whole program before you answer?', 'One line at the top, like a DECLARE or a CONSTANT, changes what every later line can do.'],
  'plenary': ['Why practise with new values every time?', 'If you can trace any value, you really know how the IF chooses.'],
};

const steps = [];
// Explain It: AI-marked by Haiku only (aiModel "haiku"), as Y8 2.2.
function explainIt(id, label, about, part, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + tps(whyQ[0], `<p>${whyQ[1]}</p>`) + extra +
      '<p class="lesson-lead">Explain it in your own words. Press <strong>Check my answer</strong> to have it marked.</p>' + `<div id="${cid}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part)] };
}

// ---------------------------------------------------------------- Do Now 1 (2.2): data types
const DN1 = ['DECLARE Name : STRING', 'DECLARE Height : INTEGER', 'DECLARE Paid : BOOLEAN', 'Name <- "Nok"', 'Height <- 1.47', 'Paid <- TRUE', 'OUTPUT Name'];
{ const e = runError(DN1); assert(e && e.line === 5, 'do-now 1 stops on line 5'); const f = DN1.slice(); f[1] = 'DECLARE Height : REAL'; assert(outs(f)[0] === 'Nok', 'do-now 1 fixed'); }
const WDN1 = ['DECLARE Town : STRING', 'DECLARE Lives : STRING', 'Town <- "Songkhla"', 'Lives <- 3', 'OUTPUT Town'];
{ const e = runError(WDN1); assert(e && e.line === 4, 'walkthrough 1'); const f = WDN1.slice(); f[1] = 'DECLARE Lives : INTEGER'; assert(outs(f)[0] === 'Songkhla', 'walkthrough 1 fixed'); }
const WT_TYPES = { title: 'Walk me through it: the wrong data type', steps: [
  { text: 'This is a different program. Do the same steps with your program.', visual: code(WDN1) },
  { text: 'DECLARE does not store anything. It only gives each variable its data type.', visual: code(WDN1, false, [1, 2]) },
  { text: 'Line 3 stores "Songkhla" in Town. It is in quotes, so it is text. Town is a STRING, so that is fine.', visual: code(WDN1, false, [3]) },
  { text: 'Line 4 stores 3 in Lives. 3 has no quotes: it is a whole number. Lives was declared as a STRING, so the program stops here, on line 4.', visual: code(WDN1, false, [4]) + note('Lives &lt;- 3: ' + hl('stops here')) },
  { text: 'The fix goes on the DECLARE line. A whole number needs <strong>INTEGER</strong>, so line 2 becomes DECLARE Lives : INTEGER. Now do yours.', visual: code(WDN1, false, [2]) },
] };
steps.push(checkStep('do-now', 'Do Now: Data Types (1 of 2)', 'Do Now: Data Types (1 of 2)', 'From 2.2: data types. The program stops with an error.', [
  { label: 'On which line does the program stop?', answer: num(5), feedback: 'DECLARE lines never stop it. Find the line that stores a value the variable cannot hold.' },
  { label: 'Which data type should Height have?', answer: TYPE_RE.REAL, feedback: 'Look at the value stored in Height. Does it have a decimal part?' },
], code(DN1, true)));
steps[steps.length - 1].walkthrough = WT_TYPES;

// ---------------------------------------------------------------- Do Now 2 (2.1 and 2.2): a constant with DIV and MOD
const DN2 = ['CONSTANT TeamSize <- 4', 'DECLARE Pupils : INTEGER', 'INPUT Pupils', 'OUTPUT DIV(Pupils, TeamSize)', 'OUTPUT MOD(Pupils, TeamSize)'];
assert(outs(DN2, [30]).join() === '7,2', 'do-now 2');
assert(outs(['CONSTANT TeamSize <- 5'].concat(DN2.slice(1)), [30])[1] === '0', 'do-now 2c');
const WDN2 = ['CONSTANT BoxSize <- 6', 'DECLARE Eggs : INTEGER', 'INPUT Eggs', 'OUTPUT DIV(Eggs, BoxSize)', 'OUTPUT MOD(Eggs, BoxSize)'];
assert(outs(WDN2, [27]).join() === '4,3' && outs(['CONSTANT BoxSize <- 8'].concat(WDN2.slice(1)), [27]).join() === '3,3', 'walkthrough 2');
const WT_DIVMOD = { title: 'Walk me through it: DIV, MOD and a constant', steps: [
  { text: 'This is a different program. 27 is typed in. Do the same steps with your program.', visual: code(WDN2) },
  { text: 'BoxSize is a constant: it is 6 on every line that uses it.', visual: code(WDN2, false, [1]) + note('BoxSize = 6') },
  { text: 'DIV gives the whole number of times. 6 x 4 = 24, and 6 x 5 = 30 is too many.', visual: code(WDN2, false, [4]) + note('DIV(27, 6) = ' + hl('4')) },
  { text: 'MOD gives what is left over: 27 - 24 = <strong>3</strong>.', visual: code(WDN2, false, [5]) + note('MOD(27, 6) = ' + hl('3')) },
  { text: 'Now line 1 is changed to 8. Every line that uses BoxSize uses 8 now. 8 x 3 = 24, so MOD(27, 8) is 27 - 24 = <strong>3</strong>. Now do yours.', visual: code(['CONSTANT BoxSize <- 8'].concat(WDN2.slice(1)), false, [1, 5]) },
] };
steps.push(checkStep('do-now-2', 'Do Now: DIV, MOD and a Constant (2 of 2)', 'Do Now: DIV, MOD and a Constant (2 of 2)', 'From 2.1 and 2.2. 30 is typed in.', [
  { label: 'What does line 4 output?', answer: num(7), feedback: 'DIV counts how many whole teams of 4 fit into the number.' },
  { label: 'What does line 5 output?', answer: num(2), feedback: 'MOD gives what is left over after the whole teams are made.' },
  { line: true, label: 'Line 1 is changed to CONSTANT TeamSize <- 5. What does line 5 output now?', answer: num(0), feedback: 'Every line that uses TeamSize changes. How many are left over after teams of 5?' },
], code(DN2, true)));
steps[steps.length - 1].walkthrough = WT_DIVMOD;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-2-2-data-types', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on data types and constants from 2.2. Stuck? Switch on <strong>I need help</strong> for a nudge or a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '2.3: Conditional Statements',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Programming, Logic and Testing</p><h2 class="lesson-h2">2.3: Conditional Statements</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> write programs that choose what to do, predict which lines run, and test that they choose right.', '<strong>The big question:</strong> how does a program decide, and how do we know it decides correctly?']) +
    tps('A lift door opens when a button is pressed. A game says "Game over" when lives run out. How can a program do different things at different times?', '<p>It asks a question about a value, like "Are the lives 0?". The answer decides which lines run.</p>') });

// ---------------------------------------------------------------- a condition and its two branches
const AGE = (op) => ['DECLARE Age : INTEGER', 'INPUT Age', `IF Age ${op} 13 THEN`, '    OUTPUT "Join the club"', 'ELSE', '    OUTPUT "Not yet"', 'ENDIF'];
assert(outs(AGE('>='), [12])[0] === 'Not yet' && outs(AGE('>='), [14])[0] === 'Join the club', 'condition');
steps.push({ id: 'condition', label: 'What Is a Condition?',
  content: '<h2 class="lesson-h2">What Is a Condition?</h2>' +
    tps('Predict: 12 is typed in. What is output? Why does the other OUTPUT line never run?',
      '<p><strong>Not yet</strong>.</p><p><strong>Why?</strong> 12 &gt;= 13 is FALSE, so the program jumps to ELSE. Only one of the two branches runs each time.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A <strong>condition</strong> is a question with only two answers: TRUE or FALSE.</p>' +
    columns(code(AGE('>='), true, [3]),
      facts(['Line 3 holds the condition: Age &gt;= 13.', 'TRUE: the <strong>THEN branch</strong> runs (line 4).', 'FALSE: the <strong>ELSE branch</strong> runs (line 6).', 'A <strong>branch</strong> is the lines for one answer. Only one branch runs.'])) });

// ---------------------------------------------------------------- the six comparison operators
const OPS = [['=', 'is equal to'], ['<>', 'is not equal to'], ['<', 'is less than'], ['<=', 'is less than or equal to'], ['>', 'is more than'], ['>=', 'is more than or equal to']];
const tf = (cond, setup) => outs([...setup, `IF ${cond} THEN`, '    OUTPUT "TRUE"', 'ELSE', '    OUTPUT "FALSE"', 'ENDIF'])[0];
const S10 = ['DECLARE Score : INTEGER', 'Score <- 10'];
const opRows = OPS.map(([o, m]) => [`<code>${esc(o)}</code>`, m, `<code>Score ${esc(o)} 10</code>`, tf(`Score ${o} 10`, S10)]);
assert(opRows.map((r) => r[3]).join() === 'TRUE,FALSE,FALSE,TRUE,FALSE,TRUE', 'operator table');
steps.push({ id: 'operators', label: 'Six Comparison Operators',
  content: '<h2 class="lesson-h2">Six Comparison Operators</h2>' +
    tps('Score is 10. Why is Score &gt; 10 FALSE, but Score &gt;= 10 TRUE?',
      '<p>10 is not more than 10. But 10 is equal to 10, and &gt;= lets in "equal to" as well. One symbol changes the answer for that exact number.</p>') +
    '<p class="lesson-lead">A <strong>comparison operator</strong> compares two values. Here Score is 10.</p>' +
    table(['Operator', 'Meaning', 'Example', 'Answer'], opRows) });

const C7 = ['DECLARE Coins : INTEGER', 'Coins <- 7'];
assert(tf('Coins <> 7', C7) === 'FALSE' && tf('Coins <= 7', C7) === 'TRUE' && tf('Coins > 7', C7) === 'FALSE', 'operators-check');
const TRUE_RE = word('true'), FALSE_RE = word('false');
steps.push(checkStep('operators-check', 'Your Turn: TRUE or FALSE?', 'Your Turn: TRUE or FALSE?', 'Coins is 7. Type TRUE or FALSE for each condition.', [
  { label: 'Coins &lt;&gt; 7', answer: FALSE_RE, feedback: 'The symbol &lt;&gt; means "is not equal to". Is 7 not equal to 7?' },
  { label: 'Coins &lt;= 7', answer: TRUE_RE, feedback: 'The symbol &lt;= means "is less than or equal to". Is 7 equal to 7?' },
  { label: 'Coins &gt; 7', answer: FALSE_RE, feedback: 'The symbol &gt; means "is more than". Is 7 more than 7?' },
]));

// ---------------------------------------------------------------- > and >=
assert(outs(AGE('>'), [13])[0] === 'Not yet' && outs(AGE('>='), [13])[0] === 'Join the club', 'compare-edge');
steps.push({ id: 'compare-edge', label: 'Compare: > and >=',
  content: '<h2 class="lesson-h2">Compare: &gt; and &gt;=</h2>' +
    tps('Predict: 13 is typed into both programs. Which one lets the pupil join? Which program follows the rule?',
      '<p>A outputs <strong>Not yet</strong>. B outputs <strong>Join the club</strong>.</p><p><strong>Why?</strong> 13 &gt; 13 is FALSE, but 13 &gt;= 13 is TRUE. The rule says 13 or older, so B is right. For 12 or 14 the two programs give the same answer. Only 13 shows the difference.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">The rule: pupils aged <strong>13 or older</strong> can join the club.</p>' +
    columns(caption('A') + code(AGE('>'), false, [3]), caption('B') + code(AGE('>='), false, [3])) });

const EA = ['DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark > 50 THEN', '    OUTPUT "Pass"', 'ELSE', '    OUTPUT "Fail"', 'ENDIF'];
const EB = ['DECLARE Speed : INTEGER', 'INPUT Speed', 'IF Speed <= 90 THEN', '    OUTPUT "OK"', 'ELSE', '    OUTPUT "Too fast"', 'ENDIF'];
assert(outs(EA, [50])[0] === 'Fail' && outs(EB, [90])[0] === 'OK', 'predict-edge');
steps.push(mcStep('predict-edge', 'Predict: Which Branch Runs? (1 of 2)', 'Predict: Which Branch Runs? (1 of 2)', 'Read the program. Choose the output. The answer shows after you choose.', [
  { prompt: '50 is typed in. What is output?', options: ['Pass', 'Fail', 'Pass, then Fail', 'Nothing'], correct: 1,
    explain: '50 > 50 is FALSE: 50 is not more than itself. So the ELSE branch runs.' },
], code(EA, true, [], true)));
steps.push(mcStep('predict-edge-2', 'Predict: Which Branch Runs? (2 of 2)', 'Predict: Which Branch Runs? (2 of 2)', 'Read the program. Choose the output. The answer shows after you choose.', [
  { prompt: '90 is typed in. What is output?', options: ['OK', 'Too fast', 'OK, then Too fast', 'Nothing'], correct: 0,
    explain: '90 <= 90 is TRUE: <= lets in "equal to". So the THEN branch runs.' },
], code(EB, true, [], true)));

// ---------------------------------------------------------------- an IF inside an IF
const MEDAL = ['DECLARE Score : INTEGER', 'INPUT Score', 'IF Score >= 80 THEN', '    OUTPUT "Gold"', 'ELSE', '    IF Score >= 50 THEN', '        OUTPUT "Silver"', '    ELSE', '        OUTPUT "Bronze"', '    ENDIF', 'ENDIF'];
assert(outs(MEDAL, [85])[0] === 'Gold' && outs(MEDAL, [65])[0] === 'Silver' && outs(MEDAL, [30])[0] === 'Bronze' && outs(MEDAL, [85]).length === 1, 'nested');
steps.push({ id: 'nested', label: 'Three Outcomes: An IF Inside an IF',
  content: '<h2 class="lesson-h2">Three Outcomes: An IF Inside an IF</h2>' +
    tps('Predict: 65 is typed in. Which line is output? Why does line 6 get checked at all?',
      '<p><strong>Silver</strong>.</p><p><strong>Why?</strong> 65 &gt;= 80 is FALSE, so the program goes to the ELSE branch. The ELSE branch holds a second IF. 65 &gt;= 50 is TRUE, so Silver is output.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">One IF has two branches. For three outcomes, put a second IF inside the ELSE. This is a <strong>nested</strong> IF.</p>' +
    columns(code(MEDAL, true), facts(['80 or more: Gold.', '50 to 79: Silver.', 'Under 50: Bronze.', 'Each IF needs its own ENDIF.'])) });

const stepCode = (hlLines) => code(MEDAL, true, hlLines, true);
steps.push({ id: 'watch', label: 'Watch the Program Choose', type: 'stepper', stepperId: `${P}-watch`,
  content: '<h2 class="lesson-h2">Watch the Program Choose</h2>' +
    tps('Why say the next line out loud before you press Next?', '<p>Predicting first shows you if you really know the rule. A wrong prediction tells you what to look at again.</p>') +
    '<p class="lesson-lead">Press <strong>Next step</strong>. Before each press, say which line runs next.</p>' + `<div id="${P}-watch"></div>`,
  stepperSteps: [
    { title: '85 is typed in', html: stepCode([2]) + note('Score = 85'), note: 'Which IF is checked first?' },
    { title: 'The first condition', html: stepCode([3]) + note('85 &gt;= 80 is ' + hl('TRUE')), note: 'TRUE: the THEN branch runs.' },
    { title: 'Gold, then the end', html: stepCode([4, 11]) + note('Output: Gold. The whole ELSE branch is skipped.'), note: 'Line 6 is never checked for 85.' },
    { title: '65 is typed in', html: stepCode([3, 5]) + note('65 &gt;= 80 is ' + hl('FALSE') + ', so go to ELSE'), note: 'Now the second IF is checked.' },
    { title: 'The second condition', html: stepCode([6, 7]) + note('65 &gt;= 50 is ' + hl('TRUE') + '. Output: Silver'), note: 'Only one line is output.' },
    { title: '30 is typed in', html: stepCode([3, 6, 9]) + note('30 &gt;= 80 is FALSE. 30 &gt;= 50 is FALSE. Output: Bronze'), note: 'Both conditions are FALSE.' },
  ] });

steps.push(explainIt('explain-skip', 'Explain It: Why Only Gold?', 'Year 8 pseudocode lesson on IF statements. The program is the nested IF: IF Score >= 80 THEN OUTPUT "Gold" ELSE (IF Score >= 50 THEN OUTPUT "Silver" ELSE OUTPUT "Bronze" ENDIF) ENDIF. The class watched 85, 65 and 30 traced through it line by line.', {
  prompt: '85 is typed in. 85 is also 50 or more. Explain why the program outputs Gold only, and not Silver as well.', marks: 2,
  modelAnswer: '85 >= 80 is TRUE, so the THEN branch runs and outputs Gold (1). The ELSE branch is skipped, so the Score >= 50 check is never made (1).',
  scheme: ['The first condition (Score >= 80 / 85 >= 80) is TRUE, so the THEN branch runs / Gold is output',
    'The ELSE branch is skipped / the second IF (Score >= 50) is never checked / only one branch runs'],
  guidance: 'Credit the idea in the student\'s own words. Point 2 needs the idea that the second check is skipped or not reached; "only one branch runs" alone earns it. Do not award point 2 for just restating that Gold is output.' },
  ['Why is it useful to trace a program with your finger, one line at a time?', 'You see each line the computer really reaches, in order, and you do not guess.'],
  code(MEDAL, false, [], true)));

// ---------------------------------------------------------------- the order of the checks
const ORD_A = ['DECLARE Score : INTEGER', 'INPUT Score', 'IF Score >= 50 THEN', '    OUTPUT "Silver"', 'ELSE', '    IF Score >= 80 THEN', '        OUTPUT "Gold"', '    ELSE', '        OUTPUT "Bronze"', '    ENDIF', 'ENDIF'];
assert(outs(ORD_A, [85])[0] === 'Silver' && outs(MEDAL, [85])[0] === 'Gold', 'order');
steps.push({ id: 'order', label: 'Compare: Which IF Comes First?',
  content: '<h2 class="lesson-h2">Compare: Which IF Comes First?</h2>' +
    tps('Predict: 85 is typed into both. What does each one output? Can A ever output Gold?',
      '<p>A outputs <strong>Silver</strong>. B outputs <strong>Gold</strong>.</p><p><strong>Why?</strong> In A, 85 &gt;= 50 is TRUE first, so the ELSE branch, with the Gold check, is skipped. Every score of 80 or more is also 50 or more, so A can never output Gold. Check the biggest group first.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">Same rule: 80 or more is Gold, 50 or more is Silver. The checks are in a different order.</p>' +
    columns(caption('A: 50 first') + code(ORD_A, false, [3, 6], true), caption('B: 80 first') + code(MEDAL, false, [3, 6], true)) });

const TEMP = ['DECLARE Temp : INTEGER', 'INPUT Temp', 'IF Temp >= 20 THEN', '    OUTPUT "Warm"', 'ELSE', '    IF Temp >= 30 THEN', '        OUTPUT "Hot"', '    ELSE', '        OUTPUT "Cold"', '    ENDIF', 'ENDIF'];
assert(outs(TEMP, [35])[0] === 'Warm' && outs(TEMP, [10])[0] === 'Cold' && [...Array(80).keys()].every((t) => outs(TEMP, [t - 20])[0] !== 'Hot'), 'order-check');
steps.push(checkStep('order-check', 'Your Turn: Check the Order', 'Your Turn: Check the Order', 'The rule: 30 or more is Hot, 20 to 29 is Warm, under 20 is Cold.', [
  { label: '35 is typed in. What is output?', answer: word('warm'), feedback: 'Start at line 3. Is that condition TRUE for 35? If it is, the ELSE branch is skipped.' },
  { label: '10 is typed in. What is output?', answer: word('cold'), feedback: 'Line 3 first, then the IF inside the ELSE.' },
  { line: true, label: 'Can this program ever output Hot? Type yes or no.', answer: NO_EVER, feedback: 'To reach line 7, line 3 must be FALSE. Can a number be under 20 and 30 or more at once?' },
], code(TEMP, true, [], true)));

steps.push(explainIt('explain-order', 'Explain It: Why Check 80 First?', 'Year 8 pseudocode lesson on nested IF statements. Program A checked Score >= 50 first and Score >= 80 inside its ELSE, so 85 gave Silver and Gold was never output. Program B checked Score >= 80 first and gave Gold.', {
  prompt: 'Explain why the Score >= 80 check must come before the Score >= 50 check.', marks: 2,
  modelAnswer: 'A score of 80 or more is also 50 or more, so if the 50 check came first it would be TRUE (1). Then the ELSE branch with the 80 check is skipped, so Gold would never be output (1).',
  scheme: ['A score of 80 or more is also 50 or more / the >= 50 condition is TRUE for high scores too',
    'So the 80 check would be skipped / never reached, and Gold would never be output / high scores get Silver'],
  guidance: 'Credit the idea in the student\'s own words, with any example score of 80 or more. Point 2 follows on from point 1.' },
  ['Why say your explanation to a partner before you type it?', 'Saying it out loud shows the gaps. Your partner can ask what you mean.']));

steps.push(embed('activity-1', 'Activity 1: Which Branch Runs?', 'drill-y8-2-3-branch', 'Activity 1: Which Branch Runs?',
  'Predict each answer, then check. The programs and values change every time, and they get harder: TRUE or FALSE, one IF, a nested IF, then choose the operator.'));

// ---------------------------------------------------------------- PyScratch Tasks (pages PyScratchTask/tasks/y8-2-3.js)
const PST_LEAD = '<strong>What to do:</strong> fix or write the program in the box on the left. Click the green flag above the stage to run it. When it works, click <strong>Check my program</strong>.';
const pst = (id, task, n, what) => Object.assign(embed(id, `Activity: PyScratch Task ${n}`, 'pyscratch-task', `Activity: PyScratch Task ${n} of 3`,
  (n === 1 ? PST_LEAD + ' ' : '') + what), { embedQuery: 'task=' + task });
steps.push(pst('pyscratch-1', 'y8-2-3-ride', 1, 'Task 1 of 3: fix one line.'));

// ---------------------------------------------------------------- testing every branch
const CIN = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age > 65 THEN', '    OUTPUT 40', 'ELSE', '    OUTPUT 100', 'ENDIF'];
assert(outs(CIN, [30])[0] === '100' && outs(CIN, [70])[0] === '40' && outs(CIN, [65])[0] === '100', 'test-paths');
steps.push({ id: 'test-paths', label: 'Test Every Branch',
  content: '<h2 class="lesson-h2">Test Every Branch</h2>' +
    tps('Sam tested 30 and 70, and both outputs were right. He says the program works. Is he right? Which age would you test?',
      '<p>No. Type <strong>65</strong>: the program outputs 100, but the rule says 40.</p><p><strong>Why?</strong> 65 &gt; 65 is FALSE. The IF line should use &gt;=. Sam tested each branch once, but not the number written in the condition, where &gt; and &gt;= give different answers.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">The rule: a cinema ticket costs 40 baht for people aged <strong>65 or older</strong>, and 100 baht for everyone else.</p>' +
    columns(code(CIN, true, [3]) + table(['Age typed', 'Expected', 'Output'], [['30', '100', '100'], ['70', '40', '40']]),
      facts(['Test one value for <strong>each branch</strong>.', 'Also test the <strong>number in the condition</strong> itself.', 'Write the expected output <strong>before</strong> you run it.', 'A test passes only if the output matches.'])) });

const BAG = ['DECLARE Weight : INTEGER', 'INPUT Weight', 'IF Weight > 20 THEN', '    OUTPUT "Pay extra"', 'ELSE', '    OUTPUT "Free"', 'ENDIF'];
assert(outs(BAG, [20])[0] === 'Free' && outs(BAG, [21])[0] === 'Pay extra' && outs(BAG, [19])[0] === 'Free', 'test-check');
steps.push(checkStep('test-check', 'Your Turn: Find the Test That Fails', 'Your Turn: Find the Test That Fails', 'The rule: a bag of <strong>20 kg or more</strong> must pay extra. Lighter bags are free. Weights are whole numbers.', [
  { label: 'Which weight, typed in, shows the mistake?', answer: num(20), feedback: 'Bags far above or below the limit give the right answer. Try the number written in the condition.' },
  { label: 'What does the program output for that weight?', answer: word('free'), feedback: 'Put that weight into line 3. Is the condition TRUE or FALSE?' },
  { label: 'What should it output, by the rule?', answer: word('pay\\s+extra'), feedback: 'Read the rule again: "or more".' },
], code(BAG, true)));

steps.push(embed('activity-2', 'Activity 2: Write the IF', 'drill-y8-2-3-code', 'Activity 2: Write the IF',
  'Write each program from the rule. New values are typed in every time, often the number in the condition, so &gt; and &gt;= matter.'));
steps.push(pst('pyscratch-2', 'y8-2-3-gold', 2, 'Task 2 of 3: change a program that already works.'));
steps.push(pst('pyscratch-3', 'y8-2-3-camera', 3, 'Task 3 of 3: write the whole program yourself.'));

// ---------------------------------------------------------------- practice: find and fix
const STAR = ['DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark >= 60 THEN', '    OUTPUT "Tick"', 'ELSE', '    IF Mark > 90 THEN', '        OUTPUT "Star"', '    ELSE', '        OUTPUT "Keep going"', '    ENDIF', 'ENDIF'];
const STAR_FIX = ['DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark >= 90 THEN', '    OUTPUT "Star"', 'ELSE', '    IF Mark >= 60 THEN', '        OUTPUT "Tick"', '    ELSE', '        OUTPUT "Keep going"', '    ENDIF', 'ENDIF'];
assert(outs(STAR, [95])[0] === 'Tick' && outs(STAR_FIX, [90])[0] === 'Star' && outs(STAR_FIX, [89])[0] === 'Tick' && outs(STAR_FIX, [59])[0] === 'Keep going', 'practice');
steps.push(checkStep('practice', 'Practice: Find and Fix', 'Practice: Find and Fix', 'The rule: <strong>90 or more</strong> gets a Star, 60 to 89 gets a Tick, under 60 gets Keep going.', [
  { label: '95 is typed in. What is output?', answer: word('tick'), feedback: 'Start at line 3. Is it TRUE for 95? Then which branch is skipped?' },
  { label: 'The fix checks for a Star first. Which comparison operator should the Star condition use?', answer: '^\\s*>\\s*=\\s*$', flags: '', feedback: 'Read the rule: "90 or more". Should 90 itself get a Star?' },
  { line: true, label: 'At least how many values must you test to try every branch once?', answer: num(3), feedback: 'Count the outcomes. Each one needs its own value.' },
], code(STAR, true, [], true)));

steps.push({ id: 'how-to-play', label: 'Circuit Siege: How to Play',
  content: '<h2 class="lesson-h2">Circuit Siege: How to Play</h2>' +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6"><li><strong>Build towers</strong> on the path.</li><li><strong>Stop the bugs</strong> before they reach your base.</li><li><strong>Between waves</strong>, answer questions from 2.1 and 2.2 to earn coins: data types, constants and library functions. Some have an IF to trace.</li></ol>' });
steps.push(Object.assign(embed('game', 'Play: Circuit Siege', 'tower-defence', 'Play: Circuit Siege', ''), { embedQuery: 'set=y8-data-types&goal=3' }));

steps.push(embed('plenary', 'Plenary: Conditional Statements', 'drill-y8-2-3-conditions', 'Plenary: Conditional Statements',
  'Conditions, which branch runs, nested IFs, the order of the checks, and testing. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));

// ---------------------------------------------------------------- self-checks
assert(V('do-now', 0, '5') && !V('do-now', 0, '2') && V('do-now', 1, 'REAL') && V('do-now', 1, 'a real') && !V('do-now', 1, 'INTEGER'), 'do-now marks');
assert(V('do-now-2', 0, '7') && !V('do-now-2', 0, '2') && V('do-now-2', 1, '2') && V('do-now-2', 2, '0') && !V('do-now-2', 2, '6'), 'do-now-2 marks');
assert(V('operators-check', 0, 'false') && V('operators-check', 0, 'FALSE') && !V('operators-check', 0, 'true') && V('operators-check', 1, 'True') && !V('operators-check', 2, 'TRUE'), 'operators-check marks');
assert(V('order-check', 0, 'Warm') && V('order-check', 0, '"warm"') && !V('order-check', 0, 'Hot') && V('order-check', 1, 'cold') && !V('order-check', 1, 'Warm'), 'order-check marks');
for (const s of ['no', 'No.', 'never', 'it can never', "it can't", 'it cannot output Hot']) assert(V('order-check', 2, s), 'no-ever accepts ' + s);
for (const s of ['yes', 'yes if it is 35', 'it can']) assert(!V('order-check', 2, s), 'no-ever rejects ' + s);
assert(V('test-check', 0, '20') && !V('test-check', 0, '21') && V('test-check', 1, 'Free') && !V('test-check', 1, 'Pay extra') && V('test-check', 2, 'pay extra') && !V('test-check', 2, 'free'), 'test-check marks');
assert(V('practice', 0, 'Tick') && !V('practice', 0, 'Star') && V('practice', 1, '>=') && V('practice', 1, ' > = ') && !V('practice', 1, '>') && !V('practice', 1, '=') && V('practice', 2, '3') && !V('practice', 2, '2'), 'practice marks');
{
  const a = plainT(JSON.stringify(WT_TYPES.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b5\b|\bREAL\b|\bHeight\b|1\.47/.test(a), 'types walkthrough leaks an answer');
  const b = plainT(JSON.stringify(WT_DIVMOD.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b7\b|\b2\b|\b0\b|\bTeamSize\b|\b30\b(?! is too many)/.test(b), 'DIV/MOD walkthrough leaks an answer');
}
const tpsOf = (id) => plainT(steps.find((s) => s.id === id).content.match(/<details class="lesson-tps">([\s\S]*?)<\/details>/)[1]);
assert(!/skip|never|only one|ELSE|80|50/i.test(tpsOf('explain-skip')), 'explain-skip TPS gives the answer');
assert(!/skip|never|reach|80|50|Gold|Silver/i.test(tpsOf('explain-order')), 'explain-order TPS gives the answer');
checkLesson(steps, validators, {
  noTps: ['do-now-ext'],
  teach: [[/\bconditions?\b/i, 'condition'], [/\bbranch(es)?\b/i, 'condition'], [/comparison operators?/i, 'operators'], [/\bnested\b/i, 'nested']],
});
function plainT(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }

const lesson = { id: ID, label: '2.3: Conditional Statements', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drill cards
function condGens() {
  var OPS = [["=", "is equal to"], ["<>", "is not equal to"], ["<", "is less than"], ["<=", "is less than or equal to"], [">", "is more than"], [">=", "is more than or equal to"]];
  var VARS = [["Score", "INTEGER"], ["Coins", "INTEGER"], ["Age", "INTEGER"], ["Lives", "INTEGER"], ["Speed", "INTEGER"], ["Mark", "INTEGER"]];
  var TF = /^\s*["']?\s*true\s*["']?\s*[.!]?\s*$/i, FF = /^\s*["']?\s*false\s*["']?\s*[.!]?\s*$/i;
  function near(k) { var r = rand(0, 9); return r < 4 ? k : r < 7 ? k + pick([-1, 1]) : k + pick([-6, -3, 4, 8]); }
  function holds(x, op, k) { return op === "=" ? x === k : op === "<>" ? x !== k : op === "<" ? x < k : op === "<=" ? x <= k : op === ">" ? x > k : x >= k; }
  function condGen() {
    var o = pick(OPS), v = pick(VARS)[0], k = rand(3, 60), x = near(k), ok = holds(x, o[0], k);
    var lines = ["DECLARE " + v + " : INTEGER", v + " <- " + x, "IF " + v + " " + o[0] + " " + k + " THEN", "    OUTPUT \"yes\"", "ENDIF"];
    assert(run(lines).length === (ok ? 1 : 0));
    var ans = ok ? "TRUE" : "FALSE";
    return { prompt: v + " is " + x + ". Is this condition TRUE or FALSE?\n" + v + " " + o[0] + " " + k, answer: ans, re: ok ? TF : FF,
      wrong: [ok ? "FALSE" : "TRUE", "It depends", "Error"],
      steps: ["Put the value in: " + x + " " + o[0] + " " + k + ".", "The symbol " + o[0] + " means \"" + o[1] + "\". Ask: " + x + " " + o[1] + " " + k + "?"],
      working: ["Write the value of " + v + " into the condition.", "Say the symbol " + o[0] + " in words: \"" + o[1] + "\". Is that so?"],
      note: x + " " + o[0] + " " + k + ": " + x + " " + (ok ? o[1] : "is not " + o[1].replace(/^is /, "")) + " " + k + "." };
  }
  var PAIRS = [["Pass", "Try again"], ["Open", "Locked"], ["Too fast", "OK"], ["Join", "Not yet"], ["Hot", "Not hot"], ["Win", "Lose"], ["Free", "Pay"]];
  function outGen() {
    var o = pick(OPS.slice(2)), v = pick(VARS)[0], k = rand(5, 90), x = near(k), w = pick(PAIRS);
    var lines = ["DECLARE " + v + " : INTEGER", "INPUT " + v, "IF " + v + " " + o[0] + " " + k + " THEN", "    OUTPUT \"" + w[0] + "\"", "ELSE", "    OUTPUT \"" + w[1] + "\"", "ENDIF"];
    var ans = run(lines, [x])[0], ok = ans === w[0];
    return { prompt: x + " is typed in. What is output?\n" + lines.join("\n"), answer: ans, re: textRe(ans),
      wrong: [ok ? w[1] : w[0], w[0] + ", then " + w[1], "Nothing"],
      steps: ["The IF line with the value in: " + x + " " + o[0] + " " + k + " is " + (ok ? "TRUE" : "FALSE") + ".", ok ? "TRUE: the THEN branch runs." : "FALSE: the ELSE branch runs."],
      working: ["Put " + x + " into the condition on the IF line.", "TRUE runs the THEN branch. FALSE runs the ELSE branch."],
      note: x + " " + o[0] + " " + k + " is " + (ok ? "TRUE" : "FALSE") + ", so the output is " + ans + "." };
  }
  var TRIO = [["Score", "Gold", "Silver", "Bronze"], ["Temp", "Hot", "Warm", "Cold"], ["Mark", "Star", "Tick", "Keep going"], ["Points", "Win", "Draw", "Lose"]];
  function nestedLines(t, hi, lo, op) {
    return ["DECLARE " + t[0] + " : INTEGER", "INPUT " + t[0], "IF " + t[0] + " " + op + " " + hi + " THEN", "    OUTPUT \"" + t[1] + "\"", "ELSE",
      "    IF " + t[0] + " " + op + " " + lo + " THEN", "        OUTPUT \"" + t[2] + "\"", "    ELSE", "        OUTPUT \"" + t[3] + "\"", "    ENDIF", "ENDIF"];
  }
  function nestedGen() {
    var t = pick(TRIO), lo = rand(3, 6) * 10, hi = lo + rand(2, 4) * 10, op = pick([">=", ">"]);
    var x = pick([hi, lo, hi + rand(1, 9), lo - rand(1, 9), rand(lo + 1, hi - 1), hi - 1]);
    var lines = nestedLines(t, hi, lo, op), ans = run(lines, [x])[0];
    var c1 = holds(x, op, hi), c2 = holds(x, op, lo);
    return { prompt: x + " is typed in. What is output?\n" + lines.join("\n"), answer: ans, re: textRe(ans),
      wrong: [t[1], t[2], t[3]].filter(function (s) { return s !== ans; }).concat(["Nothing"]),
      steps: ["The first IF: " + x + " " + op + " " + hi + " is " + (c1 ? "TRUE, so its THEN branch runs and the ELSE branch is skipped." : "FALSE, so go to the ELSE branch."),
        c1 ? "Only one branch runs." : "The second IF: " + x + " " + op + " " + lo + " is " + (c2 ? "TRUE, so its THEN branch runs." : "FALSE, so its ELSE branch runs.")],
      working: ["Start at the first IF. If it is TRUE, the whole ELSE branch is skipped.", "If the first IF is FALSE, check the second IF the same way."],
      note: (c1 ? x + " " + op + " " + hi + " is TRUE." : x + " " + op + " " + hi + " is FALSE, and " + x + " " + op + " " + lo + " is " + (c2 ? "TRUE." : "FALSE.")) + " Output: " + ans + "." };
  }
  function orderGen() {
    var t = pick(TRIO), lo = rand(3, 6) * 10, hi = lo + rand(2, 4) * 10, x = pick([hi + rand(0, 9), hi + rand(0, 9), rand(lo, hi - 1), lo - rand(1, 9)]);
    var lines = ["DECLARE " + t[0] + " : INTEGER", "INPUT " + t[0], "IF " + t[0] + " >= " + lo + " THEN", "    OUTPUT \"" + t[2] + "\"", "ELSE",
      "    IF " + t[0] + " >= " + hi + " THEN", "        OUTPUT \"" + t[1] + "\"", "    ELSE", "        OUTPUT \"" + t[3] + "\"", "    ENDIF", "ENDIF"];
    var ans = run(lines, [x])[0];
    return { prompt: "The checks are in this order. " + x + " is typed in. What is output?\n" + lines.join("\n"), answer: ans, re: textRe(ans),
      wrong: [t[1], t[2], t[3]].filter(function (s) { return s !== ans; }).concat(["Nothing"]),
      steps: ["The first IF: " + x + " >= " + lo + " is " + (x >= lo ? "TRUE, so its THEN branch runs. The ELSE branch is skipped, even the second IF." : "FALSE, so go to the ELSE branch."),
        x >= lo ? "Only one branch runs." : "The second IF: " + x + " >= " + hi + " is FALSE, so its ELSE branch runs."],
      working: ["Do not guess from the rule. Trace the lines in the order they are written.", "Start at the first IF. If it is TRUE, the second IF is never checked."],
      note: "The first IF is checked first: " + x + " >= " + lo + " is " + (x >= lo ? "TRUE" : "FALSE") + ". Output: " + ans + "." };
  }
  var RULES = [["or more", ">="], ["more than", ">"], ["or less", "<="], ["less than", "<"], ["not", "<>"], ["exactly", "="]];
  var JOBS = [["Age", "can ride", 12], ["Mark", "passes", 50], ["Speed", "is too fast", 90], ["Lives", "is still playing", 0], ["Coins", "can buy the hat", 25], ["Code", "opens the door", 4321]];
  function ruleText(j, r) {
    if (r[0] === "not") return "A player " + j[1] + " when " + j[0] + " is not " + j[2] + ".";
    if (r[0] === "exactly") return "A player " + j[1] + " when " + j[0] + " is exactly " + j[2] + ".";
    if (r[0] === "or more" || r[0] === "or less") return "A player " + j[1] + " when " + j[0] + " is " + j[2] + " " + r[0] + ".";
    return "A player " + j[1] + " when " + j[0] + " is " + r[0] + " " + j[2] + ".";
  }
  function opGen() {
    var j = pick(JOBS), r = pick(RULES);
    return { prompt: ruleText(j, r) + "\nWhich comparison operator goes in the gap?\nIF " + j[0] + " ___ " + j[2] + " THEN", answer: r[1],
      re: new RegExp("^\\s*" + r[1].split("").map(escRe).join("\\s*") + "\\s*$"),
      wrong: RULES.map(function (q) { return q[1]; }).filter(function (s) { return s !== r[1]; }).slice(0, 3),
      steps: ["Find the rule words: \"" + r[0] + "\".", "\"" + r[0] + "\" is written " + r[1] + "."],
      working: ["Find the words in the rule that compare: \"" + r[0] + "\".", "Does the number " + j[2] + " itself count? \"or more\" and \"or less\" include it. \"more than\" and \"less than\" do not."],
      note: "\"" + r[0] + "\" is " + r[1] + "." };
  }
}
function testGens() {
  var LIMITS = [["Age", "can ride", "Ride", "Too young"], ["Weight", "pays extra", "Pay extra", "Free"], ["Mark", "passes", "Pass", "Try again"], ["Speed", "gets a fine", "Fine", "OK"]];
  function testGen() {
    var l = pick(LIMITS), k = rand(10, 90), kind = rand(0, 1);
    var rule = kind ? l[0] + " of " + k + " or more " + l[1] + "." : l[0] + " of more than " + k + " " + l[1] + ".";
    var op = kind ? ">" : ">=";
    var lines = ["DECLARE " + l[0] + " : INTEGER", "INPUT " + l[0], "IF " + l[0] + " " + op + " " + k + " THEN", "    OUTPUT \"" + l[2] + "\"", "ELSE", "    OUTPUT \"" + l[3] + "\"", "ENDIF"];
    var ans = String(k);
    return { prompt: "The rule: " + rule + " Which whole number, typed in, shows the mistake?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: [String(k + 1), String(k - 1), String(k + 10)],
      steps: ["Values far from " + k + " give the right answer either way.", "Only the number in the condition shows if > and >= are mixed up."],
      working: ["Values far above or below the limit give the same answer with > or >=.", "Try the number written in the condition."],
      note: "With " + k + " typed in, " + k + " " + op + " " + k + " is " + (op === ">=" ? "TRUE" : "FALSE") + ", but the rule says the opposite." };
  }
  function countGen() {
    var n = rand(2, 4), set = pick([["Score", "Gold", "Silver", "Bronze", "No medal"], ["Temp", "Hot", "Warm", "Mild", "Cold"], ["Points", "Win", "Draw", "Close", "Lose"], ["Speed", "Fine", "Warning", "Slow down", "OK"]]);
    var v = set[0], names = set.slice(1, n + 1), top = rand(7, 9) * 10, gap = rand(1, 2) * 10, cut = [top, top - gap, top - 2 * gap].slice(0, n - 1);
    var lines = ["DECLARE " + v + " : INTEGER", "INPUT " + v], pad = "";
    for (var i = 0; i < n - 1; i++) { lines.push(pad + "IF " + v + " >= " + cut[i] + " THEN", pad + "    OUTPUT \"" + names[i] + "\"", pad + "ELSE"); pad += "    "; }
    lines.push(pad + "OUTPUT \"" + names[n - 1] + "\"");
    for (var j = n - 2; j >= 0; j--) { pad = pad.slice(4); lines.push(pad + "ENDIF"); }
    run(lines, ["50"]);
    var ans = String(n);
    return { prompt: "At least how many values must you test to try every branch of this program once?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [n - 1, n + 1, 2 * n]),
      steps: ["Count the different outputs the program can give.", "Each one needs its own test value."],
      working: ["Count the OUTPUT lines. Can each one be reached?", "One test value for each branch."],
      note: "The program has " + n + " outcomes, so at least " + n + " test values." };
  }
}
function branchCards() {
  return [card("b-cond-1", "b-cond", condGen), card("b-cond-2", "b-cond", condGen),
    card("b-out-1", "b-out", outGen), card("b-out-2", "b-out", outGen),
    card("b-nested-1", "b-nested", nestedGen), card("b-nested-2", "b-nested", nestedGen),
    card("b-op-1", "b-op", opGen), card("b-op-2", "b-op", opGen)];
}
function plenaryWhy() {
  function condWhatGen() {
    return { prompt: "What is a condition? Pick the answer, then type it.", answer: "A question whose answer is TRUE or FALSE.",
      re: /(?=.*\btrue\b)(?=.*\bfalse\b)|(?=.*\b(yes|true)\b)(?=.*\bno\b)/i,
      wrong: ["A line that outputs a message to the user.", "A value that is set once and never changes.", "A list of values kept in order."],
      working: ["Think of Age >= 13. What can its answer be?", "How many answers can it have?"], note: "A condition is a question with only two answers: TRUE or FALSE." };
  }
  function oneBranchGen() {
    return { prompt: "In IF ... THEN ... ELSE ... ENDIF, how many branches run each time? Why? Pick the answer, then type it.",
      answer: "One: TRUE runs THEN, FALSE runs ELSE.",
      re: /\b(one|1|only)\b/i,
      wrong: ["Both: THEN first, then ELSE.", "None, unless the program has a loop.", "Two, if the value is equal."],
      working: ["Can a condition be TRUE and FALSE at the same time?", "Each answer has its own branch."], note: "Only one branch runs: THEN for TRUE, ELSE for FALSE." };
  }
  function orderWhyGen() {
    return { prompt: "Gold is 80 or more, Silver is 50 or more. Why must the 80 check come first? Pick the answer, then type it.",
      answer: "80 or more is also 50 or more, so Gold is never reached.",
      re: /(also|too|both|every).*(50|silver)|(never|not|can'?t|cannot|won'?t)\s+(be\s+)?(reach|check|get|output|run)|skip/i,
      wrong: ["Bigger numbers must always be typed in before smaller ones.", "The ELSE branch can only hold one line.", "A nested IF must use the > operator."],
      working: ["Trace 85 with the 50 check first. Which line is TRUE first?", "When the first check is TRUE, what happens to the ELSE branch?"], note: "Every score of 80 or more is also 50 or more, so the Silver check would catch it first." };
  }
  function edgeWhyGen() {
    return { prompt: "Why test the number written in the condition, like 13 in Age >= 13? Pick the answer, then type it.",
      answer: "That is where > and >= give different answers.",
      re: /(>|more\s+than|greater).*(>=|equal|or\s+more)|(>=|equal|or\s+more).*(>|more\s+than|greater)|different|differ|mix/i,
      wrong: ["It is the smallest number the program allows.", "The program only works for that number.", "It makes the program run faster."],
      working: ["Compare Age > 13 and Age >= 13 with 12, 13 and 14.", "For which value do they give different answers?"], note: "Only the number in the condition shows a > and >= mix-up." };
  }
}
function plenaryCards() {
  return [card("pl-cond-1", "pl-cond", condGen), card("pl-cond-2", "pl-cond", condGen), why("pl-cond-what", "pl-cond", condWhatGen), card("pl-op", "pl-cond", opGen),
    card("pl-out-1", "pl-branch", outGen), card("pl-out-2", "pl-branch", outGen), why("pl-one", "pl-branch", oneBranchGen),
    card("pl-nested-1", "pl-nested", nestedGen), card("pl-nested-2", "pl-nested", nestedGen), card("pl-order", "pl-nested", orderGen), why("pl-order-why", "pl-nested", orderWhyGen),
    card("pl-test-1", "pl-test", testGen), card("pl-test-2", "pl-test", testGen), card("pl-count", "pl-test", countGen), why("pl-edge-why", "pl-test", edgeWhyGen)];
}

// Activity 2: write programs with IF, comparison operators and a nested IF. Values on the edge come up often.
function codeCards() {
  function r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function edge(k, spread) { var n = r(0, 5); return String(n < 2 ? k : n < 3 ? k + 1 : n < 4 ? k - 1 : k + r(-spread, spread)); }
  return [
    { id: "k-hot", category: "k-if", prompt: "Temp is typed in (a whole number). If Temp is more than 30, output \"Hot\". Otherwise output \"Not hot\".",
      inputs: function () { return [edge(30, 12)]; }, setup: {}, checkVars: [], checkOutput: true,
      reference: "DECLARE Temp : INTEGER\nINPUT Temp\nIF Temp > 30 THEN\n  OUTPUT \"Hot\"\nELSE\n  OUTPUT \"Not hot\"\nENDIF" },
    { id: "k-pass", category: "k-if", prompt: "Mark is typed in. A mark of 40 or more outputs \"Pass\". Any other mark outputs \"Try again\".",
      inputs: function () { return [edge(40, 20)]; }, setup: {}, checkVars: [], checkOutput: true,
      reference: "DECLARE Mark : INTEGER\nINPUT Mark\nIF Mark >= 40 THEN\n  OUTPUT \"Pass\"\nELSE\n  OUTPUT \"Try again\"\nENDIF" },
    { id: "k-door", category: "k-ops", prompt: "A door code is typed in. If the code is not equal to 2580, output \"Locked\". Otherwise output \"Open\".",
      inputs: function () { return [r(0, 1) ? "2580" : String(r(1000, 9999))]; }, setup: {}, checkVars: [], checkOutput: true,
      reference: "DECLARE Code : INTEGER\nINPUT Code\nIF Code <> 2580 THEN\n  OUTPUT \"Locked\"\nELSE\n  OUTPUT \"Open\"\nENDIF" },
    { id: "k-ride", category: "k-ops", prompt: "Make a constant MinAge with the value 12. Age is typed in. If Age is MinAge or more, output \"Ride\". Otherwise output \"Too young\".",
      inputs: function () { return [edge(12, 6)]; }, setup: {}, checkVars: [], checkOutput: true, mustBeConstant: ["MinAge"],
      reference: "CONSTANT MinAge <- 12\nDECLARE Age : INTEGER\nINPUT Age\nIF Age >= MinAge THEN\n  OUTPUT \"Ride\"\nELSE\n  OUTPUT \"Too young\"\nENDIF" },
    { id: "k-medal", category: "k-nested", prompt: "Score is typed in. 80 or more outputs \"Gold\". 50 to 79 outputs \"Silver\". Under 50 outputs \"Bronze\". Use an IF inside an IF.",
      inputs: function () { return [String([80, 79, 50, 49, 95, r(51, 78), r(0, 48)][r(0, 6)])]; }, setup: {}, checkVars: [], checkOutput: true,
      reference: "DECLARE Score : INTEGER\nINPUT Score\nIF Score >= 80 THEN\n  OUTPUT \"Gold\"\nELSE\n  IF Score >= 50 THEN\n    OUTPUT \"Silver\"\n  ELSE\n    OUTPUT \"Bronze\"\n  ENDIF\nENDIF" },
    { id: "k-lift", category: "k-nested", prompt: "People is typed in. A lift holds at most 8 people. More than 8 outputs \"Too many\". Exactly 8 outputs \"Full\". Fewer outputs \"Room for more\".",
      inputs: function () { return [String([8, 8, 9, 7, r(0, 6), r(10, 15)][r(0, 5)])]; }, setup: {}, checkVars: [], checkOutput: true,
      reference: "DECLARE People : INTEGER\nINPUT People\nIF People > 8 THEN\n  OUTPUT \"Too many\"\nELSE\n  IF People = 8 THEN\n    OUTPUT \"Full\"\n  ELSE\n    OUTPUT \"Room for more\"\n  ENDIF\nENDIF" },
    { id: "k-bag", category: "k-bool", prompt: "Weight is typed in (it can have a decimal part). Declare Heavy as a BOOLEAN. Set Heavy to TRUE if Weight is 20.5 or more, otherwise FALSE. Then if Heavy is TRUE output \"Pay extra\", otherwise output \"Free\".",
      inputs: function () { return [["20.5", "20.5", "20.4", "21", String(r(5, 30) + 0.5)][r(0, 4)]]; }, setup: {}, checkVars: ["Heavy"], checkOutput: true,
      reference: "DECLARE Weight : REAL\nDECLARE Heavy : BOOLEAN\nINPUT Weight\nIF Weight >= 20.5 THEN\n  Heavy <- TRUE\nELSE\n  Heavy <- FALSE\nENDIF\nIF Heavy = TRUE THEN\n  OUTPUT \"Pay extra\"\nELSE\n  OUTPUT \"Free\"\nENDIF" }
  ];
}

const B = 'tools/build_y8_2_3.mjs';
const ASSERT = 'function assert(ok) { if (!ok) throw new Error("card check failed"); }';
writeDrill({ id: 'y8-2-3-branch', builder: B, header: 'Year 8, 2.3 Conditional Statements. Activity 1: TRUE or FALSE, which branch runs, a nested IF, and choosing the comparison operator.',
  title: 'Year 8, 2.3: Which Branch Runs?', subtitle: 'Conditions, IF and ELSE, nested IFs',
  cats: [['b-cond', 'TRUE or FALSE?'], ['b-out', 'Which Branch Runs?'], ['b-nested', 'An IF Inside an IF'], ['b-op', 'Choose the Operator']],
  parts: [body(drillKit), ASSERT, body(condGens)], cardsFn: branchCards });
writeDrill({ id: 'y8-2-3-code', builder: B, codeDrill: true, header: 'Year 8, 2.3 Conditional Statements. Activity 2: write programs with IF, comparison operators and a nested IF; new values (often the number in the condition) are typed in on every run.',
  title: 'Year 8, 2.3: Write the IF', subtitle: 'IF, ELSE, comparison operators and nested IFs',
  cats: [['k-if', 'IF and ELSE'], ['k-ops', 'More Operators'], ['k-nested', 'An IF Inside an IF'], ['k-bool', 'Put It Together']],
  parts: [], cardsFn: codeCards });
writeDrill({ id: 'y8-2-3-conditions', builder: B, header: 'Year 8, 2.3 Conditional Statements. Plenary: conditions, which branch runs, nested IFs and their order, and testing every branch.',
  title: 'Year 8, 2.3: Conditional Statements', subtitle: 'Programming, Logic and Testing',
  cats: [['pl-cond', 'Conditions'], ['pl-branch', 'Which Branch Runs?'], ['pl-nested', 'Nested IFs and Order'], ['pl-test', 'Testing']],
  parts: [body(drillKit), ASSERT, body(condGens), body(testGens), body(plenaryWhy)], cardsFn: plenaryCards,
  typedNoExample: ['pl-cond-what', 'pl-one', 'pl-order-why', 'pl-edge-why'] });

registerY8Unit2(ID, 'y8-2-2-data-types');
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
