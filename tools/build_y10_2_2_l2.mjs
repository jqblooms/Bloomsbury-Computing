// Builds LessonData/y10-2-2-l2.json: Year 10, 2.2 L2: Parity Blocks and Checksums (syllabus 0478 2.2 2: the parity
// byte and parity block check, and the checksum), the second lesson of 2.2 Methods of Error Detection, and registers
// it after y10-2-2-l1.
//   node tools/build_y10_2_2_l2.mjs
// EAL-light shape, as L1: a teacher-only Think, Pair, Share under every heading, predict-then-reveal, a compare slide.
// Do Now: two real questions (2.2 L1 parity bits; how errors occur), each with a Walk me through it on a similar
// question, then the Do Now Extension drill y10-2-2-l2-ext (2.1 and 2.2 L1). Activities: two drills (find the error in
// a parity block; be the receiver for checksums). Every exam question is real and cited, and the builder re-works
// each exam answer from the paper's own table. Plenary drill: y10-2-2-l2. Echo check and ARQ come in L3; check
// digits in L4.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-2-l2';
const P = 'y10-22l2';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const MONO = 'font:700 20px var(--font-mono, monospace);letter-spacing:4px';
const bits = (s, mark = []) => `<span style="${MONO}">` +
  s.split('').map((b, i) => mark.includes(i) ? `<span style="color:var(--bad);text-decoration:underline">${b}</span>` : b).join('') + '</span>';
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
const ones = (s) => s.split('').filter((b) => b === '1').length;
const parityBit = (data, mode) => ((ones(data) % 2 === 0) === (mode === 'even') ? '0' : '1');
const column = (rows, c) => rows.map((r) => r[c]).join('');
const columnByte = (rows, mode) => [0, 1, 2, 3, 4, 5, 6, 7].map((c) => parityBit(column(rows, c), mode)).join('');

// A parity block as a table. rows are 8-character strings (the parity bit first); pbyte is the parity byte row.
// opts: head (column names), names (row names), rowHL / colHL (indexes to tint), bad ([row, col] cells in red),
// size (font size), blank (true: an empty first cell in each row, for a parity bit still to be found).
function block(rows, pbyte, opts = {}) {
  const fs_ = opts.size || 16;
  const cell = `padding:${opts.pad || "3px 7px"};text-align:center;${opts.minw ? "min-width:" + opts.minw + ";" : ""}font:600 ${fs_}px var(--font-mono, monospace)`;
  const head = opts.head || ['Parity bit', 'Bit 1', 'Bit 2', 'Bit 3', 'Bit 4', 'Bit 5', 'Bit 6', 'Bit 7'];
  const names = opts.names || rows.map((r, i) => `Byte ${i + 1}`);
  const tint = (ri, ci) => {
    const bad = (opts.bad || []).some(([r, c]) => r === ri && c === ci);
    if (bad) return ';color:var(--bad);background:var(--bad-soft);text-decoration:underline';
    if ((opts.rowHL || []).includes(ri) || (opts.colHL || []).includes(ci)) return ';background:var(--warn-soft)';
    return '';
  };
  const th = `padding:${opts.pad || "3px 7px"};white-space:nowrap;${opts.minw ? "min-width:" + opts.minw + ";" : ""}font-size:${Math.max(12, fs_ - 3)}px;text-align:center`;
  let h = `<table class="donow-table" style="margin:0 auto"><tr><th style="${th}"></th>${head.map((x) => `<th style="${th}">${x}</th>`).join('')}</tr>`;
  rows.forEach((r, ri) => {
    h += `<tr><th style="${th};text-align:left">${names[ri]}</th>` + r.split('').map((b, ci) => `<td style="${cell}${tint(ri, ci)}">${opts.blank && ci === 0 ? '' : b}</td>`).join('') + '</tr>';
  });
  if (pbyte != null) h += `<tr><th style="${th};text-align:left">${opts.pname || "Parity byte"}</th>` + pbyte.split('').map((b, ci) => `<td style="${cell}${tint(rows.length, ci)}">${b}</td>`).join('') + '</tr>';
  return h + '</table>';
}

