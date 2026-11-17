// Builds LessonData/y7-2-2-input-output.json: Year 7, 2.2 Input and Output (7P.02: develop text-based programs that
// accept input from a user and produce appropriate output), its plenary drill Drills/data/y7-2-2-input-output.js,
// and registers the lesson after 2.1 in the Year 7 unit "Text-based Programming" (tools/y7_text_kit.mjs).
//   node tools/build_y7_2_2.mjs
// Python, as in 2.1. The WHY of the lesson: input() always gives a String, so a number needs int() or float() before
// it can be used as a number, and + needs str() to join a number to text. Activities are Python Lab (PyLab/): io
// part 1, io part 2, fix and iowrite. The Do Now Extension reuses the 2.1 plenary drill. Every program on a slide is
// run in Python (Skulpt) here, and every check's answer comes from that run.
import { ROOT, assert, py, tps, facts, columns, paneTitle, note, hl, code, typedIn, screen, table, lessonKit, num, outRe, TYPE_RE, checkLesson, writeDrill, register, writeLesson } from './y7_text_kit.mjs';

const ID = 'y7-2-2-input-output';
const P = 'y722';
const { validators, checkStep, embed, lab, mcStep, selfMarked } = lessonKit(P);
// A multiple-choice step with its program on the left and the question on the right, so it fits without scrolling.
let SIDE;
function sideBySide(st, left) {
  const box = `<div id="${st.containerId}"></div>`;
  assert(st.content.endsWith(left + box), 'sideBySide ' + st.id);
  st.content = st.content.slice(0, -(left + box).length) + columns(left, box);
}

const FN = {
  int: '^\\s*(int(\\s*\\(\\s*\\))?|integer)\\s*\\.?\\s*$',
  float: '^\\s*(float(\\s*\\(\\s*\\))?|real)\\s*\\.?\\s*$',
  none: '^\\s*(none|nothing|no\\s+function|neither|no(ne)?\\s+of\\s+them|(just\\s+)?input(\\s*\\(\\s*\\))?(\\s+(only|alone))?)\\s*\\.?\\s*$',
};
const ERR = '^\\s*(it\\s+)?(an?\\s+)?(stops(\\s+with\\s+an\\s+error)?|crash(es)?|error|value\\s*error|an\\s+error)\\s*\\.?\\s*$';

const TPS = {
  'do-now': ['How can you tell a value\'s data type just by looking at it? Try it with "Mia".', 'Look at what is in the value. "Mia" has quote marks and letters: it is text, so it is a String.'],
  'do-now-2': ['Why does Python run the lines of a program from the top?', 'Each line can use what the lines above it stored. The order is part of the program.'],
  'exam-io': ['Why do exam papers use their own words, not Python?', 'Students learn many different programming languages. Pseudocode is one way of writing programs that every student can read.'],
  'exam-types': ['What data type fits the price of a drink, like 1.25? Why?', 'A Real, because a price can have a decimal point.'],
  'exam-ipo': ['Think of the program that asks your age and shows the year you were born. Which part is the input? Which is the output? Which part works something out?', 'Input: the age you type in. Process: working out the year. Output: the year shown on the screen.'],
  'title': ['A quiz app asks your name and then says hello to you. How does the program know your name? Why can it not know it before you type?', 'You type it, and the program stores it. It only knows what you give it. Today we learn how.'],
  'anim-print': ['Before you watch: why might some words in a program have quote marks, and some not?', 'Make a guess with your partner. Then watch to check.'],
  'explain-print': ['Where have you seen a program show your own name on the screen?', 'A game shows your player name. A website says Welcome and your name. Each user sees a different name.'],
  'anim-input': ['Before you watch: how could a program know your age before you tell it?', 'It cannot. Guess how it gets your age from you, then watch to check.'],
  'explain-input': ['A user types their phone number into a program. Will the program ever add 1 to it? Why?', 'No. A phone number is a label, not an amount. Nobody does maths with it.'],
  'input-check': ['Why does the order of the input() lines matter?', 'The first thing typed goes into the first input(), the second into the second. Swap the lines and the values swap too.'],
  'activity-1': ['Why does the question inside input() not show when you print the variable?', 'The question is only shown to the user. The variable stores only what the user typed.'],
  'compare-input': ['What two things do you need to know before you can say what + does?', 'The data type of the value on each side of +. Then use what + does with that data type.'],
  'anim-convert': ['Before you watch: "3" and 3 look almost the same. Why might Python treat them differently?', 'Make a guess with your partner. Then watch to check.'],
  'explain-convert': ['Where else must you change something into a different form before you can use it?', 'Money into a different currency before you spend it abroad. Frozen food thawed before you cook it.'],
  'convert-check': ['What two questions help you choose for each value?', 'First: will the program do maths with it? Then: can it have a decimal point?'],
  'compare-error': ['Both programs do age + 1. How can one of them work and not the other?', 'Talk in pairs about the data type of age in each program. Then choose your answer.'],
  'pyscratch-1': ['Why does the error only come on the last line, and not on the line with input()?', 'input() works and stores what was typed. The problem only shows when the program tries to use it as a number.'],
  'pyscratch-2': ['Why does the check type in three different names and ages?', 'A program can work for one input by luck. Different inputs show it works every time.'],
  'pyscratch-3': ['Why might a user type a number with a decimal point here?', 'Distances are not always whole numbers. The program must work for 2.5 as well as 3.'],
  'anim-join': ['Before you watch: what might + do with one String and one number?', 'Make a guess with your partner. Then watch to check.'],
  'explain-join': ['Why do programs show words next to a number, like "Score: 7"?', 'The words tell the user what the number means. 7 alone could mean anything.'],
  'activity-2': ['What do you check first in a line with +?', 'The data types on each side. Two numbers add. Two Strings join. A String and a number stop the program.'],
  'activity-3': ['Why is a program tested with more than one input?', 'A program can work for one input by luck. Different inputs show whether it works every time.'],
  'explain': ['What makes an explanation worth 2 marks?', 'Two connected points: why it goes wrong, and what fixes it, joined with "so" or "because".'],
  'activity-4': ['Where do you start when you write a program from a task?', 'Read the sample. Find what the user types (input), what is worked out, and what is shown (output).'],
  'practice': ['Why does the data type of each input matter later in the program?', 'Later lines do maths or join text with it. The data type decides whether that works.'],
  'plenary': ['Why practise with new values every time?', 'If you can do it with any values, you really understand it.'],
};

