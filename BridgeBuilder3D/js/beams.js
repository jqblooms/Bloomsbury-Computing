// Data Bridge 3D art: the BRIDGE the team built, in 3D.
//   drawBridge(group, design, sim, z0) draws into group (clear it first). Called whenever the design changes, and EVERY
//   FRAME while the cart is crossing (then sim is live: sim.P = node positions, sim.B[i] = beams with .broken and
//   .stress 0..1+). So make the per-frame path cheap (reuse meshes, update matrices; avoid creating geometry per frame).
// design = { nodes: [{ x, y, fixed }], beams: [{ a, b, mat: 'road' | 'wood' | 'steel' }] } in squares. Road beams are
// the deck the cart rolls on (span the lane's middle, about 2.3 squares wide); wood and steel are the supports (a truss
// each side of the cart, z = MID_Z +-1.2). Gold fixed nodes are the anchors on the banks. Lane middle: z0 + MID_Z * T.
// How it is built: one InstancedMesh per part (asphalt deck, kerbs, timber, girders, bolts, joints, anchor plates) per
// lane group, made only when the design's shape changes (group.userData.b3 holds them). Every other call just moves
// the instances to the live node positions and writes each beam's stress into its instance colour, which the shared
// materials turn into an orange-to-red tint (instanceColor.r = stress; 1 = about to snap). Broken beams scale to 0.
import * as THREE from 'three';
import { T, MID_Z, MAT_COL, canvasTex } from './util.js';

const SIDE = 1.65, DECK_W = 3.1, DECK_H = 0.18, KERB_Z = 1.45, KERB_W = 0.16, KERB_H = 0.13;   // wide enough for the cart: its wheels reach 1.26 squares from the middle
const WOOD_H = 0.19, WOOD_W = 0.17, GIRD_H = 0.22, GIRD_W = 0.18, JOINT_R = 0.15, JOINT_L = 0.3;

// --- textures (canvas, made once). Features run along the beam (u) only, so stretching a beam never distorts them.
const asphaltTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = MAT_COL.road; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 60 + Math.random() * 50 | 0; g.fillStyle = `rgba(${v},${v + 4},${v + 10},.55)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#f1f3f5'; g.fillRect(0, h * 0.14, w, 5); g.fillRect(0, h * 0.86 - 5, w, 5);
  g.fillStyle = '#ffd43b'; g.fillRect(0, h / 2 - 3, w, 2); g.fillRect(0, h / 2 + 2, w, 2);
});
const woodTex = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = MAT_COL.wood; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) {
    const y0 = Math.random() * h, a = 1 + Math.random() * 3, f = 0.01 + Math.random() * 0.03, p = Math.random() * 6;
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(110,62,22,.45)' : 'rgba(240,190,120,.35)'; g.lineWidth = 1 + Math.random() * 2;
    g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + p) * a; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  }
  g.fillStyle = 'rgba(90,50,18,.55)'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
});
const steelTex = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = MAT_COL.steel; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 0, w, 6);
  g.fillStyle = 'rgba(20,40,70,.25)'; g.fillRect(0, h - 6, w, 6);
});
const capTex = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#4a5563'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6b7685'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill();
  g.fillStyle = '#c9d1db'; g.beginPath(); g.arc(32, 32, 10, 0, 7); g.fill();
  g.fillStyle = '#8a95a3'; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.arc(32 + Math.cos(a) * 19, 32 + Math.sin(a) * 19, 3.2, 0, 7); g.fill(); }
});

// --- materials (shared). instanceColor.r carries the stress; the shader turns it into a warning tint and glow.
function stressy(m) {
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <color_fragment>', `
        float bS = 0.0;
        #if defined( USE_COLOR )
          bS = clamp((vColor.r - 0.3) / 0.7, 0.0, 1.0);
        #endif
        vec3 bC = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.1, 0.04), smoothstep(0.45, 1.0, bS));
        diffuseColor.rgb = mix(diffuseColor.rgb, bC, bS * 0.85);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += bC * bS * bS * 0.55;');
  };
  m.customProgramCacheKey = () => 'b3stress';
  return m;
}
const M = {
  deck: stressy(new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.9 })),
  kerb: stressy(new THREE.MeshStandardMaterial({ color: '#e9e4d6', roughness: 0.8 })),
  wood: stressy(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 })),
  steel: stressy(new THREE.MeshStandardMaterial({ map: steelTex, roughness: 0.45, metalness: 0.25 })),
  bolt: stressy(new THREE.MeshStandardMaterial({ color: '#dfe6ee', roughness: 0.3, metalness: 0.5 })),
  joint: [new THREE.MeshStandardMaterial({ color: '#4a5563', roughness: 0.5, metalness: 0.3 }), new THREE.MeshStandardMaterial({ map: capTex, roughness: 0.5, metalness: 0.2 })],
  gold: new THREE.MeshStandardMaterial({ color: '#ffc94a', roughness: 0.35, metalness: 0.35, emissive: '#5a3a00', emissiveIntensity: 0.35 }),
};
M.joint.push(M.joint[1]);

