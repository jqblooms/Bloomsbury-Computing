// Builds LessonData/y9-comp-practice.json: Year 9 Competition Practice, ACSL Junior Contest 2 games (55 minutes).
// Writes its drills (Drills/data/y9-comp-practice-ext.js and y9-comp-practice.js) and registers the lesson in a
// "Competition Practice" unit at the end of Year 9 in lessons.json.
//   node tools/build_y9_comp.mjs
// The games are the CompArcadeY9 app (?game=race|blaster|lock|showdown|contest), which makes and marks every question
// with LoopTracer's generators and shared/acsl-pseudocode.js. Terms, rules and notation are those of the four
// acsl-c2 lessons. Questions are original, in the ACSL style. Every answer here is worked out by the same code.
import fs from 'node:fs';
import path from 'node:path';
import { DRILL_HEAD, ROOT, assert, c, columns, drillFile, esc, facts, loadLibs, makeSteps, numRe, table, why, writeDrill, writeLesson } from './acsl_c2_kit.mjs';

const ID = 'y9-comp-practice';
const P = 'y9cp';
const APP = 'comp-arcade-y9';
const { validators, checkStep, embed, mcStep, T } = makeSteps(P);
const L = loadLibs();
const N = L.ACSLGen.notation, B = L.ACSLGen.bits;
const steps = [];

