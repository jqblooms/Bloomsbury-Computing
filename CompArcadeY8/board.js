// Team Quiz Board (?mode=board): run by the teacher on the projector for two teams, on one screen, no network.
// Pick a tile; the question is made fresh with new values; the teams work it out on paper or a mini whiteboard
// against the clock; the teacher reveals the answer and how it works, then says which teams were right. One tile in
// each game is worth double. Scores and the tiles used are kept on this computer until New game.
(function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var CATS = [
    { name: 'Prefix and Postfix', kinds: ['post-eval', 'pre-eval'], levels: [2, 3, 4] },
    { name: 'Convert It', kinds: ['to-post', 'to-pre'], levels: [2, 3, 4] },
    { name: 'Bit Strings', kinds: ['bits-logic', 'bits-chain'], levels: [2, 3, 4] },
    { name: 'Shifts and Circulates', kinds: ['bits-shift'], levels: [2, 3, 4] },
    { name: 'Loops', kinds: ['loop'], levels: [1, 3, 4] }
  ];
  var VALUES = [100, 200, 300], SECONDS = [60, 75, 90];
  var KEY = 'bc-ca8-board-v1';

  function fresh() {
    return { names: ['Team A', 'Team B'], scores: [0, 0], used: {}, double: Math.floor(Math.random() * CATS.length) + ':' + (1 + Math.floor(Math.random() * 2)) };
  }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.scores && s.used) return s; } catch (e) {} return fresh(); }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  CA.modes.board = function (host) {
    var st = load(), clock = null;
    var teams = el('div', { class: 'teams' }), body = el('div');
    host.appendChild(teams); host.appendChild(body);

    function drawTeams() {
      teams.innerHTML = '';
      ['a', 'b'].forEach(function (t, i) {
        var box = el('div', { class: 'team ' + t });
        var name = el('input', { value: st.names[i], 'aria-label': 'Team name', maxlength: '16' });
        name.addEventListener('change', function () { st.names[i] = name.value.trim() || (i ? 'Team B' : 'Team A'); save(st); });
        box.appendChild(name);
        box.appendChild(el('b', {}, String(st.scores[i])));
        teams.appendChild(box);
      });
    }
    function tilesLeft() { var n = 0; CATS.forEach(function (c, ci) { VALUES.forEach(function (v, vi) { if (!st.used[ci + ':' + vi]) n++; }); }); return n; }

    function drawBoard() {
      if (clock) { clock.stop(); clock = null; }
      drawTeams();
      body.innerHTML = '';
      var grid = el('div', { class: 'board', style: 'grid-template-columns:repeat(' + CATS.length + ',minmax(0,1fr))' });
      CATS.forEach(function (c) { grid.appendChild(el('div', { class: 'cat' }, esc(c.name))); });
      VALUES.forEach(function (v, vi) {
        CATS.forEach(function (c, ci) {
          var id = ci + ':' + vi, used = st.used[id];
          var b = el('button', { type: 'button', class: 'tile' + (used ? ' won-' + used : ''), 'aria-label': c.name + ' for ' + v }, used ? (used === 'n' ? 'Nobody' : used === 'ab' ? 'Both' : esc(st.names[used === 'a' ? 0 : 1])) : String(v));
          if (used) b.disabled = true;
          else b.addEventListener('click', function () { ask(ci, vi); });
          grid.appendChild(b);
        });
      });
      body.appendChild(grid);
      var row = el('div', { class: 'actions' });
      if (!tilesLeft()) {
        var w = st.scores[0] === st.scores[1] ? 'A draw!' : esc(st.names[st.scores[0] > st.scores[1] ? 0 : 1]) + ' win!';
        body.insertBefore(el('p', { class: 'winner' }, w), grid);
      }
      var end = el('button', { type: 'button', class: 'btn secondary' }, 'End game');
      end.addEventListener('click', function () {
        var w = st.scores[0] === st.scores[1] ? 'It is a draw!' : esc(st.names[st.scores[0] > st.scores[1] ? 0 : 1]) + ' win, ' + Math.max(st.scores[0], st.scores[1]) + ' to ' + Math.min(st.scores[0], st.scores[1]) + '!';
        body.innerHTML = '<p class="winner">' + w + '</p>';
        var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.play + ' New game');
        again.addEventListener('click', function () { st = fresh(); save(st); drawBoard(); });
        var back = el('button', { type: 'button', class: 'btn secondary' }, 'Back to the board');
        back.addEventListener('click', drawBoard);
        var r = el('div', { class: 'actions' }); r.appendChild(again); r.appendChild(back); body.appendChild(r);
        CA.reportHeight();
      });
      var reset = el('button', { type: 'button', class: 'btn secondary' }, 'New game');
      reset.addEventListener('click', function () { st = fresh(); save(st); drawBoard(); });
      row.appendChild(end); row.appendChild(reset);
      row.appendChild(el('span', { class: 'small muted' }, 'Pick a tile. Teams write their answer, then the teacher reveals it.'));
      body.appendChild(row);
      CA.reportHeight();
    }

    function ask(ci, vi) {
      var c = CATS[ci], q = Y8Gen.question(Y8Gen.pick(c.kinds), c.levels[vi]), id = ci + ':' + vi;
      var dbl = st.double === id, worth = VALUES[vi] * (dbl ? 2 : 1), total = SECONDS[vi] * 1000;
      body.innerHTML = '';
      var wrap = el('div', { class: 'bq' });
      wrap.appendChild(el('div', {}, '<span class="tag">' + esc(c.name) + '</span><span class="tag">' + VALUES[vi] + '</span>' + (dbl ? '<span class="double">DOUBLE: ' + worth + ' points</span>' : '')));
      wrap.appendChild(el('p', { class: 'ask', style: 'font-size:1.15rem' }, esc(q.ask)));
      wrap.appendChild(el('div', {}, CA.showQ(q, true)));
      var tb = el('div', { class: 'timebar' }), left = el('span', { class: 'chip' });
      wrap.appendChild(tb);
      var row = el('div', { class: 'actions' });
      var pause = el('button', { type: 'button', class: 'btn secondary' }, 'Pause');
      var more = el('button', { type: 'button', class: 'btn secondary' }, '+15 s');
      var reveal = el('button', { type: 'button', class: 'btn' }, 'Reveal the answer');
      row.appendChild(left); row.appendChild(pause); row.appendChild(more); row.appendChild(reveal);
      wrap.appendChild(row);
      var ans = el('div');
      wrap.appendChild(ans);
      body.appendChild(wrap);
      clock = CA.countdown(total, function (ms) { CA.timebar(tb, ms, total); left.innerHTML = CA.ICON.clock + '<b>' + CA.mmss(ms) + '</b>'; }, function () { left.innerHTML = '<b>Time! Pens down.</b>'; });
      pause.addEventListener('click', function () { if (!clock) return; if (clock.paused()) { clock.resume(); pause.textContent = 'Pause'; } else { clock.pause(); pause.textContent = 'Resume'; } });
      more.addEventListener('click', function () { if (clock) clock.add(15000); });
      reveal.addEventListener('click', function () {
        if (clock) { clock.stop(); clock = null; }
        row.innerHTML = '';
        ans.className = 'after';
        ans.innerHTML = '<div><p style="font-size:1.25rem;margin:8px 0 0">Answer: <b style="font-family:var(--font-mono)">' + esc(q.answer) + '</b></p></div>' + CA.whyBox(q);
        var award = el('div', { class: 'actions' });
        [['a', esc(st.names[0]) + ' right'], ['b', esc(st.names[1]) + ' right'], ['ab', 'Both right'], ['n', 'Nobody']].forEach(function (x) {
          var b = el('button', { type: 'button', class: 'btn' + (x[0] === 'n' ? ' secondary' : '') }, x[1]);
          b.addEventListener('click', function () {
            if (x[0].indexOf('a') >= 0) st.scores[0] += worth;
            if (x[0].indexOf('b') >= 0) st.scores[1] += worth;
            st.used[id] = x[0];
            save(st);
            drawBoard();
          });
          award.appendChild(b);
        });
        ans.firstChild.appendChild(award);
        CA.reportHeight();
      });
      CA.reportHeight();
    }

    drawBoard();
  };
})();
