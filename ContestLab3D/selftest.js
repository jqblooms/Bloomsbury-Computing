// Contest Lab 3D self-test. Plays every mission with the student's controls (walking, holding and letting go of
// Space, typing predictions, the lamp buttons and the mission panel buttons), then tries to break it: out-of-order
// cubes, mistakes in challenges, quick taps on placed cubes, grabbing during a prediction, leaving mid-round, and
// random play that must never leave a mission unfinishable.
// Run: open index.html?debug=1, then in the console:
//   setTimeout(async () => { const t = await import('./selftest.js?' + Date.now()); await t.run({ parts: ['play', 'break', 'fuzz'] }); }, 0)
// and read window.__selftest (or watch console.log('selftest: ...')).
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
    const n = s().nearestSlot(0.9, x => x.role !== 'lamp');
    if (n === sl || sl.role === 'lamp') return;
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
  if (a.type === 'num') { const v = right ? a.answer : a.answer + 1; $('clAsk').value = String(v); }
  else {
    const want = right ? a.answer : a.answer.replace(/^./, c => c === '1' ? '0' : '1');
    for (let i = 0; i < want.length; i++) { const b = () => document.querySelectorAll('.cl-pick button')[i]; let k = 0; while (b().textContent !== want[i] && k++ < 3) b().click(); }
  }
  clickBtn('Check');
}
function afterQ() { const m = M().m; if (M().phase === 'done' && !M().afterOk) clickBtn(m.after.options[0]); }

// ---------------------------------------------------------------- solving each kind from whatever state it is in
function solveStack() {
  const r = R(), form = M().m.form;
  for (let guard = 0; guard < 60 && !r.over; guard++) {
    if (s().hand.item) release();
    if (r.ask) { answer(); continue; }
    if (r.out.items.length) { carry(r.out, r.stack); continue; }
    if (r.op) { const first = !r.L.items.length && !r.R.items.length; carry(r.stack, first ? (form === 'postfix' ? r.R : r.L) : (r.L.items.length ? r.R : r.L)); continue; }
    const b = r.belt[r.order[r.next]]; if (!b) break;
    carry(b, top(b).role === 'op' ? r.O : r.stack);
  }
  ok(r.over, 'stack round did not finish');
}
function solveTree() {
  const r = R(), lab = s();
  for (const nd of lab.KIND && r.stage === 'build' ? preorderOf(r.p.t) : []) {
    const ped = r.ped.get(nd); if (ped.items.length) continue;
    const sup = lab.slots.find(x => x.role === 'supply' && x.items.length && top(x).sym === (nd.op || nd.v));
    carry(sup, ped);
  }
  ok(r.stage === 'read', 'tree not built');
  while (r.readN < r.readOrder.length) carry(r.ped.get(r.readOrder[r.readN]), r.rail);
  ok(r.over, 'tree round did not finish');
}
const preorderOf = t => { const out = []; (function go(n) { out.push(n); if (n.op) { go(n.l); go(n.r); } })(t); return out; };
function solveInfix() {
  const r = R();
  while (r.k < r.E.length) {
    const e = r.E[r.k];
    if (e.tok === '(' || e.tok === ')') carry(s().slots.find(x => x.crate === e.tok), r.rail);
    else carry(r.ped.get(e.node), r.rail);
  }
  ok(r.over, 'infix round did not finish');
}
function solveBits() {
  const r = R(), lab = s();
  const work = (function order(ast) { const out = []; (function go(n) { if (n.t === 'not' || n.t === 'sh') go(n.a); else if (n.t === 'bin') { go(n.a); go(n.b); } if (n.t !== 'bits') out.push(n); })(ast); return out; })(r.ast);
  for (let guard = 0; guard < 30 && !r.over; guard++) {
    if (lab.hand.item) release();
    if (r.ask) { answer(); continue; }
    const loose = lab.slots.filter(x => (x.role === 'shelf' || x.role === 'mout') && x.items.length);
    const next = work.find(n => !r.ran.has(n));
    if (!next) { carry(loose.find(x => top(x).node === r.ast), r.ans); continue; }
    const tr = loose.find(x => r.parent.get(top(x).node) === next);
    carry(tr, r.mach.get(next).ins.find(x => !x.items.length));
  }
  ok(r.over, 'bits round did not finish');
}
function setLamps(want) {
  const r = R();
  for (let k = 0; k < 5; k++) if (r.x[k] !== want[k]) { reach(r.lamps[k]); s().setHand(true); s().setHand(false); s().frame(1); }
  ok(r.x === want, 'lamps are ' + r.x + ' not ' + want);
}
function solveSolve(right = true) {
  const r = R();
  while (r.ask) answer();
  setLamps(right ? r.p.sol : r.p.sol.replace(/^./, c => c === '1' ? '0' : '1'));
  clickBtn('Run the machines');
  if (right) ok(r.over, 'solve round did not finish');
}
const SOLVE = { stack: solveStack, tree: solveTree, infix: solveInfix, bits: solveBits, solve: () => solveSolve(true) };
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

