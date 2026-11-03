// Checks Binary Addition Rules' logic (BinaryAddRules/js/logic.js): the column rule, the sum generator and
// mastery. Run: node tools/test_binary_add_rules.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const BAR = require('../BinaryAddRules/js/logic.js');

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) passes++; else { fails++; console.log('FAIL: ' + msg); } }

// The rule.
[[0, 0, 0], [1, 1, 0], [2, 0, 1], [3, 1, 1]].forEach(([n, w, c]) => {
  const r = BAR.rule(n);
  ok(r.write === w && r.carry === c, 'rule for ' + n + ' ones');
});
ok(BAR.PATTERNS.length === 8 && new Set(BAR.PATTERNS).size === 8, '8 column patterns');
ok(BAR.RULE_TEXT.filter((t) => t.length < 40).length === 2, 'two short and two long rule options');

// solve() agrees with real addition.
for (let w = 4; w <= 8; w++) {
  for (let a = 0; a < 2 ** w; a += 3) for (let b = 0; a + b < 2 ** w; b += 5) {
    const s = BAR.solve(a, b, w);
    ok(parseInt(s.answer.join(''), 2) === a + b && s.overflow === 0 && s.carries[w - 1] === 0, `solve ${a}+${b} (${w} bits)`);
  }
}

// The generator: never overflows, uses every column, has carries.
for (let w = 4; w <= 8; w++) {
  let carries = 0;
  for (let i = 0; i < 2000; i++) {
    const q = BAR.makeSum(w);
    ok(q.a >= 1 && q.b >= 1 && q.a + q.b < 2 ** w && q.a + q.b <= 255, `no overflow ${q.a}+${q.b} at ${w} bits`);
    ok(q.a + q.b >= 2 ** (w - 1), `answer uses every column (${w} bits)`);
    carries += BAR.solve(q.a, q.b, w).carries.reduce((x, y) => x + y, 0);
  }
  ok(carries / 2000 >= Math.min(w - 2, 3), `enough carries at ${w} bits (${(carries / 2000).toFixed(1)})`);
}

// Mastery: 3 in a row; a mistake resets and drops a mastered item.
let s = BAR.newState();
let r = BAR.record(s, 'count', '101', true); ok(!r.newlyMastered, 'not mastered after 1');
BAR.record(s, 'count', '101', true);
r = BAR.record(s, 'count', '101', false); ok(s.items['count:101'].streak === 0, 'mistake resets streak');
BAR.record(s, 'count', '101', true); BAR.record(s, 'count', '101', true);
r = BAR.record(s, 'count', '101', true); ok(r.newlyMastered && s.items['count:101'].mastered, 'mastered after 3 in a row');
r = BAR.record(s, 'count', '101', true); ok(!r.newlyMastered && s.items['count:101'].mastered, 'stays mastered');
r = BAR.record(s, 'count', '101', false); ok(r.lost && !s.items['count:101'].mastered && s.items['count:101'].streak === 0, 'a mistake drops it back');

// Stage done and everything done.
s = BAR.newState();
BAR.STAGES.forEach((st) => {
  let last;
  for (let guard = 0; guard < 500 && !BAR.stageDone(s, st.id); guard++) {
    const it = BAR.pickItem(s, st.id, last); last = it;
    last = it;
    r = BAR.record(s, st.id, it, true);
  }
  ok(BAR.stageDone(s, st.id), 'stage ' + st.id + ' can be mastered');
});
ok(BAR.allDone(s) && BAR.counts(s).have === 25 && BAR.counts(s).total === 25, 'everything mastered, 25 items');

// Sizes grow: only 4 bits at first, the next size opens when the newest is mastered.
s = BAR.newState();
ok(BAR.openItems(s, 'add').join() === '4', 'starts with 4-bit sums only');
for (let i = 0; i < 3; i++) r = BAR.record(s, 'add', '4', true);
ok(r.opened === 5 && BAR.openItems(s, 'add').join() === '4,5', '5-bit opens after 4-bit is mastered');
BAR.record(s, 'add', '4', false);
ok(BAR.openItems(s, 'add').join() === '4,5', 'losing 4-bit keeps 5-bit open');

// Scheduling: mastered items about 1 in 4 while others are still being learned; never the same twice running.
s = BAR.newState();
['000', '001', '010', '011'].forEach((p) => { for (let i = 0; i < 3; i++) BAR.record(s, 'count', p, true); });
let known = 0, repeats = 0, last = null;
const N = 20000;
for (let i = 0; i < N; i++) {
  const it = BAR.pickItem(s, 'count', last);
  if (it === last) repeats++;
  if (s.items['count:' + it].mastered) known++;
  last = it;
}
ok(Math.abs(known / N - 0.25) < 0.03, 'mastered share ' + (known / N).toFixed(3) + ' near 0.25');
ok(repeats === 0, 'no item twice in a row');
// Sums: with 4 and 5 bits mastered and 6 bits new, mastered sizes still come up about 1 in 4.
s = BAR.newState();
['4', '5'].forEach((z) => { for (let i = 0; i < 3; i++) BAR.record(s, 'add', z, true); });
known = 0;
for (let i = 0; i < N; i++) { const it = BAR.pickItem(s, 'add', i % 2 ? '6' : '4'); if (it !== '6') known++; }
ok(s.addReach === 6 && Math.abs(known / N - 0.25) < 0.03, 'sum sizes: mastered share ' + (known / N).toFixed(3));
// All mastered: questions keep coming.
s = BAR.newState();
BAR.PATTERNS.forEach((p) => { for (let i = 0; i < 3; i++) BAR.record(s, 'count', p, true); });
ok(BAR.PATTERNS.indexOf(BAR.pickItem(s, 'count', null)) >= 0, 'still asks once all mastered');

// A damaged save is repaired.
const fixed = BAR.fixState({ items: { 'count:000': { streak: 9, mastered: 1 } }, stage: 'nope', addReach: 99 });
ok(fixed.items['count:000'].streak === 3 && fixed.stage === 'count' && fixed.addReach === 4 && fixed.items['add:8'], 'fixState');

console.log(passes + ' passed, ' + fails + ' failed');
process.exit(fails ? 1 : 0);
