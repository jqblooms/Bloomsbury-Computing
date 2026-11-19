// Builds LessonData/y10-3-1-l7.json: Year 10, 3.1.7: Embedded Systems (Notes and Data Bridge).
//   node tools/build_y10_3_1_l7.mjs
// Plan: Week by week plan, tab "Year 10", lesson 3.1.7 "Embedded Systems": describe the purpose and characteristics of
// embedded systems and tell them apart from general purpose computers; identify examples (domestic appliances, cars,
// security systems, lighting systems, vending machines). The last teaching lesson before 3.1.R, the Computer
// Architecture Checkpoint. The Y10 Term 1b unit plan: "An embedded system performs a dedicated function; a general
// purpose computer performs many", "identify embedded systems in appliances, cars and vending machines".
// Shape copied from tools/build_y10_3_1_l6b.mjs, with the Do Now of tools/build_y11_2_1_gates.mjs:
//   Do Now 1: 0478/12 November 2023 Q3(c): name of the list of commands, mark scheme "instruction set" (3.1.6)
//   Do Now 2: 0478/11 November 2024 Q5(b): the decode stage [3] (3.1.4 and 3.1.6), self-marked against the scheme
//   each with a Walk me through it on a similar question (never the answer), then the Extension reusing the 3.1.6
//   plenary drill y10-3-1-l6.
// Then about 20 minutes of note-taking with NO interactive activities, a Your Notes slide after each idea, then Data
// Bridge (pages BridgeBuilder/, registry bridge-builder, set y10-embedded-systems, shell ExamGameSetY10Embedded.gs).
// About 20 minutes of notes:
//   title 1, what 1.5, notes-what 1.5, general 1.5, notes-general 1.5, features 1.5, notes-features 1.5,
//   benefits 1.5, notes-benefits 1.5, examples 1.5, notes-examples 1.5, exam 1.5, notes-exam 1.5, notes-ready 0.5
// Then: Data Bridge: Use Your Notes, Play: Data Bridge.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l7';
const PREV = 'y10-3-1-l6b';
const P = 'y10-317';
const SET = 'y10-embedded-systems';
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const two = (a, b, cols = '1fr 1fr') => `<div style="display:grid;grid-template-columns:${cols};gap:16px;align-items:start">${a}${b}</div>`;
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
const keyBox = (term, text) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:8px 14px;margin:10px 0 0;font-size:20px"><b>${term}</b> ${text}</div>`;
const why = (text) => `<p style="margin:10px 0 0;font-size:20px"><b>WHY?</b> ${text}</p>`;
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const card = (title, inner, colour = 'var(--line)') => `<div style="border:2px solid ${colour};border-radius:10px;padding:8px 12px;font-size:19px"><b style="font-size:20px">${title}</b>${inner}</div>`;
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, heading, lead, parts, whyQ, extra) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    const lab = parts.length > 1 ? `(${s}) ${p.label}` : p.label;
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${lab} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const cardHtml = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label: heading, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + tps(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + (extra ? columns(extra, cardHtml) : cardHtml) };
}
function written(id, label, lead, items, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + tps(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + extra + `<div id="${cid}"></div>`, items };
}
const GAME = '<strong>You will use these notes in Data Bridge.</strong>';
const NOTES = [];
// A Your Notes slide: exactly what to write, shown in full.
function noteSlide(id, label, notes) {
  const boxes = notes.map(([head, text]) => {
    NOTES.push({ head, text });
    return `<div style="border-left:6px solid var(--brand);background:var(--surface-2);border-radius:8px;padding:6px 14px;margin:7px 0;font-size:20px"><b>${head}</b><br>${text}</div>`;
  }).join('');
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the pen icon at the top). Write the heading and the notes below. ' + GAME) + boxes };
}
const steps = [];
const WRITE_DO = '<strong>What to do:</strong> type your answer, then press <strong>Check my answer</strong> or <strong>Submit answer</strong>.';

