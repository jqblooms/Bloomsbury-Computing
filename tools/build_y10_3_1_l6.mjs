// Builds LessonData/y10-3-1-l6.json and its plenary drill Drills/data/y10-3-1-l6.js: Year 10, 3.1.6: Instruction Sets
// (syllabus 0478 3.1: understand what is meant by an instruction set; an instruction set is a list of all the commands
// that can be processed by a CPU, and the commands are machine code).
//   node tools/build_y10_3_1_l6.mjs
// It adds the lesson to the "3.1" unit after y10-3-1-l5. The drill is registered in the shell (js/registries.html).
// One idea per slide, each a prediction and then the reason (the l5 shape), with three 2D animations (pages InstrAnim/,
// registry instr-anim), each followed by an own-words Explain It marked by Haiku (docs/lessons.md 2b). Order: why a CPU
// has a fixed list (instruction set); why instructions are binary (machine code), opcode and operand; decoding
// 0010 0111 with the instruction set (the l4 memory: 6 holds 12, 7 holds 30); why machine code for one CPU type fails
// on a CPU with a different instruction set. Notes on their own slides with Check my note.
// Activities: CPU Lab activity=isa (Machine Code: CpuLab/isa.js, model test tools/test_cpulab_isa.mjs), levels 1 to 2
// on Activity 1 and 3 to 4 on Activity 2.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:  0478/12 November 2023 Q3(b); 0478/12 June 2025 Q4(a) (the clock and MDR rows; its other rows are in l5)
//   Exam:    0478/12 June 2024 Q5(b); 0478/12 November 2023 Q3(c); 0478/11 November 2024 Q5(b) (also in l4, now with
//            opcode and operand taught)
//   The practice paper y10-3-1-l6-paper (ExamPapers.gs) uses others: 0478/12 March 2025 Q3(d); 0478/13 June 2026
//   Q3(c)(i); 0478/11 June 2026 Q2(a)(ii); 0478/13 November 2025 Q2(b)(i); 0478/12 November 2025 Q4(a).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l6';
const PREV = 'y10-3-1-l5';
const P = 'y10-316';
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
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}

// ---------------------------------------------------------------- step builders (as y10-3-1-l5)
const validators = {};
function checkStep(id, label, lead, parts, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} marks</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, card) : card) };
}
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
  let left = extra;
  if (extra && items.length === 1) {
    const f = (lead || '').match(/<ul class="lesson-facts">[\s\S]*?<\/ul>/);
    if (f) { lead = lead.replace(f[0], ''); left = f[0] + extra; }
  }
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead || '') + (!extra ? `<div id="${cid}"></div>` : items.length > 1 ? `<div style="display:grid;grid-template-columns:minmax(0,0.8fr) minmax(0,1.6fr);gap:16px;align-items:start"><div>${extra}</div><div id="${cid}"></div></div>` : `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:16px;align-items:start"><div>${left}</div><div id="${cid}"></div></div>`), items };
}
function written(id, label, lead, items, extra = '', side = false) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + `<p class="lesson-lead">${lead}</p>` + (side ? columns(extra, `<div id="${cid}"></div>`) : extra + `<div id="${cid}"></div>`), items };
}
function embed(id, label, appId, lead, embedQuery) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` }, embedQuery ? { embedQuery } : {});
}
// An animation slide (pages InstrAnim/, registry instr-anim), then an Explain It slide marked by Haiku (as y11-1-9).
const ANIMS = {};
function anim(id, label, scene, whyQ) {
  ANIMS[id] = scene;
  return { id, label, type: 'embedded-app', appId: 'instr-anim', embedQuery: 'scene=' + scene, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + tps(whyQ[0], whyQ[1]) +
      '<p class="lesson-lead">Press <strong>Play</strong>, or <strong>Next</strong> for one step at a time.</p>' + `<div id="${P}-${id}"></div>` };
}
function explain(id, label, about, part) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` +
      '<p class="lesson-lead"><strong>What to do:</strong> explain it in your own words. Press <strong>Check my answer</strong> to have it marked, improve it, then press <strong>Submit answer</strong>.</p>' + `<div id="${cid}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part)] };
}
const steps = [];
const WRITE_DO = '<strong>What to do:</strong> type your answer, then press <strong>Check my answer</strong> or <strong>Submit answer</strong>.';
const PREDICT = 'read the facts, then pick your prediction. The reason appears under it.';
const COMPARE = 'compare the two CPUs, then pick your prediction. The reason appears under it.';
// An instruction set as a small table: rows [[opcode, command]].
const SET_A = [['0001', 'LOAD'], ['0010', 'ADD'], ['0011', 'SUB'], ['0100', 'STORE'], ['0101', 'OUTPUT']];
const SET_B = [['0001', 'OUTPUT'], ['0010', 'LOAD'], ['0011', 'ADD'], ['0100', 'STORE']];
const setTable = (title, rows) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:4px 12px"><b>${title}</b>` +
  '<table style="border-collapse:collapse;font-size:15px;margin:2px 0 0;width:100%"><tr><th style="text-align:left;font-size:13px;color:var(--muted);padding:1px 6px">Opcode</th><th style="text-align:left;font-size:13px;color:var(--muted);padding:1px 6px">Command</th></tr>' +
  rows.map(([o, c]) => `<tr><td style="${MONO};padding:1px 6px;border-top:1px solid var(--line)">${o}</td><td style="padding:1px 6px;border-top:1px solid var(--line)"><b>${c}</b></td></tr>`).join('') + '</table></div>';

