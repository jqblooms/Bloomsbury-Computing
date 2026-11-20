// Builds Drills/data/y9-3-1-db-drill.js: Year 9, 3.1 Pseudocode: Data Bridge Questions. A Drills-library drill (it is not
// in any lesson) that teaches every question in the Exam Game set y9-pseudocode (shell ExamGameSetY9Pseudocode.gs),
// the set Data Bridge plays in the 3.1 lesson. The questions' wording, programs and numbers are read from the shell
// file itself, so they match exactly. Every answer that comes from a program is checked by running it in
// shared/pseudocode-engine.js here, and every card is graded against its own answer and distractors.
//   node tools/build_y9_3_1_db_drill.mjs        (BC_SHELL = the shell folder, if not the usual one)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = process.env.BC_SHELL || path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
const ID = 'y9-3-1-db-drill';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- the set, read from the shell
const sctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(SHELL, 'ExamGameSetY9Pseudocode.gs'), 'utf8'), sctx);
const SET = vm.runInContext('EXAM_GAME_SET_Y9_PSEUDOCODE', sctx);
const Q = (qid) => { const q = SET.questions.find((x) => x.qid === qid); assert(q, 'set question ' + qid); return q; };
const codeOf = (q) => q.blocks.find((b) => b.type === 'code').lines;
const num2 = (i) => (i < 9 ? '0' : '') + (i + 1);
const showCode = (lines) => lines.map((l, i) => num2(i) + ' ' + l).join('\n');
// The question as the set shows it: paras, the numbered program, options; [n] marks and answer lines left out.
// upTo: stop before the first para that matches it (for one part of a question).
function qText(q, opts = {}) {
  const out = [];
  for (const b of q.blocks) {
    if (b.type === 'para') {
      if (/^\[\d+\]$/.test(b.text)) continue;
      if (opts.skip && opts.skip.test(b.text)) continue;
      out.push(b.text);
    } else if (b.type === 'code') out.push(showCode(b.lines));
    else if (b.type === 'options' && !opts.noOptions) out.push(b.items.map((t, i) => 'ABCD'[i] + '  ' + t).join('\n'));
    else if (b.type === 'table') out.push(b.head.join(' | ') + '\n' + b.rows.map((r) => r.map((c) => c || '?').join(' | ')).join('\n'));
  }
  return out.join('\n');
}
function run(lines, inputs = []) {
  const r = runPseudocode(lines.join('\n').replace(/←/g, '<-'), {}, 20000, inputs.map(String));
  assert(!r.error, 'program runs: ' + (r.error && r.error.message) + '\n' + lines.join('\n'));
  return r.outputs.map(String);
}
const one = (lines, inputs) => { const o = run(lines, inputs); assert(o.length === 1, 'one output: ' + o.join('|')); return o[0]; };

// ---------------------------------------------------------------- answer patterns
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const numRe = (n) => new RegExp('^\\s*' + escRe(String(n)) + '\\s*\\.?\\s*$', 'i');
const lineNumRe = (list) => new RegExp('^\\s*(line\\s*)?(' + list.map((n) => '0?' + n).join('|') + ')\\s*\\.?\\s*$', 'i');
// A pseudocode line as a pattern: any spacing, ← or <- or =, THEN optional, any case.
function codePat(line) {
  const parts = line.trim().replace(/\s+THEN$/, '').split(/\s+/).map((t) => t === '←' ? '(←|<-|<--|=)' : escRe(t).replace(/\\\[/g, '\\s*\\[\\s*').replace(/\\\]/g, '\\s*\\]'));
  return parts.join('\\s*') + (/\s+THEN$/.test(line.trim()) ? '(\\s*THEN)?' : '');
}
const lineRe = (variants) => new RegExp('^\\s*(' + variants.map(codePat).join('|') + ')\\s*\\.?\\s*$', 'i');
// "6, INPUT Score": the line number, then the corrected line.
const fixRe = (n, variants) => new RegExp('^\\s*(line\\s*)?0?' + n + '\\s*[,:;.\\-]?\\s*(' + variants.map(codePat).join('|') + ')\\s*\\.?\\s*$', 'i');
// A list of line numbers, in any order, nothing else.
function lineSetRe(list) {
  return new RegExp('^' + list.map((n) => '(?=.*(^|\\D)0?' + n + '(\\D|$))').join('') + '(lines?|and|&|,|;|\\s|(^|\\D)0?(' + list.join('|') + ')(?!\\d))*\\.?\\s*$', 'i');
}
const FIX_FMT = 'Type the line number, then the correct line';

// ---------------------------------------------------------------- cards
const cards = [];
function add(c) { cards.push(c); return c; }
const exam = (q) => q.fallback;

// ===== Line by Line (cat ln)
{
  const q = Q('y9p-own-lines'), L = codeOf(q), o = one(L);
  assert(o === '12' && q.model === 'Output: ' + o, 'lines');
  add({ id: 'q-lines', category: 'ln', prompt: qText(q), answers: [o], keywords: [numRe(o)], distractors: ['18', '4', '8'],
    working: ['Line 4 uses the value A holds now. Work out B first.', 'Line 5 uses the new B, and its result replaces the old A.'], note: exam(q) });
}
{
  const q = Q('y9p-own-copy'), L = codeOf(q), o = one(L);
  assert(o === '7', 'copy');
  add({ id: 'q-copy', category: 'ln', prompt: qText(q), answers: [o], keywords: [numRe(o)], distractors: ['12', '5', '0'],
    working: ['Line 4 copies the value of P into Q, once.', 'Which variable does line 5 change? Is it the one that is output?'], note: exam(q) });
}
{
  const q = Q('y9p-own-trace'), L = codeOf(q), r = run(L.slice(0, 6).concat([]).map((l) => l).concat([]));
  // Watch Total after each pass by running the loop with an OUTPUT inside it.
  const watched = run(['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total ← 0', 'FOR Count ← 2 TO 4', '    Total ← Count + 1', '    OUTPUT Total', 'NEXT Count']);
  const out = one(L);
  assert(JSON.stringify(L) === JSON.stringify(['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total ← 0', 'FOR Count ← 2 TO 4', '    Total ← Count + 1', 'NEXT Count', 'OUTPUT Total']), 'trace program as expected');
  const ans = watched.concat(out).join(', ');
  assert(ans === '3, 4, 5, 5' && r.length === 0, 'trace ' + ans);
  add({ id: 'q-trace', category: 'ln', prompt: qText(q), format: 'Type Total after each pass, then the output, with commas',
    answers: [ans], keywords: [new RegExp('^\\D*' + watched.concat(out).join('\\D+') + '\\D*$')], distractors: ['2, 5, 9, 9', '3, 7, 12, 12', '3, 4, 5, 12'],
    working: ['Line 5 says Total ← Count + 1. Does it use the old Total at all?', 'Work out line 5 with Count = 2 first, then with 3, then with 4.'], note: exam(q) });
}

// ===== Statement types: 0478/22 May/June 2024 7(a) (cat st)
{
  const q = Q('y9p-24j22-7a');
  const base = qText(q, { skip: /^\(a\)/ }) + '\n(a) Give a line number for each of these types of statement:\n';
  add({ id: 'q-st-assign', category: 'st', prompt: base + 'Assignment statement', answers: ['05'], keywords: [lineNumRe([5, 6, 9, 12])], distractors: ['07', '08', '15'],
    working: ['An assignment gives a variable a value with the arrow.', 'Find a line with a variable on the left of ←.'], note: exam(q) });
  add({ id: 'q-st-select', category: 'st', prompt: base + 'Selection statement', answers: ['08'], keywords: [lineNumRe([8, 11])], distractors: ['05', '07', '15'],
    working: ['Selection chooses which lines run, by checking a condition.', 'Which keyword checks a condition?'], note: exam(q) });
  add({ id: 'q-st-iter', category: 'st', prompt: base + 'Iteration statement', answers: ['07'], keywords: [lineNumRe([7, 14])], distractors: ['05', '08', '15'],
    working: ['Iteration repeats lines again and again.', 'Which keyword starts a loop?'], note: exam(q) });
}

// ===== Inside or After the Loop (cat lp)
{
  const q = Q('y9p-own-out-inside'), o = run(codeOf(q));
  assert(o.length === 3 && q.model.endsWith(': 3'), 'out inside');
  add({ id: 'q-out-inside', category: 'lp', prompt: qText(q), answers: ['3'], keywords: [numRe(3)], distractors: ['1', '2', '4'],
    working: ['Is OUTPUT Number before NEXT Count or after it?', 'A line inside the loop runs once on every pass. How many passes are there?'], note: exam(q) });
}
{
  const q = Q('y9p-own-out-after'), o = one(codeOf(q));
  assert(o === '54', 'out after');
  add({ id: 'q-out-after', category: 'lp', prompt: qText(q), answers: [o], keywords: [numRe(o)], distractors: ['18', '6', '162'],
    working: ['Number is multiplied by 3 on every pass. Write its value after each pass.', 'OUTPUT is after NEXT Count, so it runs once, when the loop has finished.'], note: exam(q) });
}
{
  const q = Q('y9p-own-reset'), o = one(codeOf(q));
  assert(o === '5', 'reset');
  add({ id: 'q-reset', category: 'lp', prompt: qText(q), answers: [o], keywords: [numRe(o)], distractors: ['20', '0', '25'],
    working: ['Line 4 is inside the loop. When does it run?', 'Work out Total at the end of the last pass only.'], note: exam(q) });
}
{
  const q = Q('y9p-own-reset-line'), L = codeOf(q);
  const fixed = [L[0], L[1], L[3], L[2], L[4], L[5], L[6]];
  assert(one(L) === '6' && one(fixed) === '18', 'reset line');
  add({ id: 'q-reset-line', category: 'lp', prompt: qText(q), answers: ['Line 4'], keywords: [lineNumRe([4])], distractors: ['Line 3', 'Line 5', 'Line 7'],
    working: ['Which line should run only once, before the adding starts?', 'A line inside the loop runs on every pass.'], note: exam(q) });
}
{
  const q = Q('y9p-own-reset-explain');
  add({ id: 'q-reset-why', category: 'lp', prompt: qText(q), answers: ['Total is set back to 0 on every pass, so only the last value 6 is kept'],
    keywords: [/^(?=.*(\b0\b|\bzero\b|\breset))(?=.*\b(pass|passes|loop|time|times|every|each)\b)(?=.*(\b6\b|\blast\b|\bonly\b|\blost\b))/i],
    distractors: ['Total is set to 0 once before the loop, so it never adds Count', 'Count goes up to 6 on the last pass, so Total is added one time', 'Line 5 adds 5 to Total on every pass, so Total ends one too big'],
    working: ['Line 4 is inside the loop. What does it do to Total at the start of each pass?', 'So what is left in Total after the last pass?'], note: exam(q) });
}

