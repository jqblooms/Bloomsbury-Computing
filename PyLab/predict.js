// Predict, then Run. A short program (and what the user types, for input()). Type what it prints first, then Python
// runs it and each line is marked. ?activity=vars (2.1: store, change, copy) or ?activity=io&part=1 (2.2: text from
// input()) or ?activity=io&part=2 (numbers from input(), and programs that stop with an error). A wrong prediction
// shows the reason and the round does not count.
(function () {
  'use strict';
  var el = PL.el, esc = PL.esc, B = PLBANK;
  var SETS = {
    vars: { label: 'predict what a program prints', done: 'Done: you can follow variables line by line.',
      levels: [{ gen: B.VARS_L.store, size: 3, need: 1 }, { gen: B.VARS_L.change, size: 3, need: 1 }, { gen: B.VARS_L.copy, size: 3, need: 2 }] },
    io1: { label: 'predict what a program prints from input', done: 'Done: you can follow input() and print().',
      levels: [{ gen: B.IO_L.text, size: 3, need: 1 }, { gen: B.IO_L.two, size: 3, need: 1 }] },
    io2: { label: 'predict numbers from input, and errors', done: 'Done: you can tell when a program needs int() or float().', errors: true,
      levels: [{ gen: B.IO_L.numbers, size: 4, need: 1 }, { gen: B.IO_L.errors, size: 4, need: 2 }] }
  };
  function lines(s) { return String(s).replace(/\r/g, '').split('\n').map(function (l) { return l.trim(); }).filter(function (l, i, a) { return l !== '' || a.slice(i).some(Boolean); }); }
  function same(given, real) {
    if (given === real.trim()) return 'yes';
    var m = /^["'](.*)["']$/.exec(given);
    return m && m[1] === real.trim() ? 'quotes' : '';
  }

  function predict(host, set) {
    var S = SETS[set];
    var lead = el('p', { class: 'task-q' }), qn = el('p', { class: 'menu-q' }), cols = el('div', { class: 'two-col' }), left = el('div'), right = el('div');
    var box = el('div'), typed = el('div'), ask = el('div', { class: 'ask col' }), shown = el('div'), fb = el('div', { class: 'feedback', role: 'status' }), bar = el('div', { class: 'actions' });
    left.appendChild(box); left.appendChild(typed); right.appendChild(ask); right.appendChild(shown);
    cols.appendChild(left); cols.appendChild(right);
    [lead, qn, cols, fb, bar].forEach(function (n) { host.appendChild(n); });
    var levels = S.levels, level = 0, clean = 0, spoiled = false, inRound = 0, seen = {}, item = null, errPicked = false, log = PL.results(S.label);
    PL.peek = function () { return { level: level, clean: clean, spoiled: spoiled, inRound: inRound, item: item }; };

    function header() { lead.innerHTML = PL.levelBar(level, levels.length, clean, levels[level].need, spoiled) + '<span class="score">Program ' + (inRound + 1) + ' of ' + levels[level].size + '</span>'; }
    function next() {
      for (var i = 0; i < 40; i++) { item = levels[level].gen(); if (!seen[item.code + item.inputs]) break; }
      seen[item.code + item.inputs] = 1; errPicked = false;
      header();
      qn.innerHTML = 'Predict first: what does the program print?' + (item.inputs ? ' The user types what is shown under it.' : '');
      box.innerHTML = PL.codeBox(item.code);
      typed.innerHTML = item.inputs ? '<div class="typed-in"><span>The user types, in order:</span>' + item.inputs.map(function (t) { return '<b>' + esc(t) + '</b>'; }).join('') + '</div>' : '';
      shown.innerHTML = ''; PL.say(fb, '', ''); bar.innerHTML = '';
      ask.innerHTML = '<label class="small" for="pl-pred">Type what it prints, one line for each line it prints.</label>';
      var ta = el('textarea', { id: 'pl-pred', class: 'pred', rows: '2', spellcheck: 'false', autocomplete: 'off' });
      ask.appendChild(ta);
      var row = el('div', { class: 'actions tight' });
      var go = el('button', { type: 'button', class: 'btn' }, PL.ICON.play + '<span>Run it</span>');
      go.addEventListener('click', function () { answer(ta); });
      row.appendChild(go);
      if (S.errors) {
        var eb = el('button', { type: 'button', class: 'btn ghost', 'aria-pressed': 'false' }, '<span>It stops with an error</span>');
        eb.addEventListener('click', function () { errPicked = !errPicked; eb.setAttribute('aria-pressed', String(errPicked)); ta.disabled = errPicked; });
        row.appendChild(eb);
      }
      ask.appendChild(row);
      PL.reportHeight();
    }
    function answer(ta) {
      var given = lines(ta.value);
      if (!errPicked && !given.length) { PL.say(fb, 'Type your prediction first' + (S.errors ? ', or choose "It stops with an error".' : '.'), 'hint'); ta.focus(); return; }
      Array.prototype.forEach.call(ask.querySelectorAll('button, textarea'), function (b) { b.disabled = true; });
      PL.run(item.code, item.inputs || []).then(function (r) {
        var ok, marks = null, quotes = false;
        if (r.error) ok = errPicked;
        else if (errPicked) ok = false;
        else {
          marks = r.out.map(function (l, i) { var s = given[i] == null ? '' : same(given[i], l); if (s === 'quotes') quotes = true; return !!s; });
          ok = given.length === r.out.length && marks.every(Boolean);
        }
        if (!ok) spoiled = true;
        shown.innerHTML = PL.screen(r, marks);
        log.add('level ' + (level + 1) + ', ' + item.code.replace(/\n/g, '; ') + (item.inputs ? ' typed ' + item.inputs.join(', ') : '') + ': said ' + (errPicked ? 'error' : given.join(' / ')) + ', it ' + (r.error ? 'stopped with an error' : 'printed ' + r.out.join(' / ')), ok);
        var why = esc(item.why) + (quotes ? ' print shows text without the quote marks.' : '');
        var miss = !ok && !r.error && !errPicked && given.length !== r.out.length ? ' It prints ' + r.out.length + ' line' + (r.out.length === 1 ? '' : 's') + '.' : '';
        PL.say(fb, (ok ? '<b>Right.</b> ' : '<b>Not this time.</b>' + miss + ' ') + why, ok ? '' : 'bad');
        inRound++;
        var L = levels[level], label = 'Next program';
        if (inRound >= L.size) {
          if (!spoiled) clean++;
          var msg = spoiled ? 'That round had a mistake, so it does not count. Try a new round.' : 'A round with no mistakes.';
          inRound = 0; spoiled = false; seen = {};
          if (clean >= L.need) {
            if (level + 1 >= levels.length) { log.finish(); inRound = L.size - 1; header(); bar.innerHTML = PL.doneBanner(S.done); PL.reportHeight(); return; }
            clean = 0;
            level++; msg += ' <b>Level ' + level + ' done.</b>'; label = 'Start level ' + (level + 1);
          } else label = 'Start a new round';
          PL.say(fb, fb.innerHTML + '<br>' + msg, ok ? '' : 'bad');
        }
        header();
        var nb = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + label + '</span>' + PL.ICON.next);
        nb.addEventListener('click', next);
        bar.appendChild(nb);
        PL.reportHeight();
      });
    }
    next();
  }
  PL.activities.vars = function (host) { predict(host, 'vars'); };
  PL.activities.io = function (host) { predict(host, PL.query.get('part') === '2' ? 'io2' : 'io1'); };
})();
