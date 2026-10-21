// Builds LessonData/acsl-c2-loops.json: ACSL Junior Contest 2, What Does This Program Do? (loops), writes its
// drills (Drills/data/acsl-c2-loops-ext.js and acsl-c2-loops.js) and registers the lesson in the Competition
// section after the notation and bit-string lessons.
//   node tools/build_acsl_c2_loops.mjs
// Reading ACSL pseudocode, FOR with STEP (also negative), WHILE, nested loops, the x / k == int(x / k) test,
// accumulators and counters, and tracing fast in a contest by spotting the pattern. Every program on a slide and every
// answer is run through shared/acsl-pseudocode.js. EAL-light shape: one idea a slide, a teacher-only Think, Pair,
// Share under every heading (never giving away a check on its slide), predict-then-reveal, compare slides.
// Activities: Loop Tracer's Trace Table Race and Predict the Output (contest length). Plenary: the acsl-c2-loops drill.
// Questions are original, in the ACSL style; the official samples are linked, never copied.
import { ACSL, DRILL_HEAD, assert, c, code, columns, drillFile, esc, facts, makeSteps, numRe, out1, registerLesson, run, table, traceTable, tps, why, wordRe, writeDrill, writeLesson } from './acsl_c2_kit.mjs';

const ID = 'acsl-c2-loops';
const P = 'acl';
const { validators, checkStep, embed, T } = makeSteps(P);
const steps = [];
const V = (expr, vars) => ACSL.format(ACSL.evalExpr(expr, vars));

// ---------------------------------------------------------------- Do Now: a warm-up puzzle (repeat a rule)
let m = 3; for (let t = 0; t < 4; t++) m = m * 2 + 1;
const COUNT = []; for (let k = 2; k <= 20; k += 3) COUNT.push(k);
assert(m === 63 && COUNT.length === 7, 'do-now answers');
const WT_DONOW = { title: 'Walk me through it: repeat a rule', steps: [
  { text: 'A similar puzzle: start with <strong>2</strong>. Triple it, then take away 1. Do this <strong>3 times</strong>.', visual: '<div class="wt-big">2</div>' },
  { text: 'Turn 1: 2 &times; 3 = 6, then 6 take away 1 is 5.', visual: '<div class="wt-big">2 &rarr; <span class="wt-hl">5</span></div>' },
  { text: 'Turn 2 starts from the new number: 5 &times; 3 = 15, then 14.', visual: '<div class="wt-big">2 &rarr; 5 &rarr; <span class="wt-hl">14</span></div>' },
  { text: 'Turn 3: 14 &times; 3 = 42, then 41. That was the third turn, so stop: the answer is 41.', visual: '<div class="wt-big">2 &rarr; 5 &rarr; 14 &rarr; <span class="wt-hl">41</span></div>' },
  { text: 'Counting in steps: count from 1 to 15 in steps of 4. Write every number you say.', visual: '<div class="wt-big"><span class="wt-hl">1</span>, 5, 9, 13</div>' },
  { text: 'The next one would be 17. That is past 15, so stop. You said 4 numbers.', visual: '<div class="wt-big">1, 5, 9, 13, <span class="wt-dim">17</span></div>' },
  { text: 'Now do your puzzle the same way: one turn at a time, and write every number down.', visual: '<div class="wt-big" style="font-size:30px">one turn &rarr; write it &rarr; next turn</div>' }
] };
assert(!/\b63\b|\b7\b/.test(JSON.stringify(WT_DONOW)), 'walkthrough shows a Do Now answer');
steps.push(checkStep('do-now', 'Do Now: Repeat the Rule', 'Do Now: Repeat the Rule', 'A warm-up puzzle. There is no code yet: follow each rule exactly.', [
  { label: 'Start with 3. Double it, then add 1. Do this 4 times. What number do you end with?', answer: numRe(m), line: true, feedback: 'Write down the number after every turn. Each turn starts from the last number.' },
  { label: 'Count from 2 to 20 in steps of 3. How many numbers do you say?', answer: numRe(COUNT.length), line: true, feedback: 'Write the numbers: 2, 5, ... Stop before you pass 20. Then count them.' }
], '', ['Why is it easy to lose count when you repeat a rule many times?', 'You have to remember which turn you are on. Writing every number down stops you from losing your place.']));
steps[steps.length - 1].walkthrough = WT_DONOW;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-acsl-c2-loops-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these: repeating a rule, prefix, infix and postfix, and bit-string flicking. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'What Does This Program Do? Loops',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">ACSL Junior Contest 2</p><h2 class="lesson-h2">What Does This Program Do? Loops</h2><p>Competition</p></div>' +
    facts(['<strong>Today:</strong> read ACSL pseudocode, follow FOR and WHILE loops, and find what a program outputs.',
      '<strong>Every time, ask why:</strong> why does the loop stop there? Why is that the output?',
      '<strong>Activities:</strong> a trace table race, then contest-length programs.']) +
    why('Why does a contest ask what a program outputs, instead of asking you to write one?', 'Reading code exactly is a skill on its own. If you can follow every line, you can find bugs and check your own programs.') });

// ---------------------------------------------------------------- reading ACSL pseudocode
const READ = ['a = 5 : b = 3', 'a = a + b', 'OUTPUT a == 8'];
const READ_OUT = out1(READ);
assert(READ_OUT === 'TRUE', 'reading program');
steps.push({ id: 'reading', label: 'Reading ACSL Pseudocode',
  content: '<h2 class="lesson-h2">Reading ACSL Pseudocode</h2>' +
    tps('Predict: what does this program output? Why does line 3 not change a?', `<p>It outputs <strong>${READ_OUT}</strong>.</p><p>== asks a question: is a equal to 8? A single = stores a value. Line 3 only asks, so a stays 8.</p>`, 'Show the worked answer') +
    columns(code(READ), table([[c('a = 5'), 'store 5 in a'], [c('a == 5'), 'is a equal to 5? TRUE or FALSE'], [c('a = 5 : b = 3'), 'two statements on one line'], [c('a != b'), 'is a not equal to b?'], [c('OUTPUT a'), 'show the value of a']], ['Code', 'Meaning'])) +
    facts(['<code>=</code> stores. <code>==</code> compares.', 'A colon <code>:</code> separates statements on the same line.', 'Keywords can be in capitals or small letters.']) });

