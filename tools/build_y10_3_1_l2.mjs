// Builds LessonData/y10-3-1-l2.json: Year 10, 3.1.2: CPU Components (syllabus 0478 3.1: the purpose of the ALU and
// the CU, and the roles of the registers PC, MAR, MDR, CIR and ACC, in a Von Neumann architecture).
//   node tools/build_y10_3_1_l2.mjs
// It writes the plenary drill y10-3-1-l2 and adds the lesson to the "3.1" unit after y10-3-1-l1.
// The Do Now Extension reuses y10-3-1-l1 (the plenary of the lesson before, 15 cards).
// Activities: CPU Lab activity=parts (Who Does This Job?, Activity 2 from the registers level), and a Canva poster
// uploaded on the slide (Activity 3, file-upload step).
// Buses and the full fetch-decode-execute cycle are 3.1.3 and 3.1.4: buses are not named in anything a student sees
// (only in the teacher-side mark schemes), and the cycle is shown here only as the registers' jobs.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:  0478/12 March 2025 Q3(b); 0478/13 June 2023 Q2(g)
//   Exam:    0478/11 November 2021 Q6(b); 0478/11 November 2023 Q1(c); 0478/11 June 2025 Q5(b); 0478/13 November 2025
//            Q2(b)(ii); 0478/13 June 2024 Q8(c); 0478/13 November 2025 Q2(b)(i); 0478/13 June 2021 Q10(a) (four of the
//            six rows: the rows on buses and on two components at once are left out); 0478/12 March 2021 Q8(b)(i);
//            0478/11 November 2023 Q1(e); 0478/11 June 2025 Q5(a) (the CIR and accumulator rows)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l2';
const PREV = 'y10-3-1-l1';
const P = 'y10-312';
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

