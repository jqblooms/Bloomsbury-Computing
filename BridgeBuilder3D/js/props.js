// Data Bridge 3D art: the PROPS on a lane's start bank: the ANSWER BOOTH (where the team answers the exam question)
// and the PLAN TABLE (where the team builds the bridge), each with a sign, plus any small dressing on the bank.
//   buildProps(lv, teamIndex, z0) -> THREE.Group
// Positions come from spots(lv) (squares; z across the lane from its near edge z0). Players walk up within 1.7 squares
// and press E, so each prop must be obvious from a distance and must not block the walkway to the cart (the cart
// starts at lv.start.x to lv.start.x + 2.4 in the lane's middle, z = MID_Z). Stand things on groundAt(lv, x).
// Built once as merged templates (one mesh per material), cloned per lane; team-coloured parts take the lane's colour.
// Signs are small boards on the props (icon + one word, readable from both sides), never floating sprites.
// Dressing (cones, a crate, a lamp post, a beam stack) keeps to the lane edges, clear of the spawn-to-cart path.
import * as THREE from 'three';
import { T, LANE_W, MAT_COL, TEAM_COL, canvasTex, groundAt, spots } from './util.js';

// ---------- shared materials and textures ----------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const M = {
  woodDark: std('#8a5a2b'), wood: std(MAT_COL.wood), cream: std('#fff4e0'), yellow: std('#ffd166'), white: std('#f8f9fa'),
  dark: std('#2b2f36'), metal: std('#adb5bd', { metalness: 0.4, roughness: 0.45 }), red: std('#e03131'), orange: std('#ff7a1a'),
  steel: std(MAT_COL.steel, { metalness: 0.4, roughness: 0.45 }), road: std(MAT_COL.road), green: std('#2f6b4f'), blue: std('#1d5fa8'),
  bulb: new THREE.MeshBasicMaterial({ color: '#fff3bf' }),
  pool: new THREE.MeshBasicMaterial({ color: '#ffe8a3', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
};
const TEAM = std('#ffffff', { roughness: 0.6 }); // placeholder, swapped per lane
const teamMats = new Map();
const teamMat = i => { if (!teamMats.has(i)) teamMats.set(i, std(TEAM_COL[i % TEAM_COL.length], { roughness: 0.6 })); return teamMats.get(i); };

function signTex(word, iconCol, drawIcon) {
  return canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#2b2f36'; g.beginPath(); g.roundRect(0, 0, w, h, 34); g.fill();
    g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, 26); g.fill();
    g.fillStyle = iconCol; g.beginPath(); g.arc(88, h / 2, 54, 0, Math.PI * 2); g.fill();
    drawIcon(g, 88, h / 2);
    g.fillStyle = '#2b2f36'; g.font = '900 80px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(word, 320, h / 2 + 4, 330);
  });
}
const basicTex = tex => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
const SIGN_BOOTH = basicTex(signTex('ANSWER', '#f59f00', (g, x, y) => {
  g.fillStyle = '#fff'; g.font = '900 86px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x, y + 4);
}));
const SIGN_TABLE = basicTex(signTex('PLAN', '#1c7ed6', (g, x, y) => {
  // a little truss: the bridge you will build
  g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 36, y + 18); g.lineTo(x + 36, y + 18); g.moveTo(x - 36, y + 18); g.lineTo(x - 12, y - 20); g.lineTo(x + 12, y - 20);
  g.lineTo(x + 36, y + 18); g.moveTo(x - 12, y - 20); g.lineTo(x, y + 18); g.lineTo(x + 12, y - 20); g.stroke();
}));
const BOARD = basicTex(canvasTex(256, 180, (g, w, h) => {
  g.fillStyle = '#24493a'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 40; k++) g.fillRect((k * 53) % w, (k * 31) % h, 30, 3);
  g.fillStyle = '#f8f9fa'; g.font = '900 120px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 70, 96);
  g.strokeStyle = 'rgba(248,249,250,.8)'; g.lineWidth = 5; g.lineCap = 'round';
  for (const [y, l] of [[50, 90], [82, 70], [114, 96], [146, 60]]) { g.beginPath(); g.moveTo(140, y); g.lineTo(140 + l, y); g.stroke(); }
}));
const PRINT = basicTex(canvasTex(256, 320, (g, w, h) => {
  g.fillStyle = '#1d5fa8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
  for (let k = 0; k <= w; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); }
  for (let k = 0; k <= h; k += 16) { g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.lineJoin = 'round';
  const tr = (y0, s) => { g.beginPath(); g.moveTo(30, y0); g.lineTo(226, y0); for (let k = 0; k < 4; k++) { const a = 30 + k * 49; g.moveTo(a, y0); g.lineTo(a + 24.5, y0 - s); g.lineTo(a + 49, y0); } g.moveTo(54.5, y0 - s); g.lineTo(201.5, y0 - s); g.stroke(); };
  tr(130, 50); tr(260, 40);
  g.strokeStyle = '#ffd43b'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(30, 160); g.lineTo(226, 160); g.stroke();
}));
const CRATE = std('#ffffff', { map: canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#c58a45'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 2; for (let y = 32; y < h; y += 32) { g.beginPath(); g.moveTo(14, y); g.lineTo(w - 14, y); g.stroke(); }
  g.strokeStyle = '#8a5a2b'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.lineWidth = 12; g.beginPath(); g.moveTo(10, 10); g.lineTo(w - 10, h - 10); g.stroke();
}) });
const GLOW = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: canvasTex(64, 64, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,236,170,.9)'); r.addColorStop(1, 'rgba(255,236,170,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
}) });

