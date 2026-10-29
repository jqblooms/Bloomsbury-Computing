// Builds LessonData/y11-1-3-hex.json: Year 11, 1.3: Hexadecimal Digits (syllabus 0478 1.1: the denary values of the
// hexadecimal digits A to F, and converting hexadecimal to denary). The third lesson of the 2026-27 Year 11 plan,
// after y11-1-2-denary. Denary to hexadecimal and binary to and from hexadecimal (nibbles) are the next lesson, so
// they are not taught or asked here.
//   node tools/build_y11_1_3_hex.mjs
// It also writes the lesson's four drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-2-denary (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: EAL-light, one idea per slide, every slide's core question a WHY (Term 1b), a teacher-only Think, Pair, Share
// under every heading, predict-then-check, compare slides.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers:
//   Do Now:   0478/12 November 2023 Q2(a) (11100011 = 227); 0478/12 November 2024 Q3(b) (15, 180, 235)
//   Exam:     0478/12 March 2025 Q1(a), the hexadecimal gaps except "4 bits" (base 16, A, F; typed, no word list);
//             0478/11 November 2021 Q1(b) (09, 10, 28, A1 = 9, 16, 40, 161);
//             0478/12 November 2021 Q1(b) (05, 20, 1A, AB = 5, 32, 26, 171);
//             0478/13 June 2021 Q1(a)(iii) (29, C8 = 41, 200); 0478/11 November 2022 Q3(c) (022, 0AC = 34, 172);
//             0478/11 June 2025 Q2(c)(i) (02C, 10B = 44, 267); 0478/12 June 2026 Q3(d) (0A2, 104 = 162, 260);
//             0478/12 November 2024 Q3(a)(ii) (two differences, AI marked); 0478/11 June 2025 Q2(b)(ii) (two
//             reasons, AI marked)
//   Drills only: 0478/12 March 2022 Q1(c) (1A = 26)
// Drills: y11-1-3-ext (Do Now Extension), y11-1-3-digits (Activity 1), y11-1-3-convert (Activity 2),
// y11-1-3-hex (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-3-hex';
const P = 'y11-13h';
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

// ---------------------------------------------------------------- binary and hexadecimal, worked out in code
const val = (b) => [...b].reduce((t, c) => t * 2 + (c === '1' ? 1 : 0), 0);
const pvs = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const PV8 = pvs(8);
const bin8 = (n) => n.toString(2).padStart(8, '0');
const onVals = (b) => pvs(b.length).filter((_, i) => b[i] === '1');
const sumText = (b) => onVals(b).join(' + ');
const onIdx = (b) => [...b].map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0);
const hv = (h) => parseInt(h, 16);
const hpv = (n) => Array.from({ length: n }, (_, i) => 16 ** (n - 1 - i));
const LETTERS = { A: 10, B: 11, C: 12, D: 13, E: 14, F: 15 };
// The working for a hexadecimal number: "2 x 16 + 12 x 1" style, with the digit's value.
const hexWork = (h) => { const p = hpv(h.length); return [...h].map((c, i) => `${parseInt(c, 16)} &times; ${p[i]}`).join(' + '); };
const hexSum = (h) => { const p = hpv(h.length); return [...h].map((c, i) => parseInt(c, 16) * p[i]).join(' + '); };
// A number answer: the number (0s on the left allowed), optionally "= " before it or "in denary" after it.
const num = (n) => `^\\s*(=\\s*)?0*${n}(\\s*(in\\s+)?(denary|base\\s*10))?\\s*\\.?\\s*$`;
const letterAns = (L) => `^\\s*${L}\\s*\\.?\\s*$`;
// A binary answer (Do Now 2): the 0s on the left may be left out, as the mark scheme allows ("(0000)1111").
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binAnyAns = (b) => `^\\s*(?:0\\s*)*${[...b.replace(/^0+(?=.)/, '')].join('(?:\\s*)')}${BIN_TAIL}`;
function fitRows(n) {
  let left = n;
  return PV8.map((p) => { const before = left, fits = left >= p; if (fits) left -= p; return { p, before, fits, bit: fits ? '1' : '0', after: left }; });
}

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
function bitTable(bits, { hl = [], n = bits ? bits.length : 8, size = 'lg', label = true } = {}) {
  const w = size === 'lg' ? 58 : 46, f = size === 'lg' ? 22 : 18;
  const th = TH(w, f - 4);
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (hl.includes(i) ? HL : bits && bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const head = `<tr>${lab('Place value')}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>`;
  const body = bits ? `<tr>${lab('Bit')}${[...bits].map((c, i) => `<td style="${td(i)}">${c}</td>`).join('')}</tr>` : '';
  return `<table style="border-collapse:collapse;margin:0 auto">${head}${body}</table>`;
}
function fitTable(n, { hl = -1 } = {}) {
  const rows = fitRows(n);
  const th = TH(46, 14);
  const lab = (t) => `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>`;
  const td = (i, t, mono) => `<td style="padding:5px 4px;min-width:46px;text-align:center;border:1px solid var(--line-strong);${mono ? 'font:700 20px var(--font-mono, monospace)' : 'font-size:16px'}` +
    (i === hl ? HL : '') + `">${t}</td>`;
  return '<table style="border-collapse:collapse;margin:0 auto">' +
    `<tr>${lab('Place value')}${PV8.map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>` +
    `<tr>${lab('Left')}${rows.map((r, i) => td(i, r.before, false)).join('')}</tr>` +
    `<tr>${lab('Bit')}${rows.map((r, i) => td(i, r.bit, true)).join('')}</tr></table>`;
}
// A hexadecimal number under its place values. rows: 'digit' always; 'value' (the digit's denary value) and
// 'worth' (value x place value) when asked. Empty `h` draws the place values only.
function hexTable(h, { n = h ? h.length : 2, hl = [], value = false, worth = false, label = true } = {}) {
  const th = TH(70, 16);
  const tdS = (i, big) => `padding:6px 8px;min-width:70px;text-align:center;border:1px solid var(--line-strong);${big ? 'font:700 26px var(--font-mono, monospace)' : 'font-size:18px'}` + (hl.includes(i) ? HL : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const p = hpv(n);
  let out = `<tr>${lab('Place value')}${p.map((x) => `<th style="${th}">${x}</th>`).join('')}</tr>`;
  if (h) {
    out += `<tr>${lab('Digit')}${[...h].map((c, i) => `<td style="${tdS(i, true)}">${c}</td>`).join('')}</tr>`;
    if (value) out += `<tr>${lab('Value')}${[...h].map((c, i) => `<td style="${tdS(i, false)}">${parseInt(c, 16)}</td>`).join('')}</tr>`;
    if (worth) out += `<tr>${lab('Worth')}${[...h].map((c, i) => `<td style="${tdS(i, false)}">${parseInt(c, 16)} &times; ${p[i]} = ${parseInt(c, 16) * p[i]}</td>`).join('')}</tr>`;
  }
  return `<table style="border-collapse:collapse;margin:0 auto">${out}</table>`;
}
// The 16 hexadecimal digits with their denary values; `from` greys the digits before it.
// The 16 hexadecimal digits, each over its denary value, as cells that wrap on a narrow screen.
function digitTable({ hlLetters = false } = {}) {
  const cell = (c) => `<div style="display:grid;min-width:38px;text-align:center;border:1px solid var(--line-strong);border-radius:6px` + (hlLetters && c in LETTERS ? ';outline:3px solid var(--brand);outline-offset:-3px' : '') + '">' +
    `<div style="padding:4px 2px;font:700 20px var(--font-mono, monospace);background:var(--surface-2)">${c}</div>` +
    `<div style="padding:4px 2px;font-size:17px${hlLetters && c in LETTERS ? ';background:var(--brand-soft);color:var(--brand-dark)' : ''}">${parseInt(c, 16)}</div></div>`;
  return '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">' + '0123456789ABCDEF'.split('').map(cell).join('') + '</div>' +
    '<p style="margin:4px 0 0;text-align:center;font-size:15px;color:var(--muted)">Top: hexadecimal digit. Bottom: denary value.</p>';
}
const big = (t) => `<div style="text-align:center;${MONO};font-size:34px;font-weight:700;letter-spacing:4px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const box = (t) => `<div style="display:grid;gap:6px;padding:10px 12px;border-radius:10px;background:var(--surface-2)">${t}</div>`;
const boxTitle = (t) => `<div style="font-weight:700;font-size:17px">${t}</div>`;
const boxLine = (t) => `<div style="font-size:16px">${t}</div>`;
const verdict = (t, good) => `<div style="font-weight:700;font-size:17px;${good ? 'color:var(--good)' : 'color:var(--bad, var(--danger, #b42318))'}">${t}</div>`;

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ, extra = '', grid = 0) {
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
  const gridStyle = grid ? ` style="display:grid;grid-template-columns:repeat(${grid}, minmax(0, 1fr));column-gap:28px"` : '';
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses"${gridStyle}>${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, heading, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`, items };
}
function selfMarked(id, label, heading, lead, items, whyQ) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
const steps = [];
const sideBits = bitTable(null, { size: 'sm', label: false });
const side2 = hexTable('', { n: 2 });
const side3 = hexTable('', { n: 3 });
const HEX_FB = 'Write each digit\'s value (A = 10 ... F = 15). Multiply it by its place value, then add.';
const hexPart = (h, extra = {}) => Object.assign({ label: h, answer: num(hv(h)), feedback: HEX_FB }, extra);

