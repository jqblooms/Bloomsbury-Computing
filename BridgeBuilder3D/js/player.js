// Data Bridge 3D gameplay: YOU: input, walking on the bank, falling into the gap, the camera.
//   createPlayer(canvas, { onInteract, onEscape, onBuild }) -> {      onBuild (optional): B was pressed (toggle build mode)
//     pos: { x, z, y, face },             squares; z across your lane from its near edge (0..LANE_W)
//     get hold(),                          Space or the left mouse button is held (gripping the cart)
//     get moving(),
//     place(lv, x, z),                     put you somewhere on the bank (after a crossing, a respawn)
//     walk(dt, lv) -> 'fell' | '',         move by the keys on lv's ground; 'fell' the moment you step into the gap
//     fall(dt, lv) -> 'landed' | '',       while flying/falling (after walking off or being thrown); 'landed' when back at the start
//     throwOff(),                          start a throw off the cart (fall() then flies you)
//     get falling(),
//     camera(camera, laneZ),               place the camera behind you (laneZ = your lane's near edge in squares)
//     (optional extras) get airborne()     in the air from a hop or the drop back in after a fall (pos.y is above the floor)
//                       get squash()       0..1 landing squash, fades out (for the blob, if the glue wants it)
//                       get speed()        walking speed in squares per second
//                       paused             set true while build mode owns the screen: keys do not walk you, hops wait,
//                                          and camera() leaves the camera alone (the glue may also just skip camera())
//                       aboard(lv)         you stand inside the cart's footprint at rest (lv.start.x - 0.5 .. + AXLE + 0.5,
//                                          |z - MID_Z| < 0.95): counts as in the cart for ALL ABOARD
//   }
// Walking: WASD / arrows relative to the camera, with smooth speed-up, slow-down and turning; Q / R or a right-drag
// turns the view, the wheel zooms; Shift or J hops (Space is the grip, never a hop); E interacts (onInteract), Esc
// closes panels (onEscape). Keys are ignored while typing in a text box. Space / left mouse = hold.
// You cannot walk through the answer booth, the plan table or the cart's sides and front: you get into the cart from
// its back end (the spawn side) or by hopping over its rail. Height in the cart is its floor (WHEEL_R + 0.55 above
// lv.start.y), the same height the glue puts you at while you are in it.
// The camera follows smoothly, looks a little ahead (towards the gap), never dips under the bank, and during a ride
// (pos moved by the glue with no walk() call) it pulls back and follows the cart.
import { Ph, T, LANE_W, MID_Z, groundAt, spots } from './util.js';

const SPEED = 4.4, ACCEL = 16, DECEL = 12, TURN = 12, GRAV = 26, HOP_V = 8, R = 0.32;
const CART_HALF_Z = 0.95, CART_FLOOR = Ph.WHEEL_R + 0.55;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
// the bank's top (squares); the level's solid data stops at x = 0, the drawn bank carries on flat behind it
const ground = (lv, x) => groundAt(lv, Math.max(0.05, x));