// ---------------------------------------------------------------- break tests
const T = {};
T.history = () => {
  s().start(0); SOLVE[M().m.kind]();
  const d = document.querySelector('#mission .cl-log summary'), n = d ? parseInt(d.textContent.split('(')[1], 10) : 0;
  ok(d && d.textContent.startsWith('What has happened so far (') && n >= 3, 'no What has happened so far list: ' + (d ? d.textContent : 'none'));
};
T.liveStack = () => {
  s().start(0); const r = R(); carry(r.belt[r.order[0]], r.stack); carry(r.belt[r.order[1]], r.stack);
  const txt = document.querySelector('.cl-expr').textContent.split(' ').join('').split('\n').join('').split('\t').join('');
  ok(txt.includes('Stack(topfirst):24'), 'the live stack is wrong: ' + txt);
};
T.distinctCubes = () => {
  // no two cubes (or trays) in one round may look the same, in tutorials, challenges and walkthrough examples
  const lab = s();
  for (let i = 0; i < lab.missions.length; i++) {
    const m = lab.missions[i];
    for (let k = 0; k < (m.type === 'challenge' ? 30 : 1); k++) {
      const p = m.gen(), seen = [];
      if (p.t) (function go(n) { if (n.op) { go(n.l); go(n.r); } const inf = window.NotationCore.toInfix(n); seen.push(n.op ? (/[A-Z]/.test(inf) ? null : String(window.NotationCore.evaluate(n))) : n.v); })(p.t);
      else if (p.src && !/x/.test(p.src)) { const B = window.BitCore, ast = B.parse(p.src); (function go(n) { if (n.t === 'not' || n.t === 'sh') go(n.a); else if (n.t === 'bin') { go(n.a); go(n.b); } seen.push(n.t === 'bits' ? n.v : B.evaluate(n)); })(ast); }
      const vals = seen.filter(v => v != null);
      ok(new Set(vals).size === vals.length, m.id + ': two cubes look the same: ' + vals.join(' '));
    }
  }
};
T.attention = () => {
  const lab = s(); lab.start(0); const r = R(), panel = $('mission');
  ok(panel.querySelector('.steps li.now.attn'), 'the step you are on does not glow');
  carry(r.belt[r.order[0]], r.stack); carry(r.belt[r.order[1]], r.stack); carry(r.belt[r.order[2]], r.O); carry(r.stack, r.R); carry(r.stack, r.L);
  const q = panel.querySelector('.ask'); ok(q && q.classList.contains('attn'), 'the prediction does not glow');
  const box = panel.getBoundingClientRect(), qr = q.getBoundingClientRect();
  ok(qr.top >= box.top - 1 && qr.bottom <= box.bottom + 1, 'the prediction is not scrolled into view');
  answer(); ok(!panel.querySelector('.ask'), 'the prediction stayed after it was answered');
};
T.explains = () => {
  const lab = s(), last = () => (window.__explained || []).slice(-1)[0] || '';
  lab.start(0); const r = R();
  ok(/postfix, so we read the belt from left to right/.test(last()), 'no postfix start explanation: ' + last());
  carry(r.belt[r.order[0]], r.stack); ok(/is a number, so it goes on the stack/.test(last()), 'no push explanation: ' + last());
  carry(r.belt[r.order[1]], r.stack); carry(r.belt[r.order[2]], r.O);
  ok(/never goes on the stack/.test(last()), 'no operator explanation: ' + last());
  carry(r.stack, r.R); ok(/first cube off the stack.*right side/.test(last()), 'no first-pop explanation: ' + last());
  carry(r.stack, r.L); answer(); ok(/The machine works out/.test(last()), 'no machine explanation: ' + last());
  ok(!$('explain').hidden && $('explain').textContent.length > 20, 'the What just happened card is not showing');
  for (const id of ['tree-t', 'infix-t', 'bits-t', 'solve-t']) {
    const before = window.__explainCount || 0;
    lab.start(lab.missions.findIndex(m => m.id === id)); SOLVE[M().m.kind]();
    ok((window.__explainCount || 0) - before >= 4, id + ': too few step explanations');
  }
};
T.holdPrompts = () => {
  const lab = s(), hint = () => $('hint').textContent, key = () => $('keyWhat').textContent;
  lab.start(0); const r = R();
  reach(r.belt[r.order[0]]); lab.frame(1);
  ok(/Hold Space/.test(hint()) && /hold to pick up/i.test(key()), 'no Hold Space prompt at a belt cube: ' + hint());
  lab.setHand(true); lab.frame(2); lab.setHand(false); lab.frame(1);
  ok(/Keep holding Space to carry/.test(lab.toastText()) && top(r.belt[r.order[0]]), 'a quick tap on a belt cube gave no Keep holding message');
  carry(r.belt[r.order[0]], r.stack); carry(r.belt[r.order[1]], r.stack); carry(r.belt[r.order[2]], r.O);
  reach(r.stack); lab.frame(1);
  ok(/already in place/.test(hint()), 'no hold-longer prompt at a placed cube: ' + hint());
  lab.setHand(true); lab.frame(3);
  ok(parseFloat($('holdBar').style.width) > 0 && !lab.hand.item, 'the hold bar does not fill during a hold');
  lab.setHand(false); lab.frame(1);
  ok(/Hold Space a little longer/.test(lab.toastText()) && r.stack.items.length === 2, 'a short hold on a placed cube gave no message');
  lab.start(lab.missions.findIndex(m => m.id === 'solve-c')); reach(R().lamps[0]); lab.frame(1);
  ok(/Press Space/.test(hint()) && /press/i.test(key()), 'no Press Space prompt at a lamp: ' + hint());
};
T.outOfOrder = () => {
  s().start(0); const r = R();
  const second = r.belt[r.order[1]];
  reach(second); press();
  ok(!s().hand.item, 'took a belt cube out of order');
  release();
};
T.numberInMachine = () => {
  s().start(1); const r = R();
  const b = r.belt[r.order[0]];
  carry(b, r.O);
  ok(r.spoilt && top(b) && !r.O.items.length, 'a number in the OP slot was not a mistake, or the cube did not go back');
  solveStack();
  ok(M().have === 0, 'a spoilt round counted');
};
T.wrongSide = () => {
  s().start(1); const r = R();
  for (let g = 0; g < 20 && !r.op; g++) { const b = r.belt[r.order[r.next]]; carry(b, top(b).role === 'op' ? r.O : r.stack); }
  carry(r.stack, r.L);   // postfix: the first cube off the stack belongs on the right
  ok(r.spoilt && !r.L.items.length && r.stack.items.length >= 2, 'first pop on the left was not a mistake');
  take(r.stack); s().frame(2); { const g = s().guideTarget(); ok(g && g.exact && g.slot === r.R, 'after a mistake the guide does not show the RIGHT side'); } release();
};
T.tapNeedsHold = () => {
  s().start(0); const r = R();
  carry(r.belt[r.order[0]], r.stack);
  carry(r.belt[r.order[1]], r.stack);
  carry(r.belt[r.order[2]], r.O);
  reach(r.stack); s().setHand(true); s().setHand(false); s().frame(1);
  ok(r.stack.items.length === 2 && !s().hand.item, 'a quick tap took a cube off the stack');
};
T.lockedDuringPredict = () => {
  s().start(0); const r = R();
  carry(r.belt[r.order[0]], r.stack); carry(r.belt[r.order[1]], r.stack); carry(r.belt[r.order[2]], r.O);
  carry(r.stack, r.R); carry(r.stack, r.L);
  ok(!!r.ask, 'no prediction after both sides');
  reach(r.belt[r.order[3]]); press();
  ok(!s().hand.item, 'grabbed while a prediction was waiting'); release();
  answer(false); ok(!!r.ask && /Not quite/.test($('mission').textContent), 'tutorial wrong prediction should ask again');
  answer(true); ok(!r.ask && r.out.items.length === 1, 'the machine did not run');
};
T.wrongPredictChallenge = () => {
  s().start(3); const r = R();
  for (let g = 0; g < 20 && !r.ask; g++) {
    if (r.op) { const first = !r.L.items.length && !r.R.items.length; carry(r.stack, first ? r.L : r.R); continue; }
    const b = r.belt[r.order[r.next]]; carry(b, top(b).role === 'op' ? r.O : r.stack);
  }
  answer(false);
  ok(r.spoilt && !r.ask && r.out.items.length === 1, 'a wrong challenge prediction did not spoil the round and run the machine');
};
T.treeWrongSpot = () => {
  s().start(4); const r = R(), t = r.p.t;
  const leaf = r.supply.find(x => /[A-Z0-9]/.test(top(x).sym));
  carry(leaf, r.ped.get(t));
  ok(!r.ped.get(t).items.length && /top of the tree/.test(r.why || ''), 'a letter on the top pedestal was accepted');
  solveTree();
};
T.treeReadOrder = () => {
  s().start(5); const r = R();
  for (const nd of preorderOf(r.p.t)) carry(s().slots.find(x => x.role === 'supply' && x.items.length && top(x).sym === (nd.op || nd.v)), r.ped.get(nd));
  carry(r.ped.get(r.p.t), r.rail);   // postfix: the top comes last
  ok(r.readN === 0 && r.ped.get(r.p.t).items.length === 1, 'postfix read the top first');
};
T.infixBracket = () => {
  s().start(7); const r = R();
  // tutorial: (A + B) * C. Bring A before the bracket: a mistake, refused
  carry(r.ped.get(r.E[1].node), r.rail);
  ok(r.k === 0 && /Open a bracket/.test(r.why || ''), 'A before ( was accepted');
  carry(s().slots.find(x => x.crate === ')'), r.rail);
  ok(r.k === 0 && !s().hand.item, 'a ) at the start was accepted');
  solveInfix();
};
T.bitsWrongMachine = () => {
  s().start(9); const r = R();   // NOT 10110 AND 01101: 10110 belongs to NOT
  const notNode = [...r.mach.keys()].find(n => n.t === 'not'), andNode = [...r.mach.keys()].find(n => n.t === 'bin');
  const tr = r.shelf.find(x => r.parent.get(top(x).node) === notNode);
  carry(tr, r.mach.get(andNode).ins[0]);
  ok(!r.mach.get(andNode).ins[0].items.length && top(tr) && /NOT/.test(r.why || ''), 'a tray went into the wrong machine');
  solveBits();
};
T.solveWrongRun = () => {
  s().start(s().missions.findIndex(m => m.id === 'solve-c')); solveSolve(false);
  ok(R().over && R().spoilt && M().have === 0, 'a wrong first run counted');
};
T.leavePrompt = () => {
  s().start(0); const r = R();
  carry(r.belt[r.order[0]], r.stack);
  [...document.querySelectorAll('#mission .sec-list button')].find(b => !b.disabled && b.getAttribute('aria-current') === 'false')?.click();
  ok(!!document.querySelector('#mission .leave'), 'no Leave this mission prompt mid-round');
  clickBtn('Stay'); ok(M().m.id === 'post-t' && r.stack.items.length === 1, 'Stay lost the round');
};
T.challengeGlow = () => {
  const lab = s(); lab.start(lab.missions.findIndex(m => m.id === 'bits-c')); lab.frame(2);
  const loose = lab.slots.filter(x => (x.role === 'shelf' || x.role === 'mout') && x.items.length).map(x => x.items[x.items.length - 1]);
  const g = lab.guideTarget();
  ok(g && !g.exact && loose.every(x => lab.glowing.has(x)), 'bit-string challenge: not every tray glows, or one is singled out');
  lab.start(0); lab.frame(2); const r = R();
  ok(lab.glowing.has(r.belt[r.order[0]].items[0]), 'the next belt cube does not glow from a distance');
};
T.lessonMode = () => {
  const lab = s(), idx = id => lab.missions.findIndex(m => m.id === id);
  lab.start(0); clickBtn('Lesson mode');
  ok(lab.lessonMode.on && $('nbLesson') && $('nbLesson').options.length === 2, 'lesson mode did not open with two lessons');
  for (const L of lab.LESSONS) {
    const mins = L.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
    ok(mins >= 50 && mins <= 75, L.id + ' lesson is ' + mins + ' minutes');
    ok(L.missions.every(id => idx(id) >= 0), L.id + ' names a missing mission');
  }
  const sel = $('nbLesson'); sel.value = 'bits'; sel.dispatchEvent(new Event('change'));
  ok(lab.lessonMode.id === 'bits' && lab.LESSONS[1].missions.includes(M().m.id), 'choosing Lesson 2 did not open a bit-string activity');
  lab.start(idx('bits-t'));
  ok(lab.nextMission() === idx('gates-t'), 'next activity is not the next one in the lesson');
  lab.start(idx('solve-c'));
  ok(lab.nextMission() === idx('c-bits'), 'after the last activity the extension challenges should come next');
  ok(/Lesson 2: [\s\S]*Activity 7 of 9/.test($('mission').textContent), 'panel does not show the lesson position');
  clickBtn('All missions');
  ok(!lab.lessonMode.on && document.querySelectorAll('#mission details.sec').length === 7, 'All missions did not come back');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    if (s().missions[i].noHelp) { ok(!hasBtn('Walk me through it'), s().missions[i].id + ' is a no-help challenge but shows Walk me through it'); continue; }
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt), s().missions[i].id + ' walkthrough did not open');
    ok(!/[–—]/.test(txt), 'dash in walkthrough');
    for (let k = 0; k < 20 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};
