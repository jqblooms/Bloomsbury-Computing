// Builds LessonData/y10-2-2-l3.json: Year 10, 2.2 L3: Echo Check and ARQ (syllabus 0478 2.2 2: the echo check, and
// 2.2 4: automatic repeat query (ARQ) with positive and negative acknowledgements and timeout), the third lesson of
// 2.2 Methods of Error Detection, and registers it after y10-2-2-l2.
//   node tools/build_y10_2_2_l3.mjs
// EAL-light shape, as L1 and L2: a teacher-only Think, Pair, Share under every heading, predict-then-reveal, compare
// slides. Do Now: two real questions (2.2 L2 parity block; the names of the 2.2 L1 and L2 checks), each with a Walk me
// through it on a similar question, then the Do Now Extension drill y10-2-2-l3-ext (2.1, 2.2 L1 and L2). Activities:
// two drills (y10-2-2-l3-echo: there or back?; y10-2-2-l3-arq: be the sender, be the receiver). Every exam question is
// real and cited; the builder re-works the Do Now block from the paper's own table and checks that no ARQ term is used
// before the slide that teaches it. Plenary drill: y10-2-2-l3. Check digits come in L4.
// The syllabus says "automatic repeat query (ARQ)". Older papers say "request" or "reQuest"; those question stems
// are shown with the syllabus term, and the mark-scheme wordings are still accepted where answers are typed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-2-l3';
const P = 'y10-22l3';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
// A side holding a table takes the table's own width; the other side gets the rest.
const columns = (a, b) => {
  const t = (s) => s.includes('donow-table');
  const tpl = t(a) && !t(b) ? 'max-content minmax(0, 1fr)' : t(b) && !t(a) ? 'minmax(0, 1fr) max-content' : '';
  return `<div class="lesson-do-now-columns"${tpl ? ` style="grid-template-columns:${tpl}"` : ''}><div>${a}</div><div>${b}</div></div>`;
};
const MONO = 'font:700 18px var(--font-mono, monospace);letter-spacing:3px';
const byteBox = (s, mark = []) => `<span style="${MONO};padding:2px 8px;border-radius:6px;background:var(--surface-3);white-space:nowrap">` +
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
const diff = (a, b) => a.split('').map((x, i) => (x !== b[i] ? i : -1)).filter((i) => i >= 0);

// A parity block as a table (as in L2). rows are 8-character strings (the parity bit first); pbyte is the parity byte
// row. opts: head, names, size, pad, hl(ri, ci) true to mark a cell .wt-hl (walkthrough pictures).
function block(rows, pbyte, opts = {}) {
  const fs_ = opts.size || 16;
  const cell = `padding:${opts.pad || '3px 7px'};text-align:center;font:600 ${fs_}px var(--font-mono, monospace)`;
  const head = opts.head || ['Parity bit', 'Bit 1', 'Bit 2', 'Bit 3', 'Bit 4', 'Bit 5', 'Bit 6', 'Bit 7'];
  const names = opts.names || rows.map((r, i) => `Byte ${i + 1}`);
  const th = `padding:${opts.pad || '3px 7px'};white-space:nowrap;font-size:${Math.max(12, fs_ - 3)}px;text-align:center`;
  const td = (b, ri, ci) => `<td${opts.hl && opts.hl(ri, ci) ? ' class="wt-hl"' : ''} style="${cell}">${b}</td>`;
  let h = `<table class="donow-table" style="margin:0 auto"><tr><th style="${th}"></th>${head.map((x) => `<th style="${th}">${x}</th>`).join('')}</tr>`;
  rows.forEach((r, ri) => { h += `<tr><th style="${th};text-align:left">${names[ri]}</th>` + r.split('').map((b, ci) => td(b, ri, ci)).join('') + '</tr>'; });
  if (pbyte != null) h += `<tr><th style="${th};text-align:left">Parity byte</th>` + pbyte.split('').map((b, ci) => td(b, rows.length, ci)).join('') + '</tr>';
  return h + '</table>';
}

// The echo check as a picture: the sender and the receiver, the data going there and the copy coming back.
const line = (dir) => dir === 'r'
  ? '<div style="display:flex;align-items:center"><div style="flex:1;border-top:3px solid var(--brand)"></div><span style="color:var(--brand);font-size:14px;line-height:1">&#9654;</span></div>'
  : '<div style="display:flex;align-items:center"><span style="color:var(--brand);font-size:14px;line-height:1">&#9664;</span><div style="flex:1;border-top:3px solid var(--brand)"></div></div>';
