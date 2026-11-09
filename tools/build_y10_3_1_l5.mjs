// Builds LessonData/y10-3-1-l5.json and its plenary drill Drills/data/y10-3-1-l5.js: Year 10, 3.1.5: CPU Performance
// (syllabus 0478 3.1: explain how the number of cores, the size of the cache and the clock speed affect performance).
//   node tools/build_y10_3_1_l5.mjs
// It adds the lesson to the "3.1" unit after y10-3-1-l4. The drill is registered in the shell (js/registries.html).
// One idea per slide, each a prediction and then the reason, with small numbers: performance (how many instructions a
// second), the clock (one FDE cycle per pulse), clock speed in GHz, a 2 GHz and 4 GHz compare; RAM is slow, so cache;
// a small and a big cache compare; cores, a 1 core and 4 cores compare, then a task that cannot be split. Notes go on
// their own slides after the slides they are about (Check my note).
// Activities: CPU Lab activity=perf (CPU Race: CpuLab/perf.js, model test tools/test_cpulab_perf.mjs), levels 1 to 2
// on Activity 1 and 3 to 4 on Activity 2.
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:  0478/12 June 2026 Q2(c); 0478/13 November 2023 Q3(a) (typed, not circled)
//   Exam:    0478/12 November 2023 Q3(a)(i) and (ii); 0478/13 November 2025 Q2(c)(i); 0478/13 November 2023 Q3(b);
//            0478/13 June 2023 Q2(a) and (b); 0478/13 November 2023 Q3(c); 0478/11 June 2025 Q5(a) (core and
//            instruction set rows); 0478/12 March 2025 Q3(c)(i) and (ii); 0478/13 June 2024 Q8(d)
//   Drill:   0478/12 June 2026 Q2(d); 0478/11 June 2025 Q5(a) (cache row)
//   The practice paper y10-3-1-l5-paper (ExamPapers.gs) uses others: 0478/12 March 2024 Q2(b); 0478/11 November 2023
//   Q1(d); 0478/11 November 2024 Q5(e); 0478/11 June 2026 Q2(b); 0478/12 November 2025 Q4(b) and (c); 0478/13 June
//   2026 Q3(c)(ii); 0478/11 June 2025 Q5(c).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l5';
const PREV = 'y10-3-1-l4';
const P = 'y10-315';
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

// ---------------------------------------------------------------- step builders (as y10-3-1-l4)
const validators = {};
function checkStep(id, label, lead, parts, extra = '', grid = 0) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const gridStyle = grid ? ` style="display:grid;grid-template-columns:repeat(${grid}, minmax(0, 1fr));column-gap:28px"` : '';
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses"${gridStyle}>${inputs}</div>` +
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
    content: `<h2 class="lesson-h2">${label}</h2>` + (lead || '') + (!extra ? `<div id="${cid}"></div>` : items.length > 1 ? extra + `<div id="${cid}" style="margin-top:8px"></div>` : `<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;align-items:start"><div>${left}</div><div id="${cid}"></div></div>`), items };
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
const steps = [];
const WRITE_DO = '<strong>What to do:</strong> type your answer, then press <strong>Check my answer</strong> or <strong>Submit answer</strong>.';
const table = (head, rows) => {
  const cell = 'padding:2px 8px;border-bottom:1px solid var(--line);text-align:left';
  return `<table style="border-collapse:collapse;font-size:15px;margin:0"><tr>${head.map((h) => `<th style="${cell};font-size:13px;color:var(--muted)">${h}</th>`).join('')}</tr>` +
    rows.map((r) => `<tr>${r.map((c) => `<td style="${cell}">${c}</td>`).join('')}</tr>`).join('') + '</table>';
};
// Two CPUs side by side: [heading, [rows]].
const cmp = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0">${[a, b].map(([h, rows]) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:6px 12px"><b>${h}</b>` +
  rows.map((r) => `<div style="margin-top:3px;${MONO};font-size:15px">${r}</div>`).join('') + '</div>').join('')}</div>`;
const PREDICT = 'read the facts, then pick your prediction. The reason appears under it.';
const COMPARE = 'compare the two CPUs, then pick your prediction. The reason appears under it.';

// ---------------------------------------------------------------- Do Now 1: 0478/12 June 2026 Q2(c)
// Mark scheme, three from: the MAR stores the address // the address is sent to the MAR ...; ... for the value that is to
// be fetched, in RAM; the MDR stores the value // the value is sent to the MDR. MP2 and MP3: benefit of the doubt for
// instruction in place of value or data. The walkthrough is the same kind of question about the ALU and the ACC.
const WT_DN1 = { title: 'Walk me through it: how two parts are used', steps: [
  { text: '<strong>A similar question.</strong> "Two numbers are added in the CPU. Explain how the ALU and the ACC are used." It is worth 3 marks.', visual: note('3 marks: give 3 separate points') },
  { text: 'Take one part at a time. What does the <b>ALU</b> do in this process? It ' + kw('carries out the addition') + '.', visual: line('ALU: ' + kw('carries out the addition')) },
  { text: 'Now the <b>ACC</b>: what does it hold, and which one? It ' + kw('stores the result') + ' of the addition.', visual: line('ACC: ' + kw('stores the result')) },
  { text: 'A third point is the detail: <b>which</b> thing it is, or <b>where</b> it comes from. "The result is stored in the ACC, ready for the next calculation."', visual: line('what it does + what it holds + which one') },
  { text: 'Now your question. Take the MAR, then the MDR. For each one: what does it hold in this fetch, and where does that come from?', visual: note('MAR: what? MDR: what? where from?') },
] };
steps.push(written('do-now', 'Do Now: Fetching a Value (1 of 2)',
  'Recap of 3.1.2 to 3.1.4. ' + cite('0478/12, June 2026, Question 2(c)') + ' ' + WRITE_DO, [
    { id: 'mar-mdr-fetch', prompt: 'A value is fetched from random access memory (RAM) to the CPU. Explain how the MAR and MDR are used in this process.', marks: 3,
      scheme: ['The MAR stores the address or location of the value // the address is sent or copied to the MAR ...', '... the address of the value or data that is to be fetched, in RAM', 'The MDR stores the value or data // the value or data is sent or copied to the MDR'],
      guidance: 'Three from the points, one mark each. Point 2 follows on from point 1. Points 2 and 3: benefit of the doubt for instruction in place of value or data.',
      modelAnswer: 'The address of the value in RAM is sent to the MAR. The value at that address is sent to the MDR.' },
  ], '<p style="margin:0">A computer has a central processing unit (CPU). The memory address register (MAR) and the memory data register (MDR) are two registers built into the CPU.</p>'));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/13 November 2023 Q3(a)
