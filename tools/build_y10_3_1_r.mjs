// Builds the Unit 3.1 review as two 55-minute lessons, before the Unit 3.1 exam paper (y10-unit3-1-exam):
//   LessonData/y10-3-1-r.json   3.1.R Exam Practice 1: The CPU and the FDE Cycle (CPU and Von Neumann, ALU, CU,
//                               PC/MAR/MDR/CIR/ACC, address/data/control buses, fetch-decode-execute)
//   LessonData/y10-3-1-r2.json  3.1.R Exam Practice 2: Performance, Instruction Sets and Embedded Systems (cores, cache,
//                               clock speed; instruction sets; embedded systems and general purpose computers)
// It also writes the two plenary drills (y10-3-1-r, y10-3-1-r2) and registers both lessons in a "3.1.R" unit after 3.1.
//   node tools/build_y10_3_1_r.mjs
// Shape copied from tools/build_y10_2_r.mjs: Do Now of real exam questions, each with a Walk me through it, an Extension,
// a teacher-only Think, Pair, Share under every heading, real Paper 1 questions grouped by subtopic and cited in the lead,
// Fix the Answer slides with a realistic weak answer, every written part self-marked with its mark scheme for AI
// marking, two hands-on CPU Lab activities (predict first, levels rising), a plenary drill of real exam questions
// (3 right in a row), then Data Bridge: Use Your Notes and Play: Data Bridge.
// Lesson 1 plays the y10-cpu Exam Game set (shell ExamGameSetY10Cpu.gs); Lesson 2 plays y10-instruction-sets.
// None of the exam paper's parts is used here: the list is kept by the exam builder, and EXAM_PARTS below fails the build
// if one appears. 0478/12 March 2025 Q3(d) is left off: the exam repeats it from the y10-3-1-r2 drill (every real
// instruction set part is used somewhere).
// Lesson 1 Do Now: 0478/11 November 2022 Q2(b), 0478/13 November 2023 Q3(d), 0478/11 June 2022 Q2(a)(i); then
// 0478/11 June 2026 Q2(a)(i) and 0478/13 June 2024 Q8(b)(i). Extension: drill-y10-3-1-l3 (3.1.3 plenary).
// Lesson 2 Do Now: 0478/13 November 2023 Q3(c), 0478/13 November 2025 Q2(c)(i); then 0478/12 June 2024 Q5(b) and
// 0478/11 November 2024 Q6(a) (stem adapted: "uses assembly language" removed, assembly language is not taught yet).
// Extension: drill-y10-3-1-l4 (3.1.4 plenary).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L1 = { id: 'y10-3-1-r', P: 'y10-31r', label: '3.1.R Exam Practice 1: The CPU and the FDE Cycle', steps: [], validators: {} };
const L2 = { id: 'y10-3-1-r2', P: 'y10-31r2', label: '3.1.R Exam Practice 2: Performance, Instruction Sets and Embedded Systems', steps: [], validators: {} };
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
const mins = (n) => `<strong>${n} minutes.</strong> `;

