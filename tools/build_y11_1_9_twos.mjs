// Builds LessonData/y11-1-9-twos.json: Year 11, 1.9: Two's Complement (syllabus 0478 1.1: use two's complement to
// represent positive and negative 8-bit binary integers). The ninth lesson of the 2026-27 Year 11 plan, after
// y11-1-8-shifts.
//   node tools/build_y11_1_9_twos.mjs
// It also writes the lesson's three drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-8-shifts (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: copied from tools/build_y11_1_8_shifts.mjs (same helpers, pictures and marking), one idea per slide,
// a teacher-only Think, Pair, Share under every heading, predict-then-check, compare slides.
// Methods taught: binary to denary by place values with the left column worth -128; negative denary to binary by
// "flip and add 1" (the mark schemes' working mark), checked back with -128.
// Real questions, each value worked out below and checked against its mark scheme (Documents\0478 Past Papers):
//   Do Now:   0478/12 March 2026 Q6(c) (left shift, 11010100); 0478/13 June 2025 Q1(c)(iii) (right shift, 00101001) (1.8)
//   Read:     0478/12 March 2026 Q6(d) (01110101 = 117, no mark scheme: worked in code); 0478/11 June 2024 Q3(c) (-93);
//             0478/13 June 2025 Q1(d) (-55, "also" left out); 0478/12 March 2024 Q8(b)(i) (-73); 0478/13 November 2024
//             Q1(e) (-114); 0478/13 June 2026 Q8(d)(i) (35 and -22)
//   Make:     0478/13 November 2025 Q1(d) (-5); 0478/13 June 2024 Q3(e) (-25); 0478/12 June 2024 Q3(d) (-32);
//             0478/12 June 2025 Q1(g) (-22, RAM left out); 0478/11 June 2023 Q1(c) (-78); 0478/12 November 2023 Q2(d)
//             (-99, the register's earlier value left out)
//   Positive: 0478/13 November 2023 Q2(d) (123); 0478/12 March 2024 Q8(b)(ii) (45); 0478/13 June 2026 Q8(d)(ii) (14);
//             0478/12 June 2026 Q1(c)(ii) and (iii) (32 and -14)
//   Recall:   0478/12 June 2026 Q1(c)(i) (base 2, multiple choice); 0478/12 November 2024 Q3(e) and 0478/11 November
//             2025 Q1(f) (name it)
// Drills: y11-1-8-shifts reused for the Do Now Extension; y11-1-9-read (Activity 1), y11-1-9-make (Activity 2),
// y11-1-9-twos (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-9-twos';
const P = 'y11-19t';
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
const tc = (b) => val(b) - (b[0] === '1' ? 256 : 0);            // two's complement value of 8 bits
const bin8 = (n) => (n < 0 ? n + 256 : n).toString(2).padStart(8, '0'); // 8-bit two's complement of -128..127
const flip = (b) => [...b].map((c) => (c === '1' ? '0' : '1')).join('');
const pvs = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const TPV = [-128, 64, 32, 16, 8, 4, 2, 1];
const terms = (b) => TPV.filter((_, i) => b[i] === '1');
const termText = (b) => terms(b).join(' + ');
const sumText = (b) => pvs(b.length).filter((_, i) => b[i] === '1').join(' + ');
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
// Logical shifts (Do Now, from 1.8).
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
// Marking patterns. Minus may be typed as -, the minus sign, an en dash, "minus" or "negative".
const MINUS = '(-|\\u2212|\\u2013)';
const MINUS_W = '(-|\\u2212|\\u2013|minus\\s+|negative\\s+)';
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*(=\\s*)?${[...b].join('\\s*')}${BIN_TAIL}`;
const numFull = (n) => `^\\s*(=\\s*)?${n < 0 ? MINUS_W + '\\s*' + -n : '\\+?\\s*' + n}(\\s*(in\\s+)?denary)?\\s*\\.?\\s*$`;
const plus = '\\s*\\+\\s*';
// Working for binary to denary: the place values of the 1s with -128, either way round, or the flip and add 1 bits.
function readWork(b) {
  const v = tc(b), rest = terms(b).filter((t) => t > 0);
  const neg = `${MINUS}\\s*128`;
  const fwd = [neg, ...rest].join(plus);
  const back = rest.length ? [...rest].reverse().join(plus) + `\\s*(\\+\\s*)?${neg}` : neg;
  const alts = b[0] === '1' ? [fwd, back, [...bin8(-v)].join('\\s*')] : [rest.join(plus), [...rest].reverse().join(plus)];
  return `^\\s*(${alts.map((a) => `(${a})`).join('|')})(\\s*=\\s*${MINUS}?\\s*\\d+)?\\s*\\.?\\s*$`;
}
const posWork = (n) => { const r = pvs(8).filter((_, i) => bin8(n)[i] === '1'); return `^\\s*((${r.join(plus)})|(${[...r].reverse().join(plus)}))(\\s*=\\s*${n})?\\s*\\.?\\s*$`; };

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
const NEGHEAD = ';color:var(--bad, var(--danger, #b42318))';
const OUTSIDE = ';border:2px dashed var(--bad, var(--danger, #b42318));color:var(--bad, var(--danger, #b42318))';
// One 8-bit two's complement number under its place values (the -128 column marked). show = false leaves the bits empty.
function tcTable(bits, { label = true, hl = [], show = true, unsigned = false } = {}) {
  const w = 46, f = 18, th = TH(w, f - 4);
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (hl.includes(i) ? HL : bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const heads = (unsigned ? pvs(8) : TPV).map((p, i) => `<th style="${th}${i === 0 && !unsigned ? NEGHEAD : ''}">${p}</th>`).join('');
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${lab('Place value')}${heads}</tr>` +
    `<tr>${lab('Bit')}${[...bits].map((c, i) => `<td style="${td(i)}">${show ? c : ''}</td>`).join('')}</tr></table>`;
}
// Flip and add 1: +m, the flipped bits, + 1, and the answer (its right-hand `done` bits shown).
function flipTable(m, stage, { label = true, done = 8 } = {}) {
  const pos = bin8(m), fl = flip(pos), ans = bin8(-m), w = 40, th = TH(w, 13);
  const base = `padding:4px 3px;min-width:${w}px;text-align:center;border:1px solid var(--line-strong);height:30px;font:700 19px var(--font-mono, monospace)`;
  const lab = (t, extra = '') => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0${extra}">${t}</th>` : '';
  const row = (t, bits, show, { hl = false, top = false, from = 0 } = {}) => `<tr>${lab(t, top ? ';border-top:3px solid var(--ink, currentColor)' : '')}` +
    [...bits].map((c, i) => `<td style="${base}${top ? ';border-top:3px solid var(--ink, currentColor)' : ''}${show && i >= from && hl ? HL : show && c === '0' ? ';color:var(--muted-2)' : ''}">${show && i >= from ? c : ''}</td>`).join('') + '</tr>';
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${lab('Place value')}${TPV.map((p, i) => `<th style="${th}${i === 0 ? NEGHEAD : ''}">${p}</th>`).join('')}</tr>` +
    row(`+${m}`, pos, true) + row('Flipped', fl, stage >= 1, { hl: stage === 1 }) + row('+ 1', '00000001', stage >= 2) +
    row('Answer', ans, stage >= 2, { hl: stage === 2, top: true, from: 8 - done }) + '</table>';
}
// A logical shift (Do Now, as 1.8).
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
const bitTable = (bits) => tcTable(bits, { unsigned: true });
const big = (t) => `<div style="text-align:center;${MONO};font-size:30px;font-weight:700;letter-spacing:3px">${t}</div>`;
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
// An animation slide: a heading, one line, and the Two's Complement Animations app (pages TwosAnim/) on one scene.
const ANIMS = {};
function anim(id, label, query, whyQ) {
  ANIMS[id] = query;
  return { id, label, type: 'embedded-app', appId: 'twos-anim', embedQuery: query, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) +
      '<p class="lesson-lead">Press <strong>Play</strong>, or <strong>Next</strong> for one step at a time.</p>' + `<div id="${P}-${id}"></div>` };
}
// Explain it in your own words, straight after an animation: AI-marked by Haiku only (aiModel "haiku"), James 2026-11-16.
function explain(id, label, about, part, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) +
      '<p class="lesson-lead">Explain it in your own words. Press <strong>Check my answer</strong> to have it marked.</p>' + `<div id="${cid}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part)] };
}
const steps = [];
const cap = (t) => t[0].toUpperCase() + t.slice(1);

