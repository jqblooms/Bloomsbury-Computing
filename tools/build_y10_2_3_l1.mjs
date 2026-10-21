// Builds LessonData/y10-2-3-l1.json: Year 10, 2.3 L1: Symmetric Encryption (syllabus 0478 2.3 1: the need for and
// purpose of encryption when transmitting data; 2.3 2: how data is encrypted using symmetric encryption), the first
// lesson of 2.3 Encryption. It also writes the lesson's four drills and registers a Year 10 "2.3" unit after 2.2.
//   node tools/build_y10_2_3_l1.mjs
// EAL-light shape, as 2.2 L1 to L4, with every slide's core question a WHY (James, 2026-10-18: Term 1b lessons focus
// on why): a teacher-only Think, Pair, Share under every heading, predict-then-reveal, compare slides.
// Do Now: 0478/11 November 2025 Q2(b)(i) and (ii) (router, header) and Q2(d) (echo check, typed rather than drawn),
// each slide with "why" parts and a Walk me through it. Extension drill y10-2-3-l1-ext (Topic 2 so far).
// The encryption algorithm on the slides and in the drills is a letter shift (the key is how far each letter moves),
// so students can encrypt, decrypt and try every key by hand; the 128-bit compare slide shows why real keys are long.
// Activities: y10-2-3-l1-shift (encrypt, decrypt, crack without the key) and y10-2-3-l1-sharing (who can read it?).
// Plenary drill: y10-2-3-l1. Asymmetric encryption is next lesson, so it is never named here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-3-l1';
const P = 'y10-23l1';
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

// ---------------------------------------------------------------- the shift algorithm
const sh = (w, k) => w.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26 + 26) % 26 + 65));
const BOX = 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:32px;border-radius:6px;font:700 16px var(--font-mono, monospace);background:var(--surface-3);margin:1px';
// The alphabet in two rows of 13. hl: letters marked .wt-hl / brand.
function alphabet(hl = []) {
  const box = (c) => `<span${hl.includes(c) ? ' class="wt-hl"' : ''} style="${BOX}${hl.includes(c) ? ';outline:2px solid var(--brand)' : ''}">${c}</span>`;
  const row = (from) => '<div style="white-space:nowrap">' + Array.from({ length: 13 }, (_, i) => box(String.fromCharCode(65 + from + i))).join('') + '</div>';
  return `<div style="text-align:center">${row(0)}${row(13)}</div>`;
}
// Plain text above cipher text, letter by letter, with the shift between.
function mapTable(top, k, labels = ['Plain text', 'Cipher text'], dir = 1) {
  const bottom = sh(top, dir * k);
  const th = 'padding:4px 10px;text-align:left;font-size:15px;white-space:nowrap';
  const td = 'padding:4px 8px;text-align:center;font:700 19px var(--font-mono, monospace)';
  const cells = (s) => s.split('').map((c) => `<td style="${td}">${c === ' ' ? '&nbsp;' : c}</td>`).join('');
  return `<table class="donow-table" style="margin:0 auto"><tr><th style="${th}">${labels[0]}</th>${cells(top)}</tr>` +
    `<tr><th style="${th}">Shift</th><td colspan="${top.length}" style="padding:2px 8px;text-align:center;font-size:15px">${dir > 0 ? 'forward' : 'back'} ${k}</td></tr>` +
    `<tr><th style="${th}">${labels[1]}</th>${cells(bottom)}</tr></table>`;
}
const pill = (t, tone = '') => `<span style="display:inline-block;padding:7px 12px;border-radius:8px;background:var(--surface-3);font-weight:700;${tone === 'bad' ? 'color:var(--bad);border:2px solid var(--bad-line)' : tone === 'brand' ? 'border:2px solid var(--brand)' : tone === 'good' ? 'color:var(--good);border:2px solid var(--good-line)' : ''}">${t}</span>`;
const arrow = '<b style="margin:0 6px">&rarr;</b>';
const flow = (...parts) => `<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px">${parts.join(arrow)}</div>`;
const mono = (t) => `<span style="font-family:var(--font-mono, monospace)">${t}</span>`;

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
const steps = [];

// ---------------------------------------------------------------- "Walk me through it" pictures
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const stmt = (t) => `<div style="margin:6px 0;padding:8px 12px;border-radius:8px;background:var(--surface-3)">${t}</div>`;
const ladder = (items, hlAt = -1) => '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + items.map((t, i) =>
  `<span${i === hlAt ? ' class="wt-hl"' : ''} style="padding:6px 10px;border-radius:8px;background:var(--surface-3);font-weight:700">${t}</span>`).join('<b>&rarr;</b>') + '</div>';
const packet = (hlAt = -1, names = ['Part 1: at the start', 'Part 2: in the middle', 'Part 3: at the end']) => '<div style="display:flex;gap:4px">' + names.map((t, i) =>
  `<span${i === hlAt ? ' class="wt-hl"' : ''} style="flex:${i === 1 ? 2 : 1};padding:10px;border-radius:8px;background:var(--surface-3);text-align:center;font-weight:700">${t}</span>`).join('') + '</div>';

// Do Now 1 (packets, 2.1 L1). A similar question (which part holds the data: the payload), stopping before the part
// that holds the address; the device is worked as "a device at every junction picks the route"; the why part is a
// house move with boxes in different vans, stopping before the conclusion.
const WT_PACKETS = { title: 'Walk me through it: packets', steps: [
  { text: '<strong>A similar question.</strong> Name the part of a packet that holds the data being sent.', visual: packet() },
  { text: 'A packet has three parts. The data being sent is the main load, so it is the biggest part, in the middle.', visual: packet(1) },
  { text: 'The middle part is called the <strong>payload</strong>. One word is enough for the mark.', visual: packet(1, ['Part 1', 'payload', 'Part 3']) },
  { text: 'For part (b), ask: which part must a device read <strong>first</strong>, before anything else? An address is needed first.', visual: packet(0, ['Part 1', 'payload', 'Part 3']) },
  { text: '<strong>Name the device.</strong> Picture one packet crossing the internet. It meets a junction, then another.', visual: flow(pill('Sender'), pill('?', 'brand'), pill('?', 'brand'), pill('Company')) },
  { text: 'At every junction, a device reads the destination address and picks the next path for the packet: its <strong>route</strong>. The device is named after that job.', visual: flow(pill('Sender'), pill(kw('picks the route')), pill('Company')) },
  { text: '<strong>Why?</strong> A different case: a family moves house. Their boxes go in three vans, and each van takes its own road.', visual: stmt('Van 1: the main road') + stmt('Van 2: the coast road') + stmt('Van 3: the hill road') },
  { text: 'Each driver only sees the boxes in that van. Think: what must be written on every box, and why? Use the same idea for part (c).', visual: note('what is on every box?') },
] };

// Do Now 2 (echo check, 2.2 L3). Part (a) is worked with a checksum in the same three-step shape; part (b) with a
// parity bit making sending slower; part (c) with a lent book, stopping before who holds the first copy.
const WT_ECHO = { title: 'Walk me through it: the echo check', steps: [
  { text: '<strong>A similar question.</strong> Describe how a checksum detects errors. Answer in the order things happen.', visual: ladder(['Before sending', 'After arriving', 'Decide']) },
  { text: 'Before sending: the sender calculates a value from the data. The value is sent with the data.', visual: ladder(['Before sending', 'After arriving', 'Decide'], 0) },
  { text: 'After arriving: the receiver calculates the value from the data it got.', visual: ladder(['Before sending', 'After arriving', 'Decide'], 1) },
  { text: 'Decide: the two values are compared. Different values mean an error. One mark for each step.', visual: ladder(['Before sending', 'After arriving', 'Decide'], 2) },
  { text: 'For part (a), use the same three steps for an echo check: what is sent, where it goes next, and who decides.', visual: note('sent &rarr; next &rarr; decide') },
  { text: '<strong>Why slower?</strong> A different case: a parity check adds 1 bit to every 7 bits of data.', visual: stmt('7 data bits + 1 parity bit = 8 bits') },
  { text: 'More bits to send means sending takes a little longer. For part (b), count how far the data travels in an echo check.', visual: note(kw('more to send') + ' = more time') },
  { text: '<strong>Who decides?</strong> A different case: you lend a friend a book. Later your friend gives you a book. Is it yours?', visual: stmt('You lend: a clean book') + stmt('You get: a book with a torn page') },
  { text: 'Only you remember your own book. For part (c), ask: in an echo check, who still holds the data as it was at the start?', visual: note('who remembers it?') },
] };

// ---------------------------------------------------------------- Do Now and its extension
// 0478/11 November 2025 Q2(b)(i) router; Q2(b)(ii) (packet) header. Part (c) is not from the paper.
steps.push(checkStep('do-now', 'Do Now: Packets (1 of 2)', 'Do Now: Packets (1 of 2)',
  'From 2.1 L1. Parts (a) and (b): ' + cite('0478/11, November 2025, Question 2(b)(i) and (ii)') + ' An employee sends images of houses to his company. The image data is broken down into packets to be sent across a network to the company. The destination internet protocol (IP) address is read by a device in the network. The device uses the IP address to forward the packet towards its correct destination.', [
    { label: 'State the name of the device that reads the destination IP address.', answer: '^\\s*(an?\\s+|the\\s+)?routers?\\s*\\.?\\s*$',
      feedback: 'Which device picks the route for each packet?' },
    { label: 'Identify the part of the packet where the destination IP address is found.', answer: '^\\s*(in\\s+)?(the\\s+|a\\s+)?(packet\\s+)?header\\s*\\.?\\s*$',
      feedback: 'Which part of the packet is read first?' },
    { line: true, label: 'Why does every packet need the destination IP address, not just the first packet?',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(different\\s+(routes?|ways?|paths?)|own\\s+(route|way|path)|separate\\w*|independent\\w*|on\\s+(its|their)\\s+own|alone|individual\\w*)\\b)(?=.*\\b(routers?|where|forward\\w*|next|destination|direct\\w*|reach\\w*|deliver\\w*|send\\s+it)\\b).*$',
      feedback: 'Two ideas: how do the packets travel, and what must each router know?' },
  ], ['Why does sending an image as many small packets help if one is lost?', 'Only the lost packet is sent again, not the whole image. That saves time on the network.']));
steps[steps.length - 1].walkthrough = WT_PACKETS;

// 0478/11 November 2025 Q2(d), which asks for an annotated diagram. Mark scheme (any three): data is sent to the
// receiver and a copy is sent back from the receiver to the sender; the sending device compares the original data and
// the copy; if they do not match an error is detected. Parts (b) and (c) are not from the paper.
steps.push(checkStep('do-now-2', 'Do Now: Echo Check (2 of 2)', 'Do Now: Echo Check (2 of 2)',
  'From 2.2 L3. Part (a): adapted from ' + cite('0478/11, November 2025, Question 2(d)') + ' An echo check is used to check for errors after the image has been transmitted.', [
    { line: true, marks: 3, label: 'Describe how the echo check would detect any errors.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(back|return\\w*|bounc\\w*|echo\\w*)\\b)(?=.*\\b(compar\\w*|match\\w*|same|check\\w*)\\b)(?=.*\\b(errors?|wrong|differ\\w*|mismatch\\w*|not\\s+(the\\s+)?same|do\\w*\\s*n.?t\\s+match|not\\s+match\\w*)\\b).*$',
      feedback: 'Three steps: where the copy goes, what the sender does with it, and how it decides.' },
    { line: true, label: 'Why does an echo check make sending data slower?',
      answer: '^(?=.*\\b(twice|two\\s+times|both\\s+ways|doubl\\w*|back|again|return\\w*|two\\s+trips?|second\\s+time)\\b)(?=.*\\b(sent|send\\w*|travel\\w*|trips?|journey\\w*|transmi\\w*|goes|go|moves?|data|copy)\\b).*$',
      feedback: 'How many times does the data cross the network?' },
    { line: true, label: 'Why is the copy sent back to the sender, not checked by the receiver?',
      answer: '^(?=.*\\b(original|first\\s+copy|kept|keeps|has\\s+the|still\\s+has|own\\s+copy|knows\\s+what|only\\s+the\\s+sender)\\b)(?=.*\\b(compar\\w*|check\\w*|match\\w*|same|see\\s+if)\\b).*$',
      feedback: 'Who still has the data as it was before it was sent?' },
  ], ['Why check an image after it is sent at all?', 'Interference can change bits on the way. A changed bit can spoil part of the picture.']));
