// Two applications, different data (?activity=compare). Two applications and what each works out; eight data
// items. Sort each into "Only A", "Only B", "Both" or "Neither", two checks as in Choose the Data. Then one why
// question, one try. A pair is passed with at most one item wrong on the first check and the why right. Two pairs
// passed; a pair can have no item in Both.
(function () {
  'use strict';
  var el = ML.el, esc = ML.esc, B = MLBANK;
  var NEED = 2;
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // The why question for one item, with options of the same shape and length.
  function whyFor(item, A, Bp) {
    var a = lower(A.name), b = lower(Bp.name), t = lower(item.text);
    if (item.where === 'both') return { q: 'Why do both the ' + a + ' and the ' + b + ' need ' + t + '?',
      right: 'It changes what each of them works out.',
      wrong: ['One collects it, and the other copies it.', 'Every application needs the same data.', 'It is the easiest data to measure.'] };
    if (item.where === 'neither') return { q: 'Why does neither the ' + a + ' nor the ' + b + ' need ' + t + '?',
      right: 'It does not change what either works out.',
      wrong: ['It is too hard for them to measure.', 'It changes too often for them to use.', 'Only bigger applications may collect it.'] };
    var yes = item.where === 'a' ? a : b, no = item.where === 'a' ? b : a;
    return { q: 'Why does the ' + yes + ' need ' + t + ', but the ' + no + ' does not?',
      right: 'It changes what the ' + yes + ' works out.',
      wrong: ['The ' + no + ' already has it.', 'It is easy for the ' + yes + ' to measure.', 'The ' + yes + ' is newer, so it stores more.'] };
  }

  ML.activities.compare = function (host) {
    var lead = el('p', { class: 'task-q' }), top = el('div'), board = el('div', { class: 'board' }), ask = el('div', { class: 'ask' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    var help = ML.helpButton(host, 'Take one item at a time. Ask: does it change what the first application works out? Then ask the same for the second. ' +
      'Yes and yes is Both. No and no is Neither.');
    var head = el('div', { class: 'head-row' }); head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, top, ask, board, bar, fb].forEach(function (n) { host.appendChild(n); });
    var wins = 0, lastPair = -1, S, log = ML.results('which data each of two applications needs');
    ML.peek = function () { return { S: S, wins: wins }; };

    function start() {
      var idx; do { idx = B.rand(B.PAIRS.length); } while (idx === lastPair);
      lastPair = idx;
      var pair = B.PAIRS[idx], A = B.APPS[pair[0]], Bp = B.APPS[pair[1]];
      if (B.rand(2)) { var t = A; A = Bp; Bp = t; }
      var items = B.pairRound(pair).map(function (x, i) {
        // The pair lists items as A's and B's; after a swap of sides, swap them too.
        var w = x.where;
        if (A !== B.APPS[pair[0]] && (w === 'a' || w === 'b')) w = w === 'a' ? 'b' : 'a';
        return { id: 'i' + i, text: x.text, where: w };
      });
      S = { A: A, B: Bp, items: items, at: {}, look: {}, checks: 0, firstWrong: 0, over: false, why: null };
      lead.innerHTML = '<span class="round">Pair ' + (wins + 1) + ' of ' + NEED + '</span>Which data does each application need? Put every item in a box. Then press <b>Check</b>.';
      top.innerHTML = '<div class="two-col apps">' + [A, Bp].map(function (x) {
        return '<div class="model-box"><div class="model-name">' + ML.ICON.gear + '<b>' + esc(x.name) + '</b><span>It works out ' + esc(x.job) + '.</span></div></div>';
      }).join('') + '</div>';
      ask.innerHTML = '';
      ML.say(fb, '', '');
      help.hide();
      draw();
    }
    function chip(x, show) {
      var cls = S.look[x.id] ? ' hint' : '';
      if (show) cls = S.at[x.id] === x.where ? ' good' : ' bad';
      return '<button type="button" class="chip' + cls + '" data-item="' + x.id + '"' + (S.over ? ' disabled' : '') + '>' + esc(x.text) + '</button>';
    }
    function draw(show) {
      var free = S.items.filter(function (x) { return !S.at[x.id]; });
      var bin = function (place, title) {
        return '<div class="bin" data-place="' + place + '"><b class="bin-name">' + title + '</b>' +
          S.items.filter(function (x) { return S.at[x.id] === place; }).map(function (x) { return chip(x, show); }).join('') + '</div>';
      };
      board.innerHTML = '<div class="pool' + (free.length ? '' : ' empty') + '" data-place="pool"><span class="pool-label">Data items</span>' +
        (free.length ? free.map(function (x) { return chip(x, show); }).join('') : '<span class="slot-empty">All sorted.</span>') + '</div>' +
        '<div class="bins four">' + bin('a', 'Only the ' + esc(lower(S.A.name))) + bin('b', 'Only the ' + esc(lower(S.B.name))) + bin('both', 'Both') + bin('neither', 'Neither') + '</div>';
      bar.innerHTML = '';
      if (!S.over) {
        var check = el('button', { type: 'button', class: 'btn' }, ML.ICON.check + '<span>Check</span>');
        check.disabled = free.length > 0;
        check.addEventListener('click', doCheck);
        bar.appendChild(check);
        bar.appendChild(el('span', { class: 'small' }, free.length ? 'Put every item in a box first.' : 'Checks left: ' + (2 - S.checks)));
      }
      ML.reportHeight();
    }
    ML.placer(board, function (id, place) {
      if (S.over) return;
      S.at[id] = place === 'pool' ? null : place;
      delete S.look[id];
      draw();
    }, function () { return !S.over; });

    function doCheck() {
      S.checks++;
      var wrong = S.items.filter(function (x) { return S.at[x.id] !== x.where; });
      if (S.checks === 1) S.firstWrong = wrong.length;
      if (!wrong.length) { S.over = true; draw(true); return askWhy(); }
      if (S.checks === 1) {
        wrong.forEach(function (x) { S.at[x.id] = null; S.look[x.id] = true; });
        draw();
        ML.say(fb, wrong.length + ' item' + (wrong.length === 1 ? ' was' : 's were') + ' in the wrong box and went back. For each one, ask about each application in turn.', 'bad');
        return;
      }
      S.over = true;
      wrong.forEach(function (x) { S.at[x.id] = x.where; });
      draw(true);
      var where = { a: 'only the ' + lower(S.A.name), b: 'only the ' + lower(S.B.name), both: 'both', neither: 'neither' };
      ML.say(fb, '<b>' + wrong.length + ' still wrong</b> (now in the right box): ' + wrong.map(function (x) { return '"' + esc(x.text) + '" is ' + esc(where[x.where]); }).join('; ') + '.', 'bad');
      askWhy();
    }
    function askWhy() {
      var pool = S.items.filter(function (x) { return x.where !== 'neither'; });
      var item = B.rand(4) === 0 ? B.pick(S.items.filter(function (x) { return x.where === 'neither'; })) : B.pick(pool);
      var w = whyFor(item, S.A, S.B);
      S.why = w;
      var opts = B.shuffle([w.right].concat(w.wrong));
      top.innerHTML = '';
      ask.innerHTML = '<p class="menu-q">' + esc(w.q) + ' One try.</p>';
      var box = el('div', { class: 'choices col' });
      opts.forEach(function (o) {
        var b = el('button', { type: 'button', class: 'choice' }, esc(o));
        b.addEventListener('click', function () {
          var ok = o === w.right;
          Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) { x.disabled = true; if (x.textContent === w.right) x.classList.add('good'); });
          if (!ok) b.classList.add('bad');
          var pass = ok && S.firstWrong <= 1;
          if (pass) wins++;
          log.add(S.A.name + ' and ' + S.B.name + ', ' + S.firstWrong + ' of 8 wrong on the first check, why ' + (ok ? 'right' : 'wrong'), pass);
          ML.say(fb, (ok ? '<b>Right.</b> ' : '<b>Not that one.</b> The green one is right. ') + 'Data is needed when it changes what the application works out.' +
            (pass ? '' : ' To pass: at most one wrong on the first check, and the why right.'), pass ? '' : 'bad');
          next();
        });
        box.appendChild(b);
      });
      ask.appendChild(box);
      ML.reportHeight();
    }
    function next() {
      bar.innerHTML = '';
      if (wins >= NEED) { log.finish(); bar.innerHTML = ML.doneBanner('Done: two pairs of applications, and why their data is different.'); ML.reportHeight(); return; }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next pair</span>' + ML.ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      bar.appendChild(el('span', { class: 'small' }, 'Pairs done: ' + wins + ' of ' + NEED));
      ML.reportHeight();
    }
    start();
  };
})();