function checkStep(id, label, heading, lead, parts, whyQ) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const one = (p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  };
  const inputs = parts.map(one).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + card };
}
// A written exam part: the model answer is the shortest answer that earns the marks; the real mark scheme is in scheme.
function written(id, prompt, marks, model, rule, points, source) {
  return { id, prompt, marks, modelAnswer: model, scheme: points, source, rule };
}
const plainText = (h) => h.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&ldquo;|&rdquo;/g, '"').replace(/&rarr;/g, '->').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function selfMarked(id, label, heading, lead, items, whyQ) {
  items.forEach((it) => { it.context = plainText(lead) + ' Question: ' + plainText(it.prompt) + ` Marking rule: ${it.rule}, one mark for each point met, up to ${it.marks}.`; delete it.rule; });
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>`, items };
}
function fixStep(id, label, ref, question, marks, weak, got, part, whyQ) {
  const item = written(part.id, `A student wrote: <em>&ldquo;${weak}&rdquo;</em><br>This answer gets ${got} mark${got === 1 ? '' : 's'}. Write a better answer that gets ${marks} marks.`, marks, part.model, part.rule, part.points, part.source);
  const lead = mins(4) + cite(ref) + ' ' + question;
  item.ariaLabel = question.replace(/^.*\. (?=[A-Z][^.]*[.?]$)/, '') + ' (better answer)';
  const step = selfMarked(id, label, label, lead, [item], whyQ);
  item.context = plainText(lead) + ` A student wrote: "${weak}" This got ${got} of ${marks} marks: ${part.why} The student now writes a better answer. Marking rule: ${part.rule}, one mark for each point met, up to ${marks}.`;
  return step;
}
function embed(id, label, appId, heading, lead, whyQ, query) {
  const s = { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
  if (query) s.embedQuery = query;
  return s;
}
function bridgeSteps(set, topic) {
  steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
    content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
      why('Why answer from your notes, and not from memory alone?', 'Checking your notes while you answer fixes a gap before it costs you marks in the exam.') +
      '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
      '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
      `<li><strong>Answer the exam questions</strong> on ${topic} to earn coins, then build a bridge to get the truck across.</li>` +
      '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
  steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
    content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' + why('Why keep your notes open while you play?', 'The questions use the same ideas. Your notes help you answer them right the first time.') +
      `<p class="lesson-lead">${mins(3)}Earn coins with real exam questions, then build. Play until the end of the lesson.</p><div id="${P}-game"></div>`,
    embedQuery: `set=${set}&goal=3` });
}

// ---------------------------------------------------------------- "Walk me through it" pictures
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const stmt = (t) => `<div style="margin:6px 0;padding:8px 12px;border-radius:8px;background:var(--surface-3)">${t}</div>`;
const row3 = (a, b, c) => `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${stmt(a)}${stmt(b)}${stmt(c)}</div>`;

const WT_PARTS = { title: 'Walk me through it: stages, parts and storage', steps: [
  { text: '<strong>A similar question.</strong> A washing machine has three stages: wash, rinse and spin. One stage is spin. Identify one other stage.', visual: row3('wash', 'rinse', kw('spin')) },
  { text: 'The question gives one stage. Any one of the other two earns the mark. Never give back the stage the question names.', visual: note('given: spin &rarr; answer: wash or rinse') },
  { text: 'Your part (a): the CPU cycle has three stages, in order. The last one is given. Name one of the two that come before it.', visual: row3('?', '?', kw('execute')) },
  { text: '<strong>A similar question.</strong> Which part of the CPU sends signals to manage the cycle? Ask: which part is in charge?', visual: stmt('in charge, sends signals: the control unit') },
  { text: 'Your part (b): ask a different question. Which part does the working out: adding, comparing, true or false?', visual: note('the part that calculates') },
  { text: 'Your part (c): primary storage has two kinds. One keeps the start-up instructions and cannot be changed. The other holds the programs and data in use now. Which one does the CPU take each instruction from?', visual: stmt('read only memory: start-up instructions') + stmt('?: programs and data in use now') },
] };

const WT_REGS = { title: 'Walk me through it: the first register and a register', steps: [
  { text: 'The cycle starts with fetch. Before the CPU can fetch, it must know <strong>where</strong> the next instruction is in RAM.', visual: note('a place in RAM is called an address') },
  { text: 'So the first register holds an address: the address of the next instruction.', visual: stmt('RAM address 4: LOAD 7') + stmt('RAM address 5: ADD 8') },
  { text: 'Your part (a): which register keeps the address of the next instruction, and adds 1 after each fetch? Its name says that it counts.', visual: note('it counts through the program') },
  { text: '<strong>A similar question.</strong> State the purpose of a bus. Say what it does, with what.', visual: stmt('A bus ' + kw('carries') + ' values between components.') },
  { text: 'A register is a different kind of part. It is a tiny store inside the CPU, very close to the ALU and the CU.', visual: note('inside the CPU, next to the parts that use it') },
  { text: 'Your part (b): what does a register hold? And for how long: for ever, or only while the CPU works on it?', visual: note('what it holds + for how long') },
] };

const WT_PERF = { title: 'Walk me through it: the beat', steps: [
  { text: '<strong>A similar idea.</strong> A band plays to a beat. One player keeps the beat, and everyone plays one note on each beat.', visual: stmt('beat, beat, beat: one note each') },
  { text: 'A faster beat means more notes in each minute. Everyone plays faster, but each note is the same.', visual: stmt('slow beat: 60 notes a minute') + stmt('fast beat: 120 notes a minute') },
  { text: 'The CPU works the same way. One component sends out a regular pulse. On each pulse, one FDE cycle is done.', visual: stmt('pulse, pulse, pulse: one FDE cycle each') },
  { text: 'More pulses each second means more FDE cycles each second.', visual: note('pulses per second = cycles per second') },
  { text: 'Your question asks for a component, not a speed. So give the name of a part of the computer.', visual: note('a name, not a number') },
  { text: 'Your question: which component sends out those pulses? It sets how many cycles happen in one second.', visual: note('the one that keeps the beat') },
] };
const WT_CACHE = { title: 'Walk me through it: test each statement', steps: [
  { text: '<strong>A similar question.</strong> Which statement describes the purpose of a register? A: it stores data for many years. B: it stores data temporarily, inside the CPU.', visual: stmt('A: for many years?') + stmt('B: temporarily, inside the CPU?') },
  { text: 'Test each statement against what you know. A register loses its value when the power goes off, so A is wrong. B fits.', visual: stmt('A: ' + kw('no')) + stmt('B: ' + kw('yes')) },
  { text: 'Watch for a statement that describes a different part. Ask: is this the job of this part, or of another part?', visual: note('the right job, for the right part') },
  { text: 'Cache is a small store very close to the CPU. Getting a value from it is faster than going out to RAM.', visual: stmt('CPU &harr; cache: fast') + stmt('CPU &harr; RAM: slower') },
  { text: 'Cross out each statement that is wrong, and say why in a few words. The one left must be fully true.', visual: note('cross out, then check the one left') },
  { text: 'Your question: test all four statements the same way. Which one says why cache makes the CPU faster than going to RAM each time?', visual: note('test A, B, C and D one at a time') },
] };

const WT_ISA = { title: 'Walk me through it: instruction sets and embedded systems', steps: [
  { text: '<strong>A similar question.</strong> State what is meant by a character set.', visual: stmt('character set: ?') },
  { text: 'Say what kind of thing it is, then what is in it, then who uses it.', visual: stmt('a list ... of all the characters ... a computer can represent') },
  { text: 'Your part (a): use the same pattern. It is a list. A list of what? Which part of the computer can carry them out?', visual: note('a list + of what + by what') },
  { text: '<strong>A similar question.</strong> State what is meant by a general purpose computer.', visual: stmt('general purpose computer: ?') },
  { text: 'Say what kind of thing it is, and what makes it different: it can perform many different tasks, such as a laptop.', visual: stmt('a computer ... that can perform ' + kw('many different tasks')) },
  { text: 'Your part (b): an embedded system is the other kind. How many tasks does it do? Where is it found: on a desk, or inside a machine?', visual: note('how many tasks + where it is') },
] };

// ================================================================ Lesson 1
use(L1);
// 0478/11 November 2022 Q2(b): fetch // decode. 0478/13 November 2023 Q3(d): ALU. 0478/11 June 2022 Q2(a)(i): RAM.
const RE_STAGE = '^\\s*(the\\s+)?(fetch|fetching|decode|decoding)(\\s+stage)?\\s*\\.?\\s*$';
const RE_ALU = '^\\s*(the\\s+|an?\\s+)?(alu|arithmetic\\s+(and\\s+)?logic(al)?\\s+unit)(\\s*\\(\\s*alu\\s*\\))?\\s*\\.?\\s*$';
const RE_RAM = '^\\s*(the\\s+)?(ram|random[\\s-]+access\\s+memory)(\\s*\\(\\s*ram\\s*\\))?\\s*\\.?\\s*$';
steps.push(checkStep('do-now', 'Do Now: The CPU (1 of 2)', 'Do Now: The CPU (1 of 2)',
  'Part (a): ' + cite('0478/11, November 2022, Question 2(b)') + ' Part (b): ' + cite('0478/13, November 2023, Question 3(d)') + ' Part (c): ' + cite('0478/11, June 2022, Question 2(a)(i)'), [
    { label: 'The CPU performs a cycle that has three stages. One of these stages is execute. Identify one other stage of the cycle that is performed by the CPU.', answer: RE_STAGE, feedback: 'Execute is the last stage. Name one of the two stages that come before it.' },
    { label: 'The CPU has a component that carries out all calculations and logical operations. State the name of this component.', answer: RE_ALU, feedback: 'Which part of the CPU does the working out? Give its full name or its letters.' },
    { label: 'Data is fetched from primary storage into the CPU to be processed. State the name of the primary storage from where data is fetched.', answer: RE_RAM, feedback: 'Which primary storage holds the programs and data in use now?' },
  ], ['Why does an exam question give you one stage and ask for another?', 'It checks that you know the whole cycle. Giving back the stage it named earns nothing.']));
steps[steps.length - 1].walkthrough = WT_PARTS;

// 0478/11 June 2026 Q2(a)(i): program counter // PC; memory address register // MAR (first answer marked).
// 0478/13 June 2024 Q8(b)(i), any one: to temporarily store data/instruction/address; to allow immediate access to data
// during the FDE cycle.
const RE_FIRST = '^\\s*(the\\s+)?(pc|program\\s+counter|mar|memory\\s+address\\s+register)(\\s*\\(\\s*(pc|mar)\\s*\\))?\\s*\\.?\\s*$';
const RE_REG = '^(?=.*\\b(stor\\w*|hold\\w*|keep\\w*)\\b)(?=.*\\b(data|instructions?|address\\w*|values?)\\b)(?=.*\\b(temporar\\w*|short|brief\\w*|while|during)\\b).*$|\\bimmediate(ly)?\\s+access\\w*\\b';
steps.push(checkStep('do-now-2', 'Do Now: Registers (2 of 2)', 'Do Now: Registers (2 of 2)',
  'Part (a): ' + cite('0478/11, June 2026, Question 2(a)(i)') + ' A smartphone has a quad-core 2.4 GHz processor. The processor performs the fetch-decode-execute (FDE) cycle. Part (b): ' + cite('0478/13, June 2024, Question 8(b)(i)') + ' The CPU contains registers.', [
    { line: true, label: 'The first register used in the FDE cycle stores the location in random access memory (RAM) of the next instruction. Identify the name of this register.', answer: RE_FIRST, feedback: 'Which register keeps the address of the next instruction?' },
    { line: true, label: 'State the purpose of a register.', answer: RE_REG, feedback: 'Say what a register holds, and for how long.' },
  ], ['Why does a "State the purpose" question want what a part is for, not where it is?', 'The mark is for its job. Saying where a part is, or what it looks like, does not show what it does.']));
steps[steps.length - 1].walkthrough = WT_REGS;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-3-1-l3', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on the CPU, its registers and the buses. Stuck? Switch on <strong>I need help</strong>.',
  ['Why practise questions from earlier lessons in a review lesson?', 'Coming back to a topic after a gap helps you remember it for longer. The exam mixes topics too.']));

steps.push({ id: 'title', label: 'The CPU and the FDE Cycle Exam Practice',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Review: Exam Practice 1</p><h2 class="lesson-h2">The CPU and the FDE Cycle</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> real exam questions on the parts of the CPU, the registers, the buses and the FDE cycle.',
      '<strong>Also:</strong> a practice paper, and fix answers that lose marks.']) +
    why('An exam question has 3 marks. Why is one long sentence about one idea not enough?', 'Each mark is for a different point. One idea, said in many ways, still gets one mark.') });
steps.push({ id: 'recap', label: 'Key Facts: The CPU',
  content: '<h2 class="lesson-h2">Key Facts: The CPU</h2>' + facts(["<strong>CPU:</strong> processes instructions and data.","<strong>ALU:</strong> does calculations and logic. <strong>CU:</strong> decodes instructions and sends signals.","<strong>PC:</strong> holds the address of the next instruction.","<strong>MAR:</strong> holds the address to read or write. <strong>MDR:</strong> holds the data or instruction read or to write.","<strong>CIR:</strong> holds the instruction being decoded and executed. <strong>ACC:</strong> holds the result of a calculation.","<strong>Address bus:</strong> carries addresses, one way. <strong>Data bus:</strong> carries data, both ways. <strong>Control bus:</strong> carries signals, both ways.","<strong>Fetch:</strong> PC to MAR, PC goes up by 1, the instruction goes to the MDR, then to the CIR. <strong>Decode:</strong> the CU decodes it. <strong>Execute:</strong> it is carried out."]) +
    why('Which of these facts do you find hardest to remember?', 'Everyone has a different answer. Copy that fact into your notes now.') });

// ---------------------------------------------------------------- The CPU and its parts
// 0478/11 November 2022 Q2(c): one from ALU; any two from: to temporarily store data; it stores the result of interim
// calculations.
steps.push(selfMarked('exam-acc', 'The CPU: The Accumulator', 'The CPU: The Accumulator',
  mins(4) + cite('0478/11, November 2022, Question 2(c)') + ' Phil has a computer that is designed using the Von Neumann model. The computer has a central processing unit (CPU).', [
    written('acc', 'Identify the component within the CPU that the accumulator is built into and describe the purpose of the accumulator.', 3,
      'It is built into the ALU. It temporarily stores data. It stores the results of calculations.', 'One mark for the component (ALU), then any two from',
      ['the component: arithmetic logic unit / ALU', 'to temporarily store data', 'it stores the result of interim calculations'], '0478/11 November 2022 Q2(c)'),
  ], ['This question asks two things. Why plan where each mark will come from?', 'One mark is for naming the part and two are for the purpose. A plan stops you writing three points about only one of them.']));

// 0478/12 March 2021 Q8(a): instructions and data stored in the same / main memory; instructions fetched and executed in
// order / one after another / in sequence.
steps.push(fixStep('fix-stored', 'Von Neumann: Fix the Answer', '0478/12, March 2021, Question 8(a)',
  'The Von Neumann model, for a computer system, uses the stored program concept. Describe what is meant by the stored program concept.', 2,
  'The program is stored on the computer so it can be used again later.', 0, {
    id: 'fix-stored-program', model: 'Instructions and data are stored in the same memory. Instructions are fetched and executed in order.', rule: 'One mark each',
    points: ['instructions and data stored in the same / main memory', 'instructions fetched and executed in order / one after another / in sequence'],
    source: '0478/12 March 2021 Q8(a)', why: 'it does not say where the instructions and data are kept, or how the instructions are run.' },
  ['Why can an answer that sounds right still get 0 marks?', 'It may only say the question again in other words. A mark needs a fact the question did not already give.']));

if (false) steps.push(embed('activity-1', 'Activity 1: Watch the Registers', 'cpu-lab', 'Activity 1: Watch the Registers',
  mins(7) + 'Predict what each register will hold, then check, then run the CPU one step at a time to see why. Clear the levels to finish.',
  ['Why predict before you run the CPU?', 'A prediction shows what you really think. When the run is different, you find the exact step you had wrong.'], 'activity=regs&level=2&upto=3'));

// ---------------------------------------------------------------- Registers and buses
// 0478/13 June 2023 Q2(c)(ii): one mark for the bus, two for the matching description.
steps.push(selfMarked('exam-bus', 'Buses: One Bus and Its Purpose', 'Buses: One Bus and Its Purpose',
  mins(4) + cite('0478/13, June 2023, Question 2(c)(ii)') + ' A library has a self-checkout system that allows customers to register books that they want to borrow. The self-checkout system has a central processing unit (CPU). The CPU contains registers and buses.', [
    written('bus', 'Identify one bus that can be found in the CPU and explain its purpose in the fetch-decode-execute cycle.', 3,
      'Data bus. It carries data between components in the CPU.', 'One mark for the bus, two marks for the matching description',
      ['address bus / data bus / control bus (one mark for the name)', 'address bus: transmits / carries addresses ... between components in the CPU', 'data bus: transmits / carries data ... between components in the CPU', 'control bus: transmits control signals ... from the control unit to other components in the CPU'],
      '0478/13 June 2023 Q2(c)(ii)'),
  ], ['Why must the purpose match the bus you named?', 'Each bus carries one kind of value. A purpose that belongs to a different bus earns nothing.']));

// 0478/12 June 2026 Q2(c), three from: the MAR stores the address ...; ... for the value that is to be fetched; the MDR
// stores the value // data is sent / copied to the MDR.
steps.push(fixStep('fix-mar-mdr', 'Registers: Fix the Answer', '0478/12, June 2026, Question 2(c)',
  'A computer has a central processing unit (CPU). A value is fetched from random access memory (RAM) to the CPU. Explain how the MAR and MDR are used in this process.', 3,
  'The MDR holds the address of the value, and the MAR holds the value when it arrives from RAM.', 0, {
    id: 'fix-mar-mdr-use', model: 'The MAR holds the address of the value to be fetched. The value is copied into the MDR.', rule: 'Three from',
    points: ['the MAR stores / holds the address / location // the address is sent / copied to the MAR ...', '... for the value / data that is to be fetched / in RAM', 'the MDR stores / holds the value / data // the data is sent / copied to the MDR'],
    source: '0478/12 June 2026 Q2(c)', why: 'the two registers are swapped: the MAR holds the address and the MDR holds the value.' },
  ['Two registers have names that look alike. How can you remember which holds what?', 'Read the middle word of each name. It says what kind of value that register holds.']));

if (false) steps.push(embed('activity-2', 'Activity 2: Trace the Buses', 'cpu-lab', 'Activity 2: Trace the Buses',
  mins(6) + 'Trace a read and a write: for each bus, pick what it carries and which way it goes. Then do it with no help.',
  ['Why trace a write as well as a read?', 'The data goes the other way in a write. Tracing both shows you know what each bus does, not just one pattern.'], 'activity=buses&level=3&upto=4'));

// ---------------------------------------------------------------- The FDE cycle
// 0478/12 March 2021 Q8(b)(i): holds the address ... of next / current instruction.
steps.push(selfMarked('exam-pc', 'The FDE Cycle: The Program Counter', 'The FDE Cycle: The Program Counter',
  mins(3) + cite('0478/12, March 2021, Question 8(b)(i)') + ' The fetch-execute cycle of a Von Neumann model, for a computer system, uses registers and buses.', [
    written('pc', 'Describe the role of the Program Counter.', 2, 'It holds the address of the next instruction.', 'One mark each',
      ['holds the address ...', '... of next / current instruction'], '0478/12 March 2021 Q8(b)(i)'),
  ], ['A register holds one value. Why does the exam want you to say which value?', 'Every register holds a value. Saying which one shows what makes this register different.']));

// (a) 0478/11 November 2023 Q1(c): control unit. (b) 0478/11 June 2026 Q2(a)(iii), one from: ALU; ACC; CU; a bus; MDR;
// MAR; PC; RAM (not CIR, not "register" alone). (c) 0478/13 November 2025 Q2(b)(ii): current instruction register // CIR.
const RE_CU = '^\\s*(the\\s+)?(cu|control\\s+unit)(\\s*\\(\\s*cu\\s*\\))?\\s*\\.?\\s*$';
const RE_EXEC = '^\\s*(the\\s+|an?\\s+)?(alu|arithmetic\\s+(and\\s+)?logic(al)?\\s+unit|acc|accumulator|cu|control\\s+unit|mdr|memory\\s+data\\s+register|mar|memory\\s+address\\s+register|pc|program\\s+counter|ram|random[\\s-]+access\\s+memory|(data|address|control)\\s+bus)(\\s*\\(\\s*[a-z]+\\s*\\))?\\s*\\.?\\s*$';
const RE_CIR = '^\\s*(the\\s+)?(cir|ir|(current\\s+)?instruction\\s+register)(\\s*\\(\\s*c?ir\\s*\\))?\\s*\\.?\\s*$';
steps.push(checkStep('practice', 'Practice: Quick Exam Questions', 'Practice: Quick Exam Questions',
  mins(3) + 'Part (a): ' + cite('0478/11, November 2023, Question 1(c)') + ' Part (b): ' + cite('0478/11, June 2026, Question 2(a)(iii)') + ' Part (c): ' + cite('0478/13, November 2025, Question 2(b)(ii)') + ' The CPU has a control unit (CU).', [
    { label: 'A component in the CPU sends signals to manage the fetch-decode-execute cycle. State the name of this component.', answer: RE_CU, feedback: 'Which part of the CPU is in charge, and tells the other parts what to do?' },
    { label: 'Give the name of one component that is used in the execute stage of the FDE cycle.', answer: RE_EXEC, feedback: 'Name one part that does work when an instruction is carried out. Give its full name or its letters.' },
    { label: 'Give the name of the register that is part of the CU.', answer: RE_CIR, feedback: 'The CU decodes instructions. Which register holds the instruction while it is decoded?' },
  ], ['Why give the full name of a component, not a word such as "register" or "unit"?', 'Many parts share those words. Only the full name, or its letters, tells the examiner which part you mean.']));

steps.push(embed('plenary', 'Plenary: The CPU and FDE Cycle Exam Drill', 'drill-y10-3-1-r', 'Plenary: The CPU and FDE Cycle Exam Drill',
  mins(5) + 'Real exam questions on the CPU, the registers, the buses and the FDE cycle. Get each one right three times in a row. Your progress is saved.',
  ['Why do questions keep coming back until you get them right three times in a row?', 'Getting it right once can be luck. Three times in a row shows that you really know it.']));
steps.push({ id: 'paper', label: 'Practice Paper: The Fetch-Decode-Execute Cycle', type: 'app-link', appId: 'exampaper', appQuery: 'paper=y10-3-1-l4-paper', buttonId: `${P}-open-paper`,
  content: '<h2 class="lesson-h2">Practice Paper: The Fetch-Decode-Execute Cycle</h2>' + why('Why do a whole paper, and not only single questions?', 'In the exam you must choose what to write with no help. A paper shows which marks you still lose.') +
    `<p class="lesson-lead">${mins(12)}Open the practice paper. Use your notes. Answer every question, then press Submit paper. You get all your marks at once.</p>` +
    `<p><button type="button" class="donow-btn" id="${P}-open-paper">Open the practice paper</button></p>` });
bridgeSteps('y10-cpu', 'the CPU and the FDE cycle');

// ================================================================ Lesson 2
use(L2);
// 0478/13 November 2023 Q3(c): clock. 0478/13 November 2025 Q2(c)(i): C.
const RE_CLOCK = '^\\s*(the\\s+|a\\s+)?(system\\s+|cpu\\s+)?clock\\s*\\.?\\s*$';
const RE_CACHE_C = '^\\s*(c\\s*[.:)-]?\\s*)?(it\\s+)?stores?\\s+frequently\\s+used\\s+instructions\\s*\\.?\\s*$|^\\s*c\\s*\\.?\\s*$';
steps.push(checkStep('do-now', 'Do Now: The Clock (1 of 3)', 'Do Now: The Clock (1 of 3)',
  cite('0478/13, November 2023, Question 3(c)') + ' A computer has a central processing unit (CPU).', [
    { line: true, label: 'The CPU has a component that regulates the number of fetch-decode-execute cycles the CPU can perform in a second. State the name of this component.', answer: RE_CLOCK, feedback: 'Which component sends out a regular pulse, one cycle on each pulse?' },
  ], ['Why does "State the name of this component" want a name, and not a description?', 'State asks for a short answer. The name alone earns the mark, so a long description wastes time.']));
steps[steps.length - 1].walkthrough = WT_PERF;
steps.push(checkStep('do-now-cache', 'Do Now: Cache (2 of 3)', 'Do Now: Cache (2 of 3)',
  cite('0478/13, November 2025, Question 2(c)(i)') + ' The computer has primary storage. One example of primary storage is cache.', [
    { label: 'Tick one box to show the correct statement that describes the purpose of cache. Type A, B, C or D.<span style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px;margin-top:4px;font-weight:400">' +
      ['A It stores important instructions.', 'B It stores the next instruction to be processed.', 'C It stores frequently used instructions.', 'D It stores instructions so they are not lost when the power is turned off.'].map((o) => `<span>${o}</span>`).join('') + '</span>', answer: RE_CACHE_C, feedback: 'Test each statement. Why is it faster to have some instructions close to the CPU?' },
  ], ['Why test every option in a multiple choice question, not just pick the first one that sounds right?', 'Several options can sound right. Testing each one against what you know finds the one that is fully true.']));
steps[steps.length - 1].walkthrough = WT_CACHE;

// 0478/12 June 2024 Q5(b): a list of (machine code) commands that can be processed by the CPU.
// 0478/11 November 2024 Q6(a), any one: computer system designed to perform a dedicated/single function; contains a
// microprocessor / dedicated hardware; built into a larger system. The paper's stem says "A computer programmer uses
// assembly language to create a computer program for an embedded system"; assembly language is not taught yet (4.2),
// so the stem here says "A computer program is created for an embedded system".
const RE_ISA = '^(?=.*\\b(list|set|collection|group|all)\\b)(?=.*\\b(commands?|instructions?|operations?|opcodes?)\\b)(?=.*\\b(cpu|processor|process\\w*|execut\\w*|run|carr\\w*\\s+out|understand\\w*|decod\\w*)\\b).*$';
const RE_EMB = '^(?!.*\\b(many|multiple|lots\\s+of|several|different)\\s+(functions?|tasks?|jobs?|things)\\b)(?:.*\\b(dedicated|single|specific|one|limited|particular|special)\\s+(function|task|job|purpose)s?\\b|.*\\bmicroprocessors?\\b|.*\\bdedicated\\s+hardware\\b|(?=.*\\b(built\\s+in(to)?|inside|within|part\\s+of)\\b)(?=.*\\b(larger|bigger|another|machine|device|appliance)\\b)).*$';
steps.push(checkStep('do-now-3', 'Do Now: Instruction Sets and Embedded Systems (3 of 3)', 'Do Now: Instruction Sets and Embedded Systems (3 of 3)',
  'Part (a): ' + cite('0478/12, June 2024, Question 5(b)') + ' Instructions are processed by a central processing unit (CPU) in a computer. Part (b): ' + cite('0478/11, November 2024, Question 6(a)') + ' A computer program is created for an embedded system in a washing machine.', [
    { line: true, label: 'The CPU uses an instruction set to decode the instruction. State what is meant by an instruction set.', answer: RE_ISA, feedback: 'Say what kind of thing it is, what is in it, and which part can carry them out.' },
    { line: true, label: 'State what is meant by an embedded system.', answer: RE_EMB, feedback: 'How many tasks does it do, and where is it found?' },
  ], ['Why does a "State what is meant by" question want a kind of thing first?', 'Saying what kind of thing it is, then what makes it different, gives the examiner a full meaning in one line.']));
steps[steps.length - 1].walkthrough = WT_ISA;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-3-1-l4', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on the fetch-decode-execute cycle. Stuck? Switch on <strong>I need help</strong>.',
  ['Why practise the FDE cycle again before a lesson on performance?', 'Clock speed, cache and cores all change how fast the FDE cycle runs. You need the cycle first.']));

steps.push({ id: 'title', label: 'Performance, Instruction Sets and Embedded Systems Exam Practice',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Review: Exam Practice 2</p><h2 class="lesson-h2">Performance, Instruction Sets and Embedded Systems</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> real exam questions on CPU performance, instruction sets and embedded systems.',
      '<strong>Also:</strong> a practice paper, and fix answers that lose marks.']) +
    why('An "Explain" question has 2 marks. Why should your answer use "so" or "because"?', 'Explain wants a point and its result. "So" or "because" joins the two marks together.') });
steps.push({ id: 'recap', label: 'Key Facts: Performance, Instruction Sets, Embedded Systems',
  content: '<h2 class="lesson-h2">Key Facts: Performance, Instruction Sets, Embedded Systems</h2>' + facts(["<strong>Clock speed:</strong> the number of FDE cycles per second. Higher means more instructions each second.","<strong>Cores:</strong> each core can process instructions at the same time as the others.","<strong>Cache:</strong> small, fast memory in the CPU for data and instructions used often.","<strong>Instruction set:</strong> the list of all the commands a CPU can process.","<strong>Embedded system:</strong> a computer system built into a larger device to do a dedicated function.","<strong>Embedded features:</strong> dedicated hardware, a microprocessor, firmware, cannot easily be reprogrammed.","<strong>General purpose computer:</strong> can do many different tasks, such as a laptop."]) +
    why('Which of these facts do you find hardest to remember?', 'Everyone has a different answer. Copy that fact into your notes now.') });

// ---------------------------------------------------------------- Performance
// 0478/11 June 2025 Q5(c). Three from.
steps.push(selfMarked('exam-clock', 'Performance: Clock Speed', 'Performance: Clock Speed',
  mins(4) + cite('0478/11, June 2025, Question 5(c)') + ' Data is processed by the central processing unit (CPU) in a computer that has a Von Neumann architecture.', [
    written('clock', 'Explain how the clock speed can affect the performance of a CPU.', 3,
      'The clock speed is the number of FDE cycles performed per second. If it is increased, more FDE cycles are performed each second, so performance improves.', 'Three from',
      ['on each clock pulse, an FDE cycle is performed', 'the clock speed is the number of FDE cycles performed in a second // the number of times the clock pulses per second', 'if clock speed is increased more FDE cycles can be performed in a second // if it is decreased fewer FDE cycles can be performed in a second', 'if clock speed is increased, it can improve the performance of the CPU // if it is decreased, it decreases the performance'],
      '0478/11 June 2025 Q5(c)'),
  ], ['Why is "it makes the computer faster" not enough for 3 marks?', 'It is one general idea. The marks need the steps: what the clock speed is, what changes, and the effect.']));

if (false) steps.push(embed('activity-1', 'Activity 1: CPU Race', 'cpu-lab', 'Activity 1: CPU Race',
  mins(7) + 'Two CPUs run the same task. Predict which finishes first, or work out each time, then check. Some tasks cannot be split, and some data does not fit the cache.',
  ['Why can the CPU with more cores still lose a race?', 'Extra cores only help when the task can be split between them. The task decides which upgrade matters.'], 'activity=perf&level=3&upto=4'));

// 0478/12 March 2024 Q2(b)(ii), any two; Q2(b)(iii), any two.
steps.push(selfMarked('exam-cores', 'Performance: Cores', 'Performance: Cores',
  mins(3) + cite('0478/12, March 2024, Question 2(b)(ii)') + ' The computer has a single core 3.5 GHz processor and an 8 kB cache.', [
    written('cores', 'The CPU is changed to a dual-core 3.5 GHz processor. Explain how the number of cores affects the performance of a CPU.', 2,
      'More cores mean more instructions are executed each second, because each core runs an FDE cycle at the same time.', 'Any two from',
      ['more cores increases / improves the performance', 'more cores mean more FDE cycles / instructions are executed each second', '... because each core runs an FE cycle / instruction simultaneously'], '0478/12 March 2024 Q2(b)(ii)'),
  ], ['Why read what changed in the question before you answer?', 'The answer must be about the part that changed. A reason about a different part earns nothing.']));
steps.push(selfMarked('exam-cache', 'Performance: Cache', 'Performance: Cache',
  mins(3) + cite('0478/12, March 2024, Question 2(b)(iii)') + ' The computer has a single core 3.5 GHz processor and an 8 kB cache.', [
    written('cache', 'The amount of cache is increased to 64 kB. Explain how the amount of cache affects the performance of a computer.', 2,
      'More cache means more frequently used data can be accessed faster, instead of from the slower RAM.', 'Any two from',
      ['more cache improves performance', '... because more cache means the processor can access more frequently used data / instructions faster', '... instead of having to access the data from the slower-access RAM'], '0478/12 March 2024 Q2(b)(iii)'),
  ], ['Why does the question give the old size and the new size?', 'They show what changed. Your answer must say what that change does, and why.']));

// 0478/11 June 2026 Q2(b), two from.
steps.push(fixStep('fix-quad', 'Performance: Fix the Answer', '0478/11, June 2026, Question 2(b)',
  'A smartphone has a quad-core 2.4 GHz processor. Explain the advantages of the smartphone having a quad-core processor instead of a dual-core processor.', 2,
  'It is faster because it has a higher clock speed.', 0, {
    id: 'fix-quad-core', model: 'It has twice as many cores, so four instructions can be executed simultaneously rather than two.', rule: 'Two from',
    points: ['it can execute more instructions / FDE cycles simultaneously // four instructions can be executed simultaneously rather than two', 'it can execute more instructions / FDE cycles per second', '... as it has double the number of cores // it has more cores // it has 4 cores instead of 2'],
    source: '0478/11 June 2026 Q2(b)', why: 'the clock speed is not different here; the advantage comes from the number of cores.' },
  ['Why read the numbers in the question before you explain a difference?', 'Only what is different can explain the advantage. A value that stays the same cannot be the reason.']));

// ---------------------------------------------------------------- Instruction sets
if (false) steps.push(embed('activity-2', 'Activity 2: Run a Machine Code Program', 'cpu-lab', 'Activity 2: Run a Machine Code Program',
  mins(6) + 'Decode each machine code instruction with the instruction set, then run the program one line at a time. Then try a CPU with a different instruction set.',
  ['Why can a program made for one CPU fail on another CPU?', 'Each CPU decodes with its own instruction set. The same bits can mean a different command on another CPU.'], 'activity=isa&level=3&upto=4'));

// ---------------------------------------------------------------- Embedded systems
// 0478/12 March 2025 Q4(b), any two.
steps.push(selfMarked('exam-atm', 'Embedded Systems: The ATM', 'Embedded Systems: The ATM',
  mins(4) + cite('0478/12, March 2025, Question 4(b)') + ' An automated teller machine (ATM) is a device where a person inserts their bank card and can request to withdraw money. The ATM also allows the person to check how much money they have in their bank account.', [
    written('atm', 'Describe the features of the ATM that identify it as an embedded system.', 2, 'It has a dedicated function. It has a microprocessor.', 'Any two from',
      ['dedicated function // special purpose device // not general purpose device', 'dedicated hardware // by description, for example hardware is only used for ATM functions', 'cannot be (easily) reprogrammed', 'uses firmware', 'contains microprocessor // does not have CPU'], '0478/12 March 2025 Q4(b)'),
  ], ['Why does "it is a computer" earn no mark in a question about embedded systems?', 'Every computer is a computer. A mark needs a feature that only an embedded system has.']));

// 0478/12 November 2024 Q4(e), any two.
steps.push(fixStep('fix-watch', 'Embedded Systems: Fix the Answer', '0478/12, November 2024, Question 4(e)',
  'A student has a smartwatch. The smartwatch only displays the time and text messages. A student incorrectly describes this smartwatch as a general-purpose computer. Explain why the student\'s description is incorrect.', 2,
  'The smartwatch is too small to be a general-purpose computer.', 0, {
    id: 'fix-watch-gp', model: 'The watch can only perform a dedicated function, whereas a general purpose computer performs many functions.', rule: 'Any two from',
    points: ['the watch can only perform a dedicated / limited function', '... and a general purpose computer performs many / multiple functions', '... (this means that) it is an embedded system', 'you cannot plug in peripherals', 'you cannot reprogram the smartwatch // cannot install other software / apps', 'it would only have a microprocessor // it would not have a CPU'],
    source: '0478/12 November 2024 Q4(e)', why: 'size does not decide it; the answer must say how many functions each one can perform.' },
  ['Why is the size of a device not a good reason in this kind of question?', 'Small devices can be general purpose, such as a smartphone. So size alone cannot decide it.']));

steps.push(embed('plenary', 'Plenary: Performance, Instruction Sets and Embedded Systems Exam Drill', 'drill-y10-3-1-r2', 'Plenary: Performance, Instruction Sets and Embedded Systems Exam Drill',
  mins(5) + 'Real exam questions on CPU performance, instruction sets and embedded systems. Get each one right three times in a row. Your progress is saved.',
  ['Why do questions keep coming back until you get them right three times in a row?', 'Getting it right once can be luck. Three times in a row shows that you really know it.']));
steps.push({ id: 'paper', label: 'Practice Paper: CPU Performance', type: 'app-link', appId: 'exampaper', appQuery: 'paper=y10-3-1-l5-paper', buttonId: `${P}-open-paper`,
  content: '<h2 class="lesson-h2">Practice Paper: CPU Performance</h2>' + why('Why do a whole paper, and not only single questions?', 'In the exam you must choose what to write with no help. A paper shows which marks you still lose.') +
    `<p class="lesson-lead">${mins(12)}Open the practice paper. Use your notes. Answer every question, then press Submit paper. You get all your marks at once.</p>` +
    `<p><button type="button" class="donow-btn" id="${P}-open-paper">Open the practice paper</button></p>` });
bridgeSteps('y10-unit3-1-practice', 'every topic in the Unit 3.1 exam');

// ---------------------------------------------------------------- self-checks
const VL = (L, k) => L.validators[`${L.P}_${k}`.replace(/-/g, '_')];
const T = (L, k, i, s) => new RegExp(VL(L, k)[i].pattern.source, 'i').test(s);
const ok = (L, k, i, yes, no) => { yes.forEach((s) => assert(T(L, k, i, s), `${L.id} ${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(L, k, i, s), `${L.id} ${k}[${i}] accepts "${s}"`)); };
ok(L1, 'do-now', 0, ['fetch', 'Decode', 'the fetch stage', 'decoding'], ['execute', 'store', 'fetch and execute']);
ok(L1, 'do-now', 1, ['ALU', 'arithmetic logic unit', 'Arithmetic and logic unit (ALU)', 'the alu'], ['CU', 'control unit', 'accumulator', 'CPU']);
ok(L1, 'do-now', 2, ['RAM', 'random access memory', 'Random Access Memory (RAM)'], ['ROM', 'read only memory', 'cache', 'hard disk']);
ok(L1, 'do-now-2', 0, ['PC', 'program counter', 'MAR', 'Memory address register', 'the program counter (PC)'], ['MDR', 'CIR', 'accumulator', 'counter']);
ok(L1, 'do-now-2', 1, ['to temporarily store data', 'it holds an address for a short time', 'stores instructions temporarily', 'allows immediate access to data'], ['to store data', 'it is part of the CPU', 'it carries data', 'stores data permanently']);
ok(L1, 'practice', 0, ['control unit', 'CU'], ['control bus', 'ALU', 'unit']);
ok(L1, 'practice', 1, ['ALU', 'accumulator', 'control unit', 'data bus', 'MDR'], ['CIR', 'register', 'bus', 'CPU']);
ok(L1, 'practice', 2, ['CIR', 'current instruction register', 'instruction register'], ['MDR', 'PC', 'control unit']);
ok(L2, 'do-now', 0, ['clock', 'the clock', 'system clock'], ['clock speed', 'cache', 'core', 'CU']);
ok(L2, 'do-now-cache', 0, ['C', 'c.', 'C: It stores frequently used instructions'], ['A', 'B', 'D', 'cache']);
ok(L2, 'do-now-3', 0, ['a list of commands that can be processed by the CPU', 'all the instructions a processor can execute', 'the set of machine code commands the CPU understands'], ['a set of instructions', 'it decodes instructions', 'a program']);
ok(L2, 'do-now-3', 1, ['a computer system that performs a dedicated function', 'it has a microprocessor', 'a computer built into a larger device', 'a system that does one task'], ['a computer that does many tasks', 'a computer in a washing machine', 'a small computer']);
// Do Now walkthroughs: no step passes any part on its slide, and none names a Do Now answer.
{
  const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  for (const L of [L1, L2]) L.steps.filter((s) => s.walkthrough).forEach((s) => {
    assert(s.walkthrough.steps.length >= 6, `${s.id} walkthrough length`);
    VL(L, s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => {
      [w.text, w.visual, w.text + ' ' + w.visual].forEach((part) => assert(!new RegExp(v.pattern.source, 'i').test(plain(part)), `${L.id} ${s.id} walkthrough step ${n + 1} passes part ${'abcde'[i]}: ${plain(part)}`));
    }));
  });
  assert(!/\bfetch\b|\bdecode\b|arithmetic|\balu\b|random access|\bram\b(?! address)/i.test(plain(JSON.stringify(WT_PARTS)).replace(/in RAM/g, '')), 'parts walkthrough names an answer');
  assert(!/program counter|\bpc\b|memory address register|\bmar\b|temporar/i.test(plain(JSON.stringify(WT_REGS))), 'registers walkthrough names an answer');
  assert(!/\bclock\b|frequently/i.test(plain(JSON.stringify(WT_PERF))), 'performance walkthrough names an answer');
  assert(!/commands|dedicated|single task|one task|microprocessor/i.test(plain(JSON.stringify(WT_ISA))), 'instruction set walkthrough names an answer');
}
// Every written part carries a mark scheme, a context and a source.
for (const L of [L1, L2]) L.steps.filter((s) => s.type === 'self-marked-response').forEach((s) => s.items.forEach((it) => {
  assert(Array.isArray(it.scheme) && it.scheme.length >= it.marks && it.scheme.length <= 12 && it.id && it.context && !/[<>]/.test(it.context), `${s.id}/${it.id} mark scheme`);
  assert(/^0478\/1[123] /.test(it.source), `${s.id}/${it.id} source`);
}));
// None of the Unit 3.1 exam paper's parts (the exam builder's list) appears in either lesson.
const EXAM_PARTS = ['0478/13, June 2026, Question 4', '0478/13, June 2024, Question 8(a)', '0478/13, June 2022, Question 5(b)(i)', '0478/13, June 2025, Question 3(a)',
  '0478/13, June 2025, Question 3(c)', '0478/11, November 2024, Question 5(a)', '0478/11, November 2024, Question 5(d)', '0478/11, November 2024, Question 5(e)', '0478/11, November 2025, Question 6(a)',
  '0478/13, June 2026, Question 3(c)(ii)', '0478/13, June 2021, Question 9(b)', '0478/13, November 2025, Question 1(e)', '0478/13, November 2025, Question 1(f)',
  '0478/12, November 2023, Question 4(b)', '0478/12, June 2025, Question 4(b)'];
