// Builds the Topic 2 review as two 55-minute lessons (James, 2026-10-21: the one 32-slide lesson ran 85 to 90 minutes):
//   LessonData/y10-2-r.json   2.R Exam Practice 1: Packets and Transmission Methods (2.1 packets, packet switching,
//                             serial and parallel, simplex, half-duplex and full-duplex, USB, choosing a method)
//   LessonData/y10-2-r2.json  2.R Exam Practice 2: Error Detection and Encryption (2.2 parity, checksum, echo check,
//                             check digits, ARQ; 2.3 symmetric and asymmetric encryption)
// Lesson 1 keeps the old id and every step id it kept, so saved answers stay with their slides. The parity and
// encryption Do Now moved to Lesson 2; Lesson 1 has a new 2.1 Do Now. Trimmed for time: the serial benefits question
// (0478/12 June 2023 Q4(a)(ii)), half-duplex not simplex (0478/13 November 2021 Q4(c)(ii)) and parallel full-duplex
// reasons (0478/11 November 2024 Q4(b)(i)).
// It also writes the seven drills and registers both lessons in a "2.R Topic 2 Review" unit after the 2.3 unit.
//   node tools/build_y10_2_r.mjs
// Objectives: apply Topic 2 knowledge to structured questions; identify and correct common errors in transmission
// explanations. 2.1.5 Choosing Transmission Methods was never taught as its own lesson, so it has its own section here
// (three questions, a concept slide, a compare slide and Activity 1).
// Shape: EAL-light, a teacher-only Think, Pair, Share under every heading (Term 1b: why), real Paper 1 questions
// grouped by subtopic, each cited in the lead, "Fix the Answer" slides with a realistic weak answer.
// Every written part (describe, explain, justify) is self-marked and carries the full mark scheme for AI marking
// (docs/lessons.md, AI marking): scheme (one string per point), marks, and context (the question, the student answer
// on a Fix the Answer slide, and the marking rule, such as "any four from" or "MAX four for ARQ").
// Lesson 1 Do Now: 0478/12 March 2023 Q5(a)(i) and (ii) (packets), then 0478/12 June 2024 Q2(a) and 0478/13 June 2021
// Q6(c)(ii) (methods), each with a Walk me through it. Extension: y10-2-r-ext. Activities: y10-2-r-choose (choose the
// method for a scenario and justify it) and y10-2-r-fix (spot and fix the mistake, 2.1). Plenary: y10-2-r (real 2.1
// exam questions, each cited in its note).
// Lesson 2 Do Now: 0478/13 June 2021 Q6(a) and (b) (parity, 2.2), then 0478/13 June 2026 Q2(e)(i), 0478/12 June 2026
// Q4(c)(ii) and 0478/11 June 2022 Q7(d) (encryption, 2.3), each with a Walk me through it. Extension: y10-2-r2-ext.
// Activities: y10-2-2-l3-arq (2.2 L3's be the sender, be the receiver) and y10-2-r2-fix (spot and fix the mistake,
// 2.2 and 2.3). Plenary: y10-2-r2 (real 2.2 and 2.3 exam questions).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L1 = { id: 'y10-2-r', P: 'y10-2r', label: '2.R Exam Practice 1: Packets and Transmission Methods', steps: [], validators: {} };
const L2 = { id: 'y10-2-r2', P: 'y10-2r2', label: '2.R Exam Practice 2: Error Detection and Encryption', steps: [], validators: {} };
// The step helpers below write into the lesson chosen by use().
let P, steps, validators;
const use = (L) => { P = L.P; steps = L.steps; validators = L.validators; };
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

const pill = (t, tone = '') => `<span style="display:inline-block;padding:7px 12px;border-radius:8px;background:var(--surface-3);font-weight:700;${tone === 'bad' ? 'color:var(--bad);border:2px solid var(--bad-line)' : tone === 'brand' ? 'border:2px solid var(--brand)' : tone === 'good' ? 'color:var(--good);border:2px solid var(--good-line)' : ''}">${t}</span>`;
const chips = (words) => '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">' + words.map((w) =>
  `<span style="padding:4px 10px;border-radius:6px;background:var(--surface-3);font-size:15px">${w}</span>`).join('') + '</div>';
const gap = (n) => `<b>(${n})</b>&nbsp;<span style="display:inline-block;min-width:70px;border-bottom:2px solid var(--ink-2, currentColor)">&nbsp;</span>`;
const para = (t) => `<p style="margin:6px 0;font-size:17px;line-height:1.7">${t}</p>`;
const col = (title, rows, verdict, tone) => `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)"><p style="margin:0 0 6px;text-align:center"><strong>${title}</strong></p>` +
  `<p style="margin:0;font-size:17px;line-height:1.6">${rows.join('<br>')}</p><p style="margin:8px 0 0;text-align:center">${pill(verdict, tone)}</p></div>`;
const twoCols = (a, b) => `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">${a}${b}</div>`;

function checkStep(id, label, heading, lead, parts, whyQ, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const one = (p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  };
  // Short parts marked grid: true sit two to a row.
  let inputs = '';
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].grid) { inputs += one(parts[i], i); continue; }
    let cells = '';
    while (i < parts.length && parts[i].grid) { cells += one(parts[i], i); i++; }
    i--;
    inputs += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));column-gap:20px">${cells}</div>`;
  }
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
// A written exam part: the model answer is the shortest answer that earns the marks. The real mark scheme goes in
// scheme (one point per string) for AI marking; its rule ("Any four from") goes into the part's context.
function written(id, prompt, marks, model, rule, points, source, extra = '') {
  return { id, prompt, marks, modelAnswer: model + (extra ? `<span style="display:block;margin-top:6px;font-size:15px"><strong>Why it lost marks:</strong> ${extra}</span>` : ''),
    scheme: points, source, rule };
}
const plainText = (h) => h.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&ldquo;|&rdquo;/g, '"').replace(/&rarr;/g, '->').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function selfMarked(id, label, heading, lead, items, whyQ, extra = '') {
  // The context Claude marks against: the question's stem, the weak answer on a Fix the Answer slide, and the rule.
  items.forEach((it) => { it.context = plainText(lead + ' ' + extra) + ` Marking rule: ${it.rule}, one mark for each point met, up to ${it.marks}.`; delete it.rule; });
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (extra ? columns(`<p class="lesson-lead" style="margin:0">${lead}</p>`, extra) : `<p class="lesson-lead">${lead}</p>`) + `<div id="${P}-${id}"></div>`, items };
}
// A Fix the Answer slide: the real question in the lead, a realistic weak answer in the part's prompt, and the
// student rewrites it. The reason it lost marks goes to the AI marker in the context, not on the slide.
function fixStep(id, label, ref, question, marks, weak, got, part, whyQ) {
  const item = written(part.id, `A student wrote: <em>&ldquo;${weak}&rdquo;</em><br>This answer gets ${got} mark${got === 1 ? '' : 's'}. Write a better answer that gets ${marks} marks.`, marks, part.model, part.rule, part.points, part.source);
  const lead = cite(ref) + " " + question;
  item.ariaLabel = question.replace(/^.*\. (?=[A-Z][^.]*[.?]$)/, '') + ' (better answer)';
  const step = selfMarked(id, label, label, lead, [item], whyQ);
  item.context = plainText(lead) + ` A student wrote: "${weak}" This got ${got} of ${marks} marks: ${part.why} The student now writes a better answer. Marking rule: ${part.rule}, one mark for each point met, up to ${marks}.`;
  return step;
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}

// ---------------------------------------------------------------- "Walk me through it" pictures
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const stmt = (t) => `<div style="margin:6px 0;padding:8px 12px;border-radius:8px;background:var(--surface-3)">${t}</div>`;
const MONO = 'font:700 20px var(--font-mono, monospace);letter-spacing:4px';
const bits = (s, hl = []) => `<span style="${MONO}">` + s.split('').map((b, i) => hl.includes(i) ? kw(b) : b).join('') + '</span>';
const ones = (s) => s.split('').filter((b) => b === '1').length;

// Do Now 1: odd or even parity of a byte received correctly. Similar bytes, worked by counting, stopping before each
// slide answer.
const WT_A = '11000110', WT_B = '10110000', WT_SENT = '11000010', WT_GOT = '10100010';
assert(ones(WT_A) === 4 && ones(WT_B) === 3 && ones(WT_SENT) === ones(WT_GOT), 'walkthrough bytes');
const idx1 = (s) => s.split('').map((b, i) => (b === '1' ? i : -1)).filter((i) => i >= 0);
const WT_PARITY = { title: 'Walk me through it: odd or even parity', steps: [
  { text: '<strong>A similar question.</strong> These bytes were received correctly. Was each one sent with odd or even parity?', visual: stmt(bits(WT_A)) + stmt(bits(WT_B)) },
  { text: 'Received correctly means nothing changed on the way. So the count of 1s still fits the parity that was used.', visual: note('count the 1s, then match the count to a parity type') },
  { text: 'Count the 1s in the whole byte. The parity bit counts too.', visual: stmt(bits(WT_A, idx1(WT_A))) + note('1, 2, 3, 4') },
  { text: '4 is an even number. So this byte fits the parity type named after even numbers.', visual: stmt(bits(WT_A, idx1(WT_A)) + ' &rarr; 4 ones') },
  { text: 'The second byte: count the 1s again.', visual: stmt(bits(WT_B, idx1(WT_B)) + ' &rarr; 3 ones') },
  { text: '3 is an odd number. So this byte fits the other parity type. Now count the 1s in each byte on your slide.', visual: note('count, then decide: is the count odd or even?') },
] };

// Do Now 2: why a parity check misses a change. A similar swap, with the count shown before and after, stopping before
// the reason.
const WT_SWAP = { title: 'Walk me through it: a change the check misses', steps: [
  { text: '<strong>A similar case.</strong> This byte is sent, and a different byte arrives. The parity check finds no error.', visual: stmt('Sent: ' + bits(WT_SENT)) + stmt('Received: ' + bits(WT_GOT)) },
  { text: 'First find the bits that changed. Bit 2 and bit 3 are different.', visual: stmt('Sent: ' + bits(WT_SENT, [1, 2])) + stmt('Received: ' + bits(WT_GOT, [1, 2])) },
  { text: 'Look closely: bit 2 was 1 and became 0. Bit 3 was 0 and became 1.', visual: stmt('bit 2: 1 &rarr; ' + kw('0')) + stmt('bit 3: 0 &rarr; ' + kw('1')) },
  { text: 'Now count the 1s in each byte, as the receiver does.', visual: stmt('Sent: ' + bits(WT_SENT, idx1(WT_SENT)) + ' &rarr; 3') + stmt('Received: ' + bits(WT_GOT, idx1(WT_GOT)) + ' &rarr; 3') },
  { text: 'A parity check only counts the 1s. It does not look at where each 1 is.', visual: note('3 before, 3 after') },
  { text: 'Your question: do the same with 10110001 and 10110010. Find the bits that changed, count the 1s, and write what you see as your reason.', visual: note('changed bits + the count') },
] };

// Do Now 3: two types, a key, why encryption helps. Worked on parity (two types named by how they differ; a parity bit
// is what it is and what it does) and on Eve, stopping before each answer.
const WT_ENC = { title: 'Walk me through it: types and terms', steps: [
  { text: '<strong>A similar question.</strong> Give two types of parity check.', visual: stmt('Type 1: ?') + stmt('Type 2: ?') },
  { text: 'Ask: how are the types different? With one, the count of 1s must come out odd. With the other, it must come out even.', visual: stmt('count must be odd') + stmt('count must be even') },
  { text: 'Name each type after its difference: odd parity and even parity.', visual: stmt(kw('odd') + ' parity') + stmt(kw('even') + ' parity') },
  { text: 'Your part (a): how are the types of encryption different? One uses a single key that both people share. The other uses two different keys. Write the name of each type.', visual: stmt('one shared key: ?') + stmt('two different keys: ?') },
  { text: '<strong>A similar question.</strong> State what is meant by a parity bit. Say what it is, then what it is used for.', visual: stmt('What is it? ' + kw('an extra bit')) + stmt('What is it for? ' + kw('making the count of 1s odd or even')) },
  { text: 'Your part (b): do the same for a key. What is it made of? Which job does it do in the process?', visual: note('what it is + what it is for') },
  { text: 'Your part (c): Eve intercepts the data on the way. She does not have the key. What does the data look like to her?', visual: stmt('Eve sees: X7#QPA 2!Lw ...') },
] };

// ================================================================ Lesson 2: Do Now
use(L2);
// 0478/13 June 2021 Q6(a): odd; even; even; odd. Q6(b) any one: there is a transposition of bits; bits still add up to
// the correct parity.
const DN1 = ['01111100', '10010000', '10011001', '00101001'];
const DN1_ANS = DN1.map((b) => (ones(b) % 2 ? 'odd' : 'even'));
assert(DN1_ANS.join() === 'odd,even,even,odd', 'June 2021 Q6(a) answers match the mark scheme');
const oddEven = (w) => `^\\s*${w}(\\s+parity)?\\s*\\.?\\s*$`;
const RE_MISSED = '\\b(transpos\\w*|swap\\w*|switch\\w*|interchang\\w*|changed\\s+places|(out\\s+of|wrong|different)\\s+order|two\\s+bits|2\\s+bits|both\\s+bits|even\\s+number\\s+of\\s+(bits|errors|changes)|still\\s+(odd|even|correct|the\\s+same|matches|fits|adds?\\s+up)|still\\s+(has|have|gives?|is)\\s+(an?\\s+)?(odd|even)|same\\s+(number|amount|count)\\s+of\\s+(1|one)s?|parity\\s+(is\\s+)?(still\\s+)?(correct|the\\s+same|unchanged|ok)|adds?\\s+up\\s+to\\s+(the\\s+)?(correct|right|same)|number\\s+of\\s+(1|one)s?\\s+(is|stays|remains|has\\s+not\\s+changed|did\\s*n.?t\\s+change)|(1|one)s?\\s+(count|total)\\s+(is|stays|remains)\\s+(the\\s+)?same)\\b';
steps.push(checkStep('do-now', 'Do Now: Parity (1 of 3)', 'Do Now: Parity (1 of 3)',
  'From 2.2. ' + cite('0478/13, June 2021, Question 6(a)') + ' Four 7-bit binary values are transmitted from one computer to another. A parity bit is added to each binary value creating 8-bit binary values. All the binary values are transmitted and received correctly. Identify whether each 8-bit binary value has been sent using odd or even parity.', [
    ...DN1.map((b, i) => ({ grid: true, label: `${b}`, answer: oddEven(DN1_ANS[i]), feedback: `Count the 1s in ${b}, then decide.` })),
  ], ['Why does the receiver check each byte when it arrives, and not the sender before it leaves?', 'Errors happen on the way. Only the receiver sees what actually arrived.']));
steps[steps.length - 1].walkthrough = WT_PARITY;

steps.push(checkStep('do-now-2', 'Do Now: Parity (2 of 3)', 'Do Now: Parity (2 of 3)',
  'From 2.2. ' + cite('0478/13, June 2021, Question 6(b)') + ' The 8-bit binary value 10110001 is transmitted and received as 10110010. A parity check does not identify any errors in the binary value received.', [
    { line: true, label: 'State why the parity check does not identify any errors.', answer: RE_MISSED, feedback: 'Compare the two bytes. Which bits changed? What happens to the count of 1s?' },
  ], ['A parity check is quick and simple. Why do networks still use other checks as well?', 'No single check finds every error. Using more than one check means fewer errors get through.']));
steps[steps.length - 1].walkthrough = WT_SWAP;

// 0478/13 June 2026 Q2(e)(i): symmetric // synchronous; asymmetric // asynchronous (BOD single key; public and private
// key encryption). 0478/12 June 2026 Q4(c)(ii), one from: a string of characters / numbers used to encrypt data; used by
// an algorithm / cipher to encrypt / decrypt the data (accept "it is an algorithm / cipher").
// 0478/11 June 2022 Q7(d): it makes the data meaningless.
const RE_TYPES = '^(?=.*\\b(symmetric|synchronous|single[\\s-]*key|one[\\s-]*key|shared[\\s-]*key|secret[\\s-]*key)\\b)(?=.*\\b(asymmetric|asynchronous|public|two[\\s-]*keys?)\\b).*$';
const RE_KEY = '^(?!\\s*(no|not|idk)\\b)(?:(?=.*\\b(strings?|characters?|numbers?|values?|code|sequence|digits?|bits?|algorithms?|cipher|password|letters?|data)\\b)(?=.*\\b(encrypt\\w*|decrypt\\w*|scrambl\\w*|unscrambl\\w*|cipher|algorithms?)\\b)|(?=.*\\bused\\b)(?=.*\\b(encrypt\\w*|decrypt\\w*|scrambl\\w*)\\b)).*$';
const RE_MEANINGLESS = '\\b(meaningless|unreadable|unintelligible|gibberish|scrambl\\w*|no\\s+meaning|not\\s+(be\\s+)?(readable|understood|understandable)|(cannot|can.?t|unable\\s+to|could\\s*n.?t|not\\s+able\\s+to)\\s+(be\\s+)?(read|understo+d|understand|make\\s+sense))\\b';
steps.push(checkStep('do-now-3', 'Do Now: Encryption (3 of 3)', 'Do Now: Encryption (3 of 3)',
  'From 2.3. Part (a): ' + cite('0478/13, June 2026, Question 2(e)(i)') + ' Part (b): ' + cite('0478/12, June 2026, Question 4(c)(ii)') +
  ' Part (c): ' + cite('0478/11, June 2022, Question 7(d)'), [
    { marks: 2, label: 'Give two types of encryption that could be used.', answer: RE_TYPES, feedback: 'Two types: one uses one shared key, the other uses two different keys. Name both.' },
    { line: true, label: 'State what is meant by an encryption key.', answer: RE_KEY, feedback: 'Say what a key is made of, and what it is used for.' },
    { line: true, label: 'State how encryption will keep the data more secure.', answer: RE_MEANINGLESS, feedback: 'Someone intercepts the data. What does it look like to them?' },
  ], ['Why do exam questions on encryption reward exact terms, like the ones in the syllabus?', 'An exact term shows the examiner you know the idea. A vague word could mean many things.']));
