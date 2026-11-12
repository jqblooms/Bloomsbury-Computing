// Checks Exam Scripts (ExamScripts/js/scripts.js and logic.js): every model answer earns full marks, fair EAL wording
// and spelling slips are accepted, partial answers name the right missing points, wrong answers score 0, the ladder
// moves up and down, and "secure" needs two spaced blank passes. Run: node tools/test_exam_scripts.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ES = require('../ExamScripts/js/logic.js');

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL: ' + msg); } }

// ---------------------------------------------------------------- the scripts themselves
ok(ES.SCRIPTS.length >= 10 && ES.SCRIPTS.length <= 14, '10 to 14 scripts (' + ES.SCRIPTS.length + ')');
ok(new Set(ES.SCRIPTS.map((s) => s.id)).size === ES.SCRIPTS.length, 'script ids unique');
ok(ES.ORDER.length === ES.SCRIPTS.length && ES.ORDER.every((id) => ES.BY_ID[id]), 'ORDER lists every script');
const studentText = [];
ES.SCRIPTS.forEach((s) => {
  ok(['robots', 'cpu'].includes(s.topic), s.id + ' topic');
  ok(s.rotate || s.variants.length >= 2, s.id + ' has a new wording for level 6');
  studentText.push(s.title);
  s.variants.forEach((v, i) => {
    const r = ES.mark(s, i, ES.modelText(s, i));
    ok(r.full, `${s.id} variant ${i}: the model answer earns full marks (${r.score}/${r.marks}, missing ${r.missing.map((m) => m.id)})`);
    ok(ES.modelPoints(s, i).length >= s.marks, `${s.id} variant ${i}: the model covers ${s.marks} points`);
    v.model.forEach((m) => {
      ok(m.indexOf('|') > 0, `${s.id} ${i}: sentence starter in "${m}"`);
      ok(/\[[^\]]+\]/.test(m.split('|')[1] || ''), `${s.id} ${i}: a key word to blank after the starter in "${m}"`);
      ok(!/\[/.test(m.split('|')[0]), `${s.id} ${i}: no key word inside the starter of "${m}"`);
    });
    studentText.push(v.q, ...v.model);
    ES.pointsOf(s, i).forEach((p) => studentText.push(p.need));
    // Each sentence of a model alone never earns full marks on a multi-mark script.
    if (s.marks > 1) v.model.forEach((m) => ok(!ES.mark(s, i, m.replace(/[[\]|]/g, '')).full, `${s.id} ${i}: one sentence alone is not full marks: "${m}"`));
  });
});
const all = studentText.join('\n');
ok(!/[–—]|&mdash;|&ndash;/.test(all), 'no em or en dashes');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'no emoji');
ok(!/\bdecimal\b/i.test(all), 'syllabus terms only (denary, never decimal)');
ok(!/robot animal|quad-core|half-duplex/i.test(all), 'nothing from the class mock paper');