// ===== Where the IF Goes (cat if)
{
  const q = Q('y9p-own-if-after'), L = codeOf(q), ins = [60, 20, 75, 40, 55];
  assert(one(L, ins) === '1', 'if after');
  const fixed = L.slice(0, 6).concat(['    IF Number >= 50 THEN', '        Big ← Big + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Big']);
  assert(one(fixed, ins) === '3', 'if after fixed');
  add({ id: 'q-if-after', category: 'if', prompt: qText(q), answers: ['1'], keywords: [numRe(1)], distractors: ['3', '5', '0'],
    working: ['After the loop, Number holds only the last value input.', 'The IF is after NEXT Count, so how many times does it run?'], note: exam(q) });
}
{
  const q = Q('y9p-own-if-where'), items = q.blocks.find((b) => b.type === 'options').items;
  add({ id: 'q-if-where', category: 'if', prompt: qText(q, { noOptions: true }), answers: [items[1]],
    keywords: [/^(?=.*(\b(inside|in|within)\b[^.]*\bloop\b|\bbefore\s+next\b))(?=.*\bafter\b[^.]*\b(input|line\s*0?6)\b)/i],
    distractors: [items[0], items[2], items[3]],
    working: ['The IF must check every number. Which lines run on every pass?', 'The IF needs the number before it can check it.'], note: exam(q) });
}

// ===== The Value on the Line (cat bd)
{
  const q = Q('y9p-own-boundary-out'), L = codeOf(q), ins = [40, 52, 39, 40, 70];
  assert(one(L, ins) === '2', 'boundary out');
  const fixedL = L.map((l) => l.replace('Mark > 40', 'Mark >= 40'));
  assert(one(fixedL, ins) === '4', 'boundary fixed');
  for (const v of ['IF Mark > 39 THEN', 'IF 40 <= Mark THEN', 'IF 39 < Mark THEN']) assert(one(L.map((l, i) => i === 6 ? '    ' + v : l), ins) === '4', 'variant ' + v);
  add({ id: 'q-bd-out', category: 'bd', prompt: qText(q), answers: ['2'], keywords: [numRe(2)], distractors: ['4', '3', '1'],
    working: ['Check each input against Mark > 40, one at a time.', 'Look hard at 40: is 40 more than 40?'], note: exam(q) });
  const q2 = Q('y9p-own-boundary-fix');
  const vars = ['IF Mark >= 40 THEN', 'IF Mark > 39 THEN', 'IF 40 <= Mark THEN', 'IF 39 < Mark THEN'];
  add({ id: 'q-bd-fix', category: 'bd', prompt: qText(q2), answers: ['IF Mark >= 40 THEN'], keywords: [lineRe(vars)],
    distractors: ['IF Mark > 40 THEN', 'IF Mark <= 40 THEN', 'IF Mark >= 41 THEN'],
    working: ['Does "40 or more" include 40 itself?', 'Choose the operator that is TRUE when Mark is exactly 40.'], note: exam(q2) });
}
{
  const q = Q('y9p-own-less-tick'), items = q.blocks.find((b) => b.type === 'options').items;
  add({ id: 'q-bd-tick', category: 'bd', prompt: qText(q, { noOptions: true }), answers: [items[2]],
    keywords: [lineRe(['IF Temp <= 15 THEN', 'IF Temp < 16 THEN', 'IF 15 >= Temp THEN'])],
    distractors: [items[0], items[1], items[3]],
    working: ['Does "15 or less" include 15 itself?', 'Choose the operator that is TRUE when Temp is exactly 15.'], note: exam(q) });
}
{
  const q = Q('y9p-own-boundary-why');
  add({ id: 'q-bd-why', category: 'bd', prompt: qText(q), answers: ['40 is exactly on the line, where > and >= give different results'],
    keywords: [/^(?=.*\b(equal|equals|exactly|boundary|edge|same|on\s+the\s+line)\b)(?=.*(\boperators?\b|\bdiffer|\bcount|\binclud|>=|>))/i],
    distractors: ['40 is a normal score, so it shows the program works for most marks', '40 is the highest score, so it tests the biggest value allowed', 'Testing 40 makes the program faster than testing every score'],
    working: ['Is Score > 40 TRUE or FALSE when Score is 40? And Score >= 40?', 'Why would a score of 50 not show that difference?'], note: exam(q) });
}

// ===== Find and Correct the Error (cat fx)
function fixCard(id, qid, n, correct, variants, wrongs, working, check) {
  const q = Q(qid);
  check(codeOf(q));
  return add({ id, category: 'fx', prompt: qText(q, { skip: /^\((a|b)\)/ }) + '\n(a) Identify the line number that contains the error.\n(b) Write the correct line.',
    format: FIX_FMT, answers: [n + ', ' + correct], keywords: [fixRe(n, variants)], distractors: wrongs, working, note: exam(q) });
}
fixCard('q-fx-input', 'y9p-own-error-input', 6, 'INPUT Score', ['INPUT Score'], ['7, INPUT Score', '6, INPUT Total', '9, OUTPUT Score'],
  ['The purpose says the scores are input. Which line takes in a value from the user?', 'Compare line 6 with the purpose: does it take a value in, or show one?'],
  (L) => { const f = L.map((l, i) => i === 5 ? '    INPUT Score' : l); assert(one(f, [3, 4, 5, 6, 7]) === '25', 'fx input'); });
fixCard('q-fx-output', 'y9p-own-error-output', 11, 'OUTPUT Pass', ['OUTPUT Pass'], ['11, OUTPUT Count', '8, Pass ← Pass + Mark', '7, IF Mark > 50 THEN'],
  ['Which variable keeps the count of marks that are 50 or more?', 'Which line outputs the result? Does it output the count?'],
  (L) => { const ins = [50, 20, 70, 49, 51, 10]; assert(one(L, ins) === '10' && one(L.map((l, i) => i === 10 ? 'OUTPUT Pass' : l), ins) === '3', 'fx output'); });
fixCard('q-fx-array', 'y9p-own-error-array', 5, 'FOR Index ← 1 TO 5', ['FOR Index ← 1 TO 5'], ['5, FOR Index ← 0 TO 4', '6, Total ← Total + Scores[5]', '8, OUTPUT Total + Scores[5]'],
  ['Which index values does the loop give? Write them all.', 'Is every score from index 1 to 5 added? Which line decides that?'],
  (L) => {
    const set = ['Scores[1] ← 4', 'Scores[2] ← 7', 'Scores[3] ← 1', 'Scores[4] ← 9', 'Scores[5] ← 6'];
    const w = L.slice(0, 3).concat(set, L.slice(3)), f = w.map((l) => l === 'FOR Index ← 1 TO 4' ? 'FOR Index ← 1 TO 5' : l);
    assert(one(w) === '21' && one(f) === '27', 'fx array');
  });
fixCard('q-fx-add', 'y9p-own-error-add', 7, 'Total ← Total + Mark', ['Total ← Total + Mark', 'Total ← Mark + Total'], ['7, Total ← Mark', '4, Total ← 1', '6, INPUT Total'],
  ['Trace it with any four marks. What does Total become?', 'Which line should add each mark typed to Total?'],
  (L) => { const ins = [3, 8, 5, 2]; assert(one(L, ins) === '4' && one(L.map((l, i) => i === 6 ? '    Total ← Total + Mark' : l), ins) === '18', 'fx add'); });

// ===== Three errors and four errors (cat er): first the line numbers, then each correction
{
  const q = Q('y9p-own-three'), L = codeOf(q);
  const ins = [20, 35, 12, 20, 8];
  const f = L.map((l) => l.replace('1 TO 4', '1 TO 5').replace('Price > 20', 'Price >= 20').replace('OUTPUT Price', 'OUTPUT Dear'));
  assert(one(f, ins) === '3', 'three fixed');
  const base = qText(q, { skip: /^Identify the line numbers/ });
  add({ id: 'q-er3-lines', category: 'er', prompt: base + '\nIdentify the line numbers of the three errors.', format: 'Type the three line numbers',
    answers: ['05, 07, 11'], keywords: [lineSetRe([5, 7, 11])], distractors: ['05, 07, 08', '04, 07, 11', '05, 06, 11'],
    working: ['Read the purpose: how many prices, which values are counted, and what is output?', 'Check the FOR line, the IF line and the last OUTPUT line against it.'], note: exam(q) });
  const parts = [
    ['q-er3-for', 5, 'FOR Count ← 1 TO 5', ['FOR Count ← 1 TO 5'], ['FOR Count ← 0 TO 5', 'FOR Count ← 1 TO 4', 'FOR Count ← 5 TO 5'], ['How many prices must be input?', 'The loop runs once for each value from the first to the last.']],
    ['q-er3-if', 7, 'IF Price >= 20 THEN', ['IF Price >= 20 THEN', 'IF Price > 19 THEN', 'IF 20 <= Price THEN'], ['IF Price > 20 THEN', 'IF Price <= 20 THEN', 'IF Price >= 21 THEN'], ['Does "20 or more" include 20 itself?', 'Choose the operator that is TRUE when Price is exactly 20.']],
    ['q-er3-out', 11, 'OUTPUT Dear', ['OUTPUT Dear'], ['OUTPUT Price', 'OUTPUT Count', 'OUTPUT Dear + 1'], ['Which variable keeps the count?', 'What should the program output at the end?']]
  ];
  for (const [id, n, ans, vars, wrong, work] of parts) {
    add({ id, category: 'er', prompt: base + '\nLine ' + String(n).padStart(2, '0') + ' has one of the errors. Write the correct line.', answers: [ans], keywords: [lineRe(vars)], distractors: wrong, working: work, note: exam(q) });
  }
}
{
  const q = Q('y9p-24j21-4a'), L = codeOf(q);
  const f = ['DECLARE Loop : INTEGER', L[1], L[2], L[3], 'FOR Loop ← 1 TO 10', L[5], '    INPUT Value', '    Total ← Total + Value', L[8], L[9]];
  // The engine has no comma OUTPUT list, so the last line outputs Total alone here.
  assert(run(f.slice(0, 9).concat(['OUTPUT Total']), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).filter((x) => x !== 'Enter a number').join('') === '55', 'four fixed');
  const base = qText(q, { skip: /^\(a\)/ });
  add({ id: 'q-er4-lines', category: 'er', prompt: base + '\n(a) Identify the line numbers of four errors in the pseudocode.', format: 'Type the four line numbers',
    answers: ['01, 05, 07, 08'], keywords: [lineSetRe([1, 5, 7, 8])], distractors: ['01, 05, 06, 08', '05, 07, 08, 10', '01, 04, 05, 07'],
    working: ['Read the purpose: 10 values entered and totalled. Check the type, the loop, the input and the adding.', 'Is Loop a whole number? Does IF repeat? Which variable gets the input? Does totalling multiply?'], note: exam(q) });
  const parts = [
    ['q-er4-declare', 1, 'DECLARE Loop : INTEGER', ['DECLARE Loop : INTEGER'], ['DECLARE Loop : REAL', 'DECLARE Value : INTEGER', 'DECLARE Loop : STRING'], ['Loop counts from 1 to 10. What kind of value is that?', 'Which data type holds whole numbers?']],
    ['q-er4-for', 5, 'FOR Loop ← 1 TO 10', ['FOR Loop ← 1 TO 10'], ['IF Loop ← 1 TO 10 THEN', 'FOR Loop ← 1 TO 9', 'FOR Value ← 1 TO 10'], ['The lines must repeat 10 times. Which keyword repeats lines?', 'Keep the variable and the values the same.']],
    ['q-er4-input', 7, 'INPUT Value', ['INPUT Value'], ['INPUT Total', 'OUTPUT Value', 'INPUT Loop'], ['Which variable is added to Total on the next line?', 'So which variable must get the number the user types?']],
    ['q-er4-add', 8, 'Total ← Total + Value', ['Total ← Total + Value', 'Total ← Value + Total'], ['Total ← Total * Value', 'Total ← Value', 'Total ← Total + Loop'], ['Total starts at 0. What happens to 0 when you multiply it?', 'A total adds each new value to the old total.']]
  ];
  for (const [id, n, ans, vars, wrong, work] of parts) {
    add({ id, category: 'er', prompt: base + '\nLine ' + String(n).padStart(2, '0') + ' has one of the errors. Suggest a correction: write the correct line.', answers: [ans], keywords: [lineRe(vars)], distractors: wrong, working: work, note: exam(q) });
  }
}

