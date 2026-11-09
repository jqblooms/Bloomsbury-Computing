// Builds LessonData/y11-1-8-shifts.json: Year 11, 1.8: Logical Shifts (syllabus 0478 1.1: perform a logical binary
// shift left and right, and understand the effect on the binary number). The eighth lesson of the 2026-27 Year 11 plan,
// after y11-1-7-overflow.
//   node tools/build_y11_1_8_shifts.mjs
// It also writes the lesson's three drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-7-overflow (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: copied from tools/build_y11_1_7_overflow.mjs (same helpers, pictures and marking), one idea per slide,
// a teacher-only Think, Pair, Share under every heading, predict-then-check, compare slides.
// Real questions, each value worked out below and checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:   0478/12 November 2023 Q2(e) (1 0010 1111, overflow, 1.7); 0478/11 November 2025 Q1(e) (1010 0110, 1.6)
//   Exam:     0478/12 March 2026 Q6(c) (11010100, no mark scheme: worked in code); 0478/11 June 2024 Q3(b) (D) and
//             Q3(a) (00011000) (RAM left out of the stem); 0478/13 June 2023 Q1(c)(i) (01110000) and (ii) (B);
//             0478/12 November 2023 Q2(c) (10001100); 0478/13 June 2025 Q1(c)(iii) (00101001); 0478/11 November 2024
//             Q3(c)(iii) (00011110, ASCII left out of the stem); 0478/12 June 2023 Q2(b)(i) (00001111) and (ii) (written);
//             0478/12 November 2025 Q2(b) (00011110, 16 + 8 + 4 + 2, 30); written: 0478/12 March 2024 Q8(c),
//             0478/12 November 2024 Q3(d)(i) and (ii)
// Drills: y11-1-7-overflow reused for the Do Now Extension; y11-1-8-left (Activity 1), y11-1-8-shift (Activity 2),
// y11-1-8-shifts (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-8-shifts';
const P = 'y11-18s';
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
const sumText = (b) => pvs(b.length).filter((_, i) => b[i] === '1').join(' + ');
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
const sp9 = (b) => b[0] + ' ' + spaced(b.slice(1));
function add(a, b) {
  const n = a.length, s = Array(n), c = Array(n);
  let k = 0;
  for (let i = n - 1; i >= 0; i--) { c[i] = k; const t = +a[i] + +b[i] + k; s[i] = t % 2; k = t > 1 ? 1 : 0; }
  return { sum: s.join(''), carry: c.join(''), out: k, count: c.filter((x) => x === 1).length };
}
const xor = (a, b) => [...a].map((c, i) => (c === b[i] ? '0' : '1')).join('');
// Logical shifts of an 8-bit register: bits pushed out are lost, 0s come in.
const shl = (b, n) => b.slice(n) + '0'.repeat(n);
const shr = (b, n) => '0'.repeat(n) + b.slice(0, b.length - n);
const shift = (b, d, n) => (d === 'left' ? shl(b, n) : shr(b, n));
const lostBits = (b, d, n) => (d === 'left' ? b.slice(0, n) : b.slice(b.length - n));
const loses1 = (b, d, n) => lostBits(b, d, n).includes('1');
const fill1 = (b, d, n) => (d === 'left' ? b.slice(n) + '1'.repeat(n) : '1'.repeat(n) + b.slice(0, b.length - n));
const rot = (b, d, n) => (d === 'left' ? b.slice(n) + b.slice(0, n) : b.slice(b.length - n) + b.slice(0, b.length - n));
const other = (d) => (d === 'left' ? 'right' : 'left');
const WORDS = ['zero', 'one', 'two', 'three', 'four'];
const places = (n) => `${WORDS[n]} place${n === 1 ? '' : 's'}`;
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*(=\\s*)?${[...b].join('\\s*')}${BIN_TAIL}`;
const numFull = (n) => `^\\s*(=\\s*)?${n}(\\s*(in\\s+)?denary)?\\s*\\.?\\s*$`;
const carryAns = (c) => { const d = (s) => [...s].join('\\s*'); return `^\\s*(${d(c.slice(0, 7))}(\\s*0)?|1\\s*${d(c)})\\s*\\.?\\s*$`; };

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
const OUTSIDE = ';border:2px dashed var(--bad, var(--danger, #b42318));color:var(--bad, var(--danger, #b42318))';
function bitTable(bits, { label = true } = {}) {
  const n = bits.length, w = 46, f = 18, th = TH(w, f - 4);
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${lab('Place value')}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>` +
    `<tr>${lab('Bit')}${[...bits].map((c, i) => `<td style="${td(i)}">${c}</td>`).join('')}</tr></table>`;
}
// A logical shift: place values, the register before, and after. The bits pushed out sit in dashed "lost" cells outside
// the register, on the side they fell off; the 0s that came in are highlighted. show = false leaves the After row empty.
function shiftTable(bits, d, n, { label = true, show = true } = {}) {
  const L = d === 'left', res = shift(bits, d, n), lost = lostBits(bits, d, n), w = 38, th = TH(w, 13);
  const base = `padding:4px 3px;min-width:${w}px;text-align:center;border:1px solid var(--line-strong);height:30px;font:700 19px var(--font-mono, monospace)`;
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const outs = (fill) => Array.from({ length: n }, (_, i) => `<td style="${base}${OUTSIDE}">${fill ? lost[i] : ''}</td>`).join('');
  const outHead = Array.from({ length: n }, () => `<th style="${th}${OUTSIDE}">lost</th>`).join('');
  const isNew = (i) => (L ? i >= bits.length - n : i < n);
  const reg = (b, after) => [...b].map((c, i) => `<td style="${base}${after && isNew(i) ? HL : c === '0' ? ';color:var(--muted-2)' : ''}">${c}</td>`).join('');
  const blank = [...bits].map(() => `<td style="${base}"></td>`).join('');
  const row = (t, mid, side) => `<tr>${lab(t)}${L ? side : ''}${mid}${L ? '' : side}</tr>`;
  return `<table style="border-collapse:collapse;margin:0 auto">` + row('Place value', pvs(bits.length).map((p) => `<th style="${th}">${p}</th>`).join(''), outHead) +
    row('Before', reg(bits, false), outs(false)) + row(`After`, show ? reg(res, true) : blank, outs(show)) + '</table>';
}
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

