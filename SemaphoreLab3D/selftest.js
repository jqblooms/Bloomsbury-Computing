// Semaphore Lab 3D self-test. Plays every mission with the pupil's controls (walking to a letter pad and pressing
// Space, the flag picker and Send), checks the letter table, then tries to break it: wrong letters, wrong flags,
// spaces, the hidden card, and random play that must never leave a mission stuck. Run: open index.html?debug=1, then
//   setTimeout(async () => { const t = await import('./selftest.js?' + Date.now()); await t.run({ parts: ['play', 'break', 'fuzz'] }); }, 0)
// and read window.__selftest.
const s = () => window.__lab;
const $ = id => document.getElementById(id);
let fails = [];
const ok = (c, msg) => { if (!c) fails.push(msg); return !!c; };
const R = () => s().R, M = () => s().M;

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
// stand next to a pad, facing it, until here() says the hand is over it
function reach(sl, here) {
  for (let k = 0; k < sl.w; k++) for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
    const px = sl.x + k + dx * 0.8, py = sl.y + dy * 0.8;
    if (!s().free(px, py)) continue;
    try { walkTo(px, py, Math.atan2(-dx, -dy)); } catch (e) { continue; }
    if (here()) return;
  }
  throw new Error('cannot reach the ' + (sl.letter != null ? JSON.stringify(sl.letter) + ' crate' : sl.role + ' box'));
}
// like a pupil: hold Space at a letter crate, carry the cube to a box, let go
function deliver(from, to) {
  reach(from, () => s().grabTarget()?.slot === from);
  s().setHand(true); s().frame(12);
  if (!s().hand.item) throw new Error('nothing picked up from ' + JSON.stringify(from.letter));
  reach(to, () => s().nearestSlot(0.9, x => !x.press) === to);
  s().setHand(false); s().frame(1);
}
function clickBtn(text) { const b = [...document.querySelectorAll('#mission button, #card button')].find(x => x.textContent.trim() === text && !x.disabled); if (!b) throw new Error('no button ' + text); b.click(); s().frame(1); }
const hasBtn = text => [...document.querySelectorAll('#mission button')].some(x => x.textContent.trim() === text && !x.disabled);
function flags(p) {
  for (const b of document.querySelectorAll('#mission .sem-dir.on')) b.click();
  for (const k of p) document.querySelector('#mission .sem-dir[data-dir="' + k + '"]').click();
  s().frame(1);
}
const sendBtn = () => document.querySelector('#mission [data-send]');
function afterQ() { const m = M().m; if (M().phase === 'done' && !M().afterOk) clickBtn(m.after.options[0]); }

function solve() {
  const r = R();
  for (let g = 0; g < 40 && !r.over; g++) {
    const want = r.p.text[r.at];
    if (M().m.kind === 'read') deliver(r.pad[want], r.out[r.at]);
    else { flags(s().POSE[want]); sendBtn().click(); s().frame(1); }
  }
  ok(r.over, M().m.id + ': round did not finish (' + s().toastText() + ')');
}
function playMission(i) {
  s().start(i);
  const m = M().m;
  for (let round = 0; round < 8 && M().phase !== 'done'; round++) { if (R().over) clickBtn('Next round'); solve(); }
  ok(M().phase === 'done', m.id + ' not done (' + s().toastText() + ')');
  afterQ();
  ok(M().afterOk, m.id + ' why question not answered');
  ok(s().done[m.id], m.id + ' not saved as done');
}
const idx = id => s().missions.findIndex(m => m.id === id);

