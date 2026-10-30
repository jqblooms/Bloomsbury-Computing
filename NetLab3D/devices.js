// Network Builder's school equipment, at giant scale next to the blobs: laptops on low plinths, printers, switches
// with a row of real network sockets, the Wi-Fi point, carryable tablets and the cardboard cable boxes. Each socket
// is a dark recess with gold contacts and a light above it that turns green when a plug is in.
// Name tags are label-maker tape drawn at a fixed size on screen (they read the same close up and on the map).
//
//   makeDevice(d), makeCrate(b, colour, inside), setLight(light, on), tape(text): used by main.js.
import * as THREE from 'three';

const T = 100;
export const SOCKET_Y = { laptop: 52, printer: 52, switch: 50, wifi: 56 };
const CABLE = { short: 0x2b6fd6, long: 0xf2c21b };

export function tape(text, { bg = '#151515', ink = '#f4f4f0', size = 0.03 } = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), px = 30;
  const font = `700 ${px}px Consolas, "Lucida Console", "Courier New", monospace`;
  g.font = font;
  const label = text.toUpperCase().split('').join(String.fromCharCode(8202));   // hair spaces: label-maker letter spacing
  const w = Math.ceil(g.measureText(label).width) + px * 1.2, h = Math.ceil(px * 1.55);
  c.width = w; c.height = h;
  g.fillStyle = bg;
  g.beginPath(); g.moveTo(6, 0); g.lineTo(w, 0); g.lineTo(w - 6, h); g.lineTo(0, h); g.closePath(); g.fill();
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ink;
  g.fillText(label, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
  s.scale.set(size * w / h, size, 1); s.renderOrder = 10;
  return s;
}

const mats = new Map();
function M(hex, o = {}) { const k = hex + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, ...o })); return mats.get(k); }

// A box with rounded corners and softly bevelled top and bottom edges, standing on y = y0.
function rbox(w, h, d, colour, r = 10, o) {
  r = Math.min(r, w / 2 - 1, d / 2 - 1);
  const s = new THREE.Shape(), x = -w / 2, z = -d / 2;
  s.moveTo(x + r, z); s.lineTo(x + w - r, z); s.quadraticCurveTo(x + w, z, x + w, z + r); s.lineTo(x + w, z + d - r);
  s.quadraticCurveTo(x + w, z + d, x + w - r, z + d); s.lineTo(x + r, z + d); s.quadraticCurveTo(x, z + d, x, z + d - r);
  s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
  const bev = Math.min(4, h / 4);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);   // extruded upwards from y = 0 (the shape is symmetric, so its mirroring in z does not matter)
  const m = new THREE.Mesh(g, M(colour, o)); m.castShadow = m.receiveShadow = true;
  return m;
}
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
function cyl(rt, rb, h, colour, o) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), M(colour, o)); m.castShadow = true; return m; }

// A network socket on a front face (facing +z): frame, dark mouth, gold contacts, and a light above.
function socket(g, x, y, z) {
  g.add(at(rbox(40, 34, 6, 0xd5d8dc, 4), x, y - 17, z + 1));
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(28, 22, 6), M(0x0d0f12, { roughness: 1 })); g.add(at(mouth, x, y, z + 2));
  const pins = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 2), M(0xd4a017, { metalness: 0.8, roughness: 0.3 })); g.add(at(pins, x, y + 8, z + 4.2));
  const light = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 3), new THREE.MeshStandardMaterial({ color: 0x3a3f45, emissive: 0x000000 }));
  g.add(at(light, x, y + 26, z + 2));
  return light;
}

// Keyboard keys as a texture: rows of light keys on a dark deck.
function keysTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#2b2f36'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#d9dce1';
  for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) g.fillRect(6 + k * 17.6 + (r % 2) * 4, 6 + r * 22, 14, 17);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// A screen you can draw on. At rest it shows a desktop with the owner's name; show() draws a message on it:
//   screen.show({ top, text, textAlpha, env, mark })   top = a line at the top ("To Kim", "From Hana"), text = the
//   message, env = how much of an envelope to show (0 to 1), mark = 'tick' or 'cross'. screen.show(null) = desktop.
function makeScreen(name, w = 256, h = 170) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const font = (px, weight = 700) => weight + ' ' + px + 'px "Segoe UI", Arial, sans-serif';
  function desktop() {
    const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#5b8fd1'); grad.addColorStop(1, '#2d5a94');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  }
  function envelope(alpha) {
    if (alpha <= 0) return;
    const ew = w * 0.42, eh = ew * 0.66, x = (w - ew) / 2, y = (h - eh) / 2 + 8;
    g.save(); g.globalAlpha = alpha;
    g.fillStyle = '#fff8e1'; g.strokeStyle = '#8a6d1c'; g.lineWidth = 4;
    g.beginPath(); g.rect(x, y, ew, eh); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + ew / 2, y + eh * 0.58); g.lineTo(x + ew, y); g.stroke();
    g.restore();
  }
  function mark(kind, x, y, r) {
    g.save(); g.lineWidth = r * 0.32; g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = kind === 'tick' ? '#2f9e44' : '#c92a2a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.beginPath();
    if (kind === 'tick') { g.moveTo(x - r * 0.45, y + r * 0.02); g.lineTo(x - r * 0.1, y + r * 0.38); g.lineTo(x + r * 0.5, y - r * 0.35); }
    else { g.moveTo(x - r * 0.4, y - r * 0.4); g.lineTo(x + r * 0.4, y + r * 0.4); g.moveTo(x + r * 0.4, y - r * 0.4); g.lineTo(x - r * 0.4, y + r * 0.4); }
    g.stroke(); g.restore();
  }
  let status = null;   // { text, ok }: the taskbar's network line
  let last = null;
  const screen = {
    tex,
    get state() { return last; },
    get status() { return status; },
    setStatus(text, ok) { status = { text, ok }; if (!last) screen.show(null); },
    show(st) {
      last = st;
      desktop();
      if (!st) {
        g.fillStyle = '#ffffffcc'; for (let i = 0; i < 4; i++) g.fillRect(w * 0.055, h * 0.08 + i * h * 0.18, w * 0.086, h * 0.12);
        g.fillStyle = '#1c1b17'; g.fillRect(0, h * 0.84, w, h * 0.16);
        g.font = font(Math.round(h * 0.15)); g.fillStyle = '#fff'; g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.fillText(name, w * 0.94, h * 0.24);
        if (status) {
          g.fillStyle = status.ok ? '#51cf66' : '#ff8787'; g.beginPath(); g.arc(w * 0.05, h * 0.92, h * 0.035, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; let px = Math.round(h * 0.085); g.font = font(px, 600);
          while (g.measureText(status.text).width > w * 0.86 && px > 8) { px--; g.font = font(px, 600); }
          g.fillText(status.text, w * 0.09, h * 0.925);
        }
      } else {
        // a message window
        g.fillStyle = '#ffffff'; g.fillRect(w * 0.06, h * 0.1, w * 0.88, h * 0.8);
        g.fillStyle = '#e7edf5'; g.fillRect(w * 0.06, h * 0.1, w * 0.88, h * 0.22);
        g.fillStyle = '#1c2533'; g.font = font(Math.round(h * 0.13)); g.textAlign = 'left'; g.textBaseline = 'middle';
        if (st.top) g.fillText(st.top, w * 0.1, h * 0.21);
        if (st.mark) mark(st.mark, w * 0.86, h * 0.21, h * 0.075);
        if (st.text != null && (st.textAlpha ?? 1) > 0) {
          g.save(); g.globalAlpha = st.textAlpha ?? 1; g.fillStyle = '#111'; g.font = font(Math.round(h * 0.17), 600);
          let size = Math.round(h * 0.17);
          while (g.measureText(st.text + (st.caret ? '|' : '')).width > w * 0.78 && size > 10) { size--; g.font = font(size, 600); }
          g.fillText(st.text + (st.caret ? '|' : ''), w * 0.1, st.sub ? h * 0.52 : h * 0.58); g.restore();
        }
        if (st.sub) {
          g.fillStyle = '#4a5568'; let px = Math.round(h * 0.095); g.font = font(px, 600);
          while (g.measureText(st.sub).width > w * 0.8 && px > 8) { px--; g.font = font(px, 600); }
          g.fillText(st.sub, w * 0.1, h * 0.75);
        }
        envelope(st.env || 0);
      }
      tex.needsUpdate = true;
    }
  };
  screen.show(null);
  return screen;
}
// A printed page: the message in the middle of a white sheet.
export function pageTexture(text, from) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 180; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 180);
  g.fillStyle = '#5c6470'; g.font = '600 20px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('From ' + from, 128, 34);
  g.fillStyle = '#111'; let size = 40; g.font = '700 ' + size + 'px "Segoe UI", Arial, sans-serif';
  while (g.measureText(text).width > 230 && size > 12) { size--; g.font = '700 ' + size + 'px "Segoe UI", Arial, sans-serif'; }
  g.fillText(text, 128, 100);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const KEYS = keysTexture();

