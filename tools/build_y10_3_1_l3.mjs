// Builds LessonData/y10-3-1-l3.json: Year 10, 3.1.3: Buses and Data Movement (syllabus 0478 3.1: the purpose of the
// address bus, the data bus and the control bus in a Von Neumann architecture).
//   node tools/build_y10_3_1_l3.mjs
// It adds the lesson to the "3.1" unit after y10-3-1-l2. The plenary drill y10-3-1-l3 is built separately (its own
// data file and registry entry); this builder only embeds it.
// The lesson is made to be done by a student alone: every slide says what to do and when it is done, and every
// teaching slide is a prediction the student makes, then the reason is shown (multiple-choice explain). No Think,
// Pair, Share (it is teacher-only). The fetch-decode-execute cycle is 3.1.4: no step of the cycle is taught here, only
// what each bus carries, which way, and why.
// Activities: CPU Lab activity=buses (Which Bus, Which Way?), levels 1 to 2 on Activity 1, 3 to 4 on Activity 2, with the
// help fading a step each level. Activity 3 is the game: CPU Lab 3D in lesson mode 3.1.3 (carry each cube onto its bus,
// at the end for the way it goes; then trace a read and a write from a tray with two cubes that do not belong).
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:  0478/12 November 2024 Q6 (the CU, MAR and CIR rows); 0478/11 November 2022 Q2(c)
//   Exam:    0478/13 November 2021 Q5 (the address bus row); 0478/12 November 2024 Q6 (the data bus row);
//            0478/11 November 2024 Q5(d) (adapted: type the three words instead of circling); 0478/11 November 2022 Q2(a);
//            0478/12 March 2021 Q8(b)(ii); 0478/13 June 2023 Q2(c)(ii); 0478/13 June 2021 Q10(a) (the data bus row);
//            0478/11 November 2021 Q6(a) (the address bus row)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l3';
const PREV = 'y10-3-1-l2';
const P = 'y10-313';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const MONO = 'font-family:var(--font-mono, monospace)';
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;