// ---------------------------------------------------------------- Do Now 1: 0478/12 November 2023 Q3(b)
// Mark scheme: stores addresses ...; ... of next instruction or data to be fetched // where data is to be written to.
// The walkthrough is the same kind of question about the ACC (never the MAR's points, never the MDR: Do Now 2).
const WT_DN1 = { title: 'Walk me through it: the role of a register', steps: [
  { text: '<strong>A similar question.</strong> "Describe the role of the accumulator (ACC) in the fetch-decode-execute cycle." It is worth 2 marks.', visual: note('2 marks: 2 points that follow on') },
  { text: 'Point 1: what does the ACC ' + kw('store') + '? It stores ' + kw('a value') + '.', visual: line('ACC: stores ' + kw('a value')) },
  { text: 'Point 2 says ' + kw('which one') + ', or when. The ACC stores the ' + kw('result of a calculation') + ' made by the ALU.', visual: line('which value? ' + kw('the result of a calculation')) },
  { text: 'Now your question. What does the MAR store? Then say which one: the one for which instruction or data?', visual: note('what it stores + which one') },
] };
steps.push(written('do-now', 'Do Now: The MAR (1 of 2)',
  'Recap of 3.1.2 to 3.1.4. ' + cite('0478/12, November 2023, Question 3(b)') + ' ' + WRITE_DO, [
    { id: 'mar-role', prompt: '(b) The CPU contains a memory address register (MAR). Describe the role of the MAR in the fetch-decode-execute cycle.', marks: 2,
      scheme: ['It stores addresses ...', '... of the next instruction or data to be fetched // of where data is to be written to'],
      guidance: 'Two from the points, one mark each. Point 2 follows on from point 1.',
      modelAnswer: 'It stores the address of the next instruction to be fetched.' },
  ], '<p style="margin:0">A user\'s computer has a central processing unit (CPU).</p>'));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/12 June 2025 Q4(a), the clock and MDR rows
// Mark scheme: Clock; memory data register // MDR. The other four rows of this table are in y10-3-1-l5.
const WT_DN2 = { title: 'Walk me through it: name the component', steps: [
  { text: '<strong>A similar question.</strong> Two rows of a table. Row 1: "It holds the instruction while it is decoded." Row 2: "It carries out calculations."', visual: note('read the description, find its key words') },
  { text: 'Row 1. The ' + kw('key words') + ' are "holds the instruction" and "decoded". Which register holds the current instruction?', visual: line('key words: ' + kw('holds the current instruction')) },
  { text: 'It is the ' + kw('current instruction register (CIR)') + '. The full name or the letters both earn the mark.', visual: line('Row 1: ' + kw('CIR')) },
  { text: 'Row 2. The key word is ' + kw('calculations') + '. The part that does arithmetic and logic is the ' + kw('ALU') + '.', visual: line('Row 2: ' + kw('ALU')) },
  { text: 'Now your rows. Find the key words: what is counted "per second"? What sits between the CPU and RAM, "before" and "after"?', visual: note('key words, then the part') },
] };
const W = (w) => `^\\s*(the\\s+|an?\\s+)?${w}\\s*\\.?\\s*$`;
steps.push(checkStep('do-now-2', 'Do Now: Name the Component (2 of 2)',
  'Recap of 3.1.2 and 3.1.5. ' + cite('0478/12, June 2025, Question 4(a) (adapted: two of the six rows)') + ' The computer has a central processing unit (CPU). Give the component for each description. <strong>What to do:</strong> type each answer, then press Check answers.', [
    { label: '(a) It controls the number of fetch-decode-execute (FDE) cycles that are performed per second.', answer: W('(system\\s+)?clock'), feedback: 'It sends out one pulse for each FDE cycle.' },
    { label: '(b) It stores data immediately before it is transmitted to RAM and immediately after it is received from RAM.', answer: W('(mdr|memory\\s+data\\s+register(\\s*\\(?mdr\\)?)?)'), feedback: 'It is the register that sits between the CPU and RAM for data.' },
  ]));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-3-1-l5',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on CPU performance. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Go to the next slide when you are ready.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Instruction Sets',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">Instruction Sets</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> the commands a CPU can carry out, how they are stored in memory, and <strong>why</strong> a program made for one CPU may not run on another.', 'One small memory all lesson: address 6 holds 12, address 7 holds 30.',
      '<strong>How this lesson works:</strong> on each slide, read the facts, <strong>predict</strong>, then read or watch why.']) +
    tps('A game made for a games console will not run on a laptop, even when the files are copied across. Why might that be?', 'Collect ideas: the two computers are built differently inside. Today shows one big reason, inside the CPU.') });

