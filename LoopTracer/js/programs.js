// Loop Tracer programs: random ACSL pseudocode loop programs by level, every answer worked out by
// shared/acsl-pseudocode.js. tools/build_acsl_c2_loops.mjs copies this file into the acsl-c2 drills, so it must
// stay a plain script that needs only ACSLPseudo.
//   ACSLLoops.make(level, { maxRows }) -> { level, skill, lines, src, output, rows, events }
// Levels: 1 FOR loops, 2 STEP (and negative STEP), 3 WHILE loops, 4 IF inside a loop (% and the int() test),
// 5 nested loops, 6 contest length (long loops: spot the pattern; too long to trace row by row).
var ACSLLoops = (function () {
  'use strict';
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function v2() { var p = pick([['s', 'i'], ['t', 'k'], ['a', 'j'], ['x', 'n'], ['s', 'j']]); return { acc: p[0], i: p[1] }; }

  var LEVELS = [
    { n: 1, name: 'FOR loops', blurb: 'Accumulators and counters in a FOR loop.' },
    { n: 2, name: 'STEP', blurb: 'FOR loops that count up or down in steps.' },
    { n: 3, name: 'WHILE loops', blurb: 'Loops that run until a condition is false.' },
    { n: 4, name: 'IF and int()', blurb: 'Tests inside a loop: %, and x / k == int(x / k).' },
    { n: 5, name: 'Nested loops', blurb: 'A loop inside a loop.' },
    { n: 6, name: 'Contest', blurb: 'Long loops: spot the pattern instead of tracing every step.' }
  ];

  var T = {
    1: [
      { skill: 'Accumulator', make: function () {
        var v = v2(), a = R(1, 4), b = a + R(2, 4);
        return [v.acc + ' = 0', 'FOR ' + v.i + ' = ' + a + ' TO ' + b, '  ' + v.acc + ' = ' + v.acc + ' + ' + v.i, 'NEXT ' + v.i, 'OUTPUT ' + v.acc];
      } },
      { skill: 'Accumulator', make: function () {
        var v = v2(), k = R(2, 4), c = R(1, 3), n = R(3, 5);
        return [v.acc + ' = ' + R(0, 5), 'FOR ' + v.i + ' = 1 TO ' + n, '  ' + v.acc + ' = ' + v.acc + ' + ' + k + ' * ' + v.i + ' - ' + c, 'NEXT ' + v.i, 'OUTPUT ' + v.acc];
      } },
      { skill: 'Product', make: function () {
        var n = R(3, 5), s = R(1, 2);
        return ['p = 1', 'FOR i = ' + s + ' TO ' + n, '  p = p * i', 'NEXT i', 'OUTPUT p'];
      } },
      { skill: 'Doubling', make: function () {
        var n = R(3, 5), a = R(1, 3), k = pick([2, 3]), c = R(0, a - 1);
        return ['x = ' + a, 'FOR i = 1 TO ' + n, '  x = x * ' + k + (c ? ' - ' + c : ''), 'NEXT i', 'OUTPUT x'];
      } },
      { skill: 'Counter', make: function () {
        var a = R(2, 6), b = a + R(3, 6), k = R(2, 3);
        return ['c = 0 : t = 0', 'FOR i = ' + a + ' TO ' + b, '  c = c + 1', '  t = t + ' + k, 'NEXT i', 'OUTPUT c * t'];
      } },
      { skill: 'Swap', make: function () {
        var n = R(3, 5);
        return ['a = ' + R(1, 2) + ' : b = ' + R(1, 3), 'FOR i = 1 TO ' + n, '  c = a + b : a = b : b = c', 'NEXT i', 'OUTPUT b'];
      } }
    ],
    2: [
      { skill: 'STEP', make: function () {
        var st = R(2, 3), a = R(1, 3), b = a + st * R(3, 4) + R(0, st - 1);
        return ['s = 0', 'FOR i = ' + a + ' TO ' + b + ' STEP ' + st, '  s = s + i', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Negative STEP', make: function () {
        var a = R(6, 9), st = pick([1, 2]), b = R(1, 3);
        return ['s = 0', 'FOR k = ' + a + ' TO ' + b + ' STEP -' + st, '  s = s + k', 'NEXT k', 'OUTPUT s'];
      } },
      { skill: 'Negative STEP', make: function () {
        var a = R(10, 20), st = R(3, 5), b = R(0, 4);
        return ['c = 0', 'FOR k = ' + a + ' TO ' + b + ' STEP -' + st, '  c = c + 1', 'NEXT k', 'OUTPUT c'];
      } },
      { skill: 'STEP', make: function () {
        var st = R(3, 5), b = R(12, 20);
        return ['c = 0 : t = 0', 'FOR j = 0 TO ' + b + ' STEP ' + st, '  c = c + 1', '  t = t + j', 'NEXT j', 'OUTPUT t - c'];
      } },
      { skill: 'Negative STEP', make: function () {
        var a = R(4, 6);
        return ['t = ""', 'FOR i = ' + a + ' TO 1 STEP -' + pick([1, 2]), '  t = t + i', 'NEXT i', 'OUTPUT t'];
      } },
      { skill: 'STEP', make: function () {
        var a = R(1, 3), st = R(2, 3), n = R(3, 4), b = a + st * n;
        return ['p = 1', 'FOR i = ' + a + ' TO ' + b + ' STEP ' + st, '  p = p + i * 2', 'NEXT i', 'OUTPUT p'];
      } }
    ],
    3: [
      { skill: 'WHILE', make: function () {
        var a = R(1, 5), k = pick([2, 3]), lim = R(40, 120);
        return ['x = ' + a + ' : c = 0', 'WHILE x < ' + lim, '  x = x * ' + k, '  c = c + 1', 'END WHILE', 'OUTPUT c'];
      } },
      { skill: 'Digit sum', make: function () {
        var n = R(100, 999);
        return ['n = ' + n + ' : s = 0', 'WHILE n > 0', '  s = s + n % 10', '  n = int(n / 10)', 'END WHILE', 'OUTPUT s'];
      } },
      { skill: 'WHILE', make: function () {
        var a = R(30, 60), k = R(5, 9);
        return ['x = ' + a + ' : c = 0', 'WHILE x >= ' + k, '  x = x - ' + k, '  c = c + 1', 'END WHILE', 'OUTPUT c * 10 + x'];
      } },
      { skill: 'Running total', make: function () {
        var lim = R(15, 40);
        return ['s = 0 : i = 0', 'WHILE s < ' + lim, '  i = i + 1', '  s = s + i', 'END WHILE', 'OUTPUT i'];
      } },
      { skill: 'Halving', make: function () {
        var n = pick([48, 80, 96, 112, 144, 160, 176, 208]);
        return ['n = ' + n + ' : c = 0', 'WHILE n / 2 == int(n / 2)', '  n = n / 2', '  c = c + 1', 'END WHILE', 'OUTPUT n + c'];
      } },
      { skill: 'Reverse digits', make: function () {
        var n = R(102, 987);
        return ['n = ' + n + ' : r = 0', 'WHILE n > 0', '  r = r * 10 + n % 10', '  n = int(n / 10)', 'END WHILE', 'OUTPUT r'];
      } }
    ],
    4: [
      { skill: 'int() test', make: function () {
        var k = R(3, 4), b = R(10, 14);
        return ['c = 0', 'FOR i = 1 TO ' + b, '  IF i / ' + k + ' == int(i / ' + k + ') THEN', '    c = c + i', '  END IF', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: '% test', make: function () {
        var a = R(1, 3), b = a + R(4, 6);
        return ['e = 0 : d = 0', 'FOR i = ' + a + ' TO ' + b, '  IF i % 2 == 0 THEN', '    e = e + i', '  ELSE', '    d = d + 1', '  END IF', 'NEXT i', 'OUTPUT e - d'];
      } },
      { skill: 'int() test', make: function () {
        var n = pick([12, 18, 20, 24, 28, 30]);
        return ['n = ' + n + ' : c = 0', 'FOR k = 1 TO n', '  IF n / k == int(n / k) THEN c = c + 1', '  END IF', 'NEXT k', 'OUTPUT c'];
      } },
      { skill: 'Biggest', make: function () {
        var a = R(2, 5), b = R(5, 9);
        return ['m = 0', 'FOR i = 1 TO ' + b, '  x = (i * ' + a + ') % ' + (b + 2), '  IF x > m THEN m = x', '  END IF', 'NEXT i', 'OUTPUT m'];
      } },
      { skill: '&& test', make: function () {
        var b = R(15, 24);
        return ['c = 0', 'FOR i = 1 TO ' + b, '  IF i % 2 == 1 && i % 3 == 0 THEN', '    c = c + 1', '  END IF', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'abs()', make: function () {
        var t = R(4, 7);
        return ['s = 0', 'FOR i = 1 TO ' + (t + R(2, 3)), '  s = s + abs(i - ' + t + ')', 'NEXT i', 'OUTPUT s'];
      } }
    ],
    5: [
      { skill: 'Nested count', make: function () {
        var a = R(2, 4), b = R(2, 4);
        return ['c = 0', 'FOR i = 1 TO ' + a, '  FOR j = 1 TO ' + b, '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Triangle', make: function () {
        var a = R(3, 4);
        return ['c = 0', 'FOR i = 1 TO ' + a, '  FOR j = i TO ' + a, '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Nested sum', make: function () {
        var a = R(2, 3), b = R(2, 3);
        return ['s = 0', 'FOR i = 1 TO ' + a, '  FOR j = 1 TO ' + b, '    s = s + i * j', '  NEXT j', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Sum of squares', make: function () {
        var a = R(3, 4);
        return ['s = 0', 'FOR i = 1 TO ' + a, '  FOR j = 1 TO i', '    s = s + i', '  NEXT j', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Nested WHILE', make: function () {
        var a = R(2, 3);
        return ['c = 0', 'FOR i = 1 TO ' + a, '  x = i', '  WHILE x < 6', '    x = x * 2', '    c = c + 1', '  END WHILE', 'NEXT i', 'OUTPUT c'];
      } }
    ],
    6: [
      { skill: 'Sum of squares', make: function () {
        var n = pick([7, 8, 9, 10, 11, 12]);
        return ['a = 0', 'FOR i = 1 TO ' + n, '  FOR j = 1 TO i', '    a = a + i', '  NEXT j', 'NEXT i', 'c = 0', 'FOR k = 1 TO a', '  IF a / k == int(a / k) THEN c = c + 1', '  END IF', 'NEXT k', 'OUTPUT c'];
      } },
      { skill: 'Gauss', make: function () {
        var n = pick([20, 30, 40, 50, 60, 80, 100]), st = pick([1, 1, 2]);
        return ['s = 0', 'FOR i = ' + (st === 2 ? 2 : 1) + ' TO ' + n + (st === 2 ? ' STEP 2' : ''), '  s = s + i', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Odd numbers', make: function () {
        var n = R(12, 25);
        return ['s = 0', 'FOR i = 1 TO ' + (2 * n - 1) + ' STEP 2', '  s = s + i', 'NEXT i', 'OUTPUT sqrt(s)'];
      } },
      { skill: 'Multiples', make: function () {
        var a = pick([3, 4, 6]), b = pick([5, 7]), n = pick([50, 60, 70, 84, 100]);
        return ['c = 0', 'FOR i = 1 TO ' + n, '  IF i % ' + a + ' == 0 || i % ' + b + ' == 0 THEN', '    c = c + 1', '  END IF', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Factors', make: function () {
        var n = pick([36, 48, 60, 72, 84, 90, 96, 100]);
        return ['n = ' + n + ' : s = 0', 'FOR k = 1 TO n', '  IF n / k == int(n / k) THEN s = s + k', '  END IF', 'NEXT k', 'OUTPUT s'];
      } },
      { skill: 'Nested count', make: function () {
        var n = pick([8, 9, 10, 12, 15]);
        return ['c = 0', 'FOR i = 1 TO ' + n, '  FOR j = i + 1 TO ' + n, '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Countdown', make: function () {
        var a = pick([50, 60, 75, 90, 100]), st = pick([3, 4, 6, 7]);
        return ['c = 0 : s = 0', 'FOR i = ' + a + ' TO 1 STEP -' + st, '  c = c + 1', '  s = i', 'NEXT i', 'OUTPUT c * 100 + s'];
      } }
    ]
  };

  // The rows of a trace table: every value a variable is given, and every output, in order. The step that takes a
  // FOR variable past its end is left out, as in a written trace table.
  function rowsOf(events) {
    return events.filter(function (e) { return !(e.type === 'assign' && e.final); }).map(function (e) {
      return e.type === 'output' ? { line: e.line, name: 'OUTPUT', value: String(e.value) } : { line: e.line, name: e.name, value: ACSLPseudo.format(e.value), kind: e.kind };
    });
  }

  function make(level, opts) {
    opts = opts || {};
    var list = T[level] || T[1], maxRows = opts.maxRows || 0;
    for (var tries = 0; tries < 200; tries++) {
      var t = opts.skill ? (list.filter(function (x) { return x.skill === opts.skill; })[0] || pick(list)) : pick(list);
      var lines = t.make(), src = lines.join('\n');
      var r = ACSLPseudo.run(src, { trace: true });
      if (r.error) throw new Error('Loop Tracer program failed: ' + r.error.message + '\n' + src);
      var rows = rowsOf(r.events);
      if (maxRows && rows.length > maxRows) continue;
      if (opts.avoid && opts.avoid.indexOf(src) !== -1) continue;
      return { level: level, skill: t.skill, lines: lines, src: src, output: r.outputs.join('\n'), outputs: r.outputs, rows: rows, events: r.events };
    }
    throw new Error('No program fits level ' + level + ' with at most ' + maxRows + ' rows.');
  }

  return { LEVELS: LEVELS, make: make, rowsOf: rowsOf, templates: T, R: R, pick: pick };
})();
