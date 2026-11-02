// CPU Lab 3D: Year 10 3.1.2 CPU Components (Cambridge IGCSE 0478) in the lab of Network Builder 3D and Contest Lab 3D.
// The floor is a giant CPU: main memory along the back wall, a row of registers (PC with its +1 lever, MAR, MDR, CIR,
// ACC), the CU desk, the ALU machine and an output screen. You carry value cubes between them: addresses (light
// blue), data (dark blue) and instructions (amber). Taking a cube from a register gives you a copy (the register
// keeps its value); memory only gives out what is at the address in the MAR. Job cards in mark-scheme wording are
// sorted onto the ALU, the CU and the registers. The model and wording follow CpuLab/regs.js and CpuLab/parts.js:
// MAR <- PC; MDR <- memory[MAR]; PC + 1; CIR <- MDR; the CU works out what it means; then LOAD / ADD / SUB / OUTPUT.
//
// Same controls, guide arrow, outlines, What just happened card, attention glow and rules as Contest Lab 3D (this
// file is a fork of ContestLab3D/main.js; room.js, blob.js, devices.js, cubes.js and three.js are shared by import).
// Progress: 'bc-cpu3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'cpulab3d'.
// Rendering uses animation frames; starting a round, checking and saving never wait on one (a hidden iframe has none).
import * as THREE from 'three';
import { create } from './room.js';
import { createBlob } from './blob.js';
import { makeCube, makeCard, makePad, makeBody, floorBar, sign, PAD_H, CUBE, GAP } from './cubes.js';

const $ = id => document.getElementById(id);
const T = 100, SPEED = 5.5, NEED = 2, HOLD = 0.25;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, attrs, html) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) k === 'class' ? n.className = v : n.setAttribute(k, v); if (html != null) n.innerHTML = html; return n; };
const btn = (label, cls, fn) => { const b = el('button', { type: 'button', class: cls === 'go' ? 'btn' : 'btn secondary' }, label); b.addEventListener('click', fn); return b; };

// ================================================================ the CPU model
// cube colours: an address is light blue, data dark blue, an instruction amber, a part name light grey
const ROLE_OF = { addr: 'var', data: 'num', instr: 'op', name: 'paren', result: 'result' };
const roleOf = s => ROLE_OF[kindOf(s)] || 'num';
const kindOf = v => v == null ? null : /^[A-Z]/.test(String(v)) ? 'instr' : 'data';
const C = (s, kind) => '<span class="cl-c ' + (ROLE_OF[kind] || ROLE_OF[kindOf(s)] || 'num') + '">' + s + '</span>';
const REGS = ['PC', 'MAR', 'MDR', 'CIR', 'ACC'];
function program() {
  const addrs = shuffle([5, 6, 7]);
  const mem = [{ op: 'LOAD', a: addrs[0] }, { op: pick(['ADD', 'SUB']), a: addrs[1] }, { op: pick(['ADD', 'SUB']), a: addrs[2] }, { op: 'OUTPUT' }, { op: 'STOP' }];
  mem[5] = { n: rnd(20, 40) }; mem[6] = { n: rnd(2, 15) }; mem[7] = { n: rnd(2, 15) };
  mem[addrs[0]] = { n: rnd(25, 45) };
  return mem;
}
const text = c => c == null ? '' : c.op ? c.op + (c.a != null ? ' ' + c.a : '') : String(c.n);
// Every action of instruction k, from the registers before it. An action moves a value from one place to another
// (a register or memory gives a copy), or pulls the PC's +1 lever. Each has the sentence that explains it.
function actions(mem, k, regs) {
  const r = Object.assign({}, regs), out = [];
  const act = (a) => { Object.assign(r, a.set || {}); a.regs = Object.assign({}, r); out.push(a); };
  const pc = Number(r.PC), ins = mem[pc] || mem[k];
  act({ from: 'PC', to: 'MAR', v: String(pc), kind: 'addr', half: 'next', set: { MAR: String(pc) },
    text: 'Copy the address in the <b>PC</b> (' + pc + ') into the <b>MAR</b>.',
    say: 'The address in the PC (' + pc + ') is copied into the MAR: memory will read address ' + pc + '.' });
  act({ from: 'mem:' + pc, to: 'MDR', v: text(ins), kind: 'instr', half: 'next', set: { MDR: text(ins) },
    text: 'Memory sends what is at address ' + pc + ' into the <b>MDR</b>: carry it from the memory box.',
    say: 'Memory sends what is stored at address ' + pc + ' (' + text(ins) + ') into the MDR.' });
  act({ press: 'inc', half: 'next', set: { PC: String(pc + 1) }, v: String(pc + 1),
    text: 'Pull the <b>+1 lever</b>: the PC goes up by 1.',
    say: 'The PC goes up by 1 to ' + (pc + 1) + ', so it holds the address of the <b>next</b> instruction.' });
  act({ from: 'MDR', to: 'CIR', v: text(ins), kind: 'instr', half: 'next', set: { CIR: text(ins) },
    text: 'Copy the instruction in the <b>MDR</b> into the <b>CIR</b>.',
    say: 'The instruction in the MDR is copied into the CIR. It is the instruction being carried out now.' });
  act({ from: 'CIR', to: 'CU', v: text(ins), kind: 'instr', half: 'next', decode: ins,
    text: 'Copy the instruction in the <b>CIR</b> to the <b>CU</b>, so it can work out what it means.',
    say: 'The CU works out what ' + text(ins) + ' means and sends the signals to carry it out.' });
  if (ins.a != null) {
    act({ from: 'CUout', to: 'MAR', v: String(ins.a), kind: 'addr', half: 'do', set: { MAR: String(ins.a) },
      text: text(ins) + ' needs the number at address ' + ins.a + ': carry the address from the CU to the <b>MAR</b>.',
      say: text(ins) + ' needs the number stored at address ' + ins.a + ', so ' + ins.a + ' goes into the MAR.' });
    act({ from: 'mem:' + ins.a, to: 'MDR', v: String(mem[ins.a].n), kind: 'data', half: 'do', set: { MDR: String(mem[ins.a].n) },
      text: 'Memory sends the number at address ' + ins.a + ' into the <b>MDR</b>.',
      say: 'Memory sends the number at address ' + ins.a + ' (' + mem[ins.a].n + ') into the MDR.' });
    if (ins.op === 'LOAD') act({ from: 'MDR', to: 'ACC', v: String(mem[ins.a].n), kind: 'data', half: 'do', set: { ACC: String(mem[ins.a].n) },
      text: 'LOAD: copy the number in the <b>MDR</b> into the <b>ACC</b>.',
      say: 'LOAD copies the number in the MDR into the ACC: it now holds ' + mem[ins.a].n + '.' });
    else {
      const acc = Number(r.ACC), n = mem[ins.a].n, v = ins.op === 'ADD' ? acc + n : acc - n;
      act({ from: 'ACC', to: 'ALU1', v: String(acc), kind: 'data', half: 'do',
        text: 'Copy the number in the <b>ACC</b> into the ALU\'s first input.',
        say: 'The ALU needs the number already in the ACC (' + acc + ').' });
      act({ from: 'MDR', to: 'ALU2', v: String(n), kind: 'data', half: 'do', alu: { op: ins.op, a: acc, b: n, v },
        text: 'Copy the number in the <b>MDR</b> into the ALU\'s second input. Predict what the ALU makes.',
        say: 'The ALU works out ' + acc + (ins.op === 'ADD' ? ' + ' : ' - ') + n + ' = ' + v + '. The ALU does the maths.' });
      act({ from: 'ALUout', to: 'ACC', v: String(v), kind: 'result', half: 'do', set: { ACC: String(v) },
        text: 'Carry the ALU\'s result into the <b>ACC</b>.',
        say: 'The result (' + v + ') goes into the ACC, which holds results from the ALU.' });
    }
  } else if (ins.op === 'OUTPUT') act({ from: 'ACC', to: 'OUT', v: String(r.ACC), kind: 'data', half: 'do',
    text: 'OUTPUT: copy the number in the <b>ACC</b> to the screen.', say: 'OUTPUT sends the number in the ACC (' + r.ACC + ') to the screen. No register changes.' });
  return { list: out, regs: r, ins };
}
function regsBefore(mem, k) {
  let regs = { PC: '0', MAR: '', MDR: '', CIR: '', ACC: '' };
  for (let i = 0; i < k; i++) regs = actions(mem, i, regs).regs;
  return regs;
}
function cpuProblem(o) {
  for (let t = 0; t < 60; t++) {
    const mem = o.mem ? o.mem() : program();
    const k = o.k != null ? o.k : rnd(o.from || 0, o.to || 3), regs = regsBefore(mem, k);
    const A = actions(mem, k, regs), all = [];
    if (o.whole) { let r = { PC: '0', MAR: '', MDR: '', CIR: '', ACC: '' }; for (let i = 0; i < 5; i++) { const a = actions(mem, i, r); all.push(...a.list); r = a.regs; } }
    const list = o.whole ? all : o.half === 'next' ? A.list.filter(a => a.half === 'next') : o.half === 'do' ? A.list.filter(a => a.half === 'do') : A.list;
    const start = o.half === 'do' ? A.list.filter(a => a.half === 'next').pop().regs : o.whole ? { PC: '0', MAR: '', MDR: '', CIR: '', ACC: '' } : regs;
    if (o.op && A.ins.op !== o.op) continue;
    if (list.some(a => a.regs && a.regs.ACC !== '' && (Number(a.regs.ACC) < 0 || Number(a.regs.ACC) > 99))) continue;
    if (!list.length) continue;
    return { mem, k, start, list, ins: A.ins, key: JSON.stringify(mem) + k };
  }
  throw new Error('no program');
}
function fixedMem() { const m = [{ op: 'LOAD', a: 5 }, { op: 'ADD', a: 6 }, { op: 'SUB', a: 7 }, { op: 'OUTPUT' }, { op: 'STOP' }]; m[5] = { n: 30 }; m[6] = { n: 12 }; m[7] = { n: 5 }; return m; }