// ---------------------------------------------------------------- Do Now 1: 0478/12 November 2023 Q3(c) (3.1.6)
// Mark scheme: Instruction set.
const WT_DN1 = { title: 'Walk me through it: name the term', steps: [
  { text: '<strong>A similar question.</strong> "The CPU has a register that stores the address of the next instruction to be fetched. State the name of this register."', visual: note('read the description, find its key words') },
  { text: 'Find the ' + kw('key words') + ': "stores the address" and "next instruction".', visual: line('key words: ' + kw('address of the next instruction')) },
  { text: 'Which part of the CPU holds the address of the next instruction? The ' + kw('program counter (PC)') + '.', visual: line('Answer to the similar question: ' + kw('program counter')) },
  { text: 'Now your question. Find the key words: a ' + kw('list') + ' of all the ' + kw('commands') + ' a CPU can process. What is that list called? You met it in 3.1.6.', visual: note('key words, then the name') },
] };
steps.push(checkStep('do-now', 'Do Now: Name the List (1 of 2)',
  'Recap of 3.1.6. ' + cite('0478/12, November 2023, Question 3(c)') + ' A user\'s computer has a central processing unit (CPU). The CPU has a list of all the machine code commands it can process. State the name of this list of commands. <strong>What to do:</strong> type your answer, then press Check answers.',
  [{ label: 'Name of the list', answer: '^\\s*(the\\s+|an?\\s+)?instruction\\s*sets?\\s*\\.?\\s*$', feedback: 'Every type of CPU has its own one. The CU uses it to decode each instruction.' }],
  ['Why does every type of CPU need a list like this?', 'Ideas: the CPU has circuits for only some commands, so it must know which ones it can process.']));
steps[0].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/11 November 2024 Q5(b) (3.1.4, 3.1.6)
// Mark scheme, any three: CIR/CU receives the instruction from the MDR; ... using the data bus; instruction is separated
// into opcode and operand; control unit decodes the instruction; ... using an instruction set.
const WT_DN2 = { title: 'Walk me through it: describe a stage of the cycle', steps: [
  { text: '<strong>A similar question.</strong> "Describe what happens at the execute stage of the cycle." It is worth 3 marks, so give 3 points.', visual: note('3 marks: 3 points, in order') },
  { text: 'Point 1: which part ' + kw('starts') + ' the stage? The CU ' + kw('sends a signal') + ' to the ALU.', visual: line('1. CU sends a signal to the ' + kw('ALU')) },
  { text: 'Point 2: what does that part ' + kw('do') + '? The ALU ' + kw('performs the calculation') + '.', visual: line('2. ALU performs the ' + kw('calculation')) },
  { text: 'Point 3: where does the result ' + kw('go') + '? It is stored in the ' + kw('ACC') + '.', visual: line('3. result stored in the ' + kw('ACC')) },
  { text: 'Now your question, the decode stage. Use the same plan: where does the instruction come from and go to? Which part decodes it, and what does it use? What two parts is it split into?', visual: note('from where, to where &nbsp; which part &nbsp; using what &nbsp; split into what') },
] };
steps.push(written('do-now-2', 'Do Now: The Decode Stage (2 of 2)',
  'Recap of 3.1.4 and 3.1.6. ' + cite('0478/11, November 2024, Question 5(b)') + ' ' + WRITE_DO, [
    { id: 'decode-stage', prompt: '(b) A central processing unit (CPU) performs the fetch-decode-execute (FDE) cycle. Describe what happens at the decode stage of the cycle.', marks: 3,
      scheme: ['CIR/CU receives the instruction from the MDR // Instruction sent from MDR to CIR/CU', '... using the data bus', 'Instruction is separated into opcode and operand', 'Control unit decodes the instruction', '... using an instruction set'],
      guidance: 'Any three from the points, one mark each. A point marked ... follows on from the point before it.',
      modelAnswer: 'It is split into opcode and operand. The CU decodes it using an instruction set.' },
  ], ['Why does the decode stage come before the execute stage?', 'Ideas: the CPU must know what the instruction means before it can carry it out.']));
