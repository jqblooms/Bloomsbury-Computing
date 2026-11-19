// Builds LessonData/y11-2-1-gates.json: Year 11, 2.1: NOT, AND and OR (Notes and Data Bridge).
//   node tools/build_y11_2_1_gates.mjs
// Plan: Week by week plan, tab "Year 11 2026-27", lesson 2.1 "NOT, AND and OR" (Paper 2: Logic gates, syllabus topic
// 10). It follows 1.1 to 1.9 (1.10 on the plan is a number systems exam-practice lesson, not a teaching lesson).
// Shape copied from tools/build_y10_3_1_l6b.mjs (James, 2026-11-18): about 20 minutes of note-taking with NO interactive
// activities (static diagrams and side-by-side truth tables, a Your Notes slide after each idea saying exactly what to
// write), then Data Bridge (pages BridgeBuilder/, registry bridge-builder, set y11-not-and-or, shell
// ExamGameSetY11Gates.gs: 12 real 0478 parts and 11 own).
// Difference from the Y10 model (James, 2026-11-19): a Do Now first, as docs/lessons.md:
//   Do Now 1: 0478/12 June 2026 Q1(c)(iii): -14 as an 8-bit two's complement integer, mark scheme 11110010 (1.9)
//   Do Now 2: 0478/13 November 2024 Q1(e): 10001110 to denary, working + answer, mark scheme -114 (1.9)
//   each with a Walk me through it on other values (never the answers), then the Extension reusing the 1.9 plenary
//   drill y11-1-9-twos.
// About 20 minutes of notes:
//   title 1, why-gates 1.5, notes-gates 1.5, not 1.5, notes-not 1.5, and 1.5, notes-and 1.5, or 1.5, notes-or 1.5,
//   compare 1.5, notes-compare 1.5, exam-style 1.5, notes-exam 1.5, notes-ready 0.5
// Then: Data Bridge: Use Your Notes, Play: Data Bridge.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-2-1-gates';
const PREV = 'y11-1-9-defence';
const P = 'y11-21g';
const SET = 'y11-not-and-or';
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const MONO = 'font-family:var(--font-mono, monospace)';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const two = (a, b, cols = '1fr 1fr') => `<div style="display:grid;grid-template-columns:${cols};gap:16px;align-items:start">${a}${b}</div>`;
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
const keyBox = (term, text) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:8px 14px;margin:10px 0 0;font-size:20px"><b>${term}</b> ${text}</div>`;
const why = (text) => `<p style="margin:10px 0 0;font-size:20px"><b>WHY?</b> ${text}</p>`;
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}

// ---------------------------------------------------------------- gates, worked out in code
const GATE = { NOT: (a) => 1 - a, AND: (a, b) => a & b, OR: (a, b) => a | b };
const ROWS2 = [[0, 0], [0, 1], [1, 0], [1, 1]];
const ROWS1 = [[0], [1]];
const outs = (g) => (g === 'NOT' ? ROWS1 : ROWS2).map((r) => GATE[g](...r));
assert(outs('NOT').join('') === '10' && outs('AND').join('') === '0001' && outs('OR').join('') === '0111', 'gate rules');

