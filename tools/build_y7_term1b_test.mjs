// Builds the Year 7 Term 1b Test: the test itself (written into the shell repo's TestBank.gs, between the y7-term1b
// markers), the revision drill y7-term1b-practice and the lesson y7-term1b-test (20 minutes on that drill, then a link
// to the Tests page).
//   node tools/build_y7_term1b_test.mjs [--dry]
// Same format as tools/build_y8_term1b_test.mjs: choices are hinge questions (four options, each wrong one the answer
// a common mistake gives), most marks are typed answers found by tracing a program, and no question gives away
// another. Content is what Year 7 met after the Term 1 test: 3.1 sequence or selection (flowcharts), 3.2 project
// plans, and Unit 2 in Python: 2.1 variables and data types, 2.2 input and output with int(), float() and str(),
// 2.3 programs using data types (a 0 lost by int(), names that must match). Bands: accessible (a data type, a line
// that stores a value, a stage), middle (a variable changed twice, input joined as Strings, int() then maths, the
// line that stops) and stretch (/ always gives a Real, a = b then b = a, a typed name slip, a flowchart with a
// decision on the boundary, writing a program). Every Python answer comes from running it in Skulpt (the same Python
// as Python Lab), every flowchart answer from Drills/flowchart-core.js.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, assert, py, writeDrill, TYPE_RE } from './y7_text_kit.mjs';

const SHELL = process.env.BC_SHELL_DIR || path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const DRY = process.argv.includes('--dry'); // checks only, writes nothing

async function out(lines, inputs = []) {
  const r = await py(lines.join('\n'), inputs.map(String));
  if (r.error) throw new Error(r.error + '\n' + lines.join('\n'));
  return r.out.join('\n');
}
async function stops(lines, inputs = []) { const r = await py(lines.join('\n'), inputs.map(String)); return r.error ? r.out.length : -1; }
const choice = (q) => Object.assign({ type: 'choice', marks: 1 }, q);
const accRe = (src) => (a) => new RegExp(src, 'i').test(a);

// ---------------------------------------------------------------- 2.1 variables and data types
const TRACE = ['score = 4', 'score = score + 3', 'score = score * 2', 'print(score)'];
assert(await out(TRACE) === '14', 'TRACE');
const JOIN3 = ['a = "3"', 'b = a + a', 'print(b + "1")'];
assert(await out(JOIN3) === '331', 'JOIN3');
const DIV = ['total = 9', 'share = total / 3', 'print(share)'];
assert(await out(DIV) === '3.0', 'DIV');
const SWAP = ['a = 3', 'b = 8', 'a = b', 'b = a', 'print(a + b)'];
assert(await out(SWAP) === '16', 'SWAP');
const LIVES_OPTS = ['lives = 7', 'lives = "7"', 'lives = 7.0', '7 = lives'];
assert(await out([LIVES_OPTS[0], 'print(type(lives).__name__)']) === 'int' && await out([LIVES_OPTS[1], 'print(type(lives).__name__)']) === 'str'
  && await out([LIVES_OPTS[2], 'print(type(lives).__name__)']) === 'float' && await stops([LIVES_OPTS[3]]) === 0, 'LIVES options');
const REAL_ACCEPT = ['Real', 'a Real', 'Real number', 'a Real number', 'float', 'a float', 'Real (float)'];
REAL_ACCEPT.forEach((a) => assert(accRe(TYPE_RE.float)(a), 'Real accept ' + a));

// ---------------------------------------------------------------- 2.2 input and output
const JOIN_IN = ['a = input("Number? ")', 'b = input("Number? ")', 'print(a + b)'];
assert(await out(JOIN_IN, [6, 3]) === '63', 'JOIN_IN');
const AGE = ['age = int(input("Age? "))', 'age = age + 3', 'print(age * 2)'];
assert(await out(AGE, [12]) === '30', 'AGE');
const FLOAT = ['n = float(input("Number? "))', 'print(n * 4)'];
assert(await out(FLOAT, ['2.5']) === '10.0', 'FLOAT');
const ADD1 = ['age = input("Age? ")', 'print(age + 1)'];
assert(await stops(ADD1, [12]) === 0, 'ADD1 stops');
const GOALS = ['name = input("Name? ")', 'goals = int(input("Goals? "))', 'print(name, "scored", goals * 2)'];
assert(await out(GOALS, ['Mali', 3]) === 'Mali scored 6', 'GOALS');
// b6: the number of people in a queue is a whole number: int() makes it one, and the program can do maths with it.
assert(await out(['people = int(input("People? "))', 'print(people + 1)'], [14]) === '15' && await stops(['people = input("People? ")', 'print(people + 1)'], [14]) === 0, 'QUEUE');

// ---------------------------------------------------------------- 2.3 programs using data types
const PHONE = ['phone = int(input("Phone? "))', 'print(phone)'];
assert(await out(PHONE, ['0891234567']) === '891234567', 'PHONE');
const CASE = ['coins = 5', 'coins = coins + 2', 'print(Coins)'];
assert(await stops(CASE) === 0, 'CASE stops');
const TYPO = ['total = 10', 'totla = total + 4', 'total = total * 2', 'print(total)'];
assert(await out(TYPO) === '20', 'TYPO');
const WHICH = ['name = input("Name? ")', 'age = int(input("Age? "))', 'print("Hi " + name)', 'print("Age: " + age)', 'print(age + 1)'];
assert(await stops(WHICH, ['Nok', 11]) === 1, 'WHICH stops after printing one line, so on line 4');
// c5: a model answer for the written program runs.
assert(await out(['pupils = int(input("Pupils? "))', 'cost = float(input("Cost? "))', 'print(pupils * cost)'], [20, '85.50']) === '1710.0', 'TRIP model');

