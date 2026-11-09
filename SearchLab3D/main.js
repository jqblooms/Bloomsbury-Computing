// Search Lab 3D: Year 9 2.4 Binary Search in the lab of Network Builder 3D. A row of closed boxes numbered from index
// 1: open them one at a time (each box opened is one comparison). Linear search: in order from index 1, stop at the
// target (every box when it is missing). Binary search on items in order: LOW and HIGH cubes mark the part still to
// search; Middle = (Low + High) / 2, rounded down; open it, then carry LOW or HIGH past it (the middle item is thrown
// away with the half), until FOUND or, when nothing is left, NOT FOUND. Linear or Binary?: predict both counts.
// The rules and wording are the lesson's (y9-2-4-binary-search) and the 2D Search Lab's (SearchLab/).
//
// The engine (controls, guide arrow, What just happened card, mission sheet, lesson mode, Walk me through it, the help
// rules: no help in challenges, later tutorials show the arrow only after a slip) is a fork of CpuLab3D/main.js.
// Progress: 'bc-search3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'searchlab3d'.
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

const roleOf = () => 'num';
// ================================================================ the searches (a pure model, so it can be tested)
// The rules of the lesson y9-2-4-binary-search and the 2D Search Lab: items are numbered from index 1; one comparison
// per item checked; a linear search starts at index 1 and stops when it finds the target (it checks every item when
// the target is missing); a binary search needs the items in order: Middle = (Low + High) / 2, rounded down, and the
// middle item is thrown away with the half.
const midOf = (lo, hi) => Math.floor((lo + hi) / 2);
// every middle a binary search checks: [{ lo, hi, mid, v, cmp: 'found' | 'right' | 'left' }]; 1-based
function binarySteps(list, target) {
  const out = []; let lo = 1, hi = list.length;
  while (lo <= hi) {
    const mid = midOf(lo, hi), v = list[mid - 1];
    if (v === target) { out.push({ lo, hi, mid, v, cmp: 'found' }); break; }
    if (target > v) { out.push({ lo, hi, mid, v, cmp: 'right' }); lo = mid + 1; } else { out.push({ lo, hi, mid, v, cmp: 'left' }); hi = mid - 1; }
  }
  return out;
}
const linearCount = (list, target) => { const k = list.indexOf(target); return k < 0 ? list.length : k + 1; };
const binaryCount = (list, target) => binarySteps(list, target).length;
// n different numbers; sorted for a binary search; target in the list, or (missing) a number between two of them
function searchList(n, o = {}) {
  const pool = shuffle(Array.from({ length: 98 }, (_, i) => i + 2)).slice(0, n);
  const list = o.unsorted ? pool : pool.slice().sort((a, b) => a - b);
  let target;
  if (o.missing) { const s = list.slice().sort((a, b) => a - b); for (let t = 0; t < 50; t++) { const k = rnd(0, n - 2); if (s[k + 1] - s[k] > 1) { target = rnd(s[k] + 1, s[k + 1] - 1); break; } } if (target == null) target = 1; }
  else target = o.at != null ? list[o.at] : pick(list);
  return { list, target, missing: !list.includes(target) };
}
// one round of each mode
function linearRound(o = {}) { const r = searchList(o.n || 8, { unsorted: true, missing: o.missing ?? (o.maybeMissing ? Math.random() < 0.4 : false), at: o.at }); return Object.assign(r, { mode: 'linear', key: r.list.join(',') + '>' + r.target }); }
function binaryRound(o = {}) {
  for (let t = 0; t < 100; t++) {
    const r = searchList(o.n || 8, { missing: o.missing ?? (o.maybeMissing ? Math.random() < 0.35 : false) });
    if (!r.missing && binaryCount(r.list, r.target) < (o.minSteps || 2)) continue;   // not found on the very first middle
    return Object.assign(r, { mode: 'binary', key: r.list.join(',') + '>' + r.target });
  }
  const r = searchList(8); return Object.assign(r, { mode: 'binary', key: 'fixed' });
}
// Linear or Binary?: predict both counts (and, for a list not in order, whether a binary search can be used at all)
function raceRound() {
  const unsorted = Math.random() < 0.3, r = searchList(rnd(8, 15), { unsorted, missing: Math.random() < 0.25 });
  return Object.assign(r, { mode: 'race', unsorted, key: r.list.join(',') + '>' + r.target });
}

