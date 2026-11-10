// FDE Steps: the model, the questions, mastery and scheduling. No DOM here, so tools/test_fde_steps.mjs can
// load it in node. Words match the Year 10 FDE lesson (y10-3-1-l4) and the CPU Lab FDE activity.
var FDE = (function () {
  'use strict';

  var NEED = 3;              // right in a row to master an item
  var MASTERED_SHARE = 0.25; // how often a mastered item comes back while others are still being learned

  function rnd(a, b, r) { return a + Math.floor((r || Math.random)() * (b - a + 1)); }
  function pick(list, r) { return list[Math.floor((r || Math.random)() * list.length)]; }
  function shuffle(list, r) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor((r || Math.random)() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Four addresses: LOAD x, ADD y, then two numbers (the lesson teaches only LOAD and ADD). Every value differs,
  // so an address can never be mistaken for a number.
  function memory(r) {
    for (var t = 0; t < 200; t++) {
      var b = rnd(2, 9, r), x = b + 2 + rnd(0, 1, r), y = x === b + 2 ? b + 3 : b + 2;
      var vx = rnd(10, 40, r), vy = rnd(2, 9, r);
      if (rnd(0, 1, r)) { var s = vx; vx = vy; vy = s; }
      var nums = [b, b + 1, b + 2, b + 3, vx, vy, b + 4];
      if (nums.some(function (n, i) { return nums.indexOf(n) !== i; })) continue;
      var cells = {};
      cells[b] = 'LOAD ' + x; cells[b + 1] = 'ADD ' + y; cells[x] = String(vx); cells[y] = String(vy);
      return { base: b, x: x, y: y, vx: vx, vy: vy, cells: cells, addrs: [b, b + 1, b + 2, b + 3] };
    }
    throw new Error('no memory');
  }

  // One instruction run from the registers before it.
  function caseOf(M, op) {
    if (op === 'LOAD') return { M: M, op: 'LOAD', pc: M.base, ins: 'LOAD ' + M.x, a: M.x, n: M.vx, acc: null,
      regs: { PC: String(M.base), MAR: '-', MDR: '-', CIR: '-', ACC: '-' } };
    return { M: M, op: 'ADD', pc: M.base + 1, ins: 'ADD ' + M.y, a: M.y, n: M.vy, acc: M.vx,
      regs: { PC: String(M.base + 1), MAR: String(M.x), MDR: String(M.vx), CIR: 'LOAD ' + M.x, ACC: String(M.vx) } };
  }

  var STAGE_NAMES = { F: 'Fetch', D: 'Decode', E: 'Execute' };

  // Every move of one instruction. to: the box that changes (or 'Memory', 'CU'); value: what it holds after;
  // bus: the bus the value travels on ('Address bus', 'Data bus', 'No bus'); text: what happens; why: the reason.
  function moves(c) {
    var p = c.pc, ins = c.ins, a = c.a, n = c.n, res = c.op === 'LOAD' ? n : c.acc + n;
    var list = [
      { id: 'f1', stage: 'F', to: 'MAR', from: 'PC', value: String(p), bus: 'Address bus', set: { MAR: String(p) },
        short: 'PC to MAR', text: 'The address ' + p + ' is copied from the PC into the MAR.',
        why: 'Memory only reads the address in the MAR.' },
      { id: 'f2', stage: 'F', to: 'Memory', from: 'MAR', value: null, bus: 'Address bus', set: {},
        short: 'MAR to memory', text: 'The MAR sends ' + p + ', the address from the PC, to memory. The CU sends a read signal.',
        why: 'Memory needs the address (on the address bus) and a read signal (on the control bus), so it sends back what it holds there.' },
      { id: 'f3', stage: 'F', to: 'MDR', from: 'Memory', value: ins, bus: 'Data bus', set: { MDR: ins },
        short: 'Memory to MDR (instruction)', text: 'Memory sends back the instruction ' + ins + ' into the MDR.',
        why: 'Everything that comes from memory arrives in the MDR, on the data bus.' },
      { id: 'f4', stage: 'F', to: 'PC', from: 'PC', value: String(p + 1), bus: 'No bus', set: { PC: String(p + 1) },
        short: 'PC + 1', text: 'The PC goes up by 1, to ' + (p + 1) + '.',
        why: 'The program is stored in order, so the next instruction is at the next address. This happens during fetch, before decode.' },
      { id: 'f5', stage: 'F', to: 'CIR', from: 'MDR', value: ins, bus: 'Data bus', set: { CIR: ins },
        short: 'MDR to CIR', text: ins + ' is copied from the MDR into the CIR, inside the CU.',
        why: 'The next value from memory will arrive in the MDR and replace it, so the instruction is kept safe in the CIR.' },
      { id: 'd', stage: 'D', to: 'CU', from: 'CIR', value: null, bus: 'No bus', set: {},
        short: 'Decode', text: 'The CU works out what ' + ins + ' means, using the instruction set.',
        why: 'Each instruction needs different parts to do different jobs, so the CU must work it out before anything is done.' },
      { id: 'e1', stage: 'E', to: 'MAR', from: 'CIR', value: String(a), bus: 'Address bus', set: { MAR: String(a) },
        short: 'Address into MAR', text: ins + ' needs the number stored at address ' + a + ', so ' + a + ' goes into the MAR.',
        why: 'The ' + a + ' in ' + ins + ' is an address, and memory only reads the address in the MAR.' },
      { id: 'e2', stage: 'E', to: 'Memory', from: 'MAR', value: null, bus: 'Address bus', set: {},
        short: 'MAR to memory (number)', text: 'The MAR sends ' + a + ', the address in ' + ins + ', to memory, with a read signal.',
        why: 'Memory reads the address in the MAR and sends back what it holds there.' },
      { id: 'e3', stage: 'E', to: 'MDR', from: 'Memory', value: String(n), bus: 'Data bus', set: { MDR: String(n) },
        short: 'Memory to MDR (number)', text: 'Memory sends back the number ' + n + ' into the MDR.',
        why: 'Address ' + a + ' holds ' + n + '. Everything that comes from memory arrives in the MDR, on the data bus.' },
      c.op === 'LOAD'
        ? { id: 'e4L', stage: 'E', to: 'ACC', from: 'MDR', value: String(res), bus: 'Data bus', set: { ACC: String(res) },
            short: 'LOAD: MDR to ACC', text: n + ' is copied from the MDR into the ACC.',
            why: 'LOAD copies the number into the ACC. The ACC holds ' + res + ', not ' + a + ': ' + a + ' was only the address.' }
        : { id: 'e4A', stage: 'E', to: 'ACC', from: 'MDR', value: String(res), bus: 'Data bus', set: { ACC: String(res) },
            short: 'ADD: the ALU adds', text: 'The ALU adds ' + n + ' to the ACC. The result goes into the ACC.',
            why: 'ADD makes the ALU work out ' + c.acc + ' + ' + n + ' = ' + res + '. It adds the number at address ' + a + ', not the address itself.' }
    ];
    var regs = Object.assign({}, c.regs);
    list.forEach(function (m) { m.before = Object.assign({}, regs); Object.assign(regs, m.set); m.after = Object.assign({}, regs); });
    return list;
  }
  // The first move of the next instruction: the cycle starts again.
  function nextFetch(c) {
    var p = c.pc + 1;
    return { id: 'again', stage: 'F', short: 'Back to fetch', text: 'The address ' + p + ' is copied from the PC into the MAR.',
      why: 'The instruction is done, so the CPU goes back to fetch the next one, using the address in the PC. That is why it is a cycle.' };
  }

  var MOVE_IDS = ['f1', 'f2', 'f3', 'f4', 'f5', 'd', 'e1', 'e2', 'e3', 'e4L', 'e4A'];
  var STAGES = [
    { id: 'stage', name: 'Which stage?', items: MOVE_IDS.slice() },
    // The PC can go up by 1 at more than one point in fetch, so "what comes next" never asks about it.
    { id: 'next', name: 'What comes next?', items: ['start'].concat(MOVE_IDS.filter(function (m) { return m !== 'f4'; })) },
    { id: 'where', name: 'Where does it go?', items: ['f1', 'f2', 'f3', 'f5', 'e1', 'e2', 'e3', 'e4L', 'e4A'] },
    { id: 'hold', name: 'What does it hold?', items: ['f1', 'f3', 'f4', 'f5', 'e1', 'e3', 'e4L', 'e4A'] },
    { id: 'run', name: 'Run the cycle', items: ['LOAD', 'ADD', 'BOTH'] }
  ];
  function stage(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; return null; }
  function key(stageId, item) { return stageId + ':' + item; }

  function newState() {
    var s = { v: 1, stage: 'stage', items: {} };
    STAGES.forEach(function (st) { st.items.forEach(function (it) { s.items[key(st.id, it)] = { streak: 0, mastered: false, right: 0, wrong: 0 }; }); });
    return s;
  }
  function fixState(s) {
    var fresh = newState();
    if (!s || typeof s !== 'object' || !s.items) return fresh;
    Object.keys(fresh.items).forEach(function (k) {
      var it = s.items[k];
      if (!it || typeof it !== 'object') s.items[k] = fresh.items[k];
      else { it.streak = Math.max(0, Math.min(NEED, +it.streak || 0)); it.mastered = !!it.mastered; it.right = +it.right || 0; it.wrong = +it.wrong || 0; }
    });
    if (!stage(s.stage)) s.stage = 'stage';
    return s;
  }
  function record(s, stageId, item, ok) {
    var it = s.items[key(stageId, item)];
    var was = it.mastered, stageWas = stageDone(s, stageId), allWas = allDone(s);
    if (ok) { it.right++; it.streak = Math.min(NEED, it.streak + 1); if (it.streak >= NEED) it.mastered = true; }
    else { it.wrong++; it.streak = 0; it.mastered = false; }
    return { newlyMastered: !was && it.mastered, lost: was && !it.mastered,
      stageDone: !stageWas && stageDone(s, stageId), allDone: !allWas && allDone(s) };
  }
  function stageDone(s, stageId) { return stage(stageId).items.every(function (it) { return s.items[key(stageId, it)].mastered; }); }
  function allDone(s) { return STAGES.every(function (st) { return stageDone(s, st.id); }); }
  function counts(s, stageId) {
    var list = stageId ? [stage(stageId)] : STAGES, have = 0, total = 0;
    list.forEach(function (st) { st.items.forEach(function (it) { total++; if (s.items[key(st.id, it)].mastered) have++; }); });
    return { have: have, total: total };
  }
  // Help fades per item: full help on a new item or after a mistake, less after one right, none after two.
  function helpLevel(s, stageId, item) {
    var st = s.items[key(stageId, item)].streak;
    return st === 0 ? 2 : st === 1 ? 1 : 0;
  }
  function pickItem(s, stageId, last, r) {
    var open = stage(stageId).items;
    var learning = open.filter(function (it) { return !s.items[key(stageId, it)].mastered; });
    var known = open.filter(function (it) { return s.items[key(stageId, it)].mastered; });
    var pool = !learning.length ? known : !known.length ? learning : ((r || Math.random)() < MASTERED_SHARE ? known : learning);
    var choice = pool.filter(function (it) { return it !== last; });
    if (!choice.length) choice = open.filter(function (it) { return it !== last; });
    return pick(choice.length ? choice : open, r);
  }

  // The instruction an item is about: e4L and e4A fix it; other moves use either.
  function opFor(item, r) { return item === 'e4L' || item === 'LOAD' ? 'LOAD' : item === 'e4A' || item === 'ADD' ? 'ADD' : pick(['LOAD', 'ADD'], r); }
  function moveOf(list, id) { return list.filter(function (m) { return m.id === id || (id === 'e4L' || id === 'e4A') && m.id === id; })[0]; }

  // Stage 2: what happens after the move just done. Options: the right next move and two others from the same run.
  function nextQuestion(item, r) {
    var c = caseOf(memory(r), opFor(item, r)), list = moves(c).filter(function (m) { return m.id !== 'f4'; });
    var i = item === 'start' ? -1 : list.indexOf(moveOf(list, item));
    var right = i + 1 < list.length ? list[i + 1] : nextFetch(c);
    var done = i >= 0 ? list[i] : null;
    var wrong = shuffle(list.filter(function (m) { return m !== right && m !== done && m.text !== right.text; }), r).slice(0, 2);
    return { c: c, done: done, right: right, options: shuffle([right].concat(wrong), r), index: i, list: list };
  }

  // Stage 4: what a box holds after the move. Wrong options are the classic mix-ups (address or number, old value).
  function holdOptions(m, c) {
    var p = c.pc, a = c.a, n = c.n, ins = c.ins, other = c.op === 'LOAD' ? 'ADD ' + c.M.y : 'LOAD ' + c.M.x;
    var wrong = {
      f1: [String(p + 1), ins], f3: [String(p), other], f4: [String(p), String(p + 2)], f5: [String(p), other],
      e1: [String(n), String(p + 1)], e3: [String(a), String(p + 1)],
      e4L: [String(a), String(c.M.vy === n ? c.M.vx : c.M.vy)], e4A: [String(c.acc + a), String(n)]
    }[m.id];
    var out = [m.value];
    wrong.forEach(function (w) { if (out.indexOf(w) < 0) out.push(w); });
    var k = 1;
    while (out.length < 3 && k < 20) { var v = String(Number(m.value) + k++); if (out.indexOf(v) < 0 && v !== 'NaN') out.push(v); }
    return out;
  }

  return {
    NEED: NEED, STAGES: STAGES, STAGE_NAMES: STAGE_NAMES, MOVE_IDS: MOVE_IDS,
    rnd: rnd, pick: pick, shuffle: shuffle, memory: memory, caseOf: caseOf, moves: moves, nextFetch: nextFetch,
    stage: stage, key: key, newState: newState, fixState: fixState, record: record, stageDone: stageDone, allDone: allDone,
    counts: counts, helpLevel: helpLevel, pickItem: pickItem, opFor: opFor, moveOf: moveOf, nextQuestion: nextQuestion,
    holdOptions: holdOptions
  };
})();
if (typeof module !== 'undefined') module.exports = FDE;