// The CPU as boxes: the CU (with the CIR), the ALU (with the ACC), and the PC, MAR and MDR.
function cpuDiagram(vals = {}, hl = []) {
  const reg = (r, full) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:4px 8px;border-radius:8px;border:2px solid ${hl.includes(r) ? 'var(--warn)' : 'var(--line-strong)'};background:var(--surface)">` +
    `<span><b>${r}</b> <span style="font-size:13px;color:var(--muted)">${full}</span></span><b style="${MONO}">${vals[r] ?? ''}</b></div>`;
  const unit = (name, sub, inner) => `<div style="display:grid;gap:6px;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--surface-2)"><div style="font-weight:700">${name} <span style="font-size:13px;color:var(--muted);font-weight:400">${sub}</span></div>${inner}</div>`;
  return `<div style="display:grid;gap:8px;padding:10px;border-radius:12px;border:2px solid var(--brand)"><div style="font-weight:700;text-align:center">CPU</div>` +
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${unit('CU', 'control unit', reg('CIR', 'current instruction'))}${unit('ALU', 'arithmetic logic unit', reg('ACC', 'accumulator'))}</div>` +
    reg('PC', 'program counter') + reg('MAR', 'memory address register') + reg('MDR', 'memory data register') + '</div>';
}
function memTable(rows, now, hit) {
  const tr = rows.map((r, i) => `<tr${i === now ? ' style="background:var(--brand-soft)"' : ''}><td style="padding:2px 10px;color:var(--muted)">${i}</td>` +
    `<td style="padding:2px 10px;${MONO};font-weight:700;${i === hit ? 'outline:2px solid var(--warn);outline-offset:-2px;' : ''}color:${/^[A-Z]/.test(r) ? 'var(--syn-keyword, #c58af9)' : 'var(--syn-number, #fdd663)'}">${r}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;margin:0 auto;font-size:16px"><tr><th style="padding:2px 10px;font-size:13px;color:var(--muted)">Address</th><th style="padding:2px 10px;font-size:13px;color:var(--muted)">Memory</th></tr>${tr}</table>`;
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

// ---------------------------------------------------------------- Do Now 1: 0478/12 March 2025 Q3(b)
// Mark scheme, any one from: perform the FDE cycle; execute/process instructions.
const WT_DN1 = { title: 'Walk me through it: stating a purpose', steps: [
  { text: '<strong>A similar question.</strong> A greenhouse has a temperature sensor. State the purpose of the sensor.', visual: note('"purpose" means: what job does it do?') },
  { text: '"State the purpose" asks for the <b>job</b> it does, not what it looks like or where it is.', visual: line(kw('purpose') + ' = its job') },
  { text: 'A sensor\'s job: it measures something and sends the reading on. Here: it measures the temperature and sends it to the microprocessor.', visual: line('measures, then sends the reading') },
  { text: 'An answer such as "it is a small part of the greenhouse" earns nothing: it does not say what the sensor <b>does</b>.', visual: note('a description is not a job') },
  { text: 'Now do the same for the CPU: one short sentence that says the job it does with instructions.', visual: note('start with "It ..."') },
] };
steps.push(written('do-now', 'Do Now: The Purpose of the CPU (1 of 2)',
  'Recap of the last lesson. ' + cite('0478/12, March 2025, Question 3(b)') + ' A computer has a central processing unit (CPU), memory and secondary storage.', [
    { id: 'cpu-purpose', prompt: 'State the purpose of the CPU in the computer.', marks: 1, scheme: ['To execute or process instructions', 'To perform the fetch-decode-execute cycle'],
      guidance: 'One mark for either point. "It processes data and instructions" earns the mark. "It is the brain of the computer" earns no mark.',
      modelAnswer: 'It executes instructions.' },
  ], ['Why does the exam ask for the CPU\'s job, and not what it is called?', 'Knowing the name shows you remember it. Saying the job shows you understand what it does.']));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/13 June 2023 Q2(g)
// Mark scheme, any three from: receives data from the self-checkout system; compares the book data received to stored
// book data; ... that is a database of stock; if the book is found it decrements the book stock by 1; if the book is
// not found an error message is displayed.
const WT_DN2 = { title: 'Walk me through it: a microprocessor in a system', steps: [
  { text: '<strong>A similar question.</strong> A car park barrier has a microprocessor. A driver scans a ticket. Explain how the microprocessor decides if the barrier opens.', visual: note('input, process, output') },
  { text: 'Input: the microprocessor <b>receives</b> data. Here, the ticket number from the scanner.', visual: line(kw('receives') + ' the ticket number') },
  { text: 'Process: it <b>compares</b> the data with data it has stored. Here, the list of tickets that have been paid.', visual: line(kw('compares') + ' with the stored list') },
  { text: 'Output, part 1: <b>if</b> the ticket is found, it sends a signal to open the barrier.', visual: line('found: open the barrier') },
  { text: 'Output, part 2: <b>if not</b> found, it shows an error message. Each "if" is a separate mark.', visual: line('not found: error message') },
  { text: 'Now do the same for the library: what data does the microprocessor receive, what does it compare it with, and what happens if the book is found, or not found?', visual: note('receive, compare, if found, if not found') },
] };
steps.push(written('do-now-2', 'Do Now: A Library Microprocessor (2 of 2)',
  'Recap of the last lesson. ' + cite('0478/13, June 2023, Question 2(g)') + ' A library has a self-checkout system. It is linked to a stock control system that is updated every time a book is borrowed. A microprocessor is used in the stock control system to update the stock.', [
    { id: 'library', prompt: 'Explain the role of the microprocessor in this system and how it is used to update the stock when a book is borrowed.', marks: 3,
      scheme: ['It receives data from the self-checkout system', 'It compares the book data received to stored book data', '... that is a database of stock', 'If the book is found it decrements (takes 1 off) the book stock', 'If the book is not found an error message is displayed'],
      guidance: 'Any three, one mark each. The "database of stock" mark needs the compare point first. "Updates the stock" alone earns no mark: it must say the stock goes down by 1.',
      modelAnswer: 'It receives the book data from the self-checkout. It compares it with the stored book data. If the book is found, it takes 1 off the stock.' },
  ], ['Why does a library use a microprocessor for this job, and not a person with a notebook?', 'It is fast, works all day, and does not make counting mistakes.']));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-' + PREV,
  '<strong>Extension:</strong> finished the Do Now? Try these questions from the last lesson. Stuck? Switch on <strong>I need help</strong>.',
  ['Why practise the last lesson before a new one?', 'Today builds on it: the parts inside the CPU are how it processes instructions and data.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'CPU Components',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">CPU Components</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> the parts inside the CPU, and <strong>why</strong> each one is needed.', 'The <strong>ALU</strong> and the <strong>CU</strong>: the part that does the maths and the part in charge.', 'Five <strong>registers</strong>: PC, MAR, MDR, CIR and ACC.']) +
    why('Last lesson, the CPU ran a program stored in memory. Predict: what does the CPU need to remember while it runs a program?', 'Where the next instruction is, what it is doing now, and the answer so far. Something inside the CPU must hold each of these.') });

