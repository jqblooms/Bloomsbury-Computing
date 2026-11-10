// FDE Steps logic test: every stage item, many random memories. node tools/test_fde_steps.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const FDE = require('../FdeSteps/js/logic.js');
let fails = 0, checks = 0;
function ok(c, msg) { checks++; if (!c) { fails++; if (fails < 20) console.log('FAIL', msg); } }
const DASH = /[–—]|&mdash;|&ndash;/;

for (let t = 0; t < 2000; t++) {
  const M = FDE.memory();
  const nums = [...M.addrs, M.vx, M.vy];
  ok(new Set(nums).size === nums.length, 'memory values differ');
  for (const op of ['LOAD', 'ADD']) {
    const c = FDE.caseOf(M, op), list = FDE.moves(c);
    ok(list.length === 10, 'ten moves');
    const end = list[9].after;
    ok(end.PC === String(c.pc + 1), 'PC ends +1');
    ok(end.ACC === String(op === 'LOAD' ? M.vx : M.vx + M.vy), 'ACC result ' + op);
    ok(end.CIR === c.ins, 'CIR holds the instruction');
    list.forEach(m => {
      ok(!DASH.test(m.text + m.why), 'no dashes ' + m.id);
      if (m.value != null) {
        const o = FDE.holdOptions(m, c);
        ok(o.length === 3 && new Set(o).size === 3 && o[0] === m.value, 'hold options ' + m.id + ' ' + JSON.stringify(o));
        ok(m.after[m.to] === m.value, 'after matches value ' + m.id);
      }
    });
  }
}
// Stage items all resolve.
FDE.STAGES.forEach(st => st.items.forEach(it => {
  for (let t = 0; t < 200; t++) {
    if (st.id === 'next') {
      const q = FDE.nextQuestion(it);
      ok(q.options.length === 3 && new Set(q.options.map(m => m.text)).size === 3, 'next options ' + it);
      ok(q.options.includes(q.right), 'next has right ' + it);
    } else if (st.id !== 'run') {
      const c = FDE.caseOf(FDE.memory(), FDE.opFor(it)), m = FDE.moveOf(FDE.moves(c), it);
      ok(m && m.id === it, 'move found ' + st.id + ' ' + it);
    }
  }
}));
// Mastery and fading help.
const s = FDE.newState();
ok(FDE.helpLevel(s, 'stage', 'f1') === 2, 'full help when new');
FDE.record(s, 'stage', 'f1', true);
ok(FDE.helpLevel(s, 'stage', 'f1') === 1, 'less help after one');
FDE.record(s, 'stage', 'f1', true);
ok(FDE.helpLevel(s, 'stage', 'f1') === 0, 'no help after two');
const r = FDE.record(s, 'stage', 'f1', true);
ok(r.newlyMastered, 'mastered after three');
FDE.record(s, 'stage', 'f1', false);
ok(!s.items['stage:f1'].mastered && FDE.helpLevel(s, 'stage', 'f1') === 2, 'mistake resets');
ok(FDE.fixState(null).stage === 'stage', 'fixState');
console.log(fails ? fails + ' FAILED of ' + checks : 'All ' + checks + ' checks passed');
process.exit(fails ? 1 : 0);
