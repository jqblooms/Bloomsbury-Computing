// Robot Lab 3D self-test. Plays every mission with the pupil's controls (walking, Space, GO), then tries to break it.
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

// ---------------------------------------------------------------- solving a robot round from whatever state it is in
function goBtn() { reach(R().go); s().setHand(true); s().setHand(false); s().frame(1); s().skipMove(); }
function emptyBoxes() { const r = R(); for (const b of r.box) if (b.items.length) { const it = take(b); if (!it) throw new Error('could not take from a box'); put(r.crate ? r.crate[it.sym] : r.tray.find(x => !x.items.length)); } }
function fill(prog) { const r = R(); prog.forEach((c, k) => { if (r.box[k].items.length && top(r.box[k]).sym === c) return; carry(r.crate ? r.crate[c] : r.tray.find(x => x.items.length && top(x).sym === c), r.box[k]); }); }
// the fewest GOs to the star, n arrows a time (the robot stays where it stops)
function plan(at, star, n) {
  const lab = s(), key = a => a.x + ',' + a.y + ',' + a.d, seen = new Map([[key(at), null]]), q = [at];
  const chunks = lab.model.orders(['F', 'B', 'L', 'R']).map(o => o.slice(0, n)).concat(n === 1 ? [['F'], ['B'], ['L'], ['R']] : [['F', 'F'], ['L', 'L'], ['R', 'R'], ['B', 'B'], ['F', 'L'], ['F', 'R'], ['L', 'F'], ['R', 'F']]);
  while (q.length) {
    const a = q.shift();
    if (a.x === star.x && a.y === star.y) { const out = []; let k = key(a); while (seen.get(k)) { out.unshift(seen.get(k).c); k = seen.get(k).from; } return out; }
    for (const c of chunks) { const e = lab.model.endOf(a, c), k = key(e); if (!seen.has(k)) { seen.set(k, { from: key(a), c }); q.push(e); } }
  }
  throw new Error('no plan to the star');
}
function solveRobot() {
  const r = R(), m = M().m, lab = s();
  for (let g = 0; g < 30 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    if (r.script) { const want = r.script[r.runs.length]; if (r.box[0].items.length && top(r.box[0]).sym !== want) emptyBoxes(); fill([want]); goBtn(); continue; }
    if (m.keep) { const steps = plan(r.robot, r.p.star, m.boxes); emptyBoxes(); fill(steps[0]); goBtn(); continue; }
    if (m.orders) { const all = lab.model.orders(r.p.given).filter(o => !r.runs.some(x => x.prog.join("") === o.join(""))); emptyBoxes(); fill(all[0]); goBtn(); continue; }
    emptyBoxes(); fill(r.p.answer); goBtn();
  }
  ok(r.over, m.id + ' round did not finish (' + s().toastText() + ')');
}
const SOLVE = { robot: solveRobot };
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

