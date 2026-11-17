// Circuit Siege balance test: steps the game logic headless (no rendering).
// node tools/test_circuit_siege_balance.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const D = require('../TowerDefence/js/data.js');
const Eng = require('../TowerDefence/js/engine.js');

let fails = 0;
function check(ok, msg) { if (!ok) { fails++; console.log('FAIL', msg); } }

// ---- 1. RBE per round and first appearances match the reference table
const REF_RBE = [14, 30, 30, 60, 45, 57, 85, 101, 79, 200, 69, 80, 135, 150, 120, 137, 182, 240, 125, 88, 80, 99, 121, 9, 138, 167, 400, 230, 350, 230, 414, 789, 450, 322, 826, 450, 1130, 1612, 2174, 902, 1760, 2330, 1500, 1765, 2359, 613, 2690, 3430, 3908, 3490, 3354, 3431, 2913, 4831, 4726, 8828, 5877, 5074, 5150, 2884, 4970, 3026, 6575, 4291, 7936, 5517, 7703, 5350, 10990, 11239, 9220, 5798, 7219, 23484, 11762];
const REF_FIRST = { glitch: 1, bug: 3, worm: 6, spam: 11, popup: 15, trojan: 20, fever: 22, packet: 28, hybrid: 25, poly: 35, rootkit: 24, ransom: 40, botnet: 46, mega: 60 };
const first = {};
for (let n = 1; n <= 75; n++) {
  const q = D.buildRound(n);
  const rbe = q.reduce((a, k) => a + D.ENEMIES[k].rbe, 0);
  check(rbe === REF_RBE[n - 1], `round ${n} RBE ${rbe} != ${REF_RBE[n - 1]}`);
  q.forEach(k => { if (!first[k]) first[k] = n; });
}
for (const k in REF_FIRST) check(first[k] === REF_FIRST[k], `${k} first appears ${first[k]} not ${REF_FIRST[k]}`);
// enemy stats (speed px/frame, RBE, hits)
const REF_E = { glitch: [2, 1], bug: [2.8, 2], worm: [3.6, 3], spam: [6.4, 4], popup: [7, 5], trojan: [3.6, 11], fever: [4, 11], packet: [2, 23], hybrid: [3.6, 23], poly: [4.4, 47], rootkit: [2.8, 9], ransom: [4, 103, 9], botnet: [2, 613, 200], mega: [0.5, 2884, 700] };
for (const k in REF_E) { const e = D.ENEMIES[k], r = REF_E[k]; check(e.spd === r[0] && e.rbe === r[1] && (e.hits || 1) === (r[2] || 1), `enemy ${k} stats`); }
check(D.spawnGap(1) === 20 && D.spawnGap(39) === 7 && D.spawnGap(42) === 5 && D.spawnGap(75) === 4, 'spawn gap');

