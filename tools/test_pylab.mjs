// Tests the Python Lab bank (PyLab/bank.js) in real Python (Skulpt, as the page runs it):
//   node tools/test_pylab.mjs
// Every draw runs; the types items give int, float or str with the reason the bank gives; only the error items stop
// with an error; every task's correct program passes its own rules and variables; every fix starter fails a test
// and every write task's starter fails.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = createRequire(import.meta.url)(path.join(ROOT, 'PyLab', 'bank.js'));
const ctx = { console, setTimeout, clearTimeout, Promise }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['skulpt.min.js', 'skulpt-stdlib.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'js', f), 'utf8'), ctx);
const Sk = ctx.Sk;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
async function run(code, inputs = []) {
  let out = '', k = 0;
  Sk.configure({ output: (t) => { out += t; }, read: (x) => { if (Sk.builtinFiles.files[x]) return Sk.builtinFiles.files[x]; throw new Error('nf ' + x); },
    inputfun: () => (k < inputs.length ? inputs[k++] : ''), inputfunTakesPrompt: true, __future__: Sk.python3, execLimit: 4000 });
  try {
    const m = await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true));
    const lines = out.split('\n'); if (lines[lines.length - 1] === '') lines.pop();
    return { out: lines, g: m.$d };
  } catch (e) { return { out: out.split('\n'), error: String(e) }; }
}
const typeOf = (v) => v instanceof Sk.builtin.bool ? 'bool' : v instanceof Sk.builtin.int_ ? 'int' : v instanceof Sk.builtin.float_ ? 'float' : v instanceof Sk.builtin.str ? 'str' : 'other';
const N = 60;
const WANT = { int: 'int', float: 'float', point0: 'float', str: 'str', strnum: 'str', add: 'int', sub: 'int', mul: 'int', div: 'float', divexact: 'float', mixed: 'float', join: 'str', joinnum: 'str', grow: 'int', half: 'float', last: 'str', lastnum: 'float', times: 'float' };
for (const [gen, f] of Object.entries(B.TYPES)) for (let i = 0; i < N; i++) {
  const it = f();
  const r = await run(it.code + '\nprint(type(' + it.name + ').__name__)');
  assert(!r.error, `${gen} ${it.code}: ${r.error}`);
  assert(r.out.at(-1) === WANT[it.why] && B.TYPE_WHY[it.why], `${gen} ${it.code} is ${r.out.at(-1)}, reason ${it.why}`);
}
for (const [set, gens] of [['vars', B.VARS_L], ['io', B.IO_L]]) for (const [gen, f] of Object.entries(gens)) {
  let errs = 0;
  for (let i = 0; i < N; i++) {
    const it = f();
    const r = await run(it.code, it.inputs || []);
    if (r.error) errs++;
    assert(gen === 'errors' || !r.error, `${set} ${gen} ${it.code}: ${r.error}`);
    assert(it.why && !/[–—]/.test(it.why), `${gen} why`);
  }
  if (gen === 'errors') assert(errs > 10 && errs < N - 10, `errors level is not mixed: ${errs} of ${N}`);
}
const same = (a, b) => a.out.join('\n') === b.out.join('\n') && !a.error && !b.error;
for (const [set, tasks] of [['WRITE', B.WRITE], ['FIX', B.FIX], ['IOWRITE', B.IOWRITE]]) for (const [name, f] of Object.entries(tasks)) for (let i = 0; i < 20; i++) {
  const t = f();
  let starterFails = false;
  for (const inp of t.tests) {
    const ref = await run(t.ref, inp), st = await run(t.starter, inp);
    assert(!ref.error && ref.out.length, `${set}.${name} ref: ${ref.error}`);
    if (!same(ref, st)) starterFails = true;
    for (const [v, [ty, val]] of Object.entries(t.vars)) { const gv = ref.g[v] || ref.g[v + "_$rw$"]; assert(gv && typeOf(gv) === ty && Sk.ffi.remapToJs(gv) === val, `${set}.${name} var ${v}`); }
  }
  assert(starterFails || Object.keys(t.vars).length, `${set}.${name}: the starter already passes`);
  for (const rule of t.rules) assert(rule.re.test(t.ref) !== !!rule.not, `${set}.${name}: the ref breaks rule ${rule.msg}`);
  assert(!/[–—]/.test(t.brief + t.title), `${set}.${name} dash`);
}
// Equivalent answers: total the other way round, and +=, pass the same checks.
{
  const t = B.WRITE.change(), alt = t.ref.replace(/coins = coins \+ /, 'coins += ');
  assert(t.rules.every((r) => r.re.test(alt) !== !!r.not), 'coins += is accepted');
  const j = B.WRITE.calc(), alt2 = j.ref.replace('price * how_many', 'how_many * price');
  assert(same(await run(j.ref), await run(alt2)) && j.rules.every((r) => r.re.test(alt2) !== !!r.not), 'total = how_many * price is accepted');
}
console.log('Python Lab bank: all draws run in Skulpt and pass their checks.');
