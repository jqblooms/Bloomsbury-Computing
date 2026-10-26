// Comp Arcade (Year 7 Competition Practice): every question the games, the quiz board, the mini contest and the
// y7-comp-practice drills ask. Plain ES5 with no DOM. It needs NotationCore (NotationLab/core.js), BitCore
// (BitFlicker/bits-core.js) and ACSLPseudo (shared/acsl-pseudocode.js) loaded first; tools/build_y7_comp.mjs copies
// all four files into the drills, so the app and the drills always agree. Every answer is worked out here by code.
// Year 7 sizes: single digits, small results, 4 or 5 bits, loops of 3 to 6 turns.
var CompGenY7 = (function () {
  'use strict';
  var NC = NotationCore, B = BitCore, A = ACSLPseudo;

  function rand(n) { return Math.floor(Math.random() * n); }
  function R(a, b) { return a + rand(b - a + 1); }
  function pick(list) { return list[rand(list.length)]; }
  function shuffle(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // ---------------------------------------------------------------- marking patterns
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  // A typed whole number: the digits or (up to twenty) the word, an optional "name =" in front, an optional unit.
  function numRe(n, opts) {
    opts = opts || {};
    var body = (n < 0 ? '[-\\u2212]\\s*' : '') + Math.abs(n);
    if (n >= 0 && n <= 20) body = '(?:' + body + '|' + WORDS[n] + ')';
    var pre = opts.name ? '(?:' + escRe(opts.name) + '\\s*=\\s*)?' : '';
    var unit = opts.unit ? '(?:\\s*(?:' + opts.unit + '))?' : '';
    return new RegExp('^\\s*' + pre + body + '(?:\\.0+)?' + unit + '\\s*\\.?\\s*$', 'i');
  }
  // A typed bit string: spaces between bits are fine.
  function bitsRe(s) { return new RegExp('^\\s*' + s.split('').join('\\s*') + '\\s*\\.?\\s*$'); }
  function same(re, s) { return re.test(String(s == null ? '' : s)); }

  // Wrong numbers for options: the listed slips first, then values close by. Whole, not negative, never the answer.
  function wrongNums(v, slips) {
    var out = [];
    slips.concat([v + 1, v - 1, v + 2, v * 2, v + 3, v - 2, v + 10]).forEach(function (c) {
      if (typeof c === 'number' && isFinite(c) && Math.round(c) === c && c >= 0 && c !== v && out.indexOf(String(c)) < 0 && out.length < 3) out.push(String(c));
    });
    return out;
  }
  // Wrong text answers: distinct, none accepted by the answer's own pattern.
  function wrongText(answer, re, cands) {
    var out = [];
    cands.forEach(function (c) { if (c && c !== answer && out.indexOf(c) < 0 && !re.test(c) && out.length < 3) out.push(c); });
    return out;
  }

  // ---------------------------------------------------------------- prefix and postfix: work it out
  // Level 1: one operator. Level 2: two. Level 3: three, with / too. Every value along the way is a whole number,
  // never below 0 and never big.
  var EVAL = {
    1: { n: 1, ops: ['+', '-', '*'], max: 40, noNeg: true },
    2: { n: 2, ops: ['+', '-', '*'], max: 50, noNeg: true },
    3: { n: 3, ops: ['+', '-', '*', '/'], max: 60, noNeg: true }
  };
  var EVAL_WORK = {
    postfix: ['Read from left to right. Push each number. At an operator, pop two numbers, work them out and push the answer.',
      'The first number popped goes on the right: A B - means A - B.'],
    prefix: ['Read from right to left. Push each number. At an operator, pop two numbers, work them out and push the answer.',
      'The first number popped goes on the left: - A B means A - B.']
  };
  function stepText(s) {
    return s.kind === 'push' ? 'Push ' + s.value + '.' : 'Pop ' + s.first + ', pop ' + s.second + ': ' + s.left + ' ' + s.token + ' ' + s.right + ' = ' + s.value + '. Push it.';
  }
  function interesting(t) {
    // No x - x, no x * 1 or x / 1: they teach nothing.
    var bad = false;
    (function go(n) {
      if (!n.op) return;
      if (!n.l.op && !n.r.op) {
        if (n.op === '-' && n.l.v === n.r.v) bad = true;
        if ((n.op === '*' || n.op === '/') && (n.l.v === '1' || n.r.v === '1')) bad = true;
      }
      go(n.l); go(n.r);
    })(t);
    return !bad;
  }
  function evalQ(form, level) {
    var o = EVAL[level] || EVAL[1], t;
    for (var k = 0; k < 400; k++) { t = NC.randomTree(o); if (interesting(t)) break; }
    var list = form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t), v = NC.evaluate(t);
    var steps = NC.stackSteps(list, form), swapped = NC.stackSteps(list, form, true).slice(-1)[0].value;
    var before = steps.length > 1 ? steps[steps.length - 2].stack : [];
    var leftToRight = (function () {
      var vals = list.filter(function (x) { return !NC.isOp(x); }).map(Number), ops = list.filter(NC.isOp), r = vals[0];
      for (var i = 0; i < ops.length; i++) r = NC.apply(ops[i], r, vals[i + 1]);
      return r;
    })();
    return { topic: 'notation', kind: form, level: level, form: form, tokens: list, tree: t, text: NC.show(list), value: v,
      prompt: 'Work out this ' + form + ' expression.', show: { type: 'expr', text: NC.show(list) },
      answer: String(v), re: numRe(v), wrong: wrongNums(v, [swapped, leftToRight, before[before.length - 1]]),
      steps: steps.map(stepText), stack: steps, working: EVAL_WORK[form], format: 'Type a number',
      note: 'The stack ends with one number: ' + v + '.' };
  }

  // ---------------------------------------------------------------- infix to postfix or prefix
  // Level 1: one operator (A + B). Level 2: two operators, no brackets, two ranks (A + B * C). Level 3: brackets.
  function moved(t, target) {
    if (!t.op) return t.v;
    var l = moved(t.l, target), r = moved(t.r, target);
    return '(' + (target === 'prefix' ? t.op + ' ' + l + ' ' + r : l + ' ' + r + ' ' + t.op) + ')';
  }
  function flatParse(list) {
    var p = 0;
    function prim() { var tk = list[p]; if (tk === '(') { p++; var e = ex(); p++; return e; } p++; return NC.leaf(tk); }
    function ex() { var l = prim(); while (p < list.length && NC.isOp(list[p])) { var op = list[p++]; l = NC.node(op, l, prim()); } return l; }
    return ex();
  }
  function mirror(n) { return n.op ? NC.node(n.op, mirror(n.r), mirror(n.l)) : NC.leaf(n.v); }
  function ranks(t) { var r = {}; NC.toPrefix(t).forEach(function (k) { if (NC.isOp(k)) r[NC.PREC[k]] = 1; }); return Object.keys(r).length; }
  function convTree(level) {
    for (var k = 0; k < 600; k++) {
      var t = NC.randomTree({ n: level === 1 ? 1 : 2, ops: level === 1 ? ['+', '-', '*', '/'] : ['+', '-', '*', '/'], letters: true });
      var inf = NC.toInfix(t);
      if (level === 2 && (inf.indexOf('(') >= 0 || ranks(t) < 2)) continue;
      if (level === 3 && inf.indexOf('(') < 0) continue;
      return t;
    }
    return t;
  }
  function convQ(target, level) {
    var t = convTree(level || 1), list = target === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t), ans = NC.show(list);
    var re = new RegExp(NC.seqRe(list), 'i');
    var of = function (x) { return NC.show(target === 'prefix' ? NC.toPrefix(x) : NC.toPostfix(x)); };
    var vals = list.filter(function (x) { return !NC.isOp(x); }), ops = NC.tokens(NC.toInfix(t)).filter(NC.isOp);
    var cands = [of(flatParse(NC.tokens(NC.toInfix(t)))), NC.show(target === 'prefix' ? NC.toPostfix(t) : NC.toPrefix(t)), of(mirror(t)),
      NC.show(target === 'prefix' ? ops.concat(vals) : vals.concat(ops)), NC.show(target === 'prefix' ? ops.slice().reverse().concat(vals) : vals.concat(ops.slice().reverse())),
      NC.show(list.slice().reverse()), NC.toInfix(t)];
    var inf = NC.toInfix(t);
    return { topic: 'notation', kind: 'to-' + target, level: level, target: target, infix: inf, tokens: list, tree: t,
      prompt: 'Write this infix expression in ' + target + '.', show: { type: 'expr', text: inf },
      answer: ans, re: re, wrong: wrongText(ans, re, cands),
      steps: ['Brackets round every operation: ' + NC.toInfix(t, { full: true }),
        'Move each operator to the ' + (target === 'prefix' ? 'front' : 'end') + ' of its own brackets: ' + moved(t, target),
        'Remove the brackets: ' + ans],
      working: ['Put brackets round each operation, in the order you work it out: * and / before + and -.',
        'Move each operator to the ' + (target === 'prefix' ? 'front' : 'end') + ' of its own brackets. The letters stay in the same order.'],
      format: 'Type the ' + target + ' expression. Spaces are optional.', note: target.charAt(0).toUpperCase() + target.slice(1) + ': ' + ans + '.' };
  }

  // ---------------------------------------------------------------- bit strings
  function randBits(L) {
    var s;
    do { s = ''; for (var i = 0; i < L; i++) s += Math.random() < 0.5 ? '1' : '0'; } while (!/0/.test(s) || !/1/.test(s));
    return s;
  }
  function flip(s, i) { return s.slice(0, i) + (s[i] === '1' ? '0' : '1') + s.slice(i + 1); }
  var BIT_RULE = {
    NOT: 'NOT flips every bit: 1 becomes 0 and 0 becomes 1.',
    AND: 'AND gives 1 only where both bits are 1.',
    OR: 'OR gives 1 where at least one bit is 1.',
    XOR: 'XOR gives 1 where the two bits are different.',
    LSHIFT: 'LSHIFT-1 moves every bit 1 place left. The left bit falls off and a 0 comes in on the right.',
    RSHIFT: 'RSHIFT-1 moves every bit 1 place right. The right bit falls off and a 0 comes in on the left.',
    LCIRC: 'LCIRC-1 moves every bit 1 place left. The left bit comes back on the right.',
    RCIRC: 'RCIRC-1 moves every bit 1 place right. The right bit comes back on the left.'
  };
  var BIT_RULE2 = {
    LSHIFT: 'LSHIFT-2 moves every bit 2 places left: do LSHIFT-1 twice. Two 0s come in on the right.',
    RSHIFT: 'RSHIFT-2 moves every bit 2 places right: do RSHIFT-1 twice. Two 0s come in on the left.',
    LCIRC: 'LCIRC-2 moves every bit 2 places left: do LCIRC-1 twice. The bits that fall off come back on the right.',
    RCIRC: 'RCIRC-2 moves every bit 2 places right: do RCIRC-1 twice. The bits that fall off come back on the left.'
  };
  var BIT_KINDS = ['not', 'and', 'or', 'xor', 'lshift', 'rshift', 'lcirc', 'rcirc', 'two', 'shift2'];
  // kind: one of BIT_KINDS. len: 4 or 5 bits.
  function bitsQ(kind, len) {
    len = len || 5;
    for (var tries = 0; tries < 400; tries++) {
      var a = randBits(len), b = randBits(len), expr, op, rule, x = null, slips = [];
      if (kind === 'not') { op = 'NOT'; expr = 'NOT ' + a; slips = [a, B.shift('LCIRC', 1, a)]; }
      else if (kind === 'and' || kind === 'or' || kind === 'xor') {
        op = kind.toUpperCase(); expr = a + ' ' + op + ' ' + b;
        slips = ['AND', 'OR', 'XOR'].filter(function (o) { return o !== op; }).map(function (o) { return B.binop(o, a, b); });
      } else if (/shift|circ/.test(kind) && kind !== 'shift2') {
        op = kind.toUpperCase(); expr = op + '-1 ' + a;
        var other = { LSHIFT: ['LCIRC', 'RSHIFT'], RSHIFT: ['RCIRC', 'LSHIFT'], LCIRC: ['LSHIFT', 'RCIRC'], RCIRC: ['RSHIFT', 'LCIRC'] }[op];
        slips = other.map(function (o) { return B.shift(o, 1, a); });
      } else if (kind === 'shift2') {
        op = pick(['LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC']); expr = op + '-2 ' + a;
        slips = [B.shift(op, 1, a), B.shift(op.charAt(0) === 'L' ? op.replace('L', 'R') : op.replace('R', 'L'), 2, a)];
      } else {
        // Two steps, the brackets first: NOT (a AND b), LSHIFT-1 (a OR b), RCIRC-1 (NOT a) and so on.
        var inner = pick(['AND', 'OR', 'XOR', 'NOT']), outer = pick(['NOT', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC']);
        if (inner === 'NOT' && outer === 'NOT') outer = 'LCIRC';
        var inside = inner === 'NOT' ? 'NOT ' + a : a + ' ' + inner + ' ' + b;
        op = outer; expr = (outer === 'NOT' ? 'NOT' : outer + '-1') + ' (' + inside + ')';
        var mid = B.evaluate(inside);
        slips = [mid, outer === 'NOT' ? B.shift('LCIRC', 1, mid) : B.not(mid)];
        x = { inside: inside, mid: mid, inner: inner };
      }
      var ans = B.evaluate(expr);
      if (!/0/.test(ans) || !/1/.test(ans)) continue;
      if (/^(and|or|xor)$/.test(kind) && (ans === a || ans === b)) continue;
      if (kind === 'two' && (ans === a || ans === b)) continue;
      var re = bitsRe(ans), wrong = [];
      slips.concat([flip(ans, rand(len)), flip(ans, rand(len)), flip(flip(ans, 0), len - 1), flip(ans, len - 1)]).forEach(function (s) {
        if (s && s.length === len && s !== ans && wrong.indexOf(s) < 0 && wrong.length < 3) wrong.push(s);
      });
      if (wrong.length < 3) continue;
      var trace = B.trace(expr);
      rule = x ? [BIT_RULE[x.inner], BIT_RULE[outer]] : [BIT_RULE[op]];
      if (kind === 'shift2') rule = [BIT_RULE2[op]];
      return { topic: 'bits', kind: kind, len: len, a: a, b: /^(and|or|xor)$/.test(kind) || (x && x.inner !== 'NOT') ? b : null, op: op, expr: expr, two: x,
        prompt: 'Work out the bit string.', show: { type: 'expr', text: expr },
        answer: ans, re: re, wrong: wrong, steps: trace.map(function (s) { return s.text; }), trace: trace,
        working: x ? ['Work out the brackets first. Then use ' + (outer === 'NOT' ? 'NOT' : outer + '-1') + ' on that answer.', rule.join(' ')]
          : [rule[0], 'Go one bit at a time, from left to right. The answer has ' + len + ' bits.'],
        format: 'Type ' + len + ' bits', note: expr + ' = ' + ans + '.' };
    }
    throw new Error('bitsQ: no question for ' + kind);
  }

  // ---------------------------------------------------------------- loops (ACSL pseudocode)
  // Level 1: c = c + k, from 1 to n. Level 2: a total of i, or a loop that does not start at 1. Level 3: STEP 2 or 3.
  // Level 4: doubling, or a total with STEP. The question is the OUTPUT, or how many times the loop body runs.
  function loopProgram(level) {
    var p;
    if (level === 1) {
      var n = R(3, 5), k = R(1, 3), s0 = pick([0, 0, R(1, 5)]);
      p = { v: 'c', lines: ['c = ' + s0, 'FOR i = 1 TO ' + n, '  c = c + ' + k, 'NEXT i', 'OUTPUT c'], ask: 'output',
        slips: [n, s0 + k * (n - 1), s0 + k * (n + 1), k * n + (s0 ? 0 : 1)] };
    } else if (level === 2) {
      if (Math.random() < 0.5) {
        var m = R(3, 5);
        p = { v: 's', lines: ['s = 0', 'FOR i = 1 TO ' + m, '  s = s + i', 'NEXT i', 'OUTPUT s'], ask: 'output', slips: [m, m * (m - 1) / 2, m * (m + 1) / 2 + m + 1] };
      } else {
        var a = R(2, 4), b = a + R(2, 3), body = pick(['c = c + 1', 's = s + i']);
        var vn = body.charAt(0);
        p = { v: vn, lines: [vn + ' = 0', 'FOR i = ' + a + ' TO ' + b, '  ' + body, 'NEXT i', 'OUTPUT ' + vn], ask: Math.random() < 0.5 ? 'turns' : 'output',
          slips: [b, b - a, b - a + 2, a + b] };
      }
    } else if (level === 3) {
      var st = R(2, 3), a3 = R(1, 3), turns = R(3, 5), b3 = a3 + st * (turns - 1) + R(0, st - 1), body3 = pick(['c = c + 1', 's = s + i']);
      var v3 = body3.charAt(0);
      p = { v: v3, lines: [v3 + ' = 0', 'FOR i = ' + a3 + ' TO ' + b3 + ' STEP ' + st, '  ' + body3, 'NEXT i', 'OUTPUT ' + v3], ask: body3 === 'c = c + 1' ? pick(['turns', 'output']) : pick(['turns', 'output', 'output']),
        slips: [b3, b3 - a3 + 1, turns + 1, turns - 1] };
    } else {
      if (Math.random() < 0.5) {
        var n4 = R(3, 5), x0 = pick([1, 2, 3]);
        p = { v: 'x', lines: ['x = ' + x0, 'FOR i = 1 TO ' + n4, '  x = x * 2', 'NEXT i', 'OUTPUT x'], ask: 'output',
          slips: [x0 * 2 * n4, x0 * Math.pow(2, n4 - 1), x0 * Math.pow(2, n4 + 1), x0 + 2 * n4] };
      } else {
        var st4 = 2, a4 = pick([1, 2]), t4 = R(3, 5), b4 = a4 + st4 * (t4 - 1) + R(0, 1);
        p = { v: 't', lines: ['t = 0', 'FOR i = ' + a4 + ' TO ' + b4 + ' STEP ' + st4, '  t = t + i', 'NEXT i', 'OUTPUT t'], ask: 'output',
          slips: [b4, t4, t4 * b4] };
      }
    }
    return p;
  }
  function loopQ(level, ask) {
    level = level || 1;
    var p = loopProgram(level);
    if (ask) p.ask = ask;
    var r = A.run(p.lines.join('\n'), { trace: true });
    if (r.error) throw new Error('loopQ: ' + r.error.message);
    var ev = r.events, laps = [], i = null;
    ev.forEach(function (e) {
      if (e.type !== 'assign') return;
      if (e.name === 'i' && (e.kind === 'for-start' || e.kind === 'for-next') && !e.final) i = e.value;
      if (e.name === p.v && e.line === 3) laps.push({ i: i, value: e.value });
    });
    var start = ev.filter(function (e) { return e.type === 'assign' && e.name === p.v && e.line === 1; })[0].value;
    var out = Number(r.outputs[0]), turns = laps.length, isTurns = p.ask === 'turns';
    var ans = isTurns ? turns : out;
    var iVals = laps.map(function (x) { return x.i; });
    var wrong = wrongNums(ans, isTurns ? [turns + 1, turns - 1, iVals[iVals.length - 1]] : p.slips.concat([laps.length > 1 ? laps[laps.length - 2].value : start]));
    var steps = ['Start: ' + p.v + ' = ' + start + '.'].concat(laps.map(function (x, k) { return 'Turn ' + (k + 1) + ': i = ' + x.i + ', so ' + p.v + ' becomes ' + x.value + '.'; }));
    steps.push(isTurns ? 'The loop body ran ' + turns + ' times.' : 'OUTPUT ' + p.v + ' shows ' + out + '.');
    var head = p.lines[1];
    return { topic: 'loops', kind: 'loop', level: level, lines: p.lines, v: p.v, start: start, laps: laps, turns: turns, output: out, ask: p.ask,
      prompt: isTurns ? 'How many times does line 3 run?' : 'What does this program output?', show: { type: 'code', lines: p.lines },
      answer: String(ans), re: isTurns ? numRe(ans, { unit: 'times|turns?|laps?' }) : numRe(ans, { name: p.v }), wrong: wrong, steps: steps,
      working: isTurns ? ['Write down each value of i: start at the first number, add the STEP (1 if there is no STEP) each time.', 'Stop before i goes past the end number. Count the values.']
        : ['Write down each value of i, then work out ' + p.v + ' after each turn.', 'Each turn starts from the last value of ' + p.v + '. OUTPUT shows ' + p.v + ' once the loop has finished.'],
      format: 'Type a number', note: steps[steps.length - 1] };
  }

  // ---------------------------------------------------------------- one entry point
  // kind: 'postfix', 'prefix', 'to-postfix', 'to-prefix', 'bits-<kind>' (BIT_KINDS), 'loop'. level 1 to 4.
  function question(kind, level, extra) {
    if (kind === 'postfix' || kind === 'prefix') return evalQ(kind, Math.min(level || 1, 3));
    if (kind === 'to-postfix' || kind === 'to-prefix') return convQ(kind.slice(3), Math.min(level || 1, 3));
    if (kind.indexOf('bits-') === 0) return bitsQ(kind.slice(5), (extra && extra.len) || (level === 1 ? 4 : 5));
    if (kind === 'loop') return loopQ(level || 1, extra && extra.ask);
    throw new Error('question: unknown kind ' + kind);
  }
  // A similar question of the same kind, with a different answer that appears nowhere in it (for worked examples).
  function similar(kind, level, q, extra) {
    var a = String(q.answer).toLowerCase();
    var mentions = new RegExp('(^|[^a-z0-9])' + escRe(a) + '($|[^a-z0-9])');
    for (var i = 0; i < 200; i++) {
      var e = question(kind, level, extra);
      var text = (e.prompt + ' ' + (e.show.text || e.show.lines.join(' ')) + ' ' + e.steps.join(' ') + ' ' + e.answer).toLowerCase();
      var key = e.show.text || e.show.lines.join('|'), qkey = q.show.text || q.show.lines.join('|');
      if (key !== qkey && String(e.answer) !== String(q.answer) && (a.length < 3 || !mentions.test(text))) return e;
    }
    return null;
  }

  return { rand: rand, R: R, pick: pick, shuffle: shuffle, numRe: numRe, bitsRe: bitsRe, same: same, wrongNums: wrongNums,
    evalQ: evalQ, convQ: convQ, bitsQ: bitsQ, loopQ: loopQ, question: question, similar: similar, BIT_KINDS: BIT_KINDS, BIT_RULE: BIT_RULE,
    stepText: stepText, moved: moved };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CompGenY7;
