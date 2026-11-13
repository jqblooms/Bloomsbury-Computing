// Builds LessonData/y9-2-5-strings.json: Year 9, 2.5 String Manipulation, its two drills (Drills/data/y9-2-5-code.js
// and y9-2-5-strings.js), and registers the lesson in the Year 9 "Algorithm Design and Text Programming" unit after 2.4.
//   node tools/build_y9_2_5.mjs
// Objectives (plan 2.5): use length operations; use upper and lower case operations in text-based programs; develop
// programs that manipulate string data (9P.05). Cambridge pseudocode LENGTH, UCASE and LCASE (SUBSTRING is not
// taught here). Only what Year 9 has met otherwise: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT,
// IF ... THEN ... ELSE ... ENDIF (THEN on the IF line). Every program on a slide is run in shared/pseudocode-engine.js.
// The Extension reuses the 2.4 plenary drill (binary search, the topic just before). Activities: String Lab (pages
// StringLab/, registry string-lab) predict and check, then the y9-2-5-code drill.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-2-5-strings';
const P = 'y9l25';
const A = '&larr;';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const re = (source, flags = 'i') => ({ __regex: true, source, flags });
const esc = (s) => s.replace(/&(?!(larr|nbsp|amp|lt|gt);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function codeBlock(lines, numbered = false) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = esc(l.trim()).replace(/&lt;-/g, A);
    const n = numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : '';
    return '<div class="lesson-code-line">' + n + '&nbsp;'.repeat(lead) + text + '</div>';
  }).join('') + '</div>';
}
const label = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const cell = 'padding:4px 8px;text-align:center;font:700 16px var(--font-mono, monospace)';
// A list drawn as Index above Value (Do Now), and a string drawn as Position above Character.
function listPic(values, opt = {}) {
  return '<table class="donow-table" style="margin:0 0 4px"><tr><th style="' + cell + ';text-align:left;font-size:13px">Index</th>' +
    values.map((v, k) => `<td style="${cell};color:var(--muted);font-size:13px">${k + 1}</td>`).join('') + '</tr><tr><th style="' + cell + ';text-align:left;font-size:13px">Value</th>' +
    values.map((v, k) => `<td style="${cell}${opt.hl && opt.hl.includes(k + 1) ? ';background:var(--brand-soft);outline:2px solid var(--brand)' : ''}">${v}</td>`).join('') + '</tr></table>';
}
function charPic(s, title = '') {
  return (title ? `<p style="margin:0 0 4px"><strong>${title}</strong></p>` : '') + '<table class="donow-table" style="margin:0 0 4px"><tr><th style="' + cell + ';text-align:left;font-size:13px">Position</th>' +
    s.split('').map((c, k) => `<td style="${cell};color:var(--muted);font-size:13px">${k + 1}</td>`).join('') + '</tr><tr><th style="' + cell + ';text-align:left;font-size:13px">Character</th>' +
    s.split('').map((c) => `<td style="${cell}${c === ' ' ? ';background:var(--warn-soft)' : ''}">${c === ' ' ? '&nbsp;' : esc(c)}</td>`).join('') + '</tr></table>';
}
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%">' +
  '<tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';

function run(lines, inputs = [], arrays = {}) {
  const src = lines.slice();
  for (const [name, vals] of Object.entries(arrays)) {
    const at = src.findIndex((l) => new RegExp(`^\\s*DECLARE\\s+${name}\\s*:\\s*ARRAY`).test(l));
    src.splice(at + 1, 0, ...vals.map((v, i) => `${name}[${i + 1}] <- ${typeof v === 'string' ? '"' + v + '"' : v}`));
  }
  const r = runPseudocode(src.join('\n'), {}, 20000, inputs.map(String));
  assert(!r.error, 'program runs: ' + (r.error && r.error.message) + '\n' + src.join('\n'));
  return r.outputs.map(String);
}
const one = (lines, inputs) => { const o = run(lines, inputs); assert(o.length === 1, 'one output'); return o[0]; };
function binary(list, target) {
  let low = 1, high = list.length; const steps = [];
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    steps.push({ low, high, mid, value: list[mid - 1] });
    if (list[mid - 1] === target) return { steps, at: mid };
    if (target < list[mid - 1]) high = mid - 1; else low = mid + 1;
  }
  return { steps, at: 0 };
}

// ---------------------------------------------------------------- slide helpers
const validators = {};
function checkStep(id, lbl, heading, lead, parts, whyQ = null, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer, p.flags == null ? 'i' : p.flags), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label: lbl, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, lbl, heading, lead, items, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label: lbl, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, `<div id="${cid}"></div>`) : `<div id="${cid}"></div>`), items };
}
function selfMarked(id, lbl, heading, lead, items, whyQ, extra = '') {
  return { id, label: lbl, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + (extra ? columns(extra, `<div id="${P}-${id}"></div>`) : `<div id="${P}-${id}"></div>`), items };
}
function embed(id, lbl, appId, heading, lead, whyQ, query) {
  const s = { id, label: lbl, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
  if (query) s.embedQuery = query;
  return s;
}
const num = (n, unit = '') => `^\\s*${n}${unit ? `\\s*(${unit})?` : ''}\\s*\\.?\\s*$`;
const idx = (n) => `^\\s*(index\\s*)?${n}\\s*\\.?\\s*$`;
// An exact string output, quote marks optional, capitals must match.
const exact = (s) => `^\\s*["']?${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, ' ')}["']?\\s*\\.?\\s*$`;
const steps = [];
const wcell = 'padding:5px 9px;text-align:center;font:700 17px var(--font-mono, monospace)';
const note = (t) => `<div class="wt-note">${t}</div>`;
function wtArray(values, hl = []) {
  return '<table class="donow-table"><tr><th style="' + wcell + '">Index</th>' + values.map((v, k) => `<td style="${wcell};color:var(--muted)"${hl.includes(k + 1) ? ' class="wt-hl"' : ''}>${k + 1}</td>`).join('') +
    '</tr><tr><th style="' + wcell + '">Value</th>' + values.map((v, k) => `<td style="${wcell}"${hl.includes(k + 1) ? ' class="wt-hl"' : ''}>${v}</td>`).join('') + '</tr></table>';
}
function codeWT(lines, hl = []) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    return `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">` + String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' + '&nbsp;'.repeat(lead) + esc(l.trim()).replace(/&lt;-/g, A) + '</div>';
  }).join('') + '</div>';
}

