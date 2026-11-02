// Contest Lab 3D: the things in the lab. Token cubes (a big symbol on every face, bevelled, glowing when a hand is
// on them), lamp trays for bit strings, pads, the operator machine, belts, rails and labels. Pure builders: main.js
// places them. One tile is 100 world units; a pad top is at PAD_H.
import * as THREE from 'three';
import { tape } from './devices.js';

const T = 100;
export const PAD_H = 18, CUBE = 76, GAP = 80;

// Colour families (blue for operands, amber for operators; light grey brackets; lamps yellow or near black).
// Every symbol is dark on light or white on dark, with an outline, so it reads from across the room.
export const ROLE = {
  num:    { base: '#1f5fd1', light: '#5b93f5', dark: '#0f3485', ink: '#ffffff', edge: '#0a1f52', hex: 0x1f5fd1 },
  var:    { base: '#74c0fc', light: '#b6e0ff', dark: '#3c8fd6', ink: '#08214a', edge: '#ffffff', hex: 0x74c0fc },
  result: { base: '#1f5fd1', light: '#5b93f5', dark: '#0f3485', ink: '#ffffff', edge: '#0a1f52', hex: 0x1f5fd1, rim: '#ffd43b' },
  op:     { base: '#f59f00', light: '#ffd166', dark: '#b36b00', ink: '#1a1200', edge: '#fff4d6', hex: 0xf59f00 },
  paren:  { base: '#e9ecef', light: '#ffffff', dark: '#adb5bd', ink: '#16191d', edge: '#ffffff', hex: 0xe9ecef },
  on:     { base: '#ffe066', light: '#fff3bf', dark: '#f0b400', ink: '#1a1200', edge: '#ffffff', hex: 0xffe066 },
  off:    { base: '#343a40', light: '#5c636a', dark: '#1b1f23', ink: '#f1f3f5', edge: '#000000', hex: 0x343a40 },
  unknown:{ base: '#868e96', light: '#adb5bd', dark: '#5c636a', ink: '#ffffff', edge: '#212529', hex: 0x868e96 }
};

const texCache = new Map();
function faceTexture(sym, role) {
  const key = role + '|' + sym;
  if (texCache.has(key)) return texCache.get(key);
  const R = ROLE[role] || ROLE.num, S = 256, c = document.createElement('canvas'), g = c.getContext('2d');
  c.width = c.height = S;
  // the face: a soft gradient, a bevel (light top-left, dark bottom-right), an inner line and four rivets
  const grad = g.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, R.light); grad.addColorStop(0.45, R.base); grad.addColorStop(1, R.dark);
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  const b = 22;
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(S, 0); g.lineTo(S - b, b); g.lineTo(b, b); g.lineTo(b, S - b); g.lineTo(0, S); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.moveTo(S, S); g.lineTo(0, S); g.lineTo(b, S - b); g.lineTo(S - b, S - b); g.lineTo(S - b, b); g.lineTo(S, 0); g.closePath(); g.fill();
  g.fillStyle = R.base; g.fillRect(b, b, S - 2 * b, S - 2 * b);
  const inner = g.createRadialGradient(S * 0.4, S * 0.35, 10, S / 2, S / 2, S * 0.7);
  inner.addColorStop(0, 'rgba(255,255,255,.28)'); inner.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = inner; g.fillRect(b, b, S - 2 * b, S - 2 * b);
  g.strokeStyle = R.rim || 'rgba(255,255,255,.55)'; g.lineWidth = R.rim ? 10 : 4; g.strokeRect(b + 8, b + 8, S - 2 * b - 16, S - 2 * b - 16);
  g.fillStyle = 'rgba(255,255,255,.6)';
  for (const [x, y] of [[b + 18, b + 18], [S - b - 18, b + 18], [b + 18, S - b - 18], [S - b - 18, S - b - 18]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  // the symbol, as big as fits
  let px = sym.length > 2 ? 96 : sym.length > 1 ? 124 : 168;
  const font = n => '800 ' + n + 'px "Segoe UI", Arial, sans-serif';
  if (sym.includes(' ')) {   // two words (an instruction such as LOAD 5): one line each
    const [a, b2] = [sym.slice(0, sym.indexOf(' ')), sym.slice(sym.indexOf(' ') + 1)];
    px = 92; g.font = font(px);
    while (Math.max(g.measureText(a).width, g.measureText(b2).width) > S - 2 * b - 30 && px > 40) { px -= 4; g.font = font(px); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = Math.max(8, px / 10); g.strokeStyle = R.edge; g.fillStyle = R.ink;
    for (const [t, y] of [[a, S / 2 - px * 0.52], [b2, S / 2 + px * 0.6]]) { g.strokeText(t, S / 2, y); g.fillText(t, S / 2, y); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    texCache.set(key, tex);
    return tex;
  }
  g.font = font(px);
  while (g.measureText(sym).width > S - 2 * b - 30 && px > 40) { px -= 6; g.font = font(px); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // an asterisk sits small and high in most fonts, and a hyphen is short: draw them bigger and centred
  let show = sym, dy = px * 0.06;
  if (sym === '*') { px = 230; g.font = font(px); dy = px * 0.3; }
  else if (sym === '-') show = '−';
  g.lineJoin = 'round'; g.lineWidth = Math.max(8, px / 10); g.strokeStyle = R.edge; g.strokeText(show, S / 2, S / 2 + dy);
  g.fillStyle = R.ink; g.fillText(show, S / 2, S / 2 + dy);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

const cubeGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE + 1.5, CUBE + 1.5, CUBE + 1.5));
const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });

// A token cube: sym ('3', 'A', '+', '↑', '(', '12') on all six faces. setGlow(true) lights it softly.
export function makeCube(sym, role, size = 1) {
  const tex = faceTexture(sym, role);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.05, emissive: ROLE[role]?.hex ?? 0xffffff, emissiveMap: tex, emissiveIntensity: role === 'on' ? 0.55 : 0 });
  const group = new THREE.Group();
  const m = new THREE.Mesh(cubeGeo, mat); m.castShadow = true;
  const e = new THREE.LineSegments(edgeGeo, edgeMat);
  group.add(m, e); group.scale.setScalar(size);
  const base = mat.emissiveIntensity;
  return {
    group, mat,
    setGlow(on) { mat.emissiveIntensity = on ? base + 0.45 : base; },
    dispose() { mat.dispose(); }
  };
}

