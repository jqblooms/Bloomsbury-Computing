// Builds LessonData/y11-1-1-binary.json: Year 11, 1.1: Binary Place Values (syllabus 0478 1.1: why computers use
// binary, the place values of an 8-bit binary number, converting binary to denary). The first lesson of the 2026-27
// Year 11 plan. Denary to binary is the next lesson and hexadecimal comes later, so neither is taught or asked here.
//   node tools/build_y11_1_1_binary.mjs
// It also writes the lesson's three drills, registers a Year 11 "1.1 Number Systems" unit at the end of Year 11's
// units, and writes the worked-example stepper (y11_binary_to_denary) into the shell's js/content/refreshers.html
// between its marker comments.
// Shape: EAL-light, one tiny step per slide, every slide's core question a WHY (Term 1b), a teacher-only Think, Pair,
// Share under every heading, predict-then-check.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers:
//   Do Now:   0478/13 June 2023 Q1(a) (10101110 = 174)
//   Exam:     0478/12 March 2022 Q1(a) (01010101 = 85); 0478/13 June 2025 Q1(c)(i) (00011001 = 25, 10110100 = 180);
//             0478/12 March 2021 Q1(b) (largest 8-bit value 255); 0478/12 March 2025 Q1(a), first three gaps
//             (base 2, smallest 0, largest 255; typed, without the paper's word list)
//   Practice: 0478/11 November 2024 Q3(c)(i), adapted (01111001 = 121; the ASCII context left out)
// Drills: y11-1-1-ext (Do Now Extension), y11-1-1-convert (Activity 2), y11-1-1-binary (plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
const ID = 'y11-1-1-binary';
const P = 'y11-11b';
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
const onVals = (b) => pvs(b.length).filter((_, i) => b[i] === '1');
const sumText = (b) => onVals(b).join(' + ');
// A number answer: the number, optionally "= " before it or "in denary" after it.
const num = (n) => `^\\s*(=\\s*)?${n}(\\s*(in\\s+)?(denary|base\\s*10))?\\s*\\.?\\s*$`;
const binAns = (b) => `^\\s*${[...b].join('\\s*')}\\s*\\.?\\s*$`;

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
// A place-value table: place values on top, bits underneath. hl: indexes marked; bits may be null (header only).
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
const onIdx = (b) => [...b].map((c, i) => (c === '1' ? i : -1)).filter((i) => i >= 0);
const big = (t) => `<div style="text-align:center;${MONO};font-size:34px;font-weight:700;letter-spacing:4px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const pill = (t, tone = '') => `<span style="display:inline-block;padding:6px 12px;border-radius:8px;background:var(--surface-3);font-weight:700;${tone === 'brand' ? 'border:2px solid var(--brand)' : tone === 'good' ? 'color:var(--good);border:2px solid var(--good-line)' : ''}">${t}</span>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
// Denary columns for the Do Now: hundreds, tens, ones.
function denaryTable(digits, hl = -1) {
  const th = 'padding:6px 14px;text-align:center;font-weight:700;font-size:16px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)';
  const td = (i) => `padding:6px 14px;text-align:center;font:700 24px var(--font-mono, monospace);border:1px solid var(--line-strong)${i === hl ? ';background:var(--brand-soft);outline:3px solid var(--brand);outline-offset:-3px' : ''}`;
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${['Hundreds', 'Tens', 'Ones'].map((h) => `<th style="${th}">${h}</th>`).join('')}</tr>` +
    `<tr>${[...digits].map((d, i) => `<td style="${td(i)}"${i === hl ? ' class="wt-hl"' : ''}>${d}</td>`).join('')}</tr></table>`;
}

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
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
const steps = [];

// ---------------------------------------------------------------- Do Now 1: denary place value (gentle, written)
const DN1 = '352';
const WT_PLACE = { title: 'Walk me through it: place value', steps: [
  { text: '<strong>A similar question.</strong> In the number 461, what is each digit worth?', visual: denaryTable('461') },
  { text: 'Find the column of the 4. It is in the <strong>Hundreds</strong> column.', visual: denaryTable('461', 0) },
  { text: '4 hundreds is 400. So the 4 is worth <strong>400</strong>.', visual: denaryTable('461', 0) + note(kw('4 hundreds') + ' = 400') },
  { text: 'The 6 is in the <strong>Tens</strong> column. 6 tens is 60.', visual: denaryTable('461', 1) + note(kw('6 tens') + ' = 60') },
  { text: 'The 1 is in the <strong>Ones</strong> column. It is worth 1.', visual: denaryTable('461', 2) },
  { text: `Now use the same steps for the 3 and the 5 in ${DN1}.`, visual: note('Which column? Then: how many of that column?') },
] };
steps.push(checkStep('do-now', 'Do Now: Place Value (1 of 2)', 'Do Now: Place Value (1 of 2)',
  'Our everyday numbers are called <strong>denary</strong>. Each column has a <strong>place value</strong>: what one digit in that column is worth.', [
    { label: `In ${DN1}, what is the 3 worth?`, answer: num(300), feedback: 'Which column is the 3 in?' },
    { label: `In ${DN1}, what is the 5 worth?`, answer: num(50), feedback: 'Which column is the 5 in?' },
  ], ['In 7 and in 70, the digit 7 is worth different amounts. Why?', 'In 70 the 7 is in the tens column, so it is worth seven tens. The column decides what a digit is worth.'],
  denaryTable(DN1)));
steps[steps.length - 1].walkthrough = WT_PLACE;

// ---------------------------------------------------------------- Do Now 2: have a go (0478/13 June 2023 Q1(a))
// Mark scheme 1(a): 174.
const DN2 = '10101110';
const WT_B = '10010110';
const WT_BIN = { title: 'Walk me through it: binary to denary', steps: [
  { text: `<strong>A similar question.</strong> Convert the binary number ${WT_B} to denary.`, visual: big(WT_B) },
  { text: 'Each binary column is worth <strong>double</strong> the column on its right. Start at 1 on the right.', visual: bitTable(WT_B, { hl: [7], size: 'sm', bitWord: 'Digit' }) },
  { text: 'Keep doubling as you move left: 1, 2, 4, 8, 16, 32, 64, 128. These are the place values.', visual: bitTable(WT_B, { size: 'sm', bitWord: 'Digit' }) },
  { text: 'A <strong>1</strong> means: count this column. A <strong>0</strong> means: skip it.', visual: bitTable(WT_B, { hl: onIdx(WT_B), size: 'sm', bitWord: 'Digit' }) },
  { text: 'Add the place values that have a 1 under them.', visual: bitTable(WT_B, { hl: onIdx(WT_B), size: 'sm', bitWord: 'Digit' }) + line(sumText(WT_B)) },
  { text: `${sumText(WT_B)} = ${val(WT_B)}. So ${WT_B} is <strong>${val(WT_B)}</strong> in denary.`, visual: line(kw(`${sumText(WT_B)} = ${val(WT_B)}`)) },
  { text: `Now do the same with ${DN2}: write the place values, find each 1, then add.`, visual: note('place values &rarr; find each 1 &rarr; add') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Have a Go (2 of 2)', 'Do Now: Have a Go (2 of 2)',
  'A <strong>binary</strong> number uses only the digits 0 and 1. Have a go. ' +
    cite('0478/13, June 2023, Question 1(a)') + ` Computers store data as binary. The binary number ${DN2} is stored.`, [
    { label: 'Convert the binary number to denary.', answer: num(val(DN2)), feedback: 'Stuck? Try Walk me through it.' },
  ], ['Why might a computer use only two digits, 0 and 1?', 'Inside a computer are tiny switches. A switch is either on or off: two states, so two digits.'],
  big(DN2)));
steps[steps.length - 1].walkthrough = WT_BIN;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-1-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Binary Place Values',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Binary Place Values</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> why computers use binary.', 'The <strong>place values</strong> of a binary number, and why they double.', 'How to turn a binary number into <strong>denary</strong>.']) +
    why('Why do you think a computer needs its own number system?', 'A computer is built from switches that are on or off. It needs numbers made from just two digits.') });

// ---------------------------------------------------------------- why binary: two states
const SW = '10110010';
const switchRow = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' + [...SW].map((c) =>
  `<div style="display:grid;gap:6px;justify-items:center"><span style="display:inline-block;width:52px;padding:8px 0;border-radius:8px;text-align:center;font-weight:700;` +
  (c === '1' ? 'background:var(--brand-soft);color:var(--brand-dark);border:2px solid var(--brand)' : 'background:var(--surface-3);color:var(--muted)') + `">${c === '1' ? 'On' : 'Off'}</span>` +
  `<span style="${MONO};font-size:26px;font-weight:700">${c}</span></div>`).join('') + '</div>';
steps.push(concept('concept-binary', 'Why Computers Use Binary',
  'Predict: a switch can only be on or off. Why does a computer need only two digits?',
  '<p>A switch has <strong>two states</strong>. One digit for each state is enough: <strong>0</strong> for off, <strong>1</strong> for on.</p><p>So a computer stores everything as 0s and 1s.</p>',
  columns(facts(['A computer has billions of tiny switches.', 'Each switch is <strong>on</strong> or <strong>off</strong>. There are only two states.', 'Off is <strong>0</strong>. On is <strong>1</strong>.',
    'A number made of only 0s and 1s is <strong>binary</strong>.', 'One binary digit is a <strong>bit</strong>.', 'Binary is <strong>base 2</strong>: 2 digits. Denary is <strong>base 10</strong>: 10 digits.']),
    '<div style="display:grid;gap:14px">' + switchRow + line('8 switches: 8 bits') + '</div>')));

steps.push(mcStep('check-binary', 'Check: Binary and Bits', 'Check: Binary and Bits', '', [
  { prompt: 'Which digits does binary use?', options: ['0 to 9', '1 and 2', '0 and 1', '0 to 7'], correct: 2,
    explain: 'Binary uses only 0 and 1: one digit for off, one for on.' },
  { prompt: 'What is one binary digit called?', options: ['A switch', 'A bit', 'A column', 'A place value'], correct: 1,
    explain: 'One binary digit is a bit.' },
], ['Denary is called base 10. Why?', 'It has ten digits: zero up to nine. When a column is full, a new column starts.']));

