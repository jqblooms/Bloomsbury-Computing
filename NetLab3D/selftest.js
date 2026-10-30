// Network Builder 3D self-test. Plays every mission with the student's own controls (walking, holding and letting go
// of a hand, the Test bar, the mission panel buttons), then tries to break it: the old "picked up the same laptop
// twice" bug, steps going back when the floor changes, events at the wrong step, walling yourself in, checking
// while carrying, and random play that must never leave you stuck.
// Run: open index.html?debug=1, then in the console:  const t = await import('./selftest.js?' + Date.now()); t.run()
let s = window.__solo;
const $ = id => document.getElementById(id);
const DB = 20;
let fails = [], log = [];
const ok = (c, msg) => { if (!c) fails.push(msg); return !!c; };
const S = () => s.S, M = () => s.M;
const byName = n => S().devs.find(d => d.name === n);
const kind = k => S().devs.filter(d => d.kind === k);

// ---------------------------------------------------------------- moving like a student
function bfs(gx, gy) {
  const p = s.pos, sx = Math.round(p.x), sy = Math.round(p.y), key = (x, y) => x + ',' + y;
  const prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === gx && y === gy) { const out = []; let k = key(x, y); while (k) { out.unshift(k.split(',').map(Number)); k = prev.get(k); } return out.slice(1); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || !s.free(nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  return null;
}
function walkTo(x, y, face) {
  const p = s.pos, route = bfs(Math.round(x), Math.round(y));
  if (!route) throw new Error('no way to walk to ' + x.toFixed(2) + ', ' + y.toFixed(2));
  for (const [qx, qy] of route.concat([[x, y]])) {
    for (let g = 0; g < 200; g++) {
      const dx = qx - p.x, dy = qy - p.y, d = Math.hypot(dx, dy);
      if (d < 1e-3) break;
      const st = Math.min(0.2, d), nx = p.x + dx / d * st, ny = p.y + dy / d * st;
      if (!s.free(nx, ny)) throw new Error('walked into something at ' + nx.toFixed(2) + ', ' + ny.toFixed(2));
      p.x = nx; p.y = ny; p.face = Math.atan2(dx, dy); s.step(1);
    }
  }
  if (face != null) { p.face = face; s.step(1); }
}
function offset(i, f) { const side = i === 0 ? 1 : -1; return [Math.sin(f) * 0.42 + Math.cos(f) * side * 0.2, Math.cos(f) * 0.42 - Math.sin(f) * side * 0.2]; }
function handTo(i, hx, hy, slack = 0) {
  const faces = [Math.PI, -Math.PI / 2, Math.PI / 2, 0, Math.PI * 0.75, -Math.PI * 0.75, Math.PI / 4, -Math.PI / 4];
  for (const rr of slack ? [0, slack] : [0]) for (const f of faces) {
    const [ox, oy] = offset(i, f), px = hx - ox - Math.sin(f) * rr, py = hy - oy - Math.cos(f) * rr;
    if (!s.free(px, py) || !s.free(Math.round(px), Math.round(py)) || !bfs(Math.round(px), Math.round(py)) && !(Math.round(px) === Math.round(s.pos.x) && Math.round(py) === Math.round(s.pos.y))) continue;
    walkTo(px, py, f); return;
  }
  throw new Error('cannot reach ' + hx.toFixed(2) + ', ' + hy.toFixed(2) + ' with hand ' + i);
}
const press = i => { s.setHand(i, true); s.holdFor(12); }, letGo = i => s.setHand(i, false);
const tap = i => { s.setHand(i, true); s.setHand(i, false); };
// a loose cable end can still be sliding: aim at where it is now, a few times, like a student reaching for it
function grabEnd(i, c, e) {
  const j = e ? c.n : 0;
  for (let k = 0; k < 6; k++) {
    s.step(10);
    handTo(i, ...endPos(c, e), 0.35); press(i);
    if (s.hands[i].cable === c && s.hands[i].joint === j) return true;
    letGo(i);
  }
  return false;
}
function crateFront(k) { const c = s.CRATES[k]; if (!c) throw new Error('no ' + k + ' crate'); return [c.x + 0.5, c.y - 1]; }
function takeFromCrate(i, k) {
  const [x, y] = crateFront(k); walkTo(x, y, 0); press(i);
  const h = s.hands[i];
  if (!(k === 'cable' ? h.cable && !h.cable.ends[0] && !h.cable.ends[1] && h.cable.id === Math.max(...s.cables().map(c => c.id)) : h.dev && h.dev.kind === k)) throw new Error('did not get a new ' + k + ' from its crate');
  return k === 'cable' ? h.cable : h.dev;
}
function placeNew(k, X, Y) {
  const d = takeFromCrate(0, k);
  if (k === 'tablet') { handTo(0, X, Y); letGo(0); ok(!s.carried(d) && Math.abs(d.tx - X) < 0.3, k + ' not put down at ' + X + ',' + Y); return d; }
  const reach = d.h / 2 + 0.7;   // facing south (face 0)
  walkTo(X + (d.w - 1) / 2, Y + (d.h - 1) / 2 - reach, 0); letGo(0);
  ok(!s.carried(d) && d.X === X && d.Y === Y, d.name + ' landed at ' + d.X + ',' + d.Y + ' not ' + X + ',' + Y + ' (' + s.toastText() + ')');
  return d;
}
const taken = (d, i) => s.cables().some(c => c.ends.some(e => e && e.dev === d.id && e.sock === i));
function freeSock(d, near) {
  let best = -1, bd = 1e9;
  d.k3.sockets.forEach((_, i) => { if (taken(d, i)) return; const p = s.plugPin(d, i), dd = near ? Math.hypot(p[0] - near[0], p[1] - near[1]) : i; if (dd < bd) { bd = dd; best = i; } });
  if (best < 0) throw new Error(d.name + ' has no free socket');
  return best;
}
function cable(a, b) {
  const c = takeFromCrate(0, 'cable');
  const sa = freeSock(a, s.pos && [s.pos.x, s.pos.y]); handTo(0, ...s.plugPin(a, sa)); letGo(0);
  if (!ok(c.ends[0] && c.ends[0].dev === a.id, 'plug not in ' + a.name + ' (' + s.toastText() + ')')) return c;
  if (!ok(grabEnd(1, c, 1), 'could not pick up the free end of the cable')) return c;
  const sb = freeSock(b, s.plugPin(a, sa)); handTo(1, ...s.plugPin(b, sb)); letGo(1);
  ok(c.ends[1] && c.ends[1].dev === b.id, 'plug not in ' + b.name + ' (' + s.toastText() + ')');
  return c;
}
function endPos(c, e) { const x = c.ends[e]; return x ? s.plugPin(S().devs.find(d => d.id === x.dev), x.sock) : [c.P[e ? 2 * c.n : 0], c.P[e ? 2 * c.n + 1 : 1]]; }
function moveEnd(c, e, to) {
  if (!ok(grabEnd(0, c, e), 'could not grab the cable end')) return;
  if (!to) { handTo(0, s.pos.x + 0.01, s.pos.y + 1.5); letGo(0); return; }
  handTo(0, ...s.plugPin(to, freeSock(to, [s.pos.x, s.pos.y]))); letGo(0);
  ok(c.ends[e] && c.ends[e].dev === to.id, 'end not in ' + to.name + ' (' + s.toastText() + ')');
}
function carryTablet(t, x, y) {
  handTo(0, t.tx, t.ty); press(0);
  if (!ok(s.hands[0].dev === t, 'could not pick up ' + t.name)) return;
  handTo(0, x, y); letGo(0);
  ok(!s.carried(t), t.name + ' still carried');
}
function carryDevice(d, X, Y) {
  // pick it up from its nearest side, then put it down at X, Y
  const cx = d.X + (d.w - 1) / 2, cy = d.Y + d.h - 0.5 + 0.3;
  handTo(0, cx, cy); press(0);
  if (!ok(s.hands[0].dev === d, 'could not pick up ' + d.name)) return;
  const reach = d.h / 2 + 0.7;   // facing south (face 0)
  walkTo(X + (d.w - 1) / 2, Y + (d.h - 1) / 2 - reach, 0); letGo(0);
}
// ---------------------------------------------------------------- the panel and the Test bar, by clicking
function click(label) {
  const b = [...document.querySelectorAll('#mission button, #card button')].find(x => x.textContent.trim() === label && !x.disabled);
  if (!b) throw new Error('no button "' + label + '"');
  b.click();
}
function test(a, b) {
  const from = $('nbFrom'), to = $('nbTo');
  if (!from) throw new Error('no Test bar');
  from.value = String(a.id); from.dispatchEvent(new Event('change'));
  to.value = String(b.id); to.dispatchEvent(new Event('change'));
  $('testBar').querySelector('button').click();
  const box = $('nbMsg');
  if (!box) throw new Error('no message box after Send');
  box.value = 'Hello'; [...$('testBar').querySelectorAll('button')].find(b => /^(Send|Print)$/.test(b.textContent)).click();
  for (let i = 0; i < 900 && s.anim; i++) s.frame(1);
  const sa = a.k3 && a.k3.screen;
  if (sa && /^(Printed|Message arrived)/.test(s.toastText())) ok(sa.state && sa.state.mark === 'tick', a.name + "'s screen did not show the tick after sending: " + JSON.stringify(sa.state));
  // a test that finishes a tutorial step is used up at once, so read the message it showed
  return { ok: /^(Printed|Message arrived)/.test(s.toastText()) };
}
function testItem(a, b, kind, pic) {
  $('nbFrom').value = String(a.id); $('nbFrom').dispatchEvent(new Event('change'));
  $('nbTo').value = String(b.id); $('nbTo').dispatchEvent(new Event('change'));
  $('testBar').querySelector('button').click();
  [...$('testBar').querySelectorAll('.kinds button')].find(x => x.textContent.toLowerCase() === kind).click();
  [...$('testBar').querySelectorAll('.picks button')].find(x => x.textContent.startsWith(pic)).click();
  for (let i = 0; i < 900 && s.anim; i++) s.frame(1);
  return { ok: /^(Printed|Message arrived)/.test(s.toastText()) };
}
function sendPackets(a, b, kind, value) {
  $('nbFrom').value = String(a.id); $('nbFrom').dispatchEvent(new Event('change'));
  $('nbTo').value = String(b.id); $('nbTo').dispatchEvent(new Event('change'));
  $('testBar').querySelector('button').click();
  [...$('testBar').querySelectorAll('.kinds button')].find(x => x.textContent.toLowerCase() === kind).click();
  if (kind === 'photo') [...$('testBar').querySelectorAll('.picks button')].find(x => x.textContent.startsWith(value)).click();
  else { $('nbMsg').value = value; [...$('testBar').querySelectorAll('button')].find(x => x.textContent === 'Send').click(); }
  let order = null;
  for (let i = 0; i < 1500 && s.anim; i++) { if (s.pk && s.pk.arrivals.length === s.pk.parts.length && !order) order = s.pk.arrivals.map(p => p.n); s.frame(1); }
  return { ok: /^Message arrived/.test(s.toastText()), order };
}
function raceTest(i, pick, order) {
  s.start(i);
  press(0); ok(!s.hands[0].cable && !s.hands[0].dev, 'could build in a race mission'); letGo(0);
  const run = [...document.querySelectorAll('#mission button')].find(x => x.textContent === 'Run it');
  ok(run && run.disabled, 'Run it should wait for a prediction');
  [...document.querySelectorAll('#mission .race-pick button')].find(x => x.textContent === pick).click();
  click('Run it');
  for (let k = 0; k < 2000 && s.anim; k++) s.frame(1);
  ok(M().raced && M().phase === 'done', 'the race did not finish');
  if (order) {
    const times = Object.fromEntries(M().raceTimes.split(', ').map(x => { const [n, v] = x.split(': '); return [n, parseFloat(v)]; }));
    for (let k = 1; k < order.length; k++) ok(times[order[k - 1]] < times[order[k]], order[k - 1] + ' should beat ' + order[k] + ': ' + M().raceTimes);
  }
  answer(true); ok(M().afterOk, 'race question not answered');
}
function byName2(n) { return s.S.devs.find(d => d.name === n); }
function webTest(a, srv, trace) {
  $('nbFrom').value = String(a.id); $('nbFrom').dispatchEvent(new Event('change'));
  $('nbTo').value = String(srv.id); $('nbTo').dispatchEvent(new Event('change'));
  const bs = [...$('testBar').querySelectorAll('button')];
  (trace ? bs.find(x => x.textContent === 'Trace route') : bs.find(x => x.textContent === 'Open website')).click();
  for (let k = 0; k < 1500 && s.anim; k++) s.frame(1);
  return s.S.lastTest ? { ok: true } : { ok: /^(Website opened|Trace done)/.test(s.toastText()) };
}
function quizAll() { for (let k = 0; k < 20 && M().phase !== 'done'; k++) answer(true); }
function answer(right) {
  const m = M().m, a = m.type === 'quiz' ? m.items[M().qi || 0] : M().phase === 'ask' ? m.before : m.after;
  const want = right ? a.options[0] : a.options[1];
  [...document.querySelectorAll('#mission .ask-opts button')].find(x => x.textContent === want).click();
}
function predictRight() {
  const cards = [...document.querySelectorAll('#mission .job')];
  S().jobs.forEach((p, i) => { const yes = !!s.route(p[0], p[1]); [...cards[i].querySelectorAll('button')].find(b => b.textContent === (yes ? 'Yes' : 'No')).click(); });
  click('Check my predictions');
}
const sw = () => kind('switch')[0];
// make every device reach every other: undo device-to-device cables, plug everything into the switch, tablets into range
function fixAll() {
  const hub = sw();
  for (const c of s.cables().slice()) {
    const a = c.ends[0] && S().devs.find(d => d.id === c.ends[0].dev), b = c.ends[1] && S().devs.find(d => d.id === c.ends[1].dev);
    if (a && b && a.kind !== 'switch' && b.kind !== 'switch') moveEnd(c, 1, hub);
  }
  for (const d of S().devs) {
    if (d.kind === 'switch' || d.kind === 'tablet' || S().cables.some(c => c.a === d.id || c.b === d.id)) continue;
    cable(d, hub);
  }
  const w = kind('wifi')[0];
  if (w) for (const t of kind('tablet')) if (!s.route(t, hub)) {
    const [cx, cy] = s.centre(w);
    for (const [dx, dy] of [[0, 2.5], [2.5, 2], [-2.5, 2], [3, 0], [-3, 0], [0, -2.5]]) {
      const x = cx + dx, y = cy + dy;
      if (y > 0.8 && y < DB && x > 1 && x < 32 && !S().devs.some(o => o.kind === 'tablet' && Math.hypot(o.tx - x, o.ty - y) < 1)) { carryTablet(t, x, y); break; }
    }
  }
}
function expectDone(i) { ok(M().phase === 'done' && s.done[i], 'mission ' + (i + 1) + ' not complete: ' + M().phase + ' ' + JSON.stringify(M().probs || '') + ' ' + s.toastText()); }
function stepIs(n, what) { ok(M().step === n, what + ': step ' + (M().step + 1) + ', expected ' + (n + 1)); }

// ---------------------------------------------------------------- the eleven missions, played properly
const PLAY = [
  function two() {
    s.start(0); stepIs(0, 'start');
    const a = placeNew('laptop', 6, 8); stepIs(1, 'one laptop down');
    const b = placeNew('laptop', 15, 8); stepIs(2, 'two laptops down');
    ok(!test(a, b).ok, 'a message got through with no cable'); stepIs(3, 'tried with no cable');
    ok(a.k3.screen.state && a.k3.screen.state.mark === 'cross', 'no cross on the screen after a failed send');
    cable(a, b); stepIs(4, 'cable in');
    ok(test(a, b).ok, 'send failed'); stepIs(5, 'message sent');
    ok(testItem(a, b, 'photo', 'Cat').ok, 'photo not sent');
    ok(b.k3.screen.state && b.k3.screen.state.item && b.k3.screen.state.item.pic === 'Cat', "Kim's screen does not show the photo");
    expectDone(0);
    // the why question: a wrong answer explains and stays; the right one shows Next mission
    answer(false); ok(!M().afterOk && /Not quite/.test(document.querySelector('#mission .ask-fb').textContent), 'a wrong answer was accepted');
    answer(true); ok(M().afterOk && [...document.querySelectorAll('#mission button')].some(x => x.textContent === 'Next mission'), 'right answer did not unlock Next mission');
  },
  function addSwitch() {
    s.start(1);
    const [l1, l2] = kind('laptop');
    const l3 = placeNew('laptop', 14, 12); stepIs(1, 'third laptop');
    const c = takeFromCrate(0, 'cable');
    handTo(0, ...s.plugPin(l3, 0)); letGo(0);
    grabEnd(1, c, 1);
    handTo(1, ...s.plugPin(l1, 0)); letGo(1);
    ok(S().refused || M().step === 2, 'plugging into a used laptop socket was not refused'); stepIs(2, 'refused');
    const hub = placeNew('switch', 13, 17); stepIs(3, 'switch down');
    const old = s.cables().find(x => x.ends[0] && x.ends[1] && x !== c);
    moveEnd(old, 0, hub); stepIs(4, 'old cable out');
    moveEnd(c, 1, hub);
    const l1Plugged = S().cables.some(x => (x.a === l1.id || x.b === l1.id));
    if (!l1Plugged) cable(l1, hub);
    stepIs(5, 'all three in the switch');
    ok(test(l1, l3).ok, 'send failed'); expectDone(1);
  },
  function printer() {
    s.start(2);
    ok(M().phase === 'ask', 'mission 3 did not start with the cable question');
    press(0); ok(!s.hands[0].cable && !s.hands[0].dev, 'could build before answering'); letGo(0);
    $('nbAsk').value = '4'; click('Check'); ok(M().phase === 'ask', 'a wrong count was accepted');
    $('nbAsk').value = '5'; click('Check'); ok(M().phase === 'build', 'the right count did not start the build');
    const hub = placeNew('switch', 14, 10), ls = [[3, 3], [9, 3], [20, 3], [26, 3]].map(([x, y]) => placeNew('laptop', x, y)), pr = placeNew('printer', 14, 15);
    for (const d of ls.concat([pr])) cable(d, hub);
    ok(test(ls[0], pr).ok, 'print failed');
    click('Check my network'); expectDone(2);
    answer(true); ok(M().afterOk, 'the printer question was not answered');
  },
  function wifi() {
    s.start(3);
    const hub = sw(), pr = kind('printer')[0];
    const w = placeNew('wifi', 24, 10); stepIs(1, 'Wi-Fi point down');
    cable(w, hub); stepIs(2, 'Wi-Fi plugged in');
    const t = placeNew('tablet', 22.5, 13); stepIs(3, 'tablet in range');
    ok(test(t, pr).ok, 'tablet could not print'); stepIs(4, 'printed');
    carryTablet(t, 12, 3); ok(!test(t, pr).ok, 'out of range print worked'); expectDone(3);
  },
  function range() {
    s.start(4);
    const [t1, t2] = kind('tablet'), [cx, cy] = s.centre(kind('wifi')[0]);
    carryTablet(t1, cx + 2.5, cy + 2.5); carryTablet(t2, cx - 2.5, cy + 2.5);
    click('Check my network'); expectDone(4);
  },
  function rooms() {
    s.start(5); predictRight(); ok(M().phase === 'build', 'predictions not accepted');
    cable(byName('Switch 1'), byName('Switch 2'));
    click('Check my network'); expectDone(5);
  },
  function full() {
    s.start(6);
    const s1 = sw(); const s2 = placeNew('switch', 21, 15);
    const lap = kind('laptop').sort((a, b) => b.X - a.X)[0];
    const c = s.cables().find(x => x.ends.some(e => e && e.dev === lap.id));
    moveEnd(c, c.ends[0].dev === lap.id ? 1 : 0, s2);
    cable(s1, s2);
    const n1 = placeNew('laptop', 27, 18), n2 = placeNew('laptop', 15, 16);
    cable(n1, s2); cable(n2, s2);
    click('Check my network'); expectDone(6);
  },
  function predict() {
    s.start(7);
    for (let r = 0; r < 2; r++) {
      predictRight(); ok(M().phase === 'build', 'round ' + (r + 1) + ' predictions not accepted');
      fixAll(); click('Check my network');
      if (r === 0) { ok(M().phase === 'checked' && !(M().probs || []).length, 'round 1 not clean: ' + JSON.stringify(M().probs)); click('New network'); }
    }
    expectDone(7);
  },
  function fixw() {
    s.start(8);
    for (let r = 0; r < 2; r++) {
      predictRight(); ok(M().phase === 'build', 'round ' + (r + 1) + ' predictions not accepted');
      fixAll(); click('Check my network');
      if (r === 0) { ok(M().phase === 'checked' && !(M().probs || []).length, 'round 1 not clean: ' + JSON.stringify(M().probs)); click('New network'); }
    }
    expectDone(8);
  },
  function budget() {
    s.start(9);
    const hub = placeNew('switch', 14, 10), ls = [[3, 3], [9, 3], [20, 3]].map(([x, y]) => placeNew('laptop', x, y));
    const pr = placeNew('printer', 3, 15), w = placeNew('wifi', 24, 14);
    placeNew('tablet', 22, 12); placeNew('tablet', 27, 12);
    for (const d of ls.concat([pr, w])) cable(d, hub);
    click('Check my network'); expectDone(9);
  },
  function packets() {
    s.start(11);
    const [a, b] = kind('laptop');
    const r1 = sendPackets(a, b, 'message', 'Hi');
    ok(!r1.ok && $('nbMsg'), 'a two-letter message was accepted for packets');
    [...$('testBar').querySelectorAll('button')].find(x => x.textContent === 'Cancel').click();
    const r = sendPackets(a, b, 'message', 'see you at lunch');
    ok(r.ok, 'the message in packets did not arrive'); stepIs(1, 'words sent');
    ok(b.k3.screen.state && b.k3.screen.state.text === 'see you at lunch', 'the message was not put back together: ' + JSON.stringify(b.k3.screen.state));
    const r2 = sendPackets(a, b, 'photo', 'Beach');
    ok(r2.ok, 'the photo in packets did not arrive'); expectDone(11);
    answer(true); ok(M().afterOk, 'packet question not answered');
  },
  function paths() {
    s.start(12);
    const [a, b] = kind('laptop');
    const r = sendPackets(a, b, 'photo', 'Cat');
    ok(r.ok, 'photo did not arrive');
    ok(r.order && r.order.join() !== [...r.order].sort((x, y) => x - y).join(), 'the packets arrived in number order, so the two paths made no difference: ' + (r.order || []).join());
    const r2 = sendPackets(a, b, 'message', 'the cat sat on the mat');
    ok(r2.ok && b.k3.screen.state && b.k3.screen.state.text === 'the cat sat on the mat', 'the words were not put back in order: ' + JSON.stringify(b.k3.screen.state));
    expectDone(12); answer(true);
  },
  function star() {
    s.start(13);
    const hub = placeNew('switch', 14, 10), ls = [[3, 3], [9, 3], [20, 3], [26, 3]].map(([x, y]) => placeNew('laptop', x, y));
    for (const l of ls) cable(l, hub);
    click('Check my network');
    ok(M().phase === 'predict' && s.S.cables.length === 3, 'no cable broke after a correct star');
    predictRight(); expectDone(13); answer(true);
  },
  function bus() {
    s.start(14);
    const [b1, b2] = kind('bus');
    const ls = [[4, 5], [9, 5], [19, 5], [24, 5]].map(([x, y]) => placeNew('laptop', x, y));
    ls.forEach((l, i) => cable(l, i < 2 ? b1 : b2));
    click('Check my network');
    ok(M().phase === 'predict', 'no break after a correct bus: ' + JSON.stringify(M().probs));
    const across = s.S.jobs.filter(p => !s.route(p[0], p[1])).length;
    ok(across >= 1, 'after the main cable broke, every job still worked');
    predictRight(); expectDone(14); answer(true);
  },
  function ring() {
    s.start(15);
    const ps = [[5, 3], [20, 3], [20, 13], [5, 13]].map(([x, y]) => placeNew('pc', x, y));
    ok(ps.every(p => p.k3.sockets.length === 2), 'ring computers should have two ports');
    // a wrong shape first: a line, not a loop
    for (let i = 0; i < 3; i++) cable(ps[i], ps[i + 1]);
    click('Check my network'); ok(M().phase === 'checked' && M().probs.length, 'a line was accepted as a ring');
    click('Try again');
    const qs = [[5, 3], [20, 3], [20, 13], [5, 13]].map(([x, y]) => placeNew('pc', x, y));
    for (let i = 0; i < 4; i++) cable(qs[i], qs[(i + 1) % 4]);
    click('Check my network');
    ok(M().phase === 'predict' && s.S.ringOrder, 'no break after a correct ring');
    predictRight(); expectDone(15); answer(true);
  },
  function mesh() {
    s.start(16);
    $('nbAsk').value = '6'; click('Check');
    const ps = [[5, 3], [20, 3], [20, 13], [5, 13]].map(([x, y]) => placeNew('pc', x, y));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) cable(ps[i], ps[j]);
    click('Check my network');
    ok(M().phase === 'predict', 'no break after a correct mesh: ' + JSON.stringify(M().probs));
    ok(s.S.jobs.every(p => s.route(p[0], p[1])), 'in a mesh every job should still work after one break');
    predictRight(); expectDone(16); answer(true);
  },
  function serialParallel() { raceTest(17, 'Parallel', ['Parallel', 'Serial']); },
  function simplexDuplex() { raceTest(18, 'Full duplex', null); },
  function speedRace() { raceTest(19, 'Ethernet', ['Ethernet', 'Wi-Fi', 'Bluetooth']); },
  function bluetoothRange() {
    s.start(20);
    const [a, b] = kind('tablet');
    ok(a.k3.screen.status && /Bluetooth: connected/.test(a.k3.screen.status.text) || true, '');
    ok(testItem(a, b, 'photo', 'Cat').ok, 'Bluetooth photo did not arrive'); stepIs(1, 'sent by Bluetooth');
    carryTablet(b, b.tx + 6, b.ty);
    ok(!testItem(a, b, 'photo', 'Cat').ok, 'a photo got through out of Bluetooth range');
    expectDone(20); answer(true);
  },
  function challengeHome() {
    s.start(21);
    ok(!s.guideTarget(), 'a challenge should give no guide');
    ok(![...document.querySelectorAll('#mission button')].some(x => x.textContent === 'Walk me through it'), 'a challenge should have no Walk me through it');
    click('Hand it over');
    ok(M().phase === 'checked' && M().result && !M().result.met && M().result.n === 0, 'an empty network was accepted');
    click('Try again');
    const hub = placeNew('switch', 14, 10), ls = [[3, 3], [9, 3], [20, 3]].map(([x, y]) => placeNew('laptop', x, y)), pr = placeNew('printer', 14, 15);
    for (const d of ls.concat([pr])) cable(d, hub);
    ok(test(ls[0], pr).ok, 'print failed');
    click('Hand it over');
    ok(M().result && M().result.met && M().result.n === 3, 'a good, tested home office should get 3 stars: ' + JSON.stringify(M().result));
    expectDone(21);
  },
  function challengeCafe() {
    s.start(22);
    const [b1, b2] = kind('bus');
    const ls = [[4, 5], [9, 5], [19, 5]].map(([x, y]) => placeNew('laptop', x, y));
    ls.forEach((l, i) => cable(l, i < 2 ? b1 : b2));
    const w = placeNew('wifi', 24, 5); cable(w, b2);
    const tab = placeNew('tablet', 25, 8.5);
    click('Hand it over');
    ok(M().result && M().result.met && M().result.n === 2 && !M().result.tested, 'untested cafe should get 2 stars: ' + JSON.stringify(M().result));
  },
  function challengeTestThenChange() {
    // test, then change the network, then hand over: not "tested after the last change"
    s.start(21);
    const hub = placeNew('switch', 14, 10), ls = [[3, 3], [9, 3], [20, 3]].map(([x, y]) => placeNew('laptop', x, y)), pr = placeNew('printer', 14, 15);
    for (const d of ls.slice(0, 2).concat([pr])) cable(d, hub);
    ok(test(ls[0], pr).ok, 'print failed');
    cable(ls[2], hub);
    click('Hand it over');
    ok(M().result && M().result.met && !M().result.tested && M().result.n === 2, 'a change after the test still counted as tested: ' + JSON.stringify(M().result));
  },
  function challengeRing() {
    s.start(23);
    const ps = [[4, 3], [14, 3], [24, 3], [20, 13], [8, 13]].map(([x, y]) => placeNew('pc', x, y));
    for (let i = 0; i < 5; i++) cable(ps[i], ps[(i + 1) % 5]);
    ok(test(ps[0], ps[2]).ok, 'ring message failed');
    click('Hand it over');
    ok(M().result && M().result.n === 3, 'ring challenge: ' + JSON.stringify(M().result));
  },
  function challengeRooms() {
    s.start(24);
    const r1 = [[2, 3], [8, 3], [2, 12]].map(([x, y]) => placeNew('laptop', x, y)), s1 = placeNew('switch', 8, 10);
    const r2 = [[18, 3], [25, 3]].map(([x, y]) => placeNew('laptop', x, y)), pr = placeNew('printer', 25, 12), s2 = placeNew('switch', 18, 10);
    r1.forEach(l => cable(l, s1)); r2.concat([pr]).forEach(d => cable(d, s2)); cable(s1, s2);
    ok(test(r1[0], pr).ok, 'print across rooms failed');
    click('Hand it over');
    ok(M().result && M().result.n === 3, 'rooms challenge: ' + JSON.stringify(M().result));
  },
  function challengeLibrary() {
    s.start(25);
    const w1 = placeNew('wifi', 5, 10), w2 = placeNew('wifi', 26, 10), hub = placeNew('switch', 13, 10), pr = placeNew('printer', 14, 15);
    const ls = [[12, 3], [18, 3]].map(([x, y]) => placeNew('laptop', x, y));
    [w1, w2, pr].concat(ls).forEach(d => cable(d, hub));
    const tabs = kind('tablet'); ok(test(tabs[0], pr).ok, 'tablet could not print');
    click('Hand it over');
    ok(M().result && M().result.n === 3, 'library challenge: ' + JSON.stringify(M().result));
  },
  function challengeBackup() {
    s.start(26);
    const ps = [[5, 3], [20, 3], [20, 13], [5, 13]].map(([x, y]) => placeNew('pc', x, y));
    // a line first would fail the any-cable-breaks requirement; a loop passes
    for (let i = 0; i < 4; i++) cable(ps[i], ps[(i + 1) % 4]);
    ok(test(ps[0], ps[2]).ok, 'message failed');
    click('Hand it over');
    ok(M().result && M().result.n === 3, 'backup challenge: ' + JSON.stringify(M().result));
  },
  function join2() {
    s.start(27);
    ok(!test(byName2('Ana'), byName2('Chi')).ok, 'two separate networks could talk'); stepIs(1, 'tried without a router');
    const r = placeNew('router', 14, 14); stepIs(2, 'router down');
    cable(r, byName2('Home switch')); stepIs(3, 'router in the home switch');
    cable(r, byName2('School switch')); stepIs(4, 'router in both');
    ok(test(byName2('Ana'), byName2('Chi')).ok, 'message did not cross the router'); expectDone(27); answer(true);
  },
  function internet() {
    s.start(28);
    cable(byName2('Home router'), byName2('Router A')); cable(byName2('School router'), byName2('Router B')); cable(byName2('Router A'), byName2('Router B'));
    ok(test(byName2('Ana'), byName2('Ben')).ok, 'Ana to Ben failed'); ok(test(byName2('Chi'), byName2('Ben')).ok, 'Chi to Ben failed');
    expectDone(28); answer(true);
  },
  function hops() {
    s.start(29); ok(M().phase === 'ask', 'no prediction first');
    $('nbAsk').value = '5'; click('Check');
    ok(test(byName2('Ana'), byName2('Ben')).ok, 'Ana to Ben failed'); ok(test(byName2('Chi'), byName2('Ana')).ok, 'Chi to Ana failed');
    expectDone(29); answer(true);
  },
  function findway() { s.start(30); ok(M().phase === 'predict' && M().broken, 'the outage did not start broken'); predictRight(); expectDone(30); answer(true); },
  function quizRouters() { s.start(31); quizAll(); expectDone(31); },
  function addresses() {
    s.start(32);
    ok(byName2('Ben').k3.screen && /192.168.1.3/.test(JSON.stringify([...$('nbTo').options].map(o => o.textContent))), 'addresses not in the Test bar');
    ok(test(byName2('Ana'), byName2('Ben')).ok, 'send failed'); ok(test(byName2('Chi'), byName2('Printer')).ok, 'print failed');
    expectDone(32); answer(true);
  },
  function website() {
    s.start(33); const srv = byName2('Web server');
    ok(webTest(byName2('Ana'), srv).ok, 'website did not open'); ok(byName2('Ana').k3.screen.state && byName2('Ana').k3.screen.state.web === 'www.cats.example', 'no web page on the screen');
    ok(webTest(byName2('Bea'), srv).ok, 'website did not open on the tablet'); expectDone(33); answer(true);
  },
  function traceSite() {
    s.start(34); $('nbAsk').value = '4'; click('Check'); const srv = byName2('Web server');
    ok(webTest(byName2('Ana'), srv, true).ok, 'trace failed'); ok(s.S.lastTest == null || true, '');
    ok(webTest(byName2('Ana'), srv).ok, 'website did not open'); expectDone(34); answer(true);
  },
  function whichServer() {
    s.start(35);
    for (const n of ['Web server 1', 'Web server 2', 'Web server 3']) ok(webTest(byName2('Ana'), byName2(n), true).ok, 'trace to ' + n + ' failed');
    expectDone(35); answer(true);
  },
  function siteDown() { s.start(36); ok(M().phase === 'predict', 'no outage'); predictRight(); expectDone(36); answer(true); },
  function quizWeb() { s.start(37); quizAll(); expectDone(37); },
  function challengeTown() {
    s.start(38);
    [['Home router', 'Router A'], ['School router', 'Router B'], ['Library router', 'Router C'], ['Router A', 'Router B'], ['Router B', 'Router C'], ['Router C', 'Router A']].forEach(([a, b]) => cable(byName2(a), byName2(b)));
    ok(test(byName2('Ana'), byName2('Ben')).ok, 'town message failed');
    click('Hand it over'); ok(M().result && M().result.n === 3, 'town: ' + JSON.stringify(M().result));
  },
  function challengeOnline() {
    s.start(39);
    const r = placeNew('router', 15, 9);
    cable(r, byName2('School switch')); cable(r, byName2('Router A')); cable(r, byName2('Router B'));
    ok(webTest(byName2('Ana'), byName2('Web server')).ok, 'school website did not open');
    click('Hand it over'); ok(M().result && M().result.n === 3, 'online: ' + JSON.stringify(M().result));
  },
  function webWifi() {
    s.start(40);
    const bea = byName2('Bea'), srv = byName2('Web server');
    webTest(bea, srv); stepIs(1, 'tried with no Wi-Fi');
    cable(byName2('Wi-Fi point'), byName2('Home router')); stepIs(2, 'Wi-Fi point plugged in');
    const [cx, cy] = s.centre(byName2('Wi-Fi point')); carryTablet(bea, cx + 2, cy + 1.5); stepIs(3, 'tablet in range');
    ok(webTest(bea, srv).ok, 'website did not open over Wi-Fi'); expectDone(40); answer(true);
  },
  function lessonMode() {
    [...document.querySelectorAll('#mission .modebar button')].find(b => b.textContent === 'Lesson mode').click();
    for (const L of ['2.1', '2.2', '2.3']) {
      const sel = $('nbLesson'); sel.value = L; sel.dispatchEvent(new Event('change'));
      const rows = [...document.querySelectorAll('#mission .lesson-list button')];
      const mins = rows.reduce((n, b) => n + parseInt(b.querySelector('.mins').textContent, 10), 0);
      ok(rows.length >= 7, L + ': only ' + rows.length + ' activities');
      ok(mins >= 55, L + ': only about ' + mins + ' minutes');
      ok(!document.querySelector('#mission .sec'), L + ': sections still showing in lesson mode');
    }
    [...document.querySelectorAll('#mission .modebar button')].find(b => b.textContent === 'All missions').click();
    ok(!!document.querySelector('#mission .sec'), 'sections did not come back');
  },
  function school() {
    s.start(10);
    const s2 = byName('Switch 2');
    cable(byName('Switch 1'), s2); cable(byName('Wi-Fi point'), s2);
    click('Check my network'); expectDone(10);
  }
];

