// Data Bridge level pack 6: rounds 51 to 60, "Expert", the finale. Heavy trucks, long gaps, few anchors; the pool is
// only a little more than the cheapest sound bridge found (cost / pool 0.92 to 0.95).
// Format and tests: BridgeBuilder/LEVEL-PACKS.md. Test: BB_PACK=6 node tools/test_bridge_builder.mjs
(function (root) {
  'use strict';
  var MAT = { r: 'road', w: 'wood', s: 'steel' };
  // 'x1 y1 x2 y2 m,...' (m: r road, w wood, s steel) to [x1, y1, x2, y2, material] beams
  function beams(str) {
    return str.split(',').map(function (b) { var p = b.split(' '); return [+p[0], +p[1], +p[2], +p[3], MAT[p[4]]]; });
  }
  // One sound bridge per round, in order (found by search: the cheapest that peaks under 0.85).
  var SOUND = [
        '9 0 11 0 r,9 -3 11 -3 w,11 0 11 -3 w,11 0 13 0 r,11 -3 13 0 w,13 0 15 0 r,15 0 17 0 r,17 0 19 0 r,19 0 21 0 r,21 0 21 -3 w,21 0 23 0 r,21 -3 23 -3 w,21 -3 23 0 w,14 -3 13 0 s,14 -3 15 0 w,18 -3 17 0 w,18 -3 19 0 w',
        '8 0 10 0 r,10 0 12 0 r,12 0 12 3 w,12 0 14 0 r,12 3 14 3 w,14 0 14 3 w,14 0 16 0 r,14 3 16 3 w,16 0 16 3 w,16 0 18 0 r,16 3 18 3 s,18 0 18 3 w,18 0 20 0 r,18 3 20 3 s,20 0 20 3 w,20 0 22 0 r,20 3 22 3 s,22 0 22 3 w,22 0 24 0 r,8 -2 10 0 s,24 -2 22 0 s,13 5 12 3 w,13 5 14 3 w,19 5 16 3 s,19 5 18 3 w,19 5 20 3 w,19 5 22 3 s',
        '8 2 10 2 r,10 2 12 2 r,10 2 12 4 w,12 2 12 4 w,12 2 14 2 r,12 4 14 4 w,12 4 14 2 s,14 2 15 2 r,14 4 15 4 w,20 -1 22 -1 r,20 1 22 -1 w,22 -1 24 -1 r,22 -1 24 1 s,24 -1 24 1 w,24 -1 26 -1 r,26 -1 28 -1 r,8 -1 10 2 s,15 2 12 4 s,20 -4 22 -1 s,28 -1 24 1 w,28 -4 26 -1 w',
        '9 0 11 0 r,11 0 11 -4 w,11 0 13 0 r,11 -4 13 -4 w,13 0 13 -4 w,13 0 15 0 r,13 -4 15 -4 w,15 0 15 -4 w,15 0 17 0 r,15 -4 17 -4 s,15 -4 17 0 w,17 0 17 -4 w,17 0 19 0 r,17 -4 19 -4 w,19 0 19 -4 w,19 0 21 0 r,19 -4 21 -4 w,21 0 21 -4 w,21 0 23 0 r,11 -6 11 -4 w,11 -6 13 -4 s,11 -6 15 -4 s,21 -6 17 -4 s,21 -6 19 -4 s,21 -6 21 -4 w',
        '7 0 7 2 w,7 0 9 0 r,7 2 9 2 w,7 2 9 0 s,9 0 9 2 w,9 0 11 0 r,9 2 11 2 w,11 0 11 2 w,11 0 13 0 r,11 2 13 2 s,11 0 13 2 w,11 2 13 0 w,13 0 13 2 w,13 0 15 0 r,13 2 15 2 s,13 0 15 2 w,13 2 15 0 s,15 0 17 0 r,15 2 17 2 s,17 0 17 2 w,17 0 19 0 r,17 2 19 2 s,17 0 19 2 w,17 2 19 0 w,19 0 19 2 w,19 0 21 0 r,19 2 21 2 s,19 2 21 0 w,21 0 21 2 w,21 0 23 0 r,21 2 23 2 w,21 2 23 0 w,23 0 23 2 w,23 0 25 0 r,23 2 25 0 s,16 -3 15 0 s,16 -3 17 0 s',
        '8 0 8 2 s,8 0 10 0 r,8 2 10 2 s,8 2 10 0 s,10 0 10 2 w,10 0 12 0 r,10 2 12 2 s,10 2 12 0 w,12 0 12 2 w,12 0 14 0 r,12 2 14 2 s,12 0 14 2 w,14 0 14 2 w,14 0 16 0 r,14 2 16 2 w,14 2 16 0 s,16 0 16 2 s,16 0 18 0 r,16 2 18 2 w,16 2 18 0 s,18 0 18 2 s,18 0 20 0 r,18 2 20 2 w,20 0 20 2 w,20 0 22 0 r,20 2 22 2 w,22 0 22 2 w,22 0 24 0 r,19 4 18 2 s,21 4 20 2 w,21 4 22 2 w',
        '6 0 6 1 w,6 0 8 0 r,6 1 8 1 w,6 1 8 0 s,8 0 8 1 w,8 0 10 0 r,8 1 10 0 w,10 0 10 1 s,10 0 11 0 r,10 1 11 1 s,10 1 11 0 s,11 0 11 1 s,12 0 12 1 w,12 0 14 0 r,12 1 14 1 s,12 1 14 0 s,14 0 14 1 w,14 0 16 0 r,14 1 16 1 s,14 1 16 0 w,16 0 16 1 w,16 0 18 0 r,16 1 18 0 s,18 0 18 1 s,18 0 19 0 r,18 1 19 1 s,18 1 19 0 s,19 0 19 1 s,20 0 20 1 w,20 0 22 0 r,20 1 22 1 s,20 1 22 0 s,22 0 22 1 w,22 0 24 0 r,22 1 24 1 s,22 1 24 0 w,24 0 24 1 w,24 0 26 0 r,24 1 26 0 s,12 0 11 1 s,20 0 19 1 s',
        '6 0 8 0 r,6 0 8 -2 s,8 0 8 -2 w,8 0 10 0 r,8 -2 10 -2 s,8 -2 10 0 w,10 0 10 -2 w,10 0 12 0 r,10 -2 12 -2 s,10 -2 12 0 w,12 0 12 -2 w,12 0 14 0 r,12 -2 14 -2 w,12 -2 14 0 s,14 0 14 -2 w,14 0 16 0 r,14 -2 16 0 w,16 0 16 -2 w,16 0 18 0 r,16 -2 18 -2 w,16 -2 18 0 w,18 0 20 0 r,18 -2 20 -2 w,18 0 20 -2 s,18 -2 20 0 w,20 0 20 -2 w,20 0 22 0 r,20 -2 22 -2 s,20 -2 22 0 s,22 0 22 -2 w,22 0 24 0 r,22 -2 24 -2 s,24 0 24 -2 w,24 0 26 0 r,24 -2 26 0 w,6 -3 8 -2 s,26 -3 24 -2 w,12 -6 12 -2 s,20 -6 20 -2 s',
        '6 0 8 0 r,6 0 8 -2 s,8 0 8 -2 w,8 0 10 0 r,8 -2 10 -2 w,10 0 10 -2 w,10 0 12 0 r,10 -2 12 -2 w,10 -2 12 0 s,12 0 12 -2 s,12 0 14 0 r,12 -2 14 -2 s,12 -2 14 0 s,14 0 14 -2 w,14 0 16 0 r,14 -2 16 -2 s,14 -2 16 0 w,16 0 16 -2 w,16 0 18 0 r,16 -2 18 -2 s,16 -2 18 0 w,18 0 18 -2 s,18 0 20 0 r,18 -2 20 -2 w,18 -2 20 0 s,20 0 20 -2 s,20 0 22 0 r,20 -2 22 -2 w,20 -2 22 0 s,22 0 24 0 r,22 -2 24 -2 w,24 0 24 -2 w,24 0 26 0 r,24 -2 26 0 s,12 4 12 0 s,20 -6 20 -2 s',
        '5 0 7 0 r,7 0 7 -1 w,7 0 9 0 r,7 -1 9 -1 w,7 -1 9 0 s,9 0 11 0 r,9 -1 11 -1 w,9 0 11 -1 w,9 -1 11 0 w,11 0 11 -1 w,11 0 13 0 r,11 -1 13 -1 w,11 -1 13 0 s,13 0 13 -1 s,13 0 15 0 r,13 -1 15 0 w,21 2 23 2 r,21 2 23 1 s,23 2 23 1 w,23 2 25 2 r,23 1 25 1 s,23 1 25 2 w,25 2 25 1 w,25 2 27 2 r,25 1 27 1 s,25 1 27 2 s,27 2 27 1 s,27 2 28 2 r,27 1 28 2 s,5 -3 7 -1 s,15 -3 13 -1 s'
  ];
  root.BBLevelPacks = root.BBLevelPacks || {};
  root.BBLevelPacks[6] = {
    levels: function (T) {
      var cliffL = T.cliffL, cliffR = T.cliffR, DEEP = T.DEEP, BACK = T.BACK, FAR = T.FAR;
      function spike(x, top, w) { return [[x - w, DEEP], [x - w * 0.6, top - 3], [x, top], [x + w * 0.6, top - 3], [x + w, DEEP]]; }
      function fang(x, tip, w) { return [[x - w, 9], [x - w * 0.6, tip + 2], [x, tip], [x + w * 0.6, tip + 2], [x + w, 9]]; }
      function stone(a, b) { return [[a - 0.4, DEEP], [a, 0], [b, 0], [b + 0.4, DEEP]]; }
      return [
        { name: 'Twin Pillars', theme: 0, truck: 7.5, pool: 185,
          intro: 'two thin pillars stand in the gap. Rest your truss on their tips.',
          ground: [cliffL(9,0),cliffR(23,0),spike(14,-3,1),spike(18,-3,1)],
          anchors: [[9,0],[9,-3],[23,0],[23,-3],[14,-3],[18,-3]], start:[1.5,0], goal:[25,0] },
        { name: 'Sky Hooks', theme: 1, truck: 7.7, pool: 331,
          intro: 'two hooks hang from the roof. Hang the middle of your bridge from them.',
          ground: [cliffL(8,0),cliffR(24,0),fang(13,5,1.5),fang(19,5,1.5)],
          anchors: [[8,0],[8,-2],[24,0],[24,-2],[13,5],[19,5]], start:[1.5,0], goal:[26,0] },
        { name: 'Down the Steps', theme: 2, truck: 7.8, pool: 270,
          intro: 'two gaps at two heights. Build one bridge high and one bridge low.',
          ground: [cliffL(8,2),[[15,DEEP],[15,2],[16,2],[19,-1],[20,-1],[20,DEEP]],cliffR(28,-1)],
          anchors: [[8,2],[8,-1],[15,2],[20,-1],[20,-4],[28,-1],[28,-4]], start:[1.5,2], goal:[30,-1] },
        { name: 'Low Ledges', theme: 3, truck: 8, pool: 330,
          intro: 'the only anchors below are deep on two ledges. Build an arch up from them.',
          ground: [cliffL(9,0,[[9,-6],[11,-6]]),cliffR(23,0,[[23,-6],[21,-6]])],
          anchors: [[9,0],[23,0],[11,-6],[21,-6]], start:[1.5,0], goal:[25,0] },
        { name: 'The Needle', theme: 4, truck: 8.2, pool: 413,
          intro: 'a long gap with one needle of rock in the middle and one anchor on each side.',
          ground: [cliffL(7,0),cliffR(25,0),spike(16,-3,1)],
          anchors: [[7,0],[25,0],[16,-3]], start:[1.5,0], goal:[27,0] },
        { name: 'Cave Mouth', theme: 5, truck: 8.3, pool: 345,
          intro: 'the far side is a cave. Its roof hangs out over the gap, so hang your bridge from it.',
          ground: [cliffL(8,0),cliffR(24,0),[[FAR,4],[19,4],[19,9],[FAR,9]]],
          anchors: [[8,0],[8,-4],[24,0],[19,4],[21,4]], start:[1.5,0], goal:[26,0] },
        { name: 'Stepping Stones', theme: 0, truck: 8.5, pool: 381,
          intro: 'three gaps between two stones, and no anchors below the road. Build over the top.',
          ground: [cliffL(6,0),[[10.6,DEEP],[11,0],[12,0],[12.4,DEEP]],[[18.6,DEEP],[19,0],[20,0],[20.4,DEEP]],cliffR(26,0)],
          anchors: [[6,0],[11,0],[12,0],[19,0],[20,0],[26,0]], start:[1.5,0], goal:[28,0] },
        { name: 'Tall Towers', theme: 1, truck: 8.6, pool: 454,
          intro: 'a very wide gap with two rock towers deep below. Build tall legs down to them.',
          ground: [cliffL(6,0),cliffR(26,0),spike(12,-6,1.2),spike(20,-6,1.2)],
          anchors: [[6,0],[6,-3],[26,0],[26,-3],[12,-6],[20,-6]], start:[1.5,0], goal:[28,0] },
        { name: 'Chandelier', theme: 2, truck: 8.8, pool: 460,
          intro: 'a very long gap with one hook above and one rock below. Use them both.',
          ground: [cliffL(6,0),cliffR(26,0),fang(12,4,1.4),spike(20,-6,1.2)],
          anchors: [[6,0],[26,0],[12,4],[20,-6]], start:[1.5,0], goal:[28,0] },
        { name: 'Data Canyon', theme: 4, truck: 9, pool: 315,
          intro: 'the last bridge: two gaps, a rock, a hook, a hill and the heaviest truck. Good luck!',
          ground: [cliffL(5,0,[[5,-3],[4,-6]]),spike(10,-4,1),[[15,DEEP],[15,0],[16.5,0],[19.5,2],[21,2],[21,DEEP]],fang(24,6,1.5),[[FAR,DEEP],[FAR,4],[32,4],[30,2],[28,2],[28,DEEP]]],
          anchors: [[5,0],[5,-3],[10,-4],[15,0],[15,-3],[21,2],[28,2],[24,6]], start:[1.5,0], goal:[31,3] }
      ];
    },
    sound: function () { return SOUND.map(beams); },
    // just the road, with nothing holding it up
    flimsy: function () { return SOUND.map(function (s) { return beams(s).filter(function (b) { return b[4] === 'road'; }); }); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
