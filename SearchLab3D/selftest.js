// Search Lab 3D self-test. Plays every mission with the pupil's controls, then tries to break it.
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
function solveSearch() {
  const r = R(), m = M().m, lab = s();
  for (let g = 0; g < 120 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    if (m.kind === 'race') break;
    const p = r.p;
    if (p.mode === 'linear') {
      if (r.phase === 'end') { pressPad(r.found); continue; }
      if (r.next > p.list.length) { pressPad(r.none); continue; }
      pressPad(r.box[r.next - 1]); continue;
    }
    const st = r.steps[r.k]; if (!st) break;
    if (r.phase === 'open') { pressPad(r.box[st.mid - 1]); continue; }
    if (st.cmp === 'found') { pressPad(r.found); continue; }
    if (st.cmp === 'right' ? st.mid === st.hi : st.mid === st.lo) { pressPad(r.none); continue; }
    const which = st.cmp === 'right' ? 'lo' : 'hi', to = st.cmp === 'right' ? st.mid + 1 : st.mid - 1;
    carry(r.mark.find(x => x.items.length && top(x).marker === which), r.mark[to - 1]);
  }
  ok(r.over, m.id + ' round did not finish (' + s().toastText() + ')');
}
const SOLVE = { search: solveSearch, race: solveSearch };
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
  const l = [3, 8, 12, 20, 27, 31, 40, 52];
  ok(L().binarySteps(l, 40).map(x => x.mid).join() === '4,6,7', 'binary search of 40 does not check 4, 6, 7: ' + L().binarySteps(l, 40).map(x => x.mid).join());
  ok(L().midOf(5, 8) === 6 && L().midOf(1, 2) === 1, 'Middle is not (Low + High) / 2 rounded down');
  ok(L().linearCount(l, 27) === 5 && L().linearCount(l, 5) === 8, 'linear counts are wrong');
  ok(L().binaryCount(l, 5) === 3, 'a missing target does not end when LOW passes HIGH');
  for (let k = 0; k < 40; k++) { const p = L().binaryRound({ n: 16, maybeMissing: true, minSteps: 3 }); ok(new Set(p.list).size === 16 && p.list.every((v, i) => !i || p.list[i - 1] < v), 'a binary list is not in order or repeats a value'); }
};
T.linearRules = () => {
  s().start(idx('lin-t')); const r = R();
  pressPad(r.box[2]); ok(r.cmp === 0 && !M().spoilt && /in order, starting at index 1/.test(s().toastText()), 'box 3 opened before box 1');
  ok(!!s().guideTarget(), 'after a slip the tutorial arrow does not show box 1');
  s().start(idx('lin-c')); ok(R().p.list.every(v => document.getElementById('mission').textContent.includes(String(v))), 'the linear prediction is asked without showing the list'); const r2 = R(); answer();
  pressPad(r2.none); ok(newRoundAfter(r2) && /every item/.test(r2.why || ''), 'NOT FOUND before checking every item did not start a new round');
};
T.binaryRules = () => {
  s().start(idx('mid-t')); const r = R(); ok(r.ask && /rounded down/.test(r.ask.q), 'Find the Middle does not ask for the middle');
  answer(); const st = r.steps[0], wrong = st.mid === 1 ? 2 : 1;
  pressPad(r.box[wrong - 1]); ok(r.cmp === 0 && /rounded down/.test(s().toastText()), 'a box that is not the middle was opened');
  s().start(idx('bin-c')); const r2 = R(); const st2 = r2.steps[0];
  pressPad(r2.box[st2.mid - 1]); ok(r2.phase === 'decide' && r2.cmp === 1, 'the middle did not open');
  if (st2.cmp !== 'found') {
    const which = st2.cmp === 'right' ? 'lo' : 'hi', to = st2.cmp === 'right' ? st2.mid + 1 : st2.mid - 1, bad = st2.cmp === 'right' ? st2.mid : st2.mid;
    carry(r2.mark.find(x => x.items.length && top(x).marker === which), r2.mark[bad - 1]);
    ok(newRoundAfter(r2) && /thrown away too/.test(r2.why || ''), 'LOW or HIGH onto the middle itself was taken');
  }
  s().start(idx('bin-t')); const r3 = R(); answer(); const s3 = r3.steps[0]; pressPad(r3.box[s3.mid - 1]);
  if (s3.cmp !== 'found') { const which = s3.cmp === 'right' ? 'lo' : 'hi', to = s3.cmp === 'right' ? s3.mid + 1 : s3.mid - 1; carry(r3.mark.find(x => x.items.length && top(x).marker === which), r3.mark[to - 1]);
    ok(r3.state.filter(x => x === 'gone').length === (s3.cmp === 'right' ? s3.mid : r3.p.list.length - s3.mid + 1), 'the thrown-away half did not go dark'); }
};
T.race = () => {
  for (let k = 0; k < 20; k++) { s().start(idx('race-c')); const r = R(), sorted = r.p.list.every((v, i) => !i || r.p.list[i - 1] < v); ok(r.asks.length === (sorted ? 2 : 2) && (sorted ? /linear/.test(r.asks[0].q) : /Can a binary/.test(r.asks[0].q)), 'the race asks the wrong questions'); }
  s().start(idx('race-c')); const r = R(); answer(false); ok(newRoundAfter(r), 'a wrong race prediction did not start a new round');
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
    const from = lab.slots.filter(x => x.items.length || x.press);
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