// ---------------------------------------------------------------- marking: [script, variant, answer, score, missing ids (optional)]
const CASES = [
  // Robot characteristics
  ['robot-chars', 0, 'It has a mechanical structure. It has electrical components like sensors. It is programmable.', 3],
  ['robot-chars', 0, 'it have a framework. it has sensers and actuaters. it can be programed', 3],
  ['robot-chars', 0, 'has mechanical structure, has electrical parts, can move', 3],
  ['robot-chars', 0, 'It has a mechanical structure. It is programmable.', 2, ['elec']],
  ['robot-chars', 0, 'It is fast and strong. It works all day.', 0],
  ['robot-chars', 0, 'It is a machine. It is clever.', 0],
  // Automated
  ['automated', 0, 'It can do actions without human intervention.', 1],
  ['automated', 0, 'it works with no human', 1],
  ['automated', 0, 'it doesnt need a person to control it', 1],
  ['automated', 0, 'It does things automatically.', 0, ['human']],
  ['automated', 0, 'It is a robot that uses sensors.', 0],
  // Sensor and microprocessor control
  ['sensor-control', 0, 'The sensor sends data to the microprocessor. The data is converted from analogue to digital using an ADC. The microprocessor compares the data to the stored value. If the data shows the fence it sends a signal to stop the robot. An actuator stops the robot. This repeats continuously.', 6],
  ['sensor-control', 0, 'sensor send data to microprocesor. data change analog to digital. microprocessor compair data with stored value. if it is too close it send signal to stop. actuator turn the robot. it repeat until switched off', 6],
  ['sensor-control', 1, 'The temperature sensor sends readings to the microprocessor. ADC converts the data. The microprocessor checks the data against 25 and 30. If above 30 a signal is sent to open the window. An actuator opens the window. The process is continuous.', 6],
  ['sensor-control', 0, 'The sensor sends data to the microprocessor. The microprocessor compares the data with a stored value. If it is the fence a signal is sent to stop the robot.', 3, ['adc', 'actuator', 'repeat']],
  ['sensor-control', 0, 'The sensor continuously sends data to the microprocessor. The microprocessor compares it with the stored value. If it matches it sends a signal to the actuator.', 4, ['adc', 'repeat']],
  ['sensor-control', 0, 'The robot sees the fence and stops. Then it turns around.', 0],
  ['sensor-control', 0, 'The sensor checks the fence. The robot stops.', 0],
  // AI
  ['ai-meaning', 0, 'AI is the simulation of intelligent behaviour by computers. It has data and rules for using the data. It can reason.', 3],
  ['ai-meaning', 0, 'It can learn and adapt. It can make decisions. It copies human behaviour.', 3],
  ['ai-meaning', 0, 'It can learn. It is very smart.', 1],
  ['ai-meaning', 0, 'It is a robot. It is a computer program.', 0],
  // Machine learning meaning
  ['ml-meaning', 0, 'A program that can automatically adapt its own data and processes.', 1],
  ['ml-meaning', 0, 'it can change its own rules', 1],
  ['ml-meaning', 0, 'It learns things.', 0],
  ['ml-meaning', 0, 'It changes the data.', 0],
  // Machine learning improves
  ['ml-improve', 0, 'It collects data about the room. It stores the data. It finds patterns in the data. It adapts its own processes.', 4],
  ['ml-improve', 0, 'it gather data where obstacle are. it remember the shape of the room. it analyse the data for patern. it change its own route so it make fewer mistakes', 4],
  ['ml-improve', 0, 'It collects data. It finds patterns.', 2],
  ['ml-improve', 0, 'It learns from its mistakes and gets better.', 0],
  ['ml-improve', 0, 'It is a clever robot that cleans the room.', 0],
  // Registers
  ['registers', 0, 'It stores the address of the next instruction.', 1],
  ['registers', 0, 'holds adress of next instruction to be fetched', 1],
  ['registers', 0, 'It stores the next instruction.', 0, ['pc']],
  ['registers', 0, 'It counts the programs.', 0],
  ['registers', 1, 'It holds the address of the data that is about to be fetched from memory.', 1],
  ['registers', 1, 'It holds the data that is fetched.', 0],
  ['registers', 2, 'It stores the data that has been fetched from memory.', 1],
  ['registers', 2, 'it hold the instruction that was fetched from RAM', 1],
  ['registers', 2, 'It holds the address of the data in memory.', 0],
  ['registers', 3, 'It stores the instruction being decoded and executed.', 1],
  ['registers', 3, 'It holds the address of the instruction.', 0],
  ['registers', 4, 'It stores the result of interim calculations.', 1],
  ['registers', 4, 'it stores the answer of calculation from the ALU', 1],
  ['registers', 4, 'It adds numbers.', 0],
  // Fetch
  ['fetch', 0, 'The address in the PC is sent to the MAR. The PC is incremented. The instruction is sent from RAM to the MDR. Then it goes from the MDR to the CIR.', 4],
  ['fetch', 0, 'PC send address to MAR using address bus. PC increment by 1. instruction from RAM go to MDR by data bus. MDR send to CIR.', 4],
  ['fetch', 0, 'The PC sends the address to the MAR using the address bus. The PC is incremented.', 3, ['ram-mdr']],
  ['fetch', 0, 'The CPU gets the instruction from memory.', 0],
  ['fetch', 0, 'The CPU fetches the instruction. Then it decodes it and executes it.', 0],
  // Decode
  ['decode', 0, 'The instruction is sent from the MDR to the CIR. The control unit decodes the instruction using an instruction set.', 3],
  ['decode', 0, 'the CU decodes it with the instruction set. it is split into opcode and operand', 3],
  ['decode', 0, 'The control unit decodes the instruction.', 1, ['mdr-cir', 'set']],
  ['decode', 0, 'The computer understands the instruction.', 0],
  // Execute
  ['execute', 0, 'The control unit sends a signal to the ALU. The ALU executes the instruction. The accumulator stores the result.', 3],
  ['execute', 0, 'CU send signal to ALU. ALU do the calculation. ACC holds the result.', 3],
  ['execute', 0, 'The ALU does the calculation.', 1, ['signal', 'acc']],
  ['execute', 0, 'The instruction is carried out by the computer.', 0],
  // ALU
  ['alu', 0, 'It performs calculations and logical operations.', 2],
  ['alu', 0, 'It does arithmetic. It does logic.', 2],
  ['alu', 0, 'The arithmetic logic unit does calculations.', 1, ['logic']],
  ['alu', 0, 'The arithmetic logic unit is in the CPU.', 0],
  ['alu', 0, 'It controls the CPU.', 0],
  // CU
  ['cu', 0, 'It sends control signals to other components. It manages the flow of data through the CPU.', 2],
  ['cu', 0, 'it send signals. it decode instructions', 2],
  ['cu', 0, 'The control unit controls the computer.', 0],
  ['cu', 0, 'It sends signals.', 1, ['flow']],
  // Performance
  ['performance', 0, 'More cores so more instructions are processed at the same time. Higher clock speed so more FDE cycles per second. Larger cache so frequently used data is accessed faster.', 6],
  ['performance', 0, 'more core can do instruction simultaneusly. more clock speed more cycles each second. more cache store data used often', 6],
  ['performance', 0, 'More cores. Higher clock speed. More cache.', 3, ['cores-why', 'clock-why', 'cache-why']],
  ['performance', 0, 'Buy more RAM. Get a better graphics card.', 0],
];
CASES.forEach(([id, vi, ans, score, miss]) => {
  const r = ES.mark(ES.BY_ID[id], vi, ans);
  ok(r.score === score, `${id} ${vi}: "${ans}" scores ${score} (got ${r.score}; met ${r.met})`);
  if (miss) ok(JSON.stringify(r.missing.map((m) => m.id)) === JSON.stringify(miss), `${id} ${vi}: "${ans}" is missing ${miss} (got ${r.missing.map((m) => m.id)})`);
  ok(r.missing.length === Math.max(0, r.marks - r.score), `${id}: missing lists the marks still needed`);
});
ok(ES.mark(ES.BY_ID.fetch, 0, '   ').empty, 'an empty answer is flagged');
// 2026-11-12: a wrong word in a gap ("erased" for "fetched") passed because the copied frame held other key words.
{
  const regs = ES.BY_ID.registers || ES.SCRIPTS.find((s) => /MDR/.test(JSON.stringify(s.variants)));
  regs.variants.forEach((v, vi) => {
    const model = v.model.map((m) => m.replace(/[[\]|]/g, '')).join(' ');
    for (const lv of [1, 2, 3, 4, 5, 6]) ok(ES.mark(regs, vi, model, lv).full, `registers ${vi}: model full at level ${lv}`);
    if (/fetched/.test(model)) {
      const bad = model.replace(/fetched/g, 'erased');
      for (const lv of [1, 2, 3, 5, 6]) ok(!ES.mark(regs, vi, bad, lv).full, `registers ${vi}: "erased" for "fetched" fails at level ${lv}`);
    }
  });
  ES.SCRIPTS.forEach((s) => s.variants.forEach((v, vi) => {
    const model = v.model.map((m) => m.replace(/[[\]|]/g, '')).join(' ');
    [1, 2, 3].forEach((lv) => ok(ES.mark(s, vi, model, lv).full, `${s.id} ${vi}: model full at level ${lv}`));
    const words = (v.model.join(' ').match(/\[[^\]]*\]/g) || []).map((b) => b.slice(1, -1));
    if (words.length) {
      const swapped = model.replace(words[0], 'banana');
      if (swapped !== model) ok(!ES.mark(s, vi, swapped, 2).full, `${s.id} ${vi}: a wrong word in the first gap fails at level 2`);
    }
  }));
}
// The quote shows what the student wrote about a point they half made.
{
  const r = ES.mark(ES.BY_ID['sensor-control'], 0, 'The sensor sends data to the microprocessor. It compares the data. If it is close a signal is sent. An actuator stops it. It repeats.');
  const c = r.missing.find((m) => m.id === 'compare');
  ok(c && c.quote === 'It compares the data', 'quote for a half-made point (' + JSON.stringify(r.missing) + ')');
}