// ---------------------------------------------------------------- why each place doubles
const countRows = Array.from({ length: 9 }, (_, n) => {
  const b = n.toString(2).padStart(4, '0');
  const isNew = [1, 2, 4, 8].includes(n);
  const td = `padding:1px 12px;text-align:center;border:1px solid var(--line-strong);font-size:16px${isNew ? ';background:var(--brand-soft);font-weight:700' : ''}`;
  return `<tr><td style="${td}">${n}</td><td style="${td};${MONO};letter-spacing:3px">${b}</td><td style="${td};font-size:14px">${isNew ? 'new column' : ''}</td></tr>`;
}).join('');
const countTable = '<table style="border-collapse:collapse;margin:0 auto"><tr>' +
  ['Denary', 'Binary', ''].map((h) => `<th style="padding:3px 12px;font-size:14px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)">${h}</th>`).join('') + `</tr>${countRows}</table>`;
steps.push(concept('concept-double', 'Why Each Place Value Doubles',
  'Count in binary: 0, then 1. A column can only hold 0 or 1. Predict: why does 2 need a new column?',
  '<p>At 1 the first column is <strong>full</strong>. There is no digit 2, so we write <strong>10</strong>: a 1 in a new column.</p><p>That new column is worth 2. The next new column starts at 4, then 8: each one <strong>double</strong> the last.</p>',
  columns(facts(['Each column holds only <strong>0</strong> or <strong>1</strong>.', 'When a column is full, we start a new column on the left. Denary does this too: 9, then 10.',
    'In binary a new column starts at 1, 2, 4, 8.', 'So each place value is <strong>double</strong> the one on its right.']), countTable)));

// ---------------------------------------------------------------- the 8 place values
const PV8 = pvs(8);
const doubling = '<div style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap">' +
  PV8.map((p) => pill(String(p), 'brand')).join('<b style="margin:0 2px;font-size:14px;color:var(--muted)">&larr;</b>') + '</div>' +
  line('Moving left: <strong>times 2</strong> each time.');
steps.push(concept('concept-places', 'The 8 Place Values',
  'The place values start 1, 2, 4, 8 from the right. Predict the next four. Why?',
  '<p><strong>16, 32, 64, 128.</strong> Each one is double the one before it.</p>',
  facts(['Start with <strong>1</strong> on the right.', 'Double each time as you move left.', 'A binary number with 8 bits is an <strong>8-bit</strong> number. It has 8 place values.']) +
  '<div style="display:grid;gap:12px;margin-top:6px">' + doubling + bitTable(null, { size: 'lg' }) + '</div>'));

steps.push(checkStep('check-places', 'Check: Place Values (1 of 2)', 'Check: Place Values (1 of 2)', 'Type a number for each.', [
  { label: 'Which place value comes after 8?', answer: num(16), feedback: 'Double 8.' },
  { label: 'Which place value comes after 64?', answer: num(128), feedback: 'Double 64.' },
], ['Why do denary place values grow ten times bigger, from ones to tens to hundreds?', 'Denary has ten digits. A column is full at 9, so the next column is worth ten times more.']));
steps.push(checkStep('check-places-2', 'Check: Place Values (2 of 2)', 'Check: Place Values (2 of 2)', 'Start on the left.', [
  { label: 'What is the place value of the column on the far right?', answer: '^\\s*(1|one)\\s*\\.?\\s*$', feedback: 'Where do the place values start?' },
  { label: 'Write all 8 place values, from left to right.', line: true, answer: '^\\s*128[\\s,]+64[\\s,]+32[\\s,]+16[\\s,]+8[\\s,]+4[\\s,]+2[\\s,]+1\\s*\\.?\\s*$', feedback: 'Start with the biggest on the left. Halve each time.' },
], ['Why is it useful to know the 8 place values by heart?', 'Every binary question starts by writing them down. Knowing them saves time and avoids a slip.']));

// ---------------------------------------------------------------- reading a 4-bit number
const B4A = '0101', B4B = '1100';
const exCol = (b) => '<div style="display:grid;gap:4px;padding:10px;border-radius:10px;background:var(--surface-2)">' + bitTable(b, { hl: onIdx(b), size: 'sm' }) + line(`${sumText(b)} = <strong>${val(b)}</strong>`) + '</div>';
steps.push(concept('concept-4bit', 'Reading a 4-Bit Number',
  `Predict: in ${B4A}, the 8 column has a 0. Why do we not add the 8?`,
  '<p>A <strong>0</strong> means off. That column adds nothing.</p><p>We only add the place values with a <strong>1</strong> under them.</p>',
  columns(facts(['A <strong>4-bit</strong> number has 4 place values: 8, 4, 2, 1.', 'Write the place values above the bits.', 'A <strong>1</strong>: add that place value.', 'A <strong>0</strong>: add nothing.', 'The total is the <strong>denary</strong> value.']),
    '<div style="display:grid;gap:12px">' + exCol(B4A) + exCol(B4B) + '</div>')));

const C4 = ['0011', '1001'];
steps.push(checkStep('check-4bit', 'Check: 4-Bit Numbers', 'Check: 4-Bit Numbers', 'Convert each binary number to denary.',
  C4.map((b) => ({ label: `${b}`, answer: num(val(b)), feedback: 'Write 8 4 2 1 above the bits. Add the place values with a 1.' })),
  ['Why do we write the place values above the bits before adding?', 'Then each 1 lines up with its own place value, so we add the right numbers.'],
  bitTable(null, { n: 4, size: 'lg' })));

// ---------------------------------------------------------------- reading an 8-bit number
const B8 = '00100101';
steps.push(concept('concept-8bit', 'Reading an 8-Bit Number',
  `Predict: ${B8} has three 1s. Which place values do we add? Why only those?`,
  `<p><strong>${onVals(B8).join(', ')}.</strong> Only the columns with a 1 count. ${sumText(B8)} = ${val(B8)}.</p>`,
  facts(['The same steps as 4 bits, with all 8 place values.', 'Find each <strong>1</strong>. Add its place value.', 'Skip every <strong>0</strong>.']) +
  '<div style="display:grid;gap:8px;margin-top:4px">' + bitTable(B8, { hl: onIdx(B8) }) + line(`${sumText(B8)} = <strong>${val(B8)}</strong>`) + '</div>'));

// ---------------------------------------------------------------- predict, then check
const PA = '10000000', PB = '01111111';
steps.push(checkStep('predict', 'Predict: Which Is Bigger?', 'Predict: Which Is Bigger?', `${PA} has one 1. ${PB} has seven 1s. Predict first. The next slide checks.`, [
  { label: 'Predict: which binary number is bigger? Type it.', answer: binAns(PA), feedback: 'Look at where the 1s are, not how many there are.' },
], ['Why do the 0s in a binary number matter, if they add nothing?', 'They keep every 1 in its own column. Without them, 101 and 10001 would look the same, but they are 5 and 17.'],
  big(PA) + big(PB)));
steps.push(checkStep('predict-check', 'Check Your Prediction', 'Check Your Prediction', 'Work out both in denary. Was your prediction right?', [
  { label: `Convert ${PA} to denary.`, answer: num(val(PA)), feedback: 'Which place value has the 1?' },
  { label: `Convert ${PB} to denary.`, answer: num(val(PB)), feedback: 'Add 64 + 32 + 16 + 8 + 4 + 2 + 1.' },
], ['1000 has one 1 and 0111 has three. Why is 1000 bigger?', '1000 is 8. 0111 is 4 + 2 + 1 = 7. Each place value is bigger than all the place values to its right added together.'],
  bitTable(null, { size: 'sm', label: false })));

// ---------------------------------------------------------------- worked stepper
const SB = '01101001';
const stepTable = (hl) => bitTable(SB, { hl, size: 'lg' });
const STEPPER = { title: 'Binary to denary, step by step', steps: (() => {
  const on = onIdx(SB), out = [];
  out.push({ title: 'Step 1: write the 8 place values', html: bitTable(null, { size: 'lg' }), note: 'Start with 1 on the right. Double each time as you move left.' });
  out.push({ title: `Step 2: write the bits ${SB} under them`, html: stepTable([]), note: 'One bit under each place value, in the same order.' });
  out.push({ title: 'Step 3: find each 1', html: stepTable(on), note: `The 1s are under ${onVals(SB).join(', ')}. The 0s add nothing.` });
  let total = 0;
  on.forEach((i, k) => {
    const p = PV8[i], before = total;
    total += p;
    out.push({ title: `Step ${4 + k}: add ${p}`, html: stepTable(on.slice(0, k + 1)) + line(k === 0 ? `Total: <strong>${total}</strong>` : `${before} + ${p} = <strong>${total}</strong>`),
      note: k === 0 ? `Start with the first 1 from the left: ${p}.` : `Add the next 1: ${p}.` });
  });
  out.push({ title: `${SB} is ${total} in denary`, html: stepTable(on) + line(`${sumText(SB)} = <strong>${total}</strong>`), note: 'Check: add the place values again. You get the same total.' });
  return out;
})() };
steps.push({ id: 'stepper', label: 'Worked Example: 01101001', type: 'stepper', stepperId: `${P}-stepper`, stepperKey: 'y11_binary_to_denary',
  content: '<h2 class="lesson-h2">Worked Example: 01101001</h2>' +
    why('Why do we add one place value at a time, not all at once?', 'Small steps are easy to check. A slip is easy to spot.') +
    '<p class="lesson-lead">Press <strong>Next step</strong>. One small step at a time.</p>' +
    `<div id="${P}-stepper" class="lesson-stepper"></div>` });

// ---------------------------------------------------------------- activity 1
steps.push({ id: 'activity-1', label: 'Activity 1: Binary to Denary Practice', type: 'sequential-practice', practiceType: 'binary_to_denary', containerId: `${P}-activity-1`,
  content: '<h2 class="lesson-h2">Activity 1: Binary to Denary Practice</h2>' +
    why('Why are the place values the same for every 8-bit number?', 'Every 8-bit number uses the same 8 columns. Only the bits change.') +
    '<p class="lesson-lead">Four numbers, each under its place values. Find each 1, then add. Then keep going.</p>' +
    `<div id="${P}-activity-1"></div>` });

