// Builds LessonData/y8-2-1-libraries.json: Year 8, Unit 2 Programming, Logic and Testing, 2.1 Libraries and Library
// Functions (8P.01: outline the purpose of program libraries; 8P.03: identify and use library functions in text-based
// programs), its three drills (Drills/data/y8-2-1-predict.js, y8-2-1-code.js, y8-2-1-libraries.js), and registers
// the lesson as the first of a new Year 8 unit "Programming, Logic and Testing" after Data Models and Collection.
//   node tools/build_y8_2_1.mjs
// The text-based language is the Cambridge pseudocode Year 8 used in Unit 1, run by shared/pseudocode-engine.js
// (every variable DECLAREd with its type). The library functions are the syllabus library routines MOD, DIV, ROUND
// and RANDOM, plus LENGTH and UCASE. Only INTEGER and STRING are declared: REAL comes in 2.2, so decimals only
// appear as values that are output, never stored. EAL-light and Term 1b "why", as tools/build_y8_3_2.mjs.
// Year 8 has no exam board papers, so nothing carries a citation. Three PyScratch Task slides after Activity 2 embed
// pages PyScratchTask/ (tasks in PyScratchTask/tasks/y8-2-1.js).
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, assert, code, facts, columns, caption, note, hl, tps, table, box, arrayTable, run, outs, fill, num, word, NO,
  makeLesson, checkLesson, drillKit, body, writeDrill, registerY8Unit2,
} from './y8_unit2_kit.mjs';

const ID = 'y8-2-1-libraries';
const P = 'y821';
const { validators, checkStep, embed, mcStep, selfMarked, V } = makeLesson(P);

const TPS = {
  'do-now': ['Why does a model give a wrong cost when it is given last year\'s price?', 'The rule only uses the numbers it is given. An old number in gives an old answer out.'],
  'do-now-2': ['Why does the IF line sit inside the loop?', 'The loop visits every value in the array. The IF checks each value as it is visited.'],
  'purpose-check': ['Why is it risky to copy the same long piece of code into ten programs?', 'A mistake in it is then in ten places, and each one must be found and fixed.'],
  'spot-check': ['Why does a library function always have brackets after its name?', 'The brackets hold the values it works on. They show that the line uses a library function.'],
  'lab-3d': ['Why must DIV(20, 6) get its values in that order?', 'The first value is divided by the second. Swap them and it works out a different sum.'],
  'activity-1': ['Why predict the output before you check it?', 'A prediction shows what you think the function does. A wrong prediction shows you what to learn.'],
  'round-check': ['Why does ROUND need two values in its brackets?', 'The first value is the number to round. The second says how many decimal places to keep.'],
  'random': ['Why do games need a library function for random numbers?', 'A game must be different each time. Good random numbers are hard to write, so programmers use one already written.'],
  'activity-2': ['Why does the drill type in new values every time you run it?', 'A program that only works for one value is not finished. New values show that it works for any value.'],
  'pyscratch-1': ['Why does the sprite land in a different place each time the program runs?', 'RANDOM() gives a new number every time it is called, so the position changes on every run.'],
  'pyscratch-2': ['Why would a game show a speed rounded to 1 decimal place?', 'A short number is quick to read. The extra digits do not help the player.'],
  'pyscratch-3': ['Why does Check my program run your spinner many times?', 'One run could be right by luck. Many runs show that it works every time.'],
  'why-library': ['What makes an explanation worth 2 marks?', 'Two different reasons. Each one says what it means for the programmer.'],
  'practice': ['Why is LENGTH used before MOD in this program?', 'MOD needs a number. LENGTH turns the word into a number first.'],
  'plenary': ['Why practise with new numbers every time?', 'If you can predict the output for any numbers, you really know what each function does.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (3.2): the data a model needs
const trip = (bus, ticket, n) => bus + ticket * n;
assert(trip(1500, 120, 25) === 4500 && trip(1500, 100, 25) === 4000, 'do-now 1');
assert(trip(300, 80, 6) === 780 && trip(300, 70, 6) === 720, 'walkthrough 1');
const bowl = (mark = -1) => box('<strong>Bowling trip model</strong><br>' + ['Rule: cost = price of the lane + price of one game x players.',
  'Price of the lane: 300', 'Price of one game: 80', 'Players: 6'].map((t, i) => i === mark ? hl(t) : t).join('<br>'));
const WT_MODEL = { title: 'Walk me through it: running a model', steps: [
  { text: 'This is a different model with three questions like yours. Do the same steps with your model.', visual: bowl() },
  { text: 'Read the rule. It says what to work out first: the price of one game x players.', visual: bowl(0) },
  { text: '80 x 6 = <strong>480</strong>.', visual: bowl(2) + note('80 x 6 = 480') },
  { text: 'Add the price of the lane: 300 + 480 = <strong>780</strong>.', visual: bowl(1) + note('300 + 480 = ' + hl('780')) },
  { text: 'Last year one game cost 70. Put 70 into the rule in place of 80: 300 + 70 x 6 = <strong>720</strong>.', visual: note('300 + 70 x 6 = ' + hl('720')) },
  { text: 'Does the model use the colour of the balls? Look at the rule. The colour is never in it, so it can never change the cost. Ask the same about your question.', visual: bowl(0) },
] };
steps.push(checkStep('do-now', 'Do Now: Data a Model Needs (1 of 2)', 'Do Now: Data a Model Needs (1 of 2)', 'From 3.2: the data a model needs.', [
  { label: 'What cost does the model predict?', answer: num(4500), feedback: 'Work out the price of one ticket x students going first. Then add the price of the bus.' },
  { label: 'Someone uses last year\'s ticket price, 100. What does the model predict now?', answer: num(4000), feedback: 'Put the new ticket price into the rule, then work it out again.' },
  { line: true, label: 'Does the model need the length of the film? Type yes or no.', answer: NO, feedback: 'Read the rule. Is the length of the film anywhere in it?' },
], box('<strong>Cinema trip model</strong><br>Rule: cost = price of the bus + price of one ticket x students going.<br>Bus: 1500. One ticket: 120. Students going: 25.')));
steps[steps.length - 1].walkthrough = WT_MODEL;

// ---------------------------------------------------------------- Do Now 2 (Unit 1): an array in a loop
const PROG2 = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 4', '    IF Points[Index] > 5 THEN',
  '        Total <- Total + Points[Index]', '    ENDIF', 'NEXT Index', 'OUTPUT Total'];
assert(outs(PROG2, [], fill('Points', 'INTEGER', [7, 3, 9, 5]))[0] === '16', 'do-now 2');
const WPROG = ['DECLARE Total : INTEGER', 'DECLARE Index : INTEGER', 'Total <- 0', 'FOR Index <- 1 TO 4', '    IF Marks[Index] > 4 THEN',
  '        Total <- Total + Marks[Index]', '    ENDIF', 'NEXT Index', 'OUTPUT Total'];
assert(outs(WPROG, [], fill('Marks', 'INTEGER', [6, 3, 9, 5]))[0] === '20', 'walkthrough 2');
const WT_LOOP = { title: 'Walk me through it: an array in a loop', steps: [
  { text: 'This is a different program. Marks holds 6, 3, 9, 5. Do the same steps with your program.', visual: code(WPROG) },
  { text: 'Total starts at <strong>0</strong>. The loop then visits each value in Marks, from the first to the last.', visual: code(WPROG, false, [3, 4]) + note('Total = 0') },
  { text: 'The first value is 6. Is 6 more than 4? Yes, so the next line adds it. Total = <strong>6</strong>.', visual: code(WPROG, false, [5, 6]) + note('Total = 6, added once') },
  { text: 'The second value is 3. Is 3 more than 4? No, so the adding line is skipped. Total stays 6.', visual: code(WPROG, false, [5]) + note('Total = 6') },
  { text: 'The third value is 9. 9 is more than 4, so it is added. Total = 6 + 9 = <strong>15</strong>.', visual: code(WPROG, false, [5, 6]) + note('Total = 15, added twice') },
  { text: 'The last value is 5. 5 is more than 4, so it is added. Total = 15 + 5 = <strong>20</strong>.', visual: code(WPROG, false, [5, 6]) + note('Total = 20, added three times') },
  { text: 'The loop ends. The output is <strong>20</strong>, and the adding line ran <strong>3 times</strong>: once for each value more than 4. Now do yours.', visual: code(WPROG, false, [9]) },
] };
steps.push(checkStep('do-now-2', 'Do Now: An Array in a Loop (2 of 2)', 'Do Now: An Array in a Loop (2 of 2)', 'From Unit 1: arrays and loops.', [
  { label: 'What does the program output?', answer: num(16), feedback: 'Go through Points one value at a time. Add a value only when it is more than 5.' },
  { label: 'How many times does the line Total <- Total + Points[Index] run?', answer: num(2), feedback: 'Count the values that are more than 5. Is 5 more than 5?' },
], arrayTable('Points', [7, 3, 9, 5]) + code(PROG2, false, [], true)));
steps[steps.length - 1].walkthrough = WT_LOOP;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-revision-2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these Unit 1 questions on programs, loops and arrays. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '2.1: Libraries and Library Functions',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Programming, Logic and Testing</p><h2 class="lesson-h2">2.1: Libraries and Library Functions</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> use code that someone has already written.', '<strong>The big question:</strong> why write code again when it is already written?']) +
    tps('Programmers share code they have written. Why might that help other programmers?', '<p>Other programmers do not have to write the same code again. They can spend their time on the new parts of their program.</p>') });