// Mark scheme: accumulator (ACC); control unit (CU); program counter (PC). Typed here instead of circled.
const WT_DN2 = { title: 'Walk me through it: inside the CPU or not?', steps: [
  { text: '<strong>A similar question.</strong> "Circle two components that are <b>not</b> built into the CPU: ALU, keyboard, MAR, printer, CIR."', visual: note('ask the same question about every item') },
  { text: 'For each item ask: is it a <b>register</b> or a <b>unit</b> that the CPU uses to run instructions? Those are built into the CPU.', visual: line('register or unit? ' + kw('inside the CPU')) },
  { text: 'ALU: a unit, inside. MAR: a register, inside. CIR: a register, inside.', visual: line('ALU, MAR, CIR: ' + kw('inside')) },
  { text: 'Keyboard and printer: devices joined to the computer, ' + kw('outside') + ' the CPU. So the answer is keyboard and printer.', visual: line('keyboard, printer: ' + kw('outside')) },
  { text: 'Now your list. Which three are registers or units inside the CPU? The others are cards, disks or memory outside it.', visual: note('three inside, five outside') },
] };
steps.push(written('do-now-2', 'Do Now: Inside the CPU (2 of 2)',
  'Recap of 3.1.2. ' + cite('0478/13, November 2023, Question 3(a) (adapted: typed, not circled)') + ' A computer has a central processing unit (CPU). ' + WRITE_DO, [
    { id: 'built-in', prompt: '(a) Type the three components that are built into the CPU: accumulator (ACC), control unit (CU), graphics card, hard disk drive (HDD), motherboard, program counter (PC), random access memory (RAM), read only memory (ROM).', marks: 3,
      scheme: ['Accumulator (ACC)', 'Control unit (CU)', 'Program counter (PC)'],
      guidance: 'One mark for each correct component. Online the components are typed instead of circled: if more than three are given, mark only the first three.',
      modelAnswer: 'ACC, CU, PC.' },
  ]));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-3-1-l4',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on the fetch-decode-execute cycle. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Go to the next slide when you are ready.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'CPU Performance',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">CPU Performance</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> three things inside a CPU that make it run programs faster, and <strong>why</strong> each one works.', 'Small numbers all lesson: two CPUs, one task, which finishes first?',
      '<strong>How this lesson works:</strong> on each slide, read the facts, <strong>predict</strong> by picking an answer, then read why.']) +
    tps('Two computers open the same game. One opens it sooner. Predict: what could be different inside the faster one?', 'Ideas to collect: it carries out more instructions each second, it waits less for data, it works on more than one thing at once. Today tests each idea.') });

// ---------------------------------------------------------------- performance and the clock
steps.push(mcStep('why-faster', 'Why One CPU Finishes First', todo(PREDICT) +
  facts(['CPU A and CPU B run the same program: 12 instructions.']), [
    { prompt: 'Predict: which CPU finishes the program first?', options: ['CPU B, after 2 seconds', 'CPU A, after 4 seconds', 'Both at the same time'], correct: 0,
      explain: 'B: 12 &divide; 6 = 2 seconds. A: 12 &divide; 3 = 4 seconds. How fast a CPU carries out instructions is its <strong>performance</strong>. Better performance: programs finish sooner.' },
  ], cmp(['CPU A', ['3 instructions a second']], ['CPU B', ['6 instructions a second']]) +
    tps('Why do people care how fast a computer runs a program?', 'Programs open and respond sooner, games run smoothly, and big jobs such as video finish in less time.')));
steps.push(mcStep('clock', 'The Clock: One Cycle Each Pulse', todo(PREDICT) +
  facts(['Inside the CPU is a <strong>clock</strong>. It sends out pulses, one after another.', 'On each pulse, the CPU carries out one FDE cycle: one instruction is fetched, decoded and executed.']), [
    { prompt: 'Predict: a tiny CPU\'s clock sends 5 pulses each second. How long does a program of 20 instructions take?', options: ['4 seconds', '20 seconds', '100 seconds'], correct: 0,
      explain: 'One instruction on each pulse, 5 pulses a second: 5 instructions a second. 20 &divide; 5 = 4 seconds.' },
  ], `<div style="text-align:center;${MONO};font-size:22px;letter-spacing:6px;margin:6px 0">pulse pulse pulse pulse pulse</div>` + `<p style="margin:0;text-align:center">5 pulses = 5 FDE cycles = 5 instructions</p>`));
steps.push(mcStep('clock-speed', 'Clock Speed and GHz', todo(PREDICT) +
  facts(['<strong>Clock speed</strong>: the number of FDE cycles the CPU carries out in one second.', 'It is measured in hertz (Hz): 1 Hz is 1 cycle a second.', '1 GHz (gigahertz) is 1 billion cycles a second.']), [
    { prompt: 'Predict: a CPU has a clock speed of 3.2 GHz. How many FDE cycles does it carry out in one second?', options: ['3.2 billion', '3.2', '3.2 million'], correct: 0,
      explain: 'G means billion. 3.2 GHz is 3.2 billion FDE cycles every second, so up to 3.2 billion instructions every second.' },
  ]));
