// Builds LessonData/y8-2-3-conditions.json: Year 8, Unit 2 Programming, Logic and Testing, 2.3 Conditional Statements
// (Notes and Data Bridge).
//   node tools/build_y8_2_3.mjs
// James, 2026-11-19: the class has not had 2.3 yet, so it becomes a Data Bridge lesson in the shape of
// tools/build_y11_2_1_gates.mjs: the Do Now, about 20 minutes of note-taking with NO interactive activities (static
// programs, side-by-side comparisons and output tables, a Your Notes slide after each idea saying exactly what to
// write), then Data Bridge (pages BridgeBuilder/, registry bridge-builder, set y8-conditions, shell
// ExamGameSetY8Conditions.gs). The earlier interactive version (drills, PyScratch Tasks, Explain Its, Circuit Siege) is
// kept unrun as tools/build_y8_2_3_conditions_interactive.mjs.bak; its drill files and PyScratchTask/tasks/y8-2-3.js
// stay in place, unused.
// Cambridge pseudocode with DECLARE lines. Every output on a slide comes from shared/pseudocode-engine.js. The engine
// has no CASE, so three outcomes use an IF inside the ELSE of another IF. AND, OR and NOT are 2.4; the testing words
// of 2.6 are not used: testing here is "one value for each branch, and the number written in the condition".
// Do Now (unchanged from the interactive version): 2.2 data types, then 2.1 and 2.2 DIV, MOD and a constant, each with
// a Walk me through it on a different program; then the Extension reusing the 2.2 plenary drill.
// About 20 minutes of notes:
//   title 1, condition 1.5, notes-condition 1.5, operators 1.5, notes-operators 1.5, edge 1.5, notes-edge 1.5,
//   nested 1.5, notes-nested 1.5, order 1.5, notes-order 1.5, testing 1.5, notes-testing 1.5, notes-ready 0.5
// Then: Data Bridge: Use Your Notes, Play: Data Bridge.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, assert, code, facts, columns, caption, note, hl, tps, table, outs, runError, num, makeLesson, checkLesson, esc, plain,
} from './y8_unit2_kit.mjs';

const ID = 'y8-2-3-conditions';
const P = 'y823';
const SET = 'y8-conditions';
const { validators, checkStep, embed, V } = makeLesson(P);
const TYPE_RE = {
  INTEGER: '^\\s*(an?\\s+)?(integer|int)\\s*[.!]?\\s*$',
  REAL: '^\\s*(an?\\s+)?real(\\s+number)?\\s*[.!]?\\s*$',
};
const two = (a, b, cols = '1fr 1fr') => `<div style="display:grid;grid-template-columns:${cols};gap:16px;align-items:start">${a}${b}</div>`;
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
const keyBox = (term, text) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:8px 14px;margin:10px 0 0;font-size:20px"><b>${term}</b> ${text}</div>`;
const why = (text) => `<p style="margin:10px 0 0;font-size:20px"><b>WHY?</b> ${text}</p>`;
const tpsP = (q, a) => tps(q, `<p>${a}</p>`);

const steps = [];

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

const TPS = {
  'do-now': ['Why does a program check the data type when a value is stored, and not later?', 'The wrong kind of value would cause problems in every line that uses it. Stopping at once shows exactly where it went in.'],
  'do-now-2': ['Why is the team size a constant and not a variable?', 'It is set once and the program never needs to change it while it runs.'],
  'do-now-ext': ['Why does each card use new values?', 'Then you practise the method, not one answer.'],
};
for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tpsP(TPS[st.id][0], TPS[st.id][1]));

// ---------------------------------------------------------------- notes slides
const GAME = '<strong>You will use these notes in Data Bridge.</strong>';
const NOTES = [];
function noteSlide(id, label, notes) {
  const boxes = notes.map(([head, text]) => {
    NOTES.push({ head, text });
    return `<div style="border-left:6px solid var(--brand);background:var(--surface-2);border-radius:8px;padding:6px 14px;margin:7px 0;font-size:20px"><b>${head}</b><br>${text}</div>`;
  }).join('');
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the pen icon at the top). Write the heading and the notes below. ' + GAME) + boxes };
}
// A table of what a program outputs for each value typed in, worked out by the engine.
const outTable = (heads, rows) => table(heads.map((h) => `<b>${h}</b>`), rows);