// ===== Explain the Method (cat ex)
{
  const q = Q('y9p-own-purpose-why');
  add({ id: 'q-ex-purpose', category: 'ex', prompt: qText(q), answers: ['The purpose says what it should output, so you can compare it with what a trace shows it really does'],
    keywords: [/^(?=.*\b(output|outputs|do|does|job|result|results)\b)(?=.*\b(should|supposed|meant|intended|expected)\b)(?=.*\b(compare|compared|comparing|different|difference|match|matches|trace|traced|tracing|actually|really)\b)/i],
    distractors: ['The purpose shows which line number has the error in the program', 'Knowing the purpose makes the program run faster when it is traced', 'The purpose lists every variable, so you can check each DECLARE line'],
    working: ['A program can run with no error message and still do the wrong job. How would you notice?', 'You need two things to compare: what it should do, and what it really does.'], note: exam(q) });
}

// ---------------------------------------------------------------- walks: a similar program, traced one step at a time
// A small tracer for the Year 9 subset (DECLARE, ←, INPUT, OUTPUT, FOR ... NEXT, IF ... THEN ... ENDIF, arrays from 1).
// Its outputs are checked against the pseudocode engine, so every value in a walk is the engine's value.
function trace(lines, inputs = []) {
  const T = lines.map((l) => l.trim()), v = {}, outs = [], ins = inputs.slice(), declared = [];
  const nn = (i) => 'Line ' + num2(i);
  const fmt = (x) => Array.isArray(x) ? '[' + x.slice(1).map((e) => e === undefined ? '?' : e).join(', ') + ']' : String(x);
  const state = () => {
    const s = declared.filter((k) => v[k] !== undefined).map((k) => k + ' = ' + fmt(v[k])).join(', ');
    return (s || 'No values yet') + (outs.length ? '. Output so far: ' + outs.join(', ') : '');
  };
  const toJs = (e) => e.replace(/"[^"]*"|[A-Za-z_]\w*|<>|<=|>=|=/g, (t) => t[0] === '"' ? t : t === '<>' ? '!=' : (t === '<=' || t === '>=') ? t : t === '=' ? '==' : /^(TRUE|FALSE)$/.test(t) ? t.toLowerCase() : 'v.' + t);
  const ev = (e) => Function('v', 'return (' + toJs(e) + ');')(v);
  const sub = (e) => e.replace(/"[^"]*"|([A-Za-z_]\w*)\s*\[([^\]]+)\]|[A-Za-z_]\w*/g, (t, an, ai) => t[0] === '"' ? t : an ? String(v[an][ev(ai)]) : (t in v ? String(v[t]) : t));
  const match = (i, open, close) => { let d = 0; for (let j = i; j < T.length; j++) { if (open.test(T[j])) d++; if (close.test(T[j])) { d--; if (!d) return j; } } throw new Error('no match for ' + T[i]); };
  function exec(a, b) {
    const ev2 = [];
    for (let i = a; i < b; i++) {
      const t = T[i]; let m;
      if ((m = /^DECLARE (\w+) : (ARRAY\[1:(\d+)\] OF )?\w+$/.exec(t))) { declared.push(m[1]); if (m[2]) v[m[1]] = new Array(Number(m[3]) + 1).fill(undefined); ev2.push({ decl: true, i }); }
      else if ((m = /^FOR (\w+) ← (.+) TO (.+)$/.exec(t))) {
        const end = match(i, /^FOR\b/, /^NEXT\b/), from = ev(m[2]), to = ev(m[3]); let k = 0;
        for (let c = from; c <= to; c++) { v[m[1]] = c; k++; const inner = exec(i + 1, end); ev2.push({ pass: k, i, name: m[1], val: c, inner, state: state() }); }
        v[m[1]] = undefined; // the loop variable is not shown after the loop
        ev2.push({ loopEnd: true, i: end, name: m[1] });
        i = end;
      } else if ((m = /^IF (.+) THEN$/.exec(t))) {
        const end = match(i, /^IF\b/, /^ENDIF$/), ok = !!ev(m[1]);
        const inner = ok ? exec(i + 1, end) : [];
        ev2.push({ i, text: nn(i) + ': ' + sub(m[1]) + ' is ' + (ok ? 'TRUE, so the line inside the IF runs.' : 'FALSE, so the line inside the IF is skipped.'), inner, st: state() });
        i = end;
      } else if ((m = /^INPUT (\w+)$/.exec(t))) { const x = Number(ins.shift()); v[m[1]] = x; ev2.push({ i, text: nn(i) + ': INPUT ' + m[1] + ' takes the next value typed, ' + x + '. ' + m[1] + ' is now ' + x + '.', st: state() }); }
      else if ((m = /^OUTPUT (.+)$/.exec(t))) { const x = ev(m[1]); outs.push(String(x)); ev2.push({ i, text: nn(i) + ': OUTPUT shows ' + (typeof x === 'string' ? '"' + x + '"' : x) + '.', st: state() }); }
      else if ((m = /^(\w+)(\[(.+)\])? ← (.+)$/.exec(t))) {
        const x = ev(m[4]), s = sub(m[4]), name = m[1] + (m[2] ? '[' + ev(m[3]) + ']' : '');
        if (m[2]) v[m[1]][ev(m[3])] = x; else v[m[1]] = x;
        ev2.push({ i, text: nn(i) + ': ' + (s === String(x) ? name + ' ← ' + m[4] + ', so ' + name + ' is now ' + x + '.' : name + ' ← ' + s + ' = ' + x + '. ' + name + ' is now ' + x + '.'), st: state() });
      } else throw new Error('trace cannot run: ' + t);
    }
    return ev2;
  }
  const flat = (evs) => evs.flatMap((e) => e.text ? [e.text].concat(flat(e.inner || [])) : []);
  const idxs = (evs) => evs.flatMap((e) => [e.i].concat(idxs(e.inner || [])));
  const events = exec(0, T.length), steps = [];
  let carry = '';
  const code = lines.map((l, i) => num2(i) + ' ' + l);
  for (let k = 0; k < events.length; k++) {
    const e = events[k];
    if (e.decl) {
      const run0 = [e.i]; while (events[k + 1] && events[k + 1].decl) run0.push(events[++k].i);
      steps.push({ text: (run0.length > 1 ? 'Lines ' + num2(run0[0]) + ' to ' + num2(run0[run0.length - 1]) : nn(run0[0])) + ': DECLARE makes the variables. They have no values yet.', code, hl: run0, state: 'No values yet' });
    } else if (e.pass) steps.push({ text: carry + 'Pass ' + e.pass + ': ' + e.name + ' = ' + e.val + '. ' + flat(e.inner).join(' '), code, hl: [e.i].concat(idxs(e.inner)), state: e.state }), carry = '';
    else if (e.loopEnd) carry = 'The loop has finished, so the program goes on after NEXT ' + e.name + '. ';
    else { steps.push({ text: carry + [e.text].concat(flat(e.inner || [])).join(' '), code, hl: idxs([e]), state: e.st }); carry = ''; }
  }
  return { steps, outs, code };
}
function walkOf(lines, inputs, intro, outro) {
  const t = trace(lines, inputs);
  const eng = run(lines, inputs);
  assert(JSON.stringify(eng) === JSON.stringify(t.outs), 'tracer matches the engine: ' + eng.join('|') + ' / ' + t.outs.join('|') + '\n' + lines.join('\n'));
  const code = t.code;
  return { outs: t.outs, walk: [{ text: intro, code, hl: [], state: '' }].concat(t.steps, (outro || []).map((o) => ({ text: o[0], code, hl: o[1] || [], state: '' }))) };
}
function customWalk(lines, intro, steps) {
  const code = lines.map((l, i) => num2(i) + ' ' + l);
  return { outs: [], walk: [{ text: intro, code, hl: [], state: '' }].concat(steps.map((s) => ({ text: s[0], code, hl: s[1] || [], state: s[2] || '' }))) };
}

// ---------------------------------------------------------------- build-up cards for every set question
const BUILD = {};
function similar(lines, inputs, expect, label) { const o = run(lines, inputs).filter((x) => !/^[A-Za-z][A-Za-z ]+:?$/.test(x)); assert(o.join(', ') === expect, label + ': ' + o.join(', ')); return o; }
const D = (n, t = 'INTEGER') => 'DECLARE ' + n + ' : ' + t;
const fixAsk = '\n(a) Identify the line number that contains the error.\n(b) Write the correct line.';
const MC = (keyIdea) => keyIdea;

