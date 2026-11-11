// Builds LessonData/y8-2-2-data-types.json: Year 8, Unit 2 Programming, Logic and Testing, 2.2 Data Types and
// Constants (8P.02: identify and describe Integer, Real and Boolean; 8P.05: develop text-based programs using Integer,
// Real, String and Boolean data; 8CT.09: develop an algorithm that uses at least one constant), its three drills
// (Drills/data/y8-2-2-types.js, y8-2-2-code.js, y8-2-2-data-types.js), and registers the lesson after 2.1.
//   node tools/build_y8_2_2.mjs
// Cambridge pseudocode as in 2.1 (tools/build_y8_2_1.mjs, shared pieces in tools/y8_unit2_kit.mjs). The engine
// (shared/pseudocode-engine.js) checks every DECLAREd type and the CONSTANT statement, so each "will it run?" answer
// and error message on a slide is the engine's own. The Extension reuses the 2.1 plenary drill. Three PyScratch Task
// slides embed pages PyScratchTask/ (tasks in PyScratchTask/tasks/y8-2-2.js): task 1 after the 3D lab, 2 and 3 after Activity 2.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, assert, code, facts, columns, caption, note, hl, tps, table, box, arrayTable, run, outs, runError, fill, num, word, NO,
  makeLesson, checkLesson, drillKit, body, writeDrill, registerY8Unit2, esc,
} from './y8_unit2_kit.mjs';

const ID = 'y8-2-2-data-types';
const P = 'y822';
const { validators, checkStep, embed, mcStep, selfMarked, V } = makeLesson(P);
const TYPE_RE = {
  INTEGER: '^\\s*(an?\\s+)?(integer|int)\\s*[.!]?\\s*$',
  REAL: '^\\s*(an?\\s+)?real(\\s+number)?\\s*[.!]?\\s*$',
  STRING: '^\\s*(an?\\s+)?(string|str)\\s*[.!]?\\s*$',
  BOOLEAN: '^\\s*(an?\\s+)?(boolean|bool)\\s*[.!]?\\s*$',
};
const NO_RUN = "^\\s*(no|nope|it\\s+(will\\s+)?(not|won'?t|does\\s*n[o']?t)(\\s+run)?|it\\s+stops|(an?\\s+)?error)\\b[^?]*$";

