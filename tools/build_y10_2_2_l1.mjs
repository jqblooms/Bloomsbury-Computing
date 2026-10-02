// Builds LessonData/y10-2-2-l1.json: Year 10, 2.2 L1: Why Errors Happen and Parity Checks (syllabus 0478 2.2 1, and
// 2.2 2 for the parity check on one byte), the first lesson of 2.2 Methods of Error Detection, and registers it in a
// Year 10 "2.2" unit after 2.1.
//   node tools/build_y10_2_2_l1.mjs
// EAL-light shape (James, 2026-09-30 and 2026-10-01): one idea, short sentences, a teacher-only Think, Pair, Share
// under every heading, predict-then-reveal, a compare slide. Do Now: two real 2.1 questions, then the Do Now
// Extension drill across all of 2.1 (James, 2026-10-02: every lesson). Activities: Parity Lab (set a parity bit and
// send it through interference; then be the receiver). Every exam question is real and cited. Plenary drill:
// y10-2-2-l1-parity. Parity byte, parity block and checksum come in L2.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-2-l1';
const P = 'y10-22l1';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const bits = (s, mark = []) => '<span style="font:700 20px var(--font-mono, monospace);letter-spacing:4px">' +
  s.split('').map((b, i) => mark.includes(i) ? `<span style="color:var(--bad);text-decoration:underline">${b}</span>` : b).join('') + '</span>';
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);

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
const ODD = '^\\s*odd(\\s+parity)?\\s*\\.?\\s*$', EVEN = '^\\s*even(\\s+parity)?\\s*\\.?\\s*$';
const bitAns = (b) => `^\\s*${b}\\s*$`;

// ---------------------------------------------------------------- Do Now (2.1) and its extension
steps.push(mcStep('do-now', 'Do Now: Packets (1 of 2)', 'Do Now: Packets (1 of 2)',
  'From 2.1. ' + cite('0478/11, June 2025, Question 4(c)(i)') + ' A customer orders food over the internet. The order is broken into packets.', [
    { prompt: 'Which item would NOT be included in a packet’s header?', options: ['destination address', 'originator’s address', 'packet number', 'payload'], correct: 3,
      explain: 'The payload is the data itself, in the middle of the packet. The header holds the addresses and the packet number.' },
  ], ['Why does every packet need its own header?', 'Each packet travels on its own, so each one must say where it is going and where it fits in the order.']));
steps.push(checkStep('do-now-2', 'Do Now: Out of Order (2 of 2)', 'Do Now: Out of Order (2 of 2)',
  'From 2.1. ' + cite('0478/11, June 2025, Question 4(c)(ii)') + ' The packets of data may need to be reordered when they arrive at the computer in the restaurant kitchen.', [
    { line: true, marks: 2, label: 'Explain why the packets of data may need to be reordered.', answer: '^(?=.*\\b(routes?|paths?|ways?)\\b)(?=.*\\b(different|own|separate|each|another|other)\\b).*$',
      feedback: 'Think about how each packet travels across the internet. Do they all take the same path?' },
  ], ['Why does a packet number help here?', 'The receiver uses the packet numbers to put the packets back in the right order.']));
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-2-l1-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from all of 2.1 Data Transmission. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Errors and Parity Checks',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.2 Methods of Error Detection</p><h2 class="lesson-h2">Errors and Parity Checks</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> why bits can change on the way, and one way to check: the <strong>parity check</strong>.', '<strong>You already know:</strong> data is sent as bits, down a cable or through the air.']) +
    why('Why does the receiver need to check the data, even when it was correct when it was sent?', 'Something can change the bits on the way. The receiver cannot know unless it checks.') });

// ---------------------------------------------------------------- why errors happen: predict then reveal
steps.push({ id: 'concept-errors', label: 'Why Errors Happen',
  content: '<h2 class="lesson-h2">Why Errors Happen</h2>' +
    tps('Predict: the letter A is sent as 01000001. The receiver gets 01000011. Is that still A? What happened?',
      '<p>No. One bit changed from 0 to 1, so the receiver gets a different letter (C).</p><p>Something on the way <strong>changed</strong> a bit. This is called <strong>interference</strong>.</p>', 'Show the worked answer') +
    columns('<p style="margin:0 0 6px">Sent</p>' + bits('01000001') + '<p style="margin:10px 0 6px">Received</p>' + bits('01000011', [6]),
      facts(['<strong>Interference</strong> (for example electrical or magnetic) can affect data on the way.', 'A bit can be <strong>lost</strong> (data loss), an extra bit can be <strong>gained</strong> (data gain), or a bit can be <strong>changed</strong> (data change).', 'So the receiver <strong>checks</strong> the data when it arrives.'])) });

