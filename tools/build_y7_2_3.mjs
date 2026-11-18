// Builds LessonData/y7-2-3-programs.json: Year 7, 2.3 Programs Using Data Types (7P.03, 7P.04: select appropriate
// Integer, Real and String data types for given values, develop a program that uses more than one data type, and use
// variables consistently), its plenary drill Drills/data/y7-2-3-programs.js, and registers the lesson after 2.2 in the
// Year 7 unit "Text-based Programming" (tools/y7_text_kit.mjs).
//   node tools/build_y7_2_3.mjs
// Python, as in 2.1 and 2.2. The lesson (James, 2026-11-18): about 25 minutes of slides while students make notes,
// then Data Bridge (set y7-data-types, the shell's ExamGameSetY7Types.gs), whose questions come from this lesson.
// Three ideas, each a PyIOAnim animation (scene=choose, mix, names: predicted first), a Haiku-marked Explain It, a
// "Your Notes" slide with Check my note, then a short check:
//   choose  choose the data type from what the program does with the value (a phone number through int() loses its 0)
//   mix     a Real and an Integer together give a Real; str() is needed where a number meets text in +
//   names   the same name every time: score and Score are different; a typo makes a new variable with no error
// Then two PyScratch Tasks (PyScratchTask/tasks/y7-2-3.js), How to Play, Data Bridge and the plenary drill.
// Every program on a slide is run in Python (Skulpt) here, and every check's answer comes from that run.
import { assert, py, tps, facts, columns, paneTitle, note, hl, code, typedIn, lessonKit, num, outRe, TYPE_RE, checkLesson, writeDrill, register, writeLesson } from './y7_text_kit.mjs';

const ID = 'y7-2-3-programs';
const P = 'y723';
const { validators, checkStep, embed, selfMarked } = lessonKit(P);
const ERR = '^\\s*(it\\s+)?(an?\\s+)?(stops(\\s+with\\s+an\\s+error)?|crash(es)?|error|name\\s*error|an\\s+error)\\s*\\.?\\s*$';
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
const GAME = '<strong>You will use these notes in Data Bridge.</strong>';

