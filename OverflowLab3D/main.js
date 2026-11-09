// Overflow Lab 3D: Year 11 1.7 Overflow in the lab of Network Builder 3D. The written method of 8-bit binary
// addition laid out on the floor: carries, the two numbers and the answer, with a 256 box outside the register.
// Count the 1s in each column from the right; a carry out of the 128 column is lost: overflow. Then say if there is
// overflow, give the stored value and pick the best explanation. The rules and wording are the lesson's
// (y11-1-7-overflow) and the 2D Overflow Lab's (OverflowLab/).
//
// The engine (controls, guide arrow, What just happened card, mission sheet, lesson mode, Walk me through it, the help
// rules: no help in challenges, later tutorials show the arrow only after a slip) is a fork of CpuLab3D/main.js.
// Progress: 'bc-overflow3d-v1:all:done' by mission id, best stars in ':all:stars', cloud-saved as app 'overflowlab3d'.
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
// ================================================================ 8-bit addition and overflow (a pure model, so it can be tested)
// The rules of the lesson y11-1-7-overflow and the 2D Overflow Lab (OverflowLab/js/logic.js): an 8-bit register
// holds 0 to 255. Binary addition starts at the right: count the 1s in a column (carry, top, bottom); 0 ones write 0,
// 1 one writes 1, 2 ones write 0 and carry 1, 3 ones write 1 and carry 1. A carry out of the 128 column needs a 256
// column the register does not have, so it is lost: overflow. The register keeps the 8 bits: the sum minus 256.
const PLACES = [128, 64, 32, 16, 8, 4, 2, 1];
const RULE_TEXT = ['write 0', 'write 1', 'write 0, carry 1', 'write 1, carry 1'];
const toBits = n => n.toString(2).padStart(8, '0');
// index 0 is the 128 column, index 7 the 1 column; carries[i] is the carry into column i, made[i] the carry out of it
function solve(a, b) {
  const A = toBits(a), B = toBits(b), answer = [], carries = [], ones = [], made = [];
  let carry = 0;
  for (let i = 7; i >= 0; i--) {
    carries[i] = carry;
    const n = carry + +A[i] + +B[i];
    ones[i] = n; answer[i] = n % 2; made[i] = n >= 2 ? 1 : 0; carry = made[i];
  }
  let chain = 0, run = 0;
  for (let k = 7; k >= 0; k--) { run = made[k] ? run + 1 : 0; if (run > chain) chain = run; }
  const sum = a + b;
  return { a: A, b: B, answer, carries, ones, made, out: carry, sum, stored: sum % 256, overflow: sum > 255, carryCount: made.reduce((x, y) => x + y, 0), chain };
}
// what each level asks for (the 2D lab's spec): range is the denary total, test an extra rule on the carries
function sumSpec(kind, L, over) {
  if (kind === 'fit') return { range: [null, over ? [300, 450] : [60, 200], over ? [266, 320] : [200, 245], over ? [256, 265] : [246, 255]][L], min: 10, test: () => true };
  const base = over ? [256, 480] : [40, 255];
  if (kind === 'exam') {
    if (L === 1) return { range: base, min: 16, test: s => s.carryCount >= 3 && s.carryCount <= 5 };
    if (L === 2) return { range: base, min: 16, test: s => s.carryCount >= 5 && s.chain >= 4 };
    return { range: over ? [256, 266] : [245, 255], min: 16, test: s => s.carryCount >= 4 };
  }
  if (L === 1) return { range: base, min: 16, test: s => s.carryCount >= 1 && s.carryCount <= 3 };
  if (L === 2) return { range: base, min: 16, test: s => s.carryCount >= 4 && s.carryCount <= 5 };
  return { range: base, min: 16, test: s => s.carryCount >= 6 || (Math.abs(s.sum - 255.5) < 17 && s.carryCount >= 3) };
}
function makeSum(kind, L, over, avoid = []) {
  const sp = sumSpec(kind, L, over); let fb = null;
  for (let t = 0; t < 4000; t++) {
    const S = rnd(sp.range[0], sp.range[1]), lo = Math.max(sp.min, S - 255), hi = Math.min(255, S - sp.min);
    if (lo > hi) continue;
    const a = rnd(lo, hi), b = S - a;
    if (avoid.includes(S) || avoid.includes(a + '+' + b) || avoid.includes(b + '+' + a)) continue;
    const s = solve(a, b);
    if (!fb) fb = { a, b };
    if (sp.test(s)) return { a, b };
  }
  return fb;
}
// one round of the column adder: o.over true, false, or left out for either
function addRound(o = {}) {
  const over = o.over ?? Math.random() < 0.5, q = makeSum(o.exam ? 'exam' : 'add', o.level || 1, over);
  return { a: q.a, b: q.b, sol: solve(q.a, q.b), key: q.a + '+' + q.b };
}
// Will it fit?: n cards, half of them overflow, every total different
function fitRound(o = {}) {
  const n = o.n || 4, outs = shuffle(Array.from({ length: n }, (_, i) => i % 2 === 0)), cards = [], used = [];
  for (const over of outs) {
    const q = makeSum('fit', o.level || 1, over, used); used.push(q.a + q.b);
    cards.push({ text: q.a + ' + ' + q.b, a: q.a, b: q.b, sum: q.a + q.b, over: q.a + q.b > 255 });
  }
  return { cards, key: cards.map(c => c.text).join('|') };
}
// Exam style: the best explanation, in mark scheme words, with three wrong ones of a similar length
const EXPLAIN = {
  over: { q: 'Explain why overflow happens here. Pick the best answer.',
    right: ['The result is greater than 255, so it needs more than 8 bits.', 'The result is too large to be stored in an 8-bit register.', 'The result needs a 9th bit, but the register has only 8 bits.'],
    wrong: ['The result is less than 0, so it cannot be stored in 8 bits.', 'The result is greater than 128, so it needs more than 8 bits.', 'The register has 9 bits, so the 9th bit is stored as well.', 'The two numbers are too small to be stored in 8 bits each.', 'The carry out of the 128 column is added to the 1 column.'] },
  fit: { q: 'Why is there no overflow here? Pick the best answer.',
    right: ['The result is not greater than 255, so it fits in 8 bits.', 'No carry leaves the 128 column, so 8 bits are enough.'],
    wrong: ['The result is greater than 255, but the register has room.', 'The carry out of the 128 column is kept in a 9th bit.', 'The register grows to 9 bits when the result needs it.', 'The result is less than 0, so the register stores it as 0.'] }
};
function explainAsk(over) {
  const set = EXPLAIN[over ? 'over' : 'fit'], right = pick(set.right);
  return { type: 'choice', plain: true, wide: true, q: set.q, options: [right].concat(shuffle(set.wrong).slice(0, 3)), answer: right,
    hint: 'Use the mark scheme words: greater than 255, more than 8 bits, an 8-bit register.', why: 'The best answer: ' + right };
}

