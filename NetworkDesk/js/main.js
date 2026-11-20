// Network Help Desk on the site: the student's page, ported from the LAN party game (mp4party helpdesk main.js).
// The office (office3d.js) holds two screens this file draws on: the phone (calls to the customer, Supplies, the
// Building Manager, the Internet Company and the Tech Lead) and the computer (the customer's network: plug cables,
// move things, Test, the Search app for lesson 2.4, and the score when a job is done). desk.js runs the game (with the
// shell, or as a practice desk); this page draws and passes on what the student does. Drawing runs on
// requestAnimationFrame, but nothing waits on a frame: the site preloads apps in hidden frames, where it never fires.
import { createOffice, MON_W, MON_H, PH_W, PH_H } from './office3d.js';
import { portrait, device, deviceColour, CAST } from './art.js';
import { createGuide } from './guide.js';
import { createDesk, whoami, results, framed } from './desk.js';
const ND = window.NetDesk;

const $ = id => document.getElementById(id);
var monDirty = true, phDirty = true;
const office = createOffice($('office'), { monitor: (...a) => { monDirty = true; return onMonitor(...a); }, phone: (...a) => { phDirty = true; return onPhone(...a); }, mode: (...a) => { monDirty = phDirty = true; return onMode(...a); } });
const mg = office.monCanvas.getContext('2d'), pg = office.phCanvas.getContext('2d');
let S = null;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// ---------------------------------------------------------------- sound (made here, no files)
let actx = null;
function beep(freqs, dur = 0.12, type = 'sine', vol = 0.08) {
  try {
    actx = actx || new AudioContext();
    freqs.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, actx.currentTime + i * dur); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (i + 1) * dur); o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * dur); o.stop(actx.currentTime + (i + 1) * dur + 0.02); });
  } catch (e) { }
}
let ringTimer = 0;
function ring(on) { office.ring(on); clearInterval(ringTimer); if (on) { const r = () => beep([784, 659, 784, 659], 0.11, 'triangle', 0.06); r(); ringTimer = setInterval(r, 1800); } }

// ---------------------------------------------------------------- the game (desk.js) and what the screens are drawn from
const params = new URLSearchParams(location.search);
let desk = null, myName = '', localTest = null, openId = null;
addEventListener('message', e => {
  const d = e.data; if (!d || d.type !== 'BC_IDENTITY') return;
  if (d.name) { myName = String(d.name).split(' ')[0]; office.drawPlate(myName); }
  if (d.isTeacher) $('resultsBtn').hidden = false;
});
function send(o) {
  if (!desk) return;
  monDirty = phDirty = true;
  switch (o.type) {
    case 'ask': desk.ask(o.q); break;
    case 'call': desk.call(o.to, o.text); break;
    case 'act': { localTest = null; const why = desk.act(o); if (why && why !== '?') { toast(why); beep([220], 0.15, 'square', 0.04); } break; }
    case 'test': { const g = desk.state; if (g && g.job) { const r = ND.test(g.job, o.from, o.to); localTest = { ok: r.ok, text: r.why, path: r.path }; render(); } break; }
    case 'fixed': desk.fixed(); break;
    case 'search': openId = null; desk.search(o.q); break;
    case 'open': {
      const g = desk.state, last = g && g.job.searches.length ? g.job.searches[g.job.searches.length - 1] : null;
      if (o.id === '' || (last && SearchEngine.search(last).results.some(h => h.page.id === o.id))) openId = o.id || null;
      render(); break;
    }
    case 'tell': desk.tell(o.text); break;
    case 'explain': desk.explain(o.text); break;
    case 'next': openId = null; localTest = null; desk.next(); break;
  }
}
// The party server's screen state, built from the game here.
function resultsOf(q) { const r = SearchEngine.search(q); return { q, keys: r.read.keys, small: r.read.small, unknown: r.read.unknown, results: r.results.slice(0, 8).map(h => ({ id: h.page.id, title: h.page.title, url: h.page.url, text: h.page.text })) }; }
function searchView(g) {
  const j = g.job, c = ND.caseOf(j), mine = j.searches.length ? j.searches[j.searches.length - 1] : null, page = openId ? SearchEngine.page(openId) : null;
  return {
    theirs: resultsOf(c.query), mine: mine == null ? null : resultsOf(mine), mineWhy: mine == null ? null : ND.whyNotGood(j, mine),
    open: page ? { id: page.id, title: page.title, url: page.url, text: page.text } : null,
    example: g.jobNo < 2 ? { terms: c.good, target: c.target, want: c.want, tell: 'The answer is ' + c.answer + '. Type: ' + c.good, why: ND.whyExample(c.fault) } : null,
  };
}
function view() {
  const g = desk && desk.state; if (!g) return null;
  const j = g.job, t = desk.totals || { points: 0, jobs: 0 };
  return {
    phase: g.phase, lesson: g.lesson,
    me: { name: myName, points: t.points || 0, jobs: t.jobs || 0, techCalls: g.techCalls, wrong: g.wrongOrders, tutorial: g.phase === 'scored' ? (g.jobNo <= 2 ? g.jobNo : 0) : (g.jobNo < 2 ? g.jobNo + 1 : 0) },
    job: !j ? null : {
      business: j.business, kind: j.kind, customer: { name: j.customerName, role: j.customerRole, look: j.look },
      rooms: j.rooms, hole: j.gaps.length > 0 && j.openGaps.indexOf(j.gaps[0]) >= 0, wall: j.rooms.length > 1 ? j.rooms[1].x0 : 0,
      devices: j.devices.map(d => Object.assign({}, d, { ports: ND.ports(d.kind), used: ND.used(j, d.id) })), cables: j.cables,
      stock: Object.fromEntries(Object.entries(j.stock).filter(([, n]) => n > 0)), lineOn: j.lineOn, range: ND.WIFI_RANGE,
      search: j.caseId ? searchView(g) : null,
    },
    chats: g.chats, busy: desk.busy, questions: ND.questionsFor(g.lesson), offices: ND.officesFor(g.lesson),
    test: localTest, score: g.score, board: desk.board ? desk.board.rows : [],
  };
}
function render() { monDirty = phDirty = true; const m = view(); if (m) onState(m); }
let lastJob = '', lastCounts = {}, lastPhase = '';
function onState(m) {
  const prev = S; S = m;
  office.drawPlate(m.me.name || 'Help Desk');
  office.setNotes(m.lesson === '2.4' ? ['Few key\nwords!', 'Spell it\nright'] : ['Test!', 'Call\nSupplies']);
  office.drawBoard(m.board, desk.mode === 'local' ? 'Sign in for your class board' : desk.board ? desk.board.title : '');
  const jobKey = m.job ? m.job.business + ':' + (m.chats.customer || [])[0]?.text : '';
  if (m.phase === 'job' && jobKey !== lastJob && (m.chats.customer || []).length === 1) { lastJob = jobKey; phone.screen = 'incoming'; ring(true); }
  // a new message or delivery: a sound
  for (const [who, list] of Object.entries(m.chats || {})) {
    const n = list.length, was = lastCounts[who] || 0;
    if (prev && n > was) { const lastMsg = list[n - 1]; if (lastMsg.who === 'note') beep([330, 440], 0.09, 'triangle'); else if (lastMsg.who === 'them') beep([880], 0.07, 'sine', 0.05); if (phone.screen === 'chat:' + who) phone.scroll = 1e9; }
    lastCounts[who] = n;
  }
  if (m.phase === 'scored' && lastPhase !== 'scored') { beep([523, 659, 784, 1046], 0.12, 'triangle', 0.07); office.setMode('monitor'); }
  if (m.phase === 'loading' && lastPhase !== 'loading') { phone.screen = 'home'; map.sel = null; map.test = null; }
  lastPhase = m.phase;
  if (m.test && (!prev || JSON.stringify(prev.test) !== JSON.stringify(m.test))) { map.anim = { path: m.test.path || [], t0: performance.now(), ok: m.test.ok }; beep(m.test.ok ? [660, 880] : [300, 200], 0.1, 'triangle', 0.05); }
}
let toastMsg = '', toastAt = 0;
function toast(t) { toastMsg = t; toastAt = performance.now(); }
function onMode(m) {
  $('hint').textContent = m === 'desk' ? 'Click the computer to work on the network. Click the phone to make calls.' : m === 'monitor' ? 'Plug cables, move things, Test. Click away from the screen or press Esc to sit back.' : 'Tap a contact to call. Click away from the phone or press Esc to put it down.';
  if (m !== 'phone') input.blur();
}
addEventListener('keydown', e => { if (e.key === 'Escape' && !guide.on) { office.setMode('desk'); input.blur(); } });

