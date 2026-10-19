// Builds LessonData/y11-8-1-strings.json: Year 11, 8.1 L5: String Handling, writes its three drills
// (Drills/data/y11-8-1-strings-ext.js, y11-8-1-strings-code.js, y11-8-1-strings.js), and registers the lesson in the
// Year 11 8.1 Programming Concepts unit after y11-8-1-ops.
//   node tools/build_y11_8_1_strings.mjs
// Syllabus 8.1 4(e): string handling, LENGTH, SUBSTRING, UCASE and LCASE, written as in the 0478 insert:
// LENGTH(S), SUBSTRING(S, Start, Length) with the first character at position 1, UCASE(S), LCASE(S).
// Term 1b rule (James, 2026-10-18): every slide asks WHY. Why SUBSTRING("Computer", 1, 3) is "Com" (start counts from
// 1, the third value is how many), why LENGTH reaches the last character of any word, why programs compare
// UCASE(Answer) with "YES", and why a string function's result must be stored or output.
// EAL-light shape: short sentences, a teacher-only Think, Pair, Share under every heading, predict-then-reveal,
// compare slides. Do Now: 0478/23 June 2023 Q1, 0478/23 June 2026 Q1, 0478/23 June 2024 Q3, each slide with a Walk me
// through it, then the y11-8-1-strings-ext Extension. Activities: a Trace Tables trace counting the A's in a word,
// and the y11-8-1-strings-code drill. Plenary: the y11-8-1-strings drill. Every string result on a slide is worked
// out by shared/pseudocode-engine.js, which gained the four string functions for this lesson.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-8-1-strings';
const P = 'y11st';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const re = (source) => ({ __regex: true, source, flags: 'i' });
const reCase = (source) => ({ __regex: true, source, flags: '' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A boxed program; numbered adds line numbers.
const code = (lines, numbered = false) => '<div class="lesson-code">' +
  lines.map((l, i) => `<div class="lesson-code-line">${numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : ''}${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length))}</div>`).join('') + '</div>';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
const c = (s) => `<code>${esc(s)}</code>`;

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '', whyQ = null) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: p.cs ? reCase(p.answer) : re(p.answer), feedback: p.feedback, marks: p.marks || 1 }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
function mcStep(id, label, heading, lead, items, whyQ = null) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`,
    items };
}
function selfStep(id, label, heading, lead, items, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` +
      (extra ? columns(extra, `<div id="${cid}"></div>`) : `<div id="${cid}"></div>`),
    items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
// Runs a program through the site's pseudocode engine and returns its outputs.
function run(src, vars = {}, inputs = []) {
  const r = runPseudocode(src, vars, 5000, inputs.map(String));
  if (r.error) throw new Error(`Program failed: ${r.error.message}\n${src}`);
  return r.outputs;
}
// One expression's value, or the engine's error.
function value(expr, vars = {}) {
  const r = runPseudocode(`OUTPUT ${expr}`, vars, 5000, []);
  return r.error ? { error: r.error.message } : r.outputs[0];
}
const V = (expr, vars) => { const v = value(expr, vars); if (v && v.error) throw new Error(expr + ': ' + v.error); return v; };
const q = (s) => `"${s}"`;
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%"><tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((x) => `<td style="padding:6px 12px;text-align:left">${x}</td>`).join('') + '</tr>').join('') + '</table>';
// A word drawn as numbered boxes: the position above each character. hl lists the positions to mark.
const HL = 'background:var(--brand-soft);color:var(--ink)';
function strip(word, hl = []) {
  const cell = (x, p, th) => `<${th ? 'th' : 'td'} style="padding:6px 10px;text-align:center;min-width:34px${hl.includes(p) ? ';' + HL : ''}">${x}</${th ? 'th' : 'td'}>`;
  return '<table class="donow-table" style="font-size:18px"><tr><th style="padding:6px 10px;text-align:left">Position</th>' + [...word].map((ch, i) => cell(String(i + 1), i + 1, true)).join('') + '</tr>' +
    '<tr><th style="padding:6px 10px;text-align:left">Character</th>' + [...word].map((ch, i) => cell(ch === ' ' ? '&middot;' : esc(ch), i + 1, false)).join('') + '</tr></table>';
}

// Answer patterns. Text values keep their case (UCASE and LCASE are the point), with either quote style or none.
const QO = '["\'\u201c\u201d\u2018\u2019]?';
const textRe = (s) => `^\\s*${QO}${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}${QO}\\s*$`;
const numRe = (n) => `^\\s*${n}\\s*$`;
const TF = (v) => `^\\s*${v}\\s*$`;
const ARROW = '\\s*(<-|\u2190)\\s*';
const fn = (name, ...args) => `${name}\\s*\\(\\s*${args.join('\\s*,\\s*')}\\s*\\)`;

const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
// Each step is { text, visual }: one short sentence, and a picture with the part that matters marked .wt-hl. They
// use a different question from the slide's own, so they show the method and never the answer.
function askList(rows, hl) {
  return '<table class="donow-table" style="font-size:17px">' + rows.map((r, i) =>
    `<tr${i === hl ? ' class="wt-hl"' : ''}><td style="padding:6px 12px;text-align:left">${r[0]}</td><td style="padding:6px 12px;text-align:left"><strong>${r[1]}</strong></td></tr>`).join('') + '</table>';
}
// Do Now 1 (two tick-one-box questions), worked with 0478/22 March 2025 Q1, a different question.
const OPTS = [['A', 'bubble sort'], ['B', 'counting routine'], ['C', 'linear search'], ['D', 'selection search']];
const WT_TICK = { title: 'Walk me through it: tick one box', steps: [
  { text: 'A similar question: <strong>a standard method of solution used to find a piece of data in an array is</strong> ...', visual: askList(OPTS, -1) },
  { text: 'First find the key words in the sentence. Here they are <strong>find a piece of data</strong>.', visual: '<div class="wt-big">used to <span class="wt-hl">find a piece of data</span> in an array</div>' },
  { text: 'Now say what each option does, in plain words.', visual: askList([['bubble sort', 'puts data in order'], ['counting routine', 'adds 1 each time'], ['linear search', 'checks each item until it finds one'], ['selection search', 'not a method we use']], -1) },
  { text: 'Match the key words to one option. Finding data is a <strong>linear search</strong>, so tick C.', visual: askList([['bubble sort', 'puts data in order'], ['counting routine', 'adds 1 each time'], ['linear search', 'checks each item until it finds one'], ['selection search', 'not a method we use']], 2) },
  { text: 'Now do your two questions the same way: find the key words, then say what each option does.', visual: '<div class="wt-big">key words &rarr; what each option does &rarr; tick one</div>' },
] };
// Do Now 2 (describe STRING and CHAR with an example), worked with INTEGER and REAL.
const WT_TYPES = { title: 'Walk me through it: describe a data type', steps: [
  { text: 'A similar question: say what is meant by <strong>INTEGER</strong> and <strong>REAL</strong>, and give an example of each.', visual: '<div class="wt-big">INTEGER &nbsp; REAL</div>' },
  { text: 'Say what kind of value the type holds. An INTEGER holds a <strong>whole number</strong>.', visual: '<div class="wt-big">INTEGER: <span class="wt-hl">a whole number</span></div>' },
  { text: 'Give an example that fits this type: <strong>27</strong>.', visual: '<div class="wt-big">INTEGER: a whole number. Example: <span class="wt-hl">27</span></div>' },
  { text: 'A REAL holds a number with a decimal point. Example: <strong>3.5</strong>.', visual: '<div class="wt-big">REAL: a number with a decimal point. Example: <span class="wt-hl">3.5</span></div>' },
  { text: 'Check each example: 3.5 cannot be an INTEGER, so it shows what a REAL is.', visual: '<div class="wt-big">3.5 &rarr; <span class="wt-hl">REAL only</span></div>' },
  { text: 'Now do your two types the same way: what does it hold? Then one example.', visual: '<div class="wt-big">what it holds &rarr; one example</div>' },
] };

// ---------------------------------------------------------------- Do Now (8.1 L1, topic 7, 8.1 L2) and its extension
steps.push(mcStep('do-now', 'Do Now: Constants and Totalling (1 of 2)', 'Do Now: Constants and Totalling (1 of 2)',
  'From 8.1 L1 and topic 7. Cambridge IGCSE 0478/23, June 2023, Question 1 and 0478/23, June 2026, Question 1.', [
    { prompt: 'Tick one box to complete the sentence. A constant', options: ['stores a value that can change at any time during the execution of a program.', 'stores a value that cannot change during the execution of a program.', 'stores values of multiple data types.', 'stores values that must be of the same data type.'], correct: 1,
      explain: 'A constant is set once. Its value cannot change while the program runs.' },
    { prompt: 'Tick one box to complete this sentence. A standard method of solution used for adding together a set of values during iteration is', options: ['counting.', 'searching.', 'sorting.', 'totalling.'], correct: 3,
      explain: 'Totalling adds each value to a running total. Counting only adds 1 each time.' },
  ], ['Why is a loop useful when a program works with many values?', 'The same lines run for every value. You write them once, and the loop repeats them as many times as needed.']));
steps[steps.length - 1].walkthrough = WT_TICK;

const STRING_DESC = '^(?=.*\\b(characters?|letters?|symbols?|digits?|text)\\b)(?=.*\\b(group|groups|many|more than one|several|sequence|series|collection|set|lots|multiple|any number|zero or more|one or more|combination|mix|mixture|list|row|word|words|sentence)\\b).*$';
const CHAR_DESC = '^(?!.*\\b(more than one|many|group|several|multiple|words?)\\b)(?=.*\\b(single|one|1)\\b)(?=.*\\b(characters?|letters?|symbols?|digits?|char)\\b).*$';
const STRING_EX = `^\\s*${QO}[^"'\u201c\u201d\u2018\u2019]{2,}${QO}\\s*$`;
const CHAR_EX = `^\\s*${QO}[^\\s"'\u201c\u201d\u2018\u2019]${QO}\\s*$`;
steps.push(checkStep('do-now-2', 'Do Now: STRING and CHAR (2 of 2)', 'Do Now: STRING and CHAR (2 of 2)',
  'From 8.1 L2. Cambridge IGCSE 0478/23, June 2024, Question 3. Describe the characteristics of the string and char data types and give an example of each.', [
    { label: 'String: what it holds', answer: STRING_DESC, line: true, feedback: 'How many characters can a string hold? Say what they can be.' },
    { label: 'String: an example', answer: STRING_EX, feedback: 'Give a value with more than one character.' },
    { label: 'Char: what it holds', answer: CHAR_DESC, line: true, feedback: 'How many characters does a char hold?' },
    { label: 'Char: an example', answer: CHAR_EX, feedback: 'Give a value with exactly one character.' },
  ], '', ['Why is TRUE stored as BOOLEAN, not as text?', 'BOOLEAN holds only TRUE or FALSE, so conditions can use it. Text could hold anything, even spelling mistakes.']));
