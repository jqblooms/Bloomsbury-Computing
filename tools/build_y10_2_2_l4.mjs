// Builds LessonData/y10-2-2-l4.json: Year 10, 2.2 L4: Check Digits (syllabus 0478 2.2 3: how a check digit is used
// to detect errors in data entry, and where check digits are used, including ISBN and bar codes), the fourth and last
// lesson of 2.2 Methods of Error Detection, and registers it after y10-2-2-l3.
//   node tools/build_y10_2_2_l4.mjs
// EAL-light shape, as L1 to L3: a teacher-only Think, Pair, Share under every heading, predict-then-reveal, compare
// slides. Do Now: three slides covering every 2.2 check taught so far (parity byte and block; checksum and echo check;
// ARQ), each with a real cited part and "why" parts, and a Walk me through it that works a similar example for every
// method on the slide. Then the Do Now Extension drill y10-2-2-l4-ext. The two calculation methods are the ones the
// papers use: add the digits and take the remainder after dividing by 10 (0478/23 November 2022 Q3), and multiply each
// digit by its position, total, MOD 11, 10 is X (0478/21 November 2025 Q6). No paper asks the ISBN-13 1 and 3 weights,
// so the lesson names ISBN and bar codes as places check digits are used without that method.
// Activities: y10-2-2-l4-calc (calculate the check digit) and y10-2-2-l4-valid (accept or reject, which error, which
// method finds it). Plenary drill: y10-2-2-l4.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-2-l4';
const P = 'y10-22l4';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => {
  const t = (s) => s.includes('donow-table');
  const tpl = t(a) && !t(b) ? 'max-content minmax(0, 1fr)' : t(b) && !t(a) ? 'minmax(0, 1fr) max-content' : '';
  return `<div class="lesson-do-now-columns"${tpl ? ` style="grid-template-columns:${tpl}"` : ''}><div>${a}</div><div>${b}</div></div>`;
};
const MONO = 'font:700 18px var(--font-mono, monospace);letter-spacing:3px';
const byteBox = (s, mark = [], hlCls = false) => `<span style="${MONO};padding:2px 8px;border-radius:6px;background:var(--surface-3);white-space:nowrap">` +
  s.split('').map((b, i) => mark.includes(i) ? (hlCls ? `<span class="wt-hl">${b}</span>` : `<span style="color:var(--bad);text-decoration:underline">${b}</span>`) : b).join('') + '</span>';
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
const ones = (s) => s.split('').filter((b) => b === '1').length;
const diff = (a, b) => a.split('').map((x, i) => (x !== b[i] ? i : -1)).filter((i) => i >= 0);
const digitsOf = (s) => s.split('').map(Number);
const sumCheck = (s) => digitsOf(s).reduce((t, d) => t + d, 0) % 10;
const posTotal = (s) => digitsOf(s).reduce((t, d, i) => t + d * (i + 1), 0);
const posCheck = (s) => { const r = posTotal(s) % 11; return r === 10 ? 'X' : String(r); };

// A row of digit boxes. opts.check: the last box is the check digit (set apart, brand border); opts.mark: indexes drawn
// in the error colour; opts.hl: indexes marked .wt-hl (walkthrough pictures).
function digitRow(s, opts = {}) {
  const box = 'display:inline-flex;align-items:center;justify-content:center;width:34px;height:40px;border-radius:8px;font:700 22px var(--font-mono, monospace);background:var(--surface-3);margin:0 2px';
  return '<div style="white-space:nowrap">' + s.split('').map((d, i) => {
    const last = opts.check && i === s.length - 1;
    const style = box + (last ? ';margin-left:12px;border:3px solid var(--brand)' : '') + ((opts.mark || []).includes(i) ? ';color:var(--bad);text-decoration:underline' : '');
    return `<span${(opts.hl || []).includes(i) ? ' class="wt-hl"' : ''} style="${style}">${d}</span>`;
  }).join('') + '</div>';
}

const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ = null, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
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
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const stmt = (t, ans = '') => `<div style="display:flex;gap:12px;align-items:center;margin:6px 0"><div style="flex:1;padding:8px 12px;border-radius:8px;background:var(--surface-3)">${t}</div>${ans ? `<div style="min-width:110px;font-weight:700">${ans}</div>` : ''}</div>`;
const ladder = (items, hlAt = -1, done = -1) => '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + items.map((t, i) =>
  `<span${i === hlAt ? ' class="wt-hl"' : ''} style="padding:6px 10px;border-radius:8px;background:var(--surface-3);font-weight:700">${t}</span>`).join('<b>&rarr;</b>') + '</div>';
// A small parity block with no parity byte: rows are 4-bit strings plus the parity bit first.
function miniBlock(rows, pbyte, hl) {
  const td = (b, ri, ci) => `<td${hl && hl(ri, ci) ? ' class="wt-hl"' : ''} style="padding:3px 9px;text-align:center;font:600 17px var(--font-mono, monospace)">${b}</td>`;
  const th = 'padding:3px 9px;font-size:14px;text-align:left;white-space:nowrap';
  let h = `<table class="donow-table" style="margin:0 auto"><tr><th style="${th}"></th><th style="${th}">P</th><th style="${th}">1</th><th style="${th}">2</th><th style="${th}">3</th><th style="${th}">4</th></tr>`;
  rows.forEach((r, ri) => { h += `<tr><th style="${th}">Byte ${ri + 1}</th>` + r.split('').map((b, ci) => td(b, ri, ci)).join('') + '</tr>'; });
  h += `<tr><th style="${th}">Parity byte</th>` + pbyte.split('').map((b, ci) => td(b, rows.length, ci)).join('') + '</tr>';
  return h + '</table>';
}