// ---------------------------------------------------------------- the instruction set
steps.push(mcStep('why-list', 'Why a CPU Has a Fixed List', todo(PREDICT) +
  facts(['The CPU from the last lessons can carry out only five commands: LOAD, ADD, SUB, STORE and OUTPUT.', 'Its CU and ALU have circuits for these commands, and no others.']), [
    { prompt: 'Predict: a program asks this CPU to MULTIPLY. What happens?', options: ['It cannot process it: it is not one of its commands', 'The CU builds a new circuit for it', 'The ALU works out what MULTIPLY means'], correct: 0,
      explain: 'A CPU can only process the commands it was built for. The list of all the commands a CPU can process is its <strong>instruction set</strong>. A multiplication must be made from commands it does have, such as ADD again and again.' },
  ]));
// 0478/12 June 2024 Q5(b): a list of (machine code) commands that can be processed by the CPU.
steps.push(written('exam-isa', 'Exam Question: What Is an Instruction Set?',
  cite('0478/12, June 2024, Question 5(b)') + ' Instructions are processed by a central processing unit (CPU) in a computer. ' + WRITE_DO, [
    { id: 'isa-what', prompt: '(b) The CPU uses an instruction set to decode the instruction. State what is meant by an instruction set.', marks: 1,
      scheme: ['A list of (machine code) commands that can be processed by the CPU'],
      guidance: 'One mark. It must be a list of commands (or instructions) and say they can be processed (carried out, run) by the CPU. "The instructions in a program" earns no mark.',
      modelAnswer: 'A list of the commands that can be processed by the CPU.' },
  ]));

// ---------------------------------------------------------------- machine code, opcode and operand
steps.push(mcStep('why-binary', 'Why Instructions Are Binary', todo(PREDICT) +
  facts(['A program is stored in memory, just like data.', 'Memory can only store 0s and 1s.']), [
    { prompt: 'Predict: how can the instruction LOAD 6 be stored in memory?', options: ['As a binary code for LOAD, then 6 in binary', 'As the word LOAD, written on the chip', 'It is not stored: the CU remembers it'], correct: 0,
      explain: 'The instruction set gives each command its own binary code. An instruction written in this binary is <strong>machine code</strong>. Watch it happen on the next slide.' },
  ]));
steps.push(anim('anim-binary', 'Watch: LOAD 6 as Machine Code', 'binary',
  ['Before you watch: why can memory not just store the word LOAD?', 'Memory is made of tiny switches that are on or off, 1 or 0. Everything stored has to be 0s and 1s.']));
steps.push(explain('explain-binary', 'Explain It: Machine Code',
  'The animation showed the instruction LOAD 6. Memory can only store 0s and 1s. The instruction set gives LOAD the binary code 0001, and 6 becomes 0110, so LOAD 6 is stored as 0001 0110. An instruction in binary is machine code. The first part (opcode) says which command; the second part (operand) says what to use.',
  { prompt: 'In your own words, explain what machine code is, and why a program is stored in memory as machine code.', marks: 2,
    scheme: ['Machine code is instructions in binary // 0s and 1s', 'Memory or the CPU can only store or process binary // 0s and 1s', 'Each command in the instruction set has its own binary code'],
    guidance: 'Any two points, one mark each. Credit each point in the student\'s own words; no technical words are needed. "It is a code" alone earns nothing: it must say binary, or 0s and 1s.',
    modelAnswer: 'Machine code is instructions in binary. Memory can only store 0s and 1s.' }));
steps.push(noteSlide('note-machine-code', 'Your Notes: Instruction Sets and Machine Code', [
  ['explain what an instruction set is.', 'A list of all the commands that can be processed by a CPU.'],
  ['explain WHY a CPU can only process commands in its instruction set.', 'Its CU and ALU have circuits for only those commands. Any other command cannot be processed.'],
  ['explain what machine code is, and WHY programs are stored as machine code.', 'Instructions in binary, using the codes in the instruction set. Memory can only store 0s and 1s.']]));
// 0478/12 November 2023 Q3(c): instruction set.
steps.push(checkStep('exam-name', 'Exam Question: Name the List',
  cite('0478/12, November 2023, Question 3(c)') + ' A user\'s computer has a central processing unit (CPU). <strong>What to do:</strong> type your answer, then press Check answers.', [
    { label: '(c) The CPU has a list of all the machine code commands it can process. State the name of this list of commands.', answer: W('instruction\\s*sets?'), feedback: 'Every CPU type has its own one.' },
  ]));

