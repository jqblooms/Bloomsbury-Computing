// Builds LessonData/acsl-c2-contest.json: ACSL Junior Contest 2, Contest Day. Writes its drills
// (Drills/data/acsl-c2-contest-ext.js and acsl-c2-mock.js) and registers the lesson last in the Competition section.
//   node tools/build_acsl_c2_contest.mjs
// How the contest works (five short questions, then the programming problem), how answers must be written, tips, a
// timed mock (Loop Tracer's Mock Contest: 2 notation, 2 bit-string, 1 program question), the programming problem
// (Contest Code: Python run against hidden test inputs, scored a point per matching line), links to the official
// samples, and the acsl-c2-mock drill as plenary. Every answer is worked out by the same code the apps and drills use.
// Questions are original, in the ACSL style; the official samples are linked, never copied.
import { DRILL_HEAD, assert, c, code, columns, drillFile, esc, facts, loadLibs, makeSteps, numRe, registerLesson, table, tps, why, writeDrill, writeLesson } from './acsl_c2_kit.mjs';

const ID = 'acsl-c2-contest';
const P = 'acc';
const { validators, checkStep, embed, appLink, mcStep, T } = makeSteps(P);
const L = loadLibs();
const N = L.ACSLGen.notation, B = L.ACSLGen.bits;
const steps = [];
// Notation: a tree from a fully bracketed infix string, so values and conversions come from the generators' code.
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

// ---------------------------------------------------------------- Do Now 1: notation
const DN1 = tree('3*(2+4)-8/2'), DN1B = tree('(a+b)*c-d');
const DN1_PRE = N.prefix(DN1), DN1_VAL = N.value(DN1), DN1_POST = N.postfix(DN1B);
assert(DN1_PRE === '- * 3 + 2 4 / 8 2' && DN1_VAL === 14 && DN1_POST === 'a b + c * d -', 'Do Now 1 answers');
const WX = tree('2*3+(9-4)'), WY = tree('a*(b-c)+d');
const WT_NOTATION = { title: 'Walk me through it: prefix and postfix', steps: [
  { text: 'A similar prefix question: find an operator with two numbers straight after it.', visual: `<div class="wt-big" style="font-size:34px">+ <span class="wt-hl">* 2 3</span> - 9 4</div>` },
  { text: 'Work it out and put the answer in its place: * 2 3 is 6.', visual: '<div class="wt-big" style="font-size:34px">+ 6 <span class="wt-hl">- 9 4</span></div>' },
  { text: 'Repeat: - 9 4 is 5. Then + 6 5 is 11.', visual: `<div class="wt-big" style="font-size:34px">+ 6 5 &rarr; <span class="wt-hl">${N.value(WX)}</span></div>` },
  { text: 'A similar postfix question: a * (b - c) + d. First put brackets round every operation.', visual: `<div class="wt-big" style="font-size:30px">${esc(N.fullBrackets(WY))}</div>` },
  { text: 'Start inside: b - c becomes b c -. Then a times that becomes a b c - *.', visual: '<div class="wt-big" style="font-size:30px">a <span class="wt-hl">b c -</span> *</div>' },
  { text: 'Last, add d: the + goes after both of its operands.', visual: `<div class="wt-big" style="font-size:30px"><span class="wt-hl">${esc(N.postfix(WY))}</span></div>` },
  { text: 'Now do your two questions the same way.', visual: '<div class="wt-big" style="font-size:30px">find &rarr; work out &rarr; replace &rarr; repeat</div>' }
] };
assert(N.value(WX) === 11 && N.postfix(WY) === 'a b c - * d +', 'notation walkthrough');
assert(!/\b14\b|a b \+ c \* d -/.test(JSON.stringify(WT_NOTATION)), 'notation walkthrough shows a Do Now answer');
const DN1_POST_RE = '^\\s*a\\s*b\\s*\\+\\s*c\\s*\\*\\s*d\\s*-\\s*$';
steps.push(checkStep('do-now', 'Do Now: Notation (1 of 2)', 'Do Now: Notation (1 of 2)', 'From the Prefix, Infix and Postfix lesson.', [
  { label: `Evaluate the prefix expression <code>${esc(DN1_PRE)}</code>`, answer: numRe(DN1_VAL), line: true, feedback: 'Find an operator with two numbers straight after it. Work it out, put the answer in its place, and repeat.' },
  { label: 'Write <code>(a + b) * c - d</code> in postfix.', answer: DN1_POST_RE, line: true, feedback: 'Bracket every operation first. Then move each operator after its two operands, from the inside out.' }
], '', ['Why does prefix need no brackets?', 'Each operator comes just before its two operands, so the order of the work is already fixed.']));
steps[steps.length - 1].walkthrough = WT_NOTATION;

