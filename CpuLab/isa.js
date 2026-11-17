// Machine Code (?activity=isa): instruction sets and machine code (syllabus 0478 3.1: an instruction set is a list of all
// the commands that can be processed by a CPU, and the commands are machine code). Each instruction is 8 bits: a 4-bit
// opcode (looked up in the CPU's instruction set) and a 4-bit operand (an address, in binary), as the mark schemes say:
// "the instruction is separated into opcode and operand", "decoded using an instruction set".
// Bite-size (James, 2026-11-17: "Everything should be broken down into bite-size chunks"): a round is a few screens,
// one small question each, with only the facts that question needs. Check, one short line of feedback, then Next.
// Any wrong answer and the round does not count (the right answer and why are shown, and the round carries on);
// NEED clean rounds in a row move up a level. No pop-ups.
// Levels:
//   1 Split and look up   the instruction split for you: which command is the opcode, the operand in denary, what it does
//   2 Decode it           not split for you: type each instruction as a command and a number (ADD 7)
//   3 Run the program     one line at a time: what does the ACC hold after it, then what is output
//   4 A different CPU     the same machine code on CPU B: which command does CPU B get for each line, then can it run it
// ?level=n starts at level n; ?upto=n finishes the activity (for the slide) when level n is cleared.
(function () {
  'use strict';
  var rnd = Lab.rnd, pick = Lab.pick, shuffle = Lab.shuffle;
  var NEED = 2;
  var CMDS = ['LOAD', 'ADD', 'SUB', 'STORE', 'OUTPUT'];
  var NOT_IN = 'Not in its list';
  var SET_A = { '0001': 'LOAD', '0010': 'ADD', '0011': 'SUB', '0100': 'STORE', '0101': 'OUTPUT' };
  var OPC_A = { LOAD: '0001', ADD: '0010', SUB: '0011', STORE: '0100', OUTPUT: '0101' };
  var MEANS = {
    LOAD: function (n) { return 'Copy the value at address ' + n + ' into the ACC'; },
    ADD: function (n) { return 'Add the value at address ' + n + ' to the ACC'; },
    SUB: function (n) { return 'Subtract the value at address ' + n + ' from the ACC'; },
    STORE: function (n) { return 'Copy the ACC into address ' + n; },
    OUTPUT: function () { return 'Output the value in the ACC'; }
  };
  var LEVELS = [
    { name: 'Split and look up', tip: 'First 4 bits: the opcode (look it up). Last 4 bits: the operand (an address).' },
    { name: 'Decode it', tip: 'Split it into 4 bits and 4 bits. Look up the first part. Convert the second part.' },
    { name: 'Run the program', tip: 'One line at a time. The ACC starts at 0.' },
    { name: 'A different CPU', tip: 'CPU B uses its own instruction set, not CPU A\'s.' }
  ];

  // ---------------------------------------------------------------- the model (pure, so it can be tested)
  function bin4(n) { var s = n.toString(2); while (s.length < 4) s = '0' + s; return s; }
  function den(b) { return parseInt(b, 2); }
  function encode(ins, opc) { return opc[ins.op] + bin4(ins.op === 'OUTPUT' ? 0 : ins.arg); }
  function decode(code, set) { var c = set[code.slice(0, 4)]; return c ? { op: c, arg: den(code.slice(4)) } : null; }
  function show(ins) { return ins.op === 'OUTPUT' ? 'OUTPUT' : ins.op + ' ' + ins.arg; }
  function sp(code) { return code.slice(0, 4) + ' ' + code.slice(4); }
  function pvSum(bits) { var pv = [8, 4, 2, 1].filter(function (v, i) { return bits[i] === '1'; }); return pv.length > 1 ? pv.join(' + ') + ' = ' + den(bits) : String(den(bits)); }
  // Run machine code: { outputs, stop (address or -1), acc, accs (the ACC after each line), bad (negative) }.
  function run(codes, data, set) {
    var mem = {}, acc = 0, outputs = [], accs = [], k;
    Object.keys(data).forEach(function (a) { mem[a] = data[a]; });
    for (k = 0; k < codes.length; k++) {
      var ins = decode(codes[k], set);
      if (!ins) return { outputs: outputs, stop: k, acc: acc, accs: accs };
      var v = mem[ins.arg] || 0;
      if (ins.op === 'LOAD') acc = v;
      else if (ins.op === 'ADD') acc += v;
      else if (ins.op === 'SUB') acc -= v;
      else if (ins.op === 'STORE') mem[ins.arg] = acc;
      else outputs.push(acc);
      accs.push(acc);
      if (acc < 0) return { outputs: outputs, stop: -1, acc: acc, accs: accs, bad: true };
    }
    return { outputs: outputs, stop: -1, acc: acc, accs: accs };
  }
  function makeSetB() {
    for (;;) {
      var cmds = shuffle(CMDS).slice(0, pick([4, 5])), ops = shuffle(['0001', '0010', '0011', '0100', '0101', '0110']).slice(0, cmds.length), set = {};
      cmds.forEach(function (c, i) { set[ops[i]] = c; });
      if (Object.keys(set).filter(function (o) { return SET_A[o] === set[o]; }).length <= 1) return set;
    }
  }
  // A program for CPU A: instructions at addresses 0 up, data at three of the addresses 8 to 15.
  function program() {
    var addrs = shuffle([8, 9, 10, 11, 12, 13, 14, 15]), a = addrs[0], b = addrs[1], c = addrs[2], data = {};
    data[a] = rnd(10, 40); data[b] = rnd(2, 30); data[c] = rnd(1, 20);
    var shapes = [
      [{ op: 'LOAD', arg: a }, { op: 'ADD', arg: b }, { op: 'OUTPUT' }],
      [{ op: 'LOAD', arg: a }, { op: 'SUB', arg: b }, { op: 'OUTPUT' }],
      [{ op: 'LOAD', arg: a }, { op: 'ADD', arg: b }, { op: 'SUB', arg: c }, { op: 'OUTPUT' }],
      [{ op: 'LOAD', arg: b }, { op: 'ADD', arg: c }, { op: 'STORE', arg: a }, { op: 'OUTPUT' }]
    ];
    var ins = pick(shapes).map(function (x) { return { op: x.op, arg: x.arg || 0 }; });
    return { ins: ins, data: data, codes: ins.map(function (x) { return encode(x, OPC_A); }) };
  }
  // A round is a list of screens: { q, type: 'pick' | 'num' | 'ins', options, answer, why, view }.
  // view: { code, split, pv, table: set, title, acc, data, note }.
  function make(level) {
    for (var tries = 0; tries < 500; tries++) {
      var R = level === 0 ? one() : level === 1 ? two() : level === 2 ? prog() : differ();
      if (R) { R.level = level; return R; }
    }
    throw new Error('no round');
  }
  function one() {
    var op = pick(['LOAD', 'ADD', 'SUB', 'STORE']), arg = rnd(5, 15);
    if (arg === den(OPC_A[op])) return null;
    var code = encode({ op: op, arg: arg }, OPC_A), other = pick(['LOAD', 'ADD', 'SUB', 'STORE'].filter(function (c) { return c !== op; }));
    return { kind: 'one', screens: [
      { q: 'Look up the opcode <b>' + code.slice(0, 4) + '</b>. Which command is it?', type: 'pick', options: ['LOAD', 'ADD', 'SUB', 'STORE'], answer: op,
        why: 'Opcode ' + code.slice(0, 4) + ' is ' + op + ' in the instruction set.', view: { code: code, split: true, table: SET_A, title: 'The instruction set' } },
      { q: 'The operand is <b>' + code.slice(4) + '</b>. What is it in denary?', type: 'num', answer: arg,
        why: '8 4 2 1: ' + code.slice(4) + ' = ' + pvSum(code.slice(4)) + '.', view: { code: code, split: true, pv: true } },
      { q: 'So what does the CPU do?', type: 'pick', options: shuffle([MEANS[op](arg), MEANS[op](den(OPC_A[op])), MEANS[other](arg)]), answer: MEANS[op](arg),
        why: op + ' ' + arg + ': the opcode gives the command, the operand gives the address.', view: { code: code, split: true, note: 'Opcode ' + code.slice(0, 4) + ' is ' + op + '.' } }
    ] };
  }
  function two() {
    var a = { op: pick(['LOAD', 'ADD', 'SUB', 'STORE']), arg: rnd(1, 15) };
    var b = Math.random() < 0.3 ? { op: 'OUTPUT', arg: 0 } : { op: pick(['LOAD', 'ADD', 'SUB', 'STORE']), arg: rnd(1, 15) };
    if (a.op === b.op || a.arg === b.arg) return null;
    return { kind: 'two', screens: shuffle([a, b]).map(function (x) {
      var code = encode(x, OPC_A);
      return { q: 'Decode this instruction. Type it like <b>ADD 7</b>.', type: 'ins', answer: x,
        why: 'Opcode ' + code.slice(0, 4) + ' is ' + x.op + (x.op === 'OUTPUT' ? '.' : '. Operand ' + code.slice(4) + ' is ' + pvSum(code.slice(4)) + '.') + ' So: ' + show(x) + '.',
        view: { code: code, table: SET_A, title: 'The instruction set' } };
    }) };
  }
  function prog() {
    var P = program(), r = run(P.codes, P.data, SET_A);
    if (r.bad || r.outputs.length !== 1) return null;
    var screens = P.codes.map(function (code, k) {
      var ins = P.ins[k], before = k ? r.accs[k - 1] : 0, v = P.data[ins.arg];
      var why = show(ins) + (ins.op === 'LOAD' ? ': the ACC becomes ' + v + '.' : ins.op === 'ADD' ? ': ' + before + ' + ' + v + ' = ' + r.accs[k] + '.' :
        ins.op === 'SUB' ? ': ' + before + ' - ' + v + ' = ' + r.accs[k] + '.' : ins.op === 'STORE' ? ': the ACC is copied to address ' + ins.arg + '. The ACC stays ' + before + '.' : ': it outputs the ACC, ' + before + '.');
      return { q: ins.op === 'OUTPUT' ? 'Address ' + k + '. What is output?' : 'Address ' + k + '. After this line, what does the ACC hold?', type: 'num', answer: r.accs[k], why: why,
        view: { code: code, table: SET_A, title: 'The instruction set', acc: before, data: P.data } };
    });
    return { kind: 'prog', P: P, out: r.outputs[0], screens: screens };
  }
  function differ() {
    var P = program(), B = makeSetB(), rA = run(P.codes, P.data, SET_A);
    if (rA.bad) return null;
    var screens = [], changed = false;
    for (var k = 0; k < P.codes.length; k++) {
      var code = P.codes[k], b = decode(code, B), a = P.ins[k].op, ans = b ? b.op : NOT_IN;
      if (ans !== a) changed = true;
      var others = Object.keys(B).map(function (o) { return B[o]; }).filter(function (c) { return c !== ans && c !== a; });
      var opts = [ans];
      if (a !== ans) opts.push(a);
      if (ans !== NOT_IN) opts.push(NOT_IN);
      while (opts.length < 3 && others.length) opts.push(others.shift());
      screens.push({ q: 'CPU B decodes <b>' + sp(code) + '</b> with its own instruction set. Which command does it get?', type: 'pick', options: shuffle(opts.slice(0, 3)), answer: ans,
        why: b ? 'In CPU B\'s list, ' + code.slice(0, 4) + ' is ' + b.op + (b.op === a ? ', the same as CPU A.' : '. For CPU A it was ' + a + '.') : code.slice(0, 4) + ' is not in CPU B\'s list, so CPU B cannot process it.',
        view: { code: code, table: B, title: 'CPU B instruction set', note: 'For CPU A, this is ' + show(P.ins[k]) + '.' } });
      if (!b) break;
    }
    if (!changed) return null;
    screens.push({ q: 'So can CPU B run this program correctly?', type: 'pick', options: shuffle(['No: its instruction set is different', 'Yes: the machine code is the same', 'Yes, if its clock is faster']),
      answer: 'No: its instruction set is different', why: 'CPU B decodes with its own instruction set, so the same machine code does a different job.', view: { note: 'The program was made for CPU A.' } });
    return { kind: 'differ', P: P, B: B, screens: screens };
  }
  function readIns(text) {
    var m = String(text == null ? '' : text).trim().match(/^(load|add|sub|subtract|store|output)\s*(\d{1,2})?\s*\.?$/i);
    if (!m) return null;
    return { op: m[1].toUpperCase() === 'SUBTRACT' ? 'SUB' : m[1].toUpperCase(), arg: m[2] == null ? null : Number(m[2]) };
  }
  function readNum(text) { var m = String(text == null ? '' : text).trim().match(/^(\d{1,3})\s*\.?$/); return m ? Number(m[1]) : null; }
  function ready(s, v) { return s.type === 'pick' ? !!v : s.type === 'num' ? readNum(v) != null : !!readIns(v); }
  function right(s, v) {
    if (s.type === 'pick') return v === s.answer;
    if (s.type === 'num') return readNum(v) === s.answer;
    var t = readIns(v);
    if (!t || t.op !== s.answer.op) return false;
    return s.answer.op === 'OUTPUT' ? (t.arg == null || t.arg === 0) : t.arg === s.answer.arg;
  }
  window.IsaLabModel = { make: make, run: run, decode: decode, encode: encode, ready: ready, right: right, readIns: readIns, readNum: readNum, SET_A: SET_A, OPC_A: OPC_A, LEVELS: LEVELS, NOT_IN: NOT_IN };

  var host = document.getElementById('activity');
  if (!host) return;
  var el = Lab.el;

  // ---------------------------------------------------------------- the activity
  var params = new URLSearchParams(location.search);
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(params.get('level'), 10) || 1) - 1));
  var upto = Math.max(lv + 1, Math.min(LEVELS.length, parseInt(params.get('upto'), 10) || LEVELS.length));
  var log = Lab.results('cpu-lab-isa-' + (lv + 1) + '-' + upto, 'CPU Lab: Machine Code (levels ' + (lv + 1) + ' to ' + upto + ')');
  var have = 0, R = null, si = 0, val = '', checked = false, slips = 0, msg = null, hintOn = false, endMsg = '';

  function newRound() { R = make(lv); si = 0; slips = 0; hintOn = false; endMsg = ''; fresh(); }
  function fresh() { val = ''; checked = false; msg = null; draw(); }

  function codeHtml(v) {
    if (!v.code) return '';
    if (!v.split) return '<div class="isa-code plain">' + v.code + '</div>';
    var arg = v.pv ? '<span class="isa-arg"><span class="isa-pv">8 4 2 1</span>' + v.code.slice(4) + '<small>operand</small></span>' : '<span class="isa-arg">' + v.code.slice(4) + '<small>operand</small></span>';
    return '<div class="isa-code"><span class="isa-op">' + v.code.slice(0, 4) + '<small>opcode</small></span>' + arg + '</div>';
  }
  function tableHtml(set, title) {
    return '<div class="isa-set"><div class="isa-head">' + title + '</div><table>' + Object.keys(set).sort().map(function (o) {
      return '<tr><td class="isa-bits">' + o + '</td><td><b>' + set[o] + '</b></td></tr>'; }).join('') + '</table></div>';
  }
  function view(v) {
    var left = codeHtml(v);
    if (v.acc != null) left += '<p class="isa-line">The ACC holds <b>' + v.acc + '</b></p>';
    if (v.data) left += '<p class="isa-line small">' + Object.keys(v.data).map(Number).sort(function (a, b) { return a - b; }).map(function (a) { return 'Address ' + a + ' holds ' + v.data[a]; }).join('<br>') + '</p>';
    if (v.note) left += '<p class="isa-line">' + v.note + '</p>';
    return '<div class="isa-view' + (v.table ? '' : ' solo') + '"><div class="isa-left">' + left + '</div>' + (v.table ? tableHtml(v.table, v.title) : '') + '</div>';
  }
  function draw() {
    var s = R.screens[si];
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'Machine Code'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished. Keep going for practice.'));
    host.appendChild(Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED));
    var box = el('div', { class: 'isa-screen' });
    box.insertAdjacentHTML('beforeend', view(s.view));
    box.appendChild(el('p', { class: 'isa-q' }, s.q));
    if (s.type === 'pick') {
      var g = el('div', { class: 'seg isa-picks', role: 'group' });
      s.options.forEach(function (o) {
        var b = el('button', { type: 'button', 'aria-pressed': String(val === o) }, o);
        b.disabled = checked;
        if (checked && o === s.answer) b.classList.add('isa-right');
        b.addEventListener('click', function () { val = o; draw(); });
        g.appendChild(b);
      });
      box.appendChild(g);
    } else {
      var input = el('input', { type: 'text', class: 'isa-input', autocomplete: 'off', 'aria-label': 'Your answer', inputmode: s.type === 'num' ? 'numeric' : 'text' });
      input.value = val; input.disabled = checked;
      input.addEventListener('input', function () { val = input.value; });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (checked) next(); else check(); } });
      box.appendChild(input);
      setTimeout(function () { if (!checked) input.focus(); }, 0);
    }
    if (hintOn && !checked) box.appendChild(el('p', { class: 'isa-tip' }, LEVELS[lv].tip));
    if (msg) box.appendChild(el('p', { class: 'isa-msg ' + msg[1], role: 'status' }, msg[0]));
    if (endMsg) box.appendChild(el('p', { class: 'isa-msg ' + (slips ? 'bad' : 'good') }, endMsg));
    var act = el('div', { class: 'actions' });
    if (!checked) {
      act.appendChild(Lab.button('Check', '', check));
      if (lv < 3 && !hintOn) act.appendChild(Lab.button('Tip', 'secondary', function () { hintOn = true; log.note('Used the tip at level ' + (lv + 1) + '.'); draw(); }));
    } else act.appendChild(Lab.button(endMsg ? 'Next round' : 'Next', '', next));
    act.appendChild(el('span', { class: 'isa-step' }, 'Question ' + (si + 1) + ' of ' + R.screens.length));
    box.appendChild(act);
    host.appendChild(box);
    Lab.reportHeight();
  }
  function check() {
    var s = R.screens[si];
    if (!ready(s, val)) { msg = [s.type === 'pick' ? 'Pick one first.' : s.type === 'num' ? 'Type a number.' : 'Type a command and a number, like ADD 7.', 'hint']; draw(); return; }
    checked = true;
    if (right(s, val)) msg = ['Right. ' + s.why, 'good'];
    else { slips++; msg = ['Not quite. ' + s.why, 'bad']; }
    if (si === R.screens.length - 1) finishRound();
    draw();
  }
  function finishRound() {
    var ok = !slips, up = false, fin = false;
    log.add(LEVELS[lv].name + ': ' + (ok ? 'all right' : slips + ' wrong') + (hintOn ? ', used the tip' : ''), ok);
    if (ok) {
      have++;
      if (have >= NEED) { have = 0; if (lv + 1 >= upto) { log.finish(); fin = true; } else { lv++; up = true; } }
      endMsg = fin ? 'Clean round. You have finished this activity.' : up ? 'Clean round. Level up: ' + LEVELS[lv].name + '.' : 'Clean round.';
    } else { have = 0; endMsg = 'This round does not count. Try another.'; }
  }
  function next() { if (endMsg) { newRound(); return; } si++; fresh(); }
  window.IsaLabState = function () { return { round: R, screen: si, level: lv + 1, have: have, checked: checked, done: log.isDone() }; };
  newRound();
})();
