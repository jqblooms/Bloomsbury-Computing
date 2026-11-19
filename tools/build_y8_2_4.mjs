// Builds LessonData/y8-2-4-logic.json: Year 8, Unit 2 Programming, Logic and Testing, 2.4 AND, OR and NOT
// (Notes and Data Bridge).
//   node tools/build_y8_2_4.mjs
// James, 2026-11-19: the same shape as tools/build_y8_2_3.mjs. The Do Now, about 20 minutes of note-taking with NO
// interactive activities (static programs, side-by-side comparisons and output tables, a Your Notes slide after each
// idea saying exactly what to write), then Data Bridge (pages BridgeBuilder/, registry bridge-builder, set y8-logic,
// shell ExamGameSetY8Logic.gs).
// Plan (Week by week plan, Year 8 2.4): use AND, OR and NOT to create logic within algorithms; develop programs with
// rules involving AND, OR and NOT; predict the outcome of algorithms containing logical conditions (8CT.06, 8P.06, 8CT.07).
// Cambridge pseudocode with DECLARE lines. Every output on a slide comes from shared/pseudocode-engine.js. The engine
// has no CASE and no brackets in a condition, so no condition mixes AND with OR. The testing words of 2.6 are not used.
// Do Now: 2.3 a nested IF (the >= and > edges the classes find hard), then 2.2 data types (BOOLEAN, needed for NOT),
// each with a Walk me through it on a different program; then the Extension reusing the 2.3 drill.
// About 20 minutes of notes:
//   title 1, and 1.5, notes-and 1.5, or 1.5, notes-or 1.5, not 1.5, notes-not 1.5, between 1.5, notes-between 1.5,
//   outside 1.5, notes-outside 1.5, join 1.5, notes-join 1.5, notes-ready 0.5
// Then: Data Bridge: Use Your Notes, Play: Data Bridge.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, assert, code, facts, columns, caption, note, hl, tps, table, outs, runError, num, word, makeLesson, checkLesson, plain, registerY8Unit2,
} from './y8_unit2_kit.mjs';

const ID = 'y8-2-4-logic';
const P = 'y824';
const SET = 'y8-logic';
const { validators, checkStep, embed, V } = makeLesson(P);
const two = (a, b, cols = '1fr 1fr') => `<div style="display:grid;grid-template-columns:${cols};gap:16px;align-items:start">${a}${b}</div>`;
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
const keyBox = (term, text) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:8px 14px;margin:10px 0 0;font-size:20px"><b>${term}</b> ${text}</div>`;
const why = (text) => `<p style="margin:10px 0 0;font-size:20px"><b>WHY?</b> ${text}</p>`;
const tpsP = (q, a) => tps(q, `<p>${a}</p>`);
const outTable = (heads, rows) => table(heads.map((h) => `<b>${h}</b>`), rows);
const tf = (cond, setup) => outs([...setup, `IF ${cond} THEN`, '    OUTPUT "TRUE"', 'ELSE', '    OUTPUT "FALSE"', 'ENDIF'])[0];

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (2.3): a nested IF and its edges
const DN1 = ['DECLARE Points : INTEGER', 'INPUT Points', 'IF Points >= 90 THEN', '    OUTPUT "Distinction"', 'ELSE', '    IF Points > 60 THEN',
  '        OUTPUT "Pass"', '    ELSE', '        OUTPUT "Try again"', '    ENDIF', 'ENDIF'];
assert(outs(DN1, [90])[0] === 'Distinction' && outs(DN1, [60])[0] === 'Try again' && outs(DN1, [61])[0] === 'Pass', 'do-now 1');
assert([...Array(61).keys()].every((p) => outs(DN1, [p])[0] !== 'Pass'), 'do-now 1: 61 is the smallest Pass');
const WDN1 = ['DECLARE Temp : INTEGER', 'INPUT Temp', 'IF Temp >= 35 THEN', '    OUTPUT "Hot"', 'ELSE', '    IF Temp > 25 THEN',
  '        OUTPUT "Warm"', '    ELSE', '        OUTPUT "Cool"', '    ENDIF', 'ENDIF'];
