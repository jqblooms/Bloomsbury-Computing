// Builds LessonData/y10-2-1-l3.json: Year 10, 2.1 L3: USB (syllabus 0478 2.1 3: the universal serial bus interface,
// how it transmits data, and its benefits and drawbacks), and registers it after L2 in the Year 10 2.1 unit.
//   node tools/build_y10_2_1_l3.mjs
// Written for mostly EAL learners (James, 2026-09-30 and 2026-10-01): one idea, short sentences, a teacher-only
// Think, Pair, Share "why" under every heading, predict-then-reveal teaching slides, and two cases side by side.
// Every exam question is real and cited; the Do Now recaps L1 (packets) and L2 (serial and simplex) with real
// questions. Activities: Transmission Lab (half-duplex, then serial over a long cable). Plenary: y10-2-1-l3-usb.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-1-l3';
const P = 'y10-21l3';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const caption = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);

const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ = null) {
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
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + card };
}
function selfMarked(id, label, heading, lead, items, whyQ = null) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// Marking for the auto-marked parts.
const DRAWBACK = '(length|long|short|5\\s*m|five\\s+met(re|er)s?|distance|far|slow|speed|older|old\\s+version|not\\s+support|compatib|limited\\s+power|power\\s+(is\\s+)?limited)';
const steps = [];

// ---------------------------------------------------------------- Do Now (L1 packets, L2 serial and simplex)
steps.push(checkStep('do-now', 'Do Now: Packets (1 of 2)', 'Do Now: Packets (1 of 2)',
  'From Lesson 1. ' + cite('0478/12, June 2026, Question 3(e)(i)') + ' Each packet of data is divided into three parts. One part is the payload.', [
    { line: true, marks: 2, label: 'Give the names of the two other parts of a packet of data.', answer: '^(?=.*\\bheaders?\\b)(?=.*\\b(trailers?|footers?)\\b).*$', feedback: 'One part comes before the payload and one part comes after it.' },
  ], ['Why does a packet need parts other than the payload?', 'The payload is the data. The other parts say where it is going, its order, and how to check it arrived whole.']));
steps.push(checkStep('do-now-2', 'Do Now: Serial Simplex (2 of 2)', 'Do Now: Serial Simplex (2 of 2)',
  'From Lesson 2. ' + cite('0478/13, June 2025, Question 6(c)(ii)') + ' The data for an alert is sent using serial simplex data transmission.', [
    { line: true, marks: 2, label: 'Explain how the data is sent using serial simplex data transmission.', answer: '^(?=.*\\bbits?\\b)(?=.*\\b(one|1|single|only)\\b)(?=.*\\b(direction|directions|way|ways)\\b).*$', feedback: 'Two ideas: how many bits go at a time (serial), and which way the data can go (simplex).' },
  ], ['Why do we need two words, serial AND simplex?', 'Serial says how many bits go at a time. Simplex says which way the data goes. They answer different questions.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'USB',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">2.1 Data Transmission</p><h2 class="lesson-h2">USB</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> what USB is, how it sends data, and why we use it.', '<strong>You already know:</strong> serial, parallel, simplex and duplex. USB uses them.']) +
    why('Why does almost every mouse, keyboard and phone use the same kind of plug?', 'One standard plug works with almost every computer. People do not need a different cable for each device.') });

// ---------------------------------------------------------------- what USB is: predict then reveal
steps.push({ id: 'concept-usb', label: 'What Is USB?',
  content: '<h2 class="lesson-h2">What Is USB?</h2>' +
    tps('Predict: USB means <strong>Universal Serial Bus</strong>. From last lesson, what does <strong>serial</strong> tell you about how USB sends data?',
      '<p>Serial: <strong>one bit at a time</strong>, one after another, down one wire.</p><p>So the bits cannot skew. They arrive <strong>in order</strong>.</p>', 'Show the worked answer') +
    facts(['<strong>USB</strong> is a standard <strong>interface</strong>: a way to connect a device (like a mouse) to a computer.',
      'A USB cable carries <strong>data</strong> and <strong>power</strong>.',
      'USB sends data by <strong>serial</strong> transmission: one bit at a time.',
      'USB is <strong>half-duplex</strong>: both directions, but one direction at a time.',
      'When you plug a device in, the computer <strong>detects</strong> it and loads its <strong>driver</strong> (the program that lets the computer use the device).']) });

