// Network Help Desk: the office in first person. A low-poly room with soft cartoon shading and ink outlines on the
// things you use. Your desk has a computer (its screen is a canvas: the network map) and a smartphone (its screen is a
// canvas: calls and messages). Click the computer to lean in, click the phone to pick it up. Screens take pointer
// input through the 3D view (a ray to the screen, its texture position to the page). No requestAnimationFrame: the
// page's timer calls frame().
import * as THREE from 'three';
import { portrait } from './art.js';

export const MON_W = 1280, MON_H = 800, PH_W = 540, PH_H = 1120;

export function createOffice(host, hooks) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(1);   // school desktops: 1x pixels (2x quadrupled the work)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1c2232');
  scene.fog = new THREE.Fog('#2a3044', 9, 22);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.02, 60);

  // ---------------------------------------------------------------- cartoon materials and outlines
  const ramp = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
  const toon = (color, extra = {}) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: ramp }, extra));
  const inkMat = new THREE.MeshBasicMaterial({ color: '#141320', side: THREE.BackSide });
  function outline(mesh, w = 0.012) {
    const o = new THREE.Mesh(mesh.geometry, inkMat); o.scale.setScalar(1); o.userData.ink = w;
    o.onBeforeRender = () => { };
    // a slightly larger copy, drawn inside out
    const bb = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position), sz = bb.getSize(new THREE.Vector3());
    // the same thickness all round, but never more than a tenth of a thin side (a keyboard is 2.5 cm tall)
    const k = a => 1 + 2 * Math.min(w, a * 0.1) / Math.max(0.001, a);
    o.scale.set(k(sz.x), k(sz.y), k(sz.z));
    mesh.add(o); return mesh;
  }
  function box(w, h, d, mat, x, y, z, ink = true) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (ink) outline(m); scene.add(m); return m; }
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d', { willReadFrequently: true }), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

  // ---------------------------------------------------------------- light
  scene.add(new THREE.HemisphereLight('#c9d8ff', '#3b2e2a', 0.9));
  const sun = new THREE.DirectionalLight('#ffe2b8', 1.6); sun.position.set(-3, 5, 2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -4; scene.add(sun);
  const lampLight = new THREE.PointLight('#ffcf8a', 1.3, 3.2, 1.6); lampLight.position.set(-0.78, 1.32, -0.42); scene.add(lampLight);

  // ---------------------------------------------------------------- the room
  const carpet = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#3c4a6b'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#405074' : '#384566'; g.fillRect(i * 128, j * 128, 128, 128); } g.globalAlpha = 0.08; for (let k = 0; k < 3000; k++) { g.fillStyle = Math.random() < 0.5 ? '#fff' : '#000'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshToonMaterial({ map: carpet, gradientMap: ramp })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallMat = toon('#e9dcc6'), wallDark = toon('#d7c6aa');
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.2), wallMat); back.position.set(0, 2.1, -2.2); back.receiveShadow = true; scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.2), wallDark); left.position.set(-4.5, 2.1, 2); left.rotation.y = Math.PI / 2; scene.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.2), wallDark); right.position.set(4.5, 2.1, 2); right.rotation.y = -Math.PI / 2; scene.add(right);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon('#cfd4de')); ceil.position.y = 3.3; ceil.rotation.x = Math.PI / 2; scene.add(ceil);
  for (const x of [-2, 0, 2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.5), new THREE.MeshBasicMaterial({ color: '#fff7e0' })); p.position.set(x, 3.28, 0); scene.add(p); }
  // skirting and a stripe of the help desk's colour
  box(14, 0.12, 0.04, toon('#5a4c66'), 0, 0.06, -2.18, false);
  box(14, 0.08, 0.02, toon('#ff8f3f'), 0, 1.05, -2.19, false);
  // the window onto the town
  const town = canvasTex(1024, 512, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#7fb6ff'); sky.addColorStop(0.7, '#ffd9a8'); sky.addColorStop(1, '#ffb37f'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.75)'; for (const [x, y, s] of [[160, 90, 1], [600, 60, 1.4], [860, 120, 0.9]]) { g.beginPath(); g.ellipse(x, y, 60 * s, 18 * s, 0, 0, 7); g.ellipse(x + 40 * s, y - 12 * s, 40 * s, 20 * s, 0, 0, 7); g.fill(); }
    const cols = ['#5a6b9a', '#6f7fae', '#4c5a86', '#7a6c9e', '#5f7c8f'];
    for (let layer = 0; layer < 2; layer++) for (let x = -20; x < w; x += 70 + Math.random() * 40) {
      const bw = 60 + Math.random() * 70, bh = (layer ? 160 : 90) + Math.random() * (layer ? 160 : 120);
      g.fillStyle = layer ? cols[Math.floor(Math.random() * cols.length)] : '#9aa7c9'; g.fillRect(x, h - bh, bw, bh);
      if (layer) { g.fillStyle = 'rgba(255,240,180,0.85)'; for (let wy = h - bh + 14; wy < h - 10; wy += 22) for (let wx = x + 8; wx < x + bw - 10; wx += 16) if (Math.random() < 0.45) g.fillRect(wx, wy, 8, 10); }
    }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: town })); win.position.set(1.6, 2.05, -2.17); scene.add(win);
  const frameMat = toon('#f4f1ea');
  for (const [w, h, x, y] of [[3.36, 0.08, 1.6, 2.89], [3.36, 0.08, 1.6, 1.21], [0.08, 1.76, -0.04, 2.05], [0.08, 1.76, 3.24, 2.05], [0.05, 1.6, 1.6, 2.05], [3.2, 0.05, 1.6, 2.4]]) box(w, h, 0.06, frameMat, x, y, -2.15, false);
  // the clock
  const clockTex = canvasTex(256, 256, () => { }), clock = new THREE.Mesh(new THREE.CircleGeometry(0.26, 40), new THREE.MeshBasicMaterial({ map: clockTex })); clock.position.set(-1.2, 2.55, -2.16); scene.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 8, 40), toon('#2c2a3a')); rim.position.copy(clock.position); scene.add(rim);
  function drawClock() {
    const g = clockTex.image.getContext('2d'), d = new Date(); g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#2c2a3a'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.lineWidth = i % 3 ? 4 : 8; g.beginPath(); g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); g.lineTo(128 + Math.sin(a) * 115, 128 - Math.cos(a) * 115); g.stroke(); }
    const hand = (a, l, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); g.stroke(); };
    hand((d.getHours() % 12 + d.getMinutes() / 60) * Math.PI / 6, 60, 10, '#2c2a3a'); hand(d.getMinutes() * Math.PI / 30, 92, 6, '#2c2a3a'); hand(d.getSeconds() * Math.PI / 30, 98, 2, '#ff6b3d');
    clockTex.needsUpdate = true;
  }
  // a neon-style sign
  const signTex = canvasTex(1024, 192, (g, w, h) => { g.fillStyle = '#211f33'; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill(); g.font = '900 104px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff8f3f'; g.shadowBlur = 30; g.fillStyle = '#ffd1a6'; g.fillText('NETWORK HELP DESK', w / 2, h / 2 + 6); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.41), new THREE.MeshBasicMaterial({ map: signTex, transparent: true })); sign.position.set(-1.8, 2.95, -2.15); scene.add(sign);
  // the leaderboard pinned on a cork board
  const boardTex = canvasTex(640, 800, () => { });
  const cork = box(1.25, 1.5, 0.05, toon('#b98a5a'), -2.6, 1.85, -2.14);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshBasicMaterial({ map: boardTex })); paper.position.set(-2.6, 1.85, -2.11); paper.rotation.z = 0.02; scene.add(paper);
  function drawBoard(rows, title) {
    const g = boardTex.image.getContext('2d'); g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 640, 800);
    g.fillStyle = '#e8463c'; g.beginPath(); g.arc(320, 26, 14, 0, 7); g.fill();
    g.fillStyle = '#221e33'; g.font = '900 56px system-ui'; g.textAlign = 'center'; g.fillText('TOP HELPERS', 320, 104);
    g.font = '600 28px system-ui'; g.fillStyle = '#6a6480'; g.fillText(title || '', 320, 146);
    g.textAlign = 'left';
    (rows || []).slice(0, 8).forEach((r, i) => {
      const y = 214 + i * 70; g.fillStyle = i === 0 ? '#ffd166' : i === 1 ? '#dfe4ee' : i === 2 ? '#f0b48a' : '#f1eee4'; g.beginPath(); g.roundRect(40, y - 44, 560, 58, 14); g.fill();
      g.fillStyle = '#221e33'; g.font = '800 34px system-ui'; g.fillText((i + 1) + '. ' + String(r.name).slice(0, 16), 60, y);
      g.textAlign = 'right'; g.fillText(String(r.points), 580, y); g.textAlign = 'left';
    });
    if (!rows || !rows.length) { g.fillStyle = '#8a8499'; g.font = '600 32px system-ui'; g.textAlign = 'center'; g.fillText('Fix a job to get on the board!', 320, 300); }
    boardTex.needsUpdate = true;
  }
  drawBoard([], '');

  // ---------------------------------------------------------------- your desk
  const wood = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#c98e5a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,70,30,0.25)'; g.lineWidth = 2; for (let y = 6; y < h; y += 9) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 40 + y) * 2.5); g.stroke(); } });
  const deskTop = box(2.2, 0.06, 1.0, new THREE.MeshToonMaterial({ map: wood, gradientMap: ramp }), 0, 0.76, -0.55);
  for (const [x, z] of [[-1.04, -0.12], [1.04, -0.12], [-1.04, -0.98], [1.04, -0.98]]) box(0.06, 0.74, 0.06, toon('#3a3448'), x, 0.37, z);
  box(0.42, 0.6, 0.86, toon('#55607a'), 0.8, 0.42, -0.56);
  for (const y of [0.56, 0.36]) box(0.36, 0.14, 0.02, toon('#6b7896'), 0.8, y, -0.12, false);
  // the computer
  const monGroup = new THREE.Group(); monGroup.position.set(0, 0.79, -0.78); scene.add(monGroup);
  const standMat = toon('#2f3242');
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.22), standMat); foot.position.y = 0.01; outline(foot); monGroup.add(foot);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.04), standMat); neck.position.set(0, 0.14, -0.04); monGroup.add(neck);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.58, 0.04), toon('#262a38')); bezel.position.set(0, 0.5, 0); outline(bezel); monGroup.add(bezel);
  const monCanvas = document.createElement('canvas'); monCanvas.width = MON_W; monCanvas.height = MON_H;
  // the screens are redrawn often: a CPU-side canvas (willReadFrequently) uploads without a GPU read-back stall, and no
  // mipmaps means no mipmap rebuild on each upload
  monCanvas.getContext('2d', { willReadFrequently: true });
  const monTex = new THREE.CanvasTexture(monCanvas); monTex.colorSpace = THREE.SRGBColorSpace; monTex.generateMipmaps = false; monTex.minFilter = THREE.LinearFilter; monTex.flipY = false; monTex.premultiplyAlpha = true; monTex.repeat.y = -1; monTex.offset.y = 1;   // upload as-is: no CPU flip or alpha conversion
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.525), new THREE.MeshBasicMaterial({ map: monTex })); screen.position.set(0, 0.5, 0.021); monGroup.add(screen);
  // sticky notes
  const notes = [];
  const drawNote = (g, c, t) => { g.fillStyle = c; g.fillRect(0, 0, 128, 128); g.fillStyle = '#3a3448'; g.font = '700 26px Comic Sans MS, system-ui'; g.textAlign = 'center'; t.split('\n').forEach((l, i, a) => g.fillText(l, 64, 70 - (a.length - 1) * 15 + i * 30)); };
  for (const [x, y, c, t] of [[-0.47, 0.72, '#ffe066', 'Test!'], [0.47, 0.32, '#8ce99a', 'Call\nSupplies']]) {
    const tex = canvasTex(128, 128, (g) => drawNote(g, c, t)), n = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), new THREE.MeshBasicMaterial({ map: tex }));
    n.position.set(x, y, 0.025); n.rotation.z = (Math.random() - 0.5) * 0.3; monGroup.add(n); notes.push({ tex, c, t });
  }
  /** The sticky notes' words (lesson 2.4 has its own). */
  function setNotes(texts) { texts.forEach((t, i) => { const n = notes[i]; if (!n || n.t === t) return; n.t = t; drawNote(n.tex.image.getContext('2d'), n.c, t); n.tex.needsUpdate = true; }); }
  // keyboard and mouse
  const kb = box(0.5, 0.025, 0.17, toon('#e7e9f0'), -0.05, 0.8, -0.32);
  { const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 0.03), toon('#ffffff'), 52), mx = new THREE.Matrix4(); let n = 0;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 13; k++) keys.setMatrixAt(n++, mx.makeTranslation(-0.27 + k * 0.036 + (r % 2) * 0.01, 0.818, -0.38 + r * 0.038));
    scene.add(keys); }
  box(0.06, 0.03, 0.1, toon('#e7e9f0'), 0.33, 0.8, -0.3);
  // the lamp
  const lampMat = toon('#ff8f3f');
  box(0.16, 0.02, 0.16, lampMat, -0.78, 0.8, -0.62);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5), lampMat); arm.position.set(-0.78, 1.04, -0.62); arm.rotation.z = 0.25; scene.add(arm);
  const shadeM = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 20, 1, true), new THREE.MeshToonMaterial({ color: '#ff8f3f', gradientMap: ramp, side: THREE.DoubleSide })); shadeM.position.set(-0.84, 1.3, -0.5); shadeM.rotation.x = -0.9; outline(shadeM); scene.add(shadeM);
  // a mug of tea and a plant
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 18), toon('#5f8de8')); mug.position.set(0.5, 0.84, -0.48); outline(mug); scene.add(mug);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 16), toon('#5f8de8')); handle.position.set(0.55, 0.84, -0.48); scene.add(handle);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 14), toon('#d9643a')); pot.position.set(0.88, 0.85, -0.85); outline(pot); scene.add(pot);
  for (let i = 0; i < 9; i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.26, 6), toon(i % 2 ? '#3fa35c' : '#57c26f')); const a = i / 9 * Math.PI * 2; leaf.position.set(0.88 + Math.cos(a) * 0.04, 1.0, -0.85 + Math.sin(a) * 0.04); leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); scene.add(leaf); }
  // a name plate
  const plateTex = canvasTex(512, 128, () => { });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.08), new THREE.MeshBasicMaterial({ map: plateTex })); plate.position.set(-0.55, 0.83, -0.18); plate.rotation.x = -0.6; scene.add(plate);
  function drawPlate(name) { const g = plateTex.image.getContext('2d'); g.fillStyle = '#221e33'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#ffd166'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112); g.fillStyle = '#ffd166'; g.font = '800 54px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(name || '').slice(0, 14), 256, 68); plateTex.needsUpdate = true; }

  // ---------------------------------------------------------------- the phone
  const phCanvas = document.createElement('canvas'); phCanvas.width = PH_W; phCanvas.height = PH_H;
  phCanvas.getContext('2d', { willReadFrequently: true });
  const phTex = new THREE.CanvasTexture(phCanvas); phTex.colorSpace = THREE.SRGBColorSpace; phTex.generateMipmaps = false; phTex.minFilter = THREE.LinearFilter; phTex.flipY = false; phTex.premultiplyAlpha = true; phTex.repeat.y = -1; phTex.offset.y = 1;   // upload as-is: no CPU flip or alpha conversion
  const phone = new THREE.Group(); scene.add(phone);
  const shape = new THREE.Shape(); const pw = 0.075, ph = 0.155, r = 0.012;
  shape.moveTo(-pw / 2 + r, -ph / 2); shape.lineTo(pw / 2 - r, -ph / 2); shape.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + r); shape.lineTo(pw / 2, ph / 2 - r); shape.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - r, ph / 2); shape.lineTo(-pw / 2 + r, ph / 2); shape.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - r); shape.lineTo(-pw / 2, -ph / 2 + r); shape.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + r, -ph / 2);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 3 }), toon('#2a2d3d'));
  body.castShadow = true; outline(body, 0.0025); phone.add(body);
  const phScreen = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.006, ph - 0.008), new THREE.MeshBasicMaterial({ map: phTex })); phScreen.position.z = 0.0105; phone.add(phScreen);
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 12), toon('#111')); cam.rotation.x = Math.PI / 2; cam.position.set(0, ph / 2 - 0.009, 0.0112); phone.add(cam);
  // where the phone lies on the desk, and where it is held
  const restPos = new THREE.Vector3(0.48, 0.796, -0.26), restRot = new THREE.Euler(-Math.PI / 2, 0, 0.35);
  phone.position.copy(restPos); phone.rotation.copy(restRot);

  // ---------------------------------------------------------------- colleagues at other desks
  const people = [];
  function colleague(x, z, rotY, look, top) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.8), new THREE.MeshToonMaterial({ map: wood, gradientMap: ramp })); d.position.set(0, 0.76, 0); d.castShadow = true; outline(d); g.add(d);
    for (const [lx, lz] of [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), toon('#3a3448')); l.position.set(lx, 0.37, lz); g.add(l); }
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.03), toon('#262a38')); m.position.set(0, 1.05, -0.2); outline(m); g.add(m);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.33), new THREE.MeshBasicMaterial({ color: '#7fd3ff' })); glow.position.set(0, 1.05, -0.183); g.add(glow);
    const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 6, 12), toon(top)); bodyM.position.set(0, 1.0, 0.45); outline(bodyM); g.add(bodyM);
    // the head is the character's drawn portrait, always facing you (a paper-cutout look that matches the phone)
    const headTex = canvasTex(256, 256, (cg) => { cg.beginPath(); cg.arc(128, 128, 124, 0, 7); cg.fillStyle = '#141320'; cg.fill(); portrait(cg, look, 6, 6, 244, 'calm'); });
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: headTex, transparent: true })); head.scale.set(0.42, 0.42, 1); head.position.set(0, 1.47, 0.45); g.add(head);
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), toon('#444b63')); chair.position.set(0, 0.95, 0.7); g.add(chair);
    people.push({ g, head, ph: Math.random() * 6 });
  }
  colleague(-3.0, -0.2, 0.5, 'barista', '#2f7a5a');
  colleague(3.0, -0.4, -0.55, 'internet', '#6b4fc4');
  colleague(-2.6, 2.6, 2.6, 'supplies', '#3d4a5c');
  // a water cooler and a shelf of binders
  const cooler = box(0.3, 1.0, 0.3, toon('#e9ecf2'), 3.9, 0.5, -1.7); const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.34, 16), new THREE.MeshToonMaterial({ color: '#8fd3ff', gradientMap: ramp, transparent: true, opacity: 0.8 })); bottle.position.set(3.9, 1.17, -1.7); scene.add(bottle);
  box(1.2, 0.04, 0.3, toon('#6b5a46'), 3.2, 1.5, -2.05);
  for (let i = 0; i < 9; i++) box(0.09, 0.3, 0.24, toon(['#e8463c', '#3f7de8', '#ffd166', '#57c26f'][i % 4]), 2.72 + i * 0.11, 1.67, -2.05, false);

  // ---------------------------------------------------------------- camera, modes and picking
  const views = {
    desk: { pos: new THREE.Vector3(0, 1.42, 0.82), look: new THREE.Vector3(0, 1.0, -0.7) },
    monitor: { pos: new THREE.Vector3(0, 1.29, -0.1), look: new THREE.Vector3(0, 1.29, -0.78) },
    phone: { pos: new THREE.Vector3(0, 1.42, 0.82), look: new THREE.Vector3(0.04, 1.08, -0.4) },
  };
  let mode = 'desk', parallax = { x: 0, y: 0 };
  const camPos = views.desk.pos.clone(), camLook = views.desk.look.clone();
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hover = null, ringing = false, ringT = 0, size = { w: 1, h: 1 };
  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1; size = { w, h };
    renderer.setSize(w, h, false); camera.aspect = w / h;
    // narrow windows need a wider view to keep the desk in frame
    camera.fov = w / h < 1.3 ? 62 : 52; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);
  function pick(e) {
    const rct = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - rct.left) / rct.width) * 2 - 1, -((e.clientY - rct.top) / rct.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([screen, phScreen, body, bezel], false);
    return hits[0] || null;
  }
  let dragTarget = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => {
    const h = pick(e);
    if (mode === 'phone') {
      if (h && h.object === phScreen) { dragTarget = 'phone'; hooks.phone('down', h.uv.x * PH_W, (1 - h.uv.y) * PH_H, e); }
      else if (!(h && h.object === body)) setMode('desk');
      return;
    }
    if (mode === 'monitor') {
      if (h && h.object === screen) { dragTarget = 'monitor'; el.setPointerCapture(e.pointerId); hooks.monitor('down', h.uv.x * MON_W, (1 - h.uv.y) * MON_H, e); }
      else if (h && (h.object === phScreen || h.object === body)) setMode('phone');
      else if (!(h && h.object === bezel)) setMode('desk');   // clicking away from the screen sits back (as the hint says)
      return;
    }
    if (h && (h.object === phScreen || h.object === body)) setMode('phone');
    else if (h && (h.object === screen || h.object === bezel)) setMode('monitor');
  });
  el.addEventListener('pointermove', e => {
    const rct = el.getBoundingClientRect();
    parallax.x = ((e.clientX - rct.left) / rct.width - 0.5); parallax.y = ((e.clientY - rct.top) / rct.height - 0.5);
    const h = pick(e);
    hover = h ? h.object : null;
    el.style.cursor = mode === 'desk' && h ? 'pointer' : mode !== 'desk' && h && (h.object === screen || h.object === phScreen) ? 'default' : mode === 'desk' ? 'default' : 'zoom-out';
    if (dragTarget === 'monitor') { if (h && h.object === screen) hooks.monitor('move', h.uv.x * MON_W, (1 - h.uv.y) * MON_H, e); }
    else if (mode === 'monitor' && h && h.object === screen) hooks.monitor('hover', h.uv.x * MON_W, (1 - h.uv.y) * MON_H, e);
    if (mode === 'phone' && h && h.object === phScreen) hooks.phone(dragTarget === 'phone' ? 'move' : 'hover', h.uv.x * PH_W, (1 - h.uv.y) * PH_H, e);
  });
  el.addEventListener('pointerup', e => {
    const h = pick(e);
    if (dragTarget === 'monitor') hooks.monitor('up', h && h.object === screen ? h.uv.x * MON_W : -1, h && h.object === screen ? (1 - h.uv.y) * MON_H : -1, e);
    if (dragTarget === 'phone') hooks.phone('up', h && h.object === phScreen ? h.uv.x * PH_W : -1, h && h.object === phScreen ? (1 - h.uv.y) * PH_H : -1, e);
    dragTarget = null;
  });
  el.addEventListener('wheel', e => { if (mode === 'phone') { e.preventDefault(); hooks.phone('wheel', e.deltaY, 0, e); } else if (mode === 'monitor') { e.preventDefault(); hooks.monitor('wheel', e.deltaY, 0, e); } }, { passive: false });
  function setMode(m) { if (m === mode) return; mode = m; hooks.mode(m); }

  // ---------------------------------------------------------------- each frame
  const tmp = new THREE.Vector3(), q1 = new THREE.Quaternion(), held = new THREE.Object3D();
  let last = performance.now(), t = 0, clockAt = 0, lastHover = null, idleAt = 0;
  const prevCam = new THREE.Vector3(), prevPhone = new THREE.Vector3(), glowOn = new THREE.Color('#3a3f66'), phoneGlow = new THREE.Color('#4a3a7a'), black = new THREE.Color('#000000');
  function frame(redrawn = { mon: true, ph: true }) {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    const v = views[mode === 'phone' ? 'phone' : mode];
    const px = mode === 'desk' ? parallax.x * 0.25 : mode === 'phone' ? parallax.x * 0.05 : 0, py = mode === 'desk' ? -parallax.y * 0.12 : 0;
    camPos.lerp(tmp.set(v.pos.x + px * 0.4, v.pos.y + py * 0.3, v.pos.z), 1 - Math.pow(0.001, dt));
    camLook.lerp(tmp.set(v.look.x + px, v.look.y + py, v.look.z), 1 - Math.pow(0.001, dt));
    camera.position.copy(camPos); camera.lookAt(camLook);
    // the phone: on the desk, or held up in front of you (it buzzes while ringing)
    if (mode === 'phone') {
      held.position.copy(camera.position); held.quaternion.copy(camera.quaternion);
      held.translateZ(-0.24); held.translateY(-0.004); held.translateX(0.0);
      phone.position.lerp(held.position, 1 - Math.pow(0.0005, dt));
      q1.copy(camera.quaternion); phone.quaternion.slerp(q1, 1 - Math.pow(0.0005, dt));
    } else {
      phone.position.lerp(restPos, 1 - Math.pow(0.001, dt));
      q1.setFromEuler(restRot); phone.quaternion.slerp(q1, 1 - Math.pow(0.001, dt));
      if (ringing) { ringT += dt; const b = Math.sin(ringT * 60) * (Math.sin(ringT * 3) > 0 ? 1 : 0); phone.position.x += b * 0.003; phone.position.y += Math.abs(b) * 0.002; }
    }
    // gentle highlight on what you can click
    bezel.material.emissive.copy(mode === 'desk' && (hover === screen || hover === bezel) ? glowOn : black);
    body.material.emissive.copy((mode === 'desk' && (hover === phScreen || hover === body)) || (ringing && Math.sin(t * 8) > 0) ? phoneGlow : black);
    for (const p of people) { p.head.material.rotation = Math.sin(t * 0.7 + p.ph) * 0.06; p.head.position.y = 1.47 + Math.sin(t * 1.3 + p.ph) * 0.008; }
    let changed = false;
    if (now - clockAt > 1000) { clockAt = now; drawClock(); changed = true; }
    if (redrawn.mon) { monTex.needsUpdate = true; changed = true; }
    if (redrawn.ph) { phTex.needsUpdate = true; changed = true; }
    const camMoved = prevCam.distanceToSquared(camera.position) > 1e-10, phoneMoved = prevPhone.distanceToSquared(phone.position) > 1e-10;
    prevCam.copy(camera.position); prevPhone.copy(phone.position);
    if (phoneMoved) renderer.shadowMap.needsUpdate = true;
    if (hover !== lastHover) { lastHover = hover; changed = true; }
    renderer.render(scene, camera);   // about 1 ms a frame even on Intel graphics: drawing every frame keeps it smooth
  }
  // ---------------------------------------------------------------- where things are on the page (for the tutorial)
  const pv = new THREE.Vector3(), box3 = new THREE.Box3();
  function toPage(v) {
    camera.updateMatrixWorld(); v.project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
  }
  function bound(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x = Math.min(...xs), y = Math.min(...ys); return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }; }
  /** A rectangle on the phone or monitor screen (canvas pixels) as a page rectangle. */
  function rectOn(which, x, y, w, h) {
    const m = which === 'phone' ? phScreen : screen, W = which === 'phone' ? PH_W : MON_W, H = which === 'phone' ? PH_H : MON_H;
    const gw = m.geometry.parameters.width, gh = m.geometry.parameters.height; m.updateWorldMatrix(true, false);
    return bound([[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([cx, cy]) => toPage(pv.set((cx / W - 0.5) * gw, (0.5 - cy / H) * gh, 0).applyMatrix4(m.matrixWorld))));
  }
  /** The whole phone or computer as a page rectangle. */
  function rectOf(which) {
    const o = which === 'phone' ? phone : monGroup; o.updateWorldMatrix(true, true); box3.setFromObject(o);
    const a = box3.min, b = box3.max, pts = [];
    for (const x of [a.x, b.x]) for (const y of [a.y, b.y]) for (const z of [a.z, b.z]) pts.push(toPage(pv.set(x, y, z)));
    return bound(pts);
  }
  return {
    rectOn, rectOf, setNotes,
    frame, setMode, get mode() { return mode; }, monCanvas, phCanvas, drawBoard, drawPlate,
    ring(on) { ringing = on; ringT = 0; },
  };
}