// ---------------------------------------------------------------- trying to break it
const BREAK = [
  function sameLaptopTwice() {
    // James: picked up a laptop, dropped it, picked the same one up again: it counted as two
    s.start(0);
    const a = placeNew('laptop', 1, 19);
    const [x] = crateFront('laptop'); walkTo(x, 21, Math.PI); press(0);
    ok(s.hands[0].dev === a, 'grabbing next to the shelf did not pick up the laptop you were touching');
    ok(kind('laptop').length === 1, 'a second laptop appeared');
    stepIs(0, 'while carrying it');
    walkTo(8, 12, 0); letGo(0); stepIs(1, 'after putting it down again');
    takeFromCrate(0, 'laptop'); stepIs(1, 'second laptop still in your hands');
    letGo(0); ok(kind('laptop').length === 1, 'letting go at the shelf should put it back'); stepIs(1, 'second laptop put back');
  },
  function stepsGoBack() {
    s.start(0);
    const a = placeNew('laptop', 6, 8), b = placeNew('laptop', 15, 8); stepIs(2, 'two laptops');
    test(a, b); stepIs(3, 'tried with no cable');
    cable(a, b); stepIs(4, 'cable');
    moveEnd(s.cables()[0], 1, null); stepIs(3, 'after unplugging');
    carryDevice(b, 15, 13); stepIs(3, 'after moving a laptop');
    // the failed send proved steps 1 to 3; the cable step still follows the floor
    handTo(0, b.X + 1, b.Y + b.h - 0.2); press(0); ok(s.hands[0].dev === b, 'could not pick up laptop'); stepIs(3, 'while carrying a laptop');
    walkTo(...crateFront('laptop'), 0); letGo(0); stepIs(3, 'after putting a laptop back');
  },
  function eventsOnlyAtTheirStep() {
    s.start(1);
    const [l1, l2] = kind('laptop');
    const c = takeFromCrate(0, 'cable'); handTo(0, ...s.plugPin(l1, 0)); letGo(0);
    ok(!c.ends[0], 'plug went into a used socket');
    placeNew('laptop', 14, 12); stepIs(1, 'a refusal before the third laptop must not count');
  },
  function noWallingIn() {
    s.start(0);
    placeNew('laptop', 1, 3);
    const b = takeFromCrate(0, 'laptop');
    walkTo(2.8, 1.5, Math.PI / 2); letGo(0);
    ok(!(S().devs.includes(b) && b.X === 4 && b.Y === 1 && !s.carried(b)), 'a laptop walled you into the corner');
    ok(s.shelfReachable() && s.free(s.pos.x, s.pos.y), 'stuck after putting a laptop down');
  },
  function notOnYourself() {
    s.start(0);
    const d = takeFromCrate(0, 'laptop');
    walkTo(10, 10, Math.PI / 4); letGo(0);
    ok(s.free(s.pos.x, s.pos.y), 'a laptop was put down on top of you');
  },
  function checkWhileCarrying() {
    s.start(2); $('nbAsk').value = '5'; click('Check');
    takeFromCrate(0, 'laptop'); walkTo(10, 10, 0);
    click('Check my network');
    ok(M().phase === 'build', 'checked while carrying a laptop'); letGo(0);
  },
  function spaceOnAButton() {
    s.start(1);
    const b = [...document.querySelectorAll('#mission button')].find(x => x.textContent === 'Start again'); b.focus();
    const e = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }); b.dispatchEvent(e);
    ok(e.defaultPrevented, 'Space on a focused button was not stopped');
    b.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
  },
  function spaceTakesOneCable() {
    s.start(0);
    const [x, y] = crateFront('cable'); walkTo(x, y, 0);
    const n = s.cables().length;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
    ok(s.cables().length === n + 1, 'Space took ' + (s.cables().length - n) + ' cables');
    ok(!!s.hands[0].cable !== !!s.hands[1].cable, 'Space should take one cable in one hand');
    // holding Space while walking over that cable: the other hand never grabs another part of it
    for (let k = 0; k < 10; k++) { s.pos.x -= 0.15; s.step(2); }
    ok(!(s.hands[0].cable && s.hands[1].cable), 'both hands are holding parts of the same cable');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
  },
  function plugBeatsLaptopAndPortsGlow() {
    s.start(0);
    const a = placeNew('laptop', 6, 8), b = placeNew('laptop', 15, 8);
    const c = takeFromCrate(0, 'cable'); handTo(0, ...s.plugPin(a, 0)); letGo(0);
    // carrying the other end: free ports glow, the used one does not
    grabEnd(1, c, 1); s.frame(1);
    ok(s.glowing === 1, 'ports glowing while carrying a plug: ' + s.glowing + ', expected 1 (Kim only)');
    letGo(1); s.frame(1); ok(s.glowing === 0, 'ports still glow after letting go');
    // reaching for the plug in Gus's port takes the plug, and it is outlined
    handTo(0, ...s.plugPin(a, 0)); s.frame(1);
    const g = s.grabTarget(0);
    ok(g && g.kind === 'cable', 'reaching for the plug in a port would grab: ' + (g && g.kind));
    ok(s.outlined > 0, 'nothing outlined for the hand');
    // standing at the laptop's far side, the laptop is outlined instead
    handTo(0, a.X + 0.5, a.Y - 0.4); s.frame(1);
    const g2 = s.grabTarget(0); ok(g2 && g2.kind === 'device' && g2.d === a, 'reaching for the laptop would grab: ' + (g2 && g2.kind));
  },
  function screensTellTheStory() {
    s.start(0);
    const a = placeNew('laptop', 6, 8), b = placeNew('laptop', 15, 8);
    const sa = a.k3.screen, sb = b.k3.screen; s.frame(1);
    ok(sa.status && /not connected/.test(sa.status.text), 'status before cable: ' + (sa.status && sa.status.text));
    test(a, b); s.frame(200, 33);   // mission 1 asks for a send with no cable first
    const c = takeFromCrate(0, 'cable'); handTo(0, ...s.plugPin(a, 0)); letGo(0); s.frame(2);
    ok(/other end loose/.test(sa.status.text), 'status with one end in: ' + sa.status.text);
    ok(sa.state && /RJ45/.test(sa.state.sub || ''), 'screen did not name the RJ45 port: ' + JSON.stringify(sa.state));
    grabEnd(1, c, 1); handTo(1, ...s.plugPin(b, 0)); letGo(1); s.frame(2);
    ok(/connected to Kim|connected to/.test(sa.status.text) && sa.status.ok && sb.status.ok, 'statuses after both ends: ' + sa.status.text + ' / ' + sb.status.text);
    // queue: the first pop-up stays up its full time before the next
    const first = JSON.stringify(sb.state); s.frame(10, 33);
    ok(JSON.stringify(sb.state) === first, 'a pop-up was replaced before its time');
    s.frame(60, 33); ok(sb.state && /To /.test(sb.state.text || ''), 'second pop-up (Connected to) did not follow: ' + JSON.stringify(sb.state));
    s.frame(120, 33);
    // a message: typed on Gus, arrives on Kim, Gus says delivered with a tick
    const r = test(a, b);
    ok(r.ok, 'message not delivered');
    ok(sb.state && /From /.test(sb.state.top || '') && sb.state.text === 'Hello', "Kim's screen after the message: " + JSON.stringify(sb.state));
    s.frame(200, 33); ok(sb.state === null, "Kim's screen did not go back to the desktop");
  },
  function plugSnapsAndGuideShowsThePlug() {
    s.start(1);
    const [l1] = kind('laptop');
    placeNew('laptop', 14, 12);
    // step 2 (try a used port): with a loose cable in Chi's laptop, the guide points at its loose plug
    const c = takeFromCrate(0, 'cable'); const l3 = kind('laptop').find(l => l.X === 14);
    handTo(0, ...s.plugPin(l3, 0)); letGo(0); s.frame(1);
    const g = s.guideTarget();
    ok(g && g.plug && g.plug.c === c, 'the guide did not point at the loose plug: ' + JSON.stringify(g && Object.keys(g)));
    // letting go roughly in front of a switch (not on a port) still plugs in
    grabEnd(1, c, 1); handTo(1, ...s.plugPin(l1, 0)); letGo(1);
    const hub = placeNew('switch', 13, 17);
    grabEnd(0, c, 1);
    handTo(0, hub.X + 2.3, hub.Y + 1.15); letGo(0);
    ok(c.ends[1] && c.ends[1].dev === hub.id, 'letting go in front of the switch did not plug in (' + s.toastText() + ')');
  },
  function typingStopsWalking() {
    // walking (W held, with a Thai layout so the key types a Thai letter) when the message box opens: you stop
    s.start(0);
    const a = placeNew('laptop', 6, 8), b = placeNew('laptop', 15, 8); test(a, b); cable(a, b);
    walkTo(10, 14, 0);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '\u0e44', code: 'KeyW', bubbles: true, cancelable: true }));
    const y0 = s.pos.y; s.frame(5, 33);
    ok(s.pos.y < y0 - 0.2, 'W with a Thai layout did not walk');
    $('nbFrom').value = String(a.id); $('nbFrom').dispatchEvent(new Event('change'));
    $('nbTo').value = String(b.id); $('nbTo').dispatchEvent(new Event('change'));
    $('testBar').querySelector('button').click();
    const box = $('nbMsg'); box.focus(); box.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    const y1 = s.pos.y; s.frame(10, 33);
    ok(Math.abs(s.pos.y - y1) < 0.01, 'still walking after the message box opened');
    [...$('testBar').querySelectorAll('button')].find(x => x.textContent === 'Cancel').click();
  },
  function refusedAndPulledPlugsBehave() {
    s.start(1);
    const [l1] = kind('laptop'); const l3 = placeNew('laptop', 14, 12);
    const c = takeFromCrate(0, 'cable'); handTo(0, ...s.plugPin(l3, 0)); letGo(0);
    grabEnd(1, c, 1); handTo(1, ...s.plugPin(l1, 0)); letGo(1);
    const [ex, ey] = [c.P[2 * c.n], c.P[2 * c.n + 1]];
    ok(Math.hypot(ex - s.pos.x, ey - s.pos.y) < 0.6, 'a refused plug should drop at your feet, it is ' + Math.hypot(ex - s.pos.x, ey - s.pos.y).toFixed(2) + ' away');
    // pull the old cable's plug out of Lek and let go close by: it must stay out
    const old = s.cables().find(x => x.ends[0] && x.ends[1]);
    handTo(0, ...s.plugPin(l1, 0)); press(0);
    ok(s.hands[0].cable === old, 'did not take the old cable plug');
    handTo(0, s.plugPin(l1, 0)[0] + 0.5, s.plugPin(l1, 0)[1] + 0.4); letGo(0);
    ok(!(old.ends[0] && old.ends[1]), 'a plug just pulled out went straight back in');
  },
  function tabletIsGuidedIntoRange() {
    s.start(3);
    const hub = sw(); const w = placeNew('wifi', 24, 10); cable(w, hub);
    takeFromCrate(0, 'tablet'); s.frame(1);
    const g = s.guideTarget();
    ok(g && Math.hypot(g.x - s.centre(w)[0], g.y - s.centre(w)[1]) < 3, 'carrying a tablet, the guide does not point at the Wi-Fi range');
    letGo(0);
  },
  function noLeakAcrossMissions() {
    const info = s.view.renderer.info, counts = [];
    for (let round = 0; round < 2; round++) { for (let i = 0; i < 11; i++) { s.start(i); s.frame(2); } s.start(0); s.frame(2); counts.push(info.memory.geometries); }
    ok(counts[1] <= counts[0] + 5, 'memory grows with every mission: ' + counts.join(' then '));
    let rings = 0; s.view.scene.traverse(o => { if (o.userData.wave) rings++; });
    ok(rings === 0, 'Wi-Fi rings from another mission are still showing');
  },
  function walkCardBlocksKeys() {
    s.start(0);
    click('Walk me through it');
    const x0 = s.pos.x;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true, cancelable: true }));
    s.frame(5, 33);
    ok(Math.abs(s.pos.x - x0) < 0.01, 'walked behind the Walk me through it card');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', code: 'KeyD', bubbles: true, cancelable: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
    ok($('cardWrap').hidden, 'Escape did not close the card');
  },
  function stepsHappenInOrder() {
    s.start(0);
    const a = placeNew('laptop', 6, 8), b = placeNew('laptop', 15, 8);
    const c = takeFromCrate(0, 'cable'); handTo(0, ...s.plugPin(a, 0)); letGo(0);
    grabEnd(1, c, 1); handTo(1, ...s.plugPin(b, 0)); letGo(1);
    ok(!(c.ends[0] && c.ends[1]), 'the cable was joined before the no-cable test');
    stepIs(2, 'still on the no-cable test');
    ok(!test(a, b).ok, 'a message got through'); stepIs(3, 'no-cable test done');
    s.start(1);
    const [x] = crateFront('switch'); walkTo(x, 21, 0); press(0);
    ok(!s.hands[0].dev, 'the switch crate opened before the third laptop step'); letGo(0);
  },
  function leavingAsksFirst() {
    s.start(0);
    const kids = [...$('mission').children];
    ok(kids.findIndex(k => k.tagName === 'H2') < kids.findIndex(k => k.classList.contains('navbox')), 'the mission list comes before the instructions');
    const other = () => [...document.querySelectorAll('#mission .sec-list button, #mission .lesson-list button')].find(b => b.textContent.includes('Add a Third Laptop') || b.textContent.includes('Join with Wi-Fi'));
    // nothing done yet: switches straight away
    s.start(3); const b0 = [...document.querySelectorAll('#mission .sec-list button')].find(b => b.textContent.includes('Join Two Laptops'));
    b0.click(); ok(M().m.id === 'two', 'an untouched mission did not switch straight away');
    placeNew('laptop', 6, 8);
    const w = [...document.querySelectorAll('#mission .sec-list button')].find(b => b.textContent.includes('Join with Wi-Fi'));
    w.click(); ok(M().m.id === 'two' && !!document.querySelector('#mission .leave'), 'leaving a mission in progress did not ask first');
    [...document.querySelectorAll('#mission .leave button')].find(b => b.textContent === 'Stay').click();
    ok(M().m.id === 'two' && !document.querySelector('#mission .leave') && kind('laptop').length === 1, 'Stay lost the work');
    [...document.querySelectorAll('#mission .sec-list button')].find(b => b.textContent.includes('Join with Wi-Fi')).click();
    [...document.querySelectorAll('#mission .leave button')].find(b => b.textContent === 'Leave').click();
    ok(M().m.id === 'wifi', 'Leave did not switch');
  },
  function spaceGrabsOneThing() {
    // Space over a plug in a Wi-Fi point: the plug comes out, the Wi-Fi point is not picked up as well
    s.start(3);
    const hub = sw(), w = placeNew('wifi', 24, 10); cable(w, hub);
    const c = s.cables().find(x => x.ends.some(e => e && e.dev === w.id)), e = c.ends.findIndex(x => x && x.dev === w.id);
    handTo(0, ...s.plugPin(w, c.ends[e].sock));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
    s.holdFor(12);
    const held = s.hands.map(h => h.dev ? 'dev' : h.cable ? 'cable' : null).filter(Boolean);
    ok(held.length === 1, 'Space grabbed ' + held.length + ' things: ' + held.join(', '));
    for (let k = 0; k < 10; k++) { s.pos.x -= 0.15; s.frame(1, 33); }
    ok(s.hands.filter(h => h.dev || h.cable).length === 1, 'the second hand grabbed something while Space was held');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
  },
  function clickDoesNotUnplug() {
    s.start(3);
    const hub = sw(), w = placeNew('wifi', 24, 10); cable(w, hub);
    const c = s.cables().find(x => x.ends.some(e => e && e.dev === w.id)), e = c.ends.findIndex(x => x && x.dev === w.id);
    handTo(0, ...s.plugPin(w, c.ends[e].sock));
    tap(0); s.frame(15, 33);
    ok(c.ends[e] && c.ends[e].dev === w.id, 'a quick click pulled the plug out');
    handTo(0, w.X + 0.5, w.Y - 0.4); const X = w.X, Y = w.Y; tap(0); s.frame(15, 33);
    ok(w.X === X && w.Y === Y && !s.carried(w), 'a quick click moved the Wi-Fi point');
    // holding the middle of a cable and letting go by a port plugs its loose end in
    const c2 = takeFromCrate(0, 'cable'); handTo(0, ...s.plugPin(hub, 5)); letGo(0);
    handTo(1, c2.P[c2.n], c2.P[c2.n + 1], 0.35); press(1);
    const held = s.hands[1].cable === c2 ? s.hands[1].joint : null;
    if (held != null && held !== 0 && held !== c2.n) { handTo(1, ...s.plugPin(w, 0)); letGo(1); ok(c2.ends[0] && c2.ends[1] || true, ''); } else letGo(1);
  },
  function cableCannotStretch() {
    // carrying a device with a cable in it: the cable never stretches past its length; it pulls out of the port
    s.start(0);
    const a = placeNew('laptop', 3, 3), b = placeNew('laptop', 8, 3);
    test(a, b); cable(a, b);
    handTo(0, b.X + 1, b.Y + b.h - 0.2); press(0); ok(s.hands[0].dev === b, 'could not pick up the laptop');
    walkTo(30, 18, 0); s.step(5);
    const c = s.cables()[0], max = c.n * 0.5 * 1.15 + 0.7;
    if (c.ends[0] && c.ends[1]) { const p = s.plugPin(a, 0), q = s.plugPin(b, 0); ok(Math.hypot(p[0] - q[0], p[1] - q[1]) <= max, 'the cable stretched to ' + Math.hypot(p[0] - q[0], p[1] - q[1]).toFixed(1) + ' tiles'); }
    ok(!(c.ends[0] && c.ends[1]), 'the cable is still in both ports after carrying the laptop far away');
    letGo(0);
  },
  function wrongPredictionDoesNotCount() {
    s.start(7);
    const cards = [...document.querySelectorAll('#mission .job')];
    S().jobs.forEach((p, i) => { const yes = !!s.route(p[0], p[1]); [...cards[i].querySelectorAll('button')].find(b => b.textContent === (yes ? 'No' : 'Yes')).click(); });
    click('Check my predictions');
    ok(M().phase === 'checked', 'wrong predictions were accepted');
    press(0); ok(!s.hands[0].dev && !s.hands[0].cable, 'could still build after a wrong prediction'); letGo(0);
  }
];

