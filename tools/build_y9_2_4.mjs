// Builds LessonData/y9-2-4-binary-search.json: Year 9, 2.4 Binary Search, its two drills (Drills/data/y9-2-4-ext.js
// and y9-2-4-binary-search.js), and registers the lesson in the Year 9 "Algorithm Design and Text Programming" unit
// after 2.3.
//   node tools/build_y9_2_4.mjs
// Objectives (plan 2.4): describe how a binary search works; use a binary search to locate a value in ordered data;
// compare binary search with another search algorithm (linear search) for the same task (9CT.05, 9CT.08).
// Only what Year 9 has met in code: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT, IF ... THEN ... ENDIF,
// arrays from index 1. Binary search needs a WHILE loop and DIV, which Year 9 has not met, so it is taught as steps
// in words and pictures, never as code: Middle = (Low + High) / 2, rounded down; the middle item is thrown away too.
// One comparison = one item checked against the target. Linear search stops when it finds the target.
// Term 1b: every slide asks why; predict then reveal; linear and binary compared on the same list.
// Activities: Search Lab (pages SearchLab/, registry search-lab): middle levels 1 to 2, race, middle levels 3 to 4.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-2-4-binary-search';
const P = 'y9l24';
const A = '&larr;';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const re = (source) => ({ __regex: true, source, flags: 'i' });
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

// ---------------------------------------------------------------- a list drawn as Index above Value
// opt: { mid, found, low, high, out: Set of indexes greyed, order: {index: n}, tags: true (Low/High/Middle row) }
const cell = 'padding:4px 8px;text-align:center;font:700 16px var(--font-mono, monospace)';
function listPic(name, values, opt = {}) {
  const out = opt.out || new Set();
  const style = (i) => {
    let s = cell;
    if (out.has(i)) s += ';opacity:.3';
    if (i === opt.found) s += ';background:var(--good-soft);outline:2px solid var(--good-line)';
    else if (i === opt.mid) s += ';background:var(--brand-soft);outline:2px solid var(--brand)';
    return s;
  };
  const idx = values.map((v, k) => `<td style="${cell};color:var(--muted);font-size:13px${out.has(k + 1) ? ';opacity:.4' : ''}">${k + 1}</td>`).join('');
  const val = values.map((v, k) => `<td style="${style(k + 1)}">${v}</td>`).join('');
  let extra = '';
  if (opt.tags) extra = '<tr><th style="' + cell + ';text-align:left;font-size:13px"></th>' + values.map((v, k) => {
    const i = k + 1, t = [];
    if (i === opt.low) t.push('Low'); if (i === opt.high) t.push('High'); if (i === opt.mid) t.push('Mid');
    return `<td style="${cell};font:700 11px var(--font-body);color:var(--brand)">${t.join(' ')}</td>`;
  }).join('') + '</tr>';
  if (opt.order) extra += '<tr><th style="' + cell + ';text-align:left;font-size:13px">Check</th>' + values.map((v, k) =>
    `<td style="${cell};font-size:13px;color:var(--brand)">${opt.order[k + 1] || ''}</td>`).join('') + '</tr>';
  return (name ? `<p style="margin:0 0 4px"><strong>${name}</strong></p>` : '') + '<table class="donow-table" style="margin:0 0 4px">' +
    `<tr><th style="${cell};text-align:left;font-size:13px">Index</th>${idx}</tr><tr><th style="${cell};text-align:left;font-size:13px">Value</th>${val}</tr>${extra}</table>`;
}
const table = (rows, head) => '<table class="donow-table" style="font-size:17px;width:100%">' +
  '<tr>' + head.map((h) => `<th style="padding:6px 12px;text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:6px 12px;text-align:left">${c}</td>`).join('') + '</tr>').join('') + '</table>';

// ---------------------------------------------------------------- the searches, exactly as taught
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
const linear = (list, target) => { const i = list.indexOf(target); return i === -1 ? list.length : i + 1; };
const midOf = (lo, hi) => Math.floor((lo + hi) / 2);
const worst = (n) => { let c = 0; while (n > 0) { c++; n = Math.floor(n / 2); } return c; };
function run(lines, arrays = {}) {
  let src = lines.slice();
  for (const [name, vals] of Object.entries(arrays)) {
    const at = src.findIndex((l) => new RegExp(`^\\s*DECLARE\\s+${name}\\s*:\\s*ARRAY`).test(l));
    src.splice(at + 1, 0, ...vals.map((v, i) => `${name}[${i + 1}] <- ${v}`));
  }
  const r = runPseudocode(src.join('\n'), {}, 20000, []);
  assert(!r.error, 'program runs: ' + (r.error && r.error.message));
  return r.outputs.map(String);
}