// Line by Line
{
  const W = walkOf([D('A'), D('B'), 'A ← 4', 'B ← A + 1', 'A ← B * 2', 'OUTPUT A'], [], 'A similar program. Run it one line at a time, from the top.',
    [['Line 05 used the new value of B. The new value of A replaced the old one.', [4]]]);
  const S = [D('X'), D('Y'), 'X ← 5', 'Y ← X + 3', 'X ← Y * 2', 'OUTPUT X']; similar(S, [], '16', 'lines sim');
  BUILD['y9p-own-lines'] = { walk: W, key: { prompt: 'A line uses the value a variable holds now.\n' + showCode([D('A'), 'A ← 2', 'A ← A + 9', 'OUTPUT A']) + '\nState the output.', answers: ['11'], keywords: [numRe(11)], distractors: ['2', '9', '20'],
      working: ['Line 2 gives A its first value.', 'Line 3 uses that value of A, then the result replaces it.'], note: 'A is 2. Then A ← 2 + 9 = 11. The new value replaces the old one.' },
    sim: { prompt: showCode(S) + '\nState the output.', answers: ['16'], keywords: [numRe(16)], distractors: ['10', '8', '13'],
      working: ['Work out Y on line 4 with the value X holds now.', 'Line 5 uses the new Y. Its result replaces the old X.'], note: 'X is 5. Y = 5 + 3 = 8. X = 8 * 2 = 16.' } };
}
{
  const W = walkOf([D('A'), D('B'), 'A ← 4', 'B ← A', 'A ← A + 2', 'OUTPUT B'], [], 'A similar program. Watch which variable each line changes.',
    [['Line 05 changed only A. B kept the copy it got on line 04.', [3, 4]]]);
  const S = [D('M'), D('N'), 'M ← 9', 'N ← M', 'M ← M + 2', 'OUTPUT N']; similar(S, [], '9', 'copy sim');
  BUILD['y9p-own-copy'] = { walk: W, key: { prompt: 'Q ← P copies the value of P into Q. Later, P ← P + 1 runs.\nDoes the value of Q change?', answers: ['No'], keywords: [/^\s*no\b/i],
      distractors: ['Yes, Q goes up by 1', 'Yes, Q becomes 0', 'Only when Q is output'], working: ['A line changes only the variable on the left of the arrow.', 'Which variable is on the left of P ← P + 1?'], note: 'No. Q got a copy of the value once. P ← P + 1 changes only P.' },
    sim: { prompt: showCode(S) + '\nState the output.', answers: ['9'], keywords: [numRe(9)], distractors: ['11', '2', '0'],
      working: ['Line 4 copies the value of M into N, once.', 'Does line 5 change N, or only M?'], note: 'N got a copy of 9 on line 4. Line 5 changes only M, to 11.' } };
}
{
  const WL = [D('Total'), D('Count'), 'Total ← 0', 'FOR Count ← 3 TO 5', '    Total ← Count + 10', 'NEXT Count', 'OUTPUT Total'];
  const W = walkOf(WL, [], 'A similar program. Follow each line exactly as it is written.', [['Line 05 never used the old Total. Each pass gave Total a new value from Count.', [4]]]);
  const S = [D('Total'), D('Count'), 'Total ← 0', 'FOR Count ← 1 TO 3', '    Total ← Count * 2', 'NEXT Count', 'OUTPUT Total'];
  const sw = run([D('Total'), D('Count'), 'Total ← 0', 'FOR Count ← 1 TO 3', '    Total ← Count * 2', '    OUTPUT Total', 'NEXT Count']);
  const sAns = sw.concat(run(S)).join(', '); assert(sAns === '2, 4, 6, 6', 'trace sim');
  BUILD['y9p-own-trace'] = { walk: W, key: { prompt: 'A program has the line Total ← Count + 1. On one pass, Count is 6 and Total is 20.\nState the value of Total after this line.', answers: ['7'], keywords: [numRe(7)], distractors: ['21', '27', '26'],
      working: ['Read the right of the arrow. Which variables does it use?', 'Does it use the old value of Total at all?'], note: 'Total ← 6 + 1 = 7. The line does not use the old Total, so 20 is replaced.' },
    sim: { prompt: showCode(S) + '\nComplete the trace table with the value of Total after each pass, exactly as the program is written, and state the output.\nCount | Total\n1 | ?\n2 | ?\n3 | ?', format: 'Type Total after each pass, then the output, with commas',
      answers: [sAns], keywords: [/^\D*2\D+4\D+6\D+6\D*$/], distractors: ['2, 6, 12, 12', '0, 2, 4, 4', '2, 4, 6, 12'],
      working: ['Line 5 says Total ← Count * 2. Does it use the old Total?', 'Work out line 5 with Count = 1, then 2, then 3.'], note: 'Pass 1: 1 * 2 = 2. Pass 2: 2 * 2 = 4. Pass 3: 3 * 2 = 6. OUTPUT runs once after the loop: 6.' } };
}
// Types of statement
{
  const WL = [D('Name', 'STRING'), D('Count'), 'Name ← "Ann"', 'OUTPUT "Start"', 'FOR Count ← 1 TO 2', '    IF Count = 2 THEN', '        OUTPUT Name', '    ENDIF', 'NEXT Count'];
  run(WL);
  const W = customWalk(WL, 'A similar program. Name the type of each statement.', [
    ['Line 03 uses ← to give Name a value. That is an assignment statement.', [2]],
    ['Line 05 is a FOR line. It repeats the lines down to NEXT Count. That is an iteration statement.', [4, 8]],
    ['Line 06 is an IF. It checks a condition and chooses whether line 07 runs. That is a selection statement.', [5, 7]],
    ['Line 04 and line 07 show values: they are OUTPUT statements.', [3, 6]]]);
  const S = [D('Big'), D('Count'), 'Big ← 0', 'FOR Count ← 1 TO 5', '    IF Count > 2 THEN', '        Big ← Big + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Big']; similar(S, [], '3', 'statement sim');
  BUILD['y9p-24j22-7a'] = { walk: W, key: { prompt: 'Which type of statement gives a variable a value with ←?', answers: ['Assignment'], keywords: [/^\s*(an?\s+)?assign(ment)?(\s+statement)?\s*\.?\s*$/i],
      distractors: ['Selection', 'Iteration', 'Output'], working: ['The arrow puts a value into a variable.', 'Selection uses IF. Iteration uses FOR.'], note: 'Assignment: the arrow gives a variable a value, as in Total ← 0.' },
    sim: { prompt: showCode(S) + '\nGive a line number for this type of statement:\nSelection statement', answers: ['05'], keywords: [lineNumRe([5])], distractors: ['03', '04', '09'],
      working: ['Selection chooses which lines run, by checking a condition.', 'Which keyword checks a condition?'], note: 'Selection is the IF on line 05. Line 03 is assignment and line 04 is iteration.' } };
  BUILD['y9p-24j22-7a'].keyWalk = customWalk(['FOR Count ← 1 TO 3', '    OUTPUT Count', 'NEXT Count'], 'A similar question: which type of statement runs the same lines again and again?', [
    ['Line 01 is a FOR line. It runs line 02 again for each value of Count.', [0, 2]],
    ['Running lines again and again is iteration. So a FOR line is an iteration statement.', [0]]]);
}
// Four errors
{
  const WL = [D('Count'), D('Price'), D('Total'), 'Total ← 0', 'FOR Count ← 1 TO 3', '    INPUT Price', '    Total ← Total * Price', 'NEXT Count', 'OUTPUT Total'];
  const W = walkOf(WL, [4, 2, 5], 'A similar program. It should total three prices, but it has an error. Trace it with 4, 2 and 5.',
    [['The purpose says total, so it should output 4 + 2 + 5 = 11. The trace gives 0: Total starts at 0, and 0 times any number is 0.', [6]],
      ['So line 07 is an error. A total must add: Total ← Total + Price.', [6]]]);
  const S = [D('Count'), D('Num'), D('Sum'), 'Sum ← 0', 'FOR Count ← 1 TO 5', '    INPUT Num', '    Sum ← Sum * Num', 'NEXT Count', 'OUTPUT Sum'];
  similar(S.map((l) => l.replace('Sum * Num', 'Sum + Num')), [1, 2, 3, 4, 5], '15', 'four sim');
  BUILD['y9p-24j21-4a'] = { walk: W, key: { prompt: 'Sum starts at 0. Each pass inputs a number into Num.\nWhich line adds Num to Sum?', answers: ['Sum ← Sum + Num'], keywords: [lineRe(['Sum ← Sum + Num', 'Sum ← Num + Sum'])],
      distractors: ['Sum ← Sum * Num', 'Sum ← Num', 'Num ← Sum + Num'], working: ['A total keeps the old total and adds the new value.', 'Which variable must be on the left of the arrow?'], note: 'Sum ← Sum + Num keeps the old Sum and adds the new number.' },
    sim: { prompt: 'This algorithm should allow 5 values to be entered and totalled. The total is output at the end. It has one error.\n' + showCode(S) + fixAsk, format: FIX_FMT,
      answers: ['7, Sum ← Sum + Num'], keywords: [fixRe(7, ['Sum ← Sum + Num', 'Sum ← Num + Sum'])], distractors: ['7, Sum ← Num', '4, Sum ← 1', '6, INPUT Sum'],
      working: ['Sum starts at 0. What is 0 times any number?', 'Which line should add each value to Sum?'], note: 'Line 7 multiplies, so Sum stays 0. A total adds: Sum ← Sum + Num.' } };
}
// Inside or after the loop
{
  const W = walkOf([D('Number'), D('Count'), 'Number ← 10', 'FOR Count ← 1 TO 2', '    Number ← Number - 1', '    OUTPUT Number', 'NEXT Count'], [], 'A similar program. Is OUTPUT before NEXT or after it?',
    [['OUTPUT Number is inside the loop, before NEXT Count. Count the values in the output.', [5]]]);
  const S = [D('Number'), D('Count'), 'Number ← 1', 'FOR Count ← 1 TO 4', '    Number ← Number + 2', '    OUTPUT Number', 'NEXT Count']; similar(S, [], '3, 5, 7, 9', 'inside sim');
  BUILD['y9p-own-out-inside'] = { walk: W, key: { prompt: 'An OUTPUT line is between the FOR line and the NEXT line.\nWhen does it run?', answers: ['On every pass'], keywords: [/^(?=.*\b(every|each|all)\b)(?=.*\b(pass|passes|time|times|loop|repeat)\b)/i],
      distractors: ['Once, after the loop', 'Once, before the loop', 'Only on the last pass'], working: ['Which lines does the loop repeat?', 'The lines between FOR and NEXT run again and again.'], note: 'Every line between FOR and NEXT runs on every pass, the OUTPUT too.' },
    sim: { prompt: showCode(S) + '\nState how many values are output.', answers: ['4'], keywords: [numRe(4)], distractors: ['1', '3', '9'],
      working: ['Is OUTPUT Number before NEXT Count or after it?', 'How many passes does the loop make?'], note: 'OUTPUT is inside the loop, so it runs on each of the 4 passes.' } };
}
{
  const W = walkOf([D('Number'), D('Count'), 'Number ← 3', 'FOR Count ← 1 TO 2', '    Number ← Number * 4', 'NEXT Count', 'OUTPUT Number'], [], 'A similar program. Is OUTPUT before NEXT or after it?',
    [['OUTPUT was after NEXT Count. Look at the output: how many values are there?', [6]]]);
  const S = [D('Number'), D('Count'), 'Number ← 1', 'FOR Count ← 1 TO 3', '    Number ← Number * 2', 'NEXT Count', 'OUTPUT Number']; similar(S, [], '8', 'after sim');
  BUILD['y9p-own-out-after'] = { walk: W, key: { prompt: 'An OUTPUT line comes after the NEXT line.\nHow many times does it run?', answers: ['Once'], keywords: [/^\s*(once|one|1)(\s+times?)?\b/i],
      distractors: ['On every pass', 'Never', 'Twice'], working: ['NEXT ends the lines that repeat.', 'After NEXT, the loop has finished.'], note: 'Once. A line after NEXT runs when the loop has finished.' },
    sim: { prompt: showCode(S) + '\nState the output.', answers: ['8'], keywords: [numRe(8)], distractors: ['2', '4', '6'],
      working: ['Number is multiplied by 2 on every pass. Write its value after each pass.', 'OUTPUT is after NEXT, so it shows only the last value.'], note: '1 * 2 = 2, 2 * 2 = 4, 4 * 2 = 8. OUTPUT runs once: 8.' } };
}
{
  const W = walkOf([D('Total'), D('Count'), 'FOR Count ← 1 TO 2', '    Total ← 0', '    Total ← Total + 7', 'NEXT Count', 'OUTPUT Total'], [], 'A similar program. Watch line 04 on every pass.',
    [['Line 04 is inside the loop, so Total went back to 0 at the start of every pass.', [3]]]);
  const S = [D('Total'), D('Count'), 'FOR Count ← 1 TO 3', '    Total ← 0', '    Total ← Total + 4', 'NEXT Count', 'OUTPUT Total']; similar(S, [], '4', 'reset sim');
  BUILD['y9p-own-reset'] = { walk: W, key: { prompt: 'Total ← 0 is inside the loop.\nWhat happens to Total at the start of every pass?', answers: ['It goes back to 0'], keywords: [/(\b0\b|\bzero\b|\breset|\bagain\b|\bback\b)/i],
      distractors: ['It keeps its value', 'It goes up by 1', 'It is output'], working: ['A line inside the loop runs on every pass.', 'What does Total ← 0 do each time it runs?'], note: 'It goes back to 0 on every pass, so the total from the pass before is lost.' },
    sim: { prompt: 'This program should output 4 + 4 + 4.\n' + showCode(S) + '\nState the output of the program exactly as it is written.', answers: ['4'], keywords: [numRe(4)], distractors: ['12', '0', '16'],
      working: ['Line 4 is inside the loop. When does it run?', 'Work out Total at the end of the last pass only.'], note: 'Every pass sets Total to 0, then adds 4. After the last pass Total is 4.' } };
}
{
  const WL = [D('Total'), D('Count'), 'OUTPUT "Adding"', 'FOR Count ← 1 TO 2', '    Total ← 0', '    Total ← Total + Count * 10', 'NEXT Count', 'OUTPUT Total'];
  const W = walkOf(WL, [], 'A similar program. It should output 10 + 20 = 30. One line is in the wrong place.',
    [['The trace gives 20, not 30. Line 05 set Total back to 0 on every pass, so the 10 from pass 1 was lost.', [4]], ['Line 05 must run once, so it must move to before the FOR line.', [3, 4]]]);
  const S = [D('Sum'), D('Count'), D('Number'), 'FOR Count ← 1 TO 3', '    INPUT Number', '    Sum ← 0', '    Sum ← Sum + Number', 'NEXT Count', 'OUTPUT Sum'];
  similar(S, [4, 9, 2], '2', 'reset line sim');
  similar([S[0], S[1], S[2], 'Sum ← 0', S[3], S[4], S[6], S[7], S[8]], [4, 9, 2], '15', 'reset line sim fixed');
  BUILD['y9p-own-reset-line'] = { walk: W, key: { prompt: 'A program totals with Total ← 0 and Total ← Total + Count.\nWhich of the two lines should run only once, before the loop?', answers: ['Total ← 0'], keywords: [lineRe(['Total ← 0'])],
      distractors: ['Total ← Total + Count', 'OUTPUT Total', 'NEXT Count'], working: ['One line starts the total. The other adds to it on every pass.', 'Which one must not run again on every pass?'], note: 'Total ← 0 starts the total, so it runs once, before the loop.' },
    sim: { prompt: 'This program should output the total of the three numbers typed. One line is in the wrong place.\n' + showCode(S) + '\nIdentify the line number of the line that must be moved to before the loop.',
      answers: ['Line 6'], keywords: [lineNumRe([6])], distractors: ['Line 4', 'Line 5', 'Line 7'],
      working: ['Which line should start the total, once?', 'A line inside the loop runs on every pass.'], note: 'Line 6, Sum ← 0, sets Sum back to 0 on every pass. It must run once, before the FOR line.' } };
  BUILD['y9p-own-reset-line'].keyWalk = customWalk([D('Big'), D('Count'), 'Big ← 0', 'FOR Count ← 1 TO 4', '    Big ← Big + 1', 'NEXT Count'], 'A similar question. A program counts with Big ← 0 and Big ← Big + 1. Which line starts the count, and which line adds to it?', [
    ['Line 03 starts the count at 0. It is before the FOR line, so it runs once.', [2]],
    ['Line 05 adds 1 to the count. It is inside the loop, so it runs on every pass and the count goes 1, 2, 3, 4.', [4]],
    ['If line 03 were inside the loop, the count would start again at 0 on every pass.', [2, 3]]]);
  BUILD['y9p-own-reset-explain'] = { walk: W, key: { prompt: 'Total ← 0 runs on every pass.\nWhat happens to the total from the pass before?', answers: ['It is lost'], keywords: [/\b(lost|gone|deleted|replaced|reset|wiped|cleared|0|zero|forgotten|removed)\b/i],
      distractors: ['It is kept', 'It is doubled', 'It is output'], working: ['What value does Total get on that line?', 'Is anything kept from before?'], note: 'It is lost: Total is set back to 0, so the old total is replaced.' },
    sim: { prompt: 'This program should output the total of the three numbers typed. The user types 4, 9 and 2.\n' + showCode(S) + '\nExplain why the program outputs 2 and not 15.',
      answers: ['Sum is set back to 0 on every pass, so only the last number, 2, is kept'], keywords: [/^(?=.*(\b0\b|\bzero\b|\breset))(?=.*\b(pass|passes|loop|time|times|every|each)\b)(?=.*(\b2\b|\blast\b|\bonly\b|\blost\b))/i],
      distractors: ['Sum is set to 0 once before the loop, so it never adds Number', 'Count goes up to 3 on the last pass, so Sum is added one time', 'Line 7 adds 2 to Sum on every pass, so Sum ends too small'],
      working: ['Line 6 is inside the loop. What does it do to Sum on each pass?', 'So what is left in Sum after the last pass?'], note: 'Sum ← 0 is inside the loop, so Sum goes back to 0 on every pass. Only the last number, 2, is left.' } };
}
// Where the IF goes
{
  const WL = [D('Number'), D('Count'), D('Total'), 'Total ← 0', 'FOR Count ← 1 TO 3', '    INPUT Number', 'NEXT Count', 'IF Number > 10 THEN', '    Total ← Total + Number', 'ENDIF', 'OUTPUT Total'];
  const W = walkOf(WL, [20, 4, 15], 'A similar program. It should add up the numbers more than 10. The user types 20, 4 and 15.',
    [['The IF was after NEXT, so it ran once and checked only the number in Number at the end. The 20 was never checked.', [7]]]);
  const S = [D('Number'), D('Count'), D('Big'), 'Big ← 0', 'FOR Count ← 1 TO 4', '    INPUT Number', 'NEXT Count', 'IF Number >= 10 THEN', '    Big ← Big + 1', 'ENDIF', 'OUTPUT Big'];
  similar(S, [12, 3, 15, 8], '0', 'if after sim');
  BUILD['y9p-own-if-after'] = { walk: W, key: { prompt: 'A loop inputs five numbers into Number, one on each pass.\nAfter the loop, which value does Number hold?', answers: ['Only the last one typed'], keywords: [/\blast\b/i],
      distractors: ['All five of them', 'The first one typed', 'The biggest one typed'], working: ['INPUT Number puts a new value into Number on each pass.', 'A new value replaces the old one.'], note: 'Only the last one: each INPUT replaces the value before it.' },
    sim: { prompt: 'This program should count the numbers that are 10 or more. The user inputs 12, 3, 15 and 8.\n' + showCode(S) + '\nState the output of the program exactly as it is written.', answers: ['0'], keywords: [numRe(0)], distractors: ['2', '1', '4'],
      working: ['After the loop, Number holds only the last value input.', 'The IF is after NEXT Count, so it checks one number only. Which one?'], note: 'The IF runs once, with Number = 8. 8 >= 10 is FALSE, so Big stays 0.' } };
  const WL2 = [D('Mark'), D('Count'), D('Top'), 'Top ← 0', 'FOR Count ← 1 TO 3', '    INPUT Mark', 'NEXT Count', 'IF Mark > 80 THEN', '    Top ← Top + 1', 'ENDIF', 'OUTPUT Top'];
  const W2 = walkOf(WL2, [90, 50, 85], 'A similar program. It should count the marks more than 80. The user types 90, 50 and 85.',
    [['The IF ran only once, after the loop, so only one mark was checked. 90 was never checked.', [7]], ['To check every mark, which lines run on every pass? And when is each mark ready to check?', [4, 5, 6]]]);
  BUILD['y9p-own-if-where'] = { walk: W2, key: { prompt: 'Which lines run on every pass of a FOR loop?', answers: ['The lines between FOR and NEXT'], keywords: [/\b(between|inside|within)\b/i],
      distractors: ['The lines before FOR', 'The lines after NEXT', 'Only the FOR line'], working: ['FOR starts the lines that repeat.', 'NEXT ends them.'], note: 'The lines between FOR and NEXT run on every pass.' },
    sim: { prompt: 'This program should count the hot days: Temp more than 30. The IF (lines 6 to 8) is in the wrong place.\n' +
        showCode([D('Temp'), D('Day'), D('Hot'), 'Hot ← 0', 'FOR Day ← 1 TO 7', '    INPUT Temp', 'NEXT Day', 'IF Temp > 30 THEN', '    Hot ← Hot + 1', 'ENDIF', 'OUTPUT Hot']) + '\nTick one box to show where lines 8 to 10 must go.',
      answers: ['Inside the loop, after INPUT Temp'], keywords: [/^(?=.*(\b(inside|in|within)\b[^.]*\bloop\b|\bbefore\s+next\b))(?=.*\bafter\b[^.]*\b(input|line\s*0?6)\b)/i],
      distractors: ['Before the FOR line', 'After OUTPUT Hot', 'Before Hot ← 0'], working: ['The IF must check every temperature. Which lines run on every pass?', 'The IF needs the temperature before it can check it.'],
      note: 'The IF must run on every pass, so it goes inside the loop. It needs the value first, so it goes after INPUT Temp.' } };
  BUILD['y9p-own-if-where'].sim.prompt = BUILD['y9p-own-if-where'].sim.prompt.replace('The IF (lines 6 to 8)', 'The IF (lines 8 to 10)');
}
// The value on the line
{
  const WL = [D('Score'), D('Count'), D('Win'), 'Win ← 0', 'FOR Count ← 1 TO 4', '    INPUT Score', '    IF Score > 30 THEN', '        Win ← Win + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Win'];
  const W = walkOf(WL, [30, 45, 31, 50], 'A similar program. The user types 30, 45, 31 and 50. Check each one against Score > 30.', [['Look back at the first pass: 30 > 30 is FALSE, because 30 is equal to 30, not more than it.', [6]]]);
  const W2 = walkOf(WL, [30, 45, 31, 50], 'A similar program. It should count the scores of 30 or more. The user types 30, 45, 31 and 50.',
    [['30 should be counted, but 30 > 30 is FALSE. The line misses the value exactly on the line.', [6]], ['30 >= 30 is TRUE. So the line should be IF Score >= 30 THEN.', [6]]]);
  const S = [D('Mark'), D('Count'), D('Pass'), 'Pass ← 0', 'FOR Count ← 1 TO 4', '    INPUT Mark', '    IF Mark > 50 THEN', '        Pass ← Pass + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Pass'];
  similar(S, [50, 72, 50, 49], '1', 'boundary sim');
  BUILD['y9p-own-boundary-out'] = { walk: W, key: { prompt: 'Which of these is TRUE?', answers: ['40 >= 40'], keywords: [/^\s*40\s*>=\s*40\s*$/], distractors: ['40 > 40', '40 < 40', '41 <= 40'],
      working: ['> means more than. Is 40 more than 40?', '>= means more than or equal to.'], note: '40 >= 40 is TRUE: 40 is equal to 40. 40 > 40 is FALSE.' },
    sim: { prompt: 'This program should count the marks that are 50 or more. The user inputs 50, 72, 50 and 49.\n' + showCode(S) + '\nState the output of the program exactly as it is written.', answers: ['1'], keywords: [numRe(1)], distractors: ['3', '2', '0'],
      working: ['Check each input against Mark > 50, one at a time.', 'Look hard at 50: is 50 more than 50?'], note: '50: FALSE. 72: TRUE. 50: FALSE. 49: FALSE. Only one TRUE.' } };
  const S2 = [D('Score'), D('Count'), D('Good'), 'Good ← 0', 'FOR Count ← 1 TO 5', '    INPUT Score', '    IF Score > 25 THEN', '        Good ← Good + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Good'];
  similar(S2.map((l) => l.replace('Score > 25', 'Score >= 25')), [25, 30, 24, 25, 10], '3', 'fix sim');
  BUILD['y9p-own-boundary-fix'] = { walk: W2, key: { prompt: 'A rule says "40 or more".\nWhich operator is TRUE for 40 itself and for every value above it?', answers: ['>='], keywords: [/^\s*(>=|≥|(more|greater)\s+than\s+or\s+equal(\s+to)?)\s*$/i],
      distractors: ['>', '<', '<='], working: ['"or more" includes the value itself.', 'Which operator has "or equal to" in it, and points the right way?'], note: '>= means more than or equal to, so it is TRUE for 40 and above.' },
    sim: { prompt: 'This program should count the scores that are 25 or more.\n' + showCode(S2) + '\nWrite a correct line 7 so that the program counts the scores that are 25 or more.',
      answers: ['IF Score >= 25 THEN'], keywords: [lineRe(['IF Score >= 25 THEN', 'IF Score > 24 THEN', 'IF 25 <= Score THEN', 'IF 24 < Score THEN'])], distractors: ['IF Score > 25 THEN', 'IF Score <= 25 THEN', 'IF Score >= 26 THEN'],
      working: ['Does "25 or more" include 25 itself?', 'Choose the operator that is TRUE when Score is exactly 25.'], note: '"25 or more" includes 25. Score >= 25 is TRUE for 25.' } };
  const W3 = customWalk(['IF Age ? 12 THEN'], 'A similar question. A child is 12 or less. Which IF line counts the children? Test the value exactly on the line: 12.', [
    ['Try Age < 12: 12 < 12 is FALSE. So a child aged 12 would be missed.', [0]],
    ['Try Age <= 12: 12 <= 12 is TRUE. So 12 is counted, and every age below it too.', [0]],
    ['So the line is IF Age <= 12 THEN. "or less" means less than or equal to.', [0]]]);
  BUILD['y9p-own-less-tick'] = { walk: W3, key: { prompt: 'A rule says "15 or less".\nWhich operator is TRUE for 15 itself and for every value below it?', answers: ['<='], keywords: [/^\s*(<=|≤|less\s+than\s+or\s+equal(\s+to)?)\s*$/i],
      distractors: ['<', '>=', '>'], working: ['"or less" includes the value itself.', 'Which operator has "or equal to" in it, and points the right way?'], note: '<= means less than or equal to, so it is TRUE for 15 and below.' },
    sim: { prompt: 'A program counts the small boxes. A box is small when Size is 4 or less.\nTick one box to identify the correct IF line.', answers: ['IF Size <= 4 THEN'],
      keywords: [lineRe(['IF Size <= 4 THEN', 'IF Size < 5 THEN', 'IF 4 >= Size THEN'])], distractors: ['IF Size < 4 THEN', 'IF Size >= 4 THEN', 'IF Size > 4 THEN'],
      working: ['Does "4 or less" include 4 itself?', 'Choose the operator that is TRUE when Size is exactly 4.'], note: '"4 or less" includes 4. Size <= 4 is TRUE for 4.' } };
  const W4 = customWalk(['IF Speed ? 60 THEN'], 'A similar question. Count the speeds of 60 or more. Try three test values: 50, 60 and 70.', [
    ['50: Speed > 60 is FALSE, and Speed >= 60 is FALSE. The same result.', [0]],
    ['70: Speed > 60 is TRUE, and Speed >= 60 is TRUE. The same result.', [0]],
    ['60: Speed > 60 is FALSE, but Speed >= 60 is TRUE. A different result!', [0]],
    ['So only the test with 60 shows which operator the IF uses, and whether 60 is counted.', [0]]]);
  BUILD['y9p-own-boundary-why'] = { walk: W4, key: { prompt: 'A rule says "40 or more". 40 is the value exactly on the line.\nWhat is the value exactly on the line called?', answers: ['Boundary'], keywords: [/^\s*(the\s+|a\s+)?boundary(\s+(value|data))?\s*\.?\s*$/i],
      distractors: ['The normal value', 'The average value', 'The starting value'], working: ['It is the edge between the values that are counted and the values that are not.', 'The word starts with b.'], note: 'The boundary: the value exactly on the line, where > and >= differ.' },
    sim: { prompt: 'A program should count the ages that are 18 or more.\nExplain why the program should be tested with an age of exactly 18.', answers: ['18 is exactly on the line, where > and >= give different results'],
      keywords: [/^(?=.*\b(equal|equals|exactly|boundary|edge|same|on\s+the\s+line)\b)(?=.*(\boperators?\b|\bdiffer|\bcount|\binclud|>=|>))/i],
      distractors: ['18 is a normal age, so it shows the program works for most people', '18 is the oldest age, so it tests the biggest value allowed', 'Testing 18 makes the program faster than testing every age'],
      working: ['Is Age > 18 TRUE or FALSE when Age is 18? And Age >= 18?', 'Why would an age of 30 not show that difference?'], note: '18 is the boundary. Age > 18 is FALSE for 18 but Age >= 18 is TRUE, so only 18 shows if the IF is right.' } };
}
// Find and correct the error
{
  const WL = [D('Age'), D('Count'), 'FOR Count ← 1 TO 3', '    OUTPUT Age', '    OUTPUT Age * 2', 'NEXT Count'];
  const W = customWalk(WL, 'A similar program. It should input three ages and output each one doubled. It has one error.', [
    ['The purpose says the ages are typed in by the user. Look for the line that takes them in.', [2, 5]],
    ['Line 04 is OUTPUT Age. It shows Age, it does not take a value in. So Age never gets the ages typed.', [3]],
    ['So line 04 is the error. The correct line is INPUT Age.', [3]]]);
  const S = [D('Price'), D('Total'), D('Count'), 'Total ← 0', 'OUTPUT "Type four prices"', 'FOR Count ← 1 TO 4', '    OUTPUT Price', '    Total ← Total + Price', 'NEXT Count', 'OUTPUT Total'];
  similar(S.map((l) => l === '    OUTPUT Price' ? '    INPUT Price' : l), [3, 4, 5, 6], '18', 'input sim');
  BUILD['y9p-own-error-input'] = { keyWalk: customWalk(['OUTPUT "Hello"'], 'A similar question: which keyword shows a value on the screen?', [
      ['Line 01 shows the word Hello to the user. The value goes out of the program.', [0]],
      ['So the keyword that shows a value is OUTPUT. Now think: which keyword does the opposite, and brings a value in?', [0]]]), walk: W, key: { prompt: 'Which keyword takes in a value typed by the user?', answers: ['INPUT'], keywords: [/^\s*input\s*\.?\s*$/i], distractors: ['OUTPUT', 'DECLARE', 'FOR'],
      working: ['One keyword shows a value. Another takes a value in.', 'Values come in to the program.'], note: 'INPUT takes in a value typed by the user. OUTPUT shows a value.' },
    sim: { prompt: 'This program should input four prices and output their total. It has one error.\n' + showCode(S) + fixAsk, format: FIX_FMT, answers: ['7, INPUT Price'], keywords: [fixRe(7, ['INPUT Price'])],
      distractors: ['8, INPUT Price', '7, INPUT Total', '10, OUTPUT Price'], working: ['The purpose says the prices are input. Which line takes in a value?', 'Does line 7 take a value in, or show one?'], note: 'Line 7 shows Price instead of taking it in. It must be INPUT Price.' } };
}
{
  const WL = [D('Mark'), D('Count'), D('Top'), 'OUTPUT "Type three marks"', 'Top ← 0', 'FOR Count ← 1 TO 3', '    INPUT Mark', '    IF Mark > 80 THEN', '        Top ← Top + 1', '    ENDIF', 'NEXT Count', 'OUTPUT "Top marks:"', 'OUTPUT Mark'];
  const W = walkOf(WL, [90, 50, 85], 'A similar program. It should count the marks more than 80, then output the count. The user types 90, 50 and 85.',
    [['The count is kept in Top. Line 13 outputs Mark instead, the last mark typed.', [8, 12]], ['So line 13 is the error. The correct line is OUTPUT Top.', [12]]]);
  const S = [D('Temp'), D('Day'), D('Hot'), 'Hot ← 0', 'FOR Day ← 1 TO 7', '    INPUT Temp', '    IF Temp >= 30 THEN', '        Hot ← Hot + 1', '    ENDIF', 'NEXT Day', 'OUTPUT "Hot days:"', 'OUTPUT Temp'];
  similar(S.map((l) => l === 'OUTPUT Temp' ? 'OUTPUT Hot' : l), [30, 25, 31, 29, 35, 20, 30], '4', 'output sim');
  BUILD['y9p-own-error-output'] = { walk: W, key: { prompt: 'A program counts with Big ← Big + 1. It should output the count at the end.\nWhich line should be the last line?', answers: ['OUTPUT Big'], keywords: [lineRe(['OUTPUT Big'])],
      distractors: ['OUTPUT Number', 'OUTPUT Count', 'INPUT Big'], working: ['Which variable goes up by 1 each time a value is counted?', 'Output that variable.'], note: 'Big holds the count, so the last line is OUTPUT Big.' },
    sim: { prompt: 'This program should input seven temperatures, count the ones that are 30 or more, then output the count. It has one error.\n' + showCode(S) + fixAsk, format: FIX_FMT,
      answers: ['12, OUTPUT Hot'], keywords: [fixRe(12, ['OUTPUT Hot'])], distractors: ['12, OUTPUT Day', '8, Hot ← Hot + Temp', '7, IF Temp > 30 THEN'],
      working: ['Which variable keeps the count?', 'Which line outputs the result? Does it output the count?'], note: 'Hot keeps the count. Line 12 outputs Temp, the last temperature, so it must be OUTPUT Hot.' } };
}
{
  const WL = [D('Cost', 'ARRAY[1:3] OF INTEGER'), D('Sum'), D('Index'), 'Cost[1] ← 8', 'Cost[2] ← 3', 'Cost[3] ← 6', 'Sum ← 0', 'FOR Index ← 1 TO 2', '    Sum ← Sum + Cost[Index]', 'NEXT Index', 'OUTPUT Sum'];
  const W = walkOf(WL, [], 'A similar program. It should output the total of all three costs.',
    [['All three costs make 8 + 3 + 6 = 17, but the trace gives 11. Cost[3] was never added.', [8]], ['The FOR line stops at index 2. It should be FOR Index ← 1 TO 3.', [7]]]);
  const S = [D('Temps', 'ARRAY[1:6] OF INTEGER'), D('Total'), D('Index'), 'Total ← 0', 'OUTPUT "Adding the temperatures"', 'FOR Index ← 2 TO 6', '    Total ← Total + Temps[Index]', 'NEXT Index', 'OUTPUT Total'];
  const fill = ['Temps[1] ← 5', 'Temps[2] ← 7', 'Temps[3] ← 2', 'Temps[4] ← 9', 'Temps[5] ← 4', 'Temps[6] ← 3'];
  similar(S.slice(0, 3).concat(fill, S.slice(3)).map((l) => l.replace('2 TO 6', '1 TO 6')), [], '30', 'array sim');
  BUILD['y9p-own-error-array'] = { walk: W, key: { prompt: 'FOR Index ← 1 TO 4\nWhich index values does this loop give?', format: 'Type the values with commas', answers: ['1, 2, 3, 4'], keywords: [/^\D*1\D+2\D+3\D+4\D*$/],
      distractors: ['1, 2, 3', '0, 1, 2, 3, 4', '1, 2, 3, 4, 5'], working: ['The first value is after the arrow.', 'The last value is after TO. Both ends are included.'], note: 'Index is 1, 2, 3 and 4: from the first value to the last, both ends included.' },
    sim: { prompt: 'The array Temps holds six temperatures, from index 1 to 6. This program should output the total of all six temperatures. It has one error.\n' + showCode(S) + fixAsk, format: FIX_FMT,
      answers: ['6, FOR Index ← 1 TO 6'], keywords: [fixRe(6, ['FOR Index ← 1 TO 6'])], distractors: ['6, FOR Index ← 0 TO 6', '7, Total ← Total + Temps[1]', '9, OUTPUT Total + Temps[1]'],
      working: ['Which index values does the loop give? Write them all.', 'Is every temperature from index 1 to 6 added?'], note: 'Line 6 starts at index 2, so Temps[1] is never added. It must be FOR Index ← 1 TO 6.' } };
}
{
  const WL = [D('Mark'), D('Sum'), D('Count'), 'Sum ← 0', 'OUTPUT "Type three marks"', 'FOR Count ← 1 TO 3', '    INPUT Mark', '    OUTPUT Mark', '    Sum ← Sum + 2', 'NEXT Count', 'OUTPUT Sum'];
  const W = walkOf(WL, [7, 4, 9], 'A similar program. It should output the total of three marks. The user types 7, 4 and 9.',
    [['The marks add up to 7 + 4 + 9 = 20, but Sum is 6. Line 09 adds 2 on every pass and never uses Mark.', [8]], ['So line 09 should be Sum ← Sum + Mark.', [8]]]);
  const S = [D('Weight'), D('Total'), D('Count'), 'Total ← 0', 'OUTPUT "Type five weights"', 'FOR Count ← 1 TO 5', '    INPUT Weight', '    Total ← Total + Count', 'NEXT Count', 'OUTPUT Total'];
  similar(S, [10, 20, 30, 40, 50], '15', 'add sim'); similar(S.map((l) => l.replace('Total + Count', 'Total + Weight')), [10, 20, 30, 40, 50], '150', 'add sim fixed');
  BUILD['y9p-own-error-add'] = { walk: W, key: { prompt: 'Total ← Total + 1 runs once on each pass.\nHow much does it add to Total each time?', answers: ['1'], keywords: [/^\s*(1|one)\s*\.?\s*$/i],
      distractors: ['The mark typed', 'The old Total', 'The value of Count'], working: ['Read the right of the arrow: Total + what?', 'Is that a variable or a number?'], note: 'It adds 1 every time, whatever is typed. A total of marks must add Mark.' },
    sim: { prompt: 'This program should input five weights and output their total. It has one error.\n' + showCode(S) + fixAsk, format: FIX_FMT,
      answers: ['8, Total ← Total + Weight'], keywords: [fixRe(8, ['Total ← Total + Weight', 'Total ← Weight + Total'])], distractors: ['8, Total ← Weight', '4, Total ← 1', '7, INPUT Total'],
      working: ['Trace it with any five weights. What does Total become?', 'Which line should add each weight typed to Total?'], note: 'Line 8 adds Count, not the weight. It must be Total ← Total + Weight.' } };
}
// Three errors
{
  const WL = [D('Speed'), D('Count'), D('Fast'), 'OUTPUT "Speed check"', 'OUTPUT "Type four speeds"', 'Fast ← 0', 'FOR Count ← 1 TO 3', '    INPUT Speed', '    IF Speed > 60 THEN', '        Fast ← Fast + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Speed'];
  const W = customWalk(WL, 'A similar program. It should input 4 speeds, count the speeds of 60 or more, then output the count. It has three errors. Check each part of the purpose.', [
    ['How many inputs? Line 07 gives 3 passes, but the purpose says 4. Correct line: FOR Count ← 1 TO 4.', [6]],
    ['The value on the line: "60 or more" includes 60, but 60 > 60 is FALSE. Correct line: IF Speed >= 60 THEN.', [8]],
    ['What is output? The count is in Fast, but line 13 outputs Speed. Correct line: OUTPUT Fast.', [12]]]);
  const S = [D('Age'), D('Count'), D('Teen'), 'Teen ← 0', 'OUTPUT "Type six ages"', 'FOR Count ← 1 TO 5', '    INPUT Age', '    IF Age > 13 THEN', '        Teen ← Teen + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Age'];
  similar(S.map((l) => l.replace('1 TO 5', '1 TO 6').replace('Age > 13', 'Age >= 13').replace('OUTPUT Age', 'OUTPUT Teen')), [13, 12, 15, 13, 9, 14], '4', 'three sim');
  BUILD['y9p-own-three'] = { walk: W, key: { prompt: 'The purpose says 6 items are input, one on each pass.\nWhich FOR line inputs 6 items?', answers: ['FOR Count ← 1 TO 6'], keywords: [lineRe(['FOR Count ← 1 TO 6', 'FOR Count ← 0 TO 5'])],
      distractors: ['FOR Count ← 1 TO 5', 'FOR Count ← 2 TO 6', 'FOR Count ← 6 TO 6'], working: ['Count each value from the first to the last.', 'Both ends are included.'], note: '1 TO 6 gives 1, 2, 3, 4, 5 and 6: six passes.' },
    sim: { prompt: 'This algorithm should input the ages of 6 students, count how many are 13 or more, then output the count. It has three errors.\n' + showCode(S) + '\nIdentify the line numbers of the three errors.',
      format: 'Type the three line numbers', answers: ['06, 08, 12'], keywords: [lineSetRe([6, 8, 12])], distractors: ['06, 08, 09', '05, 08, 12', '06, 07, 12'],
      working: ['Read the purpose: how many ages, which ages are counted, and what is output?', 'Check the FOR line, the IF line and the last OUTPUT line against it.'], note: 'Line 06 gives 5 passes, not 6. Line 08 misses 13 itself. Line 12 outputs Age, not the count Teen.' } };
}
// Explain the method
{
  const W = customWalk([], 'A similar case. A program should output the biggest of three numbers: 4, 9 and 6.', [
    ['The purpose says what it should do. So it should output 9.', []],
    ['A trace shows what it really does. Say the trace gives 6.', []],
    ['The two are different, so there is an error. Now follow the trace back to the first line where it goes wrong.', []]]);
  BUILD['y9p-own-purpose-why'] = { walk: W, key: { prompt: 'What does the purpose of a program tell you?', answers: ['What the program should do'], keywords: [/\b(should|supposed|meant|job|aim|intended|expected)\b/i],
      distractors: ['Which line has the error', 'How fast the program runs', 'How many lines the program has'], working: ['The purpose is the job of the program.', 'Is that what it does, or what it is meant to do?'], note: 'The purpose is the job the program should do.' },
    sim: { prompt: 'A student traces a program. The purpose says it should output 20. The trace gives 15.\nExplain what this tells the student.', answers: ['The program has an error, because what it really does is different from what it should do'],
      keywords: [/^(?=.*\b(error|errors|wrong|mistake|mistakes|bug|fault|incorrect)\b)(?=.*(\bdifferent\b|\bdiffer|\bnot\s+the\s+same\b|\bshould\b|\bpurpose\b|\b20\b|\b15\b|\bmatch))/i],
      distractors: ['The student made a slip, so tracing again will give 20', 'The program is correct, because it gives an output', 'The student should change the purpose to say 15'],
      working: ['What should the program output? What does it really output?', 'If the two are different, what does that tell you about the program?'], note: 'What it really does (15) is different from what it should do (20), so the program has an error.' } };
}

