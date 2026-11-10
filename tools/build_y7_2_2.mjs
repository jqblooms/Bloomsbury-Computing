// Builds LessonData/y7-2-2-input-output.json: Year 7, 2.2 Input and Output (7P.02: develop text-based programs that
// accept input from a user and produce appropriate output), its plenary drill Drills/data/y7-2-2-input-output.js,
// and registers the lesson after 2.1 in the Year 7 unit "Text-based Programming" (tools/y7_text_kit.mjs).
//   node tools/build_y7_2_2.mjs
// Python, as in 2.1. The WHY of the lesson: input() always gives a String, so a number needs int() or float() before
// it can be used as a number, and + needs str() to join a number to text. Activities are Python Lab (PyLab/): io
// part 1, io part 2, fix and iowrite. The Do Now Extension reuses the 2.1 plenary drill. Every program on a slide is
// run in Python (Skulpt) here, and every check's answer comes from that run.
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT, assert, py, tps, facts, columns, paneTitle, note, hl, code, typedIn, screen, table, lessonKit, num, outRe, TYPE_RE, checkLesson, writeDrill, register, writeLesson } from './y7_text_kit.mjs';

const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-2-2-input-output';
const P = 'y722';
const { validators, checkStep, embed, lab, mcStep, selfMarked } = lessonKit(P);