// --- geometry (shared; unit length along x so a beam is just a scale)
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const girderGeo = (() => { // an I-beam: flanges top and bottom, a thin web, 1 long (x) x 1 tall (y) x 1 wide (z)
  const s = new THREE.Shape(), f = 0.2, wb = 0.16;
  s.moveTo(-0.5, -0.5); s.lineTo(0.5, -0.5); s.lineTo(0.5, -0.5 + f); s.lineTo(wb, -0.5 + f); s.lineTo(wb, 0.5 - f); s.lineTo(0.5, 0.5 - f);
  s.lineTo(0.5, 0.5); s.lineTo(-0.5, 0.5); s.lineTo(-0.5, 0.5 - f); s.lineTo(-wb, 0.5 - f); s.lineTo(-wb, -0.5 + f); s.lineTo(-0.5, -0.5 + f); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); // shape in (z, y), extruded along x
  g.translate(0, 0, -0.5); g.rotateY(Math.PI / 2);
  const uv = g.attributes.uv, p = g.attributes.position; // simple uvs: u along the beam, v up
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) + 0.5, p.getY(i) + 0.5);
  g.computeVertexNormals(); return g;
})();
const boltGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6).rotateX(Math.PI / 2);
const jointGeo = new THREE.CylinderGeometry(1, 1, 1, 18).rotateX(Math.PI / 2);

// --- per lane: instanced parts, rebuilt only when the design's shape changes
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function inst(geo, mat, n, stress) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); m.count = n; m.frustumCulled = false;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (stress) { m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n) * 3), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage); }
  return m;
}
function shapeKey(d) {
  let h = d.nodes.length * 7919 + d.beams.length;
  for (const n of d.nodes) h = (h * 31 + Math.round(n.x * 100) * 7 + Math.round(n.y * 100) * 13 + (n.fixed ? 1 : 0)) | 0;
  for (const b of d.beams) h = (h * 31 + b.a * 3 + b.b * 5 + (b.mat === 'road' ? 1 : b.mat === 'steel' ? 2 : 3)) | 0;
  return h;
}
function dispose(st) { for (const m of st.meshes) { m.parent && m.parent.remove(m); m.dispose(); } }
function build(g, d) {
  const cnt = { road: 0, wood: 0, steel: 0 }, used = new Set();
  d.beams.forEach(b => { cnt[b.mat in cnt ? b.mat : 'wood']++; used.add(b.a); used.add(b.b); });
  const joints = [], anchors = [];
  d.nodes.forEach((n, i) => { if (n.fixed) anchors.push(i); else if (used.has(i)) joints.push(i); });
  const st = {
    d, key: shapeKey(d), joints, anchors,
    deck: inst(unitBox, M.deck, cnt.road, 1), kerb: inst(unitBox, M.kerb, cnt.road * 2, 1),
    wood: inst(unitBox, M.wood, cnt.wood * 2, 1), steel: inst(girderGeo, M.steel, cnt.steel * 2, 1), bolt: inst(boltGeo, M.bolt, cnt.steel * 8, 1),
    joint: inst(jointGeo, M.joint, joints.length * 2), plate: inst(unitBox, M.gold, anchors.length * 3), pin: inst(jointGeo, M.joint, anchors.length * 2),
  };
  st.meshes = [st.deck, st.kerb, st.wood, st.steel, st.bolt, st.joint, st.plate, st.pin];
  for (const m of st.meshes) g.add(m);
  return st;
}
const put = (mesh, i, x, y, z, ang, sx, sy, sz) => {
  _p.set(x, y, z); _q.setFromAxisAngle(_z, ang); _s.set(sx, sy, sz); mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
};
const tint = (mesh, i, s) => { mesh.instanceColor.array[i * 3] = s; };