// Do Now 1 (parity byte and parity block). Byte: even parity, two bits change, the count stays even; the walkthrough
// stops at "what does the receiver see?". Block: a 3-byte even parity block, one bit changed, found by row then column.
const W1_SENT = '01101001', W1_GOT = '00101011';   // four 1s sent; bits 2 and 7 change, still four 1s
const W1B = ['01100', '11011', '00110'];          // even parity rows (P + 4 bits)
const W1B_P = [0, 1, 2, 3, 4].map((c) => (ones(W1B.map((r) => r[c]).join('')) % 2 ? '1' : '0')).join('');
const W1B_GOT = W1B.slice(); W1B_GOT[1] = '11111'; // Byte 2, bit 2 changed
const WT_PARITY = { title: 'Walk me through it: parity byte and parity block', steps: [
  { text: '<strong>Parity byte.</strong> A different byte, sent with <strong>even</strong> parity. Count the 1s.', visual: byteBox(W1_SENT, [1, 2, 4, 7], true) + note('1s sent: 4. Even, so it matches even parity.') },
  { text: 'On the way, <strong>two</strong> bits change. Bit 2 goes from 1 to 0. Bit 7 goes from 0 to 1.', visual: byteBox(W1_SENT) + ' &rarr; ' + byteBox(W1_GOT, [1, 6], true) },
  { text: 'The receiver counts the 1s that arrived.', visual: byteBox(W1_GOT, [2, 4, 6, 7], true) + note('1s that arrived: 4') },
  { text: 'Think: the receiver only sees the count. What does it see here? What does it decide? Now use the same idea for odd parity in part (a).', visual: note('4 went, 4 arrived') },
  { text: '<strong>Parity block.</strong> A different block, even parity. One bit changed. First check every <strong>row</strong>.', visual: miniBlock(W1B_GOT, W1B_P, (r) => r === 1) + note('Byte 2 has five 1s: odd') },
  { text: 'Then check every <strong>column</strong>, with the parity byte.', visual: miniBlock(W1B_GOT, W1B_P, (r, c) => c === 2) + note('Column 2 has three 1s: odd') },
  { text: 'Look at both results together on the block. For part (b), explain what a block can show that one byte on its own cannot.', visual: miniBlock(W1B_GOT, W1B_P, (r, c) => (r === 1 && c === 2)) },
] };

// Do Now 2 (checksum and echo check). Checksum: worked with a parity check in the same three-step shape (before,
// after, decide), so it shows how to describe a check without describing the checksum. The why part: a different
// "why twice?" (a teacher marks a test, then a second teacher marks it again). Echo check: a posted letter and a
// photocopy sent back with a smudge, stopping before the conclusion.
const WT_CHECKSUM_ECHO = { title: 'Walk me through it: checksum and echo check', steps: [
  { text: '<strong>Describe a check.</strong> A similar question: describe how a parity check detects errors. Answer in the order things happen.', visual: ladder(['Before sending', 'After arriving', 'Decide']) },
  { text: 'Before sending: the sender adds a <strong>parity bit</strong> so the number of 1s is odd or even.', visual: ladder(['Before sending', 'After arriving', 'Decide'], 0) },
  { text: 'After arriving: the receiver <strong>counts the 1s</strong> in the byte that arrived.', visual: ladder(['Before sending', 'After arriving', 'Decide'], 1) },
  { text: 'Decide: the count does not fit the parity, so there is an error. One point for each step.', visual: ladder(['Before sending', 'After arriving', 'Decide'], 2) },
  { text: 'For part (a), follow these three steps for a checksum: what happens before sending, after arriving, and how the receiver decides.', visual: note('before &rarr; after &rarr; decide') },
  { text: '<strong>Why twice?</strong> A different case: a teacher marks a test, and a second teacher marks it again. Why do it twice?', visual: stmt('Teacher 1: 34 marks') + stmt('Teacher 2: 31 marks') },
  { text: 'One mark on its own tells you nothing. Put the two side by side: now you can see something went wrong. Use this idea for part (b).', visual: stmt(`Teacher 1: ${kw('34')}`) + stmt(`Teacher 2: ${kw('31')}`) },
  { text: '<strong>Echo check.</strong> A different case: you post a letter to a friend. Your friend posts a photocopy of it back to you. The photocopy has a smudge.', visual: stmt('Your letter: clean') + stmt(`Photocopy back: ${kw('smudge')}`) },
  { text: 'The smudge could come from the trip to your friend, or from the trip back to you. You hold two things: your letter and the photocopy.', visual: note('your letter + the photocopy') },
  { text: 'Think: what would you need to look at to know which trip made the smudge? Do you have it? Use this idea for part (c).', visual: note('which trip?') },
] };

// Do Now 3 (ARQ). Part (a): name other methods, worked with a 2.1 question (other methods of transmission). Why parts:
// a different timer (an oven timer) and a different "tell straight away" (a doorbell), stopping before ARQ itself.
const WT_ARQ = { title: 'Walk me through it: ARQ', steps: [
  { text: '<strong>Name other methods.</strong> A similar question from 2.1: data is sent by serial simplex. Give two other methods of data transmission.', visual: stmt('serial simplex') },
  { text: 'List every method you know, in its family.', visual: note('serial, parallel<br>simplex, half-duplex, full-duplex') },
  { text: 'Cross out the ones the question already uses.', visual: note('<s>serial</s>, parallel<br><s>simplex</s>, half-duplex, full-duplex') },
  { text: 'Any two that are left score: for example parallel and full-duplex. For part (a), list the 2.2 checks the same way, then cross out the two the question uses.', visual: note(`<s>serial</s>, ${kw('parallel')}<br><s>simplex</s>, half-duplex, ${kw('full-duplex')}`) },
  { text: '<strong>Why a timer?</strong> A different case: you put food in an oven and wait for a bell. The bell is broken.', visual: stmt('Oven on. Waiting for the bell...') },
  { text: 'Without a timer, how long would you stand there? A timer says when to stop and look. For part (b), think about the sender after it sends a packet.', visual: stmt(`Oven on. ${kw('Timer: 20 minutes')}`) },
  { text: '<strong>Why ring?</strong> A different case: a friend is at your door. If they wait in silence, you only find out when you look. If they ring the bell, you know at once.', visual: stmt('Waiting in silence') + stmt(`Rings the ${kw('bell')}`) },
  { text: 'For part (c), ask: in your question, who rings the bell, and when?', visual: note('who sends what, and when?') },
] };