// ---------------------------------------------------------------- put the cards in order: key idea, similar, question
{
  const byQ = new Map(SET.questions.map((q) => [q.fallback, q.qid]));
  const out = [], seen = new Set(), ofQ = {};
  for (const c of cards) {
    const qid = byQ.get(c.note); assert(qid, 'qid for ' + c.id);
    const b = BUILD[qid]; assert(b, 'build-up cards for ' + qid);
    if (!seen.has(qid)) {
      seen.add(qid);
      const base = qid.replace(/^y9p-(own-)?/, '');
      out.push({ id: 'k-' + base, category: c.category, ...b.key, walk: (b.keyWalk || b.walk).walk }); ofQ['k-' + base] = qid;
      out.push({ id: 's-' + base, category: c.category, ...b.sim, walk: b.walk.walk }); ofQ['s-' + base] = qid;
    }
    const ex = { ...c, qid, walk: b.walk.walk };
    out.push(ex);
  }
  cards.length = 0; cards.push(...out);
  // A walk never shows a card's own answer: its program's output differs, and its words never contain the answer.
  for (const c of cards) {
    const bb = BUILD[c.qid || ofQ[c.id]], b = { walk: /^k-/.test(c.id) && bb.keyWalk ? bb.keyWalk : bb.walk };
    const words = b.walk.walk.map((s) => s.text).join(' ').replace(/←/g, '<-').replace(/\s+/g, ' ');
    const ans = String(c.answers[0]).replace(/←/g, '<-');
    assert(b.walk.outs.filter((x) => /^-?\d/.test(x)).slice(-1)[0] !== ans, c.id + ': the walk program outputs the answer ' + ans);
    if (!/^\d+$/.test(ans)) assert(ans.length < 4 || !new RegExp('(^|\\W)' + escRe(ans.toLowerCase()) + '(\\W|$)').test(words.toLowerCase()), c.id + ': walk shows the answer ' + ans);
    else for (const st of b.walk.walk.filter((x) => !x.state && x !== b.walk.walk[0])) assert(!new RegExp('(^|[^\\d.])' + ans + '(?![\\d.])').test(st.text.replace(/[Ll]ines? \d+|Pass \d+/g, '')), c.id + ': walk note shows the answer ' + ans + ': ' + st.text);
  }
}