// ---------------------------------------------------------------- the ALU and the CU
steps.push(concept('concept-alu-cu', 'The ALU and the CU',
  'A program says: LOAD 5, then ADD 6. Predict: why might a CPU have one part that does the adding, and a different part that reads the program and decides what happens next?',
  '<p>Two different jobs. One part only has to calculate. The other is in charge: it works out what each instruction means and sends signals to make the right parts do it.</p>',
  columns(facts(['<strong>ALU</strong>: arithmetic logic unit. It carries out <strong>calculations</strong> (such as 25 + 17) and <strong>logical operations</strong> (such as: is 41 bigger than 30?).',
    'The ALU stores the result in a register called the <strong>accumulator</strong>.',
    '<strong>CU</strong>: control unit. It sends <strong>control signals</strong> to manage how data and instructions move through the CPU.',
    'The CU <strong>decodes</strong> each instruction: it works out what the instruction means.',
    'A CPU built this way, running a program stored in memory, has a <strong>Von Neumann architecture</strong>.']),
    cpuDiagram())));

steps.push(mcStep('predict-alu-cu', 'Predict: ALU or CU?', 'The program LOAD 5, ADD 6, OUTPUT is running.', [
  { prompt: 'The CPU must work out that ADD 6 means "add the number stored at address 6". Which part does this?', options: ['The ALU', 'The CU', 'The main memory'], correct: 1,
    explain: 'Working out what an instruction means is decoding. The CU decodes instructions. The ALU only does the adding once it is told to.' },
  { prompt: 'Address 6 holds 17 and the CPU holds 25. Which part works out 25 + 17?', options: ['The CU', 'The main memory', 'The ALU'], correct: 2,
    explain: 'Adding is a calculation, so the ALU does it. The result, 42, goes into the accumulator.' },
], ['Before you answer, why should you ask "is this maths, or is this being in charge?"', 'Every job in the CPU is one or the other, so that one question tells you which unit does it.']));

steps.push(embed('activity-1', 'Activity 1: Who Does This Job?', 'cpu-lab',
  'Is it the ALU or the CU? Pick the part that does each job. One check per set, and a mistake means it does not count.',
  ['Why do the PC and the MAR get mixed up?', 'Both hold an address. The PC holds the address of the next instruction; the MAR holds the address being read or written right now.'], 'activity=parts'));