// ================================================================ missions
const MISSIONS = [
  { id: 'fit-t', group: 'Will it fit?', title: 'Will It Fit?', type: 'tutorial', guided: true, kind: 'fit', mins: 4,
    intro: 'An <b>8-bit register</b> holds 0 to 255. Each card is an addition. Work it out in denary, then carry the card to <b>FITS</b> or <b>OVERFLOW</b>.',
    gen: () => fitRound({ n: 4, level: 1 }),
    after: { q: 'Why does 200 + 100 cause overflow in an 8-bit register?', options: ['300 is greater than 255, so it needs more than 8 bits.', '300 is greater than 128, so it needs more than 8 bits.', 'Both numbers are bigger than 99.'], why: 'An 8-bit register holds 0 to 255. 300 needs a 9th bit.' } },
  { id: 'fit2-t', group: 'Will it fit?', title: 'Closer to 255', type: 'tutorial', kind: 'fit', mins: 4,
    intro: 'These totals are closer to 255. Work each one out carefully, then carry it to <b>FITS</b> or <b>OVERFLOW</b>.',
    gen: () => fitRound({ n: 4, level: 2 }) },
  { id: 'fit-c', group: 'Will it fit?', title: 'Right at the Edge', type: 'challenge', kind: 'fit', mins: 5,
    intro: 'Six cards, all right at the edge of 255. Two clean rounds in a row.',
    gen: () => fitRound({ n: 6, level: 3 }) },

  { id: 'col-t', group: 'The column rule', title: 'Watch the Columns', type: 'tutorial', guided: true, kind: 'add', mode: 'machine', mins: 6,
    intro: 'Binary addition starts at the <b>right</b>. Press a column\'s answer box to add that column, and predict what it writes. A carry goes on top of the next column.',
    gen: () => addRound({ over: false, level: 1 }),
    after: { q: 'A column has a carry 1, a top 1 and a bottom 1. What does it do?', options: ['3 ones: write 1, carry 1.', '3 ones: write 0, carry 1.', '3 ones: write 3.'], why: 'Three 1s make 3, which is 11 in binary: write 1, carry 1.' } },
  { id: 'col2-t', group: 'The column rule', title: 'The Lost Carry', type: 'tutorial', kind: 'add', mode: 'machine', mins: 6,
    intro: 'Add each column from the right again. Watch what happens to the carry out of the <b>128</b> column.',
    gen: () => addRound({ over: true, level: 1 }),
    after: { q: 'Where does a carry out of the 128 column go?', options: ['Nowhere: the register has no 9th bit, so it is lost. That is overflow.', 'Into the 1 column, so nothing is lost.', 'Into a 9th bit of the register.'], why: 'An 8-bit register has no 256 column, so the carry is lost: overflow.' } },
  { id: 'col-c', group: 'The column rule', title: 'Column Rule Challenge', type: 'challenge', kind: 'add', mode: 'machine', mins: 7,
    intro: 'Predict every column, from the right. Then say if there is overflow. Two clean rounds in a row.',
    gen: () => addRound({ level: 2 }) },

  { id: 'add-t', group: 'Add it yourself', title: 'Add It Yourself', type: 'tutorial', guided: true, kind: 'add', mode: 'hand', mins: 7,
    intro: 'Now you write the answer. Start at the right. Carry a <b>0</b> or <b>1</b> cube to each answer box, and a <b>1</b> to the top of the next column for every carry.',
    gen: () => addRound({ over: false, level: 1 }) },
  { id: 'add2-t', group: 'Add it yourself', title: 'Add and Spot Overflow', type: 'tutorial', kind: 'add', mode: 'hand', mins: 7,
    intro: 'Add from the right. A carry out of the 128 column goes in the <b>256</b> box, outside the register. Then say if there is overflow.',
    gen: () => addRound({ over: true, level: 2 }) },
  { id: 'add-c', group: 'Add it yourself', title: 'Addition Challenge', type: 'challenge', kind: 'add', mode: 'hand', mins: 8,
    intro: 'Add the two numbers and say if there is overflow. Two clean rounds in a row.',
    gen: () => addRound({ level: 2 }) },
  { id: 'chain-c', group: 'Add it yourself', title: 'Long Carry Chains', type: 'challenge', kind: 'add', mode: 'hand', mins: 8,
    intro: 'Lots of carries in a row. Count the 1s in every column, with the carry. Two clean rounds in a row.',
    gen: () => addRound({ level: 3 }) },

  { id: 'store-t', group: 'What is stored?', title: 'What the Register Keeps', type: 'tutorial', guided: true, kind: 'add', mode: 'hand', stored: true, mins: 6,
    intro: 'When there is overflow, the register keeps only its 8 bits. Add the numbers, then work out the denary value the register stores.',
    gen: () => addRound({ over: true, level: 1 }),
    after: { q: 'After overflow, why is the stored value wrong?', options: ['The lost carry was worth 256, so the register stores 256 less.', 'The register stores the two numbers instead.', 'The register stores 255 every time.'], why: 'The carry out of the 128 column is worth 256. Without it, the register holds the sum minus 256.' } },
  { id: 'store-c', group: 'What is stored?', title: 'Stored Value Challenge', type: 'challenge', kind: 'add', mode: 'hand', stored: true, mins: 7,
    intro: 'Add, say if there is overflow, and give the denary value the register stores. Two clean rounds in a row.',
    gen: () => addRound({ level: 2 }) },

  { id: 'exam-t', group: 'Exam style', title: 'Exam Question', type: 'tutorial', kind: 'add', mode: 'hand', stored: true, explain: true, mins: 8,
    intro: 'Like an exam question: add the numbers, say if there is overflow, give the stored value in denary, and pick the best explanation.',
    gen: () => addRound({ over: true, exam: true, level: 1 }) },
  { id: 'exam-c', group: 'Exam style', title: 'Exam Challenge', type: 'challenge', kind: 'add', mode: 'hand', stored: true, explain: true, mins: 8,
    intro: 'The whole exam question, with no help. Two clean rounds in a row.',
    gen: () => addRound({ exam: true, level: 2 }) },
  { id: 'edge-c', group: 'Exam style', title: 'Close to 255', type: 'challenge', kind: 'add', mode: 'hand', stored: true, explain: true, mins: 8,
    intro: 'Every sum is close to 255. One carry decides it. Two clean rounds in a row.',
    gen: () => addRound({ exam: true, level: 3 }) },
  { id: 'pro-c', group: 'Exam style', title: 'Overflow Without Help', type: 'challenge', kind: 'add', mode: 'hand', stored: true, explain: true, noHelp: true, need: 3, mins: 10,
    intro: 'No rules on the sheet and no help. Three clean rounds in a row.',
    gen: () => addRound({ exam: true, level: 1 + Math.floor(Math.random() * 3) }) }
];
export { MISSIONS };
const SECTIONS = ['Will it fit?', 'The column rule', 'Add it yourself', 'What is stored?', 'Exam style'];
// Lesson mode: Year 11 1.7 Overflow
const LESSONS = [
  { id: '1.7', title: '1.7: Overflow', missions: ['fit-t', 'fit-c', 'col-t', 'add-t', 'add2-t', 'add-c', 'exam-t'], ext: ['fit2-t', 'col2-t', 'col-c', 'chain-c', 'store-t', 'store-c', 'exam-c', 'edge-c', 'pro-c'] }
];
const minsOf = m => m.mins || 7;