// ---------------------------------------------------------------- title (1 min)
steps.push({ id: 'title', label: '2.3: Conditional Statements',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Programming, Logic and Testing</p><h2 class="lesson-h2">2.3: Conditional Statements</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> about 20 minutes of notes. Then use your notes in <strong>Data Bridge</strong>.',
      '<strong>The big question:</strong> how does a program decide what to do, and how do we know it decides correctly?']) +
    tpsP('A game says "Game over" when your lives run out. What does the game need to check, and how often?', 'Collect ideas: it checks the number of lives, again and again. Today shows how a program asks a question like this and chooses what to do.') });

// ---------------------------------------------------------------- idea 1: a condition and its two branches (1.5 + 1.5)
const AGE = (op) => ['DECLARE Age : INTEGER', 'INPUT Age', `IF Age ${op} 13 THEN`, '    OUTPUT "Join the club"', 'ELSE', '    OUTPUT "Not yet"', 'ENDIF'];
assert(outs(AGE('>='), [12])[0] === 'Not yet' && outs(AGE('>='), [14])[0] === 'Join the club' && outs(AGE('>='), [14]).length === 1, 'condition');
steps.push({ id: 'condition', label: 'IF, THEN and ELSE',
  content: '<h2 class="lesson-h2">IF, THEN and ELSE</h2>' +
    two(code(AGE('>='), true, [3]),
      facts(['Line 3 holds the <strong>condition</strong>: Age &gt;= 13.', 'TRUE: the <strong>THEN branch</strong> runs (line 4).', 'FALSE: the <strong>ELSE branch</strong> runs (line 6).',
        `14 typed in: ${outs(AGE('>='), [14])[0]}. 12 typed in: ${outs(AGE('>='), [12])[0]}.`]), '1.1fr 1fr') +
    keyBox('Condition:', 'a question with only two answers, TRUE or FALSE.') +
    keyBox('Selection:', 'an IF statement selects which <b>branch</b> (group of lines) runs. Only one branch runs.') +
    why('A condition cannot be TRUE and FALSE at the same time, so the program never runs both branches.') +
    tpsP('A lift door opens when a button is pressed. Why does a program need a question with only two answers to decide this?', 'Ideas: the button is pressed or it is not. Two answers means the program always knows exactly which lines to run.') });
steps.push(noteSlide('notes-condition', 'Your Notes: IF, THEN and ELSE', [
  ['Condition', 'A question with only two answers: TRUE or FALSE. Example: Age &gt;= 13.'],
  ['Selection', 'An IF statement is a selection statement. TRUE: the THEN branch runs. FALSE: the ELSE branch runs.'],
  ['WHY only one branch runs', 'A condition cannot be TRUE and FALSE at the same time.']]));

// ---------------------------------------------------------------- idea 2: the six comparison operators (1.5 + 1.5)
const OPS = [['=', 'is equal to'], ['<>', 'is not equal to'], ['<', 'is less than'], ['<=', 'is less than or equal to'], ['>', 'is more than'], ['>=', 'is more than or equal to']];
const tf = (cond, setup) => outs([...setup, `IF ${cond} THEN`, '    OUTPUT "TRUE"', 'ELSE', '    OUTPUT "FALSE"', 'ENDIF'])[0];
const S10 = ['DECLARE Score : INTEGER', 'Score <- 10'];
const opRows = OPS.map(([o, m]) => [`<code>${esc(o)}</code>`, m, `<code>Score ${esc(o)} 10</code>`, tf(`Score ${o} 10`, S10)]);
assert(opRows.map((r) => r[3]).join() === 'TRUE,FALSE,FALSE,TRUE,FALSE,TRUE', 'operator table');
steps.push({ id: 'operators', label: 'Six Comparison Operators',
  content: '<h2 class="lesson-h2">Six Comparison Operators</h2>' +
    keyBox('Comparison operator:', 'a symbol that compares two values. The answer is TRUE or FALSE. Here Score is 10.') +
    '<div style="margin-top:10px">' + table(['Operator', 'Meaning', 'Example', 'Answer'], opRows) + '</div>' +
    why('Put the value into the condition first, then say the symbol in words: "10 is more than or equal to 10" is TRUE.') +
    tpsP('Why does = in a condition need a different symbol from the &lt;- that stores a value?', 'Ideas: &lt;- changes a variable. = only asks a question and changes nothing.') });
