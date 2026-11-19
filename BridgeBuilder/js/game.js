// Data Bridge: build a bridge between two server racks so the data truck can cross. Exam marks are the only money.
// Each round: an exam round on one page (ExamGame client, like Circuit Siege), then build, then send the truck.
// A crossing keeps the leftover coins; a snapped beam, a fall or a stuck truck keeps the same round: a fresh exam round,
// then rebuild (Ph.afterTest has the coin rule).
// Timers only, never requestAnimationFrame: lessons preload the page in a hidden iframe.
(function () {
  'use strict';
  var Ph = window.BBPhys;
  var P = new URLSearchParams(location.search);
  var WANT_SET = P.get('set') || P.get('mode') || '';
  var GOAL = Math.max(1, parseInt(P.get('goal'), 10) || 3);
  var KEY = 'bc-databridge-v1:';
  var W = 960, H = 540, SC = 30, TOP_Y = 7;   // 30 pixels per square; the top of the board is y = 7
  var ROUNDS = Ph.LEVELS.length;
  var TIPS = [
    'Build a bridge so the data truck can cross the gap. Press on a gold anchor and drag to start a beam.',
    'Let go on a grid point to place the beam. For the next beam, drag again from any joint on your bridge.',
    'The truck drives on Road only. Triangles make a bridge strong. Press Send the truck when you are ready.'
  ];
  var MAT_COL = { road: '#4b5563', wood: '#c58a45', steel: '#8fb4d9' };

  // ---------------------------------------------------------------- helpers
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function store(k, v) { try { if (v == null) localStorage.removeItem(KEY + k); else localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  function hiddenNow() { return document.hidden || window.innerWidth === 0 || window.innerHeight === 0; }
  function api() { return window.ExamGame; }
  function call(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
  function errText(e) { return (e && e.message) || 'Something went wrong. Try again.'; }
  function sx(x) { return x * SC; }
  function sy(y) { return (TOP_Y - y) * SC; }

  function reportHeight() {
    if (window.parent === window) return;
    var h = $('app').getBoundingClientRect().height;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(h) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe($('app'));
  window.addEventListener('load', reportHeight);

  // ---------------------------------------------------------------- state
  // S (saved per topic): { v, round, coins, phase: exam | build | testing | over | won, design, exam, best, stats, over }
  var sets = [], setId = '', setTitle = '';
  var S = null, LV = null, sim = null;
  // Teacher mode (js/teacher.js): TM is null in normal play. Progress writes and the slide result go through guard,
  // which drops them while teacher mode is on; the student's game waits in TM.real and comes back on exit.
  var T = window.BBTeacher, TM = null;
  var guard = T.makeGuard({ store: store, post: function (m) { try { window.parent.postMessage(m, '*'); } catch (e) {} } });
  var ui = { mat: 'road', sel: null, hover: null, undo: [], speed: 1, acc: 0, endShown: false, drawn: 0 };

  function newGame() {
    S = { v: 2, round: 1, coins: 0, phase: 'exam', design: null, exam: null, best: load('best:' + setId, 0),
      stats: { marks: 0, max: 0, rounds: 0, log: [] } };
    save();
  }
  function save() { if (S) guard.store('game:' + setId, S); }
  // v2: each round has its own layout. A v1 save (every round the same two cliffs) is reset with a short message.
  function validSave(s) { return s && s.v === 2 && s.round >= 1 && s.round <= ROUNDS && /^(exam|build|testing)$/.test(s.phase); }

  // ---------------------------------------------------------------- results for the lesson slide
  function postResult() {
    if (window.parent === window || !S || TM) return;
    var done = (S.best || 0) >= GOAL;
    if (done) guard.store('done:' + setId, true);
    var before = !!load('done:' + setId, false);
    var head = done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.';
    var line = ' Best: crossed ' + (S.best || 0) + ' of ' + ROUNDS + ' rounds. Now on round ' + S.round + '. Marks ' + S.stats.marks + ' of ' + S.stats.max + ' in ' + S.stats.rounds + ' exam rounds.';
    guard.post({ type: 'BC_APP_RESULT', questionId: 'data-bridge-' + setId, label: 'Data Bridge: ' + (setTitle || setId),
      summary: head + line + (S.stats.log.length ? ' ' + S.stats.log.slice(-10).join(' ') : ''), complete: done || before });
  }

  // ---------------------------------------------------------------- HUD and start screen
  function setHud(on) { $('hud').hidden = !on; if (on) updateHud(); }
  function updateHud() {
    if (!S) return;
    $('hudRound').textContent = S.round; $('hudRounds').textContent = ROUNDS; $('hudCoins').textContent = S.coins;
    syncTeacherBar();
  }
  function coinPop(n) {
    var wrap = $('hudCoinsWrap'); if (!wrap || !n) return;
    var s = document.createElement('span'); s.className = 'bb-pop'; s.textContent = '+' + n + ' coins';
    wrap.appendChild(s); setTimeout(function () { s.remove(); }, 1500);
    wrap.classList.remove('is-bump'); void wrap.offsetWidth; wrap.classList.add('is-bump');
  }

  function showStart() {
    sim = null; setHud(false);
    $('screen').innerHTML = '<div class="bb-card bb-start"><p class="bb-lead">Loading...</p></div>';
    call(function () { return api().sets(); }).then(function (list) {
      sets = (list || []).filter(function (s) { return s && s.setId; });
      if (!sets.length) throw new Error('No question topics yet.');
      if (!setId || !sets.some(function (s) { return s.setId === setId; })) setId = sets[0].setId;
      drawStart();   // a preset topic is only the default choice; every topic stays on the start screen
    }).catch(function (e) {
      $('screen').innerHTML = '<div class="bb-card bb-start"><h1>Data Bridge</h1><p class="bb-lead">' + esc(errText(e)) + '</p><button class="bc-btn" id="retry">Try again</button></div>';
      $('retry').onclick = showStart;
    });
  }

  function drawStart() {
    if (api().warm) api().warm(setId);
    var cur = sets.filter(function (s) { return s.setId === setId; })[0];
    setTitle = cur ? (cur.title || cur.setId) : setId;
    var saved = load('game:' + setId, null), wasOld = !!(saved && saved.v === 1);
    if (wasOld) store('game:' + setId, null);
    if (!validSave(saved)) saved = null;
    var best = load('best:' + setId, 0);
    var h = '<div class="bb-card bb-start"><div class="bb-start-art"><canvas id="startArt" width="480" height="150"></canvas></div>' +
      '<h1>Data Bridge</h1>' +
      '<p class="bb-lead">Build a bridge so the data truck can cross from one server rack to the next. Answer exam questions to earn coins for the bridge.</p>' +
      // Grouped by year, then unit (shared/exam-game-client.js); a flat list if the client has no picker.
      '<p class="bb-label">Pick a topic</p>' + (api().topicPicker ? api().topicPicker(sets, setId, { pillClass: 'bb-pill' }) :
        '<div class="bb-choice-row">' + sets.map(function (s) {
          return '<button class="bb-pill' + (s.setId === setId ? ' is-on' : '') + '" data-set="' + esc(s.setId) + '">' + esc(s.title || s.setId) + '</button>';
        }).join('') + '</div>') +
      (wasOld ? '<p class="bb-label">Data Bridge has new levels, so your saved game starts again from round 1.</p>' : '') +
      (best ? '<p class="bb-label">Your best: crossed ' + best + ' of ' + ROUNDS + ' rounds</p>' : '');
    if (saved) {
      h += '<div class="bb-start-go"><button class="bc-btn bb-big" id="cont">Continue: round ' + saved.round + '</button>' +
        '<button class="bc-btn is-outline" id="fresh">New game</button></div>';
    } else h += '<div class="bb-start-go"><button class="bc-btn bb-big" id="go">Start</button></div>';
    $('screen').innerHTML = h + '</div>';
    paintStartArt();
    Array.prototype.forEach.call(document.querySelectorAll('[data-set]'), function (b) {
      b.onclick = function () { setId = b.getAttribute('data-set'); drawStart(); };
    });
    if ($('go')) $('go').onclick = function () { newGame(); startRound(); };
    if ($('cont')) $('cont').onclick = function () { S = saved; resume(); };
    if ($('fresh')) $('fresh').onclick = function () {
      if (this.getAttribute('data-sure')) { store('game:' + setId, null); drawStart(); return; }
      this.setAttribute('data-sure', '1'); this.textContent = 'Click again to start over';
    };
  }

  function paintStartArt() {
    var c = $('startArt'); if (!c) return;
    var g = c.getContext('2d');
    g.save(); g.scale(0.5, 0.5); g.translate(0, -70);
    var lv = Ph.level(1);
    Art.drawScene(g, makeScene(lv, false), sx(lv.L + 1.6));
    var d = Ph.emptyDesign(lv);
    [[lv.L, 0, lv.L + 2, 0, 'road'], [lv.L + 2, 0, lv.L + 4, 0, 'road'], [lv.L + 4, 0, lv.R, 0, 'road'], [lv.L, 0, lv.L + 1, 2, 'wood'],
      [lv.L + 1, 2, lv.L + 2, 0, 'wood'], [lv.L + 2, 0, lv.L + 3, 2, 'steel'], [lv.L + 3, 2, lv.L + 4, 0, 'steel'], [lv.L + 4, 0, lv.L + 5, 2, 'wood'],
      [lv.L + 5, 2, lv.R, 0, 'wood'], [lv.L + 1, 2, lv.L + 3, 2, 'wood'], [lv.L + 3, 2, lv.L + 5, 2, 'wood']].forEach(function (b) {
      Ph.addBeam(d, { x: b[0], y: b[1] }, { x: b[2], y: b[3] }, b[4]);
    });
    d.beams.forEach(function (bm) { Art.drawBeam(g, d.nodes[bm.a], d.nodes[bm.b], bm.mat, null); });
    d.nodes.forEach(function (n) { Art.drawNode(g, n.x, n.y, n.fixed); });
    Art.drawTruck(g, { x: lv.L + 1.6, y: Ph.WHEEL_R }, { x: lv.L + 1.6 + Ph.AXLE, y: Ph.WHEEL_R }, false);
    g.restore();
  }

  function resume() {
    LV = Ph.level(S.round);
    if (S.phase === 'exam') { startRound(true); return; }
    if (S.phase === 'testing') {
      // The page was closed while the truck was driving: the physics is the same every time, so finish that test here.
      var s = Ph.makeSim(LV, S.design); Ph.run(s, 60);
      finishTest(s.state, true);
      return;
    }
    enterBuild();
  }

  // ---------------------------------------------------------------- build screen
  var canvas, ctx;

  function enterBuild() {
    sim = null; ui.endShown = false;
    LV = Ph.level(S.round);
    if (!S.design) S.design = Ph.emptyDesign(LV);
    S.phase = 'build'; save();
    setHud(true);
    ui.sel = null; ui.drag = null; ui.hover = null; ui.undo = [];
    $('screen').innerHTML =
      '<div class="bb-tip" id="tip" hidden><span id="tipText"></span><button class="bc-btn is-tonal" id="tipOk">OK</button></div>' +
      '<div class="bb-board" id="board"><canvas id="cv" width="' + W + '" height="' + H + '"></canvas><div class="bb-toast" id="toast" hidden></div>' +
      '<div class="bb-over" id="over" hidden></div></div>' +
      '<div class="bb-tools" id="tools"></div>';
    canvas = $('cv'); ctx = canvas.getContext('2d'); fitBoard();
    scene = makeScene(LV, true); valid.key = ''; Art.resetSim();
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', function () { if (ui.drag == null) { ui.hover = null; render(); } });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', function (e) { if (ui.drag === e.pointerId) cancelDrag(); });
    canvas.addEventListener('lostpointercapture', function (e) { if (ui.drag === e.pointerId) cancelDrag(); });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); cancelDrag(); });
    $('tipOk').onclick = tipOk;
    drawTools();
    var t = load('tut', 0);
    if (t < TIPS.length) showTip(t);
    else note(roundLine(LV) + ' The truck weighs ' + LV.truck + ' tonnes.');
    render();
  }

  function roundLine(lv) { return 'Round ' + lv.n + ': ' + lv.intro; }
  var noteOn = false;
  function tipOk() {
    $('tip').hidden = true;
    if (noteOn) { noteOn = false; return; }
    var n = load('tut', 0); store('tut', n + 1);
    if (n + 1 < TIPS.length) showTip(n + 1);
  }
  function showTip(i) { if (!$('tip')) return; noteOn = false; $('tipText').textContent = TIPS[i]; $('tip').hidden = false; }
  function tipDone(i) { if (load('tut', 0) === i) { store('tut', i + 1); if (i + 1 < TIPS.length) showTip(i + 1); else if ($('tip')) $('tip').hidden = true; } }
  function note(text) {
    if (!$('tip')) return;
    noteOn = true; $('tipText').textContent = text; $('tip').hidden = false;
    clearTimeout(note.timer); note.timer = setTimeout(function () { if (noteOn && $('tip')) { noteOn = false; $('tip').hidden = true; } }, 9000);
  }
  function toast(text) {
    var t = $('toast'); if (!t) return;
    t.textContent = text; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(function () { if ($('toast')) $('toast').hidden = true; }, 2600);
  }

  function spent() { return Ph.designCost(S.design); }
  // Teacher mode Unlimited: the cost still shows, the money check is skipped.
  function canAfford(c) { return !!(TM && TM.unlimited) || spent() + c <= S.coins; }
  function drawTools() {
    var box = $('tools'); if (!box) return;
    var testing = !!sim;
    var left = S.coins - spent();
    var h = Ph.MAT_ORDER.map(function (k) {
      var m = Ph.MATS[k];
      return '<button class="bb-mat' + (ui.mat === k ? ' is-on' : '') + '" data-mat="' + k + '"' + (testing ? ' disabled' : '') + '><i style="background:' + MAT_COL[k] + '"></i>' + m.name +
        ' <em>' + m.price + ' a square</em></button>';
    }).join('') +
      '<button class="bb-mat' + (ui.mat === 'delete' ? ' is-on' : '') + '" data-mat="delete"' + (testing ? ' disabled' : '') + '>Delete beam</button>' +
      '<button class="bc-btn is-outline" id="undo"' + (testing || !ui.undo.length ? ' disabled' : '') + '>Undo</button>' +
      '<span class="bb-sep"></span>' +
      '<span class="bb-cost">Bridge <b>' + spent() + '</b> of ' + (TM && TM.unlimited ? '<b>unlimited</b>' : '<b' + (left < 10 ? ' class="is-low"' : '') + '>' + S.coins + '</b> coins') + '</span>' +
      '<button class="bc-btn bb-big" id="send"' + (testing ? ' disabled' : '') + '>Send the truck</button>';
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('[data-mat]'), function (b) {
      b.onclick = function () { ui.mat = b.getAttribute('data-mat'); if (ui.mat === 'delete') ui.sel = null; drawTools(); render();
        if (ui.mat === 'delete') toast('Tap a beam to take it away. You get its coins back.'); };
    });
    if ($('undo')) $('undo').onclick = undo;
    if ($('send')) $('send').onclick = sendTruck;
  }

  function boardXY(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  // Keeps the board at 16:9: in the page it fills the width; in full screen it fits inside the window (letterboxed and
  // centred, the HUD and toolbar still showing). The backing store is the shown size times devicePixelRatio, so it stays
  // sharp; boardXY maps clicks through the shown size, so hit-testing works at any size.
  function fitBoard() {
    if (!canvas || !document.body.contains(canvas)) return;
    var full = document.documentElement.classList.contains('bb-fs'), w;
    if (full) {
      var shown = canvas.getBoundingClientRect().height;
      var chrome = $('app').getBoundingClientRect().height - shown;
      var availH = window.innerHeight - chrome - 24, availW = $('app').clientWidth - 32;
      w = Math.max(320, Math.min(availW, availH * W / H));
      canvas.style.width = Math.floor(w) + 'px'; canvas.style.height = Math.floor(w * H / W) + 'px';
    } else {
      canvas.style.width = ''; canvas.style.height = '';
      w = canvas.parentNode.clientWidth;
    }
    if (!(w > 0)) return;   // hidden (a preloaded slide): keep the size it has
    var dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    var bw = Math.round(w * dpr), bh = Math.round(bw * H / W);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    ui.k = bw / W;
    render();
  }
  window.addEventListener('resize', function () { fitBoard(); });
  function gridAt(p) { return { x: Math.round(p.x / SC), y: Math.round(TOP_Y - p.y / SC) }; }
  function onMove(e) {
    if (sim) return;
    var p = boardXY(e);
    ui.hover = { px: p.x, py: p.y, g: gridAt(p) };
    render();
  }
  function beamAt(px, py) {
    var best = -1, bd = 12;
    S.design.beams.forEach(function (bm, i) {
      var a = S.design.nodes[bm.a], b = S.design.nodes[bm.b];
      var ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y), ex = bx - ax, ey = by - ay, ll = ex * ex + ey * ey || 1;
      var t = Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / ll));
      var d = Math.hypot(px - ax - ex * t, py - ay - ey * t);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  // Building is press, drag, release (pointer events, so mouse, touch and pen). Press on a joint starts a beam (ui.sel
  // is its start while ui.drag holds the pointer); release on a valid point places it; anywhere else it is dropped.
  function cancelDrag() {
    if (ui.drag == null && !ui.sel) return;
    var id = ui.drag; ui.drag = null; ui.sel = null;
    try { if (id != null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); } catch (e) {}
    render();
  }
  function onDown(e) {
    if (sim) return;
    if (e.button !== 0 && e.pointerType === 'mouse') { cancelDrag(); return; }
    if (ui.drag != null) return;
    var p = boardXY(e), g = gridAt(p), d = S.design;
    if (ui.mat === 'delete') {
      var i = beamAt(p.x, p.y);
      if (i < 0) return;
      var bm = d.beams[i];
      ui.undo.push({ type: 'del', a: { x: d.nodes[bm.a].x, y: d.nodes[bm.a].y }, b: { x: d.nodes[bm.b].x, y: d.nodes[bm.b].y }, mat: bm.mat });
      Ph.removeBeam(d, i); save(); drawTools(); render();
      return;
    }
    if (Ph.findNode(d, g.x, g.y) < 0) return;   // only a joint starts a beam
    e.preventDefault();
    ui.sel = g; ui.drag = e.pointerId; ui.hover = { px: p.x, py: p.y, g: g };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    tipDone(0); render();
  }
  function onUp(e) {
    if (ui.drag !== e.pointerId) return;
    var a = ui.sel, p = boardXY(e), g = gridAt(p), d = S.design;
    cancelDrag();
    if (sim || !a) return;
    if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) return;   // let go outside the board: cancelled
    if (a.x === g.x && a.y === g.y) return;
    var why = Ph.beamProblem(LV, d, a, g);
    if (why) { toast(why); return; }
    var c = Ph.beamCost(ui.mat, a, g);
    if (!canAfford(c)) { toast('Not enough coins: that beam costs ' + c + '.'); return; }
    Ph.addBeam(d, a, g, ui.mat);
    ui.undo.push({ type: 'add', a: a, b: g });
    tipDone(1);
    save(); drawTools(); render();
  }
  function undo() {
    var u = ui.undo.pop(), d = S.design; if (!u) return;
    var ia = Ph.findNode(d, u.a.x, u.a.y), ib = Ph.findNode(d, u.b.x, u.b.y);
    if (u.type === 'add') {
      for (var i = d.beams.length - 1; i >= 0; i--) {
        var bm = d.beams[i];
        if ((bm.a === ia && bm.b === ib) || (bm.a === ib && bm.b === ia)) { Ph.removeBeam(d, i); break; }
      }
    } else {
      if (canAfford(Ph.beamCost(u.mat, u.a, u.b))) Ph.addBeam(d, u.a, u.b, u.mat);
    }
    save(); drawTools(); render();
  }

  // ---------------------------------------------------------------- the test
  function sendTruck() {
    if (sim) return;
    if (!S.design.beams.some(function (b) { return b.mat === 'road'; })) {
      if (!this || this.getAttribute('data-sure') !== '1') {
        toast('There is no road yet. The truck will fall. Press again to send it anyway.');
        if ($('send')) $('send').setAttribute('data-sure', '1');
        return;
      }
    }
    ui.sel = null; ui.drag = null; ui.hover = null;
    sim = Ph.makeSim(LV, S.design); ui.simD = S.design;
    S.phase = 'testing'; save();
    tipDone(2);
    if ($('tip')) $('tip').hidden = true;
    drawTools(); render();
  }

  // state: won, broke, fell or stuck. quiet: worked out without showing the drive (a reload during the test).
  function finishTest(state, quiet) {
    var cost = Ph.designCost(S.design), round = S.round, coinsBefore = S.coins;
    if (TM && TM.noOver && state !== 'won') { teacherRetry(state, quiet); return; }
    Ph.afterTest(S, state, cost);
    if (state === 'won') { guard.store('best:' + setId, Math.max(load('best:' + setId, 0), S.best || 0)); }
    S.stats.log.push(state === 'won' ? 'Round ' + round + ': crossed.' : 'Round ' + round + ': bridge failed.');
    save(); postResult();
    var won = state === 'won';
    var title = won ? (S.phase === 'won' ? 'You crossed every gap!' : 'The truck made it!') : ({ broke: 'The bridge broke', fell: 'The truck fell', stuck: 'The truck got stuck' }[state] || 'The bridge failed');
    var why = { won: '', broke: 'A beam snapped and the bridge broke.', fell: 'The truck fell into the gap.', stuck: 'The truck got stuck.' }[state] || '';
    var body = won
      ? (S.phase === 'won' ? 'You beat all ' + ROUNDS + ' rounds.' : 'The bridge cost ' + cost + ' coins. You keep ' + (coinsBefore - cost) + ' coins for the next round.')
      : why + ' Answer new questions to earn coins, then try this level again.' + (S.coins ? ' You keep ' + S.coins + ' coins.' : '');
    var btnText = won && S.phase === 'won' ? 'Play again' : (TM ? 'Next: round ' : 'Next: exam round ') + S.round;
    var html = '<div class="bb-card"><h2>' + title + '</h2><p class="bb-lead">' + esc(body) + '</p>' +
      (!won ? '<p class="bb-lead">Tip: use triangles, and steel where the colours turned red.</p>' : '') +
      '<div class="bb-start-go"><button class="bc-btn bb-big" id="nextBtn">' + btnText + '</button></div></div>';
    var go = function () {
      if (S.phase === 'won') { guard.store('game:' + setId, null); if (TM) { teacherJump(1); return; } newGame(); }
      sim = null; startRound();
    };
    if (quiet || !$('over')) {
      setHud(true);
      $('screen').innerHTML = '<div class="bb-q">' + html + '</div>';
    } else {
      var o = $('over'); o.className = 'bb-over ' + (won ? 'is-good' : 'is-bad'); o.innerHTML = html;
      setTimeout(function () {
        if ($('over') !== o) return;
        o.hidden = false;
        try { $('nextBtn').focus({ preventScroll: true }); } catch (e) {}
      }, won ? 1600 : 1100);
    }
    updateHud();
    $('nextBtn').onclick = go;
    if (quiet) try { $('nextBtn').focus({ preventScroll: true }); } catch (e) {}
  }

  // ---------------------------------------------------------------- art (all drawing lives in js/art.js)
  var Art = window.Art;
  Art.setup({ W: W, H: H, SC: SC, TOP_Y: TOP_Y, WORLD_W: Ph.WORLD_W, WHEEL_R: Ph.WHEEL_R, AXLE: Ph.AXLE });
  var scene = null, valid = { key: '', pts: [] };
  function makeScene(lv, grid) {
    return Art.prepare(lv, grid ? { gridOk: function (x, y) { return y >= Ph.Y_MIN && y <= Ph.Y_MAX && Ph.pointOk(lv, x, y) && !Ph.isAnchor(lv, x, y); } } : null);
  }
  function truckAt(lv) { return [{ x: lv.start.x, y: lv.start.y + Ph.WHEEL_R }, { x: lv.start.x + Ph.AXLE, y: lv.start.y + Ph.WHEEL_R }]; }
  // the points a beam from the selected joint could reach, worked out once per selection
  function validPoints(d) {
    var key = ui.sel.x + ',' + ui.sel.y + ':' + d.beams.length + ':' + d.nodes.length;
    if (valid.key === key) return valid.pts;
    var pts = [];
    for (var x = Math.ceil(ui.sel.x - Ph.MAX_LEN); x <= ui.sel.x + Ph.MAX_LEN; x++) {
      for (var y = Math.ceil(ui.sel.y - Ph.MAX_LEN); y <= ui.sel.y + Ph.MAX_LEN; y++) {
        if (x < 0 || x > Ph.WORLD_W || (x === ui.sel.x && y === ui.sel.y)) continue;
        if (!Ph.beamProblem(LV, d, ui.sel, { x: x, y: y })) pts.push({ x: x, y: y });
      }
    }
    valid.key = key; valid.pts = pts;
    return pts;
  }

  function render() {
    var d = sim ? ui.simD : S && S.design;   // the drive keeps its design after the round ends (S.design is cleared)
    if (!ctx || !S || !d || !scene) return;
    var g = ctx;
    g.setTransform(ui.k || 1, 0, 0, ui.k || 1, 0, 0);   // the game draws in W x H board units; fitBoard sets the scale
    Art.tick();
    if (sim) Art.trackSim(sim);
    var tw = sim ? [sim.P[sim.wheels[0]], sim.P[sim.wheels[1]]] : truckAt(LV);
    Art.begin(g);
    Art.drawScene(g, scene, sx((tw[0].x + tw[1].x) / 2));
    if (sim) {
      sim.B.forEach(function (bm) { if (!bm.broken) Art.drawBeam(g, sim.P[bm.a], sim.P[bm.b], bm.mat, bm.stress); });
      sim.P.forEach(function (p, i) { if (!p.wheel && i < d.nodes.length) Art.drawNode(g, p.x, p.y, p.fixed); });
      Art.drawTruck(g, tw[0], tw[1], true);
      Art.drawFx(g); Art.end(g);
      return;
    }
    Art.drawGrid(g, scene);
    d.beams.forEach(function (bm) { Art.drawBeam(g, d.nodes[bm.a], d.nodes[bm.b], bm.mat, null); });
    if (ui.sel && ui.mat !== 'delete') Art.drawValid(g, validPoints(d));
    d.nodes.forEach(function (n) { Art.drawNode(g, n.x, n.y, n.fixed, ui.sel && ui.sel.x === n.x && ui.sel.y === n.y); });
    Art.drawTruck(g, tw[0], tw[1], false);
    var hv = ui.hover;
    if (hv && ui.mat === 'delete') {
      var bi = beamAt(hv.px, hv.py);
      if (bi >= 0) {
        var bm = d.beams[bi];
        g.save(); g.strokeStyle = 'rgba(244, 67, 54, .9)'; g.lineWidth = 14; g.lineCap = 'round'; g.globalAlpha = .6;
        g.beginPath(); g.moveTo(sx(d.nodes[bm.a].x), sy(d.nodes[bm.a].y)); g.lineTo(sx(d.nodes[bm.b].x), sy(d.nodes[bm.b].y)); g.stroke(); g.restore();
        Art.label(g, hv.px, hv.py - 18, 'Delete: +' + Ph.beamCost(bm.mat, d.nodes[bm.a], d.nodes[bm.b]) + ' coins', '#f28b82');
      }
    } else if (hv && ui.sel) {
      var why = (ui.sel.x === hv.g.x && ui.sel.y === hv.g.y) ? 'same' : Ph.beamProblem(LV, d, ui.sel, hv.g);
      if (why !== 'same') {
        var c = Ph.beamCost(ui.mat, ui.sel, hv.g), poor = !canAfford(c), len = Ph.blen(ui.sel, hv.g);
        Art.drawGhost(g, ui.sel, hv.g, ui.mat, !!(why || poor));
        Art.label(g, sx(hv.g.x), sy(hv.g.y) - 22, why ? (len > Ph.MAX_LEN ? 'Too long' : 'Not here') : (poor ? c + ' coins: not enough' : c + ' coins, ' + (Math.round(len * 10) / 10) + ' squares'), why || poor ? '#f28b82' : '#ffffff');
      }
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(sx(hv.g.x), sy(hv.g.y), 7, 0, 7); g.stroke();
    } else if (hv) {
      var on = Ph.findNode(d, hv.g.x, hv.g.y) >= 0;
      g.strokeStyle = on ? 'rgba(138,180,248,.9)' : 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(sx(hv.g.x), sy(hv.g.y), on ? 12 : 6, 0, 7); g.stroke();
    }
    Art.drawFx(g); Art.end(g);
  }

  // One timer drives the test. It does nothing while the page is hidden (a preloaded lesson slide).
  var last = Date.now();
  setInterval(function () {
    var now = Date.now(), real = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (hiddenNow() || !ctx || !document.body.contains(canvas)) return;
    if (!sim) { if (now - ui.drawn >= 33) { ui.drawn = now; render(); } return; }
    ui.acc += real * Ph.FPS * ui.speed;
    var n = 0;
    while (ui.acc >= 1 && n < 16) { n++; ui.acc -= 1; }
    if (ui.acc > 4) ui.acc = 0;
    frames(n);
  }, 16);
  function frames(n) {
    for (var i = 0; i < n; i++) { Ph.step(sim); if (sim.state !== 'run' && sim.state !== 'breaking') break; }
    render();
    if (sim.state !== 'run' && sim.state !== 'breaking' && !ui.endShown) { ui.endShown = true; finishTest(sim.state, false); }
  }

  // ---------------------------------------------------------------- exam rounds (the Circuit Siege one-page round)
  // S.exam = { n, qs, rate, pool, paid, got, intro, items: [{ answer, doc, attempt, first, fb, open, err, rid }] }
  function blankItem() { return { answer: '', doc: null, attempt: 1, first: null, fb: null, open: false, err: '' }; }
  var ansBoxes = [], ansSaveT = 0, sending = false, sendFailed = '';

  function startRound(resuming) {
    if (TM) { S.coins += Ph.level(S.round).pool; S.exam = null; S.design = null; sim = null; enterBuild(); return; }   // teacher mode: no questions, full marks
    S.phase = 'exam'; LV = Ph.level(S.round);
    if (!resuming || !S.exam) S.exam = { n: S.round, qs: null, rate: 0, pool: 0, paid: 0, intro: true, items: null };
    save(); setHud(true); ctx = null; sim = null;
    var r = S.exam;
    if (r.qs) { showRound(); return; }
    $('screen').innerHTML = '<div class="bb-card bb-q"><p class="bb-lead">Loading questions...</p></div>';
    call(function () { return api().next(setId, { count: 3, maxMarks: 4 }); }).then(function (list) {
      list = (list || []).filter(function (q) { return q && q.qid; });
      if (!list.length) throw new Error('No questions right now.');
      // at most 4 marks in a round: drop questions from the end until it fits
      var total = 0, keep = [];
      list.forEach(function (q) { var m = Number(q.marks) || 1; if (!keep.length || total + m <= 4) { keep.push(q); total += m; } });
      r.qs = keep.map(function (q) { return { qid: q.qid, text: q.text, marks: Number(q.marks) || 1, blocks: q.blocks || null }; });
      r.items = r.qs.map(blankItem);
      r.pool = LV.pool;
      r.rate = r.pool / total;
      save();
      showRound();
    }).catch(function (e) {
      $('screen').innerHTML = '<div class="bb-card bb-q"><p class="bb-lead">' + esc(errText(e)) + '</p>' +
        '<div class="bb-start-go"><button class="bc-btn" id="retry">Try again</button></div></div>';
      $('retry').onclick = function () { startRound(true); };
    });
  }

  function roundTotal() { return S.exam.qs.reduce(function (a, q) { return a + q.marks; }, 0); }
  function canSend(it) { return !it.fb || it.open; }
  // The question as the exam shows it (tables, gates, registers, sums: shared/exam-question.js), or its plain text.
  function showQuestion(el, q) {
    var blocks = q.blocks || (window.ExamGame && window.ExamGame.blocksFor ? window.ExamGame.blocksFor(q.qid) : null);
    if (window.BCExamQuestion) window.BCExamQuestion.render(el, { text: q.text, blocks: blocks });
    else el.textContent = q.text;
  }

  function showRound() {
    var r = S.exam;
    if (r.intro) {
      var first = !load('seenRound', false);
      $('screen').innerHTML = '<div class="bb-card bb-q bb-intro"><h2>Exam round ' + r.n + '</h2>' +
        '<p class="bb-lead">' + esc(roundLine(Ph.level(r.n))) + '</p>' +
        '<p class="bb-q-text">' + r.qs.length + ' questions, ' + roundTotal() + ' marks.\nFull marks pays ' + r.pool + ' coins.</p>' +
        (S.coins ? '<p class="bb-lead">You also have ' + S.coins + ' coins saved.</p>' : '') +
        (first ? '<p class="bb-lead">Marks are the only way to earn coins. Then you spend them on your bridge.</p>' : '') +
        '<div class="bb-start-go"><button class="bc-btn bb-big" id="go">Start</button></div></div>';
      $('go').onclick = function () { r.intro = false; store('seenRound', true); save(); showRound(); };
      $('go').focus();
      return;
    }
    var scrollY = window.scrollY, firstShow = !$('roundForm');
    var h = '<div class="bb-card bb-q" id="roundForm"><div class="bb-round-head"><h2>Exam round ' + r.n + '</h2>' +
      '<span class="bb-pill">' + r.qs.length + ' questions, ' + roundTotal() + ' marks</span>' +
      '<span class="bb-pill">Full marks pays ' + r.pool + ' coins</span></div>';
    r.qs.forEach(function (q, i) {
      var it = r.items[i], edit = canSend(it);
      h += '<section class="bb-qblock" id="qb' + i + '"><div class="bb-q-meta"><span class="bb-qnum">Question ' + (i + 1) + '</span>' +
        '<span class="bb-pill">' + q.marks + (q.marks === 1 ? ' mark' : ' marks') + '</span>' +
        (it.attempt === 2 && it.open ? '<span class="bb-pill is-warn">Second try: half coins</span>' : '') + '</div>' +
        '<div class="bb-q-text" id="qText' + i + '"></div>' +
        '<p class="bb-label">Your answer' + (edit ? ' (you must type it)' : '') + ':</p><div id="ans' + i + '" class="bb-ans"></div>' +
        '<div class="bb-fb" id="fb' + i + '" hidden></div><p class="bb-q-err" id="err' + i + '" hidden></p></section>';
    });
    h += '<div class="bb-round-foot"><p class="bb-round-total" id="roundTotal" hidden></p><p class="bb-q-err" id="sendErr" hidden></p>' +
      '<div class="bb-q-actions" id="roundActs"></div></div></div>';
    $('screen').innerHTML = h;
    ansBoxes = [];
    r.qs.forEach(function (q, i) {
      var it = r.items[i], edit = canSend(it);
      showQuestion($('qText' + i), q);
      ansBoxes[i] = window.BCAnswerBox.mount($('ans' + i), { doc: it.doc, text: it.answer || '', rows: 3, maxLength: 800,
        label: 'Your answer to question ' + (i + 1), readOnly: !edit || sending,
        placeholder: 'Type your final answer here. You can type working here too.',
        onChange: function (text, doc) {
          it.answer = text; it.doc = doc;
          clearTimeout(ansSaveT); ansSaveT = setTimeout(save, 400);
          updateActs();
        } });
      if (!edit || sending) ansBoxes[i].setReadOnly(true);
      if (it.fb) showItemFeedback(i);
      if (it.err) { $('err' + i).hidden = false; $('err' + i).textContent = it.err; }
    });
    updateActs();
    if (firstShow) {
      var firstOpen = r.items.map(canSend).indexOf(true);
      if (firstOpen >= 0) setTimeout(function () { try { ansBoxes[firstOpen].focus(); } catch (e) {} }, 30);
    } else window.scrollTo(0, scrollY);
  }

  function showItemFeedback(i) {
    var it = S.exam.items[i], fb = it.fb, box = $('fb' + i);
    box.hidden = false;
    box.className = 'bb-fb ' + (it.open ? 'is-old ' : '') + (fb.marks === fb.max ? 'is-good' : fb.marks ? 'is-part' : 'is-bad');
    box.innerHTML = '<div class="bb-fb-head"><b>' + (it.open ? 'First try: ' : '') + fb.marks + ' of ' + fb.max + (fb.max === 1 ? ' mark' : ' marks') + '</b>' +
      (fb.pay ? '<span class="bb-coin-pop">+' + fb.pay + ' coins</span>' : '') + '</div>' +
      (fb.feedback ? '<p class="bb-fb-text"></p>' : '') +
      (fb.canRetry && !it.open ? '<div class="bb-q-actions"><button class="bc-btn is-outline" type="button" id="again' + i + '">Try again</button></div>' : '');
    if (fb.feedback) box.querySelector('.bb-fb-text').textContent = fb.feedback;
    if ($('again' + i)) $('again' + i).onclick = function () { openRetry([i]); };
  }

  function openRetry(list) {
    var r = S.exam;
    list.forEach(function (i) { var it = r.items[i]; if (it.fb && it.fb.canRetry && !it.open) { it.open = true; it.attempt = 2; it.err = ''; } });
    save(); showRound();
    var i0 = list[0];
    setTimeout(function () {
      var el = $('qb' + i0); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
      try { ansBoxes[i0].focus(); } catch (e) {}
    }, 30);
  }

  function updateActs() {
    var r = S.exam, acts = $('roundActs'); if (!acts) return;
    var open = [], retry = [], unmarked = 0, stuck = 0;
    r.items.forEach(function (it, i) {
      if (canSend(it)) open.push(i);
      if (!it.fb) { unmarked++; if (it.err) stuck++; }
      if (it.fb && it.fb.canRetry && !it.open) retry.push(i);
    });
    var ready = open.length && open.every(function (i) { var t = ansBoxes[i] ? ansBoxes[i].text() : r.items[i].answer; return String(t || '').trim(); });
    var h = '';
    if (open.length) h += '<button class="bc-btn bb-big" id="submitAll"' + (ready && !sending ? '' : ' disabled') + '>' + (sending ? 'Marking...' : sendFailed ? 'Send again' : 'Submit all') + '</button>';
    if (!open.length && retry.length) h += '<button class="bc-btn is-outline" id="againAll">Try again on the wrong ones</button>';
    if (!sending && !unmarked) h += '<button class="bc-btn' + (open.length ? ' is-outline' : ' bb-big') + '" id="toBuild">Build the bridge</button>';
    else if (!sending && (sendFailed || stuck)) h += '<button class="bc-btn is-text bb-skip" id="skipRound">Skip (no coins)</button>';
    acts.innerHTML = h;
    if ($('skipRound')) $('skipRound').onclick = finishRound;
    var se = $('sendErr');
    if (se) { se.hidden = !sendFailed || sending; se.textContent = sendFailed; }
    if ($('submitAll')) $('submitAll').onclick = submitAll;
    if ($('againAll')) $('againAll').onclick = function () { openRetry(retry); };
    if ($('toBuild')) $('toBuild').onclick = finishRound;
    var tot = $('roundTotal');
    if (r.items.some(function (it) { return it.fb && it.fb.marks != null; })) { tot.hidden = false; tot.textContent = 'This round: +' + (r.paid || 0) + ' coins'; }
    else tot.hidden = true;
  }

  function sendAnswers(items) {
    var a = api();
    if (a.submitMany) return call(function () { return a.submitMany(items); });
    return Promise.all(items.map(function (it) {
      return call(function () { return a.submit(it.qid, it.answer, it.attempt, '', it.rid); }).then(function (res) { return res; },
        function (e) { return { qid: it.qid, error: errText(e) }; });
    }));
  }

  function submitAll() {
    var r = S.exam, idx = [];
    if (sending) return;
    r.items.forEach(function (it, i) { if (canSend(it)) idx.push(i); });
    if (!idx.length) return;
    for (var k = 0; k < idx.length; k++) {
      if (!String(ansBoxes[idx[k]] ? ansBoxes[idx[k]].text() : '').trim()) { try { ansBoxes[idx[k]].focus(); } catch (e) {} return; }
    }
    var payload = idx.map(function (i) {
      var it = r.items[i];
      it.answer = ansBoxes[i].text(); it.doc = ansBoxes[i].doc(); it.err = '';
      if (!it.rid) it.rid = api().newRid ? api().newRid() : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      return { qid: r.qs[i].qid, answer: it.answer, attempt: it.attempt, image: '', rid: it.rid };
    });
    save();
    sending = true; sendFailed = '';
    idx.forEach(function (i) { ansBoxes[i].setReadOnly(true); if ($('err' + i)) $('err' + i).hidden = true; });
    updateActs();
    sendAnswers(payload).then(function (list) {
      sending = false; sendFailed = '';
      if (S.exam !== r) return;
      var paidNow = 0;
      idx.forEach(function (i, k) {
        var it = r.items[i], q = r.qs[i], res = list && list[k];
        if (!res || res.error) {
          it.err = (res && res.error) || 'No mark came back for this question. Submit it again.';
          if (it.attempt === 2 && /no second try/i.test(it.err)) { it.open = false; it.rid = ''; if (it.fb) it.fb.canRetry = false; }
          return;
        }
        var max = Number(res.max) || q.marks, marks = Math.max(0, Math.min(max, Number(res.marks) || 0)), pay;
        if (it.attempt === 1) { it.first = marks; pay = Math.round(marks * r.rate); }
        else pay = Math.round(Math.max(0, marks - (it.first || 0)) * r.rate * 0.5);
        var before = it.attempt === 2 && it.fb ? it.fb.pay || 0 : 0;
        it.fb = { marks: marks, max: max, feedback: res.feedback || '', canRetry: !!res.canRetry && it.attempt === 1 && marks < max, pay: before + pay };
        it.open = false; it.rid = '';
        if (pay) { S.coins += pay; r.paid += pay; paidNow += pay; }
      });
      save();
      if (!$('roundForm')) return;
      updateHud(); coinPop(paidNow); showRound();
    }, function (e) {
      sending = false;
      sendFailed = e && e.message === 'Sign in to play.' ? errText(e) + ' Your answers are saved.' : 'Could not reach the marker. Your answers are saved.';
      save();
      if (S.exam !== r || !$('roundForm')) return;
      showRound();
    });
  }

  function finishRound() {
    var r = S.exam;
    if (sending) return;
    sendFailed = '';
    r.qs.forEach(function (q, i) {
      var it = r.items[i];
      var best = it.fb && it.fb.marks != null ? Math.max(it.first || 0, it.fb.marks) : 0;
      S.stats.marks += best; S.stats.max += q.marks; r.got = (r.got || 0) + best;
    });
    S.stats.rounds++;
    S.stats.log.push('Exam ' + r.n + ': ' + (r.got || 0) + ' of ' + roundTotal() + ' marks.');
    var paid = r.paid;
    S.exam = null; S.design = null;
    enterBuild();
    postResult();
    toast(paid ? 'You earned ' + paid + ' coins. Now build your bridge.' : 'No coins this round. Build with what you have.');
  }

  // ---------------------------------------------------------------- teacher mode
  // Shift + D, E, V unlocks it for a teacher (or on a standalone page). Questions are skipped, coins are set by hand,
  // and nothing is saved or reported; the student's game is kept in TM.real and restored by Exit teacher mode.
  function standalone() { return window.parent === window || !!(api().isStub && api().isStub()); }
  var tmAsking = false;
  function tryUnlock() {
    if (TM || tmAsking || sending || sim) return;
    tmAsking = true;
    T.gate({ standalone: standalone(), ask: function () { return T.askWhoami(window, 15000); } }).then(function (yes) {
      tmAsking = false;
      if (yes && !TM && !sending && !sim) enterTeacher();   // a student gets nothing at all
    });
  }
  function enterTeacher() {
    clearTimeout(ansSaveT); save();
    TM = { real: S, unlimited: false, noOver: true };
    guard.set(true);
    var n = S ? S.round : 1;
    S = { v: 2, round: n, coins: 0, phase: 'build', design: null, exam: null, best: 0, stats: { marks: 0, max: 0, rounds: 0, log: [] } };
    drawTeacherBar();
    teacherJump(n);
  }
  function exitTeacher() {
    if (!TM) return;
    S = TM.real; TM = null; guard.set(false); sim = null;
    var bar = $('tmBar'); if (bar) bar.remove();
    if (S && /^(exam|build|testing)$/.test(S.phase)) resume(); else showStart();
  }
  function teacherJump(n) {
    n = Math.max(1, Math.min(ROUNDS, n | 0));
    S.round = n; S.phase = 'build'; S.design = null; S.exam = null; S.coins = Ph.level(n).pool; sim = null;
    enterBuild(); syncTeacherBar();
  }
  // No game over: retry the same round without questions, with the bridge kept, so it can be fixed.
  function teacherRetry(state, quiet) {
    var why = { broke: 'A beam snapped.', fell: 'The truck fell into the gap.', stuck: 'The truck got stuck.' }[state] || '';
    S.phase = 'build';
    var html = '<div class="bb-card"><h2>Bridge failed</h2><p class="bb-lead">' + esc(why + ' Teacher mode: no questions, so round ' + S.round + ' starts again with this bridge.') + '</p>' +
      '<div class="bb-start-go"><button class="bc-btn bb-big" id="nextBtn">Try round ' + S.round + ' again</button></div></div>';
    if (quiet || !$('over')) { $('screen').innerHTML = '<div class="bb-q">' + html + '</div>'; }
    else {
      var o = $('over'); o.className = 'bb-over is-bad'; o.innerHTML = html;
      setTimeout(function () { if ($('over') === o) o.hidden = false; }, 1100);
    }
    $('nextBtn').onclick = function () { sim = null; enterBuild(); };
  }
  function teacherShowBridge() {
    if (!TM || sim || !S.design || !window.BBSolutions) return;
    var list = window.BBSolutions.sound[S.round] || [];
    S.design = Ph.emptyDesign(LV); ui.undo = []; ui.sel = null;
    list.forEach(function (b) { Ph.addBeam(S.design, { x: b[0], y: b[1] }, { x: b[2], y: b[3] }, b[4]); });
    drawTools(); render();
    toast('Test bridge: ' + Ph.designCost(S.design) + ' coins.');
  }
  function drawTeacherBar() {
    if ($('tmBar')) return;
    var bar = document.createElement('div');
    bar.id = 'tmBar'; bar.className = 'bb-tm'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Teacher mode');
    var opts = ''; for (var i = 1; i <= ROUNDS; i++) opts += '<option value="' + i + '">' + i + '</option>';
    bar.innerHTML = '<span class="bb-tm-tag" title="Questions are skipped. Nothing is saved or sent to the lesson.">Teacher mode</span>' +
      '<label>Round <select id="tmRound">' + opts + '</select></label>' +
      '<label>Coins <input id="tmCoins" type="number" min="0" max="99999" step="10"></label>' +
      '<button type="button" class="bc-btn is-outline" id="tmPlus">+100</button>' +
      '<button type="button" class="bc-btn is-outline" id="tmPool">Full pool</button>' +
      '<label class="bb-tm-check"><input type="checkbox" id="tmUnl"> Unlimited</label>' +
      '<label class="bb-tm-check"><input type="checkbox" id="tmNoOver" checked> No game over</label>' +
      '<button type="button" class="bc-btn is-outline" id="tmShow">Show test bridge</button>' +
      '<button type="button" class="bc-btn is-tonal" id="tmExit">Exit teacher mode</button>';
    $('app').insertBefore(bar, $('screen'));
    var setCoins = function (v) { if (!TM) return; S.coins = Math.max(0, Math.min(99999, Math.round(Number(v) || 0))); updateHud(); drawTools(); render(); };
    $('tmRound').onchange = function () { teacherJump(Number(this.value)); };
    $('tmCoins').onchange = function () { setCoins(this.value); };
    $('tmPlus').onclick = function () { setCoins(S.coins + 100); };
    $('tmPool').onclick = function () { setCoins(Ph.level(S.round).pool); };
    $('tmUnl').onchange = function () { TM.unlimited = this.checked; drawTools(); render(); };
    $('tmNoOver').onchange = function () { TM.noOver = this.checked; };
    $('tmShow').onclick = teacherShowBridge;
    $('tmExit').onclick = exitTeacher;
  }
  function syncTeacherBar() {
    if (!TM || !$('tmBar')) return;
    $('tmRound').value = String(S.round);
    if (document.activeElement !== $('tmCoins')) $('tmCoins').value = String(S.coins);
  }

  // ---------------------------------------------------------------- boot
  if (!api() || !Ph) {
    $('screen').innerHTML = '<div class="bb-card bb-start"><h1>Data Bridge</h1><p class="bb-lead">The question service did not load. Reload the page.</p></div>';
    return;
  }
  window.__dataBridge = {
    state: function () { return { S: S, sim: sim, ui: ui, LV: LV }; },
    // testing: run the drive on by n frames (a hidden browser pane pauses the timer)
    advance: function (n) { if (sim) frames(n); return sim ? sim.state : ''; },
    teacher: function () { return TM ? { on: true, unlimited: TM.unlimited, noOver: TM.noOver, real: TM.real } : null; },
    build: function (list) { list.forEach(function (b) { Ph.addBeam(S.design, { x: b[0], y: b[1] }, { x: b[2], y: b[3] }, b[4]); }); save(); drawTools(); render(); }
  };
  setId = WANT_SET;
  showStart();

  // Escape cancels a beam being dragged. PageUp and PageDown are left alone (the classroom clicker).
  var devKeys = T.makeDetector(tryUnlock);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ui.sel && !sim) cancelDrag();
    devKeys(e);
  });

  // Full screen: the real thing when the browser allows it; otherwise the lesson page makes the game fill its window.
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function askParentFull() { try { if (window.parent !== window) window.parent.postMessage({ type: 'BC_APP_FULLSCREEN' }, '*'); } catch (e) {} }
  function toggleFull() {
    var el = document.documentElement;
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); return; }
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { askParentFull(); return; }
    try { var p = req.call(el); if (p && p.catch) p.catch(askParentFull); } catch (e) { askParentFull(); }
  }
  function onFullChange() {
    document.documentElement.classList.toggle('bb-fs', isFull());
    setTimeout(fitBoard, 0);
    var b = $('fsBtn'); if (b) b.textContent = isFull() ? 'Exit full screen' : 'Full screen';
  }
  (function () {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'fsBtn'; b.className = 'bc-btn is-outline bb-fs-btn'; b.textContent = 'Full screen';
    b.onclick = toggleFull; document.body.appendChild(b);
  })();
  (function () {
    var sl = $('hudSpeed'), out = $('hudSpeedVal');
    var v = Number(load('speed', 1)); if (!(v >= 1 && v <= 4)) v = 1;
    var apply = function (n) { ui.speed = n; sl.value = String(n); if (out) out.textContent = n + 'x'; store('speed', n); };
    apply(v);
    sl.addEventListener('input', function () { apply(Math.max(1, Math.min(4, Number(sl.value) || 1))); });
  })();
  document.addEventListener('fullscreenchange', onFullChange);
  document.addEventListener('webkitfullscreenchange', onFullChange);
})();
