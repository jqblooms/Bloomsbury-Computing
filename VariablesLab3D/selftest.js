// Variables Lab 3D self-test. Plays every mission with the pupil's controls, then tries to break it.
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
// follow the method: the same next move the arrow uses
function step1() { const mv = s().nextMove(); if (!mv) return false; if (mv.press) pressPad(mv.press); else carry(mv.take, mv.to); return true; }
function solveRun() {
  const r = R(), lab = s();
  for (let g = 0; g < 200 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    if (!step1()) break;
  }
  ok(r.over, M().m.id + ' round did not finish (' + s().toastText() + ')');
}
function solveRunUntil(r, n) { const lab = s(); for (let g = 0; g < 100 && r.li < n && !r.over; g++) { if (lab.hand.item) release(); if (r.ask) { answer(); continue; } if (!step1()) break; } }
function solveTypes() {
  const r = R();
  for (let g = 0; g < 20 && !r.over; g++) { const sh = r.shelf.find(x => x.items.length); if (!sh) break; const it = top(sh); carry(sh, r.pads[it.t]); }
  ok(r.over, M().m.id + ' types round did not finish (' + s().toastText() + ')');
}
const SOLVE = { run: solveRun, types: solveTypes };
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
  const G = L().GEN;
  for (let k = 0; k < 200; k++) {
    for (const g of ['store', 'quote', 'replace', 'change', 'copy', 'plus', 'input', 'int', 'join']) { const p = G[g](); ok(p.run.err < 0, g + ' gives an error: ' + p.key); ok(p.run.printed.length >= 1, g + ' prints nothing'); }
    const e = G.error(); ok(e.run.err === 1, 'the error program does not stop at line 2');
    for (const lvl of [1, 2]) { const p = G.mixed(lvl); ok(p.run.err < 0 && p.run.printed.length, 'mixed ' + lvl + ' is broken: ' + p.key); }
    const io = G.io(); ok(io.run.printed.length || io.run.err >= 0, 'io prints nothing: ' + io.key);
  }
  const c = G.change(); ok(c.run.printed[0] === String(c.prog[0].e.lit.x + c.prog[1].e.b.lit.x), 'coins = coins + 5 is worked out wrong');
  const pl = G.plus(); ok(/^\d\d$/.test(pl.run.printed[1]) && pl.run.printed[0] === String(2 * pl.prog[0].e.lit.x), '5 + 5 and "5" + "5" are wrong: ' + pl.run.printed);
  for (let k = 0; k < 30; k++) { const t = L().typeRound({ n: 6, level: 1 + k % 2 }); ok(new Set(t.cards.map(x => x.text)).size === 6, 'a types round repeats a card'); ok(['int', 'float', 'str'].every(ty => t.cards.some(x => x.t === ty)), 'a types round misses a type'); }
};
T.wrongBox = () => {
  s().start(idx('store-c')); const r = R();
  carry(r.code[0], r.screen_); ok(newRoundAfter(r), 'a store line value on the SCREEN was taken in a challenge');
  s().start(idx('store-t')); const r2 = R();
  carry(r2.code[0], r2.screen_); ok(r2.li === 0 && r2.slipped, 'a tutorial took a store on the SCREEN');
};
T.replace = () => {
  s().start(idx('replace-t')); const r = R(); solveRunUntil(r, 2);
  const v = r.p.prog[0].v; ok(r.box[v].items.length === 1 && L().valEq(top(r.box[v]).val, r.p.prog[1].e.lit), 'the old value was not replaced');
};
T.quoteMarks = () => {
  s().start(idx('quote-t')); const r = R(); solveRunUntil(r, 2);
  const v = r.p.prog[0].v; carry(r.box[v], r.screen_);
  ok(r.li === 2 && r.slipped && /Quote marks/.test(s().toastText()), 'print("' + v + '") took the value of ' + v);
};
T.rightSideFirst = () => {
  s().start(idx('change-t')); const r = R(); solveRunUntil(r, 1);
  const l = r.p.prog[1]; carry(r.code[0], r.box[l.v]);
  ok(r.li === 1 && r.slipped, 'a copy stored back without working out the right side was taken');
};
T.benchPredict = () => {
  s().start(idx('plus-t')); const r = R(); solveRunUntil(r, 2);
  for (let g = 0; g < 10 && !r.ask && !r.over; g++) step1();
  ok(r.ask && r.ask.type === 'choice' && r.ask.options.includes(r.ask.answer), 'RUN did not ask for a prediction');
  if (r.ask) { answer(false); ok(!!r.ask && R() === r, 'a wrong prediction in a tutorial was taken'); }
};
T.inputIsString = () => {
  s().start(idx('error-t')); const r = R(); solveRun();
  ok(r.over && /error/.test(r.endMsg || ''), 'age + 1 after input() did not stop with an error');
  s().start(idx('int-t')); const r2 = R(); pressPad(r2.kb); ok(r2.kbOut.items.length && top(r2.kbOut).val.t === 'str', 'input() did not give a String');
};
T.noTypeSkip = () => {
  s().start(idx('int-t')); const r = R(); pressPad(r.kb); carry(r.kbOut, r.box.age); s().frame(1);
  ok(r.li === 1, 'line 1 did not store the String');
  carry(r.box.age, r.screen_); ok(r.li === 1 && r.slipped, 'age went to the SCREEN on an int() line');
};
T.types = () => { s().start(idx('types-c')); const r = R(); const sh = r.shelf[0], it = top(sh); carry(sh, r.pads[it.t === 'int' ? 'str' : 'int']); ok(newRoundAfter(r), 'a card on the wrong type was taken'); };
T.predictAll = () => {
  s().start(idx('predict-c')); const r = R(); ok(r.ask && r.ask.options.length >= 3, 'Predict, Then Run asks nothing first');
  answer(false); ok(newRoundAfter(r), 'a wrong prediction in a challenge did not start a new round');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson'), 'lesson mode did not open');
  for (const L2 of lab.LESSONS) { const mins = L2.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0); ok(mins >= 35 && mins <= 55, L2.id + ' is ' + mins + ' minutes'); }
  clickBtn('All missions'); ok(!lab.lessonMode.on, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    if (s().missions[i].noHelp || s().missions[i].type === 'challenge') { ok(![...document.querySelectorAll('#mission button')].some(b => b.textContent.trim() === 'Walk me through it'), s().missions[i].id + ' is a challenge but shows Walk me through it'); continue; }
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt), s().missions[i].id + ' walkthrough did not open');
    ok(!/[–—]|undefined|NaN/.test(txt), s().missions[i].id + ': dash, undefined or NaN in walkthrough');
    for (let k = 0; k < 40 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};
T.noArrowInChallenges = () => { for (const m of s().missions.filter(x => x.type === 'challenge')) { s().start(idx(m.id)); s().frame(2); ok(!s().guideTarget(), m.id + ': a challenge shows an arrow'); } };
T.noArrowBeforeSlip = () => { for (const m of s().missions.filter(x => x.type === 'tutorial' && !x.guided)) { s().start(idx(m.id)); s().frame(2); ok(!s().guideTarget(), m.id + ': an unguided tutorial shows an arrow before a slip'); } };
T.textClean = () => { for (let i = 0; i < s().missions.length; i++) { s().start(i); const t = $('mission').textContent; ok(!/[–—]|undefined|NaN|\[object/.test(t), s().missions[i].id + ': bad text in the sheet'); } };

function fuzz(i, n) {
  s().start(i);
  const lab = s();
  for (let k = 0; k < n; k++) {
    if (R().over) break;
    if (R().ask) { answer(Math.random() < 0.8); continue; }
    const from = lab.slots.filter(x => x.items.length || x.press || x.crate || x.copyOut);
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