steps[steps.length - 1].walkthrough = WT_ECHO;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-3-l1-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 2.1 Data Transmission and 2.2 Methods of Error Detection. Stuck? Switch on <strong>I need help</strong>.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Symmetric Encryption',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.3 Encryption</p><h2 class="lesson-h2">Symmetric Encryption</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> why data is <strong>encrypted</strong> when it is sent, and how one <strong>shared key</strong> locks and unlocks it.', '<strong>You already know:</strong> packets, routers and the error checks. They make sure data <strong>arrives</strong> without errors.']) +
    why('Every packet arrives, and every error check passes. Why might the data still not be safe?', 'The packets passed through many devices on the way. Someone could have copied and read them. An error check cannot tell.') });

// ---------------------------------------------------------------- concept 1: interception
const route = flow(pill("Ana's computer"), pill('Router'), pill('Router'), pill("Ben's computer"));
steps.push({ id: 'concept-intercept', label: 'Data Can Be Intercepted',
  content: '<h2 class="lesson-h2">Data Can Be Intercepted</h2>' +
    tps('Predict: Ana sends Ben a message. Every packet arrives with no errors. Could anyone else have read it? Why?',
      '<p><strong>Yes.</strong> The packets passed through routers and cables that Ana does not own. Anyone with access to them could copy the packets on the way.</p><p>This is <strong>interception</strong>. The packets still arrive, so Ana and Ben cannot tell.</p>', 'Show the worked answer') +
    columns(facts(['Packets pass through many devices on the way: routers, cables, Wi-Fi.', 'Someone on the route can <strong>intercept</strong> the data: copy it and read it.', 'Error checks find <strong>changed</strong> data. They cannot tell if data was <strong>read</strong>.', '<strong>Encryption</strong> does not stop interception. It makes intercepted data <strong>meaningless</strong>.']),
      '<div style="display:grid;gap:12px;text-align:center">' + route +
      `<div>${pill('Eve copies every packet on the way', 'bad')}</div>` +
      `<div>${pill('Ben: all packets arrived, no errors', 'good')}</div></div>`) });

// ---------------------------------------------------------------- the words: plain text, key, cipher text
const MSG = 'MEET AT TEN', MSG_K = 3, MSG_C = sh(MSG, MSG_K);
steps.push({ id: 'concept-encrypt', label: 'Plain Text, Key and Cipher Text',
  content: '<h2 class="lesson-h2">Plain Text, Key and Cipher Text</h2>' +
    tps(`Predict: every letter of ${MSG} moves 3 places along the alphabet. Eve intercepts the result. Why can she not understand it?`,
      `<p>She sees <strong>${MSG_C}</strong>. It is <strong>meaningless</strong> to her.</p><p>To read it she must know <strong>how far</strong> each letter moved. That number is the <strong>key</strong>, and she does not have it.</p>`, 'Show the worked answer') +
    columns(facts(['<strong>Plain text</strong>: the data before it is encrypted.', 'The <strong>encryption algorithm</strong> uses a <strong>key</strong> to scramble the plain text.', '<strong>Cipher text</strong>: the encrypted data. It is meaningless without the key.', '<strong>Decrypt</strong>: turn cipher text back into plain text.']),
      '<div style="display:grid;gap:10px">' + mapTable(MSG, MSG_K) +
      `<p style="margin:0;text-align:center;font-size:16px">Algorithm: move each letter forward along the alphabet.<br>Key: <strong>${MSG_K}</strong>. After Z, carry on from A.</p></div>`) });

// 0478/12 March 2024 Q7(a)(i). Mark scheme: if the data is intercepted, it cannot be understood.
// 0478/12 June 2026 Q4(c)(iii). Mark scheme: cipher / cypher text (BOD cipher alone, cipher data). Part (c) is not from a paper.
steps.push(checkStep('exam-purpose', 'Exam Question: Why Encrypt?', 'Exam Question: Why Encrypt?',
  'Part (a): ' + cite('0478/12, March 2024, Question 7(a)(i)') + ' Data is transmitted using the internet. The data is encrypted before transmission. Part (b): ' + cite('0478/12, June 2026, Question 4(c)(iii)'), [
    { line: true, label: 'State the purpose of encrypting data.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(intercept\\w*|stolen|steal\\w*|hack\\w*|access\\w*|someone|anyone|unauthori[sz]ed|attackers?|eve|copied|read\\s+by)\\b)(?=.*\\b(cannot|can.?t|unable|meaningless|unreadable|scrambl\\w*|nonsense|useless|not\\s+(be\\s+)?(understood|read\\w*|understandable|used)|no\\s+sense)\\b).*$',
      feedback: 'Two ideas: what could happen to the data on the way, and what encryption does about it.' },
    { label: 'State the name given to the encrypted data.', answer: '^\\s*(the\\s+)?(ciph|cyph)er\\s*-?\\s*(text|data)?\\s*\\.?\\s*$',
      feedback: 'Plain text goes in. What comes out?' },
    { line: true, label: 'Why is it safe to send cipher text, even if it is intercepted?',
      answer: '^(?=.*\\b(meaningless|cannot|can.?t|unable|unreadable|scrambl\\w*|nonsense|useless|not\\s+understand\\w*|no\\s+sense)\\b)(?=.*\\b(keys?|decrypt\\w*)\\b).*$',
      feedback: 'What does Eve need to turn it back into plain text?' },
  ], ['Why does the mark scheme ask what happens IF the data is intercepted?', 'Encryption does not stop the data being copied. So think about what a copy is worth to the person who took it.']));

// ---------------------------------------------------------------- concept: symmetric, one shared key
steps.push({ id: 'concept-symmetric', label: 'Symmetric Encryption: One Shared Key',
  content: '<h2 class="lesson-h2">Symmetric Encryption: One Shared Key</h2>' +
    tps(`Predict: Ben receives ${MSG_C}. He knows the key is 3. How does he get the message back? Why does that work?`,
      `<p>He moves each letter <strong>back</strong> 3 places: P to M, H to E, W to T. He reads <strong>${MSG}</strong>.</p><p>Moving back 3 undoes moving forward 3. The <strong>same key</strong> that encrypted the message decrypts it.</p>`, 'Show the worked answer') +
    columns(facts(['In <strong>symmetric</strong> encryption, the <strong>same key</strong> encrypts and decrypts.', 'The sender and the receiver both have this key. It is a <strong>shared</strong> key.', 'Encrypt: move forward by the key. Decrypt: move back by the same key.', 'Everyone can know the algorithm. Only the <strong>key</strong> is kept secret.']),
      '<div style="display:grid;gap:10px">' + mapTable(MSG_C, MSG_K, ['Cipher text', 'Plain text'], -1) +
      flow(pill('Ana: key 3', 'brand'), pill('cipher text'), pill('Ben: key 3', 'brand')) +
      '<p style="margin:0;text-align:center;font-size:16px"><strong>Same key</strong> at both ends.</p></div>') });

// ---------------------------------------------------------------- compare: the right key and the wrong key
const KC = sh('HELLO', 3), BEN_K = 3, EVE_K = 5;
const keyCol = (who, k, verdict, tone) => `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)"><p style="margin:0 0 8px;text-align:center"><strong>${who}: key ${k}</strong></p>` +
  mapTable(KC, k, ['Cipher text', 'Result'], -1) + `<p style="margin:8px 0 0;text-align:center">${pill(verdict, tone)}</p></div>`;
steps.push({ id: 'compare-key', label: 'Compare: The Right Key and the Wrong Key',
  content: '<h2 class="lesson-h2">Compare: The Right Key and the Wrong Key</h2>' +
    tps(`Ben and Eve both get ${KC}. Ben has the key, 3. Eve knows the algorithm and guesses 5. Predict what each one reads. Why?`,
      `<p>Ben reads <strong>${sh(KC, -BEN_K)}</strong>. Eve gets <strong>${sh(KC, -EVE_K)}</strong>: meaningless.</p><p>Knowing the algorithm is not enough. Only the right key undoes the shift.</p>`) +
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">' +
    keyCol('Ben', BEN_K, 'The message', 'good') + keyCol('Eve', EVE_K, 'Meaningless', 'bad') + '</div>' +
    facts(['Same algorithm, different key: a different result.', 'Only the key used to encrypt gives back the plain text.']) });

// ---------------------------------------------------------------- check: encrypt and decrypt
const C1 = ['DOG', 4], C2 = ['DATA', 1], C3 = ['SAFE', 3];
steps.push(checkStep('check-shift', 'Check: Encrypt and Decrypt', 'Check: Encrypt and Decrypt', 'Use the alphabet. After Z, carry on from A.', [
  { label: `Encrypt ${C1[0]} with the key ${C1[1]}.`, answer: `^\\s*${sh(C1[0], C1[1])}\\s*\\.?\\s*$`, feedback: 'Move each letter forward by the key.' },
  { label: `Decrypt ${sh(C2[0], C2[1])} with the key ${C2[1]}.`, answer: `^\\s*${C2[0]}\\s*\\.?\\s*$`, feedback: 'Move each letter back by the key.' },
  { label: `The plain text ${C3[0]} became the cipher text ${sh(C3[0], C3[1])}. What was the key?`, answer: `^\\s*(the\\s+)?(key\\s*(is|[:=])?\\s*)?(${C3[1]}|three)\\s*\\.?\\s*$`, feedback: 'Count how far the first letter moved.' },
], ['Why must Ben move back by exactly the key, not a number close to it?', 'Any other number gives different letters. Only the same key undoes the shift.'], alphabet()));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Encrypt, Decrypt, Crack', 'drill-y10-2-3-l1-shift', 'Activity 1: Encrypt, Decrypt, Crack',
  'Encrypt and decrypt with the key. Then be Eve: no key, only cipher text. New words and keys every time. Stuck? Switch on <strong>I need help</strong>.',
  ['Ben decrypts with the key and gets the message back every time. Why does moving back by the key always work?', 'Encrypting moved every letter forward by the key. Moving back by the same number undoes each move exactly.']));

// ---------------------------------------------------------------- compare: 25 keys and a 128-bit key
const BIG = 2n ** 128n, PER_YEAR = 1000000000n * 31557600n, YEARS = BIG / PER_YEAR;
const spaced = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const lenCol = (title, rows, verdict, tone) => `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)"><p style="margin:0 0 6px;text-align:center"><strong>${title}</strong></p>` +
  `<p style="margin:0;font-size:17px;line-height:1.6">${rows.join('<br>')}</p><p style="margin:8px 0 0;text-align:center">${pill(verdict, tone)}</p></div>`;