// ---------------------------------------------------------------- Do Now 1: binary search (2.4)
const R11 = [6, 11, 19, 24, 32, 40, 47, 55, 63, 71, 88];
const B71 = binary(R11, 71);
const DN1 = { first: B71.steps[0].mid, bin: B71.steps.length, lin: R11.indexOf(71) + 1 };
assert(DN1.first === 6 && DN1.bin === 3 && DN1.lin === 10, 'Do Now 1 values');
const W9 = [4, 14, 20, 27, 35, 42, 58, 66, 80];
const B58 = binary(W9, 58);
assert(B58.steps.map((s) => s.mid).join() === '5,7', 'walkthrough 1 steps');
const WT1 = { title: 'Walk me through it: binary search, then linear search', steps: [
  { text: 'A similar list of 9 items, in order. The target is <strong>58</strong>. Low = 1, High = 9.', visual: wtArray(W9) },
  { text: 'Middle = (1 + 9) / 2 = <strong>5</strong>. Index 5 holds 35. That is comparison 1.', visual: wtArray(W9, [5]) + note('Comparison 1: 35') },
  { text: '58 is bigger than 35, so keep the right part: Low = 5 + 1. Now Low = 6 and High = 9.', visual: wtArray(W9, [6, 7, 8, 9]) + note('Left: index 6 to 9') },
  { text: 'Middle = (6 + 9) / 2 = 7.5, rounded down: <strong>7</strong>. Index 7 holds 58. Found, with comparison 2.', visual: wtArray(W9, [7]) + note('Binary search: 2 comparisons') },
  { text: 'A linear search checks index 1, 2, 3 and on until it reaches 58 at index 7: <strong>7</strong> comparisons. Now do your list the same way.', visual: wtArray(W9, [1, 2, 4, 5, 7]) + note('Linear search: 7 comparisons') },
] };
steps.push(checkStep('do-now', 'Do Now: Question 1', 'Do Now: Binary Search', 'From 2.4. The target is 71. The list is in order.', [
  { label: 'How many comparisons does the binary search make?', answer: num(DN1.bin, 'comparisons?'), feedback: 'Low = 1, High = 11. Check the middle, keep the part 71 is in, repeat. Count every check.' },
  { label: 'How many comparisons does a linear search make?', answer: num(DN1.lin, 'comparisons?'), feedback: 'Start at index 1. Count every item up to and including 71.' },
], ['Why must the list be in order for a binary search?', 'One check of the middle then shows which side the target is on, so the other side can be thrown away.']));
steps[steps.length - 1].content = steps[steps.length - 1].content.replace('<div class="lesson-exam-card">', listPic(R11) + '<div class="lesson-exam-card">');
steps[steps.length - 1].walkthrough = WT1;

// ---------------------------------------------------------------- Do Now 2: a loop over an array of strings (2.3, 3.1)
const NAMES = ['Ben', 'Mai', 'Ben', 'Joy', 'Ben', 'Tom'];
const DN2P = ['DECLARE Names : ARRAY[1:6] OF STRING', 'DECLARE Index : INTEGER', 'DECLARE Count : INTEGER', 'Count <- 0', 'FOR Index <- 1 TO 6', '    IF Names[Index] = "Ben" THEN', '        Count <- Count + 1', '    ENDIF', 'NEXT Index', 'OUTPUT Count'];
const DN2_OUT = run(DN2P, [], { Names: NAMES });
assert(DN2_OUT.join() === '3', 'Do Now 2 output');
const PETS = ['Cat', 'Dog', 'Cat', 'Fish'];
const WT2P = ['DECLARE Pets : ARRAY[1:4] OF STRING', 'DECLARE Index : INTEGER', 'DECLARE Count : INTEGER', 'Count <- 0', 'FOR Index <- 1 TO 4', '    IF Pets[Index] = "Cat" THEN', '        Count <- Count + 1', '    ENDIF', 'NEXT Index', 'OUTPUT Count'];
assert(run(WT2P, [], { Pets: PETS }).join() === '2', 'walkthrough 2 output');
const WT2 = { title: 'Walk me through it: count matching strings in a loop', steps: [
  { text: 'A similar program. Pets holds "Cat", "Dog", "Cat", "Fish". It counts the "Cat" values.', visual: codeWT(WT2P) + wtArray(PETS.map((p) => '"' + p + '"')) },
  { text: 'Line 4 sets Count to 0, once, before the loop.', visual: codeWT(WT2P, [4]) + note('Count = 0') },
  { text: 'Pass 1: is Pets[1] = "Cat"? Yes, TRUE. Line 7 runs: Count = <strong>1</strong>.', visual: codeWT(WT2P, [6, 7]) + wtArray(PETS, [1]) + note('Count = 1') },
  { text: 'Pass 2: "Dog" is not "Cat". FALSE. Count stays 1.', visual: codeWT(WT2P, [6]) + wtArray(PETS, [2]) + note('Count = 1') },
  { text: 'The third pass: "Cat" again, TRUE: Count = <strong>2</strong>. The last pass: "Fish", FALSE.', visual: codeWT(WT2P, [6, 7]) + wtArray(PETS, [3, 4]) + note('Count = 2') },
  { text: 'The IF line ran once on every pass: Index went 1 TO 4, so it ran <strong>4</strong> times. Line 10 outputs Count. Now trace your program the same way.', visual: codeWT(WT2P, [5, 6, 10]) + note('Output: 2') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: Count the Matches', 'From 2.3 Arrays and 3.1. Names holds "Ben", "Mai", "Ben", "Joy", "Ben", "Tom".', [
  { label: 'What does the program output?', answer: num(DN2_OUT[0]), feedback: 'Check each name in turn. Add 1 to Count each time it is "Ben".' },
  { label: 'How many times does line 6 run?', answer: num(6, 'times?'), feedback: 'Line 6 is inside the loop. How many passes does FOR Index &larr; 1 TO 6 make?' },
], ['Why does Count start at 0 before the loop, not inside it?', 'So it is set only once. Inside the loop it would go back to 0 on every pass.'], codeBlock(DN2P, true)));
steps[steps.length - 1].walkthrough = WT2;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-2-4-binary-search', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.4 Binary Search. Stuck? Switch on <strong>I need help</strong>.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'String Manipulation',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithm Design and Text Programming</p><h2 class="lesson-h2">String Manipulation</h2><p>Year 9, 2.5</p></div>' +
    facts(['<strong>Today:</strong> count the characters in a string, and change it to capitals or small letters. Then use them to check what a user types.',
      '<strong>You already know:</strong> the STRING data type, IF and loops.',
      '<strong>Activities:</strong> String Lab: predict the output, then accept or reject inputs. Then write your own string code.']) +
    why('A website says "Your username is too long." How can a program know that?', 'It counts the characters that were typed, then compares the count with the limit.') });

// ---------------------------------------------------------------- characters and LENGTH
const HY = ['DECLARE Word : STRING', 'Word <- "Hat Yai"', 'OUTPUT LENGTH(Word)'];
const HY_OUT = one(HY);
assert(HY_OUT === '7', 'Hat Yai length');
steps.push({ id: 'length', label: 'Counting Characters: LENGTH',
  content: '<h2 class="lesson-h2">Counting Characters: LENGTH</h2>' +
    tps('Predict: what does this program output? Why is it not 6?',
      `<p>It outputs <strong>${HY_OUT}</strong>. H, a, t, the space, Y, a, i. The space is a character too.</p>`, 'Show the worked answer') +
    columns(codeBlock(HY, true) + charPic('Hat Yai', 'Word'),
      facts(['A string is <strong>characters in order</strong>. Each one has a position, from 1.', '<strong>LENGTH(Word)</strong> gives the number of characters in Word.',
        'Letters, digits, spaces and symbols all count.'])) });

