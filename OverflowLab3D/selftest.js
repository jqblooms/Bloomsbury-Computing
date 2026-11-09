// Overflow Lab 3D self-test. Plays every mission with the pupil's controls, then tries to break it.
// Run: open index.html?debug=1, then
//   setTimeout(async () => { const t = await import('./selftest.js?' + Date.now()); await t.run({ parts: ['play', 'break', 'fuzz'] }); }, 0)
// and read window.__selftest.
const s = () => window.__lab;
const $ = id => document.getElementById(id);
let fails = [];
const ok = (c, msg) => { if (!c) fails.push(msg); return !!c; };
const R = () => s().R, M = () => s().M;
const top = sl => sl.items[sl.items.length - 1];

// ---------------------------------------------------------------- moving like a student
function bfs(gx, gy) {
  const p = s().pos, sx = Math.round(p.x), sy = Math.round(p.y), key = (x, y) => x + ',' + y;
  const prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === gx && y === gy) { const out = []; let k = key(x, y); while (k) { out.unshift(k.split(',').map(Number)); k = prev.get(k); } return out.slice(1); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || !s().free(nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  return null;
}
function walkTo(x, y, face) {
  const p = s().pos, route = bfs(Math.round(x), Math.round(y));
  if (!route) throw new Error('no way to walk to ' + x.toFixed(2) + ', ' + y.toFixed(2));
  for (const [qx, qy] of route.concat([[x, y]])) {
    for (let g = 0; g < 200; g++) {
      const dx = qx - p.x, dy = qy - p.y, d = Math.hypot(dx, dy);
      if (d < 1e-3) break;
      const st = Math.min(0.2, d), nx = p.x + dx / d * st, ny = p.y + dy / d * st;
      if (!s().free(nx, ny)) throw new Error('walked into something at ' + nx.toFixed(2) + ', ' + ny.toFixed(2));
      p.x = nx; p.y = ny; p.face = Math.atan2(dx, dy);
    }
  }
  if (face != null) p.face = face;
  s().frame(1);
}
// stand next to a slot (one of its tiles), facing it, so the grab point is on it
function reach(sl) {
  for (let k = 0; k < sl.w; k++) for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
    const tx = sl.x + k, px = tx + dx * 0.8, py = sl.y + dy * 0.8;
    if (!s().free(px, py) || !bfs(Math.round(px), Math.round(py)) && !(Math.round(px) === Math.round(s().pos.x) && Math.round(py) === Math.round(s().pos.y))) continue;
    walkTo(px, py, Math.atan2(-dx, -dy));
    const n = s().nearestSlot(0.9, x => !x.press);
    if (n === sl || sl.press) return;
  }
  throw new Error('cannot reach ' + sl.role + ' at ' + sl.x + ',' + sl.y);
}
const press = () => { s().setHand(true); s().frame(12); }, release = () => { s().setHand(false); s().frame(1); };
function take(sl) { reach(sl); press(); return s().hand.item; }
function put(sl) { reach(sl); release(); }
let lastDone = 0, lastId = '';
function tickCheck() {
  if (M().m.type !== 'tutorial' || M().phase !== 'play') return;
  if (lastId !== R()) { lastId = R(); lastDone = 0; }
  const n = document.querySelectorAll('#mission .steps li.done').length;
  ok(n >= lastDone, M().m.id + ': a ticked step came unticked');
  lastDone = n;
}
function arrowCheck() { tickCheck(); s().frame(2); const g = s().guideTarget(), p = s().pos; if (g && M().m.type === 'tutorial' && Math.hypot(g.x - p.x, g.y - p.y) > g.reach + 0.3) ok(s().arrows > 0, M().m.id + ': no arrow to ' + g.x + ',' + g.y);  }
function carry(from, to) { arrowCheck(); const it = take(from); arrowCheck(); if (!it) throw new Error('nothing taken from ' + from.role + ' (' + s().toastText() + ')'); put(to); return it; }
function clickBtn(text) { const b = [...document.querySelectorAll('#mission button, #card button')].find(x => x.textContent.trim() === text && !x.disabled); if (!b) throw new Error('no button ' + text); b.click(); s().frame(1); }
const hasBtn = text => [...document.querySelectorAll('#mission button')].some(x => x.textContent.trim() === text && !x.disabled);
function answer(right = true) {
  const a = R().ask; if (!a) throw new Error('no prediction waiting');
  if (a.type === 'choice') { const want = right ? a.answer : a.options.find(o => o !== a.answer); const b = [...document.querySelectorAll('#mission .ask-opts button')].find(x => x.textContent.trim() === want); if (!b) throw new Error('no choice ' + want); b.click(); s().frame(1); return; }
  if (a.type === 'num') { const v = right ? a.answer : a.answer + 1; $('clAsk').value = String(v); }
  else {
    const want = right ? a.answer : a.answer.replace(/^./, c => c === '1' ? '0' : '1');
    for (let i = 0; i < want.length; i++) { const b = () => document.querySelectorAll('.cl-pick button')[i]; let k = 0; while (b().textContent !== want[i] && k++ < 3) b().click(); }
  }
  clickBtn('Check');
}
function afterQ() { const m = M().m; if (M().phase === 'done' && !M().afterOk) clickBtn(m.after.options[0]); }