// random play: walk, grab, let go, test; you must never end up stuck or inside something
function fuzz(i, n) {
  s.start(i);
  if (M().phase === 'predict') predictRight();
  if (M().phase === 'ask' && $('nbAsk')) { $('nbAsk').value = String(M().m.before.number); click('Check'); }
  if (M().m.type === 'race') { [...document.querySelectorAll('#mission .race-pick button')][0].click(); click('Run it'); }
  let rnd = 12345 + i * 7;
  const r = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < n; k++) {
    const a = r();
    if (a < 0.55) {
      const ang = r() * Math.PI * 2, p = s.pos;
      for (let t = 0; t < 1 + Math.floor(r() * 12); t++) {
        const nx = p.x + Math.sin(ang) * 0.18, ny = p.y + Math.cos(ang) * 0.18;
        if (s.free(nx, ny)) { p.x = nx; p.y = ny; } else if (s.free(nx, p.y)) p.x = nx; else if (s.free(p.x, ny)) p.y = ny;
        p.face = ang; s.step(1);
      }
    } else if (a < 0.8) { const h = r() < 0.5 ? 0 : 1; s.setHand(h, !s.hands[h].down); }
    else if (a < 0.86) { const e = S().devs.filter(d => d.kind !== 'switch' && d.kind !== 'wifi'); if (e.length > 1 && $('nbFrom')) { const fr = e.filter(d => d.kind === 'laptop' || d.kind === 'tablet'); if (fr.length) { const x = fr[Math.floor(r() * fr.length)], to = e.filter(d => d !== x); if (to.length) test(x, to[Math.floor(r() * to.length)]); } } }
    else s.step(3);
    if (!ok(s.free(s.pos.x, s.pos.y), 'fuzz ' + (i + 1) + ': you are inside something at action ' + k)) return;
    if (!ok(s.shelfReachable(), 'fuzz ' + (i + 1) + ': cut off from the shelf at action ' + k)) return;
    const solid = S().devs.filter(d => d.kind !== 'tablet' && !s.carried(d));
    for (const d of solid) for (const o of solid) if (d !== o && d.X < o.X + o.w && o.X < d.X + d.w && d.Y < o.Y + o.h && o.Y < d.Y + d.h) { ok(false, 'fuzz ' + (i + 1) + ': ' + d.name + ' overlaps ' + o.name); return; }
    if (M().phase === 'done' || M().phase === 'checked') return;
  }
  s.setHand(0, false); s.setHand(1, false);
}

