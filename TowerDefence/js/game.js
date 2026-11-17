// Circuit Siege: a tower defence where exam marks are the only money.
// Bugs crawl along a copper track to the CPU. Between waves the player answers a short round of exam
// questions (ExamGame client); full marks pay what the balance reference would have paid for that wave.
// Timers only, never requestAnimationFrame: lessons preload the page in a hidden iframe.
(function () {
  'use strict';
  var D = window.CSData, Eng = window.CSEngine;
  var P = new URLSearchParams(location.search);
  var EMBED = P.get('embed') === '1';
  var WANT_SET = P.get('set') || P.get('mode') || '';
  var GOAL = Math.max(1, parseInt(P.get('goal'), 10) || 3);
  var KEY = 'bc-circuitsiege-v2:';
  var W = D.W, H = D.H;
  var TARGETS = ['First', 'Last', 'Strong', 'Weak'];
  var TIPS = [
    'Bugs crawl along the copper track to your CPU. Each bug that gets in costs lives.',
    'Pick a tower below. Then click an empty spot on the board to build it.',
    'Click a tower to upgrade it or sell it. Press Start wave when you are ready.'
  ];

  // ---------------------------------------------------------------- helpers
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function store(k, v) { try { if (v == null) localStorage.removeItem(KEY + k); else localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  function hiddenNow() { return document.hidden || window.innerWidth === 0 || window.innerHeight === 0; }
  function api() { return window.ExamGame; }
  function call(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
  function errText(e) { return (e && e.message) || 'Something went wrong. Try again.'; }
  function waves() { return D.DIFF[S.diff].rounds; }
  function cost(base) { return D.price(base, S.diff); }

  function reportHeight() {
    if (window.parent === window) return;
    var h = document.getElementById('app').getBoundingClientRect().height;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(h) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.getElementById('app'));
  window.addEventListener('load', reportHeight);

  // ---------------------------------------------------------------- state
  var sets = [], setId = '', setTitle = '';
  var S = null;           // saved game
  var R = null;           // live wave (engine world)
  var ui = { place: null, sel: -1, hover: null, speed: 1, paused: false, t: 0, aiming: false, acc: 0 };
  var mouse = { x: -1, y: -1, on: false };

  function newGame(diff) {
    var d = D.DIFF[diff];
    S = { v: 2, set: setId, diff: diff, wave: 0, cash: D.START_CASH, lives: d.lives, towers: [], items: [], phase: 'build', round: null,
      seen: {}, stats: { marks: 0, max: 0, rounds: 0, log: [] } };
    save();
  }
  function save() {
    if (!S) return;
    store('game:' + setId, S, function () {});
  }
  // towers carry runtime fields from the engine; strip them on save
  var SAVE_FIELDS = ['type', 'x', 'y', 'lv', 'spent', 'tgt', 'aim'];
  store = (function (orig) {
    return function (k, v) {
      if (v && k.indexOf('game:') === 0 && v.towers) {
        var copy = {}; Object.keys(v).forEach(function (f) { copy[f] = v[f]; });
        copy.towers = v.towers.map(function (t) { var o = {}; SAVE_FIELDS.forEach(function (f) { if (t[f] != null) o[f] = t[f]; }); return o; });
        copy.items = (v.items || []).filter(function (it) { return it.type === 'pins' || it.type === 'patch' || it.type === 'fuse'; })
          .map(function (it) { return { type: it.type, d: it.d, x: it.x, y: it.y, left: it.left, t: it.t, hits: [] }; });
        return orig(k, copy);
      }
      return orig(k, v);
    };
  })(store);

  // ---------------------------------------------------------------- results for the lesson slide
  function postResult() {
    if (window.parent === window || !S) return;
    var id = 'circuit-siege-' + setId;
    var done = S.stats.rounds >= GOAL || S.phase === 'won';
    if (done) store('done:' + setId, true);
    var before = !!load('done:' + setId, false);
    var head = done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.';
    var line = ' ' + D.DIFF[S.diff].name + '. Waves cleared ' + S.wave + ' of ' + waves() + '. Marks ' + S.stats.marks + ' of ' + S.stats.max + ' in ' + S.stats.rounds + ' exam rounds.';
    if (S.phase === 'over') line += ' The bugs reached the CPU.';
    if (S.phase === 'won') line += ' All waves beaten.';
    try {
      window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label: 'Circuit Siege: ' + (setTitle || setId),
        summary: head + line + (S.stats.log.length ? ' ' + S.stats.log.slice(-10).join(' ') : ''), complete: done || before }, '*');
    } catch (e) {}
  }

  // ---------------------------------------------------------------- HUD and start screen
  function setHud(on) { $('hud').hidden = !on; if (on) updateHud(); }
  function livesNow() { return Math.max(0, S.lives - (R ? R.livesLost : 0)); }
  function updateHud() {
    if (!S) return;
    $('hudLives').textContent = livesNow();
    $('hudCoins').textContent = S.cash;
    $('hudWave').textContent = Math.min(waves(), S.wave + 1);
    $('hudWaves').textContent = waves();
  }

  function showStart() {
    stopWave(); setHud(false);
    var scr = $('screen');
    scr.innerHTML = '<div class="cs-card cs-start"><p class="cs-lead">Loading...</p></div>';
    call(function () { return api().sets(); }).then(function (list) {
      sets = (list || []).filter(function (s) { return s && s.setId; });
      if (!sets.length) throw new Error('No question topics yet.');
      var fixed = WANT_SET && sets.filter(function (s) { return s.setId === WANT_SET; })[0];
      if (fixed) setId = fixed.setId;
      if (!setId || !sets.some(function (s) { return s.setId === setId; })) setId = sets[0].setId;
      drawStart(false); // a preset topic is only the default choice; every topic stays on the start screen
    }).catch(function (e) {
      scr.innerHTML = '<div class="cs-card cs-start"><h1>Circuit Siege</h1><p class="cs-lead">' + esc(errText(e)) + '</p><button class="bc-btn" id="retry">Try again</button></div>';
      $('retry').onclick = showStart;
    });
  }

  function validSave(s) {
    return s && s.v === 2 && D.DIFF[s.diff] && s.phase !== 'over' && s.phase !== 'won' && Array.isArray(s.towers);
  }

  function drawStart(fixed) {
    var cur = sets.filter(function (s) { return s.setId === setId; })[0];
    setTitle = cur ? (cur.title || cur.setId) : setId;
    var saved = load('game:' + setId, null);
    if (!validSave(saved)) saved = null;
    var diff = load('diff', 'medium');
    if (!D.DIFF[diff]) diff = 'medium';
    var h = '<div class="cs-card cs-start">' +
      '<div class="cs-start-art"><canvas id="startArt" width="480" height="110"></canvas></div>' +
      '<h1>Circuit Siege</h1>' +
      '<p class="cs-lead">Bugs are crawling to your CPU. Build towers to stop them. Answer exam questions to earn coins.</p>';
    if (fixed) {
      h += '<p class="cs-label">Topic</p><div class="cs-choice-row"><span class="cs-pill is-on">' + esc(setTitle) + '</span></div>';
    } else {
      h += '<p class="cs-label">Pick a topic</p><div class="cs-choice-row">' + sets.map(function (s) {
        return '<button class="cs-pill' + (s.setId === setId ? ' is-on' : '') + '" data-set="' + esc(s.setId) + '">' + esc(s.title || s.setId) + '</button>';
      }).join('') + '</div>';
    }
    if (saved) {
      h += '<div class="cs-start-go"><button class="bc-btn cs-big" id="cont">Continue: wave ' + Math.min(D.DIFF[saved.diff].rounds, saved.wave + 1) + ', ' + D.DIFF[saved.diff].name + '</button>' +
        '<button class="bc-btn is-outline" id="fresh">New game</button></div>';
    } else {
      h += '<p class="cs-label">Pick a level</p><div class="cs-diffs">' + Object.keys(D.DIFF).map(function (k) {
        return '<button class="cs-diff' + (k === diff ? ' is-on' : '') + '" data-diff="' + k + '"><b>' + D.DIFF[k].name + '</b><span>' + D.DIFF[k].line + '</span></button>';
      }).join('') + '</div><div class="cs-start-go"><button class="bc-btn cs-big" id="go">Start</button></div>';
    }
    h += '</div>';
    $('screen').innerHTML = h;
    paintStartArt();
    Array.prototype.forEach.call(document.querySelectorAll('[data-set]'), function (b) {
      b.onclick = function () { setId = b.getAttribute('data-set'); drawStart(false); };
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-diff]'), function (b) {
      b.onclick = function () { store('diff', b.getAttribute('data-diff')); drawStart(fixed); };
    });
    if ($('go')) $('go').onclick = function () { newGame(diff); enterBuild(); };
    if ($('cont')) $('cont').onclick = function () { S = saved; S.items = S.items || []; resume(); };
    if ($('fresh')) $('fresh').onclick = function () {
      if (this.getAttribute('data-sure')) { store('game:' + setId, null); drawStart(fixed); return; }
      this.setAttribute('data-sure', '1'); this.textContent = 'Click again to start over';
    };
  }

  function paintStartArt() {
    var c = $('startArt'); if (!c) return;
    var g = c.getContext('2d');
    g.fillStyle = '#0c1d1a'; Art.roundRect(g, 0, 0, 480, 110, 12); g.fill();
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 26; g.beginPath(); g.moveTo(0, 62); g.lineTo(480, 62); g.stroke();
    ['glitch', 'worm', 'spam', 'trojan', 'packet', 'ransom'].forEach(function (k, i) {
      Art.drawEnemy(g, { t: k, def: D.ENEMIES[k], x: 30 + i * 44, y: 62, dir: 0, r: D.ENEMIES[k].r, hp: 1, frozen: 0, glue: 0 });
    });
    ['pulse', 'cryo', 'surge', 'hydro'].forEach(function (k, i) { Art.drawTower(g, k, 320 + i * 44, 24 + (i % 2) * 64, 1, Math.PI, .2, .75); });
  }

  // ---------------------------------------------------------------- game screen
  var canvas, ctx, bg;

  function resume() {
    if (S.phase === 'questions') { setHud(true); startRound(true); return; }
    enterBuild();
  }

  function unlocked(type) { return D.unlockRound(type, S.diff) <= S.wave + 1; }
  function tier4Open(type) { return D.unlockRound(type, S.diff, true) <= S.wave + 1; }
  function unlockNews() {
    var n = S.wave + 1, out = [];
    if (n <= 1) return out;
    D.TOWER_ORDER.forEach(function (k) { if (D.unlockRound(k, S.diff) === n) out.push('New: ' + D.TOWERS[k].name + '. ' + D.TOWERS[k].blurb); });
    D.TIER4_ORDER.forEach(function (k) { if (D.unlockRound(k, S.diff, true) === n) out.push('New level 4 upgrade: ' + D.TOWERS[k].up[3].name + ' for the ' + D.TOWERS[k].name + '.'); });
    return out;
  }

  function enterBuild() {
    stopWave();
    S.phase = 'build'; save();
    setHud(true);
    ui.place = null; ui.sel = -1; ui.aiming = false;
    $('screen').innerHTML =
      '<div class="cs-tip" id="tip" hidden><span id="tipText"></span><button class="bc-btn is-tonal" id="tipOk">OK</button></div>' +
      '<div class="cs-board" id="board"><canvas id="cv" width="' + W + '" height="' + H + '"></canvas><div class="cs-toast" id="toast" hidden></div></div>' +
      '<div class="cs-panel"><div class="cs-shop" id="shop"></div>' +
      '<div class="cs-controls"><button class="bc-btn cs-big" id="startWave">Start wave ' + (S.wave + 1) + '</button>' +
      '<div class="cs-ctl-row"><button class="bc-btn is-outline" id="speed">Speed 1x</button><button class="bc-btn is-outline" id="pause" disabled>Pause</button></div>' +
      '<button class="bc-btn is-outline" id="stormBtn" hidden>Storm: 1000 coins</button></div></div>';
    canvas = $('cv'); ctx = canvas.getContext('2d');
    bg = document.createElement('canvas'); bg.width = W; bg.height = H; Art.drawBoard(bg.getContext('2d'));
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', function () { ui.hover = null; mouse.on = false; });
    canvas.addEventListener('click', onClick);
    $('startWave').onclick = startWave;
    $('speed').onclick = function () { ui.speed = ui.speed === 1 ? 2 : 1; this.textContent = 'Speed ' + ui.speed + 'x'; };
    $('pause').onclick = function () { ui.paused = !ui.paused; this.textContent = ui.paused ? 'Play' : 'Pause'; };
    $('stormBtn').onclick = useStorm;
    $('speed').textContent = 'Speed ' + ui.speed + 'x';
    $('tipOk').onclick = tipOk;
    drawShop();
    updateHud();
    var news = unlockNews();
    if (load('tut', 0) < 2) showTip(load('tut', 0));
    else if (load('tut', 0) === 2 && S.towers.length) showTip(2);
    else if (news.length) note(news.join(' '));
    render();
  }

  // One line at the top of the board. Tutorial lines advance; other notes just close.
  var noteOn = false;
  function tipOk() {
    hideTip();
    if (noteOn) { noteOn = false; return; }
    var n = load('tut', 0); store('tut', n + 1);
    if (n + 1 < 2) showTip(n + 1);
  }
  function showTip(i) {
    if (load('tut', 0) !== i || !$('tip')) return;
    noteOn = false; $('tipText').textContent = TIPS[i]; $('tip').hidden = false;
  }
  function note(text) {
    if (!$('tip')) return;
    noteOn = true; $('tipText').textContent = text; $('tip').hidden = false;
    clearTimeout(note.timer); note.timer = setTimeout(function () { if (noteOn) { noteOn = false; hideTip(); } }, 9000);
  }
  function hideTip() { if ($('tip')) $('tip').hidden = true; }
  function tipDone(i) { if (load('tut', 0) === i) { store('tut', i + 1); hideTip(); } }

  function toast(text) {
    var t = $('toast'); if (!t) return;
    t.textContent = text; t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(function () { if ($('toast')) $('toast').hidden = true; }, 2600);
  }

  function coinPop(n) {
    var wrap = $('hudCoinsWrap'); if (!wrap || !n) return;
    var s = document.createElement('span'); s.className = 'cs-pop'; s.textContent = '+' + n + ' coins';
    wrap.appendChild(s); setTimeout(function () { s.remove(); }, 1500);
    wrap.classList.remove('is-bump'); void wrap.offsetWidth; wrap.classList.add('is-bump');
  }

  function btn(cls, text, fn, disabled) {
    var b = document.createElement('button'); b.className = 'bc-btn ' + (cls || ''); b.textContent = text;
    if (disabled) b.disabled = true; else b.onclick = fn;
    return b;
  }

  function drawShop() {
    var shop = $('shop'); if (!shop) return;
    shop.innerHTML = '';
    updateStorm();
    if (ui.sel >= 0 && S.towers[ui.sel]) {
      var tw = S.towers[ui.sel], def = D.TOWERS[tw.type], up = def.up[tw.lv - 1];
      var info = document.createElement('div'); info.className = 'cs-sel';
      info.appendChild(Art.towerIcon(tw.type));
      var box = document.createElement('div');
      var line;
      if (!up) line = 'Top level.';
      else if (tw.lv === 4 && !tier4Open(tw.type)) line = 'Next: ' + up.name + '. Opens at wave ' + D.unlockRound(tw.type, S.diff, true) + '.';
      else line = 'Next: ' + up.name + '. ' + up.line;
      box.innerHTML = '<b>' + def.name + '</b><span>Level ' + tw.lv + ' of 5. ' + esc(line) + '</span>';
      info.appendChild(box);
      var acts = document.createElement('div'); acts.className = 'cs-sel-acts';
      if (up && !(tw.lv === 4 && !tier4Open(tw.type))) {
        var c = cost(up.cost);
        acts.appendChild(btn('', 'Upgrade: ' + c + ' coins', function () { upgrade(ui.sel); }, S.cash < c));
      }
      if (def.kind === 'shot' || def.kind === 'boomer') {
        acts.appendChild(btn('is-outline', 'Target: ' + TARGETS[tw.tgt | 0], function () { tw.tgt = ((tw.tgt | 0) + 1) % 4; save(); drawShop(); }));
      }
      if (def.kind === 'mortar') acts.appendChild(btn('is-outline', ui.aiming ? 'Click the board' : 'Move target', function () { ui.aiming = true; drawShop(); toast('Click the spot to strike.'); }));
      acts.appendChild(btn('is-outline', 'Sell: +' + Math.floor(tw.spent * D.SELL), function () { sell(ui.sel); }));
      acts.appendChild(btn('is-text', 'Done', function () { ui.sel = -1; ui.aiming = false; drawShop(); }));
      info.appendChild(acts);
      shop.appendChild(info);
      return;
    }
    D.TOWER_ORDER.forEach(function (k) {
      if (!unlocked(k)) return;
      var d = D.TOWERS[k], c = cost(d.cost), b = document.createElement('button');
      b.className = 'cs-buy' + (ui.place === k ? ' is-on' : '') + (S.cash < c ? ' is-poor' : '');
      b.title = d.blurb;
      b.appendChild(Art.towerIcon(k));
      var t = document.createElement('span'); t.className = 'cs-buy-text';
      t.innerHTML = '<b>' + d.name + '</b><em>' + c + ' coins</em>';
      b.appendChild(t);
      b.onclick = function () {
        if (S.cash < c) { toast('Not enough coins. Earn coins with marks after the wave.'); return; }
        ui.place = ui.place === k ? null : k; drawShop();
        if (ui.place) toast(d.blurb + (d.place === 'track' ? ' Click the track.' : d.place === 'water' ? ' Click the coolant.' : ' Click an empty spot.'));
      };
      shop.appendChild(b);
    });
  }

  function boardXY(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  var spot = { d: 0 };
  function canPlace(type, x, y) {
    var d = D.TOWERS[type];
    if (x < 20 || y < 20 || x > W - 20 || y > H - 20) return false;
    var dist = Eng.nearest(x, y, spot);
    if (d.place === 'track') return dist < D.TRACK / 2 + 4 && spot.d > 10 && spot.d < Eng.PATH_LEN - 20;
    if (d.place === 'water') { if (!Eng.inWater(x, y, 14)) return false; }
    else {
      if (dist < D.TRACK / 2 + 16) return false;
      if (Eng.inWater(x, y, -18)) return false;
      if (Math.abs(x - D.CPU.x) < 62 && Math.abs(y - D.CPU.y) < 62) return false;
      if (x < 46 && y < 130) return false;
    }
    return !S.towers.some(function (t) { return Math.abs(t.x - x) < 38 && Math.abs(t.y - y) < 38; });
  }
  function towerAt(x, y) {
    for (var i = 0; i < S.towers.length; i++) if (Math.abs(S.towers[i].x - x) < 21 && Math.abs(S.towers[i].y - y) < 21) return i;
    return -1;
  }
  function onMove(e) { ui.hover = boardXY(e); mouse.x = ui.hover.x; mouse.y = ui.hover.y; mouse.on = true; if (!R) render(); }
  function onClick(e) {
    var p = boardXY(e);
    if (ui.aiming && ui.sel >= 0 && S.towers[ui.sel]) {
      S.towers[ui.sel].aim = { x: Math.round(p.x), y: Math.round(p.y) };
      ui.aiming = false; save(); drawShop(); return;
    }
    if (ui.place) {
      var k = ui.place, d = D.TOWERS[k], c = cost(d.cost);
      if (!canPlace(k, p.x, p.y)) {
        toast(d.place === 'track' ? 'Put it on the copper track.' : d.place === 'water' ? 'This tower only goes in the blue coolant.' : 'You cannot build there. Pick a dark spot away from the track.');
        return;
      }
      if (S.cash < c) { ui.place = null; drawShop(); return; }
      S.cash -= c;
      if (d.place === 'track') {
        Eng.nearest(p.x, p.y, spot);
        var it = { type: k, d: spot.d, left: d.base.pierce, hits: [] };
        if (k === 'fuse') it.t = d.base.delay;
        Eng.place(it, spot.d);
        S.items.push(it);
      } else {
        var tw = { type: k, x: Math.round(p.x), y: Math.round(p.y), lv: 1, spent: c, tgt: 0, ang: -Math.PI / 2 };
        if (k === 'mortar') { var aim = { x: 0, y: 0 }; Eng.place(aim, spot.d); tw.aim = { x: Math.round(aim.x), y: Math.round(aim.y) }; }
        S.towers.push(tw);
        if (R) R.dirty = true;
      }
      if (S.cash < c) ui.place = null;
      save(); updateHud(); drawShop();
      tipDone(1); showTip(2);
      return;
    }
    var i = towerAt(p.x, p.y);
    ui.sel = i; ui.aiming = false; drawShop();
    if (i >= 0) tipDone(2);
  }
  function upgrade(i) {
    var tw = S.towers[i], up = D.TOWERS[tw.type].up[tw.lv - 1];
    if (!up) return;
    var c = cost(up.cost);
    if (S.cash < c || (tw.lv === 4 && !tier4Open(tw.type))) return;
    S.cash -= c; tw.spent += c; tw.lv++;
    if (R) R.dirty = true;
    save(); updateHud(); drawShop();
  }
  function sell(i) {
    var tw = S.towers[i];
    S.cash += Math.floor(tw.spent * D.SELL);
    S.towers.splice(i, 1); ui.sel = -1; ui.aiming = false;
    if (R) R.dirty = true;
    save(); updateHud(); drawShop();
  }
  function stormReady() {
    return S.towers.some(function (t) { return t.type === 'booster' && D.stats('booster', t.lv).storm; });
  }
  function updateStorm() {
    var b = $('stormBtn'); if (!b) return;
    var on = stormReady();
    b.hidden = !on;
    if (on) { b.disabled = !R || R.stormCd > 0 || S.cash < 1000; b.textContent = R && R.stormCd > 0 ? 'Storm recharging' : 'Storm: 1000 coins'; }
  }
  function useStorm() {
    if (!R || R.stormCd > 0 || S.cash < 1000 || !stormReady()) return;
    S.cash -= 1000; Eng.storm(R); R.stormCd = 1050; save(); updateHud(); updateStorm();
  }

  // ---------------------------------------------------------------- waves
  function startWave() {
    if (R || S.phase !== 'build') return;
    hideTip();
    var n = S.wave + 1;
    S.items.forEach(function (it) { it.hits = []; });
    R = Eng.create({ n: n, diff: S.diff, towers: S.towers, items: S.items, mouse: mouse, seen: S.seen, onNew: newEnemy });
    ui.acc = 0;
    $('startWave').disabled = true; $('startWave').textContent = 'Wave ' + n + ' running';
    $('pause').disabled = false; ui.paused = false; $('pause').textContent = 'Pause';
    updateStorm();
  }
  function stopWave() { R = null; }
  function newEnemy(type) { note('New bug. ' + D.ENEMIES[type].tip); save(); }

  function waveCleared() {
    var n = R.n;
    S.lives = livesNow();
    stopWave();
    S.items = [];
    S.wave = n;
    if (S.wave >= waves()) { S.phase = 'won'; save(); postResult(); showEnd(true); return; }
    save();
    startRound(false);
  }

  function gameOver() {
    S.lives = 0;
    stopWave();
    S.phase = 'over'; save(); postResult();
    showEnd(false);
  }

  function showEnd(won) {
    setHud(true);
    var st = S.stats;
    $('screen').innerHTML = '<div class="cs-card cs-start"><h1>' + (won ? 'The CPU is safe' : 'The bugs got into the CPU') + '</h1>' +
      '<p class="cs-lead">' + (won ? 'You beat all ' + waves() + ' waves.' : 'You cleared ' + S.wave + ' of ' + waves() + ' waves.') + '</p>' +
      '<p class="cs-lead">You earned ' + st.marks + ' of ' + st.max + ' marks in ' + st.rounds + ' exam rounds.</p>' +
      '<div class="cs-start-go"><button class="bc-btn cs-big" id="again">Play again</button></div></div>';
    $('again').onclick = function () { store('game:' + setId, null); S = null; showStart(); };
  }

  // ---------------------------------------------------------------- drawing
  function render() {
    if (!ctx) return;
    var t = ui.t, i;
    ctx.drawImage(bg, 0, 0);
    for (i = 0; i < S.items.length; i++) { var it = S.items[i]; Art.drawItem(ctx, it.type === 'pile' || it.type === 'pinStorm' ? (it.lead ? 'hot' : 'pins') : it.type, it.x, it.y, t); }
    if (R) for (i = 0; i < R.enemies.length; i++) Art.drawEnemy(ctx, R.enemies[i]);
    for (i = 0; i < S.towers.length; i++) {
      var tw = S.towers[i];
      if (i === ui.sel) {
        var st = D.stats(tw.type, tw.lv);
        if (st.range < 2000) rangeRing(tw.x, tw.y, st.range * (tw.rm || 1), true);
        if (tw.aim) { ctx.strokeStyle = '#f28b82'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tw.aim.x, tw.aim.y, st.scatter + 8, 0, 7); ctx.moveTo(tw.aim.x - 10, tw.aim.y); ctx.lineTo(tw.aim.x + 10, tw.aim.y); ctx.moveTo(tw.aim.x, tw.aim.y - 10); ctx.lineTo(tw.aim.x, tw.aim.y + 10); ctx.stroke(); }
      }
      Art.drawTower(ctx, tw.type, tw.x, tw.y, tw.lv, tw.ang || 0, tw.type === 'cryo' ? (R ? t : t * 0.15) : t);
      if (tw.type === 'drone' && R && tw.px != null) drawPlane(tw);
    }
    if (R) {
      for (i = 0; i < R.shots.length; i++) drawShot(R.shots[i]);
      for (i = 0; i < R.fx.length; i++) {
        var fx = R.fx[i], k = fx.t / fx.max;
        ctx.globalAlpha = 1 - k;
        if (fx.k === 'ring') { ctx.strokeStyle = fx.c === 1 ? '#ff7043' : fx.c === 2 ? '#78d9ec' : '#fdd663'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (0.4 + k * 0.6), 0, 7); ctx.stroke(); }
        else if (fx.k === 'boom') { ctx.fillStyle = fx.c ? 'rgba(255, 112, 67, .45)' : 'rgba(253, 214, 99, .4)'; ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (0.5 + k * 0.5), 0, 7); ctx.fill(); }
        else { ctx.fillStyle = '#fdd663'; for (var j = 0; j < 4; j++) { var a = j * 1.57 + fx.c; ctx.fillRect(fx.x + Math.cos(a) * fx.r * k * 1.4 - 1.5, fx.y + Math.sin(a) * fx.r * k * 1.4 - 1.5, 3, 3); } }
        ctx.globalAlpha = 1;
      }
    }
    if (ui.place && ui.hover) {
      var ok = canPlace(ui.place, ui.hover.x, ui.hover.y), pd = D.TOWERS[ui.place];
      if (pd.place === 'track') { ctx.globalAlpha = ok ? 0.85 : 0.35; Art.drawItem(ctx, ui.place, ui.hover.x, ui.hover.y, t); ctx.globalAlpha = 1; }
      else {
        var r0 = D.stats(ui.place, 1).range;
        if (r0 < 2000) rangeRing(ui.hover.x, ui.hover.y, r0, ok);
        ctx.globalAlpha = ok ? 0.75 : 0.35;
        Art.drawTower(ctx, ui.place, ui.hover.x, ui.hover.y, 1, -Math.PI / 2, 0);
        ctx.globalAlpha = 1;
      }
    }
    if (ui.paused && R) {
      ctx.fillStyle = 'rgba(4, 6, 10, .5)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8eaed'; ctx.font = '800 40px Figtree, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Paused', W / 2, H / 2);
    }
  }
  function drawPlane(tw) {
    ctx.save(); ctx.translate(tw.px, tw.py); ctx.rotate(tw.pa + Math.PI / 2);
    ctx.fillStyle = '#e8eaed'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -12); ctx.lineTo(-5, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  var SHOT_COL = { dart: '#8ab4f8', ball: '#c9cdd4', tack: '#fdd663', blade: '#fde293', boomer: '#81c995', plasma: '#ff8bcb', bomb: '#fcad70',
    glue: '#c58af9', grape: '#4fc3f7', orb: '#ff8bcb', fire: '#ff7043', wind: '#b0bec5', laser: '#f28b82', sun: '#fde293', mortar: '#f28b82' };
  function drawShot(p) {
    var look = p.path === 2 ? 'mortar' : p.look, col = SHOT_COL[look] || '#e8eaed';
    if (look === 'dart' || look === 'laser' || look === 'tack' || look === 'grape') {
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1, L = look === 'laser' ? 14 : 8;
      ctx.strokeStyle = col; ctx.lineWidth = look === 'laser' ? 3 : 2.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / sp * L, p.y - p.vy / sp * L); ctx.stroke();
      return;
    }
    ctx.fillStyle = col;
    if (look === 'boomer' || look === 'blade') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, p.rad, 0, 4); ctx.stroke(); ctx.restore(); return;
    }
    if (look === 'wind') { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.rad * 0.8, ui.t * 10, ui.t * 10 + 4.5); ctx.stroke(); return; }
    var r = look === 'mortar' ? 6 + Math.sin(Math.PI * Math.max(0, p.life) / 30) * 5 : Math.max(3, p.rad * (look === 'sun' ? 1 : 0.8));
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
  }
  function rangeRing(x, y, r, ok) {
    ctx.fillStyle = ok ? 'rgba(138, 180, 248, .10)' : 'rgba(242, 139, 130, .14)';
    ctx.strokeStyle = ok ? 'rgba(138, 180, 248, .6)' : 'rgba(242, 139, 130, .7)';
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  }

  // One timer drives everything. It does nothing while the page is hidden (a preloaded lesson slide).
  // The logic runs in frames of 1/35 s, so the reference numbers apply unchanged.
  var last = Date.now(), hudT = 0;
  setInterval(function () {
    var now = Date.now(), real = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (hiddenNow() || !S || !ctx || !document.body.contains(canvas)) return;
    ui.t += real;
    if (R && !ui.paused) {
      ui.acc += real * D.FPS * ui.speed;
      var guard = 0;
      while (ui.acc >= 1 && R && guard++ < 10) {
        Eng.step(R); ui.acc -= 1;
        if (S.lives - R.livesLost <= 0) { gameOver(); return; }
        if (R.done) { waveCleared(); return; }
      }
      if (ui.acc > 2) ui.acc = 0;
      hudT += real;
      if (hudT > 0.25) { hudT = 0; updateHud(); updateStorm(); }
    }
    if (ctx && document.body.contains(canvas)) render();
  }, 33);

  // ---------------------------------------------------------------- exam rounds
  // S.round = { n, qs, i, rate, pool, paid, cur: { attempt, first, fb, answer } }
  function farmIncome() {
    return S.towers.reduce(function (a, t) { return a + (t.type === 'farm' ? D.stats('farm', t.lv).income : 0); }, 0);
  }
  function startRound(resuming) {
    S.phase = 'questions';
    if (!resuming || !S.round) S.round = { n: S.wave, qs: null, i: 0, rate: 0, pool: 0, paid: 0, cur: null, intro: true };
    save(); setHud(true); ctx = null;
    var r = S.round;
    if (r.qs) { showQuestion(); return; }
    $('screen').innerHTML = '<div class="cs-card cs-q"><p class="cs-lead">Loading questions...</p></div>';
    call(function () { return api().next(setId, { count: 3, maxMarks: 4 }); }).then(function (list) {
      list = (list || []).filter(function (q) { return q && q.qid; });
      if (!list.length) throw new Error('No questions right now.');
      var total = list.reduce(function (a, q) { return a + (Number(q.marks) || 1); }, 0);
      r.qs = list.map(function (q) { return { qid: q.qid, text: q.text, marks: Number(q.marks) || 1 }; });
      r.pool = D.roundPool(r.n, S.diff, farmIncome());
      r.rate = r.pool / total;
      save();
      showQuestion();
    }).catch(function (e) {
      $('screen').innerHTML = '<div class="cs-card cs-q"><p class="cs-lead">' + esc(errText(e)) + '</p>' +
        '<div class="cs-start-go"><button class="bc-btn" id="retry">Try again</button><button class="bc-btn is-outline" id="skip">Back to the board (no coins)</button></div></div>';
      $('retry').onclick = function () { startRound(true); };
      $('skip').onclick = endRound;
    });
  }

  // ---------------------------------------------------------------- pen working
  // One drawing per question, in memory only: Try again shows it again, the next question starts blank.
  // Strokes are kept in canvas units (PEN_W x PEN_H) and replayed for the screen and for the PNG.
  var PEN_W = 800, PEN_H = 320, PEN_INK = 3, PEN_MARGIN = 16, PEN_MAX_SIDE = 800;
  var pen = { key: '', strokes: [], locked: false };

  function penDraw(c, strokes) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineWidth = PEN_INK;
    strokes.forEach(function (s) {
      if (s.length === 1) { c.beginPath(); c.arc(s[0][0], s[0][1], PEN_INK / 2, 0, Math.PI * 2); c.fill(); return; }
      c.beginPath(); c.moveTo(s[0][0], s[0][1]);
      for (var i = 1; i < s.length; i++) c.lineTo(s[i][0], s[i][1]);
      c.stroke();
    });
  }

  function penRedraw() {
    var cv = $('pen'); if (!cv) return;
    var c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#fff'; c.fillRect(0, 0, PEN_W, PEN_H);
    penDraw(c, pen.strokes);
  }

  function penMount(key) {
    if (pen.key !== key) pen = { key: key, strokes: [], locked: false };
    pen.locked = false;
    var cv = $('pen'), live = null;
    function at(e) {
      var b = cv.getBoundingClientRect();
      return [Math.round((e.clientX - b.left) * PEN_W / b.width * 10) / 10, Math.round((e.clientY - b.top) * PEN_H / b.height * 10) / 10];
    }
    cv.onpointerdown = function (e) {
      if (pen.locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      live = [at(e)]; pen.strokes.push(live); penRedraw();
    };
    cv.onpointermove = function (e) {
      if (!live) return;
      var p = at(e), last = live[live.length - 1];
      if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 1) return;
      live.push(p);
      var c = cv.getContext('2d');
      c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000'; c.lineWidth = PEN_INK;
      c.beginPath(); c.moveTo(last[0], last[1]); c.lineTo(p[0], p[1]); c.stroke();
    };
    cv.onpointerup = cv.onpointercancel = function () { live = null; };
    $('penUndo').onclick = function () { if (!pen.locked) { pen.strokes.pop(); penRedraw(); } };
    $('penClear').onclick = function () { if (!pen.locked) { pen.strokes = []; penRedraw(); } };
    penRedraw();
  }

  // The drawing as a base64 PNG (no data: prefix): cropped to the ink plus a margin, longest side at most
  // PEN_MAX_SIDE, black on white. '' when nothing is drawn.
  function penImage() {
    if (!pen.strokes.length) return '';
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pen.strokes.forEach(function (s) { s.forEach(function (p) {
      x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
    }); });
    var m = PEN_MARGIN + PEN_INK;
    x0 = Math.max(0, Math.floor(x0 - m)); y0 = Math.max(0, Math.floor(y0 - m));
    x1 = Math.min(PEN_W, Math.ceil(x1 + m)); y1 = Math.min(PEN_H, Math.ceil(y1 + m));
    var w = x1 - x0, h = y1 - y0, k = Math.min(1, PEN_MAX_SIDE / Math.max(w, h));
    var out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(w * k)); out.height = Math.max(1, Math.round(h * k));
    var c = out.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, out.width, out.height);
    c.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    penDraw(c, pen.strokes);
    try { return out.toDataURL('image/png').split(',')[1] || ''; } catch (e) { return ''; }
  }

  function roundTotal() { return S.round.qs.reduce(function (a, q) { return a + q.marks; }, 0); }

  function showQuestion() {
    var r = S.round;
    if (r.intro) {
      var first = !load('seenRound', false);
      $('screen').innerHTML = '<div class="cs-card cs-q cs-intro"><h2>Exam round ' + r.n + '</h2>' +
        '<p class="cs-q-text">' + r.qs.length + ' questions, ' + roundTotal() + ' marks.\nFull marks pays ' + (r.pool || Math.round(r.rate * roundTotal())) + ' coins.</p>' +
        (first ? '<p class="cs-lead">Marks are the only way to earn coins. Spend them on towers before the next wave.</p>' : '') +
        '<div class="cs-start-go"><button class="bc-btn cs-big" id="go">Start</button></div></div>';
      $('go').onclick = function () { r.intro = false; store('seenRound', true); save(); showQuestion(); };
      $('go').focus();
      return;
    }
    if (r.i >= r.qs.length) { endRound(); return; }
    var q = r.qs[r.i];
    if (!r.cur) r.cur = { attempt: 1, first: null, fb: null, answer: '' };
    var cur = r.cur;
    $('screen').innerHTML = '<div class="cs-card cs-q">' +
      '<div class="cs-q-meta"><span>Question ' + (r.i + 1) + ' of ' + r.qs.length + '</span><span class="cs-pill">' + q.marks + (q.marks === 1 ? ' mark' : ' marks') + '</span>' +
      (cur.attempt === 2 ? '<span class="cs-pill is-warn">Second try: half coins</span>' : '') + '</div>' +
      '<div class="cs-q-text" id="qText"></div>' +
      '<p class="cs-label">Show your working: draw it or type it.</p>' +
      '<div class="cs-pen"><canvas id="pen" width="' + PEN_W + '" height="' + PEN_H + '" aria-label="Drawing box for your working"></canvas>' +
      '<div class="cs-pen-tools"><button class="bc-btn is-outline" id="penUndo" type="button">Undo</button>' +
      '<button class="bc-btn is-outline" id="penClear" type="button">Clear</button></div></div>' +
      '<p class="cs-label">Your answer (you must type it):</p>' +
      '<textarea id="ans" rows="4" placeholder="Type your final answer here. You can type working here too."></textarea>' +
      '<div class="cs-q-actions" id="qActs"><button class="bc-btn cs-big" id="submit">Submit</button></div>' +
      '<div class="cs-fb" id="fb" hidden></div></div>';
    $('qText').textContent = q.text;
    var ans = $('ans');
    ans.value = cur.answer || '';
    ans.oninput = function () { cur.answer = ans.value; };
    penMount(r.n + '|' + r.i + '|' + q.qid);
    $('submit').onclick = submit;
    if (cur.fb) showFeedback(cur.fb);
    else setTimeout(function () { try { ans.focus(); } catch (e) {} }, 30);
  }

  function submit() {
    var r = S.round, q = r.qs[r.i], cur = r.cur, ans = $('ans'), btn2 = $('submit');
    var text = ans.value.trim();
    if (!text) { ans.focus(); return; }
    cur.answer = ans.value;
    btn2.disabled = true; btn2.textContent = 'Marking...'; ans.readOnly = true; pen.locked = true;
    var attempt = cur.attempt, image = penImage();
    call(function () { return api().submit(q.qid, cur.answer, attempt, image); }).then(function (res) {
      if (S.round !== r || r.cur !== cur) return;
      var max = Number(res.max) || q.marks, marks = Math.max(0, Math.min(max, Number(res.marks) || 0));
      var pay;
      if (attempt === 1) { cur.first = marks; pay = Math.round(marks * r.rate); }
      else pay = Math.round(Math.max(0, marks - (cur.first || 0)) * r.rate * 0.5);
      cur.fb = { marks: marks, max: max, feedback: res.feedback || '', canRetry: !!res.canRetry && attempt === 1 && marks < max, pay: pay };
      if (pay) { S.cash += pay; r.paid += pay; }
      save();
      if ($('submit')) { updateHud(); coinPop(pay); showFeedback(cur.fb); }
    }).catch(function (e) {
      if (!$('submit')) return;
      btn2.disabled = false; btn2.textContent = 'Submit'; ans.readOnly = false; pen.locked = false;
      var fb = $('fb'); fb.hidden = false; fb.className = 'cs-fb is-bad';
      fb.innerHTML = '<p>' + esc(errText(e)) + '</p><div class="cs-q-actions"><button class="bc-btn is-text" id="skipQ">Skip this question</button></div>';
      $('skipQ').onclick = function () {
        S.stats.max += q.marks; r.i++; r.cur = null; save(); showQuestion();
      };
    });
  }

  function showFeedback(fb) {
    var r = S.round, cur = r.cur;
    $('ans').readOnly = true;
    pen.locked = true;
    $('qActs').hidden = true;
    var box = $('fb');
    box.hidden = false;
    box.className = 'cs-fb ' + (fb.marks === fb.max ? 'is-good' : fb.marks ? 'is-part' : 'is-bad');
    box.innerHTML = '<div class="cs-fb-head"><b>' + fb.marks + ' of ' + fb.max + (fb.max === 1 ? ' mark' : ' marks') + '</b>' +
      (fb.pay ? '<span class="cs-coin-pop">+' + fb.pay + ' coins</span>' : '') + '</div>' +
      (fb.feedback ? '<p id="fbText"></p>' : '') +
      '<div class="cs-q-actions">' + (fb.canRetry ? '<button class="bc-btn is-outline" id="again">Try again</button>' : '') +
      '<button class="bc-btn cs-big" id="next">' + (r.i + 1 >= r.qs.length ? 'Back to the board' : 'Next') + '</button></div>';
    if (fb.feedback) $('fbText').textContent = fb.feedback;
    $('next').onclick = function () {
      var q = r.qs[r.i], best = Math.max(cur.first || 0, fb.marks);
      S.stats.marks += best; S.stats.max += q.marks; r.got = (r.got || 0) + best;
      r.i++; r.cur = null; save();
      showQuestion();
    };
    if ($('again')) $('again').onclick = function () {
      cur.attempt = 2; cur.fb = null; save(); showQuestion();
    };
    $('next').focus();
  }

  function endRound() {
    var r = S.round;
    if (r && r.qs) {
      S.stats.rounds++;
      S.stats.log.push('Round ' + r.n + ': ' + (r.got || 0) + ' of ' + roundTotal() + ' marks.');
    }
    var paid = r ? r.paid : 0;
    S.round = null;
    enterBuild();
    postResult();
    toast(paid ? 'This round earned ' + paid + ' coins. Build or upgrade, then start the next wave.' : 'No coins this round. Start the next wave when you are ready.');
  }

  // ---------------------------------------------------------------- boot
  if (!api()) {
    $('screen').innerHTML = '<div class="cs-card cs-start"><h1>Circuit Siege</h1><p class="cs-lead">The question service did not load. Reload the page.</p></div>';
    return;
  }
  window.__circuitSiege = { state: function () { return { S: S, R: R, ui: ui }; }, step: function () { if (R) Eng.step(R); render(); } };
  setId = WANT_SET;
  showStart();

  // Full screen: the real thing when the browser allows it; otherwise the lesson page makes the game fill
  // its window (its own Full screen mode). html.cs-fs lays the board out to fit the screen height.
  function csIsFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function csAskParentFull() { try { if (window.parent !== window) window.parent.postMessage({ type: 'BC_APP_FULLSCREEN' }, '*'); } catch (e) {} }
  function csToggleFull() {
    var el = document.documentElement;
    if (csIsFull()) { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); return; }
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { csAskParentFull(); return; }
    try { var p = req.call(el); if (p && p.catch) p.catch(csAskParentFull); } catch (e) { csAskParentFull(); }
  }
  function csOnFullChange() {
    document.documentElement.classList.toggle('cs-fs', csIsFull());
    var b = document.getElementById('fsBtn'); if (b) b.textContent = csIsFull() ? 'Exit full screen' : 'Full screen';
  }
  (function () {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'fsBtn'; b.className = 'bc-btn is-outline cs-fs-btn'; b.textContent = 'Full screen';
    b.onclick = csToggleFull; document.body.appendChild(b);
  })();
  document.addEventListener('fullscreenchange', csOnFullChange);
  document.addEventListener('webkitfullscreenchange', csOnFullChange);
})();
