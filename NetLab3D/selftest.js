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
const press = i => s.setHand(i, true), letGo = i => s.setHand(i, false);
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
    cable(a, b); stepIs(3, 'cable in');
    ok(test(a, b).ok, 'send failed'); expectDone(0);
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
    const hub = placeNew('switch', 14, 10), ls = [[3, 3], [9, 3], [20, 3], [26, 3]].map(([x, y]) => placeNew('laptop', x, y)), pr = placeNew('printer', 14, 15);
    for (const d of ls.concat([pr])) cable(d, hub);
    ok(test(ls[0], pr).ok, 'print failed');
    click('Check my network'); expectDone(2);
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
    cable(a, b); stepIs(3, 'cable');
    moveEnd(s.cables()[0], 1, null); stepIs(2, 'after unplugging');
    carryDevice(b, 15, 13); stepIs(2, 'after moving a laptop');
    handTo(0, b.X + 1, b.Y + b.h - 0.2); press(0); ok(s.hands[0].dev === b, 'could not pick up laptop'); stepIs(1, 'while carrying a laptop');
    walkTo(...crateFront('laptop'), 0); letGo(0); stepIs(1, 'after putting a laptop back');
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
    s.start(2);
    takeFromCrate(0, 'laptop'); walkTo(10, 10, 0);
    click('Check my network');
    ok(M().phase === 'build', 'checked while carrying a laptop'); letGo(0);
  },
  function spaceOnAButton() {
    s.start(1);
    const b = [...document.querySelectorAll('#mission button')].find(x => x.textContent === 'Start again'); b.focus();
    const e = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }); b.dispatchEvent(e);
    ok(e.defaultPrevented, 'Space on a focused button was not stopped');
    b.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
  },
  function spaceTakesOneCable() {
    s.start(0);
    const [x, y] = crateFront('cable'); walkTo(x, y, 0);
    const n = s.cables().length;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    ok(s.cables().length === n + 1, 'Space took ' + (s.cables().length - n) + ' cables');
    ok(s.hands[0].cable && s.hands[0].cable === s.hands[1].cable, 'Space should hold both ends of one cable');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
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
  function cableCannotStretch() {
    // carrying a device with a cable in it: the cable never stretches past its length; it pulls out of the port
    s.start(0);
    const a = placeNew('laptop', 3, 3), b = placeNew('laptop', 8, 3);
    cable(a, b);
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
  const keep = localStorage.getItem('bc-netlab-v1:all:done');
  const t0 = performance.now();
  const groups = [];
  if (parts.includes('play')) groups.push(PLAY);
  if (parts.includes('break')) groups.push(BREAK);
  for (const group of groups) for (const f of group) {
    if (only && !only.includes(f.name)) continue;
    const before = fails.length;
    try { f(); } catch (e) { fails.push(f.name + ': ' + e.message); }
    s.setHand(0, false); s.setHand(1, false);
    log.push((fails.length === before ? 'ok   ' : 'FAIL ') + f.name);
  }
  if (parts.includes('fuzz')) for (let i = 0; i < 11; i++) { const before = fails.length; try { fuzz(i, fuzzN); } catch (e) { fails.push('fuzz ' + (i + 1) + ': ' + e.message); } log.push((fails.length === before ? 'ok   ' : 'FAIL ') + 'random play, mission ' + (i + 1)); }
  try { if (keep == null) localStorage.removeItem('bc-netlab-v1:all:done'); else localStorage.setItem('bc-netlab-v1:all:done', keep); } catch (e) { }
  return (window.__selftest = { seconds: Math.round((performance.now() - t0) / 1000), log, fails });
}
export const helpers = { walkTo, handTo, placeNew, takeFromCrate, cable, moveEnd, carryTablet, press, letGo, setS: () => { s = window.__solo; } };
