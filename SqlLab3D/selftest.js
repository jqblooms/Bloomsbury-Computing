// SQL Lab 3D self-test. Plays every mission with the pupil's controls, then tries to break it.
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
const expIdx = r => L().runQuery(r.p.tb, r.p.q).map(x => r.p.tb.rows.indexOf(x));
function solveDb() {
  const r = R(), m = M().m, lab = s(), tb = r.p.tb;
  for (let g = 0; g < 60 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    if (m.task === 'fr') { if (!r.head.some(x => x.items.length)) carry(r.crF, r.head[0]); else carry(r.crR, r.rec[0]); continue; }
    if (m.task === 'pk') { carry(r.crK, r.head[tb.fields.findIndex(f => f.name === tb.key)]); continue; }
    if (m.task === 'dt') { const h = r.head.find(x => !x.items.length); carry(r.crT[L().TYPES.indexOf(tb.fields.find(f => f.name === h.field).type)], h); continue; }
    if (m.task === 'out' || m.task === 'agg') {
      if (m.type === 'tutorial') { if (r.k >= tb.rows.length) { pressPad(r.done); continue; } carry(r.rec[r.k], r.outPad); continue; }
      const next = expIdx(r).find(k => !r.out.includes(k));
      if (next == null) { pressPad(r.done); continue; }
      carry(r.rec[next], r.outPad); continue;
    }
    if (m.task === 'sql') { const i = r.tokSlot.findIndex((x, j) => r.toks[j].blank && !x.items.length); carry(r.crates.find(c => c.crate === r.toks[i].s), r.tokSlot[i]); continue; }
  }
  ok(r.over, m.id + ' round did not finish (' + s().toastText() + ')');
}
const SOLVE = { db: solveDb };
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
const newRoundAfter = r => R() !== r && M().have === 0 && M().spoilt >= 1 && /new round/.test(s().toastText());

