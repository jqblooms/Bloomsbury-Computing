// Advanced mode (James 2026-10-27): every gate in the table below, chosen from the menu or with ?mode=advanced.
// Normal mode is untouched: the extra gates are added to GATE_DEFS only while Advanced mode runs, and each
// function below calls the original when Advanced mode is off.
(function () {
  var ADV = false;
  var RULES = [
    ['BUFFER', 'Q = A'], ['NOT', 'Q = NOT A'], ['AND', 'Q = A AND B'], ['OR', 'Q = A OR B'],
    ['NAND', 'Q = NOT (A AND B)'], ['NOR', 'Q = NOT (A OR B)'], ['XOR', 'Q = 1 when A and B are different'],
    ['XNOR', 'Q = 1 when A and B are the same'], ['IMPLY', 'Q = (NOT A) OR B'], ['INHIBIT', 'Q = A AND (NOT B)'],
    ['MAJORITY', 'Q = 1 when at least two of A, B, C are 1'], ['MUX', 'Q = A when C = 0, B when C = 1']
  ];
  var EXTRA = {
    BUFFER: { color: '#e8eaed', inputs: 1, w: 60, h: 40 },
    NAND: { color: '#e8eaed', inputs: 2, w: 70, h: 50 },
    NOR: { color: '#e8eaed', inputs: 2, w: 70, h: 50 },
    XOR: { color: '#e8eaed', inputs: 2, w: 70, h: 50 },
    XNOR: { color: '#e8eaed', inputs: 2, w: 78, h: 50 },
    IMPLY: { color: '#e8eaed', inputs: 2, w: 76, h: 50 },
    INHIBIT: { color: '#e8eaed', inputs: 2, w: 76, h: 50 },
    MAJORITY: { color: '#e8eaed', inputs: 3, w: 76, h: 62 },
    MUX: { color: '#e8eaed', inputs: 3, w: 76, h: 62 }
  };
  var BIN = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'IMPLY', 'INHIBIT'], UN = ['NOT', 'BUFFER'], TRI = ['MAJORITY', 'MUX'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var orig = {
    gateShape: window.gateShape, getAnchors: window.getAnchors, computeGate: window.computeGate,
    evaluateExpr: window.evaluateExpr, exprToString: window.exprToString, generateQuestion: window.generateQuestion,
    hasSelfComparison: window.hasSelfComparison, planSteps: window.planSteps, buildPalette: window.buildPalette,
    startQuiz: window.startQuiz, goHome: window.goHome
  };

  function box(color, w, h, label, n, pins) {
    var ys = n === 3 ? [12, 31, 50] : [16, 34];
    var s = '<rect x="10" y="4" width="' + (w - 20) + '" height="' + (h - 8) + '" rx="6" fill="#1d2128" stroke="' + color + '" stroke-width="2"/>' +
      '<text x="' + (w / 2) + '" y="' + (h / 2 + 4) + '" text-anchor="middle" font-size="11" font-family="sans-serif" fill="' + color + '">' + label + '</text>';
    ys.forEach(function (y, i) {
      s += '<line x1="0" y1="' + y + '" x2="10" y2="' + y + '" stroke="' + color + '" stroke-width="1.5"/>';
      if (pins) s += '<text x="13" y="' + (y + 3) + '" font-size="8" font-family="sans-serif" fill="' + color + '">' + pins[i] + '</text>';
    });
    return s + '<line x1="' + (w - 10) + '" y1="' + (h / 2) + '" x2="' + w + '" y2="' + (h / 2) + '" stroke="' + color + '" stroke-width="1.5"/>';
  }
  window.gateShape = function (type, color) {
    if (type === 'BUFFER') return '<path d="M8 5 L48 20 L8 35 Z" fill="#1d2128" stroke="' + color + '" stroke-width="2"/>' +
      '<line x1="0" y1="20" x2="8" y2="20" stroke="' + color + '" stroke-width="1.5"/><line x1="48" y1="20" x2="60" y2="20" stroke="' + color + '" stroke-width="1.5"/>';
    if (type === 'XNOR') return '<path d="M13 8 Q23 8 38 8 Q58 8 61 25 Q58 42 38 42 Q23 42 13 42 Q21 30 21 25 Q21 20 13 8 Z" fill="#1d2128" stroke="' + color + '" stroke-width="2"/>' +
      '<path d="M8 8 Q16 25 8 42" fill="none" stroke="' + color + '" stroke-width="2"/><circle cx="65" cy="25" r="4" fill="#1d2128" stroke="' + color + '" stroke-width="2"/>' +
      '<line x1="0" y1="16" x2="16" y2="16" stroke="' + color + '" stroke-width="1.5"/><line x1="0" y1="34" x2="16" y2="34" stroke="' + color + '" stroke-width="1.5"/>' +
      '<line x1="69" y1="25" x2="78" y2="25" stroke="' + color + '" stroke-width="1.5"/>';
    if (type === 'IMPLY') return box(color, 76, 50, 'IMPLY', 2, ['A', 'B']);
    if (type === 'INHIBIT') return box(color, 76, 50, 'INHIBIT', 2, ['A', 'B']);
    if (type === 'MAJORITY') return box(color, 76, 62, 'MAJ', 3, ['A', 'B', 'C']);
    if (type === 'MUX') return box(color, 76, 62, 'MUX', 3, ['A', 'B', 'C']);
    return orig.gateShape(type, color);
  };
  window.getAnchors = function (type) {
    if (type === 'BUFFER') return { inputs: [{ x: 0, y: 20 }], output: { x: 60, y: 20 } };
    if (type === 'XNOR') return { inputs: [{ x: 0, y: 16 }, { x: 0, y: 34 }], output: { x: 78, y: 25 } };
    if (type === 'IMPLY' || type === 'INHIBIT') return { inputs: [{ x: 0, y: 16 }, { x: 0, y: 34 }], output: { x: 76, y: 25 } };
    if (type === 'MAJORITY' || type === 'MUX') return { inputs: [{ x: 0, y: 12 }, { x: 0, y: 31 }, { x: 0, y: 50 }], output: { x: 76, y: 31 } };
    return orig.getAnchors(type);
  };
  function gate(type, v) {
    var a = v[0], b = v[1], c = v[2];
    switch (type) {
      case 'BUFFER': return !!a;
      case 'NOT': return !a;
      case 'AND': return a && b;
      case 'OR': return a || b;
      case 'NAND': return !(a && b);
      case 'NOR': return !(a || b);
      case 'XOR': return a !== b;
      case 'XNOR': return a === b;
      case 'IMPLY': return !a || b;
      case 'INHIBIT': return a && !b;
      case 'MAJORITY': return (a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0) >= 2;
      case 'MUX': return c ? b : a;
    }
  }
  window.computeGate = function (type, inputs) { return gate(type, inputs.map(Boolean)); };
  function kids(e) { return e.args ? e.args : e.child ? [e.child] : e.left ? [e.left, e.right] : []; }
  window.evaluateExpr = function (expr, vals) {
    if (!ADV) return orig.evaluateExpr(expr, vals);
    if (expr.op === 'VAR') return vals[expr.name];
    return gate(expr.op, kids(expr).map(function (k) { return !!window.evaluateExpr(k, vals); }));
  };
  window.exprToString = function (expr, topLevel) {
    if (!ADV) return orig.exprToString(expr, topLevel);
    if (topLevel === undefined) topLevel = true;
    if (expr.op === 'VAR') return expr.name;
    if (expr.args) return expr.op + '(' + expr.args.map(function (k) { return window.exprToString(k, true); }).join(', ') + ')';
    if (expr.child) return expr.op + ' ' + window.exprToString(expr.child, false);
    var s = window.exprToString(expr.left, false) + ' ' + expr.op + ' ' + window.exprToString(expr.right, false);
    return topLevel ? s : '(' + s + ')';
  };
  window.hasSelfComparison = function (expr) {
    if (!ADV) return orig.hasSelfComparison(expr);
    if (!expr || expr.op === 'VAR') return false;
    var k = kids(expr), names = k.filter(function (x) { return x.op === 'VAR'; }).map(function (x) { return x.name; });
    if (names.length !== new Set(names).size) return true;
    return k.some(window.hasSelfComparison);
  };
  window.planSteps = function (expr) {
    if (!ADV) return orig.planSteps(expr);
    var steps = [];
    (function walk(node) {
      if (node.op === 'VAR') return node.name;
      var ins = kids(node).map(walk);
      steps.push({ node: node, op: node.op, ins: ins });
      return '(' + steps.length + ')';
    })(expr);
    return steps;
  };
  // A random expression using every kind of gate; difficulty grows with the score.
  window.generateQuestion = function (numInputs, difficulty) {
    if (!ADV) return orig.generateQuestion(numInputs, difficulty);
    var inputs = INPUTS_LABELS.slice(0, numInputs);
    function leaf() { return leafNode(pick(inputs)); }
    function make(depth) {
      if (depth <= 0) return leaf();
      var r = Math.random(), op;
      if (r < 0.2) { op = pick(UN); return { op: op, child: make(depth - 1) }; }
      if (r < 0.45 && numInputs >= 3) { op = pick(TRI); return { op: op, args: [make(depth - 1), make(depth - 1), make(depth - 1)] }; }
      op = pick(BIN);
      return exprNode(op, make(depth - 1), make(depth - 1));
    }
    var depth = difficulty < 2 ? 1 : difficulty < 5 ? 2 : 3;
    for (var k = 0; k < 200; k++) {
      var e = make(depth);
      if (e.op === 'VAR') continue;
      if (difficulty < 2 && e.child && e.child.op !== 'VAR') continue;
      if (window.hasSelfComparison(e)) continue;
      return { expr: e, inputs: inputs };
    }
    return { expr: exprNode(pick(BIN), leafNode(inputs[0]), leafNode(inputs[1])), inputs: inputs };
  };
  window.buildPalette = function () {
    orig.buildPalette();
    var pal = document.getElementById('palette');
    var label = pal.querySelector('.palette-label');
    Array.prototype.forEach.call(pal.querySelectorAll('.palette-gate'), function (div, i) {
      var cap = document.createElement('div');
      cap.className = 'palette-gate-name';
      cap.style.cssText = 'font-size:0.65rem;letter-spacing:0.05em;text-align:center;opacity:0.85';
      cap.textContent = Object.keys(GATE_DEFS)[i];
      div.appendChild(cap);
    });
    var old = document.getElementById('adv-rules');
    if (old) old.remove();
    if (!ADV) return;
    var d = document.createElement('details');
    d.id = 'adv-rules';
    d.open = true;
    d.style.cssText = 'margin-top:8px;font-size:0.72rem;line-height:1.35';
    d.innerHTML = '<summary style="cursor:pointer">Gate rules</summary>' + RULES.map(function (r) { return '<div><b>' + r[0] + '</b>: ' + r[1] + '</div>'; }).join('');
    pal.appendChild(d);
    void label;
  };
  function setMode(on) {
    ADV = on;
    Object.keys(EXTRA).forEach(function (t) { if (on) GATE_DEFS[t] = EXTRA[t]; else delete GATE_DEFS[t]; });
  }
  window.startQuiz = function () { setMode(false); orig.startQuiz(); };
  window.startAdvanced = function () {
    setMode(true);
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('app-header').style.display = '';
    document.getElementById('app-main').style.display = '';
    state.numInputs = 3;
    var iv = document.getElementById('inputs-val');
    if (iv) iv.textContent = 3;
    init();
  };
  window.goHome = function () { orig.goHome(); setMode(false); };

  var menuBtn = document.querySelector('#main-menu .menu-btn-primary');
  if (menuBtn) {
    var b = document.createElement('button');
    b.className = 'menu-btn menu-btn-secondary';
    b.textContent = 'Advanced Mode (all gates)';
    b.addEventListener('click', window.startAdvanced);
    menuBtn.insertAdjacentElement('afterend', b);
  }
  if (new URLSearchParams(location.search).get('mode') === 'advanced') window.addEventListener('load', window.startAdvanced);
})();
