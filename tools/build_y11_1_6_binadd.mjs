// Builds LessonData/y11-1-6-binadd.json: Year 11, 1.6: Binary Addition (syllabus 0478 1.1: add two positive 8-bit
// binary integers, showing the carries). The sixth lesson of the 2026-27 Year 11 plan, after y11-1-5-hexuse. What
// happens when the answer is too big for 8 bits is the next lesson (1.7), so no question here goes past 255.
//   node tools/build_y11_1_6_binadd.mjs
// It also writes the lesson's four drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-5-hexuse (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: EAL-light, one idea per slide, every slide's core question a WHY (Term 1b), a teacher-only Think, Pair, Share
// under every heading, predict-then-check, compare slides.
// Real questions, each value checked below against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:   0478/12 March 2026 Q6(a) (150) and Q6(b) (F08) (no mark scheme in the folder: worked in code);
//             0478/11 November 2023 Q2(c) (A03D) and 0478/13 June 2024 Q3(b)(ii) (411)
//   Exam:     0478/11 June 2023 Q1(d); 0478/12 June 2024 Q3(c); 0478/13 November 2023 Q2(e);
//             0478/11 November 2024 Q3(d) (adapted: ASCII left out); 0478/12 March 2025 Q1(b);
//             0478/12 June 2025 Q1(e) (adapted: RAM left out); 0478/11 November 2025 Q1(e);
//             0478/12 March 2026 Q6(e) (no mark scheme in the folder: worked in code)
//   Not used: the additions whose answer needs more than 8 bits (0478/13 June 2023 Q1(d), 0478/12 November 2023 Q2(e),
//             0478/13 November 2024 Q1(d), 0478/12 November 2025 Q2(a), 0478/11 June 2026 Q3(f)): they are for 1.7.
// Marking: each addition is the paper's marks split as the mark schemes give them: 1 for the carries (typed as the
// carry row, 8 digits, or 7 without the right-hand 0) and 2 for the answer (8 bits, spaces allowed).
// Drills: y11-1-6-ext (Do Now Extension), y11-1-6-columns (Activity 1), y11-1-6-add (Activity 2),
// y11-1-6-binadd (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-6-binadd';
const P = 'y11-16a';
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
const sumText = (b) => pvs(b.length).filter((_, i) => b[i] === '1').join(' + ');
const hv = (h) => parseInt(h, 16);
const hpv = (n) => Array.from({ length: n }, (_, i) => 16 ** (n - 1 - i));
const toHex = (n) => n.toString(16).toUpperCase();
const nib = (d) => hv(d).toString(2).padStart(4, '0');
const h2b = (h) => [...h].map(nib).join('');
const b2h = (b) => { let o = ''; for (let i = 0; i < b.length; i += 4) o += toHex(val(b.slice(i, i + 4))); return o; };
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
// Binary addition, column by column from the right. carry[i] is the carry INTO column i (the right column's is 0).
function add(a, b) {
  const n = a.length, s = Array(n), c = Array(n);
  let k = 0;
  for (let i = n - 1; i >= 0; i--) { c[i] = k; const t = +a[i] + +b[i] + k; s[i] = t % 2; k = t > 1 ? 1 : 0; }
  return { sum: s.join(''), carry: c.join(''), out: k, count: c.filter((x) => x === 1).length };
}
const xor = (a, b) => [...a].map((c, i) => (c === b[i] ? '0' : '1')).join('');
// Answers.
const num = (n) => `^\\s*(=\\s*)?0*${n}(\\s*(in\\s+)?(denary|base\\s*10))?\\s*\\.?\\s*$`;
const HEX_TAIL = '(\\s*(in\\s+)?(hexadecimal|base\\s*16))?\\s*\\.?\\s*$';
const hexStrict = (h) => '^\\s*(=\\s*)?' + [...h].join('\\s*') + HEX_TAIL;
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*(=\\s*)?${[...b].join('\\s*')}${BIN_TAIL}`;
// The carry row: 8 digits, or 7 without the right-hand column's 0 (nothing ever carries into it).
const carryAns = (c) => `^\\s*${[...c.slice(0, 7)].join('\\s*')}(\\s*0)?\\s*\\.?\\s*$`;
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
function hexTable(h, { value = false, worth = false, label = true } = {}) {
  const n = h.length, th = TH(70, 16);
  const tdS = (big) => `padding:6px 8px;min-width:70px;text-align:center;border:1px solid var(--line-strong);${big ? 'font:700 26px var(--font-mono, monospace)' : 'font-size:18px'}`;
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const p = hpv(n);
  let out = `<tr>${lab('Place value')}${p.map((x) => `<th style="${th}">${x}</th>`).join('')}</tr>`;
  out += `<tr>${lab('Digit')}${[...h].map((c) => `<td style="${tdS(true)}">${c}</td>`).join('')}</tr>`;
  if (value) out += `<tr>${lab('Value')}${[...h].map((c) => `<td style="${tdS(false)}">${hv(c)}</td>`).join('')}</tr>`;
  if (worth) out += `<tr>${lab('Worth')}${[...h].map((c, i) => `<td style="${tdS(false)}">${hv(c)} &times; ${p[i]} = ${hv(c) * p[i]}</td>`).join('')}</tr>`;
  return `<table style="border-collapse:collapse;margin:0 auto">${out}</table>`;
}
function nibTable(bits, { digits = true } = {}) {
  const groups = []; for (let i = 0; i < bits.length; i += 4) groups.push(bits.slice(i, i + 4));
  const th = TH(30, 13);
  const cell = (t, extra = '') => `<td style="padding:5px 2px;min-width:30px;text-align:center;font:700 19px var(--font-mono, monospace);border:1px solid var(--line-strong)${extra}">${t}</td>`;
  const gap = '<td style="width:12px;border:0"></td>';
  const head = groups.map(() => [8, 4, 2, 1].map((p) => `<th style="${th}">${p}</th>`).join('')).join(gap);
  const body = groups.map((g) => [...g].map((c) => cell(c, c === '0' ? ';color:var(--muted-2)' : '')).join('')).join(gap);
  const dig = groups.map((g) => `<td colspan="4" style="padding:5px;text-align:center;font:700 22px var(--font-mono, monospace);border:1px solid var(--line-strong)${HL}">${b2h(g)}</td>`).join(gap);
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${head}</tr><tr>${body}</tr>${digits ? `<tr>${dig}</tr>` : ''}</table>`;
}
// Column addition: place values, the carry row, the two numbers, the answer. done = how many columns from the right
// are finished (their answer bit and the carry they send left are shown); hl = columns to mark.
function addTable(a, b, { done = a.length, hl = [], label = true } = {}) {
  const n = a.length, r = add(a, b), w = 44, th = TH(w, 14);
  const base = `padding:4px 3px;min-width:${w}px;text-align:center;border:1px solid var(--line-strong)`;
  const mark = (i) => (hl.includes(i) ? HL : '');
  const lab = (t, extra = '') => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0${extra}">${t}</th>` : '';
  const carryShown = (i) => i >= n - done - 1 && r.carry[i] === '1';
  const ansShown = (i) => i >= n - done;
  const head = `<tr>${lab('Place value')}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>`;
  const carry = `<tr>${lab('Carry')}${[...a].map((_, i) => `<td style="${base};height:24px;font:700 15px var(--font-mono, monospace);color:var(--brand-dark)${mark(i)}">${carryShown(i) ? '1' : ''}</td>`).join('')}</tr>`;
  const row = (bits, t) => `<tr>${lab(t)}${[...bits].map((c, i) => `<td style="${base};height:30px;font:700 20px var(--font-mono, monospace)${mark(i)}">${c}</td>`).join('')}</tr>`;
  const ans = `<tr>${lab('Answer', ';border-top:3px solid var(--ink, currentColor)')}${[...r.sum].map((c, i) => `<td style="${base};height:30px;border-top:3px solid var(--ink, currentColor);font:700 20px var(--font-mono, monospace)${mark(i)}">${ansShown(i) ? c : ''}</td>`).join('')}</tr>`;
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
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
const steps = [];

// ---------------------------------------------------------------- Do Now 1 (1.2 and 1.4): 0478/12 March 2026 Q6(a), (b)
// No mark scheme in the folder for March 2026: 150 = 10010110 and F08 = 1111 0000 1000, worked out in code below.
const WT_N = 202, WT_H = 'B3E';
const WT_DN1 = { title: 'Walk me through it: denary and hexadecimal to binary', steps: [
  { text: `<strong>A similar question.</strong> Convert the denary number ${WT_N} into an 8-bit binary number.`, visual: big(String(WT_N)) },
  { text: 'Write the 8 place values. Start at 128 on the left.', visual: bitTable(null) },
  { text: `128 fits in ${WT_N}: write 1. ${WT_N} - 128 = ${WT_N - 128} left. 64 fits in ${WT_N - 128}: write 1. ${WT_N - 128} - 64 = ${WT_N - 192} left.`, visual: line(kw(`${WT_N} - 128 - 64 = ${WT_N - 192}`)) },
  { text: `32 and 16 are too big for ${WT_N - 192}: write 0 and 0. 8 fits: write 1, 2 left. 4 is too big: write 0. 2 fits: write 1. 1 is too big: write 0.`, visual: fitTable(WT_N) },
  { text: `So ${WT_N} is <strong>${bin8(WT_N)}</strong>. Check: ${sumText(bin8(WT_N))} = ${WT_N}.`, visual: line(kw(`${sumText(bin8(WT_N))} = ${WT_N}`)) },
  { text: `<strong>Now hexadecimal to 12-bit binary.</strong> Convert ${WT_H}. Each digit becomes 4 bits.`, visual: big(WT_H) },
  { text: `B = 11 = 8 + 2 + 1 = ${nib('B')}. 3 = 2 + 1 = ${nib('3')}. E = 14 = 8 + 4 + 2 = ${nib('E')}.`, visual: nibTable(h2b(WT_H)) },
  { text: `Put the nibbles side by side, in order: <strong>${spaced(h2b(WT_H))}</strong>. 3 digits give 12 bits.`, visual: line(kw(spaced(h2b(WT_H)))) },
  { text: 'Now do the same for the question: place values from 128 for the denary number, 4 bits for every hexadecimal digit.', visual: note('fits &rarr; 1 and subtract &nbsp; one digit &rarr; 4 bits') },
] };
steps.push(checkStep('do-now', 'Do Now: To Binary (1 of 2)', 'Do Now: To Binary (1 of 2)',
  'Recap of 1.2 Denary to Binary and 1.4 Hexadecimal Conversions. (a) ' + cite('0478/12, March 2026, Question 6(a)') + ' (b) ' + cite('0478/12, March 2026, Question 6(b)'), [
    { label: 'Convert the denary number 150 into an 8-bit binary number.', answer: binFull(bin8(150)), feedback: 'Start at 128. Fits: write 1 and subtract. Too big: write 0.' },
    { label: 'Convert the hexadecimal number F08 into a 12-bit binary number.', answer: binFull(h2b('F08')), feedback: 'Write every digit as 4 bits (8, 4, 2, 1), even 0.', marks: 2 },
  ], ['Why does each hexadecimal digit become exactly 4 bits?', 'One digit has 16 values, and 4 bits make exactly 16 patterns.']));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2 (1.4): 0478/11 November 2023 Q2(c), 0478/13 June 2024 Q3(b)(ii)
// Mark schemes: A, 0, 3, D (ticket number A03D); 411.
const WT_B16 = '1100010100001110', WT_B12 = '001010100111';
const WT_DN2 = { title: 'Walk me through it: binary to hexadecimal and denary', steps: [
  { text: `<strong>A similar question.</strong> The binary number ${WT_B16} is stored. Give its 4-digit hexadecimal number.`, visual: big(spaced(WT_B16)) },
  { text: 'Split the 16 bits into nibbles, starting from the right. 16 bits make 4 nibbles.', visual: nibTable(WT_B16, { digits: false }) },
  { text: `Each nibble (8, 4, 2, 1) gives one digit: 1100 = 12 = C, 0101 = 5, 0000 = 0, 1110 = 14 = E.`, visual: nibTable(WT_B16) },
  { text: `So the hexadecimal number is <strong>${b2h(WT_B16)}</strong>. Keep the 0: it has its own nibble.`, visual: line(kw(b2h(WT_B16))) },
  { text: `<strong>Now 12-bit binary to denary.</strong> Convert ${WT_B12}. Change it to hexadecimal first: 3 nibbles.`, visual: nibTable(WT_B12) },
  { text: `${WT_B12} is ${b2h(WT_B12)}. The place values are 256, 16 and 1. A = 10.`, visual: hexTable(b2h(WT_B12), { value: true }) },
  { text: 'Multiply each value by its place value: 2 &times; 256 = 512, 10 &times; 16 = 160, 7 &times; 1 = 7.', visual: hexTable(b2h(WT_B12), { value: true, worth: true }) },
  { text: `Add: 512 + 160 + 7 = <strong>${val(WT_B12)}</strong>.`, visual: line(kw(`512 + 160 + 7 = ${val(WT_B12)}`)) },
  { text: 'Now do the same for the question: nibbles from the right, one digit each, then place values 256, 16 and 1.', visual: note('nibbles &rarr; digits &rarr; multiply &rarr; add') },
] };
steps.push(checkStep('do-now-2', 'Do Now: From Binary (2 of 2)', 'Do Now: From Binary (2 of 2)',
  'Recap of 1.4 Hexadecimal Conversions. (a) ' + cite('0478/11, November 2023, Question 2(c)') + ' Each ticket has a 4-digit hexadecimal ticket number that is stored as binary. The binary number 1010000000111101 is stored for a customer\'s ticket number. (b) ' +
  cite('0478/13, June 2024, Question 3(b)(ii)') + ' The binary number stored for an address is 000110011011.', [
    { label: 'Give the hexadecimal ticket number that would be displayed on this customer\'s ticket.', answer: hexStrict('A03D'), feedback: 'Split into 4 nibbles from the right. Each nibble gives one digit, even 0000.', marks: 4 },
    { label: 'Convert the binary number 000110011011 to denary.', answer: num(411), feedback: 'Change it to 3 hexadecimal digits first, then use the place values 256, 16 and 1.' },
  ], ['Why does a 16-bit number give exactly 4 hexadecimal digits?', 'Each digit is one nibble of 4 bits, and 4 nibbles make 16 bits.']));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-6-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Binary Addition',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Binary Addition</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> add two 8-bit <strong>binary</strong> numbers.', 'Show the <strong>carries</strong> in your working.', 'Why each step works.']) +
    why('Why might a computer need to add two binary numbers?', 'Everything a computer stores is binary, so every sum it works out is a binary addition.') });