const T = {};
T.letterTable = () => {
  const P = s().POSE, keys = new Set();
  ok(Object.keys(P).filter(L => L !== ' ').length === 26, 'not 26 letters');
  for (const [L, p] of Object.entries(P)) {
    if (L !== ' ') ok(p[0] !== p[1] && p.every(k => k >= 0 && k < 8), L + ' has a bad pose');
    const k = Math.min(...p) + ',' + Math.max(...p); ok(!keys.has(k), L + ' repeats a pose'); keys.add(k);
  }
  // well-known shapes: R arms out, D up and down, N both low, J up and right
  ok(P.R + '' === '2,6' && P.D + '' === '0,4' && P.N + '' === '1,7' && P.J + '' === '4,6', 'a known letter shape is wrong');
};
T.wordsFit = () => {
  for (const m of s().missions) for (let k = 0; k < 30; k++) { const p = m.gen(); ok(/^[A-Z ]+$/.test(p.text) && p.text.length <= 13 && (m.spaces || !p.text.includes(' ')), m.id + ': bad word ' + p.text); }
};
T.wrongLetter = () => {
  s().start(idx('read-c')); const r = R(), want = r.p.text[0], wrong = want === 'A' ? 'B' : 'A';
  deliver(r.pad[wrong], r.out[0]);
  ok(!r.out[0].items.length, 'a wrong letter cube stayed in the box');
  ok(r.spoilt && r.at === 0 && /The flags show/.test(r.why || ''), 'a wrong letter was accepted');
  ok(R() !== r && M().have === 0 && /new round/.test(s().toastText()), 'a mistake did not start a new round');
};
T.carryNotPress = () => {
  s().start(s().missions.findIndex(m => m.id === 'read-t')); const r = R(), want = r.p.text[0];
  ok(!Object.values(r.pad).some(p => p.press), 'a letter is still pressed instead of carried');
  deliver(r.pad[r.p.text[1]], r.out[1]);
  ok(!r.spoilt && !r.out[1].items.length && /in order/.test(s().toastText()), 'a cube in a later box was not just sent back with a hint');
  reach(r.pad[want], () => s().grabTarget()?.slot === r.pad[want]); s().setHand(true); s().frame(12);
  const g = s().guideTarget(); ok(g && g.slot === r.out[0], 'carrying a cube, the ring does not show the next box');
  reach(r.out[0], () => s().nearestSlot(0.9, x => !x.press) === r.out[0]); s().setHand(false); s().frame(1);
  ok(r.at === 1 && r.out[0].items.length === 1 && r.out[0].items[0].sym === want, 'the right cube did not stay in the box');
};
T.tutorialNoArrowFirst = () => {
  s().start(idx('read-t')); ok(!s().guideTarget(), 'the tutorial points at the answer before the pupil tries');
  const r = R(), want = r.p.text[0], wrong = want === 'A' ? 'B' : 'A';
  deliver(r.pad[wrong], r.out[0]); s().frame(2);
  ok(r.helpAt === 0 && !s().guideTarget(), 'a wrong guess makes the arrow point at the right letter');
  ok(!new RegExp('That is ' + want + '\\b').test(s().toastText() + ' ' + (r.why || '')), 'a wrong guess names the right letter');
  ok(document.querySelector('.sem-group.hint'), 'a wrong guess does not light the card row');
};
T.wrongFlags = () => {
  s().start(idx('send-c')); const r = R(), want = r.p.text[0];
  ok(sendBtn().disabled, 'Send works with no flags');
  const bad = s().POSE[want][0] === 0 ? [2, 6] : [0, 4];
  flags(bad); sendBtn().click(); s().frame(1);
  ok(r.spoilt && r.at === 0 && /Those flags make/.test(r.why || ''), 'wrong flags were accepted');
};
T.myBlobPoses = () => {
  s().start(idx('send-t')); flags(s().POSE.H); s().frame(3);
  ok(s().pos.face === 0, 'the sender does not face the reader');
};
T.spaces = () => {
  s().start(idx('msg-c')); const r = R();
  ok(r.pad[' '] && /SPACE/.test(r.pad[' '].label || ''), 'no SPACE pad');
  solve(); ok(r.over && !r.spoilt, 'a message with spaces could not be decoded');
};
T.cardShown = () => {
  s().start(idx('ag-t'));
  const cards = document.querySelectorAll('#mission details.bin-rules-box[open] .sem-card');
  ok(cards.length === 7, 'the first tutorial card does not show just A to G (' + cards.length + ')');
  s().start(idx('nocard-c')); ok(!document.querySelector('#mission .sem-card') && !hasBtn('Walk me through it'), 'No Card still shows the card or help');
};
T.lessonMode = () => {
  const lab = s(); lab.start(0); clickBtn('Lesson mode');
  const L = lab.LESSONS[0], mins = L.missions.reduce((n, id) => n + lab.minsOf(lab.missions[idx(id)]), 0);
  ok(lab.lessonMode.on && mins >= 50 && mins <= 70, 'lesson mode off or ' + mins + ' minutes');
  clickBtn('All missions');
};
T.walkthroughs = () => {
  for (let i = 0; i < s().missions.length; i++) {
    s().start(i);
    if (s().missions[i].noHelp) continue;
    clickBtn('Walk me through it');
    const txt = $('card').textContent; ok(/Step 1 of/.test(txt) && !/[–—]/.test(txt), s().missions[i].id + ' walkthrough did not open or has a dash');
    for (let k = 0; k < 30 && !$('cardWrap').hidden; k++) [...$('card').querySelectorAll('button')].pop().click();
    ok($('cardWrap').hidden, 'walkthrough did not close');
  }
};
// no flag may go into the floor or the podium, for any letter, held by the signaller or by you
T.flagsClearFloor = () => {
  const lab = s(), lowest = list => { let low = Infinity; for (const f of list) { if (!f.visible) continue; f.updateWorldMatrix(true, true); f.traverse(o => { const p = o.geometry?.attributes?.position; if (!p) return; const v = f.position.clone(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); o.localToWorld(v); low = Math.min(low, v.y); } }); } return low; };
  lab.start(lab.missions.findIndex(m => m.id === 'read-c')); const r = R();
  let worst = Infinity, worstL = '';
  for (const L of Object.keys(lab.POSE)) { r.p.text = L; r.at = 0; lab.frame(60); const low = lowest(lab.flags.slice(0, 2)); if (low < worst) { worst = low; worstL = L; } }
  ok(worst > 2, 'a signaller flag goes into the floor for ' + JSON.stringify(worstL) + ' (' + worst.toFixed(1) + ')');
  lab.start(lab.missions.findIndex(m => m.id === 'send-c')); worst = Infinity;
  for (const L of Object.keys(lab.POSE)) { if (L === ' ') continue; R().pose = lab.POSE[L].slice(); lab.frame(60); const low = lowest(lab.flags.slice(2)); if (low < worst) { worst = low; worstL = L; } }
  ok(worst > 2, 'one of your flags goes into the floor for ' + worstL + ' (' + worst.toFixed(1) + ')');
};
T.noDashes = () => {
  const all = JSON.stringify(s().missions.map(m => [m.title, m.intro, m.after])) + $('mission').textContent;
  ok(!/[–—]/.test(all), 'a dash in the wording');
};