const TPS = {
  'do-now': ['Why does DIV need two values in its brackets?', 'The first value is the number to divide. The second is the number to divide by.'],
  'do-now-2': ['Why does the search use a flag that starts as FALSE?', 'Nothing has matched before the loop starts. The flag only changes when a value matches.'],
  'int-real-check': ['Why does the computer need to know if a number can have a decimal part?', 'It stores and checks whole numbers and decimal numbers in different ways.'],
  'types-check': ['Why does "13" in quotes not count as a number?', 'The quotes make it text. The computer treats it as characters, not as an amount it can add.'],
  'lab-3d': ['Why does each box in the lab need a type cube before it can hold a value?', 'DECLARE comes first. The data type decides what kind of value the variable lets in.'],
  'activity-1': ['Why predict first, then check?', 'A wrong prediction shows you which rule to look at again.'],
  'constant-check': ['Why are constants written at the top of the program?', 'They are easy to find and change there, and they are set before any line uses them.'],
  'pyscratch-1': ['Why does the program stop on the line that stores the value, and not on its DECLARE line?', 'DECLARE only gives the variable its data type. The error comes when a value of the wrong kind is stored.'],
  'pyscratch-2': ['Why is one constant better than typing the same number four times?', 'One change to the constant changes every line that uses it, so no line can be missed.'],
  'pyscratch-3': ['Why does Check my program change FishPoints and run your program again?', 'If the score changes too, the program really uses the constant. A number typed into a line would not change.'],
  'activity-2': ['Why does the drill type in new values every time?', 'A program must work for any value it is given, not just one.'],
  'why-constant': ['What makes an explanation worth 2 marks?', 'A point, then what it means for the program, joined with so.'],
  'practice': ['Why can the wrong data type stop a program that has no other mistakes?', 'Each variable only lets in its own kind of value. One wrong type means one value is refused.'],
  'plenary': ['Why practise with new values every time?', 'If you can choose the type for any value, you really know the four types.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (2.1): library functions
const DN1 = ['DECLARE Days : INTEGER', 'INPUT Days', 'OUTPUT DIV(Days, 7)', 'OUTPUT MOD(Days, 7)', 'OUTPUT ROUND(Days / 7, 1)'];
assert(outs(DN1, [45]).join() === '6,3,6.4', 'do-now 1');
const WDN1 = ['DECLARE Eggs : INTEGER', 'INPUT Eggs', 'OUTPUT DIV(Eggs, 12)', 'OUTPUT MOD(Eggs, 12)', 'OUTPUT ROUND(Eggs / 12, 1)'];
assert(outs(WDN1, [50]).join() === '4,2,4.2', 'walkthrough 1');
const WT_LIB = { title: 'Walk me through it: library functions', steps: [
  { text: 'This is a different program. 50 is typed in. Do the same steps with your program.', visual: code(WDN1) },
  { text: 'DIV gives the whole number of times. How many 12s fit into 50? 12 x 4 = 48, and 12 x 5 = 60 is too many.', visual: code(WDN1, false, [3]) + note('DIV(50, 12) = ' + hl('4')) },
  { text: 'MOD gives what is left over: 50 - 48 = <strong>2</strong>.', visual: code(WDN1, false, [4]) + note('MOD(50, 12) = ' + hl('2')) },
  { text: 'The last line divides first: 50 / 12 = 4.1666...', visual: code(WDN1, false, [5]) + note('50 / 12 = 4.1666...') },
  { text: 'ROUND keeps 1 decimal place. The digit after the 1 is five or more, so 4.1 rounds up to <strong>4.2</strong>. Now do yours.', visual: code(WDN1, false, [5]) + note('ROUND(4.1666, 1) = ' + hl('4.2')) },
] };
steps.push(checkStep('do-now', 'Do Now: Library Functions (1 of 2)', 'Do Now: Library Functions (1 of 2)', 'From 2.1: library functions. 45 is typed in.', [
  { label: 'What does line 3 output?', answer: num(6), feedback: 'DIV counts how many whole 7s fit into the number.' },
  { label: 'What does line 4 output?', answer: num(3), feedback: 'MOD gives what is left over after taking away all the whole 7s.' },
  { label: 'What does line 5 output?', answer: num('6.4'), feedback: 'Divide first, then keep one decimal place. Is the next digit five or more?' },
], code(DN1, true)));
steps[steps.length - 1].walkthrough = WT_LIB;

// ---------------------------------------------------------------- Do Now 2 (Unit 1): a linear search with a flag
const SEARCH = (arr, v, flag, yes, no) => [`DECLARE ${flag} : BOOLEAN`, 'DECLARE Index : INTEGER', `${flag} <- FALSE`, 'FOR Index <- 1 TO 5',
  `    IF ${arr}[Index] = ${v} THEN`, `        ${flag} <- TRUE`, '    ENDIF', 'NEXT Index', `IF ${flag} = TRUE THEN`, `    OUTPUT "${yes}"`, 'ELSE', `    OUTPUT "${no}"`, 'ENDIF'];
const CODES = [17, 42, 8, 30, 25];
assert(outs(SEARCH('Codes', 42, 'Found', 'Found', 'Not found'), [], fill('Codes', 'INTEGER', CODES))[0] === 'Found', 'do-now 2a');
assert(outs(SEARCH('Codes', 9, 'Found', 'Found', 'Not found'), [], fill('Codes', 'INTEGER', CODES))[0] === 'Not found', 'do-now 2b');
const AGES = [12, 15, 11, 14, 16];
const WS = SEARCH('Ages', 11, 'Seen', 'In the list', 'Missing');
assert(outs(WS, [], fill('Ages', 'INTEGER', AGES))[0] === 'In the list' && outs(SEARCH('Ages', 13, 'Seen', 'In the list', 'Missing'), [], fill('Ages', 'INTEGER', AGES))[0] === 'Missing', 'walkthrough 2');
const WT_SEARCH = { title: 'Walk me through it: a linear search', steps: [
  { text: 'This is a different search. Ages holds 12, 15, 11, 14, 16, and it looks for 11. Do the same steps with yours.', visual: code(WS) },
  { text: 'Seen starts as FALSE: nothing has matched yet.', visual: code(WS, false, [3]) + note('Seen = FALSE') },
  { text: 'The loop checks each value in turn: is it 11? 12 is not. 15 is not.', visual: code(WS, false, [5]) + note('Seen = FALSE') },
  { text: 'The third value is 11. It matches, so Seen becomes TRUE.', visual: code(WS, false, [5, 6]) + note('Seen = ' + hl('TRUE')) },
  { text: 'After the loop, the IF checks Seen. It is TRUE, so the output is <strong>In the list</strong>.', visual: code(WS, false, [9, 10]) },
  { text: 'Now look for 13. No value matches, so Seen stays FALSE and the ELSE line runs: <strong>Missing</strong>. Now do yours.', visual: code(WS, false, [11, 12]) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Linear Search (2 of 2)', 'Do Now: Linear Search (2 of 2)', 'From Unit 1: linear search.', [
  { label: 'What is output?', answer: word('found'), feedback: 'Check each value in Codes. Does any of them match 42?' },
  { label: 'Line 5 is changed to look for 9. What is output now?', answer: word('not\\s+found'), feedback: 'Check each value against 9. If none match, the flag stays the same as it started.' },
], arrayTable('Codes', CODES) + code(SEARCH('Codes', 42, 'Found', 'Found', 'Not found'), true, [], true)));
steps[steps.length - 1].walkthrough = WT_SEARCH;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-2-1-libraries', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on libraries and library functions from 2.1. Stuck? Switch on <strong>I need help</strong> for a nudge or a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '2.2: Data Types and Constants',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Programming, Logic and Testing</p><h2 class="lesson-h2">2.2: Data Types and Constants</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> choose the right kind of variable for each value, and keep a fixed value in one place.', '<strong>The big question:</strong> why must a program know what kind of value it holds?']) +
    tps('13, 13.5, "thirteen" and TRUE. Why might a computer keep these four values in different ways?', '<p>They are different kinds of value. You can add 13 and 13.5, but not "thirteen". TRUE is only ever yes or no.</p>') });

// ---------------------------------------------------------------- data types
const ERR_AGE = runError(['DECLARE Age : INTEGER', 'Age <- "thirteen"']);
assert(ERR_AGE && /INTEGER/.test(ERR_AGE.message), 'data-type error');
steps.push({ id: 'data-type', label: 'What Is a Data Type?',
  content: '<h2 class="lesson-h2">What Is a Data Type?</h2>' +
    tps('Predict: the program says DECLARE Age : INTEGER, then Age &lt;- "thirteen". What happens? Why?',
      `<p>The program stops on line 2.</p><p><strong>Why?</strong> Age was declared for whole numbers only. "thirteen" is text. The error says: ${esc(ERR_AGE.message.split('. ')[0])}.</p>`, 'Show the worked answer') +
    '<p class="lesson-lead">A <strong>data type</strong> says what kind of value a variable can hold.</p>' +
    columns(code(['DECLARE Age : INTEGER', 'DECLARE Town : STRING']),
      facts(['You give each variable its data type when you DECLARE it.', 'The program then only lets in that kind of value.', 'The wrong kind of value stops the program with an error.'])) });

const IA = ['DECLARE Height : INTEGER', 'Height <- 1.62', 'OUTPUT Height'];
const IB = ['DECLARE Height : REAL', 'Height <- 1.62', 'OUTPUT Height'];
const ERR_H = runError(IA);
assert(ERR_H && ERR_H.line === 2 && outs(IB)[0] === '1.62', 'int-real');
steps.push({ id: 'int-real', label: 'Compare: INTEGER and REAL',
  content: '<h2 class="lesson-h2">Compare: INTEGER and REAL</h2>' +
    tps('Predict: which program runs? Why does the other one stop?',
      `<p>B runs and outputs <strong>1.62</strong>. A stops on line 2.</p><p><strong>Why?</strong> An INTEGER holds whole numbers only, and 1.62 has a decimal part. The error says: ${esc(ERR_H.message.split('. ')[0])}.</p>`, 'Show the worked answer') +
    '<p class="lesson-lead">A height in metres: 1.62.</p>' +
    columns(caption('A') + code(IA), caption('B') + code(IB)) +
    facts(['<strong>INTEGER:</strong> a whole number, like 13, 0 or -4.', '<strong>REAL:</strong> a number with a decimal part, like 1.62 or 9.5.']) });