// ================================================================ missions
const MISSIONS = [
  { id: 'lin-t', group: 'Linear search', title: 'Linear Search', type: 'tutorial', guided: true, kind: 'search', mins: 5,
    intro: 'The boxes are closed. Find the target with a <b>linear search</b>: open the boxes one at a time, starting at index 1. Each box you open is one comparison.',
    gen: () => linearRound({ n: 8 }),
    after: { q: 'The target is not in a list of 8 items. How many comparisons does a linear search make, and why?', options: ['8: it has to check every item to be sure the target is not there.', '1: it stops at the first item.', '4: it checks half of the items.'], why: 'A linear search only knows the target is missing after it has checked every item.' } },
  { id: 'lin-c', group: 'Linear search', title: 'Linear Search Challenge', type: 'challenge', kind: 'search', predict: true, mins: 6,
    intro: 'Predict the number of comparisons first, then do the linear search. The target might not be in the list. Two clean rounds in a row.',
    gen: () => linearRound({ n: 10, maybeMissing: true }) },
  { id: 'mid-t', group: 'Binary search', title: 'Find the Middle', type: 'tutorial', guided: true, kind: 'search', askMid: true, mins: 7,
    intro: 'These items are <b>in order</b>, so a binary search can be used. LOW and HIGH mark the part still to search. Work out the middle, open it, then move LOW or HIGH past it: the middle and one half are thrown away.',
    gen: () => binaryRound({ n: 8 }),
    after: { q: 'Why can a binary search throw away half of the items after one comparison?', options: ['The items are in order, so the target can only be on one side of the middle.', 'The target is always in the right half.', 'Half of the items are always duplicates.'], why: 'In an ordered list, a target bigger than the middle item can only be to its right.' } },
  { id: 'bin-t', group: 'Binary search', title: 'Binary Search', type: 'tutorial', kind: 'search', askMid: true, mins: 7,
    intro: 'Twelve items in order. Work out each middle, open it, and move LOW or HIGH. Keep going until you find the target.',
    gen: () => binaryRound({ n: 12, minSteps: 3 }) },
  { id: 'bin-c', group: 'Binary search', title: 'Binary Search Challenge', type: 'challenge', kind: 'search', mins: 8,
    intro: 'Sixteen items. Open the right middle each time and move LOW or HIGH. When nothing is left between LOW and HIGH, the target is not there: press NOT FOUND. Two clean rounds in a row.',
    gen: () => binaryRound({ n: 16, maybeMissing: true, minSteps: 3 }) },
  { id: 'race-c', group: 'Linear or binary?', title: 'Linear or Binary?', type: 'challenge', kind: 'race', mins: 7,
    intro: 'Predict how many comparisons each search makes. If the list is not in order, decide whether a binary search can be used at all. Two clean rounds in a row.',
    gen: () => raceRound() },
  { id: 'pro-c', group: 'Linear or binary?', title: 'Search Without Help', type: 'challenge', kind: 'search', noHelp: true, mins: 10,
    intro: 'Twenty-five items in order and no help. A binary search, from the first middle to FOUND or NOT FOUND. Two clean rounds in a row.',
    gen: () => binaryRound({ n: 25, maybeMissing: true, minSteps: 3 }) }
];
export { MISSIONS };
const SECTIONS = ['Linear search', 'Binary search', 'Linear or binary?'];
// Lesson mode: Year 9 2.4 Binary Search
const LESSONS = [
  { id: '2.4', title: '2.4: Binary Search', missions: ['lin-t', 'lin-c', 'mid-t', 'bin-t', 'bin-c', 'race-c'], ext: ['pro-c'] }
];
const minsOf = m => m.mins || 7;


