// Bug Hunt, level 2: Year 8 flowcharts (sequence and selection, in the words and shapes of L6 and Flowchart Blitz),
// each with one wrong box: the wrong shape for what it does, the wrong comparison, the wrong message on a branch, or
// Display where the algorithm needs Ask. A round is { purpose, chart, bug: { node, options, answer } }, where
// `chart` is the flowchart as drawn (with the error) and `answer` indexes the option that puts it right.
var BugFlows = (function () {
  'use strict';

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var SHAPES = {
    terminal: 'Terminal (rounded box)',
    process: 'Process (rectangle)',
    io: 'Input/Output (parallelogram)',
    decision: 'Decision (diamond)'
  };
  // Flowchart Blitz's wording for comparisons, so the two apps read the same.
  var RELATIONS = [
    { text: 'more than or equal to', op: '>=' },
    { text: 'greater than', op: '>' },
    { text: 'less than', op: '<' },
    { text: 'less than or equal to', op: '<=' }
  ];

  function node(id, shape, text) { return { id: id, shape: shape, text: text }; }

  // ------------------------------------------------------------ the three flowcharts
  function passFail() {
    var v = pick([
      { n: 'Mark', cut: randInt(4, 8) * 10, yes: 'Pass', no: 'Fail' },
      { n: 'Score', cut: randInt(3, 9) * 10, yes: 'Winner', no: 'Try again' },
      { n: 'Age', cut: pick([12, 13, 16]), yes: 'Allowed', no: 'Too young' }
    ]);
    var rel = RELATIONS[0];
    return {
      purpose: 'Ask for ' + v.n + '. Display "' + v.yes + '" if ' + v.n + ' is ' + v.cut + ' or more, otherwise display "' + v.no + '".',
      v: v, rel: rel,
      chart: {
        kind: 'selection',
        pre: [node('ask', 'io', 'Ask the user to enter ' + v.n)],
        decision: node('decide', 'decision', 'Is ' + v.n + ' ' + rel.text + ' ' + v.cut + '?'),
        yes: [node('yes', 'io', 'Display "' + v.yes + '"')],
        no: [node('no', 'io', 'Display "' + v.no + '"')],
        post: []
      }
    };
  }
  function calc() {
    var v = pick([
      { a: 'Price', b: 'Quantity', r: 'Cost' },
      { a: 'Length', b: 'Width', r: 'Area' },
      { a: 'Hours', b: 'Rate', r: 'Pay' }
    ]);
    return {
      purpose: 'Ask for ' + v.a + ' and ' + v.b + '. Store ' + v.a + ' multiplied by ' + v.b + ' in ' + v.r + ', then display ' + v.r + '.',
      v: v,
      chart: {
        kind: 'sequence',
        nodes: [
          node('askA', 'io', 'Ask the user to enter ' + v.a),
          node('askB', 'io', 'Ask the user to enter ' + v.b),
          node('store', 'process', 'Store ' + v.a + ' * ' + v.b + ' in ' + v.r),
          node('show', 'io', 'Display the value of ' + v.r)
        ]
      }
    };
  }
  function group() {
    var v = pick([
      { n: 'Age', cut: 13, r: 'Group', yes: 'Teen', no: 'Child' },
      { n: 'Height', cut: 140, r: 'Ride', yes: 'Big dipper', no: 'Teacups' },
      { n: 'Points', cut: randInt(5, 9) * 10, r: 'Medal', yes: 'Gold', no: 'Silver' }
    ]);
    var rel = RELATIONS[0];
    return {
      purpose: 'Ask for ' + v.n + '. If ' + v.n + ' is ' + v.cut + ' or more, store "' + v.yes + '" in ' + v.r + ', otherwise store "' + v.no + '". Then display ' + v.r + '.',
      v: v, rel: rel,
      chart: {
        kind: 'selection',
        pre: [node('ask', 'io', 'Ask the user to enter ' + v.n)],
        decision: node('decide', 'decision', 'Is ' + v.n + ' ' + rel.text + ' ' + v.cut + '?'),
        yes: [node('yes', 'process', 'Store "' + v.yes + '" in ' + v.r)],
        no: [node('no', 'process', 'Store "' + v.no + '" in ' + v.r)],
        post: [node('show', 'io', 'Display the value of ' + v.r)]
      }
    };
  }

  function allNodes(chart) {
    return chart.kind === 'sequence' ? chart.nodes : chart.pre.concat([chart.decision], chart.yes, chart.no, chart.post);
  }

  // ------------------------------------------------------------ the errors that can be planted
  // Each returns { node, set: {shape?, text?}, options: [labels], answer: label } or null if it does not apply.
  function wrongShape(t) {
    var n = pick(allNodes(t.chart));
    var others = Object.keys(SHAPES).filter(function (s) { return s !== n.shape; });
    var bad = pick(n.shape === 'decision' ? ['process'] : others.filter(function (s) { return s !== 'decision' && s !== 'terminal'; }));
    var labels = Object.keys(SHAPES).filter(function (s) { return s !== bad; }).map(function (s) { return 'Change the shape to ' + SHAPES[s]; });
    return { node: n.id, set: { shape: bad }, options: labels, answer: 'Change the shape to ' + SHAPES[n.shape], kind: 'shape' };
  }
  function wrongComparison(t) {
    if (!t.rel) return null;
    var badRel = pick(RELATIONS.slice(1));
    var n = t.chart.decision;
    var text = function (r) { return 'Is ' + t.v.n + ' ' + r.text + ' ' + t.v.cut + '?'; };
    var labels = RELATIONS.filter(function (r) { return r !== badRel; }).map(function (r) { return 'Change it to "' + text(r) + '"'; });
    return { node: n.id, set: { text: text(badRel) }, options: labels, answer: 'Change it to "' + text(t.rel) + '"', kind: 'comparison' };
  }
  function wrongBranch(t) {
    if (t.chart.kind !== 'selection') return null;
    var branch = pick(['yes', 'no']);
    var n = t.chart[branch][0], other = t.chart[branch === 'yes' ? 'no' : 'yes'][0];
    var right = n.text;
    var labels = [right, 'Display the value of ' + t.v.n, n.shape === 'process' ? 'Store ' + t.v.n + ' in ' + t.v.r : 'Ask the user to enter ' + t.v.n];
    return { node: n.id, set: { text: other.text }, options: labels.map(function (l) { return 'Change it to ' + l; }), answer: 'Change it to ' + right, kind: 'branch' };
  }
  function displayForAsk(t) {
    var n = t.chart.kind === 'sequence' ? pick(t.chart.nodes.slice(0, 2)) : t.chart.pre[0];
    var name = n.text.replace('Ask the user to enter ', '');
    var labels = ['Ask the user to enter ' + name, 'Store 0 in ' + name, 'Display "' + name + '"'];
    return { node: n.id, set: { text: 'Display the value of ' + name }, options: labels.map(function (l) { return 'Change it to ' + l; }), answer: 'Change it to ' + labels[0], kind: 'ask' };
  }
  function wrongCalc(t) {
    if (t.chart.kind !== 'sequence') return null;
    var n = t.chart.nodes[2], v = t.v;
    var right = 'Store ' + v.a + ' * ' + v.b + ' in ' + v.r;
    var bad = pick(['Store ' + v.a + ' + ' + v.b + ' in ' + v.r, 'Store ' + v.a + ' * ' + v.a + ' in ' + v.r]);
    var labels = [right, 'Store ' + v.a + ' + ' + v.b + ' in ' + v.r, 'Store ' + v.a + ' * ' + v.a + ' in ' + v.r].filter(function (l) { return l !== bad; });
    labels.push('Store ' + v.r + ' in ' + v.a);
    return { node: n.id, set: { text: bad }, options: labels.map(function (l) { return 'Change it to ' + l; }), answer: 'Change it to ' + right, kind: 'calc' };
  }
  function wrongDisplay(t) {
    var n = t.chart.kind === 'sequence' ? t.chart.nodes[3] : t.chart.post[0];
    if (!n) return null;
    var v = t.v, wrongName = t.chart.kind === 'sequence' ? pick([v.a, v.b]) : v.n;
    var labels = ['Display the value of ' + v.r, 'Display "' + v.r + '"', 'Ask the user to enter ' + v.r];
    return { node: n.id, set: { text: 'Display the value of ' + wrongName }, options: labels.map(function (l) { return 'Change it to ' + l; }), answer: 'Change it to ' + labels[0], kind: 'display' };
  }

  var TEMPLATES = [passFail, calc, group];
  var PLANTS = [wrongShape, wrongShape, wrongComparison, wrongBranch, displayForAsk, wrongCalc, wrongDisplay];

  function round(avoidKind) {
    for (var tries = 0; tries < 50; tries++) {
      var t = pick(TEMPLATES)();
      var bug = pick(PLANTS)(t);
      if (!bug || (avoidKind && bug.kind === avoidKind && tries < 20)) continue;
      var chart = JSON.parse(JSON.stringify(t.chart));
      var target = allNodes(chart).filter(function (n) { return n.id === bug.node; })[0];
      var fixed = { shape: target.shape, text: target.text };
      Object.keys(bug.set).forEach(function (k) { target[k] = bug.set[k]; });
      var options = shuffle(bug.options);
      return { purpose: t.purpose, chart: chart, fixed: fixed, bug: { node: bug.node, kind: bug.kind, options: options, answer: options.indexOf(bug.answer) } };
    }
    throw new Error('Bug Hunt could not build a flowchart.');
  }

  return { round: round, allNodes: allNodes, SHAPES: SHAPES };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BugFlows;
