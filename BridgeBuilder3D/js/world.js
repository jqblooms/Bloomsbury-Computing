// Data Bridge 3D art: the WORLD: renderer, scene, camera, lights, sky, fog, and the scenery around and between the
// lanes (not the lanes' own ground: terrain.js). Lanes run along +x (about x = -12 to 46 squares, times T = 100) and are
// stacked along +z (team i at z = i * 9 squares, each 6 squares wide). Up to 8 teams.
//   createWorld(container) -> { renderer, scene, camera, update(dt, t, focus: THREE.Vector3) }
// update() is called every frame with the point the camera follows (world units).
// The look: a sunny canyon. A river runs along z far below every lane (the lanes are rock fingers across it); sandstone
// cliffs with grassy tops close the canyon at x = -12 and x = 46; pines, hills and mesas on the tops; snowy mountains
// in the haze; clouds, birds and waterfalls. Nothing stands in the 3-square strips between lanes above the water, and
// no trees stand within 16 squares of the lanes' west end, so the chase camera always sees its lane.
import * as THREE from 'three';
import { T, LV, rand, canvasTex } from './util.js';

const SKY_TOP = new THREE.Color('#3f8fe0'), SKY_HOR = new THREE.Color('#cde6f7'), SKY_LOW = new THREE.Color('#a9cbe0');
const FOG = '#c4def0', SUN_DIR = new THREE.Vector3(-0.55, 0.62, -0.56).normalize();
const Z0 = -150, Z1 = 230;            // how far the canyon runs along z (squares), beyond the 8 lanes (0..69)
const WEST = -12, EAST = 46;          // the cliff lines (squares)

// a low-poly geometry with per-vertex colours
const colorize = (geo, fn) => { geo = geo.toNonIndexed(); const p = geo.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(); for (let i = 0; i < p.count; i++) { fn(col, p.getX(i), p.getY(i), p.getZ(i), i); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; } geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); geo.computeVertexNormals(); return geo; };
const STRATA = ['#d9a066', '#c98a52', '#e2b37c', '#b8744a', '#d39661', '#e8c08e', '#c27d4c'].map(c => new THREE.Color(c));
const strata = (col, y, n) => col.copy(STRATA[((Math.floor((y + n) / 70) % STRATA.length) + STRATA.length) % STRATA.length]);