steps.push(mcStep('clock-compare', 'Compare: 2 GHz and 4 GHz', todo(COMPARE) +
  facts(['Both CPUs run the same program: 8 billion instructions.', 'Everything else about them is the same.']), [
    { prompt: 'Predict: how long does each CPU take?', options: ['A: 4 seconds, B: 2 seconds', 'A: 2 seconds, B: 4 seconds', 'Both: 8 seconds'], correct: 0,
      explain: 'A: 8 &divide; 2 = 4 seconds. B: 8 &divide; 4 = 2 seconds. A higher clock speed means more FDE cycles each second, so more instructions are processed each second: better performance.' },
  ], cmp(['CPU A: 2 GHz', ['2 billion FDE cycles a second']], ['CPU B: 4 GHz', ['4 billion FDE cycles a second']])));
steps.push(noteSlide('note-clock', 'Your Notes: Clock Speed', [
  ['explain what a clock speed of 3 GHz means.', '3 billion FDE cycles each second. So up to 3 billion instructions can be processed each second.'],
  ['explain WHY a higher clock speed can improve performance.', 'More FDE cycles happen each second, so more instructions are processed each second. Programs finish sooner.']]));

// 0478/12 November 2023 Q3(a): (i) the (maximum) number of FDE cycles or instructions a CPU can perform in a second;
// (ii) two from: increases the performance // tasks performed faster; ... because more FDE cycles can be processed a second.
const CLOCK_LEAD = ' A user\'s computer has a central processing unit (CPU) that has a clock speed of 2 GHz. She wants to change it to a CPU that has a clock speed of 3 GHz. ' + WRITE_DO;
steps.push(written('exam-clock', 'Exam Question: Clock Speed (1 of 2)',
  cite('0478/12, November 2023, Question 3(a)(i)') + CLOCK_LEAD, [
    { id: 'clock-what', prompt: '(i) State what is meant by clock speed.', marks: 1,
      scheme: ['The (maximum) number of FDE cycles or instructions a CPU can perform, process or execute in a second'],
      guidance: 'One mark. It must say per second (or a second). "How fast the CPU is" earns no mark.',
      modelAnswer: 'The number of FDE cycles the CPU can carry out in a second.' },
  ]));
steps.push(written('exam-clock-2', 'Exam Question: Clock Speed (2 of 2)',
  cite('0478/12, November 2023, Question 3(a)(ii)') + CLOCK_LEAD, [
    { id: 'clock-effect', prompt: '(ii) Explain the effect this change will have on the performance of the CPU.', marks: 2,
      scheme: ['It increases or improves the performance // tasks can be performed quicker or faster', '... because more FDE cycles or instructions can be processed in a second'],
      guidance: 'Two from the points, one mark each. Point 2 follows on from point 1.',
      modelAnswer: 'It improves the performance, because more FDE cycles can be processed in a second.' },
  ]));

// ---------------------------------------------------------------- cache
steps.push(mcStep('ram-wait', 'Why the CPU Waits for RAM', todo(PREDICT) +
  facts(['Instructions and data are stored in RAM, outside the CPU.', 'RAM is much slower than the CPU. Each fetch from RAM makes the CPU wait.']), [
    { prompt: 'Predict: a game uses the same picture data again and again. How could the CPU wait less?', options: ['Keep a copy of that data close, inside the CPU', 'Fetch it from RAM more often', 'Use a slower clock'], correct: 0,
      explain: 'Keep a copy close. A small, fast memory inside the CPU (or very near it) holds frequently used data and instructions. It is called <strong>cache</strong>. Cache is faster to access than RAM, so the CPU waits less.' },
  ]));
steps.push(mcStep('cache-compare', 'Compare: A Small Cache and a Big Cache', todo(COMPARE) +
  facts(['Both CPUs run the same game. It uses 6 MB of data again and again.']), [
    { prompt: 'Predict: which CPU runs the game faster, and why?', options: ['B: all 6 MB fits in its cache, so it waits less for RAM', 'A: a small cache is quicker to fill', 'Neither: the clock speeds are the same'], correct: 0,
      explain: '6 MB fits in B\'s cache but not in A\'s, so A keeps fetching data from the slower RAM. More cache: more frequently used data is found quickly, so performance improves.' },
  ], cmp(['CPU A: 2 MB cache', ['3 GHz']], ['CPU B: 8 MB cache', ['3 GHz']])));
// 0478/13 November 2025 Q2(c)(i): C (it stores frequently used instructions).
steps.push(mcStep('exam-cache-tick', 'Exam Question: The Purpose of Cache (1 of 2)',
  `<p class="lesson-lead">${cite('0478/13, November 2025, Question 2(c)(i)')} The computer has primary storage. One example of primary storage is cache. <strong>What to do:</strong> pick one statement.</p>`, [
    { prompt: 'Tick one box to show the correct statement that describes the purpose of cache.', options: ['It stores important instructions.', 'It stores the next instruction to be processed.', 'It stores frequently used instructions.', 'It stores instructions so they are not lost when the power is turned off.'], correct: 2,
      explain: 'Cache stores frequently used instructions (and data), so the CPU finds them quickly without waiting for RAM.' },
  ]));
// 0478/13 November 2023 Q3(b), two from: a type of storage ...; ... that stores frequently used data or instructions;
// to speed up access ...; ... as it is faster to access than RAM; it has different levels, for example L1 to L3.
steps.push(written('exam-cache', 'Exam Question: The Purpose of Cache (2 of 2)',
  cite('0478/13, November 2023, Question 3(b)') + ' A computer has a central processing unit (CPU). The CPU has cache. ' + WRITE_DO, [
    { id: 'cache-purpose', prompt: '(b) Explain the purpose of the cache.', marks: 2,
      scheme: ['It is a type of storage ...', '... that stores frequently used data or instructions', 'To speed up access ...', '... as it is faster to access than RAM', 'It has different levels, for example L1 to L3'],
      guidance: 'Any two from the points, one mark each. A point marked ... follows on from the point before it.',
      modelAnswer: 'It stores frequently used data, because it is faster to access than RAM.' },
  ]));
steps.push(noteSlide('note-cache', 'Your Notes: Cache', [
  ['explain what cache is.', 'Small, fast memory inside or near the CPU. It holds frequently used data and instructions.'],
  ['explain WHY more cache can improve performance.', 'More frequently used data and instructions can be stored in it. They are found quickly, so the CPU waits less for the slower RAM.']]));