// ---------------------------------------------------------------- solving a round from whatever state it is in
function pressPad(sl) { reach(sl); s().setHand(true); s().setHand(false); s().frame(1); }
const L = () => s().model;
const colOf = (sol, c) => ({ bit: sol.answer[c - 1], made: sol.made[c - 1] });
function solveAdd() {
  const r = R(), m = M().m, lab = s(), sol = r.p.sol;
  for (let g = 0; g < 80 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    if (r.phase === 'decide') { pressPad(sol.overflow ? r.yes : r.no); continue; }
    const c = r.at, k = colOf(sol, c);
    if (m.mode === 'machine') { pressPad(r.ans[c]); continue; }
    if (!r.ans[c].items.length) { carry(k.bit ? r.c1 : r.c0, r.ans[c]); continue; }
    carry(r.c1, c === 1 ? r.ans[0] : r.car[c - 1]);
  }
  ok(r.over, m.id + ' round did not finish (' + s().toastText() + ')');
}
function solveFit() {
  const r = R();
  for (let g = 0; g < 20 && !r.over; g++) { const sh = r.shelf.find(x => x.items.length); if (!sh) break; const it = top(sh); carry(sh, it.over ? r.over_ : r.fits); }
  ok(r.over, M().m.id + ' fit round did not finish (' + s().toastText() + ')');
}
const SOLVE = { add: solveAdd, fit: solveFit };
function playMission(i) {
  s().start(i);
  const m = M().m;
  for (let round = 0; round < 6 && M().phase !== 'done'; round++) {
    if (R().over) clickBtn('Next round');
    SOLVE[m.kind]();
  }
  ok(M().phase === 'done', m.id + ' not done (' + s().toastText() + ')');
  afterQ();
  ok(M().afterOk, m.id + ' why question not answered');
  ok(s().done[m.id], m.id + ' not saved as done');
}
const idx = id => s().missions.findIndex(m => m.id === id);
const newRoundAfter = r => R() !== r && M().have === 0 && M().spoilt >= 1;

// ---------------------------------------------------------------- break tests
const T = {};
T.model = () => {
  const x = L().solve(200, 100);
  ok(x.overflow && x.stored === 44 && x.out === 1, '200 + 100 does not overflow to 44');
  const y = L().solve(15, 1);
  ok(y.answer.join('') === '00010000' && y.carryCount === 4 && !y.overflow, '15 + 1 is wrong');
  for (let k = 0; k < 60; k++) { const p = L().addRound({ level: 1 + k % 3, exam: k % 2 === 0 }); ok(p.a >= 10 && p.b >= 10 && p.a <= 255 && p.b <= 255, 'a number does not fit in 8 bits: ' + p.key); }
  for (let k = 0; k < 30; k++) { const p = L().fitRound({ n: 6, level: 3 }); ok(new Set(p.cards.map(c => c.sum)).size === 6, 'a fit round repeats a total'); ok(p.cards.filter(c => c.over).length === 3, 'a fit round is not half overflow'); }
};
T.addRules = () => {
  s().start(idx('add-c')); const r = R(), sol = r.p.sol, k = colOf(sol, 8);
  carry(k.bit ? r.c0 : r.c1, r.ans[8]);
  ok(newRoundAfter(r) && / one/.test(r.why || ''), 'a wrong bit in a challenge did not start a new round');
  s().start(idx('add-c')); const r2 = R();
  carry(r2.c1, r2.ans[3]); ok(newRoundAfter(r2) && /Start at the right/.test(r2.why || ''), 'a bit written out of order was taken');
  s().start(idx('add-t')); const r3 = R(), s3 = r3.p.sol;
  let c = 8; while (c >= 1 && colOf(s3, c).made) c--;   // a column that makes no carry
  if (c >= 2 && c === 8) { carry(colOf(s3, 8).bit ? r3.c1 : r3.c0, r3.ans[8]); carry(r3.c1, r3.car[7]); ok(!r3.car[7].items.length && r3.slipped, 'a carry from a column with no carry was taken'); }
  s().start(idx('add2-t')); const r4 = R(); carry(r4.c0, r4.car[7]); ok(!r4.car[7].items.length && !r4.slipped, 'a 0 carry was taken or counted as a slip');
};
T.overflowBox = () => {
  s().start(idx('add2-t')); const r = R(); solveAdd();
  ok(r.ans[0].items.length === 1 && top(r.ans[0]).lost, 'the carry out of the 128 column did not land lost in the 256 box');
  s().start(idx('add-c'));
  for (let t = 0; t < 30 && R().p.sol.overflow; t++) { s().start(idx('add-c')); }
  const r2 = R(); if (!r2.p.sol.overflow) {
    while (r2.phase === 'add') { const c = r2.at, k = colOf(r2.p.sol, c); if (!r2.ans[c].items.length) carry(k.bit ? r2.c1 : r2.c0, r2.ans[c]); else carry(r2.c1, r2.car[c - 1]); }
    pressPad(r2.yes); ok(newRoundAfter(r2), 'OVERFLOW on a sum that fits was taken');
  }
  s().start(idx('add-c')); const r3 = R(); pressPad(r3.no); ok(newRoundAfter(r3), 'deciding before adding was taken');
};
T.machine = () => {
  s().start(idx('col-c')); const r = R(); pressPad(r.ans[2]); ok(newRoundAfter(r), 'a column pressed out of order was taken');
  s().start(idx('col-c')); const r2 = R(); pressPad(r2.ans[8]); ok(r2.ask && r2.ask.options.length === 4, 'the column rule question did not come'); answer(false); ok(newRoundAfter(r2), 'a wrong rule in a challenge did not start a new round');
  s().start(idx('col-t')); const r3 = R(); pressPad(r3.ans[8]); ok(/ones?/.test(r3.ask.q), 'the guided tutorial does not count the 1s');
  s().start(idx('col-c')); const r4 = R(); pressPad(r4.ans[8]); ok(!/carry \d, top/.test(r4.ask.q), 'the challenge gives the column bits away');
};
T.stored = () => {
  s().start(idx('store-c')); const r = R(); const sol = r.p.sol;
  for (let g = 0; g < 60 && !r.ask; g++) { if (r.phase === 'decide') { pressPad(sol.overflow ? r.yes : r.no); break; } const c = r.at, k = colOf(sol, c); if (!r.ans[c].items.length) carry(k.bit ? r.c1 : r.c0, r.ans[c]); else carry(r.c1, c === 1 ? r.ans[0] : r.car[c - 1]); }
  ok(r.ask && r.ask.answer === sol.stored, 'the stored value question did not come');
  answer(false); ok(newRoundAfter(r), 'a wrong stored value did not start a new round');
};
T.fit = () => {
  s().start(idx('fit-c')); const r = R(); const sh = r.shelf[0], it = top(sh);
  carry(sh, it.over ? r.fits : r.over_); ok(newRoundAfter(r), 'a card on the wrong pad did not start a new round');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson'), 'lesson mode did not open');
  const L2 = lab.LESSONS[0], mins = L2.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
  ok(mins >= 35 && mins <= 55, 'the lesson is ' + mins + ' minutes');
  clickBtn('All missions'); ok(!lab.lessonMode.on, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    if (s().missions[i].noHelp || s().missions[i].type === 'challenge') { ok(![...document.querySelectorAll('#mission button')].some(b => b.textContent.trim() === 'Walk me through it'), s().missions[i].id + ' is a challenge but shows Walk me through it'); continue; }
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt), s().missions[i].id + ' walkthrough did not open');
    ok(!/[–—]/.test(txt), 'dash in walkthrough');
    for (let k = 0; k < 40 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};
