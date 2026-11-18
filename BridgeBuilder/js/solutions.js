// Data Bridge: one bridge per round that crosses inside the full-marks pool, as [x1, y1, x2, y2, material] beams.
// Shared by tools/test_bridge_builder.mjs (which proves each one holds) and teacher mode's Show test bridge.
(function (root) {
  'use strict';
  var R = 'road', W = 'wood', S = 'steel';
  function chain(pts, mat) { var o = []; for (var i = 1; i < pts.length; i++) o.push(pts[i - 1].concat(pts[i], [mat])); return o; }
  // Warren truss on a road path: each road piece gets an apex at its middle, off by dy (rounded to the grid).
  function warren(pts, dy, diag, chord, roadMat) {
    var o = chain(pts, roadMat || R), apex = [];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], m = [(a[0] + b[0]) / 2, Math.round((a[1] + b[1]) / 2 + dy) || 0];
      var dm = typeof diag === 'function' ? diag(i, pts.length - 1) : diag;
      o.push(a.concat(m, [dm]), m.concat(b, [dm]));
      if (apex.length) o.push(apex[apex.length - 1].concat(m, [chord]));
      apex.push(m);
    }
    return o;
  }
  function line(x0, y0, x1, y1, step) {
    var pts = [], n = Math.round((x1 - x0) / step);
    for (var i = 0; i <= n; i++) pts.push([x0 + i * step, y0 + (y1 - y0) * i / n]);
    return pts;
  }
  var sound = {
    1: warren(line(13, 0, 19, 0, 2), 2, W, W),
    2: warren(line(11, 0, 21, 0, 2), 2, W, W),
    3: warren(line(12, 0, 20, 4, 2), -2, W, W).concat([[12, -3, 13, -1, W], [20, 1, 19, 1, W]]),
    4: warren(line(10, 2, 20, -3, 2), -2, function (i, n) { return i >= n - 1 ? S : W; }, W).concat([[10, -1, 11, 0, W], [20, -5, 19, -4, W]]),
    5: chain(line(9, 0, 23, 0, 2), R).concat([[9, -2, 11, 0, W], [15, -2, 13, 0, W], [15, -2, 15, 0, W], [17, -2, 17, 0, W], [17, -2, 19, 0, W], [23, -2, 21, 0, W],
      [15, -2, 17, -2, W], [11, 0, 13, -2, W], [13, -2, 15, -2, W], [21, 0, 19, -2, W], [19, -2, 17, -2, W]]),
    6: chain(line(10, 0, 22, 0, 2), R).concat(chain([[12, -5], [14, -3], [16, -2], [18, -3], [20, -5]], W),
      [[14, -3, 14, 0, W], [16, -2, 16, 0, W], [18, -3, 18, 0, W], [14, -3, 12, 0, W], [18, -3, 20, 0, W], [12, -5, 12, -1, W], [12, -1, 12, 0, W], [20, -5, 20, -1, W], [20, -1, 20, 0, W],
        [10, 0, 12, -1, W], [22, 0, 20, -1, W]]),
    7: warren(line(10, 0, 22, 0, 2), 2, W, W).concat([[11, 4, 13, 2, W], [11, 4, 15, 2, S], [21, 4, 19, 2, W], [21, 4, 17, 2, S]]),
    8: warren(line(8, 0, 14, 0, 2), 2, W, W).concat(warren(line(18, 0, 24, 0, 2), 2, W, W), [[8, -2, 10, 0, W], [24, -2, 22, 0, W]]),
    9: warren(line(8, 0, 24, 0, 2), 3, function (i, n) { return i <= 2 || i > n - 2 ? S : W; }, S),
    10: warren(line(8, 0, 16, 0, 2), -2, W, W).concat([[8, -2, 9, -2, W], [15, -2, 16, -3, W], [16, -3, 16, 0, S], [18, -3, 18, 0, S], [16, -3, 18, -3, W]],
      warren(line(16, 0, 22, 0, 2), -2, W, W).slice(1), [[16, 0, 18, 0, R], [17, -2, 16, -3, W], [17, -2, 18, -3, W], [21, -2, 22, -2, W]])
      .filter(function (b) { return !(b[0] === 16 && b[1] === 0 && b[2] === 17); })
  };
  root.BBSolutions = { sound: sound, chain: chain, warren: warren, line: line };
})(typeof window !== 'undefined' ? window : globalThis);