// ---------------------------------------------------------------- operators
const OPS = [['7 / 2', 'real division'], ['7 % 2', 'remainder'], ['int(7 / 2)', 'whole number part'], ['2 ^ 3', 'power (also written 2 ↑ 3)'], ['abs(3 - 8)', 'distance from 0'], ['sqrt(16)', 'square root']]
  .map(([e, w]) => [c(e), `<strong>${V(e)}</strong>`, w]);
assert(OPS.map((r) => r[1]).join() === '<strong>3.5</strong>,<strong>1</strong>,<strong>3</strong>,<strong>8</strong>,<strong>5</strong>,<strong>4</strong>', 'operator table');
const PREC_Q = V('2 + 3 * 4 ^ 2');
assert(PREC_Q === '50', 'precedence example');
steps.push({ id: 'operators', label: 'Operators and Functions',
  content: '<h2 class="lesson-h2">Operators and Functions</h2>' +
    tps('Predict: what is 2 + 3 * 4 ^ 2? Why is it not 400?', `<p>It is <strong>${PREC_Q}</strong>. The power goes first: 4 ^ 2 = 16. Then 3 * 16 = 48. Then 2 + 48 = 50.</p><p>400 comes from working left to right, which ignores the order.</p>`, 'Show the worked answer') +
    columns(table(OPS, ['Code', 'Value', 'What it does']),
      facts(['Order: <strong>!</strong> first, then <strong>^</strong>, then <strong>* / %</strong>, then <strong>+ -</strong>, then comparisons, then <strong>&amp;&amp;</strong> and <strong>||</strong>.', 'The same level goes left to right.', '<code>/</code> keeps the decimal part. <code>int()</code> drops it.'])) });

const CO = [V('17 / 4'), V('17 % 4'), V('int(17 / 4)'), V('3 + 2 ^ 3 * 2')];
assert(CO.join() === '4.25,1,4,19', 'check-operators answers');
steps.push(checkStep('check-operators', 'Check: Operators', 'Check: Operators', 'Work out each value.', [
  { label: c('17 / 4'), answer: numRe(4.25), feedback: '/ is real division: keep the decimal part.' },
  { label: c('17 % 4'), answer: numRe(1), feedback: '% gives the remainder. How many are left after taking out all the 4s?' },
  { label: c('int(17 / 4)'), answer: numRe(4), feedback: 'Work out 17 / 4 first. Then int() drops the decimal part.' },
  { label: c('3 + 2 ^ 3 * 2'), answer: numRe(19), feedback: 'Power first, then *, then +.' }
], '', ['Why does 9 % 3 give 0?', '3 goes into 9 exactly three times. Nothing is left over, so the remainder is 0.']));

// ---------------------------------------------------------------- FOR
const FOR1 = ['s = 0', 'FOR i = 1 TO 4', '  s = s + i', 'NEXT i', 'OUTPUT s'];
const FOR1_OUT = out1(FOR1);
assert(FOR1_OUT === '10', 'for program');
steps.push({ id: 'for-loop', label: 'FOR Loops',
  content: '<h2 class="lesson-h2">FOR Loops</h2>' +
    tps('Predict: what is output? Why does the loop stop after i = 4?', `<p>It outputs <strong>${FOR1_OUT}</strong>: 1 + 2 + 3 + 4.</p><p>After i = 4, NEXT makes i = 5. That is past the end value 4, so the loop stops.</p>`, 'Show the worked answer') +
    columns(code(FOR1) + facts(['<code>FOR i = 1 TO 4</code> gives i the values 1, 2, 3, 4 in turn.', 'The lines between FOR and NEXT run once for each value.', '<code>NEXT i</code> adds 1 to i and goes back to the top.']), traceTable(FOR1)) });

const loopValues = (head) => run([head, '  OUTPUT i', 'NEXT i']).outputs.join(', ');
const SV = [['FOR i = 1 TO 9 STEP 2'], ['FOR i = 5 TO 1 STEP -1'], ['FOR i = 1 TO 10 STEP 4']].map(([h]) => [c(h), loopValues(h)]);
assert(SV.map((r) => r[1]).join(' | ') === '1, 3, 5, 7, 9 | 5, 4, 3, 2, 1 | 1, 5, 9', 'step values');
steps.push({ id: 'step', label: 'Compare: STEP Up and STEP Down',
  content: '<h2 class="lesson-h2">Compare: STEP Up and STEP Down</h2>' +
    tps('Why does the third loop stop at 9, not at 10?', '<p>i goes 1, 5, 9. The next value is 13, which is past 10, so the loop stops.</p><p>The end value is a limit. The loop does not have to land on it.</p>') +
    table(SV, ['Loop', 'Values of i']) +
    facts(['<code>STEP 2</code> adds 2 each time. Without STEP, it adds 1.', '<code>STEP -1</code> counts down. The loop stops when i goes <strong>below</strong> the end value.', 'Work out the start, the end and the step once, at the start of the loop.']) });