const BUILD = {
  laptop(g, d, W, D) {
    g.add(rbox(W - 20, 40, D - 20, 0x8a7356, 6));                                         // low wooden plinth
    const base = rbox(W - 50, 22, D - 50, 0xb7bcc3, 14, { metalness: 0.4, roughness: 0.35 }); g.add(at(base, 0, 40, 0));
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(W - 90, (D - 50) * 0.42).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: KEYS, roughness: 0.8 }));
    g.add(at(deck, 0, 62.5, -6));
    g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(70, 34).rotateX(-Math.PI / 2), M(0x9ea3aa)), 0, 62.5, (D - 50) / 2 - 26));   // touchpad
    const lid = new THREE.Group(); lid.position.set(0, 62, -(D - 50) / 2 + 6); lid.rotation.x = -0.28;
    lid.add(at(rbox(W - 50, 12, 170, 0xb7bcc3, 12, { metalness: 0.4, roughness: 0.35 }), 0, 0, 0));
    lid.children[0].rotation.x = Math.PI / 2; lid.children[0].position.set(0, 85, -6);
    const scr = makeScreen(d.title);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 76, 150), new THREE.MeshStandardMaterial({ map: scr.tex, emissive: 0xffffff, emissiveMap: scr.tex, emissiveIntensity: 0.6 }));
    lid.add(at(screen, 0, 85, 13));
    g.add(lid);
    g.userData.screen = scr;
  },
  printer(g, d, W, D) {
    g.add(rbox(W - 20, 40, D - 20, 0x8a7356, 6));
    g.add(at(rbox(W - 40, 110, D - 50, 0xe6e6e3, 16), 0, 40, -8));
    g.add(at(rbox(W - 90, 10, 70, 0xcfcfcb, 6), 0, 150, -20));                           // top: paper in
    const paper = new THREE.Mesh(new THREE.BoxGeometry(120, 2, 90), M(0xffffff)); g.add(at(paper, 0, 162, -30));
    g.add(at(rbox(W - 110, 8, 60, 0xcfcfcb, 6), 0, 100, (D - 50) / 2 - 2));              // tray: paper out
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(60, 6, 30), M(0x30343b)), -(W - 40) / 2 + 60, 128, (D - 50) / 2 - 7));
  },
  switch(g, d, W, D) {
    g.add(rbox(W - 10, 22, D - 14, 0x30343b, 4));                                         // feet
    g.add(at(rbox(W - 16, 70, D - 20, 0x4a5058, 8, { metalness: 0.5, roughness: 0.4 }), 0, 18, 0));
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W - 30, 4, 2), M(0x2b6fd6, { emissive: 0x0b2a5c })), 0, 82, (D - 20) / 2 + 0.5));
  },
  wifi(g, d, W, D) {
    g.add(rbox(W - 30, 80, D - 30, 0xeceeef, 18));
    for (const sx of [-40, 40]) { const a = cyl(5, 7, 150, 0x30343b); a.rotation.z = sx < 0 ? 0.18 : -0.18; g.add(at(a, sx, 150, -10)); }
    for (let i = 0; i < 3; i++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(10, 5, 2), M(0x51cf66, { emissive: 0x2b8a3e })), -20 + i * 20, 66, (D - 30) / 2 + 0.5));
  },
};