// ---------------------------------------------------------------- 3.1 sequence or selection, 3.2 project plans
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
const chart = (flow, maxH = 420) => `<div class="test-fc" style="${THEME};display:flex;justify-content:center">` +
  FC.svg(flow, !!flow.numbered).replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
const FLOW = { nodes: [
  { id: 's', type: 'terminal', text: 'Start' }, { id: 'm', type: 'process', text: 'Move 20 steps' }, { id: 'd', type: 'decision', text: 'Score > 50?' },
  { id: 't1', type: 'io', text: 'Say "Win"' }, { id: 't2', type: 'process', text: 'Move 30 steps' }, { id: 'f', type: 'process', text: 'Move 10 steps' },
  { id: 'j', type: 'process', text: 'Move 5 steps' }, { id: 'e', type: 'terminal', text: 'End' },
], edges: [
  { from: 's', to: 'm', label: null }, { from: 'm', to: 'd', label: null }, { from: 'd', to: 't1', label: 'True' }, { from: 't1', to: 't2', label: null },
  { from: 't2', to: 'j', label: null }, { from: 'd', to: 'f', label: 'False' }, { from: 'f', to: 'j', label: null }, { from: 'j', to: 'e', label: null },
] };
const flowSteps = FC.run(FLOW, { values: { Score: 50 } }).steps;
assert(flowSteps === 35 && FC.run(FLOW, { values: { Score: 51 } }).steps === 55, 'FLOW ' + flowSteps);
const TASKS = [['A', 'Write the Python code for the game.'], ['B', 'Make the game better after players try it.'], ['C', 'Decide what the game must do.'],
  ['D', 'Play the game to find mistakes.'], ['E', 'Draw the flowchart for the game.']];
const STAGE_OF = { C: 'Decide', E: 'Design', A: 'Build', D: 'Test', B: 'Improve' };
const ORDER = ['Decide', 'Design', 'Build', 'Test', 'Improve'].map((s) => Object.keys(STAGE_OF).find((k) => STAGE_OF[k] === s)).join('');
assert(ORDER === 'CEADB', 'ORDER ' + ORDER);
const orderAccept = [ORDER, ORDER.split('').join(' '), ORDER.split('').join(','), ORDER.split('').join(', '), ORDER.split('').join(' , ')];