const node = (t) => `<div style="grid-row:span 2;align-self:stretch;display:flex;align-items:center;justify-content:center;padding:8px 12px;border:2px solid var(--line-strong);border-radius:10px;background:var(--surface-2);font-weight:700">${t}</div>`;
function echoPicture(sent, back, mark = []) {
  return '<div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px 10px;align-items:center">' +
    node('Sender') +
    `<div style="text-align:center"><div style="font-size:14px;color:var(--muted)">data</div>${byteBox(sent)}${line('r')}</div>` +
    node('Receiver') +
    `<div style="text-align:center"><div style="font-size:14px;color:var(--muted)">copy of the data</div>${byteBox(back, mark)}${line('l')}</div></div>`;
}
// An ARQ timeline: each row is [sender text, 'r' | 'l' | '', what travels, receiver text].
function timeline(rows, size = 15) {
  const td = `padding:4px 8px;font-size:${size}px;vertical-align:middle`;
  const mid = (dir, label) => dir ? `<div style="text-align:center;font-size:${size - 2}px;color:var(--muted);white-space:nowrap">${label}</div>${line(dir)}` : `<div style="text-align:center;font-size:${size - 2}px;color:var(--muted)">${label}</div>`;
  return `<table class="donow-table" style="margin:0 auto"><tr><th style="${td}">Sender</th><th style="${td};min-width:120px"></th><th style="${td}">Receiver</th></tr>` +
    rows.map(([a, dir, label, b]) => `<tr><td style="${td};text-align:left">${a}</td><td style="${td}">${mid(dir, label)}</td><td style="${td};text-align:left">${b}</td></tr>`).join('') + '</table>';
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
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
const note = (t) => `<div class="wt-note">${t}</div>`;
// Do Now 1 (find the bit in error), worked with a smaller even parity block: one bit changed in Byte 2, Bit 3.
const WB_HEAD = ['Parity bit', 'Bit 2', 'Bit 3', 'Bit 4', 'Bit 5', 'Bit 6', 'Bit 7', 'Bit 8'];
const WB_SENT = ['01100110', '11010100', '00111100', '10101010'];
const WB_P = columnByte(WB_SENT, 'even');
const WB = WB_SENT.slice(); WB[1] = '11110100';
const wb = (hl) => block(WB, WB_P, { head: WB_HEAD, size: 15, hl });
const WT_BLOCK = { title: 'Walk me through it: find the bit in error', steps: [
  { text: 'This is a different block, sent with <strong>even</strong> parity. One bit is wrong. Your block is bigger, so you still do the working.', visual: wb() },
  { text: 'Even parity: every <strong>row</strong> and every <strong>column</strong> must have an even number of 1s.', visual: note('even = 0, 2, 4, 6, 8') },
  { text: 'Count the 1s in <strong>Byte 1</strong>, with its parity bit: four. Even, so Byte 1 is fine.', visual: wb((r) => r === 0) },
  { text: '<strong>Byte 2</strong> has five 1s. Five is odd. The error is in <strong>Byte 2</strong>.', visual: wb((r) => r === 1) },
  { text: 'Now go <strong>down</strong> each column, with the parity byte. The <strong>Bit 3</strong> column has five 1s: odd.', visual: wb((r, c) => c === 2) },
  { text: 'The error is where the odd row and the odd column <strong>cross</strong>: Byte 2, Bit 3.', visual: wb((r, c) => r === 1 && c === 2) },
  { text: 'For the explanation, say <strong>what you counted</strong> and <strong>what you found</strong>.', visual: note('I counted the 1s in every row and column.<br>Even parity was used.<br>Byte 2 and the Bit 3 column had an odd number of 1s.') },
  { text: 'Now do the same with the eight bytes in your question: every row, then every column.', visual: note('odd row + odd column = the bit in error') },
] };
// Do Now 2 (name the method for each statement), worked with a similar question from 2.1: name the method of
// transmission from key words.
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const stmt = (t, ans = '') => `<div style="display:flex;gap:12px;align-items:center;margin:6px 0"><div style="flex:1;padding:8px 12px;border-radius:8px;background:var(--surface-3)">${t}</div><div style="min-width:120px;font-weight:700">${ans}</div></div>`;
const S1 = 'Data is sent one bit at a time, down one wire.', S2 = 'Data can go both ways, but only one way at a time.';
const WT_NAME = { title: 'Walk me through it: name the method', steps: [
  { text: 'A similar question from 2.1: give the <strong>method of transmission</strong> for each statement. Your question is about checks, so you still do the thinking.', visual: stmt(S1) + stmt(S2) },
  { text: 'Read the first statement. Find the <strong>key words</strong>.', visual: stmt(`Data is sent ${kw('one bit at a time')}, down ${kw('one wire')}.`) },
  { text: 'Which method sends one bit at a time, down one wire? <strong>Serial</strong>.', visual: stmt(`Data is sent ${kw('one bit at a time')}, down ${kw('one wire')}.`, 'Serial') },
  { text: 'Second statement. The key words are <strong>both ways</strong> and <strong>one way at a time</strong>.', visual: stmt(`Data can go ${kw('both ways')}, but only ${kw('one way at a time')}.`) },
  { text: 'Both ways, taking turns: <strong>half-duplex</strong>.', visual: stmt(`Data can go ${kw('both ways')}, but only ${kw('one way at a time')}.`, 'Half-duplex') },
  { text: 'Now your question. Find the key words in each statement. Then ask: <strong>which check from Lessons 1 and 2 does this?</strong>', visual: note('key words &rarr; which check?') },
] };

// ---------------------------------------------------------------- Do Now (2.2 L1 and L2) and its extension
// 0478/12 November 2022 Q5: 8 bytes, even parity, the columns as the paper labels them (Parity bit, Bit 2 ... Bit 8).
// Mark scheme: Byte 4, Bit 5; explanation (any two): counted all the 1s; even parity has been used; odd number of
// ones in that row (byte 4) and column (bit 5).
const N22 = ['01010011', '10011111', '11111100', '11010101', '10001110', '11101011', '11001100', '11110011'];
const N22_P = '10110111';
steps.push(checkStep('do-now', 'Do Now: Parity Block (1 of 2)', 'Do Now: Parity Block (1 of 2)',
  'From 2.2 L2. ' + cite('0478/12, November 2022, Question 5') + ' The table shows the data received. One bit has an error.', [
    { label: 'Byte number', answer: '^\\s*(byte\\s*)?4\\s*$', feedback: 'Count the 1s in each row, with the parity bit. Which byte has the wrong number?' },
    { label: 'Bit number', answer: '^\\s*(bit\\s*)?5\\s*$', feedback: 'Count the 1s going down each column, with the parity byte. Use the column names in the table.' },
    { line: true, marks: 2, label: 'Explain how you found the error.',
      answer: '^(?=.*\\b(odd|not\\s+even|uneven|even\\s+parity)\\b)(?=.*(\\b1\'?s\\b|\\bones\\b|\\bcount\\w*|\\bcolumns?\\b|\\brows?\\b)).*$',
      feedback: 'Say what you counted, which parity was used, and what you found in that row and that column.' },
  ], ['The paper does not say odd or even parity. How can you tell?', 'Most rows and columns have an even number of 1s, so even parity was used.'],
  block(N22, N22_P, { head: WB_HEAD, size: 14, pad: '1px 6px' })));
steps[steps.length - 1].walkthrough = WT_BLOCK;
const DN2_A = 'An odd or even process can be used.';
const DN2_B = 'A value is calculated from the data, using an algorithm. This happens before and after the data is transmitted.';
steps.push(checkStep('do-now-2', 'Do Now: Name the Check (2 of 2)', 'Do Now: Name the Check (2 of 2)',
  'From 2.2 L1 and L2. ' + cite('0478/12, June 2024, Question 6') + ' Give the correct error detection method for each statement.', [
    { line: true, label: DN2_A, answer: '^\\s*(an?\\s+|the\\s+)?((odd|even)(\\s+(or|and|\\/)\\s+(odd|even))?\\s+)?parity(\\s+(check|bit|byte|block)s?(\\s+check)?)?\\s*\\.?\\s*$',
      feedback: 'Which check makes the number of 1s odd or even?' },
    { line: true, label: DN2_B, answer: '^\\s*(an?\\s+|the\\s+)?check[\\s-]*sums?(\\s+(check|method))?\\s*\\.?\\s*$',
      feedback: 'Which check adds up the data before it is sent, then again after it arrives?' },
  ], ['Why does the second statement say "before AND after"?', 'The sender calculates the value, then the receiver calculates it again. The two values are compared.']));
steps[steps.length - 1].walkthrough = WT_NAME;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-2-l3-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1 Data Transmission and 2.2 Lessons 1 and 2. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Echo Check and ARQ',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.2 Methods of Error Detection</p><h2 class="lesson-h2">Echo Check and ARQ</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> two ways for the receiver to <strong>reply</strong> to the sender: the <strong>echo check</strong> and <strong>automatic repeat query (ARQ)</strong>.', '<strong>You already know:</strong> the parity check and the checksum. The receiver checks the data.']) +
    why('The receiver finds an error. How does the SENDER find out that it must send the data again?', 'It cannot see the data that arrived. Something must go back from the receiver to the sender. Today we learn two ways.') });

