// Builds LessonData/y10-3-1-l1.json: Year 10, 3.1.1: CPU and Microprocessors (syllabus 0478 3.1: the role of the
// CPU, processing instructions and data that are input so the result can be output; what a microprocessor is; the
// stored program idea, instructions and data in the same memory, run one after another). The first lesson of Topic 3.
//   node tools/build_y10_3_1_l1.mjs
// It writes the plenary drill y10-3-1-l1 and registers a "3.1 Computer Architecture" unit after 2.R in lessons.json.
// The Do Now Extension reuses y10-2-r2-ext (10 cards across Topic 2, the topic before).
// Activities: CPU Lab (pages repo CpuLab/, registry id cpu-lab): activity=ipo and activity=run.
// CPU components (ALU, CU, registers), buses and the fetch-decode-execute cycle are 3.1.2 to 3.1.4, so not named here.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:  0478/13 November 2025 Q3(a) and Q3(b)(i)
//   Exam:    0478/13 June 2022 Q5(a) (the purpose part only, adapted to 2 marks); 0478/12 March 2026 Q3(b)(ii) (no
//            published mark scheme in the folder: marked from the syllabus definition); 0478/11 November 2021 Q9(b);
//            0478/12 March 2021 Q8(a); 0478/12 November 2022 Q1(d)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l1';
const P = 'y10-311';
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
const MONO = 'font-family:var(--font-mono, monospace)';
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const box = (t) => `<div style="display:grid;gap:6px;padding:10px 12px;border-radius:10px;background:var(--surface-2)">${t}</div>`;
const boxTitle = (t) => `<div style="font-weight:700;font-size:17px">${t}</div>`;
const boxLine = (t) => `<div style="font-size:16px">${t}</div>`;
// Input -> CPU -> Output as three boxes.
function ipo(a, b, c) {
  const cell = (t, s, hl) => `<div style="flex:1 1 140px;padding:10px;border-radius:10px;text-align:center;border:2px solid ${hl ? 'var(--brand)' : 'var(--line-strong)'};background:var(--surface-2)">` +
    `<div style="font-weight:700;font-size:17px">${t}</div><div style="font-size:15px;margin-top:4px">${s}</div></div>`;
  const arrow = '<div style="align-self:center;font-size:24px;color:var(--muted)">&rarr;</div>';
  return `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:stretch">${cell('Input', a)}${arrow}${cell('Process (CPU)', b, true)}${arrow}${cell('Output', c)}</div>`;
}
function memTable(rows, now) {
  const tr = rows.map((r, i) => `<tr${i === now ? ' style="background:var(--brand-soft)"' : ''}><td style="padding:3px 10px;color:var(--muted)">${i}</td>` +
    `<td style="padding:3px 10px;${MONO};font-weight:700;color:${/^[A-Z]/.test(r) ? 'var(--syn-keyword, #c58af9)' : 'var(--syn-number, #fdd663)'}">${r}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;margin:0 auto;font-size:17px"><tr><th style="padding:3px 10px;font-size:13px;color:var(--muted)">Address</th><th style="padding:3px 10px;font-size:13px;color:var(--muted)">Stored in memory</th></tr>${tr}</table>`;
}

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, lead, parts, whyQ, extra = '', grid = 0) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
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
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`, items };
}
function written(id, label, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${cid}"></div>`, items };
}
function embed(id, label, appId, lead, whyQ, embedQuery) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` }, embedQuery ? { embedQuery } : {});
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
const steps = [];

// ---------------------------------------------------------------- Do Now 1: 0478/13 November 2025 Q3(a)
// Mark scheme: header (originator's/sender's (IP) address, destination/receiver's (IP) address, packet number);
// payload (the data itself); trailer (end of packet notification, error checking data).
const ADDR = '((originator|sender|source|destination|receiver|recipient)(\'?s)?\\s*(ip\\s*)?address|ip\\s*address(es)?|packet\\s*(number|no\\.?|order))';
const WT_DN1 = { title: 'Walk me through it: the parts of a packet', steps: [
  { text: '<strong>A similar question.</strong> A packet is being sent from a laptop to a printer. Name the part of the packet that holds the page to print, and give one thing at the very end of the packet.', visual: note('header &middot; payload &middot; trailer') },
  { text: 'A packet has three parts, in this order: the <b>header</b>, then the <b>payload</b>, then the <b>trailer</b>.', visual: line(kw('header') + ' &rarr; payload &rarr; trailer') },
  { text: 'The header goes first because routers read it to send the packet the right way. So it holds addresses and the packet number.', visual: line('header: where from, where to, which packet') },
  { text: 'The middle part carries what is actually being sent. Here, part of the page to print: that is the ' + kw('payload') + '.', visual: line('payload: the data itself') },
  { text: 'The last part tells the receiver the packet has ended and holds data to check for errors: the ' + kw('trailer') + '.', visual: line('trailer: end of packet, error checking data') },
  { text: 'Now do the same for the question: name each section in order, and give one thing each section stores.', visual: note('name it, then say what it holds') },
] };
steps.push(checkStep('do-now', 'Do Now: Parts of a Packet (1 of 2)',
  'Recap of 2.1 Data Transmission. ' + cite('0478/13, November 2025, Question 3(a)') + ' Data is split into packets before it is transmitted across a network. A packet has three sections. Give the name of each section, and an example of what is stored in that section.', [
    { label: 'First section: name', answer: '^\\s*(the\\s+)?(packet\\s+)?header\\s*\\.?\\s*$', feedback: 'The first section is read first by each router.' },
    { label: 'First section: example', answer: '^.*\\b' + ADDR + '.*$', feedback: 'What does a router need to know to send the packet on?' },
    { label: 'Second section: name', answer: '^\\s*(the\\s+)?payload\\s*\\.?\\s*$', feedback: 'The section that carries what is being sent.' },
    { label: 'Second section: example', answer: '^.*\\b(data|message|part\\s+of\\s+(the\\s+)?(file|message|data)|content)s?\\b.*$', feedback: 'What is actually being sent?' },
    { label: 'Third section: name', answer: '^\\s*(the\\s+)?trailer\\s*\\.?\\s*$', feedback: 'The section at the very end of the packet.' },
    { label: 'Third section: example', answer: '^.*\\b(end\\s+of\\s+(the\\s+)?packet|error\\s*(check(ing)?|detect(ion)?)|check\\s*sum|checksum|parity|crc)\\b.*$', feedback: 'It marks the end, or helps the receiver find errors.' },
  ], ['Why is a large file split into many small packets, and not sent as one piece?', 'If one small packet is lost or damaged, only that packet has to be sent again, and packets can share the network with other traffic.'], '', 2));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/13 November 2025 Q3(b)(i)
// Mark scheme: data is sent one bit at a time; down a single wire; data can be sent in both directions; at the same
// time.
const WT_DN2 = { title: 'Walk me through it: explaining a transmission method', steps: [
  { text: '<strong>A similar question.</strong> Explain how data is transmitted using <b>parallel simplex</b>.', visual: note('two words: two halves of the answer') },
  { text: 'Split the name. The first word (serial or parallel) says how many bits go at once. The second (simplex, half-duplex, full-duplex) says which directions.', visual: line(kw('parallel') + ' + ' + kw('simplex')) },
  { text: 'Parallel: several bits are sent at the same time, down several wires.', visual: line('parallel: many bits at once, many wires') },
  { text: 'Simplex: data goes in one direction only.', visual: line('simplex: one direction only') },
  { text: 'Put the two halves together, one point per mark: several bits at the same time, down several wires, in one direction only.', visual: note('a point for each fact') },
  { text: 'Now do the same for serial full-duplex: say how many bits go at once and down how many wires, then which directions and when.', visual: note('first word, then second word') },
] };
steps.push(written('do-now-2', 'Do Now: Serial Full-Duplex (2 of 2)',
  'Recap of 2.1. ' + cite('0478/13, November 2025, Question 3(b)(i)') + ' Packets can be sent across a network using different methods of data transmission.', [
    { id: 'serial-fd', prompt: 'Explain how data is transmitted using serial full-duplex.', marks: 4,
      scheme: ['Data is sent one bit at a time', 'down a single wire', 'Data can be sent in both directions', 'at the same time'],
      guidance: 'One mark for each point. "Both directions" earns its mark only with "at the same time" as a separate mark: both directions alone is 1 mark. "Down a single wire" needs the idea of one wire or channel.',
      modelAnswer: 'Data is sent one bit at a time down a single wire. Data can travel in both directions at the same time.' },
  ], ['Why can full-duplex send data both ways at the same time, when half-duplex cannot?', 'Full-duplex has a path for each direction, so the two directions never have to take turns.']));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-2-r2-ext',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from across Topic 2. Stuck? Switch on <strong>I need help</strong>.',
  ['Why practise the last topic when we start a new one?', 'The exam mixes every topic, so you need to remember the old ones too.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'CPU and Microprocessors',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">CPU and Microprocessors</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> what the <strong>CPU</strong> does, and why every computer needs one.', 'What a <strong>microprocessor</strong> is, and why devices use them.', 'Why a program and its data are stored in the <strong>same memory</strong>.']) +
    why('A phone, a washing machine and a games console are very different. What job might all three need done inside them?', 'They all take data in, work on it, and give a result out. Something inside each one has to do that work.') });

// ---------------------------------------------------------------- the CPU: input, process, output
steps.push(concept('concept-cpu', 'What Does the CPU Do?',
  'You type 12 + 30 into a calculator app and the screen shows 42. Predict: which part of the computer worked out 42, and why could it not do it before you typed?',
  '<p>The CPU (central processing unit) worked it out. It needs the data first: it can only process what has been input.</p>',
  columns(facts(['CPU stands for <strong>central processing unit</strong>.', 'The CPU <strong>processes instructions and data</strong> that are input.', 'It does this so that the <strong>result can be output</strong>.',
    'Processing means calculating, comparing and deciding.', 'Every program is a list of instructions the CPU carries out.']),
    '<div style="display:grid;gap:10px">' + ipo('You type 12 + 30', 'The CPU adds 12 and 30', 'The screen shows 42') + ipo('A barcode is scanned', 'The CPU looks up the price', 'The screen shows the total') + '</div>')));

steps.push(mcStep('predict-process', 'Predict: Which Step Is Processing?', '', [
  { prompt: 'A games console: you press jump, the console works out where the character lands, and the screen shows the jump. Which step is the CPU processing?', options: ['Pressing the jump button', 'Working out where the character lands', 'The screen showing the jump'], correct: 1,
    explain: 'Pressing jump is input and the screen is output. Working out where the character lands is the CPU processing the data.' },
  { prompt: 'Why can the CPU not show the result before the data is input?', options: ['The screen is switched off until then', 'It has no data to process yet', 'The CPU only works when it is cool'], correct: 1,
    explain: 'The CPU processes the data that is input. With no data, there is nothing to work on, so no result to output.' },
], ['Why do we call it the "central" processing unit?', 'All the processing in the computer goes through it: it sits in the middle, between the input and the output.']));

steps.push(embed('activity-1', 'Activity 1: Input, Process, Output', 'cpu-lab',
  'Label each step of a device. One check per device, and a mistake means it does not count. Then the sensor systems, then find the missing step.',
  ['Why can one device have two process steps in a row?', 'The CPU may need to do more than one piece of work, such as compare a reading and then decide, before it outputs anything.'], 'activity=ipo'));

// 0478/13 June 2022 Q5(a). Mark scheme, purpose part: any two from it processes data; it processes/executes
// instructions; it carries out calculations; it carries out logical operations.
steps.push(written('exam-1', 'Exam Question: The Purpose of the CPU',
  'Adapted from ' + cite('0478/13, June 2022, Question 5(a)') + ' Harriet has a computer. The computer has a central processing unit (CPU).', [
    { id: 'purpose', prompt: 'Explain the purpose of the CPU.', marks: 2, scheme: ['It processes data', 'It processes or executes instructions', 'It carries out calculations', 'It carries out logical operations'],
      guidance: 'Any two different points from the list, one mark each. "It is the brain of the computer" earns no mark. "Processes data and instructions" in one sentence can earn both marks.',
      modelAnswer: 'It processes data and executes instructions.' },
  ], ['Why is "the brain of the computer" not enough to earn a mark?', 'It does not say what the CPU does. The marks are for the job: processing data and carrying out instructions.']));

// ---------------------------------------------------------------- microprocessors
steps.push(concept('concept-micro', 'What Is a Microprocessor?',
  'A washing machine needs to check the water temperature and switch a heater on. Predict: why would its maker use one small chip, not a whole computer?',
  '<p>One chip is small, cheap and uses little power, and it can still do the processing the machine needs.</p>',
  columns(facts(['A <strong>microprocessor</strong> is an <strong>integrated circuit</strong> (one chip).', 'It can perform <strong>many of the functions of a CPU</strong>.', 'It is small, cheap and uses little power.',
    'Found in washing machines, drones, security lights and phones.', 'It still processes data input to it, so a result can be output.']),
    '<div style="display:grid;gap:10px">' + ipo('Temperature sensor sends a reading', 'Microprocessor compares it with 30', 'Signal to switch the heater on') +
    box(boxTitle('Sensor') + boxLine('An input device that measures something, such as temperature or distance, and sends the reading to the microprocessor.')) + '</div>')));

// 0478/12 March 2026 Q3(b)(ii). No mark scheme in the folder; marked from the syllabus definition.
steps.push(written('exam-2', 'Exam Question: A Drone',
  cite('0478/12, March 2026, Question 3(b)(ii)') + ' A drone is used to search for lost animals. The drone has a built-in system to stop it from crashing into objects, for example a tree. The system uses sensors and a microprocessor.', [
    { id: 'micro', prompt: 'State what is meant by a microprocessor.', marks: 1, scheme: ['An integrated circuit (chip) that can perform many of the functions of a CPU'],
      guidance: 'One mark for the idea of a single integrated circuit or chip that does the work of (many functions of) a CPU, or that processes data. "A small computer" alone earns no mark.',
      modelAnswer: 'An integrated circuit that can perform many of the functions of a CPU.' },
  ], ['Why is "a small computer" not a full answer?', 'It does not say what it is made of or what it does. The answer needs one chip that does the CPU\'s work.']));

// 0478/11 November 2021 Q9(b). Mark scheme, six from: sensor sends data to microprocessor; converted analogue to
// digital (ADC); compared to stored value (of 30); below 30, signal to heater to heat up / add hot water; above 30,
// signal to turn heater off / add cold water; actuator used; if 30 no action; continuous process.
steps.push(written('exam-3', 'Exam Question: A Washing Machine',
  cite('0478/11, November 2021, Question 9(b)') + ' A washing machine uses sensors and a microprocessor to control the washing cycle of clothes. Use input, process and output to plan your answer.', [
    { id: 'washing', prompt: 'Describe how the sensor and the microprocessor are used to make sure the water remains at 30 &deg;C.', marks: 6,
      scheme: ['The sensor sends data to the microprocessor', 'The data is converted from analogue to digital (using an ADC)', 'The data is compared to the stored value (of 30)', 'If the data is below 30 the microprocessor sends a signal to the heater to heat the water up (or add hot water)',
        'If the data is above 30 the microprocessor sends a signal to turn the heater off (or add cold water)', 'An actuator is used to turn the heater on or off (or to add water)', 'If the data is 30 no action is taken', 'It is a continuous process'],
      guidance: 'Six from the list, one mark each. The sensor must send data to the microprocessor: a sensor that "controls" or "decides" earns no mark, as the microprocessor does the comparing. "Turns the heater on" needs the condition (below 30) for its mark.',
      modelAnswer: 'The temperature sensor sends data to the microprocessor. The microprocessor compares the data to the stored value of 30. If it is below 30, it sends a signal to turn the heater on. If it is above 30, it sends a signal to turn the heater off. If it is 30, no action is taken. This repeats continuously.' },
  ], ['Why must the system keep checking, and not check once?', 'The water keeps cooling or heating, so a reading from a minute ago may already be wrong.']));

// ---------------------------------------------------------------- the stored program idea
const MEM = ['INPUT', 'ADD 5', 'OUTPUT', 'STOP', '40', '7'];
steps.push(concept('concept-stored', 'Why Store the Program in Memory?',
  'The memory below holds a program and some numbers. The input is 10. Predict: what will the program output, and why is address 4 never used?',
  '<p>17. The CPU runs addresses 0, 1, 2 and 3 in turn: 10, then 10 + 7 = 17, then outputs 17, then stops. Address 4 comes after STOP, so it is never reached.</p>',
  columns(facts(['<strong>Instructions and data are stored in the same memory.</strong>', 'The CPU runs the instructions <strong>one after another</strong>, in order.', 'Change the program or the data in memory and the computer does a new job, with no new hardware.',
    'This is the <strong>stored program</strong> idea. Every computer you use works this way.']),
    memTable(MEM) + '<p style="margin:8px 0 0;text-align:center;font-size:15px;color:var(--muted)">Purple: instructions. Yellow: data.</p>')));

steps.push(mcStep('predict-stored', 'Predict: Change the Memory', 'The same memory as before: INPUT, ADD 5, OUTPUT, STOP, then 40 and 7 in addresses 4 and 5.', [
  { prompt: 'Address 5 is changed from 7 to 20. The input is 10. What is output now?', options: ['17', '30', '50'], correct: 1,
    explain: 'ADD 5 adds whatever is stored in address 5. It now holds 20, so 10 + 20 = 30. The program did not change, only the data.' },
  { prompt: 'Address 1 is changed from ADD 5 to ADD 4. The input is 10. What is output now?', options: ['50', '17', '40'], correct: 0,
    explain: 'ADD 4 adds what is stored in address 4, which is 40. 10 + 40 = 50. Changing one instruction in memory changed what the computer does.' },
], ['Why does storing the program in memory mean one computer can do many different jobs?', 'To change the job, you only change what is in memory. The hardware stays the same.']));

steps.push(embed('activity-2', 'Activity 2: Run the Program', 'cpu-lab',
  'Predict first, then run it one instruction at a time to see why. Four levels; a wrong prediction means the round does not count.',
  ['Why should you predict before you press Run?', 'Running it first shows the answer. Predicting first shows whether you can follow the program yourself.'], 'activity=run'));

// 0478/12 March 2021 Q8(a). Mark scheme: instructions and data stored in the same/main memory; instructions fetched
// and executed in order / one after another / in sequence.
steps.push(written('exam-4', 'Exam Question: The Stored Program Concept (1 of 2)',
  cite('0478/12, March 2021, Question 8(a)') + ' A computer system uses the stored program concept.', [
    { id: 'stored-1', prompt: 'Describe what is meant by the stored program concept.', marks: 2, scheme: ['Instructions and data are stored in the same (main) memory', 'Instructions are fetched and executed in order (one after another, in sequence)'],
      guidance: 'One mark for each point. "Run one after another" or "in order" earns the second mark. "Programs are stored on the computer" alone earns no mark: it must say instructions and data share the same memory.',
      modelAnswer: 'Instructions and data are stored in the same memory. The instructions are run one after another.' },
  ], ['Why must the instructions be run in order, one at a time?', 'Each instruction may use the result of the one before, so doing them out of order would give the wrong result.']));

// 0478/12 November 2022 Q1(d). Mark scheme: data and instructions are stored in the same memory; and can only be
// fetched one at a time.
steps.push(written('exam-5', 'Exam Question: The Stored Program Concept (2 of 2)',
  cite('0478/12, November 2022, Question 1(d)') + ' A train station has a ticket machine. The computer in the ticket machine uses the stored program concept.', [
    { id: 'stored-2', prompt: 'Describe the stored program concept.', marks: 2, scheme: ['Data and instructions are stored in the same memory', 'and can only be fetched (taken) one at a time'],
      guidance: 'One mark for each point. The second mark needs the idea that instructions are taken from memory one at a time, or run one after another.',
      modelAnswer: 'Data and instructions are stored in the same memory, and are taken from memory one at a time.' },
  ], ['Why can the same 2 marks appear in two different papers?', 'The stored program idea does not change, so the mark scheme points stay the same.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: CPU and Microprocessors Drill', 'drill-y10-3-1-l1',
  'The CPU, microprocessors and the stored program, with real exam wording. Pick the answer that earns the mark, then type it. Your progress is saved.',
  ['Why does a drill bring back a card you got wrong?', 'Getting it right again later shows you remember it, not that you guessed once.']));

// ---------------------------------------------------------------- plenary drill
const card = (id, cat, prompt, answers, distractors, noteText, working) => ({ id, category: cat, prompt, answers, distractors, note: noteText, working, pickThenType: true });
const NOT_CPU = ['It stores files when the computer is off', 'It shows the result on the screen', 'It is the brain of the computer', 'It connects the computer to the internet', 'It cools the computer down', 'It types the data in'];
const cards = [
  card('c-01', 'cpu', 'Explain the purpose of the CPU.\nGive one point that earns a mark.', ['It processes data', 'It executes instructions', 'It carries out calculations', 'It carries out logical operations'], NOT_CPU,
    'From Cambridge IGCSE 0478/13, June 2022, Question 5(a).', ['The CPU is the part that works on data: it does not store files or show results itself.', 'Think of what it does between input and output.']),
  card('c-02', 'cpu', 'What does CPU stand for?', ['Central processing unit'], ['Computer processing unit', 'Central program unit', 'Control processing unit'], 'CPU: central processing unit.', ['It processes. It sits in the middle of the computer.', 'Three words: where it is, what it does, and "unit".']),
  card('c-03', 'cpu', 'A self-checkout scans a barcode and shows the price.\nWhich step is the CPU processing?', ['Looking up the price of the item'], ['Scanning the barcode', 'Showing the price on the screen', 'Printing the receipt'], 'Scanning is input; showing and printing are output.', ['Input goes into the CPU, output comes out of it.', 'Processing is the work done in between.']),
  card('c-04', 'cpu', 'A greenhouse system: the temperature sensor sends a reading to the microprocessor.\nIs this step input, process or output?', ['Input'], ['Process', 'Output', 'Storage'], 'Data going into the microprocessor from a device is input.', ['Ask: is data going in, being worked on, or going out?', 'The sensor is the device sending the data.']),
  card('c-05', 'cpu', 'A greenhouse system: the microprocessor compares the reading with the stored value.\nIs this step input, process or output?', ['Process'], ['Input', 'Output', 'Storage'], 'Comparing is the microprocessor working on the data.', ['Nothing comes in or goes out in this step.', 'Comparing, calculating and deciding are all the same type of step.']),
  card('c-06', 'cpu', 'A greenhouse system: the microprocessor sends a signal to turn the heater on.\nIs this step input, process or output?', ['Output'], ['Input', 'Process', 'Storage'], 'A signal sent out to make something happen is output.', ['Is the result going out of the microprocessor?', 'The heater is what the signal makes happen.']),
  card('m-01', 'micro', 'State what is meant by a microprocessor.', ['An integrated circuit that can perform many of the functions of a CPU'], ['A small computer with a keyboard', 'A device that measures temperature', 'Memory that stores programs', 'A program that controls a device'],
    'From Cambridge IGCSE 0478/12, March 2026, Question 3(b)(ii).', ['It is a single chip.', 'It does much of the same work as a CPU.']),
  card('m-02', 'micro', 'Why would a washing machine use a microprocessor and not a full computer?\nGive one reason.', ['It is small', 'It is cheap', 'It uses little power'], ['It has a bigger screen', 'It stores more files', 'It needs a keyboard', 'It is faster than every computer'],
    'A microprocessor is one chip, so it is small, cheap and uses little power.', ['Think about the size of one chip.', 'The washing machine only needs a few jobs done.']),
  card('m-03', 'micro', 'A washing machine keeps the water at 30 degrees.\nWhat does the microprocessor do with the sensor data?', ['It compares the data to the stored value of 30'], ['It measures the temperature', 'It heats the water itself', 'It sends the data to the internet'],
    'From Cambridge IGCSE 0478/11, November 2021, Question 9(b).', ['The sensor measures; the microprocessor processes.', 'It needs a value to check the reading against.']),
  card('m-04', 'micro', 'The washing machine water is below 30 degrees.\nWhat does the microprocessor do?', ['It sends a signal to turn the heater on'], ['It sends a signal to turn the heater off', 'It takes no action', 'It stops the washing cycle'],
    'From Cambridge IGCSE 0478/11, November 2021, Question 9(b).', ['Below 30 means the water is too cold.', 'The output must make the water warmer.']),
  card('s-01', 'stored', 'Describe what is meant by the stored program concept.\nGive one point that earns a mark.', ['Instructions and data are stored in the same memory', 'Instructions are run one after another'], ['Programs are saved on a USB drive', 'Data is stored in the CPU only', 'Instructions are all run at the same time', 'Programs are stored on the internet'],
    'From Cambridge IGCSE 0478/12, March 2021, Question 8(a).', ['Where are the program and its data kept?', 'In what order does the CPU carry out the instructions?']),
  card('s-02', 'stored', 'Memory: 0 INPUT, 1 ADD 5, 2 OUTPUT, 3 STOP, 4 holds 40, 5 holds 7.\nThe input is 20. What is output?', ['27'], ['60', '20', '47'], 'ADD 5 adds the number stored in address 5 (7): 20 + 7 = 27.', ['ADD 5 means: add the number stored at address 5.', 'Address 4 comes after STOP, so it is never used.']),
  card('s-03', 'stored', 'Memory: 0 INPUT, 1 ADD 4, 2 OUTPUT, 3 STOP, 4 holds 15.\nThe input is 6. What is output?', ['21'], ['10', '6', '15'], 'ADD 4 adds the number stored in address 4 (15): 6 + 15 = 21.', ['Read the number stored at the address named.', 'Then add it to the input.']),
  card('s-04', 'stored', 'A program adds the number in address 6 to the input. Address 6 is changed from 3 to 9.\nWhat has changed?', ['The data in memory'], ['The CPU', 'The hardware', 'The instructions'], 'Only the data changed; the same program now gives a different result.', ['The instruction still says "add address 6".', 'What is stored in address 6 is data.']),
  card('s-05', 'stored', 'Why is a number stored after STOP never run as an instruction?', ['The program stops before it reaches that address'], ['Numbers cannot be stored in memory', 'The CPU deletes it', 'It is stored in a different memory'],
    'Instructions run one after another until STOP, so nothing after STOP is run.', ['Instructions run in order from address 0.', 'What does STOP do?']),
];
const drill = { title: 'Year 10, 3.1.1: CPU and Microprocessors', subtitle: 'Cambridge IGCSE Computer Science 0478', categories: [['cpu', 'The CPU'], ['micro', 'Microprocessors'], ['stored', 'The Stored Program']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 3 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
});
assert(10 + 7 === 27 - 10 && 20 + 7 === 27 && 6 + 15 === 21 && 10 + 20 === 30 && 10 + 40 === 50, 'memory sums');
const drillSrc = `// Year 10, 3.1.1: CPU and Microprocessors. Plenary: the CPU, microprocessors and the stored program.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y10_3_1_l1.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now', 0, ['header', 'Header', 'the header'], ['trailer', 'head', 'payload']);
ok('do-now', 1, ['destination address', "sender's IP address", 'packet number', 'the originator address', 'IP addresses'], ['data', 'header', 'address']);
ok('do-now', 2, ['payload', 'the payload'], ['header', 'pay']);
ok('do-now', 3, ['the data itself', 'the message', 'part of the file', 'data'], ['address', 'checksum']);
ok('do-now', 4, ['trailer', 'the trailer'], ['header', 'footer']);
ok('do-now', 5, ['end of packet', 'error checking data', 'a checksum', 'parity bit'], ['data', 'address']);
const all = JSON.stringify(steps) + JSON.stringify(drill);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
{ const bad = /mario|\bdecimal\b|\bALU\b|arithmetic logic|control unit|register|\bbus(es)?\b|accumulator|program counter|von neumann|decode|\bcache\b|\bcores?\b|clock speed/i.exec(all.split(ID).join(''));
  assert(!bad, 'term taught later: ' + (bad ? bad[0] + ' in ' + all.split(ID).join('').slice(bad.index - 60, bad.index + 30) : '')); }

const lesson = { id: ID, label: '3.1.1: CPU and Microprocessors', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: a "3.1" unit after "2.R"
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const y10 = data.years ? data.years.find((y) => y.id === 'year10') : null;
    const holder = y10 || (Array.isArray(data) ? data.find((y) => y.id === 'year10') : null);
    assert(holder, 'year10 in lessons.json');
    const at = holder.units.findIndex((u) => u.code === '2.R');
    assert(at >= 0, '2.R unit');
    const unit = Object.assign({}, holder.units[at], { code: '3.1', title: 'Computer Architecture', lessons: [ID] });
    holder.units.splice(at + 1, 0, unit);
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, drill ${cards.length} cards`);