steps[steps.length - 1].walkthrough = WT_TYPES;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-8-1-strings-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 8.1 L1 to L4: variables, constants, data types, arithmetic operators, and relational and logical operators. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'String Handling',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">8.1 Programming Concepts</p><h2 class="lesson-h2">String Handling</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> count the characters in a string, take part of a string, and change it to capital or small letters.',
      '<strong>Every time, ask why:</strong> why does it give that answer?', '<strong>Activities:</strong> trace a program, then write your own string code and run it.']) +
    why('Why does a program need to look at the characters inside a string?', 'To check what the user typed: a password that is long enough, a code that starts with PD, a yes typed as YES or yes.') });

// ---------------------------------------------------------------- LENGTH: predict then reveal
const HD = V('LENGTH("Happy Days")');
assert(HD === 10, 'LENGTH Happy Days');
const LEN_ROWS = ['Cat', 'Happy Days', 'Year 11'].map((w) => [c(`LENGTH("${w}")`), String(V(`LENGTH("${w}")`))]);
assert(LEN_ROWS.map((r) => r[1]).join() === '3,10,7', 'length table');
steps.push({ id: 'length', label: 'LENGTH: Count the Characters',
  content: '<h2 class="lesson-h2">LENGTH: Count the Characters</h2>' +
    tps('Predict: what does LENGTH("Happy Days") give? Why is it not 9?',
      `<p>It gives <strong>${HD}</strong>.</p><p>The space is a character too. 5 letters, 1 space, 4 letters: 5 + 1 + 4 = ${HD}.</p>`, 'Show the worked answer') +
    strip('Happy Days', [6]) +
    columns(table(LEN_ROWS, ['Code', 'Result']),
      facts(['<code>LENGTH(Word)</code> gives the number of characters in Word.', 'Letters, digits, symbols and spaces all count.', 'The result is a whole number: an INTEGER.'])) });

const NAME = { Name: 'Ali Khan' };
const CL = [V('LENGTH(Name)', NAME), V('LENGTH("Hi there!")')];
assert(CL.join() === '8,9', 'check-length answers');
steps.push(checkStep('check-length', 'Check: LENGTH', 'Check: LENGTH', 'Name holds "Ali Khan".', [
  { label: 'What does LENGTH(Name) give?', answer: numRe(CL[0]), feedback: 'Count every character. The space counts too.' },
  { label: 'What does LENGTH("Hi there!") give?', answer: numRe(CL[1]), feedback: 'Count the letters, the space and the !' },
  { label: 'Write the line that stores the number of characters in Password in the variable Size.', answer: `^\\s*Size${ARROW}${fn('LENGTH', 'Password')}\\s*$`, line: true, feedback: 'The variable, then &lt;-, then LENGTH with Password in the brackets.' },
], '', ['Why is the result of LENGTH an INTEGER, not a STRING?', 'LENGTH counts the characters. A count is a whole number.']));

steps.push(selfStep('exam-length', 'Exam Question: Six Characters Long', 'Exam Question: Six Characters Long',
  'Cambridge IGCSE 0478/22, June 2024, Question 4(b)(i). A program needs to make sure the characters input for a product code meet these rules: the product code is six characters in length; the first two characters must be "PD"; the last four characters must be a number in the range 1000 to 9999 inclusive. The product code is stored in the variable Product.', [
    { id: 'length-six', prompt: 'Write the pseudocode to make sure that the product code is six characters in length.', marks: 2,
      modelAnswer: 'REPEAT<br>&nbsp;&nbsp;INPUT Product<br>UNTIL LENGTH(Product) = 6<br>One mark for LENGTH(Product), one mark for testing it against 6 so the code is input again until it fits. A WHILE LENGTH(Product) &lt;&gt; 6 DO loop is also correct.' },
  ], ['Why read the rules in the question twice before you write code?', 'Each rule becomes a test in your code. If you miss one word, your check is wrong.']));

// ---------------------------------------------------------------- SUBSTRING: predict then reveal
const COM = V('SUBSTRING("Computer", 1, 3)');
assert(COM === 'Com', 'SUBSTRING Computer 1 3');
const SUB_ROWS = [[1, 3], [4, 3], [8, 1]].map(([s, n]) => [c(`SUBSTRING("Computer", ${s}, ${n})`), String(s), String(n), q(V(`SUBSTRING("Computer", ${s}, ${n})`))]);
assert(SUB_ROWS.map((r) => r[3]).join() === '"Com","put","r"', 'substring table');
steps.push({ id: 'substring', label: 'SUBSTRING: Take Part of a String',
  content: '<h2 class="lesson-h2">SUBSTRING: Take Part of a String</h2>' +
    tps('Predict: what does SUBSTRING("Computer", 1, 3) give? Why?',
      `<p>It gives <strong>"${COM}"</strong>.</p><p>1 is the start: the first character is position 1. 3 is how many characters to take: C, o, m.</p>`, 'Show the worked answer') +
    strip('Computer', [1, 2, 3]) +
    table(SUB_ROWS, ['Code', 'Start', 'How many', 'Result']) +
    facts(['<code>SUBSTRING(Word, Start, Length)</code>: take <strong>Length</strong> characters, starting at position <strong>Start</strong>.', 'The first character is position 1.']) });

const CMP = [[3, 5], [2, 4]].map(([s, n]) => {
  const realV = V(`SUBSTRING("Computer", ${s}, ${n})`), stopV = V(`SUBSTRING("Computer", ${s}, ${n - s + 1})`);
  return [c(`SUBSTRING("Computer", ${s}, ${n})`), q(stopV), `<strong>${q(realV)}</strong>`];
});
assert(CMP.map((r) => r[1] + r[2]).join() === '"mpu"<strong>"mpute"</strong>,"omp"<strong>"ompu"</strong>', 'compare-count table');
steps.push({ id: 'compare-count', label: 'Compare: How Many, Not Where to Stop',
  content: '<h2 class="lesson-h2">Compare: How Many, Not Where to Stop</h2>' +
    tps('Why does SUBSTRING("Computer", 3, 5) give "mpute" and not "mpu"?',
      '<p>5 is <strong>how many</strong> characters to take, not the position to stop at.</p><p>Start at position 3, then take 5 characters: m, p, u, t, e.</p>') +
    strip('Computer', [3, 4, 5, 6, 7]) +
    table(CMP, ['Code', 'If it meant "stop at"', 'What SUBSTRING really gives']) +
    facts(['The second value is <strong>where to start</strong>.', 'The third value is <strong>how many</strong> characters.']) });

const LAST = ['Computer', 'Mouse', 'Keyboards'].map((w) => {
  const a = value('SUBSTRING(Word, 8, 1)', { Word: w }), b = V('SUBSTRING(Word, LENGTH(Word), 1)', { Word: w });
  return [q(w), String(V('LENGTH(Word)', { Word: w })), a && a.error ? 'Error: past the end' : q(a), `<strong>${q(b)}</strong>`];
});
assert(LAST.map((r) => r[2] + '/' + r[3]).join() === '"r"/<strong>"r"</strong>,Error: past the end/<strong>"e"</strong>,"d"/<strong>"s"</strong>', 'compare-last table');
steps.push({ id: 'compare-last', label: 'Compare: Reaching the Last Character',
  content: '<h2 class="lesson-h2">Compare: Reaching the Last Character</h2>' +
    tps('Both lines work for "Computer". Why does only the second line work for every word?',
      '<p>8 is the last position only when the word has 8 characters. "Mouse" has no position 8, and in "Keyboards" position 8 is not the end.</p><p>LENGTH(Word) is always the position of the last character, whatever the word.</p>') +
    table(LAST, ['Word', 'LENGTH(Word)', c('SUBSTRING(Word, 8, 1)'), c('SUBSTRING(Word, LENGTH(Word), 1)')]) +
    facts(['The last character is at position <code>LENGTH(Word)</code>.', 'A program must work for any word, not just the one you tested.']) });

const KB = { Word: 'Keyboard' };
const CS = [V('SUBSTRING(Word, 1, 3)', KB), V('SUBSTRING(Word, 4, 5)', KB), V('SUBSTRING(Word, LENGTH(Word), 1)', KB)];
assert(CS.join() === 'Key,board,d', 'check-sub answers');
steps.push(checkStep('check-sub', 'Check: SUBSTRING', 'Check: SUBSTRING', 'Word holds "Keyboard". Capital letters matter.', [
  { label: 'SUBSTRING(Word, 1, 3)', answer: textRe(CS[0]), cs: true, feedback: 'Start at position 1. Take 3 characters.' },
  { label: 'SUBSTRING(Word, 4, 5)', answer: textRe(CS[1]), cs: true, feedback: 'Start at position 4. Then take 5 characters: 5 is how many, not where to stop.' },
  { label: 'SUBSTRING(Word, LENGTH(Word), 1)', answer: textRe(CS[2]), cs: true, feedback: 'Work out LENGTH(Word) first. That position is the last character.' },
  { label: 'Write the line that stores the first letter of Name in the variable Initial.', answer: `^\\s*Initial${ARROW}${fn('SUBSTRING', 'Name', '1', '1')}\\s*$`, line: true, feedback: 'SUBSTRING needs three values: the string, where to start, how many.' },
], '', ['Why must a program never ask SUBSTRING for a position past the end?', 'That position does not exist, so there is no character to take. The program stops with an error.']));