// Walk me through it on a similar addition (as 1.7).
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
// Walk me through it on a similar shift: one place at a time, then the 8 bits, then the denary check.
function wtShift(bits, d, n, { den = false } = {}) {
  const res = shift(bits, d, n), L = d === 'left', f = 2 ** n, side = L ? 'right' : 'left', end = L ? 'left' : 'right';
  const out = [
    { text: `<strong>A similar question.</strong> A logical ${d} shift of ${places(n)} is performed on the binary number ${bits}.`, visual: big(spaced(bits)) },
    { text: 'Write the bits under their place values. Leave a row for the bits after the shift.', visual: shiftTable(bits, d, n, { show: false }) },
  ];
  for (let k = 1; k <= n; k++) {
    const gone = lostBits(bits, d, k)[L ? k - 1 : 0];
    out.push({ text: `Place ${k}: every bit moves 1 place ${d}. The ${gone} at the ${end} end ${kw('is lost')}. A ${kw('0 comes in')} on the ${side}.`, visual: shiftTable(bits, d, k) });
  }
  out.push({ text: `The register still holds 8 bits: ${spaced(res)}.`, visual: line(kw(spaced(res))) });
  const dv = val(bits), rv = val(res);
  let check;
  if (L) check = loses1(bits, d, n) ? `In denary, ${dv} becomes ${rv}. ${dv} x ${f} = ${dv * f} needs more than 8 bits: a 1 was lost, so the value is wrong.` :
    `In denary, ${dv} becomes ${rv}: ${dv} x ${f} = ${rv}. Each place left doubles the value.`;
  else check = loses1(bits, d, n) ? `In denary, ${dv} becomes ${rv}. ${dv} &divide; ${f} = ${dv / f}: the remainder is lost with the bits on the right.` :
    `In denary, ${dv} becomes ${rv}: ${dv} &divide; ${f} = ${rv}. Each place right halves the value.`;
  if (den) out.push({ text: `To give the denary number, add the place values of the 1s: ${sumText(res)} = ${rv}.`, visual: line(kw(`${sumText(res)} = ${rv}`)) });
  out.push({ text: check, visual: line(kw(L ? `x ${f}` : `&divide; ${f}`)) });
  out.push({ text: 'Now do the same for the question. One place at a time: bits that move out are lost, 0s fill the gap. Count 8 bits at the end.', visual: note(`${places(n)} ${d} &nbsp; lost on the ${end} &nbsp; 0s in on the ${side}`) });
  return { title: `Walk me through it: logical ${d} shift`, steps: out };
}
const CARRY_FB = 'Each time a column makes 10 or 11, write 1 above the next column on the left. Type all 8 digits, left to right, 0 where there is no carry.';
const SUM_FB = 'Start at the right. Count the 1s in each column, with any carry. Two 1s: write 0, carry 1. Three 1s: write 1, carry 1.';
const OVER_FB = 'Put the carry out of the 128 column in front of the 8 bits: 9 bits in all.';
const shiftFb = (d) => `Move every bit one place ${d} at a time. Bits pushed out of the register are lost; 0s fill the gap on the ${d === 'left' ? 'right' : 'left'}. Type all 8 bits.`;

// ---------------------------------------------------------------- Do Now: 0478/12 November 2023 Q2(e) (1.7), 0478/11 November 2025 Q1(e) (1.6)
// Mark schemes: 1 0010 1111 (overflow); 1010 0110 with three carries.
const DONOW = [
  { a: '11100011', b: '01001100', ms: '100101111', of: true, ref: '0478/12, November 2023, Question 2(e)', recap: 'Recap of 1.7 Overflow. ',
    lead: 'The number 01001100 is added to 11100011. Add the two 8-bit binary numbers, using binary addition. Give your answer in binary. Show all your working.',
    wt: ['11011010', '01001101'], whyQ: ['Why do we still write every carry when we add?', 'The carries are the working. The mark scheme gives a mark for them.'] },
  { a: '01110110', b: '00110000', ms: '10100110', carries: 3, ref: '0478/11, November 2025, Question 1(e)', recap: 'Recap of 1.6 Binary Addition. ',
    lead: 'Two binary numbers stored in the registers are 01110110 and 00110000. Add the binary numbers using binary addition. Show all your working. Give your answer in binary.',
    wt: ['01011010', '00110110'], whyQ: ['Why must each column wait for the column on its right?', 'The carry from the right is part of that column\'s count of 1s.'] },
];
DONOW.forEach((q, i) => {
  const r = add(q.a, q.b);
  assert(q.of ? r.out === 1 && '1' + r.sum === q.ms : r.out === 0 && r.sum === q.ms && r.count === q.carries, `${q.ref} matches its mark scheme`);
  Object.assign(q, r);
  const id = i ? 'do-now-2' : 'do-now';
  const parts = [{ label: 'Carry row (8 digits: 1 for a carry, 0 for none)', answer: carryAns(q.carry), feedback: CARRY_FB }];
  if (q.of) parts.push({ label: 'The 8 bits the register keeps', answer: binFull(q.sum), feedback: SUM_FB, marks: 2 },
    { label: 'The answer with the overflow bit (9 bits)', answer: binFull('1' + q.sum), feedback: OVER_FB });
  else parts.push({ label: 'Answer in binary', answer: binFull(q.sum), feedback: SUM_FB, marks: 2 });
  steps.push(checkStep(id, `Do Now: Binary Addition (${i + 1} of 2)`, `Do Now: Binary Addition (${i + 1} of 2)`,
    q.recap + cite(q.ref) + ' ' + q.lead, parts, q.whyQ, addTable(q.a, q.b, { done: 0 })));
  steps[steps.length - 1].walkthrough = wtAdd(...q.wt, !!q.of);
});

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-7-overflow', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these overflow cards from 1.7. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Logical Shifts',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Logical Shifts</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> perform a <strong>logical left shift</strong> and a <strong>logical right shift</strong>.', 'State the <strong>effect</strong> of a shift on the denary value.', 'Why the answer goes wrong when a 1 falls off.']) +
    why('Why might a computer move all the bits of a number at once?', 'It is a very fast way to double or halve a number.') });

// ---------------------------------------------------------------- left shift
const EXL = '00010110';
const exl1 = shl(EXL, 1), exl2 = shl(EXL, 2);
assert(val(EXL) === 22 && val(exl1) === 44 && val(exl2) === 88, 'left examples');
steps.push(mcStep('predict-left', 'Predict: Move Every Bit Left', 'Predict: Move Every Bit Left', `${EXL} is 22. Every bit moves 1 place to the left. A 0 fills the gap on the right.`, [
  { prompt: `What are the 8 bits now?`, options: [exl1, shr(EXL, 1), fill1(EXL, 'left', 1)], correct: 0,
    explain: `Each bit moves 1 column left and a 0 comes in on the right: ${exl1}.` },
], ['Why is a bit in the 4 column worth more after it moves 1 place left?', 'The column on its left is the 8 column, which is worth double.'],
  shiftTable(EXL, 'left', 1, { show: false })));

steps.push(concept('concept-left', 'What Is a Logical Left Shift?',
  'Where does the bit in the 128 column go when every bit moves 1 place left?',
  '<p>There is no column to its left. It is pushed out of the register and lost.</p>',
  columns(facts(['A <strong>logical left shift</strong> moves every bit left by the number of places.', 'Bits pushed out on the left are <strong>lost</strong>.',
    '<strong>0s</strong> come in on the right.', 'The leftmost bit (128) is the <strong>most significant bit</strong>. The rightmost bit (1) is the <strong>least significant bit</strong>.']),
    '<div style="display:grid;gap:8px">' + shiftTable(EXL, 'left', 1) + line('A left shift of one place.') + line('The highlighted 0 came in on the right.') + '</div>')));