assert(outs(WDN1, [35])[0] === 'Hot' && outs(WDN1, [25])[0] === 'Cool' && outs(WDN1, [26])[0] === 'Warm' && outs(WDN1, [25])[0] !== 'Warm', 'walkthrough 1');
const WT_NESTED = { title: 'Walk me through it: an IF inside an IF', steps: [
  { text: 'This is a different program. Do the same steps with your program.', visual: code(WDN1, true) },
  { text: '35 is input. Line 3: 35 &gt;= 35. &gt;= means more than or equal to. 35 is equal to 35, so it is TRUE. The THEN branch runs and the whole ELSE is skipped.', visual: code(WDN1, true, [3, 4]) + note('Output: ' + hl('Hot')) },
  { text: '25 is input. Line 3: 25 &gt;= 35 is FALSE, so go into the ELSE. Line 6: 25 &gt; 25. &gt; means more than, and 25 is not more than 25, so it is FALSE too.', visual: code(WDN1, true, [6, 9]) + note('Output: ' + hl('Cool')) },
  { text: 'The smallest whole number for Warm: try the number in the condition on line 6 first. 25 &gt; 25 is FALSE. The next whole number up is 26, and 26 &gt; 25 is TRUE.', visual: code(WDN1, true, [6, 7]) + note('Smallest for Warm: ' + hl('26')) },
  { text: 'Now do yours. Put the number into each condition and say the symbol in words.', visual: code(WDN1, true) },
] };
steps.push(checkStep('do-now', 'Do Now: An IF Inside an IF (1 of 2)', 'Do Now: An IF Inside an IF (1 of 2)', 'From 2.3.', [
  { label: 'What does the program output when 90 is input?', answer: word('Distinction'), feedback: 'Put 90 into the condition on line 3. Is it TRUE or FALSE?' },
  { label: 'What does the program output when 60 is input?', answer: word('Try\\s+again'), feedback: 'Line 3 is FALSE, so go into the ELSE. Say the symbol on line 6 in words.' },
  { line: true, label: 'What is the smallest whole number that outputs Pass?', answer: num(61), feedback: 'Try the number written on line 6 first. Is the condition TRUE for it?' },
], code(DN1, true, [], true)));
steps[steps.length - 1].walkthrough = WT_NESTED;

// ---------------------------------------------------------------- Do Now 2 (2.2): the BOOLEAN data type
const DN2 = ['DECLARE Shop : STRING', 'DECLARE Locked : INTEGER', 'DECLARE Price : REAL', 'Shop <- "Cafe"', 'Locked <- TRUE', 'Price <- 25.5', 'OUTPUT Shop'];
{ const e = runError(DN2); assert(e && e.line === 5, 'do-now 2 stops on line 5'); const f = DN2.slice(); f[1] = 'DECLARE Locked : BOOLEAN'; assert(outs(f)[0] === 'Cafe', 'do-now 2 fixed'); }
const WDN2 = ['DECLARE Team : INTEGER', 'DECLARE Goals : INTEGER', 'Goals <- 3', 'Team <- "Tigers"', 'OUTPUT Goals'];
{ const e = runError(WDN2); assert(e && e.line === 4, 'walkthrough 2'); const f = WDN2.slice(); f[0] = 'DECLARE Team : STRING'; assert(outs(f)[0] === '3', 'walkthrough 2 fixed'); }
const WT_TYPES = { title: 'Walk me through it: the wrong data type', steps: [
  { text: 'This is a different program. Do the same steps with your program.', visual: code(WDN2, false) },
  { text: 'DECLARE does not store anything. It only gives each variable its data type.', visual: code(WDN2, false, [1, 2]) },
  { text: 'Line 3 stores 3 in Goals. 3 is a whole number and Goals is an INTEGER, so that is fine.', visual: code(WDN2, false, [3]) },
  { text: 'Line 4 stores "Tigers" in Team. It is in quotes, so it is text. Team was declared as an INTEGER, so the program stops here.', visual: code(WDN2, false, [4]) + note('Team &lt;- "Tigers": ' + hl('stops here')) },
  { text: 'The fix goes on the DECLARE line. Text needs <strong>STRING</strong>, so line 1 becomes DECLARE Team : STRING. Now do yours: what kind of value is stored?', visual: code(WDN2, false, [1]) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Data Types (2 of 2)', 'Do Now: Data Types (2 of 2)', 'From 2.2: data types. The program stops with an error.', [
  { label: 'On which line does the program stop?', answer: num(5), feedback: 'DECLARE lines never stop it. Find the line that stores a value the variable cannot hold.' },
  { label: 'Which data type should Locked have?', answer: '^\\s*(an?\\s+)?(boolean|bool)\\s*[.!]?\\s*$', feedback: 'Look at the value stored in Locked. Is it a number, text, or something else?' },
], code(DN2, true)));
steps[steps.length - 1].walkthrough = WT_TYPES;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-2-3-conditions', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on conditions from 2.3. Stuck? Switch on <strong>I need help</strong> for a nudge or a similar question worked through.'));

