// Fetch, Decode, Execute (?activity=fde): the fetch-decode-execute cycle one move at a time (syllabus 0478 3.1). A tiny
// CPU (PC, MAR, MDR, the CU with the CIR, the ALU with the ACC), the three buses and a memory of four addresses. For each
// move the student picks which box changes next, which bus carries the value, and (from level 2) the value itself; at
// the start of each stage (from level 3) which stage it is. A wrong pick spoils the round: the right move is shown with
// its reason, the rest of the round is lit, and the round does not count. NEED clean rounds in a row move up a level.
// Levels, with the help fading:
//   1 Fetch, step by step     the boxes that move are lit and the move is named, the rules are shown
//   2 Fetch on your own       no lit boxes; pick the values too; a hint on request
//   3 The whole cycle         fetch, decode and execute; say which stage starts; a hint on request
//   4 The whole cycle, no help no rules, no hint, no Walk me through it
//   5 Two instructions        two whole cycles in a row, no help
// ?level=n starts at level n; ?upto=n finishes the activity (for the slide) when level n is cleared.
// The model follows the Cambridge mark schemes: the PC's address goes to the MAR on the address bus, the MAR sends it to
// RAM, the instruction comes back on the data bus into the MDR, the PC is incremented, the instruction goes from the MDR
// to the CIR (built into the CU) on the data bus (0478/11 June 2024 Q5(d), 0478/12 June 2024 Q5(a)); the CU decodes it
// using the instruction set (0478/11 November 2024 Q5(b)); LOAD and ADD then read the address they name and the
// ALU and ACC carry it out (0478/12 November 2025 Q4(a)). The read signal on the control bus is shown with each read.
(function () {
  'use strict';
  var rnd = Lab.rnd, pick = Lab.pick, shuffle = Lab.shuffle;
  var DEST = ['PC', 'MAR', 'MDR', 'CIR', 'CU', 'ACC', 'Memory'];
  var BUSES = ['Address bus', 'Data bus', 'Control bus', 'No bus'];
  var STAGES = ['Fetch', 'Decode', 'Execute'];
  var LEVELS = [
    { name: 'Fetch, step by step', help: 'Lots of help', need: 2, stages: 'fetch', lit: true, values: false, askStage: false, hint: false, walk: true, rules: true,
      how: 'Fetch copies the next instruction from memory into the CPU. The boxes that are used are lit for you. Click the box the value goes to next, then pick the bus that carries the value.' },
    { name: 'Fetch on your own', help: 'Some help', need: 2, stages: 'fetch', lit: false, values: true, askStage: false, hint: true, walk: true, rules: true,
      how: 'The same fetch, with nothing lit. Pick the box the value goes to next, the bus, and the value.' },
    { name: 'The whole cycle', help: 'A little help', need: 2, stages: 'all', lit: false, values: true, askStage: true, hint: true, walk: true, rules: false,
      how: 'Fetch, then decode, then execute. When a new stage starts, say which one it is. Then pick each move as before.' },
    { name: 'The whole cycle, no help', help: 'No help', need: 2, stages: 'all', lit: false, values: true, askStage: true, hint: false, walk: false, rules: false,
      how: 'The same as level 3, with no rules, no hint and no walk through. You can do it.' },
    { name: 'Two instructions in a row', help: 'No help', need: 1, stages: 'two', lit: false, values: true, askStage: true, hint: false, walk: false, rules: false,
      how: 'Two whole cycles, one after the other. Watch the PC: it says where the second instruction is.' }
  ];

  // ---------------------------------------------------------------- the model (pure, so it can be tested)
  function text(c) { return c == null ? '-' : c.op ? c.op + ' ' + c.a : String(c.n); }
  // Four addresses: two instructions, then two numbers. The first instruction is LOAD, the second ADD (the lesson teaches only these two).
  function memory() {
    for (var t = 0; t < 100; t++) {
      var b = rnd(2, 6), x = b + 2 + rnd(0, 1), y = x === b + 2 ? b + 3 : b + 2;
      var big = rnd(12, 40), small = rnd(2, 9);
      var vals = {}; vals[x] = pick([big, small]); vals[y] = vals[x] === big ? small : big;
      var op = 'ADD';
      var mem = {}; mem[b] = { op: 'LOAD', a: x }; mem[b + 1] = { op: op, a: y }; mem[x] = { n: vals[x] }; mem[y] = { n: vals[y] };
      var nums = [b, b + 1, b + 2, b + 3, vals[x], vals[y]];
      if (nums.some(function (n, i) { return nums.indexOf(n) !== i; })) continue;
      return { base: b, cells: mem, addrs: [b, b + 1, b + 2, b + 3] };
    }
    throw new Error('no memory');
  }
  // Three different options, the right one first: the given wrong ones, then numbers next to a numeric answer.
  function others(right, list) {
    var out = [String(right)], n = Number(right);
    var pad = isNaN(n) ? [] : [n + 1, n - 1, n + 2, n + 3].filter(function (x) { return x >= 0; });
    list.concat(pad).forEach(function (v) { v = String(v); if (v !== 'NaN' && v !== '-' && !(Number(v) < 0) && out.indexOf(v) < 0) out.push(v); });
    return out.slice(0, 3);
  }
  // Every move of one instruction from the registers before it. A move: { stage, to, from, bus, value, ask, valueQ,
  // set, lit, read, say, hint }. ask: the value options (the right one first; shuffled when drawn).
  function cycle(M, regs, opts) {
    var r = Object.assign({}, regs), out = [];
    function mv(m) { Object.assign(r, m.set || {}); m.regs = Object.assign({}, r); out.push(m); }
    var pc = Number(r.PC), ins = M.cells[pc], other = M.cells[pc === M.base ? pc + 1 : M.base];
    var it = text(ins);
    mv({ stage: 'Fetch', to: 'MAR', from: 'PC', bus: 'Address bus', value: String(pc), set: { MAR: String(pc) }, lit: { bus: 'Address bus', value: String(pc), dir: 'out' },
      say: 'The PC holds ' + pc + ', the address of the next instruction. It is copied into the <b>MAR</b> on the address bus, because memory only reads the address in the MAR.',
      hint: 'Memory only reads the address that is in one register. Which register holds the address memory is about to read?' });
    mv({ stage: 'Fetch', to: 'Memory', from: 'MAR', bus: 'Address bus', value: String(pc), lit: { bus: 'Address bus', value: String(pc), dir: 'out' }, read: pc,
      say: 'The MAR sends the address ' + pc + ' to <b>memory</b> on the address bus. The CU sends a read signal on the control bus, so memory knows to send back what it holds there.',
      hint: 'The address is in the MAR, but memory is outside the CPU. Where must the address go now?' });
    mv({ stage: 'Fetch', to: 'MDR', from: 'Memory', bus: 'Data bus', value: it, set: { MDR: it }, lit: { bus: 'Data bus', value: it, dir: 'in' }, read: pc,
      ask: others(it, [text(other), String(pc)]), valueQ: 'What does memory send back?',
      say: 'Memory sends back what is stored at address ' + pc + ', the instruction ' + it + '. It comes into the <b>MDR</b> on the data bus: the MDR holds what has just come from memory.',
      hint: 'Memory sends back what is stored at the address it was sent. Which register holds what has just come from memory?' });
    mv({ stage: 'Fetch', to: 'PC', from: 'PC', bus: 'No bus', value: String(pc + 1), set: { PC: String(pc + 1) },
      ask: others(pc + 1, [pc, ins.a]), valueQ: 'What does the PC hold now?',
      say: 'The <b>PC</b> goes up by 1 (it is incremented) to ' + (pc + 1) + '. The program is stored in order, so it now holds the address of the next instruction. No bus is used: the PC changes itself.',
      hint: 'The instruction is in the CPU now. Which register must get ready for the next instruction?' });
    mv({ stage: 'Fetch', to: 'CIR', from: 'MDR', bus: 'Data bus', value: it, set: { CIR: it }, lit: { bus: 'Data bus', value: it, dir: '' },
      say: 'The instruction is copied from the MDR into the <b>CIR</b>, inside the CU, on the data bus. The MDR is now free: the next value from memory will arrive there.',
      hint: 'The next value from memory will arrive in the MDR. Where does the instruction go so it is kept safe, inside the CU?' });
    if (opts.fetchOnly) return out;
    var a = ins.a, n = M.cells[a].n, acc = Number(r.ACC);
    var res = ins.op === 'LOAD' ? n : ins.op === 'ADD' ? acc + n : acc - n;
    mv({ stage: 'Decode', to: 'CU', from: 'CIR', bus: null, value: '',
      say: 'The <b>CU</b> decodes ' + it + ': it uses the instruction set to work out what to do. ' + (ins.op === 'LOAD' ? 'LOAD ' + a + ' means: copy the number stored at address ' + a + ' into the ACC.' : ins.op + ' ' + a + ' means: the ALU ' + (ins.op === 'ADD' ? 'adds' : 'takes away') + ' the number stored at address ' + a + (ins.op === 'ADD' ? ' to' : ' from') + ' the ACC.'),
      hint: 'The instruction is in the CIR. Before anything is done, which part must work out what it means?' });
    mv({ stage: 'Execute', to: 'MAR', from: 'CIR', bus: 'Address bus', value: String(a), set: { MAR: String(a) }, lit: { bus: 'Address bus', value: String(a), dir: 'out' },
      ask: others(a, [r.PC, n]), valueQ: 'What does the MAR hold now?',
      say: it + ' needs the number stored at address ' + a + '. So ' + a + ' goes into the <b>MAR</b> on the address bus.',
      hint: 'The instruction names an address. Where must an address go so that memory can read it?' });
    mv({ stage: 'Execute', to: 'Memory', from: 'MAR', bus: 'Address bus', value: String(a), lit: { bus: 'Address bus', value: String(a), dir: 'out' }, read: a,
      say: 'The MAR sends ' + a + ' to <b>memory</b> on the address bus, with a read signal on the control bus.',
      hint: 'The address is in the MAR. Where must it go now?' });
    mv({ stage: 'Execute', to: 'MDR', from: 'Memory', bus: 'Data bus', value: String(n), set: { MDR: String(n) }, lit: { bus: 'Data bus', value: String(n), dir: 'in' }, read: a,
      ask: others(n, [a, M.cells[a === M.base + 2 ? M.base + 3 : M.base + 2].n]), valueQ: 'What does memory send back?',
      say: 'Memory sends back the number stored at address ' + a + ', ' + n + ', into the <b>MDR</b> on the data bus. This is still execute: it is the number ' + it + ' asked for, not a new instruction.',
      hint: 'What comes back from memory goes into the same register as before.' });
    mv({ stage: 'Execute', to: 'ACC', from: 'MDR', bus: 'Data bus', value: String(res), set: { ACC: String(res) }, lit: { bus: 'Data bus', value: String(n), dir: '' },
      ask: others(res, ins.op === 'LOAD' ? [a, Number(r.PC)] : [n, ins.op === 'ADD' ? acc - n : acc + n]), valueQ: 'What does the ACC hold now?',
      say: ins.op === 'LOAD' ? 'LOAD copies the number in the MDR into the <b>ACC</b> on the data bus. The ACC now holds ' + res + '.'
        : 'The number goes from the MDR to the ALU on the data bus. The <b>ALU</b> works out ' + acc + (ins.op === 'ADD' ? ' + ' : ' - ') + n + ' = ' + res + ', and the result goes into the <b>ACC</b>.',
      hint: ins.op === 'LOAD' ? 'LOAD puts the number into the register that holds results, inside the ALU.' : 'The ALU works it out. Where does its result go?' });
    return out;
  }
  // The registers before instruction k (0 or 1): the cycles before it, run.
  function before(M, k) {
    var regs = { PC: String(M.base), MAR: '-', MDR: '-', CIR: '-', ACC: '-' };
    if (k === 1) { var s = cycle(M, regs, {}); regs = s[s.length - 1].regs; }
    return regs;
  }
  // A round: the memory, the registers at the start, and every move.
  function make(level) {
    var L = LEVELS[level], M = memory();
    var k = L.stages === 'two' ? 0 : rnd(0, 1);
    var start = before(M, k);
    var moves = cycle(M, start, { fetchOnly: L.stages === 'fetch' });
    if (L.stages === 'two') moves = moves.concat(cycle(M, moves[moves.length - 1].regs, {}));
    moves.forEach(function (m, i) {
      m.askStage = L.askStage && (i === 0 || moves[i - 1].stage !== m.stage);
      m.askValue = L.values && !!m.ask;
      if (m.ask) m.options = shuffle(m.ask);
    });
    return { level: level, M: M, k: k, start: start, moves: moves };
  }
  // The questions asked for one move, in order.
  function phases(m) {
    var p = [];
    if (m.askStage) p.push('stage');
    p.push('to');
    if (m.bus && (m.to === 'Memory' || m.from === 'Memory')) p.push('bus'); // buses only to and from memory: one clear answer
    if (m.askValue) p.push('value');
    return p;
  }
  function right(m, phase) { return phase === 'stage' ? m.stage : phase === 'to' ? m.to : phase === 'bus' ? m.bus : m.value; }
  function judge(m, phase, choice) { return String(choice) === String(right(m, phase)); }
  window.FdeLabModel = { memory: memory, cycle: cycle, before: before, make: make, phases: phases, right: right, judge: judge, text: text, LEVELS: LEVELS, DEST: DEST, BUSES: BUSES, STAGES: STAGES };

  var host = document.getElementById('activity');
  if (!host) return;
  var el = Lab.el;

  // ---------------------------------------------------------------- the picture
  // opts: { regs, lit: bus lane, read: memory address being read, next: box to light, from: box to light, changed: box }
  function picture(R, opts) {
    var regs = opts.regs;
    function box(name, label) {
      var cls = 'fde-reg' + (opts.next === name ? ' next' : '') + (opts.from === name ? ' from' : '') + (opts.changed === name ? ' changed' : '');
      return '<div class="' + cls + '"><span>' + (label || name) + '</span><b>' + regs[name] + '</b></div>';
    }
    var unit = function (name, inner, sub) {
      return '<div class="fde-unit' + (opts.next === name ? ' next' : '') + (opts.changed === name ? ' changed' : '') + '"><div class="fde-unit-head"><b>' + name + '</b><span class="small">' + sub + '</span></div>' + inner + '</div>';
    };
    var cpu = '<div class="fde-cpu"><div class="fde-cpu-head"><b>CPU</b></div><div class="fde-regs">' + box('PC') + box('MAR') + box('MDR') + '</div>' +
      '<div class="fde-units">' + unit('CU', box('CIR'), 'in charge') + unit('ALU', box('ACC'), 'does the maths') + '</div></div>';
    var lanes = ['Address bus', 'Data bus', 'Control bus'].map(function (b) {
      var key = { 'Address bus': 'addr', 'Data bus': 'data', 'Control bus': 'ctrl' }[b];
      var l = opts.lit && opts.lit.bus === b ? opts.lit : opts.read != null && b === 'Control bus' && opts.lit && opts.lit.bus === 'Address bus' ? { value: 'Read', dir: 'out' } : null;
      var chip = l ? '<span class="bus-chip">' + (l.dir === 'in' ? '&larr; ' : '') + l.value + (l.dir === 'out' ? ' &rarr;' : '') + '</span>' : '';
      return '<div class="bus-lane ' + key + (l ? ' lit' : '') + '"><span class="bus-name">' + b + '</span><span class="bus-wire">' + chip + '</span></div>';
    }).join('');
    var rows = R.M.addrs.map(function (a) {
      var c = R.M.cells[a];
      var cls = (c.op ? 'ins' : 'dat') + (opts.read === a ? ' hit' : '') + (opts.pcMark && String(a) === String(regs.PC) ? ' now' : '');
      return '<tr class="' + cls + '"><td class="addr">' + a + '</td><td class="val">' + text(c) + '</td></tr>';
    }).join('');
    var mem = '<div class="fde-mem' + (opts.next === 'Memory' ? ' next' : '') + (opts.from === 'Memory' ? ' from' : '') + '"><b>Memory</b><table class="mem bus-mem"><tr><th>Address</th><th>Holds</th></tr>' + rows + '</table></div>';
    return '<div class="fde-pic">' + cpu + '<div class="bus-lanes">' + lanes + '</div>' + mem + '</div>';
  }

  // ---------------------------------------------------------------- the activity
  var params = new URLSearchParams(location.search);
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(params.get('level'), 10) || 1) - 1));
  var upto = Math.max(lv + 1, Math.min(LEVELS.length, parseInt(params.get('upto'), 10) || LEVELS.length));
  var log = Lab.results('cpu-lab-fde-' + (lv + 1) + '-' + upto, 'CPU Lab: Fetch, Decode, Execute (levels ' + (lv + 1) + ' to ' + upto + ')');
  var have = 0, R = null, shownHow = {};
  // Round state: i the move, ph the phase within it, spoilt after a mistake, said the last move's reason.
  var S = null;

  function newRound() {
    R = make(lv);
    S = { i: 0, ph: 0, spoilt: false, slips: [], said: '', cls: '', hint: false, hints: 0, walked: false, done: false, lastLit: null, lastRead: null, changed: null };
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function cur() { return R.moves[S.i]; }
  function regsNow() { return S.i === 0 ? R.start : R.moves[S.i - 1].regs; }
  function seg(label, options, onPick) {
    var g = el('div', { class: 'seg', role: 'group', 'aria-label': label });
    options.forEach(function (o) {
      var b = el('button', { type: 'button', 'aria-pressed': 'false' }, o);
      b.addEventListener('click', function () { onPick(o); });
      g.appendChild(b);
    });
    return g;
  }
  function question(m, phase) {
    if (phase === 'stage') return 'A new stage starts now. Is the CPU getting the next instruction, working out what it means, or carrying it out?';
    if (phase === 'to') return 'What happens next? Pick the box the value goes to next.';
    var place = function (x) { return x === 'Memory' ? 'memory' : 'the ' + x; };
    if (phase === 'bus') return m.to === 'PC' ? 'The PC changes. Which bus does this use?' : 'Which bus carries it from ' + place(m.from) + ' to ' + place(m.to) + '?';
    return m.valueQ;
  }
  function draw() {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, upto <= 2 ? 'Fetch, One Move at a Time' : 'Fetch, Decode, Execute'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, upto <= 2 ? 'Finished: you can follow the fetch stage one move at a time. Keep going for practice.' : 'Finished: you can follow the fetch-decode-execute cycle one move at a time. Keep going for practice.'));
    var L = LEVELS[lv];
    var bar = Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + L.name, have, L.need);
    bar.querySelector('.level').insertAdjacentHTML('beforeend', ' <span class="help-tag h' + Math.min(lv, 3) + '">' + L.help + '</span>');
    host.appendChild(bar);
    if (L.rules) host.appendChild(el('div', { class: 'rule' }, '<b>Fetch</b> gets the next <b>instruction</b> from memory. <b>Execute</b> carries it out: LOAD and ADD get a <b>number</b> from memory. Addresses go to memory on the <b>address bus</b>. Instructions and numbers come back on the <b>data bus</b>.'));
    var m = S.done ? null : cur();
    var help = !S.done && (L.lit || S.spoilt);
    var lastMove = S.i > 0 ? R.moves[S.i - 1] : null;
    host.appendChild(el('div', {}, picture(R, { regs: regsNow(), lit: S.lastLit, read: S.lastRead, changed: S.changed, pcMark: lv === 0,
      next: help ? m.to : null, from: help && m.from !== m.to ? m.from : null })));
    var stageNow = m ? m.stage : lastMove.stage;
    var showStage = m && !(m.askStage && S.ph === 0);
    var info = el('div', { class: 'fde-status' });
    info.innerHTML = (showStage || !m ? '<span class="fde-stage s-' + stageNow.toLowerCase() + '">' + stageNow + '</span>' : '<span class="fde-stage">Which stage?</span>') +
      '<span class="small">Move ' + Math.min(S.i + 1, R.moves.length) + ' of ' + R.moves.length + '</span>';
    host.appendChild(info);
    if (S.said) host.appendChild(el('div', { class: 'say fde-say ' + S.cls }, S.said));
    if (!S.done) {
      var phase = phases(m)[S.ph];
      var q = el('div', { class: 'card fde-ask' });
      var lead = help && phase === 'to' ? '<span class="fde-arrow">' + (m.to === 'CU' ? 'The CU works on the CIR' : m.from === m.to ? 'The PC changes' : m.from + ' &rarr; ' + m.to) + '</span> ' : '';
      q.appendChild(el('div', { class: 'task-q' }, lead + question(m, phase)));
      var opts = phase === 'stage' ? STAGES : phase === 'to' ? DEST : phase === 'bus' ? BUSES : m.options;
      q.appendChild(seg(question(m, phase), opts, function (o) { answer(o); }));
      if (S.hint && L.hint) q.appendChild(el('div', { class: 'rule hint-box' }, 'Hint: ' + (phase === 'stage' ? 'Is the CPU getting the next instruction (fetch), working out what it means (decode), or carrying it out (execute)? Execute can also get a number from memory.' : m.hint)));
      host.appendChild(q);
    }
    var act = el('div', { class: 'actions' });
    if (S.done) act.appendChild(Lab.button('Next round', '', newRound));
    else if (L.hint && !S.hint) act.appendChild(Lab.button('Show a hint', 'secondary', function () { S.hint = true; S.hints++; draw(); }));
    if (L.walk) act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    host.appendChild(act);
    Lab.reportHeight();
  }
  // The PC can go up by 1 at any point in fetch after its address is in the MAR, as long as it is before decode:
  // picking the PC early brings that move forward, and doing MDR to CIR first pushes it back.
  function reorderForPc(choice) {
    var m = cur();
    if (S.ph !== phases(m).indexOf('to') || m.stage !== 'Fetch') return;
    var j = -1;
    for (var x = S.i; x < R.moves.length && R.moves[x].stage === 'Fetch'; x++) if (R.moves[x].to === 'PC') { j = x; break; }
    if (j < 0) return;
    if (choice === 'PC' && j > S.i && m.to !== 'MAR') R.moves.splice(S.i, 0, R.moves.splice(j, 1)[0]);
    else if (j === S.i && choice === 'CIR' && R.moves[j + 1] && R.moves[j + 1].to === 'CIR') { var t = R.moves[j]; R.moves[j] = R.moves[j + 1]; R.moves[j + 1] = t; }
    else return;
    var r = Object.assign({}, R.start);
    R.moves.forEach(function (mv) { Object.assign(r, mv.set || {}); mv.regs = Object.assign({}, r); });
  }
  function answer(choice) {
    if (phases(cur())[S.ph] === 'to') reorderForPc(choice);
    var m = cur(), phase = phases(m)[S.ph];
    var ok = judge(m, phase, choice);
    if (!ok) {
      S.spoilt = true;
      S.slips.push('move ' + (S.i + 1) + ' ' + phase + ': ' + choice + ', not ' + right(m, phase));
      var whatRight = phase === 'stage' ? 'This is the <b>' + m.stage + '</b> stage.' : phase === 'to' ? 'It goes to the <b>' + (m.to === 'Memory' ? 'memory' : m.to) + '</b> next.' :
        phase === 'bus' ? 'It is the <b>' + m.bus.toLowerCase() + '</b>.' : 'It is <b>' + m.value + '</b>.';
      S.said = 'Not this one: you picked ' + choice + '. ' + whatRight + ' ' + m.say + ' <b>This round does not count</b>, but finish it: the boxes that move are lit for you now.';
      S.cls = 'bad';
      apply(m);
      return;
    }
    S.ph++;
    if (S.ph < phases(m).length) { draw(); return; }
    S.said = m.say; S.cls = '';
    apply(m);
  }
  // The move happens: the next move starts, or the round ends.
  function apply(m) {
    S.lastLit = m.lit || null; S.lastRead = m.read != null ? m.read : null; S.changed = m.to;
    S.i++; S.ph = 0; S.hint = false;
    if (S.i >= R.moves.length) finish();
    draw();
  }
  function finish() {
    S.done = true;
    var L = LEVELS[lv], ok = !S.spoilt;
    log.add(L.name + ': ' + (ok ? 'every move right' : S.slips.join('; ')) + (S.hints ? ', used ' + S.hints + ' hint' + (S.hints > 1 ? 's' : '') : '') + (S.walked ? ', used Walk me through it' : ''), ok);
    var up = false, fin = false;
    if (ok) {
      have++;
      if (have >= L.need) {
        have = 0;
        if (lv + 1 >= upto) { log.finish(); fin = true; } else { lv++; up = true; }
      }
      S.said += '<br><b class="good-text">Every move right.</b>' + (up ? ' Level up: ' + LEVELS[lv].name + ' (' + LEVELS[lv].help.toLowerCase() + '). Press Next round.' : fin ? ' You have finished this activity. Go to the next slide, or keep practising.' : ' Press Next round.');
    } else {
      have = 0;
      S.said += '<br><b class="bad-text">This round did not count.</b> Press Next round and try for a round with every move right.';
    }
  }

  // ---------------------------------------------------------------- Walk me through it and How it works
  // Always a different round from the one on screen, one move at a time.
  function walkSteps() {
    var other = make(lv), out = [];
    var first = other.moves[0];
    out.push({ text: 'A different memory, the same way of thinking. The PC holds <b>' + other.start.PC + '</b>. Change one box at a time.', visual: picture(other, { regs: other.start, pcMark: true, next: first.to, from: first.from }) });
    other.moves.forEach(function (m, i) {
      var nx = other.moves[i + 1];
      out.push({ text: '<span class="hl">' + m.stage + '</span> ' + m.say + (m.bus ? ' Bus: <span class="hl">' + m.bus.toLowerCase() + '</span>.' : ''),
        visual: picture(other, { regs: m.regs, lit: m.lit, read: m.read, changed: m.to, next: nx ? nx.to : null }) });
    });
    out.push({ text: other.moves.length > 5 ? 'Then it starts again: fetch the instruction at the address in the PC. That is why it is a cycle.' : 'Fetch is done: the instruction is in the CIR, and the PC holds the address of the next one.', visual: '' });
    return out;
  }
  function howItWorks() { Lab.walk('How it works: ' + LEVELS[lv].name, LEVELS[lv].help + '. ' + LEVELS[lv].how, LEVELS[lv].walk ? walkSteps() : [{ text: LEVELS[lv].how, visual: '' }]); }
  function walkMe() {
    S.walked = true;
    Lab.walk('Walk me through it', 'A different memory, the same moves.', walkSteps(), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }
  // For test harnesses: the round on screen and the level.
  window.FdeLabState = function () { return { round: R, move: S.i, phase: S.done ? null : phases(cur())[S.ph], level: lv + 1, have: have, spoilt: S.spoilt, done: log.isDone(), roundDone: S.done }; };
  newRound();
})();