// Which sensor: every scenario's accepted answers, a rival sensor, and a list of guesses.
const sensors = ES.BY_ID['sensor-choice'];
sensors.variants.forEach((v, i) => {
  const stems = v.points[0].g[0];
  stems.forEach((st) => ok(ES.mark(sensors, i, st + ' sensor').full, `sensor ${i}: "${st} sensor" accepted`));
  const wrong = ['temperature', 'light', 'pressure', 'humidity'].find((w) => !stems.includes(w));
  ok(ES.mark(sensors, i, wrong + ' sensor').score === 0, `sensor ${i}: "${wrong}" is wrong`);
  ok(ES.mark(sensors, i, stems[0] + ' or ' + wrong).score === 0, `sensor ${i}: two guesses score 0`);
});
ok(ES.mark(sensors, 7, 'temprature').full, 'sensor spelling slip: temprature');
ok(ES.mark(sensors, 1, 'infra-red').full, 'sensor: infra-red with a hyphen');
ok(ES.mark(sensors, 4, 'PH sensor').full, 'sensor: PH');

// ---------------------------------------------------------------- scaffolds
ES.SCRIPTS.forEach((s) => {
  const keys = s.variants[0].model.join(' ').match(/\[[^\]]+\]/g).map((k) => k.slice(1, -1));
  const l1 = ES.scaffold(s, 0, 1).join(' '), l2 = ES.scaffold(s, 0, 2).join(' '), l3 = ES.scaffold(s, 0, 3).join(' '), l4 = ES.scaffold(s, 0, 4);
  ok(l1 === ES.modelText(s, 0), s.id + ': level 1 shows the model');
  ok(l2.includes('_____') && keys.every((k) => !l2.split(/[ .,]/).includes(k) || s.variants[0].model.join(' ').replace(/\[[^\]]+\]/g, '').includes(k)), s.id + ': level 2 blanks the key words');
  ok(!ES.mark(s, 0, l2).full, s.id + ': the level 2 text alone is not full marks');
  ok(!ES.mark(s, 0, l3).full, s.id + ': the level 3 text alone is not full marks');
  ok(l4.every((x) => / \.\.\.$/.test(x)), s.id + ': level 4 is starters only');
  ok(ES.scaffold(s, 0, 5).length === 0 && ES.scaffold(s, 0, 6).length === 0, s.id + ': no scaffold at levels 5 and 6');
});

