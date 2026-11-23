// Prefix, Infix and Postfix animations: every frame the page shows, worked out by NotationLab/core.js.
// convert(): infix to postfix or prefix the way the lesson teaches it (brackets round every operation in the order
// you work it out, move each operator to the end or front of its own brackets, remove the brackets).
// stack(): one frame per token from NotationCore.stackSteps. question(): a Four Corners question with three wrong
// corners that are common slips. Checked by tools/test_notation_anim.mjs.
var NotationAnim = (function () {
  'use strict';
  var NC = typeof NotationCore !== 'undefined' ? NotationCore : require('../NotationLab/core.js');

  // Expressions for the Four Corners questions (single digits, whole numbers all the way).
  var EXAMPLES = ['(8 - 2) * 3 + 4', '9 - 6 / 3', '(9 - 3) / 2', '8 / (4 - 2)', '2 + 3 * 4', '(7 - 4) * (5 + 1)',
    '6 * 2 - 8 / 4', '(5 + 3) * 2 - 6', '9 - 4 - 3', '8 - 2 * 3', '(6 + 2) / 4 + 5', '7 - (5 - 1)', '4 * (9 - 6) - 2',
    '9 - 6 + 3 * 2', '3 * 4 - 8 / 2'];

  // The operations in the order you work them out (left part, right part, then the operator itself).
  function workOrder(t) { var out = []; (function go(n) { if (!n.op) return; go(n.l); go(n.r); out.push(n); })(t); return out; }

  // Chips: one per value and operator, and a bracket pair per operation. ids: v0.., o0.., L0../R0..
  function convert(t, target) {
    var ops = workOrder(t), chips = [], vi = 0;
    var idOf = new Map();
    (function name(n) { if (!n.op) { idOf.set(n, 'v' + (vi++)); chips.push({ id: idOf.get(n), text: n.v, kind: 'val' }); return; } name(n.l); name(n.r); })(t);
    ops.forEach(function (n, k) {
      idOf.set(n, 'o' + k);
      chips.push({ id: 'o' + k, text: n.op, kind: 'op' }, { id: 'L' + k, text: '(', kind: 'br' }, { id: 'R' + k, text: ')', kind: 'br' });
    });
    var br = new Set(), moved = new Set(), on = true;
    // Brackets the infix already needs.
    (function mark(n) { if (!n.op) return; [['l', n.l], ['r', n.r]].forEach(function (s) { if (NC.needs(s[1], n.op, s[0])) br.add(s[1]); }); mark(n.l); mark(n.r); })(t);
    function order() {
      return (function go(n) {
        if (!n.op) return [idOf.get(n)];
        var id = idOf.get(n), k = id.slice(1), l = go(n.l), r = go(n.r);
        var inner = !moved.has(n) ? l.concat([id], r) : target === 'prefix' ? [id].concat(l, r) : l.concat(r, [id]);
        return on && br.has(n) ? ['L' + k].concat(inner, ['R' + k]) : inner;
      })(t);
    }
    var textOf = {}; chips.forEach(function (c) { textOf[c.id] = c.text; });
    function frame(note, focus, step) {
      var o = order();
      return { order: o, text: o.map(function (id) { return textOf[id]; }).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')'), note: note, focus: focus || [], step: step };
    }
    var where = target === 'prefix' ? 'front' : 'end';
    var frames = [frame('Infix: ' + NC.toInfix(t) + '. Step 1: brackets round every operation, in the order you work it out.', [], 1)];
    ops.forEach(function (n) {
      var k = idOf.get(n).slice(1), part = NC.toInfix(n);
      if (br.has(n)) { frames.push(frame('Work out ' + part + ' first. It already has brackets.', ['L' + k, 'o' + k, 'R' + k], 1)); return; }
      br.add(n);
      frames.push(frame('Next: ' + part + '. Put brackets round it.', ['L' + k, 'o' + k, 'R' + k], 1));
    });
    frames.push(frame('Step 2: move each operator to the ' + where + ' of its own brackets.', [], 2));
    ops.forEach(function (n) {
      var k = idOf.get(n).slice(1);
      moved.add(n);
      frames.push(frame('Move ' + n.op + ' to the ' + where + ' of its brackets.', ['L' + k, 'o' + k, 'R' + k], 2));
    });
    on = false;
    var ans = NC.show(target === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    frames.push(frame('Step 3: remove the brackets. ' + (target === 'prefix' ? 'Prefix: ' : 'Postfix: ') + ans, [], 3));
    return { chips: chips, frames: frames, answer: ans };
  }

  // One frame per token. Notes use the lesson's words.
  function stack(list, form) {
    return NC.stackSteps(list, form).map(function (s) {
      s.note = s.kind === 'push' ? 'Push ' + s.value + '.'
        : 'Pop ' + s.first + ', pop ' + s.second + ': ' + s.left + ' ' + s.token + ' ' + s.right + ' = ' + s.value + '. Push it.';
      return s;
    });
  }

  // An infix the page can animate: single digits, 1 to 5 operators, every value along the way a whole number.
  function check(str) {
    var tk = NC.tokens(str);
    if (!tk || tk.some(function (x) { return /[A-Z]/.test(x); })) return null;
    var t = NC.parseInfix(tk);
    if (!t || NC.opCount(t) < 1 || NC.opCount(t) > 5) return null;
    var ok = stack(NC.toPostfix(t), 'postfix').every(function (s) { return isFinite(s.value) && Math.round(s.value) === s.value && Math.abs(s.value) < 1000; });
    return ok ? t : null;
  }

  // ------------------------------------------------ Four Corners
  // Infix read from left to right with no order of operations (brackets kept).
  function flatParse(list) {
    var p = 0;
    function prim() { var x = list[p]; if (x === '(') { p++; var e = ex(); p++; return e; } p++; return NC.leaf(x); }
    function ex() { var l = prim(); while (p < list.length && NC.isOp(list[p])) { var op = list[p++]; l = NC.node(op, l, prim()); } return l; }
    return ex();
  }
  function infixTokens(t) { return NC.tokens(NC.toInfix(t)); }
  function noBrackets(t) { return NC.parseInfix(infixTokens(t).filter(function (x) { return x !== '(' && x !== ')'; })); }
  var KINDS = ['postfix', 'prefix', 'evalPostfix', 'evalPrefix'];
  // Returns { kind, prompt, shown, answers[4], right (index), why[4], tree } or null when three different slips cannot be made.
  function question(t, kind, shuffle) {
    var form = kind === 'prefix' || kind === 'evalPrefix' ? 'prefix' : 'postfix';
    var write = function (x) { return NC.show(form === 'prefix' ? NC.toPrefix(x) : NC.toPostfix(x)); };
    var list = form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t), right, cands, prompt, shown;
    if (kind === 'postfix' || kind === 'prefix') {
      var vals = list.filter(function (x) { return !NC.isOp(x); }), ops = infixTokens(t).filter(function (x) { return NC.isOp(x); });
      right = write(t);
      prompt = 'Write this infix in ' + form + '.'; shown = NC.toInfix(t);
      cands = [[write(flatParse(infixTokens(t))), 'This works from left to right. It forgets that * and / come before + and -.'],
        [write(noBrackets(t)), 'This ignores the brackets.'],
        [NC.show(form === 'prefix' ? NC.toPostfix(t) : NC.toPrefix(t)), 'This is ' + (form === 'prefix' ? 'postfix' : 'prefix') + ', not ' + form + '.'],
        [NC.show(form === 'prefix' ? ops.concat(vals) : vals.concat(ops)), 'The operators are moved all together, not one at a time into their own brackets.']];
    } else {
      var last = function (steps) { return steps[steps.length - 1].stack[0]; };
      right = String(NC.evaluate(t));
      prompt = 'Work out this ' + form + ' expression.'; shown = NC.show(list);
      var st = stack(list, form), before = st.length > 1 ? st[st.length - 2].stack : [];
      cands = [[String(last(NC.stackSteps(list, form, true))), 'The two popped values are the wrong way round.'],
        [String(NC.evaluate(flatParse(infixTokens(t)))), 'This does the operations from left to right in the infix. The stack order is different.'],
        [String(NC.evaluate(noBrackets(t))), 'This loses the brackets. The part in brackets must be worked out first.'],
        [before.length === 1 ? null : String(before[before.length - 1]), 'This stops before the last operator.']];
    }
    var answers = [right], why = ['Right.'];
    cands.forEach(function (c) {
      if (answers.length < 4 && c[0] != null && c[0] !== 'NaN' && answers.indexOf(c[0]) < 0 && (form === kind || Number.isInteger(Number(c[0])))) { answers.push(c[0]); why.push(c[1]); }
    });
    if (answers.length < 4) return null;
    var idx = [0, 1, 2, 3];
    if (shuffle) for (var i = 3; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = idx[i]; idx[i] = idx[j]; idx[j] = x; }
    return { kind: kind, form: form, prompt: prompt, shown: shown, tree: t, list: list,
      answers: idx.map(function (k) { return answers[k]; }), why: idx.map(function (k) { return why[k]; }), right: idx.indexOf(0) };
  }
  function allQuestions() {
    var out = [];
    EXAMPLES.forEach(function (e) { KINDS.forEach(function (k) { var q = question(check(e), k, false); if (q) out.push({ expr: e, kind: k }); }); });
    return out;
  }

  return { EXAMPLES: EXAMPLES, KINDS: KINDS, workOrder: workOrder, convert: convert, stack: stack, check: check,
    flatParse: flatParse, question: question, allQuestions: allQuestions };
})();
if (typeof module === 'object' && module && module.exports) module.exports = NotationAnim;