// A standard gate symbol as inline SVG (the shapes used in 0478 papers): inputs A (and B) on the left, output X.
function gateSvg(g, w = 170) {
  const S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"';
  const T = (x, y, t) => `<text x="${x}" y="${y}" font-size="17" font-weight="700" fill="currentColor" font-family="sans-serif">${t}</text>`;
  let body, ins, outX;
  if (g === 'NOT') {
    body = `<path d="M50 15 L100 40 L50 65 Z" ${S}/><circle cx="106" cy="40" r="6" ${S}/>`;
    ins = `<line x1="20" y1="40" x2="50" y2="40" ${S}/>` + T(2, 46, 'A');
    outX = 112;
  } else if (g === 'AND') {
    body = `<path d="M50 10 H80 A30 30 0 0 1 80 70 H50 Z" ${S}/>`;
    ins = `<line x1="20" y1="25" x2="50" y2="25" ${S}/><line x1="20" y1="55" x2="50" y2="55" ${S}/>` + T(2, 31, 'A') + T(2, 61, 'B');
    outX = 110;
  } else {
    body = `<path d="M46 10 Q84 10 114 40 Q84 70 46 70 Q62 40 46 10 Z" ${S}/>`;
    ins = `<line x1="20" y1="25" x2="52" y2="25" ${S}/><line x1="20" y1="55" x2="52" y2="55" ${S}/>` + T(2, 31, 'A') + T(2, 61, 'B');
    outX = 114;
  }
  return `<svg viewBox="0 0 170 80" width="${w}" height="${Math.round(w * 80 / 170)}" role="img" aria-label="${g} gate symbol" style="display:block;margin:0 auto;color:var(--ink, currentColor)">` +
    body + ins + `<line x1="${outX}" y1="40" x2="148" y2="40" ${S}/>` + T(152, 46, 'X') + '</svg>';
}
// A truth table: columns heads, rows of values; hl = row indexes to mark.
function tt(heads, rows, { hl = [], size = 20 } = {}) {
  const th = `padding:3px 14px;border:1px solid var(--line-strong);background:var(--surface-2);font-size:${size - 4}px`;
  const td = (i) => `padding:3px 14px;border:1px solid var(--line-strong);text-align:center;font:700 ${size}px var(--font-mono, monospace)` +
    (hl.includes(i) ? ';background:var(--brand-soft);color:var(--brand-dark)' : '');
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${heads.map((h) => `<th style="${th}">${h}</th>`).join('')}</tr>` +
    rows.map((r, i) => `<tr>${r.map((c) => `<td style="${td(i)}">${c}</td>`).join('')}</tr>`).join('') + '</table>';
}
const gateTable = (g, opts) => tt(g === 'NOT' ? ['A', 'X'] : ['A', 'B', 'X'], (g === 'NOT' ? ROWS1 : ROWS2).map((r) => [...r, GATE[g](...r)]), opts);
const card = (title, inner) => `<div style="border:2px solid var(--line);border-radius:10px;padding:8px 12px;text-align:center"><b style="font-size:19px">${title}</b>${inner}</div>`;

// ---------------------------------------------------------------- two's complement, for the Do Now (as y11-1-9-twos)
const val = (b) => [...b].reduce((t, c) => t * 2 + (c === '1' ? 1 : 0), 0);
const tc = (b) => val(b) - (b[0] === '1' ? 256 : 0);
const bin8 = (n) => (n < 0 ? n + 256 : n).toString(2).padStart(8, '0');
const flip = (b) => [...b].map((c) => (c === '1' ? '0' : '1')).join('');
const pvs = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const TPV = [-128, 64, 32, 16, 8, 4, 2, 1];
const terms = (b) => TPV.filter((_, i) => b[i] === '1');
const termText = (b) => terms(b).join(' + ');
const sumText = (b) => pvs(b.length).filter((_, i) => b[i] === '1').join(' + ');
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
const MINUS = '(-|\\u2212|\\u2013)';
const MINUS_W = '(-|\\u2212|\\u2013|minus\\s+|negative\\s+)';
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*(=\\s*)?${[...b].join('\\s*')}${BIN_TAIL}`;
const numFull = (n) => `^\\s*(=\\s*)?${n < 0 ? MINUS_W + '\\s*' + -n : '\\+?\\s*' + n}(\\s*(in\\s+)?denary)?\\s*\\.?\\s*$`;
const plus = '\\s*\\+\\s*';
function readWork(b) {
  const v = tc(b), rest = terms(b).filter((t) => t > 0);
  const neg = `${MINUS}\\s*128`;
  const fwd = [neg, ...rest].join(plus);
  const back = rest.length ? [...rest].reverse().join(plus) + `\\s*(\\+\\s*)?${neg}` : neg;
  const alts = b[0] === '1' ? [fwd, back, [...bin8(-v)].join('\\s*')] : [rest.join(plus), [...rest].reverse().join(plus)];
  return `^\\s*(${alts.map((a) => `(${a})`).join('|')})(\\s*=\\s*${MINUS}?\\s*\\d+)?\\s*\\.?\\s*$`;
}
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
const NEGHEAD = ';color:var(--bad, var(--danger, #b42318))';
function tcTable(bits, { hl = [], show = true } = {}) {
  const w = 46, f = 18, th = TH(w, f - 4);
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (hl.includes(i) ? HL : bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>`;
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${lab('Place value')}${TPV.map((p, i) => `<th style="${th}${i === 0 ? NEGHEAD : ''}">${p}</th>`).join('')}</tr>` +
    `<tr>${lab('Bit')}${[...bits].map((c, i) => `<td style="${td(i)}">${show ? c : ''}</td>`).join('')}</tr></table>`;
}
function flipTable(m, stage) {
  const pos = bin8(m), fl = flip(pos), ans = bin8(-m), w = 40, th = TH(w, 13);
  const base = `padding:4px 3px;min-width:${w}px;text-align:center;border:1px solid var(--line-strong);height:30px;font:700 19px var(--font-mono, monospace)`;
  const lab = (t, extra = '') => `<th style="${th};text-align:right;padding-right:10px;min-width:0${extra}">${t}</th>`;
  const row = (t, bits, show, { hl = false, top = false } = {}) => `<tr>${lab(t, top ? ';border-top:3px solid var(--ink, currentColor)' : '')}` +
    [...bits].map((c) => `<td style="${base}${top ? ';border-top:3px solid var(--ink, currentColor)' : ''}${show && hl ? HL : show && c === '0' ? ';color:var(--muted-2)' : ''}">${show ? c : ''}</td>`).join('') + '</tr>';
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${lab('Place value')}${TPV.map((p, i) => `<th style="${th}${i === 0 ? NEGHEAD : ''}">${p}</th>`).join('')}</tr>` +
    row(`+${m}`, pos, true) + row('Flipped', fl, stage >= 1, { hl: stage === 1 }) + row('+ 1', '00000001', stage >= 2) +
    row('Answer', ans, stage >= 2, { hl: stage === 2, top: true }) + '</table>';
}
const big = (t) => `<div style="text-align:center;${MONO};font-size:30px;font-weight:700;letter-spacing:3px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
function wtRead(b) {
  const v = tc(b);
  const out = [
    { text: `<strong>A similar question.</strong> Calculate the denary number for the two's complement binary integer ${b}. Show all your working.`, visual: big(spaced(b)) },
    { text: `Write the bits under the place values. In two's complement the left column is worth ${kw('-128')}.`, visual: tcTable(b) },
    { text: `The left bit is 1, so the number is below 0. Start the total at ${kw('-128')}.`, visual: tcTable(b, { hl: [0] }) },
  ];
  let t = -128;
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
function wtMake(n) {
  const b = bin8(n), m = -n, pos = bin8(m), fl = flip(pos);
  return { title: "Walk me through it: a negative number in two's complement", steps: [
    { text: `<strong>A similar question.</strong> Give the two's complement 8-bit binary integer that would be stored for the temperature of ${n} degrees Celsius.`, visual: big(String(n)) },
    { text: `Step 1: forget the minus sign. Write ${m} as 8-bit binary: ${sumText(pos)} = ${m}.`, visual: flipTable(m, 0) },
    { text: `Step 2: ${kw('flip')} every bit. Each 0 becomes 1 and each 1 becomes 0: ${spaced(fl)}.`, visual: flipTable(m, 1) },
    { text: `Step 3: ${kw('add 1')} to the flipped bits. Start at the right, with carries if you need them: ${spaced(b)}.`, visual: flipTable(m, 2) },
    { text: `Check with the place values: ${termText(b)} = ${n}.`, visual: line(kw(`${termText(b)} = ${n}`)) },
    { text: 'Now do the same for the question: the number without its minus sign in 8 bits, flip every bit, then add 1. Type all 8 bits.', visual: note('8 bits &nbsp; flip &nbsp; add 1 &nbsp; check with -128') },
  ] };
}

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, heading, lead, parts, whyQ, extra) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    const lab = parts.length > 1 ? `(${s}) ${p.label}` : p.label;
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${lab} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const cardHtml = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label: heading, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + tps(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + columns(extra, cardHtml) };
}
const GAME = '<strong>You will use these notes in Data Bridge.</strong>';
const NOTES = [];
function noteSlide(id, label, notes) {
  const boxes = notes.map(([head, text]) => {
    NOTES.push({ head, text });
    return `<div style="border-left:6px solid var(--brand);background:var(--surface-2);border-radius:8px;padding:6px 14px;margin:7px 0;font-size:20px"><b>${head}</b><br>${text}</div>`;
  }).join('');
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the pen icon at the top). Write the heading and the notes below. ' + GAME) + boxes };
}
// A note that has a symbol and a truth table to copy.
const drawNote = (g) => `<div style="display:flex;gap:24px;align-items:center;margin-top:4px">${gateSvg(g, 140)}${gateTable(g, { size: 17 })}</div>`;
const steps = [];

// ---------------------------------------------------------------- Do Now: 1.9 Two's Complement (real questions)
const DN = [
  { n: -14, ms: '11110010', ref: '0478/12, June 2026, Question 1(c)(iii)', wt: -37,
    lead: 'One item of data displayed on a smartwatch is the current outdoor temperature. The temperature is stored in a register as a two\'s complement binary integer. Give the two\'s complement 8-bit binary integer that would be stored for the temperature of -14 degrees Celsius.',
    whyQ: ['Why is a 1 on the left not enough on its own to make a number negative?', 'A 1 on the left only gives -128. The other bits must bring the total back up to the number you want.'] },
  { bits: '10001110', ms: -114, ref: '0478/13, November 2024, Question 1(e)', wt: '11100101',
    lead: 'Calculate the denary number for the two\'s complement binary integer 10001110. Show all your working.',
    whyQ: ['Why does the working earn a mark of its own?', 'It shows the examiner your method, so a small slip can still earn a mark.'] },
];
assert(bin8(DN[0].n) === DN[0].ms, 'Do Now 1 matches the mark scheme');
assert(tc(DN[1].bits) === DN[1].ms, 'Do Now 2 matches the mark scheme');
steps.push(checkStep('do-now', 'Do Now: Two\'s Complement (1 of 2)', 'Recap of 1.9 Two\'s Complement. ' + cite(DN[0].ref) + ' ' + DN[0].lead,
  [{ label: 'Two\'s complement 8-bit binary integer', answer: binFull(DN[0].ms),
    feedback: 'Write the number without its minus sign as 8 bits, flip every bit, then add 1. Type all 8 bits.' }],
  DN[0].whyQ, tcTable('00000000', { show: false })));
steps[0].walkthrough = wtMake(DN[0].wt);
steps.push(checkStep('do-now-2', 'Do Now: Two\'s Complement (2 of 2)', 'Recap of 1.9 Two\'s Complement. ' + cite(DN[1].ref) + ' ' + DN[1].lead, [
  { label: 'Working: the place values of the 1s, added', answer: readWork(DN[1].bits), feedback: 'Type the sum of the place values of the 1s, with -128 for a 1 in the left column, for example -128 + 64 + 1.' },
  { label: 'Denary value', answer: numFull(DN[1].ms), feedback: 'Write -128 over the left bit and the usual place values over the others. Add the place values of the 1s.' },
], DN[1].whyQ, tcTable(DN[1].bits)));
steps[1].walkthrough = wtRead(DN[1].wt);
// The walkthroughs never show the Do Now answers.
{
  const flat = (w) => JSON.stringify(w).replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  assert(!flat(steps[0].walkthrough).includes(DN[0].ms) && !/(^|[^0-9])14([^0-9]|$)/.test(JSON.stringify(steps[0].walkthrough).replace(/<[^>]*>/g, ' ')), 'walkthrough 1 shows the answer');
  assert(!flat(steps[1].walkthrough).includes('114') && !flat(steps[1].walkthrough).includes(DN[1].bits), 'walkthrough 2 shows the question or answer');
  const v1 = validators[`${P}_do_now`.replace(/-/g, "_")][0].pattern, v2 = validators[`${P}_do_now_2`.replace(/-/g, "_")];
  const R = (p) => new RegExp(p.source, p.flags);
  assert(R(v1).test('11110010') && R(v1).test('1111 0010') && !R(v1).test('00001110') && !R(v1).test('11110001'), 'Do Now 1 validator');
  assert(R(v2[0].pattern).test('-128 + 8 + 4 + 2') && R(v2[0].pattern).test('-128+8+4+2 = -114') && !R(v2[0].pattern).test('128 + 8 + 4 + 2'), 'Do Now 2 working validator');
  assert(R(v2[1].pattern).test('-114') && R(v2[1].pattern).test('minus 114') && !R(v2[1].pattern).test('114') && !R(v2[1].pattern).test('142'), 'Do Now 2 answer validator');
}
steps.push({ id: 'do-now-ext', label: 'Extension: Do Now Challenge', type: 'embedded-app', appId: 'drill-y11-1-9-twos', embedContainerId: `${P}-do-now-ext`,
  content: '<h2 class="lesson-h2">Extension: Do Now Challenge</h2>' +
    tps('Why does each card use new numbers?', 'Then you practise the method, not one answer.') +
    '<p class="lesson-lead"><strong>Extension:</strong> finished the Do Now? Try these two\'s complement cards from 1.9. Stuck? Switch on <strong>I need help</strong>.</p>' +
    `<div id="${P}-do-now-ext"></div>` });

// ---------------------------------------------------------------- title (1 min)
steps.push({ id: 'title', label: 'NOT, AND and OR',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">10 Boolean Logic</p><h2 class="lesson-h2">NOT, AND and OR</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> about 20 minutes of notes. Then use your notes in <strong>Data Bridge</strong>.',
      'The big question: <strong>how</strong> can a computer make a decision with only 0s and 1s?']) +
    tps('A car beeps when you leave its lights on. What does the car need to check before it beeps?', 'Collect ideas: are the lights on, is the engine off, is the door open. Today shows how a circuit checks things like these.') });