const RA = ['DECLARE Room : STRING', 'Room <- "Room 12"', 'OUTPUT LENGTH(Room)'], RB = ['DECLARE Room : STRING', 'Room <- "Room12"', 'OUTPUT LENGTH(Room)'];
const RAo = one(RA), RBo = one(RB);
assert(RAo === '7' && RBo === '6', 'room lengths');
steps.push({ id: 'compare-space', label: 'Compare: One Space',
  content: '<h2 class="lesson-h2">Compare: One Space</h2>' +
    tps('Predict what A and B output. Why are they different?',
      `<p><strong>A</strong> outputs ${RAo}. <strong>B</strong> outputs ${RBo}.</p><p>A has a space between Room and 12. LENGTH counts it.</p>`, 'Show the worked answer') +
    columns(label('A') + codeBlock(RA) + charPic('Room 12'), label('B') + codeBlock(RB) + charPic('Room12')) +
    facts(['To a person they look the same. To the computer the space is one more character.']) });

const LEN_PROG = ['DECLARE Word : STRING', 'DECLARE Food : STRING', 'DECLARE Code : STRING', 'Word <- "Computer"', 'Food <- "Ice cream"', 'Code <- "A-12"'];
const L1 = one(LEN_PROG.concat(['OUTPUT LENGTH(Word)'])), L2 = one(LEN_PROG.concat(['OUTPUT LENGTH(Food)'])), L3 = one(LEN_PROG.concat(['OUTPUT LENGTH(Code)']));
assert(L1 === '8' && L2 === '9' && L3 === '4', 'check-length values');
steps.push(checkStep('check-length', 'Check: Count the Characters', 'Check: Count the Characters', 'Use the program for every part.', [
  { label: 'What does OUTPUT LENGTH(Word) output?', answer: num(L1, 'characters?'), feedback: 'Count every character of "Computer".' },
  { label: 'What does OUTPUT LENGTH(Food) output?', answer: num(L2, 'characters?'), feedback: 'Count every character of "Ice cream". Is the space a character?' },
  { label: 'What does OUTPUT LENGTH(Code) output?', answer: num(L3, 'characters?'), feedback: 'Count every character of "A-12". The - is a character, and so is each digit.' },
], ['Test it: LENGTH("a b"). Why is the answer 3, not 2?', 'The space between a and b is a character too, so there are three characters.'], codeBlock(LEN_PROG, true)));

// ---------------------------------------------------------------- UCASE and LCASE
const UC = ['DECLARE Room : STRING', 'Room <- "Lab 7b"', 'OUTPUT UCASE(Room)', 'OUTPUT LCASE(Room)'];
const UCo = run(UC);
assert(UCo.join('|') === 'LAB 7B|lab 7b', 'UCASE LCASE');
steps.push({ id: 'case', label: 'Capital Letters: UCASE and LCASE',
  content: '<h2 class="lesson-h2">Capital Letters: UCASE and LCASE</h2>' +
    tps('Predict both outputs. Why do the 7 and the space not change?',
      `<p>Line 3 outputs <strong>${UCo[0]}</strong>. Line 4 outputs <strong>${UCo[1]}</strong>.</p><p>Only letters have a capital and a small form. Digits, spaces and symbols stay the same.</p>`, 'Show the worked answer') +
    columns(codeBlock(UC, true),
      facts(['<strong>Upper case</strong> means capital letters: A B C. <strong>Lower case</strong> means small letters: a b c.',
        '<strong>UCASE(Room)</strong> gives Room in upper case.', '<strong>LCASE(Room)</strong> gives Room in lower case.', 'Only the letters change.'])) });

const ST_A = ['DECLARE Name : STRING', 'Name <- "Mai"', 'OUTPUT UCASE(Name)', 'OUTPUT Name'];
const ST_B = ['DECLARE Name : STRING', 'Name <- "Mai"', 'Name <- UCASE(Name)', 'OUTPUT Name'];
const STAo = run(ST_A), STBo = run(ST_B);
assert(STAo.join() === 'MAI,Mai' && STBo.join() === 'MAI', 'store compare');
steps.push({ id: 'compare-store', label: 'Compare: Show It or Store It',
  content: '<h2 class="lesson-h2">Compare: Show It or Store It</h2>' +
    tps('Predict what line 4 outputs in A and in B. Why are they different?',
      `<p><strong>A</strong> line 4 outputs <strong>${STAo[1]}</strong>. <strong>B</strong> line 4 outputs <strong>${STBo[0]}</strong>.</p><p>UCASE gives a new string. In A it is only output. In B it is stored back in Name, so Name changes.</p>`, 'Show the worked answer') +
    columns(label('A') + codeBlock(ST_A, true), label('B') + codeBlock(ST_B, true)) +
    facts(['UCASE and LCASE never change a variable on their own.', 'To keep the new string, store it: Name &larr; UCASE(Name).']) });

const CC = ['DECLARE City : STRING', 'DECLARE Room : STRING', 'City <- "Hat Yai"', 'Room <- "Music 3A"'];
const CC1 = one(CC.concat(['OUTPUT UCASE(City)'])), CC2 = one(CC.concat(['OUTPUT LCASE(Room)'])), CC3 = one(CC.concat(['OUTPUT LENGTH(UCASE(City))']));
assert(CC1 === 'HAT YAI' && CC2 === 'music 3a' && CC3 === '7', 'check-case values');
steps.push(checkStep('check-case', 'Check: Upper and Lower Case', 'Check: Upper and Lower Case', 'Type each output exactly, with the right capital letters.', [
  { label: 'What does OUTPUT UCASE(City) output?', answer: exact(CC1), flags: '', feedback: 'Every letter becomes a capital. The space stays.' },
  { label: 'What does OUTPUT LCASE(Room) output?', answer: exact(CC2), flags: '', feedback: 'Every letter becomes small. The digit and the space stay the same.' },
  { label: 'What does OUTPUT LENGTH(UCASE(City)) output?', answer: num(CC3, 'characters?'), feedback: 'Does UCASE change how many characters there are?' },
], ['Why might a program store every name in upper case before saving it?', 'Then every name is stored the same way, so names are easy to compare and to sort.'], codeBlock(CC, true)));

