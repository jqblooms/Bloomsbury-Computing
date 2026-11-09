// Overflow Lab: 8-bit addition, overflow, the question generators, mastery and scheduling. No DOM here, so
// tools/test_overflow_lab.mjs can load it in node.
var OVL = (function () {
  'use strict';

  var NEED = 3;              // correct in a row to master an item
  var MASTERED_SHARE = 0.25; // how often a mastered item comes back while others are still being learned
  var LEVELS = ['1', '2', '3'];
  var PLACES = [128, 64, 32, 16, 8, 4, 2, 1];

  var STAGES = [
    { id: 'fit', name: 'Will it fit?', levels: ['Far from 255', 'Closer to 255', 'Right at the edge'] },
    { id: 'watch', name: 'Watch and predict', levels: ['With help', 'Less help', 'No help'] },
    { id: 'add', name: 'Add it yourself', levels: ['With help', 'Hints if you ask', 'No hints'] },
    { id: 'exam', name: 'Exam style', levels: ['Some carries', 'Long carry chains', 'Close to 255'] }
  ];
  STAGES.forEach(function (st) { st.items = LEVELS.slice(); });
  function stage(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; return null; }
  function key(stageId, item) { return stageId + ':' + item; }

  // The column rule: count the 1s (carry + top + bottom).
  function rule(ones) { return { write: ones % 2, carry: ones >= 2 ? 1 : 0 }; }
  var RULE_TEXT = ['write 0', 'write 1', 'write 0, carry 1', 'write 1, carry 1'];

  function toBits(n) { var s = n.toString(2); while (s.length < 8) s = '0' + s; return s; }

  // The written method for two 8-bit numbers. Index 0 is the 128 column, index 7 the 1 column.
  // carries[i] is the carry written at the top of column i (carries[7] is always 0). out is the carry out of the
  // 128 column: the bit that would need a 9th column worth 256.
  function solve(a, b) {
    var A = toBits(a), B = toBits(b), ans = [], car = [], ones = [], made = [];
    for (var i = 0; i < 8; i++) { ans.push(0); car.push(0); ones.push(0); made.push(0); }
    var carry = 0;
    for (var col = 7; col >= 0; col--) {
      car[col] = carry;
      var n = carry + +A[col] + +B[col], r = rule(n);
      ones[col] = n; ans[col] = r.write; made[col] = r.carry;
      carry = r.carry;
    }
    var chain = 0, run = 0;
    for (var k = 7; k >= 0; k--) { run = made[k] ? run + 1 : 0; if (run > chain) chain = run; }
    var sum = a + b;
    return { a: A, b: B, answer: ans, carries: car, ones: ones, made: made, out: carry, sum: sum,
      stored: sum % 256, overflow: sum > 255, carryCount: made.reduce(function (x, y) { return x + y; }, 0), chain: chain };
  }

  // What each stage and level asks for. range: the denary total; test: extra carry rules on the binary working.
  function spec(stageId, level, over) {
    var L = +level;
    if (stageId === 'fit') {
      var r = [null, over ? [300, 450] : [60, 200], over ? [266, 320] : [200, 245], over ? [256, 265] : [246, 255]][L];
      return { range: r, min: 10, test: function () { return true; } };
    }
    var base = over ? [256, 480] : [40, 255];
    if (stageId === 'exam') {
      if (L === 1) return { range: base, min: 16, test: function (s) { return s.carryCount >= 3 && s.carryCount <= 5; } };
      if (L === 2) return { range: base, min: 16, test: function (s) { return s.carryCount >= 5 && s.chain >= 4; } };
      return { range: over ? [256, 266] : [245, 255], min: 16, test: function (s) { return s.carryCount >= 4; } };
    }
    // watch and add
    if (L === 1) return { range: base, min: 16, test: function (s) { return s.carryCount >= 1 && s.carryCount <= 3; } };
    if (L === 2) return { range: base, min: 16, test: function (s) { return s.carryCount >= 4 && s.carryCount <= 5; } };
    return { range: base, min: 16, test: function (s) { return s.carryCount >= 6 || (Math.abs(s.sum - 255.5) < 17 && s.carryCount >= 3); } };
  }

  // A new question. over: true for an overflow sum. recent: keys ('a+b') not to repeat.
  function makeQuestion(stageId, level, over, recent, rnd) {
    rnd = rnd || Math.random;
    recent = recent || [];
    var sp = spec(stageId, level, over), fallback = null;
    for (var tries = 0; tries < 4000; tries++) {
      var S = sp.range[0] + Math.floor(rnd() * (sp.range[1] - sp.range[0] + 1));
      var lo = Math.max(sp.min, S - 255), hi = Math.min(255, S - sp.min);
      if (lo > hi) continue;
      var a = lo + Math.floor(rnd() * (hi - lo + 1)), b = S - a;
      var k = a + '+' + b, k2 = b + '+' + a;
      if (recent.indexOf(k) >= 0 || recent.indexOf(k2) >= 0) continue;
      var s = solve(a, b);
      if (!fallback) fallback = { a: a, b: b };
      if (sp.test(s)) return { a: a, b: b, over: s.overflow, key: k };
    }
    return { a: fallback.a, b: fallback.b, over: fallback.a + fallback.b > 255, key: fallback.a + '+' + fallback.b };
  }

  // Overflow or not, half and half: a shuffled bag of two of each, refilled when empty.
  function nextOutcome(bag, rnd) {
    rnd = rnd || Math.random;
    if (!bag.length) shuffle([true, true, false, false], rnd).forEach(function (x) { bag.push(x); });
    return bag.shift();
  }

  function shuffle(list, rnd) {
    rnd = rnd || Math.random;
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Exam style: pick the best explanation. One right answer in mark scheme words, three wrong ones of a similar length.
  var EXPLAIN = {
    over: {
      prompt: 'Explain why overflow happens here. Pick the best answer.',
      right: ['The result is greater than 255, so it needs more than 8 bits.',
        'The result is too large to be stored in an 8-bit register.',
        'The result needs a 9th bit, but the register has only 8 bits.'],
      wrong: ['The result is less than 0, so it cannot be stored in 8 bits.',
        'The result is greater than 128, so it needs more than 8 bits.',
        'The register has 9 bits, so the 9th bit is stored as well.',
        'The two numbers are too small to be stored in 8 bits each.',
        'The carry out of the 128 column is added to the 1 column.']
    },
    fit: {
      prompt: 'Why is there no overflow here? Pick the best answer.',
      right: ['The result is not greater than 255, so it fits in 8 bits.',
        'No carry leaves the 128 column, so 8 bits are enough.'],
      wrong: ['The result is greater than 255, but the register has room.',
        'The carry out of the 128 column is kept in a 9th bit.',
        'The register grows to 9 bits when the result needs it.',
        'The result is less than 0, so the register stores it as 0.']
    }
  };
  function makeExplain(over, rnd) {
    rnd = rnd || Math.random;
    var set = EXPLAIN[over ? 'over' : 'fit'];
    var right = set.right[Math.floor(rnd() * set.right.length)];
    var opts = shuffle([right].concat(shuffle(set.wrong, rnd).slice(0, 3)), rnd);
    return { prompt: set.prompt, options: opts, correct: opts.indexOf(right) };
  }

  function newState() {
    var s = { v: 1, stage: 'fit', items: {}, reach: {} };
    STAGES.forEach(function (st) {
      s.reach[st.id] = 1;
      st.items.forEach(function (it) { s.items[key(st.id, it)] = { streak: 0, mastered: false, right: 0, wrong: 0 }; });
    });
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
    if (!stage(s.stage)) s.stage = 'fit';
    if (!s.reach || typeof s.reach !== 'object') s.reach = {};
    STAGES.forEach(function (st) { var r = +s.reach[st.id]; s.reach[st.id] = r >= 1 && r <= 3 ? Math.floor(r) : 1; });
    return s;
  }

  // Levels open one at a time: the next opens when the newest is mastered.
  function openItems(s, stageId) { return stage(stageId).items.filter(function (it) { return +it <= s.reach[stageId]; }); }

  function record(s, stageId, item, ok) {
    var it = s.items[key(stageId, item)];
    var was = it.mastered, stageWas = stageDone(s, stageId), allWas = allDone(s);
    var out = { newlyMastered: false, lost: false, stageDone: false, allDone: false, opened: null };
    if (ok) { it.right++; it.streak = Math.min(NEED, it.streak + 1); if (it.streak >= NEED) it.mastered = true; }
    else { it.wrong++; it.streak = 0; it.mastered = false; }
    out.newlyMastered = !was && it.mastered;
    out.lost = was && !it.mastered;
    if (it.mastered && +item === s.reach[stageId] && s.reach[stageId] < 3) { s.reach[stageId]++; out.opened = s.reach[stageId]; }
    out.stageDone = !stageWas && stageDone(s, stageId);
    out.allDone = !allWas && allDone(s);
    return out;
  }
  function stageDone(s, stageId) { return stage(stageId).items.every(function (it) { return s.items[key(stageId, it)].mastered; }); }
  function allDone(s) { return STAGES.every(function (st) { return stageDone(s, st.id); }); }
  function counts(s, stageId) {
    var list = stageId ? [stage(stageId)] : STAGES, have = 0, total = 0;
    list.forEach(function (st) { st.items.forEach(function (it) { total++; if (s.items[key(st.id, it)].mastered) have++; }); });
    return { have: have, total: total };
  }

  // Next level to ask. Unmastered levels most of the time; a mastered one about 1 in 4 while there are both.
  function pickItem(s, stageId, rnd) {
    rnd = rnd || Math.random;
    var open = openItems(s, stageId);
    var learning = open.filter(function (it) { return !s.items[key(stageId, it)].mastered; });
    var known = open.filter(function (it) { return s.items[key(stageId, it)].mastered; });
    var pool = !learning.length ? known : !known.length ? learning : (rnd() < MASTERED_SHARE ? known : learning);
    return pool[Math.floor(rnd() * pool.length)];
  }

  return {
    NEED: NEED, MASTERED_SHARE: MASTERED_SHARE, LEVELS: LEVELS, PLACES: PLACES, STAGES: STAGES, RULE_TEXT: RULE_TEXT, EXPLAIN: EXPLAIN,
    stage: stage, key: key, rule: rule, toBits: toBits, solve: solve, spec: spec, makeQuestion: makeQuestion, nextOutcome: nextOutcome,
    shuffle: shuffle, makeExplain: makeExplain, newState: newState, fixState: fixState, openItems: openItems, record: record,
    stageDone: stageDone, allDone: allDone, counts: counts, pickItem: pickItem
  };
})();
if (typeof module !== 'undefined') module.exports = OVL;