// ---------------------------------------------------------------- registers
// The registers: one job each, in a table with an everyday comparison. No tracing of values (that is the
// fetch-decode-execute lesson, 3.1.4).
{
  // Every component: its job and an example of what it holds or does, so students can copy it into their own table.
  const ROWS = [['ALU', 'arithmetic logic unit', 'Carries out <b>calculations</b> and <b>logical operations</b> (comparing). Its results go in the ACC.', 'Works out 30 + 12, or checks: is 41 bigger than 30?'],
    ['CU', 'control unit', 'Sends <b>control signals</b> to manage how data and instructions move. <b>Decodes</b> each instruction.', 'Works out that ADD 6 means: add the number at address 6.'],
    ['PC', 'program counter', 'Holds the <b>address</b> of the <b>next</b> instruction.', '<b>4</b>: the next instruction is at address 4.'],
    ['MAR', 'memory address register', 'Holds the <b>address</b> memory is about to read or write.', '<b>6</b>: memory is about to read address 6.'],
    ['MDR', 'memory data register', 'Holds the <b>data or instruction</b> that has just come from memory (or is going to it).', '<b>12</b>: the number stored at address 6.'],
    ['CIR', 'current instruction register (part of the CU)', 'Holds the instruction being decoded and carried out <b>now</b>.', '<b>ADD 6</b>'],
    ['ACC', 'accumulator (part of the ALU)', 'Holds the <b>result</b> of a calculation from the ALU.', '<b>42</b>: the result of 30 + 12.']];
  const cell = 'padding:6px 10px;border-bottom:1px solid var(--line);vertical-align:top';
  const table = '<table style="border-collapse:collapse;width:100%;font-size:16px"><tr>' + ['Component', 'Its job', 'Example'].map((h) => `<th style="text-align:left;padding:4px 10px;font-size:14px;color:var(--muted);border-bottom:1px solid var(--line)">${h}</th>`).join('') + '</tr>' +
    ROWS.map(([r, full, job, ex], i) => (i === 2 ? `<tr><td colspan="3" style="padding:8px 10px 2px;font-size:14px;color:var(--muted)">Registers: tiny, very fast stores inside the CPU. Each holds one thing.</td></tr>` : '') +
      `<tr><td style="${cell}"><b style="font-size:19px">${r}</b><br><span style="font-size:13px;color:var(--muted)">${full}</span></td><td style="${cell}">${job}</td><td style="${cell};${MONO.replace('font-family', 'font-family')};font-size:15px">${ex}</td></tr>`).join('') + '</table>';
  steps.push(concept('concept-registers', 'The Parts of the CPU',
    'Main memory holds the whole program, but it is outside the CPU. Predict: why does the CPU also keep a few values in tiny stores of its own?',
    '<p>Memory is slower to reach. The CPU keeps what it needs right now close by, so it can work fast.</p>',
    '<p class="lesson-lead">Use this to make your own table: each part of the CPU, its job, and an example.</p>' + table));
}

steps.push(mcStep('predict-registers', 'Predict: Which Register?', '', [
  { prompt: 'The CPU needs to know where the next instruction is. Which register holds that?', options: ['MDR', 'PC', 'ACC'], correct: 1,
    explain: 'The PC (program counter) holds the address of the next instruction, like a bookmark.' },
  { prompt: 'A number has just arrived from memory. Which register holds it?', options: ['MDR', 'MAR', 'CIR'], correct: 0,
    explain: 'The MDR holds the data that came from memory. The MAR only holds its address.' },
  { prompt: 'The ALU has worked out 25 + 17 = 42. Which register holds 42?', options: ['PC', 'CIR', 'ACC'], correct: 2,
    explain: 'The ACC (accumulator) holds the result of a calculation from the ALU.' },
], ['Two register names differ by one letter. How can a letter in a name help you remember its job?', 'Each letter stands for a word: A for address, D for data, I for instruction.']));

steps.push(embed('activity-2', 'Activity 2: Which Register?', 'cpu-lab',
  'Now only the registers, then all seven parts. One check per set, and a mistake means it does not count.',
  ['Why do the PC and the MAR get mixed up?', 'Both hold an address. The PC holds the next instruction\'s address; the MAR holds the address being read right now.'], 'activity=parts&level=2'));