const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ = null, extra = '') {
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
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function selfMarked(id, label, heading, lead, items, whyQ) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
// One short sentence per step and a picture with the part that matters marked .wt-hl. Each uses a similar question
// with different values, so it shows the method and never the slide's answer.
const wbits = (s, hl = []) => `<div style="display:flex;gap:6px;justify-content:center">` +
  s.split('').map((b, i) => `<span${hl.includes(i) ? ' class="wt-hl"' : ''} style="${MONO};letter-spacing:0;padding:2px 8px">${b}</span>`).join('') + '</div>';
const note = (t) => `<div class="wt-note">${t}</div>`;
const onesAt = (s) => s.split('').map((b, i) => (b === '1' ? i : -1)).filter((i) => i >= 0);
// Do Now 1 (even parity bits), worked with the data 0110100 (three 1s: parity bit 1) and 1110001 (four 1s: parity bit 0).
const WA = '0110100', WB = '1110001';
const WT_PARITY = { title: 'Walk me through it: the parity bit for even parity', steps: [
  { text: 'We will find the even parity bit for two other bytes. Your question uses different bytes, so you still do the working.', visual: wbits(WA) + '<div style="height:10px"></div>' + wbits(WB) },
  { text: 'Even parity means: the total number of 1s, with the parity bit, must be <strong>even</strong>.', visual: note('even = 0, 2, 4, 6, 8') },
  { text: 'First byte: <strong>0110100</strong>. Point at each 1 and count.', visual: wbits(WA, onesAt(WA)) },
  { text: 'There are <strong>three</strong> 1s. Three is odd.', visual: wbits(WA, onesAt(WA)) + note('1s: 3 (odd)') },
  { text: 'A parity bit of <strong>1</strong> makes four 1s. Four is even. So the parity bit is 1.', visual: wbits('1' + WA, [0]) + note('1s: 4 (even)') },
  { text: 'Second byte: <strong>1110001</strong>. Count the 1s.', visual: wbits(WB, onesAt(WB)) },
  { text: 'There are <strong>four</strong> 1s. Four is already even.', visual: wbits(WB, onesAt(WB)) + note('1s: 4 (even)') },
  { text: 'So the parity bit adds nothing: it is <strong>0</strong>. Now count the 1s in each byte in your question.', visual: wbits('0' + WB, [0]) + note('1s: 4 (even)') },
] };
// Do Now 2 (a reason an error occurs), worked with a different question: what can happen to the bits on the way.
const WT_ERRORS = { title: 'Walk me through it: errors in transmission', steps: [
  { text: 'A similar question: <strong>what can happen to the bits</strong> on the way? Your question asks something different, so you still think it through.', visual: wbits('10110100') },
  { text: 'This byte was sent: <strong>8 bits</strong>.', visual: wbits('10110100') + note('Sent: 8 bits') },
  { text: 'Only <strong>7 bits</strong> arrived. A bit was lost: <strong>data loss</strong>.', visual: wbits('1011010') + note('Arrived: 7 bits') },
  { text: '<strong>9 bits</strong> arrived. An extra bit came: <strong>data gain</strong>.', visual: wbits('101101001', [8]) + note('Arrived: 9 bits') },
  { text: '8 bits arrived, but one is different: <strong>data change</strong>.', visual: wbits('10100100', [3]) + note('Arrived: 8 bits, one different') },
  { text: 'Your question asks for the <strong>reason</strong>: what on the cable, or in the air, can do this to the bits? Think back to Lesson 1.', visual: note('lost, gained or changed: what caused it?') },
] };

// ---------------------------------------------------------------- Do Now (2.2 L1) and its extension
const DN_A = '1100011', DN_B = '0000000';
steps.push(checkStep('do-now', 'Do Now: Parity Bits (1 of 2)', 'Do Now: Parity Bits (1 of 2)',
  'From 2.2 L1. ' + cite('0478/12, March 2023, Question 5(c)(i)') + ' The bytes need to be sent using an even parity byte check. Complete the parity bit for each byte.', [
    { label: 'Parity bit for Byte A', marks: 1, answer: '^\\s*0\\s*$', feedback: 'Count the 1s in Byte A. Even parity needs an even total.' },
    { label: 'Parity bit for Byte B', marks: 1, answer: '^\\s*0\\s*$', feedback: 'Count the 1s in Byte B. Even parity needs an even total.' },
  ], ['Why does the sender add the parity bit BEFORE sending?', 'The receiver needs it to check the byte. It must travel with the data.'],
  block(['?' + DN_A, '?' + DN_B], null, { names: ['Byte A', 'Byte B'], head: ['Parity bit', '', '', '', '', '', '', ''], blank: true, size: 20 })));
steps[steps.length - 1].walkthrough = WT_PARITY;
steps.push(checkStep('do-now-2', 'Do Now: Errors (2 of 2)', 'Do Now: Errors (2 of 2)',
  'From 2.2 L1. ' + cite('0478/13, November 2023, Question 5(a)') + ' Errors can occur when data is transmitted.', [
    { line: true, label: 'Give one reason an error may occur when data is transmitted.', answer: '(interfer|cross[\\s-]?talk)',
      feedback: 'Think about Lesson 1. What can affect the bits on the way, down a cable or through the air?' },
  ], ['Why do we check data after it arrives, not only before it is sent?', 'The bits can change on the way. Only the receiver can see what arrived.']));
steps[steps.length - 1].walkthrough = WT_ERRORS;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-2-l2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1 Data Transmission and 2.2 Lesson 1. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Parity Blocks and Checksums',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.2 Methods of Error Detection</p><h2 class="lesson-h2">Parity Blocks and Checksums</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> two more ways to check data after it is sent: the <strong>parity block check</strong> and the <strong>checksum</strong>.', '<strong>You already know:</strong> a parity bit on each byte. This is a <strong>parity byte check</strong>.']) +
    why('A parity byte check cannot find two changed bits. Why do we need other checks?', 'Some errors get past it. Another check can catch errors the first one misses.') });

