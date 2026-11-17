// Tests the model of CPU Lab activity=isa (CpuLab/isa.js): every level, many draws, every screen.
//   node tools/test_cpulab_isa.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {}, document: { getElementById: () => null }, location: { search: '' }, URLSearchParams, console, Math, Object, JSON, String, Number, Error };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'CpuLab/common.js'), 'utf8').replace(/if \(window\.ResizeObserver\)[^\n]*\n/, '').replace(/window\.addEventListener\([^\n]*\n/, ''), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'CpuLab/isa.js'), 'utf8'), ctx);
const M = ctx.IsaLabModel;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; if (fails < 20) console.log('FAIL ' + m); } };

// By hand: the lesson's own program (LOAD 6, ADD 7, OUTPUT with 12 and 30).
ok(M.encode({ op: 'LOAD', arg: 6 }, M.OPC_A) === '00010110', 'LOAD 6 is 0001 0110');
const r = M.run(['00010110', '00100111', '01010000'], { 6: 12, 7: 30 }, M.SET_A);
ok(r.outputs[0] === 42 && r.stop === -1, 'runs to 42');
const rb = M.run(['00010110', '00100111', '01010000'], { 6: 12, 7: 30 }, { '0001': 'OUTPUT', '0010': 'LOAD', '0011': 'ADD', '0100': 'STORE' });
ok(rb.outputs[0] === 0 && rb.stop === 2, 'CPU B outputs 0 then stops at 2');
['ADD 7', 'add 7', 'ADD7', ' Add  7 '].forEach((t) => { const x = M.readIns(t); ok(x && x.op === 'ADD' && x.arg === 7, 'reads ' + t); });

const typed = (s) => s.type === 'pick' ? s.answer : s.type === 'num' ? String(s.answer) : (s.answer.op === 'OUTPUT' ? 'output' : s.answer.op.toLowerCase() + ' ' + s.answer.arg);
const wrong = (s) => s.type === 'pick' ? s.options.find((o) => o !== s.answer) : s.type === 'num' ? String(s.answer + 1) : (s.answer.op === 'ADD' ? 'SUB ' : 'ADD ') + s.answer.arg;
for (let lv = 0; lv < 4; lv++) {
  for (let n = 0; n < 2000; n++) {
    const R = M.make(lv);
    ok(R.screens.length >= 2 && R.screens.length <= 5, `L${lv + 1} screens ${R.screens.length}`);
    for (const s of R.screens) {
      ok(M.ready(s, typed(s)) && M.right(s, typed(s)), `L${lv + 1} right passes ${s.q}`);
      ok(!M.right(s, wrong(s)), `L${lv + 1} wrong fails ${s.q} ${wrong(s)}`);
      if (s.type === 'pick') ok(s.options.includes(s.answer) && new Set(s.options).size === s.options.length && s.options.length >= 2, `L${lv + 1} options ${s.options}`);
      if (s.type === 'num') ok(s.answer >= 0 && s.answer < 256, 'num in range');
      ok(!/[–—]/.test(s.q + s.why), 'no dash');
    }
    if (R.kind === 'one') ok(!M.right(R.screens[1], String(parseInt(R.screens[0].view.code.slice(0, 4), 2))), 'L1 opcode as operand fails');
    if (R.kind === 'differ') ok(R.screens.slice(0, -1).some((s, k) => s.answer !== R.P.ins[k].op), 'L4 CPU B differs somewhere');
  }
}
console.log(fails ? fails + ' failures' : 'All isa model checks passed.');
process.exit(fails ? 1 : 0);