// ---------------------------------------------------------------- comparing strings: case matters
const EQ_A = ['DECLARE Reply : STRING', 'INPUT Reply', 'IF Reply = "yes" THEN', '    OUTPUT "OK"', 'ELSE', '    OUTPUT "Try again"', 'ENDIF'];
const EQ_B = EQ_A.map((l) => l.replace('IF Reply = "yes"', 'IF LCASE(Reply) = "yes"'));
const EQ_ROWS = ['yes', 'Yes', 'YES'].map((t) => ['"' + t + '"', one(EQ_A, [t]), one(EQ_B, [t])]);
assert(EQ_ROWS.map((r) => r[1]).join() === 'OK,Try again,Try again' && EQ_ROWS.every((r) => r[2] === 'OK'), 'compare equal');
steps.push({ id: 'compare-equal', label: 'Compare: Why Capitals Matter',
  content: '<h2 class="lesson-h2">Compare: Why Capitals Matter</h2>' +
    tps('The user types Yes. Predict what A and B output. Why are they different?',
      `<p><strong>A</strong> outputs ${EQ_ROWS[1][1]}: "Yes" is not the same as "yes". <strong>B</strong> outputs ${EQ_ROWS[1][2]}: LCASE makes it "yes" first.</p>` +
      table(EQ_ROWS, ['Typed in', 'A outputs', 'B outputs']), 'Show the worked answer') +
    columns(label('A') + codeBlock(EQ_A, true), label('B') + codeBlock(EQ_B, true)) +
    facts(['= compares every character. Y and y are <strong>different characters</strong>.', 'Change the input with LCASE or UCASE first, so capital letters do not matter.']) });

// ---------------------------------------------------------------- activity 1: String Lab predict
steps.push(embed('activity-1', 'Activity 1: Predict the Output', 'string-lab', 'Activity 1: Predict the Output',
  '<strong>What to do:</strong> type exactly what each program outputs, then run it. A mistake means the round does not count. <strong>Done</strong> when you have passed level 3.',
  ['Why does the app show every character in a box after you answer?', 'So you can count the characters and see which ones changed. That shows where a wrong answer went wrong.'], 'activity=predict'));

// ---------------------------------------------------------------- checking input with LENGTH
const PW = ['DECLARE Password : STRING', 'INPUT Password', 'IF LENGTH(Password) >= 8 THEN', '    OUTPUT "Accepted"', 'ELSE', '    OUTPUT "Too short"', 'ENDIF'];
const PW_ROWS = ['secret', 'password', 'pass wd'].map((t) => ['"' + t + '"', String(t.length), one(PW, [t])]);
assert(PW_ROWS.map((r) => r[2]).join() === 'Too short,Accepted,Too short', 'password rows');
steps.push({ id: 'check-input', label: 'Checking What the User Types',
  content: '<h2 class="lesson-h2">Checking What the User Types</h2>' +
    tps('A password must have at least 8 characters. Predict the output for secret, password and pass wd. Why is password accepted?',
      `<p>"password" has exactly 8 characters, and 8 &gt;= 8 is TRUE.</p>` + table(PW_ROWS, ['Typed in', 'LENGTH', 'Output']), 'Show the worked answer') +
    columns(codeBlock(PW, true),
      facts(['A program can check what is typed <strong>before</strong> it uses it.', 'LENGTH in an IF line tests how many characters were typed.',
        '"At least 8" includes 8 itself, so use &gt;=.'])) });

steps.push(mcStep('hinge', 'Hinge Question: Choose the IF Line', 'Hinge Question: Choose the IF Line', '', [
  { prompt: 'Which IF line accepts paris, Paris and PARIS?', options: ['IF UCASE(City) = "Paris" THEN', 'IF City = UCASE("paris") THEN', 'IF UCASE(City) = "PARIS" THEN', 'IF LCASE(City) = "Paris" THEN'], correct: 2,
    explain: 'UCASE turns every input into PARIS, so compare it with "PARIS". "Paris" has small letters, so UCASE(City) can never equal it.' },
  { prompt: 'A password needs at least 8 characters. Which IF line is TRUE for a good password?', options: ['IF LENGTH(Password) >= 8 THEN', 'IF LENGTH(Password) > 8 THEN', 'IF Password >= 8 THEN', 'IF LENGTH(Password) <= 8 THEN'], correct: 0,
    explain: '"At least 8" includes 8, so it is >= 8. Password >= 8 compares the text with a number, not its length.' },
], ['A quiz answer is Bangkok. Why might a program mark a correct student wrong?', 'The student may type bangkok or BANGKOK. = compares capital letters too, so they do not match.']));

// ---------------------------------------------------------------- activity 2: String Lab check
steps.push(embed('activity-2', 'Activity 2: Accepted or Rejected?', 'string-lab', 'Activity 2: Accepted or Rejected?',
  '<strong>What to do:</strong> read the program. Predict Accepted or Rejected for every input, then run it. All five must be right. <strong>Done</strong> when you have passed level 4.',
  ['Why are some inputs exactly on the limit?', 'Inputs on the limit show whether you read the operator: &gt; and &gt;= give different answers there.'], 'activity=check'));


// ---------------------------------------------------------------- activity 3: write string code
steps.push(embed('activity-3', 'Activity 3: Write the String Code', 'drill-y9-2-5-code', 'Activity 3: Write the String Code',
  '<strong>What to do:</strong> write each program in Cambridge pseudocode, with DECLARE lines. Your code is run with new inputs and checked straight away.',
  ['Why is your program run with different typed inputs each time?', 'A correct program must work for any input, not just one. New inputs catch code that only works by luck.']));

// ---------------------------------------------------------------- exam-style questions
const QUIZ = ['DECLARE Answer : STRING', 'INPUT Answer', 'IF Answer = "Paris" THEN', '    OUTPUT "Correct"', 'ELSE', '    OUTPUT "Wrong"', 'ENDIF'];
assert(one(QUIZ, ['PARIS']) === 'Wrong' && one(QUIZ.map((l) => l.replace('Answer = "Paris"', 'UCASE(Answer) = "PARIS"')), ['paris']) === 'Correct', 'quiz');
steps.push(selfMarked('exam-explain', 'Exam-Style Question: Explain the Error', 'Exam-Style Question: Explain the Error',
  'A student types PARIS and the program outputs Wrong. This part has 2 marks.', [
    { id: 'case-explain', prompt: 'Explain why the program outputs Wrong, and how line 3 should be changed. [2]', marks: 2,
      scheme: ['= compares every character / the comparison is case sensitive, so PARIS is not the same as Paris',
        'Change the input with UCASE or LCASE before comparing, for example IF UCASE(Answer) = "PARIS" THEN (or LCASE with "paris")'],
      guidance: 'One mark for each point. For point 2 the comparison text must match the case used: UCASE with "PARIS" or LCASE with "paris". Do not accept UCASE(Answer) = "Paris".',
      modelAnswer: 'Capital letters are different characters, so "PARIS" is not equal to "Paris". Line 3 should be IF UCASE(Answer) = "PARIS" THEN.' },
  ], ['This part has 2 marks. How do you plan the answer?', 'Answer both parts of the question: first why it goes wrong, then the change. One mark each.'], codeBlock(QUIZ, true)));

