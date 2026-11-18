// Builds LessonData/y10-3-1-l6b.json: Year 10, 3.1.6: Instruction Sets (Notes and Bridge Builder).
//   node tools/build_y10_3_1_l6b.mjs
// An alternate 3.1.6 lesson beside y10-3-1-l6 (that lesson and its builder are unchanged). James, 2026-11-18:
// about 20 minutes of note-taking with NO interactive activities (no drills, PyScratch, click activities, Explain Its or
// predictions to answer), then Bridge Builder (pages BridgeBuilder/, registry bridge-builder, set y10-instruction-sets),
// where students earn coins from exam questions to buy bridge parts.
// The teaching and examples are y10-3-1-l6's: the five commands, LOAD 6 = 0001 0110, 0010 0111 = ADD 7 (6 holds 12,
// 7 holds 30), CPU A and CPU B. Teaching slides are static diagrams and side-by-side examples, plus the three InstrAnim
// scenes (registry instr-anim) shown as demonstrations. After each idea a Your Notes slide says exactly what to write.
// About 20 minutes of notes:
//   title 1, why-list 1.5, notes-set 1.5, why-binary 1.5, anim-binary 1.5, notes-machine-code 1.5, opcode 1.5,
//   anim-decode 1.5, decode 1.5, notes-decode 1.5, differ 1.5, anim-differ 1.5, notes-differ 1.5, notes-ready 0.5
// Then: Bridge Builder: Use Your Notes, Play: Bridge Builder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y10-3-1-l6b';
const PREV = 'y10-3-1-l6';
const P = 'y10-316b';
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const MONO = 'font-family:var(--font-mono, monospace)';
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const two = (a, b, cols = '1fr 1fr') => `<div style="display:grid;grid-template-columns:${cols};gap:16px;align-items:start">${a}${b}</div>`;
const todo = (t) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}</p>`;
const keyBox = (term, text) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:8px 14px;margin:10px 0 0;font-size:20px"><b>${term}</b> ${text}</div>`;
const why = (text) => `<p style="margin:10px 0 0;font-size:20px"><b>WHY?</b> ${text}</p>`;
const big = (t, extra = '') => `<div style="text-align:center;${MONO};font-size:30px;letter-spacing:3px;margin:4px 0;${extra}">${t}</div>`;
const chip = (t, colour) => `<span style="display:inline-block;padding:2px 10px;border-radius:8px;border:2px solid ${colour};${MONO}">${t}</span>`;
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
// An instruction set as a small table: rows [[opcode, command]] (as y10-3-1-l6).
const SET_A = [['0001', 'LOAD'], ['0010', 'ADD'], ['0011', 'SUB'], ['0100', 'STORE'], ['0101', 'OUTPUT']];
const SET_B = [['0001', 'OUTPUT'], ['0010', 'LOAD'], ['0011', 'ADD'], ['0100', 'STORE']];
const setTable = (title, rows, head = ['Opcode', 'Command']) => `<div style="border:2px solid var(--brand);border-radius:10px;background:var(--surface-2);padding:4px 12px"><b>${title}</b>` +
  `<table style="border-collapse:collapse;font-size:16px;margin:2px 0 0;width:100%"><tr><th style="text-align:left;font-size:13px;color:var(--muted);padding:1px 6px">${head[0]}</th><th style="text-align:left;font-size:13px;color:var(--muted);padding:1px 6px">${head[1]}</th></tr>` +
  rows.map(([o, c]) => `<tr><td style="${MONO};padding:1px 6px;border-top:1px solid var(--line)">${o}</td><td style="padding:1px 6px;border-top:1px solid var(--line)"><b>${c}</b></td></tr>`).join('') + '</table></div>';