steps[1].walkthrough = WT_DN2;
// The walkthroughs never show the Do Now answers.
{
  const txt = (w) => JSON.stringify(w).replace(/<[^>]*>/g, ' ');
  assert(!/instruction\s*set/i.test(txt(WT_DN1)), 'walkthrough 1 shows the answer');
  assert(!/instruction\s*set|opcode|operand|MDR|CIR|data bus/i.test(txt(WT_DN2)), 'walkthrough 2 shows a marking point');
  const R = (p) => new RegExp(p.source, p.flags);
  const v1 = validators[`${P}_do_now`.replace(/-/g, '_')][0].pattern;
  assert(R(v1).test('instruction set') && R(v1).test('The Instruction Set.') && R(v1).test('instruction sets') && !R(v1).test('machine code') && !R(v1).test('character set'), 'Do Now 1 validator');
}
steps.push({ id: 'do-now-ext', label: 'Extension: Do Now Challenge', type: 'embedded-app', appId: 'drill-y10-3-1-l6', embedContainerId: `${P}-do-now-ext`,
  content: '<h2 class="lesson-h2">Extension: Do Now Challenge</h2>' +
    tps('Why does each card use new instructions?', 'Then you practise the method, not one answer.') +
    '<p class="lesson-lead"><strong>Extension:</strong> finished the Do Now? Try these instruction set cards from 3.1.6. Stuck? Switch on <strong>I need help</strong>. Go to the next slide when you are ready.</p>' +
    `<div id="${P}-do-now-ext"></div>` });

// ---------------------------------------------------------------- title (1 min)
steps.push({ id: 'title', label: 'Embedded Systems',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">Embedded Systems</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> about 20 minutes of notes. Then use your notes in <strong>Data Bridge</strong>.',
      'The big question: <strong>why</strong> do so many machines have a small computer inside them?']) +
    tps('A washing machine and a laptop both have a computer inside. Why can you play a game on the laptop, but not on the washing machine?', 'Collect ideas. Today shows how the two computers are made for different jobs.') });

// ---------------------------------------------------------------- idea 1: what an embedded system is (1.5 + 1.5)
steps.push({ id: 'what', label: 'What Is an Embedded System?',
  content: '<h2 class="lesson-h2">What Is an Embedded System?</h2>' +
    two(facts(['A washing machine has a small computer inside it.', 'The computer has one job: to <strong>control the wash</strong>.',
      'It reads the buttons, fills the drum with water, turns the drum and drains the water.', 'It never does any other job.']),
      card('Inside the washing machine', facts(['buttons and a small screen', 'a small computer', 'a motor, a water pump, a heater'])), '1.3fr 1fr') +
    keyBox('Embedded system:', 'a computer system built into a larger device to perform a dedicated function.') +
    keyBox('Dedicated function:', 'one job, or a few jobs, that the device is made for. It does not change.') +
    why('The machine only ever needs to do one job, so its computer is made for that one job.') });
steps.push(noteSlide('notes-what', 'Your Notes: What Is an Embedded System?', [
  ['Embedded system', 'A computer system built into a larger device to perform a dedicated function.'],
  ['Dedicated function', 'One job, or a few jobs, that the device is made for. It does not change.'],
  ['Example', 'A washing machine. Its embedded system controls the wash and does nothing else.']]));

// ---------------------------------------------------------------- idea 2: general purpose computers (1.5 + 1.5)
const rowsGE = [['Jobs', 'many different tasks', 'one dedicated function'], ['Software', 'new software can easily be installed', 'cannot easily be reprogrammed'],
  ['Extra devices', 'peripherals can be plugged in, such as a printer or a mouse', 'no peripherals can be plugged in'], ['Processor', 'a CPU', 'a microprocessor'], ['Where', 'a computer on its own', 'built into a larger device']];
const cmpTable = (rows) => `<table style="border-collapse:collapse;font-size:18px;width:100%"><tr><th style="text-align:left;padding:3px 8px;border-bottom:2px solid var(--line-strong)"></th>` +
  `<th style="text-align:left;padding:3px 8px;border-bottom:2px solid var(--line-strong)">Laptop</th><th style="text-align:left;padding:3px 8px;border-bottom:2px solid var(--line-strong)">Washing machine</th></tr>` +
  rows.map((r) => `<tr><td style="padding:3px 8px;border-bottom:1px solid var(--line)"><b>${r[0]}</b></td><td style="padding:3px 8px;border-bottom:1px solid var(--line)">${r[1]}</td><td style="padding:3px 8px;border-bottom:1px solid var(--line)">${r[2]}</td></tr>`).join('') + '</table>';
