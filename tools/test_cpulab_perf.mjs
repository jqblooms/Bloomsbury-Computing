// Tests the model of CPU Lab activity=perf (CpuLab/perf.js): every level, many draws.
//   node tools/test_cpulab_perf.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {}, document: { getElementById: () => null }, location: { search: '' }, URLSearchParams, console, Math, Object, JSON, String, Number, Error };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'CpuLab/common.js'), 'utf8').replace(/if \(window\.ResizeObserver\)[^\n]*\n/, '').replace(/window\.addEventListener\([^\n]*\n/, ''), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'CpuLab/perf.js'), 'utf8'), ctx);
const P = ctx.PerfLabModel;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; if (fails < 20) console.log('FAIL ' + m); } };
const half = (n) => Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;

// The time model by hand.
ok(P.time({ ghz: 2, cores: 2, cache: 8 }, { instr: 12, split: true, data: 4, wait: 2 }) === 3, 'split');
ok(P.time({ ghz: 2, cores: 4, cache: 8 }, { instr: 12, split: false, data: 4, wait: 2 }) === 6, 'cannot split');
ok(P.time({ ghz: 3, cores: 1, cache: 2 }, { instr: 12, split: true, data: 6, wait: 3 }) === 7, 'cache miss waits');
['3', '3 s', '3s', '3 seconds', '3.0', ' 3 ', '3.'].forEach((t) => ok(P.readTime(t) === 3, 'reads ' + t));
['', 'three', '3 minutes', '3 GHz', '-3'].forEach((t) => ok(P.readTime(t) == null, 'rejects ' + t));

const seen = [{}, {}, {}, {}];
for (let lv = 0; lv < 4; lv++) {
  for (let n = 0; n < 3000; n++) {
    const R = P.make(lv);
    const k = R.kind + (R.first ? ':' + R.first : ':' + R.best);
    seen[lv][k] = (seen[lv][k] || 0) + 1;
    if (R.kind === 'upgrade') {
      const ts = R.ups.map((u) => u.t).sort((a, b) => a - b);
      ok(ts[1] - ts[0] >= 0.5 && R.tBest === ts[0] && half(R.tBest), `L4 unique best ${ts}`);
      ok(P.grade(R, { up: R.best, tUp: String(R.tBest) }).length === 0, 'L4 right passes');
      ok(P.grade(R, { up: R.ups.find((u) => u.key !== R.best).key, tUp: String(R.tBest) }).includes('up'), 'L4 wrong upgrade fails');
      ok(P.grade(R, { up: R.best, tUp: String(R.tBest + 1) }).includes('tUp'), 'L4 wrong time fails');
      continue;
    }
    ok(half(R.tA) && half(R.tB) && R.tA > 0 && R.tB > 0, `L${lv + 1} times ${R.tA} ${R.tB}`);
    ok(R.first === (R.tA === R.tB ? 'The same time' : R.tA < R.tB ? 'CPU A' : 'CPU B'), 'winner');
    const right = { first: R.first, reason: R.reason, tA: String(R.tA), tB: String(R.tB) };
    ok(P.complete(R, right) && P.grade(R, right).length === 0, `L${lv + 1} right passes`);
    ok(P.grade(R, Object.assign({}, right, { first: P.FIRST.find((f) => f !== R.first) })).includes('first'), 'wrong first fails');
    if (lv === 0) {
      ok(R.first !== 'The same time', 'L1 never a tie');
      const diffs = ['ghz', 'cores', 'cache'].filter((x) => R.A[x] !== R.B[x]);
      ok(diffs.length === 1, 'L1 one difference ' + diffs);
      ok(P.grade(R, Object.assign({}, right, { reason: Object.values(P.REASON).find((r) => r !== R.reason) })).includes('reason'), 'L1 wrong reason fails');
      // The faster CPU is the one with the bigger number in the lit row.
      const key = { clock: 'ghz', cores: 'cores', cache: 'cache' }[R.diff];
      ok((R.A[key] > R.B[key]) === (R.first === 'CPU A'), 'L1 bigger wins');
    } else {
      ok(P.grade(R, Object.assign({}, right, { tA: String(R.tA + 0.5) })).includes('tA'), 'wrong time fails');
      ok(!P.complete(R, { first: R.first }), 'times required');
    }
    if (lv === 1) ok(R.task.split && R.A.cache >= R.task.data && R.B.cache >= R.task.data, 'L2 clock and cores only');
    if (lv === 2) ok(!R.task.split || R.A.cache < R.task.data || R.B.cache < R.task.data, 'L3 the task matters');
  }
}
// Every level shows a mix of outcomes; level 3 sometimes has the CPU with more cores losing or tying.
ok(Object.keys(seen[0]).length >= 4, 'L1 mix ' + JSON.stringify(seen[0]));
ok(seen[1]['timed:CPU A'] && seen[1]['timed:CPU B'], 'L2 both win');
ok(Object.keys(seen[2]).some((k) => /The same time/.test(k)), 'L3 has ties');
ok(seen[3]['upgrade:clock'] && seen[3]['upgrade:cores'] && seen[3]['upgrade:cache'], 'L4 each upgrade best sometimes ' + JSON.stringify(seen[3]));
console.log(JSON.stringify(seen));
console.log(fails ? `${fails} failures` : 'CPU Lab perf model: all checks pass');
process.exit(fails ? 1 : 0);
