// Builds LessonData/y7-term1b-revision.json: Year 7 Term 1b Revision, one 55-minute lesson driven by Data Bridge, in the
// shape of tools/build_y8_term1b_revision.mjs. Registers it in a "Term 1b Revision" unit after Text-based Programming.
//   node tools/build_y7_term1b_revision.mjs
// Shape: two Do Now slides (2.1 and 2.2 Python input and data types, then 3.1 sequence or selection), each with a Walk me
// through it on a different example; a short key-facts slide per Term 1b topic (3.1, 3.2, 2.1, 2.2, 2.3); Data Bridge:
// Use Your Notes; Data Bridge on the combined Exam Game set y7-term1b-revision (shell ExamGameSetY7Term1bRevision.gs:
// y7-data-types; 3.1 and 3.2 have no set); then the 3.1 and 3.2 plenary drills.
// A teacher-only Think, Pair, Share under every heading never gives a slide answer.
// Every Python output comes from the site's Skulpt (tools/y7_text_kit.mjs py()).
import { assert, py, tps, facts, columns, note, hl, code, typedIn, lessonKit, outRe, TYPE_RE, checkLesson, writeLesson, table } from './y7_text_kit.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './y7_text_kit.mjs';

const ID = 'y7-term1b-revision';
const P = 'y7t1b';
const SET = 'y7-term1b-revision';
const TITLE = 'Year 7 Term 1b Revision';
const { validators, checkStep, embed } = lessonKit(P);
const steps = [];
const mins = (n) => `<strong>${n} minutes.</strong> `;
const why = (q, a) => tps(q, `<p>${a}</p>`);
const addTps = (s, q, a) => { s.content = s.content.replace('</h2>', '</h2>' + why(q, a)); return s; };
const V = (id, i, v) => { const s = steps.find((x) => x.id === id); return new RegExp(validators[s.validatorKey][i].pattern.source, 'i').test(v); };

// ---------------------------------------------------------------- Do Now 1 (2.1 and 2.2): input, float() and str()
const DN1 = 'item = input("Item? ")\nprice = float(input("Price? "))\nprint(item + " costs " + str(price * 2))';
const r1 = await py(DN1, ['pen', '1.5']);
assert(!r1.error && r1.out.at(-1).endsWith('pen costs 3.0'), 'do-now 1 ' + JSON.stringify(r1));
const r1c = await py(DN1, ['cap', '4']);
assert(!r1c.error && r1c.out.at(-1).endsWith('cap costs 8.0'), 'do-now 1c ' + JSON.stringify(r1c));
const WDN1 = 'city = input("City? ")\ntemp = int(input("Temp? "))\nprint(city + " is " + str(temp + 4))';
const w1 = await py(WDN1, ['Pai', '30']);
assert(!w1.error && w1.out.at(-1).endsWith('Pai is 34'), 'walk 1 ' + JSON.stringify(w1));
const WT_IO = { title: 'Walk me through it: input and data types', steps: [
  { text: 'This is a different program. The user types Pai, then 30. Do the same steps with your program.', visual: code(WDN1) },
  { text: 'Line 1: the first thing typed goes into city. city holds "Pai".', visual: code(WDN1, [1]) + note('city: ' + hl('"Pai"') + ', text') },
  { text: 'Line 2: int() turns "30" into a whole number. temp holds 30, a whole number.', visual: code(WDN1, [2]) + note('temp: ' + hl('30') + ', a whole number') },
  { text: 'Line 3: work out the brackets first. temp + 4 is 34. str() makes it the text "34".', visual: code(WDN1, [3]) + note(hl('"34"')) },
  { text: 'Then + joins the text from left to right, spaces and all.', visual: code(WDN1, [3]) + note('It prints ' + hl('Pai is 34')) },
  { text: 'Now do yours. Write down what each variable holds, line by line.', visual: code(WDN1) },
] };
steps.push(addTps(checkStep('do-now', 'Do Now: Input and Data Types (1 of 2)', 'Do Now: Input and Data Types (1 of 2)', mins(4) + 'From 2.1 and 2.2. Follow the program one line at a time.', [
  { label: 'The user types pen then 1.5. What does it print?', answer: outRe('pen costs 3.0'), feedback: 'Work out price * 2 first. float() keeps the decimal point. Then join the text with the spaces.' },
  { line: true, label: 'What is the data type of price?', answer: TYPE_RE.float, feedback: 'Look at line 2. Which function is used, and can its value have a decimal point?' },
  { label: 'The user types cap then 4. What does it print?', answer: outRe('cap costs 8.0'), feedback: 'Line 2 turns what is typed into a number with a decimal point. Work out price * 2, then join the text.' },
], code(DN1) + typedIn(['pen', '1.5'])), 'Why must what the user types be changed into a number before the program can do maths with it?', 'What the user types arrives as text. The program must turn it into a number first.'));
steps.at(-1).walkthrough = WT_IO;

