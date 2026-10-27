// Bit Switch Board (?game=bits&ops=logic|shift): flip the answer switches to show the result of a bit-string
// operation, then press Check. One check per round: a wrong board costs a heart, and the right board is shown.
// logic: NOT, then AND and OR (4 bits), then XOR, then all four (5 bits).
// shift: LSHIFT-1 and RSHIFT-1, then LCIRC-1 and RCIRC-1, then all four, then two steps (brackets first, or -2).
CA.games.bits = function (host) {
  'use strict';
  var G = CompGenY7, B = BitCore, el = CA.el, esc = CA.esc;
  var ops = CA.params.get('ops') === 'shift' ? 'shift' : 'logic';
  var NEED = Math.max(1, Math.min(4, Number(CA.params.get('rounds')) || 2)), MAXH = 3;
  var LEVELS = ops === 'logic' ? [
    { name: 'Level 1: NOT', kinds: ['not'], len: 4 },
    { name: 'Level 2: AND and OR', kinds: ['and', 'or'], len: 4 },
    { name: 'Level 3: XOR', kinds: ['xor'], len: 5 },
    { name: 'Level 4: all four', kinds: ['not', 'and', 'or', 'xor'], len: 5 }
  ] : [
    { name: 'Level 1: LSHIFT and RSHIFT', kinds: ['lshift', 'rshift'], len: 5 },
    { name: 'Level 2: LCIRC and RCIRC', kinds: ['lcirc', 'rcirc'], len: 5 },
    { name: 'Level 3: all four', kinds: ['lshift', 'rshift', 'lcirc', 'rcirc'], len: 5 },
    { name: 'Level 4: two steps', kinds: ['two', 'shift2'], len: 5 }
  ];
  var res = CA.results('bits-' + ops, 'Bit Switch Board (' + (ops === 'logic' ? 'NOT, AND, OR, XOR' : 'shifts and circulates') + ')');
  var st = { li: 0, have: 0, hearts: MAXH, score: 0, streak: 0, mistakes: 0, q: null, rows: [], checked: false, seen: {}, lastKind: null };

  host.innerHTML = '';
  host.appendChild(el('div', { class: 'game-head' }, '<h1>Bit Switch Board</h1><span class="muted">' + (ops === 'logic' ? 'NOT, AND, OR, XOR' : 'Shifts and circulates') + '</span>'));
  var bar = CA.topbar(host);
  var board = el('div', { class: 'switch-board' });
  host.appendChild(board);
  var exprLine = el('p', { class: 'expr-line mono' });
  var rule = el('p', { class: 'rule-line' });
  var grid = el('div', { class: 'bit-grid' });
  var action = el('div', { class: 'actions' });
  var fb = el('div', { class: 'feedback' });
  board.appendChild(exprLine); board.appendChild(grid); board.appendChild(rule); board.appendChild(action); board.appendChild(fb);

  function level() { return LEVELS[st.li]; }
  function drawBar() { bar.set({ level: level().name, have: st.have, need: NEED, score: st.score, streak: st.streak, hearts: st.hearts }); }

  function lampRow(label, bits, cls) {
    var row = el('div', { class: 'bit-row' + (cls ? ' ' + cls : '') });
    row.appendChild(el('span', { class: 'bit-label mono' }, esc(label)));
    var cells = el('span', { class: 'cells' });
    bits.split('').forEach(function (b, i) { cells.appendChild(el('span', { class: 'lamp c' + i + (b === '1' ? ' on' : '') }, b)); });
    row.appendChild(cells);
    return row;
  }
  function switchRow(label, len) {
    var row = el('div', { class: 'bit-row answer-row' }), value = [];
    row.appendChild(el('span', { class: 'bit-label mono' }, esc(label)));
    var cells = el('span', { class: 'cells' });
    for (var i = 0; i < len; i++) {
      value.push('0');
      (function (k) {
        var sw = el('button', { type: 'button', class: 'switch c' + k, 'aria-label': label + ' bit ' + (k + 1) + ', now 0', 'aria-pressed': 'false' }, '0');
        sw.addEventListener('click', function () {
          if (st.checked) return;
          value[k] = value[k] === '1' ? '0' : '1';
          sw.textContent = value[k];
          sw.classList.toggle('on', value[k] === '1');
          sw.setAttribute('aria-pressed', value[k] === '1' ? 'true' : 'false');
          sw.setAttribute('aria-label', label + ' bit ' + (k + 1) + ', now ' + value[k]);
        });
        cells.appendChild(sw);
      })(i);
    }
    row.appendChild(cells);
    return { row: row, cells: cells, get: function () { return value.join(''); } };
  }
  function opLabel(q) { return q.kind === 'not' ? 'NOT' : /shift|circ/.test(q.kind) && q.kind !== 'shift2' ? q.op + '-1' : q.op; }

  function newRound() {
    var lv = level(), kinds = lv.kinds.slice();
    if (kinds.length > 1 && st.lastKind) kinds = kinds.filter(function (k) { return k !== st.lastKind; }).concat(kinds.length > 2 ? [st.lastKind] : []);
    var kind = G.pick(kinds);
    st.lastKind = kind;
    st.q = G.bitsQ(kind, lv.len);
    st.checked = false;
    var q = st.q;
    exprLine.innerHTML = esc(q.expr);
    grid.innerHTML = '';
    st.rows = [];
    if (kind === 'two') {
      var x = q.two;
      if (x.inner === 'NOT') grid.appendChild(lampRow('NOT', q.a));
      else { grid.appendChild(lampRow('', q.a)); grid.appendChild(lampRow(x.inner, q.b)); }
      grid.appendChild(el('div', { class: 'rule-gap' }));
      st.rows.push({ want: x.mid, sw: switchRow('( )', q.len), name: 'the brackets' });
      grid.appendChild(st.rows[0].sw.row);
      grid.appendChild(el('div', { class: 'bit-row op-only' }, '<span class="bit-label mono">' + esc(q.op === 'NOT' ? 'NOT' : q.op + '-1') + '</span><span class="cells muted small">the brackets row</span>'));
      st.rows.push({ want: q.answer, sw: switchRow('=', q.len), name: 'the answer' });
      grid.appendChild(st.rows[1].sw.row);
    } else if (kind === 'shift2') {
      grid.appendChild(lampRow('', q.a));
      var one = B.shift(q.op, 1, q.a);
      st.rows.push({ want: one, sw: switchRow(q.op + '-1', q.len), name: 'the first move' });
      st.rows.push({ want: q.answer, sw: switchRow(q.op + '-1', q.len), name: 'the second move' });
      grid.appendChild(st.rows[0].sw.row); grid.appendChild(st.rows[1].sw.row);
    } else {
      if (q.b) { grid.appendChild(lampRow('', q.a)); grid.appendChild(lampRow(q.op, q.b)); }
      else grid.appendChild(lampRow(opLabel(q), q.a));
      grid.appendChild(el('div', { class: 'rule-gap' }));
      st.rows.push({ want: q.answer, sw: switchRow('=', q.len), name: 'the answer' });
      grid.appendChild(st.rows[0].sw.row);
    }
    // The rule shows the first two times a kind comes up, then hides behind a button.
    var times = st.seen[kind] = (st.seen[kind] || 0) + 1;
    var ruleText = q.working[0] + (kind === 'two' || kind === 'shift2' ? ' ' + (q.working[1] || '') : '');
    rule.innerHTML = '';
    if (times <= 2) rule.innerHTML = '<b>Rule:</b> ' + esc(ruleText);
    else {
      var show = el('button', { type: 'button', class: 'link-btn' }, 'Show the rule');
      show.addEventListener('click', function () { rule.innerHTML = '<b>Rule:</b> ' + esc(ruleText); CA.reportHeight(); });
      rule.appendChild(show);
    }
    action.innerHTML = '';
    action.appendChild(el('span', { class: 'small muted' }, 'Click a switch to flip it. You get one check.'));
    action.appendChild(CA.btn('Check', '', check, 'check'));
    CA.say(fb, '', '');
    drawBar();
    CA.reportHeight();
  }

  function check() {
    if (st.checked) return;
    st.checked = true;
    var q = st.q, ok = true;
    st.rows.forEach(function (r) {
      var got = r.sw.get();
      if (got !== r.want) ok = false;
      Array.prototype.forEach.call(r.sw.cells.children, function (sw, i) { sw.disabled = true; sw.classList.add(got[i] === r.want[i] ? 'good' : 'bad'); });
    });
    action.innerHTML = '';
    var why = explain(q);
    if (ok) {
      st.streak++; st.score += CA.points(st.streak) + (st.rows.length > 1 ? 5 : 0); st.have++;
      CA.say(fb, 'Right! ' + esc(q.expr) + ' = <b class="mono">' + q.answer + '</b>' + (why ? '<br><span class="small">' + why + '</span>' : ''), '');
    } else {
      st.hearts--; st.mistakes++; st.streak = 0; st.have = 0;
      CA.shake(grid);
      // Each wrong switch now shows the right bit (red ring), so the board shows the right answer without growing.
      st.rows.forEach(function (r) {
        Array.prototype.forEach.call(r.sw.cells.children, function (sw, i) {
          if (sw.classList.contains('bad')) { sw.textContent = r.want[i]; sw.classList.toggle('on', r.want[i] === '1'); }
        });
      });
      CA.say(fb, 'Not this time: <b class="mono">' + q.answer + '</b>. Switches in a red ring were wrong; they now show the right bit. This round does not count, and the count starts again: you need ' + NEED + ' right in a row.' + (why ? '<br><span class="small">' + why + '</span>' : ''), 'bad');
    }
    res.add(q.expr + ' = ' + q.answer, ok);
    drawBar();
    if (st.hearts <= 0) {
      action.appendChild(CA.btn('Try ' + level().name.split(':')[0] + ' again', '', function () { st.hearts = MAXH; st.have = 0; newRound(); }, 'redo'));
      CA.say(fb, fb.innerHTML + '<br>Out of hearts. Try this level again with new bits.', 'bad');
    } else if (st.have >= NEED) {
      if (st.li === LEVELS.length - 1) action.appendChild(CA.btn('See your stars', '', finish, 'star'));
      else action.appendChild(CA.btn('Next level', '', function () { st.li++; st.have = 0; st.hearts = MAXH; newRound(); }, 'next'));
    } else action.appendChild(CA.btn('Next round', '', newRound, 'next'));
    CA.reportHeight();
  }
  // One line on why the answer is what it is: which bit fell off or came back.
  function explain(q) {
    var a = q.a, L = q.len;
    if (q.kind === 'lshift') return 'The left bit ' + a[0] + ' fell off. A 0 came in on the right.';
    if (q.kind === 'rshift') return 'The right bit ' + a[L - 1] + ' fell off. A 0 came in on the left.';
    if (q.kind === 'lcirc') return 'The left bit ' + a[0] + ' came back on the right.';
    if (q.kind === 'rcirc') return 'The right bit ' + a[L - 1] + ' came back on the left.';
    if (q.kind === 'two') return 'Brackets first: ' + esc(q.two.inside) + ' = ' + q.two.mid + '. Then ' + esc(q.op === 'NOT' ? 'NOT' : q.op + '-1') + ' gives ' + q.answer + '.';
    if (q.kind === 'shift2') return 'One move gives ' + B.shift(q.op, 1, a) + '. A second move gives ' + q.answer + '.';
    return '';
  }
  function finish() {
    res.finish();
    board.style.display = 'none';
    var end = el('div', { class: 'end' });
    end.innerHTML = CA.endCard({ game: 'bits-' + ops, score: st.score, stars: CA.starsFor(st.mistakes), title: 'Switch board cleared!',
      text: ops === 'logic' ? 'NOT, AND, OR and XOR, one column at a time.' : 'Shifts lose a bit. Circulates bring it back.' });
    var row = el('div', { class: 'actions center' });
    row.appendChild(CA.btn('Play again', 'secondary', function () { end.remove(); board.style.display = ''; st.li = 0; st.have = 0; st.hearts = MAXH; st.score = 0; st.streak = 0; st.mistakes = 0; st.seen = {}; newRound(); }, 'redo'));
    end.appendChild(row);
    host.appendChild(end);
    CA.reportHeight();
  }

  newRound();
};