for (const L of [L1, L2]) { const t = JSON.stringify(L.steps); EXAM_PARTS.forEach((r) => assert(!t.includes(r), `${L.id} uses exam part ${r}`)); }

// ---------------------------------------------------------------- drills
const drillHead = (id, about) => `// Year 10, 3.1.R Computer Architecture Exam Practice. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y10_3_1_r.mjs: edit that, then run it.\n`;
const drillFile = (id, about, title, subtitle, categories, fn) => drillHead(id, about) +
  `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${fn.toString()})()\n});\n`;

// ---- Exam Practice 1 plenary: real exam questions on the CPU and the FDE cycle. Each note cites the paper and question.
function plenaryCards() {
  var ALU = /^\s*(the\s+|an?\s+)?(alu|arithmetic\s+(and\s+)?logic(al)?\s+unit)(\s*\(\s*alu\s*\))?\s*\.?\s*$/i;
  return [
    // ================================================= The CPU and its parts
    { id: "pl-01", category: "pl-cpu", prompt: "Identify the component in the CPU that carries out calculations.", answers: ["Arithmetic logic unit (ALU)"],
      keywords: [ALU], distractors: ["Control unit (CU)", "Accumulator (ACC)", "Program counter (PC)"],
      working: ["One part of the CPU is in charge. Another part does the working out.", "Which part's name has the word arithmetic in it?"],
      note: "From 0478/11 November 2021 Q6(b): arithmetic logic unit // ALU." },
    { id: "pl-02", category: "pl-cpu", prompt: "Identify the component within the CPU that the accumulator is built into.", answers: ["Arithmetic logic unit (ALU)"],
      keywords: [ALU], distractors: ["Control unit (CU)", "Random access memory (RAM)", "Current instruction register (CIR)"],
      working: ["The accumulator holds the result of each calculation.", "Which part of the CPU makes those results?"],
      note: "From 0478/11 November 2022 Q2(c): arithmetic logic unit / ALU." },
    { id: "pl-03", category: "pl-cpu", prompt: "A component in the CPU sends signals to manage the fetch-decode-execute cycle. State the name of this component.", answers: ["Control unit (CU)"],
      keywords: [/^\s*(the\s+)?(cu|control\s+unit)(\s*\(\s*cu\s*\))?\s*\.?\s*$/i], distractors: ["Control bus", "Arithmetic logic unit (ALU)", "Clock"],
      working: ["This part is in charge of the other parts.", "It is a unit, not a bus."],
      note: "From 0478/11 November 2023 Q1(c): control unit." },
    { id: "pl-04", category: "pl-cpu", prompt: "Data is fetched from primary storage into the CPU to be processed. State the name of the primary storage from where data is fetched.", answers: ["Random access memory (RAM)"],
      keywords: [/^\s*(the\s+)?(ram|random[\s-]+access\s+memory)(\s*\(\s*ram\s*\))?\s*\.?\s*$/i], distractors: ["Read only memory (ROM)", "Cache", "Hard disk drive"],
      working: ["One kind of primary storage only holds the start-up instructions.", "Which kind holds the programs and data in use now?"],
      note: "From 0478/11 June 2022 Q2(a)(i): random access memory // RAM." },
    { id: "pl-05", category: "pl-cpu", prompt: "The Von Neumann model, for a computer system, uses the stored program concept. Describe what is meant by the stored program concept.", answers: ["Instructions and data are stored in the same memory"],
      keywords: [/^(?=.*\b(instructions?|programs?)\b)(?=.*\bdata\b)(?=.*\b(same|main|together|one)\b).*$|^(?=.*\b(instructions?|programs?)\b)(?=.*\b(order|sequence|one\s+after\s+(an)?other|in\s+turn)\b).*$/i],
      distractors: ["Programs are saved so they can be used later", "Each program has its own memory", "Data is stored in the CPU"],
      working: ["Where are the instructions kept? Where is the data they use kept?", "How are they then run: all at once, or one at a time?"],
      note: "From 0478/12 March 2021 Q8(a): instructions and data stored in the same/main memory; instructions fetched and executed in order / one after another." },
    // ================================================= Registers and buses
    { id: "pl-06", category: "pl-regs", prompt: "Describe the role of the Program Counter.", answers: ["It holds the address of the next instruction"],
      keywords: [/^(?=.*\b(address\w*|location)\b)(?=.*\b(next|current)\b)(?=.*\binstructions?\b).*$/i], distractors: ["It holds the next instruction", "It counts the programs", "It stores the result of a calculation"],
      working: ["The PC does not hold an instruction. It holds where one is.", "Which instruction: the one just done, or the one coming?"],
      note: "From 0478/12 March 2021 Q8(b)(i): holds the address ... of the next / current instruction." },
    { id: "pl-07", category: "pl-regs", prompt: "Describe the role of the MAR in the fetch-decode-execute cycle.", answers: ["It stores the address of the next instruction or data to be fetched"],
      keywords: [/^(?=.*\b(stor\w*|hold\w*|contain\w*|keep\w*)\b)(?=.*\b(address\w*|location)\b)(?=.*\b(next|fetch\w*|written|writ\w*|read|access\w*)\b).*$/i],
      distractors: ["It stores the data fetched from memory", "It decodes the instruction", "It stores the result of a calculation"],
      working: ["Read the middle word of its name.", "Which address: the one about to be read or written?"],
      note: "From 0478/12 November 2023 Q3(b): stores addresses ... of the next instruction/data to be fetched // where data is to be written to." },
    { id: "pl-08", category: "pl-regs", prompt: "Describe the role of the MDR in the fetch-decode-execute cycle.", answers: ["It stores data that has been fetched from memory"],
      keywords: [/^(?!.*\baddress\w*\b)(?=.*\b(stor\w*|hold\w*|contain\w*|keep\w*)\b)(?=.*\b(data|instructions?|values?)\b)(?=.*\b(fetch\w*|memory|ram|written|writ\w*|read)\b).*$/i],
      distractors: ["It stores the address of the data", "It decodes the data", "It sends the data to the clock"],
      working: ["Read the middle word of its name.", "Where has that value come from?"],
      note: "From 0478/11 November 2023 Q1(e)(i): stores data ... that has been fetched / to be written to memory." },
    { id: "pl-09", category: "pl-regs", prompt: "Describe the role of a register in the CPU.", answers: ["It temporarily stores data"],
      keywords: [/^(?=.*\b(stor\w*|hold\w*|keep\w*)\b)(?=.*\b(data|instructions?|address\w*|values?)\b)(?=.*\b(temporar\w*|short|brief\w*)\b).*$/i],
      distractors: ["It stores data permanently", "It carries data between components", "It decodes instructions"],
      working: ["A register is a tiny store inside the CPU.", "How long does it keep a value?"],
      note: "From 0478/13 June 2023 Q2(c)(i): to store / hold data / address / instruction ... temporarily." },
    { id: "pl-10", category: "pl-regs", prompt: "This is a register that is built into the arithmetic logic unit. It temporarily holds the result of a calculation. Give the component name.", answers: ["Accumulator (ACC)"],
      keywords: [/^\s*(the\s+|an\s+)?(acc|accumulator)(\s*\(\s*acc\s*\))?\s*\.?\s*$/i], distractors: ["Memory data register (MDR)", "Current instruction register (CIR)", "Program counter (PC)"],
      working: ["Results build up, or accumulate, in this register.", "It is the register inside the ALU."],
      note: "From 0478/13 November 2021 Q5: accumulator // ACC." },
    { id: "pl-11", category: "pl-regs", prompt: "This is a register that holds data or an instruction that has been fetched from memory. Give the component name.", answers: ["Memory data register (MDR)"],
      keywords: [/^\s*(the\s+)?(mdr|mbr|memory\s+(data|buffer)\s+register)(\s*\(\s*m[db]r\s*\))?\s*\.?\s*$/i], distractors: ["Memory address register (MAR)", "Program counter (PC)", "Accumulator (ACC)"],
      working: ["It holds a value from memory, not an address.", "Which register has data in its name?"],
      note: "From 0478/13 November 2021 Q5: memory data register // MDR." },
    { id: "pl-12", category: "pl-regs", prompt: "This carries addresses around the CPU. Give the component name.", answers: ["Address bus"],
      keywords: [/^\s*(the\s+|an\s+)?address\s+bus\s*\.?\s*$/i], distractors: ["Data bus", "Control bus", "Memory address register (MAR)"],
      working: ["It carries, so it is a bus, not a register.", "Each bus is named after what it carries."],
      note: "From 0478/13 November 2021 Q5: address bus." },
    { id: "pl-13", category: "pl-regs", prompt: "One type of component within the CPU is an address bus. Identify one other type of bus and state what it is responsible for transmitting.", answers: ["Data bus: it transmits data"],
      keywords: [/^(?=.*\bdata\s+bus\b)(?=.*\b(transmit\w*|carr\w*|send\w*|mov\w*|transfer\w*)\b)(?=.*\b(data|instructions?)\b.*\b(data|instructions?)\b).*$|^(?=.*\bcontrol\s+bus\b)(?=.*\bsignals?\b).*$/i],
      distractors: ["Address bus: it transmits addresses", "Data bus: it transmits control signals", "Control bus: it transmits addresses"],
      working: ["The address bus is given, so name one of the other two.", "Say what that bus carries: each one is named after it."],
      note: "From 0478/11 November 2022 Q2(a): data bus ... transmits data/instructions; control bus ... transmits control signals." },
    { id: "pl-14", category: "pl-regs", prompt: "Describe the role of the Control Bus.", answers: ["It carries control signals from the CU to other components"],
      keywords: [/^(?=.*\bsignals?\b)(?=.*\b(carr\w*|transmit\w*|transfer\w*|send\w*|control\w*)\b)(?=.*\b(components?|devices?|cu|cpu|control\s+unit|memory|ram|parts?)\b).*$/i],
      distractors: ["It carries addresses to memory", "It carries data to the CPU", "It controls the clock speed"],
      working: ["Each bus is named after what it carries.", "Where do those signals go from, and to?"],
      note: "From 0478/12 March 2021 Q8(b)(ii): carries control signals ... from the CPU/CU to components; to synchronise the cycle." },
    // ================================================= The FDE cycle
    { id: "pl-15", category: "pl-fde", prompt: "Give the name of the first register that is used in the fetch part of the cycle.", answers: ["Program counter (PC)"],
      keywords: [/^\s*(the\s+)?(pc|program\s+counter)(\s*\(\s*pc\s*\))?\s*\.?\s*$/i], distractors: ["Memory data register (MDR)", "Current instruction register (CIR)", "Accumulator (ACC)"],
      working: ["Before it fetches, the CPU must know where the next instruction is.", "Which register keeps that address and counts through the program?"],
      note: "From 0478/13 November 2025 Q2(a): program counter // PC." },
    { id: "pl-16", category: "pl-fde", prompt: "The CPU has a control unit (CU). Give the name of the register that is part of the CU.", answers: ["Current instruction register (CIR)"],
      keywords: [/^\s*(the\s+)?(cir|ir|(current\s+)?instruction\s+register)(\s*\(\s*c?ir\s*\))?\s*\.?\s*$/i], distractors: ["Memory data register (MDR)", "Accumulator (ACC)", "Program counter (PC)"],
      working: ["The CU decodes instructions.", "Which register holds the instruction while it is decoded?"],
      note: "From 0478/13 November 2025 Q2(b)(ii): current instruction register // CIR." },
    { id: "pl-17", category: "pl-fde", prompt: "The CPU performs a cycle to process data. Fetch is the first stage in this cycle. State the names of the second and third stages in the cycle, in order.", answers: ["Decode, then execute"],
      keywords: [/^(?!.*\bexecut\w*\b.*\bdecod\w*\b).*\bdecod\w*\b.*\bexecut\w*\b.*$/i], distractors: ["Execute, then decode", "Process, then store", "Decode, then store"],
      working: ["After fetching an instruction, the CPU must work out what it means.", "Only then can it carry it out."],
      note: "From 0478/11 June 2022 Q2(a)(ii): second stage decode, third stage execute." }
  ];
}