// ---------------------------------------------------------------- cores
const coreBox = (n) => `<div style="border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);padding:4px 8px;text-align:center"><b>Core ${n}</b><div style="font-size:13px">CU, ALU, registers</div><div style="font-size:13px;color:var(--muted)">its own FDE cycle</div></div>`;
steps.push(mcStep('core', 'More Than One Core', todo(PREDICT) +
  facts(['So far each CPU had one CU, one ALU and one set of registers, running one FDE cycle at a time. One set like this is a <strong>core</strong>.', 'A dual-core CPU has 2 cores. A quad-core CPU has 4. Each core runs its own FDE cycle at the same time.']), [
    { prompt: 'Predict: a dual-core CPU has a clock speed of 2 GHz. How many instructions can it process in one second?', options: ['4 billion', '2 billion', '1 billion'], correct: 0,
      explain: 'Each core: 2 billion instructions a second. Both cores work at the same time: 2 + 2 = 4 billion a second.' },
  ], `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:4px 8px"><div style="text-align:center;font-weight:700">CPU</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${coreBox(1)}${coreBox(2)}</div></div>`));
steps.push(mcStep('cores-compare', 'Compare: 1 Core and 4 Cores', todo(COMPARE) +
  facts(['The task: edit 4 photos, 12 billion instructions.', 'It can be split: each core edits one photo.']), [
    { prompt: 'Predict: how long does each CPU take?', options: ['A: 4 seconds, B: 1 second', 'A: 1 second, B: 4 seconds', 'Both: 4 seconds'], correct: 0,
      explain: 'A: 12 &divide; 3 = 4 seconds. B: 4 cores &times; 3 billion = 12 billion a second, so 12 &divide; 12 = 1 second. More cores: more instructions are processed at the same time.' },
  ], cmp(['CPU A: 1 core', ['3 GHz']], ['CPU B: 4 cores', ['3 GHz']])));
steps.push(mcStep('cannot-split', 'Compare: A Task That Cannot Be Split', todo(COMPARE) +
  facts(['A new task: a calculation of 12 billion steps.', 'Each step needs the answer from the step before, so it cannot be split.']), [
    { prompt: 'Predict: how long does each CPU take now?', options: ['Both: 4 seconds', 'A: 4 seconds, B: 1 second', 'A: 1 second, B: 4 seconds'], correct: 0,
      explain: 'Only one core can work on it, so the other three wait. Both take 12 &divide; 3 = 4 seconds. More cores only help if a task can be split. Cores must also communicate with each other, which takes time, so 4 cores are not always 4 times as fast.' },
  ], cmp(['CPU A: 1 core', ['3 GHz']], ['CPU B: 4 cores', ['3 GHz']])));
steps.push(noteSlide('note-cores', 'Your Notes: Cores', [
  ['explain what a core is.', 'A processing unit inside the CPU. It runs its own FDE cycle: it fetches, decodes and executes instructions.'],
  ['explain WHY more cores can improve performance.', 'Each core processes its own instructions at the same time, so more instructions are processed at once.'],
  ['explain WHY more cores do not always help.', 'Some tasks cannot be split, so only one core works on them. The cores also have to communicate, which takes time.']]));
// 0478/13 June 2023 Q2(a): to perform an FDE cycle // to process an instruction. (b) two from: it may increase the
// performance; ... because more instructions can be processed simultaneously.
const CORES_LEAD = ' A library has a self-checkout system. The self-checkout system has a central processing unit (CPU). The CPU has two cores. ' + WRITE_DO;
steps.push(written('exam-cores', 'Exam Question: Cores (1 of 2)',
  cite('0478/13, June 2023, Question 2(a)') + CORES_LEAD, [
    { id: 'core-purpose', prompt: '(a) State the purpose of a core in the CPU.', marks: 1,
      scheme: ['To perform a fetch-decode-execute cycle // to process or execute an instruction'],
      guidance: 'Any one, one mark.',
      modelAnswer: 'To process instructions.' },
  ]));
steps.push(written('exam-cores-2', 'Exam Question: Cores (2 of 2)',
  cite('0478/13, June 2023, Question 2(b)') + CORES_LEAD, [
    { id: 'four-cores', prompt: '(b) The CPU is replaced with one that has four cores. Explain the effect this has on the performance of the self-checkout system.', marks: 2,
      scheme: ['It may increase the performance', '... because more instructions can be processed simultaneously'],
      guidance: 'Two from the points, one mark each. Point 2 follows on from point 1.',
      modelAnswer: 'It may increase the performance, because more instructions can be processed at the same time.' },
  ]));
steps.push(mcStep('check-change', 'Check: Which Change Helps?',
  todo('pick the change that helps each task. Ask: can the task be split? Is the CPU waiting for RAM? Done when both are answered.'), [
    { prompt: 'A photo app keeps fetching the same 6 MB of data from RAM. The CPU has 2 MB of cache, and most of its time is spent waiting. Which change helps most?', options: ['A bigger cache', 'More cores', 'A lower clock speed'], correct: 0,
      explain: 'A bigger cache. With 8 MB of cache the 6 MB of data fits, so the CPU stops waiting for RAM.' },
    { prompt: 'A task cannot be split. Which change makes it finish sooner?', options: ['More cores', 'A higher clock speed', 'Neither'], correct: 1,
      explain: 'A higher clock speed: more FDE cycles each second on the one core that works on it. Extra cores would have nothing to do.' },
  ]));

steps.push(embed('activity-1', 'Activity 1: CPU Race', 'cpu-lab',
  '<strong>What to do:</strong> two CPUs race on the same task. Level 1: pick which finishes first, and why. Level 2: type how many seconds each one takes, then pick. One check per round, and a mistake means the round does not count. <strong>Done</strong> when you have cleared level 2 (two clean rounds in a row at each level). The help gets less as you go up.',
  'activity=perf&level=1&upto=2'));