// ---------------------------------------------------------------- Do Now 2: bit strings
const DB = ['LSHIFT-2 01101 OR 10010', 'NOT 11010 AND RCIRC-1 10011'].map(bits);
assert(DB.join() === '10110,00001', 'Do Now 2 answers');
const WB = ['RSHIFT-1 11100', '01110 XOR 01100', 'NOT 01110', 'LCIRC-1 11001', '10001 AND 10011'].map(bits);
assert(WB.join() === '01110,00010,10001,10011,10001', 'bits walkthrough values');
const WT_BITS = { title: 'Walk me through it: bit strings', steps: [
  { text: 'A similar question: RSHIFT-1 11100 XOR 01100. Shifts go first.', visual: '<div class="wt-big" style="font-size:34px"><span class="wt-hl">RSHIFT-1 11100</span> XOR 01100</div>' },
  { text: 'RSHIFT-1 moves every bit one place right. The last bit is lost and a 0 comes in on the left.', visual: `<div class="wt-big" style="font-size:34px">11100 &rarr; <span class="wt-hl">${WB[0]}</span></div>` },
  { text: 'Now XOR, bit by bit: 1 where the bits are different.', visual: `<div class="wt-big" style="font-size:34px">${WB[0]} XOR 01100 = <span class="wt-hl">${WB[1]}</span></div>` },
  { text: 'Another: NOT 01110 AND LCIRC-1 11001. NOT and the circulate go before AND.', visual: `<div class="wt-big" style="font-size:30px">NOT 01110 = ${WB[2]} &nbsp; LCIRC-1 11001 = ${WB[3]}</div>` },
  { text: 'LCIRC-1 moves the bits left, and the bit that falls off comes back on the right. Then AND: 1 only where both are 1.', visual: `<div class="wt-big" style="font-size:30px">${WB[2]} AND ${WB[3]} = <span class="wt-hl">${WB[4]}</span></div>` },
  { text: 'Now do your two questions the same way: NOT, shifts and circulates first, then AND, XOR, OR.', visual: '<div class="wt-big" style="font-size:30px">NOT, SHIFT, CIRC &rarr; AND &rarr; XOR &rarr; OR</div>' }
] };
assert(!/10110|00001/.test(JSON.stringify(WT_BITS)), 'bits walkthrough shows a Do Now answer');
steps.push(checkStep('do-now-2', 'Do Now: Bit Strings (2 of 2)', 'Do Now: Bit Strings (2 of 2)', 'From the Bit-String Flicking lesson. Write all 5 bits.', [
  { label: '<code>LSHIFT-2 01101 OR 10010</code>', answer: '^\\s*10110\\s*$', line: true, feedback: 'Shift first: two places left, zeros come in on the right. Then OR.' },
  { label: '<code>NOT 11010 AND RCIRC-1 10011</code>', answer: '^\\s*00001\\s*$', line: true, feedback: 'Work out NOT and RCIRC-1 first. Then AND, bit by bit.' }
], '', ['Why does a shift keep the string the same length?', 'Bits fall off one end and the same number of zeros come in at the other end.']));
steps[steps.length - 1].walkthrough = WT_BITS;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-acsl-c2-contest-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from all three Contest 2 topics. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Contest Day',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">ACSL Junior Contest 2</p><h2 class="lesson-h2">Contest Day</h2><p>Competition</p></div>' +
    facts(['<strong>Today:</strong> how the contest works, how to write answers that score, a mock contest against the clock, and the programming problem.',
      '<strong>Every time, ask why:</strong> why would that answer score, or not score?']) +
    why('Why practise a whole contest, not just one topic at a time?', 'On the day the topics are mixed. You have to switch between them quickly and manage your time.') });

