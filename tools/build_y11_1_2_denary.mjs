// Builds LessonData/y11-1-2-denary.json: Year 11, 1.2: Denary to Binary (syllabus 0478 1.1: convert denary to 8-bit
// binary, and check a conversion by converting back). The second lesson of the 2026-27 Year 11 plan, after
// y11-1-1-binary. Hexadecimal comes later, so it is not taught or asked here.
//   node tools/build_y11_1_2_denary.mjs
// It also writes the lesson's three drills and adds the lesson to Year 11's "1.1 Number Systems" unit, straight after
// y11-1-1-binary (a one-line insert into lessons.json; the rest of the file is left as it is).
// Shape: EAL-light, one idea per slide, every slide's core question a WHY (Term 1b), a teacher-only Think, Pair, Share
// under every heading, predict-then-check, compare slides.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers:
//   Do Now:   0478/11 November 2025 Q1(a) (255) and Q1(c) (00001011 = 11); 0478/13 June 2025 Q1(c)(i) (25, 180)
//   Exam:     0478/11 June 2023 Q1(b) (50, 102, 221); 0478/13 November 2025 Q1(b)(i) and (ii) (24, 101);
//             0478/12 March 2021 Q1(a) (46, 171); 0478/11 June 2022 Q4(b) (64, 101, 242);
//             0478/11 November 2023 Q2(b) ($14.98: 14, 98); 0478/13 June 2026 Q8(a) (071, 200);
//             0478/11 November 2025 Q1(b) (23, 168); 0478/13 November 2023 Q2(b) (14, 59, 234);
//             0478/12 June 2024 Q3(b)(i) (10, 50, 201) and (ii) (explain why binary; self-marked);
//             0478/13 November 2024 Q1(c)(i) (175, with working)
//   Practice: 0478/12 June 2021 Q1(a), binary column only (49, 123, 200); 0478/12 June 2025 Q1(c) (19, 230);
//             0478/11 November 2024 Q3(b)(i), adapted (65, 109; the ASCII context left out)
//   Drills only: 0478/11 June 2021 Q1(a) (167, 214); 0478/12 November 2024 Q3(b) (15, 180, 235);
//             0478/11 June 2022 Q4(a) and 0478/11 November 2023 Q2(d) (explain why binary)
// Drills: y11-1-2-ext (Do Now Extension), y11-1-2-fit (Activity 2), y11-1-2-binary (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-2-denary';
const P = 'y11-12d';
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

// ---------------------------------------------------------------- binary, worked out in code
const val = (b) => [...b].reduce((t, c) => t * 2 + (c === '1' ? 1 : 0), 0);
const pvs = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const PV8 = pvs(8);
const bin8 = (n) => n.toString(2).padStart(8, '0');
const onVals = (b) => pvs(b.length).filter((_, i) => b[i] === '1');
const sumText = (b) => onVals(b).join(' + ');
const onIdx = (b) => [...b].map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0);
// A number answer: the number, optionally "= " before it or "in denary" after it.
const num = (n) => `^\\s*(=\\s*)?${n}(\\s*(in\\s+)?(denary|base\\s*10))?\\s*\\.?\\s*$`;
// A binary answer. 8-bit: all 8 bits, spaces anywhere. Otherwise the 0s on the left may be left out, as the mark
// schemes allow ("(000)11000").
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const bin8Ans = (b) => `^\\s*${[...b].join('(?:\\s*)')}${BIN_TAIL}`;
const binAnyAns = (b) => `^\\s*(?:0\\s*)*${[...b.replace(/^0+(?=.)/, '')].join('(?:\\s*)')}${BIN_TAIL}`;