// ---------------------------------------------------------------- the test
const test = {
  id: 'y7-term1b', title: 'Year 7 Term 1b Test', subtitle: 'Variables, data types, input and output, sequence and selection, project plans', year: 'year7', minutes: 30,
  sections: [
    { title: 'Variables and Data Types', questions: [
      choice({ id: 'a1', prompt: 'A game starts with 7 lives. Lives are whole numbers, and the game adds to them later. Which line stores the 7 with the right data type?',
        options: LIVES_OPTS, answer: LIVES_OPTS[0], scheme: 'lives = 7 stores the Integer 7. "7" is a String, 7.0 is a Real, and the variable name must be on the left of =.' }),
      { id: 'a2', type: 'short', input: 'text', marks: 1, prompt: 'Which data type should a program use for a student\'s height in metres, like 1.52? Type Integer, Real or String.',
        accept: REAL_ACCEPT, placeholder: 'Integer, Real or String', scheme: 'Real: a height can have a decimal point, and the program can do maths with it.' },
      { id: 'a3', type: 'short', input: 'number', marks: 1, prompt: 'What does this program print?', code: TRACE, numbered: true, accept: ['14'],
        scheme: 'score is 4, then 4 + 3 = 7, then 7 * 2 = 14. (11 uses the first value on line 3.)' },
      { id: 'a4', type: 'short', input: 'text', marks: 1, prompt: 'What does this program print?', code: JOIN3, numbered: true, accept: ['331'],
        scheme: '"3" is a String, so + joins: b is "33", then "33" + "1" is 331. (7 adds them as numbers.)' },
      { id: 'a5', type: 'short', input: 'text', marks: 1, prompt: 'What does this program print? Type exactly what appears on the screen.', code: DIV, numbered: true, accept: ['3.0'],
        scheme: '/ always gives a Real, so 9 / 3 prints 3.0, with a decimal point. (3 forgets the decimal point.)' },
      { id: 'a6', type: 'short', input: 'number', marks: 1, prompt: 'What does this program print?', code: SWAP, numbered: true, accept: ['16'],
        scheme: 'Line 3 makes a 8. Line 4 copies a, which is now 8, into b. 8 + 8 = 16. (11 thinks they swap.)' }
    ] },
    { title: 'Input and Output', questions: [
      choice({ id: 'b1', prompt: 'The user types 6, then 3. What does this program print?', code: JOIN_IN, numbered: true,
        options: ['63', '9', '6 3', 'It stops with an error'], answer: '63', scheme: 'input() always gives a String, so + joins "6" and "3": 63.' }),
      { id: 'b2', type: 'short', input: 'number', marks: 1, prompt: 'The user types 12. What does this program print?', code: AGE, numbered: true, accept: ['30'],
        scheme: 'int() makes age the Integer 12. Line 2 makes it 15. 15 * 2 = 30. (24 misses line 2.)' },
      { id: 'b3', type: 'short', input: 'text', marks: 1, prompt: 'The user types 2.5. What does this program print? Type exactly what appears on the screen.', code: FLOAT, numbered: true,
        accept: ['10.0'], scheme: 'float() makes n the Real 2.5. 2.5 * 4 is the Real 10.0, shown with a decimal point.' },
      choice({ id: 'b4', prompt: 'The user types 12. What does this program print?', code: ADD1, numbered: true,
        options: ['13', '121', '12', 'It stops with an error'], answer: 'It stops with an error',
        scheme: 'age is the String "12". Python cannot add the number 1 to a String, so line 2 stops with an error. It needs int().' }),
      { id: 'b5', type: 'short', input: 'text', marks: 1, prompt: 'The user types Mali, then 3. What does this program print?', code: GOALS, numbered: true, accept: ['Mali scored 6'],
        scheme: 'A comma in print shows each thing with one space between: Mali scored 6. (goals * 2 is 6.)' },
      choice({ id: 'b6', prompt: 'A program asks how many people are in a queue. It adds 1 when a new person comes. What should go round input()?',
        options: ['int()', 'float()', 'str()', 'Nothing. input() is enough.'], answer: 'int()',
        scheme: 'The number of people is always a whole number, so int(). Without it the answer stays a String, and adding 1 stops with an error.' })
    ] },
    { title: 'Programs Using Data Types', questions: [
      { id: 'c1', type: 'short', input: 'text', marks: 1, prompt: 'The user types 0891234567. What does this program print?', code: PHONE, numbered: true, accept: ['891234567'],
        scheme: 'int() makes it a whole number, and a whole number never starts with 0, so the 0 is lost: 891234567.' },
      choice({ id: 'c2', prompt: 'What does this program print?', code: CASE, numbered: true,
        options: ['7', '5', 'Coins', 'It stops with an error'], answer: 'It stops with an error',
        scheme: 'Python sees Coins and coins as different names. There is no variable called Coins, so line 3 stops with an error.' }),
      { id: 'c3', type: 'short', input: 'number', marks: 1, prompt: 'What does this program print?', code: TYPO, numbered: true, accept: ['20'],
        scheme: 'Line 2 stores 14 in a new variable, totla. total is still 10, so line 3 makes it 20. (28 thinks line 2 changed total.)' },
      { id: 'c4', type: 'short', input: 'number', marks: 1, prompt: 'The user types Nok, then 11. The program stops with an error. On which line does it stop?', code: WHICH, numbered: true, accept: ['4'],
        scheme: 'Line 4: + cannot join the String "Age: " and the Integer age. It needs str(age). Line 5 is fine, but never runs.' },
      { id: 'c5', type: 'long', marks: 2,
        prompt: 'Write a Python program that asks the user for the number of pupils going on a trip, then the cost for one pupil (like 85.50). It prints the total cost.',
        scheme: 'One mark each:\n- both inputs turned into numbers with the right functions: int() for the number of pupils (float() also allowed) and float() for the cost\n- multiplies the two numbers and prints the answer, for example print(pupils * cost)\nModel answer:\npupils = int(input("Pupils? "))\ncost = float(input("Cost? "))\nprint(pupils * cost)' }
    ] },
    { title: 'Algorithms and Project Plans', questions: [
      choice({ id: 'd1', prompt: 'Which problem needs selection (a decision in the flowchart)?',
        options: ['The sprite says Ticket, but only for ages of 12 or more.', 'The user types their age. The sprite says it back.',
          'The sprite moves 30 steps, says Hi, then moves 30 steps again.', 'The sprite says Done every time the program runs.'],
        answer: 'The sprite says Ticket, but only for ages of 12 or more.',
        scheme: '"Only for ages of 12 or more": what happens depends on the age, so a decision chooses the path. Typing an age in is input, not a decision.' }),
      { id: 'd2', type: 'short', input: 'number', marks: 1, prompt: 'Score is 50. How many steps does the sprite move in total?', svg: chart(FLOW), accept: [String(flowSteps)],
        scheme: '50 > 50 is False, so the False path: 20 + 10 + 5 = 35. (55 takes the True path.)' },
      { id: 'd3', type: 'short', input: 'text', marks: 1,
        prompt: 'A team makes a game. Put its tasks in the order of the stages of a software project. Type the letters, for example ABCDE.\n' + TASKS.map((t) => t[0] + ': ' + t[1]).join('\n'),
        accept: orderAccept, placeholder: 'ABCDE', scheme: 'Decide (C), Design (E), Build (A), Test (D), Improve (B): CEADB.' },
      choice({ id: 'd4', prompt: 'A tester plays a new game and finds that the score never goes up. Which stage of the project is this?',
        options: ['Test', 'Build', 'Improve', 'Design'], answer: 'Test',
        scheme: 'Playing the game to find mistakes is the Test stage. Fixing it comes after.' }),
      { id: 'd5', type: 'long', marks: 2, prompt: 'Give two reasons why a team writes a project plan before it starts a project.',
        scheme: 'One mark each, two different reasons:\n- everyone knows what to do, who does each task, and when\n- nothing is forgotten or done twice\n- the project is more likely to finish on time (each task has a deadline)\n- the tasks are done in the right order (design before build)' }
    ] }
  ]
};
const qs = test.sections.flatMap((s) => s.questions);
const TOPIC = {
  a1: 'Variables', a3: 'Variables', a6: 'Variables', a2: 'Data types', a4: 'Data types', a5: 'Data types',
  b1: 'Input and output', b5: 'Input and output', b2: 'int(), float() and str()', b3: 'int(), float() and str()', b4: 'int(), float() and str()', b6: 'int(), float() and str()',
  c1: 'Choosing data types', c5: 'Choosing data types', c4: 'Choosing data types', c2: 'Names must match', c3: 'Names must match',
  d1: 'Sequence and selection', d2: 'Sequence and selection', d3: 'Project plans', d4: 'Project plans', d5: 'Project plans'
};
qs.forEach((q) => { assert(TOPIC[q.id], 'topic for ' + q.id); q.topic = TOPIC[q.id]; });
test.topicDrills = {
  'Variables': 'y7-2-1-variables', 'Data types': 'y7-2-1-variables', 'Input and output': 'y7-2-2-input-output', 'int(), float() and str()': 'y7-2-2-input-output',
  'Choosing data types': 'y7-2-3-programs', 'Names must match': 'y7-2-3-programs', 'Sequence and selection': 'y7-3-1-constructs', 'Project plans': 'y7-3-2-plans',
  '*': 'y7-term1b-practice'
};
assert(new Set(qs.map((q) => q.id)).size === qs.length, 'unique ids');
qs.filter((q) => q.type === 'choice').forEach((q) => assert(q.options.length === 4 && new Set(q.options).size === 4 && q.options.includes(q.answer), 'hinge has 4 options ' + q.id));
const total = qs.reduce((t, q) => t + q.marks, 0);
assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(test)), 'dash in test');
assert(qs.length >= 20 && qs.length <= 23, 'question count ' + qs.length);

