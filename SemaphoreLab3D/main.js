// Semaphore Lab 3D: Year 5 iSignal (Exploring data encryption, week 2: semaphore) in the lab of Network Builder 3D.
// A big signaller blob on a stage holds two flags. Each letter is a different pair of flag positions. Pupils read the
// flags, then walk to that letter on the floor and press Space (Reading flags, Secret messages), or pose their own
// blob's flags from the panel to send a word (Sending flags). The semaphore card on the right groups the letters by
// their pattern: each group keeps one flag still while the other moves round. Left and right are always as the
// reader sees them, looking at the signaller.
//
// Same controls, What just happened card, attention glow and rules as Contest Lab 3D (this file is a fork of
// BinaryLab3D/main.js; room.js, blob.js, devices.js, cubes.js and three.js are shared by import).
// Progress: 'bc-semaphore3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'semaphorelab3d'.
// Rendering uses animation frames; starting a round, checking and saving never wait on one (a hidden iframe has none).
import * as THREE from 'three';
import { create } from './room.js';
import { createBlob } from './blob.js';
import { makeCube, makePad, makeBody, floorBar, sign, PAD_H, CUBE, GAP } from './cubes.js';

const $ = id => document.getElementById(id);
const HOLD_OUT = 0.75, T = 100, SPEED = 5.5, NEED = 2, HOLD = 0.25;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, attrs, html) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) k === 'class' ? n.className = v : n.setAttribute(k, v); if (html != null) n.innerHTML = html; return n; };
const btn = (label, cls, fn) => { const b = el('button', { type: 'button', class: cls === 'go' ? 'btn' : 'btn secondary' }, label); b.addEventListener('click', fn); return b; };

