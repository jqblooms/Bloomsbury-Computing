// The lab room for Network Builder 3D: a tiled floor (one colour per room), low walls round it, room names that
// float over each room on the map view, and a camera that follows you from behind (drag or Q / E to turn, wheel to
// zoom) or shows the whole room from above. One renderer for the whole visit; each mission swaps only the floor
// plan (setRoom). It draws only when main.js calls view.render(dt), so nothing that matters waits on a frame.
//
//   const view = create(container);
//   view.setRoom({ w, h, rows, regions }); view.scene; view.follow(x, y); view.setFit(fw);
//   view.rotateInput(dx, dy); view.render(dt);
import * as THREE from 'three';

const T = 100, WALL_H = 70;
const FLOORS = [0x8fa3b8, 0xa69a7c, 0x8fae9a];   // Room 1, Room 2, Library (and the plain lab)
const SHELF_FLOOR = 0x6b7280;

function textSprite(text, size) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const font = '700 ' + size + 'px "Segoe UI", Arial, sans-serif';
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + size, h = Math.ceil(size * 1.5);
  c.width = w; c.height = h;
  g.fillStyle = 'rgba(20,24,31,.82)'; g.beginPath(); g.roundRect(0, 0, w, h, h / 2); g.fill();
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(w * 2, h * 2, 1); s.renderOrder = 10;
  return s;
}

function dispose(o) {
  o.traverse(x => {
    x.geometry?.dispose?.();
    for (const m of [].concat(x.material || [])) { m.map?.dispose?.(); m.dispose?.(); }
  });
}

export function create(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));   // school laptops
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.prepend(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
  const scene = new THREE.Scene();
  const bg = getComputedStyle(document.body).backgroundColor;
  try { scene.background = new THREE.Color(bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : '#14171c'); } catch (e) { scene.background = new THREE.Color(0x14171c); }
  const camera = new THREE.PerspectiveCamera(55, 1, 10, 30000);
  scene.add(new THREE.HemisphereLight(0xf2f5ff, 0x404650, 2.4));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
  scene.add(sun);
  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container); resize();

  let W = 1, H = 1, roomG = null, labels = [];
  function setRoom(map) {
    if (roomG) { scene.remove(roomG); dispose(roomG); }
    roomG = new THREE.Group(); scene.add(roomG); labels = [];
    W = map.w; H = map.h;
    const rows = map.rows;
    sun.position.set(W * T * 0.3, 3000, H * T * 0.9);
    const zoneAt = (x, y) => (map.regions || []).find(r => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1);
    const floorTiles = [], wallTiles = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) (rows[y][x] !== '#' ? floorTiles : wallTiles).push([x, y]);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(T * 0.98, 12, T * 0.98), new THREE.MeshStandardMaterial({ roughness: 0.9 }), floorTiles.length);
    floorTiles.forEach(([x, y], i) => {
      m4.makeTranslation(x * T + T / 2, -6, y * T + T / 2); floor.setMatrixAt(i, m4);
      const r = zoneAt(x, y);
      col.setHex(!r ? 0x7d8794 : r.shelf ? SHELF_FLOOR : FLOORS[(r.index || 0) % FLOORS.length]);
      if ((x + y) % 2) col.multiplyScalar(0.93);
      floor.setColorAt(i, col);
    });
    roomG.add(floor);
    const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(T, WALL_H, T), new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 }), wallTiles.length);
    wallTiles.forEach(([x, y], i) => { m4.makeTranslation(x * T + T / 2, WALL_H / 2 - 12, y * T + T / 2); wall.setMatrixAt(i, m4); });
    roomG.add(wall);
    for (const r of map.regions || []) {
      if (!r.shelf && r.x0 > 1) {   // a white line on the floor where one room meets the next
        const line = new THREE.Mesh(new THREE.BoxGeometry(8, 2, (r.y1 - r.y0 + 1) * T), new THREE.MeshBasicMaterial({ color: 0xe5e7eb }));
        line.position.set(r.x0 * T, 1, (r.y0 + r.y1 + 1) / 2 * T); roomG.add(line);
      }
      if (!r.name) continue;
      const s = textSprite(r.name, 56);
      s.position.set((r.x0 + r.x1 + 1) / 2 * T, 420, (r.shelf ? r.y1 + 1 : r.y0 + 1.5) * T);
      roomG.add(s); labels.push(s);
    }
  }

  // ---- camera: behind you (drag to turn), or the whole room from above
  let yaw = 0, pitch = 0.75, dist = 760, overview = false;
  const focus = new THREE.Vector3(), want = focus.clone();
  function placeCamera(dt) {
    const k = 1 - Math.exp(-dt * 8);
    focus.lerp(want, k);
    if (overview) {
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const span = Math.max((H * T / 2 + 200) / half, (W * T / 2 + 200) / (half * camera.aspect)) * 1.02;
      const target = new THREE.Vector3(W * T / 2, 0, H * T / 2);
      camera.position.lerp(new THREE.Vector3(target.x, span, target.z + span * 0.15), k);
      camera.lookAt(target);
    } else {
      const y = Math.sin(pitch) * dist, h = Math.cos(pitch) * dist;
      camera.position.set(focus.x + Math.sin(yaw) * h, focus.y + 90 + y, focus.z + Math.cos(yaw) * h);
      camera.lookAt(focus.x, focus.y + 90, focus.z);
    }
  }
  const el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }; });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) down.moved = true;
    if (down.moved && !overview) { yaw = down.yaw - dx * 0.008; pitch = Math.min(1.3, Math.max(0.3, down.pitch + dy * 0.004)); }
  });
  addEventListener('pointerup', () => { down = null; });
  el.addEventListener('wheel', e => { if (!overview) { dist = Math.min(1600, Math.max(380, dist * Math.exp(e.deltaY * 0.001))); e.preventDefault(); } }, { passive: false });
  document.addEventListener('keydown', e => {
    if (/input|select|textarea/i.test(e.target?.tagName || '')) return;
    if (e.key === 'q' || e.key === 'Q') yaw += 0.25; else if (e.key === 'e' || e.key === 'E') yaw -= 0.25;
  });

  return {
    scene, camera, renderer, setRoom,
    follow(x, y) { want.set(x * T + T / 2, 0, y * T + T / 2); },
    jump(x, y) { want.set(x * T + T / 2, 0, y * T + T / 2); focus.copy(want); },
    setFit(fw) { overview = fw >= W; },
    // a key direction (dx right, dy down the screen) as a direction on the floor, relative to the camera
    rotateInput(dx, dy) { const a = overview ? 0 : yaw, c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; },
    render(dt) { for (const l of labels) l.visible = overview; placeCamera(dt); renderer.render(scene, camera); }
  };
}
