// Builds LessonData/y10-2-1-l2.json: Year 10, 2.1 L2 Methods of Data Transmission, and registers it in the
// Year 10 Data Transmission unit.
//   node tools/build_y10_2_1_l2.mjs
// Syllabus 0478 (2026 to 2028) 2.1 2(a) and 2(b): serial, parallel, simplex, half-duplex and full-duplex, their
// advantages and disadvantages, and choosing a method for a scenario. USB (2.1 3) is the next lesson.
// Do Now: the y10-2-1-l2-recap drill (two cards per topic so far). Activities: Transmission Lab, serial and
// parallel, then simplex and duplex with a scenario table. Plenary: the y10-2-1-l2-transmission drill.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-2-1-l2';
const P = 'y10-21l2';                    // prefix for element ids
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;

// ---------------------------------------------------------------- diagrams (site colour tokens)
const BIT1 = 'var(--warn, #fdd663)', BIT0 = 'var(--muted, #9aa0a6)', INK = 'var(--ink, #e8eaed)', EDGE = 'var(--brand, #8ab4f8)';
const BOX = 'var(--surface-2, #1d2128)', WIRE = 'var(--line-strong, #3b424e)', LANE_B = '#c58af9';
const FONT = 'font-family="Roboto, system-ui, sans-serif"';
function device(x, y, w, h, label) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${BOX}" stroke="${EDGE}" stroke-width="2"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}" ${FONT}>${label}</text>`;
}
function bit(x, y, b) {
  const c = b === '1' ? BIT1 : BIT0;
  return `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${c}" stroke-width="2"/>` +
    `<text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="${c}" font-family="ui-monospace, Consolas, monospace">${b}</text>`;
}
const BYTE = '01000001';                 // ASCII A
function serialSvg() {
  const y = 60;
  let s = `<svg viewBox="0 0 420 110" width="420" style="max-width:100%;height:auto" role="img" aria-label="Serial: the 8 bits of A travel one after another down one wire">`;
  s += device(4, 30, 70, 60, 'Sender') + device(346, 30, 70, 60, 'Receiver');
  s += `<line x1="74" y1="${y}" x2="346" y2="${y}" stroke="${WIRE}" stroke-width="3"/>`;
  BYTE.split('').forEach((b, i) => { s += bit(107 + i * 29, y, b); });
  s += `<text x="210" y="18" text-anchor="middle" font-size="13" fill="${BIT0}" ${FONT}>1 wire: one bit after another</text></svg>`;
  return s;
}
function parallelSvg() {
  let s = `<svg viewBox="0 0 420 230" width="420" style="max-width:100%;height:auto" role="img" aria-label="Parallel: the 8 bits of A travel side by side down eight wires">`;
  s += device(4, 30, 70, 196, 'Sender') + device(346, 30, 70, 196, 'Receiver');
  BYTE.split('').forEach((b, i) => {
    const y = 44 + i * 24;
    s += `<line x1="74" y1="${y}" x2="346" y2="${y}" stroke="${WIRE}" stroke-width="3"/>` + bit(210, y, b);
  });
  s += `<text x="210" y="18" text-anchor="middle" font-size="13" fill="${BIT0}" ${FONT}>8 wires: all 8 bits at the same time</text></svg>`;
  return s;
}
function directionSvg() {
  const rows = [['Simplex', 'one'], ['Half-duplex', 'turns'], ['Full-duplex', 'both']];
  let s = `<svg viewBox="0 0 460 250" width="460" style="max-width:100%;height:auto" role="img" aria-label="Simplex: A to B only. Half-duplex: both ways, one at a time. Full-duplex: both ways at once.">` +
    `<defs><marker id="${P}-ah-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${EDGE}"/></marker>` +
    `<marker id="${P}-ah-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${LANE_B}"/></marker></defs>`;
  rows.forEach(([name, kind], r) => {
    const top = 8 + r * 82;
    s += `<text x="0" y="${top + 38}" font-size="14" font-weight="700" fill="${INK}" ${FONT}>${name}</text>`;
    s += device(108, top + 10, 52, 44, 'A') + device(404, top + 10, 52, 44, 'B');
    if (kind === 'one') {
      s += `<line x1="162" y1="${top + 32}" x2="400" y2="${top + 32}" stroke="${EDGE}" stroke-width="3" marker-end="url(#${P}-ah-a)"/>`;
    } else if (kind === 'turns') {
      s += `<line x1="164" y1="${top + 32}" x2="400" y2="${top + 32}" stroke="${EDGE}" stroke-width="3" marker-end="url(#${P}-ah-a)" marker-start="url(#${P}-ah-a)"/>` +
        `<text x="282" y="${top + 72}" text-anchor="middle" font-size="13" fill="${BIT0}" ${FONT}>one direction at a time</text>`;
    } else {
      s += `<line x1="162" y1="${top + 22}" x2="400" y2="${top + 22}" stroke="${EDGE}" stroke-width="3" marker-end="url(#${P}-ah-a)"/>` +
        `<line x1="400" y1="${top + 42}" x2="164" y2="${top + 42}" stroke="${LANE_B}" stroke-width="3" marker-end="url(#${P}-ah-b)"/>` +
        `<text x="282" y="${top + 72}" text-anchor="middle" font-size="13" fill="${BIT0}" ${FONT}>both directions at the same time</text>`;
    }
  });
  return s + '</svg>';
}