// Subtract method: for each place value, what is left before it, whether it fits, and the bit.
function fitRows(n) {
  let left = n;
  return PV8.map((p) => { const before = left, fits = left >= p; if (fits) left -= p; return { p, before, fits, bit: fits ? '1' : '0', after: left }; });
}
const subtractText = (n) => fitRows(n).filter((r) => r.fits).map((r) => `${r.before} - ${r.p} = ${r.after}`).join(' &rarr; ');

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
function bitTable(bits, { hl = [], n = bits ? bits.length : 8, size = 'lg', label = true, bitWord = 'Bit' } = {}) {
  const w = size === 'lg' ? 58 : 46, f = size === 'lg' ? 22 : 18;
  const th = `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f - 4}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
  const td = (i) => `padding:6px 4px;min-width:${w}px;height:${w - 10}px;text-align:center;font:700 ${f}px var(--font-mono, monospace);border:1px solid var(--line-strong)` +
    (hl.includes(i) ? ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px' : bits && bits[i] === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => label ? `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>` : '';
  const head = `<tr>${lab('Place value')}${pvs(n).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>`;
  const body = bits ? `<tr>${lab(bitWord)}${[...bits].map((c, i) => `<td style="${td(i)}">${c}</td>`).join('')}</tr>` : '';
  return `<table style="border-collapse:collapse;margin:0 auto">${head}${body}</table>`;
}
// The subtract method as a table: place values, what is left before each one, and the bit. Columns from `upto` on
// are blank; `hl` marks one column.
function fitTable(n, { upto = 8, hl = -1 } = {}) {
  const rows = fitRows(n);
  const th = 'padding:5px 4px;min-width:46px;text-align:center;font-weight:700;font-size:14px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)';
  const lab = (t) => `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>`;
  const td = (i, t, mono) => `<td style="padding:5px 4px;min-width:46px;text-align:center;border:1px solid var(--line-strong);${mono ? `font:700 20px var(--font-mono, monospace)` : 'font-size:16px'}` +
    (i === hl ? ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px' : '') + `">${i < upto ? t : ''}</td>`;
  return '<table style="border-collapse:collapse;margin:0 auto">' +
    `<tr>${lab('Place value')}${PV8.map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>` +
    `<tr>${lab('Left')}${rows.map((r, i) => td(i, r.before, false)).join('')}</tr>` +
    `<tr>${lab('Bit')}${rows.map((r, i) => td(i, r.bit, true)).join('')}</tr></table>`;
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
function checkStep(id, label, heading, lead, parts, whyQ, extra = '') {
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
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
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
// Self-marked written answers. modelAnswer is the shortest answer that earns the marks; scheme holds the mark scheme,
// one point per mark, in the format AI marking reads (Marking.gs). Add aiMark: false to keep one self-marked.
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
const sideTable = bitTable(null, { size: 'sm', label: false });
const conv8 = (n, extra = {}) => Object.assign({ label: String(n), answer: bin8Ans(bin8(n)), feedback: 'Start at 128. Does it fit in what is left? Write 1 and subtract, or write 0.' }, extra);
const convAny = (n, extra = {}) => Object.assign({ label: String(n), answer: binAnyAns(bin8(n)), feedback: 'Start at 128. Does it fit in what is left? Write 1 and subtract, or write 0.' }, extra);

// ---------------------------------------------------------------- Do Now 1 (1.1): 0478/11 November 2025 Q1(a) and (c)
// Mark scheme: 1(a) 255; 1(c) 11.
const DN1C = '00001011';
const WT_4 = '00000110';
const WT_DN1 = { title: 'Walk me through it: the highest value, then binary to denary', steps: [
  { text: '<strong>A similar question.</strong> A register has <strong>4 bits</strong>. What is the highest denary number it can store?', visual: bitTable(null, { n: 4, size: 'sm' }) },
  { text: 'The highest number has <strong>every bit set to 1</strong>. Then every place value is added.', visual: bitTable('1111', { hl: [0, 1, 2, 3], size: 'sm' }) },
  { text: 'Add all the place values: 8 + 4 + 2 + 1 = 15. So a 4-bit register can store up to <strong>15</strong>.', visual: line(kw('8 + 4 + 2 + 1 = 15')) },
  { text: `<strong>Next, a similar binary number.</strong> Convert ${WT_4} to denary.`, visual: bitTable(WT_4, { size: 'sm' }) },
  { text: 'Find each 1. The 1s are under the place values <strong>4</strong> and <strong>2</strong>. Every 0 adds nothing.', visual: bitTable(WT_4, { hl: onIdx(WT_4), size: 'sm' }) },
  { text: `Add them: ${sumText(WT_4)} = ${val(WT_4)}. So ${WT_4} is <strong>${val(WT_4)}</strong> in denary.`, visual: line(kw(`${sumText(WT_4)} = ${val(WT_4)}`)) },
  { text: `Now your question. For (a), set all <strong>8</strong> bits to 1 and add all 8 place values. For (c), find each 1 in ${DN1C}, then add.`, visual: note('(a) every bit is 1, add them all &nbsp; (c) find each 1, then add') },
] };
steps.push(checkStep('do-now', 'Do Now: Binary to Denary (1 of 2)', 'Do Now: Binary to Denary (1 of 2)',
  'Recap of 1.1 Binary Place Values. ' + cite('0478/11, November 2025, Question 1(a) and (c)') +
    ' A student has a calculator with 8-bit registers. (A register is a small store inside the computer.)', [
    { label: 'State the highest denary number that could be stored in a single 8-bit register.', answer: num(255), feedback: 'Which bits are 1 in the highest 8-bit number? Add their place values.' },
    { label: `The result of a calculation stored in a register is the binary number ${DN1C}. Give the denary number that will be displayed on the screen.`, answer: num(val(DN1C)), feedback: 'Find each 1. Add its place value.' },
  ], ['Why does a 0 in a binary number add nothing to the denary value?', 'A 0 means that column is off. Only the columns with a 1 are counted.'],
  sideTable));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2 (1.1): 0478/13 June 2025 Q1(c)(i)
// Mark scheme: 25; 180 (one mark each).
const DN2 = ['00011001', '10110100'];
const WT_B = '01001010';
const WT_DN2 = { title: 'Walk me through it: binary to denary', steps: [
  { text: `<strong>A similar question.</strong> Convert the binary number ${WT_B} to denary.`, visual: big(WT_B) },
  { text: 'Write the 8 place values. Start at 1 on the right and double each time.', visual: bitTable(null, { size: 'sm' }) },
  { text: 'Write the bits under the place values, one bit in each column.', visual: bitTable(WT_B, { size: 'sm' }) },
  { text: 'Find each <strong>1</strong>. Read the place value above it.', visual: bitTable(WT_B, { hl: onIdx(WT_B), size: 'sm' }) + line(onVals(WT_B).join(', ')) },
  { text: `Add those place values: ${sumText(WT_B)} = ${val(WT_B)}.`, visual: line(kw(`${sumText(WT_B)} = ${val(WT_B)}`)) },
  { text: `So ${WT_B} is <strong>${val(WT_B)}</strong> in denary.`, visual: bitTable(WT_B, { hl: onIdx(WT_B), size: 'sm' }) },
  { text: 'Now do the same for each number in the question: place values, find each 1, then add.', visual: note('place values &rarr; find each 1 &rarr; add') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Binary to Denary (2 of 2)', 'Do Now: Binary to Denary (2 of 2)',
  'Recap of 1.1 Binary Place Values. ' + cite('0478/13, June 2025, Question 1(c)(i)') +
    ` A student records himself singing a song. The sound is converted to binary. Two binary numbers stored from the recording are ${DN2[0]} and ${DN2[1]}. Convert the two binary numbers to denary numbers.`,
  DN2.map((b) => ({ label: b, answer: num(val(b)), feedback: 'Find each 1. Add its place value.' })),
  ['Why is the leftmost bit worth so much more than the rightmost bit?', 'Each place value doubles as you move left. The leftmost is 128 and the rightmost is 1.'],
  sideTable));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Denary to Binary',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Denary to Binary</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> turn a denary number into <strong>8-bit binary</strong>.', 'Why we start with the <strong>biggest place value</strong>.', 'How to <strong>check</strong> an answer by converting it back.']) +
    why('Why might a computer need to turn our denary numbers into binary?', 'A computer is made of switches that are on or off. It can only store 1s and 0s.') });

// ---------------------------------------------------------------- going the other way
const REV = [5, 7, 12];
const revCard = (n) => { const b = n.toString(2).padStart(4, '0'); return box(bitTable(b, { hl: onIdx(b), n: 4, size: 'sm' }) + line(`${n} = ${onVals(b).join(' + ')} &rarr; <strong>${b}</strong>`)); };
steps.push(concept('concept-reverse', 'Going the Other Way',
  'Binary to denary: add the place values that have a 1. Predict: to go the other way, what must we find?',
  '<p>We must find <strong>which place values add up to the number</strong>. Each of those gets a 1. Every other place value gets a 0.</p>',
  columns(facts(['<strong>Binary to denary:</strong> add the place values that have a 1.', '<strong>Denary to binary:</strong> find the place values that add up to the number.',
    'Write a <strong>1</strong> under each of them.', 'Write a <strong>0</strong> under every other place value.']),
    '<div style="display:grid;gap:8px">' + REV.map(revCard).join('') + '</div>')));

const C4 = [6, 9];
steps.push(checkStep('check-4bit', 'Check: 4-Bit Binary', 'Check: 4-Bit Binary', 'Find the place values that add up to each number. Write it as 4-bit binary.',
  C4.map((n) => ({ label: String(n), answer: bin8Ans(n.toString(2).padStart(4, '0')), feedback: 'Which of 8, 4, 2, 1 add up to it? Write 1 under those, 0 under the rest. Write all 4 bits.' })),
  ['Why does every 4-bit number use the same four place values?', 'The columns never change. Only the bits under them change.'],
  bitTable(null, { n: 4, size: 'lg' })));

// ---------------------------------------------------------------- why start with the biggest
const BIG = 13;
const bigFirst = box(boxTitle('Start with the biggest') +
  boxLine('8 fits in 13: write 1. 13 - 8 = 5 left.') + boxLine('4 fits in 5: write 1. 5 - 4 = 1 left.') +
  boxLine('2 is too big for 1: write 0.') + boxLine('1 fits in 1: write 1. 0 left.') + verdict('Done: 13 is 1101.', true));
const smallFirst = box(boxTitle('Start with the smallest') +
  boxLine('Take 1: 12 left.') + boxLine('Take 2: 10 left.') + boxLine('Take 4: 6 left.') + boxLine('8 is too big for 6.') +
  verdict('Stuck: 6 is left and no place values are left.', false));
steps.push(concept('concept-biggest', 'Why Start With the Biggest?',
  `Predict: to make ${BIG} from 8, 4, 2 and 1, why start with the 8, not the 1?`,
  '<p>The 8 is bigger than 4 + 2 + 1 = 7 added together. If you skip the 8, the small ones can never make 13.</p>',
  facts(['Each place value is <strong>bigger than all the place values to its right</strong> added together.', '128 is more than 64 + 32 + 16 + 8 + 4 + 2 + 1 = 127.',
    'So if the biggest one fits, you <strong>must</strong> use it.']) + columns(bigFirst, smallFirst)));

steps.push(mcStep('predict-first', 'Predict: Where Does the First 1 Go? (1 of 2)', 'Predict: Where Does the First 1 Go? (1 of 2)', 'Predict before you click. You get one try.', [
  { prompt: 'You convert 100 to 8-bit binary. Which place value gets the first 1?', options: ['128', '64', '32', '100'], correct: 1,
    explain: '128 is bigger than 100, so it does not fit. 64 is the biggest place value that fits.' },
], ['To make 5, why can the 8 column not have a 1?', 'A 1 there adds 8, which is already more than 5.']));
steps.push(mcStep('predict-first-2', 'Predict: Where Does the First 1 Go? (2 of 2)', 'Predict: Where Does the First 1 Go? (2 of 2)', 'Predict before you click. You get one try.', [
  { prompt: 'You convert 40 to 8-bit binary. Which place value gets the first 1?', options: ['16', '64', '8', '32'], correct: 3,
    explain: '64 is bigger than 40, so it does not fit. 32 is the biggest place value that fits.' },
], ['To make 3, why can the 4 column not have a 1?', 'A 1 there adds 4, which is already more than 3.']));

// ---------------------------------------------------------------- the subtract method
const SUB = 77;
steps.push(concept('concept-subtract', 'The Subtract Method',
  `For ${SUB}, a 1 goes under 64. Why do we subtract 64 before we move on?`,
  `<p>64 of the ${SUB} is now stored. Only ${SUB - 64} is left to make from the smaller place values.</p>`,
  facts(['Write the 8 place values. Start on the left.', 'Ask: does this place value <strong>fit</strong> in what is left?', '<strong>Fits:</strong> write 1 and subtract it.',
    '<strong>Too big:</strong> write 0. What is left stays the same.', 'When 0 is left, every other bit is 0.']) +
  '<div style="display:grid;gap:8px;margin-top:4px">' + fitTable(SUB) + line(subtractText(SUB)) + line(`${SUB} in 8-bit binary is <strong>${bin8(SUB)}</strong>`) + '</div>'));

steps.push({ id: 'stepper', label: 'Worked Example: 150', type: 'stepper', stepperId: `${P}-stepper`, stepperKey: 'denary_to_binary',
  content: '<h2 class="lesson-h2">Worked Example: 150</h2>' +
    why('Why do we write a 0 when a place value is too big, and not just skip that column?', 'Every column needs a bit. The 0 keeps each 1 under its own place value.') +
    '<p class="lesson-lead">Press <strong>Next step</strong>. One column at a time.</p>' +
    `<div id="${P}-stepper" class="lesson-stepper"></div>` });

// ---------------------------------------------------------------- first exam question
// 0478/11 June 2023 Q1(b). Mark scheme: 00110010; 01100110; 11011101.
const E1 = [50, 102, 221];
steps.push(checkStep('exam-1', 'Exam Question: Convert to 8-Bit Binary (1 of 9)', 'Exam Question: Convert to 8-Bit Binary (1 of 9)',
  cite('0478/11, June 2023, Question 1(b)') + ' Convert these three denary numbers to 8-bit binary numbers.',
  E1.map((n) => conv8(n)),
  ['The paper gives a working space for these 1-mark questions. Why use it?', 'Writing what is left after each place value shows every step, so a slip is easy to find.'], sideTable));

// ---------------------------------------------------------------- activity 1
steps.push({ id: 'activity-1', label: 'Activity 1: Denary to 8-Bit Binary', type: 'sequential-practice', practiceType: 'denary_to_binary', containerId: `${P}-activity-1`,
  content: '<h2 class="lesson-h2">Activity 1: Denary to 8-Bit Binary</h2>' +
    why('Why does every answer here have exactly 8 boxes?', 'Each box is one bit of an 8-bit number. Every bit is a 0 or a 1, so no box is left empty.') +
    '<p class="lesson-lead">Use the subtract method. Type one bit in each box. Four numbers, then keep going.</p>' +
    `<div id="${P}-activity-1"></div>` });

// ---------------------------------------------------------------- why all 8 bits
const SH = [13, 20];
const shortLong = (n) => { const s = n.toString(2), l = bin8(n); return box(boxTitle(`${n}`) + bitTable(l, { hl: onIdx(l), size: 'sm', label: false }) + line(`${s} and <strong>${l}</strong> are both ${n}`)); };
steps.push(concept('concept-8bits', 'Why Write All 8 Bits?',
  `${SH[0]} is 1101 in binary. Why write 00001101 for an 8-bit register?`,
  '<p>An 8-bit register has 8 bits, and each bit is always 0 or 1. The 0s on the left fill the columns. They add nothing.</p>',
  columns(facts(['A register has 8 bits. Each bit is always 0 or 1. No bit is empty.', 'So an <strong>8-bit</strong> answer needs all <strong>8</strong> bits.',
    '0s on the left add nothing. The value stays the same.', 'The question says 8-bit: write all 8 bits. If it does not, the 0s on the left are still right.']),
    '<div style="display:grid;gap:8px">' + SH.map(shortLong).join('') + '</div>')));

// 0478/13 November 2025 Q1(b)(i) and (ii). Mark scheme: (000)11000; (0)1100101.
const E2 = [24, 101];
steps.push(checkStep('exam-2', 'Exam Question: Convert to Binary (2 of 9)', 'Exam Question: Convert to Binary (2 of 9)',
  cite('0478/13, November 2025, Question 1(b)(i) and (ii)') + ' A shop owner enters a denary number to set the room temperature. It is converted to a binary number and stored in a register. Give the binary number that would be stored when each denary number is entered.',
  E2.map((n) => convAny(n)), ['This question does not say 8-bit. Why is an answer with 0s on the left still right?', '0s on the left add nothing. The value stays the same.'], sideTable));

// 0478/12 March 2021 Q1(a). Mark scheme: 00101110; 10101011.
const E3 = [46, 171];
steps.push(checkStep('exam-3', 'Exam Question: The Hockey Club (3 of 9)', 'Exam Question: The Hockey Club (3 of 9)',
  cite('0478/12, March 2021, Question 1(a)') + ` A hockey club records the number of people that watch each match. An 8-bit binary register is used to store this value. ${E3[0]} people watch the first match and ${E3[1]} people watch the second match. Show how the registers would store these denary values as 8-bit binary.`,
  E3.map((n) => conv8(n)),
  ['Why must the bits add up to exactly the denary number, not just close to it?', 'Each denary number has only one binary form. A close number is a different number, so it earns no mark.'], sideTable));

// ---------------------------------------------------------------- checking by converting back
const CK = 100, ANA = bin8(100), SAM = '01101000';
const ckCard = (who, b, good) => box(boxTitle(`${who}: ${CK} is ${b}`) + bitTable(b, { hl: onIdx(b), size: 'sm', label: false }) +
  line(`${sumText(b)} = <strong>${val(b)}</strong>`) + verdict(good ? `${val(b)} is ${CK}: it matches.` : `${val(b)} is not ${CK}: there is a slip.`, good));
steps.push(concept('concept-check', 'Why Converting Back Proves It',
  `Ana says ${CK} is ${ANA}. How can she prove it is right, without asking anyone?`,
  `<p>She converts ${ANA} back to denary: ${sumText(ANA)} = ${CK}. She gets the number she started with.</p>`,
  columns(facts(['Every denary number has <strong>only one</strong> 8-bit binary form.', 'Convert your answer back: add the place values with a 1.',
    '<strong>Same number</strong> as at the start: the bits are right.', '<strong>A different number:</strong> there is a slip. Find it and fix it.']),
    '<div style="display:grid;gap:8px">' + ckCard('Ana', ANA, true) + ckCard('Sam', SAM, false) + '</div>')));

const BEN_N = 58, BEN = '00111100';
steps.push(checkStep('check-back', 'Check: Convert It Back', 'Check: Convert It Back',
  `Ben converted ${BEN_N} to 8-bit binary. He got <strong>${BEN}</strong>. Predict first: is he right? Then check.`, [
    { label: 'Convert Ben\'s answer back to denary.', answer: num(val(BEN)), feedback: 'Find each 1 in Ben\'s answer. Add its place value.' },
    { label: `Give the right 8-bit binary number for ${BEN_N}.`, answer: bin8Ans(bin8(BEN_N)), feedback: 'Use the subtract method. Then convert your answer back to check it.' },
  ], ['Why is converting back a better check than doing the same steps again?', 'Repeating the same steps can repeat the same slip. Converting back uses a different method, so a slip shows up.'],
  sideTable));

// ---------------------------------------------------------------- exam questions
// 0478/11 June 2022 Q4(b). Mark scheme: 01000000; 01100101; 11110010.
const E4 = [64, 101, 242];
steps.push(checkStep('exam-4', 'Exam Question: Convert to 8-Bit Binary (4 of 9)', 'Exam Question: Convert to 8-Bit Binary (4 of 9)',
  cite('0478/11, June 2022, Question 4(b)') + ' The denary values 64, 101 and 242 are converted to 8-bit binary values. Give the 8-bit binary value for each denary value.',
  E4.map((n) => conv8(n)),
  ['After you convert, how can you be sure each answer is right?', 'Convert it back to denary. If you get the number you started with, it is right.'], sideTable));

// 0478/11 November 2023 Q2(b). Mark scheme: register 1 00001110; register 2 01100010.
const E5 = [14, 98];
steps.push(checkStep('exam-5', 'Exam Question: The Parking Cost (5 of 9)', 'Exam Question: The Parking Cost (5 of 9)',
  cite('0478/11, November 2023, Question 2(b)') + ' The cost of parking is stored in two 8-bit binary registers. For a cost of $10.50, register 1 stores the denary value 10 as binary and register 2 stores the denary value 50 as binary. The parking cost of $14.98 is displayed on the payment machine. Give the 8-bit binary numbers that are stored in the registers to display the parking cost.', [
    conv8(E5[0], { label: 'Register 1' }),
    conv8(E5[1], { label: 'Register 2' }),
  ], ['Why are the dollars and the cents stored in two registers, not one?', 'One 8-bit register holds one whole number, up to 255. Two numbers need two registers.'], sideTable));

// 0478/13 June 2026 Q8(a). Mark scheme: 01000111; 11001000.
const E6 = [71, 200];
steps.push(checkStep('exam-6', 'Exam Question: The Security Keypad (6 of 9)', 'Exam Question: The Security Keypad (6 of 9)',
  cite('0478/13, June 2026, Question 8(a)') + ' A building has a security keypad that requires the input of a 3-digit denary number. The denary number input is then converted to an 8-bit binary number. The denary numbers 071 and 200 are input. Convert these denary numbers to 8-bit binary numbers.', [
    conv8(E6[0], { label: '071' }),
    conv8(E6[1], { label: '200' }),
  ], ['Why does the keypad turn the number into binary at all?', 'The computer inside is made of switches with two states, so it can only store and process 1s and 0s.'], sideTable));

// 0478/11 November 2025 Q1(b). Mark scheme: 00010111; 10101000.
const E7 = [23, 168];
steps.push(checkStep('exam-7', 'Exam Question: The Calculator (7 of 9)', 'Exam Question: The Calculator (7 of 9)',
  cite('0478/11, November 2025, Question 1(b)') + ' Denary numbers are typed into a calculator. They are converted to binary numbers and stored in the 8-bit registers. The student types in the denary number 23 and the denary number 168. Give the 8-bit binary numbers that are stored in the registers for these two denary numbers.',
  E7.map((n) => conv8(n)),
  ['Why start each conversion by writing the 8 place values?', 'Then you can test each place value in order, from the biggest, and none is missed.'], sideTable));

// 0478/13 November 2023 Q2(b). Mark scheme: (0000)1110; (00)111011; 11101010.
const E8 = [14, 59, 234];
steps.push(checkStep('exam-8', 'Exam Question: Convert to Binary (8 of 9)', 'Exam Question: Convert to Binary (8 of 9)',
  cite('0478/13, November 2023, Question 2(b)') + ' Convert the denary numbers 14, 59 and 234 to binary.',
  E8.map((n) => convAny(n)),
  ['Why can no 8-bit register store the number 300?', 'The largest 8-bit number is 255. 300 would need a 9th bit, worth 256.'], sideTable));

// 0478/12 June 2024 Q3(b)(i). Mark scheme: 1010; 110010; 11001001 (one mark each).
const E9 = [10, 50, 201];
steps.push(checkStep('exam-9', 'Exam Question: Stored as Binary (9 of 9)', 'Exam Question: Stored as Binary (9 of 9)',
  cite('0478/12, June 2024, Question 3(b)(i)') + ' Three denary numbers are entered into a computer and stored as binary. Give the binary number that would be stored for each denary number.',
  E9.map((n) => convAny(n)),
  ['Why is it worth checking your answers before you move on?', 'A small slip loses the mark. Converting back takes a few seconds and finds the slip.'], sideTable));

// 0478/12 June 2024 Q3(b)(ii). Mark scheme, two from: computers use logic gates / switches ...; ... that only
// process the values 1 and 0 // that only have two states.
const EXPLAIN_WHY_BINARY = { id: 'why-binary', prompt: '(ii) Explain why the data is converted to binary by the computer. [2]', marks: 2,
  modelAnswer: 'The computer is made of switches that only have two states, 1 and 0.',
  scheme: ['Computers use logic gates / switches ...', '... that only process the values 1 and 0 // that only have two states'] };
steps.push(selfMarked('exam-why', 'Exam Question: Why Binary?', 'Exam Question: Why Binary?',
  cite('0478/12, June 2024, Question 3(b)(ii)') + ' Three denary numbers are entered into a computer. The computer converts the numbers and stores them as binary. Write your answer, then mark it against the model answer.',
  [EXPLAIN_WHY_BINARY], ['This question has 2 marks. Why is one idea not enough?', 'Each mark needs its own point. Two marks means two linked points.']));

// 0478/13 November 2024 Q1(c)(i). Mark scheme: one mark for valid working, for example 128 + 32 + 8 + 4 + 2 + 1;
// one mark for the answer 10101111.
const EW = 175;
const EW_ON = fitRows(EW).filter((r) => r.fits).map((r) => r.p);
const SEP = '(?:\\s*\\+\\s*|\\s*,\\s*|\\s*&\\s*|\\s+(?:and\\s+)?)';
const inOrder = (list, total) => `^\\s*${list.join(SEP)}(?:\\s*=\\s*${total})?\\s*\\.?\\s*$`;
// The working in the mark scheme's order (biggest first: the teacher's Reveal answers shows that), or smallest first.
const setAns = (list, total) => inOrder(list, total) + '|' + inOrder([...list].reverse(), total);
steps.push(checkStep('exam-working', 'Exam Question: Show Your Working', 'Exam Question: Show Your Working',
  cite('0478/13, November 2024, Question 1(c)(i)') + ` All data is converted to binary to be processed by a computer. Calculate the binary number for the denary number ${EW}. Show all your working.`, [
    { label: `Working: the place values that add up to ${EW}. Type them with + between.`, line: true, answer: setAns(EW_ON, EW), feedback: 'Use the subtract method. Write down each place value that fits.' },
    { label: `The binary number for ${EW}.`, answer: binAnyAns(bin8(EW)), feedback: 'A 1 under each place value in your working, a 0 under the rest.' },
  ], ['Why does the mark scheme give a mark for the working?', 'The working shows the method. A small slip in the answer can still earn the method mark.'], sideTable));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Fit, Subtract, Check', 'drill-y11-1-2-fit', 'Activity 2: Fit, Subtract, Check',
  'Find the first 1, work out what is left, convert, then check Sam\'s answers by converting back. Most numbers come from real exam papers.',
  ['Why check someone else\'s answer by converting it back, not by trusting it?', 'Converting back shows the real value of the bits. If it is not the starting number, the answer is wrong.']));

