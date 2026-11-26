// Data Bridge 3D: EFFECTS (juice). The game calls these at the right moments; draw them with sprites/particles,
// pooled, no extra lights, cheap on school laptops. Positions are world units (squares x T, T = 100).
//   createFx(scene) -> {
//     update(dt, t),                       every frame
//     bump(x, y, z),                       the cart jolts (dust, a "BUMP" pop)
//     thrown(x, y, z),                     a rider is thrown off the cart (a whoosh, stars)
//     splash(x, y, z),                     something lands in the gap floor (a rider, a snapped beam, the cart)
//     snap(x, y, z),                       a beam breaks (splinters/sparks)
//     crossed(x, y, z, teamColour),        the cart reaches the far bank (confetti, fireworks)
//     money(x, y, z, text, good),          money gained or lost floats up ("+฿120", "-฿15")
//   }
// One THREE.Points draw call holds every particle (shapes come from one canvas atlas); words are a small pool of
// sprites; ripples/shock rings are a small pool of flat rings. Nothing is allocated per frame.
// Demo: add ?fxdemo=1 to the page URL and every effect fires once a second near (300, 50, 300).
import * as THREE from 'three';
import { canvasTex } from './util.js';

const NP = 1400;                      // particle pool
const SH = { soft: 0, star: 1, spark: 2, conf: 3, splinter: 4, drop: 5, cloud: 6, streak: 7 };
const ROCKET = 1;

