// Checks Overflow Lab's logic (OverflowLab/js/logic.js): 8-bit addition, carries, overflow, the stored value, the
// question generators (half overflow, harder by level, no repeats), the explanations and mastery.
// Run: node tools/test_overflow_lab.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const OVL = require('../OverflowLab/js/logic.js');

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { fails++; if (fails < 30) console.log('FAIL: ' + msg); } }

// Addition, carries, overflow and the stored value for every pair.
for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) {
  const s = OVL.solve(a, b);
  const nine = s.out * 256 + parseInt(s.answer.join(''), 2);
  if (nine !== a + b || s.stored !== (a + b) % 256 || s.overflow !== (a + b > 255) || (s.out === 1) !== s.overflow ||
    parseInt(s.answer.join(''), 2) !== s.stored || s.carries[7] !== 0) ok(false, `solve ${a}+${b}`);
  else passes++;
  // carries agree with the column rule
  for (let i = 0; i < 8; i++) {
    const n = s.carries[i] + +s.a[i] + +s.b[i];
    if (n !== s.ones[i] || s.answer[i] !== n % 2 || s.made[i] !== (n >= 2 ? 1 : 0) || (i > 0 && s.carries[i - 1] !== s.made[i])) { ok(false, `column ${i} of ${a}+${b}`); break; }
  }
}
const ex = OVL.solve(200, 100);
ok(ex.stored === 44 && ex.overflow && ex.answer.join('') === '00101100', '200 + 100 stores 44');
ok(!OVL.solve(255, 0).overflow && OVL.solve(255, 1).overflow && OVL.solve(128, 128).stored === 0, 'edges 255 and 256');

// Generators: every stage and level, both outcomes, constraints hold, half and half, no repeats.
const avg = {};
OVL.STAGES.forEach((st) => {
  st.items.forEach((lv) => {
    const bag = [], recent = [];
    let over = 0, carries = 0, dist = 0, repeats = 0, run = 0, maxRun = 0, last = null;
    const N = 1200;
    for (let i = 0; i < N; i++) {
      const want = OVL.nextOutcome(bag);
      const q = OVL.makeQuestion(st.id, lv, want, recent);
      const s = OVL.solve(q.a, q.b);
      const sp = OVL.spec(st.id, lv, want);
      ok(q.over === want && s.overflow === want, `${st.id} L${lv} outcome ${q.a}+${q.b}`);
      ok(q.a >= sp.min && q.b >= sp.min && q.a <= 255 && q.b <= 255, `${st.id} L${lv} range ${q.a}+${q.b}`);
      ok(s.sum >= sp.range[0] && s.sum <= sp.range[1] && sp.test(s), `${st.id} L${lv} spec ${q.a}+${q.b} (${s.carryCount} carries)`);
      if (recent.includes(q.key)) repeats++;
      recent.push(q.key); if (recent.length > 20) recent.shift();
      if (want) over++;
      run = want === last ? run + 1 : 1; last = want; maxRun = Math.max(maxRun, run);
      carries += s.carryCount; dist += Math.abs(s.sum - 255.5);
    }
    ok(Math.abs(over / N - 0.5) < 0.02, `${st.id} L${lv} overflow share ${(over / N).toFixed(2)}`);
    ok(maxRun <= 4, `${st.id} L${lv} at most 4 of one outcome in a row (${maxRun})`);
    ok(repeats === 0, `${st.id} L${lv} no repeat in the last 20`);
    avg[st.id + lv] = { carries: carries / N, dist: dist / N };
  });
});
// Harder by level: fit gets closer to 255; the binary stages get more carries (exam L3 is the near-255 level).
ok(avg.fit1.dist > avg.fit2.dist && avg.fit2.dist > avg.fit3.dist && avg.fit3.dist < 10, 'fit: closer to 255 each level');
['watch', 'add'].forEach((id) => ok(avg[id + '1'].carries < avg[id + '2'].carries && avg[id + '2'].carries < avg[id + '3'].carries, `${id}: more carries each level`));
ok(avg.exam1.carries < avg.exam2.carries && avg.exam3.dist < 10 && avg.exam1.dist > avg.exam3.dist, 'exam: more carries, then close to 255');
console.log('levels:', Object.entries(avg).map(([k, v]) => `${k} c${v.carries.toFixed(1)} d${v.dist.toFixed(0)}`).join(', '));