steps.push({ id: 'compare-length', label: 'Compare: 25 Keys and a 128-Bit Key',
  content: '<h2 class="lesson-h2">Compare: 25 Keys and a 128-Bit Key</h2>' +
    tps('Eve has no key, so she tries every key. Predict: why does that work on the letter shift, but not on a key 128 bits long?',
      '<p>The letter shift has only <strong>25</strong> keys. A computer tries them all in under a second.</p><p>A 128-bit key has 2<sup>128</sup> possible keys. Trying them all would take far longer than anyone could wait.</p>') +
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">' +
    lenCol('Letter shift', ['Possible keys: <strong>25</strong>', 'At a billion tries a second:', '<strong>under a second</strong>'], 'Cracked', 'bad') +
    lenCol('128-bit key', [`Possible keys: ${mono(spaced(BIG))}`, 'At a billion tries a second:', `<strong>more than ${spaced(10n ** BigInt(String(YEARS).length - 1))} years</strong>`], 'Safe', 'good') + '</div>' +
    facts(['Each extra bit in the key <strong>doubles</strong> the number of possible keys: 1 bit 2 keys, 2 bits 4, 8 bits 256.', 'More possible keys means more to try, so a <strong>longer key</strong> is harder to crack.']) });

// 0478/13 June 2026 Q2(e)(ii). Mark scheme (any two): a string of characters / numbers used to encrypt data; used by
// an algorithm / cipher (to encrypt / decrypt the data); accept "it is an algorithm / cipher".
// 0478/12 June 2026 Q4(c)(i). Mark scheme (one from): symmetric // synchronous; asymmetric // asynchronous.
steps.push(checkStep('exam-key', 'Exam Question: The Encryption Key', 'Exam Question: The Encryption Key',
  'Part (a): ' + cite('0478/13, June 2026, Question 2(e)(ii)') + ' All data that is transmitted across the network is encrypted before transmission. Part (b): ' + cite('0478/12, June 2026, Question 4(c)(i)') + ' The data that is transmitted is encrypted.', [
    { line: true, marks: 2, label: 'Describe what is meant by an encryption key.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(strings?|characters?|numbers?|values?|digits?|bits?|binary|letters?|algorithms?|ciphers?|codes?)\\b)(?=.*\\b(encrypt\\w*|decrypt\\w*|scrambl\\w*|unscrambl\\w*|cipher\\s*text|plain\\s*text)\\b).*$',
      feedback: 'Two ideas: what a key is made of, and what it is used for.' },
    { label: 'Give one method of encryption that could be used.', answer: '^\\s*(symmetric|asymmetric|synchronous|asynchronous)(\\s+(key\\s+)?(encryption|method))?\\s*\\.?\\s*$',
      feedback: 'Name the kind of encryption that uses one shared key.' },
  ], ['Why is the key kept secret, but not the algorithm?', 'Without the key, knowing the algorithm does not help: you would still have to try every key.']));

// ---------------------------------------------------------------- activity 2: class messages (ClassMessages app)
// Students send each other real messages as packets (James, 2026-10-21): encrypt with a key, then the packets carry
// the cipher text AND the key, the hook for the weak point on the next slide. The receiver puts the packets back in
// order by packet number (2.1) before decrypting. Messages.gs keeps a plain text safety copy for the teacher.
steps.push(embed('activity-send', 'Activity 2: Send a Secret Message', 'class-messages-symmetric', 'Activity 2: Send a Secret Message',
  'Write a message and encrypt it with a key. Then send it to someone in your class.',
  ['Eve copies every packet on the way. Which one does she want most? Why?', 'The packet with the key. With the key and the cipher text, she can decrypt the whole message.']));
steps[steps.length - 1].embedQuery = 'view=send';
steps.push(embed('activity-read', 'Activity 2: Read Your Messages', 'class-messages-symmetric', 'Activity 2: Read Your Messages',
  'Put the packets in order by packet number. Then decrypt the message with the key.',
  ['Why must the packets go back in order before you decrypt?', 'Each payload is one part of the cipher text. In the wrong order the letters are mixed up, so decrypting gives nonsense.']));
steps[steps.length - 1].embedQuery = 'view=inbox';

// ---------------------------------------------------------------- concept 2: the weak point is sharing the key
steps.push({ id: 'concept-sharing', label: 'The Weak Point: Sharing the Key',
  content: '<h2 class="lesson-h2">The Weak Point: Sharing the Key</h2>' +
    tps('Predict: Ben needs the key before he can decrypt. Ana emails it to him. Eve intercepts that email. What can Eve now do? Why?',
      '<p>Eve can <strong>decrypt</strong> every message that uses that key. Symmetric encryption uses the same key to encrypt and decrypt, so whoever has the key can read the data.</p>', 'Show the worked answer') +
    columns(facts(['Both people need the <strong>same key</strong> before any message is sent.', 'A key sent across a network can be <strong>intercepted</strong>, like any other data.', 'Anyone with the key can decrypt the cipher text.', 'So the hard part is <strong>sharing the key safely</strong>.', 'Next lesson: a method where the key that decrypts is never sent.']),
      '<div style="display:grid;gap:12px;text-align:center">' + flow(pill('Ana'), pill('cipher text') + ' ' + pill('key 3', 'brand'), pill('Ben')) +
      `<div>${pill('Eve intercepts both', 'bad')}</div>` + flow(pill('cipher text'), pill('key 3', 'brand'), pill('the message', 'bad')) + '</div>') });

// ---------------------------------------------------------------- compare: key sent with the data, key agreed first
const shareCol = (title, rows, verdict, tone) => `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)"><p style="margin:0 0 6px;text-align:center"><strong>${title}</strong></p>` +
  `<p style="margin:0;font-size:17px;line-height:1.6">${rows.join('<br>')}</p><p style="margin:8px 0 0;text-align:center">${pill(verdict, tone)}</p></div>`;
steps.push({ id: 'compare-sharing', label: 'Compare: Key Sent and Key Agreed First',
  content: '<h2 class="lesson-h2">Compare: Key Sent and Key Agreed First</h2>' +
    tps('Ana sends the same cipher text both times. Predict: in which case can Eve read the message? Why?',
      '<p>Left: Eve has the cipher text <strong>and</strong> the key, so she can decrypt it.</p><p>Right: Eve has only the cipher text. Without the key it stays meaningless.</p>') +
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">' +
    shareCol('Key sent in the same email', ['Ana emails the cipher text and the key.', 'Eve intercepts: <strong>cipher text + key</strong>', 'She moves each letter back by the key.'], 'Eve reads it', 'bad') +
    shareCol('Key agreed in person first', ['Ana and Ben met last week and agreed the key.', 'Eve intercepts: <strong>cipher text only</strong>', 'She has no key to undo the shift.'], 'Meaningless to Eve', 'good') + '</div>' +
    facts(['The encryption was the same both times. Only the <strong>key sharing</strong> was different.']) });

// 0478/11 November 2025 Q2(e)(i). Mark scheme: C.
steps.push(mcStep('exam-mc', 'Exam Question: Which Statement Is Correct?', 'Exam Question: Which Statement Is Correct?', 'Choose one answer for each.', [
  { prompt: cite('0478/11, November 2025, Question 2(e)(i)') + ' The image data is encrypted using symmetric encryption. Which is the correct statement about symmetric encryption?',
    options: ['Encrypted text is known as plain text.', 'The most secure form of encryption.', 'The encryption key is shared with any device receiving the encrypted data.', 'Two different keys are used.'], correct: 2,
    explain: 'The receiver decrypts with the same key, so it must be shared. Encrypted text is cipher text, and one key is used, not two.' },
  { prompt: 'Eve intercepts cipher text made with symmetric encryption. She knows the algorithm. What else does she need to read it?',
    options: ['The key used to encrypt it', 'The packet numbers', "The receiver's IP address", 'A faster connection'], correct: 0,
    explain: 'The same key encrypts and decrypts. With the key, she can turn the cipher text back into plain text.' },
], ['Why does encryption not stop Eve copying the packets?', 'The packets still pass through routers and cables she can reach. Encryption changes what the data looks like, not where it goes.']));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 3: Who Can Read It?', 'drill-y10-2-3-l1-sharing', 'Activity 3: Who Can Read It?',
  'Read how Ana shares the key and what Eve intercepts. Can Eve read the message? Then explain why, and find the safest way to share the key.',
  ['Why does Eve need BOTH the cipher text and the key?', 'The cipher text alone is meaningless. The key alone has nothing to unlock.']));

// 0478/12 June 2024 Q2(c)(i) and (ii). Mark scheme as below.
// Split over two slides so each fits 1366x768 without scrolling.
steps.push(selfMarked('exam-describe', 'Exam Question: How Symmetric Encryption Works (1 of 2)', 'Exam Question: How Symmetric Encryption Works (1 of 2)',
  cite('0478/12, June 2024, Question 2(c)(i)') + ' Data is often encrypted when it is transmitted from one device to another.', [
    { id: 'symmetric-explain', prompt: '(i) Explain how data is encrypted using symmetric encryption. [4]', marks: 4,
      modelAnswer: 'One mark: data is encrypted and decrypted using the same key. Then any three from: plain text is encrypted into cipher text, or cipher text is decrypted into plain text; data is encrypted using an algorithm that uses a key; the key can be generated using an algorithm; the key is transmitted to the receiver.' },
  ], ['Part (i) has 4 marks. What happens at the sender, and what happens at the receiver?', 'Each mark is one step or one fact. Start at the sender, follow the data to the receiver, and say what each one needs.']));
steps.push(selfMarked('exam-describe-2', 'Exam Question: How Symmetric Encryption Works (2 of 2)', 'Exam Question: How Symmetric Encryption Works (2 of 2)',
  cite('0478/12, June 2024, Question 2(c)(ii)') + ' Data is often encrypted when it is transmitted from one device to another.', [
    { id: 'encryption-purpose', prompt: '(ii) Give the purpose of encryption. [1]', marks: 1,
      modelAnswer: 'Any one from: to help keep the data secure; to make the data meaningless (if it is intercepted).' },
  ], ['Why is "to stop hackers" not the best answer here?', 'Encryption cannot stop anyone copying the data. Say what it does for data that is copied.']));