steps.push(concept('compare-left', 'Compare: Left Shifts and Denary',
  'Why does moving every bit 1 place left double the number?',
  '<p>Every 1 moves to a column worth double, so every part of the total doubles.</p>',
  facts(['Each place left: every bit moves to a column worth <strong>double</strong>.', '1 place: <strong>x 2</strong>. 2 places: <strong>x 4</strong>. 3 places: <strong>x 8</strong>.']) +
  grid([
    box(boxTitle('Start') + monoLine(spaced(EXL)) + boxLine(`${sumText(EXL)} = <strong>${val(EXL)}</strong>`)),
    box(boxTitle('Left shift of one place') + monoLine(spaced(exl1)) + boxLine(`${sumText(exl1)} = <strong>${val(exl1)}</strong>`) + verdict(`${val(EXL)} x 2 = ${val(exl1)}`, true)),
    box(boxTitle('Left shift of two places') + monoLine(spaced(exl2)) + boxLine(`${sumText(exl2)} = <strong>${val(exl2)}</strong>`) + verdict(`${val(EXL)} x 4 = ${val(exl2)}`, true)),
  ], 3)));

// The real shift questions. ans is worked out in code and checked against the mark scheme value ms.
const EX = {
  mar26: { bits: '00110101', d: 'left', n: 2, ms: '11010100', ref: '0478/12, March 2026, Question 6(c)', wt: '00101011',
    lead: 'Give the 8-bit binary value after a logical binary shift left of two places is performed on the binary number 00110101.' },
  jun24: { bits: '10100011', d: 'left', n: 3, ms: '00011000', ref: '0478/11, June 2024, Question 3(a)', wt: '01100101',
    lead: 'The binary number 10100011 is stored. A logical left shift of three places is performed on the binary number. Give the 8-bit binary number that will be stored after the shift has taken place.' },
  jun23c: { bits: '10101110', d: 'left', n: 3, ms: '01110000', ref: '0478/13, June 2023, Question 1(c)(i)', wt: '11010110',
    lead: 'Computers store data as binary. The binary number 10101110 is stored. A logical left shift of three places is performed on the binary number. Give the 8-bit binary number that would be stored after this logical left shift.' },
  nov23: { bits: '11100011', d: 'left', n: 2, ms: '10001100', ref: '0478/12, November 2023, Question 2(c)', wt: '11010011',
    lead: 'A register stores the binary number 11100011. A logical left shift of two places is performed on the binary number stored in the register. Complete the binary register to show its contents after this logical left shift.' },
  jun25: { bits: '10100100', d: 'right', n: 2, ms: '00101001', ref: '0478/13, June 2025, Question 1(c)(iii)', wt: '11001000',
    lead: 'A logical right shift of two places is performed on the binary number 10100100. Give the binary number that would be stored after the logical shift has taken place.' },
  nov24: { bits: '01111001', d: 'right', n: 2, ms: '00011110', ref: '0478/11, November 2024, Question 3(c)(iii)', wt: '01101101',
    lead: 'A logical right shift of two places is performed on the binary number 01111001. Give the binary number after the logical right shift of two places is performed.' },
  jun23b: { bits: '01111010', d: 'right', n: 3, ms: '00001111', ref: '0478/12, June 2023, Question 2(b)(i)', wt: '01011100',
    lead: 'A value is stored as a binary number in a register. A logical right shift of three places is performed on the binary number. Complete the binary register to show its contents after this logical right shift.' },
  nov25: { bits: '11110101', d: 'right', n: 3, ms: '00011110', msDen: 30, ref: '0478/12, November 2025, Question 2(b)', wt: '11011011',
    lead: 'A logic right shift of three places is performed on the binary number 11110101. Give the denary number for the binary number that would be stored after the logical shift of three places has occurred. Show all of your working.' },
};
Object.values(EX).forEach((q) => {
  q.ans = shift(q.bits, q.d, q.n);
  assert(q.ans === q.ms, `${q.ref}: ${q.ans} is not the mark scheme's ${q.ms}`);
  if (q.msDen) assert(val(q.ans) === q.msDen, `${q.ref} denary`);
  q.wtAns = shift(q.wt, q.d, q.n);
});
assert(!loses1(EX.mar26.bits, 'left', 2) && val(EX.mar26.ans) === val(EX.mar26.bits) * 4, 'March 2026 is x 4');
const SH_WHYS = {
  mar26: ['Why is it safer to move the bits one place at a time?', 'Each move is small, so it is easy to see which bit is lost and where the 0 goes.'],
  jun24: ['Why must the answer still have exactly 8 bits?', 'The register has a fixed number of bits. Bits that move out are lost and 0s fill the gap.'],
  jun23c: ['Why do we write the bits under their place values first?', 'Then we can see which bits will move out of the register.'],
  nov23: ['Why can a 0 that comes in never add to the value?', 'A 0 in any column is worth nothing.'],
  jun25: ['Why does moving a bit one place right halve what it is worth?', 'The column on its right is worth half as much.'],
  nov24: ['Why does the shift happen to every bit, not just one?', 'The whole number moves together, so every bit keeps its order.'],
  jun23b: ['Why should you count the bits in your answer?', 'An 8-bit register always holds exactly 8 bits.'],
  nov25: ['Why do we shift the bits before converting to denary?', 'The question asks for the number stored after the shift.'],
};
function shiftStep(key, i, total, title) {
  const q = EX[key], id = `exam-${i}`;
  steps.push(checkStep(id, `Exam Question: ${title} (${i} of ${total})`, `Exam Question: ${title}`,
    cite(q.ref) + ' ' + q.lead, [{ label: 'The 8 bits after the shift', answer: binFull(q.ans), feedback: shiftFb(q.d) }],
    SH_WHYS[key], bitTable(q.bits)));
  steps[steps.length - 1].walkthrough = wtShift(q.wt, q.d, q.n);
}
const NEX = 8;
shiftStep('mar26', 1, NEX, 'Logical Left Shift');

// 0478/11 June 2024 Q3(b). Mark scheme: D.
steps.push(mcStep('exam-mc-1', 'Exam Question: The Effect of a Left Shift', 'Exam Question: The Effect of a Left Shift',
  cite('0478/11, June 2024, Question 3(b)') + ' The binary number 10100011 is stored. Tick one box to show which statement about a logical left shift of two places is correct.', [
    { prompt: 'Which statement about a logical left shift of two places is correct?', options: ['It would divide the binary number by 2.', 'It would multiply the binary number by 2.',
      'It would divide the binary number by 4.', 'It would multiply the binary number by 4.'], correct: 3,
    explain: 'Each place left doubles the value. Two places: x 2 x 2 = x 4.' },
  ], ['Why does a left shift of three places multiply by 8, not by 3?', 'Each place doubles the value: 2 x 2 x 2 = 8.']));