// ---------------------------------------------------------------- the echo check: predict then reveal
const E_SENT = '01011010', E_BACK = '01001010';
steps.push({ id: 'concept-echo', label: 'The Echo Check',
  content: '<h2 class="lesson-h2">The Echo Check</h2>' +
    tps(`Predict: the sender sends ${E_SENT}. The copy that comes back is ${E_BACK}. What does the sender notice? What should it do?`,
      '<p>The fourth bit is different: 1 went, 0 came back. The copy does <strong>not match</strong>, so there is an <strong>error</strong>.</p><p>The sender sends the data <strong>again</strong>. This is an <strong>echo check</strong>.</p>', 'Show the worked answer') +
    columns(facts(['The sender sends the data.', 'The receiver sends a <strong>copy</strong> of the data it got <strong>back</strong> to the sender.', 'The sender <strong>compares</strong> the copy with the data it sent.', 'The same: no error. Different: an error, so the sender sends the data again.']),
      echoPicture(E_SENT, E_BACK)) });

steps.push(checkStep('check-echo', 'Check: The Echo Check', 'Check: The Echo Check', 'Answer in one or two words.', [
  { label: 'In an echo check, who sends the data back?', answer: '^\\s*(the\\s+)?receiv\\w*(\\s+(device|computer))?\\s*\\.?\\s*$', feedback: 'The data goes there, then a copy comes back. Who has the data when it arrives?' },
  { label: 'Who compares the copy with the data that was sent?', answer: '^\\s*(the\\s+)?(sender|send\\w*\\s+(device|computer))\\s*\\.?\\s*$', feedback: 'Who still has the data that was sent?' },
  { label: 'Sent: 11100101. Copy back: 11100101. Is an error detected?', answer: '^\\s*no\\b', feedback: 'Compare the two bytes bit by bit.' },
], ['Why must the receiver send back what it GOT, not what it expected?', 'The sender needs to see what really arrived, so it can compare.']));