const CF = ['t = 0', 'FOR k = 2 TO 11 STEP 3', '  t = t + k', 'NEXT k', 'OUTPUT t'];
const CF_RUNS = run(['n = 0', 'FOR k = 2 TO 11 STEP 3', '  n = n + 1', 'NEXT k', 'OUTPUT n']).outputs[0];
const CF_OUT = out1(CF);
const CF_DOWN = run(['n = 0', 'FOR j = 20 TO 1 STEP -5', '  n = n + 1', 'NEXT j', 'OUTPUT n']).outputs[0];
assert(CF_RUNS === '4' && CF_OUT === '26' && CF_DOWN === '4', 'check-for answers');
steps.push(checkStep('check-for', 'Check: FOR and STEP', 'Check: FOR and STEP', '', [
  { label: 'How many times does line 3 run?', answer: numRe(4), feedback: 'Write the values of k: start at 2 and add 3. Stop before you pass 11.' },
  { label: 'What is output?', answer: numRe(26), feedback: 'Add up every value that k takes.' },
  { label: 'How many times does the body of <code>FOR j = 20 TO 1 STEP -5</code> run?', answer: numRe(4), feedback: 'Count down from 20 in fives. Stop before you go below 1.' }
], code(CF), ['FOR i = 1 TO 5 STEP 2: why does the body run three times?', 'i takes the values 1, 3 and 5. The next value, 7, is past 5.']));

steps.push(embed('activity-1', 'Activity 1: Trace Table Race', 'loop-tracer', 'Activity 1: Trace Table Race',
  'The program runs one step at a time. Type each new value before it is shown, then press Enter. One try for each value: keep your streak going.',
  ['Why does a trace table get a new row only when a value changes?', 'The table records what the program does. A row shows the moment a variable gets a new value, so you can follow every step.'],
  'mode=trace&level=2&rounds=3'));

// ---------------------------------------------------------------- accumulators and counters
const ACC = (body) => ['s = 0 : c = 0', 'FOR i = 3 TO 7', '  ' + body, 'NEXT i', 'OUTPUT s + c'];
const SUM = run(['s = 0', 'FOR i = 3 TO 7', '  s = s + i', 'NEXT i', 'OUTPUT s']).outputs[0];
const CNT = run(['c = 0', 'FOR i = 3 TO 7', '  c = c + 1', 'NEXT i', 'OUTPUT c']).outputs[0];
assert(SUM === '25' && CNT === '5', 'accumulator and counter');
steps.push({ id: 'accumulators', label: 'Compare: Total and Counter',
  content: '<h2 class="lesson-h2">Compare: Total and Counter</h2>' +
    tps('i goes up to 7. Why does c end at 5, not 7?', `<p>c adds 1 each time the loop runs. The loop runs for i = 3, 4, 5, 6 and 7: that is 5 times.</p><p>s adds i itself, so s ends at 3 + 4 + 5 + 6 + 7 = ${SUM}.</p>`) +
    table([[c('s = s + i'), 'a <strong>total</strong> (accumulator)', 'adds the value of i', `<strong>${SUM}</strong>`], [c('c = c + 1'), 'a <strong>counter</strong>', 'adds 1 every time', `<strong>${CNT}</strong>`]], ['Line inside FOR i = 3 TO 7', 'Name', 'What it adds', 'At the end']) +
    facts(['A total starts at 0 and adds a value each time round.', 'A counter starts at 0 and adds 1 each time round.', 'A product starts at 1, because times 0 would always give 0.']) });
assert(ACC('s = s + i').length === 5, 'acc helper');

// ---------------------------------------------------------------- WHILE
const WH = (x) => [`x = ${x} : c = 0`, 'WHILE x < 50', '  x = x * 2', '  c = c + 1', 'END WHILE', 'OUTPUT c'];
const WH3 = out1(WH(3));
assert(WH3 === '5', 'while program');
steps.push({ id: 'while', label: 'WHILE Loops',
  content: '<h2 class="lesson-h2">WHILE Loops</h2>' +
    tps('Predict: what is output? Why does the loop stop when x is 96?', `<p>It outputs <strong>${WH3}</strong>. x goes 6, 12, 24, 48, 96.</p><p>The condition x &lt; 50 is checked at the top. 96 &lt; 50 is FALSE, so the loop stops.</p>`, 'Show the worked answer') +
    columns(code(WH(3)) + facts(['<code>WHILE cond</code> repeats the lines up to <code>END WHILE</code> while the condition is TRUE.', 'The condition is checked at the top, before each turn.', 'Something inside must change, or the loop never stops.']), traceTable(WH(3))) });

const WROWS = [3, 30, 60].map((x) => [String(x), `<strong>${out1(WH(x))}</strong>`]);
assert(WROWS.map((r) => r[1]).join() === '<strong>5</strong>,<strong>1</strong>,<strong>0</strong>', 'while compare');
steps.push({ id: 'compare-while', label: 'Compare: How Many Times?',
  content: '<h2 class="lesson-h2">Compare: How Many Times?</h2>' +
    tps('Why does the loop run 0 times when x starts at 60?', '<p>The condition is checked before the first turn. 60 &lt; 50 is FALSE, so the lines inside never run.</p><p>A FOR loop like FOR i = 5 TO 1 (no STEP) also runs 0 times.</p>') +
    columns(code(WH('?')), table(WROWS, ['x starts at', 'Output (c)'])) +
    facts(['FOR: you can count the turns before it starts.', 'WHILE: it runs until the condition is FALSE. It may run 0 times.']) });

const DS = ['n = 365 : s = 0', 'WHILE n > 0', '  s = s + n % 10', '  n = int(n / 10)', 'END WHILE', 'OUTPUT s'];
const DS_OUT = out1(DS);
const DS_RUNS = run(['n = 365 : t = 0', 'WHILE n > 0', '  t = t + 1', '  n = int(n / 10)', 'END WHILE', 'OUTPUT t']).outputs[0];
const DS_N1 = V('int(365 / 10)');
assert(DS_OUT === '14' && DS_RUNS === '3' && DS_N1 === '36', 'check-while answers');
steps.push(checkStep('check-while', 'Check: WHILE', 'Check: WHILE', '', [
  { label: 'What is n after the first time round the loop?', answer: numRe(36), feedback: '365 / 10 is 36.5. int() drops the decimal part.' },
  { label: 'How many times does the loop run?', answer: numRe(3), feedback: 'Keep going until n is 0. Count the turns.' },
  { label: 'What is output?', answer: numRe(14), feedback: 'n % 10 is the last digit. s adds up the digits.' }
], code(DS), ['n = 52. Why does int(n / 10) give 5?', '52 / 10 is 5.2, and int() drops the .2. Dividing by 10 and taking int() removes the last digit.']));