// ---------------------------------------------------------------- Do Now 1 (1.1): 0478/12 November 2023 Q2(a)
// Mark scheme: 227.
const DN1 = '11100011';
const WT_B = '10010110';
const WT_DN1 = { title: 'Walk me through it: binary to denary', steps: [
  { text: `<strong>A similar question.</strong> A register stores the binary number ${WT_B}. Give the denary number.`, visual: big(WT_B) },
  { text: 'Write the 8 place values. Start at 1 on the right and double each time.', visual: bitTable(null, { size: 'sm' }) },
  { text: 'Write the bits under the place values, one bit in each column.', visual: bitTable(WT_B, { size: 'sm' }) },
  { text: 'Find each <strong>1</strong>. Read the place value above it. Every 0 adds nothing.', visual: bitTable(WT_B, { hl: onIdx(WT_B), size: 'sm' }) + line(onVals(WT_B).join(', ')) },
  { text: `Add those place values: ${sumText(WT_B)} = ${val(WT_B)}.`, visual: line(kw(`${sumText(WT_B)} = ${val(WT_B)}`)) },
  { text: `So ${WT_B} is <strong>${val(WT_B)}</strong> in denary.`, visual: bitTable(WT_B, { hl: onIdx(WT_B), size: 'sm' }) },
  { text: 'Now do the same for the register in the question: place values, find each 1, then add.', visual: note('place values &rarr; find each 1 &rarr; add') },
] };
steps.push(checkStep('do-now', 'Do Now: Binary to Denary (1 of 2)', 'Do Now: Binary to Denary (1 of 2)',
  'Recap of 1.1 Binary Place Values. ' + cite('0478/12, November 2023, Question 2(a)') + ` A register stores the binary number ${DN1}.`, [
    { label: 'Give the denary number for the binary number stored in the register.', answer: num(val(DN1)), feedback: 'Find each 1. Add its place value.' },
  ], ['Why do the place values double each time you move left?', 'Binary is base 2. Each column holds twice as much as the column to its right.'],
  sideBits));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2 (1.2): 0478/12 November 2024 Q3(b)
// Mark scheme: (0000)1111; 10110100; 11101011.
const DN2 = [15, 180, 235];
const WT_N = 202, WT_S = 13;
const WT_DN2 = { title: 'Walk me through it: denary to binary', steps: [
  { text: `<strong>A similar question.</strong> Give the binary number for the denary number ${WT_N}.`, visual: big(String(WT_N)) },
  { text: 'Write the 8 place values. Start at 128 on the left.', visual: bitTable(null, { size: 'sm' }) },
  { text: `Does 128 fit in ${WT_N}? Yes. Write 1. ${WT_N} - 128 = ${WT_N - 128} left.`, visual: line(kw(`${WT_N} - 128 = ${WT_N - 128}`)) },
  { text: `Does 64 fit in ${WT_N - 128}? Yes. Write 1. ${WT_N - 128} - 64 = ${WT_N - 192} left. 32 and 16 are too big: write 0.`, visual: line(kw(`${WT_N - 128} - 64 = ${WT_N - 192}`)) },
  { text: `8 fits in ${WT_N - 192}: write 1, ${WT_N - 200} left. 4 is too big: write 0. 2 fits: write 1, 0 left. 1 is too big for 0: write 0.`, visual: fitTable(WT_N) },
  { text: `So ${WT_N} is <strong>${bin8(WT_N)}</strong>. Check: ${sumText(bin8(WT_N))} = ${WT_N}.`, visual: line(kw(`${sumText(bin8(WT_N))} = ${WT_N}`)) },
  { text: `A small number works the same way. ${WT_S} = 8 + 4 + 1, so it is ${bin8(WT_S)}, or just ${WT_S.toString(2)}.`, visual: bitTable(bin8(WT_S), { hl: onIdx(bin8(WT_S)), size: 'sm' }) },
  { text: 'Now do the same for each number in the question: start at 128, fits: write 1 and subtract, too big: write 0.', visual: note('fits &rarr; 1 and subtract &nbsp; too big &rarr; 0') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Denary to Binary (2 of 2)', 'Do Now: Denary to Binary (2 of 2)',
  'Recap of 1.2 Denary to Binary. ' + cite('0478/12, November 2024, Question 3(b)') + ' Data that is denary can also be converted to binary. Give the binary number for each of the three denary numbers.',
  DN2.map((n) => ({ label: String(n), answer: binAnyAns(bin8(n)), feedback: 'Start at 128. Fits: write 1 and subtract. Too big: write 0.' })),
  ['Why do we start with the biggest place value that fits?', 'Each place value is bigger than all the smaller ones added together, so if it fits it must be used.'],
  '', 3));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-3-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Hexadecimal Digits',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Hexadecimal Digits</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> a third number system, <strong>hexadecimal</strong>.', 'Why it uses the letters <strong>A to F</strong>.', 'How to convert hexadecimal to <strong>denary</strong>.']) +
    why('Binary numbers are long. Why might people want a shorter way to write them?', 'Long strings of 1s and 0s are hard to read and easy to copy wrongly.') });

// ---------------------------------------------------------------- why 16 digits
const baseCard = (name, base, digits) => box(boxTitle(`${name}: base ${base}`) + line(`<span style="${MONO};font-weight:700">${digits}</span>`) + boxLine(`${base} digits. The biggest digit is ${base - 1}.`));
steps.push(concept('concept-digits', 'Why Base 16 Needs 16 Digits',
  'Denary is base 10 and has 10 digits. Binary is base 2 and has 2 digits. Predict: how many digits does base 16 need?',
  '<p>16 digits. A base 16 system needs one digit for every value from 0 up to 15.</p>',
  columns(facts(['The <strong>base</strong> is how many digits a number system has.', '<strong>Denary</strong> is base 10: digits 0 to 9.', '<strong>Binary</strong> is base 2: digits 0 and 1.',
    '<strong>Hexadecimal</strong> is base 16. It needs <strong>16</strong> digits: values 0 to 15.', 'Each digit must be <strong>one symbol</strong>.']),
    '<div style="display:grid;gap:8px">' + baseCard('Binary', 2, '0 1') + baseCard('Denary', 10, '0 1 2 3 4 5 6 7 8 9') + box(boxTitle('Hexadecimal: base 16') + line(`<span style="${MONO};font-weight:700">0 1 2 3 4 5 6 7 8 9 ? ? ? ? ? ?</span>`) + boxLine('16 digits. We have run out of number symbols.')) + '</div>')));

// ---------------------------------------------------------------- why letters
steps.push(concept('concept-letters', 'Why Letters A to F?',
  'We have used up 0 to 9. Why can we not just write 10 for the value ten in one hexadecimal column?',
  '<p>10 is two symbols, a 1 and a 0. It would look like two columns. Each value needs a single symbol, so new symbols are needed.</p>',
  facts(['The values 10 to 15 each need <strong>one</strong> symbol.', 'Hexadecimal uses the letters <strong>A, B, C, D, E, F</strong>.', 'A is 10. Each letter is one more than the letter before it. F is 15.']) +
  '<div style="display:grid;gap:10px;margin-top:6px">' + digitTable({ hlLetters: true }) +
  columns(box(boxTitle('One symbol') + line(`<span style="${MONO};font-weight:700">A</span> = ten`) + verdict('One column: clear.', true)),
    box(boxTitle('Two symbols') + line(`<span style="${MONO};font-weight:700">10</span> = ten?`) + verdict('Looks like two columns: unclear.', false))) + '</div>'));

const CL = ['C', 'E', 'B', 'D'];
steps.push(checkStep('check-letters', 'Check: The Letters A to F', 'Check: The Letters A to F', 'Give the denary value of each hexadecimal digit, from memory.',
  CL.map((L) => ({ label: L, answer: num(LETTERS[L]), feedback: 'A is 10. Count on one for each letter: A, B, C, D, E, F.' })),
  ['Why must every hexadecimal digit be one symbol, not two?', 'Each column holds one digit. Two symbols would look like two columns.'], '', 4));

// 0478/12 March 2025 Q1(a), the hexadecimal gaps. Mark scheme: base 16; (4 bits); A; F.
steps.push(checkStep('exam-1', 'Exam Question: Complete the Sentences', 'Exam Question: Complete the Sentences',
  'Adapted from ' + cite('0478/12, March 2025, Question 1(a)') + ' Complete the sentences about number systems.<br>The hexadecimal number system is base <strong>(a)</strong> ...... The numbers 1 to 9 are used and the number 10 is represented by <strong>(b)</strong> ...... The hexadecimal number system continues up to the number 15, which is represented by <strong>(c)</strong> ......', [
    { label: 'Gap', answer: '^\\s*(base\\s*)?(-\\s*)?16\\s*\\.?\\s*$', feedback: 'How many digits does hexadecimal have?' },
    { label: 'Gap', answer: letterAns('A'), feedback: 'Which letter is the first one after 9?' },
    { label: 'Gap', answer: letterAns('F'), feedback: 'Count on from A = 10 up to 15.' },
  ], ['Why does every number system need the digit zero?', 'Zero fills an empty column, so the other digits stay in their own columns.'], '', 3));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Know Your Digits', 'drill-y11-1-3-digits', 'Activity 1: Know Your Digits',
  'Letters to values, values to letters, order and add. No table this time: work from memory.',
  ['Why learn A to F by heart, and not look them up?', 'In the exam there is no table. Every conversion needs these values.']));

