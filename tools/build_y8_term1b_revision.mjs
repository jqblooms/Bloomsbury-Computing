// Builds LessonData/y8-term1b-revision.json: Year 8 Term 1b Revision, one 55-minute lesson driven by Data Bridge, in the
// shape of tools/build_acsl_c2_revision.mjs. Registers it in a "Term 1b Revision" unit after Programming, Logic and Testing.
//   node tools/build_y8_term1b_revision.mjs
// Shape: two Do Now slides (2.4 AND, then 2.1 and 2.2 library functions and data types), each with a Walk me through it
// on a different program; a short key-facts slide per Term 1b topic (3.1 and 3.2 models, 2.1, 2.2, 2.3, 2.4); Data Bridge:
// Use Your Notes; Data Bridge on the combined Exam Game set y8-term1b-revision (shell ExamGameSetY8Term1bRevision.gs:
// y8-data-types, y8-conditions, y8-logic; the models lessons have no set); then the 2.2 and 2.3 plenary drills.
// A teacher-only Think, Pair, Share under every heading never gives a slide answer.
// Every output comes from shared/pseudocode-engine.js.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, assert, code, facts, columns, note, hl, tps, table, outs, num, word, makeLesson, plain } from './y8_unit2_kit.mjs';

const ID = 'y8-term1b-revision';
const P = 'y8t1b';
const SET = 'y8-term1b-revision';
const TITLE = 'Year 8 Term 1b Revision';
const { validators, checkStep, embed, V } = makeLesson(P);
const steps = [];
const mins = (n) => `<strong>${n} minutes.</strong> `;
const why = (q, a) => tps(q, `<p>${a}</p>`);
const addTps = (s, q, a) => { s.content = s.content.replace('</h2>', '</h2>' + why(q, a)); return s; };

// ---------------------------------------------------------------- Do Now 1 (2.4): AND and a range
const DN1 = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age >= 13 AND Age <= 19 THEN', '    OUTPUT "Teen"', 'ELSE', '    OUTPUT "Not teen"', 'ENDIF'];
assert(outs(DN1, [19])[0] === 'Teen' && outs(DN1, [12])[0] === 'Not teen' && outs(DN1, [13])[0] === 'Teen', 'do-now 1');
assert([...Array(13).keys()].every((a) => outs(DN1, [a])[0] !== 'Teen'), 'do-now 1: 13 is the smallest');
const WDN1 = ['DECLARE Temp : INTEGER', 'INPUT Temp', 'IF Temp >= 20 AND Temp <= 30 THEN', '    OUTPUT "Nice"', 'ELSE', '    OUTPUT "Not nice"', 'ENDIF'];
assert(outs(WDN1, [30])[0] === 'Nice' && outs(WDN1, [31])[0] === 'Not nice' && outs(WDN1, [20])[0] === 'Nice' && outs(WDN1, [19])[0] === 'Not nice', 'walk 1');
const WT_AND = { title: 'Walk me through it: AND', steps: [
  { text: 'This is a different program. Do the same steps with your program.', visual: code(WDN1, true) },
  { text: '30 is input. Line 3 has two conditions. 30 &gt;= 20 is TRUE. 30 &lt;= 30 is TRUE, because 30 is equal to 30. With AND, both are TRUE, so the THEN branch runs.', visual: code(WDN1, true, [3, 4]) + note('Output: ' + hl('Nice')) },
  { text: '31 is input. 31 &gt;= 20 is TRUE. 31 &lt;= 30 is FALSE. With AND, one FALSE makes the whole condition FALSE, so the ELSE branch runs.', visual: code(WDN1, true, [3, 6]) + note('Output: ' + hl('Not nice')) },
  { text: 'The smallest whole number for Nice: try the number in the first condition. 20 &gt;= 20 is TRUE and 20 &lt;= 30 is TRUE. One less does not work: it is not &gt;= 20.', visual: code(WDN1, true, [3]) + note('Smallest for Nice: ' + hl('20')) },
  { text: 'Now do yours. Put the number into each condition and write TRUE or FALSE above it.', visual: code(WDN1, true) },
] };
steps.push(addTps(checkStep('do-now', 'Do Now: AND (1 of 2)', 'Do Now: AND (1 of 2)', mins(4) + 'From 2.4.', [
  { label: 'What does the program output when 19 is input?', answer: word('Teen'), feedback: 'Put 19 into both conditions on line 3. Are they both TRUE?' },
  { label: 'What does the program output when 12 is input?', answer: word('Not\\s+teen'), feedback: 'Put 12 into the first condition on line 3. With AND, one FALSE is enough.' },
  { line: true, label: 'What is the smallest whole number that outputs Teen?', answer: num(13), feedback: 'Try the number written in the first condition. Is it TRUE for that number?' },
], code(DN1, true)), 'Why does a range like this need AND, and not OR?', 'Both edges must hold at the same time: the number must be above the bottom edge and below the top edge.'));
steps.at(-1).walkthrough = WT_AND;