// ---------------------------------------------------------------- the ladder
{
  const st = ES.fixState(null), id = 'fetch';
  st.open = [id];
  const r = st.scripts[id];
  ok(r.level === 1, 'starts at level 1');
  let o = ES.record(st, id, 0, true); ok(o.from === 1 && o.to === 2, 'right: 1 to 2');
  o = ES.record(st, id, 0, true); ok(r.level === 3, 'right: 2 to 3');
  o = ES.record(st, id, 0, false); ok(o.from === 3 && o.to === 2 && r.missed, 'wrong: 3 down to 2');
  r.level = 1; o = ES.record(st, id, 0, false); ok(r.level === 1, 'wrong at level 1 stays at 1');
  r.level = 4; ES.record(st, id, 0, true); ok(r.level === 5, 'right: 4 to 5');
  o = ES.record(st, id, 0, true); ok(o.pass && r.level === 6 && r.passes.length === 1 && !r.secure, 'first blank pass: level 6, not secure');
  o = ES.record(st, id, 1, true); ok(o.notSpaced && r.passes.length === 1 && !r.secure, 'a back-to-back blank pass does not count');
  st.n += 3; // other work
  o = ES.record(st, id, 2, true); ok(o.pass && o.secureNow && r.secure && r.everSecure, 'second spaced blank pass: secure');
  o = ES.record(st, id, 1, false); ok(o.lost && !r.secure && r.level === 5 && r.passes.length === 0 && r.everSecure, 'a miss on a secure script: back to level 5, passes lost, everSecure kept');
  ES.record(st, id, 0, true); st.n += 3; ES.record(st, id, 1, false); ok(r.passes.length === 0 && r.level === 5, 'a miss after one pass loses the pass');
}
// A fixed state survives junk.
{
  const st = ES.fixState({ v: 1, n: 'x', open: ['nope', 'fetch'], scripts: { fetch: { level: 99, passes: 'bad' } } });
  ok(st.n === 0 && st.open.join() === 'fetch' && st.scripts.fetch.level === 6 && Array.isArray(st.scripts.fetch.passes), 'fixState cleans a damaged save');
  ok(Object.keys(st.scripts).length === ES.SCRIPTS.length, 'fixState has every script');
}