// Activity 3: a research poster in Canva, uploaded on the slide (file-upload step, LessonUploads.gs): each file goes
// to James's Drive in a folder with the student's name.
steps.push({ id: 'activity-3', label: 'Activity 3: CPU Poster', type: 'file-upload', containerId: `${P}-activity-3`,
  content: '<h2 class="lesson-h2">Activity 3: CPU Poster</h2>' +
    why('Why is it a good idea to check a fact on two different websites?', 'One website can be wrong. If two good websites agree, the fact is more likely to be right.') +
    columns('<p class="lesson-lead"><strong>Research, then design.</strong> Make a poster in <a href="https:' + '/' + '/www.canva.com" target="_blank" rel="noopener">Canva</a> (sign in with your school Google account). Use Google to find out more.</p>' +
      facts(['Show <strong>every component</strong>: ALU, CU, PC, MAR, MDR, CIR and ACC.', 'For each one, write its <strong>role</strong> in your own words.',
        'Draw <strong>where it sits</strong> in the CPU: which parts are inside the CU or the ALU, and where main memory is.',
        'Search ideas: <em>Von Neumann architecture diagram</em>, <em>what does the MAR do</em>, <em>CPU registers IGCSE</em>.',
        'Finished? In Canva press <strong>Share</strong>, <strong>Download</strong>, then PNG or PDF, and upload it here.']),
      `<div id="${P}-activity-3"></div>`) });

// ---------------------------------------------------------------- exam questions
const ALU = '^\\s*(the\\s+)?(arithmetic\\s*(and\\s*)?logic(al)?\\s*unit|alu)\\s*(\\(\\s*alu\\s*\\))?\\s*\\.?\\s*$';
const CU = '^\\s*(the\\s+)?(control\\s*unit|cu)\\s*(\\(\\s*cu\\s*\\))?\\s*\\.?\\s*$';
const CIR = '^\\s*(the\\s+)?(current\\s*instruction\\s*register|instruction\\s*register|cir|ir)\\s*(\\(\\s*c?ir\\s*\\))?\\s*\\.?\\s*$';
steps.push(checkStep('exam-1', 'Exam Questions: Name the Part',
  'Four real 1-mark questions. ' + cite('0478/11 November 2021 Q6(b); 0478/11 November 2023 Q1(c); 0478/11 June 2025 Q5(b); 0478/13 November 2025 Q2(b)(ii)'), [
    { label: '(a) Identify the component in the CPU that carries out calculations.', answer: ALU, feedback: 'Which part does the arithmetic?' },
    { label: '(b) A component in the CPU sends signals to manage the fetch-decode-execute cycle. State the name of this component.', answer: CU, feedback: 'Which part is in charge and sends control signals?' },
    { label: '(c) Identify the component in the CPU that is responsible for decoding an instruction.', answer: CU, feedback: 'Decoding means working out what the instruction means. Which part is in charge?' },
    { label: '(d) Give the name of the register that is part of the CU.', answer: CIR, feedback: 'The CU decodes the instruction held in this register.' },
  ], ['Why do these questions say "identify" or "state", and not "describe"?', 'They want only the name, for 1 mark. A long description takes time and earns nothing more.']));

steps.push(written('exam-2', 'Exam Questions: The ALU and the CU',
  cite('0478/13 June 2024 Q8(c) and 0478/13 November 2025 Q2(b)(i)') + ' Each "describe" mark is a separate point.', [
    { id: 'alu', prompt: 'One component in the CPU is the arithmetic logic unit (ALU). Describe the purpose of the ALU.', marks: 3,
      scheme: ['To execute instructions', 'To perform calculations (or an example, such as adding)', 'To perform logical operations (or an example, such as comparing)', 'To store interim results of calculations', 'It stores, reads or writes data to or from the accumulator'],
      guidance: 'Any three, one mark each. An example of a calculation (adds two numbers) earns the calculation mark; an example of a logical operation (compares two numbers) earns the logic mark. "It does maths" is a calculation point.',
      modelAnswer: 'It performs calculations and logical operations. It stores the results in the accumulator.' },
    { id: 'cu', prompt: 'The CPU has a control unit (CU). Describe the role of the CU in the CPU.', marks: 3,
      scheme: ['It sends control signals to other components', '... using the control bus', '... to manage the flow of data through the CPU', 'It decodes an instruction', '... using an instruction set'],
      guidance: 'Any three, one mark each. The "control bus" and "flow of data" marks follow the control signals point. The "instruction set" mark follows the decodes point. "It controls the computer" alone earns no mark.',
      modelAnswer: 'It sends control signals to manage the flow of data through the CPU. It decodes instructions.' },
  ], ['Why must each point in a "describe" answer be a different idea?', 'Each mark is for one point. Saying the same idea twice in new words earns only one mark.']));