// ---- 2. towers and upgrades: costs and converted stats (frames and px are 1 to 1)
const REF_T = {
  pulse: [200, 140, 90, 300, 1100], spark: [360, 210, 100, 280, 2500], router: [400, 250, 100, 280, 1850], surge: [700, 400, 200, 210, 900],
  cryo: [380, 225, 100, 400, 6000], mortar: [825, 200, 250, 800, 2000], lag: [300, 120, 200, 300, 3000], hydro: [600, 300, 150, 180, 2000],
  drone: [900, 200, 350, 700, 3500], aicore: [550, 300, 300, 2000, 8000], quantum: [4000, 1000, 3500, 4000, 20000], booster: [1000, 500, 1500, 280, 3500],
  farm: [1000, 400, 1200, 2500, 10000], cursor: [1250, 250, 600, 2500, 15000], printer: [700, 700, 600, 350, 7000], pins: [30], fuse: [25], patch: [10]
};
for (const k in REF_T) {
  const t = D.TOWERS[k], r = REF_T[k];
  check(t.cost === r[0], `${k} cost`);
  for (let i = 1; i < r.length; i++) check(t.up[i - 1] && t.up[i - 1].cost === r[i], `${k} upgrade ${i} cost`);
}
const REF_S = { // [type, level, rate, range, pierce]
  a: ['pulse', 1, 33, 100, 1], b: ['pulse', 3, 33, 125, 2], c: ['pulse', 4, 54, 130, 18], d: ['pulse', 5, 49, 155, 48],
  e: ['spark', 1, 58, 70, 1], f: ['spark', 2, 43, 70, 1], g: ['router', 1, 50, 130, 3], h: ['router', 5, 47, 130, 70],
  i: ['surge', 1, 54, 120, 18], j: ['surge', 4, 46, 145, 33], k: ['cryo', 1, 85, 60, 40], l: ['mortar', 3, 60, 9999, 40],
  m: ['lag', 1, 35, 140, 1], n: ['hydro', 1, 35, 180, 5], o: ['hydro', 5, 10, 210, 10], p: ['drone', 1, 80, 250, 10],
  q: ['aicore', 1, 38, 120, 2], r: ['aicore', 5, 33, 120, 167], s: ['quantum', 1, 2, 140, 1], t: ['quantum', 4, 1, 200, 3], u: ['cursor', 1, 7, 40, 2], v: ['printer', 1, 80, 120, 5]
};
for (const k in REF_S) {
  const [ty, lv, rate, range, pierce] = REF_S[k], s = D.stats(ty, lv);
  check(s.rate === rate && s.range === range && s.pierce === pierce, `${ty} level ${lv}: got rate ${s.rate} range ${s.range} pierce ${s.pierce}`);
}
check(D.price(825, 'easy') === 700 && D.price(825, 'hard') === 890 && D.price(30, 'hard') === 30, 'price multiplier rounds to 5');
check(D.roundPool(1, 'hard', 0) === 114, 'round 1 pool = 14 pops + 100 bonus');

// ---- 3. play a whole game headless
const SPOTS = { A: [155, 255], B: [310, 245], C: [455, 155], D: [560, 310], E: [685, 290], F: [415, 300], G: [100, 135], H: [305, 105], I: [612, 150], J: [105, 255], K: [200, 255], L: [800, 180] };
const W1 = [330, 470], W2 = [905, 300];
function spotOk(tw, towers) {
  const dist = Eng.nearest(tw.x, tw.y), water = D.TOWERS[tw.type].place === 'water';
  if (water ? !Eng.inWater(tw.x, tw.y, 14) : (dist < D.TRACK / 2 + 16 || Eng.inWater(tw.x, tw.y, -18))) return false;
  return !towers.some(t => Math.abs(t.x - tw.x) < 38 && Math.abs(t.y - tw.y) < 38);
}
function play(diff, markShare, plan, verbose) {
  const N = D.DIFF[diff].rounds;
  let cash = D.START_CASH, lives = D.DIFF[diff].lives;
  const towers = [], items = [], placed = {};
  let pi = 0;
  function spend(n) {
    while (pi < plan.length) {
      const st = plan[pi];
      if (st[0] === 'buy') {
        const [, key, type, spot] = st, c = D.price(D.TOWERS[type].cost, diff);
        if (D.unlockRound(type, diff) > n || cash < c) return;
        const at = spot === 'W1' ? W1 : spot === 'W2' ? W2 : SPOTS[spot];
        const tw = { type, x: at[0], y: at[1], lv: 1, spent: c, tgt: 0 };
        if (type === 'mortar') tw.aim = { x: 470, y: 300 };
        check(spotOk(tw, towers), 'spot ' + spot + ' is a legal place for ' + type);
        towers.push(tw); placed[key] = tw; cash -= c;
      } else {
        const [, key, lv] = st, tw = placed[key], up = D.TOWERS[tw.type].up[lv - 2];
        const c = D.price(up.cost, diff);
        if (lv === 5 && D.unlockRound(tw.type, diff, true) > n) return;
        if (cash < c) return;
        tw.lv = lv; tw.spent += c; cash -= c;
      }
      pi++;
    }
  }
  for (let n = 1; n <= N; n++) {
    spend(n);
    const w = Eng.create({ n, diff, towers, items, seed: n * 31 });
    let guard = 0;
    while (!w.done && guard++ < 200000) {
      Eng.step(w);
      if (lives - w.livesLost <= 0) break;
    }
    lives -= w.livesLost;
    items.length = 0;
    if (verbose) console.log(diff, 'round', n, 'lives', lives, 'cash', cash, 'towers', towers.length, 'frames', w.frame, JSON.stringify(w.leak), towers.map(t=>t.type[0]+t.lv).join(' '));
    if (lives <= 0) return { won: false, round: n };
    if (n < N) {
      const income = towers.reduce((a, t) => a + (t.type === 'farm' ? D.stats('farm', t.lv).income : 0), 0);
      cash += Math.round(D.roundPool(n, diff, income) * markShare);
    }
  }
  return { won: true, round: N, lives };
}