// ---------------------------------------------------------------- Do Now 2 (2.1 and 2.2): library functions and a data type
const DN2 = ['DECLARE Price : REAL', 'DECLARE Name : STRING', 'Price <- 4.75', 'Name <- "Pen"', 'OUTPUT ROUND(Price, 0)', 'OUTPUT LENGTH(Name)'];
const o2 = outs(DN2);
assert(o2[0] === '5' && o2[1] === '3', 'do-now 2 ' + o2);
const WDN2 = ['DECLARE Cost : REAL', 'DECLARE Item : STRING', 'Cost <- 8.4', 'Item <- "Lamp"', 'OUTPUT ROUND(Cost, 0)', 'OUTPUT LENGTH(Item)'];
const w2 = outs(WDN2);
assert(w2[0] === '8' && w2[1] === '4', 'walk 2 ' + w2);
const WT_LIB = { title: 'Walk me through it: library functions', steps: [
  { text: 'This is a different program. Do the same steps with your program.', visual: code(WDN2, true) },
  { text: 'Line 5 calls ROUND. The value of Cost goes in, then 0 decimal places. 8.4 is nearer to 8 than to 9.', visual: code(WDN2, true, [3, 5]) + note('Output: ' + hl('8')) },
  { text: 'Line 6 calls LENGTH. It counts the characters in the text. L, a, m, p: four characters. The quotes do not count.', visual: code(WDN2, true, [4, 6]) + note('Output: ' + hl('4')) },
  { text: 'A data type: look at the value. Quotes: text. A whole number: INTEGER. A number with a decimal part: REAL. Now do yours.', visual: code(WDN2, true, [1, 2]) },
] };
steps.push(addTps(checkStep('do-now-2', 'Do Now: Library Functions and Data Types (2 of 2)', 'Do Now: Library Functions and Data Types (2 of 2)', mins(4) + 'From 2.1 and 2.2.', [
  { label: 'What does line 5 output?', answer: num(5), feedback: 'ROUND with 0 decimal places gives the nearest whole number. Is 4.75 nearer to 4 or to 5?' },
  { label: 'What does line 6 output?', answer: num(3), feedback: 'LENGTH counts the characters in the text. The quotes do not count.' },
  { line: true, label: 'Which data type holds only TRUE or FALSE?', answer: '^\\s*(an?\\s+)?(boolean|bool)\\s*[.!]?\\s*$', feedback: 'It is not a number and not text. Which data type has only two values?' },
], code(DN2, true)), 'Why is it quicker to call a library function than to write the code yourself?', 'The code is already written and tested. You only need to know what goes in and what comes out.'));
steps.at(-1).walkthrough = WT_LIB;

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: TITLE,
  content: `<div class="lesson-title-slide"><p class="lesson-title-kicker">Year 8</p><h2 class="lesson-h2">${TITLE}</h2><p>Models, library functions, data types, IF and AND, OR, NOT</p></div>` +
    why('Why check your notes now, before the questions start?', 'A gap you find now can be fixed before it costs marks in a question.') +
    facts([mins(1) + '<strong>Today:</strong> the key facts for each topic, then exam questions in Data Bridge.']) });

// ---------------------------------------------------------------- key facts
const fact = (id, label, q, a, left, right) => steps.push({ id, label,
  content: `<h2 class="lesson-h2">${label}</h2>` + why(q, a) + `<p class="lesson-lead">${mins(3)}Add anything you had forgotten to your notes.</p>` + columns(left, right) });