// ---------------------------------------------------------------- idea 1: logic gates (1.5 + 1.5)
steps.push({ id: 'why-gates', label: 'What Is a Logic Gate?',
  content: '<h2 class="lesson-h2">What Is a Logic Gate?</h2>' +
    two(facts(['Inside a computer, <strong>1</strong> means on (true) and <strong>0</strong> means off (false).',
      'An <strong>input</strong> goes in: 0 or 1, from a switch or a sensor.', 'The <strong>output</strong> comes out: 0 or 1, to a lamp, a motor or another circuit.']),
      `<div style="display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px;margin-top:10px">` +
      `<div style="${MONO};text-align:right">A = 1<br>B = 0</div><div style="font-size:28px">&rarr;</div>` +
      `<div style="border:3px solid var(--brand);border-radius:10px;padding:16px 20px;font-weight:700">logic gate</div><div style="font-size:28px">&rarr;</div><div style="${MONO}">X = ?</div></div>`, '1.2fr 1fr') +
    keyBox('Logic gate:', 'a circuit that takes one or two inputs of 0 or 1 and gives one output of 0 or 1.') +
    why('A computer makes every decision this way: it checks inputs that are on or off, then switches an output on or off.') +
    tps('A lamp has two switches. Which rules could decide when the lamp is on?', 'Collect ideas. Today shows three rules, one for each gate.') });