// ---------------------------------------------------------------- write the file
const CATS = [['ln', 'Line by Line'], ['st', 'Types of Statement'], ['lp', 'Inside or After the Loop'], ['if', 'Where the IF Goes'],
  ['bd', 'The Value on the Line'], ['fx', 'Find and Correct the Error'], ['er', 'Three and Four Errors'], ['ex', 'Explain the Method']];
function ser(v, ind = '') {
  if (v instanceof RegExp) return v.toString();
  if (Array.isArray(v)) return '[' + v.map((x) => ser(x, ind)).join(', ') + ']';
  if (v && typeof v === 'object') return '{ ' + Object.entries(v).map(([k, x]) => k + ': ' + ser(x, ind)).join(', ') + ' }';
  return JSON.stringify(v);
}
const order = CATS.map((c) => c[0]);
cards.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
let body = '// Year 9, 3.1 Pseudocode: Data Bridge Questions (Drills library only; not in any lesson)\n' +
  '// Loaded by Drills/index.html?drill=' + ID + '\n' +
  '// Generated by tools/build_y9_3_1_db_drill.mjs from the Exam Game set y9-pseudocode (shell ExamGameSetY9Pseudocode.gs): edit that, then run it.\n' +
  'DrillData.register("' + ID + '", {\n' +
  '// For each set question: the key idea, a similar question with new numbers, then the question itself (cards with a qid).\n' +
  '// Every card has "Walk me through it" on a similar program, worked out by running it in shared/pseudocode-engine.js.\n' +
  '  title: "3.1 Pseudocode: Data Bridge Questions",\n' +
  '  subtitle: "Learn every Data Bridge question on following and correcting pseudocode, one step at a time",\n' +
  '  // Haiku second check on typed answers the keyword check rejects; each card waits for Next question.\n' +
  '  aiFallback: true,\n  waitForNext: true,\n  keepOrder: true,\n' +
  '  // The slides\' "I need help" chat on every card (Haiku, three questions per card, never the answer).\n' +
  '  aiHelp: true,\n' +
  '  categories: [\n' + CATS.map((c) => '    ' + JSON.stringify(c)).join(',\n') + '\n  ],\n' +
  '  cards: [\n' + cards.map((c) => '    ' + ser(c)).join(',\n') + '\n  ]\n});\n';