// ---------------------------------------------------------------- why 16 and 1
const pvCard = (name, list, rule) => box(boxTitle(name) + `<div style="display:flex;gap:6px;justify-content:center">${list.map((x) => `<span style="${MONO};font-weight:700;font-size:20px;padding:4px 8px;border:1px solid var(--line-strong);border-radius:6px">${x}</span>`).join('')}</div>` + boxLine(rule));
steps.push(concept('concept-places', 'Why the Place Values Are 16 and 1',
  'In denary the columns are 100, 10, 1. In binary they are 8, 4, 2, 1. Predict: what are the hexadecimal columns?',
  '<p>Start at 1 on the right and multiply by 16 each time: 1, then 16, then 256.</p>',
  columns(facts(['The rightmost column is always worth <strong>1</strong>.', 'Each column to the left is worth the <strong>base</strong> times more.', 'Denary: &times; 10. Binary: &times; 2.',
    'Hexadecimal: &times; 16. So the next column is <strong>16</strong>.', 'A 1 in the 16s column is worth 16, not ten.']),
    '<div style="display:grid;gap:8px">' + pvCard('Denary', [100, 10, 1], 'Each column is 10 times the next.') + pvCard('Binary', [8, 4, 2, 1], 'Each column is 2 times the next.') +
    pvCard('Hexadecimal', [16, 1], 'Each column is 16 times the next.') + '</div>')));

// ---------------------------------------------------------------- the method
const EXM = '3D';
steps.push(concept('concept-method', 'Hexadecimal to Denary: Multiply, Then Add',
  `In ${EXM}, why is the 3 worth more than the D, although D is the bigger digit?`,
  `<p>The 3 is in the 16s column: 3 &times; 16 = 48. The D is in the 1s column: 13 &times; 1 = 13.</p>`,
  columns(facts(['Write the place values: <strong>16</strong> and <strong>1</strong>.', 'Write the denary <strong>value</strong> of each digit (D = 13).', 'Multiply each value by its place value.', '<strong>Add</strong> the results.']),
    '<div style="display:grid;gap:8px">' + hexTable(EXM, { value: true, worth: true }) + line(`${hexWork(EXM)} = ${hexSum(EXM)} = <strong>${hv(EXM)}</strong>`) + line(`${EXM} in denary is <strong>${hv(EXM)}</strong>`) + '</div>')));

steps.push(mcStep('predict-30', 'Predict: What Is 30 Worth?', 'Predict: What Is 30 Worth?', '', [
  { prompt: 'A number is written in hexadecimal as 30. What is it in denary?', options: ['30', '48', '18'], correct: 1,
    explain: 'The 3 is in the 16s column: 3 x 16 = 48. The 0 adds nothing. 48 + 0 = 48.' },
], ['In hexadecimal 70, why does the 0 matter, although it adds nothing?', 'It keeps the 7 in the 16s column. Without it, 7 would be in the 1s column.']));

// ---------------------------------------------------------------- exam questions, two digits
// 0478/11 November 2021 Q1(b). Mark scheme: 9; 16; 40; 161.
const E2 = ['09', '10', '28', 'A1'];
steps.push(checkStep('exam-2', 'Exam Question: Hexadecimal to Denary (1 of 6)', 'Exam Question: Hexadecimal to Denary (1 of 6)',
  cite('0478/11, November 2021, Question 1(b)') + ' Hexadecimal and denary are number systems that can be used by programmers. Convert these four hexadecimal values into denary values.',
  E2.map((h) => hexPart(h)),
  ['In the hexadecimal number 50, why is the 5 worth much more than 5?', 'It is in the left column. Each column is worth the base times the column to its right.'], '', 2));

// 0478/12 November 2021 Q1(b). Mark scheme: 5; 32; 26; 171.
const E3 = ['05', '20', '1A', 'AB'];
steps.push(checkStep('exam-3', 'Exam Question: Hexadecimal to Denary (2 of 6)', 'Exam Question: Hexadecimal to Denary (2 of 6)',
  cite('0478/12, November 2021, Question 1(b)') + ' Hexadecimal values can be used to represent denary values. Convert these four hexadecimal values into denary values.',
  E3.map((h) => hexPart(h)),
  ['When a letter is in the 16s column, why do we change it to its value first?', 'We can only multiply numbers. The letter stands for a value from 10 to 15.'], '', 2));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Multiply, Add, Check', 'drill-y11-1-3-convert', 'Activity 2: Multiply, Add, Check',
  'Work out what each digit is worth, convert, then find Sam\'s slips. Most numbers come from real exam papers.',
  ['Why check Sam\'s answer with the method, not by guessing?', 'The method gives the one right value. A guess can look close and still be wrong.']));

// 0478/13 June 2021 Q1(a)(iii). Mark scheme: 41; 200.
const E4 = ['29', 'C8'];
steps.push(checkStep('exam-4', 'Exam Question: The MAC Address (3 of 6)', 'Exam Question: The MAC Address (3 of 6)',
  cite('0478/13, June 2021, Question 1(a)(iii)') + ' Greta\'s computer has the address 00:A0:C9:14:C8:29. The values in the address are hexadecimal values. Convert the two given hexadecimal values into denary.',
  E4.map((h) => hexPart(h)),
  ['Why is the address written in hexadecimal and not in denary or binary?', 'Hexadecimal is short and easy for people to read and copy.'], side2));

// ---------------------------------------------------------------- three digits
const EX3 = '1C3';
steps.push(concept('concept-256', 'Three Digits: Why the Next Place Value Is 256',
  'The columns so far are 16 and 1. Predict: what is the next column to the left, and why?',
  '<p>256. Each column is 16 times the one to its right, and 16 &times; 16 = 256.</p>',
  columns(facts(['Each column is 16 times the column to its right.', '16 &times; 16 = <strong>256</strong>.', 'Three digits: place values <strong>256, 16, 1</strong>.', 'A 0 on the left adds nothing: 0B5 is the same as B5.']),
    '<div style="display:grid;gap:8px">' + hexTable(EX3, { value: true, worth: true }) + line(`${hexWork(EX3)}`) + line(`= ${hexSum(EX3)} = <strong>${hv(EX3)}</strong>`) + '</div>')));

// 0478/11 November 2022 Q3(c). Mark scheme: 34; 172.
const E5 = ['022', '0AC'];
steps.push(checkStep('exam-5', 'Exam Question: Error Codes (4 of 6)', 'Exam Question: Error Codes (4 of 6)',
  cite('0478/11, November 2022, Question 3(c)') + ' Hexadecimal values can also be represented as denary values. The hexadecimal error code 022 means \'file system error\'. The hexadecimal error code 0AC means \'insufficient memory\'. Convert the hexadecimal error codes 022 and 0AC to denary values.',
  E5.map((h) => hexPart(h)),
  ['Why does a 0 on the left not change the value?', '0 times any place value is 0, so it adds nothing.'], side3));

// 0478/11 June 2025 Q2(c)(i). Mark scheme: 44; 267.
const E6 = ['02C', '10B'];
steps.push(checkStep('exam-6', 'Exam Question: Ticket Numbers (5 of 6)', 'Exam Question: Ticket Numbers (5 of 6)',
  cite('0478/11, June 2025, Question 2(c)(i)') + ' A ticket machine displays ticket numbers in hexadecimal. The ticket numbers could also be represented as denary. Convert the two ticket numbers from hexadecimal to denary.',
  E6.map((h) => hexPart(h)),
  ['With three digits, why must you count the columns from the right?', 'The right column is always 1. Counting from there puts 16 and 256 in the right places.'], side3));

// 0478/12 June 2026 Q3(d). Mark scheme: 162; 260.
const E7 = ['0A2', '104'];
steps.push(checkStep('exam-7', 'Exam Question: More Error Codes (6 of 6)', 'Exam Question: More Error Codes (6 of 6)',
  cite('0478/12, June 2026, Question 3(d)') + ' Hexadecimal numbers can also be converted to denary numbers. Convert the two hexadecimal error codes 0A2 and 104 to denary numbers.',
  E7.map((h) => hexPart(h)),
  ['Why is it worth writing the working, even for a 1 mark answer?', 'The working shows each column, so a slip is easy to find and fix.'], side3));

// ---------------------------------------------------------------- why shorter
const SH = 200;
const shCard = (name, text, n) => box(boxTitle(`${name}: ${n} digits`) + `<div style="text-align:center;${MONO};font-size:26px;font-weight:700;letter-spacing:3px">${text}</div>`);
steps.push(concept('concept-shorter', 'Why Hexadecimal Is Shorter',
  `${SH} in binary needs 8 digits. Predict: why does hexadecimal need only 2?`,
  '<p>Each hexadecimal digit has 16 possible values. A binary digit has only 2. More values in each digit means fewer digits.</p>',
  columns(facts(['The same number, written three ways.', 'A hexadecimal digit has <strong>16</strong> values. A binary digit has <strong>2</strong>.', 'So hexadecimal needs <strong>fewer digits</strong>.',
    'Shorter: <strong>easier to read</strong>, <strong>fewer mistakes</strong>, less space. The computer still stores binary.']),
    '<div style="display:grid;gap:8px">' + shCard('Binary', bin8(SH), 8) + shCard('Denary', String(SH), 3) + shCard('Hexadecimal', SH.toString(16).toUpperCase(), 2) + '</div>')));

// 0478/12 November 2024 Q3(a)(ii). Mark scheme: Binary is base-2 whereas hexadecimal is base-16; Binary only uses
// numbers whereas hexadecimal also uses letters // Binary only uses 0 and 1 whereas hexadecimal uses 0 to 9/A to F.
const DIFFS = { id: 'hexadecimal-binary-differences', prompt: '(ii) Give two differences between hexadecimal and binary.', marks: 2,
  modelAnswer: 'Binary is base 2 but hexadecimal is base 16. Binary only uses 0 and 1 but hexadecimal also uses A to F.',
  scheme: ['Binary is base-2 whereas hexadecimal is base-16', 'Binary only uses numbers whereas hexadecimal also uses letters // Binary only uses 0 and 1 whereas hexadecimal uses 0 to 9 / A to F'] };