// ---------------------------------------------------------------- 1 + 1 = 10
steps.push(mcStep('predict-11', 'Predict: 1 + 1 in Binary', 'Predict: 1 + 1 in Binary', 'Binary only has the digits 0 and 1. Predict, then check.', [
  { prompt: 'What is 1 + 1 in binary?', options: ['2', '10', '11'], correct: 1,
    explain: 'Binary has no digit 2. Two is one 2 and no 1s, so 1 + 1 = 10 in binary.' },
], ['In denary, why is 9 + 1 written with two digits?', 'Denary has no single digit for ten, so ten is written as one ten and no ones.']));

steps.push(concept('concept-rules', 'Adding Bits: Why 1 + 1 = 10',
  'Binary has no digit 2. So how can two 1s be written, using only 0 and 1?',
  '<p>With two columns. The right column is worth 1 and the next is worth 2. Two is one 2 and no 1s: 10.</p>',
  columns(facts(['0 + 0 = <strong>0</strong>', '0 + 1 = <strong>1</strong> and 1 + 0 = <strong>1</strong>', '1 + 1 = <strong>10</strong>: there is no digit 2, so two is one 2 and no 1s.',
    '10 in binary is <strong>two</strong>, not ten. Read it as "one zero".']),
    '<div style="display:grid;gap:8px">' + grid([box(monoLine('0 + 0 = 0')), box(monoLine('0 + 1 = 1')), box(monoLine('1 + 0 = 1')), box(monoLine('1 + 1 = 10'))]) +
    bitTable('10', { hl: [0] }) + line('10 = one 2 + no 1s = <strong>2</strong>') + '</div>')));

// ---------------------------------------------------------------- why carry
const EXC = ['0011', '0001'];
steps.push(concept('concept-carry', 'Why Do We Carry?',
  'In denary, 8 + 5 = 13. Why is the 1 of 13 written in the tens column?',
  '<p>13 is one ten and three ones. One column can only hold one digit, so the ten moves to the column worth 10.</p>',
  columns(facts(['A binary column can only hold <strong>0 or 1</strong>.', '1 + 1 = 10: write <strong>0</strong> and <strong>carry 1</strong> to the next column on the left.',
    'The next column is worth <strong>double</strong>, so one 1 there is worth the two 1s.', 'Write the carry small, <strong>above</strong> the next column. It is part of your working.']),
    '<div style="display:grid;gap:8px">' + box(boxTitle('Denary: 8 + 5') + monoLine('8 + 5 = 13: write 3, carry 1 to the tens')) +
    addTable(EXC[0], EXC[1]) + line(`${EXC[0]} + ${EXC[1]}: ${val(EXC[0])} + ${val(EXC[1])} = <strong>${val(add(...EXC).sum)}</strong>`) + '</div>')));

// ---------------------------------------------------------------- 1 + 1 + 1 = 11
steps.push(mcStep('predict-three', 'Predict: Three 1s in a Column', 'Predict: Three 1s in a Column', '', [
  { prompt: 'One column has 1 + 1, and a carry of 1 comes in from the right. What do you write, and what do you carry?', options: ['Write 1, carry 1', 'Write 0, carry 1', 'Write 3, carry 0'], correct: 0,
    explain: 'Three 1s make 3. 3 is one 2 and one 1: 11 in binary. Write 1 and carry 1.' },
], ['Why is a carry counted as one more 1 in the column it goes into?', 'It came from the column on the right, where it stood for two 1s. This column is worth double, so it is one 1 here.']));