// ---------- template building: add parts (squares), then merge them into one mesh per material ----------
function maker() {
  const root = new THREE.Group(), extra = []; let cur = root;
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x * T, y * T, z * T); m.rotation.set(rx, ry, rz); cur.add(m); return m; };
  const box = (sx, sy, sz, mat, x, y, z, rx, ry, rz) => add(new THREE.BoxGeometry(sx * T, sy * T, sz * T), mat, x, y, z, rx, ry, rz);
  const cyl = (r0, r1, h, mat, x, y, z, rx, ry, rz, seg = 10) => add(new THREE.CylinderGeometry(r0 * T, r1 * T, h * T, seg), mat, x, y, z, rx, ry, rz);
  // a sign board facing -x and +x (readable from both sides), w x h squares, with a dark frame
  const sign = (mat, x, y, z, w, h) => {
    box(0.04, h + 0.06, w + 0.06, M.dark, x, y, z);
    add(new THREE.PlaneGeometry(w * T, h * T), mat, x - 0.025, y, z, 0, -Math.PI / 2, 0);
    add(new THREE.PlaneGeometry(w * T, h * T), mat, x + 0.025, y, z, 0, Math.PI / 2, 0);
  };
  const glow = (x, y, z, s) => { const sp = new THREE.Sprite(GLOW); sp.position.set(x * T, y * T, z * T); sp.scale.set(s * T, s * T, 1); extra.push(sp); };
  // parts added after sub() sit in a moved/tilted frame; top() returns to the root frame
  const sub = (x, y, z, rz) => { const g = new THREE.Group(); g.position.set(x * T, y * T, z * T); g.rotation.z = rz; root.add(g); cur = g; };
  const top = () => { cur = root; };
  return { add, box, cyl, sign, glow, sub, top, done: () => merge(root, extra) };
}
function merge(root, extra) {
  root.updateMatrixWorld(true);
  const byMat = new Map();
  root.traverse(o => { if (o.isMesh) { if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push(o); } });
  const out = new THREE.Group();
  for (const [mat, list] of byMat) {
    const pos = [], nor = [], uv = [];
    for (const m of list) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
      pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array);
      g.dispose(); m.geometry.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    out.add(new THREE.Mesh(geo, mat));
  }
  for (const e of extra) out.add(e);
  return out;
}

