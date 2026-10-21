// NotationLab core: prefix, infix and postfix expressions as trees (ACSL Junior Contest 2).
// Operands are single digits or single letters (never X: a typed x means multiply). Operators: + - * / and the
// power arrow (shown as \u2191, typed as ^ too). Infix uses the usual precedence (\u2191, then * and /, then + and -),
// equal precedence left to right; a number next to a letter or a bracket is a hidden multiplication (3(A+2B)).
// Shared by the app, by tools/build_acsl_c2_notation.mjs (which also copies this file into the drill data files)
// and by the drills, so every answer anywhere comes from the same code.
var NotationCore = (function () {
  'use strict';
  var POW = '\u2191';
  var OPS = ['+', '-', '*', '/', POW];
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
  PREC[POW] = 3;
  var LETTERS = 'ABCDEFGH';

  function isOp(t) { return Object.prototype.hasOwnProperty.call(PREC, t); }
  function isVal(t) { return t != null && /^[0-9A-Z]$/.test(t); }
  function leaf(v) { return { v: String(v) }; }
  function node(op, l, r) { return { op: op, l: l, r: r }; }
  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(list) { return list[rand(list.length)]; }

  // ---------------------------------------------------------------- reading what was typed
  // Tokens of a typed expression: operators normalised, letters upper case, spaces and commas dropped.
  // Returns null for anything that is not part of an expression.
  function tokens(str) {
    var out = [], s = String(str == null ? '' : str);
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (/[\s,]/.test(c)) continue;
      if (c === '^') c = POW;
      else if (c === '\u00d7' || c === 'x' || c === 'X' || c === '\u00b7') c = '*';
      else if (c === '\u00f7') c = '/';
      else if (c === '\u2212' || c === '\u2013') c = '-';
      if (isOp(c) || c === '(' || c === ')' || /[0-9]/.test(c)) out.push(c);
      else if (/[A-Za-z]/.test(c)) out.push(c.toUpperCase());
      else return null;
    }
    return out;
  }

  // Infix to a tree. A hidden multiplication (2B, 3(A+B), (A+B)(C+D)) becomes *. Two digits side by side are not
  // allowed (every number is one digit). Returns null if it cannot be read.
  function parseInfix(str) {
    var t = Array.isArray(str) ? str : tokens(str);
    if (!t || !t.length) return null;
    var x = [];
    for (var i = 0; i < t.length; i++) {
      var a = x[x.length - 1], b = t[i];
      var aEnd = a != null && (a === ')' || isVal(a));
      var bStart = b === '(' || isVal(b);
      if (aEnd && bStart) {
        if (/[0-9]/.test(a) && /[0-9]/.test(b)) return null;
        x.push('*');
      }
      x.push(b);
    }
    var p = 0;
    function primary() {
      var tk = x[p];
      if (tk === '(') { p++; var e = expr(1); if (!e || x[p] !== ')') return null; p++; return e; }
      if (isVal(tk)) { p++; return leaf(tk); }
      return null;
    }
    function expr(minPrec) {
      var left = primary();
      if (!left) return null;
      while (p < x.length && isOp(x[p]) && PREC[x[p]] >= minPrec) {
        var op = x[p++];
        var right = expr(PREC[op] + 1);
        if (!right) return null;
        left = node(op, left, right);
      }
      return left;
    }
    var tree = expr(1);
    return tree && p === x.length ? tree : null;
  }
  function parsePrefix(list) {
    var t = Array.isArray(list) ? list : tokens(list);
    if (!t || !t.length) return null;
    var p = 0;
    function go() {
      var tk = t[p++];
      if (isVal(tk)) return leaf(tk);
      if (!isOp(tk)) return null;
      var l = go(); if (!l) return null;
      var r = go(); if (!r) return null;
      return node(tk, l, r);
    }
    var tree = go();
    return tree && p === t.length ? tree : null;
  }
  function parsePostfix(list) {
    var t = Array.isArray(list) ? list : tokens(list);
    if (!t || !t.length) return null;
    var st = [];
    for (var i = 0; i < t.length; i++) {
      if (isVal(t[i])) st.push(leaf(t[i]));
      else if (isOp(t[i])) { if (st.length < 2) return null; var r = st.pop(), l = st.pop(); st.push(node(t[i], l, r)); }
      else return null;
    }
    return st.length === 1 ? st[0] : null;
  }

  // ---------------------------------------------------------------- writing a tree out
  function toPrefix(t) { return t.op ? [t.op].concat(toPrefix(t.l), toPrefix(t.r)) : [t.v]; }
  function toPostfix(t) { return t.op ? toPostfix(t.l).concat(toPostfix(t.r), [t.op]) : [t.v]; }
  function show(list) { return list.map(function (s) { return s === '*' ? '*' : s; }).join(' '); }
  // Brackets a child needs inside its parent so the infix reads back as the same tree.
  function needs(child, parentOp, side) {
    if (!child.op) return false;
    var pc = PREC[child.op], pp = PREC[parentOp];
    if (pc < pp) return true;
    if (pc === pp && (side === 'r' || parentOp === POW)) return true;
    return false;
  }
  // A hidden multiplication is written only as a number before a letter or before brackets (3A, 2(A+B)).
  function hiddenTimes(t) {
    return t.op === '*' && !t.l.op && /[0-9]/.test(t.l.v) && (!t.r.op ? /[A-Z]/.test(t.r.v) : needs(t.r, '*', 'r'));
  }
  // opts.full: brackets round every operation. opts.implied: write hidden multiplications. opts.tight: no spaces.
  function toInfix(t, opts) {
    opts = opts || {};
    var sp = opts.tight ? '' : ' ';
    function go(n, top) {
      if (!n.op) return n.v;
      var l = go(n.l), r = go(n.r);
      if (opts.full ? n.l.op : needs(n.l, n.op, 'l')) l = '(' + l + ')';
      if (opts.full ? n.r.op : needs(n.r, n.op, 'r')) r = '(' + r + ')';
      return opts.implied && hiddenTimes(n) ? l + r : l + sp + n.op + sp + r;
    }
    var out = go(t);
    return opts.full && t.op ? '(' + out + ')' : out;
  }
  function sameTree(a, b) {
    if (!a || !b) return false;
    if (!a.op || !b.op) return !a.op && !b.op && a.v === b.v;
    return a.op === b.op && sameTree(a.l, b.l) && sameTree(a.r, b.r);
  }
  function opCount(t) { return t.op ? 1 + opCount(t.l) + opCount(t.r) : 0; }
  function depth(t) { return t.op ? 1 + Math.max(depth(t.l), depth(t.r)) : 0; }

  // ---------------------------------------------------------------- values
  function apply(op, a, b) {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return a / b;
    return Math.pow(a, b);
  }
  function evaluate(t, env) {
    if (!t.op) return /[0-9]/.test(t.v) ? Number(t.v) : (env && env[t.v] != null ? env[t.v] : NaN);
    return apply(t.op, evaluate(t.l, env), evaluate(t.r, env));
  }
  // The stack method, one step per token. Postfix is read left to right and the FIRST value popped is the right
  // operand; prefix is read right to left and the FIRST value popped is the left operand.
  // swap: the two popped values the wrong way round (the most common slip), for wrong options.
  function stackSteps(list, form, swap) {
    var order = list.map(function (_, i) { return i; });
    if (form === 'prefix') order.reverse();
    var st = [], out = [];
    order.forEach(function (i) {
      var tk = list[i];
      if (isVal(tk)) { st.push(Number(tk)); out.push({ i: i, token: tk, kind: 'push', value: Number(tk), stack: st.slice() }); return; }
      var first = st.pop(), second = st.pop();
      var leftFirst = (form === 'prefix') !== !!swap;
      var left = leftFirst ? first : second, right = leftFirst ? second : first;
      var value = apply(tk, left, right);
      st.push(value);
      out.push({ i: i, token: tk, kind: 'apply', first: first, second: second, left: left, right: right, value: value, stack: st.slice() });
    });
    return out;
  }

  // ---------------------------------------------------------------- random expressions
  // o.n operators from o.ops. Digits (o.letters false): every value along the way a whole number with size at most
  // o.max (o.noNeg: never below 0). The power arrow always has 2 or 3 on its right and a small value on its left,
  // and never sits directly inside another power. Letters: A, B, C ... from left to right (power exponents stay
  // digits; o.digitChance mixes in a few digit operands).
  function randomTree(o) {
    var ops = o.ops || ['+', '-', '*', '/'];
    for (var tries = 0; tries < 4000; tries++) {
      var t = build(o.n, ops, o);
      if (o.mustUse && !o.mustUse.every(function (op) { return toPrefix(t).indexOf(op) !== -1; })) continue;
      if (o.letters) { name(t, o); return t; }
      if (ok(t, o)) return t;
    }
    throw new Error('NotationCore.randomTree: no expression fits ' + JSON.stringify(o));
  }
  function build(n, ops, o) {
    if (n === 0) return leaf(1 + rand(9));
    var op = pick(ops);
    if (op === POW) return node(op, build(n - 1, ops.filter(function (x) { return x !== POW; }), o), leaf(2 + rand(2)));
    var k = rand(n);
    return node(op, build(k, ops, o), build(n - 1 - k, ops, o));
  }
  function ok(t, o) {
    var max = o.max || 99;
    var bad = false;
    (function val(n) {
      if (bad) return 0;
      if (!n.op) return Number(n.v);
      var a = val(n.l), b = val(n.r);
      if (n.op === '/' && (b === 0 || a % b !== 0 || b === 1)) bad = true;
      if (n.op === POW && (a < 2 || a > 9)) bad = true;
      var v = apply(n.op, a, b);
      if (!isFinite(v) || Math.abs(v) > max || (o.noNeg && v < 0)) bad = true;
      return v;
    })(t);
    return !bad;
  }
  function name(t, o) {
    var k = 0;
    (function go(n, isExp) {
      if (!n.op) { n.v = isExp ? n.v : (o.digitChance && Math.random() < o.digitChance ? String(2 + rand(8)) : LETTERS.charAt(k++)); return; }
      go(n.l, false);
      go(n.r, n.op === POW);
    })(t, false);
  }
  function clone(t) { return t.op ? node(t.op, clone(t.l), clone(t.r)) : leaf(t.v); }

  // ---------------------------------------------------------------- marking patterns (for the drills)
  var OP_RE = { '+': '\\+', '-': '[-\\u2212\\u2013]', '*': '[*\\u00d7xX\\u00b7]', '/': '[/\\u00f7]' };
  OP_RE[POW] = '(?:\\u2191|\\^)';
  function valRe(v) { return /[0-9]/.test(v) ? v : '[' + v + v.toLowerCase() + ']'; }
  // A prefix or postfix answer, with or without spaces (or commas) between the tokens.
  function seqRe(list) {
    return '^\\s*' + list.map(function (tk) { return isOp(tk) ? OP_RE[tk] : valRe(tk); }).join('[\\s,]*') + '\\s*$';
  }
  // An infix answer: the brackets it needs, any extra brackets round an operation, a hidden multiplication where
  // a letter or a bracket follows, and any spacing.
  function infixRe(t) {
    function go(n) {
      if (!n.op) return valRe(n.v);
      var l = part(n.l, n.op, 'l'), r = part(n.r, n.op, 'r');
      var mid = n.op === '*' ? '\\s*(?:' + OP_RE['*'] + '\\s*|(?=[A-WYZa-wyz(]))' : '\\s*' + OP_RE[n.op] + '\\s*';
      return l + mid + r;
    }
    function part(c, op, side) {
      var s = go(c);
      if (!c.op) return s;
      var br = '\\(\\s*' + s + '\\s*\\)';
      return needs(c, op, side) ? br : '(?:' + br + '|' + s + ')';
    }
    var s = go(t);
    return '^\\s*' + (t.op ? '(?:\\(\\s*' + s + '\\s*\\)|' + s + ')' : s) + '\\s*$';
  }

  return {
    POW: POW, OPS: OPS, PREC: PREC, isOp: isOp, isVal: isVal, leaf: leaf, node: node,
    tokens: tokens, parseInfix: parseInfix, parsePrefix: parsePrefix, parsePostfix: parsePostfix,
    toPrefix: toPrefix, toPostfix: toPostfix, toInfix: toInfix, show: show, needs: needs, hiddenTimes: hiddenTimes,
    sameTree: sameTree, opCount: opCount, depth: depth, apply: apply, evaluate: evaluate, stackSteps: stackSteps,
    randomTree: randomTree, clone: clone, seqRe: seqRe, infixRe: infixRe, rand: rand, pick: pick
  };
})();
if (typeof module === 'object' && module && module.exports) module.exports = NotationCore;