const steps = [];

// Teaching animations (James, 2026-11-16, docs/lessons.md 2b): each idea is a 2D animation in the pages app PyIOAnim/
// (registry py-io-anim, one scene each), predicted first and then played, followed straight away by an own-words
// Explain It marked by Haiku. Every program a scene runs is run in Python here.
const ANIMS = {};
function anim(id, label, scene) {
  ANIMS[id] = scene;
  return { id, label, type: 'embedded-app', appId: 'py-io-anim', embedQuery: 'scene=' + scene, embedContainerId: `${P}-${id}`,
    // The app itself says what to do (predict, then Play or Next), so the slide has no lead line and nothing scrolls.
    content: `<h2 class="lesson-h2">${label}</h2>` + `<div id="${P}-${id}"></div>` };
}
function explain(id, label, about, part) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` +
      '<p class="lesson-lead">Explain it in your own words. Press <strong>Check my answer</strong> to have it marked.</p>' + `<div id="${cid}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part)] };
}

// ---------------------------------------------------------------- Do Now 1 (2.1): a real exam question, marked by Haiku
// Cambridge IGCSE 0478/21, June 2024, Question 3, with its mark scheme. Haiku marks every check (aiModel).
{
  const Q = 'State what is meant by the data types integer and real. Give an example of each.';
  const G = 'One mark for a correct statement about each data type (points 1 and 3). One mark for a correct example of data for each data type (points 2 and 4). Mark scheme example answer: Integer: a whole number [1], Example 27 [1]. Real: a number that contains a fractional part [1], Example 18.75 [1]. Each mark is independent. Accept int for integer and float for real. Simple, plain wording is fine.';
  const WT = { title: 'Walk me through it: what a data type means', steps: [
    { text: 'A similar question: state what is meant by the data type String. Give an example.', visual: note('String: ' + hl('?') + '<br>Example: ' + hl('?')) },
    { text: 'First, think of some values that have this data type.', visual: code('pet = "Rex"\ncity = "Bangkok"\ncode = "B12"') },
    { text: 'Ask: what do all these values have in common? They are text, in quote marks.', visual: code('pet = "Rex"\ncity = "Bangkok"\ncode = "B12"', [1, 2, 3]) + note('They are all ' + hl('text')) },
    { text: 'Write what it means in a few words.', visual: note('String: ' + hl('text: letters, digits or symbols')) },
    { text: 'Then give one value of that data type as the example.', visual: note('Example: ' + hl('"Rex"')) },
    { text: 'Now do the same for integer, then for real: think of values, find what they share, then give one example.', visual: note('Two marks each: what it means, then an example.') },
  ] };
  steps.push(selfMarked('do-now', 'Do Now: Data Types (Exam Question)', 'Do Now: Data Types',
    '', [
      { id: 'dn-int-real', prompt: 'From 2.1. Cambridge IGCSE 0478/21, June 2024, Question 3.<br><strong>' + Q + '</strong>', marks: 4, aiModel: 'haiku', context: Q,
        scheme: ['Integer: a whole number / a number with no fractional part', 'A correct example of an integer, such as 27', 'Real: a number that contains a fractional part / a decimal point', 'A correct example of a real, such as 18.75'], guidance: G,
        modelAnswer: 'Integer: a whole number, such as 27. Real: a number with a decimal point, such as 18.75.' },
    ]));
  steps.at(-1).walkthrough = WT;
}

// ---------------------------------------------------------------- Do Now 2 (2.1): follow the variables
{
  const C = 'points = 4\npoints = points * 3\nbonus = points / 2\nprint(points)';
  const r = await py(C + '\nprint(type(bonus).__name__)\nprint(type(points).__name__)\nprint(bonus)');
  assert(r.out.join() === '12,float,int,6.0', 'do-now ' + r.out);
  const W = 'coins = 5\ncoins = coins + 4\nhalf = coins - 1\nprint(coins)';
  const w = await py(W + '\nprint(type(half).__name__)');
  assert(w.out.join() === '9,int', 'walkthrough 1');
  const WT = { title: 'Walk me through it: follow the variables', steps: [
    { text: 'This is a different program with the same kinds of question.', visual: code(W) },
    { text: 'Line 1 stores 5 in coins.', visual: code(W, [1]) + note('coins: ' + hl('5')) },
    { text: 'Line 2 works out the right side first: 5 + 4 = 9. Then it stores 9 back in coins.', visual: code(W, [2]) + note('coins: ' + hl('9')) },
    { text: 'Line 3 works out coins - 1 = 8 and stores it in half. coins does not change.', visual: code(W, [3]) + note('half: ' + hl('8')) },
    { text: 'Line 4 prints coins: 9.', visual: code(W, [4]) + note('It prints ' + hl('9')) },
    { text: 'Data type of half: no quote marks, and - with whole numbers gives a whole number. It is an Integer.', visual: code(W, [3]) + note('half: ' + hl('Integer')) },
    { text: 'Now do the same with your program: write down each value as you go.', visual: code(W) },
  ] };
  steps.push(checkStep('do-now-2', 'Do Now: Follow the Variables', 'Do Now: Follow the Variables', 'From 2.1. Follow the program one line at a time.', [
    { label: 'What does the program print?', answer: num(r.out[0]), feedback: 'points starts at 4. Write down its value after each line.' },
    { line: true, label: 'What data type is bonus?', answer: TYPE_RE.float, feedback: 'Look at the sign the line uses to work out bonus.' },
    { label: 'What value does bonus hold?', answer: num(r.out[3]), feedback: 'Work out points / 2 with the value points holds. How does Python show the answer of /?' },
  ], code(C)));
  steps.at(-1).walkthrough = WT;
}

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-2-1-variables', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

