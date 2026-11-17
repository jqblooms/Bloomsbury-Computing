// Circuit Siege simulation: one wave, stepped one frame (1/35 s) at a time. No DOM, so node can run it.
// Enemies and projectiles are pooled to keep school laptops smooth with hundreds of bugs.
(function (root) {
  'use strict';
  var D = root.CSData || (typeof require !== 'undefined' ? require('./data.js') : null);
  var E = D.ENEMIES, T = D.TOWERS;

  // ---------------------------------------------------------------- path
  var SEG = [], PATH_LEN = 0, WAY = [];
  (function () {
    var p = D.PATH;
    for (var i = 1; i < p.length; i++) {
      var dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1], len = Math.sqrt(dx * dx + dy * dy);
      SEG.push({ x: p[i - 1][0], y: p[i - 1][1], dx: dx / len, dy: dy / len, len: len, at: PATH_LEN });
      WAY.push(PATH_LEN);
      PATH_LEN += len;
    }
  })();
  function place(o, d) {
    var s = SEG[SEG.length - 1];
    for (var i = 0; i < SEG.length; i++) if (d <= SEG[i].at + SEG[i].len) { s = SEG[i]; break; }
    var k = d - s.at;
    o.x = s.x + s.dx * k; o.y = s.y + s.dy * k; o.dir = Math.atan2(s.dy, s.dx);
  }
  // nearest point on the track: returns distance from the track and sets out.d (distance along it)
  function nearest(x, y, out) {
    var best = 1e9, bd = 0;
    for (var i = 0; i < SEG.length; i++) {
      var s = SEG[i], k = Math.max(0, Math.min(s.len, (x - s.x) * s.dx + (y - s.y) * s.dy));
      var px = s.x + s.dx * k, py = s.y + s.dy * k, dd = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      if (dd < best) { best = dd; bd = s.at + k; }
    }
    if (out) out.d = bd;
    return best;
  }
  function inWater(x, y, pad) {
    pad = pad || 0;
    for (var i = 0; i < D.WATER.length; i++) {
      var w = D.WATER[i];
      if (x >= w.x + pad && x <= w.x + w.w - pad && y >= w.y + pad && y <= w.y + w.h - pad) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- seeded random
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ---------------------------------------------------------------- world
  function create(o) {
    var w = {
      n: o.n, diff: o.diff, towers: o.towers, items: o.items, frame: 0, rnd: rng(o.seed || (o.n * 7919 + 13)),
      queue: D.buildRound(o.n), qi: 0, gap: D.spawnGap(o.n), spawnT: 0, bonus: D.speedBonus(o.n, o.diff),
      enemies: [], epool: [], shots: [], spool: [], fx: [], fxpool: [],
      livesLost: 0, pops: 0, done: false, nextId: 1, mouse: o.mouse || { x: -1, y: -1, on: false },
      onNew: o.onNew || null, seen: o.seen || {}, dirty: true, stormCd: 0
    };
    return w;
  }

  // ---------------------------------------------------------------- enemies
  function addEnemy(w, type, d) {
    var e = w.epool.pop() || {};
    var def = E[type];
    e.t = type; e.def = def; e.id = w.nextId++; e.d = Math.max(0, d); e.hp = def.hits || 1; e.dead = false;
    e.frozen = 0; e.chill = false; e.chillOn = false; e.escaped = false; e.glue = 0; e.soak = false; e.corrode = 0; e.corT = 0; e.arctic = -9; e.r = def.r;
    place(e, e.d);
    w.enemies.push(e);
    if (!w.seen[type]) { w.seen[type] = 1; if (w.onNew) w.onNew(type); }
    return e;
  }
  function kill(w, e) { if (!e.dead) { e.dead = true; } }

  // Break layers off a bug. Returns nothing; children appear around it.
  function pop(w, e, layers, moab) {
    if (e.dead) return;
    var def = e.def;
    if (def.hits) {
      e.hp -= layers + (def.zep ? moab : 0);
      w.pops += 1;
      if (e.hp > 0) return;
      layers = 1;
    }
    w.pops += 1;
    fx(w, 'pop', e.x, e.y, e.r, def.rank);
    e.dead = true;
    var kids = def.kids, n = kids.length;
    for (var i = 0; i < n; i++) {
      var c = addEnemy(w, kids[i], e.d + (i - (n - 1) / 2) * 7);
      if (e.soak && e.glue > 0 && !c.def.noGlue) { c.glue = e.glue; c.soak = true; c.corrode = e.corrode; c.corT = e.corT; }
      if (i === 0 && layers > 1) pop(w, c, layers - 1, moab);
    }
  }

  // An attack meets a bug. Returns the pierce it uses up (0 = no effect).
  function hit(w, e, a) {
    var def = e.def;
    if (def.lead && !a.lead) return 5;
    if (e.frozen > 0 && !a.ice) return 1;
    if (a.blastHit && def.noBlast) return 0;
    pop(w, e, a.layers || 1, a.moab || 0);
    return 1;
  }

  function glueOn(e, a) {
    if (e.def.noGlue) return false;
    e.glue = a.glue; e.soak = !!a.soak; e.corrode = a.corrode || 0; e.corT = a.corrode || 0;
    return true;
  }

  function explode(w, x, y, R, pierce, a) {
    fx(w, 'boom', x, y, R, a.fire ? 1 : 0);
    var es = w.enemies;
    for (var i = 0; i < es.length && pierce > 0; i++) {
      var e = es[i];
      if (e.dead) continue;
      var dx = e.x - x, dy = e.y - y, rr = R + e.r;
      if (dx * dx + dy * dy > rr * rr) continue;
      if (a.glue) { if (glueOn(e, a)) pierce--; continue; }
      pierce -= hit(w, e, a);
    }
  }

  // ---------------------------------------------------------------- effects (pooled, renderer reads w.fx)
  function fx(w, k, x, y, r, c) {
    if (w.fx.length > 220) return;
    var f = w.fxpool.pop() || {};
    f.k = k; f.x = x; f.y = y; f.r = r; f.c = c; f.t = 0; f.max = k === 'boom' ? 9 : k === 'ring' ? 8 : 7; f.x2 = 0; f.y2 = 0;
    w.fx.push(f);
    return f;
  }

  // ---------------------------------------------------------------- projectiles
  // path 0 straight, 1 curve back to the tower, 2 mortar shell (lands after a delay)
  function shot(w, tw, s, x, y, ang) {
    var p = w.spool.pop() || { hits: [] };
    p.x = x; p.y = y; p.vx = Math.cos(ang) * (s.spd || 10); p.vy = Math.sin(ang) * (s.spd || 10); p.ang = ang;
    p.pierce = s.pierce; p.rad = s.rad || 4; p.path = 0; p.life = Math.ceil((s.range * 1.25 + 20) / (s.spd || 10));
    p.lead = !!s.lead; p.ice = !!s.ice; p.layers = s.layers || 1; p.moab = s.moab || 0; p.blast = s.blast || 0; p.blastHit = false;
    p.glue = s.glue || 0; p.soak = !!s.soak; p.corrode = s.corrode || 0; p.tornado = false; p.tempest = false; p.fire = false;
    p.look = s.look; p.hits.length = 0; p.dead = false; p.from = tw;
    w.shots.push(p);
    return p;
  }

  function stepShots(w) {
    var es = w.enemies, ss = w.shots;
    for (var i = 0; i < ss.length; i++) {
      var p = ss[i];
      if (p.dead) continue;
      if (p.path === 1) {
        p.th += p.dth;
        var c = Math.cos(p.th), sn = Math.sin(p.th);
        p.x = p.cx - p.ux * c * p.a - p.uy * sn * p.b;
        p.y = p.cy - p.uy * c * p.a + p.ux * sn * p.b;
        p.ang += 0.5;
        if (p.th >= Math.PI * 2) { p.dead = true; continue; }
      } else if (p.path === 2) {
        p.life--; p.x += p.vx; p.y += p.vy;
        if (p.life <= 0) {
          p.blastHit = true;
          explode(w, p.tx, p.ty, p.blast, p.pierce, p);
          p.dead = true;
        }
        continue;
      } else {
        p.x += p.vx; p.y += p.vy;
        if (--p.life <= 0 || p.x < -40 || p.y < -40 || p.x > D.W + 40 || p.y > D.H + 40) { p.dead = true; continue; }
      }
      for (var j = 0; j < es.length; j++) {
        var e = es[j];
        if (e.dead) continue;
        var dx = e.x - p.x, dy = e.y - p.y, rr = p.rad + e.r;
        if (dx * dx + dy * dy > rr * rr) continue;
        if (p.hits.indexOf(e.id) >= 0) continue;
        if (p.blast) {
          p.blastHit = true;
          explode(w, p.x, p.y, p.blast, p.pierce, p);
          p.dead = true; break;
        }
        p.hits.push(e.id);
        if (p.glue) { if (glueOn(e, p)) p.pierce--; else continue; }
        else if (p.tornado) {
          if (!e.def.zep && !e.def.lead) {
            var back = WAY[Math.floor(w.rnd() * WAY.length)];
            if (back < e.d) { e.d = back; place(e, e.d); }
            e.glue = 0; e.frozen = 0;
            if (p.tempest) pop(w, e, 1, 0);
          }
          p.pierce--;
        } else p.pierce -= hit(w, e, p);
        if (p.pierce <= 0) { p.dead = true; break; }
      }
    }
  }

  // ---------------------------------------------------------------- towers
  // Booster range/rate and stealth sight come from towers nearby; worked out when towers change.
  function refresh(w) {
    var ts = w.towers, i, j;
    for (i = 0; i < ts.length; i++) { ts[i].rm = 1; ts[i].fm = 1; ts[i].camo = false; }
    for (i = 0; i < ts.length; i++) {
      var a = ts[i], sa = D.stats(a.type, a.lv);
      if (a.type === 'hydro' && sa.auraCamo) a.camo = true;
      if (!(a.type === 'booster' || sa.auraCamo)) continue;
      var R = a.type === 'drone' ? sa.range : sa.range;
      for (j = 0; j < ts.length; j++) {
        if (i === j) continue;
        var b = ts[j], dx = b.x - a.x, dy = b.y - a.y;
        if (dx * dx + dy * dy > R * R) continue;
        if (a.type === 'booster') { b.rm = Math.max(b.rm, sa.auraRange); if (sa.auraRate) b.fm = Math.max(b.fm, sa.auraRate); }
        if (sa.auraCamo) b.camo = true;
      }
    }
    w.dirty = false;
  }

  function findTarget(w, tw, R, mode, prefer) {
    var es = w.enemies, best = null, bk = 0, R2 = R * R;
    for (var i = 0; i < es.length; i++) {
      var e = es[i];
      if (e.dead || (e.def.camo && !tw.camo)) continue;
      var dx = e.x - tw.x, dy = e.y - tw.y, rr = R + e.r;
      if (dx * dx + dy * dy > rr * rr) continue;
      var k = mode === 1 ? -e.d : mode === 2 ? e.def.rank * 1e5 + e.d : mode === 3 ? -e.def.rank * 1e5 + e.d : e.d;
      if (prefer && (e.glue > 0 || e.def.noGlue)) k -= 1e9;
      if (!best || k > bk) { best = e; bk = k; }
    }
    return best;
  }

  function stepTowers(w) {
    var ts = w.towers, es = w.enemies;
    for (var i = 0; i < ts.length; i++) {
      var tw = ts[i], def = T[tw.type], s = D.stats(tw.type, tw.lv);
      if (def.kind === 'item' || def.kind === 'farm') continue;
      var R = s.range * (tw.rm || 1);
      if (def.kind === 'aura') continue;
      if (def.kind === 'drone') {
        tw.pa = (tw.pa || 0) + 4 / 110;
        tw.px = tw.x + Math.cos(tw.pa) * 110; tw.py = tw.y + Math.sin(tw.pa) * 70;
      }
      if (def.kind === 'freeze' && s.arctic) {
        for (var a = 0; a < es.length; a++) {
          var ea = es[a]; if (ea.dead || ea.def.noFreeze) continue;
          var ax = ea.x - tw.x, ay = ea.y - tw.y, ar = R + ea.r;
          if (ax * ax + ay * ay <= ar * ar) ea.arctic = w.frame;
        }
      }
      tw.cd = (tw.cd || 0) - (tw.fm || 1);
      if (def.kind === 'printer') {
        if (s.storm) {
          tw.st = (tw.st || 0) - 1;
          if (tw.st <= 0) {
            tw.st = s.storm;
            for (var dd = 20; dd < PATH_LEN - 20; dd += 30) addItem(w, 'pinStorm', dd, s, 70);
          }
        }
        if (tw.cd > 0) continue;
        tw.cd += s.rate;
        var tries = 0, spot = { d: 0 };
        while (tries++ < 12) {
          var aa = w.rnd() * Math.PI * 2, rr = Math.sqrt(w.rnd()) * R;
          var gx = tw.x + Math.cos(aa) * rr, gy = tw.y + Math.sin(aa) * rr;
          if (nearest(gx, gy, spot) < D.TRACK / 2) { addItem(w, 'pile', spot.d, s, 0, tw); break; }
        }
        continue;
      }
      if (def.kind === 'cursor') {
        if (tw.cd > 0) continue;
        tw.cd += s.rate;
        var mx = w.mouse.on ? w.mouse.x : -1, my = w.mouse.y;
        if (mx < 0) { var ft = findTarget(w, tw, 9999, 0); if (!ft) continue; mx = ft.x; my = ft.y; }
        tw.ang = Math.atan2(my - tw.y, mx - tw.x);
        var big = { range: 900 };
        var p = shot(w, tw, s, tw.x + Math.cos(tw.ang) * 18, tw.y + Math.sin(tw.ang) * 18, tw.ang + (w.rnd() - 0.5) * 2 * s.scatter);
        p.life = Math.ceil(big.range / s.spd);
        continue;
      }
      if (tw.cd > 0) { if (def.kind !== 'drone' && def.kind !== 'ring' && def.kind !== 'freeze') { var tt = findTarget(w, tw, R, tw.tgt | 0); if (tt) tw.ang = Math.atan2(tt.y - tw.y, tt.x - tw.x); } continue; }
      if (tw.cd < 0) tw.cd = 0;
      if (def.kind === 'drone') {
        if (!es.length) continue;
        tw.cd += s.rate;
        for (var k = 0; k < s.n; k++) shot(w, tw, s, tw.px, tw.py, k * Math.PI * 2 / s.n + tw.pa);
        if (s.bombs) addItem(w, 'fuseAt', 0, T.fuse.base, 0, null, tw.px, tw.py);
        continue;
      }
      if (def.kind === 'mortar') {
        if (!es.length) continue;
        tw.cd += s.rate;
        var aim = tw.aim || { x: tw.x, y: tw.y };
        var sa = w.rnd() * Math.PI * 2, sr = w.rnd() * s.scatter;
        var m = shot(w, tw, s, tw.x, tw.y, 0);
        m.path = 2; m.life = s.delay; m.tx = aim.x + Math.cos(sa) * sr; m.ty = aim.y + Math.sin(sa) * sr;
        m.vx = (m.tx - tw.x) / s.delay; m.vy = (m.ty - tw.y) / s.delay;
        continue;
      }
      var tg = findTarget(w, tw, R, tw.tgt | 0, def.kind === 'shot' && s.glue);
      if (!tg) continue;
      tw.cd += s.rate;
      if (def.kind === 'freeze') {
        var left = s.pierce;
        for (var f = 0; f < es.length && left > 0; f++) {
          var ef = es[f]; if (ef.dead || ef.def.noFreeze) continue;
          var fx2 = ef.x - tw.x, fy = ef.y - tw.y, fr = R + ef.r;
          if (fx2 * fx2 + fy * fy > fr * fr) continue;
          left--;
          if (s.snap) {
            var before = w.enemies.length;
            pop(w, ef, 1, 0);
            for (var c = before; c < w.enemies.length; c++) freezeOne(w.enemies[c], s);
          } else freezeOne(ef, s);
        }
        fx(w, 'ring', tw.x, tw.y, R, 2);
        continue;
      }
      if (def.kind === 'ring') {
        if (s.fire) {
          fx(w, 'ring', tw.x, tw.y, R, 1);
          var lf = s.pierce;
          for (var r2 = 0; r2 < es.length && lf > 0; r2++) {
            var er = es[r2]; if (er.dead) continue;
            var rx = er.x - tw.x, ry = er.y - tw.y, rq = R + er.r;
            if (rx * rx + ry * ry <= rq * rq) lf -= hit(w, er, s);
          }
          continue;
        }
        for (var q = 0; q < s.n; q++) {
          var pq = shot(w, tw, s, tw.x, tw.y, q * Math.PI * 2 / s.n);
          pq.life = Math.ceil(R / s.spd);
        }
        continue;
      }
      tw.ang = Math.atan2(tg.y - tw.y, tg.x - tw.x);
      if (def.kind === 'boomer') {
        var bp = shot(w, tw, s, tw.x, tw.y, tw.ang);
        var dx = tg.x - tw.x, dy = tg.y - tw.y, dist = Math.max(30, Math.sqrt(dx * dx + dy * dy));
        bp.path = 1; bp.cx = tw.x + dx / 2; bp.cy = tw.y + dy / 2; bp.ux = dx / dist; bp.uy = dy / dist;
        bp.a = dist / 2; bp.b = dist * 0.35; bp.th = 0;
        bp.dth = s.spd / (Math.PI * (bp.a + bp.b));
        continue;
      }
      // straight shots (pulse, surge, lag, hydro, AI core, quantum)
      var nn = s.n || 1;
      for (var z = 0; z < nn; z++) {
        var off = nn > 1 ? (z - (nn - 1) / 2) * s.spread : 0;
        var sp = shot(w, tw, s, tw.x, tw.y, tw.ang + off);
        if (tw.type === 'aicore') {
          var spells = 1 + (s.fireball ? 1 : 0) + (s.tornado ? 1 : 0), pick = Math.floor(w.rnd() * spells);
          if (pick === 1 && s.fireball) { sp.blast = 30; sp.lead = true; sp.ice = true; sp.fire = true; sp.look = 'fire'; }
          else if (pick >= 1 && s.tornado) { sp.tornado = true; sp.tempest = !!s.tempest; sp.rad = 18; sp.vx *= 0.6; sp.vy *= 0.6; sp.life = Math.ceil(sp.life / 0.6); sp.look = 'wind'; }
        }
      }
      if (s.grape) {
        for (var g = 0; g < s.grape; g++) {
          var gp = shot(w, tw, s, tw.x, tw.y, tw.ang + (g - 1.5) * 0.18);
          gp.pierce = 1; gp.rad = 3; gp.look = 'grape';
        }
      }
    }
  }
  function freezeOne(e, s) {
    if (e.dead || e.def.noFreeze) return;
    e.frozen = Math.max(e.frozen, s.freeze);
    if (s.chill) e.chillOn = true;
  }

  // ---------------------------------------------------------------- track items (pins, patches, fuses, printed piles)
  function addItem(w, kind, d, s, life, owner, x, y) {
    var it = { type: kind, d: d, left: s.pierce, hits: [], life: life || 0, lead: !!s.lead, ice: !!s.ice, owner: owner || null };
    if (kind === 'fuseAt') { it.type = 'fuse'; it.x = x; it.y = y; it.t = s.delay; }
    else place(it, d);
    if (kind === 'pile' || kind === 'pinStorm') {
      if (kind === 'pile') {
        var count = 0;
        for (var i = w.items.length - 1; i >= 0; i--) if (w.items[i].owner === owner && ++count > 40) w.items.splice(i, 1);
      }
      it.x += (Math.random() - 0.5) * 8; it.y += (Math.random() - 0.5) * 8;
    }
    w.items.push(it);
    return it;
  }

  function stepItems(w) {
    var its = w.items, es = w.enemies;
    for (var i = its.length - 1; i >= 0; i--) {
      var it = its[i];
      if (it.type === 'fuse') {
        if (it.t == null) it.t = T.fuse.base.delay;
        if (--it.t <= 0) {
          explode(w, it.x, it.y, T.fuse.base.blast, T.fuse.base.pierce, { lead: true, ice: true, blastHit: true, layers: 1, moab: 0, fire: true });
          its.splice(i, 1);
        }
        continue;
      }
      if (it.life && --it.life <= 0) { its.splice(i, 1); continue; }
      for (var j = 0; j < es.length && it.left > 0; j++) {
        var e = es[j];
        if (e.dead) continue;
        var dx = e.x - it.x, dy = e.y - it.y, rr = 12 + e.r;
        if (dx * dx + dy * dy > rr * rr || it.hits.indexOf(e.id) >= 0) continue;
        it.hits.push(e.id);
        if (it.type === 'patch') { if (glueOn(e, T.patch.base)) it.left--; }
        else it.left -= hit(w, e, it);
      }
      if (it.left <= 0) its.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------- one frame
  function step(w) {
    if (w.done) return;
    if (w.dirty) refresh(w);
    w.frame++;
    if (w.stormCd > 0) w.stormCd--;
    // spawn
    if (w.qi < w.queue.length) {
      if (--w.spawnT <= 0) { addEnemy(w, w.queue[w.qi++], 0); w.spawnT = w.gap; }
    }
    // move
    var es = w.enemies, i;
    for (i = 0; i < es.length; i++) {
      var e = es[i];
      if (e.dead) continue;
      var f = 1;
      if (e.frozen > 0) { f = 0; if (--e.frozen <= 0 && e.chillOn) e.chill = true; }
      else {
        if (e.glue > 0) {
          f = 1 / 3; e.glue--;
          if (e.corrode && --e.corT <= 0) { e.corT = e.corrode; pop(w, e, 1, 0); if (e.dead) continue; }
        } else if (e.chill) f = 0.5;
        if (e.arctic >= w.frame - 1 && f > 1 / 3) f = 1 / 3;
      }
      e.d += (e.def.spd + w.bonus) * f;
      if (e.d >= PATH_LEN) { e.dead = true; e.escaped = true; w.livesLost += e.def.rbe; continue; }
      place(e, e.d);
    }
    stepTowers(w);
    stepShots(w);
    stepItems(w);
    // compact pools in place (no new arrays)
    var n = 0;
    for (i = 0; i < es.length; i++) { if (es[i].dead) w.epool.push(es[i]); else es[n++] = es[i]; }
    es.length = n;
    var ss = w.shots; n = 0;
    for (i = 0; i < ss.length; i++) { if (ss[i].dead) w.spool.push(ss[i]); else ss[n++] = ss[i]; }
    ss.length = n;
    var fl = w.fx; n = 0;
    for (i = 0; i < fl.length; i++) { if (++fl[i].t >= fl[i].max) w.fxpool.push(fl[i]); else fl[n++] = fl[i]; }
    fl.length = n;
    if (w.qi >= w.queue.length && !es.length) w.done = true;
  }

  // Core Storm: wipes out every bug that is not a Botnet.
  function storm(w) {
    var es = w.enemies;
    for (var i = 0; i < es.length; i++) if (!es[i].dead && !es[i].def.zep) { w.pops += es[i].def.rbe; fx(w, 'pop', es[i].x, es[i].y, es[i].r, 1); es[i].dead = true; }
    fx(w, 'ring', D.W / 2, D.H / 2, 500, 1);
  }

  var api = { create: create, step: step, refresh: refresh, storm: storm, nearest: nearest, inWater: inWater, place: place,
    PATH_LEN: PATH_LEN, SEG: SEG, addItem: addItem };
  root.CSEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