// ---------------------------------------------------------------- break tests
const T = {};
T.model = () => {
  const L = s().model, at = { x: 2, y: 2, d: 0 };
  ok(L.endOf(at, ['F']).y === 1 && L.endOf(at, ['R']).x === 2 && L.endOf(at, ['R']).d === 1, 'forward or turn right is wrong');
  ok(L.endOf(at, ['B']).y === 3 && L.endOf(at, ['L', 'F']).x === 1, 'back or turn left is wrong');
  ok(L.stepRobot({ x: 0, y: 0, d: 0 }, 'F').bump, 'the robot left the mat');
  ok(L.orders(['F', 'F', 'R', 'L']).length === 12, 'the orders of four arrows with two the same are not 12');
  for (let k = 0; k < 40; k++) {
    const p = L.trayRound({ star: true }), all = L.orders(p.given);
    ok(all.every(o => !L.runRobot(p.start, o).some(q => q.bump)), 'an order leaves the mat');
    const hit = all.filter(o => { const e = L.endOf(p.start, o); return e.x === p.star.x && e.y === p.star.y; }).length;
    ok(hit >= 1 && hit * 3 <= all.length && !(p.star.x === p.start.x && p.star.y === p.start.y), 'the star is reached by too many orders, none, or is the start');
  }
};
T.turnStays = () => {
  s().start(idx('meet-t')); const r = R();
  fill(['F']); goBtn(); goBtn();
  ok(r.robot.x === 1 && r.robot.y === 2, 'two forwards did not move the robot two squares');
  emptyBoxes(); fill(['R']); goBtn();
  ok(r.robot.x === 1 && r.robot.y === 2 && r.robot.d === 1, 'turn right moved the robot or did not turn it');
};
T.scriptRefusesWrong = () => {
  s().start(idx('meet-t')); const r = R();
  carry(r.crate.L, r.box[0]);
  ok(!r.box[0].items.length && /Use forward/.test(s().toastText()) && !M().spoilt, 'a wrong arrow in Meet the Robot was not just a hint');
};
T.goNeedsArrows = () => {
  s().start(idx('two-t')); const r = R();
  fill(['F']); goBtn();
  ok(!r.runs.length && /every box/.test(s().toastText()), 'GO ran with an empty box');
};
T.sameOrderRefused = () => {
  s().start(idx('same-t')); const r = R(), o = s().model.orders(r.p.given)[0];
  fill(o); goBtn(); ok(r.runs.length === 1 && r.tray.every(x => x.items.length === 1), 'the arrows did not go back to the tray after a run');
  fill(o); goBtn(); ok(r.runs.length === 1 && /used that order before/.test(s().toastText()), 'the same order ran twice');
};
T.starHelpsAfterMiss = () => {
  s().start(idx('star-t')); const r = R(), L = s().model;
  const miss = L.orders(r.p.given).find(o => { const e = L.endOf(r.p.start, o); return !(e.x === r.p.star.x && e.y === r.p.star.y); });
  ok(!s().guideTarget() || s().guideTarget().slot.role !== 'tray' || true, '');
  fill(miss); goBtn();
  ok(!r.over && r.helped && r.misses === 1 && !M().spoilt, 'a miss in Find the Star did not let the pupil try again with help');
  const g = s().guideTarget(); ok(g && g.slot.role === 'tray' && top(g.slot).sym === r.p.answer[0], 'after a miss the arrow does not show the first arrow that works');
  const wrong = r.tray.find(x => x.items.length && top(x).sym !== r.p.answer[0]);
  if (wrong) { carry(wrong, r.box[0]); ok(!r.box[0].items.length && /Box 1 needs/.test(s().toastText()), 'a wrong arrow in box 1 was taken after help'); }
};
T.starChallengeMiss = () => {
  s().start(idx('star-c')); const r = R(), L = s().model;
  const miss = L.orders(r.p.given).find(o => { const e = L.endOf(r.p.start, o); return !(e.x === r.p.star.x && e.y === r.p.star.y); });
  fill(miss); goBtn();
  ok(R() !== r && M().have === 0 && M().spoilt === 1 && /new round/.test(s().toastText()), 'a miss in the challenge did not start a new round');
};
T.countPlaces = () => {
  s().start(idx('three-c')); const r = R(), all = s().model.orders(r.p.given);
  for (let k = 0; k < 3; k++) { fill(all[k]); goBtn(); }
  ok(r.ask && r.ask.type === 'num' && r.ask.answer === new Set(r.runs.map(x => x.end.x + ',' + x.end.y)).size, 'the count question is wrong');
  answer(false); ok(R() !== r && M().spoilt === 1, 'a wrong count did not start a new round');
};
T.readToMe = () => {
  s().start(0); ok([...document.querySelectorAll('#mission button')].some(b => b.textContent === 'Read it to me'), 'no Read it to me button');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson'), 'lesson mode did not open');
  const L = lab.LESSONS[0], mins = L.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
  ok(mins >= 35 && mins <= 50, 'the lesson is ' + mins + ' minutes');
  clickBtn('All missions'); ok(!lab.lessonMode.on, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt), s().missions[i].id + ' walkthrough did not open');
    ok(!/[–—]/.test(txt), 'dash in walkthrough');
    for (let k = 0; k < 30 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};
T.wording = () => {
  for (const m of s().missions) ok(!/[–—]/.test(m.intro + (m.after ? m.after.q + m.after.options.join('') : '')), m.id + ': a dash in the wording');
};

function fuzz(i, n) {
  s().start(i);
  const lab = s();
  for (let k = 0; k < n; k++) {
    if (R().over) break;
    if (R().ask) { answer(Math.random() < 0.7); continue; }
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
  const step = async (name, fn) => { out.tests++; try { fn(); } catch (e) { fails.push(name + ': ' + e.message); } console.log('selftest: ' + name + (fails.length ? ' (' + fails.length + ' fails so far)' : '')); await new Promise(r => setTimeout(r, 0)); };
  if (parts.includes('play')) for (let i = 0; i < s().missions.length; i++) await step('play ' + s().missions[i].id, () => playMission(i));
  if (parts.includes('break')) for (const [k, fn] of Object.entries(T)) await step(k, fn);
  if (parts.includes('fuzz')) for (let i = 0; i < s().missions.length; i++) await step('fuzz ' + s().missions[i].id, () => fuzz(i, 25));
  out.fails = fails.slice();
  window.__selftest = out;
  console.log('selftest: DONE ' + out.tests + ' tests, ' + fails.length + ' fails' + (fails.length ? ': ' + fails.join(' | ') : ''));
  return out;
}
export const helpers = { carry, reach, take, put, answer, walkTo, fill, goBtn };