const TPS = {
  'do-now': ['Why does a program need to know the data type of a value?', 'The data type decides what the program can do with the value, like maths or joining text.'],
  'do-now-2': ['Why is the order of the input() lines important?', 'The first thing typed goes into the first input(). Swap the lines and the values swap too.'],
  'title': ['A shop app stores your name, your phone number and the price of what you buy. Why might it store each one in a different way?', 'Each value is used in a different way. Some are used for maths, some are only shown. Today we find out how to choose.'],
  'anim-choose': ['Before you watch: a phone number is made of digits. Does that make it a number? Why?', 'Make a guess with your partner. Then watch to check.'],
  'explain-choose': ['Where else do you see digits that are not used for maths?', 'A bus number, a room number like 12B, a PIN code. Nobody adds them up.'],
  'notes-choose': ['Why write the two questions in your notes, and not only one example?', 'The questions work for any value. One example only helps with one value.'],
  'choose-check': ['Why can two programs store the same value with different data types?', 'It depends on what each program does with the value. Ask the two questions for each program.'],
  'anim-mix': ['Before you watch: what might Python give when it multiplies a number with a decimal point by a whole number?', 'Make a guess with your partner. Then watch to check.'],
  'explain-mix': ['Why does a shop till show prices with a decimal point?', 'Money has parts of a baht or a pound. A whole number cannot show them.'],
  'notes-mix': ['Why is it useful to know the data type of every variable in a program?', 'Then you can tell what each line will do, and where str() or int() is needed.'],
  'mix-check': ['Before you answer: how can you find the data type of a value that is worked out?', 'Look at the data types that go into the sum, and the sign that joins them.'],
  'anim-names': ['Before you watch: does Python care about capital letters in a name? Why might it?', 'Make a guess with your partner. Then watch to check.'],
  'explain-names': ['Where else must a name be typed exactly the same every time?', 'A password, an email address, a username. One wrong letter and it does not work.'],
  'notes-names': ['Why is a spelling slip that gives no message worse than one that does?', 'With a message you know there is a problem. With no message, the wrong answer can go unnoticed.'],
  'names-check': ['How can you check a program for this kind of slip before you run it?', 'Read every variable name and compare it, letter by letter, with the line that first stored it.'],
  'notes-check': ['Why check your notes now, before the game?', 'The game asks about all three ideas. A missing note means a missing answer later.'],
  'pyscratch-1': ['Why read the error message before changing the code?', 'It says which line went wrong and what Python could not find.'],
  'pyscratch-2': ['Why does the check try more than one price?', 'A program can work for one value by luck. New values show it works every time.'],
  'how-to-play': ['Why do the coins come only from correct answers?', 'Beams cost coins. Knowing the work is what keeps your bridge strong.'],
  'game': ['Why keep your notes open while you play?', 'The questions use the same ideas. Your notes help you answer them right the first time.'],
  'plenary': ['Why do the questions use new values every time?', 'If you can do it with any values, you really understand it.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (2.1): a real exam question
// Cambridge IGCSE 0478/21, June 2022, Question 2: three of its five rows (Boolean and char are not taught in Year 7).
// Mark scheme: multiple characters from the keyboard: String; only whole numbers: Integer; any number: Real.
{
  const WT = { title: 'Walk me through it: a description and its data type', steps: [
    { text: 'Read one description. Then think of three values that fit it.', visual: note('Description: ' + hl('a temperature, like on a weather app')) },
    { text: 'Write down some values that fit.', visual: note('Values: ' + hl('31.5, 28.0, 33.7')) },
    { text: 'Look at the values. Do they have quote marks? Are they whole numbers, or can they have a decimal point?', visual: note('31.5, 28.0, 33.7: no quote marks, and ' + hl('a decimal point')) },
    { text: 'Now ask: which data type from 2.1 holds values like these? Write its name.', visual: note('Text in quote marks, whole numbers, or numbers with a decimal point?') },
    { text: 'Do the same for each description on the slide: think of values, look at them, then name the data type.', visual: note('One data type for each row.') },
  ] };
  steps.push(checkStep('do-now', 'Do Now: Data Types (Exam Question)', 'Do Now: Data Types',
    'From 2.1. Cambridge IGCSE 0478/21, June 2022, Question 2, three of its five rows. Type the most appropriate data type for each description: Integer, Real or String.', [
      { line: true, label: 'multiple characters from the keyboard', answer: TYPE_RE.str, feedback: 'Think of values that fit. Are they numbers, or are they text?' },
      { line: true, label: 'only whole numbers', answer: TYPE_RE.int, feedback: 'Think of values that fit, like 4 or 20. Can they have a decimal point?' },
      { line: true, label: 'any number', answer: TYPE_RE.float, feedback: 'Any number includes 2.5. Which data type can hold that?' },
    ]));
  steps.at(-1).walkthrough = WT;
}

// ---------------------------------------------------------------- Do Now 2 (2.2): input, int() and str()
{
  const C = 'name = input("Name? ")\nage = int(input("Age? "))\nprint(name + " will be " + str(age + 2))';
  const a = (await py(C, ['Ana', '11'])).out[0], b = (await py(C, ['Ben', '9'])).out[0];
  assert(a === 'Ana will be 13' && b === 'Ben will be 11', 'do-now-2 ' + a + b);
  const W = 'city = input("City? ")\ntemp = float(input("Temperature? "))\nprint(city + " is " + str(temp + 2))';
  const w = (await py(W, ['Pai', '30'])).out[0];
  assert(w === 'Pai is 32.0', 'walkthrough 2 ' + w);
  const WT = { title: 'Walk me through it: follow the input', steps: [
    { text: 'This is a different program. The user types Pai, then 30.', visual: code(W) },
    { text: 'Line 1: the first thing typed goes into city. city holds the String "Pai".', visual: code(W, [1]) + note('city: ' + hl('"Pai"')) },
    { text: 'Line 2: float() turns "30" into a number with a decimal point. temp holds 30.0, a Real.', visual: code(W, [2]) + note('temp: ' + hl('30.0') + ', a Real') },
    { text: 'Line 3: work out the brackets first. temp + 2 is 32.0. str() makes it the String "32.0".', visual: code(W, [3]) + note(hl('"32.0"')) },
    { text: 'Then + joins the Strings from left to right, spaces and all.', visual: code(W, [3]) + note('It prints ' + hl('Pai is 32.0')) },
    { text: 'Now do the same with your program: write down what each variable holds, line by line.', visual: code(W) },
  ] };
  steps.push(checkStep('do-now-2', 'Do Now: Follow the Input', 'Do Now: Follow the Input', 'From 2.2. Follow the program one line at a time.', [
    { line: true, label: 'The user types <strong>Ana</strong> then <strong>11</strong>. What does it print?', answer: outRe(a), feedback: 'Work out age + 2 first. Then join the parts from left to right, with the spaces.' },
    { line: true, label: 'What data type is age?', answer: TYPE_RE.int, feedback: 'Look at the function round input() on line 2.' },
    { line: true, label: 'The user types <strong>Ben</strong> then <strong>9</strong>. What does it print?', answer: outRe(b), feedback: 'Put the new values into name and age, then follow line 3 again.' },
  ], code(C)));
  steps.at(-1).walkthrough = WT;
}

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-2-2-input-output', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.2. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

steps.push({ id: 'title', label: '2.3: Programs Using Data Types',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Text-based Programming</p><h2 class="lesson-h2">2.3: Programs Using Data Types</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> watch, explain, and make notes on three ideas. Then use your notes in <strong>Data Bridge</strong>.',
      '<strong>The big question:</strong> why does choosing the right data type, and the right name, matter?']) });