steps.push(noteSlide('notes-gates', 'Your Notes: Logic Gates', [
  ['Logic gate', 'A circuit that takes one or two inputs of 0 or 1 and gives one output of 0 or 1.'],
  ['1 and 0', '1 means on (true). 0 means off (false).'],
  ['WHY logic gates matter', 'A computer makes every decision by checking inputs and switching an output on or off.']]));

// ---------------------------------------------------------------- idea 2: NOT and the truth table (1.5 + 1.5)
steps.push({ id: 'not', label: 'The NOT Gate',
  content: '<h2 class="lesson-h2">The NOT Gate</h2>' +
    two(card('Symbol', gateSvg('NOT') + '<p style="margin:4px 0 0;font-size:17px">A triangle with a small circle at its point.<br>The circle means <b>flip</b>.</p>'),
      card('Truth table', gateTable('NOT') + '<p style="margin:4px 0 0;font-size:17px">X is always the opposite of A.</p>')) +
    keyBox('NOT gate:', 'one input. The output is the opposite of the input.') +
    keyBox('Truth table:', 'a table that shows the output for every possible input.') +
    why('NOT has only 2 rows: one input can only be 0 or 1.') +
    tps('A heater should switch on when the room is not warm. Why would a circuit need to flip a 1 into a 0?', 'Ideas: the sensor gives 1 for warm, but the heater must be on when that is 0.') });
