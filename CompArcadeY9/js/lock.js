// Loop Lock: an escape room of four locks. Each lock's code is what its ACSL program outputs: trace the loops to
// find it. Three tries per lock; each wrong try adds 30 seconds. After three wrong tries the lock jams and resets
// with a new program. Locks get harder: WHILE loops, IF inside a loop, nested loops, then a contest-length loop.
// Progress survives leaving the slide (this tab only); best time kept in this browser.
var LoopLock = (function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var LEVELS = [3, 4, 5, 6], TRIES = 3, PENALTY = 30;
  var NAMES = ['The Gate', 'The Corridor', 'The Vault Door', 'The Last Lock'];

  function start(host) {
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'game-name' }, 'Loop Lock <span>Trace the program. Its output opens the lock.</span>'));
    var bar = el('div', { class: 'scorebar' }, CA.chip(CA.ICON.clock, 'Time', 'll-time') + CA.chip(CA.ICON.flag, 'Penalty', 'll-pen') + CA.chip(CA.ICON.trophy, 'Best', 'll-best'));
    top.appendChild(bar);
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    var best = CA.load('lock-best', 0);
    CA.setChip(bar, 'll-best', best ? CA.clockText(best) : 'none');
    CA.setChip(bar, 'll-time', '0:00'); CA.setChip(bar, 'll-pen', '0 s');
    var saved = CA.load('lock-run', null, 'session');
    if (saved && saved.locks && !saved.done) play(saved); else intro();

    function intro() {
      stage.innerHTML = '';
      var card = el('div', { class: 'card intro' });
      card.innerHTML = '<h2>Escape in four locks</h2><ul class="facts">' +
        '<li>Each lock has a program. <b>The code is what the program outputs.</b> Trace it.</li>' +
        '<li>3 tries per lock. Each wrong try adds <b>30 seconds</b> to your time.</li>' +
        '<li>3 wrong tries jam the lock: it resets with a new program.</li>' +
        '<li>The locks get harder. The last one is contest length: spot the pattern.</li></ul>';
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.lock + '<span>Enter the room</span>');
      go.addEventListener('click', function () { play(null); });
      card.appendChild(el('div', { class: 'actions' })).appendChild(go);
      stage.appendChild(card);
      CA.reportHeight();
    }

    function play(st) {
      if (!st) st = { started: Date.now(), penalty: 0, at: 0, tries: TRIES, wrong: 0, jams: 0, locks: LEVELS.map(function (lv) { return CAGen.loop(lv); }), done: false };
      var timer = null;
      CA.save('lock-run', st, 'session');
      stage.innerHTML = '';
      var doors = el('div', { class: 'doors' });
      var room = el('div', { class: 'room' });
      stage.appendChild(room);
      (function tick() {
        if (st.done) return;
        CA.setChip(bar, 'll-time', CA.clockText((Date.now() - st.started) / 1000 + st.penalty));
        CA.setChip(bar, 'll-pen', st.penalty + ' s');
        timer = setTimeout(tick, 500);
      })();
      show();

      function drawDoors() {
        doors.innerHTML = '';
        LEVELS.forEach(function (lv, i) {
          var state = i < st.at ? 'open' : i === st.at ? 'now' : 'shut';
          doors.appendChild(el('div', { class: 'door ' + state }, (state === 'open' ? CA.ICON.unlock : CA.ICON.lock) + '<span>' + (i + 1) + '</span>'));
        });
      }
      function show(note) {
        drawDoors();
        room.innerHTML = '';
        var q = st.locks[st.at];
        var grid = el('div', { class: 'lock-grid' });
        grid.appendChild(CA.questionBody(q, 'small'));
        var side = el('div', { class: 'side' });
        side.appendChild(doors);
        side.appendChild(el('h3', {}, 'Lock ' + (st.at + 1) + ': ' + esc(NAMES[st.at])));
        side.appendChild(el('p', { class: 'q-prompt small' }, 'What is output by this program? That is the code.'));
        var ans = CA.answerRow('ll-answer', 'Code', tryCode, true);
        var go = el('button', { type: 'button', class: 'btn' }, CA.ICON.unlock + '<span>Try the code</span>');
        go.addEventListener('click', tryCode);
        ans.row.appendChild(go);
        side.appendChild(ans.row);
        var dots = el('div', { class: 'tries', 'aria-label': st.tries + ' tries left' });
        for (var i = 0; i < TRIES; i++) dots.appendChild(el('span', { class: 'dot' + (i < st.tries ? '' : ' used') }));
        side.appendChild(dots);
        var fb = el('div', { class: 'feedback' + (note && note.bad ? ' error' : ''), role: 'status' }, note ? note.html : '');
        side.appendChild(fb);
        grid.appendChild(side);
        room.appendChild(grid);
        CA.focus(ans.input);
        CA.reportHeight();

        function tryCode() {
          if (st.done || !ans.input.value.trim()) return;
          if (CA.accept(q, ans.input.value)) {
            st.at++; st.tries = TRIES;
            if (st.at >= LEVELS.length) { escaped(); return; }
            CA.save('lock-run', st, 'session');
            CA.report('arcade-lock', 'Loop Lock', 'Loop Lock: ' + st.at + ' of 4 locks open, ' + st.wrong + ' wrong codes so far.', false);
            show({ html: 'Click. Lock ' + st.at + ' is open. On to the next one.' });
            return;
          }
          st.wrong++; st.tries--; st.penalty += PENALTY;
          CA.setChip(bar, 'll-pen', st.penalty + ' s');
          CA.pop(bar.querySelector('#ll-pen'), '+' + PENALTY + ' s', true);
          if (st.tries <= 0) {
            st.jams++;
            var old = q;
            st.locks[st.at] = CAGen.loop(LEVELS[st.at]);
            st.tries = TRIES;
            CA.save('lock-run', st, 'session');
            show({ bad: true, html: 'The lock jammed. Its code was <code>' + esc(old.answer) + '</code>. It has reset with a new program.' });
            return;
          }
          CA.save('lock-run', st, 'session');
          show({ bad: true, html: 'Wrong code. +' + PENALTY + ' seconds. ' + st.tries + ' tr' + (st.tries === 1 ? 'y' : 'ies') + ' left. Trace it again, line by line.' });
        }
      }
      function escaped() {
        st.done = true;
        if (timer) clearTimeout(timer);
        var total = Math.round((Date.now() - st.started) / 1000 + st.penalty);
        var newBest = !best || total < best;
        if (newBest) { best = total; CA.save('lock-best', best); }
        CA.clear('lock-run', 'session');
        CA.setChip(bar, 'll-time', CA.clockText(total));
        CA.setChip(bar, 'll-best', CA.clockText(best));
        drawDoors();
        room.innerHTML = '';
        room.appendChild(doors);
        var res = el('div', { class: 'card result' });
        res.innerHTML = '<h2>' + (newBest ? 'You escaped: a new best time!' : 'You escaped!') + '</h2>' +
          '<div class="big-stats"><div><b>' + CA.clockText(total) + '</b><span>time with penalties</span></div><div><b>' + st.wrong + '</b><span>wrong codes</span></div>' +
          '<div><b>' + st.jams + '</b><span>jammed locks</span></div></div>';
        var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.again + '<span>A new room</span>');
        again.addEventListener('click', function () { play(null); });
        res.appendChild(el('div', { class: 'actions' })).appendChild(again);
        room.appendChild(res);
        CA.report('arcade-lock', 'Loop Lock', 'Loop Lock: escaped in ' + CA.clockText(total) + ' with penalties, ' + st.wrong + ' wrong codes, ' + st.jams + ' jammed locks.', true);
        CA.reportHeight();
      }
    }
  }
  return { start: start };
})();
