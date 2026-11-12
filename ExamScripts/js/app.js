// Exam Scripts: the page. One script at a time: the question, the help for its level, a box to type in, then the
// marks with each missing point. Progress is saved in bc-examscripts-v1 (cloud-saved as app examscripts).
(function () {
  'use strict';
  var SAVE_KEY = 'bc-examscripts-v1';
  var EMBED = window.parent !== window;
  var state = load();
  state.session = (state.session || 0) + 1;
  if (!state.topic || !ES.TOPICS.some(function (t) { return t.id === state.topic; })) state.topic = 'all';
  save();

  function load() {
    try { var raw = localStorage.getItem(SAVE_KEY); return ES.fixState(raw ? JSON.parse(raw) : null); } catch (e) { return ES.newState(); }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function btn(label, fn) {
    var b = el('button', 'btn', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  var TICK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function pips(level, secure) {
    var h = '<span class="pips' + (secure ? ' secure' : '') + '" aria-hidden="true">';
    for (var i = 1; i <= ES.TOP; i++) h += '<i class="' + (i <= level ? 'on' : '') + '"></i>';
    return h + '</span>';
  }
  function levelLabel(n) { return 'Level ' + n + ' of ' + ES.TOP + ': ' + ES.LEVELS[n].name; }

  // ---------- page skeleton ----------
  var main = document.querySelector('main');
  main.innerHTML =
    '<header class="top"><h1 class="title">Exam Scripts</h1>' +
    '<div class="overall"><span class="overall-text"></span><span class="meter"><i></i></span></div></header>' +
    '<nav class="tabs" aria-label="Topics"></nav>' +
    '<div class="layout"><section class="panel card" aria-live="polite"></section>' +
    '<aside class="panel progress"><h2>Your scripts</h2><p class="small rule">A script is secure when you write it from a blank box twice, with other scripts in between. Secure scripts still come back now and then.</p><div class="rows"></div></aside></div>';
  var card = main.querySelector('.card'), rowsEl = main.querySelector('.rows'), tabsEl = main.querySelector('.tabs');

  function drawHeader() {
    var c = ES.counts(state, 'all');
    main.querySelector('.overall-text').textContent = c.secure + ' of ' + c.total + ' secure';
    main.querySelector('.meter i').style.width = (100 * c.secure / c.total) + '%';
    tabsEl.innerHTML = '';
    ES.TOPICS.forEach(function (t) {
      var tc = ES.counts(state, t.id);
      var b = el('button', 'tab' + (state.topic === t.id ? ' on' : ''), esc(t.name) + ' <span class="tcount">' + tc.secure + '/' + tc.total + '</span>');
      b.type = 'button';
      b.setAttribute('aria-pressed', state.topic === t.id ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (state.topic === t.id) return;
        state.topic = t.id;
        if (cur && !cur.answered) state.cur = null;
        save();
        nextScript();
      });
      tabsEl.appendChild(b);
    });
  }
  function drawRows() {
    rowsEl.innerHTML = '';
    ES.TOPICS.slice(1).forEach(function (t) {
      if (state.topic !== 'all' && state.topic !== t.id) return;
      rowsEl.appendChild(el('div', 'group', esc(t.name)));
      ES.SCRIPTS.filter(function (s) { return s.topic === t.id; }).forEach(function (s) {
        var r = state.scripts[s.id], open = state.open.indexOf(s.id) >= 0;
        var row = el('div', 'row' + (r.secure ? ' secure' : '') + (!open ? ' closed' : '') + (cur && cur.id === s.id ? ' now' : ''));
        var right = !open ? '<span class="small">Opens later</span>' : r.secure ? pips(ES.TOP, true) + ' <span class="small">Secure</span>' : pips(r.level, false);
        row.innerHTML = '<span class="rname">' + esc(s.title) + '</span><span>' + right + '</span>';
        if (open && !r.secure) row.title = levelLabel(r.level);
        rowsEl.appendChild(row);
      });
    });
  }

  // ---------- one script ----------
  var cur = null; // { id, vi, level, answered }
  function nextScript() {
    var saved = state.cur;
    if (saved && !saved.answered && ES.BY_ID[saved.id] && saved.topic === state.topic) cur = { id: saved.id, vi: saved.vi, answered: false };
    else {
      var p = ES.pick(state, state.topic);
      cur = { id: p.id, vi: p.vi, answered: false };
      state.cur = { id: p.id, vi: p.vi, topic: state.topic, answered: false };
      save();
    }
    show();
  }

  function show() {
    var sc = ES.BY_ID[cur.id], r = state.scripts[cur.id], v = sc.variants[cur.vi] || sc.variants[0];
    cur.level = r.level;
    drawHeader();
    drawRows();
    card.innerHTML = '';
    if (ES.allSecure(state, state.topic)) {
      card.appendChild(el('div', 'done-all', 'Every script here is secure. Keep practising to keep them strong.'));
    }
    var head = el('div', 'card-head');
    head.appendChild(el('h2', '', esc(sc.title)));
    head.appendChild(el('span', 'level-badge', esc(r.secure ? 'Secure: practice' : levelLabel(r.level)) + pips(r.level, r.secure)));
    card.appendChild(head);
    card.appendChild(el('p', 'question', esc(v.q) + ' <span class="marks">[' + sc.marks + (sc.marks === 1 ? ' mark' : ' marks') + ']</span>'));
    card.appendChild(el('p', 'how', esc(ES.LEVELS[r.level].how)));
    var lines = ES.scaffold(sc, cur.vi, r.level);
    var box = el('div', 'scaffold' + (lines.length ? '' : ' blank'));
    if (lines.length) lines.forEach(function (l) { box.appendChild(el('p', '', r.level === 3 ? esc(l).replace(/([A-Za-z])__/g, '<span class="fl">$1</span>') : esc(l))); });
    else box.textContent = sc.marks + (sc.marks === 1 ? ' mark: write 1 point.' : ' marks: write ' + sc.marks + ' points.');
    card.appendChild(box);
    var ta = el('textarea', 'answer');
    ta.setAttribute('aria-label', 'Your answer');
    ta.setAttribute('spellcheck', 'false');
    ta.setAttribute('autocomplete', 'off');
    ta.rows = Math.max(3, Math.min(8, sc.marks + 2));
    ta.placeholder = 'Type your answer here.';
    card.appendChild(ta);
    var actions = el('div', 'actions');
    actions.appendChild(btn('Check', check));
    var note = el('span', 'note', 'Ctrl + Enter also checks.');
    actions.appendChild(note);
    card.appendChild(actions);
    var fbEl = el('div', 'feedback');
    card.appendChild(fbEl);

    function block(e) {
      e.preventDefault();
      note.className = 'note warn';
      note.textContent = 'Type it yourself. Typing it helps you remember it.';
    }
    ta.addEventListener('paste', block);
    ta.addEventListener('drop', block);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); check(); }
    });
    try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); }

    function check() {
      if (cur.answered) return;
      var res = ES.mark(sc, cur.vi, ta.value, cur.level);
      if (res.empty) { note.className = 'note warn'; note.textContent = 'Type your answer first.'; ta.focus(); return; }
      cur.answered = true;
      ta.readOnly = true;
      var mv = ES.record(state, cur.id, cur.vi, res.full);
      state.cur = { id: cur.id, vi: cur.vi, topic: state.topic, answered: true };
      save();
      feedback(fbEl, sc, cur.vi, res, mv);
      actions.innerHTML = '';
      var nb = btn('Next script', function () { nextScript(); });
      actions.appendChild(nb);
      try { nb.focus({ preventScroll: true }); } catch (e) { nb.focus(); }
      drawHeader();
      drawRows();
      report(sc, res, mv, ta.value);
      if (mv.secureNow && typeof Fx !== 'undefined') Fx.confettiAt(fbEl, 90);
    }
  }

  function feedback(fbEl, sc, vi, res, mv) {
    fbEl.innerHTML = '';
    fbEl.appendChild(el('div', 'score ' + (res.full ? 'good' : 'bad'),
      res.full ? 'Full marks: ' + res.marks + ' of ' + res.marks + '.' : res.score + ' of ' + res.marks + (res.marks === 1 ? ' mark.' : ' marks.')));
    var list = el('ul', 'points');
    ES.pointsOf(sc, vi).forEach(function (p) {
      if (res.met.indexOf(p.id) >= 0) list.appendChild(el('li', 'met', TICK + '<span>' + esc(p.need) + '</span>'));
    });
    res.missing.forEach(function (m) {
      var html;
      if (m.rival) html = 'You wrote <q>' + esc(m.quote) + '</q>. Give one answer that fits this job. A mark needs: ' + esc(m.need);
      else if (m.quote) html = 'You wrote <q>' + esc(m.quote) + '</q>. A mark needs: ' + esc(m.need);
      else html = 'A mark needs: ' + esc(m.need);
      list.appendChild(el('li', 'miss', CROSS + '<span>' + html + '</span>'));
    });
    if (list.children.length) fbEl.appendChild(list);
    var msg, cls = 'up';
    if (res.full) {
      if (mv.secureNow) msg = null;
      else if (state.scripts[sc.id].secure) msg = 'Still secure. It will come back now and then.';
      else if (mv.notSpaced) msg = 'Good. Write it again after some other scripts, and it will count.';
      else if (mv.from >= ES.BLANK && mv.pass) msg = 'Blank pass ' + state.scripts[sc.id].passes.length + ' of ' + ES.NEED_PASSES + '. It comes back later with a new question.';
      else if (mv.from >= ES.BLANK) msg = 'Secure. It will come back now and then.';
      else msg = 'Next time: less help (' + levelLabel(mv.to) + ').';
    } else {
      cls = 'down';
      if (mv.from === 1) msg = 'Copy it again carefully next time. Check each point above.';
      else msg = 'Next time: more help (' + levelLabel(mv.to) + ').';
      if (mv.lost) msg += ' Write it from a blank box twice more to make it secure again.';
    }
    if (msg) fbEl.appendChild(el('p', 'move ' + cls, esc(msg)));
    if (mv.secureNow) fbEl.appendChild(el('div', 'secure-msg', 'Secure: you wrote it from a blank box twice.'));
  }

  // ---------- reports to the site ----------
  // BC_APP_RESULT: the lesson slide saves it as the slide's answer. BC_DRILL_PROGRESS: one record per script for the
  // teacher, and the count of scripts ever made secure for lesson homework (drillId exam-scripts).
  function post(msg) { if (EMBED) { try { window.parent.postMessage(msg, '*'); } catch (e) {} } }
  function report(sc, res, mv, text) {
    var c = ES.counts(state, 'all'), r = state.scripts[sc.id];
    post({ type: 'BC_APP_RESULT', questionId: 'exam-scripts', label: 'Exam Scripts: scripts secure (' + c.secure + ' of ' + c.total + ')',
      summary: ES.summary(state), complete: c.secure === c.total });
    post({ type: 'BC_DRILL_PROGRESS', drillId: 'exam-scripts', drillLabel: 'Exam Scripts', cardId: sc.id, cardPrompt: sc.title,
      everMastered: r.everSecure, everCount: c.everSecure, total: c.total, correct: res.full,
      summary: 'Level ' + mv.from + ', ' + res.score + ' of ' + res.marks + ': ' + String(text || '').slice(0, 600) });
  }
  function reportOpen() {
    var c = ES.counts(state, 'all'), sc = ES.BY_ID[cur.id], r = state.scripts[sc.id];
    post({ type: 'BC_DRILL_PROGRESS', drillId: 'exam-scripts', drillLabel: 'Exam Scripts', cardId: sc.id, cardPrompt: sc.title,
      everMastered: r.everSecure, everCount: c.everSecure, total: c.total, summary: 'Opened. ' + ES.summary(state) });
  }

  // Height for a lesson embed.
  function reportHeight() {
    if (!EMBED) return;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(main);

  // Enter presses Next once a script is marked.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented) return;
    if (!cur || !cur.answered) return;
    var t = e.target;
    if (t && t.tagName === 'BUTTON') return;
    var b = card.querySelector('.actions .btn');
    if (b) { e.preventDefault(); b.click(); }
  });

  nextScript();
  reportOpen();
  window.__es = { state: function () { return state; }, cur: function () { return cur; }, next: nextScript };
})();