// ---------------------------------------------------------------- slide helpers
const validators = {};
function checkStep(id, lbl, heading, lead, parts, whyQ = null, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
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
function selfMarked(id, lbl, heading, lead, items, whyQ) {
  return { id, label: lbl, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, lbl, appId, heading, lead, whyQ, query) {
  const s = { id, label: lbl, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
  if (query) s.embedQuery = query;
  return s;
}
const num = (n, unit = '') => `^\\s*${n}${unit ? `\\s*(${unit})?` : ''}\\s*\\.?\\s*$`;
const idx = (n) => `^\\s*(index\\s*)?${n}\\s*\\.?\\s*$`;
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

// ---------------------------------------------------------------- Do Now 1: read an array (2.3)
const POINTS = [12, 7, 25, 3, 18, 30];
const DN1 = { a: POINTS[2], b: POINTS.indexOf(18) + 1, c: POINTS[1] + POINTS[3] };
const WT1A = [8, 20, 4, 11, 16, 6];
const WT1 = { title: 'Walk me through it: read an array by its index', steps: [
  { text: 'A similar array. The top row is the <strong>index</strong>: the position. The bottom row is the <strong>value</strong> stored there.', visual: wtArray(WT1A) },
  { text: 'Marks[2] means: go to index 2, then read the value under it. Marks[2] is <strong>20</strong>.', visual: wtArray(WT1A, [2]) + note('Marks[2] = 20') },
  { text: 'Which index holds 4? Find 4 in the Value row, then read the number above it: index <strong>3</strong>.', visual: wtArray(WT1A, [3]) + note('4 is at index 3') },
  { text: 'Marks[1] + Marks[4]: read each element first, then add. 8 + 11 = <strong>19</strong>. Now do your array the same way.', visual: wtArray(WT1A, [1, 4]) + note('8 + 11 = 19') },
] };
steps.push(checkStep('do-now', 'Do Now: Question 1', 'Do Now: Read the Array', 'From 2.3 Arrays.', [
  { label: 'What is the value of Points[3]?', answer: num(DN1.a), feedback: 'Go to index 3 in the top row and read the value under it.' },
  { label: 'Which index holds 18?', answer: idx(DN1.b), feedback: 'Find 18 in the Value row, then read the number above it.' },
  { label: 'What is Points[2] + Points[4]?', answer: num(DN1.c), feedback: 'Read each element first, then add the two values.' },
], ['Why does an array use an index number, not a different name for each value?', 'One name stores many values. The index picks which one, so a loop can visit every value.'],
  codeBlock(['DECLARE Points : ARRAY[1:6] OF INTEGER']) + listPic('Points', POINTS)));
steps[steps.length - 1].walkthrough = WT1;

// ---------------------------------------------------------------- Do Now 2: a loop over an array with an IF (2.2, 3.1)
const CODES = [41, 17, 56, 17, 30, 8];
const DN2P = ['DECLARE Codes : ARRAY[1:6] OF INTEGER', 'DECLARE Index : INTEGER', 'FOR Index <- 1 TO 6', '    IF Codes[Index] = 17 THEN', '        OUTPUT Index', '    ENDIF', 'NEXT Index'];
const DN2_OUT = run(DN2P, { Codes: CODES });
assert(DN2_OUT.join() === '2,4', 'Do Now 2 outputs 2 and 4');
const WT2A = [9, 30, 12, 7, 9];
const WT2P = ['DECLARE Ages : ARRAY[1:5] OF INTEGER', 'DECLARE Index : INTEGER', 'FOR Index <- 1 TO 5', '    IF Ages[Index] = 9 THEN', '        OUTPUT Index', '    ENDIF', 'NEXT Index'];
const WT2_OUT = run(WT2P, { Ages: WT2A });
assert(WT2_OUT.join() === '1,5', 'walkthrough 2 outputs 1 and 5');
const WT2 = { title: 'Walk me through it: a loop that looks for a value', steps: [
  { text: 'A similar program. It looks for <strong>9</strong> in the array Ages, which holds 9, 30, 12, 7, 9.', visual: codeWT(WT2P) + wtArray(WT2A) },
  { text: 'Pass 1: Index is 1. Line 4 asks: is Ages[1] = 9? Ages[1] is 9, so TRUE. Line 5 outputs the <strong>index</strong>: 1.', visual: codeWT(WT2P, [4, 5]) + wtArray(WT2A, [1]) + note('Output: 1') },
  { text: 'Pass 2: Index is 2. Is Ages[2] = 9? 30 is not 9, so FALSE. Nothing is output.', visual: codeWT(WT2P, [4]) + wtArray(WT2A, [2]) + note('Output so far: 1') },
  { text: 'Passes 3 and 4: 12 and 7 are not 9. FALSE both times.', visual: codeWT(WT2P, [4]) + wtArray(WT2A, [3, 4]) + note('Output so far: 1') },
  { text: 'Pass 5: Ages[5] is 9, so TRUE. Line 5 outputs <strong>5</strong>.', visual: codeWT(WT2P, [4, 5]) + wtArray(WT2A, [5]) + note('Output: 1, then 5') },
  { text: 'Line 4 ran once on <strong>every</strong> pass: Index went 1 TO 5, so it ran 5 times. Now trace your program the same way.', visual: codeWT(WT2P, [3, 4]) + note('Line 4 ran 5 times') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: Follow the Loop', 'From 2.2 Loops and 3.1. The array Codes holds 41, 17, 56, 17, 30, 8.', [
  { label: 'What does the program output?', answer: '^\\s*2\\s*(,|and|then|\\s)\\s*4\\s*\\.?\\s*$', feedback: 'On each pass, check if Codes[Index] is 17. If it is, the program outputs Index, not 17.' },
  { label: 'How many times does line 4 run?', answer: num(6, 'times?'), feedback: 'Line 4 is inside the loop. How many passes does FOR Index &larr; 1 TO 6 make?' },
], ['Why trace a program line by line, not guess what it does?', 'The computer does exactly what each line says. A guess often follows what we think it should do.'], codeBlock(DN2P, true)));
steps[steps.length - 1].walkthrough = WT2;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-2-4-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on arrays, loops and tracing. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Binary Search',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Algorithm Design and Text Programming</p><h2 class="lesson-h2">Binary Search</h2><p>Year 9, 2.4</p></div>' +
    facts(['<strong>Today:</strong> two ways to find a value in a list, and why one is often much faster.',
      '<strong>You already know:</strong> arrays, indexes and loops.',
      '<strong>Activities:</strong> Search Lab: find the middle, then race two searches.']) +
    why('A dictionary has 1000 pages. Why do you not start at page 1 to find a word?', 'The words are in A to Z order. You can open it near the right place and skip most of the pages.') });

// ---------------------------------------------------------------- linear search
const LIN = [23, 8, 41, 15, 36, 40, 12, 29];
assert(linear(LIN, 40) === 6, 'linear slide');
steps.push({ id: 'linear', label: 'Linear Search',
  content: '<h2 class="lesson-h2">Linear Search</h2>' +
    tps('Predict: the target is 40. A linear search starts at index 1. How many items does it check?',
      `<p>It checks 23, 8, 41, 15, 36, then 40: <strong>6</strong> items. It stops at 40.</p>`, 'Show the worked answer') +
    listPic('Nums', LIN) +
    facts(['The value we look for is the <strong>target</strong>.', 'A <strong>linear search</strong> checks each item in turn, from index 1.',
      'It stops when it finds the target, or when no items are left.', 'Each check is one <strong>comparison</strong>: is this item the target?']) });

const LIN2 = [17, 52, 9, 33, 70, 26, 48, 5, 61, 14];
steps.push(checkStep('check-linear', 'Check: Count the Comparisons', 'Check: Count the Comparisons', 'A linear search on this list. Count every item it checks.', [
  { label: 'The target is 26. How many comparisons?', answer: num(linear(LIN2, 26), 'comparisons?'), feedback: 'Start at index 1. Count until you reach 26, and count 26 too.' },
  { label: 'The target is 44. How many comparisons?', answer: num(linear(LIN2, 44), 'comparisons?'), feedback: 'Is 44 in the list? When does a linear search stop?' },
  { label: 'The target is 17. How many comparisons?', answer: num(linear(LIN2, 17), 'comparisons?'), feedback: 'Where does a linear search start?' },
], ['Why do we count comparisons, not seconds, to compare two searches?', 'Time depends on the computer. The number of comparisons is the same on every computer.'],
  listPic('Nums', LIN2)));
assert(linear(LIN2, 26) === 6 && linear(LIN2, 44) === 10 && linear(LIN2, 17) === 1, 'check-linear values');

// ---------------------------------------------------------------- ordered data: compare
const ORD = [5, 12, 19, 26, 34, 41, 57], UNORD = [34, 5, 57, 19, 41, 12, 26];
steps.push({ id: 'compare-order', label: 'Compare: In Order or Not?',
  content: '<h2 class="lesson-h2">Compare: In Order or Not?</h2>' +
    tps('The target is 41. Check only the middle item, index 4, in each list. Where could 41 be in A? Where could it be in B? Why?',
      '<p><strong>A:</strong> index 4 holds 26. 41 is bigger, and A is in order, so 41 can only be to the <strong>right</strong>. Indexes 1 to 4 are not needed.</p><p><strong>B:</strong> index 4 holds 19. B is not in order, so 41 could be anywhere. Nothing can be skipped.</p>', 'Show the worked answer') +
    columns(label('A') + listPic('', ORD, { mid: 4 }), label('B') + listPic('', UNORD, { mid: 4 })) +
    facts(['<strong>Ordered</strong> data is in order: smallest to largest, or A to Z.', 'In ordered data, one check tells you which side the target is on.']) });

// ---------------------------------------------------------------- binary search: the steps
const S7 = [5, 12, 19, 26, 34, 41, 57];
steps.push({ id: 'binary-steps', label: 'Binary Search: Check the Middle',
  content: '<h2 class="lesson-h2">Binary Search: Check the Middle</h2>' +
    tps('Why does binary search throw away the middle item as well as half of the list?', 'The middle item has been checked. It is not the target, so it is not needed again.') +
    columns('<ol class="lesson-facts">' +
      '<li>Check the <strong>middle</strong> item.</li>' +
      '<li>Is it the target? <strong>Stop</strong>: found.</li>' +
      '<li>Target smaller? Keep the <strong>left</strong> part.</li>' +
      '<li>Target bigger? Keep the <strong>right</strong> part.</li>' +
      '<li>Repeat with the part that is left. Nothing left? The target is <strong>not in the list</strong>.</li></ol>',
      facts(['A <strong>binary search</strong> finds a target in <strong>ordered</strong> data.', 'Each comparison throws away about <strong>half</strong> of the items that are left.']) +
      listPic('', S7, { mid: 4 })) });

// ---------------------------------------------------------------- finding the middle
steps.push({ id: 'middle-rule', label: 'Low, High and Middle',
  content: '<h2 class="lesson-h2">Low, High and Middle</h2>' +
    tps('Predict: 8 items, so Low = 1 and High = 8. Which index is the middle? Why is there a problem?',
      `<p>(1 + 8) / 2 = 4.5. There is no index 4.5. Round down: index <strong>${midOf(1, 8)}</strong>.</p>`, 'Show the worked answer') +
    listPic('', [6, 14, 21, 29, 33, 48, 52, 67], { low: 1, high: 8, tags: true }) +
    facts(['<strong>Low</strong> is the first index still left. <strong>High</strong> is the last index still left.',
      '<strong>Middle = (Low + High) / 2</strong>. Not a whole number? <strong>Round down</strong>.',
      'Keep the left part: High = Middle - 1. Keep the right part: Low = Middle + 1.']) });

steps.push(checkStep('check-middle', 'Check: Find the Middle', 'Check: Find the Middle', 'Work out the middle index each time. Round down if you need to.', [
  { label: 'Low = 1 and High = 11. Middle?', answer: idx(midOf(1, 11)), feedback: 'Add Low and High, then divide by 2.' },
  { label: 'Low = 7 and High = 11. Middle?', answer: idx(midOf(7, 11)), feedback: '(7 + 11) / 2.' },
  { label: 'Low = 7 and High = 8. Middle?', answer: idx(midOf(7, 8)), feedback: '(7 + 8) / 2 is not a whole number. Which way do you round?' },
], ['Why does binary search need Low and High at all?', 'They mark the part of the list that is still left to search.']));
assert(midOf(1, 11) === 6 && midOf(7, 11) === 9 && midOf(7, 8) === 7, 'check-middle');

// ---------------------------------------------------------------- watch one binary search (stepper)
const S15 = [3, 8, 11, 17, 20, 24, 31, 38, 42, 47, 53, 60, 66, 72, 85];
const B66 = binary(S15, 66);
assert(B66.steps.map((s) => s.mid).join() === '8,12,14,13' && B66.at === 13, 'watch steps');
const outSet = (lo, hi) => new Set(S15.map((v, k) => k + 1).filter((i) => i < lo || i > hi));
const watchSteps = [{ title: 'Start', html: '<p style="margin:0 0 6px;font-size:18px">The target is <strong>66</strong>. The list is in order. Low = 1, High = 15.</p>' + listPic('', S15, { low: 1, high: 15, tags: true }), note: 'Say the middle index before you press Next.' }];
B66.steps.forEach((s, k) => {
  const v = s.value, found = v === 66;
  const what = found ? '66 is the target. <strong>Found</strong>, at index 13.' : 66 < v ? `66 is smaller than ${v}. Keep the <strong>left</strong> part: High = ${s.mid - 1}.` : `66 is bigger than ${v}. Keep the <strong>right</strong> part: Low = ${s.mid + 1}.`;
  watchSteps.push({ title: `Comparison ${k + 1}`,
    html: `<p style="margin:0 0 6px;font-size:18px">Middle = (${s.low} + ${s.high}) / 2 = ${(s.low + s.high) / 2}${(s.low + s.high) % 2 ? ', rounded down: ' + s.mid : ''}. Index ${s.mid} holds ${v}.</p>` +
      listPic('', S15, { low: s.low, high: s.high, mid: found ? 0 : s.mid, found: found ? s.mid : 0, tags: true, out: outSet(s.low, s.high) }) + `<p style="margin:6px 0 0;font-size:18px">${what}</p>`,
    note: found ? `${k + 1} comparisons in all.` : 'Say the next middle before you press Next.' });
});
steps.push({ id: 'watch', label: 'Watch a Binary Search', type: 'stepper', stepperId: `${P}-watch`, stepperSteps: watchSteps,
  content: '<h2 class="lesson-h2">Watch a Binary Search</h2>' +
    why('Why say the next middle out loud before you press Next?', 'Predicting first shows you if you really know the rule. A wrong prediction tells you what to fix.') +
    `<p class="lesson-lead">Press <strong>Next step</strong>. Before each press, say the next middle index.</p><div id="${P}-watch"></div>` });

// ---------------------------------------------------------------- check: use a binary search
const T11 = [4, 9, 15, 22, 28, 35, 43, 50, 61, 77, 90];
const B77 = binary(T11, 77);
assert(B77.steps.map((s) => s.mid).join() === '6,9,10', 'check-binary');
steps.push(checkStep('check-binary', 'Check: Use a Binary Search', 'Check: Use a Binary Search', 'The target is 77. Use a binary search.', [
  { label: 'Which index is checked first?', answer: idx(B77.steps[0].mid), feedback: 'Low = 1 and High = 11. Work out the middle.' },
  { label: 'Which index is checked second?', answer: idx(B77.steps[1].mid), feedback: 'Is 77 bigger or smaller than the first value checked? Which part is left? Find its middle.' },
  { label: 'How many comparisons does it take to find 77?', answer: num(B77.steps.length, 'comparisons?'), feedback: 'Keep going until the middle item is 77. Count every item checked.' },
], ['An ordered list has 101 items. Why can binary search skip about 50 of them after just one check?', 'The middle item shows which side the target is on. The other side cannot hold it, so it is thrown away.'],
  listPic('', T11)));

// ---------------------------------------------------------------- activity 1: Search Lab, middle, levels 1 to 2
steps.push(embed('activity-1', 'Activity 1: Find the Middle', 'search-lab', 'Activity 1: Find the Middle',
  '<strong>What to do:</strong> the values are hidden. Click the item binary search checks, then say what happens next. A mistake means the round does not count. <strong>Done</strong> when you have passed level 2.',
  ['Why are the values hidden until you check them?', 'So you must follow the method. You cannot just look for the target.'], 'activity=middle&level=1&upto=2'));

// ---------------------------------------------------------------- compare: same list, both searches
const L66 = linear(S15, 66), L3 = linear(S15, 3), B3 = binary(S15, 3);
assert(L66 === 13 && B66.steps.length === 4 && L3 === 1 && B3.steps.length === 4, 'compare values');
const ord = (b) => Object.fromEntries(b.steps.map((s, k) => [s.mid, k + 1]));
steps.push({ id: 'compare-searches', label: 'Compare: Linear and Binary',
  content: '<h2 class="lesson-h2">Compare: Linear and Binary</h2>' +
    tps('The target is 66. Predict: how many comparisons for a linear search? For a binary search? Why so different?',
      `<p>Linear: ${L66} comparisons (index 1 to 13). Binary: ${B66.steps.length} comparisons (${B66.steps.map((s) => s.value).join(', ')}).</p><p>Linear throws away one item each time. Binary throws away about half of what is left.</p>`, 'Show the worked answer') +
    listPic('', S15, { order: ord(B66) }) +
    facts(['The Check row shows the order binary search checks items.', 'Both searches find 66. Only the number of comparisons is different.']) });

const BIG = [1000, 1000000].map((n) => [n, worst(n)]);
assert(BIG[0][1] === 10 && BIG[1][1] === 20, 'worst cases');
steps.push({ id: 'compare-start', label: 'Compare: When Linear Wins',
  content: '<h2 class="lesson-h2">Compare: When Linear Wins</h2>' +
    tps('Same list. The target is 3, at index 1. Predict: which search makes fewer comparisons now? Why?',
      `<p>Linear: <strong>${L3}</strong>, it checks index 1 first. Binary: <strong>${B3.steps.length}</strong> (${B3.steps.map((s) => s.value).join(', ')}).</p><p>A target near the start is lucky for linear search. On a long list, binary search is almost always faster.</p>`, 'Show the worked answer') +
    columns(listPic('', S15, { order: ord(B3) }),
      table(BIG.map(([n, b]) => [n.toLocaleString('en-GB'), n.toLocaleString('en-GB'), String(b)]), ['Items in order', 'Linear: at most', 'Binary: at most'])) +
    facts(['Binary search halves what is left, so 1,000 items need at most 10 comparisons.', 'Linear search works on any list. Binary search needs ordered data.']) });

// ---------------------------------------------------------------- hinge: ordered data
steps.push(mcStep('hinge-order', 'Hinge Question: Which Search?', 'Hinge Question: Which Search?', 'Choose the best answer.', [
  { prompt: 'Which list can a binary search be used on?', options: ['5, 14, 9, 20, 31', '31, 5, 20, 9, 14', '5, 9, 14, 20, 31', '9, 5, 14, 31, 20'], correct: 2,
    explain: 'Binary search needs the data in order. Only 5, 9, 14, 20, 31 goes from smallest to largest.' },
  { prompt: 'A list of 500 names is NOT in order. Which search should be used?', options: ['Binary search', 'Linear search', 'Either: both work', 'Neither: it cannot be searched'], correct: 1,
    explain: 'Linear search checks every item in turn, so order does not matter. Binary search would throw away the wrong half.' },
], ['Two students search the same list and get different numbers of comparisons. Why might that happen?', 'They may have used different searches, or counted in different ways. Agree the method and what counts as one comparison first.']));

// ---------------------------------------------------------------- activity 2: Search Lab race
steps.push(embed('activity-2', 'Activity 2: Linear or Binary?', 'search-lab', 'Activity 2: Linear or Binary?',
  '<strong>What to do:</strong> predict how many comparisons each search makes, then run both. Both numbers must be right. <strong>Done</strong> when you have passed level 3.',
  ['Why predict before you run the searches?', 'If your prediction is wrong, the numbered checks show you exactly where your method went wrong.'], 'activity=race'));

// ---------------------------------------------------------------- written questions (AI-marked)
steps.push(selfMarked('exam-describe', 'Exam-Style Question: Describe a Binary Search', 'Exam-Style Question: Describe a Binary Search',
  'Answer in full sentences. This part has 3 marks: give three different steps.', [
    { id: 'describe-binary', prompt: 'Describe how a binary search finds a value in a list. [3]', marks: 3,
      scheme: ['The list must be in order / sorted', 'Compare the middle item with the target', 'If the middle item is the target, stop / it is found',
        'If the target is smaller, keep the left half / discard the right half', 'If the target is bigger, keep the right half / discard the left half',
        'Repeat with the half that is left, until it is found or nothing is left (not in the list)'],
      guidance: 'One mark for each point, up to 3. Points 4 and 5 may be made together as one point about discarding the half the target cannot be in, for one mark. Do not accept "it checks every item" or "it splits the list" with no comparison with the middle item.',
      modelAnswer: 'The list must be in order. Compare the middle item with the target. If it is not the target, throw away the half it cannot be in, and repeat with the half that is left.' },
  ], ['This part has 3 marks. How do you plan the answer?', 'Write three different steps, in the order the algorithm does them. One clear step earns one mark.']));
steps.push(selfMarked('exam-compare', 'Exam-Style Question: Compare the Searches (1 of 2)', 'Exam-Style Question: Compare the Searches (1 of 2)',
  'Give a reason, not just one word.', [
    { id: 'binary-faster', prompt: 'Give one reason why a binary search is usually faster than a linear search. [1]', marks: 1,
      scheme: ['Each comparison discards / halves the items that are left (linear search removes only one item)', 'It needs fewer comparisons on a long list'],
      guidance: 'One mark for either point. Do not accept "it is quicker" or "it is faster" with no reason.',
      modelAnswer: 'Each comparison throws away half of the items that are left.' },
  ], ['Why does "it is faster" on its own not earn the mark?', 'The mark is for the reason. Say what the search does that makes the difference.']));
steps.push(selfMarked('exam-compare-2', 'Exam-Style Question: Compare the Searches (2 of 2)', 'Exam-Style Question: Compare the Searches (2 of 2)',
  'Give a reason, not just one word.', [
    { id: 'linear-instead', prompt: 'Give one reason why a linear search might be used instead. [1]', marks: 1,
      scheme: ['The data is not in order / is unsorted (binary search needs ordered data)', 'The list is very short / the target is near the start'],
      guidance: 'One mark for either point. Do not accept "it is easier" with no reason.',
      modelAnswer: 'The data is not in order, and a binary search only works on ordered data.' },
  ], ['Why is "it is easier" not enough for the mark?', 'It gives no reason. Say what is true about the data or the list that makes the other search a better choice.']));

// ---------------------------------------------------------------- activity 3: Search Lab, middle, levels 3 to 4
steps.push(embed('activity-3', 'Activity 3: Search Without Help', 'search-lab', 'Activity 3: Search Without Help',
  '<strong>What to do:</strong> longer lists, and the target may not be in the list. Level 4 has no Low and High marks and no help. <strong>Done</strong> when you have passed level 4.',
  ['How do you know a target is not in the list?', 'When nothing is left to check. Every part it could be in has been thrown away.'], 'activity=middle&level=3&upto=4'));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Binary Search Drill', 'drill-y9-2-4-binary-search', 'Plenary: Binary Search Drill',
  '<strong>What to do:</strong> answer every card. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.',
  ['Why does each card use a new list?', 'If you can search any list, you really know the method, not just one answer.']));

