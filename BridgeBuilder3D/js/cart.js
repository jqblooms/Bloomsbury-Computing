// Data Bridge 3D art: the CART the team rides across (it is the website's truck; the physics drives its two wheels).
//   makeCart(teamIndex) -> { group, setPose(pose: { x, y, ang } in squares, shake: world units, t: seconds), seat(k) -> { lx, lz } }
// pose.x, pose.y = the middle of the axle line at the bottom of the wheels; ang = slope in radians (rotation about z).
// Wheel centres are at lx = -AXLE/2 and +AXLE/2 (AXLE = 2.4 squares), radius WHEEL_R = 0.45. Riders (blob avatars
// about 1.2 squares tall) stand IN the cart: seat(k) gives rider k's spot (k = 0..5) in squares, lx along the cart from
// its middle, lz across it (keep |lz| < 0.8); the riders stand at the cart floor height Ph.WHEEL_R + 0.55 above pose.y.
// The group is placed by the caller at the lane's middle (z); setPose moves and tilts it.
// Look: a chunky toy mine cart in the team colour, low tub walls (riders stay visible), yellow grab rails along both
// sides, four big wheels with yellow spokes that turn with the distance travelled, headlights with a glow, red tail
// lights, the team number on both sides and a waving team flag at the back.
import * as THREE from 'three';
import { Ph, T, TEAM_COL, canvasTex } from './util.js';

const R = Ph.WHEEL_R, FLOOR = R + 0.55;            // floor top (squares above pose.y)
const HL = 1.6, HW = 0.9, WALL_H = 0.36, WT = 0.1; // tub half length, half width, wall height above floor, wall thickness
const WZ = HW + 0.2;                               // wheel centre z (outside the tub)
const SEATS = [[-0.8, -0.42], [0, 0.42], [0.8, -0.42], [-0.8, 0.42], [0, -0.42], [0.8, 0.42]];

// shared geometry and materials (module level, reused by every cart)
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 20);
const ball = new THREE.SphereGeometry(1, 10, 8);
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...o });
const mat = {
  dark: M('#2b303b', { roughness: 0.8 }), tyre: M('#1d2129', { roughness: 0.95, flatShading: true }),
  rim: M('#c9d1db', { metalness: 0.4, roughness: 0.4 }), yellow: M('#ffd43b', { roughness: 0.4 }),
  white: M('#f8f9fa'), steel: M('#868e96', { metalness: 0.5, roughness: 0.35 }), wood: M('#b07a43', { roughness: 0.9 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff8d6', emissive: '#ffe066', emissiveIntensity: 1.6 }),
  tail: new THREE.MeshStandardMaterial({ color: '#ff6b6b', emissive: '#f03e3e', emissiveIntensity: 1.2 }),
};
const glowTex = canvasTex(64, 64, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,245,200,1)'); r.addColorStop(0.35, 'rgba(255,230,140,.45)'); r.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});
const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const teamMats = new Map();
function teamMat(i) {
  if (teamMats.has(i)) return teamMats.get(i);
  const col = TEAM_COL[i % TEAM_COL.length], dark = new THREE.Color(col).multiplyScalar(0.62), num = String(i + 1);
  const numTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 5, 0, Math.PI * 2); g.fill();
    g.lineWidth = 8; g.strokeStyle = '#1d2129'; g.stroke();
    g.fillStyle = col; g.font = '900 92px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, w / 2, h / 2 + 5);
  });
  const flagTex = canvasTex(128, 80, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(0, h - 14, w, 6);
    g.font = '900 54px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num, w * 0.55, h / 2 - 5);
  });
  const m = {
    body: M(col, { roughness: 0.45 }), trim: M('#' + dark.getHexString(), { roughness: 0.5 }),
    num: new THREE.MeshBasicMaterial({ map: numTex, transparent: true }),
    flag: new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 }),
  };
  teamMats.set(i, m); return m;
}

