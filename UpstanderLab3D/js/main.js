// Upstander Lab 3D (Year 9, Anti-Bullying Week, an online safety game): a walk and talk game in the lab world of
// Network Builder 3D. Walk round a school (W A S D or arrows, by key position so a Thai layout works), press Space near
// someone to talk, choose what to say (1 2 3), and use your phone (P). Every name is drawn at random each visit
// (story.js). Four missions: The Filter (does the chat app's banned-word filter stop unkind messages? false alarms and
// misses), One Screenshot (how far a forwarded post spreads), Be an Upstander (save evidence, report, support, tell an
// adult) and a no-help Challenge. ?lesson=abw shows the lesson's missions; ?mission=<id> opens one.
// Wrong choices show why and count as slips: 0 slips = 3 stars, 1 to 2 = 2 stars, more = 1 star.
// Everything that matters (talking, checking, saving, results) runs from events, never from a frame, so a hidden
// frame never gets stuck.
import * as THREE from 'three';
import { create } from '../room.js';
import { createBlob } from '../blob.js';
import { buildWorld } from './world.js';
import { MISSIONS, LESSONS, IDLE, fill } from './story.js';
import { createTalk } from './talk.js';
import { createPhone } from './phone.js';

const STORE = 'bc-upstander3d-v1:';
const load = (k, d) => { try { const v = localStorage.getItem(STORE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch (e) { } };
const $ = (id) => document.getElementById(id);
const esc = (s) => fill(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SPEED = 5.5, TALK_D = 1.5, BUBBLE_D = 2.6;
const START = { x: 5, y: 6.6, face: Math.PI };

export function startSolo({ container }) {
  const params = new URLSearchParams(location.search);
  const view = create(container);
  view.zoom(820, 0.82);
  const world = buildWorld(view);
  const { people, free } = world;
  const me = createBlob(6, ''); view.scene.add(me.group);
  const pos = { ...START };
  const keys = new Set();
  let stick = null, overview = false, moving = false;

  const done = load('all:done', {}), stars = load('all:stars', {});
  const lessonMode = { on: !!params.get('lesson') || load('lessonMode', false) };
  const lesson = LESSONS.find((l) => l.id === (params.get('lesson') || 'abw')) || LESSONS[0];
  let mi = 0, M = null, S = null, slips = 0, finished = false;

  // ---------------------------------------------------------------- results for the lesson slide
  function post(complete) {
    if (window.parent === window) return;
    try {
      window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'upstander-lab-3d-' + M.id, label: 'Upstander Lab 3D: ' + M.title,
        summary: (complete ? 'Finished' : 'Started') + ' with ' + slips + ' slip' + (slips === 1 ? '' : 's') + '.', complete: !!complete }, '*');
    } catch (e) { }
  }
  function speak(t) {
    try { const u = new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g, '')); u.rate = 0.85; u.lang = 'en-GB'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { }
  }
  let toastTimer = 0;
  function toast(msg, cls) { const t = $('toast'); t.innerHTML = msg || ''; t.className = 'toast ' + (cls || 'hint'); clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(() => { t.innerHTML = ''; }, cls === 'bad' ? 5200 : 3200); }

  const talk = createTalk({
    el: $('talk'), speak,
    onSlip: () => { slips++; drawPanel(); },
    onAct: () => { check(); drawPanel(); },
    onEnd: () => { check(); drawPanel(); setTimeout(() => container.focus?.(), 0); },
  });
  const phone = createPhone({ el: $('phone'), onSlip: () => { slips++; drawPanel(); }, onChange: () => { check(); drawPanel(); } });

  // ---------------------------------------------------------------- missions
  function list() { return lessonMode.on ? lesson.missions.concat(lesson.ext).map((id) => MISSIONS.find((m) => m.id === id)) : MISSIONS; }
  function start(i) {
    const L = list();
    mi = Math.max(0, Math.min(L.length - 1, i)); M = L[mi]; S = M.fresh(); slips = 0; finished = false;
    talk.close(); phone.setMission(M, S); phone.close();
    Object.assign(pos, START); view.jump(pos.x, pos.y);
    for (const p of Object.values(people)) { p.x = p.home.x; p.y = p.home.y; }
    $('step').textContent = M.title;
    drawPanel(); post(false);
    toast(esc(M.intro));
  }
  function check() {
    if (!M || finished || !M.done(S)) return;
    finished = true;
    const st = slips === 0 ? 3 : slips <= 2 ? 2 : 1;
    done[M.id] = true; stars[M.id] = Math.max(stars[M.id] || 0, st);
    save('all:done', done); save('all:stars', stars);
    post(true);
    toast('Mission complete: ' + esc(M.title) + '.', 'good');
    drawPanel();
  }
  const starsHtml = (n) => '<span class="stars" aria-label="' + n + ' of 3 stars">' + [1, 2, 3].map((k) => '<svg viewBox="0 0 24 24" class="' + (k <= n ? 'on' : '') + '"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>').join('') + '</span>';
  function curStep() { return M.steps(S).find((s) => !s.done) || null; }
  function drawPanel() {
    if (!M) return;
    const L = list(), steps = M.steps(S);
    let h = '<div class="modebar"><button type="button" id="ulMode" aria-pressed="' + lessonMode.on + '">' + (lessonMode.on ? 'Lesson: ' + esc(lesson.title) : 'All missions') + '</button></div>';
    h += '<ol class="up-missions">' + L.map((m, k) => '<li><button type="button" data-m="' + k + '"' + (k === mi ? ' aria-current="true"' : '') + '><span>' + esc(m.title) +
      (lessonMode.on && lesson.ext.includes(m.id) ? ' <small>(extension)</small>' : '') + '</span>' + (done[m.id] ? starsHtml(stars[m.id] || 1) : '<small>' + m.mins + ' min</small>') + '</button></li>').join('') + '</ol>';
    h += '<div class="up-head"><h2>' + esc(M.title) + '</h2><p class="note">' + esc(M.intro) + '</p></div>';
    h += '<ol class="steps">' + steps.map((s, k) => {
      const first = steps.findIndex((x) => !x.done);
      return '<li class="' + (s.done ? 'done' : k === first ? 'now' : 'later') + '"><span>' + fill(s.text) + '</span></li>';
    }).join('') + '</ol>';
    if (finished) {
      h += '<div class="win"><p><b>Mission complete.</b> ' + starsHtml(stars[M.id] || 1) + '</p><p class="small">' + (slips ? slips + ' choice' + (slips === 1 ? '' : 's') + ' you had to think again about.' : 'Every choice right first time.') + '</p>' +
        (mi < L.length - 1 ? '<div class="actions"><button type="button" class="btn" id="ulNext">Next mission: ' + esc(L[mi + 1].title) + '</button></div>' : '') + '</div>';
    } else h += '<p class="small">Slips so far: ' + slips + '. Space talks, P opens your phone, M shows the map.</p>';
    $('mission').innerHTML = h;
  }
  $('mission').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'ulMode') { lessonMode.on = !lessonMode.on; save('lessonMode', lessonMode.on); start(0); }
    else if (b.id === 'ulNext') start(mi + 1);
    else if (b.dataset.m != null) start(+b.dataset.m);
  });

  // ---------------------------------------------------------------- who is near, and talking to them
  function nearest(maxD) {
    let best = null, bd = maxD;
    for (const p of Object.values(people)) { const d = Math.hypot(p.x - pos.x, p.y - pos.y); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  function scriptFor(p) {
    const f = M && M.talk[p.id];
    const s = f ? f(S) : null;
    return s && s.length ? s : null;
  }
  function talkTo(p) {
    if (!p) return false;
    keys.clear(); stick = null;
    phone.close();
    const s = scriptFor(p) || [{ say: IDLE[p.id] || 'Hi.' }];
    talk.open(p, s, S);
    return true;
  }
  function hint() {
    let h;
    const p = !talk.isOpen() && !phone.isOpen() && nearest(TALK_D), st = M && !finished && curStep();
    if (talk.isOpen()) h = talk.line()?.choices ? 'Choose with <b>1</b>, <b>2</b> or <b>3</b>, or click.' : '<b>Space</b> for the next line.';
    else if (phone.isOpen()) h = 'Use your phone, then press <b>P</b> to close it.';
    else if (p) h = '<b>Press Space</b> to talk to ' + esc(p.name) + '.';
    else if (finished) h = 'Mission complete. Choose the next mission on the right.';
    else if (st && st.phone && !M.noHelp) h = 'Press <b>P</b> to open your phone.';
    else if (st && st.who && !M.noHelp) h = 'Find <b>' + esc(people[st.who].name) + '</b> in ' + esc(people[st.who].where) + '. The <b>!</b> shows who.';
    else h = 'Walk with W A S D or the arrow keys. Right-drag turns the camera.';
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
  }
  // a speech bubble over whoever is close (what they would like to talk about), drawn in HTML over the 3D view
  const tmpV = new THREE.Vector3();
  function bubble() {
    const b = $('bubble');
    const p = !talk.isOpen() && !phone.isOpen() && !overview && nearest(BUBBLE_D);
    if (!p) { b.hidden = true; return; }
    const text = scriptFor(p) ? 'Can I talk to you?' : IDLE[p.id] || 'Hi.';
    if (b.textContent !== text) b.textContent = text;
    tmpV.set(p.x * 100 + 50, 230, p.y * 100 + 50).project(view.camera);
    const r = container.getBoundingClientRect();
    b.style.left = ((tmpV.x + 1) / 2 * r.width) + 'px'; b.style.top = ((1 - tmpV.y) / 2 * r.height) + 'px';
    b.hidden = tmpV.z > 1;
  }

  // ---------------------------------------------------------------- the frame loop and input
  function setOverview(on) { overview = on; view.setFit(on ? world.MAP.w : 19); $('mapBtn').textContent = on ? 'Walk (M)' : 'Map (M)'; }
  let last = 0;
  function frame(ts) { requestAnimationFrame(frame); tick(ts); }
  function tick(ts) {
    const dt = last ? Math.max(0, Math.min(0.1, (ts - last) / 1000)) : 0.016; last = Math.max(last, ts);
    let dx = 0, dy = 0;
    if (!talk.isOpen() && !phone.isOpen()) {
      if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
      if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
      if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
      if (stick) { dx = stick.x; dy = stick.y; }
    }
    const len = Math.hypot(dx, dy);
    moving = len > 0.15;
    if (moving) {
      [dx, dy] = view.rotateInput(dx / Math.max(1, len), dy / Math.max(1, len));
      const sp = SPEED * dt, nx = pos.x + dx * sp, ny = pos.y + dy * sp;
      if (free(nx, ny)) { pos.x = nx; pos.y = ny; } else if (free(nx, pos.y)) pos.x = nx; else if (free(pos.x, ny)) pos.y = ny;
      pos.face = Math.atan2(dx, dy);
    }
    const st = M && !finished && !M.noHelp && curStep();
    const talking = talk.isOpen() && talk.who();
    for (const p of Object.values(people)) {
      const d = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (d < 3 || talking === p) p.face = Math.atan2(pos.x - p.x, pos.y - p.y);
      p.mark.visible = !!(st && st.who === p.id) && talking !== p;
      p.blob.update(dt, { x: p.x, y: p.y, face: p.face, moving: false, hands: [{ down: false }, { down: false }] }, true);
    }
    me.update(dt, { x: pos.x, y: pos.y, face: pos.face, moving, hands: [{ down: false }, { down: false }] }, true);
    hint();
    view.follow(pos.x, pos.y);
    view.render(dt);
    bubble();
  }
  const typing = (e) => /input|select|textarea/i.test(e.target?.tagName || '');
  document.addEventListener('keydown', (e) => {
    const k = e.code;
    if (typing(e)) { if (k === 'Escape') e.target.blur(); return; }
    if (k === 'Escape') { if (talk.isOpen()) talk.close(); else if (phone.isOpen()) phone.close(); return; }
    if (talk.isOpen()) {
      if ((k === 'Space' || k === 'Enter') && e.target.closest?.('#talk button')) return;   // the focused button clicks itself
      if (k === 'Space' || k === 'Enter') { e.preventDefault(); if (!e.repeat && !talk.line()?.choices) talk.next(); }
      const n = /^(Digit|Numpad)([1-9])$/.exec(k); if (n) { e.preventDefault(); talk.choose(+n[2] - 1); }
      return;
    }
    if (k === 'KeyP') { e.preventDefault(); keys.clear(); phone.toggle(); return; }
    if (phone.isOpen()) return;
    if (k === 'Space') { e.preventDefault(); if (!e.repeat) talkTo(nearest(TALK_D)); return; }
    if (k === 'KeyM') { setOverview(!overview); return; }
    if (k.startsWith('Arrow')) e.preventDefault();
    keys.add(k);
  });
  document.addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  const focusMsg = $('focusMsg');
  const showFocus = () => { const has = document.hasFocus(); focusMsg.hidden = has; if (!has) keys.clear(); };
  focusMsg.addEventListener('click', () => { window.focus(); focusMsg.hidden = true; });
  addEventListener('focus', showFocus); addEventListener('blur', showFocus);
  document.addEventListener('pointerdown', () => { if (!document.hasFocus()) window.focus(); });
  try { window.focus(); } catch (e) { }
  setTimeout(showFocus, 300);
  container.addEventListener('contextmenu', (e) => e.preventDefault());
  $('talkBtn').addEventListener('click', () => { if (talk.isOpen()) talk.next(); else talkTo(nearest(TALK_D)); });
  $('phoneBtn').addEventListener('click', () => phone.toggle());
  $('mapBtn').addEventListener('click', () => setOverview(!overview));
  {
    const sk = $('stick'), knob = $('knob');
    const at = (e) => { const r = sk.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } stick = { x, y }; knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`; };
    sk.addEventListener('pointerdown', (e) => { sk.setPointerCapture(e.pointerId); at(e); });
    sk.addEventListener('pointermove', (e) => { if (stick) at(e); });
    const end = () => { stick = null; knob.style.transform = ''; };
    sk.addEventListener('pointerup', end); sk.addEventListener('pointercancel', end);
  }

  const L = list(), q = params.get('mission'), qi = L.findIndex((m) => m.id === q);
  let first = 0; while (first < L.length - 1 && done[L[first].id]) first++;
  start(qi >= 0 ? qi : first);
  requestAnimationFrame(frame);
  if (/[?&]debug/.test(location.search)) window.__lab = {
    get M() { return M; }, get S() { return S; }, get slips() { return slips; }, get finished() { return finished; }, pos, people, free, start, talk, phone, talkTo, nearest,
    list, done, stars, frame: (n, ms = 33) => { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); }, keys, setOverview,
  };
}