const DRONE = ' A drone can be connected to a computer using a universal serial bus (USB) interface to transfer the video recorded by its camera.';
steps.push(selfMarked('exam-interface', 'Exam Question: The USB Interface (1 of 2)', 'Exam Question: The USB Interface (1 of 2)',
  cite('0478/12, March 2026, Question 3(c)(i)') + DRONE, [
    { id: 'interface-meaning', prompt: 'State what is meant by a USB interface. [1]', marks: 1,
      modelAnswer: 'A standard (universal) connection / port used to connect a device (peripheral) to a computer, so data can be sent between them.' },
  ], ['Why does the word "universal" matter here?', 'Universal means it is a standard. The same connection works with many different devices.']));
steps.push(selfMarked('exam-interface-2', 'Exam Question: The USB Interface (2 of 2)', 'Exam Question: The USB Interface (2 of 2)',
  cite('0478/12, March 2026, Question 3(c)(ii)') + DRONE, [
    { id: 'interface-how', prompt: 'Explain how a USB interface is used to transmit data. [3]', marks: 3,
      modelAnswer: 'Any three: the device is connected to the computer with a USB cable / port; the computer detects the device and loads its driver automatically; data is sent using serial transmission, one bit at a time; it is half-duplex, so data goes both ways but one way at a time.' },
  ], ['Why is "a way to connect" not enough for full marks here?', 'The question says explain HOW. Say how the bits travel: serial, one at a time, and half-duplex.']));

steps.push(embed('activity-1', 'Activity 1: Half-Duplex', 'transmission-lab-duplex', 'Activity 1: Half-Duplex',
  'USB is half-duplex. Choose <strong>half-duplex</strong> and send data from A, then from B, then from both at once.',
  ['What happens when both sides try to send at once on a half-duplex link? Why?', 'One side must wait. Half-duplex only lets data go one way at a time.']));

// ---------------------------------------------------------------- benefits and drawbacks: predict then reveal
steps.push({ id: 'concept-good-bad', label: 'Benefits and Drawbacks',
  content: '<h2 class="lesson-h2">Benefits and Drawbacks</h2>' +
    tps('Predict: a new USB mouse works the moment you plug it in, with no battery. Which benefits does that show?',
      '<p>It is <strong>detected automatically</strong>: the computer loads its driver for you.</p><p>The cable <strong>supplies power</strong>, so it needs no battery.</p>', 'Show the worked answer') +
    columns('<p style="margin:0 0 6px;font-weight:700">Benefits</p>' + facts(['A <strong>standard</strong> connection: it fits most devices.', 'Devices are <strong>detected automatically</strong> and the driver is loaded.', 'It can <strong>supply power</strong> to the device.', 'The plug only fits <strong>one way</strong>, so it is not damaged.', 'Serial, so the bits arrive <strong>in order</strong>.']),
      '<p style="margin:0 0 6px;font-weight:700">Drawbacks</p>' + facts(['The cable can only be about <strong>5 metres</strong> long.', 'It is <strong>slower</strong> than some other connections.', 'Very <strong>old versions</strong> may not work with new devices.'])) });

steps.push({ id: 'compare', label: 'Compare: Same Cable, Different Job',
  content: '<h2 class="lesson-h2">Compare: Same Cable, Different Job</h2>' +
    tps('Both use a USB cable. Which one works well? Why does the other one have a problem?',
      '<p><strong>A works well:</strong> the mouse is close, and USB powers it.</p><p><strong>B has a problem:</strong> 20 metres is far longer than a USB cable can be (about 5 metres).</p>') +
    columns(caption('A: a mouse on the desk') + facts(['Distance: <strong>1 metre</strong>', 'Needs power: <strong>yes</strong>', 'Sends: clicks and movement']),
      caption('B: a printer in another room') + facts(['Distance: <strong>20 metres</strong>', 'Has its own power plug', 'Sends: pages to print'])) });

steps.push(checkStep('exam-type', 'Exam Question: Type of Transmission', 'Exam Question: Type of Transmission',
  cite('0478/11, June 2021, Question 2(c)(ii)') + ' Julia uses a USB connection to transfer data onto her USB flash memory drive.', [
    { label: 'Identify the type of data transmission used in a USB connection.', answer: '^(?!.*\\bparallel\\b).*\\bserial\\b.*$', feedback: 'Look at the letters USB. What does the S stand for?' },
  ], ['Why can you answer this from the name alone?', 'USB means Universal Serial Bus. The S tells you it is serial.']));
