// Robot Lab 3D: Year 2 programming (week 2, Same but Different, with a recap of week 1, Giving instructions) in the lab
// of Network Builder 3D. A floor robot stands on a 5 by 5 mat. Pupils carry arrow cubes (forward, back, turn left,
// turn right) into numbered program boxes and press GO: the robot does box 1, then box 2, and so on. Recap missions
// give one or two instructions at a time; the week 2 missions give four arrows and ask for different orders (a flag
// marks where each order stops), then an order that reaches the star.
//
// The engine (controls, guide arrow, What just happened card, mission sheet, lesson mode, Walk me through it) is a fork
// of CpuLab3D/main.js; room.js, blob.js, devices.js, cubes.js and three.js are shared by import.
// Progress: 'bc-robot3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'robotlab3d'.
// The robot moves in the picture only: a round never waits for an animation frame (a hidden iframe has none).
import * as THREE from 'three';
import { create } from './room.js';
import { createBlob } from './blob.js';
import { makeCube, makeCard, makePad, makeBody, floorBar, sign, PAD_H, CUBE, GAP } from './cubes.js';

const $ = id => document.getElementById(id);
const HOLD_OUT = 0.75, T = 100, SPEED = 5.5, NEED = 2, HOLD = 0.25;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, attrs, html) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) k === 'class' ? n.className = v : n.setAttribute(k, v); if (html != null) n.innerHTML = html; return n; };
const btn = (label, cls, fn) => { const b = el('button', { type: 'button', class: cls === 'go' ? 'btn' : 'btn secondary' }, label); b.addEventListener('click', fn); return b; };

// ================================================================ the floor robot (a pure model, so it can be tested)
// The mat is 5 squares by 5. The robot stands on a square facing one way: 0 away from you (up the mat), 1 right,
// 2 towards you, 3 left. Forward and back move one square; turn left and turn right turn on the spot.
const N = 5;
const ARROWS = ['F', 'B', 'L', 'R'];
const ARROW_NAME = { F: 'forward', B: 'back', L: 'turn left', R: 'turn right' };
const ARROW_DO = { F: 'goes forward one square', B: 'goes back one square', L: 'turns left. It stays on the same square', R: 'turns right. It stays on the same square' };
const MOVE = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const FACING = ['up the mat', 'to the right', 'down the mat', 'to the left'];
// one instruction: the new place, and bump when the robot would leave the mat (it stays where it is)
function stepRobot(at, c) {
  if (c === 'L') return { x: at.x, y: at.y, d: (at.d + 3) % 4 };
  if (c === 'R') return { x: at.x, y: at.y, d: (at.d + 1) % 4 };
  const [dx, dy] = MOVE[at.d], k = c === 'F' ? 1 : -1, x = at.x + dx * k, y = at.y + dy * k;
  if (x < 0 || y < 0 || x >= N || y >= N) return { x: at.x, y: at.y, d: at.d, bump: true };
  return { x, y, d: at.d };
}
// every place the robot is in, from the start to the end of the program
function runRobot(start, prog) { const poses = [{ ...start }]; for (const c of prog) poses.push(stepRobot(poses[poses.length - 1], c)); return poses; }
const endOf = (start, prog) => { const p = runRobot(start, prog); const e = p[p.length - 1]; return { x: e.x, y: e.y, d: e.d }; };
const sameSquare = (a, b) => a && b && a.x === b.x && a.y === b.y;
const sqKey = a => a.x + ',' + a.y;
// every different order of some arrows (at most 24)
function orders(list) {
  if (list.length <= 1) return [list.slice()];
  const out = new Set();
  list.forEach((c, i) => { for (const rest of orders(list.slice(0, i).concat(list.slice(i + 1)))) out.add([c].concat(rest).join('')); });
  return [...out].map(s => s.split(''));
}
function randomStart() { return { x: rnd(0, N - 1), y: rnd(0, N - 1), d: rnd(0, 3) }; }
// recap rounds: a star the robot can reach, with at least one turn on the way
function recapRound(minD, maxD) {
  for (let t = 0; t < 400; t++) {
    const start = randomStart(), star = { x: rnd(0, N - 1), y: rnd(0, N - 1) };
    const dx = star.x - start.x, dy = star.y - start.y, dist = Math.abs(dx) + Math.abs(dy);
    if (dist < minD || dist > maxD || !dx || !dy) continue;
    return { start, star, key: sqKey(start) + start.d + '>' + sqKey(star) };
  }
  return { start: { x: 1, y: 4, d: 0 }, star: { x: 3, y: 2 }, key: 'fixed' };
}
// the first lesson round is always the same: two forwards, a turn right, a forward
function meetRound() { return { start: { x: 1, y: 4, d: 0 }, star: { x: 2, y: 2 }, script: ['F', 'F', 'R', 'F'], key: 'meet' }; }
// the four arrows the class is given, and a start where every order stays on the mat
const ARROW_SETS = [['F', 'F', 'F', 'R'], ['F', 'F', 'F', 'L'], ['F', 'F', 'R', 'L'], ['F', 'F', 'R', 'R'], ['F', 'F', 'L', 'L'], ['F', 'B', 'F', 'R']];
function trayRound(o = {}) {
  for (let t = 0; t < 600; t++) {
    const given = shuffle(pick(ARROW_SETS)), start = randomStart(), all = orders(given);
    const ends = all.map(p => ({ p, end: endOf(start, p), bump: runRobot(start, p).some(q => q.bump) }));
    if (ends.some(e => e.bump)) continue;
    const places = new Set(ends.map(e => sqKey(e.end)));
    if (places.size < 3) continue;
    const r = { start, given, key: given.join('') + sqKey(start) + start.d };
    if (o.star) {
      // a star that only some orders reach, never the start square
      const counts = {}; ends.forEach(e => { counts[sqKey(e.end)] = (counts[sqKey(e.end)] || 0) + 1; });
      const good = ends.filter(e => !sameSquare(e.end, start) && counts[sqKey(e.end)] * 3 <= ends.length);
      if (!good.length) continue;
      const g = pick(good);
      r.star = { x: g.end.x, y: g.end.y }; r.answer = g.p; r.key += '>' + sqKey(r.star);
    }
    return r;
  }
  return { start: { x: 1, y: 4, d: 0 }, given: ['F', 'F', 'R', 'F'], star: o.star ? { x: 2, y: 2 } : undefined, answer: ['F', 'F', 'R', 'F'], key: 'fixed' };
}

