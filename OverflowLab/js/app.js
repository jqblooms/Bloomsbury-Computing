// Overflow Lab: the page. Four stages as tabs, questions forever, 3 right in a row masters a level, and the help
// fades level by level. Every animation runs on timers (the site preloads apps in a hidden iframe, where animation
// frames never fire), so nothing can get stuck.
(function () {
  'use strict';
  var SAVE_KEY = 'bc-overflow-v1';
  var reduce = Fx.reduce;
  var params = new URLSearchParams(location.search);
  var state = load();

  // Lesson mode: ?stages=fit,watch shows only those stages and reports progress to the slide.
  var ONLY = (params.get('stages') || '').split(',').filter(function (id) { return OVL.stage(id); });
  var SHOWN = ONLY.length ? OVL.STAGES.filter(function (st) { return ONLY.indexOf(st.id) >= 0; }) : OVL.STAGES;
  if (params.get('stage') && OVL.stage(params.get('stage'))) state.stage = params.get('stage');
  if (SHOWN.indexOf(OVL.stage(state.stage)) < 0) state.stage = SHOWN[0].id;

  function load() {
    try { var raw = localStorage.getItem(SAVE_KEY); return OVL.fixState(raw ? JSON.parse(raw) : null); } catch (e) { return OVL.newState(); }
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
  function ones(n) { return n === 1 ? '1 one' : n + ' ones'; }
  function spaced(bits) { return bits.slice(0, 4) + ' ' + bits.slice(4); }
  var PLACE = [256, 128, 64, 32, 16, 8, 4, 2, 1]; // board column c: 0 is the 256 box outside the register
  function colName(c) { return 'the ' + PLACE[c] + ' column'; }

  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>';
  var ICON_STEP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 5l9 7-9 7zM18 5v14"/></svg>';
  var ICON_END = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5l7 7-7 7M12 5l7 7-7 7"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-label="locked"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  // ---------- page skeleton ----------
  var main = document.querySelector('main');
  main.innerHTML =
    '<header class="top"><h1 class="title">Overflow Lab</h1>' +
    '<div class="overall"><span class="overall-text"></span><span class="meter"><i></i></span></div></header>' +
    '<nav class="tabs" role="tablist" aria-label="Stages"></nav>' +
    '<section class="panel stage" role="tabpanel">' +
    '<div class="stage-head"><h2 class="stage-name"></h2><button type="button" class="how-btn" aria-expanded="false">How it works</button></div>' +
    '<div class="how" hidden></div>' +
    '<div class="suggest" hidden></div>' +
    '<p class="q-text"></p><div class="q"></div>' +
    '<div class="feedback" aria-live="polite"></div><div class="actions"></div><div class="extra"></div></section>' +
    '<section class="panel mastery"><div class="mastery-head"><h2>Mastery</h2><span class="small">3 right in a row masters a level. The next level gives less help. Mastered levels still come back.</span></div><div class="chips"></div></section>';
  var tabsEl = main.querySelector('.tabs'), qText = main.querySelector('.q-text'), qArea = main.querySelector('.q');
  var fbEl = main.querySelector('.feedback'), actions = main.querySelector('.actions'), chipsEl = main.querySelector('.chips');
  var extraEl = main.querySelector('.extra');
  var howBtn = main.querySelector('.how-btn'), howEl = main.querySelector('.how'), suggestEl = main.querySelector('.suggest');
  function fb(html, kind) { fbEl.className = 'feedback' + (kind ? ' ' + kind : ''); fbEl.innerHTML = html || ''; }

  // ---------- the register board ----------
  // o: { heads, show256, hl, edit: true (carry and answer boxes tappable) }
  function makeBoard(q, o) {
    o = o || {};
    var sol = OVL.solve(q.a, q.b);
    var g = el('div', 'reg' + (o.heads === false ? ' noheads' : '') + (o.show256 === false ? ' no256' : '') + (o.hl ? ' hl' : ''));
    var cells = { head: [], carry: [], a: [], b: [], ans: [] };
    function put(node, row, col, span) { node.style.gridRow = row; node.style.gridColumn = span ? col + ' / span ' + span : col; g.appendChild(node); return node; }
    put(el('div', 'lab', ''), 1, 1);
    put(el('div', 'lab', 'carry'), 2, 1);
    put(el('div', 'lab', ''), 3, 1);
    put(el('div', 'lab plus', '+'), 4, 1);
    put(el('div', 'regframe'), 6, 3, 8);
    for (var c = 0; c < 9; c++) {
      var col = c + 2;
      cells.head.push(put(el('div', 'head' + (c === 0 ? ' out' : ''), String(PLACE[c])), 1, col));
      var cc;
      if (c >= 1 && c <= 7) {
        if (o.edit) { cc = el('button', 'cell carry edit'); cc.type = 'button'; cc.setAttribute('aria-label', 'Carry box above ' + colName(c)); }
        else cc = el('div', 'cell carry');
        cc.dataset.row = 'carry'; cc.dataset.col = c;
        setCell(cc, '');
      } else cc = el('div', 'cell none');
      cells.carry.push(put(cc, 2, col));
      if (c === 0) { cells.a.push(put(el('div', 'cell none'), 3, col)); cells.b.push(put(el('div', 'cell none'), 4, col)); }
      else {
        var ca = el('div', 'cell bit'), cb = el('div', 'cell bit');
        setCell(ca, sol.a[c - 1]); setCell(cb, sol.b[c - 1]);
        cells.a.push(put(ca, 3, col)); cells.b.push(put(cb, 4, col));
      }
      var an;
      if (c === 0) { an = el('div', 'cell out'); an.setAttribute('aria-label', 'The 256 box, outside the register'); }
      else if (o.edit) { an = el('button', 'cell edit'); an.type = 'button'; an.setAttribute('aria-label', 'Register bit, ' + colName(c)); }
      else an = el('div', 'cell bit');
      an.dataset.row = 'answer'; an.dataset.col = c;
      setCell(an, '');
      cells.ans.push(put(an, 6, col));
    }
    put(el('div', 'line'), 5, 3, 8);
    put(el('div', 'cap cap-out', 'no 9th bit'), 7, 2);
    put(el('div', 'cap', '8-bit register'), 7, 3, 8);
    var wrap = el('div', 'board-wrap');
    wrap.appendChild(g);
    var narr = el('p', 'narr');
    narr.setAttribute('aria-live', 'polite');
    wrap.appendChild(narr);
    var res = el('div', 'result-holder');
    wrap.appendChild(res);
    return { wrap: wrap, grid: g, cells: cells, sol: sol, q: q, narr: narr, res: res };
  }
  function setCell(cell, v) {
    cell.dataset.v = v;
    cell.textContent = v;
    cell.classList.toggle('one', v === '1');
  }
  function val(cell) { return cell && cell.dataset.v === '1' ? 1 : 0; }

  // The true sum and what the register stores, side by side.
  function resultHtml(sol, q) {
    var bits = sol.answer.join('');
    if (sol.overflow) {
      return '<div class="result"><div class="rbox good"><div class="rt">True sum (needs 9 bits)</div><div class="rv">' + q.a + ' + ' + q.b + ' = ' + sol.sum + '</div>' +
        '<div class="rb">1 ' + spaced(bits) + '</div></div>' +
        '<div class="rmid">256<br>lost</div>' +
        '<div class="rbox bad"><div class="rt">The register stores</div><div class="rv">' + sol.stored + '</div><div class="rb">' + spaced(bits) + '</div></div>' +
        '<p class="rnote">' + sol.sum + ' - 256 = ' + sol.stored + '. The result is greater than 255, so it needs more than 8 bits. The register is only 8 bits: <b>overflow</b>. The stored value is wrong.</p></div>';
    }
    return '<div class="result"><div class="rbox good"><div class="rt">True sum</div><div class="rv">' + q.a + ' + ' + q.b + ' = ' + sol.sum + '</div>' +
      '<div class="rb">' + spaced(bits) + '</div></div>' +
      '<div class="rmid same">same</div>' +
      '<div class="rbox good"><div class="rt">The register stores</div><div class="rv">' + sol.stored + '</div><div class="rb">' + spaced(bits) + '</div></div>' +
      '<p class="rnote">No carry leaves the 128 column. ' + sol.sum + ' is not greater than 255, so it fits in 8 bits: <b>no overflow</b>.</p></div>';
  }

  // ---------- the animation player ----------
  // Phases: for each column from the right, count the 1s, then place the bit and the carry; then the result.
  var players = [];
  function stopAll() { players.forEach(function (p) { p.cancel(); }); players = []; document.querySelectorAll('.flyer').forEach(function (f) { f.remove(); }); }

  function Player(bd, opts) {
    opts = opts || {};
    var C = bd.cells, sol = bd.sol;
    var T = reduce ? { look: 160, gap: 200, fly: 0, flash: 500, fall: 0 } : { look: 260, gap: 200, fly: 460, flash: 1200, fall: 900 };
    var phases = [];
    for (var c = 8; c >= 1; c--) { phases.push({ t: 'count', c: c }); phases.push({ t: 'place', c: c }); }
    phases.push({ t: 'result' });
    var self = { next: 0, limit: phases.length, busy: false, phases: phases };
    var token = 0, tms = [], flyers = [];
    function wait(ms, fn) { var tk = token; tms.push(setTimeout(function () { if (tk === token) fn(); }, ms)); }
    function narrate(h) { bd.narr.innerHTML = h; }
    function clearMarks() {
      bd.grid.querySelectorAll('.cell').forEach(function (x) { x.classList.remove('look', 'counted', 'walkcol', 'placed'); var b = x.querySelector('.badge'); if (b) b.remove(); });
    }
    function fly(from, to, text, instant, done) {
      if (instant || reduce || !from) { setCell(to, text); if (!instant) to.classList.add('placed'); done(); return; }
      var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      var f = el('div', 'flyer', text);
      f.style.left = a.left + 'px'; f.style.top = a.top + 'px'; f.style.width = b.width + 'px'; f.style.height = b.height + 'px';
      document.body.appendChild(f); flyers.push(f);
      wait(20, function () { f.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px)'; });
      wait(T.fly + 20, function () { f.remove(); setCell(to, text); to.classList.add('placed'); done(); });
    }
    function fallOff(box, instant, done) {
      if (instant || reduce) { setCell(box, ''); box.classList.add('lost'); box.classList.remove('ofl'); done(); return; }
      var r = box.getBoundingClientRect();
      var f = el('div', 'flyer falling', '1');
      f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
      document.body.appendChild(f); flyers.push(f);
      setCell(box, '');
      wait(20, function () { f.style.transform = 'translate(-18px, 90px) rotate(-35deg)'; f.style.opacity = '0'; });
      wait(T.fall + 30, function () { f.remove(); box.classList.remove('ofl'); box.classList.add('lost'); done(); });
    }
    function count(c, instant, done) {
      clearMarks();
      var list = [C.carry[c], C.a[c], C.b[c]];
      [C.carry[c], C.a[c], C.b[c], C.ans[c]].forEach(function (x) { x.classList.add('walkcol'); });
      var n = sol.ones[c - 1], k = 0, seen = 0;
      var hide = opts.hideCount && opts.hideCount(c);
      var line = hide ? 'Now ' + colName(c) + '. Count its 1s.' : 'Column ' + (9 - c) + ' from the right (' + colName(c) + '): <b>' + ones(n) + '</b>.';
      if (instant) { narrate(line); done(); return; }
      narrate('Column ' + (9 - c) + ' from the right (' + colName(c) + '): count the 1s.');
      (function stepIt() {
        if (k >= list.length) { narrate(line); done(); return; }
        var x = list[k++];
        x.classList.add('look');
        if (val(x) && !hide) { seen++; x.classList.add('counted'); if (opts.badges !== false) x.appendChild(el('span', 'badge', String(seen))); }
        wait(T.look, stepIt);
      })();
    }
    function place(c, instant, done) {
      var n = sol.ones[c - 1], r = OVL.rule(n);
      if (!instant) narrate(ones(n) + ': <b>' + OVL.RULE_TEXT[n] + '</b>.');
      fly(C.b[c], C.ans[c], String(r.write), instant, function () {
        if (!r.carry) { done(); return; }
        if (c > 1) { fly(C.b[c], C.carry[c - 1], '1', instant, done); return; }
        // The carry out of the 128 column: into the 256 box, which flashes, then it falls off.
        var out = C.ans[0];
        fly(C.b[1], out, '1', instant, function () {
          if (!instant) {
            out.classList.add('ofl');
            narrate('<span class="badtxt">The carry needs a 256 column. The register has only 8 bits: overflow.</span>');
          }
          if (instant) { fallOff(out, true, done); return; }
          wait(T.flash, function () {
            narrate('<span class="badtxt">The carry falls off. The register keeps only the 8 bits.</span>');
            fallOff(out, false, done);
          });
        });
      });
    }
    function result(instant, done) {
      clearMarks();
      bd.res.innerHTML = resultHtml(sol, bd.q);
      narrate(sol.overflow ? '<span class="badtxt">Overflow.</span> The register shows ' + sol.stored + ', not ' + sol.sum + '.' : 'No overflow. The register shows ' + sol.stored + '.');
      done();
    }
    function run(i, instant, done) {
      var ph = phases[i];
      if (ph.t === 'count') count(ph.c, instant, done);
      else if (ph.t === 'place') place(ph.c, instant, done);
      else result(instant, done);
    }
    var running = -1; // a phase cut off half way runs again (phases can safely run twice)
    self.cancel = function () {
      token++;
      if (running >= 0) { self.next = running; running = -1; }
      tms.forEach(clearTimeout); tms = [];
      flyers.forEach(function (f) { f.remove(); }); flyers = [];
      self.busy = false;
      if (opts.onBusy) opts.onBusy(false);
    };
    self.reset = function () {
      self.cancel();
      clearMarks();
      for (var c = 0; c < 9; c++) {
        if (C.carry[c].dataset.row) setCell(C.carry[c], '');
        setCell(C.ans[c], '');
      }
      C.ans[0].classList.remove('ofl', 'lost');
      bd.res.innerHTML = '';
      narrate('');
      self.next = 0;
    };
    // Plays phases until end (never past the limit), one after another.
    self.playTo = function (end, done) {
      self.cancel();
      end = Math.min(end, self.limit);
      self.busy = true;
      if (opts.onBusy) opts.onBusy(true);
      (function loop() {
        if (self.next >= end) {
          self.busy = false;
          if (opts.onBusy) opts.onBusy(false);
          if (self.next >= self.limit && opts.onLimit) opts.onLimit(self.next);
          if (self.next >= phases.length && opts.onEnd) opts.onEnd();
          if (done) done();
          return;
        }
        running = self.next++;
        run(running, false, function () { running = -1; wait(self.next >= end ? 0 : T.gap, loop); });
      })();
    };
    self.watch = function () { self.reset(); self.playTo(phases.length); };
    // One column (count and place) per step.
    self.step = function () {
      if (self.busy) return;
      if (self.next >= phases.length) self.reset();
      var n = phases[self.next].t === 'count' ? 2 : 1;
      self.playTo(self.next + n);
    };
    self.skip = function () {
      self.cancel();
      var end = self.limit;
      while (self.next < end) run(self.next++, true, function () {});
      if (self.next >= self.limit && opts.onLimit) opts.onLimit(self.next);
      if (self.next >= phases.length && opts.onEnd) opts.onEnd();
    };
    self.finishInstant = function () { self.reset(); self.limit = phases.length; self.skip(); };
    players.push(self);
    return self;
  }

  // Watch it / Next step / Skip to the end buttons for a board.
  function controls(pl, o) {
    o = o || {};
    var d = el('div', 'controls');
    if (o.watch !== false) d.appendChild(btn(ICON_PLAY + 'Watch it', 'ghost watch-btn', function () { pl.watch(); }));
    d.appendChild(btn(ICON_STEP + 'Next step', 'ghost step-btn', function () { pl.step(); }));
    if (o.skip !== false) d.appendChild(btn(ICON_END + 'Skip to the end', 'ghost skip-btn', function () { pl.skip(); }));
    return d;
  }

  // A fresh, animated board showing the whole method, below the question.
  function showMethod(q, title, auto) {
    var box = el('div', 'method');
    box.appendChild(el('h3', '', title || 'Watch the method'));
    var bd = makeBoard(q, {});
    box.appendChild(bd.wrap);
    var pl = Player(bd, {});
    box.appendChild(controls(pl));
    extraEl.appendChild(box);
    if (auto) pl.watch(); else pl.finishInstant();
    return pl;
  }

  // ---------- tabs, chips, header ----------
  function drawTabs() {
    tabsEl.innerHTML = '';
    var sug = suggestion();
    SHOWN.forEach(function (st) {
      var i = OVL.STAGES.indexOf(st), c = OVL.counts(state, st.id);
      var t = el('button', 'tab' + (st.id === state.stage ? ' on' : '') + (OVL.stageDone(state, st.id) ? ' done' : '') + (sug === st.id ? ' suggested' : ''),
        '<span class="num">' + (i + 1) + '</span><span class="tname">' + st.name + '</span><span class="tcount">' + c.have + '/' + c.total + '</span>');
      t.type = 'button';
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', st.id === state.stage ? 'true' : 'false');
      t.addEventListener('click', function () { goStage(st.id); });
      tabsEl.appendChild(t);
    });
  }
  function suggestion() {
    if (!OVL.stageDone(state, state.stage)) return null;
    var i = SHOWN.indexOf(OVL.stage(state.stage));
    for (var k = 1; k < SHOWN.length; k++) { var s = SHOWN[(i + k) % SHOWN.length]; if (!OVL.stageDone(state, s.id)) return s.id; }
    return null;
  }
  function drawHeader() {
    var have = 0, total = 0;
    SHOWN.forEach(function (st) { var c = OVL.counts(state, st.id); have += c.have; total += c.total; });
    main.querySelector('.overall-text').textContent = have + ' of ' + total + ' mastered';
    main.querySelector('.meter i').style.width = (100 * have / total) + '%';
    var sug = suggestion();
    suggestEl.hidden = !OVL.stageDone(state, state.stage);
    suggestEl.innerHTML = '';
    if (OVL.stageDone(state, state.stage)) {
      var st = OVL.stage(sug);
      suggestEl.appendChild(el('span', '', sug ? 'You mastered this stage. Ready for the next one?' : 'You mastered every stage. Keep practising to keep it strong.'));
      if (sug) suggestEl.appendChild(btn('Go to stage ' + (OVL.STAGES.indexOf(st) + 1) + ': ' + st.name, 'small-btn', function () { goStage(sug); }));
    }
  }
  function drawChips() {
    chipsEl.innerHTML = '';
    var sid = state.stage, open = OVL.openItems(state, sid), st = OVL.stage(sid);
    st.items.forEach(function (it, i) {
      var rec = state.items[OVL.key(sid, it)], locked = open.indexOf(it) < 0;
      var chip = el('div', 'chip' + (rec.mastered ? ' mastered' : '') + (locked ? ' locked' : '') + (cur && cur.item === it ? ' now' : ''));
      chip.dataset.item = it;
      var dots = '';
      for (var k = 0; k < OVL.NEED; k++) dots += '<i class="' + (k < rec.streak ? 'on' : '') + '"></i>';
      chip.innerHTML = '<span class="clabel">Level ' + it + ': ' + st.levels[i] + '</span>' +
        (locked ? '<span class="lock">' + LOCK + '</span>' : '<span class="dots" aria-label="' + rec.streak + ' of 3 in a row">' + dots + '</span>');
      chipsEl.appendChild(chip);
    });
  }

  // ---------- How it works ----------
  var RULES = '<div class="rules"><span><b>0 ones:</b> write 0</span><span><b>1 one:</b> write 1</span><span><b>2 ones:</b> write 0, carry 1</span><span><b>3 ones:</b> write 1, carry 1</span></div>';
  var HOW = {
    fit: '<p>An 8-bit register holds 0 to 255. Add the two numbers in denary. If the result is greater than 255, it needs more than 8 bits: <b>overflow</b>.</p>',
    watch: '<p>Binary addition starts at the right. Count the 1s in each column, with the carry.</p>' + RULES +
      '<p>A carry out of the 128 column needs a 256 column. The register has no 9th bit, so that carry is lost: <b>overflow</b>. The register keeps only the 8 bits, so it stores the sum minus 256.</p>',
    add: '<p>Start at the right. Count the 1s in each column, with the carry. Tap a box or type 0 or 1. Arrow keys move. Enter checks.</p>' + RULES +
      '<p>Then say if a carry leaves the 128 column: that is overflow.</p>',
    exam: '<p>No help here, like an exam. Add the numbers (the carry boxes are for your working), give the 8 bits the register stores, say if there is overflow and give the stored value in denary. Then pick the best explanation.</p>' +
      '<p>Mark scheme words: the result is <b>greater than 255</b>; it needs <b>more than 8 bits</b>; the register is only <b>8 bits</b>.</p>'
  };
  howBtn.addEventListener('click', function () {
    var open = howEl.hidden;
    howEl.hidden = !open;
    howBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    try { localStorage.setItem(SAVE_KEY + ':how', open ? '1' : '0'); } catch (e) {}
  });
  function drawStageHead() {
    var st = OVL.stage(state.stage);
    main.querySelector('.stage-name').textContent = 'Stage ' + (OVL.STAGES.indexOf(st) + 1) + ': ' + st.name;
    howEl.innerHTML = HOW[state.stage];
  }

  // ---------- flow ----------
  var cur = null, recent = {}, bags = {};
  function goStage(id) {
    state.stage = id;
    save();
    drawTabs(); drawStageHead(); drawHeader();
    nextQuestion();
  }
  function nextQuestion() {
    stopAll();
    var sid = state.stage;
    var item = OVL.pickItem(state, sid);
    var over = OVL.nextOutcome(bags[sid] || (bags[sid] = []));
    var q = OVL.makeQuestion(sid, item, over, recent[sid] || (recent[sid] = []));
    recent[sid].push(q.key); if (recent[sid].length > 20) recent[sid].shift();
    cur = { stage: sid, item: item, level: +item, q: q, sol: OVL.solve(q.a, q.b), answered: false };
    qArea.innerHTML = ''; fb(''); actions.innerHTML = ''; extraEl.innerHTML = '';
    ({ fit: askFit, watch: askWatch, add: askAdd, exam: askExam })[sid]();
    drawChips();
  }
  function showNext() {
    actions.innerHTML = '';
    var b = btn('Next question', 'next-btn', nextQuestion);
    actions.appendChild(b);
    b.focus({ preventScroll: true });
  }
  function score(ok) {
    var res = OVL.record(state, cur.stage, cur.item, ok);
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
    if (res.allDone) { Fx.rainbow(6000); Fx.shower(260); banner('You mastered every stage. Amazing!'); }
    else if (res.stageDone) { Fx.rainbow(4000); Fx.shower(160); banner('Stage mastered!'); }
    var rec = state.items[OVL.key(cur.stage, cur.item)];
    res.extra = res.newlyMastered ? ' <span class="mastered-note">Mastered!</span>' :
      res.lost ? ' <span class="lost-note">This level needs 3 in a row again.</span>' :
      ok ? ' <span class="streak-note">' + rec.streak + ' of 3 in a row.</span>' : ' <span class="streak-note">Your streak starts again.</span>';
    if (res.opened) res.extra += ' <span class="mastered-note">Level ' + res.opened + ' is open: ' + OVL.stage(cur.stage).levels[res.opened - 1].toLowerCase() + '.</span>';
    report();
    return res;
  }
  function banner(text) {
    var b = el('div', 'party-banner', text);
    b.setAttribute('aria-hidden', 'true');
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 2600);
  }
  // On a lesson slide: the slide saves this as the student's answer.
  var everDone = false;
  function report() {
    if (window.parent === window || !ONLY.length) return;
    var lines = SHOWN.map(function (st) { var c = OVL.counts(state, st.id); return st.name + ' ' + c.have + ' of ' + c.total + ' levels mastered.'; });
    var done = SHOWN.every(function (st) { return OVL.stageDone(state, st.id); });
    everDone = everDone || done;
    try {
      window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'overflow-lab-' + ONLY.join('-'), label: 'Overflow Lab',
        summary: lines.join(' '), complete: everDone }, '*');
    } catch (e) {}
  }

  // Yes / No toggle pair.
  function yesNo(onPick) {
    var d = el('div', 'picks');
    var pick = { v: null };
    ['Yes', 'No'].forEach(function (t) {
      var b = btn(t, 'choice yn', function () {
        if (b.disabled) return;
        pick.v = t === 'Yes';
        d.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        if (onPick) onPick(pick.v);
      });
      b.className = 'choice yn';
      b.setAttribute('aria-pressed', 'false');
      d.appendChild(b);
    });
    d.pick = pick;
    d.mark = function (right) {
      d.querySelectorAll('button').forEach(function (x) {
        x.disabled = true;
        var isYes = x.textContent === 'Yes';
        if (isYes === right) x.classList.add('ok');
        else if (x.getAttribute('aria-pressed') === 'true') x.classList.add('bad');
      });
    };
    return d;
  }
  function numInput(label) {
    var i = el('input', 'num-in');
    i.type = 'text'; i.inputMode = 'numeric'; i.autocomplete = 'off'; i.maxLength = 4;
    i.setAttribute('aria-label', label);
    return i;
  }
  function readNum(i) { var t = i.value.replace(/\s+/g, ''); return /^\d{1,3}$/.test(t) ? +t : null; }

  // ---------- Stage 1: Will it fit? ----------
  function askFit() {
    var q = cur.q, sol = cur.sol, L = cur.level;
    qText.textContent = 'Will the answer fit in an 8-bit register?';
    qArea.appendChild(el('div', 'bigsum', q.a + ' + ' + q.b));
    if (L === 1) {
      var lim = el('div', 'limit');
      var pv = '';
      [128, 64, 32, 16, 8, 4, 2, 1].forEach(function (p) { pv += '<span>' + p + '</span>'; });
      for (var i = 0; i < 8; i++) pv += '<b>1</b>';
      lim.innerHTML = '<span class="pv" aria-hidden="true">' + pv + '</span><span>All 8 bits on: 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = <b>255</b>. An 8-bit register holds 0 to 255.</span>';
      qArea.appendChild(lim);
      qArea.appendChild(el('p', 'tip', 'Add the two numbers. Is the result greater than 255?'));
    } else if (L === 2) qArea.appendChild(el('p', 'tip', 'An 8-bit register holds 0 to 255.'));
    var picks = el('div', 'picks');
    var bo = btn('Overflow', 'choice big', function () { answer(true, bo); });
    var bf = btn('Fits (0 to 255)', 'choice big', function () { answer(false, bf); });
    bo.className = bf.className = 'choice big';
    picks.appendChild(bo); picks.appendChild(bf);
    qArea.appendChild(picks);
    cur.keys = function (k) { k = k.toLowerCase(); if (k === 'o') { bo.click(); return true; } if (k === 'f') { bf.click(); return true; } return false; };
    function answer(saysOver, b) {
      if (cur.answered) return;
      cur.answered = true;
      bo.disabled = bf.disabled = true;
      var ok = saysOver === sol.overflow;
      b.classList.add(ok ? 'ok' : 'bad');
      (sol.overflow ? bo : bf).classList.add('ok');
      var res = score(ok);
      var why = sol.overflow ? q.a + ' + ' + q.b + ' = ' + sol.sum + '. ' + sol.sum + ' is greater than 255, so it needs more than 8 bits: overflow.' :
        q.a + ' + ' + q.b + ' = ' + sol.sum + '. ' + sol.sum + ' is not greater than 255, so it fits in 8 bits.';
      fb((ok ? 'Yes. ' : 'Not quite. ') + why + ' Watch the binary addition below.' + res.extra, ok ? 'good' : 'bad');
      showMethod(q, 'Why: the binary addition', true);
      showNext();
    }
  }

  // ---------- Stage 2: Watch and predict ----------
  function askWatch() {
    var q = cur.q, sol = cur.sol, L = cur.level;
    qText.textContent = 'Step through the addition. At the 128 column, predict what happens.';
    if (L <= 2) qArea.appendChild(el('p', 'denary-line', 'In denary: ' + q.a + ' + ' + q.b));
    var bd = makeBoard(q, {});
    qArea.appendChild(bd.wrap);
    if (L === 1) qArea.appendChild(el('p', 'tip', 'Watch the carries. 2 or 3 ones in a column make a carry into the next column on the left.'));
    var predictAt = 15; // phase 15: just after counting the 128 column
    var pl = Player(bd, { badges: L < 3, hideCount: function (c) { return L === 3 && c === 1; },
      onBusy: function (b) { var s = actions.querySelector('.step-btn'), p = actions.querySelector('.play-btn'); if (s) s.disabled = b; if (p) p.disabled = b; },
      onLimit: function () { if (!cur.answered && !askEl) ask(); } });
    pl.limit = predictAt;
    actions.appendChild(btn(ICON_STEP + 'Next step', 'step-btn', function () { pl.step(); }));
    actions.appendChild(btn(ICON_END + 'Play to the 128 column', 'ghost play-btn', function () { pl.playTo(predictAt); }));
    actions.querySelector('.step-btn').focus({ preventScroll: true });
    var askEl = null;
    function ask() {
      actions.innerHTML = '';
      askEl = el('div', 'predict');
      var r1 = el('div', 'ask'); r1.appendChild(el('span', 'qlab', 'Does a carry leave the register (out of the 128 column)?'));
      var yn = yesNo(); r1.appendChild(yn); askEl.appendChild(r1);
      var r2 = el('div', 'ask'); r2.appendChild(el('span', 'qlab', 'What denary value will the register store?'));
      var inp = numInput('Stored value in denary'); r2.appendChild(inp); askEl.appendChild(r2);
      if (L === 1) askEl.appendChild(el('p', 'tip', 'A carry out of the 128 column has no column to go into. The register keeps only the 8 bits.'));
      qArea.appendChild(askEl);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      actions.appendChild(btn('Check', 'check-btn', check));
      yn.querySelector('button').focus({ preventScroll: true });
      function check() {
        if (cur.answered) return;
        var n = readNum(inp);
        if (yn.pick.v === null || n === null) { fb('Answer both: Yes or No, and a denary number from 0 to 255.', 'hint'); return; }
        cur.answered = true;
        inp.disabled = true;
        var okC = yn.pick.v === sol.overflow, okN = n === sol.stored;
        yn.mark(sol.overflow);
        inp.classList.add(okN ? 'ok' : 'bad');
        var res = score(okC && okN);
        actions.innerHTML = '';
        var n128 = sol.ones[0];
        var parts = [];
        parts.push('The 128 column has ' + ones(n128) + (sol.overflow ? ', so a carry 1 leaves the register: overflow.' : ', so no carry leaves the register: no overflow.'));
        parts.push('The register stores ' + spaced(sol.answer.join('')) + ' = ' + sol.stored + (sol.overflow ? ' (' + sol.sum + ' - 256).' : '.'));
        if (okC && okN) fb('Yes. ' + parts.join(' ') + res.extra, 'good');
        else fb('Not quite. ' + (okC ? '' : 'Check the carry. ') + (okN ? '' : 'Check the stored value. ') + parts.join(' ') + ' Watch the end.' + res.extra, 'bad');
        pl.limit = pl.phases.length;
        pl.playTo(pl.phases.length, function () {
          var ctl = controls(pl);
          bd.wrap.appendChild(ctl);
          showNext();
        });
      }
    }
  }

  // ---------- Stages 3 and 4: tap and type in the boxes ----------
  function wireEdit(bd, after, onEnter) {
    var cells = Array.prototype.slice.call(bd.grid.querySelectorAll('.cell.edit'));
    var C = bd.cells;
    function order(c) {
      var col = +c.dataset.col;
      if (c.dataset.row === 'answer') return col - 1 >= 1 ? C.carry[col - 1] : null;
      return C.ans[col];
    }
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
        var oc = +o.dataset.col, same = o.dataset.row === row;
        if (dc && same && Math.sign(oc - col) === dc && Math.abs(oc - col) < bestD) { best = o; bestD = Math.abs(oc - col); }
        if (dr && !same && (o.dataset.row === 'carry') === (dr < 0) && Math.abs(oc - col) < bestD) { best = o; bestD = Math.abs(oc - col); }
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
          if (nx) nx.focus(); else if (after) after();
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
  // Marks the boxes. Returns which parts are wrong.
  function markBoard(bd, markCarries) {
    var C = bd.cells, sol = bd.sol, badBits = 0, badCarries = 0;
    for (var c = 1; c <= 8; c++) {
      var okA = +C.ans[c].dataset.v === sol.answer[c - 1];
      C.ans[c].classList.add(okA ? 'ok' : 'bad');
      if (!okA) badBits++;
      if (c <= 7) {
        var okC = val(C.carry[c]) === sol.carries[c - 1];
        if (!okC) badCarries++;
        if (markCarries && (val(C.carry[c]) || !okC)) C.carry[c].classList.add(okC ? 'ok' : 'bad');
      }
    }
    return { bits: badBits, carries: badCarries };
  }
  // The first column from the right that is wrong or empty.
  function firstWrong(bd) {
    var C = bd.cells, sol = bd.sol;
    for (var c = 8; c >= 1; c--) {
      if (C.ans[c].dataset.v === '' || +C.ans[c].dataset.v !== sol.answer[c - 1]) return c;
      if (c > 1 && val(C.carry[c - 1]) !== sol.carries[c - 2]) return c;
    }
    return 0;
  }

  // ---------- Stage 3: Add it yourself ----------
  function askAdd() {
    var q = cur.q, sol = cur.sol, L = cur.level;
    qText.textContent = 'Add the two numbers. Fill the carry boxes and the 8 bits the register keeps. Then answer: overflow?';
    var bd = makeBoard(q, { edit: true, hl: L === 1 });
    qArea.appendChild(bd.wrap);
    var tip = el('div', 'tip', 'Start at the right. Count the 1s in each column, with the carry: ' + RULES);
    tip.hidden = L !== 1;
    qArea.appendChild(tip);
    var r1 = el('div', 'ask'); r1.appendChild(el('span', 'qlab', 'Overflow? (Does a carry leave the 128 column?)'));
    var yn = yesNo(); r1.appendChild(yn); qArea.appendChild(r1);
    var cells = wireEdit(bd, function () { yn.querySelector('button').focus(); }, check);
    actions.appendChild(btn('Check', 'check-btn', check));
    if (L === 2) actions.appendChild(btn('Hint', 'ghost hint-btn', hint));
    bd.cells.ans[8].focus({ preventScroll: true });
    function hint() {
      tip.hidden = false;
      bd.grid.classList.add('hl');
      var c = firstWrong(bd);
      if (!c) { bd.narr.innerHTML = 'Every column looks right. Now answer: overflow?'; return; }
      var n = sol.ones[c - 1];
      bd.narr.innerHTML = 'Look at ' + colName(c) + ' (column ' + (9 - c) + ' from the right). It has <b>' + ones(n) + '</b>: ' + OVL.RULE_TEXT[n] + '.';
    }
    function check() {
      if (cur.answered) return;
      var empty = bd.cells.ans.filter(function (c, i) { return i > 0 && c.dataset.v === ''; });
      if (empty.length) { fb('Fill every register box with 0 or 1.', 'hint'); empty[empty.length - 1].focus(); return; }
      if (yn.pick.v === null) { fb('Answer Yes or No: overflow?', 'hint'); yn.querySelector('button').focus(); return; }
      cur.answered = true;
      cells.forEach(function (c) { c.disabled = true; });
      var bad = markBoard(bd, true), okO = yn.pick.v === sol.overflow;
      yn.mark(sol.overflow);
      var ok = !bad.bits && !bad.carries && okO;
      var res = score(ok);
      actions.innerHTML = '';
      var end = sol.overflow ? ' A carry leaves the 128 column: overflow. The register stores ' + sol.stored + ', not ' + sol.sum + '.' :
        ' No carry leaves the 128 column: no overflow. ' + q.a + ' + ' + q.b + ' = ' + sol.sum + '.';
      if (ok) { fb('All correct.' + end + res.extra, 'good'); showMethod(q, 'The method', false); }
      else {
        var what = [];
        if (bad.carries) what.push('the carries');
        if (bad.bits) what.push('the register bits');
        if (!okO) what.push('the overflow answer');
        fb('Not quite. Check ' + what.join(' and ') + '.' + end + ' Watch the method below.' + res.extra, 'bad');
        showMethod(q, 'The method, column by column', true);
      }
      showNext();
    }
  }

  // ---------- Stage 4: Exam style ----------
  function askExam() {
    var q = cur.q, sol = cur.sol;
    qText.textContent = 'Add these two 8-bit binary numbers. Give the 8 bits the register stores.';
    var bd = makeBoard(q, { edit: true, heads: false, show256: false });
    qArea.appendChild(bd.wrap);
    qArea.appendChild(el('p', 'small', 'The carry boxes are for your working.'));
    var r1 = el('div', 'ask'); r1.appendChild(el('span', 'qlab', 'Is there overflow?'));
    var yn = yesNo(); r1.appendChild(yn); qArea.appendChild(r1);
    var r2 = el('div', 'ask'); r2.appendChild(el('span', 'qlab', 'The value the register stores, in denary:'));
    var inp = numInput('Stored value in denary'); r2.appendChild(inp); qArea.appendChild(r2);
    var cells = wireEdit(bd, function () { yn.querySelector('button').focus(); }, check);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    actions.appendChild(btn('Check', 'check-btn', check));
    bd.cells.ans[8].focus({ preventScroll: true });
    function check() {
      if (cur.answered) return;
      var empty = bd.cells.ans.filter(function (c, i) { return i > 0 && c.dataset.v === ''; });
      if (empty.length) { fb('Fill every register box with 0 or 1.', 'hint'); empty[empty.length - 1].focus(); return; }
      var n = readNum(inp);
      if (yn.pick.v === null || n === null) { fb('Answer Yes or No, and give the stored value as a denary number.', 'hint'); return; }
      cur.answered = true;
      cells.forEach(function (c) { c.disabled = true; });
      inp.disabled = true;
      var bad = markBoard(bd, false), okO = yn.pick.v === sol.overflow, okN = n === sol.stored;
      yn.mark(sol.overflow);
      inp.classList.add(okN ? 'ok' : 'bad');
      actions.innerHTML = '';
      bd.grid.classList.remove('no256', 'noheads');
      if (sol.overflow) { setCell(bd.cells.ans[0], '1'); bd.cells.ans[0].classList.add('ofl'); }
      if (bad.bits || !okO || !okN) {
        var res = score(false);
        var what = [];
        if (bad.bits) what.push('the register bits');
        if (!okO) what.push('the overflow answer');
        if (!okN) what.push('the stored value');
        fb('Not quite. Check ' + what.join(', ') + '. The register stores ' + spaced(sol.answer.join('')) + ' = ' + sol.stored +
          (sol.overflow ? ' (' + sol.sum + ' - 256): overflow.' : ': no overflow.') + ' Watch the method below.' + res.extra, 'bad');
        showMethod(q, 'The method, column by column', true);
        showNext();
        return;
      }
      fb('Correct so far. Last part:', 'good');
      explain();
    }
    function explain() {
      var e = OVL.makeExplain(sol.overflow);
      var box = el('div', 'explain');
      box.appendChild(el('p', 'qlab', e.prompt));
      var opts = el('div', 'opts');
      e.options.forEach(function (t, i) {
        var b = el('button', 'choice opt');
        b.type = 'button';
        b.appendChild(el('span', 'letter', String.fromCharCode(65 + i)));
        b.appendChild(el('span', 'otext', t));
        b.addEventListener('click', function () { pick(i, b); });
        opts.appendChild(b);
      });
      box.appendChild(opts);
      qArea.appendChild(box);
      opts.firstChild.focus({ preventScroll: true });
      cur.keys = function (k) {
        var i = '1234'.indexOf(k) >= 0 ? +k - 1 : 'abcd'.indexOf(k.toLowerCase());
        if (k.length === 1 && i >= 0 && !cur.explained) { opts.children[i].click(); return true; }
        return false;
      };
      function pick(i, b) {
        if (cur.explained) return;
        cur.explained = true;
        opts.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        var ok = i === e.correct;
        b.classList.add(ok ? 'ok' : 'bad');
        opts.children[e.correct].classList.add('ok');
        var res = score(ok);
        var right = e.options[e.correct];
        fb((ok ? 'Yes. ' : 'Not quite. The best answer: ') + right + (sol.overflow ? ' ' + sol.sum + ' - 256 = ' + sol.stored + '.' : '') + res.extra, ok ? 'good' : 'bad');
        showMethod(q, ok ? 'The method' : 'The method, column by column', !ok);
        showNext();
      }
    }
  }

  // Keys: Enter presses the main button; letters answer stage 1 and the exam options.
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
    var t = e.target;
    if (e.key === 'Enter') {
      if (t && (t.tagName === 'BUTTON' || t.tagName === 'INPUT')) return; // they handle Enter themselves
      var b = actions.querySelector('.check-btn, .next-btn, .step-btn');
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
      return;
    }
    if (t && t.tagName === 'INPUT') return;
    if (cur && cur.keys && cur.keys(e.key)) e.preventDefault();
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
  window.__ovl = { state: function () { return state; }, cur: function () { return cur; }, go: goStage, next: nextQuestion };
})();