/// ---------------------------------------------------------------- exam questions
// Every value below is the mark scheme's answer, and is worked out again in the self-checks.
const examTps = (q, a) => [q, a];
const conv = (b, extra = {}) => Object.assign({ label: b, answer: num(val(b)), feedback: 'Find each 1. Add its place value.' }, extra);
const sideTable = bitTable(null, { size: 'sm', label: false });
// 0478/12 March 2022 Q1(a): 85. 0478/12 November 2023 Q2(a): 227.
const E1 = '01010101', E1B = '11100011';
steps.push(checkStep('exam-1', 'Exam Questions: Convert to Denary (1 of 6)', 'Exam Questions: Convert to Denary (1 of 6)',
  `Part (a): ${cite('0478/12, March 2022, Question 1(a)')} Part (b): ${cite('0478/12, November 2023, Question 2(a)')} A register stores the binary number ${E1B}.`, [
    conv(E1, { label: `Convert the 8-bit binary number ${E1} to denary.` }),
    conv(E1B, { label: 'Give the denary number for the binary number stored in the register.' }),
  ], examTps('The paper gives a working space for these 1-mark questions. Why use it?', 'Writing the place values above the bits helps you add the right numbers and avoid a slip.'), sideTable));
// 0478/13 June 2025 Q1(c)(i): 25; 180 (one mark each).
const E2 = ['00011001', '10110100'];
steps.push(checkStep('exam-2', 'Exam Question: Convert to Denary (2 of 6)', 'Exam Question: Convert to Denary (2 of 6)',
  cite('0478/13, June 2025, Question 1(c)(i)') + ` A student records himself singing a song. The recorded sound is converted to binary. Two binary numbers stored from the recording are ${E2[0]} and ${E2[1]}. Convert the two binary numbers to denary numbers.`,
  E2.map((b) => conv(b)),
  examTps('Why is a 1 in the leftmost column worth so much more than a 1 on the right?', 'The leftmost place value is 128 and the rightmost is 1. Each column is double the one on its right.'), sideTable));
// 0478/13 June 2026 Q8(b): 41; 180.
const E3 = ['00101001', '10110100'];
steps.push(checkStep('exam-3', 'Exam Question: Convert to Denary (3 of 6)', 'Exam Question: Convert to Denary (3 of 6)',
  cite('0478/13, June 2026, Question 8(b)') + ` A building has a security keypad. A 3-digit denary number is input and converted to an 8-bit binary number. Two binary numbers are ${E3[0]} and ${E3[1]}. Give the denary numbers that were input for these binary numbers.`,
  E3.map((b) => conv(b)),
  examTps('A number you met earlier comes back here. Why check it again instead of copying it?', 'Exams reuse numbers, but a copied slip stays a slip. Working it out again is quick with the place values.'), sideTable));
// 0478/11 November 2025 Q1(c): 11. Q1(d): 66.
const E4 = ['00001011', '01000010'];
steps.push(checkStep('exam-4', 'Exam Question: Convert to Denary (4 of 6)', 'Exam Question: Convert to Denary (4 of 6)',
  cite('0478/11, November 2025, Question 1(c) and (d)') + ' A student has a calculator with 8-bit registers. The result of a calculation is stored in a register. Give the denary number that will be displayed on the screen for each binary number.',
  E4.map((b) => conv(b)),
  examTps('A number has only small 1s on the right. Why will its denary value be small?', 'The right-hand place values are 1, 2, 4 and 8. Adding only those gives at most 15.'), sideTable));
// 0478/13 November 2025 Q1(b)(iii): 19. Q1(b)(iv): 34.
const E5 = ['00010011', '00100010'];
steps.push(checkStep('exam-5', 'Exam Question: Convert to Denary (5 of 6)', 'Exam Question: Convert to Denary (5 of 6)',
  cite('0478/13, November 2025, Question 1(b)(iii) and (iv)') + ' A shop owner enters a denary number to set the room temperature. It is stored as a binary number in a register. Give the denary number that has been entered for each binary number to be stored.',
  E5.map((b) => conv(b)),
  examTps('Why do the leading 0s on the left not change the denary value?', 'A 0 adds nothing, wherever it is. Only the 1s count.'), sideTable));
// 0478/11 November 2023 Q2(a). Mark scheme: 17; 70 (in the correct order): $17.70.
const E6 = ['00010001', '01000110'];
steps.push(checkStep('exam-6', 'Exam Question: The Parking Cost (6 of 6)', 'Exam Question: The Parking Cost (6 of 6)',
  cite('0478/11, November 2023, Question 2(a)') + ` The cost of parking is stored in two 8-bit binary registers. For a cost of $10.50, register 1 stores the denary value 10 as binary and register 2 stores the denary value 50 as binary. Register 1 stores ${E6[0]}. Register 2 stores ${E6[1]}.`, [
    { label: 'Give the parking cost that would be displayed on the payment machine.', marks: 2,
      answer: `^\\s*\\$?\\s*${val(E6[0])}\\s*[.,:]\\s*${val(E6[1])}\\s*(dollars?)?\\s*\\.?\\s*$`, feedback: 'Convert each register to denary. Register 1 gives the dollars, register 2 the cents.' },
  ], examTps('$10.50 is stored as 10 and 50. Why are two registers used, not one?', 'Each register holds one whole number. One holds the dollars and one holds the cents.'), sideTable));

// ---------------------------------------------------------------- the largest 8-bit number
const ALL = '11111111';
steps.push(concept('concept-255', 'Why 11111111 Is 255',
  'Every bit is 1: 11111111. Predict its denary value. Why can no 8-bit number be bigger?',
  `<p>${sumText(ALL)} = <strong>${val(ALL)}</strong>.</p><p>Every place value is already added. One more would need a 9th column, worth 256.</p>`,
  columns(facts(['<strong>Largest</strong>: every bit is 1, so every place value is added.', `${sumText(ALL)} = <strong>${val(ALL)}</strong>.`,
    '<strong>Smallest</strong>: every bit is 0. 00000000 is <strong>0</strong>.', 'One more than 255 needs a 9th column, worth 256. An 8-bit number has no 9th column.']),
    '<div style="display:grid;gap:10px">' + bitTable(ALL, { hl: onIdx(ALL), size: 'sm', label: false }) + line(`Largest: <strong>${val(ALL)}</strong>`) +
    bitTable('00000000', { size: 'sm', label: false }) + line('Smallest: <strong>0</strong>') + '</div>')));

// 0478/12 March 2021 Q1(b). Mark scheme: 255.
steps.push(checkStep('exam-max', 'Exam Question: The Largest Value', 'Exam Question: The Largest Value',
  cite('0478/12, March 2021, Question 1(b)') + ' A hockey club records the number of people that watch each match. An 8-bit binary register is used to store this value. (A register is a small store inside the computer.)', [
    { label: 'Give the largest denary value that can be stored in the 8-bit binary register.', answer: num(255), feedback: 'Which bits are 1 in the largest 8-bit number? Add their place values.' },
  ], ['A 4-bit number has place values 8, 4, 2, 1. Why is its largest value 15?', 'All four bits are 1: 8 + 4 + 2 + 1 = 15. A bigger number would need a fifth column.']));

// 0478/12 March 2025 Q1(a), the first three gaps. Mark scheme (1 mark each): base 2; 0; 255. The paper gives a word
// list and goes on to hexadecimal; here the three binary gaps are typed.
steps.push(checkStep('exam-gaps', 'Exam Question: Number Systems (1 of 2)', 'Exam Question: Number Systems (1 of 2)',
  'Adapted from ' + cite('0478/12, March 2025, Question 1(a)') + ' Complete the sentences about number systems.', [
    { label: 'The binary number system is base ______.', answer: '^\\s*(base\\s*)?(2|two)\\s*\\.?\\s*$', feedback: 'How many digits does binary use?' },
    { label: 'The smallest denary number that can be represented as an 8-bit binary number is ______.', answer: num('(0|zero)'), feedback: 'What is 00000000 in denary?' },
  ], ['Why do the sentences say 8-bit? Why does the number of bits matter?', 'The number of bits decides how many place values there are. More bits means bigger numbers can be stored.']));
steps.push(checkStep('exam-gaps-2', 'Exam Question: Number Systems (2 of 2)', 'Exam Question: Number Systems (2 of 2)',
  'Adapted from ' + cite('0478/12, March 2025, Question 1(a)') + ' Complete the sentence about number systems.', [
    { label: 'The largest denary number that can be represented as an 8-bit binary number is ______.', answer: num(255), feedback: 'What is 11111111 in denary?' },
  ], ['A 3-bit number has place values 4, 2, 1. Why is its largest value 7?', 'All three bits are 1: 4 + 2 + 1 = 7. A bigger number needs a fourth column.']));

// 0478/13 November 2023 Q2(a). Mark scheme, any two from: it has a base of 2; it only uses two values; ... that are 1
// and 0.
const IDEA_BASE = 'base\\s*-?\\s*(of\\s+)?(2|two)\\b';
const IDEA_TWO = '\\b((two|2)\\s+(different\\s+)?(values?|digits?|states?|numbers?|symbols?|options?)|only\\s+(uses?\\s+|has\\s+)?(two|2)\\b|only\\s+(uses?\\s+|has\\s+)?(the\\s+)?(digits?\\s+|values?\\s+)?(1|0|one|zero)s?\\b)';
const IDEA_10 = '\\b((1|one)s?\\s*(and|or|,|&)\\s*(0|zero)s?|(0|zero)s?\\s*(and|or|,|&)\\s*(1|one)s?)\\b';
const twoOf = (a, b, c) => `^(?:(?=.*${a})(?=.*${b})|(?=.*${a})(?=.*${c})|(?=.*${b})(?=.*${c})).*$`;
steps.push(checkStep('exam-explain', 'Exam Question: What Is Binary?', 'Exam Question: What Is Binary?',
  cite('0478/13, November 2023, Question 2(a)') + ' Humans use a denary number system and computers use a binary number system.', [
    { line: true, marks: 2, label: 'Explain what is meant by a binary number system.', answer: twoOf(IDEA_BASE, IDEA_TWO, IDEA_10),
      feedback: 'Two ideas: its base, and which values it uses.' },
  ], ['Why is denary called a base 10 number system?', 'It uses ten digits, zero up to nine. A new column starts after nine.']));