// ---------- the stations (local frame: origin on the ground at the spot, front facing -x) ----------
function makeBooth() {
  const k = maker(), { box, cyl, add, sign, glow } = k;
  box(1.5, 0.08, 1.5, M.woodDark, 0.05, 0.04, 0);                        // floor
  box(0.42, 0.86, 1.3, M.yellow, -0.38, 0.47, 0);                         // counter
  box(0.44, 0.1, 1.32, TEAM, -0.38, 0.13, 0);                             // kick strip in team colour
  box(0.62, 0.07, 1.44, M.wood, -0.4, 0.935, 0);                          // counter top
  box(0.12, 2.05, 1.4, M.cream, 0.62, 1.05, 0);                           // back wall
  for (const z of [-0.69, 0.69]) box(0.62, 2.05, 0.06, M.cream, 0.31, 1.05, z); // side walls (back half)
  box(0.04, 0.84, 1.14, M.wood, 0.545, 1.45, 0);                          // blackboard frame
  add(new THREE.PlaneGeometry(1.04 * T, 0.74 * T), BOARD, 0.52, 1.45, 0, 0, -Math.PI / 2, 0);
  box(0.08, 0.04, 0.8, M.wood, 0.5, 1.04, 0);                             // chalk ledge
  for (const z of [-0.66, 0.66]) cyl(0.05, 0.05, 2.1, M.white, -0.62, 1.07, z);
  // awning: team-coloured roof with a white-and-team scalloped edge
  box(1.6, 0.08, 1.6, TEAM, -0.05, 2.17, 0, 0, 0, 0.12);
  for (let s = 0; s < 6; s++) cyl(0.13, 0.13, 0.05, s % 2 ? TEAM : M.white, -0.86, 2.03, -0.65 + s * 0.26, 0, 0, Math.PI / 2, 12);
  // desk lamp on the counter, with a warm pool of light
  cyl(0.09, 0.11, 0.04, M.dark, -0.32, 0.99, 0.45);
  cyl(0.018, 0.018, 0.38, M.dark, -0.38, 1.17, 0.45, 0, 0, 0.35);
  cyl(0.05, 0.14, 0.14, M.red, -0.5, 1.33, 0.45, 0, 0, 0.9, 12);
  add(new THREE.SphereGeometry(0.05 * T, 10, 8), M.bulb, -0.55, 1.29, 0.45);
  add(new THREE.CircleGeometry(0.3 * T, 20), M.pool, -0.5, 0.975, 0.3, -Math.PI / 2, 0, 0);
  glow(-0.55, 1.28, 0.45, 0.55);
  // papers and a pencil
  box(0.26, 0.02, 0.2, M.white, -0.42, 0.98, -0.25, 0, 0.2, 0);
  cyl(0.015, 0.015, 0.24, M.yellow, -0.38, 0.99, -0.02, Math.PI / 2, 0, 0.4, 6);
  // sign above the awning: "? ANSWER"
  cyl(0.025, 0.025, 0.3, M.dark, -0.2, 2.35, 0);
  sign(SIGN_BOOTH, -0.2, 2.7, 0, 1.35, 0.42);
  return k.done();
}
function makeTable() {
  const k = maker(), { box, cyl, add, sign, sub, top } = k;
  // drafting table: legs (back legs longer), tilted top with a blueprint and drawing tools
  for (const [x, z, h] of [[-0.42, -0.6, 0.8], [-0.42, 0.6, 0.8], [0.42, -0.6, 1.02], [0.42, 0.6, 1.02]]) box(0.08, h, 0.08, M.woodDark, x, h / 2, z);
  box(0.9, 0.06, 0.08, M.woodDark, 0, 0.35, -0.6); box(0.9, 0.06, 0.08, M.woodDark, 0, 0.35, 0.6); box(0.08, 0.06, 1.2, M.woodDark, 0.42, 0.35, 0);
  sub(0, 0.92, 0, 0.24);
  box(1.02, 0.06, 1.38, M.wood, 0, 0, 0);
  add(new THREE.PlaneGeometry(0.9 * T, 1.2 * T).rotateX(-Math.PI / 2), PRINT, 0, 0.032, 0);
  box(0.05, 0.06, 1.38, M.woodDark, -0.5, 0.04, 0);                       // lip at the front edge
  box(0.05, 0.016, 0.9, M.yellow, -0.05, 0.04, 0.05, 0, 0.5, 0);          // ruler
  cyl(0.2, 0.2, 0.016, M.red, 0.2, 0.04, -0.35, 0, 0.3, 0, 3);            // set square
  cyl(0.014, 0.014, 0.28, M.orange, -0.36, 0.05, 0.4, Math.PI / 2, 0, 0, 6); // pencil resting on the lip
  top();
  // rolled plans at the back
  cyl(0.06, 0.06, 0.9, M.white, 0.47, 1.1, 0, Math.PI / 2, 0, 0, 10);
  cyl(0.05, 0.05, 0.8, M.blue, 0.47, 1.21, 0.05, Math.PI / 2, 0, 0, 10);
  // toolbox on the ground at the lane-edge side
  box(0.5, 0.24, 0.26, M.red, 0.05, 0.12, 0.82);
  box(0.52, 0.04, 0.28, M.dark, 0.05, 0.25, 0.82);
  box(0.04, 0.1, 0.04, M.dark, -0.1, 0.3, 0.82); box(0.04, 0.1, 0.04, M.dark, 0.2, 0.3, 0.82); box(0.34, 0.035, 0.04, M.dark, 0.05, 0.36, 0.82);
  cyl(0.02, 0.02, 0.32, M.metal, 0.05, 0.28, 0.67, 0, 0, Math.PI / 2, 6); // spanner along the lid
  // sign on a post behind the table: "PLAN"
  cyl(0.03, 0.03, 2.0, M.dark, 0.58, 1.0, -0.55);
  sign(SIGN_TABLE, 0.58, 2.2, -0.25, 1.2, 0.38);
  return k.done();
}
// beams waiting to be used: a small criss-cross stack along x
function makeBeams() {
  const k = maker(), { box } = k;
  const m = [M.wood, M.steel, M.steel, M.wood, M.road, M.wood];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) box(1.25, 0.11, 0.13, m[r * 2 + c], (r % 2) * 0.06, 0.12 + r * 0.115, -0.11 + c * 0.22);
  for (const x of [-0.45, 0.45]) box(0.1, 0.06, 0.5, M.woodDark, x, 0.03, 0);
  return k.done();
}
function makeCone() {
  const k = maker(), { box, cyl } = k;
  box(0.32, 0.04, 0.32, M.dark, 0, 0.02, 0);
  cyl(0.03, 0.15, 0.4, M.orange, 0, 0.24, 0, 0, 0, 0, 12);
  cyl(0.085, 0.105, 0.08, M.white, 0, 0.25, 0, 0, 0, 0, 12);
  return k.done();
}
function makeCrate() {
  const k = maker(), { add } = k;
  add(new THREE.BoxGeometry(0.6 * T, 0.6 * T, 0.6 * T), CRATE, 0, 0.3, 0);
  add(new THREE.BoxGeometry(0.42 * T, 0.42 * T, 0.42 * T), CRATE, 0.05, 0.81, 0.02, 0, 0.5, 0);
  return k.done();
}
function makeLamp() {
  const k = maker(), { box, cyl, add, glow } = k;
  cyl(0.14, 0.18, 0.16, M.dark, 0, 0.08, 0);
  cyl(0.045, 0.055, 2.5, M.green, 0, 1.3, 0);
  box(0.05, 0.05, 0.56, M.green, 0, 2.5, 0.25);
  cyl(0.02, 0.02, 0.12, M.dark, 0, 2.42, 0.5);
  cyl(0.1, 0.2, 0.14, M.green, 0, 2.31, 0.5, 0, 0, 0, 12);
  add(new THREE.SphereGeometry(0.09 * T, 10, 8), M.bulb, 0, 2.21, 0.5);
  glow(0, 2.18, 0.5, 1.1);
  return k.done();
}