steps.push(embed('activity-1', 'Activity 1: Shift Left', 'drill-y11-1-8-left', 'Activity 1: Shift Left',
  'Shift the bits left, then find the denary value. Get each card right 3 times in a row.',
  ['Why can you check a left shift in denary?', 'Each place left doubles the value, so you can compare the two denary numbers.']));

// ---------------------------------------------------------------- when a 1 falls off
const EXB = '10010110';
const exb = shl(EXB, 1);
assert(val(EXB) === 150 && exb === exl1 && val(exb) === 44, '150 shifted left');
steps.push(mcStep('predict-lost', 'Predict: Does It Always Double?', 'Predict: Does It Always Double?', `${EXB} is 150. A logical left shift of one place is performed.`, [
  { prompt: 'Is the new denary value 300?', options: ['Yes, a left shift always doubles', 'No, the left 1 is lost', 'No, it halves to 75'], correct: 1,
    explain: `300 needs more than 8 bits. The 1 in the 128 column is pushed out and lost, so the register holds ${exb} = ${val(exb)}.` },
], ['Why does a bit in the 64 column end up in the 128 column after a left shift of one place?', 'Every bit moves 1 column left, and the column left of 64 is 128.'],
  shiftTable(EXB, 'left', 1, { show: false })));

steps.push(concept('compare-lost', 'Compare: When a 1 Falls Off',
  '22 and 150 give the same 8 bits after a left shift of one place. Why?',
  '<p>They differ only in the 128 column. That bit is lost in the shift, so the rest is the same.</p>',
  facts(['If a <strong>1</strong> is shifted out, the <strong>most significant bits are lost</strong> and the answer is <strong>wrong</strong>.', 'It only doubles when the bits that fall off are all 0s.']) +
  columns(box(boxTitle(`22: no 1 lost`) + shiftTable(EXL, 'left', 1, { label: false }) + boxLine(`22 x 2 = <strong>${val(exl1)}</strong>`) + verdict('Right: it doubled.', true)),
    box(boxTitle(`150: a 1 is lost`) + shiftTable(EXB, 'left', 1, { label: false }) + boxLine(`150 x 2 = 300, but the register holds <strong>${val(exb)}</strong>`) + verdict('Wrong: the 1 fell off.', false)))));

shiftStep('jun23c', 2, NEX, 'Logical Left Shift');

// 0478/13 June 2023 Q1(c)(ii). Mark scheme: B.
steps.push(mcStep('exam-mc-2', 'Exam Question: The Impact of a Left Shift', 'Exam Question: The Impact of a Left Shift',
  cite('0478/13, June 2023, Question 1(c)(ii)') + ' A logical left shift of three places is performed on the binary number 10101110. Tick one box to show which statement is true about the impact the logical left binary shift would have on the binary number.', [
    { prompt: 'Which statement is true about the impact of this logical left shift?', options: ['The least significant bits are lost.', 'The most significant bits are lost.',
      'The number has been divided by six.', 'The number stays the same.'], correct: 1,
    explain: 'In a left shift the bits on the left are pushed out. The leftmost bits are the most significant bits.' },
  ], ['Why does the number of places not tell you what to divide or multiply by?', 'Each place doubles or halves, so you multiply 2s together, one per place.']));

shiftStep('jun24', 3, NEX, 'Logical Left Shift');
shiftStep('nov23', 4, NEX, 'Logical Left Shift');

// ---------------------------------------------------------------- right shift
const EXR = '01011000';
const exr1 = shr(EXR, 1), exr2 = shr(EXR, 2);
assert(val(EXR) === 88 && val(exr1) === 44 && val(exr2) === 22, 'right examples');
steps.push(mcStep('predict-right', 'Predict: Move Every Bit Right', 'Predict: Move Every Bit Right', `${EXR} is 88. Every bit moves 1 place to the right. A 0 fills the gap on the left.`, [
  { prompt: 'What are the 8 bits now?', options: [exr1, shl(EXR, 1), fill1(EXR, 'right', 1)], correct: 0,
    explain: `Each bit moves 1 column right and a 0 comes in on the left: ${exr1}.` },
], ['Why is a bit worth less after it moves 1 place to the right?', 'The column on its right is worth half as much.'],
  shiftTable(EXR, 'right', 1, { show: false })));

steps.push(concept('concept-right', 'What Is a Logical Right Shift?',
  'A left shift multiplies by 2 for each place. What would you expect a right shift to do, and why?',
  '<p>Divide by 2 for each place: every bit moves to a column worth half as much.</p>',
  columns(facts(['A <strong>logical right shift</strong> moves every bit right by the number of places.', 'Bits pushed out on the right are <strong>lost</strong>.',
    '<strong>0s</strong> come in on the left.', 'Each place right <strong>divides by 2</strong>: 1 place &divide; 2, 2 places &divide; 4, 3 places &divide; 8.']),
    '<div style="display:grid;gap:8px">' + shiftTable(EXR, 'right', 1) + line(`${val(EXR)} &divide; 2 = <strong>${val(exr1)}</strong>`) +
    line(`Two places: ${spaced(exr2)} = ${val(EXR)} &divide; 4 = <strong>${val(exr2)}</strong>`) + '</div>')));

const EXO = '00010111';
const exo = shr(EXO, 1);
assert(val(EXO) === 23 && exo === shr(EXL, 1) && val(exo) === 11, 'odd right shift');
steps.push(concept('compare-remainder', 'Compare: An Odd Number Shifted Right',
  '22 and 23 give the same 8 bits after a right shift of one place. Why?',
  '<p>They differ only in the 1 column. That bit is lost in the shift, so the rest is the same.</p>',
  facts(['If a <strong>1</strong> is shifted out on the right, the <strong>remainder is lost</strong>: the answer is not exact.', 'The right most bits are lost, so the value becomes inaccurate.']) +
  columns(box(boxTitle('22: no 1 lost') + shiftTable(EXL, 'right', 1, { label: false }) + boxLine(`22 &divide; 2 = <strong>${val(shr(EXL, 1))}</strong>`) + verdict('Exact.', true)),
    box(boxTitle('23: a 1 is lost') + shiftTable(EXO, 'right', 1, { label: false }) + boxLine(`23 &divide; 2 = 11.5, but the register holds <strong>${val(exo)}</strong>`) + verdict('Not exact: the remainder is lost.', false)))));

shiftStep('jun25', 5, NEX, 'Logical Right Shift');
shiftStep('nov24', 6, NEX, 'Logical Right Shift');

steps.push(embed('activity-2', 'Activity 2: Shift Left or Right', 'drill-y11-1-8-shift', 'Activity 2: Shift Left or Right',
  'Left and right shifts, with 1s that fall off. Find the bits, the denary value and the effect. Most numbers come from real exam papers.',
  ['Why does a shift that loses a 1 give the wrong answer?', 'The lost 1 was part of the value, and nothing keeps it.']));

