// The stages (?activity=stages) and the order of a project's tasks (?activity=order). Both are about one idea:
// a stage or task can only start once what it needs has been made, so what each one needs decides the order.
(function () {
  'use strict';
  var el = PP.el, esc = PP.esc;

  // Shared: a row of numbered slots and a pool of cards. state.slots[i] is the card id in slot i (or null).
  function moveCard(state, id, place, swapWith) {
    var from = state.slots.indexOf(id);
    if (place === 'pool') { if (from >= 0) state.slots[from] = null; return; }
    var to = +place.slice(1);
    var there = swapWith != null ? swapWith : state.slots[to];
    if (from >= 0) state.slots[from] = there != null && there !== id ? there : null;
    state.slots[to] = id;
  }

  // ======================================================================== stages
  var CARDS = [
    { name: 'Decide', needs: 'an idea', gives: 'a list of what it must do' },
    { name: 'Design', needs: 'a list of what it must do', gives: 'a flowchart' },
    { name: 'Build', needs: 'a flowchart', gives: 'the program' },
    { name: 'Test', needs: 'the program', gives: 'a list of mistakes' },
    { name: 'Improve', needs: 'a list of mistakes', gives: 'a better program' }
  ];
  // The first stage in an order whose need nothing before it gives (index into order), or -1.
  function stuckAt(order) {
    var have = ['an idea'];
    for (var i = 0; i < order.length; i++) {
      var c = CARDS[order[i]];
      if (have.indexOf(c.needs) < 0) return i;
      have.push(c.gives);
    }
    return -1;
  }
  function stageCard(i, extra) {
    var c = CARDS[i];
    return '<b class="card-name">' + c.name + '</b><span class="card-line">Needs: ' + c.needs + '</span><span class="card-line">Gives: ' + c.gives + '</span>' + (extra || '');
  }

  PP.activities.stages = function (host) {
    var lead = el('p', { class: 'task-q' });
    var board = el('div', { class: 'board' });
    var bar = el('div', { class: 'actions' });
    var fb = el('div', { class: 'feedback', role: 'status' });
    host.appendChild(lead); host.appendChild(board); host.appendChild(bar); host.appendChild(fb);
    var state, part = 'order', wins = 0, round = 0, log = PP.results('the five stages in order, then where a broken order gets stuck');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { part: part, state: state, wins: wins, round: round }; };

    // ---------------------------------------------------------------- part 1: put the stages in order
    function startOrder() {
      part = 'order';
      var pool;
      do { pool = PP.shuffle([0, 1, 2, 3, 4]); } while (stuckAt(pool) < 0);
      state = { pool: pool, slots: [null, null, null, null, null], runs: 3, running: false };
      lead.innerHTML = 'Each stage needs something and gives something. Put the five stages in an order that works. Then press <b>Run</b>.';
      PP.say(fb, '', '');
      draw();
    }
    function draw(marks) {
      marks = marks || {};
      var html = '<div class="pool" data-place="pool"><span class="pool-label">Stages</span>' +
        state.pool.filter(function (i) { return state.slots.indexOf(i) < 0; }).map(function (i) {
          return '<button type="button" class="card stage-card" data-item="' + i + '">' + stageCard(i) + '</button>';
        }).join('') + '</div><div class="slots row5">' +
        state.slots.map(function (id, s) {
          var cls = marks[s] || '';
          return '<div class="slot ' + cls + '" data-place="s' + s + '"><span class="slot-n">' + (s + 1) + '</span>' +
            (id == null ? '<span class="slot-empty">Put a stage here</span>' : '<button type="button" class="card stage-card" data-item="' + id + '">' + stageCard(id) + '</button>') + '</div>';
        }).join('') + '</div>';
      board.innerHTML = html;
      bar.innerHTML = '';
      var run = el('button', { type: 'button', class: 'btn' }, PP.ICON.play + '<span>Run</span>');
      run.disabled = state.running || state.slots.indexOf(null) >= 0;
      run.addEventListener('click', runOrder);
      bar.appendChild(run);
      bar.appendChild(el('span', { class: 'small' }, 'Runs left: ' + state.runs));
      PP.reportHeight();
    }
    PP.placer(board, function (id, place, swapWith) {
      if (part !== 'order' || state.running) return;
      moveCard(state, +id, place, swapWith != null ? +swapWith : null);
      draw();
    }, function () { return part === 'order' && !state.running; });

    function runOrder() {
      state.running = true;
      state.runs--;
      var at = stuckAt(state.slots), marks = {}, i = 0;
      PP.say(fb, 'Running...', 'hint');
      (function step() {
        if (i < 5 && (at < 0 || i < at)) { marks[i] = 'ran'; draw(marks); i++; PP.later(380, step); return; }
        state.running = false;
        if (at < 0) {
          draw(marks);
          PP.say(fb, '<b>It works.</b> Every stage had what it needed, because the stage before it made it.', '');
          log.add('stages in order, run ' + (3 - state.runs) + ' of 3', true);
          PP.later(300, summary);
          return;
        }
        marks[at] = 'stuck';
        draw(marks);
        var c = CARDS[state.slots[at]];
        var text = '<b>' + c.name + ' is stuck.</b> It needs ' + c.needs + '. No stage before it gives ' + c.needs + '.';
        if (state.runs > 0) { PP.say(fb, text + ' Move the cards and run it again.', 'bad'); draw(marks); return; }
        PP.say(fb, text + ' No runs left. Look at what each stage needs, then try a new set.', 'bad');
        log.add('stages in order, no runs left', false);
        bar.innerHTML = '';
        var again = el('button', { type: 'button', class: 'btn secondary' }, '<span>Try a new set</span>' + PP.ICON.next);
        again.addEventListener('click', startOrder);
        bar.appendChild(again);
        PP.reportHeight();
      })();
    }
    function summary() {
      part = 'summary';
      board.innerHTML = '<div class="stage-row">' + PP.STAGES.map(function (n, i) {
        return '<div class="stage-box"><b>' + (i + 1) + '. ' + n + '</b><span>' + PP.STAGE_SAYS[i] + '</span></div>' + (i < 4 ? '<span class="arrow">&rarr;</span>' : '');
      }).join('') + '</div><p class="small center">Each stage uses what the stage before it made. After Improve, test again.</p>';
      bar.innerHTML = '';
      var next = el('button', { type: 'button', class: 'btn' }, '<span>Next: where does it get stuck?</span>' + PP.ICON.next);
      next.addEventListener('click', function () { round = 0; wins = 0; startPredict(); });
      bar.appendChild(next);
      PP.reportHeight();
    }

    // ---------------------------------------------------------------- part 2: predict where a broken order gets stuck
    var NEED = 2;
    function startPredict() {
      part = 'predict';
      round++;
      var order = [0, 1, 2, 3, 4], a = PP.rand(4), b;
      do { b = PP.rand(5); } while (b === a);
      var t = order[a]; order[a] = order[b]; order[b] = t;
      var at = stuckAt(order), stuck = CARDS[order[at]];
      // Reasons, all in the same form: the right one, a need the stage does not have, and the wrong way round.
      var other = PP.pick(CARDS.filter(function (c) { return c.needs !== stuck.needs && c.needs !== 'an idea'; }));
      var reasons = PP.shuffle([
        { ok: true, text: 'It needs ' + stuck.needs + ', and no stage before it gives that.' },
        { ok: false, text: 'It needs ' + other.needs + ', and no stage before it gives that.' },
        { ok: false, text: 'It gives ' + stuck.gives + ', and a stage before it needs that.' }
      ]);
      state = { order: order, at: at, reasons: reasons, chose: null };
      lead.innerHTML = PP.scoreLine(round, wins, NEED) + '<br>A team runs the stages in this order. Which stage gets stuck <b>first</b>? Click it.';
      PP.say(fb, '', '');
      drawPredict();
    }
    function drawPredict(marks) {
      marks = marks || {};
      board.innerHTML = '<div class="slots row5">' + state.order.map(function (id, s) {
        return '<div class="slot ' + (marks[s] || '') + '"><span class="slot-n">' + (s + 1) + '</span><button type="button" class="card stage-card" data-pick="' + s + '"' +
          (state.chose != null ? ' disabled' : '') + '>' + stageCard(id) + '</button></div>';
      }).join('') + '</div>';
      Array.prototype.forEach.call(board.querySelectorAll('[data-pick]'), function (b) {
        b.addEventListener('click', function () { choose(+b.getAttribute('data-pick')); });
      });
      bar.innerHTML = '';
      PP.reportHeight();
    }
    function choose(s) {
      state.chose = s;
      state.firstRight = s === state.at;
      var marks = {}; marks[s] = state.firstRight ? 'good' : 'bad';
      drawPredict(marks);
      var stuck = CARDS[state.order[state.at]];
      PP.say(fb, state.firstRight ? 'Yes, ' + stuck.name + ' gets stuck first.' : 'Not that one. ' + stuck.name + ' gets stuck first.', state.firstRight ? '' : 'bad');
      lead.innerHTML = PP.scoreLine(round, wins, NEED) + '<br>Why does <b>' + stuck.name + '</b> get stuck? Pick one.';
      var box = el('div', { class: 'choices' });
      state.reasons.forEach(function (r) {
        var b = el('button', { type: 'button', class: 'choice' }, r.text);
        b.addEventListener('click', function () { reason(r, b, box); });
        box.appendChild(b);
      });
      bar.innerHTML = ''; bar.appendChild(box);
      PP.reportHeight();
    }
    function reason(r, button, box) {
      Array.prototype.forEach.call(box.children, function (b) { b.disabled = true; });
      button.classList.add(r.ok ? 'good' : 'bad');
      var win = state.firstRight && r.ok;
      if (win) wins++; else wins = 0;
      log.add('where a broken order gets stuck (' + (state.firstRight ? 'stage right' : 'stage wrong') + ', ' + (r.ok ? 'reason right' : 'reason wrong') + ')', win);
      if (wins >= NEED) log.finish();
      // Now run it, so everyone sees where it stops.
      var marks = {}, i = 0;
      (function step() {
        if (i < state.at) { marks[i] = 'ran'; drawPredict(marks); i++; PP.later(320, step); return; }
        marks[state.at] = 'stuck';
        drawPredict(marks);
        var stuck = CARDS[state.order[state.at]];
        PP.say(fb, (win ? '<b>Right.</b> ' : '<b>Not this time.</b> This one does not count, and the count starts again. ') + stuck.name + ' is stuck: it needs ' + stuck.needs + ', and no stage before it gives that.', win ? '' : 'bad');
        bar.innerHTML = '';
        if (wins >= NEED) { bar.innerHTML = PP.doneBanner('Done: you found where ' + NEED + ' broken orders get stuck.'); PP.reportHeight(); return; }
        var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next order</span>' + PP.ICON.next);
        next.addEventListener('click', startPredict);
        bar.appendChild(next);
        PP.reportHeight();
      })();
    }
    startOrder();
  };

  // ======================================================================== order
  // Rounds: put the tasks in an order that works (two runs), or say which task in a broken order gets stuck first
  // and why (one try each). The first two rounds show what each task needs; after that the student works it out
  // from what the task does. Four rounds right to finish.
  var NEED_ORDER = 4;
  function roundKind(n) {
    return [null, { kind: 'build', size: 6, show: true }, { kind: 'predict', size: 6, show: true }, { kind: 'build', size: 6, show: false },
      { kind: 'predict', size: 6, show: false }][n] || { kind: n % 2 ? 'build' : 'predict', size: 6, show: false };
  }
  // A working order for these tasks, picked at random (any order where each task comes after what it needs).
  function anyOrder(tasks) {
    var done = {}, out = [];
    while (out.length < tasks.length) {
      var ready = tasks.filter(function (t) { return !done[t.id] && t.needs.every(function (n) { return done[n]; }); });
      var t = PP.pick(ready); done[t.id] = true; out.push(t.id);
    }
    return out;
  }
  function taskCard(tasks, t, show) {
    return '<span class="card-name">' + esc(t.text) + '</span>' + (show ? '<span class="card-line">Needs: ' + PP.needsText(tasks, t) + '</span>' : '');
  }

  PP.activities.order = function (host) {
    var lead = el('p', { class: 'task-q' });
    var board = el('div', { class: 'board' });
    var bar = el('div', { class: 'actions' });
    var fb = el('div', { class: 'feedback', role: 'status' });
    host.appendChild(lead); host.appendChild(board); host.appendChild(bar); host.appendChild(fb);
    var round = 0, wins = 0, lastProject = -1, state, log = PP.results('put the tasks in order');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { state: state, wins: wins, round: round }; };

    function next() {
      round++;
      var k = roundKind(round), pi;
      do { pi = PP.rand(PP.PROJECTS.length); } while (pi === lastProject);
      lastProject = pi;
      var tasks = PP.tasksOf(PP.PROJECTS[pi], k.size);
      state = { k: k, p: PP.PROJECTS[pi], tasks: tasks, running: false };
      PP.say(fb, '', '');
      if (k.kind === 'build') startBuild(); else startPredict();
    }

    // ---------------------------------------------------------------- build an order
    function startBuild() {
      var pool;
      do { pool = PP.shuffle(state.tasks.map(function (t) { return t.id; })); } while (!PP.orderProblem(state.tasks, pool));
      state.pool = pool; state.slots = state.tasks.map(function () { return null; }); state.runs = 2;
      lead.innerHTML = PP.scoreLine(round, wins, NEED_ORDER) + '<br>Project: <b>' + esc(state.p.name) + '</b>. Put the tasks in an order that works' +
        (state.k.show ? '.' : '. Think: what does each task need first?') + ' Then press <b>Run</b>.';
      drawBuild();
    }
    function drawBuild(marks) {
      marks = marks || {};
      var tasks = state.tasks, show = state.k.show;
      board.innerHTML = '<div class="two-col"><div class="pool col" data-place="pool"><span class="pool-label">Tasks</span>' +
        state.pool.filter(function (id) { return state.slots.indexOf(id) < 0; }).map(function (id) {
          return '<button type="button" class="card task-card" data-item="' + id + '">' + taskCard(tasks, tasks[id], show) + '</button>';
        }).join('') + '</div><div class="slots col"><span class="pool-label">Your order</span>' +
        state.slots.map(function (id, s) {
          return '<div class="slot line ' + (marks[s] || '') + '" data-place="s' + s + '"><span class="slot-n">' + (s + 1) + '</span>' +
            (id == null ? '<span class="slot-empty">Put a task here</span>' : '<button type="button" class="card task-card" data-item="' + id + '">' + taskCard(tasks, tasks[id], show) + '</button>') + '</div>';
        }).join('') + '</div></div>';
      bar.innerHTML = '';
      var run = el('button', { type: 'button', class: 'btn' }, PP.ICON.play + '<span>Run</span>');
      run.disabled = state.running || state.slots.indexOf(null) >= 0;
      run.addEventListener('click', runBuild);
      bar.appendChild(run);
      bar.appendChild(el('span', { class: 'small' }, 'Runs left: ' + state.runs));
      PP.reportHeight();
    }
    PP.placer(board, function (id, place, swapWith) {
      if (!state || state.k.kind !== 'build' || state.running || state.over) return;
      moveCard(state, +id, place, swapWith != null ? +swapWith : null);
      drawBuild();
    }, function () { return state && state.k.kind === 'build' && !state.running && !state.over; });

    function runBuild() {
      state.running = true; state.runs--;
      var prob = PP.orderProblem(state.tasks, state.slots), stop = prob ? prob.at : state.slots.length, marks = {}, i = 0;
      PP.say(fb, 'Running...', 'hint');
      (function step() {
        if (i < stop) { marks[i] = 'ran'; drawBuild(marks); i++; PP.later(300, step); return; }
        state.running = false;
        if (!prob) {
          var first = state.runs === 1;
          if (first) wins++; else wins = 0;
          state.over = true; drawBuild(marks);
          log.add('round ' + round + ', order the ' + state.p.short + ' tasks, run ' + (2 - state.runs) + ' of 2', first);
          PP.say(fb, '<b>It works.</b> Every task came after what it needed.' + (first ? '' : ' It took a second run, so this round does not count, and the count starts again.'), first ? '' : 'hint');
          return finish();
        }
        marks[stop] = 'stuck';
        drawBuild(marks);
        var text = '<b>Stuck at ' + (stop + 1) + '.</b> "' + esc(prob.task.text) + '" needs ' + prob.need.gives + ', and that is not made yet.';
        if (state.runs > 0) { PP.say(fb, text + ' Move the tasks and run it again.', 'bad'); drawBuild(marks); return; }
        state.over = true;
        wins = 0;
        log.add('round ' + round + ', order the ' + state.p.short + ' tasks, no runs left', false);
        state.slots = anyOrder(state.tasks);
        drawBuild();
        PP.say(fb, text + ' No runs left. Here is an order that works: each task comes after what it needs.', 'bad');
        finish();
      })();
    }

    // ---------------------------------------------------------------- predict where a broken order gets stuck
    function startPredict() {
      var tasks = state.tasks, order, prob;
      // A working order with one task moved to just before one of the tasks it needs.
      do {
        order = anyOrder(tasks);
        var movable = order.filter(function (id) { return tasks[id].needs.length; }), id = PP.pick(movable);
        var needPos = Math.min.apply(null, tasks[id].needs.map(function (n) { return order.indexOf(n); }));
        order.splice(order.indexOf(id), 1);
        order.splice(PP.rand(needPos + 1), 0, id);
        prob = PP.orderProblem(tasks, order);
      } while (!prob);
      var stuck = prob.task, pos = prob.at;
      var made = order.slice(0, pos).map(function (i) { return tasks[i]; });
      var later = order.slice(pos + 1).map(function (i) { return tasks[i]; }).filter(function (t) { return stuck.needs.indexOf(t.id) < 0 && t.id !== prob.need.id; });
      var haveNeed = stuck.needs.map(function (n) { return tasks[n]; }).filter(function (t) { return order.indexOf(t.id) < pos; });
      var wrong1 = haveNeed.length ? haveNeed[0] : made.length ? made[made.length - 1] : null;
      var wrong2 = later.length ? PP.pick(later) : null;
      var reasons = [{ ok: true, text: 'It needs ' + prob.need.gives + ', and that is made later.' }];
      [wrong1, wrong2].concat(PP.shuffle(tasks)).forEach(function (t) {
        if (!t || reasons.length >= 3 || t.id === prob.need.id || t.id === stuck.id || (stuck.needs.indexOf(t.id) >= 0 && order.indexOf(t.id) > pos) || reasons.some(function (r) { return r.text.indexOf(' ' + t.gives + ',') >= 0; })) return;
        reasons.push({ ok: false, text: 'It needs ' + t.gives + ', and that is made later.' });
      });
      state.order = order; state.at = pos; state.reasons = PP.shuffle(reasons); state.chose = null;
      lead.innerHTML = PP.scoreLine(round, wins, NEED_ORDER) + '<br>Project: <b>' + esc(state.p.name) + '</b>. A team does the tasks in this order. Which task gets stuck <b>first</b>? Click it.';
      drawPredict();
    }
    function drawPredict(marks) {
      marks = marks || {};
      var tasks = state.tasks, show = state.k.show;
      board.innerHTML = '<div class="slots col narrow">' + state.order.map(function (id, s) {
        return '<div class="slot line ' + (marks[s] || '') + '"><span class="slot-n">' + (s + 1) + '</span><button type="button" class="card task-card" data-pick="' + s + '"' +
          (state.chose != null ? ' disabled' : '') + '>' + taskCard(tasks, tasks[id], show) + '</button></div>';
      }).join('') + '</div>';
      Array.prototype.forEach.call(board.querySelectorAll('[data-pick]'), function (b) {
        b.addEventListener('click', function () { choose(+b.getAttribute('data-pick')); });
      });
      if (state.chose == null) bar.innerHTML = '';
      PP.reportHeight();
    }
    function choose(s) {
      state.chose = s; state.firstRight = s === state.at;
      var marks = {}; marks[s] = state.firstRight ? 'good' : 'bad';
      drawPredict(marks);
      var stuck = state.tasks[state.order[state.at]];
      PP.say(fb, state.firstRight ? 'Yes, that task gets stuck first.' : 'Not that one. Task ' + (state.at + 1) + ' gets stuck first.', state.firstRight ? '' : 'bad');
      lead.innerHTML = PP.scoreLine(round, wins, NEED_ORDER) + '<br>Why does "<b>' + esc(stuck.text) + '</b>" get stuck? Pick one.';
      var box = el('div', { class: 'choices' });
      state.reasons.forEach(function (r) {
        var b = el('button', { type: 'button', class: 'choice' }, esc(r.text));
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(box.children, function (x) { x.disabled = true; });
          b.classList.add(r.ok ? 'good' : 'bad');
          var win = state.firstRight && r.ok;
          if (win) wins++; else wins = 0;
          log.add('round ' + round + ', where the ' + state.p.short + ' order gets stuck (' + (state.firstRight ? 'task right' : 'task wrong') + ', ' + (r.ok ? 'reason right' : 'reason wrong') + ')', win);
          var m = {}, i = 0;
          (function step() {
            if (i < state.at) { m[i] = 'ran'; drawPredict(m); i++; PP.later(260, step); return; }
            m[state.at] = 'stuck'; drawPredict(m);
            var need = PP.orderProblem(state.tasks, state.order).need;
            PP.say(fb, (win ? '<b>Right.</b> ' : '<b>Not this time.</b> This round does not count, and the count starts again. ') + 'It needs ' + need.gives + ', from "' + esc(need.text) + '", and that comes later.', win ? '' : 'bad');
            bar.innerHTML = '';
            finish();
          })();
        });
        box.appendChild(b);
      });
      bar.innerHTML = ''; bar.appendChild(box);
      PP.reportHeight();
    }

    function finish() {
      bar.innerHTML = '';
      if (wins >= NEED_ORDER) { log.finish(); bar.innerHTML = PP.doneBanner('Done: ' + wins + ' rounds right.'); lead.innerHTML = PP.scoreLine(round, wins, NEED_ORDER); PP.reportHeight(); return; }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next round</span>' + PP.ICON.next);
      b.addEventListener('click', next);
      bar.appendChild(b);
      PP.reportHeight();
    }
    next();
  };
})();