steps.push(noteSlide('notes-not', 'Your Notes: The NOT Gate', [
  ['NOT gate', 'One input. The output is the opposite of the input.'],
  ['Truth table', 'A table that shows the output for every possible input.'],
  ['Copy the NOT symbol and truth table', drawNote('NOT')]]));

// ---------------------------------------------------------------- idea 3: AND (1.5 + 1.5)
steps.push({ id: 'and', label: 'The AND Gate',
  content: '<h2 class="lesson-h2">The AND Gate</h2>' +
    two(card('Symbol', gateSvg('AND') + '<p style="margin:4px 0 0;font-size:17px">A flat back and a round front, like a <b>D</b>.</p>'),
      card('Truth table', gateTable('AND', { hl: [3] }) + '<p style="margin:4px 0 0;font-size:17px">Only the last row gives 1.</p>')) +
    keyBox('AND gate:', 'two inputs. The output is 1 only when A is 1 <b>and</b> B is 1.') +
    facts(['Example: a car starts only if the key is turned <b>and</b> the brake is pressed.',
      'Rows in this order: 00, 01, 10, 11. Count up in binary, so no row is missed.']) +
    why('4 rows: each input can be 0 or 1, so 2 x 2 = 4 sets of inputs.') +
    tps('Why is it safer for a car to need the key and the brake, not just one of them?', 'Ideas: a key turned by accident, or a foot on the brake alone, cannot start it.') });
