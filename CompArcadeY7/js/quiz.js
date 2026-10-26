// Team Quiz Board (?game=quiz): the teacher runs it on the projector for Team A and Team B. One screen, no network.
// Six topics, three tiles each (100, 200, 300 points, harder each time). Click a tile: the question opens; the teams
// talk and answer out loud; the teacher shows the answer and gives the points. Scores and the board are kept on this
// computer, so leaving the slide and coming back keeps the game. Every question and answer comes from CompGenY7.
CA.games.quiz = function (host) {
  'use strict';
  var G = CompGenY7, el = CA.el, esc = CA.esc;
  var TOPICS = [
    { name: 'Postfix', tiles: [['postfix', 1], ['postfix', 2], ['postfix', 3]] },
    { name: 'Prefix', tiles: [['prefix', 1], ['prefix', 2], ['prefix', 3]] },
    { name: 'Convert', tiles: [['to-postfix', 1], ['to-postfix', 2], ['to-prefix', 3]] },
    { name: 'NOT, AND, OR, XOR', tiles: [['bits-not', 1], [G.pick(['bits-and', 'bits-or']), 1], ['bits-xor', 2]] },
    { name: 'Shifts', tiles: [[G.pick(['bits-lshift', 'bits-rshift']), 2], [G.pick(['bits-lcirc', 'bits-rcirc']), 2], ['bits-two', 2]] },
    { name: 'Loops', tiles: [['loop', 1], ['loop', 2], ['loop', 3]] }
  ];
  var res = CA.results('quiz-board', 'Team Quiz Board');
  var KEY = 'quiz-state';

  function fresh() {
    return { scores: { A: 0, B: 0 }, topics: TOPICS.map(function (t) {
      return { name: t.name, tiles: t.tiles.map(function (k, r) {
        var q = G.question(k[0], k[1]);
        return { pts: (r + 1) * 100, prompt: q.prompt, show: q.show, answer: q.answer, steps: q.steps.slice(0, 7), used: null };
      }) };
    }) };
  }
  var state = CA.load(KEY, null);
  if (!state || !state.topics || state.topics.length !== TOPICS.length) state = fresh();
  function keep() { CA.save(KEY, state); }

  host.innerHTML = '';
  host.appendChild(el('div', { class: 'game-head' }, '<h1>Team Quiz Board</h1><span class="muted">For the teacher to run on the projector</span>'));
  var teams = el('div', { class: 'teams' });
  var view = el('div', { class: 'quiz-view' });
  host.appendChild(teams); host.appendChild(view);

  function drawTeams() {
    teams.innerHTML = '';
    ['A', 'B'].forEach(function (t) {
      var card = el('div', { class: 'team team-' + t });
      card.innerHTML = '<span class="team-name">Team ' + t + '</span><span class="team-score">' + state.scores[t] + '</span>';
      var adj = el('span', { class: 'team-adj' });
      [-100, 100].forEach(function (d) {
        var b = el('button', { type: 'button', class: 'mini-btn', 'aria-label': (d > 0 ? 'Add 100 to' : 'Take 100 from') + ' Team ' + t }, d > 0 ? '+100' : '-100');
        b.addEventListener('click', function () { state.scores[t] = Math.max(0, state.scores[t] + d); keep(); drawTeams(); });
        adj.appendChild(b);
      });
      card.appendChild(adj);
      teams.appendChild(card);
    });
    var again = el('button', { type: 'button', class: 'btn secondary' }, CA.ICON.redo + '<span>New board</span>');
    var armed = false;
    again.addEventListener('click', function () {
      if (!armed) { armed = true; again.querySelector('span').textContent = 'Click again to start a new board'; CA.later(3000, function () { armed = false; if (again.isConnected) again.querySelector('span').textContent = 'New board'; }); return; }
      state = fresh(); keep(); drawTeams(); drawBoard();
    });
    teams.appendChild(again);
  }

  function allUsed() { return state.topics.every(function (t) { return t.tiles.every(function (x) { return x.used; }); }); }
  function drawBoard() {
    view.innerHTML = '';
    var grid = el('div', { class: 'quiz-grid' });
    state.topics.forEach(function (t, c) {
      var col = el('div', { class: 'quiz-col' });
      col.appendChild(el('div', { class: 'quiz-topic' }, esc(t.name)));
      t.tiles.forEach(function (x, r) {
        var tile = el('button', { type: 'button', class: 'quiz-tile' + (x.used ? ' used used-' + x.used : '') }, x.used ? (x.used === 'none' ? 'No one' : 'Team ' + x.used) : String(x.pts));
        if (x.used) tile.disabled = true;
        else tile.addEventListener('click', function () { open(c, r); });
        col.appendChild(tile);
      });
      grid.appendChild(col);
    });
    view.appendChild(grid);
    if (allUsed()) {
      var a = state.scores.A, b = state.scores.B;
      view.appendChild(el('div', { class: 'quiz-final' }, CA.ICON.trophy + '<span>' + (a === b ? 'A draw: ' + a + ' each!' : 'Team ' + (a > b ? 'A' : 'B') + ' wins, ' + Math.max(a, b) + ' to ' + Math.min(a, b) + '!') + '</span>'));
    }
    CA.reportHeight();
  }

  var clock = null;
  function open(c, r) {
    var t = state.topics[c], x = t.tiles[r];
    view.innerHTML = '';
    var card = el('div', { class: 'quiz-q' });
    card.appendChild(el('div', { class: 'quiz-q-head' }, '<span class="pill">' + esc(t.name) + '</span><span class="pill warn">' + x.pts + ' points</span>'));
    card.appendChild(el('p', { class: 'quiz-prompt' }, esc(x.prompt)));
    var ans = el('div', { class: 'quiz-answer' });
    if (x.show.type === 'code') {
      var split = el('div', { class: 'quiz-split' });
      split.appendChild(el('div', { class: 'code-box big' }, x.show.lines.map(function (l, i) {
        return '<div class="code-line"><span class="ln">' + (i + 1) + '</span>' + esc(l).replace(/^( +)/, function (m) { return '&nbsp;'.repeat(m.length * 2); }) + '</div>';
      }).join('')));
      split.appendChild(ans);
      card.appendChild(split);
    } else {
      card.appendChild(el('p', { class: 'quiz-expr mono' }, esc(x.show.text)));
      card.appendChild(ans);
    }
    var row = el('div', { class: 'actions' });
    var time = el('span', { class: 'quiz-clock mono' }, '');
    var timerBtn = CA.btn('30 second timer', 'secondary', function () {
      clearInterval(clock);
      var end = Date.now() + 30000;
      timerBtn.disabled = true;
      function tick() {
        var left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        time.textContent = left + ' s';
        time.classList.toggle('low', left <= 5);
        if (!left) { clearInterval(clock); time.textContent = 'Time!'; }
      }
      tick();
      clock = setInterval(tick, 250);
    }, 'clock');
    var showBtn = CA.btn('Show the answer', '', function () {
      clearInterval(clock);
      showBtn.disabled = true; timerBtn.disabled = true;
      ans.innerHTML = '<div class="worked">' + x.steps.map(function (s) { return '<div>' + esc(s) + '</div>'; }).join('') + '</div>';
      var give = el('div', { class: 'actions' });
      give.appendChild(el('span', { class: 'quiz-ans' }, 'Answer: <b class="mono">' + esc(x.answer) + '</b>'));
      [['A', 'Team A gets ' + x.pts], ['B', 'Team B gets ' + x.pts], ['none', 'No one']].forEach(function (g) {
        give.appendChild(CA.btn(g[1], g[0] === 'none' ? 'secondary' : 'team-btn team-' + g[0], function () { award(c, r, g[0]); }));
      });
      ans.insertBefore(give, ans.firstChild);
      CA.reportHeight();
    }, 'check');
    row.appendChild(timerBtn); row.appendChild(time); row.appendChild(el('span', { class: 'spacer' }));
    row.appendChild(CA.btn('Back to the board', 'secondary', function () { clearInterval(clock); drawBoard(); }));
    row.appendChild(showBtn);
    card.appendChild(row);
    view.appendChild(card);
    CA.reportHeight();
  }
  function award(c, r, who) {
    var x = state.topics[c].tiles[r];
    x.used = who;
    if (who !== 'none') state.scores[who] += x.pts;
    keep();
    res.note(state.topics[c].name + ' ' + x.pts + ': ' + (who === 'none' ? 'no one' : 'Team ' + who) + '. Scores A ' + state.scores.A + ', B ' + state.scores.B + '.');
    if (allUsed()) res.finish();
    drawTeams(); drawBoard();
  }

  drawTeams();
  drawBoard();
};