steps.push(mcStep('opcode', 'Two Parts: Opcode and Operand', todo(PREDICT) +
  facts(['Each instruction is 8 bits.', 'This CPU\'s instruction set gives LOAD the code 0001 and ADD the code 0010.']), [
    { prompt: 'Predict: what does 0010 0111 tell the CPU to do?', options: ['ADD the value at address 7', 'LOAD the value at address 2', 'ADD 2 and 7 together'], correct: 0,
      explain: 'The first 4 bits, 0010, say which command: they are the <strong>opcode</strong> (ADD). The last 4 bits, 0111, say what to use: they are the <strong>operand</strong>, here the address 7 (4 + 2 + 1).' },
  ], `<div style="text-align:center;${MONO};font-size:28px;letter-spacing:4px;margin:4px 0">0010 0111</div>`));
steps.push(anim('anim-decode', 'Watch: Decoding 0010 0111', 'decode',
  ['Before you watch: the CU has only 0s and 1s. How could it work out what to do?', 'Ideas: split it into parts, look the parts up, turn binary into a number. Watch to check.']));
steps.push(explain('explain-decode', 'Explain It: Decoding',
  'The animation showed 0010 0111 in the CIR. The CU split it into the opcode 0010 and the operand 0111. It looked up 0010 in the instruction set: ADD. The operand 0111 is address 7. Then the ALU added the value at address 7 (30) to the ACC (12), giving 42.',
  { prompt: 'In your own words, explain how the CU uses the instruction set to decode the instruction 0010 0111.', marks: 3,
    scheme: ['The instruction is split into an opcode and an operand // 0010 and 0111', 'The CU looks up the opcode (0010) in the instruction set', 'It finds the command: 0010 means ADD', 'The operand 0111 gives what to use: the address 7'],
    guidance: 'Any three points, one mark each. Credit each point in the student\'s own words. Point 3 needs the command (ADD) or that the opcode tells it which command; point 4 needs the operand to give the address or data.',
    modelAnswer: 'It is split into the opcode 0010 and the operand 0111. The CU looks up 0010 in the instruction set: ADD. The operand gives address 7.' }));
steps.push(mcStep('check-decode', 'Check: Decode It',
  todo('use the instruction set on the left. Split each instruction into opcode and operand.'), [
    { prompt: 'Decode 0001 1001.', options: ['LOAD 9', 'LOAD 1', 'ADD 9'], correct: 0,
      explain: 'Opcode 0001 is LOAD. Operand 1001 is 8 + 1 = 9. So LOAD 9: copy the value at address 9 into the ACC.' },
    { prompt: 'In 0011 0101, which part says which command to carry out?', options: ['0101, the operand', '0011, the opcode', 'Both parts together'], correct: 1,
      explain: 'The opcode, 0011: SUB. The operand, 0101, gives the address 5.' },
  ], setTable('The instruction set', SET_A)));
steps.push(embed('activity-1', 'Activity 1: Machine Code', 'cpu-lab',
  '<strong>What to do:</strong> one question at a time. Any mistake and the round does not count. <strong>Done</strong> after level 2.',
  'activity=isa&level=1&upto=2'));
// 0478/11 November 2024 Q5(b), any three: CIR or CU receives the instruction from the MDR; ... using the data bus;
// instruction is separated into opcode and operand; control unit decodes the instruction; ... using an instruction set.
steps.push(written('exam-decode', 'Exam Question: The Decode Stage',
  cite('0478/11, November 2024, Question 5(b)') + ' A central processing unit (CPU) performs the fetch-decode-execute (FDE) cycle. ' + WRITE_DO, [
    { id: 'decode-stage', prompt: '(b) Describe what happens at the decode stage of the cycle.', marks: 3,
      scheme: ['The CIR or CU receives the instruction from the MDR // the instruction is sent from the MDR to the CIR or CU', '... using the data bus', 'The instruction is separated into opcode and operand', 'The control unit decodes the instruction', '... using an instruction set'],
      guidance: 'Any three from the points, one mark each. A point marked ... follows on from the point before it.',
      modelAnswer: 'The instruction is separated into opcode and operand. The CU decodes it using an instruction set.' },
  ]));
steps.push(noteSlide('note-decode', 'Your Notes: Opcode, Operand and Decoding', [
  ['explain what the opcode and the operand are.', 'Opcode: the part of the instruction that says which command. Operand: the part that says what to use, such as an address.'],
  ['explain WHY the CU needs the instruction set to decode an instruction.', 'The instruction is only 0s and 1s. The instruction set tells the CU which command each opcode means.']]));

// ---------------------------------------------------------------- different CPU types
steps.push(mcStep('differ', 'Compare: Two CPU Types', todo(COMPARE) +
  facts(['A program is made for CPU A. Its first instruction is 0001 0110.']), [
    { prompt: 'Predict: what does CPU B do with 0001 0110?', options: ['LOAD 6, the same as CPU A', 'OUTPUT: not what the program meant', 'It changes its list to match CPU A'], correct: 1,
      explain: 'CPU B decodes with its own instruction set, where 0001 means OUTPUT. The same machine code means a different command on a CPU with a different instruction set, so the program does not do its job.' },
  ], `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${setTable('CPU A', SET_A)}${setTable('CPU B', SET_B)}</div>`));
