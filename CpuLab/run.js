// Run the Program (?activity=run): one memory holds a program AND its data (the stored program idea). The student
// predicts what the CPU will output, then runs the program one instruction at a time to see why. Instructions run
// one after another from address 0 until STOP. A prediction with any mistake does not count; NEED clean rounds in a
// row move up a level. Levels: follow the program, two calculations, change the data (work back from the output),
// one after another (two outputs). How it works opens before the first round of each level; Walk me through it
// shows the same on a fresh program, never the student's own.
(function () {
  'use strict';
  var el = Lab.el, rnd = Lab.rnd, pick = Lab.pick, shuffle = Lab.shuffle;
  var NEED = 2;
  var LEVELS = [
    { name: 'Follow the program', how: 'The CPU starts at address 0 and runs each instruction in turn.' },
    { name: 'Two calculations', how: 'Each instruction names an address. Read the number stored there.' },
    { name: 'Change the data', how: 'Change one number in memory and the same program gives a different output.' },
    { name: 'One after another', how: 'The program outputs twice. Each OUTPUT sends what the CPU holds at that moment.' }
  ];
  var MEANS = {
    INPUT: 'takes the next input number into the CPU',
    LOAD: 'copies the number stored at that address into the CPU',
    ADD: 'adds the number stored at that address to the number in the CPU',
    SUB: 'takes away the number stored at that address from the number in the CPU',
    OUTPUT: 'sends the number in the CPU out to the screen',
    STOP: 'stops the program'
  };
  var host = document.getElementById('activity');
  var log = Lab.results('cpu-lab-run', 'CPU Lab: Run the Program');
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(new URLSearchParams(location.search).get('level'), 10) || 1) - 1));
  var have = 0, R = null, shownHow = {};

  // ---------------------------------------------------------------- programs
  // A cell is { op, a } (an instruction) or { n } (data). Every program is checked by running it.
  function prog(level) {
    for (var k = 0; k < 200; k++) {
      var p = make(level);
      var out = run(p.mem, p.inputs);
      if (out.outputs.every(function (v) { return v >= 0 && v <= 99; }) && out.outputs.length === p.outs) { p.trace = out.trace; p.outputs = out.outputs; return p; }
    }
    throw new Error('no program');
  }
  function make(level) {
    var mem = [], inputs = [];
    if (level === 0) {
      var da = pick([5, 6]), other = da === 5 ? 6 : 5;
      mem = [{ op: 'INPUT' }, { op: pick(['ADD', 'SUB']), a: da }, { op: 'OUTPUT' }, { op: 'STOP' }, { n: rnd(1, 9) * 10 }];
      mem[da] = { n: rnd(2, 15) }; mem[other] = { n: rnd(2, 15) };
      inputs = [rnd(16, 40)];
      return { mem: mem, inputs: inputs, outs: 1 };
    }
    if (level === 1 || level === 2) {
      var addrs = shuffle([5, 6, 7]);
      mem = [{ op: 'LOAD', a: addrs[0] }, { op: 'ADD', a: addrs[1] }, { op: 'SUB', a: addrs[2] }, { op: 'OUTPUT' }, { op: 'STOP' }];
      mem[5] = { n: rnd(3, 30) }; mem[6] = { n: rnd(3, 30) }; mem[7] = { n: rnd(3, 30) };
      var p = { mem: mem, inputs: [], outs: 1 };
      if (level === 2) { p.hole = pick(addrs); }
      return p;
    }
    var a1 = pick([7, 8]), a2 = a1 === 7 ? 8 : 7;
    mem = [{ op: 'INPUT' }, { op: 'ADD', a: a1 }, { op: 'OUTPUT' }, { op: 'SUB', a: a2 }, { op: 'OUTPUT' }, { op: 'STOP' }, { n: rnd(1, 9) }];
    mem[7] = { n: rnd(2, 20) }; mem[8] = { n: rnd(2, 20) };
    return { mem: mem, inputs: [rnd(10, 40)], outs: 2 };
  }
  function run(mem, inputs) {
    var acc = null, pc = 0, ins = inputs.slice(), outputs = [], trace = [];
    for (var guard = 0; guard < 20; guard++) {
      var c = mem[pc];
      if (!c || !c.op) break;
      var before = acc, note;
      if (c.op === 'INPUT') { acc = ins.shift(); note = 'The input is ' + acc + '. The CPU now holds ' + acc + '.'; }
      else if (c.op === 'LOAD') { acc = mem[c.a].n; note = 'Address ' + c.a + ' holds ' + acc + '. The CPU now holds ' + acc + '.'; }
      else if (c.op === 'ADD') { acc = acc + mem[c.a].n; note = 'Address ' + c.a + ' holds ' + mem[c.a].n + '. ' + before + ' + ' + mem[c.a].n + ' = ' + acc + '.'; }
      else if (c.op === 'SUB') { acc = acc - mem[c.a].n; note = 'Address ' + c.a + ' holds ' + mem[c.a].n + '. ' + before + ' - ' + mem[c.a].n + ' = ' + acc + '.'; }
      else if (c.op === 'OUTPUT') { outputs.push(acc); note = 'The CPU sends ' + acc + ' to the screen.'; }
      else if (c.op === 'STOP') { note = 'The program stops. Nothing after this address is run.'; }
      trace.push({ pc: pc, op: c.op, a: c.a, acc: acc, note: note });
      if (c.op === 'STOP') break;
      pc++;
    }
    return { outputs: outputs, trace: trace };
  }
  function cellText(c, hole, i) { if (hole === i) return '?'; return c.op ? c.op + (c.a != null ? ' ' + c.a : '') : String(c.n); }
  function memTable(mem, opts) {
    opts = opts || {};
    var rows = mem.map(function (c, i) {
      var cls = (c.op ? 'ins' : 'dat') + (opts.now === i ? ' now' : '') + (opts.hit === i ? ' hit' : '');
      return '<tr class="' + cls + '"><td class="addr">' + i + '</td><td class="val">' + cellText(c, opts.hole, i) + '</td></tr>';
    }).join('');
    return '<table class="mem"><tr><th>Address</th><th>Stored in memory</th></tr>' + rows + '</table>';
  }
  function cpuBox(acc, say, outputs) {
    return '<div class="cpu"><div class="row"><span>CPU holds</span><b>' + (acc == null ? '-' : acc) + '</b></div>' +
      '<div class="row"><span>Output so far</span><b>' + (outputs && outputs.length ? outputs.join(', ') : '-') + '</b></div><div class="say">' + (say || '') + '</div></div>';
  }
  function legend() { return '<p class="small">Instructions and data are stored in the <b>same memory</b>. Instructions run one after another from address 0 until <b>STOP</b>.</p>'; }

  // ---------------------------------------------------------------- the question for each level
  function question(p, level) {
    if (level === 2) {
      var target = p.outputs[0];
      return { text: 'The number in address ' + p.hole + ' is missing. The program must output <b>' + target + '</b>. What number must be stored in address ' + p.hole + '?',
        labels: ['Address ' + p.hole], answers: [p.mem[p.hole].n] };
    }
    var inText = p.inputs.length ? ' The input is <b>' + p.inputs[0] + '</b>.' : '';
    if (p.outs === 2) return { text: 'Predict both outputs, in order.' + inText, labels: ['First output', 'Second output'], answers: p.outputs };
    return { text: 'Predict the output.' + inText, labels: ['Output'], answers: p.outputs };
  }

  // ---------------------------------------------------------------- walk-throughs
  function walkSteps(p, level) {
    if (level === 2) return holeSteps(p);
    var steps = [], outs = [];
    steps.push({ text: 'Start at address 0. The CPU runs one instruction, then the next address, until <b>STOP</b>.' + (p.inputs.length ? ' The input is <span class="hl">' + p.inputs[0] + '</span>.' : ''), visual: memTable(p.mem, { now: 0 }) });
    p.trace.forEach(function (t) {
      var c = p.mem[t.pc];
      var text = 'Address ' + t.pc + ': <b>' + cellText(c) + '</b> ' + MEANS[t.op] + '. ' + t.note.replace(/(\d+)\.$/, '<span class="hl">$1</span>.');
      if (t.op === 'OUTPUT') outs.push(t.acc);
      steps.push({ text: text, visual: '<div class="lab-grid">' + memTable(p.mem, { now: t.pc, hit: c.a }) + cpuBox(t.acc, '', outs.slice()) + '</div>' });
    });
    steps.push({ text: 'The output' + (outs.length > 1 ? 's are' : ' is') + ' <span class="hl">' + outs.join(', then ') + '</span>. Anything stored after STOP is only data: the CPU never runs it.', visual: memTable(p.mem) });
    return steps;
  }
  // Change the data: LOAD x, ADD y, SUB z with one of x, y, z missing. Write what the program works out, then solve.
  function holeSteps(p) {
    var m = p.mem, L = m[m[0].a].n, A = m[m[1].a].n, S = m[m[2].a].n, T = p.outputs[0], h = p.hole;
    var show = function (addr, v) { return addr === h ? '?' : String(v); };
    var sum = show(m[0].a, L) + ' + ' + show(m[1].a, A) + ' - ' + show(m[2].a, S) + ' = ' + T;
    var ans = h === m[0].a ? T - A + S : h === m[1].a ? T - L + S : L + A - T;
    var how = h === m[0].a ? '? = ' + T + ' - ' + A + ' + ' + S : h === m[1].a ? '? = ' + T + ' - ' + L + ' + ' + S : '? = ' + L + ' + ' + A + ' - ' + T;
    return [
      { text: 'The program must output <span class="hl">' + T + '</span>, and the number in address ' + h + ' is missing.', visual: memTable(m, { hole: h }) },
      { text: 'Read the program in order. LOAD ' + m[0].a + ', then ADD ' + m[1].a + ', then SUB ' + m[2].a + ', then OUTPUT. Find each address it names.', visual: memTable(m, { hole: h, now: 0 }) },
      { text: 'Write what the CPU works out, with <b>?</b> for the missing number: <span class="hl">' + sum + '</span>.', visual: '' },
      { text: 'Undo the other steps to find <b>?</b>: <span class="hl">' + how + ' = ' + ans + '</span>.', visual: '' },
      { text: 'Check: put ' + ans + ' in address ' + h + ' and run it. ' + L + ' + ' + A + ' - ' + S + ' = ' + T + '. The program did not change, only the data in memory.', visual: memTable(m, { hit: h }) }
    ];
  }
  function howItWorks(done) {
    var p = prog(lv);
    if (lv === 2 && R) while (p.hole === R.p.hole && JSON.stringify(p.mem) === JSON.stringify(R.p.mem)) p = prog(lv);
    Lab.walk('How it works: ' + LEVELS[lv].name, LEVELS[lv].how + ' Here is a program like the next one, step by step.', walkSteps(p, lv), function () { if (done) done(); });
  }
  function walkMe() {
    var p, k = 0;
    do { p = prog(lv); k++; } while (k < 20 && JSON.stringify(p.mem) === JSON.stringify(R.p.mem));
    R.walked = true;
    Lab.walk('Walk me through it', 'A similar program with different numbers.', walkSteps(p, lv), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }

  // ---------------------------------------------------------------- one round
  function newRound() {
    R = { p: prog(lv), phase: 'predict', step: -1, walked: false };
    R.q = question(R.p, lv);
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function draw(msg, cls) {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'Run the Program'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished: you can run a stored program. Keep going for practice.'));
    host.appendChild(Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED));
    host.appendChild(el('div', { class: 'rule' }, legend() + '<span class="small">' + Object.keys(MEANS).map(function (k) { return '<b>' + k + '</b> ' + MEANS[k]; }).join('. ') + '.</span>'));
    var t = R.phase === 'run' && R.step >= 0 ? R.p.trace[R.step] : null;
    var outs = t ? R.p.trace.slice(0, R.step + 1).filter(function (x) { return x.op === 'OUTPUT'; }).map(function (x) { return x.acc; }) : [];
    var grid = el('div', { class: 'lab-grid' });
    grid.appendChild(el('div', {}, memTable(R.p.mem, { now: t ? t.pc : null, hit: t && R.p.mem[t.pc].a, hole: R.phase === 'predict' && lv === 2 ? R.p.hole : null })));
    var right = el('div');
    right.appendChild(el('div', {}, cpuBox(t ? t.acc : null, t ? 'Address ' + t.pc + ': <b>' + cellText(R.p.mem[t.pc]) + '</b> ' + MEANS[t.op] + '. ' + t.note : (R.phase === 'run' ? 'Press Next instruction to start at address 0.' : 'Predict first. Then run it to see why.'), outs)));
    right.appendChild(el('p', { class: 'task-q' }, R.q.text));
    var ans = el('div', { class: 'answers' });
    R.inputs = R.q.labels.map(function (l, i) {
      var lab = el('label', {}, l + ' ');
      var inp = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', id: 'cpu-ans-' + i, 'aria-label': l });
      if (R.given) { inp.value = R.given[i]; inp.disabled = true; }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      lab.appendChild(inp); ans.appendChild(lab);
      return inp;
    });
    right.appendChild(ans);
    var act = el('div', { class: 'actions' });
    if (R.phase === 'predict') act.appendChild(Lab.button('Check', '', check));
    if (R.phase === 'run') {
      var last = R.step >= R.p.trace.length - 1;
      if (!last) act.appendChild(Lab.button(R.step < 0 ? 'Run: first instruction' : 'Next instruction', '', function () { R.step++; draw(R.msg, R.cls); }));
      else act.appendChild(Lab.button('Next program', '', function () { newRound(); }));
    }
    act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    right.appendChild(act);
    right.appendChild(el('div', { class: 'feedback ' + (cls || ''), role: 'status' }, msg || ''));
    grid.appendChild(right);
    host.appendChild(grid);
    Lab.reportHeight();
  }
  function check() {
    if (R.phase !== 'predict') return;
    var given = R.inputs.map(function (i) { return i.value.trim(); });
    if (given.some(function (g) { return !/^-?\d+$/.test(g); })) { draw(); R.inputs.forEach(function (i, k) { i.value = given[k]; }); host.querySelector('.feedback').className = 'feedback hint'; host.querySelector('.feedback').textContent = 'Type a whole number in every box first.'; return; }
    var ok = given.every(function (g, i) { return Number(g) === R.q.answers[i]; });
    R.given = given; R.phase = 'run'; R.step = -1;
    var wrongs = given.map(function (g, i) { return Number(g) === R.q.answers[i] ? '' : R.q.labels[i] + ' should be ' + R.q.answers[i] + ', not ' + g + '.'; }).filter(Boolean).join(' ');
    log.add(LEVELS[lv].name + ': ' + R.q.labels.map(function (l, i) { return l + ' ' + given[i] + (Number(given[i]) === R.q.answers[i] ? '' : ' (should be ' + R.q.answers[i] + ')'); }).join(', ') + (R.walked ? ', used Walk me through it' : ''), ok);
    var up = false;
    if (ok) {
      have++;
      if (have >= NEED) {
        have = 0;
        if (lv < LEVELS.length - 1) { lv++; up = true; } else log.finish();
      }
      R.msg = 'Right, with no mistakes.' + (up ? ' Level up: ' + LEVELS[lv].name + '.' : '') + ' Run it to see each step.';
      R.cls = 'good';
    } else {
      have = 0;
      R.msg = 'Not this time: ' + wrongs + ' This round does not count. Run it one instruction at a time to see where it went wrong.';
      R.cls = 'bad';
    }
    draw(R.msg, R.cls);
  }

  newRound();
})();