// Walk me through it on a similar shift (Do Now, as 1.8).
function wtShift(bits, d, n) {
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
  const check = L ? (loses1(bits, d, n) ? `In denary, ${dv} becomes ${rv}. A 1 was lost, so this is not ${dv} x ${f}.` : `In denary, ${dv} becomes ${rv}: ${dv} x ${f} = ${rv}.`)
    : (loses1(bits, d, n) ? `In denary, ${dv} becomes ${rv}. The remainder is lost with the bits on the right.` : `In denary, ${dv} becomes ${rv}: ${dv} &divide; ${f} = ${rv}.`);
  out.push({ text: check, visual: line(kw(L ? `x ${f}` : `&divide; ${f}`)) });
  out.push({ text: 'Now do the same for the question. One place at a time: bits that move out are lost, 0s fill the gap. Count 8 bits at the end.', visual: note(`${places(n)} ${d} &nbsp; lost on the ${end} &nbsp; 0s in on the ${side}`) });
  return { title: `Walk me through it: logical ${d} shift`, steps: out };
}
// Walk me through it: two's complement binary to denary, one 1 at a time.
function wtRead(b) {
  const v = tc(b), neg = b[0] === '1';
  const out = [
    { text: `<strong>A similar question.</strong> Convert the two's complement 8-bit binary integer ${b} to denary.`, visual: big(spaced(b)) },
    { text: `Write the bits under the place values. In two's complement the left column is worth ${kw('-128')}.`, visual: tcTable(b) },
    { text: neg ? `The left bit is 1, so the number is below 0. Start the total at ${kw('-128')}.` : `The left bit is 0, so no -128 is added. It converts like ordinary binary. Start the total at ${kw('0')}.`, visual: tcTable(b, { hl: [0] }) },
  ];
  let t = neg ? -128 : 0;
  for (let i = 1; i < 8; i++) {
    if (b[i] !== '1') continue;
    t += TPV[i];
    out.push({ text: `There is a 1 in the ${TPV[i]} column. Add ${TPV[i]}: the total is now ${kw(String(t))}.`, visual: tcTable(b, { hl: [i] }) });
  }
  assert(t === v, `wtRead ${b}`);
  out.push({ text: `So the denary value is ${termText(b)} = ${v}.`, visual: line(kw(`${termText(b)} = ${v}`)) });
  out.push({ text: 'Now do the same for the question. Write -128 over the left bit, then add the place values of the 1s. Type that sum as your working.', visual: note('left column -128 &nbsp; add the place values of the 1s') });
  return { title: "Walk me through it: two's complement to denary", steps: out };
}
// Walk me through it: denary to two's complement (flip and add 1 for a negative number).
function wtMake(n) {
  const b = bin8(n);
  if (n > 0) {
    const out = [
      { text: `<strong>A similar question.</strong> Give the two's complement 8-bit binary integer for the denary number ${n}.`, visual: big(String(n)) },
      { text: `${n} is positive. A positive number is stored as ordinary binary, with a ${kw('0')} in the -128 column.`, visual: tcTable(b, { show: false }) },
      { text: `Find the place values that add up to ${n}: ${sumText(b)} = ${n}.`, visual: line(kw(`${sumText(b)} = ${n}`)) },
      { text: 'Put a 1 under each of those place values.', visual: tcTable(b, { hl: [...b].map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0) }) },
      { text: `Put a 0 in every other column. All 8 bits must be there, ${kw('leading zeros')} too: ${spaced(b)}.`, visual: tcTable(b) },
      { text: 'Now do the same for the question. Find the place values, then write all 8 bits with 0s in front.', visual: note('positive: ordinary binary &nbsp; 0 on the left &nbsp; 8 bits') },
    ];
    return { title: "Walk me through it: a positive number in two's complement", steps: out };
  }
  const m = -n, pos = bin8(m), fl = flip(pos);
  const out = [
    { text: `<strong>A similar question.</strong> Give the two's complement 8-bit binary integer for the denary number ${n}. Show your working.`, visual: big(String(n)) },
    { text: `Step 1: forget the minus sign. Write ${m} as 8-bit binary: ${sumText(pos)} = ${m}.`, visual: flipTable(m, 0) },
    { text: `Step 2: ${kw('flip')} every bit. Each 0 becomes 1 and each 1 becomes 0: ${spaced(fl)}. This is your working.`, visual: flipTable(m, 1) },
    { text: `Step 3: ${kw('add 1')} to the flipped bits. Start at the right, with carries if you need them: ${spaced(b)}.`, visual: flipTable(m, 2) },
    { text: `Check with the place values: ${termText(b)} = ${n}.`, visual: line(kw(`${termText(b)} = ${n}`)) },
    { text: 'Now do the same for the question: the number without its minus sign in 8 bits, flip every bit, then add 1. Type the flipped bits, then your answer.', visual: note('8 bits &nbsp; flip &nbsp; add 1 &nbsp; check with -128') },
  ];
  return { title: "Walk me through it: a negative number in two's complement", steps: out };
}
const READ_FB = 'Write -128 over the left bit and the usual place values over the others. Add the place values of the 1s.';
const WORK_FB = 'Type the sum of the place values of the 1s, with -128 for a 1 in the left column, for example -128 + 64 + 1.';
const FLIP_FB = 'Write the number without its minus sign as 8 bits, then change every 0 to 1 and every 1 to 0.';
const MAKE_FB = 'Add 1 to the flipped bits, starting at the right. Check: the place values of the 1s, with -128, should give the number.';
const POS_FB = 'A positive number is ordinary binary with a 0 on the left. Type all 8 bits, leading zeros too.';
const shiftFb = (d) => `Move every bit one place ${d} at a time. Bits pushed out of the register are lost; 0s fill the gap on the ${d === 'left' ? 'right' : 'left'}. Type all 8 bits.`;

// ---------------------------------------------------------------- Do Now: 1.8 Logical Shifts
const DONOW = [
  { bits: '00110101', d: 'left', n: 2, ms: '11010100', ref: '0478/12, March 2026, Question 6(c)', wt: '00101011',
    lead: 'Give the 8-bit binary value after a logical binary shift left of two places is performed on the binary number 00110101.',
    whyQ: ['Why is it safer to move the bits one place at a time?', 'Each move is small, so it is easy to see which bit is lost and where the 0 goes.'] },
  { bits: '10100100', d: 'right', n: 2, ms: '00101001', ref: '0478/13, June 2025, Question 1(c)(iii)', wt: '11001000',
    lead: 'A logical right shift of two places is performed on the binary number 10100100. Give the binary number that would be stored after the logical shift has taken place.',
    whyQ: ['Why must the answer still have exactly 8 bits?', 'The register has a fixed number of bits. Bits that move out are lost and 0s fill the gap.'] },
];
DONOW.forEach((q, i) => {
  q.ans = shift(q.bits, q.d, q.n);
  assert(q.ans === q.ms, `${q.ref}: ${q.ans} is not the mark scheme's ${q.ms}`);
  const id = i ? 'do-now-2' : 'do-now';
  steps.push(checkStep(id, `Do Now: Logical Shifts (${i + 1} of 2)`, `Do Now: Logical Shifts (${i + 1} of 2)`,
    'Recap of 1.8 Logical Shifts. ' + cite(q.ref) + ' ' + q.lead, [{ label: 'The 8 bits after the shift', answer: binFull(q.ans), feedback: shiftFb(q.d) }],
    q.whyQ, bitTable(q.bits)));
  steps[steps.length - 1].walkthrough = wtShift(q.wt, q.d, q.n);
});

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-8-shifts', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these logical shift cards from 1.8. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: "Two's Complement",
  content: `<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Two's Complement</h2><p>Year 11</p></div>` +
    '<p class="lesson-lead"><strong>Today:</strong> store negative numbers in 8-bit binary.</p>' +
    why('Why might a computer need to store a number below zero?', 'A temperature or a bank balance can go below zero.') });