steps.push(checkStep('exam-line', 'Exam-Style Question: Write the IF Line', 'Exam-Style Question: Write the IF Line',
  'A username must have at most 12 characters. The variable is Username.', [
    { line: true, label: 'Write an IF line that is TRUE when the username is too long.', answer: '^\\s*if\\s+(length\\s*\\(\\s*username\\s*\\)\\s*(>\\s*12|>=\\s*13)|(12\\s*<|13\\s*<=)\\s*length\\s*\\(\\s*username\\s*\\))\\s*(then)?\\s*\\.?\\s*$', feedback: 'Too long means MORE than 12. Use LENGTH(Username) in the condition.' },
    { label: 'The user types Mai Tran Smith. How many characters is that?', answer: num(14, 'characters?'), feedback: 'Count every letter and both spaces.' },
  ], ['Why do programs limit how long a username can be?', 'So it fits on the screen, and in the space kept to store it.']));
assert('Mai Tran Smith'.length === 14, 'Mai Tran Smith');

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: String Manipulation Drill', 'drill-y9-2-5-strings', 'Plenary: String Manipulation Drill',
  '<strong>What to do:</strong> answer every card. Type outputs exactly, with the right capital letters. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.',
  ['Why do the cards ask what a program outputs, not what it should do?', 'You must see exactly what each line does before you can write or fix your own string code.']));

// ---------------------------------------------------------------- lesson self-checks
const V = (k, i, s) => { const v = validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern; return new RegExp(v.source, v.flags).test(s); };
assert(V('do-now', 0, '3') && V('do-now', 1, '10') && !V('do-now', 1, '3'), 'do-now');
assert(V('do-now-2', 0, '3') && !V('do-now-2', 0, '1') && V('do-now-2', 1, '6 times'), 'do-now-2');
assert(V('check-length', 0, '8') && V('check-length', 1, '9') && !V('check-length', 1, '8') && V('check-length', 2, '4'), 'check-length');
for (const ok of ['HAT YAI', '"HAT YAI"', ' HAT YAI ']) assert(V('check-case', 0, ok), 'case accepts ' + ok);
for (const bad of ['Hat Yai', 'hat yai', 'HATYAI']) assert(!V('check-case', 0, bad), 'case rejects ' + bad);
assert(V('check-case', 1, 'music 3a') && !V('check-case', 1, 'Music 3a') && !V('check-case', 1, 'music 3A') && V('check-case', 2, '7'), 'check-case b c');
for (const ok of ['IF LENGTH(Username) > 12 THEN', 'if length(username)>12', 'IF LENGTH(Username) >= 13 THEN', 'IF 12 < LENGTH(Username) THEN']) assert(V('exam-line', 0, ok), 'line accepts ' + ok);
for (const bad of ['IF LENGTH(Username) >= 12 THEN', 'IF Username > 12 THEN', 'IF LENGTH(Username) < 12 THEN']) assert(!V('exam-line', 0, bad), 'line rejects ' + bad);
assert(V('exam-line', 1, '14') && !V('exam-line', 1, '12'), 'exam-line b');
{ const t = WT1.steps.map((x) => x.text).join(' ');
  assert(!/\b(71|10)\b/.test(t) && !/\b3 comparisons|\bindex 6\b|<strong>6<\/strong>/.test(t), 'walkthrough 1 shows a Do Now answer'); }
{ const t = WT2.steps.map((x) => x.text).join(' ');
  assert(!/\b(3|6)\b/.test(t) && !/Ben/.test(t), 'walkthrough 2 shows a Do Now answer'); }
const mcCorrect = steps.filter((s) => s.type === 'multiple-choice').flatMap((s) => s.items.map((i) => i.correct));
assert(new Set(mcCorrect).size > 1, 'MC correct positions vary');
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
const text = (s) => JSON.stringify([s.content, s.items || '', s.walkthrough || '']);
const firstAt = (rx) => steps.findIndex((s) => rx.test(text(s)));
const at = (id) => steps.findIndex((s) => s.id === id);
assert(firstAt(/LENGTH/) === at('length'), 'LENGTH before it is taught');
assert(firstAt(/UCASE|LCASE/) === at('case'), 'UCASE before it is taught');
assert(firstAt(/upper case|lower case/i) === at('case'), 'upper case before it is taught');
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV|SUBSTRING)\b/.test(all), 'a construct Year 9 has not met');
assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'em or en dash');