// ---------------------------------------------------------------- the bus picture
// CPU on the left, memory on the right, the three buses between. lanes: { addr, data, ctrl: { v, dir: 'out'|'in'|'' } }.
const LANE = { addr: ['Address bus', '#6aa9ff'], data: ['Data bus', '#fdd663'], ctrl: ['Control bus', '#f28b82'] };
function busPic(lanes = {}, mem = [], hit = null, caption = '') {
  const lane = (k) => {
    const [name, col] = LANE[k];
    const l = lanes[k];
    const chip = l ? `<span style="${MONO};white-space:nowrap;font-weight:700;font-size:16px;padding:1px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--line-strong)">${l.dir === 'in' ? '&larr; ' : ''}${l.v}${l.dir === 'out' ? ' &rarr;' : ''}</span>` : '';
    return `<div style="display:grid;grid-template-columns:118px 1fr;align-items:center;gap:6px"><span style="font-weight:600;font-size:15px">${name}</span>` +
      `<span style="height:28px;border-radius:999px;background:var(--surface-3, var(--surface-2));border:2px solid ${col};display:flex;align-items:center;justify-content:center">${chip}</span></div>`;
  };
  const rows = mem.map(([a, v]) => `<tr${a === hit ? ' style="outline:2px solid var(--warn);outline-offset:-2px"' : ''}><td style="padding:1px 8px;color:var(--muted)">${a}</td><td style="padding:1px 8px;${MONO};font-weight:700;color:var(--syn-number, #fdd663)">${v}</td></tr>`).join('');
  const memBox = `<div style="border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2);padding:4px 6px;text-align:center"><b>Memory</b>` +
    (rows ? `<table style="border-collapse:collapse;margin:2px auto 0;font-size:14px"><tr><th style="font-size:12px;color:var(--muted);padding:0 8px">Address</th><th style="font-size:12px;color:var(--muted);padding:0 8px">Holds</th></tr>${rows}</table>` : '') + '</div>';
  return `<div style="display:grid;grid-template-columns:78px minmax(0,1fr) 130px;gap:8px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--surface)">` +
    `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:14px 4px;text-align:center"><b>CPU</b></div>` +
    `<div style="display:grid;gap:6px">${lane('addr')}${lane('data')}${lane('ctrl')}</div>${memBox}</div>` +
    (caption ? `<p style="margin:4px 0 0;text-align:center;font-size:15px">${caption}</p>` : '');
}

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, lead, parts, extra = '', grid = 0) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  // A part with answers: [{ answer, feedback }] is one box marked by each pattern, a mark each (one mark per bus).
  validators[key] = parts.flatMap((p, i) => (p.answers || [p]).map((a) =>
    Object.assign({ suffix: 'abcdefgh'[i], pattern: re(a.answer), feedback: a.feedback }, a.marks > 1 ? { marks: a.marks } : {})));
  parts.forEach((p) => { if (p.answers) p.marks = p.answers.length; });
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const gridStyle = grid ? ` style="display:grid;grid-template-columns:repeat(${grid}, minmax(0, 1fr));column-gap:28px"` : '';
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses"${gridStyle}>${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} marks</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, card) : card) };
}
// A note for the book with a hidden model note (Check my note; docs/lessons.md, Note prompts). Notes go on their own
// slide after the slides they are about, so a model note never sits on a slide before its prediction, and the
// prediction slides keep their size.
const NOTES = [];
function noteBox(q, model) {
  NOTES.push({ q, model });
  return `<details class="lesson-note"><summary><span class="lesson-note-q">Note in your notes: ${q}</span>` +
    `<span class="lesson-note-reveal">Check my note</span></summary><div class="lesson-note-a"><p><strong>A model note:</strong> ${model}</p></div></details>`;
}
function noteSlide(id, label, notes) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the notepad button at the top) and write each note in your own words. Then press <strong>Check my note</strong> and compare. Fix your note if it misses an idea.') +
    notes.map(([q, m]) => noteBox(q, m)).join('') };
}
function mcStep(id, label, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? lead : '') + (extra ? columns(extra, `<div id="${cid}"></div>`) : `<div id="${cid}"></div>`), items };
}
function written(id, label, lead, items) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + `<p class="lesson-lead">${lead}</p><div id="${cid}"></div>`, items };
}
function embed(id, label, appId, lead, embedQuery) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` }, embedQuery ? { embedQuery } : {});
}
const steps = [];
const OWN_DO = 'Type your answer in your own words, then press <strong>Check my answer</strong> to have it marked, and <strong>Submit answer</strong> to see the model answer. Fix your answer, then copy your best version into your notes.';
const WRITE_DO = 'Type your answer, then press <strong>Submit answer</strong> (or <strong>Check my answer</strong> to have it marked). Done when you have marked it against the model answer.';

// ---------------------------------------------------------------- Do Now 1: 0478/12 November 2024 Q6
// Mark scheme: Control unit // CU; Memory address register // MAR; Current instruction register // CIR (one mark each).
const CU = '^\\s*(the\\s+)?(control\\s*unit|cu)\\s*(\\(\\s*cu\\s*\\))?\\s*\\.?\\s*$';
const MAR = '^\\s*(the\\s+)?(memory\\s*address\\s*register|mar)\\s*(\\(\\s*mar\\s*\\))?\\s*\\.?\\s*$';
const CIR = '^\\s*(the\\s+)?(current\\s*instruction\\s*register|instruction\\s*register|cir|ir)\\s*(\\(\\s*c?ir\\s*\\))?\\s*\\.?\\s*$';
const WT_DN1 = { title: 'Walk me through it: name the part from its job', steps: [
  { text: '<strong>A similar question.</strong> "........ holds the address of the next instruction." Name the part.', visual: note('read the job, find the clue words') },
  { text: 'Find the clue words. Here they are ' + kw('address') + ' and ' + kw('next') + '.', visual: line('holds the ' + kw('address') + ' of the ' + kw('next') + ' instruction') },
  { text: 'Which part holds the address of the <b>next</b> instruction? The program counter (PC).', visual: line('address + next = program counter (PC)') },
  { text: '<strong>Another.</strong> "........ holds the data that has just come from memory." The clue words are ' + kw('data') + ' and ' + kw('from memory') + '.', visual: line('data from memory = memory data register (MDR)') },
  { text: 'Now do the same for each row: find the clue words (signals, address, decoded), then name the part. Its full name or its letters both earn the mark.', visual: note('clue words, then the part') },
] };
steps.push(checkStep('do-now', 'Do Now: Name the Part (1 of 2)',
  'Recap of the last lesson. ' + cite('0478/12, November 2024, Question 6') + ' The table contains descriptions of components in a CPU. Give the missing component names. <strong>What to do:</strong> type a name in each box, then press Check answers.', [
    { label: '(a) ........ sends signals to manage the flow of data through the CPU.', answer: CU, feedback: 'Which part is in charge and sends signals?' },
    { label: '(b) ........ stores the address of the data that is about to be fetched from random access memory (RAM) into the CPU.', answer: MAR, feedback: 'It holds an address. Which register holds the address memory is about to read?' },
    { label: '(c) ........ stores an instruction when it is being decoded.', answer: CIR, feedback: 'Which register holds the instruction being worked on now?' },
  ]));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/11 November 2022 Q2(c)
// Mark scheme: any two from: to temporarily store data; it stores the result of interim calculations. One from:
// arithmetic logic unit / ALU.
// A similar question: the purpose of the program counter (0478/12 March 2021 Q8(b)(i): holds the address ... of the
// next instruction). It teaches how to split a purpose into separate mark points, never the accumulator's points.
const WT_DN2 = { title: 'Walk me through it: describe a register\'s purpose', steps: [
  { text: '<strong>A similar question.</strong> "Describe the purpose of the program counter (PC)." It is worth 2 marks.', visual: note('2 marks: give 2 separate points') },
  { text: 'Point 1: what does it <b>hold</b>? The PC holds an ' + kw('address') + '.', visual: line('the PC holds an ' + kw('address')) },
  { text: 'Point 2: <b>which</b> address? The address of the ' + kw('next instruction') + '.', visual: line('... of the ' + kw('next instruction')) },
  { text: 'Check: two separate points, one mark each. "It holds things" alone would earn nothing: say exactly what.', visual: line('holds an address + of the next instruction = 2 marks') },
  { text: 'Now the accumulator question (3 marks). 1 mark: name the part of the CPU it is built into. 2 marks: two separate points about its purpose, each one exact.', visual: note('1 part name + 2 exact points') },
] };
steps.push(written('do-now-2', 'Do Now: The Accumulator (2 of 2)',
  'Recap of the last lesson. ' + cite('0478/11, November 2022, Question 2(c)') + ' ' + WRITE_DO, [
    { id: 'acc', prompt: 'Identify the component within the CPU that the accumulator is built into and describe the purpose of the accumulator.', marks: 3,
      scheme: ['Arithmetic logic unit (ALU)', 'To temporarily store data', 'It stores the result of interim calculations'],
      guidance: 'One mark for the component: the arithmetic logic unit (ALU). Then any two from the purpose points, one mark each: it stores data temporarily; it stores the result of interim calculations. "It stores data" with no "temporarily" earns no mark for point 2.',
      modelAnswer: 'The ALU. It temporarily stores data. It stores the results of interim calculations.' },
  ]));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-' + PREV,
  '<strong>Extension:</strong> finished the Do Now? Try these questions from the last lesson. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Go to the next slide when you are ready.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Buses and Data Movement',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">Buses and Data Movement</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> how values and messages travel between the CPU and memory, and <strong>why</strong>.', 'Three <strong>buses</strong>: what each one carries, and which way it goes.',
      '<strong>How this lesson works:</strong> on each slide, read the question, <strong>predict</strong> by picking an answer, then read why. Then go to the next slide.']) });

// ---------------------------------------------------------------- concept slides: predict, then the reason
const MEM = [[5, 31], [6, 12], [7, 25], [8, 17]];
steps.push(mcStep('concept-buses', 'Why the CPU Needs Buses',
  todo('read the two lines, look at the picture, then pick your prediction. The reason appears under it.') +
  facts(['The CPU and memory are separate parts. They are joined by wires.', 'A <strong>bus</strong> is a set of wires that carries signals between parts, such as the CPU and memory.']), [
    { prompt: 'Predict: the CPU wants the number stored at address 6. What must the CPU send to memory?', options: ['Where the number is, and a message: read it', 'Nothing: memory knows what the CPU needs', 'The number 12'], correct: 0,
      explain: 'Memory only does what it is told. The CPU sends where (the address 6) and what to do (read). Then memory sends back what it holds there (12). Three different things travel, so there are three buses: the address bus, the data bus and the control bus.' },
  ], busPic({}, MEM, 6, 'The three buses join the CPU and memory.')));
steps.push(noteSlide('note-buses', 'Your Note: Why Three Buses', [['in your own words, explain WHY the CPU needs three buses, not one.', 'The CPU sends where (an address) and what to do (a signal), and the value travels too (data). These are three different things, so there are three buses.']]));

steps.push(mcStep('concept-address', 'Which Way Does the Address Bus Go?',
  todo('read the line, look at the picture, then pick your prediction. The reason appears under it.') +
  facts(['The <strong>address bus</strong> carries an <strong>address</strong>: the place in memory to read or write.', 'The CPU wants the value at address 6, so 6 goes on the address bus.']), [
    { prompt: 'Predict: memory never chooses which address the CPU uses. Which way does the address bus need to go?', options: ['Out of the CPU to memory only', 'Into the CPU from memory only', 'Both ways'], correct: 0,
      explain: 'Out of the CPU only. The CPU chooses the address and sends it to memory. Memory never needs to send an address back, so the address bus goes one way.' },
  ], busPic({ addr: { v: '6', dir: 'out' } }, MEM, 6, 'The CPU sends the address 6.')));

steps.push(written('explain-address', 'Explain It: The Address Bus', OWN_DO, [
    { id: 'address-why', prompt: 'In your own words: which way does the address bus carry an address, and WHY?', marks: 2,
      scheme: ['Out of the CPU to memory only (one way)', 'Because the CPU chooses the address // memory never needs to send an address back'],
      guidance: 'One mark for the direction: out of the CPU to memory, or one way from the CPU. One mark for the reason: the CPU chooses or sends the address, or memory never sends an address back. "It goes one way" with no reason earns the first mark only.',
      modelAnswer: 'Out of the CPU only. The CPU chooses the address, so memory never sends one back.' },
  ]));

steps.push(mcStep('concept-data', 'Which Way Does the Data Bus Go?',
  todo('compare the two pictures, then pick your prediction. The reason appears under it.') +
  facts(['The <strong>data bus</strong> carries <strong>data and instructions</strong>: the value itself.']), [
    { prompt: 'Predict: in the read, 12 travels on the data bus. In the write, 42 travels on the data bus. Which way must the data bus go?', options: ['Into the CPU only', 'Out of the CPU only', 'Both ways'], correct: 2,
      explain: 'Both ways. In the read, 12 comes into the CPU from memory. In the write, 42 goes out of the CPU to memory. One bus does both jobs, so it must go both ways.' },
  ], '<div style="display:grid;gap:8px">' + busPic({ addr: { v: '6', dir: 'out' }, data: { v: '12', dir: '' } }, [], null, '<b>Read:</b> the CPU wants the value at address 6. It holds 12.') +
    busPic({ addr: { v: '8', dir: 'out' }, data: { v: '42', dir: '' } }, [], null, '<b>Write:</b> the CPU stores 42 at address 8.') + '</div>'));

steps.push(mcStep('concept-control', 'Why the Control Bus Is Needed',
  todo('read the lines, then pick a prediction for each question. The reason appears under each one.'), [
    { prompt: 'Predict: the CPU sends address 6 to memory. How does memory know whether to send its value back or to store a new value?', options: ['A read or a write signal tells it', 'It looks at how big the number is', 'It always sends its value back'], correct: 0,
      explain: 'The address only says where. The CU also sends a read or a write signal on the control bus, so memory knows what to do.' },
    { prompt: 'Predict: a key is pressed. The keyboard sends a signal to the CU. Which way does this signal go?', options: ['Into the CPU', 'Out of the CPU', 'It cannot be sent'], correct: 0,
      explain: 'Into the CPU. The CU sends signals out (read, write), and devices send signals in. So the control bus carries signals both ways.' },
  ], facts(['The <strong>control bus</strong> carries <strong>control signals</strong>.', 'The control unit (CU) sends signals such as <strong>read</strong> and <strong>write</strong>.', 'Devices send signals too. The keyboard tells the CU: a key has been pressed.']) +
    busPic({ addr: { v: '6', dir: 'out' }, ctrl: { v: '?', dir: '' } }, [], null, 'Address 6 is on its way. What else must memory be told?')));

steps.push(mcStep('predict-bus', 'Check: Which Bus?',
  todo('pick the bus for each question. Ask: is it a place, a value, or a command? Done when both are answered.'), [
    { prompt: 'The CPU wants the value stored at address 9. Memory holds 25 there. Which bus carries the 9?', options: ['Address bus', 'Data bus', 'Control bus'], correct: 0,
      explain: '9 is the place in memory, so it is an address. Addresses go on the address bus.' },
    { prompt: 'The CPU wants memory to store a value. Which bus carries the write signal?', options: ['Data bus', 'Address bus', 'Control bus'], correct: 2,
      explain: 'Write is a command from the CU. Commands and signals go on the control bus.' },
  ]));
steps.push(noteSlide('note-data-control', 'Your Notes: Data, Control and Which Bus', [['in your own words, explain WHY the data bus must go both ways. Use the word read and the word write.', 'In a read, the value comes into the CPU from memory. In a write, the value goes out of the CPU to memory. One bus does both, so it goes both ways.'], ['in your own words, explain WHY memory needs a read or a write signal as well as the address.', 'The address only says where. The signal says what to do: send the value back (read) or store a new value (write).'], ['explain WHY the 9 goes on the address bus, and not on the data bus.', '9 is a place in memory, so it is an address. The value stored there (25) is data, so it goes on the data bus.']]));

steps.push(embed('activity-1', 'Activity 1: Which Bus, Which Way?', 'cpu-lab',
  '<strong>What to do:</strong> pick the bus for every row (from level 2, also which way it goes), then press Check. One check per round, and a mistake means the round does not count. <strong>Done</strong> when you have cleared level 2 (two clean rounds in a row at each level). The help gets less as you go up.',
  'activity=buses&level=1&upto=2'));

// ---------------------------------------------------------------- compare: a read and a write
const cmpTable = (() => {
  const cell = 'padding:5px 10px;border-bottom:1px solid var(--line)';
  const head = ['', 'Read: the value at address 6 (it holds 12)', 'Write: store 42 at address 8'];
  const rows = [['Address bus', '6', '8'], ['Data bus', '12', '42'], ['Control bus', 'Read', 'Write']];
  return '<table style="border-collapse:collapse;width:100%;font-size:16px"><tr>' + head.map((h) => `<th style="${cell};text-align:left;font-size:14px;color:var(--muted)">${h}</th>`).join('') + '</tr>' +
    rows.map((r) => `<tr><td style="${cell};font-weight:700">${r[0]}</td><td style="${cell};${MONO}">${r[1]}</td><td style="${cell};${MONO}">${r[2]}</td></tr>`).join('') + '</table>';
})();
steps.push(mcStep('compare-read-write', 'Compare: A Read and a Write',
  todo('the table shows what each bus carries in a read and in a write. Picture which way each one travels, then pick your prediction.') + cmpTable, [
    { prompt: 'Predict: which bus changes direction between the read and the write?', options: ['Data bus', 'Address bus', 'Control bus'], correct: 0,
      explain: 'Only the data bus. In both jobs the address and the read or write signal go out of the CPU. The value comes in for a read (12) and goes out for a write (42).' },
  ]));

steps.push(mcStep('predict-way', 'Check: Which Way?',
  todo('pick the way for each question. Ask: where does it start, and where does it end up? Done when both are answered.'), [
    { prompt: 'The CPU stores 30 at address 7. Which way does 30 travel on the data bus?', options: ['Out of the CPU', 'Into the CPU', 'Both ways at once'], correct: 0,
      explain: '30 starts in the CPU and ends up in memory, so it goes out of the CPU.' },
    { prompt: 'The CPU wants the value at address 5. Which way does the address 5 travel?', options: ['Into the CPU', 'Out of the CPU', 'Both ways at once'], correct: 1,
      explain: 'The CPU chooses the address and sends it to memory. An address only ever goes out of the CPU.' },
  ]));

steps.push(written('explain-write', 'Explain It: A Write', OWN_DO, [
    { id: 'write-why', prompt: 'The CPU saves a number into memory. In your own words, explain which way the number travels on the data bus, and WHY.', marks: 2,
      scheme: ['Out of the CPU to memory', 'Because the number starts in the CPU and is being stored in memory'],
      guidance: 'One mark for the direction: out of the CPU to memory. One mark for the reason: the number starts in the CPU, or it is going to be stored in memory. A reason with the wrong direction earns no marks.',
      modelAnswer: 'Out of the CPU to memory, because the number starts in the CPU and is being stored in memory.' },
  ]));
steps.push(noteSlide('note-read-write', 'Your Notes: A Read and a Write', [['explain WHY a read signal goes on the control bus, and not on the data bus.', 'A read signal is a command from the CU, not a value. Commands go on the control bus.'], ['explain WHY only the data bus changes direction between a read and a write.', 'The address and the read or write signal always start in the CPU. The value starts in memory for a read, and in the CPU for a write.']]));

steps.push(embed('activity-2', 'Activity 2: Trace a Read and a Write', 'cpu-lab',
  '<strong>What to do:</strong> for each bus, pick what it carries and which way it goes, for a read and a write. One check per round, and a mistake means the round does not count. <strong>Done</strong> when you have cleared level 4, where there is no help.',
  'activity=buses&level=3&upto=4'));

steps.push(embed('activity-3', 'Activity 3: The Bus Game', 'cpu-lab-3d',
  '<strong>What to do:</strong> walk round the lab with W A S D. Hold <strong>Space</strong> to pick up a cube, carry it onto its bus and let go. The pad near the CPU sends it <strong>into the CPU</strong>; the pad near memory sends it <strong>out of the CPU</strong>. A mistake means that round does not count. <strong>Done</strong> when the four activities in the game are complete; Trace on Your Own is the extension.',
  'lesson=3.1.3'));

// ---------------------------------------------------------------- exam questions
const ADDR_BUS = '^\\s*(the\\s+)?address\\s*bus\\s*\\.?\\s*$';
const DATA_BUS = '^\\s*(the\\s+)?data\\s*bus\\s*\\.?\\s*$';
// One mark per bus named (the mark scheme gives one mark for each). Each pattern needs its own word and at most three
// words from the list, so typing every word earns nothing.
const LIST = 'fetch|address|register|execute|data|decode|calculation|central|value|binary|control';
const busWord = (w) => `^(?=.*\\b${w}\\b)(?!(?:.*?\\b(${LIST})\\b){4})[a-z0-9\\s,;.()&/]+$`;
steps.push(checkStep('exam-1', 'Exam Questions: Name the Bus',
  cite('0478/13 November 2021 Q5; 0478/12 November 2024 Q6; adapted from 0478/11 November 2024 Q5(d)') + ' <strong>What to do:</strong> type each answer, then press Check answers.', [
    { label: '(a) Give the component name: "........ This carries addresses around the CPU."', answer: ADDR_BUS, feedback: 'It carries addresses. Name the bus.' },
    { label: '(b) Give the component name: "........ transmits data between the RAM and the CPU."', answer: DATA_BUS, feedback: 'It carries data. Name the bus.' },
    { label: '(c) Buses are used in the CPU to transmit data. Type the three words from this list that name buses: fetch, address, register, execute, data, decode, calculation, central, value, binary, control.',
      answers: ['address', 'data', 'control'].map((w) => ({ answer: busWord(w), feedback: 'Type three words from the list, each the name of a bus, such as: word, word, word.' })) },
  ]));

steps.push(written('exam-2', 'Exam Question: Two Other Buses',
  cite('0478/11, November 2022, Question 2(a)') + ' Phil has a computer that is designed using the Von Neumann model. ' + WRITE_DO, [
    { id: 'two-buses', prompt: 'One type of component within the CPU is an address bus. Identify two other types of bus and state what each is responsible for transmitting in the CPU.', marks: 4,
      scheme: ['Data bus', '... responsible for transmitting data or instructions', 'Control bus', '... responsible for transmitting control signals'],
      guidance: 'One mark for each correct bus (max 2) and one mark for the matching description of what it transmits. A description earns its mark only next to the matching bus. The address bus is in the question, so it earns no mark.',
      modelAnswer: 'Data bus: transmits data and instructions. Control bus: transmits control signals.' },
  ]));

steps.push(written('exam-3', 'Exam Question: The Control Bus',
  cite('0478/12, March 2021, Question 8(b)(ii)') + ' ' + WRITE_DO, [
    { id: 'control-role', prompt: 'Describe the role of the control bus.', marks: 2,
      scheme: ['It carries or transfers control signals (or commands)', '... from the CPU or CU to components, or from devices to the CPU or CU', 'To synchronise the cycle the CPU carries out'],
      guidance: 'Any two, one mark each. Point 2 follows point 1. "It controls the computer" earns no mark.',
      modelAnswer: 'It carries control signals from the CU to other components.' },
  ]));

steps.push(written('exam-3b', 'Exam Question: One Bus and Its Purpose',
  cite('0478/13, June 2023, Question 2(c)(ii)') + ' The fetch-decode-execute cycle is the next lesson. For now, name a bus and explain what it carries. ' + WRITE_DO, [
    { id: 'one-bus', prompt: 'The CPU contains registers and buses. Identify one bus that can be found in the CPU and explain its purpose in the fetch-decode-execute cycle.', marks: 3,
      scheme: ['Names a bus: address bus, data bus or control bus', 'It transmits or carries addresses (address bus), data (data bus) or control signals (control bus)', '... between components in the CPU (for the control bus: from the control unit to other components)'],
      guidance: 'One mark for the correct name of a bus. Two marks for the matching description: what it carries (point 2) and where (point 3). The description must match the bus named.',
      modelAnswer: 'Address bus. It carries addresses between components in the CPU.' },
  ]));

steps.push(mcStep('exam-4', 'Exam Questions: Which Part Uses the Bus?',
  '<p class="lesson-lead">' + cite('0478/13 June 2021 Q10(a) and 0478/11 November 2021 Q6(a), one row of each table') + ' <strong>What to do:</strong> pick the component each statement applies to.</p>', [
    { prompt: 'Uses the data bus to send data into or out of the CPU.', options: ['Random access memory (RAM)', 'Arithmetic logic unit (ALU)', 'Control unit (CU)'], correct: 0,
      explain: 'RAM is outside the CPU. It sends data into the CPU, and receives data out of it, on the data bus.' },
    { prompt: 'It uses the address bus to send an address to another component.', options: ['Memory data register (MDR)', 'Program counter (PC)', 'Memory address register (MAR)'], correct: 2,
      explain: 'The MAR holds the address memory is about to read or write, and sends it out on the address bus.' },
  ]));

// ---------------------------------------------------------------- notes check
steps.push({ id: 'notes-check', label: 'Notes Check: Your WHY Notes',
  content: '<h2 class="lesson-h2">Notes Check: Your WHY Notes</h2>' + todo('open your notes (the notepad button at the top). You should have each note below, in your own words. Missing one? Go back to the slide named, write it, and press Check my note. Then go to the next slide.') +
    facts(['<strong>WHY there are three buses, not one.</strong> Slide: Your Note: Why Three Buses.', '<strong>Which way the address bus goes, and WHY.</strong> Slide: Explain It: The Address Bus.',
      '<strong>WHY the data bus goes both ways</strong>, using read and write. <strong>WHY memory needs a read or a write signal.</strong> <strong>WHY an address is not data.</strong> Slide: Your Notes: Data, Control and Which Bus.',
      '<strong>Which way the data bus goes in a write, and WHY.</strong> Slide: Explain It: A Write.',
      '<strong>WHY a read signal goes on the control bus. WHY only the data bus changes direction.</strong> Slide: Your Notes: A Read and a Write.']) });

// ---------------------------------------------------------------- plenary (the drill is built separately)
steps.push(embed('plenary', 'Plenary: Buses Drill', 'drill-' + ID,
  '<strong>What to do:</strong> answer every card. Pick the answer that earns the mark, then type it. Got one wrong? Go back to the slide it names, add it to your notes, then carry on. Your progress is saved.'));

// ---------------------------------------------------------------- the practice paper (shell EXAM_PAPERS y10-3-1-l3-paper)
steps.push({ id: 'exam-paper', label: 'Practice Paper: Buses', type: 'app-link', appId: 'exampaper', appQuery: 'paper=y10-3-1-l3-paper', buttonId: `${P}-open-paper`,
  content: '<h2 class="lesson-h2">Practice Paper: Buses</h2>' + todo('Open the practice paper. Answer every question, then press Submit paper. You get all your marks at once. You can take it again to improve.') +
    `<p><button type="button" class="donow-btn" id="${P}-open-paper">Open the practice paper</button></p>` });

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now', 0, ['CU', 'control unit', 'The Control Unit', 'control unit (CU)'], ['ALU', 'control', 'MAR']);
ok('do-now', 1, ['MAR', 'memory address register', 'Memory Address Register (MAR)'], ['MDR', 'PC', 'address']);
ok('do-now', 2, ['CIR', 'current instruction register', 'IR'], ['PC', 'MDR', 'register']);
ok('exam-1', 0, ['address bus', 'Address Bus', 'the address bus.'], ['address', 'data bus', 'MAR']);
ok('exam-1', 1, ['data bus', 'Data bus'], ['data', 'address bus', 'MDR']);
const BUS3 = (s) => [2, 3, 4].filter((i) => T('exam-1', i, s)).length;
[['address, data, control', 3], ['control data address', 3], ['Data, Address and Control', 3], ['address/data/control', 3], ['address, data, control.', 3], ['1. address 2. data 3. control', 3], ['address bus, data bus, control bus', 3],
 ['address, data', 2], ['address, data, fetch', 2], ['address data value', 2], ['fetch, decode, execute', 0], ['address, data, control, register', 0], ['address data control value binary', 0], ['data', 1]]
  .forEach(([a, n]) => assert(BUS3(a) === n, `exam-1 (c) "${a}" gives ${BUS3(a)}, not ${n}`));
NOTES.forEach((n) => assert(n.q && n.model, 'note shape'));
// Walkthroughs never hold their slide's answers.
WT_DN1.steps.forEach((s) => assert(!/control unit|\bCU\b|memory address register|\bMAR\b|current instruction|\bCIR\b/i.test(s.text + s.visual), 'WT_DN1 gives an answer: ' + s.text));
WT_DN2.steps.forEach((s) => assert(!/arithmetic|\bALU\b|interim|result|temporar|calculat|\bdata\b/i.test(s.text + s.visual), 'WT_DN2 gives an answer: ' + s.text));
// What a student sees: no dashes; no term before the slide that teaches it; nothing from the cycle lesson.
const seen = (s) => JSON.stringify(Object.assign({}, s, { walkthrough: s.walkthrough, items: (s.items || []).map((it) => Object.assign({}, it, { scheme: undefined, guidance: undefined })) }));
const all = JSON.stringify(steps);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/unidirectional|bidirectional|\bFDE\b|mario|\bdecimal\b|\bcache\b|\bcores?\b|clock speed|interrupt/i.test(steps.map(seen).join('')), 'term outside this lesson');
const firstTaught = { 'address bus': 'concept-buses', 'data bus': 'concept-buses', 'control bus': 'concept-buses', bus: 'concept-buses' };
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  steps.slice(0, idx).filter((s) => s.id !== 'title').forEach((s) => assert(!new RegExp('\\b' + term + '(es)?\\b', 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
// Each concept slide names its own bus's direction only after the student has predicted it.
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => s.items.forEach((it) => {
  assert(it.correct >= 0 && it.correct < it.options.length && it.explain, s.id + ' item shape');
  assert(!it.prompt.toLowerCase().includes(it.options[it.correct].toLowerCase()), s.id + ': prompt holds its answer: ' + it.prompt);
}));

const lesson = { id: ID, label: '3.1.3: Buses and Data Movement', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y10-3-1-l2 in the 3.1 unit
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const years = data.years || data;
    const y10 = years.find((y) => y.id === 'year10');
    assert(y10, 'year10 in lessons.json');
    const unit = y10.units.find((u) => (u.lessons || []).includes(PREV));
    assert(unit, 'unit holding ' + PREV);
    unit.lessons.splice(unit.lessons.indexOf(PREV) + 1, 0, ID);
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