steps.push({ id: 'general', label: 'General Purpose or Embedded?',
  content: '<h2 class="lesson-h2">General Purpose or Embedded?</h2>' + cmpTable(rowsGE) +
    keyBox('General purpose computer:', 'a computer that can perform many different tasks, such as a laptop or a PC.') +
    keyBox('Peripheral:', 'an extra device plugged into a computer, such as a printer or a mouse.') +
    why('The user of a laptop decides its job. The maker of a washing machine decides its job.') });
steps.push(noteSlide('notes-general', 'Your Notes: General Purpose or Embedded?', [
  ['General purpose computer', 'A computer that can perform many different tasks, such as a laptop or a PC.'],
  ['How it is different', 'New software can easily be installed. Peripherals, such as a printer, can be plugged in. It has a CPU.'],
  ['WHY they are different', 'The user of a general purpose computer decides its job. The maker of an embedded system decides its job.']]));

// ---------------------------------------------------------------- idea 3: the features (1.5 + 1.5)
const FEATURES = [['Dedicated function', 'It does one job.', 'The device only needs one job.'],
  ['Dedicated hardware', 'It only has the parts its job needs.', 'Extra parts would cost money and use power.'],
  ['Microprocessor', 'A CPU on one small chip.', 'One chip is small and cheap.'],
  ['Built into a larger device', 'It is inside the machine it controls.', 'It must be next to the parts it controls.'],
  ['Cannot easily be reprogrammed', 'The user cannot change its program.', 'Its job never needs to change.']];
steps.push({ id: 'features', label: 'Five Features of an Embedded System',
  content: '<h2 class="lesson-h2">Five Features of an Embedded System</h2>' +
    `<table style="border-collapse:collapse;font-size:18px;width:100%"><tr>${['Feature', 'What it means', 'WHY?'].map((h) => `<th style="text-align:left;padding:3px 8px;border-bottom:2px solid var(--line-strong)">${h}</th>`).join('')}</tr>` +
    FEATURES.map((f) => `<tr><td style="padding:4px 8px;border-bottom:1px solid var(--line)"><b>${f[0]}</b></td><td style="padding:4px 8px;border-bottom:1px solid var(--line)">${f[1]}</td><td style="padding:4px 8px;border-bottom:1px solid var(--line)">${f[2]}</td></tr>`).join('') + '</table>' +
    keyBox('Dedicated hardware:', 'only the hardware that is needed for the dedicated function.') +
    why('Every feature comes from one idea: the system only ever does <strong>one job</strong>.') });
steps.push(noteSlide('notes-features', 'Your Notes: Five Features', [
  ['Five features of an embedded system', '1. Dedicated function. 2. Dedicated hardware. 3. A microprocessor. 4. Built into a larger device. 5. Cannot easily be reprogrammed.'],
  ['Dedicated hardware', 'Only the hardware that is needed for the dedicated function.'],
  ['WHY it has these features', 'It only ever does one job, so it only needs the parts and the program for that job.']]));

// ---------------------------------------------------------------- idea 4: why use one (1.5 + 1.5)
steps.push({ id: 'benefits', label: 'Why Use an Embedded System?',
  content: '<h2 class="lesson-h2">Why Use an Embedded System?</h2>' +
    two(card('A freezer with a laptop inside', facts(['big, so it takes up space', 'costs a lot', 'uses a lot of power, all day and all night', 'a person must start the program'])),
      card('A freezer with an embedded system', facts(['<strong>small</strong>: it fits inside the freezer', '<strong>cheap</strong> to make', 'uses <strong>little power</strong>', 'works <strong>automatically</strong>, with no person'])) +
      '', '1fr 1fr') +
    why('It only has the hardware for one job. Fewer parts make it small, cheap and low power.') +
    tps('A freezer runs every minute of every day for years. Why does low power matter so much for it?', 'Collect ideas: think about the electricity it uses over a whole year.') });