const TPS = {
  'do-now': ['Why does the program check the highest number first?', 'A high score also passes the lower check. Checking the highest first means each score gets only the best result it earns.'],
  'do-now-2': ['Why does a value that is only ever TRUE or FALSE need its own data type?', 'The computer then knows only two values are allowed, and a condition can use the variable straight away.'],
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

// ---------------------------------------------------------------- title (1 min)
steps.push({ id: 'title', label: '2.4: AND, OR and NOT',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Programming, Logic and Testing</p><h2 class="lesson-h2">2.4: AND, OR and NOT</h2><p>Year 8</p></div>' +
    facts(['<strong>Today:</strong> about 20 minutes of notes. Then use your notes in <strong>Data Bridge</strong>.',
      '<strong>The big question:</strong> how can one IF check two rules at once, and why does the word we choose change the answer?']) +
    tpsP('A theme park ride has two rules: you must be old enough and tall enough. How could a program check both rules?', 'Collect ideas: one IF after another, or one IF that checks both. Today shows a way to join two conditions in one IF.') });

// ---------------------------------------------------------------- idea 1: AND (1.5 + 1.5)
const RIDE = ['DECLARE Age : INTEGER', 'DECLARE Height : INTEGER', 'INPUT Age', 'INPUT Height', 'IF Age >= 10 AND Height >= 140 THEN', '    OUTPUT "Ride"', 'ELSE', '    OUTPUT "Sorry"', 'ENDIF'];
const PAIRS = [[12, 150], [12, 130], [8, 150], [8, 130]];
const rideRows = PAIRS.map(([a, h]) => {
  const set = ['DECLARE Age : INTEGER', 'DECLARE Height : INTEGER', `Age <- ${a}`, `Height <- ${h}`];
  return [String(a), String(h), tf('Age >= 10', set), tf('Height >= 140', set), outs(RIDE, [a, h])[0]];
});
assert(rideRows.map((r) => r[4]).join() === 'Ride,Sorry,Sorry,Sorry', 'AND table');
steps.push({ id: 'and', label: 'AND: Both Must Be TRUE',
  content: '<h2 class="lesson-h2">AND: Both Must Be TRUE</h2>' +
    two(code(RIDE, true, [5], true), outTable(['Age', 'Height', 'Age &gt;= 10', 'Height &gt;= 140', 'Output'], rideRows), '1fr 1.1fr') +
    keyBox('Logical operator:', 'a word that joins two conditions or changes one. AND is the first of three you learn today.') +
    keyBox('AND:', 'the whole condition is TRUE only when <b>both</b> conditions are TRUE.') +
    why('The ride has two rules and both must be kept. So one FALSE is enough to say Sorry.') +
    tpsP('A door opens with a key card and the right PIN. Why must the program check both, not just one?', 'Ideas: someone with only a stolen card, or only the PIN, must not get in. Both rules must be kept.') });
steps.push(noteSlide('notes-and', 'Your Notes: AND', [
  ['Logical operator', 'A word that joins two conditions or changes one. There are three: write the other two when you learn them.'],
  ['AND', 'TRUE only when both conditions are TRUE. One FALSE makes the whole condition FALSE.<br>Example: IF Age &gt;= 10 AND Height &gt;= 140 THEN'],
  ['How to work it out', 'Put the values in. Write TRUE or FALSE above each condition first. Then join them.']]));

// ---------------------------------------------------------------- idea 2: OR (1.5 + 1.5)
const FREE = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age < 5 OR Age >= 65 THEN', '    OUTPUT "Free"', 'ELSE', '    OUTPUT "Pay"', 'ENDIF'];
const freeRows = [3, 30, 70].map((a) => {
  const set = ['DECLARE Age : INTEGER', `Age <- ${a}`];
  return [String(a), tf('Age < 5', set), tf('Age >= 65', set), outs(FREE, [a])[0]];
});
assert(freeRows.map((r) => r[3]).join() === 'Free,Pay,Free', 'OR table');
// The four ways two conditions can be: AND and OR worked out by the engine.
const B = ['DECLARE A : BOOLEAN', 'DECLARE B : BOOLEAN'];
const combos = [['TRUE', 'TRUE'], ['TRUE', 'FALSE'], ['FALSE', 'TRUE'], ['FALSE', 'FALSE']].map(([a, b]) => {
  const set = [...B, `A <- ${a}`, `B <- ${b}`];
  return [a, b, tf('A AND B', set), tf('A OR B', set)];
});
assert(combos.map((r) => r[2] + r[3]).join() === 'TRUETRUE,FALSETRUE,FALSETRUE,FALSEFALSE', 'AND and OR combos');
steps.push({ id: 'or', label: 'OR: At Least One Must Be TRUE',
  content: '<h2 class="lesson-h2">OR: At Least One Must Be TRUE</h2>' +
    '<p class="lesson-lead">The rule: entry is free for children under 5 and for people aged 65 or older.</p>' +
    two(code(FREE, true, [3], true), outTable(['Age', 'Age &lt; 5', 'Age &gt;= 65', 'Output'], freeRows), '1fr 1fr') +
    keyBox('OR:', 'the whole condition is TRUE when <b>at least one</b> condition is TRUE. It is FALSE only when both are FALSE.') +
    why('Each reason is enough on its own to get in free. So one TRUE is enough.') +
    tpsP('The rule says "children under 5 and people aged 65 or older", but the program uses OR. Why is OR right here?', 'Ideas: nobody is under 5 and 65 or older at the same time. Each person needs only one of the two reasons.') });
const comboTable = '<table class="donow-table" style="margin-top:4px">' + '<tr><th>First</th><th>Second</th><th>AND</th><th>OR</th></tr>' +
  combos.map((r) => '<tr>' + r.map((c) => `<td style="padding:2px 12px">${c}</td>`).join('') + '</tr>').join('') + '</table>';
steps.push(noteSlide('notes-or', 'Your Notes: OR', [
  ['OR', 'TRUE when at least one condition is TRUE. FALSE only when both are FALSE.<br>Example: IF Age &lt; 5 OR Age &gt;= 65 THEN'],
  ['Copy this table', comboTable],
  ['WHY the rule words can trick you', 'Read what each person needs. If one reason is enough, use OR, even if the rule says "and".']]));

// ---------------------------------------------------------------- idea 3: NOT (1.5 + 1.5)
const PLAY = (v) => ['DECLARE Raining : BOOLEAN', `Raining <- ${v}`, 'IF NOT Raining THEN', '    OUTPUT "Play outside"', 'ELSE', '    OUTPUT "Play inside"', 'ENDIF'];
assert(outs(PLAY('FALSE'))[0] === 'Play outside' && outs(PLAY('TRUE'))[0] === 'Play inside', 'NOT');
const notRows = [12, 13, 14].map((a) => { const set = ['DECLARE Age : INTEGER', `Age <- ${a}`]; return [String(a), tf('NOT Age >= 13', set), tf('Age < 13', set)]; });
assert(notRows.every((r) => r[1] === r[2]) && notRows.map((r) => r[1]).join() === 'TRUE,FALSE,FALSE', 'NOT Age >= 13 is Age < 13');
steps.push({ id: 'not', label: 'NOT: Change TRUE to FALSE',
  content: '<h2 class="lesson-h2">NOT: Change TRUE to FALSE</h2>' +
    columns(caption(`Raining is FALSE. Output: ${outs(PLAY('FALSE'))[0]}`) + code(PLAY('FALSE'), true, [3], true),
      caption(`Raining is TRUE. Output: ${outs(PLAY('TRUE'))[0]}`) + code(PLAY('TRUE'), true, [3], true)) +
    two(keyBox('NOT:', 'changes TRUE to FALSE, and FALSE to TRUE. NOT Raining is TRUE when Raining is FALSE.'),
      '<div style="margin-top:10px">' + outTable(['Age', 'NOT Age &gt;= 13', 'Age &lt; 13'], notRows) + '</div>', '1fr 1fr') +
    why('NOT with a BOOLEAN variable reads like English: "if not raining". NOT Age &gt;= 13 gives the same answers as Age &lt; 13.') +
    tpsP('Why is a BOOLEAN variable a good fit for NOT?', 'Ideas: it is already TRUE or FALSE, so NOT can change it straight away, and the line reads like a sentence.') });
steps.push(noteSlide('notes-not', 'Your Notes: NOT', [
  ['NOT', 'Changes TRUE to FALSE, and FALSE to TRUE.<br>Example: IF NOT Raining THEN runs its THEN branch when Raining is FALSE.'],
  ['NOT with a comparison', 'NOT Age &gt;= 13 means the same as Age &lt; 13.'],
  ['WHY use NOT', 'A BOOLEAN variable is already TRUE or FALSE. NOT Raining reads like English: "if not raining".']]));

// ---------------------------------------------------------------- idea 4: between two numbers, AND (1.5 + 1.5)
const BOOK = (cond) => ['DECLARE Seats : INTEGER', 'INPUT Seats', `IF ${cond} THEN`, '    OUTPUT "Accepted"', 'ELSE', '    OUTPUT "Rejected"', 'ENDIF'];
const IN_A = BOOK('Seats >= 1 AND Seats <= 6'), IN_B = BOOK('Seats >= 1 OR Seats <= 6');
const betweenRows = [0, 3, 9].map((s) => [String(s), outs(IN_A, [s])[0], outs(IN_B, [s])[0]]);
assert(betweenRows.map((r) => r[1] + '/' + r[2]).join() === 'Rejected/Accepted,Accepted/Accepted,Rejected/Accepted', 'between');
assert([...Array(41).keys()].every((s) => outs(IN_B, [s - 20])[0] === 'Accepted'), 'B accepts every number');
steps.push({ id: 'between', label: 'Compare: Between Two Numbers',
  content: '<h2 class="lesson-h2">Compare: Between Two Numbers</h2>' +
    '<p class="lesson-lead">The rule: a booking accepts <strong>1 to 6</strong> seats. Two programmers wrote line 3 differently.</p>' +
    columns(caption('A: IF Seats &gt;= 1 AND Seats &lt;= 6 THEN') + caption('B: IF Seats &gt;= 1 OR Seats &lt;= 6 THEN') +
      note('Every number is 1 or more, or 6 or less.'),
    outTable(['Seats', 'A outputs', 'B outputs'], betweenRows)) +
    keyBox('Range:', 'all the numbers from a lowest value to a highest value, like 1 to 6. A number inside a range needs two conditions joined with AND.') +
    why('With OR, one of the two conditions is always TRUE, so B accepts every number. AND needs both, so only 1 to 6 get in.') +
    tpsP('Why does testing B with 3 not show the mistake?', 'Ideas: 3 is inside the range, so both programs accept it. Only a number outside the range makes them disagree.') });
steps.push(noteSlide('notes-between', 'Your Notes: Inside a Range', [
  ['Range', 'All the numbers from a lowest value to a highest value, like 1 to 6.'],
  ['Inside a range: AND', 'IF Seats &gt;= 1 AND Seats &lt;= 6 THEN<br>The number must be at least the lowest AND at most the highest.'],
  ['WHY not OR', 'Every number is 1 or more, or 6 or less, so with OR the condition is always TRUE.']]));

// ---------------------------------------------------------------- idea 5: outside the range, OR (1.5 + 1.5)
const OUT = (cond) => ['DECLARE Seats : INTEGER', 'INPUT Seats', `IF ${cond} THEN`, '    OUTPUT "Rejected"', 'ELSE', '    OUTPUT "Accepted"', 'ENDIF'];
const OUT_A = OUT('Seats < 1 OR Seats > 6'), OUT_B = OUT('Seats < 1 AND Seats > 6');
const outRows = [0, 3, 9].map((s) => [String(s), outs(OUT_A, [s])[0], outs(OUT_B, [s])[0]]);
assert(outRows.map((r) => r[1] + '/' + r[2]).join() === 'Rejected/Accepted,Accepted/Accepted,Rejected/Accepted', 'outside');
assert([...Array(41).keys()].every((s) => outs(OUT_A, [s - 20])[0] === outs(IN_A, [s - 20])[0]), 'outside with OR matches inside with AND');
steps.push({ id: 'outside', label: 'Compare: Outside the Range',
  content: '<h2 class="lesson-h2">Compare: Outside the Range</h2>' +
    '<p class="lesson-lead">Same rule, 1 to 6 seats. This time line 3 looks for a number <strong>outside</strong> the range.</p>' +
    columns(caption('A: IF Seats &lt; 1 OR Seats &gt; 6 THEN') + caption('B: IF Seats &lt; 1 AND Seats &gt; 6 THEN') + code(OUT_A, true, [3], true),
      outTable(['Seats', 'A outputs', 'B outputs'], outRows)) +
    keyBox('Outside a range:', 'too low OR too high. Either one is enough to reject the number.') +
    why('No number is less than 1 and more than 6 at the same time. So B&#39;s condition is never TRUE, and B accepts every number.') +
    tpsP('Why does A use OR here, when the slide before used AND?', 'Ideas: inside the range a number must pass both checks. Outside the range, failing one check is enough.') });
steps.push(noteSlide('notes-outside', 'Your Notes: Outside a Range', [
  ['Outside a range: OR', 'IF Seats &lt; 1 OR Seats &gt; 6 THEN<br>Too low OR too high: either one is enough.'],
  ['Inside: AND. Outside: OR.', 'Inside: at least the lowest AND at most the highest. Outside: less than the lowest OR more than the highest.'],
  ['WHY not AND', 'No number is less than 1 and more than 6 at the same time, so with AND the condition is never TRUE.']]));

// ---------------------------------------------------------------- idea 6: AND or an IF inside an IF (1.5 + 1.5)
const RIDE_NEST = ['DECLARE Age : INTEGER', 'DECLARE Height : INTEGER', 'INPUT Age', 'INPUT Height', 'IF Age >= 10 THEN', '    IF Height >= 140 THEN',
  '        OUTPUT "Ride"', '    ELSE', '        OUTPUT "Sorry"', '    ENDIF', 'ELSE', '    OUTPUT "Sorry"', 'ENDIF'];
for (let a = 5; a <= 15; a++) for (let h = 120; h <= 160; h += 5) assert(outs(RIDE_NEST, [a, h])[0] === outs(RIDE, [a, h])[0], `join ${a} ${h}`);
const joinRows = PAIRS.map(([a, h]) => [String(a), String(h), outs(RIDE_NEST, [a, h])[0], outs(RIDE, [a, h])[0]]);
steps.push({ id: 'join', label: 'Compare: AND or an IF Inside an IF?',
  content: '<h2 class="lesson-h2">Compare: AND or an IF Inside an IF?</h2>' +
    columns(caption('A: an IF inside an IF') + code(RIDE_NEST, true, [5, 6], true),
      caption('B: one IF with AND') + code(RIDE, true, [5], true) + note(`Both programs: 12 and 150 give ${joinRows[0][2]}, the other three pairs give ${joinRows[1][2]}.`)) +
    why('Both give the same output every time. AND makes both checks in one condition, so "Sorry" is written once, not twice. Fewer lines means fewer places for a mistake.') +
    tpsP('Why might a programmer still choose A?', 'Ideas: A can give a different message for each rule, for example "Too young" or "Too short".') });
steps.push(noteSlide('notes-join', 'Your Notes: AND or a Nested IF', [
  ['Same outputs', 'IF Age &gt;= 10 AND Height &gt;= 140 does the same job as an IF Height &gt;= 140 inside IF Age &gt;= 10.'],
  ['WHY use AND', 'One condition, one ELSE: the "Sorry" line is written once. Fewer lines, fewer places for a mistake.'],
  ['WHY use a nested IF', 'When each rule needs its own message, like "Too young" and "Too short".']]));

// ---------------------------------------------------------------- notes ready (0.5), then Data Bridge
steps.push({ id: 'notes-ready', label: 'Your Notes: Ready for Data Bridge',
  content: '<h2 class="lesson-h2">Your Notes: Ready for Data Bridge</h2>' +
    todo('open your notes (the pen icon at the top). You should have these six headings. Missing one? Go back to its slide and write it. ' + GAME) +
    facts(['<strong>AND</strong>: logical operator, both must be TRUE, and how to work it out.',
      '<strong>OR</strong>: at least one TRUE, and the table of AND and OR.',
      '<strong>NOT</strong>: changes TRUE to FALSE, and NOT with a comparison.',
      '<strong>Inside a Range</strong>: AND, and WHY not OR.',
      '<strong>Outside a Range</strong>: OR, and WHY not AND.',
      '<strong>AND or a Nested IF</strong>: same outputs, and WHY use each one.']) });
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
assert(V('do-now', 0, 'Distinction') && V('do-now', 0, '"distinction"') && !V('do-now', 0, 'Pass'), 'do-now a');
assert(V('do-now', 1, 'Try again') && !V('do-now', 1, 'Pass'), 'do-now b');
assert(V('do-now', 2, '61') && !V('do-now', 2, '60') && !V('do-now', 2, '91'), 'do-now c');
assert(V('do-now-2', 0, '5') && !V('do-now-2', 0, '2') && V('do-now-2', 1, 'BOOLEAN') && V('do-now-2', 1, 'a boolean') && !V('do-now-2', 1, 'INTEGER'), 'do-now-2 marks');
{
  const a = plain(JSON.stringify(WT_NESTED.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/Distinction|Try again|\b61\b|\b90\b|\b60\b|Points/.test(a), 'nested walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_TYPES.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/BOOLEAN|\b5\b|Locked|TRUE/.test(b), 'types walkthrough leaks an answer');
}
const noteIds = steps.filter((s) => s.id.startsWith('notes-')).map((s) => s.id);
checkLesson(steps, validators, {
  noTps: [...noteIds, 'how-to-play'],
  teach: [[/\bAND\b/, 'and'], [/logical operators?/i, 'and'], [/\bOR\b/, 'or'], [/\bNOT\b/, 'not'], [/\branges?\b/i, 'between']],
});
const all = JSON.stringify({ steps, validators });
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'emoji found');
assert(!/test data|boundary|erroneous|\bCASE\b|Circuit Siege|PyScratch/.test(all), 'term outside this lesson');
// The engine cannot bracket a condition: no condition on a slide mixes AND with OR.
for (const s of steps) for (const [, c] of plain(s.content).matchAll(/\bIF\b(.*?)\bTHEN\b/g)) assert(!(/\bAND\b/.test(c) && /\bOR\b/.test(c)), s.id + ' mixes AND and OR: ' + c);
// Only the Do Now asks for answers. The notes part has nothing to answer; only the Do Now Extension drill and the game are embedded.
const firstNote = steps.findIndex((s) => s.id === 'title');
steps.forEach((s, i) => {
  if (i < firstNote) { assert(s.id.startsWith('do-now'), s.id + ' before the title'); return; }
  assert(!s.type || s.type === 'embedded-app', s.id + ' is an activity type: ' + s.type);
  if (s.type === 'embedded-app') assert(s.id === 'game', s.id + ' embeds ' + s.appId);
  assert(!/<input|<textarea|lesson-note-reveal|Check my|predict/i.test(s.content), s.id + ' asks for an answer');
});
assert(steps.slice(0, 3).map((s) => s.id).join() === 'do-now,do-now-2,do-now-ext' && steps[0].walkthrough && steps[1].walkthrough, 'Do Now, walkthroughs, Extension');
assert(steps[2].appId === 'drill-y8-2-3-conditions' && steps[2].content.includes('<strong>Extension:</strong>'), 'Extension');
// Every teaching slide asks WHY.
steps.slice(firstNote + 1).filter((s) => !s.id.startsWith('notes-') && !['how-to-play', 'game'].includes(s.id)).forEach((s) => assert(s.content.includes('<b>WHY?</b>'), s.id + ' has no WHY'));
assert(noteIds.join() === 'notes-and,notes-or,notes-not,notes-between,notes-outside,notes-join,notes-ready', 'notes slides ' + noteIds);
noteIds.forEach((id) => assert(steps.find((s) => s.id === id).content.includes('You will use these notes in Data Bridge.'), id + ' game line'));
assert(NOTES.length === 18 && NOTES.every((n) => n.head && n.text), 'notes ' + NOTES.length);
assert(NOTES.filter((n) => /^WHY/.test(n.head)).length >= 4, 'WHY notes');
const game = steps.at(-1);
assert(game.appId === 'bridge-builder' && game.embedQuery === `set=${SET}&goal=3` && steps.at(-2).id === 'how-to-play', 'game slides');
assert((steps.at(-2).content.match(/<li>/g) || []).length === 3, 'three lines on how to play');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
const MINUTES = { title: 1, and: 1.5, 'notes-and': 1.5, or: 1.5, 'notes-or': 1.5, not: 1.5, 'notes-not': 1.5, between: 1.5, 'notes-between': 1.5,
  outside: 1.5, 'notes-outside': 1.5, join: 1.5, 'notes-join': 1.5, 'notes-ready': 0.5 };
const total = Object.values(MINUTES).reduce((a, b) => a + b, 0);
assert(steps.slice(firstNote, -2).every((s) => MINUTES[s.id]) && Object.keys(MINUTES).length === steps.length - firstNote - 2 && total >= 18 && total <= 22, 'timing ' + total);
const lesson = { id: ID, label: '2.4: AND, OR and NOT', steps, validators, pseudocodeValidators: {} };
assert(!/Data Bridge/.test(lesson.label), 'the lesson title names the topic only');

fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
registerY8Unit2(ID, 'y8-2-3-conditions');
console.log(`${ID}: ${steps.length} steps, ${NOTES.length} notes, about ${total} minutes of notes`);
