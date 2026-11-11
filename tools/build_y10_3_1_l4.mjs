// Builds LessonData/y10-3-1-l4.json and its plenary drill Drills/data/y10-3-1-l4.js: Year 10, 3.1.4: the
// Fetch-Decode-Execute Cycle (syllabus 0478 3.1: describe each stage of the cycle; the role of the CPU components in it).
//   node tools/build_y10_3_1_l4.mjs
// It adds the lesson to the "3.1" unit after y10-3-1-l3. The drill is registered in the shell (js/registries.html).
// The cycle is taught in very small steps with one tiny memory (4: LOAD 6, 5: ADD 7, 6: 12, 7: 30): fetch one register
// move per slide (PC to MAR on the address bus; memory to MDR on the data bus; PC + 1; MDR to CIR), then decode (the CU,
// the instruction set), execute (LOAD 6 puts 12 in the ACC; ADD 7 makes 42), and why it repeats. Every teaching slide is
// a prediction, then the reason; notes go on their own slides after the slides they are about (Check my note).
// Activities: CPU Lab activity=fde (Fetch, Decode, Execute: the cycle one move at a time), levels 1 to 2 (fetch) on
// Activity 1 and 3 to 5 (the whole cycle, then two instructions, no help) on Activity 2. Extension: CPU Lab 3D mission
// one-c (One Whole Instruction).
// Real questions, each checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:  0478/12 March 2024 Q2(a) (stem without "in the fetch-decode-execute cycle"); 0478/13 June 2022 Q5(b)(ii)
//   Exam:    0478/13 June 2025 Q3(b) and Q3(c) (adapted); 0478/12 June 2024 Q5(a); 0478/11 June 2022 Q2(a)(ii);
//            0478/13 November 2025 Q2(a); 0478/13 June 2026 Q3(c)(i); 0478/11 November 2024 Q5(b) and (c);
//            0478/11 June 2024 Q5(d) (adapted: describe instead of draw); 0478/13 November 2022 Q7
//   Drill:   0478/11 June 2022 Q2(a)(iii); 0478/12 June 2024 Q5(b)
//   The practice paper y10-3-1-l4-paper (ExamPapers.gs) uses others: 0478/11 November 2025 Q6(a), 0478/11 June 2026
//   Q2(a), 0478/13 November 2024 Q3, 0478/12 November 2025 Q4(a), 0478/11 November 2022 Q2(b).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l4';
const PREV = 'y10-3-1-l3';
const P = 'y10-314';
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

// ---------------------------------------------------------------- the CPU picture
// The CPU (PC, MAR, MDR; the CU with the CIR; the ALU with the ACC), the three buses and memory. o: { regs, hl: boxes to
// light, lit: { addr|data|ctrl: { v, dir: 'out'|'in'|'' } }, read: the memory address being read, caption }.
const MEM = [[4, 'LOAD 6'], [5, 'ADD 7'], [6, '12'], [7, '30']];
const START = { PC: '4', MAR: '-', MDR: '-', CIR: '-', ACC: '-' };
const LANE = { addr: ['Address bus', '#6aa9ff'], data: ['Data bus', '#fdd663'], ctrl: ['Control bus', '#f28b82'] };
function cpuPic(o = {}) {
  const r = Object.assign({}, START, o.regs || {});
  const hl = o.hl || [];
  const edge = (n) => hl.includes(n) ? 'border:2px solid var(--warn);box-shadow:0 0 0 2px var(--warn)' : 'border:1px solid var(--line-strong)';
  const reg = (n) => `<div style="${edge(n)};border-radius:8px;background:var(--surface);padding:0 4px;text-align:center;line-height:1.25"><div style="font-size:12px;font-weight:700;color:var(--muted)">${n}</div>` +
    `<div style="${MONO};font-weight:700;font-size:15px;white-space:nowrap">${r[n]}</div></div>`;
  const unit = (n, sub, inner) => `<div style="${edge(n)};border-radius:8px;padding:3px;display:grid;gap:3px"><div style="font-size:13px;line-height:1.1"><b>${n}</b></div>${inner}</div>`;
  const cpu = `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:3px 5px 5px;display:grid;gap:4px"><div style="text-align:center;font-weight:700;line-height:1.1">CPU</div>` +
    `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px">${reg('PC')}${reg('MAR')}${reg('MDR')}</div>` +
    `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px">${unit('CU', 'in charge', reg('CIR'))}${unit('ALU', 'does the maths', reg('ACC'))}</div></div>`;
  const lane = (k) => {
    const [name, col] = LANE[k];
    const l = (o.lit || {})[k];
    const chip = l ? `<span style="${MONO};white-space:nowrap;font-weight:700;font-size:15px;padding:0 10px;border-radius:999px;background:var(--surface);border:1px solid var(--line-strong)">${l.dir === 'in' ? '&larr; ' : ''}${l.v}${l.dir === 'out' ? ' &rarr;' : ''}</span>` : '';
    return `<div style="display:grid;gap:1px"><span style="font-weight:600;font-size:13px;white-space:nowrap">${name}</span>` +
      `<span style="height:20px;border-radius:999px;background:var(--surface-3, var(--surface-2));border:${l ? 3 : 2}px solid ${col};display:flex;align-items:center;justify-content:center">${chip}</span></div>`;
  };
  const rows = MEM.map(([a, v]) => `<tr${a === o.read ? ' style="outline:2px solid var(--warn);outline-offset:-2px"' : ''}><td style="padding:0 5px;color:var(--muted)">${a}</td>` +
    `<td style="padding:0 5px;white-space:nowrap;${MONO};font-weight:700;color:${/[A-Z]/.test(v) ? 'var(--syn-keyword, #c58af9)' : 'var(--syn-number, #fdd663)'}">${v}</td></tr>`).join('');
  const mem = `<div style="${hl.includes('Memory') ? edge('Memory') : 'border:1px solid var(--line-strong)'};border-radius:10px;background:var(--surface-2);padding:3px 6px;text-align:center"><b>Memory</b>` +
    `<table style="border-collapse:collapse;margin:2px auto 0;font-size:14px"><tr><th style="font-size:11px;color:var(--muted);padding:0 4px">Address</th><th style="font-size:11px;color:var(--muted);padding:0 4px">Holds</th></tr>${rows}</table></div>`;
  return `<div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(64px,0.8fr) 118px;gap:6px;align-items:center;padding:4px 6px;border:1px solid var(--line);border-radius:12px;background:var(--surface)">` +
    `${cpu}<div style="display:grid;gap:4px">${lane('addr')}${lane('data')}${lane('ctrl')}</div>${mem}</div>` +
    (o.caption ? `<p style="margin:4px 0 0;text-align:center;font-size:15px">${o.caption}</p>` : '');
}

// ---------------------------------------------------------------- step builders
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
  // One question with a picture: the facts and the picture on the left, the question on the right, so the question
  // starts at the top of the slide.
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
  return `<table style="border-collapse:collapse;font-size:14px;margin:0"><tr>${head.map((h) => `<th style="${cell};font-size:13px;color:var(--muted)">${h}</th>`).join('')}</tr>` +
    rows.map((r) => `<tr>${r.map((c) => `<td style="${cell}">${c}</td>`).join('')}</tr>`).join('') + '</table>';
};