steps.push(selfMarked('exam-echo', 'Exam Question: How the Echo Check Works', 'Exam Question: How the Echo Check Works',
  cite('0478/13, November 2024, Question 2(f)') + ' An employee emails a report to their employer. The email data is checked for errors after it has been transmitted, using an echo check and a checksum.', [
    { id: 'echo-explain', prompt: '(i) Explain how the echo check is used to check for errors in the email data. [3]', marks: 3,
      modelAnswer: 'A copy of the data is sent back to the employee\'s device (the sender); the sender compares the data sent with the data received back; if the original and the copy do not match, an error has occurred.' },
  ], ['This has 3 marks. What are the three steps?', 'The copy is sent back; the sender compares; different means an error.']));

// ---------------------------------------------------------------- compare: there, back, no error
const C_SENT = '10110100';
const CA = { arrived: '10010100' }; CA.back = CA.arrived;
const CB = { arrived: C_SENT, back: '10110000' };
const CC = { arrived: C_SENT, back: C_SENT };
const cmpTd = 'padding:5px 10px;text-align:center';
const cmpRow = (name, cells) => `<tr><th style="${cmpTd};text-align:left;white-space:nowrap">${name}</th>${cells.map((c) => `<td style="${cmpTd}">${c}</td>`).join('')}</tr>`;
steps.push({ id: 'compare-echo', label: 'Compare: There or Back?',
  content: '<h2 class="lesson-h2">Compare: There or Back?</h2>' +
    tps('The same byte was sent three times. Where did each error happen? The sender only sees the top row and the bottom row. Can it tell A and B apart?',
      '<p><strong>A:</strong> a bit changed on the way <strong>there</strong>. The receiver sent back what it got.</p><p><strong>B:</strong> the data arrived correctly. A bit changed on the way <strong>back</strong>.</p><p><strong>C:</strong> no error.</p><p>In A and B the sender sees the <strong>same thing</strong>: a copy that does not match. It <strong>cannot tell</strong> which way the error happened, so it sends the data again both times. The data also travels twice, so an echo check takes longer.</p>') +
    `<table class="donow-table" style="margin:0 auto"><tr><th style="${cmpTd}"></th><th style="${cmpTd}">A</th><th style="${cmpTd}">B</th><th style="${cmpTd}">C</th></tr>` +
    cmpRow('Sent by the sender', [C_SENT, C_SENT, C_SENT].map((s) => byteBox(s))) +
    cmpRow('Arrived at the receiver', [CA, CB, CC].map((x) => byteBox(x.arrived, diff(C_SENT, x.arrived)))) +
    cmpRow('Copy back at the sender', [CA, CB, CC].map((x) => byteBox(x.back, diff(x.arrived, x.back)))) + '</table>' +
    facts(['The sender only sees the data it sent and the copy back.', 'The data goes there <strong>and</strong> back: it travels twice.']) });