export function createPlayer(canvas, { onInteract, onEscape, onBuild }) {
  const keys = new Set(), pos = { x: 0, z: MID_Z, y: 0, face: Math.PI / 2 };
  let holdDown = false, moving = false, fall = null, drag = null, hopQueued = false;
  let yaw = -Math.PI / 2, yawT = yaw, pitch = 0.5, dist = 1050, distT = dist;
  let vx = 0, vz = 0, h = 0, vy = 0, baseY = 0, squash = 0, lastLv = null, stepped = false, lastCam = 0, rideMix = 0;
  const cam = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, init: false };
  const typing = e => /input|select|textarea/i.test(e.target?.tagName || '') || e.target?.isContentEditable;
  document.addEventListener('keydown', e => {
    if (typing(e)) return;
    if (e.code === 'Space') { e.preventDefault(); holdDown = true; return; }
    if (e.code === 'Escape') { onEscape(); return; }
    if (e.code === 'KeyE') { e.preventDefault(); onInteract(); return; }
    if (e.code === 'KeyB' && !e.repeat) { if (onBuild) { e.preventDefault(); onBuild(); } return; }
    if (api.paused) return;
    if (e.code === 'KeyQ') { yawT += 0.35; return; }
    if (e.code === 'KeyR') { yawT -= 0.35; return; }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') && !e.repeat) { hopQueued = true; return; }
    if (e.code.startsWith('Arrow')) e.preventDefault();
    keys.add(e.code);
  });
  document.addEventListener('keyup', e => { keys.delete(e.code); if (e.code === 'Space') holdDown = false; });
  document.addEventListener('focusin', e => { if (typing(e)) keys.clear(); });
  addEventListener('blur', () => { keys.clear(); holdDown = false; });
  canvas.addEventListener('pointerdown', e => { if (e.button === 2 || e.pointerType !== 'mouse') drag = { x: e.clientX, y: e.clientY, yaw: yawT, pitch }; else if (e.button === 0) holdDown = true; });
  addEventListener('pointermove', e => { if (!drag) return; yawT = drag.yaw - (e.clientX - drag.x) * 0.008; pitch = Math.min(1.2, Math.max(0.12, drag.pitch + (e.clientY - drag.y) * 0.004)); });
  addEventListener('pointerup', e => { drag = null; if (e.button === 0) holdDown = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { distT = Math.min(1900, Math.max(450, distT * Math.exp(e.deltaY * 0.001))); e.preventDefault(); }, { passive: false });

  // what you bump into on the start bank (squares): two desks as boxes, the cart as three walls (back end open)
  function solids(lv) {
    const sp = spots(lv), cx0 = lv.start.x - 0.5, cx1 = lv.start.x + Ph.AXLE + 0.5;
    return {
      boxes: [{ x: sp.booth.x, z: sp.booth.z, hx: 0.68, hz: 0.48 }, { x: sp.table.x, z: sp.table.z, hx: 0.68, hz: 0.48 }],
      cart: { x0: cx0, x1: cx1, z0: MID_Z - CART_HALF_Z, z1: MID_Z + CART_HALF_Z },
    };
  }
  const inCartBox = (c, x, z) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1;
  // push a circle out of a box (x, z centre; hx, hz half sizes)
  function pushBox(b) {
    const qx = Math.max(b.x - b.hx, Math.min(b.x + b.hx, pos.x)), qz = Math.max(b.z - b.hz, Math.min(b.z + b.hz, pos.z));
    let dx = pos.x - qx, dz = pos.z - qz, d = Math.hypot(dx, dz);
    if (d >= R) return;
    if (d < 1e-4) { // centre inside the box: leave by the nearest side
      const o = [[b.x - b.hx - R - pos.x, 0], [b.x + b.hx + R - pos.x, 0], [0, b.z - b.hz - R - pos.z], [0, b.z + b.hz + R - pos.z]].sort((a, c) => Math.hypot(...a) - Math.hypot(...c))[0];
      pos.x += o[0]; pos.z += o[1]; return;
    }
    pos.x += dx / d * (R - d); pos.z += dz / d * (R - d);
    const n = (vx * dx + vz * dz) / d; if (n < 0) { vx -= n * dx / d; vz -= n * dz / d; }
  }
  // the cart's two sides and front are thin walls; inside you stay inside, outside you stay outside (unless hopping)
  function cartWalls(c, wasIn) {
    if (h > 0.45 && !wasIn) return;                       // hopped high enough to clear the rail (kind to small hops)
    if (wasIn && h > 0.35) return;                        // hopping out of the cart
    const inner = wasIn;
    if (inner) {
      pos.z = Math.max(c.z0 + R * 0.8, Math.min(c.z1 - R * 0.8, pos.z));
      if (pos.x > c.x1 - R * 0.8) { pos.x = c.x1 - R * 0.8; vx = Math.min(0, vx); }
      return;
    }
    // outside: walls at z0 and z1 (x0..x1) and at x1 (z0..z1); the back end x0 is open
    const segs = [[c.x0, c.z0, c.x1, c.z0], [c.x0, c.z1, c.x1, c.z1], [c.x1, c.z0, c.x1, c.z1]];
    for (const [ax, az, bx, bz] of segs) {
      const lx = bx - ax, lz = bz - az, t = Math.max(0, Math.min(1, ((pos.x - ax) * lx + (pos.z - az) * lz) / (lx * lx + lz * lz)));
      const qx = ax + lx * t, qz = az + lz * t, dx = pos.x - qx, dz = pos.z - qz, d = Math.hypot(dx, dz);
      if (d < R && d > 1e-4) { pos.x += dx / d * (R - d); pos.z += dz / d * (R - d); const n = (vx * dx + vz * dz) / d; if (n < 0) { vx -= n * dx / d; vz -= n * dz / d; } }
    }
    // squeezed through a corner into the box sideways: put back out the nearest side
    if (inCartBox(c, pos.x, pos.z) && pos.x > c.x0 + 0.3) pos.z = pos.z < MID_Z ? c.z0 - R : c.z1 + R;
  }
  function floorAt(lv, c, x, z) { return inCartBox(c, x, z) ? lv.start.y + CART_FLOOR : ground(lv, x); }

  const api = {
    pos, paused: false,
    aboard(lv) { return !fall && inCartBox(solids(lv).cart, pos.x, pos.z); },
    get hold() { return holdDown; }, get moving() { return moving; }, get falling() { return !!fall; },
    get airborne() { return h > 0.02; }, get squash() { return squash; }, get speed() { return Math.hypot(vx, vz); },
    place(lv, x, z) {
      lastLv = lv; pos.x = x; pos.z = z; fall = null; vx = vz = vy = h = 0; stepped = true;
      const c = solids(lv).cart; pos.y = baseY = floorAt(lv, c, x, z) ?? lv.start.y;
    },
    walk(dt, lv) {
      lastLv = lv; stepped = true;
      let ix = 0, iz = 0;
      if (api.paused) keys.clear();
      if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
      const len = Math.hypot(ix, iz);
      let wx = 0, wz = 0;
      if (len > 0.1) {
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
        wx = (-iz * fx + ix * rx) / len * SPEED; wz = (-iz * fz + ix * rz) / len * SPEED;
      }
      // speed up / slow down smoothly (less grip in the air)
      const k = damp((len > 0.1 ? ACCEL : DECEL) * (h > 0.02 ? 0.6 : 1), dt);
      vx += (wx - vx) * k; vz += (wz - vz) * k;
      const sp = Math.hypot(vx, vz); moving = sp > 0.6;
      const S = solids(lv), c = S.cart, wasIn = inCartBox(c, pos.x, pos.z);
      pos.x = Math.max(-7, Math.min(Ph.WORLD_W + 1, pos.x + vx * dt));
      pos.z = Math.max(R, Math.min(LANE_W - R, pos.z + vz * dt));
      for (const b of S.boxes) pushBox(b);
      cartWalls(c, wasIn);
      if (sp > 0.4) { const want = Math.atan2(vx, vz); pos.face = wrapA(pos.face + wrapA(want - pos.face) * damp(TURN, dt)); }
      // the ground or the cart floor under you; a step up is climbed smoothly, a step down is a short drop
      const gy = floorAt(lv, c, pos.x, pos.z);
      if (gy == null) { fall = { vx: vx * 0.9, vy: Math.max(vy, 1.2), vz: vz * 0.9, spin: 0 }; h = 0; return 'fell'; }
      let floor = gy;
      if (h > 0.02) { h -= gy - baseY; if (h < 0) h = 0.001; }                 // in the air: the floor changed under you
      else if (gy > baseY + 0.02) floor = baseY + (gy - baseY) * damp(18, dt) + 0.01;   // step up: climb smoothly
      else if (gy < baseY - 0.02) h = baseY - gy;                              // walked off a ledge: drop the rest
      if (Math.abs(floor - gy) < 0.03) floor = gy;
      baseY = floor;
      if (hopQueued && h <= 0.02) { vy = HOP_V; h = 0.001; }
      hopQueued = false;
      if (h > 0 || vy > 0) {
        vy -= GRAV * dt; h += vy * dt;
        if (h <= 0) { if (vy < -4) squash = Math.min(1, -vy / 14); h = 0; vy = 0; }
      }
      squash = Math.max(0, squash - dt * 4);
      pos.y = floor + h; return '';
    },
    throwOff() {
      const side = pos.z < MID_Z ? -1 : 1;
      fall = { vx: 2.2 + Math.random() * 0.8, vy: 7.5, vz: side * (2.6 + Math.random()), spin: side * 9 }; h = vy = 0;
    },
    fall(dt, lv) {
      lastLv = lv; stepped = true;
      if (!fall) return '';
      // a clean arc: gravity, a little air drag sideways, and a tumble
      fall.vy -= GRAV * dt; fall.vx *= 1 - 0.4 * dt; fall.vz *= 1 - 0.4 * dt;
      pos.x += fall.vx * dt; pos.y += fall.vy * dt; pos.z = Math.max(0.2, Math.min(LANE_W - 0.2, pos.z + fall.vz * dt));
      pos.face += (fall.spin || 4) * dt;
      moving = false;
      if (pos.y < lv.fallY - 2) {
        // back at the start: drop in from above and land with a squash
        const sp = spots(lv); this.place(lv, sp.spawn.x, 1.5 + Math.random() * 3);
        h = 3.5; vy = 0; pos.y = baseY + h; pos.face = Math.PI / 2;
        return 'landed';
      }
      return '';
    },
    camera(camera, laneZ) {
      if (api.paused) { stepped = false; cam.init = false; return; }
      const riding = !stepped; stepped = false;    // the glue moved pos itself: you are riding the cart
      const now = performance.now(), dt = lastCam ? Math.min(0.1, (now - lastCam) / 1000) : 1 / 60; lastCam = now;
      yaw += wrapA(yawT - yaw) * damp(10, dt);
      const rideDist = riding ? Math.max(distT, 1350) : distT;
      dist += (rideDist - dist) * damp(4, dt);
      // look a little ahead: where you are heading, and always a bit towards the gap (+x)
      const ahead = riding ? 2.2 : 0.9 + Math.hypot(vx, vz) * 0.18;
      const hx = riding ? 1 : (Math.abs(vx) + Math.abs(vz) > 0.5 ? vx / (Math.hypot(vx, vz)) * 0.6 + 0.4 : 1);
      const hz = riding ? 0 : (Math.abs(vx) + Math.abs(vz) > 0.5 ? vz / (Math.hypot(vx, vz)) * 0.6 : 0);
      const tx = (pos.x + hx * ahead) * T, tz = (laneZ + pos.z + hz * ahead) * T;
      const ty = (fall ? Math.max(pos.y, (lastLv ? lastLv.fallY + 3 : pos.y)) : pos.y - h * 0.6) * T + 110;
      // on a ride the view swings round to a three-quarter side view so the bridge and the gap show under the cart
      rideMix += ((riding ? 1 : 0) - rideMix) * damp(2.5, dt);
      const cy = yaw + 0.7 * rideMix, cpit = pitch - 0.12 * rideMix;
      let px = tx + Math.sin(cy) * Math.cos(cpit) * dist, pz = tz + Math.cos(cy) * Math.cos(cpit) * dist;
      let py = ty + Math.sin(cpit) * dist;
      // never under the bank: check under the camera and along the line to you
      if (lastLv) {
        for (let i = 1; i <= 5; i++) {
          const f = i / 5, sx = (tx + (px - tx) * f) / T, sy = ty + (py - ty) * f, g = ground(lastLv, sx);
          if (g != null && sy < g * T + 70) py += (g * T + 70 - sy) / f;
        }
      }
      if (!cam.init) Object.assign(cam, { x: px, y: py, z: pz, tx, ty, tz, init: true });
      // smooth follow; snap if you jumped far (respawn, next gap)
      if (Math.hypot(cam.tx - tx, cam.tz - tz) > 900) Object.assign(cam, { x: px, y: py, z: pz, tx, ty, tz });
      const kp = damp(riding ? 6 : 7, dt), kt = damp(riding ? 9 : 10, dt), ky = damp(fall ? 3 : 6, dt);
      cam.x += (px - cam.x) * kp; cam.z += (pz - cam.z) * kp; cam.y += (py - cam.y) * kp;
      cam.tx += (tx - cam.tx) * kt; cam.tz += (tz - cam.tz) * kt; cam.ty += (ty - cam.ty) * ky;
      camera.position.set(cam.x, cam.y, cam.z);
      camera.lookAt(cam.tx, cam.ty, cam.tz);
    },
  };
  return api;
}
