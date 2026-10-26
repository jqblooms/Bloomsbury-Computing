// Competition Arcade (Year 8) question generators: ACSL Junior Contest 2 at Year 8 level, every answer worked out
// in code. Notation uses NotationLab/core.js (NotationCore), bit strings BitFlicker/bits-core.js (BitCore), loops
// LoopTracer/js/programs.js (ACSLLoops) run by shared/acsl-pseudocode.js (ACSLPseudo): the same code the
// Competition lessons use, so the rules and the notation are theirs.
// tools/build_y8_comp.mjs copies this file into the y8-comp-practice drills, so it must stay plain ES5 with no DOM.
//   Y8Gen.question(kind, level) -> { kind, topic, level, ask, show, lines, answer, keyword (RegExp), check(typed),
//                                    why: [steps], hint, distractors: [3], example, working: [2], format }
// Kinds: post-eval, pre-eval, to-post, to-pre (notation); bits-logic, bits-shift, bits-chain (bit strings);
//        loop (loops). Levels 1 to 4 (loop levels follow LOOP_LEVELS).
var Y8Gen = (function () {
  'use strict';
  var NC = NotationCore, BC = BitCore, POW = NC.POW;
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var FOUR = ['+', '-', '*', '/'];

  // ---------------------------------------------------------------- marking
  // A number, with an optional minus sign of either kind and an optional full stop.
  function numRe(n) { return new RegExp('^\\s*' + (n < 0 ? '[-\\u2212]\\s*' : '') + reEsc(Math.abs(n)) + '\\s*\\.?\\s*$'); }
  function numCheck(n) { return function (s) { return numRe(n).test(String(s == null ? '' : s)); }; }
  // A bit string: the bits with optional spaces between them.
  function bitsRe(b) { return new RegExp('^\\s*' + b.split('').join('\\s*') + '\\s*\\.?\\s*$'); }
  // Prefix or postfix: the tokens in order; spaces, commas, x or the times sign for *, ^ for the power arrow.
  function seqCheck(list) { return function (s) { var t = NC.tokens(String(s == null ? '' : s).replace(/\.\s*$/, '')); return !!t && t.join('') === list.join(''); }; }

  // ---------------------------------------------------------------- notation
  var NOTE_LEVEL = {
    1: { n: 2, ops: FOUR, max: 50 },
    2: { n: 3, ops: FOUR, max: 60 },
    3: { n: 4, ops: FOUR, max: 99 },
    4: { n: [4, 5], ops: FOUR.concat([POW]), max: 150, mustPow: true }
  };
  function size(n) { return Array.isArray(n) ? R(n[0], n[1]) : n; }
  function numberTree(level) {
    var o = NOTE_LEVEL[level] || NOTE_LEVEL[1];
    return NC.randomTree({ n: size(o.n), ops: o.ops, max: o.max, noNeg: level < 3, mustUse: o.mustPow ? [POW] : null });
  }
  // One line per operator (the numbers are pushed as they are read): what it pops, works out and leaves on the stack.
  function stackLines(list, form) {
    return NC.stackSteps(list, form).filter(function (s) { return s.kind !== 'push'; }).map(function (s) {
      return s.token + ': ' + s.left + ' ' + s.token + ' ' + s.right + ' = ' + s.value + '   stack: ' + s.stack.join(' ');
    });
  }
  function evalQ(kind, level) {
    var pre = kind === 'pre-eval', form = pre ? 'prefix' : 'postfix';
    var t = numberTree(level), list = pre ? NC.toPrefix(t) : NC.toPostfix(t), ans = NC.evaluate(t);
    var swapped = NC.stackSteps(list, form, true).slice(-1)[0].value;
    var wrong = [];
    [swapped, ans + 1, ans - 1, ans * 2, ans + 2, ans - 2].forEach(function (w) {
      if (typeof w === 'number' && isFinite(w) && w !== ans && Math.floor(w) === w && wrong.indexOf(String(w)) < 0 && wrong.length < 3) wrong.push(String(w));
    });
    return {
      kind: kind, topic: 'notation', level: level, ask: 'Work out the value of this ' + form + ' expression.',
      show: NC.show(list), answer: String(ans), keyword: numRe(ans), check: numCheck(ans), distractors: wrong,
      why: [pre ? 'Read from the right. Push each number. An operator pops two: the first one popped goes on the LEFT.'
        : 'Read from the left. Push each number. An operator pops two: the first one popped goes on the RIGHT.'].concat(stackLines(list, form)),
      hint: pre ? 'Start at the right-hand end and use a stack.' : 'Start at the left-hand end and use a stack.',
      working: pre ? ['Read the tokens from right to left. Push each number onto a stack.', 'An operator pops two numbers. The first one popped goes on the left.']
        : ['Read the tokens from left to right. Push each number onto a stack.', 'An operator pops two numbers. The first one popped goes on the right.'],
      format: 'Type a number', exampleOf: function () { return evalQ(kind, Math.max(1, level - 1)); }
    };
  }
  function letterTree(level) {
    var n = level === 1 ? 2 : level === 2 ? 3 : level === 3 ? R(3, 4) : 4;
    for (var k = 0; k < 400; k++) {
      var implied = level === 4 && Math.random() < 0.5;
      var t = NC.randomTree({ n: n, ops: level === 4 && !implied ? FOUR.concat([POW]) : FOUR, letters: true, digitChance: implied ? 0.35 : 0,
        mustUse: level === 4 && !implied ? [POW] : null });
      var text = NC.toInfix(t, { implied: implied });
      if (text.indexOf('(') < 0) continue;
      if (implied && text === NC.toInfix(t)) continue;
      return { t: t, text: text, implied: implied };
    }
    throw new Error('Y8Gen: no letter tree at level ' + level);
  }
  // The answer with its first (or last) two different values swapped: the slip of mixing up the operand order.
  function swapVals(list, fromEnd) {
    var idx = [];
    list.forEach(function (x, i) { if (!NC.isOp(x)) idx.push(i); });
    if (fromEnd) idx.reverse();
    for (var k = 0; k + 1 < idx.length; k++) {
      if (list[idx[k]] !== list[idx[k + 1]]) { var c = list.slice(), t = c[idx[k]]; c[idx[k]] = c[idx[k + 1]]; c[idx[k + 1]] = t; return c; }
    }
    return null;
  }
  function convQ(kind, level) {
    var post = kind === 'to-post', form = post ? 'postfix' : 'prefix';
    var lt = letterTree(level), t = lt.t, list = post ? NC.toPostfix(t) : NC.toPrefix(t), ans = NC.show(list);
    var flat = NC.parseInfix(lt.text.replace(/[()]/g, ' '));
    var key = function (l) { return l.join(''); };
    var wrong = [];
    [flat && (post ? NC.toPostfix(flat) : NC.toPrefix(flat)), post ? NC.toPrefix(t) : NC.toPostfix(t),
      (post ? NC.toPostfix : NC.toPrefix)(NC.node(t.op, t.r, t.l)),
      list.filter(function (x) { return !NC.isOp(x); }).concat(list.filter(NC.isOp)),
      swapVals(list, false), swapVals(list, true), list.slice().reverse()].forEach(function (w) {
      if (w && key(w) !== key(list) && wrong.every(function (x) { return x.replace(/\s/g, '') !== key(w); }) && wrong.length < 3) wrong.push(NC.show(w));
    });
    var moved = (function go(n) { if (!n.op) return n.v; var l = go(n.l), r = go(n.r); return '(' + (post ? l + ' ' + r + ' ' + n.op : n.op + ' ' + l + ' ' + r) + ')'; })(t);
    return {
      kind: kind, topic: 'notation', level: level, ask: 'Write this infix expression in ' + form + '.',
      show: lt.text, answer: ans, keyword: new RegExp(NC.seqRe(list).replace('\\s*$', '\\s*\\.?\\s*$'), 'i'), check: seqCheck(list), distractors: wrong,
      why: (lt.implied ? ['A number next to a letter or a bracket means multiply: ' + NC.toInfix(t)] : []).concat([
        'Put brackets round every operation, in the order the rules work them out: ' + NC.toInfix(t, { full: true }),
        'Move each operator ' + (post ? 'to the end' : 'to the front') + ' of its own brackets: ' + moved,
        'Take the brackets away: ' + ans]),
      hint: 'Put brackets round every operation first.',
      working: ['Put brackets round every operation, in the order the rules work them out.' + (lt.implied ? ' A number next to a letter or a bracket means multiply.' : ''),
        'Start with the inside brackets. Move each operator ' + (post ? 'after' : 'before') + ' its two values.'],
      format: 'Type the ' + form + ' expression', exampleOf: function () { return convQ(kind, Math.max(1, level - 1)); }
    };
  }

  // ---------------------------------------------------------------- bit strings
  function rb(n) {
    for (;;) { var s = ''; for (var i = 0; i < n; i++) s += R(0, 1); if (/0/.test(s) && /1/.test(s)) return s; }
  }
  var LOGIC = ['AND', 'OR', 'XOR'];
  var MOVES = ['LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC'];
  function mv(k) { return pick(MOVES) + '-' + R(1, k || 3); }
  // Templates by kind and level: S is a fresh bit string, M a shift or circulate, L a logic operator.
  var BIT_T = {
    'bits-logic': {
      1: { len: 5, forms: ['NOT S', 'S L S'] },
      2: { len: 6, forms: ['NOT S L S', 'S L NOT S'] },
      3: { len: 7, forms: ['S AND S OR S', 'S OR S AND S', 'S XOR S AND S', 'NOT S XOR S OR S'] },
      4: { len: 8, forms: ['NOT (S L S) L S', 'S L NOT (S L S)', '(S OR S) AND NOT S'] }
    },
    'bits-shift': {
      1: { len: 5, forms: ['M S'], k: 2 },
      2: { len: 6, forms: ['M S'], k: 3 },
      3: { len: 7, forms: ['M M S', 'NOT M S', 'M NOT S'], k: 3 },
      4: { len: 8, forms: ['M M S', 'BIG S', 'NOT M M S'], k: 3 }
    },
    'bits-chain': {
      1: { len: 5, forms: ['M S L S', 'S L M S'], k: 2 },
      2: { len: 6, forms: ['NOT S L M S', 'M S L NOT S'], k: 3 },
      3: { len: 7, forms: ['(M S L S) AND NOT S', 'M (S L S) OR S', 'M S XOR S AND M S'], k: 3 },
      4: { len: 8, forms: ['M (S L S) XOR M S AND S', 'NOT (M S OR S) AND M S', 'M (NOT S L M S)'], k: 3 }
    }
  };
  function fill(form, len, k) {
    return form.split(' ').map(function (w) {
      var open = '', close = '';
      while (w.charAt(0) === '(') { open += '('; w = w.slice(1); }
      while (w.charAt(w.length - 1) === ')') { close += ')'; w = w.slice(0, -1); }
      var v = w === 'S' ? rb(len) : w === 'L' ? pick(LOGIC) : w === 'M' ? mv(k) : w === 'BIG' ? pick(['LCIRC', 'RCIRC']) + '-' + (len + R(1, 3)) : w;
      return open + v + close;
    }).join(' ');
  }
  function flip(s, i) { return s.slice(0, i) + (s.charAt(i) === '1' ? '0' : '1') + s.slice(i + 1); }
  function bitsQ(kind, level) {
    var T = BIT_T[kind][level] || BIT_T[kind][1];
    for (var tries = 0; tries < 400; tries++) {
      var text = fill(pick(T.forms), T.len, T.k), ans;
      try { ans = BC.evaluate(text); } catch (e) { continue; }
      if (!/0/.test(ans) || !/1/.test(ans)) continue;
      // An answer that is one of the strings already shown could be copied without working it out.
      if ((text.match(/[01]+/g) || []).indexOf(ans) !== -1) continue;
      var steps = BC.trace(text);
      if (steps.some(function (s) { return /^0+$|^1+$/.test(s.result); }) && level < 3) continue;
      var wrong = [];
      var swapText = text.replace(/LSHIFT|RSHIFT|LCIRC|RCIRC/, function (m) { return { LSHIFT: 'LCIRC', RSHIFT: 'RCIRC', LCIRC: 'LSHIFT', RCIRC: 'RSHIFT' }[m]; });
      var dirText = text.replace(/\b(L|R)(SHIFT|CIRC)/, function (m, d, w) { return (d === 'L' ? 'R' : 'L') + w; });
      var cands = [];
      try { cands.push(BC.evaluate(swapText)); } catch (e) {}
      try { cands.push(BC.evaluate(dirText)); } catch (e) {}
      cands.push(BC.not(ans), flip(ans, 0), flip(ans, ans.length - 1), flip(ans, 2));
      cands.forEach(function (w) { if (w !== ans && wrong.indexOf(w) < 0 && wrong.length < 3) wrong.push(w); });
      var L = ans.length;
      return {
        kind: kind, topic: 'bits', level: level, ask: 'Evaluate this bit-string expression.',
        show: text, answer: ans, keyword: bitsRe(ans), check: (function (a) { return function (s) { return bitsRe(a).test(String(s == null ? '' : s)); }; })(ans),
        distractors: wrong,
        why: ['Order: brackets, then NOT and the shifts and circulates (right to left), then AND, then XOR, then OR.'].concat(steps.map(function (s) { return s.text; })),
        hint: 'Find the operator next to the bits first. NOT, shifts and circulates go before AND, XOR and OR.',
        working: ['Work brackets first. Then NOT, the shifts and the circulates, starting with the one next to its bits.',
          'Then AND, then XOR, then OR. Write each step as a new ' + L + '-bit string.'],
        format: 'Type ' + L + ' bits', exampleOf: function () { return bitsQ(kind, Math.max(1, level - 1)); }
      };
    }
    throw new Error('Y8Gen: no bit question ' + kind + ' ' + level);
  }

  // ---------------------------------------------------------------- loops
  // Loop Tracer levels for each Year 8 level: FOR accumulators, STEP, WHILE, nested loops; 5 is IF inside a loop.
  var LOOP_LEVELS = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 4 };
  var LOOP_ROWS = { 1: 14, 2: 16, 3: 16, 4: 22, 5: 30 };
  function slips(lines) {
    var out = [];
    lines.forEach(function (l, i) {
      var m, vars = [];
      if ((m = /^(\s*FOR \w+ = .+ TO )(\d+)(.*)$/.exec(l))) vars.push(m[1] + (Number(m[2]) - 1) + m[3], m[1] + (Number(m[2]) + 1) + m[3]);
      if ((m = /^(\s*WHILE .*?)(<=|>=|<|>)(.*)$/.exec(l))) vars.push(m[1] + { '<': '<=', '<=': '<', '>': '>=', '>=': '>' }[m[2]] + m[3]);
      if (/^\w = 0\b/.test(l)) vars.push(l.replace(/^(\w) = 0/, '$1 = 1'));
      vars.forEach(function (v) { var c = lines.slice(); c[i] = v; out.push(c); });
    });
    return out;
  }
  function loopQ(level) {
    var lt = LOOP_LEVELS[level] || 1;
    var p = ACSLLoops.make(lt, { maxRows: LOOP_ROWS[level] || 16 });
    var ans = p.output, n = Number(ans), isNum = /^-?\d+(\.\d+)?$/.test(ans);
    var wrong = [];
    slips(p.lines).forEach(function (ls) {
      var r = ACSLPseudo.run(ls.join('\n'), { maxSteps: 50000 });
      if (!r.error && r.outputs.length === 1 && r.outputs[0] !== ans && wrong.indexOf(r.outputs[0]) < 0 && wrong.length < 3 &&
        /^-?\d+(\.\d+)?$/.test(r.outputs[0]) === isNum) wrong.push(r.outputs[0]);
    });
    if (isNum) [n + 1, n - 1, n * 2, n + 2].forEach(function (x) { if (wrong.length < 3 && String(x) !== ans && wrong.indexOf(String(x)) < 0) wrong.push(String(x)); });
    else ['0', ans.split('').reverse().join(''), ans + ans.charAt(ans.length - 1)].forEach(function (x) { if (wrong.length < 3 && x !== ans && wrong.indexOf(x) < 0) wrong.push(x); });
    var kw = isNum ? numRe(n) : new RegExp('^\\s*["\']?' + reEsc(ans) + '["\']?\\s*\\.?\\s*$', 'i');
    var vals = ACSLPseudo.run(p.src).vars;
    return {
      kind: 'loop', topic: 'loops', level: level, skill: p.skill, ask: 'What does this program output?',
      show: p.src, lines: p.lines, rows: p.rows, answer: ans, keyword: kw, check: function (s) { return kw.test(String(s == null ? '' : s)); },
      distractors: wrong,
      why: ['Trace it: a column for each variable, a new row each time a value changes.',
        'At the end: ' + Object.keys(vals).map(function (k) { return k + ' = ' + ACSLPseudo.format(vals[k]); }).join(', '), 'Output: ' + ans],
      hint: 'Write the variables as columns. Add a row each time one changes.',
      working: ['Write the variables as columns. Add a row each time one changes.',
        lt === 5 ? 'The inner loop runs all the way through for every turn of the outer loop.' : lt === 3 ? 'Check the WHILE condition before every turn. Stop as soon as it is false.' : 'Follow the loop exactly: check the end value before every turn.'],
      format: isNum ? 'Type a number' : 'Type the output', exampleOf: function () { return loopQ(Math.max(1, level - 1)); }
    };
  }

  // ---------------------------------------------------------------- one question, with a worked example on another
  function make(kind, level) {
    if (kind === 'post-eval' || kind === 'pre-eval') return evalQ(kind, level);
    if (kind === 'to-post' || kind === 'to-pre') return convQ(kind, level);
    if (kind === 'bits-logic' || kind === 'bits-shift' || kind === 'bits-chain') return bitsQ(kind, level);
    if (kind === 'loop') return loopQ(level);
    throw new Error('Y8Gen: unknown kind ' + kind);
  }
  function exampleText(q, ex) {
    var head = 'Example: ' + ex.ask + '\n' + ex.show;
    var steps = ex.topic === 'loops'
      ? ['Trace it: write each new value in a table.', ex.rows.map(function (r) { return r.name === 'OUTPUT' ? 'output ' + r.value : r.name + ' = ' + (r.value === '' ? '""' : r.value); }).join(', ')]
      : ex.why;
    return head + '\n' + steps.join('\n') + '\nSo the example gives ' + ex.answer + '.';
  }
  // Lines of the question that the example repeats (the drills reject an example that copies its question).
  function copied(q, text) {
    return (q.ask + '\n' + q.show).split('\n').filter(function (l) { return l.trim().length > 12 && text.indexOf(l.trim().toLowerCase()) >= 0; }).length;
  }
  function question(kind, level, avoid) {
    level = level || 1;
    for (var tries = 0; tries < 60; tries++) {
      var q = make(kind, level);
      if (avoid && avoid.indexOf(q.show) !== -1) continue;
      var ex = null;
      for (var j = 0; j < 30; j++) {
        var e = q.exampleOf();
        var whole = new RegExp('(^|[^a-z0-9*])' + reEsc(q.answer.toLowerCase()) + '($|[^a-z0-9*])');
        var text = exampleText(q, e).toLowerCase();
        if (e.show !== q.show && e.answer !== q.answer && (q.answer.length < 3 || !whole.test(text)) && copied(q, text) < 2 && !(q.answer.replace(/\s/g, '').length >= 3 && text.replace(/\s/g, '').indexOf(q.answer.replace(/\s/g, '').toLowerCase()) >= 0)) { ex = e; break; }
      }
      if (!ex) continue;
      q.example = exampleText(q, ex);
      delete q.exampleOf;
      return q;
    }
    throw new Error('Y8Gen: no clean question for ' + kind + ' ' + level);
  }

  return { question: question, KINDS: ['post-eval', 'pre-eval', 'to-post', 'to-pre', 'bits-logic', 'bits-shift', 'bits-chain', 'loop'],
    LOOP_LEVELS: LOOP_LEVELS, R: R, pick: pick, numRe: numRe, bitsRe: bitsRe };
})();
if (typeof module === 'object' && module && module.exports) module.exports = Y8Gen;