steps.push(selfMarked('exam-why', 'Exam Question: Two Differences', 'Exam Question: Two Differences',
  cite('0478/12, November 2024, Question 3(a)') + ' A user enters hexadecimal data. It is converted to binary to be processed.',
  [DIFFS], ['Why should a difference name both number systems?', 'A difference compares two things. Saying only one side does not show how they differ.']));

// 0478/11 June 2025 Q2(b)(ii). Mark scheme, any two from: Easier/quicker for the customer to understand/read/remember;
// Takes up less space on the ticket // Shorter representation.
const REASONS = { id: 'ticket-reasons', prompt: '(ii) Give two reasons why the ticket number is displayed as hexadecimal instead of binary.', marks: 2,
  modelAnswer: 'It is shorter, so it is easier for the customer to read.',
  scheme: ['Easier / quicker for the customer to understand / read / remember', 'Takes up less space on the ticket // Shorter representation'] };
steps.push(selfMarked('exam-why-2', 'Exam Question: Why Not Binary?', 'Exam Question: Why Not Binary?',
  cite('0478/11, June 2025, Question 2(b)(ii)') + ' Ticket numbers such as 14B are stored in binary.',
  [REASONS], ['Why do two different points earn more than one long point?', 'Each mark needs its own point. The same idea twice earns one mark.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Hexadecimal Drill', 'drill-y11-1-3-hex', 'Plenary: Hexadecimal Drill',
  'The digits A to F, the place values, real exam conversions and why hexadecimal is used. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
// Every exam value against its mark scheme.
const MS = [['09', 9], ['10', 16], ['28', 40], ['A1', 161], ['05', 5], ['20', 32], ['1A', 26], ['AB', 171], ['29', 41], ['C8', 200],
  ['022', 34], ['0AC', 172], ['02C', 44], ['10B', 267], ['0A2', 162], ['104', 260]];
MS.forEach(([h, n]) => assert(hv(h) === n, `mark scheme ${h} is ${n}`));
assert(val(DN1) === 227, 'Do Now 1 from the mark scheme');
assert(bin8(15) === '00001111' && bin8(180) === '10110100' && bin8(235) === '11101011', 'Do Now 2 from the mark scheme');
assert(hv(EXM) === 61 && hv(EX3) === 451 && hv('30') === 48, 'examples');
ok('do-now', 0, ['227', '227 in denary', '= 227'], ['226', '6', '11100011', '199']);
ok('do-now-2', 0, ['1111', '00001111', '0000 1111'], ['11110', '15', '0111']);
ok('do-now-2', 1, ['10110100', '1011 0100'], ['00101101', '10110101', '180']);
ok('do-now-2', 2, ['11101011'], ['11010111', '11101010']);
ok('check-letters', 0, ['12', '12 in denary'], ['11', '13', 'C', '1']);
ok('check-letters', 1, ['14'], ['15', '13', 'E']);
ok('check-letters', 2, ['11'], ['12', '10', 'B']);
ok('check-letters', 3, ['13', '13.'], ['14', '12', 'D']);
ok('exam-1', 0, ['16', 'base 16', 'base-16', '16.'], ['10', '2', '15', '6']);
ok('exam-1', 1, ['A', 'a', ' A '], ['B', '10', 'AA']);
ok('exam-1', 2, ['F', 'f'], ['E', '15', 'G']);
ok('exam-2', 0, ['9', '09'], ['90', '19']);
ok('exam-2', 1, ['16'], ['10', '1', '160']);
ok('exam-2', 2, ['40'], ['28', '10', '38']);
ok('exam-2', 3, ['161', '161 in denary'], ['101', '11', '170', 'A1']);
ok('exam-3', 0, ['5', '05'], ['50']);
ok('exam-3', 1, ['32'], ['20', '2']);
ok('exam-3', 2, ['26'], ['11', '1A', '25', '16']);
ok('exam-3', 3, ['171'], ['21', '170', '1011']);
ok('exam-4', 0, ['41'], ['29', '11']);
ok('exam-4', 1, ['200'], ['20', '128', '208']);
ok('exam-5', 0, ['34', '034'], ['22', '4', '544']);
ok('exam-5', 1, ['172'], ['22', '1612', '2732', '160']);
ok('exam-6', 0, ['44'], ['12', '14', '2C', '204']);
ok('exam-6', 1, ['267'], ['27', '1011', '4107', '187']);
ok('exam-7', 0, ['162'], ['12', '2562', '102']);
ok('exam-7', 1, ['260'], ['104', '20', '68']);
// Every Do Now walkthrough step (text, picture, both) must fail every part on its slide.
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
steps.filter((s) => /^do-now(-\d)?$/.test(s.id)).forEach((s) => {
  assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
assert(!/\b227\b/.test(plain(JSON.stringify(WT_DN1))), 'Do Now 1 walkthrough gives the answer');
assert(!/\b(1111|00001111|10110100|11101011)\b/.test(plain(JSON.stringify(WT_DN2))), 'Do Now 2 walkthrough gives an answer');
// Slide examples never use a question's number.
{
  const qs = [...E2, ...E3, ...E4, ...E5, ...E6, ...E7].map((h) => hv(h));
  [EXM, EX3, '30', '70'].forEach((h) => assert(!qs.includes(hv(h)), `example ${h} is also a question`));
}
// No term before the slide that teaches it (the title slide only names today's topic). Next lesson's ideas never.
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/hexadecimal/i, 'title'], [/base 16|base-16/i, 'concept-digits'], [/\b[A-F]\b.{0,12}\b1[0-5]\b/, 'concept-letters'],
    [/16s column|\b256\b/i, 'concept-places'], [/\b256\b/, 'concept-places'], [/MAC/, 'exam-4'],
    [/nibble|\b4 bits\b|four bits|denary to hexadecimal|binary to hexadecimal|hexadecimal to binary|\bbytes?\b|two.s complement|overflow|ascii/i, null], [/mario|\bdecimal\b|\bhex\b/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
  assert(at('concept-256') < at('exam-5'), '256 taught before three digit questions');
}
steps.filter((s) => s.validatorKey).forEach((s) => assert(V(s.id).length <= 4, `${s.id} has too many parts`));
steps.filter((s) => s.type === 'self-marked-response').forEach((s) => assert(s.items.length === 1 && s.items.every((it) => Array.isArray(it.scheme) && it.scheme.length >= it.marks && it.modelAnswer && it.marks && it.id), `${s.id} self-marked fields`));
// Think, Pair, Share never states a check answer on its slide (numbers and letters).
steps.filter((s) => s.validatorKey).forEach((s) => {
  const t = /<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content);
  if (t) V(s.id).forEach((v, i) => assert(!new RegExp(v.pattern.source.replace(/^\^/, '\\b').replace(/\$$/, '\\b'), /^\^\\s\*[A-F]\\s/.test(v.pattern.source) ? '' : 'i').test(plain(t[1])), `${s.id} TPS gives part ${i}`));
});

// ---------------------------------------------------------------- drills
// Real hexadecimal to denary values from Paper 1, each with its citation (checked against MS above).
const REALHEX = [
  ['09', 'From Cambridge IGCSE 0478/11, November 2021, Question 1(b).'],
  ['10', 'From Cambridge IGCSE 0478/11, November 2021, Question 1(b).'],
  ['28', 'From Cambridge IGCSE 0478/11, November 2021, Question 1(b).'],
  ['A1', 'From Cambridge IGCSE 0478/11, November 2021, Question 1(b).'],
  ['05', 'From Cambridge IGCSE 0478/12, November 2021, Question 1(b).'],
  ['20', 'From Cambridge IGCSE 0478/12, November 2021, Question 1(b).'],
  ['1A', 'From Cambridge IGCSE 0478/12, November 2021, Question 1(b), and 0478/12, March 2022, Question 1(c).'],
  ['AB', 'From Cambridge IGCSE 0478/12, November 2021, Question 1(b).'],
  ['29', 'From Cambridge IGCSE 0478/13, June 2021, Question 1(a)(iii).'],
  ['C8', 'From Cambridge IGCSE 0478/13, June 2021, Question 1(a)(iii).'],
  ['022', 'From Cambridge IGCSE 0478/11, November 2022, Question 3(c).'],
  ['0AC', 'From Cambridge IGCSE 0478/11, November 2022, Question 3(c).'],
  ['02C', 'From Cambridge IGCSE 0478/11, June 2025, Question 2(c)(i).'],
  ['10B', 'From Cambridge IGCSE 0478/11, June 2025, Question 2(c)(i).'],
  ['0A2', 'From Cambridge IGCSE 0478/12, June 2026, Question 3(d).'],
  ['104', 'From Cambridge IGCSE 0478/12, June 2026, Question 3(d).'],
];
REALHEX.forEach(([h]) => assert(MS.some((m) => m[0] === h), `real value ${h} has a mark scheme check`));
// Real values from the 1.1 and 1.2 builders (each checked there against its mark scheme), for the Extension.
const REAL11 = [
  ['01010101', 'From Cambridge IGCSE 0478/12, March 2022, Question 1(a).'],
  ['10101110', 'From Cambridge IGCSE 0478/13, June 2023, Question 1(a).'],
  ['00011001', 'From Cambridge IGCSE 0478/13, June 2025, Question 1(c)(i).'],
  ['00101001', 'From Cambridge IGCSE 0478/13, June 2026, Question 8(b).'],
  ['01000010', 'From Cambridge IGCSE 0478/11, November 2025, Question 1(d).'],
  ['01000110', 'From Cambridge IGCSE 0478/11, November 2023, Question 2(a).'],
];
const REAL12 = [
  [50, 'From Cambridge IGCSE 0478/11, June 2023, Question 1(b).'],
  [102, 'From Cambridge IGCSE 0478/11, June 2023, Question 1(b).'],
  [221, 'From Cambridge IGCSE 0478/11, June 2023, Question 1(b).'],
  [46, 'From Cambridge IGCSE 0478/12, March 2021, Question 1(a).'],
  [171, 'From Cambridge IGCSE 0478/12, March 2021, Question 1(a).'],
  [242, 'From Cambridge IGCSE 0478/11, June 2022, Question 4(b).'],
  [98, 'From Cambridge IGCSE 0478/11, November 2023, Question 2(b).'],
  [71, 'From Cambridge IGCSE 0478/13, June 2026, Question 8(a).'],
  [23, 'From Cambridge IGCSE 0478/11, November 2025, Question 1(b).'],
  [168, 'From Cambridge IGCSE 0478/11, November 2025, Question 1(b).'],
  [167, 'From Cambridge IGCSE 0478/11, June 2021, Question 1(a).'],
  [214, 'From Cambridge IGCSE 0478/11, June 2021, Question 1(a).'],
];

const drillHead = (id, about) => `// Year 11, 1.3: Hexadecimal Digits. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_3_hex.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()
    .split('[] /*REALHEX*/').join(JSON.stringify(REALHEX))
    .split('[] /*REAL11*/').join(JSON.stringify(REAL11))
    .split('[] /*REAL12*/').join(JSON.stringify(REAL12))})()\n});\n`;

// ---- Do Now Extension: 1.1 and 1.2 (place values, binary to denary, the range of 8 bits, denary to binary,
// checking back). Every card has an example on different numbers and two nudges.
function extCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  var PV = [128, 64, 32, 16, 8, 4, 2, 1];
  function bin8(n) { var s = n.toString(2); while (s.length < 8) s = "0" + s; return s; }
  function ones(b) { return b.split("").filter(function (c) { return c === "1"; }).length; }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function plus(b) { var o = []; for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]); return o.join(" + "); }
  function first(n) { for (var i = 0; i < 8; i++) if (PV[i] <= n) return PV[i]; return 0; }
  function rev(b) { return b.split("").reverse().join(""); }
  var PVLINE = "Place values: 128  64  32  16  8  4  2  1";
  var REAL11 = [] /*REAL11*/;
  var REAL12 = [] /*REAL12*/;
  function otherN(not, lo, hi) { var e; do { e = rnd(lo, hi); } while (e === not || bin8(e) === bin8(not) || ones(bin8(e)) < 2); return e; }
  function wrongNum(a, list) { return drillWrongNumbers(a, list.filter(function (x) { return x >= 0 && x !== a; }), 3); }
  function wrongBins(n) {
    var b = bin8(n), out = [], c = [rev(b), bin8((n + 1) % 256), bin8(n ^ first(n)), bin8(Math.max(n - 1, 0))];
    c.forEach(function (x) { if (x && x !== b && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }
  function b2dCard(b, src) {
    var e; do { e = drillPick(REAL11)[0]; } while (e === b);
    if (val(e) === val(b)) e = bin8(otherN(val(b), 20, 250));
    return { prompt: "Convert the 8-bit binary number " + b + " to denary.\n" + PVLINE, answers: [String(val(b))], keywords: [num(val(b))],
      distractors: wrongNum(val(b), [val(rev(b)), ones(b), val(b) + 1, val(b) - 1]),
      example: "Example: convert " + e + ".\nStep 1: find each 1 and the place value above it.\nStep 2: add them: " + plus(e) + " = " + val(e) + ".",
      working: ["Find each 1. Read the place value above it.", "Add those place values, one at a time."], note: b + " = " + plus(b) + " = " + val(b) + "." + (src ? " " + src : "") };
  }
  function d2bCard(r) {
    var n = r[0], b = bin8(n), e = otherN(n, 20, 250);
    return { prompt: "Convert the denary number " + n + " to 8-bit binary.\n" + PVLINE, answers: [b], keywords: [binRe(b)], distractors: wrongBins(n), format: "Type the 8 bits",
      example: "Example: convert " + e + ".\nStep 1: start at 128. Fits: write 1 and subtract. Too big: write 0.\nStep 2: " + e + " = " + plus(bin8(e)) + ".\nStep 3: so " + e + " is " + bin8(e) + ".",
      working: ["Start at 128. Fits: write 1 and subtract. Too big: write 0.", "Write all 8 bits. Then convert back to check."], note: n + " = " + plus(b) + " = " + b + ". " + r[1] };
  }
  var cards = [
    { id: "ex-01", category: "ex-b2d", randomize: function () {
        var list = [1, 2, 4, 8, 16, 32, 64], k = rnd(2, 6), x = list[k], j; do { j = rnd(1, 5); } while (j === k || list[j] === x * 2);
        return { prompt: "Binary place values double each time: 1, 2, 4, ... What place value comes after " + x + "?", answers: [String(x * 2)], keywords: [num(x * 2)],
          distractors: wrongNum(x * 2, [x + 2, x + 1, x * 10, x * 3]),
          example: "Example: what comes after " + list[j] + "?\nStep 1: each place value is double the one before.\nStep 2: double " + list[j] + " is " + list[j] + " + " + list[j] + " = " + (list[j] * 2) + ".",
          working: ["Each place value is double the one before it.", "Double " + x + "."], note: "Double " + x + " is " + (x * 2) + "." };
      } },
    { id: "ex-02", category: "ex-b2d", randomize: function () { var r = drillPick(REAL11); return b2dCard(r[0], r[1]); } },
    { id: "ex-03", category: "ex-b2d", randomize: function () { var b; do { b = bin8(rnd(130, 255)); } while (ones(b) < 4); return b2dCard(b, ""); } },
    { id: "ex-04", category: "ex-b2d", prompt: "Give the largest denary value that can be stored in an 8-bit binary number.", answers: ["255"], keywords: [num(255)],
      distractors: ["256", "128", "8"],
      example: "Example: the largest 4-bit value.\nStep 1: the largest has every bit set to 1: 1111.\nStep 2: add every place value: 8 + 4 + 2 + 1 = 15.",
      working: ["In the largest 8-bit number, every bit is 1.", "Add all 8 place values."], note: "11111111 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. From Cambridge IGCSE 0478/12, March 2021, Question 1(b)." },
    { id: "ex-05", category: "ex-d2b", randomize: function () {
        var r = drillPick(REAL12), n = r[0], a = first(n), e; do { e = rnd(10, 250); } while (first(e) === a);
        return { prompt: "You convert " + n + " to 8-bit binary. Which place value gets the first 1?\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [a * 2 <= 128 ? a * 2 : a / 4, a / 2, n, 3]),
          example: "Example: " + e + ".\nStep 1: start at 128 and move right.\nStep 2: the first place value that is not bigger than " + e + " is " + first(e) + ".",
          working: ["Start on the left. Is that place value bigger than " + n + "?", "Move right until a place value fits in " + n + "."], note: "The biggest place value that fits in " + n + " is " + a + ". " + r[1] };
      } },
    { id: "ex-06", category: "ex-d2b", randomize: function () {
        var n, left, p, k;
        do { n = rnd(20, 250); k = rnd(1, 3); left = n; for (var j = 0; j < k; j++) if (left >= PV[j]) left -= PV[j]; p = PV[k]; } while (left < p || left === p);
        var e1, e2 = 64; do { e1 = rnd(70, 120); } while (e1 - e2 === left - p || e1 === left - p || e2 === left - p);
        return { prompt: "You are converting " + n + ". " + left + " is left. The next place value is " + p + ".\nWhat is left after the " + p + " column?\n" + PVLINE, answers: [String(left - p)], keywords: [num(left - p)],
          distractors: wrongNum(left - p, [left, left + p, p]),
          example: "Example: " + e1 + " is left and the next place value is " + e2 + ".\nStep 1: " + e2 + " fits in " + e1 + ", so write 1.\nStep 2: subtract: " + e1 + " - " + e2 + " = " + (e1 - e2) + " left.",
          working: ["Does " + p + " fit in " + left + "?", "Fits: write 1 and subtract it."], note: left + " - " + p + " = " + (left - p) + "." };
      } },
    { id: "ex-07", category: "ex-d2b", randomize: function () { return d2bCard(drillPick(REAL12.filter(function (r) { return r[0] < 128; }))); } },
    { id: "ex-08", category: "ex-d2b", randomize: function () { return d2bCard(drillPick(REAL12.filter(function (r) { return r[0] >= 128; }))); } },
    { id: "ex-09", category: "ex-check", randomize: function () {
        var r = drillPick(REAL12), n = r[0], b = bin8(n), i = b.lastIndexOf("1"), s = b.slice(0, i) + "0" + b.slice(i + 1);
        var e = otherN(n, 20, 250), eb = bin8(e), ei = eb.lastIndexOf("1"), es = eb.slice(0, ei) + "0" + eb.slice(ei + 1);
        return { prompt: "Sam converted " + n + " to 8-bit binary and wrote " + s + ". Convert Sam's answer back to denary.\n" + PVLINE, answers: [String(val(s))], keywords: [num(val(s))],
          distractors: wrongNum(val(s), [n, val(s) + 1, val(s) - 1]),
          example: "Example: Sam wrote " + es + " for " + e + ".\nStep 1: add the place values with a 1: " + (plus(es) || "0") + " = " + val(es) + ".\nStep 2: " + val(es) + " is not " + e + ", so he made a slip.",
          working: ["Find each 1 in Sam's answer.", "Add the place values above them."], note: s + " = " + (plus(s) || "0") + " = " + val(s) + ", not " + n + ". " + r[1] };
      } },
    { id: "ex-10", category: "ex-check", randomize: function () {
        var r = drillPick(REAL12), n = r[0], b = bin8(n), i = b.lastIndexOf("1"), s = b.slice(0, i) + "0" + b.slice(i + 1);
        var e = otherN(n, 20, 250);
        return { prompt: "Sam says " + n + " is " + s + ". Converted back, that is " + val(s) + ". Give the right 8-bit binary for " + n + ".", answers: [b], keywords: [binRe(b)],
          distractors: [s].concat(wrongBins(n).filter(function (x) { return x !== s; })).slice(0, 3), format: "Type the 8 bits",
          example: "Example: the right binary for " + e + ".\nStep 1: start again from 128 and use the subtract method.\nStep 2: " + e + " = " + plus(bin8(e)) + ", so it is " + bin8(e) + ".",
          working: ["Start again from 128. Do not trust Sam's bits.", "Fits: write 1 and subtract. Too big: write 0."], note: n + " = " + plus(b) + " = " + b + ". " + r[1] };
      } }
  ];
  cards.forEach(function (c) {
    if (!c.randomize) return;
    var f = c.randomize;
    c.randomize = function () {
      var r;
      for (var t = 0; t < 80; t++) {
        r = f();
        var rx = new RegExp("(^|[^a-z0-9])" + String(r.answers[0]).toLowerCase() + "($|[^a-z0-9])");
        if (!rx.test(r.example.toLowerCase()) || rx.test(r.prompt.toLowerCase())) return r;
      }
      return r;
    };
  });
  return cards;
}

// ---- Activity 1: the digits A to F from memory. Letters to values, values to letters, order, add.
function digitCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var L = ["A", "B", "C", "D", "E", "F"];
  var D = "0123456789ABCDEF";
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function letRe(c) { return new RegExp("^\\s*" + c + "\\s*$", "i"); }
  function wrongNum(a, list) { return drillWrongNumbers(a, list.filter(function (x) { return x >= 0 && x !== a; }), 3); }
  return [
    { id: "dg-01", category: "dg-value", randomize: function () {
        var c = drillPick(L), v = D.indexOf(c);
        return { prompt: "Give the denary value of the hexadecimal digit " + c + ".", answers: [String(v)], keywords: [num(v)], distractors: wrongNum(v, [v + 1, v - 1, v + 2, v === 10 ? 1 : 10]),
          working: ["The letters start straight after 9.", "Count on one for each letter, starting from 9."], note: c + " = " + v + "." };
      } },
    { id: "dg-02", category: "dg-value", randomize: function () {
        var v = rnd(10, 15), c = D[v];
        return { prompt: "Which hexadecimal digit stands for the denary value " + v + "?", answers: [c], keywords: [letRe(c)],
          distractors: L.filter(function (x) { return x !== c; }).sort(function (a, b) { return Math.abs(D.indexOf(a) - v) - Math.abs(D.indexOf(b) - v); }).slice(0, 3), format: "Type one digit",
          working: ["The letters start straight after 9.", "Count on one letter for each value after 9."], note: v + " is " + c + "." };
      } },
    { id: "dg-03", category: "dg-value", randomize: function () {
        var c = drillPick(L.slice(1)), v = D.indexOf(c);
        return { prompt: "Ana says the hexadecimal digit " + c + " is " + (v + 1) + ". She started counting from A = 11. What is the right value?", answers: [String(v)], keywords: [num(v)],
          distractors: wrongNum(v, [v + 1, v - 1, v + 2]),
          working: ["A is 10, not 11.", "Count on from A = 10 to " + c + "."], note: "A = 10, so " + c + " = " + v + "." };
      } },
    { id: "dg-04", category: "dg-order", randomize: function () {
        var v = rnd(9, 14), n = D[v + 1];
        return { prompt: "Counting in hexadecimal, which digit comes straight after " + D[v] + "?", answers: [n], keywords: [letRe(n)],
          distractors: [String(v + 1), D[Math.min(v + 2, 15)], D[v - 1]].filter(function (x, i, a) { return x !== n && a.indexOf(x) === i; }), format: "Type one digit",
          working: ["Hexadecimal counts 0 to 9, then letters for 10 to 15.", "Count on one value."], note: "After " + D[v] + " comes " + n + "." };
      } },
    { id: "dg-05", category: "dg-order", randomize: function () {
        var pick = [], v; while (pick.length < 3) { v = rnd(7, 15); if (pick.indexOf(v) < 0) pick.push(v); }
        var shown = pick.map(function (x) { return D[x]; });
        var sorted = pick.slice().sort(function (a, b) { return a - b; }).map(function (x) { return D[x]; });
        var kw = new RegExp("^\\s*" + sorted.join("\\s*[, ]\\s*") + "\\s*$", "i");
        var dist = [sorted.slice().reverse().join(", "), shown.join(", "), [sorted[1], sorted[0], sorted[2]].join(", ")].filter(function (x, i, a) { return x !== sorted.join(", ") && a.indexOf(x) === i; });
        return { prompt: "Put these hexadecimal digits in order, smallest first: " + shown.join(", "), answers: [sorted.join(", ")], keywords: [kw], distractors: dist.length ? dist : [sorted.slice().reverse().join(", ")],
          format: "Type the digits with commas between them",
          working: ["Change each letter to its value first.", "Then put the values in order, smallest first."], note: sorted.map(function (x) { return x + " = " + D.indexOf(x); }).join(", ") + "." };
      } },
    { id: "dg-06", category: "dg-order", randomize: function () {
        var a = drillPick(L), b = D[rnd(2, 9)], s = D.indexOf(a) + D.indexOf(b);
        return { prompt: "Add the denary values of the hexadecimal digits " + a + " and " + b + ".", answers: [String(s)], keywords: [num(s)],
          distractors: wrongNum(s, [s + 1, s - 1, 10 + D.indexOf(b), D.indexOf(b) + 1]),
          working: ["Change " + a + " to its value first.", "Then add " + b + "."], note: a + " = " + D.indexOf(a) + ". " + D.indexOf(a) + " + " + b + " = " + s + "." };
      } },
    { id: "dg-07", category: "dg-order", prompt: "How many different digits does the hexadecimal number system use?", answers: ["16"], keywords: [num(16)], distractors: ["15", "10", "6"],
      working: ["Count 0 to 9, then the letters A to F.", "Do not forget 0."], note: "0 to 9 is 10 digits. A to F is 6 more. 10 + 6 = 16." },
    { id: "dg-08", category: "dg-value", prompt: "What is the largest value one hexadecimal digit can stand for, in denary?", answers: ["15"], keywords: [num(15)], distractors: ["16", "9", "10"],
      working: ["The largest hexadecimal digit is F.", "A is 10. Count on to F."], note: "F = 15. With 0, that makes 16 digits." }
  ];
}

// ---- Activity 2: what each digit is worth, convert (real values mostly), find Sam's slips. Two digits only.
function convertCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var D = "0123456789ABCDEF";
  function hv(h) { return parseInt(h, 16); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?0*" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function wrongNum(a, list) { return drillWrongNumbers(a, list.filter(function (x) { return x >= 0 && x !== a && !isNaN(x); }), 3); }
  var REALHEX = [] /*REALHEX*/;
  var TWO = REALHEX.filter(function (r) { return r[0].length === 2; });
  // bad: a pattern of numbers this card must not draw (its working would name the answer). "10" is never drawn.
  function pick2(letterLeft, bad) {
    var no = function (h) { return h === "10" || (bad && bad.test(h)); };
    var fit = TWO.filter(function (r) { return (!letterLeft || hv(r[0][0]) >= 10) && !no(r[0]); });
    if (fit.length && Math.random() < 0.7) { var r = drillPick(fit); return { h: r[0], src: " " + r[1] }; }
    var h; do { h = D[rnd(letterLeft ? 10 : 1, 15)] + D[rnd(0, 15)]; } while (!/[A-F]/.test(h) || no(h));
    return { h: h, src: "" };
  }
  function work(h) { return hv(h[0]) + " x 16 + " + hv(h[1]) + " x 1 = " + (hv(h[0]) * 16) + " + " + hv(h[1]) + " = " + hv(h); }
  var PVLINE = "Place values: 16  1";
  return [
    { id: "cv-01", category: "cv-parts", randomize: function () {
        var p = pick2(false, /^1/), h = p.h, a = hv(h[0]) * 16;
        return { prompt: "In the hexadecimal number " + h + ", what is the left digit worth in denary?\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [hv(h[0]), hv(h[0]) * 10, hv(h), a + 16]),
          working: ["The left digit is in the 16s column.", "Multiply its value by 16."], note: hv(h[0]) + " x 16 = " + a + "." + p.src };
      } },
    { id: "cv-02", category: "cv-parts", randomize: function () {
        var x = rnd(10, 15), a = x * 16;
        return { prompt: "Work out " + D[x] + " x 16 in denary. (" + D[x] + " is a hexadecimal digit.)", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [(x + 1) * 16, (x - 1) * 16, x * 10, x + 16]),
          working: ["Change " + D[x] + " to its value first.", "Then multiply by 16."], note: D[x] + " = " + x + ". " + x + " x 16 = " + a + "." };
      } },
    { id: "cv-03", category: "cv-parts", randomize: function () {
        var p = pick2(false, /1$/), h = p.h, a = hv(h[1]);
        return { prompt: "In the hexadecimal number " + h + ", what is the right digit worth in denary?\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [a * 16, a + 1, hv(h), a + 10]),
          working: ["The right digit is in the 1s column.", "Its value times 1 is just its value."], note: h[1] + " x 1 = " + a + "." + p.src };
      } },
    { id: "cv-04", category: "cv-convert", randomize: function () {
        var p = pick2(false), h = p.h, a = hv(h);
        return { prompt: "Convert the hexadecimal number " + h + " to denary.\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [hv(h[0]) + hv(h[1]), hv(h[0]) * 10 + hv(h[1]), a + 16, a - 1]),
          working: ["Left digit: its value x 16.", "Right digit: its value x 1. Then add."], note: work(h) + "." + p.src };
      } },
    { id: "cv-05", category: "cv-convert", randomize: function () {
        var p = pick2(true), h = p.h, a = hv(h);
        return { prompt: "Convert the hexadecimal number " + h + " to denary.\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [hv(h[0]) + hv(h[1]), hv(h[0]) * 10 + hv(h[1]), a + 16, a - 16]),
          working: ["Change each letter to its value first.", "Left digit x 16, right digit x 1, then add."], note: work(h) + "." + p.src };
      } },
    { id: "cv-06", category: "cv-convert", randomize: function () {
        var p = pick2(false), h = p.h, a = hv(h);
        return { prompt: "Convert the hexadecimal number " + h + " to denary.\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [hv(h[0]) + hv(h[1]), a + 1, a - 1, a + 16]),
          working: ["Write each digit's value under its place value.", "Multiply, then add."], note: work(h) + "." + p.src };
      } },
    { id: "cv-07", category: "cv-check", randomize: function () {
        var p = pick2(false), h = p.h, a = hv(h), s = hv(h[0]) + hv(h[1]);
        if (s === a) { h = "3A"; a = 58; s = 13; p.src = ""; }
        return { prompt: "Sam says " + h + " in hexadecimal is " + s + " in denary. He added the two digit values. What is the right denary value?", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [s, a + 1, a - 16]),
          working: ["Sam forgot the place values.", "The left digit is in the 16s column: multiply it by 16."], note: work(h) + ", not " + s + "." + p.src };
      } },
    { id: "cv-08", category: "cv-check", randomize: function () {
        var h; do { h = D[rnd(1, 9)] + D[rnd(0, 9)]; } while (h === "10" || h === "20" || h === "28" || h === "29");
        var a = hv(h);
        return { prompt: "Ana says the hexadecimal number " + h + " is " + h + " in denary, because it has no letters. What is the right denary value?", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [Number(h), a + 1, a - 1]),
          working: ["Hexadecimal columns are 16 and 1, even with no letters.", "Left digit x 16, then add the right digit."], note: work(h) + ", not " + h + "." };
      } },
    { id: "cv-09", category: "cv-check", randomize: function () {
        var p = pick2(true), h = p.h, a = hv(h), s = hv(h[0]) * 10 + hv(h[1]);
        return { prompt: "Sam says " + h + " is " + s + ". He used a place value of 10 for the left digit. What is the right denary value?", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [s, hv(h[0]) + hv(h[1]), a + 16]),
          working: ["Hexadecimal is base 16, not base 10.", "Multiply the left digit's value by 16."], note: work(h) + ", not " + s + "." + p.src };
      } }
  ];
}

