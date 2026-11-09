// Builds LessonData/y11-1-7-overflow.json: Year 11, 1.7: Overflow (syllabus 0478 1.1: understand the concept of
// overflow and why it occurs in binary addition). The seventh lesson of the 2026-27 Year 11 plan, after y11-1-6-binadd.
//   node tools/build_y11_1_7_overflow.mjs
// It also writes the lesson's three drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-6-binadd (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: copied from tools/build_y11_1_6_binadd.mjs (same pictures, marking and walkthroughs), one idea per slide,
// a teacher-only Think, Pair, Share under every heading, predict-then-check, compare slides.
// Real questions, each value checked below against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:   0478/11 June 2023 Q1(d) (10010100); 0478/12 June 2024 Q3(c) (10010110) (1.6 recap)
//   Exam:     0478/12 March 2025 Q1(c) (C); 0478/13 June 2023 Q1(d) (1 0001 1111); 0478/12 November 2023 Q2(e)
//             (1 0010 1111); 0478/13 November 2024 Q1(d) (1 1010 1111); 0478/12 November 2025 Q2(a) (1 0010 1110);
//             0478/11 June 2026 Q3(f) (1 1000 1101); written: 0478/11 June 2023 Q1(e), 0478/12 June 2025 Q1(f)
// Marking of the overflow additions, as the mark schemes split their 4 marks: 1 for the carries (the carry row, 8 digits,
// 7 without the right-hand 0, or 9 with the overflow carry in front), 2 for the 8 bits (one per nibble), 1 for the
// overflow bit (the 9-bit answer).
// Drills: y11-1-6-add reused for the Do Now Extension; y11-1-7-spot (Activity 1), y11-1-7-add (Activity 2),
// y11-1-7-overflow (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-7-overflow';
const P = 'y11-17o';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- number work, done in code
const val = (b) => [...b].reduce((t, c) => t * 2 + (c === '1' ? 1 : 0), 0);
const pvs = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const bin8 = (n) => n.toString(2).padStart(8, '0');
const sumText = (b) => pvs(b.length).filter((_, i) => b[i] === '1').join(' + ');
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
// The 9-bit answer is written 1 then two nibbles, as the mark schemes write it.
const sp9 = (b) => b[0] + ' ' + spaced(b.slice(1));
// Binary addition, column by column from the right. carry[i] is the carry INTO column i (the right column's is 0).
function add(a, b) {
  const n = a.length, s = Array(n), c = Array(n);
  let k = 0;
  for (let i = n - 1; i >= 0; i--) { c[i] = k; const t = +a[i] + +b[i] + k; s[i] = t % 2; k = t > 1 ? 1 : 0; }
  return { sum: s.join(''), carry: c.join(''), out: k, count: c.filter((x) => x === 1).length };
}
const xor = (a, b) => [...a].map((c, i) => (c === b[i] ? '0' : '1')).join('');
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*(=\\s*)?${[...b].join('\\s*')}${BIN_TAIL}`;
// The carry row: 7 digits (no right-hand 0), 8 digits, or 9 with the overflow carry written in front.
const carryAns = (c) => { const d = (s) => [...s].join('\\s*'); return `^\\s*(${d(c.slice(0, 7))}(\\s*0)?|1\\s*${d(c)})\\s*\\.?\\s*$`; };

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
const OUTSIDE = ';border:2px dashed var(--bad, var(--danger, #b42318));color:var(--bad, var(--danger, #b42318))';
function bitTable(bits, { hl = [], n = bits ? bits.length : 8, label = true } = {}) {
  const w = 46, f = 18, th = TH(w, f - 4);
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (hl.includes(i) ? HL : bits && bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const head = `<tr>${lab('Place value')}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>`;
  const body = bits ? `<tr>${lab('Bit')}${[...bits].map((c, i) => `<td style="${td(i)}">${c}</td>`).join('')}</tr>` : '';
  return `<table style="border-collapse:collapse;margin:0 auto">${head}${body}</table>`;
}
// Column addition (as 1.6): place values, the carry row, the two numbers, the answer. done = how many columns from the
// right are finished; hl = columns to mark. of = true adds the 256 column outside the 8-bit register (dashed), where the
// carry out of the 128 column lands.
function addTable(a, b, { done = a.length, hl = [], label = true, of = false } = {}) {
  const n = a.length, r = add(a, b), w = 42, th = TH(w, 14);
  const base = `padding:4px 3px;min-width:${w}px;text-align:center;border:1px solid var(--line-strong)`;
  const mark = (i) => (hl.includes(i) ? HL : '');
  const lab = (t, extra = '') => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0${extra}">${t}</th>` : '';
  const carryShown = (i) => i >= n - done - 1 && r.carry[i] === '1';
  const ansShown = (i) => i >= n - done;
  const outShown = of && done >= n && r.out === 1;
  const ofHead = of ? `<th style="${th}${OUTSIDE}">256</th>` : '';
  const ofCell = (t, h, f, extra = '') => of ? `<td style="${base};height:${h}px;font:700 ${f}px var(--font-mono, monospace)${OUTSIDE}${extra}${hl.includes(-1) ? HL : ''}">${t}</td>` : '';
  const head = `<tr>${lab('Place value')}${ofHead}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>`;
  const carry = `<tr>${lab('Carry')}${ofCell(outShown ? '1' : '', 24, 15)}${[...a].map((_, i) => `<td style="${base};height:24px;font:700 15px var(--font-mono, monospace);color:var(--brand-dark)${mark(i)}">${carryShown(i) ? '1' : ''}</td>`).join('')}</tr>`;
  const row = (bits, t) => `<tr>${lab(t)}${ofCell('', 30, 20)}${[...bits].map((c, i) => `<td style="${base};height:30px;font:700 20px var(--font-mono, monospace)${mark(i)}">${c}</td>`).join('')}</tr>`;
  const ans = `<tr>${lab('Answer', ';border-top:3px solid var(--ink, currentColor)')}${ofCell(outShown ? '1' : '', 30, 20, ';border-top:3px solid var(--ink, currentColor)')}${[...r.sum].map((c, i) => `<td style="${base};height:30px;border-top:3px solid var(--ink, currentColor);font:700 20px var(--font-mono, monospace)${mark(i)}">${ansShown(i) ? c : ''}</td>`).join('')}</tr>`;
  return `<table style="border-collapse:collapse;margin:0 auto">${head}${carry}${row(a, '')}${row(b, '+')}${ans}</table>`;
}
const big = (t) => `<div style="text-align:center;${MONO};font-size:30px;font-weight:700;letter-spacing:3px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const box = (t) => `<div style="display:grid;gap:6px;padding:10px 12px;border-radius:10px;background:var(--surface-2)">${t}</div>`;
const boxTitle = (t) => `<div style="font-weight:700;font-size:17px">${t}</div>`;
const boxLine = (t) => `<div style="font-size:16px">${t}</div>`;
const verdict = (t, good) => `<div style="font-weight:700;font-size:17px;${good ? 'color:var(--good)' : 'color:var(--bad, var(--danger, #b42318))'}">${t}</div>`;
const monoLine = (t) => `<div style="text-align:center;${MONO};font-size:22px;font-weight:700">${t}</div>`;
const grid = (items, n = 2) => `<div style="display:grid;grid-template-columns:repeat(${n}, minmax(0, 1fr));gap:8px">${items.join('')}</div>`;

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ, extra = '', gridN = 0) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    const lab = parts.length > 1 ? `(${s}) ${p.label}` : p.label;
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">${lab} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const gridStyle = gridN ? ` style="display:grid;grid-template-columns:repeat(${gridN}, minmax(0, 1fr));column-gap:28px"` : '';
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses"${gridStyle}>${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, heading, lead, items, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + extra + `<div id="${cid}"></div>`, items };
}
// A written exam part, AI-marked against the real mark scheme points (as y11-1-5-hexuse).
function written(id, label, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${cid}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
const steps = [];
const cap = (t) => t[0].toUpperCase() + t.slice(1);

// Walk me through it on a similar addition (1.6's walkthrough). With of = true the last column's carry goes to the
// dashed 256 column and the overflow steps follow.
function wtAdd(a, b, of = false) {
  const r = add(a, b), n = a.length, pv = pvs(n);
  const out = [
    { text: `<strong>A similar question.</strong> Add the two 8-bit binary numbers ${a} and ${b} using binary addition.`, visual: big(`${a} + ${b}`) },
    { text: 'Write one number under the other, each bit under its place value. Leave a row above for the carries.', visual: addTable(a, b, { done: 0, of }) },
  ];
  for (let k = 1; k <= n; k++) {
    const i = n - k, cin = +r.carry[i], ones = +a[i] + +b[i] + cin;
    const what = `${a[i]} + ${b[i]}${cin ? ' + the carry 1' : ''}`;
    const res = ones === 0 ? 'no 1s: write 0.' : ones === 1 ? 'one 1: write 1.' :
      ones === 2 ? `two 1s make 10: write 0, and carry 1 to the ${pv[i] * 2} column.` : `three 1s make 11: write 1, and carry 1 to the ${pv[i] * 2} column.`;
    out.push({ text: `The ${pv[i]} column: ${what}. ${cap(res)}`, visual: addTable(a, b, { done: k, hl: i === 0 && of && r.out ? [0, -1] : [i], of }) });
  }
  if (of) {
    out.push({ text: `The carry out of the 128 column goes to the 256 column. The register has no 256 column: this is ${kw('overflow')}.`, visual: addTable(a, b, { hl: [-1], of }) });
    out.push({ text: `The register keeps only the 8 bits ${spaced(r.sum)} = ${val(r.sum)}. The real total is ${val(a)} + ${val(b)} = ${val(a) + val(b)}, which is greater than 255.`, visual: line(kw(`${val(a)} + ${val(b)} = ${val(a) + val(b)} &gt; 255`)) });
    out.push({ text: `With the overflow bit in front, the answer is the 9 bits ${sp9('1' + r.sum)}.`, visual: line(kw(sp9('1' + r.sum))) });
    out.push({ text: 'Now do the same for the question. Type the carry row, the 8 bits the register keeps, then the 9 bits with the overflow bit in front.', visual: note('right to left &nbsp; carry out of 128 &rarr; overflow bit') });
  } else {
    out.push({ text: `Check in denary: ${val(a)} + ${val(b)} = ${val(a) + val(b)}, and ${spaced(r.sum)} = ${val(r.sum)}. The carry row is ${r.carry}.`, visual: line(kw(`${val(a)} + ${val(b)} = ${val(r.sum)}`)) });
    out.push({ text: 'Now do the same for the question. Start at the right, write each carry, then type the carry row and the answer.', visual: note('right to left &nbsp; two 1s &rarr; 0, carry 1 &nbsp; three 1s &rarr; 1, carry 1') });
  }
  return { title: of ? 'Walk me through it: binary addition with overflow' : 'Walk me through it: binary addition', steps: out };
}
const CARRY_FB = 'Each time a column makes 10 or 11, write 1 above the next column on the left. Type all 8 digits, left to right, 0 where there is no carry.';
const SUM_FB = 'Start at the right. Count the 1s in each column, with any carry. Two 1s: write 0, carry 1. Three 1s: write 1, carry 1.';

// ---------------------------------------------------------------- Do Now (1.6): 0478/11 June 2023 Q1(d), 0478/12 June 2024 Q3(c)
// Mark schemes: 10010100 with 4 carries; 10010110 with 2 carries (checked in the 1.6 builder and again here).
const DONOW = [
  { a: '00110011', b: '01100001', ms: '10010100', carries: 4, ref: '0478/11, June 2023, Question 1(d)',
    lead: 'Two 8-bit binary numbers are given. Add the two 8-bit binary numbers using binary addition. Give your answer in binary. Show all your working.',
    wt: ['00101101', '01010110'], whyQ: ['Why do we line the two numbers up under the same place values?', 'Only bits worth the same can be added together, like adding tens to tens in denary.'] },
  { a: '00110000', b: '01100110', ms: '10010110', carries: 2, ref: '0478/12, June 2024, Question 3(c)',
    lead: 'The two binary integers 00110000 and 01100110 are added together. Add the binary integers using binary addition and show your answer in binary. Show all your working.',
    wt: ['01001011', '00110101'], whyQ: ['Why does a column with a 0 in both numbers still need checking?', 'A carry may be coming in from the right, and then the column has a 1 in it.'] },
];
DONOW.forEach((q, i) => {
  const r = add(q.a, q.b);
  assert(r.out === 0 && r.sum === q.ms && r.count === q.carries, `${q.ref} matches its mark scheme`);
  Object.assign(q, r);
  const id = i ? 'do-now-2' : 'do-now';
  steps.push(checkStep(id, `Do Now: Binary Addition (${i + 1} of 2)`, `Do Now: Binary Addition (${i + 1} of 2)`,
    'Recap of 1.6 Binary Addition. ' + cite(q.ref) + ' ' + q.lead, [
      { label: 'Carry row (8 digits: 1 for a carry, 0 for none)', answer: carryAns(q.carry), feedback: CARRY_FB },
      { label: 'Answer in binary', answer: binFull(q.sum), feedback: SUM_FB, marks: 2 },
    ], q.whyQ, addTable(q.a, q.b, { done: 0 })));
  steps[steps.length - 1].walkthrough = wtAdd(...q.wt);
});

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-6-add', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these 8-bit sums from 1.6. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Overflow',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Overflow</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> spot when an addition causes <strong>overflow</strong>.', 'Explain overflow in an <strong>8-bit register</strong>.', 'Why the stored answer is wrong.']) +
    why('Why might a sum be too big for a computer to store?', 'The computer stores each number in a fixed number of bits, and big numbers need more bits.') });

// ---------------------------------------------------------------- 0 to 255
steps.push(mcStep('predict-max', 'Predict: The Biggest 8-bit Number', 'Predict: The Biggest 8-bit Number', 'Predict, then check.', [
  { prompt: 'What is the largest denary number that 8 bits can store?', options: ['255', '256', '128'], correct: 0,
    explain: 'Make every bit 1: 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. 256 needs a 9th bit.' },
], ['Why is 111 the largest 3-bit number? What is it in denary?', 'Every bit is 1, so nothing bigger fits in 3 bits. 4 + 2 + 1 = 7.']));

steps.push(concept('concept-range', 'An 8-bit Register: 0 to 255',
  'Why can 8 bits not store 256?',
  '<p>The largest 8-bit number is all 1s: 255. 256 is one more, and it needs a 9th bit: 1 0000 0000.</p>',
  columns(facts(['A <strong>register</strong> is a store in the CPU with a fixed number of bits.', 'An <strong>8-bit register</strong> holds 0 to <strong>255</strong>.',
    'All 1s: 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255.', 'Anything greater than 255 needs <strong>more than 8 bits</strong>.']),
    '<div style="display:grid;gap:8px">' + box(boxTitle('Smallest') + monoLine('0000 0000 = 0')) + box(boxTitle('Largest') + bitTable('11111111') + line('= <strong>255</strong>')) +
    box(boxTitle('One more: 256') + monoLine('1 0000 0000') + boxLine('9 bits: it does not fit.')) + '</div>')));

// ---------------------------------------------------------------- where does the carry go?
const EX200 = ['11001000', '01100100'];
const ex200 = add(...EX200);
assert(val(EX200[0]) === 200 && val(EX200[1]) === 100 && ex200.out === 1 && val(ex200.sum) === 44, '200 + 100');
steps.push(mcStep('predict-carry', 'Predict: Where Does the Carry Go?', 'Predict: Where Does the Carry Go?', `200 + 100 in an 8-bit register. The 128 column has 1 + 0 + a carry of 1.`, [
  { prompt: 'The 128 column makes 10. Where does its carry go?', options: ['Nowhere: the register has no 9th bit', 'Into the 1 column', 'The register grows to 9 bits'], correct: 0,
    explain: 'The register has exactly 8 bits. The carry out of the 128 column has no column to go into, so it is lost.' },
], ['Why does a carry normally go to the column on its left?', 'The next column is worth double, so one 1 there is worth the two 1s.'],
  addTable(...EX200, { done: 7 })));

steps.push(concept('concept-overflow', 'What Is Overflow?',
  'The carry out of the 128 column is worth 256. Why can an 8-bit register not keep it?',
  '<p>It would need a 9th bit, worth 256. The register only has 8 bits, so the bit is lost.</p>',
  columns(facts(['<strong>Overflow</strong>: the result is <strong>greater than 255</strong>, so it needs <strong>more than 8 bits</strong>.',
    'The carry out of the left column has nowhere to go: the register is <strong>8-bit</strong>.', 'The register keeps only the right-hand 8 bits.', 'The answer it stores is <strong>wrong</strong>.']),
    '<div style="display:grid;gap:8px">' + addTable(...EX200, { of: true }) + line('The dashed 256 column is <strong>outside</strong> the register.') +
    line(`Needed: <strong>${sp9('1' + ex200.sum)}</strong> (9 bits)`) + '</div>')));

steps.push(concept('compare-wrong', 'Compare: Why Is the Stored Answer Wrong?',
  '200 + 100 = 300. Why does the register not show 300?',
  `<p>300 needs 9 bits. The 9th bit, worth 256, is lost, so the register shows 300 - 256 = ${val(ex200.sum)}.</p>`,
  facts(['Check in <strong>denary</strong>: add the two numbers. Greater than 255? Overflow.', 'The lost bit is worth <strong>256</strong>, so the stored value is 256 too small.']) +
  columns(box(boxTitle('The real total: 9 bits') + monoLine(sp9('1' + ex200.sum)) + boxLine(`256 + ${val(ex200.sum)} = <strong>300</strong>`) + verdict('Right, but it does not fit.', true)),
    box(boxTitle('The 8-bit register') + monoLine(spaced(ex200.sum)) + boxLine(`${sumText(ex200.sum)} = <strong>${val(ex200.sum)}</strong>`) + verdict(`Wrong: ${val(ex200.sum)} is not 300.`, false)))));

// 0478/12 March 2025 Q1(c). Mark scheme: C.
steps.push(mcStep('exam-mc', 'Exam Question: The Definition of Overflow', 'Exam Question: The Definition of Overflow',
  cite('0478/12, March 2025, Question 1(c)') + ' Binary addition can result in overflow. Tick one box to show the correct definition of overflow in binary addition.', [
    { prompt: 'Which is the correct definition of overflow in binary addition?', options: ['The answer has created a negative number that cannot be represented in binary addition.',
      'The answer is the result of a logical shift that cannot be performed in binary addition.', 'The answer is too large to represent in the number of bits available.',
      'The answer is too small to represent in the number of bits available.'], correct: 2,
    explain: 'Overflow: the answer is too large for the number of bits, for example greater than 255 in 8 bits.' },
  ], ['Why read all four options before you tick one?', 'Two options can look alike. Only one has exactly the right meaning.']));

// ---------------------------------------------------------------- how to spot it
const EXN = ['10001100', '01011010'], EXY = ['10001100', '01111000'];
const exn = add(...EXN), exy = add(...EXY);
assert(exn.out === 0 && val(EXN[0]) + val(EXN[1]) === 230 && exy.out === 1 && val(EXY[0]) + val(EXY[1]) === 260, 'spot examples');
steps.push(concept('concept-spot', 'Compare: How to Spot Overflow',
  'Why does a carry out of the 128 column mean the total is more than 255?',
  '<p>That carry is worth 256 on its own, and 256 is already more than 255.</p>',
  facts(['<strong>Binary:</strong> a carry out of the leftmost (128) column means overflow.', '<strong>Denary:</strong> the sum is greater than 255 means overflow. Both checks always agree.']) +
  columns(box(boxTitle('140 + 90 = 230') + addTable(...EXN, { label: false, of: true }) + verdict('No carry out. 230 is not greater than 255: no overflow.', true)),
    box(boxTitle('140 + 120 = 260') + addTable(...EXY, { label: false, of: true }) + verdict('Carry out. 260 is greater than 255: overflow.', false)))));

// Overflow Lab (pages OverflowLab/, registry overflow-lab): lesson mode shows only the first two stages and posts
// BC_APP_RESULT, so the slide saves the student's progress.
steps.push({ ...embed('activity-lab', 'Activity: Overflow Lab', 'overflow-lab', 'Activity: Overflow Lab',
  'Work through Will it fit? and Watch and predict. Press Watch it to see any answer again. Done when both stages show mastered.',
  ['Why does the register store a smaller number when a carry leaves the 128 column?', 'That carry is worth 256. The register cannot keep it, so the stored value is 256 less.']),
  embedQuery: 'stages=fit,watch' });

steps.push(embed('activity-1', 'Activity 1: Overflow or Not?', 'drill-y11-1-7-spot', 'Activity 1: Overflow or Not?',
  'Decide: overflow or not? Then what the register keeps. Get each card right 3 times in a row.',
  ['Why can you check for overflow without doing the whole binary addition?', 'Convert both numbers to denary and add. Greater than 255 means it cannot fit.']));

// ---------------------------------------------------------------- exam questions: additions with overflow
// Mark schemes (9-bit answer; carries in the 8 columns): 0478/13 June 2023 Q1(d) 1 0001 1111, 2;
// 0478/12 November 2023 Q2(e) 1 0010 1111; 0478/13 November 2024 Q1(d) 1 1010 1111; 0478/12 November 2025 Q2(a)
// 1 0010 1110, "4 or 5 correct carries" (4 here, 5 with the overflow carry); 0478/11 June 2026 Q3(f) 1 1000 1101,
// "three correct carries".
const REALOF = [
  { a: '11101110', b: '00110001', ms: '100011111', carries: 2, ref: '0478/13, June 2023, Question 1(d)',
    lead: 'Add the two 8-bit binary numbers 11101110 and 00110001 using binary addition. Give your answer in binary. Show all your working.' },
  { a: '11100011', b: '01001100', ms: '100101111', ref: '0478/12, November 2023, Question 2(e)',
    lead: 'The number 01001100 is added to 11100011. Add the two 8-bit binary numbers, using binary addition. Give your answer in binary. Show all your working.' },
  { a: '11100011', b: '11001100', ms: '110101111', ref: '0478/13, November 2024, Question 1(d)',
    lead: 'Binary integers can be added together. Add the two binary integers using binary addition. Show all your working. Give your answer in binary.' },
  { a: '11110101', b: '00111001', ms: '100101110', carries: 4, ref: '0478/12, November 2025, Question 2(a)',
    lead: 'Two binary numbers are stored in a computer. Add the two binary numbers using binary addition. Give your answer in binary. Show all of your working.' },
  { a: '10011101', b: '11110000', ms: '110001101', carries: 3, ref: '0478/11, June 2026, Question 3(f)',
    lead: 'Add the binary numbers 10011101 and 11110000 using binary addition. Give your answer in binary. Show all your working.' },
];
REALOF.forEach((q) => {
  const r = add(q.a, q.b);
  assert(r.out === 1 && val(q.a) + val(q.b) > 255, `${q.ref} overflows`);
  assert('1' + r.sum === q.ms && val(q.ms) === val(q.a) + val(q.b), `${q.ref} matches its mark scheme`);
  if (q.carries) assert(r.count === q.carries, `${q.ref} carries ${r.count}`);
  Object.assign(q, r);
});
// Similar additions for the walkthroughs, never a question's numbers or answer.
const WT_OF = [['11010110', '01101011'], ['10111001', '01110100'], ['11001010', '01011101'], ['10110111', '01101100'], ['11011000', '01011011']];
const OF_WHYS = [
  ['Why do we still write the carries in a sum like this?', 'The carries are the working. The mark scheme gives a mark for them.'],
  ['Why does the order of the two numbers not change the answer?', 'Adding gives the same total either way round.'],
  ['Why can a column never send more than one carry to the left?', 'The most a column can have is three 1s. That makes 11, so only one 1 moves left.'],
  ['Why does one slip in a column change the columns to its left?', 'A wrong column can send the wrong carry, and every column to its left adds it in.'],
  ['Why must each column wait for the column on its right?', 'The carry from the right is part of that column\'s count of 1s.'],
];
const OVER_FB = 'Put the carry out of the 128 column in front of the 8 bits: 9 bits in all.';
function ofStep(q, i) {
  const id = `exam-${i + 1}`;
  steps.push(checkStep(id, `Exam Question: Overflow (${i + 1} of ${REALOF.length})`, `Exam Question: Overflow (${i + 1} of ${REALOF.length})`,
    cite(q.ref) + ' ' + q.lead, [
      { label: 'Carry row (8 digits: 1 for a carry, 0 for none)', answer: carryAns(q.carry), feedback: CARRY_FB },
      { label: 'The 8 bits the register keeps', answer: binFull(q.sum), feedback: SUM_FB, marks: 2 },
      { label: 'The answer with the overflow bit (9 bits)', answer: binFull('1' + q.sum), feedback: OVER_FB },
    ], OF_WHYS[i], addTable(q.a, q.b, { done: 0 })));
  steps[steps.length - 1].walkthrough = wtAdd(...WT_OF[i], true);
}
ofStep(REALOF[0], 0);
ofStep(REALOF[1], 1);
steps.push(embed('activity-2', 'Activity 2: Add and Spot the Overflow', 'drill-y11-1-7-add', 'Activity 2: Add and Spot the Overflow',
  'Whole 8-bit sums: the carries, the 8 bits the register keeps, the overflow bit and the value it stores. Most numbers come from real exam papers.',
  ['Why is the value in the register always 256 less than the real total when there is overflow?', 'The lost 9th bit is worth 256.']));

// ---------------------------------------------------------------- explaining overflow
steps.push(concept('concept-explain', 'Compare: Explaining Overflow',
  'Why is "it went wrong" not an explanation?',
  '<p>It says what happened, not why. An explanation gives the reason: the size of the result and the size of the register.</p>',
  facts(['Mark scheme points: the result is <strong>greater than 255</strong> (too large).', 'It needs <strong>more than 8 bits</strong>: it cannot be stored in the <strong>8-bit register</strong>.', '2 marks = 2 different points.']) +
  grid([
    box(boxTitle('Ana') + boxLine('"The result is greater than 255. It needs more than 8 bits."') + verdict('2 marks: two points.', true)),
    box(boxTitle('Lee') + boxLine('"The result is too large."') + verdict('1 mark: one point.', false)),
    box(boxTitle('Sam') + boxLine('"The computer made a mistake."') + verdict('0 marks: no reason.', false)),
  ], 3)));

// 0478/11 June 2023 Q1(e). Mark scheme: two from: the result of the calculation is greater than 255 // the value
// generated is larger than can be stored in the register; the result of the calculation would require more than 8 bits
// to be represented // a register has a predetermined number of bits and there are too many bits for it.
steps.push(written('exam-explain-1', 'Exam Question: Explain Overflow (1 of 2)',
  cite('0478/11, June 2023, Question 1(e)') + ' Two binary numbers are added by a computer and an overflow error occurs.', [
    { id: 'why-overflow', prompt: 'Explain why the overflow error occurred.', marks: 2,
      scheme: ['The result of the calculation is greater than 255 // the value generated is larger than can be stored in the register',
        'The result of the calculation would require more than 8 bits to be represented // a register has a predetermined number of bits and there are too many bits for it'],
      guidance: 'Two from the list, one mark each. The answer must be about the result of the addition being too large for the register or needing more bits than it has. No mark for saying only that the computer made an error or that the numbers were wrong.',
      modelAnswer: 'The result is greater than 255. It needs more than 8 bits.' },
  ], ['Why does an explain question worth 2 marks need two points?', 'Each point earns one mark, so one point can only earn 1 of the 2.']));

ofStep(REALOF[2], 2);
ofStep(REALOF[3], 3);

// 0478/12 June 2025 Q1(f). Mark scheme: any two from: the result is greater than 255 // the result is too large;
// cannot be stored in 8 bits // cannot be stored in the number of bits available for the register.
steps.push(written('exam-explain-2', 'Exam Question: Explain Overflow (2 of 2)',
  cite('0478/12, June 2025, Question 1(f)') + ' An overflow occurs when two other 8-bit binary numbers are added together.', [
    { id: 'why-overflow-occurs', prompt: 'Explain why the overflow error occurs.', marks: 2,
      scheme: ['The result is greater than 255 // the result is too large', 'Cannot be stored in 8 bits // cannot be stored in the number of bits available for the register'],
      guidance: 'Any two from the list, one mark each. The answer must be about the result of the addition. No mark for saying only that the computer made an error.',
      modelAnswer: 'The result is greater than 255, so it cannot be stored in 8 bits.' },
  ], ['Why does the question say "8-bit" binary numbers?', 'The number of bits sets the largest number that can be stored.']));

ofStep(REALOF[4], 4);

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Overflow Drill', 'drill-y11-1-7-overflow', 'Plenary: Overflow Drill',
  'Overflow or not, what the register keeps, the overflow bit, and why it happens. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
DONOW.forEach((q, i) => {
  const id = i ? 'do-now-2' : 'do-now';
  ok(id, 0, [q.carry, q.carry.slice(0, 7), spaced(q.carry)], [xor(q.a, q.b), q.sum, '00000000'].filter((x) => x !== q.carry));
  ok(id, 1, [q.sum, spaced(q.sum), q.sum + ' in binary'], [xor(q.a, q.b), String(val(q.sum)), q.sum.slice(1)]);
});
REALOF.forEach((q, i) => {
  const id = `exam-${i + 1}`;
  ok(id, 0, [q.carry, q.carry.slice(0, 7), spaced(q.carry), '1' + q.carry, '1 ' + spaced(q.carry)], [xor(q.a, q.b), q.sum, '00000000', '1' + q.carry.slice(0, 7), q.carry.slice(1) + '0'].filter((x) => x !== q.carry && x.slice(0, 7) !== q.carry.slice(0, 7)));
  ok(id, 1, [q.sum, spaced(q.sum), q.sum + ' in binary'], ['1' + q.sum, xor(q.a, q.b), String(val(q.sum)), q.sum.slice(1)]);
  ok(id, 2, ['1' + q.sum, sp9('1' + q.sum), '1' + q.sum + ' in binary'], [q.sum, '0' + q.sum, String(val(q.a) + val(q.b)), q.sum + '1']);
});
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
const digitsOf = (o) => plain(JSON.stringify(o)).replace(/(?<=[01]) (?=[01])/g, '');
steps.filter((s) => s.walkthrough).forEach((s) => {
  assert(s.walkthrough.steps.length >= 6, `${s.id} walkthrough is step by step`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
[...DONOW.map((q) => [q, q.wt]), ...REALOF.map((q, i) => [q, WT_OF[i]])].forEach(([q, [a, b]]) => {
  const e = add(a, b), s = steps.find((x) => x.walkthrough && x.validatorKey && V(x.id)[0].pattern.source === carryAns(q.carry));
  [a, b, e.sum, e.carry].forEach((row) => assert(row !== q.sum && row !== q.carry && row !== q.a && row !== q.b, `walkthrough row ${row} for ${q.ref}`));
  const d = digitsOf(s.walkthrough.steps.map((x) => x.text));
  assert(!d.includes(q.sum) && !d.includes(q.carry), `${q.ref} walkthrough text shows the answer or carry row`);
  assert(e.count >= 3 && e.out === (REALOF.includes(q) ? 1 : 0), `walkthrough pair ${a} + ${b}`);
});
{
  const qs = [...DONOW, ...REALOF].flatMap((q) => [q.a, q.b, q.sum]);
  [...EX200, ...EXN, ...EXY, ex200.sum, exn.sum, exy.sum].forEach((b) => assert(!qs.includes(b), `example ${b} is also in a question`));
}
// No term before the slide that teaches it (the title slide only names today's topic). Later topics never.
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/\boverflow/i, 'concept-overflow'], [/\bregisters?\b/i, 'concept-range'],
    [/two.s complement|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b|\bRAM\b/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => assert(s.items.length <= 2 && s.items.every((it) => it.options.length === new Set(it.options).size), `${s.id} items`));
steps.filter((s) => s.validatorKey).forEach((s) => {
  const t = /<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content);
  if (t) V(s.id).forEach((v, i) => assert(!new RegExp(v.pattern.source.replace(/^\^/, '\\b').replace(/\$$/, '\\b'), 'i').test(plain(t[1])), `${s.id} TPS gives part ${i}`));
});
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => {
  const t = plain(/<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content)[1]);
  s.items.forEach((it) => assert(!t.toLowerCase().includes(it.options[it.correct].toLowerCase()), `${s.id} TPS gives the option`));
});

// ---------------------------------------------------------------- drills
const C = (r) => `From Cambridge IGCSE ${r}.`;
const REAL_OF_DRILL = REALOF.map((q) => [q.a, q.b, C(q.ref)]);
// The 1.6 additions that fit in 8 bits (mark schemes checked in the 1.6 builder), for the "no overflow" cards.
const REAL_FIT_DRILL = [
  ['00110011', '01100001', '0478/11, June 2023, Question 1(d)'], ['00110000', '01100110', '0478/12, June 2024, Question 3(c)'],
  ['00110011', '01111000', '0478/13, November 2023, Question 2(e)'], ['10011011', '00010011', '0478/12, March 2025, Question 1(b)'],
  ['01110110', '00110000', '0478/11, November 2025, Question 1(e)'],
].map(([a, b, r]) => { assert(add(a, b).out === 0, `fit ${r}`); return [a, b, C(r)]; });
const INJECT = { REALOF: REAL_OF_DRILL, REALFIT: REAL_FIT_DRILL };
const drillHead = (id, about) => `// Year 11, 1.7: Overflow. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_7_overflow.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => {
  let body = fn.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  return drillHead(id, about) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${body})()\n});\n`;
};

// ---- All three drills share these helpers (each function is copied whole by toString()).
function ofCards(which) {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function val(b) { return parseInt(b, 2); }
  function bin8(n) { return pad(n.toString(2), 8); }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function sp9(b) { return b[0] + " " + sp(b.slice(1)); }
  function add(a, b) { var n = a.length, s = "", cs = [], k = 0; for (var i = n - 1; i >= 0; i--) { cs[i] = k; var t = +a[i] + +b[i] + k; s = (t % 2) + s; k = t > 1 ? 1 : 0; } return { s: s, c: cs.join(""), out: k, count: cs.filter(function (x) { return x === 1; }).length }; }
  function xor(a, b) { return a.split("").map(function (c, i) { return c === b[i] ? "0" : "1"; }).join(""); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*\\.?\\s*$", "i"); }
  function carryRe(c) { var d = function (s) { return s.split("").join("\\s*"); }; return new RegExp("^\\s*(" + d(c.slice(0, 7)) + "(\\s*0)?|1\\s*" + d(c) + ")\\s*\\.?\\s*$"); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?denary)?\\s*\\.?\\s*$", "i"); }
  var YES = /^\s*(yes|y|yes,?\s*(it\s+)?overflows?|yes,?\s*overflow\s+happens|overflow|it\s+overflows)\s*\.?\s*$/i;
  var NO = /^\s*(no|n|no,?\s*(no\s+)?overflow|no,?\s*it\s+does\s+not(\s+overflow)?|no\s+overflow)\s*\.?\s*$/i;
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var REALOF = [] /*REALOF*/;
  var REALFIT = [] /*REALFIT*/;
  function q(real, over) {
    // over: true = must overflow, false = must fit, undefined = either.
    var list = over === false ? REALFIT : over === true ? REALOF : REALOF.concat(REALFIT);
    if (real || Math.random() < 0.6) { var r = drillPick(list); return { a: r[0], b: r[1], r: add(r[0], r[1]), src: " " + r[2] }; }
    var a, b, x, want = over === undefined ? Math.random() < 0.5 : over;
    do { a = bin8(rnd(40, 250)); b = bin8(rnd(20, 250)); x = add(a, b); } while (x.out !== (want ? 1 : 0) || x.count < 3 || a === b);
    return { a: a, b: b, r: x, src: "" };
  }
  function yn(over) { return over ? { answers: ["yes"], keywords: [YES], distractors: ["no"] } : { answers: ["no"], keywords: [NO], distractors: ["yes"] }; }
  function den(p) { return val(p.a) + val(p.b); }
  var SPOTWORK = ["Convert both numbers to denary and add them.", "Is the total greater than 255, the most 8 bits can hold?"];
  var KEEPWORK = ["Add from the right. Count the 1s in each column, with any carry.", "A carry out of the 128 column is lost. Type only the 8 columns."];
  var NINEWORK = ["Add from the right, as usual, all 8 columns.", "The carry out of the 128 column goes in front as a 9th bit."];
  var VALWORK = ["The lost 9th bit is worth double the left-hand place value.", "Take that away from the real denary total."];
  function spotDen() {
    var over = Math.random() < 0.5, a, b; do { a = rnd(60, 240); b = rnd(20, 200); } while ((a + b > 255) !== over || a + b === 255 || a + b === 256);
    return Object.assign({ prompt: "An 8-bit register adds the denary numbers " + a + " and " + b + ". Does overflow happen? Type yes or no." }, yn(over),
      { working: SPOTWORK, note: a + " + " + b + " = " + (a + b) + (over ? ", greater than 255: overflow." : ", not greater than 255: it fits, no overflow.") });
  }
  function spotBin(p) {
    var over = p.r.out === 1;
    return Object.assign({ prompt: "The 8-bit binary numbers " + p.a + " and " + p.b + " are added in an 8-bit register. Does overflow happen? Type yes or no." }, yn(over),
      { working: ["Add from the right, or convert both to denary and add.", "Look at the 128 column: does it send a carry out to the left?"], note: val(p.a) + " + " + val(p.b) + " = " + den(p) + (over ? ": a carry out of the 128 column, overflow." : ": no carry out of the 128 column, no overflow.") + p.src });
  }
  function keepCard(p) {
    var re = binRe(p.r.s);
    return { prompt: "Add the 8-bit binary numbers " + p.a + " and " + p.b + " in an 8-bit register. Give the 8 bits the register keeps.", answers: [sp(p.r.s)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, ["1" + p.r.s, xor(p.a, p.b), bin8(val(p.r.s) ^ 2)]), working: KEEPWORK,
      note: "Carry row " + p.r.c + ". " + (p.r.out ? "Overflow: the carry out of the 128 column is lost. " : "") + "The register keeps " + sp(p.r.s) + "." + p.src };
  }
  function nineCard(p) {
    var a9 = "1" + p.r.s, re = binRe(a9);
    return { prompt: "Add " + p.a + " and " + p.b + " using binary addition. Overflow happens. Give the answer with the overflow bit: 9 bits.", answers: [sp9(a9)], keywords: [re], format: "Type the 9 bits",
      distractors: uniq(re, [p.r.s, "0" + p.r.s, p.r.s + "1"]), working: NINEWORK,
      note: val(p.a) + " + " + val(p.b) + " = " + den(p) + " = " + sp9(a9) + "." + p.src };
  }
  function carryCard(p) {
    var re = carryRe(p.r.c);
    return { prompt: "Add " + p.a + " and " + p.b + ". Type the carry row: 8 digits, left to right, 1 above each column that gets a carry, 0 where there is none.", answers: [p.r.c], keywords: [re], format: "Type 8 digits",
      distractors: uniq(re, [p.r.c.slice(1) + "0", xor(p.a, p.b), "00000000", p.r.s]),
      working: ["Work from the right. The right column never gets a carry.", "Each column that makes two or three 1s puts a carry above the next column on the left."],
      note: "Carry row " + p.r.c + ". The answer is " + (p.r.out ? sp9("1" + p.r.s) + " with the overflow bit." : sp(p.r.s) + ".") + p.src };
  }
  function valBin(p) {
    var v = val(p.r.s), t = den(p);
    return { prompt: "Add " + p.a + " and " + p.b + " in an 8-bit register. Overflow happens. What denary value does the register show?", answers: [String(v)], keywords: [num(v)],
      distractors: drillWrongNumbers(v, [t, 255, v + 1].filter(function (x) { return x !== v; }), 3), working: VALWORK,
      note: val(p.a) + " + " + val(p.b) + " = " + t + ". The lost bit is worth 256: " + t + " - 256 = " + v + ". The register shows " + sp(p.r.s) + "." + p.src };
  }
  function valDen() {
    var a, b; do { a = rnd(130, 250); b = rnd(60, 200); } while (a + b < 262 || a + b > 500);
    var t = a + b, v = t - 256;
    return { prompt: "An 8-bit register adds the denary numbers " + a + " and " + b + ". The total is " + t + ", so overflow happens. What denary value does the register show?", answers: [String(v)], keywords: [num(v)],
      distractors: drillWrongNumbers(v, [t, 255, t - 255].filter(function (x) { return x !== v; }), 3), working: VALWORK,
      note: "The 9th bit, worth 256, is lost: " + t + " - 256 = " + v + "." };
  }
  function why(id, prompt, answer, distractors, note, working) { return { id: id, category: "pl-why", prompt: prompt, answers: [answer], distractors: distractors, note: note, working: working, pickThenType: true }; }
  if (which === "spot") return [
    { id: "sp-01", category: "sp-range", prompt: "What is the largest denary number an 8-bit register can store?", answers: ["255"], keywords: [num(255)], distractors: ["256", "128", "8"],
      working: ["Make every bit a 1.", "Add all the place values from 128 down."], note: "11111111 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255." },
    { id: "sp-02", category: "sp-range", prompt: "Overflow happens and the carry goes out of the 128 column. What place value would that 9th bit have?", answers: ["256"], keywords: [num(256)], distractors: ["255", "129", "512"],
      working: ["Each place value is double the one on its right.", "Double the place value of the left-hand column."], note: "128 x 2 = 256. The register has no 256 column, so the bit is lost." },
    { id: "sp-03", category: "sp-yn", randomize: spotDen },
    { id: "sp-04", category: "sp-yn", randomize: function () { return spotBin(q(false)); } },
    { id: "sp-05", category: "sp-yn", randomize: function () { return spotBin(q(true)); } },
    { id: "sp-06", category: "sp-keep", randomize: valDen },
    { id: "sp-07", category: "sp-keep", randomize: function () { return keepCard(q(false)); } }
  ];
  if (which === "add") return [
    { id: "oa-01", category: "oa-keep", randomize: function () { return keepCard(q(true, true)); } },
    { id: "oa-02", category: "oa-keep", randomize: function () { return keepCard(q(false, true)); } },
    { id: "oa-03", category: "oa-keep", randomize: function () { return nineCard(q(true, true)); } },
    { id: "oa-04", category: "oa-carry", randomize: function () { return carryCard(q(true, true)); } },
    { id: "oa-05", category: "oa-carry", randomize: function () { return spotBin(q(false)); } },
    { id: "oa-06", category: "oa-value", randomize: function () { return valBin(q(true, true)); } },
    { id: "oa-07", category: "oa-value", randomize: function () { return valBin(q(false, true)); } }
  ];
  return [
    // ================================================= Range and spotting
    { id: "pl-01", category: "pl-spot", prompt: "What is the largest denary number an 8-bit register can store?", answers: ["255"], keywords: [num(255)], distractors: ["256", "128", "8"],
      working: ["Make every bit a 1.", "Add all the place values from 128 down."], note: "11111111 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255." },
    { id: "pl-02", category: "pl-spot", randomize: spotDen },
    { id: "pl-03", category: "pl-spot", randomize: function () { return spotBin(q(true)); } },
    { id: "pl-04", category: "pl-spot", randomize: function () { return spotBin(q(false)); } },
    // ================================================= What the register keeps
    { id: "pl-05", category: "pl-keep", randomize: function () { return keepCard(q(true, true)); } },
    { id: "pl-06", category: "pl-keep", randomize: function () { return keepCard(q(false, true)); } },
    { id: "pl-07", category: "pl-keep", randomize: function () { return nineCard(q(true, true)); } },
    { id: "pl-08", category: "pl-keep", randomize: function () { return carryCard(q(true, true)); } },
    { id: "pl-09", category: "pl-value", randomize: function () { return valBin(q(true, true)); } },
    { id: "pl-10", category: "pl-value", randomize: valDen },
    // ================================================= Why
    why("pl-11", "Why does overflow happen when two 8-bit numbers are added?", "The result is greater than 255, so it needs more than 8 bits",
      ["The two numbers are both negative", "The carries were not written down", "The answer is less than 0"],
      "An 8-bit register holds 0 to 255. A result greater than 255 needs a 9th bit, which the register does not have.", ["What is the largest number 8 bits can hold?", "How many bits does a bigger result need?"]),
    why("pl-12", "Why is the value stored in the register wrong after overflow?", "The overflow bit is lost, and it is worth 256",
      ["The register adds an extra 1", "The bits are stored in reverse", "The carries are stored as well"],
      "Only the right-hand 8 bits are kept. The lost bit was worth 256, so the stored value is 256 too small.", ["Which bit does the register not keep?", "What is the place value of that bit?"]),
    why("pl-13", "Why does a carry out of the 128 column show that overflow has happened?", "That carry is worth 256, which is more than 255",
      ["The 128 column is always 0", "It means a carry was missed", "The answer has a 1 in the 128 column"],
      "A carry out of the 128 column goes to a 256 column. 256 is already more than an 8-bit register can hold.", ["What place value is next after 128?", "Compare it with the largest 8-bit number."]),
    why("pl-14", "Why can an 8-bit register not store 256?", "The largest 8-bit number is 255, and 256 needs a 9th bit",
      ["256 is an odd number", "Registers only store numbers below 128", "256 needs only 8 bits"],
      "All eight bits set to 1 make 255. One more needs the next place value, 256: a 9th bit.", ["What do all eight bits set to 1 make?", "Which place value comes after 128?"])
  ];
}
const DRILLS = [
  ['y11-1-7-spot', 'Activity 1: overflow or not, the largest 8-bit number, and the value the register keeps.',
    'Year 11, 1.7: Overflow or Not?', 'Cambridge IGCSE Computer Science 0478',
    [['sp-range', '0 to 255'], ['sp-yn', 'Overflow or Not?'], ['sp-keep', 'What the Register Keeps']], 'spot'],
  ['y11-1-7-add', 'Activity 2: 8-bit additions with overflow, the carry row, the overflow bit and the stored value.',
    'Year 11, 1.7: Add and Spot the Overflow', 'Cambridge IGCSE Computer Science 0478',
    [['oa-keep', 'What the Register Keeps'], ['oa-carry', 'Carries and Overflow'], ['oa-value', 'The Stored Value']], 'add'],
  ['y11-1-7-overflow', 'Plenary: overflow or not, what the register keeps, the overflow bit and why it happens.',
    'Year 11, 1.7: Overflow', 'Cambridge IGCSE Computer Science 0478',
    [['pl-spot', 'Overflow or Not?'], ['pl-keep', 'What the Register Keeps'], ['pl-value', 'The Stored Value'], ['pl-why', 'Why It Happens']], 'plenary'],
];
for (const [id, about, title, subtitle, cats, which] of DRILLS) {
  let body = ofCards.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  const src = drillHead(id, about) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${body})(${JSON.stringify(which)})\n});\n`;
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  { const bad = /two.s complement|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b|\bRAM\b/i.exec(src.split(id).join('')); assert(!bad, `drill ${id} names a later term: ${bad}`); }
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
void drillFile;
// Draw every card many times: its answer passes and is right, no distractor passes, and no working step gives it away.
{
  const vm = await import('node:vm');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids`);
    const seen = { yes: 0, no: 0 };
    for (const card of d.cards) {
      for (let n = 0; n < (card.randomize ? 400 : 1); n++) {
        const r = card.randomize ? { ...card, ...card.randomize() } : card;
        const ans = String(r.answers[0]);
        const bare = ans.replace(/\s+/g, '');
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: working nudges`);
        assert(!/[–—]/.test(JSON.stringify(r)), `${id} ${card.id}: dash`);
        if (r.pickThenType) { r.answers.forEach((a) => assert(!r.distractors.some((x) => x.toLowerCase() === a.toLowerCase()), `${id} ${card.id}: answer is a distractor`)); continue; }
        const pass = (s) => r.keywords.some((k) => k.test(s));
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  ', bare].forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        let m;
        const A = (x, y) => parseInt(x, 2) + parseInt(y, 2);
        if ((m = /binary numbers ([01]{8}) and ([01]{8}) in an 8-bit register\. Give the 8 bits/.exec(r.prompt))) assert(bare.length === 8 && parseInt(bare, 2) === A(m[1], m[2]) % 256, `${id} ${card.id}: keep ${m[1]} + ${m[2]} is not ${ans}`);
        if ((m = /^Add ([01]{8}) and ([01]{8}) using binary addition\. Overflow happens/.exec(r.prompt))) assert(bare.length === 9 && parseInt(bare, 2) === A(m[1], m[2]) && A(m[1], m[2]) > 255, `${id} ${card.id}: nine ${ans}`);
        if ((m = /^Add ([01]{8}) and ([01]{8}) in an 8-bit register\. Overflow happens\. What denary/.exec(r.prompt))) assert(A(m[1], m[2]) > 255 && Number(ans) === A(m[1], m[2]) - 256, `${id} ${card.id}: value ${ans}`);
        if ((m = /denary numbers (\d+) and (\d+)\. The total is (\d+), so overflow happens/.exec(r.prompt))) assert(+m[1] + +m[2] === +m[3] && +m[3] > 255 && Number(ans) === +m[3] - 256, `${id} ${card.id}: value ${ans}`);
        if ((m = /denary numbers (\d+) and (\d+)\. Does overflow happen/.exec(r.prompt))) { assert(ans === (+m[1] + +m[2] > 255 ? 'yes' : 'no'), `${id} ${card.id}: yn ${ans}`); seen[ans]++; }
        if ((m = /binary numbers ([01]{8}) and ([01]{8}) are added in an 8-bit register\. Does overflow/.exec(r.prompt))) { assert(ans === (A(m[1], m[2]) > 255 ? 'yes' : 'no'), `${id} ${card.id}: yn ${ans}`); seen[ans]++; }
        if ((m = /^Add ([01]+) and ([01]+)\. Type the carry row/.exec(r.prompt))) {
          const a = m[1], b = m[2]; let k = 0; const c = [];
          for (let i = a.length - 1; i >= 0; i--) { c[i] = k; k = +a[i] + +b[i] + k > 1 ? 1 : 0; }
          assert(bare === c.join(''), `${id} ${card.id}: carry row of ${a} + ${b} is not ${ans}`);
        }
        if (ans === 'yes' || ans === 'no') { assert(pass(ans === 'yes' ? 'Yes, it overflows' : 'No overflow') && !pass(ans === 'yes' ? 'no overflow' : 'overflow'), `${id} ${card.id}: yes/no variants`); continue; }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (!pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
      }
    }
    if (seen.yes + seen.no) assert(seen.yes > 50 && seen.no > 50, `${id}: yes/no mix ${JSON.stringify(seen)}`);
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario|\bdecimal\b/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '1.7: Overflow', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-6-binadd in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-6-binadd"/.exec(raw);
    assert(m && raw.split('"y11-1-6-binadd"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-6-binadd"').join(`"y11-1-6-binadd",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
