// Tests the model of CPU Lab activity=fde (CpuLab/fde.js): every round at every level, many draws.
//   node tools/test_cpulab_fde.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {}, document: { getElementById: () => null }, location: { search: '' }, URLSearchParams, console, Math, Object, JSON, String, Number, Error };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'CpuLab/common.js'), 'utf8').replace(/if \(window\.ResizeObserver\)[^\n]*\n/, '').replace(/window\.addEventListener\([^\n]*\n/, ''), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'CpuLab/fde.js'), 'utf8'), ctx);
const F = ctx.FdeLabModel;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; if (fails < 20) console.log('FAIL ' + m); } };

const FETCH = ['MAR', 'Memory', 'MDR', 'PC', 'CIR'];
const EXEC = ['CU', 'MAR', 'Memory', 'MDR', 'ACC'];
for (let lv = 0; lv < F.LEVELS.length; lv++) {
  for (let n = 0; n < 2000; n++) {
    const R = F.make(lv), L = F.LEVELS[lv], mv = R.moves;
    const want = L.stages === 'fetch' ? FETCH : L.stages === 'two' ? FETCH.concat(EXEC, FETCH, EXEC) : FETCH.concat(EXEC);
    ok(mv.map((m) => m.to).join() === want.join(), `L${lv + 1} order ${mv.map((m) => m.to)}`);
    // Every option list has three different options and holds the right value once.
    mv.forEach((m, i) => {
      if (m.ask) {
        ok(m.options.length === 3 && new Set(m.options).size === 3, `L${lv + 1} move ${i} options ${m.options}`);
        ok(m.options.filter((o) => o === m.value).length === 1, `L${lv + 1} move ${i} right value in options`);
        ok(m.options.every((o) => o !== '-' && o !== 'NaN' && !/^-/.test(o)), `L${lv + 1} move ${i} odd option ${m.options}`);
      }
      ok(F.DEST.includes(m.to) && (m.bus === null || F.BUSES.includes(m.bus)) && F.STAGES.includes(m.stage), `L${lv + 1} move ${i} shape`);
      const ph = F.phases(m);
      ok(ph.includes('to') && (m.to === 'CU') === !ph.includes('bus'), `L${lv + 1} move ${i} phases ${ph}`);
      ok(L.values ? (!!m.ask === ph.includes('value')) : !ph.includes('value'), `L${lv + 1} values phase`);
      ph.forEach((p) => { ok(F.judge(m, p, F.right(m, p)), 'right passes'); });
      ok(!F.judge(m, 'to', m.to === 'MAR' ? 'MDR' : 'MAR'), 'wrong box fails');
      ok(!F.judge(m, 'bus', m.bus === 'Data bus' ? 'Address bus' : 'Data bus'), 'wrong bus fails');
    });
    // Stage questions only at the first move of each stage, and only from level 3.
    const asked = mv.filter((m) => m.askStage).map((m) => m.stage).join();
    ok(L.askStage ? asked === (L.stages === 'two' ? 'Fetch,Decode,Execute,Fetch,Decode,Execute' : 'Fetch,Decode,Execute') : asked === '', `L${lv + 1} stage asks ${asked}`);
    // The registers follow the Cambridge model.
    const s = R.start, M = R.M, pc = Number(s.PC);
    const ins = M.cells[pc];
    ok(mv[0].regs.MAR === String(pc) && mv[2].regs.MDR === F.text(ins) && mv[3].regs.PC === String(pc + 1) && mv[4].regs.CIR === F.text(ins), `L${lv + 1} fetch registers`);
    if (L.stages !== 'fetch') {
      const n2 = M.cells[ins.a].n;
      const acc = ins.op === 'LOAD' ? n2 : ins.op === 'ADD' ? Number(s.ACC) + n2 : Number(s.ACC) - n2;
      ok(mv[6].regs.MAR === String(ins.a) && mv[8].regs.MDR === String(n2) && mv[9].regs.ACC === String(acc) && acc >= 0, `L${lv + 1} execute registers`);
      ok(mv[9].regs.PC === String(pc + 1), 'PC unchanged by execute');
    }
    if (L.stages === 'two') {
      ok(mv[10].value === String(pc + 1) && mv[19].regs.PC === String(pc + 2), 'second cycle fetches the next address');
      ok(/^ADD /.test(mv[12].value), 'second instruction is ADD');
    }
    // Memory: four different addresses and numbers, never the same as an address.
    const nums = M.addrs.concat(M.addrs.filter((a) => M.cells[a].n != null).map((a) => M.cells[a].n));
    ok(new Set(nums).size === nums.length, 'memory numbers all different');
  }
}
console.log(fails ? `${fails} failures` : 'CPU Lab fde model: all checks pass');
process.exit(fails ? 1 : 0);
