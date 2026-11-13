// Search Buddies 3D: one little character. A round toon body with big blinking eyes, stubby arms and legs, ears or
// an antenna, and a sign on a stick held in both hands. Everything that moves is a spring, so walking, stopping,
// turning, bumping and jumping all make the body, the sign and the ears wobble.
//
//   const b = makeBuddy(kit, { colour, value, kind, searcher });  scene.add(b.root);
//   b.walkTo(x, z, speed); b.face(angle); b.pose.raise = 1; b.bump(vx, vz); b.update(dt, simDt, moving);
import * as THREE from 'three';

export const PASTELS = [0xffb3c7, 0x9fe3e0, 0xb7f0b1, 0xffe08a, 0xc9b6ff, 0xffc69e, 0xa6d4ff, 0xff9fae, 0xd6f59a, 0xf5b8ff];
const ACCENTS = [0xff6f91, 0x2bb3ad, 0x52b947, 0xf2b705, 0x8c6cf0, 0xff8c42, 0x4d9de0, 0xf2545b, 0x8fbf2f, 0xc860e0];
const GREY = 0xb9bec7, GREY_ACCENT = 0x8d939c;

// Shared geometry and materials for every buddy: one set, built once.
export function makeKit(renderer) {
  const grad = new Uint8Array([90, 170, 255]);
  const gradientMap = new THREE.DataTexture(grad, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter; gradientMap.needsUpdate = true;
  const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap });
  const body = PASTELS.map(toon), accent = ACCENTS.map(toon);
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
  const g = shadowCanvas.getContext('2d'), rg = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  rg.addColorStop(0, 'rgba(30,40,60,.38)'); rg.addColorStop(1, 'rgba(30,40,60,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  return {
    renderer, gradientMap, toon,
    body, accent, grey: toon(GREY), greyAccent: toon(GREY_ACCENT),
    searcherBody: toon(0xffa45c), searcherAccent: toon(0x3d7be0),
    white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x1d2433 }),
    cheek: new THREE.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0.75 }),
    stick: toon(0xb07a4a), boardSide: toon(0xf3e2c4),
    shadowMat: new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    eyeMat: new THREE.MeshBasicMaterial({ vertexColors: true }),
    faceMat: new THREE.MeshBasicMaterial({ vertexColors: true }),
    g: buildGeometry()
  };
}

// One geometry from several parts (fewer draw calls: 31 buddies stay smooth). parts: [geo, [x, y, z], [sx, sy, sz], colour, [rx, ry, rz]]
function merge(parts) {
  const pos = [], nor = [], col = [], c = new THREE.Color();
  for (const [geo, at = [0, 0, 0], sc = [1, 1, 1], colour, rot = [0, 0, 0]] of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...sc)));
    const a = g.attributes.position.array, n = g.attributes.normal.array;
    c.setHex(colour == null ? 0xffffff : colour, THREE.SRGBColorSpace);
    for (let i = 0; i < a.length; i++) { pos.push(a[i]); nor.push(n[i]); }
    for (let i = 0; i < a.length / 3; i++) col.push(c.r, c.g, c.b);
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}
function buildGeometry() {
  const sph = (r, w, h) => new THREE.SphereGeometry(r, w, h);
  const eyes = [];
  for (const s of [-1, 1]) {
    eyes.push([sph(0.095, 10, 8), [s * 0.13, 0, 0], [1, 1.15, 0.6], 0xffffff]);
    eyes.push([sph(0.055, 8, 6), [s * 0.13, -0.005, 0.045], [1, 1.15, 0.6], 0x1d2433]);
    eyes.push([sph(0.02, 6, 4), [s * 0.13 + 0.02, 0.025, 0.09], [1, 1, 1], 0xffffff]);
  }
  return {
    body: sph(0.4, 20, 14),
    eyes: merge(eyes),
    face: merge([
      [sph(0.055, 6, 4), [-0.23, -0.1, 0], [1, 0.6, 0.4], 0xffa3b8], [sph(0.055, 6, 4), [0.23, -0.1, 0], [1, 0.6, 0.4], 0xffa3b8],
      [new THREE.TorusGeometry(0.045, 0.013, 6, 12, Math.PI), [0, -0.1, 0.04], [1, 1, 1], 0x1d2433, [0, 0, Math.PI]]
    ]),
    arm: merge([[new THREE.CapsuleGeometry(0.06, 0.14, 3, 8), [0, -0.12, 0]], [sph(0.06, 8, 6), [0, -0.24, 0]]]),
    leg: merge([[new THREE.CapsuleGeometry(0.07, 0.1, 3, 8), [0, -0.1, 0]], [sph(0.085, 10, 6), [0, -0.19, 0.04], [0.85, 0.5, 1.15]]]),
    antenna: merge([[new THREE.CylinderGeometry(0.018, 0.022, 0.24, 6), [0, 0.12, 0]], [sph(0.06, 10, 8), [0, 0.25, 0]]]),
    ear: sph(0.11, 10, 8),
    signBack: merge([[new THREE.CylinderGeometry(0.022, 0.022, 0.62, 6), [0, -0.12, -0.02]], [new THREE.BoxGeometry(0.74, 0.48, 0.035), [0, 0.3, -0.02]]]),
    signFace: new THREE.PlaneGeometry(0.72, 0.46),
    shadow: new THREE.PlaneGeometry(1, 1),
    hat: merge([[new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), [0, 0, 0], [1, 0.75, 1]], [new THREE.CylinderGeometry(0.36, 0.36, 0.03, 18), [0, 0, 0.12], [1, 1, 0.75]]])
  };
}