// ---------------------------------------------------------------- the -128 column
const AN_COL = '10000101';
assert(tc(AN_COL) === -123 && val(AN_COL) === 133, 'column animation value');
steps.push(anim('anim-column', 'Watch: Why the Left Column Is -128', `scene=column&bits=${AN_COL}`,
  ['Before you watch: how could 8 bits show a number below 0?', 'Take a few guesses. The animation shows the way computers do it.']));
steps.push(explain('explain-column', 'Explain It: Why -128?',
  'The animation showed ordinary binary (place values 128 to 1, totals 0 to 255), then the left column changed to -128, so 10000101 went from 133 to -123 and the numbers with a 1 on the left moved below 0, giving -128 to 127.',
  { prompt: 'In your own words, explain why the left column is worth -128 in two\'s complement.', marks: 2,
    scheme: ['Ordinary binary has only positive place values, so it cannot show a number below 0', 'A 1 in the -128 column makes the number negative / below 0',
      'A 0 in the left column means the number is positive', 'It lets 8 bits store -128 to 127'],
    guidance: 'Any two points, one mark each. Credit each point in the student\'s own words; no technical words are needed. "It makes the number smaller" without saying below 0 or negative earns nothing.',
    modelAnswer: 'The other columns are all positive, so they can never make a number below 0. A 1 in the -128 column makes the number negative.' },
  ['Where else do we need numbers below zero?', 'Temperatures in winter, or a bank account that is overdrawn.']));

const EXR = '10000001';
assert(tc(EXR) === -127, 'predict example');
steps.push(mcStep('predict-read', 'Check: Read a Two\'s Complement Number', 'Check: Read a Two\'s Complement Number', `${EXR} is stored as a two's complement integer.`, [
  { prompt: 'What is its denary value?', options: ['129', String(tc(EXR)), '-1'], correct: 1,
    explain: `The left 1 is worth -128 and the right 1 is worth 1: -128 + 1 = ${tc(EXR)}.` },
], ['Why is 129 the answer for ordinary binary but not here?', 'Ordinary binary gives the left column 128. Two\'s complement gives it -128.'], tcTable(EXR, { show: true })));

const AN_READ = '11010011';
assert(tc(AN_READ) === -45, 'read animation value');
steps.push(anim('anim-read', 'Watch: Reading Two\'s Complement', `scene=read&bits=${AN_READ}`,
  ['Before you watch: what will the 1 in the left column do to the total?', 'Say a prediction, then check it against the first step.']));
steps.push(explain('explain-read', 'Explain It: Two\'s Complement to Denary',
  'The animation converted 11010011 to denary: -128 over the left bit, then each 1 added its place value to a running total: -128 + 64 + 16 + 2 + 1 = -45.',
  { prompt: 'In your own words, explain how to convert a two\'s complement binary number to denary.', marks: 2,
    scheme: ['The left bit / most significant bit is worth -128', 'Add the place values of the 1s / the columns that hold a 1 (the left 1 counting as -128)'],
    guidance: 'One mark for each point, in the student\'s own words. "Add up the bits" alone earns no mark for point 2: it must be the place values. Do not accept 128 for the left column.',
    modelAnswer: 'The left column is worth -128. Add the place values of all the 1s.' },
  ['Why is a running total useful?', 'You can check each step, so a slip is easy to find.']));

// The real binary to denary questions. v is worked out in code and checked against the mark scheme value ms.
const RD = {
  mar26d: { bits: '01110101', ms: 117, marks: 1, ref: '0478/12, March 2026, Question 6(d)', wt: '01011010',
    lead: 'Convert the two\'s complement binary integer 01110101 into denary.',
    whyQ: ['Why does this number convert just like ordinary binary?', 'Its left bit is 0, so nothing is worth -128.'] },
  jun24c: { bits: '10100011', ms: -93, marks: 2, ref: '0478/11, June 2024, Question 3(c)', wt: '10010110',
    lead: '10100011 can be stored as a two\'s complement integer. Convert the two\'s complement integer 10100011 to denary. Show all your working.',
    whyQ: ['Why do we start the total at -128 for this number?', 'The left bit is 1, and in two\'s complement that column is worth -128.'] },
  jun25d: { bits: '11001001', ms: -55, marks: 2, ref: '0478/13, June 2025, Question 1(d)', wt: '11010011',
    lead: 'The two\'s complement 8-bit binary integer 11001001 is stored. Convert the two\'s complement 8-bit binary integer to denary. Show all of your working.',
    whyQ: ['Why does the working earn a mark of its own?', 'It shows the method, so an examiner can see you know how even if you slip.'] },
  mar24bi: { bits: '10110111', ms: -73, marks: 2, ref: '0478/12, March 2024, Question 8(b)(i)', wt: '10101100',
    lead: 'Two\'s complement can be used to represent positive and negative binary integers. Convert the two\'s complement integer 10110111 into denary. Show all your working.',
    whyQ: ['Why do more 1s after the left bit make a negative number closer to 0?', 'Each 1 adds a positive place value to -128.'] },
  nov24e: { bits: '10001110', ms: -114, marks: 2, ref: '0478/13, November 2024, Question 1(e)', wt: '11100101',
    lead: 'Calculate the denary number for the two\'s complement binary integer 10001110. Show all your working.',
    whyQ: ['Why should you add the place values one at a time?', 'A running total is easy to check, so one slip does not spoil the answer.'] },
};
Object.values(RD).forEach((q) => { q.v = tc(q.bits); assert(q.v === q.ms, `${q.ref}: ${q.v} is not ${q.ms}`); });
function readStep(key, i, total) {
  const q = RD[key], id = `read-${i}`;
  const parts = q.marks > 1
    ? [{ label: 'Working: the place values of the 1s, added', answer: readWork(q.bits), feedback: WORK_FB }, { label: 'Denary value', answer: numFull(q.v), feedback: READ_FB }]
    : [{ label: 'Denary value', answer: numFull(q.v), feedback: READ_FB }];
  steps.push(checkStep(id, `Exam Question: Two's Complement to Denary (${i} of ${total})`, 'Exam Question: Two\'s Complement to Denary',
    cite(q.ref) + ' ' + q.lead, parts, q.whyQ, tcTable(q.bits)));
  steps[steps.length - 1].walkthrough = wtRead(q.wt);
}
const NRD = 5;
readStep('mar26d', 1, NRD);
readStep('jun24c', 2, NRD);
readStep('jun25d', 3, NRD);

steps.push(embed('activity-1', 'Activity 1: Read Two\'s Complement', 'drill-y11-1-9-read', 'Activity 1: Read Two\'s Complement',
  'Is it positive or negative? Then find the denary value. Many numbers come from real exam papers. Get each card right 3 times in a row.',
  ['Why can you tell the sign from one bit?', 'Only the left column is negative, and it is worth more than all the others put together.']));