// ---------------------------------------------------------------- flowcharts (as in build_y7_3_1.mjs)
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
function chart(flow, maxH = 300, hlBoxes = []) {
  let i = -1;
  const svg = FC.svg(flow, !!flow.numbered).replace(/<(rect|polygon) class="fc-[btd]"/g, (m) => { i++; return hlBoxes.includes(i) ? m + ' style="stroke:var(--warn);stroke-width:5;fill:rgba(253,214,99,.3)"' : m; });
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` + svg.replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
}
function choice(pre, question, tBoxes, fBoxes) {
  const nodes = [{ id: 's', type: 'terminal', text: 'Start' }], edges = [];
  let last = 's';
  pre.forEach((b, i) => { nodes.push({ id: 'p' + i, type: b[0], text: b[1] }); edges.push({ from: last, to: 'p' + i, label: null }); last = 'p' + i; });
  nodes.push({ id: 'd', type: 'decision', text: question }); edges.push({ from: last, to: 'd', label: null });
  const pathOf = (boxes, tag, label) => { let prev = 'd'; boxes.forEach((b, i) => { const id = tag + i; nodes.push({ id, type: b[0], text: b[1] }); edges.push({ from: prev, to: id, label: i ? null : label }); prev = id; }); edges.push({ from: prev, to: 'e', label: null }); };
  pathOf(tBoxes, 't', 'True');
  nodes.push({ id: 'e', type: 'terminal', text: 'End' });
  pathOf(fBoxes, 'f', 'False');
  return { nodes, edges, numbered: true };
}
const say = (w) => ['io', `Say "${w}"`];
const move = (n) => ['process', `Move ${n} steps`];
const word = (w) => `^\\s*["'\\u201c]?\\s*(say\\s*:?\\s*)?["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
const FN = {
  int: '^\\s*(int(\\s*\\(\\s*\\))?|integer)\\s*\\.?\\s*$',
  float: '^\\s*(float(\\s*\\(\\s*\\))?|real)\\s*\\.?\\s*$',
  none: '^\\s*(none|nothing|no\\s+function|neither|no(ne)?\\s+of\\s+them|(just\\s+)?input(\\s*\\(\\s*\\))?(\\s+(only|alone))?)\\s*\\.?\\s*$',
};
const ERR = '^\\s*(it\\s+)?(an?\\s+)?(stops(\\s+with\\s+an\\s+error)?|crash(es)?|error|value\\s*error|an\\s+error)\\s*\\.?\\s*$';

const TPS = {
  'do-now': ['Why does Python run the lines of a program from the top?', 'Each line can use what the lines above it stored. The order is part of the program.'],
  'do-now-2': ['Why does a key decision need someone to press a key?', 'The flowchart asks the user a question with the key. What happens next depends on what the user does.'],
  'title': ['A quiz app asks your name and then says hello to you. How does the program know your name? Why can it not know it before you type?', 'You type it, and the program stores it. It only knows what you give it. Today we learn how.'],
  'output': ['Predict: what does each line show? Why is there a space after the colon in the second one?', 'Hi Mia, then Score: 7. A comma in print shows both things with one space between them.'],
  'input': ['Predict: the user types Mia. What is on the screen at the end? Why store input() in a variable?', 'What is your name? Mia, then Hello Mia. The variable keeps what the user typed, so later lines can use it.'],
  'input-check': ['Why does the order of the input() lines matter?', 'The first thing typed goes into the first input(), the second into the second. Swap the lines and the values swap too.'],
  'activity-1': ['Why does the question inside input() not show when you print the variable?', 'The question is only shown to the user. The variable stores only what the user typed.'],
  'compare-input': ['Both programs read the same two numbers. How can they print different things?', 'Talk in pairs about what is different in the first two lines. Then choose your answer.'],
  'convert': ['Why does Python not turn what you type into a number by itself?', 'Python cannot tell what you mean. "0812345678" is a phone number, not an amount. You choose the data type.'],
  'convert-check': ['What two questions help you choose for each value?', 'First: will the program do maths with it? Then: can it have a decimal point?'],
  'compare-error': ['Both programs do age + 1. How can one of them work and not the other?', 'Talk in pairs about the data type of age in each program. Then choose your answer.'],
  'lab-3d': ['Why must the program say int() or str()? Why can Python not choose for you?', 'Python cannot tell what you mean. You choose the data type.'],
  'str-join': ['Predict: what do both print lines show? Why does the first need str()?', 'Both show Age: 12. + can only join two Strings, so str(age) turns 12 into "12" first. A comma does not need it.'],
  'activity-2': ['What do you check first in a line with +?', 'The data types on each side. Two numbers add. Two Strings join. A String and a number stop the program.'],
  'activity-3': ['Why is a program tested with more than one input?', 'A program can work for one input by luck. Different inputs show whether it works every time.'],
  'explain': ['What makes an explanation worth 2 marks?', 'Two connected points: why it goes wrong, and what fixes it, joined with "so" or "because".'],
  'activity-4': ['Where do you start when you write a program from a task?', 'Read the sample. Find what the user types (input), what is worked out, and what is shown (output).'],
  'practice': ['Why does the data type of each input matter later in the program?', 'Later lines do maths or join text with it. The data type decides whether that works.'],
  'plenary': ['Why practise with new values every time?', 'If you can do it with any values, you really understand it.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (2.1): variables and data types
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
  steps.push(checkStep('do-now', 'Do Now: Follow the Variables', 'Do Now: Follow the Variables', 'From 2.1. Follow the program one line at a time.', [
    { label: 'What does the program print?', answer: num(r.out[0]), feedback: 'points starts at 4. Write down its value after each line.' },
    { line: true, label: 'What data type is bonus?', answer: TYPE_RE.float, feedback: 'Look at the sign the line uses to work out bonus.' },
    { label: 'What value does bonus hold?', answer: num(r.out[3]), feedback: 'Work out points / 2 with the value points holds. How does Python show the answer of /?' },
  ], code(C)));
  steps.at(-1).walkthrough = WT;
}

// ---------------------------------------------------------------- Do Now 2 (3.1): a key decision
{
  const DN = choice([move(20)], 'Space pressed?', [say('Jump')], [say('Wait')]);
  const a = FC.run(DN, { presses: [1] }), b = FC.run(DN, { presses: [0] });
  assert(a.said.join() === 'Jump' && b.said.join() === 'Wait' && b.steps === 20, 'do-now 2');
  const W = choice([move(30)], 'Up arrow pressed?', [say('Hop')], [say('Stay')]);
  const wa = FC.run(W, { presses: [1] }), wb = FC.run(W, { presses: [0] });
  assert(wa.said.join() === 'Hop' && wb.said.join() === 'Stay' && wb.steps === 30, 'walkthrough 2');
  const WT = { title: 'Walk me through it: a key decision', steps: [
    { text: 'This is a different flowchart. We try it twice: the Up arrow pressed, then not pressed.', visual: chart(W, 280) },
    { text: 'Begin at <strong>Start</strong>. Box 2 moves 30 steps. It runs every time, before the decision.', visual: chart(W, 280, [1]) + note('Steps so far: ' + hl('30')) },
    { text: 'The Up arrow is pressed: the decision is <strong>True</strong>. Follow True to Say "Hop".', visual: chart(W, 280, [2, 3]) + note('Pressed: ' + hl('Hop')) },
    { text: 'The Up arrow is not pressed: the decision is <strong>False</strong>. Follow False to Say "Stay".', visual: chart(W, 280, [2, 5]) + note('Not pressed: ' + hl('Stay')) },
    { text: 'Say boxes do not move the sprite. Only box 2 moves it, so it moves 30 steps either way.', visual: chart(W, 280, [1]) + note('Altogether: ' + hl('30 steps')) },
    { text: 'Now do the same with your flowchart: run the boxes before the decision, then follow one arrow.', visual: chart(W, 280) },
  ] };
  steps.push(checkStep('do-now-2', 'Do Now: A Key Decision', 'Do Now: A Key Decision', 'From 3.1. Begin at Start.', [
    { label: 'Space is pressed. What does the sprite say?', answer: word('jump'), feedback: 'Pressed means True. Follow that arrow.' },
    { label: 'Space is not pressed. What does the sprite say?', answer: word('wait'), feedback: 'Not pressed means False. Follow that arrow.' },
    { label: 'Space is not pressed. How many steps does the sprite move?', answer: '^\\s*20\\s*(steps?)?\\s*$', feedback: 'Find every Move box on the path you follow. Do Say boxes move the sprite?' },
  ], chart(DN, 300)));
  steps.at(-1).walkthrough = WT;
}

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-2-1-variables', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

steps.push({ id: 'title', label: '2.2: Input and Output',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Text-based Programming</p><h2 class="lesson-h2">2.2: Input and Output</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> write programs that ask the user, and show an answer.', '<strong>The big question:</strong> why can the number a user types not be added up straight away?']) });

// ---------------------------------------------------------------- output
{
  const C = 'name = "Mia"\nprint("Hi " + name)\nprint("Score:", 7)';
  assert((await py(C)).out.join('|') === 'Hi Mia|Score: 7', 'output');
  steps.push({ id: 'output', label: 'Output: print Shows It',
    content: '<h2 class="lesson-h2">Output: print Shows It</h2>' +
      '<p class="lesson-lead"><strong>Output</strong> is what a program shows the user. In Python, <strong>print</strong> makes output.</p>' +
      columns(code(C), facts(['<strong>+</strong> joins two Strings, with no space added.', 'A <strong>comma</strong> shows both things, with one space between.', 'Each print starts a new line.'])) });
}

// ---------------------------------------------------------------- input
{
  const C = 'name = input("What is your name? ")\nprint("Hello " + name)';
  assert((await py(C, ['Mia'])).out.join() === 'Hello Mia', 'input');
  steps.push({ id: 'input', label: 'Input: The User Types It',
    content: '<h2 class="lesson-h2">Input: The User Types It</h2>' +
      '<p class="lesson-lead"><strong>Input</strong> is data the user gives the program. In Python, <strong>input()</strong> gets it from the keyboard.</p>' +
      columns(code(C), facts(['input() shows its question and <strong>waits</strong>.', 'The user types, then presses Enter.', 'What they typed is <strong>stored in the variable</strong>: here, name.'])) });
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

steps.push(lab('activity-1', 'Activity 1: Predict with Input', 'Activity 1: Predict with Input',
  'Type what each program prints, from what the user types. Then run it in Python. A round with a mistake does not count.', 'activity=io&part=1'));

// ---------------------------------------------------------------- input gives a String
{
  const A = 'a = input("Number? ")\nb = input("Number? ")\nprint(a + b)', B = 'a = int(input("Number? "))\nb = int(input("Number? "))\nprint(a + b)';
  assert((await py(A, ['4', '5'])).out[0] === '45' && (await py(B, ['4', '5'])).out[0] === '9', 'compare-input');
  steps.push(mcStep('compare-input', 'Compare: Adding What the User Types', 'Compare: Adding What the User Types', 'The user types <strong>4</strong> then <strong>5</strong> into each program.', [
    { prompt: 'What does each program print, and why?', options: ['A prints 45 and B prints 9: input() gives a String', 'A prints 9 and B prints 9: both read the numbers 4 and 5',
      'A prints 9 and B prints 45: int() joins the two numbers', 'A prints 45 and B prints 45: + always joins what is typed'], correct: 0,
      explain: 'input() always gives a String, so in A + joins "4" and "5": 45. In B, int() turns each String into an Integer first, so + adds: 9.' },
  ], columns(paneTitle('Program A') + code(A), paneTitle('Program B') + code(B))));
}

{
  const r = await py('print(int("12") + 1)\nprint(float("2.5") * 2)\nprint(str(12) + "3")');
  assert(r.out.join() === '13,5.0,123' && (await py('int("2.5")')).error, 'convert');
  steps.push({ id: 'convert', label: 'Turn a String into a Number',
    content: '<h2 class="lesson-h2">Turn a String into a Number</h2>' +
      '<p class="lesson-lead">input() <strong>always</strong> gives a String. To use it as a number, change its data type.</p>' +
      table(['Function', 'It turns', 'Example', 'Gives'], [
        ['<strong>int()</strong>', 'a String into an Integer', 'int("12")', '12'],
        ['<strong>float()</strong>', 'a String into a Real', 'float("2.5")', '2.5'],
        ['<strong>str()</strong>', 'a number into a String', 'str(12)', '"12"'],
        ['int()', 'a String with a decimal point', 'int("2.5")', 'an <strong>error</strong>: the program stops'],
      ]) + '<div style="margin-top:8px">' + code('age = int(input("Age? "))') + '</div>' });
}

steps.push(checkStep('convert-check', 'Your Turn: Which Function?', 'Your Turn: Which Function?', 'The program asks the user for each value. Type <strong>int</strong>, <strong>float</strong> or <strong>none</strong> for what goes round input().', [
  { line: true, label: 'The user\'s age in years', answer: FN.int, feedback: 'Can the value have a decimal point? Will the program do maths with it?' },
  { line: true, label: 'The price of a drink, like 1.25', answer: FN.float, feedback: 'Can the value have a decimal point?' },
  { line: true, label: 'The user\'s name', answer: FN.none, feedback: 'Is it a number at all? Does it need to be turned into a number?' },
  { line: true, label: 'The number of pets the user has', answer: FN.int, feedback: 'Can you have half a pet? Will the program count or add them?' },
]));

{
  const A = 'age = input("Age? ")\nprint(age + 1)', B = 'age = int(input("Age? "))\nprint(age + 1)';
  assert((await py(A, ['12'])).error && (await py(B, ['12'])).out[0] === '13', 'compare-error');
  steps.push(mcStep('compare-error', 'Compare: age + 1', 'Compare: age + 1', 'The user types <strong>12</strong> into each program.', [
    { prompt: 'What happens in each program, and why?', options: ['A stops with an error and B prints 13: A adds 1 to a String', 'A prints 121 and B prints 13: A joins the 1 to the 12',
      'A prints 13 and B prints 13: Python can see the digits', 'A prints 13 and B stops with an error: int() cannot read 12'], correct: 0,
      explain: 'In A, age is the String "12". Python cannot add the number 1 to a String, so it stops with an error. In B, int() makes age the Integer 12, so age + 1 is 13.' },
  ], columns(paneTitle('Program A') + code(A), paneTitle('Program B') + code(B))));
}

{
  const C = 'age = 12\nprint("Age: " + str(age))\nprint("Age:", age)';
  assert((await py(C)).out.join('|') === 'Age: 12|Age: 12' && (await py('age = 12\nprint("Age: " + age)')).error, 'str-join');
  steps.push({ id: 'str-join', label: 'Text and a Number in One Output',
    content: '<h2 class="lesson-h2">Text and a Number in One Output</h2>' +
      '<p class="lesson-lead">+ can only join a String to a String.</p>' +
      columns(code(C), facts(['<strong>str(age)</strong> turns the Integer 12 into the String "12", so + can join it.', 'A <strong>comma</strong> in print works too: it adds the space.', 'print("Age: " + age) stops with an error.'])) });
}

steps.push(embed('lab-3d', 'Lab: Input in the Lab', 'variables-lab-3d', 'Lab: Input in the Lab',
  'Walk round the lab with W A S D. Tap <strong>Space</strong> to pick up a value and tap again to put it down. Run each program one line at a time. A mistake in a challenge starts a new round. <strong>Done</strong> when The User Types It, Turn a String into a Number, Text and a Number and It Stops with an Error are complete.', 'lesson=2.2'));

steps.push(lab('activity-2', 'Activity 2: Numbers from Input', 'Activity 2: Numbers from Input',
  'Predict what each program prints, or choose "It stops with an error". Then run it. A round with a mistake does not count.', 'activity=io&part=2'));

steps.push(lab('activity-3', 'Activity 3: Fix the Program', 'Activity 3: Fix the Program',
  'Each program has a mistake with input or output. Fix it. Check tests it with inputs you cannot see: three checks for each task.', 'activity=fix'));

steps.push(selfMarked('explain', 'Explain: Why 34?', 'Explain: Why 34?',
  '<p class="lesson-lead">A program has <code>a = input()</code>, <code>b = input()</code> and <code>print(a + b)</code>. The user types 3 and 4. It prints 34.</p>', [
    { id: 'why-34', prompt: 'Explain why it prints 34, and how to make it print 7. [2]', marks: 2,
      scheme: ['input() gives a String / text, so + joins "3" and "4"', 'Use int() round input() / int(input()), so a and b are Integers and + adds them'],
      guidance: 'Award 1 mark for each point. Accept "they are text" for String. Accept float() for the fix. Do not accept "it is wrong" or "use numbers" alone.',
      modelAnswer: 'input() gives a String, so + joins "3" and "4" (1 mark). Use int(input()) so a and b are Integers, and + adds them (1 mark).' },
  ]));

steps.push(lab('activity-4', 'Activity 4: Write the Program', 'Activity 4: Write the Program',
  'Write each program from its task. Check tests it with inputs you cannot see: three checks for each task.', 'activity=iowrite'));

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

const WORKED = ['output', 'input', 'str-join'];
for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`, WORKED.includes(st.id) ? 'Show the worked answer' : 'Show the answer'));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '') + tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, '12') && !V('do-now', 0, '4') && V('do-now', 1, 'Real') && V('do-now', 1, 'float') && !V('do-now', 1, 'Integer') && V('do-now', 2, '6.0') && !V('do-now', 2, '6'), 'do-now marks');
assert(V('do-now-2', 0, 'Jump') && !V('do-now-2', 0, 'Wait') && V('do-now-2', 1, 'wait') && V('do-now-2', 2, '20') && V('do-now-2', 2, '20 steps') && !V('do-now-2', 2, '0'), 'do-now-2 marks');
assert(V('input-check', 0, 'tea and rice') && V('input-check', 0, '"tea and rice"') && !V('input-check', 0, 'rice and tea') && !V('input-check', 0, 'teaandrice') && V('input-check', 1, 'food') && !V('input-check', 1, 'drink') && V('input-check', 2, 'milk and soup'), 'input-check marks');
assert(V('convert-check', 0, 'int') && V('convert-check', 0, 'int()') && !V('convert-check', 0, 'float') && V('convert-check', 1, 'float') && V('convert-check', 1, 'float()') && !V('convert-check', 1, 'int') && V('convert-check', 2, 'none') && V('convert-check', 2, 'nothing') && !V('convert-check', 2, 'str') && !V('convert-check', 2, 'int') && V('convert-check', 3, 'int'), 'convert-check marks');
assert(V('practice', 0, 'Total: 10.0') && !V('practice', 0, 'Total: 10') && V('practice', 1, 'Integer') && V('practice', 2, 'Total: 6.0') && !V('practice', 2, 'Total: 6') && V('practice', 3, 'error') && V('practice', 3, 'It stops with an error') && V('practice', 3, 'it crashes') && !V('practice', 3, 'Total: 5.0'), 'practice marks');
checkLesson(steps, validators, {
  teach: [[/\binput\b/i, 'input'], [/\boutputs?\b/i, 'output'], [/\bint\(/, 'compare-input'], [/\bfloat\(/, 'convert'], [/\bstr\(/, 'convert'], [/\berrors?\b/i, 'convert']],
  walkLeaks: { 'do-now': /\b12\b|\bReal\b|float|6\.0/i, 'do-now-2': /\bJump\b|\bWait\b|\b20\b|Space/i },
});

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
    return { prompt: ask(lines, [a], "What does this program print?"), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [String(a * m), String(a) + String(a), "Error", ans + "0"]),
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
    return { prompt: ask(lines, typed, "What does this program print? If it stops, type error."), answer: ans, re: re, wrong: uniq(ans, re, isErr ? [a + 1, a + "1", "Age: " + a, d * 2] : ["It stops with an error", ans + "0", typed[0] + "1", "Error"]).slice(0, 3),
      steps: ["Check the data type of each value at each line.", why], working: ["What data type does each variable hold after line 1?", "Can the second line do that with those data types?"],
      note: why, py: isErr ? { code: prog(lines), inputs: typed.map(String), error: true } : { code: prog(lines), inputs: typed.map(String) } };
  }
  function whichGen() {
    var k = pick([["the user's age in years", "int"], ["how many pets the user has", "int"], ["the number of goals scored", "int"], ["the price of a cake, like 2.75", "float"], ["the user's height in metres", "float"], ["the time for a race in seconds, like 12.4", "float"], ["the user's name", "none"], ["the user's favourite colour", "none"]]);
    var ans = k[1] === "none" ? "none" : k[1], re = k[1] === "int" ? /^\s*(int(\s*\(\s*\))?|integer)\s*\.?\s*$/i : k[1] === "float" ? /^\s*(float(\s*\(\s*\))?|real)\s*\.?\s*$/i : /^\s*(none|nothing|no\s+function|neither|(just\s+)?input(\s*\(\s*\))?)\s*\.?\s*$/i;
    return { prompt: "A program asks for " + k[0] + ". Which function goes round input(): int, float or none?", answer: ans, re: re, wrong: ["int", "float", "none", "str"].filter(function (x) { return x !== ans; }),
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
