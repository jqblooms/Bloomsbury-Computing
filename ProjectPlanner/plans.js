// Plans: read a plan (?activity=read), find what is missing (?activity=gaps), what if something changes
// (?activity=whatif), plan a project from a brief (?activity=build) and find then fix every fault (?activity=fix).
// A plan gives each task a person and a day. What is wrong with a plan always comes from PP.problems, and what
// happens when something changes from PP.rerun, so every answer is worked out from the plan on the screen.
(function () {
  'use strict';
  var el = PP.el, esc = PP.esc, DAYS = PP.DAYS;

  function team(n) { return PP.shuffle(PP.PEOPLE).slice(0, n); }
  function newProject(not) {
    var i; do { i = PP.rand(PP.PROJECTS.length); } while (i === not && PP.PROJECTS.length > 1);
    return i;
  }
  function copyPlan(plan) { var out = {}; Object.keys(plan).forEach(function (k) { out[k] = { who: plan[k].who, day: plan[k].day }; }); return out; }
  // The task's stage when no other task has it, otherwise its words.
  function label(tasks, t) {
    var same = tasks.filter(function (x) { return x.stage === t.stage; }).length;
    return same === 1 ? 'the <b>' + PP.STAGES[t.stage] + '</b> task' : '"<b>' + esc(t.text) + '</b>"';
  }
  function briefLines(brief, people) {
    var out = ['Project deadline: <b>' + DAYS[PP.deadlineOf(brief)] + '</b>.', 'Team: ' + people.join(', ') + '.'];
    Object.keys(brief.away || {}).forEach(function (who) {
      var d = brief.away[who];
      out.push(who + ' is away on ' + d.map(function (x) { return DAYS[x]; }).join(' and ') + '.');
    });
    if (brief.shut && brief.shut.length) out.push('The computer room is shut on ' + brief.shut.map(function (x) { return DAYS[x]; }).join(' and ') + ' (' + PP.ICON.pc + ' tasks need it).');
    return out;
  }

  // ---------------------------------------------------------------- the plan as a table
  // opts: clickCells (a cell is a button: data-cell "id:col"), clickRows (a row is a button: data-row), marks
  // {key: class}, edit (who and day become selects), people, removed (rows left out), tags {id: html}.
  function planTable(tasks, plan, opts) {
    opts = opts || {};
    var rows = tasks.filter(function (t) { return !(opts.removed && opts.removed[t.id]); });
    var head = '<thead><tr><th>#</th><th>Task</th><th>Who</th><th>Deadline</th><th>Needs <span class="legend">(' + PP.ICON.pc + ' a computer)</span></th></tr></thead>';
    var body = rows.map(function (t, n) {
      var p = plan[t.id] || {};
      var needs = PP.needsText(tasks, t) + (t.pc ? ' <i class="pc" title="a computer">' + PP.ICON.pc + '</i>' : '');
      var cells = {
        task: '<span class="tag">' + PP.STAGES[t.stage] + '</span> ' + esc(t.text) + (opts.tags && opts.tags[t.id] ? opts.tags[t.id] : ''),
        who: p.who ? esc(p.who) : '<span class="gap">&nbsp;</span>',
        day: p.day != null ? DAYS[p.day] : '<span class="gap">&nbsp;</span>',
        needs: needs
      };
      if (opts.edit) {
        cells.who = '<select data-edit="who" data-id="' + t.id + '" aria-label="Who does task ' + (n + 1) + '"><option value="">?</option>' +
          opts.people.map(function (x) { return '<option' + (x === p.who ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>';
        cells.day = '<select data-edit="day" data-id="' + t.id + '" aria-label="Deadline of task ' + (n + 1) + '"><option value="">?</option>' +
          DAYS.slice(0, (opts.lastDay || 5) + 1).map(function (x, d) { return '<option value="' + d + '"' + (d === p.day ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>';
      }
      var td = function (col) {
        var key = t.id + ':' + col, cls = (opts.marks && opts.marks[key]) || '';
        if (opts.clickCells) return '<td class="' + cls + '"><button type="button" class="cell-btn" data-cell="' + key + '">' + cells[col] + '</button></td>';
        return '<td class="' + cls + '">' + cells[col] + '</td>';
      };
      var rowCls = (opts.marks && opts.marks['row:' + t.id]) || '';
      var num = opts.clickRows ? '<button type="button" class="row-btn" data-row="' + t.id + '">' + (n + 1) + '</button>' : (n + 1);
      return '<tr class="' + rowCls + '"><td class="num">' + num + '</td>' + td('task') + td('who') + td('day') + td('needs') + '</tr>';
    }).join('');
    return '<div class="table-wrap"><table class="plan' + (opts.clickRows ? ' rows-click' : '') + '">' + head + '<tbody>' + body + '</tbody></table></div>';
  }
  // In a row-click table the whole row is the button: a click anywhere on a row picks its task.
  function onRow(board, fn) {
    board.addEventListener('click', function (e) {
      var tr = e.target.closest('table.rows-click tbody tr');
      if (!tr || e.target.closest('select')) return;
      var b = tr.querySelector('[data-row]');
      if (b && !b.disabled) fn(+b.getAttribute('data-row'));
    });
  }

  // ---------------------------------------------------------------- a valid plan
  function validPlan(size, people, brief, opts) {
    for (var i = 0; i < 60; i++) {
      var pi = newProject(opts && opts.not), tasks = PP.tasksOf(PP.PROJECTS[pi], size);
      var plan = PP.solve(tasks, people, brief, opts);
      if (plan) return { pi: pi, p: PP.PROJECTS[pi], tasks: tasks, plan: plan };
    }
    throw new Error('No plan');
  }

  // ======================================================================== read
  var NEED_READ = 6;
  PP.activities.read = function (host) {
    var lead = el('p', { class: 'task-q' }), board = el('div', { class: 'board' }), bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    host.appendChild(lead); host.appendChild(board); host.appendChild(bar); host.appendChild(fb);
    var right = 0, asked = 0, cur = null, plan = null, kinds = [], lastPi = -1, log = PP.results('read the plan');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { cur: cur, plan: plan, right: right, asked: asked }; };
    function newPlan() {
      var people = team(3);
      plan = validPlan(6, people, {}, { not: lastPi });
      lastPi = plan.pi;
      plan.people = people;
      plan.used = {};
    }
    function question() {
      var tasks = plan.tasks, P = plan.plan;
      if (!kinds.length) kinds = PP.shuffle(['who', 'day', 'ill', 'before', 'needs', 'ill', 'before']);
      var kind = kinds.pop(), t, q;
      var fresh = tasks.filter(function (x) { return !plan.used[kind + x.id]; });
      if (kind === 'who') { t = PP.pick(fresh); q = { text: 'Click the name of the person who does ' + label(tasks, t) + '.', answer: t.id + ':who', why: 'Find ' + label(tasks, t) + ', then read across to Who: ' + esc(P[t.id].who) + '.' }; }
      else if (kind === 'day') { t = PP.pick(fresh); q = { text: 'Click the deadline for ' + label(tasks, t) + '.', answer: t.id + ':day', why: 'Find ' + label(tasks, t) + ', then read across to Deadline: ' + DAYS[P[t.id].day] + '.' }; }
      else if (kind === 'needs') { t = PP.pick(fresh.filter(function (x) { return x.needs.length; })); q = { text: 'Click what ' + label(tasks, t) + ' needs.', answer: t.id + ':needs', why: 'Find ' + label(tasks, t) + ', then read across to Needs.' }; }
      else if (kind === 'before') {
        t = PP.pick(fresh.filter(function (x) { return x.needs.length === 1; }));
        var n = tasks[t.needs[0]];
        q = { text: 'Which task must be finished before ' + label(tasks, t) + ' can start? Click that task.', answer: n.id + ':task',
          why: label(tasks, t) + ' needs ' + n.gives + '. ' + label(tasks, n) + ' makes it.' };
      } else {
        // Someone with a task on that day is ill. A person with two tasks is a better question.
        var byWho = {};
        tasks.forEach(function (x) { (byWho[P[x.id].who] = byWho[P[x.id].who] || []).push(x); });
        var who = PP.pick(Object.keys(byWho).sort(function (a, b) { return byWho[b].length - byWho[a].length; }).slice(0, 2));
        t = PP.pick(byWho[who]);
        q = { text: esc(who) + ' is ill on ' + DAYS[P[t.id].day] + '. Click the task that could miss its deadline.', answer: t.id + ':task',
          why: 'Find ' + esc(who) + '\'s tasks. Which one is due on ' + DAYS[P[t.id].day] + '? ' + PP.cap(label(tasks, t)) + '.' };
      }
      plan.used[kind + t.id] = true;
      return q;
    }
    function ask() {
      if (asked % 3 === 0) newPlan();
      asked++;
      cur = question();
      lead.innerHTML = '<span class="round">Question ' + asked + '</span><span class="score">Right so far: <b>' + right + '</b> of ' + NEED_READ + ' needed</span><br>' +
        'Project: <b>' + esc(plan.p.name) + '</b>. ' + cur.text;
      board.innerHTML = planTable(plan.tasks, plan.plan, { clickCells: true });
      bar.innerHTML = '';
      PP.say(fb, '', '');
    }
    board.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cell]');
      if (!b || !cur || cur.done) return;
      cur.done = true;
      var key = b.getAttribute('data-cell'), ok = key === cur.answer, marks = {};
      marks[cur.answer] = 'good';
      if (!ok) marks[key] = 'bad';
      if (ok) right++;
      log.add(PP.plain(cur.text), ok);
      if (right >= NEED_READ) log.finish();
      board.innerHTML = planTable(plan.tasks, plan.plan, { clickCells: true, marks: marks });
      Array.prototype.forEach.call(board.querySelectorAll('[data-cell]'), function (x) { x.disabled = true; });
      PP.say(fb, (ok ? '<b>Right.</b> ' : '<b>Not that one.</b> The right one is green. ') + cur.why, ok ? '' : 'bad');
      lead.querySelector('.score').innerHTML = 'Right so far: <b>' + right + '</b> of ' + NEED_READ + ' needed';
      if (right >= NEED_READ) { bar.innerHTML = PP.doneBanner('Done: ' + right + ' right in ' + asked + ' questions.'); PP.reportHeight(); return; }
      var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next question</span>' + PP.ICON.next);
      next.addEventListener('click', ask);
      bar.appendChild(next);
      PP.reportHeight();
    });
    ask();
  };

  // ======================================================================== faults: gaps and fix
  // The faults in a plan, from PP.problems: one per row and kind (a clash is one fault on two rows). A task with no
  // day also makes every task that needs it "not ready": that is the same gap, so it is not counted again.
  var SHORT = { noWho: 'nobody', noDay: 'no deadline', needs: 'before what it needs', clash: 'two tasks, one day', away: 'away', room: 'room shut', late: 'after the deadline' };
  function faultsOf(tasks, plan, brief) {
    var out = [];
    PP.problems(tasks, plan, brief).forEach(function (p) {
      if (p.kind === 'needs' && (plan[p.other] || {}).day == null) return;
      var rows = p.kind === 'clash' ? [p.task, p.other] : [p.task];
      if (!out.some(function (f) { return f.kind === p.kind && f.rows.join() === rows.join(); })) out.push({ kind: p.kind, rows: rows, other: p.other, text: p.text });
    });
    return out;
  }
  // Break a working plan with one fault of each kind asked for, on different rows. Returns null when the faults
  // came out different (for example two faults on one row); the caller tries again.
  function breakPlan(tasks, plan, brief, kinds, people) {
    var P = copyPlan(plan), used = {}, b = { away: {}, shut: [], deadline: brief.deadline };
    var free = function (list) { return list.filter(function (t) { return !used[t.id]; }); };
    var dependents = function (t) { return tasks.filter(function (x) { return x.needs.indexOf(t.id) >= 0; }); };
    for (var i = 0; i < kinds.length; i++) {
      var k = kinds[i], t;
      if (k === 'noWho') { t = PP.pick(free(tasks)); P[t.id].who = null; }
      else if (k === 'noDay') { t = PP.pick(free(tasks.filter(function (x) { return !dependents(x).length; }))); if (!t) return null; P[t.id].day = null; }
      else if (k === 'needs') {
        t = PP.pick(free(tasks.filter(function (x) { return x.needs.length; })));
        if (!t) return null;
        P[t.id].day = P[PP.pick(t.needs)].day;
      } else if (k === 'clash') {
        var pairs = [];
        tasks.forEach(function (a) { tasks.forEach(function (c) { if (a.id < c.id && !used[a.id] && !used[c.id] && P[a.id].day === P[c.id].day && P[a.id].who !== P[c.id].who) pairs.push([a, c]); }); });
        if (!pairs.length) return null;
        var pr = PP.pick(pairs); P[pr[1].id].who = P[pr[0].id].who; used[pr[0].id] = true; t = pr[1];
      } else if (k === 'away') { t = PP.pick(free(tasks.filter(function (x) { return P[x.id].who; }))); if (!t) return null; b.away[P[t.id].who] = [P[t.id].day]; }
      else if (k === 'room') { t = PP.pick(free(tasks.filter(function (x) { return x.pc && P[x.id].day != null; }))); if (!t) return null; b.shut = [P[t.id].day]; }
      else if (k === 'late') { t = PP.pick(free(tasks.filter(function (x) { return !dependents(x).length; }))); if (!t) return null; P[t.id].day = PP.deadlineOf(brief) + 1; }
      if (!t) return null;
      used[t.id] = true;
    }
    // A brief always says who is away and when the room is shut, even when that breaks nothing.
    if (!Object.keys(b.away).length) {
      var who = PP.pick(people), busyDays = tasks.filter(function (x) { return P[x.id].who === who; }).map(function (x) { return P[x.id].day; });
      var d = PP.pick([0, 1, 2, 3, 4].filter(function (x) { return busyDays.indexOf(x) < 0; }));
      if (d != null) b.away[who] = [d];
    }
    if (!b.shut.length) {
      var pcDays = tasks.filter(function (x) { return x.pc; }).map(function (x) { return P[x.id].day; });
      var s = PP.pick([0, 1, 2, 3, 4].filter(function (x) { return pcDays.indexOf(x) < 0; }));
      if (s != null) b.shut = [s];
    }
    var faults = faultsOf(tasks, P, b);
    if (faults.length !== kinds.length || kinds.some(function (k) { return !faults.some(function (f) { return f.kind === k; }); })) return null;
    return { plan: P, brief: b, faults: faults };
  }

  // Find the faults by clicking a task, then saying what is wrong with it. More than two misses loses the plan.
  // opts: rounds [{size, kinds, missing}], menu (the kinds offered), fixAfter (then fix it), done text.
  function faultFinder(host, opts) {
    var lead = el('p', { class: 'task-q' }), brief = el('div', { class: 'brief' }), board = el('div', { class: 'board' }), menu = el('div', { class: 'menu' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    [lead, brief, board, menu, bar, fb].forEach(function (n) { host.appendChild(n); });
    var MISSES = 2, roundIx = 0, wins = 0, attempt = 0, lastPi = -1, S, log = PP.results(opts.label);
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { S: S, wins: wins }; };

    function start() {
      attempt++;
      var R = opts.rounds[Math.min(roundIx, opts.rounds.length - 1)], made = null;
      for (var i = 0; i < 300 && !made; i++) {
        var people = team(3), base = validPlan(R.size, people, {}, { not: lastPi });
        var broken = breakPlan(base.tasks, base.plan, { deadline: R.deadline }, PP.shuffle(R.kinds), people);
        // A plan to fix must have a way to fix it within the brief.
        if (broken && (!opts.fixAfter || PP.solve(base.tasks, people, broken.brief))) made = { base: base, broken: broken, people: people };
      }
      lastPi = made.base.pi;
      S = { tasks: made.base.tasks, p: made.base.p, plan: made.broken.plan, brief: made.broken.brief, people: made.people,
        faults: made.broken.faults.map(function (f) { return Object.assign({ found: false }, f); }), misses: 0, removed: {}, phase: 'find', chosen: null, checks: 0 };
      if (R.missing) {
        // A stage none of the faults touch, so every fault stays on the screen.
        var touched = {};
        S.faults.forEach(function (f) { f.rows.concat(f.other != null ? [f.other] : []).forEach(function (r) { touched[S.tasks[r].stage] = true; }); });
        var stages = [1, 2, 3, 4].filter(function (x) { return !touched[x]; });
        if (!stages.length) { attempt--; return start(); }
        var s = PP.pick(stages), row = S.tasks.filter(function (t) { return t.stage === s; });
        row.forEach(function (t) { S.removed[t.id] = true; });
        S.faults = S.faults.filter(function (f) { return !f.rows.some(function (r) { return S.removed[r]; }); });
        S.faults.push({ kind: 'missing', rows: [], stage: s, found: false });
      }
      draw();
      PP.say(fb, '', '');
    }
    function foundCount() { return S.faults.filter(function (f) { return f.found; }).length; }
    function draw() {
      var marks = {}, tags = {};
      S.faults.forEach(function (f) {
        if ((!f.found && !S.reveal) || (S.phase === 'fix' && S.over && !S.reveal)) return;
        f.rows.forEach(function (r) { marks['row:' + r] = f.found ? 'found' : 'missed'; tags[r] = (tags[r] || '') + ' <span class="fault-tag">' + SHORT[f.kind] + '</span>'; });
      });
      if (S.chosen != null) marks['row:' + S.chosen] = (marks['row:' + S.chosen] || '') + ' chosen';
      lead.innerHTML = (attempt > 1 || opts.rounds.length > 1 ? '<span class="round">Plan ' + attempt + '</span>' : '') +
        '<span class="score">Faults found: <b>' + foundCount() + '</b> of ' + S.faults.length + '. Misses: <b>' + S.misses + '</b> of ' + MISSES + ' allowed.</span><br>' +
        (S.phase === 'find' ? 'Project: <b>' + esc(S.p.name) + '</b>. Find every fault. Click a task, then say what is wrong with it.' :
          'Now fix the plan: change Who and Deadline so nothing is wrong. Then press <b>Check the plan</b>.');
      brief.innerHTML = briefLines(S.brief, S.people).join(' ');
      board.innerHTML = planTable(S.tasks, S.plan, { clickRows: S.phase === 'find' && !S.over, marks: marks, tags: tags, removed: S.removed, edit: S.phase === 'fix' && !S.over, people: S.people, lastDay: PP.deadlineOf(S.brief) + 1 });
      bar.innerHTML = '';
      if (S.phase === 'find' && !S.over && S.faults.some(function (f) { return f.kind === 'missing'; })) {
        var miss = el('button', { type: 'button', class: 'btn secondary' }, '<span>A stage has no task</span>');
        miss.addEventListener('click', function () { S.chosen = null; draw(); showMenu('missing'); });
        bar.appendChild(miss);
      }
      if (S.phase === 'fix' && !S.over) {
        var check = el('button', { type: 'button', class: 'btn' }, PP.ICON.check + '<span>Check the plan</span>');
        check.addEventListener('click', checkFix);
        bar.appendChild(check);
        bar.appendChild(el('span', { class: 'small' }, 'Checks left: ' + (2 - S.checks)));
      }
      PP.reportHeight();
    }
    onRow(board, function (id) { if (S.phase !== 'find' || S.over) return; S.chosen = id; draw(); showMenu('row'); });
    board.addEventListener('change', function (e) {
      var s = e.target.closest('[data-edit]');
      if (!s) return;
      var id = +s.getAttribute('data-id');
      if (s.getAttribute('data-edit') === 'who') S.plan[id].who = s.value || null;
      else S.plan[id].day = s.value === '' ? null : +s.value;
    });
    function showMenu(type) {
      menu.innerHTML = '';
      var n = type === 'row' ? S.tasks.filter(function (t) { return !S.removed[t.id]; }).map(function (t) { return t.id; }).indexOf(S.chosen) + 1 : 0;
      menu.appendChild(el('p', { class: 'menu-q' }, type === 'row' ? 'What is wrong with task ' + n + '?' : 'Which stage has no task?'));
      var box = el('div', { class: 'choices' });
      var options = type === 'row' ? opts.menu.map(function (k) { return [k, PP.KIND[k]]; }) : PP.STAGES.map(function (s, i) { return [i, s]; });
      options.forEach(function (o) {
        var b = el('button', { type: 'button', class: 'choice' }, o[1]);
        b.addEventListener('click', function () { answer(type, o[0]); });
        box.appendChild(b);
      });
      var cancel = el('button', { type: 'button', class: 'choice ghost' }, 'Cancel');
      cancel.addEventListener('click', function () { menu.innerHTML = ''; S.chosen = null; draw(); });
      box.appendChild(cancel);
      menu.appendChild(box);
      PP.reportHeight();
    }
    function answer(type, value) {
      menu.innerHTML = '';
      var f = type === 'row' ? S.faults.filter(function (x) { return !x.found && x.kind === value && x.rows.indexOf(S.chosen) >= 0; })[0]
        : S.faults.filter(function (x) { return !x.found && x.kind === 'missing' && x.stage === value; })[0];
      var already = type === 'row' && S.faults.some(function (x) { return x.found && x.kind === value && x.rows.indexOf(S.chosen) >= 0; });
      S.chosen = null;
      if (already) { draw(); PP.say(fb, 'You found that one already.', 'hint'); return; }
      if (f) {
        f.found = true; draw();
        PP.say(fb, '<b>Found.</b> ' + (f.kind === 'missing' ? 'There is no ' + PP.STAGES[f.stage] + ' task.' : f.text), '');
      } else {
        S.misses++; draw();
        PP.say(fb, '<b>Miss.</b> ' + (type === 'row' ? 'That is not what is wrong with that task.' : 'That stage has a task.'), 'bad');
      }
      if (S.misses > MISSES) return lose();
      if (foundCount() === S.faults.length) return allFound();
    }
    function lose() {
      S.over = true; S.reveal = true; draw();
      log.add('plan ' + attempt + ', ' + foundCount() + ' of ' + S.faults.length + ' faults found, then more than ' + MISSES + ' misses', false);
      PP.say(fb, '<b>More than ' + MISSES + ' misses.</b> The faults you did not find are marked. Try another plan.' +
        (S.faults.some(function (f) { return f.kind === 'missing' && !f.found; }) ? ' The missing stage: ' + PP.STAGES[S.faults.filter(function (f) { return f.kind === 'missing'; })[0].stage] + '.' : ''), 'bad');
      again('Try another plan');
    }
    function allFound() {
      if (opts.fixAfter) {
        S.phase = 'fix'; draw();
        PP.say(fb, '<b>All ' + S.faults.length + ' found.</b> Now fix them. Change as little as you can.', '');
        return;
      }
      win();
    }
    function checkFix() {
      S.checks++;
      var probs = PP.problems(S.tasks, S.plan, S.brief);
      if (!probs.length) return win();
      var marks = {};
      probs.forEach(function (p) { marks['row:' + p.task] = 'missed'; if (p.other != null && p.kind === 'clash') marks['row:' + p.other] = 'missed'; });
      var num = function (id) { return S.tasks.map(function (t) { return t.id; }).indexOf(id) + 1; };
      var text = probs.slice(0, 3).map(function (p) { return 'Task ' + num(p.task) + ': ' + p.text; }).join('<br>') + (probs.length > 3 ? '<br>And ' + (probs.length - 3) + ' more.' : '');
      if (S.checks < 2) { draw(); board.innerHTML = planTable(S.tasks, S.plan, { edit: true, people: S.people, marks: marks, lastDay: PP.deadlineOf(S.brief) + 1 }); PP.say(fb, '<b>Not yet.</b><br>' + text, 'bad'); return; }
      S.over = true;
      log.add('plan ' + attempt + ', every fault found (' + S.misses + ' misses), but the fixed plan was still wrong after 2 checks', false);
      S.plan = PP.solve(S.tasks, S.people, S.brief);
      draw();
      PP.say(fb, '<b>Still wrong:</b><br>' + text + '<br>Here is one plan that works. Try another plan.', 'bad');
      again('Try another plan');
    }
    function win() {
      wins++; S.over = true; draw();
      roundIx++;
      log.add('plan ' + attempt + ', every fault found (' + S.misses + ' misses)' + (opts.fixAfter ? ' and fixed in ' + S.checks + ' of 2 checks' : ''), true);
      if (wins >= opts.need) log.finish();
      if (wins >= opts.need) {
        PP.say(fb, opts.phaseDone || '<b>Every fault found.</b>', '');
        bar.innerHTML = PP.doneBanner(opts.done);
        if (opts.more) {
          var more = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + opts.more + '</span>' + PP.ICON.next);
          more.addEventListener('click', start);
          bar.appendChild(more);
        }
        PP.reportHeight();
        return;
      }
      PP.say(fb, '<b>Every fault found.</b> Next plan: it has more.', '');
      again('Next plan');
    }
    function again(text) {
      bar.innerHTML = '';
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + text + '</span>' + PP.ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      PP.reportHeight();
    }
    start();
  }

  PP.activities.gaps = function (host) {
    faultFinder(host, { need: 2, label: 'find what is missing from a plan', menu: ['noWho', 'noDay', 'needs', 'clash'],
      rounds: [{ size: 5, kinds: ['noWho', 'noDay'], missing: true }, { size: 6, kinds: ['noWho', 'noDay', 'needs'], missing: true }],
      done: 'Done: you found every fault in two plans.' });
  };
  PP.activities.fix = function (host) {
    faultFinder(host, { need: 1, label: 'find and fix every fault in a plan', fixAfter: true, menu: ['noWho', 'noDay', 'needs', 'clash', 'away', 'room', 'late'],
      // Deadline next Monday: one day spare, so a plan with the room shut or someone away can still be fixed.
      rounds: [{ size: 6, deadline: 5, kinds: ['needs', 'clash', 'away', 'late'] }, { size: 6, deadline: 5, kinds: ['needs', 'clash', 'away', 'room', 'late'] }],
      phaseDone: '<b>The plan works.</b> Everyone is free, every task is after what it needs, and it is ready in time.',
      done: 'Done: you found and fixed every fault.', more: 'A harder plan' });
  };

  // ======================================================================== the plan as a timeline
  // Rows are people, columns are days. opts: days (how many columns), chips {id: html class}, place (cells are
  // drop places), click (chips are buttons with data-chip), away, shut, deadline.
  function timeline(tasks, plan, people, brief, opts) {
    var nDays = opts.days, dl = PP.deadlineOf(brief);
    var head = '<div class="tl-row tl-head" style="--days:' + nDays + '"><span class="tl-name"></span>' + Array.from({ length: nDays }, function (_, d) {
      var shut = brief.shut && brief.shut.indexOf(d) >= 0;
      return '<span class="tl-day' + (d === dl ? ' deadline' : '') + (d > dl ? ' after' : '') + '">' + PP.DAY_SHORT[d] + (shut ? '<em class="shut">' + PP.ICON.pc + ' shut</em>' : '') + (d === dl ? '<em class="dl">deadline</em>' : '') + '</span>';
    }).join('') + '</div>';
    var rows = people.map(function (who) {
      return '<div class="tl-row" style="--days:' + nDays + '"><span class="tl-name">' + esc(who) + '</span>' + Array.from({ length: nDays }, function (_, d) {
        var away = brief.away && brief.away[who] && brief.away[who].indexOf(d) >= 0;
        var ill = brief.ill && brief.ill.who === who && brief.ill.day === d;
        var here = tasks.filter(function (t) { var p = plan[t.id]; return p && p.who === who && p.day != null && d >= p.day && d < p.day + PP.len(brief, t.id); });
        var inner = here.map(function (t) {
          var p = plan[t.id], first = d === p.day;
          if (!first) return '<span class="chip cont">' + esc(t.short) + ' (day 2)</span>';
          return chipHtml(t, opts);
        }).join('');
        var cls = 'tl-cell' + (away ? ' away' : '') + (ill ? ' ill' : '') + (brief.shut && brief.shut.indexOf(d) >= 0 ? ' shut' : '') + (d > dl ? ' after' : '');
        return '<span class="' + cls + '"' + (opts.place ? ' data-place="c:' + esc(who) + ':' + d + '"' : '') + '>' + (away ? '<em class="away-tag">away</em>' : '') + (ill ? '<em class="away-tag">ill</em>' : '') +
          (opts.ghosts && opts.ghosts[who + ':' + d] ? opts.ghosts[who + ':' + d] : '') + inner + '</span>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="timeline">' + head + rows + '</div>';
  }
  function chipHtml(t, opts) {
    var cls = (opts.chips && opts.chips[t.id]) || '';
    var body = '<span class="chip-name">' + esc(t.short) + (t.pc ? ' <i class="pc">' + PP.ICON.pc + '</i>' : '') + (opts.long && opts.long[t.id] ? ' <i class="badge">2 days</i>' : '') + '</span>' +
      (opts.showNeeds ? '<span class="chip-needs">Needs: ' + PP.needsText(opts.tasks, t) + '</span>' : '');
    if (opts.place) return '<button type="button" class="chip task-chip ' + cls + '" data-item="' + t.id + '" title="' + esc(t.text) + '">' + body + '</button>';
    if (opts.click) return '<button type="button" class="chip task-chip ' + cls + '" data-chip="' + t.id + '" title="' + esc(t.text) + '">' + body + '</button>';
    return '<span class="chip task-chip ' + cls + '" title="' + esc(t.text) + '">' + body + '</span>';
  }
  function finish(brief, plan, id) { return plan[id].day + PP.len(brief, id) - 1; }

  // ======================================================================== what if
  var NEED_WHATIF = 3;
  PP.activities.whatif = function (host) {
    var lead = el('p', { class: 'task-q' }), brief = el('div', { class: 'brief' }), board = el('div', { class: 'board' }), ask = el('div', { class: 'ask' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    [lead, brief, board, ask, bar, fb].forEach(function (n) { host.appendChild(n); });
    var round = 0, right = 0, lastPi = -1, lastEvent = '', S, log = PP.results('what if: predict the tasks that will be late');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { S: S, right: right }; };

    function start() {
      round++;
      var people = team(3), base = validPlan(6, people, {}, { not: lastPi, early: true }), tasks = base.tasks, plan = base.plan;
      lastPi = base.pi;
      var deadline = PP.pick([4, 4, 5]);
      var ev, kinds = ['ill', 'ill', 'long', 'shut'].filter(function (k) { return k !== lastEvent; });
      var kind = PP.pick(kinds), b = { deadline: deadline };
      lastEvent = kind;
      if (kind === 'ill') {
        var t = PP.pick(tasks), who = plan[t.id].who, day = plan[t.id].day;
        // Sometimes the ill person has nothing on that day.
        if (Math.random() < 0.25) { var freeDays = [0, 1, 2, 3, 4].filter(function (d) { return !tasks.some(function (x) { return plan[x.id].who === who && plan[x.id].day === d; }); }); if (freeDays.length) day = PP.pick(freeDays); }
        b.ill = { who: who, day: day }; ev = '<b>' + esc(who) + ' is ill on ' + DAYS[day] + '.</b>';
      } else if (kind === 'long') {
        var l = PP.pick(tasks.filter(function (x) { return x.stage > 0; }));
        b.long = {}; b.long[l.id] = 2; ev = '<b>"' + esc(l.text) + '" takes two days, not one.</b>';
      } else {
        var sd = PP.pick([0, 1, 2, 3, 4]);
        b.shut = [sd]; ev = '<b>The computer room is shut on ' + DAYS[sd] + '.</b>';
      }
      var after = PP.rerun(tasks, plan, b), slipped = {};
      tasks.forEach(function (x) { if (finish(b, after, x.id) > plan[x.id].day) slipped[x.id] = true; });
      var onTime = tasks.every(function (x) { return finish(b, after, x.id) <= deadline; });
      S = { tasks: tasks, plan: plan, people: people, b: b, after: after, slipped: slipped, onTime: onTime, pick: {}, yes: null, done: false, ev: ev, p: base.p };
      lead.innerHTML = PP.scoreLine(round, right, NEED_WHATIF) + '<br>Project: <b>' + esc(base.p.name) + '</b>. Deadline: <b>' + DAYS[deadline] + '</b>. A task starts once what it needs is finished and its person is free. Then: ' + ev;
      brief.innerHTML = '';
      PP.say(fb, '', '');
      draw();
    }
    function cols() {
      var max = 4;
      if (S.done) S.tasks.forEach(function (x) { max = Math.max(max, finish(S.b, S.after, x.id)); });
      return Math.max(max, PP.deadlineOf(S.b)) + 1;
    }
    function draw() {
      var chips = {}, ghosts = {};
      S.tasks.forEach(function (t) {
        if (!S.done) { if (S.pick[t.id]) chips[t.id] = 'picked-late'; return; }
        var said = !!S.pick[t.id], is = !!S.slipped[t.id];
        chips[t.id] = (is ? 'late ' : '') + (said === is ? 'good' : 'bad');
        if (is) { var old = S.plan[t.id]; ghosts[old.who + ':' + old.day] = (ghosts[old.who + ':' + old.day] || '') + '<span class="chip ghost-chip">' + esc(t.short) + ' was here</span>'; }
      });
      var show = S.done ? S.after : S.plan, bb = S.done ? S.b : { deadline: S.b.deadline };
      if (!S.done && S.b.ill) bb.ill = S.b.ill;
      if (!S.done && S.b.shut) bb.shut = S.b.shut;
      board.innerHTML = timeline(S.tasks, show, S.people, bb, { days: cols(), chips: chips, click: !S.done, ghosts: S.done ? ghosts : null, long: S.done ? S.b.long : null, tasks: S.tasks });
      ask.innerHTML = '';
      if (!S.done) {
        ask.appendChild(el('span', { class: 'menu-q' }, 'Click every task that will now finish <b>later</b> (or none). Ready by ' + DAYS[S.b.deadline] + '? '));
        var seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Ready by the deadline?' });
        [['yes', 'Yes, ready in time'], ['no', 'No, it will be late']].forEach(function (o) {
          var b = el('button', { type: 'button', 'aria-pressed': String(S.yes === o[0]) }, o[1]);
          b.addEventListener('click', function () { S.yes = o[0]; draw(); });
          seg.appendChild(b);
        });
        ask.appendChild(seg);
      }
      bar.innerHTML = '';
      if (!S.done) {
        var run = el('button', { type: 'button', class: 'btn' }, PP.ICON.play + '<span>Run it</span>');
        run.disabled = !S.yes;
        run.addEventListener('click', go);
        ask.appendChild(run);
      }
      PP.reportHeight();
    }
    board.addEventListener('click', function (e) {
      var c = e.target.closest('[data-chip]');
      if (!c || S.done) return;
      var id = +c.getAttribute('data-chip');
      if (S.pick[id]) delete S.pick[id]; else S.pick[id] = true;
      draw();
    });
    function go() {
      S.done = true;
      var setRight = S.tasks.every(function (t) { return !!S.pick[t.id] === !!S.slipped[t.id]; });
      var ynRight = (S.yes === 'yes') === S.onTime;
      var win = setRight && ynRight;
      if (win) right++;
      log.add(PP.plain(S.ev) + ' (' + (setRight ? 'late tasks right' : 'late tasks wrong') + ', ' + (ynRight ? 'deadline right' : 'deadline wrong') + ')', win);
      if (right >= NEED_WHATIF) log.finish();
      draw();
      var names = S.tasks.filter(function (t) { return S.slipped[t.id]; }).map(function (t) { return '"' + esc(t.short) + '"'; });
      var why = names.length ? 'Later now: ' + names.join(', ') + '. A task that waits makes every task that needs it wait too.' : 'Nothing finishes later: the change did not touch any task.';
      PP.say(fb, (win ? '<b>Right.</b> ' : '<b>Not quite.</b> ' + (setRight ? '' : 'Green chips you got right, red chips you got wrong. ') + (ynRight ? '' : 'The project ' + (S.onTime ? 'is still ready' : 'is not ready') + ' by ' + DAYS[S.b.deadline] + '. ')) + why, win ? '' : 'bad');
      lead.querySelector('.score').innerHTML = 'Right so far: <b>' + right + '</b> of ' + NEED_WHATIF + ' needed';
      if (right >= NEED_WHATIF) { bar.innerHTML = PP.doneBanner('Done: ' + right + ' changes predicted right.'); PP.reportHeight(); return; }
      var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next change</span>' + PP.ICON.next);
      next.addEventListener('click', start);
      bar.innerHTML = ''; bar.appendChild(next);
      PP.reportHeight();
    }
    start();
  };

  // ======================================================================== build a plan from a brief
  // Round 1: six tasks, deadline next Monday. Round 2: seven tasks, deadline next Tuesday, more limits. Every brief
  // has a plan that works, and none where each task has a day of its own: two people must work on the same day.
  var BRIEFS = [{ size: 6, deadline: 5, away: 1, shut: 1 }, { size: 7, deadline: 6, away: 2, shut: 2 }];
  PP.activities.build = function (host) {
    var lead = el('p', { class: 'task-q' }), brief = el('div', { class: 'brief' }), board = el('div', { class: 'board' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    [lead, brief, board, bar, fb].forEach(function (n) { host.appendChild(n); });
    var wins = 0, attempt = 0, lastPi = -1, S, log = PP.results('plan a project from a brief');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { S: S, wins: wins }; };
    var NEED_BUILD = 2;

    function makeBrief(R) {
      for (var i = 0; i < 400; i++) {
        var pi = newProject(lastPi), tasks = PP.tasksOf(PP.PROJECTS[pi], R.size), people = team(3), b = { deadline: R.deadline, away: {}, shut: [] };
        PP.shuffle(people).slice(0, R.away).forEach(function (who) { var d = PP.rand(R.deadline + 1); b.away[who] = PP.rand(2) ? [d] : [d, Math.min(R.deadline, d + 1)].filter(function (x, k, all) { return all.indexOf(x) === k; }); });
        b.shut = PP.shuffle([1, 2, 3, 4, 5].filter(function (d) { return d <= R.deadline; })).slice(0, R.shut).sort();
        if (!PP.solve(tasks, people, b)) continue;
        if (PP.solve(tasks, people, b, { distinct: true })) continue;
        return { pi: pi, p: PP.PROJECTS[pi], tasks: tasks, people: people, b: b };
      }
      throw new Error('No brief');
    }
    function start() {
      attempt++;
      var R = BRIEFS[Math.min(wins, BRIEFS.length - 1)], m = makeBrief(R);
      lastPi = m.pi;
      S = { tasks: m.tasks, p: m.p, people: m.people, b: m.b, plan: {}, checks: 0, over: false, R: R };
      m.tasks.forEach(function (t) { S.plan[t.id] = { who: null, day: null }; });
      PP.say(fb, '', '');
      draw();
    }
    function draw(chips) {
      lead.innerHTML = '<span class="round">Brief ' + attempt + '</span><span class="score">Plans that work: <b>' + wins + '</b> of ' + NEED_BUILD + ' needed</span><br>' +
        'Project: <b>' + esc(S.p.name) + '</b>. Put each task on a person and a day. A task goes after every task it needs.';
      brief.innerHTML = briefLines(S.b, S.people).join(' ');
      var free = S.tasks.filter(function (t) { return S.plan[t.id].day == null; });
      board.innerHTML = '<div class="pool wrap' + (free.length ? '' : ' empty') + '" data-place="pool" aria-label="Tasks to plan">' +
        (free.length ? free.map(function (t) { return chipHtml(t, { place: !S.over, chips: chips, showNeeds: true, tasks: S.tasks }); }).join('') : '<span class="slot-empty">Drop a task here to take it off the plan.</span>') + '</div>' +
        timeline(S.tasks, S.plan, S.people, S.b, { days: S.b.deadline + 1, place: !S.over, chips: chips, tasks: S.tasks });
      bar.innerHTML = '';
      if (!S.over) {
        var check = el('button', { type: 'button', class: 'btn' }, PP.ICON.check + '<span>Check the plan</span>');
        check.disabled = free.length > 0;
        check.addEventListener('click', checkPlan);
        bar.appendChild(check);
        bar.appendChild(el('span', { class: 'small' }, 'Checks left: ' + (3 - S.checks)));
      }
      PP.reportHeight();
    }
    PP.placer(board, function (id, place, other) {
      if (S.over) return;
      id = +id;
      if (place === 'pool') { S.plan[id] = { who: null, day: null }; draw(); return; }
      var parts = place.split(':'), who = parts[1], day = +parts[2];
      var old = S.plan[id];
      S.tasks.forEach(function (t) {
        var p = S.plan[t.id];
        if (t.id !== id && p.who === who && p.day === day) S.plan[t.id] = old.day != null ? { who: old.who, day: old.day } : { who: null, day: null };
      });
      S.plan[id] = { who: who, day: day };
      draw();
      PP.say(fb, '', '');
    }, function () { return !S.over; });

    function checkPlan() {
      S.checks++;
      var probs = PP.problems(S.tasks, S.plan, S.b);
      if (!probs.length) {
        wins++; S.over = true; draw();
        log.add('brief ' + attempt + ' (' + S.tasks.length + ' tasks), a plan that works in ' + S.checks + ' of 3 checks', true);
        if (wins >= NEED_BUILD) log.finish();
        PP.say(fb, '<b>The plan works.</b> Everyone is free, and every task is after what it needs.', '');
        if (wins >= NEED_BUILD) { bar.innerHTML = PP.doneBanner('Done: ' + wins + ' plans that work.'); PP.reportHeight(); return; }
        return again('Next brief: more tasks, more limits');
      }
      var chips = {};
      probs.forEach(function (p) { chips[p.task] = 'bad'; if (p.kind === 'clash') chips[p.other] = 'bad'; });
      var text = probs.slice(0, 3).map(function (p) { return '"' + esc(S.tasks[p.task].short) + '": ' + p.text; }).join('<br>') + (probs.length > 3 ? '<br>And ' + (probs.length - 3) + ' more.' : '');
      if (S.checks < 3) { draw(chips); PP.say(fb, '<b>Not yet.</b><br>' + text, 'bad'); return; }
      S.over = true;
      log.add('brief ' + attempt + ' (' + S.tasks.length + ' tasks), still wrong after 3 checks', false);
      S.plan = PP.solve(S.tasks, S.people, S.b);
      draw();
      PP.say(fb, '<b>No checks left.</b><br>' + text + '<br>Here is one plan that works. Look at which tasks share a day.', 'bad');
      again('Try a new brief');
    }
    function again(text) {
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + text + '</span>' + PP.ICON.next);
      b.addEventListener('click', start);
      bar.innerHTML = ''; bar.appendChild(b); PP.reportHeight();
    }
    start();
  };
})();
