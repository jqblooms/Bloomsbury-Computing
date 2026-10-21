// Bit-string flicking (ACSL): parse, evaluate, trace and solve. Used by BitFlicker and copied into the acsl-c2-bits
// drills by tools/build_acsl_c2_bits.mjs, so it must stay plain ES5 with no DOM.
// Operators: NOT, LSHIFT-n, RSHIFT-n, LCIRC-n, RCIRC-n (unary, prefix, applied right to left), then AND, XOR, OR.
// Precedence, highest first: NOT; SHIFT and CIRC; AND; XOR; OR. Equal binary operators go left to right.
// A shorter operand of AND, XOR or OR is padded with zeros on the left. Shifts, circulates and NOT keep the length.
var BitCore = (function () {
  'use strict';
  var BIN = { AND: 3, XOR: 2, OR: 1 };
  var SHIFT_RE = /^(LSHIFT|RSHIFT|LCIRC|RCIRC)-(\d+)$/;

  function tokenize(src) {
    var out = [], re = /\s*(\(|\)|[A-Za-z]+-\d+|[A-Za-z]+|[01]+)\s*/g, m, at = 0;
    src = String(src);
    while (at < src.length) {
      re.lastIndex = at;
      m = re.exec(src);
      if (!m || m.index !== at) {
        if (/^\s*$/.test(src.slice(at))) break;
        throw new Error('Cannot read "' + src.slice(at, at + 8) + '"');
      }
      var t = m[1];
      if (/^[a-z]+(-\d+)?$/i.test(t) && t !== 'x') t = t.toUpperCase();
      out.push(t);
      at = re.lastIndex;
    }
    return out;
  }

  // AST nodes: {t:'bits', v}, {t:'var'}, {t:'not', a}, {t:'sh', op, n, a}, {t:'bin', op, a, b}; paren: true when the
  // source put the node in brackets.
  function parse(src) {
    var toks = tokenize(src), i = 0;
    function peek() { return toks[i]; }
    function binary(level) {
      if (level > 3) return unary();
      var left = binary(level + 1);
      while (BIN[peek()] === level) {
        var op = toks[i++];
        left = { t: 'bin', op: op, a: left, b: binary(level + 1) };
      }
      return left;
    }
    function unary() {
      var t = peek(), m;
      if (t === 'NOT') { i++; return { t: 'not', a: unary() }; }
      if (t && (m = SHIFT_RE.exec(t))) { i++; return { t: 'sh', op: m[1], n: Number(m[2]), a: unary() }; }
      return primary();
    }
    function primary() {
      var t = toks[i++];
      if (t === '(') {
        var e = binary(1);
        if (toks[i++] !== ')') throw new Error('Missing )');
        e.paren = true;
        return e;
      }
      if (t === 'x' || t === 'X') return { t: 'var' };
      if (/^[01]+$/.test(t || '')) return { t: 'bits', v: t };
      throw new Error('Unexpected ' + (t || 'end'));
    }
    var tree = binary(1);
    if (i < toks.length) throw new Error('Unexpected ' + toks[i]);
    return tree;
  }

  function pad(s, n) { while (s.length < n) s = '0' + s; return s; }
  function zeros(n) { return pad('', n); }
  function not(s) { return s.replace(/[01]/g, function (c) { return c === '1' ? '0' : '1'; }); }
  function shift(op, n, s) {
    var L = s.length, k;
    if (op === 'LSHIFT') return n >= L ? zeros(L) : s.slice(n) + zeros(n);
    if (op === 'RSHIFT') return n >= L ? zeros(L) : zeros(n) + s.slice(0, L - n);
    k = n % L;
    if (op === 'LCIRC') return s.slice(k) + s.slice(0, k);
    return s.slice(L - k) + s.slice(0, L - k);
  }
  function binop(op, a, b) {
    var L = Math.max(a.length, b.length), out = '';
    a = pad(a, L); b = pad(b, L);
    for (var i = 0; i < L; i++) {
      var p = a[i] === '1', q = b[i] === '1';
      out += (op === 'AND' ? p && q : op === 'OR' ? p || q : p !== q) ? '1' : '0';
    }
    return out;
  }
  function apply(node, a, b) {
    if (node.t === 'not') return not(a);
    if (node.t === 'sh') return shift(node.op, node.n, a);
    return binop(node.op, a, b);
  }
  function evaluate(node, x) {
    if (typeof node === 'string') node = parse(node);
    if (node.t === 'bits') return node.v;
    if (node.t === 'var') { if (x == null) throw new Error('x has no value'); return x; }
    if (node.t === 'bin') return apply(node, evaluate(node.a, x), evaluate(node.b, x));
    return apply(node, evaluate(node.a, x));
  }
  function opName(node) { return node.t === 'not' ? 'NOT' : node.t === 'sh' ? node.op + '-' + node.n : node.op; }
  function show(node) {
    var s;
    if (node.t === 'bits') s = node.v;
    else if (node.t === 'var') s = 'x';
    else if (node.t === 'bin') s = show(node.a) + ' ' + node.op + ' ' + show(node.b);
    else s = opName(node) + ' ' + show(node.a);
    return node.paren ? '(' + s + ')' : s;
  }
  // Every operation in the order it is worked: [{op, text, result}], text like "LCIRC-2 10110 = 11010".
  function trace(node, x) {
    if (typeof node === 'string') node = parse(node);
    var steps = [];
    (function walk(n) {
      if (n.t === 'bits') return n.v;
      if (n.t === 'var') return x;
      var a = walk(n.a), b = n.t === 'bin' ? walk(n.b) : null, r = apply(n, a, b);
      var text = n.t === 'bin' ? pad(a, r.length) + ' ' + n.op + ' ' + pad(b, r.length) : opName(n) + ' ' + a;
      steps.push({ op: opName(n), text: text + ' = ' + r, result: r, padded: n.t === 'bin' && a.length !== b.length });
      return r;
    })(node);
    return steps;
  }
  function allX(len) {
    var out = [];
    for (var v = 0; v < (1 << len); v++) out.push(pad(v.toString(2), len));
    return out;
  }
  // Every x of `len` bits with evaluate(lhs, x) === rhs, in counting order.
  function solve(lhs, rhs, len) {
    if (typeof lhs === 'string') lhs = parse(lhs);
    var want = typeof rhs === 'string' ? rhs : null;
    return allX(len || 5).filter(function (x) {
      var l = evaluate(lhs, x), r = want == null ? evaluate(rhs, x) : want;
      var L = Math.max(l.length, r.length);
      return pad(l, L) === pad(r, L);
    });
  }
  // The * pattern for a set of solutions, or null when no single pattern describes exactly that set.
  function pattern(list) {
    if (!list.length) return null;
    var L = list[0].length, p = '', stars = 0;
    for (var i = 0; i < L; i++) {
      var c = list[0][i], same = list.every(function (s) { return s[i] === c; });
      p += same ? c : '*';
      if (!same) stars++;
    }
    return list.length === Math.pow(2, stars) ? p : null;
  }
  function matches(pat, s) {
    if (pat.length !== s.length) return false;
    for (var i = 0; i < pat.length; i++) if (pat[i] !== '*' && pat[i] !== s[i]) return false;
    return true;
  }
  function expand(pat) { return allX(pat.length).filter(function (s) { return matches(pat, s); }); }
  // Operators whose operands are already plain bit strings: the ones that may be worked next.
  function ready(node) {
    var out = [];
    (function walk(n) {
      if (n.t === 'bits' || n.t === 'var') return;
      var kids = n.t === 'bin' ? [n.a, n.b] : [n.a];
      if (kids.every(function (k) { return k.t === 'bits'; })) out.push(n);
      kids.forEach(walk);
    })(node);
    return out;
  }
  function precedenceOf(node) { return node.t === 'not' ? 5 : node.t === 'sh' ? 4 : BIN[node.op]; }

  return { tokenize: tokenize, parse: parse, evaluate: evaluate, trace: trace, show: show, opName: opName, apply: apply,
    not: not, shift: shift, binop: binop, pad: pad, solve: solve, pattern: pattern, matches: matches, expand: expand,
    allX: allX, ready: ready, precedenceOf: precedenceOf };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BitCore;