// ---------------------------------------------------------------- exam questions
const W = (w) => `^\\s*(the\\s+|an?\\s+)?${w}\\s*\\.?\\s*$`;
steps.push(checkStep('exam-names', 'Exam Questions: Name It',
  cite('0478/13 November 2023 Q3(c); 0478/11 June 2025 Q5(a)') + ' <strong>What to do:</strong> type each answer, then press Check answers.', [
    { label: '(a) The CPU has a component that regulates the number of fetch-decode-execute cycles the CPU can perform in a second. State the name of this component.', answer: W('(system\\s+)?clock'), feedback: 'It sends out a pulse for each FDE cycle.' },
    { label: '(b) Give the term: this is a processing unit within the CPU that can fetch, decode and execute instructions.', answer: W('(processor\\s+|processing\\s+)?cores?'), feedback: 'A dual-core CPU has two of these.' },
    { label: '(c) Give the term: this is a list of all the commands that can be processed by the CPU.', answer: W('instruction\\s*sets?'), feedback: 'The CU uses it to decode each instruction.' },
  ]));
const THREE = table(['Computer', 'Processor'], [['A', '2.1 GHz quad-core'], ['B', '2.5 GHz dual-core'], ['C', '5.2 GHz single-core']]);
// 0478/12 March 2025 Q3(c)(i): 1 mark for Computer A; any two for justification: it has 4 cores; ... each core will
// execute one instruction at a time; 4 instructions can be executed simultaneously (others only 1 or 2).
steps.push(written('exam-three-1', 'Exam Question: Three Computers (1 of 2)',
  cite('0478/12, March 2025, Question 3(c)(i)') + ' ' + WRITE_DO, [
    { id: 'three-simultaneous', prompt: '(i) Identify which computer is most likely to execute more instructions simultaneously. Justify your answer.', marks: 3,
      scheme: ['Computer A', 'It has 4 cores or processors', '... each core will execute one instruction at a time', '4 instructions can be executed simultaneously (the others can only execute 1 or 2)'],
      guidance: '1 mark for Computer A. Then any two from the other points for the justification, one mark each. Point 3 follows on from point 2.',
      modelAnswer: 'Computer A. It has 4 cores, so 4 instructions can be executed at the same time.' },
  ], THREE, true));
// (ii) any two from: C has a higher clock speed // B has max 5 GHz; C can run 5.2 billion instructions per second;
// B can only run 5 billion instructions per second; a single core has less latency.
steps.push(written('exam-three-2', 'Exam Question: Three Computers (2 of 2)',
  cite('0478/12, March 2025, Question 3(c)(ii)') + ' ' + WRITE_DO, [
    { id: 'three-per-second', prompt: '(ii) Explain why Computer C can execute more instructions per second than Computer B.', marks: 2,
      scheme: ['C has a higher clock speed // B has at most 5 GHz in total', 'C can run 5.2 billion instructions or FDE cycles per second', 'B can only run 5 billion instructions or FDE cycles per second', 'A single core has less latency'],
      guidance: 'Any two from the points, one mark each.',
      modelAnswer: 'C can run 5.2 billion instructions per second, but B can only run 5 billion.' },
  ], THREE, true));

steps.push(embed('activity-2', 'Activity 2: The Task Matters', 'cpu-lab',
  '<strong>What to do:</strong> now read each task carefully: can it be split, and does its data fit in the cache? Type how long each CPU takes. At level 4, pick the best upgrade for one CPU and type its new time. A mistake means the round does not count. <strong>Done</strong> when you have cleared level 4, with no help.',
  'activity=perf&level=3&upto=4'));

// 0478/13 June 2024 Q8(d), any four from: more cores; ... more FDE cycles or instructions at the same time; a higher
// clock speed; ... more FDE cycles or instructions per second; a greater cache size; ... more frequently used data
// accessed faster.
steps.push(written('exam-why', 'Exam Question: Why a Different CPU Can Be Faster',
  cite('0478/13, June 2024, Question 8(d)') + ' A student has a computer that has a central processing unit (CPU). ' + WRITE_DO, [
    { id: 'different-cpu', prompt: '(d) The student wants to replace the CPU to increase the performance of the computer. Explain why a different CPU can increase the performance.', marks: 4,
      scheme: ['It could have more cores', '... increasing the number of FDE cycles or instructions it can perform at the same time', 'It could have a higher clock speed', '... increasing the number of FDE cycles or instructions per second it can perform', 'It could have a greater cache size', '... meaning more frequently used data can be accessed faster'],
      guidance: 'Any four from the points, one mark each. A point marked ... follows on from the point before it.',
      modelAnswer: 'It could have more cores, so more instructions are performed at the same time. It could have a higher clock speed, so more FDE cycles are performed per second.' },
  ]));

// ---------------------------------------------------------------- notes check, plenary, practice paper
steps.push({ id: 'notes-check', label: 'Notes Check: Your WHY Notes',
  content: '<h2 class="lesson-h2">Notes Check: Your WHY Notes</h2>' + todo('open your notes (the notepad button at the top). You should have each note below, in your own words. Missing one? Go back to the slide named, write it, and press Check my note. Then go to the next slide.') +
    facts(['<strong>What 3 GHz means. WHY a higher clock speed can improve performance.</strong> Slide: Your Notes: Clock Speed.',
      '<strong>What cache is. WHY more cache can improve performance.</strong> Slide: Your Notes: Cache.',
      '<strong>What a core is. WHY more cores can improve performance. WHY more cores do not always help.</strong> Slide: Your Notes: Cores.']) });
steps.push(embed('plenary', 'Plenary: CPU Performance Drill', 'drill-' + ID,
  '<strong>What to do:</strong> answer every card. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.'));
steps.push({ id: 'exam-paper', label: 'Practice Paper: CPU Performance', type: 'app-link', appId: 'exampaper', appQuery: 'paper=y10-3-1-l5-paper', buttonId: `${P}-open-paper`,
  content: '<h2 class="lesson-h2">Practice Paper: CPU Performance</h2>' + todo('Open the practice paper. Answer every question, then press Submit paper. You get all your marks at once. You can take it again to improve.') +
    `<p><button type="button" class="donow-btn" id="${P}-open-paper">Open the practice paper</button></p>` });