// ---------------------------------------------------------------- Do Now (every 2.2 check so far) and its extension
// 0478/12 June 2026 Q4(b)(i). Mark scheme: transposition // even number of bits changed; so the count of 1s is still
// odd / the same; so it still meets the parity. (Q4(a) was used in L1.)
const SWAPWORDS = '(two|2\\s+(bits?|of|errors?|changes?)|even\\s+number|pair|both|swap\\w*|transpos\\w*|interchang\\w*|changed\\s+places|out\\s+of\\s+order|order|several|more\\s+than\\s+one|multiple)';
steps.push(checkStep('do-now', 'Do Now: Parity Checks (1 of 3)', 'Do Now: Parity Checks (1 of 3)',
  'From 2.2 L1 and L2. Part (a): ' + cite('0478/12, June 2026, Question 4(b)(i)') + ' An odd parity byte check is used to check for errors in data that is transmitted from a computer to a printer. There is an error in the data after transmission. This error is not detected by the parity byte check.', [
    { line: true, marks: 2, label: 'Explain why the error may not be detected by a parity byte check.',
      answer: `^(?!\\s*(no|not)\\b)(?=.*\\b${SWAPWORDS}\\b)(?=.*\\b(still|same|unchanged|odd|correct|matches|meets|match|fits|(does\\s*n.?t|did\\s*n.?t|not)\\s+change)\\b).*$`,
      feedback: 'Two ideas: what happened to the bits, and what that did to the number of 1s.' },
    { line: true, label: 'A parity block check is used instead. Why can it find which bit is wrong?',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(rows?|bytes?|across)\\b)(?=.*\\b(columns?|down)\\b)(?=.*\\b(both|together|where|locat\\w*|pinpoint\\w*|exact\\w*|which|find\\w*|identif\\w*|shows?|point\\w*)\\b).*$|^(?=.*\\b(cross\\w*|intersect\\w*|meet\\w*)\\b).*$',
      feedback: 'A block checks in two directions. Name both, and say where the error is.' },
  ], ['Why does the printer need its data checked at all?', 'Interference can change bits on the way. A changed bit could print the wrong thing.']));
steps[steps.length - 1].walkthrough = WT_PARITY;

// 0478/12 March 2021 Q1(d)(iii). Mark scheme (any three): calculates a value from the data; value is appended to the
// data; value is transferred with the data; receiver recalculates the checksum; if the values are different an error
// is detected.
steps.push(checkStep('do-now-2', 'Do Now: Checksum and Echo Check (2 of 3)', 'Do Now: Checksum and Echo Check (2 of 3)',
  'From 2.2 L2 and L3. Part (a): ' + cite('0478/12, March 2021, Question 1(d)(iii)') + ' Data about the final score for a match is transmitted to a central computer 30 kilometres away. The data transmission uses checksums.', [
    { line: true, marks: 3, label: 'Describe how checksums are used to detect errors in data transmission.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(calculat\\w*|add\\w*|total\\w*|sum\\w*|value|algorithm)\\b)(?=.*\\b(recalculat\\w*|again|receiv\\w*|arriv\\w*|after|other\\s+end)\\b)(?=.*\\b(compar\\w*|match\\w*|same|differ\\w*|equal|error)\\b).*$',
      feedback: 'Three steps: what the sender does before sending, what the receiver does, and how it decides.' },
    { line: true, label: 'Why is the checksum calculated before the data is sent AND again after it arrives?',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(compar\\w*|match\\w*|same|differ\\w*|equal|chang\\w*|check\\s+(them|both|the\\s+two))\\b)(?=.*\\b(two|both|values?|results?|answers?|totals?|checksums?|them|they|data|before|after|sent|arriv\\w*)\\b).*$',
      feedback: 'One value on its own tells the receiver nothing. What can it do with two?' },
    { line: true, label: 'An echo check finds an error. Why can the sender not tell if it happened on the way there or on the way back?',
      answer: '^(?=.*\\b(see|sees|saw|seen|know|knows|view|access|has|have|get|gets)\\b)(?=.*\\b(receiv\\w*|arriv\\w*|got|middle|other\\s+end)\\b).*$|^(?=.*\\b(same|identical|alike|both)\\b)(?=.*\\b(copy|copies|result|looks?|mismatch|match|wrong|different)\\b).*$',
      feedback: 'Think about what the sender can see, and what it cannot see.' },
  ], ['Why check data sent 30 kilometres?', 'A long cable picks up more interference, so bits are more likely to change.']));
steps[steps.length - 1].walkthrough = WT_CHECKSUM_ECHO;

// 0478/11 June 2024 Q9(b)(ii). Mark scheme (any two): echo check; checksum; even parity check; negative ARQ.
const OTHER = ['echo', 'check\\s*-?\\s*sum', 'even\\s+parity', 'negative'];
const anyTwo = (alts) => alts.flatMap((a, i) => alts.slice(i + 1).map((b) => `(?=.*\\b${a})(?=.*\\b${b})`)).map((x) => `^${x}.*$`).join('|');
steps.push(checkStep('do-now-3', 'Do Now: ARQ (3 of 3)', 'Do Now: ARQ (3 of 3)',
  'From 2.2 L1 to L3. Part (a): ' + cite('0478/11, June 2024, Question 9(b)(ii)') + ' A company checks data for errors after transmission. The error detection system uses an odd parity check and a positive automatic repeat query (ARQ).', [
    { line: true, marks: 2, label: 'Give two other error detection methods that could be used.', answer: anyTwo(OTHER),
      feedback: 'List every check from 2.2, then cross out the two the question already uses.' },
    { line: true, label: 'Why does ARQ need a timeout?',
      answer: '^(?=.*\\b(lost|lose|loses|never|not|no|nothing|forever|ever|stuck|missing|corrupt\\w*)\\b)(?=.*\\b(arriv\\w*|receiv\\w*|acknowledg\\w*|ack|back|repl\\w*|wait\\w*|comes?|gets?|reach\\w*|sent|send\\w*)\\b).*$',
      feedback: 'What if the acknowledgement never comes back? What would the sender do?' },
    { line: true, label: 'With negative acknowledgement, why does the sender not have to wait for a timeout to find out about an error?',
      answer: '^(?=.*\\b(negative|nak|receiver|receiving|message|error|reply|replies)\\b)(?=.*\\b(straight|immediate\\w*|at\\s+once|right\\s+away|soon|quick\\w*|fast\\w*|tells?|told|knows?|informs?|warns?|says?|saying|lets?|message)\\b).*$',
      feedback: 'Who sends the negative acknowledgement, and what does it tell the sender?' },
  ], ['Why use a parity check AND ARQ together?', 'The parity check finds the error. ARQ makes sure the data is sent again.']));