// ---------------------------------------------------------------- break tests
const T = {};
T.onlyKeyUnique = () => {
  for (let k = 0; k < 60; k++) { const tb = L().makeTable({ n: 7 }); for (const f of tb.fields) { const n = new Set(tb.rows.map(x => String(x[f.name]))).size; ok(f.name === tb.key ? n === 7 : n < 7, tb.name + ': ' + f.name + (f.name === tb.key ? ' repeats' : ' is also unique')); } }
};
T.examSql = () => {
  const tb = { name: 'SoftDrinks', fields: [{ name: 'Container', type: 'alphanumeric' }, { name: 'NumberInStock', type: 'integer' }], key: 'Container', rows: [{ Container: 'Can', NumberInStock: 12 }, { Container: 'Bottle', NumberInStock: 30 }, { Container: 'Can', NumberInStock: 24 }] };
  const q = { agg: 'SUM', aggField: 'NumberInStock', where: [{ f: 'Container', op: '=', v: 'Can' }] };
  ok(L().sqlLines(tb, q).join(' ') === "SELECT SUM (NumberInStock) FROM SoftDrinks WHERE Container = 'Can';", 'the June 2024 SUM query is not printed as in the paper: ' + L().sqlLines(tb, q).join(' '));
  ok(L().aggValue(tb, q) === 36, 'SUM of the cans is not 36');
  ok(L().aggValue(tb, Object.assign({}, q, { agg: 'COUNT' })) === 2, 'COUNT of the cans is not 2');
  for (let k = 0; k < 40; k++) { const p = L().queryRound({ fields: 3, order: true }); const rows = L().runQuery(p.tb, p.q); ok(rows.length >= 2 && rows.length < p.tb.rows.length, 'a query keeps too few or too many records'); if (p.q.order) ok(new Set(rows.map(x => x[p.q.order])).size === rows.length, 'ORDER BY has a tie'); }
};
T.countsSpoil = () => {
  s().start(idx('pk-c')); const r = R();
  ok(r.ask && /fields/.test(r.ask.q), 'the challenge does not ask for the number of fields first');
  answer(false); ok(newRoundAfter(r), 'a wrong number of fields did not start a new round');
};
T.keyRepeats = () => {
  s().start(idx('pk-t')); const r = R(), tb = r.p.tb, wrong = r.head.find(h => h.field !== tb.key);
  carry(r.crK, wrong);
  ok(!wrong.items.length && /two records/.test(s().toastText()) && r.hl.cells && r.hl.cells.size === 2 && !M().spoilt, 'a wrong key in the tutorial did not show the repeated values');
  const g = s().guideTarget(); take(r.crK); s().frame(2); ok(s().guideTarget()?.slot?.field === tb.key, 'after a slip the arrow does not show the primary key'); release(); void g;
  s().start(idx('pk-c')); const r2 = R(); answer(); answer();
  carry(r2.crK, r2.head.find(h => h.field !== r2.p.tb.key)); ok(newRoundAfter(r2), 'a wrong key in the challenge did not start a new round');
};
T.typeWrong = () => {
  s().start(idx('dt-c')); const r = R(), tb = r.p.tb, h = r.head[0], f = tb.fields[0];
  const bad = L().TYPES.find(t => t !== f.type);
  carry(r.crT[L().TYPES.indexOf(bad)], h);
  ok(newRoundAfter(r) && new RegExp(f.name).test(R().why || ''), 'a wrong data type did not start a new round with the reason');
};
function outChallenge(want) {
  for (let k = 0; k < 40; k++) { s().start(idx('out-c')); if (want(R().p.q)) { answer(); return R(); } }
  throw new Error('no such query');
}
T.outOrder = () => {
  const r = outChallenge(q => !!q.order), e = expIdx(r);
  carry(r.rec[e[1]], r.outPad);
  ok(newRoundAfter(r) && /comes first/.test(r.why || ''), 'a record out of ORDER BY order was accepted');
};
T.outNotMatching = () => {
  const r = outChallenge(() => true), e = expIdx(r), no = r.p.tb.rows.findIndex((x, k) => !e.includes(k));
  carry(r.rec[no], r.outPad);
  ok(newRoundAfter(r) && /not in the output/.test(r.why || ''), 'a record that fails WHERE was accepted');
};
T.doneTooEarly = () => {
  const r = outChallenge(() => true);
  pressPad(r.done); ok(newRoundAfter(r) && /Not finished/.test(r.why || ''), 'DONE with records missing was accepted');
};
T.tutorialChecksEachRecord = () => {
  s().start(idx('out-t')); const r = R();
  ok(r.ask && /Record /.test(r.ask.q) && r.ask.options.join() === 'True,False', 'the tutorial does not ask about the first record');
  answer(false); ok(r.ask && /Not quite/.test($('mission').textContent) && !M().spoilt, 'a wrong True or False in the tutorial was not just tried again');
};
T.sqlGaps = () => {
  s().start(idx('sql-t')); const r = R(), i = r.toks.findIndex(t => t.blank), want = r.toks[i].s;
  const wrong = r.crates.find(c => c.crate !== want && !(r.p.q.select || []).includes(c.crate));
  carry(wrong, r.tokSlot[i]);
  ok(!r.tokSlot[i].items.length && /^Not /.test(s().toastText()) && !M().spoilt, 'a wrong cube in a gap was not just a hint in the tutorial');
  take(wrong); s().frame(2); ok(s().guideTarget()?.slot === r.tokSlot[i], 'carrying, the arrow does not show the gap'); release();
  s().frame(2); ok(s().guideTarget()?.slot?.crate === want || (r.p.q.select || []).includes(s().guideTarget()?.slot?.crate), 'after a slip the arrow does not show the right crate');
  s().start(idx('sql-c')); const r2 = R();
  ok(r2.toks[0].blank && r2.toks[0].s === 'SELECT', 'the challenge does not blank the keywords');
  carry(r2.crates.find(c => c.crate === 'FROM'), r2.tokSlot[0]); ok(newRoundAfter(r2) && /SELECT/.test(r2.why || ''), 'FROM in the SELECT gap did not start a new round');
};
T.selectAnyOrder = () => {
  for (let k = 0; k < 30; k++) { s().start(idx('sql-t')); if ((R().p.q.select || []).length === 2) break; }
  const r = R(), sel = r.p.q.select, gaps = r.toks.map((t, j) => j).filter(j => r.toks[j].blank && r.toks[j].role === 'field').slice(0, 2);
  carry(r.crates.find(c => c.crate === sel[1]), r.tokSlot[gaps[0]]); carry(r.crates.find(c => c.crate === sel[0]), r.tokSlot[gaps[1]]);
  ok(r.tokSlot[gaps[0]].items.length && r.tokSlot[gaps[1]].items.length && !M().spoilt, 'the SELECT fields were not accepted in either order');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson') && $('nbLesson').options.length === 2, 'lesson mode did not open with two lessons');
  for (const L2 of lab.LESSONS) { const mins = L2.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0); ok(mins >= 30 && mins <= 60, L2.id + ' is ' + mins + ' minutes'); }
  clickBtn('All missions'); ok(!lab.lessonMode.on, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt), s().missions[i].id + ' walkthrough did not open');
    ok(!/[–—]/.test(txt), 'dash in walkthrough');
    for (let k = 0; k < 40 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};
T.wording = () => { for (const m of s().missions) ok(!/[–—]|decimal number|column\b.*column/.test(m.intro), m.id + ': wording'); };

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
  const step = async (name, fn) => { out.tests++; try { fn(); } catch (e) { fails.push(name + ': ' + e.message); } console.log('selftest: ' + name + (fails.length ? ' (' + fails.length + ' fails so far)' : '')); await new Promise(r => setTimeout(r, 0)); };
  if (parts.includes('play')) for (let i = 0; i < s().missions.length; i++) await step('play ' + s().missions[i].id, () => playMission(i));
  if (parts.includes('break')) for (const [k, fn] of Object.entries(T)) await step(k, fn);
  if (parts.includes('fuzz')) for (let i = 0; i < s().missions.length; i++) await step('fuzz ' + s().missions[i].id, () => fuzz(i, 25));
  out.fails = fails.slice();
  window.__selftest = out;
  console.log('selftest: DONE ' + out.tests + ' tests, ' + fails.length + ' fails' + (fails.length ? ': ' + fails.join(' | ') : ''));
  return out;
}
export const helpers = { carry, reach, take, put, answer, walkTo, pressPad };