readStep('mar24bi', 4, NRD);
readStep('nov24e', 5, NRD);

// ---------------------------------------------------------------- flip and add 1
const AN_FLIP = -20;
assert(bin8(AN_FLIP) === '11101100' && tc(flip(bin8(-AN_FLIP))) === AN_FLIP - 1, 'flip animation value');
steps.push(anim('anim-flip', 'Watch: Flip and Add 1', `scene=flip&n=${AN_FLIP}`,
  ['Before you watch: what do you think it means to flip a bit?', 'Turn it over: a 0 becomes a 1 and a 1 becomes a 0.']));
steps.push(explain('explain-flip', 'Explain It: Making a Negative Number',
  'The animation stored -20: 20 written as 8 bits (00010100), every bit flipped (11101011), then 1 added from the right with carries (11101100), checked as -128 + 64 + 32 + 8 + 4 = -20.',
  { prompt: 'In your own words, explain how to store a negative denary number in 8-bit two\'s complement.', marks: 3,
    scheme: ['Write the number without its minus sign / the positive number in 8-bit binary', 'Flip / invert every bit (0s become 1s and 1s become 0s)', 'Add 1 (to the flipped bits)'],
    guidance: 'One mark for each step, in the student\'s own words ("swap the 0s and 1s" is fine for flip). The add 1 mark needs the flip before it. "Change the left bit to 1" earns nothing.',
    modelAnswer: 'Write the number without its minus sign in 8 bits. Flip every bit. Add 1.' },
  ['Why do written methods keep their steps in a fixed order?', 'Each step works on what the step before it made.']));
steps.push(explain('explain-add1', 'Explain It: Why Add 1?',
  'At the end of the animation a number line showed that flipping the bits of 20 alone gives -21, and adding 1 moves it up to -20.',
  { prompt: 'In your own words, explain why we add 1 after flipping the bits.', marks: 2,
    scheme: ['Flipping alone gives a number that is 1 too low / one less than it should be (for example -21 instead of -20)', 'Adding 1 moves it up to the right number'],
    guidance: 'One mark for each point, in the student\'s own words. "Because that is the rule" earns nothing.',
    modelAnswer: 'Flipping alone gives a number 1 too low. Adding 1 makes it the right number.' },
  ['Why is it a good idea to check an answer by working backwards?', 'If it does not give the number you started with, you know something went wrong.']));

// The real negative denary to binary questions.
const MK = {
  nov25d: { n: -5, ms: '11111011', ref: '0478/13, November 2025, Question 1(d)', wt: -9,
    lead: 'If the owner of the shop wants to make the room very cold, she may need to enter a negative denary number. The negative denary number could be represented using two\'s complement. Give the two\'s complement 8-bit binary integer that would be stored for the temperature -5. Show all your working.',
    whyQ: ['Why write 5 as 8 bits before you flip?', 'The 0s in front flip to 1s, and they are part of the answer.'] },
  jun24e: { n: -25, ms: '11100111', ref: '0478/13, June 2024, Question 3(e)', wt: -19,
    lead: 'The health value for a character in the computer game can sometimes be a negative value. The negative values are stored as two\'s complement 8-bit integers. A character has a health value of -25. Calculate the two\'s complement 8-bit integer for -25. Show all your working.',
    whyQ: ['Why is the flipped row the working the mark scheme wants?', 'It shows the method, flip then add 1, before the answer.'] },
  jun24d: { n: -32, ms: '11100000', ref: '0478/12, June 2024, Question 3(d)', wt: -40,
    lead: 'The denary integer -32 is stored as a two\'s complement integer. Calculate the two\'s complement integer that would be stored. Show all your working.',
    whyQ: ['Why can adding 1 change more than one bit?', 'When the right bit is already 1, adding 1 makes 10, so a 1 carries to the next column.'] },
  jun25g: { n: -22, ms: '11101010', ref: '0478/12, June 2025, Question 1(g)', wt: -12,
    lead: 'The negative denary number -22 is stored. Negative denary numbers can be represented as binary using two\'s complement. Give the two\'s complement 8-bit binary integer that would be stored for the denary number -22. You must show all your working.',
    whyQ: ['Why check your answer with -128 at the end?', 'If the place values do not give the number, you know there is a slip to find.'] },
  jun23c: { n: -78, ms: '10110010', ref: '0478/11, June 2023, Question 1(c)', wt: -70,
    lead: 'Binary numbers are stored in registers. Negative denary numbers can be represented as binary using two\'s complement. Complete the binary register for the denary number -78. You must show all your working.',
    whyQ: ['Why must a negative number always end up with a 1 on the left?', 'Only the -128 column can make the total below 0.'] },
  nov23d: { n: -99, ms: '10011101', ref: '0478/12, November 2023, Question 2(d)', wt: -103,
    lead: 'The negative denary number -99 needs to be stored in a register. Complete the register to show the binary number that would be stored, using two\'s complement. Show all your working.',
    whyQ: ['Why does a register need all 8 bits filled in?', 'Every box holds a bit. A missing bit would change the value.'] },
};
Object.values(MK).forEach((q) => { q.ans = bin8(q.n); q.fl = flip(bin8(-q.n)); assert(q.ans === q.ms && tc(q.ans) === q.n, `${q.ref}: ${q.ans} is not ${q.ms}`); });
function makeStep(key, i, total) {
  const q = MK[key], id = `make-${i}`;
  steps.push(checkStep(id, `Exam Question: Negative Denary to Two's Complement (${i} of ${total})`, 'Exam Question: Negative Denary to Two\'s Complement',
    cite(q.ref) + ' ' + q.lead, [
      { label: `Working: ${-q.n} in 8 bits, with every bit flipped`, answer: binFull(q.fl), feedback: FLIP_FB },
      { label: 'Two\'s complement 8-bit binary integer', answer: binFull(q.ans), feedback: MAKE_FB },
    ], q.whyQ, tcTable(q.ans, { show: false })));
  steps[steps.length - 1].walkthrough = wtMake(q.wt);
}
const NMK = 6;
makeStep('nov25d', 1, NMK);
makeStep('jun24e', 2, NMK);
makeStep('jun24d', 3, NMK);

steps.push(embed('activity-2', 'Activity 2: Make a Negative Number', 'drill-y11-1-9-make', 'Activity 2: Make a Negative Number',
  'Flip the bits, then add 1. Positive numbers too. Many numbers come from real exam papers.',
  ['Why does the method start with the number without its minus sign?', 'Flip and add 1 turns the bits of a positive number into its negative.']));

makeStep('jun25g', 4, NMK);
makeStep('jun23c', 5, NMK);
makeStep('nov23d', 6, NMK);

// ---------------------------------------------------------------- positive numbers
const AN_POS = 10;
steps.push(anim('anim-pos', 'Watch: Positive Numbers', `scene=pos&n=${AN_POS}`,
  ['Before you watch: will a positive number need flipping?', 'Say yes or no, then watch.']));
steps.push(explain('explain-pos', 'Explain It: Positive Numbers',
  'The animation stored 10 as 00001010: the place values 8 and 2 get a 1, every other column a 0, including the -128 column, so nothing is taken away; the leading zeros are written. -10 is 11110110, with a 1 in the -128 column.',
  { prompt: 'In your own words, explain why a positive number in two\'s complement must have a 0 in the left column.', marks: 1,
    scheme: ['A 1 in the left column would add -128 / make the number negative'],
    guidance: '1 mark, in the student\'s own words. "Because it is positive" alone earns nothing: the answer must say what a 1 there would do.',
    modelAnswer: 'A 1 there would add -128 and make the number negative.' },
  ['Why is it worth knowing the reason for a rule, not just the rule?', 'Then you can use it on any number, even one you have not seen.']));