steps.push(anim('anim-differ', 'Watch: One Program, Two CPUs', 'differ',
  ['Before you watch: what else could go wrong when CPU B runs all three instructions?', 'Make a guess for each instruction, then watch.']));
steps.push(explain('explain-differ', 'Explain It: Two CPU Types',
  'The animation ran the machine code 0001 0110, 0010 0111, 0101 0000 (made for CPU A) on CPU A and on CPU B. CPU A decoded LOAD 6, ADD 7, OUTPUT and output 42. CPU B has a different instruction set: for it 0001 is OUTPUT (it output 0), 0010 is LOAD (it loaded 30), and 0101 is not in its instruction set, so it could not process it.',
  { prompt: 'In your own words, explain why a machine code program made for CPU A may not run correctly on CPU B.', marks: 2,
    scheme: ['CPU B has a different instruction set', 'The same opcode or binary means a different command on CPU B', 'Some opcodes are not in CPU B\'s instruction set, so it cannot process them', 'The program must be made again for CPU B\'s instruction set'],
    guidance: 'Any two points, one mark each. Credit each point in the student\'s own words. "CPU B is different" or "CPU B is slower" earns nothing: it must be about the instruction set, the commands or the codes.',
    modelAnswer: 'CPU B has a different instruction set, so the same opcode means a different command.' }));
steps.push(embed('activity-2', 'Activity 2: Run It on Two CPUs', 'cpu-lab',
  '<strong>What to do:</strong> one question at a time. Any mistake and the round does not count. <strong>Done</strong> after level 4.',
  'activity=isa&level=3&upto=4'));
steps.push(mcStep('check-cpu', 'Check: Which CPU Can Run It?',
  todo('pick an answer for each question. Ask: which instruction set was the machine code made for? Done when both are answered.'), [
    { prompt: 'A machine code program was made for a CPU with instruction set X. Which CPU can run it correctly?', options: ['Any CPU with a faster clock', 'Any CPU with instruction set X', 'Any CPU with more cores'], correct: 1,
      explain: 'Only a CPU with the same instruction set decodes every opcode to the same command. A faster clock or more cores does not change what the opcodes mean.' },
    { prompt: 'A program made for CPU A uses the opcode 0101. CPU B\'s instruction set has no 0101. What happens on CPU B?', options: ['CPU B cannot process that instruction', 'CPU B runs it as OUTPUT', 'CPU B adds 0101 to its list'], correct: 0,
      explain: 'CPU B can only process commands in its own instruction set, so it cannot process 0101.' },
  ]));
steps.push(noteSlide('note-differ', 'Your Notes: Different CPU Types', [
  ['explain WHY machine code made for one CPU may not run on a CPU with a different instruction set.', 'The other CPU decodes with its own instruction set. The same opcode can mean a different command, or nothing, so the program does not do the same job.'],
  ['explain which CPUs can run a machine code program.', 'Only CPUs with the same instruction set as the one it was made for.']]));

// ---------------------------------------------------------------- notes check, plenary, practice paper
steps.push({ id: 'notes-check', label: 'Notes Check: Your WHY Notes',
  content: '<h2 class="lesson-h2">Notes Check: Your WHY Notes</h2>' + todo('open your notes (the notepad button at the top). You should have each note below, in your own words. Missing one? Go back to the slide named, write it, and press Check my note. Then go to the next slide.') +
    facts(['<strong>What an instruction set is. WHY a CPU can only process its own commands. What machine code is, and WHY.</strong> Slide: Your Notes: Instruction Sets and Machine Code.',
      '<strong>Opcode and operand. WHY the CU needs the instruction set to decode.</strong> Slide: Your Notes: Opcode, Operand and Decoding.',
      '<strong>WHY machine code for one CPU may not run on another. Which CPUs can run it.</strong> Slide: Your Notes: Different CPU Types.']) });
steps.push(embed('plenary', 'Plenary: Instruction Sets Drill', 'drill-' + ID,
  '<strong>What to do:</strong> answer every card. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.'));
steps.push({ id: 'exam-paper', label: 'Practice Paper: Instruction Sets', type: 'app-link', appId: 'exampaper', appQuery: 'paper=y10-3-1-l6-paper', buttonId: `${P}-open-paper`,
  content: '<h2 class="lesson-h2">Practice Paper: Instruction Sets</h2>' + todo('Open the practice paper. Answer every question, then press Submit paper. You get all your marks at once. You can take it again to improve.') +
    `<p><button type="button" class="donow-btn" id="${P}-open-paper">Open the practice paper</button></p>` });

// ---------------------------------------------------------------- the plenary drill: this lesson only
const card = (id, category, prompt, answers, distractors, noteText, working, example, extra = {}) =>
  Object.assign({ id, category, prompt, answers, distractors, note: noteText, working, pickThenType: true }, example ? { example } : {}, extra);
