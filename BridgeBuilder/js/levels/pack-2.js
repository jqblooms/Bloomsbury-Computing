// Data Bridge level pack 2: rounds 11 to 20, band "Building up" (see BridgeBuilder/LEVEL-PACKS.md).
// Each round mixes two ideas from rounds 1 to 10. Trucks 3.5 to 5 tonnes; the cheapest crossing found costs 0.72 to 0.78 of the pool.
// Road slopes on a bridge are kept even (no bends in the middle): a bend jolts a heavy truck and snaps the road.
(function (root) {
  'use strict';
  // The road for each round, shared by the sound, cheap and flimsy bridges.
  function roads(H) {
    var chain = H.chain, line = H.line, R = H.R;
    return [
      chain(line(9, 1, 21, -5, 2), R),
      chain(line(10, 0, 22, 0, 2), R),
      chain(line(8, 0, 24, 0, 2), R),
      chain(line(9, 0, 23, 0, 2), R),
      chain(line(6, 0, 12, 3, 2), R).concat(chain(line(20, 3, 26, 0, 2), R)),
      chain(line(10, -2, 20, 3, 2), R),
      chain(line(7, 0, 25, 0, 2), R),
      chain(line(8, 0, 24, 0, 2), R),
      chain(line(5, 0, 15, 0, 2), R).concat(chain(line(17, 0, 27, 0, 2), R)),
      chain(line(8, 0, 24, 0, 2), R)
    ];
  }
  (root.BBLevelPacks = root.BBLevelPacks || {})[2] = {
    levels: function (T) {
      var cliffL = T.cliffL, cliffR = T.cliffR, D = T.DEEP, BK = T.BACK, FR = T.FAR;
      return [
        { name: 'Rocky slope', theme: 2, truck: 3.5, pool: 166,
          intro: 'the far side is lower and a rock stands in the gap. Build a road that goes down over the rock.',
          ground: [[[BK, D], [BK, 3], [5, 3], [9, 1], [9, D]], cliffR(21, -5), [[13, D], [13, -8], [14, -4], [16, -4], [17, -8], [17, D]]],
          anchors: [[9, 1], [9, -1], [14, -4], [16, -4], [21, -5], [21, -7]], start: [1.5, 3], goal: [23, -5] },
        { name: 'Hook in the sky', theme: 4, truck: 3.5, pool: 154,
          intro: 'a hook hangs from the roof over the gap. Hang the middle of your road from it.',
          ground: [cliffL(10, 0), [[FR, D], [FR, 2], [25, 2], [22, 0], [22, D]], [[14, 9], [15, 4], [17, 4], [18, 9]]],
          anchors: [[10, 0], [10, -2], [15, 4], [17, 4], [22, 0], [22, -2]], start: [1.5, 0], goal: [27, 2] },
        { name: 'Two towers', theme: 0, truck: 3.75, pool: 188,
          intro: 'two towers of different heights stand in a long gap. Use both to hold up the road.',
          ground: [cliffL(8, 0), cliffR(24, 0), [[11, D], [11, -3], [13, -3], [13, D]], [[19, D], [19, -2], [21, -2], [21, D]]],
          anchors: [[8, 0], [8, -2], [11, -3], [13, -3], [19, -2], [21, -2], [24, 0], [24, -2]], start: [1.5, 0], goal: [26, 0] },
        { name: 'Shelf and ceiling', theme: 3, truck: 4, pool: 259,
          intro: 'a low shelf on the near side and a ceiling on the far side. Push up from one, hang from the other.',
          ground: [cliffL(9, 0, [[9, -4], [12, -4]]), cliffR(23, 0), [[FR, 4], [22, 4], [22, 9], [FR, 9]]],
          anchors: [[9, 0], [12, -4], [22, 4], [23, 0]], start: [1.5, 0], goal: [25, 0] },
        { name: 'Hump island', theme: 5, truck: 4, pool: 214,
          intro: 'a high island in the middle. Build a road up onto it and another road down off it.',
          ground: [cliffL(6, 0), cliffR(26, 0), [[12, D], [12, 3], [14, 4], [18, 4], [20, 3], [20, D]]],
          anchors: [[6, 0], [6, -2], [12, 3], [12, 0], [20, 3], [20, 0], [26, 0], [26, -2]], start: [1.5, 0], goal: [28, 0] },
        { name: 'Under the lip', theme: 2, truck: 4, pool: 183,
          intro: 'a steep climb to a cliff with a lip that sticks out. Push up from under the lip.',
          ground: [cliffL(10, -2), [[FR, D], [FR, 4], [22, 4], [20, 3], [20, 1], [22, 1], [22, D]]],
          anchors: [[10, -2], [10, -4], [20, 3], [20, 1], [22, 1]], start: [1.5, -2], goal: [25, 4] },
        { name: 'Sunken island', theme: 1, truck: 4.5, pool: 339,
          intro: 'a very long gap with a low island far below. Build tall supports down to the island.',
          ground: [cliffL(7, 0), cliffR(25, 0), [[13, D], [13, -5], [14, -4], [18, -4], [19, -5], [19, D]]],
          anchors: [[7, 0], [14, -4], [16, -4], [18, -4], [25, 0], [25, -2]], start: [1.5, 0], goal: [27, 0] },
        { name: 'Sky hooks', theme: 3, truck: 4.5, pool: 302,
          intro: 'a long gap with no ledges below, only two hooks in the roof. Hang your bridge or build a strong truss.',
          ground: [cliffL(8, 0), cliffR(24, 0), [[12, 9], [13, 4], [19, 4], [20, 9]]],
          anchors: [[8, 0], [13, 4], [19, 4], [24, 0]], start: [1.5, 0], goal: [26, 0] },
        { name: 'Hop and hang', theme: 4, truck: 4.5, pool: 367,
          intro: 'two wide gaps with an island between. Hold the first road up from below and hang the second from the hook.',
          ground: [cliffL(5, 0), cliffR(27, 0), [[14, D], [14, -4], [15, 0], [17, 0], [18, -4], [18, D]], [[21, 9], [22, 4], [23, 9]]],
          anchors: [[5, 0], [5, -2], [14, -4], [15, 0], [17, 0], [22, 4], [27, 0]], start: [1.5, 0], goal: [29, 0] },
        { name: 'The big one', theme: 5, truck: 5, pool: 312,
          intro: 'the longest gap yet, with one low shelf. Build a strong truss and use steel where it pulls hardest.',
          ground: [cliffL(8, 0, [[8, -4], [11, -4]]), cliffR(24, 0)],
          anchors: [[8, 0], [11, -4], [24, 0], [24, -2]], start: [1.5, 0], goal: [26, 0] }
      ];
    },
    // sound: peak under 0.7 of the limit. cheap: the cheapest crossing found (peak under 1.0); the pool is set so that
    // cheap / pool rises from 0.72 (round 11) to 0.78 (round 20). Not used by the game; kept to check the band.
    sound: function (H) {
      var road = roads(H), R = H.R, W = H.W, S = H.S;
      return [
        road[0].concat([[9, 1, 10, -1, W], [10, -1, 11, 0, W], [13, -1, 14, -3, W], [14, -3, 15, -2, W], [16, -4, 17, -3, W], [14, -3, 16, -4, W], [19, -4, 20, -6, W], [20, -6, 21, -5, W], [9, -1, 10, -1, W], [14, -4, 14, -3, W], [21, -7, 20, -6, W]]),
        road[1].concat([[10, -2, 12, 0, W], [22, -2, 20, 0, W], [15, 4, 14, 0, W], [17, 4, 16, 0, W], [17, 4, 18, 0, W]]),
        road[2].concat([[8, -2, 10, 0, W], [13, -3, 12, 0, W], [13, -3, 14, 0, W], [19, -2, 16, 0, W], [19, -2, 18, 0, W], [21, -2, 20, 0, W], [21, -2, 22, 0, W]]),
        road[3].concat([[9, 0, 10, 2, W], [10, 2, 11, 0, W], [12, 2, 13, 0, W], [10, 2, 12, 2, W], [13, 0, 14, 2, W], [14, 2, 15, 0, W], [12, 2, 14, 2, W], [15, 0, 16, 2, W], [16, 2, 17, 0, W], [14, 2, 16, 2, W], [17, 0, 18, 2, W], [18, 2, 19, 0, W], [16, 2, 18, 2, W], [19, 0, 20, 2, W], [20, 2, 21, 0, W], [18, 2, 20, 2, W], [21, 0, 22, 2, W], [20, 2, 22, 2, W], [12, -4, 13, 0, W], [22, 4, 20, 2, W], [22, 4, 22, 2, W]]),
        road[4].concat([[6, 0, 7, -1, W], [7, -1, 8, 1, W], [8, 1, 9, 0, W], [9, 0, 10, 2, W], [7, -1, 9, 0, W], [10, 2, 11, 1, W], [11, 1, 12, 3, W], [9, 0, 11, 1, W], [20, 3, 21, 1, W], [21, 1, 22, 2, W], [22, 2, 23, 0, W], [23, 0, 24, 1, W], [21, 1, 23, 0, W], [24, 1, 25, -1, W], [25, -1, 26, 0, W], [23, 0, 25, -1, W]]),
        road[5].concat([[10, -2, 11, -3, W], [11, -3, 12, -1, S], [12, -1, 13, -2, W], [13, -2, 14, 0, W], [14, 0, 15, -1, W], [15, -1, 16, 1, W], [13, -2, 15, -1, W], [16, 1, 17, 0, W], [17, 0, 18, 2, W], [15, -1, 17, 0, W], [18, 2, 19, 1, W], [19, 1, 20, 3, W], [10, -4, 11, -3, S], [20, 1, 19, 1, W]]),
        road[6].concat([[7, 0, 8, -2, W], [8, -2, 9, 0, W], [9, 0, 10, -2, W], [10, -2, 11, 0, W], [8, -2, 10, -2, W], [11, 0, 12, -2, W], [12, -2, 13, 0, W], [10, -2, 12, -2, W], [13, 0, 14, -2, W], [12, -2, 14, -2, W], [15, 0, 16, -2, W], [16, -2, 17, 0, W], [17, 0, 18, -2, W], [18, -2, 19, 0, W], [16, -2, 18, -2, W], [19, 0, 20, -2, W], [20, -2, 21, 0, W], [18, -2, 20, -2, W], [21, 0, 22, -2, W], [22, -2, 23, 0, W], [20, -2, 22, -2, W], [23, 0, 24, -2, W], [24, -2, 25, 0, W], [22, -2, 24, -2, W], [14, -4, 14, -2, W], [16, -4, 16, -2, W], [18, -4, 18, -2, W]]),
        road[7].concat([[8, 0, 9, 2, W], [9, 2, 10, 0, W], [10, 0, 11, 2, W], [11, 2, 12, 0, W], [9, 2, 11, 2, W], [12, 0, 13, 2, W], [13, 2, 14, 0, W], [14, 0, 15, 2, W], [15, 2, 16, 0, W], [13, 2, 15, 2, W], [16, 0, 17, 2, W], [17, 2, 18, 0, W], [15, 2, 17, 2, W], [18, 0, 19, 2, W], [19, 2, 20, 0, W], [17, 2, 19, 2, W], [20, 0, 21, 2, W], [21, 2, 22, 0, W], [22, 0, 23, 2, W], [23, 2, 24, 0, W], [21, 2, 23, 2, W], [13, 4, 13, 2, S], [19, 4, 19, 2, S]]),
        road[8].concat([[5, 0, 6, -2, S], [6, -2, 7, 0, S], [7, 0, 8, -2, W], [8, -2, 9, 0, W], [6, -2, 8, -2, W], [9, 0, 10, -2, W], [10, -2, 11, 0, W], [8, -2, 10, -2, W], [11, 0, 12, -2, W], [12, -2, 13, 0, W], [10, -2, 12, -2, W], [13, 0, 14, -2, W], [12, -2, 14, -2, W], [5, -2, 6, -2, W], [14, -4, 14, -2, W], [17, 0, 18, 2, S], [18, 2, 19, 0, S], [19, 0, 20, 2, W], [20, 2, 21, 0, W], [18, 2, 20, 2, W], [21, 0, 22, 2, W], [22, 2, 23, 0, W], [20, 2, 22, 2, S], [23, 0, 24, 2, W], [24, 2, 25, 0, W], [22, 2, 24, 2, S], [25, 0, 26, 2, S], [26, 2, 27, 0, S], [24, 2, 26, 2, W]]),
        road[9].concat([[10, 0, 11, 2, W], [11, 2, 12, 0, W], [12, 0, 13, 2, S], [13, 2, 14, 0, S], [11, 2, 13, 2, W], [14, 0, 15, 2, W], [15, 2, 16, 0, W], [13, 2, 15, 2, W], [16, 0, 17, 2, W], [17, 2, 18, 0, W], [15, 2, 17, 2, S], [18, 0, 19, 2, W], [19, 2, 20, 0, W], [17, 2, 19, 2, S], [20, 0, 21, 2, S], [21, 2, 22, 0, S], [19, 2, 21, 2, W], [11, -4, 12, 0, S], [24, -2, 22, 0, S]])
      ];
    },
    cheap: function (H) {
      var road = roads(H), R = H.R, W = H.W, S = H.S;
      return [
        road[0].concat([[9, 1, 10, -1, W], [10, -1, 11, 0, W], [13, -1, 14, -3, W], [14, -3, 15, -2, W], [16, -4, 17, -3, W], [14, -3, 16, -4, W], [19, -4, 20, -6, W], [20, -6, 21, -5, W], [9, -1, 10, -1, W], [14, -4, 14, -3, W], [21, -7, 20, -6, W]]),
        road[1].concat([[10, -2, 12, 0, W], [22, -2, 20, 0, W], [15, 4, 14, 0, W], [17, 4, 16, 0, W], [17, 4, 18, 0, W]]),
        road[2].concat([[8, -2, 10, 0, W], [13, -3, 12, 0, W], [13, -3, 14, 0, W], [19, -2, 16, 0, W], [19, -2, 18, 0, W], [21, -2, 20, 0, W], [21, -2, 22, 0, W]]),
        road[3].concat([[9, 0, 10, 2, W], [10, 2, 11, 0, W], [11, 0, 12, 2, W], [12, 2, 13, 0, W], [10, 2, 12, 2, W], [13, 0, 14, 2, W], [14, 2, 15, 0, W], [12, 2, 14, 2, W], [15, 0, 16, 2, W], [16, 2, 17, 0, W], [14, 2, 16, 2, W], [17, 0, 18, 2, W], [18, 2, 19, 0, W], [16, 2, 18, 2, W], [19, 0, 20, 2, W], [21, 0, 22, 2, W], [22, 4, 20, 2, W], [22, 4, 22, 2, W]]),
        road[4].concat([[6, 0, 7, -1, W], [7, -1, 8, 1, W], [8, 1, 9, 0, W], [9, 0, 10, 2, W], [7, -1, 9, 0, W], [10, 2, 11, 1, W], [11, 1, 12, 3, W], [9, 0, 11, 1, W], [20, 3, 21, 1, W], [21, 1, 22, 2, W], [22, 2, 23, 0, W], [23, 0, 24, 1, W], [21, 1, 23, 0, W], [24, 1, 25, -1, W], [25, -1, 26, 0, W], [23, 0, 25, -1, W]]),
        road[5].concat([[10, -2, 11, -3, W], [11, -3, 12, -1, W], [12, -1, 13, -2, W], [13, -2, 14, 0, W], [14, 0, 15, -1, W], [15, -1, 16, 1, W], [13, -2, 15, -1, W], [16, 1, 17, 0, W], [17, 0, 18, 2, W], [15, -1, 17, 0, W], [18, 2, 19, 1, W], [19, 1, 20, 3, W], [17, 0, 19, 1, W], [10, -4, 11, -3, W], [20, 1, 19, 1, W]]),
        road[6].concat([[7, 0, 8, -2, W], [8, -2, 9, 0, W], [8, -2, 10, -2, W], [11, 0, 12, -2, W], [12, -2, 13, 0, W], [10, -2, 12, -2, W], [13, 0, 14, -2, W], [12, -2, 14, -2, W], [15, 0, 16, -2, W], [16, -2, 17, 0, W], [14, -2, 16, -2, W], [17, 0, 18, -2, W], [18, -2, 19, 0, W], [16, -2, 18, -2, W], [19, 0, 20, -2, W], [20, -2, 21, 0, W], [18, -2, 20, -2, W], [21, 0, 22, -2, W], [22, -2, 23, 0, W], [23, 0, 24, -2, W], [24, -2, 25, 0, W], [22, -2, 24, -2, W], [14, -4, 14, -2, W], [16, -4, 16, -2, W], [18, -4, 18, -2, W], [25, -2, 24, -2, W]]),
        road[7].concat([[8, 0, 9, 2, W], [9, 2, 10, 0, W], [11, 2, 12, 0, W], [9, 2, 11, 2, W], [12, 0, 13, 2, W], [13, 2, 14, 0, W], [11, 2, 13, 2, W], [14, 0, 15, 2, W], [15, 2, 16, 0, W], [13, 2, 15, 2, W], [17, 2, 18, 0, W], [15, 2, 17, 2, W], [18, 0, 19, 2, W], [19, 2, 20, 0, W], [17, 2, 19, 2, W], [20, 0, 21, 2, W], [21, 2, 22, 0, W], [19, 2, 21, 2, W], [22, 0, 23, 2, W], [23, 2, 24, 0, W], [21, 2, 23, 2, W], [13, 4, 13, 2, W], [19, 4, 19, 2, W]]),
        road[8].concat([[5, 0, 6, -2, W], [6, -2, 7, 0, W], [7, 0, 8, -2, W], [8, -2, 9, 0, W], [9, 0, 10, -2, W], [10, -2, 11, 0, W], [8, -2, 10, -2, W], [11, 0, 12, -2, W], [12, -2, 13, 0, W], [10, -2, 12, -2, W], [13, 0, 14, -2, W], [12, -2, 14, -2, W], [5, -2, 6, -2, W], [14, -4, 14, -2, W], [17, 0, 18, 2, W], [18, 2, 19, 0, W], [19, 0, 20, 2, W], [20, 2, 21, 0, W], [18, 2, 20, 2, W], [21, 0, 22, 2, W], [22, 2, 23, 0, W], [20, 2, 22, 2, W], [23, 0, 24, 2, W], [24, 2, 25, 0, W], [22, 2, 24, 2, W], [25, 0, 26, 2, W], [26, 2, 27, 0, W], [24, 2, 26, 2, W]]),
        road[9].concat([[10, 0, 11, 2, W], [11, 2, 12, 0, W], [12, 0, 13, 2, W], [13, 2, 14, 0, W], [11, 2, 13, 2, W], [14, 0, 15, 2, W], [15, 2, 16, 0, W], [13, 2, 15, 2, W], [16, 0, 17, 2, W], [17, 2, 18, 0, W], [15, 2, 17, 2, W], [18, 0, 19, 2, W], [19, 2, 20, 0, W], [17, 2, 19, 2, W], [20, 0, 21, 2, W], [21, 2, 22, 0, W], [19, 2, 21, 2, W], [11, -4, 12, 0, S], [24, -2, 22, 0, S]])
      ];
    },
    // The road alone: nothing holds it up.
    flimsy: function (H) { return roads(H); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