// Explanations: one right, three wrong, no length tell.
let rightLen = 0, wrongLen = 0, wrongN = 0, longest = 0;
for (let i = 0; i < 2000; i++) {
  const over = i % 2 === 0, e = OVL.makeExplain(over);
  ok(e.options.length === 4 && new Set(e.options).size === 4 && e.correct >= 0, 'explain options');
  const set = OVL.EXPLAIN[over ? 'over' : 'fit'];
  ok(set.right.includes(e.options[e.correct]) && e.options.filter((o) => set.right.includes(o)).length === 1, 'exactly one right option');
  e.options.forEach((o, k) => { if (k === e.correct) rightLen += o.length; else { wrongLen += o.length; wrongN++; } });
  if (Math.max(...e.options.map((o) => o.length)) === e.options[e.correct].length) longest++;
}
ok(Math.abs(rightLen / 2000 - wrongLen / wrongN) < 4, `no length tell (${(rightLen / 2000).toFixed(1)} vs ${(wrongLen / wrongN).toFixed(1)})`);
ok(longest / 2000 < 0.5, 'the right answer is not usually the longest');
ok(JSON.stringify(OVL.EXPLAIN).search(/decimal|—|–/i) < 0, 'no decimal, no dashes');

// Mastery: 3 in a row, a mistake resets, levels open in order.
let s = OVL.newState(), r;
ok(OVL.openItems(s, 'fit').join() === '1', 'starts at level 1');
OVL.record(s, 'fit', '1', true); OVL.record(s, 'fit', '1', true);
r = OVL.record(s, 'fit', '1', false); ok(s.items['fit:1'].streak === 0 && !r.newlyMastered, 'mistake resets streak');
OVL.record(s, 'fit', '1', true); OVL.record(s, 'fit', '1', true);
r = OVL.record(s, 'fit', '1', true); ok(r.newlyMastered && r.opened === 2 && OVL.openItems(s, 'fit').join() === '1,2', 'level 2 opens');
r = OVL.record(s, 'fit', '1', false); ok(r.lost && OVL.openItems(s, 'fit').join() === '1,2', 'losing level 1 keeps level 2 open');
s = OVL.newState();
OVL.STAGES.forEach((st) => {
  for (let g = 0; g < 200 && !OVL.stageDone(s, st.id); g++) r = OVL.record(s, st.id, OVL.pickItem(s, st.id), true);
  ok(OVL.stageDone(s, st.id), st.id + ' can be mastered');
});
ok(OVL.allDone(s) && OVL.counts(s).total === 12, 'all 12 mastered');
// Mastered levels come back about 1 in 4.
s = OVL.newState();
for (let i = 0; i < 6; i++) OVL.record(s, 'add', i < 3 ? '1' : '2', true);
let known = 0; const N = 20000;
for (let i = 0; i < N; i++) if (s.items['add:' + OVL.pickItem(s, 'add')].mastered) known++;
ok(s.reach.add === 3 && Math.abs(known / N - 0.25) < 0.03, 'mastered share ' + (known / N).toFixed(3));
const fixed = OVL.fixState({ items: { 'fit:1': { streak: 9, mastered: 1 } }, stage: 'nope', reach: { fit: 7 } });
ok(fixed.items['fit:1'].streak === 3 && fixed.stage === 'fit' && fixed.reach.fit === 1 && fixed.reach.exam === 1 && fixed.items['exam:3'], 'fixState');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