steps.push({ id: 'compare', label: 'Compare: Lost, Gained, Changed',
  content: '<h2 class="lesson-h2">Compare: Lost, Gained, Changed</h2>' +
    tps('The same byte was sent three times. What is different about each one that arrived?',
      '<p><strong>A:</strong> only 7 bits arrived: a bit was <strong>lost</strong>.</p><p><strong>B:</strong> 9 bits arrived: a bit was <strong>gained</strong>.</p><p><strong>C:</strong> 8 bits, but one is different: a bit was <strong>changed</strong>.</p>') +
    '<p class="lesson-lead">Sent: ' + bits('10110100') + '</p>' +
    '<table class="donow-table" style="font-size:17px;width:100%"><tr><th style="padding:6px 12px;text-align:left">Arrived</th><th style="padding:6px 12px;text-align:left">Bits</th></tr>' +
    [['A', '1011010'], ['B', '101101001'], ['C', '10100100']].map((r) => `<tr><td style="padding:6px 12px;text-align:left"><strong>${r[0]}</strong></td><td style="padding:6px 12px;text-align:left">${bits(r[1])}</td></tr>`).join('') + '</table>' });

steps.push(checkStep('exam-occur', 'Exam Question: How Errors Occur', 'Exam Question: How Errors Occur',
  cite('0478/12, March 2026, Question 7(c)(i)') + ' The transmitted data may contain an error.', [
    { line: true, label: 'Give one way in which an error can occur during data transmission.', answer: '(interference|noise|electrical|magnetic|lost|loss|gain|gained|extra|chang|flip|corrupt|crosstalk|missing|dropped)',
      feedback: 'Think about what can happen to the bits on the way, and what causes it.' },
  ], ['Why is "the data goes wrong" not enough for the mark?', 'Say HOW: interference can make a bit be lost, gained or changed.']));
steps.push(selfMarked('exam-explain', 'Exam Question: Explain How Errors Occur', 'Exam Question: Explain How Errors Occur',
  cite('0478/12, November 2025, Question 7(f)(i)') + ' The data for music and audio books needs to be checked for errors after being transmitted from the cloud.', [
    { id: 'errors-explain', prompt: 'Explain how errors may occur in the data during transmission. [2]', marks: 2,
      modelAnswer: 'Interference (for example electrical or magnetic) can affect the data on the way; this can cause bits to be lost (data loss), extra bits to be gained (data gain), or bits to change, for example a 0 becoming a 1 (data change).' },
  ], ['This question has 2 marks. What two ideas do you need?', 'The cause (interference), and what it does to the bits (lost, gained or changed).']));

// ---------------------------------------------------------------- parity: predict then reveal
steps.push({ id: 'concept-parity', label: 'The Parity Check',
  content: '<h2 class="lesson-h2">The Parity Check</h2>' +
    tps('Predict: even parity means the total number of 1s must be even. The data is 1011000. Should the parity bit be 0 or 1?',
      '<p>1011000 has <strong>three</strong> 1s. Three is odd.</p><p>A parity bit of <strong>1</strong> makes four 1s: even. So the byte sent is <strong>1</strong>1011000.</p>', 'Show the worked answer') +
    columns(facts(['Before sending, the sender and receiver agree: <strong>even</strong> or <strong>odd</strong> parity.', 'The sender adds a <strong>parity bit</strong> (here, the first bit) to make the number of 1s even, or odd.', 'The receiver <strong>counts the 1s</strong>. If the count is wrong, an <strong>error</strong> is detected.']),
      '<p style="margin:0 0 6px">Even parity</p>' + bits('11011000', []) + '<p style="margin:4px 0 12px;color:var(--muted)">four 1s: even</p><p style="margin:0 0 6px">Odd parity</p>' + bits('01011000') + '<p style="margin:4px 0 0;color:var(--muted)">three 1s: odd</p>') });

steps.push(embed('activity-1', 'Activity 1: Parity Lab', 'parity-lab-bit', 'Activity 1: Parity Lab',
  'Set the parity bit, send the byte through interference, and check what arrives. Work through the tasks.',
  ['What happens to the number of 1s when interference changes ONE bit?', 'It goes up or down by one, so an even count becomes odd. The receiver notices.']));

steps.push(checkStep('exam-type', 'Exam Question: Odd or Even?', 'Exam Question: Odd or Even?',
  cite('0478/11, June 2021, Question 8(a)') + ' A parity bit is added to each 7-bit value. All the values are transmitted and received correctly. Write <strong>odd</strong> or <strong>even</strong> for each.', [
    { label: '01100100', answer: ODD, feedback: 'Count the 1s in 01100100.' },
    { label: '10010001', answer: ODD, feedback: 'Count the 1s in 10010001.' },
    { label: '00000011', answer: EVEN, feedback: 'Count the 1s in 00000011.' },
    { label: '10110010', answer: EVEN, feedback: 'Count the 1s in 10110010.' },
  ], ['The values arrived correctly. Why does that let you work out the parity?', 'Correct data still matches its parity. So the count of 1s tells you which parity was used.']));