steps[steps.length - 1].walkthrough = WT_ENC;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-r2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from all of Topic 2: 2.1 Data Transmission, 2.2 Methods of Error Detection and 2.3 Encryption. Stuck? Switch on <strong>I need help</strong>.',
  ['Why mix questions from the last lesson with questions from much earlier ones?', 'Coming back to a topic after a gap helps you remember it for longer. The exam mixes topics too.']));

steps.push({ id: 'title', label: 'Error Detection and Encryption Exam Practice',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Topic 2 Review: Exam Practice 2</p><h2 class="lesson-h2">Error Detection and Encryption</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> real exam questions on error detection and encryption.',
      '<strong>Also:</strong> be the sender and the receiver in ARQ, and fix answers that lose marks.']) +
    why('A question has 5 marks. Why plan five different points before you write?', 'Each mark is for a different point. A plan shows whether you have enough different points, so you do not repeat one.') });

// ================================================================ Lesson 1: Do Now (2.1)
use(L1);
// Do Now 1: the parts of a packet. A parcel sent in three boxes, worked to the two label items, then the jobs of the
// packet's three elements, stopping before every name.
const WT_PACKETS = { title: 'Walk me through it: the parts of a packet', steps: [
  { text: '<strong>A similar question.</strong> A parcel is sent in three boxes. Identify two items of data written on the label of each box.', visual: stmt('Label: ?') + stmt('Label: ?') },
  { text: 'People on the way read the label without opening the box. So the label holds what they, and the receiver, need to know.', visual: note('ask: who reads the label, and what do they need?') },
  { text: 'Item 1: the van driver needs to know where the box is going.', visual: stmt('To: ' + kw('12 Hill Road')) },
  { text: 'Item 2: the receiver needs to know which box is which, to open them in order.', visual: stmt(kw('Box 2 of 3')) },
  { text: 'Your part (i): the header is the label of a packet, and routers read it on the way. Give the network words for the same two kinds of item.', visual: note('where it is going + which packet it is') },
  { text: 'Your part (ii): a packet has three elements. The header comes first. Name the other two from what each one holds.', visual: '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' +
    stmt('<strong>Header</strong><br>the label') + stmt('<strong>?</strong><br>' + kw('the main data')) + stmt('<strong>?</strong><br>' + kw('the error check, at the end')) + '</div>' },
] };

// Do Now 2: not a method, and a drawback. A similar odd-one-out on number systems, then the drawback of parallel worked
// as "what the other method does better", stopping before each answer.
const WT_METHODS = { title: 'Walk me through it: methods of transmission', steps: [
  { text: '<strong>A similar question.</strong> Which of these terms is not a number system?', visual: chips(['binary', 'denary', 'hexadecimal', 'pixel']) },
  { text: 'Ask the same question of every term: what is it?', visual: stmt('binary: base 2') + stmt('denary: base 10 &nbsp;&nbsp; hexadecimal: base 16') + stmt('pixel: ?') },
  { text: 'A pixel is one dot of an image. It is not a way of writing numbers, so it is the odd one out.', visual: stmt(kw('pixel') + ': a dot of an image') },
  { text: 'Your part (a): ask of each term: does it say how the bits travel (how many wires, which direction)? Or does it do a different job?', visual: note('how the bits travel, or another job?') },
  { text: '<strong>A similar question.</strong> State one drawback of using parallel rather than serial data transmission.', visual: stmt('Drawback of parallel: ?') },
  { text: 'A drawback of one method is something the other method does better. Serial sends one bit at a time, so the bits stay in order over a long distance.', visual: stmt('serial does better: ' + kw('bits stay in order over a long way')) },
  { text: 'So a drawback of parallel: over a long distance, its bits can arrive at different times (skew).', visual: stmt('Drawback of parallel: ' + kw('the bits can skew')) },
  { text: 'Your part (b): what does parallel do better than serial? The drawback of serial is the other side of that.', visual: note('what parallel does better &rarr; what serial gives up') },
] };

// 0478/12 March 2023 Q5(a)(i), any two: destination IP / address; packet number; originator's IP / address; error
// detection method. Q5(a)(ii), one mark each: payload; trailer.
const HD = { dest: '\\b(destination|receiver\\W?s?|recipient\\W?s?)\\b', orig: '\\b(originator\\W?s?|origin|sender\\W?s?|source|sending\\s+(device|computer))\\b',
  addr: '\\b(address\\w*|ip)\\b', num: '\\b(packet|sequence)\\W*(number|no)\\b', err: '\\berror\\W+(detection|check\\w*)\\b' };
const RE_HEADER = `^(?!.*\\bpay\\s*-?\\s*load\\b)(?:(?=.*${HD.dest})(?=.*${HD.orig})(?=.*${HD.addr})|(?=.*(${HD.dest}|${HD.orig}))(?=.*${HD.addr})(?=.*(${HD.num}|${HD.err}))|(?=.*${HD.num})(?=.*${HD.err})).*$`;
const RE_PAY_TRAIL = '^(?=.*\\bpay\\s*-?\\s*loads?\\b)(?=.*\\btrailers?\\b).*$';
steps.push(checkStep('do-now-packets', 'Do Now: Packets (1 of 2)', 'Do Now: Packets (1 of 2)',
  'From 2.1. ' + cite('0478/12, March 2023, Question 5(a)') + ' Computer A sends a request for the homepage to a website\'s server. The request is sent using packet switching. The structure of a packet of data has three elements. One element is the packet header.', [
    { line: true, marks: 2, label: 'Identify two items of data contained in a packet header.', answer: RE_HEADER, feedback: 'Two items: what does a router need to send the packet on? What does the receiver need to put the packets in order?' },
    { line: true, marks: 2, label: 'Identify the two other elements of a packet.', answer: RE_PAY_TRAIL, feedback: 'One element holds the main data. One comes at the end and holds the error check. Name both.' },
  ], ['Why does the question say "two items" and give 2 marks?', 'Each item is one mark. Two different items earn the 2 marks, and a third item earns nothing more.']));
steps[steps.length - 1].walkthrough = WT_PACKETS;

// 0478/12 June 2024 Q2(a): D, parity. 0478/13 June 2021 Q6(c)(ii), any one: data transmission can be slower (than
// parallel); additional data may need to be sent.
const RE_NOT_METHOD = '^\\s*(d\\s*[.:\\)-]?\\s*)?parity(\\s+(check|bit))?\\s*\\.?\\s*$|^\\s*d\\s*\\.?\\s*$';
const RE_SLOWER = '^(?!.*\\bparallel\\s+(is\\s+|would\\s+be\\s+)?(slow\\w*|not\\s+as\\s+fast))(?=.*\\b(slow\\w*|not\\s+(as\\s+)?(fast|quick)|less\\s+(fast|quick)|takes?\\s+(more\\s+time|longer)|lower\\s+speed|less\\s+speed|additional\\s+data|extra\\s+data|more\\s+data)\\b).*$';
steps.push(checkStep('do-now-methods', 'Do Now: Methods (2 of 2)', 'Do Now: Methods (2 of 2)',
  'From 2.1. Part (a): ' + cite('0478/12, June 2024, Question 2(a)') + ' Part (b): ' + cite('0478/13, June 2021, Question 6(c)(ii)') + ' The data is sent using serial duplex data transmission.', [
    { grid: true, label: 'Which term is not a method for transmitting data: serial, simplex, parallel or parity?', answer: RE_NOT_METHOD, feedback: 'Ask of each term: does it say how the bits travel? One of them does a different job.' },
    { grid: true, label: 'State one drawback of using serial data transmission, rather than parallel data transmission.', answer: RE_SLOWER, feedback: 'Serial sends one bit at a time. Parallel sends several bits at the same time. What does serial give up?' },
  ], ['Why can a method that is better in one way still have a drawback?', 'Every method gives something up. Being better at one thing often costs something else, so the scenario decides which to use.']));
steps[steps.length - 1].walkthrough = WT_METHODS;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-r-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from all of Topic 2: 2.1 Data Transmission, 2.2 Methods of Error Detection and 2.3 Encryption. Stuck? Switch on <strong>I need help</strong>.',
  ['Why practise questions from the whole topic, not just the last lesson?', 'The exam can ask about any part of the topic, in any order. Mixing topics helps you remember all of it.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Packets and Transmission Methods Exam Practice',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Topic 2 Review: Exam Practice 1</p><h2 class="lesson-h2">Packets and Transmission Methods</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> real exam questions on packets, methods of transmission and USB.',
      '<strong>Also:</strong> choose a transmission method for a scenario and say why, and fix answers that lose marks.']) +
    why('An exam question has 4 marks. Why is one long sentence about one idea not enough?', 'Each mark is for a different point. One idea, said in many ways, still gets one mark.') });

// ---------------------------------------------------------------- command words
steps.push({ id: 'concept-command', label: 'Command Words: What the Question Wants',
  content: '<h2 class="lesson-h2">Command Words: What the Question Wants</h2>' +
    tps('Predict: two students answer "Explain why a file is sent as packets. [2]". One writes one fact. The other writes a fact, then "so ..." and a second fact. Which gets 2 marks? Why?',
      '<p>The second. <strong>Explain</strong> wants a point and the reason or result that follows from it.</p><p>"So" or "because" joins the two marks together.</p>', 'Show the worked answer') +
    columns(facts(['<strong>Identify, State, Give:</strong> a short answer. One point for each mark.',
      '<strong>Describe:</strong> say what happens, step by step.',
      '<strong>Explain:</strong> say what happens <strong>and why</strong>. Use "so" or "because".',
      '<strong>Justify:</strong> choose, then give reasons that fit <strong>this</strong> scenario.',
      'Count the marks: <strong>[3]</strong> means three different points.']),
      '<div style="display:grid;gap:10px">' + stmt('<strong>Explain why a file is sent as packets. [2]</strong>') +
      stmt('If one packet is lost, only that packet is sent again. ' + pill('1 mark', 'good')) +
      stmt('... <strong>so</strong> the whole file does not need to be sent again. ' + pill('1 mark', 'good')) + '</div>') });

// ================================================================ 2.1 Packets
// 0478/11 November 2024 Q4(a). Mark scheme, any four.
steps.push(selfMarked('exam-packet', 'Packets: Describe a Packet', 'Packets: Describe a Packet',
  cite('0478/11, November 2024, Question 4(a)') + ' A company decides to create a network for its devices. The company decides to send data across the network using packet switching.', [
    written('packet-structure', 'An employee sends an email to another employee. The email is broken down into packets. Describe the structure of a packet of data for the email.', 4,
      'It has a header that holds the destination address, and a payload that holds the email data.', 'Any four from',
      ['the data packet has three sections', 'it has a packet header ...', '... that contains data such as the destination address', 'it has a payload ...', '... that contains the main data for the email', 'it has a trailer ...', '... that contains data such as the error detection system used'],
      '0478/11 November 2024 Q4(a)'),
  ], ['Why can a 4-mark describe answer not be a list of names only?', 'A name is one point. Saying what each one holds or does adds more points.']));

// 0478/11 November 2023 Q7. Mark scheme, one mark for each term in the correct order: header; destination address;
// routers; last.
const LIST_P = ['destination address', 'first', 'footer', 'header', 'last', 'main data', 'packets', 'payload', 'routers', 'servers', 'trailer'];
steps.push(checkStep('exam-packet-gaps', 'Packets: Complete the Statements', 'Packets: Complete the Statements',
  cite('0478/11, November 2023, Question 7') + ' Complete the statements about data packets and packet switching. Use the terms from the list. Some of the terms in the list will not be used. You should only use a term once.', [
    { label: 'Gap 1', answer: '^\\s*(a\\s+|the\\s+)?(packet\\s+)?header\\s*\\.?\\s*$', feedback: 'Which part of a packet holds the packet number?' },
    { label: 'Gap 2', answer: '^\\s*(a\\s+|the\\s+)?destination\\s+(ip\\s+)?address\\s*\\.?\\s*$', feedback: 'Where is the packet going? Use the term from the list.' },
    { label: 'Gap 3', answer: '^\\s*(the\\s+)?routers?\\s*\\.?\\s*$', feedback: 'Which devices choose the path of each packet?' },
    { label: 'Gap 4', answer: '^\\s*(the\\s+)?last(\\s+(one|packet))?\\s*\\.?\\s*$', feedback: 'The receiver can only put them in order when it has all of them.' },
  ], ['Why read the whole sentence before you choose a word for a gap?', 'The words before and after a gap tell you what kind of word fits. Some list words fit only one kind of gap.'],
  para(`Data is broken down into packets. A data packet has a packet ${gap(1)} that contains the packet number and the ${gap(2)} . Each packet could take a different path from the sender to the receiver; this is controlled by ${gap(3)} . Packets may arrive out of order. Once the ${gap(4)} packet has arrived, the packets are reordered.`) + chips(LIST_P)));

// 0478/11 June 2025 Q4(c)(ii). Mark scheme, any two.
steps.push(fixStep('fix-packets', 'Packets: Fix the Answer', '0478/11, June 2025, Question 4(c)(ii)',
  'The data for a food order is broken down into packets and sent across the internet to a restaurant kitchen. Explain why the packets of data may need to be reordered.', 2,
  'The packets are sent at different times, so they need to be put back in order.', 0, {
    id: 'fix-reorder', model: 'Each packet can take a different route, and some packets take longer than others.', rule: 'Any two from',
    points: ['the packets arrive in the wrong order', 'each packet could take a different route', 'some packets may take longer than others to be transmitted', 'some packets may not arrive / be corrupted and need to be requested again'],
    source: '0478/11 June 2025 Q4(c)(ii)', why: 'being sent at different times is not the reason, and the rest repeats the question.' },
  ['Why does saying the question again in other words get no marks?', 'It adds no new fact. Each mark needs a reason: a cause or a result.']));

// ================================================================ 2.1 Methods of transmission
// 0478/13 November 2021 Q4(c)(i), four from: bits sent one at a time; down a single wire; data sent in both directions;
// but only one direction at a time. Q4(c)(ii), any two from: simplex only sends data in one direction; so the printer
// may not be able to tell the computer an error has occurred, and the computer may not be able to send the printer the
// document to be printed (any valid contextual answer for MP2).
steps.push(selfMarked('exam-duplex', 'Methods: Serial Half-Duplex', 'Methods: Serial Half-Duplex',
  cite('0478/13, November 2021, Question 4(c)(i)') + ' Frederick prints a document that he has typed. The type of data transmission between the computer and the printer is serial half-duplex data transmission.', [
    written('half-describe', 'Describe how data is transmitted using serial half-duplex data transmission.', 4,
      'Bits are sent one at a time, down a single wire. Data is sent in both directions, but only one direction at a time.', 'Four from',
      ['bits sent one at a time', '... down a single wire', 'data sent in both directions ...', '... but only one direction at a time'], '0478/13 November 2021 Q4(c)(i)'),
  ], ['Why should you plan your points before you write a 4-mark answer?', 'A plan shows whether you have four different points. Without one, it is easy to repeat a point.']));

// 0478/12 March 2023 Q5(b)(ii), one mark each: data goes in both directions; at the same time.
steps.push(fixStep('fix-duplex', 'Methods: Fix the Answer', '0478/12, March 2023, Question 5(b)(ii)',
  'Computer A is connected to a router in a different room. The connection will use full-duplex data transmission. Define full-duplex data transmission.', 2,
  'Data is sent in both directions, but only one direction at a time.', 1, {
    id: 'fix-full', model: 'Data goes in both directions at the same time.', rule: 'One mark each', points: ['data goes in both directions ...', '... at the same time'],
    source: '0478/12 March 2023 Q5(b)(ii)', why: '"one direction at a time" describes half-duplex, not full-duplex.' },
  ['Why are simplex, half-duplex and full-duplex easy to mix up?', 'The names sound alike. Link each name to a picture of which way the data goes.']));

// 0478/12 November 2025 Q5(c)(i): it is sent one bit at a time; it is sent down a single wire.
// Q5(c)(ii), any two from the list below.
steps.push(selfMarked('exam-usb', 'Methods: USB', 'Methods: USB',
  cite('0478/12, November 2025, Question 5(c)(ii)') + ' A computer system has a mouse. The mouse is connected using a universal serial bus (USB) connection.', [
    written('usb-benefits', 'Give two benefits of using a USB connection for this purpose.', 2,
      'The mouse can be powered by the device. The cable cannot be inserted incorrectly.', 'Any two from',
      ['the mouse can be powered by the device', 'it is a universal connection', 'it is backward compatible', 'less chance of skewing // less chance of errors', 'supports different data transmission speeds', 'adequate transmission speeds', 'the cable cannot be inserted incorrectly', 'the device is automatically detected // the driver is automatically installed when the device is connected'],
      '0478/12 November 2025 Q5(c)(ii)'),
  ], ['Why must benefits "for this purpose" fit a mouse, not just any device?', 'The question is about a mouse. A benefit that matters for a mouse shows you applied what you know to the scenario.']));

// ================================================================ 2.1.5 Choosing a transmission method
steps.push({ id: 'concept-choose', label: 'Choosing a Method: Three Questions',
  content: '<h2 class="lesson-h2">Choosing a Method: Three Questions</h2>' +
    tps('Predict: a rain sensor sends readings to a computer in another building. The computer never sends anything back. Which method fits? Why?',
      '<p><strong>Serial simplex.</strong> Another building is far away, so serial: the bits arrive in order.</p><p>Data only goes one way, so simplex.</p>', 'Show the worked answer') +
    columns(facts(['<strong>1. How far?</strong> Far (another room or building, more than about 5 m): <strong>serial</strong>. The bits arrive in order, with less interference.',
      'Very short, and speed matters: <strong>parallel</strong>. It is faster.',
      '<strong>2. Which way?</strong> One way only: <strong>simplex</strong>. Both ways, one at a time: <strong>half-duplex</strong>. Both ways at the same time: <strong>full-duplex</strong>.',
      '<strong>3. Justify:</strong> link every choice to words in the scenario, such as "another room" or "sends back".']),
      '<div style="display:grid;gap:10px;text-align:center">' +
      `<div>${pill('Far away?', 'brand')} <b>&rarr;</b> ${pill('serial')}</div>` +
      `<div>${pill('Very short and fast?', 'brand')} <b>&rarr;</b> ${pill('parallel')}</div>` +
      `<div>${pill('One way only?', 'brand')} <b>&rarr;</b> ${pill('simplex')}</div>` +
      `<div>${pill('Both ways, taking turns?', 'brand')} <b>&rarr;</b> ${pill('half-duplex')}</div>` +
      `<div>${pill('Both ways at once?', 'brand')} <b>&rarr;</b> ${pill('full-duplex')}</div></div>`) });