// ---- Exam Practice 2 plenary: real exam questions on performance, instruction sets and embedded systems.
function plenaryCards2() {
  var F = "(dedicated|single|specific|one|limited|particular|special)\\s+(functions?|tasks?|jobs?|purposes?)";
  var OTHER = ["microprocessors?", "dedicated\\s+hardware", "(cannot|can.?t|not|unable\\s+to|hard\\s+to)\\b.*\\b(re-?program\\w*|chang\\w*|updat\\w*|install\\w*)", "firmware", "(built|embedded)\\s+in(to|side)?|part\\s+of\\s+a\\s+(larger|bigger)"];
  var CHARS = [F].concat(OTHER, ["(low|little|less|not\\s+much)\\s+(power|energy|electricity)", "cheap\\w*|low\\s+cost", "small\\w*|compact", "automatic\\w*|without\\s+(a\\s+)?(human|person|people)"]);
  var pairs = [];
  for (var i = 0; i < CHARS.length; i++) for (var j = i + 1; j < CHARS.length; j++) pairs.push("(?=.*\\b(" + CHARS[i] + ")\\b)(?=.*\\b(" + CHARS[j] + ")\\b)");
  var TWO_CHARS = new RegExp("^(?!.*\\b(many|multiple|several)\\s+(functions?|tasks?|jobs?)\\b)(?:" + pairs.join("|") + ").*$", "i");
  var WHY_EMB = new RegExp("^(?!.*\\b(many|multiple|several)\\s+(functions?|tasks?|jobs?)\\b)(?=.*\\b" + F + "\\b)(?=.*\\b(" + OTHER.join("|") + ")\\b).*$", "i");
  return [
    // ================================================= Performance
    { id: "p2-01", category: "pl-perf", prompt: "The CPU has a component that regulates the number of fetch-decode-execute cycles the CPU can perform in a second. State the name of this component.", answers: ["Clock"],
      keywords: [/^\s*(the\s+|a\s+)?(system\s+|cpu\s+)?clock\s*\.?\s*$/i], distractors: ["Cache", "Core", "Control unit"],
      working: ["This component sends out a regular pulse.", "One FDE cycle is done on each pulse."],
      note: "From 0478/13 November 2023 Q3(c): clock." },
    { id: "p2-02", category: "pl-perf", prompt: "The CPU has cache. Explain the purpose of the cache.", answers: ["It stores frequently used data so it can be accessed faster than from RAM"],
      keywords: [/^(?=.*\b(frequent\w*|often|regular\w*|most\s+used|commonly)\b)(?=.*\b(data|instructions?)\b).*$|^(?=.*\b(stor\w*|hold\w*|keep\w*)\b)(?=.*\b(faster|quicker|speed\w*)\b)(?=.*\b(ram|memory)\b).*$/i],
      distractors: ["It stores data when the power is off", "It stores the next instruction", "It carries data between components"],
      working: ["Which data is kept in cache: any data, or the data used again and again?", "Why is that better than going to RAM each time?"],
      note: "From 0478/13 November 2023 Q3(b), any two: a type of storage; that stores frequently used data/instructions; to speed up access; as it is faster to access than RAM." },
    { id: "p2-03", category: "pl-perf", prompt: "Which statement describes the purpose of cache?\nA It stores important instructions.\nB It stores the next instruction to be processed.\nC It stores frequently used instructions.\nD It stores instructions so they are not lost when the power is turned off.", answers: ["C"],
      keywords: [/^\s*c\s*\.?\s*$|^\s*(c\s*[.:)-]?\s*)?(it\s+)?stores?\s+frequently\s+used\s+instructions\s*\.?\s*$/i], distractors: ["A", "B", "D"],
      working: ["Which register holds the address of the next instruction? So B is not cache.", "Cache loses its data when the power goes off, like RAM."],
      note: "From 0478/13 November 2025 Q2(c)(i): C." },
    { id: "p2-04", category: "pl-perf", prompt: "State what is meant by clock speed.", answers: ["The number of FDE cycles a CPU can perform in a second"],
      keywords: [/^(?=.*\b(number|amount|how\s+many)\b)(?=.*\b(fde|fe|cycles?|instructions?|pulses?|ticks?)\b)(?=.*\b(second|sec|s)\b).*$/i],
      distractors: ["How fast the computer is", "The number of cores in the CPU", "The amount of cache"],
      working: ["One FDE cycle is done on each clock pulse.", "Clock speed counts something in a fixed amount of time. What, and in how long?"],
      note: "From 0478/12 November 2023 Q3(a)(i): the maximum number of FDE cycles/instructions a CPU can perform/process/execute in a second." },
    { id: "p2-05", category: "pl-perf", prompt: "A user's CPU has a clock speed of 2 GHz. She wants to change it to a CPU that has a clock speed of 3 GHz. Explain the effect this change will have on the performance of the CPU.", answers: ["Performance improves because more FDE cycles can be processed in a second"],
      keywords: [/^(?=.*\b(more|extra|greater|higher)\b)(?=.*\b(fde|fe|cycles?|instructions?)\b)(?=.*\b(second|sec|faster|quicker)\b).*$/i],
      distractors: ["It has more cores", "It can store more data", "It uses less power"],
      working: ["GHz counts the clock pulses in one second.", "Which of the two CPUs gives more pulses in that time, and what does each pulse do?"],
      note: "From 0478/12 November 2023 Q3(a)(ii): increases/improves the performance // tasks performed faster ... because more FDE cycles/instructions can be processed in a second." },
    { id: "p2-06", category: "pl-perf", prompt: "The CPU has a clock speed of 2.4 GHz. Describe what is meant by a 2.4 GHz clock speed.", answers: ["2.4 billion FDE cycles per second"],
      keywords: [/^(?=.*(2\.4\s*billion|2\s*400\s*000\s*000|2,400,000,000|2400000000|2\.4\s*x\s*10\s*\^?\s*9))(?=.*\b(cycles?|pulses?|instructions?|ticks?)\b)(?=.*\b(second|sec|s)\b).*$/i],
      distractors: ["2.4 million cycles per second", "2.4 thousand cycles per second", "2.4 billion bytes per second"],
      working: ["G stands for giga, which means a billion.", "Hz means one cycle each second."],
      note: "From 0478/11 November 2023 Q1(d), any two: (the CPU completes) 2.4 billion ... cycles/clock pulses per second." },
    { id: "p2-07", category: "pl-perf", prompt: "The CPU has two cores. State the purpose of a core in the CPU.", answers: ["To process an instruction"],
      keywords: [/\b(fde|fetch|process\w*|execut\w*|carr\w*\s+out|run\w*)\b.*\b(cycles?|instructions?)\b|\b(fetch\w*)\b.*\bdecod\w*\b.*\bexecut\w*\b/i],
      distractors: ["To store frequently used data", "To set the clock speed", "To carry addresses"],
      working: ["A core is a processing unit inside the CPU.", "What does each one do to an instruction?"],
      note: "From 0478/13 June 2023 Q2(a), any one: to perform a fetch-decode-execute cycle; to process / execute an instruction." },
    { id: "p2-08", category: "pl-perf", prompt: "The CPU is replaced with one that has four cores instead of two. Explain the effect this has on the performance of the system.", answers: ["Performance may increase because more instructions can be processed simultaneously"],
      keywords: [/^(?=.*\b(more|extra|four|4|double|twice)\b)(?=.*\b(instructions?|fde|cycles?|tasks?)\b)(?=.*\b(simultaneous\w*|same\s+time|parallel|at\s+once)\b).*$/i],
      distractors: ["It has a higher clock speed", "It stores more data", "The data is safer"],
      working: ["Each core runs its own FDE cycle.", "What can four cores do at the same time that two cannot?"],
      note: "From 0478/13 June 2023 Q2(b): it may increase the performance ... because more instructions can be processed simultaneously." },
    { id: "p2-09", category: "pl-perf", prompt: "The CPU is dual core and has a processor speed of 2.4 GHz. Describe what is meant by a core.", answers: ["An independent processing unit that performs the FDE cycle"],
      keywords: [/^(?=.*\b(unit|processor|independent|self-contained|own)\b)(?=.*\b(fde|fetch\w*|execut\w*|process\w*|cycles?|instructions?)\b).*$/i],
      distractors: ["A type of storage in the CPU", "The speed of the clock", "A bus inside the CPU"],
      working: ["Is it a store, a bus, or a part that works on its own?", "What does it do with each instruction?"],
      note: "From 0478/12 November 2025 Q4(b), any two: independent/self-contained processing unit; it executes/processes instructions // performs the FDE cycle; it contains registers/units." },
    { id: "p2-10", category: "pl-perf", prompt: "Explain two ways that the performance of the CPU could be increased. Name the two ways.", answers: ["Increase the number of cores and increase the clock speed"],
      keywords: [/^(?=.*\bcores?\b)(?=.*\bclock\b).*$|^(?=.*\bcores?\b)(?=.*\bcache\b).*$|^(?=.*\bclock\b)(?=.*\bcache\b).*$/i],
      distractors: ["More RAM and a bigger screen", "A faster mouse and more cores", "More storage and a bigger screen"],
      working: ["Three parts of a CPU change how fast it works.", "Name two of them, and say what each one does."],
      note: "From 0478/12 November 2025 Q4(c), four from (MAX 2 if no expansion): more cores ... more instructions processed simultaneously; higher clock speed ... more instructions per second; more cache ... more frequently used data stored to be accessed faster than RAM. In the exam, say how each one helps." },
    // ================================================= Instruction sets
    { id: "p2-11", category: "pl-isa", prompt: "The CPU has a list of all the machine code commands it can process. State the name of this list of commands.", answers: ["Instruction set"],
      keywords: [/^\s*(an?\s+|the\s+)?instruction\s+sets?\s*\.?\s*$/i], distractors: ["Character set", "Program counter", "Machine code"],
      working: ["It is a set: a list of everything the CPU can do.", "Each item in it is one instruction."],
      note: "From 0478/12 November 2023 Q3(c): instruction set." },
    { id: "p2-12", category: "pl-isa", prompt: "All three computers have the same instruction set. Define the term instruction set.", answers: ["A list of the commands that can be processed by a CPU"],
      keywords: [/^(?=.*\b(list|set|collection|group|all)\b)(?=.*\b(commands?|operations?|opcodes?)\b)(?=.*\b(cpu|processor|process\w*|execut\w*|run|carr\w*\s+out|understand\w*|decod\w*)\b).*$/i],
      distractors: ["A list of all the characters", "A set of programs on the computer", "The speed of the CPU"],
      working: ["It is a list. A list of what?", "Which part of the computer can carry them out?"],
      note: "From 0478/12 March 2025 Q3(d): a list of the (machine code) commands that can be processed by a CPU." },
    // ================================================= Embedded systems
    { id: "p2-13", category: "pl-emb", prompt: "A washing machine is an example of an embedded system. Give two characteristics of an embedded system.", answers: ["It performs a dedicated function and it has a microprocessor"],
      keywords: [TWO_CHARS], distractors: ["It can perform many tasks and it is fast", "It is a computer and it has a screen", "It has a CPU"],
      working: ["How many jobs does a washing machine do?", "What kind of processor does it have? Give two different features."],
      note: "From 0478/12 November 2023 Q4(a), any two: dedicated function; microprocessor; dedicated hardware; firmware; built into a larger device; user cannot reprogram; little power; cheap; works automatically; small." },
    { id: "p2-14", category: "pl-emb", prompt: "A student has an electronic calculator. The calculator is an example of an embedded system. Explain why it is an example of an embedded system.", answers: ["It has a dedicated function and it has a microprocessor"],
      keywords: [WHY_EMB], distractors: ["It is a small computer with a screen", "It can perform many different tasks", "It does calculations quickly"],
      working: ["How many jobs does a calculator do?", "Add a second feature: its processor, its hardware, or whether it can be reprogrammed."],
      note: "From 0478/11 November 2025 Q1(g), any two: it has a single/limited function; it has dedicated hardware; it has a microprocessor; its function is not easily changed // cannot be reprogrammed." }
  ];
}