// ---------------------------------------------------------------- drawing helpers
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
let hits = { phone: [], monitor: [] };
const RECT = { phone: {}, monitor: {} };   // named things on each screen, for the guide
function hit(where, x, y, w, h, fn, extra) { hits[where].push(Object.assign({ x, y, w, h, fn }, extra || {})); }
function find(where, x, y) { const l = hits[where]; for (let i = l.length - 1; i >= 0; i--) { const r = l[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r; } return null; }

// ---------------------------------------------------------------- the phone
const phone = { screen: 'home', scroll: 0, hover: null, maxScroll: 0 };
const input = $('typing');
input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendTyped(); } if (e.key === 'Escape' && !guide.on) { input.blur(); office.setMode('desk'); } e.stopPropagation(); });
$('sendBtn').addEventListener('click', () => { sendTyped(); input.focus(); });
function contacts() {
  if (!S) return [];
  const o = [];
  if (S.job) o.push({ id: 'customer', name: S.job.customer.name, sub: S.job.business, look: S.job.customer.look, badge: S.phase === 'job' || S.phase === 'explain' });
  for (const of of S.offices) o.push({ id: of.id, name: of.person, sub: of.name, look: of.look });
  return o;
}
function drawPhone() {
  const g = pg, W = PH_W, H = PH_H; hits.phone = []; RECT.phone = {};
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b2250'); bg.addColorStop(1, '#5a3a8a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // status bar
  g.fillStyle = '#ffffff'; g.font = `600 26px ${FONT}`; g.textBaseline = 'middle';
  const d = new Date(); g.fillText(d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'), 34, 34);
  g.fillRect(W - 82, 24, 46, 22); g.fillStyle = '#2b2250'; g.fillRect(W - 78, 28, 30, 14); g.fillStyle = '#7dffa8'; g.fillRect(W - 78, 28, 24, 14);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) g.fillRect(W - 140 + i * 9, 40 - i * 6, 6, 6 + i * 6);
  if (!S) { g.fillStyle = '#fff'; g.font = `700 34px ${FONT}`; g.textAlign = 'center'; g.fillText('Connecting...', W / 2, H / 2); g.textAlign = 'left'; return; }
  const scr = phone.screen;
  if (scr === 'incoming' && S.job) return drawIncoming(g, W, H);
  if (scr.startsWith('chat:')) return drawChat(g, W, H, scr.slice(5));
  // home: points, then the contacts
  g.fillStyle = 'rgba(255,255,255,0.12)'; rr(g, 24, 70, W - 48, 120, 28); g.fill();
  g.fillStyle = '#ffd166'; g.font = `900 54px ${FONT}`; g.fillText(String(S.me.points), 52, 128);
  g.fillStyle = '#e8e0ff'; g.font = `600 24px ${FONT}`; g.fillText('points   ' + S.me.jobs + ' job' + (S.me.jobs === 1 ? '' : 's') + ' fixed', 52, 168);
  g.fillStyle = '#ffffff'; g.font = `800 34px ${FONT}`; g.fillText('Calls', 30, 232);
  let y = 262;
  for (const c of contacts()) {
    const hov = phone.hover === c.id;
    g.fillStyle = hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'; rr(g, 24, y, W - 48, 118, 26); g.fill();
    portrait(g, c.look, 40, y + 14, 90, c.id === 'customer' && S.phase === 'job' ? 'worried' : c.id === 'customer' ? 'happy' : 'calm');
    g.fillStyle = '#ffffff'; g.font = `800 32px ${FONT}`; g.fillText(c.name, 150, y + 46);
    g.fillStyle = '#d6ccff'; g.font = `500 24px ${FONT}`; g.fillText(c.sub, 150, y + 84);
    if (c.badge) { g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(W - 64, y + 59, 18, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `900 24px ${FONT}`; g.textAlign = 'center'; g.fillText('!', W - 64, y + 60); g.textAlign = 'left'; }
    if (c.id === 'tech' && S.me.techCalls) { g.fillStyle = '#ffd166'; g.font = `600 20px ${FONT}`; g.fillText('Calls this job: ' + S.me.techCalls, 150, y + 108); }
    const id = c.id; hit('phone', 24, y, W - 48, 118, () => openChat(id), { hov: id }); RECT.phone['contact_' + id] = { x: 24, y, w: W - 48, h: 118 };
    y += 132;
  }
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = `500 22px ${FONT}`;
  wrap(g, 'Calling Alex, the Tech Lead, helps when you are stuck, but each call lowers the points for this job.', W - 70).forEach((l, i) => g.fillText(l, 34, y + 26 + i * 30));
}
function drawIncoming(g, W, H) {
  const j = S.job, t = performance.now() / 1000;
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 60, W, H - 60);
  g.fillStyle = '#ffffff'; g.font = `600 30px ${FONT}`; g.textAlign = 'center'; g.fillText('Incoming call', W / 2, 150);
  const s = 260 + Math.sin(t * 6) * 8;
  g.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(t * 6)) + ')'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, 360, s / 2 + 22, 0, 7); g.stroke();
  portrait(g, j.customer.look, W / 2 - s / 2, 360 - s / 2, s, 'worried');
  g.fillStyle = '#ffffff'; g.font = `800 46px ${FONT}`; g.fillText(j.customer.name, W / 2, 590);
  g.fillStyle = '#d6ccff'; g.font = `500 30px ${FONT}`; g.fillText(j.business, W / 2, 636);
  // answer button
  const by = 860; g.fillStyle = '#2fbf71'; g.beginPath(); g.arc(W / 2, by, 74, 0, 7); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.arc(W / 2, by + 4, 30, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  g.fillStyle = '#ffffff'; g.font = `700 28px ${FONT}`; g.fillText('Answer', W / 2, by + 118);
  g.textAlign = 'left';
  hit('phone', W / 2 - 80, by - 80, 160, 160, () => { ring(false); openChat('customer'); beep([440, 660], 0.08); }); RECT.phone.answer = { x: W / 2 - 80, y: by - 80, w: 160, h: 160 };
}
function personOf(who) {
  if (who === 'customer') return { name: S.job.customer.name, sub: S.job.business, look: S.job.customer.look };
  const o = S.offices.find(x => x.id === who); return { name: o.person, sub: o.name, look: o.look };
}
function drawChat(g, W, H, who) {
  const p = personOf(who), list = S.chats[who] || [], busy = S.busy.includes(who);
  // header
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 60, W, 120);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(52, 102); g.lineTo(36, 120); g.lineTo(52, 138); g.stroke();
  hit('phone', 0, 60, 90, 120, () => { phone.screen = 'home'; input.blur(); }); RECT.phone.back = { x: 0, y: 60, w: 90, h: 120 };
  const mood = who === 'customer' ? (S.phase === 'scored' || S.phase === 'explain' ? 'happy' : 'worried') : busy ? 'talk' : 'calm';
  portrait(g, p.look, 92, 74, 92, mood);
  g.fillStyle = '#fff'; g.font = `800 32px ${FONT}`; g.fillText(p.name, 200, 108); g.fillStyle = '#d6ccff'; g.font = `500 24px ${FONT}`; g.fillText(p.sub, 200, 146);
  // the bottom: what you can do
  const s24 = S.lesson === '2.4';
  const bottomH = who === 'customer' ? (S.phase === 'job' ? (s24 ? 200 : 330) : S.phase === 'explain' ? 170 : 0) : 170;
  const top = 190, bottom = H - bottomH - 20;
  // the messages, scrollable
  g.save(); g.beginPath(); g.rect(0, top, W, bottom - top); g.clip();
  g.font = `500 26px ${FONT}`;
  const items = list.map(m => { const lines = wrap(g, m.text, m.who === 'note' ? W - 120 : W - 170); return { m, lines, h: lines.length * 34 + (m.who === 'note' ? 22 : 34) }; });
  let total = items.reduce((a, it) => a + it.h + 16, 0) + (busy ? 80 : 0);
  phone.maxScroll = Math.max(0, total - (bottom - top) + 20);
  phone.scroll = Math.max(0, Math.min(phone.maxScroll, phone.scroll));
  let y = top + 16 - phone.scroll;
  for (const it of items) {
    const me = it.m.who === 'me', note = it.m.who === 'note';
    const w = Math.max(...it.lines.map(l => g.measureText(l).width)) + 44, x = note ? (W - w) / 2 : me ? W - 30 - w : 30;
    g.fillStyle = note ? 'rgba(255, 209, 102, 0.95)' : me ? '#5cc8ff' : '#ffffff'; rr(g, x, y, w, it.h, 26); g.fill();
    g.fillStyle = note ? '#3a2a00' : '#1d1a26'; g.font = note ? `700 24px ${FONT}` : `500 26px ${FONT}`;
    it.lines.forEach((l, i) => g.fillText(l, x + 22, y + 32 + i * 34));
    y += it.h + 16;
  }
  if (busy) { g.fillStyle = '#ffffff'; rr(g, 30, y, 120, 60, 26); g.fill(); const t = performance.now() / 300; for (let i = 0; i < 3; i++) { g.fillStyle = '#8a84a0'; g.beginPath(); g.arc(62 + i * 28, y + 30 + Math.sin(t + i) * 5, 8, 0, 7); g.fill(); } }
  g.restore();
  // what you can do
  if (who === 'customer' && S.phase === 'job') {
    let qy = H - bottomH;
    S.questions.forEach((q, i) => {
      const x = 24 + (i % 2) * ((W - 60) / 2 + 12), yy = qy + Math.floor(i / 2) * 92, w = (W - 60) / 2;
      g.fillStyle = phone.hover === 'q' + q.id ? '#ffffff' : 'rgba(255,255,255,0.85)'; rr(g, x, yy, w, 80, 20); g.fill();
      g.fillStyle = '#2b2250'; g.font = `700 22px ${FONT}`; wrap(g, q.label, w - 30).forEach((l, k) => g.fillText(l, x + 16, yy + 30 + k * 26));
      hit('phone', x, yy, w, 80, () => send({ type: 'ask', q: q.id }), { hov: 'q' + q.id }); RECT.phone['q_' + q.id] = { x, y: yy, w, h: 80 };
    });
    if (s24) return;   // lesson 2.4: the pupil types the answer and the search terms in the box under the phone
    const fy = H - 140; g.fillStyle = '#2fbf71'; rr(g, 24, fy, W - 48, 100, 30); g.fill();
    g.fillStyle = '#ffffff'; g.font = `800 32px ${FONT}`; g.textAlign = 'center'; g.fillText('It is fixed. Please try it!', W / 2, fy + 52); g.textAlign = 'left';
    hit('phone', 24, fy, W - 48, 100, () => send({ type: 'fixed' })); RECT.phone.fixed = { x: 24, y: fy, w: W - 48, h: 100 };
  } else if (bottomH) drawTyping(g, W, H, who === 'customer' ? 'Explain what was wrong...' : who === 'tech' ? 'Ask Alex for help...' : 'Say what you need, and why...', busy);
}
function drawTyping(g, W, H, ph, busy) {
  const y = H - 150, focused = document.activeElement === input;
  g.fillStyle = '#ffffff'; rr(g, 24, y, W - 160, 110, 28); g.fill();
  if (focused) { g.strokeStyle = '#5cc8ff'; g.lineWidth = 5; rr(g, 24, y, W - 160, 110, 28); g.stroke(); }
  const text = input.value; g.font = `500 26px ${FONT}`;
  const lines = wrap(g, text || ph, W - 210).slice(-3);
  g.fillStyle = text ? '#1d1a26' : '#8a84a0'; lines.forEach((l, i) => g.fillText(l, 46, y + 32 + i * 30 + (3 - lines.length) * 15));
  if (focused && Math.floor(performance.now() / 500) % 2) { const lw = text ? g.measureText(lines[lines.length - 1]).width : 0; g.fillStyle = '#1d1a26'; g.fillRect(48 + lw, y + 16 + (lines.length - 1) * 30 + (3 - lines.length) * 15, 3, 30); }
  hit('phone', 24, y, W - 160, 110, () => { input.focus(); });
  g.fillStyle = busy || !text.trim() ? '#7b7396' : '#5cc8ff'; g.beginPath(); g.arc(W - 78, y + 55, 52, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(W - 100, y + 32); g.lineTo(W - 50, y + 55); g.lineTo(W - 100, y + 78); g.lineTo(W - 92, y + 55); g.closePath(); g.fill();
  hit('phone', W - 130, y, 110, 110, sendTyped);
}
function sendTyped() {
  const who = phone.screen.startsWith('chat:') ? phone.screen.slice(5) : null, text = input.value.trim();
  if (!who || !text || !S || S.busy.includes(who)) return;
  if (who === 'customer') { if (S.phase === 'explain') send({ type: 'explain', text }); else if (S.lesson === '2.4' && S.phase === 'job') send({ type: 'tell', text }); else return; }
  else send({ type: 'call', to: who, text });
  input.value = ''; phone.scroll = 1e9;
}
function openChat(who) { phone.screen = 'chat:' + who; phone.scroll = 1e9; input.value = ''; if (who !== 'customer' || S.phase === 'explain') setTimeout(() => input.focus(), 50); }
function onPhone(type, x, y, e) {
  if (type === 'wheel') { phone.scroll += x; return; }
  const h = find('phone', x, y);
  if (type === 'hover') { phone.hover = h && h.hov || null; return; }
  if (type === 'down' && h) { beep([1200], 0.03, 'sine', 0.03); h.fn(); }
}

// ---------------------------------------------------------------- the computer: the customer's network
const MAP = { x: 24, y: 96, w: 860, h: 540 }, UNIT = Math.min(MAP.w / 32, MAP.h / 20);
const toPx = (x, y) => [MAP.x + x * UNIT, MAP.y + y * UNIT], toUnit = (px, py) => [(px - MAP.x) / UNIT, (py - MAP.y) / UNIT];
const map = { tool: 'cable', drag: null, hover: null, sel: null, test: null, anim: null, pointer: [0, 0] };
function devAt(px, py) { if (!S || !S.job) return null; let best = null, bd = 40; for (const d of S.job.devices) { const [x, y] = toPx(d.x, d.y), dd = Math.hypot(px - x, py - y + 6); if (dd < bd) { bd = dd; best = d; } } return best; }
function cableAt(px, py) {
  if (!S || !S.job) return null; let best = null, bd = 12;
  for (const c of S.job.cables) {
    const a = S.job.devices.find(d => d.id === c.a), b = S.job.devices.find(d => d.id === c.b); if (!a || !b) continue;
    const [ax, ay] = toPx(a.x, a.y), [bx, by] = toPx(b.x, b.y);
    for (let i = 0; i <= 20; i++) { const [qx, qy] = curve(ax, ay, bx, by, i / 20); const dd = Math.hypot(px - qx, py - qy); if (dd < bd) { bd = dd; best = c; } }
  }
  return best;
}
function curve(ax, ay, bx, by, t) { const mx = (ax + bx) / 2, my = Math.max(ay, by) + 30 + Math.abs(ax - bx) * 0.08; const u = 1 - t; return [u * u * ax + 2 * u * t * mx + t * t * bx, u * u * ay + 2 * u * t * my + t * t * by]; }
function drawMonitor() {
  const g = mg, W = MON_W, H = MON_H; hits.monitor = []; RECT.monitor = {};
  // the desktop
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#1f2a44'); bg.addColorStop(1, '#2d1f44'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#141b2e'; g.fillRect(0, 0, W, 64);
  g.fillStyle = '#ff8f3f'; g.beginPath(); g.arc(36, 32, 16, 0, 7); g.fill(); g.fillStyle = '#141b2e'; g.font = `900 20px ${FONT}`; g.textAlign = 'center'; g.fillText('N', 36, 39); g.textAlign = 'left';
  g.fillStyle = '#ffffff'; g.font = `800 28px ${FONT}`; g.fillText('NetDesk', 64, 42);
  g.fillStyle = '#9fb0d8'; g.font = `600 22px ${FONT}`; g.fillText(S && S.job ? S.job.business + (S.lesson === '2.4' ? ': Search' : ': their network') : '', 200, 41);
  g.textAlign = 'right'; g.fillStyle = '#ffd166'; g.font = `800 24px ${FONT}`; g.fillText(S ? S.me.points + ' points' : '', W - 30, 41); g.textAlign = 'left';
  if (!S || !S.job || S.phase === 'loading') {
    g.fillStyle = '#d6dcf0'; g.font = `700 40px ${FONT}`; g.textAlign = 'center'; g.fillText('Waiting for the next call...', W / 2, H / 2); g.font = `500 26px ${FONT}`; g.fillStyle = '#9fb0d8'; g.fillText('Keep your phone close.', W / 2, H / 2 + 50); g.textAlign = 'left';
    return;
  }
  const j = S.job;
  if (j.search) { drawSearchApp(g, W, H, j); if (S.phase === 'scored' && S.score) drawScore(g, W, H); return; }
  // ---- the floor plan
  g.fillStyle = '#0e1424'; rr(g, MAP.x - 8, MAP.y - 8, MAP.w + 16, MAP.h + 16, 18); g.fill();
  j.rooms.forEach((r, i) => {
    const [x0, y0] = toPx(r.x0, r.y0), [x1, y1] = toPx(r.x1, r.y1);
    g.fillStyle = i === 0 ? '#e8d3b3' : '#cfdbe6'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.strokeStyle = i === 0 ? 'rgba(160,110,60,0.18)' : 'rgba(80,110,140,0.15)'; g.lineWidth = 1;
    if (i === 0) for (let yy = y0 + 18; yy < y1; yy += 18) { g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke(); }
    else for (let xx = x0; xx < x1; xx += 36) for (let yy = y0; yy < y1; yy += 36) g.strokeRect(xx, yy, 36, 36);
    g.fillStyle = 'rgba(30,30,50,0.55)'; g.font = `800 22px ${FONT}`; g.fillText(r.name.toUpperCase(), x0 + 14, y0 + 30);
  });
  // the wall between the rooms, with or without a cable hole
  const [wx] = toPx(j.wall, 0);
  g.fillStyle = '#3b3550'; g.fillRect(wx - 6, MAP.y, 12, MAP.h);
  const [, hy] = toPx(0, 10);
  if (j.hole) { g.fillStyle = '#ffd166'; g.beginPath(); g.arc(wx, hy, 13, 0, 7); g.fill(); g.fillStyle = '#3b3550'; g.beginPath(); g.arc(wx, hy, 7, 0, 7); g.fill(); }
  else { g.fillStyle = 'rgba(20,20,30,0.7)'; rr(g, wx - 70, hy - 18, 140, 36, 10); g.fill(); g.fillStyle = '#ffffff'; g.font = `700 16px ${FONT}`; g.textAlign = 'center'; g.fillText('No cable hole', wx, hy + 6); g.textAlign = 'left'; }
  // Wi-Fi range
  for (const d of j.devices.filter(d => d.kind === 'wifi')) { const [x, y] = toPx(d.x, d.y); g.strokeStyle = 'rgba(245,159,48,0.55)'; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.arc(x, y, j.range * UNIT, 0, 7); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(245,159,48,0.07)'; g.fill(); }
  // cables
  for (const c of j.cables) {
    const a = j.devices.find(d => d.id === c.a), b = j.devices.find(d => d.id === c.b); if (!a || !b) continue;
    const [ax, ay] = toPx(a.x, a.y), [bx, by] = toPx(b.x, b.y), sel = map.sel === c.id, hov = map.hover === 'c' + c.id;
    g.beginPath(); for (let i = 0; i <= 24; i++) { const [qx, qy] = curve(ax, ay, bx, by, i / 24); i ? g.lineTo(qx, qy) : g.moveTo(qx, qy); }
    g.lineCap = 'round'; g.strokeStyle = '#141826'; g.lineWidth = sel ? 13 : 10; g.stroke();
    g.strokeStyle = c.broken ? '#ff4d4d' : sel ? '#ffffff' : hov ? '#9fe8ff' : '#4fb8ff'; g.lineWidth = sel ? 7 : 5;
    if (c.broken) g.setLineDash([14, 10]); g.stroke(); g.setLineDash([]);
    if (c.broken) { const [mx, my] = curve(ax, ay, bx, by, 0.5); g.fillStyle = '#ff4d4d'; g.beginPath(); g.arc(mx, my, 14, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(mx - 6, my - 6); g.lineTo(mx + 6, my + 6); g.moveTo(mx + 6, my - 6); g.lineTo(mx - 6, my + 6); g.stroke(); }
  }
  // the cable being dragged
  if (map.drag && map.drag.kind === 'cable') { const a = j.devices.find(d => d.id === map.drag.from), [ax, ay] = toPx(a.x, a.y); g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(ax, ay); g.lineTo(...map.pointer); g.stroke(); g.setLineDash([]); }
  // devices
  for (const d of j.devices) {
    if (map.drag && map.drag.kind === 'move' && map.drag.id === d.id) continue;
    const [x, y] = toPx(d.x, d.y), hov = map.hover === d.id || (map.test && map.test.from === d.id);
    if (hov) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x, y, 38, 0, 7); g.fill(); }
    if (d.loose) { g.strokeStyle = '#ff8f3f'; g.setLineDash([6, 6]); g.lineWidth = 3; g.beginPath(); g.arc(x, y, 40, 0, 7); g.stroke(); g.setLineDash([]); }
    device(g, d.kind, x, y, 62, { on: true, used: d.used });
    g.font = `700 15px ${FONT}`; g.textAlign = 'center';
    const label = d.name + (d.kind.startsWith('switch') ? '  (' + d.used + '/' + d.ports + ')' : '');
    const lw = g.measureText(label).width + 14; g.fillStyle = d.customer ? 'rgba(255,255,255,0.92)' : 'rgba(255,209,102,0.95)'; rr(g, x - lw / 2, y + 30, lw, 24, 8); g.fill();
    g.fillStyle = '#1d1a26'; g.fillText(label, x, y + 47); g.textAlign = 'left';
  }
  // the dragged thing follows the pointer
  if (map.drag && (map.drag.kind === 'move' || map.drag.kind === 'place')) { g.globalAlpha = 0.8; device(g, map.drag.kind === 'move' ? j.devices.find(d => d.id === map.drag.id).kind : map.drag.item, map.pointer[0], map.pointer[1], 62, { on: true }); g.globalAlpha = 1; }
  // a test message travelling
  if (map.anim && map.anim.path.length > 1) {
    const t = (performance.now() - map.anim.t0) / 600, seg = Math.min(map.anim.path.length - 1.001, t), i = Math.floor(seg), f = seg - i;
    const A = j.devices.find(d => d.id === map.anim.path[i]), B = j.devices.find(d => d.id === map.anim.path[i + 1]);
    if (A && B) { const [ax, ay] = toPx(A.x, A.y), [bx, by] = toPx(B.x, B.y), [qx, qy] = curve(ax, ay, bx, by, f); g.fillStyle = '#ffffff'; rr(g, qx - 16, qy - 11, 32, 22, 4); g.fill(); g.strokeStyle = '#1d1a26'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(qx - 16, qy - 11); g.lineTo(qx, qy + 2); g.lineTo(qx + 16, qy - 11); g.stroke(); }
  }
  hit('monitor', MAP.x, MAP.y, MAP.w, MAP.h, null, { map: true });
  // ---- the side panel
  const px = 912, pw = W - px - 24;
  g.fillStyle = '#141b2e'; rr(g, px, 84, pw, H - 108, 18); g.fill();
  // tools
  const tools = [['cable', 'Plug in cables'], ['move', 'Move things'], ['test', 'Test']];
  tools.forEach(([id, label], i) => {
    const x = px + 14 + i * ((pw - 28) / 3), w = (pw - 28) / 3 - 8, on = map.tool === id;
    g.fillStyle = on ? '#ff8f3f' : '#25304d'; rr(g, x, 100, w, 64, 14); g.fill();
    g.fillStyle = on ? '#1d1a26' : '#d6dcf0'; g.font = `800 18px ${FONT}`; g.textAlign = 'center'; wrap(g, label, w - 10).forEach((l, k, a) => g.fillText(l, x + w / 2, 128 + k * 22 - (a.length - 1) * 11)); g.textAlign = 'left';
    hit('monitor', x, 100, w, 64, () => { map.tool = id; map.test = null; map.sel = null; }); RECT.monitor['tool_' + id] = { x, y: 100, w, h: 64 };
  });
  let y = 196;
  g.fillStyle = '#9fb0d8'; g.font = `600 18px ${FONT}`;
  const help = { cable: 'Drag from one thing to another to plug a cable between them. Click a cable to choose it.', move: 'Drag your things (yellow labels) to move them. Drag one onto Delivered to put it away.', test: 'Click a thing to send from, then a thing to send to.' }[map.tool];
  wrap(g, help, pw - 36).forEach(l => { g.fillText(l, px + 18, y); y += 24; });
  y += 10;
  if (map.tool === 'test' && j.devices.some(d => d.kind === 'socket')) {
    const from = map.test && map.test.from;
    g.fillStyle = from ? '#7d5bd6' : '#3a3550'; rr(g, px + 18, y, pw - 36, 48, 12); g.fill(); g.fillStyle = '#fff'; g.font = `700 18px ${FONT}`; g.fillText(from ? 'Open a website from it' : 'Choose a thing, then test websites here', px + 32, y + 30);
    if (from) hit('monitor', px + 18, y, pw - 36, 48, () => { send({ type: 'test', from, to: 'web' }); map.test = null; });
    y += 62;
  }
  // the test result
  if (S.test) {
    g.fillStyle = S.test.ok ? '#1f6b47' : '#7a2630'; const lines = wrap(g, S.test.text, pw - 70); rr(g, px + 18, y, pw - 36, 24 + lines.length * 24, 12); g.fill();
    g.fillStyle = '#fff'; g.font = `700 18px ${FONT}`; lines.forEach((l, i) => g.fillText(l, px + 34, y + 30 + i * 24)); y += 36 + lines.length * 24;
  }
  // a chosen cable
  if (map.sel) {
    const c = j.cables.find(c => c.id === map.sel);
    if (c) { g.fillStyle = '#e8463c'; rr(g, px + 18, y, pw - 36, 52, 12); g.fill(); g.fillStyle = '#fff'; g.font = `800 20px ${FONT}`; g.fillText(c.broken ? 'Take the broken cable out' : 'Take this cable out', px + 34, y + 33); hit('monitor', px + 18, y, pw - 36, 52, () => { send({ type: 'act', op: 'unplug', id: c.id }); map.sel = null; }); RECT.monitor.takeOut = { x: px + 18, y, w: pw - 36, h: 52 }; y += 66; }
  }
  // delivered: things on your desk to use
  const trayY = Math.max(y + 8, 470);
  g.fillStyle = '#ffffff'; g.font = `800 22px ${FONT}`; g.fillText('Delivered', px + 18, trayY);
  hit('monitor', px + 10, trayY - 30, pw - 20, H - trayY + 6, null, { tray: true });
  const stock = Object.entries(j.stock || {});
  if (!stock.length) { g.fillStyle = '#7b86a8'; g.font = `500 18px ${FONT}`; wrap(g, 'Nothing yet. Phone Supplies for cables and equipment.', pw - 36).forEach((l, i) => g.fillText(l, px + 18, trayY + 34 + i * 24)); }
  stock.forEach(([k, n], i) => {
    const x = px + 18 + (i % 3) * ((pw - 36) / 3), yy = trayY + 18 + Math.floor(i / 3) * 112, w = (pw - 36) / 3 - 8;
    g.fillStyle = '#25304d'; rr(g, x, yy, w, 102, 14); g.fill();
    if (k === 'cable') { g.strokeStyle = '#4fb8ff'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(x + w / 2, yy + 42, 20, 0, Math.PI * 1.6); g.stroke(); }
    else device(g, k, x + w / 2, yy + 42, 50, { on: true });
    g.fillStyle = '#ffd166'; g.font = `800 18px ${FONT}`; g.textAlign = 'center'; g.fillText(n + ' x ' + ({ cable: 'cable', switch4: '4-socket', switch8: '8-socket', wifi: 'Wi-Fi point', router: 'router' }[k] || k), x + w / 2, yy + 92); g.textAlign = 'left';
    if (k !== 'cable') hit('monitor', x, yy, w, 102, null, { item: k });
  });
  // a message from the computer
  if (toastMsg && performance.now() - toastAt < 3500) {
    g.font = `700 22px ${FONT}`; const lines = wrap(g, toastMsg, 700); const h = 30 + lines.length * 28;
    g.fillStyle = 'rgba(20,20,32,0.92)'; rr(g, MAP.x + MAP.w / 2 - 380, MAP.y + MAP.h - h - 16, 760, h, 16); g.fill();
    g.fillStyle = '#ffd166'; lines.forEach((l, i) => g.fillText(l, MAP.x + MAP.w / 2 - 356, MAP.y + MAP.h - h + 16 + i * 28));
  }
  if (S.phase === 'scored' && S.score) drawScore(g, W, H);
}
// ---------------------------------------------------------------- lesson 2.4: the Search app
function resultRows(g, list, x, y, w, maxRows, rowH, clickable, prefix) {
  list.slice(0, maxRows).forEach((r, i) => {
    const yy = y + i * rowH, hov = clickable && map.hover === prefix + i;
    g.fillStyle = hov ? '#2e3b60' : '#1b2440'; rr(g, x, yy, w, rowH - 8, 12); g.fill();
    g.fillStyle = '#ff8f3f'; g.beginPath(); g.arc(x + 24, yy + 26, 15, 0, 7); g.fill();
    g.fillStyle = '#1d1a26'; g.font = `900 17px ${FONT}`; g.textAlign = 'center'; g.fillText(String(i + 1), x + 24, yy + 32); g.textAlign = 'left';
    g.fillStyle = '#9fd0ff'; g.font = `700 19px ${FONT}`; g.fillText(wrap(g, r.title, w - 64)[0], x + 48, yy + 30);
    g.fillStyle = '#7fd69a'; g.font = `500 14px ${FONT}`; g.fillText(r.url, x + 48, yy + 48);
    g.fillStyle = '#c4cbe0'; g.font = `500 15px ${FONT}`; const t = wrap(g, r.text, w - 64); g.fillText(t[0] + (t.length > 1 ? ' ...' : ''), x + 48, yy + rowH - 15);
    if (clickable) { const id = r.id; hit('monitor', x, yy, w, rowH - 8, () => send({ type: 'open', id }), { hov: prefix + i }); RECT.monitor[prefix + i] = { x, y: yy, w, h: rowH - 8 }; }
  });
}
function searchNotes(g, s, x, y, w) {
  const notes = [];
  if (s.small.length) notes.push(['#ffd166', 'Small words left out: ' + s.small.join(', ')]);
  if (s.unknown.length) notes.push(['#ff8a8a', 'No page has the word: ' + s.unknown.join(', ')]);
  if (!s.results.length) notes.push(['#ff8a8a', 'No results.']);
  g.font = `700 16px ${FONT}`;
  for (const [c, t] of notes) { g.fillStyle = c; for (const l of wrap(g, t, w)) { g.fillText(l, x, y); y += 22; } }
  return y;
}
function drawSearchApp(g, W, H, j) {
  const s = j.search, name = j.customer.name;
  // left: the customer's search
  const lx = 24, lw = 520;
  g.fillStyle = '#141b2e'; rr(g, lx, 84, lw, H - 108, 18); g.fill();
  g.fillStyle = '#ffffff'; g.font = `800 22px ${FONT}`; g.fillText(name + "'s search", lx + 18, 118);
  g.fillStyle = '#ffffff'; rr(g, lx + 18, 132, lw - 36, 50, 12); g.fill();
  g.fillStyle = '#1d1a26'; g.font = `600 19px ${FONT}`; g.fillText(wrap(g, s.theirs.q, lw - 70).slice(0, 1)[0] + (wrap(g, s.theirs.q, lw - 70).length > 1 ? ' ...' : ''), lx + 34, 164);
  let y = searchNotes(g, s.theirs, lx + 20, 208, lw - 40) + 6;
  g.fillStyle = '#9fb0d8'; g.font = `700 16px ${FONT}`; if (s.theirs.results.length) { g.fillText('Results, best match first:', lx + 20, y); y += 12; }
  resultRows(g, s.theirs.results, lx + 14, y, lw - 28, 6, 84, false, 'theirs');
  // right: your search
  const rx = 568, rw = W - rx - 24;
  g.fillStyle = '#141b2e'; rr(g, rx, 84, rw, H - 108, 18); g.fill();
  if (s.open) {
    g.fillStyle = '#25304d'; rr(g, rx + 18, 100, 150, 46, 12); g.fill(); g.fillStyle = '#fff'; g.font = `800 18px ${FONT}`; g.fillText('< Results', rx + 36, 130);
    hit('monitor', rx + 18, 100, 150, 46, () => send({ type: 'open', id: '' })); RECT.monitor.back = { x: rx + 18, y: 100, w: 150, h: 46 };
    g.fillStyle = '#fffdf6'; rr(g, rx + 18, 160, rw - 36, H - 200, 14); g.fill();
    g.fillStyle = '#2f8a4a'; g.font = `600 16px ${FONT}`; g.fillText(s.open.url, rx + 40, 196);
    g.fillStyle = '#221e33'; g.font = `900 30px ${FONT}`; let yy = 238; for (const l of wrap(g, s.open.title, rw - 90)) { g.fillText(l, rx + 40, yy); yy += 38; }
    g.font = `500 25px ${FONT}`; yy += 10; for (const l of wrap(g, s.open.text, rw - 90)) { g.fillText(l, rx + 40, yy); yy += 36; }
    return;
  }
  g.fillStyle = '#ffffff'; g.font = `800 22px ${FONT}`; g.fillText('Your search', rx + 18, 118);
  const typed = $('searchIn').value;
  g.fillStyle = '#ffffff'; rr(g, rx + 18, 132, rw - 36, 50, 12); g.fill(); g.strokeStyle = '#ff8f3f'; g.lineWidth = 3; rr(g, rx + 18, 132, rw - 36, 50, 12); g.stroke();
  g.fillStyle = typed ? '#1d1a26' : '#8a84a0'; g.font = `600 19px ${FONT}`; g.fillText(typed || 'Type in the orange box below the computer', rx + 34, 164);
  if (!s.mine) {
    g.fillStyle = '#9fb0d8'; g.font = `600 18px ${FONT}`;
    wrap(g, 'Type a few key words that only the page ' + name + ' wants has. Leave out small words like how, the, is, I. Then press Search and open the page.', rw - 50).forEach((l, i) => g.fillText(l, rx + 22, 222 + i * 26));
    return;
  }
  g.fillStyle = '#d6dcf0'; g.font = `600 16px ${FONT}`; g.fillText('You searched: ' + s.mine.q, rx + 20, 206);
  let y2 = searchNotes(g, s.mine, rx + 20, 232, rw - 40) + 6;
  if (s.mine.results.length) { g.fillStyle = '#9fb0d8'; g.font = `700 16px ${FONT}`; g.fillText('Click a result to open the page:', rx + 20, y2); y2 += 12; }
  resultRows(g, s.mine.results, rx + 14, y2, rw - 28, 6, 84, true, 'mine');
}
function drawScore(g, W, H) {
  const s = S.score; hits.monitor = [];
  g.fillStyle = 'rgba(10,12,24,0.78)'; g.fillRect(0, 0, W, H);
  const x = W / 2 - 330, y = 90, w = 660, h = 620;
  g.fillStyle = '#fffdf6'; rr(g, x, y, w, h, 30); g.fill();
  portrait(g, S.job.customer.look, x + 30, y + 30, 120, 'happy');
  g.fillStyle = '#221e33'; g.font = `900 46px ${FONT}`; g.fillText('Job done!', x + 176, y + 84);
  g.fillStyle = '#6a6480'; g.font = `600 24px ${FONT}`; g.fillText(S.job.business, x + 176, y + 122);
  const rows = [['Fixed the network', '+' + s.basePts + (s.tech ? '  (' + s.tech + ' Tech Lead call' + (s.tech > 1 ? 's' : '') + ')' : '')], ['Explanation', '+' + s.marks * 15 + '  (' + s.marks + ' of 2)'], ['Speed', '+' + s.speed + '  (' + s.minutes + ' min)']];
  if (s.wrong) rows.push(['Wrong orders', '-' + s.wrong * 10]);
  if (s.falseFixes) rows.push(['"It is fixed" too soon', '-' + s.falseFixes * 10]);
  let yy = y + 200;
  for (const [a, b] of rows) { g.fillStyle = '#221e33'; g.font = `700 28px ${FONT}`; g.fillText(a, x + 50, yy); g.textAlign = 'right'; g.fillText(b, x + w - 50, yy); g.textAlign = 'left'; yy += 52; }
  g.strokeStyle = '#d8d2c4'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 50, yy - 20); g.lineTo(x + w - 50, yy - 20); g.stroke();
  g.fillStyle = '#ff8f3f'; g.font = `900 44px ${FONT}`; g.fillText('Total', x + 50, yy + 34); g.textAlign = 'right'; g.fillText('+' + s.total, x + w - 50, yy + 34); g.textAlign = 'left';
  const by = y + h - 110; g.fillStyle = '#2fbf71'; rr(g, x + 120, by, w - 240, 80, 26); g.fill();
  g.fillStyle = '#fff'; g.font = `800 32px ${FONT}`; g.textAlign = 'center'; g.fillText('Next customer', x + w / 2, by + 52); g.textAlign = 'left';
  hit('monitor', x + 120, by, w - 240, 80, () => send({ type: 'next' })); RECT.monitor.next = { x: x + 120, y: by, w: w - 240, h: 80 };
}
function onMonitor(type, px, py, e) {
  if (!S || !S.job) return;
  map.pointer = [px, py];
  if (type === 'wheel') return;
  const j = S.job;
  if ((type === 'hover' || type === 'move') && S.job.search) { const h = find('monitor', px, py); map.hover = h && h.hov || null; return; }
  if (type === 'hover' || type === 'move') {
    const d = devAt(px, py), c = d ? null : cableAt(px, py);
    map.hover = d ? d.id : c ? 'c' + c.id : null;
    return;
  }
  if (type === 'down') {
    const h = find('monitor', px, py); if (!h) return;
    if (h.fn) { beep([1100], 0.03, 'sine', 0.03); h.fn(); return; }
    if (h.item && S.phase === 'job') { map.drag = { kind: 'place', item: h.item }; return; }
    if (!h.map || S.phase !== 'job') return;
    const d = devAt(px, py);
    if (map.tool === 'test') {
      if (!d) return;
      if (!map.test) map.test = { from: d.id };
      else { send({ type: 'test', from: map.test.from, to: d.id }); map.test = null; }
      return;
    }
    if (d && map.tool === 'cable') { map.drag = { kind: 'cable', from: d.id }; return; }
    if (d && map.tool === 'move') { if (d.customer || d.kind === 'socket') { toast('That belongs to the customer. Leave it where it is.'); return; } map.drag = { kind: 'move', id: d.id }; return; }
    const c = cableAt(px, py); map.sel = c ? c.id : null;
    return;
  }
  if (type === 'up') {
    const dr = map.drag; map.drag = null; if (!dr) return;
    const over = px >= 0 ? find('monitor', px, py) : null;
    if (dr.kind === 'cable') { const d = px >= 0 ? devAt(px, py) : null; if (d && d.id !== dr.from) send({ type: 'act', op: 'connect', a: dr.from, b: d.id }); return; }
    if (dr.kind === 'move') { if (over && over.tray) { send({ type: 'act', op: 'remove', id: dr.id }); return; } if (over && over.map) { const [x, y] = toUnit(px, py); send({ type: 'act', op: 'move', id: dr.id, x, y }); } return; }
    if (dr.kind === 'place' && over && over.map) { const [x, y] = toUnit(px, py); send({ type: 'act', op: 'place', kind: dr.item, x, y }); }
  }
}