steps.push({ id: 'compare-choose', label: 'Compare: One Way or Both Ways?',
  content: '<h2 class="lesson-h2">Compare: One Way or Both Ways?</h2>' +
    tps('Both links are long distance, so both use serial. Predict the direction for each one. Which words in the scenario decide it?',
      '<p>Left: "never sends anything back", so <strong>simplex</strong>.</p><p>Right: "both talk ... at the same time", so <strong>full-duplex</strong>.</p>') +
    twoCols(col('A rain sensor on a roof', ['Sends readings to a computer in <strong>another building</strong>.', 'The computer <strong>never sends anything back</strong>.'], 'serial simplex', 'brand'),
      col('A video call', ['The two computers are in <strong>different cities</strong>.', 'Both people <strong>talk at the same time</strong>.'], 'serial full-duplex', 'brand')) +
    facts(['The same distance gives the same first word: serial.', 'Who sends, and when, gives the second word. Quote those words in your reasons.']) });

// 0478/12 March 2023 Q5(b)(i). No mark for the choice; three from for a justification that matches the choice.
steps.push(selfMarked('exam-choose', 'Choosing: Serial or Parallel?', 'Choosing: Serial or Parallel?',
  cite('0478/12, March 2023, Question 5(b)(i)') + ' A website allows users to purchase items. Computer A sends a request for the homepage to the website\'s server. Computer A needs to be directly connected to a router that is located in a different room.', [
    written('choose-wire', 'Choose serial data transmission or parallel data transmission for this connection. Explain the reasons for your choice.', 3,
      'Serial. The router is in another room, so the data travels a longer distance. The data arrives in the order it was sent, and is less likely to have interference.', 'No mark for the choice. Three from, for reasons that match the choice',
      ['serial: data arrives in the order sent // does not need reordering', 'serial: less likely to experience interference', 'serial: ... less likely to have errors', 'serial: can transmit over a longer distance (another room)', 'serial: still fast transmission ...', 'serial: ... sufficient for this purpose',
        'parallel: faster transmission speed than serial', 'parallel: ... faster response to requests', 'parallel: very long connection not needed', 'parallel: ... the next room is (likely) within distance for parallel', 'parallel: ... unlikely to error / arrive out of sequence / skew'],
      '0478/12 March 2023 Q5(b)(i)'),
  ], ['The mark scheme gives no mark for the tick, only for the reasons. Why?', 'Anyone can guess a tick. The reasons show that you know why a method fits.']));

steps.push(embed('activity-1', 'Activity 1: Choose the Method', 'drill-y10-2-r-choose', 'Activity 1: Choose the Method',
  'Read each scenario. Choose the method, then say why it fits. New scenarios every time. Stuck? Switch on <strong>I need help</strong>.',
  ['Why is it not enough to learn "serial is best"?', 'Each scenario is different. A very short, fast link can suit parallel, and the direction depends on who sends and when.']));

// 0478/12 November 2024 Q5(b)(ii). Mark scheme, any three.
steps.push(selfMarked('exam-choose-2', 'Choosing: Why Serial Simplex?', 'Choosing: Why Serial Simplex?',
  cite('0478/12, November 2024, Question 5(b)(ii)') + ' A barcode scanning system uses a check digit to check for errors in data on input. After a barcode is scanned, data is sent to a stock control system to update the stock value stored for that product. The data is sent to the stock control system using serial simplex data transmission.', [
    written('why-serial-simplex', 'Explain why serial simplex is the most appropriate method of data transmission for this purpose.', 3,
      'The stock control system may be a long distance away, and serial is more reliable over a long distance. No reply is needed from the stock control system.', 'Any three from',
      ['the stock control system may be a long distance away', '... parallel should not be used in long distance transmission // serial is more reliable for long distance transmission', 'the data does not need to be sent quickly', '... the increased speed of parallel is not needed', '... as only small amounts of data need to be sent', 'the bits are sent / arrive in order', '... the data will not be skewed // the data could be skewed if parallel was used', '... there will be no data collisions', 'there will be less interference / crosstalk (due to single wire)', '... there will be fewer errors in the data', 'no need for a reply / response from the stock control system', '... half-duplex / full-duplex is not necessary as only one way transmission is needed'],
      '0478/12 November 2024 Q5(b)(ii)'),
  ], ['The method here has two words. Why should your reasons cover both of them?', 'Each word is a separate choice. Reasons for only one of them can leave marks behind.']));

// 0478/11 June 2024 Q4(c). Mark scheme, any three.
steps.push(fixStep('fix-serial', 'Choosing: Fix the Answer', '0478/11, June 2024, Question 4(c)',
  'Data packets are transmitted across a network. Explain why serial data transmission is used to transmit the data packets.', 3,
  'Serial is faster than parallel, and it is cheaper because it uses one wire.', 0, {
    id: 'fix-why-serial', model: 'The network may be spread over a long distance. The bits arrive in sequence, so they are less likely to be skewed.', rule: 'Any three from',
    points: ['the network may be spread over a long distance ...', '... so it is more reliable', 'bits will be sent / arrive in sequence', '... so bits are less likely to be skewed', 'less crosstalk / interference', '... so less likely to have errors', 'the data may not need to be transmitted at a fast speed // the data transmission speed of serial is adequate', 'the cables in the network only use serial transmission'],
    source: '0478/11 June 2024 Q4(c)', why: 'serial is slower than parallel, and "cheaper" is not in the mark scheme.' },
  ['Why is a wrong fact worse than a missing fact?', 'A wrong fact gets no mark and shows the examiner a mix-up. Check each fact before you write it down.']));

steps.push(embed('activity-2', 'Activity 2: Spot and Fix the Mistake', 'drill-y10-2-r-fix', 'Activity 2: Spot and Fix the Mistake',
  'Each student answer about packets or methods of transmission has one mistake. Find it, then type what it should say. Stuck? Switch on <strong>I need help</strong>.',
  ['Why is fixing wrong answers good practice for your own answers?', 'You learn the mistakes examiners see most often, so you can check for them in your own work.']));

// ---------------------------------------------------------------- Lesson 1 checked practice
// (a) 0478/11 November 2023 Q4(a): serial half-duplex; serial full-duplex. (b) 0478/11 November 2024 Q4(b)(iii), any
// one: serial simplex; serial half-duplex; serial full-duplex; parallel simplex; parallel half-duplex.
const RE_TWO_SERIAL = '^(?!.*\\bparallel\\b)(?!.*simplex)(?=.*\\bserial\\b)(?=.*\\bhalf[\\s-]*duplex\\b)(?=.*\\bfull[\\s-]*duplex\\b).*$';
const RE_OTHER_METHOD = '^\\s*(serial\\s+(simplex|half[\\s-]*duplex|full[\\s-]*duplex|duplex)|parallel\\s+(simplex|half[\\s-]*duplex))(\\s+(data\\s+)?transmission)?\\s*\\.?\\s*$';
steps.push(checkStep('practice-methods', 'Practice: Quick Exam Questions', 'Practice: Quick Exam Questions',
  'Part (a): ' + cite('0478/11, November 2023, Question 4(a)') + ' Data is transmitted one bit at a time down a single wire. The computer and the printer can each transmit data to the other, using the same connection. Part (b): ' + cite('0478/11, November 2024, Question 4(b)(iii)'), [
    { line: true, marks: 2, label: 'Name the two data transmission methods that will transmit data in this way.',
      answer: RE_TWO_SERIAL, feedback: 'One bit at a time is serial. Which two direction methods let both devices send?' },
    { label: 'A company chose parallel full-duplex. Give one other method of data transmission it could have chosen.', answer: RE_OTHER_METHOD, feedback: 'Give both parts: serial or parallel, then simplex, half-duplex or full-duplex. Not the one they chose.' },
  ], ['Why do short exam parts need the exact name of a method, not a description of it?', 'Identify and name questions want the name. A description of the method may not get the mark.']));

steps.push(embed('plenary', 'Plenary: Packets and Methods Exam Drill', 'drill-y10-2-r', 'Plenary: Packets and Methods Exam Drill',
  'Real exam questions on packets, methods of transmission and USB. Get each one right three times in a row. Your progress is saved.',
  ['Why do questions keep coming back until you get them right three times in a row?', 'Getting it right once can be luck. Three times in a row shows that you really know it.']));

// ================================================================ Lesson 2: 2.2 Error detection
use(L2);
// 0478/11 November 2023 Q4(b). Mark scheme, any four.
steps.push(selfMarked('exam-parity', 'Error Detection: The Odd Parity Check', 'Error Detection: The Odd Parity Check',
  cite('0478/11, November 2023, Question 4(b)') + ' Data is transmitted between a computer and a printer. An odd parity check is used to detect errors in the data transmission.', [
    written('odd-parity', 'Explain how the odd parity check detects errors.', 4,
      'A parity bit is added to each byte before transmission, to make the number of 1s odd. After transmission the 1s are counted. If the number is even, an error is detected.', 'Any four from',
      ['the number of 1s / 0s are counted', 'a parity bit is added to each byte / 7 bits before transmission', '... to make the sum of the bits / 1s or 0s in each byte odd', 'after transmission, if the number is odd no error is detected', 'after transmission, if the number is even an error is detected'],
      '0478/11 November 2023 Q4(b)'),
  ], ['Why write a process in the order it happens: before sending, then after?', 'Each step in time can be a mark. Going in order helps you not to miss a step.']));

// 0478/11 June 2025 Q4(b)(i). Mark scheme, any five.
steps.push(selfMarked('exam-checksum', 'Error Detection: The Checksum', 'Error Detection: The Checksum',
  cite('0478/11, June 2025, Question 4(b)(i)') + ' A restaurant\'s ordering system transmits each customer\'s order across its network to a computer in the kitchen. A checksum is used to check the data for errors after transmission.', [
    written('checksum-process', 'Describe the process of the checksum error detection method.', 5,
      'The checksum is calculated from the data, using an algorithm. It is transmitted with the data. The receiver recalculates it. If the two values do not match, an error is detected.', 'Any five from',
      ['the checksum is calculated from / using the data', '... using an algorithm // by example', 'the (checksum) value is transmitted with the data', 'the (checksum) value is recalculated after transmission / by the recipient', 'if the checksum values do not match, an error is detected // if the checksum values match, no error is detected ...', '... request for the data to be resent if there is an error'],
      '0478/11 June 2025 Q4(b)(i)'),
  ], ['A checksum and a check digit both calculate a value. Why do they find errors at different times?', 'A check digit checks data when it is entered. A checksum checks data after it is transmitted.']));

steps.push(embed('activity-1', 'Activity 1: Be the Sender, Be the Receiver', 'drill-y10-2-2-l3-arq', 'Activity 1: Be the Sender, Be the Receiver',
  'Be the receiver: check each byte and decide what to send back. Be the sender: decide which packet to send next. New bytes every time. Stuck? Switch on <strong>I need help</strong>.',
  ['Why must the receiver check the data before it sends anything back?', 'What it sends back depends on whether the data arrived safely, so it must find that out first.']));

// 0478/13 November 2022 Q9. Any six from (MAX four for ARQ). The paper says "Automatic Repeat reQuests"; the stem here
// uses the syllabus term.
steps.push(selfMarked('exam-parity-arq', 'Error Detection: Parity Checks and ARQ', 'Error Detection: Parity Checks and ARQ',
  cite('0478/13, November 2022, Question 9') + ' A system uses parity checks and automatic repeat queries (ARQ) to detect and correct errors in the transmission of data.', [
    written('parity-arq', 'Describe how parity checks and ARQ operate together to detect and correct errors.', 6,
      'Even parity is agreed. A parity bit is added to each byte to make the number of 1s even. When the data is sent, a timer is started. If no error is found, a positive acknowledgement is sent. If no acknowledgement arrives before the timeout, the data is resent.', 'Any six from (MAX four for ARQ)',
      ['odd or even parity is set / agreed for the data', 'a parity bit is added to each byte of data', '... to make the number of 1s match the parity', 'data is checked after transmission to see if the parity is correct', 'ARQ uses acknowledgement and timeout', 'if no error is found, a positive acknowledgement is sent to the sender / no acknowledgement is sent to the sender', 'if an error is found, a negative acknowledgement is sent to the sender ...', '... that triggers the data to be resent', 'when the data is sent, a timer is started', 'if an acknowledgement is not received within the time set, the data is resent ...', '... until an acknowledgement is received / the resend limit is reached'],
      '0478/13 November 2022 Q9'),
  ], ['This answer is about two methods. Why plan which marks come from each one?', 'The mark scheme gives at most four marks for ARQ, so you need points about parity too. A plan stops you writing about only one method.']));

// 0478/13 November 2024 Q2(f)(i). Mark scheme as below.
steps.push(fixStep('fix-echo', 'Error Detection: Fix the Answer', '0478/13, November 2024, Question 2(f)(i)',
  'Explain how the echo check is used to check for errors in the email data.', 3,
  "The employer's device sends the data back and checks it. If the copies are the same, there is an error.", 1, {
    id: 'fix-echo-check', model: 'A copy is sent back to the sender. The sender compares it with the data sent. If they do not match, there is an error.', rule: 'One mark each',
    points: ['a copy of the data is sent back to the employee\'s device / the sender', 'the employee\'s device / the sender compares the data sent to the data received back', 'if the original and the copy do not match, an error has occurred'],
    source: '0478/13 November 2024 Q2(f)(i)', why: 'the sender compares, not the receiver, and an error is when the copies do NOT match.' },
  ['Why check a student answer one sentence at a time?', 'One sentence can be right and the next one wrong. That shows where the marks are lost.']));

// 0478/11 November 2021 Q3(a), one mark per row: parity check; check digit; checksum and check digit; parity check;
// checksum (parity check also accepted).
const M = { sum: 'check\\s*-?\\s*sums?', digit: 'check\\s*-?\\s*digits?', parity: 'parity' };
steps.push(checkStep('exam-methods', 'Error Detection: Which Method?', 'Error Detection: Which Method?',
  cite('0478/11, November 2021, Question 3(a)') + ' For each statement, type the method or methods it applies to: checksum, check digit or parity check. Some apply to more than one.', [
    { grid: true, label: 'uses an additional bit to create an odd or even number of 1s', answer: `^(?!.*${M.sum})(?!.*${M.digit})(?=.*${M.parity}).*$`, feedback: 'Which method adds one extra bit?' },
    { grid: true, label: 'checks for errors on data entry', answer: `^(?!.*${M.sum})(?!.*${M.parity})(?=.*${M.digit}).*$`, feedback: 'Which method checks a number when it is typed in or scanned?' },
    { grid: true, label: 'compares two calculated values to see if an error has occurred', answer: `^(?!.*${M.parity})(?=.*${M.sum})(?=.*${M.digit}).*$`, feedback: 'Which methods calculate a value, then calculate it again and compare? There is more than one.' },
    { grid: true, label: 'will not detect transposition errors', answer: `^(?!.*${M.sum})(?!.*${M.digit})(?=.*${M.parity}).*$`, feedback: 'If two bits swap places, which method still sees the right count?' },
    { grid: true, label: 'sends additional values when data is transmitted from one computer to another', answer: `^(?!.*${M.digit})(?=.*${M.sum}).*$`, feedback: 'Which method sends a calculated value with the transmitted data?' },
  ], ['Why test each statement against every method?', 'Some statements fit more than one method. Testing each one stops you missing one.']));

steps.push(embed('activity-2', 'Activity 2: Spot and Fix the Mistake', 'drill-y10-2-r2-fix', 'Activity 2: Spot and Fix the Mistake',
  'Each student answer about error detection or encryption has one mistake. Find it, then type what it should say. Stuck? Switch on <strong>I need help</strong>.',
  ['Why is fixing wrong answers good practice for your own answers?', 'You learn the mistakes examiners see most often, so you can check for them in your own work.']));

// ================================================================ 2.3 Encryption
// 0478/11 November 2022 Q4(b)(ii). One from: same key; any three from the rest.
steps.push(selfMarked('exam-symmetric', 'Encryption: Symmetric Encryption', 'Encryption: Symmetric Encryption',
  cite('0478/11, November 2022, Question 4(b)(ii)') + ' Rebekah decides to encrypt the data that she transmits whilst using the Internet. She does this to keep the data safe. The data is encrypted using symmetric encryption.', [
    written('symmetric-describe', 'Describe how the data is encrypted using symmetric encryption.', 4,
      'The data is encrypted and decrypted using the same key. Plain text is encrypted into cipher text. The key is sent to the receiver.', 'One from the first point, then any three from the rest',
      ['data is encrypted and decrypted using the same key / algorithm', 'data before encryption is known as plain text', 'data after encryption is known as cypher text', 'the key is sent to the receiver (to allow the data to be decrypted) // values are sent to the receiver that are used to generate the key'],
      '0478/11 November 2022 Q4(b)(ii)'),
  ], ['Why can "the data is scrambled" on its own not get full marks here?', 'It is true, but it is one general idea. Each mark needs a different, exact fact that uses the right terms.']));

// 0478/13 November 2024 Q2(g)(iii). Mark scheme, any two.
steps.push(fixStep('fix-encryption', 'Encryption: Fix the Answer', '0478/13, November 2024, Question 2(g)(iii)',
  'Give two differences between symmetric encryption and asymmetric encryption.', 2,
  'Symmetric encryption is more secure. Asymmetric encryption scrambles the data.', 0, {
    id: 'fix-differences', model: 'Symmetric uses one key, whereas asymmetric uses two keys. Symmetric decrypts with the same key, whereas asymmetric decrypts with a different key.', rule: 'Any two from',
    points: ['symmetric uses one / public key whereas asymmetric uses two / public and private keys', 'symmetric can send the key with the data whereas asymmetric does not', 'symmetric decrypts the data using the same key whereas asymmetric decrypts the data using a different key', 'symmetric is less secure than asymmetric'],
    source: '0478/13 November 2024 Q2(g)(iii)', why: 'symmetric is less secure, and both methods scramble the data, so that is not a difference.' },
  ['Why does the word "whereas" help in a difference answer?', 'It joins what one method does to what the other does instead, so the examiner sees the contrast.']));