// ---------------------------------------------------------------- step builders
const validators = {};
function mc(id, label, heading, lead, items) {
  return { id, label, type: 'multiple-choice', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2><p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function selfMarked(id, label, heading, lead, items) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2><p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
// A short-answer card: parts = [{ label, answer: regex source, feedback }]
function checkStep(id, label, heading, lead, parts) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
      `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} marks</strong></div>` +
      `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>` };
}
function embed(id, label, appId, heading, lead) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
const facts = (items) => '<ul class="lesson-facts">' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;

const steps = [];

// ---------------------------------------------------------------- Do Now: recap drill
steps.push(embed('do-now', 'Do Now: Recap Drill', 'drill-y10-2-1-l2-recap', 'Do Now: Recap Drill',
  'Ten questions, two from each topic so far: 1.1 Number Systems, 1.2 Text, Sound and Images, 1.3 Storage and File Size, 1.3 Compression, and 2.1 L1 Packets.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Methods of Data Transmission',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Data Transmission</p><h2 class="lesson-h2">Methods of Data Transmission</h2><p>Year 10, 2.1 L2 &middot; 55 minutes</p></div>' +
    facts(['Describe serial and parallel data transmission.', 'Describe simplex, half-duplex and full-duplex data transmission.', 'Choose a method for a scenario and explain why it suits it.']) });

// ---------------------------------------------------------------- concept 1: serial and parallel
steps.push({ id: 'concept-serial', label: 'Serial and Parallel',
  content: '<h2 class="lesson-h2">Serial and Parallel</h2><p class="lesson-lead">The same letter, A (01000001 in ASCII), sent two ways.</p>' +
    columns(serialSvg() + facts(['<strong>Serial:</strong> one bit at a time, down a single wire.', 'The bits arrive in order, so it is reliable over long distances.', 'Fewer wires, so it is cheaper. But it is slower.']),
      parallelSvg() + facts(['<strong>Parallel:</strong> several bits at the same time, down several wires.', 'Faster than serial.', 'Over a long distance the bits can <strong>skew</strong> (arrive out of step), so the data can be wrong. Short distances only.'])) });