// ---------------------------------------------------------------- lesson self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, '25') && !V('do-now', 0, '3') && V('do-now', 1, '5') && V('do-now', 1, 'index 5') && V('do-now', 2, '10') && !V('do-now', 2, '32'), 'do-now');
for (const ok of ['2, 4', '2 4', '2 and 4', '2,4', '2 then 4']) assert(V('do-now-2', 0, ok), 'do-now-2 accepts ' + ok);
for (const bad of ['17', '2', '4', '17, 17', '2, 4, 6']) assert(!V('do-now-2', 0, bad), 'do-now-2 rejects ' + bad);
assert(V('do-now-2', 1, '6') && V('do-now-2', 1, '6 times') && !V('do-now-2', 1, '2'), 'do-now-2 b');
assert(V('check-linear', 0, '6') && V('check-linear', 1, '10 comparisons') && V('check-linear', 2, '1') && !V('check-linear', 1, '0'), 'check-linear');
assert(V('check-middle', 0, '6') && V('check-middle', 1, '9') && V('check-middle', 2, '7') && !V('check-middle', 2, '8') && !V('check-middle', 2, '7.5'), 'check-middle');
assert(V('check-binary', 0, '6') && V('check-binary', 1, '9') && V('check-binary', 2, '3') && !V('check-binary', 2, '10'), 'check-binary');
{ const t1 = WT1.steps.map((x) => x.text).join(' '), v1 = WT1.steps.map((x) => x.visual).join(' ');
  assert(!/\b(25|10|18)\b/.test(t1 + v1) && !/\b5\b/.test(t1), 'walkthrough 1 shows a Do Now answer'); }
{ const t2 = WT2.steps.map((x) => x.text + x.visual).join(' ');
  assert(!/\b(17|6)\b/.test(t2) && !/2, 4|2 and 4/.test(t2), 'walkthrough 2 shows a Do Now answer'); }