const lesson = { id: ID, label: '2.5: String Manipulation', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ================================================================= the drills
function DRILL_CODE() {
// Year 9, 2.5: String Manipulation (Activity 3: write the string code)
// Loaded by Drills/index.html?drill=y9-2-5-code
// Generated by tools/build_y9_2_5.mjs: edit that, then run it.
// Code cards: the student writes Cambridge pseudocode with LENGTH, UCASE and LCASE. It is run against the reference
// with the same typed inputs, which are new on every card, and must give the same output (and variables named).
DrillData.register("y9-2-5-code", {
  title: "Year 9, 2.5: Write the String Code",
  subtitle: "Use LENGTH, UCASE and LCASE, then check what the user types",
  codeDrill: true,
  categories: [
    ["code-len", "Use LENGTH"],
    ["code-case", "Use UCASE and LCASE"],
    ["code-check", "Check the Input"]
  ],
  cards: (function () {
    var WORDS = ["Hat Yai", "Bangkok", "Ice cream", "Room 12B", "Mai", "Computer", "Pad Thai", "Song Kran", "Level 3", "Blue Sky", "Top 10", "Sea View"];
    var NAMES = ["Mai", "Ben", "Joy", "Somchai", "Anna", "Tom", "Kanya", "Pim", "Arthit", "Lily"];
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function some(list, n) { var o = []; while (o.length < n) o.push(pick(list)); return o; }
    function casings(w) { return [w, w.toUpperCase(), w.charAt(0).toUpperCase() + w.slice(1), w.split("").map(function (c, i) { return i % 2 ? c.toUpperCase() : c; }).join("")]; }
    return [
      { id: "code-len-1", category: "code-len",
        prompt: "Input a word into Word (a STRING). Output how many characters it has.",
        inputs: function () { return [pick(WORDS)]; },
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT LENGTH(Word)",
        checkOutput: true },
      { id: "code-len-2", category: "code-len",
        prompt: "Input a first name into First, then a last name into Last (both STRING). Output the total number of characters in the two names.",
        inputs: function () { return some(NAMES, 2); },
        reference: "DECLARE First : STRING\nDECLARE Last : STRING\nINPUT First\nINPUT Last\nOUTPUT LENGTH(First) + LENGTH(Last)",
        checkOutput: true },
      { id: "code-case-1", category: "code-case",
        prompt: "Input a name into Name (a STRING). Output the name in upper case.",
        inputs: function () { return [pick(NAMES)]; },
        reference: "DECLARE Name : STRING\nINPUT Name\nOUTPUT UCASE(Name)",
        checkOutput: true },
      { id: "code-case-2", category: "code-case",
        prompt: "Input a word into Word (a STRING). Store it back in Word in lower case, then output Word.",
        inputs: function () { return [pick(WORDS).toUpperCase()]; },
        reference: "DECLARE Word : STRING\nINPUT Word\nWord <- LCASE(Word)\nOUTPUT Word",
        checkVars: ["Word"],
        checkOutput: true },
      { id: "code-check-1", category: "code-check",
        prompt: "Input a password into Password (a STRING). If it has at least 8 characters, output \"Accepted\". Otherwise output \"Too short\".",
        inputs: function () { return [pick(["secret", "password", "pass wd", "letmein1", "abc", "sunflower", "12345678", "short"])]; },
        reference: "DECLARE Password : STRING\nINPUT Password\nIF LENGTH(Password) >= 8 THEN\n    OUTPUT \"Accepted\"\nELSE\n    OUTPUT \"Too short\"\nENDIF",
        checkOutput: true },
      { id: "code-check-2", category: "code-check",
        prompt: "Input an answer into Answer (a STRING). Output \"Correct\" if it is yes with any capital letters (yes, Yes, YES), otherwise output \"Wrong\".",
        inputs: function () { return [pick(casings("yes").concat(["no", "yep", "NO"]))]; },
        reference: "DECLARE Answer : STRING\nINPUT Answer\nIF LCASE(Answer) = \"yes\" THEN\n    OUTPUT \"Correct\"\nELSE\n    OUTPUT \"Wrong\"\nENDIF",
        checkOutput: true },
      { id: "code-check-3", category: "code-check",
        prompt: "Input 5 names, one at a time, into Name (a STRING). Count how many have more than 4 characters, then output the count.",
        inputs: function () { var o = some(NAMES, 4); o.splice(Math.floor(Math.random() * 5), 0, pick(["Anna", "Lily"])); return o; },
        reference: "DECLARE Name : STRING\nDECLARE Count : INTEGER\nDECLARE Long : INTEGER\nLong <- 0\nFOR Count <- 1 TO 5\n    INPUT Name\n    IF LENGTH(Name) > 4 THEN\n        Long <- Long + 1\n    ENDIF\nNEXT Count\nOUTPUT Long",
        checkOutput: true }
    ];
  })()
});
}

function DRILL_PLENARY() {
// Year 9, 2.5: String Manipulation (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-2-5-strings
// Generated by tools/build_y9_2_5.mjs: edit that, then run it.
// Four categories, mirroring the lesson: LENGTH, UCASE and LCASE, comparing strings, and checking input. Every
// output comes from running the card's program in shared/pseudocode-engine.js. String outputs must be typed with
// the right capital letters (their keywords have no i flag); quote marks are allowed.
DrillData.register("y9-2-5-strings", {
  title: "Year 9, 2.5: String Manipulation",
  subtitle: "LENGTH, UCASE and LCASE, comparing strings, and checking input",
  choiceOnly: true,
  categories: [
    ["st-len", "LENGTH"],
    ["st-case", "UCASE and LCASE"],
    ["st-cmp", "Comparing Strings"],
    ["st-check", "Checking Input"]
  ],
  cards: (function () {
    var A = "\u2190";
    var WORDS = ["Hat Yai", "Room 12B", "Mai Tran", "Year 9!", "pass word", "A-12", "Song Kran", "Bangkok", "Ice cream", "Level 3", "My Cat",
      "Hello World", "Thai Food", "Big Data", "Go Team", "Sea View", "Top 10", "Map Room", "Lab 7a", "Blue Sky", "Pad Thai"];
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    function run(lines, inputs) {
      var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(String);
    }
    function quoteRe(s, flags) { return new RegExp("^\\s*[\"']?" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\"']?\\s*\\.?\\s*$", flags || ""); }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) - 1, Number(ans) + 2]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function lenOf(w) { return w.length; }
    function title(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }
    return [
      // ------------------------------------------------ LENGTH
      { id: "l-word", category: "st-len", randomize: function () {
          var w = drillPick(WORDS), lines = ["DECLARE Word : STRING", "Word <- \"" + w + "\"", "OUTPUT LENGTH(Word)"], o = run(lines)[0];
          return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [w.replace(/[^A-Za-z]/g, "").length, Number(o) - 1, Number(o) + 1]),
            working: ["LENGTH counts every character between the quote marks.", "Count spaces, digits and symbols too."], note: "\"" + w + "\" has " + o + " characters." };
        } },
      { id: "l-two", category: "st-len", randomize: function () {
          var a = drillPick(WORDS), b; do { b = drillPick(WORDS); } while (b === a);
          var lines = ["DECLARE First : STRING", "DECLARE Second : STRING", "First <- \"" + a + "\"", "Second <- \"" + b + "\"", "OUTPUT LENGTH(First) + LENGTH(Second)"], o = run(lines)[0];
          return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [lenOf(a), lenOf(b), Number(o) - 1]),
            working: ["Find the LENGTH of each string first.", "Then add the two numbers."], note: lenOf(a) + " + " + lenOf(b) + " = " + o + "." };
        } },
      { id: "l-why", category: "st-len", pickThenType: true,
        prompt: "Why does LENGTH(\"Hat Yai\") give 7, not 6?",
        answers: ["The space is a character too, so it is counted"],
        keywords: [/^(?=.*\bspaces?\b)(?=.*\b(character|characters|count|counts|counted|counting)\b)/i],
        distractors: ["Capital letters count as two characters", "LENGTH always adds one for the quote marks", "The Y is counted twice"],
        working: ["Write out every character of Hat Yai, one by one.", "Which character is easy to forget?"],
        note: "H, a, t, space, Y, a, i: the space is a character, so there are 7." },
      // ------------------------------------------------ UCASE and LCASE
      { id: "c-up", category: "st-case", randomize: function () {
          var w = drillPick(WORDS), lines = ["DECLARE Text : STRING", "Text <- \"" + w + "\"", "OUTPUT UCASE(Text)"], o = run(lines)[0];
          var ds = [w, w.toLowerCase(), title(w), o.replace(/ /g, "")].filter(function (d, i, all) { return d !== o && all.indexOf(d) === i; }).slice(0, 3);
          [o.slice(0, -1), o + o.slice(-1), o.slice(1)].forEach(function (d) { if (ds.length < 3 && d !== o && ds.indexOf(d) === -1) ds.push(d); });
          return { prompt: "What does this program output? Type it exactly.\n" + show(numbered(lines)), answers: [o], keywords: [quoteRe(o)], distractors: ds,
            working: ["UCASE makes every letter a capital.", "Digits, spaces and symbols stay the same."], note: "UCASE(\"" + w + "\") is \"" + o + "\"." };
        } },
      { id: "c-low", category: "st-case", randomize: function () {
          var w = drillPick(WORDS), lines = ["DECLARE Text : STRING", "Text <- \"" + w + "\"", "OUTPUT LCASE(Text)"], o = run(lines)[0];
          var ds = [w, w.toUpperCase(), title(w), o.replace(/ /g, "")].filter(function (d, i, all) { return d !== o && all.indexOf(d) === i; }).slice(0, 3);
          [o.slice(0, -1), o + o.slice(-1), o.slice(1)].forEach(function (d) { if (ds.length < 3 && d !== o && ds.indexOf(d) === -1) ds.push(d); });
          return { prompt: "What does this program output? Type it exactly.\n" + show(numbered(lines)), answers: [o], keywords: [quoteRe(o)], distractors: ds,
            working: ["LCASE makes every letter small.", "Digits, spaces and symbols stay the same."], note: "LCASE(\"" + w + "\") is \"" + o + "\"." };
        } },
      { id: "c-len", category: "st-case", randomize: function () {
          var w = drillPick(WORDS), lines = ["DECLARE Text : STRING", "Text <- \"" + w + "\"", "OUTPUT LENGTH(UCASE(Text))"], o = run(lines)[0];
          return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [Number(o) * 2, Number(o) - 1, Number(o) + 1]),
            working: ["Work out UCASE(Text) first.", "Does changing letters to capitals change how many characters there are?"], note: "UCASE changes letters, not the count: " + o + "." };
        } },
      { id: "c-store", category: "st-case", randomize: function () {
          var n = drillPick(["Mai", "Ben", "Joy", "Pim", "Anna", "Tom"]), f = drillPick(["UCASE", "LCASE"]);
          var lines = ["DECLARE Name : STRING", "Name <- \"" + n + "\"", "OUTPUT " + f + "(Name)", "OUTPUT Name"], o = run(lines)[1];
          return { prompt: "What does line 4 output? Type it exactly.\n" + show(numbered(lines)), answers: [o], keywords: [quoteRe(o)],
            distractors: [n.toUpperCase(), n.toLowerCase(), "Name"].filter(function (d) { return d !== o; }).concat([n + n]).slice(0, 3),
            working: ["Line 3 outputs a new string. Is it stored anywhere?", "What does Name hold after line 2? Has any line changed it?"], note: "Line 3 only outputs " + f + "(Name). Name itself is still \"" + n + "\"." };
        } },
      // ------------------------------------------------ Comparing Strings
      { id: "m-eq", category: "st-cmp", randomize: function () {
          var w = drillPick(["yes", "blue", "paris", "red", "cat"]), typed = drillPick([w, w.toUpperCase(), title(w)]), lit = drillPick([w, title(w)]), f = drillPick(["", "UCASE", "LCASE"]);
          var cond = f ? f + "(Reply) = \"" + (f === "UCASE" ? lit.toUpperCase() : lit.toLowerCase()) + "\"" : "Reply = \"" + lit + "\"";
          if (f && Math.random() < 0.3) cond = f + "(Reply) = \"" + title(w) + "\"";
          var lines = ["DECLARE Reply : STRING", "INPUT Reply", "IF " + cond + " THEN", "    OUTPUT \"Match\"", "ELSE", "    OUTPUT \"No match\"", "ENDIF"], o = run(lines, [typed])[0];
          return { prompt: "The user types " + typed + ". What does the program output?\n" + show(numbered(lines)), answers: [o], keywords: [quoteRe(o, "i")],
            distractors: [o === "Match" ? "No match" : "Match", "TRUE", "Error"],
            working: ["Work out the left side first: what is the input after UCASE or LCASE, if there is one?", "= is TRUE only if every character is the same, capitals too."], note: "The IF compares \"" + (f === "UCASE" ? typed.toUpperCase() : f === "LCASE" ? typed.toLowerCase() : typed) + "\" with the text in quotes, so it outputs " + o + "." };
        } },
      { id: "m-fix", category: "st-cmp", pickThenType: true,
        prompt: "Which IF line accepts paris, Paris and PARIS?",
        answers: ["IF LCASE(City) = \"paris\" THEN"],
        keywords: [/^\s*[iI][fF]\s+[lL][cC][aA][sS][eE]\s*\(\s*[cC][iI][tT][yY]\s*\)\s*=\s*["']paris["']\s*([tT][hH][eE][nN])?\s*$/, /^\s*[iI][fF]\s+[uU][cC][aA][sS][eE]\s*\(\s*[cC][iI][tT][yY]\s*\)\s*=\s*["']PARIS["']\s*([tT][hH][eE][nN])?\s*$/],
        distractors: ["IF LCASE(City) = \"Paris\" THEN", "IF UCASE(City) = \"paris\" THEN", "IF City = LCASE(\"PARIS\") THEN"],
        working: ["After LCASE, every input is in small letters.", "So what must the text in quotes look like?"],
        note: "LCASE turns every input into paris, so compare it with \"paris\" (or UCASE with \"PARIS\")." },
      { id: "m-why", category: "st-cmp", pickThenType: true,
        prompt: "Why should a quiz use LCASE on the answer before it compares it?",
        answers: ["So capital letters do not matter when it compares"],
        keywords: [/^(?=.*\b(capitals?|capital\s+letters?|case|upper|lower|small)\b)(?=.*\b(matter|matters|same|ignored?|any|match|matches|equal|correct)\b)/i],
        distractors: ["So the answer gets shorter", "So the answer is stored as a number", "So spaces are taken out of the answer"],
        working: ["What does = do with Y and y?", "After LCASE, what do yes, Yes and YES all become?"],
        note: "= treats capital and small letters as different characters. LCASE makes them all the same first." },
      // ------------------------------------------------ Checking Input
      { id: "k-pass", category: "st-check", randomize: function () {
          var n = drillRange(6, 10), typed = drillPick(["sunflower", "password", "secret", "pass wd", "letmein", "abc12345", "Hat Yai", "mangoes"]);
          var op = drillPick([">=", ">"]);
          var lines = ["DECLARE Password : STRING", "INPUT Password", "IF LENGTH(Password) " + op + " " + n + " THEN", "    OUTPUT \"Accepted\"", "ELSE", "    OUTPUT \"Too short\"", "ENDIF"], o = run(lines, [typed])[0];
          return { prompt: "The user types " + typed + ". What does the program output?\n" + show(numbered(lines)), answers: [o], keywords: [quoteRe(o, "i")],
            distractors: [o === "Accepted" ? "Too short" : "Accepted", String(typed.length), "Password"],
            working: ["Count the characters typed, spaces too.", "Put that number into line 3. Is it TRUE?"], note: "\"" + typed + "\" has " + typed.length + " characters. Is " + typed.length + " " + op + " " + n + "? So it outputs " + o + "." };
        } },
      { id: "k-count", category: "st-check", randomize: function () {
          var n = drillRange(4, 6), pool = ["Mai", "Ben", "Somchai", "Anna", "Kanya", "Pim", "Arthit", "Lily", "Tom", "Joy", "Nok", "Ploy"], typed = [];
          while (typed.length < 5) typed.push(drillPick(pool));
          var lines = ["DECLARE Name : STRING", "DECLARE Count : INTEGER", "DECLARE Long : INTEGER", "Long <- 0", "FOR Count <- 1 TO 5", "    INPUT Name", "    IF LENGTH(Name) >= " + n + " THEN", "        Long <- Long + 1", "    ENDIF", "NEXT Count", "OUTPUT Long"];
          var o = run(lines, typed)[0];
          return { prompt: "The user types " + typed.join(", ") + ". What does the program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [5 - Number(o), 5, Number(o) + 1]),
            working: ["Find the LENGTH of each name.", "Count the names whose LENGTH is " + n + " or more. Equal counts here."], note: "Lengths: " + typed.map(lenOf).join(", ") + ". " + o + " are " + n + " or more." };
        } },
      { id: "k-line", category: "st-check", pickThenType: true,
        prompt: "A code must have exactly 4 characters. Which IF line is TRUE for a good code?",
        answers: ["IF LENGTH(Code) = 4 THEN"],
        keywords: [/^\s*if\s+(length\s*\(\s*code\s*\)\s*=\s*4|4\s*=\s*length\s*\(\s*code\s*\))\s*(then)?\s*$/i],
        distractors: ["IF Code = 4 THEN", "IF LENGTH(Code) > 4 THEN", "IF LENGTH(4) = Code THEN"],
        working: ["Which function counts the characters?", "Exactly 4 is not more than 4."],
        note: "LENGTH(Code) counts the characters; = 4 is TRUE only for exactly 4." },
      { id: "k-two", category: "st-check", randomize: function () {
          var m = drillRange(3, 5), bad = drillPick(["admin", "guest"]);
          var typed = drillPick([title(bad), bad.toUpperCase(), bad + drillRange(1, 9), "Kim", "Somchai", "ab", "Nok"]);
          var lines = ["DECLARE User : STRING", "INPUT User", "IF LENGTH(User) < " + m + " THEN", "    OUTPUT \"Rejected\"", "ELSE", "    IF LCASE(User) = \"" + bad + "\" THEN", "        OUTPUT \"Rejected\"", "    ELSE", "        OUTPUT \"Accepted\"", "    ENDIF", "ENDIF"];
          var o = run(lines, [typed])[0];
          return { prompt: "The user types " + typed + ". What does the program output?\n" + show(numbered(lines)), answers: [o], keywords: [quoteRe(o, "i")],
            distractors: [o === "Accepted" ? "Rejected" : "Accepted", String(typed.length), "Error"],
            working: ["Line 3 first: is the LENGTH less than " + m + "?", "If not, line 6: what is LCASE of the input?"], note: "\"" + typed + "\": LENGTH " + typed.length + ", LCASE \"" + typed.toLowerCase() + "\". It outputs " + o + "." };
        } }
    ];
  })()
});
}