// ---------------------------------------------------------------- the plenary drill: this lesson only
// pickThenType cards, each with two working nudges; a worked example on a similar question never holds the card's own
// answer (so number examples avoid the answer's digits).
const card = (id, category, prompt, answers, distractors, noteText, working, example, extra = {}) =>
  Object.assign({ id, category, prompt, answers, distractors, note: noteText, working, pickThenType: true }, example ? { example } : {}, extra);
const SEC = (n) => ({ keywords: [new RegExp('^\\s*' + String(n).replace('.', '\\.') + '\\s*(s|secs?|seconds?)?\\s*\\.?\\s*$', 'i')], format: 'Type a number of seconds' });
const cards = [
  card('k-01', 'clock', 'What does a clock speed of 3.2 GHz mean?', ['3.2 billion FDE cycles a second'], ['3.2 FDE cycles a second', '3.2 billion bytes of memory', '3.2 million FDE cycles a second'],
    'G means billion and Hz means cycles a second: 3.2 billion FDE cycles every second.', ['G stands for a very big number.', 'Hz means cycles each second.'],
    'A similar question: what does 2 GHz mean?\nFirst: G means billion.\nThen: Hz means cycles a second.\nSo 2 GHz is 2 billion FDE cycles a second.\nNow your question: use the number on your card.',
    { keywords: [/^(?=.*\b3\.2\b)(?=.*\bbillion\b)(?=.*\b(cycles?|instructions?|pulses?)\b)(?=.*\b(second|sec)\b).*$/i] }),
  card('k-02', 'clock', 'A CPU has a clock speed of 2 GHz.\nHow many FDE cycles does it carry out in one second?', ['2 billion'], ['2', '2 million', '20 billion'],
    '2 GHz is 2 billion FDE cycles a second.', ['G means billion.', 'One FDE cycle on each pulse of the clock.'],
    'A similar question: 5 GHz?\nFirst: G means billion.\nThen: 5 GHz is 5 billion cycles a second.\nNow your question: use your number.',
    { keywords: [/^\s*(2\s*billion|2,?000,?000,?000)(\s*(fde\s*)?cycles?)?(\s*(a|per|each)\s*second)?\s*\.?\s*$/i] }),
  card('k-03', 'clock', 'CPU A runs at 2 GHz. CPU B runs at 4 GHz. Everything else is the same.\nA program has 8 billion instructions. How many seconds does CPU B take?', ['2'], ['4', '8', '32'],
    'CPU B: 4 billion instructions a second. 8 billion divided by 4 billion is 2 seconds.', ['4 GHz is 4 billion instructions a second.', 'Divide the instructions by that number.'],
    'A similar question: 9 billion instructions at 3 GHz.\nFirst: 3 GHz is 3 billion instructions a second.\nThen: 9 divided by 3 is 3 seconds.\nNow your question: use CPU B\'s number.', SEC(2)),
  card('k-04', 'clock', 'Why can a higher clock speed improve performance?', ['More FDE cycles each second, so more instructions are processed each second'],
    ['More data is kept close to the CPU, so it waits less', 'More instructions are processed at once on other cores', 'The program has fewer instructions to process'],
    'Each pulse is one FDE cycle. More pulses each second: more instructions each second.', ['Clock speed counts something each second.', 'What happens on each pulse?'], null,
    { keywords: [/^(?=.*\b(more|faster)\b)(?=.*\b(cycles?|instructions?|pulses?)\b)(?=.*\bsecond\b).*$/i] }),
  card('k-05', 'clock', 'What happens on each pulse of the CPU clock?', ['One FDE cycle is carried out'], ['One byte is stored in cache', 'One core is switched on', 'RAM is cleared'],
    'On each pulse the CPU fetches, decodes and executes one instruction: one FDE cycle.', ['Think of the three stages from the last lesson.', 'One pulse, one ...?'], null),
  card('c-01', 'cache', 'What is cache?', ['Small, fast memory in the CPU that holds frequently used data'], ['Large, slow storage that keeps data when the power is off', 'A register that holds the address of the next instruction', 'A unit inside the CPU that does the calculations'],
    'Cache is small, fast memory inside or near the CPU. It holds frequently used data and instructions.', ['It is a kind of memory.', 'Which data does it hold: all of it, or what is used again and again?'], null,
    { keywords: [/^(?=.*\b(memory|storage)\b)(?=.*\b(frequent(ly)?|often|again|most used|commonly)\b).*$/i] }),
  card('c-02', 'cache', 'Why does the CPU fetch from cache instead of RAM when it can?', ['Cache is faster to access, so the CPU waits less'], ['Cache holds more data than RAM', 'Cache keeps data when the power is off', 'Cache does the calculations for the ALU'],
    'Cache is faster to access than RAM, so the CPU spends less time waiting.', ['RAM is outside the CPU and slower.', 'What does the CPU do while it fetches from RAM?'], null,
    { keywords: [/^(?=.*\b(faster|quicker|less time|wait(s|ing)? less|speeds? up|quick(ly)?)\b).*$/i] }),
  card('c-03', 'cache', 'CPU A has 2 MB of cache. CPU B has 8 MB. Everything else is the same.\nA game uses 6 MB of data again and again. Which CPU runs the game faster?', ['CPU B'], ['CPU A', 'Both the same'],
    'The 6 MB fits in B\'s cache, so B finds the data quickly. A keeps fetching some of it from RAM.', ['Does 6 MB fit in 2 MB? In 8 MB?', 'The CPU that waits less for RAM is faster.'],
    'A similar question: the data is 3 MB. CPU X has 1 MB of cache, CPU Y has 4 MB.\nFirst: 3 MB does not fit in 1 MB.\nThen: 3 MB fits in 4 MB.\nSo Y waits less for RAM and is faster.\nNow your question: check which cache the 6 MB fits in.',
    { keywords: [/^\s*(cpu\s*)?b\b(?!.*\b(same|both|a)\b).*$/i] }),
  card('c-04', 'cache', 'Why can more cache improve performance?', ['More frequently used data can be stored, so the CPU waits less for RAM'],
    ['More FDE cycles happen each second', 'More instructions are processed at the same time', 'More data is kept when the power is off'],
    'More cache holds more of the data and instructions used again and again, so less is fetched from the slower RAM.', ['What does cache hold?', 'What does the CPU do less of?'], null,
    { keywords: [/^(?=.*\b(data|instructions?)\b)(?=.*\b(faster|quick(ly|er)?|less|wait(s|ing)?|ram)\b)(?!.*\bpower\b).*$/i] }),
  card('r-01', 'cores', 'What is a core?', ['A processing unit that runs its own FDE cycle'], ['A small, fast memory for frequently used data', 'The clock that sends out pulses', 'The bus that carries instructions'],
    'A core is a processing unit in the CPU: it fetches, decodes and executes instructions.', ['A dual-core CPU has two of them.', 'Each one has its own CU, ALU and registers.'], null,
    { keywords: [/^(?=.*\b(process(ing|or|es)?|unit|execut(e|es|ing)|fde|fetch(es)?)\b)(?!.*\b(memory|clock|bus)\b).*$/i] }),
  card('r-02', 'cores', 'A quad-core CPU runs at 2 GHz. The task can be split.\nHow many billion instructions can it process in one second?', ['8'], ['2', '4', '6'],
    'Quad-core: 4 cores. Each does 2 billion a second, all at the same time: 4 times 2 is 8 billion.', ['How many cores is quad-core?', 'Each core does 2 billion a second.'],
    'A similar question: a dual-core CPU at 3 GHz.\nFirst: dual-core is 2 cores.\nThen: each core does 3 billion a second.\nSo both together: 3 + 3 = 6 billion.\nNow your question: count the cores, then multiply.',
    { keywords: [/^\s*8(\s*billion)?(\s*instructions?)?\s*\.?\s*$/i], format: 'Type a number' }),
  card('r-03', 'cores', 'Why can more cores improve performance?', ['Each core processes instructions at the same time, so more are processed at once'],
    ['More FDE cycles happen each second on one core', 'More data is kept close to the CPU', 'The clock sends out more pulses'],
    'Each core runs its own FDE cycle, so several instructions are processed at the same time.', ['What does each core run?', 'Do the cores take turns, or work together?'], null,
    { keywords: [/^(?=.*\b(same time|simultaneous(ly)?|at once|together|parallel|each core)\b).*$/i] }),
  card('r-04', 'cores', 'A task cannot be split. CPU A has 4 cores at 3 GHz. CPU B has 1 core at 3 GHz.\nWhich finishes first?', ['The same time'], ['CPU A', 'CPU B'],
    'Only one core can work on a task that cannot be split. Both run it on one 3 GHz core, so they finish together.', ['How many cores can work on a task that cannot be split?', 'Compare the clock speeds.'], null,
    { keywords: [/\b(same|both|neither|equal|tie|together)\b/i] }),
  card('r-05', 'cores', 'Give one reason why doubling the number of cores does not always double the performance.', ['Some tasks cannot be split between cores', 'The cores must communicate with each other'],
    ['The clock speed goes down', 'The cache gets smaller', 'RAM is switched off'],
    'Only a task that can be split uses every core, and the cores spend time communicating.', ['Can every task be shared out?', 'Do the cores need to talk to each other?'], null,
    { keywords: [/^(?=.*\b(split|divid|shar|depend|order|communicat|talk|coordinat|wait)).*$/i] }),
  card('e-01', 'apply', 'CPU A: 2 GHz, 1 core. CPU B: 1 GHz, 4 cores.\nThe task has 12 billion instructions and can be split. How many seconds does CPU B take?', ['3'], ['6', '12', '1.5'],
    'CPU B: 4 cores at 1 billion a second each is 4 billion a second. 12 divided by 4 is 3 seconds. CPU A takes 6.', ['Multiply the cores by the GHz.', 'Then divide the instructions by that.'],
    'A similar question: 2 GHz, 2 cores, 16 billion instructions.\nFirst: 2 times 2 is 4 billion a second.\nThen: 16 divided by 4 is 4 seconds.\nNow your question: use CPU B\'s numbers.', SEC(3)),
  card('e-02', 'apply', 'Computer C: 5.2 GHz single-core. Computer B: 2.5 GHz dual-core.\nHow many billion instructions per second can Computer B run at most?', ['5'], ['2.5', '5.2', '10'],
    'Dual-core: 2 cores at 2.5 billion each is 5 billion a second, less than C\'s 5.2 billion. (Cambridge IGCSE 0478/12, March 2025, Question 3(c)(ii).)', ['How many cores is dual-core?', 'Multiply the cores by the GHz.'],
    'A similar question: a quad-core CPU at 3 GHz.\nFirst: quad-core is 4 cores.\nThen: 4 times 3 is 12 billion a second.\nNow your question: B is dual-core.',
    { keywords: [/^\s*5(\.0)?(\s*billion)?(\s*instructions?)?(\s*(a|per)\s*second)?\s*\.?\s*$/i], format: 'Type a number' }),
  card('e-03', 'apply', 'A task cannot be split. Which change makes it finish sooner: more cores, or a higher clock speed?', ['A higher clock speed'], ['More cores', 'Neither'],
    'Only one core works on it, so extra cores do nothing. A higher clock speed runs more FDE cycles each second on that core.', ['How many cores can work on it?', 'Which change speeds up a single core?'], null,
    { keywords: [/\b(clock|ghz)\b(?!.*\bcores?\b)/i] }),
  card('e-04', 'apply', 'The CPU has a clock speed of 3 GHz.\nDescribe what is meant by a 3 GHz clock speed.', ['3 billion FDE cycles per second'], ['3 FDE cycles per second', '3 billion bytes per second', '3 cores working at once'],
    'From Cambridge IGCSE 0478/12, June 2026, Question 2(d): 3 billion, the (maximum) number of instructions or FDE cycles processed per second.', ['What does the G stand for?', 'What is counted each second?'], null,
    { keywords: [/^(?=.*\b(3\s*billion|3,?000,?000,?000)\b)(?=.*\b(cycles?|instructions?|pulses?|ticks?)\b)(?=.*\b(second|sec)\b).*$/i] }),
  card('e-05', 'apply', 'Give the definition of cache.', ['It stores frequently used data and instructions'], ['It stores the result of interim calculations', 'It stores the instruction that is being decoded', 'It stores data when the power is off'],
    'From Cambridge IGCSE 0478/11, June 2025, Question 5(a): stores frequently used data/instructions.', ['It is a kind of fast memory.', 'Which data: all of it, or what is used most?'], null,
    { keywords: [/\b(frequent(ly)?|often|commonly|most used|again and again)\b/i] }),
];
const drill = { title: 'Year 10, 3.1.5: CPU Performance', subtitle: 'Cambridge IGCSE Computer Science 0478',
  categories: [['clock', 'Clock speed'], ['cache', 'Cache'], ['cores', 'Cores'], ['apply', 'Compare CPUs and exam wording']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 2 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
  if (c.example) c.answers.forEach((a) => assert(!c.example.toLowerCase().includes(a.toLowerCase()), `card ${c.id}: example holds its answer`));
  assert(drill.categories.some(([k]) => k === c.category), `card ${c.id} category`);
  // Keywords take every answer and refuse every distractor.
  (c.keywords || []).forEach((k) => {
    c.answers.forEach((a) => assert(k.test(a), `card ${c.id}: keywords reject its answer "${a}"`));
    c.distractors.forEach((d) => assert(!k.test(d), `card ${c.id}: keywords accept distractor "${d}"`));
  });
});
assert(cards.length >= 15 && cards.length <= 20, 'drill size ' + cards.length);
assert(12 / 3 === 4 && 12 / (4 * 3) === 1 && 8 / 4 === 2 && 12 / (1 * 4) === 3 && 2.5 * 2 === 5 && 20 / 5 === 4, 'sums');
const kk = (id) => cards.find((c) => c.id === id).keywords[0];
['2', '2 s', '2 seconds', '2s'].forEach((s) => assert(kk('k-03').test(s), 'k-03 rejects ' + s));
['22', '2 GHz', '12'].forEach((s) => assert(!kk('k-03').test(s), 'k-03 accepts ' + s));
['3.2 billion cycles per second', '3.2 billion FDE cycles each second', '3.2 billion instructions a second'].forEach((s) => assert(kk('k-01').test(s), 'k-01 rejects ' + s));
['3.2 billion', '32 billion cycles a second'].forEach((s) => assert(!kk('k-01').test(s), 'k-01 accepts ' + s));
['B', 'cpu b', 'CPU B because the data fits'].forEach((s) => assert(kk('c-03').test(s), 'c-03 rejects ' + s));
['both', 'A', 'b and a are the same'].forEach((s) => assert(!kk('c-03').test(s), 'c-03 accepts ' + s));
['higher clock speed', 'more GHz'].forEach((s) => assert(kk('e-03').test(s), 'e-03 rejects ' + s));
['more cores', 'clock and more cores'].forEach((s) => assert(!kk('e-03').test(s), 'e-03 accepts ' + s));
const drillJson = JSON.stringify(drill, (k, v) => v instanceof RegExp ? '__RE__' + v.toString() + '__RE__' : v, 1)
  .replace(/"__RE__(.*?)__RE__"/g, (m, r) => JSON.parse('"' + r + '"'));