steps.push(selfStep('exam-pd', 'Exam Question: Starts With PD', 'Exam Question: Starts With PD',
  'Cambridge IGCSE 0478/22, June 2024, Question 4(b)(ii). The same product code rules: six characters, the first two characters must be "PD", the last four characters a number from 1000 to 9999. The product code is stored in the variable Product.', [
    { id: 'starts-pd', prompt: 'Write the pseudocode to make sure that the first two characters of the product code are "PD".', marks: 2,
      modelAnswer: 'REPEAT<br>&nbsp;&nbsp;INPUT Product<br>UNTIL SUBSTRING(Product, 1, 2) = "PD"<br>One mark for SUBSTRING(Product, 1, 2), one mark for testing it against "PD" so the code is input again until it starts with PD.' },
  ], ['Why does a product code have rules at all?', 'Every code has the same shape, so a wrong code can be found as soon as it is typed in.']));

const FACT = 'I learnt to program in computer science';
const PROG = V('SUBSTRING(Fact, 13, 7)', { Fact: FACT });
assert(PROG === 'program', 'June 2026 Q6(b)');
steps.push(checkStep('exam-program', 'Exam Question: Find the Word', 'Exam Question: Find the Word',
  'Cambridge IGCSE 0478/23, June 2026, Question 6(b). The string "I learnt to program in computer science" is stored in the variable Fact.', [
    { label: 'Write the pseudocode statement to use a string function to output the word program taken from the string stored in Fact. Do not declare any variables.', marks: 2,
      answer: `^\\s*OUTPUT\\s+${fn('SUBSTRING', 'Fact', '1[23]', '7')}\\s*$`, line: true, feedback: 'Count the characters before "program", spaces too. Then: how many letters are in program?' },
  ], code(['Fact <- "I learnt to program in computer science"']),
  ['In "We love maths", maths is the third word. Why does it not start at position 3?', 'Spaces are characters too. "We love " is 8 characters, so maths starts at 9.']));