// Teaching animations (docs/lessons.md 2b): PyIOAnim scenes, predicted first; each followed by a Haiku-marked Explain It,
// then a Your Notes slide (as y10-3-1-l6: notes on their own slide, Check my note), then a short check.
const ANIMS = {};
function anim(id, label, scene) {
  ANIMS[id] = scene;
  return { id, label, type: 'embedded-app', appId: 'py-io-anim', embedQuery: 'scene=' + scene, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + `<div id="${P}-${id}"></div>` };
}
function explain(id, label, about, part) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` +
      '<p class="lesson-lead">Explain it in your own words. Press <strong>Check my answer</strong> to have it marked.</p>' + `<div id="${cid}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part)] };
}
const NOTES = [];
function noteBox(q, model) {
  NOTES.push({ q, model });
  return `<details class="lesson-note"><summary><span class="lesson-note-q">Note in your notes: ${q}</span>` +
    `<span class="lesson-note-reveal">Check my note</span></summary><div class="lesson-note-a"><p><strong>A model note:</strong> ${model}</p></div></details>`;
}
function noteSlide(id, label, notes) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the pen icon at the top) and write each note in your own words. Then press <strong>Check my note</strong> and compare. Fix your note if it misses an idea. ' + GAME) +
    notes.map(([q, m]) => noteBox(q, m)).join('') };
}

// ---------------------------------------------------------------- idea 1: choose the data type (PyIOAnim scene=choose)
{
  const A = 'phone = int(input("Phone? "))\nprint(phone)', B = 'phone = input("Phone? ")\nprint(phone)';
  assert((await py(A, ['0812345678'])).out[0] === '812345678' && (await py(B, ['0812345678'])).out[0] === '0812345678', 'anim-choose');
  steps.push(anim('anim-choose', 'Watch: Choose the Data Type', 'choose'));
  steps.push(explain('explain-choose', 'Explain It: Why a String?',
    'The animation ran phone = int(input("Phone? ")) and print(phone). The user typed 0812345678. int() turned it into the Integer 812345678: a whole number never starts with 0, so the 0 at the start was lost, and print showed the wrong number. With phone = input("Phone? ") and no int(), phone held the String "0812345678" and print showed every digit. Nobody does maths with a phone number.',
    { prompt: 'In your own words, explain why a phone number like 0812345678 should be stored as a String, not an Integer.', marks: 2,
      scheme: ['The program never does maths / adds or multiplies with a phone number', 'As an Integer the 0 at the start is lost (812345678) / a String keeps every digit / a number cannot start with 0'],
      guidance: 'One mark for each point, in the student\'s own words. "It has digits" or "it is long" alone earns nothing. Accept "it can have a + or spaces" for the second point.',
      modelAnswer: 'Nobody does maths with a phone number. As an Integer the 0 at the start is lost; a String keeps every digit.' }));
  steps.push(noteSlide('notes-choose', 'Your Notes: Choosing a Data Type', [
    ['the two questions that choose a data type.', 'Will the program do maths with it? No: String. Yes: can it have a decimal point? Yes: Real. No: Integer.'],
    ['WHY a phone number is stored as a String.', 'No maths is done with it, and as an Integer it would lose the 0 at the start.'],
  ]));
  steps.push(checkStep('choose-check', 'Your Turn: Which Data Type?', 'Your Turn: Which Data Type?', 'Use the two questions from your notes. Type <strong>Integer</strong>, <strong>Real</strong> or <strong>String</strong> for each value.', [
    { line: true, label: 'The number of students in a class', answer: TYPE_RE.int, feedback: 'Will the program count or add them? Can there be half a student?' },
    { line: true, label: 'A runner\'s time in seconds, like 12.4', answer: TYPE_RE.float, feedback: 'Look at the example. What is in it that a whole number does not have?' },
    { line: true, label: 'A door code, like 0472', answer: TYPE_RE.str, feedback: 'Does anyone do maths with a code? What would happen to the first digit?' },
    { line: true, label: 'A house number with a letter, like 12B', answer: TYPE_RE.str, feedback: 'Can a number hold the letter B?' },
  ]));
}

