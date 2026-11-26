// Data Bridge 3D (single player): the 3D BUILD MODE. Ported from the party server's team builder; here the design is
// the page's own (no server, no teammates), so a beam is added or removed at once.
//   createBuilder({ scene, camera, renderer, host, design: () => d, level: () => lv, coins: () => n, onChange, onSend, onClose })
//     -> { open(), close(), frame(dt, t), refresh(), setTool(k), undo(), say(text), active, tool, screenOf(x, y) }
// design() is the round's design ({ nodes, beams }, squares), changed in place with Ph.addBeam / Ph.removeBeam (the
// website's rules: Ph.beamProblem, Ph.beamCost). onChange() after every change (the page saves and redraws the bridge),
// onSend() for the Send the cart button, onClose() when build mode closes (B, Esc or Walk).
// While active the builder owns the keyboard (Esc or B closes; 1/2/3 materials, X delete, Z undo, arrows pan) and the
// mouse on the canvas (left: build, right-drag: pan, wheel: zoom). Click a joint then a point also works (no drag).
// The renderer clips away everything nearer the camera than the lane while it is open; the fov eases to 34.
import * as THREE from 'three';
import { Ph, T, MID_Z, LANE_W, MAT_COL, textSprite } from './util.js';

const FOV = 34;
const PRICE = m => Ph.MATS[m].price;
const NAME = { road: 'Road', wood: 'Wood', steel: 'Steel' };
function shortWhy(why) {
  if (!why) return '';
  if (/Too long/.test(why)) return 'Too long';
  if (/through/.test(why)) return 'Goes through the ground';
  if (/inside/.test(why)) return 'Not inside the ground';
  if (/already/.test(why)) return 'Already a beam';
  return 'Not here';
}

const dotGeo = new THREE.SphereGeometry(1, 10, 8), ringGeo = new THREE.TorusGeometry(1, 0.16, 8, 28), boxGeo = new THREE.BoxGeometry(1, 1, 1);
const overlay = (m, o = 1) => { m.depthTest = false; m.depthWrite = false; m.transparent = true; m.opacity = o; return m; };
const basic = (c, o) => overlay(new THREE.MeshBasicMaterial({ color: c }), o);
const M = {
  faint: basic(0xeef3ff, 0.6), reach: basic(0xffffff, 0.95), joint: basic(0xffffff, 1), hover: basic(0xffffff, 1),
  bad: basic(0xff4d4d, 0.8), del: basic(0xff4d4d, 0.55),
  ghost: Object.fromEntries(['road', 'wood', 'steel'].map(k => [k, basic(MAT_COL[k], 0.85)])),
};
const GOLD = new THREE.Color('#ffc928'), WHITE = new THREE.Color('#ffffff');