// ---------------------------------------------------------------- how it works
steps.push({ id: 'how-it-works', label: 'How the Contest Works',
  content: '<h2 class="lesson-h2">How the Contest Works</h2>' +
    why('Why does each short question ask for only one answer, with no working?', 'Answers can be checked quickly and fairly. The working is for you: it is how you get the answer right.') +
    columns(table([['1', 'Prefix, Infix and Postfix'], ['2', 'Prefix, Infix and Postfix'], ['3', 'Bit-String Flicking'], ['4', 'Bit-String Flicking'], ['5', 'What Does This Program Do?']], ['Question', 'Usual topic']),
      facts(['<strong>Part 1:</strong> five short questions. Each answer is one value or one expression.', '<strong>Part 2:</strong> a programming problem. Your program reads test input and prints the answers.', 'The program is run on test inputs. Each output that matches scores.', 'Your teacher tells you the time for each part.'])) });

// ---------------------------------------------------------------- answers that score
steps.push({ id: 'answer-forms', label: 'Compare: Answers That Score',
  content: '<h2 class="lesson-h2">Compare: Answers That Score</h2>' +
    why('Why is 110 not a good answer when the question works with 5-bit strings?', 'The strings keep their length. 110 hides the two zeros at the front, so it does not show the full answer: write 00110.') +
    table([['bit string', c('00110'), c('110')], ['find every x', c('1*0*1'), c('10001') + ' (only one of them)'], ['postfix', c('a b + c *'), c('a + b c *') + ' (still infix order)'], ['program output', c('25.5'), c('25') + ' (/ keeps the decimal part)']], ['Answer type', 'Scores', 'Does not score']) +
    facts(['Give the answer in the form the question asks for.', 'Write every bit. Use * for a bit that can be 0 or 1.', 'Read it back: does it answer the question that was asked?']) });

const FORM_ITEMS = [
  { prompt: 'x is a 5-bit string. Which answer shows every x that makes <code>x AND 11000 = 10000</code> true?', options: ['10***', '10000', '1****', '**000'], correct: 0,
    explain: 'AND with 11000 keeps only the first two bits, so they must be 1 and 0. The last three bits are hidden by the 0s: each can be anything.' },
  { prompt: 'Which is the postfix form of <code>a + b * c</code>?', options: ['a b + c *', 'a b c * +', '+ a * b c', 'a + b c *'], correct: 1,
    explain: '* goes first, so b * c becomes b c *. Then a plus that: a b c * +.' }
];
// The x AND 11000 = 10000 answer, checked by trying every x.
{ const sols = []; for (let v = 0; v < 32; v++) { const x = v.toString(2).padStart(5, '0'); if (bits(`${x} AND 11000`) === '10000') sols.push(x); }
  assert(sols.length === 8 && sols.every((s) => s.startsWith('10')), 'answer-forms MC 1');
  assert(N.postfix(tree('a+b*c')) === 'a b c * +', 'answer-forms MC 2'); }
steps.push(mcStep('check-forms', 'Check: Which Answer Scores?', 'Check: Which Answer Scores?', 'Choose the answer that scores.', FORM_ITEMS,
  ['Why must you check whether a question says prefix or postfix before you answer?', 'They put the operators in opposite places. A correct prefix answer to a postfix question scores nothing.']));

// ---------------------------------------------------------------- tips
steps.push({ id: 'tips', label: 'Tips for Each Question Type',
  content: '<h2 class="lesson-h2">Tips for Each Question Type</h2>' +
    why('Why leave no question blank, even when you are unsure?', 'An answer you are unsure of can still be right. A blank can never score.') +
    table([['Prefix, infix, postfix', 'Bracket every operation first. Evaluate with a stack, or find an operator with two numbers next to it.'],
      ['Bit strings', 'NOT, shifts and circulates first, then AND, XOR, OR. Write each step as a new 5-bit string.'],
      ['Find every x', 'Work one bit at a time. Check your answer by putting a value of x back in.'],
      ['Programs', 'Say what each loop does in words. Trace a few turns. Spot the pattern.']], ['Question', 'How to get it right'], ';width:100%') +
    facts(['Check each answer a second way if there is time.']) });