steps.push(embed('activity-1', 'Activity 1: There or Back?', 'drill-y10-2-2-l3-echo', 'Activity 1: There or Back?',
  'Be the sender: compare the copy with the data sent. Then see the whole trip and say where the error happened. New bytes every time.',
  ['The error was only on the way back. Why does the sender still send the data again?', 'It cannot see what the receiver got. It only knows the copy does not match.']));

steps.push(selfMarked('exam-echo-2', 'Exam Question: The Tractor and the Echo Check', 'Exam Question: The Tractor and the Echo Check',
  cite('0478/12, March 2024, Question 6(e)') + ' At the end of each day a self-driving tractor transmits the data it has collected to the farmer\'s computer in their house. The transmission uses an echo check.', [
    { id: 'echo-roles', prompt: '(i) Describe the role of the self-driving tractor and the farmer\'s computer in the echo check. [3]', marks: 3,
      modelAnswer: 'Any three: the farmer\'s computer transmits the same data back to the tractor; the tractor compares both sets of data; if they are identical there is no error; if they are different, the tractor resends the data (or reports an error).' },
  ], ['Which one is the sender here, and which one is the receiver?', 'The tractor sends the data, so the tractor compares. The computer receives it, so it sends the copy back.']));

// ---------------------------------------------------------------- ARQ: predict then reveal
steps.push({ id: 'concept-arq', label: 'Automatic Repeat Query (ARQ)',
  content: '<h2 class="lesson-h2">Automatic Repeat Query (ARQ)</h2>' +
    tps('Predict: the sender sends packet 2 and starts a timer. The timer runs out. Nothing came back. What should the sender do?',
      '<p>Send packet 2 <strong>again</strong>. Nothing came back, so the sender cannot be sure packet 2 arrived correctly.</p><p>The timer running out is called a <strong>timeout</strong>.</p>', 'Show the worked answer') +
    columns(facts(['The sender sends the data and starts a <strong>timer</strong>.', 'The receiver checks the data, for example with a parity check.', 'No error: the receiver sends a <strong>positive acknowledgement</strong> back. It means "it arrived correctly".', 'The acknowledgement arrives in time: the sender sends the next data.', 'Nothing arrives before the timer runs out (a <strong>timeout</strong>): the sender sends the data again.']),
      timeline([
        ['Sends packet 1.<br>Starts the timer.', 'r', 'packet 1', 'No error.'],
        ['It arrives in time.', 'l', 'acknowledgement', 'Sends an acknowledgement.'],
        ['Sends packet 2.<br>Starts the timer.', 'r', 'packet 2', 'Error found.<br>Sends nothing.'],
        ['Timeout.<br>Sends packet 2 again.', 'r', 'packet 2', 'No error.'],
      ])) });

steps.push(checkStep('check-arq', 'Check: Timer and Timeout', 'Check: Timer and Timeout', 'Answer in a few words.', [
  { label: 'When the sender sends the data, what does it start?', answer: '^(?!.*\\bnot\\b).*\\b(timer|clock|count\\s*down|countdown)\\b', feedback: 'The sender waits for an acknowledgement, but not forever. What tells it when to stop waiting?' },
  { label: 'The timer runs out before an acknowledgement arrives. What is this called?', answer: '^\\s*(a\\s+|the\\s+)?time[\\s-]*out\\s*\\.?\\s*$', feedback: 'It is one word, made from what ran out and the word for finished.' },
  { label: 'What does the sender do after this?', answer: '^(?!\\s*(no|not|it\\s+does\\s+not)\\b)(?!.*\\b(next|never)\\b)(?!.*\\b(not|don\'?t)\\s+(re-?)?send).*\\b(again|resen[dt]|re-?send\\w*|re-?transmit\\w*|repeat\\w*)\\b', feedback: 'No acknowledgement came. Can the sender be sure the data arrived correctly?' },
], ['Why does the sender not just wait for ever?', 'The data, or the acknowledgement, may be lost. A timer makes sure the data is sent again.']));