const DRILL_DIR = path.join(ROOT, 'Drills', 'data');
function writeDrill(id, fn) {
  const src = fn.toString();
  const body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}')).replace(/^\r?\n/, '').replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(body), `em or en dash in ${id}`);
  assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV|SUBSTRING)\b/.test(body), `a construct Year 9 has not met in ${id}`);
  fs.writeFileSync(path.join(DRILL_DIR, id + '.js'), body);
  return body;
}
const drillSrc = { 'y9-2-5-code': writeDrill('y9-2-5-code', DRILL_CODE), 'y9-2-5-strings': writeDrill('y9-2-5-strings', DRILL_PLENARY) };
const registered = {};
const ctx = vm.createContext({ console, Math, JSON, DrillData: { register: (id, d) => { registered[id] = d; } } });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
for (const [id, src] of Object.entries(drillSrc)) vm.runInContext(src, ctx, { filename: id + '.js' });
const typedMatch = (card, s) => (card.keywords || []).some((k) => k.test(s));
{
  const d = registered['y9-2-5-strings'];
  for (const card of d.cards) {
    for (let t = 0; t < (card.randomize ? 300 : 1); t++) {
      const c = card.randomize ? { ...card, ...card.randomize() } : card;
      const where = `y9-2-5-strings ${card.id}`;
      assert(c.prompt && c.answers && c.answers.length && c.keywords && c.keywords.length, where + ' fields');
      assert(typedMatch(c, c.answers[0]), `${where}: own answer "${c.answers[0]}" fails its keywords`);
      assert(c.distractors && c.distractors.length === 3, `${where}: three distractors (${c.distractors})`);
      for (const x of c.distractors) assert(!typedMatch(c, x) && x !== c.answers[0], `${where}: distractor "${x}" passes`);
      assert(c.working && c.working.length === 2, where + ' two working nudges');
      const ansRe = new RegExp('(^|[^\\w.-])' + String(c.answers[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w|\\.\\d)');
      if (!ansRe.test(c.prompt)) for (const w of c.working) assert(!ansRe.test(w), `${where}: working shows the answer: ${w}`);
    }
  }
  const card = (cid) => d.cards.find((c) => c.id === cid);
  const ok = (cid, s) => typedMatch(card(cid), s);
  for (const s of ['the space is a character', 'it counts the space', 'spaces are counted as characters']) assert(ok('l-why', s), 'l-why accepts ' + s);
  for (const s of ['because of the Y', 'it counts', 'space']) assert(!ok('l-why', s), 'l-why rejects ' + s);
  for (const s of ['so capital letters do not matter', 'so upper and lower case answers are the same', 'so the case is ignored']) assert(ok('m-why', s), 'm-why accepts ' + s);
  for (const s of ['to make it lower', 'capitals', 'so it works']) assert(!ok('m-why', s), 'm-why rejects ' + s);
  for (const s of ['IF LCASE(City) = "paris" THEN', 'if lcase(city) = "paris"', 'IF UCASE(City) = "PARIS" THEN']) assert(ok('m-fix', s), 'm-fix accepts ' + s);
  for (const s of ['IF UCASE(City) = "Paris" THEN', 'IF UCASE(City) = "paris" THEN', 'IF City = "paris" THEN']) assert(!ok('m-fix', s), 'm-fix rejects ' + s);
}
for (const card of registered['y9-2-5-code'].cards) {
  for (let t = 0; t < 40; t++) {
    const typed = card.inputs();
    const r = runPseudocode(card.reference, {}, 5000, typed.map(String));
    assert(!r.error && r.outputs.length, `${card.id} reference: ${r.error && r.error.message}`);
  }
}

// ================================================================= register the lesson after 2.4
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const allL = JSON.parse(raw);
const indent = (raw.match(/\n( +)"/) || [, ' '])[1];
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const y9 = allL.years.find((y) => y.id === 'year9');
const unit = y9.units.find((u) => u.title === 'Algorithm Design and Text Programming');
assert(unit && unit.lessons.includes('y9-2-4-binary-search'), 'run build_y9_2_4.mjs first');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y9-2-4-binary-search') + 1, 0, ID);
fs.writeFileSync(lp, JSON.stringify(allL, null, indent).replace(/\n/g, nl) + (/\r?\n$/.test(raw) ? nl : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; drills: ` +
  Object.entries(registered).map(([k, d]) => `${k} (${d.cards.length})`).join(', ') + `; unit: ${unit.lessons.join(', ')}`);