const mcCorrect = steps.filter((s) => s.type === 'multiple-choice').flatMap((s) => s.items.map((i) => i.correct));
assert(new Set(mcCorrect).size > 1, 'MC correct positions vary');
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it (the Do Now and title are before any teaching and use none of them).
const text = (s) => JSON.stringify([s.content, s.items || '', s.stepperSteps || '', s.walkthrough || '']);
const firstAt = (rx) => steps.findIndex((s) => rx.test(text(s)));
const at = (id) => steps.findIndex((s) => s.id === id);
assert(firstAt(/comparison/i) === at('linear'), 'comparison before it is taught');
assert(firstAt(/linear search/i) === at('linear'), 'linear search before it is taught');
assert(firstAt(/\bordered\b|in order/i) === at('compare-order'), 'ordered before it is taught');
assert(firstAt(/binary search/i) === at('binary-steps') || firstAt(/binary search/i) === at('title'), 'binary search before it is taught');
assert(firstAt(/\bLow\b/) === at('middle-rule'), 'Low before it is taught');
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV)\b/.test(all), 'a construct Year 9 has not met');
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'em or en dash');
assert(!/mario/i.test(all), 'game mention');

const lesson = { id: ID, label: '2.4: Binary Search', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ================================================================= the drills
function DRILL_EXT() {
// Year 9, 2.4 Do Now Extension: arrays (2.3), loops (2.2) and following code (3.1).
// Loaded by Drills/index.html?drill=y9-2-4-ext
// Generated by tools/build_y9_2_4.mjs: edit that, then run it.
// Every card has an `example`, a similar question worked through with different values, and two `working` nudges.
// An example never shows the card's own answer. Program answers come from shared/pseudocode-engine.js.
DrillData.register("y9-2-4-ext", {
  title: "Year 9 Extension: Arrays, Loops and Tracing",
  subtitle: "2.4 Do Now Extension",
  choiceOnly: true,
  categories: [
    ["ex-arrays", "Arrays (2.3)"],
    ["ex-loops", "Loops (2.2)"],
    ["ex-trace", "Following Code (3.1)"]
  ],
  cards: (function () {
    var A = "←";
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    function run(lines, arr, inputs) {
      var src = lines.slice();
      if (arr) {
        var at = 0; while (!/ARRAY/.test(src[at])) at++;
        Array.prototype.splice.apply(src, [at + 1, 0].concat(arr.vals.map(function (v, i) { return arr.name + "[" + (i + 1) + "] <- " + v; })));
      }
      var r = PseudocodeEngine.runPseudocode(src.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + src.join("\n"));
      return r.outputs.map(String);
    }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) + 2, Number(ans) - 1, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function distinct(n, from, to) { var o = []; while (o.length < n) { var v = drillRange(from, to); if (o.indexOf(v) === -1) o.push(v); } return o; }
    function arrText(name, vals) { return name + " holds: " + vals.map(function (v, i) { return "[" + (i + 1) + "] " + v; }).join(", "); }
    function avoid(make, example) {
      var c, tries = 0;
      do { c = make(); tries++; } while (tries < 60 && new RegExp("(^|[^0-9A-Za-z])" + c.answers[0] + "($|[^0-9A-Za-z])").test(example));
      c.example = example;
      return c;
    }
    return [
      { id: "ex-01", category: "ex-arrays", randomize: function () {
          var ex = "Example: Marks holds [1] 8, [2] 20, [3] 4, [4] 11.\nMarks[2] means: go to index 2 and read the value there.\nMarks[2] is 20.";
          return avoid(function () {
            var vals = distinct(6, 21, 95), k = drillRange(1, 6), ans = vals[k - 1];
            return { prompt: "What is the value of Nums[" + k + "]?\n" + arrText("Nums", vals), answers: [String(ans)], keywords: [drillNumberRe(ans)],
              distractors: others(ans, [vals[k % 6], vals[(k + 4) % 6], k]),
              working: ["The number in the square brackets is the index: the position.", "Go to that index and read the value stored there."], note: "Nums[" + k + "] is " + ans + "." };
          }, ex);
        } },
      { id: "ex-02", category: "ex-arrays", randomize: function () {
          var ex = "Example: Marks holds 30, 18, 72, 41, 66, 90, 25, 59, 63, 77.\nWhich index holds 63? Find 63, then count its position from the start.\n63 is the ninth value, so it is at index nine.";
          return avoid(function () {
            var vals = distinct(6, 21, 95), k = drillRange(1, 6);
            return { prompt: "Which index holds " + vals[k - 1] + "?\n" + arrText("Nums", vals), answers: [String(k)], keywords: [new RegExp("^\\s*(index\\s*)?" + k + "\\s*\\.?\\s*$", "i")],
              distractors: others(k, [k + 1, k - 1, 7 - k]).filter(function (d) { return +d >= 1 && +d <= 6; }).concat(["7"]).slice(0, 3),
              working: ["Find the value first.", "The index is its position number, from 1."], note: vals[k - 1] + " is at index " + k + "." };
          }, ex);
        } },
      { id: "ex-03", category: "ex-arrays", randomize: function () {
          var ex = "Example: Marks holds [1] 8, [2] 20, [3] 4, [4] 11.\nMarks[1] + Marks[3]: read each element first.\n8 + 4 = 12.";
          return avoid(function () {
            var vals = distinct(5, 2, 40), i = drillRange(1, 5), j; do { j = drillRange(1, 5); } while (j === i);
            var ans = vals[i - 1] + vals[j - 1];
            return { prompt: "What is Nums[" + i + "] + Nums[" + j + "]?\n" + arrText("Nums", vals), answers: [String(ans)], keywords: [drillNumberRe(ans)],
              distractors: others(ans, [i + j, vals[i - 1] + j, i + vals[j - 1]]),
              working: ["Read the value at each index.", "Then add the two values, not the two indexes."], note: vals[i - 1] + " + " + vals[j - 1] + " = " + ans + "." };
          }, ex);
        } },
      { id: "ex-04", category: "ex-arrays", randomize: function () {
          var ex = "Example: count the values more than 50 in 72, 15, 50, 91.\n72 yes, 15 no, 50 no (equal is not more), 91 yes.\nTwo values count, so it outputs two.";
          return avoid(function () {
            var vals = distinct(6, 1, 40), k = drillRange(12, 28);
            var lines = ["DECLARE Nums : ARRAY[1:6] OF INTEGER", "DECLARE Index : INTEGER", "DECLARE Count : INTEGER", "Count <- 0", "FOR Index <- 1 TO 6", "    IF Nums[Index] > " + k + " THEN", "        Count <- Count + 1", "    ENDIF", "NEXT Index", "OUTPUT Count"];
            var o = run(lines, { name: "Nums", vals: vals })[0];
            return { prompt: "What does this program output?\n" + arrText("Nums", vals) + "\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
              distractors: others(o, [6 - Number(o), Number(o) + 1, 6]),
              working: ["Check each value: is it more than " + k + "?", "Count only the TRUE ones. Equal is not more."], note: "The program counts " + o + " values more than " + k + "." };
          }, ex);
        } },
      { id: "ex-05", category: "ex-loops", randomize: function () {
          var ex = "Example: FOR Count " + A + " 10 TO 12.\nCount takes 10, 11, 12.\nThat is 12 - 10 + 1 = 3 passes.";
          return avoid(function () {
            var a = drillRange(2, 6), b = a + drillRange(2, 7), n = b - a + 1;
            var lines = ["DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    OUTPUT Count", "NEXT Count"];
            return { prompt: "How many times does this loop run?\n" + show(numbered(lines)), answers: [String(n)], keywords: [new RegExp("^\\s*" + n + "\\s*(times?)?\\s*\\.?\\s*$", "i")],
              distractors: others(n, [n - 1, b, b - a - 1]),
              working: ["List the values Count takes, from the first number to the last.", "Count them. Both ends count."], note: "Count goes " + a + " to " + b + ": " + n + " passes." };
          }, ex);
        } },
      { id: "ex-06", category: "ex-loops", randomize: function () {
          var ex = "Example: Total " + A + " 0, then FOR Count " + A + " 1 TO 3, Total " + A + " Total + Count.\n0 + 1 = 1, 1 + 2 = 3, 3 + 3 = 6.\nIt outputs 6.";
          return avoid(function () {
            var a = drillRange(2, 6), b = a + drillRange(2, 3);
            var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- " + a + " TO " + b, "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
            var o = run(lines)[0];
            return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
              distractors: others(o, [b, Number(o) - a, Number(o) + b]),
              working: ["Total starts at 0. Each pass adds the value of Count.", "Write Total after every pass."], note: "Total adds " + a + " to " + b + ": " + o + "." };
          }, ex);
        } },
      { id: "ex-07", category: "ex-loops", randomize: function () {
          var ex = "Example: look for 9 in 30, 12, 9.\nThe third value is 9: TRUE, so it outputs the index, three.\nThe loop outputs the INDEX, not the value.";
          return avoid(function () {
            var vals = distinct(6, 10, 60), k = drillRange(2, 6), t = vals[k - 1];
            var lines = ["DECLARE Nums : ARRAY[1:6] OF INTEGER", "DECLARE Index : INTEGER", "FOR Index <- 1 TO 6", "    IF Nums[Index] = " + t + " THEN", "        OUTPUT Index", "    ENDIF", "NEXT Index"];
            var o = run(lines, { name: "Nums", vals: vals })[0];
            return { prompt: "What does this program output?\n" + arrText("Nums", vals) + "\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
              distractors: [String(t), String(k === 6 ? 1 : 6), String(k === 2 ? 3 : k - 1)],
              working: ["Check each element in turn: is it " + t + "?", "Line 5 outputs Index: the position, not the value."], note: t + " is at index " + o + "." };
          }, ex);
        } },
      { id: "ex-08", category: "ex-trace", randomize: function () {
          var ex = "Example: A " + A + " 3, B " + A + " A, A " + A + " 8, OUTPUT B.\nB got a copy of 3. Changing A later does not change B.\nIt outputs 3.";
          return avoid(function () {
            var a = drillRange(4, 9), b = drillRange(2, 6);
            var lines = ["DECLARE X : INTEGER", "DECLARE Y : INTEGER", "X <- " + a, "Y <- X", "X <- X + " + b, "OUTPUT Y"];
            var o = run(lines)[0];
            return { prompt: "Follow this program exactly. What does it output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
              distractors: others(o, [a + b, b, 0]),
              working: ["Line 4 copies the value X holds now.", "Does line 5 change Y, or only X?"], note: "Y is a copy of " + a + ". Line 5 changes only X." };
          }, ex);
        } },
      { id: "ex-09", category: "ex-trace", randomize: function () {
          var ex = "Example: Hot " + A + " 0. IF Temp > 25 THEN Hot " + A + " Hot + 1. Typed: 25, 19, 32.\n25 > 25 is FALSE: equal is not more. 19 FALSE. 32 TRUE.\nOnly one day counts.";
          return avoid(function () {
            var k = drillRange(30, 60), typed = [k, k + drillRange(3, 20), k - drillRange(3, 20), k, k + drillRange(1, 9)].sort(function () { return Math.random() - 0.5; });
            var lines = ["DECLARE Score : INTEGER", "DECLARE Count : INTEGER", "DECLARE Wins : INTEGER", "Wins <- 0", "FOR Count <- 1 TO 5", "    INPUT Score", "    IF Score > " + k + " THEN", "        Wins <- Wins + 1", "    ENDIF", "NEXT Count", "OUTPUT Wins"];
            var o = run(lines, null, typed)[0];
            return { prompt: "The user types " + typed.join(", ") + ". What does the program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
              distractors: others(o, [Number(o) + 2, 5, Number(o) + 1]),
              working: ["Check each number against line 7.", "Is " + k + " more than " + k + "? Equal is not more."], note: "Only the scores more than " + k + " count: " + o + "." };
          }, ex);
        } },
      { id: "ex-10", category: "ex-trace", randomize: function () {
          var ex = "Example: FOR Count " + A + " 1 TO 3, then Total " + A + " 0 INSIDE the loop, then Total " + A + " Total + Count.\nEvery pass starts again at 0, so only the last Count is left.\nIt outputs 3.";
          return avoid(function () {
            var a = drillRange(2, 5), b = a + drillRange(2, 4);
            var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    Total <- 0", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
            var o = run(lines)[0], sum = 0; for (var c = a; c <= b; c++) sum += c;
            return { prompt: "This program should add up " + a + " to " + b + ". Follow it exactly. What does it output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
              distractors: others(o, [sum, 0, b - 1]),
              working: ["Line 4 is inside the loop. When does it run?", "What is Total just after the last pass?"], note: "Total goes back to 0 every pass, so it ends as " + o + "." };
          }, ex);
        } }
    ];
  })()
});
}

