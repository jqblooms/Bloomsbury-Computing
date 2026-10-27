// NotationLab "Walk me through it" (James 2026-10-27: "All modes need effective 'walk me through it' step by step
// guides"; students were guessing and could not work out the order to click things). Every mode has the button on
// every question. It opens a step by step on a SIMILAR question of the same kind and level with different values,
// made by the same NotationCore code, never the student's own question or its answer (pick() checks both, and
// tools/test_notation_walk.mjs runs it thousands of times). Each step says what to do and why, with the state at that
// step drawn: the stack, the tokens grouped so far, the brackets added, the operators moved. Use is logged.
// The step makers are plain functions (no page needed), so node can test them; open() and button() draw them.
var NLWalk = (function (NC) {
  'use strict';
  var POW = NC.POW;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function b(s) { return '<b class="calc">' + esc(s) + '</b>'; }
  function tile(tk, cls) { return '<span class="tok' + (NC.isOp(tk) ? ' op' : '') + (cls ? ' ' + cls : '') + '">' + esc(tk) + '</span>'; }
  function strip(html) { return '<div class="strip">' + html + '</div>'; }
  function powNote(op, l, r) { return op === POW ? ' (' + l + ' ' + POW + ' ' + r + ' means ' + r + ' copies of ' + l + ' multiplied together.)' : ''; }

  // ------------------------------------------------ Stack Machine: evaluate prefix or postfix with a stack
  function stackVis(list, form, now, done, stack, tray) {
    var row = list.map(function (tk, i) { return tile(tk, (done[i] ? 'done' : '') + (i === now ? ' now' : '')); }).join('');
    var well = stack.length ? stack.slice().reverse().map(function (v, j) { return '<div class="stack-item' + (j === 0 ? ' top' : '') + '">' + esc(v) + '</div>'; }).join('') :
      '<div class="small" style="text-align:center">empty</div>';
    return '<div class="machine wt-machine"><div><div class="read-dir">Read from ' + (form === 'prefix' ? 'right to left' : 'left to right') + '</div>' + strip(row) +
      (tray ? '<div class="tray">' + tray + '</div>' : '') + '</div><div class="stack-col"><div class="stack-title">Stack</div><div class="stack-well">' + well + '</div></div></div>';
  }
  function popped(a, c) { return '<span class="popped"><b>' + esc(a) + '</b><span>1st pop</span></span><span class="popped"><b>' + esc(c) + '</b><span>2nd pop</span></span>'; }
  function stack(list, form) {
    var steps = NC.stackSteps(list, form), out = [], done = {};
    out.push({ text: form === 'prefix' ?
      'This is <b>prefix</b>, so read it from <b>right to left</b>. Why: in prefix each operator is written before its two values, so reading from the right meets the values before the operator that needs them. A number: push it. An operator: pop two values, work them out, push the answer.' :
      'This is <b>postfix</b>, so read it from <b>left to right</b>. Why: in postfix each operator is written after its two values, so the values are already waiting when the operator arrives. A number: push it. An operator: pop two values, work them out, push the answer.',
      html: stackVis(list, form, -1, done, [], '') });
    steps.forEach(function (s, k) {
      var before = k ? steps[k - 1].stack : [];
      if (s.kind === 'push') {
        out.push({ text: 'Read ' + b(s.token) + '. It is a number, so <b>push</b> it on top of the stack. Why: a number waits on the stack until an operator needs it.', html: stackVis(list, form, s.i, done, s.stack, '') });
      } else {
        out.push({ text: 'Read ' + b(s.token) + '. It is an operator, so <b>pop two</b> values. The 1st pop is the top value, ' + b(s.first) + '. The 2nd pop is ' + b(s.second) + '.',
          html: stackVis(list, form, s.i, done, before.slice(0, -2), popped(s.first, s.second)) });
        var why = form === 'prefix' ?
          'Which way round? In prefix the <b>1st pop goes on the left</b>. Why: reading from the right, the value written first is pushed last, so it comes off first, and the value written first is the left one.' :
          'Which way round? In postfix the <b>1st pop goes on the right</b>. Why: the value written first was pushed first, so it is underneath and comes off second. The value written first is the left one.';
        out.push({ text: why + ' So work out ' + b(s.left + ' ' + s.token + ' ' + s.right) + ' = ' + b(s.value) + powNote(s.token, s.left, s.right) + ' and push ' + b(s.value) + '.',
          html: stackVis(list, form, s.i, done, s.stack, popped(s.first, s.second) + '<span class="calc wt-hl-text">' + esc(s.left + ' ' + s.token + ' ' + s.right + ' = ' + s.value) + '</span>') });
      }
      done[s.i] = true;
    });
    var v = steps[steps.length - 1].value;
    out.push({ text: 'Every token is used and the stack holds one value, ' + b(v) + '. That is the value of the expression. Now do the same, step by step, on your own question.', html: stackVis(list, form, -1, done, [v], '') });
    return out;
  }

  // ------------------------------------------------ Group It: prefix or postfix back to infix
  function itemText(it) { return it.tree ? (it.tree.op ? '(' + NC.toInfix(it.tree) + ')' : it.tree.v) : it.op; }
  function itemsVis(items, hl, cls) {
    return strip(items.map(function (it, i) {
      var c = (it.tree && it.tree.op ? 'grp' : '') + (hl && hl.indexOf(i) >= 0 ? ' ' + (cls || 'wt-hl') : '');
      return it.tree ? '<span class="tok ' + c + '">' + esc(itemText(it)) + '</span>' : tile(it.op, c);
    }).join(''));
  }
  function group(tree, form) {
    var list = form === 'prefix' ? NC.toPrefix(tree) : NC.toPostfix(tree);
    var items = list.map(function (tk) { return NC.isOp(tk) ? { op: tk } : { tree: NC.leaf(tk) }; });
    var out = [{ text: 'Goal: turn this ' + form + ' into infix. Find an operator with two <b>whole values</b> right ' + (form === 'postfix' ? '<b>before</b>' : '<b>after</b>') + ' it. A whole value is a letter, a number or a finished group. ' +
      (form === 'postfix' ? 'Tip: scan from the <b>left</b>. The first operator you meet always has two whole values before it.' : 'Tip: scan from the <b>right</b>. The first operator you meet always has two whole values after it.'), html: itemsVis(items) }];
    while (items.length > 1) {
      var i = -1, k;
      if (form === 'postfix') { for (k = 2; k < items.length && i < 0; k++) if (items[k].op && items[k - 1].tree && items[k - 2].tree) i = k; }
      else { for (k = items.length - 3; k >= 0 && i < 0; k--) if (items[k].op && items[k + 1].tree && items[k + 2].tree) i = k; }
      var a = form === 'postfix' ? i - 2 : i + 1, l = items[a], r = items[a + 1], op = items[i].op;
      var g = { tree: NC.node(op, l.tree, r.tree) }, from = Math.min(i, a), hl = [from, from + 1, from + 2];
      var before = itemsVis(items, hl);
      items.splice(from, 3, g);
      out.push({ text: b(op) + ' has two whole values right ' + (form === 'postfix' ? 'before' : 'after') + ' it: ' + b(itemText(l)) + ' and ' + b(itemText(r)) + '. ' +
        'Why this group is safe: an operator in ' + form + ' always works on the two values right ' + (form === 'postfix' ? 'before' : 'after') + ' it, and both are whole, so nothing else can belong to it. ' +
        'The value written first goes on the left: ' + b(itemText(g)) + '. The group now counts as one value.', html: before + '<div class="wt-arrow">becomes</div>' + itemsVis(items, [from], 'wt-new') });
    }
    out.push({ text: 'One group is left, so every operator has its two values. Take off the outside brackets: the infix is ' + b(NC.toInfix(tree)) + '. Now do the same on your own question.', html: strip('<span class="tok grp wt-new">' + esc(NC.toInfix(tree)) + '</span>') });
    return out;
  }

  // ------------------------------------------------ the bracket method: brackets, move, remove (any direction)
  // o.implied: the infix hides some * (3A). o.infix(t, implied): how infix is written. o.needs: the brackets infix needs.
  function bracket(tree, from, to, o) {
    o = o || {};
    var needs = o.needs || NC.needs;
    var infix = o.infix || function (t, imp) { return NC.toInfix(t, { implied: imp }); };
    var t = NC.clone(tree), nodes = [];
    (function idx(n, p) { n.id = nodes.length; n.parent = p; nodes.push(n); if (n.op) { idx(n.l, n); idx(n.r, n); } })(t, null);
    var order = [];
    (function post(n) { if (n.op) { post(n.l); post(n.r); order.push(n); } })(t);
    var implied = !!o.implied && from === 'infix';
    var hidden = implied ? order.filter(function (n) { return NC.hiddenTimes(n); }) : [];
    var st = { done: {}, moved: {} };
    function side(n) { return n.parent && n === n.parent.l ? 'l' : 'r'; }
    function name(n) { return hidden.indexOf(n) >= 0 ? 'the hidden *' : b(n.op); }
    function row(hl) {
      var out = [], inside = {};
      if (hl) (function mark(m) { inside[m.id] = true; if (m.op) { mark(m.l); mark(m.r); } })(hl);
      (function emit(n) {
        var c = hl && inside[n.id] ? (n === hl ? 'wt-hl' : 'region') : '';
        if (!n.op) { out.push(tile(n.v, c)); return; }
        var br = st.done[n.id] || (from === 'infix' && n.parent && needs(n, n.parent.op, side(n)));
        var form = st.moved[n.id] ? to : from;
        var bc = n === hl ? ' wt-br' : '';
        if (br) out.push('<span class="tok br' + bc + '">(</span>');
        var parts = form === 'prefix' ? ['op', n.l, n.r] : form === 'postfix' ? [n.l, n.r, 'op'] : [n.l, 'op', n.r];
        parts.forEach(function (p) { if (p === 'op') out.push(tile(n.op, c)); else emit(p); });
        if (br) out.push('<span class="tok br' + bc + '">)</span>');
      })(t);
      return strip(out.join(''));
    }
    var question = from === 'infix' ? infix(t, implied) : NC.show(from === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    var answer = to === 'infix' ? infix(t, false) : NC.show(to === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    var out = [{ text: 'Goal: write ' + b(question) + ' in <b>' + to + '</b>. Use the same three steps every time. <b>1. Brackets</b> round each operator and its two values. <b>2. Move</b> each operator inside its own brackets. <b>3. Remove</b> the brackets. Why: the brackets keep each operator with its own two values while it moves.',
      html: strip((NC.tokens(question) || []).map(function (tk) { return tile(tk); }).join('')) }];
    if (hidden.length) out.push({ text: 'First find the hidden *. A number written right next to a letter or a bracket means multiply, so ' + b('3A') + ' is ' + b('3 * A') + '. This one has ' + hidden.length + '. Write ' + (hidden.length > 1 ? 'them' : 'it') + ' in. Why: a hidden * is a real operator and has to move like the others.', html: row(null) });
    order.forEach(function (n) {
      st.done[n.id] = true;
      var why;
      if (from === 'infix') {
        var p = n.parent;
        if (!p) why = name(n) + ' is worked out last, so its brackets go round everything.';
        else if (needs(n, p.op, side(n))) why = name(n) + ' is inside brackets in the question, and brackets are worked out first.';
        else if (NC.PREC[n.op] > NC.PREC[p.op]) why = name(n) + ' ranks above ' + name(p) + ', so it is worked out before it.';
        else if (n.op === POW && p.op === POW) why = 'Two arrows go right to left, so the arrow on the right is worked out first.';
        else why = name(n) + ' and ' + name(p) + ' have the same rank, so go left to right: ' + name(n) + ' first.';
        why = 'Brackets next for ' + name(n) + '. Why: ' + why;
      } else {
        why = name(n) + ' has its two whole values right ' + (from === 'postfix' ? 'before' : 'after') + ' it, so put one bracket round the three. Why: in ' + from + ' an operator works on the two values right ' + (from === 'postfix' ? 'before' : 'after') + ' it. A finished bracket counts as one value.';
      }
      out.push({ text: '<b>1. Brackets.</b> ' + why, html: row(n) });
    });
    var where = to === 'postfix' ? 'to the <b>end</b> of its own brackets. Why: postfix puts the operator after its two values.' :
      to === 'prefix' ? 'to the <b>front</b> of its own brackets. Why: prefix puts the operator before its two values.' :
        '<b>between</b> its two values. Why: infix puts the operator after the left value and before the right one.';
    order.forEach(function (n) {
      st.moved[n.id] = true;
      out.push({ text: '<b>2. Move.</b> Move ' + name(n) + ' ' + where + ' It stays inside its own brackets, so it still joins the same two values.', html: row(n) });
    });
    out.push({ text: '<b>3. Remove.</b> ' + (to === 'infix' ? 'Take out the brackets that change nothing. Keep a bracket only where it changes the answer, for example round + under a *.' :
      'Take out every bracket. Why: each operator now sits right next to its two values, so the brackets are not needed. Keep everything else in the same order.') +
      ' The answer: ' + b(answer) + '. Now do the same three steps on your own question.', html: strip((NC.tokens(answer) || []).map(function (tk) { return tile(tk, 'wt-new'); }).join('')) });
    return { steps: out, question: question, answer: answer };
  }

  // ------------------------------------------------ never the student's question or answer
  function plain(steps) { return steps.map(function (s) { return (s.text || '') + ' ' + (s.html || ''); }).join(' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ''); }
  function squash(s) { return String(s).replace(/\s+/g, ''); }
  function leaks(steps, answer) { return plain(steps).indexOf(squash(answer)) >= 0; }
  // make(): { key, answer, steps } for a fresh similar question. cur: { key, answer, numeric }.
  // A number answer must differ from the student's; a written answer must not appear anywhere in the walkthrough.
  function pick(make, cur) {
    for (var k = 0; k < 300; k++) {
      var ex = make();
      if (!ex || ex.key === cur.key) continue;
      if (cur.numeric ? String(ex.answer) === String(cur.answer) : squash(ex.answer) === squash(cur.answer) || leaks(ex.steps, cur.answer)) continue;
      if (ex.question != null && cur.question != null && squash(ex.question) === squash(cur.question)) continue;
      return ex;
    }
    return null;
  }

  // ------------------------------------------------ on the page
  function button(onClick) {
    var bt = document.createElement('button');
    bt.type = 'button';
    bt.className = 'btn secondary wt-open';
    bt.innerHTML = 'Walk me through it';
    bt.addEventListener('click', onClick);
    return bt;
  }
  // Hides everything else in host and shows the steps one at a time. o: { title, question, steps, onClose(seen) }.
  function open(host, o) {
    var kids = Array.prototype.slice.call(host.children), keep = kids.map(function (n) { return n.style.display; });
    kids.forEach(function (n) { n.style.display = 'none'; });
    var box = document.createElement('div');
    box.className = 'wt-box';
    host.appendChild(box);
    var at = 0, seen = 1;
    function close() {
      document.removeEventListener('keydown', onKey, true);
      box.remove();
      kids.forEach(function (n, i) { n.style.display = keep[i]; });
      if (window.NL) NL.reportHeight();
      if (o.onClose) o.onClose(seen, o.steps.length);
    }
    function go(d) { at = Math.max(0, Math.min(o.steps.length - 1, at + d)); seen = Math.max(seen, at + 1); show(); }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); e.stopPropagation(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); e.stopPropagation(); go(-1); }
    }
    document.addEventListener('keydown', onKey, true);
    function show() {
      var s = o.steps[at];
      var dots = o.steps.map(function (_, i) { return '<i class="' + (i === at ? 'on' : i < at ? 'past' : '') + '"></i>'; }).join('');
      box.innerHTML = '<div class="wt-head"><h2>' + esc(o.title || 'Walk me through it') + '</h2><span class="small">Step ' + (at + 1) + ' of ' + o.steps.length + '</span></div>' +
        '<div class="wt-dots">' + dots + '</div>' +
        '<p class="small wt-note">A similar question with different values, so you can see how and why. Your teacher can see that you used it.</p>' +
        (o.question ? '<p class="wt-q">' + o.question + '</p>' : '') +
        '<div class="wt-vis">' + (s.html || '') + '</div><p class="wk-text wt-text">' + s.text + '</p>';
      var row = document.createElement('div');
      row.className = 'actions';
      function btn(label, cls, fn) { var x = document.createElement('button'); x.type = 'button'; x.className = cls; x.innerHTML = label; x.addEventListener('click', fn); row.appendChild(x); return x; }
      var bk = btn('Back', 'btn secondary', function () { go(-1); });
      bk.disabled = at === 0;
      if (at < o.steps.length - 1) btn('Next', 'btn', function () { go(1); });
      btn(at < o.steps.length - 1 ? 'Close' : 'Back to my question', at < o.steps.length - 1 ? 'btn secondary' : 'btn', close);
      box.appendChild(row);
      if (window.NL) NL.reportHeight();
    }
    show();
    return { close: close };
  }

  return { stack: stack, group: group, bracket: bracket, pick: pick, leaks: leaks, button: button, open: open };
})(typeof NotationCore !== 'undefined' ? NotationCore : require('./core.js'));
if (typeof module === 'object' && module && module.exports) module.exports = NLWalk;
