// Binary Addition Rules: the page. Four stages as tabs, questions forever, 3 in a row masters a question.
(function () {
  'use strict';
  var SAVE_KEY = 'bc-binrules-v1';
  var reduce = Fx.reduce;
  var state = load();

  function load() {
    try { var raw = localStorage.getItem(SAVE_KEY); return BAR.fixState(raw ? JSON.parse(raw) : null); } catch (e) { return BAR.newState(); }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el('button', 'btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function ones(n) { return n === 1 ? '1 one' : n + ' ones'; }
  function word(n) { return BAR.WORDS[n] + (n === 1 ? ' 1' : ' 1s'); }

  // ---------- page skeleton ----------
  var main = document.querySelector('main');
  main.innerHTML =
    '<header class="top"><h1 class="title">Binary Addition Rules</h1>' +
    '<div class="overall"><span class="overall-text"></span><span class="meter"><i></i></span></div></header>' +
    '<nav class="tabs" role="tablist" aria-label="Stages"></nav>' +
    '<section class="panel stage" role="tabpanel">' +
    '<div class="stage-head"><h2 class="stage-name"></h2><button type="button" class="how-btn" aria-expanded="false">How it works</button></div>' +
    '<div class="how" hidden></div>' +
    '<div class="suggest" hidden></div>' +
    '<p class="q-text"></p><div class="q"></div>' +
    '<div class="feedback" aria-live="polite"></div><div class="actions"></div></section>' +
    '<section class="panel mastery"><div class="mastery-head"><h2>Mastery</h2><span class="small">3 right in a row masters a question. Mastered questions still come back.</span></div><div class="chips"></div></section>';
  var tabsEl = main.querySelector('.tabs'), qText = main.querySelector('.q-text'), qArea = main.querySelector('.q');
  var fbEl = main.querySelector('.feedback'), actions = main.querySelector('.actions'), chipsEl = main.querySelector('.chips');
  var howBtn = main.querySelector('.how-btn'), howEl = main.querySelector('.how'), suggestEl = main.querySelector('.suggest');

  function fb(html, kind) { fbEl.className = 'feedback' + (kind ? ' ' + kind : ''); fbEl.innerHTML = html || ''; }

  // ---------- column pictures ----------
  // rows: carry, top, bottom, answer; each value is 0, 1, null (an empty box), 'none' (nothing) or 'faint'.
  // edit: { carry: [bool], answer: [bool] } makes a box tappable.
  function grid(o) {
    var g = el('div', 'sum sum-' + (o.size || 'big'));
    g.style.setProperty('--cols', o.cols);
    var cells = { carry: [], top: [], bottom: [], answer: [] };
    function lab(t, cls) { g.appendChild(el('div', 'lab' + (cls ? ' ' + cls : ''), t)); }
    if (o.heads) { lab(''); o.heads.forEach(function (h) { g.appendChild(el('div', 'head', h)); }); }
    ['carry', 'top', 'bottom', 'line', 'answer'].forEach(function (row) {
      if (row === 'line') { lab(''); g.appendChild(el('div', 'line')); return; }
      lab(row === 'carry' ? 'carry' : row === 'bottom' ? '+' : '', row === 'bottom' ? 'plus' : '');
      for (var c = 0; c < o.cols; c++) {
        var v = o.rows[row][c];
        var editable = o.edit && o.edit[row] && o.edit[row][c];
        var cell;
        if (editable) {
          cell = el('button', 'cell edit');
          cell.type = 'button';
          cell.dataset.row = row;
          cell.dataset.col = c;
          cell.setAttribute('aria-label', (row === 'carry' ? 'Carry box' : 'Answer box') + ', column ' + (o.cols - c) + ' from the right');
          setCell(cell, '');
        } else if (v === 'none') cell = el('div', 'cell none');
        else if (v === 'faint') cell = el('div', 'cell faint');
        else { cell = el('div', 'cell ' + (v == null ? 'blank' : 'given')); setCell(cell, v == null ? '' : String(v)); }
        if (row === 'carry') cell.classList.add('carry');
        cells[row].push(cell);
        g.appendChild(cell);
      }
    });
    g.cells = cells;
    return g;
  }
  function setCell(cell, v) {
    cell.dataset.v = v;
    cell.textContent = v;
    cell.classList.toggle('one', v === '1');
  }
  function val(cell) { return cell && cell.dataset.v === '1' ? 1 : 0; }

  // Highlights each box in turn and counts the 1s with a badge on each.
  function countAnim(list, done) {
    var n = 0, i = 0;
    function stepIt() {
      if (i >= list.length) { if (done) done(n); return; }
      var c = list[i++];
      c.classList.add('look');
      if (val(c)) { n++; c.classList.add('counted'); var b = el('span', 'badge', String(n)); c.appendChild(b); }
      later(stepIt, 600);
    }
    stepIt();
  }
  function clearMarks(g) {
    g.querySelectorAll('.cell').forEach(function (c) { c.classList.remove('look', 'counted', 'walkcol'); var b = c.querySelector('.badge'); if (b) b.remove(); });
  }

  // Flies a digit from one box to another and writes it there.
  function fly(from, to, text, done) {
    if (reduce || !from) { setCell(to, text); to.classList.add('placed'); if (done) done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var f = el('div', 'flyer', text === '' ? '' : text);
    f.style.left = a.left + 'px'; f.style.top = a.top + 'px'; f.style.width = b.width + 'px'; f.style.height = b.height + 'px';
    document.body.appendChild(f);
    setTimeout(function () { f.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px)'; }, 20);
    later(function () { f.remove(); setCell(to, text); to.classList.add('placed'); if (done) done(); }, 620);
  }
  // Places the rule's result: the answer bit at the bottom of this column, a carry at the top of the next.
  function placeRule(fromCell, bottomCell, nextCarryCell, n, done) {
    var r = BAR.rule(n);
    fly(fromCell, bottomCell, String(r.write), function () {
      if (nextCarryCell && r.carry) fly(fromCell, nextCarryCell, '1', done);
      else { if (nextCarryCell) setCell(nextCarryCell, ''); if (done) done(); }
    });
  }

  // ---------- tabs, chips, header ----------
  function drawTabs() {
    tabsEl.innerHTML = '';
    var sug = suggestion();
    BAR.STAGES.forEach(function (st, i) {
      var c = BAR.counts(state, st.id);
      var t = el('button', 'tab' + (st.id === state.stage ? ' on' : '') + (BAR.stageDone(state, st.id) ? ' done' : '') + (sug === st.id ? ' suggested' : ''),
        '<span class="num">' + (i + 1) + '</span><span class="tname">' + st.name + '</span><span class="tcount">' + c.have + '/' + c.total + '</span>');
      t.type = 'button';
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', st.id === state.stage ? 'true' : 'false');
      t.addEventListener('click', function () { goStage(st.id); });
      tabsEl.appendChild(t);
    });
  }
  function suggestion() {
    if (!BAR.stageDone(state, state.stage)) return null;
    var i = BAR.STAGES.findIndex(function (s) { return s.id === state.stage; });
    for (var k = 1; k < BAR.STAGES.length; k++) {
      var s = BAR.STAGES[(i + k) % BAR.STAGES.length];
      if (!BAR.stageDone(state, s.id)) return s.id;
    }
    return null;
  }
  function drawHeader() {
    var c = BAR.counts(state);
    main.querySelector('.overall-text').textContent = c.have + ' of ' + c.total + ' mastered';
    main.querySelector('.meter i').style.width = (100 * c.have / c.total) + '%';
    var sug = suggestion();
    suggestEl.hidden = !sug && !BAR.stageDone(state, state.stage);
    suggestEl.innerHTML = '';
    if (BAR.stageDone(state, state.stage)) {
      var st = BAR.stage(sug);
      suggestEl.appendChild(el('span', '', sug ? 'You mastered this stage. Ready for the next one?' : 'You mastered every stage. Keep practising to keep it strong.'));
      if (sug) suggestEl.appendChild(btn('Go to stage ' + (BAR.STAGES.indexOf(st) + 1) + ': ' + st.name, 'small-btn', function () { goStage(sug); }));
    }
  }
  function chipLabel(sid, it) {
    if (sid === 'count' || sid === 'place') {
      var p = BAR.parsePattern(it);
      return '<span class="stack" aria-hidden="true"><i>' + (p.carry ? '1' : '') + '</i><i>' + p.top + '</i><i>' + p.bottom + '</i></span>' +
        '<span class="sr">carry ' + p.carry + ', ' + p.top + ', ' + p.bottom + '</span>';
    }
    if (sid === 'rule') return '<span class="clabel">' + ones(+it) + '</span>';
    return '<span class="clabel">' + it + '-bit</span>';
  }
  function drawChips() {
    chipsEl.innerHTML = '';
    var sid = state.stage, open = BAR.openItems(state, sid);
    BAR.stage(sid).items.forEach(function (it) {
      var rec = state.items[BAR.key(sid, it)], locked = open.indexOf(it) < 0;
      var chip = el('div', 'chip' + (rec.mastered ? ' mastered' : '') + (locked ? ' locked' : '') + (cur && cur.item === it ? ' now' : ''));
      chip.dataset.item = it;
      var dots = '';
      for (var i = 0; i < BAR.NEED; i++) dots += '<i class="' + (i < rec.streak ? 'on' : '') + '"></i>';
      chip.innerHTML = chipLabel(sid, it) + (locked ? '<span class="lock">' + LOCK + '</span>' : '<span class="dots" aria-label="' + rec.streak + ' of 3 in a row">' + dots + '</span>');
      if (rec.mastered) chip.title = 'Mastered';
      chipsEl.appendChild(chip);
    });
  }
  var LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-label="locked"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  // ---------- How it works ----------
  var HOW = {
    count: function () {
      var d = el('div', '', '<p>Count every 1 in the column: the carry and the two bits. A blank carry box means no carry, so it counts as 0.</p>');
      var row = el('div', 'how-row');
      row.appendChild(grid({ cols: 1, size: 'mini', rows: { carry: [1], top: [0], bottom: [1], answer: ['none'] } }));
      row.appendChild(el('span', '', 'carry 1, then 0, then 1: <b>2 ones</b>'));
      d.appendChild(row);
      return d;
    },
    rule: function () {
      var d = el('div', '', '<p>The number of 1s tells you what to write. The next column is the one on the left.</p>');
      var t = el('div', 'rule-table');
      [0, 1, 2, 3].forEach(function (n) { t.appendChild(el('div', 'rule-line', '<b>' + ones(n) + '</b><span>' + BAR.RULE_TEXT[n] + '</span>')); });
      d.appendChild(t);
      return d;
    },
    place: function () {
      var d = el('div', '', '<p>Count the 1s, then use the rule. Tap the box under the line to write 0 or 1. Tap the carry box of the next column (on the left) to put a carry 1 there.</p>');
      var row = el('div', 'how-row');
      row.appendChild(grid({ cols: 2, size: 'mini', rows: { carry: [1, 1], top: ['faint', 1], bottom: ['faint', 0], answer: ['none', 0] } }));
      row.appendChild(el('span', '', '2 ones: <b>0</b> at the bottom, carry <b>1</b> to the top of the next column'));
      d.appendChild(row);
      return d;
    },
    add: function () {
      var d = el('div', '', '<p>Start at the right. One column at a time: count the 1s, write the bottom bit, carry 1 to the top of the next column on the left. Tap a box or type 0 or 1. Arrow keys move. Enter checks.</p>');
      var row = el('div', 'how-row');
      row.appendChild(grid({ cols: 3, size: 'mini', rows: { carry: [1, 1, null], top: [0, 1, 1], bottom: [0, 0, 1], answer: [1, 1, 0] } }));
      row.appendChild(el('span', '', '3 + 1 = 4'));
      d.appendChild(row);
      return d;
    }
  };
  howBtn.addEventListener('click', function () {
    var open = howEl.hidden;
    howEl.hidden = !open;
    howBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    try { localStorage.setItem(SAVE_KEY + ':how', open ? '1' : '0'); } catch (e) {}
  });
  function drawStageHead() {
    var st = BAR.stage(state.stage);
    main.querySelector('.stage-name').textContent = 'Stage ' + (BAR.STAGES.indexOf(st) + 1) + ': ' + st.name;
    howEl.innerHTML = '';
    howEl.appendChild(HOW[state.stage]());
  }

  // ---------- flow ----------
  var cur = null, lastItem = {};
  function goStage(id) {
    state.stage = id;
    save();
    drawTabs(); drawStageHead(); drawHeader();
    nextQuestion();
  }
  function nextQuestion() {
    clearTimers();
    document.querySelectorAll('.flyer').forEach(function (f) { f.remove(); });
    var sid = state.stage;
    var item = BAR.pickItem(state, sid, lastItem[sid]);
    lastItem[sid] = item;
    cur = { stage: sid, item: item, answered: false };
    qArea.innerHTML = ''; fb(''); actions.innerHTML = '';
    ({ count: askCount, rule: askRule, place: askPlace, add: askAdd })[sid]();
    drawChips();
  }
  function showNext(label) {
    actions.innerHTML = '';
    var b = btn(label || 'Next question', 'next-btn', nextQuestion);
    actions.appendChild(b);
    b.focus({ preventScroll: true });
  }
  // Records one answer and celebrates.
  function score(ok) {
    var res = BAR.record(state, cur.stage, cur.item, ok);
    save();
    drawTabs(); drawHeader(); drawChips();
    var chip = chipsEl.querySelector('.chip[data-item="' + cur.item + '"]');
    if (res.newlyMastered && chip) {
      chip.classList.add('glow');
      setTimeout(function () { chip.classList.remove('glow'); }, 2600);
      var c = Fx.centre(chip);
      if (c.seen) Fx.burst(c.x, c.y, 70);
      var f = Fx.centre(fbEl);
      Fx.burst(f.x, f.y, 50);
    }
    if (res.allDone) { Fx.rainbow(6000); Fx.shower(260); celebrateBanner('You mastered every rule. Amazing!'); }
    else if (res.stageDone) { Fx.rainbow(4000); Fx.shower(160); celebrateBanner('Stage mastered!'); }
    res.extra = res.newlyMastered ? ' <span class="mastered-note">Mastered!</span>' :
      res.lost ? ' <span class="lost-note">This one needs 3 in a row again.</span>' :
      ok ? ' <span class="streak-note">' + state.items[BAR.key(cur.stage, cur.item)].streak + ' of 3 in a row.</span>' : '';
    if (res.opened) res.extra += ' <span class="mastered-note">' + res.opened + '-bit sums are open now.</span>';
    return res;
  }
  function celebrateBanner(text) {
    var b = el('div', 'party-banner', text);
    b.setAttribute('aria-hidden', 'true');
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 2600);
  }

  // Stage 1: How many 1s?
  function askCount() {
    var p = BAR.parsePattern(cur.item);
    qText.textContent = 'How many 1s are in this column?';
    var wrap = el('div', 'q-row');
    var g = grid({ cols: 1, size: 'big', rows: { carry: [p.carry ? 1 : null], top: [p.top], bottom: [p.bottom], answer: [null] } });
    wrap.appendChild(g);
    var side = el('div', 'q-side');
    var picks = el('div', 'num-picks');
    [0, 1, 2, 3].forEach(function (n) {
      var b = btn(String(n), 'choice num', function () { answer(n, b); });
      b.dataset.n = n;
      picks.appendChild(b);
    });
    side.appendChild(picks);
    if (!p.carry && state.blankTips < 3) side.appendChild(el('p', 'tip', 'The carry box is blank. Blank means no carry, so it counts as 0.'));
    wrap.appendChild(side);
    qArea.appendChild(wrap);
    cur.keys = function (k) { if (/^[0-3]$/.test(k)) { picks.children[+k].click(); return true; } return false; };
    function answer(n, b) {
      if (cur.answered) return;
      cur.answered = true;
      picks.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
      var ok = n === p.ones;
      var res = score(ok);
      var list = [g.cells.carry[0], g.cells.top[0], g.cells.bottom[0]];
      if (ok) {
        b.classList.add('ok');
        if (!p.carry) { state.blankTips++; save(); }
        list.forEach(function (c) { if (val(c)) c.classList.add('counted'); });
        fb('Yes, ' + ones(p.ones) + '.' + res.extra, 'good');
        later(nextQuestion, 1300);
      } else {
        b.classList.add('bad');
        fb('Not quite. Count them one box at a time.' + res.extra, 'bad');
        countAnim(list, function (n2) {
          picks.children[n2].classList.add('ok');
          fb('Carry ' + val(list[0]) + ', then ' + p.top + ', then ' + p.bottom + ': that makes <b>' + ones(n2) + '</b>.' + res.extra, 'hint');
          showNext();
        });
      }
    }
  }

  // Stage 2: What does it mean?
  function askRule() {
    var n = +cur.item, p = BAR.parsePattern(BAR.examplePattern(n));
    qText.innerHTML = '<b>' + word(n) + ' means?</b>';
    var wrap = el('div', 'q-row');
    var g = grid({ cols: 2, size: 'big', heads: ['next column', 'this column'],
      rows: { carry: [null, p.carry ? 1 : null], top: ['faint', p.top], bottom: ['faint', p.bottom], answer: ['none', null] } });
    wrap.appendChild(g);
    var opts = el('div', 'opts');
    var order = BAR.shuffle([0, 1, 2, 3]);
    order.forEach(function (k, i) {
      var r = BAR.rule(k);
      var b = el('button', 'choice opt');
      b.type = 'button';
      b.dataset.k = k;
      b.appendChild(el('span', 'letter', String.fromCharCode(65 + i)));
      b.appendChild(el('span', 'otext', BAR.RULE_TEXT[k]));
      b.appendChild(grid({ cols: 2, size: 'mini', rows: { carry: [r.carry ? 1 : null, 'none'], top: ['none', 'none'], bottom: ['none', 'none'], answer: ['none', r.write] } }));
      b.addEventListener('click', function () { answer(k, b); });
      opts.appendChild(b);
    });
    wrap.appendChild(opts);
    qArea.appendChild(wrap);
    cur.keys = function (k) {
      var i = '1234'.indexOf(k) >= 0 ? +k - 1 : 'abcd'.indexOf(k.toLowerCase());
      if (k.length === 1 && i >= 0) { opts.children[i].click(); return true; }
      return false;
    };
    function answer(k, b) {
      if (cur.answered) return;
      cur.answered = true;
      opts.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
      var ok = k === n;
      var res = score(ok);
      var right = opts.querySelector('[data-k="' + n + '"]');
      var list = [g.cells.carry[1], g.cells.top[1], g.cells.bottom[1]];
      if (ok) {
        b.classList.add('ok');
        fb('Yes. ' + ones(n) + ': ' + BAR.RULE_TEXT[n] + '.' + res.extra, 'good');
        placeRule(g.cells.top[1], g.cells.answer[1], g.cells.carry[0], n, function () { later(nextQuestion, 1500); });
      } else {
        b.classList.add('bad');
        right.classList.add('ok');
        fb('Not quite. Watch the 1s.' + res.extra, 'bad');
        countAnim(list, function () {
          placeRule(g.cells.top[1], g.cells.answer[1], g.cells.carry[0], n, function () {
            fb(word(n) + ' means: <b>' + BAR.RULE_TEXT[n] + '</b>.' + res.extra, 'hint');
            showNext();
          });
        });
      }
    }
  }

  // Shared by stages 3 and 4: tap and type in the boxes.
  function wireEdit(g, order, onEnter) {
    var cells = Array.prototype.slice.call(g.querySelectorAll('.cell.edit'));
    function cycle(c) {
      var v = c.dataset.v;
      if (c.dataset.row === 'carry') setCell(c, v === '1' ? '' : '1');
      else setCell(c, v === '0' ? '1' : '0');
      c.classList.remove('ok', 'bad');
    }
    function move(c, dr, dc) {
      var col = +c.dataset.col, row = c.dataset.row, best = null, bestD = 1e9;
      cells.forEach(function (o) {
        if (o === c || o.disabled) return;
        var oc = +o.dataset.col, sameRow = o.dataset.row === row;
        if (dc && sameRow && Math.sign(oc - col) === dc && Math.abs(oc - col) < bestD) { best = o; bestD = Math.abs(oc - col); }
        if (dr && !sameRow && (o.dataset.row === 'carry') === (dr < 0) && Math.abs(oc - col) < bestD) { best = o; bestD = Math.abs(oc - col); }
      });
      if (best) best.focus();
    }
    cells.forEach(function (c) {
      c.addEventListener('click', function () { if (!c.disabled) cycle(c); });
      c.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        var k = e.key;
        if (k === '0' || k === '1') {
          e.preventDefault();
          setCell(c, c.dataset.row === 'carry' && k === '0' ? '' : k);
          c.classList.remove('ok', 'bad');
          var nx = order(c);
          if (nx) nx.focus();
        } else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); setCell(c, ''); }
        else if (k === 'ArrowLeft') { e.preventDefault(); move(c, 0, -1); }
        else if (k === 'ArrowRight') { e.preventDefault(); move(c, 0, 1); }
        else if (k === 'ArrowUp') { e.preventDefault(); move(c, -1, 0); }
        else if (k === 'ArrowDown') { e.preventDefault(); move(c, 1, 0); }
        else if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); onEnter(); }
      });
    });
    return cells;
  }
  function lock(cells) { cells.forEach(function (c) { c.disabled = true; }); }

  // Stage 3: Put the 1s in place.
  function askPlace() {
    var p = BAR.parsePattern(cur.item);
    qText.textContent = 'Count the 1s. Then tap the boxes to put each 1 in the right place.';
    var wrap = el('div', 'q-row');
    var g = grid({ cols: 2, size: 'big', heads: ['next column', 'this column'],
      rows: { carry: [null, p.carry ? 1 : null], top: ['faint', p.top], bottom: ['faint', p.bottom], answer: ['none', null] },
      edit: { carry: [true, false], answer: [false, true] } });
    wrap.appendChild(g);
    var side = el('div', 'q-side');
    side.appendChild(el('p', 'small', 'Tap the box under the line: 0 or 1.<br>Tap the carry box on the left: carry 1 or nothing.'));
    if (!p.carry && state.blankTips < 3) side.appendChild(el('p', 'tip', 'A blank carry box means no carry.'));
    wrap.appendChild(side);
    qArea.appendChild(wrap);
    var bottom = g.cells.answer[1], carryNext = g.cells.carry[0];
    var cells = wireEdit(g, function (c) { return c === bottom ? carryNext : null; }, check);
    var checkBtn = btn('Check', 'check-btn', check);
    actions.appendChild(checkBtn);
    bottom.focus({ preventScroll: true });
    function check() {
      if (cur.answered) return;
      if (bottom.dataset.v === '') { fb('Tap the box under the line to write 0 or 1.', 'hint'); bottom.focus(); return; }
      cur.answered = true;
      lock(cells);
      actions.innerHTML = '';
      var r = BAR.rule(p.ones), okB = +bottom.dataset.v === r.write, okC = val(carryNext) === r.carry;
      bottom.classList.add(okB ? 'ok' : 'bad');
      if (val(carryNext) || !okC) carryNext.classList.add(okC ? 'ok' : 'bad');
      var res = score(okB && okC);
      if (okB && okC) {
        fb('Yes. ' + ones(p.ones) + ': ' + BAR.RULE_TEXT[p.ones] + '.' + res.extra, 'good');
        var gl = [g.cells.carry[1], g.cells.top[1], g.cells.bottom[1]];
        gl.forEach(function (c) { if (val(c)) c.classList.add('counted'); });
        later(nextQuestion, 1500);
        return;
      }
      var why = [];
      if (!okB) why.push('you wrote <b>' + bottom.dataset.v + '</b> at the bottom of this column. It should be <b>' + r.write + '</b>');
      if (!okC) why.push(r.carry ? 'you left the top of the next column blank. It should have a <b>carry 1</b>' : 'you put a carry 1 at the top of the next column. There is <b>no carry</b>, so it stays blank');
      fb('Not quite: ' + why.join('. Also, ') + '. Watch.' + res.extra, 'bad');
      var whyText = '<br>' + why.map(function (s) { return s.charAt(0).toUpperCase() + s.slice(1) + '.'; }).join('<br>');
      countAnim([g.cells.carry[1], g.cells.top[1], g.cells.bottom[1]], function () {
        bottom.classList.remove('ok', 'bad'); carryNext.classList.remove('ok', 'bad');
        setCell(bottom, ''); setCell(carryNext, '');
        placeRule(g.cells.top[1], bottom, carryNext, p.ones, function () {
          fb(ones(p.ones) + ' means: <b>' + BAR.RULE_TEXT[p.ones] + '</b>.' + whyText + res.extra, 'hint');
          showNext();
        });
      });
    }
  }

  // Stage 4: Add binary numbers.
  function askAdd() {
    var w = +cur.item, q = BAR.makeSum(w), sol = BAR.solve(q.a, q.b, w);
    qText.innerHTML = 'Add these ' + w + '-bit numbers. Start at the right. Fill in the carries and the answer.';
    var heads = [], carry = [], top = [], bottom = [], ans = [], editC = [], editA = [];
    for (var i = 0; i < w; i++) {
      heads.push(String(Math.pow(2, w - 1 - i)));
      carry.push(i === w - 1 ? 'none' : null); editC.push(i < w - 1);
      top.push(+sol.a[i]); bottom.push(+sol.b[i]); ans.push(null); editA.push(true);
    }
    var g = grid({ cols: w, size: w > 6 ? 'wide' : 'mid', heads: heads, rows: { carry: carry, top: top, bottom: bottom, answer: ans }, edit: { carry: editC, answer: editA } });
    g.classList.add('add-grid');
    var wrap = el('div', 'q-row add-row');
    wrap.appendChild(g);
    qArea.appendChild(wrap);
    var C = g.cells;
    var cells = wireEdit(g, function (c) {
      var col = +c.dataset.col;
      if (c.dataset.row === 'answer') return col > 0 ? C.carry[col - 1] : null;
      return C.answer[col];
    }, check);
    actions.appendChild(btn('Check', 'check-btn', check));
    C.answer[w - 1].focus({ preventScroll: true });
    function denary() { return 'In denary: ' + q.a + ' + ' + q.b + ' = ' + (q.a + q.b) + '.'; }
    function check() {
      if (cur.answered) return;
      var empty = C.answer.filter(function (c) { return c.dataset.v === ''; });
      if (empty.length) { fb('Fill every box under the line with 0 or 1.', 'hint'); empty[empty.length - 1].focus(); return; }
      cur.answered = true;
      lock(cells);
      actions.innerHTML = '';
      var bad = [];
      for (var i = 0; i < w; i++) {
        var okA = +C.answer[i].dataset.v === sol.answer[i];
        C.answer[i].classList.add(okA ? 'ok' : 'bad');
        var okC = true;
        if (i > 0) {
          okC = val(C.carry[i - 1]) === sol.carries[i - 1];
          if (val(C.carry[i - 1]) || !okC) C.carry[i - 1].classList.add(okC ? 'ok' : 'bad');
        }
        if (!okA || !okC) bad.push(i);
      }
      var res = score(!bad.length);
      if (!bad.length) {
        fb('All correct. ' + denary() + res.extra, 'good');
        showNext('Next sum');
        return;
      }
      bad.reverse();
      var names = bad.map(function (i) { return w - i; });
      var summary = '<span class="walk-sum">Not quite. ' + (names.length === 1 ? 'Column ' + names[0] + ' needs' : 'Columns ' + names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] + ' need') +
        ' fixing (counting from the right). Let us walk through ' + (names.length === 1 ? 'it' : 'them') + '.' + res.extra + '</span><br>';
      walk(0);
      function walk(k) {
        actions.innerHTML = '';
        if (k >= bad.length) {
          fb(summary + 'Now every column is right. The answer is <b>' + sol.answer.join('') + '</b>. ' + denary(), 'hint');
          showNext('Next sum');
          return;
        }
        var i = bad[k];
        clearMarks(g);
        [C.carry[i], C.top[i], C.bottom[i], C.answer[i]].forEach(function (c) { c.classList.add('walkcol'); });
        if (i > 0) C.carry[i - 1].classList.add('walkcol');
        var n = sol.ones[i];
        fb(summary + 'Column ' + (w - i) + ' from the right. Count the 1s.', 'hint');
        var wasA = C.answer[i].dataset.v, wasC = i > 0 ? val(C.carry[i - 1]) : 0;
        var mine = [];
        if (+wasA !== sol.answer[i]) mine.push('You wrote <b>' + wasA + '</b> at the bottom. It should be <b>' + sol.answer[i] + '</b>.');
        if (i > 0 && wasC !== sol.carries[i - 1]) mine.push(sol.carries[i - 1] ? 'You left the top of the next column blank. It should have a <b>carry 1</b>.' : 'You put a carry 1 at the top of the next column. There is <b>no carry</b>, so it stays blank.');
        countAnim([C.carry[i], C.top[i], C.bottom[i]], function () {
          C.answer[i].classList.remove('ok', 'bad');
          if (i > 0) C.carry[i - 1].classList.remove('ok', 'bad');
          setCell(C.answer[i], '');
          placeRule(C.top[i], C.answer[i], i > 0 ? C.carry[i - 1] : null, n, function () {
            C.answer[i].classList.add('fixed');
            if (i > 0 && sol.carries[i - 1]) C.carry[i - 1].classList.add('fixed');
            fb(summary + 'Column ' + (w - i) + ' has ' + ones(n) + '. That means <b>' + BAR.RULE_TEXT[n] + '</b>.<br>' + mine.join(' '), 'hint');
            var more = k < bad.length - 1;
            var b = btn(more ? 'Next column to fix' : 'Done', 'next-btn', function () { walk(k + 1); });
            actions.appendChild(b);
            b.focus({ preventScroll: true });
          });
        });
      }
    }
  }

  // Keys: Enter presses the main button; number keys answer stages 1 and 2.
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
    if (e.key === 'Enter') {
      var t = e.target;
      if (t && t.tagName === 'BUTTON' && !t.classList.contains('cell')) return; // the button itself handles Enter
      var b = actions.querySelector('.next-btn, .check-btn');
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if (cur && !cur.answered && cur.keys && cur.keys(e.key)) e.preventDefault();
  });

  // Height for a lesson embed.
  function reportHeight() {
    if (window.parent === window) return;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(main);

  try { if (localStorage.getItem(SAVE_KEY + ':how') === '1') { howEl.hidden = false; howBtn.setAttribute('aria-expanded', 'true'); } } catch (e) {}
  drawTabs(); drawStageHead(); drawHeader();
  nextQuestion();
  window.__bar = { state: function () { return state; }, cur: function () { return cur; }, go: goStage, next: nextQuestion };
})();