function DRILL_PLENARY() {
// Year 9, 2.4: Binary Search (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-2-4-binary-search
// Generated by tools/build_y9_2_4.mjs: edit that, then run it.
// Four categories, mirroring the lesson: linear search, the middle, binary search step by step, and comparing them.
// The searches are worked out exactly as the lesson teaches: Middle = (Low + High) / 2 rounded down, the middle
// item is thrown away too, one comparison per item checked, linear search stops when it finds the target.
DrillData.register("y9-2-4-binary-search", {
  title: "Year 9, 2.4: Binary Search",
  subtitle: "Linear search, the middle, binary search step by step, and comparing them",
  choiceOnly: true,
  categories: [
    ["bs-lin", "Linear Search"],
    ["bs-mid", "The Middle"],
    ["bs-run", "Binary Search Steps"],
    ["bs-cmp", "Compare the Searches"]
  ],
  cards: (function () {
    function sorted(n) { var o = []; while (o.length < n) { var v = drillRange(2, 99); if (o.indexOf(v) === -1) o.push(v); } return o.sort(function (a, b) { return a - b; }); }
    function shuffled(list) { var o = list.slice(); for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; } return o; }
    function missing(list) { var s = list.slice().sort(function (a, b) { return a - b; }), g = []; for (var i = 0; i + 1 < s.length; i++) for (var v = s[i] + 1; v < s[i + 1]; v++) g.push(v); return drillPick(g); }
    function binary(list, target) {
      var low = 1, high = list.length, steps = [];
      while (low <= high) {
        var mid = Math.floor((low + high) / 2);
        steps.push({ low: low, high: high, mid: mid, value: list[mid - 1] });
        if (list[mid - 1] === target) return { steps: steps, at: mid };
        if (target < list[mid - 1]) high = mid - 1; else low = mid + 1;
      }
      return { steps: steps, at: 0 };
    }
    function linear(list, target) { var i = list.indexOf(target); return i === -1 ? list.length : i + 1; }
    function listText(list) { return "Index: " + list.map(function (v, i) { return i + 1; }).join(" ") + "\nValue: " + list.join(" "); }
    function showList(list) { return list.map(function (v, i) { return "[" + (i + 1) + "] " + v; }).join(", "); }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) - 1, Number(ans) + 2, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 1 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function numRe(n, words) { return new RegExp("^\\s*(index\\s*)?" + n + "\\s*(" + (words || "comparisons?") + ")?\\s*\\.?\\s*$", "i"); }
    return [
      // ------------------------------------------------ Linear Search
      { id: "p-lin-count", category: "bs-lin", randomize: function () {
          var list = shuffled(sorted(9)), k = drillRange(3, 9), t = list[k - 1];
          return { prompt: "A linear search looks for " + t + ". How many comparisons does it make?\n" + showList(list), answers: [String(k)], keywords: [numRe(k)],
            distractors: others(k, [k - 1, 9, k + 1]),
            working: ["Linear search starts at index 1 and checks each item in turn.", "It stops at the target. Count the target too."],
            note: t + " is at index " + k + ", so " + k + " comparisons." };
        } },
      { id: "p-lin-miss", category: "bs-lin", randomize: function () {
          var n = drillRange(7, 12), list = shuffled(sorted(n)), t = missing(list);
          return { prompt: "A linear search looks for " + t + ". How many comparisons does it make?\n" + showList(list), answers: [String(n)], keywords: [numRe(n)],
            distractors: others(n, [0, n - 1, 1]),
            working: ["Is " + t + " in the list?", "When does a linear search stop if the target is never found?"],
            note: t + " is not in the list, so all " + n + " items are checked." };
        } },
      { id: "p-lin-why", category: "bs-lin", pickThenType: true,
        prompt: "Why can a linear search be used on a list that is not in order?",
        answers: ["It checks every item in turn, so the order does not matter"],
        keywords: [/^(?=.*\b(every|each|all|in\s+turn|one\s+(by|at\s+a)\s+one?|one\s+at\s+a\s+time)\b)(?=.*\b(order|sorted|matter|matters)\b)/i],
        distractors: ["It always checks the middle item first", "It throws away half of the list each time", "It puts the list in order before it starts"],
        working: ["Which items does a linear search check?", "Does it ever skip an item because of where it is?"],
        note: "Linear search checks each item in turn, so it never needs the list in order." },
      // ------------------------------------------------ The Middle
      { id: "p-mid-calc", category: "bs-mid", randomize: function () {
          var low = drillRange(3, 14), high = low + drillRange(1, 14), m = Math.floor((low + high) / 2), odd = (low + high) % 2;
          return { prompt: "Low = " + low + " and High = " + high + ". Which index does binary search check?", answers: [String(m)], keywords: [numRe(m, "")],
            distractors: others(m, [odd ? m + 1 : m - 1, low + high, high - low]),
            working: ["Middle = (Low + High) / 2.", "Not a whole number? Round down."],
            note: "(" + low + " + " + high + ") / 2 = " + (low + high) / 2 + (odd ? ", rounded down: " + m : "") + "." };
        } },
      { id: "p-mid-first", category: "bs-mid", randomize: function () {
          var n = drillRange(9, 16), list = sorted(n), t = drillPick(list), m = Math.floor((1 + n) / 2);
          return { prompt: "A binary search looks for " + t + " in this list of " + n + " items. Which index does it check first?\n" + listText(list), answers: [String(m)], keywords: [numRe(m, "")],
            distractors: others(m, [1, m + 1, list.indexOf(t) + 1 === m ? m - 1 : list.indexOf(t) + 1]),
            working: ["Low = 1 and High = " + n + ".", "Middle = (Low + High) / 2, rounded down."],
            note: "(1 + " + n + ") / 2 = " + (1 + n) / 2 + ((1 + n) % 2 ? ", rounded down: " + m : "") + "." };
        } },
      { id: "p-mid-next", category: "bs-mid", randomize: function () {
          var list, t, b;
          do { list = sorted(drillRange(11, 16)); t = drillPick(list); b = binary(list, t); } while (b.steps.length < 3);
          var s = b.steps[1], first = b.steps[0];
          return { prompt: "A binary search looks for " + t + ". It checks index " + first.mid + " (" + first.value + ") first. Which index does it check next?\n" + listText(list),
            answers: [String(s.mid)], keywords: [numRe(s.mid, "")],
            distractors: others(s.mid, [first.mid + 1, first.mid - 1, Math.floor((1 + s.high) / 2) === s.mid ? Math.floor((s.low + list.length) / 2) : Math.floor((1 + s.high) / 2)]),
            working: ["Is " + t + " smaller or bigger than " + first.value + "? Which part is left?", "The middle item goes too. Find Low and High of the part that is left, then its middle."],
            note: "The part left is index " + s.low + " to " + s.high + ". (" + s.low + " + " + s.high + ") / 2 gives index " + s.mid + "." };
        } },
      { id: "p-mid-why", category: "bs-mid", pickThenType: true,
        prompt: "Why must the list be in order for a binary search to work?",
        answers: ["So one check shows which half the target must be in"],
        keywords: [/^(?=.*\b(half|halves|part|side|left|right)\b)(?=.*\b(must|can\s+only|could|know|knows|tell|tells|shows?|which|throw|thrown|discard|ignore|skip)\b)/i],
        distractors: ["So the middle item is always the target", "So the computer can check every item", "So it can start at index 1 each time"],
        working: ["After checking the middle, binary search throws part of the list away.", "How does it know which part the target cannot be in?"],
        note: "In ordered data, a target smaller than the middle can only be to the left, and a bigger one only to the right." },
      // ------------------------------------------------ Binary Search Steps
      { id: "p-run-count", category: "bs-run", randomize: function () {
          var list, t, b;
          do { list = sorted(drillRange(12, 15)); t = drillPick(list); b = binary(list, t); } while (b.steps.length < 3);
          var c = b.steps.length;
          return { prompt: "A binary search looks for " + t + ". How many comparisons does it make?\n" + listText(list), answers: [String(c)], keywords: [numRe(c)],
            distractors: others(c, [list.indexOf(t) + 1, c - 1, c + 1]),
            working: ["Check the middle. Keep the part " + t + " must be in. Repeat.", "Count every item checked, the target too."],
            note: "It checks " + b.steps.map(function (s) { return s.value; }).join(", ") + ": " + c + " comparisons." };
        } },
      { id: "p-run-miss", category: "bs-run", randomize: function () {
          var list = sorted(drillPick([7, 15])), t = missing(list), b = binary(list, t), c = b.steps.length;
          return { prompt: "A binary search looks for " + t + ". It is not in the list. How many comparisons before nothing is left?\n" + listText(list), answers: [String(c)], keywords: [numRe(c)],
            distractors: others(c, [list.length, c - 1, c + 1]),
            working: ["Do the search as normal: middle, then keep one part.", "Stop when no items are left. Count every item checked."],
            note: "It checks " + b.steps.map(function (s) { return s.value; }).join(", ") + ", then nothing is left: " + c + " comparisons." };
        } },
      { id: "p-run-values", category: "bs-run", randomize: function () {
          var list, t, b;
          do { list = sorted(11); t = drillPick(list); b = binary(list, t); } while (b.steps.length !== 3);
          var vals = b.steps.map(function (s) { return s.value; }), ans = vals.join(", ");
          var wrongA = list.slice(0, list.indexOf(t) + 1).slice(-3).join(", "), wrongB = [vals[0], list[b.steps[1].mid] || vals[1] + 1, t].join(", "), wrongC = [list[Math.floor(list.length / 2)], vals[1], t].join(", ");
          var ds = [wrongA, wrongB, wrongC, [vals[0], t].join(", "), [vals[1], vals[0], t].join(", ")].filter(function (d, i, all) { return d !== ans && all.indexOf(d) === i; }).slice(0, 3);
          return { prompt: "A binary search looks for " + t + ". Which values does it check, in order? Type them with commas.\n" + listText(list), answers: [ans],
            keywords: [new RegExp("^\\s*" + vals.join("\\s*(,|and|then|\\s)\\s*") + "\\s*\\.?\\s*$", "i")], distractors: ds,
            working: ["First middle: (1 + 11) / 2.", "Then the middle of the part that is left, until you reach " + t + "."],
            note: "It checks " + ans + "." };
        } },
      { id: "p-run-keep", category: "bs-run", randomize: function () {
          var list = sorted(9), m = 5, mv = list[4], smaller = Math.random() < 0.5;
          var t = smaller ? drillPick(list.slice(0, 4)) : drillPick(list.slice(5));
          var ans = smaller ? "The left part" : "The right part";
          return { prompt: "A binary search looks for " + t + ". The middle item is " + mv + ". Which part does it keep?\n" + listText(list), answers: [ans],
            keywords: [smaller ? /^\s*(the\s+)?(left|first|lower|smaller)(\s+(part|half|side))?\s*\.?\s*$/i : /^\s*(the\s+)?(right|second|upper|bigger|higher)(\s+(part|half|side))?\s*\.?\s*$/i],
            distractors: [smaller ? "The right part" : "The left part", "Both parts", "Only the middle item"],
            working: ["Is " + t + " smaller or bigger than " + mv + "?", "The list is in order: smaller values are on the left."],
            note: t + " is " + (smaller ? "smaller" : "bigger") + " than " + mv + ", so it can only be in the " + (smaller ? "left" : "right") + " part." };
        } },
      // ------------------------------------------------ Compare the Searches
      { id: "p-cmp-which", category: "bs-cmp", randomize: function () {
          var list = sorted(15), kind = drillPick(["lin", "bin", "bin"]), t, b, l;
          do { t = drillPick(list); b = binary(list, t).steps.length; l = linear(list, t); } while (kind === "lin" ? !(l < b) : !(b < l));
          var ans = l < b ? "Linear search" : "Binary search";
          return { prompt: "Both searches look for " + t + ". Which one makes fewer comparisons?\n" + listText(list), answers: [ans],
            keywords: [l < b ? /^\s*(the\s+)?linear(\s+search)?\s*\.?\s*$/i : /^\s*(the\s+)?binary(\s+search)?\s*\.?\s*$/i],
            distractors: [l < b ? "Binary search" : "Linear search", "They make the same number", "Neither can find it"],
            working: ["Checking from index 1: count up to the target.", "Checking middles: count each middle until the target."],
            note: "Linear: " + l + ". Binary: " + b + "." };
        } },
      { id: "p-cmp-big", category: "bs-cmp", randomize: function () {
          var n = drillPick([100, 500, 1000, 2000]), w = 0, k = n; while (k > 0) { w++; k = Math.floor(k / 2); }
          var askLin = Math.random() < 0.4, ans = askLin ? n : w;
          return { prompt: "A list of " + n + " items is in order. The target is not in it. How many comparisons does a " + (askLin ? "linear" : "binary") + " search make?",
            answers: [String(ans)], keywords: [numRe(ans)],
            distractors: askLin ? [String(w), String(n / 2), String(n - 1)] : [String(n), String(n / 2), String(w + 3)],
            working: [askLin ? "A linear search stops only when it finds the target or runs out of items." : "Each comparison halves the items that are left: " + n + ", then about " + Math.floor(n / 2) + ", then " + Math.floor(n / 4) + "...", "Count until nothing is left."],
            note: "Linear: all " + n + ". Binary: at most " + w + "." };
        } },
      { id: "p-cmp-why", category: "bs-cmp", pickThenType: true,
        prompt: "Why is a binary search usually faster than a linear search on a long ordered list?",
        answers: ["Each comparison throws away half of the items that are left"],
        keywords: [/^(?=.*\b(half|halves|halved|halving)\b)(?=.*\b(throw|throws|thrown|discard|discards|remove|removes|cut|cuts|rid|away|left|each|every|out)\b)/i],
        distractors: ["It checks every item, one at a time", "It always starts at index 1", "It puts the list in order first"],
        working: ["How many items does one linear comparison rule out?", "How many does one binary comparison rule out?"],
        note: "Linear search rules out one item per comparison. Binary search rules out about half of what is left." }
    ];
  })()
});
}

