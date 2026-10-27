// Project Planner shared pieces: element helpers, the height report for lesson embeds, tap-or-drag placing, the
// projects and their tasks, the plan rules (what is wrong with a plan), a planner that finds a plan that works, and
// the what-if simulator. Nothing here waits for requestAnimationFrame: a lesson preloads the app in a hidden frame,
// where animation frames never fire, so every animation step is a setTimeout.
var PP = (function () {
  'use strict';

  // ---------------------------------------------------------------- elements
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>',
    pc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 5h18v11H3zM8 20h8M12 16v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M12 7v5l3 2"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17v.5"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  function later(ms, fn) { return setTimeout(fn, ms); }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(list) { return list[rand(list.length)]; }
  function shuffle(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) { var j = rand(i + 1), t = out[i]; out[i] = out[j]; out[j] = t; }
    return out;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function plain(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); }

  // The feedback line under a task: kind is '' (good), 'bad' or 'hint'.
  function say(node, text, kind) {
    node.className = 'feedback' + (kind ? ' ' + kind : '');
    node.innerHTML = text;
    reportHeight();
  }
  // A round counter: "Round 2. Right so far: 1 of 3 needed."
  function scoreLine(round, right, need) {
    return '<span class="round">Round ' + round + '</span><span class="score">Right in a row: <b>' + right + '</b> of ' + need + ' needed</span>';
  }
  function doneBanner(text) {
    return '<div class="done-banner">' + ICON.done + '<span>' + text + '</span></div>';
  }

  // ---------------------------------------------------------------- tap or drag to place
  // Items are elements with data-item; places are elements with data-place. Tap an item to pick it up, then tap a
  // place. Or drag the item onto the place. onPlace(itemId, placeId) does the move and redraws.
  function placer(root, onPlace, canPick) {
    var picked = null, drag = null, suppressClick = false;
    function setPicked(id) {
      picked = id;
      Array.prototype.forEach.call(root.querySelectorAll('[data-item]'), function (n) { n.classList.toggle('picked', n.getAttribute('data-item') === id); });
      root.classList.toggle('placing', !!id);
    }
    root.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; return; }
      var item = e.target.closest('[data-item]'), place = e.target.closest('[data-place]');
      if (item && root.contains(item) && (!canPick || canPick(item.getAttribute('data-item')))) {
        var id = item.getAttribute('data-item');
        if (picked && picked !== id && place) { var p = picked; setPicked(null); onPlace(p, place.getAttribute('data-place'), id); return; }
        setPicked(picked === id ? null : id);
        return;
      }
      if (place && picked) { var q = picked; setPicked(null); onPlace(q, place.getAttribute('data-place')); }
    });
    root.addEventListener('pointerdown', function (e) {
      var item = e.target.closest('[data-item]');
      if (!item || e.button > 0 || (canPick && !canPick(item.getAttribute('data-item')))) return;
      drag = { id: item.getAttribute('data-item'), node: item, x: e.clientX, y: e.clientY, ghost: null };
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.ghost) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
        var r = drag.node.getBoundingClientRect();
        drag.ghost = drag.node.cloneNode(true);
        drag.ghost.classList.add('drag-ghost');
        drag.ghost.style.width = r.width + 'px';
        drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
        document.body.appendChild(drag.ghost);
        drag.node.classList.add('dragging');
        setPicked(null);
      }
      drag.ghost.style.left = (e.clientX - drag.dx) + 'px';
      drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
      Array.prototype.forEach.call(root.querySelectorAll('[data-place].over'), function (n) { n.classList.remove('over'); });
      var under = document.elementFromPoint(e.clientX, e.clientY), place = under && under.closest('[data-place]');
      if (place && root.contains(place)) place.classList.add('over');
      e.preventDefault();
    }, { passive: false });
    function end(e) {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.ghost) return;
      d.ghost.remove();
      d.node.classList.remove('dragging');
      Array.prototype.forEach.call(root.querySelectorAll('[data-place].over'), function (n) { n.classList.remove('over'); });
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 50);
      if (!e || e.type === 'pointercancel') return;
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var other = under && under.closest('[data-item]');
      var place = under && under.closest('[data-place]');
      if (place && root.contains(place)) onPlace(d.id, place.getAttribute('data-place'), other && other !== d.node ? other.getAttribute('data-item') : null);
    }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return { clear: function () { setPicked(null); }, picked: function () { return picked; } };
  }

  // ---------------------------------------------------------------- the stages
  var STAGES = ['Decide', 'Design', 'Build', 'Test', 'Improve'];
  var STAGE_SAYS = ['What must it do? Write a list.', 'Draw the flowchart.', 'Make it on the computer.', 'Try it. Find the mistakes.', 'Fix the mistakes. Test again.'];

  // ---------------------------------------------------------------- people and days
  var PEOPLE = ['Ploy', 'Nat', 'Mint', 'Ben', 'Fah', 'Tom', 'Pim', 'Sam'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'next Monday', 'next Tuesday', 'next Wednesday'];
  var DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'next Mon', 'next Tue', 'next Wed'];
  var DEADLINE = 4; // Friday, unless the brief gives its own deadline (a day number)
  function deadlineOf(brief) { return brief && brief.deadline != null ? brief.deadline : DEADLINE; }

  // ---------------------------------------------------------------- projects
  // Each project has six tasks: Decide, two Design tasks that do not need each other, Build (needs both), Test,
  // Improve. `extra` is a second Build task for a harder seven-task version; `buildNeeds` is then what the main
  // Build task needs. `gives` is what a task makes, which is what a later task needs. pc: it needs a computer.
  var PROJECTS = [
    { name: 'a Catch game for Sports Day', short: 'Catch game', tasks: [
      { stage: 0, text: 'Write what the game must do', short: 'Write the list', gives: 'the list', needs: [] },
      { stage: 1, text: 'Draw the flowchart for catching', short: 'Draw the flowchart', gives: 'the flowchart', needs: [0] },
      { stage: 1, text: 'Draw the fruit and basket on paper', short: 'Draw the sprites', gives: 'the drawings', needs: [0] },
      { stage: 2, text: 'Make the game on the computer', short: 'Make the game', gives: 'the game', needs: [1, 2], pc: true },
      { stage: 3, text: 'Play the game to find mistakes', short: 'Test the game', gives: 'the test notes', needs: [3], pc: true },
      { stage: 4, text: 'Fix the mistakes, add a score', short: 'Fix the game', gives: 'the better game', needs: [4], pc: true }],
      extra: { stage: 2, text: 'Put the drawings on the computer', short: 'Add the sprites', gives: 'the sprites', needs: [2], pc: true }, buildNeeds: [1, 6] },
    { name: 'a Space Quiz for Year 5', short: 'Space Quiz', tasks: [
      { stage: 0, text: 'Write the questions it must ask', short: 'Write the questions', gives: 'the questions', needs: [] },
      { stage: 1, text: 'Draw the flowchart for one question', short: 'Draw the flowchart', gives: 'the flowchart', needs: [0] },
      { stage: 1, text: 'Plan the score screen on paper', short: 'Plan the screen', gives: 'the screen plan', needs: [0] },
      { stage: 2, text: 'Make the quiz on the computer', short: 'Make the quiz', gives: 'the quiz', needs: [1, 2], pc: true },
      { stage: 3, text: 'Ask Year 5 to try the quiz', short: 'Test the quiz', gives: 'the test notes', needs: [3], pc: true },
      { stage: 4, text: 'Fix the questions that went wrong', short: 'Fix the quiz', gives: 'the better quiz', needs: [4], pc: true }],
      extra: { stage: 2, text: 'Type the questions into the computer', short: 'Type the questions', gives: 'the typed questions', needs: [0], pc: true }, buildNeeds: [1, 2, 6] },
    { name: 'a Maze game for the school fair', short: 'Maze game', tasks: [
      { stage: 0, text: 'List what the maze must do', short: 'Write the list', gives: 'the list', needs: [] },
      { stage: 1, text: 'Draw the flowchart for the arrow keys', short: 'Draw the flowchart', gives: 'the flowchart', needs: [0] },
      { stage: 1, text: 'Sketch the maze levels on paper', short: 'Sketch the levels', gives: 'the sketches', needs: [0] },
      { stage: 2, text: 'Make the maze and the sprite', short: 'Make the maze', gives: 'the game', needs: [1, 2], pc: true },
      { stage: 3, text: 'Play every level to find mistakes', short: 'Test the maze', gives: 'the test notes', needs: [3], pc: true },
      { stage: 4, text: 'Fix the walls, make it harder', short: 'Fix the maze', gives: 'the better game', needs: [4], pc: true }],
      extra: { stage: 2, text: 'Draw the levels on the computer', short: 'Draw the levels', gives: 'the levels', needs: [2], pc: true }, buildNeeds: [1, 6] },
    { name: 'a Times Table app for Year 3', short: 'Times Table app', tasks: [
      { stage: 0, text: 'Write what the app must check', short: 'Write the list', gives: 'the list', needs: [] },
      { stage: 1, text: 'Draw the flowchart for one answer', short: 'Draw the flowchart', gives: 'the flowchart', needs: [0] },
      { stage: 1, text: 'Plan the buttons on paper', short: 'Plan the buttons', gives: 'the button plan', needs: [0] },
      { stage: 2, text: 'Make the app on the computer', short: 'Make the app', gives: 'the app', needs: [1, 2], pc: true },
      { stage: 3, text: 'Try right and wrong answers', short: 'Test the app', gives: 'the test notes', needs: [3], pc: true },
      { stage: 4, text: 'Fix what went wrong, add sounds', short: 'Fix the app', gives: 'the better app', needs: [4], pc: true }],
      extra: { stage: 2, text: 'Record the sounds for right and wrong', short: 'Record the sounds', gives: 'the sounds', needs: [0], pc: true }, buildNeeds: [1, 2, 6] },
    { name: 'a Birthday Card animation', short: 'Birthday Card', tasks: [
      { stage: 0, text: 'Write what the card must show', short: 'Write the list', gives: 'the list', needs: [] },
      { stage: 1, text: 'Draw the flowchart for the animation', short: 'Draw the flowchart', gives: 'the flowchart', needs: [0] },
      { stage: 1, text: 'Draw the pictures on paper', short: 'Draw the pictures', gives: 'the pictures', needs: [0] },
      { stage: 2, text: 'Make the card on the computer', short: 'Make the card', gives: 'the card', needs: [1, 2], pc: true },
      { stage: 3, text: 'Watch it run, check every part', short: 'Test the card', gives: 'the test notes', needs: [3], pc: true },
      { stage: 4, text: 'Fix the mistakes, add music', short: 'Fix the card', gives: 'the better card', needs: [4], pc: true }],
      extra: { stage: 2, text: 'Choose the music on the computer', short: 'Choose the music', gives: 'the music', needs: [0], pc: true }, buildNeeds: [1, 2, 6] }
  ];
  // The tasks of a project as a fresh list, with ids 0..n-1: six tasks, seven with the extra Build task, or five
  // (one Design task) for the simplest plans.
  function tasksOf(p, size) {
    var list = p.tasks.map(function (t) { return Object.assign({}, t, { needs: t.needs.slice() }); });
    if (size === 7) {
      list.push(Object.assign({}, p.extra, { needs: p.extra.needs.slice() }));
      list[3].needs = p.buildNeeds.slice();
      // Keep the list in stage order: the extra Build task goes just before the main one.
      var order = [0, 1, 2, 6, 3, 4, 5];
      var map = {}; order.forEach(function (old, i) { map[old] = i; });
      list = order.map(function (old) { var t = list[old]; t.needs = t.needs.map(function (n) { return map[n]; }); return t; });
    } else if (size === 5) {
      list.splice(2, 1);
      list.forEach(function (t) { t.needs = t.needs.filter(function (n) { return n !== 2; }).map(function (n) { return n > 2 ? n - 1 : n; }); });
      list[2].needs = [1];
    }
    list.forEach(function (t, i) { t.id = i; });
    return list;
  }
  // What a task needs, in words: "the flowchart and the drawings".
  function needsText(tasks, t) {
    var things = t.needs.map(function (n) { return tasks[n].gives; });
    if (!things.length) return 'nothing';
    return things.length === 1 ? things[0] : things.slice(0, -1).join(', ') + ' and ' + things[things.length - 1];
  }
  // Every order of the tasks is fine as long as each task comes after every task it needs.
  function orderProblem(tasks, order) {
    var done = {};
    for (var i = 0; i < order.length; i++) {
      var t = tasks[order[i]];
      for (var k = 0; k < t.needs.length; k++) if (!done[t.needs[k]]) return { at: i, task: t, need: tasks[t.needs[k]] };
      done[t.id] = true;
    }
    return null;
  }

  // ---------------------------------------------------------------- plans
  // A plan gives every task a person (who) and a day (0 Monday .. 4 Friday, 5 and on are after the deadline).
  // A brief can say a person is away on some days (away: {name: [days]}) and the computer room is shut on some
  // days (shut: [days]). Each task takes one day; long: {taskId: 2} makes a task take two days (the what-if).
  var KIND = {
    noWho: 'Nobody is down to do it',
    noDay: 'It has no deadline',
    needs: 'It is due before what it needs is ready',
    clash: 'One person has two tasks on one day',
    away: 'The person is away that day',
    room: 'It needs a computer on a day the room is shut',
    late: 'It is due after the project deadline'
  };
  function len(brief, id) { return (brief.long && brief.long[id]) || 1; }
  function daysOf(brief, id, day) { var out = []; for (var d = 0; d < len(brief, id); d++) out.push(day + d); return out; }
  // Everything wrong with a plan: [{kind, task, other?, text}]. A clash lists both tasks (task and other).
  function problems(tasks, plan, brief) {
    var out = [];
    tasks.forEach(function (t) {
      var p = plan[t.id] || {};
      if (!p.who) out.push({ kind: 'noWho', task: t.id, text: 'Nobody is down to do it.' });
      if (p.day == null) { out.push({ kind: 'noDay', task: t.id, text: 'It has no day.' }); return; }
      t.needs.forEach(function (n) {
        var q = plan[n] || {};
        var ready = q.day == null ? null : q.day + len(brief, n) - 1;
        if (ready == null || ready >= p.day) out.push({ kind: 'needs', task: t.id, other: n,
          text: 'It needs ' + tasks[n].gives + ', and that is not ready until ' + (ready == null ? 'it has a day' : 'the end of ' + DAYS[ready]) + '.' });
      });
      var mine = daysOf(brief, t.id, p.day);
      if (p.who && brief.away && brief.away[p.who] && mine.some(function (d) { return brief.away[p.who].indexOf(d) >= 0; }))
        out.push({ kind: 'away', task: t.id, text: p.who + ' is away that day.' });
      if (t.pc && brief.shut && mine.some(function (d) { return brief.shut.indexOf(d) >= 0; }))
        out.push({ kind: 'room', task: t.id, text: 'It needs a computer, and the computer room is shut that day.' });
      if (p.day + len(brief, t.id) - 1 > deadlineOf(brief)) out.push({ kind: 'late', task: t.id, text: 'It finishes after ' + DAYS[deadlineOf(brief)] + ', the project deadline.' });
    });
    for (var a = 0; a < tasks.length; a++) for (var b = a + 1; b < tasks.length; b++) {
      var pa = plan[a] || {}, pb = plan[b] || {};
      if (!pa.who || pa.who !== pb.who || pa.day == null || pb.day == null) continue;
      var da = daysOf(brief, a, pa.day), db = daysOf(brief, b, pb.day);
      if (da.some(function (d) { return db.indexOf(d) >= 0; })) out.push({ kind: 'clash', task: a, other: b, text: pa.who + ' has two tasks on ' + DAYS[pa.day > pb.day ? pa.day : pb.day] + '.' });
    }
    return out;
  }
  // A plan that works, found by trying days and people in a random order (null when there is none).
  function solve(tasks, team, brief, opts) {
    opts = opts || {};
    var plan = {}, lastDay = opts.lastDay == null ? deadlineOf(brief) : opts.lastDay;
    function ok(t, who, day) {
      for (var k = 0; k < t.needs.length; k++) { var q = plan[t.needs[k]]; if (!q || q.day + len(brief, t.needs[k]) - 1 >= day) return false; }
      var mine = daysOf(brief, t.id, day);
      if (mine[mine.length - 1] > lastDay) return false;
      if (brief.away && brief.away[who] && mine.some(function (d) { return brief.away[who].indexOf(d) >= 0; })) return false;
      if (t.pc && brief.shut && mine.some(function (d) { return brief.shut.indexOf(d) >= 0; })) return false;
      for (var id in plan) {
        if (opts.distinct && plan[id].day === day) return false;
        if (plan[id].who !== who) continue;
        var theirs = daysOf(brief, +id, plan[id].day);
        if (theirs.some(function (d) { return mine.indexOf(d) >= 0; })) return false;
      }
      return true;
    }
    function go(i) {
      if (i === tasks.length) return true;
      var t = tasks[i], days = [0, 1, 2, 3, 4, 5, 6, 7].filter(function (d) { return d <= lastDay; });
      if (opts.early) days.sort(function (a, b) { return a - b; }); else days = shuffle(days);
      var people = shuffle(team);
      for (var a = 0; a < days.length; a++) for (var b = 0; b < people.length; b++) {
        if (!ok(t, people[b], days[a])) continue;
        plan[t.id] = { who: people[b], day: days[a] };
        if (go(i + 1)) return true;
        delete plan[t.id];
      }
      return false;
    }
    return go(0) ? plan : null;
  }

  // ---------------------------------------------------------------- what if
  // Run a plan again after something changes (brief.ill, brief.shut, brief.long). Tasks go in the order of their
  // planned days; each starts on its planned day or later: once everything it needs is ready, its person is free and
  // not ill, and (for a computer task) the room is open. Returns the new plan.
  function rerun(tasks, plan, brief) {
    var order = tasks.slice().sort(function (a, b) { return plan[a.id].day - plan[b.id].day || a.id - b.id; });
    var out = {}, busy = {};
    order.forEach(function (t) {
      var p = plan[t.id], day = p.day;
      t.needs.forEach(function (n) { if (out[n]) day = Math.max(day, out[n].day + len(brief, n)); });
      for (;; day++) {
        var mine = daysOf(brief, t.id, day);
        var blocked = mine.some(function (d) {
          return busy[p.who + ':' + d] || (brief.ill && brief.ill.who === p.who && brief.ill.day === d) || (t.pc && brief.shut && brief.shut.indexOf(d) >= 0);
        });
        if (!blocked) break;
      }
      daysOf(brief, t.id, day).forEach(function (d) { busy[p.who + ':' + d] = true; });
      out[t.id] = { who: p.who, day: day };
    });
    return out;
  }

  // ---------------------------------------------------------------- results for the teacher
  // Each activity keeps a log of its rounds and posts it to the site after every round as BC_APP_RESULT (the lesson
  // slide saves it as that slide's answer: js/steps/embeds.html in the shell). Once finished on this computer it
  // stays finished, even when the slide is opened again and the activity started over.
  var ACTIVITY = new URLSearchParams(location.search).get('activity') || '';
  function results(label) {
    var lines = [], right = 0, done = false, key = 'bc-pp-done-v1:' + ACTIVITY;
    var before = false;
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !ACTIVITY) return;
      var head = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' right in ' + lines.length + ' tries.';
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'planner-' + ACTIVITY, label: 'Project Planner: ' + label,
          summary: head + (lines.length ? ' ' + lines.join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; lines.push((lines.length + 1) + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.'); post(); },
      finish: function () { done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); }
    };
  }

  return { el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, later: later, rand: rand, pick: pick, shuffle: shuffle, cap: cap,
    say: say, scoreLine: scoreLine, results: results, plain: plain, doneBanner: doneBanner, placer: placer,
    STAGES: STAGES, STAGE_SAYS: STAGE_SAYS, PEOPLE: PEOPLE, DAYS: DAYS, DAY_SHORT: DAY_SHORT, DEADLINE: DEADLINE,
    PROJECTS: PROJECTS, tasksOf: tasksOf, needsText: needsText, orderProblem: orderProblem,
    KIND: KIND, problems: problems, deadlineOf: deadlineOf, solve: solve, rerun: rerun, len: len, activities: {} };
})();