// 0478/12 June 2022 Q1(a) and 0478/13 November 2022 Q2(a): draw one line from each denary value to its 8-bit binary
// value. Here each denary value is a choice from the paper's binary values; the answer is found by converting the
// binary values to denary. Mark scheme lines: 41 to 00101001, 86 to 01010110; 72 to 01001000, 245 to 11110101.
const M22 = ['00100001', '10100110', '00101001', '10000110', '10101110', '01010110'];
const N22 = ['11110101', '01110010', '11100101', '00010101', '00001111', '01001000'];
function matchItem(ref, list, d, others, k) {
  const answer = list.find((b) => val(b) === d);
  const opts = [answer, ...others];
  const order = [[1, 0, 2, 3], [2, 1, 0, 3], [3, 1, 2, 0], [0, 1, 2, 3]][k];
  const options = order.map((i) => opts[i]);
  return { prompt: `${ref ? ref + ' ' : ''}Convert each option to denary. Which 8-bit binary value is ${d}?`, options, correct: options.indexOf(answer),
    explain: `${answer} = ${sumText(answer)} = ${d}.` };
}
const matchTps = ['Why convert every option, not guess from its pattern?', 'One bit in a different column changes the value a lot. Only converting shows which one is right.'];
steps.push(mcStep('exam-match', 'Exam Question: Match the Binary Value (1 of 2)', 'Exam Question: Match the Binary Value (1 of 2)',
  'Adapted from ' + cite('0478/12, June 2022, Question 1(a)') + '', [
    matchItem('', M22, 41, ['00100001', '10100110', '10000110'], 1),
  ], matchTps));
steps.push(mcStep('exam-match-2', 'Exam Question: Match the Binary Value (2 of 2)', 'Exam Question: Match the Binary Value (2 of 2)',
  'Adapted from ' + cite('0478/13, November 2022, Question 2(a)') + '', [
    matchItem('', N22, 245, ['11100101', '01110010', '00010101'], 2),
  ], ['Why work out every option before you choose?', 'Then you compare numbers, not patterns of 1s and 0s, and the match is certain.']));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Find the 1s, Then Add', 'drill-y11-1-1-convert', 'Activity 2: Find the 1s, Then Add',
  'Find the place values with a 1. Add them. Then fix Sam\'s mistakes. Most numbers come from real exam papers.',
  ['Why find the place values first, and add second?', 'If you pick the wrong columns, the total is wrong, even when the adding is right.']));

// ---------------------------------------------------------------- checked practice
// 0478/11 November 2024 Q3(c)(i). Mark scheme: 121 (the paper's character and ASCII context are left out).
// 0478/12 March 2023 Q6(a), one cell of the table: turn right, 01011010, denary 90 (the other cells are hexadecimal).
// 0478/12 June 2022 Q1(a): 86 is 01010110; 0478/13 November 2022 Q2(a): 72 is 01001000.
const PR = ['01111001', '01011010', '01010110', '01001000'];
steps.push(checkStep('practice', 'Practice: Binary to Denary (1 of 2)', 'Practice: Binary to Denary (1 of 2)',
  `Adapted from: (a) ${cite('0478/11, November 2024, Question 3(c)(i)')} (b) ${cite('0478/12, March 2023, Question 6(a)')}`,
  PR.slice(0, 2).map((b) => conv(b, { label: `Convert ${b} to denary.` })),
  ['Why is it worth adding your place values a second time?', 'A small slip changes the answer. Adding again catches it.'], sideTable));
steps.push(checkStep('practice-2', 'Practice: Binary to Denary (2 of 2)', 'Practice: Binary to Denary (2 of 2)',
  `Adapted from: (a) ${cite('0478/12, June 2022, Question 1(a)')} (b) ${cite('0478/13, November 2022, Question 2(a)')}`,
  PR.slice(2).map((b) => conv(b, { label: `Convert ${b} to denary.` })),
  ['Why start from the left when you add the place values?', 'The biggest place values are on the left. Starting there, the running total grows in big steps first.'], sideTable));