// ---------------------------------------------------------------- compare: positive and negative acknowledgement
steps.push({ id: 'compare-ack', label: 'Compare: Positive and Negative Acknowledgement',
  content: '<h2 class="lesson-h2">Compare: Positive and Negative Acknowledgement</h2>' +
    tps('Packet 2 arrives with an error in both. What is the same, and what is different?',
      '<p><strong>Same:</strong> the sender sends packet 2 again.</p><p><strong>Different:</strong> with positive acknowledgement the receiver sends <strong>nothing</strong>, so the sender waits for the <strong>timeout</strong>. With negative acknowledgement the receiver sends a <strong>negative acknowledgement</strong>, so the sender knows straight away.</p>') +
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">' +
    '<div><p style="margin:0 0 6px;text-align:center"><strong>Positive acknowledgement</strong></p>' + timeline([
      ['Sends packet 2.<br>Starts the timer.', 'r', 'packet 2', 'Error found.'],
      ['Waits.', '', '(nothing)', 'Sends nothing.'],
      ['Timeout.<br>Sends packet 2 again.', 'r', 'packet 2', ''],
    ], 14) + '</div>' +
    '<div><p style="margin:0 0 6px;text-align:center"><strong>Negative acknowledgement</strong></p>' + timeline([
      ['Sends packet 2.<br>Starts the timer.', 'r', 'packet 2', 'Error found.'],
      ['Sends packet 2 again.', 'l', 'negative<br>acknowledgement', 'Sends a negative acknowledgement.'],
    ], 14) + '</div></div>' +
    facts(['<strong>Positive acknowledgement</strong>: "it arrived correctly".', '<strong>Negative acknowledgement</strong>: "an error was found, send it again".']) });

steps.push(mcStep('hinge-timeout', 'Check: What a Timeout Means', 'Check: What a Timeout Means', 'ARQ with positive acknowledgement. The sender sent packet 6 and started the timer.', [
  { prompt: 'A timeout happens. What does the sender know?', options: ['Packet 6 arrived with an error', 'A negative acknowledgement arrived', 'No acknowledgement arrived in time', 'Packet 6 arrived with no error'], correct: 2,
    explain: 'A timeout only means the timer ran out before an acknowledgement arrived. Packet 6 may have been lost or had an error, or the acknowledgement may have been lost. So the sender sends packet 6 again.' },
], ['Why can the sender not know WHY nothing came back?', 'It cannot see the packet or the receiver. It only knows that nothing arrived in time.']));

steps.push(embed('activity-2', 'Activity 2: Be the Sender, Be the Receiver', 'drill-y10-2-2-l3-arq', 'Activity 2: Be the Sender, Be the Receiver',
  'Be the receiver: check the byte and decide what to send back. Be the sender: decide which packet to send next. New bytes and packets every time.',
  ['Why does the sender keep a copy of each packet until it is acknowledged?', 'It may need to send it again after a timeout or a negative acknowledgement.']));

steps.push(selfMarked('exam-arq', 'Exam Question: ARQ with Positive Acknowledgement', 'Exam Question: ARQ with Positive Acknowledgement',
  cite('0478/13, November 2023, Question 5(c)') + ' An automatic repeat query (ARQ) can be used to make sure that data is received free of errors. It can use a positive or negative acknowledgement method to do this.', [
    { id: 'arq-positive', prompt: 'Explain how an ARQ operates using a positive acknowledgement method. [5]', marks: 5,
      modelAnswer: 'Any five: a timer is started when the sending device transmits a data packet to the receiver; the receiving device checks the data packet for errors; once the receiving device knows the packet is error free it sends an acknowledgement back to the sending device; and the next packet is sent; if the sending device does not receive an acknowledgement before the timer ends, a timeout occurs; the data packet is resent; until an acknowledgement is received, or until a maximum number of attempts is reached.' },
  ], ['This has 5 marks. Use the timeline: what happens at each step?', 'Timer starts; receiver checks; acknowledgement sent; next packet sent; no acknowledgement means timeout, so the packet is sent again.']));