steps.push(selfMarked('exam-benefits', 'Exam Question: Two Benefits', 'Exam Question: Two Benefits',
  cite('0478/11, June 2021, Question 2(c)(i)') + ' One benefit of using a USB connection is that it is a universal connection.', [
    { id: 'benefits-2021', prompt: 'State two other benefits of using a USB connection. [2]', marks: 2,
      modelAnswer: 'Any two: the device is detected automatically; the driver is loaded automatically; it can supply power to the device; it only fits one way, so it is not plugged in wrongly; it is backward compatible with older USB versions; it supports different transmission speeds.' },
  ], ['Why must you not write "it is universal" here?', 'The question already gives that benefit. You must give two OTHER benefits.']));
steps.push(selfMarked('exam-mouse', 'Exam Question: The USB Mouse', 'Exam Question: The USB Mouse',
  cite('0478/11, June 2026, Question 4(c)') + ' An optical mouse is connected to a computer using a USB cable. One benefit is that bits of data are less likely to arrive out of order.', [
    { id: 'benefits-2026', prompt: 'Give two other benefits of using the USB cable to connect the optical mouse to the computer. [2]', marks: 2,
      modelAnswer: 'Any two: the mouse is detected automatically / the driver is loaded automatically; the cable supplies power, so the mouse needs no battery; it is a universal / standard connection, so it fits most computers; it only fits one way.' },
  ], ['Why does "less likely to arrive out of order" happen with USB?', 'USB is serial. The bits go one after another, so they cannot skew.']));
steps.push(checkStep('exam-drawback', 'Exam Question: A Drawback', 'Exam Question: A Drawback',
  cite('0478/12, November 2025, Question 5(c)(iii)') + ' A mouse is connected to a computer using a USB connection.', [
    { line: true, label: 'Give one drawback of using a USB connection for this purpose.', answer: `^.*${DRAWBACK}.*$`, feedback: 'Think about how far a USB cable can reach, or how fast it is compared with other connections.' },
  ], ['A mouse is used close to the computer. Why is the 5 metre cable limit still a drawback?', 'The mouse can never be used further away than the cable reaches. A different connection could reach further.']));

steps.push(embed('activity-2', 'Activity 2: Why USB Is Serial', 'transmission-lab-wires', 'Activity 2: Why USB Is Serial',
  'Send one letter down the <strong>long</strong> cable, first by serial, then by parallel. Compare what arrives.',
  ['Why did the long parallel cable get the letter wrong? Why does that make serial better for USB?', 'Over a long cable, parallel bits skew and arrive out of step. Serial bits arrive in order, so the data is correct.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: USB Drill', 'drill-y10-2-1-l3-usb', 'Plenary: USB Drill',
  'What USB is, how it sends data, benefits and drawbacks, and whether it suits a job. Your progress is saved.',
  ['Why practise with new questions every time?', 'If you can answer any USB question, you really understand it.']));

// ---------------------------------------------------------------- self-checks
const T = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(T('do-now', 0, 'header and trailer') && T('do-now', 0, 'Trailer, Header') && !T('do-now', 0, 'header') && !T('do-now', 0, 'payload and header'), 'packets');
assert(T('do-now-2', 0, 'one bit at a time in one direction') && T('do-now-2', 0, 'Data is sent a bit at a time, only one way') && !T('do-now-2', 0, 'one bit at a time') && !T('do-now-2', 0, 'one direction only'), 'simplex');
assert(T('exam-type', 0, 'serial') && T('exam-type', 0, 'Serial half-duplex') && !T('exam-type', 0, 'parallel') && !T('exam-type', 0, 'serial or parallel'), 'type');
assert(T('exam-drawback', 0, 'the cable length is limited') && T('exam-drawback', 0, 'it is slower than other connections') && T('exam-drawback', 0, 'Max 5m cable') && !T('exam-drawback', 0, 'it fits most devices') && !T('exam-drawback', 0, 'it supplies power'), 'drawback');

const lesson = { id: ID, label: '2.1 L3: USB', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it after L2 in the Year 10 2.1 unit.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find((y) => y.id === 'year10').units.find((u) => u.lessons.includes('y10-2-1-l2'));
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y10-2-1-l2') + 1, 0, ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; unit is now ${unit.lessons.join(', ')}`);