// ---------------------------------------------------------------- checked practice
// 0478/12 June 2021 Q1(a), the 8-bit binary column only (the hexadecimal column is left out). Mark scheme: 00110001;
// 01111011; 11001000.
const PR1 = [49, 123, 200];
steps.push(checkStep('practice', 'Practice: Denary to Binary (1 of 3)', 'Practice: Denary to Binary (1 of 3)',
  'Adapted from ' + cite('0478/12, June 2021, Question 1(a)') + ' Give the 8-bit binary value of each denary value.',
  PR1.map((n) => conv8(n)),
  ['Why does every 8-bit answer use the same 8 place values?', 'The 8 columns never change. Only the bits under them change.'], sideTable));
// 0478/12 June 2025 Q1(c). Mark scheme: 10011; 11100110. 0478/11 November 2024 Q3(b)(i). Mark scheme: (0)1000001;
// (0)1101101 (the paper's character set context is left out).
const PR2 = [19, 230], PR3 = [65, 109];
steps.push(checkStep('practice-2', 'Practice: Denary to Binary (2 of 3)', 'Practice: Denary to Binary (2 of 3)',
  cite('0478/12, June 2025, Question 1(c)') + ' The denary numbers 19 and 230 are converted to binary numbers to be stored. Convert the two denary numbers to binary numbers.',
  PR2.map((n) => convAny(n)),
  ['Why write down what is left after each step?', 'Then you can see where a slip happened, and fix only that step.'], sideTable));