steps.push(checkStep('practice-why', 'Practice: Why?', 'Practice: Why?', 'Answer in a short sentence.', [
  { line: true, label: 'Why is 11111111 the largest 8-bit number?',
    answer: '^(?=.*\\b(all|every|each|eight|8)\\b)(?=.*\\b(1s?|ones?|on|used|added|full|filled)\\b)(?=.*\\b(no\\s+more|cannot|can.?t|9th|ninth|nine|9|256|another|extra|new|next|more\\s+(bits?|columns?|places?))\\b).*$',
    feedback: 'Two ideas: what every bit is, and what one more would need.' },
  { line: true, label: 'Why is each place value double the one on its right?',
    answer: '^(?=.*\\b(only|two|2|0\\s+(and|or)\\s+1|1\\s+(and|or)\\s+0|full|no\\s+(digit\\s+)?2|binary|base\\s*2)\\b)(?=.*\\b(new|next|another|carr\\w*|move\\w*|start\\w*|columns?|left)\\b).*$',
    feedback: 'Two ideas: what one column can hold, and what happens when it is full.' },
], ['Why do exams ask why, not only how?', 'Knowing why helps you remember the method and spot a wrong answer.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Binary Place Values Drill', 'drill-y11-1-1-binary', 'Plenary: Binary Place Values Drill',
  'Why binary, the place values, and binary to denary. Your progress is saved.',
  ['Why practise with new numbers every time?', 'Then you know the method, not just one answer.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
/// Every binary value on a slide, checked against the mark schemes.
assert(val(DN2) === 174, '0478/13 June 2023 Q1(a) is 174');
assert(val(E1) === 85 && val(E1B) === 227, '0478/12 March 2022 Q1(a) is 85; 0478/12 November 2023 Q2(a) is 227');
assert(val(E2[0]) === 25 && val(E2[1]) === 180, '0478/13 June 2025 Q1(c)(i) is 25 and 180');
assert(val(E3[0]) === 41 && val(E3[1]) === 180, '0478/13 June 2026 Q8(b) is 41 and 180');
assert(val(E4[0]) === 11 && val(E4[1]) === 66, '0478/11 November 2025 Q1(c) and (d) are 11 and 66');
assert(val(E5[0]) === 19 && val(E5[1]) === 34, '0478/13 November 2025 Q1(b)(iii) and (iv) are 19 and 34');
assert(val(E6[0]) === 17 && val(E6[1]) === 70, '0478/11 November 2023 Q2(a) is $17.70');
assert(val(ALL) === 255, '11111111 is 255');
assert(PR.map(val).join() === '121,90,86,72', 'practice values from the mark schemes');
// The matching questions: each denary value has exactly one binary value on its paper (the mark scheme's line).
[[M22, [41, 174, 86], ['00101001', '10101110', '01010110']], [N22, [72, 245, 15], ['01001000', '11110101', '00001111']]].forEach(([list, ds, want]) =>
  ds.forEach((d, i) => { const hits = list.filter((b) => val(b) === d); assert(hits.length === 1 && hits[0] === want[i], `matching ${d}`); }));
steps.filter((s) => /^exam-match/.test(s.id)).flatMap((s) => s.items).forEach((it) => {
  assert(it.options.filter((o) => val(o) === Number(/value is (\d+)\?/.exec(it.prompt)[1])).length === 1, 'one matching option');
  assert(val(it.options[it.correct]) === Number(/value is (\d+)\?/.exec(it.prompt)[1]), 'correct option');
});
assert(new Set(steps.filter((s) => s.type === 'multiple-choice').flatMap((s) => s.items.map((it) => it.correct))).size >= 2, 'correct options vary');
assert(val(WT_B) === 150 && val(SB) === 105 && val(B8) === 37 && val(B4A) === 5 && val(B4B) === 12, 'worked examples');
assert(C4.map(val).join() === '3,9' && val(PA) === 128 && val(PB) === 127, 'check values');
assert(PV8.join(' ') === '128 64 32 16 8 4 2 1', 'place values');
ok('do-now', 0, ['300', ' 300 ', '300.'], ['3', '30', '3000', '352']);
ok('do-now', 1, ['50', '50 '], ['5', '500', '15']);
ok('do-now-2', 0, ['174', '174 in denary', '= 174'], ['17', '1740', '117', '74', '10101110']);
ok('check-places-2', 0, ['1', 'one'], ['2', '128', '10']);
ok('check-places', 0, ['16'], ['10', '9', '12']);
ok('check-places', 1, ['128'], ['100', '65', '256']);
ok('check-places-2', 1, ['128 64 32 16 8 4 2 1', '128, 64, 32, 16, 8, 4, 2, 1'], ['1 2 4 8 16 32 64 128', '128 64 32 16 8 4 2', '128 64 32 16 8 4 2 0']);
ok('check-4bit', 0, ['3'], ['2', '11', '12', '0011']);
ok('check-4bit', 1, ['9'], ['2', '1001', '6']);
ok('predict', 0, ['10000000', '1000 0000'], ['01111111', '1111111', '128']);
ok('predict-check', 0, ['128', '128 in denary'], ['1', '127', '256']);
ok('predict-check', 1, ['127'], ['7', '128', '254']);
ok('exam-1', 0, ['85', '85 denary'], ['170', '4', '84', '58']);
ok('exam-1', 1, ['227'], ['199', '5', '226', '11100011']);
ok('exam-2', 0, ['25'], ['152', '3', '19']);
ok('exam-2', 1, ['180'], ['45', '4', '170']);
ok('exam-3', 0, ['41'], ['148', '3', '40']);
ok('exam-3', 1, ['180'], ['45', '4']);
ok('exam-4', 0, ['11'], ['208', '3', '1011']);
ok('exam-4', 1, ['66'], ['33', '2', '65']);
ok('exam-5', 0, ['19'], ['200', '3', '10011']);
ok('exam-5', 1, ['34'], ['68', '2', '17']);
ok('exam-6', 0, ['$17.70', '17.70', '17.70 dollars', '$ 17.70'], ['$10.50', '17', '70', '$71.17', '1770', '$136.98']);
ok('exam-max', 0, ['255', '255.'], ['256', '128', '8', '11111111']);
ok('exam-gaps', 0, ['2', 'two', 'base 2'], ['10', '1', '8']);
ok('exam-gaps', 1, ['0', 'zero'], ['1', '00000001', '-1']);
ok('exam-gaps-2', 0, ['255'], ['256', '128', '8']);
ok('exam-explain', 0, ['it has a base of 2 and only uses two values', 'it uses only 1 and 0', 'base 2, it uses 0 and 1', 'a system that only uses two digits, 1 and 0'],
  ['it is base 2', 'it uses 1s', 'numbers for computers', 'it uses two values']);
ok('practice', 0, ['121'], ['158', '6', '120']);
ok('practice', 1, ['90'], ['45', '4', '91']);
ok('practice-2', 0, ['86'], ['106', '4', '85']);
ok('practice-2', 1, ['72'], ['18', '2', '71']);
ok('practice-why', 0, ['all the bits are 1 so there are no more place values to add', 'every bit is on and 256 would need a 9th bit', 'all 8 bits are 1s so you cannot make it bigger', 'each column is used and the next number needs another column'],
  ['it is the biggest', 'all the bits are 1', 'because 255', 'there are 8 bits']);
ok('practice-why', 1, ['a column only holds 0 or 1 so when it is full a new column starts', 'binary only has two digits so it carries to the next column', 'there is no digit 2 so we need a new column'],
  ['because it doubles', 'it is bigger', 'times 2']);
// Every Do Now walkthrough step (text, picture, both) must fail every part on its slide, and never shows its answers.
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
steps.filter((s) => /^do-now(-\d)?$/.test(s.id)).forEach((s) => {
  assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
  V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
    [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}`));
  }));
});
assert(!/\b(300|50)\b/.test(plain(JSON.stringify(WT_PLACE))), 'place walkthrough gives a Do Now answer');
assert(!/\b174\b/.test(plain(JSON.stringify(WT_BIN))), 'binary walkthrough gives the Do Now answer');
// The worked example and the slide examples never use an exam or check number.
{
  const used = [DN2, E1, E1B, ...E2, ...E3, ...E4, ...E5, ...E6, ...PR, ...C4, PA, PB];
  [WT_B, SB, B8, B4A, B4B].forEach((b) => assert(!used.includes(b), `example ${b} is also a question`));
}
// No term before the slide that teaches it (the title slide only names today's topic).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/denary/i, 'do-now'], [/place value/i, 'do-now'], [/binary/i, 'do-now-2'], [/\bbits?\b|-bit\b/i, 'concept-binary'], [/\bbase\b/i, 'concept-binary'],
    [/8-bit/i, 'concept-places'], [/4-bit/i, 'concept-4bit'], [/hexadecimal|\bhex\b|two.s complement|overflow|\bbytes?\b|nibble|ascii/i, null], [/mario/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
  assert(!/hexadecimal|\bhex\b|\bbytes?\b|ascii/i.test(JSON.stringify(STEPPER)), 'stepper names a later term');
}
// One question per self-marked slide does not apply (none here); every check slide has at most four parts.
steps.filter((s) => s.validatorKey).forEach((s) => assert(V(s.id).length <= 4, `${s.id} has too many parts`));

// ---------------------------------------------------------------- drills
const drillHead = (id, about) => `// Year 11, 1.1: Binary Place Values. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y11_1_1_binary.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString().split('[] /*REAL*/').join(JSON.stringify(REAL.map(([b, , src]) => [b, src])))
    .split('/*TWO_OF*/').join(new RegExp(twoOf(IDEA_BASE, IDEA_TWO, IDEA_10), 'i').toString())})()\n});\n`;
// Real binary values from Paper 1 questions, with the mark scheme's denary value (checked below) and the citation.
const REAL = [
  ['01010101', 85, 'From Cambridge IGCSE 0478/12, March 2022, Question 1(a).'],
  ['11100011', 227, 'From Cambridge IGCSE 0478/12, November 2023, Question 2(a).'],
  ['00011001', 25, 'From Cambridge IGCSE 0478/13, June 2025, Question 1(c)(i).'],
  ['10110100', 180, 'From Cambridge IGCSE 0478/13, June 2025, Question 1(c)(i), and 0478/13, June 2026, Question 8(b).'],
  ['00101001', 41, 'From Cambridge IGCSE 0478/13, June 2026, Question 8(b), and 0478/12, June 2022, Question 1(a).'],
  ['00001011', 11, 'From Cambridge IGCSE 0478/11, November 2025, Question 1(c).'],
  ['01000010', 66, 'From Cambridge IGCSE 0478/11, November 2025, Question 1(d).'],
  ['00010011', 19, 'From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(iii).'],
  ['00100010', 34, 'From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(iv).'],
  ['00010001', 17, 'From Cambridge IGCSE 0478/11, November 2023, Question 2(a).'],
  ['01000110', 70, 'From Cambridge IGCSE 0478/11, November 2023, Question 2(a).'],
  ['01011010', 90, 'Adapted from Cambridge IGCSE 0478/12, March 2023, Question 6(a).'],
  ['01111001', 121, 'Adapted from Cambridge IGCSE 0478/11, November 2024, Question 3(c)(i).'],
  ['10101110', 174, 'From Cambridge IGCSE 0478/13, June 2023, Question 1(a), and 0478/12, June 2022, Question 1(a).'],
  ['01010110', 86, 'From Cambridge IGCSE 0478/12, June 2022, Question 1(a).'],
  ['01001000', 72, 'From Cambridge IGCSE 0478/13, November 2022, Question 2(a).'],
  ['11110101', 245, 'From Cambridge IGCSE 0478/13, November 2022, Question 2(a).'],
  ['00001111', 15, 'From Cambridge IGCSE 0478/13, November 2022, Question 2(a).'],
];
REAL.forEach(([b, d]) => assert(val(b) === d, `real value ${b} is ${d}`));
assert(new Set(REAL.map((r) => r[0])).size === REAL.length, 'real values distinct');

// ---- Do Now Extension: place value and binary to denary at a gentle pace. Every card has an example and two nudges.
// The word "bit" is taught later in the lesson, so these cards say "binary number" and "digit".
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
  function grid(b) { var p = pv(b.length); return "Place value: " + p.map(function (x) { return col(x, 4); }).join("") + "\nDigit:       " + b.split("").map(function (c) { return col(c, 4); }).join(""); }
  function plus(b) { var p = pv(b.length), o = []; for (var i = 0; i < b.length; i++) if (b[i] === "1") o.push(p[i]); return o.join(" + "); }
  function otherBin(w, not) { var b; do { b = bin(rnd(1, Math.pow(2, w) - 1), w); } while (b === not || val(b) === val(not)); return b; }
  function wrong(b) { var a = val(b); return drillWrongNumbers(a, [val(rev(b)), ones(b), a + 1, a - 1, a + 2], 3); }
  var NAMES = ["Hundreds", "Tens", "Ones"], WORTH = [100, 10, 1];
  return [
    { id: "ex-01", category: "ex-place", randomize: function () {
        var n = String(rnd(2, 9)) + String(rnd(2, 9)) + String(rnd(2, 9)), k = rnd(0, 1), d = Number(n[k]), a = d * WORTH[k];
        var m; do { m = String(rnd(1, 9)) + String(rnd(1, 9)) + String(rnd(1, 9)); } while (m[k] === n[k]);
        var e = Number(m[k]) * WORTH[k];
        return { prompt: "In the denary number " + n + ", what is the digit " + d + " worth?\n(Look at its column: hundreds, tens or ones.)", answers: [String(a)], keywords: [num(a)],
          distractors: drillWrongNumbers(a, [d, d * 10 === a ? d * 100 : d * 10, d * 1000, Number(n)], 3),
          example: "Example: in " + m + ", what is the digit " + m[k] + " worth?\nStep 1: find its column. It is in the " + NAMES[k] + " column.\nStep 2: " + m[k] + " " + NAMES[k].toLowerCase() + " is " + m[k] + " x " + WORTH[k] + ".\nStep 3: so it is worth " + e + ".",
          working: ["Which column is the " + d + " in?", "Times the digit by that column's place value."],
          note: "The " + d + " is in the " + NAMES[k] + " column, so it is worth " + a + "." };
      } },
    { id: "ex-02", category: "ex-place", randomize: function () {
        var n = rnd(6, 60), m; do { m = rnd(6, 60); } while (m === n || m * 2 === n * 2);
        return { prompt: "Double means times 2. What is double " + n + "?", answers: [String(n * 2)], keywords: [num(n * 2)],
          distractors: drillWrongNumbers(n * 2, [n + 2, n * 2 + 1, n * 2 - 2, n * 10], 3),
          example: "Example: double " + m + ".\nStep 1: double means add the number to itself.\nStep 2: " + m + " + " + m + " = " + (m * 2) + ".",
          working: ["Add " + n + " to itself.", n + " + " + n + " = ?"], note: n + " + " + n + " = " + (n * 2) + "." };
      } },
    { id: "ex-03", category: "ex-place", randomize: function () {
        var list = [1, 2, 4, 8, 16, 32, 64], k = rnd(2, 6), x = list[k], j; do { j = rnd(1, 5); } while (j === k || list[j] * 2 === x * 2);
        return { prompt: "Binary place values start at 1 and double each time: 1, 2, 4, ... What comes after " + x + "?", answers: [String(x * 2)], keywords: [num(x * 2)],
          distractors: drillWrongNumbers(x * 2, [x + 2, x + 1, x * 10, x * 3], 3),
          example: "Example: what comes after " + list[j] + "?\nStep 1: each place value is double the one before.\nStep 2: double " + list[j] + " is " + list[j] + " + " + list[j] + " = " + (list[j] * 2) + ".",
          working: ["Each place value is double the one before it.", "Double " + x + "."], note: "Double " + x + " is " + (x * 2) + "." };
      } },
    { id: "ex-04", category: "ex-place", prompt: "The binary place values for 4 digits are 8, 4, 2 and 1. Which place value is on the far left?", answers: ["8"], keywords: [num(8)],
      distractors: ["1", "4", "16"],
      example: "Example: the binary place values for 3 digits are 4, 2 and 1.\nStep 1: the place values grow as you move left.\nStep 2: so the biggest, 4, is on the far left, and 1 is on the far right.",
      working: ["The smallest place value, 1, is on the far right.", "The place values grow as you move left."], note: "8 4 2 1: the biggest place value, 8, is on the far left." },
    { id: "ex-05", category: "ex-binary", randomize: function () {
        var b = drillPick(["10", "11"]), e = b === "10" ? "01" : "10";
        return { prompt: "Convert the binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))],
          distractors: drillWrongNumbers(val(b), [Number(b), val(b) + 1, 0, 4], 3),
          example: "Example: convert " + e + ".\nStep 1: the place values are 2 and 1.\nStep 2: the 1 is under the place value " + plus(e) + ".\nStep 3: so " + e + " is " + val(e) + " in denary.",
          working: ["A 1 means: add that place value. A 0 adds nothing.", "Which place values have a 1 under them?"], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "ex-06", category: "ex-binary", randomize: function () {
        var b = bin(rnd(1, 7), 3), e = otherBin(3, b);
        return { prompt: "Convert the binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          example: "Example: convert " + e + ".\nStep 1: the place values are 4, 2, 1.\nStep 2: add each place value with a 1 under it: " + plus(e) + ".\nStep 3: " + plus(e) + " = " + val(e) + ".",
          working: ["A 1 means: add that place value. A 0 adds nothing.", "Which place values have a 1 under them? Add them."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "ex-07", category: "ex-binary", randomize: function () {
        var b = drillPick(["1000", "0100", "0010", "0001"]), e; do { e = drillPick(["1000", "0100", "0010", "0001"]); } while (e === b);
        return { prompt: "Convert the binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))],
          distractors: drillWrongNumbers(val(b), [1, Number(b), val(rev(b)), 0], 3),
          example: "Example: convert " + e + ".\nStep 1: the place values are 8, 4, 2, 1.\nStep 2: only one digit is 1. It is under " + val(e) + ".\nStep 3: so " + e + " is " + val(e) + " in denary.",
          working: ["Only one digit is a 1.", "Which place value is above that 1?"], note: b + " has one 1, under the place value " + val(b) + "." };
      } },
    { id: "ex-08", category: "ex-binary", randomize: function () {
        var b; do { b = bin(rnd(3, 15), 4); } while (ones(b) < 2);
        var e = otherBin(4, b);
        return { prompt: "Convert the binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          example: "Example: convert " + e + ".\nStep 1: the place values are 8, 4, 2, 1.\nStep 2: add each place value with a 1 under it: " + plus(e) + ".\nStep 3: " + plus(e) + " = " + val(e) + ".",
          working: ["Look at each digit. A 1 means: add its place value.", "Add the place values with a 1 under them."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "ex-09", category: "ex-binary", prompt: "In a binary number, a digit is 0. How much does that column add to the denary total?", answers: ["0"], keywords: [/^\s*(0|zero|nothing|none)\s*$/i],
      distractors: ["1", "2", "8"],
      example: "Example: a digit is 1, under the place value 8.\nStep 1: a 1 means: add that place value.\nStep 2: so that column adds 8 to the total.\nNow your question: think about what a 0 means.",
      working: ["A 1 means: add that place value.", "A 0 means the opposite of a 1."], note: "A 0 adds nothing. Only the columns with a 1 count." },
    { id: "ex-10", category: "ex-binary", randomize: function () {
        var b = drillPick(["1111", "0111", "1110", "1011", "1101"]), e = otherBin(4, b);
        return { prompt: "Convert the binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          example: "Example: convert " + e + ".\nStep 1: the place values are 8, 4, 2, 1.\nStep 2: add each place value with a 1 under it: " + plus(e) + ".\nStep 3: " + plus(e) + " = " + val(e) + ".",
          working: ["Look at each digit. A 1 means: add its place value.", "Add the place values with a 1 under them, one at a time."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "ex-11", category: "ex-binary", randomize: function () {
        var R = [["00001011", "From Cambridge IGCSE 0478/11, November 2025, Question 1(c)."], ["00010011", "From Cambridge IGCSE 0478/13, November 2025, Question 1(b)(iii)."],
          ["00010001", "From Cambridge IGCSE 0478/11, November 2023, Question 2(a)."], ["00001111", "From Cambridge IGCSE 0478/13, November 2022, Question 2(a)."]];
        var r = drillPick(R), b = r[0], e; do { e = drillPick(R)[0]; } while (e === b);
        return { prompt: "Convert the binary number " + b + " to denary.\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          example: "Example: convert " + e + ".\nStep 1: the place values are 128, 64, 32, 16, 8, 4, 2, 1.\nStep 2: add each place value with a 1 under it: " + plus(e) + ".\nStep 3: " + plus(e) + " = " + val(e) + ".",
          working: ["The 0s on the left add nothing. Look for the 1s.", "Add the place values with a 1 under them."], note: b + " = " + plus(b) + " = " + val(b) + ". " + r[1] };
      } }
  ];
}

// ---- Activity 2: find the place values with a 1, add them, and fix Sam's mistakes.
function convertCards() {
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
  function on(b) { var p = pv(b.length), o = []; for (var i = 0; i < b.length; i++) if (b[i] === "1") o.push(p[i]); return o; }
  function plus(b) { return on(b).join(" + "); }
  function bits8(minOnes, maxOnes) { var b; do { b = bin(rnd(1, 255), 8); } while (ones(b) < minOnes || ones(b) > maxOnes); return b; }
  // Real past-paper values (each checked against its mark scheme), drawn three times in four.
  var REAL = [] /*REAL*/;
  function pick8(minOnes, maxOnes) {
    var fit = REAL.filter(function (r) { return ones(r[0]) >= minOnes && ones(r[0]) <= maxOnes; });
    if (fit.length && Math.random() < 0.75) { var r = drillPick(fit); return { b: r[0], src: " " + r[1] }; }
    return { b: bits8(minOnes, maxOnes), src: "" };
  }
  function setRe(list, all) {
    var s = "^";
    list.forEach(function (n) { s += "(?=(?:.*\\D)?" + n + "(?:\\D|$))"; });
    var alt = list.slice().sort(function (a, b) { return String(b).length - String(a).length; }).join("|");
    return new RegExp(s + "\\s*(?:(?:" + alt + ")(?!\\d)\\s*(?:,|\\+|&|and)?\\s*)+$", "i");
  }
  function wrongSets(b) {
    var p = pv(b.length), o = on(b), out = [];
    out.push(p.filter(function (x) { return o.indexOf(x) < 0; }).join(", "));
    out.push(on(rev(b)).join(", "));
    var extra = p.filter(function (x) { return o.indexOf(x) < 0; })[0];
    if (o.length > 1) out.push(o.slice(1).join(", ")); else if (extra) out.push(o.concat([extra]).join(", "));
    var mine = o.join(", ");
    return out.filter(function (x, i) { return x && x !== mine && out.indexOf(x) === i; });
  }
  function wrong(b) { var a = val(b); return drillWrongNumbers(a, [val(rev(b)), ones(b), a + 1, a - 1, a + 2], 3); }
  var findCard = function (w, minOnes, maxOnes) {
    return function () {
      var p = w === 4 ? { b: (function () { var x; do { x = bin(rnd(1, 15), 4); } while (ones(x) < minOnes || ones(x) > maxOnes); return x; })(), src: "" } : pick8(minOnes, maxOnes), b = p.b;
      var o = on(b);
      return { prompt: "Which place values have a 1 under them?\n" + grid(b), answers: [o.join(", ")], keywords: [setRe(o, pv(w))], distractors: wrongSets(b), format: "Type the place values, with commas between them",
        working: ["Look at each bit. Is it a 1?", "For each 1, read the place value just above it."], note: "The 1s are under " + o.join(", ") + "." + p.src };
    };
  };
  var addCard = function (w, minOnes, maxOnes) {
    return function () {
      var p = w === 4 ? { b: (function () { var x; do { x = bin(rnd(1, 15), 4); } while (ones(x) < minOnes || ones(x) > maxOnes); return x; })(), src: "" } : pick8(minOnes, maxOnes), b = p.b;
      return { prompt: "Convert this binary number to denary: " + b + "\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
        working: ["Find each 1. Read its place value.", "Add those place values, one at a time."], note: b + " = " + plus(b) + " = " + val(b) + "." + p.src };
    };
  };
  // Sam's mistakes: reading the place values from the wrong end, counting the 1s, or missing one 1.
  var MISTAKES = [
    ["read the place values from the wrong end, with 1 on the left", function (b) { return val(rev(b)); }],
    ["counted how many 1s there are", function (b) { return ones(b); }],
    ["missed the 1 on the far right", function (b) { return val(b) - (b[b.length - 1] === "1" ? 1 : 0); }]
  ];
  var fixCard = function (k) {
    return function () {
      var b, s, p;
      do { p = pick8(2, 5); b = p.b; s = MISTAKES[k][1](b); } while (s === val(b) || (k === 2 && b[7] !== "1"));
      return { prompt: "Sam says " + b + " is " + s + " in denary. Sam is wrong. What is the right denary value?\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))],
        distractors: drillWrongNumbers(val(b), [s, val(rev(b)), ones(b), val(b) + 1], 3),
        working: ["Do not trust Sam. Start again: find each 1 and its place value.", "Add the place values with a 1 under them."], note: "Sam " + MISTAKES[k][0] + ". " + b + " = " + plus(b) + " = " + val(b) + "." + p.src };
    };
  };
  return [
    { id: "cv-01", category: "cv-find", randomize: findCard(4, 2, 3) },
    { id: "cv-02", category: "cv-find", randomize: findCard(8, 2, 3) },
    { id: "cv-03", category: "cv-find", randomize: findCard(8, 3, 4) },
    { id: "cv-04", category: "cv-find", randomize: findCard(8, 4, 5) },
    { id: "cv-05", category: "cv-add", randomize: addCard(4, 2, 4) },
    { id: "cv-06", category: "cv-add", randomize: addCard(8, 1, 2) },
    { id: "cv-07", category: "cv-add", randomize: addCard(8, 2, 3) },
    { id: "cv-08", category: "cv-add", randomize: addCard(8, 3, 5) },
    { id: "cv-09", category: "cv-add", randomize: addCard(8, 4, 7) },
    { id: "cv-10", category: "cv-fix", randomize: fixCard(0) },
    { id: "cv-11", category: "cv-fix", randomize: fixCard(1) },
    { id: "cv-12", category: "cv-fix", randomize: fixCard(2) }
  ];
}

// ---- Plenary: this lesson only. Why binary, the place values, 4-bit and 8-bit numbers (real past-paper values mixed in).
function plenaryCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function val(b) { var t = 0; for (var i = 0; i < b.length; i++) t = t * 2 + (b[i] === "1" ? 1 : 0); return t; }
  function pv(n) { var a = []; for (var i = n - 1; i >= 0; i--) a.push(Math.pow(2, i)); return a; }
  function pad(s, w) { while (s.length < w) s = "0" + s; return s; }
  function bin(n, w) { return pad(n.toString(2), w); }
  function rev(b) { return b.split("").reverse().join(""); }
  function ones(b) { return b.split("").filter(function (c) { return c === "1"; }).length; }
  function num(n) { return new RegExp("^\\s*(=\\s*)?" + n + "(\\s*(in\\s+)?(denary|base\\s*10))?\\s*$", "i"); }
  function col(s, w) { s = String(s); while (s.length < w) s = " " + s; return s; }
  function grid(b) { var p = pv(b.length); return "Place value: " + p.map(function (x) { return col(x, 4); }).join("") + "\nBit:         " + b.split("").map(function (c) { return col(c, 4); }).join(""); }
  function plus(b) { var p = pv(b.length), o = []; for (var i = 0; i < b.length; i++) if (b[i] === "1") o.push(p[i]); return o.join(" + "); }
  function wrong(b) { var a = val(b); return drillWrongNumbers(a, [val(rev(b)), ones(b), a + 1, a - 1, a + 2], 3); }
  function binCard(b, src) {
    return { prompt: "Convert the 8-bit binary number " + b + " to denary.", answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
      working: ["Write 128 64 32 16 8 4 2 1 above the bits.", "Add the place values that have a 1 under them."], note: b + " = " + plus(b) + " = " + val(b) + "." + (src ? " " + src : "") };
  }
  // Real values, each from a Paper 1 mark scheme.
  var REAL = [] /*REAL*/;
  var WHY_255 = /^(?=.*\b(all|every|each|eight|8)\b)(?=.*\b(1s?|ones?|on|used|added|full|filled)\b)(?=.*\b(no\s+more|cannot|can.?t|9th|ninth|nine|9|256|another|extra|new|next|more\s+(bits?|columns?|places?))\b).*$/i;
  return [
    // ================================================= Why binary
    { id: "pl-01", category: "pl-why", prompt: "Why does a computer use binary?", answers: ["It is made of switches that are either on or off"],
      keywords: [/^(?=.*\b(switch\w*|transistors?|circuits?|electric\w*|current|signals?|voltage)\b)(?=.*\b(on|off|two|2|states?|1\s+(and|or)\s+0|0\s+(and|or)\s+1)\b).*$/i],
      distractors: ["Binary numbers are shorter than denary", "Computers cannot add denary numbers", "Binary uses ten digits"],
      working: ["Think about what is inside a computer: billions of tiny switches.", "How many states does a switch have?"],
      note: "A computer is made of switches. Each one is on (1) or off (0): two states, so two digits." },
    { id: "pl-02", category: "pl-why", prompt: "Why is each binary place value double the one on its right?", answers: ["Each column only holds 0 or 1, so when it is full a new column starts"],
      keywords: [/^(?=.*\b(only|two|2|0\s+(and|or)\s+1|1\s+(and|or)\s+0|full|no\s+(digit\s+)?2|binary|base\s*2)\b)(?=.*\b(new|next|another|carr\w*|move\w*|start\w*|columns?|left)\b).*$/i],
      distractors: ["Because computers like big numbers", "Because there are 8 bits", "Because denary is base 10"],
      working: ["Count in binary: 0, 1, then 10. Why does 2 need a new column?", "Each column can only hold 0 or 1. What happens when it is full?"],
      note: "A column only holds 0 or 1. When it is full, a new column starts on the left, so each new column is worth double." },
    { id: "pl-03", category: "pl-why", prompt: "Why is 11111111 the largest 8-bit number?", answers: ["All 8 bits are 1, so there are no more place values to add"],
      keywords: [WHY_255], distractors: ["Because 255 is a big number", "Because it has the most bits", "Because it starts with 1"],
      working: ["In 11111111, which place values are added?", "To go one higher, what would you need?"],
      note: "Every bit is 1, so every place value is added. One more would need a 9th column, worth 256." },
    // ================================================= Place values
    { id: "pl-04", category: "pl-places", prompt: "Which two digits does binary use?", answers: ["0 and 1"],
      keywords: [/^\s*(0|zero)\s*(and|,|&|or)?\s*(1|one)\s*$|^\s*(1|one)\s*(and|,|&|or)?\s*(0|zero)\s*$/i], distractors: ["1 and 2", "0 and 9", "1 and 10"],
      working: ["A switch is off or on.", "Which digit stands for off, and which for on?"], note: "0 for off and 1 for on." },
    { id: "pl-05", category: "pl-places", prompt: "What is one binary digit called?", answers: ["Bit"], keywords: [/^\s*(an?\s+|one\s+)?bits?\s*$/i],
      distractors: ["Switch", "Column", "Digit box"], working: ["Its name is short for binary digit.", "It has three letters."], note: "One binary digit is a bit." },
    { id: "pl-06", category: "pl-places", prompt: "Binary is base 2. Why is it called base 2?", answers: ["It uses only two digits, 0 and 1"],
      keywords: [/^(?=.*\b(two|2)\b)(?=.*\b(digits?|numbers?|values?|states?|symbols?|0|1|options?)\b).*$|^(?=.*\b(0|zero)\b)(?=.*\b(1|one)\b)(?=.*\bonly\b).*$/i],
      distractors: ["It doubles every time", "It has 8 bits", "It starts at 2"],
      working: ["Denary is base 10 because it has ten digits, 0 to 9.", "Count the digits binary uses."], note: "Base 2: binary has only two digits, 0 and 1." },
    { id: "pl-07", category: "pl-places", randomize: function () {
        var list = [1, 2, 4, 8, 16, 32, 64], x = list[rnd(1, 6)];
        return { prompt: "Binary place values double each time: 1, 2, 4, ... What place value comes after " + x + "?", answers: [String(x * 2)], keywords: [num(x * 2)],
          distractors: drillWrongNumbers(x * 2, [x + 2, x + 1, x * 10, x * 3], 3), working: ["Each place value is double the one before it.", "Double " + x + "."], note: "Double " + x + " is " + (x * 2) + "." };
      } },
    { id: "pl-08", category: "pl-places", prompt: "What is the place value of the leftmost column of an 8-bit number?", answers: ["128"], keywords: [num(128)],
      distractors: ["256", "100", "8"], working: ["Start at 1 on the right and double, 8 times in all.", "1, 2, 4, 8, 16, 32, 64, ..."], note: "128 64 32 16 8 4 2 1: the leftmost is 128." },
    { id: "pl-09", category: "pl-places", prompt: "Write the 8 place values of an 8-bit number, from left to right.", answers: ["128 64 32 16 8 4 2 1"], format: "Type the 8 numbers with spaces or commas",
      keywords: [/^\s*128[\s,]+64[\s,]+32[\s,]+16[\s,]+8[\s,]+4[\s,]+2[\s,]+1\s*$/i], distractors: ["1 2 4 8 16 32 64 128", "256 128 64 32 16 8 4 2", "128 64 32 16 8 6 4 2"],
      working: ["The biggest place value is on the left.", "Start at 1 on the right and double as you move left."], note: "128 64 32 16 8 4 2 1." },
    // ================================================= 4-bit numbers
    { id: "pl-10", category: "pl-4bit", randomize: function () {
        var b; do { b = bin(rnd(3, 15), 4); } while (ones(b) < 2);
        return { prompt: "Convert this 4-bit binary number to denary: " + b + "\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          working: ["Find each 1. Read its place value.", "Add those place values."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "pl-11", category: "pl-4bit", randomize: function () {
        var b; do { b = bin(rnd(3, 15), 4); } while (ones(b) < 2);
        return { prompt: "Convert the 4-bit binary number " + b + " to denary.", answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          working: ["The place values for 4 bits, from the left: write them above the bits.", "Add the place values that have a 1 under them."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    { id: "pl-12", category: "pl-4bit", randomize: function () {
        var b = drillPick(["1000", "0100", "0010", "1111"]);
        return { prompt: "Convert the 4-bit binary number " + b + " to denary.", answers: [String(val(b))], keywords: [num(val(b))],
          distractors: drillWrongNumbers(val(b), [val(rev(b)), ones(b), Number(b), val(b) + 1], 3),
          working: ["Write the 4 place values above the bits.", "Add the place values with a 1 under them."], note: b + " = " + plus(b) + " = " + val(b) + "." };
      } },
    // ================================================= 8-bit numbers
    { id: "pl-13", category: "pl-8bit", randomize: function () {
        var fit = REAL.filter(function (r) { return ones(r[0]) <= 3; }), r = drillPick(fit), b = r[0];
        return { prompt: "Convert this 8-bit binary number to denary: " + b + "\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          working: ["Find each 1. Read its place value.", "Add those place values."], note: b + " = " + plus(b) + " = " + val(b) + ". " + r[1] };
      } },
    { id: "pl-14", category: "pl-8bit", randomize: function () {
        var fit = REAL.filter(function (r) { return ones(r[0]) >= 3; }), r = drillPick(fit), b = r[0];
        return { prompt: "Convert this 8-bit binary number to denary: " + b + "\n" + grid(b), answers: [String(val(b))], keywords: [num(val(b))], distractors: wrong(b),
          working: ["Find each 1. Read its place value.", "Add those place values, one at a time."], note: b + " = " + plus(b) + " = " + val(b) + ". " + r[1] };
      } },
    { id: "pl-15", category: "pl-8bit", randomize: function () { var r = drillPick(REAL); return binCard(r[0], r[1]); } },
    { id: "pl-16", category: "pl-8bit", randomize: function () { var b; do { b = bin(rnd(1, 255), 8); } while (ones(b) < 4); return binCard(b, ""); } },
    { id: "pl-17", category: "pl-8bit", randomize: function () { var r = drillPick(REAL); return binCard(r[0], r[1]); } },
    { id: "pl-18", category: "pl-8bit", randomize: function () { var r = drillPick(REAL); return binCard(r[0], r[1]); } },
    { id: "pl-19", category: "pl-8bit", prompt: "Give the largest denary value that can be stored in an 8-bit binary number.", answers: ["255"], keywords: [num(255)],
      distractors: ["256", "128", "8"], working: ["In the largest 8-bit number, every bit is 1.", "Add all 8 place values."],
      note: "11111111 = 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. From Cambridge IGCSE 0478/12, March 2021, Question 1(b), and 0478/11, November 2025, Question 1(a)." },
    { id: "pl-22", category: "pl-why", prompt: "Explain what is meant by a binary number system.", answers: ["It has a base of 2 and only uses two values, 1 and 0"],
      keywords: [/*TWO_OF*/],
      distractors: ["It uses ten digits", "It is a number system for computers", "It has a base of 10"],
      working: ["Two ideas: what is its base?", "Which values does it use?"],
      note: "Any two from the mark scheme: it has a base of 2; it only uses two values; that are 1 and 0. From Cambridge IGCSE 0478/13, November 2023, Question 2(a)." },
    { id: "pl-23", category: "pl-8bit", prompt: "Parking costs are stored in two 8-bit registers: $10.50 is stored as 10 and 50. Register 1 stores 00010001. Register 2 stores 01000110. What cost is displayed?",
      answers: ["$17.70"], keywords: [/^\s*\$?\s*17\s*[.,:]\s*70\s*(dollars?)?\s*$/i], distractors: ["$10.50", "$17.07", "$136.98"], format: "Type the cost, like $1.00",
      working: ["Convert each register to denary.", "Register 1 gives the dollars and register 2 gives the cents."],
      note: "00010001 = 16 + 1 = 17. 01000110 = 64 + 4 + 2 = 70. So $17.70. From Cambridge IGCSE 0478/11, November 2023, Question 2(a)." },
    { id: "pl-20", category: "pl-8bit", prompt: "What is the smallest denary number that can be represented as an 8-bit binary number?", answers: ["0"], keywords: [/^\s*(0|zero)(\s*(in\s+)?denary)?\s*$/i],
      distractors: ["1", "8", "-255"], working: ["In the smallest 8-bit number, every bit is the same digit.", "Which digit adds nothing?"],
      note: "00000000 is 0. From Cambridge IGCSE 0478/12, March 2025, Question 1(a)." },
    { id: "pl-21", category: "pl-8bit", randomize: function () {
        var pair = drillPick([["10000000", "01111111"], ["01000000", "00111111"], ["00100000", "00011111"]]), big = pair[0];
        var order = Math.random() < 0.5 ? pair : [pair[1], pair[0]];
        return { prompt: "Which is bigger: " + order[0] + " or " + order[1] + "? Type the binary number.", answers: [big], keywords: [new RegExp("^\\s*" + big + "\\s*$")],
          distractors: [pair[1]], format: "Type the binary number",
          working: ["Do not count the 1s. Look at where the leftmost 1 is in each.", "Work out both in denary, then compare."],
          note: big + " is " + val(big) + ". " + pair[1] + " is " + val(pair[1]) + ". One 1 in a bigger column beats all the smaller columns added together." };
      } }
  ];
}

const DRILLS = [
  ['y11-1-1-ext', 'Do Now Extension: place value and binary to denary. Every card has an example on different numbers and two nudges.',
    'Year 11 Extension: Place Value and Binary', '1.1 Do Now Extension',
    [['ex-place', 'Place Value'], ['ex-binary', 'Binary to Denary']], extCards],
  ['y11-1-1-convert', 'Activity 2: find the place values with a 1, add them, and fix Sam\'s mistakes.',
    'Year 11, 1.1: Find the 1s, Then Add', 'Cambridge IGCSE Computer Science 0478',
    [['cv-find', 'Find the 1s'], ['cv-add', 'Add Them Up'], ['cv-fix', 'Fix the Mistake']], convertCards],
  ['y11-1-1-binary', 'Plenary: why binary, the place values, and binary to denary.',
    'Year 11, 1.1: Binary Place Values', 'Cambridge IGCSE Computer Science 0478',
    [['pl-why', 'Why Binary?'], ['pl-places', 'Place Values'], ['pl-4bit', '4-Bit Numbers'], ['pl-8bit', '8-Bit Numbers']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/hexadecimal|\bhex\b|two.s complement|overflow|\bbytes?\b|nibble|ascii|mario/i.test(src), `drill ${id} names a later term`);
  if (id.endsWith('-ext')) assert(!/\bbits?\b|-bit\b/i.test(src.split('\n').slice(3).join('\n')), 'the extension says "bit" before it is taught');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes and is the real value of its binary number, no distractor passes,
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
        [ans.toLowerCase(), ans.toUpperCase(), '  ' + ans + '  '].forEach((v) => assert(pass(v.trim()) || pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors`);
        assert(!(r.distractors || []).includes(ans), `${id} ${card.id}: answer among distractors`);
        // A "Convert ... to denary" card: the answer is the value of the binary number in its prompt, worked out here.
        const conv = /Convert (?:this |the )?(?:4-bit |8-bit )?binary number(?: to denary:)? ([01]+)/.exec(r.prompt) || /^Sam says ([01]+)/.exec(r.prompt);
        if (conv) assert(Number(ans) === parseInt(conv[1], 2), `${id} ${card.id}: ${conv[1]} is not ${ans}`);
        const find = /^Which place values have a 1 under them\?\nPlace value:.*\nBit: +([01 ]+)$/.exec(r.prompt);
        if (find) {
          const b = find[1].replace(/\s+/g, '');
          assert(ans === pvs(b.length).filter((_, i) => b[i] === '1').join(', '), `${id} ${card.id}: place values of ${b}`);
          assert(!pass(pvs(b.length).join(', ')), `${id} ${card.id}: every place value passes`);
          assert(!pass(ans + ', 3'), `${id} ${card.id}: an extra number passes`);
        }
        if (r.example && ans.length >= 3) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        if (r.example && /^\d+$/.test(ans)) {
          const last = /= (\d+)\.?$/m.exec(r.example.split('\n').filter((l) => /= \d+|is \d+ in denary|worth \d+/.test(l)).pop() || '');
          if (last) assert(last[1] !== ans, `${id} ${card.id}: the example works out to the answer ${ans}`);
        }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (r.working && !pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
        if (id.endsWith('-ext') && r.example) {
          const exLines = r.prompt.split('\n').filter((l) => l.trim().length > 12);
          assert(exLines.filter((l) => r.example.toLowerCase().includes(l.trim().toLowerCase())).length < 3, `${id} ${card.id}: example repeats the question`);
        }
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps) + JSON.stringify(STEPPER)), 'dash found');
assert(!/mario|\bdecimal\b/i.test(JSON.stringify(steps) + JSON.stringify(STEPPER)), 'never named');