// ---------------------------------------------------------------- the parity block: predict then reveal
const CB = ['01011010', '11100100', '00110011'];
const CBP = columnByte(CB, 'even');
steps.push({ id: 'concept-block', label: 'The Parity Block',
  content: '<h2 class="lesson-h2">The Parity Block</h2>' +
    tps('Predict: even parity. The byte 01011010 is sent. Two bits change and 01101010 arrives. Does the parity byte check find the error?',
      '<p>No. 01101010 still has <strong>four</strong> 1s: even. The row looks correct.</p><p>So we also check the <strong>columns</strong>. This is a <strong>parity block check</strong>.</p>', 'Show the worked answer') +
    columns(facts(['The bytes are sent together as a <strong>block</strong>.', 'Each byte has a <strong>parity bit</strong>. It checks its <strong>row</strong>.', 'A <strong>parity byte</strong> is added at the end. Each bit of it checks one <strong>column</strong>.', 'The receiver checks every row <strong>and</strong> every column.']),
      '<p style="margin:0 0 6px;text-align:center">Even parity block</p>' + block(CB, CBP, { rowHL: [3], size: 17 }) +
      '<p style="margin:8px 0 0;color:var(--muted);text-align:center">The parity byte makes every column even.</p>') });

// ---------------------------------------------------------------- exam: complete a parity byte
// 0478/12 March 2024 Q6(e)(ii): 7 bytes, odd parity, columns in the paper's order: parity bit, bit 7 ... bit 1.
const M24 = ['11001110', '10000110', '01000000', '01001111', '10000000', '01111111', '11001101'];
const M24_ANS = '10001010';
steps.push(checkStep('exam-pbyte', 'Exam Question: Complete the Parity Byte', 'Exam Question: Complete the Parity Byte',
  cite('0478/12, March 2024, Question 6(e)(ii)') + ' The table shows 7 bytes that are transmitted using <strong>odd</strong> parity. The parity bit has been completed for each byte.', [
    { label: 'Complete the parity byte for the data. Type all 8 bits, parity bit first.', marks: 3, answer: '^\\s*' + M24_ANS.split('').join('\\s*') + '\\s*$',
      feedback: 'Work one column at a time, going down. Count the 1s and choose the bit that makes the column odd.' },
  ], ['Why does each column need its own bit?', 'Each bit of the parity byte checks one column, so each column needs one.'],
  block(M24, '????????', { head: ['Parity bit', 'bit 7', 'bit 6', 'bit 5', 'bit 4', 'bit 3', 'bit 2', 'bit 1'], size: 15 })));