// ================================================================ saving and results
const STORE = 'bc-search3d-v1:';
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
  const log = results('searchlab3d', 'Search Lab 3D');
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
  function itemMesh(it) { it.k3 = it.card ? makeCard(it.text) : makeCube(it.sym, it.role); worldG.add(it.k3.group); }
  function addItem(slot, it) { it.id = it.id || 'i' + nextId++; if (!it.k3) itemMesh(it); slot.items.push(it); it.slot = slot; snapItem(it); return it; }
  function killItem(it) { if (!it || !it.k3) return; worldG.remove(it.k3.group); it.k3.dispose(); it.k3.group.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); it.k3 = null; }
  function cube(sym, extra) { return Object.assign({ sym: String(sym), role: roleOf(String(sym)) }, extra || {}); }
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
      if (o.userData.ownMat) [].concat(o.material).forEach(mm => { mm.map?.dispose?.(); mm.dispose(); });
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
    view.zoom?.(R.p.list.length > 16 ? 1600 : 1350, 0.9);   // far enough back to see the whole row of boxes
    pos.face = Math.PI; view.jump(camX(), pos.y - camAhead());
    toast(''); explainReset();
    if (after) { explain('Not this time. ' + after + ' A new round has started.'); R.why = after; toast('A mistake, so a new round has started. ' + after, 'bad'); }
    explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  // the buses: look a little ahead of the player, so the address bus at the back is not under the card at the top
  const camAhead = () => 0;
  const camX = () => { const mid = 4 + (R && R.p ? R.p.list.length / 2 : 8); return mid + (pos.x - mid) * 0.55; };
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
    R.why = msg; R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg + (M.m.guided ? '' : ' The arrow now shows the way.')); drawAll();
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

  // ---------------------------------------------------------------- the boxes: a row of closed boxes, numbered from index 1
  // Linear: open the boxes in order from index 1. Binary: LOW and HIGH cubes stand on the marker pads in front of the
  // boxes; open the middle, then carry LOW or HIGH past it (the thrown-away boxes go dark), or press FOUND or NOT FOUND.
  const KIND = {};
  const BX = 4, BY = 5, MY = 7;   // first box at tile BX; boxes on row BY, marker pads on row MY, the corridor between
  function boxCube(i, st) { const v = R.p.list[i - 1]; return st === 'open' ? cube(v, { role: 'num' }) : st === 'gone' ? cube('', { role: 'off' }) : cube('?', { role: 'unknown' }); }
  function setBox(i, st) { const s = R.box[i - 1]; s.items.forEach(killItem); s.items = []; addItem(s, boxCube(i, st)); R.state[i - 1] = st; }
  function countSign() {
    if (R.countG) { worldG.remove(R.countG); R.countG.material.map.dispose(); R.countG.material.dispose(); }
    R.countG = addSign('COMPARISONS: ' + R.cmp, BX + R.p.list.length / 2, BY - 2, 200, { bg: '#343a40', ink: '#ffffff', size: 0.04 });
  }
  const binary = () => R.p.mode === 'binary';
  const stepNow = () => R.steps[R.k];
  // the current range is empty: what a binary search found
  function endState() { return binary() ? R.lo > R.hi : R.next > R.p.list.length; }
  function askMiddle() {
    if (!M.m.askMid || !binary()) return;
    const mid = midOf(R.lo, R.hi);
    R.ask = { type: 'num', plain: true, q: 'Low is ' + R.lo + ' and High is ' + R.hi + '. Middle = (' + R.lo + ' + ' + R.hi + ') / 2, rounded down. What is the middle index?', answer: mid,
      hint: (R.lo + R.hi) + ' / 2 = ' + ((R.lo + R.hi) / 2) + '. Round down.', why: '(' + R.lo + ' + ' + R.hi + ') / 2 = ' + ((R.lo + R.hi) / 2) + ', rounded down is ' + mid + '.', done: () => explain('The middle is index ' + mid + '. Open box ' + mid + '.') };
  }
  KIND.search = {
    start(m, p) { return 'Find ' + p.target + '. ' + (p.mode === 'binary' ? 'LOW is at index 1 and HIGH at index ' + p.list.length + '.' : 'Start at index 1.'); },
    setup(R, m) {
      const p = R.p, n = p.list.length, W = Math.max(22, n + 10);
      R.cmp = 0; R.next = 1; R.lo = 1; R.hi = n; R.phase = 'open'; R.state = p.list.map(() => 'shut'); R.steps = binary() ? binarySteps(p.list, p.target) : []; R.k = 0;
      newWorld(W, 12, p.mode === 'binary' ? 'Binary search' : 'Linear search');
      R.box = p.list.map((v, k) => addSlot({ role: 'box', pad: 'pedestal', x: BX + k, y: BY, idx: k + 1, label: String(k + 1), tag: { tagY: 120, tagSize: 0.04 },
        take: () => 'Press Space here to open this box.', press: () => openBox(k + 1), pressText: 'to open box ' + (k + 1) + ' (one comparison).' }));
      p.list.forEach((v, k) => addItem(R.box[k], boxCube(k + 1, 'shut')));
      addSign('FIND: ' + p.target, BX + n / 2, BY - 2, 300, { bg: '#ffd43b', ink: '#1a1200', size: 0.06 });
      if (binary()) {
        R.mark = p.list.map((v, k) => { const s = addSlot({ role: 'mark', pad: 'rail', x: BX + k, y: MY, idx: k + 1, put: (it, from) => markPut(s, it, from) }); return s; });
        addItem(R.mark[0], cube('LOW', { role: 'var', marker: 'lo' })); addItem(R.mark[n - 1], cube('HIGH', { role: 'var', marker: 'hi' }));
      }
      R.found = addSlot({ role: 'found', pad: 'answer', x: BX - 3, y: 6, label: 'FOUND', tag: { tagY: 130 }, press: () => sayEnd(true), pressText: 'to say: found it.' });
      R.none = addSlot({ role: 'none', pad: 'target', x: BX + n + 2, y: 6, label: 'NOT FOUND', tag: { tagY: 130 }, press: () => sayEnd(false), pressText: 'to say: it is not in the list.' });
      countSign();
      if (m.predict) R.ask = { type: 'num', plain: true, q: 'Before you start: how many comparisons will a linear search make to look for ' + p.target + '?', answer: linearCount(p.list, p.target),
        hint: 'Count the boxes it opens, from index 1, until it finds the target. If the target is not there, it opens every box.', why: 'A linear search makes ' + linearCount(p.list, p.target) + ' comparisons here.', done: () => explain('Now do the search to see.') };
      else askMiddle();
      pos.x = BX + Math.floor(n / 2); pos.y = 6;
    },
    placed(it, slot, from) {
      if (slot.role !== 'mark') return;
      const st = stepNow(), n = R.p.list.length;
      if (it.marker === 'lo') R.lo = slot.idx; else R.hi = slot.idx;
      for (let i = 1; i <= n; i++) if ((i < R.lo || i > R.hi) && R.state[i - 1] !== 'gone') setBox(i, 'gone');
      explain((it.marker === 'lo' ? 'LOW moves to index ' + R.lo : 'HIGH moves to index ' + R.hi) + '. The middle item and the ' + (it.marker === 'lo' ? 'left' : 'right') + ' half are thrown away. ' + (R.hi - R.lo + 1) + ' item' + (R.hi - R.lo === 0 ? '' : 's') + ' left to search.');
      R.k++; R.phase = 'open'; askMiddle(); void st;
    },
    check() { },
    guide(R, m) {
      if (R.ask) return null;
      if (!binary()) {
        if (R.phase === 'end') return slotTarget(R.found);
        return R.next > R.p.list.length ? slotTarget(R.none) : slotTarget(R.box[R.next - 1]);
      }
      const st = stepNow();
      if (!st) return slotTarget(R.none);
      if (R.phase === 'open') return slotTarget(R.box[st.mid - 1]);
      if (st.cmp === 'found') return slotTarget(R.found);
      const lastLeft = st.cmp === 'right' ? st.mid === st.hi : st.mid === st.lo;
      if (lastLeft) return slotTarget(R.none);
      const which = st.cmp === 'right' ? 'lo' : 'hi', to = st.cmp === 'right' ? st.mid + 1 : st.mid - 1;
      if (hand.item) return hand.item.marker === which ? slotTarget(R.mark[to - 1]) : null;
      return slotTarget(R.mark.find(s => s.items.length && top(s).marker === which));
    },
    steps(R, m) {
      if (!binary()) return [{ text: 'Open box 1. Is it the target?', done: () => R.cmp >= 1 }, { text: 'Not the target? Open the next box, in order.', done: () => R.over || R.phase === 'end' }, { text: 'Found it: press <b>FOUND</b>. Opened every box without finding it: press <b>NOT FOUND</b>.', done: () => R.over }];
      return [
        { text: 'Work out the middle: (Low + High) / 2, rounded down.', done: () => R.cmp >= 1 || R.over },
        { text: 'Open the middle box. Is it the target, bigger, or smaller?', done: () => R.cmp >= 1 || R.over },
        { text: 'Target bigger: carry <b>LOW</b> to the index after the middle. Target smaller: carry <b>HIGH</b> to the index before it.', done: () => R.k >= 1 || R.over },
        { text: 'Repeat until you open the target (press <b>FOUND</b>) or nothing is left between LOW and HIGH (press <b>NOT FOUND</b>).', done: () => R.over }];
    },
    goals() { return []; },
    expr(R) {
      const p = R.p;
      const row = p.list.map((v, k) => '<td class="' + R.state[k] + (binary() && k + 1 === R.lo ? ' lo' : '') + (binary() && k + 1 === R.hi ? ' hi' : '') + '">' + (R.state[k] === 'open' ? v : R.state[k] === 'gone' ? '' : '?') + '</td>').join('');
      return '<b>Find:</b> ' + p.target + (binary() ? ' &nbsp; <b>Low:</b> ' + R.lo + ' &nbsp; <b>High:</b> ' + R.hi : '') + ' &nbsp; <b>Comparisons:</b> ' + R.cmp +
        '<div class="sr-wrap"><table class="sr-row"><tr>' + p.list.map((v, k) => '<th>' + (k + 1) + '</th>').join('') + '</tr><tr>' + row + '</tr></table></div>';
    },
    walk(R) {
      const b = binary(), p = b ? binaryRound({ n: R.p.list.length > 12 ? 12 : 8 }) : linearRound({ n: 8 }), steps = [];
      steps.push({ text: '<b>A different list.</b> Find ' + p.target + '.', visual: listHtml(p.list) });
      if (!b) { const c = linearCount(p.list, p.target); p.list.slice(0, c).forEach((v, k) => steps.push({ text: 'Index ' + (k + 1) + ': ' + v + (v === p.target ? ' is the target. <span class="hl">Found</span> after ' + (k + 1) + ' comparison' + (k ? 's' : '') + '.' : ' is not ' + p.target + '. Next box.'), visual: '' })); }
      else for (const st of binarySteps(p.list, p.target)) steps.push({ text: 'Low ' + st.lo + ', High ' + st.hi + ': middle (' + st.lo + ' + ' + st.hi + ') / 2 rounded down = <span class="hl">' + st.mid + '</span>. Index ' + st.mid + ' holds ' + st.v + '. ' + (st.cmp === 'found' ? 'That is the target: found.' : st.cmp === 'right' ? p.target + ' is bigger, so LOW moves to ' + (st.mid + 1) + '.' : p.target + ' is smaller, so HIGH moves to ' + (st.mid - 1) + '.'), visual: '' });
      steps.push({ text: 'Now search yours the same way.', visual: '' });
      return steps;
    }
  };
  // Linear or Binary?: the predictions, then both searches shown on the boxes
  KIND.race = {
    start(m, p) { return 'Find ' + p.target + ' in a list of ' + p.list.length + ' items.'; },
    setup(R) {
      const p = R.p, n = p.list.length, sorted = p.list.every((v, k) => !k || p.list[k - 1] < v);
      newWorld(Math.max(22, n + 8), 10, 'Linear or binary?');
      R.box = p.list.map((v, k) => addSlot({ role: 'box', pad: 'pedestal', x: BX + k, y: BY, idx: k + 1, label: String(k + 1), tag: { tagY: 120, tagSize: 0.04 }, take: () => 'Predict on the right.' }));
      p.list.forEach((v, k) => addItem(R.box[k], cube(v, { role: 'num' })));
      addSign('FIND: ' + p.target, BX + n / 2, BY - 2, 300, { bg: '#ffd43b', ink: '#1a1200', size: 0.06 });
      const lin = linearCount(p.list, p.target), asks = [];
      if (!sorted) asks.push({ type: 'choice', plain: true, q: 'Can a binary search be used on this list?', options: ['No: the items are not in order.', 'Yes: any list can be searched in halves.'], answer: 'No: the items are not in order.', wide: true, hint: 'Look at the order of the items.', why: 'A binary search only works when the items are in order.' });
      asks.push({ type: 'num', plain: true, q: 'How many comparisons does a <b>linear</b> search make?', answer: lin, hint: 'From index 1, one comparison per item checked, until the target (or every item if it is missing).', why: 'Linear: ' + lin + ' comparisons.' });
      if (sorted) { const b = binaryCount(p.list, p.target); asks.push({ type: 'num', plain: true, q: 'How many comparisons does a <b>binary</b> search make?', answer: b, hint: 'Count the middles it checks: (Low + High) / 2, rounded down, each time.', why: 'Binary: ' + b + ' comparisons (' + binarySteps(p.list, p.target).map(s => 'index ' + s.mid).join(', ') + ').' }); }
      R.asks = asks; R.ai = 0; nextAsk();
      pos.x = BX + Math.floor(n / 2); pos.y = 7.5;
    },
    placed() { }, check() { }, guide() { return null; },
    steps() { return []; }, goals() { return []; },
    expr(R) { return '<b>Find:</b> ' + R.p.target + '<div class="sr-wrap">' + listHtml(R.p.list) + '</div>'; },
    walk(R) { const p = raceRound(); return [{ text: '<b>A different list.</b> Find ' + p.target + '.', visual: listHtml(p.list) }, { text: 'Linear: ' + linearCount(p.list, p.target) + ' comparisons.', visual: '' }, { text: p.list.every((v, k) => !k || p.list[k - 1] < v) ? 'Binary: ' + binaryCount(p.list, p.target) + ' comparisons.' : 'Not in order, so a binary search cannot be used.', visual: '' }, { text: 'Now predict yours.', visual: '' }]; }
  };
  function nextAsk() {
    const a = R.asks[R.ai]; if (!a) { finishRound('Both predictions were right.'); return; }
    R.ask = Object.assign({}, a, { done: () => { explain(a.why); R.ai++; nextAsk(); } });
  }
  function listHtml(list) { return '<table class="sr-row"><tr>' + list.map((v, k) => '<th>' + (k + 1) + '</th>').join('') + '</tr><tr>' + list.map(v => '<td class="open">' + v + '</td>').join('') + '</tr></table>'; }
  // opening a box: one comparison
  function openBox(i) {
    const p = R.p, ch = M.m.type === 'challenge', n = p.list.length;
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    if (R.state[i - 1] === 'gone') { const msg = 'Box ' + i + ' has been thrown away: it is outside LOW and HIGH.'; if (ch) mistake(msg); else { R.slipped = true; toast(msg, 'bad'); } return; }
    if (R.state[i - 1] === 'open') { toast('Box ' + i + ' is already open.', 'hint'); return; }
    if (!binary()) {
      if (R.phase === 'end') { const msg = 'You have found it: a linear search stops there. Press FOUND.'; if (ch) mistake(msg); else { R.slipped = true; toast(msg, 'bad'); } return; }
      if (i !== R.next) { const msg = 'A linear search checks the items in order, starting at index 1. Next is box ' + R.next + '.'; if (ch) mistake(msg); else { R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg); } return; }
      setBox(i, 'open'); R.cmp++; countSign(); R.next++;
      const v = p.list[i - 1];
      if (v === p.target) { R.phase = 'end'; explain('Index ' + i + ' holds ' + v + ': the target. ' + R.cmp + ' comparison' + (R.cmp > 1 ? 's' : '') + '.'); }
      else explain('Index ' + i + ' holds ' + v + ', not ' + p.target + '. One more comparison: ' + R.cmp + '.' + (R.next > n ? ' Every box is open.' : ''));
      drawAll(); return;
    }
    if (R.phase !== 'open') { const msg = 'You have opened the middle. Now move LOW or HIGH past it' + (stepNow() && stepNow().cmp === 'found' ? ', or press FOUND' : '') + '.'; if (ch) mistake(msg); else { R.slipped = true; toast(msg, 'bad'); } return; }
    const mid = midOf(R.lo, R.hi);
    if (i !== mid) { const msg = 'Middle = (' + R.lo + ' + ' + R.hi + ') / 2 = ' + ((R.lo + R.hi) / 2) + ', rounded down: index ' + mid + ', not ' + i + '.'; if (ch) mistake(msg); else { R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg); } return; }
    setBox(i, 'open'); R.cmp++; countSign(); R.phase = 'decide';
    const v = p.list[i - 1];
    explain('Index ' + i + ' holds ' + v + '. ' + (v === p.target ? 'That is the target.' : p.target + ' is ' + (p.target > v ? 'bigger, so it can only be to the right.' : 'smaller, so it can only be to the left.')));
    drawAll();
  }
  function sayEnd(found) {
    const p = R.p, ch = M.m.type === 'challenge';
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    let ok, why;
    if (!binary()) {
      ok = found ? R.phase === 'end' : (!p.list.includes(p.target) && R.next > p.list.length);
      why = found ? 'Nothing open is the target yet.' : R.next <= p.list.length ? 'A linear search must check every item before it can say the target is not there. ' + (p.list.length - R.next + 1) + ' box' + (p.list.length - R.next ? 'es are' : ' is') + ' still closed.' : '';
    } else {
      const st = stepNow(), lastLeft = st && st.cmp !== 'found' && (st.cmp === 'right' ? st.mid === st.hi : st.mid === st.lo);
      ok = found ? R.phase === 'decide' && st && st.cmp === 'found' : R.phase === 'decide' && lastLeft;
      why = found ? 'The middle you opened is not the target.' : R.phase !== 'decide' ? 'Open the middle first.' : 'There are still items between LOW and HIGH after this one. Move LOW or HIGH.';
    }
    if (!ok) { if (ch) mistake(why); else { R.slipped = true; toast(why, 'bad'); explain('Not this time. ' + why); } return; }
    R.phase = 'over';
    finishRound(found ? 'Found ' + p.target + ' with ' + R.cmp + ' comparison' + (R.cmp > 1 ? 's' : '') + '.' : p.target + ' is not in the list: ' + R.cmp + ' comparison' + (R.cmp > 1 ? 's' : '') + '.');
  }
  // moving LOW or HIGH: only past the middle just opened, the right one, to the right place
  function markPut(s, it, from) {
    if (from === s) return null;
    if (!it.marker) return { msg: 'Only LOW and HIGH go here.' };
    if (s.items.some(x => x.marker === it.marker)) return { msg: 'That pad has a marker on it.' };   // LOW and HIGH may share a pad: one item left
    const ch = M.m.type === 'challenge', st = stepNow(), res = markWhy(it, s, st, ch);
    if (res && !ch) R.slipped = true;   // a slip in a tutorial brings the arrow in
    return res;
  }
  function markWhy(it, s, st, ch) {
    if (R.phase !== 'decide' || !st) return { msg: 'Open the middle box first.', mistake: ch };
    if (st.cmp === 'found') return { msg: 'The middle is the target: press FOUND.', mistake: ch };
    const which = st.cmp === 'right' ? 'lo' : 'hi', to = st.cmp === 'right' ? st.mid + 1 : st.mid - 1;
    if ((st.cmp === 'right' ? st.mid === st.hi : st.mid === st.lo)) return { msg: 'Nothing is left on that side: press NOT FOUND.', mistake: ch };
    if (it.marker !== which) return { msg: R.p.target + ' is ' + (st.cmp === 'right' ? 'bigger than ' : 'smaller than ') + st.v + ', so ' + (which === 'lo' ? 'LOW' : 'HIGH') + ' moves, not ' + (it.marker === 'lo' ? 'LOW' : 'HIGH') + '.', mistake: ch };
    if (s.idx !== to) return { msg: 'The middle item is thrown away too, so ' + (which === 'lo' ? 'LOW goes to the index after it: ' : 'HIGH goes to the index before it: ') + to + '.', mistake: ch };
    return null;
  }

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
    // no help in a challenge; in a tutorial after the first of a topic, the arrow comes only after a slip this round
    if (M.m.type === 'challenge') return null;
    if (!M.m.guided && !R.slipped) return null;
    return KIND[M.m.kind].guide(R, M.m);
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
    t.appendChild(el('div', { class: 'cl-expr' }, K.expr(R, m)));
    if (m.type === 'tutorial') {
      const st = K.steps(R, m), ol = el('ol', { class: 'steps' });
      let now = st.findIndex(s => !s.done()); if (M.phase === 'done') now = st.length;
      st.forEach((s, i) => ol.appendChild(el('li', { class: i < now || (now < 0) ? 'done' : i === now ? 'now' : 'later' }, '<span>' + s.text + '</span>')));
      t.appendChild(ol);
    } else {
      t.appendChild(el('ul', { class: 'goals' }, '<li>No help in a challenge: you decide every move.</li>'));
      t.appendChild(el('p', { class: 'note' }, '<b>' + M.have + ' of ' + (m.need || NEED) + ' clean ' + ((m.need || NEED) === 1 ? 'run' : 'rounds in a row') + '.</b>'));
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
    if (!m.noHelp && m.type !== 'challenge') act.appendChild(btn('Walk me through it', '', walkMe));
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
  function drawAll() { drawPanel(); hint(); }

  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls === 'bad' ? 'bad' : cls === 'good' ? 'good' : 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, cls === 'bad' ? 5200 : 3200); }
  function hint() {
    // what Space does right now, for what is in front of you: HOLD (pick up and carry) or PRESS (switch a lamp)
    let h, key = 'tap to grab', mode = '';
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + s.crate + ' cube' : s.items.length ? (top(s).card ? 'the card "' + top(s).text + '"' : 'the ' + top(s).sym + ' cube') : '');
    if (hand.item) { h = (hand.sticky ? 'Walk to a pad and <b>tap Space</b> to put it down.' : '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.') + (hand.item.card ? ' Card: "' + hand.item.text + '"' : ''); key = hand.sticky ? 'tap to put down' : 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.copyOut) { h = '<b>Tap Space</b> to take a copy of ' + (s.items.length ? 'the ' + top(s).sym + ' cube' : 'it') + ', then tap again at a pad to put it down (or hold Space to carry it). The ' + (s.role === 'mem' ? 'memory box' : 'register') + ' keeps its value.'; key = 'tap to copy'; mode = 'hold'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down.'; key = 'tap to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Tap Space</b> to pick up ' + what + ', then tap again at a pad to put it down (or hold Space to carry it).'; key = 'tap to pick up'; mode = 'hold'; }
    else h = 'Walk up to a cube or card. <b>Tap Space</b> (or click) to pick it up and tap again to put it down, or hold Space to carry it. Right-drag turns the camera.';
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, model: { binarySteps, linearCount, binaryCount, midOf, searchList, linearRound, binaryRound, raceRound },
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