// ---------------------------------------------------------------- idea 2: two data types in one program (PyIOAnim scene=mix)
{
  const C = 'price = 2.5\ncount = 3\ntotal = price * count\nprint("Total: " + str(total))';
  const r = await py(C + '\nprint(type(total).__name__)');
  assert(r.out.join('|') === 'Total: 7.5|float' && (await py('total = 7.5\nprint("Total: " + total)')).error, 'anim-mix');
  steps.push(anim('anim-mix', 'Watch: Two Data Types in One Program', 'mix'));
  steps.push(explain('explain-mix', 'Explain It: Why a Real, and Why str()?',
    'The animation ran price = 2.5, count = 3, total = price * count and print("Total: " + str(total)). price held the Real 2.5 and count the Integer 3. A Real times an Integer gives a Real, so total held 7.5, a Real. + cannot join the String "Total: " to a Real, so str(total) turned it into the String "7.5", and the screen showed Total: 7.5.',
    { prompt: 'price is 2.5 and count is 3. In your own words, explain why total = price * count is a Real, and why the print line needs str(total).', marks: 2,
      scheme: ['A Real times an Integer gives a Real / the answer 7.5 has a decimal point', '+ cannot join a String and a number, so str() turns total into a String'],
      guidance: 'One mark for each point, in the student\'s own words. "Because of str()" alone earns nothing: it must say + joins only text, or that the number must become text.',
      modelAnswer: 'A Real times an Integer gives a Real: 7.5. + can only join Strings, so str() makes total a String first.' }));
  steps.push(noteSlide('notes-mix', 'Your Notes: Two Data Types Together', [
    ['what data type you get when an Integer and a Real meet in a sum.', 'A Real. One Real in the sum makes the answer a Real. / always gives a Real too.'],
    ['WHY str() is needed to join text and a number with +.', '+ can only join two Strings, so str() turns the number into a String first.'],
  ]));
  const M = 'mins = 90\nhours = mins / 60\nprint(hours)\nprint("Time: " + str(mins) + " mins")';
  const m = await py(M + '\nprint(type(hours).__name__)');
  assert(m.out.join('|') === '1.5|Time: 90 mins|float', 'mix-check ' + m.out);
  steps.push(checkStep('mix-check', 'Your Turn: Two Data Types', 'Your Turn: Two Data Types', 'Follow the program. Use your notes.', [
    { line: true, label: 'What data type is hours?', answer: TYPE_RE.float, feedback: 'Look at the sign on line 2. What does it always give?' },
    { line: true, label: 'What does line 3 print?', answer: num(m.out[0]), feedback: 'Work out 90 / 60. How does Python show the answer of /?' },
    { line: true, label: 'What does line 4 print?', answer: outRe(m.out[1]), feedback: 'str(mins) is the String "90". Join the parts from left to right, with the spaces.' },
  ], code(M)));
}

// ---------------------------------------------------------------- idea 3: the same name every time (PyIOAnim scene=names)
{
  assert((await py('score = 5\nscore = score + 1\nprint(Score)')).error && (await py('score = 5\nscore = score + 1\nprint(score)')).out[0] === '6' &&
    (await py('score = 5\nscroe = score + 1\nprint(score)')).out[0] === '5', 'anim-names');
  steps.push(anim('anim-names', 'Watch: The Same Name Every Time', 'names'));
  steps.push(explain('explain-names', 'Explain It: Why Did Score Stop It?',
    'The animation ran score = 5, score = score + 1 and print(Score). score held 6. Line 3 asked for Score, with a capital S. Python sees score and Score as different names, and no variable called Score was ever stored, so the program stopped with an error. print(score) showed 6. Then a typo, scroe = score + 1, made a new variable called scroe holding 6, so print(score) showed 5 with no error.',
    { prompt: 'In your own words, explain why print(Score) stops with an error when the program stored the value in score.', marks: 2,
      scheme: ['Python sees capitals as different / Score and score are different names', 'No variable called Score was ever stored / given a value, so Python cannot find it'],
      guidance: 'One mark for each point, in the student\'s own words. "It is spelt wrong" alone earns nothing: it must say the capital makes it a different name, or that Score has no value.',
      modelAnswer: 'Python sees Score and score as different names. Nothing was ever stored in Score, so it cannot be found.' }));
  steps.push(noteSlide('notes-names', 'Your Notes: The Same Name Every Time', [
    ['WHY capital letters in a variable name matter.', 'Python sees score and Score as different names. Using a name that was never stored stops the program with an error.'],
    ['WHY a spelling slip can give a wrong answer with no error.', 'A new spelling, like scroe = score + 1, makes a new variable. The real one keeps its old value.'],
  ]));
  const A = 'lives = 3\nlives = lives - 1\nprint(Lives)', B = 'coins = 10\ncoisn = coins + 5\nprint(coins)';
  const b = await py(B + '\nprint(coisn)');
  assert((await py(A)).error && b.out.join('|') === '10|15', 'names-check');
  steps.push(checkStep('names-check', 'Your Turn: Find the Name Slip', 'Your Turn: Find the Name Slip', '', [
    { line: true, label: 'Program A: what happens? Type what it prints, or error.', answer: ERR, feedback: 'Compare the name on line 3 with the name stored on line 1, letter by letter.' },
    { line: true, label: 'Program B: what does it print?', answer: num(b.out[0]), feedback: 'Which variable did line 2 store into? Did coins change?' },
    { line: true, label: 'Program B: which variable holds 15?', answer: '^\\s*(the\\s+variable\\s+)?coisn\\s*\\.?\\s*$', flags: '', feedback: 'Line 2 works out 15. Read the name on the left of = exactly.' },
  ], paneTitle('Program A') + code(A) + paneTitle('Program B') + code(B)));
}