// ---- the jobs (mark-scheme wording, as CpuLab/parts.js)
const WHY = {
  ALU: 'The <b>ALU</b> (arithmetic logic unit) carries out calculations and logical operations, such as comparing two numbers.',
  CU: 'The <b>CU</b> (control unit) sends signals to manage how data and instructions move, and works out what each instruction means.',
  PC: 'The <b>PC</b> (program counter) holds the address of the <b>next</b> instruction.',
  MAR: 'The <b>MAR</b> (memory address register) holds the <b>address</b> that memory is about to read or write.',
  MDR: 'The <b>MDR</b> (memory data register) holds the <b>data or instruction</b> that has just come from memory, or is about to go to it.',
  CIR: 'The <b>CIR</b> (current instruction register) holds the instruction that is being worked out and carried out <b>now</b>.',
  ACC: 'The <b>ACC</b> (accumulator) holds the result of a calculation from the ALU, part-way through the program.'
};
function jobs() {
  const a = rnd(11, 39), b = rnd(3, 9), big = rnd(31, 60), addr = rnd(5, 9), val = rnd(12, 45), next = rnd(2, 4);
  return {
    ALU: [['Adds ' + a + ' and ' + b, 'ALU'], ['Takes ' + b + ' away from ' + a, 'ALU'], ['Checks if ' + big + ' is bigger than 30', 'ALU'], ['Checks if two numbers are equal', 'ALU'], ['Carries out calculations', 'ALU'], ['Carries out logical operations, such as comparing two numbers', 'ALU']],
    CU: [['Sends signals to control how data moves around the CPU', 'CU'], ['Works out what an instruction means (decodes it)', 'CU'], ['Manages the flow of data and instructions through the CPU', 'CU'], ['Sends a signal to memory to read an address', 'CU'], ['Tells the ALU which calculation to do', 'CU']],
    REG: [['Holds the address of the next instruction', 'PC'], ['Goes up by 1 each time an instruction is taken from memory', 'PC'], ['Tells the CPU where to find the next instruction', 'PC'],
      ['Holds the address of the data about to be taken from memory', 'MAR'], ['Holds the address in memory that is about to be read', 'MAR'], ['Holds the address where data is about to be written', 'MAR'],
      ['Holds the data that has just been taken from memory', 'MDR'], ['Holds data that is about to be written to memory', 'MDR'], ['Holds the instruction or data that has just arrived from memory', 'MDR'],
      ['Holds the instruction that is being worked out and carried out', 'CIR'], ['Holds the current instruction', 'CIR'],
      ['Holds the result of a calculation from the ALU', 'ACC'], ['Holds results part-way through a calculation', 'ACC']],
    NOW: [['The CPU is about to read address ' + addr + '. Which part holds ' + addr + '?', 'MAR'], ['Address ' + addr + ' holds ' + val + '. It has just been read. Which part holds ' + val + '?', 'MDR'],
      ['The next instruction is at address ' + next + '. Which part holds ' + next + '?', 'PC'], ['The ALU has worked out ' + a + ' + ' + b + ' = ' + (a + b) + '. Which part holds ' + (a + b) + '?', 'ACC'],
      ['The CPU is carrying out ADD ' + addr + '. Which register holds ADD ' + addr + '?', 'CIR'], ['Which part works out ' + a + ' + ' + b + '?', 'ALU'], ['Which part works out what ADD ' + addr + ' means?', 'CU']]
  };
}
function sortProblem(level, tutorial) {
  const J = jobs();
  let parts, cards;
  if (level === 'alucu') { parts = ['ALU', 'CU']; cards = shuffle(J.ALU).slice(0, tutorial ? 2 : 3).concat(shuffle(J.CU).slice(0, tutorial ? 2 : 3)); }
  else if (level === 'regs') { parts = REGS.slice(); cards = REGS.map(r => pick(J.REG.filter(c => c[1] === r))); if (!tutorial) cards.push(pick(J.REG.filter(c => !cards.includes(c)))); }
  else { parts = ['ALU', 'CU'].concat(REGS); cards = shuffle(J.NOW).slice(0, 4).concat(shuffle(J.REG).slice(0, 1), shuffle(J.ALU.concat(J.CU)).slice(0, 1)); }
  cards = tutorial ? cards : shuffle(cards);
  return { parts, cards: cards.map(([t, a]) => ({ text: t, answer: a })), key: cards.map(c => c[0]).join('|') };
}

// ================================================================ missions
const MISSIONS = [
  { id: 'alucu-t', group: 'ALU or CU', title: 'Meet the ALU and the CU', type: 'tutorial', kind: 'sort', level: 'alucu',
    intro: 'Each card is a job. Carry it to the part that does that job. Ask: is it maths, or is it being in charge?',
    gen: () => sortProblem('alucu', true),
    after: { q: 'Why does a CPU have one part that calculates and a different part that controls?', options: ['They are different jobs, so each part can be simple and fast.', 'The ALU is too small to hold a program.', 'The CU cannot add numbers because it has no memory.'], why: 'One part only has to do maths; the other is in charge of everything else.' } },
  { id: 'alucu-c', group: 'ALU or CU', title: 'ALU or CU?', type: 'challenge', kind: 'sort', level: 'alucu',
    intro: 'Six jobs. Carry each card to the ALU or the CU. Two clean rounds in a row.', gen: () => sortProblem('alucu', false) },
  { id: 'regs-t', group: 'Registers', title: 'Five Registers', type: 'tutorial', kind: 'sort', level: 'regs',
    intro: 'A register is a tiny, very fast store inside the CPU. Carry each card to the register that does that job.',
    gen: () => sortProblem('regs', true),
    after: { q: 'Why do the PC and the MAR get mixed up?', options: ['Both hold an address: the PC the next instruction\'s, the MAR the one being read now.', 'They are the same register with two names.', 'Both hold the result of a calculation.'], why: 'Look at the clue words: next for the PC, address being read for the MAR.' } },
  { id: 'regs-c', group: 'Registers', title: 'Which Register?', type: 'challenge', kind: 'sort', level: 'regs',
    intro: 'Six jobs, five registers. Carry each card to the right register. Two clean rounds in a row.', gen: () => sortProblem('regs', false) },
  { id: 'parts-c', group: 'Registers', title: 'All Seven Parts', type: 'challenge', kind: 'sort', level: 'all',
    intro: 'Moments from a running program. Ask: is it an address, data, an instruction, or a result? Two clean rounds in a row.', gen: () => sortProblem('all', false) },
  { id: 'next-t', group: 'Take the next instruction', title: 'Take the Next Instruction', type: 'tutorial', kind: 'cpu',
    intro: 'The PC says where the next instruction is. Move the values from part to part and watch the registers change.',
    gen: () => cpuProblem({ mem: fixedMem, k: 0, half: 'next' }),
    after: { q: 'Why does the PC go up by 1?', options: ['So it holds the address of the next instruction.', 'So the ALU has a number to add.', 'So memory knows the instruction has finished.'], why: 'The program is stored in order, so the next instruction is at the next address.' } },
  { id: 'next-c', group: 'Take the next instruction', title: 'Next Instruction Challenge', type: 'challenge', kind: 'cpu',
    intro: 'Take the next instruction from memory and give it to the CU. Every move must be right. Two clean rounds in a row.',
    gen: () => cpuProblem({ from: 1, to: 3, half: 'next' }) },
  { id: 'load-t', group: 'Carry it out', title: 'LOAD', type: 'tutorial', kind: 'cpu',
    intro: 'The CU has worked out LOAD. It needs the number stored at an address, then copies it into the ACC.',
    gen: () => cpuProblem({ mem: fixedMem, k: 0, half: 'do' }),
    after: { q: 'LOAD 5 puts 30 into the ACC, not 5. Why?', options: ['5 is an address: LOAD copies the number stored at address 5.', 'The ALU adds 25 to every number.', 'The ACC always starts at 30.'], why: 'The number after LOAD, ADD or SUB is an address in memory, not the value itself.' } },
  { id: 'add-t', group: 'Carry it out', title: 'ADD and SUB', type: 'tutorial', kind: 'cpu',
    intro: 'ADD and SUB need the ALU. It takes the number in the ACC and the number from memory, and its result goes back into the ACC.',
    gen: () => cpuProblem({ mem: fixedMem, k: 1, half: 'do' }),
    after: { q: 'Why does the result of ADD go into the ACC?', options: ['The ACC holds results from the ALU, ready for the next instruction.', 'The MDR is full.', 'Results always go back into memory first.'], why: 'The ACC (accumulator) keeps a running result part-way through the program.' } },
  { id: 'do-c', group: 'Carry it out', title: 'Carry It Out Challenge', type: 'challenge', kind: 'cpu',
    intro: 'The CU has worked out an instruction. Carry it out. Every move must be right. Two clean rounds in a row.',
    gen: () => cpuProblem({ from: 0, to: 3, half: 'do' }) },
  { id: 'one-c', group: 'Run a program', title: 'One Whole Instruction', type: 'challenge', kind: 'cpu',
    intro: 'Take the next instruction from memory, then carry it out. Two clean rounds in a row.',
    gen: () => cpuProblem({ from: 1, to: 3 }) },
  { id: 'run-c', group: 'Run a program', title: 'Run the Program', type: 'challenge', kind: 'cpu', need: 1, noHelp: true,
    intro: 'The whole program, from address 0 to STOP, with no help. One clean run.',
    gen: () => cpuProblem({ whole: true, k: 0 }) }
];
export { MISSIONS };
const SECTIONS = ['ALU or CU', 'Registers', 'Take the next instruction', 'Carry it out', 'Run a program'];
// Lesson mode: 3.1.2 CPU Components (about an hour), with the instruction missions as extensions
const LESSONS = [
  { id: '3.1.2', title: '3.1.2: CPU Components', missions: ['alucu-t', 'alucu-c', 'regs-t', 'regs-c', 'parts-c', 'next-t', 'next-c'], ext: ['load-t', 'add-t', 'do-c', 'one-c', 'run-c'] }
];
const minsOf = m => m.mins || (m.id === 'run-c' ? 15 : m.type === 'challenge' ? (m.kind === 'cpu' ? 10 : 8) : m.kind === 'cpu' ? 8 : 5);

// ================================================================ saving and results
const STORE = 'bc-cpu3d-v1:';
function load(key, fallback) { try { const v = localStorage.getItem(STORE + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
function save(key, value) { try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch (e) { } }
function results(id, label) {
  const lines = []; let right = 0, tries = 0;
  function post(finished) {
    if (window.parent === window) return;
    const head = (finished ? 'Finished.' : 'Not finished yet.') + (tries ? ' ' + right + ' clean rounds in ' + tries + '.' : '');
    try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label, summary: head + ' ' + lines.slice(-12).join(' '), complete: !!finished }, '*'); } catch (e) { }
  }
  return {
    add(text, ok) { tries++; if (ok) right++; lines.push(tries + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); post(); },
    note(text) { lines.push(text); post(); },
    finish() { post(true); }
  };
}