// ---------------------------------------------------------------- Do Now 2 (3.1): sequence or selection
const SEQ = '^\\s*(it\\s+is\\s+|it\'?s\\s+)?(a\\s+)?sequence\\s*\\.?\\s*$';
const SEL = '^\\s*(it\\s+is\\s+|it\'?s\\s+)?(a\\s+)?selection\\s*\\.?\\s*$';
const CLUE = '^\\s*["\'\\u201c]?\\s*(if|otherwise|if\\s+and\\s+otherwise|if,?\\s+otherwise)\\s*["\'\\u201d]?\\s*\\.?\\s*$';
const WT_CON = { title: 'Walk me through it: which construct?', steps: [
  { text: 'These are different problems. Do the same steps with your problems.', visual: note('Problem X: ' + hl('Say "Ready", wait 1 second, then say "Go".')) + note('Problem Y: Play a sound only when the cat touches the ball.') },
  { text: 'Problem X: look for a clue word. There is no clue word. Every step always happens, one after another, in order.', visual: note('Problem X: no clue word, the steps always run in order.') },
  { text: 'Problem Y: look for a clue word. "only when" is a clue. What happens depends on the cat touching the ball, so a decision is needed.', visual: note('Problem Y: Play a sound ' + hl('only when') + ' the cat touches the ball.') },
  { text: 'Ask the same question for each of your problems: does what happens depend on something? Then name the construct.', visual: note('Clue words: only when ... (and the others on your notes)') },
] };
steps.push(addTps(checkStep('do-now-2', 'Do Now: Sequence or Selection? (2 of 2)', 'Do Now: Sequence or Selection? (2 of 2)', mins(4) + 'From 3.1. Read each problem.', [
  { line: true, label: 'Which construct does Problem A need?', answer: SEQ, feedback: 'Look for a clue word in Problem A. Does what happens depend on anything?' },
  { line: true, label: 'Which construct does Problem B need?', answer: SEL, feedback: 'Problem B has a clue word. Does what happens depend on the score?' },
  { line: true, label: 'Write one clue word from Problem B.', answer: CLUE, feedback: 'Find the word that starts a decision, or the word that gives the other path.' },
], note('Problem A: Move 10 steps, turn 90 degrees, then say "Hello".') + note('Problem B: If the score is bigger than 10, say "Win". Otherwise say "Try again".')),
'Why does a problem with a clue word need a decision in the algorithm?', 'What happens is not always the same. Something must be checked to choose the path.'));
steps.at(-1).walkthrough = WT_CON;

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: TITLE,
  content: `<div class="lesson-title-slide"><p class="lesson-title-kicker">Year 7</p><h2 class="lesson-h2">${TITLE}</h2><p>Algorithm constructs, project plans, variables, input and output, data types</p></div>` +
    why('Why check your notes now, before the questions start?', 'A gap you find now can be fixed before it costs marks in a test.') +
    facts([mins(1) + '<strong>Today:</strong> the key facts for each topic, then exam questions in Data Bridge.']) });

