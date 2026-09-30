// Bug Hunt, level 1: the Year 8 algorithms (sequence, selection, arrays, linear search, FOR and WHILE), each with
// the errors that can be planted in it. A round is one algorithm with one error; the expected outputs of every test
// come from running the correct algorithm (shared/pseudocode-engine.js), never from a hand-written answer.
//
// A template returns { purpose, stored?, lines, tests: [{ inputs, givens?, label }], bugs: [{ line, bad, kind }] }
// where lines are the correct algorithm (indented with four spaces), `stored` names the arrays the algorithm is
// handed (shown above the code, not declared in it), and kind is 'syntax' or 'logic'.
var BugPrograms = (function () {
  'use strict';

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function distinct(n, lo, hi) {
    var out = [];
    while (out.length < n) { var v = randInt(lo, hi); if (out.indexOf(v) === -1) out.push(v); }
    return out;
  }

  // ------------------------------------------------------------ sequence: two inputs, one calculation
  function sequenceCalc() {
    var v = pick([
      { a: 'Price', b: 'Quantity', r: 'Cost', what: 'the cost of buying Quantity items at Price each' },
      { a: 'Length', b: 'Width', r: 'Area', what: 'the area of a rectangle' },
      { a: 'Hours', b: 'Rate', r: 'Pay', what: 'the pay for working Hours hours at Rate per hour' }
    ]);
    var lines = [
      'DECLARE ' + v.a + ' : INTEGER',
      'DECLARE ' + v.b + ' : INTEGER',
      'DECLARE ' + v.r + ' : INTEGER',
      'INPUT ' + v.a,
      'INPUT ' + v.b,
      v.r + ' <- ' + v.a + ' * ' + v.b,
      'OUTPUT ' + v.r
    ];
    var tests = [0, 1].map(function () {
      var x = randInt(3, 12), y = randInt(3, 12);
      while (y === x) y = randInt(3, 12);
      return { inputs: [x, y] };
    });
    return {
      purpose: 'Input ' + v.a + ' and ' + v.b + ', then output ' + v.r + ', ' + v.what + ' (' + v.a + ' multiplied by ' + v.b + ').',
      lines: lines, tests: tests,
      bugs: [
        { line: 5, bad: v.r + ' <- ' + v.a + ' + ' + v.b, kind: 'logic' },
        { line: 5, bad: v.r + ' <- ' + v.a + ' * ' + v.a, kind: 'logic' },
        { line: 4, bad: 'OUTPUT ' + v.b, kind: 'logic' },
        { line: 6, bad: 'OUTPUT ' + v.a, kind: 'logic' },
        { line: 5, bad: v.r + ' = ' + v.a + ' * ' + v.b, kind: 'syntax' },
        { line: 2, bad: 'DECLARE ' + v.r + ' INTEGER', kind: 'syntax' },
        { line: 3, bad: 'INPT ' + v.a, kind: 'syntax' }
      ]
    };
  }

  // ------------------------------------------------------------ selection: one comparison, two messages
  function selection() {
    var v = pick([
      { n: 'Mark', cut: randInt(4, 8) * 10, op: '>=', words: 'or more', yes: 'Pass', no: 'Fail' },
      { n: 'Age', cut: pick([12, 13, 16, 18]), op: '>=', words: 'or more', yes: 'Allowed', no: 'Too young' },
      { n: 'Speed', cut: pick([30, 50, 60, 80]), op: '>', words: 'more than', yes: 'Too fast', no: 'OK' },
      { n: 'Temperature', cut: randInt(25, 35), op: '>', words: 'more than', yes: 'Hot', no: 'Not hot' }
    ]);
    var cond = v.n + ' ' + v.op + ' ' + v.cut;
    var lines = [
      'DECLARE ' + v.n + ' : INTEGER',
      'INPUT ' + v.n,
      'IF ' + cond + ' THEN',
      '    OUTPUT "' + v.yes + '"',
      'ELSE',
      '    OUTPUT "' + v.no + '"',
      'ENDIF'
    ];
    var k = randInt(2, 9);
    var tests = v.op === '>='
      ? [{ inputs: [v.cut - 1], label: 'just below' }, { inputs: [v.cut], label: 'exactly ' + v.cut }, { inputs: [v.cut + k] }]
      : [{ inputs: [v.cut], label: 'exactly ' + v.cut }, { inputs: [v.cut + 1], label: 'just above' }, { inputs: [v.cut - k] }];
    var rule = v.op === '>=' ? v.n + ' is ' + v.cut + ' or more' : v.n + ' is more than ' + v.cut;
    return {
      purpose: 'Input ' + v.n + '. Output "' + v.yes + '" if ' + rule + ', otherwise output "' + v.no + '".',
      lines: lines, tests: tests,
      bugs: [
        { line: 2, bad: 'IF ' + v.n + ' ' + (v.op === '>=' ? '>' : '>=') + ' ' + v.cut + ' THEN', kind: 'logic' },
        { line: 2, bad: 'IF ' + v.n + ' < ' + v.cut + ' THEN', kind: 'logic' },
        { line: 2, bad: 'IF ' + v.n + ' ' + v.op + ' ' + (v.cut + 10) + ' THEN', kind: 'logic' },
        { line: 3, bad: '    OUTPUT "' + v.no + '"', kind: 'logic' },
        { line: 1, bad: 'OUTPUT ' + v.n, kind: 'logic' },
        { line: 2, bad: 'IF ' + cond, kind: 'syntax' },
        { line: 4, bad: 'ELSE ' + v.n + ' < ' + v.cut, kind: 'syntax' },
        { line: 6, bad: 'END', kind: 'syntax' }
      ]
    };
  }

  // ------------------------------------------------------------ FOR: a running total of inputs
  function forTotal() {
    var v = pick([{ t: 'Total', x: 'Score' }, { t: 'Sum', x: 'Number' }, { t: 'Total', x: 'Mark' }, { t: 'Total', x: 'Points' }]);
    var n = randInt(3, 5);
    var lines = [
      'DECLARE ' + v.t + ' : INTEGER',
      'DECLARE Count : INTEGER',
      'DECLARE ' + v.x + ' : INTEGER',
      v.t + ' <- 0',
      'FOR Count <- 1 TO ' + n,
      '    INPUT ' + v.x,
      '    ' + v.t + ' <- ' + v.t + ' + ' + v.x,
      'NEXT Count',
      'OUTPUT ' + v.t
    ];
    var tests = [0, 1].map(function () { return { inputs: distinct(n, 2, 20) }; });
    return {
      purpose: 'Input ' + n + ' numbers, one at a time, then output their total.',
      lines: lines, tests: tests,
      bugs: [
        { line: 3, bad: v.t + ' <- 1', kind: 'logic' },
        { line: 4, bad: 'FOR Count <- 1 TO ' + (n - 1), kind: 'logic' },
        { line: 6, bad: '    ' + v.t + ' <- ' + v.t + ' + Count', kind: 'logic' },
        { line: 6, bad: '    ' + v.t + ' <- ' + v.x, kind: 'logic' },
        { line: 8, bad: 'OUTPUT ' + v.x, kind: 'logic' },
        { line: 3, bad: v.t + ' = 0', kind: 'syntax' },
        { line: 4, bad: 'FOR Count 1 TO ' + n, kind: 'syntax' },
        { line: 8, bad: 'OUTPT ' + v.t, kind: 'syntax' }
      ]
    };
  }

  // ------------------------------------------------------------ arrays: count the items above a limit
  function countAbove() {
    var v = pick([
      { a: 'Temps', limit: 30, what: 'temperatures', lo: 18, hi: 40 },
      { a: 'Scores', limit: 50, what: 'scores', lo: 20, hi: 90 },
      { a: 'Heights', limit: 150, what: 'heights', lo: 120, hi: 180 }
    ]);
    var size = 6;
    var lines = [
      'DECLARE Count : INTEGER',
      'DECLARE Index : INTEGER',
      'Count <- 0',
      'FOR Index <- 1 TO ' + size,
      '    IF ' + v.a + '[Index] > ' + v.limit + ' THEN',
      '        Count <- Count + 1',
      '    ENDIF',
      'NEXT Index',
      'OUTPUT Count'
    ];
    function arrayWith(above) {
      // `above` of the items are over the limit, and the last item always is (so a loop that stops early shows).
      var items = [];
      for (var i = 0; i < size; i++) items.push(i < above ? randInt(v.limit + 1, v.hi) : randInt(v.lo, v.limit - 1));
      var last = items.shift(); items = shuffle(items); items.push(last);
      return items;
    }
    var tests = [arrayWith(randInt(2, 4)), arrayWith(randInt(1, 3))].map(function (arr) {
      var g = {}; g[v.a] = arr; arr.lower = 1;
      return { inputs: [], givens: g, label: v.a + ' = ' + arr.join(', ') };
    });
    return {
      purpose: 'Count how many of the ' + size + ' ' + v.what + ' stored in ' + v.a + ' are more than ' + v.limit + ', then output the count.',
      stored: v.a + '[1:' + size + '] is already stored (a different set for each test).',
      lines: lines, tests: tests,
      bugs: [
        { line: 2, bad: 'Count <- 1', kind: 'logic' },
        { line: 3, bad: 'FOR Index <- 1 TO ' + (size - 1), kind: 'logic' },
        { line: 4, bad: '    IF ' + v.a + '[Index] < ' + v.limit + ' THEN', kind: 'logic' },
        { line: 5, bad: '        Count <- Count + Index', kind: 'logic' },
        { line: 8, bad: 'OUTPUT Index', kind: 'logic' },
        { line: 5, bad: '        Count = Count + 1', kind: 'syntax' },
        { line: 4, bad: '    IF ' + v.a + '[Index] > ' + v.limit, kind: 'syntax' },
        { line: 3, bad: 'FOR Index 1 TO ' + size, kind: 'syntax' }
      ]
    };
  }

  // ------------------------------------------------------------ linear search with a Found flag
  function linearSearch() {
    var size = 5;
    var values = distinct(size, 3, 40);
    var absent = randInt(41, 60);
    var lines = [
      'DECLARE Target : INTEGER',
      'DECLARE Found : BOOLEAN',
      'DECLARE Index : INTEGER',
      'INPUT Target',
      'Found <- FALSE',
      'FOR Index <- 1 TO ' + size,
      '    IF Values[Index] = Target THEN',
      '        Found <- TRUE',
      '    ENDIF',
      'NEXT Index',
      'IF Found = TRUE THEN',
      '    OUTPUT "Found"',
      'ELSE',
      '    OUTPUT "Not found"',
      'ENDIF'
    ];
    var givens = { Values: values.slice() };
    givens.Values.lower = 1;
    return {
      purpose: 'Input Target. Search the array Values for it with a linear search. Output "Found" if it is there, otherwise "Not found".',
      stored: 'Values[1:' + size + '] is already stored: ' + values.join(', '),
      lines: lines,
      tests: [
        { inputs: [values[size - 1]], givens: givens, label: 'the last item' },
        { inputs: [values[1]], givens: givens },
        { inputs: [absent], givens: givens, label: 'not in the array' }
      ],
      bugs: [
        { line: 4, bad: 'Found <- TRUE', kind: 'logic' },
        { line: 5, bad: 'FOR Index <- 1 TO ' + (size - 1), kind: 'logic' },
        { line: 6, bad: '    IF Values[1] = Target THEN', kind: 'logic' },
        { line: 7, bad: '        Found <- FALSE', kind: 'logic' },
        { line: 10, bad: 'IF Found = FALSE THEN', kind: 'logic' },
        { line: 6, bad: '    IF Values[Index] = Target', kind: 'syntax' },
        { line: 4, bad: 'Found = FALSE', kind: 'syntax' },
        { line: 1, bad: 'DECLARE Found BOOLEAN', kind: 'syntax' }
      ]
    };
  }

  // ------------------------------------------------------------ WHILE: add inputs until a limit is reached
  function whileTotal() {
    var limit = pick([50, 60, 80, 100]);
    var lines = [
      'DECLARE Total : INTEGER',
      'DECLARE Number : INTEGER',
      'Total <- 0',
      'WHILE Total < ' + limit + ' DO',
      '    INPUT Number',
      '    Total <- Total + Number',
      'ENDWHILE',
      'OUTPUT Total'
    ];
    function run() {
      var nums = [], sum = 0;
      while (sum < limit) { var x = randInt(8, 30); nums.push(x); sum += x; }
      return nums.concat([randInt(8, 30), randInt(8, 30), randInt(8, 30)]);   // spare values, never used by a correct algorithm
    }
    return {
      purpose: 'Keep inputting numbers and adding them to Total until Total reaches ' + limit + ' or more. Then output Total.',
      lines: lines,
      tests: [{ inputs: run() }, { inputs: run() }],
      bugs: [
        { line: 3, bad: 'WHILE Total > ' + limit + ' DO', kind: 'logic' },
        { line: 5, bad: '    Total <- Number', kind: 'logic' },
        { line: 5, bad: '    Total <- Total + 1', kind: 'logic' },
        { line: 7, bad: 'OUTPUT Number', kind: 'logic' },
        { line: 2, bad: 'Total = 0', kind: 'syntax' },
        { line: 6, bad: 'END', kind: 'syntax' },
        { line: 4, bad: '    INPT Number', kind: 'syntax' }
      ]
    };
  }

  var TEMPLATES = [sequenceCalc, selection, forTotal, countAbove, linearSearch, whileTotal];

  function source(lines) { return lines.join('\n'); }
  function run(lines, test) {
    return PseudocodeEngine.runPseudocode(source(lines), test.givens || {}, 2000, test.inputs);
  }
  function sameOutputs(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (String(a[i]) !== String(b[i])) return false;
    return true;
  }

  /**
   * One round: a template's algorithm with one of its errors planted. Every test's expected output comes from the
   * correct algorithm, and the planted error must fail at least one test (checked here, not assumed).
   */
  function round(avoid) {
    for (var tries = 0; tries < 50; tries++) {
      var make = pick(TEMPLATES);
      if (avoid && make.name === avoid && tries < 20) continue;
      var t = make();
      t.tests.forEach(function (test) { test.expect = run(t.lines, test).outputs; });
      if (t.tests.some(function (test) { return run(t.lines, test).error; })) continue;
      var bugs = shuffle(t.bugs);
      for (var b = 0; b < bugs.length; b++) {
        var buggy = t.lines.slice(); buggy[bugs[b].line] = bugs[b].bad;
        var fails = t.tests.some(function (test) { var r = run(buggy, test); return r.error || !sameOutputs(r.outputs, test.expect); });
        if (fails) return { template: make.name, purpose: t.purpose, stored: t.stored || '', correct: t.lines, lines: buggy, bug: bugs[b], tests: t.tests };
      }
    }
    throw new Error('Bug Hunt could not build a round.');
  }

  /** Runs the algorithm with the student's line in place of `lineIndex`: { ok, results[] } for every test. */
  function check(r, lineIndex, text) {
    var lines = r.lines.slice(); lines[lineIndex] = text;
    var results = r.tests.map(function (test) {
      var out = run(lines, test);
      return { error: out.error, outputs: out.outputs, pass: !out.error && sameOutputs(out.outputs, test.expect) };
    });
    return { ok: results.every(function (x) { return x.pass; }), results: results };
  }

  /** What the algorithm as shown (with its error) does on every test. */
  function trial(r) {
    return r.tests.map(function (test) {
      var out = run(r.lines, test);
      return { error: out.error, outputs: out.outputs, pass: !out.error && sameOutputs(out.outputs, test.expect) };
    });
  }

  return { round: round, check: check, trial: trial, templates: TEMPLATES, run: run, sameOutputs: sameOutputs };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BugPrograms;