const GAME = '<strong>You will use these notes in Bridge Builder.</strong>';
const NOTES = [];
// A Your Notes slide: exactly what to write, shown in full (no hidden model note, no checking step).
function noteSlide(id, label, notes) {
  const boxes = notes.map(([head, text]) => {
    NOTES.push({ head, text });
    return `<div style="border-left:6px solid var(--brand);background:var(--surface-2);border-radius:8px;padding:8px 14px;margin:8px 0;font-size:20px"><b>${head}</b><br>${text}</div>`;
  }).join('');
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` +
    todo('open your notes (the pen icon at the top). Write the heading and the note below. ' + GAME) + boxes };
}
// A demonstration: an InstrAnim scene, watched, nothing to answer.
const ANIMS = {};
function anim(id, label, scene, whyQ) {
  ANIMS[id] = scene;
  return { id, label, type: 'embedded-app', appId: 'instr-anim', embedQuery: 'scene=' + scene, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + tps(whyQ[0], whyQ[1]) +
      `<div id="${P}-${id}"></div>` };
}
const steps = [];

// ---------------------------------------------------------------- title (1 min)
steps.push({ id: 'title', label: 'Instruction Sets',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">3.1 Computer Architecture</p><h2 class="lesson-h2">Instruction Sets</h2><p>Year 10</p></div>' +
    facts(['<strong>Today:</strong> about 20 minutes of notes. Then use your notes in <strong>Bridge Builder</strong>.',
      'The big question: <strong>why</strong> can a program made for one CPU fail on another CPU?',
      'One small memory all lesson: address 6 holds 12, address 7 holds 30.']) +
    tps('A game made for a games console will not run on a laptop, even when the files are copied across. Why might that be?', 'Collect ideas: the two computers are built differently inside. Today shows one big reason, inside the CPU.') });

// ---------------------------------------------------------------- idea 1: the instruction set (1.5 + 1.5 min)
steps.push({ id: 'why-list', label: 'Why a CPU Has a Fixed List',
  content: '<h2 class="lesson-h2">Why a CPU Has a Fixed List</h2>' +
    two(setTable('This CPU has circuits for:', SET_A, ['Code', 'Command']),
      '<div style="font-size:20px">' + facts(['The CU and the ALU have circuits for these five commands.', 'They have <strong>no</strong> circuit for any other command.']) +
      `<p style="margin:8px 0 0">A program asks for ${chip('MULTIPLY', 'var(--brand)')}</p><p style="margin:6px 0 0">It is not in the list. The CPU <strong>cannot process it</strong>.</p></div>`, '1fr 1.4fr') +
    keyBox('Instruction set:', 'the list of all the commands that can be processed by a CPU.') +
    why('A CPU can only do what its circuits were built for. To multiply, a program must use ADD again and again.') });
steps.push(noteSlide('notes-set', 'Your Notes: The Instruction Set', [
  ['Instruction set', 'A list of all the commands that can be processed by a CPU.'],
  ['WHY a CPU can only process its own commands', 'Its CU and ALU have circuits for only those commands. Any other command cannot be processed.']]));

// ---------------------------------------------------------------- idea 2: machine code (1.5 + 1.5 + 1.5 min)
steps.push({ id: 'why-binary', label: 'Why Instructions Are Binary',
  content: '<h2 class="lesson-h2">Why Instructions Are Binary</h2>' +
    facts(['A program is stored in memory, just like data.', 'Memory can only store <strong>0s and 1s</strong>.']) +
    two('<div style="text-align:center"><p style="margin:0;color:var(--muted)">What we write</p>' + big('LOAD 6') + '</div>',
      '<div style="text-align:center"><p style="margin:0;color:var(--muted)">What memory stores</p>' + big('0001 0110') + '</div>') +
    facts(['LOAD is <span style="' + MONO + '">0001</span>: the instruction set gives each command its own binary code.', '6 is <span style="' + MONO + '">0110</span> (4 + 2).']) +
    keyBox('Machine code:', 'instructions in binary, using the codes in the instruction set.') +
    why('Memory is made of tiny switches, on or off. It cannot store the word LOAD.') });
steps.push(anim('anim-binary', 'Watch: LOAD 6 as Machine Code', 'binary',
  ['Before you watch: why does every command need its own binary code?', 'Ideas: so the CPU can tell the commands apart. Watch to see the codes.']));
steps.push(noteSlide('notes-machine-code', 'Your Notes: Machine Code', [
  ['Machine code', 'Instructions in binary, using the codes in the instruction set.'],
  ['WHY programs are stored as machine code', 'Memory can only store 0s and 1s.'],
  ['Example', 'LOAD 6 is stored as 0001 0110.']]));

// ---------------------------------------------------------------- idea 3: opcode, operand, decoding (1.5 x 4 min)
steps.push({ id: 'opcode', label: 'Two Parts: Opcode and Operand',
  content: '<h2 class="lesson-h2">Two Parts: Opcode and Operand</h2>' +
    facts(['Each instruction is 8 bits: two parts of 4 bits.']) +
    big(chip('0010', 'var(--brand)') + ' ' + chip('0111', 'var(--muted)'), 'font-size:34px') +
    two(keyBox('Opcode', '(first 4 bits): says <strong>which command</strong>. 0010 is ADD.'),
      keyBox('Operand', '(last 4 bits): says <strong>what to use</strong>, such as an address. 0111 is 7 (4 + 2 + 1).')) +
    why('The CPU needs two things: what to do, and what to do it with.') });
steps.push(anim('anim-decode', 'Watch: Decoding 0010 0111', 'decode',
  ['Before you watch: the CU has only 0s and 1s. How could it work out what to do?', 'Ideas: split it into parts, look the parts up, turn binary into a number. Watch to check.']));
const stepsCol = (title, rows) => `<div style="border:2px solid var(--line);border-radius:10px;padding:6px 12px;font-size:18px"><b>${title}</b><ol style="margin:4px 0 0;padding-left:22px;line-height:1.5">${rows.map((r) => `<li>${r}</li>`).join('')}</ol></div>`;
steps.push({ id: 'decode', label: 'Decoding: Two Examples',
  content: '<h2 class="lesson-h2">Decoding: Two Examples</h2>' +
    `<div style="display:grid;grid-template-columns:0.8fr 1fr 1fr;gap:14px;align-items:start">` +
    setTable('The instruction set', SET_A) +
    stepsCol(`<span style="${MONO}">0010 0111</span>`, ['Split: 0010 | 0111', 'Look up 0010: <b>ADD</b>', 'Convert 0111: <b>7</b>', 'ADD 7: ACC 12 + 30 = <b>42</b>']) +
    stepsCol(`<span style="${MONO}">0001 1001</span>`, ['Split: 0001 | 1001', 'Look up 0001: <b>LOAD</b>', 'Convert 1001: <b>9</b> (8 + 1)', 'LOAD 9: copy address 9 into the ACC']) + '</div>' +
    keyBox('Decode:', 'the CU splits the instruction, then looks up the opcode in the instruction set.') +
    why('The instruction is only 0s and 1s. The instruction set tells the CU which command each opcode means.') });
steps.push(noteSlide('notes-decode', 'Your Notes: Opcode, Operand and Decoding', [
  ['Opcode and operand', 'Opcode: the part that says which command. Operand: the part that says what to use, such as an address.'],
  ['How to decode', 'Split into opcode and operand. Look up the opcode in the instruction set. Convert the operand to a number. Example: 0010 0111 is ADD 7.'],
  ['WHY the CU needs the instruction set', 'The instruction is only 0s and 1s. The instruction set tells the CU which command each opcode means.']]));

// ---------------------------------------------------------------- idea 4: different CPU types (1.5 x 3 min)
steps.push({ id: 'differ', label: 'Two CPU Types, One Program',
  content: '<h2 class="lesson-h2">Two CPU Types, One Program</h2>' +
    facts(['A program is made for CPU A. Its first instruction is <span style="' + MONO + '">0001 0110</span>.']) +
    two(setTable('CPU A', SET_A) + '<p style="margin:6px 0 0;font-size:19px">0001 is LOAD: it runs <b>LOAD 6</b>. Correct.</p>',
      setTable('CPU B', SET_B) + '<p style="margin:6px 0 0;font-size:19px">0001 is OUTPUT: it runs <b>OUTPUT</b>. Wrong job. 0101 is not in its list at all.</p>') +
    why('Each CPU decodes with its <strong>own</strong> instruction set. The same machine code means a different command, or nothing.') });
steps.push(anim('anim-differ', 'Watch: One Program, Two CPUs', 'differ',
  ['Before you watch: what else could go wrong when CPU B runs all three instructions?', 'Make a guess for each instruction, then watch.']));
steps.push(noteSlide('notes-differ', 'Your Notes: Different CPU Types', [
  ['WHY machine code for one CPU may not run on another', 'The other CPU decodes with its own instruction set. The same opcode can mean a different command, or nothing.'],
  ['Which CPUs can run a machine code program', 'Only CPUs with the same instruction set as the one it was made for.']]));

// ---------------------------------------------------------------- notes ready (0.5 min), then Bridge Builder
steps.push({ id: 'notes-ready', label: 'Your Notes: Ready for Bridge Builder',
  content: '<h2 class="lesson-h2">Your Notes: Ready for Bridge Builder</h2>' +
    todo('open your notes (the pen icon at the top). You should have these four headings. Missing one? Go back to its slide and write it. ' + GAME) +
    facts(['<strong>The Instruction Set</strong>: what it is, and WHY a CPU can only process its own commands.',
      '<strong>Machine Code</strong>: what it is, and WHY programs are stored in binary.',
      '<strong>Opcode, Operand and Decoding</strong>: the two parts, how to decode, and WHY the CU needs the instruction set.',
      '<strong>Different CPU Types</strong>: WHY machine code for one CPU may not run on another.']) });
steps.push({ id: 'how-to-play', label: 'Bridge Builder: Use Your Notes',
  content: '<h2 class="lesson-h2">Bridge Builder: Use Your Notes</h2>' +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top.</li>' +
    '<li><strong>Answer the questions</strong> to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>If the bridge breaks</strong>, you start again at round 1.</li></ol>' });
// The embed step copied from y8-2-3-conditions' Circuit Siege step, only the appId swapped.
steps.push({ id: 'game', label: 'Play: Bridge Builder', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Bridge Builder</h2>' + tps('Why keep your notes open while you play?', 'The questions use the same ideas. Your notes help you answer them right the first time.') + `<div id="${P}-game"></div>`,
  embedQuery: 'set=y10-instruction-sets&goal=3' });

// ---------------------------------------------------------------- self-checks
const seen = (s) => JSON.stringify(s);
const all = JSON.stringify(steps);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'emoji found');
// Nothing to answer: no checks, drills, Explain Its or predictions. Only demonstrations and the game are embedded.
steps.forEach((s) => {
  assert(!s.type || s.type === 'embedded-app', s.id + ' is an activity type: ' + s.type);
  if (s.type === 'embedded-app') assert(s.appId === 'instr-anim' || s.id === 'game', s.id + ' embeds ' + s.appId);
  assert(!/<input|<textarea|lesson-note-reveal|Check my|predict/i.test(s.content), s.id + ' asks for an answer');
});
// No term before the slide that teaches it (the title excepted, as in y10-3-1-l6).
const firstTaught = { 'instruction set': 'why-list', 'machine code': 'why-binary', opcode: 'opcode', operand: 'opcode', decod: 'anim-decode' };
for (const [term, at] of Object.entries(firstTaught)) {
  const idx = steps.findIndex((s) => s.id === at);
  assert(idx > 0, 'teaching slide ' + at);
  steps.slice(0, idx).filter((s) => s.id !== 'title').forEach((s) => assert(!new RegExp('\\b' + term, 'i').test(seen(s)), `"${term}" on ${s.id}, before ${at}`));
}
assert(!/machine code|opcode|operand/i.test(seen(steps[0])), 'title uses a term from this lesson');
assert(!/\bdecimal\b|assembly|mnemonic|low-level|high-level|translat|compiler|interpreter/i.test(all), 'term outside this lesson');
// After each idea, a Your Notes slide that says the notes are for Bridge Builder.
const noteIds = steps.filter((s) => s.id.startsWith('notes-')).map((s) => s.id);
assert(noteIds.join() === 'notes-set,notes-machine-code,notes-decode,notes-differ,notes-ready', 'notes slides ' + noteIds);
noteIds.forEach((id) => assert(steps.find((s) => s.id === id).content.includes('You will use these notes in Bridge Builder.'), id + ' game line'));
Object.keys(ANIMS).forEach((id) => { const i = steps.findIndex((s) => s.id === id); assert(i > 0 && ['notes-machine-code', 'decode', 'notes-differ'].includes(steps[i + 1].id), id + ' is followed by its notes or worked examples'); });
assert(NOTES.length === 10 && NOTES.every((n) => n.head && n.text), 'notes');
// The game: Bridge Builder with the y10 instruction sets set; the how-to slide has three lines.
const game = steps.at(-1);
assert(game.appId === 'bridge-builder' && game.embedQuery === 'set=y10-instruction-sets&goal=3' && steps.at(-2).id === 'how-to-play', 'game slides');
assert((steps.at(-2).content.match(/<li>/g) || []).length === 3, 'three lines on how to play');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
// The numbers: LOAD 6 = 0001 0110, ADD 7 = 0010 0111, 12 + 30 = 42; 1001 = 9.
assert(parseInt('0110', 2) === 6 && parseInt('0111', 2) === 7 && parseInt('1001', 2) === 9 && 12 + 30 === 42, 'numbers');
// About 20 minutes of notes (minutes per slide as in the header).
const MINUTES = { title: 1, 'why-list': 1.5, 'notes-set': 1.5, 'why-binary': 1.5, 'anim-binary': 1.5, 'notes-machine-code': 1.5, opcode: 1.5, 'anim-decode': 1.5, decode: 1.5, 'notes-decode': 1.5, differ: 1.5, 'anim-differ': 1.5, 'notes-differ': 1.5, 'notes-ready': 0.5 };
const total = Object.values(MINUTES).reduce((a, b) => a + b, 0);
assert(steps.slice(0, -2).every((s) => MINUTES[s.id]) && total >= 18 && total <= 22, 'timing ' + total);

const lesson = { id: ID, label: '3.1.6: Instruction Sets (Notes and Bridge Builder)', steps, validators: {}, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: straight after y10-3-1-l6 in the 3.1 unit
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