let TPL = null;
const tpl = () => TPL || (TPL = { booth: makeBooth(), table: makeTable(), beams: makeBeams(), cone: makeCone(), crate: makeCrate(), lamp: makeLamp() });
function place(t, i, x, y, z, ry) {
  const g = t.clone();
  g.traverse(o => { if (o.isMesh && o.material === TEAM) o.material = teamMat(i); });
  g.position.set(x, y, z); g.rotation.y = ry; return g;
}

export function buildProps(lv, i, z0) {
  const group = new THREE.Group(), sp = spots(lv), P = tpl();
  const gy = x => groundAt(lv, x);
  const at = (t, x, z, ry = 0) => { const y = gy(x); if (y != null) group.add(place(t, i, x * T, y * T, z0 + z * T, ry)); };
  const flatNear = (x, ref) => { const y = gy(x); return y != null && Math.abs(y - ref) < 0.15; };
  // the two stations, turned a little toward the lane's middle
  at(P.booth, sp.booth.x, sp.booth.z, 0.4);
  at(P.table, sp.table.x, sp.table.z, -0.4);
  // beams stacked on the far lane edge just before the table (beside the cart, never in its way)
  const ty = gy(sp.table.x) ?? lv.start.y;
  if (flatNear(sp.table.x - 1.95, ty) && flatNear(sp.table.x - 0.7, ty)) at(P.beams, sp.table.x - 1.35, LANE_W - 0.35);
  // start bank dressing on the lane edges: a lamp post, cones, a crate behind spawn
  const s0 = lv.start.x, sy = gy(s0) ?? lv.start.y;
  if (flatNear(s0 - 0.4, sy)) at(P.lamp, s0 - 0.4, 0.25);
  for (const [x, z] of [[s0 + 0.7, 0.3], [s0 + 1.9, 0.3], [s0 + 0.7, LANE_W - 0.3]]) if (flatNear(x, sy)) at(P.cone, x, z);
  const cx = sp.spawn.x - 0.9;
  if (cx > -1.6 && gy(cx) != null) at(P.crate, cx, LANE_W - 0.55, 0.3);
  return group;
}