// ---------------------------------------------------------------- checked practice
// 0478/11 November 2022 Q4(b)(i). Mark scheme: the data will be meaningless if it is stolen. Parts (b) to (d) are not
// from the paper.
const PR = ['WIN', 3];
steps.push(checkStep('practice', 'Practice: Symmetric Encryption', 'Practice: Symmetric Encryption',
  'Part (a): ' + cite('0478/11, November 2022, Question 4(b)(i)') + ' Rebekah decides to encrypt the data that she transmits whilst using the Internet. She does this to keep the data safe.', [
    { line: true, label: 'State why encryption helps keep the data safe.',
      answer: '^(?!\\s*(no|not)\\b)(?=.*\\b(meaningless|cannot|can.?t|unable|unreadable|scrambl\\w*|nonsense|useless|not\\s+understand\\w*)\\b)(?=.*\\b(stolen|steal\\w*|intercept\\w*|hack\\w*|someone|anyone|attackers?|access\\w*|copied|without\\s+the\\s+key)\\b).*$',
      feedback: 'Two ideas: what could happen to the data, and what it looks like to that person.' },
    { label: `Rebekah receives ${sh(PR[0], PR[1])}. The key is ${PR[1]}. Decrypt it.`, answer: `^\\s*${PR[0]}\\s*\\.?\\s*$`, feedback: 'Move each letter back by the key.' },
    { line: true, label: 'Rebekah sends the key in the same message as the cipher text. Why is the data no longer safe?',
      answer: '^(?=.*\\b(intercept\\w*|stolen|steal\\w*|caught|copied|gets?|has|have|finds?|hack\\w*|sees?|takes?)\\b)(?=.*\\b(decrypt\\w*|read\\w*|unlock\\w*|undo\\w*|understand\\w*|plain\\s*text|message)\\b)(?=.*\\b(key|both)\\b).*$',
      feedback: 'Two ideas: what an attacker would get, and what they could then do.' },
    { line: true, label: 'Why does a longer key make the cipher text harder to crack?',
      answer: '^(?=.*\\b(more|many|lots|huge|billions?|combinations?|possib\\w*|options?|doubl\\w*)\\b)(?=.*\\b(try|trying|tried|tries|guess\\w*|check\\w*|test\\w*|long|longer|time|years|forever|ages)\\b).*$',
      feedback: 'Two ideas: what a longer key does to the number of keys, and what that means for an attacker.' },
  ], ['Why is a system only as safe as its weakest part?', 'Someone trying to read the data uses the easiest way in. Strong encryption does not help if another part is easy to get past.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Symmetric Encryption Drill', 'drill-y10-2-3-l1', 'Plenary: Symmetric Encryption Drill',
  'Why data is encrypted, the words, encrypting and decrypting, and why sharing the key is the weak point. Your progress is saved.',
  ['Why practise with new words and keys every time?', 'If you can encrypt and decrypt any word, you really understand how the key works.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
assert(MSG_C === 'PHHW DW WHQ' && KC === 'KHOOR' && sh(KC, -5) === 'FCJJM', 'shift examples');
assert(sh('DOG', 4) === 'HSK' && sh('DATA', 1) === 'EBUB' && sh('SAFE', 3) === 'VDIH' && sh('WIN', 3) === 'ZLQ', 'check and practice values');
assert(BIG === 340282366920938463463374607431768211456n && YEARS > 10n ** 22n && YEARS < 10n ** 23n, '128-bit numbers');
ok('do-now', 0, ['router', 'A router', 'routers'], ['switch', 'modem', 'route']);
ok('do-now', 1, ['header', 'the header', 'packet header', 'in the header'], ['payload', 'trailer', 'head']);
ok('do-now', 2, ['each packet takes a different route so every router needs to know where to send it', 'packets travel separately so each one needs the destination', 'they go on their own so the router must know where it is going'],
  ['so it arrives', 'because it is needed', 'every packet is sent', 'packets take different routes']);
ok('do-now-2', 0, ['the receiver sends a copy back and the sender compares it, if they do not match there is an error', 'data is sent back to the sender, it checks it is the same as the original, if different an error'],
  ['it sends the data back', 'the sender compares the data', 'it checks for errors']);
ok('do-now-2', 1, ['the data is sent twice', 'it has to travel back as well', 'the data goes both ways'], ['it is slow', 'because of errors', 'more checks']);
ok('do-now-2', 2, ['the sender has the original data to compare with', 'only the sender knows what the data was so it can check', 'the sender kept the original so it can see if they match'], ['to check for errors', 'the receiver is busy', 'it is faster']);
ok('exam-purpose', 0, ['if the data is intercepted it cannot be understood', 'so anyone who steals it cannot read it', 'to make the data meaningless to a hacker'], ['to keep it safe', 'to stop interception', 'to make the data meaningless', 'not sure']);
ok('exam-purpose', 1, ['cipher text', 'Cypher text', 'ciphertext', 'cipher', 'cipher data'], ['plain text', 'key', 'encrypted text']);
ok('exam-purpose', 2, ['it is meaningless without the key', 'they cannot read it because they do not have the key', 'you cannot decrypt it'], ['it is encrypted', 'it is meaningless', 'the key']);
ok('check-shift', 0, ['HSK', 'hsk'], ['ZKC', 'GRJ', 'DOG']);
ok('check-shift', 1, ['DATA', 'data'], ['EBUB', 'FCVC']);
ok('check-shift', 2, ['3', 'key 3', 'three'], ['4', '23', '13']);
ok('exam-key', 0, ['a string of characters used to encrypt the data', 'a number used by the algorithm to encrypt and decrypt', 'a value that scrambles plain text into cipher text'], ['it encrypts data', 'a password', 'a string of characters']);
ok('exam-key', 1, ['symmetric', 'Symmetric encryption', 'asymmetric'], ['key', 'SSL', 'HTTPS', 'encryption']);
ok('practice', 0, ['the data will be meaningless if it is stolen', 'if someone intercepts it they cannot understand it', 'a hacker cannot read it'], ['it is safe', 'it is meaningless', 'it stops hackers']);
ok('practice', 1, ['WIN', 'win'], ['ZLQ', 'COT']);
ok('practice', 2, ['someone who intercepts it has the key and can decrypt it', 'a hacker gets both and can read the message', 'if it is stolen they have the key so they can decrypt'], ['it is not safe', 'the key is wrong', 'it can be intercepted']);
ok('practice', 3, ['there are more possible keys so it takes longer to try them all', 'there are billions of combinations to guess', 'it doubles the number of keys so it takes much more time'], ['it is longer', 'it is more secure', 'more keys']);
// Every walkthrough step, as plain text (alone, and with its picture), must fail every part on its Do Now slide.
{
  const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  steps.filter((s) => /^do-now(-\d)?$/.test(s.id)).forEach((s) => {
    assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
    V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
      [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abc'[i]}: ${plain(part)}`));
    }));
  });
  assert(!/\brouters?\b|\bheader\b/i.test(plain(JSON.stringify(WT_PACKETS))), 'packets walkthrough names a Do Now answer');
  assert(!/\b(back|twice|return|original)\b/i.test(plain(JSON.stringify(WT_ECHO))), 'echo walkthrough gives a Do Now answer');
}
// No term before the slide that teaches it (the title slide only names today's topic).
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  const teach = [[/intercept/i, 'concept-intercept'], [/encrypt|decrypt/i, 'concept-intercept'], [/plain\s*text|cipher\s*text|\bkeys?\b|algorithm/i, 'concept-encrypt'],
    [/symmetric/i, 'concept-symmetric'], [/\bshared\b|sharing|share (the|a) key/i, 'concept-symmetric'], [/128|-bit key/i, 'compare-length'], [/asymmetric|public key|private key/i, null]];
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? V(s.id).map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => assert(!rx.test(text) || (from && i >= at(from)), `${s.id} uses ${rx} before ${from}`));
  });
}

// ---------------------------------------------------------------- drills
// Each drill's cards are a self-contained function, written out as source into Drills/data/<id>.js.
const drillHead = (id, about) => `// Year 10, 2.3 L1: Symmetric Encryption. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y10_2_3_l1.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()})()\n});\n`;