// ---- Plenary: this lesson only. The digits, the place values, real exam conversions, why hexadecimal.
function plenaryCards() {
  var D = "0123456789ABCDEF";
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function hv(h) { return parseInt(h, 16); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?0*" + n + "(\\s*(in\\s+)?(denary|base\\s*10))?\\s*$", "i"); }
  function wrongNum(a, list) { return drillWrongNumbers(a, list.filter(function (x) { return x >= 0 && x !== a && !isNaN(x); }), 3); }
  var REALHEX = [] /*REALHEX*/;
  function work(h) { var p = h.length === 3 ? [256, 16, 1] : [16, 1]; return h.split("").map(function (c, i) { return hv(c) + " x " + p[i]; }).join(" + ") + " = " + hv(h); }
  function convCard(r) {
    var h = r[0], a = hv(h), plain = h.split("").reduce(function (t, c) { return t + hv(c); }, 0);
    return { prompt: "Convert the hexadecimal number " + h + " to denary.", answers: [String(a)], keywords: [num(a)],
      distractors: wrongNum(a, [plain, Number(h.replace(/[A-F]/g, "1")) || plain + 10, a + 16, a + 1]),
      working: [h.length === 3 ? "Three digits: count the place values from the right." : "Two digits: the right column is worth 1.", "Each digit's value x its place value, then add."], note: work(h) + ". " + r[1] };
  }
  return [
    // ================================================= The digits
    { id: "pl-01", category: "pl-digits", randomize: function () {
        var v = rnd(10, 15), c = D[v];
        return { prompt: "Give the denary value of the hexadecimal digit " + c + ".", answers: [String(v)], keywords: [num(v)], distractors: wrongNum(v, [v + 1, v - 1, v + 2]),
          working: ["The letters start straight after 9.", "Count on one for each letter."], note: c + " = " + v + "." };
      } },
    { id: "pl-02", category: "pl-digits", randomize: function () {
        var v = rnd(10, 15), c = D[v];
        return { prompt: "Which hexadecimal digit represents the denary number " + v + "?", answers: [c], keywords: [new RegExp("^\\s*" + c + "\\s*$", "i")],
          distractors: [D[v === 15 ? 14 : v + 1], D[v === 10 ? 11 : v - 1], String(v)].filter(function (x, i, a) { return x !== c && a.indexOf(x) === i; }), format: "Type one digit",
          working: ["The letters start straight after 9.", "Count on one letter for each value after 9."], note: v + " is " + c + ". From Cambridge IGCSE 0478/12, March 2025, Question 1(a) (10 is A, 15 is F)." };
      } },
    { id: "pl-03", category: "pl-digits", prompt: "The hexadecimal number system is base what?", answers: ["16"], keywords: [/^\s*(base\s*)?-?\s*16\s*$/i], distractors: ["15", "10", "2"],
      working: ["Count the digits: 0 to 9, then A to F.", "The base is how many digits there are."], note: "Base 16. From Cambridge IGCSE 0478/12, March 2025, Question 1(a)." },
    { id: "pl-04", category: "pl-digits", prompt: "Why does hexadecimal use the letters A to F?", answers: ["The values 10 to 15 each need a single digit"],
      keywords: [/^(?=.*\b(10|ten|15|fifteen|11|12|13|14)\b)(?=.*\b(single|one|1|symbols?|digits?|characters?)\b).*$/i],
      distractors: ["Because letters are shorter", "Because computers use letters", "Because binary uses letters"],
      working: ["Which values are bigger than 9 but still one digit in hexadecimal?", "Why can 10 not be written as 1 and 0 in one column?"],
      note: "The values 10 to 15 each need one symbol. 10 would look like two digits, so A to F are used." },
    { id: "pl-05", category: "pl-digits", prompt: "Why does hexadecimal need 16 different digits?", answers: ["It is base 16, so each column holds one of 16 values, 0 to 15"],
      keywords: [/^(?=.*\b(base|0\s*to\s*15|15|values?)\b)(?=.*\b(16|sixteen|column|each|one)\b).*$/i],
      distractors: ["Because it uses letters", "Because computers like 16", "Because binary has 2 digits"],
      working: ["What does the base tell you?", "Which values must one column be able to hold?"], note: "It is base 16: one digit for each value from 0 to 15." },
    // ================================================= Place values
    { id: "pl-06", category: "pl-places", prompt: "In a two digit hexadecimal number, what is the place value of the left digit?", answers: ["16"], keywords: [num(16)], distractors: ["10", "2", "256"],
      working: ["The right column is 1.", "Each column is the base times the one to its right."], note: "1 x 16 = 16." },
    { id: "pl-07", category: "pl-places", prompt: "Why is the third hexadecimal place value 256?", answers: ["It is 16 times 16"],
      keywords: [/16\s*(x|\*|×|times|multiplied\s+by|lots\s+of)\s*16|16\s*(squared|\^\s*2)|sixteen\s+(times\s+sixteen|squared)|16\s*sixteens/i],
      distractors: ["It is 128 times 2", "It is 16 plus 240", "It is the largest 8-bit number"],
      working: ["The columns go 1, then 16. How do you get from 1 to 16?", "Do the same again to 16."], note: "Each column is 16 times the one to its right: 16 x 16 = 256." },
    { id: "pl-08", category: "pl-places", randomize: function () {
        var x = rnd(2, 15), h = D[x] + D[rnd(0, 15)], a = x * 16;
        return { prompt: "In the hexadecimal number " + h + ", what is the left digit worth in denary?", answers: [String(a)], keywords: [num(a)], distractors: wrongNum(a, [x, x * 10, hv(h), a + 16]),
          working: ["The left digit is in the 16s column.", "Its value x 16."], note: x + " x 16 = " + a + "." };
      } },
    { id: "pl-09", category: "pl-places", randomize: function () {
        var x = rnd(2, 3), h = D[x] + "00", a = x * 256;
        return { prompt: "What is the hexadecimal number " + h + " in denary?", answers: [String(a)], keywords: [num(a)], distractors: wrongNum(a, [x * 100, x * 16, x, a + 16]),
          working: ["Three digits: place values 256, 16, 1.", "The 0s add nothing."], note: x + " x 256 = " + a + "." };
      } },
    // ================================================= Real exam conversions
    { id: "pl-10", category: "pl-convert", randomize: function () { return convCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2 && !/[A-F]/.test(r[0]); }))); } },
    { id: "pl-11", category: "pl-convert", randomize: function () { return convCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2 && /[A-F]/.test(r[0]); }))); } },
    { id: "pl-12", category: "pl-convert", randomize: function () { return convCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2; }))); } },
    { id: "pl-13", category: "pl-convert", randomize: function () { return convCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 3; }))); } },
    { id: "pl-14", category: "pl-convert", randomize: function () { return convCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 3; }))); } },
    { id: "pl-15", category: "pl-convert", randomize: function () { return convCard(drillPick(REALHEX)); } },
    { id: "pl-16", category: "pl-convert", prompt: "Greta's computer has the address 00:A0:C9:14:C8:29. Convert the hexadecimal value C8 to denary.", answers: ["200"], keywords: [num(200)],
      distractors: ["20", "128", "208"], working: ["C = 12, in the 16s column.", "12 x 16, then add 8."], note: "12 x 16 + 8 = 192 + 8 = 200. From Cambridge IGCSE 0478/13, June 2021, Question 1(a)(iii)." },
    // ================================================= Why hexadecimal
    { id: "pl-17", category: "pl-why", prompt: "Explain why hexadecimal is shorter than binary for the same number.", answers: ["Each hexadecimal digit has 16 values but a binary digit has only 2, so fewer digits are needed"],
      keywords: [/^(?=.*\b(16|sixteen|more\s+values|bigger\s+base|higher\s+base|larger\s+base)\b)(?=.*\b(fewer|less|shorter|smaller)\b).*$/i],
      distractors: ["Because hexadecimal uses letters", "Because the computer stores hexadecimal", "Because binary is base 2"],
      working: ["How many values can one hexadecimal digit hold? One binary digit?", "So which needs fewer digits?"], note: "16 values in each digit against 2, so hexadecimal needs fewer digits." },
    { id: "pl-18", category: "pl-why", prompt: "Give two reasons why a ticket number is displayed as hexadecimal instead of binary.", answers: ["It is shorter and easier for the customer to read"],
      keywords: [/^(?=.*\b(shorter|less\s+space|fewer|smaller)\b)(?=.*\b(easier|quicker|read\w*|remember\w*|understand\w*|errors?|mistakes?)\b).*$/i],
      distractors: ["The computer stores hexadecimal", "Hexadecimal uses letters", "Binary is base 2"],
      working: ["Compare the length of 14B with its binary.", "Who reads the ticket?"], note: "Mark scheme, any two from: easier / quicker for the customer to understand / read / remember; takes up less space on the ticket // shorter representation. From Cambridge IGCSE 0478/11, June 2025, Question 2(b)(ii)." },
    { id: "pl-19", category: "pl-why", prompt: "Give one difference between hexadecimal and binary.", answers: ["Binary is base 2 but hexadecimal is base 16"],
      keywords: [/^(?=.*\b(16|sixteen|letters?|a\s*(to|-)\s*f)\b)(?=.*\b(2|two|0\s*and\s*1|1\s*and\s*0|only\s+numbers|numbers\s+only)\b).*$/i],
      distractors: ["They are both number systems", "Hexadecimal is used by computers", "Binary is longer"],
      working: ["What base is each one?", "Which digits does each one use?"], note: "Mark scheme: binary is base-2 whereas hexadecimal is base-16; binary only uses 0 and 1 whereas hexadecimal uses 0 to 9 / A to F. From Cambridge IGCSE 0478/12, November 2024, Question 3(a)(ii)." },
    // ================================================= Advanced: three digits (James 2026-10-29)
    { id: "pl-20", category: "pl-adv", randomize: function () {
        var h; do { h = D[rnd(1, 15)] + D[rnd(0, 15)] + D[rnd(0, 15)]; } while (!/[A-F]/.test(h));
        return convCard([h, "Three digits: 256, 16, 1."]);
      } },
    { id: "pl-21", category: "pl-adv", randomize: function () {
        var h = D[rnd(10, 15)] + D[rnd(0, 15)] + D[rnd(10, 15)];
        return convCard([h, "Three digits: 256, 16, 1."]);
      } },
    { id: "pl-22", category: "pl-adv", randomize: function () {
        var x = rnd(2, 15), h = D[x] + D[rnd(0, 15)] + D[rnd(0, 15)], a = x * 256;
        return { prompt: "In the hexadecimal number " + h + ", what is the left digit worth in denary?", answers: [String(a)], keywords: [num(a)], distractors: wrongNum(a, [x * 16, x * 100, x, a + 256]),
          working: ["Three digits: the place values are 256, 16 and 1.", "The left digit's value x 256."], note: x + " x 256 = " + a + "." };
      } },
    { id: "pl-23", category: "pl-adv", randomize: function () {
        var m = rnd(2, 15), h = D[rnd(1, 15)] + D[m] + D[rnd(0, 15)], a = m * 16;
        return { prompt: "In the hexadecimal number " + h + ", what is the middle digit worth in denary?", answers: [String(a)], keywords: [num(a)], distractors: wrongNum(a, [m * 256, m, m * 10, a + 16]),
          working: ["Three digits: the place values are 256, 16 and 1.", "The middle digit's value x 16."], note: m + " x 16 = " + a + "." };
      } },
    { id: "pl-24", category: "pl-adv", prompt: "What is the largest three digit hexadecimal number in denary?", answers: ["4095"], keywords: [num(4095)], distractors: ["999", "4096", "255"],
      working: ["The largest digit is F (15), so the largest number is FFF.", "15 x 256 + 15 x 16 + 15."], note: "FFF = 3840 + 240 + 15 = 4095. From Cambridge IGCSE 0478/12, November 2025, Question 1(b)." }
  ];
}