// ================================================================ the 3D lab
export function startSolo({ container, myName, colour }) {
  const log = results('cpulab3d', 'CPU Lab 3D');
  let MAPW = 22, MAPH = 15, rows = [];
  let view = null, scene = null, worldG = null;
  const pos = { x: 11, y: 12, face: Math.PI };
  let moving = false, overview = false, stick = null, clock = 0, tickNo = 0;
  const keys = new Set();
  const me = createBlob(colour ?? 0, myName || '');
  const hand = { down: false, item: null, from: null, pending: null };
  let slots = [], blocks = [], nextId = 1;
  let M = null, R = null, missionAt = 0;
  const done = load('all:done', {}) || {};
  const openSecs = new Set();

  // ---------------------------------------------------------------- slots and items
  // A slot is a pad on the floor at tile (x, y), w tiles wide, holding items (a stack grows upwards, a rail grows to
  // the right). take(item) returns a reason it cannot be taken; put(item, from) returns { msg, mistake } to refuse.
  function addSlot(def) {
    const s = Object.assign({ id: 's' + nextId++, w: 1, items: [], grow: 'up', take: () => null, put: () => null, risky: false }, def);
    s.g = makePad(s.pad || s.role, s.w, s.label, s.tag || {});
    s.g.position.set(s.x * T + T / 2, 0, s.y * T + T / 2); worldG.add(s.g);
    slots.push(s); return s;
  }
  function itemMesh(it) { it.k3 = it.card ? makeCard(it.text) : makeCube(it.sym, it.role); worldG.add(it.k3.group); }
  function addItem(slot, it) { it.id = it.id || 'i' + nextId++; if (!it.k3) itemMesh(it); slot.items.push(it); it.slot = slot; snapItem(it); return it; }
  function killItem(it) { if (!it || !it.k3) return; worldG.remove(it.k3.group); it.k3.dispose(); it.k3.group.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); it.k3 = null; }
  function cube(sym, extra) { return Object.assign({ sym: String(sym), role: roleOf(String(sym)) }, extra || {}); }
  const top = s => s.items[s.items.length - 1];
  function itemTarget(it) {
    if (it === hand.item) {
      const [hx, hy] = handPos();
      return new THREE.Vector3((hx + 0.5) * T, it.card ? 30 : 70, (hy + 0.5) * T);
    }
    const s = it.slot, k = s.items.indexOf(it);
    if (s.grow === 'right') return new THREE.Vector3((s.x + k + 0.5) * T, PAD_H + CUBE / 2 + 2, (s.y + 0.5) * T);
    if (it.card) return new THREE.Vector3((s.x + s.w / 2) * T + (s.grow === 'pile' ? k * 10 : 0), PAD_H + (s.grow === 'pile' ? k * 18 : 0), (s.y + 0.5) * T);
    return new THREE.Vector3((s.x + s.w / 2) * T, PAD_H + CUBE / 2 + 2 + k * GAP, (s.y + 0.5) * T);
  }
  function snapItem(it) { if (it.k3) { it.k3.group.position.copy(itemTarget(it)); it.k3.group.rotation.y = 0; } }
  function moveItems(dt) {
    const k = Math.min(1, dt * 14);
    // placed cubes square up to face the camera, so a + never reads as a times sign
    for (const s of slots) for (const it of s.items) if (it.k3) { const g = it.k3.group; g.position.lerp(itemTarget(it), k); g.rotation.y += (Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2 - g.rotation.y) * k; }
    if (hand.item && hand.item.k3) { hand.item.k3.group.position.lerp(itemTarget(hand.item), Math.min(1, dt * 24)); hand.item.k3.group.rotation.y = pos.face; }
  }
  const rectDist = (s, px, py) => Math.hypot(Math.max(s.x - 0.5 - px, 0, px - (s.x + s.w - 0.5)), Math.max(s.y - 0.5 - py, 0, py - (s.y + 0.5)));
  function handPos() { return [pos.x + Math.sin(pos.face) * 0.45, pos.y + Math.cos(pos.face) * 0.45]; }
  function nearestSlot(maxD, ok) {
    const [hx, hy] = handPos(); let best = null, bd = maxD;
    for (const s of slots) { if (ok && !ok(s)) continue; const d = rectDist(s, hx, hy); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  // ---------------------------------------------------------------- the room
  function solidAt(tx, ty) {
    if (ty < 0 || tx < 0 || ty >= MAPH || tx >= MAPW || rows[ty][tx] === '#') return true;
    for (const s of slots) if (ty === s.y && tx >= s.x && tx < s.x + s.w) return true;
    for (const b of blocks) if (tx >= b[0] && tx <= b[2] && ty >= b[1] && ty <= b[3]) return true;
    return false;
  }
  function free(x, y) { for (const [ox, oy] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) if (solidAt(Math.round(x + ox), Math.round(y + oy))) return false; return true; }
  function disposeWorld() {
    if (!worldG) return;
    scene.remove(worldG);
    worldG.traverse(o => {
      if (o.userData.own) o.geometry?.dispose?.();
      if (o.userData.ownMat) { o.material.map?.dispose?.(); o.material.dispose(); }
      if (o.isSprite) { o.material.map?.dispose?.(); o.material.dispose(); }
    });
    for (const s of slots) for (const it of s.items) it.k3?.dispose();
    if (hand.item) hand.item.k3?.dispose();
  }
  function newWorld(w, h, name) {
    if (!view) { view = create(container); scene = view.scene; scene.add(me.group, arrows, pulse, outlineG); }
    disposeWorld();
    slots = []; blocks = []; hand.item = null; hand.from = null; hand.pending = null; guideKey = ''; routeKey = ''; outlineKey = '';
    MAPW = w; MAPH = h; rows = [];
    for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) r += (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? '#' : '.'; rows.push(r); }
    view.setRoom({ w, h, rows, regions: [{ name, index: 0, x0: 1, y0: 1, x1: w - 2, y1: h - 2 }] });
    worldG = new THREE.Group(); scene.add(worldG);
    setOverview(overview);
  }
  function addBody(x0, y0, w, colour, label, deco) {
    const g = makeBody(w, colour, label, deco); g.position.set((x0 + w / 2) * T, 0, (y0 + 0.5) * T); worldG.add(g);
    blocks.push([x0, y0, x0 + w - 1, y0]); return g;
  }
  function addSign(text, x, y, h = 260, opts) { const s = sign(text, opts); s.position.set((x + 0.5) * T, h, (y + 0.5) * T); worldG.add(s); return s; }

  // ================================================================ rounds
  // R: the round being played. R.ask is a prediction waiting in the mission panel (nothing can be grabbed meanwhile).
  function newRound() {
    const m = M.m;
    let p = m.gen();
    // a challenge never repeats the round just played
    if (m.type === 'challenge') for (let k = 0; k < 20 && M.lastKey && keyOf(p) === M.lastKey; k++) p = m.gen();
    M.lastKey = keyOf(p);
    R = { p, over: false, spoilt: false, ask: null, notes: [], moves: 0, why: null };
    KIND[m.kind].setup(R, m);
    pos.face = Math.PI; view.jump(pos.x, pos.y);
    toast(''); explainReset(); explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  function startLine(m, p) { return KIND[m.kind].start(m, p); }

  // ---- what just happened: a card at the top of the lab after every step. Each one stays up for a while, the next
  // waits its turn (none is cut short), and the last one stays until something new happens.
  const xq = []; let xTimer = 0, xUntil = 0;
  function explainReset() { xq.length = 0; clearTimeout(xTimer); xTimer = 0; xUntil = 0; const b = $('explain'); if (b) { b.hidden = true; b.innerHTML = ''; } }
  function explain(html) {
    if (!html) return;
    xq.push(html); if (xq.length > 1) xq.splice(0, xq.length - 1);   // at most one step behind: the newest waits, older ones are skipped
    window.__explainCount = (window.__explainCount || 0) + 1;
    window.__explained = (window.__explained || []).concat([html.replace(/<[^>]+>/g, '')]).slice(-40);
    if (!xTimer) xNext();
  }
  function xNext() {
    xTimer = 0;
    if (!xq.length) return;
    const wait = xUntil - Date.now();
    if (wait > 0) { xTimer = setTimeout(xNext, wait); return; }
    const b = $('explain'); if (!b) return;
    b.hidden = false; b.innerHTML = '<span class="xh">What just happened</span><span class="xt">' + xq.shift() + '</span>';
    b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    xUntil = Date.now() + 1800;   // each one stays up at least this long
    if (xq.length) xTimer = setTimeout(xNext, xUntil - Date.now());
  }
  const keyOf = p => p.key;
  function mistake(msg) {
    R.why = msg; log.add(M.m.title + ': ' + msg.replace(/<[^>]+>/g, ''), false);
    const first = M.m.type === 'challenge' && !R.spoilt;
    if (M.m.type === 'challenge') { if (first) toast('A mistake: this round does not count. ' + msg, 'bad'); else toast(msg, 'bad'); R.spoilt = true; }
    else toast(msg, 'bad');
    explain('Not this time. ' + msg + (first ? (M.m.noHelp ? ' This round does not count.' : ' This round does not count, so the arrow now shows each move: watch the method, then try a new round.') : ''));
    drawAll();
  }
  function finishRound(msg) {
    R.over = true; R.endMsg = msg;
    if (M.m.type === 'tutorial') { finishMission(); return; }
    if (!R.spoilt) {
      M.have++; log.add(M.m.title + ': clean round', true);
      if (M.have >= (M.m.need || NEED)) finishMission();
      else toast('Clean round! ' + M.have + ' of ' + (M.m.need || NEED) + '.', 'good');
    } else { M.have = 0; M.spoilt++; toast('This round had a mistake, so it does not count. Try a new one.', 'bad'); }
  }
  function finishMission() {
    M.phase = 'done';
    const id = M.m.id;
    if (!done[id]) { done[id] = true; save('all:done', done); }
    if (M.m.type === 'challenge') {
      const n = M.spoilt === 0 ? 3 : M.spoilt <= 2 ? 2 : 1, best = load('all:stars', {}) || {};
      M.stars = n; if (!(best[id] >= n)) { best[id] = n; save('all:stars', best); }
    }
    log.note('Mission ' + M.m.title + ' complete' + (M.walked ? ', used Walk me through it' : '') + '.');
    if (MISSIONS.every(x => done[x.id])) log.finish();
    toast('Mission complete!', 'good');
  }

  // ---------------------------------------------------------------- job cards: carry each card to the part that does the job
  const KIND = {};
  const NAME_COL = { ALU: 0x1864ab, CU: 0x5f3dc4 };
  KIND.sort = {
    start() { return 'Each card is a job. Carry it to the part of the CPU that does that job.'; },
    setup(R, m) {
      const p = R.p, n = p.parts.length, W = Math.max(22, n * 3 + 5);
      newWorld(W, 15, 'Inside the CPU');
      const x0 = Math.floor((W - (n - 1) * 3) / 2);
      R.pads = p.parts.map((part, i) => {
        addBody(x0 + i * 3 - 1, 4, 3, NAME_COL[part] || 0x0b7285, part, part === 'ALU' ? 'gate' : part === 'CU' ? 'press' : null);
        // a big name cube on top of each part, readable from anywhere in the room
        const nc = makeCube(part, 'paren', 1.6); nc.group.position.set((x0 + i * 3 + 0.5) * T, 196, (4 + 0.5) * T); worldG.add(nc.group);
        const s = addSlot({ role: 'part', pad: 'machine', x: x0 + i * 3, y: 5, part, grow: 'pile',
          take: () => 'This card is with the right part.',
          put: (it, from) => from === s ? null : it.answer === part ? null : { msg: 'Not the ' + part + '. ' + WHY[it.answer], mistake: true } });
        return s;
      });
      const cx0 = Math.floor((W - (p.cards.length - 1) * 3) / 2);
      R.shelf = p.cards.map((c, i) => {
        const s = addSlot({ role: 'shelf', pad: 'supply', x: cx0 + i * 3, y: 10,
          put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null });
        addItem(s, { card: true, text: c.text, answer: c.answer, sym: c.text, role: 'card' });
        return s;
      });
      addSign('JOB CARDS', cx0 + (p.cards.length - 1) * 1.5, 9, 200);
      R.placedN = 0;
      pos.x = Math.floor(W / 2); pos.y = 12.5;
    },
    placed(it, slot) { if (slot.role === 'part') { R.placedN++; explain('"' + it.text + '" is a job for the <b>' + slot.part + '</b>. ' + WHY[slot.part]); } },
    check() { if (R.placedN === R.p.cards.length && !hand.item) finishRound('Every job is with the right part.'); },
    guide(R, m) {
      const cards = R.shelf.filter(s => s.items.length);
      if (m.type === 'challenge') {
        if (hand.item) return areaTarget(R.pads);
        const t = areaTarget(cards); if (t) t.glowAll = cards.map(top); return t;
      }
      if (hand.item) return slotTarget(R.pads.find(s => s.part === hand.item.answer));
      const next = R.p.cards.find(c => R.shelf.some(s => s.items.length && top(s).text === c.text));
      return next ? slotTarget(R.shelf.find(s => s.items.length && top(s).text === next.text)) : null;
    },
    steps(R, m) {
      return R.p.cards.map(c => ({
        text: 'Carry "' + c.text + '" to the <b>' + c.answer + '</b>. ' + (m.level === 'alucu' ? (c.answer === 'ALU' ? 'It is maths or comparing.' : 'It is being in charge.') : WHY[c.answer].replace(/^The <b>\w+<\/b> \([^)]*\) /, 'It ')),
        done: () => R.pads.some(s => s.items.some(x => x.text === c.text))
      }));
    },
    goals(m) { return m.level === 'alucu' ? ['ALU: calculations and comparing numbers.', 'CU: in charge. It sends signals and works out what each instruction means.'] : ['Clue words: next (PC), address (MAR), data or instruction from memory (MDR), now (CIR), result (ACC).', 'ALU: maths. CU: in charge.']; },
    expr(R) {
      const c = hand.item && hand.item.card ? hand.item : null;
      return '<b>Cards with the right part:</b> ' + R.placedN + ' of ' + R.p.cards.length + (c ? '<br><b>You are carrying:</b> "' + c.text + '"' : '<br>Walk up to a card to read it.');
    },
    walk(R, m) {
      const p = sortProblem(m.level, true), steps = [{ text: '<b>Different cards.</b> For each job, ask: is it maths, being in charge, or holding something? If it holds something, what: an address, data, an instruction, or a result?', visual: '' }];
      p.cards.forEach(c => steps.push({ text: '"' + c.text + '": <span class="hl">' + c.answer + '</span>. ' + WHY[c.answer], visual: '' }));
      steps.push({ text: 'Now carry your own cards.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- the CPU: move values from part to part
  const POS = { PC: [6, 7], MAR: [9, 7], MDR: [12, 7], CIR: [15, 7], ACC: [18, 7] };
  const PUT_WHY = {
    MAR: 'The MAR holds the address that memory reads next.', MDR: 'The MDR holds what has just come from memory.', CIR: 'The CIR holds the instruction being carried out now.',
    ACC: 'The ACC holds a result from the ALU, or a number copied in by LOAD.', CU: 'The CU takes the instruction from the CIR and works out what it means.',
    ALU1: 'The ALU takes the number in the ACC and the number in the MDR.', ALU2: 'The ALU takes the number in the ACC and the number in the MDR.',
    OUT: 'The screen shows the number in the ACC when the instruction is OUTPUT.', PC: 'The PC only changes with the +1 lever.', CUout: 'The CU gives out an address here.', ALUout: 'The ALU gives out its result here.'
  };
  const plain = h => h.replace(/<[^>]+>/g, '');
  const regTable = (regs, hl) => '<table class="cpu-regs"><tr>' + REGS.map(r => '<th' + (hl === r ? ' class="hl"' : '') + '>' + r + '</th>').join('') + '</tr><tr>' + REGS.map(r => '<td' + (hl === r ? ' class="hl"' : '') + '>' + (regs[r] === '' || regs[r] == null ? '-' : regs[r]) + '</td>').join('') + '</tr></table>';
  function valueCube(v, kind) { return { sym: String(v), role: ROLE_OF[kind] || roleOf(String(v)), kind }; }
  function setReg(name, v, kind) {
    const s = R.slot[name]; s.items.forEach(killItem); s.items = [];
    if (v !== '' && v != null) addItem(s, valueCube(v, kind || (name === 'PC' || name === 'MAR' ? 'addr' : kindOf(v))));
    R.regs[name] = String(v);
  }
  function cpuWhy(slot, e) { return 'Not this move. ' + (PUT_WHY[slot.key] || '') + ' Next: ' + plain(e.text); }
  KIND.cpu = {
    start(m, p) { return p.list[0].half === 'do' ? 'The CU has worked out ' + text(p.ins) + '. Now carry it out.' : m.id === 'run-c' ? 'The program starts at address 0, so the PC holds 0.' : 'The PC holds ' + p.start.PC + ': the next instruction is at address ' + p.start.PC + '.'; },
    setup(R, m) {
      const p = R.p; R.i = 0; R.regs = Object.assign({}, p.start); R.slot = {};
      newWorld(25, 16, 'Inside the CPU');
      // main memory, outside the CPU: a box for each address
      for (let a = 0; a < 8; a++) {
        const s = addSlot({ role: 'mem', pad: 'rail', x: 4 + a * 2, y: 2, key: 'mem:' + a, label: 'ADDRESS ' + a, tag: { tagY: 150 },
          copyOut: () => R.regs.MAR === String(a) ? valueCube(text(p.mem[a]), p.mem[a] && p.mem[a].op ? 'instr' : 'data')
            : 'Memory only sends what is at the address in the MAR' + (R.regs.MAR !== '' ? ' (' + R.regs.MAR + ')' : '') + '.',
          put: () => ({ msg: 'Nothing is written to memory in these programs.' }) });
        if (p.mem[a]) addItem(s, valueCube(text(p.mem[a]), p.mem[a].op ? 'instr' : 'data'));
        R.slot[s.key] = s;
      }
      addSign('MAIN MEMORY (OUTSIDE THE CPU)', 11, 1, 300, { bg: '#2b8a3e', size: 0.036 });
      // the registers, with the PC's +1 lever beside it
      for (const r of REGS) {
        const [x, y] = POS[r];
        const s = addSlot({ role: 'reg', pad: 'stack', x, y, key: r, label: r, tag: { tagY: 200, tagSize: 0.045, tagBg: '#0b7285' },
          copyOut: () => R.regs[r] === '' ? 'The ' + r + ' is empty.' : valueCube(R.regs[r], r === 'PC' || r === 'MAR' ? 'addr' : kindOf(R.regs[r])),
          put: (it, from) => r === 'PC' ? { msg: PUT_WHY.PC, mistake: true } : cpuPut(s, it, from) });
        R.slot[r] = s;
      }
      R.slot.inc = addSlot({ role: 'lever', pad: 'answer', x: 4, y: 7, key: 'inc', label: '+1 LEVER', tag: { tagY: 130 },
        press: () => pressInc(), pressText: 'to pull the +1 lever: the PC goes up by 1.' });
      addBody(3, 11, 4, 0x5f3dc4, 'CU (CONTROL UNIT)', 'press');
      R.slot.CU = addSlot({ role: 'cu', pad: 'machine', x: 3, y: 12, key: 'CU', label: 'IN', put: (it, from) => cpuPut(R.slot.CU, it, from) });
      R.slot.CUout = addSlot({ role: 'cuout', pad: 'out', x: 6, y: 12, key: 'CUout', label: 'OUT', put: (it, from) => from === R.slot.CUout ? null : { msg: PUT_WHY.CUout } });
      addBody(11, 11, 5, 0x1864ab, 'ALU (ARITHMETIC LOGIC UNIT)', 'gate');
      R.slot.ALU1 = addSlot({ role: 'alu', pad: 'machine', x: 11, y: 12, key: 'ALU1', label: 'IN', put: (it, from) => cpuPut(R.slot.ALU1, it, from) });
      R.slot.ALU2 = addSlot({ role: 'alu', pad: 'machine', x: 13, y: 12, key: 'ALU2', label: 'IN', put: (it, from) => cpuPut(R.slot.ALU2, it, from) });
      R.slot.ALUout = addSlot({ role: 'aluout', pad: 'out', x: 15, y: 12, key: 'ALUout', label: 'OUT', put: (it, from) => from === R.slot.ALUout ? null : { msg: PUT_WHY.ALUout } });
      R.slot.OUT = addSlot({ role: 'screen', pad: 'target', x: 21, y: 12, key: 'OUT', label: 'OUTPUT SCREEN', put: (it, from) => cpuPut(R.slot.OUT, it, from) });
      for (const r of REGS) setReg(r, R.regs[r]);
      if (p.list[0].half === 'do' && p.ins.a != null) addItem(R.slot.CUout, valueCube(p.ins.a, 'addr'));
      pos.x = 10; pos.y = 14;
    },
    placed(it, slot, from) {
      const e = R.p.list[R.i]; R.i++;
      if (slot.role === 'reg') { setReg(slot.key, e.v, e.kind === 'result' ? 'data' : e.kind); }
      else if (e.set) Object.assign(R.regs, e.set);
      if (e.decode) {
        killItem(it); slot.items = [];
        const ins = e.decode, opts = ins.op === 'LOAD' ? ['Copy the number stored at address ' + ins.a + ' into the ACC', 'Copy the number ' + ins.a + ' itself into the ACC', 'Send the number ' + ins.a + ' to the screen']
          : ins.op === 'ADD' || ins.op === 'SUB' ? [(ins.op === 'ADD' ? 'Add the number stored at address ' + ins.a + ' to' : 'Take the number stored at address ' + ins.a + ' away from') + ' the number in the ACC', (ins.op === 'ADD' ? 'Add ' : 'Take away ') + ins.a + ' itself', 'Copy the ACC into address ' + ins.a]
          : ins.op === 'OUTPUT' ? ['Send the number in the ACC to the screen', 'Copy the ACC into memory', 'End the program'] : ['End the program', 'Go back to address 0', 'Send the ACC to the screen'];
        R.ask = { type: 'choice', q: 'The CU works out what ' + C(text(ins), 'instr') + ' means. What does it tell the CPU to do?', options: opts, answer: opts[0],
          hint: 'The number after LOAD, ADD or SUB is an <b>address</b> in memory.', why: text(ins) + ' means: ' + opts[0] + '.',
          done: () => { explain(e.say + ' ' + text(ins) + ' means: ' + opts[0].toLowerCase() + '.'); if (ins.a != null) addItem(R.slot.CUout, valueCube(ins.a, 'addr')); } };
        return;
      }
      if (e.alu) {
        const a = e.alu;
        R.ask = { type: 'num', q: 'The ALU works out ' + C(String(a.a), 'data') + (a.op === 'ADD' ? ' + ' : ' - ') + C(String(a.b), 'data') + ' = ?', answer: a.v,
          hint: (a.op === 'ADD' ? 'Add ' : 'Take away ') + 'the number from memory. The number from the ACC comes first.', why: a.a + (a.op === 'ADD' ? ' + ' : ' - ') + a.b + ' = ' + a.v + '.',
          done: () => { for (const k of ['ALU1', 'ALU2']) { R.slot[k].items.forEach(killItem); R.slot[k].items = []; } addItem(R.slot.ALUout, valueCube(a.v, 'result')); explain(e.say); } };
        return;
      }
      explain(e.say);
      const nx = R.p.list[R.i];
      if (slot.key === 'MAR' && nx && nx.from && nx.from.startsWith('mem:')) {
        const a = Number(e.v), right = text(R.p.mem[a]), wrong = [String(a), text(R.p.mem[a + 1]) || text(R.p.mem[a - 1]), text(R.p.mem[(a + 3) % 8])].filter(x => x && x !== right);
        const opts = [right].concat([...new Set(wrong)].slice(0, 2));
        R.ask = { type: 'choice', q: 'The MAR holds ' + C(String(a), 'addr') + '. Predict: what will memory send to the MDR?', options: opts, answer: right,
          hint: 'The MAR holds an <b>address</b>. Memory sends what is <b>stored</b> at that address.', why: 'Address ' + a + ' holds ' + right + '.', done: () => {} };
      }
    },
    check() { if (R.i >= R.p.list.length && !R.ask && !hand.item) finishRound(M.m.id === 'run-c' ? 'STOP: the program has finished. The screen showed ' + (R.slot.OUT.items.length ? top(R.slot.OUT).sym : '') + '.' : 'Every move was right.'); },
    guide(R, m) {
      const e = R.p.list[R.i]; if (!e || R.ask) return null;
      if (m.type === 'challenge') {
        if (hand.item) return areaTarget([...REGS.slice(1).map(r => R.slot[r]), R.slot.CU, R.slot.ALU1, R.slot.ALU2, R.slot.OUT]);
        return areaTarget(slots.filter(s => s.role === 'mem' || s.role === 'reg' || s.role === 'lever' || (s.role === 'cuout' || s.role === 'aluout') && s.items.length));
      }
      if (e.press) return hand.item ? null : slotTarget(R.slot.inc);
      if (hand.item) return slotTarget(R.slot[e.to]);
      return slotTarget(R.slot[e.from]);
    },
    steps(R) { return R.p.list.map((e, i) => ({ text: e.text, done: () => R.i > i })); },
    goals() { return ['A register gives you a copy. Memory only gives what is at the address in the MAR.', 'Next instruction: PC to MAR, memory to MDR, +1 lever, MDR to CIR, CIR to the CU.', 'LOAD: MDR to ACC. ADD, SUB: ACC and MDR into the ALU, result to the ACC. OUTPUT: ACC to the screen.']; },
    expr(R) {
      const mem = R.p.mem.map((c, a) => c ? '<span class="cpu-mem"><b>' + a + '</b> ' + text(c) + '</span>' : '').join('');
      return '<b>Registers</b>' + regTable(R.regs) + '<b>Main memory</b><div class="cpu-memrow">' + mem + '</div>';
    },
    walk(R, m) {
      const o = m.id === 'next-t' || m.id === 'next-c' ? { half: 'next', from: 1, to: 3 } : m.id === 'load-t' ? { half: 'do', op: 'LOAD', k: 0 } : m.id === 'add-t' ? { half: 'do', from: 1, to: 2 } : m.id === 'do-c' ? { half: 'do', from: 0, to: 3 } : { from: 1, to: 3 };
      let p; do p = cpuProblem(o); while (p.key === R.p.key);
      const steps = [{ text: '<b>A different program.</b> ' + KIND.cpu.start(m, p), visual: regTable(p.start) }];
      for (const e of p.list) {
        const hl = e.to && REGS.includes(e.to) ? e.to : e.press ? 'PC' : null;
        steps.push({ text: e.say + (e.decode ? ' (' + text(e.decode) + ')' : ''), visual: e.regs ? regTable(e.regs, hl) : '' });
      }
      steps.push({ text: 'Now do yours the same way, one move at a time.', visual: '' });
      return steps;
    }
  };
  function cpuPut(slot, it, from) {
    const e = R.p.list[R.i];
    if (!e) return { msg: 'This instruction is finished.' };
    if (e.press) return { msg: 'Not this move. Next: ' + plain(e.text), mistake: true };
    if (from && from.key === e.from && slot.key === e.to) return null;
    return { msg: cpuWhy(slot, e), mistake: true };
  }
  function pressInc() {
    const e = R.p.list[R.i];
    if (!e || !e.press) { mistake('Not now. ' + (e ? 'Next: ' + plain(e.text) : '') + ' The PC goes up by 1 just after the instruction arrives in the MDR.'); return; }
    const pc = Number(R.regs.PC);
    R.ask = { type: 'num', q: 'The PC holds ' + C(String(pc), 'addr') + '. Predict: what will it hold after the +1 lever?', answer: pc + 1,
      hint: 'The lever adds 1 to the address in the PC.', why: pc + ' + 1 = ' + (pc + 1) + '.',
      done: () => { R.i++; setReg('PC', String(pc + 1), 'addr'); explain(e.say); } };
  }

  // ---------------------------------------------------------------- the hand: hold to grab, let go to put down
  function locked() { return !M || M.phase !== 'play' || !R || R.over || !!R.ask || !$('cardWrap').hidden; }
  function grabTarget() {
    if (hand.item || locked()) return null;
    const s = nearestSlot(0.62, s => s.crate || s.press || s.items.length);
    return s ? { slot: s } : null;
  }
  function setHand(down) {
    if (hand.down === down) return;
    hand.down = down;
    $('leftBtn')?.classList.toggle('on', down);
    if (!down) {
      // let go too soon: say so, so a tap never just seems to do nothing
      if (hand.pending) toast('Hold Space a little longer. A cube or card that is already in place needs a short hold to pick up.', 'hint');
      else if (hand.item && clock - (hand.since || 0) < 0.35 && nearestSlot(0.9, x => !x.press) === hand.from) { hand.quick = true; }
      hand.pending = null; letGo();
      if (hand.quick) { hand.quick = false; toast('Keep holding Space to carry it. Let go when you reach a pad.', 'hint'); }
      hint(); return;
    }
    if (locked()) {
      if (M && M.phase === 'play' && R && R.ask) toast('Predict first: answer on the right.', 'hint');
      else if (M && M.phase !== 'play') toast(M.phase === 'ask' ? 'Answer the question on the right first.' : 'Press the button on the mission sheet to go on.', 'hint');
      else if (R && R.over) toast('Press the button on the mission sheet to go on.', 'hint');
      return;
    }
    const g = grabTarget(); if (!g) return;
    const s = g.slot;
    if (s.risky && !s.crate && !s.press && !s.copyOut && !s.take(top(s))) { hand.pending = { s, at: clock, it: top(s) }; hint(); return; }
    doGrab(s);
  }
  function holdTick() {
    const p = hand.pending, bar = $('holdBar');
    if (bar) bar.style.width = p && hand.down ? Math.min(100, (clock - p.at) / HOLD * 100) + '%' : '0%';
    if (!p || !hand.down || clock - p.at < HOLD) return;
    hand.pending = null;
    const g = grabTarget();
    if (g && g.slot === p.s && top(p.s) === p.it) doGrab(p.s);
  }
  function doGrab(s) {
    if (s.press) { s.press(s); afterChange(); return; }
    if (s.copyOut) { const c = s.copyOut(s); if (typeof c === 'string') { toast(c, 'hint'); return; } hand.item = c; itemMesh(c); hand.from = s; hand.since = clock; R.moves++; afterChange(); return; }
    if (s.crate) { hand.item = cube(s.crate, { role: 'paren' }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
    const it = top(s), why = s.take(it);
    if (why) { toast(why, 'hint'); return; }
    s.items.pop(); hand.item = it; it.slot = null; hand.from = s; hand.since = clock; R.moves++;
    afterChange();
  }
  function letGo() {
    const it = hand.item; if (!it) return;
    const from = hand.from;
    const back = () => { hand.item = null; hand.from = null; if (from.crate || from.copyOut) killItem(it); else { from.items.push(it); it.slot = from; } };
    const s = nearestSlot(0.9, x => !x.press);
    if (!s) { back(); toast('Let go over a pad: the glowing ring shows where.', 'hint'); afterChange(); return; }
    if (s === from) { back(); afterChange(); return; }
    const res = s.put(it, from);
    if (res) { back(); if (res.mistake) mistake(res.msg); else toast(res.msg, 'hint'); afterChange(); return; }
    hand.item = null; hand.from = null;
    if (s.crate) { killItem(it); afterChange(); return; }
    s.items.push(it); it.slot = s; R.moves++;
    KIND[M.m.kind].placed(it, s, from);
    afterChange();
  }
  function afterChange() {
    if (!M || !R) return;
    if (M.phase === 'play' && !R.over) KIND[M.m.kind].check();
    drawAll();
  }

  // ---------------------------------------------------------------- the guide: the arrow on the floor, the ring, the outline
  function slotTarget(s) { return s ? { x: s.x + (s.w - 1) / 2, y: s.y, reach: 1.05 + (s.w - 1) / 2, box: [s.x - 0.5, s.y - 0.5, s.x + s.w - 0.5, s.y + 0.5], exact: true, slot: s } : null; }
  function boxTarget(x0, y0, x1, y1) { return { x: Math.max(x0, Math.min(x1, pos.x)), y: Math.max(y0, Math.min(y1, pos.y)), reach: 1.1, box: [x0 - 0.5, y0 - 0.5, x1 + 0.5, y1 + 0.5] }; }
  // an arrow to the nearest of several pads, with no ring: you choose which one
  function areaTarget(list) { if (!list.length) return null; const near = list.slice().sort((a, b) => rectDist(a, pos.x, pos.y) - rectDist(b, pos.x, pos.y))[0]; const t = slotTarget(near); t.exact = false; return t; }
  function guideTarget() {
    if (!M || !R || M.phase !== 'play' || R.over) return null;
    // a spoilt challenge round guides like a tutorial: it does not count any more, so show the method
    const m = R.spoilt && M.m.type === 'challenge' && !M.m.noHelp ? Object.assign({}, M.m, { type: 'tutorial', countAsk: true }) : M.m;
    return KIND[M.m.kind].guide(R, m);
  }
  function arrowGeometry(pts, w, hl0) {
    const P = pts.map(([x, y]) => [(x + 0.5) * T, (y + 0.5) * T]), n = P.length, half = w / 2, verts = [], idx = [];
    const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], [tx, ty] = unit(b[0] - a[0], b[1] - a[1]);
      let nx = -ty, ny = tx, k = 1;
      if (i > 0 && i < n - 1) { const [sx, sy] = unit(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); k = Math.min(2, 1 / Math.max(0.3, nx * -sy + ny * sx)); }
      verts.push(P[i][0] + nx * half * k, 3, P[i][1] + ny * half * k, P[i][0] - nx * half * k, 3, P[i][1] - ny * half * k);
      if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    const [ex, ey] = P[n - 1], [tx, ty] = unit(ex - P[n - 2][0], ey - P[n - 2][1]), hw = w * 1.35, hl = hl0 || w * 1.7, o = verts.length / 3;
    verts.push(ex - ty * hw, 3, ey + tx * hw, ex + ty * hw, 3, ey - tx * hw, ex + tx * hl, 3, ey + ty * hl);
    idx.push(o, o + 1, o + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx);
    return g;
  }
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const arrows = new THREE.Group(), arrowBody = new THREE.Mesh(new THREE.BufferGeometry(), arrowMat), arrowGlow = new THREE.Mesh(new THREE.BufferGeometry(), glowMat);
  arrowBody.renderOrder = 3; arrowGlow.renderOrder = 2; arrowGlow.position.y = -0.5; arrows.add(arrowGlow, arrowBody); arrows.count = 0;
  let guideKey = '', guideAt = null, guideRoute = null, routeKey = '';
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function gridRoute(sx, sy, g) {
    const N = MAPW * MAPH, cost = new Float64Array(N * 5).fill(Infinity), prev = new Int32Array(N * 5).fill(-1), buckets = [[]];
    const st = (sy * MAPW + sx) * 5 + 4;
    cost[st] = 0; buckets[0].push(st);
    for (let c = 0; c < buckets.length; c++) {
      const list = buckets[c]; if (!list) continue;
      for (let li = 0; li < list.length; li++) {
        const sid = list[li]; if (cost[sid] !== c) continue;
        const cell = Math.floor(sid / 5), dir = sid % 5, x = cell % MAPW, y = Math.floor(cell / MAPW);
        if (Math.hypot(x - g.x, y - g.y) <= g.reach) {
          const out = []; let k = sid;
          while (k !== -1) { const cc = Math.floor(k / 5); out.unshift([cc % MAPW, Math.floor(cc / MAPW)]); k = prev[k]; }
          return out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
        }
        for (let d = 0; d < 4; d++) {
          const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (solidAt(nx, ny)) continue;
          const nc = c + 1 + (dir !== 4 && dir !== d ? 2 : 0), nid = (ny * MAPW + nx) * 5 + d;
          if (nc < cost[nid]) { cost[nid] = nc; prev[nid] = sid; (buckets[nc] || (buckets[nc] = [])).push(nid); }
        }
      }
    }
    return null;
  }
  const pulse = new THREE.Mesh(new THREE.RingGeometry(62, 74, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2c21b, transparent: true, opacity: 0.9, depthWrite: false }));
  pulse.visible = false;
  function updateGuide(ts) {
    arrowMat.opacity = 0.78 + 0.2 * Math.sin(ts / 220); glowMat.opacity = 0.22 + 0.18 * Math.sin(ts / 220);
    const g = guideTarget();
    pulse.visible = !!(g && g.exact);
    if (g && g.exact) { pulse.position.set((g.x + 0.5) * T, PAD_H + 3, (g.y + 0.5) * T); pulse.scale.set(g.slot.w, 1, 1); pulse.material.opacity = 0.5 + 0.4 * Math.sin(ts / 180); }
    if (!g || Math.hypot(g.x - pos.x, g.y - pos.y) < g.reach + 0.2) { arrows.visible = false; arrows.count = 0; guideKey = ''; return; }
    const sx = Math.round(pos.x), sy = Math.round(pos.y);
    const tk = g.x.toFixed(2) + ',' + g.y.toFixed(2);
    if (tk + '@' + sx + ',' + sy !== routeKey) { routeKey = tk + '@' + sx + ',' + sy; guideRoute = gridRoute(sx, sy, g); }
    if (tk === guideKey && guideAt && Math.hypot(pos.x - guideAt[0], pos.y - guideAt[1]) < 0.03) return;
    guideKey = tk; guideAt = [pos.x, pos.y];
    const tiles = guideRoute;
    if (!tiles) { arrows.visible = false; return; }
    const corners = [tiles[0]];
    for (let i = 1; i < tiles.length - 1; i++) {
      const p = tiles[i - 1], q = tiles[i], r = tiles[i + 1];
      if ((q[0] - p[0]) !== (r[0] - q[0]) || (q[1] - p[1]) !== (r[1] - q[1])) corners.push(q);
    }
    if (tiles.length > 1) corners.push(tiles[tiles.length - 1]);
    let pts;
    if (corners.length > 1) { const [c0, c1] = corners; pts = [c0[1] === c1[1] ? [pos.x, c0[1]] : [c0[0], pos.y]].concat(corners.slice(1)); }
    else pts = [[pos.x, pos.y]];
    const last = pts[pts.length - 1];
    let tip = [g.x, g.y];
    if (g.box) { const [x0, y0, x1, y1] = g.box; tip = [Math.max(x0, Math.min(x1, last[0])), Math.max(y0, Math.min(y1, last[1]))]; }
    if (Math.abs(tip[0] - last[0]) > 0.02 && Math.abs(tip[1] - last[1]) > 0.02) {
      const prevPt = pts[pts.length - 2], horiz = prevPt ? Math.abs(prevPt[1] - last[1]) < 1e-6 : Math.abs(tip[0] - last[0]) > Math.abs(tip[1] - last[1]);
      pts.push(horiz ? [tip[0], last[1]] : [last[0], tip[1]]);
    }
    pts.push(tip);
    const trim = (list, len, fromEnd) => {
      const p = fromEnd ? list.slice().reverse() : list.slice();
      while (p.length > 1 && len > 0) {
        const l = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
        if (l > len) { p[0] = [p[0][0] + (p[1][0] - p[0][0]) * len / l, p[0][1] + (p[1][1] - p[0][1]) * len / l]; len = 0; }
        else { len -= l; p.shift(); }
      }
      return fromEnd ? p.reverse() : p;
    };
    let line = trim(pts, 0.45, false);
    line = trim(line, 34 * 1.7 / T, true);
    const clean = [line[0]];
    for (const p of line) { const c = clean[clean.length - 1]; if (Math.hypot(p[0] - c[0], p[1] - c[1]) > 0.04) clean.push(p); }
    if (clean.length < 2) { arrows.visible = false; return; }
    arrowBody.geometry.dispose(); arrowGlow.geometry.dispose();
    arrowBody.geometry = arrowGeometry(clean, 34); arrowGlow.geometry = arrowGeometry(clean, 64, 34 * 1.7 + 14);
    arrows.visible = true; arrows.count = clean.length;
  }
  // an outline round what an empty hand would grab, or the pad a carried thing would go onto; the cube itself glows
  const outlineG = new THREE.Group();
  const outMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  let outlineKey = '', glowing = new Set();
  function updateOutline(ts) {
    outMat.opacity = 0.6 + 0.35 * Math.sin(ts / 170);
    const g = grabTarget(), s = g ? g.slot : hand.item && !locked() ? nearestSlot(0.9, x => !x.press) : null;
    // what glows: the thing under your hand, the next thing the guide points at, and in a bit-string challenge every
    // tray you could pick up (none of them is singled out)
    const want = new Set();
    if (g && !g.slot.crate && !g.slot.press && top(g.slot)) want.add(top(g.slot));
    const gt = !hand.item ? guideTarget() : null;
    if (gt && gt.exact && gt.slot.items.length) want.add(top(gt.slot));
    if (gt && gt.glowAll) gt.glowAll.forEach(x => want.add(x));
    for (const x of glowing) if (!want.has(x)) x.k3?.setGlow(false);
    for (const x of want) if (!glowing.has(x)) x.k3?.setGlow(true);
    glowing = want;
    const key = s ? s.id + (g ? 'g' : 'd') : '';
    if (key === outlineKey) return;
    outlineKey = key;
    for (const o of outlineG.children.slice()) { outlineG.remove(o); o.geometry.dispose(); }
    if (!s) return;
    const w = s.w * T - 4, d = T - 4, cx = (s.x + s.w / 2) * T, cz = (s.y + 0.5) * T, th = 10;
    for (const [x, z, sx, sz] of [[0, -d / 2, w + th, th], [0, d / 2, w + th, th], [-w / 2, 0, th, d], [w / 2, 0, th, d]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 4, sz), outMat); m.position.set(cx + x, PAD_H + 3, cz + z); outlineG.add(m);
    }
  }

  // ================================================================ missions and the mission sheet
  function inProgress() { return !!(M && R && M.phase === 'play' && (R.moves > 0 || M.have > 0) && !R.over); }
  function leaveThen(go) { if (!inProgress()) { go(); return; } M.leave = go; drawPanel(); document.querySelector('#mission .leave')?.scrollIntoView({ block: 'nearest' }); }
  function start(i) {
    missionAt = i; const m = MISSIONS[i]; openSecs.add(m.group);
    M = { m, phase: m.before ? 'ask' : 'play', have: 0, spoilt: 0, walked: false, afterOk: !m.after, lastKey: null };
    hand.item = null; hand.from = null; hand.pending = null;
    newRound();
  }
  // lesson mode: on or off, and which lesson (remembered on this computer)
  const lessonMode = Object.assign({ on: false, id: LESSONS[0].id }, load('lessonMode', {}) || {});
  { const q = new URLSearchParams(location.search).get('lesson'); if (q && LESSONS.some(L => L.id === q)) { lessonMode.on = true; lessonMode.id = q; } }
  const lessonList = () => { const L = LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]; return L.missions.concat(L.ext || []).map(id => MISSIONS.findIndex(m => m.id === id)).filter(i => i >= 0); };
  const isExt = i => ((LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).ext || []).includes(MISSIONS[i].id);
  function startLesson() { const ids = lessonList(); start(ids.find(i => !done[MISSIONS[i].id]) ?? ids[0]); }
  const nextMission = () => {
    if (lessonMode.on) { const ids = lessonList(), k = ids.indexOf(missionAt); if (k >= 0) return k + 1 < ids.length ? ids[k + 1] : null; }
    const sec = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === MISSIONS[missionAt].group).map(([, i]) => i), k = sec.indexOf(missionAt); return k >= 0 && k + 1 < sec.length ? sec[k + 1] : (missionAt + 1 < MISSIONS.length ? missionAt + 1 : null); };
  const starsHtml = n => '<span class="stars" aria-label="' + n + ' of 3 stars">' + [0, 1, 2].map(i => '<svg viewBox="0 0 24 24" class="' + (i < n ? 'on' : '') + '"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg>').join('') + '</span>';

  let lastFocus = "";
  function drawPanel() {
    const t = $('mission'), m = M.m, K = KIND[m.kind];
    t.hidden = false; t.innerHTML = '';
    const inLesson = lessonMode.on && lessonList().includes(missionAt), inSec = inLesson ? lessonList().map(i => MISSIONS[i]) : MISSIONS.filter(x => x.group === m.group);
    const where = inLesson ? (LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).title.split(':')[0] : m.group;
    t.appendChild(el('div', { class: 'head' }, '<span>' + (inLesson ? where + ': ' + m.group : m.group) + '</span><span>' + (inLesson ? (isExt(missionAt) ? 'Extension' : 'Activity') : m.type === 'tutorial' ? 'Tutorial' : 'Challenge') + ' ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + '</span>'));
    t.appendChild(el('h2', {}, m.title));
    if (done[m.id] && M.phase !== 'done') t.appendChild(el('p', { class: 'note' }, 'Done before. Play it again for practice.'));
    t.appendChild(el('p', {}, m.intro));
    t.appendChild(el('div', { class: 'cl-expr' }, K.expr(R, m)));
    if (m.type === 'tutorial') {
      const st = K.steps(R, m), ol = el('ol', { class: 'steps' });
      let now = st.findIndex(s => !s.done()); if (M.phase === 'done') now = st.length;
      st.forEach((s, i) => ol.appendChild(el('li', { class: i < now || (now < 0) ? 'done' : i === now ? 'now' : 'later' }, '<span>' + s.text + '</span>')));
      t.appendChild(ol);
    } else {
      t.appendChild(el('ul', { class: 'goals' }, K.goals(m).map(g => '<li>' + g + '</li>').join('')));
      t.appendChild(el('p', { class: 'note' }, 'The arrow shows where to go, not what to do: you decide each move. <b>' + M.have + ' of ' + (m.need || NEED) + ' clean ' + ((m.need || NEED) === 1 ? 'run' : 'rounds in a row') + '.</b>'));
    }
    if (R.ask) t.appendChild(predictBox(R.ask));
    if (R.why && !R.over) t.appendChild(el('p', { class: 'cl-why' }, '<b>Why:</b> ' + R.why));
    if (R.over && R.endMsg) t.appendChild(el('p', { class: R.spoilt ? 'note' : 'win' }, R.endMsg));
    if (R.over && m.type === 'challenge' && R.spoilt && R.why) t.appendChild(el('p', { class: 'cl-why' }, '<b>The mistake:</b> ' + R.why));
    if (M.phase === 'done') t.appendChild(el('p', { class: 'win' }, 'Mission complete!' + (M.stars ? ' ' + starsHtml(M.stars) : '')));
    if (M.phase === 'ask') t.appendChild(askBox(m.before, () => { M.phase = 'play'; drawAll(); }));
    if (M.phase === 'done' && !M.afterOk) t.appendChild(askBox(m.after, () => { M.afterOk = true; drawAll(); }));
    const act = el('div', { class: 'actions' });
    if (M.phase === 'done' && M.afterOk) { const nx = nextMission(); act.appendChild(nx != null ? btn('Next mission', 'go', () => start(nx)) : btn('Play again', 'go', () => start(missionAt))); if (inLesson && !isExt(missionAt) && (nx == null || isExt(nx))) t.appendChild(el('p', { class: 'win' }, 'Lesson complete! Every activity for this lesson is done.' + (nx != null ? ' Next: the extension challenges.' : ''))); }
    else if (M.phase === 'play' && R.over) act.appendChild(btn('Next round', 'go', () => newRound()));
    if (M.phase === 'play' && !R.over) act.appendChild(btn('Start again', '', () => leaveThen(() => { M.have = 0; newRound(); })));
    if (!m.noHelp) act.appendChild(btn('Walk me through it', '', walkMe));
    t.appendChild(act);
    t.appendChild(navBox());
    // what needs attention now glows and is scrolled into view: a question first (it glows until it is answered),
    // then the end of a round (the result and its button), then the step you are on
    const ask = t.querySelector('.ask'), step = t.querySelector('.steps li.now');
    const focus = ask || (R.over || M.phase === 'done' ? act : step);
    if (focus) {
      if (focus !== act) focus.classList.add('attn');
      const key = (ask ? 'ask:' + (R.ask ? R.ask.q : M.phase) : R.over || M.phase === 'done' ? 'end:' + M.phase : 'step:' + [...t.querySelectorAll('.steps li')].indexOf(step)) + '@' + missionAt;
      const box = t.getBoundingClientRect(), r = focus.getBoundingClientRect(), off = r.top < box.top || r.bottom > box.bottom;
      // scroll when it is new, and pull it back if it has been scrolled out of sight
      if (key !== lastFocus || off) focus.scrollIntoView({ block: ask ? 'center' : 'nearest' });   // instant: a smooth scroll never ends in a hidden frame
      lastFocus = key;
    }
    $('step').textContent = where + ': ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length;
  }
  function navBox() {
    const box = el('div', { class: 'navbox' });
    box.appendChild(el('div', { class: 'head' }, '<span>Choose a mission</span>'));
    if (M.leave) {
      const lv = el('div', { class: 'leave' }, '<b>Leave this mission?</b> This round will be lost.'), row = el('div', { class: 'actions' });
      row.append(btn('Leave', 'go', () => { const go = M.leave; M.leave = null; go(); }), btn('Stay', '', () => { M.leave = null; drawPanel(); }));
      lv.appendChild(row); box.appendChild(lv);
    }
    const modeBar = el('div', { class: 'modebar seg', role: 'group', 'aria-label': 'Show' });
    [['all', 'All missions'], ['lesson', 'Lesson mode']].forEach(([k, label]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String((lessonMode.on ? 'lesson' : 'all') === k) }, label);
      b.addEventListener('click', () => {
        const on = k === 'lesson', leaving = on && !lessonList().includes(missionAt);
        const go = () => { lessonMode.on = on; save('lessonMode', lessonMode); if (leaving) startLesson(); else drawAll(); };
        if (leaving) leaveThen(go); else go();
      });
      modeBar.appendChild(b);
    });
    box.appendChild(modeBar);
    const nav = el('div', { class: 'sections', role: 'navigation', 'aria-label': 'Missions' });
    const stars = load('all:stars', {}) || {};
    if (lessonMode.on) {
      const pickL = el('select', { id: 'nbLesson', 'aria-label': 'Lesson' });
      LESSONS.forEach(L => pickL.appendChild(el('option', { value: L.id }, L.title)));
      pickL.value = lessonMode.id;
      pickL.addEventListener('change', () => { const want = pickL.value; pickL.value = lessonMode.id; leaveThen(() => { lessonMode.id = want; save('lessonMode', lessonMode); startLesson(); }); });
      nav.appendChild(pickL);
      const ids = lessonList(), core = ids.filter(i => !isExt(i)), total = core.reduce((n, i) => n + minsOf(MISSIONS[i]), 0), left = core.filter(i => !done[MISSIONS[i].id]).reduce((n, i) => n + minsOf(MISSIONS[i]), 0);
      nav.appendChild(el('p', { class: 'note' }, core.filter(i => done[MISSIONS[i].id]).length + ' of ' + core.length + ' done. About ' + total + ' minutes in all' + (left && left < total ? ', about ' + left + ' left.' : '.')));
      const items = el('div', { class: 'sec-list lesson-list' });
      ids.forEach((i, k) => {
        const x = MISSIONS[i];
        if (isExt(i) && !isExt(ids[k - 1])) items.appendChild(el('p', { class: 'note' }, '<b>Extension challenges</b> for anyone who finishes early.'));
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[x.id] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (stars[x.id] != null ? starsHtml(stars[x.id]) : '') + '<span class="mins">' + minsOf(x) + ' min</span>');
        b.disabled = !(k === 0 || done[MISSIONS[ids[k - 1]].id] || done[x.id]);
        b.addEventListener('click', () => leaveThen(() => start(i)));
        items.appendChild(b);
      });
      nav.appendChild(items);
      box.appendChild(nav);
      return box;
    }
    SECTIONS.forEach(sec => {
      const list = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === sec);
      const det = el('details', { class: 'sec' + (sec === M.m.group ? ' current' : '') });
      if (openSecs.has(sec)) det.open = true;
      det.appendChild(el('summary', {}, '<span>' + sec + '</span><span class="count">' + list.filter(([x]) => done[x.id]).length + ' of ' + list.length + '</span>'));
      det.addEventListener('toggle', () => { if (det.open) openSecs.add(sec); else openSecs.delete(sec); });
      const items = el('div', { class: 'sec-list' });
      list.forEach(([x, i], k) => {
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[x.id] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (stars[x.id] != null ? starsHtml(stars[x.id]) : ''));
        b.disabled = !(k === 0 || done[list[k - 1][0].id] || done[x.id]);
        b.addEventListener('click', () => leaveThen(() => start(i)));
        items.appendChild(b);
      });
      det.appendChild(items); nav.appendChild(det);
    });
    box.appendChild(nav);
    return box;
  }
  // A prediction: a typed number, or a row of lamps to switch. Tutorial: wrong shows how, try again. Challenge: wrong
  // is a mistake, the answer is shown and the machine runs.
  function predictBox(a) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Predict.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' + (a.fb ? ' bad' : '') }, a.fb || '');
    let read;
    const row = el('div', { class: 'ask-row' });
    if (a.type === 'num') {
      const inp = el('input', { type: 'text', inputmode: 'numeric', id: 'clAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.appendChild(inp); read = () => { const v = inp.value.trim().replace(/−/g, '-'); return /^-?\d+$/.test(v) ? Number(v) : null; };
    } else if (a.type === 'choice') {
      a.order = a.order || shuffle(a.options);
      let chosen = null;
      const opts = el('div', { class: 'ask-opts' });
      a.order.forEach(o => opts.appendChild(btn(o, '', () => { chosen = o; go(); })));
      row.appendChild(opts); read = () => chosen;
    } else {
      a.pick = a.pick || Array(a.len).fill('?');
      const lamps = el('div', { class: 'cl-pick', role: 'group', 'aria-label': 'Your tray' });
      a.pick.forEach((b, i) => {
        const x = el('button', { type: 'button', class: 'cl-l ' + (b === '1' ? 'on' : b === '0' ? 'off' : 'unk'), 'aria-label': 'Lamp ' + (i + 1) + ': ' + (b === '?' ? 'not set' : b) }, b);
        x.addEventListener('click', () => { a.pick[i] = a.pick[i] === '1' ? '0' : '1'; drawPanel(); document.querySelectorAll('.cl-pick button')[i]?.focus(); });
        lamps.appendChild(x);
      });
      row.appendChild(lamps); read = () => a.pick.includes('?') ? null : a.pick.join('');
    }
    const go = () => {
      const v = read();
      if (v == null) { fb.className = 'ask-fb bad'; fb.textContent = a.type === 'num' ? 'Type a whole number.' : 'Switch every lamp on or off first.'; return; }
      if (v === a.answer) { log.note('Predicted ' + v + ' (right).'); R.ask = null; R.why = null; toast('Right!', 'good'); a.done(); afterChange(); return; }
      if (M.m.type === 'challenge') { R.ask = null; mistake('You predicted ' + v + '. ' + a.why); a.done(); afterChange(); return; }
      a.fb = 'Not quite. ' + a.hint + ' Try again.'; log.note('Predicted ' + v + ' (wrong).');
      if (a.pick) a.pick = Array(a.len).fill('?'); a.order = null;
      drawPanel(); $('clAsk')?.focus();
    };
    if (a.type !== 'choice') row.appendChild(btn('Check', 'go', go));
    box.append(row, fb);
    return box;
  }
  function askBox(a, onRight) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Think.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' }), opts = el('div', { class: 'ask-opts' });
    shuffle(a.options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => opts.appendChild(btn(o, '', () => {
      if (i === 0) { log.note('Question answered right.'); toast('Yes!', 'good'); onRight(); }
      else { fb.className = 'ask-fb bad'; fb.innerHTML = 'Not quite. ' + a.why + ' Try again.'; shuffle([...opts.children]).forEach(x => opts.appendChild(x)); }
    })));
    box.append(opts, fb);
    return box;
  }
  function walkMe() {
    M.walked = true;
    const steps = KIND[M.m.kind].walk(R, M.m);
    let i = 0;
    const wrap = $('cardWrap'), card = $('card');
    const draw = () => {
      const s = steps[i];
      card.innerHTML = '<h2>Walk me through it</h2><p class="small">A different example, step by step.</p><div class="count">Step ' + (i + 1) + ' of ' + steps.length + '</div><p class="text">' + s.text + '</p>' + (s.visual || '') + '<div class="actions"></div>';
      const act = card.querySelector('.actions');
      const back = btn('Back', '', () => { if (i > 0) { i--; draw(); } }); back.disabled = i === 0;
      act.append(back, btn(i === steps.length - 1 ? 'Done' : 'Next step', 'go', () => { if (i < steps.length - 1) { i++; draw(); } else { wrap.hidden = true; log.note('Walk me through it (' + steps.length + ' steps).'); } }));
    };
    keys.clear(); setHand(false);
    wrap.hidden = false; draw(); card.querySelector('.btn:not([disabled])')?.focus();
  }
  function drawAll() { drawPanel(); hint(); }

  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls === 'bad' ? 'bad' : cls === 'good' ? 'good' : 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, cls === 'bad' ? 5200 : 3200); }
  function hint() {
    // what Space does right now, for what is in front of you: HOLD (pick up and carry) or PRESS (switch a lamp)
    let h, key = 'hold to grab', mode = '';
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + s.crate + ' cube' : s.items.length ? (top(s).card ? 'the card "' + top(s).text + '"' : 'the ' + top(s).sym + ' cube') : '');
    if (hand.item) { h = '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.' + (hand.item.card ? ' Card: "' + hand.item.text + '"' : ''); key = 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.copyOut) { h = '<b>Hold Space</b> to take a copy of ' + (s.items.length ? 'the ' + top(s).sym + ' cube' : 'it') + ', and keep holding to carry it. The ' + (s.role === 'mem' ? 'memory box' : 'register') + ' keeps its value.'; key = 'hold to copy'; mode = 'hold'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Hold Space</b> to pick up ' + what + '. It is already in place, so hold it down until the bar fills.'; key = 'hold to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Hold Space</b> to pick up ' + what + ', and keep holding to carry it.'; key = 'hold to pick up'; mode = 'hold'; }
    else h = 'Walk up to a cube or card. <b>Hold Space</b> (or the left mouse button) to pick it up, and keep holding to carry it. Right-drag turns the camera.';
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
    const k = $('keyWhat'); if (k && k.textContent !== key) k.textContent = key;
    const b = $('leftBtn'); if (b) b.dataset.mode = mode;
  }

  // ================================================================ the frame loop and input (as Network Builder 3D)
  function setOverview(on) { overview = on; view?.setFit(on ? MAPW : 16); $('mapBtn').textContent = on ? 'Walk (M)' : 'Map (M)'; }
  let last = 0;
  function frame(ts) { requestAnimationFrame(frame); tick(ts); }
  function tick(ts) {
    clock = Math.max(clock, ts / 1000);
    holdTick();
    const dt = last ? Math.max(0, Math.min(0.1, (ts - last) / 1000)) : 0.016; last = Math.max(last, ts);
    if (!view) return;
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
    if (stick) { dx = stick.x; dy = stick.y; }
    const len = Math.hypot(dx, dy);
    moving = len > 0.15;
    if (moving) {
      [dx, dy] = view.rotateInput(dx / Math.max(1, len), dy / Math.max(1, len));
      const sp = SPEED * dt, nx = pos.x + dx * sp, ny = pos.y + dy * sp;
      if (free(nx, ny)) { pos.x = nx; pos.y = ny; } else if (free(nx, pos.y)) pos.x = nx; else if (free(pos.x, ny)) pos.y = ny;
      pos.face = Math.atan2(dx, dy);
    }
    tickNo++;
    moveItems(dt);
    updateOutline(ts);
    updateGuide(ts);
    hint();
    me.update(dt, { x: pos.x, y: pos.y, face: pos.face, moving, hands: [0, 0].map(() => ({ down: hand.down || !!hand.item, hold: hand.item ? 'dev' : null })) }, true);
    view.follow(pos.x, pos.y);
    view.render(dt);
  }
  const typing = e => /input|select|textarea/i.test(e.target?.tagName || '');
  document.addEventListener('keydown', e => {
    const k = e.code;
    if (typing(e)) return;
    if (!$('cardWrap').hidden) { if (k === 'Escape') $('cardWrap').hidden = true; return; }
    if (k === 'Space') { e.preventDefault(); if (e.repeat) return; setHand(true); }
    if (k === 'KeyM') { setOverview(!overview); return; }
    if (k.startsWith('Arrow')) e.preventDefault();
    keys.add(k);
  });
  document.addEventListener('keyup', e => {
    const k = e.code; keys.delete(k);
    if (typing(e)) return;
    if (k === 'Space') { e.preventDefault(); setHand(false); }
  });
  const focusMsg = $('focusMsg');
  const showFocus = () => { const has = document.hasFocus(); focusMsg.hidden = has; if (!has) keys.clear(); };
  focusMsg.addEventListener('click', () => { window.focus(); focusMsg.hidden = true; container.focus?.(); });
  addEventListener('focus', showFocus); addEventListener('blur', showFocus);
  document.addEventListener('pointerdown', () => { if (!document.hasFocus()) window.focus(); });
  try { window.focus(); } catch (e) { }
  setTimeout(showFocus, 300);
  document.addEventListener('focusin', e => { if (typing(e)) { keys.clear(); stick = null; const kn = $('knob'); if (kn) kn.style.transform = ''; } });
  addEventListener('blur', () => { keys.clear(); setHand(false); });
  container.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) setHand(true); });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0) setHand(false); });
  container.addEventListener('contextmenu', e => e.preventDefault());
  { const b = $('leftBtn'); b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); setHand(true); }); b.addEventListener('pointerup', () => setHand(false)); b.addEventListener('pointercancel', () => setHand(false)); }
  $('mapBtn').addEventListener('click', () => setOverview(!overview));
  // a question must never stay scrolled out of sight: a moment after the sheet stops scrolling, it comes back
  { let st = 0; $('mission').addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => {
    const t = $('mission'), q = t.querySelector('.ask'); if (!q) return;
    const box = t.getBoundingClientRect(), r = q.getBoundingClientRect();
    if (r.bottom < box.top + 40 || r.top > box.bottom - 40) q.scrollIntoView({ block: 'center' });
  }, 1500); }); }
  {
    const st = $('stick'), knob = $('knob');
    const at = e => { const r = st.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } stick = { x, y }; knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`; };
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); at(e); });
    st.addEventListener('pointermove', e => { if (stick) at(e); });
    const end = () => { stick = null; knob.style.transform = ''; };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  }

  let first = 0;
  while (first < MISSIONS.length - 1 && done[MISSIONS[first].id]) first++;
  const q = new URLSearchParams(location.search).get('mission'), qi = MISSIONS.findIndex(x => x.id === q);
  if (qi >= 0) start(qi); else if (lessonMode.on) startLesson(); else start(first);
  requestAnimationFrame(frame);
  if (/[?&]debug/.test(location.search)) window.__lab = {
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS,
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
