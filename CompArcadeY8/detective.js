// Loop Detective (?mode=detective): mystery ACSL programs. Name what each one outputs, one try per case. Two cases
// solved at a rank and you are promoted; two missed and the rank starts again with new cases. Ranks: FOR loops with
// totals and counters, STEP, WHILE, nested loops, then IF inside a loop. A clue shows the first rows of the trace
// table for half the points. After every case the whole trace table is shown as the evidence.
(function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var RANKS = [
    { name: 'Rookie', what: 'FOR loops: totals and counters', level: 1 },
    { name: 'Constable', what: 'FOR loops with STEP', level: 2 },
    { name: 'Sergeant', what: 'WHILE loops', level: 3 },
    { name: 'Inspector', what: 'Nested loops', level: 4 },
    { name: 'Chief', what: 'IF inside a loop', level: 5 }
  ];
  var NEED = 2, PASS_RANK = 3, CLUE_ROWS = 4;

  function traceTable(q, upto) {
    var cols = [];
    q.rows.forEach(function (r) { if (r.name !== 'OUTPUT' && cols.indexOf(r.name) < 0) cols.push(r.name); });
    var hasOut = q.rows.some(function (r) { return r.name === 'OUTPUT'; });
    if (hasOut) cols.push('OUTPUT');
    var rows = upto != null ? q.rows.slice(0, upto) : q.rows;
    return '<table class="trace"><tr><th>Line</th>' + cols.map(function (c) { return '<th>' + (c === 'OUTPUT' ? 'Output' : esc(c)) + '</th>'; }).join('') + '</tr>' +
      rows.map(function (r) {
        return '<tr><td class="ln">' + r.line + '</td>' + cols.map(function (c) { return '<td>' + (c === r.name ? esc(r.value === '' ? '""' : r.value) : '') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table>';
  }

  CA.modes.detective = function (host) {
    var log = CA.results('Loop Detective');
    var st = null;
    var bar = el('div', { class: 'gbar' }), body = el('div');
    host.appendChild(bar); host.appendChild(body);

    function drawBar() {
      if (!st) { bar.innerHTML = '<span class="pill">' + CA.ICON.search + ' Loop Detective</span>'; return; }
      var r = '';
      RANKS.forEach(function (x, i) { r += '<span class="rank' + (i < st.rank ? ' done' : i === st.rank ? ' now' : '') + '">' + x.name + '</span>'; });
      bar.innerHTML = '<span class="ranks">' + r + '</span><span class="spacer"></span>' + CA.chip('Solved', st.solved + ' of ' + NEED) + CA.chip('Score', st.score);
    }

    function intro() {
      st = null; drawBar();
      body.innerHTML = '<h2>Solve the mystery programs</h2><p>Each case is a program. Work out exactly what it outputs. One try per case.</p>' +
        '<ul class="rules"><li>Solve ' + NEED + ' cases at a rank to be promoted. Miss ' + NEED + ' and that rank starts again with new cases.</li>' +
        '<li>Ranks: ' + RANKS.map(function (r) { return r.name; }).join(', ') + '. Each one is a new kind of loop.</li>' +
        '<li>Stuck? A clue shows the first rows of the trace table, for half the points.</li></ul>' +
        (CA.best('detective') ? '<p class="small">Best score on this computer: <b>' + CA.best('detective') + '</b></p>' : '');
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.play + ' Open the first case');
      go.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(go); body.appendChild(row);
      CA.reportHeight();
    }
    function start() { st = { rank: 0, solved: 0, missed: 0, score: 0, cases: 0, right: 0, seen: [], topRank: 0 }; open(); }

    function open() {
      var R = RANKS[Math.min(st.rank, RANKS.length - 1)], q = Y8Gen.question('loop', R.level, st.seen), clue = false, busy = false;
      st.seen.push(q.show); st.cases++;
      drawBar();
      body.innerHTML = '';
      var grid = el('div', { class: 'cols' }), leftCol = el('div'), rightCol = el('div');
      leftCol.innerHTML = '<div><span class="tag">Case ' + st.cases + '</span><span class="tag">' + esc(R.what) + '</span></div>' + CA.codeBox(q.show);
      rightCol.appendChild(el('p', { class: 'ask' }, 'What does this program output?'));
      var row = el('div', { class: 'actions' });
      var input = el('input', { class: 'answer-in', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'What the program outputs', placeholder: 'Output' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Solve');
      var clueBtn = el('button', { type: 'button', class: 'btn secondary' }, 'Clue (half points)');
      row.appendChild(input); row.appendChild(go); row.appendChild(clueBtn);
      rightCol.appendChild(row);
      var fb = el('div', { class: 'feedback' }), ev = el('div');
      rightCol.appendChild(fb); rightCol.appendChild(ev);
      grid.appendChild(leftCol); grid.appendChild(rightCol);
      body.appendChild(grid);
      clueBtn.addEventListener('click', function () {
        if (busy || clue) return;
        clue = true; clueBtn.disabled = true;
        ev.innerHTML = '<p class="small" style="margin:8px 0 0">Clue: the first rows of the trace table. Keep going from here.</p><div class="evidence">' + traceTable(q, Math.min(CLUE_ROWS, q.rows.length - 1)) + '</div>';
        CA.reportHeight();
      });
      function check() {
        if (busy) return;
        if (!input.value.trim()) { CA.say(fb, 'Type what the program outputs.', 'hint'); return; }
        busy = true; input.disabled = true; go.disabled = true; clueBtn.disabled = true; row.style.display = 'none';
        var ok = q.check(input.value), base = 100 * (st.rank + 1), pts = clue ? base / 2 : base;
        log.add(RANKS[st.rank].name + ' case, ' + q.skill + ' (output ' + q.answer + '): typed ' + input.value.trim() + (clue ? ', with a clue' : ''), ok);
        var msg;
        if (ok) { st.solved++; st.right++; st.score += pts; msg = 'Case solved. <span class="pop">+' + pts + '</span>'; }
        else { st.missed++; msg = 'Not this time: you typed <b>' + esc(input.value.trim()) + '</b>. The program outputs <b>' + esc(q.answer) + '</b>.'; }
        var promoted = st.solved >= NEED, restart = st.missed >= NEED;
        if (promoted) {
          if (st.rank < RANKS.length - 1) { st.rank++; msg += ' Promoted to <b>' + RANKS[st.rank].name + '</b>!'; }
          else msg += ' You are a Chief detective. Keep solving bonus cases.';
          st.solved = 0; st.missed = 0;
          st.topRank = Math.max(st.topRank, st.rank);
          if (st.topRank >= PASS_RANK) log.finish();
        } else if (restart) {
          st.solved = 0; st.missed = 0;
          msg += ' Two missed: new cases at this rank.';
        }
        CA.best('detective', st.score);
        drawBar();
        CA.say(fb, msg, ok ? '' : 'bad');
        ev.innerHTML = '<p class="small" style="margin:8px 0 0"><b>The evidence:</b> the trace table, a row for each new value.</p><div class="evidence">' + traceTable(q) + '</div>';
        var nx = el('button', { type: 'button', class: 'btn' }, CA.ICON.next + ' Next case');
        nx.addEventListener('click', open);
        var stop = el('button', { type: 'button', class: 'btn secondary' }, 'Case closed');
        stop.addEventListener('click', finish);
        var r2 = el('div', { class: 'actions' }); r2.appendChild(nx); r2.appendChild(stop); ev.appendChild(r2);
        CA.focusSoon(nx);
        CA.reportHeight();
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      CA.focusSoon(input);
      CA.reportHeight();
    }

    function finish() {
      var s = st, old = CA.best('detective', s.score);
      log.note('Rank reached: ' + RANKS[s.topRank].name + '. Score ' + s.score + '.');
      drawBar();
      body.innerHTML = '<h2>Case closed</h2><div class="big-score">' + s.score + '</div>' +
        '<div class="summary-grid"><div><span class="small">Rank</span><b>' + RANKS[s.topRank].name + '</b></div>' +
        '<div><span class="small">Cases solved</span><b>' + s.right + ' of ' + (s.cases) + '</b></div>' +
        '<div><span class="small">Best on this computer</span><b>' + Math.max(old, s.score) + '</b></div></div>' +
        (s.topRank >= PASS_RANK ? CA.doneBanner('Promoted to ' + RANKS[PASS_RANK].name + ': passed.') : '<p class="small">Reach ' + RANKS[PASS_RANK].name + ' to pass.</p>');
      var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.play + ' New investigation');
      again.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(again); body.appendChild(row);
      CA.reportHeight();
    }

    intro();
  };
})();