steps.push(noteSlide('notes-and', 'Your Notes: The AND Gate', [
  ['AND gate', 'Two inputs. The output is 1 only when both inputs are 1.'],
  ['WHY a two-input truth table has 4 rows', 'Each input can be 0 or 1, so 2 x 2 = 4 rows: 00, 01, 10, 11.'],
  ['Copy the AND symbol and truth table', drawNote('AND')]]));

// ---------------------------------------------------------------- idea 4: OR (1.5 + 1.5)
steps.push({ id: 'or', label: 'The OR Gate',
  content: '<h2 class="lesson-h2">The OR Gate</h2>' +
    two(card('Symbol', gateSvg('OR') + '<p style="margin:4px 0 0;font-size:17px">A curved back and a pointed front.</p>'),
      card('Truth table', gateTable('OR', { hl: [1, 2, 3] }) + '<p style="margin:4px 0 0;font-size:17px">Only the first row gives 0.</p>')) +
    keyBox('OR gate:', 'two inputs. The output is 1 when A is 1, <b>or</b> B is 1, or both: at least one input is 1.') +
    facts(['Example: a doorbell rings if the front button <b>or</b> the back button is pressed.']) +
    why('The row 11 gives 1: OR needs at least one input to be 1, and two is more than enough.') +
    tps('A house alarm has a sensor on the door and a sensor on the window. Why should one sensor be enough to sound it?', 'A thief only needs to open one of them to get in.') });
steps.push(noteSlide('notes-or', 'Your Notes: The OR Gate', [
  ['OR gate', 'Two inputs. The output is 1 when at least one input is 1.'],
  ['WHY 11 gives 1 for OR', 'OR needs at least one input to be 1. Both inputs on is more than enough.'],
  ['Copy the OR symbol and truth table', drawNote('OR')]]));