steps.push(noteSlide('notes-operators', 'Your Notes: Comparison Operators', [
  ['Comparison operator', 'A symbol that compares two values. The answer is TRUE or FALSE.'],
  ['Copy the six operators', '<code>=</code> equal to &nbsp; <code>&lt;&gt;</code> not equal to &nbsp; <code>&lt;</code> less than<br><code>&lt;=</code> less than or equal to &nbsp; <code>&gt;</code> more than &nbsp; <code>&gt;=</code> more than or equal to'],
  ['WHY say it in words', 'Put the value in, then read the symbol in words. Then you can see if it is TRUE or FALSE.']]));

// ---------------------------------------------------------------- idea 3: > and >= (1.5 + 1.5)
const edgeRows = [12, 13, 14].map((a) => [String(a), outs(AGE('>'), [a])[0], outs(AGE('>='), [a])[0]]);
assert(edgeRows.map((r) => r[1] === r[2]).join() === 'true,false,true', '> and >= differ only at 13');
steps.push({ id: 'edge', label: 'Compare: > and >=',
  content: '<h2 class="lesson-h2">Compare: &gt; and &gt;=</h2>' +
    '<p class="lesson-lead">The rule: pupils aged <strong>13 or older</strong> can join the club. Two programmers wrote line 3 differently.</p>' +
    columns(caption('A: IF Age &gt; 13 THEN') + caption('B: IF Age &gt;= 13 THEN') + note('13 &gt; 13 is FALSE. 13 &gt;= 13 is TRUE.'),
      outTable(['Age typed in', 'A outputs', 'B outputs'], edgeRows.map((r) => r[0] === '13' ? r.map((c) => `<span class="wt-hl">${c}</span>`) : r))) +
    keyBox('Rule words:', '"or more" is &gt;=. "more than" is &gt;. "or less" is &lt;=. "less than" and "under" are &lt;.') +
    why('Only 13, the number written in the condition, gives a different answer. B follows the rule.') +
    tpsP('Why do 12 and 14 not show which program is wrong?', 'Both programs give the same output for them. Only one value makes the two programs disagree.') });
steps.push(noteSlide('notes-edge', 'Your Notes: > and >=', [
  ['&gt; and &gt;=', '&gt; means more than: 13 &gt; 13 is FALSE. &gt;= means more than or equal to: 13 &gt;= 13 is TRUE.'],
  ['Rule words', '"or more": &gt;=. "more than": &gt;. "or less": &lt;=. "less than" or "under": &lt;.'],
  ['WHY check the number in the condition', 'It is the only value where &gt; and &gt;= give different answers.']]));

// ---------------------------------------------------------------- idea 4: an IF inside an IF (1.5 + 1.5)
const MEDAL = ['DECLARE Score : INTEGER', 'INPUT Score', 'IF Score >= 80 THEN', '    OUTPUT "Gold"', 'ELSE', '    IF Score >= 50 THEN', '        OUTPUT "Silver"', '    ELSE', '        OUTPUT "Bronze"', '    ENDIF', 'ENDIF'];
const medalRows = [[85, '85 &gt;= 80 is TRUE'], [65, '65 &gt;= 80 is FALSE, 65 &gt;= 50 is TRUE'], [30, '30 &gt;= 80 is FALSE, 30 &gt;= 50 is FALSE']]
  .map(([s, how]) => { const o = outs(MEDAL, [s]); assert(o.length === 1, 'one output for ' + s); return [String(s), how, o[0]]; });