assert(!/[–—]|&mdash;|&ndash;/.test(body), 'em or en dash');
assert(!/[\u{1F300}-\u{1FAFF}]/u.test(body), 'emoji');
assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV)\b/.test(body), 'a construct Year 9 has not met');
assert(!/\bdecimal\b/i.test(body), 'syllabus terms');

// ---------------------------------------------------------------- self-check: load and grade every card
const registered = {};
const ctx = vm.createContext({ console, Math, JSON, DrillData: { register: (id, d) => { registered[id] = d; } } });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
vm.runInContext(body, ctx, { filename: ID + '.js' });
const d = registered[ID];
const ids = new Set();
const typed = (c, s) => c.keywords.some((k) => k.test(s));
for (const c of d.cards) {
  const w = ID + ' ' + c.id;
  assert(!ids.has(c.id), w + ' duplicate id'); ids.add(c.id);
  assert(order.includes(c.category), w + ' category');
  assert(typed(c, c.answers[0]), w + ': own answer fails');
  assert(c.distractors.length === 3 && new Set(c.distractors).size === 3, w + ' three distractors');
  for (const x of c.distractors) assert(!typed(c, x) && x !== c.answers[0], w + ': distractor passes: ' + x);
  assert(c.working && c.working.length === 2, w + ' working');
  const ansRe = new RegExp('(^|[^\\w.-])' + escRe(c.answers[0]) + '(?!\\w|\\.\\d)');
  for (const x of c.working) assert(!ansRe.test(x) || ansRe.test(c.prompt), w + ' working shows the answer: ' + x);
}
const C = (id) => d.cards.find((c) => c.id === id);
const accept = (id, list) => list.forEach((s) => assert(typed(C(id), s), id + ' accepts ' + s));
const reject = (id, list) => list.forEach((s) => assert(!typed(C(id), s), id + ' rejects ' + s));
accept('q-st-assign', ['5', 'line 06', '12', 'Line 9']); reject('q-st-assign', ['7', '15']);
accept('q-fx-input', ['6 INPUT Score', 'line 6, input score', '06: INPUT Score']); reject('q-fx-input', ['INPUT Score', '6']);
accept('q-fx-array', ['5, FOR Index <- 1 TO 5', '5 FOR Index = 1 TO 5']);
accept('q-bd-fix', ['IF Mark >= 40', 'if mark>=40 then', 'IF Mark > 39 THEN']); reject('q-bd-fix', ['IF Mark => 40']);
accept('q-er3-lines', ['5, 7, 11', '11 7 5', 'lines 05, 07 and 11']); reject('q-er3-lines', ['5, 7', '5, 7, 11, 8']);
accept('q-er4-lines', ['1, 5, 7, 8', '08 07 05 01']);
accept('q-if-where', ['inside the loop after INPUT Number', 'in the loop, after the input']); reject('q-if-where', ['inside the loop', 'after the input']);
accept('q-reset-why', ['Total is reset to 0 every pass so only the last value is added', 'it sets total to zero each time so it only keeps 6']);
accept('q-bd-why', ['40 is exactly on the boundary so > and >= give different answers', 'it is the boundary, it shows if 40 is counted']);
accept('q-ex-purpose', ['it tells you what the program should output so you can compare it with the trace']);
accept('q-trace', ['3,4,5,5', '3 4 5 output 5']);
// Every set question is taught by at least one card.
const noteSet = new Set(d.cards.map((c) => c.note));
for (const q of SET.questions) assert(noteSet.has(q.fallback), 'no card for ' + q.qid);

fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), body);
console.log(`${ID}: ${d.cards.length} cards in ${CATS.length} categories, covering ${SET.questions.length} set questions`);
