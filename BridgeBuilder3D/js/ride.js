// Data Bridge 3D gameplay: the RIDE. Every page replays each team's drive the same way from the design and the
// server's start time (the website physics is deterministic), so bumps happen at the same moment on every page.
//   createRides({ send }) -> {
//     simFor(team, design, serverNowMs) -> ride | null   step the team's drive up to now; null when not driving.
//         ride = { sim, steps, bumps: [step numbers already happened], onAt, offAt, broke, ... }
//         also: future = [every bump step known so far, past and coming] (a second copy of the sim runs LEAD steps
//         ahead, so each bump is known before it happens), next = step of the next bump or -1.
//     riderStep(ride, team, me, input) -> { thrown, hint, warn, grip, countdown, slipping, perfect, perfects }
//         called every frame for YOUR rider: input = { hold: bool (Space or left mouse), dt };
//         thrown = true at the moment you fall off (the page then sends { type: 'thrown' } and flies your avatar off),
//         hint = big middle text ('' = nothing), warn = danger (a bump is close and you are not gripping),
//         grip = 0..1 (drains while you hold, refills while you let go; at 0 your hands slip until you let go),
//         countdown = seconds to the next bump (null when none within LEAD), perfect = true on the frame you held a
//         bump with good timing, perfects = how many perfect holds this ride.
//   }
// The skill: holding the whole ride does not work. Grip drains while held, so riders watch the countdown and grip
// just before each bump. Who falls depends only on the shared deterministic bumps and each rider's own input.
// team = { index, phase, driveAt, driveLevel, riders: [ids], thrown: [ids], penalty } from the server. The server only
// trusts 'thrown' from riders while driving; each rider thrown off costs the team `penalty` baht.
// Result reporting: when the sim ends, send({ type: 'result', state, spent }) once (any member's page may; the first counts).
import { Ph, LV } from './util.js';

const BUMP_A = 5;          // squares/s^2 of sudden up-down change that counts as a bump
const GAP = 45;            // fewest steps between two bumps (0.75 s)
const LEAD = 3 * Ph.FPS;   // bumps are known (and counted down) this many steps ahead
const DRAIN = 1 / 2.4;     // grip lost per second while holding (full grip lasts 2.4 s: holding all ride long slips)
const FILL = 1 / 2;        // grip gained per second while resting (empty to full in 2 s)
const PERFECT = 0.9;       // seconds: grabbing this close before a bump is a perfect hold
const NOW = 0.6;           // seconds: the last moment, the text says HOLD NOW
const GRACE = 8;           // steps: letting go this soon before a bump still counts as held (fair on slow frames)

export function createRides({ send }) {
  const rides = {};
  let me = null;   // my rider state for the current ride

  function scan(s, lv) {   // after each look-ahead step: find bumps in it
    const a = s.ahead, w0 = a.P[a.wheels[0]], w1 = a.P[a.wheels[1]], at = s.aSteps;
    s.ys.push((w0.y + w1.y) / 2);
    const bump = () => { if (at - s.lastBump >= GAP) { s.future.push(at); s.lastBump = at; } };
    if (s.onAt < 0 && w1.x > lv.L) { s.onAt = at; bump(); }
    if (s.offAt < 0 && w0.x > lv.R) { s.offAt = at; bump(); }
    const k = 6, Y = s.ys, i = Y.length - 1;
    if (i >= 2 * k) { const v1 = (Y[i] - Y[i - k]) * 60 / k, v0 = (Y[i - k] - Y[i - 2 * k]) * 60 / k; if (Math.abs(v1 - v0) * 60 / k > BUMP_A) bump(); }
    if (!s.aBroke && a.breakAt >= 0) { s.aBroke = true; bump(); }
  }
  const going = sim => sim.state === 'run' || sim.state === 'breaking';

  function simFor(t, design, nowMs) {
    if (t.phase !== 'drive' || !design) { delete rides[t.index]; return null; }
    const key = t.driveAt + ':' + t.driveLevel, lv = LV[t.driveLevel - 1];
    let s = rides[t.index];
    if (!s || s.key !== key) s = rides[t.index] = {
      key, sim: Ph.makeSim(lv, design), steps: 0, ahead: Ph.makeSim(lv, design), aSteps: 0,
      bumps: [], future: [], next: -1, ys: [], onAt: -1, offAt: -1, lastBump: -999, broke: false, aBroke: false, reported: false
    };
    const MAX = 60 * 50, want = Math.min(MAX, Math.floor((nowMs - t.driveAt) / 1000 * Ph.FPS));
    let n = 0;
    while (s.aSteps < Math.min(MAX, want + LEAD) && n < 300 && going(s.ahead)) { Ph.step(s.ahead); s.aSteps++; n++; scan(s, lv); }
    n = 0;
    while (s.steps < want && n < 240 && going(s.sim)) {
      Ph.step(s.sim); s.steps++; n++;
      if (!s.broke && s.sim.breakAt >= 0) s.broke = true;
    }
    while (s.bumps.length < s.future.length && s.future[s.bumps.length] <= s.steps) s.bumps.push(s.future[s.bumps.length]);
    s.next = s.bumps.length < s.future.length ? s.future[s.bumps.length] : -1;
    if (!s.reported && !going(s.sim)) {
      s.reported = true;
      setTimeout(() => send({ type: 'result', state: s.sim.state, spent: Ph.designCost(design) }), 1800);
    }
    return s;
  }

  // James 2026-11-25: pupils found the grip meter confusing. Now one traffic-light rule:
  //   GREEN "Relax" (no bump coming)  ->  AMBER "Get ready..." (a bump in 1 to 3 s)  ->  RED "HOLD SPACE NOW!" (the last 1 s).
  // Holding Space when the bump hits = safe; not holding = thrown off. Nothing else (no grip meter, no tiring).
  const RED = 1.0;
  function riderStep(s, t, id, input) {
    if (!s) { me = null; return { thrown: false, hint: '', warn: false, light: '', countdown: -1, grip: null }; }
    if (!me || me.key !== s.key) me = { key: s.key, seen: s.bumps.length, msg: '', msgUntil: -1, held: 0 };
    const F = Ph.FPS;
    let thrown = false;
    while (me.seen < s.bumps.length) {
      me.seen++;
      if (!input.hold) { thrown = true; break; }
      me.held++; me.msg = 'Held on!'; me.msgUntil = s.steps + F;
    }
    const cd = s.next >= 0 && s.next - s.steps <= LEAD ? Math.max(0, (s.next - s.steps) / F) : -1;
    let light = 'green', hint = 'Relax';
    if (cd >= 0 && cd <= RED) { light = 'red'; hint = input.hold ? 'HOLDING! Keep holding...' : 'HOLD SPACE NOW!'; }
    else if (cd >= 0) { light = 'amber'; hint = 'Get ready... a bump is coming'; }
    else if (!thrown && s.steps < me.msgUntil) hint = me.msg;
    if (!going(s.sim)) { hint = ''; light = ''; }
    return { thrown, hint, warn: light === 'red' && !input.hold, light, countdown: cd, grip: null, held: me.held };
  }
  return { simFor, riderStep, reset() { me = null; } };
}