// Notation: a tree from infix text (* written out), so values and conversions come from the generators' code.
function tree(text) {
  const toks = text.replace(/\s+/g, '').split('');
  let i = 0;
  const atom = () => { const t = toks[i++]; if (t === '(') { const e = add(); i++; return e; } return { leaf: t }; };
  const pow = () => { const l = atom(); if (toks[i] === '^') { i++; return { op: '^', l, r: pow() }; } return l; };
  const mul = () => { let l = pow(); while (toks[i] === '*' || toks[i] === '/') { const op = toks[i++]; l = { op, l, r: pow() }; } return l; };
  const add = () => { let l = mul(); while (toks[i] === '+' || toks[i] === '-') { const op = toks[i++]; l = { op, l, r: mul() }; } return l; };
  return add();
}
const bits = (text) => B.value(B.parse(text, B.PREC));
// Every 5-bit x that makes the expression equal the target, as a pattern with *.
function solve(expr, target) {
  const t = B.parse(expr, B.PREC), sols = [];
  for (let v = 0; v < 32; v++) { const x = v.toString(2).padStart(5, '0'); if (B.value(t, x) === target) sols.push(x); }
  let pat = '';
  for (let i = 0; i < 5; i++) pat += sols.every((s) => s[i] === sols[0][i]) ? sols[0][i] : '*';
  assert(sols.length === 2 ** (pat.split('*').length - 1), 'solve: ' + expr + ' has a * pattern');
  return pat;
}
const strRe = (s) => '^\\s*' + s.replace(/\s+/g, '').split('').map((ch) => (ch === '↑' || ch === '^' ? '(\\^|↑)' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join(' ?') + '\\s*$';
const big = (html, size = 30) => `<div class="wt-big" style="font-size:${size}px">${html}</div>`;

// ---------------------------------------------------------------- Do Now 1: notation
const DN1 = tree('8+3^2-4*2'), DN1B = tree('3*(a-b)+c/d');
const DN1_POST = N.postfix(DN1), DN1_VAL = N.value(DN1), DN1_INFIX = N.infix(DN1B, true), DN1_PRE = N.prefix(DN1B);
assert(DN1_POST === '8 3 2 ↑ + 4 2 * -' && DN1_VAL === 9, 'Do Now 1 (a): ' + DN1_POST + ' = ' + DN1_VAL);
assert(DN1_INFIX === '3(a - b) + c / d' && DN1_PRE === '+ * 3 - a b / c d', 'Do Now 1 (b): ' + DN1_INFIX + ' -> ' + DN1_PRE);
const WX = tree('2^3*5+6/2'), WY = tree('2*(c+d)-a/b');
const WX_POST = N.postfix(WX), WX_STEPS = N.postfixSteps(WX);
assert(WX_POST === '2 3 ↑ 5 * 6 2 / +' && N.value(WX) === 43, 'walkthrough postfix');
assert(N.infix(WY, true) === '2(c + d) - a / b' && N.prefix(WY) === '- * 2 + c d / a b', 'walkthrough prefix');
const WT_NOTATION = { title: 'Walk me through it: postfix and prefix', steps: [
  { text: 'A similar postfix question. Read left to right. Push each number onto the stack.', visual: big(`<span class="wt-hl">2 3</span> ↑ 5 * 6 2 / +`) },
  { text: 'An operator takes the top two numbers. The lower one goes first: 2 ↑ 3 is 8.', visual: big(`stack: <span class="wt-hl">8</span> &nbsp; then 8 * 5 = 40`) },
  { text: 'Keep going: 6 / 2 is 3. Then + takes 40 and 3.', visual: big(`40 + 3 = <span class="wt-hl">${N.value(WX)}</span>`) },
  { text: 'A similar prefix question: 2(c + d) - a / b. A number next to a bracket means multiply.', visual: big(`2 <span class="wt-hl">*</span> (c + d) - a / b`) },
  { text: 'Put brackets round every operation, in the order they are worked out.', visual: big(esc(N.fullBrackets(WY)), 26) },
  { text: 'Move each operator just before its two operands, from the inside out.', visual: big(`- <span class="wt-hl">* 2 + c d</span> / a b`) },
  { text: 'Now do your two questions the same way.', visual: big('stack for postfix &nbsp; | &nbsp; brackets, then move the operators') }
] };
assert(WX_STEPS.length === 4, 'walkthrough steps');
assert(!/(^|[^0-9])9([^0-9]|$)|\+ \* 3 - a b \/ c d/.test(JSON.stringify(WT_NOTATION).replace(/font-size:\d+px/g, '')), 'notation walkthrough shows a Do Now answer');
steps.push(checkStep('do-now', 'Do Now: Notation (1 of 2)', 'Do Now: Notation (1 of 2)', 'From the Prefix, Infix and Postfix lesson.', [
  { label: `Evaluate postfix <code>${esc(DN1_POST)}</code>`, answer: numRe(DN1_VAL), line: true, feedback: 'Use a stack. Push each number. An operator takes the top two numbers: the lower one goes first.' },
  { label: `Write <code>${esc(DN1_INFIX)}</code> in prefix.`, answer: strRe(DN1_PRE), line: true, feedback: 'A number next to a bracket means multiply. Bracket every operation, then move each operator before its two operands.' }
], '', ['Why does a postfix expression never need brackets?', 'Each operator comes right after its two operands, so the order is fixed.']));
steps[steps.length - 1].walkthrough = WT_NOTATION;

// ---------------------------------------------------------------- Do Now 2: bit strings
const DB_A = 'RCIRC-2 10110 XOR NOT 01101 AND 11100', DB_B = 'LSHIFT-1 x AND 10110', DB_B_T = '00100';
const DB_A_ANS = bits(DB_A), DB_B_ANS = solve(DB_B, DB_B_T);
assert(bits('RCIRC-2 10110') === '10101' && bits('NOT 01101 AND 11100') === '10000' && DB_A_ANS === '00101', 'Do Now 2 (a): ' + DB_A_ANS);
assert(DB_B_ANS === '*0*10', 'Do Now 2 (b): ' + DB_B_ANS);
const WB = { circ: bits('LCIRC-1 10001'), not: bits('NOT 10011'), and: bits('NOT 10011 AND 11110'), or: bits('LCIRC-1 10001 OR NOT 10011 AND 11110') };
assert(WB.circ === '00011' && WB.not === '01100' && WB.and === '01100' && WB.or === '01111', 'bits walkthrough eval');
const WB_SOLVE = solve('RSHIFT-1 x AND 01110', '00100');
assert(WB_SOLVE === '010**', 'bits walkthrough solve ' + WB_SOLVE);
const WT_BITS = { title: 'Walk me through it: bit strings', steps: [
  { text: 'A similar question: LCIRC-1 10001 OR NOT 10011 AND 11110. NOT and circulates go first.', visual: big(`<span class="wt-hl">LCIRC-1 10001</span> OR <span class="wt-hl">NOT 10011</span> AND 11110`, 24) },
  { text: 'LCIRC-1: the left bit wraps round to the right. NOT flips every bit.', visual: big(`${WB.circ} OR <span class="wt-hl">${WB.not}</span> AND 11110`, 26) },
  { text: 'AND goes before OR, even though OR is written first.', visual: big(`${WB.circ} OR <span class="wt-hl">${WB.and}</span>`, 26) },
  { text: 'Then OR, bit by bit.', visual: big(`<span class="wt-hl">${WB.or}</span>`) },
  { text: 'A similar solve: RSHIFT-1 x AND 01110 = 00100. Call the bits of x abcde. RSHIFT-1 x is 0abcd.', visual: big(`0abcd AND 0<span class="wt-hl">111</span>0 = 00100`, 26) },
  { text: 'Under a 1 in the mask, the bit must match: a = 0, b = 1, c = 0. d sits under a 0 and e falls off, so they can be anything.', visual: big(`a = 0 &nbsp; b = 1 &nbsp; c = 0 &nbsp; d, e: <span class="wt-hl">*</span>`, 24) },
  { text: 'Put the bits back in order with * for anything.', visual: big(`x = <span class="wt-hl">${WB_SOLVE}</span>`) }
] };
assert(!new RegExp(DB_A_ANS + '|\\*0\\*10').test(JSON.stringify(WT_BITS)), 'bits walkthrough shows a Do Now answer');
steps.push(checkStep('do-now-2', 'Do Now: Bit Strings (2 of 2)', 'Do Now: Bit Strings (2 of 2)', 'From the Bit-String Flicking lesson. (a) Evaluate it. (b) Find every x: use * for a bit that can be 0 or 1.', [
  { label: `<code>${DB_A}</code>`, answer: '^\\s*' + DB_A_ANS + '\\s*$', line: true, feedback: 'NOT and RCIRC first. Then AND, then XOR.' },
  { label: `<code>${DB_B} = ${DB_B_T}</code>`, answer: '^\\s*(?:x ?= ?)?' + DB_B_ANS.split('').map((ch) => (ch === '*' ? '\\*' : ch)).join(' ?') + '\\s*$', line: true, feedback: 'Write x as abcde and shift it. Under a 0 in the mask, that bit of x can be anything.' }
], '', ['Why write each step as a new 5-bit string?', 'All 5 bits stay in every step, so no bit is lost and each step can be checked.']));
steps[steps.length - 1].walkthrough = WT_BITS;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-comp-practice-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these contest questions from all three topics. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Competition Practice: Contest 2 Games',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">ACSL Junior Contest 2</p><h2 class="lesson-h2">Competition Practice: Contest 2 Games</h2><p>Year 9</p></div>' +
    facts(['<strong>Today:</strong> five games at full contest level. Notation Race, Bit Flick Blaster, Loop Lock, Contest Showdown, then a Mini-Contest.',
      '<strong>Every game:</strong> new questions each round, harder as you go. Your best scores are saved.']) +
    why('Why practise with games against a clock?', 'The real contest is timed. Speed comes from doing many questions, and games make you do many.') });

