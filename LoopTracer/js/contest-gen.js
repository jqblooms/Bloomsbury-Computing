// ACSL Contest 2 question generators, original questions in the ACSL style: prefix, infix and postfix notation,
// bit-string flicking, and What Does This Program Do (loops). Every answer is worked out in code.
// Used by Loop Tracer's Mock Contest and copied by tools/build_acsl_c2_contest.mjs into the acsl-c2-mock and
// acsl-c2-contest-ext drills, so it must stay a plain script that needs only ACSLPseudo and ACSLLoops.
//   ACSLGen.question(kind) -> { kind, topic, prompt, code, answer, keyword (RegExp), accept(typed), distractors,
//                               why: [lines], example, working: [two nudges] }
// Kinds: 'prefix-eval', 'postfix-eval', 'to-postfix', 'to-prefix', 'bits-eval', 'bits-solve', 'loop'.
var ACSLGen = (function () {
  'use strict';
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var UP = '↑';

  // ================================================================== notation
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  var SHOW = { '+': '+', '-': '-', '*': '*', '/': '/', '^': UP };
  function leaf(v) { return { leaf: String(v) }; }
  function node(op, l, r) { return { op: op, l: l, r: r }; }
  // A random tree shape with n operators.
  function shape(n) {
    if (n === 0) return { leaf: '?' };
    var left = R(0, n - 1);
    return { op: '?', l: shape(left), r: shape(n - 1 - left) };
  }
  function leaves(t, out) { out = out || []; if (t.leaf != null) out.push(t); else { leaves(t.l, out); leaves(t.r, out); } return out; }
  function opsOf(t, out) { out = out || []; if (t.leaf == null) { opsOf(t.l, out); out.push(t); opsOf(t.r, out); } return out; }
  function clone(t) { return t.leaf != null ? { leaf: t.leaf } : { op: t.op, l: clone(t.l), r: clone(t.r) }; }

  function value(t, swap) {
    if (t.leaf != null) return Number(t.leaf);
    var a = value(t.l, swap), b = value(t.r, swap);
    if (a === null || b === null) return null;
    if (swap && (t.op === '-' || t.op === '/')) { var x = a; a = b; b = x; }
    switch (t.op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 && a % b === 0 ? a / b : null;
      case '^': return Math.pow(a, b);
    }
    return null;
  }
  function postfix(t) { return t.leaf != null ? t.leaf : postfix(t.l) + ' ' + postfix(t.r) + ' ' + SHOW[t.op]; }
  function prefix(t) { return t.leaf != null ? t.leaf : SHOW[t.op] + ' ' + prefix(t.l) + ' ' + prefix(t.r); }
  // Infix with only the brackets it needs. implied: 3(a + b) and 2b for a digit times a letter or a bracket.
  function infix(t, implied) {
    if (t.leaf != null) return t.leaf;
    var L = infix(t.l, implied), Rt = infix(t.r, implied);
    var p = PREC[t.op];
    var needL = t.l.op && (PREC[t.l.op] < p || (PREC[t.l.op] === p && t.op === '^'));
    var needR = t.r.op && (PREC[t.r.op] < p || (PREC[t.r.op] === p && t.op !== '^'));
    if (needL) L = '(' + L + ')';
    if (needR) Rt = '(' + Rt + ')';
    if (implied && t.op === '*' && t.l.leaf != null && /^\d$/.test(t.l.leaf) && ((t.r.leaf != null && /^[a-z]$/.test(t.r.leaf)) || needR)) return L + Rt;
    return L + ' ' + SHOW[t.op] + ' ' + Rt;
  }
  function fullBrackets(t) { return t.leaf != null ? t.leaf : '(' + fullBrackets(t.l) + ' ' + SHOW[t.op] + ' ' + fullBrackets(t.r) + ')'; }
  // Reads infix with every operator at the same level, left to right: the slip of ignoring precedence.
  function flatTree(t) {
    var toks = [];
    (function walk(n, top) {
      if (n.leaf != null) { toks.push(n.leaf); return; }
      var p = PREC[n.op];
      var needL = n.l.op && (PREC[n.l.op] < p || (PREC[n.l.op] === p && n.op === '^'));
      var needR = n.r.op && (PREC[n.r.op] < p || (PREC[n.r.op] === p && n.op !== '^'));
      if (needL) toks.push('('); walk(n.l); if (needL) toks.push(')');
      toks.push(n.op);
      if (needR) toks.push('('); walk(n.r); if (needR) toks.push(')');
    })(t, true);
    var i = 0;
    function atom() { var x = toks[i++]; if (x === '(') { var e = expr(); i++; return e; } return { leaf: x }; }
    function expr() { var l = atom(); while (i < toks.length && toks[i] !== ')') { var op = toks[i++]; l = node(op, l, atom()); } return l; }
    return expr();
  }

  // A number tree whose value is a whole number, every step small.
  function numberTree(nOps) {
    for (var tries = 0; tries < 2000; tries++) {
      var t = shape(nOps);
      var ok = true;
      opsOf(t).forEach(function (o) { o.op = pick(['+', '-', '*', '*', '/', '/', '+', '-', '^']); });
      leaves(t).forEach(function (l) { l.leaf = String(R(1, 9)); });
      (function check(n) {
        if (!ok || n.leaf != null) return;
        check(n.l); check(n.r);
        if (n.op === '^') { if (n.r.leaf == null || ['2', '3'].indexOf(n.r.leaf) < 0) { ok = false; return; } }
        var v = value(n);
        if (v === null || Math.abs(v) > 200 || (n.op === '^' && Math.abs(value(n.l)) > 6)) ok = false;
      })(t);
      if (!ok) continue;
      if (opsOf(t).filter(function (o) { return o.op === '^'; }).length > 1) continue;
      var v = value(t);
      if (v === null || v === 0 || Math.abs(v) > 120) continue;
      return t;
    }
    throw new Error('numberTree');
  }
  function letterTree(nOps, implied) {
    for (var tries = 0; tries < 500; tries++) {
      var t = shape(nOps);
      opsOf(t).forEach(function (o) { o.op = pick(['+', '-', '*', '*', '/', '+', '-', '^']); });
      var letters = ['a', 'b', 'c', 'd', 'e'], li = 0;
      leaves(t).forEach(function (l) { l.leaf = Math.random() < 0.25 ? String(R(2, 5)) : letters[li++ % 5]; });
      if (opsOf(t).filter(function (o) { return o.op === '^'; }).length > 1) continue;
      if (implied) {
        // Put a digit in front of a letter or a bracket somewhere, so the infix has implied multiplication.
        var cands = opsOf(t).filter(function (o) { return o.op === '*' && o.l.leaf != null; });
        if (!cands.length) continue;
        cands[0].l.leaf = String(R(2, 5));
        if (infix(t, true) === infix(t, false)) continue;
      }
      if (leaves(t).every(function (l) { return /\d/.test(l.leaf); })) continue;
      var text = infix(t, implied);
      if (text.indexOf('(') < 0 && Math.random() < 0.6) continue;   // most questions have brackets
      return t;
    }
    throw new Error('letterTree');
  }
  function numRe(n) { return new RegExp('^\\s*' + (n < 0 ? '[-−]\\s*' : '') + esc(Math.abs(n)) + '\\s*$'); }
  function others(ans, list) {
    var out = [];
    list.concat([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, -ans]).forEach(function (x) {
      if (x === null || x === undefined || !isFinite(x) || x === ans || out.indexOf(String(x)) !== -1 || out.length >= 3) return;
      out.push(String(x));
    });
    return out;
  }
  // ACSL's method for prefix: find an operator followed by two numbers, work it out, repeat.
  function prefixSteps(t) {
    var toks = prefix(t).split(' '), steps = [toks.join(' ')];
    var ops = { '+': 1, '-': 1, '*': 1, '/': 1 }; ops[UP] = 1;
    while (toks.length > 1) {
      for (var i = 0; i + 2 < toks.length; i++) {
        if (ops[toks[i]] && !ops[toks[i + 1]] && !ops[toks[i + 2]]) {
          var a = Number(toks[i + 1]), b = Number(toks[i + 2]);
          var v = toks[i] === '+' ? a + b : toks[i] === '-' ? a - b : toks[i] === '*' ? a * b : toks[i] === '/' ? a / b : Math.pow(a, b);
          toks.splice(i, 3, String(v));
          steps.push(toks.join(' '));
          break;
        }
      }
    }
    return steps;
  }
  // The stack method for postfix: numbers go on the stack; an operator takes the top two.
  function postfixSteps(t) {
    var toks = postfix(t).split(' '), stack = [], steps = [];
    toks.forEach(function (x) {
      if (/^\d+$/.test(x)) { stack.push(Number(x)); return; }
      var b = stack.pop(), a = stack.pop();
      var v = x === '+' ? a + b : x === '-' ? a - b : x === '*' ? a * b : x === '/' ? a / b : Math.pow(a, b);
      stack.push(v);
      steps.push(a + ' ' + x + ' ' + b + ' = ' + v + '   stack: ' + stack.join(' '));
    });
    return steps;
  }

  function evalQuestion(kind) {
    var t = numberTree(R(4, 5)), ans = value(t), isPre = kind === 'prefix-eval';
    var text = isPre ? prefix(t) : postfix(t);
    var swapped = value(t, true);
    var ex;
    do { ex = numberTree(3); } while (value(ex) === ans || String(isPre ? prefix(ex) : postfix(ex)) === text);
    var exSteps = isPre ? prefixSteps(ex) : postfixSteps(ex);
    return {
      kind: kind, topic: 'notation',
      prompt: 'Evaluate this ' + (isPre ? 'prefix' : 'postfix') + ' expression.',
      code: text, answer: String(ans), keyword: numRe(ans),
      accept: function (s) { return numRe(ans).test(String(s)); },
      distractors: others(ans, [swapped, value(flatTree(t))]),
      why: isPre ? prefixSteps(t) : postfixSteps(t),
      example: 'Example: ' + (isPre ? prefix(ex) : postfix(ex)) + '\n' + (isPre
        ? 'Find an operator followed by two numbers. Work it out and put the answer in its place. Repeat.\n'
        : 'Read left to right. Push each number. An operator takes the top two numbers: the lower one goes first.\n') +
        exSteps.join('\n') + '\nSo the example is ' + value(ex) + '.',
      working: isPre
        ? ['Look for an operator with two numbers straight after it.', 'Replace those three with the answer, then look again.']
        : ['Use a stack: push each number as you read it.', 'An operator takes the top two numbers. The one pushed first goes on the left.']
    };
  }
  function strRe(s) {
    return new RegExp('^\\s*' + s.replace(/\s+/g, '').split('').map(function (ch) { return ch === UP ? '(\\^|' + UP + ')' : esc(ch); }).join('\\s*') + '\\s*$', 'i');
  }
  function convertQuestion(kind) {
    var implied = Math.random() < 0.35, t = letterTree(R(3, 4), implied), toPost = kind === 'to-postfix';
    var conv = toPost ? postfix : prefix;
    var ans = conv(t);
    var wrong = [];
    var flat = flatTree(t);
    [conv(flat), (toPost ? prefix : postfix)(t), conv(node(t.op, t.r, t.l)),
      leaves(t).map(function (l) { return l.leaf; }).join(' ') + ' ' + opsOf(t).map(function (o) { return SHOW[o.op]; }).join(' ')].forEach(function (w) {
      var k = w.replace(/\s+/g, '');
      if (k !== ans.replace(/\s+/g, '') && wrong.every(function (x) { return x.replace(/\s+/g, '') !== k; }) && wrong.length < 3) wrong.push(w);
    });
    var ex;
    do { ex = letterTree(2, false); } while (conv(ex).replace(/\s/g, '') === ans.replace(/\s/g, ''));
    return {
      kind: kind, topic: 'notation',
      prompt: 'Write this infix expression in ' + (toPost ? 'postfix' : 'prefix') + '.',
      code: infix(t, implied), answer: ans, keyword: strRe(ans),
      accept: function (s) { return strRe(ans).test(String(s)); },
      distractors: wrong,
      why: ['Brackets round every operation: ' + fullBrackets(t), 'Move each operator ' + (toPost ? 'after' : 'before') + ' its two operands, inside out: ' + ans],
      example: 'Example: ' + infix(ex, false) + '\nPut brackets round every operation, in the order they are worked out: ' + fullBrackets(ex) +
        '\nThen move each operator ' + (toPost ? 'to just after' : 'to just before') + ' its two operands, starting with the inside brackets.\nSo the example is ' + conv(ex) + '.',
      working: ['Put brackets round every operation, in the order the rules work them out.' + (implied ? ' A number next to a letter or a bracket means multiply.' : ''),
        'Start with the inside brackets. Move each operator ' + (toPost ? 'after' : 'before') + ' its two operands.']
    };
  }

  // ================================================================== bit strings
  var BITS = 5;
  function rb(n) { var s = ''; for (var i = 0; i < (n || BITS); i++) s += R(0, 1); return s; }
  function bnot(a) { return a.replace(/./g, function (c) { return c === '1' ? '0' : '1'; }); }
  function band(a, b) { var s = ''; for (var i = 0; i < a.length; i++) s += a[i] === '1' && b[i] === '1' ? '1' : '0'; return s; }
  function bor(a, b) { var s = ''; for (var i = 0; i < a.length; i++) s += a[i] === '1' || b[i] === '1' ? '1' : '0'; return s; }
  function bxor(a, b) { var s = ''; for (var i = 0; i < a.length; i++) s += a[i] !== b[i] ? '1' : '0'; return s; }
  function shift(op, k, a) {
    var n = a.length; k = k % (n + 1);
    if (op === 'LSHIFT') return (a + '0'.repeat(k)).slice(k);
    if (op === 'RSHIFT') return ('0'.repeat(k) + a).slice(0, n);
    k = k % n;
    if (op === 'LCIRC') return a.slice(k) + a.slice(0, k);
    return a.slice(n - k) + a.slice(0, n - k);
  }
  var BPREC = { AND: 3, XOR: 2, OR: 1 };
  // A bit tree: { lit } | { x: true } | { un: 'NOT' | 'LSHIFT' ..., k, a } | { bin: 'AND' | 'XOR' | 'OR', l, r }.
  function bval(t, x) {
    if (t.lit != null) return t.lit;
    if (t.x) return x;
    if (t.un === 'NOT') return bnot(bval(t.a, x));
    if (t.un) return shift(t.un, t.k, bval(t.a, x));
    var a = bval(t.l, x), b = bval(t.r, x);
    return t.bin === 'AND' ? band(a, b) : t.bin === 'OR' ? bor(a, b) : bxor(a, b);
  }
  function bshow(t, prec) {
    prec = prec || BPREC;
    if (t.lit != null) return t.lit;
    if (t.x) return 'x';
    if (t.un) {
      var inner = bshow(t.a, prec);
      if (t.a.bin) inner = '(' + inner + ')';
      return (t.un === 'NOT' ? 'NOT' : t.un + '-' + t.k) + ' ' + inner;
    }
    var p = prec[t.bin];
    var L = bshow(t.l, prec), Rt = bshow(t.r, prec);
    if (t.l.bin && prec[t.l.bin] < p) L = '(' + L + ')';
    if (t.r.bin && prec[t.r.bin] <= p) Rt = '(' + Rt + ')';
    return L + ' ' + t.bin + ' ' + Rt;
  }
  // Parses a bit-string expression with a precedence table: the real one, or every binary operator equal.
  function bparse(text, prec) {
    var toks = text.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim().split(/\s+/), i = 0;
    function unary() {
      var t = toks[i];
      if (t === 'NOT') { i++; return { un: 'NOT', a: unary() }; }
      var m = /^(LSHIFT|RSHIFT|LCIRC|RCIRC)-(\d)$/.exec(t || '');
      if (m) { i++; return { un: m[1], k: Number(m[2]), a: unary() }; }
      if (t === '(') { i++; var e = expr(1); i++; return e; }
      i++;
      return t === 'x' ? { x: true } : { lit: t };
    }
    function expr(min) {
      var l = unary();
      while (i < toks.length && prec[toks[i]] && prec[toks[i]] >= min) { var op = toks[i++]; l = { bin: op, l: l, r: expr(prec[op] + 1) }; }
      return l;
    }
    return expr(1);
  }
  function randomUnary(a, depth) {
    var t = a;
    for (var d = 0; d < depth; d++) {
      var un = pick(['NOT', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC', 'LCIRC', 'RSHIFT']);
      t = un === 'NOT' ? { un: 'NOT', a: t } : { un: un, k: R(1, 3), a: t };
    }
    return t;
  }
  function bitsEvalQuestion() {
    for (var tries = 0; tries < 500; tries++) {
      var n = R(2, 3), t = randomUnary({ lit: rb() }, R(0, 2));
      for (var j = 1; j < n; j++) {
        var right = randomUnary({ lit: rb() }, R(0, 1));
        t = Math.random() < 0.5 ? { bin: pick(['AND', 'XOR', 'OR']), l: t, r: right } : { bin: pick(['AND', 'XOR', 'OR']), l: right, r: t };
      }
      if (Math.random() < 0.25) t = { un: 'NOT', a: t };
      var text = bshow(t), ans = bval(bparse(text, BPREC));
      if (ans !== bval(t)) continue;
      var unCount = (text.match(/NOT|SHIFT|CIRC/g) || []).length;
      if (unCount < 2) continue;
      var flat = bval(bparse(text, { AND: 1, XOR: 1, OR: 1 }));
      var swapText = text.replace(/LSHIFT|RSHIFT|LCIRC|RCIRC/, function (m) { return { LSHIFT: 'LCIRC', RSHIFT: 'RCIRC', LCIRC: 'LSHIFT', RCIRC: 'RSHIFT' }[m]; });
      var wrong = [];
      [flat, bval(bparse(swapText, BPREC)), bnot(ans), ans.slice(0, 2) + bnot(ans.slice(2, 3)) + ans.slice(3), bnot(ans.slice(0, 1)) + ans.slice(1)].forEach(function (w) {
        if (w !== ans && wrong.indexOf(w) < 0 && wrong.length < 3) wrong.push(w);
      });
      var steps = [];
      (function walk(n2) {
        if (n2.lit != null) return n2.lit;
        if (n2.un) { var a = walk(n2.a), v = bval(n2); steps.push((n2.un === 'NOT' ? 'NOT' : n2.un + '-' + n2.k) + ' ' + a + ' = ' + v); return v; }
        var l = walk(n2.l), r = walk(n2.r), v2 = bval(n2);
        steps.push(l + ' ' + n2.bin + ' ' + r + ' = ' + v2);
        return v2;
      })(bparse(text, BPREC));
      var exT, exText;
      do { exT = { bin: pick(['AND', 'OR', 'XOR']), l: randomUnary({ lit: rb() }, 1), r: { lit: rb() } }; exText = bshow(exT); } while (bval(exT) === ans || /^0+$|^1+$/.test(bval(exT)) || /\b(00000|11111)\b/.test(exText));
      var exSteps = [];
      (function walk(n2) {
        if (n2.lit != null) return n2.lit;
        if (n2.un) { var a = walk(n2.a), v = bval(n2); exSteps.push((n2.un === 'NOT' ? 'NOT' : n2.un + '-' + n2.k) + ' ' + a + ' = ' + v); return v; }
        var l = walk(n2.l), r = walk(n2.r), v2 = bval(n2);
        exSteps.push(l + ' ' + n2.bin + ' ' + r + ' = ' + v2);
        return v2;
      })(exT);
      return {
        kind: 'bits-eval', topic: 'bits',
        prompt: 'Evaluate this bit-string expression.',
        code: text, answer: ans, keyword: new RegExp('^\\s*' + ans + '\\s*$'),
        accept: function (s) { return String(s).replace(/\s+/g, '') === ans; },
        distractors: wrong,
        why: steps,
        example: 'Example: ' + exText + '\nNOT, shifts and circulates first, then AND, then XOR, then OR.\n' + exSteps.join('\n') + '\nSo the example is ' + bval(exT) + '.',
        working: ['Do NOT, the shifts and the circulates first. Then AND, then XOR, then OR.', 'Write each step as a new 5-bit string. A shift keeps 5 bits: zeros come in.']
      };
    }
    throw new Error('bitsEval');
  }
  function bitsSolveQuestion() {
    for (var tries = 0; tries < 500; tries++) {
      var form = R(0, 2), t;
      var x = { x: true };
      if (form === 0) t = randomUnary(x, R(1, 2));
      else t = { bin: pick(['AND', 'OR', 'XOR']), l: randomUnary(x, R(0, 1)), r: { lit: rb() } };
      if (form === 2) t = { bin: pick(['AND', 'OR']), l: randomUnary(x, 1), r: { lit: rb() } };
      var x0 = rb(), target = bval(t, x0), sols = [];
      for (var v = 0; v < 32; v++) { var s = ('00000' + v.toString(2)).slice(-5); if (bval(t, s) === target) sols.push(s); }
      var pat = '';
      for (var i = 0; i < BITS; i++) pat += sols.every(function (s) { return s[i] === sols[0][i]; }) ? sols[0][i] : '*';
      var stars = (pat.match(/\*/g) || []).length;
      if (sols.length !== Math.pow(2, stars) || stars > 3) continue;
      var text = bshow(t) + ' = ' + target;
      if (stars === 0 && Math.random() < 0.5) continue;   // mostly questions with a * in the answer
      var wrong = [];
      [pat.replace(/\*/g, '0'), pat.replace(/\*/g, '1'), target, bnot(pat.replace(/\*/g, '0')).replace(/./g, function (c, j) { return pat[j] === '*' ? '*' : c; }),
        pat.indexOf('*') > 0 ? '*' + pat.slice(0, 4) : pat.slice(1) + '*'].forEach(function (w) {
        if (w !== pat && wrong.indexOf(w) < 0 && wrong.length < 3) wrong.push(w);
      });
      var exT, exTarget, exPat;
      do {
        exT = { bin: 'AND', l: { x: true }, r: { lit: rb() } };
        exTarget = bval(exT, rb());
        exPat = exT.r.lit.replace(/./g, function (c, j) { return c === '1' ? exTarget[j] : '*'; });
      } while (exPat === pat || exT.r.lit.indexOf('0') < 0);
      return {
        kind: 'bits-solve', topic: 'bits',
        prompt: 'Find all 5-bit values of x that make this true. Use * for a bit that can be 0 or 1.',
        code: text, answer: pat, keyword: new RegExp('^\\s*' + pat.split('').map(function (c) { return c === '*' ? '\\*' : c; }).join('\\s*') + '\\s*$'),
        accept: function (s) { return String(s).replace(/\s+/g, '') === pat; },
        distractors: wrong,
        why: ['Work back from the answer one bit at a time.', 'Every value that works: ' + sols.join(', '), 'So x = ' + pat],
        example: 'Example: x AND ' + exT.r.lit + ' = ' + exTarget + '\nWhere the mask has a 1, the bit of x must equal the answer bit.\nWhere the mask has a 0, the answer is 0 whatever x is, so that bit is *.\nSo x = ' + exPat + '.',
        working: ['Undo the operations one at a time, from the outside in.', 'A bit that a shift pushes out, or an AND with 0 hides, can be anything: write *.']
      };
    }
    throw new Error('bitsSolve');
  }

  // ================================================================== loops
  // Plausible slips: a bound one out, < for <=, a total that starts at 1. Each is run, so the wrong answers are real.
  function slips(lines) {
    var out = [];
    lines.forEach(function (l, i) {
      var m;
      var vars = [];
      if ((m = /^(\s*FOR \w+ = .+ TO )(\d+)(.*)$/.exec(l))) vars.push(m[1] + (Number(m[2]) - 1) + m[3], m[1] + (Number(m[2]) + 1) + m[3]);
      if ((m = /^(\s*WHILE .*?)(<=|>=|<|>)(.*)$/.exec(l))) vars.push(m[1] + { '<': '<=', '<=': '<', '>': '>=', '>=': '>' }[m[2]] + m[3]);
      if (/^\w = 0\b/.test(l)) vars.push(l.replace(/^(\w) = 0/, '$1 = 1'));
      vars.forEach(function (v) { var c = lines.slice(); c[i] = v; out.push(c); });
    });
    return out;
  }
  function loopQuestion(level) {
    var p = ACSLLoops.make(level || pick([4, 5, 6]));
    var ans = p.output;
    var wrong = [];
    slips(p.lines).forEach(function (ls) {
      var r = ACSLPseudo.run(ls.join('\n'), { maxSteps: 50000 });
      if (!r.error && r.outputs.length === 1 && (/^-?[0-9]+$/.test(r.outputs[0]) || !/^-?[0-9]+$/.test(ans)) && r.outputs[0] !== ans && wrong.indexOf(r.outputs[0]) < 0 && wrong.length < 3) wrong.push(r.outputs[0]);
    });
    var n = Number(ans);
    if (isFinite(n)) [n + 1, n - 1, n + 2, n * 2].forEach(function (x) { if (wrong.length < 3 && String(x) !== ans && wrong.indexOf(String(x)) < 0) wrong.push(String(x)); });
    var ex;
    do { ex = ACSLLoops.make(pick([1, 2]), { maxRows: 12 }); } while (ex.output === ans);
    var final = Object.keys(ACSLPseudo.run(p.src).vars);
    var vals = ACSLPseudo.run(p.src).vars;
    return {
      kind: 'loop', topic: 'loops', skill: p.skill,
      prompt: 'What is output by this program?',
      code: p.src, answer: ans, keyword: isFinite(n) ? numRe(n) : new RegExp('^\\s*' + esc(ans) + '\\s*$', 'i'),
      accept: function (s) { return isFinite(n) ? numRe(n).test(String(s)) : String(s).trim().toLowerCase() === ans.toLowerCase(); },
      distractors: wrong,
      why: ['At the end: ' + final.map(function (k) { return k + ' = ' + ACSLPseudo.format(vals[k]); }).join(', '), 'Output: ' + ans],
      example: 'Example:\n' + ex.src + '\nTrace it: write each new value in a table.\n' +
        ex.rows.map(function (r) { return r.name === 'OUTPUT' ? 'output ' + r.value : r.name + ' = ' + (r.value === '' ? '""' : r.value); }).join(', ') + '\nSo the example outputs ' + ex.output + '.',
      working: ['Write the variables as columns. Add a row each time one changes.', p.level >= 6 ? 'Is it a pattern? A long sum, or a count of factors or multiples, can be worked out without every row.' : 'Follow the loop exactly: check the condition or the end value before every turn.']
    };
  }

  function question(kind) {
    for (var tries = 0; tries < 60; tries++) {
      var q = make(kind), ex = String(q.example).toLowerCase(), a = q.answer.toLowerCase();
      var whole = new RegExp('(^|[^a-z0-9*])' + esc(a) + '($|[^a-z0-9*])');
      var long = (q.prompt + '\n' + q.code).split('\n').filter(function (l) { return l.trim().length > 12 && ex.indexOf(l.trim().toLowerCase()) >= 0; });
      if (whole.test(ex) || long.length >= 2) continue;
      return q;
    }
    throw new Error('No clean question for ' + kind);
  }
  function make(kind) {
    if (kind === 'prefix-eval' || kind === 'postfix-eval') return evalQuestion(kind);
    if (kind === 'to-postfix' || kind === 'to-prefix') return convertQuestion(kind);
    if (kind === 'bits-eval') return bitsEvalQuestion();
    if (kind === 'bits-solve') return bitsSolveQuestion();
    if (kind === 'loop') return loopQuestion();
    if (/^loop-[1-6]$/.test(kind)) return loopQuestion(Number(kind.slice(5)));
    throw new Error('Unknown question kind ' + kind);
  }
  // A mock contest: 2 notation, 2 bit strings, 1 loop program, in that order.
  function mock() {
    return [question(pick(['prefix-eval', 'postfix-eval'])), question(pick(['to-postfix', 'to-prefix'])), question('bits-eval'), question('bits-solve'), question('loop')];
  }

  return { question: question, mock: mock, loopQuestion: loopQuestion,
    notation: { numberTree: numberTree, letterTree: letterTree, infix: infix, prefix: prefix, postfix: postfix, value: value, fullBrackets: fullBrackets, prefixSteps: prefixSteps, postfixSteps: postfixSteps },
    bits: { parse: bparse, value: bval, show: bshow, shift: shift, PREC: BPREC } };
})();
