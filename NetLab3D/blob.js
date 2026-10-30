// Gang Beasts style blob characters for Network Builder: a jelly-bean body on stubby legs with floppy two-part arms.
// Each one is a small skeleton of joints (pelvis, body, shoulders, elbows, hands, hips, feet) posed every frame:
// the body leans and wobbles on a spring, the legs step, and each arm is solved (two-bone IK) to where its hand
// should be, with the hand itself on a spring so it swings and lags like a ragdoll.
//
//   const b = createBlob(colourIndex, name); scene.add(b.group);
//   b.update(dt, { x, y, face, moving, hands: [{ down, hold }, { down, hold }] });   // x, y in tiles, face radians
// Hand 0 is the left hand, on the blob's +x side; the server puts it at the same spot (NetPlayer.HandPos).
import * as THREE from 'three';

const T = 100;
export const COLORS = [0xe5484d, 0x3e8ef7, 0x30c48d, 0xf5a524, 0xa970ff, 0xec5fb0, 0x22c3d6, 0x9ad13a, 0xf2f2f2, 0xff7a45];
const UP = new THREE.Vector3(0, 1, 0);
const UPPER = 24, FORE = 24, SHOULDER_X = 24, SHOULDER_Y = 70, HIP_X = 11, HIP_Y = 26;

function label(text) {
  // a strip of label-maker tape, like the device tags (netdevices3d.js)
  const c = document.createElement('canvas'), g = c.getContext('2d'), size = 30;
  const font = `700 ${size}px Consolas, "Lucida Console", "Courier New", monospace`;
  text = text.toUpperCase();
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + size, h = Math.ceil(size * 1.55);
  c.width = w; c.height = h;
  g.fillStyle = '#151515'; g.beginPath(); g.moveTo(6, 0); g.lineTo(w, 0); g.lineTo(w - 6, h); g.lineTo(0, h); g.closePath(); g.fill();
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#f4f4f0'; g.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(w * 0.8, h * 0.8, 1); s.renderOrder = 10;
  return s;
}

// A limb part: a unit-length cylinder stretched between two points.
const limbGeo = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0);
function limb(mat, r) { const m = new THREE.Mesh(limbGeo, mat); m.userData.r = r; m.castShadow = true; return m; }
const tmp = new THREE.Vector3();
function placeLimb(m, a, b) {
  tmp.subVectors(b, a); const len = Math.max(0.01, tmp.length());
  m.position.copy(a); m.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len)); m.scale.set(m.userData.r, len, m.userData.r);
}

// Two-bone IK: the elbow for a shoulder S reaching for P, bending towards the pole direction.
function elbowFor(S, P, pole, out) {
  const d = tmp.subVectors(P, S), dist = Math.min(d.length(), UPPER + FORE - 0.01), dir = d.normalize();
  const a = (UPPER * UPPER - FORE * FORE + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, UPPER * UPPER - a * a));
  const side = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize();
  return out.copy(S).addScaledVector(dir, a).addScaledVector(side, h);
}

function hash(s) { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h / 97; }