// ---------------------------------------------------------------- why the tricks work
const TRICK_ITEMS = [
  { prompt: 'Why does a postfix operator take the top two numbers?', options: ['They are its two operands', 'They are the biggest numbers', 'The stack is in order', 'They were typed first'], correct: 0,
    explain: 'Postfix writes each operator straight after its two operands, so they are the last two values on the stack.' },
  { prompt: 'Why is bit 2 of x a * in <code>x AND 10011 = 00010</code>?', options: ['It must be 0', 'It must be 1', 'AND with 0 always gives 0', 'NOT goes first'], correct: 2,
    explain: 'The mask has a 0 there. 0 AND 0 and 1 AND 0 are both 0, so that bit of x can be anything.' }
];
{ const s = solve('x AND 10011', '00010'); assert(s[1] === '*' && s === '0**10', 'tricks MC 2: ' + s); }
steps.push(mcStep('check-tricks', 'Check: Why the Tricks Work (1 of 2)', 'Check: Why the Tricks Work (1 of 2)', '', [TRICK_ITEMS[0]],
  ['Why does prefix put each operator before its two operands?', 'It is one fixed rule, so an expression can only be read one way, with no brackets.']));
steps.push(mcStep('check-tricks-2', 'Check: Why the Tricks Work (2 of 2)', 'Check: Why the Tricks Work (2 of 2)', '', [TRICK_ITEMS[1]],
  ['Why does LSHIFT-1 bring a 0 in on the right?', 'A shift keeps all 5 places. One bit falls off the left, so a 0 fills the gap.']));