fact('facts-models', 'Key Facts: Models and Data', 'Why can a model give a wrong prediction even when its rules are right?',
  'The prediction is worked out from the data that goes in. Wrong or missing data gives a wrong prediction.',
  facts(['A <strong>model</strong> is a simple computer version of a real system. It predicts what will happen.',
    'A <strong>simulator</strong> is a model you use like the real thing, for example a flight simulator.',
    'The parts: <strong>inputs</strong> (the data), <strong>rules</strong> (the calculations), <strong>outputs</strong> (the predictions).']),
  facts(['Models are <strong>safer</strong>, <strong>cheaper</strong> and <strong>faster</strong>, and you can ask "What if?"',
    '<strong>Garbage in, garbage out:</strong> good data is correct, up to date and complete.',
    'The <strong>data requirements</strong> are the data the rule uses. A different job needs different data.']));

fact('facts-libraries', 'Key Facts: Library Functions', 'Why do you only need to know what goes in and what comes out of a library function?',
  'Someone else wrote and tested the lines inside, so you can use it without reading them.',
  facts(['A <strong>library</strong> is code that is already written and tested, ready to use.',
    'Call a <strong>library function</strong>: its name, then the values it needs in brackets. It gives back one value.',
    'DECLARE, INPUT and OUTPUT are part of the language, not library functions.']),
  table(['<b>Call</b>', '<b>What it gives back</b>'], [
    ['MOD(20, 6)', 'the remainder'], ['DIV(20, 6)', 'the whole number of times'],
    ['ROUND(3.456, 1)', 'the number rounded to 1 decimal place'], ['LENGTH("Hat Yai")', 'how many characters'],
    ['UCASE("cat")', 'the text in capital letters'], ['RANDOM()', 'a random number from 0 to 1']]));

fact('facts-types', 'Key Facts: Data Types and Constants', 'Why does "13" in quotes not act like the number 13?',
  'Quotes make a value text. The computer does not do sums with text.',
  table(['<b>Data type</b>', '<b>Holds</b>', '<b>Example</b>'], [
    ['INTEGER', 'a whole number', '13'], ['REAL', 'a number with a decimal part', '2.5'],
    ['STRING', 'text, in quotes', '"Cafe"'], ['BOOLEAN', 'only TRUE or FALSE', 'TRUE']]),
  facts(['<strong>DECLARE</strong> gives each variable its data type before it is used.',
    'A value of the wrong type stops the program on that line.',
    'A <strong>constant</strong> holds a value that never changes while the program runs: CONSTANT VAT &lt;- 0.07',
    'Change a constant in one place and every line that uses it changes.']));

fact('facts-conditions', 'Key Facts: Conditional Statements', 'Why must you test every branch of an IF?',
  'A mistake in one branch only shows when that branch runs, so each branch needs its own test value.',
  facts(['<strong>Selection:</strong> IF a condition is TRUE, the THEN branch runs. If it is FALSE, the ELSE branch runs.',
    'Comparison operators: = , &lt;&gt; (not equal), &gt; , &lt; , &gt;= , &lt;=',
    '<strong>&gt; and &gt;=:</strong> &gt;= is TRUE when the two values are equal. &gt; is not.']),
  facts(['<strong>Nested IF:</strong> an IF inside the ELSE gives three outcomes.',
    'Check the highest number first. A high number also passes the lower checks.',
    'Test every branch, and test the edge numbers.']));

fact('facts-logic', 'Key Facts: AND, OR and NOT', 'Why is OR the right choice for a number outside a range?',
  'A number outside the range is below the bottom edge or above the top edge. It can never be both.',
  table(['<b>Operator</b>', '<b>The whole condition is TRUE when</b>'], [
    ['AND', 'both conditions are TRUE'], ['OR', 'at least one condition is TRUE'], ['NOT', 'the condition is FALSE (it swaps TRUE and FALSE)']]),
  facts(['<strong>Inside a range:</strong> Mark &gt;= 50 AND Mark &lt;= 100',
    '<strong>Outside a range:</strong> Mark &lt; 0 OR Mark &gt; 100',
    'AND does the same job as an IF inside an IF.',
    'Put the values in and write TRUE or FALSE above each condition.']));

