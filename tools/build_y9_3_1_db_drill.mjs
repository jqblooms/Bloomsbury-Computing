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
    keywords: [/^(?=.*(\b(inside|in|within)\b[^.]*\bloop\b|\bbefore\s+next\b))(?=.*\bafter\b[^.]*\b(input|line\s*0?6)\b)|^\s*(option\s*)?b\s*\.?\s*$/i],
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
    keywords: [lineRe(['IF Temp <= 15 THEN', 'IF Temp < 16 THEN', 'IF 15 >= Temp THEN']), /^\s*(option\s*)?c\s*\.?\s*$/i],
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
  '  title: "Year 9, 3.1 Pseudocode: Data Bridge Questions",\n' +
  '  subtitle: "Every Data Bridge question from lesson 3.1, step by step",\n' +
  '  // Haiku second check on typed answers the keyword check rejects; each card waits for Next question.\n' +
  '  aiFallback: true,\n  waitForNext: true,\n' +
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
accept('q-if-where', ['inside the loop after INPUT Number', 'in the loop, after the input', 'B']); reject('q-if-where', ['inside the loop', 'after the input']);
accept('q-reset-why', ['Total is reset to 0 every pass so only the last value is added', 'it sets total to zero each time so it only keeps 6']);
accept('q-bd-why', ['40 is exactly on the boundary so > and >= give different answers', 'it is the boundary, it shows if 40 is counted']);
accept('q-ex-purpose', ['it tells you what the program should output so you can compare it with the trace']);
accept('q-trace', ['3,4,5,5', '3 4 5 output 5']);
// Every set question is taught by at least one card.
const noteSet = new Set(d.cards.map((c) => c.note));
for (const q of SET.questions) assert(noteSet.has(q.fallback), 'no card for ' + q.qid);

fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), body);
console.log(`${ID}: ${d.cards.length} cards in ${CATS.length} categories, covering ${SET.questions.length} set questions`);
