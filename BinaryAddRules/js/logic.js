// Binary Addition Rules: the rule, the questions, mastery and scheduling. No DOM here, so
// tools/test_binary_add_rules.mjs can load it in node.
var BAR = (function () {
  'use strict';

  var NEED = 3;            // correct in a row to master an item
  var MASTERED_SHARE = 0.25; // how often a mastered item comes back while others are still being learned
  var SIZES = [4, 5, 6, 7, 8];
  var WORDS = ['Zero', 'One', 'Two', 'Three'];

  // The column rule from the lessons: count the 1s (carry + top + bottom).
  function rule(ones) { return { write: ones % 2, carry: ones >= 2 ? 1 : 0 }; }

  var RULE_TEXT = [
    '0 at the bottom of this column',
    '1 at the bottom of this column',
    '0 at the bottom of this column, carry 1 to the top of the next column',
    '1 at the bottom of this column, carry 1 to the top of the next column'
  ];

  // The 8 columns: carry, top bit, bottom bit.
  var PATTERNS = [];
  for (var c = 0; c < 2; c++) for (var t = 0; t < 2; t++) for (var b = 0; b < 2; b++) PATTERNS.push('' + c + t + b);
  function parsePattern(p) { return { carry: +p[0], top: +p[1], bottom: +p[2], ones: +p[0] + +p[1] + +p[2] }; }

  var STAGES = [
    { id: 'count', name: 'How many 1s?', items: PATTERNS.slice() },
    { id: 'rule', name: 'What does it mean?', items: ['0', '1', '2', '3'] },
    { id: 'place', name: 'Put the 1s in place', items: PATTERNS.slice() },
    { id: 'add', name: 'Add binary numbers', items: SIZES.map(String) }
  ];
  function stage(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; return null; }
  function key(stageId, item) { return stageId + ':' + item; }

  function newState() {
    var s = { v: 1, stage: 'count', items: {}, addReach: 4, blankTips: 0 };
    STAGES.forEach(function (st) { st.items.forEach(function (it) { s.items[key(st.id, it)] = { streak: 0, mastered: false, right: 0, wrong: 0 }; }); });
    return s;
  }
  // Fills anything missing from an older or damaged save.
  function fixState(s) {
    var fresh = newState();
    if (!s || typeof s !== 'object' || !s.items) return fresh;
    Object.keys(fresh.items).forEach(function (k) {
      var it = s.items[k];
      if (!it || typeof it !== 'object') s.items[k] = fresh.items[k];
      else { it.streak = Math.max(0, Math.min(NEED, +it.streak || 0)); it.mastered = !!it.mastered; it.right = +it.right || 0; it.wrong = +it.wrong || 0; }
    });
    if (!stage(s.stage)) s.stage = 'count';
    s.addReach = SIZES.indexOf(+s.addReach) >= 0 ? +s.addReach : 4;
    s.blankTips = +s.blankTips || 0;
    return s;
  }

  // Items a stage can ask now. Add binary numbers opens sizes one at a time.
  function openItems(s, stageId) {
    var st = stage(stageId);
    if (stageId !== 'add') return st.items.slice();
    return st.items.filter(function (it) { return +it <= s.addReach; });
  }

  // One answer. Returns what changed so the page can celebrate or warn.
  function record(s, stageId, item, ok) {
    var it = s.items[key(stageId, item)];
    var was = it.mastered, stageWas = stageDone(s, stageId), allWas = allDone(s);
    var out = { newlyMastered: false, lost: false, stageDone: false, allDone: false, opened: null };
    if (ok) {
      it.right++;
      it.streak = Math.min(NEED, it.streak + 1);
      if (it.streak >= NEED) it.mastered = true;
    } else {
      it.wrong++;
      it.streak = 0;
      it.mastered = false;
    }
    out.newlyMastered = !was && it.mastered;
    out.lost = was && !it.mastered;
    if (stageId === 'add' && it.mastered && +item === s.addReach && s.addReach < 8) { s.addReach++; out.opened = s.addReach; }
    out.stageDone = !stageWas && stageDone(s, stageId);
    out.allDone = !allWas && allDone(s);
    return out;
  }

  function stageDone(s, stageId) {
    return stage(stageId).items.every(function (it) { return s.items[key(stageId, it)].mastered; });
  }
  function allDone(s) { return STAGES.every(function (st) { return stageDone(s, st.id); }); }
  function counts(s, stageId) {
    var list = stageId ? [stage(stageId)] : STAGES, have = 0, total = 0;
    list.forEach(function (st) { st.items.forEach(function (it) { total++; if (s.items[key(st.id, it)].mastered) have++; }); });
    return { have: have, total: total };
  }

  // Next item to ask. Unmastered items most of the time; a mastered one about 1 in 4 while there are both;
  // never the same column or rule twice running when there is a choice.
  function pickItem(s, stageId, last, rnd) {
    rnd = rnd || Math.random;
    var open = openItems(s, stageId);
    var learning = open.filter(function (it) { return !s.items[key(stageId, it)].mastered; });
    var known = open.filter(function (it) { return s.items[key(stageId, it)].mastered; });
    var pool = !learning.length ? known : !known.length ? learning : (rnd() < MASTERED_SHARE ? known : learning);
    if (stageId === 'add') last = null; // every sum is new, so a size may repeat
    var choice = pool.filter(function (it) { return it !== last; });
    if (!choice.length) choice = open.filter(function (it) { return it !== last; });
    if (!choice.length) choice = open;
    return choice[Math.floor(rnd() * choice.length)];
  }

  function toBits(n, width) { var s = n.toString(2); while (s.length < width) s = '0' + s; return s; }

  // Works the written method. Bits are strings, left to right. carries[i] is the carry written at the top of
  // column i (index from the left), so carries[width - 1] (the rightmost column) is always 0.
  function solve(a, b, width) {
    var A = toBits(a, width), B = toBits(b, width), ans = [], car = [], ones = [];
    for (var i = 0; i < width; i++) { ans.push(0); car.push(0); ones.push(0); }
    var carry = 0;
    for (var col = width - 1; col >= 0; col--) {
      car[col] = carry;
      var n = carry + +A[col] + +B[col];
      var r = rule(n);
      ones[col] = n;
      ans[col] = r.write;
      carry = r.carry;
    }
    return { a: A, b: B, answer: ans, carries: car, ones: ones, overflow: carry };
  }

  // A random sum of two width-bit numbers whose total still fits in width bits (so never past 8 bits), with
  // a few carries to practise.
  function makeSum(width, rnd) {
    rnd = rnd || Math.random;
    var max = Math.pow(2, width) - 1;
    var wantCarries = Math.min(width - 2, 3);
    var best = null;
    for (var tries = 0; tries < 300; tries++) {
      var total = Math.floor(max / 2) + 1 + Math.floor(rnd() * (max - Math.floor(max / 2))); // top bit of the answer is 1
      var a = 1 + Math.floor(rnd() * (total - 1));
      var b = total - a;
      if (b < 1) continue;
      var sol = solve(a, b, width);
      var n = sol.carries.reduce(function (x, y) { return x + y; }, 0);
      var three = sol.ones.indexOf(3) >= 0;
      if (!best || n > best.n) best = { a: a, b: b, n: n };
      if (n >= wantCarries && (width < 6 || three)) return { a: a, b: b, width: width };
    }
    return { a: best.a, b: best.b, width: width };
  }

  // A stage 2 question: the rule for this many 1s, an example column, and the four options shuffled.
  function shuffle(list, rnd) {
    rnd = rnd || Math.random;
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function examplePattern(ones, rnd) {
    var list = PATTERNS.filter(function (p) { return parsePattern(p).ones === ones; });
    return list[Math.floor((rnd || Math.random)() * list.length)];
  }

  return {
    NEED: NEED, MASTERED_SHARE: MASTERED_SHARE, SIZES: SIZES, WORDS: WORDS, RULE_TEXT: RULE_TEXT, PATTERNS: PATTERNS, STAGES: STAGES,
    rule: rule, parsePattern: parsePattern, stage: stage, key: key, newState: newState, fixState: fixState, openItems: openItems,
    record: record, stageDone: stageDone, allDone: allDone, counts: counts, pickItem: pickItem, toBits: toBits, solve: solve,
    makeSum: makeSum, shuffle: shuffle, examplePattern: examplePattern
  };
})();
if (typeof module !== 'undefined') module.exports = BAR;