// ---------------------------------------------------------------- key facts
const fact = (id, label, q, a, left, right) => steps.push({ id, label,
  content: `<h2 class="lesson-h2">${label}</h2>` + why(q, a) + `<p class="lesson-lead">${mins(3)}Add anything you had forgotten to your notes.</p>` + columns(left, right) });

fact('facts-constructs', 'Key Facts: Sequence and Selection', 'Why do most algorithms use both sequence and selection?',
  'Most jobs have steps that always happen and also a point where something is checked.',
  facts(['A <strong>construct</strong> is a way to join the steps of an algorithm.',
    '<strong>Sequence:</strong> steps run in order, one after another. Change the order and the result can change.',
    '<strong>Selection:</strong> a decision asks a question. The answer (True or False) chooses the path.']),
  table(['<b>Clue in the problem</b>', '<b>Construct</b>'], [
    ['if', 'Selection'], ['only when', 'Selection'], ['otherwise', 'Selection (the False path)'], ['no clue word', 'Sequence']]));

fact('facts-plans', 'Key Facts: Project Plans', 'Why must some tasks wait for other tasks?',
  'A task can need the result of an earlier task before it can start.',
  facts(['A <strong>project</strong> is a big job with a goal and an end date. A software project makes a program, an app or a game.',
    'It is split into <strong>tasks</strong>: one small job each.',
    'The stages: <strong>plan</strong>, <strong>design</strong>, <strong>build</strong>, <strong>test</strong>.']),
  facts(['A <strong>project plan</strong> lists the tasks, their <strong>order</strong>, <strong>who</strong> does each one, the <strong>deadline</strong> and what each task <strong>needs</strong>.',
    'A plan helps: you know what to do first, you finish on time, nothing is forgotten, and everyone knows who does what.']));

fact('facts-variables', 'Key Facts: Variables and Data Types', 'Why is a phone number stored as a String?',
  'Nobody does maths with a phone number, and it can start with 0.',
  facts(['A <strong>variable</strong> is a named store in memory. It holds one value.',
    '<strong>=</strong> means store: score = 5 puts 5 in score. A new value replaces the old one.',
    'score = score + 1 uses the old value, then stores the new one.']),
  table(['<b>Data type</b>', '<b>Python</b>', '<b>Stores</b>', '<b>Example</b>'], [
    ['Integer', 'int', 'a whole number', '12'], ['Real', 'float', 'a number with a decimal point', '2.5'], ['String', 'str', 'text, in quote marks', '"Mia"']]));

fact('facts-io', 'Key Facts: Input and Output', 'Why does "5" + "5" not give 10?',
  'Quote marks make text. + joins text, so the two pieces are put side by side.',
  facts(['<strong>print()</strong> shows output on the screen. Text needs quote marks. A variable does not.',
    '<strong>input()</strong> waits for the user to type, then gives what they typed.',
    'input() always gives a <strong>String</strong>. The first thing typed goes into the first input().']),
  table(['<b>Function</b>', '<b>It turns a value into</b>'], [
    ['int()', 'a whole number (Integer)'], ['float()', 'a number with a decimal point (Real)'], ['str()', 'text (String), to join with + in print()']]));

fact('facts-programs', 'Key Facts: Programs Using Data Types', 'Why can a spelling slip in a variable name give no error at all?',
  'Storing to a new name just makes a new variable. Python does not know you meant the old one.',
  facts(['Choose the data type with two questions: <strong>Will the program do maths with it?</strong> If not, it is a String. <strong>Can it have a decimal point?</strong> Then it is a Real, if not an Integer.',
    'A Real and an Integer together give a Real. / always gives a Real.']),
  facts(['A number joined to text with + needs <strong>str()</strong> first.',
    'Use the <strong>same name every time</strong>. score and Score are two different variables: capital letters count.',
    'Using a name that was never stored stops the program with an error.']));