steps[steps.length - 1].walkthrough = WT_ARQ;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-2-l4-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1 Data Transmission and 2.2 Lessons 1 to 3. Stuck? Switch on <strong>I need help</strong> and use <strong>Walk me through it</strong>.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Check Digits',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.2 Methods of Error Detection</p><h2 class="lesson-h2">Check Digits</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> mistakes when a person <strong>types</strong> a number, or a machine <strong>scans</strong> one, and how a <strong>check digit</strong> finds them.', '<strong>You already know:</strong> parity checks, checksums, echo checks and ARQ. They find errors when data is <strong>sent</strong>.']) +
    why('A shop worker types a product number and presses one wrong key. Why is that a problem? Could a parity check find it?', 'The wrong number is the data. A parity check only checks that data arrives the same as it was sent, so it would not find it. We need a different check.') });

// ---------------------------------------------------------------- data entry errors: predict then reveal
const DE = '69321', DE_WRONG = '69821', DE_SWAP = '96321';
steps.push({ id: 'concept-entry', label: 'Data Entry Errors',
  content: '<h2 class="lesson-h2">Data Entry Errors</h2>' +
    tps(`Predict: Ana should type ${DE}. She types ${DE_WRONG}. Ben types ${DE_SWAP}. What went wrong each time?`,
      `<p>Ana typed <strong>one digit wrong</strong>: 3 became 8.</p><p>Ben <strong>swapped two digits</strong>: 6 and 9 changed places.</p><p>The computer cannot see the number they meant. These are <strong>data entry</strong> errors.</p>`, 'Show the worked answer') +
    columns(facts(['<strong>Data entry</strong>: a person types a number, or a scanner reads one.', 'Two common errors: <strong>one digit wrong</strong>, or <strong>two digits swapped</strong>.', 'The error happens <strong>before</strong> the data is sent, so a parity check or checksum cannot see it.']),
      `<div style="display:grid;grid-template-columns:auto auto;gap:10px 14px;align-items:center"><strong>Should be</strong>${digitRow(DE)}<strong>Ana typed</strong>${digitRow(DE_WRONG, { mark: diff(DE, DE_WRONG) })}<strong>Ben typed</strong>${digitRow(DE_SWAP, { mark: diff(DE, DE_SWAP) })}</div>`) });

// ---------------------------------------------------------------- the check digit
steps.push({ id: 'concept-check-digit', label: 'The Check Digit',
  content: '<h2 class="lesson-h2">The Check Digit</h2>' +
    tps('Predict: the last digit of 512435 was worked out from the first five digits. Ben types 512485. How could the computer notice?',
      '<p>It works out the last digit again from the first five digits it got. The answer will not match the 5 that was typed, so there is an <strong>error</strong>.</p>', 'Show the worked answer') +
    columns(facts(['A <strong>check digit</strong> is an extra digit at the <strong>end</strong> of a number.', 'It is <strong>calculated</strong> from the other digits, using an algorithm.', 'When the number is entered, the computer <strong>calculates it again</strong> and <strong>compares</strong>.', 'They match: accepted. Different: an error, so the number is entered again.', 'Used in <strong>ISBN</strong> numbers on books, and in <strong>bar codes</strong> on products.']),
      '<div style="text-align:center">' + digitRow('512435', { check: true }) + '<p style="margin:8px 0 0;font-size:15px;color:var(--muted)">the last digit is the check digit</p></div>') });

// 0478/23 June 2026 Q3(b). Mark scheme: a value to instantly verify the accuracy of data; that is calculated from the
// input; an example: the last digit of an ISBN code on a book // bar code // credit card // parity bit.
steps.push(checkStep('exam-purpose', 'Exam Question: What a Check Digit Is For', 'Exam Question: What a Check Digit Is For',
  cite('0478/23, June 2026, Question 3(b)') + ' Explain the purpose of a check digit and give an example of where it could be used.', [
    { line: true, marks: 2, label: 'Purpose',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(errors?|mistakes?|accura\\w*|verif\\w*|correct\\w*|checks?|checking|valid\\w*|wrong)\\b)(?=.*\\b(calculat\\w*|algorithm|worked\\s+out|from\\s+the\\s+(other\\s+)?(digits|data|input|number)|using\\s+the\\s+(other\\s+)?(digits|data|number))\\b).*$',
      feedback: 'Two ideas: what it is used for, and how it is made.' },
    { line: true, label: 'Example', answer: '\\b(isbns?|books?|bar\\s*-?\\s*codes?|products?|credit\\s+cards?|bank\\s+cards?|parity\\s+bits?)\\b',
      feedback: 'Where have you seen a long number with a check digit at the end?' },
  ], ['Why does the mark scheme want the word "calculated"?', 'The check digit is not chosen at random. It is worked out from the other digits, so the computer can work it out again.']));

// ---------------------------------------------------------------- method 1: add the digits
steps.push({ id: 'concept-sum', label: 'Method 1: Add the Digits',
  content: '<h2 class="lesson-h2">Method 1: Add the Digits</h2>' +
    tps('Predict: add up the digits of 51243. Divide the total by 10. What is the remainder?',
      '<p>5 + 1 + 2 + 4 + 3 = 15. 15 divided by 10 is 1, remainder <strong>5</strong>.</p><p>So the check digit is 5, and the full number is <strong>512435</strong>.</p>', 'Show the worked answer') +
    '<p class="lesson-lead">' + cite('0478/23, November 2022, Question 3') + ' The check digit is calculated by adding up the first five digits, dividing by 10 and taking the remainder.</p>' +
    columns(facts(['<strong>Step 1:</strong> add up the digits.', '<strong>Step 2:</strong> divide the total by 10.', '<strong>Step 3:</strong> the <strong>remainder</strong> is the check digit.', 'The remainder is always 0 to 9: one digit.']),
      '<table class="donow-table" style="margin:0 auto;font-size:18px"><tr><th style="padding:5px 12px">Step</th><th style="padding:5px 12px">Working</th></tr>' +
      '<tr><td style="padding:5px 12px">1</td><td style="padding:5px 12px">5 + 1 + 2 + 4 + 3 = 15</td></tr><tr><td style="padding:5px 12px">2</td><td style="padding:5px 12px">15 &divide; 10 = 1 remainder 5</td></tr>' +
      '<tr><td style="padding:5px 12px">3</td><td style="padding:5px 12px">check digit = 5</td></tr></table><div style="margin-top:10px;text-align:center">' + digitRow('512435', { check: true }) + '</div>') });