// A job card (CPU Lab 3D): a white board tilted up towards the camera, with a sentence in sentence case.
export function makeCard(text) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), W = 512, H = 320;
  c.width = W; c.height = H;
  g.fillStyle = '#fdfdf8'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2b8a3e'; g.fillRect(0, 0, W, 16);
  g.strokeStyle = '#495057'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
  let px = 44, lines;
  const wrap = () => { g.font = '700 ' + px + 'px "Segoe UI", Arial, sans-serif'; const out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - 48 && line) { out.push(line); line = w; } else line = t; } out.push(line); return out; };
  while ((lines = wrap()).length * px * 1.2 > H - 50 && px > 22) px -= 2;
  g.fillStyle = '#16191d'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + 8 + (i - (lines.length - 1) / 2) * px * 1.2));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15 });
  const group = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(176, 110, 6), [M(0x495057), M(0x495057), M(0x495057), M(0x495057), mat, M(0x495057)]);
  board.userData.own = true; board.rotation.x = -0.75; board.position.y = 40; group.add(board);
  return {
    group,
    setGlow(on) { mat.emissiveIntensity = on ? 0.6 : 0.15; },
    dispose() { tex.dispose(); mat.dispose(); }
  };
}

// A lamp tray: a dark plate with a lamp cube per bit (lit = 1, dark = 0, grey ? = unknown) and its name on tape.
export function makeTray(bits, name) {
  const n = bits.length, lw = 34, gap = 4, W = n * (lw + gap) + 16;
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W, 10, lw + 22), new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.5, metalness: 0.3 }));
  plate.position.y = 5; plate.userData.own = true; group.add(plate);
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry), new THREE.LineBasicMaterial({ color: 0xced4da }));
  rim.position.y = 5; rim.userData.own = true; group.add(rim);
  let lamps = [], tag = null;
  function set(b, label) {
    for (const l of lamps) { group.remove(l.group); l.dispose(); }
    lamps = [...b].map((ch, i) => {
      const c = makeCube(ch === '1' ? '1' : ch === '0' ? '0' : '?', ch === '1' ? 'on' : ch === '0' ? 'off' : 'unknown', lw / CUBE);
      c.group.position.set(-W / 2 + 8 + gap / 2 + lw / 2 + i * (lw + gap), 10 + lw / 2, 0);
      group.add(c.group); return c;
    });
    if (tag) { group.remove(tag); tag.material.map.dispose(); tag.material.dispose(); tag = null; }
    if (label) { tag = tape(label, { bg: '#151515', size: 0.03 }); tag.position.set(0, 80, 0); group.add(tag); }
  }
  set(bits, name);
  return {
    group, set,
    setGlow(on) { lamps.forEach(l => l.setGlow(on)); },
    dispose() { lamps.forEach(l => l.dispose()); if (tag) { tag.material.map.dispose(); tag.material.dispose(); } }
  };
}

const mats = new Map();
export function M(hex, o = {}) { const k = hex + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, ...o })); return mats.get(k); }
function box(w, h, d, col, o) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(col, o)); m.userData.own = true; m.castShadow = true; return m; }