steps.push(concept('concept-three', 'Compare: Why Count the 1s?',
  'Every column you add has 0, 1, 2 or 3 ones in it (with the carry). Why is that enough to know what to write?',
  '<p>Each count has one answer in binary: 0, 1, 10 or 11. Write the right digit. The left digit, if there is one, is the carry.</p>',
  facts(['Count the 1s in the column, <strong>with the carry</strong> coming in.', 'Write the <strong>right</strong> digit of the count in binary. Carry the left digit.', 'A column never carries more than 1: three 1s is the most there can be.']) +
  grid([
    box(boxTitle('No 1s') + monoLine('0 + 0 = 0') + boxLine('Write <strong>0</strong>. No carry.')),
    box(boxTitle('One 1') + monoLine('0 + 1 = 1') + boxLine('Write <strong>1</strong>. No carry.')),
    box(boxTitle('Two 1s') + monoLine('1 + 1 = 10') + boxLine('Write <strong>0</strong>. Carry <strong>1</strong>.')),
    box(boxTitle('Three 1s') + monoLine('1 + 1 + 1 = 11') + boxLine('Write <strong>1</strong>. Carry <strong>1</strong>.')),
  ], 4)));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: One Column at a Time', 'drill-y11-1-6-columns', 'Activity 1: One Column at a Time',
  'What to write, what to carry, then 4-bit sums and Sam\'s slips. Get each card right 3 times in a row.',
  ['Why does a carry change what you write in the next column?', 'It adds one more 1 to that column, so the count of 1s goes up by one.']));

// ---------------------------------------------------------------- start at the right
const EXR = ['01011010', '00110110'];
const exr = add(...EXR);
steps.push(concept('concept-right', 'Why Start at the Right?',
  'Predict: if you start adding at the left column, what goes wrong when a carry comes along later?',
  '<p>The carry lands on a column you have already finished, so you must change it. From the right, every carry goes to a column you have not done yet.</p>',
  columns(facts(['Start at the <strong>right</strong> column, the 1s.', 'Go left one column at a time. Add in any carry.', 'Write each carry <strong>above</strong> the next column.',
    'Check: convert both numbers to <strong>denary</strong> and add. The answer must match.', 'Typing the carries: 8 digits, left to right, 1 for a carry and 0 for none.']),
    '<div style="display:grid;gap:8px">' + addTable(...EXR) +
    line(`Carry row: <strong>${exr.carry}</strong>`) + line(`Check: ${val(EXR[0])} + ${val(EXR[1])} = ${val(exr.sum)}, and ${spaced(exr.sum)} = <strong>${val(exr.sum)}</strong>`) + '</div>')));

const EXP = ['00101011', '00011001'];
const exp = add(...EXP);
steps.push(mcStep('predict-8bit', 'Predict: Which Answer Is Right?', 'Predict: Which Answer Is Right?', '', [
  { prompt: `Add ${EXP[0]} and ${EXP[1]} using binary addition. Which answer is right?`, options: [exp.sum, xor(...EXP), bin8(val(exp.sum) + 1)], correct: 0,
    explain: `Check in denary: ${val(EXP[0])} + ${val(EXP[1])} = ${val(exp.sum)}, and ${exp.sum} = ${sumText(exp.sum)} = ${val(exp.sum)}. ${xor(...EXP)} left out the carries.` },
], ['Why can converting to denary show that a binary answer is wrong?', 'Adding gives the same total in any number system. The two denary values must add up to the denary value of the answer.'],
  addTable(...EXP, { done: 0 })));

const EXS = ['01001110', '00100111'];
const exs = add(...EXS), sam = xor(...EXS);
steps.push(concept('compare-sam', 'Compare: Why Every Carry Matters',
  `Sam adds ${EXS[0]} and ${EXS[1]} and writes ${sam}. He wrote 0 for every 1 + 1, but carried nothing. Why is that wrong?`,
  `<p>Each 1 + 1 makes two, and two is a 1 in the next column. Sam threw those away: his answer is ${val(sam)}, but ${val(EXS[0])} + ${val(EXS[1])} = ${val(exs.sum)}.</p>`,
  facts(['1 + 1 is <strong>not</strong> 0. It is 10: the 1 moves left as a carry.', 'Leaving out a carry loses its value.', 'Convert back to check. A slip shows up straight away.']) +
  columns(box(boxTitle(`Ana: ${exs.sum}`) + addTable(...EXS, { label: false }) + boxLine(`${val(exs.sum)} = ${val(EXS[0])} + ${val(EXS[1])}.`) + verdict('Right.', true)),
    box(boxTitle(`Sam: ${sam}`) + monoLine(`${sumText(sam)} = ${val(sam)}`) + boxLine(`${val(sam)} is not ${val(EXS[0])} + ${val(EXS[1])}.`) + verdict('Wrong: no carries.', false)))));

// ---------------------------------------------------------------- exam questions
// Mark schemes (answer; carries shown): 0478/11 June 2023 Q1(d) 10010100, 4 carries; 0478/12 June 2024 Q3(c) 10010110,
// 2 carries; 0478/13 November 2023 Q2(e) 10101011, 3 carries; 0478/11 November 2024 Q3(d) 11001000, 4 carries;
// 0478/12 March 2025 Q1(b) 10101110, 3 carries; 0478/12 June 2025 Q1(e) 11010101, 2 carries; 0478/11 November 2025
// Q1(e) 10100110, 3 carries; 0478/12 March 2026 Q6(e) no mark scheme (worked out in code).
const REALADD = [
  { a: '00110011', b: '01100001', ms: '10010100', carries: 4, ref: '0478/11, June 2023, Question 1(d)', marks: 3 },
  { a: '00110000', b: '01100110', ms: '10010110', carries: 2, ref: '0478/12, June 2024, Question 3(c)', marks: 3 },
  { a: '00110011', b: '01111000', ms: '10101011', carries: 3, ref: '0478/13, November 2023, Question 2(e)', marks: 3 },
  { a: '01010100', b: '01110100', ms: '11001000', carries: 4, ref: '0478/11, November 2024, Question 3(d)', marks: 3, adapted: true },
  { a: '10011011', b: '00010011', ms: '10101110', carries: 3, ref: '0478/12, March 2025, Question 1(b)', marks: 3 },
  { a: '01100101', b: '01110000', ms: '11010101', carries: 2, ref: '0478/12, June 2025, Question 1(e)', marks: 3, adapted: true },
  { a: '01110110', b: '00110000', ms: '10100110', carries: 3, ref: '0478/11, November 2025, Question 1(e)', marks: 3 },
  { a: '00011010', b: '01101110', ms: null, carries: null, ref: '0478/12, March 2026, Question 6(e)', marks: 3 },
];
REALADD.forEach((q) => {
  const r = add(q.a, q.b);
  assert(r.out === 0 && val(q.a) + val(q.b) <= 255, `${q.ref} stays inside 8 bits`);
  assert(val(r.sum) === val(q.a) + val(q.b), `${q.ref} adds up`);
  if (q.ms) assert(r.sum === q.ms && r.count === q.carries, `${q.ref} matches its mark scheme (${r.sum}, ${r.count} carries)`);
  Object.assign(q, r);
});
// Similar additions for the walkthroughs, one per exam slide, never a question's numbers or answer.
const WT_PAIRS = [['00101101', '01010110'], ['01001011', '00110101'], ['01000110', '00111011'], ['01100011', '00011110'],
  ['01010011', '00111001'], ['00100111', '01101100'], ['01011100', '00101111'], ['00111010', '01001011']];