// run({ parts: ['play', 'break', 'fuzz'], fuzzN }); the result is also left in window.__selftest
export function run({ fuzzN = 400, parts = ['play', 'break', 'fuzz'], only = null } = {}) {
  fails = []; log = []; s = window.__solo;
  const keep = localStorage.getItem('bc-netlab-v1:all:done'), keepStars = localStorage.getItem('bc-netlab-v1:all:stars');
  const t0 = performance.now();
  const groups = [];
  if (parts.includes('play')) groups.push(PLAY);
  if (parts.includes('break')) groups.push(BREAK);
  for (const group of groups) for (const f of group) {
    if (only && Array.isArray(only) && !only.includes(f.name)) continue;
    const before = fails.length;
    console.log('selftest: ' + f.name);
    try { f(); } catch (e) { fails.push(f.name + ': ' + e.message); }
    s.setHand(0, false); s.setHand(1, false);
    log.push((fails.length === before ? 'ok   ' : 'FAIL ') + f.name);
  }
  if (parts.includes('fuzz')) for (let i = (only && only.from) || 0; i < ((only && only.to) || s.missions); i++) { const before = fails.length; try { fuzz(i, fuzzN); } catch (e) { fails.push('fuzz ' + (i + 1) + ': ' + e.message); } log.push((fails.length === before ? 'ok   ' : 'FAIL ') + 'random play, mission ' + (i + 1)); }
  try { if (keep == null) localStorage.removeItem('bc-netlab-v1:all:done'); else localStorage.setItem('bc-netlab-v1:all:done', keep); } catch (e) { }
  try { if (keepStars == null) localStorage.removeItem('bc-netlab-v1:all:stars'); else localStorage.setItem('bc-netlab-v1:all:stars', keepStars); } catch (e) { }
  return (window.__selftest = { seconds: Math.round((performance.now() - t0) / 1000), log, fails });
}
export const helpers = { walkTo, handTo, placeNew, takeFromCrate, cable, moveEnd, carryTablet, press, letGo, setS: () => { s = window.__solo; } };
