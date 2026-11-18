// Data Bridge: build a bridge between two server racks so the data truck can cross. Exam marks are the only money.
// Each round: an exam round on one page (ExamGame client, like Circuit Siege), then build, then send the truck.
// A crossing keeps the leftover coins; a snapped beam or a fall is game over, back to round 1 with 0 coins.
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
    'Build a bridge so the data truck can cross the gap. Click a gold anchor to start a beam.',
    'Click another point to finish the beam. Keep clicking to add more. Click the same point again to stop.',
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
  var ui = { mat: 'road', sel: null, hover: null, undo: [], speed: 1, acc: 0, endShown: false };

  function newGame() {
    S = { v: 2, round: 1, coins: 0, phase: 'exam', design: null, exam: null, best: load('best:' + setId, 0),
      stats: { marks: 0, max: 0, rounds: 0, log: [] } };
    save();
  }
  function save() { if (S) store('game:' + setId, S); }
  // v2: each round has its own layout. A v1 save (every round the same two cliffs) is reset with a short message.
  function validSave(s) { return s && s.v === 2 && s.round >= 1 && s.round <= ROUNDS && /^(exam|build|testing)$/.test(s.phase); }

  // ---------------------------------------------------------------- results for the lesson slide
  function postResult() {
    if (window.parent === window || !S) return;
    var done = (S.best || 0) >= GOAL;
    if (done) store('done:' + setId, true);
    var before = !!load('done:' + setId, false);
    var head = done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.';
    var line = ' Best: crossed ' + (S.best || 0) + ' of ' + ROUNDS + ' rounds. Now on round ' + S.round + '. Marks ' + S.stats.marks + ' of ' + S.stats.max + ' in ' + S.stats.rounds + ' exam rounds.';
    try {
      window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'data-bridge-' + setId, label: 'Data Bridge: ' + (setTitle || setId),
        summary: head + line + (S.stats.log.length ? ' ' + S.stats.log.slice(-10).join(' ') : ''), complete: done || before }, '*');
    } catch (e) {}
  }

  // ---------------------------------------------------------------- HUD and start screen
  function setHud(on) { $('hud').hidden = !on; if (on) updateHud(); }
  function updateHud() {
    if (!S) return;
    $('hudRound').textContent = S.round; $('hudRounds').textContent = ROUNDS; $('hudCoins').textContent = S.coins;
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
      '<p class="bb-label">Pick a topic</p><div class="bb-choice-row">' + sets.map(function (s) {
        return '<button class="bb-pill' + (s.setId === setId ? ' is-on' : '') + '" data-set="' + esc(s.setId) + '">' + esc(s.title || s.setId) + '</button>';
      }).join('') + '</div>' +
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
    drawBackground(g, lv);
    var d = Ph.emptyDesign(lv);
    [[lv.L, 0, lv.L + 2, 0, 'road'], [lv.L + 2, 0, lv.L + 4, 0, 'road'], [lv.L + 4, 0, lv.R, 0, 'road'], [lv.L, 0, lv.L + 1, 2, 'wood'],
      [lv.L + 1, 2, lv.L + 2, 0, 'wood'], [lv.L + 2, 0, lv.L + 3, 2, 'steel'], [lv.L + 3, 2, lv.L + 4, 0, 'steel'], [lv.L + 4, 0, lv.L + 5, 2, 'wood'],
      [lv.L + 5, 2, lv.R, 0, 'wood'], [lv.L + 1, 2, lv.L + 3, 2, 'wood'], [lv.L + 3, 2, lv.L + 5, 2, 'wood']].forEach(function (b) {
      Ph.addBeam(d, { x: b[0], y: b[1] }, { x: b[2], y: b[3] }, b[4]);
    });
    d.beams.forEach(function (bm) { drawBeam(g, d.nodes[bm.a], d.nodes[bm.b], bm.mat, null); });
    d.nodes.forEach(function (n) { drawNode(g, n.x, n.y, n.fixed); });
    drawTruck(g, { x: lv.L + 1.6, y: Ph.WHEEL_R }, { x: lv.L + 1.6 + Ph.AXLE, y: Ph.WHEEL_R });
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
  var canvas, ctx, bg;

  function enterBuild() {
    sim = null; ui.endShown = false;
    LV = Ph.level(S.round);
    if (!S.design) S.design = Ph.emptyDesign(LV);
    S.phase = 'build'; save();
    setHud(true);
    ui.sel = null; ui.hover = null; ui.undo = [];
    $('screen').innerHTML =
      '<div class="bb-tip" id="tip" hidden><span id="tipText"></span><button class="bc-btn is-tonal" id="tipOk">OK</button></div>' +
      '<div class="bb-board" id="board"><canvas id="cv" width="' + W + '" height="' + H + '"></canvas><div class="bb-toast" id="toast" hidden></div>' +
      '<div class="bb-over" id="over" hidden></div></div>' +
      '<div class="bb-tools" id="tools"></div>';
    canvas = $('cv'); ctx = canvas.getContext('2d');
    bg = document.createElement('canvas'); bg.width = W; bg.height = H; drawBackground(bg.getContext('2d'), LV);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', function () { ui.hover = null; render(); });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); ui.sel = null; render(); });
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
      '<span class="bb-cost">Bridge <b>' + spent() + '</b> of <b' + (left < 10 ? ' class="is-low"' : '') + '>' + S.coins + '</b> coins</span>' +
      '<button class="bc-btn bb-big" id="send"' + (testing ? ' disabled' : '') + '>Send the truck</button>';
    box.innerHTML = h;
    Array.prototype.forEach.call(box.querySelectorAll('[data-mat]'), function (b) {
      b.onclick = function () { ui.mat = b.getAttribute('data-mat'); if (ui.mat === 'delete') ui.sel = null; drawTools(); render();
        if (ui.mat === 'delete') toast('Click a beam to take it away. You get its coins back.'); };
    });
    if ($('undo')) $('undo').onclick = undo;
    if ($('send')) $('send').onclick = sendTruck;
  }

  function boardXY(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
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
  function onDown(e) {
    if (sim) return;
    if (e.button === 2) { ui.sel = null; render(); return; }
    var p = boardXY(e), g = gridAt(p), d = S.design;
    if (ui.mat === 'delete') {
      var i = beamAt(p.x, p.y);
      if (i < 0) { toast('Click right on a beam to delete it.'); return; }
      var bm = d.beams[i];
      ui.undo.push({ type: 'del', a: { x: d.nodes[bm.a].x, y: d.nodes[bm.a].y }, b: { x: d.nodes[bm.b].x, y: d.nodes[bm.b].y }, mat: bm.mat });
      Ph.removeBeam(d, i); save(); drawTools(); render();
      return;
    }
    if (!ui.sel) {
      if (Ph.findNode(d, g.x, g.y) < 0) { toast('Start from a gold anchor or a point already on your bridge.'); return; }
      ui.sel = g; tipDone(0); render();
      return;
    }
    if (ui.sel.x === g.x && ui.sel.y === g.y) { ui.sel = null; render(); return; }
    var why = Ph.beamProblem(LV, d, ui.sel, g);
    if (why) { toast(why); return; }
    var c = Ph.beamCost(ui.mat, ui.sel, g);
    if (spent() + c > S.coins) { toast('Not enough coins. That beam costs ' + c + '. Answer exam questions to earn more.'); return; }
    Ph.addBeam(d, ui.sel, g, ui.mat);
    ui.undo.push({ type: 'add', a: ui.sel, b: g });
    ui.sel = g; tipDone(1);
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
      ui.sel = Ph.findNode(d, u.a.x, u.a.y) >= 0 ? u.a : null;
    } else {
      if (spent() + Ph.beamCost(u.mat, u.a, u.b) <= S.coins) Ph.addBeam(d, u.a, u.b, u.mat);
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
    ui.sel = null; ui.hover = null;
    sim = Ph.makeSim(LV, S.design);
    S.phase = 'testing'; save();
    tipDone(2);
    if ($('tip')) $('tip').hidden = true;
    drawTools(); render();
  }

  // state: won, broke, fell or stuck. quiet: worked out without showing the drive (a reload during the test).
  function finishTest(state, quiet) {
    var cost = Ph.designCost(S.design), round = S.round, coinsBefore = S.coins;
    Ph.afterTest(S, state, cost);
    if (state === 'won') { store('best:' + setId, Math.max(load('best:' + setId, 0), S.best || 0)); }
    S.stats.log.push(state === 'won' ? 'Round ' + round + ': crossed.' : 'Round ' + round + ': game over.');
    save(); postResult();
    var won = state === 'won';
    var title = won ? (S.phase === 'won' ? 'You crossed every gap!' : 'The truck made it!') : 'Game over';
    var why = { won: '', broke: 'A beam snapped and the bridge broke.', fell: 'The truck fell into the gap.', stuck: 'The truck got stuck.' }[state] || '';
    var body = won
      ? (S.phase === 'won' ? 'You beat all ' + ROUNDS + ' rounds.' : 'The bridge cost ' + cost + ' coins. You keep ' + (coinsBefore - cost) + ' coins for the next round.')
      : why + ' You go back to round 1 with 0 coins.' + (round > 1 ? ' You reached round ' + round + '.' : '');
    var btnText = won ? (S.phase === 'won' ? 'Play again' : 'Next: exam round ' + S.round) : 'Start again from round 1';
    var html = '<div class="bb-card"><h2>' + title + '</h2><p class="bb-lead">' + esc(body) + '</p>' +
      (!won ? '<p class="bb-lead">Tip: use triangles, and steel where the colours turned red.</p>' : '') +
      '<div class="bb-start-go"><button class="bc-btn bb-big" id="nextBtn">' + btnText + '</button></div></div>';
    var go = function () {
      if (S.phase === 'won') { store('game:' + setId, null); newGame(); }
      sim = null; startRound();
    };
    if (quiet || !$('over')) {
      setHud(true);
      $('screen').innerHTML = '<div class="bb-q">' + html + '</div>';
    } else {
      var o = $('over'); o.className = 'bb-over ' + (won ? 'is-good' : 'is-bad'); o.innerHTML = html; o.hidden = false;
    }
    updateHud();
    $('nextBtn').onclick = go;
    try { $('nextBtn').focus({ preventScroll: true }); } catch (e) {}
  }

  // ---------------------------------------------------------------- art
  function rng(seed) { return function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }
  // Scenery colours per round: [sky top, sky bottom, circuit traces, rack, rack outline, rack slots].
  var THEMES = [
    ['#0a1424', '#0d1f2e', '64, 196, 170', '#1b2330', '#5a6e88', '#232e3e'],
    ['#120f26', '#1b1534', '150, 120, 255', '#211c33', '#7464a8', '#2b2542'],
    ['#1a130a', '#24190e', '240, 170, 70', '#2a2219', '#8a7050', '#352b20'],
    ['#08180f', '#0c2216', '90, 220, 120', '#18261d', '#4f7a5c', '#20322a'],
    ['#07142a', '#0a1d3a', '90, 160, 255', '#17223a', '#5274a8', '#1f2c48'],
    ['#1c0d16', '#26111d', '240, 110, 160', '#2a1a24', '#8a5a74', '#36222f']
  ];
  function polyPath(g, pts) {
    g.beginPath();
    pts.forEach(function (p, i) { var x = sx(p[0]), y = sy(p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath();
  }
  function drawBackground(g, lv) {
    var th = THEMES[(lv.theme || 0) % THEMES.length];
    var grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, th[0]); grd.addColorStop(1, th[1]);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // circuit traces
    var r = rng(7 + lv.n * 13);
    g.lineWidth = 2; g.strokeStyle = 'rgba(' + th[2] + ', .13)'; g.fillStyle = 'rgba(' + th[2] + ', .22)';
    for (var i = 0; i < 26; i++) {
      var x = r() * W, y = r() * (H - 20), len = 40 + r() * 140;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.lineTo(x + len + 24, y + (r() < .5 ? 24 : -24)); g.stroke();
      g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
    }
    // below the road: a stream of bits falling away
    var top = sy(Math.min(lv.start.y, lv.goal.y));
    var dg = g.createLinearGradient(0, top, 0, H);
    dg.addColorStop(0, 'rgba(10, 30, 60, 0)'); dg.addColorStop(1, 'rgba(40, 120, 255, .25)');
    g.fillStyle = dg; g.fillRect(0, top, W, H - top);
    g.font = '12px monospace'; g.fillStyle = 'rgba(120, 180, 255, .18)';
    for (var k = 0; k < 120; k++) g.fillText(r() < .5 ? '0' : '1', 6 + r() * (W - 12), top + 20 + r() * (H - top - 20));
    // the terrain: server racks cut to each shape
    lv.ground.forEach(function (gr) { rack(g, gr.pts, th, r); });
    // the goal: a green port on the far side
    var gx = sx(lv.goal.x), gy = sy(lv.goal.y);
    g.strokeStyle = '#3ddc84'; g.lineWidth = 3; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy - 52); g.stroke();
    g.fillStyle = '#3ddc84'; g.beginPath(); g.moveTo(gx, gy - 52); g.lineTo(gx + 24, gy - 44); g.lineTo(gx, gy - 36); g.closePath(); g.fill();
    // build grid dots
    g.fillStyle = 'rgba(255, 255, 255, .16)';
    for (var gx2 = 0; gx2 <= Ph.WORLD_W; gx2++) for (var gy2 = Ph.Y_MIN; gy2 <= Ph.Y_MAX; gy2++) {
      if (Ph.pointOk(lv, gx2, gy2) && !Ph.isAnchor(lv, gx2, gy2)) g.fillRect(sx(gx2) - 1.5, sy(gy2) - 1.5, 3, 3);
    }
  }
  function rack(g, pts, th, r) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, sx(p[0])); x1 = Math.max(x1, sx(p[0])); y0 = Math.min(y0, sy(p[1])); y1 = Math.max(y1, sy(p[1])); });
    x0 = Math.max(x0, -10); x1 = Math.min(x1, W + 10); y0 = Math.max(y0, -10); y1 = Math.min(y1, H + 10);
    g.save();
    polyPath(g, pts); g.fillStyle = th[3]; g.fill();
    g.clip();
    for (var y = y0 + 10; y < y1; y += 22) {
      g.fillStyle = th[5]; g.fillRect(x0 + 8, y, x1 - x0 - 16, 16);
      g.fillStyle = 'rgba(0, 0, 0, .35)';
      for (var v = x0 + 40; v < x1 - 14; v += 8) g.fillRect(v, y + 5, 4, 6);
      for (var lx = x0 + 14; lx < x1 - 20; lx += 160) {
        g.fillStyle = r() < .7 ? '#3ddc84' : '#ffb74d'; g.fillRect(lx, y + 6, 4, 4);
        g.fillStyle = r() < .5 ? '#3ddc84' : 'rgba(255, 255, 255, .08)'; g.fillRect(lx + 8, y + 6, 4, 4);
      }
    }
    g.restore();
    polyPath(g, pts); g.strokeStyle = th[4]; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
  }
  function stressCol(s) {
    s = Math.max(0, Math.min(1, s));
    var a = s < .5 ? [61, 220, 132] : [255, 214, 64], b = s < .5 ? [255, 214, 64] : [244, 67, 54], t = s < .5 ? s * 2 : (s - .5) * 2;
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }
  function drawBeam(g, a, b, mat, stress, alpha) {
    var ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y);
    g.save(); g.globalAlpha = alpha == null ? 1 : alpha; g.lineCap = 'round';
    if (mat === 'road') {
      g.strokeStyle = stress == null ? '#2b313a' : '#1a1d22'; g.lineWidth = 11; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.strokeStyle = stress == null ? MAT_COL.road : stressCol(stress); g.lineWidth = 8; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.strokeStyle = 'rgba(255, 220, 90, .8)'; g.lineWidth = 1.5; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    } else {
      g.strokeStyle = 'rgba(0, 0, 0, .55)'; g.lineWidth = mat === 'steel' ? 8 : 7; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.strokeStyle = stress == null ? MAT_COL[mat] : stressCol(stress); g.lineWidth = mat === 'steel' ? 5 : 4.5;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      if (mat === 'steel' && stress == null) { g.strokeStyle = 'rgba(255, 255, 255, .45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax, ay - 1); g.lineTo(bx, by - 1); g.stroke(); }
    }
    g.restore();
  }
  function drawNode(g, x, y, fixed, on) {
    var px = sx(x), py = sy(y);
    if (fixed) {
      g.fillStyle = '#f2b632'; g.strokeStyle = '#7a5410'; g.lineWidth = 2;
      g.fillRect(px - 6, py - 6, 12, 12); g.strokeRect(px - 6, py - 6, 12, 12);
    } else {
      g.fillStyle = '#dfe6ee'; g.strokeStyle = '#3a4656'; g.lineWidth = 2;
      g.beginPath(); g.arc(px, py, 4.5, 0, 7); g.fill(); g.stroke();
    }
    if (on) { g.strokeStyle = '#8ab4f8'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 11, 0, 7); g.stroke(); }
  }
  function drawTruck(g, w0, w1) {
    var x0 = sx(w0.x), y0 = sy(w0.y), x1 = sx(w1.x), y1 = sy(w1.y);
    var ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0), wr = Ph.WHEEL_R * SC;
    g.save(); g.translate(x0, y0); g.rotate(ang);
    // cargo box with bits
    g.fillStyle = '#1f6feb'; g.strokeStyle = '#0b3d91'; g.lineWidth = 2;
    g.fillRect(-20, -46, len + 6, 34); g.strokeRect(-20, -46, len + 6, 34);
    g.fillStyle = '#cfe3ff'; g.font = 'bold 13px monospace'; g.fillText('1011 0010', -14, -24);
    // cab
    g.fillStyle = '#f2b632'; g.strokeStyle = '#7a5410';
    g.beginPath(); g.moveTo(len - 12, -12); g.lineTo(len - 12, -38); g.lineTo(len + 10, -38); g.lineTo(len + 22, -22); g.lineTo(len + 22, -12); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#9fd3ff'; g.fillRect(len + 2, -34, 10, 10);
    g.fillStyle = '#2b313a'; g.fillRect(-22, -14, len + 46, 6);
    [0, len].forEach(function (x) {
      g.fillStyle = '#15181d'; g.beginPath(); g.arc(x, 0, wr, 0, 7); g.fill();
      g.fillStyle = '#8a96a6'; g.beginPath(); g.arc(x, 0, wr * .45, 0, 7); g.fill();
    });
    g.restore();
  }

  function render() {
    if (!ctx || !S || !S.design) return;
    var g = ctx, d = S.design;
    g.drawImage(bg, 0, 0);
    if (sim) {
      sim.B.forEach(function (bm) {
        if (bm.broken) return;
        drawBeam(g, sim.P[bm.a], sim.P[bm.b], bm.mat, bm.stress);
      });
      sim.P.forEach(function (p, i) { if (!p.wheel && i < d.nodes.length) drawNode(g, p.x, p.y, p.fixed); });
      drawTruck(g, sim.P[sim.wheels[0]], sim.P[sim.wheels[1]]);
      return;
    }
    d.beams.forEach(function (bm) { drawBeam(g, d.nodes[bm.a], d.nodes[bm.b], bm.mat, null); });
    d.nodes.forEach(function (n) { drawNode(g, n.x, n.y, n.fixed, ui.sel && ui.sel.x === n.x && ui.sel.y === n.y); });
    drawTruck(g, { x: LV.start.x, y: LV.start.y + Ph.WHEEL_R }, { x: LV.start.x + Ph.AXLE, y: LV.start.y + Ph.WHEEL_R });
    var hv = ui.hover;
    if (hv && ui.mat === 'delete') {
      var bi = beamAt(hv.px, hv.py);
      if (bi >= 0) {
        var bm = d.beams[bi];
        g.save(); g.strokeStyle = 'rgba(244, 67, 54, .9)'; g.lineWidth = 12; g.lineCap = 'round'; g.globalAlpha = .6;
        g.beginPath(); g.moveTo(sx(d.nodes[bm.a].x), sy(d.nodes[bm.a].y)); g.lineTo(sx(d.nodes[bm.b].x), sy(d.nodes[bm.b].y)); g.stroke(); g.restore();
        label(g, hv.px, hv.py - 16, 'Delete: +' + Ph.beamCost(bm.mat, d.nodes[bm.a], d.nodes[bm.b]) + ' coins', '#f28b82');
      }
    } else if (hv && ui.sel) {
      var why = (ui.sel.x === hv.g.x && ui.sel.y === hv.g.y) ? 'same' : Ph.beamProblem(LV, d, ui.sel, hv.g);
      if (why !== 'same') {
        var c = Ph.beamCost(ui.mat, ui.sel, hv.g), poor = spent() + c > S.coins;
        drawBeam(g, ui.sel, hv.g, ui.mat, null, why || poor ? .35 : .75);
        var len = Ph.blen(ui.sel, hv.g);
        label(g, sx(hv.g.x), sy(hv.g.y) - 18, why ? (len > Ph.MAX_LEN ? 'Too long' : 'Not here') : (poor ? c + ' coins: not enough' : c + ' coins'), why || poor ? '#f28b82' : '#fff');
      }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(sx(hv.g.x), sy(hv.g.y), 7, 0, 7); g.stroke();
    } else if (hv) {
      var on = Ph.findNode(d, hv.g.x, hv.g.y) >= 0;
      g.strokeStyle = on ? 'rgba(138,180,248,.9)' : 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.beginPath(); g.arc(sx(hv.g.x), sy(hv.g.y), on ? 10 : 6, 0, 7); g.stroke();
    }
  }
  function label(g, x, y, text, col) {
    g.save(); g.font = 'bold 14px system-ui, sans-serif'; g.textAlign = 'center';
    var w = g.measureText(text).width + 14;
    g.fillStyle = 'rgba(10, 16, 28, .85)'; g.fillRect(x - w / 2, y - 14, w, 20);
    g.fillStyle = col; g.fillText(text, x, y + 1); g.restore();
  }

  // One timer drives the test. It does nothing while the page is hidden (a preloaded lesson slide).
  var last = Date.now();
  setInterval(function () {
    var now = Date.now(), real = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (hiddenNow() || !sim || !ctx || !document.body.contains(canvas)) return;
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
      r.qs = keep.map(function (q) { return { qid: q.qid, text: q.text, marks: Number(q.marks) || 1 }; });
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
      $('qText' + i).textContent = q.text;
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

  // ---------------------------------------------------------------- boot
  if (!api() || !Ph) {
    $('screen').innerHTML = '<div class="bb-card bb-start"><h1>Data Bridge</h1><p class="bb-lead">The question service did not load. Reload the page.</p></div>';
    return;
  }
  window.__dataBridge = {
    state: function () { return { S: S, sim: sim, ui: ui, LV: LV }; },
    // testing: run the drive on by n frames (a hidden browser pane pauses the timer)
    advance: function (n) { if (sim) frames(n); return sim ? sim.state : ''; },
    build: function (list) { list.forEach(function (b) { Ph.addBeam(S.design, { x: b[0], y: b[1] }, { x: b[2], y: b[3] }, b[4]); }); save(); drawTools(); render(); }
  };
  setId = WANT_SET;
  showStart();

  // Escape drops the selected point. PageUp and PageDown are left alone (the classroom clicker).
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ui.sel && !sim) { ui.sel = null; render(); }
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