assert(medalRows.map((r) => r[2]).join() === 'Gold,Silver,Bronze', 'nested');
steps.push({ id: 'nested', label: 'Three Outcomes: An IF Inside an IF',
  content: '<h2 class="lesson-h2">Three Outcomes: An IF Inside an IF</h2>' +
    two(code(MEDAL, true, [3, 6], true),
      outTable(['Score', 'Conditions checked', 'Output'], medalRows) + facts(['Each IF needs its own ENDIF.']), '0.9fr 1.1fr') +
    keyBox('Nested IF:', 'an IF inside the ELSE branch of another IF. It gives three outcomes.') +
    why('One IF has only two branches. The second IF splits the ELSE branch into two more.') +
    tpsP('For 85, why is line 6 never checked?', 'Ideas: 85 &gt;= 80 is TRUE, so the THEN branch runs and the whole ELSE branch is skipped.') });
steps.push(noteSlide('notes-nested', 'Your Notes: Nested IF', [
  ['Nested IF', 'An IF inside the ELSE branch of another IF. It gives three outcomes, like Gold, Silver and Bronze.'],
  ['How to trace it', 'Check the first IF. TRUE: its THEN branch runs and the whole ELSE is skipped. FALSE: go to the ELSE and check the second IF.'],
  ['WHY each IF needs its own ENDIF', 'The computer must know where each IF ends.']]));

// ---------------------------------------------------------------- idea 5: the order of the checks (1.5 + 1.5)
const ORD_A = ['DECLARE Score : INTEGER', 'INPUT Score', 'IF Score >= 50 THEN', '    OUTPUT "Silver"', 'ELSE', '    IF Score >= 80 THEN', '        OUTPUT "Gold"', '    ELSE', '        OUTPUT "Bronze"', '    ENDIF', 'ENDIF'];
assert(outs(ORD_A, [85])[0] === 'Silver' && outs(MEDAL, [85])[0] === 'Gold', 'order');
assert([...Array(121).keys()].every((s) => outs(ORD_A, [s])[0] !== 'Gold'), 'A never outputs Gold');
steps.push({ id: 'order', label: 'Compare: Which IF Comes First?',
  content: '<h2 class="lesson-h2">Compare: Which IF Comes First?</h2>' +
    '<p class="lesson-lead">Same rule: 80 or more is Gold, 50 to 79 is Silver. The checks are in a different order. 85 is typed in.</p>' +
    columns(caption(`A: 50 first. Output: ${outs(ORD_A, [85])[0]}`) + code(ORD_A, false, [3, 6], true),
      caption(`B: 80 first. Output: ${outs(MEDAL, [85])[0]}`) + code(MEDAL, false, [3, 6], true)) +
    why('Every score of 80 or more is also 50 or more. In A, the 50 check is TRUE first, so the Gold check is skipped. A can never output Gold.') +
    tpsP('Why is A wrong even though it runs with no error message?', 'Ideas: the computer runs what is written, not what the programmer meant. Only the output shows the mistake.') });
steps.push(noteSlide('notes-order', 'Your Notes: The Order of the Checks', [
  ['Order of the checks', 'With &gt;=, check the highest number first: IF Score &gt;= 80, then IF Score &gt;= 50 inside the ELSE.'],
  ['WHY 80 must come first', 'A score of 80 or more is also 50 or more. If the 50 check comes first, it is TRUE, the 80 check is skipped, and Gold is never output.'],
  ['No error message', 'A program can run with no error message and still give the wrong output.']]));