export function createWorld(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = SKY_HOR.clone();
  scene.fog = new THREE.Fog(FOG, 6500, 30000);
  const camera = new THREE.PerspectiveCamera(55, 1, 10, 42000);
  const R = rand(20261125);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), E = new THREE.Euler(), UP = new THREE.Vector3(0, 1, 0);

  // ---- light: soft sky fill + a warm sun from behind the chase camera's left, so faces toward the player are lit
  scene.add(new THREE.HemisphereLight(0xe4f1ff, 0x8a6f52, 1.75));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.9); sun.position.copy(SUN_DIR).multiplyScalar(4000); scene.add(sun);

  // ---- sky dome (follows the camera): gradient, warm glow round the sun, a sun disc
  const sky = new THREE.Mesh(new THREE.SphereGeometry(36000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, hor: { value: SKY_HOR }, low: { value: SKY_LOW }, sun: { value: SUN_DIR } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top, hor, low, sun; varying vec3 vD;
      void main(){ float h = vD.y; vec3 c = h > 0.0 ? mix(hor, top, pow(min(1.0, h * 1.6), 0.7)) : mix(hor, low, min(1.0, -h * 4.0));
        float s = max(0.0, dot(vD, sun)); c += vec3(1.0, 0.85, 0.6) * (pow(s, 8.0) * 0.25 + pow(s, 900.0) * 1.2);
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

  // ---- the river: one big sheet of water below every gap, gently moving
  const waterY = (Math.min(...LV.map(l => l.fallY)) - 1.2) * T;
  const waterTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2aa7b8'; g.fillRect(0, 0, w, h); const r = rand(7);
    for (let k = 0; k < 70; k++) { const x = r() * w, y = r() * h, l = 14 + r() * 40; g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '160,240,245'},${0.25 + r() * 0.35})`; g.lineWidth = 2 + r() * 2; for (const dx of [0, -w]) { g.beginPath(); g.moveTo(x + dx, y); g.quadraticCurveTo(x + dx + l / 2, y - 5, x + dx + l, y); g.stroke(); } }
  });
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(150, 150);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(70000, 70000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7fd6e0', map: waterTex, roughness: 0.35, metalness: 0.05, emissive: '#0d4f63', emissiveIntensity: 0.5 }));
  water.position.set(1700, waterY, 3500); scene.add(water);

  // ---- canyon walls: a sandstone cliff along each edge with a grassy top. The west top sits just under the lanes'
  // start banks, the east top just under their far banks, so the lanes read as rock fingers reaching across the river.
  const westTop = (Math.min(0, ...LV.map(l => l.start.y)) - 0.5) * T, eastTop = (Math.min(0, ...LV.map(l => l.goal.y)) - 0.5) * T;
  const grassMat = new THREE.MeshLambertMaterial({ color: '#7cc35a' });
  const cliffMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const cliff = (x, top, dir) => {                     // dir +1: the face looks +x (west wall); -1: looks -x
    const H = top - waterY + 300, L = (Z1 - Z0) * T;
    const geo = new THREE.PlaneGeometry(L, H, 150, 14), p = geo.attributes.position, n = rand(x + 99);
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i), edge = Math.abs(v - H / 2) < 1 ? 0 : 1; p.setZ(i, -edge * (40 + n() * 150 + Math.sin(u / 900) * 60)); }
    geo.rotateY(dir > 0 ? Math.PI / 2 : -Math.PI / 2); geo.translate(x * T, waterY - 300 + H / 2, (Z0 + Z1) / 2 * T);
    scene.add(new THREE.Mesh(colorize(geo, (c, gx, gy, gz) => strata(c, gy, Math.sin(gz * 0.002) * 18)), cliffMat));
    const w = 160 * T, topGeo = new THREE.BoxGeometry(w, 60, L); topGeo.translate(x * T - dir * w / 2, top - 30, (Z0 + Z1) / 2 * T);
    scene.add(new THREE.Mesh(topGeo, grassMat));
  };
  cliff(WEST, westTop, 1); cliff(EAST, eastTop, -1);

  // boulders at the cliff feet and in the river (low: they stay far under the lanes' banks)
  const rockGeo = colorize(new THREE.DodecahedronGeometry(1, 0), (c, x, y) => c.set(y > 0.3 ? '#c9925c' : '#a9714a'));
  const rocks = new THREE.InstancedMesh(rockGeo, cliffMat, 140);
  for (let k = 0; k < 140; k++) {
    const mid = k > 110, side = k % 2 ? WEST + 0.8 + R() * 2 : EAST - 0.8 - R() * 2;
    const x = mid ? 6 + R() * 24 : side, z = mid ? (R() < 0.5 ? Z0 + R() * 140 : 80 + R() * 140) : Z0 + R() * (Z1 - Z0), s = 40 + R() * 110;
    E.set(R() * 3, R() * 3, R() * 3); M.compose(P.set(x * T, waterY + s * 0.3, z * T), Q.setFromEuler(E), S.set(s * (1 + R()), s, s * (1 + R()))); rocks.setMatrixAt(k, M);
  }
  scene.add(rocks);

  // ---- waterfalls from the walls, outside the lanes' z range
  const fallTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = 'rgba(220,248,255,.75)'; g.fillRect(0, 0, w, h); const r = rand(3); for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.fillRect(r() * w, r() * h, 2 + r() * 4, 20 + r() * 50); } });
  fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping; fallTex.repeat.set(1, 3);
  const fallMat = new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, color: '#e8fbff' });
  const foamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.5, depthWrite: false });
  const falls = [];
  for (const [x, z, top, dir] of [[WEST, -30, westTop, 1], [EAST, 100, eastTop, -1], [WEST, 140, westTop, 1], [EAST, -60, eastTop, -1]]) {
    const h = top - waterY, wf = new THREE.Mesh(new THREE.PlaneGeometry(500, h), fallMat);
    wf.rotation.y = Math.PI / 2; wf.position.set(x * T + dir * 60, waterY + h / 2, z * T); scene.add(wf);
    const foam = new THREE.Mesh(new THREE.CircleGeometry(300, 16).rotateX(-Math.PI / 2), foamMat); foam.position.set(x * T + dir * 200, waterY + 6, z * T); scene.add(foam); falls.push(foam);
  }

  // ---- trees, hills and mesas on the canyon tops (kept back from the lanes' ends so no chase camera is blocked)
  const pineLeaf = colorize(new THREE.ConeGeometry(1, 2.2, 7, 2), (c, x, y) => c.set(y > 0.4 ? '#58b84e' : y > -0.4 ? '#45a246' : '#33883f')); pineLeaf.translate(0, 1.6, 0);
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 1, 6); trunkGeo.translate(0, 0.5, 0);
  const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), trunkMat = new THREE.MeshLambertMaterial({ color: '#8a5a33' });
  const spots = [];
  for (let k = 0; spots.length < 420 && k < 5000; k++) {
    const west = R() < 0.5, x = west ? WEST - 2 - R() * 90 : EAST + 2 + R() * 90, z = Z0 + 20 + R() * (Z1 - Z0 - 40);
    if (west && x > WEST - 16 && z > -6 && z < 76) continue;       // behind the lanes: the chase cameras live here
    if (!west && x < EAST + 4 && z > -4 && z < 74) continue;
    if (R() < 0.35 && spots.length) { const o = spots[Math.floor(R() * spots.length)], nx = o.x + (R() - 0.5) * 4; if ((o.west && nx < WEST - 1) || (!o.west && nx > EAST + 1)) spots.push({ x: nx, z: o.z + (R() - 0.5) * 4, west: o.west }); }
    else spots.push({ x, z, west });
  }
  const leaves = new THREE.InstancedMesh(pineLeaf, leafMat, spots.length), trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  spots.forEach((s, k) => { const sc = 70 + R() * 70; M.compose(P.set(s.x * T, s.west ? westTop : eastTop, s.z * T), Q.setFromAxisAngle(UP, R() * 6), S.set(sc, sc * (0.9 + R() * 0.5), sc)); leaves.setMatrixAt(k, M); trunks.setMatrixAt(k, M); });
  scene.add(leaves, trunks);

  const hillGeo = colorize(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), (c, x, y) => c.set(y > 0.75 ? '#8fcf63' : y > 0.35 ? '#7cc35a' : '#6bb34f'));
  const hills = new THREE.InstancedMesh(hillGeo, leafMat, 40);
  for (let k = 0; k < 40; k++) { const west = k % 2 === 0, x = west ? WEST - 45 - R() * 100 : EAST + 40 + R() * 100, z = Z0 + R() * (Z1 - Z0), r = 900 + R() * 1600; M.compose(P.set(x * T, (west ? westTop : eastTop) - 20, z * T), Q.identity(), S.set(r * (1 + R()), r * (0.25 + R() * 0.3), r)); hills.setMatrixAt(k, M); }
  scene.add(hills);

  const mesaGeo = colorize(new THREE.CylinderGeometry(0.85, 1, 1, 7, 5), (c, x, y, z) => y > 0.49 ? c.set('#86c25e') : strata(c, (y + 0.5) * 900, Math.atan2(z, x) * 20)); mesaGeo.translate(0, 0.5, 0);
  const mesas = new THREE.InstancedMesh(mesaGeo, cliffMat, 16);
  for (let k = 0; k < 16; k++) { const west = k % 2 === 0, x = west ? WEST - 95 - R() * 80 : EAST + 80 + R() * 90, z = Z0 + 40 + R() * (Z1 - Z0 - 80), r = 800 + R() * 1400; M.compose(P.set(x * T, (west ? westTop : eastTop) - 40, z * T), Q.setFromAxisAngle(UP, R() * 6), S.set(r, 900 + R() * 1500, r * (0.7 + R() * 0.5))); mesas.setMatrixAt(k, M); }
  scene.add(mesas);

  // ---- snowy mountains in the haze, all round
  const mtnGeo = colorize(new THREE.ConeGeometry(1, 1, 9, 4), (c, x, y, z) => { const n = Math.sin(x * 9 + z * 7) * 0.06; c.set(y + n > 0.18 ? '#f4f8ff' : y + n > -0.12 ? '#8a94b8' : '#6f7fa6'); });
  { const p = mtnGeo.attributes.position, j = rand(11), off = new Map();
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 0.49 || y < -0.49) continue; const kk = p.getX(i).toFixed(3) + ',' + y.toFixed(3) + ',' + p.getZ(i).toFixed(3); if (!off.has(kk)) off.set(kk, 0.8 + j() * 0.4); const f = off.get(kk); p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); }
    mtnGeo.computeVertexNormals(); mtnGeo.translate(0, 0.5, 0); }
  const mtns = new THREE.InstancedMesh(mtnGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), 26);
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2 + R() * 0.2, d = 19000 + R() * 7000, r = 3500 + R() * 4000;
    M.compose(P.set(1700 + Math.cos(a) * d, waterY - 200, 3500 + Math.sin(a) * d * 1.1), Q.setFromAxisAngle(UP, R() * 6), S.set(r, r * (0.8 + R() * 0.7) + 2500, r)); mtns.setMatrixAt(k, M);
  }
  scene.add(mtns);

  // ---- clouds: soft white puffs drifting slowly, wrapped round the camera
  const cloudTex = canvasTex(256, 128, (g, w, h) => {
    const r = rand(5); for (let k = 0; k < 14; k++) { const x = 40 + r() * (w - 80), y = h * 0.62 - r() * 30, rad = 22 + r() * 26, gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
  });
  const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.95 });
  const clouds = [];
  for (let k = 0; k < 26; k++) { const s = new THREE.Sprite(cloudMat), w = 2600 + R() * 3600; s.scale.set(w, w / 2, 1); s.userData = { x: (R() - 0.5) * 36000, z: (R() - 0.5) * 36000, y: 4200 + R() * 4500, v: 40 + R() * 50 }; scene.add(s); clouds.push(s); }

  // ---- birds circling high over the canyon
  const birdGeo = new THREE.BufferGeometry(); birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -1, 0.25, -0.15, -0.15, 0, 0.12, 0, 0, 0, 1, 0.25, -0.15, 0.15, 0, 0.12], 3));
  const birdMat = new THREE.MeshBasicMaterial({ color: '#3b3a48', side: THREE.DoubleSide });
  const birds = [];
  for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(birdGeo, birdMat); b.scale.setScalar(45); b.userData = { r: 1500 + R() * 1800, a: R() * 6, v: 0.08 + R() * 0.07, y: 2200 + R() * 1400, f: R() * 6, z: 1000 + R() * 5000 }; scene.add(b); birds.push(b); }

  const resize = () => { const w = container.clientWidth || 1, h = container.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(container); resize();

  return {
    renderer, scene, camera,
    update(dt, t, focus) {
      sky.position.copy(camera.position);
      waterTex.offset.set(t * 0.004, t * 0.018);
      fallTex.offset.y = t * 0.9;
      for (const f of falls) f.scale.setScalar(1 + Math.sin(t * 3 + f.position.z) * 0.06);
      const cx = camera.position.x, cz = camera.position.z, HALF = 18000, wrap = v => ((v + HALF) % (2 * HALF) + 2 * HALF) % (2 * HALF) - HALF;
      for (const c of clouds) { const u = c.userData; u.x += u.v * dt; c.position.set(cx + wrap(u.x - cx), u.y, cz + wrap(u.z - cz)); }
      const fx = focus ? focus.x : 1600;
      for (const b of birds) { const u = b.userData; u.a += u.v * dt; b.position.set(fx + Math.cos(u.a) * u.r, u.y + Math.sin(t * 0.5 + u.f) * 80, u.z + Math.sin(u.a) * u.r); b.rotation.set(0, -u.a, Math.sin(t * 9 + u.f) * 0.5); }
    },
  };
}