// ---------------------------------------------------------------- the revision drill (new values, never the test's)
function practiceCards() {
  var ERR_RE = /^\s*(it\s+)?(an?\s+)?(stops(\s+with\s+an\s+error)?|crash(es)?|error|(name|type|value)\s*error)\s*\.?\s*$/i;
  var ERR = "It stops with an error";
  var TYPE_WORD = { int: "Integer", float: "Real", str: "String" };
  var WRONG_T = { int: ["Real", "String", "float"], float: ["Integer", "String", "int"], str: ["Integer", "Real", "int"] };
  function prog(lines) { return lines.join("\n"); }
  function numbered(lines) { return lines.map(function (l, i) { return (i + 1) + "  " + l; }).join("\n"); }
  function typed(list) { return "The user types " + list.join(", then ") + "."; }
  function other(from, to, avoid) { var n; do { n = rnd(from, to); } while (avoid.indexOf(n) >= 0); return n; }
  // ---------------------------------------------------------------- variables and data types
  function traceGen() {
    var v = pick(["coins", "points", "gems", "steps"]), a, k, m;
    do { a = rnd(2, 9); k = rnd(2, 6); m = rnd(2, 3); } while (a === 4 && k === 3 && m === 2);
    var lines = [v + " = " + a, v + " = " + v + " + " + k, v + " = " + v + " * " + m, "print(" + v + ")"], ans = String((a + k) * m);
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [a + k * m, a * m, a + k, (a + k) * m + 1]),
      steps: ["Line 2 uses the value " + v + " holds now, then stores the answer back in " + v + ".", "Line 3 uses that new value, not the first one."],
      working: ["What does " + v + " hold after line 2?", "Line 3 starts from that new value."], note: "Each line uses the value the variable holds at that moment.", py: { code: prog(lines) } };
  }
  function joinGen() {
    var d, e; do { d = rnd(2, 9); e = rnd(1, 9); } while (d === 3 && e === 1);
    var v = pick([["x", "y"], ["p", "q"], ["first", "both"]]), lines = [v[0] + " = \"" + d + "\"", v[1] + " = " + v[0] + " + " + v[0], "print(" + v[1] + " + \"" + e + "\")"], ans = "" + d + d + e;
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [d + d + e, "" + (d + d) + e, d + "" + e, ERR]),
      steps: ["Quote marks make " + v[0] + " a String.", "+ joins Strings: it puts them side by side."], working: ["What data type is " + v[0] + "?", "What does + do with two Strings?"],
      note: "+ joins Strings, it does not add them.", py: { code: prog(lines) } };
  }
  function divGen() {
    var t, d; do { d = rnd(2, 5); t = d * rnd(2, 6); } while (t === 9 && d === 3);
    var v = pick([["cakes", "each"], ["sweets", "share"], ["pages", "per_day"]]), lines = [v[0] + " = " + t, v[1] + " = " + v[0] + " / " + d, "print(" + v[1] + ")"], ans = (t / d) + ".0";
    return { prompt: "What does this program print? Type exactly what appears on the screen.\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [String(t / d), String(t * d), ERR]),
      steps: ["/ always gives a Real, even when the answer is a whole number.", "A Real always shows a decimal point."], working: ["What data type does / always give?", "How does Python show a Real that is a whole number?"],
      note: "/ always gives a Real, shown with a decimal point.", py: { code: prog(lines) } };
  }
  function copyGen() {
    var a, b; do { a = rnd(2, 9); b = rnd(2, 12); } while (a === b || (a === 3 && b === 8));
    var flip = Math.random() < 0.5, N = pick([["x", "y"], ["p", "q"], ["red", "blue"], ["cats", "dogs"], ["left", "right"]]), A = N[0], B = N[1];
    var lines = [A + " = " + a, B + " = " + b].concat(flip ? [B + " = " + A, A + " = " + B] : [A + " = " + B, B + " = " + A]).concat(["print(" + A + " + " + B + ")"]);
    var ans = String(flip ? 2 * a : 2 * b);
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [a + b, flip ? 2 * b : 2 * a, a * b, a + b + 1, Number(ans) + 1, a, b, Number(ans) + 2]),
      steps: ["Line 3 copies one value over the other. The old value is lost.", "Line 4 copies the new value back, so both hold the same number."],
      working: ["Write down both variables after each line.", "The next line copies the value a variable holds now."], note: "After line 3 the old value is gone, so both end with the same number.", py: { code: prog(lines) } };
  }
  function typeGen() {
    var k = pick([["the number of goals in a match", "int"], ["the price of a drink, like 12.5", "float"], ["the time for a race in seconds, like 13.8", "float"],
      ["a door code, like 0472", "str"], ["a user's name", "str"], ["how many pets a user has", "int"], ["a class name, like 7B", "str"]]);
    var ans = TYPE_WORD[k[1]];
    return { prompt: "Which data type should a program use for " + k[0] + "? Type Integer, Real or String.", answer: ans, re: TYPE_RE[k[1]], wrong: WRONG_T[k[1]],
      steps: ["Is it a number the program does maths with?", k[1] === "str" ? "No maths is done with it, so it is text." : k[1] === "int" ? "It is always a whole number." : "It can have a decimal point."],
      working: ["Does the program do maths with it?", "If it is a number, can it have a decimal point?"], note: k[1] === "str" ? "Text, or no maths: a String." : k[1] === "int" ? "A whole number: an Integer." : "A decimal point: a Real." };
  }
  // ---------------------------------------------------------------- input and output
  function joinInGen() {
    var a, b; do { a = rnd(2, 9); b = rnd(1, 9); } while (a === 6 && b === 3);
    var N = pick([["x", "y"], ["first", "second"], ["n1", "n2"], ["top", "bottom"]]), Q = pick(["Number? ", "Type a number: ", "How many? "]);
    var lines = [N[0] + " = input(\"" + Q + "\")", N[1] + " = input(\"" + Q + "\")", "print(" + N[0] + " + " + N[1] + ")"], ans = a + "" + b;
    return { prompt: "What does this program print? " + typed([a, b]) + "\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [a + b, a + " " + b, ERR, b + "" + a]),
      steps: ["input() always gives a String.", "+ joins two Strings."], working: ["What data type does input() give?", "What does + do with that data type?"],
      note: "input() gives Strings, so + joins them.", py: { code: prog(lines), inputs: [String(a), String(b)] } };
  }
  function intGen() {
    var a, k, m; do { a = rnd(9, 15); k = rnd(2, 5); m = rnd(2, 3); } while (a === 12 && k === 3 && m === 2);
    var v = pick(["age", "level", "lap"]), lines = [v + " = int(input(\"Number? \"))", v + " = " + v + " + " + k, "print(" + v + " * " + m + ")"], ans = String((a + k) * m);
    return { prompt: "What does this program print? " + typed([a]) + "\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [a * m, a + k * m, a + "" + k, ERR, a + k]),
      steps: ["int() makes " + v + " an Integer, so maths works.", "Line 2 changes " + v + " before line 3 uses it."], working: ["What does " + v + " hold after line 2?", "Now do line 3 with that value."],
      note: "int() then the change on line 2, then line 3.", py: { code: prog(lines), inputs: [String(a)] } };
  }
  function floatGen() {
    var a, m; do { a = pick(["1.5", "3.5", "0.5", "4.5", "2.5"]); m = rnd(2, 6); } while (a === "2.5" && m === 4);
    var lines = ["n = float(input(\"Number? \"))", "print(n * " + m + ")"], x = Number(a) * m, ans = real(x);
    return { prompt: "What does this program print? Type exactly what appears on the screen. " + typed([a]) + "\n" + prog(lines), answer: ans, re: outRe(ans),
      wrong: uniq(ans, outRe(ans), [String(x), a.repeat(m), ERR, ans + "0"]),
      steps: ["float() makes n a Real.", "A Real times an Integer is a Real, shown with a decimal point."], working: ["What data type does float() give?", "How does Python show a Real?"],
      note: "A Real always shows a decimal point.", py: { code: prog(lines), inputs: [a] } };
  }
  function errGen() {
    var kind = rnd(0, 3), a = other(9, 15, [12]), k = rnd(1, 4), lines, ans, wrong, why;
    if (kind === 0) { lines = ["age = input(\"Age? \")", "print(age + " + k + ")"]; ans = ERR; wrong = [a + k, a + "" + k, a]; why = "age is a String. Python cannot add a number to a String."; }
    else if (kind === 1) { lines = ["age = int(input(\"Age? \"))", "print(\"Age: \" + age)"]; ans = ERR; wrong = ["Age: " + a, "Age:" + a, "Age: age"]; why = "+ cannot join a String and an Integer. It needs str(age)."; }
    else if (kind === 2) { lines = ["age = int(input(\"Age? \"))", "print(age + " + k + ")"]; ans = String(a + k); wrong = [ERR, a + "" + k, a]; why = "int() makes age an Integer, so + adds."; }
    else { lines = ["age = int(input(\"Age? \"))", "print(\"Age: \" + str(age))"]; ans = "Age: " + a; wrong = [ERR, "Age: age", "Age:" + a]; why = "str() turns age into a String, so + can join it."; }
    var re = ans === ERR ? ERR_RE : outRe(ans);
    return { prompt: "What does this program print? If it stops, type error. " + typed([a]) + "\n" + prog(lines), answer: ans, re: re, wrong: uniq(ans, re, wrong),
      steps: ["Find the data type of age after line 1.", why], working: ["What data type does age hold after line 1?", "Can line 2 do that with that data type?"], note: why,
      py: ans === ERR ? { code: prog(lines), inputs: [String(a)], error: true } : { code: prog(lines), inputs: [String(a)] } };
  }
  function commaGen() {
    var n, g, m; do { n = pick(NAMES); g = rnd(2, 6); m = rnd(2, 3); } while (g === 3 && m === 2);
    var w = pick(["scored", "found", "won"]), V = pick([["name", "n"], ["player", "count"], ["who", "num"]]), Q = pick(["Number? ", "How many? "]);
    var lines = [V[0] + " = input(\"Name? \")", V[1] + " = int(input(\"" + Q + "\"))", "print(" + V[0] + ", \"" + w + "\", " + V[1] + " * " + m + ")"], ans = n + " " + w + " " + g * m;
    return { prompt: "What does this program print? " + typed([n, g]) + "\n" + prog(lines), answer: ans, re: outRe(ans),
      wrong: uniq(ans, outRe(ans), [n + w + (g * m), n + " " + w + " " + g, V[0] + " " + w + " " + (g * m), n + ", " + w + ", " + (g * m)]),
      steps: ["A comma in print shows each thing with one space between.", V[1] + " * " + m + " is worked out before it is shown."], working: ["What does a comma in print put between things?", "Work out the number part first."],
      note: "Commas put one space between each thing.", py: { code: prog(lines), inputs: [n, String(g)] } };
  }
  function whichGen() {
    var k = pick([["the number of cars in a car park", "int()"], ["how many books a pupil has read", "int()"], ["the weight of a bag in kg, like 2.4", "float()"], ["the cost of a meal, like 65.50", "float()"], ["the user's town", "nothing"], ["the user's favourite food", "nothing"]]);
    var ans = k[1], re = ans === "int()" ? /^\s*(int(\s*\(\s*\))?|integer)\s*\.?\s*$/i : ans === "float()" ? /^\s*(float(\s*\(\s*\))?|real)\s*\.?\s*$/i : /^\s*(nothing|none|no\s+function|(just\s+)?input(\s*\(\s*\))?)\s*\.?\s*$/i;
    return { prompt: "A program asks for " + k[0] + ". Which function goes round input(): int(), float(), str() or nothing?", answer: ans, re: re,
      wrong: ["int()", "float()", "str()", "nothing"].filter(function (x) { return x !== ans; }),
      steps: ["Is it a number the program does maths with? If not, input() already gives a String.", "If it is a number, can it have a decimal point?"],
      working: ["Is it text or a number?", "Whole number or decimal point?"], format: "Type int(), float(), str() or nothing",
      note: ans === "nothing" ? "Text: input() already gives a String." : ans === "int()" ? "A whole number: int()." : "A decimal point: float()." };
  }
  // ---------------------------------------------------------------- programs using data types
  function zeroGen() {
    var d; do { d = pick(["081", "082", "086", "061", "064"]) + String(rnd(1000000, 9999999)); } while (d === "0891234567");
    var v = pick(["phone", "mobile", "number"]), lines = [v + " = int(input(\"Phone? \"))", "print(" + v + ")"], ans = String(Number(d));
    return { prompt: "What does this program print? " + typed([d]) + "\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [d, ERR, d + ".0"]),
      steps: ["int() makes it a whole number.", "A whole number never starts with 0."], working: ["What does int() turn it into?", "Can a whole number start with 0?"],
      note: "int() loses the 0 at the start. A phone number should stay a String.", py: { code: prog(lines), inputs: [d] } };
  }
  function caseGen() {
    var bad = Math.random() < 0.7, v = pick(bad ? ["lives", "score", "gems"] : ["points", "stars"]), n = rnd(3, 9), k = rnd(1, 4), V = v.charAt(0).toUpperCase() + v.slice(1);
    var lines = [v + " = " + n, v + " = " + v + " + " + k, "print(" + (bad ? V : v) + ")"], ans = bad ? ERR : String(n + k), re = bad ? ERR_RE : outRe(ans);
    return { prompt: "What does this program print? If it stops, type error.\n" + prog(lines), answer: ans, re: re, wrong: uniq(ans, re, bad ? [n + k, n, V] : [ERR, n, V]),
      steps: ["Python sees a capital letter as a different name.", "Check the name on the last line letter by letter."], working: ["Compare the name on each line, letter by letter.", "Does the variable on the last line exist?"],
      note: "Names must match exactly, capitals too.", py: bad ? { code: prog(lines), error: true } : { code: prog(lines) } };
  }
  function typoGen() {
    var t = pick([["coins", "cions"], ["lives", "lvies"], ["points", "ponits"], ["gems", "gmes"]]), n = rnd(3, 12), k = rnd(2, 6), m = rnd(2, 3);
    var lines = [t[0] + " = " + n, t[1] + " = " + t[0] + " + " + k, t[0] + " = " + t[0] + " * " + m, "print(" + t[0] + ")"], ans = String(n * m);
    return { prompt: "What does this program print?\n" + prog(lines), answer: ans, re: outRe(ans), wrong: uniq(ans, outRe(ans), [(n + k) * m, n + k, ERR, n, n * m + k]),
      steps: ["Line 2 stores into " + t[1] + ", a new variable. " + t[0] + " does not change.", "Line 3 starts from the value " + t[0] + " still holds."],
      working: ["Read the name on the left of = on line 2, letter by letter.", "Did line 2 change " + t[0] + "?"], note: "A misspelt name makes a new variable. There is no error.", py: { code: prog(lines) } };
  }
  function lineGen() {
    var n = pick(NAMES), a = other(9, 15, [11]), V = pick(["age", "level", "year", "laps"]), W = pick(["name", "user", "player"]);
    var bad = pick(["print(\"Total: \" + " + V + ")", "print(" + V + " + \" more\")"]);
    var fine = shuffled(["print(\"Hi \" + " + W + ")", "print(" + V + " * 2)", "print(\"Total:\", " + V + ")", "print(" + V + " + 1)"]).slice(0, 2);
    var body = shuffled(fine.concat([bad])), lines = [W + " = input(\"Name? \")", V + " = int(input(\"Number? \"))"].concat(body), ans = String(lines.indexOf(bad) + 1);
    return { prompt: "The program stops with an error. On which line does it stop? " + typed([n, a]) + "\n" + numbered(lines), answer: ans, re: new RegExp("^\\s*(line\\s*)?" + ans + "\\s*\\.?\\s*$", "i"),
      wrong: ["1", "2", "3", "4", "5"].filter(function (x) { return x !== ans; }).slice(0, 3),
      steps: [V + " is an Integer after line 2.", "+ cannot join a String and an Integer. A comma or str() is fine."], working: ["What data type is " + V + " after line 2?", "Which line uses + with a String and " + V + "?"],
      note: "+ cannot join a String and an Integer.", py: { code: prog(lines.slice(0, Number(ans))), inputs: [n, String(a)], error: true } };
  }
  // ---------------------------------------------------------------- algorithms and project plans
  function constructGen() {
    var sel = Math.random() < 0.5;
    var p = sel ? pick(["The sprite says Goal, but only when the score is over 10.", "If the user types yes, the sprite jumps. Otherwise it waits.", "The sprite says Well done when the time is less than 20.", "The door opens only when the code is right."])
      : pick(["The sprite moves 20 steps, turns, then says Ready.", "The user types a name. The sprite says Hello and the name.", "The sprite says Go every time the game starts.", "The sprite turns right, then moves 40 steps."]);
    var ans = sel ? "Selection" : "Sequence";
    return { prompt: "Problem: " + p + "\nDoes it need sequence only, or selection?", answer: ans, re: sel ? /^\s*selection\s*\.?\s*$/i : /^\s*sequence(\s+only)?\s*\.?\s*$/i,
      wrong: [sel ? "Sequence" : "Selection", "Sub-routine", "Loop"],
      steps: ["Look for a clue word: if, only when, otherwise, when.", "Does what happens depend on a number or what the user types?"],
      working: ["Find a clue word: if, only, when, otherwise.", "Input alone is not a decision. Does something choose between two paths?"],
      note: sel ? "What happens depends on a value, so a decision chooses the path." : "The same boxes run every time, in order." };
  }
  function flowGen() {
    var a, k, t, f, j, s; do { a = pick([10, 20, 30]); k = pick([20, 40, 60]); t = pick([10, 30, 40]); f = pick([5, 10, 20]); j = pick([5, 10]); s = pick([k, k, k - 5, k + 5]); } while (t === f || (a === 20 && k === 50));
    var isT = s > k, ans = String(a + (isT ? t : f) + j);
    return { prompt: "A flowchart: Start. Move " + a + " steps. Decision: Score > " + k + "? True: Say \"Win\", then Move " + t + " steps. False: Move " + f + " steps. Both paths then: Move " + j + " steps. End.\nScore is " + s + ". How many steps does the sprite move in total?",
      answer: ans, re: new RegExp("^\\s*" + ans + "(\\s*steps?)?\\s*\\.?\\s*$", "i"), wrong: uniq(ans, outRe(ans), [a + (isT ? f : t) + j, a + t + f + j, a + (isT ? t : f), (isT ? t : f) + j, a + (isT ? f : t)]),
      steps: ["Put the Score into the decision. Is it really bigger? Equal is not bigger.", "Add every Move on the path the sprite takes, including the boxes after the paths join."],
      working: ["Is the Score really bigger than the number in the decision?", "Add the Move boxes on that path, and the one after the paths join."],
      note: "> is False when the numbers are equal. Count every Move on the path." };
  }
  function orderGen() {
    var P = pick([["quiz", "questions"], ["maze game", "levels"], ["shop app", "pages"]]);
    var tasks = [["Decide what the " + P[0] + " must do.", "Decide"], ["Draw the flowchart for the " + P[0] + ".", "Design"], ["Write the Python code.", "Build"], ["Try the " + P[0] + " to find mistakes.", "Test"], ["Add new " + P[1] + " after people use it.", "Improve"]];
    var L = shuffled(["A", "B", "C", "D", "E"]), rows = tasks.map(function (t, i) { return [L[i], t[0]]; }), ans = L.join("");
    if (ans === "CEADB") return orderGen();
    var shown = rows.slice().sort(function (x, y) { return x[0] < y[0] ? -1 : 1; });
    var wrong = [L[0] + L[2] + L[1] + L[3] + L[4], L[0] + L[1] + L[3] + L[2] + L[4], L[1] + L[0] + L[2] + L[3] + L[4], L[0] + L[1] + L[2] + L[4] + L[3]];
    return { prompt: "Put these tasks in the order of the stages of a software project. Type the letters, for example ABCDE.\n" + shown.map(function (r) { return r[0] + ": " + r[1]; }).join("\n"),
      answer: ans, re: new RegExp("^\\s*" + L.join("[\\s,]*") + "\\s*\\.?\\s*$", "i"), wrong: wrong.slice(0, 3),
      steps: ["The stages are Decide, Design, Build, Test, Improve.", "Find the task for each stage in turn."], working: ["Which task says what it must do?", "Design comes before Build, and Test before Improve."],
      note: "Decide, Design, Build, Test, Improve." };
  }
  function stageGen() {
    var k = pick([["A pupil writes down what the app must do.", "Decide"], ["A pupil draws the flowchart for the app.", "Design"], ["A pupil types the code into Python.", "Build"],
      ["A pupil runs the app with different inputs to find mistakes.", "Test"], ["A pupil adds a new feature that users asked for.", "Improve"]]);
    var ans = k[1];
    return { prompt: k[0] + " Which stage of the project is this? Decide, Design, Build, Test or Improve?", answer: ans, re: new RegExp("^\\s*(the\\s+)?" + ans + "(ing)?(\\s+stage)?\\s*\\.?\\s*$", "i"),
      wrong: ["Decide", "Design", "Build", "Test", "Improve"].filter(function (x) { return x !== ans; }).slice(0, 3),
      steps: ["Decide: what it must do. Design: the flowchart. Build: the code.", "Test: find mistakes. Improve: make it better after people use it."],
      working: ["Is the pupil planning, making, checking or making it better?", "Match that to one of the five stages."], note: "Decide, Design, Build, Test, Improve." };
  }
  return [
    card("t7b-trace", "t7b-var", traceGen), card("t7b-join", "t7b-var", joinGen), card("t7b-div", "t7b-var", divGen), card("t7b-copy", "t7b-var", copyGen), card("t7b-type", "t7b-var", typeGen),
    card("t7b-join-in", "t7b-io", joinInGen), card("t7b-int", "t7b-io", intGen), card("t7b-float", "t7b-io", floatGen), card("t7b-err", "t7b-io", errGen), card("t7b-comma", "t7b-io", commaGen), card("t7b-which", "t7b-io", whichGen),
    card("t7b-zero", "t7b-prog", zeroGen), card("t7b-case", "t7b-prog", caseGen), card("t7b-typo", "t7b-prog", typoGen), card("t7b-line", "t7b-prog", lineGen),
    card("t7b-construct", "t7b-plan", constructGen), card("t7b-flow", "t7b-plan", flowGen), card("t7b-order", "t7b-plan", orderGen), card("t7b-stage", "t7b-plan", stageGen)
  ];
}

