// Builds LessonData/y7-2-1-variables.json: Year 7, 2.1 Data Types and Variables (7P.01 identify and describe
// Integer, Real and String; 7P.03 use variables to store and change values; 7P.04 develop a program that uses
// appropriate data types), its plenary drill Drills/data/y7-2-1-variables.js, and registers the lesson in the
// Year 7 unit "Text-based Programming" (tools/y7_text_kit.mjs).
//   node tools/build_y7_2_1.mjs
// Year 7's first text programs, in Python. The activities are Python Lab (PyLab/, real Python in the page):
// vars, types and write. The Do Now Extension reuses y7-3-2-ext. EAL-light and Term 1b "why" shape: one idea per
// slide, a Think, Pair, Share under every heading, predict-then-reveal, compare slides. Every program on a slide
// is run in Python (Skulpt) here, and every check's answer comes from that run.
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT, assert, py, tps, facts, columns, paneTitle, note, hl, code, box, table, lessonKit, num, outRe, TYPE_RE, checkLesson, writeDrill, register, writeLesson } from './y7_text_kit.mjs';

const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-2-1-variables';
const P = 'y721';
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
const word = (w) => `^\\s*["'\\u201c]?\\s*(say\\s*:?\\s*)?["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;

// Think, Pair, Share under each heading. On a check slide it never gives or presupposes an answer on that slide.
const TPS = {
  'do-now': ['Why does each task in a plan have one name next to it?', 'Everyone knows which jobs are theirs. No job is done twice, and none is forgotten.'],
  'do-now-2': ['Why can the same flowchart say different things?', 'The decision looks at the number. A different number can follow a different arrow.'],
  'title': ['A game shows your score going up. Where does the computer keep that score while you play? Why must it be able to change?', 'It keeps it in its memory, under a name. Every time you score, the program changes the value it stores. Today we learn how.'],
  'python': ['Predict: what does this program show on the screen? Why are the words in quote marks?', 'Hello, then Bye on the next line. The quote marks show Python where the text starts and ends.'],
  'variable': ['Predict: what is the difference between print(score) and print("score")? Why?', 'print(score) shows 5, the value stored in score. print("score") shows the word score, because quote marks mean the text itself.'],
  'store-again': ['Predict: what does this program print? Why does it not print 5 and 8?', 'It prints 8. A variable holds one value at a time, so storing 8 replaces the 5. There is only one print, at the end.'],
  'change': ['Predict: what does this program print? Why is coins = coins + 5 not a maths mistake?', 'It prints 15. In Python = does not mean "is the same as". It means: work out the right side, then store the answer in the variable on the left.'],
  'compare-order': ['Both programs have the same three lines. How can you tell what each one prints?', 'Talk in pairs. Follow each program one line at a time, then choose your answer.'],
  'vars-check': ['Why do we follow a program one line at a time, from the top?', 'Python runs the lines in order. Each line uses the values the lines above it stored.'],
  'activity-1': ['Why predict before you run the program?', 'A prediction shows what you really think each line does. When it is wrong, you find out what to learn.'],
  'types': ['Why is "12" a String, but 12 an Integer?', 'The quote marks. Inside quote marks Python stores the characters as text, even when they are digits.'],
  'types-check': ['Why does Python need to know the kind of value it stores?', 'The kind of value decides what Python can do with it: numbers can be added, text can be joined.'],
  'compare-plus': ['Both programs use the same + sign. How can they print different things?', 'Talk in pairs about what is different between the two lines. Then choose your answer.'],
  'why-types': ['Predict: is a score in a game an Integer, a Real or a String? Why?', 'An Integer. It is a whole number, and the game adds to it.'],
  'activity-2': ['What do you look for first to find a data type?', 'Quote marks first: they make a String. Then a decimal point or /: they make a Real. A whole number is an Integer.'],
  'explain': ['What makes an explanation worth 2 marks?', 'Two connected points: what is wrong now, and what to use instead, joined with "so" or "because".'],
  'activity-3': ['Why does Check test your program, not just look at what it prints?', 'A program can print the right thing by luck. Check also looks at the variables and their data types.'],
  'practice': ['Why write down each variable\'s value as you go?', 'A later line may use or change it. Writing it down means you never lose track.'],
  'plenary': ['Why practise with new values every time?', 'If you can do it with any values, you really understand it.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (3.2): read a project plan
const plan = (rows) => table(['Task', 'Who', 'Deadline', 'Needs'], rows);
const DN1 = [['1 Draw the flowchart', 'Nat', 'Monday', 'paper'], ['2 Draw the sprites', 'Ploy', 'Tuesday', 'task 1'], ['3 Build the game', 'Nat', 'Wednesday', 'tasks 1 and 2'], ['4 Test the game', 'Ploy', 'Thursday', 'task 3']];
const W1P = [['1 Write the questions', 'Lek', 'Monday', 'paper'], ['2 Draw the buttons', 'Fah', 'Wednesday', 'task 1'], ['3 Make the quiz', 'Fah', 'Thursday', 'tasks 1 and 2']];
const WT_PLAN = { title: 'Walk me through it: read a plan', steps: [
  { text: 'This is a different plan, for a quiz app. We answer the same kinds of question.', visual: plan(W1P) },
  { text: '<strong>Who</strong> makes the quiz? Find the task in the Task column. Then read across to the Who column.', visual: plan(W1P.map((r, i) => i === 2 ? [hl(r[0]), hl(r[1]), r[2], r[3]] : r)) + note('Who makes the quiz: ' + hl('Fah')) },
  { text: 'A task is <strong>late</strong>. Which task has to wait? Look down the Needs column for that task number.', visual: plan(W1P.map((r, i) => i === 2 ? [hl(r[0]), r[1], r[2], hl(r[3])] : r)) + note('Task 2 late: task 3 needs it, so ' + hl('Make the quiz') + ' waits') },
  { text: 'A <strong>deadline</strong>: find the task, then read across to the Deadline column.', visual: plan(W1P.map((r, i) => i === 1 ? [hl(r[0]), r[1], hl(r[2]), r[3]] : r)) + note('Draw the buttons: ' + hl('Wednesday')) },
  { text: 'Now do the same with your plan: find the row first, then read across.', visual: plan(W1P) },
] };
steps.push(checkStep('do-now', 'Do Now: Read the Plan', 'Do Now: Read the Plan', 'From 3.2. A team plans a Catch game.', [
  { line: true, label: 'Who builds the game?', answer: word('nat'), feedback: 'Find the task in the Task column. Read across to Who.' },
  { line: true, label: 'Task 3 is late. Which task has to wait?', answer: '^\\s*((task\\s*)?(4|four)(\\s*[:.,]?\\s*test(ing)?\\s+(the\\s+)?game)?|test(ing)?\\s+(the\\s+)?game)\\s*$', feedback: 'Look down the Needs column. Which task needs task 3?' },
  { line: true, label: 'What is the deadline for Draw the sprites?', answer: word('(on\\s+)?tues(day)?'), feedback: 'Find the task. Read across to the Deadline column.' },
], plan(DN1)));
steps.at(-1).walkthrough = WT_PLAN;

// ---------------------------------------------------------------- Do Now 2 (3.1): follow a decision
const DN2 = choice([], 'Score > 50?', [say('Pass')], [say('Try again')]);
const dn2 = (v) => FC.run(DN2, { values: { Score: v } }).said.join();
assert(dn2(64) === 'Pass' && dn2(50) === 'Try again' && DN2.nodes[4].text === 'Say "Try again"', 'do-now 2');
const W2 = choice([say('Hi')], 'Coins > 10?', [say('Shop')], [say('Wait')]);
assert(FC.run(W2, { values: { Coins: 15 } }).said.join() === 'Hi,Shop' && FC.run(W2, { values: { Coins: 10 } }).said.join() === 'Hi,Wait', 'walkthrough 2');
const WT_DEC = { title: 'Walk me through it: follow a decision', steps: [
  { text: 'This is a different flowchart. We try it twice: Coins is 15, then Coins is 10.', visual: chart(W2, 280) },
  { text: 'Begin at <strong>Start</strong>. Box 2 says "Hi". Then the arrow goes to the decision, box 3.', visual: chart(W2, 280, [0, 1]) },
  { text: 'Coins is 15. Put the number in: is 15 bigger than 10? Yes, so it is <strong>True</strong>. Follow True to Say "Shop".', visual: chart(W2, 280, [2, 3]) + note('15 &gt; 10? ' + hl('True')) },
  { text: 'Now Coins is 10. Is 10 bigger than 10? No. The same is not bigger, so it is <strong>False</strong>.', visual: chart(W2, 280, [2]) + note('10 &gt; 10? ' + hl('False')) },
  { text: 'Follow the False arrow to the box it reaches. Read the number on that box: 6. It says "Wait".', visual: chart(W2, 280, [5]) + note('Next box: ' + hl('6')) },
  { text: 'Now do the same with your numbers: put the number in, then follow that arrow.', visual: chart(W2, 280) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Follow the Decision', 'Do Now: Follow the Decision', 'From 3.1. Begin at Start. Put the number into the decision.', [
  { label: 'Score is 64. What does the sprite say?', answer: word('pass'), feedback: 'Is 64 bigger than 50? Then follow that arrow.' },
  { label: 'Score is 50. What does the sprite say?', answer: word('try\\s+again'), feedback: 'Is 50 bigger than 50? Then follow that arrow.' },
  { label: 'Score is 30. Which box number runs after box 2?', answer: '^\\s*(box\\s*)?5\\s*$', feedback: 'Is 30 bigger than 50? Follow that arrow and read the number on its box.' },
], chart(DN2, 300)));
steps.at(-1).walkthrough = WT_DEC;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-3-2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 3.1 and the Flowcharts unit. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '2.1: Data Types and Variables',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Text-based Programming</p><h2 class="lesson-h2">2.1: Data Types and Variables</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> write programs as text, and store values in them.', '<strong>The big question:</strong> why does a program need to know what kind of value it stores?']) });

// ---------------------------------------------------------------- Python and print
const PY1 = 'print("Hello")\nprint("Bye")';
assert((await py(PY1)).out.join() === 'Hello,Bye', 'python');
steps.push({ id: 'python', label: 'Programs Written as Text',
  content: '<h2 class="lesson-h2">Programs Written as Text</h2>' +
    '<p class="lesson-lead"><strong>Python</strong> is a programming language. We type each instruction as a line of text.</p>' +
    columns(code(PY1), facts([
      '<strong>print</strong> shows a message on the screen, like a Say box.',
      'The text goes inside <strong>quote marks</strong>.',
      'Python runs the lines in order, from the top.',
    ])) });

// ---------------------------------------------------------------- variables
const V1 = 'score = 5\nprint(score)';
assert((await py(V1)).out.join() === '5', 'variable');
steps.push({ id: 'variable', label: 'A Variable Stores a Value',
  content: '<h2 class="lesson-h2">A Variable Stores a Value</h2>' +
    '<p class="lesson-lead">A <strong>variable</strong> is a named store in the computer\'s memory. It holds one value.</p>' +
    columns(code(V1) + '<div style="margin-top:10px;display:inline-block;padding:10px 26px;border:2px solid var(--brand);border-radius:10px;font:700 20px var(--font-mono,monospace)"><span style="display:block;font:600 14px var(--font-body);color:var(--muted)">score</span>5</div>', facts([
      '<strong>=</strong> means store: put 5 in the variable called score.',
      '<strong>print(score)</strong> shows the value stored in score.',
      'No quote marks round score: it is a name, not text.',
    ])) });

const V2 = 'score = 5\nscore = 8\nprint(score)';
assert((await py(V2)).out.join() === '8', 'store-again');
steps.push({ id: 'store-again', label: 'Store a New Value',
  content: '<h2 class="lesson-h2">Store a New Value</h2>' +
    '<p class="lesson-lead">Predict first. Then the teacher shows the answer.</p>' +
    columns(code(V2), facts([
      'A variable holds <strong>one value</strong> at a time.',
      'Storing a new value <strong>replaces</strong> the old one.',
      'That is why it is called a variable: its value can vary.',
    ])) });

const V3 = 'coins = 10\ncoins = coins + 5\nprint(coins)';
assert((await py(V3)).out.join() === '15', 'change');
steps.push({ id: 'change', label: 'Change a Variable Using Its Own Value',
  content: '<h2 class="lesson-h2">Change a Variable Using Its Own Value</h2>' +
    '<p class="lesson-lead">Predict first. Then the teacher shows the answer.</p>' +
    columns(code(V3), facts([
      'Python works out the <strong>right side first</strong>: coins + 5.',
      'Then it <strong>stores</strong> the answer back in coins.',
      'This is how a game adds to a score.',
    ])) });

{
  const A = 'score = 5\nscore = score + 3\nprint(score)', B = 'score = 5\nprint(score)\nscore = score + 3';
  assert((await py(A)).out.join() === '8' && (await py(B)).out.join() === '5', 'compare-order');
  steps.push(mcStep('compare-order', 'Compare: Change, Then Print', 'Compare: Change, Then Print', '', [
    { prompt: 'What does each program print, and why?', options: ['A prints 8 and B prints 5: B prints before the change', 'Both print 8: both programs have the same lines',
      'A prints 5 and B prints 8: the last line runs first', 'Both print 5: score = 5 is the first line in both'], correct: 0,
      explain: 'Lines run in order. A changes score to 8, then prints. B prints while score is still 5, and changes it after.' },
  ], columns(paneTitle('Program A') + code(A), paneTitle('Program B') + code(B))));
}

{
  const C = 'lives = 3\nlives = lives - 1\npoints = 10\npoints = points + lives\nprint(lives)\nprint(points)';
  const r = (await py(C)).out, r2 = (await py(C.replace('lives = lives - 1', 'lives = 5'))).out;
  assert(r.join() === '2,12' && r2[1] === '15', 'vars-check');
  steps.push(checkStep('vars-check', 'Your Turn: What Does It Print?', 'Your Turn: What Does It Print?', 'Follow the program one line at a time.', [
    { label: 'What does the first print show?', answer: num(r[0]), feedback: 'lives starts at 3. The next line changes it. What does it hold now?' },
    { label: 'What does the second print show?', answer: num(r[1]), feedback: 'Line 4 adds lives to points. Use the value lives holds at that line.' },
    { label: 'Line 2 is changed to lives = 5. What does the second print show now?', answer: num(r2[1]), feedback: 'Follow it again from the top with the new line.' },
  ], code(C)));
}

steps.push(lab('activity-1', 'Activity 1: Predict, Then Run', 'Activity 1: Predict, Then Run',
  'Type what each program prints. Then run it in Python. A round with a mistake does not count.', 'activity=vars'));

// ---------------------------------------------------------------- data types
steps.push({ id: 'types', label: 'Three Data Types',
  content: '<h2 class="lesson-h2">Three Data Types</h2>' +
    '<p class="lesson-lead">A <strong>data type</strong> is the kind of value a variable stores.</p>' +
    table(['Data type', 'In Python', 'It stores', 'Examples'], [
      ['<strong>Integer</strong>', 'int', 'a whole number', '12 &nbsp; -3 &nbsp; 0'],
      ['<strong>Real</strong>', 'float', 'a number with a decimal point', '2.5 &nbsp; -0.75 &nbsp; 4.0'],
      ['<strong>String</strong>', 'str', 'text, in quote marks', '"Mia" &nbsp; "12"'],
    ]) + facts(['<strong>/</strong> always gives a Real: 8 / 2 is 4.0.']) });

{
  const parts = [['age = 12', 'int'], ['price = 2.50', 'float'], ['phone = "0812345678"', 'str'], ['half = 9 / 2', 'float']];
  for (const [c, t] of parts) assert((await py(c + '\nprint(type(' + c.split(' ')[0] + ').__name__)')).out[0] === t, c);
  steps.push(checkStep('types-check', 'Your Turn: Which Data Type?', 'Your Turn: Which Data Type?', 'Type <strong>Integer</strong>, <strong>Real</strong> or <strong>String</strong> for the value each line stores.',
    parts.map(([c, t]) => ({ line: true, label: `<code>${c.replace(/"/g, '&quot;')}</code>`, answer: TYPE_RE[t], feedback: 'Look for quote marks first. Then look for a decimal point or a /.' }))));
}

{
  const A = 'print(5 + 5)', B = 'print("5" + "5")';
  assert((await py(A)).out[0] === '10' && (await py(B)).out[0] === '55', 'compare-plus');
  steps.push(mcStep('compare-plus', 'Compare: 5 + 5 or "5" + "5"?', 'Compare: 5 + 5 or "5" + "5"?', '', [
    { prompt: 'What does each program print, and why?', options: ['A prints 10 and B prints 55: B joins two Strings', 'A prints 10 and B prints 10: + always adds numbers',
      'A prints 55 and B prints 10: quote marks add numbers', 'A prints 10 and B stops: Strings cannot use +'], correct: 0,
      explain: 'In A, 5 and 5 are Integers, so + adds them: 10. In B, "5" and "5" are Strings, so + joins them: 55.' },
  ], columns(paneTitle('Program A') + code(A), paneTitle('Program B') + code(B))));
}

steps.push({ id: 'why-types', label: 'Why the Data Type Matters',
  content: '<h2 class="lesson-h2">Why the Data Type Matters</h2>' +
    '<p class="lesson-lead">Choose the data type from what the value is and what the program does with it.</p>' +
    facts([
      'The data type decides what <strong>+</strong> does: Integers add, Strings join.',
      'A <strong>Real</strong> keeps the part after the decimal point: a price of 2.5 stays 2.5.',
      'A phone number is a <strong>String</strong>: it starts with 0, and we never add phone numbers.',
      'A name is always a <strong>String</strong>.',
    ]) });

steps.push(lab('activity-2', 'Activity 2: Which Data Type?', 'Activity 2: Which Data Type?',
  'Pick the data type first. Then Python shows the type it really is. A round with a mistake does not count.', 'activity=types'));

steps.push(selfMarked('explain', 'Explain: Choose the Data Type', 'Explain: Choose the Data Type',
  '<p class="lesson-lead">A program stores a pupil\'s height of 1.52 metres as <code>height = 1</code>.</p>', [
    { id: 'height-type', prompt: 'Explain why this data type is wrong for the height, and say which data type to use. [2]', marks: 2,
      scheme: ['1 is an Integer / a whole number, so the part after the decimal point (.52) is lost', 'Use a Real (float), because a height has a decimal point / 1.52'],
      guidance: 'Award 1 mark for each point. Accept float for Real and int for Integer. Do not accept "it is a number" alone for either mark.',
      modelAnswer: 'height = 1 is an Integer, so the .52 is lost (1 mark). Use a Real (float), because 1.52 has a decimal point (1 mark).' },
  ]));

steps.push(lab('activity-3', 'Activity 3: Write the Program', 'Activity 3: Write the Program',
  'Type real Python. Run it as often as you like. Check tests it: three checks for each task.', 'activity=write'));

{
  const C = 'name = "Ploy"\nage = 12\nage = age + 1\nhalf = age / 2\nprint(age)';
  const r = await py(C + '\nprint(type(half).__name__)\nprint(type(name).__name__)\nprint("age" + "1")');
  assert(r.out.join() === '13,float,str,age1', 'practice ' + r.out);
  steps.push(checkStep('practice', 'Practice: Variables and Data Types', 'Practice: Variables and Data Types', 'Use the program for (a) to (c).', [
    { label: 'What does the program print?', answer: num(r.out[0]), feedback: 'age starts at 12. Follow line 3.' },
    { line: true, label: 'What data type is half?', answer: TYPE_RE.float, feedback: 'Look at the sign line 4 uses to work it out.' },
    { line: true, label: 'What data type is name?', answer: TYPE_RE.str, feedback: 'Look at line 1. What is round the value?' },
    { line: true, label: 'New program: <code>print("age" + "1")</code>. What does it print?', answer: outRe(r.out[3]), feedback: 'Both values are in quote marks. What does + do with them?' },
  ], code(C)));
}

steps.push(embed('plenary', 'Plenary: Data Types and Variables', 'drill-y7-2-1-variables', 'Plenary: Data Types and Variables',
  'Variables, data types and what + does. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`, ['python', 'variable', 'store-again', 'change', 'why-types'].includes(st.id) ? 'Show the worked answer' : 'Show the answer'));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '') + tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, 'Nat') && !V('do-now', 0, 'Ploy') && V('do-now', 1, 'task 4') && V('do-now', 1, '4') && V('do-now', 1, 'Test the game') && V('do-now', 1, 'Task 4: Test the game') && !V('do-now', 1, 'task 3') && !V('do-now', 1, 'task') && !V('do-now', 1, ''), 'do-now marks');
assert(V('do-now', 2, 'Tuesday') && V('do-now', 2, 'tues') && !V('do-now', 2, 'Wednesday'), 'do-now deadline');
assert(V('do-now-2', 0, 'Pass') && !V('do-now-2', 0, 'Try again') && V('do-now-2', 1, 'try again') && V('do-now-2', 2, 'box 5') && !V('do-now-2', 2, '3'), 'do-now-2 marks');
assert(V('vars-check', 0, '2') && !V('vars-check', 0, '3') && V('vars-check', 1, '12') && !V('vars-check', 1, '13') && V('vars-check', 2, '15'), 'vars-check marks');
assert(V('types-check', 0, 'Integer') && V('types-check', 0, 'int') && V('types-check', 0, 'an integer') && !V('types-check', 0, 'Real') && V('types-check', 1, 'real') && V('types-check', 1, 'float') && V('types-check', 2, 'String') && V('types-check', 2, 'str') && !V('types-check', 2, 'Integer') && V('types-check', 3, 'Real') && !V('types-check', 3, 'Integer'), 'types-check marks');
assert(V('practice', 0, '13') && !V('practice', 0, '12') && V('practice', 1, 'real') && V('practice', 2, 'string') && V('practice', 3, 'age1') && V('practice', 3, '"age1"') && !V('practice', 3, 'age 1') && !V('practice', 3, '13'), 'practice marks');
checkLesson(steps, validators, {
  teach: [[/\bvariables?\b/i, 'variable'], [/\bdata types?\b/i, 'types'], [/\bIntegers?\b/, 'types'], [/\bReal\b/, 'types'], [/\bStrings?\b/, 'types'], [/\bPython\b/, 'python'], [/\bprint\b/, 'python']],
  walkLeaks: { 'do-now': /\bNat\b|Tuesday|Test the game|Catch/i, 'do-now-2': /\bPass\b|Try again|\b(64|50|30)\b|box 5/i },
});

writeLesson(ID, '2.1: Data Types and Variables', steps, validators);

// ======================================================================== plenary drill
function plenaryCards() {
  var NUMW = /^\s*(\d+)\s*$/;
  function others(ans, list) { var out = []; list.forEach(function (x) { x = String(x); if (x !== String(ans) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  function prog(lines) { return lines.join("\n"); }
  // ---------------------------------------------------------------- Variables
  function storeGen() {
    var v = pick(VARS), a = rnd(2, 30), b = rnd(31, 70), lines = [v + " = " + a, v + " = " + b, "print(" + v + ")"];
    return { prompt: "What does this program print?\n" + prog(lines), answer: String(b), re: outRe(b), wrong: others(b, [a, a + b, a + " " + b, b + 1]),
      steps: ["Line 1 stores " + a + " in " + v + ".", "Line 2 stores " + b + ". It replaces " + a + ".", "print shows what " + v + " holds now."],
      working: ["A variable holds one value at a time.", "Which value was stored last, before the print?"], note: v + " holds " + b + ": the new value replaced " + a + ".", py: { code: prog(lines) } };
  }
  function changeGen() {
    var v = pick(VARS), a = rnd(5, 30), b = rnd(2, 9), lines = [v + " = " + a, v + " = " + v + " + " + b, "print(" + v + ")"];
    return { prompt: "What does this program print?\n" + prog(lines), answer: String(a + b), re: outRe(a + b), wrong: others(a + b, [a, b, a + b + b, a + "" + b, a + b + 1]),
      steps: [v + " starts at " + a + ".", "Line 2 works out the right side first: " + a + " + " + b + " = " + (a + b) + ".", "It stores " + (a + b) + " back in " + v + ", and print shows it."],
      working: ["Work out the right side of line 2 first, using the value " + v + " holds.", "Then store that answer back in " + v + "."], note: a + " + " + b + " = " + (a + b) + ", stored back in " + v + ".", py: { code: prog(lines) } };
  }
  function twiceGen() {
    var v = pick(VARS), a = rnd(20, 40), b = rnd(2, 6), lines = [v + " = " + a, v + " = " + v + " - " + b, v + " = " + v + " - " + b, "print(" + v + ")"];
    var ans = a - 2 * b;
    return { prompt: "What does this program print?\n" + prog(lines), answer: String(ans), re: outRe(ans), wrong: others(ans, [a - b, a, a + 2 * b, ans - b]),
      steps: [v + " starts at " + a + ".", "Line 2: " + a + " - " + b + " = " + (a - b) + ".", "Line 3 uses the new value: " + (a - b) + " - " + b + " = " + ans + "."],
      working: ["Each line uses the value from the line before.", "Write down the value after each line."], note: a + " - " + b + " - " + b + " = " + ans + ".", py: { code: prog(lines) } };
  }
  function copyGen() {
    var t = shuffled(VARS), a = rnd(2, 20), b = rnd(21, 50), lines = [t[0] + " = " + a, t[1] + " = " + t[0], t[0] + " = " + b, "print(" + t[1] + ")"];
    return { prompt: "What does this program print?\n" + prog(lines), answer: String(a), re: outRe(a), wrong: others(a, [b, a + b, t[0], b - a]),
      steps: ["Line 1 stores " + a + " in " + t[0] + ".", "Line 2 copies the value " + a + " into " + t[1] + ".", "Line 3 changes " + t[0] + " only. " + t[1] + " still holds " + a + "."],
      working: ["Line 2 copies the value " + t[0] + " holds at that moment.", "Does changing " + t[0] + " later change " + t[1] + "?"], note: t[1] + " got a copy of " + a + ". Changing " + t[0] + " later does not change " + t[1] + ".", py: { code: prog(lines) } };
  }
  function orderGen() {
    var v = pick(VARS), a = rnd(3, 20), b = rnd(2, 9), lines = [v + " = " + a, "print(" + v + ")", v + " = " + v + " + " + b];
    return { prompt: "What does this program print?\n" + prog(lines), answer: String(a), re: outRe(a), wrong: others(a, [a + b, b, a + " " + (a + b), a + 1, a * 2]),
      steps: ["Line 1 stores " + a + " in " + v + ".", "Line 2 prints it now, while it is " + a + ".", "Line 3 changes " + v + " after the print, so the print never shows the new value."],
      working: ["Lines run in order, from the top.", "What does " + v + " hold when the print line runs?"], note: "The print runs before the change, so it shows " + a + ".", py: { code: prog(lines) } };
  }
  // ---------------------------------------------------------------- Data types
  function typeCard(kind) {
    return function () {
      var t, c, why;
      if (kind === "value") {
        t = pick(["int", "float", "str"]);
        c = "item = " + (t === "int" ? pick([rnd(2, 99), -rnd(1, 20), rnd(100, 999)]) : t === "float" ? pick([dec(), rnd(1, 9) + "." + rnd(1, 9), rnd(2, 9) + ".0"]) : "\"" + pick(NAMES.concat(["hello", "Bangkok"])) + "\"");
        why = t === "int" ? "It is a whole number with no decimal point." : t === "float" ? "It has a decimal point." : "It is text in quote marks.";
      } else if (kind === "quoted") {
        var v = pick([String(rnd(2, 99)), dec()]), q = Math.random() < 0.6;
        t = q ? "str" : v.indexOf(".") < 0 ? "int" : "float"; c = "item = " + (q ? "\"" + v + "\"" : v);
        why = q ? "It is in quote marks, so it is a String, even though it looks like a number." : t === "int" ? "No quote marks and no decimal point: a whole number." : "No quote marks, and it has a decimal point.";
      } else if (kind === "div") {
        var n = rnd(2, 9), d2 = Math.random() < 0.6;
        t = d2 ? "float" : "int"; c = "item = " + (n * 2) + (d2 ? " / 2" : pick([" - 2", " * 2", " + 2"]));
        why = d2 ? "/ always gives a Real, even when it divides exactly." : "Whole numbers with -, * or + give a whole number.";
      } else {
        t = pick(["int", "float", "str"]); var x = rnd(2, 9), y = rnd(2, 9);
        c = "item = " + (t === "int" ? x + " * " + y : t === "float" ? x + " + " + dec() : "\"" + x + "\" + \"" + y + "\"");
        why = t === "int" ? "A whole number times a whole number is a whole number." : t === "float" ? "A whole number + a Real gives a Real." : "Two Strings joined with + make a String.";
      }
      var names = ["Integer", "Real", "String"], ans = TYPE_NAME[t];
      return { prompt: "What data type does item store?\n" + c, answer: ans, re: TYPE_RE[t], wrong: names.filter(function (x) { return x !== ans; }).concat(["Variable"]), format: "Type Integer, Real or String",
        steps: ["Look for quote marks first, then a decimal point or a /.", why], working: ["Look for quote marks round the value first.", "No quote marks? Then look for a decimal point or a /."], note: why, py: { code: c + "\nprint(type(item).__name__)", type: t } };
    };
  }
  // ---------------------------------------------------------------- What + does
  function plusGen(kind) {
    return function () {
      var a = rnd(2, 9), b = rnd(2, 9), c, ans, wrong, st;
      if (kind === "add") { c = "print(" + a + " + " + b + ")"; ans = String(a + b); wrong = [a + "" + b, a + " " + b, a + b + 1]; st = ["No quote marks: both are Integers.", "+ adds Integers: " + a + " + " + b + "."]; }
      else if (kind === "join") { c = "print(\"" + a + "\" + \"" + b + "\")"; ans = a + "" + b; wrong = [a + b, a + " " + b, "\"" + a + "\"\"" + b + "\""]; st = ["Both are in quote marks: they are Strings.", "+ joins Strings, with no space between them."]; }
      else if (kind === "div") { var n = rnd(2, 9); a = n * 2; c = "print(" + a + " / 2)"; ans = real(n); wrong = [String(n), n + ".5", String(a)]; st = ["/ always gives a Real.", a + " / 2 is " + n + ", shown with a decimal point."]; }
      else { var d = dec(); c = "print(" + a + " + " + d + ")"; ans = real(a + Number(d)); wrong = [String(a), String(Math.round(a + Number(d))), a + d]; st = ["A whole number + a Real gives a Real.", "Add them and keep the decimal part."]; }
      return { prompt: "What does this program print?\n" + c, answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), wrong.concat([ans + "0", "0" + ans])),
        steps: st, working: ["Look at the data types first: quote marks, decimal points, /.", "Integers add, Strings join, and / gives a Real."], note: st.join(" "), py: { code: c } };
    };
  }
  return [
    card("pl-store", "pl-var", storeGen), card("pl-change", "pl-var", changeGen), card("pl-twice", "pl-var", twiceGen), card("pl-copy", "pl-var", copyGen), card("pl-order", "pl-var", orderGen),
    card("pl-type-value", "pl-type", typeCard("value")), card("pl-type-quoted", "pl-type", typeCard("quoted")), card("pl-type-div", "pl-type", typeCard("div")), card("pl-type-calc", "pl-type", typeCard("calc")),
    card("pl-plus-add", "pl-plus", plusGen("add")), card("pl-plus-join", "pl-plus", plusGen("join")), card("pl-plus-div", "pl-plus", plusGen("div")), card("pl-plus-real", "pl-plus", plusGen("real")),
    why("pl-why-join", "pl-why", "Why does print(\"5\" + \"5\") show 55, not 10?", "They are Strings, so + joins them instead of adding",
      /^(?=.*\b(strings?|text|quote\w*|str)\b)(?=.*\b(join\w*|stick\w*|put\s+together|next\s+to|side\s+by\s+side)\b).*$/i,
      ["They are Integers, so + adds them and doubles them", "They are Reals, so + adds the decimal places", "They are variables, so + joins their names"],
      "A similar question: why does print(5 + 5) show 10?\nThere are no quote marks, so both are Integers.\nAnswer: they are Integers, so + adds them.",
      ["Look at the quote marks. What data type are the values?", "What does + do with that data type?"], "Quote marks make Strings, and + joins Strings: 5 then 5 is 55."),
    why("pl-why-phone", "pl-why", "Why should a phone number like 0812345678 be stored as a String?", "It starts with 0, and we never do maths with it",
      /^(?=.*\b(0|zero|starts?|begins?|first|leading)\b)(?=.*\b(maths?|math|calculat\w*|add\w*|sums?|never|not\s+a\s+number)\b).*$/i,
      ["It is too long, and an Integer holds 5 digits", "It has a decimal point, and a String keeps it", "It is a name, and names go in quote marks"],
      "A similar question: why should a score be stored as an Integer?\nIt is a whole number, and the game adds to it.\nAnswer: it is a whole number that we add to.",
      ["What is the first digit of a phone number?", "Do we ever add up or multiply phone numbers?"], "A phone number starts with 0 and is never used for maths, so it is text: a String."),
    why("pl-why-real", "pl-why", "Why is the price 2.5 stored as a Real, not an Integer?", "It has a decimal point, and an Integer would lose the .5",
      /^(?=.*\b(decimal|point|\.5|half|fraction\w*|part)\b)(?=.*\b(lose|lost|drop\w*|whole|integer|int|cannot|can.?t|keep\w*)\b).*$/i,
      ["It is text, and a Real keeps the quote marks", "It is a whole number, and a Real is shorter", "It is a price, and prices are always Strings"],
      "A similar question: why is 12 stored as an Integer?\nIt has no decimal point.\nAnswer: it is a whole number.",
      ["Look at the number. What is after the 2?", "Can an Integer hold that part?"], "2.5 has a decimal point. Only a Real keeps the .5; an Integer is whole numbers only."),
  ];
}
await writeDrill({ id: ID, builder: 'build_y7_2_1.mjs', about: 'Year 7, 2.1 Data Types and Variables. Plenary: variables, data types, what + does, and why.',
  title: 'Year 7, 2.1: Data Types and Variables', subtitle: 'Variables and data types in Python',
  categories: [['pl-var', 'Variables'], ['pl-type', 'Data Types'], ['pl-plus', 'What + Does'], ['pl-why', 'Why?']], cards: plenaryCards });

console.log(`${ID}: ${steps.length} steps; Year 7 units: ${register(ID)}`);