// 0478/23 November 2022 Q3(a). Mark scheme: (i) 1; (ii) C, D (one mark each).
const N22 = { A: '123455', B: '691400', C: '722855', D: '231200' };
const codeList = '<div style="padding:10px 16px;border-radius:10px;background:var(--surface-2);font:600 19px/1.7 var(--font-mono, monospace)">' + Object.entries(N22).map(([k, v]) => `${k}&nbsp;&nbsp;${v}`).join('<br>') + '</div>';
steps.push(checkStep('exam-calc', 'Exam Question: Calculate and Check', 'Exam Question: Calculate and Check',
  cite('0478/23, November 2022, Question 3(a)') + ' The check digit is calculated by adding up the first five digits, dividing by 10 and taking the remainder.', [
    { label: 'Calculate the check digit for 69321', answer: '^\\s*(check\\s+digit\\s*(is|[:=])?\\s*)?1\\s*$', feedback: 'Add the five digits. Divide the total by 10. What is left over?' },
    { line: true, marks: 2, label: 'State which of these identification numbers have incorrect check digits.', answer: '^(?=.*\\bc\\b)(?=.*\\bd\\b)(?!.*\\bb\\b)(?!.*(^|[\\s,])a([\\s,.]|$)).*$',
      feedback: 'For each number, add the first five digits and find the remainder. Does it match the last digit? Type every letter that does not match.' },
  ], ['Why check every number, not just the ones that look wrong?', 'A wrong number looks just like a right one. Only the calculation shows it.'], codeList));

// ---------------------------------------------------------------- compare: one wrong digit, two swapped
const CS = '37254', CS_CD = sumCheck(CS), CS_WRONG = '37854', CS_SWAP = '32754';
const csCol = (title, typed, mark) => {
  const cd = sumCheck(typed), t = digitsOf(typed).reduce((a, b) => a + b, 0);
  return `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)"><p style="margin:0 0 6px;text-align:center"><strong>${title}</strong></p>` +
    `<div style="text-align:center">${digitRow(typed + CS_CD, { check: true, mark })}</div>` +
    `<p style="margin:8px 0 0;font-size:17px">${typed.split('').join(' + ')} = ${t}<br>remainder ${cd}. Typed check digit: ${CS_CD}.<br><strong>${cd === CS_CD ? 'They match: the error is NOT found.' : 'Different: the error is found.'}</strong></p></div>`;
};
steps.push({ id: 'compare-swap', label: 'Compare: One Wrong Digit and Two Swapped',
  content: '<h2 class="lesson-h2">Compare: One Wrong Digit and Two Swapped</h2>' +
    tps(`The right number is ${CS}${CS_CD}. Two people type it wrongly. Predict: does Method 1 find both errors?`,
      '<p>It finds the wrong digit: the total changes, so the remainder changes.</p><p>It does <strong>not</strong> find the swap: the same digits give the <strong>same total</strong>, in any order.</p>') +
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">' +
    csCol('One digit typed wrong', CS_WRONG, diff(CS, CS_WRONG)) + csCol('Two digits swapped', CS_SWAP, diff(CS, CS_SWAP)) + '</div>' +
    facts(['Adding the digits finds <strong>one wrong digit</strong>.', 'It misses <strong>two digits swapped</strong>: the total stays the same.']) });

// ---------------------------------------------------------------- method 2: multiply by position
const M2 = '30475', M2_SWAP = '03475';
const m2Table = (s) => '<table class="donow-table" style="margin:0 auto;font-size:17px"><tr><th style="padding:4px 10px;text-align:left">Digit</th>' + s.split('').map((d) => `<td style="padding:4px 10px;text-align:center">${d}</td>`).join('') + '</tr>' +
  '<tr><th style="padding:4px 10px;text-align:left">Position</th>' + s.split('').map((d, i) => `<td style="padding:4px 10px;text-align:center">${i + 1}</td>`).join('') + '</tr>' +
  '<tr><th style="padding:4px 10px;text-align:left">Digit &times; position</th>' + s.split('').map((d, i) => `<td style="padding:4px 10px;text-align:center">${Number(d) * (i + 1)}</td>`).join('') + '</tr></table>';
steps.push({ id: 'concept-position', label: 'Method 2: Multiply by Position',
  content: '<h2 class="lesson-h2">Method 2: Multiply by Position</h2>' +
    tps(`Predict: swap the first two digits, ${M2_SWAP}. With Method 2, does the check digit change?`,
      `<p>Yes. 0 &times; 1 + 3 &times; 2 + 4 &times; 3 + 7 &times; 4 + 5 &times; 5 = ${posTotal(M2_SWAP)}. MOD(${posTotal(M2_SWAP)}, 11) = ${posCheck(M2_SWAP)}, not ${posCheck(M2)}.</p><p>Each digit is multiplied by a <strong>different</strong> number, so a swap changes the total. The swap is found.</p>`, 'Show the worked answer') +
    '<p class="lesson-lead">' + cite('0478/21, November 2025, Question 6') + ' The check digit for a 5-digit number:</p>' +
    columns(facts(['Multiply each digit by its <strong>position</strong> (the first digit is position 1).', 'Add the results: the <strong>total</strong>.', '<strong>MOD(Total, 11)</strong> is the remainder after dividing by 11.', 'If the result is 10, the check digit is <strong>X</strong>.']),
      m2Table(M2) + `<p style="margin:8px 0 0;text-align:center;font-size:17px">3 + 0 + 12 + 28 + 25 = ${posTotal(M2)}<br>${posTotal(M2)} = 6 &times; 11 + 2, so MOD(${posTotal(M2)}, 11) = <strong>${posCheck(M2)}</strong></p>`) });