T.noArrowInChallenges = () => { for (const m of s().missions.filter(x => x.type === 'challenge')) { s().start(idx(m.id)); s().frame(2); ok(!s().guideTarget(), m.id + ': a challenge shows an arrow'); } };

function fuzz(i, n) {
  s().start(i);
  const lab = s();
  for (let k = 0; k < n; k++) {
    if (R().over) break;
    if (R().ask) { answer(Math.random() < 0.8); continue; }
    const from = lab.slots.filter(x => x.items.length || x.press || x.crate);
    const a = from[Math.floor(Math.random() * from.length)];
    try {
      reach(a);
      if (a.press) { lab.setHand(true); lab.setHand(false); continue; }
      press();
      if (!lab.hand.item) { release(); continue; }
      const to = lab.slots.filter(x => !x.press);
      put(to[Math.floor(Math.random() * to.length)]);
    } catch (e) { if (lab.hand.item) release(); }
  }
  if (lab.hand.item) release();
  for (let round = 0; round < 6 && M().phase !== 'done'; round++) {
    if (R().over) clickBtn('Next round');
    SOLVE[M().m.kind]();
  }
  ok(M().phase === 'done', 'after random play ' + M().m.id + ' could not be finished');
}

export async function run({ parts = ['play', 'break'] } = {}) {
  fails = [];
  const out = { parts, tests: 0 };
  const step = async (name, fn) => { out.tests++; try { fn(); } catch (e) { fails.push(name + ': ' + e.message); if (s().hand.item) s().setHand(false); } console.log('selftest: ' + name + (fails.length ? ' (' + fails.length + ' fails so far)' : '')); await new Promise(r => setTimeout(r, 0)); };
  if (parts.includes('play')) for (let i = 0; i < s().missions.length; i++) await step('play ' + s().missions[i].id, () => playMission(i));
  if (parts.includes('break')) for (const [k, fn] of Object.entries(T)) await step(k, fn);
  if (parts.includes('fuzz')) for (let i = 0; i < s().missions.length; i++) await step('fuzz ' + s().missions[i].id, () => fuzz(i, 25));
  out.fails = fails.slice();
  window.__selftest = out;
  console.log('selftest: DONE ' + out.tests + ' tests, ' + fails.length + ' fails' + (fails.length ? ': ' + fails.join(' | ') : ''));
  return out;
}
export const helpers = { carry, reach, take, put, answer, walkTo, pressPad };