const drillSrc = `// Year 10, 3.1.5: CPU Performance. Plenary: clock speed, cache, cores, and comparing CPUs.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y10_3_1_l5.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${drillJson});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('exam-names', 0, ['clock', 'Clock', 'the clock', 'system clock'], ['clock speed', 'CU', 'control unit', 'cache']);
ok('exam-names', 1, ['core', 'Core', 'a core', 'processor core', 'cores'], ['CPU', 'cache', 'ALU', 'score']);
ok('exam-names', 2, ['instruction set', 'an instruction set'], ['instructions', 'set', 'cache']);
NOTES.forEach((n) => assert(n.q && n.model, 'note shape'));
// Walkthroughs never hold their slide's answers.
WT_DN1.steps.forEach((s) => assert(!/address|location|\bvalue\b|fetched|in RAM/i.test(s.text + s.visual), 'WT_DN1 gives an answer: ' + s.text));
WT_DN2.steps.forEach((s) => assert(!/accumulator|\bACC\b|control unit|\bCU\b|program counter|\bPC\b/i.test(s.text + s.visual), 'WT_DN2 gives an answer: ' + s.text));
// What a student sees: no dashes; no term before the slide that teaches it (the Do Now recaps earlier lessons' exam
// questions, and the title names the lesson).
const seen = (s) => JSON.stringify(Object.assign({}, s, { walkthrough: s.walkthrough, validatorKey: undefined, items: (s.items || []).map((it) => Object.assign({}, it, { scheme: undefined, guidance: undefined })) }));
const all = JSON.stringify(steps) + drillSrc;
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/\bmario|\bdecimal\b|unidirectional|bidirectional/i.test(steps.map(seen).join('') + drillSrc), 'term outside this lesson');
const firstTaught = { performance: 'why-faster', clock: 'clock', 'clock speed': 'clock-speed', 'GHz': 'clock-speed', hertz: 'clock-speed', cache: 'ram-wait', core: 'core' };
const skip = new Set(['do-now', 'do-now-2', 'do-now-ext', 'title']);
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(0, idx).filter((s) => !skip.has(s.id)).forEach((s) => assert(!new RegExp('\\b' + term, 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
// The Do Now slides recap earlier lessons only.
['do-now', 'do-now-2', 'do-now-ext'].forEach((id) => assert(!/\b(cache|cores?|clock|GHz|performance)\b/i.test(seen(steps.find((s) => s.id === id))), id + ' uses a term from this lesson'));
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => s.items.forEach((it) => {
  assert(it.correct >= 0 && it.correct < it.options.length && it.explain, s.id + ' item shape');
  assert(!it.prompt.toLowerCase().includes(it.options[it.correct].toLowerCase()), s.id + ': prompt holds its answer: ' + it.prompt);
}));
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

const lesson = { id: ID, label: '3.1.5: CPU Performance', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after y10-3-1-l4 in the 3.1 unit
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