steps.push(mcStep('int-real-check', 'Your Turn: INTEGER or REAL?', 'Your Turn: INTEGER or REAL?', 'Choose the data type for each value.', [
  { prompt: 'The number of pupils in a class, like 28.', options: ['INTEGER', 'REAL', 'STRING', 'BOOLEAN'], correct: 0,
    explain: 'You count pupils in whole numbers. There is never half a pupil.' },
  { prompt: 'A runner\'s time in seconds, like 12.85.', options: ['INTEGER', 'BOOLEAN', 'REAL', 'STRING'], correct: 2,
    explain: 'A time can have a decimal part, so it needs a REAL.' },
]));

const SA = ['DECLARE Age : STRING', 'Age <- "13"', 'OUTPUT Age + 1'];
const SB = ['DECLARE Age : INTEGER', 'Age <- 13', 'OUTPUT Age + 1'];
const ERR_S = runError(SA);
assert(ERR_S && ERR_S.line === 3 && outs(SB)[0] === '14', 'string');
steps.push({ id: 'string', label: 'Compare: "13" and 13',
  content: '<h2 class="lesson-h2">Compare: "13" and 13</h2>' +
    tps('Predict: which program outputs 14? Why can the other one not add 1?',
      `<p>B outputs <strong>14</strong>. A stops on line 3.</p><p><strong>Why?</strong> "13" in quotes is text, not an amount. The error says: ${esc(ERR_S.message)}</p>`, 'Show the worked answer') +
    columns(caption('A') + code(SA), caption('B') + code(SB)) +
    facts(['<strong>STRING:</strong> text in quotes, like "Hat Yai" or "13".', 'A STRING is kept as characters. You cannot do sums with it.']) });

const BOOL = ['DECLARE Mark : INTEGER', 'DECLARE Passed : BOOLEAN', 'INPUT Mark', 'IF Mark >= 50 THEN', '    Passed <- TRUE', 'ELSE', '    Passed <- FALSE', 'ENDIF', 'OUTPUT Passed'];
const ERR_B = runError(['DECLARE Passed : BOOLEAN', 'Passed <- "Yes"']);
assert(outs(BOOL, [62])[0] === 'TRUE' && outs(BOOL, [41])[0] === 'FALSE' && ERR_B, 'boolean');
steps.push({ id: 'boolean', label: 'BOOLEAN: Only TRUE or FALSE',
  content: '<h2 class="lesson-h2">BOOLEAN: Only TRUE or FALSE</h2>' +
    tps('Predict: why is BOOLEAN a better data type for Passed than STRING?',
      '<p>A BOOLEAN can only be TRUE or FALSE. With a STRING, a typing slip like "Ture" could get in, and an IF that checks for "TRUE" would miss it.</p>', 'Show the worked answer') +
    '<p class="lesson-lead"><strong>BOOLEAN:</strong> a value that can only be TRUE or FALSE, like Found in a linear search.</p>' +
    columns(code(BOOL), facts(['62 is typed in: the output is TRUE.', 'Passed &lt;- "Yes" stops the program: "Yes" is not TRUE or FALSE.', 'Use BOOLEAN for a yes or no question: paid, locked, found.'])) });

steps.push(checkStep('types-check', 'Your Turn: Name the Data Type', 'Your Turn: Name the Data Type', 'Type INTEGER, REAL, STRING or BOOLEAN for each value.', [
  { label: '4.5', answer: TYPE_RE.REAL, feedback: 'Is it a number? Does it have a decimal part?' },
  { label: '"Yes"', answer: TYPE_RE.STRING, feedback: 'Look at the quotes first.' },
  { label: 'FALSE', answer: TYPE_RE.BOOLEAN, feedback: 'No quotes. Which data type has only two values?' },
  { label: '-3', answer: TYPE_RE.INTEGER, feedback: 'A minus sign is fine. Is there a decimal part?' },
]));

steps.push(embed('activity-1', 'Activity 1: Choose the Data Type', 'drill-y8-2-2-types', 'Activity 1: Choose the Data Type',
  'Choose the data type, then predict whether each program runs. The values change every time.'));

steps.push(Object.assign(embed('lab-3d', 'Lab: Data Types in 3D', 'pseudocode-lab-3d', 'Lab: Data Types in 3D',
  'Walk round the lab with W A S D. Tap <strong>Space</strong> to pick up a value and tap again to put it down. Each box only lets in its own data type. A mistake in a challenge starts a new round. <strong>Done</strong> when Four Data Types, Data Type Challenge, Choose the Type and The Wrong Kind of Value are complete.'), { embedQuery: 'lesson=8-2.2' }));

// ---------------------------------------------------------------- PyScratch Tasks (pages PyScratchTask/tasks/y8-2-2.js)
// Each runs the student's pseudocode on a Scratch stage and checks what happened; help fades from task 1 to 3.
const PST_LEAD = '<strong>What to do:</strong> write the program in the box on the left. Click the green flag above the stage to run it. When it works, click <strong>Check my program</strong>.';
const pst = (id, task, n, what) => Object.assign(embed(id, `Activity: PyScratch Task ${n}`, 'pyscratch-task', `Activity: PyScratch Task ${n} of 3`,
  (n === 1 ? PST_LEAD + ' ' : '') + what), { embedQuery: 'task=' + task });
steps.push(pst('pyscratch-1', 'y8-2-2-fix', 1, 'Task 1 of 3: fix a program that is nearly finished.'));

