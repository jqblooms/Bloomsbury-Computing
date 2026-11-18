// Headless checks for Data Bridge (BridgeBuilder/js/physics.js): a designed truss holds the truck, a single plank
// breaks, a road with no truss fails, costs and build rules, and the game-over rule (back to round 1, 0 coins).
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

// A Warren truss: road along y = 0 in 2-square steps, triangles of height h above it.
function warren(lv, h, chord, diag, endDiag) {
  const d = B.emptyDesign(lv);
  for (let x = lv.L; x < lv.R; x += 2) B.addBeam(d, { x, y: 0 }, { x: x + 2, y: 0 }, 'road');
  for (let x = lv.L + 1; x < lv.R; x += 2) {
    const end = endDiag && (x - lv.L < 4 || lv.R - x < 4);
    B.addBeam(d, { x: x - 1, y: 0 }, { x, y: h }, end ? endDiag : diag);
    B.addBeam(d, { x, y: h }, { x: x + 1, y: 0 }, end ? endDiag : diag);
    if (x + 2 < lv.R) B.addBeam(d, { x, y: h }, { x: x + 2, y: h }, chord);
  }
  return d;
}
function sim(lv, d) { const s = B.makeSim(lv, d); B.run(s, 60); return s; }

// 1. Designed trusses hold the truck on every round, and each one fits inside a full-marks pool plus a little saved.
const sound = [[2, 'wood', 'wood'], [2, 'wood', 'wood'], [2, 'wood', 'wood'], [3, 'wood', 'wood'], [3, 'wood', 'wood'],
  [3, 'steel', 'wood', 'steel'], [3, 'steel', 'wood', 'steel'], [3, 'steel', 'wood', 'steel'], [3, 'steel', 'wood', 'steel'], [3, 'steel', 'wood', 'steel']];
for (let n = 1; n <= B.LEVELS.length; n++) {
  const lv = B.level(n), d = warren(lv, ...sound[n - 1]), s = sim(lv, d), cost = B.designCost(d);
  ok(s.state === 'won', `round ${n}: the designed truss should hold (got ${s.state}, max stress ${s.maxStress.toFixed(2)})`);
  ok(s.maxStress < 1, `round ${n}: no beam over strength`);
  ok(cost <= lv.pool * 1.1, `round ${n}: the sound truss (${cost}) should be affordable with a full-marks pool (${lv.pool})`);
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
// 5. A wood-only truss on the last round is too weak.
{
  const lv = B.level(10), s = sim(lv, warren(lv, 2, 'wood', 'wood'));
  ok(s.state === 'broke', `wood truss on round 10 should break (got ${s.state})`);
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
  ok(B.beamProblem(lv, d, { x: lv.L, y: -2 }, { x: lv.L + 2, y: 0 }) === '', 'a strut from a lower anchor is fine');
  // removing a beam drops loose nodes but keeps anchors
  const before = d.nodes.length;
  B.removeBeam(d, 1);
  ok(d.nodes.length === before - 1 && d.beams.length === 1, 'removing a beam drops its loose end node');
}

// 8. Game flow: a crossing keeps the leftover coins; any failure is game over, back to round 1 with 0 coins.
{
  let g = { round: 3, coins: 200, phase: 'test', best: 2 };
  g = B.afterTest(g, 'won', 150);
  ok(g.round === 4 && g.coins === 50 && g.phase === 'exam', 'a crossing moves on and keeps the leftover');
  g = B.afterTest(g, 'broke', 40);
  ok(g.round === 1 && g.coins === 0 && g.phase === 'over' && g.over.round === 4, 'a break is game over: round 1, 0 coins');
  g = { round: 6, coins: 90, phase: 'test' };
  g = B.afterTest(g, 'fell', 10);
  ok(g.round === 1 && g.coins === 0 && g.phase === 'over', 'a fall is game over too');
  g = { round: B.LEVELS.length, coins: 90, phase: 'test' };
  g = B.afterTest(g, 'won', 80);
  ok(g.phase === 'won', 'crossing the last round wins the game');
}

console.log(fails ? `${fails} failed, ${passes} passed` : `All ${passes} checks passed.`);
process.exit(fails ? 1 : 0);