// ---------------------------------------------------------------- Data Bridge
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    why('Why answer from your notes, and not from memory alone?', 'Checking your notes while you answer fixes a gap before a test.') +
    `<p class="lesson-lead">${mins(1)}</p>` +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
    '<li><strong>Answer the exam questions</strong> on variables, input and output and data types to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' +
    why('Why write down what each variable holds, even in a game?', 'Each step on paper can be checked. A step done only in your head is easy to slip on.') +
    `<p class="lesson-lead">${mins(26)}Earn coins with exam questions, then build. Stop when your teacher starts the plenary.</p><div id="${P}-game"></div>`,
  embedQuery: `set=${SET}&goal=3` });

// ---------------------------------------------------------------- plenary: the 3.1 and 3.2 drills
steps.push(addTps(embed('plenary', 'Plenary: Choosing Algorithm Constructs (1 of 2)', 'drill-y7-3-1-constructs', 'Plenary: Choosing Algorithm Constructs (1 of 2)',
  mins(2) + 'New questions every time. Your progress is saved.'),
  'Which clue word will you look for first, and why?', 'Each person names their own, with a reason from their notes.'));
steps.push(addTps(embed('plenary-2', 'Plenary: Project Plans (2 of 2)', 'drill-y7-3-2-plans', 'Plenary: Project Plans (2 of 2)',
  mins(2) + 'New questions every time. Your progress is saved.'),
  'Which part of a project plan is the easiest to forget, and why?', 'Each person names their own, with a reason from their notes.'));

// ---------------------------------------------------------------- checks
assert(V('do-now', 0, 'pen costs 3.0') && V('do-now', 0, '"pen costs 3.0"') && !V('do-now', 0, 'pen costs 3') && !V('do-now', 0, 'pencosts3.0'), 'do-now a');
assert(V('do-now', 1, 'Real') && V('do-now', 1, 'float') && !V('do-now', 1, 'String') && V('do-now', 2, 'cap costs 8.0') && !V('do-now', 2, 'cap costs 8'), 'do-now b c');
assert(V('do-now-2', 0, 'Sequence') && !V('do-now-2', 0, 'selection') && V('do-now-2', 1, 'selection') && !V('do-now-2', 1, 'sequence'), 'do-now-2 a b');
assert(V('do-now-2', 2, 'if') && V('do-now-2', 2, 'Otherwise') && V('do-now-2', 2, '"If"') && !V('do-now-2', 2, 'score'), 'do-now-2 c');
checkLesson(steps, validators, {
  walkLeaks: { 'do-now': /pen costs|\b3\.0\b|\bfloat\b|\bReal\b/i, 'do-now-2': /\bsequence\b|\bselection\b|\bif\b|otherwise/i },
});
const total = steps.reduce((t, s) => { const m = /<strong>(\d+) minutes?\.<\/strong>/.exec(s.content); return t + (m ? Number(m[1]) : 0); }, 0);
assert(total === 55, 'minutes add to ' + total);
assert(!/data bridge/i.test(TITLE), 'title names a game');
steps.forEach((s) => assert(/class="lesson-tps"/.test(s.content), s.id + ' has no Think, Pair, Share'));
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

writeLesson(ID, TITLE, steps, validators);

// Register: a "Term 1b Revision" unit straight after Text-based Programming.
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  const all = JSON.parse(raw);
  const y7 = all.years.find((y) => y.id === 'year7');
  let unit = y7.units.find((u) => u.title === 'Term 1b Revision');
  if (!unit) {
    unit = { code: '', title: 'Term 1b Revision', lessons: [] };
    const after = y7.units.findIndex((u) => u.title === 'Text-based Programming');
    assert(after >= 0, 'Text-based Programming unit');
    y7.units.splice(after + 1, 0, unit);
  }
  if (!unit.lessons.includes(ID)) {
    unit.lessons.unshift(ID);
    const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
  }
}
console.log(`${ID}: ${steps.length} steps, ${total} minutes`);