steps.push(selfMarked('exam-arq-2', 'Exam Question: Checksum and ARQ Together', 'Exam Question: Checksum and ARQ Together',
  cite('0478/13, June 2022, Question 7(c)') + ' Umar\'s data is sent to a file server. Checksum and ARQ are both used when transmitting the data from a computer to the file server.', [
    { id: 'checksum-arq', prompt: 'Explain why checksum and ARQ are both used. [3]', marks: 3,
      modelAnswer: 'Any three (at most two about ARQ): the checksum is used to detect errors during transmission, using a calculated value; ARQ checks that the data is received; it uses acknowledgement and timeout; it requests that the data is sent again if the checksum detects an error or the data is not received.' },
  ], ['What does each one do? Which one finds the error, and which one gets the data sent again?', 'The checksum finds the error. ARQ makes sure the data arrives, and asks for it again if there is an error.']));

// 0478/13 June 2025 Q7(b): the echo check and ARQ statements (the parity sentence was in L1). Mark scheme: echo check;
// automatic repeat query (ARQ); timeout; positive/negative.
steps.push(checkStep('practice', 'Practice: Complete the Statements', 'Practice: Complete the Statements',
  cite('0478/13, June 2025, Question 7(b)') + ' Complete the statements.', [
    { label: 'Blank (a)', answer: '^\\s*(an?\\s+)?echo[\\s-]*checks?\\s*\\.?\\s*$', feedback: 'Which method compares the data sent with a copy sent back?' },
    { label: 'Blank (b)', answer: '^\\s*(an?\\s+)?(arq|automatic\\s+repeat\\s+(query|request)(\\s*\\(\\s*arq\\s*\\))?)\\s*\\.?\\s*$', feedback: 'Which method uses acknowledgements?' },
    { label: 'Blank (c)', answer: '^\\s*(a\\s+|the\\s+)?time[\\s-]*outs?\\s*\\.?\\s*$', feedback: 'What happens when the timer runs out?' },
    { label: 'Blanks (d): both words', answer: '^(?=.*\\bpositive\\b)(?=.*\\bnegative\\b).*$', feedback: 'There are two kinds of acknowledgement. Type both.' },
  ], ['Why does the question say "detection AND correction"?', 'The check detects the error. Sending the data again gets correct data to the receiver.'],
  '<div style="padding:12px 16px;border-radius:10px;background:var(--surface-2);font-size:17px;line-height:1.6">An <strong>(a)</strong> ________ involves comparing the data sent to the data received back from the receiving device.<br>An <strong>(b)</strong> ________ uses acknowledgement and <strong>(c)</strong> ________. The acknowledgement system can be <strong>(d)</strong> ________ or ________.</div>'));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Echo Check and ARQ Drill', 'drill-y10-2-2-l3', 'Plenary: Echo Check and ARQ Drill',
  'The echo check, there or back, the timer and timeout, and positive and negative acknowledgement. Your progress is saved.',
  ['Why practise with new bytes and packets every time?', 'If you can follow any trip, you really understand the method.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
// Nov 2022 Q5: exactly one row (Byte 4) and one column (index 4, the paper's "Bit 5") fail even parity.
{
  const badRows = N22.map((r, i) => (ones(r) % 2 ? i : -1)).filter((i) => i >= 0);
  const badCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => ones(column(N22, c) + N22_P[c]) % 2);
  assert(badRows.join() === '3' && badCols.join() === '4' && WB_HEAD[4] === 'Bit 5', 'Nov 2022 Q5: ' + badRows + ' / ' + badCols);
}
assert(T('do-now', 0, '4') && T('do-now', 0, 'Byte 4') && !T('do-now', 0, '5') && T('do-now', 1, '5') && T('do-now', 1, 'bit 5') && !T('do-now', 1, '4'), 'do-now');
assert(T('do-now', 2, 'I counted the 1s, byte 4 and bit 5 have an odd number') && T('do-now', 2, 'even parity was used and the row had an odd count') &&
  T('do-now', 2, 'the column and row are odd') && !T('do-now', 2, 'I looked at it') && !T('do-now', 2, 'byte 4 bit 5'), 'do-now explanation');