// ---------------------------------------------------------------- the int() test for "divides exactly"
const DIV = [3, 5, 4, 7].map((k) => [c(`12 / ${k}`), V(`12 / ${k}`), V(`int(12 / ${k})`), `<strong>${V(`12 / ${k} == int(12 / ${k})`)}</strong>`]);
assert(DIV.map((r) => r[3]).join() === '<strong>TRUE</strong>,<strong>FALSE</strong>,<strong>TRUE</strong>,<strong>FALSE</strong>', 'divides table');
steps.push({ id: 'divisible', label: 'Does k Divide x?',
  content: '<h2 class="lesson-h2">Does k Divide x?</h2>' +
    tps('Why does int() change 2.4 but not 4?', '<p>int() drops the decimal part. 4 has no decimal part, so it stays 4. 2.4 becomes 2.</p><p>So x / k == int(x / k) is TRUE only when x / k is a whole number: k divides x exactly.</p>') +
    table(DIV, ['x / k', 'value', 'int(x / k)', 'x / k == int(x / k)']) +
    facts(['<code>x / k == int(x / k)</code> is TRUE when k divides x exactly.', '<code>x % k == 0</code> tests the same thing.', 'Inside <code>FOR k = 1 TO x</code>, it finds the <strong>factors</strong> of x.']) });

const FAC = (n) => [`n = ${n} : c = 0`, 'FOR k = 1 TO n', '  IF n / k == int(n / k) THEN', '    c = c + 1', '  END IF', 'NEXT k', 'OUTPUT c'];
const F18 = out1(FAC(18)), F16 = out1(FAC(16)), D184 = V('18 / 4 == int(18 / 4)');
assert(F18 === '6' && F16 === '5' && D184 === 'FALSE', 'check-divisible answers');
steps.push(checkStep('check-divisible', 'Check: Count the Factors', 'Check: Count the Factors', '', [
  { label: 'Is <code>18 / 4 == int(18 / 4)</code> TRUE or FALSE?', answer: wordRe('FALSE'), feedback: 'Work out 18 / 4. Is it a whole number?' },
  { label: 'What is output?', answer: numRe(6), feedback: 'c counts every k that divides 18 exactly. List them in pairs: 1 and 18, ...' },
  { label: 'What is output when line 1 is <code>n = 16 : c = 0</code>?', answer: numRe(5), feedback: 'List the factors of 16 in pairs. One pair is the same number twice.' }
], code(FAC(18)), ['n = 21. Why do k = 3 and k = 7 both count?', '3 &times; 7 = 21, so 21 / 3 and 21 / 7 are both whole numbers. Factors come in pairs.']));