// ---------------------------------------------------------------- Do Now 1: 0478/12 March 2024 Q2(a)
// Mark scheme: one mark for each letter and one for its matching correction: Statement B ... MAR stores addresses and
// not instructions; Statement C ... data is from the bus, not the PC // data is from the address in the MAR, not the PC.
// The walkthrough is the same kind of question about the ALU and the CU, never about these registers.
const WT_DN1 = { title: 'Walk me through it: find the wrong statement', steps: [
  { text: '<strong>A similar question.</strong> Two statements about the CPU. One is not correct. Find it, then correct it.', visual: line('P: The ALU carries out calculations.') + line('Q: The CU carries out calculations.') },
  { text: 'Read each statement and ask: is this the <b>real job</b> of that part? P: the ALU does carry out calculations. P is correct.', visual: line(kw('ALU') + ' carries out calculations: correct') },
  { text: 'Q: the CU does not carry out calculations. The CU is in charge: it sends control signals. So Q is ' + kw('not correct') + '.', visual: line('Q is the wrong one') },
  { text: 'Correct it: keep the part, and give its real job. "The CU sends control signals to the other parts." The letter is 1 mark, the correction is 1 mark.', visual: note('letter + correction = 2 marks') },
  { text: 'Now do the same for A to E: for each register, what does it really hold, and where does it get it from? Two statements are wrong.', visual: note('real job? real source?') },
] };
steps.push(written('do-now', 'Do Now: Find the Wrong Statements (1 of 2)',
  cite('0478/12 March 2024 Q2(a)') + ' ' + WRITE_DO, [
    { id: 'wrong-statements', prompt: 'Identify the letter of each incorrect statement. Suggest a corrected statement for each.', marks: 4,
      scheme: ['Statement B', '... the MAR stores addresses, not instructions', 'Statement C', '... the data comes from the (data) bus, not the PC // the data comes from the address in the MAR, not the PC'],
      guidance: 'One mark for each incorrect letter (B and C) and one mark for its matching correction. A correction earns its mark only with its letter. A correct letter with a wrong correction earns 1 of 2.',
      modelAnswer: 'B: the MAR stores addresses, not instructions. C: the MDR gets data from the address in the MAR, not the PC.' },
  ], '<p style="margin:0 0 6px">A computer has a central processing unit (CPU). The table contains five statements about the role of registers in a CPU. Two of the statements are not correct.</p>' + table(['Letter', 'Statement'], [['A', 'PC stores the address of the next instruction to be accessed'], ['B', 'MAR stores the instructions of the program that is running'],
    ['C', 'MDR stores the data passed to it from the PC'], ['D', 'ACC stores the result of each calculation'], ['E', 'CIR stores the instruction currently being executed']]), true));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2: 0478/13 June 2022 Q5(b)(ii)
// Mark scheme, any two from: to temporarily store; ... the address of the next data/instructions required; ... the
// address of the location in memory where data is to be stored; stores the address that is to be collected by the
// address bus. The walkthrough is the MDR's purpose (what it holds, where from), never the MAR's points.
const WT_DN2 = { title: 'Walk me through it: describe a register\'s purpose', steps: [
  { text: '<strong>A similar question.</strong> "Describe the purpose of the MDR in the CPU." It is worth 2 marks.', visual: note('2 marks: give 2 separate points') },
  { text: 'Point 1: what <b>kind of thing</b> does it hold? The MDR holds ' + kw('data or an instruction') + '.', visual: line('the MDR holds ' + kw('data or an instruction')) },
  { text: 'Point 2: <b>which</b> data, from <b>where</b>? The data that has just ' + kw('come from memory') + '.', visual: line('... that has ' + kw('come from memory')) },
  { text: 'Check: two separate points, one mark each. "It stores things" earns nothing: say exactly what, and where from.', visual: line('what it holds + where from = 2 marks') },
  { text: 'Now the MAR: what kind of thing does it hold, and which one? Where does it go next?', visual: note('what kind? which one? where next?') },
] };
steps.push(written('do-now-2', 'Do Now: The MAR (2 of 2)',
  'Recap of the last two lessons. ' + cite('0478/13, June 2022, Question 5(b)(ii)') + ' The memory address register (MAR) is one component built into the CPU. ' + WRITE_DO, [
    { id: 'mar-purpose', prompt: 'Describe the purpose of the MAR in the CPU.', marks: 2,
      scheme: ['To temporarily store ...', '... the address of the next data or instructions required', '... the address of the location in memory where data is to be stored', 'It stores the address that is to be collected by the address bus'],
      guidance: 'Any two from the points, one mark each. Points 2 and 3 follow on from point 1. "It stores data" with no address earns no mark.',
      modelAnswer: 'It temporarily stores the address of the next data or instruction needed.' },
  ]));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y10-3-1-l2',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on the parts of the CPU. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Go to the next slide when you are ready.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'The Fetch-Decode-Execute Cycle',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">The Fetch-Decode-Execute Cycle</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> how the CPU runs a program, one small move at a time, and <strong>why</strong> each move happens.', 'One tiny memory all lesson: four addresses, two instructions, two numbers.',
      '<strong>How this lesson works:</strong> on each slide, look at the picture, <strong>predict</strong> by picking an answer, then read why.']) +
    tps('Last lesson, the CPU read a value from memory on the buses. Predict: what does the CPU need to read from memory to run a program?', 'The instructions of the program, and the data they use. Both are stored in memory.') });

// ---------------------------------------------------------------- fetch, one move per slide
const PREDICT = 'look at the picture, then pick your prediction. The reason appears under it.';
const PREDICT2 = 'look at the picture, then pick a prediction for each question. The reason appears under each one.';
steps.push(mcStep('why-fetch', 'Why the CPU Must Fetch', todo(PREDICT) +
  facts(['The program is stored in memory: one instruction at each address.', 'The CPU can only carry out an instruction that is <strong>inside</strong> the CPU.']), [
    { prompt: 'Predict: LOAD 6 is stored in memory at address 4. What must happen before the CPU can carry it out?', options: ['A copy of LOAD 6 must come into the CPU', 'Nothing: the CPU carries it out inside memory', 'Memory must carry out LOAD 6 itself'], correct: 0,
      explain: 'A copy must come into the CPU, because the CPU can only work on what is inside it. Copying the next instruction from memory into the CPU is called fetch. It is the first stage.' },
  ], cpuPic({ caption: 'The PC holds 4: the address of the next instruction.' }) +
    tps('Why are the program and its data kept in memory, and not inside the CPU?', 'Memory holds a lot. The CPU only has a few registers, and each one holds one value.')));
steps.push(mcStep('fetch-1', 'Fetch, Move 1: Where Does the Address Go?', todo(PREDICT) +
  facts(['The PC holds 4: the address of the next instruction, LOAD 6.', 'Memory reads only the address held in one register.']), [
    { prompt: 'Predict: which register is the 4 copied into first?', options: ['MDR', 'MAR', 'CIR'], correct: 1,
      explain: 'The MAR (memory address register): memory reads only the address in the MAR. 4 is an address, so it travels on the address bus.' },
  ], cpuPic({ hl: ['PC'] })));
steps.push(mcStep('fetch-2', 'Fetch, Move 2: Reading Memory', todo(PREDICT) +
  facts(['The MAR sends 4 to memory on the address bus.', 'The CU sends a read signal on the control bus.']), [
    { prompt: 'Predict: what does memory send back, and into which register?', options: ['4, into the MDR', 'LOAD 6, into the MDR', 'LOAD 6, into the CIR'], correct: 1,
      explain: 'Memory sends back what it holds at address 4: LOAD 6. It travels on the data bus into the MDR (memory data register): the register for what has just come from memory.' },
  ], cpuPic({ regs: { MAR: '4' }, lit: { addr: { v: '4', dir: 'out' }, ctrl: { v: 'Read', dir: 'out' } }, read: 4 })));