// ---- Do Now Extension: Topic 2 so far (2.1 and 2.2). Every card has an example on different details and two nudges.
function extCards() {
  function rnd(n) { return Math.floor(Math.random() * n); }
  function word(w) { return new RegExp("^\\s*(the\\s+|a\\s+|an\\s+)?" + w + "\\s*\\.?\\s*$", "i"); }
  function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
  function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
  function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
  function sum(a) { return a.reduce(function (t, v) { return t + v; }, 0); }
  function values(n) { var a = []; for (var i = 0; i < n; i++) a.push(10 + rnd(50)); return a; }
  function digits(n) { var s = ""; for (var i = 0; i < n; i++) s += String(rnd(10)); return s; }
  return [
    // ------------------------------------------------ Data Transmission (2.1)
    { id: "ex-01", category: "ex-trans", prompt: "Packets from one file can take different routes. Why does each packet carry a packet number?", answers: ["So the packets can be put back in the right order"],
      keywords: [/^(?=.*\b(order\w*|sequence\w*|reassembl\w*|put\s+(them\s+)?(back\s+)?together|rebuil\w*|re-?order\w*|arrange\w*)\b).*$/i],
      distractors: ["So the router knows where to send it", "So errors can be corrected", "So the file is smaller"],
      example: "Example question: why does each packet carry the destination address?\nStep 1: each packet travels on its own, maybe by a different route.\nStep 2: every router on the way must decide where to send that packet next.\nStep 3: so every packet needs the address, not just the first one.\nNow your question: packets on different routes arrive at different times. What must the receiver do with them to rebuild the file?",
      working: ["Packets can arrive in a different order from the one they were sent in.", "The receiver uses the numbers to rebuild the file. What do the numbers tell it?"],
      note: "The packet numbers let the receiver put the packets back in the right order." },
    { id: "ex-02", category: "ex-trans", randomize: function () {
        var s = drillPick([["Data is sent to a printer in another building, 200 metres away.", "Serial"], ["Data is sent from the processor to memory, a few centimetres away, as fast as possible.", "Parallel"]]);
        return { prompt: s[0] + " Should it use serial or parallel transmission?", answers: [s[1]], keywords: [word(s[1].toLowerCase())],
          distractors: [s[1] === "Serial" ? "Parallel" : "Serial"],
          example: "Example: data is sent down a cable 1 km long.\nStep 1: one method sends several bits at once, down several wires.\nStep 2: over a long cable, bits on different wires arrive at slightly different times (skew), so the data can be wrong.\nStep 3: the other method sends one bit at a time down one wire, so the bits stay in order.\nRule: long distance = one bit at a time. Very short distance and very fast = several bits at once.",
          working: ["Is the distance long or very short?", "Over a long cable, bits sent side by side can arrive at different times."],
          note: s[1] + ". " + (s[1] === "Serial" ? "Over a long distance, one bit at a time keeps the bits in order: no skew." : "Over a very short distance, several bits at once is fastest.") };
      } },
    { id: "ex-03", category: "ex-trans", randomize: function () {
        var s = drillPick([["A webcam sends video to a computer. The computer never sends data back to the webcam.", "Simplex"],
          ["Two computers send files to each other, and both can send at the same moment.", "Full-duplex"],
          ["A computer sends a document to a printer. The printer can reply, but only when the computer has stopped sending.", "Half-duplex"]]);
        var rx = { "Simplex": /^\s*simplex\s*\.?\s*$/i, "Half-duplex": /^\s*half[\s-]*duplex\s*\.?\s*$/i, "Full-duplex": /^\s*full[\s-]*duplex\s*\.?\s*$/i };
        return { prompt: s[0] + " Simplex, half-duplex or full-duplex?", answers: [s[1]], keywords: [rx[s[1]]],
          distractors: ["Simplex", "Half-duplex", "Full-duplex"].filter(function (x) { return x !== s[1]; }),
          example: "Example: a radio station sends music to radios, and the radios never send anything back. Then: two people on a video call, both talking at once. Then: a walkie-talkie, where only one person can talk at a time.\nStep 1: ask: does data go both ways? The radio: no.\nStep 2: if it does go both ways, ask: can both send at the same moment? The video call: yes. The walkie-talkie: no, they take turns.\nRule: one way only, both ways taking turns, or both ways at the same time.",
          working: ["Does data ever travel back the other way?", "If it does, can both sides send at the same moment?"],
          note: s[1] + "." };
      } },
    { id: "ex-04", category: "ex-trans", prompt: "Why does a USB device work as soon as it is plugged in, without the user setting it up?", answers: ["The computer detects it automatically and loads its driver"],
      keywords: [/^(?=.*\b(automatic\w*|detect\w*|recogni[sz]\w*|identif\w*|finds?|knows?)\b).*$/i],
      distractors: ["USB sends data in parallel", "USB cables are very short", "The device has no driver"],
      example: "Example question: why can a USB cable charge a phone?\nStep 1: think about what travels down a USB cable.\nStep 2: a USB cable carries power as well as data.\nStep 3: so the phone charges from the computer through the same cable.\nNow your question: think about what the computer does the moment a new USB device is connected, and what software that device needs.",
      working: ["The user does nothing, so the computer must notice the device by itself.", "Every device needs software (a driver) to work. Who finds and loads it?"],
      note: "USB is a standard: the computer detects the device automatically and loads the right driver." },
    // ------------------------------------------------ Methods of Error Detection (2.2)
    { id: "ex-05", category: "ex-errors", randomize: function () {
        var mode = drillPick(["even", "odd"]), d = bits(7), p = parityBit(d, mode);
        return { prompt: (mode === "even" ? "Even" : "Odd") + " parity is used. What parity bit is added to the data " + d + "?", answers: [p], keywords: [new RegExp("^\\s*" + p + "\\s*$")],
          distractors: [p === "1" ? "0" : "1"],
          example: "Example: odd parity, data 1011001.\nStep 1: count the 1s: 1, 1, 1, 1. That is 4.\nStep 2: odd parity means the total number of 1s, with the parity bit, must be odd.\nStep 3: 4 is even, so the parity bit must add one more 1, making 5.\nRule: if the count already matches the parity, the parity bit adds nothing. If it does not, the parity bit adds one more 1.",
          working: ["Count the 1s in " + d + ".", "Does that count already match " + mode + " parity?"],
          note: d + " has " + ones(d) + " ones. Parity bit " + p + " makes " + (ones(d) + Number(p)) + ", an " + mode + " number." };
      } },
    { id: "ex-06", category: "ex-errors", prompt: "A byte is sent with even parity. An error is NOT found by the parity check. Why could that happen?", answers: ["Two bits changed, so the number of 1s is still even"],
      keywords: [/^(?=.*\b(two|2|even\s+number|pair|both|swap\w*|transpos\w*|several|more\s+than\s+one|multiple)\b)(?=.*\b(still|same|unchanged|even|matches|match|fits|correct)\b).*$/i],
      distractors: ["One bit changed", "The parity bit was sent first", "The byte was sent in packets"],
      example: "Example: a byte is sent with odd parity: 10110000 (three 1s).\nStep 1: on the way, the 1 at the start becomes 0, and a 0 at the end becomes 1: 00110001.\nStep 2: count the 1s that arrived: still three.\nStep 3: three is odd, so the check says no error, but the byte is wrong.\nNow your question: think about how many bits changed, and what that did to the count of 1s.",
      working: ["Think about how many bits would have to change for the count to look right.", "If one 1 is lost and one 1 is gained, what happens to the count of 1s?"],
      note: "An even number of changed bits (for example two) leaves the count of 1s even, so the check misses it." },
    { id: "ex-07", category: "ex-errors", randomize: function () {
        var v = values(3), cs = sum(v), got = v.slice();
        if (Math.random() < 0.5) { var k = rnd(3); got[k] = got[k] + drillPick([-5, -2, 1, 3, 6]); }
        var found = sum(got) !== cs;
        return { prompt: "The checksum algorithm adds up the data values.\nData received: " + got.join(", ") + "\nChecksum received: " + cs + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
          keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
          example: "Example: data received: 33, 12, 20. Checksum received: 65.\nStep 1: the receiver uses the same algorithm: 33 + 12 + 20 = 65.\nStep 2: compare: 65 and 65 are the same.\nStep 3: the same values mean the data did not change.\nRule: same values = no error detected. Different values = error detected.",
          working: ["Recalculate: add up the data received.", "Compare your total with the checksum received."],
          note: "Recalculated: " + got.join(" + ") + " = " + sum(got) + ". Checksum received: " + cs + ". " + (found ? "Different: an error is detected." : "The same: no error is detected.") };
      } },
    { id: "ex-08", category: "ex-errors", prompt: "An echo check finds an error. Why can the sender not tell whether it happened on the way there or on the way back?", answers: ["The sender cannot see what arrived at the receiver"],
      keywords: [/^(?=.*\b(see|sees|saw|seen|know|knows|view|access|has|have|get|gets)\b)(?=.*\b(receiv\w*|arriv\w*|got|middle|other\s+end)\b).*$|^(?=.*\b(same|identical|alike|both)\b)(?=.*\b(copy|copies|result|looks?|mismatch|match|wrong|different)\b).*$/i],
      distractors: ["The data was sent in parallel", "The parity bit was wrong", "The copy came back too fast"],
      example: "Example: you post a letter to a friend, and your friend posts a photocopy back. The photocopy has a smudge.\nStep 1: the smudge could come from the trip to your friend, or from the trip back.\nStep 2: you hold your letter and the photocopy. You never see the letter your friend got.\nStep 3: so you know something went wrong, but not on which trip.\nNow your question: what does the sender hold, and what does it never get to see?",
      working: ["The sender holds two things: its own data and the copy that came back.", "What would it need to see to know which trip went wrong?"],
      note: "The sender only sees its own data and the copy. It never sees what arrived at the receiver, so both trips look the same." },
    { id: "ex-09", category: "ex-errors", prompt: "Why does automatic repeat query (ARQ) need a timeout?", answers: ["The acknowledgement may never arrive, so the sender would wait forever"],
      keywords: [/^(?=.*\b(lost|lose|loses|never|not|no|nothing|forever|ever|stuck|missing|corrupt\w*)\b)(?=.*\b(arriv\w*|receiv\w*|acknowledg\w*|ack|back|repl\w*|wait\w*|comes?|gets?|reach\w*|sent|send\w*)\b).*$/i],
      distractors: ["To make the data smaller", "To count the 1s in each byte", "To add a check digit"],
      example: "Example: you put food in an oven and wait for a bell, but the bell is broken.\nStep 1: without a timer, you could stand there waiting for a bell that never rings.\nStep 2: a timer says when to stop waiting and act.\nStep 3: so the timer stops you waiting for ever.\nNow your question: after sending a packet, what is the sender waiting for? What if it never comes?",
      working: ["After sending, the sender waits for an acknowledgement.", "What if the data, or the acknowledgement, is lost on the way?"],
      note: "If no acknowledgement arrives, the sender would wait for ever. After the timeout it sends the data again." },
    { id: "ex-10", category: "ex-errors", randomize: function () {
        var s = digits(5), d = s.split("").map(Number), t = sum(d), r = t % 10;
        var e = digits(5); while (e === s) e = digits(5);
        var ed = e.split("").map(Number), et = sum(ed);
        return { prompt: "Check digit: add up the five digits, divide by 10, and the remainder is the check digit.\nNumber: " + s + "\nWhat is the check digit?", answers: [String(r)], keywords: [drillNumberRe(r, "check\\s+digit")],
          distractors: drillWrongNumbers(r, [(r + 1) % 10, (10 - r) % 10, (r + 9) % 10, Math.floor(t / 10)], 3),
          example: "Example: number " + e + ".\nStep 1: add the digits: " + ed.join(" + ") + " = " + et + ".\nStep 2: divide by 10: " + et + " = " + Math.floor(et / 10) + " tens, remainder " + (et % 10) + ".\nStep 3: the remainder is the check digit, and it goes on the end: " + e + (et % 10) + ".",
          working: ["Add the five digits, one at a time.", "Divide the total by ten. What is left over?"],
          note: d.join(" + ") + " = " + t + ". The remainder after dividing by 10 is " + r + "." };
      } }
  ];
}