// ---------------------------------------------------------------- stating the effect
steps.push(concept('concept-effect', 'Compare: Stating the Effect',
  'Why is "the number gets smaller" not enough for a right shift of three places?',
  '<p>It does not say by how much. The mark scheme wants the operation and the number: divided by 8.</p>',
  facts(['Left shift of <em>n</em> places: <strong>multiplied by 2</strong> for each place (2, 4, 8, 16).', 'Right shift of <em>n</em> places: <strong>divided by 2</strong> for each place (2, 4, 8, 16).',
    'If a 1 is shifted out, the bits are lost and the value becomes <strong>incorrect</strong>.']) +
  grid([
    box(boxTitle('Ana') + boxLine('"It is divided by 8."') + verdict('1 mark: the operation and the number.', true)),
    box(boxTitle('Lee') + boxLine('"It gets smaller."') + verdict('0 marks: by how much?', false)),
    box(boxTitle('Sam') + boxLine('"It is divided by 3."') + verdict('0 marks: 3 is the places.', false)),
  ], 3)));

shiftStep('jun23b', 7, NEX, 'Logical Right Shift');

// 0478/12 June 2023 Q2(b)(ii). Mark scheme: any one from: the value becomes incorrect/inaccurate as the right most bits
// are lost; it is divided by 8.
steps.push(written('exam-effect-1', 'Exam Question: State the Effect (1 of 3)',
  cite('0478/12, June 2023, Question 2(b)(ii)') + ' A logical right shift of three places is performed on the binary number 01111010 in a register.', [
    { id: 'effect-right-3', prompt: 'State one effect this logical shift has on the binary number.', marks: 1,
      scheme: ['The value becomes incorrect / inaccurate as the right most bits are lost', 'It is divided by 8'],
      guidance: 'Any one from the list, 1 mark. "Divided" alone, without the 8, earns no mark. Do not accept divided by 3.',
      modelAnswer: 'It is divided by 8.' },
  ], ['Why does a 1-mark "state" question need only one point?', 'One correct point earns the one mark.']));

{
  const q = EX.nov25;
  const WORK = '^\\s*(16\\s*\\+\\s*8\\s*\\+\\s*4\\s*\\+\\s*2|2\\s*\\+\\s*4\\s*\\+\\s*8\\s*\\+\\s*16)(\\s*=\\s*30)?\\s*\\.?\\s*$';
  assert(sumText(q.ans) === '16 + 8 + 4 + 2', 'November 2025 working');
  steps.push(checkStep('exam-8', `Exam Question: Shift, Then Denary (8 of ${NEX})`, 'Exam Question: Shift, Then Denary',
    cite(q.ref) + ' ' + q.lead, [
      { label: 'The 8 bits after the shift', answer: binFull(q.ans), feedback: shiftFb('right') },
      { label: 'Working: the place values of the 1s, added', answer: WORK, feedback: 'Write the place value over each 1 in your shifted bits, then add them with + signs.' },
      { label: 'Denary number', answer: numFull(val(q.ans)), feedback: 'Add the place values of the 1s in the shifted bits.' },
    ], SH_WHYS.nov25, bitTable(q.bits)));
  steps[steps.length - 1].walkthrough = wtShift(q.wt, q.d, q.n, { den: true });
}

// 0478/12 March 2024 Q8(c). Mark scheme: one mark each: divide; ... by 16 / 2^4.
steps.push(written('exam-effect-2', 'Exam Question: State the Effect (2 of 3)',
  cite('0478/12, March 2024, Question 8(c)') + ' Logical shifts are performed on binary integers.', [
    { id: 'effect-right-4', prompt: 'State the mathematical effect of a right shift of four places on a positive binary integer.', marks: 2,
      scheme: ['Divide', '... by 16 / 2^4'],
      guidance: 'One mark each. The second mark follows on from the first: "by 16" or "by 2 to the power 4" only earns it with divide. Do not accept divided by 4.',
      modelAnswer: 'It is divided by 16.' },
  ], ['Why is the answer for one place right not the answer for four places?', 'Each place halves again, so the divisor doubles with every place.']));