// ---------------------------------------------------------------- finding the error: predict then reveal
const FB = ['01011010', '11100100', '00110011', '10010110'];
const FBP = columnByte(FB, 'even');
const FB_BAD = FB.slice(); FB_BAD[1] = '11101100';
steps.push({ id: 'concept-find', label: 'Finding the Error',
  content: '<h2 class="lesson-h2">Finding the Error</h2>' +
    tps('Predict: one bit changed on the way. Which row has an odd number of 1s? Which column? Where do they cross?',
      '<p><strong>Byte 2</strong> has five 1s: odd. The <strong>Bit 4</strong> column has an odd number of 1s.</p><p>They cross at <strong>Byte 2, Bit 4</strong>. That bit was changed. Change it back: 1 becomes 0.</p>', 'Show the worked answer') +
    columns('<p style="margin:0 0 6px;text-align:center">Even parity block (received)</p>' + block(FB_BAD, FBP, { size: 17 }),
      facts(['Check every <strong>row</strong>. Find the byte with the wrong number of 1s.', 'Check every <strong>column</strong>. Find the bit with the wrong number of 1s.', 'The error is where the row and the column <strong>cross</strong>.', 'The receiver can now <strong>correct</strong> the bit, or ask for the data again.'])) });

steps.push(embed('activity-1', 'Activity 1: Find the Error', 'drill-y10-2-2-l2-block', 'Activity 1: Find the Error',
  'Check the rows, check the columns, then find the bit. New blocks every time. Stuck? Switch on <strong>I need help</strong>.',
  ['Why do we need BOTH the row and the column?', 'The row tells you which byte. The column tells you which bit. Together they point to one bit.']));

// ---------------------------------------------------------------- exam: find the bit in error
// 0478/12 March 2023 Q5(c)(iii): bytes 0 to 6, even parity; mark scheme Bit 6, Byte 4.
const M23 = ['11101000', '00100100', '10110001', '11001111', '10100010', '00000000', '01111000'];
const M23_P = '01101010';
steps.push(checkStep('exam-find', 'Exam Question: Find the Incorrect Bit', 'Exam Question: Find the Incorrect Bit',
  cite('0478/12, March 2023, Question 5(c)(iii)') + ' The data was sent using an even parity block check. One of the bits has been transmitted incorrectly.', [
    { label: 'Bit number', answer: '^\\s*(bit\\s*)?6\\s*$', feedback: 'Count the 1s going down each column, with the parity byte. Which column is not even?' },
    { label: 'Byte number', answer: '^\\s*(byte\\s*)?4\\s*$', feedback: 'Count the 1s in each row, with the parity bit. Which byte is not even? Look at how the bytes are numbered.' },
  ], ['The bytes here start at Byte 0. Why read the labels, not count the rows?', 'The paper names the rows. The answer must use its names.'],
  block(M23, M23_P, { names: M23.map((r, i) => `Byte ${i}`), size: 15 })));

// ---------------------------------------------------------------- compare: no error, one bit, two bits
const CMP = ['01011010', '11100100', '00110011'];
const CMPP = columnByte(CMP, 'even');
const CMP1 = CMP.slice(); CMP1[0] = '01010010';
const CMP2 = CMP.slice(); CMP2[0] = '01101010';
steps.push({ id: 'compare', label: 'Compare: One Bit, Two Bits',
  content: '<h2 class="lesson-h2">Compare: One Bit, Two Bits</h2>' +
    tps('The same even parity block arrived three times. What is the same, and what is different, about what the checks find?',
      '<p><strong>A:</strong> every row and every column is even: no error found.</p><p><strong>B:</strong> one bit changed. Byte 1 and the Bit 4 column fail: the error is found <strong>and</strong> we know where.</p><p><strong>C:</strong> two bits changed in Byte 1. The row still looks even, so a parity byte check misses it. But the Bit 2 and Bit 3 columns fail: the parity block check <strong>finds</strong> it.</p>') +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start">' +
    [['A', CMP], ['B', CMP1], ['C', CMP2]].map(([n, r]) => `<div><p style="margin:0 0 6px;text-align:center"><strong>${n}</strong></p>` +
      block(r, CMPP, { head: ['P', '1', '2', '3', '4', '5', '6', '7'], size: 15, pad: '2px 4px', minw: '26px', pname: 'Parity' }) + '</div>').join('') + '</div>' });

steps.push(selfMarked('exam-block-why', 'Exam Question: Block or Byte?', 'Exam Question: Block or Byte?',
  cite('0478/12, March 2023, Question 5(c)(ii)') + ' A parity block check can be used instead of a parity byte check.', [
    { id: 'block-why', prompt: 'Explain how a parity block check might detect an error in transmission that would <strong>not</strong> be detected by a parity byte check. [2]', marks: 2,
      modelAnswer: 'A parity byte check cannot detect an even number of changes in a byte (for example two bits swapped), because the parity stays correct. A parity block check also checks every column, so it identifies the horizontal and vertical position of the changes.' },
  ], ['This has 2 marks. What two ideas do you need?', 'What the parity byte check misses (two changes in one byte), and what the block adds (the columns show where).']));

