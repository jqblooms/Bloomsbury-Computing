// Network Builder 3D: the site's Network Builder (NetLab/builder.js) played in 3D. You walk round a lab, carry
// devices from the supply shelf, push cable plugs into real sockets, carry tablets into Wi-Fi range, and test with
// Send and Print (the message travels along the cables). The network model, the eleven missions, their checks, the
// reasons ("Ana is not plugged in.") and Walk me through it are the 2D app's, so the two stay the same; only the
// controls are 3D. Rules kept: one check only (a mistake means the build does not count), predict before fixing,
// two clean rounds for Predict, then Fix.
//
// Progress is shared with the 2D app: both keep the finished missions in 'bc-netlab-v1:all:done' (same order), and
// shared/cloud-save.js keeps that on the student's account. Results go to the site as BC_APP_RESULT.
// Rendering uses animation frames; starting a mission, checking and saving never wait on one (a hidden iframe has none).
//
// The model: devices sit on a 640 x 380 "desk" (S.devs x, y) and S.cables joins two devices. In 3D the desk is the
// floor of one big room (22 desk units to a tile), and S.cables is worked out from the 3D cables: a cable joins two
// devices once both its plugs are pushed into sockets.
import * as THREE from 'three';
import { create } from './room.js';
import { createBlob } from './blob.js';
import { makeDevice, makeCrate, setLight, tape, pageTexture, drawItem } from './devices.js';
const $ = id => document.getElementById(id);
const T = 100, K = 22, OX = 1.5, OY = 1.5;          // world units a tile; desk units a tile; desk origin in tiles
const MAPW = 34, MAPH = 27, DESK_BOTTOM = 20;        // the room; the desk is rows 1 to 20, the supply shelf below
const SEG = 0.5, CABLE_LEN = 20, CABLE_R = 10, PLUG_LEN = 58, HAND_Y = 60, SPEED = 5.5;
const PORTS = { laptop: 1, printer: 1, 'switch': 8, wifi: 1, tablet: 0, pc: 2, bus: 4 };
const LABEL = { laptop: 'Laptop', printer: 'Printer', 'switch': 'Switch', wifi: 'Wi-Fi point', tablet: 'Tablet', pc: 'Computer', bus: 'Main cable' };
const FORWARD = { 'switch': 1, wifi: 1, bus: 1, pc: 1 };   // devices that pass data on to the next device
const RANGE = 150;
const NAMES = ['Ana', 'Ben', 'Chi', 'Dev', 'Eli', 'Fai', 'Gus', 'Hana', 'Ivy', 'Jon', 'Kim', 'Lek'];
const W = 640, H = 380, NEED = 2;
const SHELF = ['laptop', 'tablet', 'printer', 'switch', 'wifi', 'pc'];
const CRATE_COL = { pc: 0x9775fa, laptop: 0x7fa8d8, tablet: 0x495057, printer: 0xd9d9d4, 'switch': 0x4a5058, wifi: 0x51cf66, cable: 0x2b6fd6 };

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const el = (tag, attrs, html) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) k === 'class' ? n.className = v : n.setAttribute(k, v); if (html != null) n.innerHTML = html; return n; };
const btn = (label, cls, fn) => { const b = el('button', { type: 'button', class: cls === 'go' ? 'btn' : 'btn secondary' }, label); b.addEventListener('click', fn); return b; };

// ================================================================ the network model (the website's builder.js)
let S = null;
function fresh(palette) { return { devs: [], cables: [], names: shuffle(NAMES), palette: palette || {}, refused: false, lastTest: null, rooms: null, nextId: 1 }; }
function dev(id) { return S.devs.find(d => d.id === id); }
function cablesOf(id) { return S.cables.filter(c => c.a === id || c.b === id); }
function sockets(d) { return d.ports || PORTS[d.kind]; }
function isClient(d) { return d.kind === 'laptop' || d.kind === 'tablet' || d.kind === 'pc'; }
function inRange(t, w) { return Math.hypot(t.x - w.x, t.y - w.y) <= RANGE; }
function aps(t) { return S.devs.filter(w => w.kind === 'wifi' && inRange(t, w)); }
function links(x) {
  const d = dev(x), out = cablesOf(x).map(c => c.a === x ? c.b : c.a);
  if (d.kind === 'wifi') S.devs.forEach(t => { if (t.kind === 'tablet' && inRange(t, d)) out.push(t.id); });
  if (d.kind === 'tablet') aps(d).forEach(w => out.push(w.id));
  if (d.kind === 'tablet' && btOn(d)) out.push(btPartner(d).id);
  return out;
}
function count(kind) { return S.devs.filter(d => d.kind === kind).length; }
// devices standing on the floor (not in someone's hands); set by the 3D lab
let isHeld = () => false;
function placed(kind) { return S.devs.filter(d => d.kind === kind && !isHeld(d)).length; }
function ends() { return S.devs.filter(d => d.kind !== 'switch' && d.kind !== 'wifi' && d.kind !== 'bus'); }
function place(kind, x, y, name) {
  const d = { id: S.nextId++, kind, x, y };
  if (kind === 'pc' && S.pcPorts) d.ports = S.pcPorts;
  if (name) d.name = name;
  else if (kind === 'laptop' || kind === 'tablet') { const used = S.devs.map(o => o.name); d.name = S.names.filter(n => used.indexOf(n) < 0)[0]; }
  else d.name = count(kind) ? LABEL[kind] + ' ' + (count(kind) + 1) : LABEL[kind];
  S.devs.push(d);
  return d;
}
function plug(a, b, extra) { S.cables.push(Object.assign({ a: a.id, b: b.id }, extra || {})); }
const BT_RANGE = 70;   // desk units: Bluetooth only reaches a few metres
function btPartner(t) { const p = (S.bt || []).find(q => q.includes(t.id)); return p ? dev(p[0] === t.id ? p[1] : p[0]) : null; }
function btOn(t) { const o = btPartner(t); return !!o && Math.hypot(t.x - o.x, t.y - o.y) <= BT_RANGE; }
// Data travels along cables (and Wi-Fi); only a switch or a Wi-Fi point passes it on to other devices.
function ringRoute(a, b) {
  const o = S.ringOrder, n = o.length; let i = o.indexOf(a.id), cur = a.id; const path = [a];
  for (let k = 0; k < n; k++) {
    const next = o[(i + 1) % n];
    if (!S.cables.some(c => (c.a === cur && c.b === next) || (c.b === cur && c.a === next))) return null;
    path.push(dev(next)); if (next === b.id) return path;
    cur = next; i++;
  }
  return null;
}
function route(a, b) {
  if (S.ringOrder && S.ringOrder.includes(a.id) && S.ringOrder.includes(b.id)) return ringRoute(a, b);
  const prev = {}, q = [a.id];
  prev[a.id] = 0;
  while (q.length) {
    const x = q.shift();
    if (x === b.id) break;
    if (x !== a.id && !FORWARD[dev(x).kind]) continue;
    links(x).forEach(y => { if (!(y in prev)) { prev[y] = x; q.push(y); } });
  }
  if (!(b.id in prev)) return null;
  const out = [b]; let at = b.id;
  while (at !== a.id) { at = prev[at]; out.unshift(dev(at)); }
  return out;
}
function jobText(a, b) { return b.kind === 'printer' ? a.name + ' prints on the ' + b.name : a.name + ' sends a message to ' + b.name; }
function why(a, b) {
  const r = route(a, b);
  if (r) return r.map(d => d.name).join(' &rarr; ');
  if (S.bt && (btPartner(a) === b)) return 'The tablets are too far apart for Bluetooth.';
  for (const d of [a, b]) {
    if (d.kind === 'tablet' && !aps(d).length) return d.name + ' is out of Wi-Fi range.';
    if (d.kind === 'tablet' && aps(d).every(w => !cablesOf(w.id).length)) return 'The Wi-Fi point near ' + d.name + ' is not plugged in.';
    if (d.kind !== 'tablet' && !cablesOf(d.id).length) return d.name + ' is not plugged in.';
  }
  if (S.ringOrder) return 'Data goes one way round the ring, and it cannot get past the broken cable.';
  return 'No cables join ' + a.name + ' to ' + b.name + '.';
}
function laptops() { return S.devs.filter(d => d.kind === 'laptop'); }
function plugged(a, kind) { return cablesOf(a.id).some(c => dev(c.a === a.id ? c.b : c.a).kind === kind); }
function allPairs() {
  const e = ends(), out = [];
  e.forEach(a => e.forEach(b => { if (a !== b && isClient(a) && (b.kind === 'printer' || (isClient(b) && a.id < b.id))) out.push([a, b]); }));
  return out;
}
function everyone(extra) { const probs = extra || []; allPairs().forEach(p => { if (!route(p[0], p[1])) probs.push(jobText(p[0], p[1]) + ': ' + why(p[0], p[1])); }); return probs; }
function kept(probs) { if (S.devs.length < S.startDevs) probs.unshift('A device was put back on the shelf. Keep every device.'); return probs; }
function routeText(r) { return r.map(d => d.name).join(' &rarr; '); }

