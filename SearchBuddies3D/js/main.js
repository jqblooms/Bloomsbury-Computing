// Binary Search Buddies: the setup screen, the side panel, and the director who makes the buddies act out each
// beat from SBSearch.steps(). Search time (simTime) only moves while playing, so Pause freezes the search while
// the buddies keep breathing and blinking. The frame loop uses animation frames, but nothing at load time waits
// on one (the site preloads apps in hidden frames, where animation frames never come).
import * as THREE from 'three';
import { createStage, BACK_Z } from './stage.js';
import { makeKit, makeBuddy } from './buddy.js';

const S = window.SBSearch;
const $ = id => document.getElementById(id);
const FRONT_Z = 2.0, SHOW_Z = 0.8;
const SPEEDS = { slow: 0.6, normal: 1, fast: 1.9 };
const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

export function start() {
  const stage = createStage($('view'), { reducedMotion: reduced });
  const kit = makeKit(stage.renderer);
  $('loading').remove();

  // ---------------------------------------------------------------- setup screen
  const form = $('setupForm');
  let randomVals = S.randomList(15);
  let cfg = null;               // the settings of the run on screen
  const radio = name => form.querySelector('input[name=' + name + ']:checked').value;
  const setRadio = (name, v) => { const r = form.querySelector('input[name=' + name + '][value=' + v + ']'); if (r) r.checked = true; };

  function currentList() {
    if (radio('vals') === 'random') return { values: randomVals };
    const r = S.parseList($('typed').value);
    if (r.error) return r;
    const bad = S.firstOutOfOrder(r.values);
    if (bad) return { values: r.values, bad, error: 'Binary search needs the numbers in order, smallest first. Position ' + bad + ' (' + r.values[bad - 1] + ') is smaller than position ' + (bad - 1) + ' (' + r.values[bad - 2] + '). Press Sort them for me.' };
    return r;
  }
  function currentTarget(list) {
    if (radio('tmode') === 'pick') { const v = parseInt($('pick').value, 10); return isNaN(v) ? { error: 'Pick a number to find.' } : { value: v }; }
    return S.parseTarget($('typedTarget').value);
  }
  function refreshSetup() {
    const typed = radio('vals') === 'typed';
    $('randomBox').hidden = typed; $('typedBox').hidden = !typed;
    $('countOut').textContent = $('count').value;
    const pickMode = radio('tmode') === 'pick';
    $('pickBox').hidden = !pickMode; $('typeBox').hidden = pickMode;
    const L = currentList();
    const list = L.values || [];
    // the target list
    const pick = $('pick'), old = pick.value;
    const opts = list.map((v, i) => v + '   (position ' + (i + 1) + ')').join('|');
    if (pick.dataset.opts !== opts) {
      pick.innerHTML = ''; pick.dataset.opts = opts;
      list.forEach((v, i) => { const o = document.createElement('option'); o.value = v; o.textContent = v + '   (position ' + (i + 1) + ')'; pick.appendChild(o); });
      if (list.some(v => String(v) === old)) pick.value = old; else if (list.length) pick.value = list[Math.floor(list.length * 0.7)];
    }
    const T = currentTarget(list);
    $('listMsg').textContent = L.error || (list.length + ' buddies, in order. Positions start at 1.');
    $('listMsg').className = 'msg' + (L.error ? ' bad' : '');
    $('targetMsg').textContent = T.error || (list.indexOf(T.value) === -1 ? T.value + ' is not in the list. Watch the search say NOT FOUND.' : '');
    $('targetMsg').className = 'msg' + (T.error ? ' bad' : '');
    $('midRule').textContent = radio('mid') === 'up' ? 'Mid ← (Low + High + 1) DIV 2' : 'Mid ← (Low + High) DIV 2 (as in Cambridge pseudocode)';
    $('playMsg').textContent = radio('play') === 'step' ? 'Press Next step, Space or Enter for each step.' : 'The buddies carry on by themselves. Pause at any time.';
    const prev = $('preview'); prev.innerHTML = '';
    list.forEach((v, i) => {
      const s = document.createElement('span');
      s.innerHTML = '<small>' + (i + 1) + '</small>' + v;
      if (L.bad && (i + 1 === L.bad || i + 2 === L.bad)) s.className = 'bad'; else if (!T.error && v === T.value) s.className = 't';
      prev.appendChild(s);
    });
    const err = L.error || T.error;
    $('startBtn').disabled = !!err;
    $('startMsg').textContent = '';
    return { L, T, err };
  }
  form.addEventListener('input', e => {
    if (e.target.id === 'count') randomVals = S.randomList(+$('count').value);
    refreshSetup();
  });
  form.addEventListener('change', () => refreshSetup());
  $('newVals').addEventListener('click', () => { randomVals = S.randomList(+$('count').value); $('pick').dataset.opts = ''; refreshSetup(); });
  $('sortBtn').addEventListener('click', () => {
    const r = S.parseList($('typed').value);
    if (r.error) { refreshSetup(); return; }
    $('typed').value = r.values.slice().sort((a, b) => a - b).join(', ');
    refreshSetup();
  });
  form.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const list = currentList().values || [];
    if (!list.length) return;
    const q = b.dataset.quick;
    if (q === 'missing') {
      const set = new Set(list), cand = [list[0] - 1, list[list.length - 1] + 1];
      for (let i = 1; i < list.length; i++) for (let v = list[i - 1] + 1; v < list[i]; v++) cand.push(v);
      const pickv = cand.filter(v => !set.has(v) && v >= S.MIN && v <= S.MAX);
      setRadio('tmode', 'type'); $('typedTarget').value = pickv[Math.floor(Math.random() * pickv.length)];
    } else {
      setRadio('tmode', 'pick');
      $('pick').value = q === 'first' ? list[0] : q === 'last' ? list[list.length - 1] : list[Math.floor(Math.random() * list.length)];
    }
    refreshSetup();
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const r = refreshSetup();
    if (r.err) { $('startMsg').textContent = r.err; return; }
    cfg = { list: r.L.values.slice(), target: r.T.value, roundUp: radio('mid') === 'up', speed: radio('speed'), auto: radio('play') === 'auto' };
    $('setup').hidden = true;
    $('cancelBtn').hidden = false;
    begin();
  });
  $('cancelBtn').addEventListener('click', () => { $('setup').hidden = true; });
  function openSetup(focus) {
    $('setup').hidden = false; refreshSetup();
    if (focus) setTimeout(() => { try { $('startBtn').focus(); } catch (e) { } }, 0);
  }

  // ---------------------------------------------------------------- the panel
  const codeEl = $('code');
  function drawCode(roundUp) {
    codeEl.innerHTML = '';
    S.code(roundUp).forEach(line => {
      const li = document.createElement('li');
      li.innerHTML = line.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/\b(DECLARE|ARRAY|OF|INTEGER|BOOLEAN|WHILE|DO|ENDWHILE|IF|THEN|ELSE|ENDIF|OUTPUT|DIV|AND|TRUE|FALSE)\b/g, '<span class="kw">$1</span>');
      codeEl.appendChild(li);
    });
  }
  function highlight(a, b) {
    b = b || a;
    [...codeEl.children].forEach((li, i) => li.classList.toggle('on', i + 1 >= a && i + 1 <= b));
    const li = codeEl.children[a - 1];
    if (li) {   // scroll the code box only (never the page round the frame)
      const top = li.offsetTop - codeEl.offsetTop, bot = top + li.offsetHeight * (b - a + 1);
      if (top < codeEl.scrollTop + 8) codeEl.scrollTop = top - 8;
      else if (bot > codeEl.scrollTop + codeEl.clientHeight - 8) codeEl.scrollTop = bot - codeEl.clientHeight + 24;
    }
  }
  const shown = {};
  function setVar(id, v) {
    const el = $(id), b = el.querySelector('b'), t = String(v);
    if (shown[id] === t) return;
    shown[id] = t; b.textContent = t;
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  function vars(low, high, mid, found, cmp) {
    setVar('vLow', low); setVar('vHigh', high); setVar('vMid', mid || '-'); setVar('vFound', found ? 'TRUE' : 'FALSE'); setVar('vCmp', cmp);
  }
  const say = html => { $('say').innerHTML = html; };
  const calc = text => { $('calc').textContent = text || ''; };
  const bubbleEl = $('bubble');
  let bubbleOn = null;
  function bubble(html, who) {
    if (!html) { bubbleEl.hidden = true; bubbleOn = null; return; }
    bubbleEl.innerHTML = html; bubbleEl.hidden = false; bubbleOn = who;
    bubbleEl.classList.remove('pop'); void bubbleEl.offsetWidth; bubbleEl.classList.add('pop');
    placeBubble();
  }
  const headV = new THREE.Vector3();
  function placeBubble() {
    if (!bubbleOn) return;
    bubbleOn.headPos(headV);
    const p = stage.toScreen(headV);
    if (!p) { bubbleEl.style.left = '-999px'; return; }
    bubbleEl.style.left = p.x + 'px'; bubbleEl.style.top = (p.y - 8) + 'px';
  }
  function banner(text, cls) { const b = $('banner'); b.hidden = !text; b.textContent = text || ''; b.className = 'banner' + (cls ? ' ' + cls : ''); }

  // ---------------------------------------------------------------- search time
  let simTime = 0, playing = true, auto = false, waiters = [], untils = [], token = 0;
  let gateOpen = null, gateAt = 0, nextQueued = false;
  const wait = s => new Promise(res => waiters.push({ t: simTime + s, res }));
  const until = (fn, max = 12) => new Promise(res => untils.push({ fn, res, t: simTime + max }));
  function gate() {
    updateButtons();
    if (nextQueued) { nextQueued = false; return Promise.resolve(); }
    return new Promise(res => { gateOpen = res; gateAt = simTime + 0.55; updateButtons(); });
  }
  function openGate() { const g = gateOpen; gateOpen = null; if (g) g(); updateButtons(); }
  function next() {
    if (!run || run.over) return;
    auto = false; playing = true;
    if (gateOpen) openGate(); else nextQueued = true;
    updateButtons();
  }
  function togglePlay() {
    if (!run) return;
    if (run.over) { begin(); return; }
    if (auto && playing) { playing = false; }
    else { auto = true; playing = true; if (gateOpen) openGate(); }
    updateButtons();
  }
  function updateButtons() {
    const over = !run || run.over;
    $('playBtn').textContent = over ? 'Play again' : (auto && playing ? 'Pause' : 'Play');
    $('stepBtn').disabled = over;
    $('stepBtn').classList.toggle('pulse', !!gateOpen && !auto);
  }

  // ---------------------------------------------------------------- the cast
  let run = null, buddies = [], searcher = null;
  const xOf = p => stage.xOf(p);
  function clearCast() {
    for (const b of buddies) if (b) b.dispose();
    if (searcher) searcher.dispose();
    buddies = []; searcher = null;
  }
  function begin() {
    token++; waiters = []; untils = []; gateOpen = null; nextQueued = false; simTime = 0;
    auto = cfg.auto; playing = true;
    clearCast();
    const n = cfg.list.length;
    stage.build(n);
    stage.setMarks({ LOW: 0, HIGH: 0, MID: 0 }); stage.setRange(1, n);
    stage.frame(xOf(1) - 0.6, xOf(n) + 0.6, true); stage.resetView();
    const seed = Math.floor(Math.random() * 10);
    buddies = [null];
    for (let p = 1; p <= n; p++) {
      const b = makeBuddy(kit, { colour: (p * 3 + seed) % 10, kind: (p * 7 + seed) % 3, value: cfg.list[p - 1] });
      b.place(xOf(p) * 1.3 + (Math.random() - 0.5) * 2, -6 - Math.random() * 3);
      b.heading = b.faceTo = 0;
      stage.addToWorld(b.root); buddies.push(b);
    }
    searcher = makeBuddy(kit, { colour: 0, kind: 0, value: cfg.target, small: 'Find', searcher: true });
    searcher.solid = false;
    searcher.place(xOf(Math.ceil(n / 2)) - 7, FRONT_Z + 0.3); stage.addToWorld(searcher.root);
    run = { steps: S.steps(cfg.list, cfg.target, cfg.roundUp), over: false, tok: token };
    drawCode(cfg.roundUp); highlight(0);
    $('pTarget').textContent = cfg.target;
    $('pList').textContent = n + ' buddies';
    $('findChip').innerHTML = 'Find <b>' + cfg.target + '</b>';
    vars('-', '-', 0, false, 0); setVar('vFound', '-'); calc(''); bubble(null); banner(null);
    say('The buddies are coming. They stand in order, smallest number first.');
    updateButtons();
    direct(run).catch(e => { if (e !== STOP) console.error(e); });
  }
  const STOP = { stop: true };
  const alive = r => { if (r !== run || r.tok !== token) throw STOP; };

  async function direct(r) {
    const n = cfg.list.length, t = cfg.target;
    // everyone walks in and lines up
    buddies.slice(1).forEach((b, i) => { b.walkDelay = 0.1 + Math.random() * 1.1; });
    const startT = simTime;
    searcher.walkTo(xOf(Math.ceil(n / 2)) + 0.3, FRONT_Z, 2.2);
    await until(() => {
      buddies.slice(1).forEach((b, i) => { if (b.walkDelay != null && simTime - startT >= b.walkDelay) { b.walkTo(xOf(i + 1), 0, 1.5 + Math.random() * 0.5); b.walkDelay = null; } });
      return searcher.arrived && buddies.slice(1).every(b => b.walkDelay == null && b.arrived);
    });
    alive(r);
    buddies.slice(1).forEach(b => { b.face(0); });
    searcher.face(0); searcher.hop(2.4);
    buddies.slice(1).forEach((b, i) => { b.hop(1.4 + (i % 3) * 0.3); });
    await wait(0.6); alive(r);

    let low = 1, high = n, mid = 0, found = false;
    for (let i = 0; i < r.steps.length; i++) {
      const s = r.steps[i];
      if (s.kind === 'loop' || s.kind === 'equal' || s.kind === 'less' || s.kind === 'move') {
        if (s.kind === 'loop' && i === 1) say(say0(n) + (auto ? '' : ' Press <b>Next step</b> (or Space) to start.'));
        await gate(); alive(r);
      }
      if (s.kind === 'start') {
        highlight(7, 9); stage.setMarks({ LOW: 1, HIGH: n }); stage.setRange(1, n);
        vars(1, n, 0, false, 0); calc('Low ← 1    High ← ' + n);
        say(say0(n));
        await wait(0.6); alive(r);
      } else if (s.kind === 'loop') {
        highlight(10);
        calc(s.go ? 'Low <= High:  ' + s.low + ' <= ' + s.high + '  TRUE' : found ? 'Found = FALSE:  FALSE' : 'Low <= High:  ' + s.low + ' <= ' + s.high + '  FALSE');
        if (!s.go) say(found ? 'Found is TRUE, so the loop stops.' : 'Is LOW &lt;= HIGH? ' + s.low + ' &lt;= ' + s.high + '? No. Nothing is left to check, so the loop stops.');
        else say('Is LOW &lt;= HIGH? ' + s.low + ' &lt;= ' + s.high + '? Yes. There is still somewhere to look.');
        await wait(0.7); alive(r);
      } else if (s.kind === 'mid') {
        mid = s.mid; highlight(11);
        const odd = (s.sum + (cfg.roundUp ? 1 : 0)) % 2 === 1;
        calc('Mid ← (' + s.low + ' + ' + s.high + (cfg.roundUp ? ' + 1' : '') + ') DIV 2 = ' + mid);
        say('MID = (' + s.low + ' + ' + s.high + (cfg.roundUp ? ' + 1' : '') + ') DIV 2 = <b>' + mid + '</b>' + (odd ? ' (' + ((s.sum + (cfg.roundUp ? 1 : 0)) / 2) + ' rounded down).' : '.') + ' The searcher walks to position ' + mid + '.');
        vars(low, high, mid, found, s.cmp);
        stage.setMarks({ MID: mid });
        stage.frame(xOf(s.low) - 0.6, xOf(s.high) + 0.6);
        const sx = xOf(mid) + 0.75;
        searcher.walkTo(sx, FRONT_Z, 2.3);
        await until(() => searcher.arrived); alive(r);
        searcher.face(-0.55);
        const m = buddies[mid];
        m.walkTo(xOf(mid), SHOW_Z, 1.3);
        await until(() => m.arrived); alive(r);
        m.face(0); m.pose.raise = 1; m.hop(1.8);
        stage.frame(xOf(mid) - 3.2, xOf(mid) + 3.2);   // a close look at the sign
        say('Position ' + mid + ' steps forward and shows the number: <b>' + cfg.list[mid - 1] + '</b>.');
        await wait(0.8); alive(r);
      } else if (s.kind === 'equal') {
        highlight(12);
        vars(low, high, mid, found, s.cmp);
        bubble(s.value + ' = ' + t + ' ?', searcher);
        calc('List[' + mid + '] = Target:  ' + s.value + ' = ' + t);
        await wait(0.9); alive(r);
        bubble(s.value + ' = ' + t + ' ? <span class="' + (s.yes ? 'yes">Yes!' : 'no">No') + '</span>', searcher);
        say('Check ' + s.cmp + ': is ' + s.value + ' equal to ' + t + '? ' + (s.yes ? '<b>Yes!</b>' : 'No.'));
        if (!s.yes) { searcher.kick(0, -1, 1.2); }
        await wait(0.7); alive(r);
      } else if (s.kind === 'found') {
        found = true; highlight(14);
        vars(low, high, mid, true, s.cmp); calc('Found ← TRUE');
        say('Found is now TRUE.');
        await wait(0.6); alive(r);
      } else if (s.kind === 'less') {
        highlight(16);
        bubble(s.value + ' &lt; ' + t + ' ?', searcher);
        calc('List[' + mid + '] < Target:  ' + s.value + ' < ' + t);
        await wait(0.9); alive(r);
        bubble(s.value + ' &lt; ' + t + ' ? <span class="' + (s.yes ? 'yes">Yes' : 'no">No') + '</span>', searcher);
        say(s.yes
          ? 'Is ' + s.value + ' less than ' + t + '? Yes. So ' + t + ' can only be on the <b>right</b> of position ' + mid + '.'
          : 'Is ' + s.value + ' less than ' + t + '? No, it is bigger. So ' + t + ' can only be on the <b>left</b> of position ' + mid + '.');
        searcher.face(s.yes ? 0.7 : -0.7);
        await wait(0.8); alive(r);
      } else if (s.kind === 'move') {
        await moveStep(r, s);
        low = s.low; high = s.high;
      } else if (s.kind === 'end') {
        await endStep(r, s);
      }
    }
  }
  function say0(n) { return 'The ' + n + ' buddies stand in order. LOW starts at position 1. HIGH starts at position ' + n + '.'; }

  // the half that cannot hold the target is shoved aside and leaves for the "Not needed" area
  async function moveStep(r, s) {
    const mid = s.mid, isLow = s.which === 'low';
    highlight(isLow ? 18 : 20);
    calc(isLow ? 'Low ← Mid + 1 = ' + mid + ' + 1 = ' + s.low : 'High ← Mid - 1 = ' + mid + ' - 1 = ' + s.high);
    say('Positions ' + (s.from === s.to ? s.from : s.from + ' to ' + s.to) + ' cannot hold ' + cfg.target + '. They are not needed. ' +
      (isLow ? 'LOW moves to MID + 1 = <b>' + s.low + '</b>.' : 'HIGH moves to MID - 1 = <b>' + s.high + '</b>.'));
    bubble(null);
    const m = buddies[mid];
    m.pose.raise = 0;
    m.walkTo(xOf(mid), 0, 1.4);
    await until(() => m.arrived); alive(r);
    m.face(0);
    // who pushes: the neighbour on the side that stays, or the searcher when nobody is left there
    const dir = isLow ? -1 : 1, ps = mid - dir;
    const keeps = ps >= s.low && ps <= s.high;
    const pusher = keeps ? buddies[ps] : searcher;
    if (!keeps) { searcher.walkTo(xOf(ps), 0, 2.4); await until(() => searcher.arrived); alive(r); }
    const home = { x: pusher.pos.x, z: pusher.pos.z };
    pusher.face(dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    await wait(0.25); alive(r);
    pusher.pose.push = 1;
    pusher.walkTo(home.x + dir * 0.24, home.z, 2.6);
    await wait(0.16); alive(r);
    m.bump(dir * 3.4, 0, 1.4); m.face(-dir * 0.6);
    stage.shake(0.06);
    await wait(0.35); alive(r);
    pusher.pose.push = 0; pusher.walkTo(home.x, home.z, 1.2);
    // the shove ripples along the half: each buddy bumps into the next one
    const wave = [];
    for (let p = mid + dir, k = 1; p >= s.from && p <= s.to; p += dir, k++) wave.push({ b: buddies[p], at: simTime + 0.07 * k - 0.05 });
    const settle = simTime + 0.75 + 0.07 * wave.length;
    await until(() => {
      for (const w of wave) if (w.at != null && simTime >= w.at) { w.b.bump(dir * 2.4, 0, 0.9); w.at = null; }
      return simTime >= settle;
    }); alive(r);
    // the new LOW or HIGH, and off they go
    stage.setMarks(isLow ? { LOW: s.low, MID: 0 } : { HIGH: s.high, MID: 0 });
    stage.setRange(s.low, s.high);
    vars(s.low, s.high, mid, false, s.cmp);
    if (s.low <= s.high) stage.frame(xOf(s.low) - 0.6, xOf(s.high) + 0.6);
    const leaving = [];
    for (let p = s.from; p <= s.to; p++) leaving.push(buddies[p]);
    leaving.forEach((b, k) => {
      b.leaveAt = simTime + 0.05 * k; b.seatX = xOf(s.from + k); b.solid = false; b.setGrey(true);
    });
    pusher.face(0);
    searcher.walkTo(s.low <= s.high ? xOf(Math.round((s.low + s.high) / 2)) + 0.4 : xOf(mid) + 0.4, FRONT_Z, 2.2);
    for (let p = s.low; p <= s.high; p++) { const b = buddies[p]; b.hopAt = simTime + 0.2 + Math.random() * 0.5; }
    await until(() => {
      for (const b of leaving) {
        if (b.leaveAt != null && simTime >= b.leaveAt) { b.walkTo(b.seatX, BACK_Z + (Math.random() - 0.5) * 0.3, 1.5 + Math.random() * 0.4); b.leaveAt = null; }
        if (b.leaveAt == null && b.arrived && !b.pose.sit) { b.face(0); b.pose.sit = 1; }
      }
      for (let p = s.low; p <= s.high; p++) { const b = buddies[p]; if (b.hopAt != null && simTime >= b.hopAt) { b.hop(1.7); b.hopAt = null; } }
      return leaving.every(b => b.pose.sit);
    }); alive(r);
    await until(() => searcher.arrived, 4); alive(r);
    searcher.face(0);
    await wait(0.3); alive(r);
  }

  async function endStep(r, s) {
    const t = cfg.target;
    bubble(null);
    run.over = true; updateButtons();
    if (s.found) {
      highlight(26);
      const m = buddies[s.mid];
      calc('OUTPUT "Found at position ", ' + s.mid);
      say('<b>FOUND!</b> ' + t + ' is at position ' + s.mid + '. It took ' + s.cmp + ' check' + (s.cmp > 1 ? 's' : '') + '.');
      banner('FOUND at position ' + s.mid + ' after ' + s.cmp + ' check' + (s.cmp > 1 ? 's' : ''), 'good');
      stage.setMarks({ MID: s.mid }); stage.setRange(s.low, s.high, s.mid);
      stage.frame(xOf(s.mid) - 3, xOf(s.mid) + 3);
      m.pose.raise = 1; m.jumpEvery = 0.75; m.hop(3.2);
      searcher.pose.cheer = 1; searcher.jumpEvery = 0.9;
      for (let p = s.low; p <= s.high; p++) if (p !== s.mid) { buddies[p].pose.cheer = 1; buddies[p].jumpEvery = 1.2 + Math.random(); buddies[p].jumpT = Math.random(); }
      stage.burst(xOf(s.mid), 2.2, 0.6); stage.shake(0.08);
    } else {
      highlight(28);
      calc('OUTPUT "Not found"');
      say('LOW (' + s.low + ') is now bigger than HIGH (' + s.high + '). Nothing is left to check. ' + t + ' is <b>NOT FOUND</b> in the list. It took ' + s.cmp + ' check' + (s.cmp > 1 ? 's' : '') + '.');
      banner('NOT FOUND after ' + s.cmp + ' check' + (s.cmp > 1 ? 's' : ''), 'bad');
      stage.setMarks({ LOW: s.low, HIGH: s.high, MID: 0 }); stage.setRange(1, 0);
      const cx = (xOf(Math.max(0, s.high)) + xOf(s.low)) / 2;
      stage.frame(cx - 3, cx + 3);
      searcher.walkTo(cx, FRONT_Z - 0.2, 2.2);
      await until(() => searcher.arrived, 5); alive(r);
      searcher.face(0); searcher.pose.shrug = 1;
      bubble('?', searcher);
      await wait(1.6); alive(r);
      searcher.pose.shrug = 0.6;
    }
    vars(s.low, s.high, s.mid, s.found, s.cmp);
    updateButtons();
  }

  // ---------------------------------------------------------------- bumping into each other
  const D = 0.84;
  function collide() {
    const list = buddies;
    for (let i = 1; i < list.length; i++) {
      const a = list[i]; if (!a.solid) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]; if (!b.solid) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        if (Math.abs(dx) > D || Math.abs(dz) > D) continue;
        const d = Math.hypot(dx, dz); if (d >= D || d < 1e-5) continue;
        const nx = dx / d, nz = dz / d, over = (D - d) / 2;
        a.pos.x -= nx * over; a.pos.z -= nz * over; b.pos.x += nx * over; b.pos.z += nz * over;
        const vn = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz;
        if (vn < 0) {
          const imp = -(1 + 0.8) * vn / 2;
          a.vel.x -= imp * nx; a.vel.z -= imp * nz; b.vel.x += imp * nx; b.vel.z += imp * nz;
          const k = Math.min(1.5, imp);
          a.kick(-nx * k, -nz * k, 3); b.kick(nx * k, nz * k, 3);
          a.squash.v -= k * 1.6; b.squash.v -= k * 1.6;
          if (k > 0.8) stage.shake(0.025);
        }
      }
    }
  }

  // ---------------------------------------------------------------- the frame loop
  let last = 0, fps = 60, frames = 0, fpsT = 0;
  function tick(now) {
    const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)); last = now;
    const simDt = playing ? dt * SPEEDS[cfg ? cfg.speed : 'normal'] : 0;
    if (simDt > 0) {
      simTime += simDt;
      if (waiters.length) { const due = waiters.filter(w => w.t <= simTime); waiters = waiters.filter(w => w.t > simTime); due.forEach(w => w.res()); }
      if (untils.length) { const due = untils.filter(u => u.fn() || simTime >= u.t); untils = untils.filter(u => due.indexOf(u) === -1); due.forEach(u => u.res()); }
      if (gateOpen && auto && simTime >= gateAt) openGate();
    }
    for (let i = 1; i < buddies.length; i++) buddies[i].update(dt, simDt);
    if (searcher) searcher.update(dt, simDt);
    if (simDt > 0) collide();
    stage.render(dt);
    placeBubble();
    frames++; fpsT += dt; if (fpsT >= 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
  }
  function frame(now) { requestAnimationFrame(frame); tick(now); }
  requestAnimationFrame(frame);

  // ---------------------------------------------------------------- controls
  $('playBtn').addEventListener('click', togglePlay);
  $('stepBtn').addEventListener('click', next);
  $('restartBtn').addEventListener('click', () => { if (cfg) begin(); });
  $('setupBtn').addEventListener('click', () => openSetup(true));
  $('viewBtn').addEventListener('click', () => stage.resetView());
  document.addEventListener('keydown', e => {
    if (!$('setup').hidden) { if (e.key === 'Escape' && cfg) $('setup').hidden = true; return; }
    const tag = (e.target && e.target.tagName) || '';
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(tag)) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
  });

  // ?debug: drive it from a test script
  if (/[?&]debug/.test(location.search)) {
    window.__sb = {
      tick(n, ms = 16.7) { for (let i = 0; i < n; i++) tick((last || performance.now()) + ms); },
      get run() { return run; }, get simTime() { return simTime; }, get gateOpen() { return !!gateOpen; },
      get fps() { return fps; }, get pending() { return [waiters.length, untils.length]; }, buddies: () => buddies, searcher: () => searcher, next, togglePlay, stage, begin,
      say: () => $('say').textContent, banner: () => $('banner').textContent
    };
  }
  refreshSetup();
  updateButtons();
  openSetup(false);
}