// ---------------------------------------------------------------- the checksum: predict then reveal
const CS_SENT = [20, 35, 14], CS_GOT = [20, 36, 14];
const total = (a) => a.reduce((t, v) => t + v, 0);
const valBox = (vals, label, hl = -1) => `<p style="margin:0 0 4px">${label}</p><div style="display:flex;gap:8px;margin:0 0 10px">` +
  vals.map((v, i) => `<span style="${MONO};letter-spacing:0;padding:4px 10px;border-radius:8px;background:var(--surface-3)${i === hl ? ';color:var(--bad);text-decoration:underline' : ''}">${v}</span>`).join('') + '</div>';
steps.push({ id: 'concept-checksum', label: 'The Checksum',
  content: '<h2 class="lesson-h2">The Checksum</h2>' +
    tps(`Predict: the sender sends ${CS_SENT.join(', ')} and their total, ${total(CS_SENT)}. The receiver gets ${CS_GOT.join(', ')}. What does the receiver notice?`,
      `<p>The receiver adds up what arrived: ${CS_GOT.join(' + ')} = <strong>${total(CS_GOT)}</strong>.</p><p>${total(CS_GOT)} is not ${total(CS_SENT)}. The values do not match, so an <strong>error</strong> is detected.</p>`, 'Show the worked answer') +
    columns(facts(['The sender uses an <strong>algorithm</strong> to calculate a value from the data: the <strong>checksum</strong>. Here, the algorithm adds up the values.', 'The checksum is <strong>sent with</strong> the data.', 'The receiver uses the <strong>same algorithm</strong> to recalculate the checksum.', 'The two values are <strong>compared</strong>. Different: an error is detected, and the data is sent again.']),
      valBox(CS_SENT, 'Sent: data') + valBox([total(CS_SENT)], 'Sent: checksum') + valBox(CS_GOT, 'Received: data', 1) +
      `<p style="margin:0;color:var(--muted)">Recalculated: ${CS_GOT.join(' + ')} = ?</p>`) });

steps.push(embed('activity-2', 'Activity 2: Be the Receiver', 'drill-y10-2-2-l2-checksum', 'Activity 2: Be the Receiver',
  'Be the sender: calculate the checksum. Then be the receiver: recalculate, compare and decide. New values every time.',
  ['Why must the receiver NOT just copy the checksum it received?', 'It must calculate its own value from the data that arrived, or there is nothing to compare.']));

steps.push(selfMarked('exam-checksum', 'Exam Question: Using the Checksum', 'Exam Question: Using the Checksum',
  cite('0478/13, June 2026, Question 2(d)') + ' A checksum is used to check for errors in the data. A checksum value is calculated from the data before it is transmitted.', [
    { id: 'checksum-use', prompt: 'Describe how this checksum value is used to check for errors in the data after transmission. [3]', marks: 3,
      modelAnswer: 'Any three: the checksum value is sent with the data; the receiving device uses the same algorithm to recalculate the checksum value; the two checksum values are compared; if the checksum values are the same no error has occurred, if they are different an error has occurred.' },
  ], ['Activity 2 had three steps for the receiver. What were they?', 'Recalculate the checksum, compare the two values, decide: same means no error, different means an error.']));