// ---------------------------------------------------------------- checked practice
// (a) 0478/11 November 2023 Q4(c): echo (check). (b) 0478/11 June 2025 Q4(b)(ii), any one: parity byte / block check;
// echo check. (c) 0478/12 June 2026 Q4(c)(iii): cipher / cypher text (BOD cipher alone or cipher data).
const RE_ECHO = '^\\s*(an?\\s+|the\\s+)?echo(\\s+check(ing)?)?\\s*\\.?\\s*$';
const RE_OTHER_CHECK = '^(?!.*check\\s*-?\\s*(sum|digit))(?=.*\\b(parity|echo)\\b).*$';
const RE_CIPHER = '^\\s*(the\\s+|a\\s+)?(ciph|cyph)er(\\s*-?\\s*(text|data))?\\s*\\.?\\s*$';
steps.push(checkStep('practice', 'Practice: Quick Exam Questions', 'Practice: Quick Exam Questions',
  'Part (a): ' + cite('0478/11, November 2023, Question 4(c)') + ' Data is sent from a computer to a printer, then a copy of the data received is sent back to the computer. The two sets of data are compared. Part (b): ' + cite('0478/11, June 2025, Question 4(b)(ii)') + ' Part (c): ' + cite('0478/12, June 2026, Question 4(c)(iii)'), [
    { grid: true, label: 'State the name of this error detection method.', answer: RE_ECHO, feedback: 'The data comes back, like a sound off a wall.' },
    { grid: true, label: 'A checksum is used. Identify one other error detection method that could be used to check for errors in the data.', answer: RE_OTHER_CHECK, feedback: 'Name a method that checks data after transmission, not when it is typed in.' },
    { grid: true, label: 'The data that is transmitted is encrypted. State the name given to the encrypted data.', answer: RE_CIPHER, feedback: 'Plain text is the data before encryption. What is it called after?' },
  ], ['Why does a question say "one other" method?', 'A method already named in the question gets no mark. You must give a different one.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Error Detection and Encryption Exam Drill', 'drill-y10-2-r2', 'Plenary: Error Detection and Encryption Exam Drill',
  'Real exam questions on error detection and encryption. Get each one right three times in a row. Your progress is saved.',
  ['Why do questions keep coming back until you get them right three times in a row?', 'Getting it right once can be luck. Three times in a row shows that you really know it.']));

// ---------------------------------------------------------------- self-checks
const VL = (L, k) => L.validators[`${L.P}_${k}`.replace(/-/g, '_')];
const lessonOf = (k) => (VL(L1, k) ? L1 : L2);
const V = (k) => VL(lessonOf(k), k);
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
// Step ids shared by both lessons (title, do-now-ext, activity-2, plenary) carry no validators, so lessonOf is safe.
ok('do-now-packets', 0, ['destination address and packet number', 'the IP address of the sender and the destination', 'Destination IP, packet number', 'sender address, receiver address', 'packet number and error detection method', 'originator IP address and sequence number'],
  ['payload and trailer', 'IP address', 'destination address', 'packet number and payload', 'the data and the address', 'header and trailer']);
ok('do-now-packets', 1, ['payload and trailer', 'The payload, the trailer', 'Trailer and pay load'], ['payload', 'trailer and footer', 'header and payload', 'body and footer', 'data and trailer']);
ok('do-now-methods', 0, ['parity', 'D', 'D parity', 'Parity check', 'd.'], ['serial', 'simplex', 'parallel', 'A', 'C', 'parallel and parity']);
ok('do-now-methods', 1, ['it is slower', 'data transmission can be slower than parallel', 'it is not as fast', 'additional data may need to be sent', 'it takes longer to send the data', 'slower'], ['it is faster', 'parallel is slower', 'more interference', 'the bits can skew', 'it uses one wire']);
ok('practice-methods', 0, ['serial half-duplex and serial full-duplex', 'Serial full duplex, serial half duplex', 'serial halfduplex and serial fullduplex'], ['serial simplex and serial half-duplex', 'parallel half-duplex and parallel full-duplex', 'half-duplex', 'serial half-duplex']);
ok('practice-methods', 1, ['serial simplex', 'Serial half-duplex', 'serial full duplex', 'parallel simplex', 'parallel half-duplex transmission'], ['parallel full-duplex', 'serial', 'simplex', 'parallel', 'packet switching']);
ok('practice', 2, ['cipher text', 'Cypher text', 'cipher', 'the ciphertext', 'cipher data'], ['plain text', 'encrypted', 'key', 'code']);
ok('do-now', 0, ['odd', 'Odd parity', 'ODD.'], ['even', 'odd or even', '5']);
ok('do-now', 1, ['even', 'Even parity'], ['odd', 'uneven']);
ok('do-now-2', 0, ['there is a transposition of bits', 'two bits swapped places', 'the bits still add up to the correct parity', 'the number of 1s is still the same', 'two bits changed so the parity is still correct', 'the bits are in the wrong order', 'it still has an even number of 1s', 'an even number of bits changed'],
  ['there is an error', 'the parity bit is wrong', 'it was sent wrong', 'the data is corrupted', 'one bit changed']);
ok('do-now-3', 0, ['symmetric and asymmetric', 'Asymmetric, symmetric', 'symmetric encryption and asymmetric encryption', 'synchronous and asynchronous', 'single key and public key encryption'], ['symmetric', 'asymmetric', 'asymmetric and asymmetric', 'SSL and TLS', 'public']);
ok('do-now-3', 1, ['a string of characters used to encrypt data', 'numbers used by the algorithm to encrypt the data', 'it is an algorithm', 'a value used to scramble the data', 'it is used to decrypt the data', 'a password used to encrypt'], ['a key', 'it opens a door', 'not sure', 'the data']);
ok('do-now-3', 2, ['it makes the data meaningless', 'the data cannot be understood if it is stolen', 'it is unreadable without the key', 'it scrambles the data', "hackers can't read it"], ['it makes it secure', 'it stops hackers', 'it hides the data', 'it can be read']);
ok('exam-packet-gaps', 0, ['header', 'packet header', 'the header'], ['trailer', 'payload', 'footer']);
ok('exam-packet-gaps', 1, ['destination address', 'the destination IP address'], ['main data', 'address', 'destination']);
ok('exam-packet-gaps', 2, ['routers', 'router'], ['servers', 'switches']);
ok('exam-packet-gaps', 3, ['last', 'the last packet'], ['first', 'final word']);
ok('exam-methods', 0, ['parity check', 'parity'], ['checksum', 'parity check and checksum', 'check digit']);
ok('exam-methods', 1, ['check digit', 'Check digits'], ['checksum', 'parity check', 'check digit and checksum']);
ok('exam-methods', 2, ['checksum and check digit', 'check digit, checksum', 'check sum and check digit'], ['checksum', 'check digit', 'checksum, check digit and parity check']);
ok('exam-methods', 3, ['parity check'], ['checksum', 'check digit', 'parity and checksum']);
ok('exam-methods', 4, ['checksum', 'checksum and parity check', 'check sum'], ['parity check', 'check digit', 'checksum and check digit']);
ok('practice', 0, ['echo check', 'Echo', 'an echo check'], ['checksum', 'parity check', 'ARQ']);
ok('practice', 1, ['parity check', 'echo check', 'parity block check', 'Even parity byte check'], ['checksum', 'check digit', 'ARQ', 'encryption']);
// Do Now walkthroughs: no step, as plain text (alone or with its picture), passes any part on its slide.
{
  const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  [...L1.steps, ...L2.steps].filter((s) => s.type === 'short-answer-validation' && /^do-now/.test(s.id)).forEach((s) => {
    assert(s.walkthrough && s.walkthrough.steps.length >= 6, `${s.id} has a walkthrough`);
    V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
      [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${s.id} walkthrough step ${n + 1} passes part ${'abcde'[i]}: ${plain(part)}`));
    }));
  });
  const wt1 = plain(JSON.stringify(WT_PARITY));
  DN1.forEach((b) => assert(!wt1.includes(b), `parity walkthrough shows Do Now byte ${b}`));
  assert(!/transpos|swap|same number|changed places|two bits/i.test(plain(JSON.stringify(WT_SWAP))), 'swap walkthrough gives the reason');
  assert(!/\b(a)?symmetric|synchronous|meaningless|unreadable|string of|characters/i.test(plain(JSON.stringify(WT_ENC))), 'encryption walkthrough names a Do Now answer');
  assert(!/pay\s*load|trailer|destination|packet number|sequence number|originator|sender|source|error detection/i.test(plain(JSON.stringify(WT_PACKETS))), 'packets walkthrough names a Do Now answer');
  assert(!/\bparity\b|slow|not as fast|longer|additional data|extra data|more data/i.test(plain(JSON.stringify(WT_METHODS))), 'methods walkthrough names a Do Now answer');
}
// Lesson 1 keeps the old lesson's step ids for every slide it kept (saved answers stay on their slides). New: the 2.1
// Do Now and the Lesson 1 practice slide.
const OLD_IDS = ['do-now', 'do-now-2', 'do-now-3', 'do-now-ext', 'title', 'concept-command', 'exam-packet', 'exam-packet-gaps', 'fix-packets', 'exam-serial', 'exam-duplex', 'exam-duplex-2', 'fix-duplex', 'exam-usb', 'concept-choose', 'compare-choose', 'exam-choose', 'activity-1', 'exam-choose-2', 'exam-choose-3', 'fix-serial', 'exam-parity', 'exam-checksum', 'exam-parity-arq', 'fix-echo', 'exam-methods', 'activity-2', 'exam-symmetric', 'fix-encryption', 'practice', 'practice-2', 'plenary'];
L1.steps.forEach((s) => assert(OLD_IDS.includes(s.id) || ['do-now-packets', 'do-now-methods', 'practice-methods'].includes(s.id), `lesson 1 step ${s.id} is new`));
['do-now', 'do-now-2', 'do-now-3', 'practice'].forEach((id) => assert(!L1.steps.some((s) => s.id === id), `lesson 1 reuses ${id} for a different question`));
[L1, L2].forEach((L) => assert(new Set(L.steps.map((s) => s.id)).size === L.steps.length, `${L.id} step ids unique`));
// Every written part carries a mark scheme (at most 12 points, at least as many as marks), a context and a source.
[...L1.steps, ...L2.steps].filter((s) => s.type === 'self-marked-response').forEach((s) => s.items.forEach((it) => {
  assert(Array.isArray(it.scheme) && it.scheme.length >= it.marks && it.scheme.length <= 12 && it.id && it.context && !/[<>]/.test(it.context), `${s.id}/${it.id} mark scheme`);
  assert(/^0478\/1[123] /.test(it.source), `${s.id}/${it.id} source`);
}));

// ---------------------------------------------------------------- drills
const drillHead = (id, about) => `// Year 10, 2.R Data Transmission Exam Practice. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y10_2_r.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()})()\n});\n`;

// ---- Do Now Extension: all of Topic 2. Every card has an example on different details and two nudges.
function extCards() {
  function word(w) { return new RegExp("^\\s*(the\\s+|a\\s+|an\\s+)?" + w + "\\s*\\.?\\s*$", "i"); }
  function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
  var NAMES = ["Ana", "Ben", "Chen", "Dara", "Femi", "Hana", "Ivan", "Lina", "Omar", "Rosa"];
  return [
    // ------------------------------------------------ Data Transmission (2.1)
    { id: "ex-01", category: "ex-trans", prompt: "Identify two items of data contained in a packet header.", answers: ["Destination address and packet number"],
      keywords: [/^(?!.*\bpayload\b)(?:(?=.*\b(destination|receiver\W?s?|recipient\W?s?)\b)(?=.*\b(sender\W?s?|source|origin\w*|from)\b)(?=.*\b(address\w*|ip)\b)|(?=.*\b(destination|receiver\W?s?|recipient\W?s?|sender\W?s?|source|origin\w*)\b)(?=.*\b(address\w*|ip)\b)(?=.*\b(packet|sequence)\W?s?\s+(number|no)\b)).*$/i],
      distractors: ["Payload and trailer", "Payload and packet number", "Error check and payload"],
      example: "Example question: a parcel is sent in three boxes. Name two things written on each label.\nStep 1: the van driver never opens a box, so the label must say where the box is going: To: 12 Hill Road.\nStep 2: the receiver must know which box is which, so the label also says: Box 2 of 3.\nStep 3: a packet header is the label of a packet. Give the network words for the same two things.",
      working: ["Where is the packet going? That is written in the header.", "The receiver puts the packets in order. What does it need on each one?"],
      note: "Any two: destination address, originator (sender) address, packet number." },
    { id: "ex-02", category: "ex-trans", randomize: function () {
        var s = drillPick([["A weather sensor sends readings to a computer in another building.", "Serial"], ["Two chips on one circuit board, 2 cm apart, send data as fast as possible.", "Parallel"], ["A computer sends a file to a printer 40 metres away.", "Serial"], ["Data moves between two parts inside a phone, millimetres apart, and speed is very important.", "Parallel"]]);
        return { prompt: s[0] + " Should it use serial or parallel transmission?", answers: [s[1]], keywords: [word(s[1].toLowerCase())],
          distractors: [s[1] === "Serial" ? "Parallel" : "Serial"],
          example: "Example: a cable runs 500 metres between two offices.\nStep 1: one method sends several bits at once, down several wires.\nStep 2: over a long cable, bits on different wires arrive at slightly different times (skew).\nStep 3: the other method sends one bit at a time down one wire, so the bits stay in order.\nRule: far = one bit at a time. Very short and fast = several bits at once.",
          working: ["Is the distance long, or very short?", "Over a long cable, bits sent side by side can arrive at different times."],
          note: s[1] + ". " + (s[1] === "Serial" ? "Over a long distance, one bit at a time keeps the bits in order: no skew." : "Over a very short distance, several bits at once is fastest.") };
      } },
    { id: "ex-03", category: "ex-trans", prompt: "Data can travel in both directions, but only in one direction at a time. Name this method of data transmission.", answers: ["Half-duplex"],
      keywords: [/^\s*(serial\s+|parallel\s+)?half[\s-]*duplex(\s+(data\s+)?transmission)?\s*\.?\s*$/i],
      distractors: ["Full-duplex", "Simplex", "Parallel"],
      example: "Example question: cars cross a narrow bridge with one lane. Cars can cross from either side, but must take turns.\nStep 1: can traffic go both ways? Yes, from either side.\nStep 2: can it go both ways at the same moment? No, they take turns.\nStep 3: the data method that matches is the one whose name means 'half' of a two-way link.\nNow your question: both ways, one at a time.",
      working: ["Simplex is one way only. This data goes both ways.", "It cannot go both ways at the same time. Which duplex is that?"],
      note: "Half-duplex: both directions, but one direction at a time." },
    { id: "ex-04", category: "ex-trans", prompt: "Give one benefit of using a USB connection to connect a device to a computer.", answers: ["The device is detected automatically"],
      keywords: [/\b(automatic\w*|detect\w*|driver\w*|power\w*|charg\w*|universal|standard|backward\w*|compatib\w*|one\s+way|only\s+fits?|cannot\s+be\s+(put|inserted|plugged)|can.?t\s+be\s+(put|inserted|plugged)|incorrect\w*|wrong\s+way|skew\w*|speeds?)\b/i],
      distractors: ["It sends many bits at the same time", "It works over 100 metres", "It encrypts the data"],
      example: "Example question: give one benefit of a lamp with a plug, instead of wires joined by hand.\nStep 1: think about what happens when you plug it in: it works in any socket in the building.\nStep 2: think about what you do not have to do: no tools, no set up.\nStep 3: write one of those as one clear benefit.\nNow your question: what does the computer do by itself when a USB device is plugged in? What does the cable carry, besides data?",
      working: ["What does the computer do by itself when a USB device is plugged in?", "Besides data, what else can a USB cable carry to the device?"],
      note: "Any one: detected automatically; driver loaded automatically; supplies power; universal (standard) connection; only fits one way; backward compatible." },
    // ------------------------------------------------ Methods of Error Detection (2.2)
    { id: "ex-05", category: "ex-errors", format: "Type 0 or 1", randomize: function () {
        var mode = drillPick(["even", "odd"]), b = [];
        for (var i = 0; i < 7; i++) b.push(Math.random() < 0.5 ? "1" : "0");
        var d = b.join(""), n = ones(d), p = (n % 2 === 0) === (mode === "even") ? "0" : "1";
        var e = mode === "even" ? "1011000" : "1100100", en = ones(e);
        return { prompt: (mode === "even" ? "Even" : "Odd") + " parity is used. The parity bit is sent first. What is the parity bit for the 7 bits " + d + "?", answers: [p],
          keywords: [new RegExp("^\\s*" + p + "\\s*\\.?\\s*$")], distractors: [p === "1" ? "0" : "1"],
          example: "Example: " + mode + " parity, 7 bits " + e + ".\nStep 1: count the 1s: " + en + ".\nStep 2: " + mode + " parity means the whole byte, parity bit included, must have an " + mode + " number of 1s.\nStep 3: " + en + " is " + (en % 2 === 0 ? "even" : "odd") + ", so the parity bit is " + ((en % 2 === 0) === (mode === "even") ? "0" : "1") + ". The byte is " + ((en % 2 === 0) === (mode === "even") ? "0" : "1") + e + ".",
          working: ["Count the 1s in the 7 bits.", "Will the count already be " + mode + ", or must the parity bit add to it?"],
          note: d + " has " + n + " ones. With " + mode + " parity the parity bit is " + p + ", so the byte is " + p + d + "." };
      } },
    { id: "ex-06", category: "ex-errors", prompt: "In an echo check, which device compares the two copies of the data: the sender or the receiver?", answers: ["Sender"],
      keywords: [/^\s*(the\s+)?(sender|sending\s+(device|computer)|original\s+(device|computer))\s*\.?\s*$/i],
      distractors: ["The receiver", "The router", "Both devices"],
      example: "Example question: you read a phone number to a friend, and they read it back to you. Who can tell if it went wrong?\nStep 1: only one person still has the number as it was first said.\nStep 2: that person hears the copy that came back.\nStep 3: that person puts the two side by side.\nNow your question: who still has the original data?",
      working: ["The data is sent, then a copy comes back. Where does the copy go to?", "Who still has the original data to compare with?"],
      note: "The sender: it compares the copy that comes back with the original data it sent." },
    { id: "ex-07", category: "ex-errors", prompt: "In ARQ, the sender does not receive an acknowledgement before the timeout. What happens next?", answers: ["The data is sent again"],
      keywords: [/\b(resen\w*|re-?sent|sent\s+again|sends?\s+(it\s+)?again|retransmit\w*|transmit\w*\s+(it\s+)?again|repeat\w*|sends?\s+(the\s+)?(data|packet)\s+again)\b/i],
      distractors: ["The receiver deletes it", "A check digit is added", "Nothing happens"],
      example: "Example question: you send a friend a message and ask them to reply 'got it'. After ten minutes there is still no reply. What do you do?\nStep 1: no reply means you cannot be sure the message arrived.\nStep 2: waiting forever does not help.\nStep 3: you do the one thing that makes sure the message gets there.\nNow your question: no acknowledgement before the timeout. What does the sender do with the data?",
      working: ["No acknowledgement means the sender does not know if the data arrived safely.", "What must the sender do so the data still gets there?"],
      note: "The data is resent, until an acknowledgement is received." },
    { id: "ex-08", category: "ex-errors", prompt: "A check digit is used to find errors at one time. When: on data entry, or after transmission?", answers: ["On data entry"],
      keywords: [/\b(entry|enter\w*|input\w*|typ\w*|scann\w*|keyed|keying)\b/i],
      distractors: ["After transmission", "During compression", "During encryption"],
      example: "Example question: a shop worker copies a price from a label into a till by hand. When could a mistake happen?\nStep 1: the number is correct on the label.\nStep 2: the mistake can only happen at the moment the person copies it across.\nStep 3: so a check for that kind of mistake must happen at that moment.\nNow your question: a check digit finds mistakes such as two digits the wrong way round. When are those mistakes made?",
      working: ["A check digit finds mistakes such as 12345 becoming 12435.", "When does a person put a number into a computer?"],
      note: "On data entry, when the number is typed in or scanned." },
    // ------------------------------------------------ Encryption (2.3)
    { id: "ex-09", category: "ex-enc", format: "Type whose key and which key, for example: Rosa's private key", randomize: function () {
        var a = drillPick(NAMES), b = drillPick(NAMES.filter(function (n) { return n !== a; })), c = drillPick(NAMES.filter(function (n) { return n !== a && n !== b; }));
        return { prompt: a + " encrypts a message for " + b + " using asymmetric encryption, with " + b + "'s public key. Which key decrypts it?", answers: [b + "'s private key"],
          keywords: [new RegExp("^\\s*(the\\s+)?(" + b + "\\W?s?\\s+private(\\s*-?\\s*key)?|private\\s+key\\s+(of|from|belonging\\s+to)\\s+" + b + ")\\s*\\.?\\s*$", "i")],
          distractors: [b + "'s public key", a + "'s private key", a + "'s public key"],
          example: "Example: " + c + "'s public key was used to encrypt a message.\nStep 1: a public key can only encrypt. It cannot decrypt.\nStep 2: each public key has one partner key that decrypts.\nStep 3: that partner key belongs to the same person, and only they have it.\nSo here: the key that decrypts is " + c + "'s other key.",
          working: ["A public key cannot decrypt.", "Whose public key was used? Which of that person's keys matches it?"],
          note: b + "'s private key: it is the only key that decrypts data encrypted with " + b + "'s public key." };
      } },
    { id: "ex-10", category: "ex-enc", prompt: "Symmetric encryption is used. Why is sending the key to the receiver a weak point?", answers: ["The key could be intercepted, and then the data can be decrypted"],
      keywords: [/^(?=.*\b(intercept\w*|stolen|steal\w*|copied|hack\w*|someone|anyone|eve|attackers?|caught|see\w*)\b)(?=.*\b(decrypt\w*|read\w*|unlock\w*|understand|access\w*|key)\b).*$/i],
      distractors: ["The key makes the data larger", "The key is too long to send", "The key is sent in parallel"],
      example: "Example question: you post a locked box to a friend, with its key taped to the lid. Why is that risky?\nStep 1: a thief can open a parcel on the way.\nStep 2: the thief finds what is taped to the lid.\nStep 3: with it, the thief opens the box.\nNow your question: what could happen to the secret on the way, and what could that person then do?",
      working: ["Anything sent across a network can be intercepted.", "If a person has that, what can they do with the cipher text?"],
      note: "The key could be intercepted on the way, and whoever has it can decrypt the data." }
  ];
}

// ---- Exam Practice 2, Do Now Extension: all of Topic 2, a different selection from Exam Practice 1's. Every card has
// an example on different details and two nudges.
function ext2Cards() {
  function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var NAMES = ["Ana", "Ben", "Chen", "Dara", "Femi", "Hana", "Ivan", "Lina", "Omar", "Rosa"];
  var SC = [
    ["A sensor in a field sends readings to a farm computer 300 metres away. The computer never sends anything back.", "serial", "simplex"],
    ["Two people in different countries talk to each other on a video call at the same time.", "serial", "full-duplex"],
    ["Two chips 2 cm apart on one circuit board send data one way only, as fast as possible.", "parallel", "simplex"],
    ["A computer sends work to a printer in another room. The printer replies 'out of paper', but never while it is receiving.", "serial", "half-duplex"]
  ];
  var DRE = { "simplex": "simplex", "half-duplex": "half[\\s-]*duplex", "full-duplex": "full[\\s-]*duplex" };
  return [
    // ------------------------------------------------ Data Transmission (2.1)
    { id: "e2-01", category: "e2-trans", format: "Type serial or parallel, then simplex, half-duplex or full-duplex", randomize: function () {
        var s = drillPick(SC), other = s[1] === "serial" ? "parallel" : "serial";
        var notDir = Object.keys(DRE).filter(function (k) { return k !== s[2]; }).map(function (k) { return "(?!.*\\b" + DRE[k] + "\\b)"; }).join("");
        var dirs = Object.keys(DRE).filter(function (k) { return k !== s[2]; });
        return { prompt: s[0] + "\nWhich method of data transmission fits best?", answers: [cap(s[1]) + " " + s[2]],
          keywords: [new RegExp("^(?!.*\\b" + other + "\\b)" + notDir + "(?=.*\\b" + s[1] + "\\b)(?=.*\\b" + DRE[s[2]] + "\\b).*$", "i")],
          distractors: [cap(other) + " " + s[2], cap(s[1]) + " " + dirs[0], cap(s[1]) + " " + dirs[1]],
          example: "Example: a doorbell camera at the gate sends video to a screen in the house, 40 metres away. Nothing is sent back.\nStep 1: how far? 40 metres is a long way, so send one bit at a time: the bits stay in order.\nStep 2: which way? Video only goes from the camera to the screen: one way only.\nStep 3: name the method with two words: the word for one bit at a time, then the word for one way only.",
          working: ["How far does the data go? Far: one bit at a time. Very short and fast: several bits at once.", "Who sends? One way only, both ways taking turns, or both ways at once?"],
          note: cap(s[1]) + " " + s[2] + "." };
      } },
    { id: "e2-02", category: "e2-trans", prompt: "Name the part of a packet that holds the main data, such as part of an email.", answers: ["Payload"],
      keywords: [/^\s*(the\s+)?pay\s*-?\s*load\s*\.?\s*$/i], distractors: ["Header", "Trailer", "Router"],
      example: "Example question: name the part of a packet that holds the destination address.\nStep 1: a packet has three parts: one at the front, one in the middle, one at the end.\nStep 2: the address is read on the way, like the label on a parcel, so it is at the front.\nStep 3: the part at the front is the header.\nNow your question: the main data is not the label. Which part sits in the middle?",
      working: ["A packet has a header, a middle part and a trailer.", "The middle part carries the load of the packet: the data itself."],
      note: "The payload holds the main data. The header holds the addresses and the packet number. The trailer comes at the end." },
    { id: "e2-03", category: "e2-trans", prompt: "Give one reason why parallel data transmission is not used over a long distance.", answers: ["The bits can be skewed"],
      keywords: [/\b(skew\w*|out\s+of\s+(order|step|sync\w*)|wrong\s+order|different\s+times|interfer\w*|crosstalk|errors?|corrupt\w*)\b/i],
      distractors: ["It is too slow", "It sends one bit at a time", "It only goes one way"],
      example: "Example question: give one reason why serial data transmission is not used inside a chip, where speed matters most.\nStep 1: serial sends one bit at a time, down one wire.\nStep 2: compared with several bits at once, that takes more time.\nStep 3: so the reason is about speed.\nNow your question: several bits travel side by side down a long cable. Do they all arrive together?",
      working: ["Parallel sends several bits at the same time, down several wires.", "Over a long cable, do bits on different wires all arrive at the same moment?"],
      note: "Over a long distance the bits on the different wires can skew: they arrive at different times, out of order. There is also more interference." },
    // ------------------------------------------------ Methods of Error Detection (2.2)
    { id: "e2-04", category: "e2-errors", format: "Type yes or no", randomize: function () {
        var mode = drillPick(["even", "odd"]), b = [];
        for (var i = 0; i < 8; i++) b.push(Math.random() < 0.5 ? "1" : "0");
        var d = b.join(""), n = ones(d), fits = (n % 2 === 0) === (mode === "even"), a = fits ? "No" : "Yes";
        var ex = mode === "even" ? "10110101" : "10010110", en = ones(ex);
        return { prompt: cap(mode) + " parity is used. This byte arrives: " + d + "\nIs an error detected: yes or no?", answers: [a],
          keywords: [new RegExp("^\\s*" + a + "\\b", "i")], distractors: [fits ? "Yes" : "No"],
          example: "Example: " + mode + " parity is used. The byte " + ex + " arrives.\nStep 1: count the 1s in the whole byte, parity bit included: " + en + ".\nStep 2: " + mode + " parity needs an " + mode + " count of 1s.\nStep 3: " + en + " is " + (en % 2 === 0 ? "even" : "odd") + ", so it does not fit: an error is detected.",
          working: ["Count the 1s in the whole byte, parity bit included.", "Does the count fit " + mode + " parity?"],
          note: d + " has " + n + " ones. With " + mode + " parity that " + (fits ? "fits, so no error is detected." : "does not fit, so an error is detected.") };
      } },
    { id: "e2-05", category: "e2-errors", format: "Type what the receiver decides", randomize: function () {
        var s = 60 + Math.floor(Math.random() * 190), same = Math.random() < 0.5;
        var r = same ? s : s + drillPick([-5, -3, -2, -1, 1, 2, 3, 4]);
        var bad = /^(?!.*\bno\s+errors?\b)(?=.*\b(errors?|wrong|corrupt\w*|resen\w*|sent\s+again|not\s+match\w*|do\s*n.?t\s+match|does\s*n.?t\s+match|different|differ)\b).*$/i;
        var good = /\bno\s+errors?\b|^(?!.*\b(errors?|not|never)\b)(?!.*n.t\b)(?=.*\b(correct|ok|okay|fine|match\w*|same|accept\w*|safe\w*)\b).*$/i;
        return { prompt: "The sender sends a checksum of " + s + " with the data. The receiver adds up the data it received and gets " + r + ".\nWhat does the receiver decide?",
          answers: [same ? "No error is detected" : "An error is detected"], keywords: [same ? good : bad],
          distractors: same ? ["An error is detected", "The data is sent again", "The checksum is wrong"] : ["No error is detected", "The checksum is changed to match", "The data is encrypted"],
          example: "Example: the sender sends a checksum of 120. The receiver adds up the data it received and gets 118.\nStep 1: the receiver works out the checksum again from the data that arrived.\nStep 2: it compares its value with the one that was sent: 118 and 120.\nStep 3: if the two values are not equal, the data changed on the way. If they are equal, nothing was found.",
          working: ["Compare the two values: " + s + " and " + r + ".", "Equal values mean nothing was found. Values that are not equal mean the data changed."],
          note: s + " and " + r + (same ? " match, so no error is detected." : " do not match, so an error is detected and the data can be sent again.") };
      } },
    { id: "e2-06", category: "e2-errors", prompt: "In ARQ, the receiver finds an error in a packet. What does it send back to the sender?", answers: ["A negative acknowledgement"],
      keywords: [/\bnegative\s+acknowledg\w*|\bnak\b|\bnack\b/i], distractors: ["A positive acknowledgement", "The packet again", "A check digit"],
      example: "Example question: in ARQ, the receiver finds no error in a packet. What does it send back?\nStep 1: the sender is waiting to hear how the packet arrived.\nStep 2: the news is good: the packet is safe.\nStep 3: so the receiver sends a positive acknowledgement.\nNow your question: the news is bad. Which kind of acknowledgement says that?",
      working: ["An acknowledgement is a message back to the sender.", "Positive means it arrived safely. What is the opposite?"],
      note: "A negative acknowledgement. The sender then sends the packet again." },
    { id: "e2-07", category: "e2-errors", format: "Type yes or no", prompt: "A byte is sent with even parity. On the way, one 1 becomes 0 and one 0 becomes 1. Will the parity check detect the error?", answers: ["No"],
      keywords: [/^\s*no\b/i], distractors: ["Yes"],
      example: "Example: a byte is sent with even parity. On the way, one 0 becomes 1.\nStep 1: the count of 1s goes up by one.\nStep 2: an even count plus one is odd.\nStep 3: odd does not fit even parity, so the check sees the change.\nNow your question: one 1 is lost and one 1 is gained. What happens to the count?",
      working: ["One 1 is lost and one 1 is gained.", "Is the count of 1s still even?"],
      note: "No. The count of 1s stays the same, so it still fits even parity and the check misses the error." },
    // ------------------------------------------------ Encryption (2.3)
    { id: "e2-08", category: "e2-enc", prompt: "In symmetric encryption, which key decrypts the data?", answers: ["The same key that encrypted it"],
      keywords: [/\b(same|identical|shared|secret|single)\b/i], distractors: ["A public key", "A private key", "A different key"],
      example: "Example question: in asymmetric encryption, which key decrypts data that was encrypted with Ana's public key?\nStep 1: asymmetric means the two keys are not alike.\nStep 2: the key that decrypts is the partner of the key that encrypted.\nStep 3: so it is Ana's private key.\nNow your question: symmetric means both sides are alike. Which key decrypts?",
      working: ["Symmetric means both sides match.", "How many keys does symmetric encryption use?"],
      note: "The same key encrypts and decrypts. Both sides must have it." },
    { id: "e2-09", category: "e2-enc", format: "Type whose key and which key, for example: Rosa's private key", randomize: function () {
        var a = drillPick(NAMES), b = drillPick(NAMES.filter(function (n) { return n !== a; })), c = drillPick(NAMES.filter(function (n) { return n !== a && n !== b; }));
        return { prompt: a + " encrypts a message for " + b + " using asymmetric encryption. Which key does " + a + " use to encrypt it?", answers: [b + "'s public key"],
          keywords: [new RegExp("^\\s*(the\\s+)?(" + b + "\\W?s?\\s+public(\\s*-?\\s*key)?|public\\s+key\\s+(of|from|belonging\\s+to)\\s+" + b + ")\\s*\\.?\\s*$", "i")],
          distractors: [a + "'s public key", b + "'s private key", a + "'s private key"],
          example: "Example: " + c + " wants to receive secret messages.\nStep 1: " + c + " makes two keys: one to give to everyone, one to keep.\nStep 2: anyone sending to " + c + " must encrypt so that only " + c + " can decrypt.\nStep 3: so they encrypt with the key " + c + " gives to everyone: " + c + "'s public key.",
          working: ["Who will decrypt the message?", "The sender uses the key of that person that everyone is allowed to have."],
          note: b + "'s public key. Only " + b + "'s private key can then decrypt it." };
      } },
    { id: "e2-10", category: "e2-enc", prompt: "Data passes every error check when it arrives. Why might it still need to be encrypted?", answers: ["It could still be intercepted and read on the way"],
      keywords: [/\b(intercept\w*|stolen|steal\w*|hack\w*|eavesdrop\w*|read\s+by|seen\s+by|(someone|anyone|people|others?)\s+(could|can|might|may)\s+(read|see|get|access))\b/i],
      distractors: ["Encryption finds more errors", "Encryption makes it faster", "Encryption makes it smaller"],
      example: "Example question: a letter arrives with every word spelled correctly. Why might the writer still have wanted to seal it?\nStep 1: a correct letter only tells you nothing changed on the way.\nStep 2: it does not tell you who opened it and looked inside.\nStep 3: sealing is about who can look, not about mistakes.\nNow your question: error checks find changes. What can they not stop?",
      working: ["Error checks only find changes to the data.", "Who else could get the data on the way?"],
      note: "Error checks do not stop interception. Encryption makes intercepted data meaningless without the key." }
  ];
}

// ---- Activity 1: choose the method for a scenario, and justify it. Random scenarios every draw.
function chooseCards() {
  // [scenario, serial or parallel, direction (one, turns, both), the distance words, the direction words]
  var SCEN = [
    ["A weather sensor on a roof sends temperature readings to a computer in another building. The computer never sends data back.", "serial", "one"],
    ["A security camera sends video to a recorder 200 metres away. The recorder sends nothing back to the camera.", "serial", "one"],
    ["Two offices 50 metres apart share an intercom. One person talks, then the other replies. They cannot both talk at once.", "serial", "turns"],
    ["A computer sends a document to a printer in the next building. The printer sends 'out of paper' messages back, but never while it is receiving.", "serial", "turns"],
    ["Two computers in different cities are on a video call. Both people talk and see each other at the same time.", "serial", "both"],
    ["A games console and a game server in another country send players' moves to each other at the same time.", "serial", "both"],
    ["Inside a camera, a chip sends image data to the memory card slot 2 cm away, as fast as possible. Nothing is sent back.", "parallel", "one"],
    ["Two chips on one circuit board, 3 cm apart, send data to each other, but one at a time. Speed is very important.", "parallel", "turns"],
    ["Two circuit boards inside one device, 4 cm apart, send data to each other at the same time, as fast as possible.", "parallel", "both"]
  ];
  var DIR = { one: "simplex", turns: "half-duplex", both: "full-duplex" };
  var DIR_RE = { one: "simplex", turns: "half[\\s-]*duplex", both: "full[\\s-]*duplex" };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function method(s) { return cap(s[1]) + " " + DIR[s[2]]; }
  function methodRe(s) {
    var other = s[1] === "serial" ? "parallel" : "serial";
    var notDir = Object.keys(DIR_RE).filter(function (k) { return k !== s[2]; }).map(function (k) { return "(?!.*\\b" + DIR_RE[k] + "\\b)"; }).join("");
    return new RegExp("^(?!.*\\b" + other + "\\b)" + notDir + "(?=.*\\b" + s[1] + "\\b)(?=.*\\b" + DIR_RE[s[2]] + "\\b).*$", "i");
  }
  function others(s) {
    var out = [], wires = ["serial", "parallel"], dirs = ["one", "turns", "both"];
    wires.forEach(function (w) { dirs.forEach(function (d) { if (w !== s[1] || d !== s[2]) out.push(cap(w) + " " + DIR[d]); }); });
    var pick = [cap(s[1] === "serial" ? "parallel" : "serial") + " " + DIR[s[2]]];
    var sameWire = out.filter(function (m) { return m.toLowerCase().indexOf(s[1]) === 0; });
    pick.push(drillPick(sameWire));
    pick.push(drillPick(out.filter(function (m) { return pick.indexOf(m) < 0; })));
    return pick;
  }
  var FAR = "\\b(far|long|distance|away|buildings?|rooms?|offices?|cit(y|ies)|countr(y|ies)|metres?|meters?|km|kilometres?|apart)\\b";
  var ORDER = "\\b(order|sequence|skew\\w*|interfer\\w*|crosstalk|errors?|reliab\\w*|corrupt\\w*|in\\s+step|one\\s+bit\\s+at\\s+a\\s+time)\\b";
  var NEAR = "\\b(short|close|near|nearby|centimet\\w*|cm|millimet\\w*|mm|inside|small|tiny|same\\s+(board|device))\\b";
  var FAST = "\\b(fast\\w*|quick\\w*|speed\\w*|several\\s+bits|many\\s+bits|multiple\\s+bits|more\\s+bits|bits\\s+at\\s+(once|the\\s+same\\s+time))\\b";
  var WIRE_WHY = {
    serial: new RegExp("^(?!.*\\bserial\\s+is\\s+faster\\b)(?=.*" + FAR + ")(?=.*" + ORDER + ").*$", "i"),
    parallel: new RegExp("^(?!.*\\b(slow\\w*)\\b)(?=.*" + NEAR + ")(?=.*" + FAST + ").*$", "i")
  };
  var DIR_WHY = {
    one: /^(?!.*\bboth\s+(ways|directions)\b)(?=.*\b(one\s+(way|direction)|single\s+direction|never\s+(sends?|replies|send)|no(thing)?\s+(is\s+)?(sent|reply|replies|response|data)\s*(back)?|only\s+(sends?|goes|travels?)|does\s*n.?t\s+(send|reply|need\s+to\s+send)|not\s+(send|sent|need\w*)\s+(anything\s+)?back)\b).*$/i,
    turns: /^(?=.*\b(both|two)\s+(ways|directions)\b|.*\b(sends?|replies|reply)\s+back\b|.*\beach\s+(other|way)\b)(?=.*\b(one\s+(way\s+|direction\s+)?at\s+a\s+time|not\s+at\s+the\s+same\s+time|never\s+(at\s+the\s+same\s+time|while)|take\s+turns|in\s+turns?|turns|cannot\s+both|can.?t\s+both|not\s+both|one\s+after\s+the\s+other|while\s+.*not)\b).*$/i,
    both: /^(?!.*\bnot\s+at\s+the\s+same\s+time\b)(?=.*\b(both|two)\s+(ways|directions)\b|.*\beach\s+other\b|.*\bboth\s+(people|computers|devices|boards|sides|send\w*|talk\w*)\b)(?=.*\b(same\s+time|simultaneous\w*|at\s+once|together|no\s+delay|no\s+waiting)\b).*$/i
  };
  var WIRE_NOTE = { serial: "Serial: the data travels a long way, and one bit at a time keeps the bits in order (no skew, less interference).", parallel: "Parallel: the distance is very short and speed matters, and several bits at the same time is faster." };
  var DIR_NOTE = { one: "Simplex: data only needs to go one way. Nothing is sent back.", turns: "Half-duplex: data goes both ways, but only one way at a time.", both: "Full-duplex: data goes both ways at the same time." };
  function scen() { return drillPick(SCEN); }
  function methodCard(id) {
    return { id: id, category: "ch-method", format: "Type serial or parallel, then simplex, half-duplex or full-duplex", randomize: function () {
      var s = scen();
      return { prompt: s[0] + "\nWhich method of data transmission fits best?", answers: [method(s)], keywords: [methodRe(s)], distractors: others(s),
        working: ["How far does the data go? Far = serial. Very short and fast = parallel.", "Who sends? One way only, both ways taking turns, or both ways at once?"],
        note: method(s) + ". " + WIRE_NOTE[s[1]] + " " + DIR_NOTE[s[2]] };
    } };
  }
  function wireWhyCard(id) {
    return { id: id, category: "ch-why", format: "Type your reason, using words from the scenario", randomize: function () {
      var s = scen();
      var right = s[1] === "serial" ? "The data travels a long distance, so sending one bit at a time keeps the bits in order" : "The distance is very short, so sending several bits at the same time is faster";
      return { prompt: s[0] + "\nThis link uses " + s[1] + " transmission. Explain why " + s[1] + " fits this scenario.", answers: [right], keywords: [WIRE_WHY[s[1]]],
        distractors: s[1] === "serial" ? ["Serial is faster than parallel", "It is cheaper", "Serial sends many bits at once"] : ["Parallel works best over long distances", "It uses one wire", "Parallel is slower but safer"],
        working: ["How far apart are the two devices? Find the words in the scenario.", s[1] === "serial" ? "Over that distance, what happens to bits sent one at a time?" : "Over that distance, what does sending several bits at once give you?"],
        note: WIRE_NOTE[s[1]] };
    } };
  }
  function dirWhyCard(id) {
    return { id: id, category: "ch-why", format: "Type your reason, using words from the scenario", randomize: function () {
      var s = scen(), d = DIR[s[2]];
      var right = { one: "Data only needs to travel in one direction; nothing is sent back", turns: "Data goes in both directions, but not at the same time", both: "Data goes in both directions at the same time" }[s[2]];
      var wrong = { one: ["Data goes in both directions at the same time", "Data goes in both directions, one at a time", "It sends several bits at once"],
        turns: ["Data only goes in one direction", "Data goes in both directions at the same time", "It sends one bit at a time"],
        both: ["Data only goes in one direction", "Data goes in both directions, one at a time", "It sends several bits at once"] }[s[2]];
      return { prompt: s[0] + "\nThis link uses " + d + ". Explain why " + d + " fits this scenario.", answers: [right], keywords: [DIR_WHY[s[2]]], distractors: wrong,
        working: ["Who sends data in this scenario? Does anything come back?", "If data goes both ways, can it go both ways at the same moment?"],
        note: DIR_NOTE[s[2]] };
    } };
  }
  function mistakeCard(id) {
    return { id: id, category: "ch-mistake", format: "Type why the choice is wrong", randomize: function () {
      var s = scen(), kind = drillPick(["wire", "dir"]);
      if (kind === "wire") {
        var bad = s[1] === "serial" ? "parallel" : "serial";
        var claim = cap(bad) + " " + DIR[s[2]];
        var right = s[1] === "serial" ? "Over a long distance the bits can skew and arrive out of order" : "Serial is slower, and this short link needs to be as fast as possible";
        var kwr = s[1] === "serial" ? /^(?=.*\b(skew\w*|out\s+of\s+(order|step|sync\w*)|wrong\s+order|different\s+times|interfer\w*|crosstalk|errors?|corrupt\w*)\b)(?!.*\bno\s+skew).*$/i : /^(?!.*\bserial\s+(is\s+)?(faster|quicker)\b)(?:.*\b(slow\w*|not\s+(as\s+)?fast|less\s+fast|takes?\s+longer)\b|.*\bparallel\s+(is\s+|would\s+be\s+)?(faster|quicker)\b|.*\b(needs?|must)\s+(to\s+)?(be\s+)?(fast|quick|speed)).*$/i;
        return { prompt: s[0] + "\nA student chose " + claim + ". The " + bad + " part is wrong. Why?", answers: [right], keywords: [kwr],
          distractors: s[1] === "serial" ? ["Parallel only sends one way", "Parallel is too slow", "Parallel cannot carry video"] : ["Serial cannot send both ways", "Serial bits skew over short distances", "Serial needs more wires"],
          working: ["How far apart are the devices?", s[1] === "serial" ? "What goes wrong when several bits travel side by side for a long way?" : "Which method is faster over a very short distance?"],
          note: WIRE_NOTE[s[1]] };
      }
      var wrongDir = drillPick(Object.keys(DIR).filter(function (k) { return k !== s[2]; }));
      var claim2 = cap(s[1]) + " " + DIR[wrongDir];
      var why = { one: { turns: "Nothing is sent back, so data only needs to go one way", both: "Nothing is sent back, so data only needs to go one way" },
        turns: { one: "Data must also come back, so it must go both ways", both: "The devices never send at the same time, so both ways at once is not needed" },
        both: { one: "Data must go both ways", turns: "Both sides send at the same time, so taking turns would cause delays" } }[s[2]][wrongDir];
      var kws = { one: /\b(one\s+(way|direction)|never\s+sends?|nothing\s+(is\s+)?(sent\s+)?back|no\s+(reply|response|data\s+back)|does\s*n.?t\s+(send|reply|need)|not\s+(needed|need\w*))\b/i,
        turns: wrongDir === "one" ? /\b(both\s+(ways|directions)|back|two\s+ways|reply|replies|each\s+other)\b/i : /\b(not\s+at\s+the\s+same\s+time|never\s+at\s+the\s+same\s+time|one\s+at\s+a\s+time|take\s+turns|turns|never\s+while|not\s+needed|does\s*n.?t\s+need|not\s+both)\b/i,
        both: wrongDir === "one" ? /\b(both\s+(ways|directions)|back|two\s+ways|each\s+other|both\s+(people|devices|computers|sides|boards))\b/i : /\b(same\s+time|at\s+once|simultaneous\w*|together|delay\w*|wait\w*)\b/i }[s[2]];
      var dis = { one: ["Data must go both ways", "Serial is too slow", "It needs more wires"], turns: wrongDir === "one" ? ["Simplex is too slow", "Simplex skews the bits", "It needs more wires"] : ["Full-duplex is too slow", "Full-duplex skews the bits", "It needs more wires"],
        both: wrongDir === "one" ? ["Simplex is too slow", "Simplex skews the bits", "It needs more wires"] : ["Half-duplex is too slow over long distances", "Half-duplex skews the bits", "It needs more wires"] }[s[2]];
      return { prompt: s[0] + "\nA student chose " + claim2 + ". The " + DIR[wrongDir] + " part is wrong. Why?", answers: [why], keywords: [kws], distractors: dis,
        working: ["Who sends data in this scenario, and does anything come back?", "If it goes both ways, does it happen at the same moment, or do they wait?"],
        note: DIR_NOTE[s[2]] };
    } };
  }
  return [methodCard("ch-01"), methodCard("ch-02"), methodCard("ch-03"), wireWhyCard("ch-04"), wireWhyCard("ch-05"), dirWhyCard("ch-06"), dirWhyCard("ch-07"), mistakeCard("ch-08"), mistakeCard("ch-09")];
}

// ---- Exam Practice 1, Activity 2: spot the mistake in a student answer about packets or methods, and type the fix.
function fixCards() {
  var F = "Type what it should say instead";
  function card(id, cat, wrote, ans, kw, dis, w1, w2, note) {
    return { id: id, category: cat, format: F, prompt: "A student wrote:\n\"" + wrote + "\"\nOne part is wrong. Type what it should say instead.", answers: [ans], keywords: [kw], distractors: dis, working: [w1, w2], note: note };
  }
  return [
    // ------------------------------------------------ 2.1
    card("fx-01", "fx-trans", "Serial transmission sends several bits at the same time, down a single wire.", "one bit at a time", /\b(one|1|single)\s+bit\b|\bbit\s+by\s+bit\b/i,
      ["several bits down several wires", "both directions at once", "one packet at a time"], "Serial uses a single wire. How many bits can one wire carry at a time?", "Fix the part about how many bits are sent.",
      "Serial sends one bit at a time, down a single wire. Parallel sends several bits at the same time."),
    card("fx-02", "fx-trans", "Parallel transmission is used over long distances because it is faster.", "short distances", /\b(short|shorter|close|near|small)\b/i,
      ["longer distances", "very long cables", "between countries"], "Over a long cable, what happens to bits sent side by side?", "Parallel is faster, but only over one kind of distance. Which?",
      "Parallel is used over short distances. Over long distances its bits can skew."),
    card("fx-03", "fx-trans", "Half-duplex sends data in both directions at the same time.", "one direction at a time", /\bone\s+(direction\s+|way\s+)?at\s+a\s+time\b|\bnot\s+at\s+the\s+same\s+time\b|\btake\s+turns\b|\bin\s+turns?\b/i,
      ["at the same time", "in one direction only", "several bits at a time"], "Both directions is right. Which part describes full-duplex instead?", "Half-duplex devices must wait for each other.",
      "Half-duplex: both directions, but one direction at a time. Both at the same time is full-duplex."),
    card("fx-04", "fx-trans", "Full-duplex sends data in one direction only.", "both directions at the same time", /^(?=.*\b(both|two)\s+(directions?|ways)\b)(?=.*\b(same\s+time|simultaneous\w*|at\s+once)\b).*$/i,
      ["one direction at a time", "in both directions, taking turns", "one bit at a time"], "One direction only is a different method. Which one?", "Full-duplex: which directions, and when?",
      "Full-duplex sends data in both directions at the same time. One direction only is simplex."),
    card("fx-05", "fx-trans", "The payload of a packet holds the destination address.", "header", /^\s*(the\s+|packet\s+|the\s+packet\s+)?header\b/i,
      ["trailer", "payload", "router"], "The payload holds the main data. Where is the address kept?", "Think of the label on a parcel.",
      "The header holds the destination address. The payload holds the main data."),
    card("fx-06", "fx-trans", "Packets arrive out of order because they are sent at different times.", "they take different routes", /\b(routes?|paths?|ways?)\b/i,
      ["they are sent at the same time", "the router reorders them", "they are encrypted"], "How do the packets cross the network?", "Each packet travels on its own. What does that do to the order?",
      "Each packet can take a different route, and some routes are slower, so they arrive out of order."),
    card("fx-07", "fx-trans", "Serial data can be skewed over a long distance.", "parallel", /^\s*parallel(\s+(data|transmission))?\b/i,
      ["serial", "simplex", "full-duplex"], "Skew happens when bits travel side by side.", "Which method sends bits side by side?",
      "Parallel data can be skewed over a long distance. Serial bits arrive in order."),
    card("fx-19", "fx-trans", "A USB connection uses parallel data transmission.", "serial", /^\s*(it\s+uses\s+)?serial(\s+(data\s+)?transmission)?\b/i,
      ["parallel", "simplex", "full-duplex"], "Look at the letters USB.", "What does the S in USB stand for?",
      "A USB connection uses serial data transmission: universal serial bus."),
    card("fx-20", "fx-trans", "Simplex sends data in both directions, one direction at a time.", "one direction only", /^(?!.*\b(at\s+a\s+time|both|turns?|taking\s+turns)\b)(?=.*\b((one|1|single)\s+(direction|way)|one[\s-]way)\b).*$/i,
      ["both directions at the same time", "both directions, taking turns", "several bits at a time"], "Both directions, one at a time, is a different method. Which one?", "How many directions does simplex use?",
      "Simplex sends data in one direction only. Both directions, one at a time, is half-duplex."),
    card("fx-21", "fx-trans", "With packet switching, every packet of a file must take the same route.", "each packet can take a different route", /\b(different|own|separate|any|various|another|other)\s+(routes?|paths?|ways?)\b|\b(routes?|paths?)\s+(can|may|could|might)\s+(be\s+)?differ\w*/i,
      ["the same route", "the shortest route only", "one route at a time"], "A router chooses a path for each packet on its own.", "So must they all go the same way?",
      "Each packet can take a different route. The router chooses a path for each packet.")
  ];
}

// ---- Exam Practice 2, Activity 2: spot the mistake in a student answer about error detection or encryption.
function fixCards2() {
  var F = "Type what it should say instead";
  function card(id, cat, wrote, ans, kw, dis, w1, w2, note) {
    return { id: id, category: cat, format: F, prompt: "A student wrote:\n\"" + wrote + "\"\nOne part is wrong. Type what it should say instead.", answers: [ans], keywords: [kw], distractors: dis, working: [w1, w2], note: note };
  }
  return [
    // ------------------------------------------------ 2.2
    card("fx-08", "fx-errors", "With even parity, the parity bit makes the number of 1s in the byte odd.", "even", /^\s*(an?\s+)?even(\s+number)?\b/i,
      ["odd", "zero", "eight"], "Look at the name of the parity type.", "What must the count of 1s be with even parity?",
      "With even parity, the parity bit makes the number of 1s even."),
    card("fx-09", "fx-errors", "In an echo check, the receiver compares the data it sends back with the original.", "the sender compares", /\b(sender|sending\s+(device|computer)|original\s+(device|computer))\b/i,
      ["the receiver compares", "the router compares", "nobody compares"], "Which device still has the original data?", "The copy goes back to that device.",
      "The sender compares the copy that comes back with the original data it sent."),
    card("fx-10", "fx-errors", "In a checksum, the receiver compares two values. If they match, an error has occurred.", "if they do not match", /\b((do|does)\s*(not|n.?t)\s+match|don.?t\s+match|not\s+match\w*|differ\w*|mismatch\w*|not\s+the\s+same)\b/i,
      ["if they match", "if they are equal", "if they are both zero"], "The receiver works out the checksum again. What would it get if nothing changed?", "So which result shows an error?",
      "If the two values do not match, an error has occurred. If they match, no error is detected."),
    card("fx-11", "fx-errors", "In ARQ, if the receiver finds an error, the receiver sends the data again.", "the sender sends the data again", /\b(sender|sending\s+(device|computer))\b/i,
      ["the receiver sends it again", "the router sends it again", "the data is deleted"], "Which device has the data to send?", "The receiver can only ask. Who does the sending?",
      "The sender resends the data, after a negative acknowledgement or a timeout."),
    card("fx-12", "fx-errors", "In ARQ, the sender starts a timer. If an acknowledgement arrives before the timeout, the data is sent again.", "if no acknowledgement arrives", /\b(no|not|without|never|doesn.?t|does\s+not|isn.?t|is\s+not)\b.*\backnowledg\w*|\backnowledg\w*\s+(does\s*n.?t|is\s*n.?t|not|never|fails?)\b/i,
      ["if an acknowledgement arrives", "if the timer starts", "if the data is encrypted"], "A positive acknowledgement says the data arrived safely. Should it be sent again then?", "So when is the data sent again?",
      "The data is sent again if no acknowledgement arrives before the timeout."),
    card("fx-13", "fx-errors", "A check digit finds errors when data is transmitted from one computer to another.", "when data is entered", /\b(entry|enter\w*|input\w*|typ\w*|scann\w*|keyed)\b/i,
      ["when data is transmitted", "when data is encrypted", "when data is compressed"], "A check digit finds digits in the wrong order, such as 12345 becoming 12435.", "When does a person put a number into a computer?",
      "A check digit finds errors on data entry, such as a number typed or scanned wrongly."),
    card("fx-14", "fx-errors", "A parity check will always find an error when two bits have changed.", "will not find it", /\b(not|never|cannot|can.?t|won.?t|doesn.?t|does\s+not|miss\w*|fail\w*)\b/i,
      ["will always find it", "will find both bits", "will correct it"], "Two bits change. What happens to the count of 1s?", "If the count still fits the parity, can the check see the error?",
      "A parity check may not find an error when two bits change, because the count of 1s can still fit the parity."),
    // ------------------------------------------------ 2.3
    card("fx-15", "fx-enc", "In symmetric encryption, the data is encrypted with a public key and decrypted with a private key.", "the same key", /\b(same|one|single|shared|secret)\s+key\b|\bsame\b/i,
      ["a public key", "a private key", "two different keys"], "Two different keys is a different method.", "How many keys does symmetric encryption use?",
      "Symmetric encryption uses the same key to encrypt and decrypt."),
    card("fx-16", "fx-enc", "In asymmetric encryption, the public key decrypts the data.", "the private key", /\bprivate\b/i,
      ["the public key", "the shared key", "the same key"], "Anyone can have the public key. Should anyone be able to decrypt?", "Which key does only the receiver have?",
      "The private key decrypts the data. The public key only encrypts."),
    card("fx-17", "fx-enc", "Encryption stops data from being intercepted.", "makes intercepted data meaningless", /\b(meaningless|unreadable|cannot\s+be\s+(read|understood)|can.?t\s+be\s+(read|understood)|scrambl\w*|no\s+meaning)\b/i,
      ["stops data being sent", "makes the data smaller", "finds errors in the data"], "Can anything stop data being intercepted on a network?", "Then what does encryption do to the data that is intercepted?",
      "Encryption does not stop interception. It makes intercepted data meaningless without the key."),
    card("fx-18", "fx-enc", "Plain text is the data after it has been encrypted.", "cipher text", /\b(ciph|cyph)er\s*-?\s*text\b/i,
      ["plain text", "readable text", "the key"], "Plain text is the data BEFORE encryption.", "What is the scrambled data called?",
      "Cipher text is the data after encryption. Plain text is the data before it.")
  ];
}

// ---- Exam Practice 1 plenary: real exam questions on packets and methods. Each note cites the paper and question.
function plenaryCards() {
  var TWO_SERIAL = /^(?!.*\bparallel\b)(?!.*simplex)(?=.*\bserial\b)(?=.*\bhalf[\s-]*duplex\b)(?=.*\bfull[\s-]*duplex\b).*$/i;
  return [
    // ================================================= Packets
    { id: "pl-01", category: "pl-packets", prompt: "Data is broken down into smaller units to be transmitted from one device to another. Give the name of the unit that data is broken down into.", answers: ["Packet"],
      keywords: [/^\s*(a\s+|data\s+)?packets?(\s+of\s+data)?\s*\.?\s*$/i], distractors: ["Byte", "Payload", "Header"],
      working: ["Each unit travels across the network on its own.", "It has a header, a payload and a trailer."],
      note: "From 0478/12 June 2024 Q2(b): packet." },
    { id: "pl-02", category: "pl-packets", prompt: "The structure of a packet of data has three elements. One element is the packet header. Identify the two other elements of a packet.", answers: ["Payload and trailer"],
      keywords: [/^(?=.*\bpayload\b)(?=.*\btrailer\b).*$/i], distractors: ["Header and footer", "Payload and address", "Trailer and router"],
      working: ["One part holds the main data.", "One part comes at the end of the packet."],
      note: "From 0478/12 March 2023 Q5(a)(ii): payload; trailer." },
    { id: "pl-03", category: "pl-packets", prompt: "An email is broken into packets. Each packet is sent along a different path from the employee's device to the employer's device. Which method is this: packet networking, packet circuiting, packet switching or packet transferring?", answers: ["Packet switching"],
      keywords: [/^\s*(c\s*[.):-]?\s*)?packet[\s-]*switch\w*\s*\.?\s*$/i], distractors: ["Packet networking", "Packet circuiting", "Packet transferring"],
      working: ["Only one of these four is a syllabus term.", "Each packet can switch onto its own path."],
      note: "From 0478/13 November 2024 Q2(e)(ii): C, packet switching." },
    { id: "pl-04", category: "pl-packets", prompt: "Packet switching is used to transmit data packets across a network. Identify the device that controls which path is taken by each data packet.", answers: ["Router"],
      keywords: [/^\s*(a\s+|the\s+)?routers?\s*\.?\s*$/i], distractors: ["Switch", "Server", "Modem"],
      working: ["This device sits at each junction of the network.", "It reads the destination address and sends the packet on."],
      note: "From 0478/11 June 2024 Q4(b): router." },
    { id: "pl-05", category: "pl-packets", prompt: "Identify the part of the packet where the destination IP address is found.", answers: ["Header"],
      keywords: [/^\s*(the\s+)?(packet\s+)?header\s*\.?\s*$/i], distractors: ["Payload", "Trailer", "Footer"],
      working: ["The main data is not in this part.", "Think of the label on the outside of a parcel."],
      note: "From 0478/11 November 2025 Q2(b)(ii): (packet) header." },
    { id: "pl-06", category: "pl-packets", prompt: "The packets of data may need to be reordered when they arrive. Explain why the packets of data may need to be reordered.", answers: ["Each packet can take a different route, so they arrive in the wrong order"],
      keywords: [/^(?=.*\b(routes?|paths?|ways?)\b)(?=.*\b(different|own|separate\w*|various|longer|slower|faster|another|each|independent\w*)\b).*$|^(?=.*\b(wrong|different|another)\s+order\b)(?=.*\b(longer|slower|faster|delay\w*|lost|corrupt\w*|resen\w*|again)\b).*$/i],
      distractors: ["They are sent at different times", "The router reorders them", "They are encrypted"],
      working: ["How do the packets cross the network?", "Is every path the same speed?"],
      note: "From 0478/11 June 2025 Q4(c)(ii), any two: packets arrive in the wrong order; each packet could take a different route; some packets take longer; some may not arrive and are requested again." },
    { id: "pl-07", category: "pl-packets", prompt: "Packets may arrive out of order. Once the ____ packet has arrived, the packets are reordered. Which word fills the gap: first, last, header or payload?", answers: ["Last"],
      keywords: [/^\s*(the\s+)?last(\s+(one|packet))?\s*\.?\s*$/i], distractors: ["First", "Header", "Payload"],
      working: ["The receiver can only put them in order when it has all of them.", "Which packet arriving means it has all of them?"],
      note: "From 0478/11 November 2023 Q7: last." },
    // ================================================= Methods of transmission
    { id: "pl-08", category: "pl-methods", prompt: "Which of these terms is not a method for transmitting data: serial, simplex, parallel or parity?", answers: ["Parity"],
      keywords: [/^\s*(d\s*[.):-]?\s*)?parity(\s+check)?\s*\.?\s*$/i], distractors: ["Serial", "Simplex", "Parallel"],
      working: ["Three of these describe how data travels.", "One of them is a way of checking for errors."],
      note: "From 0478/12 June 2024 Q2(a): D, parity." },
    { id: "pl-09", category: "pl-methods", prompt: "Define full-duplex data transmission.", answers: ["Data goes in both directions at the same time"],
      keywords: [/^(?=.*\b(both|two)\s+(directions?|ways)\b|.*\bback\s+and\s+forth\b)(?=.*\b(same\s+time|simultaneous\w*|at\s+once|together)\b).*$/i],
      distractors: ["Data goes in one direction only", "Data goes in both directions, one at a time", "Several bits are sent at the same time"],
      working: ["Which directions can the data go?", "Does it have to take turns?"],
      note: "From 0478/12 March 2023 Q5(b)(ii): data goes in both directions (1) at the same time (1)." },
    { id: "pl-10", category: "pl-methods", prompt: "Describe half-duplex data transmission.", answers: ["Data goes in both directions, but only one direction at a time"],
      keywords: [/^(?=.*\b(both|two)\s+(directions?|ways)\b)(?=.*\b(one\s+(direction\s+|way\s+)?at\s+a\s+time|not\s+at\s+the\s+same\s+time|not\s+simultaneous\w*|take\s+turns|in\s+turns?)\b).*$/i],
      distractors: ["Data goes in both directions at the same time", "Data goes in one direction only", "One bit is sent at a time"],
      working: ["Which directions can the data go?", "Can both directions happen at the same moment?"],
      note: "From 0478/12 March 2021 Q1(d)(ii): data can be sent in both directions (1), but only one direction at a time (1)." },
    { id: "pl-11", category: "pl-methods", prompt: "Data is transmitted one bit at a time down a single wire. The computer can transmit data to the printer and the printer can transmit data to the computer, using the same connection. Name the two data transmission methods that will transmit data in this way.", answers: ["Serial half-duplex and serial full-duplex"],
      keywords: [TWO_SERIAL], distractors: ["Serial simplex and serial half-duplex", "Parallel half-duplex and parallel full-duplex", "Serial simplex and parallel simplex"],
      working: ["One bit at a time down a single wire: which first word?", "Both devices can send. Which two direction methods allow that?"],
      note: "From 0478/11 November 2023 Q4(a): serial half-duplex; serial full-duplex." },
    { id: "pl-12", category: "pl-methods", prompt: "Photographs are transmitted from a phone to a computer. State one benefit of using parallel data transmission instead of serial data transmission.", answers: ["The data may be transmitted quicker"],
      keywords: [/^(?!.*\b(slow\w*|not\s+(as\s+)?fast)\b)(?=.*\b(fast\w*|quick\w*|speed\w*|sooner|less\s+time)\b).*$/i], distractors: ["There is less interference", "It works over longer distances", "The bits arrive in order"],
      working: ["Parallel sends several bits at the same time.", "What does that do to the time the transfer takes?"],
      note: "From 0478/12 June 2023 Q4(a)(iii): the data may be transmitted quicker." },
    { id: "pl-13", category: "pl-methods", prompt: "State one drawback of using serial data transmission, rather than parallel data transmission.", answers: ["Data transmission can be slower"],
      keywords: [/\b(slow\w*|not\s+as\s+fast|less\s+fast|takes?\s+longer|lower\s+speed|additional\s+data|extra\s+data)\b/i], distractors: ["There is more interference", "The bits may be skewed", "It needs more wires"],
      working: ["Serial sends one bit at a time.", "Compared with several bits at once, what is the cost?"],
      note: "From 0478/13 June 2021 Q6(c)(ii), any one: data transmission can be slower (than parallel); additional data may need to be sent." },
    { id: "pl-14", category: "pl-methods", prompt: "A mouse is connected using a USB connection. Give one drawback of using a USB connection for this purpose.", answers: ["Slower transmission than a parallel connection"],
      keywords: [/\b(slow\w*|not\s+as\s+fast)\b|\b(wire|cable|lead)s?\b.*\b(way|limit\w*|movement|move|tangl\w*|trip\w*|short|length|restrict\w*)\b/i], distractors: ["It cannot supply power", "It is not a standard connection", "The data is skewed"],
      working: ["USB is serial. How does serial compare with parallel for speed?", "Or think about the cable on the desk."],
      note: "From 0478/12 November 2025 Q5(c)(iii), any one: slower transmission than a parallel connection; the wire may get in the way or limit movement of the mouse." },
    { id: "pl-15", category: "pl-methods", prompt: "Identify the type of data transmission used in a USB connection: serial or parallel?", answers: ["Serial"],
      keywords: [/^(?!.*\bparallel\b).*\bserial\b.*$/i], distractors: ["Parallel"],
      working: ["Look at the letters USB.", "What does the S stand for?"],
      note: "From 0478/11 June 2021 Q2(c)(ii): serial." },
    { id: "pl-16", category: "pl-methods", prompt: "Data from a barcode scanner is sent to a stock control system using serial simplex. Give one reason why simplex is suitable.", answers: ["No reply is needed, so data only needs to go one way"],
      keywords: [/\b(one\s+(way|direction)|single\s+direction|no\s+(need\s+for\s+a\s+)?(reply|response|replies)|does\s*n.?t\s+(need\s+to\s+)?(reply|respond|send\s+back)|not\s+need\w*\s+to\s+(reply|respond|send)|never\s+(replies|sends\s+back)|nothing\s+(is\s+)?sent\s+back)\b/i],
      distractors: ["Data must go both ways", "It is faster than parallel", "It sends several bits at once"],
      working: ["Does the stock control system ever send data back to the scanner?", "Then how many directions are needed?"],
      note: "From 0478/12 November 2024 Q5(b)(ii): no need for a reply from the stock control system; half-duplex or full-duplex is not needed, as only one-way transmission is needed." },
    { id: "pl-17", category: "pl-methods", prompt: "A company uses parallel full-duplex data transmission. Give one drawback of using this method of data transmission.", answers: ["More interference"],
      keywords: [/\b(interfer\w*|crosstalk|skew\w*|out\s+of\s+order|wrong\s+order|collisions?|errors?)\b/i], distractors: ["It is slow", "Data only goes one way", "It uses a single wire"],
      working: ["Parallel uses many wires next to each other.", "Bits sent side by side can arrive at different times."],
      note: "From 0478/11 November 2024 Q4(b)(ii), any two: more interference or crosstalk; data may be skewed; more chance of data collisions; more chance of error." }
  ];
}

// ---- Exam Practice 2 plenary: real exam questions on error detection and encryption. Each note cites the paper.
function plenaryCards2() {
  return [
    // ================================================= Error detection
    { id: "pl-18", category: "pl-errors", format: "Type odd or even", randomize: function () {
        var v = drillPick(["10011001", "01111110", "11100000", "00111001"]);
        var n = v.split("").filter(function (b) { return b === "1"; }).length, a = n % 2 ? "Odd" : "Even";
        return { prompt: "A parity check is used to check for errors after transmission. This 8-bit value was transmitted and received correctly: " + v + "\nWas it sent using odd or even parity?", answers: [a],
          keywords: [new RegExp("^\\s*" + a + "(\\s+parity)?\\s*\\.?\\s*$", "i")], distractors: [a === "Odd" ? "Even" : "Odd"],
          working: ["Count the 1s in the whole value.", "Is the count odd or even?"],
          note: v + " has " + n + " ones, so " + a.toLowerCase() + " parity. From 0478/13 November 2021 Q9: even, even, odd, even." };
      } },
    { id: "pl-19", category: "pl-errors", format: "Type 0 or 1", prompt: "The bytes need to be sent using an even parity byte check. Byte A is 1100011. Give the parity bit for Byte A.", answers: ["0"],
      keywords: [/^\s*0\s*\.?\s*$/], distractors: ["1"],
      working: ["Count the 1s in 1100011.", "Is the count already even?"],
      note: "From 0478/12 March 2023 Q5(c)(i): 1100011 has four 1s, so the parity bit is 0." },
    { id: "pl-20", category: "pl-errors", prompt: "Data is sent from a computer to a printer, then a copy of the data received is sent back from the printer to the computer. The two sets of data are compared to see if they match. State the name of this type of error detection method.", answers: ["Echo check"],
      keywords: [/^\s*(an?\s+|the\s+)?echo(\s+check(ing)?)?\s*\.?\s*$/i], distractors: ["Checksum", "Parity check", "Check digit"],
      working: ["The data comes back to where it started.", "Like a sound bouncing off a wall."],
      note: "From 0478/11 November 2023 Q4(c): echo (check)." },
    { id: "pl-21", category: "pl-errors", prompt: "Which error detection method does not use a calculated value to check for errors: check digit, checksum, echo check or parity check?", answers: ["Echo check"],
      keywords: [/^\s*(c\s*[.):-]?\s*)?(an?\s+|the\s+)?echo(\s+check)?\s*\.?\s*$/i], distractors: ["Check digit", "Checksum", "Parity check"],
      working: ["Three of these work something out from the data.", "One only sends the data back and compares it."],
      note: "From 0478/13 November 2023 Q5(b): C, echo check." },
    { id: "pl-22", category: "pl-errors", prompt: "Errors can occur when data is transmitted. Give one reason an error may occur when data is transmitted.", answers: ["Interference"],
      keywords: [/(interfer|cross[\s-]?talk)/i], distractors: ["Encryption", "Compression", "A check digit"],
      working: ["Think about what can affect the bits on the way.", "Down a cable or through the air, what can change a bit?"],
      note: "From 0478/13 November 2023 Q5(a): interference // crosstalk." },
    { id: "pl-23", category: "pl-errors", prompt: "Which error-checking method checks for errors on data entry: checksum, check digit or parity check?", answers: ["Check digit"],
      keywords: [/^\s*(a\s+|the\s+)?check\s*-?\s*digits?\s*\.?\s*$/i], distractors: ["Checksum", "Parity check"],
      working: ["Data entry means typing or scanning a number.", "Which method is part of the number itself?"],
      note: "From 0478/11 November 2021 Q3(a): check digit." },
    { id: "pl-24", category: "pl-errors", prompt: "Which error-checking method uses a process of acknowledgement and timeout: ARQ, check digit or checksum?", answers: ["ARQ"],
      keywords: [/^\s*(an?\s+)?(arq|automatic\s+repeat\s+(query|request|requests|queries)(\s*\(?arq\)?)?)\s*\.?\s*$/i], distractors: ["Check digit", "Checksum"],
      working: ["An acknowledgement is a message back to the sender.", "Which method sends the data again after a timeout?"],
      note: "From 0478/13 November 2021 Q3(a): automatic repeat query (ARQ)." },
    { id: "pl-25", category: "pl-errors", prompt: "In ARQ, the sending device does not receive an acknowledgement before the timer ends. What happens?", answers: ["The data packet is resent"],
      keywords: [/\b(resen\w*|re-?sent|sent\s+again|sends?\s+(it\s+)?again|retransmit\w*|transmit\w*\s+(it\s+)?again|sends?\s+(the\s+)?(data|packet)\s+again)\b/i], distractors: ["The receiver deletes it", "A parity bit is added", "The next packet is sent"],
      working: ["No acknowledgement: the sender cannot be sure the packet arrived.", "What must it do so the packet still gets there?"],
      note: "From 0478/13 November 2023 Q5(c): a timeout occurs; the data packet is resent, until an acknowledgement is received." },
    { id: "pl-26", category: "pl-errors", prompt: "An error may not be detected when using a parity check. Identify why an error may not be detected.", answers: ["Two bits are transposed, so the parity is still correct"],
      keywords: [/\b(transpos\w*|swap\w*|interchang\w*|changed\s+places|two\s+bits|2\s+bits|even\s+number\s+of\s+(bits|errors|changes)|still\s+(odd|even|correct|the\s+same|fits)|same\s+(number|count)\s+of\s+(1|one)s?|parity\s+(is\s+)?still\s+correct)\b/i],
      distractors: ["The parity bit is sent first", "The data is encrypted", "One bit has changed"],
      working: ["Think about what happens when more than one bit changes.", "What happens to the count of 1s if a 0 and a 1 change places?"],
      note: "From 0478/11 June 2021 Q8(b): there is a transposition of bits; an even number of bits change, so the parity is still correct." },
    // ================================================= Encryption
    { id: "pl-27", category: "pl-enc", prompt: "The data that is transmitted is encrypted. State the name given to the encrypted data.", answers: ["Cipher text"],
      keywords: [/^\s*(the\s+)?(ciph|cyph)er(\s*-?\s*(text|data))?\s*\.?\s*$/i], distractors: ["Plain text", "Key", "Payload"],
      working: ["It is not the data before encryption.", "Its name ends in the word text."],
      note: "From 0478/12 June 2026 Q4(c)(iii): cipher / cypher text." },
    { id: "pl-28", category: "pl-enc", prompt: "The image data is encrypted using symmetric encryption. Give one other type of encryption that could be used.", answers: ["Asymmetric"],
      keywords: [/^\s*(an?\s+)?(asymmetric|asynchronous)(\s+(key\s+)?encryption)?\s*\.?\s*$|^\s*public\s*(key\s*)?(and|&|\/)\s*private\s*key(\s+encryption)?\s*\.?\s*$/i], distractors: ["Symmetric", "Parallel", "Serial"],
      working: ["Symmetric uses one shared key.", "Which method uses two different keys?"],
      note: "From 0478/11 November 2025 Q2(e)(ii): asymmetric." },
    { id: "pl-29", category: "pl-enc", prompt: "Data is transmitted using the internet. The data is encrypted before transmission. State the purpose of encrypting data.", answers: ["If the data is intercepted, it cannot be understood"],
      keywords: [/\b(meaningless|unreadable|cannot\s+be\s+(read|understood)|can.?t\s+be\s+(read|understood)|not\s+(be\s+)?(read|understood|understandable)|scrambl\w*|secur\w*|safe\w*|protect\w*)\b/i], distractors: ["To make the data smaller", "To check for errors", "To send it faster"],
      working: ["Someone intercepts the data on the way.", "What can they do with it if it is encrypted?"],
      note: "From 0478/12 March 2024 Q7(a)(i): if the data is intercepted, it cannot be understood." },
    { id: "pl-30", category: "pl-enc", prompt: "Give one similarity between symmetric encryption and asymmetric encryption.", answers: ["They both use a key"],
      keywords: [/^(?!.*\b(same|one|single|shared|two|public|private)\s+keys?\b)(?!.*\b(sen[dt]\w*|shar\w*)\b)(?=.*\b(both|each|they|all|same|similar\w*|either)\b|.*\buses?\b)(?=.*\b(keys?|scrambl\w*|meaningless|unreadable|plain\s*text|ciph\w*|cyph\w*)\b).*$/i],
      distractors: ["They both use the same key", "They both use a public key", "They both send the key"],
      working: ["What do both methods use to encrypt?", "What does each method turn readable data into?"],
      note: "From 0478/13 November 2024 Q2(g)(ii): both use a key; both scramble the data or make it meaningless; both turn plain text into cipher text." },
    { id: "pl-31", category: "pl-enc", prompt: "Give one reason why a person would use asymmetric encryption instead of symmetric encryption.", answers: ["It is more secure"],
      keywords: [/^(?!.*\b(not|less)\s+(more\s+)?(secure|safe))(?:.*\b(more|very|most|extra)\s+(secure|safe)\b|.*\b(safer|securer)\b|(?=.*\bkeys?\b)(?=.*\b(no|not|dont|doesnt|cant|isnt|wont|didnt|\w+n\Wt|never|without)\b)(?=.*\b(exchang\w*|shar\w*|sen[dt]\w*|swap\w*|transmit\w*|intercept\w*|stolen|travel\w*)\b)).*$/i],
      distractors: ["It is faster", "It uses only one key", "It needs no keys"],
      working: ["What is the weak point of symmetric encryption?", "Does asymmetric encryption have that weak point?"],
      note: "From 0478/11 June 2025 Q6(b): the process is more secure; there is no need to worry about key exchange." },
    { id: "pl-32", category: "pl-enc", prompt: "In asymmetric encryption, which key is used to decrypt the data?", answers: ["Private key"],
      keywords: [/^\s*(the\s+|a\s+)?(receiver\W?s\s+)?private(\s*-?\s*key)?\s*\.?\s*$/i], distractors: ["Public key", "Shared key", "Cipher key"],
      working: ["Anyone can have the public key.", "Which key does only the receiver have?"],
      note: "From 0478/11 June 2024 Q7: plain text is encrypted into cipher text using a public key, then decrypted using a private key." }
  ];
}

const DRILLS = [
  ['y10-2-r-ext', 'Do Now Extension: all of Topic 2. Every card has an example on different details and two nudges.',
    'Year 10 Extension: Topic 2 Data Transmission', '2.R Do Now Extension',
    [['ex-trans', 'Data Transmission (2.1)'], ['ex-errors', 'Methods of Error Detection (2.2)'], ['ex-enc', 'Encryption (2.3)']], extCards],
  ['y10-2-r-choose', 'Activity 1: choose the transmission method for a scenario, and justify each part of the choice.',
    'Year 10, 2.R: Choose the Method', 'Cambridge IGCSE Computer Science 0478',
    [['ch-method', 'Which Method?'], ['ch-why', 'Why Does It Fit?'], ['ch-mistake', 'Why Is It Wrong?']], chooseCards],
  ['y10-2-r-fix', 'Exam Practice 1, Activity 2: spot the mistake in a student answer about packets or methods and type the fix.',
    'Year 10, 2.R: Spot and Fix the Mistake', 'Cambridge IGCSE Computer Science 0478',
    [['fx-trans', 'Data Transmission (2.1)']], fixCards],
  ['y10-2-r', 'Exam Practice 1 plenary: real exam questions on packets and methods of transmission, each cited in its note.',
    'Year 10, 2.R: Packets and Methods Exam Drill', 'Cambridge IGCSE Computer Science 0478',
    [['pl-packets', 'Packets'], ['pl-methods', 'Methods of Transmission']], plenaryCards],
  ['y10-2-r2-ext', 'Exam Practice 2, Do Now Extension: all of Topic 2. Every card has an example on different details and two nudges.',
    'Year 10 Extension: Topic 2 Data Transmission', '2.R Exam Practice 2 Do Now Extension',
    [['e2-trans', 'Data Transmission (2.1)'], ['e2-errors', 'Methods of Error Detection (2.2)'], ['e2-enc', 'Encryption (2.3)']], ext2Cards],
  ['y10-2-r2-fix', 'Exam Practice 2, Activity 2: spot the mistake in a student answer about error detection or encryption and type the fix.',
    'Year 10, 2.R: Spot and Fix the Mistake', 'Cambridge IGCSE Computer Science 0478',
    [['fx-errors', 'Methods of Error Detection (2.2)'], ['fx-enc', 'Encryption (2.3)']], fixCards2],
  ['y10-2-r2', 'Exam Practice 2 plenary: real exam questions on error detection and encryption, each cited in its note.',
    'Year 10, 2.R: Error Detection and Encryption Exam Drill', 'Cambridge IGCSE Computer Science 0478',
    [['pl-errors', 'Error Detection'], ['pl-enc', 'Encryption']], plenaryCards2],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|digital certificate|\bSSL\b|key pair/i.test(src), `drill ${id} names an unwanted term`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
// Draw every card many times: its answer passes, no distractor passes, and no example or working step gives the
// answer away. Then the explanation cards against more right and wrong answers.
const loaded = {};
{
  const vm = await import('node:vm');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    loaded[id] = d;
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids unique`);
    for (const card of d.cards) {
      for (let n = 0; n < (card.randomize ? 400 : 1); n++) {
        const r = card.randomize ? { ...card, ...card.randomize() } : card;
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans + '.', ans.replace(/'/g, '')].forEach((v) => assert(pass(v), `${id} ${card.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${card.id}: distractor "${x}" passes (${r.prompt.slice(0, 60)})`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${card.id}: distractors`);
        if (r.example && ans.length >= 3) {
          const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${card.id}: example contains "${ans}"`);
        }
        if (r.example) assert(!pass(r.example) || ans.length < 3, `${id} ${card.id}: example passes the card`);
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (r.working && !pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${card.id}: working shows "${ans}": ${w}`));
        if (r.working) r.working.forEach((w) => assert(!pass(w) || pass(r.prompt), `${id} ${card.id}: working passes the card: ${w}`));
        if (id.endsWith('-ext')) assert(r.example && r.working && r.working.length === 2, `${id} ${card.id}: example and two nudges`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
  const card = (id, cid) => loaded[id].cards.find((c) => c.id === cid);
  const tk = (id, cid, yes, no) => {
    const c = card(id, cid);
    yes.forEach((s) => assert(c.keywords.some((k) => k.test(s)), `${id} ${cid} rejects "${s}"`));
    no.forEach((s) => assert(!c.keywords.some((k) => k.test(s)), `${id} ${cid} accepts "${s}"`));
  };
  tk('y10-2-r-ext', 'ex-01', ['destination address and packet number', 'the sender IP address and the destination IP address', 'packet number, originator address'], ['payload and trailer', 'IP address', 'packet number and payload']);
  tk('y10-2-r-ext', 'ex-04', ['it is detected automatically', 'it can power the device', 'the driver is installed automatically', 'it only fits one way'], ['it is fast', 'it sends data', 'it is a cable']);
  tk('y10-2-r-ext', 'ex-10', ['someone could intercept the key and decrypt the data', 'the key could be stolen and used to read the messages', 'a hacker could intercept it and read the data'], ['it is slow', 'the key is long', 'it uses one key']);
  tk('y10-2-r-fix', 'fx-20', ['one direction only', 'only one way', 'in one direction', 'one-way'], ['one direction at a time', 'both directions', 'one way at a time, taking turns']);
  tk('y10-2-r-fix', 'fx-21', ['each packet can take a different route', 'they can take different paths', 'packets may go on their own routes'], ['the same route', 'the shortest route']);
  tk('y10-2-r2-ext', 'e2-03', ['the bits can skew', 'they arrive at different times', 'there is more interference'], ['it is slow', 'it is far']);
  tk('y10-2-r2-ext', 'e2-10', ['it could be intercepted', 'a hacker could read it', 'someone could see the data on the way'], ['it has errors', 'it is faster']);
  tk('y10-2-r2-fix', 'fx-12', ['if no acknowledgement arrives', 'if the acknowledgement does not arrive', 'when it does not get an acknowledgement'], ['if an acknowledgement arrives', 'when the acknowledgement arrives']);
  tk('y10-2-r-fix', 'fx-03', ['one direction at a time', 'not at the same time', 'they take turns'], ['at the same time', 'both directions']);
  tk('y10-2-r', 'pl-06', ['each packet can take a different route', 'they take different paths and some are slower', 'some packets take longer so they arrive in the wrong order'], ['they are sent at different times', 'the router is slow', 'they are lost']);
  tk('y10-2-r', 'pl-16', ['it only needs to go one way', 'the stock system does not need to reply', 'no response is needed'], ['it is faster', 'both ways']);
  // The choose cards' reasons, per scenario type, against right and wrong answers.
  const CH = card('y10-2-r-choose', 'ch-06');
  for (let n = 0; n < 200; n++) {
    const r = CH.randomize();
    const kwd = r.keywords[0];
    const dir = /simplex/.test(r.prompt.split('\n')[1]) ? 'one' : /half/.test(r.prompt.split('\n')[1]) ? 'turns' : 'both';
    const yes = { one: ['data only goes one way', 'nothing is sent back', 'the computer never sends data back'], turns: ['both directions but not at the same time', 'data goes both ways, one at a time', 'they take turns sending both ways'], both: ['both directions at the same time', 'both people talk at the same time', 'data goes both ways at once'] }[dir];
    const no = { one: ['data goes both ways', 'it is fast'], turns: ['both directions at the same time', 'one way only'], both: ['both directions, one at a time', 'not at the same time, both ways'] }[dir];
    yes.forEach((s) => assert(kwd.test(s), `ch-06 ${dir} rejects "${s}"`));
    no.forEach((s) => assert(!kwd.test(s), `ch-06 ${dir} accepts "${s}"`));
  }
  const CW = card('y10-2-r-choose', 'ch-04');
  for (let n = 0; n < 200; n++) {
    const r = CW.randomize();
    const ser = /uses serial/.test(r.prompt);
    (ser ? ['it is a long distance so the bits arrive in order', 'the building is far away, so there is less interference', 'over 200 metres serial bits will not skew'] : ['the chips are very close so parallel is faster', 'it is a short distance and several bits go at once'])
      .forEach((s) => assert(r.keywords[0].test(s), `ch-04 ${ser ? 'serial' : 'parallel'} rejects "${s}"`));
    (ser ? ['serial is faster', 'it is cheaper', 'it is far away'] : ['it is faster', 'it is close', 'parallel is slow over short distances']).forEach((s) => assert(!r.keywords[0].test(s), `ch-04 accepts "${s}"`));
  }
}

for (const L of [L1, L2]) {
  const text = JSON.stringify(L.steps);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(text), `dash found in ${L.id}`);
  assert(!/mario/i.test(text), 'never named');
  const lesson = { id: L.id, label: L.label, steps: L.steps, validators: L.validators, pseudocodeValidators: {} };
  fs.writeFileSync(path.join(ROOT, 'LessonData', L.id + '.json'), JSON.stringify(lesson, null, 1) + '\n');
}

// Register Lesson 1 as its own "2.R" unit straight after the 2.3 unit, then Lesson 2 right after it. lessons.json is
// shared with other builders, so read it at the last moment and insert as text, leaving the rest exactly as it was.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
let raw = fs.readFileSync(lp, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const has = (id) => JSON.parse(raw).years.some((y) => y.units.some((u) => u.lessons.includes(id)));
if (!has(L1.id)) {
  const anchor = ['            "y10-2-3-l2"', '          ]', '        }'].join(eol);
  const parts = raw.split(anchor);
  assert(parts.length === 2, 'the 2.3 unit ending with y10-2-3-l2 must appear exactly once in lessons.json');
  const unit = ['            "y10-2-3-l2"', '          ]', '        },', '        {', '          "code": "2.R",', '          "title": "Topic 2 Review",', '          "lessons": [', `            "${L1.id}"`, '          ]', '        }'].join(eol);
  raw = parts.join(unit);
  JSON.parse(raw);
  fs.writeFileSync(lp, raw);
}
if (!has(L2.id)) {
  const anchor = `            "${L1.id}"` + eol;
  const parts = raw.split(anchor);
  assert(parts.length === 2, 'y10-2-r must appear exactly once in lessons.json, last in its unit');
  raw = parts.join(`            "${L1.id}",` + eol + `            "${L2.id}"` + eol);
  JSON.parse(raw);
  fs.writeFileSync(lp, raw);
}
const y10 = JSON.parse(fs.readFileSync(lp, 'utf8')).years.find((y) => y.id === 'year10');
const unitR = y10.units.find((u) => u.code === '2.R');
assert(unitR && unitR.lessons.join() === [L1.id, L2.id].join(), '2.R unit holds both lessons in order');
for (const L of [L1, L2]) console.log(`${L.id}: ${L.steps.length} steps, ${Object.keys(L.validators).length} validator sets`);
console.log(`Year 10 units: ${y10.units.map((u) => u.code).join(', ')}`);
