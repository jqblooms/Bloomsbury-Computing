// Circuit Siege: a tower defence where exam marks are the only money.
// Bugs crawl along a copper track to the CPU. Between waves the player answers a short round of exam
// questions (ExamGame client); every mark pays coins. No coins for kills or for finishing a wave.
// Timers only, never requestAnimationFrame: lessons preload the page in a hidden iframe.
(function () {
  'use strict';
  var P = new URLSearchParams(location.search);
  var EMBED = P.get('embed') === '1';
  var WANT_SET = P.get('set') || P.get('mode') || '';
  var GOAL = Math.max(1, parseInt(P.get('goal'), 10) || 3);
  var KEY = 'bc-circuitsiege-v1:';
  var WAVES = 15;
  var W = Art.W, H = Art.H;

  var DIFF = {
    easy: { name: 'Easy', lives: 30, hp: 0.8, bonus: 1.2, cash: 130, line: '30 lives. Slower bugs. Marks pay 20% extra.' },
    medium: { name: 'Medium', lives: 20, hp: 1, bonus: 1.1, cash: 110, line: '20 lives. Marks pay 10% extra.' },
    hard: { name: 'Hard', lives: 12, hp: 1.25, bonus: 1, cash: 100, line: '12 lives. Tough bugs.' }
  };
  var TOWERS = {
    pulse: { name: 'Pulse Node', cost: 50, up: [60, 110], range: [105, 118, 132], rate: [0.55, 0.45, 0.34], dmg: [1, 1.6, 2.6], blurb: 'Fast shots at one bug.' },
    fan: { name: 'Cooling Fan', cost: 70, up: [70, 120], range: [78, 90, 104], slow: [0.35, 0.5, 0.6], dps: [0.6, 1.1, 2], blurb: 'Slows bugs near it.' },
    surge: { name: 'Surge Capacitor', cost: 90, up: [90, 150], range: [96, 106, 118], rate: [1.3, 1.1, 0.9], dmg: [2, 3.2, 5], splash: [46, 56, 68], blurb: 'Shocks a group of bugs.' },
    laser: { name: 'Laser Diode', cost: 110, up: [100, 170], range: [200, 235, 275], rate: [1.6, 1.35, 1.1], dmg: [5, 9, 15], blurb: 'Long range. Cuts through armour.' }
  };
  var BUGS = {
    bug: { hp: 4, spd: 48, armour: 0, r: 11, lives: 1 },
    worm: { hp: 3, spd: 90, armour: 0, r: 8, lives: 1 },
    swarm: { hp: 1.5, spd: 66, armour: 0, r: 7, lives: 1 },
    trojan: { hp: 12, spd: 34, armour: 1, r: 14, lives: 2 },
    rootkit: { hp: 70, spd: 26, armour: 1, r: 20, lives: 5 }
  };
  var TIPS = [
    'Bugs crawl along the copper track to your CPU. Each bug that gets in costs a life.',
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

  function reportHeight() {
    if (window.parent === window) return;
    var h = document.getElementById('app').getBoundingClientRect().height;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(h) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.getElementById('app'));
  window.addEventListener('load', reportHeight);

  // ---------------------------------------------------------------- path maths
  var SEG = [], PATH_LEN = 0;
  (function () {
    var p = Art.PATH;
    for (var i = 1; i < p.length; i++) {
      var dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1], len = Math.sqrt(dx * dx + dy * dy);
      SEG.push({ x: p[i - 1][0], y: p[i - 1][1], dx: dx / len, dy: dy / len, len: len, at: PATH_LEN });
      PATH_LEN += len;
    }
  })();
  function posAt(d) {
    for (var i = 0; i < SEG.length; i++) {
      var s = SEG[i];
      if (d <= s.at + s.len || i === SEG.length - 1) {
        var k = d - s.at;
        return { x: s.x + s.dx * k, y: s.y + s.dy * k, dir: Math.atan2(s.dy, s.dx) };
      }
    }
  }
  function distToPath(x, y) {
    var best = 1e9;
    SEG.forEach(function (s) {
      var k = Math.max(0, Math.min(s.len, (x - s.x) * s.dx + (y - s.y) * s.dy));
      var px = s.x + s.dx * k, py = s.y + s.dy * k;
      best = Math.min(best, Math.hypot(x - px, y - py));
    });
    return best;
  }

  // ---------------------------------------------------------------- state
  var sets = [], setId = '', setTitle = '';
  var S = null;           // saved game
  var R = null;           // live wave: { queue, time, enemies, shots, fx }
  var ui = { place: null, sel: -1, hover: null, speed: 1, paused: false, t: 0 };
  var nextId = 1;

  function newGame(diff) {
    var d = DIFF[diff];
    S = { v: 1, set: setId, diff: diff, wave: 0, cash: d.cash, lives: d.lives, towers: [], phase: 'build', round: null,
      stats: { marks: 0, max: 0, rounds: 0, log: [] } };
    save();
  }
  function save() { if (S) store('game:' + setId, S); }

  // ---------------------------------------------------------------- results for the lesson slide
  function postResult() {
    if (window.parent === window || !S) return;
    var id = 'circuit-siege-' + setId;
    var done = S.stats.rounds >= GOAL || S.phase === 'won';
    if (done) store('done:' + setId, true);
    var before = !!load('done:' + setId, false);
    var head = done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.';
    var line = ' ' + DIFF[S.diff].name + '. Waves cleared ' + S.wave + ' of ' + WAVES + '. Marks ' + S.stats.marks + ' of ' + S.stats.max + ' in ' + S.stats.rounds + ' exam rounds.';
    if (S.phase === 'over') line += ' The bugs reached the CPU.';
    if (S.phase === 'won') line += ' All waves beaten.';
    try {
      window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label: 'Circuit Siege: ' + (setTitle || setId),
        summary: head + line + (S.stats.log.length ? ' ' + S.stats.log.slice(-10).join(' ') : ''), complete: done || before }, '*');
    } catch (e) {}
  }

  // ---------------------------------------------------------------- start screen
  function setHud(on) { $('hud').hidden = !on; if (on) updateHud(); }
  function updateHud() {
    if (!S) return;
    $('hudLives').textContent = S.lives;
    $('hudCoins').textContent = S.cash;
    $('hudWave').textContent = Math.min(WAVES, S.wave + 1);
    $('hudWaves').textContent = WAVES;
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
      drawStart(!!fixed);
    }).catch(function (e) {
      scr.innerHTML = '<div class="cs-card cs-start"><h1>Circuit Siege</h1><p class="cs-lead">' + esc(errText(e)) + '</p><button class="bc-btn" id="retry">Try again</button></div>';
      $('retry').onclick = showStart;
    });
  }

  function drawStart(fixed) {
    var cur = sets.filter(function (s) { return s.setId === setId; })[0];
    setTitle = cur ? (cur.title || cur.setId) : setId;
    var saved = load('game:' + setId, null);
    if (saved && (saved.phase === 'over' || saved.phase === 'won' || !DIFF[saved.diff])) saved = null;
    var diff = load('diff', 'medium');
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
      h += '<div class="cs-start-go"><button class="bc-btn cs-big" id="cont">Continue: wave ' + Math.min(WAVES, saved.wave + 1) + ', ' + DIFF[saved.diff].name + '</button>' +
        '<button class="bc-btn is-outline" id="fresh">New game</button></div>';
    } else {
      h += '<p class="cs-label">Pick a level</p><div class="cs-diffs">' + Object.keys(DIFF).map(function (k) {
        return '<button class="cs-diff' + (k === diff ? ' is-on' : '') + '" data-diff="' + k + '"><b>' + DIFF[k].name + '</b><span>' + DIFF[k].line + '</span></button>';
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
    if ($('go')) $('go').onclick = function () { newGame(load('diff', 'medium')); enterBuild(); };
    if ($('cont')) $('cont').onclick = function () { S = saved; resume(); };
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
    var kinds = ['bug', 'worm', 'swarm', 'trojan', 'bug'];
    kinds.forEach(function (k, i) {
      var b = BUGS[k];
      Art.drawEnemy(g, { type: k, x: 40 + i * 52, y: 62, dir: 0, r: b.r, id: i, hp: 1, maxHp: 1, slowT: 0 }, i * .3);
    });
    ['pulse', 'fan', 'surge', 'laser'].forEach(function (k, i) { Art.drawTower(g, k, 320 + i * 44, 24 + (i % 2) * 64, 1, Math.PI, .2, .75); });
  }

  // ---------------------------------------------------------------- game screen
  var canvas, ctx, bg;

  function resume() {
    if (S.phase === 'questions') { setHud(true); startRound(true); return; }
    enterBuild();
  }

  function enterBuild() {
    stopWave();
    S.phase = 'build'; save();
    setHud(true);
    ui.place = null; ui.sel = -1;
    $('screen').innerHTML =
      '<div class="cs-tip" id="tip" hidden><span id="tipText"></span><button class="bc-btn is-tonal" id="tipOk">OK</button></div>' +
      '<div class="cs-board" id="board"><canvas id="cv" width="' + W + '" height="' + H + '"></canvas><div class="cs-toast" id="toast" hidden></div></div>' +
      '<div class="cs-panel"><div class="cs-shop" id="shop"></div>' +
      '<div class="cs-controls"><button class="bc-btn cs-big" id="startWave">Start wave ' + (S.wave + 1) + '</button>' +
      '<div class="cs-ctl-row"><button class="bc-btn is-outline" id="speed">Speed 1x</button><button class="bc-btn is-outline" id="pause" disabled>Pause</button></div></div></div>';
    canvas = $('cv'); ctx = canvas.getContext('2d');
    bg = document.createElement('canvas'); bg.width = W; bg.height = H; Art.drawBoard(bg.getContext('2d'));
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', function () { ui.hover = null; });
    canvas.addEventListener('click', onClick);
    $('startWave').onclick = startWave;
    $('speed').onclick = function () { ui.speed = ui.speed === 1 ? 2 : 1; this.textContent = 'Speed ' + ui.speed + 'x'; };
    $('pause').onclick = function () { ui.paused = !ui.paused; this.textContent = ui.paused ? 'Play' : 'Pause'; };
    $('speed').textContent = 'Speed ' + ui.speed + 'x';
    $('tipOk').onclick = function () { var n = load('tut', 0); store('tut', n + 1); hideTip(); if (n + 1 < 2) showTip(n + 1); };
    drawShop();
    updateHud();
    if (load('tut', 0) < 2) showTip(load('tut', 0));
    else if (load('tut', 0) === 2 && S.towers.length) showTip(2);
    render();
  }

  function showTip(i) {
    if (load('tut', 0) !== i || !$('tip')) return;
    $('tipText').textContent = TIPS[i]; $('tip').hidden = false;
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

  function drawShop() {
    var shop = $('shop'); if (!shop) return;
    shop.innerHTML = '';
    if (ui.sel >= 0 && S.towers[ui.sel]) {
      var tw = S.towers[ui.sel], def = TOWERS[tw.type], up = def.up[tw.lv - 1];
      var info = document.createElement('div'); info.className = 'cs-sel';
      info.appendChild(Art.towerIcon(tw.type));
      var box = document.createElement('div');
      box.innerHTML = '<b>' + def.name + '</b><span>Level ' + tw.lv + ' of 3. ' + def.blurb + '</span>';
      info.appendChild(box);
      var acts = document.createElement('div'); acts.className = 'cs-sel-acts';
      var ub = document.createElement('button'); ub.className = 'bc-btn';
      if (up == null) { ub.textContent = 'Top level'; ub.disabled = true; }
      else { ub.textContent = 'Upgrade: ' + up + ' coins'; ub.disabled = S.cash < up; ub.onclick = function () { upgrade(ui.sel); }; }
      var sb = document.createElement('button'); sb.className = 'bc-btn is-outline'; sb.textContent = 'Sell: +' + Math.floor(tw.spent * 0.7);
      sb.onclick = function () { sell(ui.sel); };
      var cb = document.createElement('button'); cb.className = 'bc-btn is-text'; cb.textContent = 'Done';
      cb.onclick = function () { ui.sel = -1; drawShop(); };
      acts.appendChild(ub); acts.appendChild(sb); acts.appendChild(cb);
      info.appendChild(acts);
      shop.appendChild(info);
      return;
    }
    Object.keys(TOWERS).forEach(function (k) {
      var d = TOWERS[k], b = document.createElement('button');
      b.className = 'cs-buy' + (ui.place === k ? ' is-on' : '') + (S.cash < d.cost ? ' is-poor' : '');
      b.appendChild(Art.towerIcon(k));
      var t = document.createElement('span'); t.className = 'cs-buy-text';
      t.innerHTML = '<b>' + d.name + '</b><span>' + d.blurb + '</span><em>' + d.cost + ' coins</em>';
      b.appendChild(t);
      b.onclick = function () {
        if (S.cash < d.cost) { toast('Not enough coins. Earn coins with marks after the wave.'); return; }
        ui.place = ui.place === k ? null : k; drawShop();
        if (ui.place) toast('Click an empty spot on the board.');
      };
      shop.appendChild(b);
    });
  }

  function boardXY(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function canPlace(x, y) {
    if (x < 24 || y < 24 || x > W - 24 || y > H - 24) return false;
    if (distToPath(x, y) < Art.TRACK / 2 + 22) return false;
    if (Math.abs(x - Art.CPU.x) < 70 && Math.abs(y - Art.CPU.y) < 70) return false;
    if (x < 50 && y < 150) return false;
    return !S.towers.some(function (t) { return Math.hypot(t.x - x, t.y - y) < 44; });
  }
  function towerAt(x, y) {
    for (var i = 0; i < S.towers.length; i++) if (Math.abs(S.towers[i].x - x) < 22 && Math.abs(S.towers[i].y - y) < 22) return i;
    return -1;
  }
  function onMove(e) { ui.hover = boardXY(e); if (!R) render(); }
  function onClick(e) {
    var p = boardXY(e);
    if (ui.place) {
      var d = TOWERS[ui.place];
      if (!canPlace(p.x, p.y)) { toast('You cannot build there. Pick a dark spot away from the track.'); return; }
      if (S.cash < d.cost) { ui.place = null; drawShop(); return; }
      S.cash -= d.cost;
      S.towers.push({ type: ui.place, x: Math.round(p.x), y: Math.round(p.y), lv: 1, spent: d.cost, cd: 0, ang: -Math.PI / 2 });
      if (S.cash < d.cost) ui.place = null;
      save(); updateHud(); drawShop();
      tipDone(1); showTip(2);
      return;
    }
    var i = towerAt(p.x, p.y);
    ui.sel = i; drawShop();
    if (i >= 0) tipDone(2);
  }
  function upgrade(i) {
    var tw = S.towers[i], cost = TOWERS[tw.type].up[tw.lv - 1];
    if (cost == null || S.cash < cost) return;
    S.cash -= cost; tw.spent += cost; tw.lv++;
    save(); updateHud(); drawShop();
  }
  function sell(i) {
    var tw = S.towers[i];
    S.cash += Math.floor(tw.spent * 0.7);
    S.towers.splice(i, 1); ui.sel = -1;
    save(); updateHud(); drawShop();
  }

  // ---------------------------------------------------------------- waves
  function buildWave(n) {
    var q = [], t = 0;
    function add(type, count, gap) { for (var i = 0; i < count; i++) { q.push({ type: type, at: t }); t += gap; } t += 0.9; }
    add('bug', 4 + 2 * n, Math.max(0.38, 0.85 - 0.03 * n));
    if (n >= 3) add('worm', n - 1, 0.55);
    if (n >= 4) add('swarm', 3 * Math.floor(n / 2), 0.26);
    if (n >= 5) add('trojan', n - 3, 1.1);
    if (n >= 8) add('bug', n, 0.35);
    if (n % 5 === 0) add('rootkit', n / 5, 3);
    return q;
  }

  function startWave() {
    if (R || S.phase !== 'build') return;
    hideTip();
    var n = S.wave + 1;
    R = { n: n, queue: buildWave(n), time: 0, enemies: [], shots: [], fx: [] };
    S.towers.forEach(function (t) { t.cd = 0; });
    $('startWave').disabled = true; $('startWave').textContent = 'Wave ' + n + ' running';
    $('pause').disabled = false; ui.paused = false; $('pause').textContent = 'Pause';
  }
  function stopWave() { R = null; }

  function spawn(type, n) {
    var b = BUGS[type], hp = b.hp * DIFF[S.diff].hp * (1 + 0.15 * (n - 1));
    var p = posAt(0);
    R.enemies.push({ id: nextId++, type: type, hp: hp, maxHp: hp, spd: b.spd * (S.diff === 'easy' ? 0.9 : 1), armour: b.armour, r: b.r, lives: b.lives,
      d: 0, x: p.x, y: p.y, dir: p.dir, slow: 0, slowT: 0 });
  }

  function hurt(e, dmg, pierce) {
    if (e.hp <= 0) return;
    e.hp -= pierce ? dmg : Math.max(dmg * 0.3, dmg - e.armour);
    if (e.hp <= 0) R.fx.push({ k: 'burst', x: e.x, y: e.y, t: 0, max: 0.35, col: e.type === 'swarm' ? '#c58af9' : '#f28b82', r: e.r });
  }

  function step(dt) {
    var i, e;
    R.time += dt;
    while (R.queue.length && R.queue[0].at <= R.time) spawn(R.queue.shift().type, R.n);
    // move bugs
    for (i = R.enemies.length - 1; i >= 0; i--) {
      e = R.enemies[i];
      var f = e.slowT > 0 ? 1 - e.slow : 1;
      e.d += e.spd * f * dt;
      e.slowT -= dt; if (e.slowT <= 0) e.slow = 0;
      if (e.d >= PATH_LEN) {
        S.lives = Math.max(0, S.lives - e.lives); R.enemies.splice(i, 1); updateHud();
        R.fx.push({ k: 'ring', x: Art.CPU.x, y: Art.CPU.y, t: 0, max: 0.5, col: '#f28b82', r: 30 });
        continue;
      }
      var p = posAt(e.d); e.x = p.x; e.y = p.y; e.dir = p.dir;
    }
    // towers
    S.towers.forEach(function (tw) {
      var def = TOWERS[tw.type], L = tw.lv - 1, range = def.range[L];
      if (tw.type === 'fan') {
        R.enemies.forEach(function (en) {
          if (Math.hypot(en.x - tw.x, en.y - tw.y) <= range + en.r) {
            en.slow = Math.max(en.slow, def.slow[L]); en.slowT = 0.15; hurt(en, def.dps[L] * dt, true);
          }
        });
        return;
      }
      tw.cd -= dt;
      var target = null;
      R.enemies.forEach(function (en) {
        if (en.hp > 0 && Math.hypot(en.x - tw.x, en.y - tw.y) <= range + en.r && (!target || en.d > target.d)) target = en;
      });
      if (!target) return;
      tw.ang = Math.atan2(target.y - tw.y, target.x - tw.x);
      if (tw.cd > 0) return;
      tw.cd = def.rate[L];
      if (tw.type === 'laser') {
        hurt(target, def.dmg[L], true);
        R.fx.push({ k: 'beam', x: tw.x, y: tw.y, x2: target.x, y2: target.y, t: 0, max: 0.14, col: Art.COL.laser });
      } else {
        R.shots.push({ type: tw.type, x: tw.x + Math.cos(tw.ang) * 18, y: tw.y + Math.sin(tw.ang) * 18, target: target, tx: target.x, ty: target.y,
          spd: tw.type === 'pulse' ? 460 : 320, dmg: def.dmg[L], splash: def.splash ? def.splash[L] : 0 });
      }
    });
    // shots
    for (i = R.shots.length - 1; i >= 0; i--) {
      var s = R.shots[i];
      if (s.target && s.target.hp > 0) { s.tx = s.target.x; s.ty = s.target.y; }
      var dx = s.tx - s.x, dy = s.ty - s.y, dist = Math.hypot(dx, dy), mv = s.spd * dt;
      if (dist <= mv + 4) {
        if (s.splash) {
          R.enemies.forEach(function (en) { if (Math.hypot(en.x - s.tx, en.y - s.ty) <= s.splash + en.r) hurt(en, s.dmg, false); });
          R.fx.push({ k: 'ring', x: s.tx, y: s.ty, t: 0, max: 0.3, col: Art.COL.surge, r: s.splash });
        } else if (s.target && s.target.hp > 0) hurt(s.target, s.dmg, false);
        R.shots.splice(i, 1);
      } else { s.x += dx / dist * mv; s.y += dy / dist * mv; }
    }
    R.enemies = R.enemies.filter(function (en) { return en.hp > 0; });
    R.fx = R.fx.filter(function (fx) { fx.t += dt; return fx.t < fx.max; });

    if (S.lives <= 0) { gameOver(); return; }
    if (!R.queue.length && !R.enemies.length) waveCleared();
  }

  function waveCleared() {
    var n = R.n;
    stopWave();
    S.wave = n;
    if (S.wave >= WAVES) { S.phase = 'won'; save(); postResult(); showEnd(true); return; }
    save();
    startRound(false);
  }

  function gameOver() {
    stopWave();
    S.phase = 'over'; save(); postResult();
    showEnd(false);
  }

  function showEnd(won) {
    setHud(true);
    var st = S.stats;
    $('screen').innerHTML = '<div class="cs-card cs-start"><h1>' + (won ? 'The CPU is safe' : 'The bugs got into the CPU') + '</h1>' +
      '<p class="cs-lead">' + (won ? 'You beat all ' + WAVES + ' waves.' : 'You cleared ' + S.wave + ' of ' + WAVES + ' waves.') + '</p>' +
      '<p class="cs-lead">You earned ' + st.marks + ' of ' + st.max + ' marks in ' + st.rounds + ' exam rounds.</p>' +
      '<div class="cs-start-go"><button class="bc-btn cs-big" id="again">Play again</button></div></div>';
    $('again').onclick = function () { store('game:' + setId, null); S = null; showStart(); };
  }

  // ---------------------------------------------------------------- drawing
  function render() {
    if (!ctx) return;
    var t = ui.t, i;
    ctx.drawImage(bg, 0, 0);
    if (R) R.enemies.forEach(function (e) { Art.drawEnemy(ctx, e, t); });
    S.towers.forEach(function (tw, idx) {
      if (idx === ui.sel) rangeRing(tw.x, tw.y, TOWERS[tw.type].range[tw.lv - 1], true);
      if (tw.type === 'fan' && R && R.enemies.length) {
        ctx.fillStyle = 'rgba(120, 217, 236, .06)'; ctx.beginPath(); ctx.arc(tw.x, tw.y, TOWERS.fan.range[tw.lv - 1], 0, 7); ctx.fill();
      }
      Art.drawTower(ctx, tw.type, tw.x, tw.y, tw.lv, tw.ang || 0, tw.type === 'fan' ? (R ? t : t * 0.15) : t);
    });
    if (R) {
      R.shots.forEach(function (s) {
        ctx.fillStyle = Art.COL[s.type];
        ctx.beginPath(); ctx.arc(s.x, s.y, s.type === 'surge' ? 5 : 3.5, 0, 7); ctx.fill();
      });
      R.fx.forEach(function (fx) {
        var k = fx.t / fx.max;
        ctx.globalAlpha = 1 - k;
        if (fx.k === 'beam') { ctx.strokeStyle = fx.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.x2, fx.y2); ctx.stroke(); }
        else if (fx.k === 'ring') { ctx.strokeStyle = fx.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (0.4 + k * 0.6), 0, 7); ctx.stroke(); }
        else { ctx.fillStyle = fx.col; for (i = 0; i < 6; i++) { var a = i * 1.05; ctx.beginPath(); ctx.arc(fx.x + Math.cos(a) * fx.r * k * 1.6, fx.y + Math.sin(a) * fx.r * k * 1.6, 2.5, 0, 7); ctx.fill(); } }
        ctx.globalAlpha = 1;
      });
    }
    if (ui.place && ui.hover) {
      var ok = canPlace(ui.hover.x, ui.hover.y);
      rangeRing(ui.hover.x, ui.hover.y, TOWERS[ui.place].range[0], ok);
      ctx.globalAlpha = ok ? 0.75 : 0.35;
      Art.drawTower(ctx, ui.place, ui.hover.x, ui.hover.y, 1, -Math.PI / 2, 0);
      ctx.globalAlpha = 1;
    }
    if (ui.paused && R) {
      ctx.fillStyle = 'rgba(4, 6, 10, .5)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8eaed'; ctx.font = '800 40px Figtree, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Paused', W / 2, H / 2);
    }
  }
  function rangeRing(x, y, r, ok) {
    ctx.fillStyle = ok ? 'rgba(138, 180, 248, .10)' : 'rgba(242, 139, 130, .14)';
    ctx.strokeStyle = ok ? 'rgba(138, 180, 248, .6)' : 'rgba(242, 139, 130, .7)';
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  }

  // One timer drives everything. It does nothing while the page is hidden (a preloaded lesson slide).
  var last = Date.now();
  setInterval(function () {
    var now = Date.now(), real = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (hiddenNow() || !S || !ctx || !document.body.contains(canvas)) return;
    ui.t += real;
    if (R && !ui.paused) {
      var dt = real * ui.speed;
      while (dt > 0 && R) { var h = Math.min(0.034, dt); step(h); dt -= h; }
    }
    if (ctx && document.body.contains(canvas)) render();
  }, 33);

  // ---------------------------------------------------------------- exam rounds
  // S.round = { n, qs, i, rate, paid, cur: { attempt, first, fb, answer } }
  function startRound(resuming) {
    S.phase = 'questions';
    if (!resuming || !S.round) S.round = { n: S.wave, qs: null, i: 0, rate: 0, paid: 0, cur: null, intro: true };
    save(); setHud(true); ctx = null;
    var r = S.round;
    if (r.qs) { showQuestion(); return; }
    $('screen').innerHTML = '<div class="cs-card cs-q"><p class="cs-lead">Loading questions...</p></div>';
    call(function () { return api().next(setId, { count: 3, maxMarks: 4 }); }).then(function (list) {
      list = (list || []).filter(function (q) { return q && q.qid; });
      if (!list.length) throw new Error('No questions right now.');
      var total = list.reduce(function (a, q) { return a + (Number(q.marks) || 1); }, 0);
      r.qs = list.map(function (q) { return { qid: q.qid, text: q.text, marks: Number(q.marks) || 1 }; });
      r.rate = (100 + r.n) * DIFF[S.diff].bonus / total;
      save();
      showQuestion();
    }).catch(function (e) {
      $('screen').innerHTML = '<div class="cs-card cs-q"><p class="cs-lead">' + esc(errText(e)) + '</p>' +
        '<div class="cs-start-go"><button class="bc-btn" id="retry">Try again</button><button class="bc-btn is-outline" id="skip">Back to the board (no coins)</button></div></div>';
      $('retry').onclick = function () { startRound(true); };
      $('skip').onclick = endRound;
    });
  }

  function roundTotal() { return S.round.qs.reduce(function (a, q) { return a + q.marks; }, 0); }

  function showQuestion() {
    var r = S.round;
    if (r.intro) {
      var per = Math.round(r.rate);
      var first = !load('seenRound', false);
      $('screen').innerHTML = '<div class="cs-card cs-q cs-intro"><h2>Exam round ' + r.n + '</h2>' +
        '<p class="cs-q-text">' + r.qs.length + ' questions, ' + roundTotal() + ' marks.\nEvery mark pays about ' + per + ' coins.</p>' +
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
      '<textarea id="ans" rows="5" placeholder="Write your working and your answer here."></textarea>' +
      '<div class="cs-q-actions" id="qActs"><button class="bc-btn cs-big" id="submit">Submit</button></div>' +
      '<div class="cs-fb" id="fb" hidden></div></div>';
    $('qText').textContent = q.text;
    var ans = $('ans');
    ans.value = cur.answer || '';
    ans.oninput = function () { cur.answer = ans.value; };
    $('submit').onclick = submit;
    if (cur.fb) showFeedback(cur.fb);
    else setTimeout(function () { try { ans.focus(); } catch (e) {} }, 30);
  }

  function submit() {
    var r = S.round, q = r.qs[r.i], cur = r.cur, ans = $('ans'), btn = $('submit');
    var text = ans.value.trim();
    if (!text) { ans.focus(); return; }
    cur.answer = ans.value;
    btn.disabled = true; btn.textContent = 'Marking...'; ans.readOnly = true;
    var attempt = cur.attempt;
    call(function () { return api().submit(q.qid, cur.answer, attempt); }).then(function (res) {
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
      btn.disabled = false; btn.textContent = 'Submit'; ans.readOnly = false;
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
  window.__circuitSiege = { state: function () { return { S: S, R: R, ui: ui }; }, step: function (dt) { if (R) step(dt); render(); } };
  setId = WANT_SET;
  showStart();
})();
