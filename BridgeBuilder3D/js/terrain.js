// Data Bridge 3D art: a lane's TERRAIN for one gap: the two banks (the website level's ground polygons, extruded
// across the lane), the gap's floor far below, the team's colour, the finish flag on the far bank.
//   buildTerrain(lv, teamIndex, z0) -> THREE.Group   (z0 = the lane's near edge in world units; lane is LANE_W wide)
// lv: a level from the website physics (BBPhys.level): lv.ground = [{ pts: [[x, y], ...] }] in squares (polygons run
// far past the board and down to y = -40); lv.theme picks Art.palette(lv.theme) colours; lv.fallY is the gap bottom.
// Players walk on the top surface (groundAt), so keep the walkable top where the polygon top is.
// Look: striped rock cliffs that get darker with depth, a grass top with a turf lip, yellow/black hazard edges at every
// drop, team-coloured kerbs along the lane and a team start line, a glowing river in the gap, a chequered finish flag.
// Cost: one rock mesh + one top mesh per lane (materials and textures shared by theme), a few small extras.
import * as THREE from 'three';
import { Art, T, LANE_W, MID_Z, TEAM_COL, groundAt, canvasTex, rand } from './util.js';

const X0 = -16, X1 = 50;            // clamp the far-away ground (squares)
const LIP = 0.32;                   // turf lip depth (squares)