steps.push(noteSlide('notes-benefits', 'Your Notes: Why Use an Embedded System?', [
  ['Benefits of an embedded system', 'Small. Cheap to make. Uses little power. Works automatically, with no person.'],
  ['WHY it has these benefits', 'It only has the hardware for one job, so it has fewer parts.']]));

// ---------------------------------------------------------------- idea 5: examples (1.5 + 1.5)
steps.push({ id: 'examples', label: 'Embedded or Not?',
  content: '<h2 class="lesson-h2">Embedded or Not?</h2>' +
    two(card('Embedded systems', facts(['<b>Domestic appliances</b> (machines in a home): washing machine, freezer, microwave oven', '<b>Cars</b>: the brakes, the air bags', '<b>Security systems</b>: a burglar alarm, a security light',
      '<b>Lighting systems</b>: street lights, traffic lights', '<b>Vending machines</b>'])),
      card('General purpose computers', facts(['laptop', 'personal computer (PC)', 'tablet', 'smartphone: new apps can be installed', 'web server: runs many different programs']))) +
    keyBox('Test:', 'Does it do <strong>one job</strong>, chosen by its <strong>maker</strong>? Then it is an embedded system.') +
    why('A smartphone is small, but you can install new apps, so it can do many different tasks. Small alone does not make it embedded.') });
steps.push(noteSlide('notes-examples', 'Your Notes: Embedded or Not?', [
  ['Examples of embedded systems', 'Domestic appliances (washing machine, freezer, microwave oven), cars, security systems, lighting systems, vending machines.'],
  ['NOT embedded systems', 'Laptop, PC, tablet, smartphone, web server.'],
  ['WHY a smartphone is not embedded', 'New apps can be installed, so it can perform many different tasks.']]));

// ---------------------------------------------------------------- idea 6: exam answers (1.5 + 1.5)
steps.push({ id: 'exam', label: 'Exam Answers: Why Is It Embedded?',
  content: '<h2 class="lesson-h2">Exam Answers: Why Is It Embedded?</h2>' +
    facts(['The exam asks: <em>"The microwave oven is an example of an embedded system. Explain why it is an embedded system."</em> [2]', '2 marks: write <strong>2 features</strong>, about this device.']) +
    two(card('Earns the marks', facts(['It has a dedicated function: heating food.', 'It has a microprocessor.']), 'var(--brand)'),
      card('Earns nothing', facts(['It is a computer.', 'It is a machine in a home.'])), '1.3fr 1fr') +
    facts(['Asked why something is <strong>not</strong> embedded? Turn the features round: <em>It can perform many different tasks. New software can easily be installed.</em>']) +
    why('A mark is for a feature that only an embedded system has. Every computer is a computer.') });
steps.push(noteSlide('notes-exam', 'Your Notes: Exam Answers', [
  ['Explain why it is embedded (2 marks)', 'Write 2 features, about the device. Example: It has a dedicated function: heating food. It has a microprocessor.'],
  ['Explain why it is NOT embedded', 'It can perform many different tasks. New software can easily be installed.'],
  ['WHY "it is a computer" earns nothing', 'Every computer is a computer. A mark needs a feature that only an embedded system has.']]));

// ---------------------------------------------------------------- notes ready (0.5), then Data Bridge
steps.push({ id: 'notes-ready', label: 'Your Notes: Ready for Data Bridge',
  content: '<h2 class="lesson-h2">Your Notes: Ready for Data Bridge</h2>' +
    todo('open your notes (the pen icon at the top). You should have these six headings. Missing one? Go back to its slide and write it. ' + GAME) +
    facts(['<strong>What Is an Embedded System?</strong>: what it is, and what a dedicated function is.',
      '<strong>General Purpose or Embedded?</strong>: what a general purpose computer is, and WHY they are different.',
      '<strong>Five Features</strong>: the five features, and WHY it has them.',
      '<strong>Why Use an Embedded System?</strong>: the benefits, and WHY.',
      '<strong>Embedded or Not?</strong>: examples, and WHY a smartphone is not embedded.',
      '<strong>Exam Answers</strong>: how to explain why a device is, or is not, embedded.']) });
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
    '<li><strong>Answer the questions</strong> to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' + tps('Why keep your notes open while you play?', 'The questions use the same ideas. Your notes help you answer them right the first time.') + `<div id="${P}-game"></div>`,
  embedQuery: `set=${SET}&goal=3` });

