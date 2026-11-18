// Headless checks for Data Bridge (BridgeBuilder/js/physics.js): every round's layout is fair (anchors on the
// terrain, the truck starts on the ground), a designed bridge crosses inside the full-marks pool and a flimsy one
// fails, a single plank breaks, costs and build rules, and the losing rule (same round, a fresh exam round).
// Run: node tools/test_bridge_builder.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
require(path.join(here, '..', 'BridgeBuilder', 'js', 'physics.js'));
const B = globalThis.BBPhys;

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL', msg); } }

// Every round's own bridges, as [x1, y1, x2, y2, material] beams: sound (crosses within the full-marks pool, kept in
// BridgeBuilder/js/solutions.js so teacher mode can show it) and flimsy (a cheap or badly placed bridge that breaks or
// drops the truck).
require(path.join(here, '..', 'BridgeBuilder', 'js', 'solutions.js'));
const SOL = globalThis.BBSolutions;
const R = 'road', W = 'wood';
const { chain, warren, line } = SOL;
const flimsy = {
  1: chain(line(13, 0, 19, 0, 2), R),
  2: chain(line(11, 0, 21, 0, 2), R).concat([[11, -3, 13, 0, W], [21, -3, 19, 0, W]]),
  3: chain(line(12, 0, 20, 4, 2), R),
  4: chain(line(10, 2, 20, -3, 2), R).concat([[10, -1, 12, 1, W]]),
  5: warren(line(9, 0, 23, 0, 2), 2, W, W),
  6: chain(line(10, 0, 22, 0, 2), R).concat([[12, -5, 12, -1, W], [12, -1, 12, 0, W], [20, -5, 20, -1, W], [20, -1, 20, 0, W]]),
  7: warren(line(10, 0, 22, 0, 2), 2, W, W),
  8: chain(line(8, 0, 14, 0, 2), R).concat(chain(line(18, 0, 24, 0, 2), R), [[8, -2, 10, 0, W], [24, -2, 22, 0, W]]),
  9: warren(line(8, 0, 24, 0, 2), 2, W, W),
  10: chain(line(8, 0, 22, 0, 2), R).concat([[8, -2, 10, 0, W], [16, -3, 16, 0, W], [18, -3, 18, 0, W], [16, -3, 14, 0, W], [18, -3, 20, 0, W], [22, -2, 20, 0, W]])
};
const designs = {};
for (const n of Object.keys(SOL.sound)) designs[n] = { sound: SOL.sound[n], flimsy: flimsy[n] };

function build(lv, list) {
  const d = B.emptyDesign(lv), probs = [];
  for (const b of list) {
    const a = { x: b[0], y: b[1] }, c = { x: b[2], y: b[3] }, why = B.beamProblem(lv, d, a, c);
    if (why) probs.push(`${b.slice(0, 4)}: ${why}`);
    B.addBeam(d, a, c, b[4]);
  }
  return { d, probs };
}
function sim(lv, d) { const s = B.makeSim(lv, d); B.run(s, 60); return s; }
// The old flat Warren truss along y = 0, for the generic checks below.
function warrenFlat(lv, h, chord, diag) { return build(lv, warren(line(lv.L, 0, lv.R, 0, 2), h, diag, chord)).d; }

// 1. Every round: the layout is fair, a designed bridge crosses inside the full-marks pool, a flimsy one fails.
ok(B.LEVELS.length >= 10, 'at least 10 rounds');
for (let n = 1; n <= B.LEVELS.length; n++) {
  const lv = B.level(n), tag = `round ${n} (${lv.name})`;
  ok(designs[n], `${tag}: has test designs`);
  ok(lv.intro && lv.intro.length < 120, `${tag}: has a short intro line`);
  // anchors on the terrain, on the grid, on the board
  lv.anchors.forEach(a => {
    ok(B.onGround(lv, a.x, a.y, 0.01), `${tag}: anchor ${a.x},${a.y} sits on the terrain`);
    ok(Number.isInteger(a.x) && Number.isInteger(a.y) && B.pointOk(lv, a.x, a.y), `${tag}: anchor ${a.x},${a.y} is a grid point on the board`);
  });
  // the truck starts on solid ground and stays put while the bridge settles; the goal is on the ground too
  ok(B.onGround(lv, lv.start.x, lv.start.y, 0.01) && B.onGround(lv, lv.start.x + B.AXLE, lv.start.y, 0.01), `${tag}: both wheels start on the ground`);
  ok(B.onGround(lv, lv.goal.x, lv.goal.y, 0.01), `${tag}: the goal is on the ground`);
  ok(lv.fallY < Math.min(lv.start.y, lv.goal.y) - 3, `${tag}: falling is detected well below the road`);
  {
    const s = B.makeSim(lv, B.emptyDesign(lv)), y0 = s.P[s.wheels[0]].y;
    for (let i = 0; i < 60; i++) B.step(s);
    const w0 = s.P[s.wheels[0]], w1 = s.P[s.wheels[1]];
    ok(s.state === 'run' && Math.abs(w0.y - y0) < 0.05 && Math.abs(w1.y - y0) < 0.05, `${tag}: the truck is not already falling at the start`);
  }
  const good = build(lv, designs[n].sound), s = sim(lv, good.d), cost = B.designCost(good.d);
  ok(!good.probs.length, `${tag}: the designed bridge follows the build rules (${good.probs.join('; ')})`);
  ok(s.state === 'won', `${tag}: the designed bridge should hold (got ${s.state}, max stress ${s.maxStress.toFixed(2)})`);
  ok(s.maxStress < 0.7, `${tag}: the designed bridge has a safety margin (peak ${s.maxStress.toFixed(2)} of its limit, must be under 0.7)`);
  ok(cost <= lv.pool, `${tag}: the designed bridge (${cost}) fits the full-marks pool (${lv.pool})`);
  const bad = build(lv, designs[n].flimsy), sb = sim(lv, bad.d);
  ok(!bad.probs.length, `${tag}: the flimsy bridge follows the build rules (${bad.probs.join('; ')})`);
  ok(sb.state === 'broke' || sb.state === 'fell', `${tag}: the flimsy bridge should fail (got ${sb.state})`);
  const se = sim(lv, B.emptyDesign(lv));
  ok(se.state === 'fell', `${tag}: with nothing built the truck falls (got ${se.state})`);
}

