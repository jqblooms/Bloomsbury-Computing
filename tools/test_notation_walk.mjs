// NotationLab "Walk me through it" check: for thousands of random questions at every level of every mode, the
// walkthrough example is never the student's question, never has the student's answer (a number answer differs, a
// written answer appears nowhere in it), and its own steps reach its own right answer.
// Run: node tools/test_notation_walk.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const NC = require('../NotationLab/core.js');
const W = require('../NotationLab/walk.js');
const POW = NC.POW, FOUR = ['+', '-', '*', '/'], ALL = FOUR.concat([POW]);
const size = n => Array.isArray(n) ? n[0] + NC.rand(n[1] - n[0] + 1) : n;
const text = steps => steps.map(s => s.text + ' ' + s.html).join(' ').replace(/<[^>]*>/g, ' ');
let fails = 0, runs = 0;
function fail(msg) { fails++; if (fails < 20) console.log('FAIL', msg); }
function common(name, ex, cur) {
  runs++;
  if (!ex) return fail(name + ': no example found');
  if (ex.key === cur.key) fail(name + ': same question ' + cur.key);
  if (cur.numeric ? String(ex.answer) === String(cur.answer) : W.leaks(ex.steps, cur.answer)) fail(name + ': shows the answer ' + cur.answer);
  if (/[–—]/.test(text(ex.steps))) fail(name + ': dash in text');
}
const N = 300;

// Stack Machine levels
[[1, 2, ['+', '-', '*'], 60, true], [[2, 3], 0, FOUR, 80, true], [[1, 2], 0, FOUR, 80, true], [[3, 4], 0, FOUR, 99], [[3, 5], 0, ALL, 150, false, [POW]], [[4, 6], 0, ALL, 150]].forEach(L => {
  const n = Array.isArray(L[0]) ? L[0] : [L[0], L[1]];
  ['prefix', 'postfix'].forEach(form => {
    for (let k = 0; k < N; k++) {
      const o = { n: size(n), ops: L[2], max: L[3], noNeg: L[4], mustUse: L[5] };
      const t = NC.randomTree(o), list = form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t);
      const cur = { key: list.join(' '), answer: NC.evaluate(t), numeric: true };
      let made = null;
      const ex = W.pick(() => { const e = NC.randomTree({ ...o, n: size(n) }), l = form === 'prefix' ? NC.toPrefix(e) : NC.toPostfix(e); made = e; return { key: l.join(' '), answer: NC.evaluate(e), steps: W.stack(l, form) }; }, cur);
      common('stack ' + form, ex, cur);
      if (ex && !ex.steps[ex.steps.length - 1].text.includes('>' + ex.answer + '<')) fail('stack: last step does not give ' + ex.answer);
    }
  });
});

// Group It levels, and Convert Race "back to infix"
[[2, FOUR], [[3, 4], FOUR], [[4, 5], ALL]].forEach(L => ['prefix', 'postfix'].forEach(form => {
  for (let k = 0; k < N; k++) {
    const mk = () => NC.randomTree({ n: size(L[0]), ops: L[1], letters: true, digitChance: L[1] === ALL ? 0.2 : 0 });
    const t = mk(), cur = { key: NC.toPrefix(t).join(' '), answer: NC.toInfix(t) };
    const ex = W.pick(() => { const e = mk(); return { key: NC.toPrefix(e).join(' '), answer: NC.toInfix(e), steps: W.group(e, form), e }; }, cur);
    common('group ' + form, ex, cur);
    if (ex && !NC.sameTree(NC.parseInfix(ex.answer), ex.e)) fail('group: wrong infix');
  }
}));

// Convert It and Convert Race: the bracket method in every direction (implied: contest style)
const dirs = [['infix', 'postfix'], ['infix', 'prefix'], ['postfix', 'infix'], ['prefix', 'infix'], ['postfix', 'prefix'], ['prefix', 'postfix']];
[[2, FOUR, false], [[2, 3], FOUR, false], [[3, 4], FOUR, false], [[2, 3], ALL, false], [[3, 4], FOUR, true], [[4, 6], ALL, true]].forEach(L => dirs.forEach(([from, to]) => {
  const implied = L[2] && from === 'infix';
  for (let k = 0; k < N / 2; k++) {
    const mk = () => NC.randomTree({ n: size(L[0]), ops: L[1], letters: true, digitChance: implied ? 0.45 : 0 });
    const ans = t => to === 'infix' ? NC.toInfix(t) : NC.show(to === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    const t = mk(), cur = { key: NC.toPrefix(t).join(' '), answer: ans(t) };
    const ex = W.pick(() => { const e = mk(), w = W.bracket(e, from, to, { implied }); return { key: NC.toPrefix(e).join(' '), answer: w.answer, question: w.question, steps: w.steps, e, w }; }, cur);
    common('convert ' + from + ' to ' + to, ex, cur);
    if (!ex) continue;
    if (ex.answer !== ans(ex.e)) fail('convert: wrong answer');
    // The last Move step, with its brackets taken out, must read as the answer.
    const moved = ex.steps[ex.steps.length - 2].html.replace(/<[^>]*>/g, ' ').replace(/[()]/g, ' ').trim().split(/\s+/);
    const back = to === 'infix' ? NC.parseInfix(moved.join(' ')) : (to === 'prefix' ? NC.parsePrefix(moved) : NC.parsePostfix(moved));
    if (to !== 'infix' && moved.join(' ') !== ex.answer) fail('convert: moved row ' + moved.join(' ') + ' is not ' + ex.answer);
    if (to === 'infix' && !back) fail('convert: moved row unreadable');
  }
}));

console.log(fails ? fails + ' failures in ' + runs + ' runs' : 'OK: ' + runs + ' walkthroughs, none shows the question or its answer, every one reaches its own answer');
process.exit(fails ? 1 : 0);
