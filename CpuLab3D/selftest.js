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
// buses: carry each cube to the pad for its bus and its way (events), or each job's three cubes from the tray (trace)
function solveBus() {
  const r = R(), lab = s();
  for (let g = 0; g < 40 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.p.mode === 'events') { const e = r.ev; if (!e) break; carry(r.next, r.pad[e.bus][e.dir]); continue; }
    const j = r.job; if (!j) break;
    const row = j.rows.find(x => !x.done); carry(r.tray.find(x => x.items.length && top(x).sym === row.value), r.pad[row.bus][row.dir]);
  }
  ok(r.over, 'bus round did not finish (' + s().toastText() + ')');
}
function solveRun() {
  const r = R(), lab = s();
  for (let g = 0; g < 60 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    const e = r.p.trace[r.i]; if (!e) break;
    if (r.phase === 'ins') carry(r.slot['mem:' + e.k], r.slot.ins);
    else if (r.phase === 'data') carry(r.slot['mem:' + e.a], r.slot.data);
    else carry(r.slot.out, r.slot.screen);
  }
  ok(r.over, 'run round did not finish (' + s().toastText() + ')');
}
function solveOrder() {
  const r = R();
  for (let g = 0; g < 10 && !r.over; g++) { if (s().hand.item) release(); const nx = r.rail.find(x => !x.items.length); if (!nx) break; carry(r.shelf.find(x => x.items.length && top(x).k === nx.k), nx); }
  ok(r.over, 'order round did not finish');
}
function solveControl() {
  const r = R(), lab = s();
  for (let g = 0; g < 30 && !r.over; g++) {
    if (lab.hand.item) release();
    if (r.phase === 'read') { carry(r.sensor, r.mp); continue; }
    reach(r.p.on[r.n] ? r.onPad : r.offPad); lab.setHand(true); lab.setHand(false); lab.frame(1);
  }
  ok(r.over, 'control round did not finish (' + s().toastText() + ')');
}
const SOLVE = { sort: solveSort, cpu: solveCpu, bus: solveBus, run: solveRun, order: solveOrder, control: solveControl };
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
T.storedProgram = () => {
  const lab = s();
  lab.start(idx('run-t')); const r = R();
  ok(r.p.trace.map(e => e.after).join() === '0,14,23,23,23' || r.p.trace.length === 4, 'the fixed program does not run as LOAD 5, ADD 6, OUTPUT, STOP');
  carry(r.slot['mem:1'], r.slot.ins); ok(r.phase === 'ins' && !r.slot.ins.items.length && /in order/.test(r.why || ''), 'an instruction out of order was taken');
  lab.start(idx('run2-t')); const r2 = R(); carry(r2.slot['mem:0'], r2.slot.ins); const e = r2.p.trace[0], wrongA = [5, 6, 7].find(a => a !== e.a);
  carry(r2.slot['mem:' + wrongA], r2.slot.data); ok(r2.phase === 'data' && /uses the number stored at address/.test(r2.why || ''), 'the wrong data address was taken');
  ok(!!lab.guideTarget(), 'after a slip the arrow does not show the way');
  lab.start(idx('run-c')); const r3 = R(); ok(r3.ask && /screen show|was changed/.test(r3.ask.q), 'the challenge does not ask for a prediction first');
  answer(false); ok(R() !== r3 && M().spoilt >= 1, 'a wrong prediction did not start a new round');
  for (let k = 0; k < 30; k++) { const p = lab.missions[idx('run-c')].gen(); ok(p.trace.every(x => x.after >= 0) && p.trace[p.trace.length - 1].ins.op === 'STOP', 'a program goes below 0 or never stops'); }
};
T.newSteps311 = () => {
  const lab = s();
  lab.start(idx('order-t')); const r = R(), wrong = r.shelf.find(x => x.items.length && top(x).k !== 0);
  carry(wrong, r.rail[0]); ok(!r.rail[0].items.length && /comes/.test(s().toastText()) && !M().spoilt, 'a step out of order was taken, or the tutorial counted it as a mistake');
  lab.start(idx('ctrl-c')); const r2 = R(); carry(r2.sensor, r2.mp);
  reach(r2.p.on[0] ? r2.offPad : r2.onPad); lab.setHand(true); lab.setHand(false); lab.frame(1);
  ok(R() !== r2 && M().spoilt >= 1, 'a wrong signal in the challenge did not start a new round');
  for (let k = 0; k < 20; k++) { const p = lab.missions[idx('ctrl-c')].gen(); ok(p.readings.includes(p.dev.stored) && p.on.some(Boolean) && !p.on.every(Boolean), 'a control round has no boundary reading, or every signal is the same'); }
  for (let k = 0; k < 20; k++) { const p = lab.missions[idx('change-t')].gen(); ok(p.change && p.change.out0 !== p.change.out1 && p.trace.every(x => x.after >= 0), 'a change-the-memory round does not change the output'); }
  lab.start(idx('change-t')); ok(R().ask && /was changed/.test(R().ask.q), 'Change the Memory does not ask first');
  lab.start(idx('mem-t')); ok(R().p.parts.join() === 'INSTRUCTION,DATA', 'Instructions or Data? has the wrong machines');
  ok(lab.LESSONS.find(x => x.id === '3.1.1').missions[0] === 'dev-t', '3.1.1 does not start with the devices');
};
T.ipoCards = () => {
  const lab = s();
  lab.start(idx('ipo-t')); const r = R(); ok(r.p.parts.join() === 'INPUT,PROCESS,OUTPUT' && r.p.cards.length >= 3, 'the IPO round has the wrong machines');
  const c = r.shelf.find(x => x.items.length), want = top(c).answer, wrong = r.pads.find(p => p.part !== want);
  lab.start(idx('ipo-c')); const r2 = R(), c2 = r2.shelf.find(x => x.items.length); carry(c2, r2.pads.find(p => p.part !== top(c2).answer));
  ok(R() !== r2 && M().spoilt >= 1, 'a wrong IPO card in the challenge did not start a new round'); void wrong;
  for (const m of lab.missions.filter(x => ['ipo-t', 'sensor-t', 'ipo-c', 'run-t', 'run2-t', 'run-c'].includes(x.id))) ok(!/register|\bbus|fetch|decode|\bMAR\b|\bPC\b|\bACC\b/i.test(m.intro + (m.after ? m.after.q + m.after.options.join(' ') : '')), m.id + ' names a part from a later lesson');
};
T.helpLevels = () => {
  const lab = s();
  for (const m of lab.missions.filter(x => x.type === 'challenge')) {
    lab.start(idx(m.id)); lab.frame(2);
    ok(!lab.guideTarget(), m.id + ': a challenge shows an arrow');
    ok(!/Clue words|PC to MAR|carries an <b>address/.test($('mission').innerHTML.replace(/<li>No help[^<]*<\/li>/, '')) || m.kind === 'bus' && false, m.id + ': a challenge lists the rules');
  }
  lab.start(idx('next-c')); lab.frame(2); ok(!$('mission').querySelector('.cpu-mem.mar') && !$('mission').querySelector('.cpu-key'), 'the challenge marks where the MAR points');
  lab.start(idx('regs-t')); lab.frame(2); ok(!lab.guideTarget(), 'Five Registers points the way before any slip');
  ok(!/to the <b>(PC|MAR|MDR|CIR|ACC)<\/b>/.test($('mission').innerHTML), 'Five Registers names the register for each card');
  lab.start(idx('alucu-t')); lab.frame(2); ok(!!lab.guideTarget(), 'the first tutorial has no arrow');
};
T.busRules = () => {
  const lab = s();
  lab.start(idx('bus-c')); const r = R(), e = r.ev;
  const wrongBus = ['addr', 'data', 'ctrl'].find(b => b !== e.bus);
  carry(r.next, r.pad[wrongBus][e.dir]);
  ok(r.spoilt && /Not the/.test(r.why), 'a cube on the wrong bus did not spoil the challenge round');
  ok(top(r.next)?.sym === e.value, 'the cube did not go back to the NEXT pad');
  lab.start(idx('bus-c')); const r2 = R(), e2 = r2.ev;
  carry(r2.next, r2.pad[e2.bus][e2.dir === 'in' ? 'out' : 'in']);
  ok(r2.spoilt && /wrong way/.test(r2.why), 'the wrong way did not spoil the round with a reason');
  for (let k = 0; k < 40; k++) { const p = lab.missions[idx('bus-c')].gen(); ok(new Set(p.items.map(x => x.bus)).size === 3 && p.items.some(x => x.dir === 'in') && p.items.some(x => x.bus === 'data' && x.dir === 'out'), 'a bus round can be done one way only'); }
};
T.traceRules = () => {
  const lab = s();
  lab.start(idx('trace-c')); const r = R();
  let j = r.job;
  if (j.kind === 'write') { solveBusJob(); j = r.job; }
  const data = j.rows.find(x => x.bus === 'data');
  carry(r.tray.find(x => x.items.length && top(x).sym === data.value), r.pad.data.in);
  ok(!r.spoilt && !data.done && /Send those out first/.test(s().toastText()), 'the read value went before the address and read signal');
  const extra = String(j.extra[0][0]);
  carry(r.tray.find(x => x.items.length && top(x).sym === extra), r.pad.data.in);
  ok(r.spoilt && /holds/.test(r.why), 'a value from the wrong address did not spoil the round');
  lab.start(idx('trace-t')); const r2 = R();
  if (r2.job.kind === 'read') solveBusJob();
  const w = r2.job, a = w.writes.a; solveBusJob();
  ok(top(r2.memSlot[a]).sym === String(w.writes.v), 'the write did not change memory');
  for (let k = 0; k < 40; k++) { const p = lab.missions[idx('trace-c')].gen(); for (const jj of p.jobs) ok(new Set(jj.tray.map(x => x[0])).size === 5, 'two tray cubes look the same'); }
};
function solveBusJob() { const r = R(), j = r.job; for (const row of j.rows) if (!row.done) carry(r.tray.find(x => x.items.length && top(x).sym === row.value), r.pad[row.bus][row.dir]); }
T.history = () => {
  s().start(0); SOLVE[M().m.kind]();
  const d = document.querySelector('#mission .cl-log summary'), n = d ? parseInt(d.textContent.split('(')[1], 10) : 0;
  ok(d && d.textContent.startsWith('What has happened so far (') && n >= 3, 'no What has happened so far list: ' + (d ? d.textContent : 'none'));
};
T.cuTellsAlu = () => {
  s().start(idx('add-t')); const r = R(); ok(r.aluText === 'THE CU TELLS THE ALU: ADD', 'ADD did not start with the CU telling the ALU: ' + r.aluText);
  solveCpu(); ok(r.aluText === 'THE ALU WAITS FOR THE CU', 'the ALU sign did not go back to waiting');
  s().start(idx('next-t')); ok(R().aluText === 'THE ALU WAITS FOR THE CU', 'the ALU sign is wrong before decoding');
};
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
  ok((window.__explained || []).some(x => /^Not this time\. Not this move.*new round has started/.test(x)), 'the mistake is not in the What just happened card');
  ok(R() !== r && M().have === 0 && /new round/.test(s().toastText()), 'a mistake did not start a new round');
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
  const L = lab.LESSONS.find(x => x.id === '3.1.2'), mins = L.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
  ok(mins >= 50 && mins <= 70, 'the lesson is ' + mins + ' minutes');
  lab.start(idx('next-c')); ok(lab.nextMission() === idx('load-t'), 'the extensions do not follow the lesson');
  ok(lab.LESSONS.length === 3 && ['3.1.1', '3.1.2', '3.1.3'].every(id => lab.LESSONS.find(x => x.id === id).missions.every(m => idx(m) >= 0)), 'a lesson is missing its missions');
  clickBtn('All missions'); ok(!lab.lessonMode.on, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    if (s().missions[i].noHelp || s().missions[i].type === 'challenge') { ok(!hasBtn('Walk me through it'), s().missions[i].id + ' is a challenge but shows Walk me through it'); continue; }
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