// ---------------------------------------------------------------- nested loops
const NEST = ['c = 0', 'FOR i = 1 TO 3', '  FOR j = 1 TO 4', '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
const NEST_OUT = out1(NEST);
assert(NEST_OUT === '12', 'nested');
const PAIRS = [1, 2, 3].map((i) => [String(i), [1, 2, 3, 4].map((j) => `(${i}, ${j})`).join(' ')]);
steps.push({ id: 'nested', label: 'Nested Loops',
  content: '<h2 class="lesson-h2">Nested Loops</h2>' +
    tps('Predict: what is output? Why is it not 3 + 4?', `<p>It outputs <strong>${NEST_OUT}</strong>.</p><p>The inner loop runs all 4 times for <strong>each</strong> value of i. 3 values of i &times; 4 values of j = 12.</p>`, 'Show the worked answer') +
    columns(code(NEST), table(PAIRS, ['i', 'pairs (i, j) the inner loop runs'])) +
    facts(['The inner loop starts again from the beginning every time the outer loop turns.', 'Same size every time: outer turns &times; inner turns.']) });

const TRI = ['c = 0', 'FOR i = 1 TO 3', '  FOR j = i TO 4', '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
const TRI_OUT = out1(TRI);
assert(TRI_OUT === '9', 'triangle');
const TRI_ROWS = [1, 2, 3].map((i) => [String(i), c(`FOR j = ${i} TO 4`), String(run(['n = 0', `FOR j = ${i} TO 4`, '  n = n + 1', 'NEXT j', 'OUTPUT n']).outputs[0])]);
steps.push({ id: 'compare-nested', label: 'Compare: j = 1 and j = i',
  content: '<h2 class="lesson-h2">Compare: j = 1 and j = i</h2>' +
    tps('Why does changing FOR j = 1 TO 4 into FOR j = i TO 4 give 9, not 12?', `<p>Now the inner loop starts at i, so it gets shorter each time: 4, then 3, then 2 turns.</p><p>4 + 3 + 2 = ${TRI_OUT}. You cannot just multiply.</p>`) +
    columns(code(TRI), table(TRI_ROWS, ['i', 'inner loop', 'turns'])) +
    facts(['When the inner loop uses i, count its turns for each i.', 'Then add them up.']) });

const NS = (rhs) => ['s = 0', 'FOR i = 1 TO 3', '  FOR j = 1 TO i', `    s = s + ${rhs}`, '  NEXT j', 'NEXT i', 'OUTPUT s'];
const NS_RUNS = out1(['c = 0', 'FOR i = 1 TO 3', '  FOR j = 1 TO i', '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c']);
const NS_J = out1(NS('j')), NS_I = out1(NS('i'));
assert(NS_RUNS === '6' && NS_J === '10' && NS_I === '14', 'check-nested answers');
steps.push(checkStep('check-nested', 'Check: Nested Loops', 'Check: Nested Loops', '', [
  { label: 'How many times does line 4 run?', answer: numRe(6), feedback: 'For each i, the inner loop runs i times. Add them up.' },
  { label: 'What is output?', answer: numRe(10), feedback: 'For each i, add 1 + 2 + ... + i. Then add those totals.' },
  { label: 'What is output if line 4 is <code>s = s + i</code>?', answer: numRe(14), feedback: 'Now each turn adds i, and there are i turns. What does that make for each i?' }
], code(NS('j')), ['FOR i = 1 TO 2 with FOR j = 1 TO i inside: why does the inner body run 3 times?', 'For i = 1 it runs once. For i = 2 it runs twice. 1 + 2 = 3.']));

// ---------------------------------------------------------------- tracing fast: spot the pattern
const SQ = ['a = 0', 'FOR i = 1 TO 6', '  FOR j = 1 TO i', '    a = a + i', '  NEXT j', 'NEXT i', 'c = 0', 'FOR k = 1 TO a', '  IF a / k == int(a / k) THEN c = c + 1', '  END IF', 'NEXT k', 'OUTPUT c'];
const SQ_R = run(SQ);
assert(SQ_R.vars.a === 91 && SQ_R.outputs[0] === '4', 'pattern program');
steps.push({ id: 'pattern', label: 'Trace Fast: Spot the Pattern',
  content: '<h2 class="lesson-h2">Trace Fast: Spot the Pattern</h2>' +
    tps('This program runs over 100 steps. Why is spotting the pattern faster than a trace table here?', `<p>The inner loop adds i, i times: that is i &times; i. So a = 1 + 4 + 9 + 16 + 25 + 36 = ${SQ_R.vars.a}.</p><p>The last loop counts the factors of ${SQ_R.vars.a}. In pairs: 1 &times; 91 and 7 &times; 13. So it outputs <strong>${SQ_R.outputs[0]}</strong>.</p>`, 'Show the worked answer') +
    columns(code(SQ), table([['adds i, i times', 'i &times; i'], [c('s = s + i') + ' for i = 1 to n', '1 + 2 + ... + n'], [c('x / k == int(x / k)'), 'k is a factor of x'], ['a count of factors', 'list factors in pairs']], ['If you see', 'It means'])) +
    facts(['First ask: what does each loop do? Say it in words.', 'Trace a few turns to check your idea. Then use it.']) });

steps.push(embed('activity-2', 'Activity 2: Predict the Output', 'loop-tracer', 'Activity 2: Predict the Output',
  'Contest-length programs. You get one try at each output. Then watch the trace and the pattern.',
  ['Why does the replay show only the first and the last rows?', 'The full trace has hundreds of rows. The start shows the pattern, and the end shows the answer.'],
  'mode=predict&level=6&rounds=4'));

// ---------------------------------------------------------------- practice (contest style)
const PR1 = ['c = 0', 'FOR i = 1 TO 60', '  IF i % 4 == 0 || i % 6 == 0 THEN c = c + 1', '  END IF', 'NEXT i', 'OUTPUT c'];
const PR1_OUT = out1(PR1);
assert(PR1_OUT === '20', 'practice 1');
steps.push(checkStep('practice', 'Practice: Contest Style (1 of 2)', 'Practice: Contest Style (1 of 2)', 'Contest style: one answer. Spot the pattern before you trace.', [
  { label: 'What is output?', answer: numRe(20), feedback: 'Count the multiples of 4 and the multiples of 6 up to 60. Some numbers are both: count them once.' }
], code(PR1), ['Up to 30, how would you count the numbers that are multiples of 2 or of 5, without listing them all?', 'Count the multiples of 2 and of 5, then take away the multiples of 10, because they were counted twice.']));

const PR2 = ['s = 0 : n = 0', 'FOR k = 50 TO 1 STEP -7', '  s = s + k', '  n = n + 1', 'NEXT k', 'OUTPUT s / n'];
const PR2_R = run(PR2);
assert(PR2_R.vars.n === 8 && PR2_R.outputs[0] === '25.5', 'practice 2');
steps.push(checkStep('practice-2', 'Practice: Contest Style (2 of 2)', 'Practice: Contest Style (2 of 2)', '', [
  { label: 'What is the value of n at the end?', answer: numRe(8), feedback: 'Write the values of k: 50, 43, ... Stop before you go below 1.' },
  { label: 'What is output?', answer: numRe(25.5), feedback: 'Add up the values of k, then divide by n. / keeps the decimal part.' }
], code(PR2), ['FOR k = 30 TO 1 STEP -9: why is the last value of k 3?', 'k goes 30, 21, 12, 3. The next value, -6, is below 1, so the loop stops.']));

// ---------------------------------------------------------------- the real sample
steps.push({ id: 'sample', label: 'Try the Real Sample',
  content: '<h2 class="lesson-h2">Try the Real Sample</h2>' +
    why('Why practise on a real past paper before the contest?', 'You see how the questions are written and how long they take. Nothing on the day is a surprise.') +
    '<p class="lesson-lead">ACSL publishes a sample Junior Contest 2. Try its What Does This Program Do? question on paper, then check it with your class.</p>' +
    facts(['<a href="http://datafiles.acsl.org/samples/contest2/2junior.pdf" target="_blank" rel="noopener">ACSL Junior Contest 2 sample (PDF)</a>',
      '<a href="http://www.categories.acsl.org/wiki/index.php?title=What_Does_This_Program_Do%3F" target="_blank" rel="noopener">ACSL wiki: What Does This Program Do?</a> (rules and more examples)',
      'Use what you learned today: say what each loop does, trace a few turns, then spot the pattern.']) });

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Loops Drill', 'drill-acsl-c2-loops', 'Plenary: Loops Drill',
  'Operators, FOR and STEP, WHILE, nested loops and the int() test. Every program is new each time. Your progress is saved.',
  ['Why does each card give you a new program every time?', 'You cannot remember the answer, so you have to trace it. That is the skill the contest tests.']));