// One piece of equipment, built at the map origin of its footprint. d = { kind, title, w, h, sockets: [{ x, y, face }] }
// in tiles (socket x, y on the map). Returns the group, the socket lights, and each socket's mouth and plug direction
// relative to the group, so the device can be moved (Missions mode carries devices about).
export function makeDevice(d) {
  const W = d.w * T, D = d.h * T;
  const g = new THREE.Group();
  g.position.set(d.x * T + W / 2, 0, d.y * T + D / 2);
  if (d.kind === 'tablet') {
    const body = new THREE.Group();
    body.add(rbox(110, 10, 80, 0x212529, 10));
    const screen = makeScreen(d.title, 240, 164);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(94, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: screen.tex, emissive: 0xffffff, emissiveMap: screen.tex, emissiveIntensity: 0.6 }));
    body.add(at(scr, 0, 10.5, 0)); g.add(body);
    const tag = tape(d.title, { size: 0.03 }); tag.position.set(0, 90, 0); g.add(tag);
    return { group: g, lights: [], sockets: [], body, scr, screen };
  }
  (BUILD[d.kind] || BUILD.laptop)(g, d, W, D);
  const lights = [], sockets = [];
  const sy = SOCKET_Y[d.kind] ?? 50;
  const front = d.kind === 'laptop' ? D / 2 - 25 : d.kind === 'printer' ? D / 2 - 25 : d.kind === 'wifi' ? D / 2 - 15 : D / 2 - 10;
  (d.sockets || []).forEach(s => {
    if (s.face === 'e') {
      // a laptop: the socket is in the right-hand side of its base, facing +x
      const side = (W - 50) / 2, holder = new THREE.Group(); holder.position.set(side, 0, 0); holder.rotation.y = Math.PI / 2;
      lights.push(socket(holder, 0, sy, -4)); g.add(holder);
      sockets.push({ local: new THREE.Vector3(side + 2, sy, 0), dir: new THREE.Vector3(-1, 0, 0) });
      return;
    }
    const lx = (s.x + 0.5) * T - g.position.x;
    lights.push(socket(g, lx, sy, front));
    sockets.push({ local: new THREE.Vector3(lx, sy, front + 4), dir: new THREE.Vector3(0, 0, -1) });
  });
  const tagY = { laptop: 290, printer: 220, switch: 140, wifi: 260 }[d.kind] ?? 200;
  const tag = tape(d.title, { size: 0.034 }); tag.position.set(0, tagY, 0); g.add(tag);
  return { group: g, lights, sockets, screen: g.userData.screen || null };
}

/** Lights a socket: green with a plug in it. */
export function setLight(l, on) { l.material.color.setHex(on ? 0x51cf66 : 0x3a3f45); l.material.emissive.setHex(on ? 0x2f9e44 : 0x000000); }

