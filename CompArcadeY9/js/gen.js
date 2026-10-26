// Contest 2 Arcade question makers, by level (1 easiest to 4 hardest), on top of LoopTracer's generators
// (ACSLGen, ACSLLoops) and shared/acsl-pseudocode.js. Every answer is worked out here in code.
// A question is plain data, so a game can save it: { topic, kind, prompt, code, answer, why: [lines] }.
var CAGen = (function () {
  'use strict';
  var N = ACSLGen.notation, B = ACSLGen.bits;
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function attempt(fn, fallback) { for (var i = 0; i < 40; i++) { try { var q = fn(); if (q) return q; } catch (e) {} } return fallback(); }

  // ================================================================== notation
  var EVAL = ['prefix-eval', 'postfix-eval'], CONVERT = ['to-prefix', 'to-postfix'], SWAP = ['pre-to-post', 'post-to-pre'];
  function notationKinds(level) { return level >= 3 ? EVAL.concat(CONVERT, SWAP, CONVERT) : EVAL.concat(CONVERT); }
  function notation(level, kind) {
    level = Math.max(1, Math.min(4, level || 1));
    kind = kind || pick(notationKinds(level));
    return attempt(function () {
      if (kind === 'prefix-eval' || kind === 'postfix-eval') {
        var t = N.numberTree(Math.min(5, level + 2)), pre = kind === 'prefix-eval';
        return { topic: 'notation', kind: kind, level: level, prompt: 'Evaluate this ' + (pre ? 'prefix' : 'postfix') + ' expression.',
          code: pre ? N.prefix(t) : N.postfix(t), answer: String(N.value(t)), why: pre ? N.prefixSteps(t) : N.postfixSteps(t) };
      }
      if (kind === 'to-prefix' || kind === 'to-postfix') {
        var implied = level >= 3 && Math.random() < 0.5, u = N.letterTree(Math.min(4, level + 2), implied), post = kind === 'to-postfix';
        var ans = post ? N.postfix(u) : N.prefix(u);
        return { topic: 'notation', kind: kind, level: level, prompt: 'Write this infix expression in ' + (post ? 'postfix' : 'prefix') + '.',
          code: N.infix(u, implied), answer: ans, why: ['Brackets round every operation: ' + N.fullBrackets(u), 'Move each operator ' + (post ? 'after' : 'before') + ' its two operands: ' + ans] };
      }
      var w = N.letterTree(Math.min(4, level + 1), false), toPost = kind === 'pre-to-post';
      var from = toPost ? N.prefix(w) : N.postfix(w), to = toPost ? N.postfix(w) : N.prefix(w);
      return { topic: 'notation', kind: kind, level: level, prompt: 'Write this ' + (toPost ? 'prefix' : 'postfix') + ' expression in ' + (toPost ? 'postfix' : 'prefix') + '.',
        code: from, answer: to, why: ['As infix with brackets: ' + N.fullBrackets(w), 'So in ' + (toPost ? 'postfix' : 'prefix') + ': ' + to] };
    }, function () { return fromGen(ACSLGen.question(kind === 'post-to-pre' || kind === 'pre-to-post' ? 'to-postfix' : kind)); });
  }

  // ================================================================== bit strings (5 bits, ACSL order: NOT, shifts and
  // circulates first, then AND, then XOR, then OR)
  function rb() { var s = ''; for (var i = 0; i < 5; i++) s += R(0, 1); return s; }
  var UN = ['NOT', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC', 'LCIRC', 'RSHIFT'];
  function unary(a, depth, noNot) {
    var t = a;
    for (var d = 0; d < depth; d++) {
      var un = pick(noNot ? UN.slice(1) : UN);
      t = un === 'NOT' ? { un: 'NOT', a: t } : { un: un, k: R(1, 3), a: t };
    }
    return t;
  }
  function bin(op, l, r) { return { bin: op, l: l, r: r }; }
  function opName(n) { return n.un === 'NOT' ? 'NOT' : n.un + '-' + n.k; }
  function steps(t, x) {
    var out = [];
    (function walk(n) {
      if (n.lit != null) return n.lit;
      if (n.x) return x;
      if (n.un) { var a = walk(n.a), v = B.value(n, x); out.push(opName(n) + ' ' + a + ' = ' + v); return v; }
      var l = walk(n.l), r = walk(n.r), v2 = B.value(n, x);
      out.push(l + ' ' + n.bin + ' ' + r + ' = ' + v2);
      return v2;
    })(t);
    return out;
  }
  // The text must mean the same as the tree under ACSL's order of operators, for every x.
  function sameMeaning(t, text) {
    var p = B.parse(text, B.PREC);
    for (var v = 0; v < 32; v++) { var s = ('00000' + v.toString(2)).slice(-5); if (B.value(p, s) !== B.value(t, s)) return false; }
    return true;
  }
  function bitsEval(level) {
    level = Math.max(1, Math.min(4, level || 1));
    if (level >= 3) return fromGen(ACSLGen.question('bits-eval'));
    return attempt(function () {
      var t = level === 1 ? bin(pick(['AND', 'OR', 'XOR']), unary({ lit: rb() }, 1), { lit: rb() })
        : bin(pick(['AND', 'OR', 'XOR']), unary({ lit: rb() }, 1), unary({ lit: rb() }, 1));
      if (Math.random() < 0.5) t = bin(t.bin, t.r, t.l);
      var text = B.show(t), ans = B.value(t);
      if (!sameMeaning(t, text) || /^(00000|11111)$/.test(ans)) return null;
      return { topic: 'bits', kind: 'bits-eval', level: level, prompt: 'Evaluate this bit-string expression.', code: text, answer: ans, why: steps(B.parse(text, B.PREC)) };
    }, function () { return fromGen(ACSLGen.question('bits-eval')); });
  }
  function bitsSolve(level) {
    level = Math.max(1, Math.min(4, level || 1));
    return attempt(function () {
      var x = { x: true }, t, ops = ['AND', 'OR', 'XOR'];
      if (level === 1) t = bin(pick(ops), x, { lit: rb() });
      else if (level === 2) t = Math.random() < 0.4 ? unary(x, 2) : bin(pick(ops), unary(x, 1), { lit: rb() });
      else if (level === 3) t = Math.random() < 0.5 ? bin(pick(ops), unary(x, 2), { lit: rb() }) : bin(pick(ops), unary(x, 1), unary({ lit: rb() }, 1));
      else {
        t = bin(pick(ops), bin(pick(ops), unary(x, 1), { lit: rb() }), { lit: rb() });
        if (Math.random() < 0.4) t = { un: 'NOT', a: t };
      }
      var target = B.value(t, rb()), sols = [];
      for (var v = 0; v < 32; v++) { var s = ('00000' + v.toString(2)).slice(-5); if (B.value(t, s) === target) sols.push(s); }
      var pat = '';
      for (var i = 0; i < 5; i++) pat += sols.every(function (z) { return z[i] === sols[0][i]; }) ? sols[0][i] : '*';
      var stars = (pat.match(/\*/g) || []).length;
      if (sols.length !== Math.pow(2, stars) || stars > 3) return null;
      if (level >= 2 && stars === 0 && Math.random() < 0.5) return null;
      var text = B.show(t);
      if (!sameMeaning(t, text)) return null;
      return { topic: 'bits', kind: 'bits-solve', level: level, prompt: 'Find all 5-bit values of x that make this true. Use * for a bit that can be 0 or 1.',
        code: text + ' = ' + target, answer: pat,
        why: ['Work back from the answer, one bit at a time.', sols.length + ' value' + (sols.length > 1 ? 's' : '') + ' of x work' + (sols.length > 1 ? '' : 's') + (sols.length <= 4 ? ': ' + sols.join(', ') : '') + '.', 'So x = ' + pat] };
    }, function () { return fromGen(ACSLGen.question('bits-solve')); });
  }

  // ================================================================== loops
  function loop(level) {
    var p = ACSLLoops.make(Math.max(1, Math.min(6, level || 1)));
    return { topic: 'loops', kind: 'loop', level: level, skill: p.skill, prompt: 'What is output by this program?', code: p.src, answer: p.output,
      why: p.level >= 6 ? ['Spot the pattern: say what the loop works out in words.', 'Output: ' + p.output] : traceWhy(p) };
  }
  function traceWhy(p) {
    var rows = p.rows.slice(-6).map(function (r) { return r.name === 'OUTPUT' ? 'output ' + r.value : r.name + ' = ' + (r.value === '' ? '""' : r.value); });
    return ['The last rows of the trace: ' + rows.join(', '), 'Output: ' + p.output];
  }

  // A LoopTracer question as plain data.
  function fromGen(q) { return { topic: q.topic, kind: q.kind, level: 4, prompt: q.prompt, code: q.code, answer: q.answer, why: q.why.slice() }; }
  // Real contest order: 2 notation, 2 bit strings, 1 program.
  function contest() {
    return [fromGen(ACSLGen.question(pick(['prefix-eval', 'postfix-eval']))), fromGen(ACSLGen.question(pick(['to-postfix', 'to-prefix']))),
      fromGen(ACSLGen.question('bits-eval')), fromGen(ACSLGen.question('bits-solve')), fromGen(ACSLGen.question(pick(['loop-4', 'loop-5', 'loop-6'])))];
  }

  return { notation: notation, notationKinds: notationKinds, bitsEval: bitsEval, bitsSolve: bitsSolve, loop: loop, contest: contest, fromGen: fromGen, R: R, pick: pick };
})();