steps.push(checkStep('practice-3', 'Practice: Denary to Binary (3 of 3)', 'Practice: Denary to Binary (3 of 3)',
  'Adapted from ' + cite('0478/11, November 2024, Question 3(b)(i)') + ' The character A is stored as the denary number 65. The character m is stored as the denary number 109. Convert the two denary numbers to binary.',
  PR3.map((n) => convAny(n)),
  ['Why does a computer store each letter as a number?', 'A computer can only store binary. Each letter is given a number, and the number is stored in binary.'], sideTable));

const WHY_BIGGEST = { id: 'why-biggest', prompt: 'Explain why you start with the biggest place value that fits. [2]', marks: 2,
  modelAnswer: 'Each place value is more than all the smaller ones added together, so if it fits and is skipped, the rest cannot make the number.',
  scheme: ['Each place value is bigger than all the place values to its right added together (for example 128 is more than 64 + 32 + 16 + 8 + 4 + 2 + 1 = 127) ...', '... so if it fits but is not used, the smaller place values can never add up to the number // too much would be left over'] };
const DESCRIBE_CHECK = { id: 'describe-check', prompt: 'Describe how to check that a denary to binary conversion is correct. [2]', marks: 2,
  modelAnswer: 'Convert the binary back to denary. If it gives the number you started with, it is correct.',
  scheme: ['Convert the binary answer back to denary // add the place values that have a 1 ...', '... and compare it with the original denary number: the same number means the conversion is correct // a different number means there is an error'] };
steps.push(selfMarked('practice-why', 'Practice: Why? (1 of 2)', 'Practice: Why? (1 of 2)', 'Write your answer, then mark it against the model answer.',
  [WHY_BIGGEST], ['Why might an exam ask why, not only how?', 'Knowing why shows you understand the method, so you can spot a wrong answer.']));