// ---------------------------------------------------------------- idea 5: AND against OR (1.5 + 1.5)
steps.push({ id: 'compare', label: 'AND and OR: Side by Side',
  content: '<h2 class="lesson-h2">AND and OR: Side by Side</h2>' +
    two(tt(['A', 'B', 'AND', 'OR'], ROWS2.map((r) => [...r, GATE.AND(...r), GATE.OR(...r)]), { hl: [1, 2] }),
      facts(['Rows 00 and 11: AND and OR give the <b>same</b> output.', 'Rows 01 and 10 (highlighted): they are <b>different</b>. AND gives 0, OR gives 1.',
        'Words to spot in a problem: <b>and</b>, <b>both</b> mean AND. <b>or</b>, <b>either</b>, <b>at least one</b> mean OR. <b>not</b>, <b>is off</b> mean NOT.']), '0.8fr 1.2fr') +
    why('AND needs <b>every</b> input to be 1. OR needs <b>at least one</b>. They only disagree when one input is 1 and the other is 0.') +
    tps('Before you read the table: in which rows do you think AND and OR will give different outputs?', 'Make a guess, then check the highlighted rows.') });
steps.push(noteSlide('notes-compare', 'Your Notes: AND or OR?', [
  ['WHY AND and OR differ in rows 01 and 10', 'AND needs every input to be 1. OR needs at least one input to be 1.'],
  ['Words to spot in a problem', '<b>and</b>, <b>both</b>: AND. <b>or</b>, <b>either</b>, <b>at least one</b>: OR. <b>not</b>, <b>is off</b>: NOT.'],
  ['Name the gate from its truth table', 'Only 11 gives 1: AND. Only 00 gives 0: OR. The output is the opposite of the input: NOT.']]));

// ---------------------------------------------------------------- idea 6: how the exam writes it (1.5 + 1.5)
steps.push({ id: 'exam-style', label: 'How the Exam Writes It',
  content: '<h2 class="lesson-h2">How the Exam Writes It</h2>' +
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">` +
    ['NOT', 'AND', 'OR'].map((g) => card(g, gateSvg(g, 150) + `<div style="${MONO};font-size:20px;margin-top:2px">${g === 'NOT' ? 'X = NOT A' : `X = A ${g} B`}</div>`)).join('') + '</div>' +
    keyBox('Logic expression:', 'the gates written in words, such as X = A AND B. The exam also calls it a <b>Boolean expression</b>.') +
    facts(['The exam asks you to: match a symbol to its name, complete a truth table, and name a gate from a table or a description.']) +
    why('A circuit diagram shows symbols with no names on them. You must know each gate by its shape.') +
    tps('Why does the exam always list the rows in the order 00, 01, 10, 11?', 'Ideas: counting up in binary means every set of inputs is there, once.') });
steps.push(noteSlide('notes-exam', 'Your Notes: Exam Style', [
  ['Logic expression', 'The gates written in words: X = NOT A, X = A AND B, X = A OR B. Also called a Boolean expression.'],
  ['Truth table rows', 'Always in this order: 00, 01, 10, 11.'],
  ['WHY learn the symbols', 'Circuit diagrams show the shapes only, with no names on them.']]));

// ---------------------------------------------------------------- notes ready (0.5), then Data Bridge
steps.push({ id: 'notes-ready', label: 'Your Notes: Ready for Data Bridge',
  content: '<h2 class="lesson-h2">Your Notes: Ready for Data Bridge</h2>' +
    todo('open your notes (the pen icon at the top). You should have these six headings. Missing one? Go back to its slide and write it. ' + GAME) +
    facts(['<strong>Logic Gates</strong>: what a logic gate is, and what 1 and 0 mean.',
      '<strong>The NOT Gate</strong>: what it does, its symbol and its truth table.',
      '<strong>The AND Gate</strong>: what it does, its symbol, its truth table and WHY 4 rows.',
      '<strong>The OR Gate</strong>: what it does, its symbol, its truth table and WHY 11 gives 1.',
      '<strong>AND or OR?</strong>: the words to spot, and how to name a gate from its truth table.',
      '<strong>Exam Style</strong>: logic expressions, the row order and WHY to learn the symbols.']) });
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
    '<li><strong>Answer the questions</strong> to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' + tps('Why keep your notes open while you play?', 'The questions use the same ideas. Your notes help you answer them right the first time.') + `<div id="${P}-game"></div>`,
  embedQuery: `set=${SET}&goal=3` });