// ---------------------------------------------------------------- activity 1: the mock
steps.push(embed('mock', 'Activity 1: Mock Contest', 'loop-tracer', 'Activity 1: Mock Contest',
  'Five questions, 15 minutes. Press Start the clock when your teacher says. Nothing is marked until you hand in.',
  ['Why practise against a clock?', 'On the day, time runs out. Practising with a clock shows you which questions take you too long.'],
  'mode=mock&minutes=15'));

// ---------------------------------------------------------------- the programming problem
const PY = ['line = input()', 'words = line.split()', 'print(len(words))', 'print(len(words[0]))'];
steps.push({ id: 'programming', label: 'The Programming Problem',
  content: '<h2 class="lesson-h2">The Programming Problem</h2>' +
    why('Why test your program with your own inputs, not just the sample?', 'The program is marked on inputs you have not seen. Your own inputs, with ties and short words, find the bugs first.') +
    columns(code(PY, false) + '<p class="lesson-lead">Input: <code>Cats sleep a lot</code><br>Output: 4, then 4</p>',
      facts(['Read the input with <code>input()</code>.', 'Print the answers in order, one per line.', 'Print only the answer: no labels, no extra lines.', 'Test with the sample, then with inputs you make up.'])) });

steps.push({ id: 'compare-output', label: 'Compare: Output That Matches',
  content: '<h2 class="lesson-h2">Compare: Output That Matches</h2>' +
    why('Why does Words: 4 score nothing when the answer is 4?', 'The output is checked line by line against the expected output. Words: 4 is not the same text as 4.') +
    table([[c('4'), c('4'), 'matches'], [c('4'), c('Words: 4'), 'no match: extra text'], [c('4'), c('4.0'), 'no match: a decimal, not a whole number'], [c('sleep'), c('Sleep'), 'no match: capital letter']], ['Expected', 'Printed', 'Result']) +
    facts(['Match the expected output exactly.', 'Use <code>int()</code> or whole-number maths when the answer is a whole number.']) });

steps.push(embed('activity-2', 'Activity 2: Word Stats', 'acsl-c2-prog', 'Activity 2: Word Stats',
  'Write the program in Python. Run it on the sample, then Submit: it is tested on four more inputs you cannot see. Aim for 25 out of 25.',
  ['Why does the problem say what to do when two words tie?', 'Without a rule, two different programs could both be right. The rule means there is only one correct output.'],
  'problem=word-stats'));

steps.push(appLink('more-problems', 'More Programming Problems', 'acsl-c2-prog', 'More Programming Problems',
  '<p class="lesson-lead">Contest Code has more problems in the same style: Number Line and Code Words. Each is tested on the sample and four hidden inputs.</p>' +
    facts(['Finished Word Stats? Try Number Line next.', 'Then try the official sample problem: <a href="http://datafiles.acsl.org/samples/contest2/c2-jr-prog.pdf" target="_blank" rel="noopener">ACSL Junior Contest 2 programming problem (PDF)</a>.']),
  'Open Contest Code', '',
  ['Why practise more than one problem?', 'Each problem needs different Python: counting, comparing, building new strings. More problems means fewer surprises.']));

// ---------------------------------------------------------------- official samples
steps.push({ id: 'samples', label: 'The Official Samples',
  content: '<h2 class="lesson-h2">The Official Samples</h2>' +
    why('Why try the official sample as well as the mock?', 'The sample is written by ACSL, so it shows exactly how real questions look.') +
    '<p class="lesson-lead">Try the sample contest on paper, under the clock. Then check it together.</p>' +
    facts(['<a href="http://datafiles.acsl.org/samples/contest2/2junior.pdf" target="_blank" rel="noopener">ACSL Junior Contest 2 sample (PDF)</a>',
      '<a href="http://datafiles.acsl.org/samples/contest2/c2-jr-prog.pdf" target="_blank" rel="noopener">Junior Contest 2 programming problem (PDF)</a>',
      'ACSL wiki: <a href="http://www.categories.acsl.org/wiki/index.php?title=Prefix/Infix/Postfix_Notation" target="_blank" rel="noopener">Prefix/Infix/Postfix</a>, <a href="http://www.categories.acsl.org/wiki/index.php?title=Bit-String_Flicking" target="_blank" rel="noopener">Bit-String Flicking</a>, <a href="http://www.categories.acsl.org/wiki/index.php?title=What_Does_This_Program_Do%3F" target="_blank" rel="noopener">What Does This Program Do?</a>']) });

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Mock Contest Drill', 'drill-acsl-c2-mock', 'Plenary: Mock Contest Drill',
  'Five card slots, like the contest: two notation, two bit strings, one program. Every card is new each time. Choose Quiz and 5 questions for another mock. Your progress is saved.',
  ['Why does the drill bring back the kinds you got wrong?', 'Mastery means getting each kind right three times in a row. The kinds you miss come back until you have them.']));

