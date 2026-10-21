// Trace Table Race: the program runs one step at a time. Before each new value is shown, the student types what it
// will be. One try per value: right scores and builds the streak, wrong shows the value and how it was worked out.
// Support (the switch) shows the line with today's values put in, fading as the student gets values right.
var TraceRace = (function () {
  'use strict';
  var el = LT.el, esc = LT.esc;
  var NOT_VARS = { int: 1, abs: 1, sqrt: 1, and: 1 };

  // The statement on a line that gave this row its value.
  function statementFor(lines, row) {
    var parts = String(lines[row.line - 1] || '').split(':').map(function (p) { return p.trim(); });
    if (row.name === 'OUTPUT') { for (var i = 0; i < parts.length; i++) if (/^OUTPUT\s/i.test(parts[i])) return { lhs: 'OUTPUT', rhs: parts[i].replace(/^OUTPUT\s+/i, '') }; }
    if (row.kind === 'for-start' || row.kind === 'for-next') {
      var m = /^FOR\s+(\w+)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i.exec(parts[0]);
      if (m) return row.kind === 'for-start' ? { lhs: m[1], rhs: m[2], text: parts[0] } : { lhs: m[1], rhs: m[1] + (m[4] ? (/^-/.test(m[4].trim()) ? ' - ' + m[4].trim().slice(1) : ' + ' + m[4].trim()) : ' + 1'), text: parts[0], next: true };
    }
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j].replace(/^IF\s.+?\sTHEN\s+/i, '').replace(/^ELSE\s+/i, '');
      var a = new RegExp('^' + row.name + '\\s*=(?!=)\\s*(.+)$', 'i').exec(p);
      if (a) return { lhs: row.name, rhs: a[1] };
    }
    return null;
  }
  // The right-hand side with each variable's latest value put in.
  function substitute(rhs, env) {
    return rhs.replace(/"[^"]*"|\b[a-z_]\w*\b/gi, function (w) {
      if (w[0] === '"') return w;
      var k = w.toLowerCase();
      if (NOT_VARS[k] || !Object.prototype.hasOwnProperty.call(env, k)) return w;
      var v = env[k];
      return typeof v === 'string' && !/^-?\d+(\.\d+)?$/.test(v) ? '"' + v + '"' : String(v);
    });
  }

  function start(host, opts) {
    var level = Math.min(5, Math.max(1, opts.level || 1)), rounds = opts.rounds || 3;
    var bar = LT.scoreBar('trace-' + level), fader = LT.supportFader('trace');
    var done = 0, cellsRight = 0, cellsAll = 0, recent = [];
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'level-name' }, 'Trace Table Race <span>Level ' + level + ': ' + esc(ACSLLoops.LEVELS[level - 1].name) + '</span>'));
    top.appendChild(bar.el);
    host.appendChild(top);
    if (window.BCSupport) { var sw = el('div', { class: 'support-slot' }); top.appendChild(sw); window.BCSupport.mountToggle(sw, 'Support'); }
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    if (window.BCSupport) window.BCSupport.onChange(function () { if (current && current.refreshHint) current.refreshHint(); });
    var current = null;
    nextProgram();

    function nextProgram() {
      var p = ACSLLoops.make(level, { maxRows: level >= 4 ? 20 : 16, avoid: recent });
      recent.push(p.src);
      var cols = [];
      p.rows.forEach(function (r) { if (r.name !== 'OUTPUT' && cols.indexOf(r.name) < 0) cols.push(r.name); });
      var hasOut = p.rows.some(function (r) { return r.name === 'OUTPUT'; });
      if (hasOut) cols.push('OUTPUT');
      stage.innerHTML = '';
      var head = el('div', { class: 'prog-head' }, '<b>Program ' + (done + 1) + ' of ' + rounds + '</b><span class="tag">' + esc(p.skill) + '</span><span class="muted">Type each new value, then press Enter.</span>');
      stage.appendChild(head);
      var grid = el('div', { class: 'trace-grid' });
      var code = LT.codeBox(p.lines);
      var tableWrap = el('div', { class: 'table-wrap' });
      var table = el('table', { class: 'trace' });
      table.innerHTML = '<thead><tr><th>Line</th>' + cols.map(function (c) { return '<th>' + esc(c === 'OUTPUT' ? 'Output' : c) + '</th>'; }).join('') + '</tr></thead>';
      var tbody = el('tbody');
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      grid.appendChild(code);
      var side = el('div', { class: 'side' });
      side.appendChild(tableWrap);
      var hint = el('div', { class: 'hint', role: 'status' });
      var fb = el('div', { class: 'feedback', role: 'status' });
      side.appendChild(hint);
      side.appendChild(fb);
      grid.appendChild(side);
      stage.appendChild(grid);
      var i = 0, env = {}, right = 0;
      current = { refreshHint: showHint };
      bar.start();
      ask();

      function cellsRow(r) {
        var tr = el('tr');
        tr.appendChild(el('td', { class: 'ln' }, String(r.line)));
        cols.forEach(function (c) { tr.appendChild(el('td', { 'data-col': c })); });
        return tr;
      }
      function ask() {
        if (i >= p.rows.length) return finishProgram();
        var r = p.rows[i];
        code.mark(r.line);
        var tr = cellsRow(r);
        tr.classList.add('now');
        var cell = tr.querySelector('[data-col="' + r.name + '"]');
        var input = el('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': (r.name === 'OUTPUT' ? 'Output' : r.name) + ' on line ' + r.line });
        cell.classList.add('target');
        cell.appendChild(input);
        tbody.appendChild(tr);
        tableWrap.scrollTop = tableWrap.scrollHeight;
        showHint();
        fb.textContent = ''; fb.className = 'feedback';
        input.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (!input.value.trim()) { fb.className = 'feedback hint-text'; fb.textContent = 'Type a value first.'; return; }
          check(r, cell, input.value);
        });
        input.focus({ preventScroll: true });
        LT.reportHeight();
      }
      function working(r) {
        var st = statementFor(p.lines, r);
        if (!st) return null;
        var sub = substitute(st.rhs, env);
        if (r.kind === 'for-start') return { text: 'Line ' + r.line + ': the FOR loop starts ' + st.lhs + ' at the first value', sub: st.lhs + ' = ' + sub };
        if (r.kind === 'for-next') return { text: 'Line ' + r.line + ': back to the FOR line, and ' + st.lhs + ' moves on by the STEP', sub: st.lhs + ' = ' + sub };
        if (st.lhs === 'OUTPUT') return { text: 'Line ' + r.line + ': OUTPUT ' + st.rhs, sub: 'OUTPUT ' + sub };
        return { text: 'Line ' + r.line + ': ' + st.lhs + ' = ' + st.rhs, sub: st.lhs + ' = ' + sub };
      }
      function showHint() {
        hint.innerHTML = '';
        if (!LT.supportOn() || i >= p.rows.length) { LT.reportHeight(); return; }
        var w = working(p.rows[i]), reveal = Math.max(fader.reveal(), 1 / 3);
        if (!w) return;
        // A substitution that is already a bare value would be the answer: show only the line then.
        var bare = /^(OUTPUT )?\w+ = -?[\d.]+$|^OUTPUT -?[\d.]+$/.test(w.sub) || /^\w+ = "[^"]*"$/.test(w.sub);
        hint.innerHTML = '<span class="hint-label">Support</span> ' + esc(w.text) + (reveal > 0.5 && !bare ? ' <span class="arrow">&rarr;</span> <code>' + esc(w.sub) + '</code>' : '. Read the latest values from the table.');
        LT.reportHeight();
      }
      function check(r, cell, typed) {
        var ok = LT.same(typed, r.value);
        var w = working(r);
        cell.innerHTML = '';
        cell.classList.remove('target');
        cell.classList.add(ok ? 'good' : 'bad');
        cell.innerHTML = ok ? esc(LT.shown(r.value)) : '<s>' + esc(typed) + '</s> ' + esc(LT.shown(r.value));
        cell.parentNode.classList.remove('now');
        cellsAll++;
        if (ok) { right++; cellsRight++; bar.right(10, 2); fader.correct(); fb.className = 'feedback'; fb.textContent = 'Right.'; }
        else {
          bar.wrong(); fader.wrong();
          fb.className = 'feedback error';
          fb.textContent = w ? w.text + '. With the values put in: ' + w.sub + ', so it is ' + LT.shown(r.value) + '.' : 'It was ' + LT.shown(r.value) + '.';
        }
        if (r.name !== 'OUTPUT') env[r.name] = r.value;
        i++;
        setTimeout(ask, ok ? 350 : 1600);
      }
      function finishProgram() {
        code.mark(0);
        done++;
        hint.innerHTML = '';
        fb.className = 'feedback';
        fb.textContent = right + ' of ' + p.rows.length + ' values right.';
        var actions = el('div', { class: 'actions' });
        var last = done >= rounds;
        var btn = el('button', { type: 'button', class: 'btn' }, '<span>' + (last ? 'See your score' : 'Next program') + '</span>' + LT.ICON.next);
        btn.addEventListener('click', function () { if (last) finishRound(); else nextProgram(); });
        actions.appendChild(btn);
        side.appendChild(actions);
        btn.focus({ preventScroll: true });
        LT.reportHeight();
      }
    }

    function finishRound() {
      bar.stop(); bar.finish();
      var s = bar.state, pct = cellsAll ? Math.round(100 * cellsRight / cellsAll) : 0;
      stage.innerHTML = '';
      var card = el('div', { class: 'result-card' });
      card.innerHTML = '<h2>Round complete</h2><div class="big-stats"><div><b>' + cellsRight + '/' + cellsAll + '</b><span>values right</span></div><div><b>' + s.points + '</b><span>points</span></div><div><b>' + s.bestStreak + '</b><span>best streak</span></div><div><b>' + LT.clockText(bar.seconds()) + '</b><span>time</span></div></div>' +
        '<p>' + (pct >= 90 ? 'Fast and accurate. Try the next level.' : pct >= 70 ? 'Good tracing. Play again to beat your score.' : 'Slow down: work out each value from the line that changes it.') + '</p>';
      var actions = el('div', { class: 'actions' });
      var again = el('button', { type: 'button', class: 'btn' }, LT.ICON.again + '<span>Play again</span>');
      again.addEventListener('click', function () { start(host, opts); });
      actions.appendChild(again);
      if (level < 5) {
        var up = el('button', { type: 'button', class: 'btn secondary' }, '<span>Level ' + (level + 1) + '</span>' + LT.ICON.next);
        up.addEventListener('click', function () { start(host, { level: level + 1, rounds: rounds }); });
        actions.appendChild(up);
      }
      card.appendChild(actions);
      stage.appendChild(card);
      LT.report('looptracer-trace-' + level, 'Loop Tracer: Trace Table Race, level ' + level,
        'Round finished: ' + cellsRight + ' of ' + cellsAll + ' values right (' + pct + '%), ' + s.points + ' points, best streak ' + s.bestStreak + ', ' + LT.clockText(bar.seconds()) + '.', pct >= 70);
      again.focus({ preventScroll: true });
      LT.reportHeight();
    }
  }
  return { start: start, statementFor: statementFor, substitute: substitute };
})();