// ---------------------------------------------------------------- constants
const ERR_C = runError(['CONSTANT TicketPrice <- 45', 'TicketPrice <- 50']);
assert(ERR_C && ERR_C.line === 2, 'constant error');
steps.push({ id: 'constant', label: 'What Is a Constant?',
  content: '<h2 class="lesson-h2">What Is a Constant?</h2>' +
    tps('Predict: what happens if a later line says TicketPrice &lt;- 50? Why?',
      `<p>The program stops on that line.</p><p><strong>Why?</strong> ${esc(ERR_C.message)}</p>`, 'Show the worked answer') +
    '<p class="lesson-lead">A <strong>constant</strong> is a value that is set once and never changes while the program runs.</p>' +
    columns(code(['CONSTANT TicketPrice <- 45', 'DECLARE Tickets : INTEGER', 'INPUT Tickets', 'OUTPUT Tickets * TicketPrice']),
      facts(['Write CONSTANT, a name, &lt;- and the value.', 'Put constants at the top of the program.', 'Every line can use it. No line can change it.'])) });

const CA = ['DECLARE Monday : INTEGER', 'DECLARE Tuesday : INTEGER', 'INPUT Monday', 'INPUT Tuesday', 'OUTPUT Monday * 45', 'OUTPUT Tuesday * 45', 'OUTPUT (Monday + Tuesday) * 45'];
const CB = ['CONSTANT Price <- 45', 'DECLARE Monday : INTEGER', 'DECLARE Tuesday : INTEGER', 'INPUT Monday', 'INPUT Tuesday', 'OUTPUT Monday * Price', 'OUTPUT Tuesday * Price', 'OUTPUT (Monday + Tuesday) * Price'];
assert(outs(CA, [3, 4]).join() === outs(CB, [3, 4]).join() && CA.filter((l) => l.includes('45')).length === 3, 'compare-constant');
steps.push({ id: 'compare-constant', label: 'Compare: A Typed Number or a Constant',
  content: '<h2 class="lesson-h2">Compare: A Typed Number or a Constant</h2>' +
    tps('The price goes up to 50. How many lines must you change in A? In B? Why is B safer?',
      '<p>A: <strong>3</strong> lines. B: <strong>1</strong> line.</p><p><strong>Why safer?</strong> In A it is easy to miss one 45, and that line gives a wrong price. In B every line uses Price, so one change fixes them all. The name Price also says what 45 means.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A snack costs 45 baht. Both programs work out the cost of the snacks sold.</p>' +
    columns(caption('A: 45 typed in') + code(CA), caption('B: a constant') + code(CB)) });

const CC = ['CONSTANT PassMark <- 50', 'DECLARE Mark : INTEGER', 'INPUT Mark', 'IF Mark >= PassMark THEN', '    OUTPUT "Pass"', 'ELSE', '    OUTPUT "Try again"', 'ENDIF'];
assert(outs(CC, [62])[0] === 'Pass' && runError(CC.concat(['PassMark <- 40'])), 'constant-check');
steps.push(checkStep('constant-check', 'Your Turn: Using a Constant', 'Your Turn: Using a Constant', '', [
  { label: '62 is typed in. What is output?', answer: word('pass'), feedback: 'Put 62 and the value of PassMark into the IF line. Is it TRUE?' },
  { label: 'The pass mark changes to 70. Which line do you change?', answer: num(1), feedback: 'Where is the value of PassMark set?' },
  { line: true, label: 'A line PassMark <- 40 is added at the end. Will the program run? Type yes or no.', answer: NO_RUN, feedback: 'What kind of value is PassMark? Can a program change it?' },
], code(CC, true)));

steps.push(embed('activity-2', 'Activity 2: The Right Types and a Constant', 'drill-y8-2-2-code', 'Activity 2: The Right Types and a Constant',
  'Write each program with the right data types. Some must use a constant. New values are typed in every time.'));
steps.push(pst('pyscratch-2', 'y8-2-2-constant', 2, 'Task 2 of 3: change a program that already works.'));
steps.push(pst('pyscratch-3', 'y8-2-2-score', 3, 'Task 3 of 3: write the whole program yourself.'));

steps.push(selfMarked('why-constant', 'Explain: Why Use a Constant?', 'Explain: Why Use a Constant?', '', [
  { id: 'why-constant', prompt: 'A program uses the speed limit 90 in six places. Explain why the programmer should make the speed limit a constant.', marks: 2,
    modelAnswer: 'If the limit changes, only one line needs to change (1), so no place can be missed and every line uses the same value (1).',
    scheme: ['A change to the value is made in one place only / only one line to edit',
      'So no use of it can be missed / every line uses the same value / fewer errors / the name says what 90 means'] },
]));

// ---------------------------------------------------------------- practice: fix the data types
const PR = ['DECLARE Name : STRING', 'DECLARE Height : INTEGER', 'DECLARE Member : STRING', 'DECLARE Visits : INTEGER', 'INPUT Name', 'INPUT Height', 'INPUT Visits', 'Member <- TRUE'];
{
  const e = stopsAt(PR, ['Ploy', '1.58', '4']);
  assert(e && e.line === 6, 'practice stops at line 6');
  const fixed = PR.slice(); fixed[1] = 'DECLARE Height : REAL'; fixed[2] = 'DECLARE Member : BOOLEAN';
  assert(!stopsAt(fixed, ['Ploy', '1.58', '4']), 'practice fixed runs');
}
function stopsAt(lines, inputs) { try { run(lines, inputs); return null; } catch (e) { const m = /line (\d+)/.exec(e.message); return { line: +m[1] }; } }
steps.push(checkStep('practice', 'Practice: Fix the Data Types', 'Practice: Fix the Data Types', 'Ploy types in her name, 1.58 for her height in metres, and 4 visits. The program stops.', [
  { label: 'Which line declares the wrong data type for Height?', answer: num(2), feedback: 'Find the line that DECLAREs Height. Can that type hold 1.58?' },
  { label: 'Which data type should Height have?', answer: TYPE_RE.REAL, feedback: '1.58 has a decimal part.' },
  { label: 'Member holds TRUE or FALSE. Which data type should line 3 use?', answer: TYPE_RE.BOOLEAN, feedback: 'Which data type has only two values?' },
], code(PR, true)));

steps.push(embed('plenary', 'Plenary: Data Types and Constants', 'drill-y8-2-2-data-types', 'Plenary: Data Types and Constants',
  'The four data types, choosing one, whether a program runs, and constants. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));

// ---------------------------------------------------------------- self-checks
assert(V('do-now', 0, '6') && !V('do-now', 0, '3') && V('do-now', 1, '3') && !V('do-now', 1, '6') && V('do-now', 2, '6.4') && !V('do-now', 2, '6.43') && !V('do-now', 2, '6'), 'do-now marks');
assert(V('do-now-2', 0, 'Found') && V('do-now-2', 0, '"found"') && !V('do-now-2', 0, 'Not found') && V('do-now-2', 1, 'Not found') && V('do-now-2', 1, 'not  found') && !V('do-now-2', 1, 'found'), 'do-now-2 marks');
for (const [i, ok, bad] of [[0, ['REAL', 'real', 'a real number'], ['INTEGER', 'unreal']], [1, ['STRING', 'string', 'a string'], ['REAL', 'strings of text']], [2, ['BOOLEAN', 'Boolean', 'bool'], ['STRING', 'FALSE']], [3, ['INTEGER', 'integer', 'an integer', 'int'], ['REAL', 'interval']]]) {
  ok.forEach((s) => assert(V('types-check', i, s), `types-check ${i} accepts ${s}`));
  bad.forEach((s) => assert(!V('types-check', i, s), `types-check ${i} rejects ${s}`));
}
assert(V('constant-check', 0, 'Pass') && !V('constant-check', 0, 'Try again') && V('constant-check', 1, '1') && !V('constant-check', 1, '4'), 'constant-check marks');
for (const s of ['no', 'No.', 'it will not run', "it won't run", 'it stops', 'error', 'no it stops with an error']) assert(V('constant-check', 2, s), 'no-run accepts ' + s);
for (const s of ['yes', 'it runs', 'yes it will run']) assert(!V('constant-check', 2, s), 'no-run rejects ' + s);
assert(V('practice', 0, '2') && !V('practice', 0, '6') && V('practice', 1, 'real') && V('practice', 2, 'BOOLEAN') && !V('practice', 2, 'STRING'), 'practice marks');
{
  const a = plain(JSON.stringify(WT_LIB.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b6\.4\b|\b45\b|\bDays\b/.test(a), 'library walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_SEARCH.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\bfound\b|\b42\b|\bCodes\b/i.test(b), 'search walkthrough leaks an answer');
}
assert(!/one (place|line)|missed|same value/i.test(TPS['why-constant'].join(' ')), 'why-constant TPS gives the answer');
checkLesson(steps, validators, {
  noTps: ['do-now-ext'],
  teach: [[/data types?/i, 'data-type'], [/\bREAL\b/, 'int-real'], [/\bconstants?\b/i, 'constant']],
});
function plain(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }

const lesson = { id: ID, label: '2.2: Data Types and Constants', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drill cards
function typeGens() {
  var TYPES = ["INTEGER", "REAL", "STRING", "BOOLEAN"];
  var TRE = {
    INTEGER: /^\s*(an?\s+)?(integer|int)\s*[.!]?\s*$/i, REAL: /^\s*(an?\s+)?real(\s+number)?\s*[.!]?\s*$/i,
    STRING: /^\s*(an?\s+)?(string|str)\s*[.!]?\s*$/i, BOOLEAN: /^\s*(an?\s+)?(boolean|bool)\s*[.!]?\s*$/i
  };
  var VALUES = { INTEGER: ["27", "-3", "0", "150", "2026", "-12", "8"], REAL: ["4.5", "1.62", "-0.5", "12.75", "99.9", "0.25"],
    STRING: ["\"Yes\"", "\"13\"", "\"Hat Yai\"", "\"4.5\"", "\"TRUE\"", "\"Mai\"", "\"0\""], BOOLEAN: ["TRUE", "FALSE"] };
  var WHY = { INTEGER: "It is a whole number with no quotes.", REAL: "It is a number with a decimal part and no quotes.",
    STRING: "It is in quotes, so it is text, even if it looks like a number.", BOOLEAN: "It is TRUE or FALSE with no quotes." };
  function notType(t) { return TYPES.filter(function (x) { return x !== t; }); }
  function valueGen() {
    var t = pick(TYPES), v = pick(VALUES[t]);
    return { prompt: "Which data type is this value?\n" + v, answer: t, re: TRE[t], wrong: notType(t),
      steps: ["Look for quotes first, then TRUE or FALSE, then a decimal part.", WHY[t]],
      working: ["Quotes first: a value in quotes is text.", "No quotes: is it only TRUE or FALSE? Is there a decimal part?"], note: v + ": " + WHY[t] };
  }
  var JOBS = [["the number of goals in a match", "INTEGER"], ["how many pupils are in a class", "INTEGER"], ["the number of lives left in a game", "INTEGER"],
    ["a price in baht, like 25.50", "REAL"], ["a height in metres, like 1.58", "REAL"], ["the temperature, like 31.5", "REAL"],
    ["whether a door is locked", "BOOLEAN"], ["whether a pupil has paid", "BOOLEAN"], ["whether a level is finished", "BOOLEAN"],
    ["a pupil's name", "STRING"], ["the name of a town", "STRING"], ["a phone number, like 081 234 5678", "STRING"]];
  var JOBWHY = { INTEGER: "It is counted in whole numbers.", REAL: "It can have a decimal part.", BOOLEAN: "It is a yes or no question: only TRUE or FALSE.",
    STRING: "It is text. A phone number is never added up, and it has spaces." };
  function jobGen() {
    var j = pick(JOBS);
    return { prompt: "A variable stores " + j[0] + ". Which data type should it be?", answer: j[1], re: TRE[j[1]], wrong: notType(j[1]),
      steps: ["Ask: is it counted, measured, a yes or no, or text?", JOBWHY[j[1]]],
      working: ["Will it be added up? Can it have a decimal part?", "Is it only ever yes or no? Or is it words and characters?"], note: JOBWHY[j[1]] };
  }
  var VARS = { INTEGER: ["Goals", "Lives", "Pupils"], REAL: ["Height", "Price", "Temp"], STRING: ["Name", "Town", "Reply"], BOOLEAN: ["Paid", "Locked", "Found"] };
  var RUNV = { INTEGER: ["27", "-3", "150", "8"], REAL: ["4.5", "1.62", "12.75", "0.25"], STRING: ["\"Yes\"", "\"13\"", "\"Hat Yai\"", "\"4.5\""], BOOLEAN: ["TRUE", "FALSE"] };
  function prog(match) {
    var u = pick(TYPES), v = pick(RUNV[u]), x = pick(VARS[u]), t = match ? u : pick(notType(u));
    var lines = ["DECLARE " + x + " : " + t, x + " <- " + v, "OUTPUT " + x];
    return { u: u, t: t, v: v, x: x, lines: lines, err: runErr(lines) };
  }
  function runGen() {
    var p = prog(rand(0, 1) === 1), ok = !p.err, ans = ok ? "Yes" : "No";
    return { prompt: "Will this program run? Type yes or no.\n" + p.lines.join("\n"), answer: ans,
      re: ok ? /^\s*(yes|yeah|it\s+(will\s+)?runs?|it\s+works)\b[^?]*$/i : /^\s*(no|nope|it\s+(will\s+)?(not|won'?t|does\s*n[o']?t)(\s+run)?|it\s+stops|(an?\s+)?error)\b[^?]*$/i,
      wrong: [ok ? "No" : "Yes", "Only the first line", "It outputs nothing"],
      steps: [p.x + " is declared as " + p.t + ".", p.v + " is " + (p.u === "INTEGER" ? "an " : "a ") + p.u + " value. " + (ok ? "A " + p.t + " can hold it." : "A " + p.t + " cannot hold it, so line 2 stops the program.")],
      working: ["Line 1: which data type is " + p.x + "?", "Line 2: what kind of value is " + p.v + "? Can that data type hold it?"],
      note: ok ? "A " + p.t + " can hold " + p.v + "." : "A " + p.t + " cannot hold " + p.v + ". Line 2 stops the program." };
  }
  function fixGen() {
    var p; do { p = prog(false); } while (!p.err);
    return { prompt: "This program stops on line 2. Which data type should line 1 use?\n" + p.lines.join("\n"), answer: p.u, re: TRE[p.u], wrong: notType(p.u),
      steps: ["Look at the value on line 2: " + p.v + ".", WHY[p.u]],
      working: ["Look at the value on line 2, not at line 1.", "Quotes? TRUE or FALSE? A decimal part?"], note: p.v + ": " + WHY[p.u] };
  }
  function realOutGen() {
    var price = rand(5, 60) + pick([0.25, 0.5, 0.75]), n = rand(2, 6), N = pick(["Price", "Cost", "Fare"]);
    var lines = ["DECLARE " + N + " : REAL", "DECLARE Items : INTEGER", N + " <- " + price, "Items <- " + n, "OUTPUT " + N + " * Items"], ans = run(lines)[0];
    return { prompt: "What is output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [Math.floor(price) * n, price + n, Math.round(price * n)]),
      steps: [N + " is a REAL, so it keeps its decimal part: " + price + ".", price + " x " + n + " = " + ans + "."],
      working: [N + " is a REAL: it keeps its decimal part.", "Multiply it by Items. Keep the decimal part."], note: price + " x " + n + " = " + ans + "." };
  }
}
function constGens() {
  var CONSTS = [["TicketPrice", 45, "ticket", "Tickets"], ["Delivery", 40, "delivery", "Orders"], ["SeatCost", 120, "seat", "Seats"], ["Fee", 25, "fee", "Pupils"], ["BoxPrice", 60, "box", "Boxes"]];
  function linesGen() {
    var c = pick(CONSTS), uses = rand(2, 4), useConst = rand(0, 1) === 1, val = useConst ? c[0] : String(c[1]);
    var lines = (useConst ? ["CONSTANT " + c[0] + " <- " + c[1]] : []).concat(["DECLARE " + c[3] + " : INTEGER", "INPUT " + c[3]]);
    var forms = ["OUTPUT " + c[3] + " * " + val, "OUTPUT (" + c[3] + " + 1) * " + val, "OUTPUT " + c[3] + " * " + val + " * 2", "OUTPUT " + val];
    lines = lines.concat(forms.slice(0, uses));
    var ans = String(useConst ? 1 : uses);
    return { key: useConst ? "c" : "t", prompt: "The " + c[2] + " price " + c[1] + " goes up to " + (c[1] + 5) + ". How many lines must you change?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [useConst ? uses : 1, uses + 1, lines.length]),
      steps: [useConst ? "The value is set once, on the CONSTANT line." : "Find every line with " + c[1] + " typed in.", useConst ? "Every other line uses the name, so they change too." : "Each of those lines must change."],
      working: ["Find where the number " + c[1] + " is written.", "Is it typed into each line, or set once at the top?"],
      note: useConst ? "Only the CONSTANT line changes." : c[1] + " is typed in " + uses + " lines, so " + uses + " lines change." };
  }
  function constRunGen() {
    var c = pick(CONSTS), asConst = rand(0, 1) === 1;
    var lines = [asConst ? "CONSTANT " + c[0] + " <- " + c[1] : "DECLARE " + c[0] + " : INTEGER"].concat(asConst ? [] : [c[0] + " <- " + c[1]]).concat([c[0] + " <- " + (c[1] + 5), "OUTPUT " + c[0]]);
    var ok = !runErr(lines), ans = ok ? "Yes" : "No";
    return { prompt: "Will this program run? Type yes or no.\n" + lines.join("\n"), answer: ans,
      re: ok ? /^\s*(yes|yeah|it\s+(will\s+)?runs?|it\s+works)\b[^?]*$/i : /^\s*(no|nope|it\s+(will\s+)?(not|won'?t|does\s*n[o']?t)(\s+run)?|it\s+stops|(an?\s+)?error)\b[^?]*$/i,
      wrong: [ok ? "No" : "Yes", "Only the first line", "It outputs nothing"],
      steps: ["Line 1: is " + c[0] + " a variable or a constant?", asConst ? "A constant can never change, so the line that changes it stops the program." : "A variable can change, so every line runs."],
      working: ["Look at line 1. Is " + c[0] + " made with DECLARE or with CONSTANT?", "Can a constant be given a new value while the program runs?"],
      note: asConst ? c[0] + " is a CONSTANT, so it cannot be changed." : c[0] + " is a variable, so it can be changed." };
  }
  function constOutGen() {
    var c = pick(CONSTS), n = rand(2, 9), lines = ["CONSTANT " + c[0] + " <- " + c[1], "DECLARE " + c[3] + " : INTEGER", "INPUT " + c[3], "OUTPUT " + c[3] + " * " + c[0]];
    var ans = run(lines, [n])[0];
    return { prompt: n + " is typed in. What is output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [n, c[1], n + c[1]]),
      steps: [c[0] + " is a constant: it is " + c[1] + " everywhere.", n + " x " + c[1] + " = " + ans + "."],
      working: ["What value does the constant hold?", "Put the typed value and the constant into the OUTPUT line."], note: n + " x " + c[1] + " = " + ans + "." };
  }
  function constWriteGen() {
    var c = pick(CONSTS.concat([["SpeedLimit", 90], ["PassMark", 50], ["MaxLives", 3], ["Rate", 0.07]]));
    var ans = "CONSTANT " + c[0] + " <- " + c[1];
    return { prompt: "Write the line that makes a constant called " + c[0] + " with the value " + c[1] + ".", answer: ans,
      re: new RegExp("^\\s*CONSTANT\\s+" + c[0] + "\\s*(<-|\\u2190|=)\\s*" + escRe(String(c[1])) + "\\s*$", "i"),
      wrong: ["DECLARE " + c[0] + " : INTEGER", c[0] + " <- " + c[1], "CONSTANT " + c[1] + " <- " + c[0]], format: "Type the whole line",
      steps: ["Start with the word CONSTANT.", "Then the name, then <-, then the value."],
      working: ["A constant line starts with one special word.", "Then: the name, an arrow <-, the value."], note: ans };
  }
}
function typeCards() {
  return [card("t-value-1", "t-value", valueGen), card("t-value-2", "t-value", valueGen),
    card("t-job-1", "t-job", jobGen), card("t-job-2", "t-job", jobGen),
    card("t-run-1", "t-run", runGen), card("t-run-2", "t-run", runGen),
    card("t-fix-1", "t-fix", fixGen), card("t-fix-2", "t-fix", fixGen)];
}
function plenaryWhy() {
  function intRealGen() {
    return { prompt: "What is the difference between an INTEGER and a REAL? Pick the answer, then type it.",
      answer: "A REAL can have a decimal part; an INTEGER cannot.",
      re: /(?=.*\b(decimals?|point|fractions?|parts?)\b)(?=.*\b(real|integer|whole)\b)/i,
      wrong: ["An INTEGER can hold text; a REAL holds only numbers.", "A REAL is TRUE or FALSE; an INTEGER is a number.", "An INTEGER is always a bigger number than a REAL."],
      working: ["Think of 13 and 13.5.", "Which one can a REAL hold that an INTEGER cannot?"], note: "An INTEGER is a whole number. A REAL can have a decimal part." };
  }
  function boolGen() {
    var j = pick(["a door is locked", "a pupil has paid", "a level is finished", "a light is on"]);
    return { prompt: "Why is BOOLEAN the best data type for whether " + j + "? Pick the answer, then type it.",
      answer: "It can only be TRUE or FALSE.",
      re: /(true|false|two\s+values|yes\s+or\s+no|only\s+(two|2))/i,
      wrong: ["It uses up the most memory.", "It can hold any number you like.", "It is the only type IF can use."],
      working: ["How many answers can this question have?", "Which data type has exactly that many values?"], note: "The question has only two answers, and a BOOLEAN holds only TRUE or FALSE." };
  }
  function constWhatGen() {
    return { prompt: "What is a constant? Pick the answer, then type it.", answer: "A value that is set once and never changes.",
      re: /(never|cannot|can'?t|does\s*n[o']?t|won'?t|not)\s+(be\s+)?chang|\b(fixed|stays\s+the\s+same|same\s+all|set\s+once)\b/i,
      wrong: ["A variable that holds TRUE or FALSE.", "A value the user types in each time.", "A library function that rounds numbers."],
      working: ["Think of TicketPrice <- 50 after CONSTANT TicketPrice <- 45.", "What happens to a constant while the program runs?"], note: "A constant is set once and never changes while the program runs." };
  }
  function constWhyGen() {
    var c = pick([["the ticket price", "45"], ["the speed limit", "90"], ["the pass mark", "50"]]);
    return { prompt: "Why use a constant for " + c[0] + " instead of typing " + c[1] + " in every line? Pick the answer, then type it.",
      answer: "Then a change is made in one place only.",
      re: /(one|1|single|same)\s+(place|line|spot|time)|only\s+(change|edit)\w*\s+(it\s+)?once|change\s+(it\s+)?once|(only|just)\s+once/i,
      wrong: ["Then the program needs no data types.", "Then the user can change it each time.", "Then the program can never have errors."],
      working: ["The value changes. How many lines must you edit?", "Compare: the number typed in many lines, or set once at the top."], note: "With a constant, one line changes and every use follows." };
  }
}
function plenaryCards() {
  return [card("pl-value-1", "pl-types", valueGen), card("pl-value-2", "pl-types", valueGen), why("pl-int-real", "pl-types", intRealGen), why("pl-bool", "pl-types", boolGen),
    card("pl-job-1", "pl-choose", jobGen), card("pl-job-2", "pl-choose", jobGen), card("pl-real-out", "pl-choose", realOutGen),
    card("pl-run", "pl-run", runGen), card("pl-fix", "pl-run", fixGen), card("pl-const-run", "pl-run", constRunGen),
    why("pl-const-what", "pl-const", constWhatGen), why("pl-const-why", "pl-const", constWhyGen), card("pl-const-lines", "pl-const", linesGen),
    card("pl-const-out", "pl-const", constOutGen), card("pl-const-write", "pl-const", constWriteGen)];
}

// Activity 2: write programs with the right data types and a constant.
function codeCards() {
  function r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function money() { return String(r(5, 80) + [0.25, 0.5, 0.75][r(0, 2)]); }
  return [
    { id: "k-price", category: "k-types", prompt: "A price in baht is typed in, like 12.5. Declare Price with the right data type and input it. Output the cost of 3 of them.",
      inputs: function () { return [money()]; }, setup: {}, reference: "DECLARE Price : REAL\nINPUT Price\nOUTPUT Price * 3", checkVars: [], checkOutput: true },
    { id: "k-height", category: "k-types", prompt: "A name and a height in metres are typed in, like Ploy and 1.5. Declare Name and Height with the right data types and input them. Output the name, then the height plus 0.25.",
      inputs: function () { return [["Ploy", "Sam", "Mai", "Ben"][r(0, 3)], String(r(1, 1) + [0.25, 0.5, 0.75][r(0, 2)])]; }, setup: {},
      reference: "DECLARE Name : STRING\nDECLARE Height : REAL\nINPUT Name\nINPUT Height\nOUTPUT Name\nOUTPUT Height + 0.25", checkVars: [], checkOutput: true },
    { id: "k-passed", category: "k-bool", prompt: "A mark is typed in. Declare Mark (INTEGER) and Passed (BOOLEAN). Input Mark. Set Passed to TRUE if Mark is 50 or more, otherwise FALSE. Then output Passed.",
      inputs: function () { return [String(r(20, 80))]; }, setup: {},
      reference: "DECLARE Mark : INTEGER\nDECLARE Passed : BOOLEAN\nINPUT Mark\nIF Mark >= 50 THEN\n  Passed <- TRUE\nELSE\n  Passed <- FALSE\nENDIF\nOUTPUT Passed", checkVars: ["Passed"], checkOutput: true },
    { id: "k-tickets", category: "k-const", prompt: "Each ticket costs 45 baht. Make a constant TicketPrice with the value 45. Declare Tickets and input it. Output the total cost.",
      inputs: function () { return [String(r(1, 12))]; }, setup: {}, mustBeConstant: ["TicketPrice"],
      reference: "CONSTANT TicketPrice <- 45\nDECLARE Tickets : INTEGER\nINPUT Tickets\nOUTPUT Tickets * TicketPrice", checkVars: [], checkOutput: true },
    { id: "k-speed", category: "k-const", prompt: "The speed limit is 90. Make a constant Limit with the value 90. Declare Speed and input it. If Speed is more than Limit, output \"Too fast\". Otherwise output \"OK\".",
      inputs: function () { return [String(r(60, 120))]; }, setup: {}, mustBeConstant: ["Limit"],
      reference: "CONSTANT Limit <- 90\nDECLARE Speed : INTEGER\nINPUT Speed\nIF Speed > Limit THEN\n  OUTPUT \"Too fast\"\nELSE\n  OUTPUT \"OK\"\nENDIF", checkVars: [], checkOutput: true },
    { id: "k-order", category: "k-mix", prompt: "A shop adds a delivery charge of 40 baht to every order. Make a constant Delivery with the value 40. Input a Price (it can have a decimal part) and a number of Items. Output Price x Items + Delivery.",
      inputs: function () { return [money(), String(r(1, 6))]; }, setup: {}, mustBeConstant: ["Delivery"],
      reference: "CONSTANT Delivery <- 40\nDECLARE Price : REAL\nDECLARE Items : INTEGER\nINPUT Price\nINPUT Items\nOUTPUT Price * Items + Delivery", checkVars: [], checkOutput: true },
    { id: "k-member", category: "k-mix", prompt: "Entry costs 100 baht, but members pay 20 baht less. Make constants Entry (100) and Discount (20). Input Member as a BOOLEAN (TRUE or FALSE is typed in). Output the price to pay.",
      inputs: function () { return [["TRUE", "FALSE"][r(0, 1)]]; }, setup: {}, mustBeConstant: ["Entry", "Discount"],
      reference: "CONSTANT Entry <- 100\nCONSTANT Discount <- 20\nDECLARE Member : BOOLEAN\nINPUT Member\nIF Member = TRUE THEN\n  OUTPUT Entry - Discount\nELSE\n  OUTPUT Entry\nENDIF", checkVars: [], checkOutput: true }
  ];
}

const B = 'tools/build_y8_2_2.mjs';
writeDrill({ id: 'y8-2-2-types', builder: B, header: 'Year 8, 2.2 Data Types and Constants. Activity 1: choose INTEGER, REAL, STRING or BOOLEAN, and predict whether a program runs.',
  title: 'Year 8, 2.2: Choose the Data Type', subtitle: 'INTEGER, REAL, STRING and BOOLEAN',
  cats: [['t-value', 'Value to Data Type'], ['t-job', 'Choose for the Job'], ['t-run', 'Will It Run?'], ['t-fix', 'Fix the Data Type']],
  parts: [body(drillKit), body(typeGens)], cardsFn: typeCards });
writeDrill({ id: 'y8-2-2-code', builder: B, codeDrill: true, header: 'Year 8, 2.2 Data Types and Constants. Activity 2: write programs with the right data types and constants; new values are typed in on every run.',
  title: 'Year 8, 2.2: The Right Types and a Constant', subtitle: 'Write programs with REAL, BOOLEAN and CONSTANT',
  cats: [['k-types', 'The Right Data Type'], ['k-bool', 'BOOLEAN'], ['k-const', 'Use a Constant'], ['k-mix', 'Put It Together']],
  parts: [], cardsFn: codeCards });
writeDrill({ id: 'y8-2-2-data-types', builder: B, header: 'Year 8, 2.2 Data Types and Constants. Plenary: the four data types, choosing one, whether a program runs, and constants.',
  title: 'Year 8, 2.2: Data Types and Constants', subtitle: 'Programming, Logic and Testing',
  cats: [['pl-types', 'The Four Data Types'], ['pl-choose', 'Choose the Data Type'], ['pl-run', 'Will It Run?'], ['pl-const', 'Constants']],
  parts: [body(drillKit), body(typeGens), body(constGens), body(plenaryWhy)], cardsFn: plenaryCards,
  typedNoExample: ['pl-int-real', 'pl-bool', 'pl-const-what', 'pl-const-why'] });

registerY8Unit2(ID, 'y8-2-1-libraries');
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