export function drawBridge(g, d, sim, z0) {
  let st = g.userData.b3;
  if (!d) { if (st) { dispose(st); g.userData.b3 = null; } while (g.children.length) g.remove(g.children[0]); return; }
  if (!st || st.d !== d || st.key !== shapeKey(d)) {
    if (st) dispose(st);
    while (g.children.length) g.remove(g.children[0]);
    st = g.userData.b3 = build(g, d);
  }
  const P = sim ? sim.P : d.nodes, zm = z0 + MID_Z * T;
  const c = { road: 0, wood: 0, steel: 0 };
  d.beams.forEach((bm, i) => {
    const mat = bm.mat in c ? bm.mat : 'wood', k = c[mat]++, B = sim ? sim.B[i] : null, broken = !!(B && B.broken), s = B ? B.stress || 0 : 0;
    const a = P[bm.a], b = P[bm.b], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const cx = (a.x + b.x) / 2 * T, cy = (a.y + b.y) / 2 * T, L = len * T, ux = dx / (len || 1), uy = dy / (len || 1);
    if (mat === 'road') {
      if (broken) { st.deck.setMatrixAt(k, ZERO); st.kerb.setMatrixAt(k * 2, ZERO); st.kerb.setMatrixAt(k * 2 + 1, ZERO); return; }
      // the deck's TOP is the beam line (the physics rolls the wheels on the line), so the deck hangs just below it
      const dh = DECK_H / 2 * T;
      put(st.deck, k, cx + uy * dh, cy - ux * dh, zm, ang, L, DECK_H * T, DECK_W * T); tint(st.deck, k, s);
      const ky = KERB_H / 2 * T; // kerbs sit on top of the deck at both edges
      for (let j = 0; j < 2; j++) { put(st.kerb, k * 2 + j, cx - uy * ky, cy + ux * ky, zm + (j ? KERB_Z : -KERB_Z) * T, ang, L, KERB_H * T, KERB_W * T); tint(st.kerb, k * 2 + j, s); }
      return;
    }
    const mesh = st[mat], h = mat === 'steel' ? GIRD_H : WOOD_H, w = mat === 'steel' ? GIRD_W : WOOD_W;
    for (let j = 0; j < 2; j++) {
      const z = zm + (j ? SIDE : -SIDE) * T;
      if (broken) mesh.setMatrixAt(k * 2 + j, ZERO); else { put(mesh, k * 2 + j, cx, cy, z, ang, L, h * T, w * T); tint(mesh, k * 2 + j, s); }
      if (mat === 'steel') for (let e = 0; e < 4; e++) { // two bolts near each end, through the web
        const bi = k * 8 + j * 4 + e, along = (e < 2 ? -1 : 1) * (len / 2 - Math.min(0.28, len * 0.25)), off = (e & 1 ? 1 : -1) * 0.05;
        if (broken) { st.bolt.setMatrixAt(bi, ZERO); continue; }
        put(st.bolt, bi, cx + (ux * along - uy * off) * T, cy + (uy * along + ux * off) * T, z, ang, T, T, w * 1.25 * T); tint(st.bolt, bi, s);
      }
    }
  });
  st.joints.forEach((ni, k) => { const p = P[ni]; for (let j = 0; j < 2; j++) put(st.joint, k * 2 + j, p.x * T, p.y * T, zm + (j ? SIDE : -SIDE) * T, 0, JOINT_R * T, JOINT_R * T, JOINT_L * T); });
  st.anchors.forEach((ni, k) => { // gold plates: a base slab on the bank and an upright plate each side, with a pin
    const p = d.nodes[ni], x = p.x * T, y = p.y * T;
    put(st.plate, k * 3, x, y - 0.17 * T, zm, 0, 0.8 * T, 0.1 * T, (DECK_W + 0.5) * T);
    for (let j = 0; j < 2; j++) {
      const z = zm + (j ? SIDE + 0.12 : -SIDE - 0.12) * T;
      put(st.plate, k * 3 + 1 + j, x, y - 0.06 * T, z, 0, 0.55 * T, 0.42 * T, 0.07 * T);
      put(st.pin, k * 2 + j, x, y, zm + (j ? SIDE : -SIDE) * T, 0, JOINT_R * 1.05 * T, JOINT_R * 1.05 * T, (JOINT_L + 0.1) * T);
    }
  });
  for (const m of st.meshes) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
}