// The sign's face: a value (and a small heading for the searcher's sign)
function signTexture(kit, text, small) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 164;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, kit.renderer.capabilities.getMaxAnisotropy());
  drawSign(c, text, small); t.needsUpdate = true;
  return t;
}
function drawSign(c, text, small) {
  const g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#2b3445'; g.lineWidth = 10; g.strokeRect(5, 5, c.width - 10, c.height - 10);
  g.fillStyle = '#1d2433'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = small ? 96 : 120;
  const font = s => '800 ' + s + 'px "Segoe UI", Arial, sans-serif';
  g.font = font(size);
  while (g.measureText(text).width > 226 && size > 40) { size -= 4; g.font = font(size); }
  if (small) {
    g.font = '700 34px "Segoe UI", Arial, sans-serif'; g.fillStyle = '#3d7be0'; g.fillText(small, c.width / 2, 34);
    g.font = font(size); g.fillStyle = '#1d2433'; g.fillText(text, c.width / 2, 104);
  } else g.fillText(text, c.width / 2, c.height / 2 + 6);
}

// A damped spring towards 0 (or a target): x'' = -k (x - target) - d x'
function spring(k, d) { return { x: 0, v: 0, k, d }; }
function stepSpring(s, target, dt) { s.v += (-s.k * (s.x - target) - s.d * s.v) * dt; s.x += s.v * dt; }

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (cur, goal, rate, dt) => cur + (goal - cur) * (1 - Math.exp(-rate * dt));