// ---------------------------------------------------------------- idea 6: testing every branch (1.5 + 1.5)
const CIN = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age > 65 THEN', '    OUTPUT 40', 'ELSE', '    OUTPUT 100', 'ENDIF'];
const expected = (a) => (a >= 65 ? '40' : '100');
const cinRows = [30, 70, 65].map((a) => { const o = outs(CIN, [a])[0]; return [String(a), expected(a), o, o === expected(a) ? 'Pass' : '<b>Fail</b>']; });
assert(cinRows.map((r) => r[3]).join() === 'Pass,Pass,<b>Fail</b>', 'test-paths');
steps.push({ id: 'testing', label: 'Test Every Branch',
  content: '<h2 class="lesson-h2">Test Every Branch</h2>' +
    '<p class="lesson-lead">The rule: a cinema ticket costs 40 baht for people aged <strong>65 or older</strong>, and 100 baht for everyone else.</p>' +
    two(code(CIN, true, [3], true),
      outTable(['Age typed in', 'Expected', 'Output', 'Result'], cinRows) , '0.9fr 1.1fr') +
    facts(['Test one value for <strong>each branch</strong>: 30 and 70 both pass.', 'Also test the <strong>number in the condition</strong>: 65 fails. Line 3 should use &gt;=.',
      'Write the <strong>expected</strong> output before you run the program.']) +
    why('A test passes only if the output matches the expected output. Without the expected output, a wrong answer can look fine.') +
    tpsP('Why is "it gave an answer" not enough to say a program works?', 'Ideas: the answer must match the rule. You need to know what it should be before you look.') });
steps.push(noteSlide('notes-testing', 'Your Notes: Test Every Branch', [
  ['Test every branch', 'Use at least one value for each branch. Three outcomes need at least three values.'],
  ['Test the number in the condition', 'For IF Age &gt; 65, also type in 65. That shows a &gt; and &gt;= mix-up.'],
  ['WHY write the expected output first', 'Then you can compare the real output with it and spot a mistake.']]));

// ---------------------------------------------------------------- notes ready (0.5), then Data Bridge
steps.push({ id: 'notes-ready', label: 'Your Notes: Ready for Data Bridge',
  content: '<h2 class="lesson-h2">Your Notes: Ready for Data Bridge</h2>' +
    todo('open your notes (the pen icon at the top). You should have these six headings. Missing one? Go back to its slide and write it. ' + GAME) +
    facts(['<strong>IF, THEN and ELSE</strong>: condition, selection and WHY only one branch runs.',
      '<strong>Comparison Operators</strong>: the six operators and what they mean.',
      '<strong>&gt; and &gt;=</strong>: the rule words and WHY to check the number in the condition.',
      '<strong>Nested IF</strong>: three outcomes and how to trace it.',
      '<strong>The Order of the Checks</strong>: WHY the highest number comes first.',
      '<strong>Test Every Branch</strong>: one value for each branch, the number in the condition, and the expected output.']) });
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
    '<li><strong>Answer the questions</strong> to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' + tpsP('Why keep your notes open while you play?', 'The questions use the same ideas. Your notes help you answer them right the first time.') + `<div id="${P}-game"></div>`,
  embedQuery: `set=${SET}&goal=3` });

