// Data Bridge 3D (single player): the site Data Bridge in the 3D world of the party server's team game. One player,
// one lane, no server. Each gap: QUESTION (the site's exam or fact round, in the side panel: rounds.js) -> BUILD (3D
// build mode: build3d.js) -> ALL ABOARD (10 s to hop into the cart) -> RIDE (the traffic light: hold Space on RED
// through each bump; ride.js) -> result (the site's coin rule Ph.afterTest, plus the 3D ride rule: falling off costs
// Penalty(pool), holding on all the way over a crossing pays HoldBonus(pool), as in the party server's LobbyBridge3D.cs).
// Game logic and timers run on setInterval (the site preloads apps in a hidden iframe where requestAnimationFrame never
// fires); requestAnimationFrame only draws and walks the player.
import * as THREE from 'three';
import { createBlob } from '../lib/blob.js';
import { Ph, T, MID_Z, N, LV, spots, truckAt, cartPose } from './util.js';
import { createWorld } from './world.js';
import { buildTerrain } from './terrain.js';
import { buildProps } from './props.js';
import { makeCart } from './cart.js';
import { drawBridge } from './beams.js';
import { createFx } from './fx.js';
import { createRides } from './ride.js';
import { createPlayer } from './player.js';
import { createHud } from './hud.js';
import { createBuilder } from './build3d.js';
import { createRounds } from './rounds.js';

const $ = id => document.getElementById(id);
const P = new URLSearchParams(location.search);
const KEY = 'bc-databridge3d-v1:';
const BOARD_MS = 10000, BOARD_IN_MS = 3000;     // ALL ABOARD: 10 s, cut to 3 s once you are in the cart
const RIDE_MAX_MS = 55000;
const Penalty = pool => Math.max(10, Math.round(pool * 0.1 / 5) * 5);
const HoldBonus = pool => Math.max(5, Math.round(Penalty(pool) / 2 / 5) * 5);
const hiddenNow = () => document.hidden || innerWidth === 0 || innerHeight === 0;

