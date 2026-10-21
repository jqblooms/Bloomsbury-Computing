// Predict the Output: read the program, type what it outputs, one try. Then the trace is played back so the student
// sees why. Level 6 programs are contest length (hundreds of steps): the replay shows the start and the end, and a
// tip names the pattern that saves tracing every step.
var PredictRun = (function () {
  'use strict';
  var el = LT.el, esc = LT.esc;
  var TIPS = {
    'Sum of squares': 'The inner loop adds i, i times: that is i × i. So a is 1 + 4 + 9 + ... Then the last loop counts the factors of a: list them in pairs.',
    'Gauss': 'Pair the numbers from the two ends: each pair has the same total. Count the pairs.',
    'Odd numbers': 'The first n odd numbers add up to n × n. Count how many odd numbers there are.',
    'Multiples': 'Count the multiples of each number, then take away the ones counted twice (multiples of both).',
    'Factors': 'Factors come in pairs: k and n / k. Find the pairs, then add them up.',
    'Nested count': 'For each i, count how many j values the inner loop runs, then add those counts.',
    'Countdown': 'List the values of i from the start, going down by the STEP, until the next one would pass the end.',
    'Triangle': 'For each i, count how many j values the inner loop runs, then add those counts.',
    'Nested sum': 'For each i, add up what the inner loop adds. Then add those totals.'
  };

  function start(host, opts) {
    var level = Math.min(6, Math.max(1, opts.level || 1)), rounds = opts.rounds || 5;
    var bar = LT.scoreBar('predict-' + level);
    var done = 0, right = 0, recent = [], log = [];
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'level-name' }, 'Predict the Output <span>Level ' + level + ': ' + esc(ACSLLoops.LEVELS[level - 1].name) + '</span>'));
    top.appendChild(bar.el);
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    nextProgram();

    function nextProgram() {
      var p = ACSLLoops.make(level, { avoid: recent });
      recent.push(p.src);
      stage.innerHTML = '';
      stage.appendChild(el('div', { class: 'prog-head' }, '<b>Program ' + (done + 1) + ' of ' + rounds + '</b><span class="tag">' + esc(p.skill) + '</span><span class="muted">One try. Work it out, then type the output.</span>'));
      var grid = el('div', { class: 'predict-grid' });
      var code = LT.codeBox(p.lines);
      grid.appendChild(code);
      var side = el('div', { class: 'side' });
      var form = el('div', { class: 'answer-row' });
      form.appendChild(el('label', { for: 'pr-answer' }, 'Output'));
      var input = el('input', { id: 'pr-answer', type: 'text', autocomplete: 'off', spellcheck: 'false' });
      form.appendChild(input);
      var go = el('button', { type: 'button', class: 'btn' }, LT.ICON.check + '<span>Check</span>');
      form.appendChild(go);
      side.appendChild(form);
      var fb = el('div', { class: 'feedback', role: 'status' });
      side.appendChild(fb);
      var replay = el('div', { class: 'replay' });
      side.appendChild(replay);
      grid.appendChild(side);
      stage.appendChild(grid);
      bar.start();
      input.focus({ preventScroll: true });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      LT.reportHeight();

      function check() {
        var typed = input.value;
        if (!typed.trim()) { fb.className = 'feedback hint-text'; fb.textContent = 'Type the output first.'; return; }
        var ok = LT.same(typed, p.output);
        input.disabled = true; go.disabled = true;
        done++;
        if (ok) { right++; var gain = bar.right(50, 10); fb.className = 'feedback'; fb.textContent = 'Right: ' + LT.shown(p.output) + '. +' + gain + ' points.'; }
        else { bar.wrong(); fb.className = 'feedback error'; fb.innerHTML = 'You typed <s>' + esc(typed) + '</s>. It outputs <b>' + esc(LT.shown(p.output)) + '</b>. Watch the trace.'; }
        log.push((ok ? 'Right' : 'Wrong') + ' (' + p.skill + ')');
        playTrace(p, code, replay, function () {
          var actions = el('div', { class: 'actions' });
          var last = done >= rounds;
          var btn = el('button', { type: 'button', class: 'btn' }, '<span>' + (last ? 'See your score' : 'Next program') + '</span>' + LT.ICON.next);
          btn.addEventListener('click', function () { if (last) finishRound(); else nextProgram(); });
          actions.appendChild(btn);
          side.appendChild(actions);
          btn.focus({ preventScroll: true });
          LT.reportHeight();
        });
      }
    }

    // Plays the trace into a small table: every row for a short program; the first and last rows for a long one.
    function playTrace(p, code, host2, then) {
      var cols = [];
      p.rows.forEach(function (r) { if (r.name !== 'OUTPUT' && cols.indexOf(r.name) < 0) cols.push(r.name); });
      cols.push('OUTPUT');
      var long = p.rows.length > 18;
      var show = long ? p.rows.slice(0, 8).concat([null]).concat(p.rows.slice(-6)) : p.rows;
      host2.innerHTML = '';
      if (long) host2.appendChild(el('p', { class: 'muted small' }, 'The full trace has ' + p.rows.length + ' rows. Here are the first and the last.'));
      var wrap = el('div', { class: 'table-wrap short' });
      var table = el('table', { class: 'trace compact' });
      table.innerHTML = '<thead><tr><th>Line</th>' + cols.map(function (c) { return '<th>' + esc(c === 'OUTPUT' ? 'Output' : c) + '</th>'; }).join('') + '</tr></thead>';
      var tb = el('tbody');
      table.appendChild(tb);
      wrap.appendChild(table);
      host2.appendChild(wrap);
      var k = 0;
      (function step() {
        if (k >= show.length) {
          code.mark(0);
          if (TIPS[p.skill] && (long || level >= 5)) host2.appendChild(el('p', { class: 'tip' }, '<b>Spot the pattern.</b> ' + esc(TIPS[p.skill])));
          LT.reportHeight();
          then();
          return;
        }
        var r = show[k++];
        var tr = el('tr');
        if (!r) { tr.innerHTML = '<td colspan="' + (cols.length + 1) + '" class="gap">...</td>'; tb.appendChild(tr); setTimeout(step, 200); return; }
        tr.appendChild(el('td', { class: 'ln' }, String(r.line)));
        cols.forEach(function (c) { tr.appendChild(el('td', c === r.name ? { class: 'filled' } : {}, c === r.name ? esc(LT.shown(r.value)) : '')); });
        tb.appendChild(tr);
        code.mark(r.line);
        wrap.scrollTop = wrap.scrollHeight;
        LT.reportHeight();
        setTimeout(step, 260);
      })();
    }

    function finishRound() {
      bar.stop(); bar.finish();
      var s = bar.state;
      stage.innerHTML = '';
      var card = el('div', { class: 'result-card' });
      card.innerHTML = '<h2>Round complete</h2><div class="big-stats"><div><b>' + right + '/' + rounds + '</b><span>outputs right</span></div><div><b>' + s.points + '</b><span>points</span></div><div><b>' + s.bestStreak + '</b><span>best streak</span></div><div><b>' + LT.clockText(bar.seconds()) + '</b><span>time</span></div></div>' +
        '<p>' + (right === rounds ? 'Every one right. Try a harder level.' : right >= rounds * 0.6 ? 'Good. Play again for a longer streak.' : 'Trace slowly with a table, then get faster.') + '</p>';
      var actions = el('div', { class: 'actions' });
      var again = el('button', { type: 'button', class: 'btn' }, LT.ICON.again + '<span>Play again</span>');
      again.addEventListener('click', function () { start(host, opts); });
      actions.appendChild(again);
      if (level < 6) {
        var up = el('button', { type: 'button', class: 'btn secondary' }, '<span>Level ' + (level + 1) + '</span>' + LT.ICON.next);
        up.addEventListener('click', function () { start(host, { level: level + 1, rounds: rounds }); });
        actions.appendChild(up);
      }
      card.appendChild(actions);
      stage.appendChild(card);
      LT.report('looptracer-predict-' + level, 'Loop Tracer: Predict the Output, level ' + level,
        'Round finished: ' + right + ' of ' + rounds + ' outputs right, ' + s.points + ' points, ' + LT.clockText(bar.seconds()) + '. ' + log.join(', ') + '.', right >= Math.ceil(rounds * 0.6));
      again.focus({ preventScroll: true });
      LT.reportHeight();
    }
  }
  return { start: start, TIPS: TIPS };
})();