const cap = (t) => t[0].toUpperCase() + t.slice(1);
function wtAdd(a, b) {
  const r = add(a, b), n = a.length, pv = pvs(n);
  const out = [
    { text: `<strong>A similar question.</strong> Add the two 8-bit binary numbers ${a} and ${b} using binary addition.`, visual: big(`${a} + ${b}`) },
    { text: 'Write one number under the other, each bit under its place value. Leave a row above for the carries.', visual: addTable(a, b, { done: 0 }) },
  ];
  for (let k = 1; k <= n; k++) {
    const i = n - k, cin = +r.carry[i], ones = +a[i] + +b[i] + cin;
    const what = `${a[i]} + ${b[i]}${cin ? ' + the carry 1' : ''}`;
    const res = ones === 0 ? 'no 1s: write 0.' : ones === 1 ? 'one 1: write 1.' :
      ones === 2 ? `two 1s make 10: write 0, and carry 1 to the ${pv[i] * 2} column.` : `three 1s make 11: write 1, and carry 1 to the ${pv[i] * 2} column.`;
    out.push({ text: `The ${pv[i]} column: ${what}. ${cap(res)}`, visual: addTable(a, b, { done: k, hl: [i] }) });
  }
  out.push({ text: `Check in denary: ${val(a)} + ${val(b)} = ${val(a) + val(b)}, and ${spaced(r.sum)} = ${val(r.sum)}. The carry row is ${r.carry}.`, visual: line(kw(`${val(a)} + ${val(b)} = ${val(r.sum)}`)) });
  out.push({ text: 'Now do the same for the question. Start at the right, write each carry, then type the carry row and the answer.', visual: note('right to left &nbsp; two 1s &rarr; 0, carry 1 &nbsp; three 1s &rarr; 1, carry 1') });
  return { title: 'Walk me through it: binary addition', steps: out };
}
const LEADS = [
  'Two 8-bit binary numbers are given. Add the two 8-bit binary numbers using binary addition. Give your answer in binary. Show all your working.',
  'The two binary integers 00110000 and 01100110 are added together. Add the binary integers using binary addition and show your answer in binary. Show all your working.',
  'Add the binary values 00110011 and 01111000 using binary addition. Give your answer in binary. Show all your working.',
  'The character \'T\' is stored as the binary number 01010100. The character \'t\' is stored as the binary number 01110100. Add the two binary numbers using binary addition. Give your answer in binary. Show all your working.',
  'Two 8-bit binary numbers are given. Add the two 8-bit binary numbers using binary addition. Give your answer in binary. Show all your working.',
  'The 8-bit binary numbers 01100101 and 01110000 are stored in a computer. The binary numbers are added together. Add the two binary numbers using binary addition. Give your answer in binary. You must show all your working.',
  'A calculator has 8-bit registers. Two binary numbers stored in the registers are 01110110 and 00110000. Add the binary numbers using binary addition. Show all your working. Give your answer in binary.',
  'Add the two binary integers using binary addition and give your answer in binary. Show all your working.',
];
const WHYS = [
  ['Why do we line the two numbers up under the same place values?', 'Only bits worth the same can be added together, like adding tens to tens in denary.'],
  ['Why does the mark scheme give a mark for the carries?', 'The carries are the working. They show each column was added the right way.'],
  ['Why can a column never carry more than 1 to the left?', 'The most a column can have is two bits and a carry: three 1s. Three is less than four, so only one 1 moves left.'],
  ['Why is it worth checking your answer by converting to denary?', 'If the denary values do not add up, there is a slip somewhere.'],
  ['Why do we write the carry above the next column, and not in the answer row?', 'The carry belongs to the next column. It is added in when you work out that column.'],
  ['Why is 1 + 0 with a carry of 1 the same as 1 + 1?', 'Both columns have two 1s in them, so both give the same count.'],
  ['Why must we finish one column before starting the next one on its left?', 'The column may make a carry, and the next column has to add it in.'],
  ['Why does a column with a 0 in both numbers still need checking?', 'A carry may be coming in from the right, and then the column has a 1 in it.'],
];
const CARRY_FB = 'Each time a column makes 10 or 11, write 1 above the next column on the left. Type all 8 digits, left to right, 0 where there is no carry.';
const SUM_FB = 'Start at the right. Count the 1s in each column, with any carry. Two 1s: write 0, carry 1. Three 1s: write 1, carry 1.';
REALADD.forEach((q, i) => {
  const id = `exam-${i + 1}`;
  steps.push(checkStep(id, `Exam Question: Binary Addition (${i + 1} of ${REALADD.length})`, `Exam Question: Binary Addition (${i + 1} of ${REALADD.length})`,
    (q.adapted ? 'Adapted from Cambridge IGCSE ' + q.ref + '. ' : cite(q.ref) + ' ') + LEADS[i], [
      { label: 'Carry row (8 digits: 1 for a carry, 0 for none)', answer: carryAns(q.carry), feedback: CARRY_FB },
      { label: 'Answer in binary', answer: binFull(q.sum), feedback: SUM_FB, marks: q.marks - 1 },
    ], WHYS[i], addTable(q.a, q.b, { done: 0 })));
  steps[steps.length - 1].walkthrough = wtAdd(...WT_PAIRS[i]);
  if (i === 1) {
    steps.push(embed('activity-2', 'Activity 2: Add 8 Bits', 'drill-y11-1-6-add', 'Activity 2: Add 8 Bits',
      'Whole 8-bit sums, the carry row, checks in denary and Sam\'s slips. Most numbers come from real exam papers.',
      ['Why does every card ask you to work from the right?', 'Carries only move left, so each column must be done before the one on its left.']));
  }
});

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Binary Addition Drill', 'drill-y11-1-6-binadd', 'Plenary: Binary Addition Drill',
  'The rules, whole additions from real exam papers, the carry row and why it all works. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
assert(bin8(150) === '10010110' && h2b('F08') === '111100001000', 'Do Now 1 worked out');
assert(b2h('1010000000111101') === 'A03D' && val('000110011011') === 411, 'Do Now 2 from the mark schemes');
assert(exr.sum === '10010000' && exr.out === 0 && exp.out === 0 && exs.out === 0, 'examples');
ok('do-now', 0, ['10010110', '1001 0110', '10010110 in binary'], ['10010111', '01101001', '150', '96']);
ok('do-now', 1, ['111100001000', '1111 0000 1000'], ['11110001000', '1111 1000', '000011111000', 'F08']);
ok('do-now-2', 0, ['A03D', 'a03d', 'A 0 3 D'], ['A3D', 'D30A', '41021', 'A03']);
ok('do-now-2', 1, ['411', '0411', '411 in denary'], ['19B', '410', '4110']);
REALADD.forEach((q, i) => {
  const id = `exam-${i + 1}`;
  ok(id, 0, [q.carry, q.carry.slice(0, 7), q.carry.split('').join(' '), spaced(q.carry)], [xor(q.a, q.b), q.sum, '0'.repeat(8), q.carry.slice(1) + '0'].filter((x) => x !== q.carry && x.slice(0, 7) !== q.carry.slice(0, 7)));
  ok(id, 1, [q.sum, spaced(q.sum), q.sum + ' in binary', ' ' + q.sum + ' '], [xor(q.a, q.b), String(val(q.sum)), q.sum.slice(1), bin8(val(q.sum) ^ 1)]);
});
// Walkthroughs: never the slide's numbers, answers or carry row.
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
const digitsOf = (o) => plain(JSON.stringify(o)).replace(/(?<=[01]) (?=[01])/g, '');
steps.filter((s) => s.walkthrough).forEach((s) => {
  assert(s.walkthrough.steps.length >= 6, `${s.id} walkthrough is step by step`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
{
  const d1 = digitsOf(WT_DN1), d2 = digitsOf(WT_DN2);
  assert(!/10010110|111100001000/.test(d1), 'Do Now 1 walkthrough gives an answer');
  assert(!/A\s*0\s*3\s*D/i.test(plain(JSON.stringify(WT_DN2))) && !/\b411\b/.test(plain(JSON.stringify(WT_DN2))), 'Do Now 2 walkthrough gives an answer');
  void d2;
  REALADD.forEach((q, i) => {
    const s = steps.find((x) => x.id === `exam-${i + 1}`), w = s.walkthrough, d = digitsOf(w.steps.map((x) => x.text));
    const [a, b] = WT_PAIRS[i], e = add(a, b);
    // The pictures only hold the similar question's own rows: none of them may be this slide's answer or carry row.
    [a, b, e.sum, e.carry].forEach((row) => assert(row !== q.sum && row !== q.carry && row !== q.a && row !== q.b, `exam-${i + 1} walkthrough row ${row}`));
    assert(!d.includes(q.sum) && !d.includes(q.carry), `exam-${i + 1} walkthrough text shows the answer or carry row`);
    assert(add(a, b).out === 0 && add(a, b).count >= 3, `walkthrough pair ${a} + ${b}`);
  });
}
// Slide examples never use a question's numbers or answers.
{
  const qs = REALADD.flatMap((q) => [q.a, q.b, q.sum]);
  [...EXC, ...EXR, ...EXP, ...EXS].forEach((b) => assert(!qs.includes(b.padStart(8, '0')), `example ${b} is also in a question`));
  [exr.sum, exp.sum, exs.sum].forEach((b) => assert(!qs.includes(b), `example answer ${b} is also in a question`));
  [WT_N].forEach((n) => assert(n !== 150, 'Do Now example'));
}
// No term before the slide that teaches it (the title slide only names today's topic). Later topics never.
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/\bcarr(y|ies|ied|ying)\b/i, 'concept-carry'], [/\bnibbles?\b/i, 'do-now'],
    [/two.s complement|overflow|\bbytes?\b|ascii|logical shift|mario|\bdecimal\b|\bhex\b|\bRAM\b|ninth|9-bit|9 bits|too big for 8|more than 8 bits/i, null]];
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
  s.items.forEach((it) => assert(!t.toLowerCase().includes(it.options[it.correct].toLowerCase()) && !new RegExp('\\b' + it.options[it.correct] + '\\b', 'i').test(t), `${s.id} TPS gives the option`));
});