await writeDrill({ id: 'y7-term1b-practice', builder: 'build_y7_term1b_test.mjs',
  about: 'Year 7, Term 1b Test Practice: 20 minutes of revision before the Term 1b Test (TestBank.gs y7-term1b). One card kind for every kind of test question, never the test\'s own values.',
  title: 'Year 7, Term 1b Test Practice', subtitle: 'Variables, data types, input and output, flowcharts and project plans',
  categories: [['t7b-var', 'Variables and Data Types'], ['t7b-io', 'Input and Output'], ['t7b-prog', 'Programs Using Data Types'], ['t7b-plan', 'Algorithms and Project Plans']],
  cards: practiceCards });

// ---------------------------------------------------------------- write the test into TestBank.gs
const bankPath = path.join(SHELL, 'TestBank.gs');
let bank = fs.readFileSync(bankPath, 'utf8');
const crlf = bank.includes('\r\n'); bank = bank.replace(/\r\n/g, '\n');
const BEGIN = '  // BEGIN y7-term1b (generated by the pages repo tools/build_y7_term1b_test.mjs; edit that, not this)';
const END = '  // END y7-term1b';
const block = BEGIN + '\n  ' + JSON.stringify(test) + ',\n' + END;
if (bank.includes(BEGIN)) bank = bank.replace(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END), () => block);
else bank = bank.replace('  // END y7-term1\n', () => '  // END y7-term1\n' + block + '\n');
assert(bank.includes(BEGIN), 'placed in TestBank.gs');
if (!DRY) fs.writeFileSync(bankPath, crlf ? bank.replace(/\n/g, '\r\n') : bank);