const CW = '41302', CW_SWAP = '14302';
steps.push(checkStep('check-position', 'Check: Multiply by Position', 'Check: Multiply by Position', 'Use Method 2. Type the check digit.', [
  { label: `What is the check digit for ${CW}?`, answer: `^\\s*(check\\s+digit\\s*(is|[:=])?\\s*)?${posCheck(CW)}\\s*$`, feedback: 'Digit times position for each digit, add them up, then the remainder after dividing by 11.' },
  { label: 'The total is 54. What is the check digit?', answer: '^\\s*(the\\s+letter\\s+)?x\\s*$', feedback: 'How many 11s fit in 54? What is left over? Read the rule for that remainder.' },
  { label: `${CW} is typed as ${CW_SWAP}. What check digit does the computer calculate now?`, answer: `^\\s*(check\\s+digit\\s*(is|[:=])?\\s*)?${posCheck(CW_SWAP)}\\s*$`, feedback: 'Work out the total again with the new order of digits.' },
], ['Why does part (c) give a different check digit from part (a)?', 'The digits sit in new positions, so they are multiplied by different numbers. The total changes, so the swap is found.']));

// 0478/23 November 2022 Q3(b). Mark scheme: (i) two or more digits; transposed. (ii) multiply each digit by a different
// number / its place value; before adding them together and dividing by a number.
steps.push(checkStep('exam-algorithm', 'Exam Question: A Better Algorithm', 'Exam Question: A Better Algorithm',
  cite('0478/23, November 2022, Question 3(b)') + ' The check digit is calculated by adding up the first five digits, dividing by 10 and taking the remainder.', [
    { line: true, marks: 2, label: 'Describe an input error that would not be found using this check digit.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(two|2|digits|numbers|pair|both)\\b)(?=.*\\b(swap\\w*|transpos\\w*|switch\\w*|order|places|round|revers\\w*|interchang\\w*|mixed|flipped)\\b).*$',
      feedback: 'Look back at the compare slide. Which mistake gave the same total?' },
    { line: true, marks: 2, label: 'Describe a more suitable algorithm to calculate the check digit for this identification number.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(multipl\\w*|times|weight\\w*|positions?|place\\s+values?|different\\s+numbers?)\\b)(?=.*\\b(add\\w*|total\\w*|sum\\w*|divid\\w*|mod|modulo|remainder)\\b).*$',
      feedback: 'Two ideas: what is done to each digit first, then what is done with the results.' },
  ], ['Why is (ii) worth two marks?', 'One mark for multiplying each digit by a different number, one for then adding and dividing.']));

steps.push(embed('activity-1', 'Activity 1: Calculate the Check Digit', 'drill-y10-2-2-l4-calc', 'Activity 1: Calculate the Check Digit',
  'Method 1 and Method 2, with new numbers every time. Stuck? Switch on <strong>I need help</strong> and walk through a different number, step by step.',
  ['Why do both methods end with a remainder?', 'A remainder is always small, so the check digit fits in one place at the end.']));

// ---------------------------------------------------------------- hinge, and 0478/13 November 2023 Q5(b) (mark scheme: C)
steps.push(mcStep('hinge-mismatch', 'Check: When It Does Not Match', 'Check: When It Does Not Match', 'Choose one answer for each.', [
  { prompt: 'A bar code is scanned. The computer calculates the check digit again, and it does not match. What happens?',
    options: ['The computer corrects the wrong digit', 'The data is sent again down the cable', 'The bar code is rejected and scanned again', 'The check digit is changed to match'], correct: 2,
    explain: 'A check digit only shows THAT there is an error. It cannot show which digit is wrong, so the number is entered or scanned again.' },
  { prompt: cite('0478/13, November 2023, Question 5(b)') + ' Some error detection methods use a calculated value to check for errors. Which error detection method does NOT use a calculated value to check for errors?',
    options: ['Check digit', 'Checksum', 'Echo check', 'Parity check'], correct: 2,
    explain: 'An echo check sends a copy of the data back and compares. Nothing is calculated.' },
], ['Why can a check digit not correct the error?', 'It only tells the computer the number is wrong, not which digit is wrong.']));

// ---------------------------------------------------------------- compare: data entry and transmission
const ct = 'padding:6px 12px;text-align:left;vertical-align:top;font-size:17px';
steps.push({ id: 'compare-entry', label: 'Compare: Data Entry and Transmission',
  content: '<h2 class="lesson-h2">Compare: Data Entry and Transmission</h2>' +
    tps('A bar code is scanned at a till. Then the price is sent to the stock computer. Which check fits each step? Why?',
      '<p>Scanning is <strong>data entry</strong>: a <strong>check digit</strong> finds a bad scan.</p><p>Sending to the stock computer is <strong>transmission</strong>: a parity check, checksum, echo check or ARQ finds bits changed on the way.</p>') +
    `<table class="donow-table" style="margin:0 auto"><tr><th style="${ct}"></th><th style="${ct}">Data entry</th><th style="${ct}">Transmission</th></tr>` +
    `<tr><th style="${ct}">When</th><td style="${ct}">a person types a number,<br>or a scanner reads one</td><td style="${ct}">data is sent from one<br>device to another</td></tr>` +
    `<tr><th style="${ct}">Errors</th><td style="${ct}">one digit wrong,<br>two digits swapped</td><td style="${ct}">bits lost, gained<br>or changed</td></tr>` +
    `<tr><th style="${ct}">Check</th><td style="${ct}"><strong>check digit</strong></td><td style="${ct}">parity check, checksum,<br>echo check, ARQ</td></tr>` +
    `<tr><th style="${ct}">Example</th><td style="${ct}">an ISBN typed in,<br>a bar code scanned</td><td style="${ct}">a file sent to a printer</td></tr></table>` });