steps.push(mcStep('exam-3', 'Exam Question: ALU, CU or Main Memory?',
  'Adapted from ' + cite('0478/13, June 2021, Question 10(a)') + ' Three components are the arithmetic logic unit (ALU), control unit (CU) and random access memory (RAM), the main memory. Which component does each statement apply to?', [
    { prompt: 'Stores data and instructions before they enter the CPU.', options: ['ALU', 'CU', 'RAM'], correct: 2, explain: 'Main memory (RAM) holds the program and its data. They go into the CPU when they are needed.' },
    { prompt: 'Contains a register called the accumulator.', options: ['ALU', 'CU', 'RAM'], correct: 0, explain: 'The accumulator is part of the ALU: it holds the ALU\'s results.' },
    { prompt: 'Manages the transmission of data and instructions to the correct components.', options: ['ALU', 'CU', 'RAM'], correct: 1, explain: 'Managing where data and instructions go is control, so it is the CU.' },
    { prompt: 'Carries out calculations on data.', options: ['ALU', 'CU', 'RAM'], correct: 0, explain: 'Calculations are done by the ALU.' },
  ], ['Why does a CPU need one part that calculates and a different part that controls?', 'They are different jobs. Keeping them apart means each part can be simple and fast.']));

steps.push(written('exam-4', 'Exam Questions: The Registers',
  cite('0478/12 March 2021 Q8(b)(i) and 0478/11 November 2023 Q1(e)') + ' The CPU contains registers, including the program counter (PC) and the memory data register (MDR).', [
    { id: 'pc', prompt: 'Describe the role of the Program Counter.', marks: 2, scheme: ['It holds the address ...', '... of the next (or current) instruction'],
      guidance: 'One mark for holds an address, one for of the next instruction. "Counts the instructions" earns no mark.',
      modelAnswer: 'It holds the address of the next instruction.' },
    { id: 'mdr', prompt: 'Describe the role of the MDR in the fetch-decode-execute cycle.', marks: 2, scheme: ['It stores data ...', '... that has been fetched from memory, or is to be written to memory'],
      guidance: 'One mark for stores data (or an instruction), one for that has been fetched from memory or is about to be written to memory. "Stores the address" earns no mark: that is the MAR.',
      modelAnswer: 'It stores data that has been fetched from memory.' },
    { id: 'others', prompt: 'Identify three other registers contained in the CPU.', marks: 3, scheme: ['Memory address register (MAR)', 'Program counter (PC)', 'Current instruction register (CIR)', 'Accumulator (ACC)'],
      guidance: 'Any three, one mark each. The MDR is in the question, so it earns no mark. Abbreviations alone (MAR, PC, CIR, ACC) earn the marks.',
      modelAnswer: 'MAR, CIR, ACC' },
  ], ['Why should you read a register name twice before you answer?', 'Some names look alike, such as MAR and MDR, but they do different jobs.']));