// 8 shapes in a 512 x 64 atlas, drawn white so each particle tints them
const atlas = canvasTex(512, 64, (g) => {
  const cell = (i, f) => { g.save(); g.translate(i * 64 + 32, 32); f(); g.restore(); };
  const radial = (r, stops) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  cell(0, () => { g.fillStyle = radial(30, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-32, -32, 64, 64); });
  cell(1, () => {
    g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 11 : 27, a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = 'rgba(90,70,20,1)'; g.stroke(); g.fillStyle = '#fff'; g.fill();
    g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.arc(-5, -6, 4, 0, 7); g.fill();
  });
  cell(2, () => { g.fillStyle = radial(30, [[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-32, -32, 64, 64); });
  cell(3, () => { g.fillStyle = '#fff'; g.fillRect(-22, -13, 44, 26); g.fillStyle = 'rgba(200,200,200,1)'; g.fillRect(-22, 5, 44, 8); });
  cell(4, () => {
    g.beginPath(); g.moveTo(-28, -2); g.lineTo(-10, -7); g.lineTo(26, -4); g.lineTo(29, 1); g.lineTo(8, 6); g.lineTo(-26, 4); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(110,110,110,1)'; g.stroke();
  });
  cell(5, () => {
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(0, 4, 20, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-17, -6); g.lineTo(0, -28); g.lineTo(17, -6); g.fill();
    g.fillStyle = 'rgba(255,255,255,1)'; g.strokeStyle = 'rgba(160,200,230,1)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 4, 18, 0.3, 2.8); g.stroke();
  });
  cell(6, () => {
    const blobs = [[-12, 6, 15], [10, 6, 16], [0, -6, 17], [-18, -2, 10], [19, -1, 11]];
    g.fillStyle = 'rgba(205,205,205,1)'; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y + 3, r, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,1)'; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - 1, y - 1, r - 3, 0, 7); g.fill(); }
  });
  cell(7, () => { g.scale(1, 0.22); g.fillStyle = radial(31, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(0, 0, 31, 0, 7); g.fill(); });
});

const VERT = `
attribute float aSize; attribute float aAlpha; attribute float aShape; attribute float aRot; attribute vec3 aCol;
uniform float uHalfH;
varying float vAlpha; varying float vShape; varying float vRot; varying vec3 vCol;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aAlpha > 0.0 ? aSize * projectionMatrix[1][1] * uHalfH / max(1.0, -mv.z) : 0.0;
  vAlpha = aAlpha; vShape = aShape; vRot = aRot; vCol = aCol;
}`;
const FRAG = `
uniform sampler2D uMap;
varying float vAlpha; varying float vShape; varying float vRot; varying vec3 vCol;
void main() {
  vec2 p = gl_PointCoord - 0.5; float c = cos(vRot), s = sin(vRot);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * 1.02 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
  vec4 tx = texture2D(uMap, vec2((vShape + p.x) / 8.0, 1.0 - p.y));
  gl_FragColor = vec4(tx.rgb * vCol, tx.a * vAlpha);
  if (gl_FragColor.a < 0.01) discard;
  #include <colorspace_fragment>
}`;

const ringGeo = new THREE.RingGeometry(0.82, 1, 48);
const tmpCol = new THREE.Color();
const PARTY = ['#ff4d6d', '#ffd43b', '#4dabf7', '#69db7c', '#b197fc', '#ffa94d', '#ffffff'];

export function createFx(scene) {
  // ---------- particles ----------
  const pos = new Float32Array(NP * 3), col = new Float32Array(NP * 3), size = new Float32Array(NP), alpha = new Float32Array(NP),
    shape = new Float32Array(NP), rot = new Float32Array(NP);
  const vel = new Float32Array(NP * 3), age = new Float32Array(NP), life = new Float32Array(NP), s0 = new Float32Array(NP), s1 = new Float32Array(NP),
    grav = new Float32Array(NP), drag = new Float32Array(NP), spin = new Float32Array(NP), kind = new Uint8Array(NP);
  let next = 0, live = 0;
  const geo = new THREE.BufferGeometry();
  const attr = (name, arr, n) => { const a = new THREE.BufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; };
  const aPos = attr('position', pos, 3), aCol = attr('aCol', col, 3), aSize = attr('aSize', size, 1), aAlpha = attr('aAlpha', alpha, 1),
    aShape = attr('aShape', shape, 1), aRot = attr('aRot', rot, 1);
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: { uMap: { value: atlas }, uHalfH: { value: 400 } } });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; points.renderOrder = 8; scene.add(points);

  function emit(x, y, z, vx, vy, vz, lf, sa, sb, hex, sh, g = 0, dr = 0, sp = 0, k = 0) {
    const i = next; next = (next + 1) % NP;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    age[i] = 0; life[i] = lf; s0[i] = sa; s1[i] = sb; size[i] = sa; grav[i] = g; drag[i] = dr; spin[i] = sp; kind[i] = k;
    shape[i] = sh; rot[i] = Math.random() * 6.28; alpha[i] = 1;
    tmpCol.set(hex); col[i * 3] = tmpCol.r; col[i * 3 + 1] = tmpCol.g; col[i * 3 + 2] = tmpCol.b;
    live = Math.max(live, 1);
    return i;
  }
  const R = (a, b) => a + Math.random() * (b - a);
  // a random direction scaled to speed, written into dir[]
  const dir = [0, 0, 0];
  function sphere(sp, upBias = 0) {
    let x, y, z, d; do { x = R(-1, 1); y = R(-1, 1); z = R(-1, 1); d = x * x + y * y + z * z; } while (d > 1 || d < 0.01);
    d = Math.sqrt(d); dir[0] = x / d * sp; dir[1] = (y / d + upBias) * sp; dir[2] = z / d * sp; return dir;
  }

  // ---------- words (BUMP!, SNAP!, money) ----------
  const words = [];
  for (let k = 0; k < 8; k++) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true }));
    sp.visible = false; sp.renderOrder = 12; scene.add(sp);
    words.push({ c, g: c.getContext('2d'), tex, sp, age: 0, life: 0, rise: 0, h: 0, w: 0, wob: 0, on: false });
  }
  let wNext = 0;
  function word(text, x, y, z, fill, edge, h, lf, rise, wob = 0) {
    const W = words[wNext]; wNext = (wNext + 1) % words.length;
    const g = W.g, font = '900 96px "Segoe UI Black", "Segoe UI", Arial, sans-serif';
    g.clearRect(0, 0, 512, 160); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = Math.min(480, g.measureText(text).width);
    g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = edge; g.strokeText(text, 256, 84, 480);
    g.fillStyle = fill; g.fillText(text, 256, 80, 480);
    g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; g.fillText(text, 256, 74, 480); g.globalAlpha = 1;
    W.tex.needsUpdate = true; W.sp.position.set(x, y, z); W.sp.visible = true; W.sp.material.opacity = 1; W.sp.material.rotation = 0;
    W.age = 0; W.life = lf; W.rise = rise; W.h = h; W.w = h * 512 / 160; W.wob = wob; W.on = true;
    W.tw = tw;
  }

  // ---------- flat rings (ripples, shock rings) ----------
  const rings = [];
  for (let k = 0; k < 10; k++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 7; scene.add(m);
    rings.push({ m, age: 0, life: 0, r0: 0, r1: 0, delay: 0, on: false });
  }
  let rNext = 0;
  function ring(x, y, z, hex, r0, r1, lf, delay = 0, upright = false) {
    const Rg = rings[rNext]; rNext = (rNext + 1) % rings.length;
    Rg.m.position.set(x, y, z); Rg.m.material.color.set(hex); Rg.m.rotation.set(upright ? 0 : -Math.PI / 2, upright ? Math.PI / 2 : 0, 0);
    Rg.age = 0; Rg.life = lf; Rg.r0 = r0; Rg.r1 = r1; Rg.delay = delay; Rg.on = true; Rg.m.visible = false;
  }

  // ---------- emitters that move over time (whoosh trails, rockets) ----------
  const ems = [];
  for (let k = 0; k < 12; k++) ems.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, age: 0, life: 0, type: 0, hex: '#fff', acc: 0 });
  let eNext = 0;
  function emitter(type, x, y, z, vx, vy, vz, g, lf, hex) {
    const E = ems[eNext]; eNext = (eNext + 1) % ems.length;
    Object.assign(E, { on: true, type, x, y, z, vx, vy, vz, g, age: 0, life: lf, hex, acc: 0 }); return E;
  }

  function burst(x, y, z, hex) {
    for (let k = 0; k < 46; k++) { sphere(R(380, 460)); emit(x, y, z, dir[0], dir[1], dir[2], R(0.9, 1.3), 34, 10, k % 4 === 0 ? '#ffffff' : hex, SH.spark, -260, 2.2); }
    for (let k = 0; k < 14; k++) { sphere(R(150, 250)); emit(x, y, z, dir[0], dir[1], dir[2], R(0.7, 1.0), 26, 6, '#fff3bf', SH.star, -200, 2.5, R(-8, 8)); }
    emit(x, y, z, 0, 0, 0, 0.25, 160, 360, '#ffffff', SH.soft);
  }

  // ---------- the effects ----------
  const fx = {
    bump(x, y, z) {
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2 + R(-0.2, 0.2), sp = R(160, 300);
        emit(x + Math.cos(a) * 60, y + R(0, 15), z + Math.sin(a) * 60, Math.cos(a) * sp, R(40, 120), Math.sin(a) * sp, R(0.55, 0.9), R(45, 65), R(110, 150), k % 3 ? '#e9dcc4' : '#c9b48f', SH.cloud, 60, 3.5, R(-2, 2));
      }
      for (let k = 0; k < 8; k++) emit(x + R(-50, 50), y + 5, z + R(-50, 50), R(-60, 60), R(250, 380), R(-60, 60), R(0.4, 0.6), 16, 8, '#8a6d47', SH.soft, -1200);
      ring(x, y + 4, z, '#fff4d6', 40, 230, 0.35);
      word('BUMP!', x, y + 260, z, '#ffd43b', '#7a3e00', 90, 0.85, 120, 1);
    },
    thrown(x, y, z) {
      // the rider is flung up and sideways: a whoosh trail follows the arc
      const s = Math.random() < 0.5 ? -1 : 1;
      emitter(1, x, y + 80, z, R(-120, 120), 650, s * 360, -1300, 0.55, '#ffffff');
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * Math.PI * 2;
        emit(x + Math.cos(a) * 55, y + 170, z + Math.sin(a) * 55, Math.cos(a) * 140, R(160, 260), Math.sin(a) * 140, R(0.9, 1.2), 46, 20, k % 2 ? '#ffd43b' : '#fff3bf', SH.star, -260, 1.2, s * R(7, 11));
      }
      ring(x, y + 120, z, '#ffffff', 30, 170, 0.3, 0, true);
      word('WHOOSH!', x, y + 300, z, '#ffffff', '#1c4f8a', 70, 0.8, 160, -1);
    },
    splash(x, y, z) {
      for (let k = 0; k < 44; k++) {
        const a = R(0, 6.28), out = R(80, 260);
        emit(x + Math.cos(a) * 20, y + 10, z + Math.sin(a) * 20, Math.cos(a) * out, R(420, 820), Math.sin(a) * out, R(0.8, 1.2), R(20, 34), 12, k % 3 ? '#a5d8ff' : '#ffffff', SH.drop, -1500, 0.4);
      }
      for (let k = 0; k < 10; k++) emit(x + R(-40, 40), y + 20, z + R(-40, 40), R(-50, 50), R(250, 420), R(-50, 50), R(0.7, 1.0), 70, 120, '#e7f5ff', SH.cloud, -500, 1.8, R(-1, 1));
      ring(x, y + 3, z, '#d0ebff', 30, 260, 0.7);
      ring(x, y + 3, z, '#a5d8ff', 20, 190, 0.8, 0.15);
      ring(x, y + 3, z, '#ffffff', 10, 130, 0.8, 0.3);
      word('SPLASH!', x, y + 240, z, '#74c0fc', '#0b3a66', 80, 0.9, 110, 1);
    },
    snap(x, y, z) {
      for (let k = 0; k < 18; k++) { sphere(R(220, 460), 0.6); emit(x, y, z, dir[0], dir[1], dir[2], R(0.9, 1.4), R(34, 50), R(24, 40), k % 3 ? '#c58a45' : '#8a5a2b', SH.splinter, -1100, 0.5, R(-14, 14)); }
      for (let k = 0; k < 26; k++) { sphere(R(300, 620), 0.4); emit(x, y, z, dir[0], dir[1], dir[2], R(0.35, 0.7), R(16, 24), 4, k % 2 ? '#ffd43b' : '#ff922b', SH.spark, -900, 1.5); }
      emit(x, y, z, 0, 0, 0, 0.18, 120, 260, '#fff3bf', SH.spark);
      for (let k = 0; k < 6; k++) emit(x + R(-30, 30), y, z + R(-30, 30), R(-60, 60), R(40, 120), R(-60, 60), R(0.6, 0.9), 40, 100, '#ced4da', SH.cloud, 0, 2.5);
      word('SNAP!', x, y + 220, z, '#ff6b6b', '#5c0a0a', 85, 0.8, 100, 1);
    },
    crossed(x, y, z, teamColour) {
      const tc = teamColour || '#ffd43b';
      for (let k = 0; k < 130; k++) {
        const a = R(0, 6.28), out = R(60, 380);
        emit(x + R(-40, 40), y + 120, z + R(-40, 40), Math.cos(a) * out, R(500, 1000), Math.sin(a) * out, R(2.0, 3.0), R(22, 30), R(20, 28), k % 3 === 0 ? tc : PARTY[k % PARTY.length], SH.conf, -650, 1.6, R(-12, 12));
      }
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI * 2 + R(-0.4, 0.4);
        emitter(2, x + Math.cos(a) * 160, y + 60, z + Math.sin(a) * 160, Math.cos(a) * 60, R(760, 900), Math.sin(a) * 60, -700, R(0.6, 0.8) + k * 0.12, k === 1 ? '#ffffff' : tc);
      }
      ring(x, y + 6, z, tc, 40, 420, 0.6);
      ring(x, y + 6, z, '#ffffff', 30, 300, 0.6, 0.12);
    },
    money(x, y, z, text, good) {
      word(String(text), x, y + 200, z, good ? '#8ce99a' : '#ff8787', good ? '#0b4a1f' : '#5c0a0a', 80, 1.6, 260, 0);
      for (let k = 0; k < (good ? 12 : 6); k++) emit(x + R(-60, 60), y + 160, z + R(-60, 60), R(-60, 60), good ? R(150, 320) : R(-40, 60), R(-60, 60), R(0.6, 1.0), 22, 8, good ? '#ffe066' : '#ff8787', good ? SH.star : SH.spark, good ? -300 : -500, 1, R(-6, 6));
    },
    update(dt, t) {
      dt = Math.min(dt || 0.016, 0.05);
      mat.uniforms.uHalfH.value = (window.innerHeight || 800) * 0.5 * Math.min(2, window.devicePixelRatio || 1);
      // moving emitters
      for (const E of ems) {
        if (!E.on) continue;
        E.age += dt; E.vy += E.g * dt; E.x += E.vx * dt; E.y += E.vy * dt; E.z += E.vz * dt; E.acc += dt;
        const step = E.type === 1 ? 0.018 : 0.025;
        while (E.acc > step) {
          E.acc -= step;
          if (E.type === 1) {
            emit(E.x, E.y, E.z, 0, 0, 0, 0.35, 60, 20, E.hex, SH.soft, 0, 0);
            const k = emit(E.x, E.y, E.z, -E.vx * 0.1, -E.vy * 0.1, -E.vz * 0.1, 0.3, 90, 50, '#d0ebff', SH.streak);
            rot[k] = -Math.atan2(E.vy, Math.hypot(E.vx, E.vz)) * Math.sign(E.vz || 1);
            spin[k] = 0;
          } else {
            emit(E.x + R(-6, 6), E.y, E.z + R(-6, 6), R(-30, 30), R(-80, -20), R(-30, 30), 0.45, 22, 6, E.hex === '#ffffff' ? '#ffd8a8' : E.hex, SH.spark, -300, 1);
          }
        }
        if (E.age >= E.life) { E.on = false; if (E.type === 2) burst(E.x, E.y, E.z, E.hex); }
      }
      // particles
      let any = false;
      for (let i = 0; i < NP; i++) {
        if (alpha[i] <= 0) continue;
        age[i] += dt; const u = age[i] / life[i];
        if (u >= 1) { alpha[i] = 0; continue; }
        any = true;
        const d = Math.max(0, 1 - drag[i] * dt), j = i * 3;
        vel[j] *= d; vel[j + 1] = vel[j + 1] * d + grav[i] * dt; vel[j + 2] *= d;
        pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
        rot[i] += spin[i] * dt;
        size[i] = s0[i] + (s1[i] - s0[i]) * u;
        alpha[i] = Math.max(0.001, Math.min(1, (1 - u) * 2.5));
      }
      if (any || live) { aPos.needsUpdate = aCol.needsUpdate = aSize.needsUpdate = aAlpha.needsUpdate = aShape.needsUpdate = aRot.needsUpdate = true; }
      live = any ? 1 : 0;
      // words: pop in with a little overshoot, drift up, fade out
      for (const W of words) {
        if (!W.on) continue;
        W.age += dt; const u = W.age / W.life;
        if (u >= 1) { W.on = false; W.sp.visible = false; continue; }
        const pop = u < 0.12 ? 0.4 + 0.8 * (u / 0.12) : u < 0.22 ? 1.2 - 0.2 * ((u - 0.12) / 0.1) : 1;
        W.sp.scale.set(W.w * pop, W.h * pop, 1);
        W.sp.position.y += W.rise * dt * (1 - u);
        W.sp.material.rotation = W.wob * 0.12 * Math.sin(W.age * 18) * (1 - u);
        W.sp.material.opacity = Math.min(1, (1 - u) * 3.5);
      }
      // rings
      for (const Rg of rings) {
        if (!Rg.on) continue;
        Rg.age += dt; const a = Rg.age - Rg.delay;
        if (a < 0) continue;
        const u = a / Rg.life;
        if (u >= 1) { Rg.on = false; Rg.m.visible = false; continue; }
        const e = 1 - (1 - u) * (1 - u), r = Rg.r0 + (Rg.r1 - Rg.r0) * e;
        Rg.m.visible = true; Rg.m.scale.set(r, r, r); Rg.m.material.opacity = 0.85 * (1 - u);
      }
      if (demo) runDemo(t);
    },
  };

  // ---------- demo (?fxdemo=1): every effect once a second, spaced along x near the cart ----------
  const demo = typeof location !== 'undefined' && /fxdemo/.test(location.search);
  let demoNext = 0, demoN = 0;
  function runDemo(t) {
    if (!(t >= demoNext)) return;
    demoNext = t + 1; demoN++;
    const x = 300, y = 50, z = 300, P = (k) => [x + k * 40, z + (k - 2.5) * 230];
    let p = P(0); fx.bump(p[0], y, p[1]);
    p = P(1); fx.thrown(p[0], y, p[1]);
    p = P(2); fx.splash(p[0], y - 150, p[1]);
    p = P(3); fx.snap(p[0], y + 50, p[1]);
    p = P(4); fx.money(p[0], y, p[1], demoN % 2 ? '+฿120' : '-฿15', demoN % 2 === 1);
    p = P(5); if (demoN % 2 === 1) fx.crossed(p[0] + 300, y, p[1], '#1c7ed6');
  }

  return fx;
}