const lesson = { id: ID, label: '1.1: Binary Place Values', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- the stepper, written into the shell
// Between marker comments in js/content/refreshers.html, straight before denary_to_binary. Plain strings only (the
// file is pasted into one inline script). Re-read at the last moment; only this block is touched.
{
  const rp = path.join(SHELL, 'js', 'content', 'refreshers.html');
  const START = '        // y11_binary_to_denary: generated by the pages repo\'s tools/build_y11_1_1_binary.mjs. Edit that, then run it.\n';
  const END = '        // end y11_binary_to_denary\n';
  const js = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  const block = START + '        y11_binary_to_denary: {\n          title: ' + js(STEPPER.title) + ',\n          steps: [\n' +
    STEPPER.steps.map((s) => '            { title: ' + js(s.title) + ', html: ' + js(s.html) + ', note: ' + js(s.note) + ' }').join(',\n') + '\n          ]\n        },\n' + END;
  assert(!/\/\//.test(block.split('\n').slice(1, -2).join('\n')), 'a // in the stepper would break the shell');
  assert(!block.includes('<' + '?'), 'template tag in the stepper');
  let raw = fs.readFileSync(rp, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const blk = block.replace(/\n/g, eol), st = START.replace(/\n/g, eol), en = END.replace(/\n/g, eol);
  if (raw.includes(st)) {
    const head = raw.split(st)[0], tail = raw.split(st)[1].split(en).slice(1).join(en);
    raw = head + blk + tail;
  } else {
    const anchor = '        denary_to_binary: {';
    assert(raw.split(anchor).length === 2, 'refreshers.html anchor');
    raw = raw.split(anchor).join(blk + anchor);
  }
  fs.writeFileSync(rp, raw);
}

// ---------------------------------------------------------------- register: a Year 11 "1.1" unit at the END of Year 11's units
// Read the file at the last moment (other builders edit it too) and write it back with its own indent and line endings.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y11 = all.years.find((y) => y.id === 'year11');
let unit = y11.units.find((u) => u.code === '1.1' && u.title === 'Number Systems');
let changed = false;
if (!unit) { unit = { code: '1.1', title: 'Number Systems', lessons: [] }; y11.units.push(unit); changed = true; }
if (!unit.lessons.includes(ID)) { unit.lessons.unshift(ID); changed = true; }
if (changed) {
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; Year 11 units: ${y11.units.map((u) => u.code || '(none)').join(', ')}`);