// ---------------------------------------------------------------- the games
steps.push(embed('game-race', 'Game 1: Notation Race', APP, 'Game 1: Notation Race',
  '90 seconds. One try each. Streaks multiply your points.',
  ['Why work out prefix from an operator with two numbers after it?', 'They are its operands, so it can be done now. Its answer feeds the operator before it.'],
  'game=race'));
steps.push(embed('game-blaster', 'Game 2: Bit Flick Blaster', APP, 'Game 2: Bit Flick Blaster',
  'Find every x before the block lands. You have 3 lives.',
  ['Why does putting one x back in check a * answer?', 'Every value the pattern allows must work. One that fails shows the pattern is wrong.'],
  'game=blaster'));
steps.push(embed('game-lock', 'Game 3: Loop Lock', APP, 'Game 3: Loop Lock',
  'The code for each lock is what its program outputs.',
  ['Why can a sum from 1 to 100 skip tracing every turn?', 'It adds 1 to 100. Pairs from each end (1 + 100, 2 + 99, ...) all have the same total.'],
  'game=lock'));
steps.push(embed('showdown', 'Game 4: Contest Showdown', APP, 'Game 4: Contest Showdown',
  'Team A against Team B. Buzz, then answer out loud.',
  ['Why should your team agree an answer before you buzz?', 'A wrong answer loses points and hands the question to the other team.'],
  'game=showdown'));
steps.push(embed('mini-contest', 'Game 5: Mini-Contest', APP, 'Game 5: Mini-Contest',
  '5 questions in contest order: 12 minutes today, 30 in the real contest.',
  ['Why answer every question, even one you are not sure of?', 'An unsure answer can still score. A blank never can.'],
  'game=contest&minutes=12'));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Three in a Row', 'drill-y9-comp-practice', 'Plenary: Three in a Row',
  'Get each card right 3 times in a row to master it. Every card is new each time. Your progress is saved.',
  ['Why does a card come back after you get it wrong?', 'A miss resets that card, so it comes back until you get it 3 times in a row.']));

// ---------------------------------------------------------------- self-checks
for (const [k, i, ok, bad] of [['do-now', 0, ['9', ' 9 '], ['-9', '19', '8']],
  ['do-now', 1, ['+ * 3 - a b / c d', '+*3-ab/cd', '+ * 3 - A B / C D'], ['+ - * 3 a b / c d', '* 3 - a b + / c d', 'a b - 3 * c d / +']],
  ['do-now-2', 0, ['00101', ' 00101'], ['101', '10101', '00100']], ['do-now-2', 1, ['*0*10', 'x = *0*10', '* 0 * 1 0'], ['00010', '10110', '*0*1*', '0*0*1', '*0*0*']]]) {
  for (const s of ok) assert(T(k, i, s), `${k} ${i} accepts ${s}`);
  for (const s of bad) assert(!T(k, i, s), `${k} ${i} rejects ${s}`);
}