const PS = {
  nov23d13: { n: 123, ms: '01111011', ref: '0478/13, November 2023, Question 2(d)', wt: 77,
    lead: 'Convert the positive denary number 123 to 8-bit binary using two\'s complement. Show all your working.',
    whyQ: ['Why does a positive number need no flipping?', 'Flip and add 1 is only for making a number negative.'] },
  mar24bii: { n: 45, ms: '00101101', ref: '0478/12, March 2024, Question 8(b)(ii)', wt: 37,
    lead: 'Two\'s complement can be used to represent positive and negative binary integers. Convert the denary number 45 into an 8-bit two\'s complement integer.',
    whyQ: ['Why is 101101 not a full answer?', 'The question asks for 8 bits, so the leading zeros must be there.'] },
  jun26d13: { n: 14, ms: '00001110', ref: '0478/13, June 2026, Question 8(d)(ii)', wt: 11,
    lead: 'A display screen displays the current temperature inside a building. The current temperature is stored as a two\'s complement binary integer and is displayed as a denary number. Give the two\'s complement binary integer that would be stored when the denary number 14 is displayed.',
    whyQ: ['Why does the mark scheme say leading zeros must be present?', 'Without them the left bit is not 0, so it is not clearly a positive two\'s complement number.'] },
};
Object.values(PS).forEach((q) => { q.ans = bin8(q.n); assert(q.ans === q.ms && q.ans[0] === '0', `${q.ref}: ${q.ans}`); });
{
  const q = PS.nov23d13;
  steps.push(checkStep('pos-1', 'Exam Question: Positive Numbers (1 of 3)', 'Exam Question: Positive Numbers', cite(q.ref) + ' ' + q.lead, [
    { label: 'Working: the place values that add up to 123', answer: posWork(q.n), feedback: 'Find the place values that add up to 123 and type them with + signs.' },
    { label: '8-bit binary', answer: binFull(q.ans), feedback: POS_FB },
  ], q.whyQ, tcTable(q.ans, { show: false })));
  steps[steps.length - 1].walkthrough = wtMake(q.wt);
}
['mar24bii', 'jun26d13'].forEach((k, j) => {
  const q = PS[k];
  steps.push(checkStep(`pos-${j + 2}`, `Exam Question: Positive Numbers (${j + 2} of 3)`, 'Exam Question: Positive Numbers', cite(q.ref) + ' ' + q.lead, [
    { label: 'Two\'s complement 8-bit binary integer', answer: binFull(q.ans), feedback: POS_FB },
  ], q.whyQ, tcTable(q.ans, { show: false })));
  steps[steps.length - 1].walkthrough = wtMake(q.wt);
});

// 0478/12 June 2026 Q1(c): (i) base 2 (A); (ii) 32 = 00100000 (leading zeros must be present); (iii) -14 = 11110010.
const J26 = { ii: 32, iii: -14, ms: ['00100000', '11110010'] };
assert(bin8(J26.ii) === J26.ms[0] && bin8(J26.iii) === J26.ms[1], 'June 2026 Q1(c)');
const J26_STEM = 'One item of data displayed on the smartwatch is the current outdoor temperature. The temperature is stored in a register as a two\'s complement binary integer.';
steps.push(mcStep('exam-mc', 'Exam Question: What Base?', 'Exam Question: What Base?',
  cite('0478/12, June 2026, Question 1(c)(i)') + ' ' + J26_STEM + ' Tick one box to show whether two\'s complement is a base 2, base 8, base 10 or base 16 number system.', [
    { prompt: 'Two\'s complement is a number system of which base?', options: ['Base 2', 'Base 8', 'Base 10', 'Base 16'], correct: 0,
      explain: 'Two\'s complement is binary: every digit is a 0 or a 1, so it is base 2.' },
  ], ['Why is denary called base 10?', 'It uses ten different digits, 0 to 9.']));
steps.push(checkStep('mixed-1', 'Exam Question: Positive and Negative', 'Exam Question: Positive and Negative',
  cite('0478/12, June 2026, Question 1(c)(ii) and (iii)') + ' ' + J26_STEM, [
    { label: 'Give the two\'s complement 8-bit binary integer that would be stored for the temperature of 32 degrees Celsius.', answer: binFull(J26.ms[0]), feedback: POS_FB },
    { label: 'Give the two\'s complement 8-bit binary integer that would be stored for the temperature of -14 degrees Celsius.', answer: binFull(J26.ms[1]), feedback: MAKE_FB },
  ], ['Why do 32 and -14 need different methods?', 'One is positive, so it is ordinary binary. The other is negative, so it is flip and add 1.']));
steps[steps.length - 1].walkthrough = wtMake(-11);

// 0478/12 November 2024 Q3(e): "Two's complement". 0478/11 November 2025 Q1(f): "Using two's complement".
const NAME_RE = `^\\s*((by\\s+)?using\\s+|by\\s+)?(the\\s+)?(two|2)\\s*['\\u2019]?\\s*s\\s*complement(\\s+(number\\s+)?(system|method))?\\s*\\.?\\s*$`;
steps.push(checkStep('name', 'Exam Questions: Name It', 'Exam Questions: Name It',
  cite('0478/12, November 2024, Question 3(e)') + ' A negative binary integer needs to be stored in a register in the computer. ' + cite('0478/11, November 2025, Question 1(f)') + ' A calculator has 8-bit registers. The result of a calculation could be a negative denary number.', [
    { label: 'November 2024: Give the name of the number system that can be used to represent negative binary integers.', answer: NAME_RE, feedback: 'Which number system stores negative numbers with a left column worth -128?' },
    { label: 'November 2025: State how the calculator could represent a negative denary number as a binary number.', answer: NAME_RE, feedback: 'Name the number system from today\'s lesson.' },
  ], ['Why can ordinary binary not store a negative number?', 'Every place value is positive, so the smallest total is 0.']));

// 0478/13 June 2026 Q8(d)(i): 35 and -22.
const J26B = [['00100011', 35], ['11101010', -22]];
J26B.forEach(([b, v]) => assert(tc(b) === v, `June 2026 Q8(d)(i) ${b}`));
steps.push(checkStep('read-6', 'Exam Question: Read the Display', 'Exam Question: Read the Display',
  cite('0478/13, June 2026, Question 8(d)(i)') + ' A display screen displays the current temperature inside a building. The current temperature is stored as a two\'s complement binary integer and is displayed as a denary number. Give the denary number that would be displayed for each of the two\'s complement binary integers.',
  J26B.map(([b, v]) => ({ label: b, answer: numFull(v), feedback: READ_FB })),
  ['Why can a display show both a positive and a negative temperature from 8 bits?', 'The left bit says which: 0 for positive, 1 for negative.']));
steps[steps.length - 1].walkthrough = wtRead('11011001');

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Two\'s Complement Drill', 'drill-y11-1-9-twos', 'Plenary: Two\'s Complement Drill',
  'Read two\'s complement, make negative numbers, positive numbers and why it works. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