// ---------------------------------------------------------------- drills
const C = (r) => `From Cambridge IGCSE ${r}.`;
const REAL_ADD_DRILL = REALADD.map((q) => [q.a, q.b, (q.adapted ? 'Adapted from Cambridge IGCSE ' + q.ref + '.' : C(q.ref))]);
// Extension values (1.1 to 1.4), each checked against its mark scheme in the 1.1 to 1.4 builders and again here.
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
  ['28', C('0478/11, November 2021, Question 1(b)')], ['A1', C('0478/11, November 2021, Question 1(b)')], ['AB', C('0478/12, November 2021, Question 1(b)')],
  ['29', C('0478/13, June 2021, Question 1(a)(iii)')], ['C8', C('0478/13, June 2021, Question 1(a)(iii)')], ['0AC', C('0478/11, November 2022, Question 3(c)')],
  ['10B', C('0478/11, June 2025, Question 2(c)(i)')], ['0A2', C('0478/12, June 2026, Question 3(d)')], ['104', C('0478/12, June 2026, Question 3(d)')],
];
const REALD2H = [
  [65, C('0478/13, November 2023, Question 2(c)')], [165, C('0478/11, June 2024, Question 2(b)')], [250, C('0478/12, November 2024, Question 3(c)')],
  [236, C('0478/12, March 2024, Question 8(a)(i)')], [123, C('0478/12, June 2021, Question 1(a)')], [200, C('0478/12, June 2021, Question 1(a)')],
];
const REALB2H = [
  ['10010011', C('0478/12, June 2023, Question 2(a)')], ['10110100', C('0478/13, June 2025, Question 1(c)(ii)')], ['11100011', C('0478/12, November 2023, Question 2(b)')],
  ['01111001', C('0478/11, November 2024, Question 3(c)(ii)')], ['10000010', C('0478/13, November 2025, Question 1(c)(iii)')],
];
const REALH2B = [
  ['42', C('0478/11, June 2022, Question 4(c)')], ['CE', C('0478/11, June 2022, Question 4(c)')], ['2F', C('0478/12, June 2022, Question 2(a)')],
  ['D6', C('0478/12, June 2022, Question 2(a)')], ['C9', C('0478/13, June 2021, Question 1(a)(ii)')], ['2A', C('0478/11, June 2026, Question 3(b)')],
];
{ const ms = { '28': 40, 'A1': 161, 'AB': 171, '29': 41, 'C8': 200, '0AC': 172, '10B': 267, '0A2': 162, '104': 260 };
  REALHEX.forEach(([h]) => assert(ms[h] === hv(h), `1.3 value ${h}`));
  const ms11 = { '01010101': 85, '10101110': 174, '00011001': 25, '11100011': 227, '01000110': 70 };
  REAL11.forEach(([b]) => assert(ms11[b] === val(b), `1.1 value ${b}`));
  const msd = { 65: '41', 165: 'A5', 250: 'FA', 236: 'EC', 123: '7B', 200: 'C8' };
  REALD2H.forEach(([n]) => assert(msd[n] === toHex(n), `1.4 value ${n}`));
  const msb = { '10010011': '93', '10110100': 'B4', '11100011': 'E3', '01111001': '79', '10000010': '82' };
  REALB2H.forEach(([b]) => assert(msb[b] === b2h(b), `1.4 value ${b}`));
  const msh = { '42': '0100 0010', 'CE': '1100 1110', '2F': '0010 1111', 'D6': '1101 0110', 'C9': '1100 1001', '2A': '0010 1010' };
  REALH2B.forEach(([h]) => assert(msh[h] === spaced(h2b(h)), `1.4 value ${h}`)); }

const INJECT = { REALADD: REAL_ADD_DRILL, REAL11, REAL12, REALHEX, REALD2H, REALB2H, REALH2B };
const drillHead = (id, about) => `// Year 11, 1.6: Binary Addition. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_6_binadd.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => {
  let body = fn.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  return drillHead(id, about) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${body})()\n});\n`;
};