// ---------------------------------------------------------------- activity 1: Trace Tables, count the A's
const WORD = 'PASTA';
const COUNT_SRC = `DECLARE Word : STRING\nDECLARE Letter : STRING\nDECLARE Count : INTEGER\nDECLARE Total : INTEGER\nWord <- "${WORD}"\nTotal <- 0\nFOR Count <- 1 TO LENGTH(Word)\n  Letter <- SUBSTRING(Word, Count, 1)\n  IF Letter = "A" THEN\n    Total <- Total + 1\n  ENDIF\nNEXT Count\nOUTPUT Total`;
const TR = run(COUNT_SRC);
const trRows = [{ Line: '5', Word: WORD, Count: '', Letter: '', Total: '', Output: '' }, { Line: '6', Word: '', Count: '', Letter: '', Total: '0', Output: '' }];
let total = 0;
[...WORD].forEach((ch, i) => {
  trRows.push({ Line: '7', Word: '', Count: String(i + 1), Letter: '', Total: '', Output: '' });
  trRows.push({ Line: '8', Word: '', Count: '', Letter: ch, Total: '', Output: '' });
  if (ch === 'A') { total += 1; trRows.push({ Line: '10', Word: '', Count: '', Letter: '', Total: String(total), Output: '' }); }
});
trRows.push({ Line: '11', Word: '', Count: '', Letter: '', Total: '', Output: String(total) });
assert(TR.join() === '2' && String(total) === '2', 'activity-1 trace agrees with the engine');
steps.push({ id: 'activity-1', label: 'Activity 1: Trace the Letters', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Count the Letter A',
    context: `Word holds "${WORD}". The first character is position 1. Complete the trace table.`,
    code: ['DECLARE Word : STRING', 'DECLARE Letter : STRING', 'DECLARE Count : INTEGER', 'DECLARE Total : INTEGER', `Word = "${WORD}"`, 'Total = 0',
      'for Count in range(1, LENGTH(Word) + 1):', '    Letter = SUBSTRING(Word, Count, 1)', '    if Letter == "A":', '        Total = Total + 1', 'print(Total)'],
    cols: ['Line', 'Word', 'Count', 'Letter', 'Total', 'Output'],
    answers: trRows,
  },
  content: '<h2 class="lesson-h2">Activity 1: Trace the Letters</h2>' +
    why('Why does SUBSTRING(Word, Count, 1) take only 1 character?', 'The loop looks at one letter at a time. Each time round, Count moves on to the next position.') +
    `<div id="${P}-embed-1" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- UCASE and LCASE: predict then reveal
const HAPPY = V('UCASE("Happy")'), SMALLW = V('LCASE("W")');
assert(HAPPY === 'HAPPY' && SMALLW === 'w', 'syllabus case examples');
const CASE_ROWS = ['UCASE("Happy")', 'LCASE("W")', 'UCASE("Room 12b")', 'LCASE("PD12")'].map((e) => [c(e), q(V(e))]);
assert(CASE_ROWS.map((r) => r[1]).join() === '"HAPPY","w","ROOM 12B","pd12"', 'case table');
steps.push({ id: 'case', label: 'UCASE and LCASE: Change the Case',
  content: '<h2 class="lesson-h2">UCASE and LCASE: Change the Case</h2>' +
    tps('Predict: what does UCASE("Room 12b") give? Why do the 1 and the 2 not change?',
      `<p>It gives <strong>"${V('UCASE("Room 12b")')}"</strong>.</p><p>UCASE changes small letters to capital letters. Digits and spaces have no capital, so they stay the same.</p>`, 'Show the worked answer') +
    columns(table(CASE_ROWS, ['Code', 'Result']),
      facts(['<code>UCASE(Word)</code> gives Word in <strong>upper case</strong>: capital letters.', '<code>LCASE(Word)</code> gives Word in <strong>lower case</strong>: small letters.', 'Only letters change.'])) });

const YES = ['YES', 'yes', 'Yes'].map((a) => {
  const t = (cond) => run(`IF ${cond} THEN\n  OUTPUT "Match"\nELSE\n  OUTPUT "No match"\nENDIF`, { Answer: a })[0];
  return [q(a), t('Answer = "YES"'), `<strong>${t('UCASE(Answer) = "YES"')}</strong>`];
});
assert(YES.map((r) => r[1] + '/' + r[2]).join() === 'Match/<strong>Match</strong>,No match/<strong>Match</strong>,No match/<strong>Match</strong>', 'compare-case table');
steps.push({ id: 'compare-case', label: 'Compare: "yes" and "YES"',
  content: '<h2 class="lesson-h2">Compare: "yes" and "YES"</h2>' +
    tps('The user typed yes. Why does the first condition say No match?',
      '<p>= checks every character exactly. A small y and a capital Y are different characters.</p><p>UCASE(Answer) turns yes, Yes and YES into YES first, so all three match.</p>') +
    table(YES, ['Answer typed', c('IF Answer = "YES" THEN'), c('IF UCASE(Answer) = "YES" THEN')]) +
    facts(['Users type in different ways.', 'Change the input to one case <strong>before</strong> you compare it.']) });

const SAM = { Name: 'sam' };
const STORE_B = run('DECLARE Big : STRING\nBig <- UCASE(Name)\nOUTPUT Name', SAM)[0];
const STORE_C = run('Name <- UCASE(Name)\nOUTPUT Name', SAM)[0];
assert(STORE_B === 'sam' && STORE_C === 'SAM', 'compare-store outputs');
assert(/does not store it or output it/.test(runPseudocode('UCASE(Name)\nOUTPUT Name', SAM, 5000, []).error.message), 'a bare UCASE line is rejected');
const prog = (lines) => lines.map(c).join('<br>');
steps.push({ id: 'compare-store', label: 'Compare: Store the Result',
  content: '<h2 class="lesson-h2">Compare: Store the Result</h2>' +
    tps('Programs A and B both use UCASE. Why do they still output sam?',
      '<p>UCASE gives back a <strong>new</strong> string. It does not change Name.</p><p>A throws the new string away. B stores it in Big, not in Name. Only C stores it back in Name.</p>') +
    '<p class="lesson-lead">Name holds "sam".</p>' +
    table([['A', prog(['UCASE(Name)', 'OUTPUT Name']), 'sam: the new string is lost'], ['B', prog(['Big <- UCASE(Name)', 'OUTPUT Name']), STORE_B], ['C', prog(['Name <- UCASE(Name)', 'OUTPUT Name']), `<strong>${STORE_C}</strong>`]], ['Program', 'Lines', 'Output']) +
    facts(['A string function gives back a new value.', 'Store it with &lt;-, or output it. On its own, it changes nothing.']) });

const CC = [V('UCASE("Bloomsbury")'), V('LCASE("HAT YAI")'), run('IF UCASE(Reply) = "NO" THEN\n  OUTPUT "TRUE"\nELSE\n  OUTPUT "FALSE"\nENDIF', { Reply: 'no' })[0]];
assert(CC.join() === 'BLOOMSBURY,hat yai,TRUE', 'check-case answers');
steps.push(checkStep('check-case', 'Check: UCASE and LCASE', 'Check: UCASE and LCASE', 'Capital letters matter.', [
  { label: 'UCASE("Bloomsbury")', answer: textRe(CC[0]), cs: true, feedback: 'UCASE: every letter becomes a capital letter.' },
  { label: 'LCASE("HAT YAI")', answer: textRe(CC[1]), cs: true, feedback: 'LCASE: every letter becomes a small letter. The space stays.' },
  { label: 'Reply holds "no". Is UCASE(Reply) = "NO" TRUE or FALSE?', answer: TF(CC[2]), feedback: 'Work out UCASE(Reply) first. Then compare it with "NO".' },
  { label: 'Write the line that changes Reply to upper case and stores it back in Reply.', answer: `^\\s*Reply${ARROW}${fn('UCASE', 'Reply')}\\s*$`, line: true, feedback: 'UCASE on its own changes nothing. Store the result back in Reply with &lt;-.' },
], '', ['Why does UCASE not change digits or spaces?', 'Only letters have a capital and a small form. A digit or a space has only one form.']));

// ---------------------------------------------------------------- exam questions on all four functions
const PHRASE = 'The beginning is the most important part';
const PH = run(`DECLARE Phrase : STRING\nPhrase <- "${PHRASE}"\nOUTPUT LENGTH(Phrase)\nOUTPUT UCASE(Phrase)`);
assert(PH[0] === 40 && PH[1] === 'THE BEGINNING IS THE MOST IMPORTANT PART', 'June 2023 Q8');
steps.push(selfStep('exam-phrase', 'Exam Question: Length and Upper Case (1 of 2)', 'Exam Question: Length and Upper Case (1 of 2)',
  'Cambridge IGCSE 0478/21, June 2023, Question 8(a). The function LENGTH(Phrase) calculates the length of a string Phrase.', [
    { id: 'phrase-code', prompt: 'Write the pseudocode statements to: store the string "The beginning is the most important part" in Phrase; calculate and output the length of the string; output the string in upper case.', marks: 3,
      modelAnswer: 'Phrase &lt;- "The beginning is the most important part"<br>OUTPUT LENGTH(Phrase)<br>OUTPUT UCASE(Phrase)<br>Marks for: storing the string in Phrase, using LENGTH, using UCASE, and outputting both results.' },
  ], ['This question lists three tasks. Why tick each one off as you write?', 'Each task is worth a mark. A task you forget is a mark you lose.']));
steps.push(checkStep('exam-phrase-2', 'Exam Question: Length and Upper Case (2 of 2)', 'Exam Question: Length and Upper Case (2 of 2)',
  'Cambridge IGCSE 0478/21, June 2023, Question 8(b). Write the output your pseudocode should produce.', [
    { label: 'The first line of output', answer: numRe(PH[0]), feedback: 'Count every character in the phrase, and every space.' },
    { label: 'The second line of output', answer: textRe(PH[1]), cs: true, line: true, feedback: 'UCASE changes every letter to a capital letter. Spaces stay.' },
  ], code(['Phrase <- "The beginning is the most important part"', 'OUTPUT LENGTH(Phrase)', 'OUTPUT UCASE(Phrase)']),
  ['Why does LENGTH("Hi there") give 8, not 7?', 'LENGTH counts every character. The space is a character too: 7 letters + 1 space = 8.']));

const FIND = (up) => `DECLARE P : STRING\nDECLARE Q : CHAR\nDECLARE Counter : INTEGER\nDECLARE Position : INTEGER\nP <- "The world"\nQ <- 'W'\n${up ? 'P <- UCASE(P)\n' : ''}Counter <- 1\nPosition <- 0\nWHILE Position = 0 AND Counter <= LENGTH(P) DO\n  IF SUBSTRING(P, Counter, 1) = Q THEN\n    Position <- Counter\n  ENDIF\n  Counter <- Counter + 1\nENDWHILE\nOUTPUT Position`;
const POS = run(FIND(true))[0], POS_NO = run(FIND(false))[0];
assert(POS === 5 && POS_NO === 0, 'June 2023 Q11(c): 5 with UCASE, not found without');
steps.push(checkStep('exam-world', 'Exam Question: Find the W', 'Exam Question: Find the W',
  'Cambridge IGCSE 0478/22, June 2023, Question 11(c). P stores the string "The world". Q stores the character \'W\'. An algorithm converts P to upper case, then finds the position of Q in the string P (the first character in this string is in position 1), and stores it in the variable Position.', [
    { label: 'Give the value of Position after the algorithm has been executed.', answer: numRe(POS), feedback: 'Write P in upper case first. Then count the positions, and the space counts.' },
  ], code(['P <- "The world"', "Q <- 'W'", 'P <- UCASE(P)']),
  ['Why must P be changed to upper case before the search?', 'Q is a capital W. "The world" has a small w, and = sees w and W as different, so without UCASE the W is never found.']));

const TEMP = V('UCASE(SUBSTRING(LastName, 1, 2))', { LastName: 'Hann' });
assert(TEMP === 'HA', 'June 2026 Q5(b)');
const TEMP_RE = `^\\s*Temp${ARROW}(UCASE\\s*\\(\\s*${fn('SUBSTRING', 'LastName', '[01]', '2')}\\s*\\)|${fn('SUBSTRING', `UCASE\\s*\\(\\s*LastName\\s*\\)`, '[01]', '2')})\\s*$`;
steps.push(checkStep('exam-username', 'Exam Question: Make a Username', 'Exam Question: Make a Username',
  'Cambridge IGCSE 0478/21, June 2026, Question 5(b). A system makes usernames. It takes the first letter of the first name and the first two letters of the last name, converts all the letters to upper case, and adds a random number: Muhammed Hann gets MHA492. The last name is input into the variable LastName.', [
    { label: 'Write the pseudocode to: take the first two letters from LastName; convert the letters to upper case; store the result in the variable Temp. Write it as one line.', marks: 3,
      answer: TEMP_RE, line: true, feedback: 'Put SUBSTRING inside UCASE: UCASE( SUBSTRING(...) ). Then store it in Temp with &lt;-.' },
  ], '', ['Why does the system add a random number to each username?', 'Two people can have the same letters, such as Mai Han and Mo Hann. The number makes each username different.']));

// ---------------------------------------------------------------- activity 2: write the string code (code drill)
steps.push(embed('activity-2', 'Activity 2: Write the String Code', 'drill-y11-8-1-strings-code', 'Activity 2: Write the String Code',
  'Write the program in the box. Press Run. Your program must give the same output as the model program, with a new word typed in each time.',
  ['Why is your program tested with a new word each time?', 'String code must work for any word. A new word finds a start position or a length that only fits one word.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: String Handling Drill', 'drill-y11-8-1-strings', 'Plenary: String Handling Drill',
  'LENGTH, SUBSTRING, UCASE and LCASE, and why each one gives its answer. Your progress is saved.',
  ['Why do some cards ask you to explain, not just to answer?', 'In the exam, explain questions need a reason. Saying why shows you understand it.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => { const v = validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern; return new RegExp(v.source, v.flags).test(s); };
for (const ok of ['a group of characters', 'many letters and numbers', 'more than one character', 'text, like a word or a sentence', 'A sequence of characters such as letters, digits and symbols']) assert(T('do-now-2', 0, ok), 'string desc accepts ' + ok);
for (const bad of ['a single character', 'a whole number', 'text', 'characters']) assert(!T('do-now-2', 0, bad), 'string desc rejects ' + bad);
for (const ok of ['"Cambridge2024"', 'Hello', "'Year 11'"]) assert(T('do-now-2', 1, ok), 'string example accepts ' + ok);
for (const bad of ['X', '"Y"']) assert(!T('do-now-2', 1, bad), 'string example rejects ' + bad);
for (const ok of ['a single character', 'one letter', 'Only one character, such as a letter or a symbol', '1 character']) assert(T('do-now-2', 2, ok), 'char desc accepts ' + ok);
for (const bad of ['more than one character', 'a group of characters', 'a word', 'many letters']) assert(!T('do-now-2', 2, bad), 'char desc rejects ' + bad);
for (const ok of ['X', "'Y'", '"7"', ' ? ']) assert(T('do-now-2', 3, ok), 'char example accepts ' + ok);
for (const bad of ['XY', 'Hello', '']) assert(!T('do-now-2', 3, bad), 'char example rejects ' + bad);
assert(T('check-length', 0, '8') && !T('check-length', 0, '7') && T('check-length', 1, ' 9 ') && !T('check-length', 1, '8'), 'check-length numbers');
for (const ok of ['Size <- LENGTH(Password)', 'size<-length(password)', 'Size \u2190 LENGTH( Password )']) assert(T('check-length', 2, ok), 'length line accepts ' + ok);
for (const bad of ['Size <- Password', 'LENGTH(Password) <- Size', 'Size = LENGTH(Password)', 'Size <- LENGTH(Size)']) assert(!T('check-length', 2, bad), 'length line rejects ' + bad);
for (const ok of ['Key', '"Key"', "'Key'"]) assert(T('check-sub', 0, ok), 'Key accepts ' + ok);
for (const bad of ['KEY', 'key', 'Ke', 'Keyb']) assert(!T('check-sub', 0, bad), 'Key rejects ' + bad);
assert(T('check-sub', 1, 'board') && !T('check-sub', 1, 'boa') && !T('check-sub', 1, 'Board') && T('check-sub', 2, '"d"') && !T('check-sub', 2, 'D') && !T('check-sub', 2, '8'), 'check-sub values');
for (const ok of ['Initial <- SUBSTRING(Name, 1, 1)', 'initial<-substring(name,1,1)']) assert(T('check-sub', 3, ok), 'initial accepts ' + ok);
for (const bad of ['Initial <- SUBSTRING(Name, 0, 1)', 'Initial <- SUBSTRING(Name, 1)', 'Initial <- SUBSTRING(Name, 1, 2)', 'SUBSTRING(Name, 1, 1)']) assert(!T('check-sub', 3, bad), 'initial rejects ' + bad);
for (const ok of ['OUTPUT SUBSTRING(Fact, 13, 7)', 'output substring(Fact,12,7)']) assert(T('exam-program', 0, ok), 'program accepts ' + ok);
for (const bad of ['OUTPUT SUBSTRING(Fact, 3, 7)', 'OUTPUT SUBSTRING(Fact, 13, 19)', 'OUTPUT "program"', 'SUBSTRING(Fact, 13, 7)']) assert(!T('exam-program', 0, bad), 'program rejects ' + bad);
assert(T('check-case', 0, 'BLOOMSBURY') && !T('check-case', 0, 'Bloomsbury') && T('check-case', 1, '"hat yai"') && !T('check-case', 1, 'Hat Yai') && !T('check-case', 1, 'hatyai'), 'check-case values');
assert(T('check-case', 2, 'true') && !T('check-case', 2, 'FALSE'), 'check-case TF');
for (const ok of ['Reply <- UCASE(Reply)', 'reply<-ucase(reply)']) assert(T('check-case', 3, ok), 'reply accepts ' + ok);
for (const bad of ['UCASE(Reply)', 'Reply <- LCASE(Reply)', 'UCASE(Reply) <- Reply']) assert(!T('check-case', 3, bad), 'reply rejects ' + bad);
assert(T('exam-phrase-2', 0, '40') && !T('exam-phrase-2', 0, '34') && T('exam-phrase-2', 1, 'THE BEGINNING IS THE MOST IMPORTANT PART') && T('exam-phrase-2', 1, '"THE BEGINNING IS THE MOST IMPORTANT PART"') &&
  !T('exam-phrase-2', 1, 'The beginning is the most important part'), 'exam-phrase-2');
assert(T('exam-world', 0, '5') && !T('exam-world', 0, '0') && !T('exam-world', 0, '4'), 'exam-world');
for (const ok of ['Temp <- UCASE(SUBSTRING(LastName, 1, 2))', 'temp<-ucase(substring(lastname,1,2))', 'Temp <- SUBSTRING(UCASE(LastName), 1, 2)', 'Temp <- UCASE(SUBSTRING(LastName, 0, 2))']) assert(T('exam-username', 0, ok), 'temp accepts ' + ok);
for (const bad of ['Temp <- SUBSTRING(LastName, 1, 2)', 'Temp <- UCASE(LastName)', 'UCASE(SUBSTRING(LastName, 1, 2))', 'Temp <- UCASE(SUBSTRING(LastName, 2, 1))', 'Temp <- LCASE(SUBSTRING(LastName, 1, 2))']) assert(!T('exam-username', 0, bad), 'temp rejects ' + bad);
// The walkthroughs show the method with other questions and never the Do Now answers.
{ const s = JSON.stringify(WT_TICK); assert(!/totalling|cannot change/i.test(s), 'tick walkthrough shows a Do Now answer'); }
{ const s = JSON.stringify(WT_TYPES); assert(!/single|group of|many characters|one character/i.test(s), 'type walkthrough shows a Do Now answer'); }
// No dashes anywhere in the lesson text, no game mention, and no string function before the slide that teaches it.
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'em or en dash');
assert(!/mario/i.test(all), 'game mention');
const before = (stepId, pattern, what) => {
  const at = steps.findIndex((s) => s.id === stepId);
  const early = steps.slice(0, at).filter((s) => pattern.test(JSON.stringify([s.content, s.items, s.algorithm, s.walkthrough])));
  assert(!early.length, `${what} appears before the ${stepId} slide, on ${early.map((s) => s.id).join(', ')}`);
};
before('length', /LENGTH/, 'LENGTH');
before('substring', /SUBSTRING/, 'SUBSTRING');
before('case', /UCASE|LCASE|upper case|lower case/i, 'UCASE or LCASE');

// ---------------------------------------------------------------- the three drills
// Written as plain script files: the drill page loads them with the engine and helpers already in place.
const DRILL_HEAD = String.raw`
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function word(w) { return new RegExp("^\\s*" + w + "\\s*$", "i"); }
    // A text answer: capital letters matter, quote marks are optional.
    function text(s) { return new RegExp("^\\s*[\"'\u201c\u201d\u2018\u2019]?" + s.replace(/[.*+?^${'$'}{}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+") + "[\"'\u201c\u201d\u2018\u2019]?\\s*$"); }
    function tfText(b) { return b ? "TRUE" : "FALSE"; }
    function tfCard(b) { var a = tfText(b); return { answers: [a], keywords: [word(a)], distractors: [tfText(!b)] }; }
    // Every answer comes from running the program in the site's pseudocode engine.
    function run(src, vars) {
      var r = PseudocodeEngine.runPseudocode(src, vars || {}, 5000, []);
      if (r.error) throw new Error("Line " + r.error.line + ": " + r.error.message);
      return r.outputs;
    }
    function val(expr, vars) { return run("OUTPUT " + expr, vars)[0]; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v !== n && v >= 0; }).concat([n + 1, n + 2, n + 3, n + 4]), 3); }
    function uniq(answer, list) { var out = []; list.forEach(function (d) { if (d !== answer && out.indexOf(d) === -1 && out.length < 3) out.push(d); }); return out; }
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var WORDS = ["Computer", "Keyboard", "Monitor", "Printer", "Network", "Program", "Laptop", "Science", "Speaker", "Library"];`;

const EXT = String.raw`// Year 11, 8.1 L5 Do Now Extension: 8.1 L1 to L4 (variables, constants, data types, input and output, arithmetic
// operators, relational and logical operators).
// Loaded by Drills/index.html?drill=y11-8-1-strings-ext. Written by tools/build_y11_8_1_strings.mjs: edit the builder.
// For students who finish the Do Now early: 10 questions across 8.1 so far, randomised. Every card has an ` + '`example`' + String.raw`,
// a similar question worked through with different values, then two ` + '`working`' + String.raw` nudges. An example never shows
// the card's own answer. Cambridge pseudocode, every variable declared.
DrillData.register("y11-8-1-strings-ext", {
  title: "Year 11 Extension: Variables, Data Types and Operators",
  subtitle: "8.1 L5 Do Now Extension",
  categories: [
    ["ex-vc", "Variables and Constants (8.1 L1)"],
    ["ex-types", "Data Types, Input and Output (8.1 L2)"],
    ["ex-arith", "Arithmetic Operators (8.1 L3)"],
    ["ex-ops", "Relational and Logical Operators (8.1 L4)"]
  ],
  cards: (function () {` + DRILL_HEAD + String.raw`
    function div(a, b) { return Math.trunc(a / b); }
    var ALL = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    function typeRe(t) { return new RegExp("^\\s*" + (t === "CHAR" ? "(CHAR|CHARACTER)" : t === "BOOLEAN" ? "BOOL(EAN)?" : t) + "\\s*$", "i"); }

    return [
      // ------------------------------------------------ 8.1 L1 Variables and constants
      { id: "ex-01", category: "ex-vc", randomize: function () {
          var a, b, c, r; do { a = pick(10, 20); b = pick(2, 5); c = pick(2, 4); r = val("(" + a + " - " + b + ") * " + c); } while (r === 12);
          var src = code("DECLARE Total : INTEGER", "Total <- " + a, "Total <- Total - " + b, "Total <- Total * " + c, "OUTPUT Total");
          r = run(src)[0];
          return { prompt: "What is output?\n" + src,
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a - b, a * c - b, a]),
            example: "Example: Points <- 9, then Points <- Points - 3, then Points <- Points * 2.\nLine by line: Points is 9, then 9 - 3 = 6, then 6 * 2 = 12.\nEach new line replaces the old value, so it outputs 12.",
            working: ["Write the value of Total after each line.", "Each line uses the value from the line before."],
            note: a + " - " + b + " = " + (a - b) + ", then * " + c + " = " + r + "." };
        } },
      { id: "ex-02", category: "ex-vc", prompt: "Which keyword makes a value that cannot change while the program runs?", answers: ["CONSTANT"], keywords: [/^\s*constant\s*$/i],
        distractors: ["DECLARE", "INPUT", "OUTPUT"],
        example: "Example: which keyword takes a value from the user?\nLook at what each keyword does: DECLARE makes a variable, INPUT takes a value from the user, OUTPUT shows a value.\nSo the answer to the example is INPUT.",
        working: ["A variable can change. This value cannot.", "It is the opposite of a variable. Which keyword makes one?"],
        note: "CONSTANT makes a value that cannot change, for example CONSTANT Pi <- 3.142." },
      // ------------------------------------------------ 8.1 L2 Data types, input and output
      { id: "ex-03", category: "ex-types", randomize: function () {
          var t = drillPick([["the number of pupils in a class", "INTEGER", "a whole number"], ["the price of a drink, such as 1.25", "REAL", "a number with a decimal point"],
            ["one letter, such as 'Y' or 'N'", "CHAR", "one character"], ["a pupil's full name", "STRING", "many characters"], ["whether a light is on", "BOOLEAN", "only TRUE or FALSE"]]);
          var ex = t[1] === "BOOLEAN" ? ["a height in metres, such as 1.65", "REAL", "a number with a decimal point"] : ["whether a door is locked", "BOOLEAN", "only TRUE or FALSE"];
          return { prompt: "Which data type is best for " + t[0] + "?",
            answers: [t[1]], keywords: [typeRe(t[1])], distractors: ALL.filter(function (x) { return x !== t[1]; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3),
            example: "Example: which data type is best for " + ex[0] + "?\nIt is " + ex[2] + ", so it is " + ex[1] + ".\nAsk in order: only TRUE or FALSE? A number? A decimal point? One character or many?",
            working: ["Is it only TRUE or FALSE? Is it a number? Does it have a decimal point?", "If it is text: one character, or many?"],
            note: t[1] + ": " + t[2] + "." };
        } },
      { id: "ex-04", category: "ex-types", randomize: function () {
          var v = drillPick([["Count", "INTEGER", "a whole number"], ["Cost", "REAL", "a number with a decimal point"], ["Grade", "CHAR", "one character"], ["Town", "STRING", "a word"]]);
          var ex = ["Found", "BOOLEAN", "TRUE or FALSE"];
          var tsrc = typeRe(v[1]).source.replace(/^\^\\s\*|\\s\*\$$/g, "");
          return { prompt: "Write the line that declares a variable called " + v[0] + " that stores " + v[2] + ".",
            answers: ["DECLARE " + v[0] + " : " + v[1]], keywords: [new RegExp("^\\s*DECLARE\\s+" + v[0] + "\\s*:\\s*" + tsrc + "\\s*$", "i")],
            distractors: ALL.filter(function (x) { return x !== v[1]; }).slice(0, 3).map(function (t) { return "DECLARE " + v[0] + " : " + t; }), format: "Type the whole line",
            example: "Example: declare a variable called " + ex[0] + " that stores " + ex[2] + ".\nStart with DECLARE, then the name, then a colon, then the data type:\nDECLARE " + ex[0] + " : " + ex[1],
            working: ["DECLARE, the name, a colon, then the data type.", "Which data type stores " + v[2] + "?"],
            note: "DECLARE " + v[0] + " : " + v[1] };
        } },
      // ------------------------------------------------ 8.1 L3 Arithmetic operators
      { id: "ex-05", category: "ex-arith", randomize: function () {
          var a = drillPick([2, 3, 5, 6]), b = a === 2 ? drillPick([3, 4, 5]) : 2, r = val(a + " ^ " + b);
          return { prompt: "What is " + a + " ^ " + b + "?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a * b, a + b, r + a]),
            example: "Example: 7 ^ 3. ^ means raised to the power of.\nWrite 7 three times and multiply: 7 * 7 * 7.\n7 * 7 = 49, then 49 * 7 = 343.",
            working: ["^ means raised to the power of.", "Write " + a + " " + b + " times, with * between each one."],
            note: a + " ^ " + b + " = " + r + "." };
        } },
      { id: "ex-06", category: "ex-arith", randomize: function () {
          var b = pick(3, 8), a, r;
          do { a = pick(13, 50); r = div(a, b); } while (a % b === 0 || r === 3);
          r = val("DIV(" + a + ", " + b + ")");
          return { prompt: "What does DIV(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a % b, r + 1, b]),
            example: "Example: DIV(17, 5). How many full groups of 5 fit into 17?\n5, 10, 15 fit. 20 is too many. That is 3 full groups.\nDIV gives the quotient, so the example returns 3.",
            working: ["DIV: how many full groups of " + b + " fit into " + a + "?", "Count up in " + b + "s without going past " + a + "."],
            note: "DIV(" + a + ", " + b + ") = " + r + ": " + r + " full groups of " + b + "." };
        } },
      { id: "ex-07", category: "ex-arith", randomize: function () {
          var b = pick(3, 8), a, r;
          do { a = pick(13, 50); r = a % b; } while (a % b === 0 || r === 2);
          r = val("MOD(" + a + ", " + b + ")");
          return { prompt: "What does MOD(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [div(a, b), r + 1, b]),
            example: "Example: MOD(17, 5). The full groups of 5 make 15.\n17 - 15 = 2 left over.\nMOD gives the remainder, so the example returns 2.",
            working: ["Find the full groups of " + b + " that fit into " + a + ".", "Take them away from " + a + ". What is left over?"],
            note: a + " - " + (div(a, b) * b) + " = " + r + " left over." };
        } },
      // ------------------------------------------------ 8.1 L4 Relational and logical operators
      { id: "ex-08", category: "ex-ops", randomize: function () {
          var n = drillPick([18, 40, 50, 60]), op = drillPick([">", ">="]), v = drillPick([n - 1, n, n, n + 1]);
          var r = run(code("IF Mark " + op + " " + n + " THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { Mark: v })[0];
          var c = tfCard(r);
          c.prompt = "Mark is " + v + ". Is the condition Mark " + op + " " + n + " TRUE or FALSE?";
          c.example = "Example: Age is 12. Is Age >= 12 TRUE or FALSE?\n>= means greater than or equal to. 12 is equal to 12, so it counts.\nWith > instead, 12 is not greater than 12, so the answer would change.";
          c.working = [op + (op === ">" ? " means greater than." : " means greater than or equal to."), "Is " + v + " " + (op === ">" ? "greater than " : "greater than or equal to ") + n + "?"];
          c.note = v + " " + op + " " + n + " is " + tfText(r) + ".";
          return c;
        } },
      { id: "ex-09", category: "ex-ops", randomize: function () {
          var x = pick(1, 12), join = drillPick(["AND", "OR"]), lo = pick(3, 5), hi = pick(8, 10);
          var cond = join === "AND" ? "X > " + lo + " AND X < " + hi : "X < " + lo + " OR X > " + hi;
          var r = run(code("IF " + cond + " THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { X: x })[0];
          var c = tfCard(r);
          c.prompt = "X is " + x + ". Is the condition " + cond + " TRUE or FALSE?";
          c.example = "Example: Y is 4. Is Y > 2 AND Y < 3 TRUE or FALSE?\nWork out each side first: Y > 2 is TRUE, Y < 3 is FALSE.\nAND needs both sides, OR needs at least one. Here AND gives FALSE.";
          c.working = ["Work out each side of " + join + " on its own first.", join === "AND" ? "AND is TRUE only when both sides are TRUE." : "OR is TRUE when at least one side is TRUE."];
          c.note = cond + " is " + tfText(r) + " when X is " + x + ".";
          return c;
        } },
      { id: "ex-10", category: "ex-ops", randomize: function () {
          var v = drillPick([["Mark", 50], ["Score", 40], ["Points", 70], ["Height", 120]]), n = v[1], name = v[0];
          var ans = name + " >= " + n;
          return { prompt: "Write the condition: " + name + " is " + n + " or more.",
            answers: [ans], keywords: [new RegExp("^\\s*(" + name + "\\s*>=\\s*" + n + "|" + n + "\\s*<=\\s*" + name + "|" + name + "\\s*>\\s*" + (n - 1) + ")\\s*$", "i")],
            distractors: [name + " > " + n, name + " <= " + n, name + " = " + n], format: "Type the condition",
            example: "Example: Age is 16 or more.\n\"Or more\" includes 16 itself, so use >=, greater than or equal to.\nThe example is written Age >= 16.",
            working: ["\"Or more\" includes the number itself.", "Which operator means greater than or equal to?"],
            note: name + " >= " + n + " is TRUE for " + n + " and every value above it." };
        } }
    ];
  })()
});
`;

const CODE = String.raw`// Year 11, 8.1 L5: String Handling (Activity 2: write the string code)
// Loaded by Drills/index.html?drill=y11-8-1-strings-code. Written by tools/build_y11_8_1_strings.mjs: edit the builder.
// Code cards: the student writes Cambridge pseudocode, which runs against the model program with a new word typed in
// on every card (` + '`inputs`' + String.raw`), so a start position or a length that only fits one word does not keep passing.
DrillData.register("y11-8-1-strings-code", {
  title: "Year 11, 8.1 L5: Write the String Code",
  subtitle: "Use LENGTH, SUBSTRING, UCASE and LCASE in your own programs",
  codeDrill: true,
  categories: [
    ["code-len", "LENGTH"],
    ["code-sub", "SUBSTRING"],
    ["code-case", "UCASE and LCASE"],
    ["code-both", "Put Them Together"]
  ],
  cards: (function () {
    var WORDS = ["Computer", "Keyboard", "Monitor", "Printer", "Network", "Program", "Laptop", "Science", "Speaker", "Library", "Mouse", "Byte"];
    var PASSWORDS = ["cat2024", "sunshine", "pass", "Bangkok99", "hatyai", "tiger12345", "abc", "letmein"];
    var REPLIES = ["yes", "YES", "Yes", "yEs", "no", "No", "maybe"];
    var NAMES = ["Hann", "smith", "Khan", "LEE", "nguyen", "Patel", "wong"];
    function one(list) { return function () { return [drillPick(list)]; }; }
    return [
      { id: "code-len-1", category: "code-len",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output the number of characters in Word.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT LENGTH(Word)",
        checkVars: [], checkOutput: true },
      { id: "code-len-2", category: "code-len",
        prompt: "A password is typed in. Declare Password (STRING) and input it. If it has fewer than 8 characters, output \"Too short\". Otherwise output \"OK\".",
        inputs: one(PASSWORDS), setup: {},
        reference: "DECLARE Password : STRING\nINPUT Password\nIF LENGTH(Password) < 8 THEN\n  OUTPUT \"Too short\"\nELSE\n  OUTPUT \"OK\"\nENDIF",
        checkVars: [], checkOutput: true },
      { id: "code-sub-1", category: "code-sub",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output its first three letters.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT SUBSTRING(Word, 1, 3)",
        checkVars: [], checkOutput: true },
      { id: "code-sub-2", category: "code-sub",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output its last letter. It must work for a word of any length.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT SUBSTRING(Word, LENGTH(Word), 1)",
        checkVars: [], checkOutput: true },
      { id: "code-case-1", category: "code-case",
        prompt: "A name is typed in. Declare Name (STRING) and input it. Change Name to upper case and store it back in Name. Then output Name.",
        inputs: one(NAMES), setup: {},
        reference: "DECLARE Name : STRING\nINPUT Name\nName <- UCASE(Name)\nOUTPUT Name",
        checkVars: ["Name"], checkOutput: true },
      { id: "code-case-2", category: "code-case",
        prompt: "A reply is typed in. Declare Reply (STRING) and input it. If the reply is yes, typed in any case, output \"Welcome\". Otherwise output \"Goodbye\".",
        inputs: one(REPLIES), setup: {},
        reference: "DECLARE Reply : STRING\nINPUT Reply\nIF UCASE(Reply) = \"YES\" THEN\n  OUTPUT \"Welcome\"\nELSE\n  OUTPUT \"Goodbye\"\nENDIF",
        checkVars: [], checkOutput: true },
      { id: "code-both-1", category: "code-both",
        prompt: "A last name is typed in. Declare LastName and Temp (both STRING) and input LastName. Store the first two letters of LastName, in upper case, in Temp. Output Temp.",
        inputs: one(NAMES), setup: {},
        reference: "DECLARE LastName : STRING\nDECLARE Temp : STRING\nINPUT LastName\nTemp <- UCASE(SUBSTRING(LastName, 1, 2))\nOUTPUT Temp",
        checkVars: ["Temp"], checkOutput: true },
      { id: "code-both-2", category: "code-both",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output the number of characters in Word. Then output Word in lower case.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT LENGTH(Word)\nOUTPUT LCASE(Word)",
        checkVars: [], checkOutput: true }
    ];
  })()
});
`;

const PLEN = String.raw`// Year 11, 8.1 L5: String Handling (Plenary)
// Loaded by Drills/index.html?drill=y11-8-1-strings. Written by tools/build_y11_8_1_strings.mjs: edit the builder.
// LENGTH, SUBSTRING (first character at position 1, the third value is how many), UCASE and LCASE, and why each
// gives its answer. Words are drawn fresh; every answer comes from running it in shared/pseudocode-engine.js. Text
// answers keep their case: a card that turns "yes" into "YES" must not accept "yes".
DrillData.register("y11-8-1-strings", {
  title: "Year 11, 8.1 L5: String Handling",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["st-len", "LENGTH"],
    ["st-sub", "SUBSTRING"],
    ["st-case", "UCASE and LCASE"],
    ["st-why", "Why It Works"]
  ],
  cards: (function () {` + DRILL_HEAD + String.raw`
    var PHRASES = ["Hat Yai", "Big Data", "Hello World", "Year 11", "Thai Food", "Main Hall"];
    function sentence(re1, re2, not) { return new RegExp("^" + (not ? "(?!.*\\b(" + not + ")\\b)" : "") + "(?=.*\\b(" + re1 + ")\\b)(?=.*\\b(" + re2 + ")\\b)", "i"); }

    return [
      // ------------------------------------------------ LENGTH
      { id: "len-01", category: "st-len", randomize: function () {
          var w = drillPick(WORDS), n = val("LENGTH(\"" + w + "\")");
          return { prompt: "What does LENGTH(\"" + w + "\") return?", answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - 1, n + 1, n - 2]),
            working: ["Count every character, one at a time.", "LENGTH gives a number: how many characters."],
            note: "\"" + w + "\" has " + n + " characters." };
        } },
      { id: "len-02", category: "st-len", randomize: function () {
          var p = drillPick(PHRASES), n = val("LENGTH(\"" + p + "\")");
          return { prompt: "What does LENGTH(\"" + p + "\") return?", answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - 1, n + 1, n - 2]),
            working: ["Count the letters and the digits.", "A space is a character too."],
            note: "\"" + p + "\" has " + n + " characters, and the space is one of them." };
        } },
      { id: "len-03", category: "st-len", randomize: function () {
          var w = drillPick(WORDS), k = pick(1, 5);
          var src = code("DECLARE Word : STRING", "DECLARE Size : INTEGER", "Word <- \"" + w + "\"", "Size <- LENGTH(Word) + " + k, "OUTPUT Size");
          var r = run(src)[0];
          return { prompt: "What is output?\n" + src, answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [r - k, r + 1, k]),
            working: ["Work out LENGTH(Word) first.", "Then add " + k + "."],
            note: "LENGTH(Word) is " + (r - k) + ", and " + (r - k) + " + " + k + " = " + r + "." };
        } },
      { id: "len-04", category: "st-len", randomize: function () {
          var v = drillPick([["Password", "Size"], ["Name", "Letters"], ["Code", "CodeLength"]]), ans = v[1] + " <- LENGTH(" + v[0] + ")";
          return { prompt: "Write the line that stores the number of characters in " + v[0] + " in the variable " + v[1] + ".",
            answers: [ans], keywords: [new RegExp("^\\s*" + v[1] + ARROW + "LENGTH\\s*\\(\\s*" + v[0] + "\\s*\\)\\s*$", "i")],
            distractors: [v[1] + " <- " + v[0], "LENGTH(" + v[0] + ") <- " + v[1], v[1] + " <- LENGTH(" + v[1] + ")"], format: "Type the whole line",
            example: "Example: store the number of characters in Town in the variable Count.\nThe variable comes first, then <-, then the function:\nCount <- LENGTH(Town)",
            working: ["The variable that stores the result comes first, then <-.", "LENGTH needs the string inside its brackets."],
            note: ans };
        } },
      { id: "len-05", category: "st-len", randomize: function () {
          var codeV = drillPick(["A7X2", "B12", "Z9QK", "M4", "K3PZ1", "QR77"]), r = run(code("IF LENGTH(Code) = 4 THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { Code: codeV })[0];
          var c = tfCard(r);
          c.prompt = "Code holds \"" + codeV + "\". Is the condition LENGTH(Code) = 4 TRUE or FALSE?";
          c.working = ["Work out LENGTH(Code) first: count the characters.", "Then ask: is that number equal to 4?"];
          c.note = "LENGTH(Code) is " + codeV.length + ", so LENGTH(Code) = 4 is " + tfText(r) + ".";
          return c;
        } },
      // ------------------------------------------------ SUBSTRING
      { id: "sub-01", category: "st-sub", randomize: function () {
          var w = drillPick(WORDS), k = pick(2, 4), r = val("SUBSTRING(\"" + w + "\", 1, " + k + ")");
          return { prompt: "What does SUBSTRING(\"" + w + "\", 1, " + k + ") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.substr(1, k), w.substr(0, k + 1), w.substr(0, k - 1), r.toUpperCase()]), format: "Type the text: capital letters matter",
            working: ["Position 1 is the first character.", "The third value says how many characters to take."],
            note: "Start at position 1 and take " + k + " characters: " + r + "." };
        } },
      { id: "sub-02", category: "st-sub", randomize: function () {
          var w, s, n; do { w = drillPick(WORDS); s = pick(2, 3); n = pick(3, 5); } while (s + n - 1 > w.length || n <= s);
          var r = val("SUBSTRING(\"" + w + "\", " + s + ", " + n + ")");
          return { prompt: "What does SUBSTRING(\"" + w + "\", " + s + ", " + n + ") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.substr(s - 1, n - s + 1), w.substr(s, n), w.substr(s - 1, n - 1)]), format: "Type the text: capital letters matter",
            working: ["Start at position " + s + ". Number the characters from 1 to find it.", "Then take " + n + " characters: " + n + " is how many, not where to stop."],
            note: "Start at position " + s + ", take " + n + " characters: " + r + "." };
        } },
      { id: "sub-03", category: "st-sub", randomize: function () {
          var w = drillPick(WORDS), r = val("SUBSTRING(Word, LENGTH(Word), 1)", { Word: w });
          return { prompt: "Word holds \"" + w + "\". What does SUBSTRING(Word, LENGTH(Word), 1) return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.charAt(0), w.charAt(w.length - 2), String(w.length), r.toUpperCase()]), format: "Type the text: capital letters matter",
            working: ["Work out LENGTH(Word) first. That is the start position.", "Then take 1 character from there."],
            note: "LENGTH(Word) is " + w.length + ", the position of the last character: " + r + "." };
        } },
      { id: "sub-04", category: "st-sub", randomize: function () {
          var v = drillPick([["Name", "Initial", 1, "first letter"], ["Postcode", "Area", 2, "first two characters"], ["Code", "Prefix", 3, "first three characters"]]);
          var ans = v[1] + " <- SUBSTRING(" + v[0] + ", 1, " + v[2] + ")";
          return { prompt: "Write the line that stores the " + v[3] + " of " + v[0] + " in the variable " + v[1] + ".",
            answers: [ans], keywords: [new RegExp("^\\s*" + v[1] + ARROW + "SUBSTRING\\s*\\(\\s*" + v[0] + "\\s*,\\s*1\\s*,\\s*" + v[2] + "\\s*\\)\\s*$", "i")],
            distractors: [v[1] + " <- SUBSTRING(" + v[0] + ", 0, " + v[2] + ")", v[1] + " <- SUBSTRING(" + v[0] + ", 2, " + v[2] + ")", v[1] + " <- SUBSTRING(" + v[0] + ", 1, " + (v[2] + 1) + ")"], format: "Type the whole line",
            example: "Example: store the first four characters of Phone in the variable Start.\nStart at position 1 and take 4 characters:\nStart <- SUBSTRING(Phone, 1, 4)",
            working: ["SUBSTRING needs the string, where to start, and how many characters.", "The first character is position 1."],
            note: ans };
        } },
      { id: "sub-05", category: "st-sub", randomize: function () {
          var w = drillPick(WORDS);
          var src = code("DECLARE Word : STRING", "Word <- \"" + w + "\"", "OUTPUT SUBSTRING(Word, LENGTH(Word) - 2, 3)");
          var r = run(src)[0];
          return { prompt: "What is output?\n" + src, answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.substr(w.length - 2, 2), w.substr(w.length - 4, 3), w.substr(0, 3)]), format: "Type the text: capital letters matter",
            working: ["Work out LENGTH(Word) - 2 first. That is the start position.", "Then take 3 characters from there."],
            note: "LENGTH(Word) - 2 is " + (w.length - 2) + ". Three characters from there are the last three: " + r + "." };
        } },
      { id: "sub-06", category: "st-sub", randomize: function () {
          var p = drillPick(PHRASES.filter(function (x) { return x !== "Year 11"; })), sp = p.indexOf(" "), ch = p.charAt(sp + 1), pos = sp + 2;
          var r = run(code("DECLARE Phrase : STRING", "Phrase <- \"" + p + "\"", "OUTPUT SUBSTRING(Phrase, " + pos + ", 1)"))[0];
          if (r !== ch) throw new Error("sub-06 position");
          return { prompt: "Phrase holds \"" + p + "\". At what position is the " + ch + "?", answers: [String(pos)], keywords: [drillNumberRe(pos)], distractors: others(pos, [pos - 1, pos + 1, pos - 2]),
            working: ["Number the characters from 1.", "The space has a position too."],
            note: "The space is position " + (sp + 1) + ", so the " + ch + " is position " + pos + "." };
        } },
      // ------------------------------------------------ UCASE and LCASE
      { id: "case-01", category: "st-case", randomize: function () {
          var w = drillPick(["Happy", "Bangkok", "Room 12b", "Hat Yai", "Science", "Year 11"]), r = val("UCASE(\"" + w + "\")");
          return { prompt: "What does UCASE(\"" + w + "\") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [r.toLowerCase(), w, r.charAt(0) + r.slice(1).toLowerCase()]), format: "Type the text: capital letters matter",
            working: ["UCASE changes small letters to capital letters.", "Digits and spaces stay the same."],
            note: "UCASE(\"" + w + "\") is \"" + r + "\"." };
        } },
      { id: "case-02", category: "st-case", randomize: function () {
          var w = drillPick(["PD12", "HELLO", "Hat Yai", "CODE 7", "Monday", "ICT"]), r = val("LCASE(\"" + w + "\")");
          return { prompt: "What does LCASE(\"" + w + "\") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [r.toUpperCase(), r.charAt(0).toUpperCase() + r.slice(1), w === r ? r.toUpperCase() : w]), format: "Type the text: capital letters matter",
            working: ["LCASE changes capital letters to small letters.", "Digits and spaces stay the same."],
            note: "LCASE(\"" + w + "\") is \"" + r + "\"." };
        } },
      { id: "case-03", category: "st-case", randomize: function () {
          var a = drillPick(["yes", "Yes", "YES", "yEs"]), up = Math.random() < 0.5;
          var cond = up ? "UCASE(Answer) = \"YES\"" : "Answer = \"YES\"";
          var r = run(code("IF " + cond + " THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { Answer: a })[0];
          var c = tfCard(r);
          c.prompt = "Answer holds \"" + a + "\". Is the condition " + cond + " TRUE or FALSE?";
          c.working = [up ? "Work out UCASE(Answer) first." : "= checks every character, and capital letters matter.", "Then compare it with \"YES\", character by character."];
          c.note = up ? "UCASE(Answer) is \"YES\", so the condition is TRUE." : "\"" + a + "\" = \"YES\" is " + tfText(r) + ": = checks the case of every letter.";
          return c;
        } },
      { id: "case-04", category: "st-case", randomize: function () {
          var n = drillPick(["sam", "mia", "leo", "omar", "zara", "ivy"]);
          var src = code("DECLARE Name : STRING", "DECLARE Big : STRING", "Name <- \"" + n + "\"", "Big <- UCASE(Name)", "OUTPUT Name");
          var r = run(src)[0];
          return { prompt: "What is output?\n" + src, answers: [r], keywords: [text(r)],
            distractors: uniq(r, [n.toUpperCase(), n.charAt(0).toUpperCase() + n.slice(1), "Big"]), format: "Type the text: capital letters matter",
            working: ["Which variable does OUTPUT show?", "Did any line store a new value in Name?"],
            note: "UCASE(Name) went into Big. Name still holds \"" + r + "\"." };
        } },
      { id: "case-05", category: "st-case", randomize: function () {
          var v = drillPick([["Reply", "UCASE", "upper"], ["Town", "UCASE", "upper"], ["Email", "LCASE", "lower"], ["Answer", "LCASE", "lower"]]), ans = v[0] + " <- " + v[1] + "(" + v[0] + ")";
          var other = v[1] === "UCASE" ? "LCASE" : "UCASE";
          return { prompt: "Write the line that changes " + v[0] + " to " + v[2] + " case and stores it back in " + v[0] + ".",
            answers: [ans], keywords: [new RegExp("^\\s*" + v[0] + ARROW + v[1] + "\\s*\\(\\s*" + v[0] + "\\s*\\)\\s*$", "i")],
            distractors: [v[1] + "(" + v[0] + ")", v[0] + " <- " + other + "(" + v[0] + ")", v[1] + "(" + v[0] + ") <- " + v[0]], format: "Type the whole line",
            example: "Example: change Code to lower case and keep it in Code.\nThe function gives back a new string, so store it back with <-:\nCode <- LCASE(Code)",
            working: ["On its own, the function changes nothing.", "Store the result back in " + v[0] + " with <-."],
            note: ans };
        } },
      { id: "case-06", category: "st-case", randomize: function () {
          var ans = "UCASE(Answer) = \"YES\"";
          // Names in any case; the word in quotes must be in the case the function makes.
          function ci(s) { return s.replace(/[a-z]/gi, function (ch) { return "[" + ch.toUpperCase() + ch.toLowerCase() + "]"; }); }
          var Q = "[\"'\u201c\u201d]", call = function (f) { return ci(f) + "\\s*\\(\\s*" + ci("Answer") + "\\s*\\)"; };
          var up = call("UCASE") + "\\s*=\\s*" + Q + "YES" + Q, lo = call("LCASE") + "\\s*=\\s*" + Q + "yes" + Q;
          var upR = Q + "YES" + Q + "\\s*=\\s*" + call("UCASE"), loR = Q + "yes" + Q + "\\s*=\\s*" + call("LCASE");
          return { prompt: "Write the condition that is TRUE when Answer holds yes, typed in any mix of capital and small letters.",
            answers: [ans], keywords: [new RegExp("^\\s*(" + up + "|" + lo + "|" + upR + "|" + loR + ")\\s*$")],
            distractors: ["Answer = \"YES\"", "UCASE(Answer) = \"yes\"", "Answer = \"yes\""], format: "Type the condition",
            example: "Example: TRUE when Town holds rome, in any case.\nChange Town to one case first, then compare it with the same word in that case:\nUCASE(Town) = \"ROME\"",
            working: ["Change Answer to one case first.", "Compare it with yes written in that same case."],
            note: "UCASE(Answer) = \"YES\" is TRUE for yes, Yes and YES. LCASE(Answer) = \"yes\" works too." };
        } },
      // ------------------------------------------------ Why it works (two connected ideas each)
      { id: "why-01", category: "st-why", prompt: "Why does SUBSTRING(\"Computer\", 1, 3) give \"Com\"?",
        answers: ["It starts at position 1 and takes 3 characters."],
        keywords: [sentence("start|starts|starting|begin|begins|first|position 1", "3 characters|three characters|3 letters|three letters|how many|3 long|three long|takes 3|takes three|length")],
        distractors: ["It starts at position 0 and stops at position 3.", "It counts back 3 characters from the end.", "Position 3 is where SUBSTRING stops taking letters."],
        working: ["What does the 1 tell SUBSTRING?", "What does the 3 tell SUBSTRING?"],
        note: "1 is where to start, and the first character is position 1. 3 is how many characters to take." },
      { id: "why-02", category: "st-why", prompt: "Why does a program check UCASE(Answer) = \"YES\" and not Answer = \"YES\"?",
        answers: ["Users type yes in any case, and = checks the case exactly."],
        keywords: [sentence("case|capital|capitals|upper|lower|small|yes", "same|exact|exactly|match|matches|different|any|every|all|whatever")],
        distractors: ["UCASE makes the comparison run faster than =.", "= cannot compare two strings without UCASE first.", "YES is a keyword, so it must be written in capitals."],
        working: ["The user might type yes, Yes or YES.", "Does = see y and Y as the same character?"],
        note: "= checks every character exactly, so yes and YES are different. UCASE changes the input to one case first." },
      { id: "why-03", category: "st-why", prompt: "After Big <- UCASE(Name), why does Name still hold small letters?",
        answers: ["UCASE gives back a new string, which is stored in Big."],
        keywords: [sentence("new|copy|returns|return|gives|result|value", "stored|store|stores|saved|put|goes|went|assigned|Big")],
        distractors: ["UCASE only works on a CHAR, and Name is a STRING.", "Name is a constant, so its value cannot be changed.", "Big must be declared before UCASE can change Name."],
        working: ["Does UCASE change the variable inside its brackets?", "Which variable does the arrow store the result in?"],
        note: "UCASE gives back a new string. The line stores it in Big, so Name does not change." },
      { id: "why-04", category: "st-why", prompt: "Why does FOR Count <- 1 TO LENGTH(Word) reach the last character of any word?",
        answers: ["LENGTH(Word) is the position of the last character."],
        keywords: [sentence("last|end|final", "length|characters|position|any|every|size|long")],
        distractors: ["The loop always runs 10 times, enough for most words.", "LENGTH starts the loop at position 0 of the word.", "LENGTH changes Word so that every word is 10 long."],
        working: ["How many characters does LENGTH(Word) count?", "Which position holds the last character?"],
        note: "The last character is at position LENGTH(Word), so the loop ends on it whatever the word is." },
      { id: "why-05", category: "st-why", prompt: "Why is LENGTH(\"Hat Yai\") 7 and not 6?",
        answers: ["The space is a character, so LENGTH counts it too."],
        keywords: [sentence("space|spaces|gap", "character|characters|counted|count|counts|counting")],
        distractors: ["LENGTH counts from 0, so it always adds one more.", "Capital letters count twice in the LENGTH function.", "LENGTH adds 1 at the end of every string it reads."],
        working: ["Count the letters: H, a, t, Y, a, i.", "What else is between the two words?"],
        note: "H, a, t, space, Y, a, i: the space is one of the 7 characters." }
    ];
  })()
});
`;

// Each drill must parse, and every card must draw cleanly; check-site then grades them all.
const vm = await import('node:vm');
const engineSrc = fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8');
const helpersSrc = fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8');
for (const [name, src] of [['y11-8-1-strings-ext', EXT], ['y11-8-1-strings-code', CODE], ['y11-8-1-strings', PLEN]]) {
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), name + ': em or en dash');
  const ctx = { window: {}, console };
  ctx.global = ctx; ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(engineSrc, ctx);
  vm.runInContext(helpersSrc, ctx);
  let drill = null;
  ctx.DrillData = { register: (id, d) => { assert(id === name, 'registered id ' + id); drill = d; } };
  vm.runInContext(src, ctx);
  assert(drill && drill.cards.length, name + ' has cards');
  for (const card of drill.cards) {
    if (card.reference) {
      for (let i = 0; i < 20; i++) {
        const r = ctx.PseudocodeEngine.runPseudocode(card.reference, {}, 5000, card.inputs ? card.inputs({}) : []);
        assert(!r.error, `${name} ${card.id}: ${r.error && r.error.message}`);
      }
    }
    if (card.randomize) for (let i = 0; i < 60; i++) {
      const d = card.randomize();
      assert(d.answers && d.answers.length && d.distractors.length >= (/^(TRUE|FALSE)$/.test(d.answers[0]) ? 1 : 2), `${name} ${card.id} draw`);
      const k = (d.keywords || card.keywords || []).filter((x) => x && typeof x.test === "function");
      if (k.length) {
        assert(k.some((x) => x.test(d.answers[0])), `${name} ${card.id}: answer ${d.answers[0]} fails its keyword`);
        for (const w of d.distractors) assert(!k.some((x) => x.test(w)), `${name} ${card.id}: distractor ${w} passes for ${d.answers[0]}`);
      }
    }
  }
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', name + '.js'), src.replace(/^\n/, ''));
  console.log(`${name}: ${drill.cards.length} cards`);
}

const lesson = { id: ID, label: '8.1 L5: String Handling', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it as 8.1 L5, after y11-8-1-ops. A small text insert: lessons.json is shared, so it is never rewritten.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
if (!raw.includes(`"${ID}"`)) {
  const m = raw.match(/([ \t]*)"y11-8-1-ops"(\r?\n)/);
  assert(m, 'y11-8-1-ops is in lessons.json');
  const at = m.index + m[0].length - m[2].length;
  fs.writeFileSync(lp, raw.slice(0, at) + ',' + m[2] + m[1] + `"${ID}"` + raw.slice(at));
}
const unit = JSON.parse(fs.readFileSync(lp, 'utf8')).years.find((y) => y.id === 'year11').units.find((u) => u.code === '8.1');
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 8.1 is now ${unit.lessons.join(', ')}`);