steps.push({ id: 'title', label: '2.2: Input and Output',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Text-based Programming</p><h2 class="lesson-h2">2.2: Input and Output</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> write programs that ask the user, and show an answer.', '<strong>The big question:</strong> why can the number a user types not be added up straight away?']) });

// ---------------------------------------------------------------- output: print (PyIOAnim scene=print)
{
  const C = 'name = "Mia"\nprint("Hi")\nprint(name)\nprint("name")';
  assert((await py(C)).out.join('|') === 'Hi|Mia|name', 'anim-print');
  steps.push(anim('anim-print', 'Watch: print Shows Output', 'print'));
  steps.push(explain('explain-print', 'Explain It: Quote Marks or Not',
    'The animation ran name = "Mia", print("Hi"), print(name) and print("name"). Line 1 stored "Mia" in the variable name. print("Hi") showed Hi, without the quote marks. print(name) has no quote marks, so Python looked in the variable and showed Mia. print("name") showed the word name.',
    { prompt: 'In your own words, explain why print(name) shows Mia, but print("name") shows name.', marks: 2,
      scheme: ['Without quote marks, name is a variable, so print shows the value it holds (Mia)', 'With quote marks, "name" is text / a String, so print shows it exactly as written'],
      guidance: 'One mark for each point, in the student\'s own words. "It has quote marks" alone earns nothing.',
      modelAnswer: 'name is a variable, so print shows what it holds: Mia. "name" in quote marks is text, so it is shown as written.' }));
}

// ---------------------------------------------------------------- input (PyIOAnim scene=input)
{
  const C = 'age = input("Age? ")\nprint(age)\nprint(type(age).__name__)';
  assert((await py(C, ['12'])).out.join('|') === '12|str', 'anim-input');
  steps.push(anim('anim-input', 'Watch: input Gets What the User Types', 'input'));
  steps.push(explain('explain-input', 'Explain It: What input Gives',
    'The animation ran age = input("Age? ") and print(age). input() showed the question Age? on the screen and waited. The user typed 12 and pressed Enter. What was typed went into the variable age as the String "12": input() always gives a String, even when the user types digits. print(age) showed 12.',
    { prompt: 'The user types 12 into age = input("Age? "). In your own words, explain what data type age holds, and why.', marks: 2,
      scheme: ['age holds a String / text, not a number', 'input() always gives a String / text, even for digits'],
      guidance: 'One mark for each point, in the student\'s own words. "It holds 12" alone earns nothing.',
      modelAnswer: 'A String. input() always gives a String, even when the user types digits.' }));
}

{
  const C = 'food = input("Food? ")\ndrink = input("Drink? ")\nprint(drink + " and " + food)';
  const a = (await py(C, ['rice', 'tea'])).out[0], b = (await py(C, ['soup', 'milk'])).out[0];
  assert(a === 'tea and rice' && b === 'milk and soup', 'input-check');
  steps.push(checkStep('input-check', 'Your Turn: What Does It Print?', 'Your Turn: What Does It Print?', 'Follow the program. The first thing typed goes into the first input().', [
    { line: true, label: 'The user types <strong>rice</strong> then <strong>tea</strong>. What does it print?', answer: outRe(a), feedback: 'Which variable holds the first thing typed? Then follow the print line from left to right.' },
    { line: true, label: 'Which variable holds <strong>rice</strong>?', answer: '^\\s*(the\\s+variable\\s+)?food\\s*$', feedback: 'rice is typed first. Which input() line runs first?' },
    { line: true, label: 'The user types <strong>soup</strong> then <strong>milk</strong>. What does it print?', answer: outRe(b), feedback: 'Put the new words into the two variables, then follow the print line again.' },
  ], code(C)));
}

// ---------------------------------------------------------------- exam question: INPUT and OUTPUT
// Cambridge IGCSE 0478/23, November 2023, Question 3(a): two of its four rows (the other two are about files, not
// taught in Year 7). Typed instead of drawing lines; the Python next to each keyword is shown on the slide.
steps.push(checkStep('exam-io', 'Exam Question: INPUT and OUTPUT', 'Exam Question: INPUT and OUTPUT',
  'Cambridge IGCSE 0478/23, November 2023, Question 3(a), two of its four rows.', [
    { line: true, label: '<strong>displays data on a screen</strong>', answer: '^\\s*(output|print(\\s*\\(\\s*\\))?)\\s*\\.?\\s*$', feedback: 'Which one shows something to the user? Type the exam keyword.' },
    { line: true, label: '<strong>enters data from a keyboard</strong>', answer: '^\\s*(input(\\s*\\(\\s*\\))?)\\s*\\.?\\s*$', feedback: 'Which one waits for the user to type? Type the exam keyword.' },
  ], '<p style="margin:0 0 8px">Exam papers write programs in <strong>pseudocode</strong>. Write the pseudocode keyword for each description.</p>' + table(['Pseudocode keyword', 'In Python'], [['OUTPUT', 'print()'], ['INPUT', 'input()']])));

steps.push(lab('activity-1', 'Activity 1: Predict with Input', 'Activity 1: Predict with Input',
  'Type what each program prints, from what the user types. Then run it in Python. A round with a mistake does not count.', 'activity=io&part=1'));

// ---------------------------------------------------------------- input gives a String
{
  const A = 'a = input("Number? ")\nb = input("Number? ")\nprint(a + b)', B = 'a = int(input("Number? "))\nb = int(input("Number? "))\nprint(a + b)';
  assert((await py(A, ['4', '5'])).out[0] === '45' && (await py(B, ['4', '5'])).out[0] === '9', 'compare-input');
  steps.push(mcStep('compare-input', 'Predict: Adding What the User Types', 'Predict: Adding What the User Types', 'The user types <strong>4</strong> then <strong>5</strong>.', [
    { prompt: 'What does this program print?', options: ['45', '9', '4 5', 'Nothing: it stops'], correct: 0,
      explain: 'input() gives the String "4" and the String "5", so + joins them: 45. The next slide shows how to make + add them.' },
  ], SIDE = code(A)));
  sideBySide(steps.at(-1), SIDE);
}

// ---------------------------------------------------------------- int(), float() and str() (PyIOAnim scene=convert)
{
  assert((await py('print("3" + 1)')).error && (await py('print(int("3") + 1)')).out[0] === '4' && (await py('print(float("2.5"))')).out[0] === '2.5' &&
    (await py('print(int("2.5"))')).error && (await py('print(str(12) + "3")')).out[0] === '123', 'anim-convert');
  steps.push(anim('anim-convert', 'Watch: int(), float() and str()', 'convert'));
  steps.push(explain('explain-convert', 'Explain It: Why int()?',
    'The animation ran print("3" + 1): "3" is a String and 1 is an Integer, and the program stopped with an error. Then int() turned the String "3" into the Integer 3, so print(int("3") + 1) showed 4. float("2.5") gave the Real 2.5; int("2.5") stopped with an error; str(12) gave the String "12".',
    { prompt: 'In your own words, explain why print("3" + 1) stops with an error, but print(int("3") + 1) shows 4.', marks: 2,
      scheme: ['"3" is a String / text, and + cannot add a String and a number', 'int() turns "3" into the Integer / number 3, so + adds 3 + 1'],
      guidance: 'One mark for each point, in the student\'s own words. "It is wrong" earns nothing.',
      modelAnswer: '"3" is a String, so + cannot add 1 to it. int() makes it the number 3, so 3 + 1 = 4.' }));
}

steps.push(checkStep('convert-check', 'Your Turn: Which Function?', 'Your Turn: Which Function?', 'The program asks the user for each value. Type <strong>int</strong>, <strong>float</strong> or <strong>none</strong> for what goes round input().', [
  { line: true, label: 'The user\'s age in years', answer: FN.int, feedback: 'Can the value have a decimal point? Will the program do maths with it?' },
  { line: true, label: 'The price of a drink, like 1.25', answer: FN.float, feedback: 'Can the value have a decimal point?' },
  { line: true, label: 'The user\'s name', answer: FN.none, feedback: 'Is it a number at all? Does it need to be turned into a number?' },
  { line: true, label: 'The number of pets the user has', answer: FN.int, feedback: 'Can you have half a pet? Will the program count or add them?' },
]));

// ---------------------------------------------------------------- exam question: which data type
// Cambridge IGCSE 0478/21, June 2026, Question 3: two of its three rows (the third, TRUE, is a Boolean, not taught).
steps.push(checkStep('exam-types', 'Exam Question: Which Data Type?', 'Exam Question: Which Data Type?',
  'Cambridge IGCSE 0478/21, June 2026, Question 3, two of its three rows. Complete the table by writing the most appropriate data type for each variable described.', [
    { line: true, label: 'Data type for <strong>Age</strong>', answer: TYPE_RE.int, feedback: 'Will the program do maths with an age? Can an age in years have a decimal point?' },
    { line: true, label: 'Data type for <strong>TelephoneNumber</strong>', answer: TYPE_RE.str, feedback: 'Look at the + and the space in the example data. Will the program ever do maths with a phone number?' },
  ], table(['variable', 'description', 'example data'], [['Age', 'the age of the student', '16'], ['TelephoneNumber', 'the telephone number of the student', '+44 7846398573']])));

{
  const A = 'age = input("Age? ")\nprint(age + 1)', B = 'age = int(input("Age? "))\nprint(age + 1)';
  assert((await py(A, ['12'])).error && (await py(B, ['12'])).out[0] === '13', 'compare-error');
  steps.push(mcStep('compare-error', 'Compare: age + 1', 'Compare: age + 1', 'The user types <strong>12</strong> into each program.', [
    { prompt: 'What happens in each program, and why?', options: ['A stops with an error and B prints 13: A adds 1 to a String', 'A prints 121 and B prints 13: A joins the 1 to the 12',
      'A prints 13 and B prints 13: Python can see the digits', 'A prints 13 and B stops with an error: int() cannot read 12'], correct: 0,
      explain: 'In A, age is the String "12". Python cannot add the number 1 to a String, so it stops with an error. In B, int() makes age the Integer 12, so age + 1 is 13.' },
  ], SIDE = paneTitle('Program A') + code(A) + paneTitle('Program B') + code(B)));
  sideBySide(steps.at(-1), SIDE);
}

// ---------------------------------------------------------------- str() in output (PyIOAnim scene=join)
{
  const C = 'age = 12\nprint("Age: " + str(age))\nprint("Age:", age)';
  assert((await py(C)).out.join('|') === 'Age: 12|Age: 12' && (await py('age = 12\nprint("Age: " + age)')).error, 'anim-join');
  steps.push(anim('anim-join', 'Watch: Text and a Number in One Output', 'join'));
  steps.push(explain('explain-join', 'Explain It: Why str()?',
    'The animation ran age = 12 and print("Age: " + age): + was given the String "Age: " and the Integer 12, and the program stopped with an error. Then str(age) turned 12 into the String "12", so + joined two Strings and showed Age: 12. A comma, print("Age:", age), also showed Age: 12.',
    { prompt: 'age holds 12. In your own words, explain why print("Age: " + age) stops with an error, and how str() fixes it.', marks: 2,
      scheme: ['+ cannot join a String and an Integer / a number', 'str() turns 12 into the String "12", so + joins two Strings'],
      guidance: 'One mark for each point, in the student\'s own words. "Use str()" alone earns nothing: it must make the number text.',
      modelAnswer: '+ cannot join text and a number. str(age) makes 12 the String "12", so + joins them.' }));
}

// ---------------------------------------------------------------- PyScratch Tasks (pages PyScratchTask/tasks/y7-2-2.js)
// Python on a Scratch stage, checked by running it (the check types the input itself). They replace the Variables Lab 3D
// slide (James, 2026-11-11: the 3D labs are not great for this topic). Help fades from task 1 to 3.
const PST_LEAD = '<strong>What to do:</strong> write the Python in the box on the left. Click the green flag above the stage to run it. When it works, click <strong>Check my program</strong>.';
const pst = (id, task, n, what) => embed(id, `Activity: PyScratch Task ${n}`, 'pyscratch-task', `Activity: PyScratch Task ${n} of 3`,
  (n === 1 ? PST_LEAD + ' ' : '') + what, 'task=' + task);
steps.push(pst('pyscratch-1', 'y7-2-2-fix', 1, 'Task 1 of 3: fix one line.'));

steps.push(lab('activity-2', 'Activity 2: Numbers from Input', 'Activity 2: Numbers from Input',
  'Predict what each program prints, or choose "It stops with an error". Then run it. A round with a mistake does not count.', 'activity=io&part=2'));

steps.push(lab('activity-3', 'Activity 3: Fix the Program', 'Activity 3: Fix the Program',
  'Each program has a mistake with input or output. Fix it. Check tests it with inputs you cannot see: three checks for each task.', 'activity=fix'));

steps.push(selfMarked('explain', 'Explain: Why 34?', 'Explain: Why 34?',
  '<p class="lesson-lead">A program has <code>a = input()</code>, <code>b = input()</code> and <code>print(a + b)</code>. The user types 3 and 4. It prints 34.</p>', [
    { id: 'why-34', prompt: 'Explain why it prints 34, and how to make it print 7.', marks: 2, aiModel: 'haiku',
      context: 'A Python program has a = input(), b = input() and print(a + b). The user types 3 and 4. It prints 34. Explain why it prints 34, and how to make it print 7.',
      scheme: ['input() gives a String / text, so + joins "3" and "4"', 'Use int() round input() / int(input()), so a and b are Integers and + adds them'],
      guidance: 'Award 1 mark for each point. Accept "they are text" for String. Accept float() for the fix. Do not accept "it is wrong" or "use numbers" alone.',
      modelAnswer: 'input() gives a String, so + joins "3" and "4" (1 mark). Use int(input()) so a and b are Integers, and + adds them (1 mark).' },
  ]));

// ---------------------------------------------------------------- exam question: input, process and output
// Cambridge IGCSE 0478/22, June 2025, Question 2. Typed letters instead of drawing lines. The mark scheme's lines are
// drawn, not text: input is the height and length, process is the area calculated, output is the paint required.
{
  const D = ['the height of the fence<br>the length of the fence', 'The amount of paint required is 40 square metres.', 'the colour of the paint', 'The area of fence is calculated as 40 square metres.'];
  steps.push(checkStep('exam-ipo', 'Exam Question: Input, Process and Output', 'Exam Question: Input, Process and Output',
    'Cambridge IGCSE 0478/22, June 2025, Question 2. Type a letter instead of drawing a line.', [
      { line: true, label: '<strong>input</strong>: which description?', answer: '^\\s*\\(?\\s*A\\s*\\)?\\s*\\.?\\s*$', feedback: 'What must the program know before it can work out the area?' },
      { line: true, label: '<strong>process</strong>: which description?', answer: '^\\s*\\(?\\s*D\\s*\\)?\\s*\\.?\\s*$', feedback: 'Which one works something out?' },
      { line: true, label: '<strong>output</strong>: which description?', answer: '^\\s*\\(?\\s*B\\s*\\)?\\s*\\.?\\s*$', feedback: 'Which one is the result the user is told?' },
    ], '<p style="margin:0 0 8px">A fence measuring 2 metres in height and 20 metres in length needs painting. The area of the fence needs to be calculated so that enough paint for the job is purchased.</p>' +
      '<p style="margin:0 0 8px">After the task is decomposed (split into smaller parts), there are three component parts: input, process and output. Not all descriptions will be used.</p>' +
      table(['', 'Description'], D.map((d, i) => ['<strong>' + 'ABCD'[i] + '</strong>', d]))));
}

steps.push(lab('activity-4', 'Activity 4: Write the Program', 'Activity 4: Write the Program',
  'Write each program from its task. Check tests it with inputs you cannot see: three checks for each task.', 'activity=iowrite'));
steps.push(pst('pyscratch-2', 'y7-2-2-age', 2, 'Task 2 of 3: change a program that already works.'));
steps.push(pst('pyscratch-3', 'y7-2-2-metres', 3, 'Task 3 of 3: write the whole program yourself.'));

{
  const C = 'price = float(input("Price? "))\ncount = int(input("How many? "))\ntotal = price * count\nprint("Total: " + str(total))';
  const a = (await py(C, ['2.5', '4'])).out[0], b = (await py(C, ['3', '2'])).out[0], e = await py(C, ['2', '2.5']);
  assert(a === 'Total: 10.0' && b === 'Total: 6.0' && e.error, 'practice');
  steps.push(checkStep('practice', 'Practice: Input and Output', 'Practice: Input and Output', 'Use the program for every part.', [
    { line: true, label: 'The user types 2.5 then 4. What does it print?', answer: outRe(a), feedback: 'Work out total first. A Real times an Integer is a Real.' },
    { line: true, label: 'What data type is count?', answer: TYPE_RE.int, feedback: 'Look at the function round input() on line 2.' },
    { line: true, label: 'The user types 3 then 2. What does it print?', answer: outRe(b), feedback: 'float() turns 3 into a Real. How does Python show a Real?' },
    { line: true, label: 'The user types 2 then 2.5. What happens?', answer: ERR, feedback: 'Which function gets 2.5? Can it turn a decimal point into a whole number?' },
  ], code(C)));
}

steps.push(embed('plenary', 'Plenary: Input and Output', 'drill-y7-2-2-input-output', 'Plenary: Input and Output',
  'input(), print(), int(), float() and str(). Your progress is saved.'));

const WORKED = [];
for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`, WORKED.includes(st.id) ? 'Show the worked answer' : 'Show the answer'));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '') + tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now-2', 0, '12') && !V('do-now-2', 0, '4') && V('do-now-2', 1, 'Real') && V('do-now-2', 1, 'float') && !V('do-now-2', 1, 'Integer') && V('do-now-2', 2, '6.0') && !V('do-now-2', 2, '6'), 'do-now-2 marks');
assert(V('exam-io', 0, 'OUTPUT') && V('exam-io', 0, 'print()') && !V('exam-io', 0, 'INPUT') && V('exam-io', 1, 'input') && !V('exam-io', 1, 'OUTPUT'), 'exam-io marks');
assert(V('exam-types', 0, 'integer') && V('exam-types', 0, 'int') && !V('exam-types', 0, 'real') && V('exam-types', 1, 'string') && !V('exam-types', 1, 'integer'), 'exam-types marks');
assert(V('exam-ipo', 0, 'A') && V('exam-ipo', 0, '(a)') && !V('exam-ipo', 0, 'B') && V('exam-ipo', 1, 'D') && !V('exam-ipo', 1, 'B') && V('exam-ipo', 2, 'b') && !V('exam-ipo', 2, 'D'), 'exam-ipo marks');
assert(V('input-check', 0, 'tea and rice') && V('input-check', 0, '"tea and rice"') && !V('input-check', 0, 'rice and tea') && !V('input-check', 0, 'teaandrice') && V('input-check', 1, 'food') && !V('input-check', 1, 'drink') && V('input-check', 2, 'milk and soup'), 'input-check marks');
assert(V('convert-check', 0, 'int') && V('convert-check', 0, 'int()') && !V('convert-check', 0, 'float') && V('convert-check', 1, 'float') && V('convert-check', 1, 'float()') && !V('convert-check', 1, 'int') && V('convert-check', 2, 'none') && V('convert-check', 2, 'nothing') && !V('convert-check', 2, 'str') && !V('convert-check', 2, 'int') && V('convert-check', 3, 'int'), 'convert-check marks');
assert(V('practice', 0, 'Total: 10.0') && !V('practice', 0, 'Total: 10') && V('practice', 1, 'Integer') && V('practice', 2, 'Total: 6.0') && !V('practice', 2, 'Total: 6') && V('practice', 3, 'error') && V('practice', 3, 'It stops with an error') && V('practice', 3, 'it crashes') && !V('practice', 3, 'Total: 5.0'), 'practice marks');
checkLesson(steps, validators, {
  teach: [[/\binput\b/i, 'anim-input'], [/\boutputs?\b/i, 'anim-print'], [/\bint\(/, 'anim-convert'], [/\bfloat\(/, 'anim-convert'], [/\bstr\(/, 'anim-convert'], [/\berrors?\b/i, 'anim-convert']],
  walkLeaks: { 'do-now': /whole|fraction|decimal|\d\.\d|\b27\b/i, 'do-now-2': /\b12\b|\bReal\b|float|6\.0/i },
  cited: ['do-now', 'exam-io', 'exam-types', 'exam-ipo'],
});

// Every animation is followed straight away by its Haiku-marked Explain It.
Object.keys(ANIMS).forEach((id) => { const i = steps.findIndex((s) => s.id === id); const e = steps[i + 1]; assert(e && e.type === 'self-marked-response' && e.items.every((it) => it.aiModel === 'haiku' && it.scheme.length >= it.marks && it.context && it.modelAnswer), `${id} is followed by a Haiku Explain It`); });
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

writeLesson(ID, '2.2: Input and Output', steps, validators);

// ======================================================================== plenary drill
function plenaryCards() {
  function prog(lines) { return lines.join("\n"); }
  function pair() { return pick([["a", "b"], ["x", "y"], ["first", "second"], ["n1", "n2"], ["left", "right"]]); }
  function typedLine(list) { return "The user types " + list.join(" then ") + "."; }
  function ask(lines, list, q) { return q + " " + typedLine(list) + "\n" + prog(lines); }
  var ERR_RE = /^\s*(it\s+)?(an?\s+)?(stops(\s+with\s+an\s+error)?|crash(es)?|error|value\s*error|type\s*error)\s*\.?\s*$/i;
  function out(id, cat, gen) { return card(id, cat, gen); }
  // ---------------------------------------------------------------- print and input
  function helloGen() {
    var n = pick(NAMES), g = pick(["Hello", "Hi", "Welcome"]), lines = ["name = input(\"Name? \")", "print(\"" + g + " \" + name)"], ans = g + " " + n;
    return { prompt: ask(lines, [n], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [g + n, g + " name", "Name? " + n, g + " " + n + " Name?"]),
      steps: ["input() stores " + n + " in name.", "+ joins \"" + g + " \" and " + n + ". The space is inside the quote marks."], working: ["What does the variable name hold after line 1?", "+ joins two Strings exactly as they are."],
      note: "name holds " + n + ". \"" + g + " \" + name is " + ans + ".", py: { code: prog(lines), inputs: [n] } };
  }
  function commaGen() {
    var n = pick(NAMES), g = pick(["Hi", "Bye", "Well done"]), lines = ["name = input(\"Name? \")", "print(\"" + g + "\", name)"], ans = g + " " + n;
    return { prompt: ask(lines, [n], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [g + n, g + ", " + n, g + " name"]),
      steps: ["input() stores " + n + " in name.", "A comma in print shows both things with one space between."], working: ["What does name hold?", "What does a comma in print put between the two things?"],
      note: "The comma adds one space: " + ans + ".", py: { code: prog(lines), inputs: [n] } };
  }
  function orderGen() {
    var f = shuffled(FOODS), v = pick([["a", "b"], ["first", "second"], ["x", "y"], ["lunch", "snack"]]), q = pick(["Food? ", "Next? ", "Type a word: "]);
    var lines = [v[0] + " = input(\"" + q + "\")", v[1] + " = input(\"" + q + "\")", "print(" + v[1] + " + " + v[0] + ")"], ans = f[1] + f[0];
    return { prompt: ask(lines, [f[0], f[1]], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [f[0] + f[1], f[1] + " " + f[0], v[1] + v[0]]),
      steps: ["The first thing typed, " + f[0] + ", goes into " + v[0] + ". The second, " + f[1] + ", goes into " + v[1] + ".", "print(" + v[1] + " + " + v[0] + ") joins " + v[1] + " first, then " + v[0] + ", with no space."], working: ["Which variable gets the first thing typed?", "Look at the print line: which variable comes first?"],
      note: v[0] + " is " + f[0] + " and " + v[1] + " is " + f[1] + ". " + v[1] + " + " + v[0] + " is " + ans + ".", py: { code: prog(lines), inputs: [f[0], f[1]] } };
  }
  // ---------------------------------------------------------------- numbers from input
  function joinGen() {
    var a = rnd(2, 9), b = rnd(2, 9), v = pair(), lines = [v[0] + " = input(\"Number? \")", v[1] + " = input(\"Number? \")", "print(" + v[0] + " + " + v[1] + ")"], ans = a + "" + b;
    return { prompt: ask(lines, [a, b], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [a + b, a + " " + b, "Error", a + b + 1]),
      steps: ["input() always gives a String: \"" + a + "\" and \"" + b + "\".", "+ joins two Strings."], working: ["What data type does input() give?", "What does + do with that data type?"],
      note: "Both are Strings, so + joins them: " + ans + ".", py: { code: prog(lines), inputs: [String(a), String(b)] } };
  }
  function intGen() {
    var a = rnd(2, 30), b = rnd(2, 30), v = pair(), lines = [v[0] + " = int(input(\"Number? \"))", v[1] + " = int(input(\"Number? \"))", "print(" + v[0] + " + " + v[1] + ")"], ans = String(a + b);
    return { prompt: ask(lines, [a, b], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [a + "" + b, a + b + ".0", "Error", a + b + 1]),
      steps: ["int() turns each String into an Integer.", "+ adds Integers: " + a + " + " + b + "."], working: ["What does int() do to what the user types?", "What does + do with two Integers?"],
      note: "int() makes them Integers, so + adds: " + ans + ".", py: { code: prog(lines), inputs: [String(a), String(b)] } };
  }
  function floatGen() {
    var a = rnd(2, 9), m = rnd(2, 4), lines = ["n = float(input(\"Number? \"))", "print(n * " + m + ")"], ans = real(a * m);
    return { prompt: ask(lines, [a], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [String(a * m), String(a).repeat(m), "Error", ans + "0"]),
      steps: ["float() turns " + a + " into the Real " + a + ".0.", "A Real times an Integer is a Real, shown with a decimal point."], working: ["What data type does float() give?", "How does Python show a Real that is a whole number?"],
      note: a + ".0 * " + m + " = " + ans + ". A Real always shows a decimal point.", py: { code: prog(lines), inputs: [String(a)] } };
  }
  function strGen() {
    var a = rnd(10, 14), y = rnd(1, 5), lines = ["age = int(input(\"Age? \"))", "print(\"Soon: \" + str(age + " + y + "))"], ans = "Soon: " + (a + y);
    return { prompt: ask(lines, [a], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), ["Soon: " + a + y, "Soon: " + a, "Error", "Soon:" + (a + y)]),
      steps: ["int() makes age the Integer " + a + ".", "age + " + y + " is worked out first, then str() turns the answer into a String so + can join it."], working: ["Work out what is inside str() first.", "Then join it to the text. Is there a space inside the quote marks?"],
      note: a + " + " + y + " = " + (a + y) + ", then it is joined: " + ans + ".", py: { code: prog(lines), inputs: [String(a)] } };
  }
  // ---------------------------------------------------------------- errors and which function
  function errorGen() {
    var a = rnd(10, 14), d = dec(), kind = rnd(0, 4), lines, typed, ans, why, isErr = true;
    if (kind === 0) { lines = ["age = input(\"Age? \")", "print(age + 1)"]; typed = [a]; why = "age is a String. Python cannot add the number 1 to a String."; }
    else if (kind === 1) { lines = ["n = int(input(\"Number? \"))", "print(n * 2)"]; typed = [d]; why = "int() cannot turn a number with a decimal point into an Integer."; }
    else if (kind === 2) { lines = ["age = int(input(\"Age? \"))", "print(\"Age: \" + age)"]; typed = [a]; why = "+ cannot join a String and an Integer. It needs str(age)."; }
    else if (kind === 3) { isErr = false; lines = ["n = float(input(\"Number? \"))", "print(n + 1)"]; typed = [d]; ans = real(Number(d) + 1); why = "float() can read a decimal point, so it works."; }
    else { isErr = false; lines = ["age = int(input(\"Age? \"))", "print(age * 2)"]; typed = [a]; ans = String(a * 2); why = "int() turns " + a + " into an Integer, so it works."; }
    ans = isErr ? "It stops with an error" : ans;
    var re = isErr ? ERR_RE : outRe(ans);
    return { prompt: ask(lines, typed, "What does this program print? If it stops, type error."), answer: ans, re: re, wrong: uniq(ans, re, isErr ? (kind === 0 ? [a + 1, a + "1", "Age: " + a] : kind === 1 ? [real(Number(d) * 2), d + d, String(Math.round(Number(d) * 2))] : ["Age: " + a, "Age:" + a, "Age: " + (a + 1)]) : ["It stops with an error", ans + "0", typed[0] + "1", "Error"]).slice(0, 3),
      steps: ["Check the data type of each value at each line.", why], working: ["What data type does each variable hold after line 1?", "Can the second line do that with those data types?"],
      note: why, py: isErr ? { code: prog(lines), inputs: typed.map(String), error: true } : { code: prog(lines), inputs: typed.map(String) } };
  }
  function whichGen() {
    var k = pick([["the user's age in years", "int"], ["how many pets the user has", "int"], ["the number of goals scored", "int"], ["the price of a cake, like 2.75", "float"], ["the user's height in metres", "float"], ["the time for a race in seconds, like 12.4", "float"], ["the user's name", "none"], ["the user's favourite colour", "none"]]);
    var ans = k[1] === "none" ? "none" : k[1], re = k[1] === "int" ? /^\s*(int(\s*\(\s*\))?|integer)\s*\.?\s*$/i : k[1] === "float" ? /^\s*(float(\s*\(\s*\))?|real)\s*\.?\s*$/i : /^\s*(none|nothing|no\s+function|neither|(just\s+)?input(\s*\(\s*\))?)\s*\.?\s*$/i;
    return { prompt: "A program asks for " + k[0] + ". Which function goes round input(): int, float or none?", answer: ans, re: re, wrong: ans === "none" ? ["int", "float", "int and float"] : ["int", "float", "none", "str"].filter(function (x) { return x !== ans; }),
      steps: [k[1] === "none" ? "It is text, not a number. input() already gives a String." : k[1] === "int" ? "It is always a whole number." : "It can have a decimal point.", "So: " + ans + "."],
      working: ["Is it a number? If not, input() already gives the right data type.", "If it is a number, can it have a decimal point?"], format: "Type int, float or none",
      note: k[1] === "none" ? "Text stays a String, so no function is needed." : k[1] === "int" ? "A whole number: int()." : "It can have a decimal point: float()." };
  }
  return [
    out("pl-hello", "pl-io", helloGen), out("pl-comma", "pl-io", commaGen), out("pl-order", "pl-io", orderGen),
    out("pl-join", "pl-num", joinGen), out("pl-int", "pl-num", intGen), out("pl-float", "pl-num", floatGen), out("pl-str", "pl-num", strGen),
    out("pl-error-1", "pl-err", errorGen), out("pl-error-2", "pl-err", errorGen), out("pl-which-1", "pl-err", whichGen), out("pl-which-2", "pl-err", whichGen),
    why("pl-why-string", "pl-why", "The user types 4 and 5. Why does print(a + b) show 45 when a = input() and b = input()?", "input() gives Strings, so + joins them",
      /^(?=.*\b(strings?|text|str)\b)(?=.*\b(join\w*|stick\w*|put\s+together|next\s+to|side\s+by\s+side)\b).*$/i,
      ["input() gives Integers, so + adds them", "input() gives Reals, so + adds the decimals", "print() joins any two numbers it shows"],
      "A similar question: why does print(\"6\" + \"1\") show 61?\nThe quote marks make both Strings.\nAnswer: they are Strings, so + joins them.",
      ["What data type does input() always give?", "What does + do with that data type?"], "input() always gives a String, and + joins Strings: 4 then 5 is 45."),
    why("pl-why-int", "pl-why", "Why does a program use int(input()) to read an age?", "So the age is an Integer and maths works on it",
      /^(?=.*\b(integer|int|number|whole)\b)(?=.*\b(maths?|math|add\w*|calculat\w*|sums?|work\s+out|\+)\b).*$/i,
      ["So the age is a String and print shows it", "So the age is a Real with a decimal point", "So the user can type their name instead"],
      "A similar question: why does a program use float(input()) to read a price?\nA price can have a decimal point.\nAnswer: so the price is a Real and keeps its decimal part.",
      ["What data type does input() give?", "What will the program do with an age, like age + 1?"], "input() gives a String. int() turns it into an Integer, so age + 1 and other maths work."),
    why("pl-why-float", "pl-why", "Why use float(), not int(), to read a price like 2.75?", "A price has a decimal point, and int() stops with an error",
      /^(?=.*\b(decimal|point|\.75|fraction\w*)\b)(?=.*\b(error|stops?|crash\w*|cannot|can.?t|whole|lose|lost|int)\b).*$/i,
      ["A price is text, and float() keeps the quote marks", "A price is short, and float() is faster than int()", "A price is a name, and names need float()"],
      "A similar question: why use int() to read how many pets someone has?\nThe number of pets is always whole.\nAnswer: it is a whole number, so an Integer fits.",
      ["Look at 2.75. What is in it that a whole number does not have?", "What does int() do when it is given that?"], "2.75 has a decimal point. float() can read it; int() stops with an error."),
    why("pl-why-str", "pl-why", "Why does print(\"Age: \" + str(age)) need str() when age is an Integer?", "+ can only join Strings, so the number must be text",
      /^(?=.*\b(strings?|text|str)\b)(?=.*\b(join\w*|\+|error|stops?|only|cannot|can.?t)\b).*$/i,
      ["str() adds 1 to the age, so it is next year", "str() makes the age a Real with a decimal point", "str() asks the user to type the age again"],
      "A similar question: why does print(\"Score: \" + score) stop when score is 5?\n+ is joining text to a number.\nAnswer: + cannot join a String and an Integer.",
      ["What data type is \"Age: \"? What data type is age?", "What can + join?"], "+ joins only Strings. str(age) turns the Integer into text first."),
  ];
}
await writeDrill({ id: ID, builder: 'build_y7_2_2.mjs', about: 'Year 7, 2.2 Input and Output. Plenary: input() and print(), numbers from input, errors and which function, and why.',
  title: 'Year 7, 2.2: Input and Output', subtitle: 'input() and print() in Python',
  categories: [['pl-io', 'print and input'], ['pl-num', 'Numbers from Input'], ['pl-err', 'Errors and Which Function'], ['pl-why', 'Why?']], cards: plenaryCards });

console.log(`${ID}: ${steps.length} steps; Year 7 units: ${register(ID)}`);