steps.push({ id: 'notes-check', label: 'Notes Check: Ready for Data Bridge',
  content: '<h2 class="lesson-h2">Notes Check: Ready for Data Bridge</h2>' +
    todo('open your notes (the pen icon at the top). You should have each note below, in your own words. Missing one? Go back to the slide named, write it, and press Check my note. ' + GAME) +
    facts(['<strong>The two questions that choose a data type. WHY a phone number is a String.</strong> Slide: Your Notes: Choosing a Data Type.',
      '<strong>An Integer and a Real together give a Real. WHY str() is needed with +.</strong> Slide: Your Notes: Two Data Types Together.',
      '<strong>WHY capitals matter in names. WHY a spelling slip can give a wrong answer with no error.</strong> Slide: Your Notes: The Same Name Every Time.']) });

// ---------------------------------------------------------------- PyScratch Tasks (pages PyScratchTask/tasks/y7-2-3.js)
const PST_LEAD = '<strong>What to do:</strong> write the Python in the box on the left. Click the green flag above the stage to run it. When it works, click <strong>Check my program</strong>.';
const pst = (id, task, n, what) => embed(id, `Activity: PyScratch Task ${n}`, 'pyscratch-task', `Activity: PyScratch Task ${n} of 2`,
  (n === 1 ? PST_LEAD + ' ' : '') + what, 'task=' + task);
steps.push(pst('pyscratch-1', 'y7-2-3-names', 1, 'Task 1 of 2: fix the program.'));
steps.push(pst('pyscratch-2', 'y7-2-3-shop', 2, 'Task 2 of 2: write the whole program yourself.'));

// ---------------------------------------------------------------- Data Bridge (shell ExamGameSetY7Types.gs, set y7-data-types)
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> (the pen icon at the top) beside the game.</li>' +
    '<li><strong>Answer questions from today</strong> to earn coins: choosing data types, two data types together, and names.</li>' +
    '<li><strong>Buy beams and build a bridge</strong> so the data truck can cross the gap. If the bridge breaks, answer new questions to earn coins, then try the same level again.</li>' +
    '<li><strong>Coins only come from correct answers.</strong> Check your notes before you answer.</li></ol>' });
steps.push(Object.assign(embed('game', 'Play: Data Bridge', 'bridge-builder', 'Play: Data Bridge', ''), { embedQuery: 'set=y7-data-types&goal=3' }));