// 2. A lean bridge on round 1: road plus two struts from the lower anchors, for a weak student's budget.
{
  const lv = B.level(1), d = B.emptyDesign(lv);
  B.addBeam(d, { x: lv.L, y: 0 }, { x: lv.L + 2, y: 0 }, 'road');
  B.addBeam(d, { x: lv.L + 2, y: 0 }, { x: lv.R - 2, y: 0 }, 'road');
  B.addBeam(d, { x: lv.R - 2, y: 0 }, { x: lv.R, y: 0 }, 'road');
  B.addBeam(d, { x: lv.L, y: -2 }, { x: lv.L + 2, y: 0 }, 'wood');
  B.addBeam(d, { x: lv.R, y: -2 }, { x: lv.R - 2, y: 0 }, 'wood');
  const s = sim(lv, d), cost = B.designCost(d);
  ok(s.state === 'won', `lean round 1 bridge should hold (got ${s.state})`);
  ok(cost <= lv.pool / 2 + 25, `lean round 1 bridge costs ${cost}, near half the pool`);
}

// 3. A single plank across a 4-square gap breaks under the round 4 truck (it bends: nothing holds its middle).
{
  const lv = B.level(1, { gap: 4, truck: B.LEVELS[3].truck, anchors: [[0, 0]] }), d = B.emptyDesign(lv);
  B.addBeam(d, { x: lv.L, y: 0 }, { x: lv.R, y: 0 }, 'road');
  const s = sim(lv, d);
  ok(s.state === 'broke', `single plank should break (got ${s.state})`);
  ok(s.firstBreak === 0, 'the plank is the beam that snapped');
}
// A steel single beam is just as bad: no triangle means nothing holds the middle up.
{
  const lv = B.level(1, { gap: 4, truck: 1.5, anchors: [[0, 0]] }), d = B.emptyDesign(lv);
  B.addBeam(d, { x: lv.L, y: 0 }, { x: lv.R, y: 0 }, 'road');
  B.addBeam(d, { x: lv.L, y: 0 }, { x: lv.R, y: 0 }, 'road');   // duplicate is allowed by addBeam, refused by beamProblem
  ok(B.beamProblem(lv, d, { x: lv.L, y: 0 }, { x: lv.R, y: 0 }) !== '', 'a second beam on the same two points is refused');
}

// 4. A road with no truss across round 1 (three planks, no supports) fails.
{
  const lv = B.level(1), d = B.emptyDesign(lv);
  for (let x = lv.L; x < lv.R; x += 2) B.addBeam(d, { x, y: 0 }, { x: x + 2, y: 0 }, 'road');
  const s = sim(lv, d);
  ok(s.state === 'broke' || s.state === 'fell', `road only should fail (got ${s.state})`);
}
// 5. A wood-only truss on the long gap is too weak.
{
  const lv = B.level(9), s = sim(lv, warrenFlat(lv, 2, 'wood', 'wood'));
  ok(s.state === 'broke', `wood truss on the long gap should break (got ${s.state})`);
}
// 6. Nothing built: the truck falls (or drives off the edge).
{
  const lv = B.level(1), s = sim(lv, B.emptyDesign(lv));
  ok(s.state === 'fell', `no bridge: the truck should fall (got ${s.state})`);
}

