// Data Bridge level pack 6: rounds 51 to 60, "Expert", the finale. Heavy trucks (7.5 to 9 t) bend any road piece
// longer than 1 square, so every sound bridge here uses a 1-square road with a joint under each piece.
// Format and tests: BridgeBuilder/LEVEL-PACKS.md. Test: BB_PACK=6 node tools/test_bridge_builder.mjs
(function (root) {
  'use strict';
  var R = 'road', W = 'wood', S = 'steel';

  // A flat road from x0 to x1 at height y, in 1-square pieces.
  function deck(x0, x1, y) {
    var o = [];
    for (var x = x0; x < x1; x++) o.push([x, y, x + 1, y, R]);
    return o;
  }
  // A truss on a flat road from x0 to x1: the second chord is d squares below (d < 0: above), with a post at every
  // square and one diagonal per panel. sup: the xs that hold it up (each diagonal leans away from the nearest one).
  // m(kind, x): the material of a 'chord', 'post' or 'diag' at x. ends: [left, right] true when the chord itself
  // starts at x0 / x1 (an anchor is there); skip: xs with no post.
  function truss(x0, x1, y, d, sup, m, ends, skip) {
    var o = [], yb = y - d, e = ends || [false, false], sk = skip || [];
    var c0 = e[0] ? x0 : x0 + 1, c1 = e[1] ? x1 : x1 - 1, x;
    for (x = c0; x < c1; x++) o.push([x, yb, x + 1, yb, m('chord', x + 0.5)]);
    for (x = x0 + 1; x <= x1 - 1; x++) if (sk.indexOf(x) < 0) o.push([x, y, x, yb, m('post', x)]);
    for (x = x0; x < x1; x++) {
      var c = x + 0.5, lo = -1e9, hi = 1e9;
      sup.forEach(function (s) { if (s <= c && s > lo) lo = s; if (s >= c && s < hi) hi = s; });
      var toward = (c - lo) < (hi - c) ? 1 : -1;   // the diagonal's chord end leans toward the middle of its span
      if (toward > 0) { if (x + 1 <= c1) o.push([x, y, x + 1, yb, m('diag', c)]); }
      else if (x >= c0) o.push([x, yb, x + 1, y, m('diag', c)]);
      else o.push([x, y, x + 1, yb, m('diag', c)]);
    }
    return o;
  }
  function pick(chord, post, diag) { return function (k) { return k === 'chord' ? chord : k === 'post' ? post : diag; }; }

  // m for truss(): posts in post, chords in chord, diagonals in steel within k squares of a support, else wood.
  function near(sup, k, chord, post) {
    return function (kind, x) {
      if (kind === 'post') return post || S;
      if (kind === 'chord') return chord;
      return sup.some(function (s) { return Math.abs(s - x) < k; }) ? S : W;
    };
  }
  // legs from one anchor to several points: fan([x, y], [[x1, y1], ...], mat). bare: leave every fan out.
  var bare = false;
  function fan(a, pts, mat) { return bare ? [] : pts.map(function (p) { return a.concat(p, [mat]); }); }

  // One sound bridge per round, in order.
  function designs() {
    return [
      // 51 Twin Pillars: a 2-deep truss resting on both pillar tips
      deck(9, 23, 0).concat(truss(9, 23, 0, 2, [9, 14, 18, 23], pick(W, S, W)),
        fan([14, -3], [[14, -2], [13, -2], [15, -2]], S), fan([18, -3], [[18, -2], [17, -2], [19, -2]], S)),
      // 52 Sky Hooks: a truss over the road, hung from both hooks
      deck(8, 24, 0).concat(truss(8, 24, 0, -2, [8, 13, 19, 24], function (k, x) { return k === 'post' || (k === 'diag' && (x === 8.5 || x === 23.5)) ? S : W; }),
        fan([13, 5], [[12, 2], [13, 2], [14, 2]], W), fan([19, 5], [[18, 2], [19, 2], [20, 2]], W)),
      // 53 Down the Steps: one truss high, one truss low
      deck(8, 15, 2).concat(truss(8, 15, 2, 2, [8, 15], near([8, 15], 3, S)), deck(20, 28, -1), truss(20, 28, -1, 2, [20, 28], near([20, 28], 3, S))),
      // 54 Low Ledges: a truss on three legs from each ledge
      deck(9, 23, 0).concat(truss(9, 23, 0, 2, [9, 12, 20, 23], near([9, 12, 20, 23], 9, W)),
        fan([11, -6], [[11, -2], [12, -2], [13, -2]], W), fan([21, -6], [[21, -2], [20, -2], [19, -2]], W)),
      // 55 The Needle: a 3-deep truss over the needle, braced to its tip
      deck(7, 25, 0).concat(truss(7, 25, 0, 3, [7, 16, 25], near([7, 16, 25], 3, S)), fan([16, -3], [[15, 0], [17, 0]], S)),
      // 56 Cave Mouth: a truss over the road, hung from the cave roof, with struts from the deep anchor
      deck(8, 24, 0).concat(truss(8, 24, 0, -2, [8, 20, 24], near([8, 20, 24], 9, S)),
        fan([19, 4], [[18, 2], [19, 2], [20, 2]], S), fan([21, 4], [[20, 2], [21, 2], [22, 2]], S), fan([8, -4], [[9, 0], [10, 0]], S)),
      // 57 Stepping Stones: one truss over the top of all three gaps
      deck(6, 11, 0).concat(deck(12, 19, 0), deck(20, 26, 0), truss(6, 26, 0, -2, [6, 11, 12, 19, 20, 26], near([6, 11, 12, 19, 20, 26], 2, S))),
      // 58 Tall Towers: a truss with five legs down to each tower
      deck(6, 26, 0).concat(truss(6, 26, 0, 3, [6, 12, 20, 26], near([6, 12, 20, 26], 9, W), [true, true]),
        fan([12, -6], [[10, -3], [11, -3], [12, -3], [13, -3], [14, -3]], W), fan([20, -6], [[18, -3], [19, -3], [20, -3], [21, -3], [22, -3]], W)),
      // 59 Chandelier: a truss hung from the hook and standing on the rock
      deck(6, 26, 0).concat(truss(6, 26, 0, 3, [6, 12, 20, 26], near([6, 12, 20, 26], 9, W)),
        fan([20, -6], [[18, -3], [19, -3], [20, -3], [21, -3], [22, -3]], W), fan([12, 4], [[10, 0], [11, 0], [12, 0], [13, 0], [14, 0]], W)),
      // 60 Data Canyon: a truss on the rock, then a truss hung from the hook
      deck(5, 15, 0).concat(truss(5, 15, 0, 3, [5, 10, 15], near([5, 10, 15], 2, W), [true, true]), fan([10, -4], [[9, -3], [10, -3], [11, -3]], S),
        deck(21, 28, 2), truss(21, 28, 2, -2, [21, 24, 28], near([21, 24, 28], 2, W)), fan([24, 6], [[23, 4], [24, 4], [25, 4]], S))
    ];
  }

  root.BBLevelPacks = root.BBLevelPacks || {};
  root.BBLevelPacks[6] = {
    levels: function (T) {
      var cliffL = T.cliffL, cliffR = T.cliffR, DEEP = T.DEEP, BACK = T.BACK, FAR = T.FAR;
      function spike(x, top, w) { return [[x - w, DEEP], [x - w * 0.6, top - 3], [x, top], [x + w * 0.6, top - 3], [x + w, DEEP]]; }
      function fang(x, tip, w) { return [[x - w, 9], [x - w * 0.6, tip + 2], [x, tip], [x + w * 0.6, tip + 2], [x + w, 9]]; }
      return [
        { name: 'Twin Pillars', theme: 0, truck: 7.5, pool: 478,
          intro: 'two thin pillars stand in the gap. Rest your truss on their tips.',
          ground: [cliffL(9, 0), cliffR(23, 0), spike(14, -3, 1), spike(18, -3, 1)],
          anchors: [[9, 0], [9, -3], [23, 0], [23, -3], [14, -3], [18, -3]], start: [1.5, 0], goal: [25, 0] },
        { name: 'Sky Hooks', theme: 1, truck: 7.7, pool: 558,
          intro: 'two hooks hang from the roof. Hang the middle of your bridge from them.',
          ground: [cliffL(8, 0), cliffR(24, 0), fang(13, 5, 1.5), fang(19, 5, 1.5)],
          anchors: [[8, 0], [8, -2], [24, 0], [24, -2], [13, 5], [19, 5]], start: [1.5, 0], goal: [26, 0] },
        { name: 'Down the Steps', theme: 2, truck: 7.8, pool: 590,
          intro: 'two gaps at two heights. Build one bridge high and one bridge low.',
          ground: [cliffL(8, 2), [[15, DEEP], [15, 2], [16, 2], [19, -1], [20, -1], [20, DEEP]], cliffR(28, -1)],
          anchors: [[8, 2], [8, -1], [15, 2], [20, -1], [20, -4], [28, -1], [28, -4]], start: [1.5, 2], goal: [30, -1] },
        { name: 'Low Ledges', theme: 3, truck: 8, pool: 630,
          intro: 'the only anchors below are deep on two ledges. Build an arch up from them.',
          ground: [cliffL(9, 0, [[9, -6], [11, -6]]), cliffR(23, 0, [[23, -6], [21, -6]])],
          anchors: [[9, 0], [23, 0], [11, -6], [21, -6]], start: [1.5, 0], goal: [25, 0] },
        { name: 'The Needle', theme: 4, truck: 8.2, pool: 986,
          intro: 'a long gap with one needle of rock in the middle and one anchor on each side.',
          ground: [cliffL(7, 0), cliffR(25, 0), spike(16, -3, 1)],
          anchors: [[7, 0], [25, 0], [16, -3]], start: [1.5, 0], goal: [27, 0] },
        { name: 'Cave Mouth', theme: 5, truck: 8.3, pool: 849,
          intro: 'the far side is a cave. Its roof hangs out over the gap, so hang your bridge from it.',
          ground: [cliffL(8, 0), cliffR(24, 0), [[FAR, 4], [19, 4], [19, 9], [FAR, 9]]],
          anchors: [[8, 0], [8, -4], [24, 0], [19, 4], [21, 4]], start: [1.5, 0], goal: [26, 0] },
        { name: 'Stepping Stones', theme: 0, truck: 8.5, pool: 795,
          intro: 'three gaps between two stones, and no anchors below the road. Build over the top.',
          ground: [cliffL(6, 0), [[10.6, DEEP], [11, 0], [12, 0], [12.4, DEEP]], [[18.6, DEEP], [19, 0], [20, 0], [20.4, DEEP]], cliffR(26, 0)],
          anchors: [[6, 0], [11, 0], [12, 0], [19, 0], [20, 0], [26, 0]], start: [1.5, 0], goal: [28, 0] },
        { name: 'Tall Towers', theme: 1, truck: 8.6, pool: 1162,
          intro: 'a very wide gap with two rock towers deep below. Build tall legs down to them.',
          ground: [cliffL(6, 0), cliffR(26, 0), spike(12, -6, 1.2), spike(20, -6, 1.2)],
          anchors: [[6, 0], [6, -3], [26, 0], [26, -3], [12, -6], [20, -6]], start: [1.5, 0], goal: [28, 0] },
        { name: 'Chandelier', theme: 2, truck: 8.8, pool: 1166,
          intro: 'a very long gap with one hook above and one rock below. Use them both.',
          ground: [cliffL(6, 0), cliffR(26, 0), fang(12, 4, 1.4), spike(20, -6, 1.2)],
          anchors: [[6, 0], [26, 0], [12, 4], [20, -6]], start: [1.5, 0], goal: [28, 0] },
        { name: 'Data Canyon', theme: 4, truck: 9, pool: 823,
          intro: 'the last bridge: two gaps, a rock, a hook, a hill and the heaviest truck. Good luck!',
          ground: [cliffL(5, 0, [[5, -3], [4, -6]]), spike(10, -4, 1), [[15, DEEP], [15, 0], [16.5, 0], [19.5, 2], [21, 2], [21, DEEP]],
            fang(24, 6, 1.5), [[FAR, DEEP], [FAR, 4], [32, 4], [30, 2], [28, 2], [28, DEEP]]],
          anchors: [[5, 0], [5, -3], [10, -4], [15, 0], [15, -3], [21, 2], [28, 2], [24, 6]], start: [1.5, 0], goal: [31, 3] }
      ];
    },
    sound: function () { return designs(); },
    // the same trusses all in wood, with no legs or hangers to the rocks, hooks and deep anchors
    flimsy: function () {
      bare = true;
      var list = designs();
      bare = false;
      return list.map(function (list) { return list.map(function (b) { return b[4] === S ? b.slice(0, 4).concat([W]) : b; }); });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