T.guideEverywhere = () => {
  // tutorials: the arrow or ring always shows the next thing while nothing is waiting
  for (const i of [0, 2, 4, 7, 9, 10]) {
    s().start(i); s().pos.x = 2; s().pos.y = M().m.kind === 'tree' || M().m.kind === 'infix' ? 16 : s().pos.y; s().frame(2);
    const g = s().guideTarget(); ok(!!g, s().missions[i].id + ' has no guide at the start'); ok(!g || s().arrows > 0, s().missions[i].id + ' guide arrow not drawn');
  }
};

function fuzz(i, n) {
  s().start(i);
  const lab = s();
  for (let k = 0; k < n; k++) {
    if (R().over) break;
    if (R().ask) { answer(Math.random() < 0.7); continue; }
    const from = lab.slots.filter(x => x.items.length || x.crate || x.role === 'lamp');
    const a = from[Math.floor(Math.random() * from.length)];
    try {
      reach(a);
      if (a.role === 'lamp') { lab.setHand(true); lab.setHand(false); continue; }
      press();
      if (!lab.hand.item) { release(); continue; }
      const to = lab.slots.filter(x => x.role !== 'lamp');
      put(to[Math.floor(Math.random() * to.length)]);
    } catch (e) { if (lab.hand.item) release(); }
  }
  if (lab.hand.item) release();
  if (R().over && M().phase !== 'done') clickBtn('Next round');
  // whatever happened, the mission can still be finished
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
export const helpers = { carry, reach, take, put, answer, walkTo };