// 7. Costs: per beam, price per square times length, rounded; at least 1.
{
  const a = { x: 0, y: 0 }, b = { x: 3, y: 4 };
  ok(B.beamCost('wood', a, b) === 5 * B.MATS.wood.price, 'wood 5 long');
  ok(B.beamCost('steel', a, b) === 5 * B.MATS.steel.price, 'steel 5 long');
  ok(B.beamCost('road', { x: 0, y: 0 }, { x: 2, y: 0 }) === 2 * B.MATS.road.price, 'road 2 long');
  ok(B.beamCost('wood', { x: 0, y: 0 }, { x: 1, y: 1 }) === Math.round(Math.SQRT2 * B.MATS.wood.price), 'wood diagonal rounds');
  const lv = B.level(1), d = B.emptyDesign(lv);
  B.addBeam(d, { x: lv.L, y: 0 }, { x: lv.L + 2, y: 0 }, 'road');
  B.addBeam(d, { x: lv.L + 2, y: 0 }, { x: lv.L + 3, y: 2 }, 'steel');
  ok(B.designCost(d) === 2 * B.MATS.road.price + Math.round(Math.sqrt(5) * B.MATS.steel.price), 'design cost is the sum of beams');
  ok(B.MATS.steel.price > B.MATS.wood.price && B.MATS.steel.strength > B.MATS.wood.strength, 'steel is dearer and stronger');
  // build rules
  ok(/Too long/.test(B.beamProblem(lv, d, { x: lv.L, y: 0 }, { x: lv.L + 5, y: 0 })), 'beams longer than the maximum are refused');
  ok(/server rack/.test(B.beamProblem(lv, d, { x: lv.L - 1, y: -1 }, { x: lv.L + 1, y: 0 })), 'no nodes inside the rack');
  ok(/server rack/.test(B.beamProblem(lv, d, { x: lv.L, y: -2 }, { x: lv.L - 2, y: 1 })), 'no beams through the rack');
  { const l5 = B.level(5); ok(/server rack/.test(B.beamProblem(l5, B.emptyDesign(l5), { x: 14, y: -3 }, { x: 18, y: -3 })), 'no beams through the rock'); }
  ok(B.beamProblem(lv, d, { x: lv.L, y: -2 }, { x: lv.L + 2, y: 0 }) === '', 'a strut from a lower anchor is fine');
  // removing a beam drops loose nodes but keeps anchors
  const before = d.nodes.length;
  B.removeBeam(d, 1);
  ok(d.nodes.length === before - 1 && d.beams.length === 1, 'removing a beam drops its loose end node');
}

// 8. Game flow: a crossing keeps the leftover coins and moves on. A loss keeps the same round: the failed bridge's
// coins are spent, the leftover is kept (at most that round's pool), and the next phase is a fresh exam round.
{
  // the saved game is resumed only when this holds (game.js validSave)
  const resumable = st => st.v === 2 && st.round >= 1 && st.round <= B.LEVELS.length && /^(exam|build|testing)$/.test(st.phase);
  let g = { v: 2, round: 3, coins: 200, phase: 'testing', best: 2, design: {}, exam: {} };
  g = B.afterTest(g, 'won', 150);
  ok(g.round === 4 && g.coins === 50 && g.phase === 'exam', 'a crossing moves on and keeps the leftover');
  g.coins = 120;
  g = B.afterTest(g, 'broke', 40);
  ok(g.round === 4 && g.coins === 80 && g.phase === 'exam' && g.over.round === 4 && g.over.why === 'broke', 'a break keeps round 4, spends the bridge, back to an exam round');
  ok(g.design === null && g.exam === null, 'a loss clears the bridge and asks for a fresh exam round');
  ok(resumable(g), 'the save after a loss resumes at that exam round');
  ok(g.best === 3, 'a loss does not change the best');
  g = { v: 2, round: 6, coins: 90, phase: 'testing' };
  g = B.afterTest(g, 'fell', 10);
  ok(g.round === 6 && g.coins === 80 && g.phase === 'exam', 'a fall keeps the round too');
  g = { v: 2, round: 2, coins: 5, phase: 'testing' };
  g = B.afterTest(g, 'stuck', 30);
  ok(g.round === 2 && g.coins === 0 && g.phase === 'exam', 'a stuck truck keeps the round; coins never go below 0');
  // failing on purpose with an empty bridge cannot pile up coins: the leftover is capped at the round's pool
  g = { v: 2, round: 1, coins: 5 * B.LEVELS[0].pool, phase: 'testing' };
  g = B.afterTest(g, 'fell', 0);
  ok(g.round === 1 && g.coins === B.LEVELS[0].pool, 'the leftover after a loss is capped at the round pool');
  g = { round: B.LEVELS.length, coins: 90, phase: 'testing' };
  g = B.afterTest(g, 'won', 80);
  ok(g.phase === 'won', 'crossing the last round wins the game');
}

console.log(fails ? `${fails} failed, ${passes} passed` : `All ${passes} checks passed.`);
process.exit(fails ? 1 : 0);
