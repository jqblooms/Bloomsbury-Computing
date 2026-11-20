// Data Bridge level pack 5: rounds 41 to 50, "Very hard". Heavy trucks (7.4 to 8 tonnes), few anchors, deep drops,
// mixed heights and very little spare money: each pool is set so the cheapest crossing found costs 0.88 to 0.92 of
// it. Stones, ledges, roof hooks and A shapes (two legs from deep rocks) hold the road joints.
// See BridgeBuilder/LEVEL-PACKS.md for the format.
(function (root) {
  'use strict';

  // Beams written as 'x1,y1,x2,y2m ...' where m is r (road), w (wood) or s (steel).
  function b(text) {
    var M = { r: 'road', w: 'wood', s: 'steel' };
    return text.split(' ').map(function (t) {
      var v = t.slice(0, -1).split(',').map(Number);
      return v.concat([M[t.slice(-1)]]);
    });
  }
  // A night-red palette for the finale (same keys as PALS in js/art.js).
  var FINALE = { sky: ['#0d0508', '#2a0c14', '#4f1622'], glow: '#ff6b6b', far: '#1c0a10', mid: '#240d15', haze: '#3a121d', stream: '#ff8a80',
    metal: ['#5c4a52', '#33282d', '#1c1519'], rock: ['#3f2b30', '#291c20', '#181013'], led: ['#ff6b6b', '#ffb74d', '#3ddc84'] };

  root.BBLevelPacks = root.BBLevelPacks || {};
  root.BBLevelPacks[5] = {
    levels: function (T) {
      var cliffL = T.cliffL, cliffR = T.cliffR, DEEP = T.DEEP, BACK = T.BACK, FAR = T.FAR;
      // a thin stone standing up from deep below, its tip at (x, y); a roof slab with a hook at (x, y) on its underside
      function pil(x, y) { return [[x - 0.4, DEEP], [x - 0.4, y - 0.4], [x, y], [x + 0.4, y - 0.4], [x + 0.4, DEEP]]; }
      function slab(x, y) { return [[x - 1, y], [x + 1, y], [x + 1, 9], [x - 1, 9]]; }
      return [
        { name: 'Stepping stones', theme: 0, truck: 7.4, pool: 122,
          intro: 'a very heavy truck. Use short road pieces and hold up every joint from the stones below.',
          ground: [cliffL(9, 0), cliffR(23, 0), pil(10, -2), pil(14, -3), pil(18, -2), pil(22, -3)],
          anchors: [[9, 0], [23, 0], [10, -2], [14, -3], [18, -2], [22, -3]], start: [1.5, 0], goal: [25, 0] },
        { name: 'Step down', theme: 2, truck: 7.45, pool: 133,
          intro: 'a high side, a ramp island and a low side. Build two bridges at two heights.',
          ground: [cliffL(5, 3), pil(6, 1), pil(10, 0), [[11, DEEP], [11, 3], [12, 3], [15, 0], [17, 0], [17, DEEP]], pil(18, -2), pil(22, -3), pil(26, -2), cliffR(27, 0)],
          anchors: [[5, 3], [6, 1], [10, 0], [11, 3], [17, 0], [18, -2], [22, -3], [26, -2], [27, 0]], start: [1.5, 3], goal: [29, 0] },
        { name: 'Roof rescue', theme: 1, truck: 7.5, pool: 121,
          intro: 'two hooks in the roof and two stones below. Hang some joints and hold up the others.',
          ground: [cliffL(8, -1), cliffR(22, -1), slab(9, 2), pil(13, -3), slab(17, 2), pil(21, -3)],
          anchors: [[8, -1], [22, -1], [9, 2], [13, -3], [17, 2], [21, -3]], start: [1.5, -1], goal: [24, -1] },
        { name: 'Ramp island', theme: 3, truck: 7.55, pool: 164,
          intro: 'hooks above the first gap and stones below the second. The island ramps up between them.',
          ground: [cliffL(5, 0), slab(6, 3), pil(10, -2), slab(14, 3), [[15, DEEP], [15, 0], [16, 0], [18, 2], [19, 2], [19, DEEP]], pil(20, 0), pil(24, -1), pil(28, 0), cliffR(29, 2)],
          anchors: [[5, 0], [6, 3], [10, -2], [14, 3], [15, 0], [19, 2], [20, 0], [24, -1], [28, 0], [29, 2]], start: [1.5, 0], goal: [31, 2] },
        { name: 'Dip island', theme: 4, truck: 7.6, pool: 136,
          intro: 'the island dips in the middle. One bridge stands on stones, the other hangs from hooks.',
          ground: [cliffL(5, 0), pil(6, -2), pil(10, -3), [[11, DEEP], [11, 0], [12, 0], [14, -2], [15, -2], [18, 1], [19, 1], [19, DEEP]], slab(20, 4), slab(24, 4), pil(28, -2), cliffR(29, 1)],
          anchors: [[5, 0], [6, -2], [10, -3], [11, 0], [19, 1], [20, 4], [24, 4], [28, -2], [29, 1]], start: [1.5, 0], goal: [31, 1] },
        { name: 'Overhang', theme: 2, truck: 7.7, pool: 118,
          intro: 'a ledge on the wall, two stones and one hook under the rock roof. Every coin counts.',
          ground: [cliffL(9, -2, [[9, -4], [10, -4], [10, -5]]), pil(14, -4), pil(22, -4), cliffR(23, -2), [[FAR, 1], [17, 1], [17, 9], [FAR, 9]]],
          anchors: [[9, -2], [10, -4], [14, -4], [18, 1], [22, -4], [23, -2]], start: [1.5, -2], goal: [25, -2] },
        { name: 'Canyon', theme: 5, truck: 7.75, pool: 210,
          intro: 'a deep canyon. Build tall A shapes up from the low rocks and use the hook in the middle.',
          ground: [cliffL(8, 0, [[9, -3], [9, -4], [8, -5]]), cliffR(26, 0, [[25, -3], [25, -4], [26, -5]]), pil(11, -6), pil(15, -6), slab(17, 3), pil(19, -6), pil(23, -6)],
          anchors: [[8, 0], [26, 0], [9, -3], [25, -3], [11, -6], [15, -6], [17, 3], [19, -6], [23, -6]], start: [1.5, 0], goal: [28, 0] },
        { name: 'Sky hooks', theme: 1, truck: 7.8, pool: 209,
          intro: 'three hooks in the sky and four deep rocks. Mix hanging joints and A shapes to cross.',
          ground: [cliffL(6, 0), cliffR(24, 0), slab(7, 3), pil(9, -6), pil(13, -6), slab(15, 3), pil(17, -6), pil(21, -6), slab(23, 3)],
          anchors: [[6, 0], [24, 0], [7, 3], [9, -6], [13, -6], [15, 3], [17, -6], [21, -6], [23, 3]], start: [1.5, 0], goal: [26, 0] },
        { name: 'Broken teeth', theme: 0, truck: 7.9, pool: 233,
          intro: 'sharp rocks at many depths and one very long gap. Plan the whole bridge before you spend.',
          ground: [cliffL(5, 0, [[6, -3], [6, -4], [5, -5]]), pil(10, -2), pil(12, -7), pil(16, -7), pil(18, -3), pil(22, -2), cliffR(27, 0, [[26, -3], [26, -4], [27, -5]])],
          anchors: [[5, 0], [6, -3], [10, -2], [12, -7], [16, -7], [18, -3], [22, -2], [26, -3], [27, 0]], start: [1.5, 0], goal: [29, 0] },
        { name: 'Grand finale', theme: FINALE, truck: 8, pool: 236,
          intro: 'the heaviest truck and the longest gap. Use ledges, stones, hooks and A shapes.',
          ground: [cliffL(4, 1, [[5, -1], [5, -2], [4, -3]]), pil(7, -5), pil(11, -5), slab(13, 4), pil(17, -1), pil(19, -5), pil(23, -5), cliffR(26, 1, [[25, -1], [25, -2], [26, -3]])],
          anchors: [[4, 1], [5, -1], [7, -5], [11, -5], [13, 4], [17, -1], [19, -5], [23, -5], [25, -1], [26, 1]], start: [1.5, 1], goal: [28, 1] }
      ];
    },
    // the bridges the test proves (peak under 0.85, inside the pool)
    sound: function () {
      return [
        b('9,0,11,0r 11,0,13,0r 13,0,15,0r 15,0,17,0r 17,0,19,0r 19,0,21,0r 21,0,23,0r 11,0,10,-2w 13,0,14,-3w 15,0,14,-3w 17,0,18,-2w 19,0,18,-2w 21,0,22,-3w'),
        b('5,3,7,3r 7,3,9,3r 9,3,11,3r 7,3,6,1w 9,3,10,0w 17,0,19,0r 19,0,21,0r 21,0,23,0r 23,0,25,0r 25,0,27,0r 19,0,18,-2w 21,0,22,-3w 23,0,22,-3w 25,0,26,-2w'),
        b('8,-1,10,-1r 10,-1,12,-1r 12,-1,14,-1r 14,-1,16,-1r 16,-1,18,-1r 18,-1,20,-1r 20,-1,22,-1r 10,-1,9,2w 12,-1,13,-3w 14,-1,13,-3w 16,-1,17,2w 18,-1,17,2w 20,-1,21,-3w'),
        b('5,0,7,0r 7,0,9,0r 9,0,11,0r 11,0,13,0r 13,0,15,0r 7,0,6,3w 9,0,10,-2w 11,0,10,-2w 13,0,14,3w 19,2,21,2r 21,2,23,2r 23,2,25,2r 25,2,27,2r 27,2,29,2r 21,2,20,0w 23,2,24,-1w 25,2,24,-1w 27,2,28,0w'),
        b('5,0,7,0r 7,0,9,0r 9,0,11,0r 7,0,6,-2w 9,0,10,-3w 19,1,21,1r 21,1,23,1r 23,1,25,1r 25,1,27,1r 27,1,29,1r 21,1,20,4w 23,1,24,4w 25,1,24,4w 27,1,28,-2w'),
        b('9,-2,11,-2r 11,-2,13,-2r 13,-2,15,-2r 15,-2,17,-2r 17,-2,19,-2r 19,-2,21,-2r 21,-2,23,-2r 11,-2,10,-4w 13,-2,14,-4w 15,-2,14,-4w 17,-2,18,1w 19,-2,18,1w 21,-2,22,-4w'),
        b('8,0,10,0r 10,0,12,0r 12,0,14,0r 14,0,16,0r 16,0,18,0r 18,0,20,0r 20,0,22,0r 22,0,24,0r 24,0,26,0r 10,0,9,-3w 12,0,13,-2w 14,0,13,-2w 16,0,17,3w 18,0,17,3w 20,0,21,-2w 22,0,21,-2w 24,0,25,-3w 11,-6,13,-2w 15,-6,13,-2w 19,-6,21,-2w 23,-6,21,-2w'),
        b('6,0,8,0r 8,0,10,0r 10,0,12,0r 12,0,14,0r 14,0,16,0r 16,0,18,0r 18,0,20,0r 20,0,22,0r 22,0,24,0r 8,0,7,3w 10,0,11,-2w 12,0,11,-2w 14,0,15,3w 16,0,15,3w 18,0,19,-2w 20,0,19,-2w 22,0,23,3w 9,-6,11,-2w 13,-6,11,-2w 17,-6,19,-2w 21,-6,19,-2w'),
        b('5,0,7,0r 7,0,9,0r 9,0,11,0r 11,0,13,0r 13,0,15,0r 15,0,17,0r 17,0,19,0r 19,0,21,0r 21,0,23,0r 23,0,25,0r 25,0,27,0r 7,0,6,-3w 9,0,10,-2w 11,0,10,-2w 13,0,14,-3w 15,0,14,-3w 17,0,18,-3w 19,0,18,-3w 21,0,22,-2w 23,0,22,-2w 25,0,26,-3w 12,-7,14,-3w 16,-7,14,-3w'),
        b('4,1,6,1r 6,1,8,1r 8,1,10,1r 10,1,12,1r 12,1,14,1r 14,1,16,1r 16,1,18,1r 18,1,20,1r 20,1,22,1r 22,1,24,1r 24,1,26,1r 6,1,5,-1w 8,1,9,-2w 10,1,9,-2w 12,1,13,4w 14,1,13,4w 16,1,17,-1w 18,1,17,-1w 20,1,21,-2w 22,1,21,-2w 24,1,25,-1w 7,-5,9,-2w 11,-5,9,-2w 19,-5,21,-2w 23,-5,21,-2w')
      ];
    },
    // road pieces 4 squares long bend and snap under these trucks
    flimsy: function () {
      return [
        b('9,0,13,0r 13,0,17,0r 17,0,21,0r 21,0,23,0r 13,0,14,-3w 17,0,18,-2w 21,0,22,-3w'),
        b('5,3,9,3r 9,3,11,3r 9,3,10,0w 17,0,21,0r 21,0,25,0r 25,0,27,0r 21,0,22,-3w 25,0,26,-2w'),
        b('8,-1,12,-1r 12,-1,16,-1r 16,-1,20,-1r 20,-1,22,-1r 12,-1,13,-3w 16,-1,17,2w 20,-1,21,-3w'),
        b('5,0,9,0r 9,0,13,0r 13,0,15,0r 9,0,10,-2w 13,0,14,3w 19,2,23,2r 23,2,27,2r 27,2,29,2r 23,2,24,-1w 27,2,28,0w'),
        b('5,0,9,0r 9,0,11,0r 9,0,10,-3w 19,1,23,1r 23,1,27,1r 27,1,29,1r 23,1,24,4w 27,1,28,-2w'),
        b('9,-2,13,-2r 13,-2,17,-2r 17,-2,21,-2r 21,-2,23,-2r 13,-2,14,-4w 17,-2,18,1w 21,-2,22,-4w'),
        b('8,0,12,0r 12,0,16,0r 16,0,20,0r 20,0,24,0r 24,0,26,0r 12,0,13,-2w 16,0,17,3w 20,0,21,-2w 24,0,25,-3w 11,-6,13,-2w 15,-6,13,-2w 19,-6,21,-2w 23,-6,21,-2w'),
        b('6,0,10,0r 10,0,14,0r 14,0,18,0r 18,0,22,0r 22,0,24,0r 10,0,11,-2w 14,0,15,3w 18,0,19,-2w 22,0,23,3w 9,-6,11,-2w 13,-6,11,-2w 17,-6,19,-2w 21,-6,19,-2w'),
        b('5,0,9,0r 9,0,13,0r 13,0,17,0r 17,0,21,0r 21,0,25,0r 25,0,27,0r 9,0,10,-2w 13,0,14,-3w 17,0,18,-3w 21,0,22,-2w 25,0,26,-3w 12,-7,14,-3w 16,-7,14,-3w'),
        b('4,1,8,1r 8,1,12,1r 12,1,16,1r 16,1,20,1r 20,1,24,1r 24,1,26,1r 8,1,9,-2w 12,1,13,4w 16,1,17,-1w 20,1,21,-2w 24,1,25,-1w 7,-5,9,-2w 11,-5,9,-2w 19,-5,21,-2w 23,-5,21,-2w')
      ];
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