// ---------------------------------------------------------------- self-checks
const seen = (s) => JSON.stringify(s);
const all = JSON.stringify({ steps, validators });
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'emoji found');
assert(!/\bdecimal\b|mario|NAND|NOR|XOR/.test(all), 'term outside this lesson');
// Only the Do Now asks for answers. The notes part has nothing to answer; only the Do Now Extension drill and the game are embedded.
const firstNote = steps.findIndex((s) => s.id === 'title');
steps.forEach((s, i) => {
  if (i < firstNote) { assert(s.id.startsWith('do-now'), s.id + ' before the title'); return; }
  assert(!s.type || s.type === 'embedded-app', s.id + ' is an activity type: ' + s.type);
  if (s.type === 'embedded-app') assert(s.id === 'game', s.id + ' embeds ' + s.appId);
  assert(!/<input|<textarea|lesson-note-reveal|Check my|predict/i.test(s.content), s.id + ' asks for an answer');
});
assert(steps.slice(0, 3).map((s) => s.id).join() === 'do-now,do-now-2,do-now-ext' && steps[0].walkthrough && steps[1].walkthrough, 'Do Now, walkthroughs, Extension');
assert(steps[2].content.includes('<strong>Extension:</strong>'), 'Extension lead');
// No term before the slide that teaches it (the title excepted).
const firstTaught = { 'logic gate': 'why-gates', 'truth table': 'not', 'logic expression': 'exam-style', boolean: 'exam-style' };
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(0, idx).filter((s) => s.id !== 'title').forEach((s) => assert(!new RegExp('\\b' + term, 'i').test(seen(s).replace(/<[^>]*>/g, ' ')), `"${term}" on ${s.id}, before ${at}`));
}
assert(!/logic gate|truth table|expression/i.test(seen(steps[firstNote])), 'title uses a term from this lesson');
// After each idea, a Your Notes slide that says the notes are for Data Bridge.
const noteIds = steps.filter((s) => s.id.startsWith('notes-')).map((s) => s.id);
assert(noteIds.join() === 'notes-gates,notes-not,notes-and,notes-or,notes-compare,notes-exam,notes-ready', 'notes slides ' + noteIds);
noteIds.forEach((id) => assert(steps.find((s) => s.id === id).content.includes('You will use these notes in Data Bridge.'), id + ' game line'));
assert(NOTES.length === 18 && NOTES.every((n) => n.head && n.text), 'notes ' + NOTES.length);
// Every truth table on the slides comes from the gate rules (no hand-typed outputs).
assert(gateTable('AND').includes('>1</td></tr></table>') && (gateTable('AND').match(/>0<\/td><\/tr>/g) || []).length === 3, 'AND table');
// The game: Data Bridge with this lesson's set; the how-to slide has three lines.
const game = steps.at(-1);
assert(game.appId === 'bridge-builder' && game.embedQuery === `set=${SET}&goal=3` && steps.at(-2).id === 'how-to-play', 'game slides');
assert((steps.at(-2).content.match(/<li>/g) || []).length === 3, 'three lines on how to play');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
// About 20 minutes of notes.
const MINUTES = { title: 1, 'why-gates': 1.5, 'notes-gates': 1.5, not: 1.5, 'notes-not': 1.5, and: 1.5, 'notes-and': 1.5, or: 1.5, 'notes-or': 1.5,
  compare: 1.5, 'notes-compare': 1.5, 'exam-style': 1.5, 'notes-exam': 1.5, 'notes-ready': 0.5 };
const total = Object.values(MINUTES).reduce((a, b) => a + b, 0);
assert(steps.slice(firstNote, -2).every((s) => MINUTES[s.id]) && Object.keys(MINUTES).length === steps.length - firstNote - 2 && total >= 18 && total <= 22, 'timing ' + total);

const lesson = { id: ID, label: '2.1: NOT, AND and OR', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: a new Year 11 unit "10 Boolean Logic" after 1.1 Number Systems
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const years = data.years || data;
    const y11 = years.find((y) => y.id === 'year11');
    assert(y11, 'year11 in lessons.json');
    const at = y11.units.findIndex((u) => (u.lessons || []).includes(PREV));
    assert(at >= 0, 'unit holding ' + PREV);
    y11.units.splice(at + 1, 0, { code: '10', title: 'Boolean Logic', lessons: [ID] });
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${NOTES.length} notes, about ${total} minutes of notes`);