// ---- pictures for the mission sheet: an arrow, and the mat seen from above
const ARROW_PATH = {
  F: 'M12 3 L20 12 H15 V21 H9 V12 H4 Z',
  B: 'M12 21 L20 12 H15 V3 H9 V12 H4 Z',
  L: 'M4 9 L11 3 V7 H15 Q20 7 20 13 V21 H15 V13 Q15 12 14 12 H11 V16 Z',
  R: 'M20 9 L13 3 V7 H9 Q4 7 4 13 V21 H9 V13 Q9 12 10 12 H13 V16 Z'
};
const ARROW_COL = { F: '#2b8a3e', B: '#c92a2a', L: '#1971c2', R: '#e8590c' };
const arrowSvg = (c, size = 22) => '<svg class="ra-ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-label="' + ARROW_NAME[c] + '"><rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="' + ARROW_COL[c] + '"/><path d="' + ARROW_PATH[c] + '" fill="#fff"/></svg>';
const arrowWord = c => arrowSvg(c) + ' <b>' + ARROW_NAME[c] + '</b>';
const progHtml = prog => '<span class="ra-prog">' + prog.map((c, i) => '<span class="ra-box"><i>' + (i + 1) + '</i>' + (c ? arrowSvg(c, 26) : '') + '</span>').join('') + '</span>';
const FLAG_COL = ['#e03131', '#1971c2', '#9c36b5'];
const FLAG_NAME = ['red', 'blue', 'purple'];
// the mat from above: the robot as a triangle pointing the way it faces, the star, the start and any flags
function matSvg(o) {
  const S = 30, W = N * S;
  let s = '<svg class="ra-mat" viewBox="-2 -2 ' + (W + 4) + ' ' + (W + 4) + '" width="' + (W + 4) + '" height="' + (W + 4) + '" aria-label="The mat from above">';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) s += '<rect x="' + x * S + '" y="' + y * S + '" width="' + S + '" height="' + S + '" fill="' + ((x + y) % 2 ? '#fff3bf' : '#e7f5ff') + '" stroke="#495057" stroke-width="1.5"/>';
  if (o.start) s += '<rect x="' + (o.start.x * S + 2) + '" y="' + (o.start.y * S + 2) + '" width="' + (S - 4) + '" height="' + (S - 4) + '" fill="none" stroke="#2b8a3e" stroke-width="3" stroke-dasharray="4 3"/>';
  if (o.star) { const cx = o.star.x * S + S / 2, cy = o.star.y * S + S / 2, p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 5 : 12, a = -Math.PI / 2 + i * Math.PI / 5; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } s += '<polygon points="' + p.join(' ') + '" fill="#fcc419" stroke="#e67700" stroke-width="1.5"/>'; }
  (o.flags || []).forEach((f, i) => { const cx = f.x * S + 6 + i * 7, cy = f.y * S + 5; s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="' + (cy + 20) + '" stroke="#343a40" stroke-width="2"/><polygon points="' + cx + ',' + cy + ' ' + (cx + 10) + ',' + (cy + 4) + ' ' + cx + ',' + (cy + 8) + '" fill="' + FLAG_COL[i] + '"/>'; });
  if (o.robot) { const r = o.robot, cx = r.x * S + S / 2, cy = r.y * S + S / 2; s += '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + r.d * 90 + ')"><circle r="10" fill="#fab005" stroke="#212529" stroke-width="2"/><polygon points="0,-13 6,-4 -6,-4" fill="#212529"/></g>'; }
  return s + '</svg>';
}

// ================================================================ missions
const MISSIONS = [
  { id: 'meet-t', group: 'Giving instructions', title: 'Meet the Robot', type: 'tutorial', kind: 'robot', boxes: 1, supply: 'crates', keep: true, mins: 6,
    intro: 'This robot does what the arrows say. Put one arrow in the box. Press GO.',
    gen: meetRound,
    after: { q: 'What does turn right do?', options: ['The robot turns. It stays on the same square.', 'The robot moves one square to the right.', 'The robot goes back to the start.'], why: 'A turn does not move the robot. It only changes the way it faces.' } },
  { id: 'one-t', group: 'Giving instructions', title: 'One at a Time', type: 'tutorial', kind: 'robot', boxes: 1, supply: 'crates', keep: true, mins: 6,
    intro: 'Get the robot to the star. Give one instruction at a time: one arrow, then GO.',
    gen: () => recapRound(2, 3) },
  { id: 'two-t', group: 'Giving instructions', title: 'Two at a Time', type: 'tutorial', kind: 'robot', boxes: 2, supply: 'crates', keep: true, mins: 7,
    intro: 'Now give two instructions at a time. Put an arrow in box 1 and box 2, then press GO.',
    gen: () => recapRound(3, 4),
    after: { q: 'Instructions in order, one after another, are called a...', options: ['sequence', 'star', 'mat'], why: 'A sequence is instructions in order. The robot does box 1, then box 2.' } },
  { id: 'same-t', group: 'Same but different', title: 'Same Arrows, New Order', type: 'tutorial', kind: 'robot', boxes: 4, supply: 'tray', orders: 2, mins: 8,
    intro: 'Use these four arrows. Put them in the boxes and press GO. Then use the same arrows in a different order.',
    gen: () => trayRound(),
    after: { q: 'The arrows were the same. Why can the robot stop on a different square?', options: ['The arrows were in a different order.', 'The robot started on a different square.', 'We used different arrows.'], why: 'The order changes the algorithm. A different order can send the robot somewhere else.' } },
  { id: 'star-t', group: 'Same but different', title: 'Find the Star', type: 'tutorial', kind: 'robot', boxes: 4, supply: 'tray', goal: 'star', mins: 7,
    intro: 'Use all four arrows. Only some orders get the robot to the star. Try an order and press GO.',
    gen: () => trayRound({ star: true }) },
  { id: 'star-c', group: 'Same but different', title: 'Star Challenge', type: 'challenge', kind: 'robot', boxes: 4, supply: 'tray', goal: 'star', mins: 8,
    intro: 'Think first, then press GO. The robot must reach the star the first time. Two in a row.',
    gen: () => trayRound({ star: true }) },
  { id: 'three-c', group: 'Same but different', title: 'Three Different Orders', type: 'challenge', kind: 'robot', boxes: 4, supply: 'tray', orders: 3, need: 1, mins: 8,
    intro: 'Make three different algorithms with the same four arrows. Then count the squares where the robot stopped.',
    gen: () => trayRound() }
];
export { MISSIONS };
const SECTIONS = ['Giving instructions', 'Same but different'];
// Lesson mode: Year 2 week 2, Same but Different, starting with a short recap of week 1 (giving instructions)
const LESSONS = [
  { id: 'week2', title: 'Week 2: Same but Different', missions: ['meet-t', 'one-t', 'two-t', 'same-t', 'star-t', 'star-c'], ext: ['three-c'] }
];
const minsOf = m => m.mins || 6;


// ================================================================ saving and results
const STORE = 'bc-robot3d-v1:';
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
  const log = results('robotlab3d', 'Robot Lab 3D');
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
  function itemMesh(it) { it.k3 = it.arrow ? makeArrowCube(it.sym) : it.card ? makeCard(it.text) : makeCube(it.sym, it.role); worldG.add(it.k3.group); }
  function addItem(slot, it) { it.id = it.id || 'i' + nextId++; if (!it.k3) itemMesh(it); slot.items.push(it); it.slot = slot; snapItem(it); return it; }
  function killItem(it) { if (!it || !it.k3) return; worldG.remove(it.k3.group); it.k3.dispose(); it.k3.group.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); it.k3 = null; }
  function cube(sym, extra) { return Object.assign({ sym: String(sym), role: 'arrow' }, extra || {}, { arrow: true }); }
  const top = s => s.items[s.items.length - 1];
  function itemTarget(it) {
    if (it === hand.item) {
      const hx = pos.x + Math.sin(pos.face) * HOLD_OUT, hy = pos.y + Math.cos(pos.face) * HOLD_OUT;   // held clear of the body: the cube is wider than the reach point
      return new THREE.Vector3((hx + 0.5) * T, it.card ? 30 : 70, (hy + 0.5) * T);
    }
    const s = it.slot, k = s.items.indexOf(it);
    if (s.grow === 'right') return new THREE.Vector3((s.x + k + 0.5) * T, PAD_H + CUBE / 2 + 2, (s.y + 0.5) * T);
    if (it.card) return new THREE.Vector3((s.x + s.w / 2) * T + (s.grow === 'pile' ? k * 10 : 0), PAD_H + (s.grow === 'pile' ? k * 18 : 0), (s.y + 0.5) * T);
    return new THREE.Vector3((s.x + s.w / 2) * T, PAD_H + CUBE / 2 + 2 + k * GAP, (s.y + 0.5) * T);
  }
  function snapItem(it) { if (it.k3) { it.k3.group.position.copy(itemTarget(it)); it.k3.group.rotation.y = 0; } }
  function moveItems(dt) {
    const k = Math.min(1, dt * 14);
    // placed cubes square up to face the camera, so a + never reads as a times sign
    for (const s of slots) for (const it of s.items) if (it.k3) { const g = it.k3.group; g.position.lerp(itemTarget(it), k); g.rotation.y += (Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2 - g.rotation.y) * k; }
    if (hand.item && hand.item.k3) { hand.item.k3.group.position.lerp(itemTarget(hand.item), Math.min(1, dt * 24)); hand.item.k3.group.rotation.y = pos.face; }
    robotTick(dt);
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
      if (o.userData.ownMat) [].concat(o.material).forEach(mm => { mm.map?.dispose?.(); mm.dispose(); });   // the mat has a material for each side
      if (o.isSprite) { o.material.map?.dispose?.(); o.material.dispose(); }
    });
    for (const s of slots) for (const it of s.items) it.k3?.dispose();
    if (hand.item) hand.item.k3?.dispose();
  }
  function newWorld(w, h, name) {
    if (!view) { view = create(container); scene = view.scene; scene.add(me.group, arrows, pulse, outlineG); }
    disposeWorld();
    slots = []; blocks = []; hand.item = null; hand.from = null; hand.pending = null; hand.sticky = false; hand.tapDrop = false; guideKey = ''; routeKey = ''; outlineKey = '';
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
  function newRound(after) {
    const m = M.m;
    let p = m.gen();
    // a challenge never repeats the round just played
    if (m.type === 'challenge') for (let k = 0; k < 20 && M.lastKey && keyOf(p) === M.lastKey; k++) p = m.gen();
    M.lastKey = keyOf(p);
    R = { p, over: false, spoilt: false, ask: null, notes: [], moves: 0, why: null };
    KIND[m.kind].setup(R, m);
    view.zoom?.(1600, 0.95);   // far enough back to see the boxes and the whole mat
    pos.face = Math.PI; view.jump(camX(), pos.y - camAhead());
    toast(''); explainReset();
    if (after) { explain('Not this time. ' + after + ' A new round has started.'); R.why = after; toast('A mistake, so a new round has started. ' + after, 'bad'); }
    explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  // look a little ahead of the player, so the mat at the back is not under the card at the top
  const camAhead = () => Math.min(3, Math.max(0, pos.y - 7));
  const camX = () => 12 + (pos.x - 12) * 0.3;   // mostly fixed between the boxes and the mat, so the whole mat stays in view
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
  // a mistake in a challenge ends that round (it could no longer count) and starts a new one, with the reason shown
  function mistake(msg) {
    log.add(M.m.title + ': ' + msg.replace(/<[^>]+>/g, ''), false);
    if (M.m.type === 'challenge') { R.why = msg; R.spoilt = true; R.over = true; M.have = 0; M.spoilt++; newRound(msg); return; }
    R.why = msg; toast(msg, 'bad'); explain('Not this time. ' + msg); drawAll();
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
    const L = lessonMode.on && LESSONS.find(x => x.id === lessonMode.id);   // in lesson mode the lesson's own activities finish it
    if (L ? L.missions.every(x => done[x]) : MISSIONS.every(x => done[x.id])) log.finish();
    toast('Mission complete!', 'good');
  }

  // ---------------------------------------------------------------- the floor robot on its mat
  // The mat is on the right, fenced off: 5 by 5 squares, each square 2 by 2 tiles. On the left: the arrow crates (or
  // a tray of the four arrows to use), the numbered program boxes and the big GO pad. GO runs the boxes in order.
  const KIND = {};
  const MX = 13, MY = 2, SQ = 2;   // the mat's top left tile and the size of a square in tiles
  const sqWorld = (x, y) => [(MX + x * SQ + SQ / 2) * T, (MY + y * SQ + SQ / 2) * T];
  function own(mesh) { mesh.userData.own = true; mesh.userData.ownMat = true; return mesh; }
  function std(col, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: 0.5 }, o || {})); }
  // an arrow cube: a coloured cube with a white arrow on every side, the same pictures as the mission sheet
  const arrowTex = {};
  function arrowTexture(c) {
    if (arrowTex[c]) return arrowTex[c];
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.fillStyle = ARROW_COL[c]; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228);
    g.save(); g.translate(28, 28); g.scale(200 / 24, 200 / 24); g.fillStyle = '#fff'; g.fill(new Path2D(ARROW_PATH[c])); g.restore();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return (arrowTex[c] = t);
  }
  const arrowGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  // the top face shows the arrow as the robot would see it on the mat (forward points away from you)
  function makeArrowCube(c) {
    const side = new THREE.MeshStandardMaterial({ map: arrowTexture(c), roughness: 0.45, emissive: ARROW_COL[c], emissiveIntensity: 0 });
    const m = new THREE.Mesh(arrowGeo, side); m.castShadow = true;
    const group = new THREE.Group(); group.add(m);
    return { group, mat: side, setGlow(on) { side.emissiveIntensity = on ? 0.35 : 0; }, dispose() { side.dispose(); } };
  }
  // the robot: a round yellow body with black stripes and two big eyes on the front (the way it faces)
  function makeRobot() {
    const g = new THREE.Group();
    const body = own(new THREE.Mesh(new THREE.SphereGeometry(62, 28, 18), std(0xfab005, { roughness: 0.35 }))); body.scale.set(1, 0.62, 1.15); body.position.y = 46; body.castShadow = true; g.add(body);
    for (const z of [-14, 22]) { const st = own(new THREE.Mesh(new THREE.TorusGeometry(58, 7, 8, 32), std(0x212529))); st.scale.set(1.03, 0.64, 1); st.position.set(0, 46, z); g.add(st); }
    for (const x of [-24, 24]) {
      const eye = own(new THREE.Mesh(new THREE.SphereGeometry(17, 16, 12), std(0xffffff, { roughness: 0.2 }))); eye.position.set(x, 62, -62); g.add(eye);
      const pupil = own(new THREE.Mesh(new THREE.SphereGeometry(8, 12, 10), std(0x111111))); pupil.position.set(x, 63, -76); g.add(pupil);
    }
    const nose = own(new THREE.Mesh(new THREE.ConeGeometry(14, 34, 12), std(0x212529))); nose.rotation.x = -Math.PI / 2; nose.position.set(0, 30, -82); g.add(nose);
    for (const x of [-46, 46]) { const w = own(new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 12, 16), std(0x343a40))); w.rotation.z = Math.PI / 2; w.position.set(x, 16, 0); g.add(w); }
    return g;
  }
  function makeFlag(i) {
    const g = new THREE.Group();
    const pole = own(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 150, 8), std(0x343a40))); pole.position.y = 75; g.add(pole);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(60, -20); shape.lineTo(0, -40); shape.lineTo(0, 0);
    const cloth = own(new THREE.Mesh(new THREE.ShapeGeometry(shape), std(new THREE.Color(FLAG_COL[i]), { side: THREE.DoubleSide }))); cloth.position.y = 150; g.add(cloth);
    return g;
  }
  function makeStar() {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 26 : 62, a = Math.PI / 2 + i * Math.PI / 5; i ? shape.lineTo(r * Math.cos(a), r * Math.sin(a)) : shape.moveTo(r * Math.cos(a), r * Math.sin(a)); }
    const m = own(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 14, bevelEnabled: false }), std(0xfcc419, { emissive: 0xf08c00, emissiveIntensity: 0.35 })));
    m.rotation.x = -Math.PI / 2; m.position.y = 6; return m;
  }
  function matMesh(start) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1000; const g = cv.getContext('2d'), S = 200;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = (x + y) % 2 ? '#fff3bf' : '#e7f5ff'; g.fillRect(x * S, y * S, S, S); }
    g.strokeStyle = '#343a40'; g.lineWidth = 8; for (let k = 0; k <= N; k++) { g.beginPath(); g.moveTo(k * S, 0); g.lineTo(k * S, 1000); g.stroke(); g.beginPath(); g.moveTo(0, k * S); g.lineTo(1000, k * S); g.stroke(); }
    // the start square: a green dashed border and the word START
    g.strokeStyle = '#2b8a3e'; g.lineWidth = 14; g.setLineDash([26, 16]); g.strokeRect(start.x * S + 16, start.y * S + 16, S - 32, S - 32); g.setLineDash([]);
    g.fillStyle = '#2b8a3e'; g.font = '800 34px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.fillText('START', start.x * S + S / 2, start.y * S + S - 30);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = own(new THREE.Mesh(new THREE.BoxGeometry(N * SQ * T, 8, N * SQ * T), [std(0x495057), std(0x495057), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }), std(0x495057), std(0x495057), std(0x495057)]));
    m.position.set((MX + N * SQ / 2) * T, 4, (MY + N * SQ / 2) * T); m.receiveShadow = true;
    m.userData.own = true; return m;
  }
  function placeRobot(g, at) { const [wx, wz] = sqWorld(at.x, at.y); g.position.set(wx, 8, wz); g.rotation.y = -at.d * Math.PI / 2; }
  // the robot moves in the picture while the round goes on; nothing waits for the picture (a hidden page draws no frames)
  const STEP_S = 0.7;
  // the robot is moving until its time is up, frames or not
  const busy = () => !!(R && R.anim && performance.now() < R.anim.endAt);
  function robotTick(dt) {
    const a = R && R.anim; if (!a || !R.robotG) return;
    a.t += dt;
    const k = Math.min(a.poses.length - 1, a.t / STEP_S), i = Math.floor(k), f = k - i, p = a.poses[i], q = a.poses[Math.min(i + 1, a.poses.length - 1)];
    const [x0, z0] = sqWorld(p.x, p.y), [x1, z1] = sqWorld(q.x, q.y), e = f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
    let r0 = -p.d * Math.PI / 2, r1 = -q.d * Math.PI / 2; if (r1 - r0 > Math.PI) r1 -= Math.PI * 2; if (r0 - r1 > Math.PI) r1 += Math.PI * 2;
    R.robotG.position.set(x0 + (x1 - x0) * e, 8 + (q.bump ? Math.sin(f * Math.PI) * 18 : 0), z0 + (z1 - z0) * e);
    R.robotG.rotation.y = r0 + (r1 - r0) * e;
    R.box.forEach((s, k) => { if (k === i && i < a.poses.length - 1) lightBox(s); else unlightBox(s); });
    if (a.t >= (a.poses.length - 1) * STEP_S + 0.2) { placeRobot(R.robotG, a.poses[a.poses.length - 1]); R.anim = null; for (const s of R.box) unlightBox(s); }
  }
  function lightBox(s) { s.items.forEach(it => it.k3?.setGlow(true)); }
  function unlightBox(s) { s.items.forEach(it => it.k3?.setGlow(false)); }
  const progOf = () => R.box.map(s => s.items.length ? top(s).sym : null);
  function trayFill() {
    for (const s of R.box) { s.items.forEach(killItem); s.items = []; }
    for (const s of R.tray) { s.items.forEach(killItem); s.items = []; }
    R.p.given.forEach((c, i) => addItem(R.tray[i], cube(c)));
  }
  function putFlag(i, at) { const f = makeFlag(i); const [wx, wz] = sqWorld(at.x, at.y); f.position.set(wx - 50 + i * 30, 8, wz - 40); worldG.add(f); }
  // GO: the robot does the arrows in the boxes, in order
  function pressGo() {
    const m = M.m, prog = progOf();
    if (busy()) { toast('Wait for the robot to stop.', 'hint'); return; }
    if (prog.some(c => !c)) { toast(m.boxes === 1 ? 'Put an arrow in the box first.' : 'Put an arrow in every box first.', 'hint'); return; }
    if (R.script) { const want = R.script[R.runs.length]; if (prog[0] !== want) { toast('Put ' + ARROW_NAME[want] + ' in the box first.', 'hint'); return; } }
    if (m.orders && R.runs.some(r => r.prog.join('') === prog.join(''))) { toast('You used that order before. Swap two arrows to make a new order.', 'hint'); return; }
    const from = m.keep ? R.robot : R.p.start, poses = runRobot(from, prog), end = poses[poses.length - 1];
    R.anim = { poses, t: 0, from: 0, endAt: performance.now() + (poses.length - 1) * STEP_S * 1000 + 200 }; if (!m.keep && R.robotG) placeRobot(R.robotG, R.p.start);
    R.robot = { x: end.x, y: end.y, d: end.d }; R.moves++;
    const said = prog.map((c, i) => 'Box ' + (i + 1) + ': the robot ' + ARROW_DO[c] + (poses[i + 1].bump ? ' (it bumped the edge of the mat and stayed still)' : '') + '.').join(' ');
    R.runs.push({ prog, end: R.robot });
    explain(said);
    const atStar = R.p.star && sameSquare(R.robot, R.p.star);
    if (m.orders) {
      putFlag(R.runs.length - 1, R.robot);
      explain('The robot stopped under the ' + FLAG_NAME[R.runs.length - 1] + ' flag. ' + (R.runs.length < m.orders ? 'Now put the same arrows in a different order.' : ''));
      trayFill();
      if (R.runs.length >= m.orders) askPlaces();
      return;
    }
    if (m.keep) {
      if (atStar) { explain('The robot is on the star!'); finishRound('The robot reached the star.'); }
      else if (R.script && R.runs.length === 2) explain('Now change the arrow. Take forward out and put turn right in.');
      return;
    }
    // the star rounds: the robot goes back to the start for every try
    if (atStar) { explain('The robot reached the star! Your order: ' + prog.map(c => ARROW_NAME[c]).join(', ') + '.'); finishRound('The robot reached the star.'); return; }
    const miss = 'The robot stopped on the wrong square. The order was ' + prog.map(c => ARROW_NAME[c]).join(', ') + '.';
    if (m.type === 'challenge') { mistake(miss + ' Think about where each arrow takes the robot.'); return; }
    R.misses++; R.helped = true; trayFill();
    toast('Not the star. Try a different order. The arrow now shows one that works.', 'hint');
    explain(miss + ' The arrows go back to the tray. Try a different order.');
  }
  function askPlaces() {
    const places = new Set(R.runs.map(r => sqKey(r.end))).size, m = M.m;
    if (m.orders === 2) {
      const same = places === 1, opts = ['No, on different squares.', 'Yes, on the same square.'];
      R.ask = { type: 'choice', plain: true, q: 'Look at the red flag and the blue flag. Did the robot stop on the same square both times?', options: opts, answer: same ? opts[1] : opts[0], wide: true,
        hint: 'Look at the two flags on the mat.', why: same ? 'Both flags are on the same square.' : 'The flags are on different squares.',
        done: () => { explain(same ? 'This time both orders ended on the same square. Often a new order ends somewhere new.' : 'Same arrows, different order, different square. The order matters.'); finishRound('You made two different algorithms with the same arrows.'); } };
    } else {
      R.ask = { type: 'num', plain: true, q: 'How many different squares did the robot stop on? Count the squares with flags.', answer: places,
        hint: 'Count the squares, not the flags. Two flags on one square count as one square.', why: 'The robot stopped on ' + places + ' different square' + (places === 1 ? '' : 's') + '.',
        done: () => { explain('Three algorithms, the same arrows: the robot stopped on ' + places + ' different square' + (places === 1 ? '' : 's') + '.'); finishRound('Three different orders.'); } };
    }
  }
  KIND.robot = {
    start(m, p) { return m.keep ? 'The robot is on the START square. It faces ' + FACING[p.start.d] + '.' : 'The robot starts on START, facing ' + FACING[p.start.d] + '. Use the four arrows in the tray.'; },
    setup(R, m) {
      const p = R.p; R.runs = []; R.misses = 0; R.helped = false; R.anim = null; R.robot = { ...p.start }; R.script = p.script || null;
      newWorld(24, 15, 'The robot lab');
      worldG.add(matMesh(p.start));
      blocks.push([MX - 1, MY - 1, MX + N * SQ, MY + N * SQ]);
      R.robotG = makeRobot(); placeRobot(R.robotG, p.start); worldG.add(R.robotG);
      if (p.star) { const st = makeStar(), [wx, wz] = sqWorld(p.star.x, p.star.y); st.position.x = wx; st.position.z = wz; worldG.add(st); }
      addSign('THE MAT', MX + N * SQ / 2, MY - 1, 330, { bg: '#fab005', ink: '#1a1200', size: 0.05 });
      // the program boxes, numbered, and GO
      const x0 = m.boxes === 1 ? 5 : m.boxes === 2 ? 4 : 2;
      R.box = Array.from({ length: m.boxes }, (_, i) => {
        const s = addSlot({ role: 'box', pad: 'rail', x: x0 + i * 2, y: 6, label: String(i + 1), tag: { tagY: 150, tagSize: 0.08, tagBg: '#1864ab' },
          put: (it, from) => {
            if (from === s) return null;
            if (s.items.length) return { msg: 'That box is full. Take that arrow out first.' };
            if (busy()) return { msg: 'Wait for the robot to stop.' };
            if (R.script) { const want = R.script[R.runs.length]; if (it.sym !== want) return { msg: 'Not this arrow yet. Use ' + ARROW_NAME[want] + '.' }; }
            if (R.helped && R.p.answer) { const k = R.box.indexOf(s), want = R.p.answer[k]; if (it.sym !== want) return { msg: 'Box ' + (k + 1) + ' needs ' + ARROW_NAME[want] + '.' }; }
            return null;
          } });
        return s;
      });
      addSign(m.boxes === 1 ? 'PROGRAM BOX' : 'PROGRAM BOXES: 1 IS FIRST', x0 + (m.boxes - 1), 5, 260, { bg: '#1864ab', ink: '#ffffff', size: 0.04 });
      R.go = addSlot({ role: 'go', pad: 'answer', x: 10, y: 6, label: 'GO', tag: { tagY: 150, tagSize: 0.08, tagBg: '#2b8a3e' }, press: () => pressGo(), pressText: 'to press GO. The robot does the arrows in order.' });
      if (m.supply === 'crates') {
        R.crate = {};
        ['F', 'B', 'L', 'R'].forEach((c, i) => { R.crate[c] = addSlot({ role: 'crate', pad: 'crate', x: 2 + i * 2, y: 11, crate: c, label: ARROW_NAME[c].toUpperCase(), tag: { tagY: 120 } }); addItem(R.crate[c], cube(c)); });
        R.tray = [];
      } else {
        R.tray = [2, 4, 6, 8].map(x => { const s = addSlot({ role: 'tray', pad: 'supply', x, y: 11, put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null }); return s; });
        addSign('USE THESE FOUR ARROWS', 5, 10, 150, { bg: '#495057', ink: '#ffffff', size: 0.035 });
        trayFill();
      }
      pos.x = 6; pos.y = 13;
    },
    placed(it, slot) { if (slot.role === 'box') { R.everFilled = (R.everFilled || 0) + 1; explain('Box ' + (R.box.indexOf(slot) + 1) + ': ' + ARROW_NAME[it.sym] + '. The robot ' + ARROW_DO[it.sym] + '.'); } },
    check() { },
    guide(R, m) {
      if (R.ask || busy()) return null;
      const prog = progOf(), empty = R.box.find(s => !s.items.length);
      if (R.script) {
        const want = R.script[R.runs.length], b = R.box[0];
        if (hand.item) return hand.item.sym === want && !b.items.length ? slotTarget(b) : slotTarget(R.crate[hand.item.sym]);
        if (b.items.length && top(b).sym !== want) return slotTarget(b);
        return b.items.length ? slotTarget(R.go) : slotTarget(R.crate[want]);
      }
      if (R.helped && R.p.answer) {
        if (hand.item) return empty ? slotTarget(R.box.find((s, k) => !s.items.length && R.p.answer[k] === hand.item.sym) || empty) : null;
        if (!empty) return slotTarget(R.go);
        const k = R.box.indexOf(empty); return slotTarget(R.tray.find(s => s.items.length && top(s).sym === R.p.answer[k]));
      }
      if (hand.item) return empty ? (m.type === 'challenge' ? areaTarget(R.box.filter(s => !s.items.length)) : slotTarget(empty)) : null;
      if (prog.every(Boolean)) return slotTarget(R.go);
      return areaTarget(m.supply === 'crates' ? Object.values(R.crate) : R.tray.filter(s => s.items.length));
    },
    steps(R, m) {
      if (R.script) return R.script.map((c, k) => ({ text: (k && R.script[k - 1] === c ? 'Press GO again. The arrow stays in the box.' : 'Put ' + arrowWord(c) + ' in the box. Press GO.'), done: () => R.runs.length > k }));
      if (m.keep) return [
        { text: m.boxes === 1 ? 'Choose one arrow. Put it in the box.' : 'Choose two arrows. Put them in box 1 and box 2.', done: () => R.runs.length > 0 || (R.everFilled || 0) >= m.boxes },
        { text: 'Press GO. Watch the robot.', done: () => R.runs.length > 0 },
        { text: 'Change the arrows and press GO again, until the robot is on the star.', done: () => R.over }];
      if (m.orders) return [
        { text: 'Put the four arrows in the boxes, in any order.', done: () => R.runs.length > 0 || (R.everFilled || 0) >= 4 },
        { text: 'Press GO. A red flag marks where the robot stops.', done: () => R.runs.length > 0 },
        { text: 'Put the same arrows in a different order.', done: () => R.runs.length > 1 || (R.everFilled || 0) >= 8 },
        { text: 'Press GO. A blue flag marks where it stops.', done: () => R.runs.length > 1 },
        { text: 'Answer the question.', done: () => R.over }];
      return [
        { text: 'Put the four arrows in the boxes. Choose an order.', done: () => R.runs.length > 0 || (R.everFilled || 0) >= 4 },
        { text: 'Press GO. Did the robot reach the star?', done: () => R.runs.length > 0 },
        { text: 'If not, try a different order.', done: () => R.over }];
    },
    goals(m) { return m.orders ? ['Same arrows, a new order each time.', 'A turn does not move the robot.'] : ['Think first: where does each arrow take the robot?', 'A turn does not move the robot. It only turns it.']; },
    expr(R, m) {
      const flags = m.orders ? R.runs.map(r => r.end) : [];
      const prog = progOf();
      return '<div class="ra-sheet">' + matSvg({ start: R.p.start, star: R.p.star, robot: busy() ? null : R.robot, flags }) +
        '<div><b>Your program</b><br>' + progHtml(prog) + (m.supply === 'tray' ? '<br><b>Arrows to use</b><br>' + R.p.given.map(c => arrowSvg(c, 26)).join(' ') : '') +
        (m.orders && R.runs.length ? '<br><b>Your algorithms</b>' + R.runs.map((r, i) => '<br><span style="color:' + FLAG_COL[i] + '">&#9873;</span> ' + r.prog.map(c => arrowSvg(c, 18)).join('')).join('') : '') + '</div></div>' +
        '<p class="ra-key">' + ['F', 'B', 'L', 'R'].map(arrowWord).join(' &nbsp; ') + '</p>';
    },
    walk(R, m) {
      const steps = [];
      if (m.keep || R.script) {
        const p = R.script ? meetRound() : recapRound(2, 4);
        steps.push({ text: '<b>A different mat.</b> The robot faces ' + FACING[p.start.d] + '. Find the star.', visual: matSvg({ start: p.start, star: p.star, robot: p.start }) });
        let at = { ...p.start };
        for (let g = 0; g < 12 && !sameSquare(at, p.star); g++) {
          const [dx, dy] = MOVE[at.d], ahead = { x: at.x + dx, y: at.y + dy };
          const closer = Math.abs(p.star.x - ahead.x) + Math.abs(p.star.y - ahead.y) < Math.abs(p.star.x - at.x) + Math.abs(p.star.y - at.y);
          let c = 'F';
          if (!closer) { const right = stepRobot(stepRobot(at, 'R'), 'F'); c = Math.abs(p.star.x - right.x) + Math.abs(p.star.y - right.y) < Math.abs(p.star.x - at.x) + Math.abs(p.star.y - at.y) ? 'R' : 'L'; }
          at = stepRobot(at, c);
          steps.push({ text: (c === 'F' ? 'The star is ahead, so ' : 'The star is not ahead, so ') + '<span class="hl">' + ARROW_NAME[c] + '</span>. The robot ' + ARROW_DO[c] + '.', visual: matSvg({ start: p.start, star: p.star, robot: at }) });
        }
        steps.push({ text: 'Now help your robot the same way: one arrow, then look again.', visual: '' });
        return steps;
      }
      const p = trayRound({ star: !!R.p.star }), all = orders(p.given), a = pick(all), b = pick(all.filter(x => x.join('') !== a.join('')));
      steps.push({ text: '<b>Different arrows.</b> The robot starts on START, facing ' + FACING[p.start.d] + '. The arrows: ' + p.given.map(c => arrowSvg(c)).join(' '), visual: matSvg({ start: p.start, star: p.star, robot: p.start }) });
      for (const [i, prog] of (p.star ? [a, p.answer] : [a, b]).entries()) {
        const end = endOf(p.start, prog);
        steps.push({ text: 'Order ' + (i + 1) + ': ' + progHtml(prog) + ' The robot stops here' + (p.star ? (sameSquare(end, p.star) ? ': <span class="hl">on the star</span>.' : ': not on the star.') : '.'), visual: matSvg({ start: p.start, star: p.star, robot: end, flags: [end] }) });
      }
      steps.push({ text: 'Same arrows, different order, so the robot can stop somewhere else. Now try your own.', visual: '' });
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
      if (hand.tapDrop) { hand.tapDrop = false; hint(); return; }   // the end of the tap that put something down
      const p = hand.pending, tap = clock - (hand.downAt || 0) < 0.3; hand.pending = null;
      // a tap picks up (a cube already in place too) and keeps carrying until the next tap; a hold puts down on release
      if (p && tap) { const g = grabTarget(); if (g && g.slot === p.s && top(p.s) === p.it) doGrab(p.s); }
      if (hand.item && tap) { hand.sticky = true; hint(); return; }
      letGo(); hint(); return;
    }
    hand.downAt = clock;
    if (hand.item && hand.sticky) { hand.sticky = false; hand.tapDrop = true; letGo(); hint(); return; }
    if (locked()) {
      if (M && M.phase === 'play' && R && R.ask) toast('Predict first: answer on the right.', 'hint');
      else if (M && M.phase !== 'play') toast(M.phase === 'ask' ? 'Answer the question on the right first.' : 'Press the button on the mission sheet to go on.', 'hint');
      else if (R && R.over) toast('Press the button on the mission sheet to go on.', 'hint');
      return;
    }
    const g = grabTarget(); if (!g) return;
    const s = g.slot;
    if (s.risky && !s.crate && !s.press && !s.copyOut && !s.take(top(s))) { hand.pending = { s, at: clock, it: top(s) }; hint(); return; }
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
    if (s.copyOut) { const c = s.copyOut(s); if (typeof c === 'string') { toast(c, 'hint'); return; } hand.item = c; itemMesh(c); hand.from = s; hand.since = clock; R.moves++; afterChange(); return; }
    if (s.crate) { hand.item = cube(s.crate, { role: 'paren' }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
    const it = top(s), why = s.take(it);
    if (why) { toast(why, 'hint'); return; }
    s.items.pop(); hand.item = it; it.slot = null; hand.from = s; hand.since = clock; R.moves++;
    afterChange();
  }
  function letGo() {
    const it = hand.item; if (!it) return;
    const from = hand.from;
    const back = () => { hand.item = null; hand.from = null; if (from.crate || from.copyOut) killItem(it); else { from.items.push(it); it.slot = from; } };
    const s = nearestSlot(0.9, x => !x.press);
    if (!s) { back(); toast('Put it down over a pad: the glowing ring shows where.', 'hint'); afterChange(); return; }
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
  // the pupil chooses: one place gets an arrow (no ring); several get no arrow at all, because an arrow to the nearest
  // one read as a hint and was often the wrong answer (glowAll can still light every choice the same)
  function areaTarget(list) { if (!list.length) return null; if (list.length > 1) return { glowOnly: true }; const t = slotTarget(list[0]); t.exact = false; return t; }
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
    if (!g || g.glowOnly || Math.hypot(g.x - pos.x, g.y - pos.y) < g.reach + 0.2) { arrows.visible = false; arrows.count = 0; guideKey = ''; return; }
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
    missionAt = i; const m = MISSIONS[i]; openSecs.add(m.group);
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

  let lastFocus = "", logOpen = false;
  function drawPanel() {
    const t = $('mission'), m = M.m, K = KIND[m.kind];
    t.hidden = false; t.innerHTML = '';
    const inLesson = lessonMode.on && lessonList().includes(missionAt), inSec = inLesson ? lessonList().map(i => MISSIONS[i]) : MISSIONS.filter(x => x.group === m.group);
    const where = inLesson ? (LESSONS.find(x => x.id === lessonMode.id) || LESSONS[0]).title.split(':')[0] : m.group;
    t.appendChild(el('div', { class: 'head' }, '<span>' + (inLesson ? where + ': ' + m.group : m.group) + '</span><span>' + (inLesson ? (isExt(missionAt) ? 'Extension' : 'Activity') : m.type === 'tutorial' ? 'Tutorial' : 'Challenge') + ' ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + '</span>'));
    t.appendChild(el('h2', {}, m.title));
    if (done[m.id] && M.phase !== 'done') t.appendChild(el('p', { class: 'note' }, 'Done before. Play it again for practice.'));
    t.appendChild(el('p', {}, m.intro));
    t.appendChild(btn('Read it to me', '', () => { const st = m.type === 'tutorial' ? K.steps(R, m).find(x => !x.done()) : null; speak(m.intro + ' ' + (R.ask ? R.ask.q : st ? st.text : '')); }));
    t.appendChild(el('div', { class: 'cl-expr' }, K.expr(R, m)));
    if (m.type === 'tutorial') {
      const st = K.steps(R, m), ol = el('ol', { class: 'steps' });
      let now = st.findIndex(s => !s.done()); if (M.phase === 'done') now = st.length;
      st.forEach((s, i) => ol.appendChild(el('li', { class: i < now || (now < 0) ? 'done' : i === now ? 'now' : 'later' }, '<span>' + s.text + '</span>')));
      t.appendChild(ol);
    } else {
      t.appendChild(el('ul', { class: 'goals' }, K.goals(m).map(g => '<li>' + g + '</li>').join('')));
      t.appendChild(el('p', { class: 'note' }, 'The arrow shows where to go, not what to do: you decide each move. <b>' + M.have + ' of ' + (m.need || NEED) + ' clean ' + ((m.need || NEED) === 1 ? 'run' : 'rounds in a row') + '.</b>'));
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
    box.appendChild(el('p', { class: 'ask-q' }, (a.plain ? '' : '<b>Predict.</b> ') + a.q));
    const fb = el('p', { class: 'ask-fb' + (a.fb ? ' bad' : '') }, a.fb || '');
    let read;
    const row = el('div', { class: 'ask-row' });
    if (a.type === 'num') {
      const inp = el('input', { type: 'text', inputmode: 'numeric', id: 'clAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.appendChild(inp); read = () => { const v = inp.value.trim().replace(/−/g, '-'); return /^-?\d+$/.test(v) ? Number(v) : null; };
    } else if (a.type === 'choice') {
      a.order = a.order || shuffle(a.options);
      let chosen = null;
      const opts = el('div', { class: 'ask-opts' });
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
      if (M.m.type === 'challenge') { R.ask = null; mistake('You predicted ' + v + '. ' + a.why); return; }
      a.fb = 'Not quite. ' + a.hint + ' Try again.'; log.note('Predicted ' + v + ' (wrong).');
      if (a.pick) a.pick = Array(a.len).fill('?'); a.order = null;
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
  // young readers: the mission and the step you are on, read aloud
  function speak(html) { try { const u = new SpeechSynthesisUtterance(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); u.rate = 0.85; u.lang = 'en-GB'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
  function drawAll() { drawPanel(); hint(); }

  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls === 'bad' ? 'bad' : cls === 'good' ? 'good' : 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, cls === 'bad' ? 5200 : 3200); }
  function hint() {
    // what Space does right now, for what is in front of you: HOLD (pick up and carry) or PRESS (switch a lamp)
    let h, key = 'tap to grab', mode = '';
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + ARROW_NAME[s.crate] + ' arrow' : s.items.length ? 'the ' + (ARROW_NAME[top(s).sym] || top(s).sym) + ' arrow' : '');
    if (hand.item) { h = (hand.sticky ? 'Walk to a pad and <b>tap Space</b> to put it down.' : '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.') + (hand.item.card ? ' Card: "' + hand.item.text + '"' : ''); key = hand.sticky ? 'tap to put down' : 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.copyOut) { h = '<b>Tap Space</b> to take a copy of ' + (s.items.length ? 'the ' + top(s).sym + ' cube' : 'it') + ', then tap again at a pad to put it down (or hold Space to carry it). The ' + (s.role === 'mem' ? 'memory box' : 'register') + ' keeps its value.'; key = 'tap to copy'; mode = 'hold'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down.'; key = 'tap to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down (or hold Space to carry it).'; key = 'tap to pick up'; mode = 'hold'; }
    else h = 'Walk up to an arrow. <b>Tap Space</b> (or click) to pick it up and tap again to put it down, or hold Space to carry it. Right-drag turns the camera.';
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
    const k = $('keyWhat'); if (k && k.textContent !== key) k.textContent = key;
    const b = $('leftBtn'); if (b) b.dataset.mode = mode;
  }

  // ================================================================ the frame loop and input (as Network Builder 3D)
  function setOverview(on) { overview = on; view?.setFit(on ? MAPW : 16); $('mapBtn').textContent = on ? 'Walk (M)' : 'Map (M)'; }
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
    me.update(dt, { x: pos.x, y: pos.y, face: pos.face, moving, hands: [0, 0].map(() => ({ down: hand.down || !!hand.item, hold: hand.item ? 'dev' : null })) }, true);
    view.follow(camX(), pos.y - camAhead());
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, skipMove() { if (R && R.anim) R.anim.endAt = 0; }, missions: MISSIONS, model: { runRobot, endOf, orders, trayRound, recapRound, stepRobot },
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
