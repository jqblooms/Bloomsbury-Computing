// Binary Lab 3D: Year 11 1.6 Binary Addition (Cambridge IGCSE 0478) in the lab of Network Builder 3D, Contest Lab 3D
// and CPU Lab 3D. The floor is the written method, laid out big: a column for each place value (128 on the left, 1 on
// the right), the two numbers as rows of lamp cubes, a carry row and an answer row. You fetch 1 and 0 cubes from two
// crates and place them, one column at a time from the right: count the 1s in the column (with the carry), write
// the right bit, and carry 1 to the next column when there are two or three. Then check the answer in denary.
// Wording follows the lesson (y11-1-6-binadd): count the 1s, 0, 1, 10 or 11, start at the right, the carry row.
// Every sum fits in 8 bits (the lesson does not cover what happens when it does not).
//
// Same controls, guide arrow, outlines, What just happened card, attention glow and rules as Contest Lab 3D (this
// file is a fork of ContestLab3D/main.js; room.js, blob.js, devices.js, cubes.js and three.js are shared by import).
// Progress: 'bc-binadd3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'binarylab3d'.
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

// ================================================================ binary addition
const roleOf = s => s === '1' ? 'on' : 'off';
const C = (s, role) => '<span class="cl-l ' + (s === '1' ? 'on' : 'off') + '">' + s + '</span>';
const bin = (v, n) => v.toString(2).padStart(n, '0');
// Column by column from the right: the 1s counted (a, b and the carry in), the bit written and the carry out.
function columns(a, b, n) {
  const A = bin(a, n), B = bin(b, n), out = []; let carry = 0;
  for (let i = n - 1; i >= 0; i--) {
    const x = +A[i], y = +B[i], count = x + y + carry, bit = count % 2, cout = count >= 2 ? 1 : 0;
    out.push({ i, pv: 2 ** (n - 1 - i), a: x, b: y, cin: carry, count, bit, cout });
    carry = cout;
  }
  return out;   // out[0] is the rightmost column
}
// What the 1s in one column make. A column can only hold 0 or 1, so two 1s move left together as one carry.
const ONES = ['no 1s', 'one 1', 'two 1s', 'three 1s'];
const RULE = ['write 0, carry nothing', 'write 1, carry nothing', 'write 0 and carry 1', 'write 1 and carry 1'];
const RULE_OPTS = ['Write 0, carry nothing', 'Write 1, carry nothing', 'Write 0, carry 1', 'Write 1, carry 1'];
function breakdown(c) {
  const v = c.pv, w = v * 2;
  if (c.count < 2) return (c.count ? 'One 1' : 'No 1s') + ', so write ' + c.count + '. Nothing to carry.';
  const two = 'Two 1s in the column worth ' + v + ' make ' + w + '. A column can only hold 0 or 1, so the ' + w + ' moves left: it is one 1 in the column worth ' + w + '. That is the carry.';
  return c.count === 2 ? two + ' Nothing is left here, so write 0 and carry 1.' : 'Three 1s: put two of them together. ' + two + ' One 1 is left here, so write 1 and carry 1.';
}
const RULE_ROWS = [
  ['No 1s', '0 + 0', '0', ''],
  ['One 1', '0 + 1<br>1 + 0<br>0 + 0 + carry 1', '1', ''],
  ['Two 1s', '1 + 1<br>0 + 1 + carry 1<br>1 + 0 + carry 1', '0', '1'],
  ['Three 1s', '1 + 1 + carry 1', '1', '1']
];
function rulesHtml(hl) {
  return '<table class="bin-rules"><tr><th>1s in the column</th><th>Ways to get it</th><th>Write</th><th>Carry</th></tr>'
    + RULE_ROWS.map((r, k) => '<tr' + (k === hl ? ' class="hl"' : '') + '><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + C(r[2]) + '</td><td>' + (r[3] ? C(r[3]) : 'nothing') + '</td></tr>').join('') + '</table>'
    + '<p class="note">Two 1s make 2, and 2 is written 10 in binary: 1 in the column worth 2, and 0 in the column worth 1. That is why you write 0 and carry 1.</p>';
}
function sum(o) {
  for (let t = 0; t < 2000; t++) {
    const n = o.n, max = 2 ** n - 1;
    const a = rnd(o.min || 1, max), b = rnd(o.min || 1, max);
    if (a === b || a + b > max) continue;
    const cols = columns(a, b, n), carries = cols.filter(c => c.cout).length;
    if (carries < (o.carries || 0) || (o.three && !cols.some(c => c.count === 3))) continue;
    return { n, a, b, cols, key: a + '+' + b };
  }
  throw new Error('no sum');
}
const fixed = (A, B, cite) => { const n = A.length, a = parseInt(A, 2), b = parseInt(B, 2); return { n, a, b, cols: columns(a, b, n), key: A + '+' + B, cite }; };
const EXAM = [
  ['00110011', '01100001', 'Cambridge IGCSE 0478/11, June 2023, Question 1(d).'], ['00110000', '01100110', 'Cambridge IGCSE 0478/12, June 2024, Question 3(c).'],
  ['00110011', '01111000', 'Cambridge IGCSE 0478/13, November 2023, Question 2(e).'], ['01010100', '01110100', 'Adapted from Cambridge IGCSE 0478/11, November 2024, Question 3(d).'],
  ['10011011', '00010011', 'Cambridge IGCSE 0478/12, March 2025, Question 1(b).'], ['01100101', '01110000', 'Adapted from Cambridge IGCSE 0478/12, June 2025, Question 1(e).'],
  ['01110110', '00110000', 'Cambridge IGCSE 0478/11, November 2025, Question 1(e).'], ['00011010', '01101110', 'Cambridge IGCSE 0478/12, March 2026, Question 6(e).']
];

// ================================================================ missions
const MISSIONS = [
  { id: 'rules-t', group: 'Adding bits', title: 'The Four Column Rules', type: 'tutorial', kind: 'add', countAsk: true, ruleAsk: true, mins: 7,
    intro: 'A column can only hold 0 or 1. When a column has two 1s, they move left together as one carry, because the next column is worth double. Count the 1s in each column, then pick what to write and what to carry.',
    gen: () => fixed('00101', '00111'),
    after: { q: 'A column has two 1s. Why do you write 0 there?', options: ['The two 1s move left together as one carry, so nothing is left in this column.', 'Two 1s cancel out and are lost.', 'You always write 0 in binary addition.'], why: 'Two 1s in a column are worth the same as one 1 in the column on its left.' } },
  { id: 'rules-c', group: 'Adding bits', title: 'Column Rules Drill', type: 'challenge', kind: 'add', ruleAsk: true, mins: 8,
    intro: 'For each column, count the 1s and say what you write and what you carry. Then place the cubes. Two clean rounds in a row.',
    gen: () => sum({ n: 4, carries: 2, three: true }) },
  { id: 'four-t', group: 'Adding bits', title: 'One Column at a Time', type: 'tutorial', kind: 'add', countAsk: true,
    intro: 'Count the 1s in each column, then use the four rules. No 1s: write 0. One 1: write 1. Two 1s: write 0 and carry 1. Three 1s: write 1 and carry 1.',
    gen: () => fixed('0111', '0011'),
    after: { q: 'Why is a carry counted as one more 1 in the column it goes into?', options: ['It stood for two 1s in the column on its right, and this column is worth double, so it is one 1 here.', 'Every column always gets one extra 1.', 'The carry is the answer to the column on its left.'], why: 'Each column is worth twice the one on its right.' } },
  { id: 'four-c', group: 'Adding bits', title: '4-bit Sums', type: 'challenge', kind: 'add',
    intro: 'Add two 4-bit numbers, one column at a time from the right. Every bit and every carry must be right. Two clean rounds in a row.',
    gen: () => sum({ n: 4, carries: 2 }) },
  { id: 'eight-t', group: '8-bit addition', title: 'Add 8 Bits', type: 'tutorial', kind: 'add', denary: true,
    intro: 'Now 8 bits, from the right. Write each carry above the next column. Then check your answer in denary.',
    gen: () => fixed('01001110', '00100111'),
    after: { q: 'Sam wrote 0 for every 1 + 1 but carried nothing, and got 01101001. Why is that wrong?', options: ['Each 1 + 1 makes two, and two is a 1 in the next column: Sam threw those away.', 'Sam should have started at the left.', 'Binary numbers cannot be added.'], why: 'His answer is 105, but 78 + 39 = 117.' } },
  { id: 'eight-c', group: '8-bit addition', title: '8-bit Challenge', type: 'challenge', kind: 'add', denary: true,
    intro: 'Add two 8-bit numbers and check the answer in denary. Two clean rounds in a row.',
    gen: () => sum({ n: 8, carries: 3, min: 16, three: Math.random() < 0.6 }) },
  { id: 'exam-c', group: 'Exam sums', title: 'Exam Paper Sums', type: 'challenge', kind: 'add', denary: true,
    intro: 'Real 8-bit sums from Cambridge IGCSE 0478 exam papers. Two clean rounds in a row.',
    gen: () => fixed(...pick(EXAM)) },
  { id: 'speed-c', group: 'Exam sums', title: 'No Help', type: 'challenge', kind: 'add', denary: true, noHelp: true, need: 3,
    intro: 'Three 8-bit sums in a row with no help and no mistakes.',
    gen: () => sum({ n: 8, carries: 4, min: 32, three: true }) },
  // Extension: run the method backwards. A and the answer are given; find B one column at a time from the right.
  { id: 'missing-t', group: 'Extension', title: 'Missing Number', type: 'tutorial', kind: 'add', missing: true,
    intro: 'A and the answer are given. Find B. Start at the right: which bit of B makes the 1s in the column give the answer bit?',
    gen: () => fixed('0101', '0011'),
    after: { q: 'Why must you still start at the right to find B?', options: ['A carry from the right changes what B must be in the next column.', 'B is always smaller than A.', 'The left column is always 0.'], why: 'Each carry goes into the column on its left, so you need it first.' } },
  { id: 'missing-c', group: 'Extension', title: 'Missing Number Challenge', type: 'challenge', kind: 'add', missing: true, denary: true,
    intro: 'Find the missing 8-bit number B, then check it in denary. Two clean rounds in a row.',
    gen: () => sum({ n: 8, carries: 3, min: 16 }) }
];
export { MISSIONS };
const SECTIONS = ['Adding bits', '8-bit addition', 'Exam sums', 'Extension'];
const LESSONS = [
  { id: '1.6', title: '1.6: Binary Addition', missions: ['rules-t', 'rules-c', 'four-t', 'four-c', 'eight-t', 'eight-c', 'exam-c'], ext: ['missing-t', 'missing-c', 'speed-c'] }
];
const minsOf = m => m.mins || (m.id === 'speed-c' ? 12 : m.type === 'challenge' ? (m.id === 'four-c' ? 10 : 12) : m.id === 'four-t' ? 7 : 10);

// ================================================================ saving and results
const STORE = 'bc-binadd3d-v1:';
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
  const log = results('binarylab3d', 'Binary Lab 3D');
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
    pos.face = Math.PI; view.jump(pos.x, pos.y);
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

  // ---------------------------------------------------------------- the addition board
  const KIND = {};
  const ROWS = { pv: 2, A: 3, B: 5, carry: 7, ans: 9, crate: 12 };
  const ones = n => ONES[n];
  const plus = c => c.a + ' + ' + c.b + (c.cin ? ' + carry 1' : '');
  function boardHtml(p, done, active, carries, missing) {
    const n = p.n, A = bin(p.a, n), B = missing ? done.map(x => x == null ? '' : x) : bin(p.b, n), cols = p.cols.slice().reverse();   // left to right
    const ansRow = missing ? [...bin(p.a + p.b, n)] : done;
    const cell = (v, i, cls) => '<td class="' + (i === active ? 'act ' : '') + (cls || '') + '">' + v + '</td>';
    let h = '<table class="bin-board"><tr><th>Place value</th>' + cols.map((c, i) => cell(c.pv, i, 'pv')).join('') + '</tr>';
    h += '<tr><th>Carry</th>' + cols.map((c, i) => cell(carries[i] ? '1' : '', i, 'car')).join('') + '</tr>';
    h += '<tr><th>A</th>' + [...A].map((b, i) => cell(b, i)).join('') + '</tr><tr><th>+ B</th>' + [...B].map((b, i) => cell(b, i)).join('') + '</tr>';
    h += '<tr class="ans"><th>Answer</th>' + cols.map((c, i) => cell(ansRow[i] != null ? ansRow[i] : '', i)).join('') + '</tr></table>';
    return h;
  }
  KIND.add = {
    start(m) { return m.missing ? 'A and the answer are given. Find B, starting at the right in the column worth 1.' : 'Start at the right, in the column worth 1. Carries only move left.'; },
    setup(R, m) {
      const p = R.p, n = p.n, W = Math.max(22, 2 * n + 9);
      newWorld(W, 15, 'Binary addition');
      const x0 = Math.floor((W - (2 * n - 1)) / 2) + 1, X = i => x0 + 2 * i;
      const A = bin(p.a, n), B = bin(p.b, n);
      R.colOf = i => p.cols[n - 1 - i];   // board index (0 = left) to its column
      R.ans = []; R.car = []; R.bits = Array(n).fill(null); R.carried = Array(n).fill(false); R.counted = new Set(); R.ruled = new Set(); R.denaryDone = false;
      for (let i = 0; i < n; i++) {
        const pv = R.colOf(i).pv;
        addSign(String(pv), X(i), ROWS.pv, 120, { bg: '#ffd43b', ink: '#1a1200', size: 0.032 });
        const S = bin(p.a + p.b, n);
        for (const [row, bits] of m.missing ? [['A', A], ['ans', S]] : [['A', A], ['B', B]]) {
          const s = addSlot({ role: 'num', pad: row === 'ans' ? 'answer' : 'lamp', x: X(i), y: ROWS[row], take: () => m.missing ? 'A and the answer are given. Fetch 1 and 0 cubes from the crates for B.' : 'These bits are the two numbers being added. Fetch 1 and 0 cubes from the crates.', put: () => ({ msg: m.missing ? 'A and the answer are given. Put cubes in the B row or the carry row.' : 'These are the numbers being added. Put cubes in the carry row or the answer row.' }) });
          addItem(s, cube(bits[i]));
        }
        if (i < n - 1) R.car[i] = addSlot({ role: 'carry', pad: 'machine', x: X(i), y: ROWS.carry, col: i, take: () => 'The carry is in place.', put: (it) => carryPut(i, it) });
        R.ans[i] = addSlot({ role: 'ans', pad: m.missing ? 'lamp' : 'answer', x: X(i), y: m.missing ? ROWS.B : ROWS.ans, col: i, take: () => 'This bit is in place.', put: (it) => ansPut(i, it) });
      }
      for (const [label, y] of [['A', ROWS.A], ['+ B', ROWS.B], ['CARRY', ROWS.carry], ['ANSWER', ROWS.ans]]) addSign(label, x0 - 2.2, y, 60, { bg: '#151515', size: 0.032 });
      const cx = Math.floor(W / 2);
      for (const [sym, x] of [['1', cx - 2], ['0', cx + 2]]) {
        const s = addSlot({ role: 'crate', pad: 'crate', x, y: ROWS.crate, crate: sym, crateRole: roleOf(sym), label: sym === '1' ? '1 CUBES' : '0 CUBES', tag: { tagY: 170 },
          put: it => it.sym === sym ? null : { msg: 'That crate is for ' + sym + ' cubes.' } });
        s.show = makeCube(sym, roleOf(sym)); s.show.group.position.set((x + 0.5) * T, PAD_H + CUBE / 2 + 2, (ROWS.crate + 0.5) * T); worldG.add(s.show.group);
        if (sym === '1') R.one = s; else R.zero = s;
      }
      R.X = X;
      pos.x = cx; pos.y = 10.5;
    },
    placed(it, slot) {
      const c = R.colOf(slot.col);
      if (slot.role === 'ans') {
        R.bits[slot.col] = it.sym;
        if (M.m.missing) explain('Column worth ' + c.pv + ': A is ' + c.a + (c.cin ? ', the carry is 1' : '') + ' and the answer bit is ' + c.bit + '. With B = ' + c.b + ' there are ' + ones(c.count) + ': ' + RULE[c.count] + '. That matches the answer.');
        else if (R.ruled.has(slot.col)) explain('Column worth ' + c.pv + ': ' + ones(c.count) + ', so ' + RULE[c.count] + '.');
        else explain('Column worth ' + c.pv + ': ' + plus(c) + ' is ' + ones(c.count) + '. ' + breakdown(c));
      } else if (slot.role === 'carry') {
        R.carried[slot.col] = true;
        slot.items.forEach(killItem); slot.items = []; addItem(slot, { sym: '1', role: 'on', size: 0.7 });
        explain('The carry goes above the column worth ' + R.colOf(slot.col).pv + '. It is one more 1 to count in that column.');
      }
    },
    check() {
      const a = active();
      if (a >= 0) {
        const c = R.colOf(a);
        if (M.m.countAsk && !R.counted.has(a) && R.bits[a] == null && !R.ask) {
          R.counted.add(a);
          R.ask = { type: 'choice', q: 'How many 1s are in the column worth ' + c.pv + '? Count A, B and the carry.', options: ['0', '1', '2', '3'], answer: String(c.count),
            hint: 'Look down the column: the bit in A, the bit in B, and a carry if there is one above it.', why: 'There are ' + ones(c.count) + '.',
            done: () => explain(M.m.ruleAsk ? 'Column worth ' + c.pv + ': ' + plus(c) + '. That is ' + ones(c.count) + '.' : breakdown(c)) };
        } else if (M.m.ruleAsk && !R.ruled.has(a) && R.bits[a] == null && !R.ask) {
          // which combination of 0s and 1s gives which bit and carry: decided before any cube moves
          R.ruled.add(a);
          R.ask = { type: 'choice', wide: true, q: (R.counted.has(a) ? 'The column worth ' + c.pv + ' has ' + ones(c.count) + '.' : 'Look at the column worth ' + c.pv + ': A, B and the carry.') + ' What do you write, and what do you carry?', options: RULE_OPTS, answer: RULE_OPTS[c.count],
            hint: 'A column can only hold 0 or 1. Two 1s move left together as one carry. Whatever is left stays in this column.', why: 'The column has ' + ones(c.count) + ' (' + plus(c) + '). ' + breakdown(c),
            done: () => explain(breakdown(c)) };
        }
        return;
      }
      if (hand.item) return;
      if (M.m.denary && !R.denaryDone) {
        if (!R.ask) {
          const p = R.p;
          if (M.m.missing) R.ask = { type: 'num', q: 'Check it in denary. The answer is ' + (p.a + p.b) + ' and A is ' + p.a + '. What is your B, ' + R.bits.join('') + ', in denary?', answer: p.b,
            hint: 'Add the place values where B has a 1. It should be the answer take away A.', why: R.bits.join('') + ' is ' + p.b + ', and ' + (p.a + p.b) + ' - ' + p.a + ' = ' + p.b + '.',
            done: () => { R.denaryDone = true; explain(p.a + ' + ' + p.b + ' = ' + (p.a + p.b) + '. B is right.'); } };
          else R.ask = { type: 'num', q: 'Check it in denary. A is ' + p.a + ' and B is ' + p.b + '. What is your answer, ' + R.bits.join('') + ', in denary?', answer: p.a + p.b,
            hint: 'Add the place values where your answer has a 1.', why: R.bits.join('') + ' is ' + (p.a + p.b) + ', and ' + p.a + ' + ' + p.b + ' = ' + (p.a + p.b) + ', so the answer checks out.',
            done: () => { R.denaryDone = true; explain(p.a + ' + ' + p.b + ' = ' + (p.a + p.b) + ', the same as your answer. The binary sum is right.'); } };
        }
        return;
      }
      finishRound(M.m.missing ? 'B is <b>' + R.bits.join('') + '</b> (' + R.p.b + ' in denary).' : 'Answer: <b>' + R.bits.join('') + '</b> (' + (R.p.a + R.p.b) + ' in denary).');
    },
    guide(R, m) {
      const a = active(); if (a < 0 || R.ask) return null;
      const c = R.colOf(a), needCarry = R.bits[a] != null && c.cout && !R.carried[a - 1];
      if (m.type === 'challenge') {
        if (hand.item) return areaTarget(R.ans.concat(R.car).filter(s => s && !s.items.length));
        return areaTarget([R.one, R.zero]);
      }
      if (needCarry) return slotTarget(hand.item ? R.car[a - 1] : R.one);
      // which crate is the student's decision, unless the tutorial has just had them count the column
      return hand.item ? slotTarget(R.ans[a]) : m.countAsk ? slotTarget(c.bit ? R.one : R.zero) : areaTarget([R.one, R.zero]);
    },
    steps(R) {
      const n = R.p.n, out = [];
      for (let i = n - 1; i >= 0; i--) {
        const c = R.colOf(i);
        // the count and the answer show only once the column has been counted or done: predict first, then see it
        const seen = colDone(i) || (R.counted.has(i) && (!M.m.ruleAsk || R.ruled.has(i)) && !(R.ask && active() === i));
        if (M.m.missing && seen) { out.push({ text: 'Column worth <b>' + c.pv + '</b>: A ' + c.a + (c.cin ? ' + carry 1' : '') + ' + B ' + c.b + ' is ' + ones(c.count) + ', answer bit ' + c.bit + (c.cout ? ', carry 1.' : '.'), done: () => colDone(i) }); continue; }
        out.push({ text: seen ? 'Column worth <b>' + c.pv + '</b>: ' + plus(c) + ' is ' + ones(c.count) + '. Write ' + C(String(c.bit)) + (c.cout ? ', then carry ' + C('1') + ' above the column worth ' + c.pv * 2 + '.' : ', carry nothing.')
          : M.m.missing ? 'Column worth <b>' + c.pv + '</b>: which bit of B makes A, B and the carry give the answer bit? Then carry 1 if the column has two or three 1s.' : 'Column worth <b>' + c.pv + '</b>: count the 1s (A, B and the carry). Use the four rules to write the bit, and carry 1 if there are two or three.', done: () => colDone(i) });
      }
      if (M.m.denary) out.push({ text: 'Check the answer in denary.', done: () => R.denaryDone });
      return out;
    },
    goals(m) { if (m.missing) return ['Start at the right.', 'Pick the B bit so the 1s in the column (A, B and the carry) give the answer bit.', 'Carry 1 when the column has two or three 1s.'].concat(m.denary ? ['Check: B in denary is the answer take away A.'] : []); return ['Start at the right. Count the 1s in the column, with the carry.', 'No 1s: write 0. One 1: write 1. Two 1s: write 0, carry 1. Three 1s: write 1, carry 1.'].concat(m.denary ? ['Check: the two numbers in denary must add up to your answer.'] : []); },
    // the four rules, with the row for this column lit only once the tutorial has had you count and decide it
    rules(R, m) {
      const a = active();
      return rulesHtml(m.type === 'tutorial' && a >= 0 && R.counted.has(a) && (!m.ruleAsk || R.ruled.has(a)) && !R.ask ? R.colOf(a).count : -1);
    },
    expr(R) {
      const n = R.p.n, carries = [...Array(n).keys()].map(i => R.carried[i]);
      return (R.p.cite ? '<span class="note">' + R.p.cite + '</span>' : '') + boardHtml(R.p, R.bits, active(), carries, M.m.missing);
    },
    walk(R, m) {
      if (m.missing) {
        let p; do p = sum({ n: R.p.n, carries: 2, min: R.p.n === 8 ? 16 : 1 }); while (p.key === R.p.key);
        const n = p.n, bits = Array(n).fill(null), car = Array(n).fill(false);
        const steps = [{ text: '<b>A different one.</b> ' + bin(p.a, n) + ' + B = ' + bin(p.a + p.b, n) + '. Start at the right.', visual: boardHtml(p, bits, n - 1, car, true) }];
        for (const c of p.cols) {
          bits[c.i] = String(c.b); if (c.cout && c.i > 0) car[c.i - 1] = true;
          steps.push({ text: 'Column worth ' + c.pv + ': A is ' + c.a + (c.cin ? ', the carry is 1' : '') + ', the answer bit is ' + c.bit + '. B = ' + c.b + ' gives ' + ones(c.count) + ': ' + RULE[c.count] + '.', visual: boardHtml(p, bits, c.i, car, true) });
        }
        steps.push({ text: 'B is <span class="hl">' + bits.join('') + '</span>: ' + (p.a + p.b) + ' - ' + p.a + ' = ' + p.b + '. Now find yours.', visual: '' });
        return steps;
      }
      let p; do p = sum({ n: R.p.n, carries: 2, min: R.p.n === 8 ? 16 : 1 }); while (p.key === R.p.key);
      const n = p.n, bits = Array(n).fill(null), car = Array(n).fill(false);
      const steps = [{ text: '<b>A different sum.</b> ' + bin(p.a, n) + ' + ' + bin(p.b, n) + '. Start at the right.', visual: boardHtml(p, bits, n - 1, car) }];
      for (const c of p.cols) {
        bits[c.i] = String(c.bit); if (c.cout && c.i > 0) car[c.i - 1] = true;
        steps.push({ text: 'Column worth ' + c.pv + ': ' + plus(c) + ' is ' + ones(c.count) + '. ' + breakdown(c), visual: boardHtml(p, bits, c.i, car) });
      }
      steps.push({ text: 'Answer: <span class="hl">' + bits.join('') + '</span>. Check: ' + p.a + ' + ' + p.b + ' = ' + (p.a + p.b) + ' in denary. Now do yours.', visual: '' });
      return steps;
    }
  };
  // the column being added now: the rightmost one not finished (-1 when all are done)
  function colDone(i) { const c = R.colOf(i); return R.bits[i] != null && (!c.cout || i === 0 || R.carried[i - 1]); }
  function active() { for (let i = R.p.n - 1; i >= 0; i--) if (!colDone(i)) return i; return -1; }
  function ansPut(i, it) {
    const a = active(), c = R.colOf(i);
    if (R.bits[i] != null) return { msg: 'This column already has its bit.' };
    if (a >= 0 && i === a - 1 && R.bits[a] != null && R.colOf(a).cout) return { msg: 'First carry the 1: put a 1 cube in the carry row above the column worth ' + c.pv + '. Every carry matters.', mistake: true };
    if (i !== a) return { msg: 'Start at the right: finish the column worth ' + R.colOf(a).pv + ' first. Carries only move left.', mistake: true };
    if (M.m.missing && it.sym !== String(c.b)) { const k = c.a + Number(it.sym) + c.cin; return { msg: 'With B = ' + it.sym + ', A ' + c.a + (c.cin ? ' + carry 1' : '') + ' + B ' + it.sym + ' is ' + ones(k) + ', so the answer bit would be ' + (k % 2) + '. The answer has ' + c.bit + ' here.', mistake: true }; }
    if (!M.m.missing && it.sym !== String(c.bit)) return { msg: 'This column has ' + ones(c.count) + ' (' + plus(c) + '). ' + breakdown(c), mistake: true };
    return null;
  }
  function carryPut(i, it) {
    // the carry above column i comes from column i + 1, on its right
    const a = active(), src = R.colOf(i + 1);
    if (it.sym !== '1') return { msg: 'A carry is always 1. With no carry, leave the carry row empty.', mistake: true };
    if (R.carried[i]) return { msg: 'This column already has its carry.' };
    if (a >= 0 && i + 1 < a) return { msg: 'Start at the right: finish the column worth ' + R.colOf(a).pv + ' first. Carries only move left.', mistake: true };
    if (!src.cout) return { msg: 'The column worth ' + src.pv + ' has ' + ones(src.count) + ', so nothing is carried from it.', mistake: true };
    if (R.bits[i + 1] == null) return { msg: (M.m.missing ? 'Put the B bit' : 'Write the answer bit') + ' of the column worth ' + src.pv + ' first, then carry.' };
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
      const sum = el('summary', {}, 'The four column rules');
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
    let h, key = 'hold to grab', mode = '';
    const g = grabTarget(), s = g && g.slot, what = s && (s.crate ? 'a ' + s.crate + ' cube' : s.items.length ? ('the ' + top(s).sym + ' cube') : '');
    if (hand.item) { h = '<b>Keep holding Space</b> and walk to a pad. Let go of Space to put it down.'; key = 'keep holding'; mode = 'hold'; }
    else if (hand.pending) { h = '<b>Keep holding Space</b>...'; key = 'keep holding'; mode = 'hold'; }
    else if (R && R.ask) h = 'Predict on the right first.';
    else if (s && s.press) { h = '<b>Press Space</b> ' + s.pressText; key = 'press'; mode = 'press'; }
    else if (s && s.risky && !s.take(top(s))) { h = '<b>Hold Space</b> to pick up ' + what + '. It is already in place, so hold it down until the bar fills.'; key = 'hold to pick up'; mode = 'hold'; }
    else if (s) { h = '<b>Hold Space</b> to pick up ' + what + ', and keep holding to carry it.'; key = 'hold to pick up'; mode = 'hold'; }
    else h = 'Walk up to a crate. <b>Hold Space</b> (or the left mouse button) to pick it up, and keep holding to carry it. Right-drag turns the camera.';
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
    view.follow(pos.x, pos.y);
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS,
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