steps.push(selfMarked('exam-match', 'Exam Question: Why a Mismatch Means an Error', 'Exam Question: Why a Mismatch Means an Error',
  cite('0478/13, November 2024, Question 2(f)(ii)') + ' In the checksum error detection method, two values are compared after transmission. If the values do not match, an error is detected.', [
    { id: 'checksum-match', prompt: 'Explain why the values not matching would show an error has occurred. [2]', marks: 2,
      modelAnswer: 'Any two: the checksum is calculated from (using) the data; using the same algorithm on both sides; so if the values are different, the data must be different.' },
  ], ['If the data did NOT change, could the two values be different?', 'No. The same algorithm on the same data always gives the same value.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Parity Blocks and Checksums Drill', 'drill-y10-2-2-l2', 'Plenary: Parity Blocks and Checksums Drill',
  'Complete a parity byte, find the bit in error, and calculate and compare checksums. Your progress is saved.',
  ['Why practise with new blocks and new values every time?', 'If you can check any block, you really understand the method.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
// Do Now 1: both bytes already hold an even number of 1s, so both parity bits are 0 (mark scheme: 0, 0).
assert(parityBit(DN_A, 'even') === '0' && parityBit(DN_B, 'even') === '0', 'Mar 2023 Q5(c)(i)');
assert(T('do-now', 0, '0') && !T('do-now', 0, '1') && T('do-now', 1, ' 0 ') && !T('do-now', 1, '01'), 'do-now');
assert(T('do-now-2', 0, 'interference') && T('do-now-2', 0, 'electrical interference') && T('do-now-2', 0, 'crosstalk') && !T('do-now-2', 0, 'the data goes wrong') && !T('do-now-2', 0, 'data loss'), 'do-now-2');
// March 2024 Q6(e)(ii): every column, parity byte included, must have an odd number of 1s; matches the mark scheme.
assert(columnByte(M24, 'odd') === M24_ANS, 'Mar 2024 parity byte');
assert(T('exam-pbyte', 0, '10001010') && T('exam-pbyte', 0, '1 0 0 0 1 0 1 0') && !T('exam-pbyte', 0, '10001011'), 'exam-pbyte');
// March 2023 Q5(c)(iii): exactly one row (Byte 4) and one column (Bit 6) fail even parity; mark scheme Bit 6, Byte 4.
{
  const badRows = M23.map((r, i) => (ones(r) % 2 ? i : -1)).filter((i) => i >= 0);
  const badCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => ones(column(M23, c) + M23_P[c]) % 2);
  assert(badRows.join() === '4' && badCols.join() === '6', 'Mar 2023 find the bit: ' + badRows + ' / ' + badCols);
}
assert(T('exam-find', 0, '6') && T('exam-find', 0, 'Bit 6') && !T('exam-find', 0, '4') && T('exam-find', 1, '4') && T('exam-find', 1, 'byte 4') && !T('exam-find', 1, '5'), 'exam-find');
// The taught blocks say what the slides claim.
assert(CB.every((r) => ones(r) % 2 === 0) && ones('01101010') % 2 === 0, 'concept-block');
{
  const rowsBad = FB_BAD.map((r, i) => (ones(r) % 2 ? i : -1)).filter((i) => i >= 0);
  const colsBad = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => ones(column(FB_BAD, c) + FBP[c]) % 2);
  assert(rowsBad.join() === '1' && colsBad.join() === '4' && ones(FB_BAD[1]) === 5, 'concept-find');
  const r1 = CMP1.map((r, i) => (ones(r) % 2 ? i : -1)).filter((i) => i >= 0), c1 = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => ones(column(CMP1, c) + CMPP[c]) % 2);
  const r2 = CMP2.map((r, i) => (ones(r) % 2 ? i : -1)).filter((i) => i >= 0), c2 = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => ones(column(CMP2, c) + CMPP[c]) % 2);
  assert(r1.join() === '0' && c1.join() === '4' && r2.join() === '' && c2.join() === '2,3', 'compare: ' + [r1, c1, r2, c2].join(' | '));
}
assert(total(CS_SENT) === 69 && total(CS_GOT) === 70, 'checksum numbers');
// The walkthroughs use other bytes and never hold the Do Now answers (the bytes in the question, or the reason).
{
  const s = JSON.stringify(WT_PARITY);
  assert(!s.includes(DN_A) && !s.includes(DN_B), 'parity walkthrough uses the Do Now bytes');
  assert(parityBit(WA, 'even') === '1' && parityBit(WB, 'even') === '0', 'parity walkthrough numbers');
  const e = JSON.stringify(WT_ERRORS).toLowerCase();
  assert(!/interfer|cross\W?talk|electrical|magnetic/.test(e), 'errors walkthrough gives the reason');
}
// No dashes of any kind in the lesson text.
{
  const all = JSON.stringify(steps);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
}

const lesson = { id: ID, label: '2.2 L2: Parity Blocks and Checksums', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in the Year 10 "2.2" unit, straight after L1.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find((y) => y.id === 'year10');
const unit = y10.units.find((u) => u.code === '2.2');
assert(unit && unit.lessons.includes('y10-2-2-l1'), 'the 2.2 unit with L1 must exist (run build_y10_2_2_l1.mjs first)');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y10-2-2-l1') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 2.2 lessons: ${unit.lessons.join(', ')}`);