const TAB = 'Instruction set: 0001 LOAD, 0010 ADD, 0011 SUB.';
const cards = [
  card('s-01', 'set', 'What is an instruction set?', ['A list of all the commands that can be processed by a CPU'], ['A list of the addresses in memory', 'The registers inside the CPU', 'The binary code for one instruction'],
    'From Cambridge IGCSE 0478/12, June 2024, Question 5(b): a list of (machine code) commands that can be processed by the CPU.', ['It is a list.', 'A list of what? What can the CPU do with them?'], null,
    { keywords: [/^(?=.*\b(list|set|all)\b)(?=.*\b(commands?|instructions?|operations?)\b).*$/i] }),
  card('s-02', 'set', 'A program asks a CPU to carry out a command that is not in its instruction set.\nWhat happens?', ['It cannot process it'], ['It processes it more slowly', 'It adds the command to its list', 'It runs it on another core'],
    'A CPU can only process the commands in its instruction set.', ['Which commands has the CPU got circuits for?', 'Is this command one of them?'], null,
    { keywords: [/\b(cannot|can't|can not|unable|won't|will not|doesn't|does not|error|stops?|fails?|crash(es)?)\b|\bnot (be )?(processed|run|carried|executed|work)/i] }),
  card('s-03', 'set', 'Which part of the CPU uses the instruction set to decode an instruction?', ['The control unit (CU)'], ['The ALU', 'The ACC', 'The MAR'],
    'The CU decodes each instruction using the instruction set.', ['It is the part that is in charge.', 'Decode: work out what to do.'], null,
    { keywords: [/\b(control unit|cu)\b/i] }),
  card('s-04', 'set', 'The CPU has a list of all the machine code commands it can process.\nState the name of this list of commands.', ['Instruction set'], ['Character set', 'Machine code', 'Opcode'],
    'From Cambridge IGCSE 0478/12, November 2023, Question 3(c): instruction set.', ['It is a set of something.', 'A set of what the CPU can carry out.'], null,
    { keywords: [/^\s*(an?\s+|the\s+)?instruction\s*sets?\s*\.?\s*$/i] }),
  card('m-01', 'mc', 'What is machine code?', ['Instructions in binary that the CPU can process'], ['Instructions in English that people can read', 'The address of the next instruction', 'A list of addresses in memory'],
    'Machine code is instructions in binary, using the codes in the instruction set.', ['Memory can only store one kind of thing.', '0s and 1s.'], null,
    { keywords: [/\b(binary|0s? and 1s?|ones and zeros|zeros and ones|bits?)\b/i] }),
  card('m-02', 'mc', 'Why is a program stored in memory as machine code?', ['Memory and the CPU can only store and process binary'], ['Binary takes up less space than English', 'It hides the program from users', 'The clock counts in binary'],
    'Memory can only store 0s and 1s, so every instruction must be binary.', ['What can memory store?', 'Can it store a word like LOAD?'], null,
    { keywords: [/^(?=.*\b(only|just)\b)(?=.*\b(binary|0s?|1s?|bits?|zeros|ones)\b).*$/i] }),
  card('m-03', 'mc', TAB + '\nGive the machine code for LOAD 5.', ['0001 0101'], ['0101 0001', '0001 0001', '0010 0101'],
    'LOAD is 0001. 5 in 4-bit binary is 0101 (4 + 1). So 0001 0101.', ['Opcode first, from the table.', 'Then the address as 4 bits: 8 4 2 1.'],
    'A similar question: ADD 3.\nFirst: ADD is 0010 in the table.\nThen: 3 in 4 bits is 0011 (2 + 1).\nSo ADD 3 is 0010 0011.\nNow yours: the opcode for LOAD, then the address in 4 bits.',
    { keywords: [/^\s*0001\s*0101\s*\.?\s*$/], format: 'Type 8 bits' }),
  card('m-04', 'mc', 'In the instruction 0001 0110, what is the first part, 0001, called?', ['The opcode'], ['The operand', 'The address', 'The instruction set'],
    'The opcode says which command to carry out.', ['It says which command.', 'Op... for operation.'], null,
    { keywords: [/^\s*(the\s+|an?\s+)?op\s*-?\s*codes?\s*\.?\s*$/i] }),
  card('m-05', 'mc', 'What does the operand of an instruction give the CPU?', ['The data or address to use'], ['Which command to carry out', 'The speed of the clock', 'The list of commands'],
    'The operand says what to use: an address or a value.', ['The opcode says which command.', 'The other part says what to use.'], null,
    { keywords: [/\b(data|address|value|number|location)\b/i] }),
  card('d-01', 'decode', TAB + '\nDecode 0010 1001. Type it as a command and a number.', ['ADD 9'], ['ADD 2', 'LOAD 9', 'SUB 9'],
    'Opcode 0010 is ADD. Operand 1001 is 8 + 1 = 9. So ADD 9.', ['Split it: 4 bits and 4 bits.', 'Look up the first part. Convert the second.'],
    'A similar question: 0011 0101.\nFirst: split it into 0011 and 0101.\nThen: 0011 is SUB in the table.\nThen: 0101 is 4 + 1 = 5.\nSo it is SUB 5.\nNow yours: split, look up, convert.',
    { keywords: [/^\s*add\s*9\s*\.?\s*$/i], format: 'Type a command and a number' }),
  card('d-02', 'decode', TAB + '\nAddress 6 holds 12. Address 7 holds 30. The ACC holds 12.\nThe CPU runs 0010 0111. What does the ACC hold now?', ['42'], ['30', '12', '19'],
    '0010 0111 is ADD 7: add the value at address 7 (30) to the ACC. 12 + 30 = 42.', ['Decode it first: which command, which address?', 'What is at that address?'],
    'A similar question: the ACC holds 5. Address 9 holds 8. Run 0010 1001.\nFirst: 0010 is ADD, 1001 is 9.\nThen: add the value at address 9 to the ACC: 5 + 8 = 13.\nNow yours: decode, find the value, then add.',
    { keywords: [/^\s*42\s*\.?\s*$/], format: 'Type a number' }),
  card('d-03', 'decode', 'Describe one thing that happens at the decode stage.', ['The instruction is separated into opcode and operand', 'The CU decodes it using an instruction set'], ['The ALU adds two numbers', 'The PC is incremented', 'The address is sent to the MAR'],
    'From Cambridge IGCSE 0478/11, November 2024, Question 5(b): separated into opcode and operand; the CU decodes it using an instruction set.', ['Which two parts is it split into?', 'What does the CU use?'], null,
    { keywords: [/\b(op\s*codes?|operands?|instruction sets?|split|separat)/i] }),
  card('d-04', 'decode', 'Why does the CU need the instruction set to decode an instruction?', ['It tells the CU which command each opcode means'], ['It tells the CU where the next instruction is', 'It makes the clock run faster', 'It stores the result of a calculation'],
    'The instruction is only 0s and 1s. The instruction set says which command each opcode means.', ['The instruction is only 0s and 1s.', 'How does the CU know what 0010 means?'], null,
    { keywords: [/^(?=.*\b(commands?|opcodes?|op codes?|means?|meaning|what to do)\b)(?!.*\b(where|clock|result)\b).*$/i] }),
  card('t-01', 'types', 'CPU A and CPU B have different instruction sets.\nCan a machine code program made for CPU A run correctly on CPU B?', ['No'], ['Yes', 'Only if CPU B is faster'],
    'CPU B decodes with its own instruction set, so the same opcodes mean different commands, or nothing.', ['Who decides what each opcode means?', 'Are the two lists the same?'], null,
    { keywords: [/^\s*no\b/i] }),
  card('t-02', 'types', 'Why may a machine code program made for one CPU type not run on another CPU type?', ['They have different instruction sets, so the same opcode can mean a different command'], ['The other CPU has a slower clock', 'The other CPU has less cache', 'The program is too long'],
    'Different instruction sets: the same opcode means a different command, or is not in the list.', ['What does each CPU use to decode?', 'Is it the same for both?'], null,
    { keywords: [/\binstruction\s*sets?\b|\bopcodes?\b|\bdifferent (commands?|meanings?|codes?)\b/i] }),
  card('t-03', 'types', 'For CPU A, 0001 is LOAD. For CPU B, 0001 is OUTPUT.\nThe instruction 0001 0110 runs on CPU B. Which command does CPU B carry out?', ['OUTPUT'], ['LOAD', 'ADD', 'None'],
    'CPU B looks up 0001 in its own instruction set: OUTPUT.', ['Whose instruction set does CPU B use?', 'Find 0001 in that list.'], null,
    { keywords: [/^\s*(it\s+)?outputs?\b(?!.*\bload)/i] }),
  card('t-04', 'types', 'Two computers have CPUs with the same instruction set.\nCan the same machine code program run on both?', ['Yes'], ['No', 'Only on the faster one'],
    'The same instruction set: every opcode means the same command on both.', ['What does each CPU use to decode?', 'Are the two lists the same here?'], null,
    { keywords: [/^\s*yes\b/i] }),
];
const drill = { title: 'Year 10, 3.1.6: Instruction Sets', subtitle: 'Cambridge IGCSE Computer Science 0478',
  categories: [['set', 'The instruction set'], ['mc', 'Machine code, opcode and operand'], ['decode', 'Decoding'], ['types', 'Different CPU types']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 2 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
  if (c.example) c.answers.forEach((a) => assert(!c.example.toLowerCase().includes(a.toLowerCase()), `card ${c.id}: example holds its answer`));
  assert(drill.categories.some(([k]) => k === c.category), `card ${c.id} category`);
  (c.keywords || []).forEach((k) => {
    c.answers.forEach((a) => assert(k.test(a), `card ${c.id}: keywords reject its answer "${a}"`));
    c.distractors.forEach((d) => assert(!k.test(d), `card ${c.id}: keywords accept distractor "${d}"`));
  });
});
assert(cards.length >= 15 && cards.length <= 20, 'drill size ' + cards.length);
const kk = (id) => cards.find((c) => c.id === id).keywords[0];
['ADD 9', 'add 9', 'ADD9'].forEach((s) => assert(kk('d-01').test(s), 'd-01 rejects ' + s));
['ADD 2', 'ADD 19', 'LOAD 9'].forEach((s) => assert(!kk('d-01').test(s), 'd-01 accepts ' + s));
['0001 0101', '00010101'].forEach((s) => assert(kk('m-03').test(s), 'm-03 rejects ' + s));
['opcode', 'the opcode', 'op code', 'Op-code'].forEach((s) => assert(kk('m-04').test(s), 'm-04 rejects ' + s));
['operand', 'opcode and operand'].forEach((s) => assert(!kk('m-04').test(s), 'm-04 accepts ' + s));
['output', 'OUTPUT', 'it outputs'].forEach((s) => assert(kk('t-03').test(s), 't-03 rejects ' + s));
const drillJson = JSON.stringify(drill, (k, v) => v instanceof RegExp ? '__RE__' + v.toString() + '__RE__' : v, 1)
  .replace(/"__RE__(.*?)__RE__"/g, (m, r) => JSON.parse('"' + r + '"'));
const drillSrc = `// Year 10, 3.1.6: Instruction Sets. Plenary: the instruction set, machine code, decoding, different CPU types.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y10_3_1_l6.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${drillJson});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now-2', 0, ['clock', 'Clock', 'the clock', 'system clock'], ['clock speed', 'CU', 'control unit', 'cache']);
ok('do-now-2', 1, ['MDR', 'mdr', 'the MDR', 'memory data register', 'Memory Data Register (MDR)'], ['MAR', 'memory address register', 'RAM', 'data register']);
ok('exam-name', 0, ['instruction set', 'an instruction set', 'Instruction Set', 'the instruction set'], ['instructions', 'set', 'character set', 'machine code']);
NOTES.forEach((n) => assert(n.q && n.model, 'note shape'));
// Walkthroughs never hold their slide's answers.
WT_DN1.steps.forEach((s) => assert(!/address|next instruction|to be fetched|written to/i.test(s.text + s.visual), 'WT_DN1 gives an answer: ' + s.text));
WT_DN2.steps.forEach((s) => assert(!/\bclock\b|\bMDR\b|memory data register/i.test(s.text + s.visual), 'WT_DN2 gives an answer: ' + s.text));
// What a student sees: no dashes; no term before the slide that teaches it.
const seen = (s) => JSON.stringify(Object.assign({}, s, { walkthrough: s.walkthrough, validatorKey: undefined, items: (s.items || []).map((it) => Object.assign({}, it, { scheme: undefined, guidance: undefined, context: undefined })) }));
const all = JSON.stringify(steps) + drillSrc;
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/\bmario|\bdecimal\b|assembly|mnemonic|low-level|high-level|translat|compiler|interpreter/i.test(steps.map(seen).join('') + drillSrc), 'term outside this lesson');
const firstTaught = { 'instruction set': 'why-list', 'machine code': 'why-binary', opcode: 'anim-binary', operand: 'anim-binary' };
const skip = new Set(['do-now', 'do-now-2', 'do-now-ext', 'title']);
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(0, idx).filter((s) => !skip.has(s.id)).forEach((s) => assert(!new RegExp('\\b' + term, 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
['do-now', 'do-now-2', 'do-now-ext', 'title'].forEach((id) => assert(!/machine code|opcode|operand/i.test(seen(steps.find((s) => s.id === id))), id + ' uses a term from this lesson'));
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => s.items.forEach((it) => {
  assert(it.correct >= 0 && it.correct < it.options.length && it.explain, s.id + ' item shape');
  assert(!it.prompt.toLowerCase().includes(it.options[it.correct].toLowerCase()), s.id + ': prompt holds its answer: ' + it.prompt);
}));
Object.keys(ANIMS).forEach((id) => { const i = steps.findIndex((s) => s.id === id); assert(steps[i + 1].type === 'self-marked-response' && steps[i + 1].items.every((it) => it.aiModel === 'haiku' && it.scheme.length >= it.marks), `${id} is followed by a Haiku explain slide`); });
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
// The numbers: LOAD 6 = 0001 0110, ADD 7 = 0010 0111, 12 + 30 = 42; 1001 = 9; 0101 = 5.
assert(parseInt('0110', 2) === 6 && parseInt('0111', 2) === 7 && parseInt('1001', 2) === 9 && parseInt('0101', 2) === 5 && 12 + 30 === 42, 'numbers');

const lesson = { id: ID, label: '3.1.6: Instruction Sets', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after y10-3-1-l5 in the 3.1 unit
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
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, ${cards.length} drill cards`);