assert(T('do-now-2', 0, 'parity') && T('do-now-2', 0, 'Parity check') && T('do-now-2', 0, 'odd or even parity') && T('do-now-2', 0, 'parity byte') && !T('do-now-2', 0, 'checksum') && !T('do-now-2', 0, 'odd'), 'do-now-2 a');
assert(T('do-now-2', 1, 'checksum') && T('do-now-2', 1, 'Check sum') && T('do-now-2', 1, 'a checksum') && !T('do-now-2', 1, 'parity check') && !T('do-now-2', 1, 'algorithm'), 'do-now-2 b');
assert(diff(E_SENT, E_BACK).join() === '3', 'concept-echo: one bit, the fourth');
assert(T('check-echo', 0, 'receiver') && T('check-echo', 0, 'The receiving device') && !T('check-echo', 0, 'sender') && T('check-echo', 1, 'the sender') && !T('check-echo', 1, 'receiver') && T('check-echo', 2, 'No') && !T('check-echo', 2, 'yes'), 'check-echo');
assert(diff(C_SENT, CA.arrived).length === 1 && CA.back === CA.arrived && diff(CB.arrived, CB.back).length === 1 && CB.arrived === C_SENT && CC.back === C_SENT, 'compare-echo');
assert(T('check-arq', 0, 'a timer') && T('check-arq', 0, 'It starts a timer') && !T('check-arq', 0, 'a parity check') && T('check-arq', 1, 'timeout') && T('check-arq', 1, 'time out') && T('check-arq', 1, 'Time-out') && !T('check-arq', 1, 'acknowledgement'), 'check-arq a b');
assert(T('check-arq', 2, 'sends the data again') && T('check-arq', 2, 'resend it') && T('check-arq', 2, 're-transmits the packet') && !T('check-arq', 2, 'sends the next data') && !T('check-arq', 2, 'waits') && !T('check-arq', 2, 'it does not send it again') && T('check-arq', 2, 'send it again because it did not arrive'), 'check-arq c');
assert(T('practice', 0, 'echo check') && !T('practice', 0, 'checksum') && T('practice', 1, 'ARQ') && T('practice', 1, 'automatic repeat query') && T('practice', 1, 'Automatic Repeat reQuest (ARQ)') && !T('practice', 1, 'echo check'), 'practice a b');
assert(T('practice', 2, 'timeout') && T('practice', 2, 'time-out') && !T('practice', 2, 'timer') && T('practice', 3, 'positive or negative') && T('practice', 3, 'negative, positive') && !T('practice', 3, 'positive'), 'practice c d');
// The walkthroughs use other data and never hold the Do Now answers.
{
  const text = WT_BLOCK.steps.map((s) => s.text + ' ' + s.visual.replace(/<th[^>]*>[^<]*<\/th>/g, '')).join(' ');
  assert(!/Byte 4|Bit 5/.test(text), 'block walkthrough gives the Do Now answer');
  const badRows = WB.map((r, i) => (ones(r) % 2 ? i : -1)).filter((i) => i >= 0);
  const badCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => ones(column(WB, c) + WB_P[c]) % 2);
  assert(WB_SENT.every((r) => ones(r) % 2 === 0) && badRows.join() === '1' && badCols.join() === '2' && ones(WB[0]) === 4 && ones(WB[1]) === 5 && ones(column(WB, 2) + WB_P[2]) === 5, 'block walkthrough numbers');
  assert(!/parity|checksum|check\s*sum/i.test(JSON.stringify(WT_NAME)), 'name walkthrough gives a Do Now answer');
}
// No ARQ or echo check term before the slide that teaches it (the title slide only names today's topics).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/echo check/i, 'concept-echo'], [/acknowledg/i, 'concept-arq'], [/timeout|time out|timer/i, 'concept-arq'], [/\bARQ\b|automatic repeat/i, 'concept-arq'], [/negative/i, 'compare-ack'], [/check digit/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey] : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}
// No dashes of any kind in the lesson text.
assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');

const lesson = { id: ID, label: '2.2 L3: Echo Check and ARQ', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in the Year 10 "2.2" unit, straight after L2.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find((y) => y.id === 'year10');
const unit = y10.units.find((u) => u.code === '2.2');
assert(unit && unit.lessons.includes('y10-2-2-l2'), 'the 2.2 unit with L2 must exist (run build_y10_2_2_l2.mjs first)');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y10-2-2-l2') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 2.2 lessons: ${unit.lessons.join(', ')}`);