// ---------------------------------------------------------------- the typing bar
// A real text box under the phone (big and easy to click) whenever the open chat takes typing.
function chatWho() { return phone.screen.startsWith('chat:') ? phone.screen.slice(5) : null; }
function canType() { const who = chatWho(); return !!(S && office.mode === 'phone' && who && (who === 'customer' ? S.phase === 'explain' || (S.lesson === '2.4' && S.phase === 'job') : S.phase === 'job')); }
const searchIn = $('searchIn');
function runSearch() { const q = searchIn.value.trim(); if (!q || !S || S.phase !== 'job') return; send({ type: 'search', q }); monDirty = true; }
searchIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } if (e.key === 'Escape' && !guide.on) { searchIn.blur(); office.setMode('desk'); } e.stopPropagation(); monDirty = true; });
searchIn.addEventListener('input', () => { monDirty = true; });
$('searchBtn').addEventListener('click', () => { runSearch(); searchIn.focus(); });
function searchBar() {
  const on = !!(S && S.job && S.job.search && office.mode === 'monitor' && S.phase === 'job' && !S.job.search.open), bar = $('searchbar');
  if (bar.hidden === on) { bar.hidden = !on; if (!on) searchIn.blur(); }
}
function typingBar() {
  searchBar();
  const on = canType(), bar = $('typebar');
  if (bar.hidden === on) bar.hidden = !on;
  if (!on) return;
  const who = chatWho(), ph = who === 'customer' ? (S.phase === 'job' ? 'Tell them the answer and the search terms...' : 'Explain what was wrong...') : who === 'tech' ? 'Ask Alex for help...' : 'Say what you need, and why...';
  if (input.placeholder !== ph) input.placeholder = ph;
  $('sendBtn').disabled = !input.value.trim() || S.busy.includes(who);
}

