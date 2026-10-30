// Builds LessonData/y11-1-4-hexconv.json: Year 11, 1.4: Hexadecimal Conversions (syllabus 0478 1.1: convert denary to
// hexadecimal, and convert between binary and hexadecimal using nibbles). The fourth lesson of the 2026-27 Year 11
// plan, after y11-1-3-hex. Why hexadecimal is used is the next lesson (1.5), so it is not taught here.
//   node tools/build_y11_1_4_hexconv.mjs
// It also writes the lesson's four drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-3-hex (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: EAL-light, one idea per slide, every slide's core question a WHY (Term 1b), a teacher-only Think, Pair, Share
// under every heading, predict-then-check, compare slides.
// Real questions, each value checked below against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:   0478/13 November 2022 Q2(a), adapted to typed answers (72, 245, 15);
//             0478/12 March 2022 Q1(c) (1A = 26) and 0478/13 June 2024 Q3(a)(ii) (A2F = 2607)
//   Exam:     0478/13 November 2023 Q2(c) (9, 26, 65 = 9, 1A, 41); 0478/11 June 2024 Q2(b) (20, 32, 165 = 14, 20, A5);
//             0478/12 November 2024 Q3(c) (14, 100, 250 = E, 64, FA); 0478/11 June 2025 Q2(c)(ii) (109, 415 = 6D, 19F);
//             0478/12 June 2023 Q2(a) (10010011, 00001101 = 93, 0D); 0478/13 June 2025 Q1(c)(ii) (19, B4);
//             0478/11 June 2022 Q4(c) (42, CE); 0478/12 November 2021 Q1(c) (25, 1B; tick boxes);
//             0478/13 June 2022 Q2(a) (05A, 18C, 29F to 12 bits) and Q2(c) (40D, 07E); 0478/12 November 2025 Q1(a), (b)
//             (FFF, 4095)
//   Drills only: 0478/12 March 2024 Q8(a)(i) (236 = EC); 0478/12 June 2023 Q2(d) (301 = 12D); 0478/12 June 2021 Q1(a)
//             hexadecimal column (31, 7B, C8); 0478/11 November 2024 Q3(b)(ii) and (c)(ii); 0478/12 March 2022 Q1(b);
//             0478/13 June 2023 Q1(b) and Q1(f); 0478/12 November 2023 Q2(b); 0478/11 June 2026 Q3(b) to (e);
//             0478/13 November 2025 Q1(c); 0478/12 March 2023 Q6(a); 0478/11 November 2022 Q3(a), (b), (d);
//             0478/12 November 2022 Q1(f)(iii); 0478/12 November 2025 Q1(c), (d); 0478/12 June 2026 Q3(b), (c);
//             0478/13 June 2024 Q3(a)(i), (b)(i); 0478/13 November 2022 Q2(b); 0478/12 June 2022 Q2(a);
//             0478/13 June 2021 Q1(a)(ii); 0478/13 November 2024 Q1(c)(ii); 0478/12 June 2025 Q1(d);
//             0478/11 June 2025 Q2(b)(i)
// Marking: hexadecimal answers ignore case and spaces. Denary to hexadecimal accepts 0s on the left (the mark scheme's
// "(0)6D"); binary to hexadecimal needs one digit for every nibble (the mark schemes give 0D, 07E, 095, 09AE with a
// mark for the 0). Binary answers allow spaces but need every bit (the mark schemes mark each nibble).
// Drills: y11-1-4-ext (Do Now Extension), y11-1-4-divide (Activity 1), y11-1-4-nibbles (Activity 2),
// y11-1-4-hexconv (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-4-hexconv';
const P = 'y11-14h';
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
const PV8 = pvs(8);
const bin8 = (n) => n.toString(2).padStart(8, '0');
const onIdx = (b) => [...b].map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0);
const onVals = (b) => pvs(b.length).filter((_, i) => b[i] === '1');
const sumText = (b) => onVals(b).join(' + ');
const hv = (h) => parseInt(h, 16);
const hpv = (n) => Array.from({ length: n }, (_, i) => 16 ** (n - 1 - i));
const toHex = (n) => n.toString(16).toUpperCase();
const nib = (d) => hv(d).toString(2).padStart(4, '0');
const h2b = (h) => [...h].map(nib).join('');
const b2h = (b) => { let o = ''; for (let i = 0; i < b.length; i += 4) o += toHex(val(b.slice(i, i + 4))); return o; };
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
// Answers. num: a denary number (0s on the left allowed). hexAns: a hexadecimal number, case and spaces ignored; with
// strict every digit must be there (binary to hexadecimal), otherwise 0s on the left are optional.
const num = (n) => `^\\s*(=\\s*)?0*${n}(\\s*(in\\s+)?(denary|base\\s*10))?\\s*\\.?\\s*$`;
const HEX_TAIL = '(\\s*(in\\s+)?(hexadecimal|base\\s*16))?\\s*\\.?\\s*$';
const hexAns = (h, strict = false) => {
  const core = strict ? h : h.replace(/^0+(?=.)/, '');
  return '^\\s*(=\\s*)?' + (strict ? '' : '(?:0\\s*)*') + [...core].join('\\s*') + HEX_TAIL;
};
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*${[...b].join('\\s*')}${BIN_TAIL}`;
// Do Now 1 only: the 0s on the left may be left out, as 1.2 and its mark schemes allow ("(0000)1111").
const binAnyAns = (b) => `^\\s*(?:0\\s*)*${[...b.replace(/^0+(?=.)/, '')].join('(?:\\s*)')}${BIN_TAIL}`;
function fitRows(n) {
  let left = n;
  return PV8.map((p) => { const before = left, fits = left >= p; if (fits) left -= p; return { p, before, fits, bit: fits ? '1' : '0', after: left }; });
}

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
function bitTable(bits, { hl = [], n = bits ? bits.length : 8, label = true } = {}) {
  const w = 46, f = 18, th = TH(w, f - 4);
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (hl.includes(i) ? HL : bits && bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const head = `<tr>${lab('Place value')}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>`;
  const body = bits ? `<tr>${lab('Bit')}${[...bits].map((c, i) => `<td style="${td(i)}">${c}</td>`).join('')}</tr>` : '';
  return `<table style="border-collapse:collapse;margin:0 auto">${head}${body}</table>`;
}
function fitTable(n) {
  const rows = fitRows(n), th = TH(46, 14);
  const lab = (t) => `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>`;
  const td = (t, mono) => `<td style="padding:5px 4px;min-width:46px;text-align:center;border:1px solid var(--line-strong);${mono ? 'font:700 20px var(--font-mono, monospace)' : 'font-size:16px'}">${t}</td>`;
  return '<table style="border-collapse:collapse;margin:0 auto">' +
    `<tr>${lab('Place value')}${PV8.map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>` +
    `<tr>${lab('Left')}${rows.map((r) => td(r.before, false)).join('')}</tr>` +
    `<tr>${lab('Bit')}${rows.map((r) => td(r.bit, true)).join('')}</tr></table>`;
}
function hexTable(h, { n = h ? h.length : 2, value = false, worth = false, label = true } = {}) {
  const th = TH(70, 16);
  const tdS = (big) => `padding:6px 8px;min-width:70px;text-align:center;border:1px solid var(--line-strong);${big ? 'font:700 26px var(--font-mono, monospace)' : 'font-size:18px'}`;
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const p = hpv(n);
  let out = `<tr>${lab('Place value')}${p.map((x) => `<th style="${th}">${x}</th>`).join('')}</tr>`;
  if (h) {
    out += `<tr>${lab('Digit')}${[...h].map((c) => `<td style="${tdS(true)}">${c}</td>`).join('')}</tr>`;
    if (value) out += `<tr>${lab('Value')}${[...h].map((c) => `<td style="${tdS(false)}">${hv(c)}</td>`).join('')}</tr>`;
    if (worth) out += `<tr>${lab('Worth')}${[...h].map((c, i) => `<td style="${tdS(false)}">${hv(c)} &times; ${p[i]} = ${hv(c) * p[i]}</td>`).join('')}</tr>`;
  }
  return `<table style="border-collapse:collapse;margin:0 auto">${out}</table>`;
}
// Bits in nibbles: each nibble under 8 4 2 1, with its hexadecimal digit underneath. Nibbles are split from the right.
function nibTable(bits, { digits = true } = {}) {
  const groups = []; for (let i = 0; i < bits.length; i += 4) groups.push(bits.slice(i, i + 4));
  const th = TH(34, 14);
  const cell = (t, extra = '') => `<td style="padding:5px 3px;min-width:34px;text-align:center;font:700 20px var(--font-mono, monospace);border:1px solid var(--line-strong)${extra}">${t}</td>`;
  const gap = '<td style="width:14px;border:0"></td>';
  const head = groups.map(() => [8, 4, 2, 1].map((p) => `<th style="${th}">${p}</th>`).join('')).join(gap);
  const body = groups.map((g) => [...g].map((c) => cell(c, c === '0' ? ';color:var(--muted-2)' : '')).join('')).join(gap);
  const dig = groups.map((g) => `<td colspan="4" style="padding:5px;text-align:center;font:700 24px var(--font-mono, monospace);border:1px solid var(--line-strong)${HL}">${b2h(g)}</td>`).join(gap);
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${head}</tr><tr>${body}</tr>${digits ? `<tr>${dig}</tr>` : ''}</table>`;
}
// The 16 hexadecimal digits, each over its nibble, as cells that wrap on a narrow screen.
function nibbleChart() {
  const cell = (c) => `<div style="display:grid;min-width:52px;text-align:center;border:1px solid var(--line-strong);border-radius:6px">` +
    `<div style="padding:3px 2px;font:700 19px var(--font-mono, monospace);background:var(--surface-2)">${c}</div>` +
    `<div style="padding:3px 2px;font:15px var(--font-mono, monospace)">${nib(c)}</div></div>`;
  return '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">' + '0123456789ABCDEF'.split('').map(cell).join('') + '</div>' +
    '<p style="margin:4px 0 0;text-align:center;font-size:15px;color:var(--muted)">Top: hexadecimal digit. Bottom: its 4 bits.</p>';
}
const big = (t) => `<div style="text-align:center;${MONO};font-size:34px;font-weight:700;letter-spacing:4px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const box = (t) => `<div style="display:grid;gap:6px;padding:10px 12px;border-radius:10px;background:var(--surface-2)">${t}</div>`;
const boxTitle = (t) => `<div style="font-weight:700;font-size:17px">${t}</div>`;
const boxLine = (t) => `<div style="font-size:16px">${t}</div>`;
const verdict = (t, good) => `<div style="font-weight:700;font-size:17px;${good ? 'color:var(--good)' : 'color:var(--bad, var(--danger, #b42318))'}">${t}</div>`;
const monoLine = (t) => `<div style="text-align:center;${MONO};font-size:22px;font-weight:700">${t}</div>`;

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
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
const steps = [];
const side2 = hexTable('', { n: 2 });
const side3 = hexTable('', { n: 3 });
const D2H_FB = 'Divide by 16. The whole number is the left digit, the remainder is the right digit. 10 to 15 are A to F.';
const D2H3_FB = 'Divide by 16 and keep the remainder. If the whole number is more than 15, divide it by 16 again.';
const B2H_FB = 'Split into nibbles from the right. Each nibble (8, 4, 2, 1) gives one digit, even 0000.';
const H2B_FB = 'Write every digit as 4 bits (8, 4, 2, 1), even 0 and 1. Keep the digits in order.';
const d2hPart = (n, extra = {}) => Object.assign({ label: String(n), answer: hexAns(toHex(n)), feedback: n > 255 ? D2H3_FB : D2H_FB }, extra);
const b2hPart = (b, extra = {}) => Object.assign({ label: b, answer: hexAns(b2h(b), true), feedback: B2H_FB }, extra);
const h2bPart = (h, extra = {}) => Object.assign({ label: h, answer: binFull(h2b(h)), feedback: H2B_FB }, extra);

// ---------------------------------------------------------------- Do Now 1 (1.2): 0478/13 November 2022 Q2(a)
// Mark scheme (the lines drawn): 72 = 01001000; 245 = 11110101; 15 = 00001111.
const DN1 = [72, 245, 15];
const WT_N = 166, WT_S = 9;
const WT_DN1 = { title: 'Walk me through it: denary to binary', steps: [
  { text: `<strong>A similar question.</strong> Give the 8-bit binary value for the denary value ${WT_N}.`, visual: big(String(WT_N)) },
  { text: 'Write the 8 place values. Start at 128 on the left.', visual: bitTable(null) },
  { text: `Does 128 fit in ${WT_N}? Yes: write 1. ${WT_N} - 128 = ${WT_N - 128} left.`, visual: line(kw(`${WT_N} - 128 = ${WT_N - 128}`)) },
  { text: `64 is too big for ${WT_N - 128}: write 0. 32 fits: write 1. ${WT_N - 128} - 32 = ${WT_N - 160} left.`, visual: line(kw(`${WT_N - 128} - 32 = ${WT_N - 160}`)) },
  { text: `16 and 8 are too big for ${WT_N - 160}: write 0 and 0. 4 fits: write 1, 2 left. 2 fits: write 1, 0 left. 1 is too big: write 0.`, visual: fitTable(WT_N) },
  { text: `So ${WT_N} is <strong>${bin8(WT_N)}</strong>. Check: ${sumText(bin8(WT_N))} = ${WT_N}.`, visual: line(kw(`${sumText(bin8(WT_N))} = ${WT_N}`)) },
  { text: `A small number works the same way. ${WT_S} = 8 + 1, so it is ${bin8(WT_S)}.`, visual: bitTable(bin8(WT_S), { hl: onIdx(bin8(WT_S)) }) },
  { text: 'Now do the same for each value in the question: start at 128, fits: write 1 and subtract, too big: write 0.', visual: note('fits &rarr; 1 and subtract &nbsp; too big &rarr; 0') },
] };
steps.push(checkStep('do-now', 'Do Now: Denary to Binary (1 of 2)', 'Do Now: Denary to Binary (1 of 2)',
  'Recap of 1.2 Denary to Binary. Adapted from ' + cite('0478/13, November 2022, Question 2(a)') + ' Denary values are converted to binary values to be processed by a computer. Give the 8-bit binary value for each denary value.',
  DN1.map((n) => ({ label: String(n), answer: binAnyAns(bin8(n)), feedback: 'Start at 128. Fits: write 1 and subtract. Too big: write 0.' })),
  ['Why do we start with the biggest place value that fits?', 'Each place value is bigger than all the smaller ones added together, so if it fits it must be used.'],
  '', 3));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2 (1.3): 0478/12 March 2022 Q1(c), 0478/13 June 2024 Q3(a)(ii)
// Mark schemes: 26; 2607.
const WT_DN2 = { title: 'Walk me through it: hexadecimal to denary', steps: [
  { text: '<strong>A similar question.</strong> Convert the hexadecimal number B7 to denary.', visual: big('B7') },
  { text: 'Write the place values. Two digits: 16 and 1.', visual: hexTable('B7') },
  { text: 'Change each digit to its value. B = 11. 7 = 7.', visual: hexTable('B7', { value: true }) },
  { text: 'Multiply each value by its place value: 11 &times; 16 = 176, and 7 &times; 1 = 7.', visual: hexTable('B7', { value: true, worth: true }) },
  { text: `Add: 176 + 7 = ${hv('B7')}. So B7 is <strong>${hv('B7')}</strong>.`, visual: line(kw(`176 + 7 = ${hv('B7')}`)) },
  { text: 'Three digits: the place values are 256, 16 and 1. For 2E1, E = 14.', visual: hexTable('2E1', { value: true, worth: true }) },
  { text: `Add: 512 + 224 + 1 = ${hv('2E1')}. So 2E1 is <strong>${hv('2E1')}</strong>.`, visual: line(kw(`512 + 224 + 1 = ${hv('2E1')}`)) },
  { text: 'Now do the same for the question: each value, times its place value, then add.', visual: note('values &rarr; multiply &rarr; add') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Hexadecimal to Denary (2 of 2)', 'Do Now: Hexadecimal to Denary (2 of 2)',
  'Recap of 1.3 Hexadecimal Digits. (a) ' + cite('0478/12, March 2022, Question 1(c)') + ' (b) ' + cite('0478/13, June 2024, Question 3(a)(ii)') + ' A programmer looks at an address in memory, displayed as the hexadecimal number A2F.', [
    { label: 'Convert the hexadecimal number 1A to denary.', answer: num(26), feedback: 'Each digit\'s value times its place value (16 and 1), then add.' },
    { label: 'Convert the address A2F to denary.', answer: num(2607), feedback: 'Three digits: place values 256, 16 and 1. A = 10, F = 15.' },
  ], ['Why is the left column of a three digit hexadecimal number worth 256?', 'Each column is 16 times the column to its right: 16 &times; 16 = 256.'], side3));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-4-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Hexadecimal Conversions',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Hexadecimal Conversions</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> convert <strong>denary</strong> to <strong>hexadecimal</strong>.', 'Convert <strong>binary</strong> to hexadecimal, and back again.', 'Why each method works.']) +
    why('Why is it useful to be able to convert both ways between two number systems?', 'Then you can check any answer by converting it back.') });

// ---------------------------------------------------------------- denary to hexadecimal: divide by 16
const EXD = 75; // 4B
steps.push(concept('concept-divide', 'Denary to Hexadecimal: Why Divide by 16?',
  `The left hexadecimal column counts 16s. Predict: how can you find how many 16s are in ${EXD}?`,
  `<p>Divide ${EXD} by 16. 16 goes in ${Math.floor(EXD / 16)} times (${Math.floor(EXD / 16) * 16}), with ${EXD % 16} left over. So ${EXD} is ${Math.floor(EXD / 16)} sixteens and ${EXD % 16} ones.</p>`,
  columns(facts(['Hexadecimal columns are <strong>16</strong> and <strong>1</strong>.', 'Divide by 16. The <strong>whole number</strong> is how many 16s: the left digit.',
    'The <strong>remainder</strong> is what is left over: the right digit.', 'Change 10 to 15 into <strong>A to F</strong>.', 'Check: left digit &times; 16 + right digit.']),
    '<div style="display:grid;gap:8px">' + box(boxTitle(`${EXD} &divide; 16`) + monoLine(`${EXD} &divide; 16 = ${Math.floor(EXD / 16)} remainder ${EXD % 16}`) +
      boxLine(`${Math.floor(EXD / 16)} sixteens: left digit <strong>${Math.floor(EXD / 16)}</strong>. Remainder ${EXD % 16} = <strong>${toHex(EXD % 16)}</strong>: right digit.`)) +
    hexTable(toHex(EXD), { value: true, worth: true }) + line(`${toHex(EXD)}: ${Math.floor(EXD / 16) * 16} + ${EXD % 16} = <strong>${EXD}</strong>`) + '</div>')));

steps.push(mcStep('predict-90', 'Predict: 90 in Hexadecimal', 'Predict: 90 in Hexadecimal', '', [
  { prompt: '90 &divide; 16 = 5 remainder 10. What is 90 in hexadecimal?', options: ['510', '5A', 'A5'], correct: 1,
    explain: 'The 5 sixteens are the left digit. The remainder 10 is one digit: A. So 5A. Check: 5 x 16 + 10 = 90.' },
], ['In 50 &divide; 16 = 3 remainder 2, which number tells you how many 16s, and why?', 'The whole number, 3. It counts how many times 16 fits. The remainder 2 goes in the 1s column.']));

const RV = toHex(EXD).split('').reverse().join('');
steps.push(concept('compare-order', 'Compare: Which Digit Goes First?',
  `Sam converts ${EXD} and writes ${RV}. Why is that wrong, when ${Math.floor(EXD / 16)} and ${EXD % 16} are the right numbers?`,
  `<p>${RV} means ${hv(RV[0])} sixteens and ${hv(RV[1])} ones: ${hv(RV[0])} &times; 16 + ${hv(RV[1])} = ${hv(RV)}, not ${EXD}. The number of 16s must go on the left.</p>`,
  facts(['The <strong>whole number</strong> counts the 16s, so it goes on the <strong>left</strong>.', 'The <strong>remainder</strong> goes on the right.', 'Convert back to check. A slip shows up straight away.']) +
  columns(box(boxTitle(`Ana: ${toHex(EXD)}`) + monoLine(`${hv(toHex(EXD)[0])} &times; 16 + ${hv(toHex(EXD)[1])} = ${EXD}`) + verdict('Back to ' + EXD + ': right.', true)),
    box(boxTitle(`Sam: ${RV}`) + monoLine(`${hv(RV[0])} &times; 16 + ${hv(RV[1])} = ${hv(RV)}`) + verdict(`${hv(RV)} is not ${EXD}: wrong.`, false)))));

// 0478/13 November 2023 Q2(c). Mark scheme: 9; 1A; 41.
const E1 = [9, 26, 65];
steps.push(checkStep('exam-1', 'Exam Question: Denary to Hexadecimal (1 of 4)', 'Exam Question: Denary to Hexadecimal (1 of 4)',
  cite('0478/13, November 2023, Question 2(c)') + ' Convert the denary numbers 9, 26 and 65 to hexadecimal.',
  E1.map((n) => d2hPart(n)),
  ['Why do we divide by 16, and not by 10?', 'Hexadecimal is base 16. The left column holds 16s, not tens.'], '', 3));

// 0478/11 June 2024 Q2(b). Mark scheme: 14; 20; A5.
const E2 = [20, 32, 165];
steps.push(checkStep('exam-2', 'Exam Question: Denary to Hexadecimal (2 of 4)', 'Exam Question: Denary to Hexadecimal (2 of 4)',
  cite('0478/11, June 2024, Question 2(b)') + ' Hypertext markup language (HTML) colour codes can be represented as hexadecimal. Denary numbers can be converted to hexadecimal. Convert the three denary numbers to hexadecimal.',
  E2.map((n) => d2hPart(n)),
  ['Why is it worth checking each answer by converting it back?', 'Converting back must give the number you started with. If it does not, there is a slip.'], '', 3));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Divide by 16', 'drill-y11-1-4-divide', 'Activity 1: Divide by 16',
  'How many 16s, the remainder, the letter, then whole conversions and Sam\'s slips. Most numbers come from real exam papers.',
  ['Why does a remainder of 12 change before you write it down?', '12 is two symbols. One column holds one digit, so 12 is written as C.']));

// 0478/12 November 2024 Q3(c). Mark scheme: E; 64; FA.
const E3 = [14, 100, 250];
steps.push(checkStep('exam-3', 'Exam Question: Denary to Hexadecimal (3 of 4)', 'Exam Question: Denary to Hexadecimal (3 of 4)',
  cite('0478/12, November 2024, Question 3(c)') + ' Denary numbers can also be converted to hexadecimal. Give the hexadecimal number for each of the three denary numbers.',
  E3.map((n) => d2hPart(n)),
  ['Why can a remainder never be 16 or more?', 'If 16 or more were left over, 16 would fit in one more time.'], '', 3));

// ---------------------------------------------------------------- three digits: divide again
const EX3 = 500; // 1F4
steps.push(concept('concept-again', 'Three Digits: Why Divide Again?',
  `${EX3} &divide; 16 = ${Math.floor(EX3 / 16)} remainder ${EX3 % 16}. Why can ${Math.floor(EX3 / 16)} not be the left digit?`,
  `<p>One digit can only hold up to 15. ${Math.floor(EX3 / 16)} sixteens is too many for one column, so divide ${Math.floor(EX3 / 16)} by 16 again.</p>`,
  columns(facts(['Divide by 16. The <strong>remainder</strong> is the right digit.', 'Whole number <strong>more than 15</strong>? Divide it by 16 again.', 'That remainder is the middle digit. The new whole number is the left digit.', 'Check with the place values <strong>256, 16, 1</strong>.']),
    '<div style="display:grid;gap:8px">' + box(monoLine(`${EX3} &divide; 16 = ${Math.floor(EX3 / 16)} remainder ${EX3 % 16}`) + boxLine(`Right digit: <strong>${toHex(EX3 % 16)}</strong>`) +
      monoLine(`${Math.floor(EX3 / 16)} &divide; 16 = ${Math.floor(EX3 / 256)} remainder ${Math.floor(EX3 / 16) % 16}`) + boxLine(`Middle digit: <strong>${toHex(Math.floor(EX3 / 16) % 16)}</strong>. Left digit: <strong>${Math.floor(EX3 / 256)}</strong>`)) +
    hexTable(toHex(EX3), { value: true, worth: true }) + line(`${toHex(EX3)}: 256 + 240 + 4 = <strong>${EX3}</strong>`) + '</div>')));

// 0478/11 June 2025 Q2(c)(ii). Mark scheme: (0)6D; 19F.
const E4 = [109, 415];
steps.push(checkStep('exam-4', 'Exam Question: Ticket Numbers (4 of 4)', 'Exam Question: Ticket Numbers (4 of 4)',
  cite('0478/11, June 2025, Question 2(c)(ii)') + ' A clothes store displays ticket numbers in hexadecimal. The ticket numbers could also be represented as denary. Convert the two denary numbers into hexadecimal.',
  E4.map((n) => d2hPart(n)),
  ['Why can you check a three digit answer with the place values 256, 16 and 1?', 'They are the column values. Each digit\'s value times its column, added up, must give the starting number.'], side3));

// ---------------------------------------------------------------- nibbles: why 4 bits
steps.push(concept('concept-nibble', 'Why 4 Bits Make One Hexadecimal Digit',
  'One hexadecimal digit has 16 values. Predict: how many bits do you need to make 16 different patterns?',
  '<p>4 bits. Each extra bit doubles the patterns: 2, 4, 8, 16. So 2 &times; 2 &times; 2 &times; 2 = 16.</p>',
  columns(facts(['1 bit: 2 patterns. 2 bits: 4. 3 bits: 8. <strong>4 bits: 16</strong>.', '16 = 2 &times; 2 &times; 2 &times; 2 (2 to the power 4).',
    '4 bits go from 0000 to 1111: <strong>0 to 15</strong>, just like one hexadecimal digit.', 'A group of 4 bits is called a <strong>nibble</strong>.',
    '8 bits = 2 nibbles = 2 digits. 12 bits = 3 nibbles = 3 digits.']), nibbleChart())));

steps.push(mcStep('predict-nibble', 'Predict: One Nibble, One Digit', 'Predict: One Nibble, One Digit', '', [
  { prompt: 'Which hexadecimal digit is the nibble 1011?', options: ['D', '11', 'B'], correct: 2,
    explain: '1011 = 8 + 2 + 1 = 11. One digit for 11 is B.' },
], ['Why do the place values in a nibble go 8, 4, 2, 1?', 'They are the binary place values for 4 bits: start at 1 on the right and double each time.']));

// ---------------------------------------------------------------- binary to hexadecimal
const EXB = '10111100'; // BC
steps.push(concept('concept-split', 'Binary to Hexadecimal: Split Into Nibbles',
  `Predict: how could you change ${EXB} to hexadecimal without working out its denary value?`,
  `<p>Split it into two nibbles, ${EXB.slice(0, 4)} and ${EXB.slice(4)}. Change each nibble to one digit: ${b2h(EXB.slice(0, 4))} and ${b2h(EXB.slice(4))}.</p>`,
  columns(facts(['Split the bits into <strong>nibbles</strong>, starting from the <strong>right</strong>.', 'Each nibble has place values <strong>8, 4, 2, 1</strong>.', 'Add them, then change 10 to 15 into A to F.',
    'One nibble gives <strong>one digit</strong>, even 0000 (the digit 0).']),
    '<div style="display:grid;gap:8px">' + nibTable(EXB) + line(`${EXB.slice(0, 4)} = 8 + 2 + 1 = 11 = ${b2h(EXB.slice(0, 4))}`) + line(`${EXB.slice(4)} = 8 + 4 = 12 = ${b2h(EXB.slice(4))}`) + line(`So ${EXB} is <strong>${b2h(EXB)}</strong>`) + '</div>')));

const SPL = '111010'; // right: 0011 1010 = 3A; left: 1110 10 = E2
steps.push(concept('compare-split', 'Compare: Why Split From the Right?',
  `${SPL} has 6 bits. Why do we split it from the right, and not from the left?`,
  `<p>The right bit is always worth 1. Splitting from the right keeps every bit in its place value. Then fill the last nibble with 0s on the left.</p>`,
  facts(['The <strong>right</strong> bit is worth 1, so start there.', 'Not enough bits for the last nibble? Add <strong>0s on the left</strong>.', 'Adding 0s on the left does not change the value.']) +
  columns(box(boxTitle('From the right') + monoLine(`00${SPL.slice(0, 2)} ${SPL.slice(2)}`) + monoLine(b2h('00' + SPL)) + boxLine(`${hv(b2h('00' + SPL))}, the same as ${SPL}.`) + verdict('Right.', true)),
    box(boxTitle('From the left') + monoLine(`${SPL.slice(0, 4)} ${SPL.slice(4)}`) + monoLine(`${b2h(SPL.slice(0, 4))}${val(SPL.slice(4))}`) + boxLine(`${hv(b2h(SPL.slice(0, 4)) + val(SPL.slice(4)))}, but ${SPL} is ${val(SPL)}.`) + verdict('Wrong.', false)))));

// 0478/12 June 2023 Q2(a). Mark scheme, one mark per character: 9, 3; 0, D.
const E5 = ['10010011', '00001101'];
steps.push(checkStep('exam-5', 'Exam Question: Binary to Hexadecimal (1 of 2)', 'Exam Question: Binary to Hexadecimal (1 of 2)',
  cite('0478/12, June 2023, Question 2(a)') + ' Binary numbers can be converted to hexadecimal. Convert the two binary numbers to hexadecimal.',
  E5.map((b) => b2hPart(b, { marks: 2 })),
  ['Why does each nibble give exactly one hexadecimal digit?', 'A nibble holds 0 to 15. One hexadecimal digit holds 0 to 15 too.'], '', 2));

// 0478/13 June 2025 Q1(c)(ii). Mark scheme: 19; B4.
const E6 = ['00011001', '10110100'];
steps.push(checkStep('exam-6', 'Exam Question: Binary to Hexadecimal (2 of 2)', 'Exam Question: Binary to Hexadecimal (2 of 2)',
  cite('0478/13, June 2025, Question 1(c)(ii)') + ' A student records a song. Two binary numbers stored from the recording are 00011001 and 10110100. Convert the two binary numbers to hexadecimal numbers.',
  E6.map((b) => b2hPart(b)),
  ['Why must you count 8, 4, 2, 1 again in every nibble?', 'Each nibble becomes its own digit, so each one starts again from 1 on the right.'], '', 2));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Nibbles', 'drill-y11-1-4-nibbles', 'Activity 2: Nibbles',
  'Nibbles to digits and back, binary to hexadecimal, hexadecimal to binary, and Sam\'s slips. Most numbers come from real exam papers.',
  ['Why is a nibble quicker to convert than a whole 8-bit number?', 'A nibble is only 0 to 15, so there is no big number to divide or add up.']));

// ---------------------------------------------------------------- hexadecimal to binary
const EXH = '3B';
steps.push(concept('concept-back', 'Hexadecimal to Binary: One Digit, Four Bits',
  'To go back from hexadecimal to binary, predict: how many bits does each digit become, and why?',
  '<p>4 bits each. One digit has 16 values, and 4 bits make exactly 16 patterns.</p>',
  columns(facts(['Change each digit to its value (B = 11).', 'Write that value as <strong>4 bits</strong>: 8, 4, 2, 1.', 'Put the nibbles side by side, in the same order.', 'Two digits give 8 bits. Three digits give 12 bits.']),
    '<div style="display:grid;gap:8px">' + hexTable(EXH, { label: false }) + line(`3 = 2 + 1 = ${nib('3')}. B = 11 = 8 + 2 + 1 = ${nib('B')}.`) + nibTable(h2b(EXH)) + line(`So ${EXH} is <strong>${spaced(h2b(EXH))}</strong>`) + '</div>')));

const SH = '81';
steps.push(concept('compare-back', 'Compare: Why Every Digit Needs 4 Bits',
  `Sam writes the hexadecimal number ${SH} in binary as 1000 1. Why is that wrong?`,
  `<p>1000 1 is 10001, which is ${val('10001')}. The 1 must be 0001, so ${SH} is ${spaced(h2b(SH))}, which is ${hv(SH)}.</p>`,
  facts(['Every digit becomes <strong>exactly 4 bits</strong>.', 'Small digits need 0s: 1 is <strong>0001</strong>, 0 is <strong>0000</strong>.', 'Count your bits: 2 digits, 8 bits.']) +
  columns(box(boxTitle('Ana: 4 bits for every digit') + monoLine(spaced(h2b(SH))) + boxLine(`= ${sumText(h2b(SH))} = ${hv(SH)}, the same as ${SH}.`) + verdict('Right.', true)),
    box(boxTitle('Sam: 1 written as 1') + monoLine('1000 1') + boxLine(`= 10001 = ${val('10001')}, not ${hv(SH)}.`) + verdict('Wrong.', false)))));

// 0478/11 June 2022 Q4(c). Mark scheme, one mark per nibble: 0100 0010; 1100 1110.
const E7 = ['42', 'CE'];
steps.push(checkStep('exam-7', 'Exam Question: Hexadecimal to Binary (1 of 4)', 'Exam Question: Hexadecimal to Binary (1 of 4)',
  cite('0478/11, June 2022, Question 4(c)') + ' The hexadecimal values 42 and CE are converted to binary. Give the binary value for each hexadecimal value.',
  E7.map((h) => h2bPart(h, { marks: 2 })),
  ['Why can you convert each hexadecimal digit on its own?', 'Each digit is exactly one nibble, so the digits do not change each other.'], '', 2));

// 0478/12 November 2021 Q1(c). Mark scheme: 00100101; 00011011.
steps.push(mcStep('exam-8', 'Exam Question: Tick the Binary (2 of 4)', 'Exam Question: Tick the Binary (2 of 4)',
  cite('0478/12, November 2021, Question 1(c)') + ' Hexadecimal values can also be converted to binary values. Tick one box to show the correct 8-bit binary value for each hexadecimal value.', [
    { prompt: '(i) Hexadecimal value 25', options: ['00011001', '00100101', '10100001'], correct: 1, explain: '2 = 0010 and 5 = 0101, so 25 is 0010 0101.' },
    { prompt: '(ii) Hexadecimal value 1B', options: ['00011011', '10110001', '00011010'], correct: 0, explain: '1 = 0001 and B = 11 = 1011, so 1B is 0001 1011.' },
  ], ['Why is it quicker to change each digit to 4 bits than to go through denary?', 'Each digit turns straight into one nibble. There is no dividing or adding of big numbers.']));

// 0478/13 June 2022 Q2(a). Mark scheme: 0000 0101 1010; 0001 1000 1100; 0010 1001 1111.
const E9 = ['05A', '18C', '29F'];
steps.push(checkStep('exam-9', 'Exam Question: Seat Numbers (3 of 4)', 'Exam Question: Seat Numbers (3 of 4)',
  cite('0478/13, June 2022, Question 2(a)') + ' An aeroplane displays each seat number above the seat. The seat number is a hexadecimal value. A 12-bit binary register is used to store the data to display each seat number. Give the 12-bit binary value that would be stored for each hexadecimal seat number.',
  E9.map((h) => h2bPart(h, { marks: 2 })),
  ['Why does a three digit hexadecimal number fit in a 12-bit register?', 'Each digit is 4 bits, and 3 &times; 4 = 12.']));

// 0478/13 June 2022 Q2(c). Mark scheme: 40D; 07E.
const E10 = ['010000001101', '000001111110'];
steps.push(checkStep('exam-10', 'Exam Question: Seat Numbers Back (4 of 4)', 'Exam Question: Seat Numbers Back (4 of 4)',
  cite('0478/13, June 2022, Question 2(c)') + ' Two of the registers store the values 010000001101 and 000001111110. Give the hexadecimal seat number that would be displayed on the screen for each of these binary values.',
  E10.map((b) => b2hPart(b, { marks: 2 })),
  ['Why do we split 12 bits into nibbles starting from the right?', 'The right bit is worth 1. Starting there keeps every bit in its own place value.'], '', 2));

// 0478/12 November 2025 Q1(a) and (b). Mark scheme: FFF; 4095.
steps.push(checkStep('exam-11', 'Exam Question: The Largest Code', 'Exam Question: The Largest Code',
  cite('0478/12, November 2025, Question 1(a) and (b)') + ' A toy store gives each toy a unique code. The codes are 3-digit hexadecimal codes, for example A4B. The computer has 12-bit registers.', [
    { label: 'Give the largest hexadecimal number that can be stored in a 12-bit register.', answer: hexAns('FFF', true), feedback: '12 bits is 3 nibbles. What is the largest digit one nibble can make?' },
    { label: 'Give the largest denary number that can be stored in a 12-bit register.', answer: num(4095), feedback: 'Convert your hexadecimal answer to denary: place values 256, 16, 1.' },
  ], ['Why does adding one more bit double how many numbers fit?', 'The new bit can be 0 or 1, so every old pattern now comes in two versions.'], side3));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Hexadecimal Conversions Drill', 'drill-y11-1-4-hexconv', 'Plenary: Hexadecimal Conversions Drill',
  'Denary to hexadecimal, nibbles, and binary to and from hexadecimal, with real exam numbers. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
// Every value against its mark scheme (the strings are copied from the mark schemes).
const MS_D2H = [[9, '9'], [26, '1A'], [65, '41'], [20, '14'], [32, '20'], [165, 'A5'], [14, 'E'], [100, '64'], [250, 'FA'], [236, 'EC'],
  [109, '6D'], [415, '19F'], [301, '12D'], [49, '31'], [123, '7B'], [200, 'C8']];
MS_D2H.forEach(([n, h]) => assert(toHex(n) === h, `mark scheme ${n} is ${h}`));
const MS_B2H = [['11000000', 'C0'], ['10010011', '93'], ['00001101', '0D'], ['10101110', 'AE'], ['11100011', 'E3'], ['00011001', '19'], ['10110100', 'B4'],
  ['01111001', '79'], ['01110001', '71'], ['10000010', '82'], ['00011111', '1F'], ['010000001101', '40D'], ['000001111110', '07E'], ['100111100000', '9E0'],
  ['000010010101', '095'], ['101011010001', 'AD1'], ['100010100001', '8A1'], ['011100001011', '70B'], ['010001110101', '475'], ['101011101000', 'AE8'],
  ['001011011000', '2D8'], ['000110011011', '19B'], ['0000100110101110', '09AE']];
MS_B2H.forEach(([b, h]) => assert(b2h(b) === h, `mark scheme ${b} is ${h}`));
const MS_H2B = [['42', '0100 0010'], ['CE', '1100 1110'], ['2F', '0010 1111'], ['15', '0001 0101'], ['D6', '1101 0110'], ['14', '0001 0100'], ['A0', '1010 0000'],
  ['C9', '1100 1001'], ['25', '0010 0101'], ['1B', '0001 1011'], ['2A', '0010 1010'], ['51', '0101 0001'], ['E3', '1110 0011'], ['2D', '0010 1101'], ['35', '0011 0101'],
  ['05A', '0000 0101 1010'], ['18C', '0001 1000 1100'], ['29F', '0010 1001 1111'], ['404', '0100 0000 0100'], ['12B', '0001 0010 1011'], ['14B', '0001 0100 1011'],
  ['97A', '1001 0111 1010'], ['8AD', '1000 1010 1101'], ['429', '0100 0010 1001'], ['1A3', '0001 1010 0011'], ['152', '0001 0101 0010'], ['30F', '0011 0000 1111'],
  ['A2F', '1010 0010 1111'], ['101', '0001 0000 0001'], ['091', '0000 1001 0001']];
MS_H2B.forEach(([h, b]) => assert(spaced(h2b(h)) === b, `mark scheme ${h} is ${b}`));
assert(bin8(72) === '01001000' && bin8(245) === '11110101' && bin8(15) === '00001111', 'Do Now 1 from the mark scheme');
assert(hv('1A') === 26 && hv('A2F') === 2607, 'Do Now 2 from the mark scheme');
assert(hv('FFF') === 4095 && hv('A4D') === 2637, 'largest 12-bit');
assert(toHex(EXD) === '4B' && toHex(EX3) === '1F4' && b2h(EXB) === 'BC' && b2h('00' + SPL) === '3A' && hv(SH) === 129 && toHex(90) === '5A', 'examples');
ok('do-now', 0, ['01001000', '1001000', '0100 1000'], ['01001001', '72', '00010010']);
ok('do-now', 1, ['11110101', '1111 0101'], ['11110100', '10101111', 'F5']);
ok('do-now', 2, ['00001111', '1111', '0000 1111'], ['11110000', '15', 'F']);
ok('do-now-2', 0, ['26', '026', '26 in denary'], ['1A', '16', '11', '110']);
ok('do-now-2', 1, ['2607'], ['2560', '1027', 'A2F', '26015']);
ok('exam-1', 0, ['9', '09', '9 in hexadecimal'], ['90', '1001', '19']);
ok('exam-1', 1, ['1A', '1a', '01A', '1 A'], ['110', 'A1', '26', '1 10']);
ok('exam-1', 2, ['41'], ['14', '65', '401']);
ok('exam-2', 0, ['14'], ['41', '20', 'E']);
ok('exam-2', 1, ['20'], ['2', '02', '32', '200']);
ok('exam-2', 2, ['A5', 'a5', '0A5'], ['5A', '105', '165', 'A']);
ok('exam-3', 0, ['E', 'e', '0E'], ['14', 'F', 'D']);
ok('exam-3', 1, ['64'], ['46', '100', '6 4 0']);
ok('exam-3', 2, ['FA', 'fa', '0FA'], ['AF', '1510', 'F10', '250']);
ok('exam-4', 0, ['6D', '06D', '6d'], ['D6', '613', '109']);
ok('exam-4', 1, ['19F', '019F', '19f'], ['F91', '25F', '1915', '415', '9F']);
ok('exam-5', 0, ['93', '9 3'], ['39', '147', '0903']);
ok('exam-5', 1, ['0D', '0d', '0 D'], ['D', 'D0', '13', '00D']);
ok('exam-6', 0, ['19'], ['91', '25', '119']);
ok('exam-6', 1, ['B4', 'b4'], ['4B', '180', '114']);
ok('exam-7', 0, ['01000010', '0100 0010'], ['1000010', '0010 0100', '00101010']);
ok('exam-7', 1, ['11001110', '1100 1110'], ['11101100', '1214', '11001111']);
ok('exam-9', 0, ['000001011010', '0000 0101 1010'], ['01011010', '1011010', '000010100101']);
ok('exam-9', 1, ['000110001100', '0001 1000 1100'], ['110001100', '000110001101']);
ok('exam-9', 2, ['001010011111', '0010 1001 1111'], ['1010011111', '001010011110']);
ok('exam-10', 0, ['40D', '40d', '4 0 D'], ['4D', '40', 'D04', '1037']);
ok('exam-10', 1, ['07E', '07e'], ['7E', 'E70', '126']);
ok('exam-11', 0, ['FFF', 'fff'], ['FF', 'FFFF', '4095', '111']);
ok('exam-11', 1, ['4095'], ['4096', 'FFF', '2047']);
// Every Do Now walkthrough step must fail every part on its slide, and never show an answer.
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
steps.filter((s) => /^do-now(-\d)?$/.test(s.id)).forEach((s) => {
  assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
assert(!/\b(01001000|1001000|11110101|00001111|1111)\b/.test(plain(JSON.stringify(WT_DN1))), 'Do Now 1 walkthrough gives an answer');
assert(!/\b(26|2607)\b/.test(plain(JSON.stringify(WT_DN2))), 'Do Now 2 walkthrough gives an answer');
// Slide examples never use a question's number.
{
  const qsD = [...E1, ...E2, ...E3, ...E4];
  [EXD, EX3, 90, 50].forEach((n) => assert(!qsD.includes(n), `example ${n} is also a question`));
  const qsH = [...E5, ...E6, ...E10].map(b2h).concat(E7, E9, ['25', '1B']);
  [b2h(EXB), '3A', EXH, SH, 'B'].forEach((h) => assert(!qsH.includes(h), `example ${h} is also a question`));
}
// No term before the slide that teaches it (the title slide only names today's topic). Later topics never.
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/nibble/i, 'concept-nibble'], [/12-bit|12 bits/i, 'concept-nibble'], [/remainder/i, 'concept-divide'], [/\bHTML\b/, 'exam-2'],
    [/two.s complement|overflow|\bbytes?\b|ascii|logical shift|mario|\bdecimal\b|\bhex\b|MAC address|error code/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}
steps.filter((s) => s.validatorKey).forEach((s) => assert(V(s.id).length <= 4, `${s.id} has too many parts`));
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => assert(s.items.length <= 2 && s.items.every((it) => it.options.length === new Set(it.options).size), `${s.id} items`));
// Think, Pair, Share never states a check answer on its slide.
steps.filter((s) => s.validatorKey).forEach((s) => {
  const t = /<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content);
  if (t) V(s.id).forEach((v, i) => assert(!new RegExp(v.pattern.source.replace(/^\^/, '\\b').replace(/\$$/, '\\b'), 'i').test(plain(t[1])), `${s.id} TPS gives part ${i}`));
});
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => {
  const t = plain(/<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content)[1]);
  s.items.forEach((it) => assert(!new RegExp('\\b' + it.options[it.correct] + '\\b', 'i').test(t), `${s.id} TPS gives the option`));
});

// ---------------------------------------------------------------- drills
// Real values, each with its citation (checked against the mark schemes above).
const C = (r) => `From Cambridge IGCSE ${r}.`;
const REALD2H = [
  [9, C('0478/13, November 2023, Question 2(c)')], [26, C('0478/13, November 2023, Question 2(c)')], [65, C('0478/13, November 2023, Question 2(c), and 0478/11, November 2024, Question 3(b)(ii)')],
  [20, C('0478/11, June 2024, Question 2(b)')], [32, C('0478/11, June 2024, Question 2(b)')], [165, C('0478/11, June 2024, Question 2(b)')],
  [14, C('0478/12, November 2024, Question 3(c)')], [100, C('0478/12, November 2024, Question 3(c)')], [250, C('0478/12, November 2024, Question 3(c)')],
  [236, C('0478/12, March 2024, Question 8(a)(i)')], [109, C('0478/11, June 2025, Question 2(c)(ii), and 0478/11, November 2024, Question 3(b)(ii)')],
  [49, C('0478/12, June 2021, Question 1(a)')], [123, C('0478/12, June 2021, Question 1(a)')], [200, C('0478/12, June 2021, Question 1(a)')],
  [415, C('0478/11, June 2025, Question 2(c)(ii)')], [301, C('0478/12, June 2023, Question 2(d)')],
];
const REALB2H = [
  ['11000000', C('0478/12, March 2022, Question 1(b)')], ['10010011', C('0478/12, June 2023, Question 2(a)')], ['00001101', C('0478/12, June 2023, Question 2(a)')],
  ['10101110', C('0478/13, June 2023, Question 1(b)')], ['11100011', C('0478/12, November 2023, Question 2(b)')], ['00011001', C('0478/13, June 2025, Question 1(c)(ii)')],
  ['10110100', C('0478/13, June 2025, Question 1(c)(ii)')], ['01111001', C('0478/11, November 2024, Question 3(c)(ii)')], ['01110001', C('0478/11, June 2026, Question 3(d)')],
  ['10000010', C('0478/13, November 2025, Question 1(c)(iii)')], ['00011111', C('0478/12, March 2023, Question 6(a)')],
  ['010000001101', C('0478/13, June 2022, Question 2(c)')], ['000001111110', C('0478/13, June 2022, Question 2(c)')], ['100111100000', C('0478/11, November 2022, Question 3(d)')],
  ['000010010101', C('0478/12, November 2022, Question 1(f)(iii)')], ['101011010001', C('0478/12, November 2022, Question 1(f)(iii)')],
  ['100010100001', C('0478/12, November 2025, Question 1(d)')], ['011100001011', C('0478/12, November 2025, Question 1(d)')],
  ['010001110101', C('0478/12, June 2026, Question 3(c)')], ['101011101000', C('0478/12, June 2026, Question 3(c)')],
  ['001011011000', C('0478/11, June 2026, Question 3(e)')], ['000110011011', C('0478/13, June 2024, Question 3(b)(i)')],
];
const REALH2B = [
  ['42', C('0478/11, June 2022, Question 4(c)')], ['CE', C('0478/11, June 2022, Question 4(c)')], ['2F', C('0478/12, June 2022, Question 2(a)')], ['15', C('0478/12, June 2022, Question 2(a), and 0478/13, November 2024, Question 1(c)(ii)')],
  ['D6', C('0478/12, June 2022, Question 2(a)')], ['14', C('0478/13, June 2021, Question 1(a)(ii)')], ['A0', C('0478/13, June 2021, Question 1(a)(ii)')], ['C9', C('0478/13, June 2021, Question 1(a)(ii)')],
  ['25', C('0478/12, November 2021, Question 1(c)')], ['1B', C('0478/12, November 2021, Question 1(c)')], ['2A', C('0478/11, June 2026, Question 3(b)')],
  ['51', C('0478/13, November 2025, Question 1(c)(i)')], ['E3', C('0478/13, November 2025, Question 1(c)(ii)')], ['2D', C('0478/13, November 2024, Question 1(c)(ii)')], ['35', C('0478/12, June 2025, Question 1(d)')],
  ['05A', C('0478/13, June 2022, Question 2(a)')], ['18C', C('0478/13, June 2022, Question 2(a)')], ['29F', C('0478/13, June 2022, Question 2(a)')],
  ['404', C('0478/11, November 2022, Question 3(a)')], ['12B', C('0478/11, November 2022, Question 3(b)')], ['14B', C('0478/11, June 2025, Question 2(b)(i)')], ['97A', C('0478/11, June 2025, Question 2(b)(i)')],
  ['8AD', C('0478/12, June 2025, Question 1(d)')], ['429', C('0478/12, November 2025, Question 1(c)')], ['1A3', C('0478/12, November 2025, Question 1(c)')],
  ['152', C('0478/12, June 2026, Question 3(b)')], ['30F', C('0478/12, June 2026, Question 3(b)')], ['A2F', C('0478/13, June 2024, Question 3(a)(i)')],
  ['101', C('0478/11, June 2026, Question 3(c)')], ['091', C('0478/13, November 2024, Question 1(c)(ii)')],
];
REALD2H.forEach(([n]) => assert(MS_D2H.some((m) => m[0] === n), `real value ${n} has a mark scheme check`));
REALB2H.forEach(([b]) => assert(MS_B2H.some((m) => m[0] === b), `real value ${b} has a mark scheme check`));
REALH2B.forEach(([h]) => assert(MS_H2B.some((m) => m[0] === h), `real value ${h} has a mark scheme check`));
// Real values for the Extension, each checked against its mark scheme in the 1.1, 1.2 and 1.3 builders.
const REAL11 = [
  ['01010101', C('0478/12, March 2022, Question 1(a)')], ['10101110', C('0478/13, June 2023, Question 1(a)')], ['00011001', C('0478/13, June 2025, Question 1(c)(i)')],
  ['11100011', C('0478/12, November 2023, Question 2(a)')], ['01000110', C('0478/11, November 2023, Question 2(a)')],
];
const REAL12 = [
  [50, C('0478/11, June 2023, Question 1(b)')], [102, C('0478/11, June 2023, Question 1(b)')], [221, C('0478/11, June 2023, Question 1(b)')],
  [46, C('0478/12, March 2021, Question 1(a)')], [171, C('0478/12, March 2021, Question 1(a)')], [242, C('0478/11, June 2022, Question 4(b)')],
  [180, C('0478/12, November 2024, Question 3(b)')], [235, C('0478/12, November 2024, Question 3(b)')], [23, C('0478/11, November 2025, Question 1(b)')],
];
const REALHEX = [
  ['09', C('0478/11, November 2021, Question 1(b)')], ['28', C('0478/11, November 2021, Question 1(b)')], ['A1', C('0478/11, November 2021, Question 1(b)')],
  ['20', C('0478/12, November 2021, Question 1(b)')], ['AB', C('0478/12, November 2021, Question 1(b)')], ['29', C('0478/13, June 2021, Question 1(a)(iii)')],
  ['C8', C('0478/13, June 2021, Question 1(a)(iii)')], ['022', C('0478/11, November 2022, Question 3(c)')], ['0AC', C('0478/11, November 2022, Question 3(c)')],
  ['02C', C('0478/11, June 2025, Question 2(c)(i)')], ['10B', C('0478/11, June 2025, Question 2(c)(i)')], ['0A2', C('0478/12, June 2026, Question 3(d)')], ['104', C('0478/12, June 2026, Question 3(d)')],
];
{ const ms = { '09': 9, '28': 40, 'A1': 161, '20': 32, 'AB': 171, '29': 41, 'C8': 200, '022': 34, '0AC': 172, '02C': 44, '10B': 267, '0A2': 162, '104': 260 };
  REALHEX.forEach(([h]) => assert(ms[h] === hv(h), `1.3 value ${h}`));
  const ms11 = { '01010101': 85, '10101110': 174, '00011001': 25, '11100011': 227, '01000110': 70 };
  REAL11.forEach(([b]) => assert(ms11[b] === val(b), `1.1 value ${b}`)); }

const drillHead = (id, about) => `// Year 11, 1.4: Hexadecimal Conversions. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_4_hexconv.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()
    .split('[] /*REALD2H*/').join(JSON.stringify(REALD2H))
    .split('[] /*REALB2H*/').join(JSON.stringify(REALB2H))
    .split('[] /*REALH2B*/').join(JSON.stringify(REALH2B))
    .split('[] /*REALHEX*/').join(JSON.stringify(REALHEX))
    .split('[] /*REAL11*/').join(JSON.stringify(REAL11))
    .split('[] /*REAL12*/').join(JSON.stringify(REAL12))})()\n});\n`;

// ---- Do Now Extension: 1.1 to 1.3 (binary to denary, denary to binary, check back, hexadecimal to denary). Every card
// has an example on different numbers and two nudges.
function extCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  var PV = [128, 64, 32, 16, 8, 4, 2, 1];
  var D = "0123456789ABCDEF";
  function bin8(n) { var s = n.toString(2); while (s.length < 8) s = "0" + s; return s; }
  function ones(b) { return b.split("").filter(function (c) { return c === "1"; }).length; }
  function hv(h) { return parseInt(h, 16); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?0*" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function plus(b) { var o = []; for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]); return o.join(" + "); }
  function rev(b) { return b.split("").reverse().join(""); }
  function work(h) { var p = h.length === 3 ? [256, 16, 1] : [16, 1]; return h.split("").map(function (c, i) { return hv(c) + " x " + p[i]; }).join(" + ") + " = " + hv(h); }
  var PVLINE = "Place values: 128  64  32  16  8  4  2  1";
  var REAL11 = [] /*REAL11*/;
  var REAL12 = [] /*REAL12*/;
  var REALHEX = [] /*REALHEX*/;
  function otherN(not, lo, hi) { var e; do { e = rnd(lo, hi); } while (e === not || ones(bin8(e)) < 2); return e; }
  function wrongNum(a, list) { return drillWrongNumbers(a, list.filter(function (x) { return x >= 0 && x !== a && !isNaN(x); }), 3); }
  function wrongBins(n) {
    var b = bin8(n), out = [], c = [rev(b), bin8((n + 1) % 256), bin8(Math.max(n - 1, 0)), bin8(n ^ 128)];
    c.forEach(function (x) { if (x && x !== b && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }
  function otherHex(not, len) { var e; do { e = (len === 3 ? D[rnd(1, 3)] : "") + D[rnd(1, 15)] + D[rnd(0, 15)]; } while (e === not || hv(e) === hv(not) || !/[A-F]/.test(e)); return e; }
  function hexCard(r) {
    var h = r[0], a = hv(h), e = otherHex(h, h.length);
    return { prompt: "Convert the hexadecimal number " + h + " to denary.", answers: [String(a)], keywords: [num(a)],
      distractors: wrongNum(a, [h.split("").reduce(function (t, c) { return t + hv(c); }, 0), a + 16, a - 1, a + 1]),
      example: "Example: convert " + e + ".\nStep 1: place values " + (e.length === 3 ? "256, 16, 1" : "16, 1") + ". A = 10 ... F = 15.\nStep 2: " + work(e) + ".",
      working: ["Write each digit's value under its place value.", "Multiply each one, then add."], note: work(h) + ". " + r[1] };
  }
  var cards = [
    { id: "ex-01", category: "ex-bin", randomize: function () {
        var r = drillPick(REAL11), b = r[0], e = bin8(otherN(val(b), 20, 250));
        return { prompt: "Convert the 8-bit binary number " + b + " to denary.\n" + PVLINE, answers: [String(val(b))], keywords: [num(val(b))],
          distractors: wrongNum(val(b), [val(rev(b)), ones(b), val(b) + 1, val(b) - 1]),
          example: "Example: convert " + e + ".\nStep 1: find each 1 and the place value above it.\nStep 2: add them: " + plus(e) + " = " + val(e) + ".",
          working: ["Find each 1. Read the place value above it.", "Add those place values."], note: b + " = " + plus(b) + " = " + val(b) + ". " + r[1] };
      } },
    { id: "ex-02", category: "ex-bin", randomize: function () {
        var r = drillPick(REAL12.filter(function (x) { return x[0] < 128; })), n = r[0], b = bin8(n), e = otherN(n, 20, 120);
        return { prompt: "Convert the denary number " + n + " to 8-bit binary.\n" + PVLINE, answers: [b], keywords: [binRe(b)], distractors: wrongBins(n), format: "Type the 8 bits",
          example: "Example: convert " + e + ".\nStep 1: start at 128. Fits: write 1 and subtract. Too big: write 0.\nStep 2: " + e + " = " + plus(bin8(e)) + ", so it is " + bin8(e) + ".",
          working: ["Start at 128. Fits: write 1 and subtract. Too big: write 0.", "Write all 8 bits, then convert back to check."], note: n + " = " + plus(b) + " = " + b + ". " + r[1] };
      } },
    { id: "ex-03", category: "ex-bin", randomize: function () {
        var r = drillPick(REAL12.filter(function (x) { return x[0] >= 128; })), n = r[0], b = bin8(n), e = otherN(n, 130, 250);
        return { prompt: "Convert the denary number " + n + " to 8-bit binary.\n" + PVLINE, answers: [b], keywords: [binRe(b)], distractors: wrongBins(n), format: "Type the 8 bits",
          example: "Example: convert " + e + ".\nStep 1: 128 fits, so write 1 and " + (e - 128) + " is left.\nStep 2: keep going: " + e + " = " + plus(bin8(e)) + ", so it is " + bin8(e) + ".",
          working: ["128 fits. Write 1 and subtract.", "Carry on along the place values: fits, write 1; too big, write 0."], note: n + " = " + plus(b) + " = " + b + ". " + r[1] };
      } },
    { id: "ex-04", category: "ex-bin", randomize: function () {
        var r = drillPick(REAL12), n = r[0], b = bin8(n), i = b.lastIndexOf("1"), s = b.slice(0, i) + "0" + b.slice(i + 1);
        var e = otherN(n, 20, 250), eb = bin8(e), ei = eb.lastIndexOf("1"), es = eb.slice(0, ei) + "0" + eb.slice(ei + 1);
        return { prompt: "Sam converted " + n + " to 8-bit binary and wrote " + s + ". Convert Sam's answer back to denary.\n" + PVLINE, answers: [String(val(s))], keywords: [num(val(s))],
          distractors: wrongNum(val(s), [n, val(s) + 1, val(s) - 1]),
          example: "Example: Sam wrote " + es + " for " + e + ".\nStep 1: add the place values with a 1: " + (plus(es) || "0") + " = " + val(es) + ".\nStep 2: " + val(es) + " is not " + e + ", so he made a slip.",
          working: ["Find each 1 in Sam's answer.", "Add the place values above them."], note: s + " = " + (plus(s) || "0") + " = " + val(s) + ", not " + n + ". " + r[1] };
      } },
    { id: "ex-05", category: "ex-h16", randomize: function () {
        var v = rnd(10, 15), c = D[v], w; do { w = rnd(10, 15); } while (w === v);
        return { prompt: "Give the denary value of the hexadecimal digit " + c + ".", answers: [String(v)], keywords: [num(v)], distractors: wrongNum(v, [v + 1, v - 1, v + 2]),
          example: "Example: the digit " + D[w] + ".\nStep 1: A is 10. Count on one for each letter.\nStep 2: " + D[w] + " is " + w + ".",
          working: ["A is 10.", "Count on one for each letter after A."], note: "A = 10, B = 11, C = 12, D = 13, E = 14, F = 15." };
      } },
    { id: "ex-06", category: "ex-h16", randomize: function () {
        var x = rnd(2, 15), h = D[x] + D[rnd(0, 15)], a = x * 16, y; do { y = rnd(2, 15); } while (y === x);
        return { prompt: "In the hexadecimal number " + h + ", what is the left digit worth in denary?", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [x, x * 10, hv(h), a + 16]),
          example: "Example: the left digit of " + D[y] + "0.\nStep 1: the left digit is in the 16s column.\nStep 2: " + y + " x 16 = " + (y * 16) + ".",
          working: ["The left digit is in the 16s column.", "Its value times 16."], note: x + " x 16 = " + a + "." };
      } },
    { id: "ex-07", category: "ex-h16", randomize: function () { return hexCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2 && !/[A-F]/.test(r[0]); }))); } },
    { id: "ex-08", category: "ex-h16", randomize: function () { return hexCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2 && /[A-F]/.test(r[0]); }))); } },
    { id: "ex-09", category: "ex-h16", randomize: function () { return hexCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 3; }))); } },
    { id: "ex-10", category: "ex-h16", randomize: function () {
        var r = drillPick(REALHEX.filter(function (x) { return x[0].length === 2 && x[0][0] !== "0"; })), h = r[0], a = hv(h), s = hv(h[0]) + hv(h[1]), e = otherHex(h, 2);
        return { prompt: "Sam says the hexadecimal number " + h + " is " + s + " in denary. He added the two digit values. What is the right denary value?", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [s, a + 1, a - 16]),
          example: "Example: " + e + ".\nStep 1: the left digit is worth its value x 16.\nStep 2: " + work(e) + ".",
          working: ["Sam forgot the place values.", "Left digit x 16, then add the right digit."], note: work(h) + ", not " + s + ". " + r[1] };
      } }
  ];
  cards.forEach(function (c) {
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

// ---- Activity 1: denary to hexadecimal by dividing by 16. How many 16s, the remainder, the letter, convert, slips.
function divideCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var D = "0123456789ABCDEF";
  function hx(n) { return n.toString(16).toUpperCase(); }
  function hv(h) { return parseInt(h, 16); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?0*" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function hexRe(h) { return new RegExp("^\\s*(?:0\\s*)*" + h.replace(/^0+(?=.)/, "").split("").join("\\s*") + "(\\s*(in\\s+)?hexadecimal)?\\s*$", "i"); }
  function wrongNum(a, list) { return drillWrongNumbers(a, list.filter(function (x) { return x >= 0 && x !== a && !isNaN(x); }), 3); }
  function wrongHex(h, list) { var out = []; list.forEach(function (x) { if (x && !hexRe(h).test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var REALD2H = [] /*REALD2H*/;
  var TWO = REALD2H.filter(function (r) { return r[0] >= 16 && r[0] < 256; });
  // A number from 16 to 255: real (70%) or random, with a letter in its answer when letter is set.
  function pickN(letter) {
    var fit = TWO.filter(function (r) { return !letter || /[A-F]/.test(hx(r[0])); });
    if (fit.length && Math.random() < 0.7) { var r = drillPick(fit); return { n: r[0], src: " " + r[1] }; }
    var n; do { n = rnd(17, 255); } while ((letter && !/[A-F]/.test(hx(n))) || /^(10|15|16)$/.test(hx(n)));
    return { n: n, src: "" };
  }
  function work(n) { return n + " / 16 = " + Math.floor(n / 16) + " remainder " + (n % 16) + ", so " + hx(n) + ". Check: " + Math.floor(n / 16) + " x 16 + " + (n % 16) + " = " + n; }
  return [
    { id: "dv-01", category: "dv-steps", randomize: function () {
        var p = pickN(false), n = p.n, q = Math.floor(n / 16);
        return { prompt: "How many whole 16s are there in " + n + "?", answers: [String(q)], keywords: [num(q)], distractors: wrongNum(q, [q + 1, q - 1, n % 16, Math.floor(n / 10)]),
          working: ["Divide " + n + " by 16.", "Keep the whole number only. Ignore what is left over."], note: n + " / 16 = " + q + " remainder " + (n % 16) + "." + p.src };
      } },
    { id: "dv-02", category: "dv-steps", randomize: function () {
        var p = pickN(false), n = p.n, q = Math.floor(n / 16), r = n % 16;
        return { prompt: "What is the remainder when " + n + " is divided by 16?", answers: [String(r)], keywords: [num(r)], distractors: wrongNum(r, [q, r + 1, (r + 15) % 16, n % 10]),
          working: ["Find the biggest multiple of 16 that is not more than " + n + ".", "Subtract it from " + n + "."], note: n + " = " + q + " x 16 + " + r + "." + p.src };
      } },
    { id: "dv-03", category: "dv-steps", randomize: function () {
        var q = rnd(1, 9), r = rnd(10, 15), n = q * 16 + r;
        return { prompt: n + " / 16 = " + q + " remainder " + r + ". Which hexadecimal digit do you write for the remainder " + r + "?", answers: [D[r]], keywords: [new RegExp("^\\s*" + D[r] + "\\s*$", "i")],
          distractors: [String(r), D[r === 15 ? 14 : r + 1], D[r - 1]].filter(function (x, i, a) { return a.indexOf(x) === i && x !== D[r]; }), format: "Type one digit",
          working: ["One column holds one digit.", "The letters start straight after 9. Count on from 9 to " + r + "."], note: r + " is " + D[r] + ". So " + n + " is " + hx(n) + "." };
      } },
    { id: "dv-04", category: "dv-convert", randomize: function () {
        var p = pickN(false), n = p.n, h = hx(n), q = Math.floor(n / 16), r = n % 16;
        return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [hexRe(h)], format: "Type the hexadecimal number",
          distractors: wrongHex(h, [h.split("").reverse().join(""), String(q) + String(r), hx(n + 16), hx(n + 1)]),
          working: ["Divide " + n + " by 16. The whole number is the left digit.", "The remainder is the right digit. Values above nine become letters."], note: work(n) + "." + p.src };
      } },
    { id: "dv-05", category: "dv-convert", randomize: function () {
        var p = pickN(true), n = p.n, h = hx(n), q = Math.floor(n / 16), r = n % 16;
        return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [hexRe(h)], format: "Type the hexadecimal number",
          distractors: wrongHex(h, [h.split("").reverse().join(""), String(q) + String(r), hx(n - 16), hx(n + 1)]),
          working: ["Divide by 16: whole number, then remainder.", "Change any value above nine into a letter."], note: work(n) + "." + p.src };
      } },
    { id: "dv-06", category: "dv-check", randomize: function () {
        var p, n, h; do { p = pickN(false); n = p.n; h = hx(n); } while (h[0] === h[1]);
        var s = h[1] + h[0];
        return { prompt: "Sam converts " + n + " to hexadecimal and writes " + s + ". He put the digits the wrong way round. What is the right hexadecimal?", answers: [h], keywords: [hexRe(h)], format: "Type the hexadecimal number",
          distractors: wrongHex(h, [s, hx(n + 1), hx(n - 1)]),
          working: ["The number of 16s goes on the left.", "Divide " + n + " by 16 again and place each part."], note: work(n) + ", not " + s + "." + p.src };
      } },
    { id: "dv-07", category: "dv-check", randomize: function () {
        var p = pickN(true), n = p.n, h = hx(n), q = Math.floor(n / 16), r = n % 16, s = String(q) + String(r);
        if (r < 10) s = String(q) + " " + r;
        return { prompt: "Ana converts " + n + ". She gets " + q + " remainder " + r + " and writes " + s + ". What should she write in hexadecimal?", answers: [h], keywords: [hexRe(h)], format: "Type the hexadecimal number",
          distractors: wrongHex(h, [String(q) + String(r), h.split("").reverse().join(""), hx(n + 1)]),
          working: ["Each value above nine needs one single digit.", "Write the whole number, then the remainder, as digits."], note: work(n) + "." + p.src };
      } },
    { id: "dv-08", category: "dv-check", randomize: function () {
        var p, n, h; do { p = pickN(false); n = p.n; h = hx(n); } while (h[0] === h[1] || h[1] === "0");
        var s = h[1] + h[0], a = hv(s);
        return { prompt: "Sam says " + n + " is " + s + " in hexadecimal. Convert " + s + " back to denary to check him. What do you get?", answers: [String(a)], keywords: [num(a)],
          distractors: wrongNum(a, [n, a + 1, hv(s[0]) + hv(s[1])]),
          working: ["Left digit x 16, then add the right digit.", "Compare your answer with " + n + "."], note: hv(s[0]) + " x 16 + " + hv(s[1]) + " = " + a + ", not " + n + ", so Sam is wrong." + p.src };
      } },
    { id: "dv-09", category: "dv-convert", randomize: function () {
        var big = REALD2H.filter(function (r) { return r[0] > 255; }), n, src = "";
        if (Math.random() < 0.6) { var r = drillPick(big); n = r[0]; src = " " + r[1]; } else n = rnd(260, 990);
        var h = hx(n), q = Math.floor(n / 16);
        return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [hexRe(h)], format: "Type the hexadecimal number",
          distractors: wrongHex(h, [String(q) + D[n % 16], h.split("").reverse().join(""), hx(n + 16)]),
          working: ["Divide by 16. The remainder is the right digit.", "The whole number is more than 15, so divide it by 16 again."],
          note: n + " / 16 = " + q + " remainder " + (n % 16) + ". " + q + " / 16 = " + Math.floor(q / 16) + " remainder " + (q % 16) + ". So " + h + "." + src };
      } }
  ];
}

// ---- Activity 2: nibbles. Nibble to digit and back, binary to hexadecimal, hexadecimal to binary, Sam's slips.
function nibbleCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var D = "0123456789ABCDEF";
  function hv(h) { return parseInt(h, 16); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function nib(d) { return pad(hv(d).toString(2), 4); }
  function h2b(h) { return h.split("").map(nib).join(""); }
  function b2h(b) { var o = ""; for (var i = 0; i < b.length; i += 4) o += parseInt(b.slice(i, i + 4), 2).toString(16).toUpperCase(); return o; }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function hexRe(h) { return new RegExp("^\\s*" + h.split("").join("\\s*") + "(\\s*(in\\s+)?hexadecimal)?\\s*$", "i"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*bits)?\\s*$", "i"); }
  function uniq(ans, re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  function nibSum(g) { var p = [8, 4, 2, 1], o = []; for (var i = 0; i < 4; i++) if (g[i] === "1") o.push(p[i]); return (o.join(" + ") || "0") + " = " + parseInt(g, 2); }
  var REALB2H = [] /*REALB2H*/;
  var REALH2B = [] /*REALH2B*/;
  function b2hCard(b, src) {
    var h = b2h(b), re = hexRe(h), groups = sp(b).split(" ");
    return { prompt: "Convert the binary number " + b + " to hexadecimal.", answers: [h], keywords: [re], format: "Type the hexadecimal number",
      distractors: uniq(h, re, [h.split("").reverse().join(""), h.replace(/^0+/, ""), String(parseInt(b, 2)), groups.map(function (g) { return parseInt(g, 2); }).join("")]),
      working: ["Split the bits into nibbles from the right.", "Each nibble (8, 4, 2, 1) gives one digit, even 0000."],
      note: groups.map(function (g) { return g + ": " + nibSum(g) + " = " + b2h(g); }).join(". ") + ". So " + h + "." + (src ? " " + src : "") };
  }
  function h2bCard(h, src) {
    var b = h2b(h), re = binRe(b), bits = b.length;
    return { prompt: "Convert the hexadecimal number " + h + " to " + bits + "-bit binary.", answers: [sp(b)], keywords: [re], format: "Type the " + bits + " bits",
      distractors: uniq(b, re, [sp(h2b(h.split("").reverse().join(""))), b.replace(/^0+/, ""), h.split("").map(function (c) { return hv(c).toString(2); }).join(" "), sp(b.slice(1) + "1")]),
      working: ["Change each digit to 4 bits: 8, 4, 2, 1.", "Every digit gives exactly 4 bits, even 0 and 1."],
      note: h.split("").map(function (c) { return c + " = " + nib(c); }).join(", ") + ". So " + sp(b) + "." + (src ? " " + src : "") };
  }
  return [
    { id: "nb-01", category: "nb-nibble", randomize: function () {
        var v = drillPick([3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]), g = pad(v.toString(2), 4), c = D[v];
        return { prompt: "Which hexadecimal digit is the nibble " + g + "?", answers: [c], keywords: [new RegExp("^\\s*" + c + "\\s*$", "i")], format: "Type one digit",
          distractors: [String(v), D[(v + 1) % 16], D[parseInt(g.split("").reverse().join(""), 2)]].filter(function (x, i, a) { return x !== c && a.indexOf(x) === i; }),
          working: ["The nibble's place values are 8, 4, 2, 1.", "Add them. Values above nine become letters."], note: g + ": " + nibSum(g) + " = " + c + "." };
      } },
    { id: "nb-02", category: "nb-nibble", randomize: function () {
        var v = rnd(1, 15), c = D[v], g = nib(c);
        return { prompt: "Write the hexadecimal digit " + c + " as a nibble.", answers: [g], keywords: [binRe(g)], format: "Type the 4 bits",
          distractors: uniq(g, binRe(g), [g.split("").reverse().join(""), pad(((v + 1) % 16).toString(2), 4), g.replace(/^0+/, "")]),
          working: ["Change " + c + " to its value first.", "Make that value from 8, 4, 2 and 1."], note: c + " = " + v + " = " + nibSum(g).split(" =")[0] + ", so " + g + "." };
      } },
    { id: "nb-03", category: "nb-b2h", randomize: function () { var r = drillPick(REALB2H.filter(function (x) { return x[0].length === 8; })); return b2hCard(r[0], r[1]); } },
    { id: "nb-04", category: "nb-b2h", randomize: function () { var b; do { b = pad(rnd(17, 255).toString(2), 8); } while (!/[A-F]/.test(b2h(b))); return b2hCard(b, ""); } },
    { id: "nb-05", category: "nb-b2h", randomize: function () { var r = drillPick(REALB2H.filter(function (x) { return x[0].length === 12; })); return b2hCard(r[0], r[1]); } },
    { id: "nb-06", category: "nb-h2b", randomize: function () { var r = drillPick(REALH2B.filter(function (x) { return x[0].length === 2; })); return h2bCard(r[0], r[1]); } },
    { id: "nb-07", category: "nb-h2b", randomize: function () { var r = drillPick(REALH2B.filter(function (x) { return x[0].length === 3; })); return h2bCard(r[0], r[1]); } },
    { id: "nb-08", category: "nb-b2h", randomize: function () {
        var n, b; do { n = rnd(33, 127); b = n.toString(2); } while (b.length % 4 === 0);
        var left = b.slice(0, 4), rest = b.slice(4), s = b2h(left) + parseInt(rest, 2).toString(16).toUpperCase();
        var full = pad(b, Math.ceil(b.length / 4) * 4), h = b2h(full), re = hexRe(h);
        if (re.test(s)) s = b2h(left) + "0";
        return { prompt: "Sam splits the binary number " + b + " into nibbles from the left: " + left + " " + rest + ". He writes " + s + ". What is the right hexadecimal?", answers: [h], keywords: [re], format: "Type the hexadecimal number",
          distractors: uniq(h, re, [s, h.split("").reverse().join(""), String(n)]),
          working: ["Split from the right: the right bit is worth 1.", "Fill the last nibble with 0s on the left."], note: sp(full) + " = " + h + "." };
      } },
    { id: "nb-09", category: "nb-h2b", randomize: function () {
        var h; do { h = D[rnd(8, 15)] + D[rnd(1, 7)]; } while (false);
        var b = h2b(h), short = nib(h[0]) + hv(h[1]).toString(2), re = binRe(b);
        return { prompt: "Sam converts the hexadecimal number " + h + " and writes " + short + ". That is not 8 bits. What is the right 8-bit binary?", answers: [sp(b)], keywords: [re], format: "Type the 8 bits",
          distractors: uniq(b, re, [short, sp(h2b(h[1] + h[0])), sp(short + "0")]),
          working: ["Every digit must be exactly 4 bits.", "Put 0s on the left of the short nibble."], note: h[0] + " = " + nib(h[0]) + ", " + h[1] + " = " + nib(h[1]) + ". So " + sp(b) + "." };
      } },
    { id: "nb-10", category: "nb-nibble", randomize: function () {
        var k = rnd(2, 4), a = 4 * k, h = k === 3 ? "A4D" : (k === 2 ? D[rnd(1, 15)] + D[rnd(0, 15)] : D[rnd(1, 15)] + D[rnd(0, 15)] + D[rnd(0, 15)] + D[rnd(0, 15)]);
        return { prompt: "What is the least number of bits needed to store the hexadecimal number " + h + "?", answers: [String(a)], keywords: [num(a)],
          distractors: drillWrongNumbers(a, [k, a + 4, a - 4, 8 * k].filter(function (x) { return x > 0 && x !== a; }), 3),
          working: ["Each hexadecimal digit needs one nibble.", "Count the digits, then multiply by 4."], note: k + " digits x 4 bits = " + a + " bits." + (k === 3 ? " From Cambridge IGCSE 0478/13, June 2023, Question 1(f)." : "") };
      } }
  ];
}

// ---- Plenary: this lesson only. Denary to hexadecimal, nibbles, binary to hexadecimal, hexadecimal to binary, real numbers.
function plenaryCards() {
  var D = "0123456789ABCDEF";
  function hx(n) { return n.toString(16).toUpperCase(); }
  function hv(h) { return parseInt(h, 16); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function nib(d) { return pad(hv(d).toString(2), 4); }
  function h2b(h) { return h.split("").map(nib).join(""); }
  function b2h(b) { var o = ""; for (var i = 0; i < b.length; i += 4) o += parseInt(b.slice(i, i + 4), 2).toString(16).toUpperCase(); return o; }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?0*" + n + "(\\s*(in\\s+)?(denary|bits))?\\s*$", "i"); }
  function hexRe(h, strict) { var core = strict ? h : h.replace(/^0+(?=.)/, ""); return new RegExp("^\\s*" + (strict ? "" : "(?:0\\s*)*") + core.split("").join("\\s*") + "(\\s*(in\\s+)?hexadecimal)?\\s*$", "i"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var REALD2H = [] /*REALD2H*/;
  var REALB2H = [] /*REALB2H*/;
  var REALH2B = [] /*REALH2B*/;
  function d2hCard(r) {
    var n = r[0], h = hx(n), re = hexRe(h), q = Math.floor(n / 16);
    return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [re], format: "Type the hexadecimal number",
      distractors: uniq(re, [h.split("").reverse().join(""), String(q) + String(n % 16), hx(n + 16), hx(n + 1)]),
      working: [n > 255 ? "Divide by 16. The whole number is more than 15, so divide again." : "Divide by 16: the whole number is the left digit.", "The remainder is the right digit. Values above nine become letters."],
      note: n + " / 16 = " + q + " remainder " + (n % 16) + (n > 255 ? ". " + q + " / 16 = " + Math.floor(q / 16) + " remainder " + (q % 16) : "") + ". So " + h + ". " + r[1] };
  }
  function b2hCard(r) {
    var b = r[0], h = b2h(b), re = hexRe(h, true), g = sp(b).split(" ");
    return { prompt: "Convert the binary number " + b + " to hexadecimal.", answers: [h], keywords: [re], format: "Type the hexadecimal number",
      distractors: uniq(re, [h.split("").reverse().join(""), h.replace(/^0+/, ""), String(parseInt(b, 2)), g.map(function (x) { return parseInt(x, 2); }).join("")]),
      working: ["Split into nibbles from the right.", "Each nibble gives one digit, even 0000."], note: sp(b) + " = " + h.split("").join(" ") + ". " + r[1] };
  }
  function h2bCard(r) {
    var h = r[0], b = h2b(h), re = binRe(b);
    return { prompt: "Convert the hexadecimal number " + h + " to " + b.length + "-bit binary.", answers: [sp(b)], keywords: [re], format: "Type the " + b.length + " bits",
      distractors: uniq(re, [sp(h2b(h.split("").reverse().join(""))), b.replace(/^0+/, ""), h.split("").map(function (c) { return hv(c).toString(2); }).join(" ")]),
      working: ["Each digit becomes 4 bits: 8, 4, 2, 1.", "Keep the 0s: every digit gives exactly 4 bits."], note: h.split("").map(function (c) { return c + " = " + nib(c); }).join(", ") + ". " + r[1] };
  }
  var D2 = REALD2H.filter(function (r) { return r[0] < 256; });
  return [
    // ================================================= Denary to hexadecimal
    { id: "pl-01", category: "pl-d2h", randomize: function () { return d2hCard(drillPick(D2.filter(function (r) { return !/[A-F]/.test(hx(r[0])); }))); } },
    { id: "pl-02", category: "pl-d2h", randomize: function () { return d2hCard(drillPick(D2.filter(function (r) { return /[A-F]/.test(hx(r[0])); }))); } },
    { id: "pl-03", category: "pl-d2h", randomize: function () { return d2hCard(drillPick(D2)); } },
    { id: "pl-04", category: "pl-d2h", randomize: function () { return d2hCard(drillPick(REALD2H.filter(function (r) { return r[0] > 255; }))); } },
    { id: "pl-05", category: "pl-d2h", prompt: "Explain why we divide by 16 to convert denary to hexadecimal.", answers: ["The left column counts 16s, so dividing by 16 finds how many 16s there are"],
      keywords: [/^(?=.*(16|sixteen))(?=.*\b(base|columns?|place|how\s+many|16s|sixteens|groups?|lots|fits?|goes)\b).*$/i],
      distractors: ["Because hexadecimal uses letters", "Because 16 is bigger than 10", "To make the number shorter"],
      working: ["What does the left hexadecimal column count?", "What does dividing tell you about that column?"], note: "Hexadecimal is base 16. The left column counts 16s; dividing by 16 says how many, and the remainder is the 1s." },
    // ================================================= Nibbles
    { id: "pl-06", category: "pl-nib", prompt: "What is a group of 4 bits called?", answers: ["nibble"], keywords: [/^\s*(a\s+)?nibbles?\s*$/i], distractors: ["digit", "place value", "register"],
      working: ["It is half of 8 bits.", "It is the group you split binary into for hexadecimal."], note: "4 bits make a nibble." },
    { id: "pl-07", category: "pl-nib", prompt: "Explain why one hexadecimal digit is exactly 4 bits.", answers: ["4 bits make 16 patterns, the same as the 16 values of one hexadecimal digit"],
      keywords: [/^(?=.*\b(16|sixteen)\b|.*2\s*(\^|to\s+the\s+power(\s+of)?)\s*4)(?=.*\b(4|four|bits?|patterns?|0\s*to\s*15|values?|combinations?)\b).*$/i],
      distractors: ["Because 4 is half of 8", "Because hexadecimal uses letters", "Because binary is base 2"],
      working: ["How many patterns can 4 bits make?", "How many values can one hexadecimal digit hold?"], note: "4 bits: 2 x 2 x 2 x 2 = 16 patterns, 0 to 15. One digit also has 16 values." },
    { id: "pl-08", category: "pl-nib", prompt: "How many different values can a nibble hold?", answers: ["16"], keywords: [num(16)], distractors: ["15", "4", "8"],
      working: ["Count from 0000 up to 1111.", "Do not forget 0000."], note: "0000 to 1111 is 0 to 15: 16 values." },
    { id: "pl-09", category: "pl-nib", prompt: "The hexadecimal number A4D needs to be stored. Calculate the least number of bits that can be used to store it.", answers: ["12"], keywords: [num(12)], distractors: ["3", "8", "16"],
      working: ["Each hexadecimal digit needs one nibble.", "Count the digits, then multiply by 4."], note: "3 digits x 4 bits = 12 bits. From Cambridge IGCSE 0478/13, June 2023, Question 1(f)." },
    { id: "pl-10", category: "pl-nib", prompt: "Give the largest hexadecimal number that can be stored in a 12-bit register.", answers: ["FFF"], keywords: [/^\s*F\s*F\s*F\s*$/i], distractors: ["FF", "999", "4095"], format: "Type the hexadecimal number",
      working: ["12 bits is 3 nibbles.", "What is the largest digit one nibble can make?"], note: "1111 1111 1111 = FFF. From Cambridge IGCSE 0478/12, November 2025, Question 1(a)." },
    // ================================================= Binary to hexadecimal
    { id: "pl-11", category: "pl-b2h", randomize: function () { return b2hCard(drillPick(REALB2H.filter(function (r) { return r[0].length === 8; }))); } },
    { id: "pl-12", category: "pl-b2h", randomize: function () { return b2hCard(drillPick(REALB2H.filter(function (r) { return r[0].length === 8; }))); } },
    { id: "pl-13", category: "pl-b2h", randomize: function () { return b2hCard(drillPick(REALB2H.filter(function (r) { return r[0].length === 12; }))); } },
    { id: "pl-14", category: "pl-b2h", randomize: function () { return b2hCard(drillPick(REALB2H.filter(function (r) { return r[0].length === 12; }))); } },
    { id: "pl-15", category: "pl-b2h", prompt: "Give the hexadecimal value for the 16-bit binary value 0000100110101110", answers: ["09AE"], keywords: [/^\s*0\s*9\s*A\s*E\s*$/i], distractors: ["9AE", "EA90", "0910"], format: "Type the hexadecimal number",
      working: ["Split into 4 nibbles from the right.", "Every nibble gives one digit, even 0000."], note: "0000 1001 1010 1110 = 0 9 A E. From Cambridge IGCSE 0478/13, November 2022, Question 2(b)." },
    { id: "pl-16", category: "pl-b2h", prompt: "Explain why binary is split into nibbles starting from the right.", answers: ["The right bit is always worth 1, so each nibble keeps its place values 8, 4, 2, 1"],
      keywords: [/^(?=.*\b(right|end|last|least|1s?|one)\b)(?=.*\b(place\s+values?|worth|values?|columns?|8\s*,?\s*4\s*,?\s*2\s*,?\s*1)\b).*$/i],
      distractors: ["Because the left bits are bigger", "To make the number shorter", "Because we read from the right"],
      working: ["Which bit is always worth 1?", "What goes wrong with the place values if you start from the left?"], note: "The right bit is worth 1. Starting there keeps every bit under its place value; 0s fill the last nibble on the left." },
    // ================================================= Hexadecimal to binary
    { id: "pl-17", category: "pl-h2b", randomize: function () { return h2bCard(drillPick(REALH2B.filter(function (r) { return r[0].length === 2; }))); } },
    { id: "pl-18", category: "pl-h2b", randomize: function () { return h2bCard(drillPick(REALH2B.filter(function (r) { return r[0].length === 2 && /[A-F]/.test(r[0]); }))); } },
    { id: "pl-19", category: "pl-h2b", randomize: function () { return h2bCard(drillPick(REALH2B.filter(function (r) { return r[0].length === 3; }))); } },
    { id: "pl-20", category: "pl-h2b", randomize: function () { return h2bCard(drillPick(REALH2B.filter(function (r) { return r[0].length === 3; }))); } }
  ];
}

const DRILLS = [
  ['y11-1-4-ext', 'Do Now Extension: 1.1 to 1.3. Every card has an example on different numbers and two nudges.',
    'Year 11 Extension: Binary and Hexadecimal Recap', '1.4 Do Now Extension',
    [['ex-bin', 'Binary and Denary'], ['ex-h16', 'Hexadecimal to Denary']], extCards],
  ['y11-1-4-divide', 'Activity 1: denary to hexadecimal by dividing by 16.',
    'Year 11, 1.4: Divide by 16', 'Cambridge IGCSE Computer Science 0478',
    [['dv-steps', 'Divide by 16'], ['dv-convert', 'Convert'], ['dv-check', 'Find the Slip']], divideCards],
  ['y11-1-4-nibbles', 'Activity 2: nibbles, binary to hexadecimal and hexadecimal to binary.',
    'Year 11, 1.4: Nibbles', 'Cambridge IGCSE Computer Science 0478',
    [['nb-nibble', 'Nibbles'], ['nb-b2h', 'Binary to Hexadecimal'], ['nb-h2b', 'Hexadecimal to Binary']], nibbleCards],
  ['y11-1-4-hexconv', 'Plenary: denary to hexadecimal, nibbles, binary to and from hexadecimal, real exam numbers.',
    'Year 11, 1.4: Hexadecimal Conversions', 'Cambridge IGCSE Computer Science 0478',
    [['pl-d2h', 'Denary to Hexadecimal'], ['pl-nib', 'Nibbles'], ['pl-b2h', 'Binary to Hexadecimal'], ['pl-h2b', 'Hexadecimal to Binary']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  { const bad = /two.s complement|overflow|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b/i.exec(src.split(id).join('')); assert(!bad, `drill ${id} names a later term: ${bad}`); }
  if (id === 'y11-1-4-ext') assert(!/nibble/i.test(src.split('DrillData.register')[1]), 'extension drill names nibble');
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
        const bare = ans.replace(/\s+/g, '');
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  '].concat(/^[0-9A-F ]+$/i.test(ans) ? [bare] : []).forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        let m;
        if ((m = /Convert the denary number (\d+) to hexadecimal/.exec(r.prompt))) assert(parseInt(bare, 16) === Number(m[1]), `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the binary number ([01]+) to hexadecimal/.exec(r.prompt))) assert(parseInt(bare, 16) === parseInt(m[1], 2) && bare.length === m[1].length / 4, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the hexadecimal number ([0-9A-F]+) to (\d+)-bit binary/.exec(r.prompt))) assert(parseInt(bare, 2) === parseInt(m[1], 16) && bare.length === Number(m[2]) && Number(m[2]) === m[1].length * 4, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the hexadecimal number ([0-9A-F]+) to denary/.exec(r.prompt))) assert(Number(ans) === parseInt(m[1], 16), `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the denary number (\d+) to 8-bit binary/.exec(r.prompt))) assert(parseInt(bare, 2) === Number(m[1]) && bare.length === 8, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the 8-bit binary number ([01]+) to denary/.exec(r.prompt))) assert(Number(ans) === parseInt(m[1], 2), `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /What is the right hexadecimal\?/.exec(r.prompt)) && (m = /(?:converts|binary number) (\d+|[01]+)\b/.exec(r.prompt))) {
          const v = /Sam splits/.test(r.prompt) ? parseInt(m[1], 2) : Number(m[1]);
          assert(parseInt(bare, 16) === v, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        }
        if (r.example && bare.length >= 2) {
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

const lesson = { id: ID, label: '1.4: Hexadecimal Conversions', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-3-hex in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-3-hex"/.exec(raw);
    assert(m && raw.split('"y11-1-3-hex"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-3-hex"').join(`"y11-1-3-hex",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