// ================================================================ saving and results
const STORE = 'bc-overflow3d-v1:';
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
  const log = results('overflowlab3d', 'Overflow Lab 3D');
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
    view.zoom?.(1500, 0.9);   // far enough back to see the whole sum
    pos.face = Math.PI; view.jump(camX(), pos.y - camAhead());
    toast(''); explainReset();
    if (after) { explain('Not this time. ' + after + ' A new round has started.'); R.why = after; toast('A mistake, so a new round has started. ' + after, 'bad'); }
    explain(startLine(m, p)); $('mission').scrollTop = 0; afterChange();   // to the top first, so a question at the start can scroll into view
  }
  // the buses: look a little ahead of the player, so the address bus at the back is not under the card at the top
  const camAhead = () => 0;
  const camX = () => 9.5 + (pos.x - 9.5) * 0.4;
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

  // ---------------------------------------------------------------- the written method, laid out on the floor
  // Column c is 0 (the 256 box, outside the register) to 8 (the 1 column), at tile X0 + c. Rows: carry pads (the carry
  // INTO a column), the top number, the bottom number, the answer pads. Machine mode: press a column's answer box and
  // predict the rule; the machine writes the bit and moves the carry. Hand mode: carry 0 and 1 cubes from the crates.
  // Then OVERFLOW or NO OVERFLOW, the stored value and the explanation where the mission asks for them.
  const KIND = {};
  const X0 = 5, CY = 3, AY = 4, BY = 5, NY = 6, PY = 9;
  const PV = [256, 128, 64, 32, 16, 8, 4, 2, 1];
  const colName = c => 'the ' + PV[c] + ' column';
  const bitCube = (b, extra) => cube(String(b), Object.assign({ role: String(b) === '1' ? 'on' : 'off', bit: String(b) }, extra || {}));
  const S = () => R.p.sol;
  const ch = () => M.m.type === 'challenge';
  // the column c's numbers (c is 1..8): carry in, top, bottom, the 1s, the rule
  const colInfo = (sol, c) => ({ cin: sol.carries[c - 1], t: +sol.a[c - 1], b: +sol.b[c - 1], n: sol.ones[c - 1], bit: sol.answer[c - 1], made: sol.made[c - 1] });
  const ones = n => n === 1 ? '1 one' : n + ' ones';
  const colWhy = (sol, c) => { const k = colInfo(sol, c); return colName(c)[0].toUpperCase() + colName(c).slice(1) + ': carry ' + k.cin + ', top ' + k.t + ', bottom ' + k.b + '. ' + ones(k.n) + ': ' + RULE_TEXT[k.n] + '.'; };
  // where the carry out of column c goes: the carry pad of the column to its left, or the 256 box
  const carryTo = c => c === 1 ? R.ans[0] : R.car[c - 1];
  function colDone(c) { const k = colInfo(S(), c); return R.ans[c].items.length > 0 && (!k.made || carryTo(c).items.length > 0); }
  // a wrong move: a mistake in a challenge (a new round), a slip in a tutorial (the arrow comes in)
  function bad(msg) { if (ch()) return { msg, mistake: true }; R.slipped = true; return { msg }; }
  function badNow(msg) { if (ch()) { mistake(msg); return; } R.slipped = true; toast(msg, 'bad'); explain('Not this time. ' + msg); drawAll(); }
  function advance() {
    while (R.at >= 1 && colDone(R.at)) R.at--;
    if (R.at === 0 && R.phase === 'add') { R.phase = 'decide'; explain(S().out ? 'Every column is added. A carry left the 128 column. Is there overflow?' : 'Every column is added. Is there overflow?'); }
  }
  function loseCarry() {
    const s = R.ans[0]; s.items.forEach(killItem); s.items = [];
    addItem(s, cube('1', { role: 'unknown', bit: '1', lost: true }));
    explain('A carry leaves the 128 column. It needs a 256 column, but the register has only 8 bits. This 1 is <b>lost</b>.');
  }
  KIND.add = {
    start(m, p) { return 'Add the two 8-bit numbers. Start at the right: ' + colName(8) + '.'; },
    setup(R, m) {
      const p = R.p, sol = p.sol, hand1 = m.mode === 'hand';
      newWorld(22, 12, '8-bit addition');
      R.at = 8; R.phase = 'add'; R.asks = []; R.ai = 0;
      R.car = []; R.ans = [];
      for (let c = 0; c <= 8; c++) {
        const x = X0 + c;
        if (c >= 1 && c <= 7) R.car[c] = addSlot({ role: 'carry', pad: 'rail', x, y: CY, col: c, take: () => 'A carry stays where it is written.', put: (it, from) => carryPut(c, it, from) });
        if (c >= 1) {
          const a = addSlot({ role: 'bitA', pad: 'pedestal', x, y: AY, take: () => 'This is the top number.' }); addItem(a, bitCube(sol.a[c - 1]));
          const b = addSlot({ role: 'bitB', pad: 'pedestal', x, y: BY, take: () => 'This is the bottom number.' }); addItem(b, bitCube(sol.b[c - 1]));
        }
        R.ans[c] = addSlot(Object.assign({ role: c ? 'ans' : 'box256', pad: c ? 'answer' : 'target', x, y: NY, col: c, label: String(PV[c]), tag: { tagY: 26, tagSize: 0.034 },
          take: () => c ? 'This bit is written.' : 'This carry is lost.' },
          hand1 ? { put: (it, from) => c ? ansPut(c, it, from) : boxPut(it, from) } : c ? { press: () => machPress(c), pressText: 'to add ' + colName(c) + '.' } : { put: () => ({ msg: 'The machine moves the carries.' }) }));
      }
      const plus = addSlot({ role: 'plus', pad: 'pedestal', x: X0, y: BY, take: () => 'The two numbers are added.' }); addItem(plus, cube('+', { role: 'op' }));
      addSign('8-BIT REGISTER: 0 TO 255', X0 + 4.5, 1, 230, { bg: '#2b8a3e', ink: '#ffffff', size: 0.05 });
      addSign('NO 9TH BIT', X0 - 1.6, NY, 150, { bg: '#c92a2a', ink: '#ffffff', size: 0.032 });
      if (hand1) {
        R.c0 = addSlot({ role: 'crate', pad: 'crate', x: 7, y: PY, crate: '0', crateRole: 'off', label: '0', tag: { tagY: 26 } });
        R.c1 = addSlot({ role: 'crate', pad: 'crate', x: 9, y: PY, crate: '1', crateRole: 'on', label: '1', tag: { tagY: 26 } });
      }
      R.no = addSlot({ role: 'no', pad: 'answer', x: 13, y: PY, label: 'NO OVERFLOW', tag: { tagY: 130 }, press: () => decide(false), pressText: 'to say: no overflow.' });
      R.yes = addSlot({ role: 'yes', pad: 'target', x: 16, y: PY, label: 'OVERFLOW', tag: { tagY: 130 }, press: () => decide(true), pressText: 'to say: overflow.' });
      pos.x = 11; pos.y = 7.5;
    },
    placed(it, slot) {
      if (slot.role === 'ans') { explain('Written: <b>' + it.bit + '</b> in ' + colName(slot.col) + '.'); advance(); }
      else if (slot.role === 'carry') { explain('The carry 1 goes on top of ' + colName(slot.col) + '.'); advance(); }
      else if (slot.role === 'box256') { loseCarry(); advance(); }
    },
    check() { },
    guide(R, m) {
      if (R.ask) return null;
      if (R.phase === 'decide') return slotTarget(S().overflow ? R.yes : R.no);
      if (R.phase !== 'add') return null;
      const c = R.at, k = colInfo(S(), c), needAns = !R.ans[c].items.length, needCar = k.made && !carryTo(c).items.length;
      if (m.mode === 'machine') return slotTarget(R.ans[c]);
      if (hand.item) {
        const b = hand.item.bit;
        if (needAns && String(k.bit) === b) return slotTarget(R.ans[c]);
        if (!needAns && needCar && b === '1') return slotTarget(carryTo(c));
        return slotTarget(b === '1' ? R.c1 : R.c0);
      }
      if (needAns) return slotTarget(k.bit ? R.c1 : R.c0);
      return needCar ? slotTarget(R.c1) : null;
    },
    steps(R, m) {
      const out = [];
      for (let c = 8; c >= 1; c--) out.push({ text: c === 8 ? 'Start at the right: ' + colName(8) + '. Count the 1s, then ' + (m.mode === 'hand' ? 'write the bit. A carry goes on top of the next column.' : 'press its answer box and predict.') : c === 1 ? colName(1)[0].toUpperCase() + colName(1).slice(1) + '. A carry out of it goes in the 256 box.' : colName(c)[0].toUpperCase() + colName(c).slice(1) + '.', done: () => R.at < c || R.over });
      out.push({ text: 'Press <b>OVERFLOW</b> or <b>NO OVERFLOW</b>.', done: () => R.phase === 'asks' || R.over });
      if (m.stored) out.push({ text: 'Give the denary value the register stores.', done: () => R.over || (R.phase === 'asks' && R.ai >= 1) });
      if (m.explain) out.push({ text: 'Pick the best explanation.', done: () => R.over });
      return out;
    },
    goals(m) { return m.noHelp ? [] : ['Count the 1s in a column, with the carry.', '0 ones: write 0. 1 one: write 1.', '2 ones: write 0, carry 1. 3 ones: write 1, carry 1.', 'A carry out of the 128 column is lost: overflow.']; },
    expr(R) {
      const car = R.car.map(s => s && s.items.length ? '1' : ''), ans = R.ans.map(s => s.items.length ? top(s).bit : '');
      return '<b>Add:</b>' + sumHtml(S(), car, ans, R.phase === 'add' ? R.at : -1);
    },
    walk(R, m) {
      let p; do p = addRound({ over: S().overflow, level: 1 }); while (p.key === R.p.key);
      const sol = p.sol, car = Array(9).fill(''), ans = Array(9).fill(''), steps = [{ text: '<b>A different sum.</b> Start at the right.', visual: sumHtml(sol, car, ans, 8) }];
      for (let c = 8; c >= 1; c--) {
        const k = colInfo(sol, c); ans[c] = String(k.bit);
        if (k.made) { if (c === 1) ans[0] = '1'; else car[c - 1] = '1'; }
        steps.push({ text: colWhy(sol, c) + (k.made && c === 1 ? ' The carry goes in the 256 box, outside the register: it is lost.' : k.made ? ' The carry goes on top of ' + colName(c - 1) + '.' : ''), visual: sumHtml(sol, car, ans, c) });
      }
      steps.push({ text: sol.overflow ? 'A carry left the 128 column: <span class="hl">overflow</span>.' : 'No carry left the 128 column: <span class="hl">no overflow</span>.', visual: '' });
      if (m.stored) steps.push({ text: 'The register stores ' + sol.answer.join('') + '. Add the place values of its 1s: ' + storedSum(sol) + ' = <span class="hl">' + sol.stored + '</span>.', visual: '' });
      steps.push({ text: 'Now add yours the same way.', visual: '' });
      return steps;
    }
  };
  function storedSum(sol) { const parts = sol.answer.map((b, i) => b ? PLACES[i] : 0).filter(Boolean); return parts.length ? parts.join(' + ') : '0'; }
  // the written sum: place values, carries, the two numbers, the answer (and the 256 box); hl is the column being added
  function sumHtml(sol, car, ans, hl) {
    const td = (v, c, cls) => '<td class="' + (cls || '') + (c === hl ? ' now' : '') + (c === 0 ? ' out' : '') + '">' + v + '</td>';
    let h = '<div class="ov-wrap"><table class="ov-sum"><tr><th></th>' + PV.map((v, c) => '<th class="' + (c === 0 ? 'out' : '') + (c === hl ? ' now' : '') + '">' + v + '</th>').join('') + '</tr>';
    h += '<tr><th>carry</th>' + PV.map((v, c) => td(c >= 1 && c <= 7 ? car[c] || '' : '', c, 'car')).join('') + '</tr>';
    h += '<tr><th></th>' + PV.map((v, c) => td(c ? sol.a[c - 1] : '', c)).join('') + '</tr>';
    h += '<tr><th>+</th>' + PV.map((v, c) => td(c ? sol.b[c - 1] : '', c)).join('') + '</tr>';
    h += '<tr class="ans"><th>=</th>' + PV.map((v, c) => td(ans[c] || '', c, c === 0 && ans[0] ? 'lost' : '')).join('') + '</tr></table></div>';
    return h;
  }
  // hand mode: an answer bit
  function ansPut(c, it, from) {
    if (from === R.ans[c]) return null;
    if (it.bit == null) return { msg: 'Only a 0 or 1 cube goes here.' };
    if (R.ans[c].items.length) return { msg: 'That bit is written.' };
    if (R.phase !== 'add') return { msg: 'Every column is added.' };
    if (c < R.at) return bad('Start at the right. Finish ' + colName(R.at) + ' first.');
    const k = colInfo(S(), c);
    if (String(k.bit) !== it.bit) return bad(colWhy(S(), c));
    return null;
  }
  // hand mode: a carry onto the top of column j (it comes out of column j + 1)
  function carryPut(j, it, from) {
    if (from === R.car[j]) return null;
    if (it.bit == null) return { msg: 'Only a carry 1 goes here.' };
    if (it.bit === '0') return { msg: 'Only write a carry when there is one. No carry means the box stays empty.' };
    if (R.car[j].items.length) return { msg: 'That carry is written.' };
    const c = j + 1;
    if (c < R.at) return bad('Start at the right. Finish ' + colName(R.at) + ' first.');
    if (!colInfo(S(), c).made) return bad(colWhy(S(), c) + ' No carry.');
    return null;
  }
  // hand mode: the 256 box, outside the register
  function boxPut(it, from) {
    if (from === R.ans[0]) return null;
    if (it.bit == null) return { msg: 'Only a carry 1 goes here.' };
    if (it.bit === '0') return { msg: 'Only a carry out of the 128 column goes here.' };
    if (R.ans[0].items.length) return { msg: 'The box is full.' };
    if (R.at > 1) return bad('Start at the right. Finish ' + colName(R.at) + ' first.');
    if (!S().made[0]) return bad(colWhy(S(), 1) + ' No carry leaves the 128 column.');
    return null;
  }
  // machine mode: press a column's answer box, then predict its rule
  function machPress(c) {
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    if (R.phase !== 'add' || c > R.at) { toast(colName(c)[0].toUpperCase() + colName(c).slice(1) + ' is added.', 'hint'); return; }
    if (c < R.at) { badNow('Start at the right. Add ' + colName(R.at) + ' first.'); return; }
    const sol = S(), k = colInfo(sol, c), lvl = M.m.guided ? 0 : ch() ? 2 : 1;
    const q = lvl === 0 ? colName(c)[0].toUpperCase() + colName(c).slice(1) + ': carry ' + k.cin + ', top ' + k.t + ', bottom ' + k.b + '. That is ' + ones(k.n) + '. What does it do?'
      : lvl === 1 ? colName(c)[0].toUpperCase() + colName(c).slice(1) + ': carry ' + k.cin + ', top ' + k.t + ', bottom ' + k.b + '. What does it do?'
        : colName(c)[0].toUpperCase() + colName(c).slice(1) + ': what does it do?';
    R.ask = { type: 'choice', plain: true, wide: true, q, options: RULE_TEXT.slice(), answer: RULE_TEXT[k.n], hint: 'Count the 1s: the carry on top (empty is 0), the top bit and the bottom bit.', why: colWhy(sol, c),
      done: () => {
        addItem(R.ans[c], bitCube(k.bit));
        if (k.made) { if (c === 1) loseCarry(); else { addItem(R.car[c - 1], bitCube(1)); explain(colWhy(sol, c) + ' The carry goes on top of ' + colName(c - 1) + '.'); } }
        else explain(colWhy(sol, c));
        advance();
      } };
  }
  // OVERFLOW or NO OVERFLOW, then the questions the mission asks
  function decide(over) {
    if (R.ask) { toast('Answer on the right first.', 'hint'); return; }
    if (R.phase === 'asks') { toast('Answer on the right.', 'hint'); return; }
    if (R.phase !== 'decide') { badNow('Finish the addition first: every column, from the right to the 128 column.'); return; }
    const sol = S();
    if (over !== sol.overflow) { badNow(sol.overflow ? 'A carry left the 128 column into the 256 box. The register has no 9th bit: overflow.' : 'No carry left the 128 column, so the result fits in 8 bits: no overflow.'); return; }
    explain(sol.overflow ? 'Overflow: the result needs more than 8 bits.' : 'No overflow: the result fits in 8 bits.');
    R.phase = 'asks'; R.ai = 0; R.asks = [];
    if (M.m.stored) R.asks.push({ type: 'num', plain: true, q: 'The register stores <b>' + sol.answer.join('') + '</b>. What is that in denary?', answer: sol.stored,
      hint: 'Add the place values of the 1s in the 8 register bits. The 256 box is not in the register.', why: storedSum(sol) + ' = ' + sol.stored + '.' });
    if (M.m.explain) R.asks.push(explainAsk(sol.overflow));
    ovNext();
  }
  function ovNext() {
    const a = R.asks[R.ai], sol = S();
    if (!a) { finishRound('In denary: ' + R.p.a + ' + ' + R.p.b + ' = ' + sol.sum + '. ' + (sol.overflow ? 'That is greater than 255: overflow. The register stores ' + sol.stored + '.' : 'That fits in 8 bits.')); return; }
    R.ask = Object.assign({}, a, { done: () => { explain(a.why); R.ai++; ovNext(); } });
  }

  // ---------------------------------------------------------------- Will it fit?: carry each addition card to FITS or OVERFLOW
  KIND.fit = {
    start() { return 'An 8-bit register holds 0 to 255.'; },
    setup(R, m) {
      const cards = R.p.cards, W = Math.max(22, cards.length * 3 + 6);
      newWorld(W, 12, 'Will it fit?');
      const mk = (over, x) => { const s = addSlot({ role: 'pad', pad: over ? 'target' : 'answer', x, y: 4, grow: 'pile', over, label: over ? 'OVERFLOW' : 'FITS: 0 TO 255', tag: { tagY: 140 },
        take: () => 'This card is sorted.', put: (it, from) => from === s ? null : !it.card ? { msg: 'Only cards go here.' } : it.over === over ? null : { msg: fitWhy(it), mistake: true } }); return s; };
      R.fits = mk(false, Math.floor(W / 2) - 4); R.over_ = mk(true, Math.floor(W / 2) + 3);
      addSign('8-BIT REGISTER: 0 TO 255', Math.floor(W / 2), 2, 230, { bg: '#2b8a3e', ink: '#ffffff', size: 0.05 });
      const x0 = Math.floor((W - (cards.length - 1) * 3) / 2);
      R.shelf = cards.map((c, i) => { const s = addSlot({ role: 'shelf', pad: 'supply', x: x0 + i * 3, y: 9, put: (it, from) => from === s ? null : s.items.length ? { msg: 'That spot is full.' } : null });
        addItem(s, { card: true, text: c.text, over: c.over, sum: c.sum, sym: c.text, role: 'card' }); return s; });
      R.placedN = 0; pos.x = Math.floor(W / 2); pos.y = 7;
    },
    placed(it, slot) { if (slot.role === 'pad') { R.placedN++; explain(it.text + ' = ' + it.sum + '. ' + (it.over ? 'Greater than 255: it needs more than 8 bits. <b>Overflow</b>.' : 'Not greater than 255: it <b>fits</b> in 8 bits.')); } },
    check() { if (R.placedN === R.p.cards.length && !hand.item) finishRound('Every card is sorted.'); },
    guide(R, m) {
      if (hand.item) return hand.item.card ? slotTarget(hand.item.over ? R.over_ : R.fits) : null;
      const s = R.shelf.find(x => x.items.length); return s ? slotTarget(s) : null;
    },
    steps(R) { return R.p.cards.map(c => ({ text: 'Work out <b>' + c.text + '</b>. Bigger than 255? Carry it to <b>OVERFLOW</b>. Otherwise <b>FITS</b>.', done: () => [R.fits, R.over_].some(s => s.items.some(x => x.text === c.text)) })); },
    goals() { return ['An 8-bit register holds 0 to 255.', 'A result greater than 255 needs more than 8 bits: overflow.']; },
    expr(R) { const c = hand.item && hand.item.card ? hand.item : null; return '<b>Cards sorted:</b> ' + R.placedN + ' of ' + R.p.cards.length + (c ? '<br><b>You are carrying:</b> ' + c.text : '<br>Walk up to a card to read it.'); },
    walk(R) {
      const p = fitRound({ n: 4, level: 1 }), steps = [{ text: '<b>Different cards.</b> Add each one in denary. Then compare with 255.', visual: '' }];
      p.cards.forEach(c => steps.push({ text: c.text + ' = ' + c.sum + ': ' + (c.over ? 'greater than 255, so <span class="hl">overflow</span>.' : 'not greater than 255, so it <span class="hl">fits</span>.'), visual: '' }));
      steps.push({ text: 'Now sort your own cards.', visual: '' });
      return steps;
    }
  };
  function fitWhy(it) { return it.text + ' = ' + it.sum + '. ' + (it.over ? 'That is greater than 255, so it needs more than 8 bits: overflow.' : 'That is not greater than 255, so it fits in 8 bits.'); }

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
    if (s.crate) { hand.item = cube(s.crate, { role: s.crateRole || 'paren', bit: s.crateRole ? s.crate : undefined }); itemMesh(hand.item); hand.from = s; hand.since = clock; afterChange(); return; }
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
    get M() { return M; }, get R() { return R; }, pos, hand, setHand, start, newRound, free, solidAt, handPos, grabTarget, guideTarget, missions: MISSIONS, model: { solve, makeSum, addRound, fitRound, RULE_TEXT },
    get slots() { return slots; }, get done() { return done; }, get arrows() { return arrows.count; }, get outlined() { return outlineG.children.length; }, get glowing() { return glowing; },
    toastText: () => $('toast').textContent, lessonMode, startLesson, nextMission, LESSONS, minsOf, KIND, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, nearestSlot
  };
  return { stop() { } };
}