// ---- Activity 1: encrypt, decrypt, and crack without the key (the letter shift).
function shiftCards() {
  var ABC = "Alphabet: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z";
  var RULE = "Algorithm: move each letter forward along the alphabet by the key. After Z, carry on from A.";
  var WORDS = ["CAT", "DOG", "SUN", "MAP", "BOX", "CODE", "DATA", "BYTE", "FILE", "LOCK", "SAFE", "NOTE", "SEND", "SHIP", "FISH", "MILK", "GOLD", "RAIN", "PARK", "BELL"];
  var WRAP = ["ZOO", "YES", "WAX", "TOY", "ZIP", "WAVE", "YAWN", "ZERO", "VOW", "YOU"];
  function sh(w, k) { return w.replace(/[A-Z]/g, function (c) { return String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26 + 26) % 26 + 65); }); }
  function exact(s) { return new RegExp("^\\s*" + s + "\\s*\\.?\\s*$", "i"); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function other(list, not) { var w; do { w = drillPick(list); } while (w === not); return w; }
  function uniq(ans, list) { var out = []; list.forEach(function (x) { if (x !== ans && out.indexOf(x) < 0) out.push(x); }); return out.slice(0, 3); }
  function pairs(w, k) { return w.split("").map(function (c) { return c + " to " + sh(c, k); }).join(", "); }
  function worked(w, k, dir) {
    var out = sh(w, dir * k);
    return "Example: " + (dir > 0 ? "encrypt " : "decrypt ") + w + " with the key " + k + ".\nStep 1: take the first letter, " + w[0] + ". Move " + (dir > 0 ? "forward " : "back ") + k + " places: " + w[0] + " becomes " + out[0] + ".\nStep 2: do the same for every letter: " + pairs(w, dir * k) + ".\nStep 3: " + (dir > 0 ? "the cipher text is " : "the plain text is ") + out + ".\nRule: encrypt = move forward by the key. Decrypt = move back by the same key.";
  }
  return [
    { id: "sh-01", category: "sh-enc", format: "Type the letters", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 9), a = sh(w, k), e = other(WORDS, w), ek = k === 9 ? 2 : k + 1;
        return { prompt: RULE + "\n" + ABC + "\nPlain text: " + w + "\nKey: " + k + "\nWhat is the cipher text?", answers: [a], keywords: [exact(a)],
          distractors: uniq(a, [sh(w, -k), sh(w, k + 1), sh(w, k - 1)]), example: worked(e, ek, 1),
          working: ["Start with " + w[0] + ". Count " + k + " letters forward along the alphabet.", "Do the same for every letter of " + w + "."],
          note: "Each letter moves forward " + k + ": " + pairs(w, k) + "." };
      } },
    { id: "sh-02", category: "sh-enc", format: "Type the letters", randomize: function () {
        var w = drillPick(WRAP), k = rnd(3, 8), a = sh(w, k), e = other(WRAP, w), ek = k === 8 ? 4 : k + 1;
        return { prompt: RULE + "\n" + ABC + "\nPlain text: " + w + "\nKey: " + k + "\nWhat is the cipher text?", answers: [a], keywords: [exact(a)],
          distractors: uniq(a, [sh(w, -k), sh(w, k + 1), sh(w, k - 1)]), example: worked(e, ek, 1),
          working: ["Count " + k + " letters forward. When you pass Z, carry on from A.", "For example, Z moved forward 2 is B."],
          note: "Each letter moves forward " + k + ", carrying on from A after Z: " + pairs(w, k) + "." };
      } },
    { id: "sh-03", category: "sh-dec", format: "Type the letters", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 9), c = sh(w, k), e = other(WORDS, w), ek = k === 9 ? 2 : k + 1;
        return { prompt: "Symmetric encryption: the same key decrypts. Move each letter BACK by the key. Before A, carry on from Z.\n" + ABC + "\nCipher text: " + c + "\nKey: " + k + "\nWhat is the plain text?", answers: [w], keywords: [exact(w)],
          distractors: uniq(w, [sh(c, k), sh(w, 1), sh(w, -1)]), example: worked(sh(e, ek), ek, -1),
          working: ["Start with " + c[0] + ". Count " + k + " letters back along the alphabet.", "Do the same for every letter. The answer is a real word."],
          note: "Each letter moves back " + k + ": " + pairs(c, -k) + "." };
      } },
    { id: "sh-04", category: "sh-dec", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 12), c = sh(w, k), e = other(WORDS, w), ek = k > 6 ? k - 4 : k + 4, ec = sh(e, ek);
        return { prompt: RULE + "\n" + ABC + "\nPlain text: " + w + "\nCipher text: " + c + "\nWhat key was used?", answers: [String(k)], keywords: [drillNumberRe(k, "key")],
          distractors: drillWrongNumbers(k, [k + 1, k - 1, 26 - k, k + 2], 3), format: "Type a number",
          example: "Example: plain text " + e + ", cipher text " + ec + ".\nStep 1: compare the first letters: " + e[0] + " and " + ec[0] + ".\nStep 2: count the places from " + e[0] + " forward to " + ec[0] + ", carrying on from A after Z: " + ek + " places.\nStep 3: check a second letter: " + e[1] + " to " + ec[1] + " is also " + ek + " places. The key is " + ek + ".",
          working: ["Compare the first letters: " + w[0] + " and " + c[0] + ".", "Count the places forward from " + w[0] + " to " + c[0] + ". Check with a second letter."],
          note: w[0] + " to " + c[0] + " is " + k + " places forward, so the key is " + k + "." };
      } },
    { id: "sh-05", category: "sh-crack", randomize: function () {
        var w = drillPick(WORDS), k = rnd(2, 12), c = sh(w, k), keys = [k];
        while (keys.length < 4) { var g = rnd(1, 14); if (keys.indexOf(g) < 0) keys.push(g); }
        keys.sort(function (a, b) { return a - b; });
        var tries = keys.map(function (g) { return "Key " + g + ": " + sh(c, -g); }).join("\n");
        return { prompt: "Eve intercepts the cipher text " + c + ". She has no key, so she tries some keys, moving every letter back:\n" + tries + "\nWhich key was used?", answers: [String(k)], keywords: [drillNumberRe(k, "key")],
          distractors: drillWrongNumbers(k, keys, 3), format: "Type a number",
          example: "Example: Eve intercepts JRRG and tries:\nKey 1: IQQF\nKey 3: GOOD\nKey 4: FNNC\nStep 1: read each try. Only one is a real word: GOOD.\nStep 2: so the key 3 undid the shift.\nRule: without the key, Eve must try keys until a real word appears.",
          working: ["Read each line. Most are meaningless letters.", "Find the one line that is a real word."],
          note: "Key " + k + " gives " + w + ", the only real word." };
      } },
    { id: "sh-06", category: "sh-crack", prompt: "The letter shift moves every letter by the key. A key of 0 or 26 changes nothing, so it is never used. Eve has no key. At most, how many different keys must she try?", answers: ["25"],
      keywords: [/^\s*(25|twenty[\s-]*five)(\s+keys?)?\s*\.?\s*$/i], distractors: ["26", "10", "100"], format: "Type a number",
      example: "Example: a lock has a dial with the numbers 1 to 8, and only one number opens it.\nStep 1: a thief does not know the number, so they try 1, then 2, then 3, and so on.\nStep 2: the worst case is that the right number is the last one tried.\nStep 3: so at most they try 8 numbers.\nNow your question: how many keys can the letter shift use?",
      working: ["Eve tries every possible key until a real word appears.", "Count the keys that can be used. Leave out the one that changes nothing."],
      note: "There are only 25 keys, so a computer can try them all in an instant." },
    { id: "sh-07", category: "sh-crack", prompt: "Eve knows the algorithm moves the letters, but she does not have the key. Why can she not read the cipher text straight away?", answers: ["Without the key she does not know how far to move the letters back"],
      keywords: [/^(?=.*\b(keys?|how\s+far|how\s+many\s+places|which\s+number|the\s+number)\b)(?=.*\b(not|no|n.?t|unknown|never|without|secret|missing|lacks?)\b)(?=.*\b(decrypt\w*|move\w*|shift\w*|undo\w*|revers\w*|back|read\w*|unscrambl\w*|far|letters?)\b).*$/i],
      distractors: ["The algorithm is kept secret", "The cipher text is too long", "The packets arrive out of order"],
      example: "Example: you know a friend's lock opens with a 3-number code, but not the code.\nStep 1: knowing how the lock works does not open it.\nStep 2: you need the one secret part: the code.\nStep 3: without it, the lock stays shut.\nNow your question: Eve knows how the cipher text was made. Which part is the secret, and what can she not do without it?",
      working: ["Eve knows HOW the letters were moved. What does she not know?", "To decrypt, she must move every letter back. By how much?"],
      note: "The key says how far each letter moved. Without it, Eve cannot undo the shift." },
    { id: "sh-08", category: "sh-crack", prompt: "Why is the letter shift easy to crack, even without the key?", answers: ["There are only 25 keys, so they can all be tried quickly"],
      keywords: [/^(?=.*\b(25|twenty[\s-]*five|few|only|small|not\s+many|limited|short)\b)(?=.*\b(try|trying|tried|tries|test\w*|check\w*|guess\w*|all|every|each|quick\w*|fast|minutes?|seconds?)\b).*$/i],
      distractors: ["The letters stay in the same order", "Everyone uses the key 3", "The cipher text is meaningless"],
      example: "Example: a bike lock has one dial with 10 numbers.\nStep 1: a thief can try every number on the dial.\nStep 2: 10 tries take less than a minute.\nStep 3: so the lock is easy to open, even without knowing the number.\nNow your question: how many keys does the letter shift have, and how long would it take to try them all?",
      working: ["Count how many keys the letter shift has.", "How long would it take to try every one?"],
      note: "With only 25 keys, Eve can try every one until a real word appears." },
    { id: "sh-09", category: "sh-dec", prompt: "Ben decrypts with the same key that Ana used to encrypt. Why does he move the letters BACK, not forward?", answers: ["Moving back undoes the forward move, giving the plain text"],
      keywords: [/^(?=.*\b(undo\w*|undid|revers\w*|opposite|cancel\w*|back|returns?)\b)(?=.*\b(plain\s*text|original\w*|message|letters?|forward|encrypt\w*|started|real\s+word)\b).*$/i],
      distractors: ["Forward would be too slow", "The key is a negative number", "Ben has a different key"],
      example: "Example: you walk 4 steps forward from a door.\nStep 1: to get back to the door, you walk 4 steps the other way.\nStep 2: the same number of steps, in the opposite direction, undoes the walk.\nNow your question: Ana moved each letter forward by the key. What does Ben need to do to each letter, and why?",
      working: ["Ana moved each letter forward by the key.", "What move puts each letter back where it started?"],
      note: "Moving back by the same key undoes Ana's forward move, so each letter returns to the plain text." }
  ];
}