// 0478/12 June 2026 Q4(b)(ii). Mark scheme (two from): parity block check; even parity (byte) check; checksum; echo
// check; ARQ; methods not in the syllabus such as a cyclic redundancy check. "Do not accept check digit. This is for
// data entry and not transmission." Part (b) is not from the paper.
const PRINTER = ['parity\\s+block', 'even\\s+parity', 'check\\s*-?\\s*sum', 'echo', '(arq|automatic\\s+repeat)', 'cyclic'];
steps.push(checkStep('exam-printer', 'Exam Question: Checks for the Printer', 'Exam Question: Checks for the Printer',
  'Part (a): ' + cite('0478/12, June 2026, Question 4(b)(ii)') + ' An odd parity byte check is used to check for errors in data that is transmitted from a computer to a printer.', [
    { line: true, marks: 2, label: 'Give two other error detection methods that could be used.',
      answer: `^(?!.*check\\s*-?\\s*digit)(${anyTwo(PRINTER).replace(/\^|\.\*\$/g, '')}).*$`,
      feedback: 'The data is being sent to a printer. Which checks are for data that is sent?' },
    { line: true, label: 'Why is a check digit not a correct answer to (a)?',
      answer: '^(?=.*\\b(data\\s+entry|entry|entered|enter\\w*|typ\\w*|scann?\\w*|input\\w*|key\\w*)\\b)(?=.*\\b(transmi\\w*|sent|send\\w*|travel\\w*|cable|printer|network|moving)\\b).*$',
      feedback: 'Use the compare slide: what is a check digit for, and what is happening to this data?' },
  ], ['Why does the mark scheme say "Do not accept check digit"?', 'A check digit is for data entry. Here the data is being transmitted.']));

// 0478/12 November 2024 Q5(a). Mark scheme (any four).
steps.push(selfMarked('exam-barcode', 'Exam Question: The Bar Code Scanner', 'Exam Question: The Bar Code Scanner',
  cite('0478/12, November 2024, Question 5') + ' A barcode scanning system uses a check digit to check for errors in data on input.', [
    { id: 'barcode-explain', prompt: '(a) Explain how the barcode scanning system operates to check for errors. [4]', marks: 4,
      modelAnswer: 'Any four: a check digit is calculated from the barcode data; using an algorithm (for example, modulo 11); and added to the barcode; when the barcode is scanned the check digit is recalculated; using the same algorithm; if the check digits do not match, an error has occurred when scanning the barcode (if they match, no error has occurred).' },
  ], ['This has 4 marks. What happens before the scan, and what happens after it?', 'Before: the check digit is calculated and added. After: it is calculated again and the two are compared.']));

steps.push(embed('activity-2', 'Activity 2: Accept or Reject?', 'drill-y10-2-2-l4-valid', 'Activity 2: Accept or Reject?',
  'Be the computer: check each code and accept or reject it. Then name the error, and say which method finds it. New codes every time.',
  ['Why does Method 1 accept some codes that were typed wrongly?', 'Two digits swapped give the same total, so the check digit still matches.']));