// ---- Do Now Extension: 1.1 to 1.4. Every card has an example on different numbers and two nudges.
function extCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  var PV = [128, 64, 32, 16, 8, 4, 2, 1];
  var D = "0123456789ABCDEF";
  function bin8(n) { var s = n.toString(2); while (s.length < 8) s = "0" + s; return s; }
  function ones(b) { return b.split("").filter(function (c) { return c === "1"; }).length; }
  function hv(h) { return parseInt(h, 16); }
  function hx(n) { return n.toString(16).toUpperCase(); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function nib(d) { return pad(hv(d).toString(2), 4); }
  function h2b(h) { return h.split("").map(nib).join(""); }
  function b2h(b) { var o = ""; for (var i = 0; i < b.length; i += 4) o += parseInt(b.slice(i, i + 4), 2).toString(16).toUpperCase(); return o; }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?0*" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function hexRe(h) { return new RegExp("^\\s*(?:0\\s*)*" + h.replace(/^0+(?=.)/, "").split("").join("\\s*") + "(\\s*(in\\s+)?hexadecimal)?\\s*$", "i"); }
  function hexStrict(h) { return new RegExp("^\\s*" + h.split("").join("\\s*") + "(\\s*(in\\s+)?hexadecimal)?\\s*$", "i"); }
  function plus(b) { var o = []; for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]); return o.join(" + "); }
  function rev(b) { return b.split("").reverse().join(""); }
  function work(h) { var p = h.length === 3 ? [256, 16, 1] : [16, 1]; return h.split("").map(function (c, i) { return hv(c) + " x " + p[i]; }).join(" + ") + " = " + hv(h); }
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var PVLINE = "Place values: 128  64  32  16  8  4  2  1";
  var REAL11 = [] /*REAL11*/;
  var REAL12 = [] /*REAL12*/;
  var REALHEX = [] /*REALHEX*/;
  var REALD2H = [] /*REALD2H*/;
  var REALB2H = [] /*REALB2H*/;
  var REALH2B = [] /*REALH2B*/;
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
    { id: "ex-05", category: "ex-h16", randomize: function () { return hexCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2 && !/[A-F]/.test(r[0]); }))); } },
    { id: "ex-06", category: "ex-h16", randomize: function () { return hexCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 2 && /[A-F]/.test(r[0]); }))); } },
    { id: "ex-07", category: "ex-h16", randomize: function () { return hexCard(drillPick(REALHEX.filter(function (r) { return r[0].length === 3; }))); } },
    { id: "ex-08", category: "ex-conv", randomize: function () {
        var r = drillPick(REALD2H), n = r[0], h = hx(n), q = Math.floor(n / 16), e; do { e = rnd(20, 250); } while (e === n || hx(e).length !== 2 || hx(e)[0] === hx(e)[1]);
        return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [hexRe(h)], format: "Type the hexadecimal number",
          distractors: uniq(hexRe(h), [h.split("").reverse().join(""), String(q) + String(n % 16), hx(n + 16), hx(n + 1)]),
          example: "Example: convert " + e + ".\nStep 1: " + e + " / 16 = " + Math.floor(e / 16) + " remainder " + (e % 16) + ".\nStep 2: the whole number is the left digit, the remainder is the right digit: " + hx(e) + ".",
          working: ["Divide by 16. The whole number is the left digit.", "The remainder is the right digit. Values above nine become letters."], note: n + " / 16 = " + q + " remainder " + (n % 16) + ", so " + h + ". " + r[1] };
      } },
    { id: "ex-09", category: "ex-conv", randomize: function () {
        var r = drillPick(REALB2H), b = r[0], h = b2h(b), e; do { e = pad(rnd(17, 255).toString(2), 8); } while (b2h(e) === h || !/[A-F]/.test(b2h(e)));
        return { prompt: "Convert the binary number " + b + " to hexadecimal.", answers: [h], keywords: [hexStrict(h)], format: "Type the hexadecimal number",
          distractors: uniq(hexStrict(h), [h.split("").reverse().join(""), String(val(b)), sp(b).split(" ").map(function (g) { return parseInt(g, 2); }).join("")]),
          example: "Example: convert " + e + ".\nStep 1: split into nibbles from the right: " + sp(e) + ".\nStep 2: each nibble (8, 4, 2, 1) gives one digit: " + b2h(e) + ".",
          working: ["Split the bits into nibbles from the right.", "Each nibble (8, 4, 2, 1) gives one digit."], note: sp(b) + " = " + h.split("").join(" ") + ". " + r[1] };
      } },
    { id: "ex-10", category: "ex-conv", randomize: function () {
        var r = drillPick(REALH2B), h = r[0], b = h2b(h), e; do { e = D[rnd(1, 15)] + D[rnd(0, 15)]; } while (e === h || !/[A-F]/.test(e));
        return { prompt: "Convert the hexadecimal number " + h + " to 8-bit binary.", answers: [sp(b)], keywords: [binRe(b)], format: "Type the 8 bits",
          distractors: uniq(binRe(b), [sp(h2b(h.split("").reverse().join(""))), b.replace(/^0+/, ""), h.split("").map(function (c) { return hv(c).toString(2); }).join(" ")]),
          example: "Example: convert " + e + ".\nStep 1: " + e[0] + " = " + nib(e[0]) + " and " + e[1] + " = " + nib(e[1]) + ".\nStep 2: side by side: " + sp(h2b(e)) + ".",
          working: ["Change each digit to 4 bits: 8, 4, 2, 1.", "Every digit gives exactly 4 bits, even 0 and 1."], note: h.split("").map(function (c) { return c + " = " + nib(c); }).join(", ") + ". " + r[1] };
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

// ---- Shared for the addition drills (copied into each by toString()).
// ---- Activity 1: one column at a time, 4-bit sums, the carry row, Sam's slips.
function columnCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function val(b) { return parseInt(b, 2); }
  function add(a, b) { var n = a.length, s = "", cs = [], k = 0; for (var i = n - 1; i >= 0; i--) { cs[i] = k; var t = +a[i] + +b[i] + k; s = (t % 2) + s; k = t > 1 ? 1 : 0; } return { s: s, c: cs.join(""), out: k, count: cs.filter(function (x) { return x === 1; }).length }; }
  function xor(a, b) { return a.split("").map(function (c, i) { return c === b[i] ? "0" : "1"; }).join(""); }
  function bitRe(x) { return new RegExp("^\\s*" + x + "\\s*$"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(carries|carry|in\\s+denary|denary))?\\s*$", "i"); }
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  function column() { var x, y, c; do { x = rnd(0, 1); y = rnd(0, 1); c = rnd(0, 1); } while (x + y + c === 0); return { x: x, y: y, c: c, t: x + y + c }; }
  function colText(k) { return "One column of a binary addition has the bits " + k.x + " and " + k.y + (k.c ? ", and a carry of 1 coming in from the right." : ", and no carry coming in."); }
  function colNote(k) { var t = k.t; return (t === 1 ? "One 1: write 1, no carry." : t === 2 ? "Two 1s make 10: write 0, carry 1." : "Three 1s make 11: write 1, carry 1."); }
  function pair4() { var a, b, r; do { a = pad(rnd(1, 14).toString(2), 4); b = pad(rnd(1, 14).toString(2), 4); r = add(a, b); } while (r.out || r.count < 1 || a === b); return { a: a, b: b, r: r }; }
  var SUMWORK = ["Start at the right. Count the 1s in each column, with any carry.", "Two 1s: write 0 and carry. Three 1s: write 1 and carry."];
  return [
    { id: "co-01", category: "co-col", randomize: function () {
        var k = column(), w = String(k.t % 2);
        return { prompt: colText(k) + "\nWhat bit do you write in the answer row?", answers: [w], keywords: [bitRe(w)], format: "Type one bit",
          distractors: w === "0" ? ["1", "2"] : ["0", "3"],
          working: ["Count the 1s in the column. A carry coming in counts as one more.", "Two 1s make 10 and three 1s make 11. Write the right-hand digit."], note: colNote(k) };
      } },
    { id: "co-02", category: "co-col", randomize: function () {
        var k = column(), c = String(k.t > 1 ? 1 : 0);
        return { prompt: colText(k) + "\nWhat do you carry to the next column on the left? Type 1 or 0.", answers: [c], keywords: [bitRe(c)], format: "Type one bit",
          distractors: c === "0" ? ["1", "2"] : ["0", "2"],
          working: ["Count the 1s in the column, with the carry coming in.", "Two or three 1s give a two-digit answer. Its left digit is the carry."], note: colNote(k) };
      } },
    { id: "co-03", category: "co-col", randomize: function () {
        var three = Math.random() < 0.5, a = three ? "11" : "10";
        return { prompt: "Add these bits in binary: " + (three ? "1 + 1 + 1" : "1 + 1") + ".", answers: [a], keywords: [binRe(a), new RegExp("^\\s*0\\s*" + a.split("").join("\\s*") + "\\s*$")], format: "Type the answer in binary",
          distractors: three ? ["3", "10", "111"] : ["2", "11", "0"],
          working: ["Count the 1s. That is the total in denary.", "Write that total with the place values two and one."], note: three ? "Three 1s make 3 = one 2 and one 1: 11." : "Two 1s make 2 = one 2 and no 1s: 10." };
      } },
    { id: "co-04", category: "co-nib", randomize: function () {
        var p = pair4();
        return { prompt: "Add the 4-bit binary numbers " + p.a + " and " + p.b + " using binary addition.", answers: [p.r.s], keywords: [binRe(p.r.s)], format: "Type the 4 bits",
          distractors: uniq(binRe(p.r.s), [xor(p.a, p.b), pad((val(p.r.s) ^ 1).toString(2), 4), pad((val(p.a) | val(p.b)).toString(2), 4)]),
          working: SUMWORK, note: "Carry row " + p.r.c + ". " + p.a + " + " + p.b + " = " + p.r.s + ". Check: " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + "." };
      } },
    { id: "co-05", category: "co-nib", randomize: function () {
        var p = pair4();
        return { prompt: "Add " + p.a + " and " + p.b + ". Type the carry row: 4 digits, left to right, 1 above each column that gets a carry, 0 where there is none.", answers: [p.r.c], keywords: [binRe(p.r.c)], format: "Type 4 digits",
          distractors: uniq(binRe(p.r.c), [p.r.c.slice(1) + "0", "0000", p.r.s, xor(p.r.c, "1110")]),
          working: ["Work from the right. The right column never gets a carry.", "Each column that makes two or three 1s puts a carry above the next column on the left."], note: p.a + " + " + p.b + " = " + p.r.s + ". The carries go above the columns " + p.r.c + "." };
      } },
    { id: "co-06", category: "co-nib", randomize: function () {
        var p = pair4(), n = p.r.count;
        return { prompt: "How many carries do you write when you add " + p.a + " and " + p.b + "?", answers: [String(n)], keywords: [num(n)],
          distractors: drillWrongNumbers(n, [n + 1, n - 1, n + 2].filter(function (x) { return x >= 0; }), 3),
          working: ["Work column by column from the right.", "Each column with two or three 1s sends a carry left. Count them."], note: "Carry row " + p.r.c + ". Answer " + p.r.s + "." };
      } },
    { id: "co-07", category: "co-check", randomize: function () {
        var p = pair4(), t = val(p.a) + val(p.b);
        return { prompt: "Check a sum in denary. Convert " + p.a + " and " + p.b + " to denary and add them. What total should the binary answer be worth?", answers: [String(t)], keywords: [num(t)],
          distractors: drillWrongNumbers(t, [val(xor(p.a, p.b)), t + 1, t - 1].filter(function (x) { return x >= 0 && x !== t; }), 3),
          working: ["Each bit has a place value: one, two, four and eight, from the right.", "Convert each number, then add the two values."], note: val(p.a) + " + " + val(p.b) + " = " + t + ", and " + p.r.s + " is " + t + "." };
      } },
    { id: "co-08", category: "co-check", randomize: function () {
        var p = pair4(), s = xor(p.a, p.b);
        return { prompt: "Sam adds " + p.a + " and " + p.b + " and writes " + s + ". He forgot every carry. What is the right answer?", answers: [p.r.s], keywords: [binRe(p.r.s)], format: "Type the 4 bits",
          distractors: uniq(binRe(p.r.s), [s, pad((val(p.r.s) ^ 1).toString(2), 4), pad((val(p.a) | val(p.b)).toString(2), 4)]),
          working: SUMWORK, note: "Sam's " + s + " is " + val(s) + ", but " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + ". Right: " + p.r.s + "." };
      } }
  ];
}

// ---- Activity 2: whole 8-bit additions, real exam numbers (70%) or new ones.
function addCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function val(b) { return parseInt(b, 2); }
  function bin8(n) { return pad(n.toString(2), 8); }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function add(a, b) { var n = a.length, s = "", cs = [], k = 0; for (var i = n - 1; i >= 0; i--) { cs[i] = k; var t = +a[i] + +b[i] + k; s = (t % 2) + s; k = t > 1 ? 1 : 0; } return { s: s, c: cs.join(""), out: k, count: cs.filter(function (x) { return x === 1; }).length }; }
  function xor(a, b) { return a.split("").map(function (c, i) { return c === b[i] ? "0" : "1"; }).join(""); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function carryRe(c) { return new RegExp("^\\s*" + c.slice(0, 7).split("").join("\\s*") + "(\\s*0)?\\s*$"); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(carries|carry|in\\s+denary|denary))?\\s*$", "i"); }
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var REALADD = [] /*REALADD*/;
  function threeOnes(a, b, c) { for (var i = 0; i < a.length; i++) if (a[i] === "1" && b[i] === "1" && c[i] === "1") return true; return false; }
  function pick(real, three) {
    if (real || Math.random() < 0.7) { var q = drillPick(REALADD); return { a: q[0], b: q[1], r: add(q[0], q[1]), src: " " + q[2] }; }
    var a, b, r;
    do { a = bin8(rnd(16, 200)); b = bin8(rnd(16, 200)); r = add(a, b); }
    while (r.out || r.count < 3 || a === b || (three && !threeOnes(a, b, r.c)));
    return { a: a, b: b, r: r, src: "" };
  }
  function sumCard(p) {
    var re = binRe(p.r.s);
    return { prompt: "Add the 8-bit binary numbers " + p.a + " and " + p.b + " using binary addition.", answers: [sp(p.r.s)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, [xor(p.a, p.b), bin8(val(p.r.s) ^ 2), bin8(val(p.a) | val(p.b))]),
      working: ["Start at the right. Count the 1s in each column, with any carry.", "Two 1s: write 0 and carry. Three 1s: write 1 and carry."],
      note: "Carry row " + p.r.c + ". Answer " + sp(p.r.s) + ". Check: " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + "." + p.src };
  }
  function carryCard(p) {
    var re = carryRe(p.r.c);
    return { prompt: "Add " + p.a + " and " + p.b + ". Type the carry row: 8 digits, left to right, 1 above each column that gets a carry, 0 where there is none.", answers: [p.r.c], keywords: [re], format: "Type 8 digits",
      distractors: uniq(re, [p.r.c.slice(1) + "0", xor(p.a, p.b), "00000000", p.r.s]),
      working: ["Work from the right. The right column never gets a carry.", "Each column that makes two or three 1s puts a carry above the next column on the left."],
      note: "Carry row " + p.r.c + " (" + p.r.count + " carries). Answer " + sp(p.r.s) + "." + p.src };
  }
  return [
    { id: "ad-01", category: "ad-sum", randomize: function () { return sumCard(pick(true)); } },
    { id: "ad-02", category: "ad-sum", randomize: function () { return sumCard(pick(false)); } },
    { id: "ad-03", category: "ad-sum", randomize: function () { return sumCard(pick(false, true)); } },
    { id: "ad-04", category: "ad-carry", randomize: function () { return carryCard(pick(true)); } },
    { id: "ad-05", category: "ad-carry", randomize: function () { return carryCard(pick(false)); } },
    { id: "ad-06", category: "ad-carry", randomize: function () {
        var p = pick(true), n = p.r.count;
        return { prompt: "How many carries do you write when you add " + p.a + " and " + p.b + "?", answers: [String(n)], keywords: [num(n)],
          distractors: drillWrongNumbers(n, [n + 1, n - 1, n + 2].filter(function (x) { return x >= 0; }), 3),
          working: ["Work column by column from the right.", "Each column with two or three 1s sends a carry left. Count them."], note: "Carry row " + p.r.c + ". Answer " + sp(p.r.s) + "." + p.src };
      } },
    { id: "ad-07", category: "ad-slip", randomize: function () {
        var p = pick(false), s = xor(p.a, p.b), re = binRe(p.r.s);
        return { prompt: "Sam adds " + p.a + " and " + p.b + " and writes " + s + ". He forgot every carry. What is the right answer?", answers: [sp(p.r.s)], keywords: [re], format: "Type the 8 bits",
          distractors: uniq(re, [s, bin8(val(p.r.s) ^ 2), bin8(val(p.a) | val(p.b))]),
          working: ["Start at the right. Each 1 + 1 makes 10: write 0 and carry.", "Add the carry into the next column on the left."],
          note: "Sam's " + s + " is " + val(s) + ", but " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + ". Right: " + sp(p.r.s) + "." + p.src };
      } },
    { id: "ad-08", category: "ad-slip", randomize: function () {
        var p = pick(true), t = val(p.a) + val(p.b);
        return { prompt: "Check a sum in denary. Convert " + p.a + " and " + p.b + " to denary and add them. What total should the binary answer be worth?", answers: [String(t)], keywords: [num(t)],
          distractors: drillWrongNumbers(t, [val(xor(p.a, p.b)), t + 1, t - 2].filter(function (x) { return x >= 0 && x !== t; }), 3),
          working: ["Place values: 128, 64, 32, 16, 8, 4, 2, 1.", "Convert each number, then add the two values."], note: val(p.a) + " + " + val(p.b) + " = " + t + ", and " + sp(p.r.s) + " is " + t + "." + p.src };
      } },
    { id: "ad-09", category: "ad-slip", randomize: function () {
        var p = pick(true), s = xor(p.a, p.b), v = val(s);
        return { prompt: "Sam adds " + p.a + " and " + p.b + " and writes " + s + ". Convert Sam's answer to denary to check it.", answers: [String(v)], keywords: [num(v)],
          distractors: drillWrongNumbers(v, [val(p.r.s), v + 1, v - 1].filter(function (x) { return x >= 0 && x !== v; }), 3),
          working: ["Find each 1 in Sam's answer.", "Add the place values above them."], note: s + " is " + v + ", but " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + ", so Sam is wrong." + p.src };
      } }
  ];
}

// ---- Plenary: this lesson only. The rules, real additions, the carry row, why it works (pick then type).
function plenaryCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function val(b) { return parseInt(b, 2); }
  function bin8(n) { return pad(n.toString(2), 8); }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function add(a, b) { var n = a.length, s = "", cs = [], k = 0; for (var i = n - 1; i >= 0; i--) { cs[i] = k; var t = +a[i] + +b[i] + k; s = (t % 2) + s; k = t > 1 ? 1 : 0; } return { s: s, c: cs.join(""), out: k, count: cs.filter(function (x) { return x === 1; }).length }; }
  function xor(a, b) { return a.split("").map(function (c, i) { return c === b[i] ? "0" : "1"; }).join(""); }
  function bitRe(x) { return new RegExp("^\\s*" + x + "\\s*$"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function carryRe(c) { return new RegExp("^\\s*" + c.slice(0, 7).split("").join("\\s*") + "(\\s*0)?\\s*$"); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(carries|carry|in\\s+denary|denary))?\\s*$", "i"); }
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var REALADD = [] /*REALADD*/;
  function real(i) { var q = i === undefined ? drillPick(REALADD) : REALADD[i]; return { a: q[0], b: q[1], r: add(q[0], q[1]), src: " " + q[2] }; }
  function column() { var x, y, c; do { x = rnd(0, 1); y = rnd(0, 1); c = rnd(0, 1); } while (x + y + c < 2); return { x: x, y: y, c: c, t: x + y + c }; }
  function sumCard(p) {
    var re = binRe(p.r.s);
    return { prompt: "Add the 8-bit binary numbers " + p.a + " and " + p.b + " using binary addition.", answers: [sp(p.r.s)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, [xor(p.a, p.b), bin8(val(p.r.s) ^ 2), bin8(val(p.a) | val(p.b))]),
      working: ["Start at the right. Count the 1s in each column, with any carry.", "Two 1s: write 0 and carry. Three 1s: write 1 and carry."],
      note: "Carry row " + p.r.c + ". Answer " + sp(p.r.s) + ". Check: " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + "." + p.src };
  }
  function carryCard(p) {
    var re = carryRe(p.r.c);
    return { prompt: "Add " + p.a + " and " + p.b + ". Type the carry row: 8 digits, left to right, 1 above each column that gets a carry, 0 where there is none.", answers: [p.r.c], keywords: [re], format: "Type 8 digits",
      distractors: uniq(re, [p.r.c.slice(1) + "0", xor(p.a, p.b), "00000000", p.r.s]),
      working: ["Work from the right. The right column never gets a carry.", "Each column that makes two or three 1s puts a carry above the next column on the left."],
      note: "Carry row " + p.r.c + " (" + p.r.count + " carries). Answer " + sp(p.r.s) + "." + p.src };
  }
  function why(id, prompt, answer, distractors, note, working) { return { id: id, category: "pl-why", prompt: prompt, answers: [answer], distractors: distractors, note: note, working: working, pickThenType: true }; }
  return [
    // ================================================= Rules
    { id: "pl-01", category: "pl-rules", prompt: "What is 1 + 1 in binary?", answers: ["10"], keywords: [binRe("10"), /^\s*0\s*1\s*0\s*$/], distractors: ["2", "11", "0"], format: "Type the answer in binary",
      working: ["Binary has no digit for two.", "Two is one 2 and no 1s."], note: "1 + 1 = 10 in binary: one 2 and no 1s." },
    { id: "pl-02", category: "pl-rules", prompt: "What is 1 + 1 + 1 in binary?", answers: ["11"], keywords: [binRe("11"), /^\s*0\s*1\s*1\s*$/], distractors: ["3", "10", "111"], format: "Type the answer in binary",
      working: ["Three 1s make three.", "Three is one 2 and one more."], note: "1 + 1 + 1 = 11 in binary: one 2 and one 1." },
    { id: "pl-03", category: "pl-rules", randomize: function () {
        var k = column(), w = String(k.t % 2);
        return { prompt: "One column has the bits " + k.x + " and " + k.y + (k.c ? ", and a carry of 1 coming in." : ", and no carry coming in.") + "\nWhat bit do you write in the answer row?", answers: [w], keywords: [bitRe(w)], format: "Type one bit",
          distractors: w === "0" ? ["1", "2"] : ["0", "3"],
          working: ["Count the 1s in the column. A carry coming in counts as one more.", "Two 1s make 10 and three 1s make 11. Write the right-hand digit."], note: k.t === 2 ? "Two 1s make 10: write 0, carry 1." : "Three 1s make 11: write 1, carry 1." };
      } },
    // ================================================= Whole additions, real papers
    { id: "pl-04", category: "pl-add", randomize: function () { return sumCard(real(rnd(0, 1))); } },
    { id: "pl-05", category: "pl-add", randomize: function () { return sumCard(real(rnd(2, 3))); } },
    { id: "pl-06", category: "pl-add", randomize: function () { return sumCard(real(rnd(4, 5))); } },
    { id: "pl-07", category: "pl-add", randomize: function () { return sumCard(real(rnd(6, 7))); } },
    { id: "pl-08", category: "pl-add", randomize: function () {
        var p = real(), s = xor(p.a, p.b), re = binRe(p.r.s);
        return { prompt: "Sam adds " + p.a + " and " + p.b + " and writes " + s + ". He forgot every carry. What is the right answer?", answers: [sp(p.r.s)], keywords: [re], format: "Type the 8 bits",
          distractors: uniq(re, [s, bin8(val(p.r.s) ^ 2), bin8(val(p.a) | val(p.b))]),
          working: ["Start at the right. Each 1 + 1 makes 10: write 0 and carry.", "Add the carry into the next column on the left."],
          note: "Sam's " + s + " is " + val(s) + ", but " + val(p.a) + " + " + val(p.b) + " = " + val(p.r.s) + ". Right: " + sp(p.r.s) + "." + p.src };
      } },
    // ================================================= Carries
    { id: "pl-09", category: "pl-carry", randomize: function () { return carryCard(real(rnd(0, 3))); } },
    { id: "pl-10", category: "pl-carry", randomize: function () { return carryCard(real(rnd(4, 7))); } },
    { id: "pl-11", category: "pl-carry", randomize: function () {
        var p = real(), n = p.r.count;
        return { prompt: "How many carries do you write when you add " + p.a + " and " + p.b + "?", answers: [String(n)], keywords: [num(n)],
          distractors: drillWrongNumbers(n, [n + 1, n - 1, n + 2].filter(function (x) { return x >= 0; }), 3),
          working: ["Work column by column from the right.", "Each column with two or three 1s sends a carry left. Count them."], note: "Carry row " + p.r.c + ". Answer " + sp(p.r.s) + "." + p.src };
      } },
    { id: "pl-12", category: "pl-carry", randomize: function () {
        var p = real(), t = val(p.a) + val(p.b);
        return { prompt: "Check a sum in denary. Convert " + p.a + " and " + p.b + " to denary and add them. What total should the binary answer be worth?", answers: [String(t)], keywords: [num(t)],
          distractors: drillWrongNumbers(t, [val(xor(p.a, p.b)), t + 1, t - 2].filter(function (x) { return x >= 0 && x !== t; }), 3),
          working: ["Place values: 128, 64, 32, 16, 8, 4, 2, 1.", "Convert each number, then add the two values."], note: val(p.a) + " + " + val(p.b) + " = " + t + ", and " + sp(p.r.s) + " is " + t + "." + p.src };
      } },
    // ================================================= Why it works
    why("pl-13", "Why is 1 + 1 written as 10 in binary?", "Binary has no digit 2, so two is written as one 2 and no 1s",
      ["Because the two 1s are written side by side", "Because 1 + 1 is ten", "Because binary always adds a 0"],
      "Binary only has 0 and 1. Two is one 2 and no 1s, which is 10.", ["Which digits does binary have?", "What are the place values of the two right-hand columns?"]),
    why("pl-14", "Why do we carry 1 to the next column on the left?", "The next column is worth double, so two 1s in one column are worth one 1 in the next",
      ["Because the answer row is full", "To make the answer longer", "Because the left column must always be 1"],
      "Each place value is double the one on its right. Two 1s here are worth exactly one 1 in the next column.", ["Compare the place values of two columns side by side.", "How many 1s in this column make one 1 in the next?"]),
    why("pl-15", "Why do we start adding at the right-hand column?", "Carries move to the left, so each column must be finished before the one on its left",
      ["Because the left bit is worth the most", "Because binary is read from the right", "So that the answer has 8 bits"],
      "A carry always goes left. Starting at the right means a carry never lands on a column you have already finished.", ["Which way does a carry move?", "What happens if a carry reaches a column you have finished?"]),
    why("pl-16", "Why is 1 + 1 + 1 written as 11 in binary?", "Three 1s make three, which is one 2 and one 1",
      ["Because there are three digits to add", "Because 1 + 1 + 1 is eleven", "Because a carry is always written twice"],
      "Three is one 2 and one 1. Write the 1 in this column and carry the 2 as a 1 to the next column.", ["How much do three 1s make?", "Make that from the place values two and one."]),
    why("pl-17", "Why is it useful to convert the numbers to denary after a binary addition?", "To check the answer: the two denary values must add up to the denary value of the answer",
      ["Because the mark scheme wants a denary answer", "Because binary addition is done in denary", "To make the answer shorter"],
      "Adding gives the same total in any number system, so a slip shows up as a different denary value.", ["Does a total change if you count in a different number system?", "What should the binary answer be worth?"])
  ];
}

const DRILLS = [
  ['y11-1-6-ext', 'Do Now Extension: 1.1 to 1.4. Every card has an example on different numbers and two nudges.',
    'Year 11 Extension: Number Systems Recap', '1.6 Do Now Extension',
    [['ex-bin', 'Binary and Denary'], ['ex-h16', 'Hexadecimal to Denary'], ['ex-conv', 'Hexadecimal Conversions']], extCards],
  ['y11-1-6-columns', 'Activity 1: one column at a time, 4-bit sums, the carry row and Sam\'s slips.',
    'Year 11, 1.6: One Column at a Time', 'Cambridge IGCSE Computer Science 0478',
    [['co-col', 'One Column'], ['co-nib', 'Add 4 Bits'], ['co-check', 'Check and Find the Slip']], columnCards],
  ['y11-1-6-add', 'Activity 2: whole 8-bit additions, the carry row, denary checks and Sam\'s slips.',
    'Year 11, 1.6: Add 8 Bits', 'Cambridge IGCSE Computer Science 0478',
    [['ad-sum', 'Add 8 Bits'], ['ad-carry', 'Show the Carries'], ['ad-slip', 'Check and Find the Slip']], addCards],
  ['y11-1-6-binadd', 'Plenary: the rules, real exam additions, the carry row and why it works.',
    'Year 11, 1.6: Binary Addition', 'Cambridge IGCSE Computer Science 0478',
    [['pl-rules', 'The Rules'], ['pl-add', 'Add 8 Bits'], ['pl-carry', 'Carries and Checks'], ['pl-why', 'Why It Works']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  { const bad = /two.s complement|overflow|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b|\bRAM\b/i.exec(src.split(id).join('')); assert(!bad, `drill ${id} names a later term: ${bad}`); }
  if (id === 'y11-1-6-ext') assert(!/carr(y|ies)/i.test(src.split('DrillData.register')[1].replace(/Carry on along/g, '')), 'extension drill names carry');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes and is the real sum, no distractor passes, and no example or working
// step gives the answer away.
const cardCounts = {};
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
        const ans = String(r.answers[0]);
        const bare = ans.replace(/\s+/g, '');
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: working nudges`);
        if (r.pickThenType) { r.answers.forEach((a) => assert(!r.distractors.some((x) => x.toLowerCase() === a.toLowerCase()), `${id} ${card.id}: answer is a distractor`)); continue; }
        const pass = (s) => r.keywords.some((k) => k.test(s));
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  '].concat(/^[0-9A-F ]+$/i.test(ans) ? [bare] : []).forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        let m;
        if ((m = /Add the (?:4|8)-bit binary numbers ([01]+) and ([01]+)/.exec(r.prompt)) || (m = /writes [01]+\. He forgot every carry/.test(r.prompt) && /adds ([01]+) and ([01]+)/.exec(r.prompt))) {
          assert(parseInt(bare, 2) === parseInt(m[1], 2) + parseInt(m[2], 2) && bare.length === m[1].length && parseInt(bare, 2) < 2 ** m[1].length, `${id} ${card.id}: ${m[1]} + ${m[2]} is not ${ans}`);
        }
        if ((m = /^Add ([01]+) and ([01]+)\. Type the carry row/.exec(r.prompt))) {
          const a = m[1], b = m[2]; let k = 0; const c = [];
          for (let i = a.length - 1; i >= 0; i--) { c[i] = k; k = +a[i] + +b[i] + k > 1 ? 1 : 0; }
          assert(bare === c.join('') && k === 0, `${id} ${card.id}: carry row of ${a} + ${b} is not ${ans}`);
        }
        if ((m = /Convert the hexadecimal number ([0-9A-F]+) to denary/.exec(r.prompt))) assert(Number(ans) === parseInt(m[1], 16), `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the denary number (\d+) to 8-bit binary/.exec(r.prompt))) assert(parseInt(bare, 2) === Number(m[1]) && bare.length === 8, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the 8-bit binary number ([01]+) to denary/.exec(r.prompt))) assert(Number(ans) === parseInt(m[1], 2), `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the denary number (\d+) to hexadecimal/.exec(r.prompt))) assert(parseInt(bare, 16) === Number(m[1]), `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the binary number ([01]+) to hexadecimal/.exec(r.prompt))) assert(parseInt(bare, 16) === parseInt(m[1], 2) && bare.length === m[1].length / 4, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if ((m = /Convert the hexadecimal number ([0-9A-F]+) to 8-bit binary/.exec(r.prompt))) assert(parseInt(bare, 2) === parseInt(m[1], 16) && bare.length === 8, `${id} ${card.id}: ${m[1]} is not ${ans}`);
        if (r.example && bare.length >= 2) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (!pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
      }
    }
    cardCounts[id] = d.cards.length;
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario|\bdecimal\b|overflow/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '1.6: Binary Addition', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-5-hexuse in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-5-hexuse"/.exec(raw);
    assert(m && raw.split('"y11-1-5-hexuse"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-5-hexuse"').join(`"y11-1-5-hexuse",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