// ---------------------------------------------------------------- self-checks
for (const [k, i, ok, bad] of [['do-now', 0, ['63', ' 63 '], ['31', '127']], ['do-now', 1, ['7'], ['6', '19']],
  ['check-operators', 0, ['4.25'], ['4', '4.2']], ['check-operators', 1, ['1'], ['4']], ['check-operators', 2, ['4'], ['4.25']], ['check-operators', 3, ['19'], ['35', '67']],
  ['check-for', 0, ['4'], ['3', '5']], ['check-for', 1, ['26'], ['39']], ['check-for', 2, ['4'], ['5']],
  ['check-while', 0, ['36'], ['36.5', '37']], ['check-while', 1, ['3'], ['4']], ['check-while', 2, ['14'], ['365']],
  ['check-divisible', 0, ['FALSE', 'false'], ['TRUE']], ['check-divisible', 1, ['6'], ['5']], ['check-divisible', 2, ['5'], ['4']],
  ['check-nested', 0, ['6'], ['9']], ['check-nested', 1, ['10'], ['6']], ['check-nested', 2, ['14'], ['10']],
  ['practice', 0, ['20'], ['25', '15']], ['practice-2', 0, ['8'], ['7']], ['practice-2', 1, ['25.5'], ['25', '204']]]) {
  for (const s of ok) assert(T(k, i, s), `${k} ${i} accepts ${s}`);
  for (const s of bad) assert(!T(k, i, s), `${k} ${i} rejects ${s}`);
}
// No loop words before the slides that teach them.
const before = (stepId, pattern, what) => {
  const at = steps.findIndex((s) => s.id === stepId);
  const early = steps.slice(0, at).filter((s) => !/^(do-now|title)/.test(s.id) && pattern.test(JSON.stringify([s.content, s.walkthrough])));
  assert(!early.length, `${what} appears before the ${stepId} slide, on ${early.map((s) => s.id).join(', ')}`);
};
before('for-loop', /\bFOR\b(?! and)/, 'FOR');
before('step', /\bSTEP\b/, 'STEP');
before('while', /\bWHILE\b/, 'WHILE');
before('divisible', /int\(x \/ k\)/, 'the int() test');

// ---------------------------------------------------------------- drills
const HEAD = DRILL_HEAD;

const EXT_BODY = HEAD + String.raw`
  DrillData.register("acsl-c2-loops-ext", {
    title: "ACSL Contest 2 Extension: Rules, Notation and Bit Strings",
    subtitle: "Loops lesson Do Now Extension",
    categories: [["ex-rule", "Repeat the Rule"], ["ex-notation", "Prefix, Infix and Postfix"], ["ex-bits", "Bit-String Flicking"]],
    cards: [
      { id: "ex-01", category: "ex-rule", randomize: function () {
          var s = R(2, 5), k = pick([2, 3]), a = R(1, 3), t = R(3, 4), x = s, i;
          for (i = 0; i < t; i++) x = x * k + a;
          var slip = s; for (i = 0; i < t - 1; i++) slip = slip * k + a;
          return { prompt: "Start with " + s + ". Multiply by " + k + ", then add " + a + ". Do this " + t + " times. What number do you end with?",
            answers: [String(x)], keywords: [numKw(x)], distractors: wrongNums(x, [slip, s * Math.pow(k, t) + a, x + a]),
            example: "Example: start with 2. Multiply by 3, then take away 1. Do this 3 times.\nTurn 1: 2 x 3 = 6, take away 1: 5.\nTurn 2: 5 x 3 = 15, take away 1: 14.\nTurn 3: 14 x 3 = 42, take away 1: 41.\nSo the example ends with 41.",
            working: ["Do one turn at a time and write each number down.", "Each turn starts from the number the last turn gave."],
            note: "Write each turn: the last one gives " + x + "." };
        } },
      { id: "ex-02", category: "ex-rule", randomize: function () {
          var a = R(1, 6), s = R(3, 6), b = a + s * R(4, 7) + R(0, s - 1), n = turns("FOR i = " + a + " TO " + b + " STEP " + s);
          return { prompt: "Count from " + a + " to " + b + " in steps of " + s + ". How many numbers do you say?",
            answers: [String(n)], keywords: [numKw(n)], distractors: wrongNums(n, [n + 1, n - 1, Math.round((b - a) / s)]),
            example: "Example: count from 1 to 15 in steps of 4.\nSay 1, 5, 9, 13. The next, 17, is past 15, so stop.\nThat is 4 numbers.",
            working: ["Write the numbers you say: start, then keep adding the step.", "Stop before you pass the end. Then count them."],
            note: "Counting in steps of " + s + " from " + a + " gives " + n + " numbers up to " + b + "." };
        } },
      { id: "ex-03", category: "ex-rule", randomize: function () {
          var a = R(30, 50), s = R(4, 7), b = R(1, 5), n = turns("FOR i = " + a + " TO " + b + " STEP -" + s);
          return { prompt: "Count down from " + a + " to " + b + " in steps of " + s + ". How many numbers do you say?",
            answers: [String(n)], keywords: [numKw(n)], distractors: wrongNums(n, [n + 1, n - 1]),
            example: "Example: count down from 20 to 1 in steps of 6.\nSay 20, 14, 8, 2. The next, -4, is below 1, so stop.\nThat is 4 numbers.",
            working: ["Write the numbers: start, then keep taking away the step.", "Stop before you go below the end. Then count them."],
            note: "Counting down in steps of " + s + " from " + a + " gives " + n + " numbers." };
        } },
      { id: "ex-04", category: "ex-rule", randomize: function () {
          var s = R(2, 7), lim = R(60, 200), x = s, n = 0;
          while (x <= lim) { x = x * 2; n++; }
          return { prompt: "Start with " + s + ". Keep doubling until the number is more than " + lim + ". How many times do you double?",
            answers: [String(n)], keywords: [numKw(n)], distractors: wrongNums(n, [n + 1, n - 1]),
            example: "Example: start with 3 and double until the number is more than 40.\n3, 6, 12, 24, 48. 48 is more than 40, so stop.\nYou doubled 4 times.",
            working: ["Write each number as you double it.", "Stop as soon as one is more than the limit, then count the doublings."],
            note: "Doubling " + n + " times takes " + s + " past " + lim + "." };
        } },
      genCard("ex-05", "ex-notation", "prefix-eval"),
      genCard("ex-06", "ex-notation", "postfix-eval"),
      genCard("ex-07", "ex-notation", "to-postfix"),
      genCard("ex-08", "ex-bits", "bits-eval"),
      genCard("ex-09", "ex-bits", "bits-eval"),
      genCard("ex-10", "ex-bits", "bits-solve")
    ]
  });`;