// ---------------------------------------------------------------- write it yourself, or use code already written
const LOOP = ['DECLARE Left : INTEGER', 'Left <- 20', 'WHILE Left >= 6 DO', '    Left <- Left - 6', 'ENDWHILE', 'OUTPUT Left'];
const CALL = ['DECLARE Left : INTEGER', 'Left <- MOD(20, 6)', 'OUTPUT Left'];
assert(outs(LOOP)[0] === '2' && outs(CALL)[0] === '2', 'compare-write');
steps.push({ id: 'compare-write', label: 'Compare: Write It, or Use It?',
  content: '<h2 class="lesson-h2">Compare: Write It, or Use It?</h2>' +
    tps('Predict the output of each program. Why would a programmer choose B?',
      '<p>Both output <strong>2</strong>.</p><p><strong>Why B?</strong> It is one line, not four. MOD is already written and tested, so there is less to write and less that can go wrong.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">20 sweets go into bags of 6. How many sweets are left over?</p>' +
    columns(caption('A: write it yourself') + code(LOOP), caption('B: use MOD') + code(CALL)) +
    facts(['<strong>MOD</strong> gives the remainder: what is left over after dividing.', 'A takes 6 away again and again. Someone already wrote that for B.']) });

steps.push({ id: 'library', label: 'What Is a Library?',
  content: '<h2 class="lesson-h2">What Is a Library?</h2>' +
    tps('Predict: why is code from a library less likely to have errors than code you write today?',
      '<p>Many programmers have already used and tested it. Errors in it have been found and fixed.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">A <strong>library</strong> is a collection of code that is already written and tested, ready to use in your programs.</p>' +
    facts(['Each piece of code in a library has a name. It is a <strong>library function</strong>. MOD is one.',
      'It saves time: you do not write it again.', 'It has fewer errors: it is already tested.',
      'You only need to know what goes in and what comes out, not the lines inside.']) });

steps.push(mcStep('purpose-check', 'Your Turn: Why Use a Library?', 'Your Turn: Why Use a Library?', '', [
  { prompt: 'Why do programmers use library functions?',
    options: ['They are already written and tested', 'They make every program run faster', 'Programs that use them need no testing', 'They let you leave out DECLARE lines'], correct: 0,
    explain: 'Someone has already written and tested them, so you save time and avoid errors. Your own program still needs testing.' },
  { prompt: 'Mai uses MOD in 10 programs. What does she write each time?',
    options: ['The lines inside MOD, again', 'One line that uses MOD', 'A new library for each program', 'Nothing: MOD runs by itself'], correct: 1,
    explain: 'The lines inside MOD are already in the library. Each program only needs the line that uses it.' },
]));

// ---------------------------------------------------------------- calling a library function
assert(outs(['OUTPUT MOD(20, 6)', 'OUTPUT DIV(20, 6)']).join() === '2,3', 'calling');
steps.push({ id: 'calling', label: 'Calling a Library Function',
  content: '<h2 class="lesson-h2">Calling a Library Function</h2>' +
    tps('Predict: what does DIV(20, 6) give? Why is it not 3.33?', '<p><strong>3</strong>.</p><p><strong>Why?</strong> DIV only counts how many whole times 6 goes into 20. It throws the remainder away.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">To <strong>call</strong> a library function, write its name, then the values it needs in brackets.</p>' +
    columns(code(['Left <- MOD(20, 6)', 'Bags <- DIV(20, 6)']) +
      table(['Call', 'What it gives back'], [['MOD(20, 6)', '2: the remainder'], ['DIV(20, 6)', '?: the whole number of times']]),
      facts(['The values in the brackets go in.', 'The function gives back one value.', 'Store it with &lt;- or show it with OUTPUT.',
        'DECLARE, INPUT and OUTPUT are not library functions. They are part of the language.'])) });

assert(outs(['OUTPUT ROUND(3.456, 1)', 'OUTPUT LENGTH("Hat Yai")', 'OUTPUT UCASE("cat")']).join() === '3.5,7,CAT', 'more-functions');
steps.push({ id: 'more-functions', label: 'More Library Functions',
  content: '<h2 class="lesson-h2">More Library Functions</h2>' +
    tps('Predict: what does LENGTH("Hat Yai") give? Why?', '<p><strong>7</strong>.</p><p><strong>Why?</strong> LENGTH counts every character, and the space is a character too.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">Each library function does one job. Read its name and its brackets.</p>' +
    table(['Call', 'What goes in', 'What it gives back'], [
      ['ROUND(3.456, 1)', 'a number, then how many decimal places', '3.5: the number rounded'],
      ['LENGTH("Hat Yai")', 'some text', '?: how many characters'],
      ['UCASE("cat")', 'some text', '"CAT": the text in capital letters']]) });

// ---------------------------------------------------------------- find the library functions
const SPOT = ['DECLARE Name : STRING', 'DECLARE Minutes : INTEGER', 'INPUT Name', 'INPUT Minutes', 'OUTPUT UCASE(Name)', 'OUTPUT Minutes * 2', 'OUTPUT MOD(Minutes, 60)'];
assert(outs(SPOT, ['Sam', 135]).join() === 'SAM,270,15', 'spot-check');
steps.push(checkStep('spot-check', 'Your Turn: Find the Library Functions', 'Your Turn: Find the Library Functions', '', [
  { label: 'How many lines call a library function?', answer: num(2), feedback: 'Look for a name with brackets after it. INPUT and OUTPUT are part of the language.' },
  { label: 'Sam is typed in for Name. What does line 5 output?', answer: word('SAM'), flags: '', feedback: 'UCASE gives the text back in capital letters. Check every letter.' },
  { label: '135 is typed in for Minutes. What does line 7 output?', answer: num(15), feedback: 'MOD gives the remainder. How many whole times does 60 go into 135? What is left?' },
], code(SPOT, true)));

steps.push(embed('activity-1', 'Activity 1: Predict the Output', 'drill-y8-2-1-predict', 'Activity 1: Predict the Output',
  'Predict what each program outputs, then type it. The numbers change every time.'));

steps.push(Object.assign(embed('lab-3d', 'Lab: Library Functions in 3D', 'pseudocode-lab-3d', 'Lab: Library Functions in 3D',
  'Walk round the lab with W A S D. Tap <strong>Space</strong> to pick up a value and tap again to put it down. DECLARE each variable, then work out each library function on the WORK bench. A mistake in a challenge starts a new round. <strong>Done</strong> when Call MOD, DIV and MOD, ROUND and LENGTH and UCASE are complete.'), { embedQuery: 'lesson=8-2.1' }));

// ---------------------------------------------------------------- ROUND
const RA = ['DECLARE Total : INTEGER', 'Total <- 20', 'OUTPUT Total / 3'];
const RB = ['DECLARE Total : INTEGER', 'Total <- 20', 'OUTPUT ROUND(Total / 3, 1)'];
assert(outs(RA)[0] === '6.666666666666667' && outs(RB)[0] === '6.7', 'compare-round');
steps.push({ id: 'compare-round', label: 'Compare: With and Without ROUND',
  content: '<h2 class="lesson-h2">Compare: With and Without ROUND</h2>' +
    tps('Predict what each program outputs. Why would a shop use B?', '<p>A outputs <strong>6.666666666666667</strong>. B outputs <strong>6.7</strong>.</p><p><strong>Why B?</strong> People read 6.7 quickly. Nobody pays 6.666666666666667 baht.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">20 points shared by 3 players.</p>' +
    columns(caption('A: no ROUND') + code(RA), caption('B: ROUND to 1 decimal place') + code(RB)) +
    facts(['Without ROUND, the computer shows every digit it has.', 'ROUND keeps only the decimal places you ask for.']) });

const RC = ['DECLARE Total : INTEGER', 'Total <- 47', 'OUTPUT ROUND(Total / 6, 1)', 'OUTPUT ROUND(Total / 6, 0)'];
assert(outs(RC).join() === '7.8,8', 'round-check');
steps.push(checkStep('round-check', 'Your Turn: Rounding', 'Your Turn: Rounding', '47 / 6 = 7.8333...', [
  { label: 'What does line 3 output?', answer: num('7.8'), feedback: 'Keep one decimal place. Look at the next digit: 5 or more rounds up.' },
  { label: 'What does line 4 output?', answer: num(8), feedback: 'Keep no decimal places. Look at the first digit after the point.' },
], code(RC, true)));

// ---------------------------------------------------------------- RANDOM
steps.push(mcStep('random', 'Random Numbers', 'Random Numbers', '',
  [{ prompt: 'A game needs a whole number from 1 to 10. Which line gives it?',
    options: ['ROUND(RANDOM() * 9, 0) + 1', 'ROUND(RANDOM() * 10, 0)', 'ROUND(RANDOM() * 10, 0) + 1', 'RANDOM() * 10 + 1'], correct: 0,
    explain: 'RANDOM() * 9 gives 0 to 9. ROUND makes it a whole number. + 1 gives 1 to 10.' }],
  columns(caption('A dice game needs a whole number from 1 to 6.') + code(['Dice <- ROUND(RANDOM() * 5, 0) + 1']),
    table(['Part', 'Smallest', 'Largest'], [['RANDOM()', '0', '1'], ['RANDOM() * 5', '0', '5'], ['ROUND(..., 0) + 1', '1', '6, whole']]))));

steps.push(embed('activity-2', 'Activity 2: Use a Library Function', 'drill-y8-2-1-code', 'Activity 2: Use a Library Function',
  'Write each program. It runs with new values every time, so it must work for any value.'));

// ---------------------------------------------------------------- PyScratch Tasks (pages PyScratchTask/tasks/y8-2-1.js)
// Each runs the student's pseudocode on a Scratch stage and checks what happened; help fades from task 1 to 3.
const PST_LEAD = '<strong>What to do:</strong> write the program in the box on the left. Click the green flag above the stage to run it. When it works, click <strong>Check my program</strong>.';
[['pyscratch-1', 'y8-2-1-random', 'Task 1 of 3: finish one line.'], ['pyscratch-2', 'y8-2-1-speed', 'Task 2 of 3: change a program that already works.'],
  ['pyscratch-3', 'y8-2-1-spin', 'Task 3 of 3: write the whole program yourself.']].forEach(([id, task, what], i) => {
  steps.push(Object.assign(embed(id, `Activity: PyScratch Task ${i + 1}`, 'pyscratch-task', `Activity: PyScratch Task ${i + 1} of 3`,
    (i === 0 ? PST_LEAD + ' ' : '') + what), { embedQuery: 'task=' + task }));
});

steps.push(selfMarked('why-library', 'Explain: Why Use a Library Function?', 'Explain: Why Use a Library Function?', '', [
  { id: 'why-library', prompt: 'Ali writes his own four lines to find a remainder. Kim calls MOD from the library. Explain two reasons why Kim\'s way is better.', marks: 2,
    modelAnswer: 'MOD is already written, so Kim writes less code and saves time (1). MOD is already tested, so it is less likely to have errors (1).',
    scheme: ['MOD is already written, so less code to write / saves time / quicker',
      'MOD is already tested / used by many programmers, so fewer errors / more reliable'] },
]));

// ---------------------------------------------------------------- practice: two functions together
const PR = ['DECLARE Word : STRING', 'DECLARE Size : INTEGER', 'INPUT Word', 'Size <- LENGTH(Word)', 'IF MOD(Size, 2) = 0 THEN', '    OUTPUT "Even"', 'ELSE', '    OUTPUT "Odd"', 'ENDIF'];
assert(outs(PR, ['Bangkok'])[0] === 'Odd' && outs(PR, ['Phuket'])[0] === 'Even', 'practice');
steps.push(checkStep('practice', 'Practice: Two Library Functions', 'Practice: Two Library Functions', '', [
  { label: 'How many different library functions does this program call?', answer: num(2), feedback: 'Find each name with brackets after it. IF and OUTPUT are part of the language.' },
  { label: 'Bangkok is typed in. What is output?', answer: word('odd'), feedback: 'Count the characters first. Then find the remainder after dividing by 2.' },
  { label: 'Phuket is typed in. What is output?', answer: word('even'), feedback: 'Count the characters first. Then find the remainder after dividing by 2.' },
], code(PR, true)));

steps.push(embed('plenary', 'Plenary: Libraries and Library Functions', 'drill-y8-2-1-libraries', 'Plenary: Libraries and Library Functions',
  'What a library is, why programmers use one, and reading and using library functions. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));

// ---------------------------------------------------------------- self-checks
assert(V('do-now', 0, '4500') && !V('do-now', 0, '3000') && V('do-now', 1, '4000') && !V('do-now', 1, '4500'), 'do-now marks');
for (const s of ['no', 'No.', 'not needed', "it doesn't", 'nope']) assert(V('do-now', 2, s), 'no accepts ' + s);
for (const s of ['yes', 'maybe', 'no idea']) assert(!V('do-now', 2, s), 'no rejects ' + s);
assert(V('do-now-2', 0, '16') && !V('do-now-2', 0, '21') && !V('do-now-2', 0, '24') && V('do-now-2', 1, '2') && !V('do-now-2', 1, '3'), 'do-now-2 marks');
assert(V('spot-check', 0, '2') && !V('spot-check', 0, '3') && V('spot-check', 1, 'SAM') && V('spot-check', 1, '"SAM"') && !V('spot-check', 1, 'Sam') && V('spot-check', 2, '15') && !V('spot-check', 2, '2'), 'spot-check marks');
assert(V('round-check', 0, '7.8') && V('round-check', 0, '7.80') && !V('round-check', 0, '7.83') && !V('round-check', 0, '8') && V('round-check', 1, '8') && V('round-check', 1, '8.0') && !V('round-check', 1, '7.8'), 'round-check marks');
assert(V('practice', 0, '2') && V('practice', 1, 'Odd') && V('practice', 1, '"odd"') && !V('practice', 1, 'Even') && V('practice', 2, 'EVEN') && !V('practice', 2, 'odd'), 'practice marks');
{
  const a = plain(JSON.stringify(WT_MODEL.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b4500\b|\b4000\b|\bno\b|film/i.test(a), 'model walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_LOOP.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b16\b|\b2\b|\btwice\b(?! \w)|Points/.test(b.replace('added twice', '')), 'loop walkthrough leaks an answer');
}
assert(!/already|tested|less code|errors?/i.test(TPS['why-library'].join(' ')), 'why-library TPS gives the answer');
checkLesson(steps, validators, {
  noTps: ['do-now-ext'],
  teach: [[/\blibrar(y|ies)\b/i, 'library'], [/\bMOD\b/, 'compare-write'], [/\bDIV\b/, 'calling'], [/\bcall(s|ed|ing)?\b/i, 'calling'],
    [/\bROUND\b/, 'more-functions'], [/\bLENGTH\b/, 'more-functions'], [/\bUCASE\b/, 'more-functions'], [/\bRANDOM\b/, 'random'], [/\bREAL\b|\bBOOLEAN\b|\bCONSTANT\b/, 'plenary']],
});
function plain(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); }

const lesson = { id: ID, label: '2.1: Libraries and Library Functions', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drill cards
// Generators shared by Activity 1 and the plenary. Each returns { prompt, answer, re, wrong, steps, working, note }.
function libGens() {
  var NUMV = [["Sweets", "bags of"], ["Eggs", "boxes of"], ["Pencils", "packs of"], ["Cards", "piles of"], ["Stickers", "sheets of"], ["Marbles", "bags of"]];
  var WORDS = ["Bangkok", "Phuket", "Hat Yai", "Songkhla", "Chiang Mai", "Krabi", "laptop", "printer", "keyboard", "monitor", "Pattani", "Trang"];
  var NAMES = ["Mai", "Sam", "Ploy", "Ben", "Nok", "Leo", "Fah", "Kai", "Mint", "Tom"];
  function divmod(a, b) { return [Math.floor(a / b), a % b]; }
  function modGen() {
    var v = pick(NUMV), b = rand(3, 9), a = rand(2 * b + 1, 9 * b + b - 1);
    if (a % b === 0) a++;
    var dm = divmod(a, b), lines = ["DECLARE Left : INTEGER", "Left <- MOD(" + a + ", " + b + ")", "OUTPUT Left"];
    var ans = run(lines)[0];
    return { prompt: "What does this program output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [dm[0], b - dm[1], dm[1] + 1, Math.round(a / b * 10) / 10]),
      steps: ["MOD gives the remainder.", b + " goes into " + a + " " + dm[0] + " whole times: " + dm[0] + " x " + b + " = " + dm[0] * b + ".", a + " - " + dm[0] * b + " = " + dm[1] + " left over."],
      working: ["MOD gives what is left over after dividing.", "How many whole times does " + b + " go into " + a + "? Take that many " + b + "s away from " + a + "."],
      note: "MOD(" + a + ", " + b + ") is the remainder: " + a + " - " + dm[0] * b + " = " + dm[1] + "." };
  }
  function divGen() {
    var b = rand(3, 9), a = rand(2 * b + 1, 9 * b + b - 1);
    if (a % b === 0) a++;
    var dm = divmod(a, b), lines = ["DECLARE Bags : INTEGER", "Bags <- DIV(" + a + ", " + b + ")", "OUTPUT Bags"];
    var ans = run(lines)[0];
    return { prompt: "What does this program output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [dm[1], dm[0] + 1, Math.round(a / b * 100) / 100]),
      steps: ["DIV gives the whole number of times one number goes into the other.", dm[0] + " x " + b + " = " + dm[0] * b + ". One more would be " + (dm[0] + 1) * b + ", which is more than " + a + "."],
      working: ["DIV counts whole times only. The remainder is thrown away.", "Count up in " + b + "s. How many fit before you pass " + a + "?"],
      note: "DIV(" + a + ", " + b + ") = " + dm[0] + ", because " + dm[0] + " x " + b + " = " + dm[0] * b + " and the rest is left over." };
  }
  function roundGen() {
    var x = rand(1001, 9989) / 1000, p = pick([0, 1, 2]);
    if (Math.round(x * 1000) % 10 === 0) x = x + 0.003;
    x = Math.round(x * 1000) / 1000;
    var lines = ["OUTPUT ROUND(" + x + ", " + p + ")"], ans = run(lines)[0];
    var cut = String(Math.floor(x * Math.pow(10, p)) / Math.pow(10, p));
    return { prompt: "What does this line output?\n" + lines[0], answer: ans, re: numRe(ans),
      wrong: others(ans, [cut, run(["OUTPUT ROUND(" + x + ", " + (p + 1) + ")"])[0], String(x), run(["OUTPUT ROUND(" + x + ", " + (p === 0 ? 1 : p - 1) + ")"])[0]]),
      steps: ["ROUND(" + x + ", " + p + ") keeps " + p + " decimal place" + (p === 1 ? "" : "s") + ".", "Look at the next digit. Five or more rounds up; four or less stays."],
      working: ["The second value says how many decimal places to keep.", "Look at the first digit you throw away. Is it five or more?"],
      note: "ROUND keeps " + p + " decimal place" + (p === 1 ? "" : "s") + " and rounds on the next digit." };
  }
  function textGen() {
    if (rand(0, 1)) {
      var w = pick(WORDS), lines = ["DECLARE Place : STRING", "Place <- \"" + w + "\"", "OUTPUT LENGTH(Place)"], ans = run(lines)[0];
      return { prompt: "What does this program output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
        wrong: others(ans, [w.replace(/ /g, "").length === w.length ? w.length + 1 : w.replace(/ /g, "").length, w.length - 1, w.length + 2, w.length + 3]),
        steps: ["LENGTH counts every character in \"" + w + "\".", "Spaces count too."],
        working: ["LENGTH counts the characters between the quotes.", "Count every letter, and any space."],
        note: "\"" + w + "\" has " + w.length + " characters." };
    }
    var n = pick(NAMES), lines2 = ["DECLARE Name : STRING", "Name <- \"" + n + "\"", "OUTPUT UCASE(Name)"], ans2 = run(lines2)[0];
    return { prompt: "What does this program output?\n" + lines2.join("\n"), answer: ans2, re: textRe(ans2, true),
      wrong: [n, n.toLowerCase(), "NAME"], format: "Type the output exactly, with the right capital letters",
      steps: ["UCASE gives the text back in capital letters.", "Every letter of \"" + n + "\" becomes a capital."],
      working: ["UCASE changes the letters to capital letters.", "Write out each letter of the name as a capital."],
      note: "UCASE(\"" + n + "\") gives \"" + ans2 + "\"." };
  }
  var UNITS = [["Minutes", 60, "hours", "minutes"], ["Seconds", 60, "minutes", "seconds"], ["Days", 7, "weeks", "days"], ["Eggs", 12, "boxes of 12", "eggs"], ["Months", 12, "years", "months"]];
  function minutesGen() {
    var u = pick(UNITS), V = u[0], d = u[1], m = rand(2 * d + 1, 5 * d - 1); if (m % d === 0) m += 1;
    var line = pick([3, 4]), lines = ["DECLARE " + V + " : INTEGER", "INPUT " + V, "OUTPUT DIV(" + V + ", " + d + ")", "OUTPUT MOD(" + V + ", " + d + ")"];
    var o = run(lines, [m]), ans = o[line - 3];
    return { prompt: m + " is typed in. What does line " + line + " output?\n" + numbered(lines), answer: ans, re: numRe(ans),
      wrong: others(ans, [o[4 - line], d - m % d, Math.round(m / d * 100) / 100, m - d]),
      steps: ["Line " + line + " uses " + (line === 3 ? "DIV: the whole number of " + u[2] : "MOD: the " + u[3] + " left over") + ".", d + " goes into " + m + " " + Math.floor(m / d) + " whole times, with " + (m % d) + " left over."],
      working: ["Find the library function on line " + line + ". What does it give back?", "How many whole " + d + "s fit into " + m + "? What is left over?"],
      note: m + " " + u[3] + " = " + Math.floor(m / d) + " " + u[2] + " and " + (m % d) + " " + u[3] + "." };
  }
  var TRIO = ["Score", "Mark", "Test", "Goal", "Lap"];
  function averageGen() {
    var a = rand(3, 20), b = rand(3, 20), c = rand(3, 20), S = pick(TRIO);
    if ((a + b + c) % 3 === 0) c++;
    var p = pick([0, 1]);
    var lines = ["DECLARE " + S + "1 : INTEGER", "DECLARE " + S + "2 : INTEGER", "DECLARE " + S + "3 : INTEGER", "INPUT " + S + "1", "INPUT " + S + "2", "INPUT " + S + "3", "OUTPUT ROUND((" + S + "1 + " + S + "2 + " + S + "3) / 3, " + p + ")"];
    var ans = run(lines, [a, b, c])[0];
    return { prompt: a + ", " + b + " and " + c + " are typed in. What is output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [a + b + c, run(["OUTPUT ROUND(" + (a + b + c) + " / 3, " + (1 - p) + ")"])[0], Math.floor((a + b + c) / 3), run(["OUTPUT ROUND(" + (a + b + c) + " / 3, 2)"])[0]]),
      steps: ["Add the three values: " + (a + b + c) + ".", "Divide by 3: " + Math.round((a + b + c) / 3 * 1000) / 1000 + "...", "ROUND keeps " + p + " decimal place" + (p === 1 ? "" : "s") + "."],
      working: ["Work out the brackets first: add the three values, then divide by 3.", "Then round. The second value in ROUND says how many decimal places."],
      note: (a + b + c) + " / 3 = " + Math.round((a + b + c) / 3 * 1000) / 1000 + "..., rounded to " + p + " decimal place" + (p === 1 ? "" : "s") + ": " + ans + "." };
  }
  var TEXTV = [["Word", "Size"], ["Place", "Count"], ["City", "Letters"], ["Item", "Chars"]];
  function evenOddGen() {
    var w = pick(WORDS), t = pick(TEXTV), lines = ["DECLARE " + t[0] + " : STRING", "DECLARE " + t[1] + " : INTEGER", "INPUT " + t[0], t[1] + " <- LENGTH(" + t[0] + ")", "IF MOD(" + t[1] + ", 2) = 0 THEN", "    OUTPUT \"Even\"", "ELSE", "    OUTPUT \"Odd\"", "ENDIF"];
    var ans = run(lines, [w])[0];
    return { prompt: w + " is typed in. What is output?\n" + lines.join("\n"), answer: ans, re: textRe(ans),
      wrong: [ans === "Odd" ? "Even" : "Odd", String(w.length), t[1]],
      steps: ["LENGTH(\"" + w + "\") = " + w.length + ".", "MOD(" + w.length + ", 2) = " + w.length % 2 + "."],
      working: ["First count the characters. Spaces count.", "Then find the remainder after dividing that number by 2. Is it 0?"],
      note: "\"" + w + "\" has " + w.length + " characters. The remainder after dividing by 2 is " + w.length % 2 + "." };
  }
  function halfGen() {
    var w = pick(WORDS), t = pick(TEXTV)[0], lines = ["DECLARE " + t + " : STRING", "INPUT " + t, "OUTPUT ROUND(LENGTH(" + t + ") / 2, 0)"], ans = run(lines, [w])[0];
    return { prompt: w + " is typed in. What is output?\n" + lines.join("\n"), answer: ans, re: numRe(ans),
      wrong: others(ans, [w.length, w.length / 2, Math.floor(w.length / 2), w.length + 1]),
      steps: ["The inside call runs first: LENGTH(\"" + w + "\") = " + w.length + ".", w.length + " / 2 = " + w.length / 2 + ", then ROUND keeps no decimal places."],
      working: ["Work from the inside out. Count the characters first.", "Divide by 2, then round to a whole number. A half rounds up."],
      note: "LENGTH gives " + w.length + ". " + w.length + " / 2 = " + w.length / 2 + ", rounded: " + ans + "." };
  }
  var PROGS = [
    function (k) { return { lines: ["DECLARE Eggs : INTEGER", "DECLARE Boxes : INTEGER", "INPUT Eggs", "Boxes <- DIV(Eggs, " + k + ")", "OUTPUT Boxes"], at: 4, fn: "DIV" }; },
    function () { return { lines: ["DECLARE Name : STRING", "INPUT Name", "OUTPUT \"Hello\"", "OUTPUT UCASE(Name)"], at: 4, fn: "UCASE" }; },
    function () { return { lines: ["DECLARE Word : STRING", "DECLARE Size : INTEGER", "INPUT Word", "Size <- LENGTH(Word)", "Size <- Size + 1", "OUTPUT Size"], at: 4, fn: "LENGTH" }; },
    function (k) { return { lines: ["DECLARE Total : INTEGER", "INPUT Total", "OUTPUT ROUND(Total / " + k + ", 2)", "OUTPUT Total"], at: 3, fn: "ROUND" }; },
    function (k) { return { lines: ["DECLARE Cards : INTEGER", "DECLARE Left : INTEGER", "DECLARE Each : INTEGER", "INPUT Cards", "Each <- Cards * " + k, "Left <- MOD(Cards, " + k + ")", "OUTPUT Each", "OUTPUT Left"], at: 6, fn: "MOD" }; },
    function (k) { return { lines: ["DECLARE Score : INTEGER", "DECLARE Dice : INTEGER", "Score <- " + k * 10, "Dice <- ROUND(RANDOM() * 5, 0) + 1", "Score <- Score + Dice", "OUTPUT Score"], at: 4, fn: "ROUND and RANDOM" }; }
  ];
  function lineGen() {
    var p = pick(PROGS)(rand(3, 9)), ans = String(p.at);
    return { key: p.fn, prompt: "Which line calls a library function?\n" + numbered(p.lines), answer: ans, re: numRe(ans),
      wrong: others(ans, [1, 2, 3, 4, 5, 6].filter(function (x) { return x <= p.lines.length && x !== p.at; }).slice(0, 4)),
      steps: ["Look for a name with brackets after it.", "Line " + p.at + " uses " + p.fn + ". DECLARE, INPUT and OUTPUT are part of the language."],
      working: ["Look for a name with brackets after it.", "DECLARE, INPUT and OUTPUT are part of the language, not library functions."],
      note: "Line " + p.at + " calls " + p.fn + "." };
  }
  function nameGen() {
    var p = pick(PROGS.slice(0, 5))(rand(3, 9));
    return { key: p.fn, prompt: "Name the library function this program calls.\n" + p.lines.join("\n"), answer: p.fn, re: textRe(p.fn),
      wrong: ["DECLARE", "INPUT", "OUTPUT"],
      steps: ["Look for a name with brackets after it.", "It is " + p.fn + ". DECLARE, INPUT and OUTPUT are part of the language."],
      working: ["Find the name that has brackets after it.", "DECLARE, INPUT and OUTPUT are part of the language, not library functions."],
      note: p.fn + " is the library function. DECLARE, INPUT and OUTPUT are part of the language." };
  }
  function notLibGen() {
    var libs = shuffle(["MOD", "DIV", "ROUND", "LENGTH", "UCASE", "RANDOM"]).slice(0, 3), kw = pick(["OUTPUT", "INPUT", "DECLARE"]);
    var all = shuffle(libs.concat([kw]));
    return { prompt: "Which of these is NOT a library function?\n" + all.join(", "), answer: kw, re: textRe(kw), wrong: libs,
      steps: [libs.join(", ") + " each take values in brackets and give one back.", kw + " is part of the language itself."],
      working: ["A library function is called with brackets and gives a value back.", "Which word is part of the language itself?"],
      note: kw + " is part of the language. " + libs.join(", ") + " are library functions." };
  }
  function randGen() {
    var k = rand(3, 11), j = rand(1, 5), big = rand(0, 1), ans = String(big ? k + j : j);
    return { prompt: "What is the " + (big ? "largest" : "smallest") + " number this line can give?\nDice <- ROUND(RANDOM() * " + k + ", 0) + " + j, answer: ans, re: numRe(ans),
      wrong: others(ans, big ? [k, k + j + 1, k + j - 1, k * j] : [0, j - 1, j + 1, 1].filter(function (x) { return x >= 0; })),
      steps: ["RANDOM() gives 0 to 1.", "Work the line out with " + (big ? "1" : "0") + " in place of RANDOM()."],
      working: ["RANDOM() gives a number from 0 to 1.", "Put " + (big ? "1" : "0") + " in place of RANDOM(), then work out the line."],
      note: "With RANDOM() = 0 it gives " + j + ". With RANDOM() = 1 it gives " + (k + j) + "." };
  }
  var TASKS = [["the remainder when some sweets are shared into bags", "MOD"], ["how many whole bags of 6 some sweets fill", "DIV"],
    ["a price rounded to 2 decimal places", "ROUND"], ["how many characters a password has", "LENGTH"],
    ["a name in capital letters", "UCASE"], ["a random number for a dice game", "RANDOM"]];
  function chooseGen() {
    var t = pick(TASKS), rest = shuffle(TASKS.filter(function (x) { return x[1] !== t[1]; })).slice(0, 3);
    return { prompt: "A program must work out " + t[0] + ". Which library function should it call?", answer: t[1], re: textRe(t[1]),
      wrong: rest.map(function (x) { return x[1]; }),
      steps: ["Think about what each library function gives back.", "The one that gives back " + t[0] + " is " + t[1] + "."],
      working: ["What does each library function give back?", "Pick the one whose job matches the task."],
      note: t[1] + " gives back " + t[0] + "." };
  }
  var GAPS = [
    function (v, k) { return { task: "the remainder when " + v + " are shared into groups of " + k, ans: "MOD(" + v + ", " + k + ")", rx: "MOD\\s*\\(\\s*" + v + "\\s*,\\s*" + k + "\\s*\\)|" + v + "\\s+MOD\\s+" + k, wrong: ["MOD(" + k + ", " + v + ")", "DIV(" + v + ", " + k + ")", v + " - " + k] }; },
    function (v, k) { return { task: "how many whole groups of " + k + " the " + v + " fill", ans: "DIV(" + v + ", " + k + ")", rx: "DIV\\s*\\(\\s*" + v + "\\s*,\\s*" + k + "\\s*\\)|" + v + "\\s+DIV\\s+" + k, wrong: ["DIV(" + k + ", " + v + ")", "MOD(" + v + ", " + k + ")", v + " / " + k] }; },
    function (v, k) { return { task: v + " / " + k + " rounded to 1 decimal place", ans: "ROUND(" + v + " / " + k + ", 1)", rx: "ROUND\\s*\\(\\s*\\(?\\s*" + v + "\\s*/\\s*" + k + "\\s*\\)?\\s*,\\s*1\\s*\\)", wrong: ["ROUND(1, " + v + " / " + k + ")", "ROUND(" + v + " / " + k + ")", "DIV(" + v + ", " + k + ")"] }; }
  ];
  function gapGen() {
    var v = pick(["Sweets", "Eggs", "Cards", "Points", "Pencils"]), k = rand(3, 9), g = pick(GAPS)(v, k);
    return { prompt: "Complete the line so it stores " + g.task + ".\nAnswer <- ____", answer: g.ans, re: new RegExp("^\\s*(" + g.rx + ")\\s*$", "i"), wrong: g.wrong,
      format: "Type the code that goes in the gap",
      steps: ["Choose the library function by what it gives back.", "Inside the brackets, the number you divide comes first."],
      working: ["Which library function gives back what the line needs?", "Put the values in its brackets in the right order: the number you divide comes first."],
      note: "Answer <- " + g.ans };
  }
}

function predictCards() {
  return [
    card("a-mod", "a-one", modGen), card("a-div", "a-one", divGen), card("a-round", "a-one", roundGen), card("a-text", "a-one", textGen),
    card("a-minutes", "a-input", minutesGen), card("a-average", "a-input", averageGen),
    card("a-evenodd", "a-two", evenOddGen), card("a-half", "a-two", halfGen),
    card("a-line", "a-find", lineGen), card("a-name", "a-find", nameGen)
  ];
}

// The plenary: this lesson only. The why cards are pick-then-type with a keyword pattern for the idea.
function plenaryWhy() {
  var FNS = ["ROUND", "MOD", "LENGTH", "DIV", "UCASE"];
  function whatGen() {
    return { prompt: pick(["What is a library in programming?", "Mai says a library is a room full of books. What is a library in programming?"]),
      answer: "Code that is already written and tested",
      re: /(?=.*\b(code|functions?|routines?|programs?)\b)(?=.*\b(already|someone|others?|pre-?written|ready|tested)\b)/i,
      wrong: ["A folder where all your own programs are kept", "A list of every variable a program declares", "The first part of a program, with DECLARE"],
      working: ["Think about where MOD and ROUND come from.", "Who wrote them, and are they ready to use?"], note: "A library is code that is already written and tested, ready to use." };
  }
  function timeGen() {
    var f = pick(FNS);
    return { prompt: "Why call " + f + " instead of writing that code yourself? Pick the reason, then type it.",
      answer: "It is already written, so it saves time.",
      re: /(?=.*\b(already|someone|others?|pre-?written|written\s+(for|by))\b)(?=.*\b(time|quick\w*|faster|less\s+(code|work|typing)|shorter)\b)/i,
      wrong: ["It makes the computer use less memory.", "Then the program needs no testing.", "It lets you leave out the DECLARE lines."],
      working: ["Who wrote the lines inside " + f + "?", "What does that save you?"], note: f + " is already written, so you save the time of writing it." };
  }
  function errorGen() {
    var f = pick(FNS);
    return { prompt: "Why is " + f + " less likely to have errors than code you write today? Pick the reason, then type it.",
      answer: "Many programmers have already tested it.",
      re: /(?=.*\btest\w*|\bused\b)(?=.*\b(already|other|many|lots|before|someone|people|programmers?)\b)/i,
      wrong: ["It is written using only capital letters.", "The computer checks each of its lines for you.", "It is shorter than any code you could write."],
      working: ["How long has " + f + " been around?", "What have other programmers done with it?"], note: "Many programmers have already used and tested it, so its errors are found and fixed." };
  }
  function insideGen() {
    var f = pick(FNS);
    return { prompt: "Do you need to know the lines inside " + f + " to use it? Pick the answer, then type it.",
      answer: "No, only what goes in and what comes out.",
      re: /^\s*(no|nope)\b|only\s+(what|the\s+values?)/i,
      wrong: ["Yes, you must copy every line of it first.", "Yes, or the program will not run at all.", "Only when the program has an INPUT line."],
      working: ["Think about how you used " + f + " today.", "What did you need to know: the lines inside, or the values in and out?"], note: "You only need to know what goes in and what comes back." };
  }
}
function plenaryCards() {
  return [
    why("pl-what", "pl-lib", whatGen), why("pl-time", "pl-lib", timeGen), why("pl-errors", "pl-lib", errorGen), why("pl-inside", "pl-lib", insideGen),
    card("pl-line", "pl-find", lineGen), card("pl-name", "pl-find", nameGen), card("pl-notlib", "pl-find", notLibGen),
    card("pl-mod", "pl-out", function () { return pick([modGen, divGen, minutesGen])(); }),
    card("pl-round", "pl-out", function () { return pick([roundGen, averageGen])(); }),
    card("pl-text", "pl-out", textGen), card("pl-two", "pl-out", function () { return pick([evenOddGen, halfGen])(); }),
    card("pl-rand", "pl-use", randGen), card("pl-choose", "pl-use", chooseGen), card("pl-gap", "pl-use", gapGen)
  ];
}

// Activity 2: write the program (code cards run against the reference with new typed values every time).
function codeCards() {
  var WORDS = ["Bangkok", "Phuket", "Hat Yai", "Songkhla", "Chiang Mai", "Krabi", "laptop", "printer", "keyboard", "monitor", "Pattani", "Trang"];
  var NAMES = ["Mai", "sam", "Ploy", "ben", "Nok", "leo", "Fah", "kai"];
  var PASSWORDS = ["cat2024", "sunshine", "pass", "Bangkok99", "hatyai", "tiger12345", "abc", "letmein", "football"];
  function r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function one(list) { return function () { return [drillPick(list)]; }; }
  return [
    { id: "c-upper", category: "c-text", prompt: "A name is typed in. Declare Name (STRING) and input it. Output the name in capital letters.",
      inputs: one(NAMES), setup: {}, reference: "DECLARE Name : STRING\nINPUT Name\nOUTPUT UCASE(Name)", checkVars: [], checkOutput: true },
    { id: "c-length", category: "c-text", prompt: "A word is typed in. Declare Word (STRING) and input it. Output how many characters it has.",
      inputs: one(WORDS), setup: {}, reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT LENGTH(Word)", checkVars: [], checkOutput: true },
    { id: "c-hours", category: "c-divmod", prompt: "A number of minutes is typed in. Declare Minutes (INTEGER) and input it. Output the whole hours (use DIV), then output the minutes left over (use MOD).",
      inputs: function () { return [String(r(61, 299))]; }, setup: {}, reference: "DECLARE Minutes : INTEGER\nINPUT Minutes\nOUTPUT DIV(Minutes, 60)\nOUTPUT MOD(Minutes, 60)", checkVars: [], checkOutput: true },
    { id: "c-bags", category: "c-divmod", prompt: "Sweets go into bags of 6. Declare Sweets (INTEGER) and input it. Output how many full bags there are, then output how many sweets are left over.",
      inputs: function () { return [String(r(13, 95))]; }, setup: {}, reference: "DECLARE Sweets : INTEGER\nINPUT Sweets\nOUTPUT DIV(Sweets, 6)\nOUTPUT MOD(Sweets, 6)", checkVars: [], checkOutput: true },
    { id: "c-average", category: "c-round", prompt: "Three scores are typed in. Declare Score1, Score2 and Score3 (INTEGER) and input them. Output their average, rounded to 1 decimal place. Output it straight away: do not store it.",
      inputs: function () { return [String(r(2, 20)), String(r(2, 20)), String(r(2, 20))]; }, setup: {},
      reference: "DECLARE Score1 : INTEGER\nDECLARE Score2 : INTEGER\nDECLARE Score3 : INTEGER\nINPUT Score1\nINPUT Score2\nINPUT Score3\nOUTPUT ROUND((Score1 + Score2 + Score3) / 3, 1)", checkVars: [], checkOutput: true },
    { id: "c-share", category: "c-round", prompt: "A bill in baht is typed in. Three friends share it. Declare Bill (INTEGER) and input it. Output each friend's share, rounded to 2 decimal places.",
      inputs: function () { return [String(r(100, 999))]; }, setup: {}, reference: "DECLARE Bill : INTEGER\nINPUT Bill\nOUTPUT ROUND(Bill / 3, 2)", checkVars: [], checkOutput: true },
    { id: "c-evenodd", category: "c-mix", prompt: "A number is typed in. Declare Number (INTEGER) and input it. If the remainder after dividing it by 2 is 0, output \"Even\". Otherwise output \"Odd\".",
      inputs: function () { return [String(r(1, 99))]; }, setup: {}, reference: "DECLARE Number : INTEGER\nINPUT Number\nIF MOD(Number, 2) = 0 THEN\n  OUTPUT \"Even\"\nELSE\n  OUTPUT \"Odd\"\nENDIF", checkVars: [], checkOutput: true },
    { id: "c-password", category: "c-mix", prompt: "A password is typed in. Declare Password (STRING) and input it. If it has fewer than 8 characters, output \"Too short\". Otherwise output the password in capital letters.",
      inputs: one(PASSWORDS), setup: {}, reference: "DECLARE Password : STRING\nINPUT Password\nIF LENGTH(Password) < 8 THEN\n  OUTPUT \"Too short\"\nELSE\n  OUTPUT UCASE(Password)\nENDIF", checkVars: [], checkOutput: true }
  ];
}

const B = 'tools/build_y8_2_1.mjs';
writeDrill({ id: 'y8-2-1-predict', builder: B, header: 'Year 8, 2.1 Libraries and Library Functions. Activity 1: predict the output of programs that call library functions.',
  title: 'Year 8, 2.1: Predict the Output', subtitle: 'Library functions: MOD, DIV, ROUND, LENGTH, UCASE',
  cats: [['a-one', 'One Library Function'], ['a-input', 'With INPUT'], ['a-two', 'Two Library Functions'], ['a-find', 'Find the Library Function']],
  parts: [body(drillKit), body(libGens)], cardsFn: predictCards });
writeDrill({ id: 'y8-2-1-code', builder: B, codeDrill: true, header: 'Year 8, 2.1 Libraries and Library Functions. Activity 2: write programs that call library functions; new values are typed in on every run.',
  title: 'Year 8, 2.1: Use a Library Function', subtitle: 'Write programs that call MOD, DIV, ROUND, LENGTH and UCASE',
  cats: [['c-text', 'LENGTH and UCASE'], ['c-divmod', 'DIV and MOD'], ['c-round', 'ROUND'], ['c-mix', 'Put Them Together']],
  parts: [], cardsFn: codeCards });
writeDrill({ id: 'y8-2-1-libraries', builder: B, header: 'Year 8, 2.1 Libraries and Library Functions. Plenary: what a library is and why it is used, finding, predicting and choosing library functions.',
  title: 'Year 8, 2.1: Libraries and Library Functions', subtitle: 'Programming, Logic and Testing',
  cats: [['pl-lib', 'What a Library Is'], ['pl-find', 'Find the Library Function'], ['pl-out', 'Predict the Output'], ['pl-use', 'Choose and Use']],
  parts: [body(drillKit), body(libGens), body(plenaryWhy)], cardsFn: plenaryCards, typedNoExample: ['pl-what', 'pl-time', 'pl-errors', 'pl-inside'] });

registerY8Unit2(ID);
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