const DRILLS = [
  ['y10-3-1-r', 'Exam Practice 1 plenary: real exam questions on the CPU, registers, buses and the FDE cycle, each cited in its note.',
    'Year 10, 3.1.R: The CPU and FDE Cycle Exam Drill', 'Cambridge IGCSE Computer Science 0478',
    [['pl-cpu', 'The CPU and Its Parts'], ['pl-regs', 'Registers and Buses'], ['pl-fde', 'The FDE Cycle']], plenaryCards],
  ['y10-3-1-r2', 'Exam Practice 2 plenary: real exam questions on CPU performance, instruction sets and embedded systems, each cited in its note.',
    'Year 10, 3.1.R: Performance, Instruction Sets and Embedded Systems Exam Drill', 'Cambridge IGCSE Computer Science 0478',
    [['pl-perf', 'CPU Performance'], ['pl-isa', 'Instruction Sets'], ['pl-emb', 'Embedded Systems']], plenaryCards2],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = drillFile(id, about, title, subtitle, cats, fn);
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  const cites = src.match(/From 0478\/1[123] [A-Za-z]+ 20\d\d Q[0-9a-z()]+/g) || [];
  EXAM_PARTS.forEach((r) => { const m = r.match(/^(0478\/1[123]), ([A-Za-z]+) (20\d\d), Question (.+)$/); const short = `${m[1]} ${m[2]} ${m[3]} Q${m[4]}`; assert(!cites.some((c) => c.slice(5).startsWith(short)), `drill ${id} uses exam part ${r}`); });
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}
{
  const vm = await import('node:vm');
  for (const [id] of DRILLS) {
    const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids unique`);
    for (const c of d.cards) {
      const pass = (s) => c.keywords.some((k) => k.test(s));
      const ans = String(c.answers[0]);
      [ans, ans.toLowerCase(), ans + '.'].forEach((v) => assert(pass(v), `${id} ${c.id}: own answer "${v}" fails`));
      c.distractors.forEach((x) => assert(!pass(x), `${id} ${c.id}: distractor "${x}" passes`));
      c.working.forEach((w) => assert(!pass(w), `${id} ${c.id}: working passes: ${w}`));
      assert(c.working.length === 2 && /^From 0478\/1[123] /.test(c.note), `${id} ${c.id}: working and note`);
    }
    console.log(`${id}: ${d.cards.length} cards`);
    const tk = (cid, yes, no) => { const c = d.cards.find((x) => x.id === cid); yes.forEach((s) => assert(c.keywords.some((k) => k.test(s)), `${id} ${cid} rejects "${s}"`)); no.forEach((s) => assert(!c.keywords.some((k) => k.test(s)), `${id} ${cid} accepts "${s}"`)); };
    if (id === 'y10-3-1-r') {
      tk('pl-13', ['data bus, it carries data', 'control bus carries control signals', 'the data bus transmits instructions'], ['data bus', 'control bus', 'address bus carries addresses']);
      tk('pl-17', ['decode, execute', 'decode then execute'], ['execute, decode', 'decode']);
    } else {
      tk('p2-13', ['it has a dedicated function and dedicated hardware', 'it is small and cheap', 'it has a microprocessor and works automatically'], ['it does one task', 'it can do many tasks and is small', 'it is a computer']);
      tk('p2-14', ['it does one job and has a microprocessor', 'it has a single function and cannot be reprogrammed'], ['it does one job', 'it has a microprocessor', 'it is small and cheap']);
      tk('p2-06', ['2.4 billion cycles per second', 'it does 2,400,000,000 FDE cycles each second'], ['2.4 cycles per second', '2.4 billion']);
    }
  }
}

for (const L of [L1, L2]) {
  const text = JSON.stringify(L.steps);
  assert(!/[–—]|&mdash;|&ndash;/.test(text), `dash found in ${L.id}`);
  assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text), `emoji in ${L.id}`);
  assert(!/mario|data bridge/i.test(L.label), `${L.id} title`);
  assert(new Set(L.steps.map((s) => s.id)).size === L.steps.length, `${L.id} step ids unique`);
  assert(L.steps.at(-1).appId === 'bridge-builder' && L.steps.at(-2).label === 'Data Bridge: Use Your Notes', `${L.id} ends with Data Bridge`);
  assert(L.steps.every((s) => s.content.includes('lesson-tps')), `${L.id} Think, Pair, Share on every slide`);
  const lesson = { id: L.id, label: L.label, steps: L.steps, validators: L.validators, pseudocodeValidators: {} };
  fs.writeFileSync(path.join(ROOT, 'LessonData', L.id + '.json'), JSON.stringify(lesson, null, 1) + '\n');
}
// Minutes: Do Now 7, title 1, the slides below, Data Bridge 1 + 6. Each lesson fits 55.
const MINUTES = {
  'y10-3-1-r': { recap: 4, paper: 12, 'do-now': 4, 'do-now-2': 3, 'do-now-ext': 0, title: 1, 'exam-acc': 4, 'fix-stored': 4, 'exam-bus': 4, 'fix-mar-mdr': 4, 'exam-pc': 3, practice: 3, plenary: 5, 'how-to-play': 1, game: 3 },
  'y10-3-1-r2': { recap: 4, paper: 12, 'do-now': 2, 'do-now-cache': 2, 'do-now-3': 3, 'do-now-ext': 0, title: 1, 'exam-clock': 4, 'exam-cores': 3, 'exam-cache': 3, 'fix-quad': 4, 'exam-atm': 4, 'fix-watch': 4, plenary: 5, 'how-to-play': 1, game: 3 },
};
for (const L of [L1, L2]) {
  const m = MINUTES[L.id];
  assert(L.steps.every((s) => s.id in m) && Object.keys(m).length === L.steps.length, `${L.id} minutes for every slide`);
  const total = Object.values(m).reduce((a, b) => a + b, 0);
  assert(total <= 55, `${L.id} runs ${total} minutes`);
  L.steps.filter((s) => s.type === 'embedded-app' && s.id !== 'do-now-ext' || s.type === 'self-marked-response').forEach((s) => assert(s.content.includes(`<strong>${m[s.id]} minutes.</strong>`), `${L.id} ${s.id} states its minutes`));
  console.log(`${L.id}: ${L.steps.length} steps, ${total} minutes`);
}

// Register both lessons in their own "3.1.R" unit straight after the 3.1 unit. lessons.json is shared with other
// builders, so read it at the last moment and insert as text, leaving the rest exactly as it was.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
let raw = fs.readFileSync(lp, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const has = (id) => JSON.parse(raw).years.some((y) => y.units.some((u) => u.lessons.includes(id)));
if (!has(L1.id)) {
  const anchor = ['            "y10-3-hw-sensors"', '          ]', '        }'].join(eol);
  const parts = raw.split(anchor);
  assert(parts.length === 2, 'the 3.1 unit ending with y10-3-hw-sensors must appear exactly once in lessons.json');
  const unit = ['            "y10-3-hw-sensors"', '          ]', '        },', '        {', '          "code": "3.1.R",', '          "title": "Computer Architecture Review",', '          "lessons": [',
    `            "${L1.id}",`, `            "${L2.id}"`, '          ]', '        }'].join(eol);
  raw = parts.join(unit);
  JSON.parse(raw);
  fs.writeFileSync(lp, raw);
}
const y10 = JSON.parse(fs.readFileSync(lp, 'utf8')).years.find((y) => y.id === 'year10');
const unitR = y10.units.find((u) => u.code === '3.1.R');
assert(unitR && unitR.lessons.join() === [L1.id, L2.id].join(), '3.1.R unit holds both lessons in order');
console.log(`Year 10 units: ${y10.units.map((u) => u.code).join(', ')}`);