// ================================================================ semaphore
const roleOf = () => 'num';
// Flag directions as the reader sees them: 0 down, then round to the reader's left, over the top and down the right.
const DIR_NAME = ['down', 'down-left', 'left', 'up-left', 'up', 'up-right', 'right', 'down-right'];
const DIR_ARROW = ['&#8595;', '&#8601;', '&#8592;', '&#8598;', '&#8593;', '&#8599;', '&#8594;', '&#8600;'];
const dirXY = k => { const a = (-90 - 45 * k) * Math.PI / 180; return [Math.round(Math.cos(a) * 1000) / 1000, Math.round(Math.sin(a) * 1000) / 1000]; };
// Each letter: two flags pointing different ways. A space between words: both flags down.
const POSE = {
  A: [0, 1], B: [0, 2], C: [0, 3], D: [0, 4], E: [0, 5], F: [0, 6], G: [0, 7],
  H: [1, 2], I: [1, 3], K: [1, 4], L: [1, 5], M: [1, 6], N: [1, 7],
  O: [2, 3], P: [2, 4], Q: [2, 5], R: [2, 6], S: [2, 7],
  T: [3, 4], U: [3, 5], Y: [3, 6], J: [4, 6], V: [4, 7], W: [5, 6], X: [5, 7], Z: [6, 7], ' ': [0, 0]
};
const poseKey = p => Math.min(p[0], p[1]) + ',' + Math.max(p[0], p[1]);
const LETTER_OF = Object.fromEntries(Object.entries(POSE).map(([L, p]) => [poseKey(p), L]));
// the groups on the card: one flag stays still while the other moves round
const GROUPS = [
  { letters: 'ABCDEFG', pattern: 'A to G: one flag stays down. The other flag moves round, one step for each letter.', short: 'A to G all keep one flag down.' },
  { letters: 'HIKLMN', pattern: 'H to N (not J): one flag stays down-left. The other flag moves round.', short: 'H to N all keep one flag down-left.' },
  { letters: 'OPQRS', pattern: 'O to S: one flag stays left. The other flag moves round.', short: 'O to S all keep one flag left.' },
  { letters: 'TUY', pattern: 'T, U and Y: one flag stays up-left.', short: 'T, U and Y keep one flag up-left.' },
  { letters: 'JV', pattern: 'J and V: one flag stays up.', short: 'J and V keep one flag up.' },
  { letters: 'WX', pattern: 'W and X: one flag stays up-right.', short: 'W and X keep one flag up-right.' },
  { letters: 'Z', pattern: 'Z: one flag right and one flag down-right.', short: 'Z is right and down-right.' }
];
const groupNote = L => (GROUPS.find(g => g.letters.includes(L)) || {}).short || '';
function describe(p) {
  if (p[0] === p[1]) return 'both flags down';
  const a = Math.min(p[0], p[1]), b = Math.max(p[0], p[1]);
  return 'one flag ' + DIR_NAME[a] + ' and one flag ' + DIR_NAME[b];
}
const nameOf = L => L === ' ' ? 'a space' : L;
// A small figure holding flags, as the reader sees it (a list of 0, 1 or 2 directions; [0, 0] is both down).
function figSvg(dirs, cls) {
  let h = '<svg class="sem-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-hidden="true">';
  h += '<path d="M50 66 L42 92 M50 66 L58 92 M50 38 L50 66" stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="50" cy="27" r="10" fill="currentColor"/>';
  const both = dirs.length === 2 && dirs[0] === dirs[1];
  dirs.forEach((k, i) => {
    let [dx, dy] = dirXY(k);
    if (both) { dx = i ? 0.22 : -0.22; const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
    const ux = dx, uy = -dy, sx = 50, sy = 42;
    const ax = sx + ux * 20, ay = sy + uy * 20, px = sx + ux * 46, py = sy + uy * 46, nx = -uy, ny = ux;
    const b = [px - ux * 15, py - uy * 15], c = [b[0] + nx * 15, b[1] + ny * 15], d = [px + nx * 15, py + ny * 15];
    const f = n => n.toFixed(1);
    h += '<path d="M' + f(sx) + ' ' + f(sy) + ' L' + f(ax) + ' ' + f(ay) + '" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>';
    h += '<path d="M' + f(ax) + ' ' + f(ay) + ' L' + f(px) + ' ' + f(py) + '" stroke="#6c757d" stroke-width="2.5"/>';
    h += '<path d="M' + f(px) + ' ' + f(py) + ' L' + f(b[0]) + ' ' + f(b[1]) + ' L' + f(c[0]) + ' ' + f(c[1]) + 'Z" fill="#e03131"/>';
    h += '<path d="M' + f(px) + ' ' + f(py) + ' L' + f(c[0]) + ' ' + f(c[1]) + ' L' + f(d[0]) + ' ' + f(d[1]) + 'Z" fill="#ffd43b"/>';
  });
  return h + '</svg>';
}
const word = text => ({ text, key: text });
const READ_WORDS = ['CODE', 'FLAG', 'SHIP', 'WAVE', 'BIRD', 'FISH', 'STAR', 'MOON', 'LIGHT', 'CLOUD', 'STORM', 'TRAIN', 'PLANE', 'ROBOT', 'MAGIC', 'RIVER', 'HOUSE', 'SMILE', 'JUMP', 'ZEBRA'];
const SEND_WORDS = ['CAT', 'DOG', 'SUN', 'HAT', 'BOX', 'CUP', 'PEN', 'MAP', 'JAM', 'KEY', 'WEB', 'FOX', 'YES', 'ZIP'];
const MESSAGES = ['MEET AT TEN', 'SHIP IS LATE', 'HELP IS NEAR', 'LOOK UP', 'RUN FAST', 'SEND FOOD', 'GO HOME NOW', 'SEE YOU SOON'];

// ================================================================ missions
const MISSIONS = [
  { id: 'ag-t', group: 'Reading flags', title: 'Flags Make Letters', type: 'tutorial', kind: 'read', mins: 8, card: 'ABCDEFG',
    intro: 'The signaller holds two flags. Each letter is a different pair of flag positions. Read the flags, find them on the card, then walk to that letter on the floor and press Space.',
    gen: () => word('CAGE'),
    after: { q: 'What is the pattern for the letters A to G?', options: ['One flag stays down. The other flag moves round, one step for each letter.', 'Both flags move together for each letter.', 'Each letter uses only one flag.'], why: 'Look at A, B, C and D on the card: which flag never moves?' } },
  { id: 'read-t', group: 'Reading flags', title: 'Decode a Word', type: 'tutorial', kind: 'read', mins: 8,
    intro: 'Now any letter can come up. Find the same flags on the semaphore card, then walk to the letter.',
    gen: () => word('SIGNAL'),
    after: { q: 'Why must the signaller and the reader use the same card?', options: ['The card is the rule. With a different rule, the reader gets the wrong letters.', 'So the flags look nicer.', 'The card makes the signaller faster.'], why: 'A signal only works when both people know the same rule.' } },
  { id: 'read-c', group: 'Reading flags', title: 'Word Decoder', type: 'challenge', kind: 'read', mins: 10,
    intro: 'Decode each word with no mistakes. Two clean words in a row.',
    gen: () => word(pick(READ_WORDS)) },
  { id: 'send-t', group: 'Sending flags', title: 'Send a Letter', type: 'tutorial', kind: 'send', mins: 7,
    intro: 'Now you are the signaller. Pick two flag positions on the right to make each letter, then press Send this letter.',
    gen: () => word('HI'),
    after: { q: 'H and I both keep one flag down-left. What changes between them?', options: ['Only the other flag. It moves one step round.', 'Both flags change.', 'Nothing changes.'], why: 'Look at H and I on the card.' } },
  { id: 'send-c', group: 'Sending flags', title: 'Send a Word', type: 'challenge', kind: 'send', mins: 10,
    intro: 'Send each word with no mistakes. Two clean words in a row.',
    gen: () => word(pick(SEND_WORDS)) },
  { id: 'msg-c', group: 'Secret messages', title: 'Secret Message', type: 'challenge', kind: 'read', mins: 12, spaces: true,
    intro: 'Decode a whole message. Both flags down means a space between words: walk to the SPACE pad. Two clean messages in a row.',
    gen: () => word(pick(MESSAGES)) },
  { id: 'nocard-c', group: 'Secret messages', title: 'No Card', type: 'challenge', kind: 'read', noHelp: true, need: 3, mins: 12,
    intro: 'Decode three words in a row with the card hidden. Use the patterns you have learned.',
    gen: () => word(pick(READ_WORDS)) }
];
export { MISSIONS, POSE };
const SECTIONS = ['Reading flags', 'Sending flags', 'Secret messages'];
const LESSONS = [
  { id: '5.1.2', title: '5.1.2: iSignal', missions: ['ag-t', 'read-t', 'read-c', 'send-t', 'send-c', 'msg-c'], ext: ['nocard-c'] }
];
const minsOf = m => m.mins || 10;

// ================================================================ saving and results
const STORE = 'bc-semaphore3d-v1:';
function load(key, fallback) { try { const v = localStorage.getItem(STORE + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
function save(key, value) { try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch (e) { } }
function results(id, label) {
  const lines = []; let right = 0, tries = 0;
  function post(finished) {
    if (window.parent === window) return;
    const head = (finished ? 'Finished.' : 'Not finished yet.') + (tries ? ' ' + right + ' clean rounds in ' + tries + '.' : '');
    try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label, summary: head + ' ' + lines.slice(-12).join(' '), complete: !!finished }, '*'); } catch (e) { }
  }
  return {
    add(text, ok) { tries++; if (ok) right++; lines.push(tries + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); post(); },
    note(text) { lines.push(text); post(); },
    finish() { post(true); }
  };
}

// ================================================================ the 3D lab
export function startSolo({ container, myName, colour }) {
  const log = results('semaphorelab3d', 'Semaphore Lab 3D');
  let MAPW = 22, MAPH = 15, rows = [];
  let view = null, scene = null, worldG = null;
  const pos = { x: 11, y: 12, face: Math.PI };
  let moving = false, overview = false, stick = null, clock = 0, tickNo = 0;
  const keys = new Set();
  const me = createBlob(colour ?? 0, myName || '');
  const hand = { down: false, item: null, from: null, pending: null };
  let slots = [], blocks = [], nextId = 1;
  let M = null, R = null, missionAt = 0;
  const done = load('all:done', {}) || {};
  const openSecs = new Set();

  // ---------------------------------------------------------------- slots and items
  // A slot is a pad on the floor at tile (x, y), w tiles wide, holding items (a stack grows upwards, a rail grows to
  // the right). take(item) returns a reason it cannot be taken; put(item, from) returns { msg, mistake } to refuse.
  function addSlot(def) {
    const s = Object.assign({ id: 's' + nextId++, w: 1, items: [], grow: 'up', take: () => null, put: () => null, risky: false }, def);
    s.g = makePad(s.pad || s.role, s.w, s.label, s.tag || {});
    s.g.position.set(s.x * T + T / 2, 0, s.y * T + T / 2); worldG.add(s.g);
    slots.push(s); return s;
  }
  function itemMesh(it) { it.k3 = makeCube(it.sym, it.role, it.size || 1); worldG.add(it.k3.group); }
  function addItem(slot, it) { it.id = it.id || 'i' + nextId++; if (!it.k3) itemMesh(it); slot.items.push(it); it.slot = slot; snapItem(it); return it; }
  function killItem(it) { if (!it || !it.k3) return; worldG.remove(it.k3.group); it.k3.dispose(); it.k3.group.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); it.k3 = null; }
  function cube(sym, extra) { return Object.assign({ sym: String(sym), role: roleOf(String(sym)) }, extra || {}); }
  const top = s => s.items[s.items.length - 1];
  function itemTarget(it) {
    if (it === hand.item) {
      const hx = pos.x + Math.sin(pos.face) * HOLD_OUT, hy = pos.y + Math.cos(pos.face) * HOLD_OUT;   // held clear of the body: the cube is wider than the reach point
      return new THREE.Vector3((hx + 0.5) * T, it.tray ? 52 : 70, (hy + 0.5) * T);
    }
    const s = it.slot, k = s.items.indexOf(it);
    if (s.grow === 'right') return new THREE.Vector3((s.x + k + 0.5) * T, PAD_H + CUBE / 2 + 2, (s.y + 0.5) * T);
    if (it.tray) return new THREE.Vector3((s.x + s.w / 2) * T, PAD_H, (s.y + 0.5) * T);
    return new THREE.Vector3((s.x + s.w / 2) * T, PAD_H + CUBE / 2 + 2 + k * GAP, (s.y + 0.5) * T);
  }
  function snapItem(it) { if (it.k3) { it.k3.group.position.copy(itemTarget(it)); it.k3.group.rotation.y = 0; } }
  function moveItems(dt) {
    const k = Math.min(1, dt * 14);
    // placed cubes square up to face the camera, so a + never reads as a times sign
    for (const s of slots) for (const it of s.items) if (it.k3) { const g = it.k3.group; g.position.lerp(itemTarget(it), k); g.rotation.y += (Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2 - g.rotation.y) * k; }
    if (hand.item && hand.item.k3) { hand.item.k3.group.position.lerp(itemTarget(hand.item), Math.min(1, dt * 24)); hand.item.k3.group.rotation.y = pos.face; }
  }
  const rectDist = (s, px, py) => Math.hypot(Math.max(s.x - 0.5 - px, 0, px - (s.x + s.w - 0.5)), Math.max(s.y - 0.5 - py, 0, py - (s.y + 0.5)));
  function handPos() { return [pos.x + Math.sin(pos.face) * 0.45, pos.y + Math.cos(pos.face) * 0.45]; }
  function nearestSlot(maxD, ok) {
    const [hx, hy] = handPos(); let best = null, bd = maxD;
    for (const s of slots) { if (ok && !ok(s)) continue; const d = rectDist(s, hx, hy); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  // ---------------------------------------------------------------- the room
  function solidAt(tx, ty) {
    if (ty < 0 || tx < 0 || ty >= MAPH || tx >= MAPW || rows[ty][tx] === '#') return true;
    for (const s of slots) if (ty === s.y && tx >= s.x && tx < s.x + s.w) return true;
    for (const b of blocks) if (tx >= b[0] && tx <= b[2] && ty >= b[1] && ty <= b[3]) return true;
    return false;
  }
  function free(x, y) { for (const [ox, oy] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) if (solidAt(Math.round(x + ox), Math.round(y + oy))) return false; return true; }
  function disposeWorld() {
    if (!worldG) return;
    scene.remove(worldG);
    worldG.traverse(o => {
      if (o.userData.own) o.geometry?.dispose?.();
      if (o.userData.ownMat) { o.material.map?.dispose?.(); o.material.dispose(); }
      if (o.isSprite) { o.material.map?.dispose?.(); o.material.dispose(); }
    });
    for (const s of slots) for (const it of s.items) it.k3?.dispose();
    if (hand.item) hand.item.k3?.dispose();
  }
  function newWorld(w, h, name) {
    if (!view) { view = create(container); scene = view.scene; scene.add(me.group, arrows, pulse, outlineG); }
    disposeWorld();
    slots = []; blocks = []; hand.item = null; hand.from = null; hand.pending = null; guideKey = ''; routeKey = ''; outlineKey = '';
    MAPW = w; MAPH = h; rows = [];
    for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) r += (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? '#' : '.'; rows.push(r); }
    view.setRoom({ w, h, rows, regions: [{ name, index: 0, x0: 1, y0: 1, x1: w - 2, y1: h - 2 }] });
    worldG = new THREE.Group(); scene.add(worldG);
    setOverview(overview);
  }
  function addBody(x0, y0, w, colour, label, deco) {
    const g = makeBody(w, colour, label, deco); g.position.set((x0 + w / 2) * T, 0, (y0 + 0.5) * T); worldG.add(g);
    blocks.push([x0, y0, x0 + w - 1, y0]); return g;
  }
  function addSign(text, x, y, h = 260, opts) { const s = sign(text, opts); s.position.set((x + 0.5) * T, h, (y + 0.5) * T); worldG.add(s); return s; }

  // ================================================================ rounds
  // R: the round being played. R.ask is a prediction waiting in the mission panel (nothing can be grabbed meanwhile).
  function newRound() {
    const m = M.m;
    let p = m.gen();
    // a challenge never repeats the round just played
    if (m.type === 'challenge') for (let k = 0; k < 20 && M.lastKey && keyOf(p) === M.lastKey; k++) p = m.gen();
    M.lastKey = keyOf(p);
    R = { p, over: false, spoilt: false, ask: null, notes: [], moves: 0, why: null };
    KIND[m.kind].setup(R, m);
    pos.face = R.face ?? Math.PI; view.jump(pos.x, pos.y);
    toast(''); explainReset(); explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  function startLine(m, p) { return KIND[m.kind].start(m, p); }

  // ---- what just happened: a card at the top of the lab after every step. Each one stays up for a while, the next
  // waits its turn (none is cut short), and the last one stays until something new happens.
  const xq = []; let xTimer = 0, xUntil = 0;
  function explainReset() { xq.length = 0; clearTimeout(xTimer); xTimer = 0; xUntil = 0; const b = $('explain'); if (b) { b.hidden = true; b.innerHTML = ''; } }
  function explain(html) {
    if (!html) return;
    if (R) (R.log = R.log || []).push(html);   // every explanation this round, for the list in the sheet
    xq.push(html); if (xq.length > 1) xq.splice(0, xq.length - 1);   // at most one step behind: the newest waits, older ones are skipped
    window.__explainCount = (window.__explainCount || 0) + 1;
    window.__explained = (window.__explained || []).concat([html.replace(/<[^>]+>/g, '')]).slice(-40);
    if (!xTimer) xNext();
  }
  function xNext() {
    xTimer = 0;
    if (!xq.length) return;
    const wait = xUntil - Date.now();
    if (wait > 0) { xTimer = setTimeout(xNext, wait); return; }
    const b = $('explain'); if (!b) return;
    b.hidden = false; b.innerHTML = '<span class="xh">What just happened</span><span class="xt">' + xq.shift() + '</span>';
    b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    xUntil = Date.now() + 1800;   // each one stays up at least this long
    if (xq.length) xTimer = setTimeout(xNext, xUntil - Date.now());
  }
  const keyOf = p => p.key;
  function mistake(msg) {
    R.why = msg; log.add(M.m.title + ': ' + msg.replace(/<[^>]+>/g, ''), false);
    const first = M.m.type === 'challenge' && !R.spoilt;
    if (M.m.type === 'challenge') { if (first) toast('A mistake: this round does not count. ' + msg, 'bad'); else toast(msg, 'bad'); R.spoilt = true; }
    else toast(msg, 'bad');
    explain('Not this time. ' + msg + (first ? (M.m.noHelp ? ' This round does not count.' : ' This round does not count, so the arrow now shows each move: watch the method, then try a new round.') : ''));
    drawAll();
  }
  function finishRound(msg) {
    R.over = true; R.endMsg = msg;
    if (M.m.type === 'tutorial') { finishMission(); return; }
    if (!R.spoilt) {
      M.have++; log.add(M.m.title + ': clean round', true);
      if (M.have >= (M.m.need || NEED)) finishMission();
      else toast('Clean round! ' + M.have + ' of ' + (M.m.need || NEED) + '.', 'good');
    } else { M.have = 0; M.spoilt++; toast('This round had a mistake, so it does not count. Try a new one.', 'bad'); }
  }
  function finishMission() {
    M.phase = 'done';
    const id = M.m.id;
    if (!done[id]) { done[id] = true; save('all:done', done); }
    if (M.m.type === 'challenge') {
      const n = M.spoilt === 0 ? 3 : M.spoilt <= 2 ? 2 : 1, best = load('all:stars', {}) || {};
      M.stars = n; if (!(best[id] >= n)) { best[id] = n; save('all:stars', best); }
    }
    log.note('Mission ' + M.m.title + ' complete' + (M.walked ? ', used Walk me through it' : '') + '.');
    if (MISSIONS.every(x => done[x.id])) log.finish();
    toast('Mission complete!', 'good');
  }

  // ---------------------------------------------------------------- flags on blobs
  const flagMats = [new THREE.MeshStandardMaterial({ color: 0xe03131, side: THREE.DoubleSide, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0xffd43b, side: THREE.DoubleSide, roughness: 0.6 })];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 0.5 });
  // a pole with a square flag at its far end, split corner to corner, red and yellow; the pole runs up its own +y
  function makeFlag() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 50, 8), poleMat); pole.position.y = 25; g.add(pole);
    for (let k = 0; k < 2; k++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(k ? [0, 50, 0, 32, 50, 0, 32, 18, 0] : [0, 50, 0, 32, 18, 0, 0, 18, 0], 3));
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, flagMats[k]));
    }
    return g;
  }
  // the two arm directions for a pose, in a blob's own space (it faces +z, the reader); hand 0 is on the reader's right
  function armDirs(p) {
    const v = p.map((k, i) => { let [dx, dy] = dirXY(k); if (p[0] === p[1]) dx = i ? -0.25 : 0.25; return new THREE.Vector3(dx, dy, dy < 0 ? 0.3 : 0.15).normalize(); });
    if (v[1].x > v[0].x) v.reverse();
    return v;
  }
  const UPV = new THREE.Vector3(0, 1, 0);
  function placeFlags(blob, flags, dirs) {
    flags.forEach((f, i) => {
      f.visible = !!dirs;
      if (!dirs) return;
      f.position.copy(blob.hands[i].position);
      f.quaternion.setFromUnitVectors(UPV, dirs[i]);
    });
  }
  const myFlags = [makeFlag(), makeFlag()]; me.group.add(...myFlags); myFlags.forEach(f => f.visible = false);
  // the signaller: a big blob on a stage, made once and moved into each new room
  let sig = null, sigFlags = null, sigHolder = null;
  function addSignaller(x, y) {
    if (!sig) {
      sig = createBlob(4, ''); sig.group.scale.setScalar(2.1);
      sigFlags = [makeFlag(), makeFlag()]; sig.group.add(...sigFlags);
      sigHolder = new THREE.Group(); sigHolder.add(sig.group); sigHolder.position.y = 30;
    }
    const stage = new THREE.Mesh(new THREE.BoxGeometry(5 * T - 10, 30, 3 * T - 10), new THREE.MeshStandardMaterial({ color: 0x5c6f82, roughness: 0.7 }));
    stage.userData.own = true; stage.userData.ownMat = true;
    stage.position.set((x + 0.5) * T, 15, (y + 0.5) * T); worldG.add(stage, sigHolder);
    blocks.push([x - 2, y - 1, x + 2, y + 1]);
    R.sigAt = [x, y];
  }

  // ---------------------------------------------------------------- reading flags: walk to the letter the flags show
  const KIND = {};
  const card = m => {
    const groups = GROUPS.map(g => ({ g, ls: [...g.letters].filter(L => !m.card || m.card.includes(L)) })).filter(x => x.ls.length);
    let h = '<p class="note">Left and right are as you look at the signaller.</p>';
    for (const { g, ls } of groups) h += '<div class="sem-group"><p class="sem-pat">' + g.pattern + '</p><div class="sem-row">' + ls.map(L => '<span class="sem-card">' + figSvg(POSE[L]) + '<b>' + L + '</b></span>').join('') + '</div></div>';
    if (m.spaces) h += '<div class="sem-group"><p class="sem-pat">A space between words: both flags down.</p><div class="sem-row"><span class="sem-card">' + figSvg([0, 0]) + '<b>space</b></span></div></div>';
    return h;
  };
  const boxes = (text, at) => '<div class="sem-word">' + [...text].map((c, i) => '<span class="sem-box' + (i === at ? ' now' : '') + (i < at ? ' done' : '') + (c === ' ' ? ' gap' : '') + '">' + (i < at && c !== ' ' ? c : '') + '</span>').join('') + '</div>';
  function letterPad(L, x, y, w = 1) {
    const s = addSlot({ role: 'letter', pad: L === ' ' ? 'machine' : 'lamp', x, y, w, letter: L, label: L === ' ' ? 'SPACE' : undefined,
      press: () => choose(L), pressText: L === ' ' ? 'to choose a space.' : 'to choose ' + L + '.' });
    if (L !== ' ') addItem(s, { sym: L, role: 'num' });
    return s;
  }
  function choose(L) {
    const want = R.p.text[R.at]; R.moves++;
    if (L !== want) {
      R.helpAt = R.at;
      mistake('The flags show ' + describe(POSE[want]) + '. That is ' + nameOf(want) + ', not ' + nameOf(L) + '.' + (want === ' ' ? '' : ' ' + groupNote(want)));
      return;
    }
    if (L !== ' ') addItem(R.out[R.at], { sym: L, role: 'result' });
    R.at++;
    explain(L === ' ' ? 'Both flags down: a space between words.' : 'The flags show ' + describe(POSE[L]) + '. That is ' + L + '. ' + groupNote(L));
    if (R.at >= R.p.text.length) finishRound('The ' + (M.m.spaces ? 'message' : 'word') + ' is <b>' + R.p.text + '</b>.');
  }
  KIND.read = {
    rulesName: 'Semaphore card',
    start(m) { return 'The signaller is sending a ' + (m.spaces ? 'message' : 'word') + '. Read the flags for the first letter.'; },
    idle() { return 'Read the flags. Walk to that letter and <b>press Space</b> on it.'; },
    setup(R, m) {
      const W = 29, n = R.p.text.length;
      newWorld(W, 15, 'Semaphore'); view.zoom?.(1150, 0.75); me.group.scale.setScalar(1);   // far back: the signaller and the letters both in view
      R.at = 0; R.helpAt = -1;
      addSignaller(14, 2);
      const x0 = Math.floor((W - n) / 2);
      R.out = [...R.p.text].map((c, i) => addSlot({ role: 'out', pad: 'answer', x: x0 + i, y: 5 }));
      R.pad = {};
      [...'ABCDEFGHIJKLM'].forEach((L, i) => { R.pad[L] = letterPad(L, 2 + 2 * i, 7); });
      [...'NOPQRSTUVWXYZ'].forEach((L, i) => { R.pad[L] = letterPad(L, 2 + 2 * i, 10); });
      if (m.spaces) R.pad[' '] = letterPad(' ', 12, 12, 5);
      pos.x = 14; pos.y = 8.5; R.face = Math.PI;
    },
    tick(dt) {
      if (!sig || !R || !R.sigAt) return;
      const p = POSE[R.p.text[Math.min(R.at, R.p.text.length - 1)]] || [0, 0], dirs = armDirs(R.over ? [0, 0] : p);
      sig.update(dt, { x: R.sigAt[0], y: R.sigAt[1], face: 0, moving: false, hands: dirs.map(d => ({ dir: d })) });
      placeFlags(sig, sigFlags, dirs);
    },
    placed() { },
    check() { },
    guide(R, m) {
      // after a slip (or once a challenge round no longer counts) the arrow shows the right letter; before, you decide
      if (R.over || !(m.type === 'tutorial' && (R.helpAt === R.at || R.spoilt))) return null;
      return slotTarget(R.pad[R.p.text[R.at]]);
    },
    steps(R, m) {
      return [...R.p.text].map((c, i) => ({
        text: i < R.at ? 'Letter ' + (i + 1) + ': ' + describe(POSE[c]) + (c === ' ' ? ': a space.' : ' is <b>' + c + '</b>.')
          : i === R.at ? 'Letter ' + (i + 1) + ': read the flags. Find them on the card, then walk to the ' + (m.spaces ? 'letter or SPACE pad' : 'letter') + ' and press Space.'
          : 'Letter ' + (i + 1) + '.',
        done: () => R.at > i }));
    },
    goals(m) { return ['Read the two flags as you see them.', 'Find the same flags on the semaphore card.', 'Walk to that letter and press Space.'].concat(m.spaces ? ['Both flags down means a space.'] : []); },
    rules(R, m) { return card(m); },
    expr(R, m) {
      const t = R.p.text, done = R.at >= t.length;
      return '<div class="sem-now"><div class="sem-big">' + figSvg(done ? [0, 0] : POSE[t[R.at]]) + '</div><div><b>The flags now</b><br>' + (done ? 'All done.' : 'Letter ' + (R.at + 1) + ' of ' + t.length + '.') + '</div></div>' + boxes(t, R.at);
    },
    walk(R, m) {
      let w; do w = m.spaces ? pick(MESSAGES) : pick(READ_WORDS.filter(x => x.length <= 5)); while (w === R.p.text);
      const steps = [{ text: '<b>A different ' + (m.spaces ? 'message' : 'word') + '.</b> Read one letter at a time. Left and right are as you look at the signaller.', visual: boxes(w, 0) }];
      [...w].forEach((c, i) => steps.push({ text: c === ' ' ? 'Both flags down: a space between words.' : 'The flags show ' + describe(POSE[c]) + '. Find that on the card: it is <span class="hl">' + c + '</span>. ' + groupNote(c), visual: '<div class="sem-now">' + figSvg(POSE[c], 'big') + boxes(w, i + 1) + '</div>' }));
      steps.push({ text: 'The ' + (m.spaces ? 'message' : 'word') + ' is <span class="hl">' + w + '</span>. Now decode yours.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- sending flags: pose your own blob
  function pickDir(k) {
    if (!R || R.over || locked() || M.m.kind !== 'send') return;
    const i = R.pose.indexOf(k);
    if (i >= 0) R.pose.splice(i, 1); else { R.pose.push(k); if (R.pose.length > 2) R.pose.shift(); }
    drawAll();
  }
  function sendLetter() {
    if (!R || R.over || locked() || M.m.kind !== 'send' || R.pose.length < 2) return;
    const want = R.p.text[R.at], got = LETTER_OF[poseKey(R.pose)]; R.moves++;
    if (got !== want) {
      mistake('Those flags make ' + (got && got !== ' ' ? got : 'no letter') + '. ' + want + ' is ' + describe(POSE[want]) + '. ' + groupNote(want));
      return;
    }
    addItem(R.out[R.at], { sym: want, role: 'result' });
    R.at++; R.pose = [];
    explain('You sent ' + describe(POSE[want]) + '. The reader reads ' + want + '. ' + groupNote(want));
    if (R.at >= R.p.text.length) finishRound('You sent <b>' + R.p.text + '</b>.');
    afterChange();
  }
  $('mission').addEventListener('click', e => {
    const d = e.target.closest('[data-dir]'); if (d) { pickDir(+d.dataset.dir); return; }
    if (e.target.closest('[data-send]')) sendLetter();
  });
  KIND.send = {
    rulesName: 'Semaphore card',
    start() { return 'You are the signaller. Pick the two flags for each letter on the right, then press Send this letter.'; },
    idle() { return 'Pick two flags on the right, then press <b>Send this letter</b>.'; },
    setup(R, m) {
      const W = 29, n = R.p.text.length;
      newWorld(W, 15, 'Semaphore'); view.zoom?.(560, 0.32); me.group.scale.setScalar(1.6);   // close in and low, face on to your own flags, which you hold up big
      R.at = 0; R.pose = [];
      const x0 = Math.floor((W - n) / 2);
      R.out = [...R.p.text].map((c, i) => addSlot({ role: 'out', pad: 'answer', x: x0 + i, y: 4 }));
      addSign('SEND', 14, 4, 170, { bg: '#151515', size: 0.032 });
      pos.x = 14; pos.y = 7; R.face = 0;
    },
    // your blob faces the reader (the camera) whenever you stand still, so the flags read the right way round
    tick() { if (!moving && R && !R.over) pos.face = 0; },
    myHands() { return R && M.m.kind === 'send' ? armDirs(R.pose.length === 2 ? R.pose : R.pose.length === 1 ? [R.pose[0], R.pose[0] === 0 ? 1 : 0] : [0, 0]) : null; },
    placed() { },
    check() { },
    guide() { return null; },
    steps(R, m) {
      return [...R.p.text].map((c, i) => ({
        text: i < R.at ? 'Letter ' + (i + 1) + ': <b>' + c + '</b> sent, ' + describe(POSE[c]) + '.'
          : i === R.at ? 'Send <b>' + c + '</b>: find ' + c + ' on the card. Pick its two flags, then press Send this letter.'
          : 'Letter ' + (i + 1) + ': <b>' + c + '</b>.',
        done: () => R.at > i }));
    },
    goals() { return ['Find the letter on the semaphore card.', 'Pick the same two flags, as the reader will see them.', 'Press Send this letter.']; },
    rules(R, m) { return card(m); },
    expr(R, m) {
      const t = R.p.text, done = R.at >= t.length;
      const cell = k => '<button type="button" class="sem-dir' + (R.pose.includes(k) ? ' on' : '') + '" data-dir="' + k + '" aria-pressed="' + R.pose.includes(k) + '" aria-label="Flag ' + DIR_NAME[k] + '">' + DIR_ARROW[k] + '</button>';
      return '<div class="sem-word"><b>Send:</b>' + [...t].map((c, i) => '<span class="sem-box' + (i === R.at ? ' now' : '') + (i < R.at ? ' done' : '') + '">' + c + '</span>').join('') + '</div>'
        + (done ? '' : '<div class="sem-pick">' + cell(3) + cell(4) + cell(5) + cell(2) + '<div class="sem-mid">' + figSvg(R.pose) + '</div>' + cell(6) + cell(1) + cell(0) + cell(7) + '</div>'
        + '<p class="note">' + (R.pose.length === 2 ? 'Your flags: ' + describe(R.pose) + '.' : 'Pick ' + (2 - R.pose.length) + ' more flag' + (R.pose.length ? '' : 's') + '. Left and right are as the reader sees you.') + '</p>'
        + '<div class="actions"><button type="button" class="btn" data-send="1"' + (R.pose.length < 2 ? ' disabled' : '') + '>Send this letter</button></div>');
    },
    walk(R, m) {
      let w; do w = pick(SEND_WORDS); while (w === R.p.text);
      const steps = [{ text: '<b>A different word: ' + w + '.</b> Send one letter at a time.', visual: '' }];
      [...w].forEach(c => steps.push({ text: 'To send <span class="hl">' + c + '</span>, find it on the card: ' + describe(POSE[c]) + '. Pick those two flags, then press Send. ' + groupNote(c), visual: '<div class="sem-now">' + figSvg(POSE[c], 'big') + '</div>' }));
      steps.push({ text: 'That sends ' + w + '. Now send yours.', visual: '' });
      return steps;
    }
  };

  // ---------------------------------------------------------------- the hand: hold to grab, let go to put down
  function locked() { return !M || M.phase !== 'play' || !R || R.over || !!R.ask || !$('cardWrap').hidden; }
  function grabTarget() {
    if (hand.item || locked()) return null;
    const s = nearestSlot(0.62, s => s.crate || s.press || s.items.length);
    return s ? { slot: s } : null;
  }
  function setHand(down) {
    if (hand.down === down) return;
    hand.down = down;
    $('leftBtn')?.classList.toggle('on', down);
    if (!down) {
      // let go too soon: say so, so a tap never just seems to do nothing
      if (hand.pending) toast('Hold Space a little longer. A cube that is already in place needs a short hold to pick up.', 'hint');
      else if (hand.item && clock - (hand.since || 0) < 0.35 && nearestSlot(0.9, x => !x.press) === hand.from) { hand.quick = true; }
      hand.pending = null; letGo();
      if (hand.quick) { hand.quick = false; toast('Keep holding Space to carry it. Let go when you reach a pad.', 'hint'); }
      hint(); return;
    }
    if (locked()) {
      if (M && M.phase === 'play' && R && R.ask) toast('Predict first: answer on the right.', 'hint');
      else if (M && M.phase !== 'play') toast(M.phase === 'ask' ? 'Answer the question on the right first.' : 'Press the button on the mission sheet to go on.', 'hint');
      else if (R && R.over) toast('Press the button on the mission sheet to go on.', 'hint');
      return;
    }
    const g = grabTarget(); if (!g) return;
    const s = g.slot;
    if (s.risky && !s.crate && !s.press && !s.take(top(s))) { hand.pending = { s, at: clock, it: top(s) }; hint(); return; }
    doGrab(s);
  }
  function holdTick() {
    const p = hand.pending, bar = $('holdBar');
    if (bar) bar.style.width = p && hand.down ? Math.min(100, (clock - p.at) / HOLD * 100) + '%' : '0%';
    if (!p || !hand.down || clock - p.at < HOLD) return;
    hand.pending = null;
    const g = grabTarget();
    if (g && g.slot === p.s && top(p.s) === p.it) doGrab(p.s);
  }
  function doGrab(s) {
    if (s.press) { s.press(s); afterChange(); return; }
    if (s.crate) { hand.item = cube(s.crate, { role: s.crateRole || 'paren' }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
    const it = top(s), why = s.take(it);
    if (why) { toast(why, 'hint'); return; }
    s.items.pop(); hand.item = it; it.slot = null; hand.from = s; hand.since = clock; R.moves++;
    afterChange();
  }
  function letGo() {
    const it = hand.item; if (!it) return;
    const from = hand.from;
    const back = () => { hand.item = null; hand.from = null; if (from.crate) killItem(it); else { from.items.push(it); it.slot = from; } };
    const s = nearestSlot(0.9, x => !x.press);
    if (!s) { back(); toast('Let go over a pad: the glowing ring shows where.', 'hint'); afterChange(); return; }
    if (s === from) { back(); afterChange(); return; }
    const res = s.put(it, from);
    if (res) { back(); if (res.mistake) mistake(res.msg); else toast(res.msg, 'hint'); afterChange(); return; }
    hand.item = null; hand.from = null;
    if (s.crate) { killItem(it); afterChange(); return; }
    s.items.push(it); it.slot = s; R.moves++;
    KIND[M.m.kind].placed(it, s, from);
    afterChange();
  }
  function afterChange() {
    if (!M || !R) return;
    if (M.phase === 'play' && !R.over) KIND[M.m.kind].check();
    drawAll();
  }

  // ---------------------------------------------------------------- the guide: the arrow on the floor, the ring, the outline
  function slotTarget(s) { return s ? { x: s.x + (s.w - 1) / 2, y: s.y, reach: 1.05 + (s.w - 1) / 2, box: [s.x - 0.5, s.y - 0.5, s.x + s.w - 0.5, s.y + 0.5], exact: true, slot: s } : null; }
  function boxTarget(x0, y0, x1, y1) { return { x: Math.max(x0, Math.min(x1, pos.x)), y: Math.max(y0, Math.min(y1, pos.y)), reach: 1.1, box: [x0 - 0.5, y0 - 0.5, x1 + 0.5, y1 + 0.5] }; }
  // an arrow to the nearest of several pads, with no ring: you choose which one
  function areaTarget(list) { if (!list.length) return null; const near = list.slice().sort((a, b) => rectDist(a, pos.x, pos.y) - rectDist(b, pos.x, pos.y))[0]; const t = slotTarget(near); t.exact = false; return t; }
  function guideTarget() {
    if (!M || !R || M.phase !== 'play' || R.over) return null;
    // a spoilt challenge round guides like a tutorial: it does not count any more, so show the method
    const m = R.spoilt && M.m.type === 'challenge' && !M.m.noHelp ? Object.assign({}, M.m, { type: 'tutorial', countAsk: true }) : M.m;
    return KIND[M.m.kind].guide(R, m);
  }
  function arrowGeometry(pts, w, hl0) {
    const P = pts.map(([x, y]) => [(x + 0.5) * T, (y + 0.5) * T]), n = P.length, half = w / 2, verts = [], idx = [];
    const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], [tx, ty] = unit(b[0] - a[0], b[1] - a[1]);
      let nx = -ty, ny = tx, k = 1;
      if (i > 0 && i < n - 1) { const [sx, sy] = unit(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); k = Math.min(2, 1 / Math.max(0.3, nx * -sy + ny * sx)); }
      verts.push(P[i][0] + nx * half * k, 3, P[i][1] + ny * half * k, P[i][0] - nx * half * k, 3, P[i][1] - ny * half * k);
      if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    const [ex, ey] = P[n - 1], [tx, ty] = unit(ex - P[n - 2][0], ey - P[n - 2][1]), hw = w * 1.35, hl = hl0 || w * 1.7, o = verts.length / 3;
    verts.push(ex - ty * hw, 3, ey + tx * hw, ex + ty * hw, 3, ey - tx * hw, ex + tx * hl, 3, ey + ty * hl);
    idx.push(o, o + 1, o + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx);
    return g;
  }
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const arrows = new THREE.Group(), arrowBody = new THREE.Mesh(new THREE.BufferGeometry(), arrowMat), arrowGlow = new THREE.Mesh(new THREE.BufferGeometry(), glowMat);
  arrowBody.renderOrder = 3; arrowGlow.renderOrder = 2; arrowGlow.position.y = -0.5; arrows.add(arrowGlow, arrowBody); arrows.count = 0;
  let guideKey = '', guideAt = null, guideRoute = null, routeKey = '';
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function gridRoute(sx, sy, g) {
    const N = MAPW * MAPH, cost = new Float64Array(N * 5).fill(Infinity), prev = new Int32Array(N * 5).fill(-1), buckets = [[]];
    const st = (sy * MAPW + sx) * 5 + 4;
    cost[st] = 0; buckets[0].push(st);
    for (let c = 0; c < buckets.length; c++) {
      const list = buckets[c]; if (!list) continue;
      for (let li = 0; li < list.length; li++) {
        const sid = list[li]; if (cost[sid] !== c) continue;
        const cell = Math.floor(sid / 5), dir = sid % 5, x = cell % MAPW, y = Math.floor(cell / MAPW);
        if (Math.hypot(x - g.x, y - g.y) <= g.reach) {
          const out = []; let k = sid;
          while (k !== -1) { const cc = Math.floor(k / 5); out.unshift([cc % MAPW, Math.floor(cc / MAPW)]); k = prev[k]; }
          return out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
        }
        for (let d = 0; d < 4; d++) {
          const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (solidAt(nx, ny)) continue;
          const nc = c + 1 + (dir !== 4 && dir !== d ? 2 : 0), nid = (ny * MAPW + nx) * 5 + d;
          if (nc < cost[nid]) { cost[nid] = nc; prev[nid] = sid; (buckets[nc] || (buckets[nc] = [])).push(nid); }
        }
      }
    }
    return null;
  }
  const pulse = new THREE.Mesh(new THREE.RingGeometry(62, 74, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2c21b, transparent: true, opacity: 0.9, depthWrite: false }));
  pulse.visible = false;
  function updateGuide(ts) {
    arrowMat.opacity = 0.78 + 0.2 * Math.sin(ts / 220); glowMat.opacity = 0.22 + 0.18 * Math.sin(ts / 220);
    const g = guideTarget();
    pulse.visible = !!(g && g.exact);
    if (g && g.exact) { pulse.position.set((g.x + 0.5) * T, PAD_H + 3, (g.y + 0.5) * T); pulse.scale.set(g.slot.w, 1, 1); pulse.material.opacity = 0.5 + 0.4 * Math.sin(ts / 180); }
    if (!g || Math.hypot(g.x - pos.x, g.y - pos.y) < g.reach + 0.2) { arrows.visible = false; arrows.count = 0; guideKey = ''; return; }
    const sx = Math.round(pos.x), sy = Math.round(pos.y);
    const tk = g.x.toFixed(2) + ',' + g.y.toFixed(2);
    if (tk + '@' + sx + ',' + sy !== routeKey) { routeKey = tk + '@' + sx + ',' + sy; guideRoute = gridRoute(sx, sy, g); }
    if (tk === guideKey && guideAt && Math.hypot(pos.x - guideAt[0], pos.y - guideAt[1]) < 0.03) return;
    guideKey = tk; guideAt = [pos.x, pos.y];
    const tiles = guideRoute;
    if (!tiles) { arrows.visible = false; return; }
    const corners = [tiles[0]];
    for (let i = 1; i < tiles.length - 1; i++) {
      const p = tiles[i - 1], q = tiles[i], r = tiles[i + 1];
      if ((q[0] - p[0]) !== (r[0] - q[0]) || (q[1] - p[1]) !== (r[1] - q[1])) corners.push(q);
    }
    if (tiles.length > 1) corners.push(tiles[tiles.length - 1]);
    let pts;
    if (corners.length > 1) { const [c0, c1] = corners; pts = [c0[1] === c1[1] ? [pos.x, c0[1]] : [c0[0], pos.y]].concat(corners.slice(1)); }
    else pts = [[pos.x, pos.y]];
    const last = pts[pts.length - 1];
    let tip = [g.x, g.y];
    if (g.box) { const [x0, y0, x1, y1] = g.box; tip = [Math.max(x0, Math.min(x1, last[0])), Math.max(y0, Math.min(y1, last[1]))]; }
    if (Math.abs(tip[0] - last[0]) > 0.02 && Math.abs(tip[1] - last[1]) > 0.02) {
      const prevPt = pts[pts.length - 2], horiz = prevPt ? Math.abs(prevPt[1] - last[1]) < 1e-6 : Math.abs(tip[0] - last[0]) > Math.abs(tip[1] - last[1]);
      pts.push(horiz ? [tip[0], last[1]] : [last[0], tip[1]]);
    }
    pts.push(tip);
    const trim = (list, len, fromEnd) => {
      const p = fromEnd ? list.slice().reverse() : list.slice();
      while (p.length > 1 && len > 0) {
        const l = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
        if (l > len) { p[0] = [p[0][0] + (p[1][0] - p[0][0]) * len / l, p[0][1] + (p[1][1] - p[0][1]) * len / l]; len = 0; }
        else { len -= l; p.shift(); }
      }
      return fromEnd ? p.reverse() : p;
    };
    let line = trim(pts, 0.45, false);
    line = trim(line, 34 * 1.7 / T, true);
    const clean = [line[0]];
    for (const p of line) { const c = clean[clean.length - 1]; if (Math.hypot(p[0] - c[0], p[1] - c[1]) > 0.04) clean.push(p); }
    if (clean.length < 2) { arrows.visible = false; return; }
    arrowBody.geometry.dispose(); arrowGlow.geometry.dispose();
    arrowBody.geometry = arrowGeometry(clean, 34); arrowGlow.geometry = arrowGeometry(clean, 64, 34 * 1.7 + 14);
    arrows.visible = true; arrows.count = clean.length;
  }
  // an outline round what an empty hand would grab, or the pad a carried thing would go onto; the cube itself glows
  const outlineG = new THREE.Group();
  const outMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  let outlineKey = '', glowing = new Set();
  function updateOutline(ts) {
    outMat.opacity = 0.6 + 0.35 * Math.sin(ts / 170);
    const g = grabTarget(), s = g ? g.slot : hand.item && !locked() ? nearestSlot(0.9, x => !x.press) : null;
    // what glows: the thing under your hand, the next thing the guide points at, and in a bit-string challenge every
    // tray you could pick up (none of them is singled out)
    const want = new Set();
    if (g && !g.slot.crate && !g.slot.press && top(g.slot)) want.add(top(g.slot));
    const gt = !hand.item ? guideTarget() : null;
    if (gt && gt.exact && gt.slot.items.length) want.add(top(gt.slot));
    if (gt && gt.glowAll) gt.glowAll.forEach(x => want.add(x));
    for (const x of glowing) if (!want.has(x)) x.k3?.setGlow(false);
    for (const x of want) if (!glowing.has(x)) x.k3?.setGlow(true);
    glowing = want;
    const key = s ? s.id + (g ? 'g' : 'd') : '';
    if (key === outlineKey) return;
    outlineKey = key;
    for (const o of outlineG.children.slice()) { outlineG.remove(o); o.geometry.dispose(); }
    if (!s) return;
    const w = s.w * T - 4, d = T - 4, cx = (s.x + s.w / 2) * T, cz = (s.y + 0.5) * T, th = 10;
    for (const [x, z, sx, sz] of [[0, -d / 2, w + th, th], [0, d / 2, w + th, th], [-w / 2, 0, th, d], [w / 2, 0, th, d]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 4, sz), outMat); m.position.set(cx + x, PAD_H + 3, cz + z); outlineG.add(m);
    }
  }

  // ================================================================ missions and the mission sheet
  function inProgress() { return !!(M && R && M.phase === 'play' && (R.moves > 0 || M.have > 0) && !R.over); }
  function leaveThen(go) { if (!inProgress()) { go(); return; } M.leave = go; drawPanel(); document.querySelector('#mission .leave')?.scrollIntoView({ block: 'nearest' }); }
  function start(i) {
    missionAt = i; const m = MISSIONS[i]; openSecs.add(m.group); rulesOpen = null;
    M = { m, phase: m.before ? 'ask' : 'play', have: 0, spoilt: 0, walked: false, afterOk: !m.after, lastKey: null };
    hand.item = null; hand.from = null; hand.pending = null;
    newRound();
  }
  // lesson mode: on or off, and which lesson (remembered on this computer)
  const lessonMode = Object.assign({ on: false, id: LESSONS[0].id }, load('lessonMode', {}) || {});
  { const q = new URLSearchParams(location.search).get('lesson'); if (q && LESSONS.some(L => L.id === q)) { lessonMode.on = true; lessonMode.id = q; } }
  const lessonList = () => { const L = LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]; return L.missions.concat(L.ext || []).map(id => MISSIONS.findIndex(m => m.id === id)).filter(i => i >= 0); };
  const isExt = i => ((LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).ext || []).includes(MISSIONS[i].id);
  function startLesson() { const ids = lessonList(); start(ids.find(i => !done[MISSIONS[i].id]) ?? ids[0]); }
  const nextMission = () => {
    if (lessonMode.on) { const ids = lessonList(), k = ids.indexOf(missionAt); if (k >= 0) return k + 1 < ids.length ? ids[k + 1] : null; }
    const sec = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === MISSIONS[missionAt].group).map(([, i]) => i), k = sec.indexOf(missionAt); return k >= 0 && k + 1 < sec.length ? sec[k + 1] : (missionAt + 1 < MISSIONS.length ? missionAt + 1 : null); };
  const starsHtml = n => '<span class="stars" aria-label="' + n + ' of 3 stars">' + [0, 1, 2].map(i => '<svg viewBox="0 0 24 24" class="' + (i < n ? 'on' : '') + '"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg>').join('') + '</span>';

  let lastFocus = "", logOpen = false, rulesOpen = null;
  function drawPanel() {
    const t = $('mission'), m = M.m, K = KIND[m.kind];
    t.hidden = false; t.innerHTML = '';
    const inLesson = lessonMode.on && lessonList().includes(missionAt), inSec = inLesson ? lessonList().map(i => MISSIONS[i]) : MISSIONS.filter(x => x.group === m.group);
    const where = inLesson ? (LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).title.split(':')[0] : m.group;
    t.appendChild(el('div', { class: 'head' }, '<span>' + (inLesson ? where + ': ' + m.group : m.group) + '</span><span>' + (inLesson ? (isExt(missionAt) ? 'Extension' : 'Activity') : m.type === 'tutorial' ? 'Tutorial' : 'Challenge') + ' ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + '</span>'));
    t.appendChild(el('h2', {}, m.title));
    if (done[m.id] && M.phase !== 'done') t.appendChild(el('p', { class: 'note' }, 'Done before. Play it again for practice.'));
    t.appendChild(el('p', {}, m.intro));
    t.appendChild(el('div', { class: 'cl-expr' }, K.expr(R, m)));
    // the four column rules: open in tutorials, folded in challenges, gone with No Help
    if (K.rules && !m.noHelp) {
      const d = el('details', { class: 'cl-log bin-rules-box' }); d.open = rulesOpen != null ? rulesOpen : m.type === 'tutorial';
      const sum = el('summary', {}, K.rulesName || 'Rules');
      sum.addEventListener('click', () => { rulesOpen = !d.open; });
      d.append(sum, el('div', {}, K.rules(R, m)));
      t.appendChild(d);
    }
    if (m.type === 'tutorial') {
      const st = K.steps(R, m), ol = el('ol', { class: 'steps' });
      let now = st.findIndex(s => !s.done()); if (M.phase === 'done') now = st.length;
      st.forEach((s, i) => ol.appendChild(el('li', { class: i < now || (now < 0) ? 'done' : i === now ? 'now' : 'later' }, '<span>' + s.text + '</span>')));
      t.appendChild(ol);
    } else {
      t.appendChild(el('ul', { class: 'goals' }, K.goals(m).map(g => '<li>' + g + '</li>').join('')));
      t.appendChild(el('p', { class: 'note' }, 'The arrow shows where to go, not what to do: you decide each cube. <b>' + M.have + ' of ' + (m.need || NEED) + ' clean rounds in a row.</b>'));
    }
    if (R.ask) t.appendChild(predictBox(R.ask));
    if (R.why && !R.over) t.appendChild(el('p', { class: 'cl-why' }, '<b>Why:</b> ' + R.why));
    if (R.over && R.endMsg) t.appendChild(el('p', { class: R.spoilt ? 'note' : 'win' }, R.endMsg));
    if (R.over && m.type === 'challenge' && R.spoilt && R.why) t.appendChild(el('p', { class: 'cl-why' }, '<b>The mistake:</b> ' + R.why));
    if (M.phase === 'done') t.appendChild(el('p', { class: 'win' }, 'Mission complete!' + (M.stars ? ' ' + starsHtml(M.stars) : '')));
    if (M.phase === 'ask') t.appendChild(askBox(m.before, () => { M.phase = 'play'; drawAll(); }));
    if (M.phase === 'done' && !M.afterOk) t.appendChild(askBox(m.after, () => { M.afterOk = true; drawAll(); }));
    const act = el('div', { class: 'actions' });
    if (M.phase === 'done' && M.afterOk) { const nx = nextMission(); act.appendChild(nx != null ? btn('Next mission', 'go', () => start(nx)) : btn('Play again', 'go', () => start(missionAt))); if (inLesson && !isExt(missionAt) && (nx == null || isExt(nx))) t.appendChild(el('p', { class: 'win' }, 'Lesson complete! Every activity for this lesson is done.' + (nx != null ? ' Next: the extension challenges.' : ''))); }
    else if (M.phase === 'play' && R.over) act.appendChild(btn('Next round', 'go', () => newRound()));
    if (M.phase === 'play' && !R.over) act.appendChild(btn('Start again', '', () => leaveThen(() => { M.have = 0; newRound(); })));
    if (!m.noHelp) act.appendChild(btn('Walk me through it', '', walkMe));
    t.appendChild(act);
    // every step explained so far this round, newest first, folded away until opened (it stays open once opened)
    if (R.log && R.log.length > 1) {
      const d = el('details', { class: 'cl-log' }); d.open = logOpen;
      d.appendChild(el('summary', {}, 'What has happened so far (' + R.log.length + ')'));
      d.appendChild(el('ol', { reversed: '' }, R.log.slice().reverse().map(x => '<li>' + x + '</li>').join('')));
      d.addEventListener('toggle', () => { logOpen = d.open; });
      t.appendChild(d);
    }
    t.appendChild(navBox());
    // what needs attention now glows and is scrolled into view: a question first (it glows until it is answered),
    // then the end of a round (the result and its button), then the step you are on
    const ask = t.querySelector('.ask'), step = t.querySelector('.steps li.now');
    const focus = ask || (R.over || M.phase === 'done' ? act : step);
    if (focus) {
      if (focus !== act) focus.classList.add('attn');
      const key = (ask ? 'ask:' + (R.ask ? R.ask.q : M.phase) : R.over || M.phase === 'done' ? 'end:' + M.phase : 'step:' + [...t.querySelectorAll('.steps li')].indexOf(step)) + '@' + missionAt;
      const box = t.getBoundingClientRect(), r = focus.getBoundingClientRect(), off = r.top < box.top || r.bottom > box.bottom;
      // scroll when it is new, and pull it back if it has been scrolled out of sight
      if (key !== lastFocus || off) focus.scrollIntoView({ block: ask ? 'center' : 'nearest' });   // instant: a smooth scroll never ends in a hidden frame
      lastFocus = key;
    }
    // in a challenge, one dot for each clean round needed, filled as they are won (the chip never changes size)
    const need = m.need || NEED, won = M.phase === 'done' ? need : M.have;
    $('step').innerHTML = where + ': ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + (m.type === 'challenge' ? ' <span class="rdots" title="Clean rounds in a row" aria-label="' + won + ' of ' + need + ' clean rounds">' + Array.from({ length: need }, (_, i) => '<i class="' + (i < won ? 'on' : R && R.spoilt && i === won ? 'bad' : '') + '"></i>').join('') + '</span>' : '');
  }
  function navBox() {
    const box = el('div', { class: 'navbox' });
    box.appendChild(el('div', { class: 'head' }, '<span>Choose a mission</span>'));
    if (M.leave) {
      const lv = el('div', { class: 'leave' }, '<b>Leave this mission?</b> This round will be lost.'), row = el('div', { class: 'actions' });
      row.append(btn('Leave', 'go', () => { const go = M.leave; M.leave = null; go(); }), btn('Stay', '', () => { M.leave = null; drawPanel(); }));
      lv.appendChild(row); box.appendChild(lv);
    }
    const modeBar = el('div', { class: 'modebar seg', role: 'group', 'aria-label': 'Show' });
    [['all', 'All missions'], ['lesson', 'Lesson mode']].forEach(([k, label]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String((lessonMode.on ? 'lesson' : 'all') === k) }, label);
      b.addEventListener('click', () => {
        const on = k === 'lesson', leaving = on && !lessonList().includes(missionAt);
        const go = () => { lessonMode.on = on; save('lessonMode', lessonMode); if (leaving) startLesson(); else drawAll(); };
        if (leaving) leaveThen(go); else go();
      });
      modeBar.appendChild(b);
    });
    box.appendChild(modeBar);
    const nav = el('div', { class: 'sections', role: 'navigation', 'aria-label': 'Missions' });
    const stars = load('all:stars', {}) || {};
    if (lessonMode.on) {
      const pickL = el('select', { id: 'nbLesson', 'aria-label': 'Lesson' });
      LESSONS.forEach(L => pickL.appendChild(el('option', { value: L.id }, L.title)));
      pickL.value = lessonMode.id;
      pickL.addEventListener('change', () => { const want = pickL.value; pickL.value = lessonMode.id; leaveThen(() => { lessonMode.id = want; save('lessonMode', lessonMode); startLesson(); }); });
      nav.appendChild(pickL);
      const ids = lessonList(), core = ids.filter(i => !isExt(i)), total = core.reduce((n, i) => n + minsOf(MISSIONS[i]), 0), left = core.filter(i => !done[MISSIONS[i].id]).reduce((n, i) => n + minsOf(MISSIONS[i]), 0);
      nav.appendChild(el('p', { class: 'note' }, core.filter(i => done[MISSIONS[i].id]).length + ' of ' + core.length + ' done. About ' + total + ' minutes in all' + (left && left < total ? ', about ' + left + ' left.' : '.')));
      const items = el('div', { class: 'sec-list lesson-list' });
      ids.forEach((i, k) => {
        const x = MISSIONS[i];
        if (isExt(i) && !isExt(ids[k - 1])) items.appendChild(el('p', { class: 'note' }, '<b>Extension challenges</b> for anyone who finishes early.'));
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[x.id] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (stars[x.id] != null ? starsHtml(stars[x.id]) : '') + '<span class="mins">' + minsOf(x) + ' min</span>');
        b.disabled = !(k === 0 || done[MISSIONS[ids[k - 1]].id] || done[x.id]);
        b.addEventListener('click', () => leaveThen(() => start(i)));
        items.appendChild(b);
      });
      nav.appendChild(items);
      box.appendChild(nav);
      return box;
    }
    SECTIONS.forEach(sec => {
      const list = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === sec);
      const det = el('details', { class: 'sec' + (sec === M.m.group ? ' current' : '') });
      if (openSecs.has(sec)) det.open = true;
      det.appendChild(el('summary', {}, '<span>' + sec + '</span><span class="count">' + list.filter(([x]) => done[x.id]).length + ' of ' + list.length + '</span>'));
      det.addEventListener('toggle', () => { if (det.open) openSecs.add(sec); else openSecs.delete(sec); });
      const items = el('div', { class: 'sec-list' });
      list.forEach(([x, i], k) => {
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[x.id] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (stars[x.id] != null ? starsHtml(stars[x.id]) : ''));
        b.disabled = !(k === 0 || done[list[k - 1][0].id] || done[x.id]);
        b.addEventListener('click', () => leaveThen(() => start(i)));
        items.appendChild(b);
      });
      det.appendChild(items); nav.appendChild(det);
    });
    box.appendChild(nav);
    return box;
  }
  // A prediction: a typed number, or a row of lamps to switch. Tutorial: wrong shows how, try again. Challenge: wrong
  // is a mistake, the answer is shown and the machine runs.
  function predictBox(a) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Predict.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' + (a.fb ? ' bad' : '') }, a.fb || '');
    let read;
    const row = el('div', { class: 'ask-row' });
    if (a.type === 'num') {
      const inp = el('input', { type: 'text', inputmode: 'numeric', id: 'clAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.appendChild(inp); read = () => { const v = inp.value.trim().replace(/−/g, '-'); return /^-?\d+$/.test(v) ? Number(v) : null; };
    } else if (a.type === 'choice') {
      a.order = a.order || a.options.slice();
      let chosen = null;
      const opts = el('div', { class: 'ask-opts cl-choice' + (a.wide ? ' wide' : '') });
      a.order.forEach(o => opts.appendChild(btn(o, '', () => { chosen = o; go(); })));
      row.appendChild(opts); read = () => chosen;
    } else {
      a.pick = a.pick || Array(a.len).fill('?');
      const lamps = el('div', { class: 'cl-pick', role: 'group', 'aria-label': 'Your tray' });
      a.pick.forEach((b, i) => {
        const x = el('button', { type: 'button', class: 'cl-l ' + (b === '1' ? 'on' : b === '0' ? 'off' : 'unk'), 'aria-label': 'Lamp ' + (i + 1) + ': ' + (b === '?' ? 'not set' : b) }, b);
        x.addEventListener('click', () => { a.pick[i] = a.pick[i] === '1' ? '0' : '1'; drawPanel(); document.querySelectorAll('.cl-pick button')[i]?.focus(); });
        lamps.appendChild(x);
      });
      row.appendChild(lamps); read = () => a.pick.includes('?') ? null : a.pick.join('');
    }
    const go = () => {
      const v = read();
      if (v == null) { fb.className = 'ask-fb bad'; fb.textContent = a.type === 'num' ? 'Type a whole number.' : 'Switch every lamp on or off first.'; return; }
      if (v === a.answer) { log.note('Predicted ' + v + ' (right).'); R.ask = null; R.why = null; toast('Right!', 'good'); a.done(); afterChange(); return; }
      if (M.m.type === 'challenge') { R.ask = null; mistake('You predicted ' + v + '. ' + a.why); a.done(); afterChange(); return; }
      a.fb = 'Not quite. ' + a.hint + ' Try again.'; log.note('Predicted ' + v + ' (wrong).');
      if (a.pick) a.pick = Array(a.len).fill('?');
      drawPanel(); $('clAsk')?.focus();
    };
    if (a.type !== 'choice') row.appendChild(btn('Check', 'go', go));
    box.append(row, fb);
    return box;
  }
  function askBox(a, onRight) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Think.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' }), opts = el('div', { class: 'ask-opts' });
    shuffle(a.options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => opts.appendChild(btn(o, '', () => {
      if (i === 0) { log.note('Question answered right.'); toast('Yes!', 'good'); onRight(); }
      else { fb.className = 'ask-fb bad'; fb.innerHTML = 'Not quite. ' + a.why + ' Try again.'; shuffle([...opts.children]).forEach(x => opts.appendChild(x)); }
    })));
    box.append(opts, fb);
    return box;
  }
  function walkMe() {
    M.walked = true;
    const steps = KIND[M.m.kind].walk(R, M.m);
    let i = 0;
    const wrap = $('cardWrap'), card = $('card');
    const draw = () => {
      const s = steps[i];
      card.innerHTML = '<h2>Walk me through it</h2><p class="small">A different example, step by step.</p><div class="count">Step ' + (i + 1) + ' of ' + steps.length + '</div><p class="text">' + s.text + '</p>' + (s.visual || '') + '<div class="actions"></div>';
      const act = card.querySelector('.actions');
      const back = btn('Back', '', () => { if (i > 0) { i--; draw(); } }); back.disabled = i === 0;
      act.append(back, btn(i === steps.length - 1 ? 'Done' : 'Next step', 'go', () => { if (i < steps.length - 1) { i++; draw(); } else { wrap.hidden = true; log.note('Walk me through it (' + steps.length + ' steps).'); } }));
    };
    keys.clear(); setHand(false);
    wrap.hidden = false; draw(); card.querySelector('.btn:not([disabled])')?.focus();
  }
  function drawAll() { drawPanel(); hint(); }

  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls === 'bad' ? 'bad' : cls === 'good' ? 'good' : 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, cls === 'bad' ? 5200 : 3200); }
  function hint() {
    // what Space does right now, for what is in front of you: HOLD (pick up and carry) or PRESS (switch a lamp)
    let h, key = 'press', mode = '';
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + s.crate + ' cube' : s.items.length ? ('the ' + top(s).sym + ' cube') : '');
    if (hand.item) { h = '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.'; key = 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Hold Space</b> to pick up ' + what + '. It is already in place, so hold it down until the bar fills.'; key = 'hold to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Hold Space</b> to pick up ' + what + ', and keep holding to carry it.'; key = 'hold to pick up'; mode = 'hold'; }
    else h = (M && KIND[M.m.kind].idle ? KIND[M.m.kind].idle() + ' ' : '') + 'Right-drag turns the camera.';
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
    const k = $('keyWhat'); if (k && k.textContent !== key) k.textContent = key;
    const b = $('leftBtn'); if (b) b.dataset.mode = mode;
  }

  // ================================================================ the frame loop and input (as Network Builder 3D)
  function setOverview(on) { overview = on; view?.setFit(on ? MAPW : 19); $('mapBtn').textContent = on ? 'Walk (M)' : 'Map (M)'; }
  let last = 0;
  function frame(ts) { requestAnimationFrame(frame); tick(ts); }
  function tick(ts) {
    clock = Math.max(clock, ts / 1000);
    holdTick();
    const dt = last ? Math.max(0, Math.min(0.1, (ts - last) / 1000)) : 0.016; last = Math.max(last, ts);
    if (!view) return;
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
    if (stick) { dx = stick.x; dy = stick.y; }
    const len = Math.hypot(dx, dy);
    moving = len > 0.15;
    if (moving) {
      [dx, dy] = view.rotateInput(dx / Math.max(1, len), dy / Math.max(1, len));
      const sp = SPEED * dt, nx = pos.x + dx * sp, ny = pos.y + dy * sp;
      if (free(nx, ny)) { pos.x = nx; pos.y = ny; } else if (free(nx, pos.y)) pos.x = nx; else if (free(pos.x, ny)) pos.y = ny;
      pos.face = Math.atan2(dx, dy);
    }
    tickNo++;
    moveItems(dt);
    updateOutline(ts);
    updateGuide(ts);
    hint();
    const K = M && KIND[M.m.kind]; K?.tick?.(dt);
    const mine = K?.myHands?.();   // posed flags when sending, the usual grabbing hands otherwise
    me.update(dt, { x: pos.x, y: pos.y, face: pos.face, moving, hands: mine ? mine.map(d => ({ dir: d })) : [0, 0].map(() => ({ down: hand.down || !!hand.item, hold: hand.item ? 'dev' : null })) }, true);
    placeFlags(me, myFlags, mine);
    view.follow(pos.x, overview || !(M && M.m.kind === 'read') ? pos.y : pos.y - 2.6);   // looking up the room, so the signaller on the stage stays in view
    view.render(dt);
  }
  const typing = e => /input|select|textarea/i.test(e.target?.tagName || '');
  document.addEventListener('keydown', e => {
    const k = e.code;
    if (typing(e)) return;
    if (!$('cardWrap').hidden) { if (k === 'Escape') $('cardWrap').hidden = true; return; }
    if (k === 'Space') { e.preventDefault(); if (e.repeat) return; setHand(true); }
    if (k === 'KeyM') { setOverview(!overview); return; }
    if (k.startsWith('Arrow')) e.preventDefault();
    keys.add(k);
  });
  document.addEventListener('keyup', e => {
    const k = e.code; keys.delete(k);
    if (typing(e)) return;
    if (k === 'Space') { e.preventDefault(); setHand(false); }
  });
  const focusMsg = $('focusMsg');
  const showFocus = () => { const has = document.hasFocus(); focusMsg.hidden = has; if (!has) keys.clear(); };
  focusMsg.addEventListener('click', () => { window.focus(); focusMsg.hidden = true; container.focus?.(); });
  addEventListener('focus', showFocus); addEventListener('blur', showFocus);
  document.addEventListener('pointerdown', () => { if (!document.hasFocus()) window.focus(); });
  try { window.focus(); } catch (e) { }
  setTimeout(showFocus, 300);
  document.addEventListener('focusin', e => { if (typing(e)) { keys.clear(); stick = null; const kn = $('knob'); if (kn) kn.style.transform = ''; } });
  addEventListener('blur', () => { keys.clear(); setHand(false); });
  container.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) setHand(true); });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0) setHand(false); });
  container.addEventListener('contextmenu', e => e.preventDefault());
  { const b = $('leftBtn'); b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); setHand(true); }); b.addEventListener('pointerup', () => setHand(false)); b.addEventListener('pointercancel', () => setHand(false)); }
  $('mapBtn').addEventListener('click', () => setOverview(!overview));
  // a question must never stay scrolled out of sight: a moment after the sheet stops scrolling, it comes back
  { let st = 0; $('mission').addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => {
    const t = $('mission'), q = t.querySelector('.ask'); if (!q) return;
    const box = t.getBoundingClientRect(), r = q.getBoundingClientRect();
    if (r.bottom < box.top + 40 || r.top > box.bottom - 40) q.scrollIntoView({ block: 'center' });
  }, 1500); }); }
  {
    const st = $('stick'), knob = $('knob');
    const at = e => { const r = st.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } stick = { x, y }; knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`; };
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); at(e); });
    st.addEventListener('pointermove', e => { if (stick) at(e); });
    const end = () => { stick = null; knob.style.transform = ''; };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  }

  let first = 0;
  while (first < MISSIONS.length - 1 && done[MISSIONS[first].id]) first++;
  const q = new URLSearchParams(location.search).get('mission'), qi = MISSIONS.findIndex(x => x.id === q);
  if (qi >= 0) start(qi); else if (lessonMode.on) startLesson(); else start(first);
  requestAnimationFrame(frame);
  if (/[?&]debug/.test(location.search)) window.__lab = {
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, POSE, LETTER_OF, figSvg,
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