// 0478/13 November 2021 Q3(a). Mark scheme: entry: check digit; acknowledgement and timeout: ARQ; compares two
// calculated values: check digit and checksum; may resend until confirmed: ARQ; after transmission: checksum.
const ONLY = (want) => {
  const name = { arq: '(arq|automatic\\s+repeat)', digit: 'check\\s*-?\\s*digits?', sum: 'check\\s*-?\\s*sums?' };
  return '^' + Object.keys(name).map((k) => (want.includes(k) ? `(?=.*\\b${name[k]}\\b)` : `(?!.*\\b${name[k]}\\b)`)).join('') + '.*$';
};
steps.push(checkStep('practice', 'Practice: Which Method?', 'Practice: Which Method?',
  cite('0478/13, November 2021, Question 3(a)') + ' Which method does each statement apply to: ARQ, check digit or checksum? Some statements apply to more than one method.', [
    { label: 'checks for errors on data entry', answer: ONLY(['digit']), feedback: 'Which method is used when a number is typed or scanned?' },
    { label: 'uses a process of acknowledgement and timeout', answer: ONLY(['arq']), feedback: 'Which method uses a timer?' },
    { label: 'compares two calculated values to see if an error has occurred (two methods)', answer: ONLY(['digit', 'sum']), feedback: 'Which methods calculate a value, then calculate it again? Type both.' },
    { label: 'may resend data until it is confirmed as received', answer: ONLY(['arq']), feedback: 'Which method waits for an acknowledgement?' },
    { label: 'checks for errors in data after transmission from a computer to another', answer: ONLY(['sum']), feedback: 'Which of the three calculates a value from the data that was sent?' },
  ], ['Why do two methods both compare calculated values?', 'Both calculate a value, then calculate it again and compare. One is for data entry, one for transmission.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Check Digits Drill', 'drill-y10-2-2-l4', 'Plenary: Check Digits Drill',
  'What a check digit is for, both methods, accept or reject, and which errors each method finds. Your progress is saved.',
  ['Why practise with new numbers every time?', 'If you can check any number, you really understand the method.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
// Every number on the slides comes from the methods.
assert(sumCheck('51243') === 5 && sumCheck('69321') === 1, 'Nov 2022 example and (a)(i)');
assert(['A', 'B', 'C', 'D'].filter((k) => String(sumCheck(N22[k].slice(0, 5))) !== N22[k][5]).join('') === 'CD', 'Nov 2022 (a)(ii) is C and D');
assert(posTotal('30475') === 68 && posCheck('30475') === '2', 'Nov 2025 example');
assert(sumCheck(CS_WRONG) !== CS_CD && sumCheck(CS_SWAP) === CS_CD && diff(CS, CS_SWAP).length === 2 && diff(CS, CS_WRONG).length === 1, 'compare-swap numbers');
assert(posCheck(M2_SWAP) !== posCheck(M2), 'concept-position swap is found');
assert(54 % 11 === 10 && posCheck(CW) !== posCheck(CW_SWAP), 'check-position numbers');
assert(ones(W1_SENT) === 4 && ones(W1_GOT) === 4 && diff(W1_SENT, W1_GOT).length === 2, 'parity walkthrough byte');
assert(W1B.every((r) => ones(r) % 2 === 0) && ones(W1B_GOT[1]) === 5 && ones(W1B_GOT.map((r) => r[2]).join('') + W1B_P[2]) % 2 === 1 &&
  [0, 1, 3, 4].every((c) => ones(W1B_GOT.map((r) => r[c]).join('') + W1B_P[c]) % 2 === 0), 'parity walkthrough block');
ok('do-now', 0, ['Two bits changed so the number of 1s is still odd', 'an even number of bits flipped so it still meets odd parity', 'bits were swapped so the count of ones stays the same', '2 bits changed, so the total is still odd'],
  ['a bit changed', 'odd parity was used', 'the parity bit was wrong', 'no idea', 'two bits changed']);
ok('do-now', 1, ['it checks rows and columns so it finds where the error is', 'the odd row and odd column cross at the wrong bit', 'the byte and the column together show the bit', 'where the row and column meet'], ['it checks each row and each column', 'it checks the byte', 'it counts the 1s', 'columns']);
ok('do-now-2', 0, ['A value is calculated from the data and sent with it, the receiver recalculates it and compares the two', 'the sender adds up the data, the receiver adds it up again, if they are different there is an error'],
  ['it counts the 1s', 'a value is calculated', 'the receiver sends it back']);
ok('do-now-2', 1, ['so the two values can be compared', 'to see if they match', 'to check if the data changed', 'so it can tell if they are different'], ['to find errors', 'because it is sent', 'no']);
ok('do-now-2', 2, ['it cannot see what arrived at the receiver', 'the sender does not know what the receiver got', 'both errors give the same copy back', 'it looks the same either way'], ['because there is an error', 'it was sent again', 'interference']);
ok('do-now-3', 0, ['echo check and checksum', 'checksum, even parity', 'negative ARQ and echo check', 'Even parity check, check sum'], ['echo check', 'odd parity and ARQ', 'parity check and positive ARQ', 'checksum']);
ok('do-now-3', 1, ['the data might be lost so no acknowledgement comes back', 'so it does not wait forever', 'the acknowledgement may never arrive'], ['to send data', 'it checks the parity', 'timeout']);
ok('do-now-3', 2, ['the receiver tells it straight away', 'a negative acknowledgement is sent at once', 'the receiver sends a message to say there is an error'], ['it waits', 'timeout', 'because of the timer']);
ok('exam-purpose', 0, ['to check data is entered correctly, it is calculated from the other digits', 'it finds errors and is calculated using an algorithm', 'a value calculated from the input to verify the data'], ['it is at the end', 'to find errors', 'calculated from the digits']);
ok('exam-purpose', 1, ['ISBN', 'a bar code', 'barcodes on food', 'the last digit of an ISBN on a book', 'credit card'], ['email', 'packet header', 'USB']);
ok('exam-calc', 0, ['1', ' 1 ', 'check digit 1'], ['21', '0', '11']);
ok('exam-calc', 1, ['C and D', 'c, d', 'D and C', 'C D'], ['C', 'A and C and D', 'B, C, D', 'A, B']);
ok('check-position', 0, [posCheck(CW)], ['25', '0', String(sumCheck(CW))]);
ok('check-position', 1, ['X', 'x', 'the letter X'], ['10', '4', '5']);
ok('check-position', 2, [posCheck(CW_SWAP)], [posCheck(CW), '28']);
ok('exam-algorithm', 0, ['two digits swapped', 'if 2 digits are transposed', 'digits in the wrong order', 'two numbers switched places'], ['one digit wrong', 'a typing error', 'swapped']);
ok('exam-algorithm', 1, ['multiply each digit by its position then add them and divide by 11', 'use weights for each digit and then find the remainder', 'times each digit by a different number then add them up'], ['add the digits', 'multiply the digits', 'divide by 11']);
ok('exam-printer', 0, ['checksum and echo check', 'parity block check, ARQ', 'even parity and checksum', 'echo check, automatic repeat query'], ['check digit and checksum', 'echo check', 'odd parity and check digit', 'parity check']);
ok('exam-printer', 1, ['a check digit is for data entry, this data is transmitted', 'it is used when typing, not when data is sent to a printer'], ['it is not accurate', 'data entry', 'because it is transmitted']);
ok('practice', 0, ['check digit', 'Check-digit'], ['checksum', 'check digit and checksum', 'ARQ']);
ok('practice', 1, ['ARQ', 'automatic repeat query'], ['check digit', 'checksum']);
ok('practice', 2, ['check digit and checksum', 'checksum, check digit'], ['checksum', 'check digit', 'ARQ, checksum, check digit']);
ok('practice', 4, ['checksum', 'check sum'], ['check digit', 'checksum and ARQ']);
// Every walkthrough step, as plain text (alone, and with its picture), must fail every part on its Do Now slide: no
// walkthrough gives an answer.
{
  const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  const dn = steps.filter((s) => /^do-now(-\d)?$/.test(s.id));
  dn.forEach((s) => {
    assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
    [s].forEach((t) => V(t.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
      [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes ${t.id}(${'abc'[i]}): ${plain(part)}`));
    })));
  });
  assert(!/still odd|still even|stays the same|cross|intersect|meet/i.test(plain(JSON.stringify(WT_PARITY))), 'parity walkthrough states the conclusion');
  assert(!/echo|check\s*sum|negative|even parity|timeout/i.test(plain(JSON.stringify(WT_ARQ))), 'ARQ walkthrough names a Do Now answer');
  assert(!/recalculat|add(s|ed)? up|total/i.test(plain(JSON.stringify(WT_CHECKSUM_ECHO))), 'checksum walkthrough describes the checksum');
}
// No term before the slide that teaches it (the title slide only names today's topic).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/check digit/i, 'concept-check-digit'], [/data entry/i, 'concept-entry'], [/\bISBN\b|bar ?code/i, 'concept-check-digit'], [/\bMOD\b|modulo/i, 'concept-position'], [/transpos/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}
assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '2.2 L4: Check Digits', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in the Year 10 "2.2" unit, straight after L3.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find((y) => y.id === 'year10');
const unit = y10.units.find((u) => u.code === '2.2');
assert(unit && unit.lessons.includes('y10-2-2-l3'), 'the 2.2 unit with L3 must exist (run build_y10_2_2_l3.mjs first)');
if (!unit.lessons.includes(ID)) {
  unit.lessons.splice(unit.lessons.indexOf('y10-2-2-l3') + 1, 0, ID);
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; 2.2 lessons: ${unit.lessons.join(', ')}`);
