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
import { makeDevice, makeCrate, setLight, tape, pageTexture } from './devices.js';
const $ = id => document.getElementById(id);
const T = 100, K = 22, OX = 1.5, OY = 1.5;          // world units a tile; desk units a tile; desk origin in tiles
const MAPW = 34, MAPH = 27, DESK_BOTTOM = 20;        // the room; the desk is rows 1 to 20, the supply shelf below
const SEG = 0.5, CABLE_LEN = 20, CABLE_R = 10, PLUG_LEN = 58, HAND_Y = 60, SPEED = 5.5;
const PORTS = { laptop: 1, printer: 1, 'switch': 8, wifi: 1, tablet: 0 };
const LABEL = { laptop: 'Laptop', printer: 'Printer', 'switch': 'Switch', wifi: 'Wi-Fi point', tablet: 'Tablet' };
const RANGE = 150;
const NAMES = ['Ana', 'Ben', 'Chi', 'Dev', 'Eli', 'Fai', 'Gus', 'Hana', 'Ivy', 'Jon', 'Kim', 'Lek'];
const W = 640, H = 380, NEED = 2;
const SHELF = ['laptop', 'tablet', 'printer', 'switch', 'wifi'];
const CRATE_COL = { laptop: 0x7fa8d8, tablet: 0x495057, printer: 0xd9d9d4, 'switch': 0x4a5058, wifi: 0x51cf66, cable: 0x2b6fd6 };

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
function isClient(d) { return d.kind === 'laptop' || d.kind === 'tablet'; }
function inRange(t, w) { return Math.hypot(t.x - w.x, t.y - w.y) <= RANGE; }
function aps(t) { return S.devs.filter(w => w.kind === 'wifi' && inRange(t, w)); }
function links(x) {
  const d = dev(x), out = cablesOf(x).map(c => c.a === x ? c.b : c.a);
  if (d.kind === 'wifi') S.devs.forEach(t => { if (t.kind === 'tablet' && inRange(t, d)) out.push(t.id); });
  if (d.kind === 'tablet') aps(d).forEach(w => out.push(w.id));
  return out;
}
function count(kind) { return S.devs.filter(d => d.kind === kind).length; }
// devices standing on the floor (not in someone's hands); set by the 3D lab
let isHeld = () => false;
function placed(kind) { return S.devs.filter(d => d.kind === kind && !isHeld(d)).length; }
function ends() { return S.devs.filter(d => d.kind !== 'switch' && d.kind !== 'wifi'); }
function place(kind, x, y, name) {
  const d = { id: S.nextId++, kind, x, y };
  if (name) d.name = name;
  else if (kind === 'laptop' || kind === 'tablet') { const used = S.devs.map(o => o.name); d.name = S.names.filter(n => used.indexOf(n) < 0)[0]; }
  else d.name = count(kind) ? LABEL[kind] + ' ' + (count(kind) + 1) : LABEL[kind];
  S.devs.push(d);
  return d;
}
function plug(a, b) { S.cables.push({ a: a.id, b: b.id }); }
// Data travels along cables (and Wi-Fi); only a switch or a Wi-Fi point passes it on to other devices.
function route(a, b) {
  const prev = {}, q = [a.id];
  prev[a.id] = 0;
  while (q.length) {
    const x = q.shift();
    if (x === b.id) break;
    if (x !== a.id && dev(x).kind !== 'switch' && dev(x).kind !== 'wifi') continue;
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
  for (const d of [a, b]) {
    if (d.kind === 'tablet' && !aps(d).length) return d.name + ' is out of Wi-Fi range.';
    if (d.kind === 'tablet' && aps(d).every(w => !cablesOf(w.id).length)) return 'The Wi-Fi point near ' + d.name + ' is not plugged in.';
    if (d.kind !== 'tablet' && !cablesOf(d.id).length) return d.name + ' is not plugged in.';
  }
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
  { id: 'two', group: 'Getting started', title: 'Join Two Laptops', type: 'tutorial', setup() { S = fresh({ laptop: 2 }); },
    intro: 'Two laptops on their own cannot share anything. Join them to make a network.',
    steps: [
      { text: 'Grab the <b>Laptop</b> crate on the supply shelf, carry the laptop onto the floor and let go.', show: 'crate-laptop', done: () => placed('laptop') >= 1 },
      { text: 'Put a second <b>Laptop</b> down.', show: 'crate-laptop', done: () => placed('laptop') >= 2 },
      { text: 'Plug in a cable. ' + SOCK, show: 'crate-cable', done: () => S.cables.some(c => !isHeld(dev(c.a)) && !isHeld(dev(c.b))) },
      { text: 'Test it. In the Test bar at the bottom, choose who sends and who gets it, then press <b>Send</b>.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok }
    ], end: 'Two devices joined so they can share data: that is a <b>network</b>.' },
  { id: 'switch', group: 'Getting started', title: 'Add a Third Laptop', type: 'tutorial', setup() {
    S = fresh({ laptop: 3, 'switch': 1 }); const a = place('laptop', 150, 100), b = place('laptop', 490, 100); plug(a, b); },
    intro: 'A third person wants to join the network.',
    steps: [
      { text: 'Put a third <b>Laptop</b> down.', show: 'crate-laptop', done: () => placed('laptop') >= 3 },
      { text: 'Try to plug the new laptop into one of the other two laptops. Watch what happens.', show: 'crate-cable', event: true, done: () => S.refused },
      { text: 'Each laptop has only one network socket. Take a <b>Switch</b> from the shelf and put it down: it has eight sockets.', show: 'crate-switch', done: () => placed('switch') >= 1 },
      { text: 'Take out the old cable between the first two laptops: grab a plug and pull it out of its socket.', show: 'cable', done: () => !S.cables.some(c => dev(c.a).kind === 'laptop' && dev(c.b).kind === 'laptop') },
      { text: 'Plug <b>all three</b> laptops into the switch.', show: 'switch', done: () => placed('laptop') >= 3 && placed('switch') >= 1 && laptops().every(l => !isHeld(l) && plugged(l, 'switch')) },
      { text: 'Test it: send a message between two laptops. Watch it go through the switch.', show: 'test', event: true, done: () => S.lastTest && S.lastTest.ok }
    ], end: 'A <b>switch</b> joins many devices. Data goes from one laptop, through the switch, to another.' },
  { id: 'printer', group: 'Getting started', title: 'Share the Printer', type: 'challenge', setup() { S = fresh({ laptop: 4, printer: 1, 'switch': 1 }); },
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
export const MISSIONS = [BUILD[0], BUILD[1], BUILD[2], WIFI1, WIFI2, FIX[1], FULL, FIX[0], FIXW, BUDGET, SCHOOL];

// ================================================================ the small pictures for Walk me through it (website drawing)
function icon(d, x, y) {
  if (d.kind === 'printer') return '<rect class="paper" x="' + (x - 16) + '" y="' + (y - 30) + '" width="32" height="16" rx="2"/><rect class="body" x="' + (x - 30) + '" y="' + (y - 16) + '" width="60" height="30" rx="6"/><rect class="slot" x="' + (x - 18) + '" y="' + (y + 2) + '" width="36" height="4" rx="2"/>';
  if (d.kind === 'switch') {
    const n = d.ports || 8; let s = '<rect class="body sw" x="' + (x - 46) + '" y="' + (y - 14) + '" width="92" height="28" rx="5"/>';
    for (let i = 0; i < n; i++) s += '<rect class="port" x="' + (x - n * 5 + 2 + i * 10) + '" y="' + (y - 5) + '" width="7" height="7" rx="1"/>';
    return s;
  }
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
  const shelfAt = { laptop: 2, tablet: 6, printer: 10, 'switch': 14, wifi: 18, cable: 27 };
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
  function dropGroup(g) { if (!g) return; scene.remove(g); g.traverse(o => { if (o.userData.own) o.geometry.dispose(); }); }
  function buildWorld() {
    if (!view) { view = create(container); scene = view.scene; scene.add(me.group, pulse, arrows, portGlow, outlineG); }
    guideKey = '';
    view.setRoom({ w: MAPW, h: MAPH, rows, regions: regionsFor(S.rooms) });
    for (const g of [devG, cableG, fxG, crateG]) dropGroup(g);
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
  function size(kind, ports) { return kind === 'switch' ? ((ports || 8) <= 4 ? [4, 1] : [5, 1]) : kind === 'wifi' ? [2, 1] : kind === 'tablet' ? [1, 1] : [3, 2]; }
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
      const { P, Q, n } = c, pins = [];
      for (let j = 0; j <= n; j++) pins.push(pinOf(c, j));
      for (let i = 0; i <= n; i++) {
        if (pins[i]) { Q[2 * i] = P[2 * i]; Q[2 * i + 1] = P[2 * i + 1]; P[2 * i] = pins[i][0]; P[2 * i + 1] = pins[i][1]; continue; }
        const x = P[2 * i], y = P[2 * i + 1];
        P[2 * i] += (x - Q[2 * i]) * 0.7; P[2 * i + 1] += (y - Q[2 * i + 1]) * 0.7; Q[2 * i] = x; Q[2 * i + 1] = y;
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
    S.cables = cables3.filter(c => c.ends[0] && c.ends[1]).map(c => ({ a: c.ends[0].dev, b: c.ends[1].dev, c3: c }));
    for (const d of S.devs) for (let i = 0; i < d.k3.lights.length; i++) setLight(d.k3.lights[i], socketTaken(d, i));
    retitleCrates();
  }

  // ---- hands: hold to grab, let go to put down or plug in (as the team game)
  function locked() { return M.phase === 'predict' || M.phase === 'checked' || M.phase === 'done' || !!anim || !!fx; }
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
    if (locked()) { toast(M.phase === 'predict' ? 'Predict first: choose Yes or No for each job, then press Check my predictions.' : anim ? 'Wait for the message to arrive.' : 'Press the button on the mission sheet to go on.', 'hint'); return; }
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
    if (j) return { kind: 'cable', ...j };
    const d = S.devs.filter(d => d.kind !== 'tablet' && !carried(d) && distToFoot(d, hx, hy) < 0.5).sort((a, b) => distToFoot(a, hx, hy) - distToFoot(b, hx, hy))[0];
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
      if ((pd < 0.6 || distToFoot(d, hx, hy) < 0.9) && pd < bd) { bd = pd; dv = d; }
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
      let d = Math.hypot(hx - c.P[2 * j], hy - c.P[2 * j + 1]); if (e >= 0) d -= c.ends[e] ? 0.4 : 0.4;
      if (d < 0.6 && (!best || d < best.d)) best = { c, j, d };
    }
    return best;
  }
  function grabJoint(i, best) {
    const h = hands[i], e = best.j === 0 ? 0 : best.j === best.c.n ? 1 : -1;
    if (e >= 0 && best.c.ends[e]) { toast('Ethernet cable unplugged from ' + dev(best.c.ends[e].dev).name + '.', 'good'); best.c.ends[e] = null; afterChange(); }
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
    // the port it goes into: the nearest free port of the device you let go next to
    const best = plugChoice(hx, hy);
    if (!best) {
      const tab = S.devs.find(d => d.kind === 'tablet' && Math.hypot(d.tx - hx, d.ty - hy) < 1.0);
      if (tab) toast(tab.name + '\'s tablet has no network socket. It joins by Wi-Fi: put it inside a Wi-Fi point\'s green circle.', 'hint');
      else { const near = S.devs.find(d => d.kind !== 'tablet' && distToFoot(d, hx, hy) < 1.0); if (near) toast('Push the plug right into a network socket on ' + near.name + ': the RJ45 port, a dark hole with gold pins.', 'hint'); }
      return;
    }
    const other = c.ends[1 - end];
    if (other && other.dev === best.d.id) { toast('Both ends of one cable cannot go into the same device.', 'hint'); return; }
    if (other && S.cables.some(x => (x.a === other.dev && x.b === best.d.id) || (x.b === other.dev && x.a === best.d.id))) { toast('These two are already joined.', 'hint'); return; }
    if (socketTaken(best.d, best.s)) {
      // the website's refusal: a full device
      const freeOne = best.d.k3.sockets.some((_, k) => !socketTaken(best.d, k));
      if (freeOne) { toast('That port is taken. Try another RJ45 port on ' + best.d.name + '.', 'hint'); return; }
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
    let k = (litCables.has(c) ? 'L' : '') + (anim?.cur?.c === c ? 'A' + anim.cur.u.toFixed(3) : '') + hands.map(h => h.cable === c ? h.joint : -1).join() + JSON.stringify(c.ends);
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
      d.tube = new THREE.Mesh(tubeGeometry(c, pts), litCables.has(c) ? litMat : cableMat);
      d.tube.userData.own = true; cableG.add(d.tube); tubes.set(c, d.tube); d.key = key;
    }
    drawWifi();
    drawPulse();
  }
  // Wi-Fi: each Wi-Fi point's range on the floor, and a dotted line from each tablet that has joined (rebuilt only when it changes)
  function drawWifi() {
    const key = S.devs.filter(d => d.kind === 'wifi' || d.kind === 'tablet').map(d => d.id + ':' + centre(d).map(v => v.toFixed(2)) + (d.kind === 'wifi' ? ':' + (cablesOf(d.id).length > 0) : '')).join('|');
    if (key === wifiKey) return;
    wifiKey = key;
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
    const show = M && M.phase === 'build' ? M.show : null;
    if (!show || show === 'test') return null;
    if (hands.some(h => h.dev)) return null;   // carrying a device: put it down anywhere
    const wantsCable = show === 'crate-cable' || show === 'switch' || show === 'wifi';
    const held = hands.find(h => h.cable && (h.joint === 0 || h.joint === h.cable.n));
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
  function owned(scr) { return fx && ((fx.a.k3.screen === scr && fx.stage !== 'wait') || (fx.b.k3.screen === scr && fx.stage === 'arrive' && fx.bOn)); }
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
  function startMessage(a, b, text) {
    fx = { a, b, text, t: 0, stage: 'wait' };
    drawTest();
  }
  const ease = (t0, t1, t) => Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  function stepFx(dt) {
    if (!fx) return;
    const A = fx.a.k3.screen, B = fx.b.k3.screen, toName = fx.b.kind === 'printer' ? 'Printer' : fx.b.name;
    if (fx.stage === 'wait') { if (busy(A)) return; fx.stage = 'type'; fx.t = 0; }
    if (fx.stage === 'arrive' && !fx.bOn) { if (busy(B)) return; fx.bOn = true; fx.t = 0; }
    fx.t += dt;
    const t = fx.t;
    if (fx.stage === 'type') {
      if (A) {
        if (t < 1) A.show({ top: 'To ' + toName, text: fx.text.slice(0, Math.ceil(fx.text.length * t)), caret: true });
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
        if (t < 1) B.show({ top: 'New message', env: t < 0.4 ? ease(0, 0.4, t) : 1 - ease(0.7, 1, t) });
        else B.show({ top: 'From ' + fx.a.name, text: fx.text, textAlpha: ease(1, 1.4, t) });
      }
      if (fx.page) { const k = ease(0, 0.8, t); fx.page.position.z = fx.page.userData.z0 + 55 * k; fx.page.material.opacity = Math.min(1, k * 2); }
      if (t >= 1.4) {
        if (B) hold(B, { top: 'From ' + fx.a.name, text: fx.text }, 4);
        if (fx.page) { const pg = fx.page, dv = fx.b; pages.push({ until: nowS() + 6, done() { dv.k3.group.remove(pg); pg.geometry.dispose(); pg.material.map.dispose(); pg.material.dispose(); } }); }
        fx = null; drawTest();
      }
    }
  }
  // What each laptop and tablet knows about its connection, shown on its taskbar; a change joins its screen's queue.
  function netState(d) {
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
  const markMat = new THREE.SpriteMaterial({ map: null, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const mark = new THREE.Sprite(markMat); mark.renderOrder = 6; mark.visible = false; portGlow.add(mark);
  function updatePortGlow(ts) {
    markMat.map = markMat.map || glowTex;
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
    if (at) { mark.visible = true; mark.position.copy(at); const k = 120 + 40 * Math.sin(ts / 140); mark.scale.set(k, k, 1); }
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
    if (a.k3.screen) hold(a.k3.screen, { top: 'To ' + (b.kind === 'printer' ? 'Printer' : b.name), text: fx.text, mark: 'tick', sub: b.kind === 'printer' ? 'Printed' : 'Delivered' }, 4);
    fx.stage = 'arrive'; fx.t = 0; fx.bOn = false;
    if (b.kind === 'printer') {
      // a page slides out of the printer's tray with the message on it
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(120, 84).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: pageTexture(fx.text, a.name), transparent: true, opacity: 0, side: THREE.DoubleSide }));
      pg.position.set(0, 112, b.h * T / 2 - 60); pg.userData.z0 = pg.position.z; b.k3.group.add(pg); fx.page = pg;
    }
  }
  function drawTest() {
    const t = $('testBar'); t.innerHTML = ''; t.hidden = false;
    t.classList.toggle('pulse', M.show === 'test');
    if (compose && (!S.devs.includes(compose.a) || !S.devs.includes(compose.b) || M.phase === 'predict')) compose = null;
    if (compose) {
      const { a, b } = compose, verb = b.kind === 'printer' ? 'Print' : 'Send';
      const box = el('input', { id: 'nbMsg', type: 'text', maxlength: '10', autocomplete: 'off', spellcheck: 'false', placeholder: '5 to 10 letters', 'aria-label': 'Message' });
      const submit = () => {
        const v = box.value.trim();
        if (v.length < 5 || v.length > 10) { toast('Type a message of 5 to 10 letters.', 'hint'); box.focus(); return; }
        compose = null; box.blur(); startMessage(a, b, v);
      };
      box.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') { compose = null; drawTest(); } });
      t.append(el('b', {}, a.name + ' to ' + (b.kind === 'printer' ? 'the Printer' : b.name)), box, btn(verb, 'go', submit), btn('Cancel', '', () => { compose = null; drawTest(); }));
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
      if (!a || !b || anim || fx) return;
      if (a === b) { toast('Choose two different devices.', 'hint'); return; }
      compose = { a, b }; drawTest();
    });
    const label = () => { const b = dev(Number(to.value)); go.textContent = b && b.kind === 'printer' ? 'Print' : 'Send'; };
    from.addEventListener('change', () => { testFrom = from.value; from.blur(); });
    to.addEventListener('change', () => { testTo = to.value; label(); to.blur(); });
    label();
    go.disabled = !!anim || !!fx || M.phase === 'predict';
    t.append(el('b', {}, 'Test'), el('span', {}, 'From'), from, el('span', {}, 'to'), to, go);
  }

  // ---- missions
  let M = null, missionAt = 0, have = 0;
  const done = load('all:done', {}) || {};   // the 2D app's key: the same eleven missions in the same order
  function saveDone() { save('all:done', done); }

  function start(i) {
    missionAt = i;
    const m = MISSIONS[i];
    M = { m, step: 0, phase: m.type === 'fix' ? 'predict' : 'build', picks: {}, show: null, walked: false, latched: [] };
    for (const h of hands) { h.cable = null; h.joint = -1; h.dev = null; }
    anim = null; fx = null; compose = null; queues.clear(); for (const p of pages) p.done(); pages.length = 0; litCables.clear(); cables3 = [];
    m.setup();
    buildWorld();
    for (const d of S.devs) realise(d);
    // the starting cables, laid straight between free sockets
    const want = S.cables.slice(); S.cables = [];
    for (const w of want) {
      const a = dev(w.a), b = dev(w.b);
      const sa = a.k3.sockets.findIndex((_, k) => !socketTaken(a, k)), sb = b.k3.sockets.findIndex((_, k) => !socketTaken(b, k));
      if (sa < 0 || sb < 0) continue;
      const pa = plugPin(a, sa), pb = plugPin(b, sb), len = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) * 1.25 + 2;
      const c = newCable([pa, pb], len); c.ends = [{ dev: a.id, sock: sa }, { dev: b.id, sock: sb }];
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
    if (!probs.length) {
      have++;
      if (have >= (M.m.rounds || 1)) { have = 0; finishMission(); toast('Everything works, with no mistakes.', 'good'); }
      else toast('Everything works, with no mistakes. ' + have + ' of ' + M.m.rounds + ' clean networks.', 'good');
    } else { have = 0; toast('Not this time: this network does not count.', 'bad'); }
    drawAll();
  }
  function checkPredict() {
    if (S.jobs.some((p, i) => !M.picks[i])) { toast('Choose Yes or No for every job first.', 'hint'); return; }
    M.predAns = S.jobs.map(p => !!route(p[0], p[1])); M.predWhy = S.jobs.map(p => why(p[0], p[1]));
    const wrong = S.jobs.filter((p, i) => (M.picks[i] === 'Yes') !== M.predAns[i]).length;
    M.predicted = true;
    log.add(M.m.title + ' predictions: ' + (wrong ? wrong + ' wrong' : 'all right'), !wrong);
    if (wrong) { have = 0; M.phase = 'checked'; M.probs = null; toast('Not this time: this network does not count. Read why for each red job.', 'bad'); }
    else { M.phase = 'build'; toast('All three predictions right. Now fix it.', 'good'); }
    drawAll();
  }

  // ---- the mission sheet (right) and Walk me through it
  function drawPanel() {
    const t = $('mission'), m = M.m;
    t.hidden = false; t.innerHTML = '';
    const tabs = el('div', { class: 'tabs', role: 'group', 'aria-label': 'Missions' });
    MISSIONS.forEach((x, i) => {
      const open = i === 0 || done[i - 1] || done[i];
      const b = el('button', { type: 'button', 'aria-pressed': String(i === missionAt), title: x.title }, (done[i] ? '&#10003; ' : '') + (i + 1));
      b.disabled = !open;
      b.addEventListener('click', () => { have = 0; start(i); });
      tabs.appendChild(b);
    });
    t.appendChild(tabs);
    t.appendChild(el('div', { class: 'head' }, '<span>' + m.group + '</span><span>Mission ' + (missionAt + 1) + ' of ' + MISSIONS.length + '</span>'));
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
      if (M.phase === 'predict' || M.predicted) {
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
        t.appendChild(list);
      }
    }
    if (M.phase === 'checked' && M.probs && M.probs.length) t.appendChild(el('ul', { class: 'probs' }, M.probs.slice(0, 5).map(p => '<li>' + p + '</li>').join('')));
    if (M.phase === 'done') t.appendChild(el('p', { class: 'win' }, 'Mission complete! ' + (m.end || '')));
    const act = el('div', { class: 'actions' });
    if (M.phase === 'done') act.appendChild(missionAt < MISSIONS.length - 1 ? btn('Next mission', 'go', () => start(missionAt + 1)) : btn('Play again', 'go', () => start(missionAt)));
    else if (M.phase === 'checked') act.appendChild(btn(m.type === 'fix' ? 'New network' : 'Try again', 'go', () => start(missionAt)));
    else if (M.phase === 'predict') act.appendChild(btn('Check my predictions', 'go', checkPredict));
    else if (m.type !== 'tutorial') act.appendChild(btn('Check my network', 'go', checkMission));
    if (m.type === 'tutorial' && M.phase === 'build') act.appendChild(btn('Start again', '', () => start(missionAt)));
    act.appendChild(btn('Walk me through it', '', walkMe));
    t.appendChild(act);
    if (M.phase === 'done' || M.phase === 'checked') t.scrollTop = t.scrollHeight;   // the result and its button in view
    $('step').textContent = 'Mission ' + (missionAt + 1) + ' of ' + MISSIONS.length;
  }
  function walkMe() {
    M.walked = true;
    const keep = S, m = M.m; let steps = [];
    if (m.walk) steps = m.walk();
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
    clock = ts / 1000;
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0.016; last = ts;
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
  if (/[?&]debug/.test(location.search)) window.__solo = { get S() { return S; }, get M() { return M; }, get anim() { return anim || fx; }, startMessage, stepAnim, pos, hands, setHand, start, send, CRATES, plugPin, cables: () => cables3, handPos, centre, fits, shelfReachable, free, solidAt, grabTarget, get glowing() { return glowPool.filter(x => x.visible).length; }, get outlined() { return outlineG.children.length; }, enqueue, guideTarget, get arrows() { return arrows.count; }, get view() { return view; }, carried, toastText: () => $("toast").textContent, get done() { return done; }, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, step: n => { for (let i = 0; i < n; i++) { tickNo++; stepCables(); for (let k = 0; k < 2; k++) if (hands[k].dev) carryDevice(k); } drawCables(); }, checkMission, checkPredict, route };
  return { stop() { view?.destroy(); view = null; } };
}