const DRILL_DIR = path.join(ROOT, 'Drills', 'data');
function writeDrill(id, fn) {
  const src = fn.toString();
  const body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}')).replace(/^\r?\n/, '').replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  assert(!/[–—]|&mdash;|&ndash;/.test(body), `em or en dash in ${id}`);
  fs.writeFileSync(path.join(DRILL_DIR, id + '.js'), body);
  return body;
}
const drillSrc = { 'y9-2-4-ext': writeDrill('y9-2-4-ext', DRILL_EXT), 'y9-2-4-binary-search': writeDrill('y9-2-4-binary-search', DRILL_PLENARY) };

// Load each drill as the page does and draw every card many times.
const registered = {};
const ctx = vm.createContext({ console, Math, JSON, DrillData: { register: (id, d) => { registered[id] = d; } } });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
for (const [id, src] of Object.entries(drillSrc)) vm.runInContext(src, ctx, { filename: id + '.js' });
const typedMatch = (card, s) => (card.keywords || []).some((k) => k.test(s));
for (const id of Object.keys(drillSrc)) {
  const d = registered[id];
  assert(d && d.cards.length, id + ' registered');
  for (const card of d.cards) {
    for (let t = 0; t < (card.randomize ? 300 : 1); t++) {
      const c = card.randomize ? { ...card, ...card.randomize() } : card;
      const where = `${id} ${card.id}`;
      assert(c.prompt && c.answers && c.answers.length && c.keywords && c.keywords.length, where + ' fields');
      assert(typedMatch(c, c.answers[0]), `${where}: own answer "${c.answers[0]}" fails its keywords`);
      assert(c.distractors && c.distractors.length === 3, `${where}: three distractors (${c.distractors})`);
      for (const x of c.distractors) assert(!typedMatch(c, x) && x !== c.answers[0], `${where}: distractor "${x}" passes`);
      assert(c.working && c.working.length === 2, where + ' two working nudges');
      if (id === 'y9-2-4-ext') {
        assert(c.example, where + ' example');
        const ans = String(c.answers[0]).toLowerCase();
        assert(!new RegExp('(^|[^a-z0-9])' + ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(c.example.toLowerCase()) || ans.length < 1, `${where}: example contains the answer ${ans}`);
      }
      const ansRe = new RegExp('(^|[^\\w.-])' + String(c.answers[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w|\\.\\d)', 'i');
      if (!ansRe.test(c.prompt)) for (const w of c.working) assert(!ansRe.test(w), `${where}: working shows the answer: ${w}`);
    }
  }
}
// Why cards: two connected ideas pass, half an idea fails.
{
  const card = (cid) => registered['y9-2-4-binary-search'].cards.find((c) => c.id === cid);
  const ok = (cid, s) => typedMatch(card(cid), s);
  for (const s of ['it checks every item so order does not matter', 'It looks at each one in turn, it does not need them sorted', 'it checks all of them so the order doesnt matter']) assert(ok('p-lin-why', s), 'lin-why accepts ' + s);
  for (const s of ['it checks every item', 'order', 'it is simple']) assert(!ok('p-lin-why', s), 'lin-why rejects ' + s);
  for (const s of ['so it knows which half the target is in', 'so it can throw away the half it cannot be in', 'one check tells you which side it must be on']) assert(ok('p-mid-why', s), 'mid-why accepts ' + s);
  for (const s of ['so it works', 'it is sorted', 'to find the middle']) assert(!ok('p-mid-why', s), 'mid-why rejects ' + s);
  for (const s of ['each comparison throws away half the list', 'it halves the items left every time', 'it cuts the list in half each check']) assert(ok('p-cmp-why', s), 'cmp-why accepts ' + s);
  for (const s of ['it is faster', 'fewer comparisons', 'half']) assert(!ok('p-cmp-why', s), 'cmp-why rejects ' + s);
}

// ================================================================= register the lesson after 2.3
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const allL = JSON.parse(raw);
const indent = (raw.match(/\n( +)"/) || [, ' '])[1];
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const y9 = allL.years.find((y) => y.id === 'year9');
const unit = y9.units.find((u) => u.title === 'Algorithm Design and Text Programming');
assert(unit, 'the 2.x unit exists');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y9-2-3-arrays') + 1, 0, ID);
fs.writeFileSync(lp, JSON.stringify(allL, null, indent).replace(/\n/g, nl) + (/\r?\n$/.test(raw) ? nl : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; drills: ` +
  Object.entries(registered).map(([k, d]) => `${k} (${d.cards.length})`).join(', ') + `; unit: ${unit.lessons.join(', ')}`);
