// Prefix, Infix and Postfix animations (NotationAnim/): every frame matches NotationLab/core.js.
// Conversions: step 1 ends fully bracketed (core toInfix full), step 2 ends with each operator at the end or front of
// its brackets, step 3 is core toPrefix / toPostfix, and every frame is the same tree. Stacks: the frames are
// core stackSteps and end at core evaluate. Four Corners: the right corner is core's answer, the three wrong ones
// differ from it and from each other. No dashes in any text.
// Run: node tools/test_notation_anim.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const NC = require('../NotationLab/core.js');
const A = require('../NotationAnim/frames.js');
let fails = 0, runs = 0;
const fail = (m) => { fails++; if (fails < 30) console.log('FAIL', m); };
const dash = (s) => /[–—]/.test(s);
const strip = (s) => s.replace(/[()]/g, ' ').trim().split(/\s+/).join(' ');

function checkTree(t, name) {
  ['postfix', 'prefix'].forEach((target) => {
    runs++;
    const c = A.convert(t, target), fr = c.frames, want = NC.show(target === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    if (c.answer !== want || strip(fr[fr.length - 1].text) !== want) fail(`${name} ${target}: ends ${fr[fr.length - 1].text}, core ${want}`);
    const s1 = fr.filter((f) => f.step === 1), s2 = fr.filter((f) => f.step === 2);
    if (s1[s1.length - 1].text !== NC.toInfix(t, { full: true }).replace(/\( /g, '(')) fail(`${name}: bracketed ${s1[s1.length - 1].text} vs ${NC.toInfix(t, { full: true })}`);
    s1.forEach((f) => { if (!NC.sameTree(NC.parseInfix(f.text), t)) fail(`${name}: step 1 frame ${f.text} is a different sum`); });
    if (!NC.sameTree(NC.parseInfix(fr[0].text), t) || fr[0].text !== NC.toInfix(t)) fail(`${name}: first frame ${fr[0].text}`);
    // after the moves, every bracket pair holds one operator at its end or front
    const last2 = s2[s2.length - 1].text;
    const re = target === 'prefix' ? /\([-+*/↑] [^()\s]+ [^()\s]+\)/ : /\([^()\s]+ [^()\s]+ [-+*/↑]\)/;
    let x = last2, guard = 0; while (re.test(x) && guard++ < 20) x = x.replace(re, 'Z');
    if (x !== 'Z') fail(`${name} ${target}: moved form ${last2}`);
    if (s2.length !== NC.opCount(t) + 1) fail(`${name}: ${s2.length} move frames`);
    fr.forEach((f) => { if (dash(f.note)) fail(`${name}: dash in ${f.note}`); });
  });
  ['postfix', 'prefix'].forEach((form) => {
    runs++;
    const list = form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t), st = A.stack(list, form), core = NC.stackSteps(list, form);
    if (JSON.stringify(st.map((s) => [s.value, s.stack])) !== JSON.stringify(core.map((s) => [s.value, s.stack]))) fail(`${name} ${form}: stack differs`);
    if (st[st.length - 1].stack.length !== 1 || st[st.length - 1].value !== NC.evaluate(t)) fail(`${name} ${form}: ends ${st[st.length - 1].value}, core ${NC.evaluate(t)}`);
    st.forEach((s) => { if (s.kind === 'apply' && NC.apply(s.token, s.left, s.right) !== s.value) fail(`${name}: ${s.note}`); });
  });
}

A.EXAMPLES.concat(['(8 - 2) * 3 + 4', '3 4 + 2 *']).forEach((e) => { const t = A.check(e) || NC.parsePostfix(e); if (!t) return fail('cannot read ' + e); checkTree(t, e); });
for (let k = 0; k < 400; k++) {
  const t = NC.randomTree({ n: 1 + NC.rand(5), ops: ['+', '-', '*', '/', NC.POW], max: 200 });
  checkTree(t, NC.toInfix(t));
}

const pool = A.allQuestions();
if (pool.length < 30) fail('only ' + pool.length + ' Four Corners questions');
['postfix', 'prefix', 'evalPostfix', 'evalPrefix'].forEach((k) => { if (!pool.some((q) => q.kind === k)) fail('no ' + k + ' question'); });
pool.forEach((p) => {
  for (let r = 0; r < 5; r++) {
    runs++;
    const t = A.check(p.expr), q = A.question(t, p.kind, true), form = q.form;
    const right = p.kind.startsWith('eval') ? String(NC.evaluate(t)) : NC.show(form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    if (q.answers[q.right] !== right) fail(`${p.expr} ${p.kind}: right corner ${q.answers[q.right]}, core ${right}`);
    if (new Set(q.answers).size !== 4) fail(`${p.expr} ${p.kind}: repeated answers ${q.answers}`);
    if (p.kind.startsWith('eval')) {
      if (q.shown !== NC.show(q.list) || NC.evaluate(form === 'prefix' ? NC.parsePrefix(q.list) : NC.parsePostfix(q.list)) !== NC.evaluate(t)) fail(`${p.expr}: shown ${q.shown}`);
      q.answers.forEach((a) => { if (!Number.isInteger(Number(a))) fail(`${p.expr} ${p.kind}: answer ${a}`); });
    } else {
      // a wrong written answer must not be the same sum
      q.answers.forEach((a, i) => { if (i === q.right) return; const w = form === 'prefix' ? NC.parsePrefix(a) : NC.parsePostfix(a); if (w && NC.sameTree(w, t)) fail(`${p.expr}: wrong ${a} is right`); });
    }
    q.why.forEach((w) => { if (dash(w)) fail('dash in ' + w); });
  }
});
console.log(fails ? `${fails} failures` : `OK: ${runs} checks, ${pool.length} Four Corners questions`);
process.exit(fails ? 1 : 0);