// ---------------------------------------------------------------- self-checks
for (const [k, i, ok, bad] of [['do-now', 0, ['14', ' 14'], ['18', '-14']], ['do-now', 1, ['a b + c * d -', 'ab+c*d-', 'A B + C * D -'], ['a b c * + d -', '- * + a b c d']],
  ['do-now-2', 0, ['10110'], ['110', '10111']], ['do-now-2', 1, ['00001'], ['1', '00101']]]) {
  for (const s of ok) assert(T(k, i, s), `${k} ${i} accepts ${s}`);
  for (const s of bad) assert(!T(k, i, s), `${k} ${i} rejects ${s}`);
}

// ---------------------------------------------------------------- drills
const EXT_BODY = DRILL_HEAD + String.raw`
  DrillData.register("acsl-c2-contest-ext", {
    title: "ACSL Contest 2 Extension: All Three Topics",
    subtitle: "Contest Day Do Now Extension",
    categories: [["cx-notation", "Prefix, Infix and Postfix"], ["cx-bits", "Bit-String Flicking"], ["cx-loops", "What Does This Program Do?"]],
    cards: [
      genCard("cx-01", "cx-notation", "prefix-eval"), genCard("cx-02", "cx-notation", "postfix-eval"), genCard("cx-03", "cx-notation", "to-prefix"),
      genCard("cx-04", "cx-bits", "bits-eval"), genCard("cx-05", "cx-bits", "bits-solve"), genCard("cx-06", "cx-bits", "bits-eval"),
      genCard("cx-07", "cx-loops", "loop-2"), genCard("cx-08", "cx-loops", "loop-3"), genCard("cx-09", "cx-loops", "loop-4"), genCard("cx-10", "cx-loops", "loop-5")
    ]
  });`;
const MOCK_BODY = DRILL_HEAD + String.raw`
  DrillData.register("acsl-c2-mock", {
    title: "ACSL Contest 2: Mock Contest",
    subtitle: "Two notation, two bit-string and one program question, new every time",
    categories: [["mk-notation", "Prefix, Infix and Postfix"], ["mk-bits", "Bit-String Flicking"], ["mk-loops", "What Does This Program Do?"]],
    cards: [
      genCard("mock-1", "mk-notation", ["prefix-eval", "postfix-eval"]),
      genCard("mock-2", "mk-notation", ["to-postfix", "to-prefix"]),
      genCard("mock-3", "mk-bits", "bits-eval"),
      genCard("mock-4", "mk-bits", "bits-solve"),
      genCard("mock-5", "mk-loops", ["loop-4", "loop-5", "loop-6"])
    ]
  });`;
writeDrill('acsl-c2-contest-ext', drillFile('acsl-c2-contest-ext', '// ACSL Junior Contest 2, Contest Day Do Now Extension: all three short-question topics.\n// Written by tools/build_acsl_c2_contest.mjs (edit the builder). Carries shared/acsl-pseudocode.js and Loop Tracer\'s\n// programs.js and contest-gen.js so every answer is worked out when the card is drawn.', EXT_BODY));
writeDrill('acsl-c2-mock', drillFile('acsl-c2-mock', '// ACSL Junior Contest 2 mock contest drill: 2 notation, 2 bit-string flicking, 1 What Does This Program Do?, as the\n// short questions are on the day. Original questions, drawn fresh every time.\n// Written by tools/build_acsl_c2_contest.mjs (edit the builder). Carries shared/acsl-pseudocode.js and Loop Tracer\'s\n// programs.js and contest-gen.js.', MOCK_BODY));

writeLesson(ID, 'ACSL Contest 2: Contest Day', steps, validators);
const ok = registerLesson(ID);
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets${ok ? ', registered' : ''}`);
void tps;
