// CPU Lab 3D self-test. Plays every mission with the student's controls (walking, holding and letting go of Space,
// the +1 lever, predictions and the mission panel buttons), then tries to break it: wrong moves, memory reads the MAR
// does not hold, the lever early, quick taps, leaving mid-round, and random play that must never leave a mission stuck.
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

// ---------------------------------------------------------------- solving each kind from whatever state it is in
function solveSort() {
  const r = R(), lab = s();
  for (let g = 0; g < 20 && !r.over; g++) {
    if (lab.hand.item) release();
    const c = r.shelf.find(x => x.items.length); if (!c) break;
    carry(c, r.pads.find(p => p.part === top(c).answer));
  }
  ok(r.over, 'sort round did not finish');
}
function pull() { const lab = s(); reach(R().slot.inc); lab.setHand(true); lab.setHand(false); lab.frame(1); }
function solveCpu() {
  const r = R(), lab = s();
  for (let g = 0; g < 80 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    const e = r.p.list[r.i]; if (!e) break;
    if (e.press) { pull(); continue; }
    carry(r.slot[e.from], r.slot[e.to]);
  }
  ok(r.over, 'cpu round did not finish (' + s().toastText() + ')');
}
const SOLVE = { sort: solveSort, cpu: solveCpu };
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
T.copyKeepsValue = () => {
  s().start(idx('next-t')); const r = R();
  carry(r.slot.PC, r.slot.MAR);
  ok(r.regs.PC === '0' && top(r.slot.PC) && top(r.slot.PC).sym === '0' && r.regs.MAR === '0' && top(r.slot.MAR).sym === '0', 'copying the PC to the MAR did not keep the PC and fill the MAR');
  ok(!!r.ask && r.ask.type === 'choice', 'no MDR prediction after the MAR was set');
  answer();
  reach(r.slot['mem:3']); press();
  ok(!s().hand.item && /address in the MAR/.test(s().toastText()), 'memory gave out an address the MAR does not hold');
  release();
};
T.wrongMoveSpoils = () => {
  s().start(idx('next-c')); const r = R();
  carry(r.slot.PC, r.slot.CIR);
  ok(r.spoilt && r.i === 0 && !/^\d/.test(r.regs.CIR) === !/^\d/.test(r.regs.CIR), 'PC into the CIR was not a mistake');
  ok(/Not this move/.test(r.why || ''), 'no reason for a wrong move');
  solveCpu(); ok(M().have === 0, 'a spoilt round counted');
};
T.leverTooEarly = () => {
  s().start(idx('next-t')); const r = R();
  pull();
  ok(r.regs.PC === '0' && /Not now/.test(r.why || ''), 'the +1 lever worked before its turn');
  solveCpu();
};
T.leverPredicts = () => {
  s().start(idx('next-t')); const r = R();
  carry(r.slot.PC, r.slot.MAR); answer(); carry(r.slot['mem:0'], r.slot.MDR);
  pull(); ok(r.ask && r.ask.type === 'num' && r.regs.PC === '0', 'the +1 lever did not ask for a prediction first');
  answer(false); ok(r.ask && r.regs.PC === '0', 'a wrong tutorial prediction moved on');
  answer(true); ok(r.regs.PC === '1', 'the PC did not go up by 1');
};
T.aluAndDecode = () => {
  s().start(idx('add-t')); const r = R();
  ok(top(r.slot.CUout) && top(r.slot.CUout).sym === '6', 'ADD 6 did not start with the address 6 at the CU');
  solveCpu(); ok(r.regs.ACC === '42', 'ADD 6 did not leave 42 in the ACC (got ' + r.regs.ACC + ')');
};
T.sortWrongPart = () => {
  s().start(idx('alucu-c')); const r = R();
  const c = r.shelf.find(x => x.items.length && top(x).answer === 'ALU');
  carry(c, r.pads.find(p => p.part === 'CU'));
  ok(r.spoilt && top(c) && /Not the CU/.test(r.why || ''), 'an ALU job on the CU was accepted');
};
T.tapNeedsHold = () => {
  s().start(idx('alucu-t')); const r = R();
  const c = r.shelf.find(x => x.items.length); carry(c, r.pads.find(p => p.part === top(c).answer));
  const pad = r.pads.find(p => p.items.length); reach(pad); s().setHand(true); s().setHand(false); s().frame(1);
  ok(pad.items.length === 1 && !s().hand.item, 'a placed card could be taken');
};
T.holdPrompts = () => {
  const lab = s(), hint = () => $('hint').textContent;
  lab.start(idx('next-t')); const r = R();
  reach(r.slot.PC); lab.frame(1); ok(/take a copy/.test(hint()) && /keeps its value/.test(hint()), 'no copy prompt at a register: ' + hint());
  reach(r.slot.inc); lab.frame(1); ok(/Press Space/.test(hint()) && /\+1 lever/.test(hint()), 'no Press Space prompt at the lever: ' + hint());
  lab.start(idx('alucu-t')); reach(R().shelf[0]); lab.frame(1); ok(/the card "/.test(hint()), 'the card is not read out in the hint: ' + hint());
};
T.explains = () => {
  const lab = s(), last = () => (window.__explained || []).slice(-1)[0] || '';
  lab.start(idx('next-t')); const r = R();
  ok(/the next instruction is at address 0/.test(last()), 'no opening explanation: ' + last());
  carry(r.slot.PC, r.slot.MAR); ok(/copied into the MAR/.test(last()), 'no MAR explanation: ' + last());
  for (const id of ['alucu-t', 'load-t']) { const before = window.__explainCount || 0; lab.start(idx(id)); SOLVE[M().m.kind](); ok((window.__explainCount || 0) - before >= 3, id + ': too few explanations'); }
};
T.attention = () => {
  const lab = s(); lab.start(idx('next-t')); const r = R(), panel = $('mission');
  ok(panel.querySelector('.steps li.now.attn'), 'the step you are on does not glow');
  carry(r.slot.PC, r.slot.MAR);
  const q = panel.querySelector('.ask'); ok(q && q.classList.contains('attn'), 'the prediction does not glow');
  const box = panel.getBoundingClientRect(), qr = q.getBoundingClientRect();
  ok(qr.top >= box.top - 1 && qr.bottom <= box.bottom + 1, 'the prediction is not scrolled into view');
};
T.leavePrompt = () => {
  s().start(idx('next-t')); const r = R(); carry(r.slot.PC, r.slot.MAR); answer();
  [...document.querySelectorAll('#mission .sec-list button')].find(b => !b.disabled && b.getAttribute('aria-current') === 'false')?.click();
  ok(!!document.querySelector('#mission .leave'), 'no Leave this mission prompt mid-round');
  clickBtn('Stay'); ok(M().m.id === 'next-t' && r.regs.MAR === '0', 'Stay lost the round');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson'), 'lesson mode did not open');
  const L = lab.LESSONS[0], mins = L.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
  ok(mins >= 50 && mins <= 70, 'the lesson is ' + mins + ' minutes');
  lab.start(idx('next-c')); ok(lab.nextMission() === idx('load-t'), 'the extensions do not follow the lesson');
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
  const step = async (name, fn) => { out.tests++; try { fn(); } catch (e) { fails.push(name + ': ' + e.message); } console.log('selftest: ' + name + (fails.length ? ' (' + fails.length + ' fails so far)' : '')); await new Promise(r => setTimeout(r, 0)); };
  if (parts.includes('play')) for (let i = 0; i < s().missions.length; i++) await step('play ' + s().missions[i].id, () => playMission(i));
  if (parts.includes('break')) for (const [k, fn] of Object.entries(T)) await step(k, fn);
  if (parts.includes('fuzz')) for (let i = 0; i < s().missions.length; i++) await step('fuzz ' + s().missions[i].id, () => fuzz(i, 25));
  out.fails = fails.slice();
  window.__selftest = out;
  console.log('selftest: DONE ' + out.tests + ' tests, ' + fails.length + ' fails' + (fails.length ? ': ' + fails.join(' | ') : ''));
  return out;
}
export const helpers = { carry, reach, take, put, answer, walkTo, pull };