// A pad on the floor at tile (x, y), w tiles wide; label on tape above it. kind changes the colour and the posts.
const PAD_COL = { belt: 0x2f3640, stack: 0x5f3dc4, machine: 0x8a5a00, out: 0x2b8a3e, pedestal: 0x495057, rail: 0x1864ab, supply: 0x6c757d, crate: 0x8d6e4a, answer: 0x2b8a3e, lamp: 0x343a40, tray: 0x495057, target: 0xc92a2a };
export function makePad(kind, w = 1, label, opts = {}) {
  const g = new THREE.Group();
  const top = box(w * T - 12, PAD_H, T - 12, PAD_COL[kind] ?? 0x495057, { roughness: 0.5 });
  top.position.set((w - 1) * T / 2, PAD_H / 2, 0); g.add(top);
  const lip = box(w * T - 30, 3, T - 30, 0xffffff, { roughness: 0.3, transparent: true, opacity: 0.18 });
  lip.position.set((w - 1) * T / 2, PAD_H + 1, 0); g.add(lip);
  if (kind === 'stack') for (const [x, z] of [[-42, -42], [42, -42], [-42, 42], [42, 42]]) {   // a see-through tower
    const p = box(6, 380, 6, 0xd0bfff, { transparent: true, opacity: 0.6 }); p.position.set(x, PAD_H + 190, z); g.add(p);
  }
  if (kind === 'belt') for (let k = 0; k < w * 4; k++) {   // rollers
    const r = box(8, 4, T - 20, 0x868e96); r.position.set(-T / 2 + 12 + k * 25, PAD_H + 1, 0); g.add(r);
  }
  if (label) { const t = tape(label, { bg: opts.tagBg || '#151515', ink: opts.tagInk || '#f4f4f0', size: opts.tagSize || 0.026 }); t.position.set((w - 1) * T / 2, opts.tagY || 150, 0); g.add(t); }
  return g;
}

// A machine body behind its slots: x0..x1 tiles wide, one tile deep, a sign on the front and on top.
export function makeBody(wTiles, colour, sign, deco) {
  const g = new THREE.Group(), W = wTiles * T - 16;
  const body = box(W, 130, T - 16, colour, { roughness: 0.45, metalness: 0.15 }); body.position.y = 65; g.add(body);
  const stripe = box(W + 2, 14, T - 12, 0x212529); stripe.position.y = 122; g.add(stripe);
  if (deco === 'press') { const p = box(70, 60, 60, 0xadb5bd, { metalness: 0.6, roughness: 0.3 }); p.position.y = 160; g.add(p); }
  if (deco === 'gate') { const p = box(W * 0.5, 30, 50, 0x212529); p.position.y = 145; g.add(p); }
  if (deco === 'left' || deco === 'right' || deco === 'wrapL' || deco === 'wrapR') {
    // an arrow painted on the top: shift drops bits off the end, circulate wraps them round
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#212529'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#ffd43b'; x.strokeStyle = '#ffd43b'; x.lineWidth = 14;
    const L = deco === 'left' || deco === 'wrapL';
    x.beginPath(); x.moveTo(L ? 440 : 72, 64); x.lineTo(L ? 110 : 402, 64); x.stroke();
    x.beginPath(); if (L) { x.moveTo(60, 64); x.lineTo(120, 24); x.lineTo(120, 104); } else { x.moveTo(452, 64); x.lineTo(392, 24); x.lineTo(392, 104); } x.fill();
    if (deco.startsWith('wrap')) { x.beginPath(); x.arc(256, 64, 50, Math.PI * 0.15, Math.PI * 0.85, false); x.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(W - 20, (T - 30)).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex }));
    top.position.y = 131; top.userData.own = true; g.add(top);
  }
  const t = tape(sign, { bg: '#ffd43b', ink: '#1a1200', size: 0.04 }); t.position.set(0, 230, 0); g.add(t);
  return g;
}

// A flat bar on the floor from (x0, y0) to (x1, y1) in tiles: the branches of an expression tree.
export function floorBar(x0, y0, x1, y1, col = 0xced4da) {
  const ax = (x0 + 0.5) * T, az = (y0 + 0.5) * T, bx = (x1 + 0.5) * T, bz = (y1 + 0.5) * T, len = Math.hypot(bx - ax, bz - az);
  const m = new THREE.Mesh(new THREE.BoxGeometry(14, 4, len), M(col, { roughness: 0.4 })); m.userData.own = true;
  m.position.set((ax + bx) / 2, 2, (az + bz) / 2); m.rotation.y = Math.atan2(bx - ax, bz - az);
  return m;
}

export function sign(text, opts = {}) { return tape(text, { bg: opts.bg || '#151515', ink: opts.ink || '#f4f4f0', size: opts.size || 0.03 }); }