export function makeBuddy(kit, opt) {
  const G = kit.g, idx = opt.colour % PASTELS.length;
  const bodyMat = opt.searcher ? kit.searcherBody : kit.body[idx];
  const accentMat = opt.searcher ? kit.searcherAccent : kit.accent[idx];
  const root = new THREE.Group();
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  const shadow = mesh(G.shadow, kit.shadowMat, root, 0, 0.006, 0); shadow.rotation.x = -Math.PI / 2; shadow.scale.set(0.95, 0.75, 1);
  const hips = new THREE.Group(); root.add(hips);
  const body = new THREE.Group(); hips.add(body);              // squash, lean and look-around
  const scale = opt.searcher ? 1.04 : 1;
  root.scale.setScalar(scale);
  const blob = mesh(G.body, bodyMat, body, 0, 0.42, 0); blob.scale.set(1, 1.1, 0.92);
  // face: both eyes are one mesh (so they blink together); cheeks and mouth another
  const face = new THREE.Group(); face.position.set(0, 0.6, 0.3); body.add(face);
  const eyeMesh = mesh(G.eyes, kit.eyeMat, face);
  mesh(G.face, kit.faceMat, face);
  // ears or an antenna: each on a springy pivot
  const bits = [];
  const kind = opt.kind % 3;
  if (opt.searcher) {
    const hat = new THREE.Group(); hat.position.set(0, 0.8, -0.02); body.add(hat);
    mesh(G.hat, accentMat, hat);
    const piv = new THREE.Group(); piv.position.set(0, 0.2, 0); hat.add(piv);
    mesh(G.antenna, accentMat, piv).scale.set(0.9, 0.75, 0.9);
    bits.push({ g: piv, rx: spring(70, 3.2), rz: spring(70, 3.2), base: 0 });
  } else if (kind === 0) {
    for (const s of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(s * 0.13, 0.8, 0); piv.rotation.z = -s * 0.35; body.add(piv);
      mesh(G.antenna, accentMat, piv);
      bits.push({ g: piv, rx: spring(60, 2.6), rz: spring(60, 2.6), base: -s * 0.35 });
    }
  } else {
    for (const s of [-1, 1]) {
      const piv = new THREE.Group(); piv.position.set(s * 0.24, 0.74, 0); piv.rotation.z = -s * 0.5; body.add(piv);
      const ear = mesh(G.ear, kind === 1 ? bodyMat : accentMat, piv, 0, 0.09, 0); ear.scale.set(kind === 1 ? 0.8 : 0.55, kind === 1 ? 0.8 : 1.35, 0.5);
      bits.push({ g: piv, rx: spring(80, 3.5), rz: spring(80, 3.5), base: -s * 0.5 });
    }
  }
  // the sign on its stick, held in front of the belly
  const signPivot = new THREE.Group(); body.add(signPivot);
  const signMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: signTexture(kit, String(opt.value), opt.small) });
  mesh(G.signBack, kit.stick, signPivot);
  mesh(G.signFace, signMat, signPivot, 0, 0.3, 0.0);
  // arms reach the stick; legs stand on the floor
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.33, 0.4, 0.06); body.add(sh);
    mesh(G.arm, bodyMat, sh);
    arms.push({ g: sh, s });
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(s * 0.15, 0.02, 0); hips.add(hp);
    mesh(G.leg, bodyMat, hp);
    legs.push({ g: hp, s });
  }

  const LEG = 0.22;
  const b = {
    root, value: opt.value, searcher: !!opt.searcher, solid: true,
    pos: { x: 0, z: 0 }, vel: { x: 0, z: 0 }, heading: 0, faceTo: 0,
    goal: null, speed: 1.4, arrived: true,
    y: 0, vy: 0, grounded: true,
    pose: { raise: 0, push: 0, shrug: 0, cheer: 0, sit: 0, point: 0 },
    poseNow: { raise: 0, push: 0, shrug: 0, cheer: 0, sit: 0, point: 0 },
    jumpEvery: 0, jumpT: 0,
    grey: false,
    squash: spring(160, 7), leanX: spring(110, 7), leanZ: spring(110, 7),
    signX: spring(95, 4.5), signZ: spring(95, 4.5),
    phase: Math.random() * 6, walkAmt: 0,
    blinkT: 1 + Math.random() * 3, blink: 0, lookT: 1 + Math.random() * 4, look: 0, lookGoal: 0, pupil: 0,
    breathe: Math.random() * 6, prevVel: { x: 0, z: 0 }, prevHeading: 0, t: Math.random() * 10,

    place(x, z) { b.pos.x = x; b.pos.z = z; b.goal = null; b.arrived = true; root.position.set(x, 0, z); },
    walkTo(x, z, speed) { b.goal = { x, z }; b.speed = speed || 1.4; b.arrived = false; },
    face(a) { b.faceTo = a; },
    // a shove: a push in the direction (vx, vz) and a wobble
    bump(vx, vz, strength = 1) {
      b.vel.x += vx; b.vel.z += vz;
      b.squash.v -= 2.2 * strength;
      b.kick(vx, vz, 4 * strength);
    },
    // knock the springs: (dx, dz) in the world is turned into the buddy's own front/side
    kick(dx, dz, amt) {
      const c = Math.cos(b.heading), s = Math.sin(b.heading);
      const fwd = dx * s + dz * c, side = dx * c - dz * s;
      b.leanX.v -= fwd * amt; b.leanZ.v += side * amt;
      b.signX.v -= fwd * amt * 1.3; b.signZ.v += side * amt * 1.3;
      for (const e of bits) { e.rx.v -= fwd * amt * 1.6; e.rz.v += side * amt * 1.6; }
    },
    hop(v = 3) { if (b.grounded) { b.vy = v; b.grounded = false; b.squash.v += 3; } },
    setGrey(on) {
      if (b.grey === on) return; b.grey = on;
      root.traverse(o => {
        if (!o.isMesh || o === shadow) return;
        if (!o.userData.mat) o.userData.mat = o.material;
        const m = o.userData.mat;
        if (m === bodyMat) o.material = on ? kit.grey : bodyMat;
        else if (m === accentMat) o.material = on ? kit.greyAccent : accentMat;
      });
      signMat.color.setHex(on ? 0xb4b9c1 : 0xffffff);
    },
    dispose() { signMat.map.dispose(); signMat.dispose(); },
    setValue(text, small) { drawSign(signMat.map.image, String(text), small); signMat.map.needsUpdate = true; },
    headPos(v) { return v.set(b.pos.x, (1.55 + b.y + (b.poseNow.raise * 0.45)) * scale, b.pos.z); },

    // dt: real seconds (springs, blinks); simDt: search time (walking, jumping; 0 when paused)
    update(dt, simDt) {
      b.t += dt;
      // walking towards the goal, slowing in to arrive
      if (simDt > 0) {
        if (b.goal) {
          const dx = b.goal.x - b.pos.x, dz = b.goal.z - b.pos.z, d = Math.hypot(dx, dz);
          if (d < 0.02) { b.goal = null; b.arrived = true; }
          else {
            const sp = Math.min(b.speed, d * 3.2 + 0.15);
            const k = 1 - Math.exp(-7 * simDt);
            b.vel.x += (dx / d * sp - b.vel.x) * k; b.vel.z += (dz / d * sp - b.vel.z) * k;
          }
        }
        if (!b.goal) { const f = Math.exp(-4.5 * simDt); b.vel.x *= f; b.vel.z *= f; }
        b.pos.x += b.vel.x * simDt; b.pos.z += b.vel.z * simDt;
        // jumping
        if (b.jumpEvery > 0 && b.grounded) { b.jumpT -= simDt; if (b.jumpT <= 0) { b.hop(2.6 + Math.random() * 0.8); b.jumpT = b.jumpEvery * (0.7 + Math.random() * 0.6); } }
        if (!b.grounded) {
          b.vy -= 11 * simDt; b.y += b.vy * simDt;
          if (b.y <= 0) { b.y = 0; b.grounded = true; b.squash.v -= Math.min(5, Math.abs(b.vy) * 1.3); b.signX.v += 2; for (const e of bits) e.rx.v += 3; b.vy = 0; }
        }
      }
      const spd = Math.hypot(b.vel.x, b.vel.z);
      // turning: face where you walk, else where you are told
      const want = (b.goal && spd > 0.25) ? Math.atan2(b.vel.x, b.vel.z) : b.faceTo;
      const before = b.heading;
      b.heading += wrap(want - b.heading) * (1 - Math.exp(-9 * Math.max(dt * 0.5, simDt)));
      const yawRate = dt > 0 ? wrap(b.heading - before) / dt : 0;
      // the springs feel the change in speed (acceleration) and the turning
      if (dt > 0) {
        const ax = (b.vel.x - b.prevVel.x) / dt, az = (b.vel.z - b.prevVel.z) / dt;
        const c = Math.cos(b.heading), s = Math.sin(b.heading);
        const fwd = ax * s + az * c, side = ax * c - az * s;
        const f = Math.min(1, dt * 60) * 0.018;
        b.leanX.v -= fwd * f * 1.4; b.leanZ.v += side * f * 1.4;
        b.signX.v -= fwd * f * 2.2; b.signZ.v += side * f * 2 - yawRate * 0.05;
        for (const e of bits) { e.rx.v -= fwd * f * 3; e.rz.v += side * f * 3 + yawRate * 0.12; }
      }
      b.prevVel.x = b.vel.x; b.prevVel.z = b.vel.z;
      // pose blending
      for (const k in b.pose) b.poseNow[k] = ease(b.poseNow[k], b.pose[k], 7, dt);
      const P = b.poseNow;
      // walk cycle: the stride follows the distance walked
      b.walkAmt = ease(b.walkAmt, Math.min(1, spd / 0.9) * (b.goal ? 1 : 0.35), 10, dt);
      b.phase += spd * simDt * 7.5;
      // breathing and blinking and looking around (never stops, even when paused)
      b.breathe += dt * (b.grey ? 1.6 : 2.3);
      const breath = Math.sin(b.breathe) * 0.03;
      stepSpring(b.squash, breath + P.shrug * 0.06 - P.sit * 0.04, dt);
      const lean = P.push * 0.32;
      stepSpring(b.leanX, lean - P.sit * 0.1, dt); stepSpring(b.leanZ, P.shrug * 0.12, dt);
      stepSpring(b.signX, 0, dt); stepSpring(b.signZ, 0, dt);
      for (const e of bits) { stepSpring(e.rx, 0, dt); stepSpring(e.rz, 0, dt); }
      b.blinkT -= dt;
      if (b.blinkT <= 0) { b.blink = 0.14; b.blinkT = 1.8 + Math.random() * 3.5; if (Math.random() < 0.18) b.blinkT = 0.25; }
      b.blink = Math.max(0, b.blink - dt);
      b.lookT -= dt;
      if (b.lookT <= 0) { b.lookGoal = Math.random() < 0.45 ? 0 : (Math.random() - 0.5) * 1.1; b.lookT = 1.5 + Math.random() * 4; }
      const busy = b.goal || P.raise > 0.3 || P.push > 0.3 || P.cheer > 0.3;
      b.look = ease(b.look, busy ? 0 : b.lookGoal, 3, dt);

      // ---- apply to the model
      root.position.set(b.pos.x, 0, b.pos.z);
      root.rotation.y = b.heading;
      const bob = Math.abs(Math.sin(b.phase)) * 0.07 * b.walkAmt;
      hips.position.y = LEG + b.y + bob - P.sit * 0.17;
      const sq = b.squash.x;
      body.scale.set(1 - sq * 0.5, 1 + sq, 1 - sq * 0.5);
      body.rotation.set(b.leanX.x, b.look * 0.5, b.leanZ.x + Math.sin(b.phase) * 0.07 * b.walkAmt);
      face.position.x = b.look * 0.05;
      const blinkS = b.blink > 0 ? 0.12 : 1;
      eyeMesh.scale.y = ease(eyeMesh.scale.y, blinkS, 40, dt); eyeMesh.position.x = b.look * 0.03;
      for (const e of bits) { e.g.rotation.x = e.rx.x; e.g.rotation.z = e.base + e.rz.x; }
      // sign: in front of the belly; up over the head to show it; down while pushing or shrugging
      const up = P.raise, down = Math.max(P.push, P.shrug) * 0.6;
      signPivot.position.set(0, lerp(0.24, 0.92, up) - down * 0.18, lerp(0.44, 0.34, up) + down * 0.04);
      signPivot.rotation.set(b.signX.x - up * 0.12 + down * 0.5, 0, b.signZ.x + Math.sin(b.phase) * 0.05 * b.walkAmt);
      const swing = Math.sin(b.phase) * 0.22 * b.walkAmt;
      for (const a of arms) {
        let rx = -0.85 + swing * a.s * 0.4, rz = -a.s * 0.62;              // holding the stick
        rx = lerp(rx, -2.75, up); rz = lerp(rz, -a.s * 0.3, up);           // sign over the head
        rx = lerp(rx, -1.55, P.push); rz = lerp(rz, -a.s * 0.15, P.push);  // both hands forward
        rx = lerp(rx, -0.5, P.shrug); rz = lerp(rz, a.s * 1.25, P.shrug); // palms out
        rx = lerp(rx, -2.9, P.cheer * (1 - up)); rz = lerp(rz, a.s * 0.5, P.cheer * (1 - up));
        a.g.rotation.set(rx + Math.sin(b.t * 9) * 0.25 * P.cheer, 0, rz);
      }
      for (const l of legs) {
        l.g.rotation.x = lerp(Math.sin(b.phase) * 0.75 * b.walkAmt * l.s, -1.45, P.sit);
        l.g.rotation.z = l.s * 0.06 * P.sit;
      }
      shadow.scale.set(0.95 / (1 + b.y), 0.75 / (1 + b.y), 1);
    }
  };
  return b;
}