function plain(h) { return h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' '); }
DONOW.forEach((q, i) => {
  const id = i ? 'do-now-2' : 'do-now';
  const wrong = [q.bits, shift(q.bits, other(q.d), q.n), shift(q.bits, q.d, q.n + 1), shift(q.bits, q.d, q.n - 1), fill1(q.bits, q.d, q.n), rot(q.bits, q.d, q.n)].filter((x) => x !== q.ans);
  ok(id, 0, [q.ans, spaced(q.ans), q.ans + ' in binary'], wrong);
});
Object.entries(RD).forEach(([k], j) => {
  const q = RD[k], id = `read-${j + 1}`, v = q.v;
  const last = q.marks > 1 ? 1 : 0;
  const yes = v < 0 ? [String(v), '−' + -v, 'minus ' + -v, '= ' + v, v + ' in denary'] : [String(v), '+' + v, '= ' + v];
  ok(id, last, yes, [String(-v), String(val(q.bits)), String(v + 1), String(v - 1), q.bits].filter((x) => x !== String(v)));
  if (q.marks > 1) {
    const t = terms(q.bits), rest = t.slice(1);
    ok(id, 0, [t.join(' + '), t.join('+'), `${t.join(' + ')} = ${v}`, [...rest].reverse().join(' + ') + ' - 128', bin8(-v), '−128 + ' + rest.join(' + ')],
      ['128 + ' + rest.join(' + '), String(v), '-128', rest.join(' + '), flip(q.bits)]);
  }
});
Object.entries(MK).forEach(([k], j) => {
  const q = MK[k], id = `make-${j + 1}`, pos = bin8(-q.n);
  ok(id, 0, [q.fl, spaced(q.fl)], [pos, q.ans, '1' + pos.slice(1)]);
  ok(id, 1, [q.ans, spaced(q.ans), q.ans + ' in binary'], [pos, q.fl, '1' + pos.slice(1), bin8(q.n - 1), bin8(q.n + 1)]);
});
ok('pos-1', 0, ['64 + 32 + 16 + 8 + 2 + 1', '1 + 2 + 8 + 16 + 32 + 64', '64+32+16+8+2+1 = 123'], ['123', '64 + 32 + 16 + 8 + 2', '01111011']);
ok('pos-1', 1, ['01111011', '0111 1011'], ['1111011', '10000101', '11111011']);
ok('pos-2', 0, ['00101101', '0010 1101'], ['101101', '11010011', '10101101']);
ok('pos-3', 0, ['00001110', '0000 1110'], ['1110', '11110010', '10001110']);
ok('mixed-1', 0, ['00100000'], ['100000', '11100000']);
ok('mixed-1', 1, ['11110010', '1111 0010'], ['00001110', '11110001', '10001110']);
ok('name', 0, ["Two's complement", 'twos complement', "2's complement", 'two’s complement', "two's complement number system"], ['binary', 'complement', 'hexadecimal', 'ones complement']);
ok('name', 1, ["Using two's complement", "by using two's complement", "two's complement"], ['using binary', 'flip and add']);
ok('read-6', 0, ['35', '+35'], ['-35', '163']);
ok('read-6', 1, ['-22', 'minus 22', '−22'], ['22', '234', '-21', '-23']);
// Every walkthrough: a true step by step, never the slide's answer.
steps.filter((s) => s.walkthrough).forEach((s) => {
  assert(s.walkthrough.steps.length >= 5, `${s.id} walkthrough is step by step`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
{
  const answers = { 'do-now': [DONOW[0].ans], 'do-now-2': [DONOW[1].ans], 'read-6': ['35', '-22'], 'mixed-1': J26.ms, 'pos-1': [PS.nov23d13.ans], 'pos-2': [PS.mar24bii.ans], 'pos-3': [PS.jun26d13.ans] };
  Object.values(RD).forEach((q, j) => { answers[`read-${j + 1}`] = [String(q.v)]; });
  Object.values(MK).forEach((q, j) => { answers[`make-${j + 1}`] = [q.ans, q.fl]; });
  Object.entries(answers).forEach(([id, list]) => {
    const s = steps.find((x) => x.id === id);
    const d = plain(JSON.stringify(s.walkthrough.steps.map((x) => x.text + ' ' + x.visual))).replace(/(?<=[01]) (?=[01])/g, '').replace(/<[^>]*>/g, '');
    list.forEach((a) => assert(!new RegExp(`(^|[^\\d-])${a.replace('-', '-?')}(?!\\d)`).test(d) || /^[01]{8}$/.test(a) && !d.includes(a), `${id} walkthrough shows the answer ${a}`));
    list.filter((a) => /^[01]{8}$/.test(a)).forEach((a) => assert(!d.includes(a), `${id} walkthrough shows ${a}`));
  });
}
{
  const qs = [...Object.values(RD).flatMap((q) => [q.bits, bin8(q.v)]), ...Object.values(MK).flatMap((q) => [q.ans, q.fl]), ...Object.values(PS).map((q) => q.ans), ...J26.ms, ...J26B.map((x) => x[0])];
  [AN_COL, EXR, AN_READ, bin8(AN_FLIP), flip(bin8(-AN_FLIP)), bin8(-AN_FLIP), bin8(AN_POS), bin8(-AN_POS), flip(bin8(AN_POS)),
    '01011010', '10010110', '11010011', '10101100', '11100101', '11011001'].forEach((b) => assert(!qs.includes(b), `example ${b} is also in a question`));
  const nums = [...Object.values(RD).map((q) => q.v), ...Object.values(MK).map((q) => q.n), ...Object.values(PS).map((q) => q.n), 32, -14, 35, -22];
  [tc(AN_COL), -127, tc(AN_READ), AN_FLIP, AN_FLIP - 1, AN_POS, -AN_POS, ...Object.values(MK).map((q) => q.wt), ...Object.values(PS).map((q) => q.wt)].forEach((n) => assert(!nums.includes(n), `example ${n} is also a question value`));
  // Every animation slide is followed straight away by its own-words explanation, marked by Haiku only.
  Object.keys(ANIMS).forEach((id) => { const i = steps.findIndex((s) => s.id === id); assert(steps[i + 1].type === 'self-marked-response' && steps[i + 1].items.every((it) => it.aiModel === 'haiku' && it.scheme.length >= it.marks), `${id} is followed by a Haiku explain slide`); });
  // The animation app draws the same numbers the lesson names.
  assert(ANIMS['anim-column'] === `scene=column&bits=${AN_COL}` && ANIMS['anim-flip'] === `scene=flip&n=${AN_FLIP}`, 'animation queries');
  assert(fs.readFileSync(path.join(ROOT, 'TwosAnim', 'index.html'), 'utf8').includes("make: sceneColumn"), 'TwosAnim app present');
}
// No term before the slide that teaches it (the title slide only names today's topic). Later or off-syllabus terms never.
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/two.s complement/i, 'anim-column'], [/\bflip/i, 'anim-flip'],
    [/sign and magnitude|one.s complement|\bhex|\bRAM\b|random access|ascii|\bbytes?\b|mario|\bdecimal\b|overflow/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, st: s.stepperSteps, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => assert(s.items.length <= 2 && s.items.every((it) => it.options.length === new Set(it.options).size), `${s.id} items`));
assert(new Set(steps.filter((s) => s.type === 'multiple-choice').map((s) => s.items[0].correct)).size > 1, 'MC correct positions vary');
steps.filter((s) => s.validatorKey).forEach((s) => {
  const t = /<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content);
  if (t) V(s.id).forEach((v, i) => assert(!new RegExp(v.pattern.source.replace(/^\^/, '\\b').replace(/\$$/, '\\b'), 'i').test(plain(t[1])), `${s.id} TPS gives part ${i}`));
});
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => {
  const t = plain(/<details class="lesson-tps">([\s\S]*?)<\/details>/.exec(s.content)[1]);
  s.items.forEach((it) => assert(!t.toLowerCase().includes(it.options[it.correct].toLowerCase()), `${s.id} TPS gives the option`));
});
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