// A big open cardboard crate at footprint (x, y, w, h) with a stripe of the colour and a name tag; with a coil of cable
// in it, or a small model of what it holds (Missions mode's supply shelf).
export function makeCrate(b, colour, inside) {
  const W = b.w * T, D = b.h * T;
  const g = new THREE.Group(); g.position.set(b.x * T + W / 2, 0, b.y * T + D / 2);
  for (const [w, d, x, z] of [[W - 20, 12, 0, -(D - 32) / 2], [W - 20, 12, 0, (D - 32) / 2], [12, D - 20, -(W - 32) / 2, 0], [12, D - 20, (W - 32) / 2, 0]])
    g.add(at(rbox(w, 110, d, 0xb98b55, 3, { roughness: 0.9 }), x, 0, z));
  g.add(at(rbox(W - 30, 10, D - 30, 0x9c7444, 3), 0, 0, 0));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W - 18, 14, 2), M(colour)), 0, 80, (D - 20) / 2 + 1));
  if (inside) { inside.scale.setScalar(0.45); inside.position.set(0, 20, 0); g.add(inside); }
  else for (let k = 0; k < 4; k++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(52 - k * 4, 9, 10, 32).rotateX(Math.PI / 2), M(colour, { roughness: 0.45 }));
    g.add(at(coil, (k % 2) * 6, 20 + k * 17, (k % 2) * -5));
  }
  const light = ((colour >> 16) & 255) * 0.3 + ((colour >> 8) & 255) * 0.59 + (colour & 255) * 0.11 > 150;
  const tag = tape(b.title, { bg: '#' + colour.toString(16).padStart(6, '0'), ink: light ? '#1c1b17' : '#f4f4f0', size: 0.034 });
  tag.position.set(0, 190, 0); g.add(tag);
  return { group: g, tag };
}

export function buildDevices(scene, map) {
  const root = new THREE.Group(), lights = {}, sockets = {}, tabs = {};
  for (const d of map.devices || []) {
    const k = makeDevice(d);
    lights[d.id] = k.lights;
    sockets[d.id] = k.sockets.map(s => ({ pos: s.local.clone().add(k.group.position), dir: s.dir }));
    root.add(k.group);
  }
  for (const b of map.boxes || []) root.add(makeCrate(b, CABLE[b.kind] ?? 0x888888).group);
  // The Wi-Fi range: a ring on the floor, shown once the Wi-Fi point is plugged in.
  const wd = (map.devices || []).find(d => d.kind === 'wifi');
  const range = new THREE.Group();
  if (wd) {
    const R = (map.wifiRange ?? 7) * T, cx = (wd.x + wd.w / 2) * T, cz = (wd.y + wd.h / 2) * T;
    const fill = new THREE.Mesh(new THREE.CircleGeometry(R, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x51cf66, transparent: true, opacity: 0.1, depthWrite: false }));
    const edge = new THREE.Mesh(new THREE.RingGeometry(R - 8, R, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x51cf66, transparent: true, opacity: 0.7, depthWrite: false }));
    range.add(at(fill, cx, 2, cz), at(edge, cx, 3, cz)); range.visible = false;
  }
  root.add(range);
  scene.add(root);

  function tablet(id, title) {
    const k = makeDevice({ kind: 'tablet', title, x: 0, y: 0, w: 1, h: 1 });
    root.add(k.group);
    return tabs[id] = { holder: k.group, body: k.body, scr: k.scr };
  }

  return {
    socketPos: (dev, i) => sockets[dev]?.[i],
    update(s) {
      const used = new Set();
      for (const c of s.cables || []) for (const e of c.ends || []) if (e) used.add(e.dev + ':' + e.sock);
      for (const [dev, list] of Object.entries(lights)) list.forEach((l, i) => {
        setLight(l, used.has(dev + ':' + i));
      });
      range.visible = !!s.wifiOn;
      for (const t of s.tablets || []) {
        const k = tabs[t.id] ?? tablet(t.id, (map.tablets || []).find(x => x.id === t.id)?.title ?? t.id[0] + t.id.slice(1).toLowerCase());
        k.holder.position.set((t.x + 0.5) * T, 0, (t.y + 0.5) * T);
        // carried: held upright at hand height; put down: lying flat
        k.body.rotation.x = t.held ? -1.2 : 0; k.body.position.y = t.held ? 30 : 0;
        k.scr.material.emissive.setHex(t.inRange ? 0x2f6f9f : 0x000000);
      }
    },
  };
}