steps.push(selfMarked('practice-why-2', 'Practice: Why? (2 of 2)', 'Practice: Why? (2 of 2)', 'Write your answer, then mark it against the model answer.',
  [DESCRIBE_CHECK], ['Why is it worth checking an answer in an exam at all?', 'A small slip loses the mark. A quick check finds the slip before the paper is handed in.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Denary to Binary Drill', 'drill-y11-1-2-binary', 'Plenary: Denary to Binary Drill',
  'Why the method works, the subtract method, real exam conversions and checking by converting back. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
// Every exam value against its mark scheme (the mark scheme's own binary, 0s on the left as printed).
const MS = [[50, '00110010'], [102, '01100110'], [221, '11011101'], [24, '11000'], [101, '1100101'], [46, '00101110'], [171, '10101011'],
  [64, '01000000'], [242, '11110010'], [14, '00001110'], [98, '01100010'], [71, '01000111'], [200, '11001000'], [23, '00010111'], [168, '10101000'],
  [59, '111011'], [234, '11101010'], [10, '1010'], [201, '11001001'], [175, '10101111'], [49, '00110001'], [123, '01111011'], [19, '10011'],
  [230, '11100110'], [65, '1000001'], [109, '1101101'], [167, '10100111'], [214, '11010110'], [15, '1111'], [180, '10110100'], [235, '11101011']];
MS.forEach(([n, b]) => assert(parseInt(b, 2) === n, `mark scheme ${n} is ${b}`));
assert(val(DN1C) === 11 && val(DN2[0]) === 25 && val(DN2[1]) === 180, 'Do Now values from the mark schemes');
assert(EW_ON.join('+') === '128+32+8+4+2+1', '175 working from the mark scheme');
assert(val(WT_4) === 6 && val(WT_B) === 74 && bin8(SUB) === '01001101' && val(SAM) === 104 && val(BEN) === 60, 'examples');
assert(new Set(steps.filter((s) => s.type === 'multiple-choice').flatMap((s) => s.items.map((it) => it.correct))).size >= 2, 'correct options vary');
steps.filter((s) => s.type === 'multiple-choice').flatMap((s) => s.items).forEach((it) => {
  const n = Number(/convert (\d+)/.exec(it.prompt)[1]); const want = PV8.find((p) => p <= n);
  assert(Number(it.options[it.correct]) === want, `first 1 for ${n}`);
});
ok('do-now', 0, ['255', '255 in denary', '= 255'], ['256', '128', '11111111', '254']);
ok('do-now', 1, ['11', '11.'], ['1011', '13', '3', '208']);
ok('do-now-2', 0, ['25'], ['152', '3', '19', '00011001']);
ok('do-now-2', 1, ['180'], ['45', '4', '170']);
ok('check-4bit', 0, ['0110', '01 10'], ['110', '1001', '0011', '6']);
ok('check-4bit', 1, ['1001'], ['0110', '1000', '9', '10001']);
ok('exam-1', 0, ['00110010', '0011 0010', '00110010 in binary'], ['110010', '01001100', '00110011', '50']);
ok('exam-1', 1, ['01100110'], ['1100110', '01100111']);
ok('exam-1', 2, ['11011101', '1101 1101'], ['10111011', '11011100']);
ok('exam-2', 0, ['11000', '00011000', '0001 1000'], ['00011001', '1100', '24', '00110000']);
ok('exam-2', 1, ['1100101', '01100101'], ['1010011', '01100100']);
ok('exam-3', 0, ['00101110'], ['101110', '01110100']);
ok('exam-3', 1, ['10101011'], ['11010101', '10101010']);
ok('exam-4', 0, ['01000000'], ['1000000', '00000010', '10000000']);
ok('exam-4', 1, ['01100101'], ['1100101', '10100110']);
ok('exam-4', 2, ['11110010'], ['01001111', '11110011']);
ok('exam-5', 0, ['00001110'], ['1110', '01110000', '14']);
ok('exam-5', 1, ['01100010'], ['1100010', '01000110']);
ok('exam-6', 0, ['01000111'], ['1000111', '11100010', '01000110']);
ok('exam-6', 1, ['11001000'], ['00010011', '11001001']);
ok('exam-7', 0, ['00010111'], ['10111', '11101000']);
ok('exam-7', 1, ['10101000'], ['00010101', '10101001']);
ok('exam-8', 0, ['1110', '00001110'], ['0111', '01110000', '1111']);
ok('exam-8', 1, ['111011', '00111011'], ['110111', '111010']);
ok('exam-8', 2, ['11101010'], ['01010111', '11101011']);
ok('exam-9', 0, ['1010', '00001010'], ['0101', '1011', '10']);
ok('exam-9', 1, ['110010', '00110010'], ['010011', '110011']);
ok('exam-9', 2, ['11001001'], ['10010011', '11001000']);
ok('exam-working', 0, ['128 + 32 + 8 + 4 + 2 + 1', '128+32+8+4+2+1 = 175', '1 + 2 + 4 + 8 + 32 + 128', '128, 32, 8, 4, 2, 1'],
  ['128 + 32 + 8 + 4 + 2', '128 + 32 + 16', '128 + 47', '175', '128 + 32 + 8 + 4 + 2 + 1 + 16']);
ok('exam-working', 1, ['10101111', '1010 1111'], ['11110101', '10101110', '175']);
ok('check-back', 0, ['60'], ['58', '00111100', '30']);
ok('check-back', 1, ['00111010'], ['00111100', '111010', '01011100']);
ok('practice', 0, ['00110001'], ['110001', '10001100']);
ok('practice', 1, ['01111011'], ['1111011', '11011110']);
ok('practice', 2, ['11001000'], ['00010011', '11001001']);
ok('practice-2', 0, ['10011', '00010011'], ['11001', '10010']);
ok('practice-2', 1, ['11100110'], ['01100111', '11100111']);
ok('practice-3', 0, ['1000001', '01000001'], ['1000010', '10000010']);
ok('practice-3', 1, ['1101101', '01101101'], ['1011011', '1101100']);
// Every Do Now walkthrough step (text, picture, both) must fail every part on its slide.
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
steps.filter((s) => /^do-now(-\d)?$/.test(s.id)).forEach((s) => {
  assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
assert(!/\b(255|11)\b/.test(plain(JSON.stringify(WT_DN1))), 'Do Now 1 walkthrough gives an answer');
assert(!/\b(25|180)\b/.test(plain(JSON.stringify(WT_DN2))), 'Do Now 2 walkthrough gives an answer');
// Slide examples never use a question's number.
{
  const qs = [...E1, ...E2, ...E3, ...E4, ...E5, ...E6, ...E7, ...E8, ...E9, EW, ...PR1, ...PR2, ...PR3, ...C4, BEN_N];
  [...REV, BIG, SUB, CK, ...SH, 150].forEach((n) => assert(!qs.includes(n), `example ${n} is also a question`));
}
// No term before the slide that teaches it (the title slide only names today's topic).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/subtract/i, 'concept-subtract'], [/convert(ing|s)? (it |your answer |Ben.s answer )?back|converting back/i, 'concept-check'],
    [/hexadecimal|\bhex\b|two.s complement|overflow|\bbytes?\b|nibble|ascii|logical shift/i, null], [/mario|\bdecimal\b/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}
steps.filter((s) => s.validatorKey).forEach((s) => assert(V(s.id).length <= 4, `${s.id} has too many parts`));
steps.filter((s) => s.type === 'self-marked-response').forEach((s) => assert(s.items.length === 1 && s.items.every((it) => Array.isArray(it.scheme) && it.scheme.length >= it.marks && it.modelAnswer && it.marks), `${s.id} self-marked fields`));

// ---------------------------------------------------------------- drills
// Real denary to binary values from Paper 1, each with its citation (checked against MS above).
const REAL = [
  [50, 'From Cambridge IGCSE 0478/11, June 2023, Question 1(b), and 0478/12, June 2024, Question 3(b)(i).'],
  [102, 'From Cambridge IGCSE 0478/11, June 2023, Question 1(b).'],
  [221, 'From Cambridge IGCSE 0478/11, June 2023, Question 1(b).'],
  [24, 'From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(i).'],
  [101, 'From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(ii), and 0478/11, June 2022, Question 4(b).'],
  [46, 'From Cambridge IGCSE 0478/12, March 2021, Question 1(a).'],
  [171, 'From Cambridge IGCSE 0478/12, March 2021, Question 1(a).'],
  [64, 'From Cambridge IGCSE 0478/11, June 2022, Question 4(b).'],
  [242, 'From Cambridge IGCSE 0478/11, June 2022, Question 4(b).'],
  [14, 'From Cambridge IGCSE 0478/11, November 2023, Question 2(b), and 0478/13, November 2023, Question 2(b).'],
  [98, 'From Cambridge IGCSE 0478/11, November 2023, Question 2(b).'],
  [71, 'From Cambridge IGCSE 0478/13, June 2026, Question 8(a).'],
  [200, 'From Cambridge IGCSE 0478/13, June 2026, Question 8(a), and 0478/12, June 2021, Question 1(a).'],
  [23, 'From Cambridge IGCSE 0478/11, November 2025, Question 1(b).'],
  [168, 'From Cambridge IGCSE 0478/11, November 2025, Question 1(b).'],
  [59, 'From Cambridge IGCSE 0478/13, November 2023, Question 2(b).'],
  [234, 'From Cambridge IGCSE 0478/13, November 2023, Question 2(b).'],
  [10, 'From Cambridge IGCSE 0478/12, June 2024, Question 3(b)(i).'],
  [201, 'From Cambridge IGCSE 0478/12, June 2024, Question 3(b)(i).'],
  [175, 'From Cambridge IGCSE 0478/13, November 2024, Question 1(c)(i).'],
  [49, 'Adapted from Cambridge IGCSE 0478/12, June 2021, Question 1(a).'],
  [123, 'Adapted from Cambridge IGCSE 0478/12, June 2021, Question 1(a).'],
  [19, 'From Cambridge IGCSE 0478/12, June 2025, Question 1(c).'],
  [230, 'From Cambridge IGCSE 0478/12, June 2025, Question 1(c).'],
  [65, 'Adapted from Cambridge IGCSE 0478/11, November 2024, Question 3(b)(i).'],
  [109, 'Adapted from Cambridge IGCSE 0478/11, November 2024, Question 3(b)(i).'],
  [167, 'From Cambridge IGCSE 0478/11, June 2021, Question 1(a).'],
  [214, 'From Cambridge IGCSE 0478/11, June 2021, Question 1(a).'],
  [15, 'From Cambridge IGCSE 0478/12, November 2024, Question 3(b).'],
  [180, 'From Cambridge IGCSE 0478/12, November 2024, Question 3(b).'],
  [235, 'From Cambridge IGCSE 0478/12, November 2024, Question 3(b).'],
];
REAL.forEach(([n]) => assert(MS.some((m) => m[0] === n), `real value ${n} has a mark scheme check`));
assert(new Set(REAL.map((r) => r[0])).size === REAL.length, 'real values distinct');
// Real binary to denary values for the 1.1 recap (from the 1.1 builder, each checked there against its mark scheme).
const REAL11 = [
  ['01010101', 'From Cambridge IGCSE 0478/12, March 2022, Question 1(a).'],
  ['11100011', 'From Cambridge IGCSE 0478/12, November 2023, Question 2(a).'],
  ['00101001', 'From Cambridge IGCSE 0478/13, June 2026, Question 8(b).'],
  ['01000010', 'From Cambridge IGCSE 0478/11, November 2025, Question 1(d).'],
  ['00010011', 'From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(iii).'],
  ['00100010', 'From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(iv).'],
  ['01000110', 'From Cambridge IGCSE 0478/11, November 2023, Question 2(a).'],
  ['10101110', 'From Cambridge IGCSE 0478/13, June 2023, Question 1(a).'],
  ['01111001', 'Adapted from Cambridge IGCSE 0478/11, November 2024, Question 3(c)(i).'],
];
const IDEA_SWITCH = '\\b(switch\\w*|transistors?|logic|gates?|circuits?|electric\\w*|current|signals?|voltage)\\b';
const IDEA_STATES = '\\b(on|off|two|2|states?|high|low|1\\s*(and|or|,|&)\\s*0|0\\s*(and|or|,|&)\\s*1|1s\\s*(and|or)\\s*0s|0s\\s*(and|or)\\s*1s)\\b';
const WHY_BIN_RE = `^(?=.*${IDEA_SWITCH})(?=.*${IDEA_STATES}).*$`;

const drillHead = (id, about) => `// Year 11, 1.2: Denary to Binary. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_2_denary.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()
    .split('[] /*REAL*/').join(JSON.stringify(REAL))
    .split('[] /*REAL11*/').join(JSON.stringify(REAL11))
    .split("null /*WHY_BIN*/").join(new RegExp(WHY_BIN_RE, 'i').toString())})()\n});\n`;

// ---- Do Now Extension: the whole of 1.1 (place values, binary to denary, the range of 8 bits). Every card has an
// example on different numbers and two nudges.
function extCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  function pv(n) { var a = []; for (var i = n - 1; i >= 0; i--) a.push(Math.pow(2, i)); return a; }
  function pad(s, w) { while (s.length < w) s = "0" + s; return s; }
  function bin(n, w) { return pad(n.toString(2), w); }
  function rev(b) { return b.split("").reverse().join(""); }
  function ones(b) { return b.split("").filter(function (c) { return c === "1"; }).length; }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function col(s, w) { s = String(s); while (s.length < w) s = " " + s; return s; }
  function grid(b) { var p = pv(b.length); return "Place value: " + p.map(function (x) { return col(x, 4); }).join("") + "\nBit:         " + b.split("").map(function (c) { return col(c, 4); }).join(""); }
  function plus(b) { var p = pv(b.length), o = []; for (var i = 0; i < b.length; i++) if (b[i] === "1") o.push(p[i]); return o.join(" + "); }
  function otherBin(w, not, minOnes) { var b; do { b = bin(rnd(1, Math.pow(2, w) - 1), w); } while (b === not || val(b) === val(not) || ones(b) < (minOnes || 1)); return b; }
  function wrong(b) { var a = val(b); return drillWrongNumbers(a, [val(rev(b)), ones(b), a + 1, a - 1, a + 2], 3); }
  var REAL11 = [] /*REAL11*/;
  function convCard(b, e, src, w1) {
    return { prompt: "Convert the 8-bit binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
      example: "Example: convert " + e + ".\nStep 1: the place values are 128, 64, 32, 16, 8, 4, 2, 1.\nStep 2: add each place value with a 1 under it: " + plus(e) + ".\nStep 3: " + plus(e) + " = " + val(e) + ".",
      working: [w1 || "Find each 1. Read the place value above it.", "Add those place values, one at a time."], note: b + " = " + plus(b) + " = " + val(b) + "." + (src ? " " + src : "") };
  }
  return [
    { id: "ex-01", category: "ex-places", randomize: function () {
        var list = [1, 2, 4, 8, 16, 32, 64], k = rnd(2, 6), x = list[k], j; do { j = rnd(1, 5); } while (j === k || list[j] === x * 2);
        return { prompt: "Binary place values double each time: 1, 2, 4, ... What place value comes after " + x + "?", answers: [String(x * 2)], keywords: [num(x * 2)],
          distractors: drillWrongNumbers(x * 2, [x + 2, x + 1, x * 10, x * 3], 3),
          example: "Example: what comes after " + list[j] + "?\nStep 1: each place value is double the one before.\nStep 2: double " + list[j] + " is " + list[j] + " + " + list[j] + " = " + (list[j] * 2) + ".",
          working: ["Each place value is double the one before it.", "Double " + x + "."], note: "Double " + x + " is " + (x * 2) + "." };
      } },
    { id: "ex-02", category: "ex-places", prompt: "What is the place value of the leftmost bit of an 8-bit binary number?", answers: ["128"], keywords: [num(128)],
      distractors: ["256", "100", "8"],
      example: "Example: a 4-bit number.\nStep 1: start at 1 on the right and double: 1, 2, 4, 8.\nStep 2: the leftmost of the 4 bits is worth 8.",
      working: ["Start at 1 on the right. Double once for each bit.", "1, 2, 4, 8, 16, 32, 64, ... How many bits is that?"], note: "128 64 32 16 8 4 2 1: the leftmost is 128." },
    { id: "ex-03", category: "ex-convert", randomize: function () {
        var b; do { b = bin(rnd(3, 15), 4); } while (ones(b) < 2);
        var e = otherBin(4, b, 2);
        return { prompt: "Convert the 4-bit binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          example: "Example: convert " + e + ".\nStep 1: the place values are 8, 4, 2, 1.\nStep 2: add each place value with a 1 under it: " + plus(e) + ".\nStep 3: " + plus(e) + " = " + val(e) + ".",
          working: ["A 1 means: add that place value. A 0 adds nothing.", "Add the place values with a 1 under them."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "ex-04", category: "ex-convert", randomize: function () {
        var b; do { b = bin(rnd(1, 255), 8); } while (ones(b) < 2 || ones(b) > 3);
        return convCard(b, otherBin(8, b, 2), "", "The 0s add nothing. Look for the 1s.");
      } },
    { id: "ex-05", category: "ex-convert", randomize: function () {
        var r = drillPick(REAL11), e; do { e = drillPick(REAL11)[0]; } while (e === r[0]);
        return convCard(r[0], e, r[1]);
      } },
    { id: "ex-06", category: "ex-convert", randomize: function () {
        var r = drillPick(REAL11.filter(function (x) { return ones(x[0]) >= 4; })), e; do { e = drillPick(REAL11)[0]; } while (e === r[0]);
        return convCard(r[0], e, r[1], "Find each 1. There are " + ones(r[0]) + " of them.");
      } },
    { id: "ex-07", category: "ex-convert", randomize: function () {
        var b; do { b = bin(rnd(1, 255), 8); } while (ones(b) < 3 || ones(b) > 5);
        var e; do { e = bin(rnd(1, 255), 8); } while (val(e) === val(b) || ones(e) < 3);
        var s = ones(b);
        var es = ones(e);
        return { prompt: "Sam says " + b + " is " + s + " in denary. He counted the 1s. What is the right denary value?\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))],
          distractors: drillWrongNumbers(val(b), [s, val(rev(b)), val(b) + 1, val(b) - 1], 3),
          example: "Example: Sam says " + e + " is " + es + ". That is how many 1s it has, not its value.\nStep 1: find each 1 and the place value above it.\nStep 2: add them: " + plus(e) + " = " + val(e) + ".",
          working: ["Do not count the 1s. Read the place value above each 1.", "Add those place values."], note: "Sam counted the 1s. " + b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "ex-08", category: "ex-range", prompt: "Give the largest denary value that can be stored in an 8-bit binary number.", answers: ["255"], keywords: [num(255)],
      distractors: ["256", "128", "8"],
      example: "Example: the largest 4-bit value.\nStep 1: the largest has every bit set to 1: 1111.\nStep 2: add every place value: 8 + 4 + 2 + 1 = 15.",
      working: ["In the largest 8-bit number, every bit is 1.", "Add all 8 place values."], note: "11111111 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. From Cambridge IGCSE 0478/11, November 2025, Question 1(a)." },
    { id: "ex-09", category: "ex-range", prompt: "Give the smallest denary value that can be stored in an 8-bit binary number.", answers: ["0"], keywords: [/^\s*(0|zero)(\s*(in\s+)?denary)?\s*$/i],
      distractors: ["1", "8", "-255"],
      example: "Example: the largest 3-bit value.\nStep 1: the largest has every bit set to 1: 111.\nStep 2: 4 + 2 + 1 = 7.\nNow think: the smallest has every bit set to the other digit.",
      working: ["In the smallest 8-bit number, every bit is the same digit.", "Which digit adds nothing?"], note: "00000000 is 0. From Cambridge IGCSE 0478/12, March 2025, Question 1(a)." },
    { id: "ex-10", category: "ex-places", randomize: function () {
        var list = [2, 4, 8, 16, 32, 64, 128], k = rnd(1, 6), x = list[k], j; do { j = rnd(1, 6); } while (j === k || list[j] === x / 2);
        return { prompt: "In an 8-bit binary number, which place value is just to the right of " + x + "?", answers: [String(x / 2)], keywords: [num(x / 2)],
          distractors: drillWrongNumbers(x / 2, [x * 2, x - 1, x - 2, x / 4], 3),
          example: "Example: just to the right of " + list[j] + ".\nStep 1: moving right, each place value halves.\nStep 2: half of " + list[j] + " is " + (list[j] / 2) + ".",
          working: ["Moving right, each place value is half the one before.", "Halve " + x + "."], note: "Half of " + x + " is " + (x / 2) + "." };
      } }
  ];
}

// ---- Activity 2: find the first 1, work out what is left, convert, and check Sam's answers by converting back.
function fitCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  var PV = [128, 64, 32, 16, 8, 4, 2, 1];
  function bin8(n) { var s = n.toString(2); while (s.length < 8) s = "0" + s; return s; }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?denary)?\\s*$", "i"); }
  function binRe(b) { return new RegExp("^\\s*" + b.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function plus(b) { var o = []; for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]); return o.join(" + "); }
  function first(n) { for (var i = 0; i < 8; i++) if (PV[i] <= n) return PV[i]; return 0; }
  var PVLINE = "Place values: 128  64  32  16  8  4  2  1";
  var REAL = [] /*REAL*/;
  function pickN(lo, hi) {
    var fit = REAL.filter(function (r) { return r[0] >= lo && r[0] <= hi; });
    if (fit.length && Math.random() < 0.75) { var r = drillPick(fit); return { n: r[0], src: " " + r[1] }; }
    return { n: rnd(lo, hi), src: "" };
  }
  function wrongBins(n) {
    var b = bin8(n), out = [], c = [b.split("").reverse().join(""), bin8((n + 1) % 256), bin8(n ^ first(n)), bin8(Math.max(n - 1, 0))];
    if (b[0] === "0") c.splice(1, 0, b.replace(/^0+/, ""));
    c.forEach(function (x) { if (x && x !== b && out.indexOf(x) < 0 && out.length < 3) out.push(x); });
    return out;
  }
  function sumRe(list, total) {
    var s = "^";
    list.forEach(function (n) { s += "(?=(?:.*\\D)?" + n + "(?:\\D|$))"; });
    var alt = list.slice().sort(function (a, b) { return String(b).length - String(a).length; }).join("|");
    return new RegExp(s + "\\s*(?:(?:" + alt + ")(?!\\d)\\s*(?:,|\\+|&|and)?\\s*)+(?:=\\s*" + total + "\\s*)?$", "i");
  }
  function onList(n) { var b = bin8(n), o = []; for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]); return o; }
  var firstCard = function (lo, hi) {
    return function () {
      var p = pickN(lo, hi), n = p.n, a = first(n);
      return { prompt: "You convert " + n + " to 8-bit binary. Which place value gets the first 1?\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
        distractors: drillWrongNumbers(a, [a * 2 <= 128 ? a * 2 : a / 4, a / 2, n, a * 4 <= 128 ? a * 4 : 3], 3),
        working: ["Start on the left. Is that place value bigger than " + n + "?", "Move right until a place value fits in " + n + "."], note: "The biggest place value that fits in " + n + " is " + a + "." + p.src };
    };
  };
  var leftCard = function (wantFit) {
    return function () {
      var n, k, before, rows;
      do {
        n = rnd(20, 250); var left = n; rows = [];
        for (var i = 0; i < 8; i++) { rows.push(left); if (left >= PV[i]) left -= PV[i]; }
        k = rnd(1, 5); before = rows[k];
      } while ((before >= PV[k]) !== wantFit || before === 0 || before === PV[k]);
      var after = before >= PV[k] ? before - PV[k] : before;
      return { prompt: "You are converting " + n + " to binary. After the columns before it, " + before + " is left. The next place value is " + PV[k] + ".\nWhat is left after the " + PV[k] + " column?\n" + PVLINE,
        answers: [String(after)], keywords: [num(after)], distractors: drillWrongNumbers(after, wantFit ? [before, before + PV[k], PV[k]] : [before - PV[k], 0, PV[k]].filter(function (x) { return x >= 0; }), 3),
        working: ["Does " + PV[k] + " fit in " + before + "?", "Fits: write 1 and subtract. Too big: write 0, and nothing changes."],
        note: before >= PV[k] ? PV[k] + " fits in " + before + ": write 1. " + before + " - " + PV[k] + " = " + after + "." : PV[k] + " is too big for " + before + ": write 0. Still " + before + " left." };
    };
  };
  var onesCard = function (lo, hi) {
    return function () {
      var p = pickN(lo, hi), n = p.n, o = onList(n);
      return { prompt: "Which place values add up to " + n + "? Use each place value at most once.\n" + PVLINE, answers: [o.join(", ")], keywords: [sumRe(o, n)],
        distractors: [onList(Math.min(n + 1, 255)).join(", "), onList(n - 1).join(", "), PV.filter(function (x) { return o.indexOf(x) < 0; }).join(", ")].filter(function (x, i, a) { return x && x !== o.join(", ") && a.indexOf(x) === i; }),
        format: "Type the place values, with commas between them",
        working: ["Start at 128. Does it fit in " + n + "? If it does, subtract it.", "Keep going right with what is left, until 0 is left."], note: n + " = " + o.join(" + ") + "." + p.src };
    };
  };
  var convCard = function (lo, hi) {
    return function () {
      var p = pickN(lo, hi), n = p.n, b = bin8(n);
      return { prompt: "Convert " + n + " to 8-bit binary.\n" + PVLINE, answers: [b], keywords: [binRe(b)], distractors: wrongBins(n), format: "Type the 8 bits",
        working: ["Start at 128. Fits: write 1 and subtract. Too big: write 0.", "Write all 8 bits. Then convert back to check."], note: n + " = " + plus(b) + " = " + b + "." + p.src };
    };
  };
  // Sam's slips: one 1 in the wrong column, a column missed, or the bits written backwards.
  function samSlip(n, k) {
    var b = bin8(n), s;
    if (k === 0) { var i = b.lastIndexOf("1"); s = b.slice(0, i) + "0" + b.slice(i + 1); }
    else if (k === 1) { var j = b.indexOf("1"); s = j > 0 ? b.slice(0, j - 1) + "10" + b.slice(j + 1) : b.slice(0, 1) + "1" + b.slice(2); }
    else s = b.split("").reverse().join("");
    return s;
  }
  var backCard = function (k) {
    return function () {
      var p, n, s;
      do { p = pickN(12, 250); n = p.n; s = samSlip(n, k); } while (s === bin8(n) || val(s) === n);
      return { prompt: "Sam converted " + n + " to 8-bit binary. He wrote " + s + ".\nConvert Sam's answer back to denary.\n" + PVLINE, answers: [String(val(s))], keywords: [num(val(s))],
        distractors: drillWrongNumbers(val(s), [n, val(s) + 1, val(s.split("").reverse().join("")), val(s) - 1], 3),
        working: ["Find each 1 in Sam's answer.", "Add the place values above them."], note: s + " = " + (plus(s) || "0") + " = " + val(s) + ". That is not " + n + ", so Sam made a slip." + p.src };
    };
  };
  var fixCard = function (k) {
    return function () {
      var p, n, s;
      do { p = pickN(12, 250); n = p.n; s = samSlip(n, k); } while (s === bin8(n) || val(s) === n);
      var b = bin8(n);
      return { prompt: "Sam says " + n + " is " + s + " in 8-bit binary. Converted back, his answer is " + val(s) + ", not " + n + ".\nGive the right 8-bit binary for " + n + ".\n" + PVLINE, answers: [b], keywords: [binRe(b)],
        distractors: [s].concat(wrongBins(n).filter(function (x) { return x !== s; })).slice(0, 3), format: "Type the 8 bits",
        working: ["Start again from 128. Do not trust Sam's bits.", "Fits: write 1 and subtract. Too big: write 0. Then convert back."], note: n + " = " + plus(b) + " = " + b + "." + p.src };
    };
  };
  return [
    { id: "ft-01", category: "ft-first", randomize: firstCard(10, 127) },
    { id: "ft-02", category: "ft-first", randomize: firstCard(10, 250) },
    { id: "ft-03", category: "ft-left", randomize: leftCard(true) },
    { id: "ft-04", category: "ft-left", randomize: leftCard(false) },
    { id: "ft-05", category: "ft-left", randomize: onesCard(10, 120) },
    { id: "ft-06", category: "ft-left", randomize: onesCard(120, 250) },
    { id: "ft-07", category: "ft-convert", randomize: convCard(10, 100) },
    { id: "ft-08", category: "ft-convert", randomize: convCard(40, 180) },
    { id: "ft-09", category: "ft-convert", randomize: convCard(120, 250) },
    { id: "ft-10", category: "ft-check", randomize: backCard(0) },
    { id: "ft-11", category: "ft-check", randomize: backCard(1) },
    { id: "ft-12", category: "ft-check", randomize: fixCard(2) },
    { id: "ft-13", category: "ft-check", randomize: fixCard(0) }
  ];
}

// ---- Plenary: this lesson only. Why the method works, the subtract method, real exam conversions, checking back.
function plenaryCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  var PV = [128, 64, 32, 16, 8, 4, 2, 1];
  function bin8(n) { var s = n.toString(2); while (s.length < 8) s = "0" + s; return s; }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?(denary|base\\s*10))?\\s*$", "i"); }
  function binRe(b, eight) { var core = eight ? b : b.replace(/^0+(?=.)/, ""); return new RegExp("^\\s*" + (eight ? "" : "(?:0\\s*)*") + core.split("").join("\\s*") + "(\\s*(in\\s+)?binary)?\\s*$", "i"); }
  function plus(b) { var o = []; for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]); return o.join(" + "); }
  function first(n) { for (var i = 0; i < 8; i++) if (PV[i] <= n) return PV[i]; return 0; }
  var PVLINE = "Place values: 128  64  32  16  8  4  2  1";
  var REAL = [] /*REAL*/;
  function wrongBins(n, eight) {
    var b = bin8(n), out = [], c = [b.split("").reverse().join(""), bin8((n + 1) % 256), bin8(n ^ first(n)), bin8(Math.max(n - 1, 0))];
    if (eight && b[0] === "0") c.splice(1, 0, b.replace(/^0+/, ""));
    c.forEach(function (x) { if (x && x !== b && out.indexOf(x) < 0 && out.length < 3 && (eight || x.replace(/^0+/, "") !== b.replace(/^0+/, ""))) out.push(x); });
    return out;
  }
  function convCard(r, eight) {
    var n = r[0], b = bin8(n);
    return { prompt: "Convert the denary number " + n + " to " + (eight ? "8-bit binary." : "binary."), answers: [eight ? b : b.replace(/^0+(?=.)/, "")], keywords: [binRe(b, eight)],
      distractors: wrongBins(n, eight), format: eight ? "Type the 8 bits" : "Type the binary number",
      working: ["Start at 128. Fits: write 1 and subtract. Too big: write 0.", "Convert your answer back to check it."], note: n + " = " + plus(b) + " = " + b + ". " + r[1] };
  }
  function samSlip(n) { var b = bin8(n), i = b.lastIndexOf("1"); return b.slice(0, i) + "0" + b.slice(i + 1); }
  var WHY_BIN = null /*WHY_BIN*/;
  return [
    // ================================================= Why it works
    { id: "pl-01", category: "pl-why", prompt: "Why do we start with the biggest place value that fits?", answers: ["It is bigger than all the smaller place values added together, so the rest could never make the number"],
      keywords: [/^(?=.*\b(bigger|more|larger|greater)\b)(?=.*\b(smaller|rest|others?|all|added|together|right)\b).*$/i],
      distractors: ["Because it is on the left", "Because binary is base 2", "Because 128 comes first"],
      working: ["Compare 8 with 4 + 2 + 1 added together.", "If a big place value fits but you skip it, can the small ones make up the number?"],
      note: "Each place value is bigger than all the smaller ones added together (128 is more than 127), so if it fits it must be used." },
    { id: "pl-02", category: "pl-why", prompt: "Why does an answer in 8-bit binary need all 8 bits, with 0s on the left?", answers: ["A register has 8 bits and each bit is always 0 or 1, so no bit is empty"],
      keywords: [/^(?=.*\b(registers?|8|eight|every|each|all)\b)(?=.*\b(0\s*or\s*1|1\s*or\s*0|empty|blank|always|fill\w*|columns?|bits?)\b)(?=.*\b(0s?|zeros?|empty|blank|always|fill\w*|nothing)\b).*$/i],
      distractors: ["To make the number bigger", "Because 8 is a big number", "Because binary is base 2"],
      working: ["How many bits does an 8-bit register have?", "Can a bit be empty, or is it always a 0 or a 1?"],
      note: "An 8-bit register has 8 bits and each one is always 0 or 1. The 0s on the left fill the columns and add nothing." },
    { id: "pl-03", category: "pl-why", prompt: "Why does converting back to denary prove that a conversion is right?", answers: ["If you get the same number you started with, the bits must be right"],
      keywords: [/^(?=.*\b(same|matches|match|equal\w*|original|start\w*|back)\b)(?=.*\b(number|value|denary|total|started|start)\b)(?=.*\b(same|match\w*|equal\w*|original|right|correct)\b).*$/i],
      distractors: ["Because it is quicker", "Because binary is base 2", "Because the teacher says so"],
      working: ["Each denary number has only one 8-bit binary form.", "What should you get when you convert your answer back?"],
      note: "Binary to denary gives one exact value. If it is the number you started with, the bits are right." },
    { id: "pl-04", category: "pl-why", prompt: "Explain why a computer can only process binary data.", answers: ["It is made of switches that only have two states, on and off"],
      keywords: [WHY_BIN], distractors: ["Binary numbers are shorter", "Computers cannot count to ten", "Binary uses ten digits"],
      working: ["What is a computer made of? Billions of tiny ...", "How many states does each one have?"],
      note: "Mark scheme: computers consist of transistors / logic circuits / gates ... that can only store or process data in two states (on and off, 1 and 0). From Cambridge IGCSE 0478/11, June 2022, Question 4(a)." },
    { id: "pl-05", category: "pl-why", prompt: "A payment machine takes in the parking cost. Explain why data input into the payment machine needs to be converted to binary.", answers: ["It contains switches that only process 1 and 0"],
      keywords: [WHY_BIN], distractors: ["So the cost is shorter", "So people can read it", "Because the cost is in dollars"],
      working: ["What is inside the machine's computer?", "Which two values can those parts process?"],
      note: "Mark scheme, two from: it contains logic gates / switches ...; ... that process the values 1 and 0 // have two states. From Cambridge IGCSE 0478/11, November 2023, Question 2(d)." },
    // ================================================= The subtract method
    { id: "pl-06", category: "pl-method", randomize: function () {
        var n = rnd(9, 250), a = first(n);
        return { prompt: "You convert " + n + " to 8-bit binary. Which place value gets the first 1?\n" + PVLINE, answers: [String(a)], keywords: [num(a)],
          distractors: drillWrongNumbers(a, [a * 2 <= 128 ? a * 2 : a / 4, a / 2, n, 3], 3),
          working: ["Start at 128. Does it fit in " + n + "?", "Move right until a place value fits."], note: "The biggest place value that fits in " + n + " is " + a + "." };
      } },
    { id: "pl-07", category: "pl-method", randomize: function () {
        var n, k, left;
        do { n = rnd(20, 250); k = rnd(0, 2); left = n; for (var j = 0; j < k; j++) if (left >= PV[j]) left -= PV[j]; } while (left === 0 || left === PV[k]);
        var p = PV[k], after = left >= p ? left - p : left;
        return { prompt: "You are converting " + n + ". " + left + " is left. The next place value is " + p + ".\nWhat is left after the " + p + " column?\n" + PVLINE, answers: [String(after)], keywords: [num(after)],
          distractors: drillWrongNumbers(after, left >= p ? [left, left + p, p] : [Math.abs(left - p), 0, p], 3),
          working: ["Does " + p + " fit in " + left + "?", "Fits: subtract it. Too big: nothing changes."], note: left >= p ? left + " - " + p + " = " + after + "." : p + " is too big for " + left + ", so " + left + " is still left." };
      } },
    { id: "pl-08", category: "pl-method", prompt: "A place value is bigger than what is left. Which bit do you write under it?", answers: ["0"], keywords: [/^\s*(0|zero|a\s+0|a\s+zero)\s*$/i],
      distractors: ["1", "2"], working: ["Can that place value fit?", "A 1 would add it. Would the total be too big?"], note: "It does not fit, so write 0. What is left stays the same." },
    { id: "pl-09", category: "pl-method", prompt: "While converting, 0 is left before the last three columns. Which bit goes in each of those columns?", answers: ["0"], keywords: [/^\s*(0|zero|0s|zeros|zeroes|all\s+0s?|000)\s*$/i],
      distractors: ["1", "111"], working: ["Nothing is left to make.", "Does any place value fit in 0?"], note: "Nothing is left, so every column still to do gets a 0." },
    { id: "pl-10", category: "pl-method", randomize: function () {
        var r = drillPick(REAL), n = r[0], b = bin8(n), o = [];
        for (var i = 0; i < 8; i++) if (b[i] === "1") o.push(PV[i]);
        var alt = o.slice().sort(function (x, y) { return String(y).length - String(x).length; }).join("|");
        var s = "^"; o.forEach(function (x) { s += "(?=(?:.*\\D)?" + x + "(?:\\D|$))"; });
        var kwd = new RegExp(s + "\\s*(?:(?:" + alt + ")(?!\\d)\\s*(?:,|\\+|&|and)?\\s*)+(?:=\\s*" + n + "\\s*)?$", "i");
        var all = PV.filter(function (x) { return o.indexOf(x) < 0; }).join(", ");
        var dist = [all, o.slice(1).join(", "), o.concat([PV.filter(function (x) { return o.indexOf(x) < 0; })[0]]).join(", ")].filter(function (x, i, a) { return x && x !== o.join(", ") && a.indexOf(x) === i; });
        return { prompt: "Show your working: which place values add up to " + n + "?\n" + PVLINE, answers: [o.join(", ")], keywords: [kwd], distractors: dist, format: "Type the place values, with commas between them",
          working: ["Start at 128 and subtract each place value that fits.", "Write down each place value you subtracted."], note: n + " = " + o.join(" + ") + ". " + r[1] };
      } },
    // ================================================= Real exam conversions
    { id: "pl-11", category: "pl-convert", randomize: function () { return convCard(drillPick(REAL.filter(function (r) { return r[0] < 64; })), true); } },
    { id: "pl-12", category: "pl-convert", randomize: function () { return convCard(drillPick(REAL.filter(function (r) { return r[0] >= 64 && r[0] < 128; })), true); } },
    { id: "pl-13", category: "pl-convert", randomize: function () { return convCard(drillPick(REAL.filter(function (r) { return r[0] >= 128; })), true); } },
    { id: "pl-14", category: "pl-convert", randomize: function () { return convCard(drillPick(REAL), false); } },
    { id: "pl-15", category: "pl-convert", randomize: function () { return convCard(drillPick(REAL), true); } },
    { id: "pl-16", category: "pl-convert", prompt: "Parking costs are stored in two 8-bit registers: $10.50 is stored as 10 and 50. The cost is $14.98. Give the 8-bit binary number stored in register 2.",
      answers: ["01100010"], keywords: [/^\s*0\s*1\s*1\s*0\s*0\s*0\s*1\s*0(\s*(in\s+)?binary)?\s*$/i], distractors: ["00001110", "1100010", "01000110"], format: "Type the 8 bits",
      working: ["Register 2 holds the cents.", "Convert that number to 8-bit binary."],
      note: "98 = 64 + 32 + 2 = 01100010. Register 1 holds 14 = 00001110. From Cambridge IGCSE 0478/11, November 2023, Question 2(b)." },
    // ================================================= Check by converting back
    { id: "pl-17", category: "pl-check", randomize: function () {
        var r = drillPick(REAL.filter(function (x) { return x[0] > 12; })), n = r[0], s = samSlip(n);
        return { prompt: "Sam converted " + n + " to 8-bit binary and wrote " + s + ". Convert Sam's answer back to denary.\n" + PVLINE, answers: [String(val(s))], keywords: [num(val(s))],
          distractors: drillWrongNumbers(val(s), [n, val(s) + 1, val(s) - 1], 3),
          working: ["Find each 1 in Sam's answer.", "Add the place values above them."], note: s + " = " + (plus(s) || "0") + " = " + val(s) + ", not " + n + ". " + r[1] };
      } },
    { id: "pl-18", category: "pl-check", randomize: function () {
        var r = drillPick(REAL.filter(function (x) { return x[0] > 12; })), n = r[0], s = samSlip(n), b = bin8(n);
        return { prompt: "Sam says " + n + " is " + s + ". Converted back, that is " + val(s) + ". Give the right 8-bit binary for " + n + ".", answers: [b], keywords: [binRe(b, true)],
          distractors: [s].concat(wrongBins(n, true).filter(function (x) { return x !== s; })).slice(0, 3), format: "Type the 8 bits",
          working: ["Start again from 128.", "Fits: write 1 and subtract. Too big: write 0."], note: n + " = " + plus(b) + " = " + b + ". " + r[1] };
      } },
    { id: "pl-19", category: "pl-check", randomize: function () {
        var n = rnd(20, 240), b = bin8(n), right = Math.random() < 0.5, s = right ? b : samSlip(n);
        if (s === b && !right) s = b;
        return { prompt: "Ana says " + n + " is " + s + " in 8-bit binary. Convert her answer back. What denary value does it give?\n" + PVLINE, answers: [String(val(s))], keywords: [num(val(s))],
          distractors: drillWrongNumbers(val(s), [val(s) + 1, val(s.split("").reverse().join("")), val(s) - 1, val(s) + 2], 3),
          working: ["Find each 1 in Ana's answer.", "Add the place values above them. Is it " + n + "?"], note: s + " = " + (plus(s) || "0") + " = " + val(s) + (val(s) === n ? ". It matches, so Ana is right." : ", not " + n + ", so Ana made a slip.") };
      } },
    { id: "pl-20", category: "pl-convert", prompt: "Calculate the binary number for the denary number 175.", answers: ["10101111"], keywords: [/^\s*1\s*0\s*1\s*0\s*1\s*1\s*1\s*1(\s*(in\s+)?binary)?\s*$/i],
      distractors: ["11110101", "10101110", "10111111"], format: "Type the binary number",
      working: ["Start at 128. Fits: write 1 and subtract. Too big: write 0.", "The mark scheme also gives a mark for the place values you used."],
      note: "175 = 128 + 32 + 8 + 4 + 2 + 1 = 10101111. From Cambridge IGCSE 0478/13, November 2024, Question 1(c)(i)." }
  ];
}

const DRILLS = [
  ['y11-1-2-ext', 'Do Now Extension: the whole of 1.1. Every card has an example on different numbers and two nudges.',
    'Year 11 Extension: Binary Place Values Recap', '1.2 Do Now Extension',
    [['ex-places', 'Place Values'], ['ex-convert', 'Binary to Denary'], ['ex-range', 'Largest and Smallest']], extCards],
  ['y11-1-2-fit', 'Activity 2: find the first 1, work out what is left, convert, and check Sam\'s answers by converting back.',
    'Year 11, 1.2: Fit, Subtract, Check', 'Cambridge IGCSE Computer Science 0478',
    [['ft-first', 'The First 1'], ['ft-left', 'What Is Left?'], ['ft-convert', 'Convert'], ['ft-check', 'Check It Back']], fitCards],
  ['y11-1-2-binary', 'Plenary: why the method works, the subtract method, real exam conversions and checking by converting back.',
    'Year 11, 1.2: Denary to Binary', 'Cambridge IGCSE Computer Science 0478',
    [['pl-why', 'Why It Works'], ['pl-method', 'The Subtract Method'], ['pl-convert', 'Exam Conversions'], ['pl-check', 'Check It Back']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/hexadecimal|\bhex\b|two.s complement|overflow|\bbytes?\b|nibble|ascii|mario|\bdecimal\b/i.test(src), `drill ${id} names a later term`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes and is the real conversion of its number, no distractor passes,
// and no example or working step gives the answer away.
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
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  ', ans + '.'].forEach((v) => assert(pass(v.trim().replace(/\.$/, '')) || pass(v), `${id} ${card.id}: variant "${v}" fails`));
        if (/^[01]{5,8}$/.test(ans)) {
          assert(pass(ans.slice(0, 4) + ' ' + ans.slice(4)), `${id} ${card.id}: spaced binary fails`);
          if (/8-bit|8 bits/.test(r.prompt + (r.format || ''))) assert(ans.length === 8 && (ans[0] === '1' || !pass(ans.replace(/^0+/, ''))), `${id} ${card.id}: 8-bit answer accepts fewer bits`);
        }
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors`);
        assert(!(r.distractors || []).includes(ans), `${id} ${card.id}: answer among distractors`);
        // A conversion card: the answer is the real conversion of the number in its prompt.
        const c1 = /^Convert (?:the denary number )?(\d+) to (?:8-bit )?binary/.exec(r.prompt) || /Give the right 8-bit binary for (\d+)/.exec(r.prompt);
        if (c1) assert(parseInt(ans, 2) === Number(c1[1]), `${id} ${card.id}: ${c1[1]} is not ${ans}`);
        const c2 = /Convert the (?:4-bit |8-bit )?binary number ([01]+) to denary/.exec(r.prompt) || /Sam says ([01]+) is \d+ in denary/.exec(r.prompt) || /(?:wrote|answer is) ([01]{8})/.exec(r.prompt) || /is ([01]{8}) in 8-bit binary\. Convert her/.exec(r.prompt);
        if (c2 && /denary/.test(r.prompt) && /^\d+$/.test(ans)) assert(Number(ans) === parseInt(c2[1], 2), `${id} ${card.id}: ${c2[1]} is not ${ans}`);
        const c3 = /which place values add up to (\d+)\?/i.exec(r.prompt);
        if (c3) {
          assert(ans.split(', ').map(Number).reduce((a, b) => a + b, 0) === Number(c3[1]), `${id} ${card.id}: place values of ${c3[1]}`);
          assert(!pass('128, 64, 32, 16, 8, 4, 2, 1') || ans === '128, 64, 32, 16, 8, 4, 2, 1', `${id} ${card.id}: every place value passes`);
          assert(!pass(ans + ', 3'), `${id} ${card.id}: an extra number passes`);
        }
        const c4 = /You convert (\d+) to 8-bit binary\. Which place value gets the first 1/.exec(r.prompt);
        if (c4) assert(Number(ans) === PV8.find((p) => p <= Number(c4[1])), `${id} ${card.id}: first 1 for ${c4[1]}`);
        if (r.example && ans.length >= 2) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (r.working && !pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
        if (id.endsWith('-ext') && r.example) {
          const exLines = r.prompt.split('\n').filter((l) => l.trim().length > 12);
          assert(exLines.filter((l) => r.example.toLowerCase().includes(l.trim().toLowerCase())).length < 3, `${id} ${card.id}: example repeats the question`);
        }
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: working nudges`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario|\bdecimal\b/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '1.2: Denary to Binary', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-1-binary in lessons.json
// A one-line insert, read at the last moment (other builders edit this file too); nothing else in the file changes.
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-1-binary"/.exec(raw);
    assert(m && raw.split('"y11-1-1-binary"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-1-binary"').join(`"y11-1-1-binary",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