function fuzz(i, n) {
  s().start(i);
  const r = R();
  for (let k = 0; k < n && !r.over; k++) {
    try {
      if (M().m.kind === 'read') { const pads = Object.values(r.pad); deliver(pads[Math.floor(Math.random() * pads.length)], r.out[Math.floor(Math.random() * r.out.length)]); }
      else { flags([Math.floor(Math.random() * 8), Math.floor(Math.random() * 8)]); sendBtn()?.click(); s().frame(1); }
    } catch (e) { }
  }
  for (let round = 0; round < 8 && M().phase !== 'done'; round++) { if (R().over) clickBtn('Next round'); solve(); }
  ok(M().phase === 'done', 'after random play ' + M().m.id + ' could not be finished');
}

export async function run({ parts = ['play', 'break'] } = {}) {
  fails = [];
  const out = { parts, tests: 0 };
  const step = async (name, fn) => { out.tests++; try { fn(); } catch (e) { fails.push(name + ': ' + e.message); } console.log('selftest: ' + name + (fails.length ? ' (' + fails.length + ' fails so far)' : '')); await new Promise(r => setTimeout(r, 0)); };
  if (parts.includes('play')) for (let i = 0; i < s().missions.length; i++) await step('play ' + s().missions[i].id, () => playMission(i));
  if (parts.includes('break')) for (const [k, fn] of Object.entries(T)) await step(k, fn);
  if (parts.includes('fuzz')) for (let i = 0; i < s().missions.length; i++) await step('fuzz ' + s().missions[i].id, () => fuzz(i, 12));
  out.fails = fails.slice();
  window.__selftest = out;
  console.log('selftest: DONE ' + out.tests + ' tests, ' + fails.length + ' fails' + (fails.length ? ': ' + fails.join(' | ') : ''));
  return out;
}