steps.push(mc('check-serial', 'Check: Serial or Parallel?', 'Check: Serial or Parallel?', 'Use the slide on serial and parallel.',
  [{ prompt: 'Which method sends several bits at the same time?', options: ['Serial', 'Parallel', 'Packet switching'], correct: 1,
    explain: 'Parallel sends several bits at once, one down each wire.' },
  { prompt: 'Why is parallel not used over long distances?', options: ['Its bits can skew and arrive out of step', 'It only has one wire', 'It is slower than serial'], correct: 0,
    explain: 'Over a long distance the wires are not all the same speed, so the bits skew.' }]));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Serial and Parallel', 'transmission-lab-wires', 'Activity 1: Serial and Parallel',
  'Send the letter both ways, down a short and a long cable. Complete the five tasks.'));

steps.push(selfMarked('exam-serial', 'Exam Question: Why Serial?', 'Exam Question: Why Serial?',
  cite('0478/12, March 2021, Question 1(d)(i)') + ' Electronic data about the final score for a hockey match is transmitted to a central computer 30 kilometres away, using serial transmission.',
  [{ id: 'why-serial', prompt: 'Explain why serial transmission is more appropriate than parallel transmission in this scenario. [3]', marks: 3,
    modelAnswer: 'Any three: the data travels a long distance (30 km); parallel bits could skew / arrive out of sync over that distance, so the data could be corrupted; serial sends one bit at a time, so the bits arrive in order and there are fewer errors; serial needs fewer wires, so it is cheaper over a long distance.' }]));


// ---------------------------------------------------------------- concept 2: direction
steps.push({ id: 'concept-duplex', label: 'Simplex, Half-Duplex and Full-Duplex',
  content: '<h2 class="lesson-h2">Simplex, Half-Duplex and Full-Duplex</h2><p class="lesson-lead">These describe which way the data can travel.</p>' +
    columns(directionSvg(), facts(['<strong>Simplex:</strong> one direction only. The receiver cannot send back.',
      '<strong>Half-duplex:</strong> both directions, but only one direction at a time.',
      '<strong>Full-duplex:</strong> both directions at the same time. Fastest for two-way data, but needs a channel each way.',
      'A method has two parts, for example <strong>serial full-duplex</strong>.'])) });

steps.push(mc('check-duplex', 'Check: Which Direction?', 'Check: Which Direction?', 'Use the slide on simplex and duplex.',
  [{ prompt: 'Data can travel both ways, but only one way at a time. Which method is this?', options: ['Simplex', 'Half-duplex', 'Full-duplex'], correct: 1,
    explain: 'Half-duplex: both directions, one at a time.' },
  { prompt: 'With which method can the receiver never send data back?', options: ['Full-duplex', 'Half-duplex', 'Simplex'], correct: 2,
    explain: 'Simplex is one direction only.' }]));

// Both of these name simplex, so they come after the direction slide.
steps.push(mc('exam-methods', 'Exam Question: Methods of Transmission', 'Exam Question: Methods of Transmission',
  cite('0478/12, June 2024, Question 2(a)') + ' Data can be transmitted from one device to another.',
  [{ prompt: 'Which term is not a method for transmitting data? [1]', options: ['Serial', 'Simplex', 'Parity', 'Parallel'], correct: 2,
    explain: 'Parity is a way of checking for errors. Serial, parallel and simplex are all methods of transmitting data.' }]));
steps.push(selfMarked('exam-umar', 'Exam Question: Parallel Simplex', 'Exam Question: Parallel Simplex',
  cite('0478/13, June 2022, Question 7(b)') + ' Umar sends data from his computer to a file server using parallel simplex data transmission. The file server is moved to another building that is 1 km away.',
  [{ id: 'umar-b', prompt: 'Explain why the parallel simplex data transmission method that Umar uses is no longer suitable. [2]', marks: 2,
    modelAnswer: 'Any two: 1 km is a long distance for parallel; the bits could skew / arrive out of sync, so the data could be corrupted or have errors; many wires over 1 km would be expensive.' }]));

