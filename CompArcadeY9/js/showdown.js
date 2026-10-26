// Contest Showdown: a Team A against Team B quiz board for the projector, run by the teacher on one screen, no
// network. Three topics, four questions each (100 to 400 points, harder as they go). Open a tile, a team buzzes
// (the buttons, or the A and B keys), the teacher marks the spoken answer Right or Wrong. Wrong loses half the
// points and passes the question on. The board, scores and buzz order survive leaving the slide (this tab only).
var Showdown = (function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var TOPICS = [['notation', 'Prefix, Infix, Postfix'], ['bits', 'Bit Strings'], ['loops', 'Programs']];
  var POINTS = [100, 200, 300, 400];
  function make(topic, r) {
    if (topic === 'notation') return CAGen.notation(r + 1, r === 0 ? CAGen.pick(['prefix-eval', 'postfix-eval']) : r === 1 ? CAGen.pick(['to-prefix', 'to-postfix']) : null);
    if (topic === 'bits') return r < 2 ? CAGen.bitsEval(r + 1) : CAGen.bitsSolve(r === 2 ? 2 : 4);
    return CAGen.loop([2, 3, 4, 5][r]);
  }
  function fresh() {
    return { qs: TOPICS.map(function (t) { return POINTS.map(function (p, r) { return make(t[0], r); }); }), done: {}, scores: { A: 0, B: 0 }, log: [], open: null };
  }

  function start(host) {
    var st = CA.load('showdown', null, 'session') || fresh();
    var timer = null;
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'game-name' }, 'Contest Showdown <span>Team A against Team B</span>'));
    var teams = el('div', { class: 'teams' });
    top.appendChild(teams);
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    document.addEventListener('keydown', function (e) {
      if (!st.open || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      var k = String(e.key).toLowerCase();
      if (k === 'a' || k === 'b') { e.preventDefault(); buzz(k.toUpperCase()); }
    });
    if (st.open) openTile(st.open.c, st.open.r, true); else board();

    function persist() { CA.save('showdown', st, 'session'); }
    function drawTeams() {
      teams.innerHTML = '';
      ['A', 'B'].forEach(function (t) {
        teams.appendChild(el('div', { class: 'team team-' + t.toLowerCase() + (st.open && st.open.answering === t ? ' answering' : '') }, '<span>Team ' + t + '</span><b>' + st.scores[t] + '</b>'));
      });
      var undo = el('button', { type: 'button', class: 'btn secondary small', title: 'Undo the last score change' }, CA.ICON.undo + '<span>Undo</span>');
      undo.disabled = !st.log.length;
      undo.addEventListener('click', function () {
        var last = st.log.pop();
        if (!last) return;
        st.scores[last.team] -= last.delta;
        persist(); drawTeams();
      });
      teams.appendChild(undo);
    }
    function score(team, delta) { st.scores[team] += delta; st.log.push({ team: team, delta: delta }); }
    function remaining() { return TOPICS.length * POINTS.length - Object.keys(st.done).length; }

    function board() {
      if (timer) clearTimeout(timer);
      st.open = null; persist(); drawTeams();
      stage.innerHTML = '';
      var grid = el('div', { class: 'board' });
      TOPICS.forEach(function (t) { grid.appendChild(el('div', { class: 'board-head' }, esc(t[1]))); });
      POINTS.forEach(function (p, r) {
        TOPICS.forEach(function (t, c) {
          var key = c + '-' + r, won = st.done[key];
          var b = el('button', { type: 'button', class: 'tile' + (won ? ' used won-' + won.toLowerCase() : '') }, won ? (won === '-' ? 'No points' : 'Team ' + won) : String(p));
          b.disabled = !!won;
          b.setAttribute('aria-label', t[1] + ' for ' + p + (won ? ', done' : ''));
          b.addEventListener('click', function () { openTile(c, r); });
          grid.appendChild(b);
        });
      });
      stage.appendChild(grid);
      var actions = el('div', { class: 'actions' });
      if (!remaining()) {
        var w = st.scores.A === st.scores.B ? 'It is a draw!' : 'Team ' + (st.scores.A > st.scores.B ? 'A' : 'B') + ' wins!';
        actions.appendChild(el('div', { class: 'winner' }, CA.ICON.trophy + '<b>' + w + '</b> <span>' + st.scores.A + ' to ' + st.scores.B + '</span>'));
        CA.report('arcade-showdown', 'Contest Showdown', 'Contest Showdown: Team A ' + st.scores.A + ', Team B ' + st.scores.B + '.', true);
      } else {
        actions.appendChild(el('span', { class: 'muted small' }, 'Pick a tile. Teams buzz with the buttons or the A and B keys.'));
        if (remaining() < TOPICS.length * POINTS.length) CA.report('arcade-showdown', 'Contest Showdown', 'Contest Showdown so far: Team A ' + st.scores.A + ', Team B ' + st.scores.B + ', ' + remaining() + ' tiles left.', false);
      }
      var reset = el('button', { type: 'button', class: 'btn secondary small' }, CA.ICON.again + '<span>New board</span>');
      reset.addEventListener('click', function () {
        if (!reset.dataset.sure) { reset.dataset.sure = '1'; reset.querySelector('span').textContent = 'Sure? Scores go back to 0'; return; }
        st = fresh(); persist(); board();
      });
      actions.appendChild(reset);
      stage.appendChild(actions);
      CA.reportHeight();
    }

    function openTile(c, r, resumed) {
      var q = st.qs[c][r], pts = POINTS[r], key = c + '-' + r;
      if (!resumed || !st.open) st.open = { c: c, r: r, buzz: [], answering: null, out: [], ends: Date.now() + (40 + 20 * (r + 1)) * 1000, over: false, note: '' };
      persist(); drawTeams();
      stage.innerHTML = '';
      var card = el('div', { class: 'card showq' });
      var head = el('div', { class: 'q-head' }, '<span class="tag">' + esc(TOPICS[c][1]) + '</span><b class="pts">' + pts + '</b>');
      var clock = el('span', { class: 'mock-clock' });
      head.appendChild(clock);
      card.appendChild(head);
      card.appendChild(el('p', { class: 'q-prompt' }, esc(q.prompt)));
      var holder = card;
      if (q.topic === 'loops') { var grid = el('div', { class: 'qgrid' }); grid.appendChild(CA.questionBody(q, 'small')); holder = el('div', { class: 'side' }); grid.appendChild(holder); card.appendChild(grid); }
      else card.appendChild(CA.questionBody(q, 'big'));
      var ctl = el('div', { class: 'buzz' });
      var info = el('div', { class: 'buzz-info', role: 'status' });
      holder.appendChild(ctl); holder.appendChild(info);
      stage.appendChild(card);
      draw();
      (function tick() {
        if (!st.open) return;
        var left = Math.max(0, (st.open.ends - Date.now()) / 1000);
        clock.innerHTML = CA.ICON.clock + '<b>' + (left > 0 ? CA.clockText(left) : 'Time') + '</b>';
        clock.classList.toggle('low', left <= 10);
        timer = setTimeout(tick, 250);
      })();
      CA.reportHeight();

      function draw() {
        var o = st.open;
        drawTeams();
        ctl.innerHTML = '';
        info.innerHTML = '';
        if (o.over) {
          info.innerHTML = '<p class="answer">' + (o.note ? esc(o.note) + ' ' : '') + 'Answer: <code>' + esc(q.answer) + '</code></p><p class="why small">' +
            q.why.slice(-3).map(function (w) { return '<code>' + esc(w) + '</code>'; }).join(' <span class="muted">then</span> ') + '</p>';
          var back = el('button', { type: 'button', class: 'btn' }, CA.ICON.back + '<span>Back to the board</span>');
          back.addEventListener('click', board);
          ctl.appendChild(back);
          CA.reportHeight();
          return;
        }
        if (o.answering) {
          ctl.appendChild(el('div', { class: 'asking' }, '<b>Team ' + o.answering + '</b>, what is your answer?'));
          var right = el('button', { type: 'button', class: 'btn good' }, CA.ICON.check + '<span>Right +' + pts + '</span>');
          right.addEventListener('click', function () { score(o.answering, pts); st.done[key] = o.answering; o.note = 'Team ' + o.answering + ' got it.'; o.over = true; persist(); draw(); });
          var wrong = el('button', { type: 'button', class: 'btn bad' }, '<span>Wrong ' + (-pts / 2) + '</span>');
          wrong.addEventListener('click', function () {
            score(o.answering, -pts / 2);
            o.out.push(o.answering);
            o.answering = o.buzz.filter(function (t) { return o.out.indexOf(t) < 0; })[0] || null;
            if (o.out.length >= 2) { st.done[key] = '-'; o.note = 'Both teams missed it.'; o.over = true; }
            persist(); draw();
          });
          ctl.appendChild(right); ctl.appendChild(wrong);
        } else {
          ['A', 'B'].forEach(function (t) {
            var b = el('button', { type: 'button', class: 'btn buzz-' + t.toLowerCase() }, '<span>Team ' + t + ' buzzes</span><kbd>' + t + '</kbd>');
            b.disabled = o.out.indexOf(t) >= 0;
            b.addEventListener('click', function () { buzz(t); });
            ctl.appendChild(b);
          });
        }
        var reveal = el('button', { type: 'button', class: 'btn secondary small' }, '<span>Show the answer</span>');
        reveal.addEventListener('click', function () {
          if (!reveal.dataset.sure) { reveal.dataset.sure = '1'; reveal.querySelector('span').textContent = 'Sure? No points'; return; }
          st.done[key] = '-'; o.note = 'No points this time.'; o.over = true; persist(); draw();
        });
        ctl.appendChild(reveal);
        if (o.buzz.length) info.innerHTML = '<span class="muted small">Buzz order:</span> ' + o.buzz.map(function (t, i) { return '<span class="order">' + (i + 1) + '. Team ' + t + (o.out.indexOf(t) >= 0 ? ' (out)' : '') + '</span>'; }).join(' ');
        CA.reportHeight();
      }
      start.redraw = draw;
    }
    function buzz(team) {
      var o = st.open;
      if (!o || o.over || o.buzz.indexOf(team) >= 0 || o.out.indexOf(team) >= 0) return;
      o.buzz.push(team);
      if (!o.answering) o.answering = team;
      persist();
      if (start.redraw) start.redraw();
    }
  }
  return { start: start };
})();