const DRILLS = [
  ['y11-1-3-ext', 'Do Now Extension: 1.1 and 1.2. Every card has an example on different numbers and two nudges.',
    'Year 11 Extension: Binary Recap', '1.3 Do Now Extension',
    [['ex-b2d', 'Binary to Denary'], ['ex-d2b', 'Denary to Binary'], ['ex-check', 'Check It Back']], extCards],
  ['y11-1-3-digits', 'Activity 1: the digits A to F from memory.',
    'Year 11, 1.3: Know Your Digits', 'Cambridge IGCSE Computer Science 0478',
    [['dg-value', 'Letters and Values'], ['dg-order', 'Order and Add']], digitCards],
  ['y11-1-3-convert', 'Activity 2: what each digit is worth, convert, and find Sam\'s slips.',
    'Year 11, 1.3: Multiply, Add, Check', 'Cambridge IGCSE Computer Science 0478',
    [['cv-parts', 'What Is It Worth?'], ['cv-convert', 'Convert'], ['cv-check', 'Find the Slip']], convertCards],
  ['y11-1-3-hex', 'Plenary: the digits A to F, place values, real exam conversions and why hexadecimal is used.',
    'Year 11, 1.3: Hexadecimal Digits', 'Cambridge IGCSE Computer Science 0478',
    [['pl-digits', 'The Digits'], ['pl-places', 'Place Values'], ['pl-convert', 'Exam Conversions'], ['pl-why', 'Why Hexadecimal?'], ['pl-adv', 'Advanced: Three Digits']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  { const bad = /nibble|\b4 bits\b|two.s complement|overflow|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b/i.exec(src.split(id).join('')); assert(!bad, `drill ${id} names a later term: ${bad}`); }
  if (id === 'y11-1-3-ext') assert(!/hexadecimal/i.test(src.split('DrillData.register')[1]), 'extension drill names hexadecimal');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes and is the real conversion, no distractor passes, and no example or
// working step gives the answer away.
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
    for (const card of d.cards) {
      for (let n = 0; n < (card.randomize ? 400 : 1); n++) {
        const r = card.randomize ? { ...card, ...card.randomize() } : card;
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  '].forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        assert(!(r.distractors || []).includes(ans), `${id} ${card.id}: answer among distractors`);
        const c1 = /Convert the denary number (\d+) to 8-bit binary/.exec(r.prompt) || /Give the right 8-bit binary for (\d+)/.exec(r.prompt);
        if (c1) assert(parseInt(ans, 2) === Number(c1[1]), `${id} ${card.id}: ${c1[1]} is not ${ans}`);
        const c2 = /Convert the 8-bit binary number ([01]+) to denary/.exec(r.prompt) || /wrote ([01]{8})\. Convert/.exec(r.prompt);
        if (c2) assert(Number(ans) === parseInt(c2[1], 2), `${id} ${card.id}: ${c2[1]} is not ${ans}`);
        const c3 = /Convert the hexadecimal number ([0-9A-F]+) to denary/.exec(r.prompt) || /Sam says ([0-9A-F]{2}) (?:in hexadecimal )?is \d+/.exec(r.prompt) || /hexadecimal number ([0-9A-F]{2}) is/.exec(r.prompt) || /What is the hexadecimal number ([0-9A-F]+) in denary/.exec(r.prompt);
        if (c3 && /hexadecimal/.test(r.prompt)) assert(Number(ans) === parseInt(c3[1], 16), `${id} ${card.id}: ${c3[1]} is not ${ans}`);
        if (r.example && ans.length >= 2) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (r.working && !pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: working nudges`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario|\bdecimal\b/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '1.3: Hexadecimal Digits', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-2-denary in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-2-denary"/.exec(raw);
    assert(m && raw.split('"y11-1-2-denary"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-2-denary"').join(`"y11-1-2-denary",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
