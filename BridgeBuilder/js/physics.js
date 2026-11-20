// Data Bridge: levels, prices, the build rules and the truss physics. No DOM, so tools/test_bridge_builder.mjs
// runs it in node. World units are metres, tonnes and kilonewtons, y points UP; each round has its own terrain.
// Physics: position based (XPBD) beams as stiff springs, many small substeps with one solve each, axial damping,
// a fixed time step. A beam's force is EA * strain; it snaps when its smoothed force passes its strength.
(function (root) {
  'use strict';

  var WORLD_W = 32, Y_MIN = -11, Y_MAX = 6, MAX_LEN = 4.5, MID = WORLD_W / 2;
  var G = 9.8, FPS = 60, SUB = 24;

  var MATS = {
    road:  { name: 'Road',  price: 5,  ea: 3.0e4, strength: 80,  density: 0.10 },
    wood:  { name: 'Wood',  price: 3,  ea: 2.0e4, strength: 70,  density: 0.05 },
    steel: { name: 'Steel', price: 7,  ea: 6.0e4, strength: 192, density: 0.08 }
  };
  var MAT_ORDER = ['road', 'wood', 'steel'];

  // Each round has its own terrain. ground: solid polygons ([x, y] corners; they run well past the board's edges
  // and down to y = -40). anchors: gold points on the terrain. start: the rear wheel's spot on the ground; goal: the
  // truck has crossed when both wheels pass goal.x on the far side. truck: tonnes; pool: coins for a full-marks
  // exam round. theme: the scenery colours (see game.js). intro: the one line shown before building.
  var DEEP = -40, BACK = -30, FAR = 62;
  function cliffL(edge, top, face) {        // solid from the far left to the edge; face: corners down the wall
    var f = face || [], last = f.length ? f[f.length - 1][0] : edge;
    return [[BACK, DEEP], [BACK, top], [edge, top]].concat(f, [[last, DEEP]]);
  }
  function cliffR(edge, top, face) {
    var f = face || [], last = f.length ? f[f.length - 1][0] : edge;
    return [[FAR, DEEP], [FAR, top], [edge, top]].concat(f, [[last, DEEP]]);
  }
  var LEVELS = [
    { name: 'Short hop', theme: 0, truck: 1.5, pool: 120,
      intro: 'a short gap. Join the two sides with Road, then hold it up from below.',
      ground: [cliffL(13, 0), cliffR(19, 0)],
      anchors: [[13, 0], [13, -2], [19, 0], [19, -2]], start: [1.5, 0], goal: [21, 0] },
    { name: 'Wide gap', theme: 1, truck: 2.5, pool: 205,
      intro: 'a wider gap. One long road sags, so build triangles under it or over it.',
      ground: [cliffL(11, 0), cliffR(21, 0)],
      anchors: [[11, 0], [11, -3], [21, 0], [21, -3]], start: [1.5, 0], goal: [23, 0] },
    { name: 'Uphill', theme: 2, truck: 2.5, pool: 180,
      intro: 'the far side is higher. Build a road that climbs.',
      ground: [cliffL(12, 0), cliffR(20, 4)],
      anchors: [[12, 0], [12, -3], [20, 4], [20, 1]], start: [1.5, 0], goal: [22, 4] },
    { name: 'Downhill', theme: 3, truck: 3, pool: 250,
      intro: 'the far side is lower. Build a road that goes down.',
      ground: [[[BACK, DEEP], [BACK, 3], [6, 3], [10, 2], [10, DEEP]], cliffR(20, -3)],
      anchors: [[10, 2], [10, -1], [20, -3], [20, -5]], start: [1.5, 3], goal: [22, -3] },
    { name: 'Rock in the middle', theme: 4, truck: 3, pool: 215,
      intro: 'a rock stands in the gap. Build onto it to split one long bridge into two short ones.',
      ground: [cliffL(9, 0), cliffR(23, 0), [[14, DEEP], [14, -6], [15, -2], [17, -2], [18, -6], [18, DEEP]]],
      anchors: [[9, 0], [9, -2], [23, 0], [23, -2], [15, -2], [17, -2]], start: [1.5, 0], goal: [25, 0] },
    { name: 'Deep ledges', theme: 5, truck: 3.5, pool: 265,
      intro: 'the anchors are deep in the gap. An arch underneath can push the road up.',
      ground: [cliffL(10, 0, [[10, -5], [12, -5]]), cliffR(22, 0, [[22, -5], [20, -5]])],
      anchors: [[10, 0], [12, -5], [22, 0], [20, -5]], start: [1.5, 0], goal: [24, 0] },
    { name: 'Server roof', theme: 1, truck: 3.5, pool: 360,
      intro: 'nothing to stand on below, but there are anchors in the roof. Hang the road, or build a truss on top.',
      ground: [cliffL(10, 0), cliffR(22, 0), [[BACK, 4], [11, 4], [11, 9], [BACK, 9]], [[FAR, 4], [21, 4], [21, 9], [FAR, 9]]],
      anchors: [[10, 0], [22, 0], [11, 4], [21, 4]], start: [1.5, 0], goal: [24, 0] },
    { name: 'Island', theme: 2, truck: 4, pool: 265,
      intro: 'an island in the middle. Build two bridges, one to the island and one off it.',
      ground: [cliffL(8, 0), cliffR(24, 0), [[13, DEEP], [13, -4], [14, 0], [18, 0], [19, -4], [19, DEEP]]],
      anchors: [[8, 0], [8, -2], [14, 0], [18, 0], [24, 0], [24, -2]], start: [1.5, 0], goal: [26, 0] },
    { name: 'Long gap', theme: 3, truck: 4.5, pool: 565,
      intro: 'a long gap with only one anchor on each side. You need a strong truss the whole way.',
      ground: [cliffL(8, 0), cliffR(24, 0)],
      anchors: [[8, 0], [24, 0]], start: [1.5, 0], goal: [26, 0] },
    { name: 'Final climb', theme: 5, truck: 4, pool: 370,
      intro: 'the last one: a long gap, a deep rock and a hill on the far side. Use everything you have learned.',
      ground: [cliffL(8, 0), [[FAR, DEEP], [FAR, 2], [26, 2], [22, 0], [22, DEEP]], [[15, DEEP], [15, -5], [16, -3], [18, -3], [19, -5], [19, DEEP]]],
      anchors: [[8, 0], [8, -2], [16, -3], [18, -3], [22, 0], [22, -2]], start: [1.5, 0], goal: [28, 2] }
  ];

  // Level packs (James 2026-11-20: 60 rounds). js/levels/pack-K.js sets BBLevelPacks[K] = { levels: fn(T), sound:
  // fn(H), flimsy: fn(H) }; pack 2 is rounds 11 to 20, pack 3 is 21 to 30 and so on. Packs are added in order and
  // stop at the first missing one, so round numbers never shift. See BridgeBuilder/LEVEL-PACKS.md.
  var TERRAIN = { cliffL: cliffL, cliffR: cliffR, DEEP: DEEP, BACK: BACK, FAR: FAR, WORLD_W: WORLD_W, Y_MIN: Y_MIN, Y_MAX: Y_MAX, MAX_LEN: MAX_LEN };
  var PACKS = root.BBLevelPacks || {};
  for (var pk = 2; PACKS[pk]; pk++) LEVELS = LEVELS.concat(PACKS[pk].levels(TERRAIN));

  function bbox(poly) {
    var b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
    poly.forEach(function (p) { b.x0 = Math.min(b.x0, p[0]); b.x1 = Math.max(b.x1, p[0]); b.y0 = Math.min(b.y0, p[1]); b.y1 = Math.max(b.y1, p[1]); });
    return b;
  }
  // n: round number. custom: a level object for tests; the old { gap, anchors: [[dx back, y]] } form still works.
  function level(n, custom) {
    var d = custom || LEVELS[Math.max(0, Math.min(LEVELS.length - 1, n - 1))];
    if (!d.ground) {   // the old two-cliff form: flat tops at y = 0, anchors mirrored
      var l = MID - d.gap / 2, r = MID + d.gap / 2, an = [];
      d.anchors.forEach(function (a) { an.push([l + a[0], a[1]]); an.push([r - a[0], a[1]]); });
      d = { name: 'Test', theme: 0, truck: d.truck, pool: d.pool || 0, intro: '', ground: [cliffL(l, 0), cliffR(r, 0)],
        anchors: an, start: [1.5, 0], goal: [r + 1.2, 0] };
    }
    var ground = d.ground.map(function (poly) { return { pts: poly, box: bbox(poly) }; });
    var lowTop = Math.min.apply(null, ground.map(function (g) { return g.box.y1; }));
    var anchors = d.anchors.map(function (a) { return { x: a[0], y: a[1] }; });
    var near = anchors.filter(function (a) { return a.y === d.start[1] && a.x > d.start[0]; }).map(function (a) { return a.x; });
    var far = anchors.filter(function (a) { return a.y === d.goal[1] && a.x < d.goal[0]; }).map(function (a) { return a.x; });
    return { n: n, name: d.name, intro: d.intro, theme: d.theme || 0, truck: d.truck, pool: d.pool || 0, ground: ground, anchors: anchors,
      start: { x: d.start[0], y: d.start[1] }, goal: { x: d.goal[0], y: d.goal[1] },
      fallY: Math.min(-9, lowTop - 2),
      // the first gap edge (the start side) and the last one, for art and simple tests
      L: near.length ? Math.min.apply(null, near) : d.start[0] + 4, R: far.length ? Math.max.apply(null, far) : d.goal[0] - 2 };
  }

  // ---------------------------------------------------------------- terrain geometry
  function insidePoly(pts, x, y) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  // The nearest point on the polygon's outline to (x, y), with the squared distance to it.
  function nearestEdge(pts, x, y) {
    var best = { x: 0, y: 0, d2: 1e18 };
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var ax = pts[j][0], ay = pts[j][1], ex = pts[i][0] - ax, ey = pts[i][1] - ay, ll = ex * ex + ey * ey;
      var t = ll ? Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / ll)) : 0;
      var qx = ax + ex * t, qy = ay + ey * t, d2 = (x - qx) * (x - qx) + (y - qy) * (y - qy);
      if (d2 < best.d2) best = { x: qx, y: qy, d2: d2 };
    }
    return best;
  }
  // Is (x, y) inside the terrain by more than margin? (margin 0: on the outline counts as outside)
  function solidAt(lv, x, y, margin) {
    for (var i = 0; i < lv.ground.length; i++) {
      var g = lv.ground[i], b = g.box;
      if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue;
      if (insidePoly(g.pts, x, y) && nearestEdge(g.pts, x, y).d2 > margin * margin) return true;
    }
    return false;
  }
  // Is (x, y) on the outline of the terrain (within tol)?
  function onGround(lv, x, y, tol) {
    return lv.ground.some(function (g) { return nearestEdge(g.pts, x, y).d2 <= tol * tol; });
  }

  // ---------------------------------------------------------------- build rules
  function isAnchor(lv, x, y) { return lv.anchors.some(function (a) { return a.x === x && a.y === y; }); }
  // Points on or inside the terrain cannot hold a new joint (anchors can).
  function inRock(lv, x, y) { return solidAt(lv, x, y, 0) || onGround(lv, x, y, 0.001); }
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
    for (var k = 1; k < 40; k++) {
      var t = k / 40;
      if (solidAt(lv, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0.05)) return 'A beam cannot go through the server rack.';
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
  var ROAD_BEND = 18, IMPACT = 2;
  var WHEEL_R = 0.45, AXLE = 2.4, DRIVE = 3.2, TRACTION = 7, START_AT = 1.2;

  function makeSim(lv, d) {
    var P = d.nodes.map(function (n) { return { x: n.x, y: n.y, px: n.x, py: n.y, vx: 0, vy: 0, m: 0.04, w: 0, fixed: !!n.fixed }; });
    var B = d.beams.map(function (bm) {
      var a = P[bm.a], b = P[bm.b], L = blen(a, b), M = MATS[bm.mat];
      a.m += M.density * L / 2; b.m += M.density * L / 2;
      return { a: bm.a, b: bm.b, mat: bm.mat, rest: L, ea: M.ea, str: M.strength, f: 0, fs: 0, load: 0, ms: 0, stress: 0, broken: false };
    });
    P.forEach(function (p) { p.w = p.fixed ? 0 : 1 / p.m; });
    var x0 = lv.start.x, y0 = lv.start.y + WHEEL_R, wm = lv.truck / 2;
    var w0 = { x: x0, y: y0, px: x0, py: y0, vx: 0, vy: 0, m: wm, w: 1 / wm, wheel: true, contact: null };
    var w1 = { x: x0 + AXLE, y: y0, px: x0 + AXLE, py: y0, vx: 0, vy: 0, m: wm, w: 1 / wm, wheel: true, contact: null };
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

  // The wheel against the terrain polygons and the unbroken road beams.
  function contactWheel(s, wi) {
    var p = s.P[wi], lv = s.lv, best = null;
    p.contact = null;
    lv.ground.forEach(function (gr) {
      var b = gr.box;
      if (p.x < b.x0 - WHEEL_R || p.x > b.x1 + WHEEL_R || p.y < b.y0 - WHEEL_R || p.y > b.y1 + WHEEL_R) return;
      var q = nearestEdge(gr.pts, p.x, p.y), dist = Math.sqrt(q.d2), inside = insidePoly(gr.pts, p.x, p.y);
      if (!inside && (dist >= WHEEL_R || dist < 1e-9)) return;
      var nx = (p.x - q.x) / (dist || 1), ny = (p.y - q.y) / (dist || 1);
      if (inside) { nx = -nx; ny = -ny; }
      var pen = inside ? WHEEL_R + dist : WHEEL_R - dist;
      p.x += nx * pen; p.y += ny * pen;
      if (!best || ny > best.ny) best = { nx: nx, ny: ny };
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
      // the bending load: the contact force, capped so the jolt where a slope starts acts like a tyre, not a hammer
      bm.load += Math.min(Math.abs(lam) / s.h2, IMPACT * p.m * G) * t * (1 - t) * bm.rest;
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

  // One fixed step of 1/60 s. s.state: run, breaking (a beam snapped; the round is lost shortly), won, broke, fell, stuck.
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
    var lv = s.lv, low = Math.min(w0.y, w1.y);
    if (s.breakAt >= 0) { s.state = 'breaking'; if (s.t - s.breakAt > 2.2 || low < lv.fallY) s.state = 'broke'; return s.state; }
    if (low < lv.fallY) s.state = 'fell';
    else if (Math.min(w0.x, w1.x) > lv.goal.x && low > lv.goal.y - 0.3) s.state = 'won';
    else if (s.t > 45) s.state = 'stuck';
    return s.state;
  }

  function run(s, maxSeconds) {
    var n = Math.ceil((maxSeconds || 60) * FPS);
    for (var i = 0; i < n; i++) { step(s); if (s.state !== 'run' && s.state !== 'breaking') break; }
    return s.state;
  }

  // ---------------------------------------------------------------- game progression (pure, so it can be tested)
  // A crossing keeps the leftover coins and moves to the next round's exam. Anything else keeps the same round: the
  // failed bridge's coins are spent, the leftover is kept (at most this round's pool, so failing on purpose cannot
  // pile up coins) and the student goes back to an exam round for that round, then rebuilds.
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
    game.coins = Math.min(Math.max(0, game.coins - spent), level(game.round).pool);
    game.phase = 'exam'; game.design = null; game.exam = null;
    return game;
  }

  root.BBPhys = {
    WORLD_W: WORLD_W, Y_MIN: Y_MIN, Y_MAX: Y_MAX, MAX_LEN: MAX_LEN, MATS: MATS, MAT_ORDER: MAT_ORDER, LEVELS: LEVELS,
    WHEEL_R: WHEEL_R, AXLE: AXLE, FPS: FPS, TERRAIN: TERRAIN,
    level: level, solidAt: solidAt, onGround: onGround, pointOk: pointOk, isAnchor: isAnchor, beamProblem: beamProblem, beamCost: beamCost, designCost: designCost,
    blen: blen, findNode: findNode, emptyDesign: emptyDesign, addBeam: addBeam, removeBeam: removeBeam,
    makeSim: makeSim, step: step, run: run, afterTest: afterTest
  };
})(typeof window !== 'undefined' ? window : globalThis);
