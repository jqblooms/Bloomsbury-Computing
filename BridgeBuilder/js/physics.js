// Data Bridge: levels, prices, the build rules and the truss physics. No DOM, so tools/test_bridge_builder.mjs
// runs it in node. World units are metres, tonnes and kilonewtons, y points UP, the cliff tops are at y = 0.
// Physics: position based (XPBD) beams as stiff springs, many small substeps with one solve each, axial damping,
// a fixed time step. A beam's force is EA * strain; it snaps when its smoothed force passes its strength.
(function (root) {
  'use strict';

  var WORLD_W = 32, Y_MIN = -11, Y_MAX = 6, MAX_LEN = 4.5, MID = WORLD_W / 2;
  var G = 9.8, FPS = 60, SUB = 24;

  var MATS = {
    road:  { name: 'Road',  price: 5,  ea: 3.0e4, strength: 50,  density: 0.10 },
    wood:  { name: 'Wood',  price: 3,  ea: 2.0e4, strength: 44,  density: 0.05 },
    steel: { name: 'Steel', price: 7,  ea: 6.0e4, strength: 120, density: 0.08 }
  };
  var MAT_ORDER = ['road', 'wood', 'steel'];

  // Each round: the gap, the anchors on each cliff (dx back from the edge, y), the truck's mass in tonnes and the
  // coins a full-marks exam round pays. Later rounds: wider, fewer anchors, heavier trucks.
  var LEVELS = [
    { gap: 6,  truck: 1.5, pool: 100, anchors: [[0, 0], [0, -2], [0, -4]] },
    { gap: 8,  truck: 2, pool: 130, anchors: [[0, 0], [0, -2], [0, -4]] },
    { gap: 8,  truck: 2.5, pool: 140, anchors: [[0, 0], [0, -3]] },
    { gap: 10, truck: 3, pool: 190, anchors: [[0, 0], [0, -3]] },
    { gap: 10, truck: 3, pool: 200, anchors: [[0, 0], [0, -2]] },
    { gap: 12, truck: 3.5, pool: 330, anchors: [[0, 0], [-2, 0]] },
    { gap: 12, truck: 3.5, pool: 340, anchors: [[0, 0], [-3, 0]] },
    { gap: 14, truck: 4, pool: 400, anchors: [[0, 0], [-2, 0]] },
    { gap: 14, truck: 4, pool: 410, anchors: [[0, 0]] },
    { gap: 16, truck: 4.5, pool: 460, anchors: [[0, 0]] }
  ];

  function level(n, custom) {
    var d = custom || LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
    var L = MID - d.gap / 2, R = MID + d.gap / 2, anchors = [];
    d.anchors.forEach(function (a) {
      anchors.push({ x: L + a[0], y: a[1] });
      anchors.push({ x: R - a[0], y: a[1] });
    });
    return { n: n, gap: d.gap, L: L, R: R, truck: d.truck, pool: d.pool || 0, anchors: anchors };
  }

  // ---------------------------------------------------------------- build rules
  function isAnchor(lv, x, y) { return lv.anchors.some(function (a) { return a.x === x && a.y === y; }); }
  function inRock(lv, x, y) { return y < 0.001 && (x < lv.L + 0.001 || x > lv.R - 0.001); }
  function pointOk(lv, x, y) {
    if (x < 0 || x > WORLD_W || y < Y_MIN || y > Y_MAX) return false;
    return isAnchor(lv, x, y) || !inRock(lv, x, y);
  }
  function blen(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }
  function beamCost(mat, a, b) { return Math.max(1, Math.round(blen(a, b) * MATS[mat].price)); }
  function designCost(d) {
    return d.beams.reduce(function (s, bm) { return s + beamCost(bm.mat, d.nodes[bm.a], d.nodes[bm.b]); }, 0);
  }
  // Why a beam from a to b ({x, y} grid points) cannot be built, or '' when it can.
  function beamProblem(lv, d, a, b) {
    if (a.x === b.x && a.y === b.y) return 'Pick a different point.';
    if (!pointOk(lv, a.x, a.y) || !pointOk(lv, b.x, b.y)) return 'You cannot build inside the server rack.';
    if (blen(a, b) > MAX_LEN + 1e-6) return 'Too long. A beam can be at most ' + MAX_LEN + ' squares long.';
    for (var k = 1; k < 20; k++) {
      var t = k / 20, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (y < -0.05 && (x < lv.L - 0.05 || x > lv.R + 0.05)) return 'A beam cannot go through the server rack.';
    }
    var ia = findNode(d, a.x, a.y), ib = findNode(d, b.x, b.y);
    if (ia >= 0 && ib >= 0 && d.beams.some(function (bm) { return (bm.a === ia && bm.b === ib) || (bm.a === ib && bm.b === ia); })) return 'There is already a beam there.';
    return '';
  }
  function findNode(d, x, y) {
    for (var i = 0; i < d.nodes.length; i++) if (d.nodes[i].x === x && d.nodes[i].y === y) return i;
    return -1;
  }
  function emptyDesign(lv) { return { nodes: lv.anchors.map(function (a) { return { x: a.x, y: a.y, fixed: true }; }), beams: [] }; }
  function addBeam(d, a, b, mat) {
    var ia = findNode(d, a.x, a.y); if (ia < 0) { d.nodes.push({ x: a.x, y: a.y, fixed: false }); ia = d.nodes.length - 1; }
    var ib = findNode(d, b.x, b.y); if (ib < 0) { d.nodes.push({ x: b.x, y: b.y, fixed: false }); ib = d.nodes.length - 1; }
    d.beams.push({ a: ia, b: ib, mat: mat });
    return d.beams.length - 1;
  }
  // Removes beam i, then any loose node no beam uses (anchors stay).
  function removeBeam(d, i) {
    d.beams.splice(i, 1);
    for (var n = d.nodes.length - 1; n >= 0; n--) {
      if (d.nodes[n].fixed) continue;
      if (d.beams.some(function (bm) { return bm.a === n || bm.b === n; })) continue;
      d.nodes.splice(n, 1);
      d.beams.forEach(function (bm) { if (bm.a > n) bm.a--; if (bm.b > n) bm.b--; });
    }
  }

  // ---------------------------------------------------------------- simulation
  // A road piece also bends under a wheel: moment = force * t(1 - t) * length. Long road pieces need support.
  var ROAD_BEND = 14;
  var WHEEL_R = 0.45, AXLE = 2.4, DRIVE = 3.2, TRACTION = 7, START_AT = 1.2;

  function makeSim(lv, d) {
    var P = d.nodes.map(function (n) { return { x: n.x, y: n.y, px: n.x, py: n.y, vx: 0, vy: 0, m: 0.04, w: 0, fixed: !!n.fixed }; });
    var B = d.beams.map(function (bm) {
      var a = P[bm.a], b = P[bm.b], L = blen(a, b), M = MATS[bm.mat];
      a.m += M.density * L / 2; b.m += M.density * L / 2;
      return { a: bm.a, b: bm.b, mat: bm.mat, rest: L, ea: M.ea, str: M.strength, f: 0, fs: 0, load: 0, ms: 0, stress: 0, broken: false };
    });
    P.forEach(function (p) { p.w = p.fixed ? 0 : 1 / p.m; });
    var x0 = 1.5, wm = lv.truck / 2;
    var w0 = { x: x0, y: WHEEL_R, px: x0, py: WHEEL_R, vx: 0, vy: 0, m: wm, w: 1 / wm, wheel: true, contact: null };
    var w1 = { x: x0 + AXLE, y: WHEEL_R, px: x0 + AXLE, py: WHEEL_R, vx: 0, vy: 0, m: wm, w: 1 / wm, wheel: true, contact: null };
    P.push(w0, w1);
    return { lv: lv, P: P, B: B, wheels: [P.length - 2, P.length - 1], t: 0, state: 'run', breakAt: -1, firstBreak: -1, maxStress: 0 };
  }

  function solveBeam(s, bm, h2) {
    var a = s.P[bm.a], b = s.P[bm.b], w = a.w + b.w;
    if (!w) return;
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1e-9;
    var C = L - bm.rest, alpha = bm.rest / bm.ea / h2;
    var dl = -C / (w + alpha), nx = dx / L, ny = dy / L;
    a.x -= nx * dl * a.w; a.y -= ny * dl * a.w;
    b.x += nx * dl * b.w; b.y += ny * dl * b.w;
  }

  // The wheel against the cliff tops (rectangles) and the unbroken road beams.
  function contactWheel(s, wi) {
    var p = s.P[wi], lv = s.lv, best = null;
    p.contact = null;
    [[-20, lv.L], [lv.R, WORLD_W + 20]].forEach(function (r) {
      var cx = Math.max(r[0], Math.min(r[1], p.x)), cy = Math.max(-40, Math.min(0, p.y));
      var dx = p.x - cx, dy = p.y - cy, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < WHEEL_R && dist > 1e-9) {
        var pen = WHEEL_R - dist; p.x += dx / dist * pen; p.y += dy / dist * pen;
        best = { nx: dx / dist, ny: dy / dist };
      }
    });
    for (var i = 0; i < s.B.length; i++) {
      var bm = s.B[i];
      if (bm.broken || bm.mat !== 'road') continue;
      var a = s.P[bm.a], b = s.P[bm.b];
      var ex = b.x - a.x, ey = b.y - a.y, ll = ex * ex + ey * ey;
      if (!ll) continue;
      var t = Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.y - a.y) * ey) / ll));
      var qx = a.x + ex * t, qy = a.y + ey * t, dx = p.x - qx, dy = p.y - qy, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= WHEEL_R || dist < 1e-9) continue;
      // only from above: the wheel centre must be on the upper side of the beam
      var side = ex * (p.y - a.y) - ey * (p.x - a.x);
      if ((ex >= 0 ? side : -side) < 0 && t > 0 && t < 1) continue;
      var nx = dx / dist, ny = dy / dist, C = dist - WHEEL_R;
      var wa = a.w * (1 - t) * (1 - t), wb = b.w * t * t, wsum = p.w + wa + wb;
      var lam = -C / wsum;
      bm.load += Math.abs(lam) / s.h2 * t * (1 - t) * bm.rest;
      p.x += nx * lam * p.w; p.y += ny * lam * p.w;
      a.x -= nx * lam * a.w * (1 - t); a.y -= ny * lam * a.w * (1 - t);
      b.x -= nx * lam * b.w * t; b.y -= ny * lam * b.w * t;
      if (!best || ny > best.ny) best = { nx: nx, ny: ny };
    }
    p.contact = best;
  }

  function substep(s, h) {
    var P = s.P, B = s.B, g = G * Math.min(1, s.t / 0.6), i;
    for (i = 0; i < P.length; i++) {
      var p = P[i];
      if (!p.w) continue;
      p.vy -= g * h;
      p.px = p.x; p.py = p.y;
      p.x += p.vx * h; p.y += p.vy * h;
    }
    var h2 = h * h;
    s.h2 = h2;
    for (i = 0; i < B.length; i++) B[i].load = 0;
    for (i = 0; i < B.length; i++) if (!B[i].broken) solveBeam(s, B[i], h2);
    var w0 = P[s.wheels[0]], w1 = P[s.wheels[1]];
    solveBeam(s, { a: s.wheels[0], b: s.wheels[1], rest: AXLE, ea: 1e9 }, h2);
    contactWheel(s, s.wheels[0]); contactWheel(s, s.wheels[1]);
    for (i = 0; i < P.length; i++) {
      var q = P[i];
      if (!q.w) continue;
      q.vx = (q.x - q.px) / h; q.vy = (q.y - q.py) / h;
    }
    // axial damping on each beam
    for (i = 0; i < B.length; i++) {
      var bm = B[i]; if (bm.broken) continue;
      bm.ms += (bm.load - bm.ms) * 0.08;
      var a = P[bm.a], b = P[bm.b], w = a.w + b.w; if (!w) continue;
      var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1e-9, nx = dx / L, ny = dy / L;
      var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny, imp = rel * 0.35 / w;
      a.vx += nx * imp * a.w; a.vy += ny * imp * a.w; b.vx -= nx * imp * b.w; b.vy -= ny * imp * b.w;
      bm.f = bm.ea * (L - bm.rest) / bm.rest;
      bm.fs += (bm.f - bm.fs) * 0.08;
    }
    for (i = 0; i < P.length; i++) { if (P[i].w && !P[i].wheel) { P[i].vx *= 0.9995; P[i].vy *= 0.9995; } }
    // the truck drives once the bridge has settled
    var go = s.t > START_AT && s.state === 'run';
    [w0, w1].forEach(function (p) {
      if (!p.contact) return;
      var tx = p.contact.ny, ty = -p.contact.nx, vt = p.vx * tx + p.vy * ty;
      var want = go ? DRIVE : 0, dv = Math.max(-TRACTION * h, Math.min(TRACTION * h, want - vt));
      p.vx += tx * dv; p.vy += ty * dv;
    });
    s.t += h;
  }

  // One fixed step of 1/60 s. s.state: run, breaking (a beam snapped; game over shortly), won, broke, fell, stuck.
  function step(s) {
    if (s.state === 'won' || s.state === 'broke' || s.state === 'fell' || s.state === 'stuck') return s.state;
    var h = 1 / FPS / SUB;
    for (var k = 0; k < SUB; k++) {
      substep(s, h);
      for (var i = 0; i < s.B.length; i++) {
        var bm = s.B[i]; if (bm.broken) continue;
        bm.stress = Math.max(Math.abs(bm.fs) / bm.str, bm.mat === 'road' ? bm.ms / ROAD_BEND : 0);
        if (bm.stress > s.maxStress) s.maxStress = bm.stress;
        if (bm.stress > 1) { bm.broken = true; if (s.firstBreak < 0) s.firstBreak = i; if (s.breakAt < 0) s.breakAt = s.t; }
      }
    }
    var w0 = s.P[s.wheels[0]], w1 = s.P[s.wheels[1]];
    if (s.breakAt >= 0) { s.state = 'breaking'; if (s.t - s.breakAt > 2.2 || Math.min(w0.y, w1.y) < -9) s.state = 'broke'; return s.state; }
    if (Math.min(w0.y, w1.y) < -9) s.state = 'fell';
    else if (Math.min(w0.x, w1.x) > s.lv.R + 1.2 && Math.min(w0.y, w1.y) > -0.3) s.state = 'won';
    else if (s.t > 45) s.state = 'stuck';
    return s.state;
  }

  function run(s, maxSeconds) {
    var n = Math.ceil((maxSeconds || 60) * FPS);
    for (var i = 0; i < n; i++) { step(s); if (s.state !== 'run' && s.state !== 'breaking') break; }
    return s.state;
  }

  // ---------------------------------------------------------------- game progression (pure, so it can be tested)
  // A crossing keeps the leftover coins and moves to the next round's exam; anything else is game over: round 1, 0 coins.
  function afterTest(game, state, spent) {
    if (state === 'won') {
      game.coins = Math.max(0, game.coins - spent);
      game.best = Math.max(game.best || 0, game.round);
      game.crossed = (game.crossed || 0) + 1;
      if (game.round >= LEVELS.length) { game.phase = 'won'; return game; }
      game.round++; game.phase = 'exam'; game.design = null; game.exam = null;
      return game;
    }
    game.over = { round: game.round, why: state };
    game.round = 1; game.coins = 0; game.phase = 'over'; game.design = null; game.exam = null;
    return game;
  }

  root.BBPhys = {
    WORLD_W: WORLD_W, Y_MIN: Y_MIN, Y_MAX: Y_MAX, MAX_LEN: MAX_LEN, MATS: MATS, MAT_ORDER: MAT_ORDER, LEVELS: LEVELS,
    WHEEL_R: WHEEL_R, AXLE: AXLE, FPS: FPS,
    level: level, pointOk: pointOk, isAnchor: isAnchor, beamProblem: beamProblem, beamCost: beamCost, designCost: designCost,
    blen: blen, findNode: findNode, emptyDesign: emptyDesign, addBeam: addBeam, removeBeam: removeBeam,
    makeSim: makeSim, step: step, run: run, afterTest: afterTest
  };
})(typeof window !== 'undefined' ? window : globalThis);
