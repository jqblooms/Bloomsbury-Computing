// Search Buddies 3D: the world round the characters. A bright stage with one tile per position (numbered from 1),
// a "Not needed" area at the back, the LOW, HIGH and MID tags, confetti, and a camera that frames the part of the
// list still being searched. The student can drag to turn the camera and use the wheel to zoom, a little.
// Drawing happens only when main.js calls render(dt), so nothing that matters waits on an animation frame.
import * as THREE from 'three';

let SP = 1.06;                   // space between positions (closer for long lists)
export const BACK_Z = -2.7;      // where the characters who are not needed sit
const TAG_COL = { LOW: '#1c7ed6', HIGH: '#e8590c', MID: '#7048e8' };

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function pill(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

export function createStage(container, opts) {
  const reduced = !!opts.reducedMotion;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));   // school laptops
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.prepend(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfeaff);
  scene.fog = new THREE.Fog(0xcfeaff, 30, 80);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb7d8, 1.9));
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.6); sun.position.set(-4, 10, 8); scene.add(sun);

  // the ground: a big soft disc, and a lighter stage under the line
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshLambertMaterial({ color: 0xbfe3b4 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  let world = new THREE.Group(); scene.add(world);
  let n = 0, tiles = [], tagSprites = {}, tagPos = {}, tagGoal = {};
  const xOf = p => (p - (n + 1) / 2) * SP;

  const tileGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92);
  const tileMat = {
    on: new THREE.MeshLambertMaterial({ color: 0xfff6dd }),
    off: new THREE.MeshLambertMaterial({ color: 0xc9ced6 }),
    LOW: new THREE.MeshLambertMaterial({ color: 0x74c0fc }),
    HIGH: new THREE.MeshLambertMaterial({ color: 0xffa94d }),
    MID: new THREE.MeshLambertMaterial({ color: 0xb197fc }),
    FOUND: new THREE.MeshLambertMaterial({ color: 0x8ce99a })
  };

  function tagSprite(text) {
    const tex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = TAG_COL[text]; pill(g, 6, 6, w - 12, h - 12, 40); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 6; pill(g, 6, 6, w - 12, h - 12, 40); g.stroke();
      g.fillStyle = '#ffffff'; g.font = '800 56px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + 3);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.set(0.9, 0.34, 1); s.renderOrder = 20; s.visible = false; s.userData.ownMat = true;
    return s;
  }

  function build(count) {
    scene.remove(world);
    world.traverse(o => {
      if (o.userData.own) o.geometry.dispose();
      if (o.userData.own || o.userData.ownMat) for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); }
    });
    world = new THREE.Group(); scene.add(world);
    n = count; tiles = []; SP = n > 21 ? 0.95 : 1.06;
    const len = n * SP + 1.4;
    // the stage the line stands on
    const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 2.1), new THREE.MeshLambertMaterial({ color: 0xf7d9a8 }));
    deck.position.set(0, 0.0, 0.25); deck.userData.own = true; world.add(deck);
    // the "Not needed" area at the back
    const back = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 1.5), new THREE.MeshLambertMaterial({ color: 0xd5d9e0 }));
    back.position.set(0, 0.0, BACK_Z); back.userData.own = true; world.add(back);
    const signTex = canvasTex(512, 96, (g, w, h) => {
      g.fillStyle = '#6b7385'; g.font = '800 64px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NOT NEEDED', w / 2, h / 2 + 4);
    });
    for (const x of n > 12 ? [-len / 2 + 2.2, len / 2 - 2.2] : [0]) {
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
      lab.rotation.x = -Math.PI / 2; lab.position.set(x, 0.03, BACK_Z - 1.05); lab.userData.own = true; world.add(lab);
    }
    for (let p = 1; p <= n; p++) {
      const t = new THREE.Mesh(tileGeo, tileMat.on); t.position.set(xOf(p), 0.05, 0); world.add(t); tiles[p] = t;
      const num = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(128, 80, (g, w, h) => {
        g.fillStyle = '#4a3b22'; g.font = '800 58px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(p), w / 2, h / 2 + 3);
      }) }));
      num.rotation.x = -Math.PI / 2; num.position.set(xOf(p), 0.04, 0.78); num.userData.own = true; world.add(num);
    }
    tagSprites = {}; tagPos = {}; tagGoal = {};
    for (const k of ['LOW', 'HIGH', 'MID']) { tagSprites[k] = tagSprite(k); world.add(tagSprites[k]); }
    confetti.reset(); world.add(confetti.mesh);
  }

  // LOW, HIGH and MID: a coloured tile and a tag over the character. p = 0 hides it.
  // Tags on the same position stack up so all of them can be read.
  let marks = { LOW: 0, HIGH: 0, MID: 0 }, range = [1, 0], foundAt = 0;
  function setMarks(m) {
    marks = Object.assign({}, marks, m);
    const order = ['LOW', 'HIGH', 'MID'];
    const used = {};
    for (const k of order) {
      const p = marks[k], s = tagSprites[k];
      if (!p) { s.visible = false; continue; }
      const stack = used[p] || 0; used[p] = stack + 1;
      const goal = { x: xOf(p), y: 1.72 + stack * 0.38 + (k === 'MID' ? 0.3 : 0) };
      if (!s.visible) { tagPos[k] = { x: goal.x, y: goal.y + 0.6 }; s.visible = true; }
      tagGoal[k] = goal;
    }
    paintTiles();
  }
  function setRange(lo, hi, found) { range = [lo, hi]; foundAt = found || 0; paintTiles(); }
  function paintTiles() {
    for (let p = 1; p <= n; p++) {
      let m = p >= range[0] && p <= range[1] ? tileMat.on : tileMat.off;
      if (p === marks.LOW) m = tileMat.LOW;
      if (p === marks.HIGH) m = tileMat.HIGH;
      if (p === marks.MID) m = tileMat.MID;
      if (p === foundAt) m = tileMat.FOUND;
      tiles[p].material = m;
    }
  }

  // confetti: one instanced mesh of little paper squares
  const confetti = (() => {
    const N = reduced ? 70 : 360;
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.13), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), N);
    mesh.frustumCulled = false; mesh.count = 0;
    const cols = [0xff6b6b, 0xffd43b, 0x69db7c, 0x4dabf7, 0xda77f2, 0xff922b].map(c => new THREE.Color(c));
    const P = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
    for (let i = 0; i < N; i++) { P.push({ x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, sx: 0, sy: 0, life: 0 }); mesh.setColorAt(i, cols[i % cols.length]); }
    return {
      mesh,
      reset() { mesh.count = 0; P.forEach(p => { p.life = 0; }); },
      burst(x, y, z) {
        mesh.count = N;
        for (const p of P) {
          const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3;
          Object.assign(p, { x, y, z, vx: Math.cos(a) * s * 0.8, vy: 3.5 + Math.random() * 4, vz: Math.sin(a) * s * 0.6 + 0.6, rx: Math.random() * 6, ry: Math.random() * 6, sx: (Math.random() - 0.5) * 14, sy: (Math.random() - 0.5) * 14, life: 4 + Math.random() * 2.5 });
        }
      },
      step(dt) {
        if (!mesh.count) return;
        let alive = 0;
        P.forEach((p, i) => {
          if (p.life > 0) {
            p.life -= dt; alive++;
            p.vy -= 6 * dt; const drag = Math.exp(-1.6 * dt); p.vx *= drag; p.vz *= drag; p.vy = Math.max(p.vy, -1.6);
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rx += p.sx * dt; p.ry += p.sy * dt;
            if (p.y < 0.03) { p.y = 0.03; p.vx = p.vz = 0; p.sx = p.sy = 0; }
          }
          q.setFromEuler(e.set(p.rx, p.ry, 0)); v.set(p.x, p.life > 0 ? p.y : -5, p.z);
          mesh.setMatrixAt(i, m4.compose(v, q, one));
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (!alive) mesh.count = 0;
      }
    };
  })();

  // ---- camera: frames x from a to b; drag turns it a little, the wheel zooms a little
  const cam = { cx: 0, w: 10, goalCx: 0, goalW: 10, yaw: 0, pitch: 0.56, uYaw: 0, uPitch: 0, uZoom: 1, gYaw: 0, gPitch: 0, gZoom: 1, shake: 0 };
  function frame(a, b, instant) {
    cam.goalCx = (a + b) / 2; cam.goalW = Math.max(4.2, b - a + 1.6);
    if (instant) { cam.cx = cam.goalCx; cam.w = cam.goalW; }
  }
  function resetView() { cam.gYaw = 0; cam.gPitch = 0; cam.gZoom = 1; }
  let drag = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { el.setPointerCapture(e.pointerId); } catch (x) { } });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    cam.gYaw = Math.max(-0.9, Math.min(0.9, cam.gYaw - (e.clientX - drag.x) * 0.005));
    cam.gPitch = Math.max(-0.2, Math.min(0.6, cam.gPitch + (e.clientY - drag.y) * 0.004));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const endDrag = () => { drag = null; };
  el.addEventListener('pointerup', endDrag); el.addEventListener('pointercancel', endDrag);
  el.addEventListener('wheel', e => { e.preventDefault(); cam.gZoom = Math.max(0.55, Math.min(1.5, cam.gZoom * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: false });
  el.addEventListener('dblclick', resetView);

  let vw = 1, vh = 1;
  const resize = () => {
    vw = container.clientWidth || 1; vh = container.clientHeight || 1;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(container);
  window.addEventListener('resize', resize);
  resize();

  function placeCamera(dt) {
    const k = 1 - Math.exp(-2.6 * dt), ku = 1 - Math.exp(-8 * dt);
    cam.cx += (cam.goalCx - cam.cx) * k; cam.w += (cam.goalW - cam.w) * k;
    cam.uYaw += (cam.gYaw - cam.uYaw) * ku; cam.uPitch += (cam.gPitch - cam.uPitch) * ku; cam.uZoom += (cam.gZoom - cam.uZoom) * ku;
    // distance so that the width fits across the view (and the height of the characters fits too)
    const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const dW = (cam.w / 2) / Math.tan(hf / 2), dH = 2.4 / Math.tan(vf / 2);
    const d = Math.max(dW, dH, 5) * cam.uZoom + 1.2;
    const pitch = cam.pitch + cam.uPitch, yaw = cam.yaw + cam.uYaw;
    const look = new THREE.Vector3(cam.cx, 0.6, 0);
    camera.position.set(look.x + Math.sin(yaw) * Math.cos(pitch) * d, look.y + Math.sin(pitch) * d, look.z + Math.cos(yaw) * Math.cos(pitch) * d);
    if (cam.shake > 0 && !reduced) { camera.position.x += (Math.random() - 0.5) * cam.shake; camera.position.y += (Math.random() - 0.5) * cam.shake; cam.shake = Math.max(0, cam.shake - dt * 0.6); }
    camera.lookAt(look);
  }

  const tmp = new THREE.Vector3();
  return {
    scene, camera, renderer, xOf, build, setMarks, setRange, frame, resetView,
    get n() { return n; },
    addToWorld(o) { world.add(o); },
    shake(a) { if (!reduced) cam.shake = Math.max(cam.shake, a); },
    burst(x, y, z) { confetti.burst(x, y, z); },
    // world point to a pixel in the container (or null when behind the camera)
    toScreen(v) { tmp.copy(v).project(camera); if (tmp.z > 1) return null; return { x: (tmp.x + 1) / 2 * vw, y: (1 - tmp.y) / 2 * vh }; },
    render(dt) {
      for (const k in tagSprites) {
        const s = tagSprites[k]; if (!s.visible || !tagGoal[k]) continue;
        const p = tagPos[k] || (tagPos[k] = { ...tagGoal[k] }), g = tagGoal[k], kk = 1 - Math.exp(-6 * dt);
        p.x += (g.x - p.x) * kk; p.y += (g.y - p.y) * kk;
        s.position.set(p.x, p.y + Math.sin(performance.now() / 400 + p.x) * 0.04, 0);
      }
      confetti.step(dt);
      placeCamera(dt);
      renderer.render(scene, camera);
    }
  };
}