// ---------------------------------------------------------------- drills
const EXT_BODY = DRILL_HEAD + String.raw`
  DrillData.register("y9-comp-practice-ext", {
    title: "Contest 2 Extension: Contest Level",
    subtitle: "Year 9 Competition Practice Do Now Extension",
    categories: [["ce-notation", "Prefix, Infix and Postfix"], ["ce-bits", "Bit-String Flicking"], ["ce-loops", "What Does This Program Do?"]],
    cards: [
      genCard("ce-01", "ce-notation", "postfix-eval"), genCard("ce-02", "ce-notation", "prefix-eval"), genCard("ce-03", "ce-notation", ["to-prefix", "to-postfix"]),
      genCard("ce-04", "ce-bits", "bits-eval"), genCard("ce-05", "ce-bits", "bits-solve"), genCard("ce-06", "ce-bits", "bits-solve"),
      genCard("ce-07", "ce-loops", "loop-3"), genCard("ce-08", "ce-loops", "loop-4"), genCard("ce-09", "ce-loops", "loop-5"), genCard("ce-10", "ce-loops", "loop-6")
    ]
  });`;
const PLEN_BODY = DRILL_HEAD + String.raw`
  DrillData.register("y9-comp-practice", {
    title: "Contest 2: Three in a Row",
    subtitle: "Year 9 Competition Practice plenary: all three topics at contest level",
    categories: [["cp-notation", "Prefix, Infix and Postfix"], ["cp-bits", "Bit-String Flicking"], ["cp-loops", "What Does This Program Do?"]],
    cards: [
      genCard("cp-01", "cp-notation", "prefix-eval"), genCard("cp-02", "cp-notation", "postfix-eval"), genCard("cp-03", "cp-notation", "to-prefix"),
      genCard("cp-04", "cp-notation", "to-postfix"), genCard("cp-05", "cp-notation", ["to-prefix", "to-postfix"]),
      genCard("cp-06", "cp-bits", "bits-eval"), genCard("cp-07", "cp-bits", "bits-eval"), genCard("cp-08", "cp-bits", "bits-solve"),
      genCard("cp-09", "cp-bits", "bits-solve"), genCard("cp-10", "cp-bits", "bits-solve"),
      genCard("cp-11", "cp-loops", "loop-3"), genCard("cp-12", "cp-loops", "loop-4"), genCard("cp-13", "cp-loops", "loop-5"),
      genCard("cp-14", "cp-loops", "loop-6"), genCard("cp-15", "cp-loops", ["loop-5", "loop-6"])
    ]
  });`;
const HEAD = (what) => `// Year 9 Competition Practice ${what}: ACSL Junior Contest 2 at contest level.\n// Written by tools/build_y9_comp.mjs (edit the builder). Carries shared/acsl-pseudocode.js and Loop Tracer's\n// programs.js and contest-gen.js so every answer is worked out when the card is drawn.`;
writeDrill('y9-comp-practice-ext', drillFile('y9-comp-practice-ext', HEAD('Do Now Extension'), EXT_BODY));
writeDrill('y9-comp-practice', drillFile('y9-comp-practice', HEAD('plenary drill'), PLEN_BODY));

writeLesson(ID, 'Competition Practice: Contest 2 Games', steps, validators);

// ---------------------------------------------------------------- registration: a "Competition Practice" unit at the end of
// Year 9. A small text edit: lessons.json is shared by several builders, so only Year 9's units list is touched.
function register() {
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const a = raw.indexOf('"id": "year9"'), b = raw.indexOf('"id": "year10"');
  assert(a > 0 && b > a, 'lessons.json has Year 9 then Year 10');
  const slice = raw.slice(a, b);
  if (slice.includes('"' + ID + '"')) return 'already registered';
  const close = slice.lastIndexOf(nl + '      ]');
  assert(close > 0 && /\}\s*$/.test(slice.slice(0, close)), 'Year 9 units list end');
  const unit = ',' + nl + '        {' + nl + '          "code": "",' + nl + '          "title": "Competition Practice",' + nl + '          "lessons": [' + nl +
    '            "' + ID + '"' + nl + '          ]' + nl + '        }';
  const out = raw.slice(0, a + close) + unit + raw.slice(a + close);
  JSON.parse(out);
  fs.writeFileSync(lp, out);
  return 'registered';
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, ${register()}`);
void c; void columns; void table;