steps.push(embed('plenary', 'Plenary: Programs Using Data Types', 'drill-y7-2-3-programs', 'Plenary: Programs Using Data Types',
  'Choosing a data type, two data types together, and the same name every time. Get 3 right in a row on each card. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '') + tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => { const v = validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern; return new RegExp(v.source, v.flags).test(s); };
assert(V('do-now', 0, 'String') && V('do-now', 0, 'str') && !V('do-now', 0, 'Integer') && V('do-now', 1, 'integer') && !V('do-now', 1, 'Real') && V('do-now', 2, 'Real') && V('do-now', 2, 'float') && !V('do-now', 2, 'Integer'), 'do-now marks');
assert(V('do-now-2', 0, 'Ana will be 13') && !V('do-now-2', 0, 'Ana will be 112') && !V('do-now-2', 0, 'Anawill be13') && V('do-now-2', 1, 'Integer') && !V('do-now-2', 1, 'String') && V('do-now-2', 2, 'Ben will be 11'), 'do-now-2 marks');
assert(V('choose-check', 0, 'Integer') && !V('choose-check', 0, 'Real') && V('choose-check', 1, 'real') && V('choose-check', 1, 'float') && !V('choose-check', 1, 'Integer') && V('choose-check', 2, 'String') && !V('choose-check', 2, 'Integer') && V('choose-check', 3, 'string'), 'choose-check marks');
assert(V('mix-check', 0, 'Real') && !V('mix-check', 0, 'Integer') && V('mix-check', 1, '1.5') && !V('mix-check', 1, '1') && V('mix-check', 2, 'Time: 90 mins') && !V('mix-check', 2, 'Time:90mins'), 'mix-check marks');
assert(V('names-check', 0, 'error') && V('names-check', 0, 'It stops with an error') && !V('names-check', 0, '2') && V('names-check', 1, '10') && !V('names-check', 1, '15') && V('names-check', 2, 'coisn') && !V('names-check', 2, 'coins'), 'names-check marks');
checkLesson(steps, validators, {
  teach: [[/\bscroe\b|\bcoisn\b/i, 'anim-names'], [/\bScore\b/, 'anim-names']],
  walkLeaks: { 'do-now': /\b(integer|real|string|int|float|str)\b/i, 'do-now-2': /Ana will be|Ben will be|\b13\b|\bInteger\b|\bint\(/i },
  cited: ['do-now'],
});
Object.keys(ANIMS).forEach((id) => { const i = steps.findIndex((s) => s.id === id); const e = steps[i + 1]; assert(e && e.type === 'self-marked-response' && e.items.every((it) => it.aiModel === 'haiku' && it.scheme.length >= it.marks && it.context && it.modelAnswer), `${id} is followed by a Haiku Explain It`); });
// Each Explain It is followed by its notes slide; every notes slide says the notes are for Data Bridge.
Object.keys(ANIMS).forEach((id) => { const i = steps.findIndex((s) => s.id === id); assert(steps[i + 2].id.startsWith('notes-') && steps[i + 2].content.includes('Data Bridge'), id + ' notes'); });
assert(NOTES.length === 6 && NOTES.every((n) => !/[–—]/.test(n.q + n.model)), 'notes');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

writeLesson(ID, '2.3: Programs Using Data Types', steps, validators);

// ======================================================================== plenary drill
function plenaryCards() {
  function prog(lines) { return lines.join("\n"); }
  var ERR_RE = /^\s*(it\s+)?(an?\s+)?(stops(\s+with\s+an\s+error)?|crash(es)?|error|name\s*error)\s*\.?\s*$/i;
  var TYPE_WORD = { int: "Integer", float: "Real", str: "String" };
  var WRONG_T = { int: ["Real", "String", "float"], float: ["Integer", "String", "int"], str: ["Integer", "Real", "int"] };
  // ---------------------------------------------------------------- choosing a data type
  function chooseGen() {
    var k = pick([["the number of pets a user has", "int", "It is counted in whole numbers, and maths is done with it."], ["the number of goals in a match", "int", "Goals are whole numbers, and they are added up."],
      ["the price of a cake, like 2.75", "float", "It has a decimal point, and maths is done with it."], ["a height in metres, like 1.52", "float", "It has a decimal point, and maths is done with it."],
      ["a phone number, like 0812345678", "str", "Nobody does maths with it, and the 0 at the start must be kept."], ["a door code, like 0472", "str", "Nobody does maths with it, and the 0 at the start must be kept."],
      ["a class name, like 7B", "str", "It has a letter in it, and nobody does maths with it."], ["a user's name", "str", "It is text, and nobody does maths with it."]]);
    var ans = TYPE_WORD[k[1]];
    return { prompt: "Which data type should a program use for " + k[0] + "? Type Integer, Real or String.", answer: ans, re: TYPE_RE[k[1]], wrong: WRONG_T[k[1]],
      steps: ["Will the program do maths with it? Can it have a decimal point?", k[2]], working: ["Will the program do maths with it? If not, it stays text.", "If it is a number, can it have a decimal point?"],
      note: k[2], format: "Type Integer, Real or String" };
  }
  function zeroGen() {
    var d = pick(["081", "082", "089", "061", "064"]) + String(rnd(1000000, 9999999)), v = pick(["phone", "mobile", "tel"]);
    var lines = [v + " = int(input(\"Phone? \"))", "print(" + v + ")"], ans = String(Number(d));
    return { prompt: "The user types " + d + ". What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [d, "Error", d + ".0", "0"]),
      steps: ["int() turns the String into an Integer.", "A whole number never starts with 0, so the 0 at the start is lost."], working: ["What does int() turn the String into?", "Can a whole number start with 0?"],
      note: "int() makes it a number, and the 0 at the start is lost: " + ans + ". A phone number should stay a String.", py: { code: prog(lines), inputs: [d] } };
  }
  // ---------------------------------------------------------------- two data types together
  function timesGen() {
    var a = pick(["1.5", "2.5", "0.5", "3.5", "1.25", "2.25"]), n = rnd(2, 5), v = pick([["price", "count"], ["cost", "items"], ["length", "boxes"]]);
    var lines = [v[0] + " = " + a, v[1] + " = " + n, "print(" + v[0] + " * " + v[1] + ")"], ans = real(Number(a) * n);
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [String(Math.round(Number(a) * n)), String(Number(a) * n).replace(".0", ""), a + n, "Error", ans + "0"]),
      steps: [v[0] + " is a Real and " + v[1] + " is an Integer.", "A Real times an Integer gives a Real, shown with a decimal point."], working: ["What data type is each variable?", "What data type do you get when a Real and an Integer meet?"],
      note: a + " * " + n + " = " + ans + ". One Real makes the answer a Real.", py: { code: prog(lines) } };
  }
  function typeGen() {
    var kind = rnd(0, 2), a, b, op, lines, t, v = pick(["x", "total", "result"]);
    if (kind === 0) { a = pick(["1.5", "2.5", "0.5"]); b = rnd(2, 6); op = "*"; t = "float"; }
    else if (kind === 1) { a = rnd(2, 9); b = rnd(2, 9); op = pick(["*", "+", "-"]); t = "int"; }
    else { a = rnd(2, 9) * 2; b = 2; op = "/"; t = "float"; }
    lines = ["a = " + a, "b = " + b, v + " = a " + op + " b"];
    var ans = TYPE_WORD[t];
    return { prompt: "What data type is " + v + "? Type Integer, Real or String.\n" + prog(lines), answer: ans, re: TYPE_RE[t], wrong: WRONG_T[t],
      steps: ["Find the data type of a and b, then look at the sign.", t === "int" ? "Two Integers with + - or * give an Integer." : op === "/" ? "/ always gives a Real." : "A Real and an Integer together give a Real."],
      working: ["What data type is a? What data type is b?", "Look at the sign. Does it always give a Real?"], format: "Type Integer, Real or String",
      note: t === "int" ? "Two Integers with " + op + " give an Integer." : op === "/" ? "/ always gives a Real, even when it divides exactly." : "One Real in the sum makes the answer a Real.",
      py: { code: prog(lines) + "\nprint(type(" + v + ").__name__)", type: t } };
  }
  function strGen() {
    var a = pick(["2.5", "1.5", "4.5", "0.5"]), n = rnd(2, 4), w = pick(["Total: ", "Cost: ", "Pay: "]);
    var lines = ["price = " + a, "count = " + n, "total = price * count", "print(\"" + w + "\" + str(total))"], ans = w + real(Number(a) * n);
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [w + Math.round(Number(a) * n), w + "total", "Error", w.trim() + real(Number(a) * n)]),
      steps: ["total = " + a + " * " + n + ", a Real.", "str(total) makes it a String, then + joins it to the text. The space is inside the quote marks."], working: ["Work out total first. A Real times an Integer is a Real.", "Then join the text and str(total). Is there a space inside the quote marks?"],
      note: "total is " + real(Number(a) * n) + ". str() makes it text, so + can join it: " + ans + ".", py: { code: prog(lines) } };
  }
  // ---------------------------------------------------------------- the same name every time
  function caseGen() {
    // Most draws ask for the name with a capital (an error); some use the same name (it prints), so the worked example
    // can be the other kind.
    // The two kinds use different names, so the worked example never repeats the card's lines.
    var bad = Math.random() < 0.7, v = pick(bad ? ["score", "lives"] : ["coins", "points"]), n = rnd(3, 9), k = rnd(1, 4), V = v.charAt(0).toUpperCase() + v.slice(1);
    var lines = [v + " = " + n, v + " = " + v + " + " + k, "print(" + (bad ? V : v) + ")"], ans = bad ? "It stops with an error" : String(n + k), re = bad ? ERR_RE : outRe(ans);
    return { prompt: "What does this program print? If it stops, type error.\n" + prog(lines), answer: ans, re: re, wrong: uniq(ans, re, bad ? [String(n + k), String(n), V, v] : ["It stops with an error", String(n), V]).slice(0, 3),
      steps: bad ? ["Line 3 asks for " + V + ", with a capital letter.", "Python sees " + v + " and " + V + " as different names. Nothing was stored in " + V + "."] : ["Line 3 asks for " + v + ", the same name as line 1.", "Line 2 changed it: " + n + " + " + k + "."],
      working: ["Compare the name on line 3 with the name on line 1, letter by letter.", "Was anything ever stored in that exact name?"],
      note: bad ? V + " is not " + v + ". No value was stored in " + V + ", so the program stops with an error." : "The same name every time, so it prints " + ans + ".", py: bad ? { code: prog(lines), error: true } : { code: prog(lines) } };
  }
  function typoGen() {
    var t = pick([["score", "scroe"], ["coins", "coisn"], ["lives", "lvies"], ["total", "totla"], ["points", "ponits"]]), n = rnd(3, 12), k = rnd(2, 6);
    var lines = [t[0] + " = " + n, t[1] + " = " + t[0] + " + " + k, "print(" + t[0] + ")"], ans = String(n);
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [String(n + k), "Error", t[1], String(k)]),
      steps: ["Line 2 stores into " + t[1] + ", a new variable. " + t[0] + " does not change.", "Line 3 prints " + t[0] + ", which still holds its first value."], working: ["Read the name on the left of = on line 2, letter by letter.", "Which variable does line 3 print? Did line 2 change it?"],
      note: t[1] + " is a new variable. " + t[0] + " still holds " + n + ", and there is no error.", py: { code: prog(lines) } };
  }
  function whichVarGen() {
    var t = pick([["score", "scroe"], ["coins", "coisn"], ["lives", "lvies"], ["total", "totla"], ["points", "ponits"]]), n = rnd(3, 12), k = rnd(2, 6);
    var lines = [t[0] + " = " + n, t[1] + " = " + t[0] + " + " + k, "print(" + t[0] + ")"], ans = t[1];
    var re = new RegExp("^\\s*(the\\s+variable\\s+)?" + t[1] + "\\s*\\.?\\s*$");
    return { prompt: "Which variable holds " + (n + k) + " at the end? Type its name exactly.\n" + prog(lines), answer: ans, re: re, wrong: [t[0], t[0].charAt(0).toUpperCase() + t[0].slice(1), "neither"],
      steps: ["Line 2 works out " + t[0] + " + " + k + " = " + (n + k) + ".", "It stores the answer in the name on the left of =, spelt exactly as written."], working: ["Which line works out the new value?", "Read the name on the left of = on that line, letter by letter."],
      note: "Line 2 stores " + (n + k) + " in " + t[1] + ", a new variable with a misspelt name.", format: "Type the variable name exactly" };
  }
  return [
    card("pl-choose-1", "pl-choose", chooseGen), card("pl-choose-2", "pl-choose", chooseGen), card("pl-zero", "pl-choose", zeroGen),
    card("pl-times", "pl-mix", timesGen), card("pl-type-1", "pl-mix", typeGen), card("pl-type-2", "pl-mix", typeGen), card("pl-str", "pl-mix", strGen),
    card("pl-case", "pl-names", caseGen), card("pl-typo", "pl-names", typoGen), card("pl-which", "pl-names", whichVarGen),
    why("pl-why-phone", "pl-why", "Why should a phone number like 0812345678 be stored as a String?", "No maths is done with it, and an Integer loses the 0",
      /^(?=.*\b(maths?|math|add\w*|calculat\w*|sums?)\b)(?=.*\b(zero|0|los[et]\w*|first|start\w*)\b).*$/i,
      ["It is long, and an Integer can only hold short numbers", "It has digits, and int() cannot read any digits", "It changes often, and a String can be changed"],
      "A similar question: why is a door code like 0472 stored as a String?\nNobody adds door codes together.\nAnswer: no maths is done with it, and the 0 at the start must stay.",
      ["Will the program ever add or multiply a phone number?", "What happens to the 0 at the start when it becomes a whole number?"], "No maths is done with a phone number, and int() would lose the 0 at the start."),
    why("pl-why-real", "pl-why", "price is 2.5 and count is 3. Why is price * count a Real?", "One Real in the sum makes the answer a Real",
      /^(?=.*\b(real|float|decimal\w*)\b)(?=.*\b(one|integer|int|whole|times|either|any|count)\b).*$/i,
      ["count is an Integer, so the answer is an Integer", "* always gives a String when it multiplies", "Python rounds every answer to a whole number"],
      "A similar question: why is 4 / 2 a Real?\n/ always gives a Real.\nAnswer: / gives a Real, so 4 / 2 is 2.0.",
      ["What data type is 2.5?", "What happens when a Real and an Integer meet in a sum?"], "2.5 is a Real. A Real and an Integer together give a Real: 7.5."),
    why("pl-why-str", "pl-why", "Why does print(\"Total: \" + str(total)) need str() when total is 7.5?", "+ can only join Strings, so total must be text",
      /^(?=.*\b(strings?|text|str)\b)(?=.*\b(join\w*|\+|only|cannot|can.?t|error)\b).*$/i,
      ["str() rounds 7.5 to a whole number first", "str() adds 1 to the total before showing it", "str() asks the user to type the total"],
      "A similar question: why does print(\"Age: \" + age) stop when age is 12?\n+ is joining text to a number.\nAnswer: + cannot join a String and an Integer.",
      ["What data type is \"Total: \"? What data type is total?", "What can + join?"], "+ joins only Strings. str(total) turns the Real into text first."),
    why("pl-why-case", "pl-why", "Why does print(Score) stop with an error after score = 5?", "Score and score are different names to Python",
      /^(?=.*\b(capitals?|case|different|upper\w*|lower\w*)\b)(?=.*\b(names?|score|variables?|stored|nothing)\b).*$/i,
      ["print() cannot show a number that was changed", "5 is too small a number for print() to show", "score must be in quote marks before it prints"],
      "A similar question: why does print(Lives) stop after lives = 3?\nThe capital L makes it another name.\nAnswer: Lives and lives are different names, and Lives holds nothing.",
      ["Compare the two names letter by letter. What is different?", "Was anything ever stored in Score?"], "Python sees Score and score as different names, and nothing was stored in Score."),
    why("pl-why-typo", "pl-why", "scroe = score + 1 has a typo. Why is there no error?", "Python just makes a new variable called scroe",
      /^(?=.*\b(new|another|second|different|makes?|creates?)\b)(?=.*\b(variables?|names?|scroe)\b).*$/i,
      ["Python fixes the spelling of the name itself", "Python ignores every line with a spelling slip", "Python stops, but only after the last line runs"],
      "A similar question: why does coisn = coins + 5 not change coins?\nThe answer is stored in the name on the left.\nAnswer: it makes a new variable coisn, so coins keeps its value.",
      ["What does = do with the name on its left?", "Is it allowed to make a variable with any new name?"], "= stores into the name on its left. A new name makes a new variable, so no error."),
  ];
}
await writeDrill({ id: ID, builder: 'build_y7_2_3.mjs', about: 'Year 7, 2.3 Programs Using Data Types. Plenary: choosing a data type, two data types together, the same name every time, and why.',
  title: 'Year 7, 2.3: Programs Using Data Types', subtitle: 'Data types and names in Python',
  categories: [['pl-choose', 'Choosing a Data Type'], ['pl-mix', 'Two Data Types Together'], ['pl-names', 'The Same Name Every Time'], ['pl-why', 'Why?']], cards: plenaryCards });

console.log(`${ID}: ${steps.length} steps; Year 7 units: ${register(ID)}`);