function load(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function store(k, v) { try { if (v == null) localStorage.removeItem(KEY + k); else localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { } }

// ---------------------------------------------------------------- the shared game object (rounds.js uses it too)
const G = {
  S: null, setId: P.get('facts') ? 'facts:' + P.get('facts') : P.get('set') || '', setTitle: '',
  learn: load('mode', 'play') === 'learn', ROUNDS: N, GOAL: Math.max(1, parseInt(P.get('goal'), 10) || 3),
  load, store,
  gameKey: () => (G.learn ? 'learn:' : 'game:') + G.setId,
  bestKey: () => (G.learn ? 'learnbest:' : 'best:') + G.setId,
  save() { if (G.S) store(G.gameKey(), G.S); },
  newGame() { G.S = { v: 1, round: 1, coins: 0, phase: 'exam', design: null, exam: null, ride: null, best: load(G.bestKey(), 0), stats: { marks: 0, max: 0, rounds: 0, log: [] } }; G.save(); },
  panel(on) { $('panel').hidden = !on; if (on) { builder.close(true); player.paused = false; } },
  updateHud() { hud.top(G.S, N, G.learn); },
  coinPop(n) { hud.coinPop(n); if (n) { const p = player.pos; fx.money(p.x * T, p.y * T + 260, p.z * T, (n > 0 ? '+' : '') + n + ' coins', n > 0); } },
  showLevel(n) { viewLevel = Math.max(1, Math.min(N, n)); },
  toBuild, resume,
};

// ---------------------------------------------------------------- the 3D parts
const world = createWorld($('view')), { scene, camera, renderer } = world;
const fx = createFx(scene), hud = createHud();
let rideEnd = null;
const rides = createRides({ send: m => { if (m && m.type === 'result' && rideEnd) rideEnd(m.state); } });
const builder = createBuilder({
  scene, camera, renderer, host: $('stage'),
  design: () => G.S && G.S.design, level: () => G.S && LV[G.S.round - 1], coins: () => G.S ? G.S.coins : 0,
  onChange: () => { G.save(); bridgeKey = ''; },
  onSend: sendPressed,
  onClose: () => { player.paused = false; },
});
const player = createPlayer(renderer.domElement, {
  onInteract: () => { if (near === 'table') openBuilder(); else if (near === 'cart') hopIn(); },
  onEscape: () => { if (builder.active) builder.close(); },
  onBuild: () => { if (builder.active) builder.close(); else openBuilder(); },
});
const me = createBlob(5, ''); scene.add(me.group);
const rounds = createRounds(G);

// one lane (lane 0) with the gap being played
let lane = null, viewLevel = 1, bridgeKey = '', near = null;
function laneFor(level) {
  if (lane && lane.level === level) return lane;
  if (lane) scene.remove(lane.group);
  const lv = LV[level - 1], group = new THREE.Group(); scene.add(group);
  group.add(buildTerrain(lv, 0, 0)); group.add(buildProps(lv, 0, 0));
  const bridge = new THREE.Group(); group.add(bridge);
  const cart = makeCart(0); cart.group.position.z = MID_Z * T; group.add(cart.group);
  lane = { level, group, bridge, cart, lv, pose: null, bumpsSeen: 0, snapShown: false };
  const sp = spots(lv); player.place(lv, sp.spawn.x, MID_Z + 1.2);
  bridgeKey = '';
  return lane;
}
function respawn() { if (!lane) return; const sp = spots(lane.lv); player.place(lane.lv, sp.spawn.x, MID_Z + 1.2); }
function seat() {
  const st = lane.cart.seat(0), c = Math.cos(lane.pose.ang), s = Math.sin(lane.pose.ang);
  return { x: lane.pose.x + st.lx * c, y: lane.pose.y + st.lx * s + Ph.WHEEL_R + 0.55, z: MID_Z + st.lz };
}

// ---------------------------------------------------------------- build, ALL ABOARD, ride
let board = null;      // { left: ms } while ALL ABOARD counts down (not saved: a reload goes back to building)
let ride = null;       // { at, elapsed, team, sim (ride.js state), r (my rider step), thrown, done }
let throwNow = false;

function toBuild(message) {
  const S = G.S;
  S.phase = 'build'; S.ride = null;
  if (!S.design) S.design = Ph.emptyDesign(LV[S.round - 1]);
  G.save(); G.showLevel(S.round); G.updateHud();
  $('panel').hidden = true;
  board = null; ride = null; bridgeKey = '';
  laneFor(S.round); builder.refresh();
  openBuilder();
  if (message) hud.note(message);
}
function openBuilder() {
  if (!G.S || G.S.phase !== 'build' || board || builder.active) return;
  player.paused = true; builder.open();
}
function sendPressed() {
  const S = G.S, d = S.design;
  if (!d.beams.length) {
    if (S.coins >= 3) { builder.say('Build a bridge first!'); return; }
    // no bridge and too little money for even one beam: another question to earn some (the party server's rule)
    builder.close(true); S.exam = null; S.design = null;
    hud.note('No coins for beams. Answer another question to earn some.');
    rounds.startRound();
    return;
  }
  builder.close(true); player.paused = false;
  board = { left: BOARD_MS };
  hud.note('ALL ABOARD! Run to the cart and hop in.');
}
function hopIn() {
  if (!board || !lane) return;
  player.place(lane.lv, lane.lv.start.x + Ph.AXLE / 2, MID_Z);
}
function sendCart() {
  const S = G.S;
  if (!player.aboard(lane.lv)) { hopIn(); hud.note('You jumped in just in time!'); }
  board = null;
  S.phase = 'drive'; S.ride = { at: Date.now(), thrown: false }; G.save();
  ride = { at: S.ride.at, elapsed: 0, team: { index: 0, phase: 'drive', driveAt: S.ride.at, driveLevel: S.round }, sim: null, r: null, thrown: false, done: false };
  rides.reset();
  rideEnd = state => finishRide(state, false);
}
// state: won, broke, fell or stuck. quiet: worked out at once (the page was closed during the ride).
function finishRide(state, quiet) {
  const S = G.S; if (!S || S.phase !== 'drive') return;
  rideEnd = null;
  if (ride) ride.done = true;
  const lv = LV[S.round - 1], cost = Ph.designCost(S.design), round = S.round;
  const thrown = quiet || !!(S.ride && S.ride.thrown);
  Ph.afterTest(S, state, cost);
  const base = S.coins;
  let extra = '';
  if (thrown) { const pen = Math.min(S.coins, Penalty(lv.pool)); S.coins -= pen; if (pen) extra = (quiet ? 'You left the ride, so you fell off: -' : 'You fell off the cart: -') + pen + ' coins.'; }
  else if (state === 'won') { const b = HoldBonus(lv.pool); S.coins += b; extra = 'You held on all the way: +' + b + ' coins!'; }
  S.ride = null;
  if (state === 'won') store(G.bestKey(), Math.max(load(G.bestKey(), 0), S.best || 0));
  S.stats.log.push(state === 'won' ? 'Round ' + round + ': crossed.' : 'Round ' + round + ': bridge failed.');
  G.save(); rounds.postResult(); G.updateHud();
  if (S.coins !== base) G.coinPop(S.coins - base);
  const won = state === 'won', all = won && S.phase === 'won';
  const title = won ? (all ? 'You crossed every gap!' : 'You made it!') : ({ broke: 'The bridge broke', fell: 'The cart fell', stuck: 'The cart got stuck' }[state] || 'The bridge failed');
  const why = { broke: 'A beam snapped and the bridge broke.', fell: 'The cart fell into the gap.', stuck: 'The cart got stuck.' }[state] || '';
  const body = won
    ? (all ? 'You beat all ' + N + ' rounds.' : 'The bridge cost ' + cost + ' coins. You keep ' + S.coins + ' coins for the next round.')
    : why + ' Answer new questions to earn coins, then try this gap again.' + (S.coins ? ' You keep ' + S.coins + ' coins.' : '');
  const show = () => {
    G.panel(true);
    $('screen').innerHTML = '<div class="bb-card b3-result ' + (won ? 'is-good' : 'is-bad') + '"><h2>' + title + '</h2><p class="bb-lead">' + body + '</p>' +
      (extra ? '<p class="bb-lead"><b>' + extra + '</b></p>' : '') +
      (!won ? '<p class="bb-lead">Tip: use triangles, and steel where the beams turned red.</p>' : '') +
      '<div class="bb-start-go"><button class="bc-btn bb-big" id="nextBtn">' + (all ? 'Play again' : 'Next: round ' + S.round) + '</button></div></div>';
    $('nextBtn').onclick = () => {
      ride = null; respawn();
      if (S.phase === 'won') { store(G.gameKey(), null); G.newGame(); }
      rounds.startRound();
    };
    try { $('nextBtn').focus({ preventScroll: true }); } catch (e) { }
  };
  if (quiet) show(); else setTimeout(show, won ? 1200 : 600);
}
function resume() {
  const S = G.S;
  G.showLevel(S.round); G.updateHud();
  if (S.phase === 'exam') { rounds.startRound(true); return; }
  if (S.phase === 'drive') {
    // closed during the ride: the physics is the same every time, so finish it now
    laneFor(S.round);
    const s = Ph.makeSim(LV[S.round - 1], S.design); Ph.run(s, 60);
    finishRide(s.state, true);
    return;
  }
  toBuild('');
}

// ---------------------------------------------------------------- game logic: timers only (works in a hidden iframe)
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(100, now - lastTick); lastTick = now;
  if (hiddenNow() || !G.S) return;
  if (board && lane) {
    if (player.aboard(lane.lv) && board.left > BOARD_IN_MS) board.left = BOARD_IN_MS;
    board.left -= dt;
    if (board.left <= 0) sendCart();
  }
  if (ride && !ride.done && G.S.phase === 'drive') {
    ride.elapsed += dt;
    const s = rides.simFor(ride.team, G.S.design, ride.at + ride.elapsed);
    ride.sim = s;
    if (s && !ride.thrown) {
      const r = rides.riderStep(s, ride.team, 'me', { hold: player.hold, dt: dt / 1000 });
      ride.r = r;
      if (r.thrown) {
        ride.thrown = true; G.S.ride.thrown = true; G.save(); throwNow = true;
        hud.note('You let go at a bump and fell off! It costs ' + Penalty(LV[G.S.round - 1].pool) + ' coins.');
      }
    }
    if (ride.elapsed > RIDE_MAX_MS && rideEnd) finishRide('stuck', false);
  }
}, 16);