// ---------------------------------------------------------------- shared textures (made once)
let TEX = null;
function textures() {
  if (TEX) return TEX;
  const r = rand(7);
  const rock = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h) {   // strata bands of different shades and thickness
      const bh = 10 + r() * 34, v = 150 + r() * 90 | 0;
      g.fillStyle = `rgb(${v},${v - 6},${v - 14})`; g.fillRect(0, y, w, bh + 1);
      g.strokeStyle = 'rgba(40,30,25,0.55)'; g.lineWidth = 2 + r() * 2; g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / w * Math.PI * 2 + y) * 2.5);
      g.stroke();
      g.strokeStyle = 'rgba(255,250,240,0.35)'; g.lineWidth = 1.5; g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + 3 + Math.sin(x / w * Math.PI * 2 + y) * 2.5);
      g.stroke();
      y += bh;
    }
    for (let k = 0; k < 900; k++) { const v = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'; g.fillStyle = v; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3); }
    g.strokeStyle = 'rgba(30,22,18,0.5)'; g.lineWidth = 1.5;   // a few cracks
    for (let k = 0; k < 9; k++) { let x = r() * w, yy = r() * h; g.beginPath(); g.moveTo(x, yy); for (let s = 0; s < 4; s++) { x += (r() - 0.5) * 18; yy += 8 + r() * 14; g.lineTo(x, yy); } g.stroke(); }
  });
  const grass = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#7cc24a'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 700; k++) { g.fillStyle = r() < 0.5 ? 'rgba(40,110,30,0.35)' : 'rgba(200,240,120,0.35)'; g.fillRect(r() * w, r() * h, 1.5, 3 + r() * 4); }
    for (let k = 0; k < 10; k++) { g.fillStyle = r() < 0.5 ? '#ffe066' : '#ffffff'; g.beginPath(); g.arc(r() * w, r() * h, 1.6, 0, 7); g.fill(); }
  });
  const hazard = canvasTex(128, 32, (g, w, h) => {
    g.fillStyle = '#ffd43b'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f1f1f';
    for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 16, 0); g.lineTo(x + 16 - h, h); g.lineTo(x - h, h); g.fill(); }
  });
  const water = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.5, '#c8c8c8'); gr.addColorStop(1, '#9a9a9a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineCap = 'round';
    for (let k = 0; k < 40; k++) { const x = r() * w, y = r() * h, l = 14 + r() * 40; g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke(); }
  });
  const glow = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const cheq = canvasTex(64, 64, (g, w, h) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#1b1b1b' : '#ffffff'; g.fillRect(x * 32, y * 32, 32, 32); } });
  for (const t of [rock, grass, hazard, water, cheq]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  TEX = { rock, grass, hazard, water, glow, cheq };
  return TEX;
}

// ---------------------------------------------------------------- shared materials (by theme / team)
const byTheme = new Map(), byTeam = new Map();
function themeMats(theme) {
  const key = typeof theme === 'object' ? JSON.stringify(theme) : theme;
  if (byTheme.has(key)) return byTheme.get(key);
  const pal = Art.palette(theme), tx = textures();
  const rockCol = new THREE.Color(pal.rock[0]).lerp(new THREE.Color('#d6bc9c'), 0.7);
  const stream = new THREE.Color(pal.stream);
  const m = {
    rock: new THREE.MeshLambertMaterial({ color: rockCol, map: tx.rock, vertexColors: true }),
    top: new THREE.MeshLambertMaterial({ color: '#ffffff', map: tx.grass, vertexColors: true }),
    water: new THREE.MeshBasicMaterial({ color: stream.clone().lerp(new THREE.Color('#ffffff'), 0.15), map: tx.water, fog: true }),
    mist: new THREE.MeshBasicMaterial({ color: stream, map: tx.glow, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  };
  byTheme.set(key, m); return m;
}
const cheqMat = () => cheqMat.m || (cheqMat.m = new THREE.MeshLambertMaterial({ map: textures().cheq, emissive: '#ffffff', emissiveIntensity: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
const hazardMat = () => hazardMat.m || (hazardMat.m = new THREE.MeshLambertMaterial({ map: textures().hazard, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
function teamMats(i) {
  if (byTeam.has(i)) return byTeam.get(i);
  const col = TEAM_COL[i % TEAM_COL.length];
  const flagTex = canvasTex(192, 128, (g, w, h) => {
    const s = 24; for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { g.fillStyle = ((x + y) / s) % 2 ? '#1b1b1b' : '#ffffff'; g.fillRect(x, y, s, s); }
    g.fillStyle = col; g.fillRect(0, 0, 40, h); g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.fillRect(w - 10, 0, 10, h);
  });
  const lineTex = canvasTex(64, 16, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 8, h); });
  lineTex.wrapS = THREE.RepeatWrapping;
  const off = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const m = {
    col,
    kerb: new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, ...off }),
    line: new THREE.MeshLambertMaterial({ map: lineTex, emissive: col, emissiveIntensity: 0.15, ...off }),
    flag: new THREE.MeshLambertMaterial({ map: flagTex, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.12 }),
    cloth: new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.2 }),
  };
  byTeam.set(i, m); return m;
}
const poleMat = new THREE.MeshLambertMaterial({ color: '#e9ecef' });
const goldMat = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#a77a00', emissiveIntensity: 0.4 });
const stoneMat = new THREE.MeshLambertMaterial({ color: '#adb5bd' });
const poleGeo = new THREE.CylinderGeometry(5, 6, 1, 10).translate(0, 0.5, 0);
const ballGeo = new THREE.SphereGeometry(12, 14, 10);
const plinthGeo = new THREE.CylinderGeometry(30, 38, 26, 8).translate(0, 13, 0);
const FLAG_W = 150, FLAG_H = 100, flagGeo = new THREE.PlaneGeometry(FLAG_W, FLAG_H, 12, 4).translate(FLAG_W / 2, 0, 0);
const flagBase = flagGeo.attributes.position.array.slice();
let flagT = -1;
function waveFlag() {   // one shared flag mesh shape, waved once per frame for every lane
  const now = performance.now(); if (now - flagT < 10) return; flagT = now;
  const p = flagGeo.attributes.position, t = now / 1000;
  for (let k = 0; k < p.count; k++) { const x = flagBase[k * 3], y = flagBase[k * 3 + 1], a = x / FLAG_W; p.setZ(k, Math.sin(x / 38 - t * 4) * 14 * a); p.setY(k, y - a * a * 8 + Math.sin(x / 50 - t * 3) * 3 * a); }
  p.needsUpdate = true; flagGeo.computeVertexNormals();
}

// ---------------------------------------------------------------- geometry helpers
class Mesher {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; }
  tri(a, b, c, nrm, uvf, colf) {   // a, b, c: [x, y, z] world; turns the triangle to face nrm
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
    if (cx * nrm[0] + cy * nrm[1] + cz * nrm[2] < 0) [b, c] = [c, b];
    for (const v of [a, b, c]) { this.p.push(...v); this.n.push(...nrm); this.uv.push(...uvf(v)); const s = colf(v); this.c.push(s, s, s); }
  }
  quad(a, b, c, d, nrm, uvf, colf) { this.tri(a, b, c, nrm, uvf, colf); this.tri(a, c, d, nrm, uvf, colf); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    return g;
  }
}
// a flat strip lying on a top edge (squares p -> q), from z = za to zb (world), lifted a hair
function strip(m, p, q, za, zb, uvLen) {
  const lift = 0.6, A = [p[0] * T, p[1] * T + lift, za], B = [q[0] * T, q[1] * T + lift, za], C = [q[0] * T, q[1] * T + lift, zb], D = [p[0] * T, p[1] * T + lift, zb];
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
  const uvs = new Map([[A, [0, 0]], [B, [uvLen ? uvLen(L) : L, 0]], [C, [uvLen ? uvLen(L) : L, 1]], [D, [0, 1]]]);
  m.quad(A, B, C, D, [0, 1, 0], v => uvs.get(v), () => 1);
}

// ---------------------------------------------------------------- the lane
export function buildTerrain(lv, i, z0) {
  const group = new THREE.Group(), mats = themeMats(lv.theme), team = teamMats(i), tx = textures();
  const z1 = z0 + LANE_W * T, yB = lv.fallY - 6;
  const polys = lv.ground.map(g => {
    const pts = [];
    for (const [x, y] of g.pts) { const p = [Math.max(X0, Math.min(X1, x)), Math.max(yB, y)]; const l = pts[pts.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-6) pts.push(p); }
    while (pts.length > 2 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-6) pts.pop();
    return pts;
  }).filter(p => p.length >= 3);
  let yTop = -Infinity; for (const p of polys) for (const v of p) yTop = Math.max(yTop, v[1]);
  // depth shading: full light at the top, dark far down (linear in y, so it interpolates exactly on big faces)
  const shade = v => { const k = (v[1] / T - yB) / (yTop - yB); return 0.16 + 0.84 * Math.max(0, Math.min(1, k)) ** 1.15; };
  const rockUV = v => [(v[0] + v[2] * 0.37) / (4.5 * T), v[1] / (3.2 * T)];
  const capUV = v => [v[0] / (4.5 * T), v[1] / (3.2 * T)];
  const rock = new Mesher(), top = new Mesher(), haz = new Mesher(), kerb = new Mesher();
  const topUV = v => [v[0] / (2.2 * T), v[2] / (2.2 * T)], lipShade = () => 0.62, one = () => 1;

  for (const pts of polys) {
    let area = 0; for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    const ccw = area > 0;
    // front and back faces (the side the camera sees from the side view)
    const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, y]) => new THREE.Vector2(x, y)), []);
    for (const [zc, nz] of [[z0, -1], [z1, 1]]) for (const t of tris) {
      const v = t.map(k => [pts[k][0] * T, pts[k][1] * T, zc]);
      rock.tri(v[0], v[1], v[2], [0, 0, nz], capUV, shade);
    }
    // classify edges by their outward normal
    const E = pts.map((a, k) => {
      const b = pts[(k + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const nx = (ccw ? dy : -dy) / L, ny = (ccw ? -dx : dx) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, gy = groundAt(lv, mx);
      return { a, b, nx, ny, L, top: ny > 0.45 && gy != null && Math.abs(gy - my) < 0.25, hidden: (a[1] <= yB + 1e-6 && b[1] <= yB + 1e-6) || (Math.abs(nx) > 0.99 && (Math.abs(a[0] - X0) < 1e-6 || Math.abs(a[0] - X1) < 1e-6)) };
    });
    E.forEach((e, k) => {
      if (e.hidden) return;
      const A = [e.a[0] * T, e.a[1] * T], B = [e.b[0] * T, e.b[1] * T], n = [e.nx, e.ny, 0];
      if (!e.top) { rock.quad([A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], z1], [A[0], A[1], z1], n, rockUV, shade); return; }
      // the walkable top: exactly on the polygon edge
      top.quad([A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], z1], [A[0], A[1], z1], n, topUV, one);
      // turf lip hanging down the front and back faces
      const d = LIP * T;
      for (const [zc, nz] of [[z0 - 1.2, -1], [z1 + 1.2, 1]])
        top.quad([A[0], A[1] + 0.5, zc], [B[0], B[1] + 0.5, zc], [B[0], B[1] - d, zc], [A[0], A[1] - d, zc], [0, 0, nz], v => [v[0] / (2.2 * T), v[1] / (2.2 * T)], lipShade);
      // team kerbs along both lane borders
      const kw = 0.14;
      strip(kerb, e.a, e.b, z0 + 2, z0 + kw * T, null); strip(kerb, e.a, e.b, z1 - kw * T, z1 - 2, null);
      // at each end that drops away: a turf lip down the wall and a hazard stripe on the top
      for (const [end, nb, dir] of [[e.b, E[(k + 1) % E.length], 1], [e.a, E[(k - 1 + E.length) % E.length], -1]]) {
        if (nb.top || nb.hidden) continue;
        const wall = dir > 0 ? [nb.b[0] - nb.a[0], nb.b[1] - nb.a[1]] : [nb.a[0] - nb.b[0], nb.a[1] - nb.b[1]];
        if (wall[1] >= 0) continue;   // the neighbour edge goes up (a step up): no lip
        const wl = Math.hypot(wall[0], wall[1]), s = Math.min(LIP, wl * 0.5) / wl, o = 1.2;
        const P = [end[0] * T + nb.nx * o, end[1] * T + 0.5], Q = [(end[0] + wall[0] * s) * T + nb.nx * o, (end[1] + wall[1] * s) * T + nb.ny * o];
        top.quad([P[0], P[1], z0 - 1.2], [Q[0], Q[1], z0 - 1.2], [Q[0], Q[1], z1 + 1.2], [P[0], P[1], z1 + 1.2], [nb.nx, nb.ny, 0], v => [v[2] / (2.2 * T), v[1] / (2.2 * T)], lipShade);
        const hl = Math.min(0.32, e.L * 0.4), f = hl / e.L, from = dir > 0 ? [end[0] - (e.b[0] - e.a[0]) * f, end[1] - (e.b[1] - e.a[1]) * f] : [end[0] + (e.b[0] - e.a[0]) * f, end[1] + (e.b[1] - e.a[1]) * f];
        strip(haz, from, end, z0, z1, () => 0.25);
        // hazard uv: stripes run across the lane
        const u = haz.uv, base = u.length - 12;
        for (let q = 0; q < 6; q++) { const vz = haz.p[(base / 2 + q) * 3 + 2]; u[base + q * 2] = (vz - z0) / (0.8 * T); u[base + q * 2 + 1] = Math.abs(haz.p[(base / 2 + q) * 3] - from[0] * T) < 1 ? 0 : 1; }
      }
    });
  }
  group.add(new THREE.Mesh(rock.geo(), mats.rock));
  group.add(new THREE.Mesh(top.geo(), mats.top));
  if (haz.p.length) group.add(new THREE.Mesh(haz.geo(), hazardMat()));
  if (kerb.p.length) group.add(new THREE.Mesh(kerb.geo(), team.kerb));

  // the river at the bottom of the gap, with glowing mist rising off it
  const span = (X1 - X0) * T, cx = (X0 + X1) / 2 * T;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(span, LANE_W * T + 2).rotateX(-Math.PI / 2), mats.water);
  water.geometry.attributes.uv.array.forEach((v, k, a) => { a[k] = k % 2 ? v * LANE_W / 3 : v * (X1 - X0) / 3; });
  water.position.set(cx, (lv.fallY - 0.6) * T, z0 + MID_Z * T);
  water.onBeforeRender = () => { tx.water.offset.x = (performance.now() / 9000) % 1; };
  group.add(water);
  const gx0 = Math.max(X0, lv.L - 1), gx1 = Math.min(X1, lv.R + 1), mistH = 3.5 * T;
  for (const zc of [z0 + MID_Z * T]) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry((gx1 - gx0) * T, mistH), mats.mist);
    mist.position.set((gx0 + gx1) / 2 * T, (lv.fallY - 0.6) * T + mistH / 2, zc); mist.renderOrder = 2; group.add(mist);
  }

  // team start line across the lane just behind the cart's rear wheel
  const sx = lv.start.x - 0.55, sy = groundAt(lv, sx) ?? lv.start.y;
  const line = new Mesher(); strip(line, [sx - 0.18, sy], [sx + 0.18, sy], z0, z1, null);
  for (let q = 0; q < 6; q++) { const vz = line.p[q * 3 + 2]; line.uv[q * 2] = (vz - z0) / (0.5 * T); line.uv[q * 2 + 1] = 0.5; }
  group.add(new THREE.Mesh(line.geo(), team.line));
  // team banner: two posts and a cloth well behind the start (out of the players' way and the bank camera's view)
  const bx = Math.max(X0 + 1, lv.start.x - 9), by = (groundAt(lv, bx) ?? sy) * T;
  for (const zc of [z0 + 0.25 * T, z1 - 0.25 * T]) { const p = new THREE.Mesh(poleGeo, poleMat); p.scale.y = 3.6 * T; p.position.set(bx * T, by, zc); group.add(p); const b = new THREE.Mesh(ballGeo, team.cloth); b.position.set(bx * T, by + 3.6 * T + 8, zc); group.add(b); }
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry((LANE_W - 0.5) * T, 0.8 * T, 8, 1).rotateY(Math.PI / 2), team.cloth);
  { const p = cloth.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setY(k, p.getY(k) - Math.sin((p.getZ(k) / ((LANE_W - 0.5) * T) + 0.5) * Math.PI) * 18); p.needsUpdate = true; cloth.geometry.computeVertexNormals(); }
  cloth.position.set(bx * T, by + 3.05 * T, z0 + MID_Z * T); group.add(cloth);

  // finish: chequered line at the goal and a proud flag on a plinth
  const gy = groundAt(lv, lv.goal.x) ?? lv.goal.y;
  const fin = new Mesher(); strip(fin, [lv.goal.x - 0.2, gy], [lv.goal.x + 0.2, gy], z0, z1, null);
  for (let q = 0; q < 6; q++) { const vz = fin.p[q * 3 + 2], vx = fin.p[q * 3]; fin.uv[q * 2] = (vz - z0) / (0.4 * T); fin.uv[q * 2 + 1] = vx < lv.goal.x * T ? 0 : 1; }
  group.add(new THREE.Mesh(fin.geo(), cheqMat()));
  const fx = lv.goal.x + 1.5, fy = (groundAt(lv, fx) ?? lv.goal.y) * T, fz = z1 - 0.7 * T, H = 3.4 * T;
  const plinth = new THREE.Mesh(plinthGeo, stoneMat); plinth.position.set(fx * T, fy, fz); group.add(plinth);
  const pole = new THREE.Mesh(poleGeo, poleMat); pole.scale.y = H; pole.position.set(fx * T, fy + 20, fz); group.add(pole);
  const ball = new THREE.Mesh(ballGeo, goldMat); ball.position.set(fx * T, fy + 20 + H + 8, fz); group.add(ball);
  const flag = new THREE.Mesh(flagGeo, team.flag); flag.rotation.y = Math.PI / 2; flag.position.set(fx * T, fy + 20 + H - FLAG_H / 2 - 6, fz);
  flag.onBeforeRender = waveFlag; group.add(flag);
  return group;
}