// ---------------------------------------------------------------- self-checks
assert(V('do-now', 0, '5') && !V('do-now', 0, '2') && V('do-now', 1, 'REAL') && V('do-now', 1, 'a real') && !V('do-now', 1, 'INTEGER'), 'do-now marks');
assert(V('do-now-2', 0, '7') && !V('do-now-2', 0, '2') && V('do-now-2', 1, '2') && V('do-now-2', 2, '0') && !V('do-now-2', 2, '6'), 'do-now-2 marks');
{
  const a = plain(JSON.stringify(WT_TYPES.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b5\b|\bREAL\b|\bHeight\b|1\.47/.test(a), 'types walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_DIVMOD.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b7\b|\b2\b|\b0\b|\bTeamSize\b|\b30\b(?! is too many)/.test(b), 'DIV/MOD walkthrough leaks an answer');
}
const noteIds = steps.filter((s) => s.id.startsWith('notes-')).map((s) => s.id);
checkLesson(steps, validators, {
  noTps: [...noteIds, 'how-to-play'],
  teach: [[/\bconditions?\b/i, 'condition'], [/\bbranch(es)?\b/i, 'condition'], [/\bselect(ion|s)?\b/i, 'condition'], [/comparison operators?/i, 'operators'], [/\bnested\b/i, 'nested']],
});
const all = JSON.stringify({ steps, validators });
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'emoji found');
assert(!/test data|boundary|erroneous|\bCASE\b|\b(AND|OR)\b|Circuit Siege|PyScratch/.test(all), 'term outside this lesson');
assert(!/\bNOT\b/.test(all.replace(/<[^>]+>/g, ' ')), 'NOT is 2.4');
// Only the Do Now asks for answers. The notes part has nothing to answer; only the Do Now Extension drill and the game are embedded.
const firstNote = steps.findIndex((s) => s.id === 'title');
steps.forEach((s, i) => {
  if (i < firstNote) { assert(s.id.startsWith('do-now'), s.id + ' before the title'); return; }
  assert(!s.type || s.type === 'embedded-app', s.id + ' is an activity type: ' + s.type);
  if (s.type === 'embedded-app') assert(s.id === 'game', s.id + ' embeds ' + s.appId);
  assert(!/<input|<textarea|lesson-note-reveal|Check my|predict/i.test(s.content), s.id + ' asks for an answer');
});
assert(steps.slice(0, 3).map((s) => s.id).join() === 'do-now,do-now-2,do-now-ext' && steps[0].walkthrough && steps[1].walkthrough, 'Do Now, walkthroughs, Extension');
assert(steps[2].appId === 'drill-y8-2-2-data-types' && steps[2].content.includes('<strong>Extension:</strong>'), 'Extension');
// Every teaching slide asks WHY.
steps.slice(firstNote + 1).filter((s) => !s.id.startsWith('notes-') && !['how-to-play', 'game'].includes(s.id)).forEach((s) => assert(s.content.includes('<b>WHY?</b>'), s.id + ' has no WHY'));
assert(noteIds.join() === 'notes-condition,notes-operators,notes-edge,notes-nested,notes-order,notes-testing,notes-ready', 'notes slides ' + noteIds);
noteIds.forEach((id) => assert(steps.find((s) => s.id === id).content.includes('You will use these notes in Data Bridge.'), id + ' game line'));
assert(NOTES.length === 18 && NOTES.every((n) => n.head && n.text), 'notes ' + NOTES.length);
assert(NOTES.filter((n) => /^WHY/.test(n.head)).length >= 4, 'WHY notes');
const game = steps.at(-1);
assert(game.appId === 'bridge-builder' && game.embedQuery === `set=${SET}&goal=3` && steps.at(-2).id === 'how-to-play', 'game slides');
assert((steps.at(-2).content.match(/<li>/g) || []).length === 3, 'three lines on how to play');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
const MINUTES = { title: 1, condition: 1.5, 'notes-condition': 1.5, operators: 1.5, 'notes-operators': 1.5, edge: 1.5, 'notes-edge': 1.5,
  nested: 1.5, 'notes-nested': 1.5, order: 1.5, 'notes-order': 1.5, testing: 1.5, 'notes-testing': 1.5, 'notes-ready': 0.5 };
const total = Object.values(MINUTES).reduce((a, b) => a + b, 0);
assert(steps.slice(firstNote, -2).every((s) => MINUTES[s.id]) && Object.keys(MINUTES).length === steps.length - firstNote - 2 && total >= 18 && total <= 22, 'timing ' + total);

const lesson = { id: ID, label: '2.3: Conditional Statements', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
// Already listed in lessons.json after y8-2-2-data-types (Programming, Logic and Testing).
assert(fs.readFileSync(path.join(ROOT, 'LessonData', 'lessons.json'), 'utf8').includes(`"${ID}"`), 'listed in lessons.json');
console.log(`${ID}: ${steps.length} steps, ${NOTES.length} notes, about ${total} minutes of notes`);