// ---------------------------------------------------------------- drawing (requestAnimationFrame: drawing and walking only)
let lastT = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = lastT ? Math.min(0.1, (ts - lastT) / 1000) : 0.016; lastT = ts;
  const tsec = ts / 1000, S = G.S;
  const L = laneFor(viewLevel), lv = L.lv;
  const live = ride && ride.sim;
  // the bridge: the live ride, or the design while building
  const d = S && (S.phase === 'build' || S.phase === 'drive') ? S.design : null;
  if (live) drawBridge(L.bridge, rideDesign(), live.sim, 0);
  else {
    const k = d ? d.beams.length + ':' + d.nodes.length + ':' + Ph.designCost(d) : '-';
    if (k !== bridgeKey) { bridgeKey = k; drawBridge(L.bridge, d, null, 0); }
  }
  const w = live ? [live.sim.P[live.sim.wheels[0]], live.sim.P[live.sim.wheels[1]]] : truckAt(lv);
  L.pose = cartPose(w[0], w[1]);
  if (live) {
    if (live.bumps.length > L.bumpsSeen) { L.bumpsSeen = live.bumps.length; fx.bump(L.pose.x * T, L.pose.y * T, MID_Z * T); }
    if (live.broke && !L.snapShown) { L.snapShown = true; fx.snap(L.pose.x * T, L.pose.y * T, MID_Z * T); }
  } else { L.bumpsSeen = 0; L.snapShown = false; }
  const shake = live && live.bumps.length && live.steps - live.bumps[live.bumps.length - 1] < 12 ? Math.sin(ts / 25) * 12 : 0;
  L.cart.setPose(L.pose, shake, tsec);
  // you: riding, flying off, falling, or walking
  if (throwNow) { throwNow = false; player.throwOff(); fx.thrown(player.pos.x * T, player.pos.y * T, player.pos.z * T); }
  const riding = !!(live && !ride.thrown && !player.falling);
  const pos = player.pos;
  if (riding) Object.assign(pos, seat());
  else if (player.falling) { if (player.fall(dt, lv) === 'landed') fx.splash(pos.x * T, lv.fallY * T, pos.z * T); }
  else if (player.walk(dt, lv) === 'fell') hud.note('You fell into the gap! Back to the start.');
  const inCart = !live && player.aboard(lv);
  if (inCart && !player.airborne) pos.y = L.pose.y + Ph.WHEEL_R + 0.55;
  const hold = (riding || inCart) && player.hold;
  me.update(dt, { x: pos.x - 0.5, y: pos.z - 0.5, face: pos.face, moving: player.moving, hands: [{ down: hold, hold }, { down: hold, hold }] }, true);
  me.group.position.y = pos.y * T;
  // prompts, banner, traffic light, help line
  const sp = spots(lv), phase = S ? S.phase : '';
  near = null;
  if (S && !player.falling && !riding && !builder.active && $('panel').hidden) {
    if (board && !inCart) near = 'cart';
    else if (phase === 'build' && !board && Math.hypot(pos.x - sp.table.x, pos.z - sp.table.z) < 1.7) near = 'table';
  }
  hud.act(near === 'table' ? 'Press E: build' : near === 'cart' ? 'Press E: hop in' : '', () => { if (near === 'table') openBuilder(); else if (near === 'cart') hopIn(); });
  hud.grip(riding && ride.r ? ride.r : null);
  const kind = !S || (ride && ride.done) ? '' : board ? 'board' : phase === 'drive' ? 'drive' : phase === 'build' && !builder.active ? 'build' : '';
  hud.phase(kind, board ? String(Math.max(0, Math.ceil(board.left / 1000))) : '');
  hud.tip(builder.active || !$('panel').hidden ? '' : tipFor(phase, riding, inCart));
  if (builder.active) builder.frame(dt, tsec); else player.camera(camera, 0);
  world.update(dt, tsec, new THREE.Vector3(pos.x * T, pos.y * T, pos.z * T));
  fx.update(dt, tsec);
  renderer.render(scene, camera);
}
let rideDesignCache = null;
function rideDesign() { if (G.S && G.S.design) rideDesignCache = G.S.design; return rideDesignCache; }
function tipFor(phase, riding, inCart) {
  let h = '';
  if (riding) h = 'Watch the light. When it turns <b>RED</b>, hold <b>Space</b> until the bump.';
  else if (ride) h = 'Watch the cart!';
  else if (board) h = inCart ? 'You are in the cart! It leaves soon. Get ready to hold <b>Space</b>.' : '<b>ALL ABOARD!</b> Run to the cart and hop in (Shift or J), or press <b>E</b>.';
  else if (phase === 'build') h = 'Press <b>B</b> to build your bridge.';
  return h ? h + '<br><small>W A S D: walk. Shift or J: hop. B: build. Q and R: turn. Wheel: zoom.</small>' : '';
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- full screen (the site's way: never the browser's own)
let full = false;
function setFull(on) { full = !!on; document.documentElement.classList.toggle('b3-fs', full); $('fsBtn').textContent = full ? 'Exit full screen' : 'Full screen'; }
$('fsBtn').onclick = () => {
  const want = !full;
  if (window.parent !== window) { try { window.parent.postMessage({ type: 'BC_APP_FULLSCREEN', on: want }, '*'); } catch (e) { } }
  setFull(want);
};
addEventListener('message', e => { const m = e.data; if (e.source === window.parent && m && m.type === 'BC_APP_FULLSCREEN_STATE') setFull(!!m.on); });

// ---------------------------------------------------------------- testing hooks
window.__dataBridge3d = {
  state: () => ({ S: G.S, board, ride, near, builder: builder.active, viewLevel }),
  // build a list of [x1, y1, x2, y2, mat] beams (BridgeBuilder/js/solutions.js) into the current design
  build(list) { if (!G.S || !G.S.design) return false; list.forEach(b => Ph.addBeam(G.S.design, { x: b[0], y: b[1] }, { x: b[2], y: b[3] }, b[4])); G.save(); bridgeKey = ''; builder.refresh(); return Ph.designCost(G.S.design); },
  send: sendPressed, hopIn,
};

$('loading').remove();
if (!window.ExamGame || !Ph) $('screen').innerHTML = '<div class="bb-card bb-start"><h1>Data Bridge 3D</h1><p class="bb-lead">The question service did not load. Reload the page.</p></div>';
else rounds.showStart();