const PLEN_BODY = HEAD + String.raw`
  function opCard(id, kind) {
    return { id: id, category: "lp-read", randomize: function () {
      var a, b, e, ans, wrong, ex, work;
      if (kind === "div") {
        do { a = R(11, 39); b = pick([4, 5, 8]); } while (a % b === 0);
        e = a + " / " + b; ans = val(e); wrong = [Math.floor(a / b), a % b, Math.floor(a / b) + 1];
        ex = "Example: 3 / 8. / is real division, so keep the decimal part: 3 / 8 = 0.375."; work = ["/ is real division.", "Keep the decimal part."];
      } else if (kind === "mod") {
        do { a = R(11, 39); b = pick([3, 4, 6, 7]); } while (a % b === 0);
        e = a + " % " + b; ans = val(e); wrong = [Math.floor(a / b), b - ans, ans + b];
        ex = "Example: 23 % 5. Take out all the 5s: 5 x 4 = 20. 23 - 20 = 3 is left, so 23 % 5 = 3."; work = ["% gives the remainder.", "Take out as many whole lots as you can. What is left?"];
      } else if (kind === "int") {
        do { a = R(11, 59); b = pick([3, 4, 6, 7]); } while (a % b === 0);
        e = "int(" + a + " / " + b + ")"; ans = val(e); wrong = [ans + 1, a % b, ans - 1];
        ex = "Example: int(17 / 5). 17 / 5 = 3.4, and int() drops the .4, so it is 3."; work = ["Work out the division first.", "int() drops the decimal part."];
      } else {
        var x = R(2, 6), y = R(2, 5), z = R(2, 3), w = R(1, 9);
        e = w + " + " + x + " * " + y + " ^ " + z; ans = val(e);
        wrong = [(w + x) * Math.pow(y, z), Math.pow((w + x) * y, z), w + Math.pow(x * y, z)];
        ex = "Example: 1 + 2 * 3 ^ 2. Power first: 3 ^ 2 = 9. Then 2 * 9 = 18. Then 1 + 18 = 19."; work = ["Power first.", "Then *, then +."];
      }
      return { prompt: "What is the value of this expression?\n" + e, answers: [ACSLPseudo.format(ans)], keywords: [numKw(ans)], distractors: wrongNums(ans, wrong),
        example: ex, working: work, note: e + " = " + ACSLPseudo.format(ans) };
    } };
  }
  function turnsCard(id, down) {
    return { id: id, category: "lp-for", randomize: function () {
      var a, b, s, head;
      if (down) { a = R(25, 60); s = R(3, 8); b = R(0, 6); head = "FOR k = " + a + " TO " + b + " STEP -" + s; }
      else { a = R(1, 5); s = R(2, 5); b = a + s * R(3, 7) + R(0, s - 1); head = "FOR k = " + a + " TO " + b + " STEP " + s; }
      var n = turns(head), lines = ["t = 0", head, "  t = t + k", "NEXT k", "OUTPUT t"];
      return { prompt: "How many times does line 3 run?\n" + lines.join("\n"), answers: [String(n)], keywords: [numKw(n)], distractors: wrongNums(n, [n + 1, n - 1, Math.abs(b - a)]),
        example: down ? "Example: FOR j = 20 TO 1 STEP -6.\nj takes 20, 14, 8, 2. The next, -4, is below 1, so the loop stops.\nThe body runs 4 times." : "Example: FOR j = 2 TO 13 STEP 4.\nj takes 2, 6, 10. The next, 14, is past 13, so the loop stops.\nThe body runs 3 times.",
        working: ["Write the values of k: the start, then add the STEP each time.", down ? "Stop before k goes below the end value." : "Stop before k goes past the end value."],
        note: "The loop runs " + n + " times." };
    } };
  }
  function lastCard(id) {
    return { id: id, category: "lp-for", randomize: function () {
      var a = R(1, 6), s = R(3, 6), b = a + s * R(3, 6) + R(1, s - 1), head = "FOR k = " + a + " TO " + b + " STEP " + s;
      var last = Number(runOut(["x = 0", head, "  x = k", "NEXT k", "OUTPUT x"]));
      return { prompt: "What is the last value of k that line 3 uses?\n" + ["x = 0", head, "  x = k", "NEXT k", "OUTPUT x"].join("\n"), answers: [String(last)], keywords: [numKw(last)],
        distractors: wrongNums(last, [b, last + s, b - 1]),
        example: "Example: FOR j = 3 TO 20 STEP 5.\nj takes 3, 8, 13, 18. The next, 23, is past 20.\nSo the last value used is 18.",
        working: ["Write the values of k in order.", "The end value is a limit: k does not have to land on it."],
        note: "k goes up in steps of " + s + "; the last value not past " + b + " is " + last + "." };
    } };
  }
  function whileTurnsCard(id) {
    return { id: id, category: "lp-while", randomize: function () {
      var x = R(1, 9), k = pick([2, 3]), lim = R(30, 150);
      var lines = ["x = " + x, "WHILE x < " + lim, "  x = x * " + k, "END WHILE", "OUTPUT x"];
      var n = Number(runOut(["x = " + x + " : n = 0", "WHILE x < " + lim, "  x = x * " + k, "  n = n + 1", "END WHILE", "OUTPUT n"]));
      return { prompt: "How many times does line 3 run?\n" + lines.join("\n"), answers: [String(n)], keywords: [numKw(n)], distractors: wrongNums(n, [n + 1, n - 1]),
        example: "Example: x = 5, WHILE x < 70, x = x * 2.\nx goes 10, 20, 40, 80. 80 < 70 is FALSE, so it stops.\nLine 3 ran 4 times.",
        working: ["Write x after each turn.", "Check the condition at the top before every turn."],
        note: "x reaches " + runOut(lines) + " after " + n + " turns." };
    } };
  }
  function divCard(id) {
    return { id: id, category: "lp-nested", randomize: function () {
      var x = pick([12, 18, 20, 24, 28, 30, 36, 42, 45, 48]), k = R(2, 9), ans = val(x + " / " + k + " == int(" + x + " / " + k + ")") ? "TRUE" : "FALSE";
      return { prompt: "Is this TRUE or FALSE?\n" + x + " / " + k + " == int(" + x + " / " + k + ")", answers: [ans], keywords: [new RegExp("^\\s*" + ans + "\\s*$", "i")],
        distractors: [ans === "TRUE" ? "FALSE" : "TRUE"],
        working: ["Work out the division first. Is it a whole number?", "int() only changes a number with a decimal part."],
        note: x + " / " + k + " = " + ACSLPseudo.format(x / k) + (ans === "TRUE" ? ": a whole number, so " + k + " divides " + x + " exactly." : ": not a whole number.") };
    } };
  }

  DrillData.register("acsl-c2-loops", {
    title: "ACSL Contest 2: What Does This Program Do? (Loops)",
    subtitle: "Plenary drill",
    categories: [["lp-read", "Reading ACSL Pseudocode"], ["lp-for", "FOR and STEP"], ["lp-while", "WHILE Loops"], ["lp-nested", "Nested Loops and int()"]],
    cards: [
      opCard("read-01", "div"), opCard("read-02", "mod"), opCard("read-03", "int"), opCard("read-04", "prec"),
      { id: "read-05", category: "lp-read", prompt: "Which symbol asks whether two values are equal?", answers: ["=="], keywords: [/^\s*==\s*$/],
        distractors: ["=", "!=", ":"], working: ["One symbol stores a value. Another one asks a question.", "The question version is written twice."],
        note: "== compares. A single = stores a value." },
      turnsCard("for-01", false), turnsCard("for-02", true), lastCard("for-03"),
      genCard("for-04", "lp-for", "loop-1"), genCard("for-05", "lp-for", "loop-2"),
      genCard("while-01", "lp-while", "loop-3"), genCard("while-02", "lp-while", "loop-3"), whileTurnsCard("while-03"),
      { id: "while-04", category: "lp-while", randomize: function () {
          var lim = R(20, 60), x = pick([lim + R(1, 20), R(2, 5)]);
          var lines = ["x = " + x + " : c = 0", "WHILE x < " + lim, "  x = x + 7", "  c = c + 1", "END WHILE", "OUTPUT c"], n = Number(runOut(lines));
          return { prompt: "What is output?\n" + lines.join("\n"), answers: [String(n)], keywords: [numKw(n)], distractors: wrongNums(n, [n + 1, n - 1 < 0 ? 2 : n - 1]),
            example: "Example: x = 40 : c = 0, then WHILE x < 30 adds 5 to x and 1 to c.\n40 < 30 is FALSE before the first turn, so the loop never runs.\nc stays at 0.",
            working: ["Check the condition before the first turn.", "Each turn adds 7 to x. Count the turns."],
            note: "The loop runs " + n + " times." };
        } },
      divCard("nest-01"), genCard("nest-02", "lp-nested", "loop-4"), genCard("nest-03", "lp-nested", "loop-5"), genCard("nest-04", "lp-nested", "loop-5"),
      genCard("nest-05", "lp-nested", "loop-6"), genCard("nest-06", "lp-nested", "loop-6")
    ]
  });`;

writeDrill('acsl-c2-loops-ext', drillFile('acsl-c2-loops-ext', '// ACSL Junior Contest 2, loops lesson Do Now Extension: repeating a rule, prefix, infix and postfix, bit-string flicking.\n// Written by tools/build_acsl_c2_loops.mjs (edit the builder). Carries shared/acsl-pseudocode.js and Loop Tracer\'s\n// programs.js and contest-gen.js so every answer is worked out when the card is drawn.', EXT_BODY));
writeDrill('acsl-c2-loops', drillFile('acsl-c2-loops', '// ACSL Junior Contest 2, What Does This Program Do? (loops): the plenary drill.\n// Written by tools/build_acsl_c2_loops.mjs (edit the builder). Carries shared/acsl-pseudocode.js and Loop Tracer\'s\n// programs.js and contest-gen.js so every program is new and its answer is run when the card is drawn.', PLEN_BODY));

writeLesson(ID, 'ACSL Contest 2: What Does This Program Do? (Loops)', steps, validators);
const ok = registerLesson(ID);
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets${ok ? ', registered' : ''}`);
void esc; void tps;