// ---------------------------------------------------------------- self-checks
const seen = (s) => JSON.stringify([s.label, s.content, s.items, s.walkthrough]).replace(/<[^>]*>/g, ' ');
const all = JSON.stringify({ steps, validators });
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'emoji found');
assert(!/\bdecimal\b|mario|firmware|real-time|robot/i.test(all), 'term outside this lesson');
// Only the Do Now asks for answers. The notes part has nothing to answer; only the game is embedded after the title.
const firstNote = steps.findIndex((s) => s.id === 'title');
steps.forEach((s, i) => {
  if (i < firstNote) { assert(s.id.startsWith('do-now'), s.id + ' before the title'); return; }
  assert(!s.type || s.type === 'embedded-app', s.id + ' is an activity type: ' + s.type);
  if (s.type === 'embedded-app') assert(s.id === 'game', s.id + ' embeds ' + s.appId);
  assert(!/<input|<textarea|lesson-note-reveal|Check my|predict/i.test(s.content), s.id + ' asks for an answer');
});
assert(steps.slice(0, 3).map((s) => s.id).join() === 'do-now,do-now-2,do-now-ext' && steps[0].walkthrough && steps[1].walkthrough, 'Do Now, walkthroughs, Extension');
assert(steps[2].content.includes('<strong>Extension:</strong>') && steps[2].appId === 'drill-y10-3-1-l6', 'Extension');
// No term before the slide that teaches it (the title excepted).
const firstTaught = { embedded: 'what', 'dedicated function': 'what', 'general purpose': 'general', peripheral: 'general', 'dedicated hardware': 'features', 'domestic appliance': 'examples' };
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(0, idx).filter((s) => s.id !== 'title').forEach((s) => assert(!new RegExp('\\b' + term, 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
assert(!/dedicated|general purpose|peripheral/i.test(seen(steps[firstNote])), 'title uses a term from this lesson');
// After each idea, a Your Notes slide that says the notes are for Data Bridge.
const noteIds = steps.filter((s) => s.id.startsWith('notes-')).map((s) => s.id);
assert(noteIds.join() === 'notes-what,notes-general,notes-features,notes-benefits,notes-examples,notes-exam,notes-ready', 'notes slides ' + noteIds);
noteIds.forEach((id) => assert(steps.find((s) => s.id === id).content.includes('You will use these notes in Data Bridge.'), id + ' game line'));
assert(NOTES.length === 17 && NOTES.every((n) => n.head && n.text), 'notes ' + NOTES.length);
assert(FEATURES.length === 5, 'five features');
// The game: Data Bridge with this lesson's set; the how-to slide has three lines.
const game = steps.at(-1);
assert(game.appId === 'bridge-builder' && game.embedQuery === `set=${SET}&goal=3` && steps.at(-2).id === 'how-to-play', 'game slides');
assert((steps.at(-2).content.match(/<li>/g) || []).length === 3, 'three lines on how to play');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
// About 20 minutes of notes.
const MINUTES = { title: 1, what: 1.5, 'notes-what': 1.5, general: 1.5, 'notes-general': 1.5, features: 1.5, 'notes-features': 1.5,
  benefits: 1.5, 'notes-benefits': 1.5, examples: 1.5, 'notes-examples': 1.5, exam: 1.5, 'notes-exam': 1.5, 'notes-ready': 0.5 };
const total = Object.values(MINUTES).reduce((a, b) => a + b, 0);
assert(steps.slice(firstNote, -2).every((s) => MINUTES[s.id]) && Object.keys(MINUTES).length === steps.length - firstNote - 2 && total >= 18 && total <= 22, 'timing ' + total);

const lesson = { id: ID, label: '3.1.7: Embedded Systems', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: straight after y10-3-1-l6b in the 3.1 unit
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
console.log(`${ID}: ${steps.length} steps, ${NOTES.length} notes, about ${total} minutes of notes`);