const PLAN = [
  ['buy','p1','pulse','A'],
  ['buy','p2','pulse','D'],
  ['buy','p3','pulse','C'],
  ['up','p1',2],
  ['up','p2',2],
  ['up','p3',2],
  ['up','p1',3],
  ['up','p2',3],
  ['up','p3',3],
  ['buy','t1','spark','E'],
  ['up','p1',4],
  ['up','p2',4],
  ['up','p3',4],
  ['up','t1',2],
  ['buy','b1','surge','B'],
  ['buy','p4','pulse','F'],
  ['up','p4',2],
  ['up','p4',3],
  ['up','p4',4],
  ['up','b1',2],
  ['up','b1',3],
  ['up','b1',4],
  ['buy','p5','pulse','H'],
  ['up','p5',2],
  ['up','p5',3],
  ['up','p5',4],
  ['buy','t2','spark','N'],
  ['up','t2',2],
  ['up','t2',3],
  ['up','t1',3],
  ['buy','d1','drone','Q'],
  ['up','d1',2],
  ['up','d1',3],
  ['buy','p6','pulse','O'],
  ['up','p6',2],
  ['up','p6',3],
  ['up','p6',4],
  ['buy','b2','surge','K'],
  ['up','b2',2],
  ['up','b2',3],
  ['up','b2',4],
  ['buy','f1','farm','G'],
  ['up','f1',2],
  ['up','f1',3],
  ['up','p1',5],
  ['up','p2',5],
  ['up','b1',5],
  ['up','b2',5],
  ['up','p3',5],
  ['up','p4',5],
  ['buy','f2','farm','L'],
  ['up','f2',2],
  ['up','f2',3],
  ['up','f1',4],
  ['buy','m1','mortar','I'],
  ['up','m1',2],
  ['up','m1',3],
  ['up','m1',4],
  ['up','m1',5],
  ['buy','q1','quantum','J'],
  ['up','q1',2],
  ['up','q1',3],
  ['up','q1',4],
  ['up','f2',4],
  ['buy','b3','surge','D2'],
  ['up','b3',2],
  ['up','b3',3],
  ['up','b3',4],
  ['up','b3',5],
  ['buy','q2','quantum','M2'],
  ['up','q2',2],
  ['up','q2',3],
  ['up','q2',4],
  ['buy','b4','surge','I2'],
  ['up','b4',2],
  ['up','b4',3],
  ['up','b4',4],
  ['up','b4',5],
  ['buy','q3','quantum','R'],
  ['up','q3',2],
  ['up','q3',3],
  ['up','q3',4],
  ['up','q1',5],
  ['up','q2',5],
  ['up','q3',5]
];
SPOTS.D2 = [612, 300]; SPOTS.N = [690, 180]; SPOTS.O = [400, 400]; SPOTS.M2 = [200, 380]; SPOTS.Q = [350, 330]; SPOTS.I2 = [690, 120]; SPOTS.R = [250, 420];
const verbose = process.argv.includes('-v');
if (process.env.CS_PLAN) { PLAN.length = 0; JSON.parse(require('fs').readFileSync(process.env.CS_PLAN, 'utf8')).forEach(x => PLAN.push(x)); }
const full = play('medium', 1, PLAN, verbose);
console.log('Medium, full marks:', full.won ? 'won with ' + full.lives + ' lives' : 'lost on wave ' + full.round);
check(full.won, 'scripted build clears Medium with full marks');
const none = play('medium', 0, PLAN, false);
console.log('Medium, no marks:', none.won ? 'won' : 'lost on wave ' + none.round);
check(!none.won, 'no marks loses');
console.log(fails ? fails + ' check(s) failed' : 'All checks passed');
process.exit(fails ? 1 : 0);