// ---- Activity 2: who can read it? Key sharing scenarios.
function sharingCards() {
  function yesNo(a) { return a === "Yes" ? /^\s*yes\b/i : /^\s*no\b/i; }
  var SCEN = [
    ["Ana encrypts a message. She sends the cipher text and the key together in one email. Eve intercepts the email.", "Yes", "Eve has the cipher text and the key, so she can decrypt it."],
    ["Ana and Ben agreed a key when they met in person last week. Ana emails only the cipher text. Eve intercepts it.", "No", "Eve has only the cipher text. Without the key it is meaningless."],
    ["Ana emails the key to Ben. Then she emails the cipher text. Eve intercepts both emails.", "Yes", "Two emails make no difference: Eve has the key and the cipher text."],
    ["Ana sends her message as plain text, without encrypting it. Eve intercepts it.", "Yes", "It was never encrypted, so there is nothing to decrypt."],
    ["Ana and Ben agreed a 128-bit key in person. Eve intercepts the cipher text and tries a million keys.", "No", "A million tries is nothing next to 2 to the power 128 keys. Without the key it stays meaningless."],
    ["Ben reads the key out to Ana on a phone call. Eve is listening to the call. Later she intercepts the cipher text.", "Yes", "Eve heard the key, so she has the key and the cipher text."],
    ["Eve intercepts an email with the key in it. But Ana never sends the cipher text over the network: she hands Ben a memory stick in person.", "No", "Eve has the key but no cipher text to decrypt."]
  ];
  var EX = "Example: Sam encrypts a file and writes the key on a sticky note on his desk. A visitor photographs the note, then copies the encrypted file.\nStep 1: does the visitor have the cipher text? The copied file: it is there.\nStep 2: does the visitor have the key? The photo: it is there.\nStep 3: cipher text and key together, so the visitor can decrypt the file.\nRule: Eve can read a message only if she has the cipher text AND the key, or if it was never encrypted.";
  return [
    { id: "ks-01", category: "ks-read", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan Eve read the message? Yes or No?", answers: [s[1]], keywords: [yesNo(s[1])], distractors: [s[1] === "Yes" ? "No" : "Yes"], example: EX,
          working: ["Does Eve have the cipher text? Does she have the key?", "She needs both, unless the message was never encrypted."], note: s[1] + ". " + s[2] };
      } },
    { id: "ks-02", category: "ks-read", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan Eve read the message? Yes or No?", answers: [s[1]], keywords: [yesNo(s[1])], distractors: [s[1] === "Yes" ? "No" : "Yes"], example: EX,
          working: ["List what Eve has: cipher text? key? plain text?", "Cipher text with its key, or plain text, can be read."], note: s[1] + ". " + s[2] };
      } },
    { id: "ks-03", category: "ks-why", prompt: "Ana sends the key in the same email as the cipher text. Eve intercepts the email. Why can Eve read the message?", answers: ["She has the key, and the same key decrypts the cipher text"],
      keywords: [/^(?=.*\bkeys?\b)(?=.*\b(decrypt\w*|unlock\w*|undo\w*|read\w*|unscrambl\w*|move\w*\s+.*back|shift\w*\s+.*back|same)\b)(?!.*\b(no|not|without|n.?t)\s+(have\s+)?(the\s+)?key).*$/i],
      distractors: ["The email was not encrypted", "Emails are always public", "Eve guessed the algorithm"],
      example: "Example: a house key is left under the doormat, right next to the locked door.\nStep 1: the door is locked, but the thing that opens it is right there.\nStep 2: anyone who finds the door also finds what opens it.\nNow your question: what did Eve get in the email along with the cipher text, and what can she do with it?",
      working: ["What two things were in the email?", "In symmetric encryption, what does the same key let you do?"],
      note: "The key that encrypted the message also decrypts it, and Eve has it." },
    { id: "ks-04", category: "ks-why", prompt: "Ana and Ben agreed the key in person. Eve intercepts the cipher text. Why can she not read it?", answers: ["She does not have the key, so she cannot decrypt it"],
      keywords: [/^(?=.*\bkeys?\b)(?=.*\b(not|no|n.?t|never|without|missing|lacks?|unknown|secret)\b).*$/i],
      distractors: ["The cipher text is too long", "The email was deleted", "Eve does not know the algorithm"],
      example: "Example: a locked box is posted to a friend. The friend was given the key in person, before.\nStep 1: a thief steals the box on the way.\nStep 2: the thief has the box, but nothing to open it with.\nNow your question: what does Eve have, and what is she missing?",
      working: ["What did Eve intercept?", "What did she NOT get, because it was never sent?"],
      note: "The key was never sent, so Eve has nothing to decrypt the cipher text with. It stays meaningless." },
    { id: "ks-05", category: "ks-why", prompt: "Ana uses the same key for every message she sends Ben. Eve finds the key once. Why is that a big problem?", answers: ["She can decrypt every message that used that key"],
      keywords: [/^(?=.*\b(every|all|each|any|other|future|past|old|later|more)\b)(?=.*\b(messages?|decrypt\w*|read\w*|data|emails?|files?)\b).*$/i],
      distractors: ["Only that one message is lost", "Ben must change his password", "The key stops working"],
      example: "Example: a whole street uses one key for every front door.\nStep 1: a thief copies the key from one house.\nStep 2: that one key opens the other doors too.\nNow your question: if every message uses the same key, which messages does that one key unlock?",
      working: ["Which messages were encrypted with that key?", "The same key decrypts all of them. Which can Eve read now?"],
      note: "One key for everything: once Eve has it, she can decrypt every message, old and new." },
    { id: "ks-06", category: "ks-fix", prompt: "What is the weak point of symmetric encryption?", answers: ["Sharing the key safely"],
      keywords: [/^(?=.*\b(shar\w*|send\w*|sent|transmi\w*|giv\w*|pass\w*|getting|get|swap\w*|exchang\w*|deliver\w*|intercept\w*|stolen)\b)(?=.*\bkeys?\b).*$/i],
      distractors: ["The cipher text is too long", "It cannot encrypt numbers", "The algorithm is slow"],
      example: "Example: two friends lock a diary with a padlock and both need to open it.\nStep 1: they need two copies of the same padlock key, one each.\nStep 2: one friend must get a copy to the other without anyone else seeing it.\nStep 3: that hand-over is the risky moment: if someone copies the key then, the diary is open to them.\nNow your question: in symmetric encryption, what has to be handed over like that?",
      working: ["Both people need the same key. How does the second person get it?", "What could happen to the key on the way?"],
      note: "Both ends need the same key, and it must reach the receiver without being intercepted." },
    { id: "ks-07", category: "ks-fix", prompt: "Why is sending the key in a second email no safer than sending it with the cipher text?", answers: ["The second email can be intercepted too, so Eve still gets the key"],
      keywords: [/^(?=.*\b(intercept\w*|stolen|steal\w*|read|seen|caught|copied|hack\w*|gets?|got)\b)(?=.*\b(too|also|as\s+well|either|same|both|second|another|keys?)\b).*$/i],
      distractors: ["Emails cannot be encrypted", "The key is too short", "The second email arrives first"],
      example: "Example: you post a locked box, and the next day you post its key in a separate envelope.\nStep 1: both travel through the same post office.\nStep 2: anyone who can open one envelope there can open the other.\nNow your question: Eve can intercept the first email. What about the second?",
      working: ["Both emails cross the same network.", "Can Eve intercept a second email as easily as the first?"],
      note: "Eve can intercept any email on the network, so the key is just as easy to get in a second one." },
    { id: "ks-08", category: "ks-fix", randomize: function () {
        var opts = [["in the same email as the cipher text", false], ["in a text message just after the email", false], ["agreed in person, before any message is sent", true]];
        opts.sort(function () { return Math.random() - 0.5; });
        var L = ["A", "B", "C"], ans = L[opts.findIndex(function (o) { return o[1]; })];
        return { prompt: "Ana must get the key to Ben. Which way is safest?\n" + opts.map(function (o, i) { return L[i] + ": " + o[0]; }).join("\n"), answers: [ans],
          keywords: [new RegExp("^\\s*(option\\s+)?" + ans + "\\s*\\.?\\s*$", "i")], distractors: L.filter(function (x) { return x !== ans; }), format: "Type A, B or C",
          example: "Example: which is the safest way to give a friend a spare house key?\nOne: post it with your address on the envelope. Two: post it the day after the address. Three: hand it over yourself.\nStep 1: anything sent through the post can be opened on the way.\nStep 2: only the hand-over never travels where others can reach it.",
          working: ["Which ways send the key across a network, where it can be intercepted?", "Which way never sends the key over a network at all?"],
          note: ans + ": agreeing the key in person means it is never sent, so it cannot be intercepted." };
      } }
  ];
}