// ---------------------------------------------------------------- the training calls (the first two jobs)
const guide = createGuide();
let tut = { key: '' };
const onPh = k => RECT.phone[k] && office.rectOn('phone', RECT.phone[k].x, RECT.phone[k].y, RECT.phone[k].w, RECT.phone[k].h);
const onMon = k => RECT.monitor[k] && office.rectOn('monitor', RECT.monitor[k].x, RECT.monitor[k].y, RECT.monitor[k].w, RECT.monitor[k].h);
function devRect(d) { const [x, y] = toPx(d.x, d.y); return office.rectOn('monitor', x - 44, y - 44, 88, 104); }
function union(a, b) { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; }
const hasCable = (j, id) => j.cables.some(c => (c.a === id || c.b === id) && !c.broken);
function goChat(who, why) {
  const name = who === 'customer' ? S.job.customer.name : (S.offices.find(o => o.id === who) || {}).person || who;
  if (office.mode === 'monitor') {
    // leaning in to the computer the phone is out of sight: sit back first (click beside the screen)
    const sc = office.rectOn('monitor', 0, 0, MON_W, MON_H), W = innerWidth, H = innerHeight;
    const r = sc.x > 60 ? { x: 8, y: H * 0.3, w: sc.x - 20, h: H * 0.4 } : sc.x + sc.w < W - 60 ? { x: sc.x + sc.w + 12, y: H * 0.3, w: W - sc.x - sc.w - 20, h: H * 0.4 } : { x: W * 0.3, y: sc.y + sc.h + 8, w: W * 0.4, h: Math.max(40, H - sc.y - sc.h - 16) };
    return { text: why + ' First sit back: click outside the computer screen.', rect: r };
  }
  if (office.mode !== 'phone') return { text: why + ' Click your phone to pick it up.', rect: office.rectOf('phone') };
  if (phone.screen === 'incoming') return who === 'customer' ? { text: why + ' Press the green Answer button.', rect: onPh('answer') } : null;
  if (phone.screen === 'chat:' + who) return null;
  if (phone.screen.startsWith('chat:')) return { text: 'Press the back arrow to see your contacts.', rect: onPh('back') };
  return { text: why + ' Press ' + name + '.', rect: onPh('contact_' + who) };
}
function goMonitor(why) {
  if (office.mode === 'monitor') return null;
  const m = office.rectOf('monitor');
  if (office.mode !== 'phone') return { text: why + ' Click the computer.', rect: m };
  // the phone is held up in front of the computer: point at the part of the screen beside it
  const p = office.rectOf('phone'), left = p.x - m.x, right = m.x + m.w - (p.x + p.w);
  const r = left >= right ? { x: m.x, y: m.y, w: Math.max(40, left - 12), h: m.h } : { x: p.x + p.w + 12, y: m.y, w: Math.max(40, right - 12), h: m.h };
  return { text: why + ' Put the phone down: click the computer screen next to the phone.', rect: r };
}
const typeHere = text => { if ($('typebar').hidden) return { text, wait: true }; const r = $('typebar').getBoundingClientRect(); return { text, rect: { x: r.left, y: r.top, w: r.width, h: r.height } }; };
const barRect = id => { const el = $(id); if (el.hidden) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
function searchStep(n) {
  const j = S.job, s = j.search, ex = s.example; if (!ex) return null;
  if (S.phase === 'scored') return goMonitor('The job is finished.') || { text: 'Well done! Read your points. Then press Next customer.' + (n === 2 ? ' After this, the calls are real and you work on your own.' : ''), rect: onMon('next') };
  if (S.phase === 'explain') {
    const g = goChat('customer', j.customer.name + ' wants to know why the search did not work.'); if (g) return g;
    if (S.busy.includes('customer')) return { text: 'Wait for the answer...', wait: true };
    return typeHere('Explain why the search did not work. Click the white box, type, then press Send. For example: "' + ex.why + '"');
  }
  if (S.phase !== 'job') return null;
  if (tut.key !== j.business + '|' + s.theirs.q) tut = { key: j.business + '|' + s.theirs.q, answered: false };
  if (phone.screen === 'chat:customer') tut.answered = true;
  if (!tut.answered) return goChat('customer', 'The phone is ringing!');
  const asked = id => (S.chats.customer || []).some(m => m.who === 'me' && m.text === (S.questions.find(q => q.id === id) || {}).label);
  for (const [id, label] of [['typed', 'What did you type?'], ['want', 'What do you want to find?']]) {
    if (asked(id)) continue;
    const g = goChat('customer', 'Find out about the problem.'); if (g) return g;
    return { text: 'Ask a question: press "' + label + '"', rect: onPh('q_' + id) };
  }
  const right = s.mine && s.mine.results.length && s.mine.results[0].id === ex.target && s.mine.q.trim().split(/\s+/).length <= 4 && !s.mine.small.length;
  if (!right || !s.open || s.open.id !== ex.target) {
    const g = goMonitor('Look at their search on the computer.'); if (g) return g;
    if (s.open && s.open.id !== ex.target) return { text: 'That is not the page ' + j.customer.name + ' wants. Press "< Results".', rect: onMon('back') };
    if (!right) {
      const what = s.theirs.unknown.length ? 'No page has the word "' + s.theirs.unknown[0] + '". Check the spelling.' : 'Look: the page ' + j.customer.name + ' wants is not first.';
      return { text: (s.mine ? 'That search did not put the right page first. ' : what + ' ') + 'Type better search terms in the orange box, then press Search. Try: ' + ex.terms, rect: barRect('searchbar') };
    }
    return { text: 'The right page is first now. Click it to open it.', rect: onMon('mine0') };
  }
  const g = goChat('customer', 'Read the page: it tells you ' + ex.want + '. Now tell ' + j.customer.name + '.'); if (g) return g;
  if (S.busy.includes('customer')) return { text: 'Wait for the answer...', wait: true };
  return typeHere('Tell ' + j.customer.name + ' the answer and the search terms. Click the white box, type, then press Send. For example: "' + ex.tell + '"');
}
function guideStep() {
  const n = S.me && S.me.tutorial; if (!n) return null;
  const T = 'Training call ' + n + ' of 2', step = s => s && Object.assign({ title: T }, s);
  if (S.phase === 'loading' || !S.job) return step({ text: 'A customer will phone you soon. Get ready!', wait: true });
  if (S.job.search) return step(searchStep(n));
  const j = S.job, key = j.business + '|' + ((S.chats.customer || [])[0] || {}).text;
  if (tut.key !== key) {
    // the device with the fault (no cable, or a broken cable), the switch it plugs into, and another device to test with
    const things = j.devices.filter(d => d.customer && d.kind !== 'tablet' && d.kind !== 'socket');
    const bc = j.cables.find(c => c.broken);
    const dev = n === 1 ? things.find(d => !j.cables.some(c => c.a === d.id || c.b === d.id)) : bc && things.find(d => d.id === bc.a || d.id === bc.b);
    const sws = j.devices.filter(d => d.kind.startsWith('switch'));
    const sw = dev && sws.sort((a, b) => Math.hypot(a.x - dev.x, a.y - dev.y) - Math.hypot(b.x - dev.x, b.y - dev.y))[0];
    const other = dev && things.find(d => d.id !== dev.id && hasCable(j, d.id));
    tut = { key, answered: false, dev, sw, other, cable: bc && bc.id };
  }
  const { dev, sw, other } = tut;
  if (!dev || !sw) return null;
  const dv = j.devices.find(d => d.id === dev.id) || dev, swv = j.devices.find(d => d.id === sw.id) || sw, ot = other && (j.devices.find(d => d.id === other.id) || other);
  if (S.phase === 'scored') {
    return step(goMonitor('The job is finished.') || { text: 'Well done! Read your points. Then press Next customer.' + (n === 2 ? ' After this, the calls are real and you work on your own.' : ''), rect: onMon('next') });
  }
  if (S.phase === 'explain') {
    const g = goChat('customer', 'The customer wants to know what was wrong.'); if (g) return step(g);
    if (S.busy.includes('customer')) return step({ text: 'Wait for the answer...', wait: true });
    return step(typeHere('Explain what was wrong and how you fixed it. Click the white box, type, then press Send. For example: "The ' + dv.name + (n === 1 ? ' had no cable' : ' had a broken cable') + ', so it could not send to the others. I plugged in a new cable."'));
  }
  if (S.phase !== 'job') return null;
  // 1. answer the call
  if (phone.screen === 'chat:customer') tut.answered = true;
  if (!tut.answered) return step(goChat('customer', 'The phone is ringing!'));
  // 2. ask a question
  if (!(S.chats.customer || []).some(m => m.who === 'me')) {
    const g = goChat('customer', 'Find out about the problem.'); if (g) return step(g);
    return step({ text: 'Read what ' + j.customer.name + ' says. Then ask a question: press "Did anything change recently?"', rect: onPh('q_changed') });
  }
  const brokenGone = !j.cables.some(c => c.broken), fixed = hasCable(j, dv.id) && brokenGone;
  if (!fixed) {
    // training call 2: take the broken cable out first
    if (n === 2 && !brokenGone) {
      const g = goMonitor('Look at the network on the computer.'); if (g) return step(g);
      if (map.tool !== 'cable') return step({ text: 'Press "Plug in cables".', rect: onMon('tool_cable') });
      const c = j.cables.find(c => c.broken);
      if (map.sel !== c.id) {
        const a = j.devices.find(d => d.id === c.a), b = j.devices.find(d => d.id === c.b), [ax, ay] = toPx(a.x, a.y), [bx, by] = toPx(b.x, b.y), [mx, my] = curve(ax, ay, bx, by, 0.5);
        return step({ text: 'The red dashed cable is broken. Click the red cable to choose it.', rect: office.rectOn('monitor', mx - 30, my - 30, 60, 60) });
      }
      return step({ text: 'Press "Take the broken cable out".', rect: onMon('takeOut') });
    }
    // get a cable from Supplies
    if (!(j.stock.cable > 0)) {
      const sup = S.chats.supplies || [];
      const g = goChat('supplies', (n === 1 ? 'The ' + dv.name + ' has no cable.' : 'You need a new cable.') + ' Supplies can send you one.'); if (g) return step(g);
      if (S.busy.includes('supplies')) return step({ text: 'Priya at Supplies is answering...', wait: true });
      return step(typeHere((sup.some(m => m.who === 'them') ? 'Read what Priya says. ' : '') + 'Tell Supplies what you need and why. Click the white box, type, then press Send. For example: "Please can I have one network cable. The ' + dv.name + ' has no cable."'));
    }
    const g = goMonitor('Your cable has arrived.'); if (g) return step(g);
    if (map.tool !== 'cable') return step({ text: 'Press "Plug in cables".', rect: onMon('tool_cable') });
    return step({ text: 'Plug the cable in. Hold the mouse button down on the ' + dv.name + ', move to the ' + swv.name + ', then let go.', rect: union(devRect(dv), devRect(swv)) });
  }
  // 3. test it
  if (!(S.test && S.test.ok)) {
    const g = goMonitor('Now check that it works.'); if (g) return step(g);
    if (map.tool !== 'test') return step({ text: 'Press "Test".', rect: onMon('tool_test') });
    if (!map.test) return step({ text: 'Click the ' + dv.name + ' to send a test message from it.', rect: devRect(dv) });
    if (ot) return step({ text: 'Now click the ' + ot.name + ' to send the message to it.', rect: devRect(ot) });
    return null;
  }
  // 4. tell the customer
  const g = goChat('customer', 'It works! Tell the customer.'); if (g) return step(g);
  return step({ text: 'Press "It is fixed. Please try it!"', rect: onPh('fixed') });
}

// ---------------------------------------------------------------- the clock: drawn in step with the screen
// requestAnimationFrame keeps frames even (a 33 ms timer judders against a 60 Hz screen). This page is its own tab,
// never a hidden preloaded iframe, and nothing waits on a frame: server messages are handled as they arrive.
// The screens are big canvases and uploading them to the graphics card is the costly part, so each is redrawn only when
// something happened (input, a server message) or, for blinking carets and dots, a few times a second.
// Each screen is uploaded only when something on it may have changed: its own pointer events, typing (the phone and the
// monitor's name box), a server message, or twice a second for the blinking caret, typing dots and test animation.
let monAt = 0, phAt = 0;
addEventListener('keydown', () => { monDirty = phDirty = true; }, true);
function tick() {
  requestAnimationFrame(tick);
  const now = performance.now(), anim = map.anim && now - map.anim.t0 < 600 * (map.anim.path.length + 2);
  const mon = monDirty || anim || now - monAt > 500, ph = phDirty || now - phAt > 500;
  if (mon) { monDirty = false; monAt = now; drawMonitor(); }
  if (ph) { phDirty = false; phAt = now; drawPhone(); }
  office.frame({ mon, ph });
  typingBar();
  guide.show(S ? guideStep() : null);
  $('hint').hidden = guide.on || !desk;
}
requestAnimationFrame(tick);
onMode('desk');

// ---------------------------------------------------------------- the start screen and the teacher's results
const LESSONS = [['2.1', 'Cables, switches and Wi-Fi', 'Plug in cables, add switches and Wi-Fi points.'], ['2.2', 'Routers and the internet', 'Get the customers onto the internet.'], ['2.4', 'Searching the web', 'Help customers whose searches did not work.']];
let chosen = LESSONS.some(l => l[0] === params.get('lesson')) ? params.get('lesson') : null;
function drawLessons() {
  if (params.get('lesson') && chosen) { $('lessons').hidden = true; $('go').disabled = false; return; }
  $('lessons').innerHTML = '';
  for (const [id, name, sub] of LESSONS) {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(chosen === id));
    b.innerHTML = '<b></b><small></small>'; b.firstChild.textContent = 'Lesson ' + id + ': ' + name; b.lastChild.textContent = sub;
    b.onclick = () => { chosen = id; drawLessons(); }; $('lessons').appendChild(b);
  }
  $('go').disabled = !chosen;
}
drawLessons();
$('startNote').textContent = framed ? 'Your points go on your class leaderboard.' : 'Practice desk: open it from the site and sign in to save your points.';
$('go').onclick = () => {
  if (!chosen) return;
  try { actx = actx || new AudioContext(); actx.resume(); } catch (e) { }
  $('start').hidden = true;
  desk = createDesk(chosen, render, t => { toast(t); render(); });
  render(); desk.start();
};
whoami().then(r => { if (r && r.teacher) $('resultsBtn').hidden = false; });
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const when = ms => ms ? new Date(ms).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
$('resultsBtn').onclick = () => {
  $('results').hidden = false; $('resultsBody').innerHTML = '<p>Loading...</p>';
  results().then(r => {
    if (!r.classes.length) { $('resultsBody').innerHTML = '<p>Nobody has finished a job yet.</p>'; return; }
    $('resultsBody').innerHTML = '<p class="note">Every finished job in lessons 2.1, 2.2 and 2.4. Tech Lead calls and explanation marks (out of 2) are averages per job.</p>' + r.classes.map(c =>
      '<h2>' + esc(c.name) + '</h2><table><tr><th>Student</th><th class="n">Points</th><th class="n">Jobs</th><th class="n">Best job</th><th class="n">Tech Lead calls</th><th class="n">Explanation</th><th>Last job</th></tr>' +
      c.rows.map(x => '<tr><td>' + esc(x.name) + '</td><td class="n">' + x.points + '</td><td class="n">' + x.jobs + '</td><td class="n">' + x.best + '</td><td class="n">' + x.tech + '</td><td class="n">' + x.marks + '</td><td>' + when(x.last) + '</td></tr>').join('') + '</table>').join('');
  }).catch(e => { $('resultsBody').innerHTML = '<p>' + esc(e.message) + '</p>'; });
};
$('resultsClose').onclick = () => { $('results').hidden = true; };
// testing: helpdesk.html?debug exposes the state and the screens' pointer handlers
if (new URLSearchParams(location.search).has('debug')) window.__desk = { get S() { return S; }, get desk() { return desk; }, get tut() { return tut; }, devRect, map, phone, drawMonitor, drawPhone, onMonitor, onPhone, toPx, office };
