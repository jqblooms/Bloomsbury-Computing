// Search Buddies 3D: the binary search itself, with no drawing. Positions start at 1, as in the Year 9 lesson.
// steps(list, target, roundUp) gives every beat the characters act out, in order. Tested by
// tools/test_search_buddies.mjs. Loaded as a plain script (window.SBSearch) and by Node (module.exports).
(function (root) {
  'use strict';

  // The pseudocode in the side panel. Line numbers below (L.*) point into this list.
  function code(roundUp) {
    return [
      'DECLARE List : ARRAY[1:N] OF INTEGER',
      'DECLARE Target : INTEGER',
      'DECLARE Low : INTEGER',
      'DECLARE High : INTEGER',
      'DECLARE Mid : INTEGER',
      'DECLARE Found : BOOLEAN',
      'Low ← 1',
      'High ← N',
      'Found ← FALSE',
      'WHILE Found = FALSE AND Low <= High DO',
      roundUp ? '   Mid ← (Low + High + 1) DIV 2' : '   Mid ← (Low + High) DIV 2',
      '   IF List[Mid] = Target',
      '      THEN',
      '         Found ← TRUE',
      '      ELSE',
      '         IF List[Mid] < Target',
      '            THEN',
      '               Low ← Mid + 1',
      '            ELSE',
      '               High ← Mid - 1',
      '         ENDIF',
      '   ENDIF',
      'ENDWHILE',
      'IF Found = TRUE',
      '   THEN',
      '      OUTPUT "Found at position ", Mid',
      '   ELSE',
      '      OUTPUT "Not found"',
      'ENDIF'
    ];
  }
  // 1-based line numbers
  var L = { init: 7, loop: 10, mid: 11, equal: 12, found: 14, less: 16, low: 18, high: 20, endIf: 24, outFound: 26, outNot: 28 };

  function midOf(low, high, roundUp) { return Math.floor((low + high + (roundUp ? 1 : 0)) / 2); }

  // Every beat of the search. Kinds: start, loop, mid, equal, less, move, found, notFound.
  // Each beat carries low, high, mid (0 when not set yet), cmp (comparisons so far) and line.
  function steps(list, target, roundUp) {
    var out = [];
    var n = list.length, low = 1, high = n, mid = 0, cmp = 0, found = false;
    out.push({ kind: 'start', low: low, high: high, mid: 0, cmp: 0, line: L.init });
    for (;;) {
      var go = !found && low <= high;
      out.push({ kind: 'loop', low: low, high: high, mid: mid, cmp: cmp, line: L.loop, go: go });
      if (!go) break;
      mid = midOf(low, high, roundUp);
      out.push({ kind: 'mid', low: low, high: high, mid: mid, cmp: cmp, line: L.mid, sum: low + high });
      var v = list[mid - 1];
      cmp++;
      if (v === target) {
        found = true;
        out.push({ kind: 'equal', low: low, high: high, mid: mid, cmp: cmp, line: L.equal, value: v, yes: true });
        out.push({ kind: 'found', low: low, high: high, mid: mid, cmp: cmp, line: L.found, value: v });
        continue;
      }
      out.push({ kind: 'equal', low: low, high: high, mid: mid, cmp: cmp, line: L.equal, value: v, yes: false });
      var less = v < target;
      out.push({ kind: 'less', low: low, high: high, mid: mid, cmp: cmp, line: L.less, value: v, yes: less });
      // the half that cannot hold the target leaves the search: from..to (mid included)
      var from = less ? low : mid, to = less ? mid : high;
      if (less) low = mid + 1; else high = mid - 1;
      out.push({ kind: 'move', low: low, high: high, mid: mid, cmp: cmp, line: less ? L.low : L.high, which: less ? 'low' : 'high', from: from, to: to });
    }
    if (found) out.push({ kind: 'end', found: true, low: low, high: high, mid: mid, cmp: cmp, line: L.outFound });
    else out.push({ kind: 'end', found: false, low: low, high: high, mid: mid, cmp: cmp, line: L.outNot });
    return out;
  }

  // Typed values: whole numbers, separated by commas or spaces. Returns { values } or { error }.
  var MIN = -999, MAX = 9999;
  function parseList(text) {
    var parts = String(text || '').split(/[\s,;]+/).filter(function (p) { return p !== ''; });
    if (!parts.length) return { error: 'Type some numbers, for example: 3, 8, 15, 21, 30' };
    if (parts.length > 31) return { error: 'Use 31 numbers or fewer. You typed ' + parts.length + '.' };
    var values = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^-?\d+$/.test(parts[i])) return { error: '"' + parts[i] + '" is not a whole number.' };
      var v = parseInt(parts[i], 10);
      if (v < MIN || v > MAX) return { error: 'Use numbers from ' + MIN + ' to ' + MAX + '.' };
      values.push(v);
    }
    return { values: values };
  }
  // The first place the list is out of order (1-based position of the smaller number), or 0 when it is in order.
  function firstOutOfOrder(values) {
    for (var i = 1; i < values.length; i++) if (values[i] < values[i - 1]) return i + 1;
    return 0;
  }
  function parseTarget(text) {
    var t = String(text || '').trim();
    if (!/^-?\d+$/.test(t)) return { error: 'Type a whole number to find.' };
    var v = parseInt(t, 10);
    if (v < MIN || v > MAX) return { error: 'Use a number from ' + MIN + ' to ' + MAX + '.' };
    return { value: v };
  }
  // n different numbers in order, from 1 to 99 (or more when n is large)
  function randomList(n, rnd) {
    rnd = rnd || Math.random;
    var top = Math.max(99, n * 3), pool = [];
    for (var i = 1; i <= top; i++) pool.push(i);
    for (var j = pool.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var t = pool[j]; pool[j] = pool[k]; pool[k] = t; }
    return pool.slice(0, n).sort(function (a, b) { return a - b; });
  }

  var api = { code: code, L: L, midOf: midOf, steps: steps, parseList: parseList, firstOutOfOrder: firstOutOfOrder, parseTarget: parseTarget, randomList: randomList, MIN: MIN, MAX: MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SBSearch = api;
})(typeof window !== 'undefined' ? window : this);