steps.push(written('exam-5', 'Exam Question: Definitions',
  'Adapted from ' + cite('0478/11, June 2025, Question 5(a)') + ' Complete the definition for each term.', [
    { id: 'cir', prompt: 'Current instruction register (CIR). Give its definition.', marks: 1, scheme: ['It stores the instruction that is being decoded or executed'],
      guidance: 'One mark for holding the current instruction, or the instruction being decoded or executed. "Stores instructions" alone earns no mark: it must be the current one.',
      modelAnswer: 'It stores the instruction being decoded or executed.' },
    { id: 'acc', prompt: 'Accumulator. Give its definition.', marks: 1, scheme: ['It stores the result of interim calculations'],
      guidance: 'One mark for storing the results of (interim) calculations, or the results from the ALU.',
      modelAnswer: 'It stores the result of interim calculations.' },
  ], ['Why must a definition be exact, even for 1 mark?', 'The mark is for the one idea that makes this term different from every other term.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: CPU Components Drill', 'drill-' + ID,
  'The ALU, the CU and the five registers, with real exam wording. Pick the answer that earns the mark, then type it. Your progress is saved.',
  ['Why does a drill bring back a card you got wrong?', 'Getting it right again later shows you remember it, not that you guessed once.']));

// ---------------------------------------------------------------- plenary drill
const card = (id, cat, prompt, answers, distractors, noteText, working) => ({ id, category: cat, prompt, answers, distractors, note: noteText, working, pickThenType: true });
const PARTS = ['Arithmetic logic unit (ALU)', 'Control unit (CU)', 'Program counter (PC)', 'Memory address register (MAR)', 'Memory data register (MDR)', 'Current instruction register (CIR)', 'Accumulator (ACC)'];
const others = (a) => PARTS.filter((p) => p !== a);
const cards = [
  card('u-01', 'units', 'Identify the component in the CPU that carries out calculations.', ['Arithmetic logic unit (ALU)'], others(PARTS[0]).slice(0, 4), 'From Cambridge IGCSE 0478/11, November 2021, Question 6(b).', ['Calculations are arithmetic.', 'Its name has "arithmetic" in it.']),
  card('u-02', 'units', 'Identify the component in the CPU that is responsible for decoding an instruction.', ['Control unit (CU)'], [PARTS[0], PARTS[5], PARTS[4], PARTS[2]], 'From Cambridge IGCSE 0478/11, June 2025, Question 5(b).', ['Decoding means working out what an instruction means.', 'It is the part in charge.']),
  card('u-03', 'units', 'Describe the purpose of the ALU.\nGive one point that earns a mark.', ['It performs calculations', 'It performs logical operations', 'It stores interim results in the accumulator'], ['It decodes instructions', 'It holds the address of the next instruction', 'It stores the whole program', 'It sends control signals'],
    'From Cambridge IGCSE 0478/13, June 2024, Question 8(c).', ['ALU: arithmetic logic unit.', 'Arithmetic is calculating; logic is comparing.']),
  card('u-04', 'units', 'Describe the role of the CU in the CPU.\nGive one point that earns a mark.', ['It sends control signals to other components', 'It decodes instructions'], ['It performs calculations', 'It stores the result of calculations', 'It holds the address of the next instruction', 'It stores data from memory'],
    'From Cambridge IGCSE 0478/13, November 2025, Question 2(b)(i).', ['CU: control unit. It is in charge.', 'How does it make other parts do their jobs?']),
  card('u-05', 'units', 'Is 41 bigger than 30?\nWhich part of the CPU works this out?', ['Arithmetic logic unit (ALU)'], [PARTS[1], PARTS[6], PARTS[3]], 'Comparing two numbers is a logical operation, done by the ALU.', ['Comparing is logic.', 'Which unit does logic?']),
  card('u-06', 'units', 'Which register is part of the ALU?', ['Accumulator (ACC)'], [PARTS[5], PARTS[2], PARTS[3]], 'From Cambridge IGCSE 0478/13, June 2021, Question 10(a).', ['The ALU stores its results in it.', 'It holds the result of calculations.']),
  card('u-07', 'units', 'Give the name of the register that is part of the CU.', ['Current instruction register (CIR)'], [PARTS[6], PARTS[2], PARTS[4]], 'From Cambridge IGCSE 0478/13, November 2025, Question 2(b)(ii).', ['The CU decodes an instruction.', 'Which register holds the instruction being decoded?']),
  card('r-01', 'regs', 'Describe the role of the program counter.', ['It holds the address of the next instruction'], ['It counts how many programs are running', 'It holds the result of calculations', 'It holds the data fetched from memory', 'It holds the instruction being decoded'],
    'From Cambridge IGCSE 0478/12, March 2021, Question 8(b)(i).', ['It holds an address.', 'Which instruction: the one now, or the next one?']),
  card('r-02', 'regs', 'Describe the role of the MDR.', ['It stores data that has been fetched from memory'], ['It stores the address of the data', 'It stores the address of the next instruction', 'It decodes the instruction', 'It stores the whole program'],
    'From Cambridge IGCSE 0478/11, November 2023, Question 1(e)(i).', ['D is for data.', 'Is it the address, or what was found at the address?']),
  card('r-03', 'regs', 'Which register holds the address of the data that is about to be fetched from memory?', ['Memory address register (MAR)'], [PARTS[4], PARTS[2], PARTS[5]], 'From Cambridge IGCSE 0478/11, November 2021, Question 6(a).', ['It holds an address, used right now.', 'The PC is for the next instruction only.']),
  card('r-04', 'regs', 'Give the definition of the accumulator.', ['It stores the result of interim calculations'], ['It stores the instruction being decoded', 'It stores the address of the next instruction', 'It stores data fetched from memory', 'It counts the instructions'],
    'From Cambridge IGCSE 0478/11, June 2025, Question 5(a).', ['It is part of the ALU.', 'What does the ALU make?']),
  card('r-05', 'regs', 'Give three registers that are built into the CPU.\nGive one of them.', ['Program counter (PC)', 'Memory address register (MAR)', 'Memory data register (MDR)', 'Current instruction register (CIR)', 'Accumulator (ACC)'], ['Arithmetic logic unit (ALU)', 'Control unit (CU)', 'Random access memory (RAM)', 'Binary counter (BC)'],
    'From Cambridge IGCSE 0478/13, June 2024, Question 8(b)(ii).', ['The ALU and the CU are units, not registers.', 'RAM is outside the CPU.']),
];
const drill = { title: 'Year 10, 3.1.2: CPU Components', subtitle: 'Cambridge IGCSE Computer Science 0478', categories: [['units', 'The ALU and the CU'], ['regs', 'The registers']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 3 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
});
assert(30 + 12 === 42 && 20 + 15 === 35, 'sums');
const drillSrc = `// Year 10, 3.1.2: CPU Components. Plenary: the ALU, the CU and the registers PC, MAR, MDR, CIR and ACC.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y10_3_1_l2.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('exam-1', 0, ['ALU', 'the alu', 'Arithmetic Logic Unit', 'arithmetic logic unit (ALU)', 'arithmetic and logic unit'], ['CU', 'logic', 'accumulator']);
ok('exam-1', 1, ['CU', 'control unit', 'The Control Unit', 'control unit (CU)'], ['ALU', 'control', 'controller']);
ok('exam-1', 2, ['cu', 'Control unit.'], ['CIR', 'decoder']);
ok('exam-1', 3, ['CIR', 'current instruction register', 'Instruction register', 'IR', 'current instruction register (CIR)'], ['PC', 'MDR', 'register']);
// Terms a student sees: nothing from 3.1.3 on (buses, cache, cores, clock speed). The mark schemes are teacher-side.
const seen = JSON.stringify(steps.map((s) => Object.assign({}, s, { items: (s.items || []).map((it) => Object.assign({}, it, { scheme: undefined, guidance: undefined })) }))) + JSON.stringify(drill);
const all = JSON.stringify(steps) + JSON.stringify(drill);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
{ const bad = /mario|\bdecimal\b|\bbus(es)?\b|\bcache\b|\bcores?\b|clock speed|interrupt/i.exec(seen.split(ID).join(''));
  assert(!bad, 'term taught later: ' + (bad ? bad[0] + ' in ' + seen.slice(bad.index - 60, bad.index + 30) : '')); }

const lesson = { id: ID, label: '3.1.2: CPU Components', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after y10-3-1-l1 in the 3.1 unit
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
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, drill ${cards.length} cards`);