steps.push(mcStep('fetch-3', 'Fetch, Move 3: What Happens to the PC?', todo(PREDICT) +
  facts(['LOAD 6 is in the MDR now.', 'The next instruction is stored straight after LOAD 6 in memory.']), [
    { prompt: 'Predict: what should the PC hold now?', options: ['4', '5', '6'], correct: 1,
      explain: 'The PC goes up by 1, to 5. The program is stored in order, so the next instruction is at the next address. Adding 1 to the PC is called incrementing it.' },
  ], cpuPic({ regs: { MAR: '4', MDR: 'LOAD 6' }, hl: ['PC'] })));
const cmp = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0">${[a, b].map(([h, rows]) => `<div style="border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2);padding:6px 12px"><b>${h}</b>` +
  rows.map((r) => `<div style="margin-top:3px">${r}</div>`).join('') + '</div>').join('')}</div>`;
steps.push(mcStep('fetch-3b', 'Compare: What If the PC Stayed at 4?', todo('compare the two CPUs, then pick your prediction. The reason appears under it.') +
  cmp(['CPU A: the PC goes up by 1', ['After fetching LOAD 6, the PC holds 5.', 'The next fetch reads address 5: ADD 7.']], ['CPU B: the PC stays the same', ['After fetching LOAD 6, the PC still holds 4.', 'The next fetch reads address 4: ?']]), [
    { prompt: 'Predict: what goes wrong in CPU B?', options: ['It stops at once', 'Nothing: memory knows what comes next', 'It fetches LOAD 6 again and again'], correct: 2,
      explain: 'Every fetch in CPU B reads address 4, so it fetches LOAD 6 again and again and never moves on. That is why the PC goes up by 1 in every fetch.' },
  ]));
steps.push(mcStep('fetch-4', 'Fetch, Move 4: Why Copy It to the CIR?', todo(PREDICT) +
  facts(['The CIR (current instruction register) is inside the CU.', 'Next, LOAD 6 needs the number stored at address 6.']), [
    { prompt: 'Predict: why is LOAD 6 copied from the MDR into the CIR?', options: ['The MDR can only hold numbers', 'The number from address 6 will arrive in the MDR and replace it', 'Memory needs LOAD 6 back'], correct: 1,
      explain: 'Everything that comes from memory arrives in the MDR. When the number from address 6 arrives, it replaces what was there. So LOAD 6 is copied into the CIR first, on the data bus, and kept safe inside the CU. This is the last move of fetch.' },
  ], cpuPic({ regs: { PC: '5', MAR: '4', MDR: 'LOAD 6' }, hl: ['MDR', 'CIR'] })));
steps.push(noteSlide('note-fetch', 'Your Notes: Fetch', [
  ['in your own words, explain WHY the address goes from the PC to the MAR first.', 'Memory only reads the address in the MAR. So the address of the next instruction is copied from the PC into the MAR.'],
  ['explain WHY the PC goes up by 1 during fetch.', 'The program is stored in order. Adding 1 makes the PC hold the address of the next instruction, so the CPU does not fetch the same instruction again.'],
  ['explain WHY the instruction is copied from the MDR into the CIR.', 'The next value from memory will arrive in the MDR and replace it. The CIR keeps the instruction safe inside the CU.']]));

// 0478/13 June 2025 Q3(b) (any three from PC, MAR, MDR, CIR) and Q3(c) (control bus, data bus: the address bus is not
// in its list). Adapted: "of the fetch-decode-execute (FDE) cycle" left out (decode, execute and cycle come later); (c)
// typed instead of circled.
const FETCH_LEAD = ' A computer with a Von Neumann architecture has several hardware components. ' + WRITE_DO;
steps.push(written('exam-fetch', 'Exam Question: Registers in Fetch (1 of 2)',
  cite('0478/13, June 2025, Question 3(b)') + FETCH_LEAD, [
    { id: 'fetch-regs', prompt: '(b) Identify three registers that are used in the fetch stage.', marks: 3,
      scheme: ['Program counter (PC)', 'Memory address register (MAR)', 'Memory data register (MDR)', 'Current instruction register (CIR)'],
      guidance: 'Any three, one mark each. The accumulator (ACC) is not used in the fetch stage. A register named twice earns one mark.',
      modelAnswer: 'PC, MAR, MDR.' },
  ]));
steps.push(written('exam-fetch-2', 'Exam Question: Buses in Fetch (2 of 2)',
  cite('0478/13, June 2025, Question 3(c) (adapted: typed, not circled)') + FETCH_LEAD, [
    { id: 'fetch-buses', prompt: '(c) Two of these words name buses that are used in the fetch stage. Type the two words: binary, control, denary, data, information, hardware, software.', marks: 2,
      scheme: ['Control (bus)', 'Data (bus)'],
      guidance: 'One mark for each correct bus: control and data. Typing more than two words from the list earns no marks. Address is not in the list.',
      modelAnswer: 'Control, data.' },
  ]));

steps.push(embed('activity-1', 'Activity 1: Fetch, One Move at a Time', 'cpu-lab',
  '<strong>What to do:</strong> for each move, click the box the value goes to next, then the bus when something goes to or from memory (from level 2, also the value). A wrong pick means the round does not count. <strong>Done</strong> when you have cleared level 2 (two rounds in a row with every move right, at each level). The help gets less as you go up.',
  'activity=fde&level=1&upto=2'));

// 0478/12 June 2024 Q5(a): address; MAR; RAM; MDR; data; CIR; CU, one mark each in the correct place.
const W = (w) => `^\\s*(the\\s+|an?\\s+)?${w}\\s*\\.?\\s*$`;
const MAR = W('(memory\\s*address\\s*register|mar)(\\s*\\(\\s*mar\\s*\\))?');
const MDR = W('(memory\\s*data\\s*register|mdr)(\\s*\\(\\s*mdr\\s*\\))?');
const CIR = W('(current\\s*instruction\\s*register|cir)(\\s*\\(\\s*cir\\s*\\))?');
const CU = W('(control\\s*unit|cu)(\\s*\\(\\s*cu\\s*\\))?');
const RAM = W('(random\\s*access\\s*memory|ram)(\\s*\\(\\s*ram\\s*\\))?');
const ALU = W('(arithmetic\\s*(and\\s*)?logic\\s*unit|alu)(\\s*\\(\\s*alu\\s*\\))?');
const LIST1 = 'address, arithmetic logic unit (ALU), binary, control unit (CU), current instruction register (CIR), data, denary, driver, fetch, interrupt, memory address register (MAR), memory data register (MDR), random access memory (RAM), read only memory (ROM), secondary storage, signal';
steps.push(checkStep('exam-gapfill', 'Exam Question: Fetching an Instruction',
  cite('0478/12, June 2024, Question 5(a)') + ' Complete the paragraph about fetching an instruction into the CPU. Use each term from the list once at most. <strong>What to do:</strong> type a term in each box, then press Check answers.<br><span style="font-size:14px"><b>List:</b> ' + LIST1 + '.</span>', [
    { label: '(1) The program counter contains the ........ of the next instruction to be processed;', answer: W('address'), feedback: 'What does the PC hold about the next instruction?' },
    { label: '(2) this is then sent to the ........ using the address bus.', answer: MAR, feedback: 'Which register holds the address memory is about to read?' },
    { label: '(3) The address is then sent to the ........ .', answer: RAM, feedback: 'Where is the instruction stored? Use the name from the list.' },
    { label: '(4) Once the address is received, the instruction stored at the location is sent to the ........,', answer: MDR, feedback: 'Which register holds what has just come from memory?' },
    { label: '(5) using the ........ bus.', answer: W('data(\\s*bus)?'), feedback: 'An instruction is not an address. Which bus carries instructions?' },
    { label: '(6) The instruction is then sent to the ........', answer: CIR, feedback: 'Which register holds the instruction while it is worked on?' },
    { label: '(7) that is built into the ........ .', answer: CU, feedback: 'Which part of the CPU is the CIR built into?' },
  ], '', 2));

// ---------------------------------------------------------------- decode, execute, the cycle
steps.push(mcStep('decode', 'Decode: Why the CU Works It Out First', todo(PREDICT) +
  facts(['LOAD 6 is in the CIR, inside the CU.', 'LOAD 6 copies a number into the ACC. ADD 7 makes the ALU add a number to the ACC.']), [
    { prompt: 'Predict: why must the CU work out what the instruction means before anything else happens?', options: ['The ALU can only add numbers', 'Each instruction needs different parts to do different jobs', 'The instruction must be sent back to memory'], correct: 1,
      explain: 'Each instruction is different, so the CU must know which parts to use before anything is done. Working out what an instruction means is called decode. The CU uses the instruction set (the list of commands the CPU can carry out) to decode it.' },
  ], cpuPic({ regs: { PC: '5', MAR: '4', MDR: 'LOAD 6', CIR: 'LOAD 6' }, hl: ['CU'] })));
steps.push(mcStep('decode-2', 'Compare: LOAD 6 and ADD 6', todo('compare the two instructions, then pick your prediction. The reason appears under it.') +
  cmp(['LOAD 6', ['It names address 6.', 'Address 6 holds 12.']], ['ADD 6', ['It names address 6.', 'Address 6 holds 12.']]), [
    { prompt: 'Predict: both name address 6. What is different about them once they are decoded?', options: ['Which address is read', 'Nothing: they do the same job', 'What is done with the number from address 6'], correct: 2,
      explain: 'Both read the 12 at address 6. LOAD copies it into the ACC. ADD makes the ALU add it to the ACC. Decoding tells the CU which of these to do.' },
  ]));
steps.push(mcStep('execute', 'Execute: Carrying Out the Instruction', todo(PREDICT) +
  facts(['The CU has decoded LOAD 6. Carrying it out is the next stage, called <strong>execute</strong>. The 6 is an address.']), [
    { prompt: 'Predict: LOAD 6 is executed. What does the ACC hold afterwards?', options: ['6', '12', '4'], correct: 1,
      explain: '12. The 6 is an address. It goes to the MAR, memory sends back what it holds there (12) into the MDR, and 12 is copied into the ACC.' },
  ], cpuPic({ regs: { PC: '5', MAR: '4', MDR: 'LOAD 6', CIR: 'LOAD 6' } })));
steps.push(mcStep('execute-2', 'Execute: ADD 7', todo(PREDICT) +
  facts(['LOAD 6 has been executed. Next, ADD 7 is fetched, decoded and executed.', 'The 7 in ADD 7 is an address.']), [
    { prompt: 'Predict: what does the ACC hold after ADD 7 is executed?', options: ['19', '30', '42'], correct: 2,
      explain: 'Address 7 holds 30. The ALU works out 12 + 30 = 42, and the result goes into the ACC. 19 would be adding the address itself.' },
  ], cpuPic({ regs: { PC: '6', MAR: '5', MDR: 'ADD 7', CIR: 'ADD 7', ACC: '12' }, hl: ['ALU'] })));

// One whole cycle, one register move per step (the stepper the student drives).
const S0 = { PC: '4' };
const reg = (o) => Object.assign({}, START, o);
const watch = [
  ['Start', reg(S0), {}, 'The PC holds 4, the address of the next instruction.'],
  ['Fetch 1: PC to MAR', reg({ MAR: '4' }), { hl: ['MAR'], lit: { addr: { v: '4', dir: 'out' } } }, 'The address 4 is copied from the PC into the MAR, on the address bus.'],
  ['Fetch 2: MAR to memory', reg({ MAR: '4' }), { hl: ['Memory'], lit: { addr: { v: '4', dir: 'out' }, ctrl: { v: 'Read', dir: 'out' } }, read: 4 }, 'The MAR sends 4 to memory on the address bus. The CU sends a read signal on the control bus.'],
  ['Fetch 3: memory to MDR', reg({ MAR: '4', MDR: 'LOAD 6' }), { hl: ['MDR'], lit: { data: { v: 'LOAD 6', dir: 'in' } }, read: 4 }, 'Memory sends LOAD 6 back on the data bus, into the MDR.'],
  ['Fetch 4: PC + 1', reg({ PC: '5', MAR: '4', MDR: 'LOAD 6' }), { hl: ['PC'] }, 'The PC is incremented to 5: the address of the next instruction.'],
  ['Fetch 5: MDR to CIR', reg({ PC: '5', MAR: '4', MDR: 'LOAD 6', CIR: 'LOAD 6' }), { hl: ['CIR'], lit: { data: { v: 'LOAD 6', dir: '' } } }, 'LOAD 6 is copied from the MDR into the CIR, inside the CU.'],
  ['Decode', reg({ PC: '5', MAR: '4', MDR: 'LOAD 6', CIR: 'LOAD 6' }), { hl: ['CU'] }, 'The CU decodes LOAD 6 using the instruction set: copy the number at address 6 into the ACC.'],
  ['Execute 1: CIR to MAR', reg({ PC: '5', MAR: '6', MDR: 'LOAD 6', CIR: 'LOAD 6' }), { hl: ['MAR'], lit: { addr: { v: '6', dir: 'out' } } }, 'LOAD 6 needs address 6, so 6 goes into the MAR.'],
  ['Execute 2: MAR to memory', reg({ PC: '5', MAR: '6', MDR: 'LOAD 6', CIR: 'LOAD 6' }), { hl: ['Memory'], lit: { addr: { v: '6', dir: 'out' }, ctrl: { v: 'Read', dir: 'out' } }, read: 6 }, 'The MAR sends 6 to memory, with a read signal.'],
  ['Execute 3: memory to MDR', reg({ PC: '5', MAR: '6', MDR: '12', CIR: 'LOAD 6' }), { hl: ['MDR'], lit: { data: { v: '12', dir: 'in' } }, read: 6 }, 'Memory sends 12 back on the data bus, into the MDR. LOAD 6 is safe in the CIR.'],
  ['Execute 4: MDR to ACC', reg({ PC: '5', MAR: '6', MDR: '12', CIR: 'LOAD 6', ACC: '12' }), { hl: ['ACC'], lit: { data: { v: '12', dir: '' } } }, '12 is copied into the ACC. LOAD 6 is done.'],
  ['Back to fetch', reg({ PC: '5', MAR: '6', MDR: '12', CIR: 'LOAD 6', ACC: '12' }), { hl: ['PC'] }, 'The CPU goes back to fetch. The PC holds 5, so the next instruction it fetches is ADD 7.'],
];
steps.push({ id: 'watch-load', label: 'Watch LOAD 6 from Start to Finish', type: 'stepper', stepperId: `${P}-watch`,
  stepperSteps: watch.map(([title, regs, o, say]) => ({ title, html: `<p style="margin:0 0 6px;font-size:18px">${say}</p>` + cpuPic(Object.assign({ regs }, o)) })),
  content: '<h2 class="lesson-h2">Watch LOAD 6 from Start to Finish</h2>' + todo('press <strong>Next step</strong> to watch LOAD 6 one move at a time. Say each move before you press. Done when you reach Back to fetch.') + `<div id="${P}-watch"></div>` });

steps.push(mcStep('why-cycle', 'After Execute: What Next?', todo(PREDICT) +
  facts(['LOAD 6 has been fetched, decoded and executed.', 'The PC holds 5.']), [
    { prompt: 'Predict: what does the CPU do next?', options: ['Stop: LOAD 6 is finished', 'Fetch the instruction at address 5', 'Execute LOAD 6 again'], correct: 1,
      explain: 'It goes back to fetch, using the address in the PC: 5. It fetches ADD 7, decodes it and executes it, then fetches the next one. The same three stages repeat for every instruction, so it is called the fetch-decode-execute (FDE) cycle.' },
  ], cpuPic({ regs: { PC: '5', MAR: '6', MDR: '12', CIR: 'LOAD 6', ACC: '12' }, hl: ['PC'] })));
steps.push(noteSlide('note-cycle', 'Your Notes: Decode, Execute and the Cycle', [
  ['explain WHY the CU decodes an instruction before it is executed.', 'Each instruction needs different parts to do different jobs. Decoding tells the CU what to do. It uses the instruction set.'],
  ['explain WHY LOAD 6 puts 12 into the ACC, and not 6.', 'The 6 is an address. The CPU reads the number stored at address 6, which is 12.'],
  ['explain WHY it is called a cycle.', 'After execute, the CPU goes back to fetch the next instruction, using the PC. The same three stages repeat for every instruction.']]));
// Fetch and execute both use the MAR, memory and the MDR: what comes back from memory tells them apart.
steps.push(mcStep('fetch-or-execute', 'Compare: Fetch or Execute?', todo('compare the two columns, then pick your prediction. The reason appears under it.') +
  cmp(['Fetch: getting the next instruction', ['The MAR gets the address from the <b>PC</b>: 4.', 'Memory sends back an <b>instruction</b>: LOAD 6.', 'It goes into the MDR, then the CIR.']],
    ['Execute: LOAD 6 is carried out', ['The MAR gets the address in <b>LOAD 6</b>: 6.', 'Memory sends back a <b>number</b>: 12.', 'It goes into the MDR, then the ACC.']]) +
  tps('Both columns use the MAR, memory and the MDR. So what is different about them?', 'Where the address comes from, and what comes back. The left column uses the address in the PC and gets an instruction. The right column uses the address in the instruction and gets a number.'), [
    { prompt: 'Predict: the MAR holds 7 and memory sends the number 30 into the MDR, because ADD 7 needs it. Which stage is this?', options: ['Fetch', 'Execute'], correct: 1,
      explain: 'Execute. A number has come back, because the instruction ADD 7 asked for it. Fetch only ever gets the next instruction.' },
  ]));
steps.push(mcStep('check-stage', 'Check: Which Stage?',
  todo('pick the stage for each move. Ask: is the CPU getting the next instruction (fetch), working out what it means (decode), or carrying it out (execute)? Done when all four are answered.'), [
    { prompt: 'The PC goes up by 1. Which stage is this?', options: ['Fetch', 'Decode', 'Execute'], correct: 0,
      explain: 'Fetch. The PC goes up by 1 while the instruction is being fetched, so it holds the address of the next one.' },
    { prompt: 'Memory sends the instruction ADD 7 into the MDR. Which stage is this?', options: ['Execute', 'Fetch', 'Decode'], correct: 1,
      explain: 'Fetch. An instruction is coming into the CPU.' },
    { prompt: 'LOAD 6 is in the CIR. Memory sends the number 12 into the MDR. Which stage is this?', options: ['Fetch', 'Decode', 'Execute'], correct: 2,
      explain: 'Execute. LOAD 6 is being carried out, and it needs the number at address 6. A number, not an instruction, has come back.' },
    { prompt: 'The ALU works out 12 + 30. Which stage is this?', options: ['Decode', 'Execute', 'Fetch'], correct: 1,
      explain: 'Execute. The instruction ADD 7 has been fetched and decoded; now it is carried out.' },
  ]));

steps.push(embed('activity-2', 'Activity 2: The Whole Cycle', 'cpu-lab',
  '<strong>What to do:</strong> say which stage starts, then pick each move: the box the value goes to, the bus when memory is used, and the value. A wrong pick means the round does not count. <strong>Done</strong> when you have cleared level 5: two instructions in a row with no help.',
  'activity=fde&level=3&upto=5'));
steps.push(embed('activity-3', 'Activity 3: FDE Steps', 'fde-steps',
  '<strong>What to do:</strong> answer one small question at a time. Start at stage 1 and move on when a stage is mastered. The help gets less as you get questions right. Stage 5 runs a whole instruction with no help. Keep going: it saves your progress.'));
steps.push(embed('extension-3d', 'Extension: One Whole Instruction in 3D', 'cpu-lab-3d',
  '<strong>Extension:</strong> finished Activity 2? Walk round the lab with W A S D. Tap <strong>Space</strong> to pick up a value and tap it again to put it down. Take the next instruction from memory, then carry it out. A mistake ends that round and a new one starts. Go to the next slide when you are ready.',
  'mission=one-c'));

// ---------------------------------------------------------------- exam questions
const DECODE = W('decod(e|ing)');
const EXECUTE = W('execut(e|ing|ion)');
const PC = W('(program\\s*counter|pc)(\\s*\\(\\s*pc\\s*\\))?');
steps.push(checkStep('exam-names', 'Exam Questions: Name It',
  cite('0478/11 June 2022 Q2(a)(ii); 0478/13 November 2025 Q2(a); 0478/13 June 2026 Q3(c)(i); 0478/11 November 2024 Q5(c)') + ' <strong>What to do:</strong> type each answer, then press Check answers.', [
    { label: '(a) The CPU performs a cycle to process data. Fetch is the first stage in this cycle. State the name of the second stage.', answer: DECODE, feedback: 'What happens to the instruction once it is in the CIR?' },
    { label: '(b) State the name of the third stage.', answer: EXECUTE, feedback: 'What happens once the CU knows what the instruction means?' },
    { label: '(c) Give the name of the first register that is used in the fetch part of the cycle.', answer: PC, feedback: 'Which register holds the address of the next instruction?' },
    { label: '(d) The control unit uses a list to decode the instructions into commands that can be processed. Give the name of the list.', answer: W('instruction\\s*sets?'), feedback: 'It is the list of commands the CPU can carry out.' },
    { label: '(e) Give one register in the CPU that is used in the execute stage of the cycle.', answer: W('(accumulator|acc|memory\\s*address\\s*register|mar|memory\\s*data\\s*register|mdr)(\\s*\\(\\s*(acc|mar|mdr)\\s*\\))?'), feedback: 'LOAD 6 reads address 6 and puts 12 somewhere. Which registers did that use?' },
  ]));
steps.push(written('exam-decode', 'Exam Question: The Decode Stage',
  cite('0478/11, November 2024, Question 5(b)') + ' A central processing unit (CPU) performs the fetch-decode-execute (FDE) cycle. ' + WRITE_DO, [
    { id: 'decode', prompt: '(b) Describe what happens at the decode stage of the cycle.', marks: 3,
      scheme: ['The CIR or CU receives the instruction from the MDR // the instruction is sent from the MDR to the CIR or CU', '... using the data bus', 'The instruction is separated into opcode and operand', 'The control unit decodes the instruction', '... using an instruction set'],
      guidance: 'Any three, one mark each. Point 2 follows on from point 1, and point 5 follows on from point 4. "The instruction is decoded" with no CU earns no mark for point 4.',
      modelAnswer: 'The instruction is sent from the MDR to the CIR. The CU decodes it using the instruction set.' },
  ]));
steps.push(written('exam-describe', 'Exam Question: Describe the Fetch Stage',
  cite('0478/11, June 2024, Question 5(d) (adapted: describe, not draw and annotate)') + ' The computer processes instructions using the fetch-decode-execute (FDE) cycle. ' + WRITE_DO, [
    { id: 'fetch-describe', prompt: 'Describe the process of the fetch stage of the FDE cycle.', marks: 4,
      scheme: ['Names the registers MAR, MDR and PC', 'The address is sent from the PC to the MAR', '... using the address bus', '... the PC is incremented', 'The address is sent from the MAR to RAM',
        'The data or instruction is sent from RAM to the MDR', '... using the data bus', 'The data or instruction is sent from the MDR to the CIR or CU', 'The control unit sends a control signal for any part of the process', '... using the control bus'],
      guidance: 'Any four, one mark each. The address bus, data bus and control bus marks can be given anywhere they are used correctly. A point marked ... follows on from the point before it.',
      modelAnswer: 'The PC sends the address to the MAR on the address bus, then the PC is incremented. The instruction is sent from RAM to the MDR.' },
  ]));
const LIST2 = 'address bus, Arithmetic Logic Unit (ALU), calculations, data bus, decoded, execute, fetched, interrupt, Memory Address Register (MAR), Memory Data Register (MDR), Program Counter (PC), protocol, ROM, stored';
steps.push(checkStep('exam-paragraph', 'Exam Question: How an Instruction Is Processed',
  cite('0478/13, November 2022, Question 7') + ' Complete the paragraph using the list of terms. Not all terms need to be used. <strong>What to do:</strong> type a term in each box, then press Check answers.<br><span style="font-size:14px"><b>List:</b> ' + LIST2 + '.</span>', [
    { label: '(1) An instruction is ........ from RAM into the CPU,', answer: W('fetch(ed)?'), feedback: 'Which stage brings an instruction into the CPU?' },
    { label: '(2) where it is temporarily stored in the ........ .', answer: MDR, feedback: 'Which register holds what has just come from memory?' },
    { label: '(3) The instruction is then sent along the ........', answer: W('data\\s*bus'), feedback: 'Which bus carries instructions? Type the whole name.' },
    { label: '(4) to the Control Unit (CU) to be ........ .', answer: W('decoded?'), feedback: 'What does the CU do with an instruction first?' },
    { label: '(5) The ........ will then perform any', answer: ALU, feedback: 'Which part does the maths?' },
    { label: '(6) ........ and logic operations that are required', answer: W('calculations?'), feedback: 'What does that part do, as well as logic?' },
    { label: '(7) to ........ the instruction.', answer: W('execut(e|ed)'), feedback: 'Which stage carries out the instruction?' },
  ], '', 2));

// ---------------------------------------------------------------- notes check, plenary, practice paper
steps.push({ id: 'notes-check', label: 'Notes Check: Your WHY Notes',
  content: '<h2 class="lesson-h2">Notes Check: Your WHY Notes</h2>' + todo('open your notes (the notepad button at the top). You should have each note below, in your own words. Missing one? Go back to the slide named, write it, and press Check my note. Then go to the next slide.') +
    facts(['<strong>WHY the address goes from the PC to the MAR first. WHY the PC goes up by 1. WHY the instruction goes into the CIR.</strong> Slide: Your Notes: Fetch.',
      '<strong>WHY the CU decodes before anything is executed. WHY LOAD 6 puts 12 into the ACC. WHY it is a cycle.</strong> Slide: Your Notes: Decode, Execute and the Cycle.']) });
steps.push(embed('plenary', 'Plenary: Fetch-Decode-Execute Drill', 'drill-' + ID,
  '<strong>What to do:</strong> answer every card. Pick the answer that earns the mark, then type it. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.'));
steps.push({ id: 'exam-paper', label: 'Practice Paper: The FDE Cycle', type: 'app-link', appId: 'exampaper', appQuery: 'paper=y10-3-1-l4-paper', buttonId: `${P}-open-paper`,
  content: '<h2 class="lesson-h2">Practice Paper: The FDE Cycle</h2>' + todo('Open the practice paper. Answer every question, then press Submit paper. You get all your marks at once. You can take it again to improve.') +
    `<p><button type="button" class="donow-btn" id="${P}-open-paper">Open the practice paper</button></p>` });

// ---------------------------------------------------------------- the plenary drill: this lesson only
// pickThenType cards (pick the answer that earns the mark, then type it), each with two working nudges and a worked
// example on a similar question that never holds the card's own answer. Numbers are the lesson's (4: LOAD 6, 5: ADD 7,
// 6: 12, 7: 30). Order cards have a keyword pattern so a typed order is checked, not the words alone.
const card = (id, category, prompt, answers, distractors, noteText, working, example, extra = {}) =>
  Object.assign({ id, category, prompt, answers, distractors, note: noteText, working, pickThenType: true }, example ? { example } : {}, extra);
// Whole-answer patterns for cards whose bag of words would also take a distractor (memory ... register).
const K = (body) => ({ keywords: [new RegExp('^\\s*(the\\s+|an?\\s+)?(' + body + ')\\s*\\.?\\s*$', 'i')] });
const R = { MAR: 'Memory address register (MAR)', MDR: 'Memory data register (MDR)', CIR: 'Current instruction register (CIR)', ACC: 'Accumulator (ACC)', PC: 'Program counter (PC)', CU: 'Control unit (CU)', ALU: 'Arithmetic logic unit (ALU)' };
const cards = [
  card('f-01', 'fetch', 'The PC holds 4.\nIn the fetch stage, which register is the 4 copied into first?', [R.MAR], [R.MDR, R.CIR, R.ACC], 'Memory only reads the address in the MAR, so the PC\'s address goes there first.',
    ['Memory reads only the address held in one register.', 'Which register holds the address memory is about to read?'],
    'A similar question: which register holds what has just come from memory?\nStep 1: it has come from memory, so it is data or an instruction, not an address.\nStep 2: the register for data from memory has "data" in its name.\nNow your question: the 4 is an address. Which register has "address" in its name?', K('(memory\\s*address\\s*register|mar)(\\s*\\(\\s*mar\\s*\\))?')),
  card('f-02', 'fetch', 'Memory sends back LOAD 6, the instruction stored at address 4.\nWhich register does LOAD 6 go into?', [R.MDR], [R.MAR, R.CIR, R.PC], 'Everything that comes from memory arrives in the MDR first.',
    ['It has just come from memory.', 'Is LOAD 6 an address, or what was found at the address?'],
    'A similar question: which register is the address of the next instruction copied into?\nStep 1: it is an address.\nStep 2: the register that holds the address memory reads has "address" in its name.\nNow your question: LOAD 6 is not an address. It is what memory sent back.', K('(memory\\s*data\\s*register|mdr)(\\s*\\(\\s*mdr\\s*\\))?')),
  card('f-03', 'fetch', 'Which bus carries the address 4 from the MAR to memory?', ['Address bus'], ['Data bus', 'Control bus'], 'An address is a place in memory. Addresses travel on the address bus.',
    ['Is 4 a place in memory, a value, or a signal?', 'Each bus is named after what it carries.'],
    'A similar question: which bus carries the read signal from the CU to memory?\nStep 1: read is a command: a control signal.\nStep 2: control signals travel on the control bus.\nNow your question: what kind of thing is 4 here?', K('address(\\s*bus)?')),
  card('f-04', 'fetch', 'Which bus carries the instruction LOAD 6 from memory into the MDR?', ['Data bus'], ['Address bus', 'Control bus'], 'Data and instructions travel on the data bus.',
    ['LOAD 6 is not a place in memory.', 'Which bus carries data and instructions?'],
    'A similar question: which bus carries the address 6 out to memory?\nStep 1: 6 is a place in memory: an address.\nStep 2: so it goes on the address bus.\nNow your question: LOAD 6 is an instruction, not an address.', K('data(\\s*bus)?')),
  card('f-05', 'fetch', 'The PC holds 4. LOAD 6 has just been fetched.\nWhat does the PC hold after it is incremented?', ['5'], ['4', '6', '0'], 'The PC goes up by 1, so it holds the address of the next instruction: 5.',
    ['Incremented means 1 is added.', 'Start from the number the PC holds now.'],
    'A similar question: the PC holds 9. What does it hold after it is incremented?\nStep 1: incremented means add 1.\nStep 2: 9 + 1 = 10.\nNow your question: start from the PC\'s number. Ignore the 6 in LOAD 6: that is not the PC.'),
  card('f-06', 'fetch', 'Why does the PC go up by 1 in the fetch stage?', ['So it holds the address of the next instruction'], ['So the ALU has a number to add', 'So memory knows the instruction has finished', 'So the instruction is decoded faster'], 'The program is stored in order. Without the +1 the CPU would fetch the same instruction again and again.',
    ['The program is stored in order, one instruction after another.', 'What would the next fetch read if the PC stayed the same?'],
    'A similar question: why is the address copied from the PC into the MAR?\nStep 1: memory only reads the address in the MAR.\nStep 2: so the MAR must hold the address of the instruction to fetch.\nNow your question: think about the fetch after this one.', { keywords: [/^(?=.*\bnext\b)(?=.*\b(address|instruction)).*$/i] }),
  card('f-07', 'fetch', 'Why is LOAD 6 copied from the MDR into the CIR?', ['The next value from memory will arrive in the MDR and replace it'], ['The MDR can only hold numbers', 'Memory needs the instruction back', 'The CIR adds the numbers'], 'The MDR is needed again for the number from address 6, so the instruction is kept safe in the CIR, inside the CU.',
    ['LOAD 6 needs the number at address 6.', 'Where does that number arrive when it comes from memory?'],
    'A similar question: why does the PC keep its own number and send a copy to the MAR?\nStep 1: the MAR will be used for other addresses too.\nStep 2: the PC must still know where the next instruction is.\nNow your question: what happens to the MDR when the next value comes from memory?'),
  card('d-01', 'exec', 'Which part decodes the instruction in the CIR?', [R.CU], [R.ALU, R.MDR, R.PC], 'The CU is in charge: it decodes the instruction, then sends signals to the parts that carry it out.',
    ['Decoding means working out what the instruction means.', 'The CIR is built into this part.'], null),
  card('d-02', 'exec', 'What does the CU use to decode an instruction?', ['The instruction set'], ['The accumulator', 'The address bus', 'The program counter'], 'The instruction set is the list of commands the CPU can carry out.',
    ['It is a list.', 'A list of every command the CPU can carry out.'], null),
  card('d-03', 'exec', 'Why must an instruction be decoded before it is executed?', ['Each instruction needs different parts to do different jobs'], ['The ALU can only add numbers', 'The instruction must be sent back to memory', 'Memory must check the instruction first'], 'LOAD 6 copies a number into the ACC; ADD 7 makes the ALU add. The CU must know which before it starts.',
    ['Compare LOAD 6 and ADD 7: do they use the same parts?', 'The CU must know what to do before anything is done.'],
    'A similar question: why does a cook read a recipe step before starting it?\nStep 1: each step needs different tools and actions.\nStep 2: the cook must know which before starting.\nNow your question: think about LOAD and ADD.'),
  card('d-04', 'exec', 'LOAD 6 is executed. Address 6 holds 12.\nWhat does the ACC hold now?', ['12'], ['6', '4', '18'], 'The 6 in LOAD 6 is an address. The CPU reads the number stored there, 12, and copies it into the ACC.',
    ['The 6 is an address, not the number.', 'Look in memory at that address.'],
    'A similar question: LOAD 7 is executed. Address 7 holds 30. What does the ACC hold?\nStep 1: 7 is an address.\nStep 2: address 7 holds 30.\nStep 3: LOAD copies 30 into the ACC.\nNow your question: do the same with address 6.'),
  card('d-05', 'exec', 'The ACC holds 12. ADD 7 is executed. Address 7 holds 30.\nWhat does the ACC hold now?', ['42'], ['30', '19', '18'], 'The ALU works out 12 + 30 = 42 and the result goes into the ACC.',
    ['The 7 is an address. What is stored there?', 'ADD adds that number to the ACC.'],
    'A similar question: the ACC holds 5. ADD 6 is executed. Address 6 holds 12. What does the ACC hold?\nStep 1: 6 is an address: it holds 12.\nStep 2: the ALU adds 5 + 12 = 17.\nStep 3: the result goes into the ACC.\nNow your question: do the same with address 7.'),
  card('d-06', 'exec', 'Which part works out 12 + 30 when ADD 7 is executed?', [R.ALU], [R.CU, R.ACC, R.MDR], 'The ALU (arithmetic logic unit) does the calculations. Its result goes into the ACC.',
    ['Adding is arithmetic.', 'Which unit has "arithmetic" in its name?'], null),
  card('c-01', 'cycle', 'Name the three stages of the cycle, in order.', ['Fetch, decode, execute'], ['Decode, fetch, execute', 'Fetch, execute, decode', 'Execute, decode, fetch'], 'Fetch brings the instruction in, decode works out what it means, execute carries it out.',
    ['The instruction must come into the CPU first.', 'It must be worked out before it is carried out.'], null,
    { keywords: [/^\s*fetch(ing)?\W+(then\s+)?decod(e|ing)\W+(then\s+|and\s+)?execut(e|ing)\s*\.?\s*$/i], format: 'Type the three stages, in order' }),
  card('c-02', 'cycle', 'LOAD 6 has been executed. The PC holds 5.\nWhat does the CPU do next?', ['Fetch the instruction at address 5'], ['Stop: LOAD 6 is finished', 'Execute LOAD 6 again', 'Decode LOAD 6 again'], 'It goes back to fetch, using the address in the PC. The stages repeat for every instruction.',
    ['After execute, which stage comes next?', 'The PC says where the next instruction is.'],
    'A similar question: ADD 7 has been executed and the PC holds 6. What next?\nStep 1: after execute, the cycle starts again with fetch.\nStep 2: fetch uses the address in the PC: 6.\nNow your question: use the PC\'s number.'),
  card('c-05', 'cycle', 'The CU works out what LOAD 6 means, using the instruction set.\nWhich stage is this?', ['Decode'], ['Fetch', 'Execute'], 'Working out what an instruction means is decode.',
    ['The instruction is already in the CIR.', 'Nothing is carried out yet.'], null, K('decod(e|ing)(\\s*stage)?')),
  card('c-06', 'cycle', 'LOAD 6 is in the CIR. Memory sends the number 12 into the MDR.\nWhich stage is this?', ['Execute'], ['Fetch', 'Decode'], 'A number has come back because LOAD 6 asked for it, so LOAD 6 is being carried out. Fetch only gets the next instruction.',
    ['What has come back from memory: an instruction or a number?', 'Is the CPU getting the next instruction, or a number that an instruction asked for?'], null, K('execut(e|ing)(\s*stage)?')),
  card('c-07', 'cycle', 'The PC holds 5. Memory sends the instruction ADD 7 into the MDR.\nWhich stage is this?', ['Fetch'], ['Execute', 'Decode'], 'An instruction is coming into the CPU, so this is fetch.',
    ['What has come back from memory: an instruction or a number?', 'Is the CPU getting the next instruction, or a number that an instruction asked for?'], null, K('fetch(ing)?(\s*stage)?')),
  card('e-01', 'exam', 'Identify two components within the CPU that are used in the fetch stage of the cycle.\nGive one.', [R.MAR, R.MDR, R.PC, R.CU, 'Address bus', 'Data bus', 'Control bus'], [R.ALU, R.ACC, 'Hard disk drive (HDD)', 'Instruction set'],
    'From Cambridge IGCSE 0478/11, June 2022, Question 2(a)(iii).', ['Think of the moves in fetch: PC to MAR, memory to MDR, MDR to CIR.', 'The ALU and the ACC are used in execute.'], null),
  card('e-02', 'exam', 'State what is meant by an instruction set.', ['A list of commands that can be processed by the CPU'], ['The set of registers in the CPU', 'A list of addresses in memory', 'The bus that carries instructions'], 'From Cambridge IGCSE 0478/12, June 2024, Question 5(b).',
    ['The CU uses it to decode.', 'It is a list. A list of what?'], null),
];
const drill = { title: 'Year 10, 3.1.4: The Fetch-Decode-Execute Cycle', subtitle: 'Cambridge IGCSE Computer Science 0478',
  categories: [['fetch', 'Fetch: each move and why'], ['exec', 'Decode and execute'], ['cycle', 'The cycle and its stages'], ['exam', 'Exam wording']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 2 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
  if (c.example) c.answers.forEach((a) => assert(!c.example.toLowerCase().includes(a.toLowerCase()), `card ${c.id}: example holds its answer`));
  assert(drill.categories.some(([k]) => k === c.category), `card ${c.id} category`);
});
assert(cards.length >= 15 && cards.length <= 20, 'drill size ' + cards.length);
assert(12 + 30 === 42 && 5 + 12 === 17, 'sums');
const drillJson = JSON.stringify(drill, (k, v) => v instanceof RegExp ? '__RE__' + v.toString() + '__RE__' : v, 1)
  .replace(/"__RE__(.*?)__RE__"/g, (m, r) => JSON.parse('"' + r + '"'));
const drillSrc = `// Year 10, 3.1.4: The Fetch-Decode-Execute Cycle. Plenary: each move of fetch and why, decode and execute, the cycle.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y10_3_1_l4.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${drillJson});\n`;
const c01 = cards.find((c) => c.id === 'c-01').keywords[0];
['Fetch, decode, execute', 'fetch decode execute', 'fetch, decode and execute', 'Fetching, decoding, executing', 'fetch then decode then execute.'].forEach((s) => assert(c01.test(s), 'c-01 rejects ' + s));
['decode, fetch, execute', 'fetch, execute, decode', 'fetch decode'].forEach((s) => assert(!c01.test(s), 'c-01 accepts ' + s));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('exam-gapfill', 0, ['address', 'Address', 'an address'], ['data', 'MAR', 'addresses bus']);
ok('exam-gapfill', 1, ['MAR', 'memory address register', 'Memory Address Register (MAR)'], ['MDR', 'RAM', 'address']);
ok('exam-gapfill', 2, ['RAM', 'random access memory', 'Random Access Memory (RAM)'], ['ROM', 'memory', 'MAR']);
ok('exam-gapfill', 3, ['MDR', 'memory data register'], ['MAR', 'CIR']);
ok('exam-gapfill', 4, ['data', 'Data', 'data bus'], ['address', 'control']);
ok('exam-gapfill', 5, ['CIR', 'current instruction register'], ['CU', 'MDR', 'register']);
ok('exam-gapfill', 6, ['CU', 'control unit', 'the Control Unit (CU)'], ['ALU', 'CIR', 'control']);
ok('exam-names', 0, ['decode', 'Decode', 'decoding'], ['execute', 'fetch', 'decoder']);
ok('exam-names', 1, ['execute', 'Execute', 'execution', 'executing'], ['decode', 'store']);
ok('exam-names', 2, ['PC', 'program counter', 'Program Counter (PC)'], ['MAR', 'counter']);
ok('exam-names', 3, ['instruction set', 'Instruction Set', 'an instruction set'], ['instructions', 'set', 'character set']);
ok('exam-names', 4, ['ACC', 'accumulator', 'the Accumulator (ACC)', 'MAR', 'memory data register'], ['CIR', 'PC', 'register', 'ALU']);
ok('exam-paragraph', 0, ['fetched', 'Fetched'], ['decoded', 'stored']);
ok('exam-paragraph', 1, ['MDR', 'Memory Data Register (MDR)'], ['MAR', 'PC']);
ok('exam-paragraph', 2, ['data bus', 'the data bus'], ['data', 'address bus']);
ok('exam-paragraph', 3, ['decoded', 'decode'], ['executed', 'fetched']);
ok('exam-paragraph', 4, ['ALU', 'Arithmetic Logic Unit (ALU)', 'arithmetic and logic unit'], ['CU', 'ACC']);
ok('exam-paragraph', 5, ['calculations', 'calculation'], ['logic', 'execute']);
ok('exam-paragraph', 6, ['execute', 'executed'], ['decode', 'fetch']);
NOTES.forEach((n) => assert(n.q && n.model, 'note shape'));
// Walkthroughs never hold their slide's answers.
WT_DN1.steps.forEach((s) => assert(!/\bMAR\b|\bMDR\b|address|statement B|statement C|\bB:|\bC:/i.test(s.text + s.visual), 'WT_DN1 gives an answer: ' + s.text));
WT_DN2.steps.forEach((s) => assert(!/address|temporar|next (data|instruction)/i.test(s.text + s.visual), 'WT_DN2 gives an answer: ' + s.text));
// What a student sees: no dashes; no term before the slide that teaches it (the Do Now recaps earlier lessons' exam
// questions, and the title names the lesson); nothing from later lessons.
const seen = (s) => JSON.stringify(Object.assign({}, s, { walkthrough: s.walkthrough, validatorKey: undefined, items: (s.items || []).map((it) => Object.assign({}, it, { scheme: undefined, guidance: undefined })) }));
const all = JSON.stringify(steps) + drillSrc;
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/unidirectional|bidirectional|mario|\bdecimal\b|\bcache\b|\bcores?\b|clock speed|interrupt(?! ,)/i.test(steps.filter((s) => !/^exam-(gapfill|paragraph)$/.test(s.id)).map(seen).join('') + drillSrc), 'term outside this lesson');
const firstTaught = { fetch: 'why-fetch', increment: 'fetch-3', decod: 'decode', 'instruction set': 'decode', execut: 'execute', cycle: 'why-cycle' };
const skip = new Set(['do-now', 'do-now-2', 'do-now-ext', 'title']);
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(0, idx).filter((s) => !skip.has(s.id)).forEach((s) => assert(!new RegExp('\\b' + term, 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => s.items.forEach((it) => {
  assert(it.correct >= 0 && it.correct < it.options.length && it.explain, s.id + ' item shape');
  assert(!it.prompt.toLowerCase().includes(it.options[it.correct].toLowerCase()), s.id + ': prompt holds its answer: ' + it.prompt);
}));
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

const lesson = { id: ID, label: '3.1.4: The Fetch-Decode-Execute Cycle', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after y10-3-1-l3 in the 3.1 unit
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
