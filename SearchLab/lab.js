// Search Lab (Year 9, 2.4 Binary Search). Two activities, each in levels; a level is passed with clean rounds in a
// row, and any mistake means that round does not count (the right move and its reason are shown, and the round
// carries on so the method is seen to the end). Every round posts BC_APP_RESULT, which the lesson slide saves as its
// answer. Nothing waits for requestAnimationFrame: a lesson preloads the app in a hidden frame.
//   middle  binary search one check at a time. Click the item binary search checks (the middle of what is left:
//           Middle = (Low + High) / 2, rounded down), then say what happens next: found it, keep the left part or
//           keep the right part. The values stay hidden until an item is checked.
//   race    the same list, linear search and binary search. Predict how many comparisons each one makes, then run
//           both: every item each search checks is numbered. Level 3 mixes in lists that are not in order.
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var ACTIVITY = params.get('activity') || '';
  var host = document.getElementById('activity');

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  var ICON = {
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17v.5"/></svg>'
  };
  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);
  function say(node, text, kind) { node.className = 'feedback' + (kind ? ' ' + kind : ''); node.innerHTML = text; reportHeight(); }
  function doneBanner(text) { return '<div class="done-banner">' + ICON.done + '<span>' + text + '</span></div>'; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  // Results for the teacher, posted after every round. Once finished on this computer it stays finished.
  function results(label, qid) {
    var lines = [], right = 0, done = false, key = 'bc-sl-done-v1:' + qid, before = false;
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !ACTIVITY) return;
      var head = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' clean rounds in ' + lines.length + ' tries.';
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: qid, label: 'Search Lab: ' + label,
          summary: head + (lines.length ? ' ' + lines.join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; lines.push((lines.length + 1) + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); if (lines.length > 30) lines.shift(); post(); },
      finish: function () { done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); }
    };
  }

  // n different numbers from 2 to 99, smallest first.
  function sortedList(n) {
    var pool = [], i;
    for (i = 2; i <= 99; i++) pool.push(i);
    for (i = pool.length - 1; i > 0; i--) { var j = rnd(0, i), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, n).sort(function (a, b) { return a - b; });
  }
  // A target that is in the list (at a random index), or a value between two items that is not in it.
  function pickTarget(list, missing) {
    if (!missing) return list[rnd(0, list.length - 1)];
    var gaps = [];
    for (var i = 0; i + 1 < list.length; i++) for (var v = list[i] + 1; v < list[i + 1]; v++) gaps.push(v);
    return gaps.length ? gaps[rnd(0, gaps.length - 1)] : list[list.length - 1] + 1;
  }
  // Binary search exactly as taught: the indexes it checks, in order, and where it found the target (0: not found).
  function binarySteps(list, target) {
    var low = 1, high = list.length, out = [];
    while (low <= high) {
      var mid = Math.floor((low + high) / 2);
      out.push({ low: low, high: high, mid: mid, value: list[mid - 1] });
      if (list[mid - 1] === target) return { steps: out, at: mid };
      if (target < list[mid - 1]) high = mid - 1; else low = mid + 1;
    }
    return { steps: out, at: 0 };
  }
  function linearCount(list, target) { var i = list.indexOf(target); return i === -1 ? list.length : i + 1; }
  function midWork(low, high) {
    var s = low + high, m = Math.floor(s / 2);
    return 'Middle = (' + low + ' + ' + high + ') / 2 = ' + (s % 2 ? (s / 2) + ', rounded down: ' + m : m);
  }

  // Draw a list. view(i) gives { cls, tag, order, hidden } for index i (1-based).
  function drawList(node, list, view) {
    node.style.gridTemplateColumns = 'repeat(' + list.length + ', minmax(0, 1fr))';
    node.innerHTML = list.map(function (v, k) {
      var i = k + 1, s = view(i) || {};
      return '<button type="button" class="item ' + (s.cls || '') + (s.hidden ? ' hidden' : '') + '" data-i="' + i + '"' + (s.can ? '' : ' tabindex="-1"') +
        ' aria-label="Index ' + i + (s.hidden ? ', not checked yet' : ', value ' + v) + '">' +
        '<span class="ix">' + i + '</span><span class="val">' + (s.hidden ? '?' : v) + '</span><span class="' + (s.order != null ? 'order' : 'tag') + '">' + (s.order != null ? s.order : (s.tag || '')) + '</span></button>';
    }).join('');
  }
  function helpButton(text) {
    var btn = el('button', { type: 'button', class: 'btn ghost small-btn', 'aria-pressed': 'false' }, ICON.help + '<span>Help</span>');
    var box = el('div', { class: 'help-box' });
    box.hidden = true;
    btn.addEventListener('click', function () {
      var on = box.hidden;
      box.hidden = !on; btn.setAttribute('aria-pressed', String(on));
      box.innerHTML = typeof text === 'function' ? text() : text;
      reportHeight();
    });
    return { btn: btn, box: box, hide: function () { box.hidden = true; btn.setAttribute('aria-pressed', 'false'); } };
  }
  function levelRange(max) {
    var first = Math.min(max, Math.max(1, parseInt(params.get('level'), 10) || 1));
    var last = Math.min(max, Math.max(first, parseInt(params.get('upto'), 10) || max));
    return [first, last];
  }

  var activities = {};

  // ================================================================ middle: binary search, one check at a time
  var MID_LEVELS = [
    { n: 8, marks: true, formula: 'filled', missing: 0, help: true, need: 2, about: 'Low and High are marked. Work out the middle.' },
    { n: 12, marks: true, formula: 'rule', missing: 0, help: true, need: 2, about: 'A longer list.' },
    { n: 16, marks: true, formula: '', missing: 0.4, help: true, need: 2, about: 'The target may not be in the list.' },
    { n: 25, marks: false, formula: '', missing: 0.4, help: false, need: 2, about: 'No Low and High marks, no help.' }
  ];
  activities.middle = function () {
    var range = levelRange(MID_LEVELS.length), level = range[0], last = range[1];
    var log = results('binary search, levels ' + range[0] + ' to ' + range[1], 'search-middle-' + range[0] + '-' + range[1]);
    var lead = el('p', { class: 'task-q' }), help = helpButton(function () {
      return '<ol><li>Look only at the items that are left. Low is the first index left, High is the last.</li>' +
        '<li>Middle = (Low + High) / 2. If it is not a whole number, round down.</li>' +
        '<li>Check the middle item. Is it the target? Is the target smaller or bigger?</li>' +
        '<li>Smaller: keep the left part. Bigger: keep the right part. The middle item goes too.</li></ol>';
    });
    var head = el('div', { class: 'head-row' }), brief = el('div', { class: 'brief' }), tgt = el('div'), listNode = el('div', { class: 'list' });
    var work = el('p', { class: 'work' }), ask = el('div', { class: 'ask' }), bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, brief, tgt, listNode, work, ask, bar, fb].forEach(function (n) { host.appendChild(n); });
    var cfg, list, target, low, high, mid, phase, spoiled, checks, shown, streak = 0, trail;
    window.__searchLab = function () { return { level: level, list: list, target: target, low: low, high: high, phase: phase, spoiled: spoiled, streak: streak }; };

    function start() {
      cfg = MID_LEVELS[level - 1];
      list = sortedList(cfg.n);
      target = pickTarget(list, Math.random() < cfg.missing);
      low = 1; high = list.length; mid = 0; phase = 'pick'; spoiled = false; checks = 0; shown = {}; trail = [];
      help.btn.hidden = !cfg.help; help.hide();
      lead.innerHTML = '<span class="round">Level ' + level + ' of ' + last + '</span><span class="score">Clean rounds in a row: <b>' + streak + '</b> of ' + cfg.need + '</span>';
      brief.innerHTML = cfg.about + ' The list is in order, smallest first. The values are hidden until you check them.';
      tgt.innerHTML = '<span class="target">Find the target <b>' + target + '</b></span>';
      bar.innerHTML = ''; say(fb, '', '');
      step();
    }
    function view(i) {
      var s = { hidden: !shown[i] };
      if (i < low || i > high) s.cls = 'out';
      if (phase === 'pick' && i >= low && i <= high) { s.can = true; s.cls = 'can'; }
      if (shown[i] === 'found') s.cls = 'found';
      if (i === mid && phase === 'dir') s.cls = 'mid';
      if (cfg.marks && phase !== 'end') {
        var t = [];
        if (i === low) t.push('Low'); if (i === high) t.push('High');
        s.tag = t.join(' ');
      }
      return s;
    }
    function step() {
      drawList(listNode, list, view);
      ask.innerHTML = '';
      if (phase === 'pick') {
        work.textContent = cfg.formula === 'filled' ? 'Middle = (' + low + ' + ' + high + ') / 2 = ?' : cfg.formula === 'rule' ? 'Middle = (Low + High) / 2, rounded down' : '';
        work.hidden = !work.textContent;
        ask.innerHTML = '<span class="menu-q">Click the item binary search checks next.</span>';
      }
      reportHeight();
    }
    listNode.addEventListener('click', function (e) {
      var b = e.target.closest('.item');
      if (!b || phase !== 'pick') return;
      var i = +b.getAttribute('data-i');
      if (i < low || i > high) return;
      var right = Math.floor((low + high) / 2);
      checks++;
      if (i !== right) {
        spoiled = true;
        trail.push('clicked ' + i + ' not ' + right);
        say(fb, '<b>Not this time.</b> Low is ' + low + ' and High is ' + high + '. ' + midWork(low, high) + '. This round does not count. Carry on to see it through.', 'bad');
      } else say(fb, '', '');
      mid = right; shown[mid] = true; phase = 'dir';
      work.textContent = midWork(low, high) + '. Index ' + mid + ' holds ' + list[mid - 1] + '.';
      work.hidden = false;
      drawList(listNode, list, view);
      ask.innerHTML = '<span class="menu-q">' + list[mid - 1] + ' is checked. What happens next?</span>';
      var opts = [['found', 'It is the target: stop'], ['left', 'The target is smaller: keep the left part'], ['right', 'The target is bigger: keep the right part']];
      opts.forEach(function (o) {
        var c = el('button', { type: 'button', class: 'choice', 'data-v': o[0] }, o[1]);
        c.addEventListener('click', function () { direction(o[0], c); });
        ask.appendChild(c);
      });
      reportHeight();
    });
    function direction(given, btn) {
      if (phase !== 'dir') return;
      var v = list[mid - 1], want = v === target ? 'found' : target < v ? 'left' : 'right';
      Array.prototype.forEach.call(ask.querySelectorAll('button'), function (b) { b.disabled = true; });
      btn.classList.add(given === want ? 'good' : 'bad');
      var why = want === 'found' ? v + ' is the target.' : target + (want === 'left' ? ' is smaller than ' : ' is bigger than ') + v + ', so it can only be in the ' + want + ' part. ' + v + ' and the other part are thrown away.';
      if (given !== want) {
        spoiled = true; trail.push('said ' + given + ' at ' + v);
        say(fb, '<b>Not this time.</b> ' + why + ' This round does not count. Carry on to see it through.', 'bad');
      } else if (!spoiled) say(fb, '<b>Right.</b> ' + why, '');
      else say(fb, why, 'hint');
      if (want === 'found') { shown[mid] = 'found'; return end(true); }
      if (want === 'left') high = mid - 1; else low = mid + 1;
      if (low > high) return end(false);
      setTimeout(function () { phase = 'pick'; mid = 0; step(); }, 0);
    }
    function end(found) {
      phase = 'end';
      drawList(listNode, list, view);
      ask.innerHTML = '';
      work.hidden = false;
      work.textContent = (found ? 'Found ' + target + ' at index ' + (list.indexOf(target) + 1) : 'Nothing is left to check, so ' + target + ' is not in the list') + '. Comparisons: ' + checks + '.';
      log.add('level ' + level + ', ' + cfg.n + ' items, target ' + target + (found ? '' : ' (not in the list)') + (spoiled ? ', ' + trail.join(', ') : ''), !spoiled);
      streak = spoiled ? 0 : streak + 1;
      bar.innerHTML = '';
      if (!spoiled && streak >= cfg.need) {
        if (level >= last) {
          log.finish();
          bar.innerHTML = doneBanner('Done: you can follow a binary search one check at a time.');
          reportHeight();
          return;
        }
        level++; streak = 0;
        say(fb, fb.innerHTML + ' <b>Level passed.</b>', '');
      }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + (spoiled ? 'Try a new list' : 'Next list') + '</span>' + ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      reportHeight();
    }
    start();
  };

  // ================================================================ race: linear or binary on the same list
  var RACE_LEVELS = [
    { n: 8, missing: 0, unsorted: 0, need: 2, about: 'Both searches use the same list.' },
    { n: 15, missing: 0.35, unsorted: 0, need: 2, about: 'A longer list. The target may not be in it.' },
    { n: 14, missing: 0.3, unsorted: 0.45, need: 3, about: 'Look carefully: is the list in order?' }
  ];
  activities.race = function () {
    var range = levelRange(RACE_LEVELS.length), level = range[0], last = range[1];
    var log = results('linear or binary, levels ' + range[0] + ' to ' + range[1], 'search-race-' + range[0] + '-' + range[1]);
    var lead = el('p', { class: 'task-q' }), help = helpButton(function () {
      return '<ol><li>Linear search checks index 1, then 2, then 3, and stops when it finds the target. If the target is not there, it checks every item.</li>' +
        '<li>Binary search checks the middle, then the middle of the part that is left. Count every item it checks.</li>' +
        '<li>Binary search only works when the list is in order.</li></ol>';
    });
    var head = el('div', { class: 'head-row' }), brief = el('div', { class: 'brief' }), tgt = el('div');
    var l1 = el('p', { class: 'row-label' }, 'Linear search'), linNode = el('div', { class: 'list' }), l2 = el('p', { class: 'row-label' }, 'Binary search'), binNode = el('div', { class: 'list' });
    var ask = el('div', { class: 'ask' }), bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, brief, tgt, l1, linNode, l2, binNode, ask, bar, fb].forEach(function (n) { host.appendChild(n); });
    var cfg, list, target, sorted, lin, bin, streak = 0, answered;
    window.__searchLab = function () { return { level: level, list: list, target: target, sorted: sorted, lin: lin, bin: bin, streak: streak }; };

    function start() {
      cfg = RACE_LEVELS[level - 1];
      list = sortedList(cfg.n);
      sorted = !(Math.random() < cfg.unsorted);
      if (!sorted) {
        do { for (var i = list.length - 1; i > 0; i--) { var j = rnd(0, i), t = list[i]; list[i] = list[j]; list[j] = t; } }
        while (list.every(function (v, k) { return !k || list[k - 1] < v; }));
      }
      target = Math.random() < cfg.missing ? pickTarget(list.slice().sort(function (a, b) { return a - b; }), true) : list[rnd(0, list.length - 1)];
      lin = linearCount(list, target);
      bin = sorted ? binarySteps(list, target) : null;
      answered = false; help.hide();
      lead.innerHTML = '<span class="round">Level ' + level + ' of ' + last + '</span><span class="score">Right in a row: <b>' + streak + '</b> of ' + cfg.need + '</span>';
      brief.innerHTML = cfg.about + ' Predict first, then run both searches.';
      tgt.innerHTML = '<span class="target">Find the target <b>' + target + '</b></span>';
      l2.hidden = false; binNode.hidden = false;
      drawList(linNode, list, function () { return {}; });
      drawList(binNode, list, function () { return {}; });
      ask.innerHTML = '';
      var q = el('div', { class: 'ask' });
      if (level === 3) {
        q.innerHTML = '<span class="menu-q">Can binary search be used on this list?</span>';
        ['Yes', 'No'].forEach(function (k) {
          var c = el('button', { type: 'button', class: 'choice', 'data-v': k }, k);
          c.addEventListener('click', function () {
            Array.prototype.forEach.call(q.querySelectorAll('.choice'), function (x) { x.classList.toggle('picked', x === c); x.setAttribute('aria-pressed', String(x === c)); x.style.borderColor = x === c ? 'var(--brand)' : ''; });
            q.setAttribute('data-pick', k);
          });
          q.appendChild(c);
        });
        ask.appendChild(q);
      }
      var r = el('div', { class: 'ask' });
      r.innerHTML = '<label class="menu-q" for="sl-lin">Linear search: how many comparisons?</label><input id="sl-lin" class="num-in" inputmode="numeric" autocomplete="off">' +
        '<label class="menu-q" for="sl-bin">Binary search: how many comparisons?</label><input id="sl-bin" class="num-in" inputmode="numeric" autocomplete="off">';
      ask.appendChild(r);
      if (level === 3) r.insertAdjacentHTML('beforeend', '<span class="small">If binary search cannot be used, leave its box empty.</span>');
      var go = el('button', { type: 'button', class: 'btn' }, ICON.play + '<span>Run both</span>');
      go.addEventListener('click', run);
      bar.innerHTML = ''; bar.appendChild(go);
      say(fb, '', '');
      Array.prototype.forEach.call(ask.querySelectorAll('input'), function (n) { n.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); }); });
      reportHeight();
    }
    function num(id) { var s = (document.getElementById(id).value || '').trim(); return /^\d+$/.test(s) ? +s : s === '' ? '' : NaN; }
    function run() {
      if (answered) return;
      var pick = ask.querySelector('[data-pick]'), canSay = pick ? pick.getAttribute('data-pick') : null;
      var a = num('sl-lin'), b = num('sl-bin');
      if (level === 3 && !canSay) return say(fb, 'First say whether binary search can be used.', 'hint');
      if (a === '' || (isNaN(a))) return say(fb, 'Type a number for linear search.', 'hint');
      var wantBin = sorted;
      if ((level < 3 || canSay === 'Yes') && (b === '' || isNaN(b))) return say(fb, 'Type a number for binary search.', 'hint');
      answered = true;
      Array.prototype.forEach.call(ask.querySelectorAll('input, button'), function (n) { n.disabled = true; });
      var okCan = level < 3 || (canSay === 'Yes') === wantBin;
      var okLin = a === lin, okBin = !wantBin || (canSay !== 'No' && b === bin.steps.length);
      var right = okCan && okLin && okBin;
      document.getElementById('sl-lin').classList.add(okLin ? 'good' : 'bad');
      if (wantBin || b !== '') document.getElementById('sl-bin').classList.add(okBin && wantBin ? 'good' : 'bad');
      var linAt = list.indexOf(target) + 1;
      drawList(linNode, list, function (i) {
        if (i > lin) return { cls: 'out' };
        return { cls: i === linAt ? 'found' : 'checked', order: i };
      });
      var msg = [];
      msg.push('Linear search: ' + lin + ' comparison' + (lin > 1 ? 's' : '') + (linAt ? ' (' + target + ' is at index ' + linAt + ').' : ' (it checks all ' + list.length + ': ' + target + ' is not in the list).'));
      if (wantBin) {
        var order = {};
        bin.steps.forEach(function (s, k) { order[s.mid] = k + 1; });
        drawList(binNode, list, function (i) { return order[i] ? { cls: i === bin.at ? 'found' : 'checked', order: order[i] } : { cls: 'out' }; });
        msg.push('Binary search: ' + bin.steps.length + ' comparison' + (bin.steps.length > 1 ? 's' : '') + ', checking ' + bin.steps.map(function (s) { return s.value; }).join(', ') + (bin.at ? '.' : ', then nothing is left.'));
        msg.push(bin.steps.length < lin ? 'Binary search made fewer comparisons.' : bin.steps.length > lin ? 'Linear search made fewer comparisons this time: the target was near the start.' : 'They made the same number of comparisons this time.');
      } else {
        drawList(binNode, list, function () { return { cls: 'out' }; });
        msg.push('Binary search cannot be used: the list is not in order, so checking the middle does not tell you which part to throw away.');
      }
      if (!okCan) msg.unshift(wantBin ? 'The list is in order, so binary search can be used.' : 'The list is not in order.');
      log.add('level ' + level + ', ' + list.length + ' items' + (sorted ? '' : ' not in order') + ', target ' + target + ': said ' + [canSay, a, b].filter(function (x) { return x !== null && x !== ''; }).join('/') +
        ', it was ' + [level === 3 ? (wantBin ? 'Yes' : 'No') : null, lin, wantBin ? bin.steps.length : null].filter(function (x) { return x !== null; }).join('/'), right);
      streak = right ? streak + 1 : 0;
      say(fb, (right ? '<b>Right.</b> ' : '<b>Not this time.</b> ') + msg.join(' ') + (right ? '' : ' This round does not count.'), right ? '' : 'bad');
      bar.innerHTML = '';
      if (right && streak >= cfg.need) {
        if (level >= last) { log.finish(); bar.innerHTML = doneBanner('Done: you can compare linear search and binary search.'); reportHeight(); return; }
        level++; streak = 0;
        say(fb, fb.innerHTML + ' <b>Level passed.</b>', '');
      }
      var nb = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next list</span>' + ICON.next);
      nb.addEventListener('click', start);
      bar.appendChild(nb);
      reportHeight();
    }
    start();
  };

  // ================================================================ start
  var LIST = [
    ['middle', 'Find the Middle', 'Binary search one check at a time: click the middle item, then keep the right part.'],
    ['race', 'Linear or Binary?', 'Predict how many comparisons each search makes on the same list, then run both.']
  ];
  if (activities[ACTIVITY]) { activities[ACTIVITY](); return; }
  host.appendChild(el('h1', {}, 'Search Lab'));
  host.appendChild(el('p', { class: 'intro' }, 'Follow a binary search one check at a time, and compare it with a linear search.'));
  var grid = el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = el('button', { type: 'button', class: 'menu-tile' }, '<b>' + a[1] + '</b><span>' + a[2] + '</span>');
    b.addEventListener('click', function () { location.search = '?activity=' + a[0] + (params.get('bcv') ? '&bcv=' + encodeURIComponent(params.get('bcv')) : ''); });
    grid.appendChild(b);
  });
  host.appendChild(grid);
  reportHeight();
})();