steps.push(checkStep('exam-bits', 'Exam Question: Add the Parity Bit', 'Exam Question: Add the Parity Bit',
  cite('0478/12, June 2026, Question 4(a)') + ' An odd parity byte check is used. Give the parity bit for each byte of data.', [
    { label: 'Data 0101110', answer: bitAns(1), feedback: 'Count the 1s in 0101110 carefully. Odd parity needs an odd total.' },
    { label: 'Data 1110111', answer: bitAns(1), feedback: 'Count the 1s in 1110111. Odd parity needs an odd total.' },
    { label: 'Data 1000100', answer: bitAns(1), feedback: 'Count the 1s in 1000100. Odd parity needs an odd total.' },
  ], ['When would the parity bit be 0 instead of 1?', 'When the data already has the right number of 1s (here, an odd number), so nothing needs adding.']));

steps.push(embed('activity-2', 'Activity 2: Be the Receiver', 'parity-lab-check', 'Activity 2: Be the Receiver',
  'Eight bytes arrive. Count the 1s in each one and decide what the parity check says.',
  ['One byte had two bits changed, but the check said OK. Why?', 'Two changes keep the number of 1s even (or odd), so the count still matches.']));

steps.push(selfMarked('exam-detect', 'Exam Question: How Even Parity Detects an Error', 'Exam Question: How Even Parity Detects an Error',
  cite('0478/12, June 2025, Question 3(c)(iii)') + ' An even parity check is used to detect errors in data after it has been transmitted to a printer.', [
    { id: 'even-detect', prompt: 'Describe how an even parity check detects an error. [3]', marks: 3,
      modelAnswer: 'Any three: the sender and receiver agree on even parity; a parity bit is added to each byte to make the number of 1s even; the receiver counts the number of 1s in each byte; if the number of 1s is odd, an error is detected.' },
  ], ['Why must the answer say what the RECEIVER does?', 'Detecting happens when the data arrives: the receiver counts the 1s and checks the total is still even.']));
steps.push(checkStep('exam-miss', 'Exam Question: When Parity Fails', 'Exam Question: When Parity Fails',
  cite('0478/11, June 2021, Question 8(b)') + ' An error may not be detected when using a parity check.', [
    { line: true, label: 'Identify why an error may not be detected.', answer: '(\\btwo\\b|\\b2\\b|even\\s+number|\\bboth\\b|swap|transpos|more\\s+than\\s+one|\\bpair|still\\s+(even|odd|match|the\\s+same))',
      feedback: 'Think about Activity 2. What happened when two bits changed?' },
  ], ['Why can a parity check never find two changed bits?', 'Each change moves the count by one. Two changes cancel out, so the count is even (or odd) again.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Errors and Parity Drill', 'drill-y10-2-2-l1-parity', 'Plenary: Errors and Parity Drill',
  'Why errors happen, setting the parity bit, checking a byte, and when parity fails. Your progress is saved.',
  ['Why practise with new bytes every time?', 'If you can check any byte, you really understand parity.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now-2', 0, 'each packet takes a different route') && T('do-now-2', 0, 'they go on their own path') && !T('do-now-2', 0, 'they are sent in order') && !T('do-now-2', 0, 'route'), 'reorder');
assert(T('exam-occur', 0, 'interference') && T('exam-occur', 0, 'a bit gets flipped') && T('exam-occur', 0, 'data loss') && !T('exam-occur', 0, 'the data is slow'), 'occur');
assert(T('exam-type', 0, 'odd') && !T('exam-type', 0, 'even') && T('exam-type', 2, 'Even parity') && !T('exam-type', 2, 'odd'), 'type');
assert(T('exam-bits', 0, '1') && !T('exam-bits', 0, '0') && T('exam-bits', 1, '1') && T('exam-bits', 2, '1') && !T('exam-bits', 2, '0'), 'bits');
assert(T('exam-miss', 0, 'two bits changed') && T('exam-miss', 0, 'if 2 bits are wrong') && T('exam-miss', 0, 'bits are transposed') && !T('exam-miss', 0, 'one bit changed') && !T('exam-miss', 0, 'it is slow'), 'miss');
// The real answers, worked out: 01100100 has 3 ones, 10010001 3, 00000011 2, 10110010 4; the data 0101110 has 4 ones,
// 1110111 6 and 1000100 2, so each needs an odd parity bit of 1.
const ones = (s) => s.split('').filter((b) => b === '1').length;
assert(ones('01100100') % 2 === 1 && ones('10010001') % 2 === 1 && ones('00000011') % 2 === 0 && ones('10110010') % 2 === 0, 'q8a');
assert([['0101110', 1], ['1110111', 1], ['1000100', 1]].every(([d, p]) => (ones(d) + p) % 2 === 1), 'q4a');

const lesson = { id: ID, label: '2.2 L1: Errors and Parity Checks', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it as the first lesson of a Year 10 "2.2" unit, after 2.1.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find((y) => y.id === 'year10');
let unit = y10.units.find((u) => u.code === '2.2');
if (!unit) {
  unit = { code: '2.2', title: 'Methods of Error Detection', lessons: [] };
  const after = y10.units.findIndex((u) => u.lessons.includes('y10-2-1-l3'));
  y10.units.splice(after + 1, 0, unit);
}
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; Year 10 units: ${y10.units.map((u) => u.code).join(', ')}`);