// ================================================================ the missions (the website's, worded for 3D)
const SOCK = 'Take an <b>Ethernet cable</b> from the cable crate, push one plug into a network socket (an <b>RJ45 port</b>; a laptop\'s is on its right-hand side), then carry the other plug to the other device\'s port and let go.';
const BUILD = [
  { id: 'two', group: 'Introduction', title: 'Join Two Laptops', type: 'tutorial', setup() { S = fresh({ laptop: 2 }); },
    intro: 'Two laptops on their own cannot share anything. Join them to make a network.',
    steps: [
      { text: 'Grab the <b>Laptop</b> crate on the supply shelf, carry the laptop onto the floor and let go.', show: 'crate-laptop', done: () => placed('laptop') >= 1 },
      { text: 'Put a second <b>Laptop</b> down.', show: 'crate-laptop', done: () => placed('laptop') >= 2 },
      { text: 'Before any cable: try to send a message from one laptop to the other, in the Test bar at the bottom. Watch the screens.', show: 'test', event: true, done: () => S.lastTest && !S.lastTest.ok && S.cables.length === 0 },
      { text: 'Plug in a cable. ' + SOCK, show: 'crate-cable', done: () => S.cables.some(c => !isHeld(dev(c.a)) && !isHeld(dev(c.b))) },
      { text: 'Test it again: send a message. Now it gets there.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok },
      { text: 'Share something: send the other laptop a <b>Photo</b> or a <b>File</b>.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok && S.lastTest.kind && S.lastTest.kind !== 'message' }
    ], end: 'Not joined, nothing could travel. Joined by a cable, messages, photos and files can travel: that is a <b>network</b>.',
    after: { q: 'Why do people join computers in a network?', options: ['To communicate and share: messages, files, photos and printers', 'To make each computer run faster', 'So each computer uses less electricity'], why: 'A network lets data travel between computers. People can <b>communicate</b> (messages, emails, video calls) and <b>share</b> (files, photos, one printer).' } },
  { id: 'switch', group: 'Introduction', title: 'Add a Third Laptop', type: 'tutorial', setup() {
    S = fresh({ laptop: 3, 'switch': 1 }); const a = place('laptop', 150, 100), b = place('laptop', 490, 100); plug(a, b); },
    intro: 'A third person wants to join the network.',
    steps: [
      { text: 'Put a third <b>Laptop</b> down.', show: 'crate-laptop', done: () => placed('laptop') >= 3 },
      { text: 'Try to plug the new laptop into one of the other two laptops. Watch what happens.', show: 'crate-cable', event: true, done: () => S.refused },
      { text: 'Each laptop has only one network socket. Take a <b>Switch</b> from the shelf and put it down: it has eight sockets.', show: 'crate-switch', done: () => placed('switch') >= 1 },
      { text: 'Take out the old cable between the first two laptops: grab a plug and pull it out of its socket.', show: 'cable', done: () => !S.cables.some(c => dev(c.a).kind === 'laptop' && dev(c.b).kind === 'laptop') },
      { text: 'Plug <b>all three</b> laptops into the switch. Any free port on the switch works.', show: 'switch', done: () => placed('laptop') >= 3 && placed('switch') >= 1 && laptops().every(l => !isHeld(l) && plugged(l, 'switch')) },
      { text: 'Test it: send a message between two laptops. Watch it go through the switch.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok }
    ], end: 'A <b>switch</b> joins many devices. Data goes from one laptop, through the switch, to another.' },
  { id: 'printer', group: 'Introduction', title: 'Share the Printer', type: 'challenge', setup() { S = fresh({ laptop: 4, printer: 1, 'switch': 1 }); },
    before: { q: 'Predict: four laptops and one printer are each plugged into one switch. How many cables will you need?', number: 5, why: 'Each laptop and the printer has <b>one</b> network socket, so each needs <b>one</b> cable to the switch: 4 laptops + 1 printer = <b>5 cables</b>.' },
    after: { q: 'Why does a class share one printer on the network, and not buy a printer for every laptop?', options: ['It costs less: one printer for the whole class', 'One printer prints faster than many', 'A laptop cannot have its own printer'], why: 'Sharing <b>saves money</b>: one printer for the whole class. Sharing files <b>saves time</b> too: a file goes straight to a friend\'s laptop.' },
    end: 'Every laptop shares the one printer.',
    intro: 'Build a network for a class: <b>four laptops</b> and <b>one printer</b>.',
    goals: ['Every laptop can print on the Printer.', 'Every laptop can send a message to every other laptop.', 'Test it with Send and Print before you check.'],
    check() {
      const probs = [];
      if (count('laptop') < 4) probs.push('There should be four laptops.');
      if (count('printer') < 1) probs.push('There is no printer.');
      allPairs().forEach(p => { if (!route(p[0], p[1])) probs.push(jobText(p[0], p[1]) + ': ' + why(p[0], p[1])); });
      return probs;
    } }
];
function faulty() {
  for (;;) {
    S = fresh({});
    const sw = place('switch', 320, 190, 'Switch'), spots = shuffle([[110, 80], [320, 64], [530, 80], [110, 290], [530, 290]]);
    const pr = place('printer', spots[0][0], spots[0][1]), ls = [1, 2, 3].map(i => place('laptop', spots[i][0], spots[i][1]));
    const all = [pr].concat(ls), fault = pick(['unplug', 'unplug', 'pair', 'printer']);
    if (fault === 'pair') { plug(ls[0], ls[1]); plug(ls[2], sw); plug(pr, sw); }
    else if (fault === 'printer') ls.forEach(l => plug(l, sw));
    else all.forEach(d => { if (d !== ls[0]) plug(d, sw); });
    const jobs = shuffle(allPairs()).slice(0, 3), yes = jobs.filter(p => route(p[0], p[1])).length;
    if (yes >= 1 && yes <= 2) { S.jobs = jobs; S.startDevs = S.devs.length; return; }
  }
}
function rooms() {
  S = fresh({});
  S.rooms = [{ x: 14, w: 300, name: 'Room 1' }, { x: 326, w: 300, name: 'Room 2' }];
  const a = place('switch', 164, 195, 'Switch 1'), b = place('switch', 476, 195, 'Switch 2');
  const a1 = place('laptop', 84, 96), a2 = place('laptop', 244, 96), a3 = place('laptop', 164, 296);
  const b1 = place('laptop', 396, 96), b2 = place('laptop', 556, 96), pr = place('printer', 476, 296, 'Printer');
  [a1, a2, a3].forEach(l => plug(l, a));
  [b1, b2, pr].forEach(l => plug(l, b));
  S.jobs = shuffle([[a1, pr], [b1, pr], [a2, a3], [a2, b2]]).slice(0, 3);
  S.startDevs = S.devs.length; S.startCables = S.cables.length;
}
const FIX = [
  { id: 'predict', group: 'Troubleshooting', title: 'Predict, then Fix', type: 'fix', rounds: NEED, setup: faulty,
    intro: 'Something is wrong with this network. First predict which jobs work, then fix it.',
    check() {
      const probs = [];
      if (S.devs.length < S.startDevs) probs.push('A device was put back on the shelf. Fix the cables, keep the devices.');
      allPairs().forEach(p => { if (!route(p[0], p[1])) probs.push(jobText(p[0], p[1]) + ': ' + why(p[0], p[1])); });
      return probs;
    } },
  { id: 'rooms', group: 'Bigger networks', title: 'Two Rooms', type: 'fix', rounds: 1, setup: rooms,
    intro: 'Two classrooms each have a network. Only Room 2 has a printer.',
    fixText: 'Fix it so <b>every laptop in both rooms</b> can print, using <b>one</b> new cable. Test it, then check.',
    check() {
      const probs = [];
      if (S.devs.length < S.startDevs) probs.push('A device was put back on the shelf.');
      const p = S.devs.find(d => d.kind === 'printer');
      laptops().forEach(l => { if (!route(l, p)) probs.push(jobText(l, p) + ': ' + why(l, p)); });
      if (!probs.length && S.cables.length > S.startCables + 1) probs.push('Every laptop can print, but you used ' + (S.cables.length - S.startCables) + ' new cables. One cable is enough.');
      return probs;
    } }
];
const WIFI1 = { id: 'wifi', group: 'Wi-Fi', title: 'Join with Wi-Fi', type: 'tutorial',
  setup() { S = fresh({ wifi: 1, tablet: 1 }); const sw = place('switch', 170, 190, 'Switch'), l = place('laptop', 80, 70), p = place('printer', 80, 290); plug(l, sw); plug(p, sw); },
  intro: 'A tablet has no network socket. It joins the network with Wi-Fi.',
  steps: [
    { text: 'Take a <b>Wi-Fi point</b> from the shelf and put it down on the right-hand side of the room.', show: 'crate-wifi', done: () => placed('wifi') >= 1 },
    { text: 'Plug the Wi-Fi point into the switch with a cable.', show: 'wifi', done: () => S.devs.some(w => w.kind === 'wifi' && !isHeld(w) && plugged(w, 'switch')) },
    { text: 'Take a <b>Tablet</b> and put it down <b>inside</b> the green circle. A dotted line shows it has joined the Wi-Fi.', show: 'crate-tablet', done: () => S.devs.some(t => t.kind === 'tablet' && !isHeld(t) && aps(t).some(w => !isHeld(w) && cablesOf(w.id).length)) },
    { text: 'Test it: print from the tablet.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok && dev(S.lastTest.a).kind === 'tablet' && dev(S.lastTest.b).kind === 'printer' },
    { text: 'Carry the tablet <b>outside</b> the green circle, then try to print again.', show: 'test', event: true, done: () => S.lastTest && !S.lastTest.ok && dev(S.lastTest.a).kind === 'tablet' }
  ], end: 'Wi-Fi joins devices with no cable, but only inside its <b>range</b>. The Wi-Fi point itself still needs a cable to the switch.' };
const WIFI2 = { id: 'range', group: 'Wi-Fi', title: 'Out of Range', type: 'challenge',
  setup() {
    S = fresh({ wifi: 2 }); const sw = place('switch', 320, 190, 'Switch'), w = place('wifi', 120, 110, 'Wi-Fi point'), l = place('laptop', 320, 64), p = place('printer', 320, 290);
    plug(w, sw); plug(l, sw); plug(p, sw); place('tablet', 560, 80); place('tablet', 560, 280); S.startDevs = S.devs.length; },
  intro: 'Two tablets cannot reach anything.',
  goals: ['Both tablets can print.', 'Both tablets can send a message to the laptop.', 'Move devices, or add a Wi-Fi point. Test, then check.'],
  check() { return kept(everyone()); },
  walk() {
    S = fresh({}); const sw = place('switch', 320, 200, 'Switch'), w = place('wifi', 150, 110, 'Wi-Fi point'), p = place('printer', 320, 300), t = place('tablet', 520, 250), ex = S, st = [];
    plug(w, sw); plug(p, sw);
    st.push({ text: '<b>A similar network.</b> Can ' + t.name + ' print?', visual: mini(ex) });
    st.push({ text: 'The circle is the Wi-Fi range. ' + t.name + ' is outside it, so it is <span class="hl">out of range</span>: No.', visual: mini(ex) });
    t.x = 250; t.y = 200;
    st.push({ text: 'Carry the tablet inside the circle (or move the Wi-Fi point nearer). The dotted line shows it has joined.', visual: mini(ex) });
    st.push({ text: 'Test: ' + routeText(route(t, p)) + '.', visual: mini(ex) });
    st.push({ text: 'A second Wi-Fi point, plugged into the switch, gives a second circle. Now fix yours, test, then check.', visual: '' });
    return st;
  } };
const FULL = { id: 'full', group: 'Bigger networks', title: 'The Switch Is Full', type: 'challenge',
  setup() {
    S = fresh({ laptop: 5, 'switch': 2 }); const sw = place('switch', 320, 190, 'Switch'); sw.ports = 4;
    [[110, 70], [320, 64], [530, 70]].forEach(q => plug(place('laptop', q[0], q[1]), sw));
    plug(place('printer', 110, 290), sw); S.startDevs = S.devs.length; },
  intro: 'This switch has only <b>4</b> sockets, and they are all used.',
  goals: ['Add <b>two more</b> laptops.', 'Every laptop can print.', 'Every laptop can send a message to every other laptop.'],
  check() { return kept(everyone(count('laptop') < 5 ? ['There should be five laptops.'] : [])); },
  walk() {
    S = fresh({}); const a = place('switch', 220, 190, 'Switch'), st = []; a.ports = 4;
    const ds = [[90, 70], [220, 64], [350, 70]].map(q => { const l = place('laptop', q[0], q[1]); plug(l, a); return l; });
    const p = place('printer', 90, 290); plug(p, a); const ex = S;
    st.push({ text: '<b>A similar network.</b> All 4 sockets on the switch are used. One more laptop needs to join.', visual: mini(ex) });
    const b = place('switch', 470, 190, 'Switch 2');
    st.push({ text: 'You cannot plug into a full switch. Add a <b>second switch</b>.', visual: mini(ex) });
    S.cables = S.cables.filter(c => c.a !== ds[2].id && c.b !== ds[2].id); plug(ds[2], b); plug(a, b);
    st.push({ text: 'Move ' + ds[2].name + '\'s cable to Switch 2. That frees a socket on Switch 1: use it for a cable between the two switches.', visual: mini(ex) });
    const n = place('laptop', 560, 300); plug(n, b);
    st.push({ text: 'Plug the new laptop into Switch 2. Test: ' + routeText(route(n, p)) + '.', visual: mini(ex, cablesOn(ex, route(n, p))) });
    st.push({ text: 'Data can pass through two switches. Now do yours: test every laptop, then check.', visual: '' });
    return st;
  } };
function faultyWifi() {
  for (;;) {
    S = fresh({});
    const sw = place('switch', 320, 200, 'Switch'), w = place('wifi', 150, 110, 'Wi-Fi point'), l = place('laptop', 530, 70), p = place('printer', 530, 290);
    const t1 = place('tablet', 90, 230), t2 = place('tablet', 240, 64), fault = pick(['range', 'unplug', 'printer']);
    plug(l, sw);
    if (fault !== 'printer') plug(p, sw);
    if (fault !== 'unplug') plug(w, sw);
    if (fault === 'range') { t2.x = 400; t2.y = 290; }
    const jobs = shuffle(allPairs()).slice(0, 3), yes = jobs.filter(q => route(q[0], q[1])).length;
    if (yes >= 1 && yes <= 2) { S.jobs = jobs; S.startDevs = S.devs.length; return; }
  }
}
const FIXW = { id: 'fixw', group: 'Troubleshooting', title: 'Predict, then Fix: Wi-Fi', type: 'fix', rounds: NEED, setup: faultyWifi,
  intro: 'Something is wrong with this Wi-Fi network. First predict, then fix it.',
  fixText: 'Fix it so <b>every</b> laptop and tablet can print and message each other. You can move devices and plug in cables. Test it, then check.',
  check() { return kept(everyone()); } };
const BUDGET = { id: 'budget', group: 'Design', title: 'Cable Budget', type: 'challenge', maxNew: 5,
  setup() { S = fresh({ laptop: 3, tablet: 2, printer: 1, 'switch': 1, wifi: 1 }); S.startCables = 0; },
  intro: 'Build a network for <b>three laptops, two tablets and a printer</b>. Cables cost money.',
  goals: ['Everyone can print.', 'Everyone can send a message to everyone.', 'Use <b>5 cables or fewer</b>.'],
  check() {
    const probs = [];
    if (count('laptop') < 3 || count('tablet') < 2 || count('printer') < 1) probs.push('Put all three laptops, both tablets and the printer down.');
    everyone(probs);
    if (!probs.length && S.cables.length > 5) probs.push('Everyone is joined, but you used ' + S.cables.length + ' cables. 5 is enough.');
    return probs;
  },
  walk() {
    S = fresh({}); const sw = place('switch', 320, 190, 'Switch'), a = place('laptop', 110, 70), b = place('laptop', 530, 70), p = place('printer', 110, 290), w = place('wifi', 470, 280, 'Wi-Fi point'), t = place('tablet', 560, 190), ex = S, st = [];
    st.push({ text: '<b>A similar network.</b> Two laptops, a printer and a tablet. What is the fewest cables?', visual: mini(ex) });
    st.push({ text: 'Every device with a socket needs <b>one</b> cable, to the switch: ' + a.name + ', ' + b.name + ', the Printer and the Wi-Fi point.', visual: mini(ex) });
    [a, b, p, w].forEach(d => plug(d, sw));
    st.push({ text: 'The tablet needs no cable. It joins by Wi-Fi, inside the circle.', visual: mini(ex) });
    st.push({ text: 'That is <span class="hl">4 cables</span>. A cable between two devices that can already reach each other is a spare. Now count yours.', visual: '' });
    return st;
  } };
const SCHOOL = { id: 'school', group: 'Design', title: 'The School Network', type: 'challenge', maxNew: 2,
  setup() {
    S = fresh({}); S.rooms = [{ x: 10, w: 200, name: 'Room 1' }, { x: 220, w: 200, name: 'Room 2' }, { x: 430, w: 200, name: 'Library' }];
    const s1 = place('switch', 110, 190, 'Switch 1'), s2 = place('switch', 320, 190, 'Switch 2');
    [[62, 80], [158, 80], [110, 290]].forEach(q => plug(place('laptop', q[0], q[1]), s1));
    [[272, 80], [368, 80]].forEach(q => plug(place('laptop', q[0], q[1]), s2));
    plug(place('printer', 320, 290), s2);
    place('wifi', 530, 190, 'Wi-Fi point');
    [[482, 80], [578, 80], [530, 290]].forEach(q => place('tablet', q[0], q[1]));
    S.startDevs = S.devs.length; S.startCables = S.cables.length; },
  intro: 'Three rooms, three separate networks. Only Room 2 has a printer.',
  goals: ['Every laptop and every tablet can print.', 'Everyone can send a message to everyone.', 'Use <b>2 new cables</b> or fewer.'],
  check() {
    const probs = kept(everyone());
    if (!probs.length && S.cables.length - S.startCables > 2) probs.push('It works, but you used ' + (S.cables.length - S.startCables) + ' new cables. 2 is enough.');
    return probs;
  },
  walk() {
    S = fresh({}); S.rooms = [{ x: 14, w: 300, name: 'Room A' }, { x: 326, w: 300, name: 'Library' }];
    const s = place('switch', 164, 190, 'Switch'), l = place('laptop', 84, 80), p = place('printer', 244, 290), w = place('wifi', 476, 190, 'Wi-Fi point'), t = place('tablet', 556, 90), ex = S, st = [];
    plug(l, s); plug(p, s);
    st.push({ text: '<b>A similar school.</b> Can ' + t.name + ' print?', visual: mini(ex) });
    st.push({ text: t.name + ' is inside the Wi-Fi range, but the Wi-Fi point is not plugged in. So <span class="hl">No</span>.', visual: mini(ex) });
    plug(w, s);
    st.push({ text: 'One cable from the Wi-Fi point to the switch joins the Library to Room A.', visual: mini(ex) });
    st.push({ text: 'Test: ' + routeText(route(t, p)) + '.', visual: mini(ex, cablesOn(ex, route(t, p))) });
    st.push({ text: 'Separate networks join with one cable between them: switch to switch, or Wi-Fi point to switch. Now plan yours.', visual: '' });
    return st;
  } };
const PACKETS1 = { id: 'packets', group: 'Packets', title: 'Messages in Packets', type: 'tutorial', packets: true,
  setup() { S = fresh({}); const sw = place('switch', 320, 230, 'Switch'), a = place('laptop', 160, 90), b = place('laptop', 480, 90); plug(a, sw); plug(b, sw); },
  intro: 'A long message does not travel in one piece. It is split into small parts called <b>packets</b>.',
  steps: [
    { text: 'In the Test bar, press <b>Send</b>, choose <b>Message</b> and type a message of 3 to 6 words. Watch each word go into its own numbered <b>packet</b>.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok && S.lastTest.kind === 'words' },
    { text: 'Now send a <b>Photo</b>. Watch it split into blocks, one block in each packet.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok && S.lastTest.kind === 'photoPackets' }
  ],
  end: 'Data is split into numbered <b>packets</b>. They travel one at a time and are put back together at the other end.',
  after: { q: 'Why does each packet have a number?', options: ['So the other computer can put the packets back in the right order', 'So the packets travel faster', 'So the cable knows which laptop to go to'], why: 'Packets can arrive in a different order. Their numbers tell the computer which order to put them back in.' } };
const PACKETS2 = { id: 'paths', group: 'Packets', title: 'Different Paths', type: 'tutorial', packets: true,
  setup() {
    S = fresh({});
    const s1 = place('switch', 150, 170, 'Switch 1'), s2 = place('switch', 490, 170, 'Switch 2'), s3 = place('switch', 320, 362, 'Switch 3');
    const a = place('laptop', 150, 80), b = place('laptop', 490, 80);
    plug(a, s1); plug(b, s2); plug(s1, s2); plug(s1, s3); plug(s3, s2);
  },
  intro: 'This network has <b>two ways</b> from Switch 1 to Switch 2: straight across, or round through Switch 3.',
  steps: [
    { text: 'Send a <b>Photo</b> from one laptop to the other. Watch the packets take different paths and arrive in a different order.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok && S.lastTest.kind === 'photoPackets' },
    { text: 'Send a <b>Message</b> of 3 to 6 words. Watch the other laptop sort the packets by their numbers.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok && S.lastTest.kind === 'words' }
  ],
  end: 'Packets can take different paths, so they can arrive in a different order. Their numbers put them back in order.',
  after: { q: 'Packet 3 arrives before packet 2. What does the computer do?', options: ['Uses the packet numbers to put them back in order', 'Throws packet 3 away', 'Shows them in the order they arrived'], why: 'Each packet has a number. The computer waits for all the packets, then puts them in number order.' } };
// ---- topologies: build the shape, then a cable breaks and you predict which jobs still work
const hasCable = (x, y) => S.cables.some(c => (c.a === x.id && c.b === y.id) || (c.b === x.id && c.a === y.id));
const pcs = () => S.devs.filter(d => d.kind === 'pc');
function ringOf(list) {
  // the computers in loop order, if they make one loop where each has exactly two cables
  if (list.length < 3 || list.some(d => cablesOf(d.id).length !== 2)) return null;
  const order = [list[0].id]; let prev = null, cur = list[0].id;
  for (let k = 0; k < list.length; k++) {
    const nbr = cablesOf(cur).map(c => c.a === cur ? c.b : c.a).find(x => x !== prev);
    if (nbr == null) return null;
    if (nbr === order[0]) return order.length === list.length ? order : null;
    if (order.includes(nbr)) return null;
    order.push(nbr); prev = cur; cur = nbr;
  }
  return null;
}
const STAR = { id: 'star', group: 'Topologies', title: 'Star Network', type: 'challenge', breakAfter: true,
  setup() { S = fresh({ laptop: 4, 'switch': 1 }); },
  intro: 'In a <b>star network</b>, every computer has its own cable to one switch in the middle.',
  goals: ['Put down four laptops and a switch.', 'Plug every laptop straight into the switch.', 'No laptop plugs into another laptop.'],
  check() {
    const probs = [], ls = laptops(), sw = S.devs.find(d => d.kind === 'switch');
    if (ls.length < 4) probs.push('There should be four laptops.');
    if (!sw) probs.push('There is no switch.');
    else ls.forEach(l => { if (!hasCable(l, sw)) probs.push(l.name + ' is not plugged straight into the switch.'); });
    return probs;
  },
  breakPick: () => S.cables.filter(c => dev(c.a).kind === 'laptop' || dev(c.b).kind === 'laptop'),
  walk() {
    S = fresh({}); const sw = place('switch', 320, 200, 'Switch'), ls = [[110, 80], [530, 80], [110, 300], [530, 300]].map(q => place('laptop', q[0], q[1])), ex = S, st = [];
    st.push({ text: '<b>A star network.</b> One switch in the middle.', visual: mini(ex) });
    ls.forEach(l => plug(l, sw));
    st.push({ text: 'Each laptop has its <b>own</b> cable to the switch, like the points of a star.', visual: mini(ex) });
    st.push({ text: 'If one cable breaks, only that laptop is cut off. If the switch breaks, everything stops. Now build yours, then check.', visual: '' });
    return st;
  },
  end: 'A star network: every device has its own cable to the switch in the middle.',
  after: { q: 'In a star network, one laptop\'s cable breaks. What happens?', options: ['Only that laptop is cut off; the others still work', 'The whole network stops', 'Every laptop loses the printer'], why: 'Each laptop has its own cable to the switch, so one broken cable cuts off only that laptop. If the <b>switch</b> breaks, everything stops.' } };
const BUS = { id: 'bus', group: 'Topologies', title: 'Bus Network', type: 'challenge', breakAfter: true,
  setup() { S = fresh({ laptop: 4 }); const b1 = place('bus', 170, 200, 'Main cable 1'), b2 = place('bus', 470, 200, 'Main cable 2'); plug(b1, b2); S.startDevs = S.devs.length; },
  intro: 'In a <b>bus network</b>, every computer joins one long <b>main cable</b>. This main cable is in two parts, joined in the middle.',
  goals: ['Put down four laptops.', 'Plug two laptops into Main cable 1 and two into Main cable 2.'],
  check() {
    const probs = kept([]), [b1, b2] = S.devs.filter(d => d.kind === 'bus');
    if (laptops().length < 4) probs.push('There should be four laptops.');
    laptops().forEach(l => { if (!plugged(l, 'bus')) probs.push(l.name + ' is not plugged into the main cable.'); });
    if (b1 && b2 && !hasCable(b1, b2)) probs.push('The two parts of the main cable are not joined.');
    if (b1 && laptops().filter(l => hasCable(l, b1)).length < 2) probs.push('Plug two laptops into Main cable 1.');
    if (b2 && laptops().filter(l => hasCable(l, b2)).length < 2) probs.push('Plug two laptops into Main cable 2.');
    return probs;
  },
  breakPick: () => S.cables.filter(c => dev(c.a).kind === 'bus' && dev(c.b).kind === 'bus'),
  walk() {
    S = fresh({}); const b1 = place('bus', 170, 200, 'Main cable 1'), b2 = place('bus', 470, 200, 'Main cable 2'), ex = S, st = []; plug(b1, b2);
    const ls = [[110, 80], [230, 80], [410, 80], [530, 80]].map(q => place('laptop', q[0], q[1]));
    st.push({ text: '<b>A bus network.</b> One long main cable runs past everyone.', visual: mini(ex) });
    ls.forEach((l, i) => plug(l, i < 2 ? b1 : b2));
    st.push({ text: 'Every computer plugs into the main cable. Data travels along it to everyone.', visual: mini(ex) });
    st.push({ text: 'If the main cable breaks, the network splits in two. Now build yours, then check.', visual: '' });
    return st;
  },
  end: 'A bus network: every device joins one main cable.',
  after: { q: 'In a bus network, the main cable breaks in the middle. What happens?', options: ['The network splits: the two halves cannot reach each other', 'Nothing: the data goes round another way', 'Only one computer is cut off'], why: 'All the data travels along the one main cable. When it breaks, nothing can cross the break, so the network splits in two.' } };
const RING = { id: 'ring', group: 'Topologies', title: 'Ring Network', type: 'challenge', breakAfter: true,
  setup() { S = fresh({ pc: 4 }); S.pcPorts = 2; },
  intro: 'In a <b>ring network</b>, each computer joins the next one, all the way round. Data goes <b>one way</b> round the ring, through each computer.',
  goals: ['Put down four computers (each has two ports).', 'Join them in a loop: each computer to the next, and the last back to the first.'],
  check() {
    const probs = [], list = pcs();
    if (list.length < 4) probs.push('There should be four computers.');
    else if (!ringOf(list)) probs.push('The computers do not make one loop. Each needs exactly two cables: one to the computer before it and one to the computer after it.');
    return probs;
  },
  onCheck() { S.ringOrder = ringOf(pcs()); },
  breakPick: () => S.cables.slice(),
  walk() {
    S = fresh({}); S.pcPorts = 2; const ps = [[160, 80], [480, 80], [480, 300], [160, 300]].map(q => place('pc', q[0], q[1])), ex = S, st = [];
    st.push({ text: '<b>A ring network.</b> Four computers, each with two ports.', visual: mini(ex) });
    for (let i = 0; i < 4; i++) plug(ps[i], ps[(i + 1) % 4]);
    st.push({ text: 'Each joins the next, and the last joins the first: a loop. Data goes one way round, passing through each computer.', visual: mini(ex) });
    st.push({ text: 'If one cable breaks, data cannot get past it. Now build yours, then check.', visual: '' });
    return st;
  },
  end: 'A ring network: each device joins the next, in a loop, and data goes one way round.',
  after: { q: 'In this ring, data goes one way round. One cable breaks. What happens?', options: ['Data cannot get past the break, so some messages fail', 'Every message still gets there', 'Only the two computers next to the break stop'], why: 'Data only goes one way round. A message that has to cross the broken cable cannot get through.' } };
const MESH = { id: 'mesh', group: 'Topologies', title: 'Mesh Network', type: 'challenge', breakAfter: true,
  setup() { S = fresh({ pc: 4 }); S.pcPorts = 3; },
  intro: 'In a <b>mesh network</b>, every computer is joined straight to every other computer.',
  before: { q: 'Predict: four computers, each joined straight to each of the other three. How many cables?', number: 6, why: 'Count each pair once: A-B, A-C, A-D, B-C, B-D, C-D. That is <b>6 cables</b>.' },
  goals: ['Put down four computers (each has three ports).', 'Join every computer straight to every other computer.'],
  check() {
    const probs = [], list = pcs();
    if (list.length < 4) probs.push('There should be four computers.');
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) if (!hasCable(list[i], list[j])) probs.push(list[i].name + ' and ' + list[j].name + ' are not joined straight to each other.');
    return probs;
  },
  breakPick: () => S.cables.slice(),
  walk() {
    S = fresh({}); S.pcPorts = 3; const ps = [[160, 80], [480, 80], [480, 300], [160, 300]].map(q => place('pc', q[0], q[1])), ex = S, st = [];
    st.push({ text: '<b>A mesh network.</b> Four computers, each with three ports.', visual: mini(ex) });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) plug(ps[i], ps[j]);
    st.push({ text: 'Every computer is joined straight to every other: 6 cables.', visual: mini(ex) });
    st.push({ text: 'If one cable breaks, the data can go another way. But it needs a lot of cables. Now build yours, then check.', visual: '' });
    return st;
  },
  end: 'A mesh network: every device is joined to every other, so there is always another way.',
  after: { q: 'Why does a mesh network keep working when one cable breaks?', options: ['There are other paths, so the data goes another way', 'Its cables are stronger', 'The data jumps over the break'], why: 'In a mesh there is more than one path between computers. The downside: it needs a lot of cables.' } };
// ---- transmission modes and speeds: races between cables (or links) you watch side by side
function pairs(list) { S = fresh({}); list.forEach(([an, bn, y, kinds, extra]) => { const a = place(kinds[0], 110, y, an), b = place(kinds[1], 530, y, bn); if (extra !== false) plug(a, b, extra); }); }
const SERIAL = { id: 'serial', group: 'Transmission modes', title: 'Serial and Parallel', type: 'race',
  setup() { pairs([['Ana', 'Ben', 80, ['laptop', 'laptop'], { type: 'serial' }], ['Chi', 'Dev', 260, ['laptop', 'laptop'], { type: 'parallel' }]]); },
  intro: 'Data travels as <b>bits</b>: 0s and 1s. The letter A is 8 bits. These see-through cables show the wires inside.',
  lanes: [{ label: 'Serial', a: 'Ana', b: 'Ben', kind: 'serial', text: 'one wire: the bits go <b>one at a time</b>, one after another.' }, { label: 'Parallel', a: 'Chi', b: 'Dev', kind: 'parallel', text: 'eight wires: the bits go <b>side by side</b>, all at once.' }],
  predict: { q: 'Both send the letter A (8 bits) at the same moment. Which gets there first?', options: ['Parallel', 'Serial', 'Both at the same time'], why: 'Parallel sends all 8 bits at once on 8 wires. Serial sends them one at a time on one wire.' },
  end: 'Serial: one bit at a time on one wire. Parallel: several bits at once on several wires. Serial cables are cheaper and work well over long distances, so most cables today (like USB) are serial.',
  after: { q: 'What is serial transmission?', options: ['Bits sent one at a time, one after another, along one wire', 'Bits sent all at the same time along many wires', 'Data sent both ways at the same time'], why: '<b>Serial</b>: one bit after another on one wire. <b>Parallel</b>: many bits at once on many wires.' } };
const DUPLEX = { id: 'duplex', group: 'Transmission modes', title: 'Simplex and Duplex', type: 'race',
  setup() { pairs([['Ana', 'Ben', 60, ['laptop', 'laptop'], { type: 'simplex' }], ['Chi', 'Dev', 190, ['laptop', 'laptop'], { type: 'half' }], ['Eli', 'Fai', 320, ['laptop', 'laptop'], { type: 'full' }]]); },
  intro: 'The arrows on each cable show which way data can go. On every cable, <b>both</b> laptops try to send at the same moment.',
  lanes: [{ label: 'Simplex', a: 'Ana', b: 'Ben', kind: 'simplex', text: 'data goes <b>one way only</b>.' }, { label: 'Half duplex', a: 'Chi', b: 'Dev', kind: 'half', text: 'data goes both ways, but <b>one way at a time</b>.' }, { label: 'Full duplex', a: 'Eli', b: 'Fai', kind: 'full', text: 'data goes <b>both ways at the same time</b>.' }],
  predict: { q: 'On which cable do both messages travel at the same time?', options: ['Full duplex', 'Half duplex', 'Simplex'], why: 'Full duplex has a way for each direction, so both go at once. Half duplex takes turns. Simplex only goes one way.' },
  end: 'Simplex: one way only (like a TV broadcast). Half duplex: both ways, one at a time (like a walkie-talkie). Full duplex: both ways at once (like a phone call).',
  after: { q: 'A walkie-talkie lets people talk both ways, but only one person at a time. Which mode is that?', options: ['Half duplex', 'Simplex', 'Full duplex'], why: '<b>Half duplex</b>: both ways, but one way at a time.' } };
const SPEEDRACE = { id: 'speed', group: 'Speeds', title: 'Speed Race', type: 'race',
  setup() {
    S = fresh({});
    const a = place('laptop', 110, 70, 'Ana'), b = place('laptop', 530, 70, 'Ben'); plug(a, b);
    const sw = place('switch', 320, 250, 'Switch'), w = place('wifi', 320, 180, 'Wi-Fi point'); plug(w, sw);
    place('tablet', 210, 200, 'Chi'); place('tablet', 430, 200, 'Dev');
    const e = place('tablet', 290, 330, 'Eli'), f = place('tablet', 350, 330, 'Fai'); S.bt = [[e.id, f.id]];
  },
  intro: 'Three ways to send the same photo: an <b>Ethernet</b> cable, <b>Wi-Fi</b>, and <b>Bluetooth</b> (the small blue circle).',
  lanes: [{ label: 'Ethernet', a: 'Ana', b: 'Ben', kind: 'ethernet', text: 'a cable between the two laptops.' }, { label: 'Wi-Fi', a: 'Chi', b: 'Dev', via: 'Wi-Fi point', kind: 'wifi', text: 'through the air, via the Wi-Fi point.' }, { label: 'Bluetooth', a: 'Eli', b: 'Fai', kind: 'bluetooth', text: 'through the air, straight between two tablets close together.' }],
  predict: { q: 'Each sends the same photo (6 packets). Which arrives first?', options: ['Ethernet', 'Wi-Fi', 'Bluetooth'], why: 'A cable is usually the fastest. Wi-Fi is slower but needs no cable. Bluetooth is the slowest, and only reaches a few metres.' },
  end: 'Ethernet (cable) is usually fastest. Wi-Fi is slower but has no cables. Bluetooth is slow and short range: good for headphones and keyboards close by.',
  after: { q: 'Bluetooth is slow. Why do people still use it?', options: ['It joins things close by, like headphones, with no cable and no Wi-Fi point', 'It is the fastest way to send data', 'It reaches further than Wi-Fi'], why: 'Bluetooth joins two devices close together (a few metres) with no cable and no Wi-Fi point. Fine for headphones, too slow for big files.' } };
const BLUETOOTH = { id: 'bluetooth', group: 'Speeds', title: 'Bluetooth Range', type: 'tutorial',
  setup() { S = fresh({}); const a = place('tablet', 300, 180, 'Ana'), b = place('tablet', 350, 180, 'Ben'); S.bt = [[a.id, b.id]]; S.startDevs = S.devs.length; },
  intro: 'These two tablets are joined by <b>Bluetooth</b>: no cable, no Wi-Fi point. The small blue circle shows how far Bluetooth reaches.',
  steps: [
    { text: 'Send a <b>Photo</b> from one tablet to the other. It goes by Bluetooth.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok },
    { text: 'Carry one tablet <b>outside</b> the blue circle (only a few metres), then send again.', show: 'test', event: true, done: () => S.lastTest && !S.lastTest.ok }
  ],
  end: 'Bluetooth only reaches a few metres. Wi-Fi reaches across a room or a building.',
  after: { q: 'Which reaches further?', options: ['Wi-Fi', 'Bluetooth', 'They reach the same distance'], why: 'Bluetooth reaches only a few metres. Wi-Fi reaches across a room or more.' } };
// ---- challenges: a client's brief and requirements, no help; stars for meeting them, few cables and testing first
const allTalk = () => allPairs().every(p => route(p[0], p[1]));
const inRoom = (d, r) => d.x >= r.x && d.x <= r.x + r.w;
const C1 = { id: 'c-home', group: 'Challenges', title: 'Home Office', type: 'client', noHelp: true,
  setup() { S = fresh({ laptop: 3, printer: 1, 'switch': 1 }); },
  brief: 'The client works from home with two helpers. They want a <b>star network</b> so all three laptops can share one printer.',
  reqs: [
    { text: 'Three laptops and one printer.', test: () => laptops().length === 3 && count('printer') === 1 },
    { text: 'A star network: every device plugged straight into one switch.', test: () => { const sw = S.devs.find(d => d.kind === 'switch'); return !!sw && ends().every(d => hasCable(d, sw)); } },
    { text: 'Every laptop can print.', test: () => laptops().every(l => S.devs.some(p => p.kind === 'printer' && route(l, p))) },
    { text: 'Every laptop can send a message to every other laptop.', test: allTalk }
  ], minCables: 4 };
const C2 = { id: 'c-cafe', group: 'Challenges', title: 'The Cafe', type: 'client', noHelp: true,
  setup() { S = fresh({ laptop: 3, tablet: 1, wifi: 1 }); const b1 = place('bus', 170, 200, 'Main cable 1'), b2 = place('bus', 470, 200, 'Main cable 2'); plug(b1, b2); S.startDevs = S.devs.length; S.startCables = 1; },
  brief: 'A cafe already has a main cable along the wall. The owner wants a <b>bus network</b> with <b>three laptops and a tablet</b> for the staff.',
  reqs: [
    { text: 'Three laptops, each plugged into the main cable.', test: () => laptops().length === 3 && laptops().every(l => plugged(l, 'bus')) },
    { text: 'One tablet on the network (a tablet has no network socket).', test: () => S.devs.some(t => t.kind === 'tablet' && S.devs.some(w => w.kind === 'wifi' && inRange(t, w) && plugged(w, 'bus'))) },
    { text: 'Everyone can send a message to everyone.', test: allTalk },
    { text: 'The main cable is still joined in the middle.', test: () => { const [b1, b2] = S.devs.filter(d => d.kind === 'bus'); return !!b1 && !!b2 && hasCable(b1, b2); } }
  ], minCables: 4 };
const C3 = { id: 'c-ring', group: 'Challenges', title: 'Ring Road', type: 'client', noHelp: true,
  setup() { S = fresh({ pc: 5 }); S.pcPorts = 2; },
  brief: 'A small company wants its <b>five computers</b> in a <b>ring network</b>. Each computer has two ports.',
  reqs: [
    { text: 'Five computers.', test: () => pcs().length === 5 },
    { text: 'A ring: each computer joined to the one before and the one after, in one loop.', test: () => !!ringOf(pcs()) },
    { text: 'Every computer can send a message to every other computer.', test: allTalk }
  ], minCables: 5 };
const C4 = { id: 'c-rooms', group: 'Challenges', title: 'Two Classrooms', type: 'client', noHelp: true,
  setup() { S = fresh({ laptop: 5, printer: 1, 'switch': 2 }); S.rooms = [{ x: 14, w: 300, name: 'Room 1' }, { x: 326, w: 300, name: 'Room 2' }]; },
  brief: 'A school needs <b>three laptops in Room 1</b> and <b>two laptops and the printer in Room 2</b>. Each room must have <b>its own switch</b>. Cables cost money: the budget is <b>8 cables</b>.',
  reqs: [
    { text: 'Room 1: three laptops and a switch.', test: () => laptops().filter(l => inRoom(l, S.rooms[0])).length === 3 && S.devs.some(d => d.kind === 'switch' && inRoom(d, S.rooms[0])) },
    { text: 'Room 2: two laptops, the printer and a switch.', test: () => laptops().filter(l => inRoom(l, S.rooms[1])).length === 2 && S.devs.some(d => d.kind === 'printer' && inRoom(d, S.rooms[1])) && S.devs.some(d => d.kind === 'switch' && inRoom(d, S.rooms[1])) },
    { text: 'Every laptop in both rooms can print.', test: () => laptops().every(l => S.devs.some(p => p.kind === 'printer' && route(l, p))) },
    { text: 'No more than 8 cables.', test: () => S.cables.length <= 8 }
  ], minCables: 7 };
const C5 = { id: 'c-library', group: 'Challenges', title: 'The Library', type: 'client', noHelp: true,
  setup() {
    S = fresh({ laptop: 2, printer: 1, 'switch': 1, wifi: 3 });
    [[60, 60, 'Ana'], [580, 60, 'Ben'], [60, 320, 'Chi'], [580, 320, 'Dev']].forEach(q => place('tablet', q[0], q[1], q[2]));
    S.tabletSpots = S.devs.filter(d => d.kind === 'tablet').map(t => [t.id, t.x, t.y]);
  },
  brief: 'Four tablets are fixed in the corners of the library, far apart. The librarian also needs <b>two laptops</b> and <b>a printer</b>. Everyone must be able to print.',
  reqs: [
    { text: 'The tablets stay where they are.', test: () => S.tabletSpots.every(([id, x, y]) => { const t = dev(id); return t && Math.hypot(t.x - x, t.y - y) < 12; }) },
    { text: 'Two laptops and a printer.', test: () => laptops().length === 2 && count('printer') === 1 },
    { text: 'Every tablet and laptop can print.', test: () => S.devs.filter(isClient).every(c => S.devs.some(p => p.kind === 'printer' && route(c, p))) },
    { text: 'Everyone can send a message to everyone.', test: allTalk }
  ], minCables: 5 };
const C6 = { id: 'c-backup', group: 'Challenges', title: 'No Single Point', type: 'client', noHelp: true,
  setup() { S = fresh({ pc: 4 }); S.pcPorts = 3; },
  brief: 'A hospital office has <b>four computers</b>. If <b>any one cable breaks</b>, every computer must still reach every other. Each computer has three ports.',
  reqs: [
    { text: 'Four computers.', test: () => pcs().length === 4 },
    { text: 'Every computer can send a message to every other computer.', test: allTalk },
    { text: 'If any one cable breaks, everyone can still reach everyone.', test: () => {
      const all = S.cables.slice();
      const okAll = all.every(c => { S.cables = all.filter(x => x !== c); const r = allTalk(); S.cables = all; return r; });
      S.cables = all; return all.length > 0 && okAll;
    } }
  ], minCables: 4 };
export const MISSIONS = [BUILD[0], BUILD[1], BUILD[2], WIFI1, WIFI2, FIX[1], FULL, FIX[0], FIXW, BUDGET, SCHOOL, PACKETS1, PACKETS2, STAR, BUS, RING, MESH, SERIAL, DUPLEX, SPEEDRACE, BLUETOOTH, C1, C2, C3, C4, C5, C6];
export const SECTIONS = ['Introduction', 'Wi-Fi', 'Bigger networks', 'Troubleshooting', 'Design', 'Packets', 'Topologies', 'Transmission modes', 'Speeds', 'Challenges'];

// ================================================================ the small pictures for Walk me through it (website drawing)
function icon(d, x, y) {
  if (d.kind === 'printer') return '<rect class="paper" x="' + (x - 16) + '" y="' + (y - 30) + '" width="32" height="16" rx="2"/><rect class="body" x="' + (x - 30) + '" y="' + (y - 16) + '" width="60" height="30" rx="6"/><rect class="slot" x="' + (x - 18) + '" y="' + (y + 2) + '" width="36" height="4" rx="2"/>';
  if (d.kind === 'switch') {
    const n = d.ports || 8; let s = '<rect class="body sw" x="' + (x - 46) + '" y="' + (y - 14) + '" width="92" height="28" rx="5"/>';
    for (let i = 0; i < n; i++) s += '<rect class="port" x="' + (x - n * 5 + 2 + i * 10) + '" y="' + (y - 5) + '" width="7" height="7" rx="1"/>';
    return s;
  }
  if (d.kind === 'bus') return '<rect class="body sw" x="' + (x - 70) + '" y="' + (y - 8) + '" width="140" height="16" rx="8"/>';
  if (d.kind === 'tablet') return '<rect class="body" x="' + (x - 20) + '" y="' + (y - 30) + '" width="40" height="56" rx="6"/><rect class="screen" x="' + (x - 15) + '" y="' + (y - 24) + '" width="30" height="42" rx="2"/>';
  if (d.kind === 'wifi') return '<path class="wave" d="M' + (x - 20) + ' ' + (y - 18) + ' Q' + x + ' ' + (y - 36) + ' ' + (x + 20) + ' ' + (y - 18) + '"/><path class="wave" d="M' + (x - 11) + ' ' + (y - 12) + ' Q' + x + ' ' + (y - 22) + ' ' + (x + 11) + ' ' + (y - 12) + '"/>' +
    '<rect class="body sw" x="' + (x - 26) + '" y="' + (y - 6) + '" width="52" height="20" rx="5"/><circle class="led" cx="' + x + '" cy="' + (y + 4) + '" r="3"/>';
  return '<rect class="body" x="' + (x - 26) + '" y="' + (y - 26) + '" width="52" height="34" rx="4"/><rect class="screen" x="' + (x - 21) + '" y="' + (y - 21) + '" width="42" height="24" rx="2"/><rect class="body" x="' + (x - 34) + '" y="' + (y + 8) + '" width="68" height="7" rx="3"/>';
}
function mini(state, hl) {
  const keep = S; S = state;
  let out = '<svg class="nb-mini" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A network">';
  (state.rooms || []).forEach(r => { out += '<rect class="room" x="' + r.x + '" y="10" width="' + r.w + '" height="' + (H - 16) + '" rx="14"/><text class="room-t" x="' + (r.x + 14) + '" y="34">' + r.name + '</text>'; });
  state.devs.forEach(w => { if (w.kind === 'wifi') out += '<circle class="range" cx="' + w.x + '" cy="' + w.y + '" r="' + RANGE + '"/>'; });
  state.devs.forEach(t => { if (t.kind === 'tablet') aps(t).forEach(w => { out += '<line class="air" x1="' + t.x + '" y1="' + t.y + '" x2="' + w.x + '" y2="' + w.y + '"/>'; }); });
  state.cables.forEach((c, i) => { const a = dev(c.a), b = dev(c.b); out += '<line class="cable' + (hl && hl.indexOf(i) >= 0 ? ' lit' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; });
  state.devs.forEach(d => { out += '<g class="dev ' + d.kind + '">' + icon(d, d.x, d.y) + '<text x="' + d.x + '" y="' + (d.y + 40) + '">' + d.name + '</text></g>'; });
  out += '</svg>';
  S = keep;
  return out;
}
function cablesOn(state, r) {
  const out = [];
  for (let i = 0; i + 1 < r.length; i++) state.cables.forEach((c, k) => { if ((c.a === r[i].id && c.b === r[i + 1].id) || (c.b === r[i].id && c.a === r[i + 1].id)) out.push(k); });
  return out;
}

// ================================================================ results for the site (as NetLab/common.js)
const STORE = 'bc-netlab-v1:';
function load(key, fallback) { try { const v = localStorage.getItem(STORE + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
function save(key, value) { try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch (e) { } }
function results(id, label) {
  const lines = []; let right = 0, tries = 0, finished = false; const before = !!load('done:' + id, false);
  function post() {
    if (window.parent === window) return;
    const head = (finished ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.') + (tries ? ' ' + right + ' clean rounds in ' + tries + '.' : '');
    try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label, summary: head + ' ' + lines.slice(-12).join(' '), complete: finished || before }, '*'); } catch (e) { }
  }
  return {
    add(text, ok) { tries++; if (ok) right++; lines.push(tries + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); post(); },
    note(text) { lines.push(text); post(); },
    finish() { if (finished) return; finished = true; save('done:' + id, true); post(); }
  };
}

// ================================================================ the 3D lab
export function startSolo({ container, myName, colour }) {
  const log = results('netlab3d', 'Network Builder 3D');
  // ---- the room: one big floor (the desk), the supply shelf along the bottom
  const rows = [];
  for (let y = 0; y < MAPH; y++) { let r = ''; for (let x = 0; x < MAPW; x++) r += (x === 0 || y === 0 || x === MAPW - 1 || y === MAPH - 1) ? '#' : '.'; rows.push(r); }
  let view = null, scene = null, devG = null, cableG = null, fxG = null, crateG = null;
  const CRATES = {};   // kind -> { x, y, w, h, k3 }
  const shelfAt = { laptop: 2, tablet: 6, printer: 10, 'switch': 14, wifi: 18, pc: 22, cable: 27 };
  const pos = { x: 16, y: 21.5, face: Math.PI };
  let moving = false, overview = false, stick = null;
  const keys = new Set();
  const me = createBlob(colour ?? 0, myName || '');
  const hands = [0, 1].map(() => ({ down: false, cable: null, joint: -1, since: 0, dev: null, noGrabUntil: 0 }));
  let cables3 = [], nextCable = 1, tickNo = 0;

  function regionsFor(rooms) {
    const regs = [{ name: 'Supply shelf', shelf: true, x0: 1, y0: DESK_BOTTOM + 1, x1: MAPW - 2, y1: MAPH - 2 }];
    if (!rooms) regs.push({ name: 'Network lab', index: 0, x0: 1, y0: 1, x1: MAPW - 2, y1: DESK_BOTTOM });
    else rooms.forEach((r, i) => regs.push({ name: r.name, index: i, x0: Math.max(1, Math.floor(OX + r.x / K)), y0: 1, x1: Math.min(MAPW - 2, Math.floor(OX + (r.x + r.w) / K)), y1: DESK_BOTTOM }));
    return regs;
  }
  // everything in a group: its shapes and its pictures (shared materials just upload again if used later)
  function disposeAll(g) {
    if (!g) return;
    scene.remove(g);
    g.traverse(o => {
      o.geometry?.dispose?.();
      for (const m of [].concat(o.material || [])) { m.map?.dispose?.(); m.emissiveMap?.dispose?.(); }
    });
  }
  function dropGroup(g) { if (!g) return; scene.remove(g); g.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); }
  function buildWorld() {
    if (!view) { view = create(container); scene = view.scene; scene.add(me.group, pulse, arrows, portGlow, outlineG); }
    guideKey = '';
    view.setRoom({ w: MAPW, h: MAPH, rows, regions: regionsFor(S.rooms) });
    // the last mission's devices, crates, cables and Wi-Fi rings go, and so does their memory
    dropGroup(cableG); dropGroup(fxG); dropGroup(wifiG); dropGroup(ringG); ringG = null; ringKey = ''; disposeAll(devG); disposeAll(crateG);
    drawn.clear(); wifiKey = null;
    devG = new THREE.Group(); cableG = new THREE.Group(); fxG = new THREE.Group(); crateG = new THREE.Group(); wifiG = null;
    scene.add(devG, cableG, fxG, crateG);
    // The supply shelf: a crate for each kind of device the mission lets you add, and the cable crate.
    for (const k of Object.keys(CRATES)) delete CRATES[k];
    for (const kind of SHELF.concat(['cable'])) {
      if (kind !== 'cable' && !(kind in S.palette)) continue;
      const c = { x: shelfAt[kind], y: DESK_BOTTOM + 2, w: 2, h: 2, kind };
      c.k3 = makeCrate({ ...c, title: crateTitle(kind) }, CRATE_COL[kind], kind === 'cable' ? null : makeDevice({ kind, title: '', x: 0, y: 0, w: size(kind)[0], h: size(kind)[1], sockets: [] }).group);
      crateG.add(c.k3.group); CRATES[kind] = c;
    }
    setOverview(overview);
  }
  function crateTitle(kind) { return kind === 'cable' ? 'Ethernet cables' : (kind === 'switch' ? 'Switches' : LABEL[kind] + 's') + ': ' + Math.max(0, (S.palette[kind] ?? 0) - count(kind)) + ' left'; }
  function retitleCrates() {
    for (const [kind, c] of Object.entries(CRATES)) {
      if (kind === 'cable') continue;
      const t = crateTitle(kind); if (c.title === t) continue; c.title = t;
      const g = c.k3.group; g.remove(c.k3.tag); c.k3.tag.material.map.dispose();
      const col = CRATE_COL[kind], light = ((col >> 16) & 255) * 0.3 + ((col >> 8) & 255) * 0.59 + (col & 255) * 0.11 > 150;
      c.k3.tag = tape(t, { bg: '#' + col.toString(16).padStart(6, '0'), ink: light ? '#1c1b17' : '#f4f4f0', size: 0.034 }); c.k3.tag.position.set(0, 190, 0); g.add(c.k3.tag);
    }
  }

  // ---- devices in 3D: footprints in tiles, kept in step with the desk position (x, y) the model uses
  function size(kind, ports) { return kind === 'bus' ? [7, 1] : kind === 'switch' ? ((ports || 8) <= 4 ? [4, 1] : [5, 1]) : kind === 'wifi' ? [2, 1] : kind === 'tablet' ? [1, 1] : [3, 2]; }
  function socketsFor(d) {
    const n = sockets(d), out = [];
    for (let i = 0; i < n; i++) out.push(d.kind === 'laptop' ? { x: d.X + d.w - 0.5 + 0.12, y: d.Y + d.h / 2 - 0.5, face: 'e' }
      : d.kind === 'printer' || d.kind === 'wifi' ? { x: d.X - 0.5 + d.w * 0.78, y: d.Y + d.h - 0.5 + 0.12, face: 's' }
      : { x: d.X - 0.5 + (i + 0.5) * d.w / n, y: d.Y + d.h - 0.5 + 0.12, face: 's' });
    return out;
  }
  const centre = d => d.kind === 'tablet' ? [d.tx, d.ty] : [d.X + (d.w - 1) / 2, d.Y + (d.h - 1) / 2];
  function toDesk(d) { const [cx, cy] = centre(d); d.x = (cx - OX) * K; d.y = (cy - OY) * K; }
  function fromDesk(d) {
    [d.w, d.h] = size(d.kind, d.ports);
    const cx = OX + d.x / K, cy = OY + d.y / K;
    if (d.kind === 'tablet') { d.tx = cx; d.ty = cy; }
    else { d.X = Math.round(cx - (d.w - 1) / 2); d.Y = Math.round(cy - (d.h - 1) / 2); }
  }
  function realise(d) {
    fromDesk(d);
    d.k3 = makeDevice({ kind: d.kind, title: d.name, x: d.X ?? 0, y: d.Y ?? 0, w: d.w, h: d.h, sockets: d.kind === 'tablet' ? [] : socketsFor(d) });
    devG.add(d.k3.group); placeGroup(d);
  }
  function placeGroup(d) {
    if (d.kind === 'tablet') d.k3.group.position.set((d.tx + 0.5) * T, 0, (d.ty + 0.5) * T);
    else d.k3.group.position.set(d.X * T + d.w * T / 2, 0, d.Y * T + d.h * T / 2);
    toDesk(d);
  }
  function unrealise(d) { devG.remove(d.k3.group); d.k3.group.traverse(o => o.geometry?.dispose?.()); }
  const socketWorld = (d, i) => d.k3.sockets[i] && { pos: d.k3.sockets[i].local.clone().add(d.k3.group.position), dir: d.k3.sockets[i].dir };
  // where a plugged plug's back (and so the cable's end) sits on the map, in tiles
  function plugPin(d, i) { const s = socketWorld(d, i); return [(s.pos.x - s.dir.x * PLUG_LEN) / T - 0.5, (s.pos.z - s.dir.z * PLUG_LEN) / T - 0.5]; }
  function socketTaken(d, i) { return cables3.some(c => c.ends.some(e => e && e.dev === d.id && e.sock === i)); }

  // ---- solid things: walls, devices put down (not tablets, not one being carried), crates
  function solidAt(tx, ty, skip) {
    if (ty < 0 || tx < 0 || ty >= MAPH || tx >= MAPW || rows[ty][tx] === '#') return true;
    for (const d of S.devs) if (d.kind !== 'tablet' && d !== skip && !carried(d) && tx >= d.X && tx < d.X + d.w && ty >= d.Y && ty < d.Y + d.h) return true;
    for (const c of Object.values(CRATES)) if (tx >= c.x && tx < c.x + c.w && ty >= c.y && ty < c.y + c.h) return true;
    return false;
  }
  const carried = d => hands.some(h => h.dev === d);
  isHeld = d => !!d && carried(d);
  function free(x, y) { for (const [ox, oy] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) if (solidAt(Math.round(x + ox), Math.round(y + oy))) return false; return true; }
  function handPos(i) { const fx = Math.sin(pos.face), fy = Math.cos(pos.face), side = i === 0 ? 1 : -1; return [pos.x + fx * 0.42 + Math.cos(pos.face) * side * 0.2, pos.y + fy * 0.42 - Math.sin(pos.face) * side * 0.2]; }

  // ---- cables: the server's rope, run here (only you are in this lab)
  function newCable(points, len) {
    const n = Math.max(2, Math.round(len / SEG));
    const P = new Float64Array(2 * (n + 1));
    const [ax, ay] = points[0], [bx, by] = points[1], D = Math.hypot(bx - ax, by - ay) || 0.01;
    if (len > D * 3) {
      // fresh from the crate: coiled at your hand; it uncoils as it is pulled
      for (let k = 0; k <= n; k++) { const t = k * 0.55, r = Math.min(0.15 + 0.03 * k, 0.7); P[2 * k] = ax + Math.cos(t) * r; P[2 * k + 1] = ay + Math.sin(t) * r; }
    } else {
      // laid between two sockets: a gentle bow whose length is the cable's, so the slack lies smooth, not zigzagged
      const h = Math.sqrt(Math.max(0, 3 * D * (len - D) / 8)), px = -(by - ay) / D, py = (bx - ax) / D;
      for (let k = 0; k <= n; k++) { const t = k / n, b = h * 4 * t * (1 - t); P[2 * k] = ax + (bx - ax) * t + px * b; P[2 * k + 1] = ay + (by - ay) * t + py * b; }
    }
    const c = { id: nextCable++, P, Q: P.slice(), n, ends: [null, null] };
    cables3.push(c); return c;
  }
  function pinOf(c, j) {
    for (let i = 0; i < 2; i++) if (hands[i].cable === c && hands[i].joint === j) return handPos(i);
    const e = j === 0 ? 0 : j === c.n ? 1 : -1;
    if (e >= 0 && c.ends[e]) return plugPin(dev(c.ends[e].dev), c.ends[e].sock);
    return null;
  }
  function stepCables() {
    for (const c of cables3) {
      if (c.type) continue;   // the see-through cables of a race are laid once and never move (they would rebuild every frame)
      const { P, Q, n } = c, pins = [];
      for (let j = 0; j <= n; j++) pins.push(pinOf(c, j));
      const hi = hands.findIndex(h => h.cable === c), slide = hi >= 0 ? 0.7 : 0.4;   // a cable nobody holds settles quickly
      for (let i = 0; i <= n; i++) {
        if (pins[i]) { Q[2 * i] = P[2 * i]; Q[2 * i + 1] = P[2 * i + 1]; P[2 * i] = pins[i][0]; P[2 * i + 1] = pins[i][1]; continue; }
        const x = P[2 * i], y = P[2 * i + 1];
        P[2 * i] += (x - Q[2 * i]) * slide; P[2 * i + 1] += (y - Q[2 * i + 1]) * slide; Q[2 * i] = x; Q[2 * i + 1] = y;
      }
      // a cable in your hand gathers up behind you as you walk (its loose end stays near you, not back at the crate)
      if (hi >= 0) {
        const [hx, hy] = handPos(hi);
        for (let i = 0; i <= n; i++) {
          if (pins[i]) continue;
          const dx = hx - P[2 * i], dy = hy - P[2 * i + 1], d = Math.hypot(dx, dy);
          if (d > 1.4) { const k = 0.07 * (d - 1.4) / d; P[2 * i] += dx * k; P[2 * i + 1] += dy * k; }
        }
      }
      for (let it = 0; it < 12; it++) {
        for (let i = 0; i < n; i++) {
          const dx = P[2 * i + 2] - P[2 * i], dy = P[2 * i + 3] - P[2 * i + 1]; let d = Math.hypot(dx, dy); if (d < 1e-6) d = 1e-6;
          const wa = pins[i] ? 0 : 1, wb = pins[i + 1] ? 0 : 1, ws = wa + wb; if (!ws) continue;
          const k = (d - SEG) / d / ws;
          P[2 * i] += dx * k * wa; P[2 * i + 1] += dy * k * wa; P[2 * i + 2] -= dx * k * wb; P[2 * i + 3] -= dy * k * wb;
        }
        for (let i = 0; i <= n; i++) if (!pins[i]) pushOut(P, i);
      }
      // too short: the newer hand lets go
      const pinned = []; for (let j = 0; j <= n; j++) if (pins[j]) pinned.push(j);
      for (let k = 1; k < pinned.length; k++) {
        const a = pinned[k - 1], b = pinned[k], pa = pins[a], pb = pins[b];
        if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) <= (b - a) * SEG * 1.15 + 0.6) continue;
        const hi = [0, 1].filter(i => hands[i].cable === c && (hands[i].joint === a || hands[i].joint === b)).sort((x, y) => hands[y].since - hands[x].since)[0];
        if (hi != null) { release(hi); toast('The cable is not long enough: you let go.', 'hint'); continue; }
        // no hand on it: a device being carried pulls the plug out of its own port
        for (const j of [a, b]) {
          const e = j === 0 ? 0 : j === c.n ? 1 : -1, end = e >= 0 && c.ends[e], d = end && dev(end.dev);
          if (!d || !carried(d)) continue;
          c.ends[e] = null;
          toast('The Ethernet cable is not long enough: it pulled out of ' + d.name + "'s port.", 'hint');
          afterChange(); break;
        }
      }
    }
  }
  function pushOut(P, i) {
    const x = P[2 * i], y = P[2 * i + 1], tx = Math.round(x), ty = Math.round(y);
    if (!solidAt(tx, ty)) return;
    let best = 9, bx = x, by = y;
    const tryAt = (nx, ny, px, py) => { if (solidAt(nx, ny)) return; const d = Math.abs(px - x) + Math.abs(py - y); if (d < best) { best = d; bx = px; by = py; } };
    tryAt(tx - 1, ty, tx - 0.51, y); tryAt(tx + 1, ty, tx + 0.51, y); tryAt(tx, ty - 1, x, ty - 0.51); tryAt(tx, ty + 1, x, ty + 0.51);
    P[2 * i] = bx; P[2 * i + 1] = by;
  }

  // ---- the model's cables are the 3D cables with both plugs in
  function sync() {
    S.cables = cables3.filter(c => c.ends[0] && c.ends[1] && !c.broken).map(c => ({ a: c.ends[0].dev, b: c.ends[1].dev, c3: c }));
    for (const d of S.devs) for (let i = 0; i < d.k3.lights.length; i++) setLight(d.k3.lights[i], socketTaken(d, i));
    retitleCrates();
    // a switch's label says how many of its ports are used
    for (const d of S.devs) {
      if (d.kind !== 'switch' || !d.k3 || !d.k3.tag) continue;
      const n = d.k3.sockets.length, used = d.k3.sockets.filter((_, i) => socketTaken(d, i)).length;
      const title = d.name + ': ' + used + ' of ' + n + ' ports used';
      if (d.k3.tagText === title) continue;
      d.k3.tagText = title;
      const old = d.k3.tag; d.k3.group.remove(old); old.material.map.dispose(); old.material.dispose();
      d.k3.tag = tape(title, { size: 0.034 }); d.k3.tag.position.set(0, d.k3.tagY, 0); d.k3.group.add(d.k3.tag);
    }
  }

  // ---- hands: hold to grab, let go to put down or plug in (as the team game)
  function locked() { return M.phase === 'ask' || M.phase === 'predict' || M.phase === 'checked' || M.phase === 'done' || !!anim || !!fx || !!pk || !!race || M.m.type === 'race'; }
  function release(i) {
    const h = hands[i];
    if (h.dev) dropDevice(i, true);
    h.cable = null; h.joint = -1; h.noGrabUntil = tickNo + 16;
  }
  function setHand(i, down) {
    const h = hands[i];
    if (h.down === down) return;
    h.down = down;
    $(i ? 'rightBtn' : 'leftBtn')?.classList.toggle('on', down);
    if (!down) { letGo(i); return; }
    if (locked()) { toast(M.m.type === 'race' ? 'Watch this one: predict on the right, then press Run it.' : M.phase === 'ask' ? 'Answer the question on the right first.' : M.phase === 'predict' ? 'Predict first: choose Yes or No for each job, then press Check my predictions.' : anim ? 'Wait for the message to arrive.' : 'Press the button on the mission sheet to go on.', 'hint'); return; }
    if (h.cable || h.dev) return;
    const g = grabTarget(i);
    if (!g) return;
    if (g.kind === 'crate') { takeFrom(i, g.crate); return; }
    if (g.kind === 'tablet') { h.dev = g.d; h.from = { tx: g.d.tx, ty: g.d.ty }; afterChange(); return; }
    if (g.kind === 'cable') { grabJoint(i, g); return; }
    if (g.kind === 'device') { const d = g.d; h.dev = d; h.from = { X: d.X, Y: d.Y }; toast('Carrying ' + d.name + '. Let go to put it down. Let go at its crate to put it back.', 'hint'); afterChange(); }
  }
  // What hand i would grab if pressed now, in this order: the crate under it, a tablet, a cable (a plug in a port
  // first), the device it touches, then a crate near you. Nothing is changed.
  function grabTarget(i) {
    const h = hands[i]; if (h.cable || h.dev || !M || locked()) return null;
    const [hx, hy] = handPos(i);
    const onCrate = Object.values(CRATES).find(c => hx > c.x - 0.8 && hx < c.x + c.w - 0.2 && hy > c.y - 0.8 && hy < c.y + c.h - 0.2);
    if (onCrate) return { kind: 'crate', crate: onCrate };
    const tab = S.devs.find(d => d.kind === 'tablet' && !carried(d) && Math.hypot(d.tx - hx, d.ty - hy) < 0.8);
    if (tab) return { kind: 'tablet', d: tab };
    const j = nearestJoint(i, true);
    const d = S.devs.filter(d => d.kind !== 'tablet' && !carried(d) && distToFoot(d, hx, hy) < 0.5).sort((a, b) => distToFoot(a, hx, hy) - distToFoot(b, hx, hy))[0];
    const isEnd = j && (j.j === 0 || j.j === j.c.n);
    if (j && (isEnd || !d)) return { kind: 'cable', ...j };
    if (d) return { kind: 'device', d };
    const crate = Object.values(CRATES).find(c => Math.hypot(pos.x - (c.x + 0.5), pos.y - (c.y + 0.5)) < 2.0);
    if (crate) return { kind: 'crate', crate };
    return null;
  }
  // Which port a plug let go at (hx, hy) goes into: of the devices near the hand (a port within reach, or the device
  // itself within reach), the nearest; on it, the nearest free port, or the nearest port when all are used (refused).
  function plugChoice(hx, hy) {
    let dv = null, bd = 1e9;
    for (const d of S.devs) {
      if (d.kind === 'tablet' || carried(d) || !d.k3 || !d.k3.sockets.length) continue;
      let pd = 1e9;
      for (let k = 0; k < d.k3.sockets.length; k++) { const [px, py] = plugPin(d, k); pd = Math.min(pd, Math.hypot(hx - px, hy - py)); }
      if ((pd < 0.8 || distToFoot(d, hx, hy) < 1.1) && pd < bd) { bd = pd; dv = d; }
    }
    if (!dv) return null;
    let s = -1, sd = 1e9, any = -1, ad = 1e9;
    for (let k = 0; k < dv.k3.sockets.length; k++) {
      const [px, py] = plugPin(dv, k), dd = Math.hypot(hx - px, hy - py);
      if (dd < ad) { ad = dd; any = k; }
      if (!socketTaken(dv, k) && dd < sd) { sd = dd; s = k; }
    }
    return { d: dv, s: s >= 0 ? s : any, dd: s >= 0 ? sd : ad };
  }
  function distToFoot(d, px, py) { const dx = Math.max(d.X - 0.5 - px, 0, px - (d.X + d.w - 0.5)), dy = Math.max(d.Y - 0.5 - py, 0, py - (d.Y + d.h - 0.5)); return Math.hypot(dx, dy); }
  // the nearest bit of cable to hand i; a plug counts as nearer (a plug in a port most of all), so reaching for the
  // plug in a laptop's port takes the plug, not the laptop
  function nearestJoint(i, press) {
    const [hx, hy] = handPos(i); let best = null;
    for (const c of cables3) for (let j = 0; j <= c.n; j++) {
      const e = j === 0 ? 0 : j === c.n ? 1 : -1;
      if (e >= 0 && !press && c.ends[e]) continue;
      if (hands.some(o => o.cable === c && o.joint === j)) continue;
      let d = Math.hypot(hx - c.P[2 * j], hy - c.P[2 * j + 1]); if (e >= 0) d -= c.ends[e] ? 0.25 : 0.45;
      if (d < 0.6 && (!best || d < best.d)) best = { c, j, d };
    }
    return best;
  }
  function grabJoint(i, best) {
    const h = hands[i], e = best.j === 0 ? 0 : best.j === best.c.n ? 1 : -1;
    h.pulledFrom = null;
    if (e >= 0 && best.c.ends[e]) { h.pulledFrom = { ...best.c.ends[e] }; toast('Ethernet cable unplugged from ' + dev(best.c.ends[e].dev).name + '.', 'good'); best.c.ends[e] = null; afterChange(); }
    h.cable = best.c; h.joint = best.j; h.since = tickNo;
    return true;
  }
  function tryGrab(i, press) {
    const h = hands[i]; if (!press && tickNo < h.noGrabUntil) return false;
    const best = nearestJoint(i, press);
    return best ? grabJoint(i, best) : false;
  }
  function takeFrom(i, crate) {
    const h = hands[i];
    const o = hands[1 - i];
    if (crate.kind === 'cable' && o.cable && !o.cable.ends[0] && !o.cable.ends[1] && (o.joint === 0 || o.joint === o.cable.n) && tickNo - o.since < 20) {
      h.cable = o.cable; h.joint = o.joint === 0 ? o.cable.n : 0; h.since = tickNo;
      toast('You are holding both ends of one cable.', 'good'); return;
    }
    if (crate.kind !== 'cable' && o.dev) return;   // both hands on one device crate: still one device
    if (crate.kind === 'cable') {
      const [hx, hy] = handPos(i);
      const c = newCable([[hx, hy], [hx - Math.sin(pos.face) * 2, hy - Math.cos(pos.face) * 2]], CABLE_LEN);
      h.cable = c; h.joint = 0; h.since = tickNo;
      toast('You took an Ethernet cable. Keep holding to carry it.', 'good'); return;
    }
    if ((S.palette[crate.kind] ?? 0) - count(crate.kind) <= 0) { toast('No ' + LABEL[crate.kind].toLowerCase() + 's left in this crate.', 'hint'); return; }
    const d = place(crate.kind, 320, 190); fromDesk(d);
    realise(d);
    h.dev = d; h.from = null;   // new: letting go on the shelf puts it back
    carryDevice(i);
    toast('You took ' + (d.kind === 'laptop' || d.kind === 'tablet' ? d.name + '\'s ' + LABEL[d.kind].toLowerCase() : 'a ' + LABEL[d.kind]) + '. Carry it onto the floor and let go.', 'good');
    afterChange();
  }
  // A carried device rides just in front of you, snapped to the floor tiles; a tablet is held in your hand.
  function carryDevice(i) {
    const d = hands[i].dev; if (!d) return;
    if (d.kind === 'tablet') { const [hx, hy] = handPos(i); d.tx = hx; d.ty = hy; placeGroup(d); return; }
    // held just in front of you: half its depth in the direction you face, plus a little
    const fx = Math.sin(pos.face), fy = Math.cos(pos.face), reach = Math.abs(fx) * d.w / 2 + Math.abs(fy) * d.h / 2 + 0.7;
    d.X = Math.round(pos.x + fx * reach - (d.w - 1) / 2); d.Y = Math.round(pos.y + fy * reach - (d.h - 1) / 2);
    placeGroup(d);
  }
  function fits(d) {
    if (d.kind === 'tablet') return d.ty <= DESK_BOTTOM + 0.4 && d.ty >= 0.6 && d.tx >= 0.6 && d.tx <= MAPW - 1.6;
    for (let y = d.Y; y < d.Y + d.h; y++) for (let x = d.X; x < d.X + d.w; x++) if (y < 1 || x < 1 || x > MAPW - 2 || y > DESK_BOTTOM || solidAt(x, y, d)) return false;
    return !carried(d) && free(pos.x, pos.y) && shelfReachable();
  }
  // Can you still walk to the supply shelf? (Devices must never wall you in.)
  function shelfReachable() {
    const sx = Math.round(pos.x), sy = Math.round(pos.y), seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift();
      if (y > DESK_BOTTOM) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (seen.has(k) || solidAt(nx, ny)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return false;
  }
  // The nearest free spot for a device that cannot go where it was let go (near (X, Y)), or null.
  function nearestSpot(d, X, Y) {
    for (let r = 0; r <= 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      d.X = X + dx; d.Y = Y + dy;
      if (fits(d)) return true;
    }
    return false;
  }
  function dropDevice(i, forced) {
    const h = hands[i], d = h.dev; h.dev = null;
    const crate = CRATES[d.kind];
    if (crate && Math.hypot(pos.x - (crate.x + 0.5), pos.y - (crate.y + 0.5)) < 2.4 && (S.palette[d.kind] ?? 0) > 0) { removeDevice(d); toast(d.name + ' is back on the shelf.', 'good'); return; }
    if (fits(d)) { placeGroup(d); toast(d.name + ' is on the floor.', 'good'); afterChange(); return; }
    const why = d.kind !== 'tablet' && !free(pos.x, pos.y) ? 'You are standing there.' : d.kind !== 'tablet' && !shelfReachable() ? 'It would block your way back to the shelf.' : 'There is no room there.';
    if (h.from && d.kind === 'tablet') { d.tx = h.from.tx; d.ty = h.from.ty; }
    else if (!h.from && crate) { removeDevice(d); toast(why + ' It went back on the shelf.', 'hint'); return; }
    else if (!nearestSpot(d, h.from ? h.from.X : d.X, h.from ? h.from.Y : d.Y)) {
      if (crate) { removeDevice(d); toast(why + ' It went back on the shelf.', 'hint'); return; }
      d.X = h.from.X; d.Y = h.from.Y;
    }
    placeGroup(d);
    if (!forced) toast(why + ' Put it on an empty bit of floor.', 'hint');
    afterChange();
  }
  function removeDevice(d) {
    for (const c of cables3) for (let e = 0; e < 2; e++) if (c.ends[e] && c.ends[e].dev === d.id) c.ends[e] = null;
    S.devs = S.devs.filter(x => x !== d); unrealise(d);
    afterChange();
  }
  function letGo(i) {
    const h = hands[i];
    if (h.dev) { dropDevice(i); return; }
    if (!h.cable) return;
    const c = h.cable, [hx, hy] = handPos(i), end = h.joint === 0 ? 0 : h.joint === c.n ? 1 : -1;
    h.cable = null; h.joint = -1; h.noGrabUntil = tickNo + 8;
    // back in its crate
    const cc = CRATES.cable;
    if (cc && Math.hypot(pos.x - (cc.x + 0.5), pos.y - (cc.y + 0.5)) < 2.0 && !hands.some(o => o.cable === c) && !c.ends[0] && !c.ends[1]) {
      cables3 = cables3.filter(x => x !== c); toast('Cable put back in the crate.', 'good'); afterChange(); return;
    }
    if (end < 0) return;
    // the port it goes into: the nearest free port of the device you let go next to (but a plug just pulled out only
    // goes back into that device if you push it right into the port)
    const pf = h.pulledFrom; h.pulledFrom = null;
    let best = plugChoice(hx, hy);
    if (best && pf && best.d.id === pf.dev) { const [px, py] = plugPin(best.d, pf.sock); if (Math.hypot(hx - px, hy - py) > 0.35) best = null; }
    if (!best && pf) return;
    if (!best) {
      const tab = S.devs.find(d => d.kind === 'tablet' && Math.hypot(d.tx - hx, d.ty - hy) < 1.0);
      if (tab) toast(tab.name + '\'s tablet has no network socket. It joins by Wi-Fi: put it inside a Wi-Fi point\'s green circle.', 'hint');
      else { const near = S.devs.find(d => d.kind !== 'tablet' && distToFoot(d, hx, hy) < 1.0); if (near) toast('Push the plug right into a network socket on ' + near.name + ': the RJ45 port, a dark hole with gold pins.', 'hint'); }
      return;
    }
    const other = c.ends[1 - end];
    // a plug that cannot go in drops at your feet, so it never lies on top of a port you want to reach later
    const bounce = () => { const j = end ? c.n : 0; c.P[2 * j] = c.Q[2 * j] = pos.x; c.P[2 * j + 1] = c.Q[2 * j + 1] = pos.y; };
    if (other && other.dev === best.d.id) { bounce(); toast('Both ends of one cable cannot go into the same device.', 'hint'); return; }
    if (other && S.cables.some(x => (x.a === other.dev && x.b === best.d.id) || (x.b === other.dev && x.a === best.d.id))) { bounce(); toast('These two are already joined.', 'hint'); return; }
    if (socketTaken(best.d, best.s)) {
      // the website's refusal: a full device
      bounce();
      S.refused = true;
      toast(best.d.kind === 'switch' ? best.d.name + ' has no free sockets (RJ45 ports).' : best.d.name + ' has only <b>one</b> network socket (RJ45 port), and it is already used.', 'bad');
      afterChange(); return;
    }
    c.ends[end] = { dev: best.d.id, sock: best.s };
    sync();
    if (c.ends[0] && c.ends[1]) toast('Ethernet cable connected: ' + dev(c.ends[0].dev).name + ' to ' + dev(c.ends[1].dev).name + '.', 'good');
    else toast('Ethernet cable plugged into ' + best.d.name + '\'s RJ45 port. Now take the other plug to another device.', 'good');
    afterChange();
  }

  // ---- drawing cables (thick tubes with a plug on each end) and the Wi-Fi circles
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.42, roughness: 0.1, depthWrite: false });
  const WIRE_COLS = [0xf03e3e, 0xf59f00, 0xfab005, 0x37b24d, 0x1c7ed6, 0x7048e8, 0xd6336c, 0x495057];
  // a wire inside a typed cable: the cable's path moved a little sideways (ox) and up (oy)
  function offsetCurve(pts, ox, oy) {
    const up = new THREE.Vector3(0, 1, 0), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], t = b.clone().sub(a).normalize();
      const side = new THREE.Vector3().crossVectors(t, up).normalize(), up2 = new THREE.Vector3().crossVectors(side, t).normalize();
      out.push(pts[i].clone().addScaledVector(side, ox).addScaledVector(up2, oy));
    }
    return new THREE.CatmullRomCurve3(out);
  }
  function wireCount(c) { return c.type === 'parallel' ? 8 : c.type === 'full' ? 2 : 1; }
  function wireCurves(c, pts) {
    pts = pts || cablePoints(c);
    const n = wireCount(c), out = [];
    for (let i = 0; i < n; i++) { const a = n === 1 ? 0 : i / n * Math.PI * 2, r = n === 1 ? 0 : (n === 2 ? 4 : 6); out.push(offsetCurve(pts, Math.cos(a) * r, Math.sin(a) * r)); }
    return out;
  }
  function wiresFor(c, pts) {
    const g = new THREE.Group(), curves = wireCurves(c, pts), n = curves.length;
    curves.forEach((cv, i) => {
      const col = c.type === 'parallel' ? WIRE_COLS[i] : c.type === 'full' ? (i ? 0xf76707 : 0x1c7ed6) : 0x1c7ed6;
      const m = new THREE.Mesh(new THREE.TubeGeometry(cv, Math.min(200, pts.length * 3), n > 2 ? 1.8 : 2.6, 6, false), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 }));
      m.userData.own = true; g.add(m);
      // arrows: which way data can go along this wire (simplex one way; half duplex both, one at a time; full duplex one way each)
      const dirs = c.type === 'half' ? [1, -1] : c.type === 'full' ? [i === 0 ? 1 : -1] : [1];
      dirs.forEach((dir, k) => {
        for (const u0 of [0.3, 0.7]) {
          const u = c.type === 'half' ? u0 + (k ? 0.08 : -0.08) : u0, t = cv.getTangentAt(u).normalize().multiplyScalar(dir);
          const cone = new THREE.Mesh(new THREE.ConeGeometry(n > 2 ? 6 : 13, n > 2 ? 16 : 34, 10), new THREE.MeshBasicMaterial({ color: c.type === 'half' && k ? 0xf76707 : 0xffd43b }));
          cone.position.copy(cv.getPointAt(u)).add(new THREE.Vector3(0, n > 2 ? 0 : 22, 0));
          cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
          cone.userData.own = true; g.add(cone);
        }
      });
    });
    return g;
  }
  const brokenMat = new THREE.MeshStandardMaterial({ color: 0xe03131, emissive: 0x5c0f0f, roughness: 0.5 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x2b6fd6, roughness: 0.45 }), litMat = new THREE.MeshStandardMaterial({ color: 0xf2c21b, emissive: 0x6b5200, roughness: 0.4 });
  const plugT = (() => {
    const g = new THREE.Group();
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(12, 15, 24, 14).rotateX(Math.PI / 2).translate(0, 0, 12), new THREE.MeshStandardMaterial({ color: 0x20539f, roughness: 0.7 }));
    const body = new THREE.Mesh(new THREE.BoxGeometry(28, 21, 34).translate(0, 0, 41), new THREE.MeshStandardMaterial({ color: 0xe9f1f6, roughness: 0.15, transparent: true, opacity: 0.82 }));
    const pins = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 9).translate(0, 8, 53), new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8, roughness: 0.3 }));
    const latch = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 26).translate(0, 0, 13), body.material); latch.rotation.x = 0.35; latch.position.set(0, 12, 26);
    for (const m of [boot, body, pins, latch]) { m.castShadow = true; g.add(m); }
    return g;
  })();
  const UPZ = new THREE.Vector3(0, 0, 1);
  function cablePoints(c) {
    const pts = [];
    for (let i = 0; i <= c.n; i++) {
      let h = CABLE_R;
      for (let k = 0; k < 2; k++) if (hands[k].cable === c) h = Math.max(h, HAND_Y - Math.abs(i - hands[k].joint) * 12);
      for (const e of [0, 1]) { if (!c.ends[e]) continue; const kk = e ? c.n - i : i; h = Math.max(h, 50 - kk * 16); }
      pts.push(new THREE.Vector3((c.P[2 * i] + 0.5) * T, h, (c.P[2 * i + 1] + 0.5) * T));
    }
    for (const e of [0, 1]) if (c.ends[e]) { const s = socketWorld(dev(c.ends[e].dev), c.ends[e].sock); pts[e ? c.n : 0] = s.pos.clone().addScaledVector(s.dir, -PLUG_LEN); }
    return pts;
  }
  function cableKey(c) {
    let k = (c.type || '') + (c.broken ? 'B' : '') + (litCables.has(c) ? 'L' : '') + (anim?.cur?.c === c ? 'A' + anim.cur.u.toFixed(3) : '') + hands.map(h => h.cable === c ? h.joint : -1).join() + JSON.stringify(c.ends);
    for (let i = 0; i <= c.n; i++) k += ',' + c.P[2 * i].toFixed(2) + ',' + c.P[2 * i + 1].toFixed(2);
    return k;
  }
  function drawCables() {
    for (const [c, d] of drawn) if (!cables3.includes(c)) { cableG.remove(d.tube, d.plugs[0], d.plugs[1]); d.tube.geometry.dispose(); drawn.delete(c); tubes.delete(c); }
    for (const c of cables3) {
      const key = cableKey(c); let d = drawn.get(c);
      if (d && d.key === key) continue;
      const pts = cablePoints(c);
      if (!d) { d = { plugs: [plugT.clone(), plugT.clone()], tube: null }; cableG.add(d.plugs[0], d.plugs[1]); drawn.set(c, d); }
      for (const e of [0, 1]) {
        const p = d.plugs[e], at = e ? c.n : 0, nb = e ? c.n - 1 : 1;
        p.position.copy(pts[at]);
        if (c.ends[e]) p.quaternion.setFromUnitVectors(UPZ, socketWorld(dev(c.ends[e].dev), c.ends[e].sock).dir);
        else p.quaternion.setFromUnitVectors(UPZ, pts[at].clone().sub(pts[nb]).normalize());
      }
      if (d.tube) { cableG.remove(d.tube); d.tube.geometry.dispose(); }
      d.tube = new THREE.Mesh(tubeGeometry(c, pts), c.type ? glassMat : c.broken ? brokenMat : litCables.has(c) ? litMat : cableMat);
      d.tube.userData.own = true; cableG.add(d.tube); tubes.set(c, d.tube); d.key = key;
      if (d.extra) { cableG.remove(d.extra); d.extra.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); d.extra = null; }
      if (c.type) { d.extra = wiresFor(c, pts); cableG.add(d.extra); }
    }
    drawWifi();
    drawRingArrows();
    drawPulse();
  }
  // a ring: arrows on its cables show the one way data goes round
  let ringG = null, ringKey = '';
  function drawRingArrows() {
    const o = S.ringOrder, key = o ? o.join() + ':' + cables3.map(c => cableKey(c)).join('|') : '';
    if (key === ringKey) return; ringKey = key;
    if (ringG) dropGroup(ringG); ringG = null;
    if (!o) return;
    ringG = new THREE.Group(); scene.add(ringG);
    for (let i = 0; i < o.length; i++) {
      const x = o[i], y = o[(i + 1) % o.length], c = cables3.find(c => c.ends[0] && c.ends[1] && ((c.ends[0].dev === x && c.ends[1].dev === y) || (c.ends[1].dev === x && c.ends[0].dev === y)));
      if (!c) continue;
      const pts = cablePoints(c); if (c.ends[0].dev !== x) pts.reverse();
      const curve = new THREE.CatmullRomCurve3(pts);
      for (const u of [0.3, 0.7]) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(16, 40, 12), new THREE.MeshBasicMaterial({ color: c.broken ? 0xe03131 : 0xffd43b }));
        cone.position.copy(curve.getPointAt(u)).add(new THREE.Vector3(0, 30, 0));
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(u).normalize());
        cone.userData.own = true; ringG.add(cone);
      }
    }
  }
  // Wi-Fi: each Wi-Fi point's range on the floor, and a dotted line from each tablet that has joined (rebuilt only when it changes)
  function drawWifi() {
    const key = S.devs.filter(d => d.kind === 'wifi' || d.kind === 'tablet').map(d => d.id + ':' + centre(d).map(v => v.toFixed(2)) + (d.kind === 'wifi' ? ':' + (cablesOf(d.id).length > 0) : '')).join('|');
    const btKey = (S.bt || []).map(p => p.map(id => { const d = dev(id); return d ? d.x.toFixed(0) + ',' + d.y.toFixed(0) : ''; }).join('/')).join(';');
    if (key + btKey === wifiKey) return;
    wifiKey = key + btKey;
    if (wifiG) dropGroup(wifiG);
    wifiG = new THREE.Group(); scene.add(wifiG);
    for (const w of S.devs.filter(d => d.kind === 'wifi')) {
      const [cx, cy] = centre(w), R = RANGE / K * T, on = cablesOf(w.id).length > 0;
      // the range: a faint line where it ends, and white rings spreading out from the Wi-Fi point (grey when it has no cable)
      const edge = new THREE.Mesh(new THREE.RingGeometry(R - 4, R, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: on ? 0.3 : 0.15, depthWrite: false }));
      edge.position.set((cx + 0.5) * T, 3, (cy + 0.5) * T); edge.userData.own = true; wifiG.add(edge);
      for (let k = 0; k < 5; k++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 72).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: on ? 0xffffff : 0x9aa3ad, transparent: true, opacity: 0.7, depthWrite: false }));
        ring.position.set((cx + 0.5) * T, 4, (cy + 0.5) * T); ring.userData.own = true; ring.userData.wave = { k, R, on }; wifiG.add(ring);
      }
      for (const t of S.devs.filter(d => d.kind === 'tablet' && inRange(d, w))) {
        const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3((t.tx + 0.5) * T, 120, (t.ty + 0.5) * T), new THREE.Vector3((cx + 0.5) * T, 170, (cy + 0.5) * T)]);
        const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0x2f9e44, dashSize: 18, gapSize: 12 })); line.computeLineDistances(); line.userData.own = true; wifiG.add(line);
      }
    }
    // Bluetooth: a small blue circle round a paired tablet (it only reaches a few metres)
    for (const p of S.bt || []) {
      const t0 = dev(p[0]); if (!t0) continue;
      const [cx, cy] = centre(t0), R = BT_RANGE / K * T;
      const ring = new THREE.Mesh(new THREE.RingGeometry(R - 6, R, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.9, depthWrite: false }));
      const fill = new THREE.Mesh(new THREE.CircleGeometry(R, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4dabf7, transparent: true, opacity: 0.12, depthWrite: false }));
      ring.position.set((cx + 0.5) * T, 4, (cy + 0.5) * T); fill.position.set((cx + 0.5) * T, 3, (cy + 0.5) * T);
      ring.userData.own = fill.userData.own = true; wifiG.add(ring, fill);
    }
  }
  // the pulse on what a tutorial step points at
  function drawPulse() {
    const g = guideTarget();
    pulse.visible = !!g;
    if (g) { pulse.position.set((g.x + 0.5) * T, 4, (g.y + 0.5) * T); pulse.scale.setScalar(g.ring); }
  }
  // Where the current tutorial step wants you to go: a crate, a device, the old cable, or (with a plug in your hand)
  // the socket it should go into. { x, y } in tiles, reach = how close counts as there, ring = the ring's size.
  function guideTarget() {
    if (M && M.m.noHelp) return null;
    const show = M && M.phase === 'build' ? M.show : null;
    if (!show || show === 'test') return null;
    // carrying a tablet on the Wi-Fi step: into the range of a Wi-Fi point that has a cable
    const tabH = hands.find(h => h.dev && h.dev.kind === 'tablet');
    if (tabH && show === 'crate-tablet') {
      const w = S.devs.find(x => x.kind === 'wifi' && !carried(x) && cablesOf(x.id).length) || S.devs.find(x => x.kind === 'wifi' && !carried(x));
      if (w) { const [cx, cy] = centre(w); return { x: cx, y: cy + 1.5, reach: RANGE / K * 0.6, ring: 1.2 }; }
    }
    if (hands.some(h => h.dev)) return null;   // carrying a device: put it down anywhere
    const wantsCable = show === 'crate-cable' || show === 'switch' || show === 'wifi';
    const held = hands.find(h => h.cable && (h.joint === 0 || h.joint === h.cable.n));
    if (held && !wantsCable) return null;
    if (held) {
      const c = held.cable, other = c.ends[held.joint === 0 ? 1 : 0], from = other && dev(other.dev);
      const otherKind = from ? from.kind : null;
      let kinds;
      if (show === 'switch') kinds = otherKind === 'switch' ? ['laptop'] : ['switch'];
      else if (show === 'wifi') kinds = otherKind === 'wifi' ? ['switch'] : otherKind === 'switch' ? ['wifi'] : ['wifi', 'switch'];
      else kinds = ['laptop'];
      const [hx, hy] = handPos(hands.indexOf(held));
      let best = null;
      for (const d of S.devs) {
        if (d === from || kinds.indexOf(d.kind) < 0 || carried(d)) continue;
        if (show === 'switch' && d.kind === 'laptop' && plugged(d, 'switch')) continue;
        const socks = d.k3.sockets.map((_, i) => i), freeOnes = socks.filter(i => !socketTaken(d, i));
        // the third-laptop step wants you to try a used socket, so a full laptop still counts there
        for (const i of freeOnes.length ? freeOnes : (d.kind === 'laptop' ? socks : [])) {
          const [px, py] = plugPin(d, i), dd = Math.hypot(px - hx, py - hy);
          if (!best || dd < best.dd) best = { x: px, y: py, dd, sock: { d, i } };
        }
      }
      return best && { x: best.x, y: best.y, reach: 0.9, ring: 0.45, sock: best.sock };
    }
    // empty hands at a cable step: a loose plug that belongs in this step first, then any spare cable, then the crate
    if (wantsCable) {
      let pick = null, pd = 1e9;
      for (const c of cables3) for (const e of [0, 1]) {
        if (c.ends[e]) continue;
        const o = c.ends[1 - e], od = o && dev(o.dev);
        let good;
        if (show === 'switch') good = od && (od.kind === 'switch' ? laptops().some(l => !plugged(l, 'switch')) : od.kind === 'laptop' && !plugged(od, 'switch'));
        else if (show === 'wifi') good = od && (od.kind === 'wifi' || od.kind === 'switch');
        else good = !od || od.kind === 'laptop';
        if (!good) continue;
        const j = e ? c.n : 0, x = c.P[2 * j], y = c.P[2 * j + 1], dd = Math.hypot(x - pos.x, y - pos.y) - (od ? 100 : 0);
        if (dd < pd) { pd = dd; pick = { x, y, reach: 0.9, ring: 0.45, plug: { c, j } }; }
      }
      if (pick) return pick;
      if (show !== 'crate-cable' && laptops().every(l => plugged(l, 'switch')) && show === 'switch') return null;
      if (show !== 'crate-cable') { const c = CRATES.cable; if (c) return { x: c.x + 0.5, y: c.y + 0.5, reach: 1.7, ring: 1.6, box: [c.x - 0.5, c.y - 0.5, c.x + c.w - 0.5, c.y + c.h - 0.5] }; }
    }
    if (show.startsWith('crate-')) { const c = CRATES[show.slice(6)]; return c ? { x: c.x + 0.5, y: c.y + 0.5, reach: 1.7, ring: 1.6, box: [c.x - 0.5, c.y - 0.5, c.x + c.w - 0.5, c.y + c.h - 0.5] } : null; }
    if (show === 'switch' || show === 'wifi') { const d = S.devs.find(x => x.kind === show && !carried(x)); if (!d) return null; const [cx, cy] = centre(d); return { x: cx, y: cy, reach: Math.max(d.w, d.h) / 2 + 0.9, ring: d.w / 2 + 0.6, box: [d.X - 0.5, d.Y - 0.5, d.X + d.w - 0.5, d.Y + d.h - 0.5] }; }
    if (show === 'cable') { const c = cables3.find(c => c.ends[0] && c.ends[1] && dev(c.ends[0].dev).kind === 'laptop' && dev(c.ends[1].dev).kind === 'laptop'); if (c) { const e = c.ends[0], [px, py] = plugPin(dev(e.dev), e.sock); return { x: px, y: py, reach: 0.9, ring: 0.6 }; } }
    return null;
  }
  // ---- the guide: glowing yellow arrows on the floor tiles, from you to the target, round anything in the way
  // A flat ribbon through the points (in tiles) with an arrow head at the end, as one shape. w = width in world units.
  function arrowGeometry(pts, w, hl0) {
    const P = pts.map(([x, y]) => [(x + 0.5) * T, (y + 0.5) * T]), n = P.length, half = w / 2, verts = [], idx = [];
    const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], [tx, ty] = unit(b[0] - a[0], b[1] - a[1]);
      let nx = -ty, ny = tx, k = 1;
      if (i > 0 && i < n - 1) { const [sx, sy] = unit(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); k = Math.min(2, 1 / Math.max(0.3, nx * -sy + ny * sx)); }
      verts.push(P[i][0] + nx * half * k, 3, P[i][1] + ny * half * k, P[i][0] - nx * half * k, 3, P[i][1] - ny * half * k);
      if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    // the head
    const [ex, ey] = P[n - 1], [tx, ty] = unit(ex - P[n - 2][0], ey - P[n - 2][1]), hw = w * 1.35, hl = hl0 || w * 1.7, o = verts.length / 3;
    verts.push(ex - ty * hw, 3, ey + tx * hw, ex + ty * hw, 3, ey - tx * hw, ex + tx * hl, 3, ey + ty * hl);
    idx.push(o, o + 1, o + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx);
    return g;
  }
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const arrows = new THREE.Group(), arrowBody = new THREE.Mesh(new THREE.BufferGeometry(), arrowMat), arrowGlow = new THREE.Mesh(new THREE.BufferGeometry(), glowMat);
  arrowBody.renderOrder = 3; arrowGlow.renderOrder = 2; arrowGlow.position.y = -0.5; arrows.add(arrowGlow, arrowBody);
  arrows.count = 0;
  let guideKey = '', guideAt = null, guideRoute = null, routeKey = '';
  // The route along the floor grid with the fewest turns: steps cost 1, a turn costs 2 more, so it makes clean L shapes
  // instead of staircases. Ends on the first tile close enough to the target. Returns tile centres, or null.
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function gridRoute(sx, sy, g) {
    const N = MAPW * MAPH, cost = new Float64Array(N * 5).fill(Infinity), prev = new Int32Array(N * 5).fill(-1), buckets = [[]];
    const st = (sy * MAPW + sx) * 5 + 4;
    cost[st] = 0; buckets[0].push(st);
    for (let c = 0; c < buckets.length; c++) {
      const list = buckets[c]; if (!list) continue;
      for (let li = 0; li < list.length; li++) {
        const sid = list[li]; if (cost[sid] !== c) continue;
        const cell = Math.floor(sid / 5), dir = sid % 5, x = cell % MAPW, y = Math.floor(cell / MAPW);
        if (Math.hypot(x - g.x, y - g.y) <= g.reach) {
          const out = []; let k = sid;
          while (k !== -1) { const cc = Math.floor(k / 5); out.unshift([cc % MAPW, Math.floor(cc / MAPW)]); k = prev[k]; }
          return out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
        }
        for (let d = 0; d < 4; d++) {
          const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (solidAt(nx, ny)) continue;
          const nc = c + 1 + (dir !== 4 && dir !== d ? 2 : 0), nid = (ny * MAPW + nx) * 5 + d;
          if (nc < cost[nid]) { cost[nid] = nc; prev[nid] = sid; (buckets[nc] || (buckets[nc] = [])).push(nid); }
        }
      }
    }
    return null;
  }
  function updateGuide(ts) {
    arrowMat.opacity = 0.78 + 0.2 * Math.sin(ts / 220); glowMat.opacity = 0.22 + 0.18 * Math.sin(ts / 220);
    const g = guideTarget();
    if (!g || Math.hypot(g.x - pos.x, g.y - pos.y) < g.reach + 0.2) { arrows.visible = false; arrows.count = 0; guideKey = ''; return; }
    const sx = Math.round(pos.x), sy = Math.round(pos.y);
    const tk = g.x.toFixed(2) + ',' + g.y.toFixed(2) + ':' + S.devs.map(d => d.X + '.' + d.Y).join();
    // the route changes only when you reach another tile or the target or floor changes; the arrow redraws as you move
    if (tk + '@' + sx + ',' + sy !== routeKey) { routeKey = tk + '@' + sx + ',' + sy; guideRoute = gridRoute(sx, sy, g); }
    if (tk === guideKey && guideAt && Math.hypot(pos.x - guideAt[0], pos.y - guideAt[1]) < 0.03) return;
    guideKey = tk; guideAt = [pos.x, pos.y];
    const tiles = guideRoute;
    if (!tiles) { arrows.visible = false; return; }
    // corners only: the tiles where the direction changes
    const corners = [tiles[0]];
    for (let i = 1; i < tiles.length - 1; i++) {
      const p = tiles[i - 1], q = tiles[i], r = tiles[i + 1];
      if ((q[0] - p[0]) !== (r[0] - q[0]) || (q[1] - p[1]) !== (r[1] - q[1])) corners.push(q);
    }
    if (tiles.length > 1) corners.push(tiles[tiles.length - 1]);
    // start under you, on the grid line of your first leg, so the arrow slides along as you walk
    let pts;
    if (corners.length > 1) {
      const [c0, c1] = corners;
      pts = [c0[1] === c1[1] ? [pos.x, c0[1]] : [c0[0], pos.y]].concat(corners.slice(1));
    } else pts = [[pos.x, pos.y]];
    // the tip: the edge of the crate or device straight ahead of the last tile, or the port itself, reached by right angles
    const last = pts[pts.length - 1];
    let tip = [g.x, g.y];
    if (g.box) { const [x0, y0, x1, y1] = g.box; tip = [Math.max(x0, Math.min(x1, last[0])), Math.max(y0, Math.min(y1, last[1]))]; }
    if (Math.abs(tip[0] - last[0]) > 0.02 && Math.abs(tip[1] - last[1]) > 0.02) {
      // one more right angle: along the current direction first, then turn to the tip
      const prevPt = pts[pts.length - 2], horiz = prevPt ? Math.abs(prevPt[1] - last[1]) < 1e-6 : Math.abs(tip[0] - last[0]) > Math.abs(tip[1] - last[1]);
      pts.push(horiz ? [tip[0], last[1]] : [last[0], tip[1]]);
    }
    pts.push(tip);
    // trim: start just ahead of your feet, and stop a head's length short so the head's point lands on the tip
    const trim = (list, len, fromEnd) => {
      const p = fromEnd ? list.slice().reverse() : list.slice();
      while (p.length > 1 && len > 0) {
        const l = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
        if (l > len) { p[0] = [p[0][0] + (p[1][0] - p[0][0]) * len / l, p[0][1] + (p[1][1] - p[0][1]) * len / l]; len = 0; }
        else { len -= l; p.shift(); }
      }
      return fromEnd ? p.reverse() : p;
    };
    let line = trim(pts, 0.45, false);
    line = trim(line, 34 * 1.7 / T, true);
    const clean = [line[0]];
    for (const p of line) { const c = clean[clean.length - 1]; if (Math.hypot(p[0] - c[0], p[1] - c[1]) > 0.04) clean.push(p); }
    if (clean.length < 2) { arrows.visible = false; return; }
    arrowBody.geometry.dispose(); arrowGlow.geometry.dispose();
    arrowBody.geometry = arrowGeometry(clean, 34); arrowGlow.geometry = arrowGeometry(clean, 64, 34 * 1.7 + 14);
    arrows.visible = true; arrows.count = clean.length;
  }
  const pulse = new THREE.Mesh(new THREE.RingGeometry(88, 100, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2c21b, transparent: true, opacity: 0.9, depthWrite: false }));

  // ---- Test: Send or Print, with the message travelling along the cables
  // The message is a ball pushed through the inside of the cable: the cable swells round it as it goes. Over Wi-Fi,
  // where there is no cable, the ball flies through the air.
  let anim = null, wifiG = null, wifiKey = null; const litCables = new Set(), tubes = new Map(), drawn = new Map();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(24, 20, 14), new THREE.MeshStandardMaterial({ color: 0xfff3bf, emissive: 0xf2c21b, emissiveIntensity: 0.8 }));
  const RADIAL = 10;
  function tubeGeometry(c, pts) {
    const curve = new THREE.CatmullRomCurve3(pts), seg = anim?.cur?.c === c ? Math.min(600, pts.length * 8) : Math.min(300, pts.length * 3);   // finer where the ball is
    const g = new THREE.TubeGeometry(curve, seg, CABLE_R, RADIAL, false);
    if (anim?.cur?.c === c) {
      // swell the rings near the ball: each ring pushed out from the cable's centre line, most at the ball
      const pos = g.attributes.position, L = curve.getLength(), w = 48 / L, u = anim.cur.u, v = new THREE.Vector3();
      for (let i = 0; i <= seg; i++) {
        const ui = i / seg, k = 1 + 2.4 * Math.exp(-(((ui - u) / w) ** 2));
        if (k < 1.01) continue;
        const centre = curve.getPointAt(ui);
        for (let j = 0; j <= RADIAL; j++) {
          const idx = i * (RADIAL + 1) + j;
          v.fromBufferAttribute(pos, idx).sub(centre).multiplyScalar(k).add(centre);
          pos.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      g.computeVertexNormals();
    }
    return g;
  }
  function send(a, b) {
    if (!a || !b || anim) return;
    if (a === b) { toast('Choose two different devices.', 'hint'); return; }
    const r = route(a, b);
    if (!r) { S.lastTest = { a: a.id, b: b.id, ok: false }; toast('It did not get there. ' + why(a, b), 'bad'); afterChange(); return; }
    // one hop per pair of devices on the route: along a cable (forwards or backwards), or through the air
    const hops = [];
    for (let i = 0; i + 1 < r.length; i++) {
      const x = r[i], y = r[i + 1];
      const c = cables3.find(c => c.ends[0] && c.ends[1] && ((c.ends[0].dev === x.id && c.ends[1].dev === y.id) || (c.ends[1].dev === x.id && c.ends[0].dev === y.id)));
      if (c) hops.push({ c, forward: c.ends[0].dev === x.id, len: new THREE.CatmullRomCurve3(cablePoints(c)).getLength() });
      else {
        const [ax, ay] = centre(x), [bx, by] = centre(y);
        const air = new THREE.CatmullRomCurve3([new THREE.Vector3((ax + 0.5) * T, 140, (ay + 0.5) * T), new THREE.Vector3(((ax + bx) / 2 + 0.5) * T, 260, ((ay + by) / 2 + 0.5) * T), new THREE.Vector3((bx + 0.5) * T, 160, (by + 0.5) * T)]);
        hops.push({ air, len: air.getLength() });
      }
    }
    anim = { hops, total: hops.reduce((t, h) => t + h.len, 0), d: 0, a, b, cur: null };
    drawTest();
  }
  function stepAnim(dt) {
    if (!anim) return;
    anim.d += dt * 700;
    if (anim.d >= anim.total) {
      scene.remove(ball); const { a, b } = anim; anim = null; litCables.clear();
      S.lastTest = { a: a.id, b: b.id, ok: true };
      arrived(a, b);
      toast((b.kind === 'printer' ? 'Printed! ' : 'Message arrived! ') + why(a, b), 'good');
      drawCables(); afterChange(); return;
    }
    let d = anim.d, hop = anim.hops[0];
    for (hop of anim.hops) { if (d <= hop.len) break; d -= hop.len; }
    const f = Math.min(1, d / hop.len), was = anim.cur?.c;
    if (hop.c) {
      litCables.add(hop.c);
      anim.cur = { c: hop.c, u: hop.forward ? f : 1 - f };
      scene.remove(ball);
      for (const c of [was, hop.c]) { const m = c && tubes.get(c); if (m) { m.geometry.dispose(); m.geometry = tubeGeometry(c, cablePoints(c)); m.material = litCables.has(c) ? litMat : cableMat; const d = drawn.get(c); if (d) d.key = cableKey(c); } }
    } else {
      anim.cur = null;
      if (was) { const m = tubes.get(was); if (m) { m.geometry.dispose(); m.geometry = tubeGeometry(was, cablePoints(was)); const d = drawn.get(was); if (d) d.key = cableKey(was); } }
      scene.add(ball); ball.position.copy(hop.air.getPointAt(f));
    }
  }
  let testFrom = null, testTo = null, compose = null, fx = null;
  const pages = [];   // printed pages lying in a printer's tray: { until, done() }

  // ---- each screen has a queue: what is showing stays up for its time, then the next thing shows. A message being
  // sent owns the sender's screen (and, when it arrives, the receiver's) and waits until that screen is free.
  const queues = new Map();   // screen -> { cur: { until } | null, q: [{ st, secs }], shown }
  let clock = 0;
  const nowS = () => clock;
  function Q(scr) { let q = queues.get(scr); if (!q) queues.set(scr, q = { cur: null, q: [], shown: false }); return q; }
  function busy(scr) { const q = scr && queues.get(scr); return !!(q && q.cur && nowS() < q.cur.until); }
  function enqueue(scr, items) {
    const q = Q(scr);
    for (const [st, secs] of items) {
      const last = q.q[q.q.length - 1];
      if (last && last.st.top === st.top && last.st.text === st.text) continue;
      q.q.push({ st, secs });
    }
    while (q.q.length > 6) q.q.shift();   // a long backlog drops its oldest news
  }
  function hold(scr, st, secs) { if (!scr) return; const q = Q(scr); scr.show(st); q.cur = { until: nowS() + secs }; q.shown = true; }
  function owned(scr) { if (pk && (pk.a.k3.screen === scr || pk.b.k3.screen === scr)) return true; return fx && ((fx.a.k3.screen === scr && fx.stage !== 'wait') || (fx.b.k3.screen === scr && fx.stage === 'arrive' && fx.bOn)); }
  function runQueues() {
    const now = nowS();
    for (const [scr, q] of queues) {
      if (owned(scr)) continue;
      if (q.cur && now < q.cur.until) continue;
      q.cur = null;
      if (q.q.length) {
        const it = q.q.shift(), secs = q.q.length >= 2 ? Math.min(it.secs, 1.2) : it.secs;   // catch up when there is a backlog
        scr.show(it.st); q.cur = { until: now + secs }; q.shown = true;
      } else if (q.shown) { q.shown = false; scr.show(null); }
    }
    for (let i = pages.length - 1; i >= 0; i--) if (now > pages[i].until) { pages[i].done(); pages.splice(i, 1); }
  }

  // Send or Print asks for a short message first, then plays it on the screens
  function startMessage(a, b, text, item) {
    fx = { a, b, text, item: item || null, t: 0, stage: 'wait' };
    drawTest();
  }
  const ease = (t0, t1, t) => Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  function stepFx(dt) {
    if (!fx) return;
    const A = fx.a.k3.screen, B = fx.b.k3.screen, toName = fx.b.kind === 'printer' ? 'Printer' : fx.b.name;
    // your own message comes first: it waits for a pop-up already showing for at most 0.6 s
    if (fx.stage === 'wait') { fx.w = (fx.w || 0) + dt; if (busy(A) && fx.w < 0.6) return; if (A) Q(A).cur = null; fx.stage = 'type'; fx.t = 0; }
    if (fx.stage === 'arrive' && !fx.bOn) { fx.w2 = (fx.w2 || 0) + dt; if (busy(B) && fx.w2 < 0.6) return; if (B) Q(B).cur = null; fx.bOn = true; fx.t = 0; }
    fx.t += dt;
    const t = fx.t;
    if (fx.stage === 'type') {
      if (A) {
        if (fx.item) A.show({ top: 'To ' + toName, item: fx.item, itemAlpha: 1 - ease(1.2, 1.8, t), sub: (fx.item.kind === 'photo' ? 'Photo: ' : 'File: ') + fx.item.pic });
        else if (t < 1) A.show({ top: 'To ' + toName, text: fx.text.slice(0, Math.ceil(fx.text.length * t)), caret: true });
        else A.show({ top: 'To ' + toName, text: fx.text, textAlpha: 1 - ease(1, 1.3, t), env: t < 1.6 ? ease(1.3, 1.6, t) : 1 - ease(1.6, 1.9, t) });
      }
      if (t >= 1.9) {
        if (!route(fx.a, fx.b)) {
          const { a, b } = fx; fx = null;
          hold(A, { top: 'Not sent', text: b.kind === 'printer' ? 'No printer' : 'Not sent', mark: 'cross', sub: 'No connection to ' + toName }, 3);
          send(a, b); drawTest(); return;
        }
        fx.stage = 'travel'; if (A) A.show({ top: 'Sending...', env: 0.35, sub: 'Data on its way' });
        send(fx.a, fx.b);
      }
    } else if (fx.stage === 'arrive') {
      if (B) {
        const what = fx.item ? (fx.item.kind === 'photo' ? 'New photo' : 'New file') : 'New message';
        if (fx.item) B.show({ top: t < 0.7 ? what : 'From ' + fx.a.name, item: fx.item, itemAlpha: ease(0, 0.7, t), sub: (fx.item.kind === 'photo' ? 'Photo: ' : 'File: ') + fx.item.pic });
        else if (t < 1) B.show({ top: what, env: t < 0.4 ? ease(0, 0.4, t) : 1 - ease(0.7, 1, t) });
        else B.show({ top: 'From ' + fx.a.name, text: fx.text, textAlpha: ease(1, 1.4, t) });
      }
      if (fx.page) { const k = ease(0, 0.8, t); fx.page.position.z = fx.page.userData.z0 + 55 * k; fx.page.material.opacity = Math.min(1, k * 2); }
      if (t >= 1.4) {
        if (B) hold(B, fx.item ? { top: 'From ' + fx.a.name, item: fx.item, sub: (fx.item.kind === 'photo' ? 'Photo: ' : 'File: ') + fx.item.pic } : { top: 'From ' + fx.a.name, text: fx.text }, 4);
        if (fx.page) { const pg = fx.page, dv = fx.b; pages.push({ until: nowS() + 6, done() { dv.k3.group.remove(pg); pg.geometry.dispose(); pg.material.map.dispose(); pg.material.dispose(); } }); }
        fx = null; drawTest();
      }
    }
  }
  // ---------------- races (transmission modes, speeds)
  let race = null;
  const BYTE = [0, 1, 0, 0, 0, 0, 0, 1];   // the letter A
  function laneLabel(text, at, col) { const sp = tape(text, { bg: col || '#151515', size: 0.032 }); sp.position.copy(at); return sp; }
  function runRace() {
    if (race || !M.racePick) return;
    const g = new THREE.Group(); scene.add(g);
    race = { t: 0, g, items: [], lanes: [], end: 0 };
    for (const L of M.m.lanes) {
      const a = S.devs.find(d => d.name === L.a), b = S.devs.find(d => d.name === L.b);
      const [ax, ay] = centre(a), [bx, by] = centre(b), mid = new THREE.Vector3(((ax + bx) / 2 + 0.5) * T, 300, ((ay + by) / 2 + 0.5) * T);
      const lane = { L, a, b, finish: 0, mid };
      const c3 = cables3.find(c => c.ends[0] && c.ends[1] && ((c.ends[0].dev === a.id && c.ends[1].dev === b.id) || (c.ends[1].dev === a.id && c.ends[0].dev === b.id)));
      const bit = (v, curve, t0, dur, rev) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(v ? 15 : 12, 12, 8), new THREE.MeshBasicMaterial({ color: v ? 0xffd43b : 0xf8f9fa }));
        m.visible = false; g.add(m); race.items.push({ m, curve, t0, dur, rev, lift: 0 }); return t0 + dur;
      };
      if (c3 && ['serial', 'parallel', 'simplex', 'half', 'full'].includes(L.kind)) {
        const curves = wireCurves(c3), fwd = c3.ends[0].dev === a.id, D = 1.6;
        const sendSerial = (wire, t0, rev) => { let end = 0; BYTE.forEach((v, i) => { end = bit(v, curves[wire], t0 + i * 0.3, D, rev); }); return end; };
        if (L.kind === 'parallel') BYTE.forEach((v, i) => { lane.finish = Math.max(lane.finish, bit(v, curves[i], 0, D, !fwd)); });
        else if (L.kind === 'serial') lane.finish = sendSerial(0, 0, !fwd);
        else if (L.kind === 'simplex') { lane.finish = sendSerial(0, 0, !fwd); lane.blocked = true; }
        else if (L.kind === 'half') { const t1 = sendSerial(0, 0, !fwd); lane.finish = sendSerial(0, t1 + 0.3, fwd); lane.waitUntil = t1 + 0.3; }
        else { const t1 = sendSerial(0, 0, !fwd), t2 = sendSerial(1, 0, fwd); lane.finish = Math.max(t1, t2); }
      } else {
        // speeds: the same photo as 6 packets, over a cable, Wi-Fi or Bluetooth
        let curves = [];
        if (L.kind === 'ethernet' && c3) { const pts = cablePoints(c3); if (c3.ends[0].dev !== a.id) pts.reverse(); curves = [new THREE.CatmullRomCurve3(pts)]; }
        else {
          const stops = [a].concat(L.via ? [S.devs.find(d => d.name === L.via)] : []).concat([b]);
          for (let i = 0; i + 1 < stops.length; i++) {
            const [x0, y0] = centre(stops[i]), [x1, y1] = centre(stops[i + 1]);
            curves.push(new THREE.CatmullRomCurve3([new THREE.Vector3((x0 + 0.5) * T, 120, (y0 + 0.5) * T), new THREE.Vector3(((x0 + x1) / 2 + 0.5) * T, 240, ((y0 + y1) / 2 + 0.5) * T), new THREE.Vector3((x1 + 0.5) * T, 120, (y1 + 0.5) * T)]));
          }
        }
        const speed = { ethernet: 1500, wifi: 650, bluetooth: 220 }[L.kind], gap = { ethernet: 0.25, wifi: 0.45, bluetooth: 0.8 }[L.kind];
        const len = curves.reduce((t, c) => t + c.getLength(), 0);
        for (let n = 1; n <= 6; n++) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: envelopeTex(n), depthTest: false, transparent: true })); sp.scale.set(70, 52, 1); sp.renderOrder = 7; sp.visible = false; g.add(sp);
          const t0 = (n - 1) * gap, dur = len / speed;
          race.items.push({ m: sp, path: curves, len, t0, dur, rev: false, lift: 40 });
          lane.finish = Math.max(lane.finish, t0 + dur);
        }
      }
      if (lane.blocked) { const x = laneLabel('Cannot send this way', new THREE.Vector3((bx + 0.5) * T, 260, (by + 0.5) * T), '#c92a2a'); g.add(x); }
      if (lane.waitUntil) { lane.waitSprite = laneLabel('Waiting...', new THREE.Vector3((bx + 0.5) * T, 260, (by + 0.5) * T), '#e67700'); g.add(lane.waitSprite); }
      race.lanes.push(lane); race.end = Math.max(race.end, lane.finish);
    }
    log.note(M.m.title + ': predicted ' + M.racePick + '.');
    drawAll();
  }
  function stepRace(dt) {
    if (!race) return;
    race.t += dt;
    const t = race.t;
    for (const it of race.items) {
      const u = (t - it.t0) / it.dur;
      it.m.visible = u >= 0 && u <= 1;
      if (!it.m.visible) continue;
      const f = it.rev ? 1 - u : u;
      if (it.curve) it.m.position.copy(it.curve.getPointAt(f));
      else { let d = f * it.len, c = it.path[0]; for (c of it.path) { const l = c.getLength(); if (d <= l) break; d -= l; } it.m.position.copy(c.getPointAt(Math.min(1, d / c.getLength()))); }
      it.m.position.y += it.lift;
    }
    for (const lane of race.lanes) {
      if (lane.waitSprite && t >= lane.waitUntil) { race.g.remove(lane.waitSprite); lane.waitSprite = null; }
      if (!lane.shown && t >= lane.finish) { lane.shown = true; race.g.add(laneLabel(lane.L.label + ': ' + lane.finish.toFixed(1) + ' s', lane.mid, '#2b8a3e')); }
    }
    if (t >= race.end + 1.2) {
      const keep = race; race = null;
      // the labels stay up a little while; the bits go
      for (const it of keep.items) { keep.g.remove(it.m); it.m.geometry?.dispose?.(); it.m.material.map?.dispose?.(); it.m.material.dispose(); }
      pages.push({ until: nowS() + 8, done() { scene.remove(keep.g); keep.g.traverse(o => { if (o.material) { o.material.map?.dispose?.(); o.material.dispose(); } }); } });
      M.raced = true; M.raceTimes = keep.lanes.map(l => l.L.label + ': ' + l.finish.toFixed(1) + ' s').join(', ');
      log.add(M.m.title + ': prediction ' + (M.racePick === M.m.predict.options[0] ? 'right' : 'not right'), M.racePick === M.m.predict.options[0]);
      finishMission(); drawAll();
    }
  }
  // ---------------- packets
  let pk = null;
  const PK_SPEED = 1300;   // world units a second along the cables
  // the route a packet takes; with alt, a route that avoids the first link between two switches (a second path)
  function routeAvoiding(a, b, x, y) {
    const prev = {}, q = [a.id]; prev[a.id] = 0;
    while (q.length) {
      const n = q.shift(); if (n === b.id) break;
      if (n !== a.id && dev(n).kind !== 'switch' && dev(n).kind !== 'wifi') continue;
      links(n).forEach(m => { if ((n === x && m === y) || (n === y && m === x)) return; if (!(m in prev)) { prev[m] = n; q.push(m); } });
    }
    if (!(b.id in prev)) return null;
    const out = [b]; let at = b.id; while (at !== a.id) { at = prev[at]; out.unshift(dev(at)); }
    return out;
  }
  function hopsFor(r) {
    const hops = [];
    for (let i = 0; i + 1 < r.length; i++) {
      const x = r[i], y = r[i + 1];
      const c = cables3.find(c => c.ends[0] && c.ends[1] && ((c.ends[0].dev === x.id && c.ends[1].dev === y.id) || (c.ends[1].dev === x.id && c.ends[0].dev === y.id)));
      let curve;
      if (c) { const pts = cablePoints(c); if (c.ends[0].dev !== x.id) pts.reverse(); curve = new THREE.CatmullRomCurve3(pts); }
      else { const [ax, ay] = centre(x), [bx, by] = centre(y); curve = new THREE.CatmullRomCurve3([new THREE.Vector3((ax + 0.5) * T, 140, (ay + 0.5) * T), new THREE.Vector3(((ax + bx) / 2 + 0.5) * T, 260, ((ay + by) / 2 + 0.5) * T), new THREE.Vector3((bx + 0.5) * T, 160, (by + 0.5) * T)]); }
      hops.push({ curve, len: curve.getLength() });
    }
    return hops;
  }
  function envelopeTex(n) {
    const c = document.createElement('canvas'); c.width = 96; c.height = 72; const g = c.getContext('2d');
    g.fillStyle = '#fff8e1'; g.strokeStyle = '#8a6d1c'; g.lineWidth = 5; g.fillRect(6, 10, 84, 54); g.strokeRect(6, 10, 84, 54);
    g.beginPath(); g.moveTo(6, 10); g.lineTo(48, 42); g.lineTo(90, 10); g.stroke();
    g.fillStyle = '#1c7ed6'; g.beginPath(); g.arc(78, 56, 15, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '700 20px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 78, 57);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // canvas helpers for the two screens
  function envelope2d(g, x, y, ew, n, alpha) {
    if (alpha <= 0) return;
    const eh = ew * 0.66;
    g.save(); g.globalAlpha = alpha;
    g.fillStyle = '#fff8e1'; g.strokeStyle = '#8a6d1c'; g.lineWidth = 2.5;
    g.fillRect(x - ew / 2, y - eh / 2, ew, eh); g.strokeRect(x - ew / 2, y - eh / 2, ew, eh);
    g.beginPath(); g.moveTo(x - ew / 2, y - eh / 2); g.lineTo(x, y + eh * 0.08); g.lineTo(x + ew / 2, y - eh / 2); g.stroke();
    badge(g, x + ew / 2 - 2, y + eh / 2 - 2, n);
    g.restore();
  }
  function badge(g, x, y, n) {
    g.fillStyle = '#1c7ed6'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '700 11px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x, y + 0.5);
  }
  function header(g, w, text) { g.fillStyle = 'rgba(255,255,255,.92)'; g.fillRect(0, 0, w, 26); g.fillStyle = '#1c2533'; g.font = '700 14px "Segoe UI", Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, 8, 13); }
  // words laid out left to right, wrapping; returns the centre of each word's box
  function flow(g, words, w, top) {
    g.font = '700 15px "Segoe UI", Arial, sans-serif';
    const out = []; let x = 10, y = top;
    for (const wd of words) {
      const bw = g.measureText(wd).width + 14;
      if (x + bw > w - 8 && x > 10) { x = 10; y += 34; }
      out.push({ x: x + bw / 2, y, bw }); x += bw + 10;
    }
    return out;
  }
  function wordBox(g, wd, p, n, alpha) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = alpha;
    g.fillStyle = '#ffffff'; g.strokeStyle = '#74c0fc'; g.lineWidth = 2;
    g.fillRect(p.x - p.bw / 2, p.y - 12, p.bw, 24); g.strokeRect(p.x - p.bw / 2, p.y - 12, p.bw, 24);
    g.fillStyle = '#111'; g.font = '700 15px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(wd, p.x, p.y + 1);
    if (n) badge(g, p.x - p.bw / 2, p.y - 12, n);
    g.restore();
  }
  // the photo, drawn once, cut into 3 x 2 blocks
  function photoCanvas(pic) {
    const c = document.createElement('canvas'); c.width = 150; c.height = 100; const g = c.getContext('2d');
    g.save(); g.translate(75, 50); g.scale(150 / 120, 100 / 90); drawItem(g, 'photo', pic, 0, 0, 112); g.restore();
    return c;
  }
  function block(g, img, k, x, y, bw, bh, alpha, n) {
    if (alpha <= 0) return;
    const col = k % 3, row = Math.floor(k / 3);
    g.save(); g.globalAlpha = alpha;
    g.drawImage(img, col * 50, row * 50, 50, 50, x - bw / 2, y - bh / 2, bw, bh);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.strokeRect(x - bw / 2, y - bh / 2, bw, bh);
    if (n) badge(g, x - bw / 2 + 2, y - bh / 2 + 2, n);
    g.restore();
  }
  function startPackets(a, b, item) {
    const words = item.kind === 'words' ? item.text.split(/\s+/).filter(Boolean) : null;
    const count = words ? words.length : 6;
    const main = route(a, b);
    if (!main) {
      hold(a.k3.screen, { top: 'Not sent', text: 'Not sent', mark: 'cross', sub: 'No connection to ' + b.name }, 3);
      send(a, b); return;
    }
    // a second path: avoid the first link between two switches on the main route, if the network has another way
    let alt = null;
    for (let i = 1; i + 2 < main.length && !alt; i++) alt = routeAvoiding(a, b, main[i].id, main[i + 1].id);
    const parts = [];
    for (let n = 1; n <= count; n++) {
      const r = alt && n % 2 === 0 ? alt : main, hops = hopsFor(r), len = hops.reduce((t, h) => t + h.len, 0);
      parts.push({ n, word: words ? words[n - 1] : null, hops, len, leave: 0.9 + (n - 1) * 0.6, arrive: null, sprite: null, via: r.map(d => d.name) });
    }
    parts.forEach(p => { p.arriveAt = p.leave + p.len / PK_SPEED; });
    pk = { a, b, kind: item.kind, pic: item.pic, words, parts, t: 0, img: item.kind === 'photo' ? photoCanvas(item.pic) : null, arrivals: [], g: new THREE.Group() };
    scene.add(pk.g);
    drawTest();
  }
  function stopPackets() { if (!pk) return; scene.remove(pk.g); pk.g.traverse(o => { if (o.material) { o.material.map?.dispose?.(); o.material.dispose(); } }); pk = null; }
  function stepPackets(dt) {
    if (!pk) return;
    pk.t += dt;
    const t = pk.t, P = pk.parts, A = pk.a.k3.screen, B = pk.b.k3.screen, N = P.length;
    // ---- in 3D: each packet travels its path along the cables, one after another
    for (const p of P) {
      if (t < p.leave || p.arrive != null) continue;
      if (!p.sprite) { p.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: envelopeTex(p.n), depthTest: false, transparent: true })); p.sprite.scale.set(84, 63, 1); p.sprite.renderOrder = 7; pk.g.add(p.sprite); }
      let d = (t - p.leave) * PK_SPEED;
      if (d >= p.len) { p.arrive = t; pk.arrivals.push(p); pk.g.remove(p.sprite); p.sprite.material.map.dispose(); p.sprite.material.dispose(); p.sprite = null; continue; }
      let h = p.hops[0]; for (h of p.hops) { if (d <= h.len) break; d -= h.len; }
      p.sprite.position.copy(h.curve.getPointAt(Math.min(1, d / h.len))).add(new THREE.Vector3(0, 45, 0));
    }
    // ---- the sender's screen: the data splits up, each part goes into a numbered envelope and flies off the side
    const lastLeave = P[N - 1].leave;
    if (A) A.paint((g, w, h) => {
      header(g, w, t < lastLeave + 0.6 ? 'To ' + pk.b.name + ': ' + (t < 0.6 ? 'splitting into packets' : 'sending packet ' + Math.min(N, P.filter(p => t >= p.leave).length + (t < P[0].leave ? 0 : 0)) + ' of ' + N) : 'To ' + pk.b.name + ': ' + N + ' packets sent');
      const split = Math.min(1, t / 0.6);
      if (pk.words) {
        const pos = flow(g, pk.words, w, 52);
        P.forEach((p, i) => {
          const k1 = Math.max(0, Math.min(1, (t - (p.leave - 0.4)) / 0.4)), k2 = Math.max(0, Math.min(1, (t - p.leave) / 0.6));
          wordBox(g, p.word, pos[i], split > 0.5 ? p.n : 0, 1 - k1);
          envelope2d(g, pos[i].x + k2 * w * 0.7, pos[i].y, 34, p.n, k1 * (1 - k2));
        });
      } else {
        const gap = 6 * split, bw = 46, bh = 46, x0 = w / 2 - 1.5 * bw - gap, y0 = 40;
        P.forEach((p, i) => {
          const col = i % 3, row = Math.floor(i / 3), cx = x0 + col * (bw + gap) + bw / 2, cy = y0 + row * (bh + gap) + bh / 2;
          const k1 = Math.max(0, Math.min(1, (t - (p.leave - 0.4)) / 0.4)), k2 = Math.max(0, Math.min(1, (t - p.leave) / 0.6));
          block(g, pk.img, i, cx, cy, bw, bh, 1 - k1, split > 0.5 ? p.n : 0);
          envelope2d(g, cx + k2 * w * 0.7, cy, 36, p.n, k1 * (1 - k2));
        });
      }
    });
    // ---- the receiver's screen: packets arrive (in any order), come out of their envelopes, then are sorted by number
    const allIn = pk.arrivals.length === N, lastIn = allIn ? Math.max(...P.map(p => p.arrive)) : 1e9, sortAt = lastIn + 0.9, doneAt = sortAt + 1.2;
    if (B && pk.arrivals.length) B.paint((g, w, h) => {
      const k = Math.max(0, Math.min(1, (t - sortAt) / 1.0)), e = k * k * (3 - 2 * k);
      header(g, w, t < sortAt ? 'From ' + pk.a.name + ': ' + pk.arrivals.length + ' of ' + N + ' packets' : 'Putting packets in order by number');
      if (pk.words) {
        const byArrival = flow(g, pk.arrivals.map(p => p.word), w, 52), byNumber = flow(g, pk.words, w, 52);
        pk.arrivals.forEach((p, i) => {
          const u = t - p.arrive, from = byArrival[i], to = byNumber[p.n - 1];
          const at = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, bw: from.bw };
          envelope2d(g, at.x, at.y, 34, p.n, 1 - Math.max(0, Math.min(1, (u - 0.35) / 0.35)));
          wordBox(g, p.word, at, p.n, Math.max(0, Math.min(1, (u - 0.35) / 0.35)));
        });
      } else {
        const bw = 40, bh = 40, gx = 14, gy = 40;
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([4, 3]); g.strokeRect(gx, gy, bw * 3, bh * 2); g.setLineDash([]);
        pk.arrivals.forEach((p, i) => {
          const u = t - p.arrive, sx = w - 74 + (i % 2) * 36, sy = 46 + Math.floor(i / 2) * 36;
          const tx = gx + ((p.n - 1) % 3) * bw + bw / 2, ty = gy + Math.floor((p.n - 1) / 3) * bh + bh / 2;
          const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e, s = 30 + (bw - 30) * e;
          envelope2d(g, sx, sy, 30, p.n, 1 - Math.max(0, Math.min(1, (u - 0.35) / 0.35)) - e);
          block(g, pk.img, p.n - 1, x, y, s, s, Math.max(0, Math.min(1, (u - 0.35) / 0.35)), k < 1 ? p.n : 0);
        });
      }
    });
    if (t >= doneAt) {
      const { a, b, kind, words, pic } = pk;
      const order = pk.arrivals.map(p => p.n).join(', ');
      stopPackets();
      hold(a.k3.screen, { top: 'To ' + b.name, text: words ? words.join(' ') : null, item: words ? null : { kind: 'photo', pic }, mark: 'tick', sub: N + ' packets sent' }, 4);
      hold(b.k3.screen, words ? { top: 'From ' + a.name, text: words.join(' '), mark: 'tick', sub: 'Packets arrived: ' + order } : { top: 'From ' + a.name, item: { kind: 'photo', pic }, mark: 'tick', sub: 'Packets arrived: ' + order }, 5);
      S.lastTest = { a: a.id, b: b.id, ok: true, kind: words ? 'words' : 'photoPackets' };
      toast('Message arrived! ' + N + ' packets arrived in the order ' + order + ', then were put back in order.', 'good');
      afterChange();
    }
  }
  // What each laptop and tablet knows about its connection, shown on its taskbar; a change joins its screen's queue.
  function netState(d) {
    if (d.kind === 'tablet' && btPartner(d)) {
      const o = btPartner(d);
      return o && btOn(d) ? { key: 'bt:' + o.id, text: 'Bluetooth: connected to ' + o.name, ok: true, to: o.name } : { key: 'btoff', text: 'Bluetooth: out of range', ok: false };
    }
    if (d.kind === 'tablet') {
      const w = aps(d);
      if (!w.length) return { key: 'none', text: 'Wi-Fi: no signal', ok: false };
      const on = w.find(x => cablesOf(x.id).length);
      return on ? { key: 'wifi:' + on.id, text: 'Wi-Fi: connected to ' + on.name, ok: true, to: on.name } : { key: 'nonet', text: 'Wi-Fi: signal, but no network', ok: false };
    }
    const full = S.cables.find(c => c.a === d.id || c.b === d.id);
    if (full) { const o = dev(full.a === d.id ? full.b : full.a); return { key: 'eth:' + o.id, text: 'Ethernet: connected to ' + o.name, ok: true, to: o.name }; }
    const loose = cables3.some(c => (c.ends[0] && c.ends[0].dev === d.id && !c.ends[1]) || (c.ends[1] && c.ends[1].dev === d.id && !c.ends[0]));
    return loose ? { key: 'loose', text: 'Ethernet: cable in, other end loose', ok: false } : { key: 'off', text: 'Ethernet: not connected', ok: false };
  }
  function updateScreens(quiet) {
    for (const d of S.devs) {
      const scr = d.k3 && d.k3.screen; if (!scr) continue;
      if (carried(d) && d.kind === 'tablet') { /* a tablet in your hand still updates */ }
      const n = netState(d);
      if (n.key === d.netKey) continue;
      const was = d.netKey; d.netKey = n.key; scr.setStatus(n.text, n.ok);
      if (quiet || was == null) continue;
      if (d.kind === 'tablet') {
        if (n.ok) enqueue(scr, [[{ top: 'Wi-Fi', text: 'Connected', mark: 'tick', sub: 'Joined by Wi-Fi: no cable' }, 1.2], [{ top: 'Wi-Fi', text: 'To ' + n.to, mark: 'tick', sub: 'Inside its range' }, 2]]);
        else if (n.key === 'none') enqueue(scr, [[{ top: 'Wi-Fi', text: 'No signal', mark: 'cross', sub: 'Out of Wi-Fi range' }, 2.2]]);
        else enqueue(scr, [[{ top: 'Wi-Fi', text: 'No network', mark: 'cross', sub: 'The Wi-Fi point has no cable' }, 2.2]]);
      } else if (n.ok) enqueue(scr, [[{ top: 'Ethernet', text: 'Connected', mark: 'tick', sub: 'Both ends plugged in' }, 1.2], [{ top: 'Ethernet', text: 'To ' + n.to, mark: 'tick', sub: 'Connected to ' + n.to }, 2]]);
      else if (n.key === 'loose') enqueue(scr, [[{ top: 'Ethernet', text: 'Cable in', sub: 'In the RJ45 port. Other end?' }, 2.2]]);
      else enqueue(scr, [[{ top: 'Ethernet', text: 'Unplugged', mark: 'cross', sub: 'No Ethernet cable' }, 2.2]]);
    }
    runQueues();
  }
  // ---- an outline round whatever an empty hand would grab, so you know before you press
  const outlineG = new THREE.Group();
  const outMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  const outLine = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  let plugGlowMat = null;
  let outlineKey = '';
  const HEIGHT = { laptop: 250, printer: 175, 'switch': 100, wifi: 230 };
  function frameAround(cx, cz, w, d, h) {
    // a thick frame on the floor and the edges of a box round the thing
    const g = new THREE.Group(), th = 10;
    for (const [x, z, sx, sz] of [[0, -d / 2, w + th, th], [0, d / 2, w + th, th], [-w / 2, 0, th, d], [w / 2, 0, th, d]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 3, sz), outMat); m.position.set(x, 3, z); m.userData.own = true; g.add(m);
    }
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), outLine); box.position.y = h / 2; box.userData.own = true; g.add(box);
    g.position.set(cx, 0, cz);
    return g;
  }
  function updateOutline(ts) {
    const targets = [0, 1].map(grabTarget).filter(Boolean);
    const key = targets.map(t => t.kind + ':' + (t.d ? t.d.id + '@' + (t.d.kind === 'tablet' ? t.d.tx.toFixed(1) + ',' + t.d.ty.toFixed(1) : t.d.X + ',' + t.d.Y) : t.crate ? t.crate.kind : t.c.id + '.' + t.j + '@' + t.c.P[2 * t.j].toFixed(1) + ',' + t.c.P[2 * t.j + 1].toFixed(1))).join('|');
    outMat.opacity = outLine.opacity = 0.6 + 0.35 * Math.sin(ts / 170);
    if (key === outlineKey) return;
    outlineKey = key;
    for (const o of outlineG.children.slice()) { outlineG.remove(o); o.traverse(x => { if (x.userData.own) x.geometry.dispose(); }); }
    const seen = new Set();
    for (const t of targets) {
      const k = t.d ? 'd' + t.d.id : t.crate ? 'k' + t.crate.kind : 'c' + t.c.id + '.' + t.j;
      if (seen.has(k)) continue; seen.add(k);
      if (t.kind === 'device') outlineG.add(frameAround(t.d.X * T + t.d.w * T / 2, t.d.Y * T + t.d.h * T / 2, t.d.w * T - 6, t.d.h * T - 6, HEIGHT[t.d.kind] || 150));
      else if (t.kind === 'tablet') outlineG.add(frameAround((t.d.tx + 0.5) * T, (t.d.ty + 0.5) * T, 126, 96, 24));
      else if (t.kind === 'crate') outlineG.add(frameAround((t.crate.x + t.crate.w / 2) * T, (t.crate.y + t.crate.h / 2) * T, t.crate.w * T - 4, t.crate.h * T - 4, 120));
      else {
        // a cable: a white glow on the plug or the bit of cable you would take
        const e = t.j === 0 ? 0 : t.j === t.c.n ? 1 : -1, pts = cablePoints(t.c), p = pts[t.j];
        plugGlowMat = plugGlowMat || new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const sp = new THREE.Sprite(plugGlowMat); sp.position.copy(p); sp.scale.setScalar(e >= 0 ? 110 : 80); sp.renderOrder = 5;
        outlineG.add(sp);
      }
    }
  }
  // ---- while you carry a cable plug, the free ports it could go into glow
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,236,140,1)'); gr.addColorStop(0.45, 'rgba(255,212,59,.75)'); gr.addColorStop(1, 'rgba(255,212,59,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glowMatP = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const portGlow = new THREE.Group(), glowPool = [];
  const ringTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 26; g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const markMat = new THREE.SpriteMaterial({ map: ringTex, color: 0xffffff, transparent: true, depthWrite: false, depthTest: false });
  const mark = new THREE.Sprite(markMat); mark.renderOrder = 6; mark.visible = false; portGlow.add(mark);
  function updatePortGlow(ts) {
    // where a plug in your hand would go if you let go now; otherwise the plug or port the tutorial step points at
    mark.visible = false;
    const heldI = hands.findIndex(h => h.cable && (h.joint === 0 || h.joint === h.cable.n));
    let at = null;
    if (heldI >= 0) {
      const ch = plugChoice(...handPos(heldI));
      if (ch && !socketTaken(ch.d, ch.s)) at = socketWorld(ch.d, ch.s).pos;
    }
    if (!at) {
      const g = guideTarget();
      if (g && g.sock) at = socketWorld(g.sock.d, g.sock.i).pos;
      else if (g && g.plug) at = cablePoints(g.plug.c)[g.plug.j];
    }
    if (at) { mark.visible = true; mark.position.copy(at); const k = 70 + 14 * Math.sin(ts / 140); mark.scale.set(k, k, 1); }
    const held = hands.find(h => h.cable && (h.joint === 0 || h.joint === h.cable.n));
    let n = 0;
    if (held) {
      const c = held.cable, other = c.ends[held.joint === 0 ? 1 : 0];
      for (const d of S.devs) {
        if (carried(d) || !d.k3 || (other && other.dev === d.id)) continue;
        for (let i = 0; i < d.k3.sockets.length; i++) {
          if (socketTaken(d, i)) continue;
          let sp = glowPool[n];
          if (!sp) { sp = new THREE.Sprite(glowMatP); sp.renderOrder = 4; glowPool.push(sp); portGlow.add(sp); }
          const w = socketWorld(d, i); sp.position.copy(w.pos).addScaledVector(w.dir, -6); sp.visible = true; n++;
        }
      }
    }
    for (let i = n; i < glowPool.length; i++) glowPool[i].visible = false;
    const k = 70 + 18 * Math.sin(ts / 160);
    for (let i = 0; i < n; i++) glowPool[i].scale.set(k, k, 1);
  }
  function arrived(a, b) {
    if (!fx || fx.a !== a || fx.b !== b) return;
    S.lastTest.kind = fx.item ? fx.item.kind : 'message';
    if (a.k3.screen) hold(a.k3.screen, { top: 'To ' + (b.kind === 'printer' ? 'Printer' : b.name), text: fx.item ? null : fx.text, item: fx.item, mark: 'tick', sub: b.kind === 'printer' ? 'Printed' : 'Delivered' }, 4);
    fx.stage = 'arrive'; fx.t = 0; fx.bOn = false;
    if (b.kind === 'printer') {
      // a page slides out of the printer's tray with the message on it
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(120, 84).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: pageTexture(fx.text, a.name, fx.item), transparent: true, opacity: 0, side: THREE.DoubleSide }));
      pg.position.set(0, 112, b.h * T / 2 - 60); pg.userData.z0 = pg.position.z; b.k3.group.add(pg); fx.page = pg;
    }
  }
  function drawTest() {
    const t = $('testBar'); t.innerHTML = ''; t.hidden = M.m.type === 'race';
    if (M.m.type === 'race') return;
    t.classList.toggle('pulse', M.show === 'test');
    if (compose && (!S.devs.includes(compose.a) || !S.devs.includes(compose.b) || M.phase === 'predict')) compose = null;
    if (compose) {
      const { a, b } = compose, verb = b.kind === 'printer' ? 'Print' : 'Send';
      compose.kind = compose.kind || 'message';
      const tabs = el('div', { class: 'kinds', role: 'group', 'aria-label': 'What to send' });
      (M.m.packets ? [['message', 'Message'], ['photo', 'Photo']] : [['message', 'Message'], ['photo', 'Photo'], ['file', 'File']]).forEach(([k, label]) => {
        const kb = el('button', { type: 'button', 'aria-pressed': String(compose.kind === k) }, label);
        kb.addEventListener('click', () => { compose.kind = k; drawTest(); });
        tabs.appendChild(kb);
      });
      const head = el('b', {}, a.name + ' to ' + (b.kind === 'printer' ? 'the Printer' : b.name));
      const cancel = btn('Cancel', '', () => { compose = null; drawTest(); });
      if (compose.kind !== 'message') {
        const picks = compose.kind === 'photo' ? ['Cat', 'Beach', 'Class'] : ['Story', 'Homework', 'Poster'], k = compose.kind;
        const row = el('div', { class: 'picks' });
        picks.forEach(p => row.appendChild(btn((k === 'photo' ? p + ' photo' : p), 'go', () => { compose = null; if (M.m.packets && k === 'photo') startPackets(a, b, { kind: 'photo', pic: p }); else startMessage(a, b, k === 'photo' ? p + ' photo' : p, { kind: k, pic: p }); })));
        t.append(head, tabs, row, cancel);
        return;
      }
      const long = !!M.m.packets;
      const box = el('input', { id: 'nbMsg', type: 'text', maxlength: long ? '48' : '10', autocomplete: 'off', spellcheck: 'false', placeholder: long ? '3 to 6 words' : '5 to 10 letters', 'aria-label': 'Message' });
      if (long) box.style.width = '220px';
      const submit = () => {
        const v = box.value.trim().replace(/\s+/g, ' ');
        if (long) {
          const ws = v.split(' ').filter(Boolean);
          if (ws.length < 3 || ws.length > 6 || ws.some(x => x.length > 10)) { toast('Type 3 to 6 words, each up to 10 letters.', 'hint'); box.focus(); return; }
          compose = null; box.blur(); startPackets(a, b, { kind: 'words', text: v }); return;
        }
        if (v.length < 5 || v.length > 10) { toast('Type a message of 5 to 10 letters.', 'hint'); box.focus(); return; }
        compose = null; box.blur(); startMessage(a, b, v);
      };
      box.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') { compose = null; drawTest(); } });
      t.append(head, tabs, box, btn(verb, 'go', submit), cancel);
      setTimeout(() => box.focus(), 0);
      return;
    }
    const list = ends();
    if (list.length < 2) { t.appendChild(el('span', { class: 'small' }, 'Test: put two devices down, then send a message between them.')); return; }
    const from = el('select', { id: 'nbFrom', 'aria-label': 'From' }), to = el('select', { id: 'nbTo', 'aria-label': 'To' });
    list.forEach(d => { if (isClient(d)) from.appendChild(el('option', { value: d.id }, d.name)); to.appendChild(el('option', { value: d.id }, d.name)); });
    if (testFrom && list.some(d => String(d.id) === testFrom && isClient(d))) from.value = testFrom;
    if (testTo && list.some(d => String(d.id) === testTo)) to.value = testTo;
    else if (to.options.length > 1 && to.value === from.value) to.selectedIndex = 1;
    const go = btn('', 'go', () => {
      const a = dev(Number(from.value)), b = dev(Number(to.value));
      if (!a || !b || anim || fx || pk) return;
      if (a === b) { toast('Choose two different devices.', 'hint'); return; }
      compose = { a, b }; drawTest();
    });
    const label = () => { const b = dev(Number(to.value)); go.textContent = b && b.kind === 'printer' ? 'Print' : 'Send'; };
    from.addEventListener('change', () => { testFrom = from.value; from.blur(); });
    to.addEventListener('change', () => { testTo = to.value; label(); to.blur(); });
    label();
    go.disabled = !!anim || !!fx || !!pk || M.phase === 'predict';
    t.append(el('b', {}, 'Test'), el('span', {}, 'From'), from, el('span', {}, 'to'), to, go);
  }

  // ---- missions
  let M = null, missionAt = 0, have = 0;
  const openSecs = new Set();
  const done = load('all:done', {}) || {};   // the 2D app's key: the same eleven missions in the same order
  function saveDone() { save('all:done', done); }

  function start(i) {
    missionAt = i;
    openSecs.add(MISSIONS[i].group);
    const m = MISSIONS[i];
    M = { result: null, tested: false, sig: '', racePick: null, raced: false, m, step: 0, phase: m.type === 'fix' ? 'predict' : m.before ? 'ask' : 'build', picks: {}, show: null, walked: false, latched: [], afterOk: !m.after };
    for (const h of hands) { h.cable = null; h.joint = -1; h.dev = null; }
    anim = null; fx = null; stopPackets(); if (race) { scene.remove(race.g); race = null; } compose = null; queues.clear(); for (const p of pages) p.done(); pages.length = 0; litCables.clear(); cables3 = [];
    m.setup();
    S.ringOrder = null;
    buildWorld();
    for (const d of S.devs) realise(d);
    // the starting cables, laid straight between free sockets
    const want = S.cables.slice(); S.cables = [];
    for (const w of want) {
      const a = dev(w.a), b = dev(w.b);
      const sa = a.k3.sockets.findIndex((_, k) => !socketTaken(a, k)), sb = b.k3.sockets.findIndex((_, k) => !socketTaken(b, k));
      if (sa < 0 || sb < 0) continue;
      const pa = plugPin(a, sa), pb = plugPin(b, sb), D0 = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]), len = w.type || M.m.type === 'race' ? D0 * 1.04 + 0.6 : D0 * 1.25 + 2;   // race cables are tight
      const c = newCable([pa, pb], len); c.ends = [{ dev: a.id, sock: sa }, { dev: b.id, sock: sb }]; c.type = w.type || null;
    }
    sync();
    updateScreens(true);
    if (S.startCables != null) S.startCables = S.cables.length;
    pos.x = 16; pos.y = DESK_BOTTOM + 1.2; pos.face = Math.PI;
    toast('');
    updateShow();
    view.jump(pos.x, pos.y);
    drawAll();
  }
  function updateShow() { const st = M.m.steps && M.m.steps[M.step]; M.show = M.phase === 'build' && st ? st.show : null; }
  function afterChange() {
    sync();
    const sig = S.cables.map(c => c.a + '-' + c.b).sort().join() + '|' + S.devs.map(d => d.id + '@' + Math.round(d.x) + ',' + Math.round(d.y)).join();
    if (sig !== M.sig) { M.sig = sig; M.tested = false; }
    // only a new test counts (every test makes a new lastTest), so testing, then changing it, is not "tested"
    if (S.lastTest && S.lastTest !== M.seenTest) { M.seenTest = S.lastTest; if (S.lastTest.ok) M.tested = true; }
    if (M.m.type === 'tutorial' && M.phase === 'build') {
      const before = M.step;
      // a one-off event (a test, a refused plug) proves the steps before it, so they stay done after it
      const st = M.m.steps; let i = M.latched.length ? M.latched.lastIndexOf(true) + 1 : 0;
      for (; i < st.length; i++) {
        if (st[i].event) {
          if (M.latched[i]) continue;
          if (i === before && st[i].done()) { M.latched[i] = true; S.lastTest = null; S.refused = false; continue; }
          break;
        }
        if (!st[i].done()) break;
      }
      // events count only when they happen at their own step
      if (i !== before) { S.lastTest = null; S.refused = false; }
      M.step = i;
      if (M.step >= st.length) finishMission();
      else if (M.step !== before) updateShow();
    }
    drawAll();
  }
  function finishMission() {
    M.phase = 'done'; M.show = null;
    if (!done[missionAt]) { done[missionAt] = true; saveDone(); }
    log.note('Mission ' + (missionAt + 1) + ' (' + M.m.title + ') complete' + (M.walked ? ', used Walk me through it' : '') + '.');
    if (MISSIONS.every((x, i) => done[i])) log.finish();
  }
  function checkMission() {
    if (hands.some(h => h.dev)) { toast('Put down what you are carrying first.', 'hint'); return; }
    if (anim || fx) return;
    const probs = M.m.check();
    M.phase = 'checked'; M.probs = probs;
    log.add(M.m.title + ': ' + (probs.length ? probs.length + ' problem' + (probs.length > 1 ? 's' : '') : 'everything works'), !probs.length);
    if (!probs.length && M.m.breakAfter) { if (M.m.onCheck) M.m.onCheck(); topoBreak(); return; }
    if (!probs.length) {
      have++;
      if (have >= (M.m.rounds || 1)) { have = 0; finishMission(); toast('Everything works, with no mistakes.', 'good'); }
      else toast('Everything works, with no mistakes. ' + have + ' of ' + M.m.rounds + ' clean networks.', 'good');
    } else { have = 0; toast('Not this time: this network does not count.', 'bad'); }
    drawAll();
  }
  function topoBreak() {
    // mend the last break, then break a different cable
    if (M.broken) { M.broken.broken = false; sync(); }
    const pool = M.m.breakPick().map(c => c.c3).filter(c => c && c !== M.broken);
    const c = pick(pool.length ? pool : M.m.breakPick().map(x => x.c3)); c.broken = true; M.broken = c;
    sync();
    // three jobs: one that crosses the break if there is one, one that works, and one more
    const pairs = shuffle(allPairs()), across = pairs.filter(p => !route(p[0], p[1])), fine = pairs.filter(p => route(p[0], p[1]));
    const direct = pairs.find(p => (p[0].id === c.ends[0].dev && p[1].id === c.ends[1].dev) || (p[1].id === c.ends[0].dev && p[0].id === c.ends[1].dev));
    let jobs = [];
    if (across.length) jobs.push(across[0]);
    if (direct && !jobs.includes(direct)) jobs.push(direct);
    if (fine.length && !jobs.includes(fine[0])) jobs.push(fine[0]);
    jobs = jobs.concat(pairs.filter(p => !jobs.includes(p))).slice(0, 3);
    S.jobs = shuffle(jobs);
    M.phase = 'predict'; M.picks = {}; M.predicted = false; M.predAns = null; M.probs = null;
    toast('Crack! A cable broke (it is red). Predict which jobs still work.', 'bad');
    drawAll();
  }
  const starsHtml = n => '<span class="stars" aria-label="' + n + ' of 3 stars">' + [0, 1, 2].map(i => '<svg viewBox="0 0 24 24" class="' + (i < n ? 'on' : '') + '"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg>').join('') + '</span>';
  function handOver() {
    if (hands.some(h => h.dev)) { toast('Put down what you are carrying first.', 'hint'); return; }
    if (anim || fx || pk) return;
    const m = M.m, res = m.reqs.map(r => ({ text: r.text, ok: !!r.test() }));
    const met = res.every(r => r.ok), used = S.cables.length - (S.startCables || 0);
    const few = met && used <= m.minCables, tested = met && !!M.tested;
    const n = met ? 1 + (few ? 1 : 0) + (tested ? 1 : 0) : 0;
    M.result = { res, met, used, few, tested, n };
    M.phase = 'checked';
    log.add(m.title + ': ' + res.filter(r => r.ok).length + ' of ' + res.length + ' requirements, ' + n + ' stars', met);
    if (met) {
      const best = load('all:stars', {}) || {};
      if (!(best[missionAt] >= n)) { best[missionAt] = n; save('all:stars', best); }
      finishMission(); M.phase = 'done'; toast(n + (n === 1 ? ' star' : ' stars') + '. The client is happy.', 'good');
    } else toast('The client says no: some requirements are not met.', 'bad');
    drawAll();
  }
  function checkPredict() {
    if (S.jobs.some((p, i) => !M.picks[i])) { toast('Choose Yes or No for every job first.', 'hint'); return; }
    M.predAns = S.jobs.map(p => !!route(p[0], p[1])); M.predWhy = S.jobs.map(p => why(p[0], p[1]));
    const wrong = S.jobs.filter((p, i) => (M.picks[i] === 'Yes') !== M.predAns[i]).length;
    M.predicted = true;
    log.add(M.m.title + ' predictions: ' + (wrong ? wrong + ' wrong' : 'all right'), !wrong);
    if (wrong) { have = 0; M.phase = 'checked'; M.probs = null; toast(M.m.breakAfter ? 'Not this time. Read why for each red job, then try another break.' : 'Not this time: this network does not count. Read why for each red job.', 'bad'); }
    else if (M.m.breakAfter) { finishMission(); toast('All three predictions right.', 'good'); }
    else { M.phase = 'build'; toast('All three predictions right. Now fix it.', 'good'); }
    drawAll();
  }

  // ---- the mission sheet (right) and Walk me through it
  function drawPanel() {
    const t = $('mission'), m = M.m;
    t.hidden = false; t.innerHTML = '';
    // the missions in collapsible sections; in each section a mission opens when the one before it is done
    const nav = el('div', { class: 'sections', role: 'navigation', 'aria-label': 'Missions' });
    SECTIONS.forEach(sec => {
      const list = MISSIONS.map((x, i) => [x, i]).filter(([x]) => x.group === sec);
      if (!list.length) return;
      const det = el('details', { class: 'sec' + (sec === m.group ? ' current' : '') });
      if (openSecs.has(sec)) det.open = true;
      det.appendChild(el('summary', {}, '<span>' + sec + '</span><span class="count">' + list.filter(([, i]) => done[i]).length + ' of ' + list.length + '</span>'));
      det.addEventListener('toggle', () => { if (det.open) openSecs.add(sec); else openSecs.delete(sec); });
      const items = el('div', { class: 'sec-list' });
      list.forEach(([x, i], k) => {
        const best = x.type === 'client' ? (load('all:stars', {}) || {})[i] : null;
        const b = el('button', { type: 'button', 'aria-current': String(i === missionAt) }, (done[i] ? '<span class="tick">&#10003;</span> ' : '<span class="num">' + (k + 1) + '</span> ') + '<span class="t">' + x.title + '</span>' + (best != null ? starsHtml(best) : ''));
        b.disabled = !(k === 0 || done[list[k - 1][1]] || done[i]);
        b.addEventListener('click', () => { have = 0; start(i); });
        items.appendChild(b);
      });
      det.appendChild(items); nav.appendChild(det);
    });
    t.appendChild(nav);
    const inSec = MISSIONS.filter(x => x.group === m.group);
    t.appendChild(el('div', { class: 'head' }, '<span>' + m.group + '</span><span>Mission ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length + '</span>'));
    t.appendChild(el('h2', {}, m.title));
    if (done[missionAt] && M.phase !== 'done') t.appendChild(el('p', { class: 'note' }, 'Done before. Play it again for practice.'));
    t.appendChild(el('p', {}, m.intro));
    if (m.type === 'tutorial') {
      const ol = el('ol', { class: 'steps' });
      m.steps.forEach((s, i) => ol.appendChild(el('li', { class: i < M.step || M.phase === 'done' ? 'done' : i === M.step ? 'now' : 'later' }, '<span>' + s.text + '</span>')));
      t.appendChild(ol);
    } else if (m.type === 'challenge') {
      t.appendChild(el('ul', { class: 'goals' }, m.goals.map(g => '<li>' + g + '</li>').join('')));
      if (m.maxNew != null) t.appendChild(el('p', {}, '<b>New cables used: ' + (S.cables.length - (S.startCables || 0)) + '</b> (at most ' + m.maxNew + ').'));
      t.appendChild(el('p', { class: 'note' }, 'One check only. A mistake means this build does not count.'));
    } else {
      t.appendChild(el('p', {}, M.phase === 'predict' ? '<b>1. Predict.</b> Look at the cables. Will each job work? You cannot change the network yet.' : M.phase === 'build' ? '<b>2. Fix it.</b> ' + (m.fixText || 'Fix the cables so <b>every</b> laptop can print and message every other laptop. Test it, then check.') : ''));
      if (m.rounds > 1) t.appendChild(el('p', { class: 'note' }, have + ' of ' + m.rounds + ' clean networks in a row.'));
      if (M.phase === 'predict' || M.predicted) t.appendChild(jobList());
    }
    if (m.type === 'client') {
      t.appendChild(el('div', { class: 'brief' }, '<b>Client brief.</b> ' + m.brief));
      t.appendChild(el('ul', { class: 'goals' }, m.reqs.map(r => '<li>' + r.text + '</li>').join('')));
      if (!M.result) t.appendChild(el('p', { class: 'note' }, 'No help in challenges. Build it, test it, then hand it over. Stars: meet every requirement, use as few cables as you can, and test it after your last change.'));
      else {
        const R = M.result, box = el('div', { class: 'result' });
        box.appendChild(el('div', { class: 'result-head' }, starsHtml(R.n) + '<b>' + (R.met ? R.n + ' of 3 stars' : 'Not accepted') + '</b>'));
        const ul = el('ul', { class: 'breakdown' });
        R.res.forEach(r => ul.appendChild(el('li', { class: r.ok ? 'ok' : 'no' }, r.text)));
        ul.appendChild(el('li', { class: R.few ? 'ok' : 'no' }, 'Cables: you used ' + R.used + '. The fewest possible is ' + m.minCables + '.'));
        ul.appendChild(el('li', { class: R.tested ? 'ok' : 'no' }, R.tested ? 'You tested it after your last change.' : 'You did not test it after your last change.'));
        box.appendChild(ul);
        if (!R.met) box.appendChild(el('p', { class: 'note' }, 'Every requirement must be met for the client to accept it. Start again and build it so it works first time.'));
        t.appendChild(box);
      }
    }
    if (m.type === 'race') {
      t.appendChild(el('ul', { class: 'goals' }, m.lanes.map(L => '<li><b>' + L.label + ':</b> ' + L.text + '</li>').join('')));
      const p = m.predict;
      t.appendChild(el('p', { class: 'ask-q' }, '<b>Predict.</b> ' + p.q));
      const opts = el('div', { class: 'seg race-pick', role: 'group' });
      p.options.forEach(o => {
        const b = el('button', { type: 'button', 'aria-pressed': String(M.racePick === o) }, o);
        b.disabled = !!race || M.raced;
        b.addEventListener('click', () => { M.racePick = o; drawPanel(); });
        opts.appendChild(b);
      });
      t.appendChild(opts);
      if (M.raced) t.appendChild(el('p', { class: M.racePick === p.options[0] ? 'win' : 'note' }, 'You predicted <b>' + M.racePick + '</b>. ' + (M.racePick === p.options[0] ? 'Right! ' : 'Not quite. ') + p.why + '<br><small>' + M.raceTimes + '</small>'));
    }
    if (m.breakAfter && (M.phase === 'predict' || M.predicted)) {
      t.appendChild(el('p', {}, '<b>A cable broke</b> (red). Will each job still work?'));
      t.appendChild(jobList());
    }
    if (M.phase === 'checked' && M.probs && M.probs.length) t.appendChild(el('ul', { class: 'probs' }, M.probs.slice(0, 5).map(p => '<li>' + p + '</li>').join('')));
    if (M.phase === 'done') t.appendChild(el('p', { class: 'win' }, 'Mission complete! ' + (m.end || '')));
    if (M.phase === 'ask') t.appendChild(askBox(m.before, () => { M.phase = 'build'; updateShow(); drawAll(); }));
    if (M.phase === 'done' && !M.afterOk) t.appendChild(askBox(m.after, () => { M.afterOk = true; drawAll(); }));
    const act = el('div', { class: 'actions' });
    if (M.phase === 'ask' || (M.phase === 'done' && !M.afterOk)) { /* answer first */ }
    else if (M.phase === 'done') act.appendChild(missionAt < MISSIONS.length - 1 ? btn('Next mission', 'go', () => start(missionAt + 1)) : btn('Play again', 'go', () => start(missionAt)));
    else if (M.phase === 'checked') act.appendChild(m.breakAfter && M.predicted ? btn('Try another break', 'go', topoBreak) : btn(m.type === 'fix' ? 'New network' : 'Try again', 'go', () => start(missionAt)));
    else if (M.phase === 'predict') act.appendChild(btn('Check my predictions', 'go', checkPredict));
    else if (m.breakAfter && M.predicted) { /* the result is shown; Try another break above */ }
    else if (m.type === 'client') act.appendChild(btn('Hand it over', 'go', handOver));
    else if (m.type === 'race') { const r = btn(race ? 'Watch...' : 'Run it', 'go', runRace); r.disabled = !!race || !M.racePick; act.appendChild(r); }
    else if (m.type !== 'tutorial') act.appendChild(btn('Check my network', 'go', checkMission));
    if (m.type === 'tutorial' && M.phase === 'build') act.appendChild(btn('Start again', '', () => start(missionAt)));
    if (!m.noHelp) act.appendChild(btn('Walk me through it', '', walkMe));
    t.appendChild(act);
    if (M.phase === 'done' || M.phase === 'checked') t.scrollTop = t.scrollHeight;   // the result and its button in view
    $('step').textContent = m.group + ': ' + (inSec.indexOf(m) + 1) + ' of ' + inSec.length;
  }
  // A question in the mission panel: typed number or buttons. Wrong: why, then answer again (the buttons move).
  function askBox(a, onRight) {
    const box = el('div', { class: 'ask' });
    box.appendChild(el('p', { class: 'ask-q' }, '<b>Think.</b> ' + a.q));
    const fb = el('p', { class: 'ask-fb' });
    const wrong = () => { fb.className = 'ask-fb bad'; fb.innerHTML = 'Not quite. ' + a.why + ' Try again.'; log.note('Question: "' + a.q + '" answered wrongly.'); };
    const right = () => { log.note('Question: "' + a.q + '" answered right.'); toast('Yes!', 'good'); onRight(); };
    if (a.number != null) {
      const row = el('div', { class: 'ask-row' }), inp = el('input', { type: 'text', inputmode: 'numeric', id: 'nbAsk', 'aria-label': 'Your answer', autocomplete: 'off' });
      const go = () => { const v = parseInt(inp.value.trim(), 10); if (isNaN(v)) { inp.focus(); return; } if (v === a.number) right(); else { wrong(); inp.value = ''; inp.focus(); } };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      row.append(inp, btn('Check', 'go', go)); box.appendChild(row);
    } else {
      const opts = el('div', { class: 'ask-opts' });
      shuffle(a.options.map((o, i) => ({ o, i }))).forEach(({ o, i }) => opts.appendChild(btn(o, '', () => {
        if (i === 0) right();
        else { wrong(); const list = [...opts.children]; shuffle(list).forEach(x => opts.appendChild(x)); }
      })));
      box.appendChild(opts);
    }
    box.appendChild(fb);
    return box;
  }
  function jobList() {
    const list = el('div', { class: 'jobs' });
    S.jobs.forEach((p, i) => {
      const card = el('div', { class: 'job' }, '<span>' + jobText(p[0], p[1]) + '</span>');
      const seg = el('div', { class: 'seg', role: 'group' });
      ['Yes', 'No'].forEach(v => {
        const b = el('button', { type: 'button', 'aria-pressed': String(M.picks[i] === v) }, v);
        b.disabled = M.phase !== 'predict';
        b.addEventListener('click', () => { M.picks[i] = v; drawPanel(); });
        seg.appendChild(b);
      });
      card.appendChild(seg);
      if (M.predicted && M.predAns) {
        const right = (M.picks[i] === 'Yes') === M.predAns[i];
        card.className = 'job ' + (right ? 'good' : 'bad');
        card.appendChild(el('small', {}, (M.predAns[i] ? 'Yes: ' : 'No: ') + M.predWhy[i]));
      }
      list.appendChild(card);
    });
    return list;
  }
  function walkMe() {
    M.walked = true;
    const keep = S, m = M.m; let steps = [];
    if (m.walk) steps = m.walk();
    else if (m.type === 'race') steps = m.lanes.map(L => ({ text: '<b>' + L.label + '.</b> ' + L.text, visual: '' })).concat([{ text: 'Predict first, then press Run it and watch. ' + m.predict.why, visual: '' }]);
    else if (m.type === 'tutorial') {
      steps = m.steps.map((s, i) => ({ text: 'Step ' + (i + 1) + '. ' + s.text, visual: '' }));
      steps.push({ text: 'The mission sheet ticks each step when you do it. The yellow ring on the floor shows where to go next.', visual: '' });
    } else if (m.type === 'challenge') {
      S = fresh({});
      const sw = place('switch', 320, 200, 'Switch'), pr = place('printer', 320, 70, 'Printer');
      const a = place('laptop', 110, 290), b = place('laptop', 530, 290), c = place('laptop', 110, 90), ex = S;
      steps.push({ text: '<b>A similar network.</b> Three laptops and a printer must all be joined.', visual: mini(ex) });
      steps.push({ text: 'Every laptop and the printer has only <b>one</b> socket, so they cannot all plug into each other. Put a <span class="hl">switch</span> in the middle.', visual: mini(ex) });
      [pr, a, b, c].forEach(d => { plug(d, sw); steps.push({ text: 'Plug ' + d.name + ' into the switch.', visual: mini(ex, [S.cables.length - 1]) }); });
      const r = route(a, pr);
      steps.push({ text: 'Test: ' + a.name + ' prints. The data goes ' + routeText(r) + '.', visual: mini(ex, cablesOn(ex, r)) });
      steps.push({ text: 'Test every laptop before you check: one check only. Now build yours.', visual: '' });
    } else if (m.id === 'predict' || m.id === 'fixw') {
      m.setup(); const ex2 = S, p = S.jobs.filter(j => !route(j[0], j[1]))[0], q = S.jobs.filter(j => route(j[0], j[1]))[0];
      steps.push({ text: '<b>A similar network.</b> ' + jobText(q[0], q[1]) + '. ' + jobText(p[0], p[1]) + '. Will each work?', visual: mini(ex2) });
      const rq = route(q[0], q[1]);
      steps.push({ text: 'Follow the cables from ' + q[0].name + ': ' + routeText(rq) + '. It gets there, so <span class="hl">Yes</span>.', visual: mini(ex2, cablesOn(ex2, rq)) });
      steps.push({ text: 'Now ' + p[0].name + '. ' + why(p[0], p[1]) + ' So <span class="hl">No</span>.', visual: mini(ex2) });
      steps.push({ text: m.id === 'fixw' ? 'To fix it: plug in anything that is not plugged in, and carry a tablet inside a Wi-Fi point\'s circle.' : 'To fix it, every laptop and the printer must be plugged into the switch. Pull out a wrong cable\'s plugs, then plug each device into the switch.', visual: '' });
      steps.push({ text: 'Test with Send and Print, then check. Now do the same on your network.', visual: '' });
    } else {
      rooms(); const ex3 = S, lap = laptops()[0], prn = S.devs.find(d => d.kind === 'printer');
      const s1 = S.devs.find(d => d.name === 'Switch 1'), s2 = S.devs.find(d => d.name === 'Switch 2');
      steps.push({ text: '<b>A similar network.</b> Can ' + lap.name + ' print?', visual: mini(ex3) });
      steps.push({ text: lap.name + '\'s cable goes to Switch 1. Switch 1 joins only the devices in Room 1.', visual: mini(ex3, cablesOf(lap.id).map(c => S.cables.indexOf(c))) });
      steps.push({ text: 'No cable joins Room 1 to Room 2, so ' + lap.name + ' cannot reach the Printer: <span class="hl">No</span>.', visual: mini(ex3) });
      steps.push({ text: 'A switch has eight sockets, so it has room for one more cable. A cable from <span class="hl">Switch 1 to Switch 2</span> joins the two networks into one.', visual: '' });
      plug(s1, s2);
      const r3 = route(lap, prn);
      steps.push({ text: 'Now ' + lap.name + ' prints: ' + routeText(r3) + '.', visual: mini(ex3, cablesOn(ex3, r3)) });
      steps.push({ text: 'Now predict and fix your own network.', visual: '' });
    }
    S = keep;
    let i = 0;
    const wrap = $('cardWrap'), card = $('card');
    const draw = () => {
      const s = steps[i];
      card.innerHTML = `<h2>Walk me through it</h2><p class="small">${m.type === 'tutorial' ? 'The steps of this mission.' : 'A different network.'}</p><div class="count">Step ${i + 1} of ${steps.length}</div><p class="text">${s.text}</p>${s.visual || ''}<div class="actions"></div>`;
      const act = card.querySelector('.actions');
      const back = btn('Back', '', () => { if (i > 0) { i--; draw(); } }); back.disabled = i === 0;
      act.append(back, btn(i === steps.length - 1 ? 'Done' : 'Next step', 'go', () => { if (i < steps.length - 1) { i++; draw(); } else { wrap.hidden = true; log.note('Walk me through it (' + (i + 1) + ' of ' + steps.length + ' steps).'); } }));
    };
    keys.clear(); setHand(0, false); setHand(1, false);
    wrap.hidden = false; draw(); card.querySelector('.btn:not([disabled])')?.focus();
  }
  function drawAll() { drawPanel(); drawTest(); drawCables(); hint(); }

  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls === 'bad' ? 'bad' : cls === 'good' ? 'good' : 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, 3200); }
  function hint() {
    const held = hands.map(h => h.dev ? 'dev' : h.cable ? (h.joint === 0 || h.joint === h.cable.n ? 'plug' : 'cable') : null).filter(Boolean);
    let h = '';
    if (held.includes('dev')) h = 'Walk to where it should go, then let go. Let go at its crate to put it back.';
    else if (held.includes('plug')) h = 'Push the Ethernet plug into an RJ45 port, then let go. A laptop\'s port is on its right-hand side.';
    else if (held.length) h = 'Keep holding to carry. Let go to drop it.';
    else h = 'Hold a mouse button to grab: left button = left hand, right button = right hand. Grab a device to carry it.';
    $('hint').textContent = h;
  }

  // ---- the frame loop: walking, carrying, the rope, the message
  function setOverview(on) { overview = on; view?.setFit(on ? MAPW : 16); $('mapBtn').textContent = on ? 'Walk (M)' : 'Map (M)'; }
  let last = 0, acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    tick(ts);
  }
  function tick(ts) {
    clock = Math.max(clock, ts / 1000);
    const dt = last ? Math.max(0, Math.min(0.1, (ts - last) / 1000)) : 0.016; last = Math.max(last, ts);   // time never runs backwards
    if (!view) return;
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
    if (stick) { dx = stick.x; dy = stick.y; }
    const len = Math.hypot(dx, dy);
    moving = len > 0.15;
    if (moving) {
      [dx, dy] = view.rotateInput(dx / Math.max(1, len), dy / Math.max(1, len));
      const sp = SPEED * dt, nx = pos.x + dx * sp, ny = pos.y + dy * sp;
      if (free(nx, ny)) { pos.x = nx; pos.y = ny; } else if (free(nx, pos.y)) pos.x = nx; else if (free(pos.x, ny)) pos.y = ny;
      pos.face = Math.atan2(dx, dy);
    }
    for (let i = 0; i < 2; i++) if (hands[i].dev) carryDevice(i);
    acc += dt;
    let stepped = false;
    while (acc >= 0.05) { acc -= 0.05; tickNo++; stepCables(); stepped = true;
      if (M && M.phase === 'build') for (let i = 0; i < 2; i++) if (hands[i].down && !hands[i].cable && !hands[i].dev) tryGrab(i, false); }
    if (stepped) { drawCables(); hint(); }
    stepAnim(dt);
    stepFx(dt);
    stepPackets(dt);
    stepRace(dt);
    updateScreens(false);
    updatePortGlow(ts);
    updateOutline(ts);
    if (wifiG) for (const r of wifiG.children) {
      const w = r.userData.wave; if (!w) continue;
      const p = ((ts / 1000) * (w.on ? 0.32 : 0.16) + w.k / 5) % 1;   // five rings, evenly spaced, always spreading out
      r.scale.setScalar(Math.max(1, p * w.R));
      r.material.opacity = (w.on ? 0.75 : 0.4) * Math.min(1, p * 6) * (1 - p * p);
    }
    pulse.material.opacity = 0.5 + 0.4 * Math.sin(ts / 180);
    updateGuide(ts); if (guideKey) drawPulse();
    me.update(dt, { x: pos.x, y: pos.y, face: pos.face, moving, hands: hands.map(h => ({ down: h.down, hold: h.cable ? 'cable' : h.dev ? 'dev' : null })) }, true);
    view.follow(pos.x, pos.y);
    view.render(dt);
  }

  // ---- input
  // Keys are read by where they sit on the keyboard (e.code), not the letter they type: with a Thai layout or Shift
  // the W key still walks, and letting go of it always stops you.
  const typing = e => /input|select|textarea/i.test(e.target?.tagName || '');
  const HAND0 = ['KeyJ', 'Space'], HAND1 = ['KeyK', 'Space'];
  document.addEventListener('keydown', e => {
    const k = e.code;
    if (typing(e)) return;
    // the Walk me through it card is open: the game behind it does not move; Escape closes the card
    if (!$('cardWrap').hidden) { if (k === 'Escape') $('cardWrap').hidden = true; return; }
    if (k === 'Space' || k === 'KeyJ' || k === 'KeyK') { e.preventDefault(); if (e.repeat) return; }
    if (k === 'KeyM') { setOverview(!overview); return; }
    if (HAND0.includes(k)) setHand(0, true);
    if (HAND1.includes(k)) setHand(1, true);
    if (k.startsWith('Arrow')) e.preventDefault();
    keys.add(k);
  });
  document.addEventListener('keyup', e => {
    const k = e.code;
    keys.delete(k);
    if (typing(e)) return;
    if (k === 'Space' || k === 'KeyJ' || k === 'KeyK') e.preventDefault();
    if (HAND0.includes(k)) setHand(0, false);
    if (HAND1.includes(k)) setHand(1, false);
  });
  // starting to type (the message box, a menu) lets go of every key you were holding, so you stop walking
  document.addEventListener('focusin', e => { if (typing(e)) { keys.clear(); stick = null; const kn = $('knob'); if (kn) kn.style.transform = ''; } });
  addEventListener('blur', () => { keys.clear(); setHand(0, false); setHand(1, false); });
  container.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && (e.button === 0 || e.button === 2)) setHand(e.button === 0 ? 0 : 1, true); });
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && (e.button === 0 || e.button === 2)) setHand(e.button === 0 ? 0 : 1, false); });
  container.addEventListener('contextmenu', e => e.preventDefault());
  for (const [id, i] of [['leftBtn', 0], ['rightBtn', 1]]) {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); setHand(i, true); });
    b.addEventListener('pointerup', () => setHand(i, false)); b.addEventListener('pointercancel', () => setHand(i, false));
  }
  $('mapBtn').addEventListener('click', () => setOverview(!overview));
  {
    const st = $('stick'), knob = $('knob');
    const at = e => { const r = st.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } stick = { x, y }; knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`; };
    st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); at(e); });
    st.addEventListener('pointermove', e => { if (stick) at(e); });
    const end = () => { stick = null; knob.style.transform = ''; };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
  }


  let first = 0;
  while (first < MISSIONS.length - 1 && done[first]) first++;
  start(first);
  requestAnimationFrame(frame);
  // ?debug: drive it from a script (tests only)
  if (/[?&]debug/.test(location.search)) window.__solo = { get S() { return S; }, get M() { return M; }, get anim() { return anim || fx || pk || race; }, runRace, startMessage, stepAnim, pos, hands, setHand, start, send, CRATES, plugPin, cables: () => cables3, handPos, centre, fits, shelfReachable, free, solidAt, handOver, missions: MISSIONS.length, get pk() { return pk; }, grabTarget, get glowing() { return glowPool.filter(x => x.visible).length; }, get outlined() { return outlineG.children.length; }, enqueue, guideTarget, get arrows() { return arrows.count; }, get view() { return view; }, carried, toastText: () => $("toast").textContent, get done() { return done; }, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, step: n => { for (let i = 0; i < n; i++) { tickNo++; stepCables(); for (let k = 0; k < 2; k++) if (hands[k].dev) carryDevice(k); } drawCables(); }, checkMission, checkPredict, route };
  return { stop() { view?.destroy(); view = null; } };
}