// ---- Plenary: this lesson only, four categories that mirror its sections.
function plenaryCards() {
  var ABC = "Alphabet: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z";
  var RULE = "Algorithm: move each letter forward along the alphabet by the key. After Z, carry on from A.";
  var WORDS = ["CAT", "DOG", "SUN", "MAP", "BOX", "CODE", "DATA", "BYTE", "FILE", "LOCK", "SAFE", "NOTE", "SEND", "SHIP", "FISH", "MILK", "GOLD", "RAIN", "PARK", "BELL", "ZOO", "WAVE", "YES"];
  function sh(w, k) { return w.replace(/[A-Z]/g, function (c) { return String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26 + 26) % 26 + 65); }); }
  function exact(s) { return new RegExp("^\\s*" + s + "\\s*\\.?\\s*$", "i"); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function uniq(ans, list) { var out = []; list.forEach(function (x) { if (x !== ans && out.indexOf(x) < 0) out.push(x); }); return out.slice(0, 3); }
  function pairs(w, k) { return w.split("").map(function (c) { return c + " to " + sh(c, k); }).join(", "); }
  function yesNo(a) { return a === "Yes" ? /^\s*yes\b/i : /^\s*no\b/i; }
  var SCEN = [
    ["Ana sends the cipher text and the key in one email. Eve intercepts it.", "Yes", "Eve has the cipher text and the key."],
    ["Ana and Ben agreed the key in person. Eve intercepts only the cipher text.", "No", "Without the key the cipher text is meaningless."],
    ["Ana sends the key in one email and the cipher text in the next. Eve intercepts both.", "Yes", "Eve has the key and the cipher text."],
    ["Ana sends her message as plain text. Eve intercepts it.", "Yes", "Plain text needs no key to read."]
  ];
  return [
    // ================================================= Why encrypt?
    { id: "pl-01", category: "pl-why", prompt: "Every packet arrives and every error check passes. Why is encryption still needed when data is transmitted?", answers: ["Data can be intercepted and read on the way"],
      keywords: [/^(?=.*\b(intercept\w*|stolen|steal\w*|read|seen|copied|hack\w*|access\w*|spied)\b)(?=.*\b(way|route|transmi\w*|travel\w*|sent|network|devices?|routers?|anyone|others?|someone|people)\b).*$/i],
      distractors: ["Packets can arrive in the wrong order", "Error checks are too slow", "Bits can change because of interference"],
      working: ["Error checks find data that has changed. What can they not detect?", "Packets pass through many devices on the way. What could someone there do?"],
      note: "Packets pass through many devices. Anyone with access can intercept and read them, and error checks cannot tell." },
    { id: "pl-02", category: "pl-why", prompt: "State the purpose of encrypting data.", answers: ["If the data is intercepted, it cannot be understood"],
      keywords: [/^(?=.*\b(intercept\w*|stolen|steal\w*|hack\w*|access\w*|someone|anyone|attackers?|copied|unauthori[sz]ed)\b)(?=.*\b(cannot|can.?t|unable|meaningless|unreadable|scrambl\w*|nonsense|useless|not\s+(be\s+)?(understood|read\w*|understandable|used)|no\s+sense)\b).*$/i],
      distractors: ["To stop data being intercepted", "To find errors in the data", "To make the file smaller"],
      working: ["Encryption does not stop the data being copied.", "What does the copied data look like to the person who took it?"],
      note: "From the mark scheme: if the data is intercepted, it cannot be understood." },
    { id: "pl-03", category: "pl-why", prompt: "Encryption does not stop data being intercepted. What does it do instead?", answers: ["It makes intercepted data meaningless"],
      keywords: [/\b(meaningless|unreadable|scrambl\w*|nonsense|useless|cannot\s+be\s+(read|understood)|can.?t\s+be\s+(read|understood)|can.?t\s+(read|understand)|cannot\s+(read|understand)|not\s+(readable|understandable)|no\s+sense)\b/i],
      distractors: ["It deletes the data", "It sends the data twice", "It finds the error"],
      working: ["Eve still gets a copy of the encrypted data.", "What does that copy look like to her without the key?"],
      note: "Intercepted cipher text is meaningless without the key." },
    { id: "pl-04", category: "pl-why", prompt: "Why does an attacker gain nothing useful from intercepted cipher text?", answers: ["Without the key it is meaningless"],
      keywords: [/^(?=.*\b(keys?|decrypt\w*)\b)(?=.*\b(meaningless|cannot|can.?t|unable|unreadable|scrambl\w*|nonsense|useless|without|no|not|n.?t)\b).*$/i],
      distractors: ["Cipher text is deleted after it is read", "Cipher text cannot be copied", "Cipher text has no errors"],
      working: ["What does the attacker need to turn cipher text back into plain text?", "Do they have it?"],
      note: "Cipher text can only be decrypted with the key. Without it, the data is meaningless." },
    // ================================================= The words
    { id: "pl-05", category: "pl-terms", prompt: "What is the name of the data before it is encrypted?", answers: ["Plain text"],
      keywords: [/^\s*(the\s+)?plain\s*-?\s*text\s*\.?\s*$/i], distractors: ["Cipher text", "Key", "Payload"],
      working: ["It is the readable data that goes into the encryption algorithm.", "Its name says it is ordinary, readable text."],
      note: "Plain text goes in; cipher text comes out." },
    { id: "pl-06", category: "pl-terms", prompt: "What is the name given to the encrypted data?", answers: ["Cipher text"],
      keywords: [/^\s*(the\s+)?(ciph|cyph)er\s*-?\s*(text|data)?\s*\.?\s*$/i], distractors: ["Plain text", "Key", "Header"],
      working: ["It is what comes out of the encryption algorithm.", "Its name means text written in a secret code."],
      note: "Encrypted data is cipher text (also spelt cypher text)." },
    { id: "pl-07", category: "pl-terms", prompt: "Describe what is meant by an encryption key.", answers: ["A value used by the algorithm to encrypt and decrypt data"],
      keywords: [/^(?=.*\b(strings?|characters?|numbers?|values?|digits?|bits?|binary|letters?|algorithms?|ciphers?|codes?)\b)(?=.*\b(encrypt\w*|decrypt\w*|scrambl\w*|unscrambl\w*|cipher\s*text|plain\s*text)\b).*$/i],
      distractors: ["A password typed to log in", "The address of the receiver", "A copy of the plain text"],
      working: ["In the letter shift, the key was a number. What did that number do?", "Two ideas: what the key is, and what the algorithm uses it for."],
      note: "A string of characters or numbers, used by the algorithm to encrypt and decrypt the data." },
    { id: "pl-08", category: "pl-terms", prompt: "In symmetric encryption, how many different keys are used to encrypt and decrypt?", answers: ["One"],
      keywords: [/^\s*(just\s+|only\s+)?(one|1|a\s+single|single|the\s+same)(\s+(shared\s+)?keys?)?(\s+for\s+both)?\s*\.?\s*$/i], distractors: ["Two", "Three", "None"],
      working: ["The sender encrypts with a key. The receiver decrypts with a key.", "Are those different keys, or the same key?"],
      note: "One key: the same key encrypts and decrypts." },
    { id: "pl-09", category: "pl-terms", prompt: "What does decrypt mean?", answers: ["Turn cipher text back into plain text"],
      keywords: [/^(?!.*plain\s*text\s+(in)?to\s+(the\s+)?(ciph|cyph))(?=.*\b(cipher\s*text|cypher\s*text|encrypted|scrambled|code)\b)(?=.*\b(plain\s*text|readable|original|understand\w*|back|message)\b).*$|^(?=.*\b(undo\w*|revers\w*)\b)(?=.*\bencrypt\w*\b).*$/i],
      distractors: ["Turn plain text into cipher text", "Send the key to the receiver", "Check the data for errors"],
      working: ["Encrypt goes from plain text to cipher text.", "Decrypt goes the other way."],
      note: "Decrypt: turn the cipher text back into plain text, using the key." },
    // ================================================= Encrypt and decrypt
    { id: "pl-10", category: "pl-shift", format: "Type the letters", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 9), a = sh(w, k);
        return { prompt: RULE + "\n" + ABC + "\nPlain text: " + w + "\nKey: " + k + "\nWhat is the cipher text?", answers: [a], keywords: [exact(a)],
          distractors: uniq(a, [sh(w, -k), sh(w, k + 1), sh(w, k - 1)]),
          working: ["Start with " + w[0] + ". Count " + k + " letters forward.", "Do the same for every letter. After Z, carry on from A."],
          note: pairs(w, k) + "." };
      } },
    { id: "pl-11", category: "pl-shift", format: "Type the letters", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 9), c = sh(w, k);
        return { prompt: "Symmetric encryption: decrypt with the same key by moving each letter BACK. Before A, carry on from Z.\n" + ABC + "\nCipher text: " + c + "\nKey: " + k + "\nWhat is the plain text?", answers: [w], keywords: [exact(w)],
          distractors: uniq(w, [sh(c, k), sh(w, 1), sh(w, -1)]),
          working: ["Start with " + c[0] + ". Count " + k + " letters back.", "Do the same for every letter. The answer is a real word."],
          note: pairs(c, -k) + "." };
      } },
    { id: "pl-12", category: "pl-shift", randomize: function () {
        var w = drillPick(WORDS), k = rnd(1, 12), c = sh(w, k);
        return { prompt: RULE + "\n" + ABC + "\nPlain text: " + w + "\nCipher text: " + c + "\nWhat key was used?", answers: [String(k)], keywords: [drillNumberRe(k, "key")],
          distractors: drillWrongNumbers(k, [k + 1, k - 1, 26 - k, k + 2], 3), format: "Type a number",
          working: ["Compare the first letters: " + w[0] + " and " + c[0] + ".", "Count the places forward from " + w[0] + " to " + c[0] + "."],
          note: w[0] + " to " + c[0] + " is " + k + " places forward." };
      } },
    { id: "pl-13", category: "pl-shift", randomize: function () {
        var w = drillPick(WORDS), k = rnd(2, 12), c = sh(w, k), keys = [k];
        while (keys.length < 4) { var g = rnd(1, 14); if (keys.indexOf(g) < 0) keys.push(g); }
        keys.sort(function (a, b) { return a - b; });
        return { prompt: "Eve intercepts " + c + " and has no key. She tries some keys, moving every letter back:\n" + keys.map(function (g) { return "Key " + g + ": " + sh(c, -g); }).join("\n") + "\nWhich key was used?", answers: [String(k)], keywords: [drillNumberRe(k, "key")],
          distractors: drillWrongNumbers(k, keys, 3), format: "Type a number",
          working: ["Read each line. Most are meaningless.", "Find the line that is a real word."],
          note: "Key " + k + " gives " + w + "." };
      } },
    { id: "pl-14", category: "pl-shift", prompt: "Why is the letter shift easy to crack, even without the key?", answers: ["There are only 25 keys, so they can all be tried quickly"],
      keywords: [/^(?=.*\b(25|twenty[\s-]*five|few|only|small|not\s+many|limited|short)\b)(?=.*\b(try|trying|tried|tries|test\w*|check\w*|guess\w*|all|every|each|quick\w*|fast|minutes?|seconds?)\b).*$/i],
      distractors: ["The letters stay in the same order", "Everyone uses the key 3", "The cipher text is meaningless"],
      working: ["How many keys does the letter shift have?", "How long would it take to try every one?"],
      note: "Only 25 keys: Eve can try every one until a real word appears." },
    // ================================================= The shared key
    { id: "pl-15", category: "pl-key", prompt: "What is the weak point of symmetric encryption?", answers: ["Sharing the key safely"],
      keywords: [/^(?=.*\b(shar\w*|send\w*|sent|transmi\w*|giv\w*|pass\w*|getting|get|swap\w*|exchang\w*|deliver\w*|intercept\w*|stolen)\b)(?=.*\bkeys?\b).*$/i],
      distractors: ["The cipher text is too long", "It cannot encrypt numbers", "The algorithm is slow"],
      working: ["Both people need the same key. How does the second person get it?", "What could happen to the key on the way?"],
      note: "The same key must reach the receiver without being intercepted." },
    { id: "pl-16", category: "pl-key", prompt: "Why is it unsafe to send the key with the cipher text?", answers: ["Anyone who intercepts it has the key and can decrypt the cipher text"],
      keywords: [/^(?=.*\b(intercept\w*|stolen|steal\w*|caught|copied|gets?|has|have|finds?|hack\w*|sees?|takes?|anyone|someone)\b)(?=.*\b(decrypt\w*|read\w*|unlock\w*|undo\w*|understand\w*|plain\s*text|message)\b).*$/i],
      distractors: ["The key makes the email too big", "The receiver already has a key", "The key changes the cipher text"],
      working: ["What would Eve get if she intercepted that one message?", "What can anyone with the key do?"],
      note: "Whoever intercepts the message gets the key too, and the same key decrypts the cipher text." },
    { id: "pl-17", category: "pl-key", randomize: function () {
        var s = drillPick(SCEN);
        return { prompt: s[0] + "\nCan Eve read the message? Yes or No?", answers: [s[1]], keywords: [yesNo(s[1])], distractors: [s[1] === "Yes" ? "No" : "Yes"],
          working: ["Does Eve have the cipher text? Does she have the key?", "She needs both, unless the message was never encrypted."], note: s[1] + ". " + s[2] };
      } },
    { id: "pl-18", category: "pl-key", prompt: "Why is a 128-bit key much harder to crack than the letter shift?", answers: ["It has far more possible keys, so trying them all takes too long"],
      keywords: [/^(?=.*\b(more|many|lots|huge|billions?|combinations?|possib\w*|options?|doubl\w*)\b)(?=.*\b(try|trying|tried|tries|guess\w*|check\w*|test\w*|long|longer|time|years|forever|ages)\b).*$/i],
      distractors: ["128-bit keys are kept secret", "Its letters are in a different order", "It is sent in packets"],
      working: ["The letter shift has 25 keys. A 128-bit key has 2 to the power 128.", "What does that mean for someone trying every key?"],
      note: "2 to the power 128 keys: trying them all would take far longer than anyone could wait." },
    { id: "pl-19", category: "pl-key", prompt: "A key is made one bit longer. What happens to the number of possible keys?", answers: ["It doubles"],
      keywords: [/\b(doubl\w*|twice|times\s+(2|two)|x\s*2|multipl\w*\s+by\s+(2|two))\b/i], distractors: ["It goes up by one", "It halves", "It stays the same"],
      working: ["1 bit gives 2 keys. 2 bits give 4 keys. 3 bits give 8 keys.", "What happens each time one bit is added?"],
      note: "Each extra bit doubles the number of possible keys." },
    { id: "pl-20", category: "pl-key", prompt: "Ana and Ben use symmetric encryption. Why must Ben have the key before Ana's message arrives?", answers: ["He needs the same key to decrypt the cipher text"],
      keywords: [/^(?=.*\b(decrypt\w*|undo\w*|unscrambl\w*|unlock\w*|read\w*|plain\s*text|understand\w*)\b)(?=.*\b(same|keys?|cipher\s*text|message|it)\b).*$/i],
      distractors: ["To check the message for errors", "To send the message back", "To make the message smaller"],
      working: ["What arrives at Ben: plain text or cipher text?", "What does he need to turn it into plain text?"],
      note: "The message arrives as cipher text. Only the same key turns it back into plain text." }
  ];
}

const DRILLS = [
  ['y10-2-3-l1-ext', 'Do Now Extension: 2.1 Data Transmission and 2.2 Methods of Error Detection. Every card has an example on different details and two nudges.',
    'Year 10 Extension: Data Transmission and Error Detection', '2.3 L1 Do Now Extension',
    [['ex-trans', 'Data Transmission (2.1)'], ['ex-errors', 'Methods of Error Detection (2.2)']], extCards],
  ['y10-2-3-l1-shift', 'Activity 1: encrypt and decrypt with the letter shift, then crack cipher text without the key.',
    'Year 10, 2.3 L1: Encrypt, Decrypt, Crack', 'Cambridge IGCSE Computer Science 0478',
    [['sh-enc', 'Encrypt'], ['sh-dec', 'Decrypt'], ['sh-crack', 'Without the Key']], shiftCards],
  ['y10-2-3-l1-sharing', 'Activity 2: who can read it? How the key is shared decides whether Eve can decrypt.',
    'Year 10, 2.3 L1: Who Can Read It?', 'Cambridge IGCSE Computer Science 0478',
    [['ks-read', 'Can Eve Read It?'], ['ks-why', 'Why?'], ['ks-fix', 'Sharing the Key']], sharingCards],
  ['y10-2-3-l1', 'Plenary: why data is encrypted, the words, encrypting and decrypting, and the shared key.',
    'Year 10, 2.3 L1: Symmetric Encryption', 'Cambridge IGCSE Computer Science 0478',
    [['pl-why', 'Why Encrypt?'], ['pl-terms', 'Plain Text, Cipher Text and Keys'], ['pl-shift', 'Encrypt and Decrypt'], ['pl-key', 'The Shared Key']], plenaryCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/asymmetric|public key|private key|mario/i.test(src), `drill ${id} names a later term`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times, as check-site does once: its answer passes, no distractor passes, and no example or
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
    for (const card of d.cards) {
      for (let n = 0; n < (card.randomize ? 400 : 1); n++) {
        const r = card.randomize ? { ...card, ...card.randomize() } : card;
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors`);
        if (r.example && ans.length >= 3) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (r.working && !pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
assert(!/mario/i.test(JSON.stringify(steps)), 'never named');

const lesson = { id: ID, label: '2.3 L1: Symmetric Encryption', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it as the first lesson of a Year 10 "2.3" unit, straight after 2.2. Read the file at the last moment
// (other builders edit it too) and write it back with its own indent and line endings.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find((y) => y.id === 'year10');
let unit = y10.units.find((u) => u.code === '2.3');
let changed = false;
if (!unit) {
  unit = { code: '2.3', title: 'Encryption', lessons: [] };
  const after = y10.units.findIndex((u) => u.code === '2.2');
  assert(after >= 0, 'the 2.2 unit must exist');
  y10.units.splice(after + 1, 0, unit);
  changed = true;
}
if (!unit.lessons.includes(ID)) { unit.lessons.unshift(ID); changed = true; }
if (changed) {
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; Year 10 units: ${y10.units.map((u) => u.code).join(', ')}`);