// ---------------------------------------------------------------- scheduling: a simulated student
function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
for (const topic of ['all', 'robots', 'cpu']) {
  const st = ES.fixState(null), rnd = rng(7);
  let prev = null, backToBack = 0, steps = 0, levelAtFirstOpen = {};
  while (!ES.allSecure(st, topic) && steps < 3000) {
    const p = ES.pick(st, topic, rnd);
    ok(ES.BY_ID[p.id] && (topic === 'all' || ES.BY_ID[p.id].topic === topic), 'pick is in the topic');
    if (p.id === prev) backToBack++;
    const sc = ES.BY_ID[p.id], r = st.scripts[p.id];
    if (!sc.rotate && r.level < 6) ok(p.vi === 0, p.id + ': variant 0 below level 6');
    if (!sc.rotate && r.level === 6) ok(p.vi > 0, p.id + ': a new wording at level 6');
    if (!(p.id in levelAtFirstOpen)) levelAtFirstOpen[p.id] = steps;
    ES.record(st, p.id, p.vi, rnd() < 0.8); // right 4 times in 5
    prev = p.id; steps++;
  }
  ok(ES.allSecure(st, topic), `${topic}: a student who is right 4 times in 5 makes everything secure (${steps} answers)`);
  ok(backToBack === 0, `${topic}: never the same script twice in a row (${backToBack})`);
  const ids = Object.keys(levelAtFirstOpen);
  ok(ids.filter((id) => levelAtFirstOpen[id] === 0).length === 1 && ids.length === ES.counts(st, topic).total, `${topic}: scripts open one by one`);
  // Secure scripts still come back now and then.
  let back = 0;
  for (let i = 0; i < 40; i++) { const p = ES.pick(st, topic, rnd); ES.record(st, p.id, p.vi, true); back++; }
  ok(back === 40 && ES.allSecure(st, topic), `${topic}: secure scripts keep coming back and stay secure when right`);
}
// The weakest scripts come most.
{
  const st = ES.fixState(null);
  st.open = ['fetch', 'decode', 'execute', 'alu', 'cu', 'registers'];
  ['decode', 'execute', 'alu', 'cu', 'registers'].forEach((id) => { st.scripts[id].level = 6; st.scripts[id].secure = true; });
  st.scripts.fetch.level = 2;
  const tally = {}, rnd = rng(3);
  for (let i = 0; i < 400; i++) { const p = ES.pick(st, 'cpu', rnd); tally[p.id] = (tally[p.id] || 0) + 1; st.n++; st.scripts[p.id].last = st.n; }
  ok(tally.fetch > 400 / 6, 'the weakest script is picked most (' + JSON.stringify(tally) + ')');
}
ok(/^0 of 14 scripts secure\.$/.test(ES.summary(ES.fixState(null))), 'summary for a new student');

console.log(fails ? `${fails} failed, ${passes} passed` : `All ${passes} checks passed.`);
process.exit(fails ? 1 : 0);