// ---------------------------------------------------------------- drills
const C = (r) => `From Cambridge IGCSE ${r}.`;
const INJECT = {
  READ: [...Object.values(RD).map((q) => [q.bits, C(q.ref)]), ...J26B.map(([b]) => [b, C('0478/13 June 2026 Q8(d)(i)')])],
  NEG: [...Object.values(MK).map((q) => [q.n, C(q.ref)]), [-14, C('0478/12 June 2026 Q1(c)(iii)')]],
  POS: [...Object.values(PS).map((q) => [q.n, C(q.ref)]), [32, C('0478/12 June 2026 Q1(c)(ii)')]],
};
const drillHead = (id, about) => `// Year 11, 1.9: Two's Complement. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_9_twos.mjs: edit that, then run it.\n`;

// ---- All three drills share these helpers (the function is copied whole by toString()).
function tcCards(which) {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad(s, n) { while (s.length < n) s = "0" + s; return s; }
  function bin8(n) { return pad((n < 0 ? n + 256 : n).toString(2), 8); }
  function tc(b) { var v = parseInt(b, 2); return b[0] === "1" ? v - 256 : v; }
  function flip(b) { return b.split("").map(function (c) { return c === "1" ? "0" : "1"; }).join(""); }
  function sp(b) { return b.replace(/(.{4})(?=.)/g, "$1 "); }
  function ones(b) { return b.split("1").length - 1; }
  var TPV = [-128, 64, 32, 16, 8, 4, 2, 1];
  function termText(b) { var out = []; for (var i = 0; i < 8; i++) if (b[i] === "1") out.push(TPV[i]); return out.join(" + "); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*\\.?\\s*$", "i"); }
  function den(v) { return new RegExp("^\\s*(=\\s*)?" + (v < 0 ? "(-|\\u2212|\\u2013|minus\\s+|negative\\s+)\\s*" + (-v) : "\\+?\\s*" + v) + "(\\s*(in\\s+)?denary)?\\s*\\.?\\s*$", "i"); }
  var NEG_RE = /^\s*(it\s+is\s+)?negative\s*\.?\s*$/i, POS_RE = /^\s*(it\s+is\s+)?positive\s*\.?\s*$/i;
  function uniq(re, list) { var out = []; list.forEach(function (x) { if (x && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  var READ = [] /*READ*/, NEG = [] /*NEG*/, POS = [] /*POS*/;
  // A number to read: sign "neg", "pos" or undefined (either). Half the time a real exam value.
  function pickBits(sign) {
    var list = READ.filter(function (r) { return !sign || (sign === "neg") === (r[0][0] === "1"); });
    if (list.length && Math.random() < 0.5) { var r = drillPick(list); return { b: r[0], src: " " + r[1] }; }
    var s = sign || (Math.random() < 0.6 ? "neg" : "pos"), n;
    do { n = s === "neg" ? rnd(-125, -2) : rnd(3, 125); } while (ones(bin8(n)) < 3);
    return { b: bin8(n), src: "" };
  }
  function pickNeg() {
    if (Math.random() < 0.5) { var r = drillPick(NEG); return { n: r[0], src: " " + r[1] }; }
    var n; do { n = rnd(-120, -2); } while (ones(bin8(-n)) < 2);
    return { n: n, src: "" };
  }
  function pickPos() {
    if (Math.random() < 0.5) { var r = drillPick(POS); return { n: r[0], src: " " + r[1] }; }
    var n; do { n = rnd(3, 120); } while (ones(bin8(n)) < 2);
    return { n: n, src: "" };
  }
  function signCard(p) {
    var neg = p.b[0] === "1", ans = neg ? "Negative" : "Positive";
    return { prompt: "Is the two's complement binary integer " + p.b + " positive or negative?", answers: [ans], keywords: [neg ? NEG_RE : POS_RE], distractors: [neg ? "Positive" : "Negative"],
      working: ["Look only at the left bit. In two's complement it is worth -128.", "A 1 there pulls the total below 0. A 0 there adds nothing."],
      note: p.b + ": the left bit is " + p.b[0] + ", so it is " + ans.toLowerCase() + "." + p.src };
  }
  function readCard(p) {
    var v = tc(p.b), u = parseInt(p.b, 2);
    var cands = v < 0 ? [u, v + 1, -v, v - 1] : [-v, v + 128, v + 1, v - 1];
    return { prompt: "The 8-bit two's complement binary integer " + p.b + " is stored. What is its denary value?", answers: [String(v)], keywords: [den(v)],
      distractors: drillWrongNumbers(v, cands, 3), format: "Type the denary number, with a minus sign if it is negative",
      working: ["Write the place values over the bits. The left column is worth -128.", "Add the place values of the 1s."],
      note: termText(p.b) + " = " + v + "." + p.src };
  }
  function flipCard(m) {
    var pos = bin8(m), f = flip(pos), re = binRe(f);
    return { prompt: "To store -" + m + " in two's complement, first write " + m + " as 8 bits: " + pos + ". Flip every bit. What are the 8 bits now?", answers: [sp(f)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, [pos, bin8(-m), "1" + pos.slice(1), flip(bin8(-m))]),
      working: ["Go along the 8 bits one at a time.", "Each 0 becomes 1 and each 1 becomes 0."],
      note: pos + " flipped is " + sp(f) + ". Then add 1 to get " + sp(bin8(-m)) + "." };
  }
  function makeCard(p) {
    var m = -p.n, pos = bin8(m), a = bin8(p.n), re = binRe(a);
    return { prompt: "Give the 8-bit two's complement binary integer for the denary number " + p.n + ".", answers: [sp(a)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, [flip(pos), pos, "1" + pos.slice(1), bin8(p.n - 1)]),
      working: ["Write the number without its minus sign as 8 bits, then flip every bit.", "Add 1 to the flipped bits, then check with -128."],
      note: m + " = " + pos + ", flipped " + flip(pos) + ", add 1: " + sp(a) + ". Check: " + termText(a) + " = " + p.n + "." + p.src };
  }
  function posCard(p) {
    var a = bin8(p.n), re = binRe(a);
    return { prompt: "Give the 8-bit two's complement binary integer for the denary number " + p.n + ".", answers: [sp(a)], keywords: [re], format: "Type the 8 bits",
      distractors: uniq(re, [bin8(-p.n), "1" + a.slice(1), a.replace(/^0+/, ""), flip(a)]),
      working: ["It is positive, so it is ordinary binary with a 0 on the left.", "Write all 8 bits, leading zeros too."],
      note: p.n + " is positive: ordinary binary, " + sp(a) + "." + p.src };
  }
  function rangeCard(small) {
    var v = small ? -128 : 127;
    return { prompt: "What is the " + (small ? "smallest" : "largest") + " denary number an 8-bit two's complement integer can store?", answers: [String(v)], keywords: [den(v)],
      distractors: small ? ["-127", "0", "-255"] : ["128", "255", "-127"],
      working: [small ? "Only the left column is below 0. Which 8 bits give the lowest total?" : "A positive number has a 0 on the left. Fill every other column with 1s.", "Add the place values of the 1s."],
      note: small ? "10000000 = -128." : "01111111 = 64 + 32 + 16 + 8 + 4 + 2 + 1 = 127." };
  }
  function why(id, prompt, answer, distractors, note, working) { return { id: id, category: "pl-why", prompt: prompt, answers: [answer], distractors: distractors, note: note, working: working, pickThenType: true }; }
  if (which === "read") return [
    { id: "rd-01", category: "rd-sign", randomize: function () { return signCard(pickBits()); } },
    { id: "rd-02", category: "rd-sign", randomize: function () { return signCard(pickBits()); } },
    { id: "rd-03", category: "rd-den", randomize: function () { return readCard(pickBits("pos")); } },
    { id: "rd-04", category: "rd-den", randomize: function () { return readCard(pickBits("neg")); } },
    { id: "rd-05", category: "rd-den", randomize: function () { return readCard(pickBits("neg")); } },
    { id: "rd-06", category: "rd-den", randomize: function () { return readCard(pickBits()); } }
  ];
  if (which === "make") return [
    { id: "mk-01", category: "mk-flip", randomize: function () { return flipCard(-pickNeg().n); } },
    { id: "mk-02", category: "mk-flip", randomize: function () { return flipCard(-pickNeg().n); } },
    { id: "mk-03", category: "mk-neg", randomize: function () { return makeCard(pickNeg()); } },
    { id: "mk-04", category: "mk-neg", randomize: function () { return makeCard(pickNeg()); } },
    { id: "mk-05", category: "mk-neg", randomize: function () { return makeCard(pickNeg()); } },
    { id: "mk-06", category: "mk-pos", randomize: function () { return posCard(pickPos()); } },
    { id: "mk-07", category: "mk-pos", randomize: function () { return posCard(pickPos()); } }
  ];
  return [
    // ================================================= Reading
    { id: "pl-01", category: "pl-read", randomize: function () { return signCard(pickBits()); } },
    { id: "pl-02", category: "pl-read", randomize: function () { return readCard(pickBits("neg")); } },
    { id: "pl-03", category: "pl-read", randomize: function () { return readCard(pickBits("neg")); } },
    { id: "pl-04", category: "pl-read", randomize: function () { return readCard(pickBits("pos")); } },
    // ================================================= Making
    { id: "pl-05", category: "pl-make", randomize: function () { return flipCard(-pickNeg().n); } },
    { id: "pl-06", category: "pl-make", randomize: function () { return makeCard(pickNeg()); } },
    { id: "pl-07", category: "pl-make", randomize: function () { return makeCard(pickNeg()); } },
    { id: "pl-08", category: "pl-make", randomize: function () { return posCard(pickPos()); } },
    // ================================================= Range
    { id: "pl-09", category: "pl-range", randomize: function () { return rangeCard(true); } },
    { id: "pl-10", category: "pl-range", randomize: function () { return rangeCard(false); } },
    // ================================================= Why
    why("pl-11", "Why is the left column worth -128 in two's complement?", "So that a 1 there makes the number negative",
      ["So that the number can be bigger than 255", "Because the left bit is always lost", "Because 128 cannot be stored in 8 bits"],
      "Only the -128 column can pull the total below 0.", ["What does a 1 in the left column do to the total?", "Can the other columns ever make it below 0?"]),
    why("pl-12", "Why do we add 1 after flipping the bits?", "Flipping alone gives a number 1 below the right answer",
      ["Adding 1 makes the number positive", "The register needs 9 bits", "Adding 1 removes the left bit"],
      "10 is 00001010. Flipped: 11110101 = -11. Adding 1 gives 11110110 = -10.", ["Work out the value of the flipped bits on their own.", "How far is that from the number you wanted?"]),
    why("pl-13", "Why must a positive two's complement number start with 0?", "A 1 in the left column would add -128 and make it negative",
      ["A 0 doubles the number", "The left bit is lost in a shift", "Positive numbers need 9 bits"],
      "A positive number is ordinary binary with nothing in the -128 column.", ["What is the left column worth?", "What would a 1 there do to the total?"]),
    why("pl-14", "Why can 10110100 mean 180 or -76?", "Ordinary binary gives the left column 128, two's complement gives it -128",
      ["The bits change when the number is stored", "Two's complement reads the bits right to left", "180 and -76 are the same number"],
      "The bits are the same; only the value of the left column changes. 180 - 256 = -76.", ["Compare the place value of the left column in each system.", "Which question tells you which system to use?"])
  ];
}
const DRILLS = [
  ['y11-1-9-read', 'Activity 1: is it positive or negative, and the denary value of two\'s complement binary.',
    'Year 11, 1.9: Read Two\'s Complement', 'Cambridge IGCSE Computer Science 0478',
    [['rd-sign', 'Positive or Negative?'], ['rd-den', 'The Denary Value']], 'read'],
  ['y11-1-9-make', 'Activity 2: flip and add 1, negative and positive denary numbers to two\'s complement.',
    'Year 11, 1.9: Make a Negative Number', 'Cambridge IGCSE Computer Science 0478',
    [['mk-flip', 'Flip the Bits'], ['mk-neg', 'Negative Numbers'], ['mk-pos', 'Positive Numbers']], 'make'],
  ['y11-1-9-twos', 'Plenary: reading and making two\'s complement numbers, the range and why it works.',
    'Year 11, 1.9: Two\'s Complement', 'Cambridge IGCSE Computer Science 0478',
    [['pl-read', 'Read It'], ['pl-make', 'Make It'], ['pl-range', 'The Range'], ['pl-why', 'Why It Works']], 'plenary'],
];
for (const [id, about, title, subtitle, cats, which] of DRILLS) {
  let body = tcCards.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  const src = drillHead(id, about) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${body})(${JSON.stringify(which)})\n});\n`;
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  { const bad = /sign and magnitude|one.s complement|\bbytes?\b|ascii|mario|\bdecimal\b|\bhex\b|\bRAM\b|overflow/i.exec(src.split(id).join('')); assert(!bad, `drill ${id} names an untaught term: ${bad}`); }
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
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
    let real = 0;
    for (const card of d.cards) {
      for (let n = 0; n < (card.randomize ? 400 : 1); n++) {
        const r = card.randomize ? { ...card, ...card.randomize() } : card;
        const ans = String(r.answers[0]);
        const bare = ans.replace(/\s+/g, '');
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: working nudges`);
        assert(!/[–—]/.test(JSON.stringify(r)), `${id} ${card.id}: dash`);
        if (/From Cambridge IGCSE/.test(r.note || '')) real++;
        if (r.pickThenType) { r.answers.forEach((a) => assert(!r.distractors.some((x) => x.toLowerCase() === a.toLowerCase()), `${id} ${card.id}: answer is a distractor`)); continue; }
        const pass = (s) => r.keywords.some((k) => k.test(s));
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  ', bare].forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        if (/^-\d+$/.test(ans)) ['−' + ans.slice(1), 'minus ' + ans.slice(1)].forEach((v) => assert(pass(v), `${id} ${card.id}: minus variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        let m;
        if ((m = /binary integer ([01]{8}) is stored\. What is its denary value/.exec(r.prompt))) assert(+ans === tc(m[1]) && !pass(String(-tc(m[1]) || 999)), `${id} ${card.id}: read ${r.prompt} ${ans}`);
        if ((m = /binary integer ([01]{8}) positive or negative/.exec(r.prompt))) assert(ans === (m[1][0] === '1' ? 'Negative' : 'Positive'), `${id} ${card.id}: sign`);
        if ((m = /write (\d+) as 8 bits: ([01]{8})\. Flip every bit/.exec(r.prompt))) assert(m[2] === bin8(+m[1]) && bare === flip(m[2]), `${id} ${card.id}: flip`);
        if ((m = /binary integer for the denary number (-?\d+)\./.exec(r.prompt))) assert(bare === bin8(+m[1]) && tc(bare) === +m[1], `${id} ${card.id}: make ${m[1]} ${ans}`);
        if ((m = /the (smallest|largest) denary number/.exec(r.prompt))) assert(+ans === (m[1] === 'smallest' ? -128 : 127), `${id} ${card.id}: range`);
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (!pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
      }
    }
    assert(real > 200, `${id}: real exam values drawn (${real})`);
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify({ steps, validators })), 'dash found');
assert(!/mario|\bdecimal\b/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: "1.9: Two's Complement", steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-8-shifts in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-8-shifts"/.exec(raw);
    assert(m && raw.split('"y11-1-8-shifts"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-8-shifts"').join(`"y11-1-8-shifts",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
