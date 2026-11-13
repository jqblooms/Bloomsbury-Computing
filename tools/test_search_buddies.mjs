// Tests the binary search that Search Buddies 3D acts out (SearchBuddies3D/js/search.js).
// node tools/test_search_buddies.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const S = require('../SearchBuddies3D/js/search.js');

let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails < 20) console.log('FAIL', msg); } };

function reference(list, target, roundUp) {
  let low = 1, high = list.length, cmp = 0;
  while (low <= high) {
    const mid = Math.floor((low + high + (roundUp ? 1 : 0)) / 2);
    cmp++;
    if (list[mid - 1] === target) return { found: true, mid, cmp };
    if (list[mid - 1] < target) low = mid + 1; else high = mid - 1;
  }
  return { found: false, cmp, low, high };
}

function check(list, target, roundUp, label) {
  const st = S.steps(list, target, roundUp);
  const ref = reference(list, target, roundUp);
  const end = st[st.length - 1];
  const where = label + ' list=[' + list + '] target=' + target + ' up=' + roundUp;
  ok(st[0].kind === 'start' && st[0].low === 1 && st[0].high === list.length, 'start ' + where);
  ok(end.kind === 'end' && end.found === ref.found, 'found flag ' + where);
  ok(end.found === list.includes(target), 'found matches includes ' + where);
  ok(end.cmp === ref.cmp, 'comparisons ' + where);
  ok(end.cmp <= Math.floor(Math.log2(list.length)) + 1, 'at most log2 n + 1 comparisons ' + where);
  if (end.found) ok(list[end.mid - 1] === target, 'found position holds target ' + where);
  else ok(end.low === end.high + 1, 'not found: LOW is HIGH + 1 ' + where);
  // every middle is inside LOW..HIGH and rounded the right way
  st.filter(s => s.kind === 'mid').forEach(s => {
    ok(s.mid >= s.low && s.mid <= s.high, 'mid inside range ' + where);
    ok(s.mid === Math.floor((s.low + s.high + (roundUp ? 1 : 0)) / 2), 'mid rounding ' + where);
  });
  // the halves that leave never overlap, never hold the target, and LOW/HIGH move past them
  const gone = new Set();
  st.filter(s => s.kind === 'move').forEach(s => {
    for (let p = s.from; p <= s.to; p++) { ok(!gone.has(p), 'left twice ' + where); gone.add(p); ok(list[p - 1] !== target, 'threw away the target ' + where); }
    if (s.which === 'low') ok(s.low === s.mid + 1 && s.from <= s.mid && s.to === s.mid, 'LOW move ' + where);
    else ok(s.high === s.mid - 1 && s.from === s.mid && s.to >= s.mid, 'HIGH move ' + where);
  });
  // not found: every position has left
  if (!end.found) ok(gone.size === list.length, 'not found: everyone left ' + where);
  // beats in a sensible order: mid, equal, then found or less, move
  for (let i = 0; i < st.length; i++) {
    if (st[i].kind === 'mid') ok(st[i + 1].kind === 'equal', 'equal after mid ' + where);
    if (st[i].kind === 'equal') ok(st[i + 1].kind === (st[i].yes ? 'found' : 'less'), 'after equal ' + where);
    if (st[i].kind === 'less') ok(st[i + 1].kind === 'move', 'move after less ' + where);
  }
}

let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

for (const up of [false, true]) {
  // 1-item lists
  check([5], 5, up, 'one item found'); check([5], 2, up, 'one item low'); check([5], 9, up, 'one item high');
  for (let n = 1; n <= 31; n++) {
    for (let rep = 0; rep < 12; rep++) {
      const list = S.randomList(n, rnd);
      ok(list.length === n && S.firstOutOfOrder(list) === 0 && new Set(list).size === n, 'randomList n=' + n);
      list.forEach(v => check(list, v, up, 'each value'));
      check(list, list[0], up, 'first'); check(list, list[n - 1], up, 'last');
      check(list, list[0] - 1, up, 'below all'); check(list, list[n - 1] + 1, up, 'above all');
      for (let i = 1; i < n; i++) if (list[i] - list[i - 1] > 1) check(list, list[i - 1] + 1, up, 'gap');
    }
  }
  // duplicates still find a copy
  check([1, 2, 2, 2, 3], 2, up, 'dups'); check([4, 4, 4, 4], 4, up, 'all same'); check([4, 4, 4, 4], 5, up, 'all same missing');
}

// the lesson's own worked example: 15 items, target at index 13, 4 comparisons, middles 8, 12, 14, 13
{
  const list = [3, 9, 12, 15, 20, 24, 31, 38, 41, 47, 52, 60, 66, 72, 80];
  const st = S.steps(list, 66, false);
  ok(st.filter(s => s.kind === 'mid').map(s => s.mid).join() === '8,12,14,13', 'lesson middles');
  ok(st[st.length - 1].cmp === 4 && st[st.length - 1].mid === 13, 'lesson 4 comparisons at 13');
}

// parsing
ok(S.parseList('3, 8 15;21').values.join() === '3,8,15,21', 'parse mixed separators');
ok(!!S.parseList('').error, 'empty'); ok(!!S.parseList('1, 2.5').error, 'decimal'); ok(!!S.parseList('1, x').error, 'word');
ok(!!S.parseList(Array.from({ length: 32 }, (_, i) => i).join(',')).error, 'too many');
ok(!!S.parseList('10000').error, 'too big'); ok(S.parseList('-5 0 7').values[0] === -5, 'negatives');
ok(S.firstOutOfOrder([1, 3, 2]) === 3, 'out of order position'); ok(S.firstOutOfOrder([1, 1, 2]) === 0, 'equal neighbours are in order');
ok(S.parseTarget(' 42 ').value === 42, 'target'); ok(!!S.parseTarget('4.2').error, 'target decimal');
// the panel's line numbers point at the right lines
const code = S.code(false);
ok(code[S.L.mid - 1].includes('DIV 2') && code[S.L.equal - 1].includes('= Target') && code[S.L.less - 1].includes('< Target'), 'line numbers');
ok(code[S.L.low - 1].includes('Low ← Mid + 1') && code[S.L.high - 1].includes('High ← Mid - 1') && code[S.L.found - 1].includes('Found ← TRUE'), 'line numbers 2');
ok(code.slice(0, 6).every(l => l.startsWith('DECLARE')), 'DECLARE lines');
ok(S.code(true)[S.L.mid - 1].includes('+ 1) DIV 2'), 'round up line');
ok(!new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']').test(JSON.stringify(code)), 'no dashes');

console.log(fails ? fails + ' of ' + checks + ' checks failed' : 'All ' + checks + ' checks passed');
process.exit(fails ? 1 : 0);
