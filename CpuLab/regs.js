// Watch the Registers (?activity=regs): the five registers (PC, MAR, MDR, CIR, ACC) working through a short stored
// program (syllabus 0478 3.1.2). The student predicts what the registers will hold, checks once, then runs the CPU
// one small step at a time to see why. Any wrong box and the round does not count; NEED clean rounds in a row move up
// a level. Levels: taking the next instruction from memory, carrying it out, then one whole instruction.
// The model is the Cambridge one: MAR <- PC; MDR <- memory[MAR]; PC + 1; CIR <- MDR; the CU decodes the CIR; then
// LOAD/ADD/SUB a: MAR <- a; MDR <- memory[a]; ACC <- MDR, or the ALU adds/takes away MDR. OUTPUT sends the ACC out.
(function () {
  'use strict';
  var el = Lab.el, rnd = Lab.rnd, shuffle = Lab.shuffle, pick = Lab.pick;
  var NEED = 2;
  var REGS = ['PC', 'MAR', 'MDR', 'CIR', 'ACC'];
  var LEVELS = [
    { name: 'Take the next instruction', ask: ['MAR', 'MDR', 'CIR', 'PC'], stop: 'fetch',
      how: 'The PC says where the next instruction is. Its address goes to the MAR, the instruction comes back into the MDR, the PC goes up by 1, and the instruction is copied into the CIR.' },
    { name: 'Carry it out', ask: ['MAR', 'MDR', 'ACC'], stop: 'exec',
      how: 'The CU works out what the instruction in the CIR means. LOAD, ADD and SUB name an address: it goes to the MAR, the number stored there comes back into the MDR, then it goes into the ACC (LOAD) or the ALU adds or takes it away (ADD, SUB).' },
    { name: 'One whole instruction', ask: ['PC', 'MAR', 'MDR', 'CIR', 'ACC'], stop: 'all',
      how: 'Now both halves together: take the instruction from memory, then carry it out. OUTPUT sends the ACC to the screen and changes nothing else.' }
  ];
  var host = document.getElementById('activity');
  var log = Lab.results('cpu-lab-regs', 'CPU Lab: Watch the Registers');
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(new URLSearchParams(location.search).get('level'), 10) || 1) - 1));
  var have = 0, R = null, shownHow = {};

  // ---------------------------------------------------------------- the program and the CPU
  function program() {
    var addrs = shuffle([5, 6, 7]);
    var mem = [{ op: 'LOAD', a: addrs[0] }, { op: pick(['ADD', 'SUB']), a: addrs[1] }, { op: pick(['ADD', 'SUB']), a: addrs[2] }, { op: 'OUTPUT' }, { op: 'STOP' }];
    mem[5] = { n: rnd(20, 40) }; mem[6] = { n: rnd(2, 15) }; mem[7] = { n: rnd(2, 15) };
    mem[addrs[0]] = { n: rnd(25, 45) };
    return mem;
  }
  function text(c) { return c == null ? '-' : c.op ? c.op + (c.a != null ? ' ' + c.a : '') : String(c.n); }
  // Every small step of instruction k, from the registers before it. Each step: { set: {REG: value}, say, half }.
  function micro(mem, k, regs) {
    var r = Object.assign({}, regs), out = [];
    function step(set, say, half) { Object.assign(r, set); out.push({ set: set, say: say, half: half, regs: Object.assign({}, r) }); }
    step({ MAR: String(r.PC) }, 'The address in the PC (' + r.PC + ') is copied into the <b>MAR</b>: this is the address memory will read.', 'fetch');
    step({ MDR: text(mem[k]) }, 'Memory sends what is stored at address ' + r.MAR + ' (' + text(mem[k]) + ') into the <b>MDR</b>.', 'fetch');
    step({ PC: String(Number(r.PC) + 1) }, 'The <b>PC</b> goes up by 1 to ' + (Number(r.PC) + 1) + ', so it holds the address of the <b>next</b> instruction.', 'fetch');
    step({ CIR: r.MDR }, 'The instruction in the MDR is copied into the <b>CIR</b>. The CU now works out what ' + r.MDR + ' means.', 'fetch');
    var c = mem[k];
    if (c.a != null) {
      step({ MAR: String(c.a) }, c.op + ' ' + c.a + ' needs the number stored at address ' + c.a + ', so ' + c.a + ' is copied into the <b>MAR</b>.', 'exec');
      step({ MDR: String(mem[c.a].n) }, 'Memory sends the number at address ' + c.a + ' (' + mem[c.a].n + ') into the <b>MDR</b>.', 'exec');
      if (c.op === 'LOAD') step({ ACC: r.MDR }, 'LOAD copies the number in the MDR into the <b>ACC</b>: it now holds ' + r.MDR + '.', 'exec');
      else {
        var v = c.op === 'ADD' ? Number(r.ACC) + Number(r.MDR) : Number(r.ACC) - Number(r.MDR);
        step({ ACC: String(v) }, 'The <b>ALU</b> works out ' + r.ACC + (c.op === 'ADD' ? ' + ' : ' - ') + r.MDR + ' = ' + v + '. The result goes into the <b>ACC</b>.', 'exec');
      }
    } else if (c.op === 'OUTPUT') step({}, 'OUTPUT sends the number in the ACC (' + r.ACC + ') to the screen. No register changes.', 'exec');
    return out;
  }
  // The registers before instruction k: run instructions 0 to k-1.
  function before(mem, k) {
    var regs = { PC: '0', MAR: '-', MDR: '-', CIR: '-', ACC: '-' };
    for (var i = 0; i < k; i++) { var s = micro(mem, i, regs); regs = s[s.length - 1].regs; }
    return regs;
  }
  function make(level, avoid) {
    for (var t = 0; t < 50; t++) {
      var mem = program();
      var k = level === 1 ? rnd(0, 2) : level === 0 ? rnd(0, 3) : rnd(1, 3);
      var regs0 = before(mem, k), steps = micro(mem, k, regs0);
      var acc = steps.map(function (s) { return Number(s.regs.ACC); }).filter(function (x) { return !isNaN(x); });
      if (acc.some(function (x) { return x < 0 || x > 99; })) continue;
      var fetchEnd = steps.filter(function (s) { return s.half === 'fetch'; }).length;
      var start = level === 1 ? steps[fetchEnd - 1].regs : regs0;
      var end = level === 0 ? steps[fetchEnd - 1].regs : steps[steps.length - 1].regs;
      var shown = level === 1 ? steps.slice(fetchEnd) : level === 0 ? steps.slice(0, fetchEnd) : steps;
      var p = { mem: mem, k: k, start: start, end: end, steps: shown };
      if (avoid && JSON.stringify(avoid.mem) === JSON.stringify(mem) && avoid.k === k) continue;
      return p;
    }
    throw new Error('no program');
  }

  // ---------------------------------------------------------------- drawing
  function memTable(mem, now, hit) {
    return '<table class="mem"><tr><th>Address</th><th>Stored in memory</th></tr>' + mem.map(function (c, i) {
      return '<tr class="' + (c.op ? 'ins' : 'dat') + (now === i ? ' now' : '') + (hit === i ? ' hit' : '') + '"><td class="addr">' + i + '</td><td class="val">' + text(c) + '</td></tr>';
    }).join('') + '</table>';
  }
  function regBox(regs, changed, inputs) {
    var rows = REGS.map(function (r) {
      var v = inputs && inputs[r] ? '<span class="now-was">now <b>' + regs[r] + '</b> &rarr; <input type="text" id="reg-' + r + '" autocomplete="off" aria-label="' + r + ' will hold"></span>' : '<b>' + regs[r] + '</b>';
      return '<div class="reg' + (changed && changed[r] != null ? ' changed' : '') + '"><span>' + r + '</span>' + v + '</div>';
    }).join('');
    return '<div class="cpu"><div class="small"><b>CPU</b>: the CU is in charge, the ALU does the maths, the registers hold one value each.</div>' + rows + '</div>';
  }
  function question(p, level) {
    var c = p.mem[p.k];
    if (level === 0) return 'The PC holds <b>' + p.start.PC + '</b>. Predict what each register holds once the CPU has taken the next instruction from memory.';
    if (level === 1) return 'The CIR holds <b>' + text(c) + '</b>. Predict what each register holds once it has been carried out.';
    return 'The PC holds <b>' + p.start.PC + '</b>. Predict all five registers once the CPU has taken this instruction <b>and</b> carried it out.';
  }
  function norm(s) { return String(s).trim().toUpperCase().replace(/\s+/g, ' '); }

  function newRound() {
    R = { p: make(lv, R && R.p), phase: 'predict', step: -1, walked: false, level: lv };
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function draw(msg, cls) {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'Watch the Registers'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished: you can follow every register. Keep going for practice.'));
    host.appendChild(Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED));
    host.appendChild(el('div', { class: 'rule' }, '<b>PC</b> address of the next instruction. <b>MAR</b> address memory is about to read. <b>MDR</b> what has just come from memory. <b>CIR</b> the instruction being carried out. <b>ACC</b> the result from the ALU.<br><span class="small">LOAD copies a number into the ACC. ADD and SUB add or take away a number. Each names the address where the number is stored.</span>'));
    var p = R.p, L = LEVELS[R.level];
    var s = R.phase === 'run' && R.step >= 0 ? p.steps[R.step] : null;
    var grid = el('div', { class: 'lab-grid' });
    var hit = s && s.set.MAR != null ? Number(s.set.MAR) : s ? Number(s.regs.MAR) : null;
    grid.appendChild(el('div', {}, memTable(p.mem, p.k, R.phase === 'run' ? hit : null)));
    var right = el('div');
    if (R.phase === 'predict') {
      var ask = {}; L.ask.forEach(function (r) { ask[r] = true; });
      right.appendChild(el('p', { class: 'small' }, 'Each register shows what it holds now. Type what it will hold after.'));
      right.appendChild(el('div', {}, regBox(p.start, null, ask)));
      right.appendChild(el('p', { class: 'task-q' }, question(p, R.level)));
    } else {
      var regs = s ? s.regs : p.start;
      right.appendChild(el('div', {}, regBox(regs, s ? s.set : null)));
      right.appendChild(el('p', { class: 'say' }, s ? s.say : 'Press the button to run the first small step.'));
      right.appendChild(el('p', { class: 'small' }, 'You said: ' + L.ask.map(function (r) { var ok = norm(R.given[r]) === norm(p.end[r]); return r + ' ' + (R.given[r] || '?') + (ok ? '' : ' (it is ' + p.end[r] + ')'); }).join(', ') + '.'));
    }
    var act = el('div', { class: 'actions' });
    if (R.phase === 'predict') act.appendChild(Lab.button('Check', '', check));
    else if (R.step < p.steps.length - 1) act.appendChild(Lab.button(R.step < 0 ? 'Run: first small step' : 'Next small step', '', function () { R.step++; draw(R.msg, R.cls); }));
    else act.appendChild(Lab.button('Next program', '', newRound));
    act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    right.appendChild(act);
    right.appendChild(el('div', { class: 'feedback ' + (cls || ''), role: 'status' }, msg || ''));
    grid.appendChild(right);
    host.appendChild(grid);
    if (R.phase === 'predict') host.querySelectorAll('.reg input').forEach(function (inp) { inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); }); });
    Lab.reportHeight();
  }
  function check() {
    if (R.phase !== 'predict') return;
    var L = LEVELS[R.level], given = {};
    L.ask.forEach(function (r) { var i = document.getElementById('reg-' + r); given[r] = i ? i.value.trim() : ''; });
    if (L.ask.some(function (r) { return !given[r]; })) {
      var keep = given; draw('Type a value in every box first.', 'hint');
      Object.keys(keep).forEach(function (r) { var i = document.getElementById('reg-' + r); if (i) i.value = keep[r]; });
      return;
    }
    var wrong = L.ask.filter(function (r) { return norm(given[r]) !== norm(R.p.end[r]); });
    var ok = !wrong.length;
    R.given = given; R.phase = 'run'; R.step = -1;
    log.add(L.name + ': ' + L.ask.map(function (r) { return r + ' ' + given[r] + (wrong.indexOf(r) < 0 ? '' : ' (should be ' + R.p.end[r] + ')'); }).join(', ') + (R.walked ? ', used Walk me through it' : ''), ok);
    var up = false;
    if (ok) {
      have++;
      if (have >= NEED) { have = 0; if (lv < LEVELS.length - 1) { lv++; up = true; } else log.finish(); }
      R.msg = 'Right, with no mistakes.' + (up ? ' Level up: ' + LEVELS[lv].name + '.' : '') + ' Run it to see each step.';
      R.cls = 'good';
    } else {
      have = 0;
      R.msg = 'Not this time: ' + wrong.map(function (r) { return r + ' should be ' + R.p.end[r]; }).join(', ') + '. This round does not count. Run it one small step at a time to see why.';
      R.cls = 'bad';
    }
    draw(R.msg, R.cls);
  }

  // ---------------------------------------------------------------- walk-throughs: a different program, every small step
  function walkSteps(p) {
    var out = [{ text: 'Instruction ' + p.k + ' is <b>' + text(p.mem[p.k]) + '</b>. Start from the registers as they are now, and change one register at a time.', visual: '<div class="lab-grid">' + memTable(p.mem, p.k) + regBox(p.start) + '</div>' }];
    p.steps.forEach(function (s) { out.push({ text: s.say, visual: '<div class="lab-grid">' + memTable(p.mem, p.k, s.set.MAR != null ? Number(s.set.MAR) : null) + regBox(s.regs, s.set) + '</div>' }); });
    out.push({ text: 'Why two registers for memory? The <b>MAR</b> holds <b>where</b> to look (an address). The <b>MDR</b> holds <b>what</b> was found there (the data or instruction).', visual: '' });
    return out;
  }
  function howItWorks() { var p = make(lv, R && R.p); Lab.walk('How it works: ' + LEVELS[lv].name, LEVELS[lv].how, walkSteps(p)); }
  function walkMe() {
    R.walked = true;
    var p = make(lv, R.p);
    Lab.walk('Walk me through it', 'A similar program with different numbers.', walkSteps(p), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }
  newRound();
})();