// 0478/12 November 2024 Q3(d). Mark scheme: (i) any two from: each/all/every bit in the binary number is shifted/moved
// to the left; the left most/most significant bit is lost; a 0 is added as the right most/least significant bit.
// (ii) the binary integer is multiplied by 2.
steps.push(written('exam-effect-3', 'Exam Question: Describe a Left Shift (3 of 3)',
  cite('0478/12, November 2024, Question 3(d)') + ' A binary integer that is stored in a register in the computer has a logical left shift performed on it.', [
    { id: 'describe-left', prompt: '(i) Describe the process of the logical left shift that is performed on the binary integer.', marks: 2,
      scheme: ['Each / all / every value / digit / bit in the binary number is shifted / moved to the left', 'The left most / most significant bit is lost', 'A 0 is added as the right most / least significant bit'],
      guidance: 'Any two from the list, one mark each. The answer describes what happens to the bits, not the effect on the value.',
      modelAnswer: 'Every bit moves left. The leftmost bit is lost.' },
    { id: 'effect-left', prompt: '(ii) State what effect this will have on the binary integer.', marks: 1,
      scheme: ['The binary integer is multiplied by 2'],
      guidance: '1 mark for multiplied by 2 (doubled). "It gets bigger" alone earns no mark.',
      modelAnswer: 'It is multiplied by 2.' },
  ], ['Why are "describe the process" and "state the effect" different questions?', 'The process is what the bits do. The effect is what happens to the value.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Logical Shifts Drill', 'drill-y11-1-8-shifts', 'Plenary: Logical Shifts Drill',
  'Left and right shifts, the denary value, when a 1 is lost, and the effect in mark-scheme words. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
DONOW.forEach((q, i) => {
  const id = i ? 'do-now-2' : 'do-now';
  ok(id, 0, [q.carry, q.carry.slice(0, 7), spaced(q.carry)], [xor(q.a, q.b), q.sum, '00000000'].filter((x) => x !== q.carry));
  ok(id, 1, [q.sum, spaced(q.sum), q.sum + ' in binary'], [xor(q.a, q.b), String(val(q.sum)), q.sum.slice(1), '1' + q.sum]);
  if (q.of) ok(id, 2, ['1' + q.sum, sp9('1' + q.sum)], [q.sum, '0' + q.sum]);
});
const SHIFT_IDS = { mar26: 'exam-1', jun23c: 'exam-2', jun24: 'exam-3', nov23: 'exam-4', jun25: 'exam-5', nov24: 'exam-6', jun23b: 'exam-7', nov25: 'exam-8' };
Object.entries(SHIFT_IDS).forEach(([k, id]) => {
  const q = EX[k], s = steps.find((x) => x.id === id);
  assert(s && s.walkthrough, `${id} exists`);
  const wrong = [q.bits, shift(q.bits, other(q.d), q.n), shift(q.bits, q.d, q.n + 1), shift(q.bits, q.d, q.n - 1), fill1(q.bits, q.d, q.n), rot(q.bits, q.d, q.n)].filter((x) => x !== q.ans);
  ok(id, 0, [q.ans, spaced(q.ans), q.ans + ' in binary', ' ' + q.ans + '.'], wrong);
  // The walkthrough is a different register with a different answer, and its text never shows this answer.
  [q.wt, q.wtAns].forEach((b) => assert(b !== q.bits && b !== q.ans && !Object.values(EX).some((x) => x.ans === b || x.bits === b), `${id} walkthrough value ${b}`));
  const d = plain(JSON.stringify(s.walkthrough.steps.map((x) => x.text))).replace(/(?<=[01]) (?=[01])/g, '');
  assert(!d.includes(q.ans), `${id} walkthrough text shows the answer`);
  assert(s.walkthrough.steps.length >= 6, `${id} walkthrough is step by step`);
});
ok('exam-8', 1, ['16 + 8 + 4 + 2', '16+8+4+2', '2 + 4 + 8 + 16', '16 + 8 + 4 + 2 = 30'], ['16 + 8 + 4', '30', '8 + 4 + 2 + 1', '128 + 64 + 32 + 16']);
ok('exam-8', 2, ['30', '= 30', '30 in denary'], ['31', '300', '00011110', '3']);
function plain(h) { return h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' '); }
steps.filter((s) => s.walkthrough).forEach((s) => {
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
DONOW.forEach((q) => {
  const [a, b] = q.wt, e = add(a, b);
  [a, b, e.sum, e.carry].forEach((row) => assert(row !== q.sum && row !== q.carry && row !== q.a && row !== q.b, `walkthrough row ${row} for ${q.ref}`));
  const s = steps.find((x) => x.walkthrough && x.validatorKey && V(x.id)[0].pattern.source === carryAns(q.carry));
  const d = plain(JSON.stringify(s.walkthrough.steps.map((x) => x.text))).replace(/(?<=[01]) (?=[01])/g, '');
  assert(!d.includes(q.sum) && !d.includes(q.carry), `${q.ref} walkthrough text shows the answer or carry row`);
  assert(e.count >= 3 && e.out === (q.of ? 1 : 0), `walkthrough pair ${a} + ${b}`);
});
{
  const qs = Object.values(EX).flatMap((q) => [q.bits, q.ans]);
  [EXL, exl1, exl2, EXB, EXR, exr1, exr2, EXO, exo].forEach((b) => assert(!qs.includes(b), `example ${b} is also in a question`));
}
// No term before the slide that teaches it (the title slide only names today's topic). Later or off-syllabus terms never.
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/\blogical\b/i, 'concept-left'], [/most significant|least significant/i, 'concept-left'], [/right shift|shift(ed|s)? right|shift of \w+ places? right/i, 'concept-right'],
    [/two.s complement|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex|\bRAM\b|circulat|LSHIFT|RSHIFT|precision|random access/i, null]];
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
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

// ---------------------------------------------------------------- drills
const C = (r) => `From Cambridge IGCSE ${r}.`;
const REAL_DRILL = Object.values(EX).map((q) => [q.bits, q.d, q.n, C(q.ref)]);
const INJECT = { REAL: REAL_DRILL };
const drillHead = (id, about) => `// Year 11, 1.8: Logical Shifts. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_8_shifts.mjs: edit that, then run it.\n`;

// ---- All three drills share these helpers (the function is copied whole by toString()).
function shCards(which) {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function val(b) { return parseInt(b, 2); }
  function bin8(n) { return pad(n.toString(2), 8); }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function shift(b, d, n) { return d === "left" ? b.slice(n) + "00000000".slice(0, n) : "00000000".slice(0, n) + b.slice(0, 8 - n); }
  function lost(b, d, n) { return d === "left" ? b.slice(0, n) : b.slice(8 - n); }
  function loses1(b, d, n) { return lost(b, d, n).indexOf("1") >= 0; }
  function ones(b) { return b.split("1").length - 1; }
  function other(d) { return d === "left" ? "right" : "left"; }
  function sumText(b) { var out = []; for (var i = 0; i < 8; i++) if (b[i] === "1") out.push(Math.pow(2, 7 - i)); return out.length ? out.join(" + ") : "0"; }
  var WORDS = ["zero", "one", "two", "three", "four"];
  function places(n) { return WORDS[n] + " place" + (n === 1 ? "" : "s"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*\\.?\\s*$", "i"); }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?denary)?\\s*\\.?\\s*$", "i"); }
  var YES = /^\s*(yes|y|yes,?\s*exactly|yes,?\s*it\s+is)\s*\.?\s*$/i;
  var NO = /^\s*(no|n|no,?\s*not\s+exactly|no,?\s*it\s+is\s+not|no,?\s*a\s+1\s+is\s+lost)\s*\.?\s*$/i;
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var REAL = [] /*REAL*/;
  // d: "left", "right" or undefined (either). safe: true = no 1 is lost, false = a 1 is lost, undefined = either.
  function pick(d, safe, maxN) {
    var list = REAL.filter(function (r) { return (!d || r[1] === d) && (safe === undefined || loses1(r[0], r[1], r[2]) !== safe); });
    if (list.length && Math.random() < 0.5) { var r = drillPick(list); return { b: r[0], d: r[1], n: r[2], src: " " + r[3] }; }
    var dd = d || (Math.random() < 0.5 ? "left" : "right"), n, b;
    do { n = rnd(1, maxN || 3); b = bin8(rnd(5, 250)); } while ((safe !== undefined && loses1(b, dd, n) === safe) || ones(b) < 3 || ones(shift(b, dd, n)) < 1);
    return { b: b, d: dd, n: n, src: "" };
  }
  function side(d) { return d === "left" ? "right" : "left"; }
  function shiftNote(p, r) { return p.b + " shifted " + places(p.n) + " " + p.d + " is " + sp(r) + ". The bits " + lost(p.b, p.d, p.n) + " on the " + p.d + " are lost and 0s come in on the " + side(p.d) + "."; }
  function bitsCard(p) {
    var r = shift(p.b, p.d, p.n), re = binRe(r);
    var fill = p.d === "left" ? p.b.slice(p.n) + "1111".slice(0, p.n) : "1111".slice(0, p.n) + p.b.slice(0, 8 - p.n);
    return { prompt: "A logical " + p.d + " shift of " + places(p.n) + " is performed on " + p.b + ". Give the 8 bits stored after the shift.", answers: [sp(r)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, [shift(p.b, other(p.d), p.n), shift(p.b, p.d, p.n === 1 ? 2 : p.n - 1), fill, p.b]),
      working: ["Move every bit " + places(p.n) + " to the " + p.d + ", one place at a time.", "Bits pushed out of the register are lost. Fill the gap on the " + side(p.d) + " with zeros."],
      note: shiftNote(p, r) + p.src };
  }
  function denCard(p) {
    var r = shift(p.b, p.d, p.n), v = val(r), D = val(p.b), f = Math.pow(2, p.n);
    var cands = p.d === "left" ? [D * f, D * p.n, Math.floor(D / f), v + f] : [Math.ceil(D / f), D * f, Math.floor(D / p.n), v + 1];
    var lostTxt = p.d === "left" ? (loses1(p.b, p.d, p.n) ? " A 1 was lost, so this is not " + D + " x " + f + " = " + (D * f) + "." : " " + D + " x " + f + " = " + v + ".") :
      (loses1(p.b, p.d, p.n) ? " " + D + " / " + f + " = " + (D / f) + ": the remainder is lost." : " " + D + " / " + f + " = " + v + ".");
    return { prompt: "The denary number " + D + " is stored as the 8-bit binary number " + p.b + ". A logical " + p.d + " shift of " + places(p.n) + " is performed. What denary number is stored now?",
      answers: [String(v)], keywords: [num(v)], distractors: drillWrongNumbers(v, cands, 3),
      working: ["Shift the bits first: every bit moves " + places(p.n) + " " + p.d + ", zeros fill the gap.", "Add the place values of the 1s in the new 8 bits."],
      note: shiftNote(p, r) + " " + sumText(r) + " = " + v + "." + lostTxt + p.src };
  }
  function byCard(d, n) {
    var f = Math.pow(2, n), op = d === "left" ? "multiplied" : "divided";
    return { prompt: "A logical " + d + " shift of " + places(n) + " is performed on a positive binary integer and no 1s are lost. The denary value is " + op + " by what number?",
      answers: [String(f)], keywords: [num(f)], distractors: drillWrongNumbers(f, [n, f * 2, f / 2 === 1 ? 3 : f / 2, n + 1], 3),
      working: ["Each place " + d + " " + (d === "left" ? "doubles" : "halves") + " the value.", "Do it once for each place: multiply the 2s together."],
      note: places(n) + " " + d + ": " + op + " by 2 for each place, so by " + f + "." };
  }
  function effRe(d, n) {
    var f = Math.pow(2, n), words = { 2: "two", 4: "four", 8: "eight", 16: "sixteen" };
    var op = d === "left" ? "(multipl(y|ied|ies)|times|x|\\*|×)" : "(divid(e|ed|es)|÷|\\/)";
    var numAlt = "(" + f + "|" + words[f] + "|2\\s*(\\^|to\\s+the\\s+power(\\s+of)?)\\s*" + n + ")";
    return new RegExp("^\\s*((it|the\\s+(binary\\s+)?(number|value|integer|denary\\s+value))\\s+(is|will\\s+be|gets|has\\s+been)\\s+)?" + op + "\\s*(by\\s*)?" + numAlt + "\\s*\\.?\\s*$", "i");
  }
  function effectCard(d, n) {
    var f = Math.pow(2, n), mul = d === "left", ans = (mul ? "Multiplied by " : "Divided by ") + f, re = effRe(d, n);
    return { prompt: "State the effect of a logical " + d + " shift of " + places(n) + " on a positive binary integer. No 1s are lost.", answers: [ans], keywords: [re], format: "Type the effect, for example: Multiplied by 32",
      distractors: uniq(re, [(mul ? "Divided by " : "Multiplied by ") + f, (mul ? "Multiplied by " : "Divided by ") + (f * 2), (mul ? "Multiplied by " : "Divided by ") + (n === 2 ? 2 : n), (mul ? "Multiplied by " : "Divided by ") + (n === 1 ? 4 : f / 2)]),
      working: [(mul ? "Left: each place multiplies by 2." : "Right: each place divides by 2."), "Say the operation and the number: multiply the 2s together, one per place."],
      note: "Mark scheme words: " + (mul ? "multiplied" : "divided") + " by " + f + " (2 for each of the " + places(n) + ")." };
  }
  function ynCard(p) {
    var r = shift(p.b, p.d, p.n), D = val(p.b), v = val(r), f = Math.pow(2, p.n), ok = !loses1(p.b, p.d, p.n);
    var opTxt = p.d === "left" ? D + " x " + f : D + " divided by " + f;
    return { prompt: "A logical " + p.d + " shift of " + places(p.n) + " is performed on " + p.b + " (" + D + "). Is the new value exactly " + (p.d === "left" ? "the old value multiplied by " : "the old value divided by ") + f + "? Type yes or no.",
      answers: [ok ? "yes" : "no"], keywords: [ok ? YES : NO], distractors: [ok ? "no" : "yes"],
      working: ["Look at the bits that are pushed out of the register.", "Exact only if every bit that falls off is a 0."],
      note: shiftNote(p, r) + " " + (ok ? "Only 0s were lost: " + opTxt + " = " + v + "." : "A 1 was lost, so " + v + " is not " + opTxt + " exactly.") + p.src };
  }
  function why(id, prompt, answer, distractors, note, working) { return { id: id, category: "pl-why", prompt: prompt, answers: [answer], distractors: distractors, note: note, working: working, pickThenType: true }; }
  function ranD() { return Math.random() < 0.5 ? "left" : "right"; }
  if (which === "left") return [
    { id: "lf-01", category: "lf-bits", randomize: function () { var p = pick("left", true); return bitsCard(p); } },
    { id: "lf-02", category: "lf-bits", randomize: function () { return bitsCard({ b: pick("left", true, 1).b, d: "left", n: 1, src: "" }); } },
    { id: "lf-03", category: "lf-bits", randomize: function () { return bitsCard(pick("left", true)); } },
    { id: "lf-04", category: "lf-den", randomize: function () { return denCard(pick("left", true)); } },
    { id: "lf-05", category: "lf-den", randomize: function () { return denCard(pick("left", true)); } },
    { id: "lf-06", category: "lf-den", randomize: function () { return byCard("left", rnd(1, 4)); } }
  ];
  if (which === "shift") return [
    { id: "sh-01", category: "sh-bits", randomize: function () { return bitsCard(pick("left", false)); } },
    { id: "sh-02", category: "sh-bits", randomize: function () { return bitsCard(pick("right")); } },
    { id: "sh-03", category: "sh-bits", randomize: function () { return bitsCard(pick()); } },
    { id: "sh-04", category: "sh-den", randomize: function () { return denCard(pick("right")); } },
    { id: "sh-05", category: "sh-den", randomize: function () { return denCard(pick("left", false)); } },
    { id: "sh-06", category: "sh-lost", randomize: function () { return ynCard(pick("left", Math.random() < 0.5)); } },
    { id: "sh-07", category: "sh-lost", randomize: function () { return ynCard(pick("right", Math.random() < 0.5)); } },
    { id: "sh-08", category: "sh-lost", randomize: function () { return effectCard(ranD(), rnd(1, 4)); } }
  ];
  return [
    // ================================================= Left shifts
    { id: "pl-01", category: "pl-left", randomize: function () { return bitsCard(pick("left", true)); } },
    { id: "pl-02", category: "pl-left", randomize: function () { return bitsCard(pick("left", false)); } },
    { id: "pl-03", category: "pl-left", randomize: function () { return denCard(pick("left", true)); } },
    { id: "pl-04", category: "pl-left", randomize: function () { return denCard(pick("left", false)); } },
    // ================================================= Right shifts
    { id: "pl-05", category: "pl-right", randomize: function () { return bitsCard(pick("right")); } },
    { id: "pl-06", category: "pl-right", randomize: function () { return bitsCard(pick("right")); } },
    { id: "pl-07", category: "pl-right", randomize: function () { return denCard(pick("right")); } },
    // ================================================= The effect
    { id: "pl-08", category: "pl-effect", randomize: function () { return ynCard(pick(undefined, Math.random() < 0.5)); } },
    { id: "pl-09", category: "pl-effect", randomize: function () { return effectCard("left", rnd(1, 4)); } },
    { id: "pl-10", category: "pl-effect", randomize: function () { return effectCard("right", rnd(1, 4)); } },
    { id: "pl-11", category: "pl-effect", randomize: function () { return byCard(ranD(), rnd(1, 4)); } },
    // ================================================= Why
    why("pl-12", "Why does a logical left shift of one place multiply the value by 2?", "Every bit moves to a column worth double",
      ["A 0 is added to the denary number", "The register gets one more bit", "The leftmost bit is copied twice"],
      "Each column is worth double the column on its right, so every 1 is worth double after the shift.", ["Compare each place value with the one on its left.", "What happens to the value of every 1?"]),
    why("pl-13", "Why can a logical left shift give a wrong answer?", "A 1 is shifted out of the register and lost",
      ["The 0s that come in are worth something", "The bits move the wrong way round", "The register adds a carry to the bits"],
      "The register keeps only 8 bits. A 1 pushed out on the left is lost, so the value is not doubled.", ["Which bits leave the register in a left shift?", "What if one of them is a 1?"]),
    why("pl-14", "Why is a right shift of an odd number not exact?", "The 1 in the 1 column is shifted out and lost",
      ["The 0 that comes in is worth 1", "Odd numbers cannot be stored in 8 bits", "The bits are added in the wrong order"],
      "An odd number has a 1 in the 1 column. A right shift pushes it out, so the remainder is lost.", ["Which column makes a number odd?", "Where does that bit go in a right shift?"])
  ];
}
const DRILLS = [
  ['y11-1-8-left', 'Activity 1: logical left shifts with no 1 lost, the bits and the denary value.',
    'Year 11, 1.8: Shift Left', 'Cambridge IGCSE Computer Science 0478',
    [['lf-bits', 'Shift the Bits'], ['lf-den', 'The Denary Value']], 'left'],
  ['y11-1-8-shift', 'Activity 2: left and right shifts, lost bits, the denary value and the effect.',
    'Year 11, 1.8: Shift Left or Right', 'Cambridge IGCSE Computer Science 0478',
    [['sh-bits', 'Shift the Bits'], ['sh-den', 'The Denary Value'], ['sh-lost', 'Lost Bits and the Effect']], 'shift'],
  ['y11-1-8-shifts', 'Plenary: left and right shifts, the denary value, lost bits and the effect.',
    'Year 11, 1.8: Logical Shifts', 'Cambridge IGCSE Computer Science 0478',
    [['pl-left', 'Left Shifts'], ['pl-right', 'Right Shifts'], ['pl-effect', 'The Effect'], ['pl-why', 'Why It Happens']], 'plenary'],
];
for (const [id, about, title, subtitle, cats, which] of DRILLS) {
  let body = shCards.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  const src = drillHead(id, about) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${body})(${JSON.stringify(which)})\n});\n`;
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  { const bad = /two.s complement|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b|\bRAM\b|circulat|precision/i.exec(src.split(id).join('')); assert(!bad, `drill ${id} names a later term: ${bad}`); }
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes and is right, no distractor passes, and no working step gives it away.
{
  const vm = await import('node:vm');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const NW = { one: 1, two: 2, three: 3, four: 4 };
  const sh = (b, d, n) => shift(b, d, n);
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
        if ((m = /^A logical (left|right) shift of (\w+) places? is performed on ([01]{8})\. Give the 8 bits/.exec(r.prompt))) assert(bare === sh(m[3], m[1], NW[m[2]]), `${id} ${card.id}: bits ${r.prompt} ${ans}`);
        if ((m = /denary number (\d+) is stored as the 8-bit binary number ([01]{8})\. A logical (left|right) shift of (\w+) place/.exec(r.prompt))) assert(val(m[2]) === +m[1] && +ans === val(sh(m[2], m[3], NW[m[4]])), `${id} ${card.id}: den ${r.prompt} ${ans}`);
        if ((m = /shift of (\w+) places? is performed on a positive binary integer and no 1s are lost/.exec(r.prompt))) assert(+ans === 2 ** NW[m[1]], `${id} ${card.id}: by ${ans}`);
        if ((m = /^State the effect of a logical (left|right) shift of (\w+) place/.exec(r.prompt))) {
          const f = 2 ** NW[m[2]];
          assert(ans === (m[1] === 'left' ? 'Multiplied by ' : 'Divided by ') + f, `${id} ${card.id}: effect ${ans}`);
          (m[1] === 'left' ? [`multiplied by ${f}`, `It is multiplied by ${f}`, `x ${f}`, `times ${f}`, `multiply by 2^${NW[m[2]]}`] : [`divided by ${f}`, `It is divided by ${f}`, `÷ ${f}`, `divide by ${f}`, `/${f}`]).forEach((v) => assert(pass(v), `${id} ${card.id}: effect variant "${v}" fails`));
          [`It gets ${m[1] === 'left' ? 'bigger' : 'smaller'}`, `${m[1] === 'left' ? 'multiplied' : 'divided'} by ${NW[m[2]] === 2 ? 3 : NW[m[2]]}`, `${m[1] === 'left' ? 'multiplied' : 'divided'} by ${f}0`].forEach((v) => assert(!pass(v), `${id} ${card.id}: effect "${v}" passes`));
        }
        if ((m = /^A logical (left|right) shift of (\w+) places? is performed on ([01]{8}) \((\d+)\)\. Is the new value exactly/.exec(r.prompt))) {
          const b = m[3], k = NW[m[2]], v = val(sh(b, m[1], k)), D = +m[4], f = 2 ** k;
          assert(val(b) === D && ans === ((m[1] === 'left' ? v === D * f : v * f === D) ? 'yes' : 'no'), `${id} ${card.id}: yn ${r.prompt} ${ans}`);
          seen[ans]++;
          assert(pass(ans === 'yes' ? 'Yes, exactly' : 'No, not exactly') && !pass(ans === 'yes' ? 'no' : 'yes'), `${id} ${card.id}: yes/no variants`);
          continue;
        }
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

const lesson = { id: ID, label: '1.8: Logical Shifts', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-7-overflow in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-7-overflow"/.exec(raw);
    assert(m && raw.split('"y11-1-7-overflow"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-7-overflow"').join(`"y11-1-7-overflow",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