function part(geo, material, parent, sx, sy, sz, x, y, z) { // sizes and positions in squares
  const m = new THREE.Mesh(geo, material); m.scale.set(sx * T, sy * T, sz * T); m.position.set(x * T, y * T, z * T); parent.add(m); return m;
}
function rod(material, parent, r, len, x, y, z, axis) {     // a cylinder, upright or along x or z
  const m = part(cyl, material, parent, r, len, r, x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2; return m;
}
function makeWheel(parent, x, z) {
  const w = new THREE.Group(); w.position.set(x * T, R * T, z * T); parent.add(w);
  rod(mat.tyre, w, R, 0.32, 0, 0, 0, 'z');
  rod(mat.rim, w, R * 0.66, 0.34, 0, 0, 0, 'z');
  for (let k = 0; k < 3; k++) { const s = part(box, mat.yellow, w, R * 1.3, 0.1, 0.37, 0, 0, 0); s.rotation.z = (k * Math.PI) / 3; }
  rod(mat.dark, w, 0.11, 0.39, 0, 0, 0, 'z');
  return w;
}

export function makeCart(i) {
  const tm = teamMat(i), group = new THREE.Group();
  const body = new THREE.Group(); group.add(body);   // everything above the wheels (rattles a little on bumps)
  const fl = FLOOR, top = fl + WALL_H;

  // chassis and axles
  part(box, mat.dark, body, 2 * HL - 0.4, 0.26, 1.1, 0, R + 0.05, 0);
  for (const ax of [-Ph.AXLE / 2, Ph.AXLE / 2]) rod(mat.steel, body, 0.07, 2 * WZ, ax, R, 0, 'z');
  // tub: plank floor, low walls with a white stripe, darker rim, team number on both sides
  part(box, mat.wood, body, 2 * HL - 0.1, 0.06, 2 * HW - 0.1, 0, fl - 0.03, 0);
  part(box, tm.trim, body, 2 * HL, 0.24, 2 * HW, 0, fl - 0.18, 0);
  for (const sz of [-1, 1]) {
    const z = sz * (HW - WT / 2);
    part(box, tm.body, body, 2 * HL, WALL_H + 0.24, WT, 0, fl + (WALL_H - 0.24) / 2, z);
    part(box, mat.white, body, 2 * HL + 0.02, 0.07, WT + 0.02, 0, fl - 0.08, z);
    part(box, tm.trim, body, 2 * HL + 0.08, 0.08, WT + 0.08, 0, top, z);
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * T, 0.5 * T), tm.num);
    n.position.set(0.95 * T, (fl + 0.03) * T, sz * (HW + 0.015) * T); if (sz < 0) n.rotation.y = Math.PI; body.add(n);
  }
  for (const sx of [-1, 1]) {
    part(box, tm.body, body, WT, WALL_H + 0.24, 2 * HW, sx * (HL - WT / 2), fl + (WALL_H - 0.24) / 2, 0);
    part(box, tm.trim, body, WT + 0.08, 0.08, 2 * HW + 0.08, sx * (HL - WT / 2), top, 0);
    part(box, mat.dark, body, 0.14, 0.18, 2 * HW + 0.1, sx * (HL + 0.08), R + 0.12, 0);   // bumper
  }
  // grab rails along both sides and a front bar for the riders to hold
  const railY = fl + 0.72;
  for (const sz of [-1, 1]) {
    const z = sz * (HW - WT / 2);
    for (const px of [-HL + 0.12, -0.4, 0.4, HL - 0.12]) rod(mat.steel, body, 0.035, railY - top, px, (top + railY) / 2, z);
    rod(mat.yellow, body, 0.055, 2 * HL - 0.16, 0, railY, z, 'x');
  }
  rod(mat.yellow, body, 0.05, 2 * HW - 0.1, HL - 0.12, railY, 0, 'z');
  // headlights (front = +x, the way the cart drives) and tail lights
  for (const sz of [-1, 1]) {
    rod(mat.dark, body, 0.15, 0.1, HL + 0.04, fl - 0.12, sz * 0.55, 'x');
    rod(mat.lamp, body, 0.11, 0.06, HL + 0.1, fl - 0.12, sz * 0.55, 'x');
    const gl = new THREE.Sprite(glowMat); gl.scale.set(0.75 * T, 0.75 * T, 1); gl.position.set((HL + 0.2) * T, (fl - 0.12) * T, sz * 0.55 * T); body.add(gl);
    part(box, mat.tail, body, 0.05, 0.12, 0.22, -HL - 0.03, fl - 0.12, sz * 0.6);
  }
  // flag at the back corner
  const poleX = -HL + 0.12, poleZ = -(HW - WT / 2), poleTop = fl + 2.0;
  rod(mat.white, body, 0.03, poleTop - top, poleX, (top + poleTop) / 2, poleZ);
  part(ball, mat.yellow, body, 0.07, 0.07, 0.07, poleX, poleTop + 0.03, poleZ);
  const FW = 0.85, FH = 0.52, flagGeo = new THREE.PlaneGeometry(FW * T, FH * T, 8, 1); flagGeo.translate(-FW * T / 2, 0, 0);
  const flag = new THREE.Mesh(flagGeo, tm.flag); flag.position.set(poleX * T, (poleTop - FH / 2) * T, poleZ * T); body.add(flag);
  const fpos = flagGeo.attributes.position, fx0 = Float32Array.from({ length: fpos.count }, (_, k) => fpos.getX(k));
  // wheels
  const wheels = [];
  for (const wx of [-Ph.AXLE / 2, Ph.AXLE / 2]) for (const wz of [-WZ, WZ]) wheels.push(makeWheel(group, wx, wz));

  let lastX = null, lastY = 0, dist = 0, lastT = -1;
  return {
    group,
    setPose(pose, shake = 0, t = 0) {
      if (lastX !== null) {
        const dx = pose.x - lastX, d = Math.hypot(dx, pose.y - lastY);
        if (d < 1) dist += Math.sign(dx) * d;          // a big jump is a reset (new gap or a replay): no spin
      }
      lastX = pose.x; lastY = pose.y;
      group.position.x = pose.x * T; group.position.y = pose.y * T + shake; group.rotation.z = pose.ang;
      const spin = -dist / R; for (const w of wheels) w.rotation.z = spin;
      const a = Math.abs(shake);
      body.position.y = a ? Math.sin(t * 47) * Math.min(6, a * 0.4) : 0;
      body.rotation.x = a ? Math.sin(t * 31) * Math.min(0.03, a * 0.002) : 0;
      if (t - lastT > 0.03 || t < lastT) {             // wave the flag about 30 times a second
        lastT = t;
        for (let k = 0; k < fpos.count; k++) { const u = -fx0[k] / (FW * T); fpos.setZ(k, Math.sin(t * 6 - u * 5) * u * 0.12 * T); }
        fpos.needsUpdate = true;
      }
    },
    // two rows of three, filled in a zigzag so a small team is spread along both sides
    seat(k) { const s = SEATS[((k % 6) + 6) % 6]; return { lx: s[0], lz: s[1] }; },
  };
}
