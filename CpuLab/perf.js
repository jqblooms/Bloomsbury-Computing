// CPU Race (?activity=perf): what makes a CPU faster (syllabus 0478 3.1: how clock speed, cache and cores affect
// performance). Two CPUs run the same task. The student predicts which finishes first, or works out how long each
// takes, then checks once; after the check the race is shown with the working for each CPU. Any wrong answer and the
// round does not count; NEED clean rounds in a row move up a level.
// The model (small whole numbers, one instruction per FDE cycle per core):
//   time = instructions / (GHz x cores that can work on it) + waiting for RAM
//   cores that can work on it = the CPU's cores if the task can be split, otherwise 1
//   waiting for RAM = 0 if the data the task uses again and again fits in the cache, otherwise the task's wait
// Wording follows the mark schemes: clock speed is the number of FDE cycles a second (0478/11 June 2025 Q5(c)); each
// core runs its own FDE cycle at the same time (0478/12 March 2024 Q2(b)(ii)); cache stores frequently used data and
// instructions, faster to access than RAM (0478/13 November 2023 Q3(b)); fewer cores means less communication
// between cores (0478/13 June 2026 Q3(c)(ii)).
// Levels, with the help fading:
//   1 One difference      the rules are shown and the difference is lit; pick which finishes first and why
//   2 Work out the time   clock speed and cores; type each time; the method is shown, a hint on request
//   3 The task matters    tasks that cannot be split, data that does not fit the cache; a hint on request
//   4 Best upgrade        one CPU, three upgrades: pick the one that helps most and type the new time; no help
// ?level=n starts at level n; ?upto=n finishes the activity (for the slide) when level n is cleared.
(function () {
  'use strict';
  var rnd = Lab.rnd, pick = Lab.pick, shuffle = Lab.shuffle;
  var NEED = 2;
  var FIRST = ['CPU A', 'CPU B', 'The same time'];
  var REASON = {
    clock: 'Its higher clock speed runs more FDE cycles a second',
    cores: 'Its extra cores process instructions at the same time',
    cache: 'Its bigger cache holds the data, so it waits less for RAM'
  };
  var UPGRADE = {
    clock: 'Add 1 GHz to the clock speed',
    cores: 'Double the number of cores',
    cache: 'A cache big enough for the data'
  };
  var LEVELS = [
    { name: 'One difference', help: 'Lots of help',
      how: 'The two CPUs are the same except for one thing, which is lit. Pick which CPU finishes the task first, and why. Then press Check. One check only.' },
    { name: 'Work out the time', help: 'Some help',
      how: 'Work out how many seconds each CPU takes: instructions &divide; (GHz &times; cores). Type both times, pick which finishes first, then press Check.' },
    { name: 'The task matters', help: 'A little help',
      how: 'Now read the task carefully. Can it be split between cores? Does its data fit in the cache? Type both times, pick which finishes first, then press Check.' },
    { name: 'Best upgrade', help: 'No help',
      how: 'One CPU and three upgrades. Pick the upgrade that makes this task finish soonest, and type the new time. No rules, no hint, no walk through.' }
  ];

  // ---------------------------------------------------------------- the model (pure, so it can be tested)
  function cores(cpu, task) { return task.split ? cpu.cores : 1; }
  function waits(cpu, task) { return cpu.cache >= task.data ? 0 : task.wait; }
  function time(cpu, task) { return task.instr / (cpu.ghz * cores(cpu, task)) + waits(cpu, task); }
  function half(n) { return Math.abs(n * 2 - Math.round(n * 2)) < 1e-9; }
  function num(n) { return String(Math.round(n * 100) / 100); }
  function s(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  // The working for one CPU, as a line of text.
  function working(cpu, task) {
    var c = cores(cpu, task), w = waits(cpu, task), run = task.instr / (cpu.ghz * c);
    var line = task.instr + ' billion &divide; (' + cpu.ghz + ' GHz &times; ' + s(c, 'core', 'cores') + ') = ' + num(run) + ' s';
    if (!task.split && cpu.cores > 1) line += ' (the task cannot be split, so only 1 of its ' + cpu.cores + ' cores works)';
    if (w) line += ', + ' + w + ' s waiting for RAM (' + task.data + ' MB does not fit in ' + cpu.cache + ' MB of cache) = ' + num(run + w) + ' s';
    else if (task.data) line += ' (the ' + task.data + ' MB of data fits in its ' + cpu.cache + ' MB cache: no waiting)';
    return line;
  }
  var SPLIT_TASKS = ['Edit 4 photos', 'Check 4 files for viruses', 'Draw 4 parts of a game screen', 'Convert 4 songs to MP3'];
  var CHAIN_TASKS = ['A long calculation: each step needs the answer from the step before', 'A list of instructions that must run in order, one after another'];
  function task(o) {
    var split = o.split !== false;
    return { name: o.name || (split ? pick(SPLIT_TASKS) : pick(CHAIN_TASKS)), instr: o.instr, split: split, data: o.data, wait: o.wait };
  }
  function cpu(ghz, c, cache) { return { ghz: ghz, cores: c, cache: cache }; }
  function winner(tA, tB) { return Math.abs(tA - tB) < 1e-9 ? 'The same time' : tA < tB ? 'CPU A' : 'CPU B'; }

  // A round: { level, kind, task, A, B, tA, tB, first, reason } or, at level 4, { level, kind: 'upgrade', task, A,
  // ups: [{ key, cpu, t }], best, tBest }.
  function make(level) {
    for (var tries = 0; tries < 500; tries++) {
      var R = level === 0 ? one() : level === 1 ? timed() : level === 2 ? matters() : upgrade();
      if (R) { R.level = level; return R; }
    }
    throw new Error('no round');
  }
  function finishPair(T, A, B, kind) {
    var tA = time(A, T), tB = time(B, T);
    if (!half(tA) || !half(tB) || tA > 30 || tB > 30 || tA < 0.5 || tB < 0.5) return null;
    return { kind: kind, task: T, A: A, B: B, tA: tA, tB: tB, first: winner(tA, tB) };
  }
  // Level 1: one thing differs; the task can be split and the data fits, unless the difference is the cache.
  function one() {
    var kind = pick(['clock', 'cores', 'cache']), g = pick([2, 3, 4]), c = pick([1, 2]), d = pick([4, 6, 8]);
    var T = task({ instr: pick([12, 24]), data: d, wait: pick([2, 3, 4]) }), A, B;
    if (kind === 'clock') { var gs = shuffle([2, 3, 4]); A = cpu(gs[0], c, 16); B = cpu(gs[1], c, 16); }
    else if (kind === 'cores') { var cs = shuffle([1, 2, 4]); A = cpu(g, cs[0], 16); B = cpu(g, cs[1], 16); }
    else { var small = pick([2, 4].filter(function (x) { return x < d; })), big = 16; var o = shuffle([small, big]); A = cpu(g, c, o[0]); B = cpu(g, c, o[1]); }
    var R = finishPair(T, A, B, kind);
    if (!R || R.first === 'The same time') return null;
    R.reason = REASON[kind];
    R.diff = kind;
    return R;
  }
  // Level 2: clock speed and cores only (the task can be split, the data fits); one or both differ.
  function timed() {
    var T = task({ instr: pick([8, 12, 16, 24]), data: 4, wait: 2 });
    var A = cpu(pick([1, 2, 3, 4]), pick([1, 2, 4]), 8), B = cpu(pick([1, 2, 3, 4]), pick([1, 2, 4]), 8);
    if (A.ghz === B.ghz && A.cores === B.cores) return null;
    var R = finishPair(T, A, B, 'timed');
    if (!R) return null;
    // Mostly rounds where the faster clock loses or the two differ in both, so the times must be worked out.
    if (A.ghz !== B.ghz && A.cores !== B.cores) return R;
    return Math.random() < 0.35 ? R : null;
  }
  // Level 3: a task that cannot be split, or data that does not fit one cache.
  function matters() {
    var kind = pick(['chain', 'chain', 'cache', 'both']);
    var T, A, B;
    if (kind === 'chain') {
      T = task({ split: false, instr: pick([12, 24]), data: 4, wait: 2 });
      A = cpu(pick([2, 3]), pick([2, 4]), 8); B = cpu(pick([2, 3, 4]), 1, 8);
    } else if (kind === 'cache') {
      var d = pick([6, 8]);
      T = task({ instr: pick([12, 24]), data: d, wait: pick([2, 3, 4, 6]) });
      A = cpu(pick([2, 3, 4]), pick([1, 2]), pick([2, 4])); B = cpu(pick([2, 3, 4]), pick([1, 2]), 16);
    } else {
      var d2 = pick([6, 8]);
      T = task({ split: false, instr: pick([12, 24]), data: d2, wait: pick([2, 3, 4]) });
      A = cpu(pick([2, 3, 4]), pick([2, 4]), pick([2, 4])); B = cpu(pick([2, 3]), 1, 16);
    }
    if (Math.random() < 0.5) { var t = A; A = B; B = t; }
    var R = finishPair(T, A, B, kind);
    if (!R) return null;
    // The trap: the CPU that looks better on paper (more cores, or a faster clock) must not always win.
    if (kind === 'chain' && A.ghz === B.ghz && Math.random() < 0.5) return null;
    return R;
  }
  // Level 4: one CPU, three upgrades; exactly one is best, by at least half a second.
  function upgrade() {
    var split = Math.random() < 0.6, d = pick([4, 6, 8]);
    var T = task({ split: split, instr: pick([12, 16, 24]), data: d, wait: pick([2, 3, 4, 6]) });
    var A = cpu(pick([1, 2, 3]), pick([1, 2]), pick([2, 4, 8, 16]));
    var ups = [
      { key: 'clock', cpu: cpu(A.ghz + 1, A.cores, A.cache) },
      { key: 'cores', cpu: cpu(A.ghz, A.cores * 2, A.cache) },
      { key: 'cache', cpu: cpu(A.ghz, A.cores, Math.max(A.cache, d * 2)) }
    ];
    ups.forEach(function (u) { u.t = time(u.cpu, T); });
    var t0 = time(A, T);
    if (!half(t0) || t0 > 30 || ups.some(function (u) { return !half(u.t); })) return null;
    var sorted = ups.slice().sort(function (a, b) { return a.t - b.t; });
    if (sorted[1].t - sorted[0].t < 0.5) return null;
    return { kind: 'upgrade', task: T, A: A, t0: t0, ups: ups, best: sorted[0].key, tBest: sorted[0].t };
  }
  // A typed time: a number of seconds, the unit optional.
  function readTime(text) {
    var m = String(text == null ? '' : text).trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s*(s|secs?|seconds?)?\s*\.?$/i);
    return m ? Number(m[1]) : null;
  }
  function sameTime(text, t) { var v = readTime(text); return v != null && Math.abs(v - t) < 1e-9; }
  // Which answers are wrong: picks { first, reason, tA, tB, up, tUp }.
  function grade(R, p) {
    var wrong = [];
    if (R.kind === 'upgrade') {
      if (p.up !== R.best) wrong.push('up');
      if (!sameTime(p.tUp, R.tBest)) wrong.push('tUp');
      return wrong;
    }
    if (R.level >= 1) {
      if (!sameTime(p.tA, R.tA)) wrong.push('tA');
      if (!sameTime(p.tB, R.tB)) wrong.push('tB');
    }
    if (p.first !== R.first) wrong.push('first');
    if (R.level === 0 && p.reason !== R.reason) wrong.push('reason');
    return wrong;
  }
  function complete(R, p) {
    if (R.kind === 'upgrade') return !!p.up && readTime(p.tUp) != null;
    if (R.level >= 1 && (readTime(p.tA) == null || readTime(p.tB) == null)) return false;
    return !!p.first && (R.level > 0 || !!p.reason);
  }
  window.PerfLabModel = { make: make, time: time, cores: cores, waits: waits, grade: grade, complete: complete, readTime: readTime, working: working, LEVELS: LEVELS, REASON: REASON, UPGRADE: UPGRADE, FIRST: FIRST };

  var host = document.getElementById('activity');
  if (!host) return;
  var el = Lab.el;

  // ---------------------------------------------------------------- the picture
  function taskCard(T) {
    return '<div class="perf-task"><b>The task:</b> ' + T.name + '<div class="perf-facts">' +
      '<span>Instructions: <b>' + T.instr + ' billion</b></span>' +
      '<span>Can it be split between cores? <b>' + (T.split ? 'Yes' : 'No') + '</b></span>' +
      '<span>Data it uses again and again: <b>' + T.data + ' MB</b></span>' +
      '<span>If that data does not fit in the cache: <b>waits ' + T.wait + ' s for RAM</b></span></div></div>';
  }
  function cpuCard(name, C, lit) {
    var row = function (k, label, v) { return '<tr' + (lit === k ? ' class="lit"' : '') + '><td>' + label + '</td><td><b>' + v + '</b></td></tr>'; };
    return '<div class="perf-cpu"><div class="perf-cpu-head">' + name + '</div><table>' + row('clock', 'Clock speed', C.ghz + ' GHz') +
      row('cores', 'Cores', C.cores) + row('cache', 'Cache', C.cache + ' MB') + '</table></div>';
  }
  function picture(R, lit) {
    if (R.kind === 'upgrade') return taskCard(R.task) + '<div class="perf-cpus one">' + cpuCard('Your CPU', R.A) + '</div>';
    return taskCard(R.task) + '<div class="perf-cpus">' + cpuCard('CPU A', R.A, lit) + cpuCard('CPU B', R.B, lit) + '</div>';
  }
  function race(rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.t; }));
    return '<div class="perf-race">' + rows.map(function (r) {
      return '<div class="perf-lane"><span class="perf-name">' + r.name + '</span><span class="perf-track"><span class="perf-fill' + (r.win ? ' win' : '') + '" style="width:' +
        Math.max(6, Math.round(100 * r.t / max)) + '%">' + num(r.t) + ' s</span></span></div>';
    }).join('') + '</div>';
  }

  // ---------------------------------------------------------------- the activity
  var params = new URLSearchParams(location.search);
  var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(params.get('level'), 10) || 1) - 1));
  var upto = Math.max(lv + 1, Math.min(LEVELS.length, parseInt(params.get('upto'), 10) || LEVELS.length));
  var log = Lab.results('cpu-lab-perf-' + (lv + 1) + '-' + upto, 'CPU Lab: CPU Race (levels ' + (lv + 1) + ' to ' + upto + ')');
  var have = 0, R = null, picks = null, checked = false, hintOn = false, walked = false, shownHow = {}, lastMsg = ['', ''];
  var reasonOrder = null, upOrder = null;

  function newRound() {
    R = make(lv);
    picks = {}; checked = false; hintOn = false; walked = false; lastMsg = ['', ''];
    reasonOrder = shuffle(Object.keys(REASON).map(function (k) { return REASON[k]; }));
    upOrder = shuffle(Object.keys(UPGRADE));
    draw();
    if (!shownHow[lv]) { shownHow[lv] = true; howItWorks(); }
  }
  function seg(label, options, chosen, onPick, show) {
    var g = el('div', { class: 'seg', role: 'group', 'aria-label': label });
    options.forEach(function (o) {
      var b = el('button', { type: 'button', 'aria-pressed': String(chosen === o) }, show ? show(o) : o);
      b.disabled = checked;
      b.addEventListener('click', function () { onPick(o); draw(); });
      g.appendChild(b);
    });
    return g;
  }
  function timeBox(label, key) {
    var w = el('label', { class: 'perf-time' }, label + ' ');
    var input = el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': label, 'data-key': key });
    input.value = picks[key] || '';
    input.disabled = checked;
    input.addEventListener('input', function () { picks[key] = input.value; });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    w.appendChild(input);
    w.appendChild(el('span', { class: 'small' }, ' seconds'));
    return w;
  }
  function row(wrong, key, inner, why) {
    var card = el('div', { class: 'card perf-q' + (checked ? (wrong.indexOf(key) >= 0 ? ' bad' : ' good') : '') });
    card.appendChild(inner);
    if (checked && why) card.appendChild(el('div', { class: 'why' }, why));
    return card;
  }
  function draw() {
    host.innerHTML = '';
    host.appendChild(el('h1', { class: 'lab-title' }, 'CPU Race'));
    if (log.isDone()) host.appendChild(el('div', { class: 'done-banner' }, 'Finished: you can say which CPU is faster for a task, and why. Keep going for practice.'));
    var bar = Lab.bar('Level ' + (lv + 1) + ' of ' + LEVELS.length + ': ' + LEVELS[lv].name, have, NEED);
    bar.querySelector('.level').insertAdjacentHTML('beforeend', ' <span class="help-tag h' + lv + '">' + LEVELS[lv].help + '</span>');
    host.appendChild(bar);
    if (lv === 0) host.appendChild(el('div', { class: 'rule' }, '<b>Clock speed:</b> 1 GHz = 1 billion FDE cycles a second, one instruction each. ' +
      '<b>Cores:</b> each core runs its own FDE cycle at the same time, if the task can be split. ' +
      '<b>Cache:</b> if the data fits in the cache, the CPU does not wait for RAM.'));
    if (lv === 1) host.appendChild(el('div', { class: 'rule' }, '<b>Time</b> = instructions &divide; (GHz &times; cores). Example: 12 billion &divide; (2 GHz &times; 2 cores) = 12 &divide; 4 = <b>3 s</b>.'));
    host.appendChild(el('div', {}, picture(R, lv === 0 ? R.diff : null)));
    if (hintOn) host.appendChild(el('div', { class: 'rule hint-box' }, hint()));
    var wrong = checked ? grade(R, picks) : [];
    var list = el('div', { class: 'cards' });
    if (R.kind === 'upgrade') {
      var g = el('div', {});
      g.appendChild(el('span', { class: 'task-q' }, 'Which upgrade makes this task finish soonest? '));
      g.appendChild(seg('Best upgrade', upOrder, picks.up, function (o) { picks.up = o; }, function (k) { return UPGRADE[k]; }));
      list.appendChild(row(wrong, 'up', g, checked ? 'Each upgrade on its own: ' + R.ups.map(function (u) { return UPGRADE[u.key] + ': ' + num(u.t) + ' s'; }).join('; ') + '. ' +
        (R.best === 'cores' ? 'The task can be split, so more cores process more instructions at the same time.' : R.best === 'cache' ? 'Most of the time was waiting for RAM. With the data in the cache, there is no waiting.' :
          R.task.split ? 'A faster clock runs more FDE cycles a second on every core.' : 'The task cannot be split, so extra cores do nothing. A faster clock runs more FDE cycles a second.') : ''));
      var t = el('div', {});
      t.appendChild(timeBox('With that upgrade, the task takes', 'tUp'));
      list.appendChild(row(wrong, 'tUp', t, checked ? 'With the best upgrade (' + UPGRADE[R.best] + '): ' + working(R.ups.filter(function (u) { return u.key === R.best; })[0].cpu, R.task) + '.' : ''));
    } else {
      if (lv >= 1) {
        var a = el('div', {}); a.appendChild(timeBox('CPU A takes', 'tA'));
        list.appendChild(row(wrong, 'tA', a, checked ? 'CPU A: ' + working(R.A, R.task) + '.' : ''));
        var b = el('div', {}); b.appendChild(timeBox('CPU B takes', 'tB'));
        list.appendChild(row(wrong, 'tB', b, checked ? 'CPU B: ' + working(R.B, R.task) + '.' : ''));
      }
      var f = el('div', {});
      f.appendChild(el('span', { class: 'task-q' }, 'Which finishes the task first? '));
      f.appendChild(seg('Which finishes first', FIRST, picks.first, function (o) { picks.first = o; }));
      list.appendChild(row(wrong, 'first', f, checked ? (R.first === 'The same time' ? 'They finish at the same time.' : R.first + ' finishes first.') + (lv === 0 ? ' CPU A: ' + working(R.A, R.task) + '. CPU B: ' + working(R.B, R.task) + '.' : '') : ''));
      if (lv === 0) {
        var r = el('div', {});
        r.appendChild(el('div', { class: 'task-q' }, 'Why is it faster?'));
        r.appendChild(seg('Why', reasonOrder, picks.reason, function (o) { picks.reason = o; }));
        list.appendChild(row(wrong, 'reason', r, checked ? 'The only difference is the ' + (R.diff === 'clock' ? 'clock speed' : R.diff === 'cores' ? 'number of cores' : 'cache') + ': ' + R.reason.toLowerCase() + '.' : ''));
      }
    }
    host.appendChild(list);
    if (checked) host.appendChild(el('div', {}, R.kind === 'upgrade'
      ? race([{ name: 'Now', t: R.t0 }].concat(R.ups.map(function (u) { return { name: UPGRADE[u.key], t: u.t, win: u.key === R.best }; })))
      : race([{ name: 'CPU A', t: R.tA, win: R.first === 'CPU A' }, { name: 'CPU B', t: R.tB, win: R.first === 'CPU B' }])));
    var act = el('div', { class: 'actions' });
    if (!checked) act.appendChild(Lab.button('Check', '', check));
    else act.appendChild(Lab.button('Next round', '', newRound));
    if ((lv === 1 || lv === 2) && !checked && !hintOn) act.appendChild(Lab.button('Show a hint', 'secondary', function () { hintOn = true; log.note('Used the hint at level ' + (lv + 1) + '.'); draw(); }));
    if (lv < 3) act.appendChild(Lab.button('Walk me through it', 'secondary', walkMe));
    act.appendChild(Lab.button('How it works', 'secondary', function () { howItWorks(); }));
    host.appendChild(act);
    host.appendChild(el('div', { class: 'feedback ' + (lastMsg[1] || ''), role: 'status' }, lastMsg[0] || ''));
    Lab.reportHeight();
  }
  function hint() {
    if (lv === 1) return 'Hint: CPU A runs ' + R.A.ghz + ' &times; ' + R.A.cores + ' = ' + (R.A.ghz * R.A.cores) + ' billion instructions a second. How many seconds for ' + R.task.instr + ' billion?';
    return 'Hint: first ask, can the task be split? If not, only 1 core works, however many it has. Then ask, does ' + R.task.data + ' MB fit in each cache? If not, add the waiting time.';
  }
  function check() {
    if (checked) return;
    if (!complete(R, picks)) { lastMsg = [R.kind === 'upgrade' || lv >= 1 ? 'Answer every row first. Type each time as a number of seconds.' : 'Answer both rows first.', 'hint']; draw(); return; }
    var wrong = grade(R, picks), ok = !wrong.length;
    checked = true;
    var what = wrong.map(function (k) {
      return k === 'first' ? 'first: ' + picks.first + ', not ' + R.first : k === 'reason' ? 'why: ' + picks.reason : k === 'up' ? 'upgrade: ' + UPGRADE[picks.up] + ', not ' + UPGRADE[R.best] :
        k + ': ' + picks[k] + ', not ' + num(k === 'tA' ? R.tA : k === 'tB' ? R.tB : R.tBest);
    });
    log.add(LEVELS[lv].name + ': ' + (ok ? 'all right' : what.join('; ')) + (hintOn ? ', used the hint' : '') + (walked ? ', used Walk me through it' : ''), ok);
    var up = false, fin = false;
    if (ok) {
      have++;
      if (have >= NEED) {
        have = 0;
        if (lv + 1 >= upto) { log.finish(); fin = true; } else { lv++; up = true; }
      }
      lastMsg = ['Right, with no mistakes.' + (up ? ' Level up: ' + LEVELS[lv].name + ' (' + LEVELS[lv].help.toLowerCase() + '). Press Next round.' : fin ? ' You have finished this activity. Go to the next slide, or keep practising.' : ' Press Next round.'), 'good'];
    } else {
      have = 0;
      lastMsg = ['Not this time: this round does not count. Read the working in each red row, then press Next round.', 'bad'];
    }
    draw();
  }

  // ---------------------------------------------------------------- Walk me through it and How it works
  // Always a different round from the one on screen, one step at a time.
  function walkSteps() {
    var o = make(lv), out = [];
    out.push({ text: 'A different race, the same way of thinking. First read the task: how many instructions, can it be split, and how much data does it use again and again?', visual: picture(o, lv === 0 ? o.diff : null) });
    if (o.kind === 'upgrade') {
      out.push({ text: 'Now: ' + working(o.A, o.task) + '.', visual: '' });
      o.ups.forEach(function (u) { out.push({ text: '<span class="hl">' + UPGRADE[u.key] + '</span>: ' + working(u.cpu, o.task) + '.', visual: '' }); });
      out.push({ text: 'The smallest time wins: <span class="hl">' + UPGRADE[o.best] + '</span>, ' + num(o.tBest) + ' s.', visual: '' });
      return out;
    }
    out.push({ text: 'CPU A: <span class="hl">' + working(o.A, o.task) + '</span>.', visual: '' });
    out.push({ text: 'CPU B: <span class="hl">' + working(o.B, o.task) + '</span>.', visual: '' });
    out.push({ text: (o.first === 'The same time' ? 'Both take ' + num(o.tA) + ' s, so they finish at the same time.' : 'The smaller time finishes first: <span class="hl">' + o.first + '</span>.') +
      (o.level === 0 ? ' The only difference is the ' + (o.diff === 'clock' ? 'clock speed' : o.diff === 'cores' ? 'number of cores' : 'cache') + ', so that is why.' : ''),
    visual: race([{ name: 'CPU A', t: o.tA, win: o.first === 'CPU A' }, { name: 'CPU B', t: o.tB, win: o.first === 'CPU B' }]) });
    return out;
  }
  function howItWorks() { Lab.walk('How it works: ' + LEVELS[lv].name, LEVELS[lv].help + '. ' + LEVELS[lv].how, lv < 3 ? walkSteps() : [{ text: LEVELS[lv].how, visual: '' }]); }
  function walkMe() {
    walked = true;
    Lab.walk('Walk me through it', 'A different race, the same way of thinking.', walkSteps(), function (seen, total) { log.note('Walk me through it (' + seen + ' of ' + total + ' steps).'); });
  }
  // For test harnesses: the round on screen and the level.
  window.PerfLabState = function () { return { round: R, level: lv + 1, have: have, checked: checked, done: log.isDone() }; };
  newRound();
})();
