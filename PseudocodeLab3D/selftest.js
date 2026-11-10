// Pseudocode Lab 3D self-test. Plays every mission with the pupil's controls, then tries to break it.
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
function solveSort(key) {
  const r = R();
  for (let g = 0; g < 20 && !r.over; g++) { const sh = r.shelf.find(x => x.items.length); if (!sh) break; const it = top(sh); carry(sh, key(r, it)); }
  ok(r.over, M().m.id + ' sorting round did not finish (' + s().toastText() + ')');
}
const SOLVE = { run: solveRun, types: () => solveSort((r, it) => r.pads[it.t]), gate: () => solveSort((r, it) => it.ok ? r.yes : r.no) };
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
    for (const g of ['mod', 'divmod', 'round', 'length', 'ucase', 'lib', 'choose', 'constant', 'slen', 'scase', 'sstore', 'str']) { const p = G[g](); ok(p.run.err < 0, g + ' stops with an error: ' + p.key + ' ' + p.run.errMsg); ok(p.run.out.length >= 1, g + ' outputs nothing'); }
    for (const g of ['stop', 'constStop']) { const p = G[g](); ok(p.run.err >= 0, g + ' does not stop'); }
    const t = G.types(); ok(t.run.out.length || t.run.err >= 0, 'types outputs nothing: ' + t.key);
  }
  const r = L().runProg(G.round().prog); ok(/^\d+\.\d$/.test(r.out[0]), 'ROUND to 1 place gives ' + r.out[0]);
  ok(L().runProg([{ op: 'declare', v: 'Word', type: 'STRING' }, { op: 'set', v: 'Word', e: { lit: { t: 'STRING', x: 'Hat Yai' } } }, { op: 'output', e: { fn: 'LENGTH', args: [{ v: 'Word' }] } }]).out[0] === '7', 'LENGTH("Hat Yai") is not 7');
  for (let k = 0; k < 40; k++) { const g = L().gateRound({ n: 6, kind: ['len', 'case', 'lcase'][k % 3] }); ok(g.cards.some(c => c.ok) && g.cards.some(c => !c.ok), 'a gate round has only one answer'); ok(new Set(g.cards.map(c => c.text)).size === g.cards.length, 'a gate round repeats an input'); }
  for (let k = 0; k < 30; k++) { const t = L().typeRound({ n: 8 }); ok(['INTEGER', 'REAL', 'STRING', 'BOOLEAN'].every(ty => t.cards.some(c => c.t === ty)), 'a types round misses a type'); ok(new Set(t.cards.map(c => c.text)).size === t.cards.length, 'a types round repeats'); }
};
T.declareFirst = () => {
  s().start(idx('lib-c')); const r = R(), l = r.p.prog.find(x => x.op === 'set' || x.op === 'input');
  const code = r.code.find(x => x.items.length);
  if (code) { carry(code, r.box[r.p.prog[0].v]); ok(newRoundAfter(r), 'a value stored before DECLARE was taken'); }
  s().start(idx('mod-t')); const r2 = R(); const wrong = ['REAL', 'STRING', 'BOOLEAN'].find(t => t !== r2.p.prog[0].type);
  carry(r2.tcrate[wrong], r2.plate[r2.p.prog[0].v]); ok(r2.li === 0 && r2.slipped, 'the wrong type cube was taken on a TYPE plate');
};
T.chooseType = () => {
  s().start(idx('declare-t')); const r = R(), l = r.p.prog[0];
  const wrong = ['INTEGER', 'REAL', 'STRING', 'BOOLEAN'].find(t => t !== l.type);
  carry(r.tcrate[wrong], r.plate[l.v]); ok(r.li === 0 && /Later the program stores/.test(s().toastText()), 'a wrong chosen type was taken');
};
T.wrongTypeStops = () => {
  s().start(idx('stop-t')); const r = R(); answer(); solveRun();
  ok(r.over && /stops/.test(r.endMsg || ''), 'the wrong kind of value did not stop the program');
};
T.constantStops = () => {
  s().start(idx('conststop-t')); const r = R(); answer(); solveRun();
  ok(r.over && /CONSTANT/.test(r.endMsg || ''), 'changing a CONSTANT did not stop the program');
};
T.innermostFirst = () => {
  s().start(idx('round-t')); const r = R(); solveRunUntil(r, 2);
  ok(r.nodes.length === 2 && r.nodes[0].bin === '/', 'ROUND(Total / 6, 1) does not work out the / first');
  carry(r.box.Total, r.arg[0]); carry(r.code.find(x => x.items.length && x.items[0].val.x !== 1) || r.code[0], r.arg[1]);
  pressPad(r.run); ok(r.ask && r.ask.options.includes(r.ask.answer), 'RUN did not ask for a prediction');
};
T.benchWrongSlot = () => {
  s().start(idx('lib-c')); const r = R(); solveRunUntil(r, r.p.prog.findIndex(l => l.e && (l.e.fn || l.e.bin)));
  const node = r.nodes[0]; if (!node) return;
  const parts = node.fn ? node.args : [node.a, node.b];
  // the second value in slot A
  const second = parts[1] && parts[1].lit ? r.code.find(x => x.items.length && L().valEq(x.items[0].val, parts[1].lit)) : null;
  if (second && !(parts[0].lit && L().valEq(parts[0].lit, parts[1].lit))) { carry(second, r.arg[0]); ok(newRoundAfter(r), 'a value in the wrong slot was taken in a challenge'); }
};
T.gateMistake = () => { s().start(idx('gate-c')); const r = R(); const sh = r.shelf[0], it = top(sh); carry(sh, it.ok ? r.no : r.yes); ok(newRoundAfter(r), 'an input on the wrong output was taken'); };
T.types = () => { s().start(idx('type-c')); const r = R(); const sh = r.shelf[0], it = top(sh); carry(sh, r.pads[it.t === 'INTEGER' ? 'STRING' : 'INTEGER']); ok(newRoundAfter(r), 'a value on the wrong type was taken'); };
T.predictAll = () => { s().start(idx('lib-pc')); const r = R(); ok(r.ask && r.ask.options.length >= 3, 'Predict the Output asks nothing first'); answer(false); ok(newRoundAfter(r), 'a wrong prediction in a challenge did not start a new round'); };
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
T.noArrowBeforeSlip = () => { for (const m of s().missions.filter(x => x.type === 'tutorial' && !x.guided)) { s().start(idx(m.id)); if (R().ask) answer(); s().frame(2); ok(!s().guideTarget(), m.id + ': an unguided tutorial shows an arrow before a slip'); } };
T.noAnswerArrow = () => {
  for (const id of ['type-t', 'gate-t']) { s().start(idx(id)); take(R().shelf[0]); s().frame(2); ok(!s().guideTarget(), id + ': the arrow points at the answer for a carried card'); release(); }
  s().start(idx('declare-t')); s().frame(2); ok(!s().guideTarget(), 'Choose the Type points at the right type cube');
};
T.textClean =() => { for (let i = 0; i < s().missions.length; i++) { s().start(i); const t = $('mission').textContent; ok(!/[–—]|undefined|NaN|\[object/.test(t), s().missions[i].id + ': bad text in the sheet'); } };

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