// ---------------------------------------------------------------- Data Bridge
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    why('Why answer from your notes, and not from memory alone?', 'Checking your notes while you answer fixes a gap before a test.') +
    `<p class="lesson-lead">${mins(1)}</p>` +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
    '<li><strong>Answer the exam questions</strong> on data types, IF and AND, OR, NOT to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' +
    why('Why put each value into the condition on paper, even in a game?', 'Each step on paper can be checked. A step done only in your head is easy to slip on.') +
    `<p class="lesson-lead">${mins(26)}Earn coins with exam questions on every topic, then build. Stop when your teacher starts the plenary.</p><div id="${P}-game"></div>`,
  embedQuery: `set=${SET}&goal=3` });

// ---------------------------------------------------------------- plenary: the 2.2 and 2.3 drills
steps.push(addTps(embed('plenary', 'Plenary: Data Types and Constants (1 of 2)', 'drill-y8-2-2-data-types', 'Plenary: Data Types and Constants (1 of 2)',
  mins(2) + 'New questions every time. Your progress is saved.'),
  'Which data type mistake will you watch for, and why?', 'Each person names their own, for example a number in quotes, because it stops the program or gives the wrong result.'));
steps.push(addTps(embed('plenary-2', 'Plenary: Conditional Statements (2 of 2)', 'drill-y8-2-3-conditions', 'Plenary: Conditional Statements (2 of 2)',
  mins(2) + 'New questions every time. Your progress is saved.'),
  'Which part of an IF do you check most carefully, and why?', 'Each person names their own, for example the edge number with &gt; and &gt;=, because one value can change the branch.'));

// ---------------------------------------------------------------- checks
assert(V('do-now', 0, 'Teen') && !V('do-now', 0, 'Not teen') && V('do-now', 1, 'not teen') && V('do-now', 2, '13') && !V('do-now', 2, '12') && !V('do-now', 2, '14'), 'do-now marks');
assert(V('do-now-2', 0, '5') && !V('do-now-2', 0, '4.75') && V('do-now-2', 1, '3') && !V('do-now-2', 1, '5') && V('do-now-2', 2, 'BOOLEAN') && !V('do-now-2', 2, 'STRING'), 'do-now-2 marks');
{
  const a = plain(JSON.stringify(WT_AND.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/Teen|\b19\b|\b12\b|\b13\b|Age/.test(a), 'AND walkthrough leaks an answer');
  // Line numbers (Line 5, the 03 and 05 in the code box) are not answers.
  const b = plain(JSON.stringify(WT_LIB.steps.map((x) => x.text.replace(/Line \d/g, '') + ' ' + (x.visual.match(/wt-note">[^<]*(<span[^>]*>[^<]*<\/span>)?/g) || []).join(' '))));
  assert(!/BOOLEAN|\b5\b|\b3\b|Pen|4\.75/.test(b), 'library walkthrough leaks an answer');
}
const total = steps.reduce((t, s) => { const m = /<strong>(\d+) minutes?\.<\/strong>/.exec(s.content); return t + (m ? Number(m[1]) : 0); }, 0);
assert(total === 55, 'minutes add to ' + total);
assert(!/data bridge/i.test(TITLE), 'title names a game');
steps.forEach((s) => assert(/class="lesson-tps"/.test(s.content), s.id + ' has no Think, Pair, Share'));
const all = JSON.stringify({ steps, validators });
assert(!/[–—]|&mdash;|&ndash;|mario/i.test(all), 'dash or game mention');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify({ id: ID, label: TITLE, steps, validators, pseudocodeValidators: {} }, null, 1) + '\n');

// Register: a "Term 1b Revision" unit straight after Programming, Logic and Testing (a small text edit).
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const at = raw.indexOf('"title": "Programming, Logic and Testing"');
    assert(at > 0, 'Programming, Logic and Testing unit');
    const m = /\n([ \t]*)\},/.exec(raw.slice(at));
    const ind = m[1];
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    const insertAt = at + m.index + m[0].length;
    const unit = `${nl}${ind}{${nl}${ind}  "code": "",${nl}${ind}  "title": "Term 1b Revision",${nl}${ind}  "lessons": [${nl}${ind}    "${ID}"${nl}${ind}  ]${nl}${ind}},`;
    fs.writeFileSync(lp, raw.slice(0, insertAt) + unit + raw.slice(insertAt));
    JSON.parse(fs.readFileSync(lp, 'utf8'));
  }
}
console.log(`${ID}: ${steps.length} steps, ${total} minutes`);
