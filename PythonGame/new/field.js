// Python Defense: the board. A circuit board where software bugs crawl along a copper trace towards the CPU; three
// debugger turrets stand beside the trace. Each task sends one bug walking; a right answer and the turrets fire and
// squash it; a wrong answer (or the time running out) and it dashes into the CPU.
// The game's clock is Date.now(): drawing uses animation frames, but nothing waits on one (a hidden frame has none).
var FIELD = (function () {
  'use strict';
  var W = 960, H = 300;
  // the trace, in board pixels: from the nest on the left, round two bends, into the CPU on the right
  var PATH = [[-30, 70], [210, 70], [250, 110], [250, 200], [290, 240], [560, 240], [600, 200], [600, 110], [640, 70], [855, 70], [885, 100], [885, 196]];
  var CPU = { x: 830, y: 190, w: 110, h: 90 };
  var TOWERS = [{ x: 170, y: 160 }, { x: 430, y: 175 }, { x: 720, y: 150 }];
  var C = { board: '#103a2b', board2: '#0c3023', grid: 'rgba(255,255,255,0.035)', copper: '#c98f3c', copperHi: '#e9b867', pad: '#d9a85a', silk: 'rgba(240,244,236,0.55)',
    chip: '#1b1f24', chipEdge: '#3a414a', pin: '#c9ccd1', bug: '#2b2f36', bugShell: '#c0392b', bugShell2: '#e67e22', boss: '#7d3cba', shot: '#7ef0ff', crack: '#ff6b6b' };
  var cv, g, segs = [], total = 0;
  var st = { bugs: 0, boss: false, done: 0, walking: null, splats: [], shots: [], parts: [], hurt: 0, cpuHits: 0 };

  function init(canvas) {
    cv = canvas; g = cv.getContext('2d');
    segs = []; total = 0;
    for (var i = 1; i < PATH.length; i++) { var a = PATH[i - 1], b = PATH[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a: a, b: b, l: l, at: total }); total += l; }
    requestAnimationFrame(frame);
  }
  function at(p) {   // a point on the trace, p from 0 (the nest) to 1 (the CPU)
    var d = Math.max(0, Math.min(1, p)) * total;
    for (var i = 0; i < segs.length; i++) { var s = segs[i]; if (d <= s.at + s.l || i === segs.length - 1) { var t = Math.min(1, (d - s.at) / s.l); return { x: s.a[0] + (s.b[0] - s.a[0]) * t, y: s.a[1] + (s.b[1] - s.a[1]) * t, ang: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) }; } }
  }

  // ---------------------------------------------------------------- what the game does
  function wave(n, boss) { st.bugs = n; st.boss = !!boss; st.done = 0; st.walking = null; st.splats = []; st.shots = []; st.parts = []; st.hurt = 0; st.cpuHits = 0; }
  // a bug sets off; it reaches the CPU after `seconds` unless it is squashed first
  function send(seconds) { st.walking = { t0: Date.now(), dur: seconds * 1000, paused: 0, pausedAt: 0, big: st.boss && st.done === st.bugs - 1, dash: null }; }
  function progress() { var w = st.walking; if (!w) return 0; var now = w.pausedAt || Date.now(); return Math.min(1, (now - w.t0 - w.paused) / w.dur); }
  function hold() { var w = st.walking; if (w && !w.pausedAt) w.pausedAt = Date.now(); }        // stop the bug while the answer is being checked
  function go() { var w = st.walking; if (w && w.pausedAt) { w.paused += Date.now() - w.pausedAt; w.pausedAt = 0; } }
  // a right answer: every turret fires; the bug pops
  function squash() {
    var w = st.walking; if (!w) return; hold();
    var p = at(progress());
    TOWERS.forEach(function (tw, k) { st.shots.push({ x0: tw.x, y0: tw.y - 18, x1: p.x, y1: p.y, t0: Date.now() + k * 90 }); });
    setTimeout(function () {
      for (var i = 0; i < 26; i++) { var a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 140; st.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t0: Date.now(), col: i % 3 ? C.bugShell : C.bugShell2 }); }
      st.splats.push({ x: p.x, y: p.y, r: w.big ? 22 : 13 }); st.walking = null; st.done++;
    }, 330);
  }
  // a wrong answer: the bug dashes into the CPU
  function breach() {
    var w = st.walking; if (!w) return;
    w.dash = { from: progress(), t0: Date.now() }; w.pausedAt = 0;
    setTimeout(function () { st.hurt = Date.now(); st.cpuHits++; if (st.walking === w) st.walking = null; }, 600);
  }

  // ---------------------------------------------------------------- drawing
  function frame() {
    requestAnimationFrame(frame);
    if (!g || cv.offsetParent === null) return;
    var now = Date.now();
    g.clearRect(0, 0, W, H);
    // the board, a faint grid and some silkscreen
    g.fillStyle = C.board; g.fillRect(0, 0, W, H);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    for (var x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (var y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = C.silk; g.font = '600 11px Consolas, monospace';
    g.fillText('R12', 96, 230); g.fillText('C4', 380, 120); g.fillText('U2  DEBUG', 664, 250); g.fillText('BUG NEST', 18, 40);
    [[60, 250], [120, 265], [470, 70], [520, 95], [930, 40]].forEach(function (c) { g.fillStyle = C.board2; g.fillRect(c[0] - 14, c[1] - 6, 28, 12); g.fillStyle = C.pad; g.fillRect(c[0] - 14, c[1] - 6, 6, 12); g.fillRect(c[0] + 8, c[1] - 6, 6, 12); });
    // the copper trace the bugs walk along
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#0a2219'; g.lineWidth = 34; trace(); g.strokeStyle = C.copper; g.lineWidth = 26; trace(); g.strokeStyle = C.copperHi; g.lineWidth = 3; g.setLineDash([2, 10]); trace(); g.setLineDash([]);
    // splats where bugs were squashed
    st.splats.forEach(function (s) { g.fillStyle = 'rgba(192,57,43,0.35)'; blob(s.x, s.y, s.r * 1.6); g.fillStyle = 'rgba(230,126,34,0.45)'; blob(s.x + 3, s.y - 2, s.r); });
    drawCpu(now);
    // the turrets turn to face the walking bug
    var w = st.walking, p = null;
    if (w) {
      var prog = w.dash ? w.dash.from + (1 - w.dash.from) * Math.min(1, (now - w.dash.t0) / 600) : progress();
      p = at(prog);
    }
    TOWERS.forEach(function (tw) { drawTower(tw, p); });
    // the bugs still waiting in the nest
    var waiting = st.bugs - st.done - (w ? 1 : 0);
    for (var k = 0; k < waiting && k < 8; k++) drawBug(18 + (k % 4) * 22, 98 + Math.floor(k / 4) * 26, 0, now + k * 300, st.boss && k === waiting - 1 && st.done + (w ? 1 : 0) + k === st.bugs - 1 ? 1.6 : 0.8);
    if (p) drawBug(p.x, p.y, p.ang, now, w.big ? 1.7 : 1, true);
    // shots and bits
    st.shots = st.shots.filter(function (s) { var t = (now - s.t0) / 260; if (t < 0) return true; if (t > 1) return false;
      g.strokeStyle = C.shot; g.lineWidth = 4 * (1 - t) + 1; g.globalAlpha = 1 - t * 0.6;
      g.beginPath(); g.moveTo(s.x0, s.y0); g.lineTo(s.x0 + (s.x1 - s.x0) * Math.min(1, t * 1.6), s.y0 + (s.y1 - s.y0) * Math.min(1, t * 1.6)); g.stroke(); g.globalAlpha = 1; return true; });
    st.parts = st.parts.filter(function (q) { var t = (now - q.t0) / 700; if (t > 1) return false; g.fillStyle = q.col; g.globalAlpha = 1 - t; g.fillRect(q.x + q.vx * t, q.y + q.vy * t + 60 * t * t, 4, 4); g.globalAlpha = 1; return true; });
  }
  function trace() { g.beginPath(); PATH.forEach(function (pt, i) { if (i) g.lineTo(pt[0], pt[1]); else g.moveTo(pt[0], pt[1]); }); g.stroke(); }
  function blob(x, y, r) { g.beginPath(); for (var i = 0; i <= 10; i++) { var a = i / 10 * Math.PI * 2, rr = r * (0.75 + 0.25 * Math.sin(i * 2.7)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  function drawCpu(now) {
    var c = CPU, hurt = now - st.hurt < 500;
    g.fillStyle = C.pin;
    for (var i = 0; i < 6; i++) { g.fillRect(c.x - 8, c.y + 10 + i * 13, 8, 5); g.fillRect(c.x + c.w, c.y + 10 + i * 13, 8, 5); g.fillRect(c.x + 10 + i * 16, c.y - 8, 5, 8); }
    g.fillStyle = hurt ? '#5c1a1a' : C.chip; g.strokeStyle = hurt ? C.crack : C.chipEdge; g.lineWidth = 3;
    round(c.x, c.y, c.w, c.h, 8); g.fill(); g.stroke();
    g.fillStyle = '#e8eaed'; g.font = '700 22px Consolas, monospace'; g.textAlign = 'center'; g.fillText('CPU', c.x + c.w / 2, c.y + c.h / 2 + 2);
    g.font = '600 10px Consolas, monospace'; g.fillStyle = '#9aa3ad'; g.fillText(st.cpuHits ? 'HIT' : 'SAFE', c.x + c.w / 2, c.y + c.h / 2 + 20); g.textAlign = 'left';
    if (st.cpuHits) { g.strokeStyle = C.crack; g.lineWidth = 2; g.beginPath(); g.moveTo(c.x + 20, c.y + 8); g.lineTo(c.x + 38, c.y + 32); g.lineTo(c.x + 30, c.y + 50); g.lineTo(c.x + 52, c.y + 78); g.stroke(); }
  }
  function drawTower(tw, p) {
    var ang = p ? Math.atan2(p.y - tw.y, p.x - tw.x) : -Math.PI / 2;
    g.fillStyle = '#0a2219'; g.beginPath(); g.arc(tw.x, tw.y + 4, 24, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2d3742'; g.beginPath(); g.arc(tw.x, tw.y, 22, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#7ef0ff'; g.lineWidth = 2; g.beginPath(); g.arc(tw.x, tw.y, 22, 0, Math.PI * 2); g.stroke();
    g.save(); g.translate(tw.x, tw.y); g.rotate(ang);
    g.fillStyle = '#3d4a57'; g.fillRect(0, -6, 26, 12); g.fillStyle = '#7ef0ff'; g.fillRect(22, -4, 6, 8);
    g.restore();
    g.fillStyle = '#c7f6ff'; g.beginPath(); g.arc(tw.x, tw.y, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0b4f5c'; g.beginPath(); g.arc(tw.x - 2, tw.y - 2, 4, 0, Math.PI * 2); g.fill();
  }
  // a beetle: shell, head, six legs that scuttle while it walks
  function drawBug(x, y, ang, now, s, walking) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
    var leg = walking ? Math.sin(now / 70) * 4 : Math.sin(now / 400) * 1.5;
    g.strokeStyle = C.bug; g.lineWidth = 2.2;
    for (var i = -1; i <= 1; i++) { var o = i * 6, l = (i % 2 ? leg : -leg); g.beginPath(); g.moveTo(o, -6); g.lineTo(o + l, -15); g.stroke(); g.beginPath(); g.moveTo(o, 6); g.lineTo(o - l, 15); g.stroke(); }
    g.fillStyle = s > 1.4 ? C.boss : C.bugShell; g.beginPath(); g.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-12, 0); g.lineTo(11, 0); g.stroke();
    g.fillStyle = s > 1.4 ? '#c49be8' : C.bugShell2; g.beginPath(); g.arc(-4, -4, 2.5, 0, Math.PI * 2); g.arc(3, 4, 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.bug; g.beginPath(); g.arc(13, 0, 6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = C.bug; g.lineWidth = 1.5; g.beginPath(); g.moveTo(17, -3); g.lineTo(23, -8); g.moveTo(17, 3); g.lineTo(23, 8); g.stroke();
    g.restore();
  }
  function round(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  return { init: init, wave: wave, send: send, progress: progress, hold: hold, go: go, squash: squash, breach: breach, state: st };
})();