// ---------------------------------------------------------------- the lesson
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const LID = 'y7-term1b-test';
const steps = [
  { id: 'title', label: 'Term 1b Test',
    content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Text-based Programming</p><h2 class="lesson-h2">Term 1b Test</h2><p>Year 7</p></div>' +
      facts(['<strong>First:</strong> 20 minutes of revision practice.', '<strong>Then:</strong> a 30-minute test on this website.',
        '<strong>Topics:</strong> variables and data types, input and output, programs using data types, sequence and selection, project plans.']) +
      tps('Which topic do you find hardest?', 'Practise that topic most in the next 20 minutes.') },
  { id: 'revision', label: 'Revision Practice', type: 'embedded-app', appId: 'drill-y7-term1b-practice', embedContainerId: 'y7t1b-revision',
    content: '<h2 class="lesson-h2">Revision Practice</h2>' +
      tps('A line changes a variable. Which value does the next line use?', 'The new value. Lines run in order, top to bottom.') +
      '<p class="lesson-lead">20 minutes. Practise every topic. Trace each program one line at a time.</p><div id="y7t1b-revision"></div>' },
  { id: 'how-it-works', label: 'How the Test Works',
    content: '<h2 class="lesson-h2">How the Test Works</h2>' +
      tps('A program has four lines. How can you check what it prints?', 'Write down what each variable holds after every line. Then read the print line.') +
      facts(['You have <strong>30 minutes</strong> from when you press <strong>Start</strong>.', 'Your answers <strong>save as you type</strong>.',
        'During the test you <strong>cannot open the rest of the website</strong>.', 'The notepad works, but it starts <strong>empty</strong>. Use it to trace the programs.',
        'Press <strong>Hand in</strong> when you finish. When time runs out, it hands in for you.']) },
  { id: 'test', label: 'The Test', type: 'app-link', appId: 'tests', buttonId: 'y7t1b-open-test',
    content: '<h2 class="lesson-h2">The Test</h2>' + tps('You finish early. What should you do?', 'Trace every program again. Check each answer one line at a time.') +
      '<p class="lesson-lead">30 minutes. Wait until your teacher says the test is open. Then press the button, and press Start.</p>' +
      '<p><button type="button" class="donow-btn" id="y7t1b-open-test">Open the test</button></p>' }
];
assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash in lesson');
if (!DRY) fs.writeFileSync(path.join(ROOT, 'LessonData', LID + '.json'), JSON.stringify({ id: LID, label: 'Term 1b Test', steps, validators: {}, pseudocodeValidators: {} }, null, 1) + '\n');
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const units = all.years.find((y) => y.id === 'year7').units;
const unit = units.find((u) => /term 1b/i.test(u.title));
if (!unit) { console.log("No Year 7 Term 1b unit yet (made by build_y7_term1b_revision.mjs): lesson not listed"); process.exit(DRY ? 0 : 1); }
if (!unit.lessons.includes(LID)) unit.lessons.push(LID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
if (!DRY) fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
console.log(`y7-term1b: ${qs.length} questions, ${total} marks (${test.sections.map((s) => s.title + ' ' + s.questions.reduce((t, q) => t + q.marks, 0)).join(', ')}); lesson ${LID}; unit ${unit.title}: ${unit.lessons.join(', ')}`);