steps.push(selfMarked('exam-half', 'Exam Question: Half-Duplex', 'Exam Question: Half-Duplex',
  cite('0478/12, March 2021, Question 1(d)(ii)') + ' The data transmission for the hockey scores is also half-duplex.',
  [{ id: 'half', prompt: 'Describe half-duplex data transmission. [2]', marks: 2,
    modelAnswer: 'Data can be sent in both directions (1), but only in one direction at a time / not at the same time (1).' }]));

steps.push(selfMarked('exam-full', 'Exam Question: Full-Duplex', 'Exam Question: Full-Duplex',
  cite('0478/12, March 2023, Question 5(b)(ii)') + ' Computer A is connected to a router in a different room. The connection will use full-duplex data transmission.',
  [{ id: 'full', prompt: 'Define full-duplex data transmission. [2]', marks: 2,
    modelAnswer: 'Data can be sent in both directions (1) at the same time / simultaneously (1).' }]));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Simplex and Duplex', 'transmission-lab-duplex', 'Activity 2: Simplex and Duplex',
  'Try each kind of link, complete the four tasks, then choose a method for six scenarios.'));

steps.push(selfMarked('exam-restaurant', 'Exam Question: Choosing a Method (1 of 2)', 'Exam Question: Choosing a Method (1 of 2)',
  cite('0478/11, June 2025, Question 4(a)(i)') + ' A restaurant\'s ordering system transmits each customer\'s order across its network to a computer in the kitchen. The data is sent using serial full-duplex data transmission.',
  [{ id: 'restaurant-i', prompt: 'Give two reasons why serial full-duplex is a suitable data transmission method for the data. [2]', marks: 2,
    modelAnswer: 'Any two: data can be sent and received at the same time (for example the order goes to the kitchen while a confirmation comes back); serial is reliable over the distance to the kitchen, as the bits arrive in order and do not skew; serial needs fewer wires, so it is cheaper.' }]));

steps.push(selfMarked('exam-restaurant-2', 'Exam Question: Choosing a Method (2 of 2)', 'Exam Question: Choosing a Method (2 of 2)',
  cite('0478/11, June 2025, Question 4(a)(ii)') + ' The restaurant considers parallel transmission instead of serial transmission.',
  [{ id: 'restaurant-ii', prompt: 'Give one improvement that would be made to the data transmission if parallel transmission is used instead of serial transmission. [1]', marks: 1,
    modelAnswer: 'The data would be transmitted faster.' }]));

// ---------------------------------------------------------------- checked practice
steps.push(checkStep('practice', 'Checked Practice', 'Checked Practice', 'Name the method each time.', [
  { label: 'Data is sent in both directions at the same time.', answer: '^\\s*(it\\s+is\\s+)?full[\\s-]*duplex(\\s+transmission)?\\s*$', feedback: 'Both directions, at the same time.' },
  { label: 'A cable sends 8 bits at the same time, down 8 wires.', answer: '^\\s*(it\\s+is\\s+)?parallel(\\s+transmission)?\\s*$', feedback: 'Several bits at once, each down its own wire.' },
  { label: 'A radio station sends music to car radios. Nothing is sent back.', answer: '^\\s*(it\\s+is\\s+)?simplex(\\s+transmission)?\\s*$', feedback: 'Data only travels one way.' },
  { label: 'Over a long distance, bits sent in parallel arrive out of step. What is this called?', answer: '^\\s*(bit\\s+|data\\s+)?(skew|skewing|skewed)\\s*$', feedback: 'The bits get out of step with each other.' },
]));

// ---------------------------------------------------------------- plenary drill
steps.push(embed('plenary', 'Plenary: Methods of Data Transmission', 'drill-y10-2-1-l2-transmission', 'Plenary: Methods of Data Transmission',
  'Complete a drill batch. Your progress is saved for your teacher.'));

const lesson = { id: ID, label: '2.1 L2: Methods of Data Transmission', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// Register it in Year 10, after 2.1 L1.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y10 = all.years.find(y => y.id === 'year10');
const unit = y10.units.find(u => u.code === '2.1');
if (!unit.lessons.includes(ID)) unit.lessons.push(ID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
