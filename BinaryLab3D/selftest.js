// Binary Lab 3D self-test. Plays every mission with the student's controls (walking, holding and letting go of Space,
// predictions and the mission panel buttons), checks every generated sum, then tries to break it: the left column
// first, wrong bits, a forgotten carry, carries that are not needed, quick taps, and random play that must never leave
// a mission stuck. Run: open index.html?debug=1, then
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

// ---------------------------------------------------------------- solving from whatever state it is in
function colDone(r, i) { const c = r.colOf(i); return r.bits[i] != null && (!c.cout || i === 0 || r.carried[i - 1]); }
function activeCol(r) { for (let i = r.p.n - 1; i >= 0; i--) if (!colDone(r, i)) return i; return -1; }
function solveAdd() {
  const r = R(), lab = s();
  for (let g = 0; g < 60 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    const a = activeCol(r); if (a < 0) { lab.frame(1); continue; }
    const c = r.colOf(a);
    if (r.bits[a] == null) carry((M().m.missing ? c.b : c.bit) ? r.one : r.zero, r.ans[a]);
    else carry(r.one, r.car[a - 1]);
  }
  ok(r.over, 'addition round did not finish (' + s().toastText() + ')');
}
const SOLVE = { add: solveAdd };
function playMission(i) {
  s().start(i);
  const m = M().m;
  for (let round = 0; round < 8 && M().phase !== 'done'; round++) {
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
T.history = () => {
  s().start(0); SOLVE[M().m.kind]();
  const d = document.querySelector('#mission .cl-log:not(.bin-rules-box) summary'), n = d ? parseInt(d.textContent.split('(')[1], 10) : 0;
  ok(d && d.textContent.startsWith('What has happened so far (') && n >= 3, 'no What has happened so far list: ' + (d ? d.textContent : 'none'));
};
T.answersAreRight = () => {
  // every round the generators make: the bits and carries give a + b, and the sum fits in the bits
  for (const m of s().missions) for (let k = 0; k < (m.type === 'challenge' ? 40 : 1); k++) {
    const p = m.gen(); let v = 0;
    for (const c of p.cols) { v += c.bit * c.pv; ok(c.count === c.a + c.b + c.cin && c.bit === c.count % 2, m.id + ': a column is worked wrongly'); }
    ok(v === p.a + p.b && p.a + p.b < 2 ** p.n && p.a !== p.b, m.id + ': ' + p.a + ' + ' + p.b + ' does not fit or does not add up');
  }
};
T.missingNumber = () => {
  s().start(idx('missing-c')); const r = R(); const a = activeCol(r), c = r.colOf(a);
  ok(r.ans[a].y === 5 && !r.ans[a].items.length, 'the B row is not the one to fill');
  carry(c.b ? r.zero : r.one, r.ans[a]);
  ok(r.spoilt && r.bits[a] == null && /so the answer bit would be/.test(r.why || ''), 'a wrong B bit was accepted');
  solveAdd(); ok(r.over && r.bits.join('') === r.p.b.toString(2).padStart(8, '0'), 'B was not found');
};
T.startAtTheRight = () => {
  s().start(idx('four-c')); const r = R();
  carry(r.one, r.ans[0]);
  ok(r.spoilt && r.bits[0] == null && /Start at the right/.test(r.why || ''), 'a bit on the left column first was accepted');
};
T.wrongBit = () => {
  s().start(idx('eight-c')); const r = R(); const a = activeCol(r), c = r.colOf(a);
  carry(c.bit ? r.zero : r.one, r.ans[a]);
  ok(r.spoilt && r.bits[a] == null && /so write/.test(r.why || ''), 'a wrong bit was accepted');
  { const g = s().guideTarget(); ok(g && g.exact && g.slot === (c.bit ? r.one : r.zero), 'after a mistake the guide does not show the right crate'); }
  solveAdd(); ok(M().have === 0, 'a spoilt round counted');
};
T.forgottenCarry = () => {
  s().start(idx('eight-t')); const r = R();
  for (let g = 0; g < 20; g++) { if (r.ask) { answer(); continue; } const a = activeCol(r), c = r.colOf(a); if (r.bits[a] == null) { carry(c.bit ? r.one : r.zero, r.ans[a]); if (c.cout) break; } else carry(r.one, r.car[a - 1]); }
  const a = activeCol(r), next = r.colOf(a - 1);
  carry(next.bit ? r.one : r.zero, r.ans[a - 1]);
  ok(r.bits[a - 1] == null && /First carry the 1/.test(r.why || ''), 'the next column was allowed before the carry');
};
T.carryRules = () => {
  s().start(idx('four-c')); const r = R(); let a = activeCol(r), c = r.colOf(a);
  carry(c.bit ? r.one : r.zero, r.ans[a]);
  if (!c.cout) { carry(r.one, r.car[a - 1]); ok(!r.carried[a - 1] && /nothing is carried/.test(r.why || ''), 'a carry with nothing to carry was accepted'); }
  else { carry(r.zero, r.car[a - 1]); ok(!r.carried[a - 1] && /A carry is always 1/.test(r.why || ''), 'a 0 was accepted as a carry'); }
};
T.countAndDenary = () => {
  s().start(idx('four-t')); const r = R();
  ok(r.ask && r.ask.type === 'choice' && r.ask.answer === String(r.colOf(3).count), 'the tutorial does not ask to count the 1s first');
  answer(false); ok(!!r.ask, 'a wrong count moved on in the tutorial'); answer(true);
  s().start(idx('eight-t')); const r2 = R(); solveAdd();
  ok(r2.denaryDone && r2.over, 'the 8-bit tutorial did not check in denary');
};
T.columnRules = () => {
  // the rules tutorial: count, then pick write and carry; the rules table lights the row only after both
  const lab = s(); lab.start(idx('rules-t')); const r = R(), lit = () => document.querySelector('#mission .bin-rules tr.hl');
  ok(document.querySelector('#mission details.bin-rules-box[open] .bin-rules'), 'the four rules are not shown open in the tutorial');
  answer(); const a = activeCol(r), c = r.colOf(a);
  ok(r.ask && /What do you write, and what do you carry/.test(r.ask.q) && !lit(), 'no write-and-carry question after the count, or the rule row shows early');
  answer(false); ok(!!r.ask, 'a wrong rule moved on in the tutorial'); answer(true);
  ok(lit() && lit().rowIndex === c.count + 1, 'the rule row for the column is not lit');
  // every column's explanation breaks the carry down, and nothing says 10 in binary for a column
  solveAdd(); const said = (window.__explained || []).join(' ');
  ok(/make 2\. A column can only hold 0 or 1/.test(said) && /Three 1s: put two of them together/.test(said), 'the two and three 1s columns are not broken down');
  ok(!/is 1[01] in binary/.test(said), 'a column is still explained as 10 or 11 in binary');
  // the drill: a wrong rule spoils the round; no help hides the table
  lab.start(idx('rules-c')); const r2 = R();
  ok(r2.ask && r2.ask.answer === 'Write ' + r2.colOf(3).bit + ', carry ' + (r2.colOf(3).cout ? '1' : 'nothing'), 'the drill does not ask the rule first');
  ok(!document.querySelector('#mission details.bin-rules-box[open]'), 'the rules are open in a challenge');
  answer(false); ok(r2.spoilt, 'a wrong rule did not spoil the drill round');
  lab.start(idx('speed-c')); ok(!document.querySelector('#mission .bin-rules'), 'No Help still shows the rules');
};
T.tapNeedsHold = () => {
  s().start(idx('four-t')); const r = R(); answer();
  const a = activeCol(r); carry(r.colOf(a).bit ? r.one : r.zero, r.ans[a]);
  reach(r.ans[a]); s().setHand(true); s().frame(12); s().setHand(false); s().frame(1);
  ok(r.bits[a] != null && r.ans[a].items.length === 1, 'a placed bit could be taken away');
};
T.holdPrompts = () => {
  const lab = s(), hint = () => $('hint').textContent;
  lab.start(idx('four-c')); reach(R().one); lab.frame(1); ok(/Hold Space/.test(hint()), 'no Hold Space prompt at a crate: ' + hint());
};
T.explains = () => {
  const lab = s(), last = () => (window.__explained || []).slice(-1)[0] || '';
  lab.start(idx('four-c')); const r = R(); ok(/Start at the right/.test(last()), 'no opening explanation');
  const a = activeCol(r), c = r.colOf(a); carry(c.bit ? r.one : r.zero, r.ans[a]);
  ok(/Column worth 1: .* so write/.test(last()), 'no column explanation: ' + last());
};
T.attention = () => {
  const lab = s(); lab.start(idx('four-t')); const panel = $('mission');
  const q = panel.querySelector('.ask'); ok(q && q.classList.contains('attn'), 'the count question does not glow');
  const box = panel.getBoundingClientRect(), qr = q.getBoundingClientRect();
  ok(qr.top >= box.top - 1 && qr.bottom <= box.bottom + 1, 'the count question is not scrolled into view');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson'), 'lesson mode did not open');
  const L = lab.LESSONS[0], mins = L.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
  ok(mins >= 50 && mins <= 70, 'the lesson is ' + mins + ' minutes');
  clickBtn('All missions'); ok(!lab.lessonMode.on, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    if (s().missions[i].noHelp) { ok(!hasBtn('Walk me through it'), s().missions[i].id + ' is no-help but shows Walk me through it'); continue; }
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt), s().missions[i].id + ' walkthrough did not open');
    ok(!/[–—]/.test(txt), 'dash in walkthrough');
    for (let k = 0; k < 30 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};

function fuzz(i, n) {
  s().start(i);
  const lab = s();
  for (let k = 0; k < n; k++) {
    if (R().over) break;
    if (R().ask) { answer(Math.random() < 0.7); continue; }
    const from = lab.slots.filter(x => x.items.length || x.crate);
    const a = from[Math.floor(Math.random() * from.length)];
    try {
      reach(a); press();
      if (!lab.hand.item) { release(); continue; }
      const to = lab.slots;
      put(to[Math.floor(Math.random() * to.length)]);
    } catch (e) { if (lab.hand.item) release(); }
  }
  if (lab.hand.item) release();
  for (let round = 0; round < 8 && M().phase !== 'done'; round++) {
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
export const helpers = { carry, reach, take, put, answer, walkTo };