export function createBlob(colourIndex, name) {
  const colour = COLORS[(colourIndex ?? 0) % COLORS.length];
  const skin = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55 });
  const group = new THREE.Group();          // on the floor at the player's spot, turned to face
  const pelvis = new THREE.Group(); group.add(pelvis);
  const body = new THREE.Group(); body.position.y = HIP_Y; pelvis.add(body);   // body pivots at the hips
  // The body: a capsule made lumpy and lopsided (its own seed per player), a little wider at the bottom, so no
  // two blobs are the same and none is a perfect pill. Its vertices also sway and squash each frame (jiggle below).
  const seed = hash(name || '') + (colourIndex ?? 0) * 17.3;
  const beanGeo = new THREE.CapsuleGeometry(30, 42, 10, 24);
  const pos = beanGeo.attributes.position, base = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x), t = (y + 51) / 102;   // around, and from the bottom (0) to the top (1)
    const lump = 1 + 0.07 * Math.sin(a * 2 + seed) + 0.05 * Math.sin(a * 3 + y * 0.09 + seed * 1.7) + 0.04 * Math.sin(y * 0.13 + seed * 2.3);
    const belly = 1 + 0.12 * (1 - t) * (1 - t) - 0.05 * t;                 // pear-shaped: heavier at the bottom
    x *= lump * belly * (1 + 0.04 * Math.sin(seed)); z *= lump * belly * 0.94;
    y += 3 * Math.sin(a + seed * 0.7) * (1 - Math.abs(t - 0.5) * 2);      // a slight lean in the middle
    base[3 * i] = x; base[3 * i + 1] = y; base[3 * i + 2] = z;
    pos.setXYZ(i, x, y, z);
  }
  beanGeo.computeVertexNormals();
  const bean = new THREE.Mesh(beanGeo, skin);
  bean.position.y = 52; bean.castShadow = true; body.add(bean);
  // A face: two eyes near the top, looking forward (+z).
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }), black = new THREE.MeshBasicMaterial({ color: 0x111111 });
  for (const sx of [-11, 11]) {
    const r = 7 + 0.9 * Math.sin(seed + sx), ey = 78 + 1.5 * Math.sin(seed * 3 + sx);   // eyes not quite a pair
    const eye = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), white); eye.position.set(sx, ey, 26); body.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), black); pupil.position.set(sx, ey, 26 + r - 1.5); body.add(pupil);
  }
  const shoulders = [new THREE.Object3D(), new THREE.Object3D()];
  shoulders[0].position.set(SHOULDER_X, SHOULDER_Y - HIP_Y, 0); shoulders[1].position.set(-SHOULDER_X, SHOULDER_Y - HIP_Y, 0);
  body.add(...shoulders);
  const parts = new THREE.Group(); group.add(parts);   // limbs are placed in the group's space each frame
  const arms = [0, 1].map(() => {
    const up = limb(skin, 9), fore = limb(skin, 8.5);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(11, 14, 10), skin); hand.castShadow = true;
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(8.6, 10, 8), skin);
    parts.add(up, fore, hand, elbow);
    return { up, fore, hand, elbow, p: null, v: new THREE.Vector3(), E: new THREE.Vector3() };
  });
  const legs = [0, 1].map(() => {
    const l = limb(skin, 11), foot = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 8).scale(1, 0.7, 1.3), skin);
    foot.castShadow = true; parts.add(l, foot); return { l, foot };
  });
  const tag = label(name || ''); tag.position.y = 150; tag.visible = !!name; group.add(tag);

  // State that springs and lags.
  let x = null, y = null, heading = 0, phase = 0, walk = 0;
  const lean = new THREE.Vector2(), leanV = new THREE.Vector2(), jig = { x: 0, z: 0 };
  let clock = seed, frame = 0;
  let lastX = 0, lastY = 0;
  const S = new THREE.Vector3(), P = new THREE.Vector3(), want = new THREE.Vector3(), pole = new THREE.Vector3();
  const hipW = new THREE.Vector3(), footW = new THREE.Vector3();

  function update(dt, st, self = false) {
    dt = Math.min(0.05, Math.max(0.001, dt));
    // follow the target: instantly for yourself, smoothly for others
    if (x == null || self) { x = st.x; y = st.y; }
    else { const k = 1 - Math.exp(-dt * 14); x += (st.x - x) * k; y += (st.y - y) * k; }
    const dh = Math.atan2(Math.sin(st.face - heading), Math.cos(st.face - heading));
    heading += dh * Math.min(1, dt * 10);
    group.position.set(x * T + T / 2, 0, y * T + T / 2);
    group.rotation.y = heading;
    // speed in the blob's own frame (forward +z, left +x)
    const vx = (x - lastX) / dt, vy = (y - lastY) / dt; lastX = x; lastY = y;
    const c = Math.cos(heading), s = Math.sin(heading);
    const fwd = vx * s + vy * c, side = vx * c - vy * s, speed = Math.hypot(vx, vy);
    walk += ((st.moving || speed > 0.5 ? 1 : 0) - walk) * Math.min(1, dt * 8);
    phase += dt * (6 + speed * 2.2) * walk;
    // body: leans into the walk on a wobbly spring, bobs with each step
    const tx = Math.max(-0.35, Math.min(0.35, fwd * 0.07)), tz = Math.max(-0.3, Math.min(0.3, -side * 0.06));
    leanV.x += ((tx - lean.x) * 90 - leanV.x * 9) * dt; leanV.y += ((tz - lean.y) * 90 - leanV.y * 9) * dt;
    lean.x += leanV.x * dt; lean.y += leanV.y * dt;
    body.rotation.set(lean.x, 0, lean.y + Math.sin(phase) * 0.06 * walk);
    pelvis.position.y = Math.abs(Math.sin(phase)) * 5 * walk;
    // jiggle: the top of the body lags behind its movement and the whole bean squashes with each step
    jig.x += ((-leanV.y * 14) - jig.x) * Math.min(1, dt * 10); jig.z += ((leanV.x * 14) - jig.z) * Math.min(1, dt * 10);
    const squash = Math.sin(phase * 2) * 0.05 * walk, wob = Math.sin(clock * 9) * Math.min(1, Math.hypot(leanV.x, leanV.y)) * 3;
    for (let i = 0; i < pos.count; i++) {
      const bx = base[3 * i], by = base[3 * i + 1], bz = base[3 * i + 2], t = Math.max(0, (by + 51) / 102), k = t * t;
      const sq = 1 - squash * 0.6;
      pos.setXYZ(i, bx * (1 + squash * 0.5) + jig.x * k + wob * k * 0.5, by * sq, bz * (1 + squash * 0.5) + jig.z * k);
    }
    pos.needsUpdate = true; clock += dt;
    if ((frame = (frame + 1) % 6) === 0) beanGeo.computeVertexNormals();
    group.updateMatrixWorld(true);
    // legs: stubby, stepping
    legs.forEach((g, i) => {
      const sgn = i === 0 ? 1 : -1, ph = phase + (i ? Math.PI : 0);
      hipW.set(sgn * HIP_X, HIP_Y + pelvis.position.y, 0);
      footW.set(sgn * HIP_X * 1.1, Math.max(0, Math.cos(ph)) * 12 * walk + 5, Math.sin(ph) * 16 * walk);
      placeLimb(g.l, hipW, footW); g.foot.position.copy(footW);
    });
    // arms: each hand springs towards its target, the elbow is solved between
    arms.forEach((a, i) => {
      const sgn = i === 0 ? 1 : -1, hand = st.hands?.[i] || {};
      shoulders[i].getWorldPosition(S); group.worldToLocal(S);
      if (hand.down) {
        // reaching forward (where the server's hand is: 42 forward, 20 to the side), a little lower when carrying
        want.set(sgn * 20, hand.hold ? 58 : 66 + Math.sin(phase * 0.5 + i) * 3, 42);
      } else {
        // dangling, swinging with the walk
        want.set(S.x + sgn * 6, S.y - 44, S.z + Math.sin(phase + (i ? 0 : Math.PI)) * 14 * walk);
      }
      if (!a.p) a.p = want.clone();
      const stiff = hand.down ? 220 : 60, damp = hand.down ? 22 : 7;
      a.v.addScaledVector(P.subVectors(want, a.p), stiff * dt).multiplyScalar(Math.max(0, 1 - damp * dt));
      a.p.addScaledVector(a.v, dt);
      // keep the hand within reach of the shoulder
      P.subVectors(a.p, S); const max = UPPER + FORE - 0.5;
      if (P.length() > max) a.p.copy(S).addScaledVector(P.normalize(), max);
      pole.set(sgn * 0.8, -0.6, -0.3);
      elbowFor(S, a.p, pole, a.E);
      placeLimb(a.up, S, a.E); placeLimb(a.fore, a.E, a.p);
      a.elbow.position.copy(a.E); a.hand.position.copy(a.p);
      a.hand.scale.setScalar(hand.down ? 1.12 : 1);   // a fist that grips
    });
  }

  function dispose() { group.traverse(o => { if (o.geometry && o.geometry !== limbGeo) o.geometry.dispose(); o.material?.map?.dispose?.(); }); }
  return { group, update, dispose };
}
