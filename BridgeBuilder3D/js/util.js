// Data Bridge 3D: shared constants and helpers (owned by the integrator; agents import, never edit).
// World units: 1 square of the website's bridge grid = T = 100 units. x runs along the course (squares), y is up,
// z runs across a lane. Team i's lane starts at z = laneZ(i) squares and is LANE_W squares wide; its middle is MID_Z.
import * as THREE from 'three';
export const Ph = window.BBPhys, Art = window.Art, EQ = window.BCExamQuestion;
export const T = 100, LANE_W = 6, LANE_D = 9, MID_Z = LANE_W / 2, N = Ph.LEVELS.length;
export const LV = Ph.LEVELS.map((_, i) => Ph.level(i + 1));
export const MAT_COL = { road: '#4b5563', wood: '#c58a45', steel: '#8fb4d9' };
export const TEAM_COL = ['#e03131', '#1c7ed6', '#2f9e44', '#f59f00', '#9c36b5', '#e8590c', '#d6336c', '#0ca678'];
export const laneZ = i => i * LANE_D;
export const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function rand(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
export function textSprite(text, size, bg = 'rgba(20,24,31,.85)', fg = '#ffffff') {
  const c = document.createElement('canvas'), g = c.getContext('2d'), font = '800 ' + size + 'px "Segoe UI", Arial, sans-serif';
  g.font = font; const w = Math.ceil(g.measureText(text).width) + size, h = Math.ceil(size * 1.5);
  c.width = w; c.height = h; g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.fill();
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); s.scale.set(w * 1.6, h * 1.6, 1); s.renderOrder = 10;
  return s;
}
// The ground's top at x (squares) in a level, or null over the gap.
const hCache = new Map();
export function groundAt(lv, x) {
  const key = lv.n + ':' + Math.round(x * 20);
  if (hCache.has(key)) return hCache.get(key);
  // climb up from the bottom through the rock to the first open space a player fits in: that is the floor.
  // (Scanning down from the sky landed on rock roofs and overhangs, so some levels had two floors.)
  let h = null;
  if (Ph.solidAt(lv, x, lv.fallY, 0)) {
    let y = lv.fallY;
    for (; y < Ph.Y_MAX + 3; y += 0.05) {
      if (Ph.solidAt(lv, x, y + 0.05, 0)) continue;
      let clear = true; for (let u = 0.1; u <= 1.6; u += 0.1) if (Ph.solidAt(lv, x, y + u, 0)) { clear = false; break; }
      if (clear) break;
    }
    h = y;
  }
  hCache.set(key, h); return h;
}
// where things stand on the start bank (squares): the answer booth, the plan table, where players appear
export function spots(lv) {
  const left = Math.max(lv.start.x + Ph.AXLE + 1.4, Math.min(lv.L - 1.6, lv.start.x + 6));
  return { booth: { x: left, z: 0.9 }, table: { x: left, z: LANE_W - 0.9 }, spawn: { x: Math.max(-1, lv.start.x - 1.2), z: MID_Z } };
}
export const truckAt = lv => [{ x: lv.start.x, y: lv.start.y + Ph.WHEEL_R }, { x: lv.start.x + Ph.AXLE, y: lv.start.y + Ph.WHEEL_R }];
// the cart's pose from its two wheel centres (squares): centre on the axle, turned to the slope
// (lifted 0.06 squares: the physics lets the wheels press a little into the ground, which looked like clipping)
export function cartPose(w0, w1) { return { x: (w0.x + w1.x) / 2, y: (w0.y + w1.y) / 2 - Ph.WHEEL_R + 0.06, ang: Math.atan2(w1.y - w0.y, w1.x - w0.x) }; }