export function createBuilder(opts) {
  const { scene, camera, renderer } = opts, canvas = renderer.domElement;
  let active = false, mat = 'road', tool = 'road';
  let lv = null, levelKey = '', zPlane = 0, valid = [], ver = 0;
  let mouse = null, raw = null, hover = null, sel = null, dragId = null, sticky = false;
  let pan = null, panX = 0, panY = 0, zoom = 1, zoomT = 1;
  let swing = 0, msgT = 0, delHover = -1, sendSure = false;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tgtPos = new THREE.Vector3(), tgtLook = new THREE.Vector3();
  const undoList = [];
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  let fov0 = 55, upx = 3, upxDots = 0;

  // ---------------------------------------------------------------- 3D pieces
  const root = new THREE.Group(); root.visible = false; scene.add(root);
  const MAXP = (Ph.WORLD_W + 1) * (Ph.Y_MAX - Ph.Y_MIN + 1);
  const faint = new THREE.InstancedMesh(dotGeo, M.faint, MAXP), reach = new THREE.InstancedMesh(dotGeo, M.reach, 120), joints = new THREE.InstancedMesh(dotGeo, M.joint, 400);
  for (const m of [faint, reach, joints]) { m.count = 0; m.frustumCulled = false; m.renderOrder = 21; root.add(m); }
  joints.renderOrder = 23; joints.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(400 * 3), 3);
  const hoverRing = new THREE.Mesh(ringGeo, M.hover), selRing = new THREE.Mesh(ringGeo, basic(0xffc928, 1));
  hoverRing.renderOrder = selRing.renderOrder = 24; root.add(hoverRing, selRing);
  const ghost = new THREE.Mesh(boxGeo, M.ghost.road); ghost.renderOrder = 22; root.add(ghost);
  const delBox = new THREE.Mesh(boxGeo, M.del); delBox.renderOrder = 22; root.add(delBox);
  let label = null, labelText = '';
  const mtx = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const setDot = (im, i, x, y, r) => { mtx.compose(v.set(x * T, y * T, zPlane), q0, sc.set(r, r, r)); im.setMatrixAt(i, mtx); };
  function beamBox(mesh, a, b, th) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    mesh.position.set((a.x + b.x) / 2 * T, (a.y + b.y) / 2 * T, zPlane); mesh.rotation.set(0, 0, Math.atan2(b.y - a.y, b.x - a.x));
    mesh.scale.set(Math.max(1, len * T), th, th);
  }
  const zoomScale = () => upx * 0.42;
  function setLabel(text, x, y, bad) {
    const key = text + (bad ? '!' : '');
    if (key !== labelText) {
      if (label) { root.remove(label); label.material.map.dispose(); label.material.dispose(); }
      label = text ? textSprite(text, 34, bad ? 'rgba(200,40,40,.92)' : 'rgba(14,18,28,.88)') : null; labelText = key;
      if (label) { label.renderOrder = 30; label.userData.s = label.scale.clone(); root.add(label); }
    }
    if (label) { label.position.set(x * T, y * T + 34 * upx, zPlane); label.scale.copy(label.userData.s).multiplyScalar(zoomScale()); }
  }

  // ---------------------------------------------------------------- DOM: tool bar, message, help
  const bar = document.createElement('div'); bar.className = 'b3b'; bar.hidden = true;
  bar.innerHTML = '<div class="grp">' + Ph.MAT_ORDER.map((k, i) => `<button type="button" data-t="${k}" title="${NAME[k]} (key ${i + 1})"><i style="background:${MAT_COL[k]}"></i>${NAME[k]} <small>${PRICE(k)} a square</small></button>`).join('') +
    '</div><div class="grp"><button type="button" data-t="delete" title="Delete (key X)">Delete</button><button type="button" data-a="undo" title="Undo (key Z)">Undo</button></div>' +
    '<div class="money">Bridge <b class="cost">0</b> of <b class="coins">0</b> coins</div>' +
    '<div class="grp"><button type="button" class="go" data-a="send">Send the cart</button><button type="button" data-a="walk" title="Walk (B or Esc)">Walk</button></div>';
  const msgEl = document.createElement('div'); msgEl.className = 'b3b-msg'; msgEl.style.opacity = 0; msgEl.setAttribute('role', 'status');
  const help = document.createElement('div'); help.className = 'b3b-help'; help.hidden = true;
  help.innerHTML = 'Drag from a joint to a dot<br>Wheel: zoom. Right-drag: move<br>B or Esc: walk';
  const host = opts.host || document.body;
  host.append(bar, msgEl, help);
  bar.addEventListener('pointerdown', e => e.stopPropagation());
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; b.blur();
    if (b.dataset.t) setTool(b.dataset.t);
    else if (b.dataset.a === 'undo') undo();
    else if (b.dataset.a === 'send') send();
    else if (b.dataset.a === 'walk') close();
  });
  function setTool(k) { tool = k; if (k !== 'delete') mat = k; sel = null; sticky = false; dragId = null; barKey = ''; updateBar(); if (k === 'delete') say('Click a beam to take it away. You get its coins back.'); }
  function say(text) { msgEl.textContent = text; msgEl.style.opacity = 1; msgT = 2.6; }
  let barKey = '';
  function updateBar() {
    const d = design(); if (!d) return;
    const cost = Ph.designCost(d), coins = opts.coins();
    const k = JSON.stringify([tool, cost, coins, undoList.length, sendSure, d.beams.length]);
    if (k === barKey) return; barKey = k;
    bar.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tool));
    bar.querySelector('[data-a="undo"]').disabled = !undoList.length;
    const c = bar.querySelector('.cost'); c.textContent = cost; c.classList.toggle('poor', coins - cost < 10);
    bar.querySelector('.coins').textContent = coins;
    const broke = coins < 3 && !d.beams.length;
    bar.querySelector('[data-a="send"]').textContent = broke ? 'No coins: get a new question' : sendSure ? 'Send it anyway' : 'Send the cart';
  }
  function send() {
    const d = design();
    if (d.beams.length && !d.beams.some(b => b.mat === 'road') && !sendSure) {
      sendSure = true; barKey = ''; updateBar();
      say('There is no road yet. The cart will fall. Press again to send it anyway.');
      return;
    }
    sendSure = false; barKey = '';
    opts.onSend();
  }

  // ---------------------------------------------------------------- the design and the rules
  const design = () => opts.design();
  const same = (p, q) => p.x === q.x && p.y === q.y;
  const isJoint = (d, g) => Ph.findNode(d, g.x, g.y) >= 0;
  function check(a, b) {
    const d = design(), c = Ph.beamCost(mat, a, b);
    const why = Ph.beamProblem(lv, d, a, b);
    return { why: shortWhy(why), poor: Ph.designCost(d) + c > opts.coins(), c, len: Math.hypot(b.x - a.x, b.y - a.y) };
  }
  function changed() { ver++; sendSure = false; barKey = ''; updateBar(); opts.onChange(); }
  function place(a, b) {
    const r = check(a, b);
    if (r.why) { say(r.why); return; }
    if (r.poor) { say('Not enough coins: that beam costs ' + r.c + '.'); return; }
    Ph.addBeam(design(), { x: a.x, y: a.y }, { x: b.x, y: b.y }, mat);
    undoList.push({ type: 'add', a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
    changed();
  }
  function beamNear(p) {
    const d = design(); let best = -1, bd = 0.4;
    d.beams.forEach((bm, i) => {
      const a = d.nodes[bm.a], b = d.nodes[bm.b], ex = b.x - a.x, ey = b.y - a.y, ll = ex * ex + ey * ey || 1;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * ex + (p.y - a.y) * ey) / ll)), dd = Math.hypot(p.x - a.x - ex * t, p.y - a.y - ey * t);
      if (dd < bd) { bd = dd; best = i; }
    });
    return best;
  }
  function delBeam(i) {
    const d = design(), bm = d.beams[i]; if (!bm) return;
    undoList.push({ type: 'del', a: { x: d.nodes[bm.a].x, y: d.nodes[bm.a].y }, b: { x: d.nodes[bm.b].x, y: d.nodes[bm.b].y }, mat: bm.mat });
    Ph.removeBeam(d, i);
    changed();
  }
  function undo() {
    const u = undoList.pop(), d = design(); if (!u) { say('Nothing to undo'); return; }
    const ia = Ph.findNode(d, u.a.x, u.a.y), ib = Ph.findNode(d, u.b.x, u.b.y);
    if (u.type === 'add') {
      for (let i = d.beams.length - 1; i >= 0; i--) {
        const bm = d.beams[i];
        if ((bm.a === ia && bm.b === ib) || (bm.a === ib && bm.b === ia)) { Ph.removeBeam(d, i); break; }
      }
    } else if (Ph.designCost(d) + Ph.beamCost(u.mat, u.a, u.b) <= opts.coins()) Ph.addBeam(d, u.a, u.b, u.mat);
    else say('Not enough coins to put it back.');
    changed();
  }

  // ---------------------------------------------------------------- level: the valid grid points
  function useLevel() {
    const l = opts.level(); if (!l) return false;
    const k = String(l.n); if (k === levelKey) return true;
    levelKey = k; lv = l; zPlane = MID_Z * T;
    plane.constant = -zPlane; clip.constant = (LANE_W + 0.6) * T;
    upxDots = 0; valid = [];
    for (let x = 0; x <= Ph.WORLD_W; x++) for (let y = Ph.Y_MIN; y <= Ph.Y_MAX; y++) if (Ph.pointOk(lv, x, y)) valid.push({ x, y, anchor: Ph.isAnchor(lv, x, y) });
    undoList.length = 0; sel = null; panX = panY = 0; zoom = zoomT = 1; jointKey = reachKey = '';
    return true;
  }
  function drawFaint() {
    if (Math.abs(upx - upxDots) < upxDots * 0.04) return;
    upxDots = upx; jointKey = reachKey = '';
    let n = 0; for (const p of valid) if (!p.anchor) setDot(faint, n++, p.x, p.y, 3.5 * upx);
    faint.count = n; faint.instanceMatrix.needsUpdate = true;
  }
  let reachKey = '', jointKey = '';
  function drawReach() {
    const k = sel ? sel.x + ',' + sel.y + ':' + ver : '';
    if (k === reachKey) return; reachKey = k;
    let n = 0;
    if (sel) {
      const d = design();
      for (const p of valid) {
        if (same(p, sel) || Math.hypot(p.x - sel.x, p.y - sel.y) > Ph.MAX_LEN + 1e-6 || Ph.beamProblem(lv, d, sel, p)) continue;
        if (n < 120) setDot(reach, n++, p.x, p.y, 5 * upxDots);
      }
    }
    reach.count = n; reach.instanceMatrix.needsUpdate = true;
  }
  function drawJoints() {
    const d = design(), k = ver + ':' + d.nodes.length;
    if (k === jointKey) return; jointKey = k;
    let n = 0;
    for (const nd of d.nodes) { if (n >= 400) break; setDot(joints, n, nd.x, nd.y, (nd.fixed ? 9 : 6) * upxDots); joints.setColorAt(n, nd.fixed ? GOLD : WHITE); n++; }
    joints.count = n; joints.instanceMatrix.needsUpdate = true; joints.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- input (only while active; window capture, so nothing reaches player.js)
  function aim() {
    if (!mouse) { raw = null; return; }
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera({ x: (mouse.x - r.left) / r.width * 2 - 1, y: -(mouse.y - r.top) / r.height * 2 + 1 }, camera);
    raw = ray.ray.intersectPlane(plane, hit) ? { x: hit.x / T, y: hit.y / T } : null;
  }
  function snap() {
    hover = null; if (!raw || !lv) return;
    const g = { x: Math.round(raw.x), y: Math.round(raw.y) };
    if (Math.hypot(raw.x - g.x, raw.y - g.y) > 0.5 || g.x < 0 || g.x > Ph.WORLD_W || g.y < Ph.Y_MIN || g.y > Ph.Y_MAX) return;
    if (Ph.pointOk(lv, g.x, g.y) || isJoint(design(), g)) hover = g;
  }
  const onCanvas = e => e.target === canvas;
  addEventListener('pointerdown', e => {
    if (!active || !onCanvas(e)) return;
    e.stopPropagation(); e.preventDefault();
    mouse = { x: e.clientX, y: e.clientY };
    if (e.button === 2 || e.button === 1) { pan = { x: e.clientX, y: e.clientY, px: panX, py: panY }; return; }
    if (e.button !== 0) return;
    aim(); snap();
    if (tool === 'delete') { const i = raw ? beamNear(raw) : -1; if (i >= 0) delBeam(i); else say('Click on a beam to delete it'); return; }
    if (sticky && sel) {
      if (hover && !same(hover, sel)) place(sel, hover);
      sel = null; sticky = false; return;
    }
    if (hover && isJoint(design(), hover)) { sel = hover; dragId = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch (err) { } }
    else say('Start from a joint: a white or gold dot');
  }, true);
  addEventListener('pointermove', e => {
    if (!active) return;
    mouse = { x: e.clientX, y: e.clientY };
    if (pan) {
      const per = upx / T;
      panX = pan.px - (e.clientX - pan.x) * per; panY = pan.py + (e.clientY - pan.y) * per; clampPan();
      e.stopPropagation();
    }
  }, true);
  addEventListener('pointerup', e => {
    if (!active) return;
    if (pan && (e.button === 2 || e.button === 1)) { pan = null; e.stopPropagation(); return; }
    if (dragId == null || e.pointerId !== dragId) return;
    e.stopPropagation(); dragId = null;
    mouse = { x: e.clientX, y: e.clientY }; aim(); snap();
    if (!hover || same(hover, sel)) { sticky = true; return; }
    place(sel, hover); sel = null; sticky = false;
  }, true);
  addEventListener('wheel', e => {
    if (!active || !onCanvas(e)) return;
    e.stopPropagation(); e.preventDefault();
    zoomT = Math.min(2.4, Math.max(0.55, zoomT * Math.exp(-e.deltaY * 0.0012)));
  }, { capture: true, passive: false });
  addEventListener('contextmenu', e => { if (active && onCanvas(e)) e.preventDefault(); }, true);
  addEventListener('keydown', e => {
    if (!active || /input|select|textarea/i.test(e.target?.tagName || '') || e.target?.isContentEditable) return;
    const c = e.code;
    if (c === 'PageUp' || c === 'PageDown') return;   // the classroom clicker
    e.stopPropagation();
    if (c === 'Escape' && sel) { sel = null; sticky = false; return; }
    if (c === 'Escape' || (c === 'KeyB' && !e.repeat)) { e.preventDefault(); close(); return; }
    if (c === 'Digit1' || c === 'Numpad1') setTool('road');
    else if (c === 'Digit2' || c === 'Numpad2') setTool('wood');
    else if (c === 'Digit3' || c === 'Numpad3') setTool('steel');
    else if (c === 'KeyX' || c === 'Delete') setTool('delete');
    else if (c === 'KeyZ' && !e.repeat) { e.preventDefault(); undo(); }
    else if (c.startsWith('Arrow')) { e.preventDefault(); panX += c === 'ArrowLeft' ? -1 : c === 'ArrowRight' ? 1 : 0; panY += c === 'ArrowUp' ? 1 : c === 'ArrowDown' ? -1 : 0; clampPan(); }
    else if (c === 'Space') e.preventDefault();
  }, true);
  addEventListener('blur', () => { pan = null; dragId = null; });
  function clampPan() { panX = Math.max(-12, Math.min(12, panX)); panY = Math.max(-8, Math.min(6, panY)); }

  // ---------------------------------------------------------------- camera: a side view of the gap from the near side
  function aimCamera() {
    const a = lv.anchors;
    const top = Math.max(...a.map(p => p.y)), L = Math.min(lv.L, lv.R), R = Math.max(lv.L, lv.R), cx = (L + R) / 2 + panX, cy = top + 0.3 + panY;
    const w = Math.max(15, R - L + 10), h = 13;
    const vf = FOV * Math.PI / 360, hf = Math.atan(Math.tan(vf) * camera.aspect);
    const D = Math.max(w * T / 2 / Math.tan(hf), h * T / 2 / Math.tan(vf)) / zoom;
    const yaw = 0.15, pitch = 0.17;
    tgtLook.set(cx * T, cy * T, zPlane);
    tgtPos.set(cx * T - Math.sin(yaw) * Math.cos(pitch) * D, cy * T + Math.sin(pitch) * D, zPlane + Math.cos(yaw) * Math.cos(pitch) * D);
    return D;
  }

  // ---------------------------------------------------------------- open / close / refresh / frame
  function open() {
    if (active || !design()) return;
    useLevel(); active = true; root.visible = true; bar.hidden = false; help.hidden = false;
    camPos.copy(camera.position); camera.getWorldDirection(camLook); camLook.multiplyScalar(1200).add(camera.position);
    swing = 0; sel = null; sticky = false; sendSure = false; barKey = jointKey = reachKey = ''; fov0 = camera.fov; upxDots = 0;
    renderer.clippingPlanes = [clip];
    updateBar();
  }
  function close(quiet) {
    if (!active) return;
    active = false; root.visible = false; bar.hidden = true; help.hidden = true; msgEl.style.opacity = 0; msgT = 0;
    sel = null; sticky = false; dragId = null; pan = null; hover = null; mouse = null;
    canvas.style.cursor = '';
    renderer.clippingPlanes = []; camera.fov = fov0; camera.updateProjectionMatrix();
    if (opts.onClose && quiet !== true) opts.onClose();
  }
  function refresh() { levelKey = ''; ver++; barKey = ''; if (active) { useLevel(); updateBar(); } }
  function frame(dt, t) {
    if (!active || !useLevel()) return;
    zoom += (zoomT - zoom) * (1 - Math.exp(-dt * 10));
    aimCamera(); swing = Math.min(1, swing + dt);
    camera.fov += (FOV - camera.fov) * (1 - Math.exp(-dt * 4)); camera.updateProjectionMatrix();
    upx = camPos.distanceTo(camLook) * 2 * Math.tan(camera.fov * Math.PI / 360) / (canvas.clientHeight || 1);
    const k = 1 - Math.exp(-dt * (swing < 1 ? 3.5 : 9));
    camPos.lerp(tgtPos, k); camLook.lerp(tgtLook, k);
    camera.position.copy(camPos); camera.lookAt(camLook);
    aim(); snap();
    const d = design();
    drawFaint(); drawJoints(); drawReach(); faint.visible = !sel && tool !== 'delete';
    hoverRing.visible = !!hover && tool !== 'delete';
    if (hoverRing.visible) { hoverRing.position.set(hover.x * T, hover.y * T, zPlane); hoverRing.scale.setScalar((isJoint(d, hover) ? 15 : 10) * upx); }
    selRing.visible = !!sel;
    if (sel) { selRing.position.set(sel.x * T, sel.y * T, zPlane); selRing.scale.setScalar(16 * upx * (1 + Math.sin(t * 6) * 0.12)); }
    ghost.visible = false; let lab = null;
    if (sel && tool !== 'delete') {
      const to = hover && !same(hover, sel) ? hover : null;
      if (to) {
        const r = check(sel, to), bad = !!r.why || r.poor;
        ghost.material = bad ? M.bad : M.ghost[mat]; beamBox(ghost, sel, to, (mat === 'road' ? 7 : 5) * upx); ghost.visible = true;
        lab = { text: r.why ? r.why : r.poor ? r.c + ' coins: not enough' : NAME[mat] + ': ' + r.c + ' coins, ' + (Math.round(r.len * 10) / 10) + ' squares', x: (sel.x + to.x) / 2, y: Math.max(sel.y, to.y), bad };
      } else if (raw && dragId != null) { ghost.material = M.ghost[mat]; beamBox(ghost, sel, raw, 3 * upx); ghost.visible = true; }
    }
    delHover = tool === 'delete' && raw ? beamNear(raw) : -1;
    delBox.visible = delHover >= 0;
    if (delHover >= 0) { const bm = d.beams[delHover], a = d.nodes[bm.a], b = d.nodes[bm.b]; beamBox(delBox, a, b, 12 * upx); lab = { text: 'Delete: +' + Ph.beamCost(bm.mat, a, b) + ' coins', x: (a.x + b.x) / 2, y: Math.max(a.y, b.y), bad: true }; }
    if (lab) setLabel(lab.text, lab.x, lab.y, lab.bad); else setLabel('', 0, 0, false);
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) msgEl.style.opacity = 0; }
    canvas.style.cursor = pan ? 'grabbing' : tool === 'delete' ? (delHover >= 0 ? 'pointer' : 'default') : hover ? 'pointer' : 'default';
  }

  return {
    open, close, frame, refresh, setTool, undo, say,
    get active() { return active; },
    get tool() { return tool; },
    // for tests: where a grid point (squares) is on the screen (client px)
    screenOf(x, y) { const p = new THREE.Vector3(x * T, y * T, zPlane).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; },
  };
}
