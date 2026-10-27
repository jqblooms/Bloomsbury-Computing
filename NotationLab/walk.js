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

  // ------------------------------------------------ trees: shared by Tree Builder, Tree Reader and their walkthroughs
  // James 2026-10-27: building the tree and reading prefix or postfix off it were one task, and students mixed them
  // up. Now Tree Builder only builds, bottom up, in the order you would work the expression out, and Tree Reader only
  // reads a finished tree. Gives every node an id (preorder) and its parent; returns the nodes.
  function treeIndex(t) {
    var nodes = [];
    (function idx(n, p) { n.id = nodes.length; n.parent = p; nodes.push(n); if (n.op) { idx(n.l, n); idx(n.r, n); } })(t, null);
    return nodes;
  }
  // The expression as a row of items. A joined part (a small tree already built) is one block: it counts as one value.
  function treeItems(t, joined, implied) {
    var items = [];
    (function emit(n, br) {
      if (n.op && joined[n.id]) { items.push({ kind: 'blk', node: n.id, text: NC.toInfix(n, { implied: implied }) }); return; }
      if (br) items.push({ kind: 'br', text: '(' });
      if (!n.op) items.push({ kind: 'val', text: n.v, node: n.id });
      else {
        emit(n.l, NC.needs(n.l, n.op, 'l'));
        items.push({ kind: implied && NC.hiddenTimes(n) ? 'hid' : 'op', text: n.op, node: n.id });
        emit(n.r, NC.needs(n.r, n.op, 'r'));
      }
      if (br) items.push({ kind: 'br', text: ')' });
    })(t, false);
    return items;
  }
  function isOpItem(it) { return it.kind === 'op' || it.kind === 'hid'; }
  function opName(it) { return it.kind === 'hid' ? 'the hidden *' : b(it.text); }
  // The operator worked out first: inside the first brackets to close, then the power arrow (right to left), then
  // * and /, then + and - (left to right). Returns its index, the part looked at, the brackets round it and the reason.
  function treeNext(items) {
    var open = [], region = [0, items.length - 1], br = null, i;
    for (i = 0; i < items.length && !br; i++) {
      if (items[i].kind !== 'br') continue;
      if (items[i].text === '(') open.push(i);
      else { br = [open.pop(), i]; region = [br[0] + 1, i - 1]; }
    }
    var ops = [];
    for (i = region[0]; i <= region[1]; i++) if (isOpItem(items[i])) ops.push(i);
    var pw = ops.filter(function (k) { return items[k].text === POW; });
    var md = ops.filter(function (k) { return items[k].text === '*' || items[k].text === '/'; });
    var at, why;
    if (ops.length === 1) { at = ops[0]; why = br ? 'it is the only operator inside these brackets, and brackets are worked out first' : 'it is the only operator left'; }
    else if (pw.length) {
      at = pw[pw.length - 1];
      why = pw.length > 1 ? 'two power arrows go right to left, so the arrow on the right is worked out first' : 'the power arrow ranks above * / + and -, so it is worked out first';
    } else if (md.length) {
      at = md[0];
      why = md.length < ops.length ? '* and / are worked out before + and -' : 'they all have the same rank, so go left to right';
      if (md.length > 1 && md.length < ops.length) why += ', and the same rank goes left to right, so start with the one on the left';
    } else { at = ops[0]; why = 'only + and - are here, and the same rank goes left to right, so start with the one on the left'; }
    if (br && ops.length > 1) why = 'it is inside brackets, and brackets are worked out first. Inside them, ' + why;
    return { at: at, region: region, br: br, why: why };
  }
  // Why a clicked operator (index j) is not the one worked out first. N: treeNext of the same items.
  function treeWrong(items, j, N) {
    var c = items[j], w = items[N.at];
    if (N.br && (j < N.region[0] || j > N.region[1])) {
      var open = [], pair = null;
      for (var i = 0; i < items.length && !pair; i++) {
        if (items[i].kind !== 'br') continue;
        if (items[i].text === '(') open.push(i);
        else { var a = open.pop(); if (a < j && i > j) pair = [a, i]; }
      }
      if (!pair) return 'Not yet. ' + opName(c) + ' is outside the brackets. Brackets are worked out first.';
      if (pair[0] < N.br[0] && pair[1] > N.br[1]) return 'Not yet. ' + opName(c) + ' is inside brackets, but there are more brackets inside those. Work out the inner brackets first.';
      return 'Not yet. ' + opName(c) + ' is in brackets too, but work from left to right: finish the brackets on the left first.';
    }
    if (w.text === POW) return c.text === POW ? 'Not yet. Two power arrows go right to left, so start with the arrow on the right.' :
      'Not yet. The power arrow ranks above ' + opName(c) + ', so the arrow is worked out first.';
    if (w.text === '*' || w.text === '/') return c.text === '+' || c.text === '-' ? 'Not yet. ' + opName(c) + ' ranks below * and /, so it waits until they are done.' :
      'Not yet. Same rank: go from left to right. There is ' + (w.kind === 'hid' ? 'a hidden *' : 'a * or /') + ' further left.';
    return 'Not yet. Same rank: go from left to right. Start with the one further left.';
  }
  // A tree drawing. o.layout 'height': letters and numbers along the bottom, each joined operator just above its
  // branches (for building from the bottom up; o.joined says which operators are built). 'depth': the usual drawing,
  // top at the top. o.hot: a node to ring. o.read: ids read so far (numbered). o.tap: nodes not read yet can be tapped.
  function treeSvg(t, o) {
    o = o || {};
    var order = [], nodes = [];
    (function ino(n) { if (n.op) { ino(n.l); order.push(n); ino(n.r); } else order.push(n); })(t);
    (function pre(n) { nodes.push(n); if (n.op) { pre(n.l); pre(n.r); } })(t);
    function height(n) { return n.op ? 1 + Math.max(height(n.l), height(n.r)) : 0; }
    function level(n) { var d = 0; for (var p = n.parent; p; p = p.parent) d++; return d; }
    var H = NC.depth(t), dx = 46, dy = o.small ? 50 : 62, r = o.small ? 17 : 19, pad = o.small ? 30 : 34, pos = {};
    order.forEach(function (n, i) { pos[n.id] = { x: pad + i * dx, y: pad + (o.layout === 'height' ? H - height(n) : level(n)) * dy }; });
    var w = pad * 2 + (order.length - 1) * dx, h = pad * 2 + H * dy, lines = '', circles = '';
    var shown = function (n) { return !o.joined || !n.op || o.joined[n.id]; };
    nodes.forEach(function (n) {
      if (!shown(n)) return;
      if (n.op) [n.l, n.r].forEach(function (c) { lines += '<line x1="' + pos[n.id].x + '" y1="' + pos[n.id].y + '" x2="' + pos[c.id].x + '" y2="' + pos[c.id].y + '"/>'; });
      var ri = o.read ? o.read.indexOf(n.id) : -1;
      var cls = 'nd' + (n.op ? ' op' : ' leaf') + (n.id === o.hot ? ' current' : '') + (ri >= 0 ? ' read' : '') + (o.tap && ri < 0 ? ' tap' : '') + (n.id === o.bad ? ' bad' : '');
      circles += '<g class="' + cls + '" data-node="' + n.id + '" transform="translate(' + pos[n.id].x + ',' + pos[n.id].y + ')"><circle r="' + r + '"/><text>' + esc(n.op || n.v) + '</text>' +
        (ri >= 0 ? '<text class="badge" y="-25">' + (ri + 1) + '</text>' : '') + '</g>';
    });
    return '<svg class="tree-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.label || 'Expression tree') + '">' + lines + circles + '</svg>';
  }
  function itemsRow(items, hot, cls) {
    return strip(items.map(function (it, i) {
      var c = (i === hot ? ' ' + (cls || 'wt-hl') : '');
      if (it.kind === 'blk') return '<span class="tok grp' + c + '">' + esc(it.text) + '</span>';
      if (it.kind === 'br') return '<span class="tok br">' + esc(it.text) + '</span>';
      return '<span class="tok' + (it.kind === 'op' ? ' op' : it.kind === 'hid' ? ' hid' : '') + c + '">' + (it.kind === 'hid' ? '·' : esc(it.text)) + '</span>';
    }).join(''));
  }
  // Tree Builder walkthrough: the tree built from the bottom up, one operator at a time, with the reason for each.
  function treeBuild(tree, implied, small) {
    var t = NC.clone(tree), nodes = treeIndex(t), joined = {}, out = [], order = [];
    var shownQ = NC.toInfix(t, { implied: implied });
    out.push({ text: 'Example: ' + b(shownQ) + '. Build the tree in the order you would work it out. Each time, find the operator worked out <b>first</b>. It joins its two values into a small tree. That small tree then counts as one value.' +
      (implied ? ' A number written next to a letter or a bracket hides a *: the dashed tile.' : ''),
      html: itemsRow(treeItems(t, joined, implied)) + '<div class="wt-tree">' + treeSvg(t, { layout: 'height', joined: joined, small: small, label: 'Example tree' }) + '</div>' });
    var k = 0;
    while (true) {
      var items = treeItems(t, joined, implied);
      if (items.length === 1) break;
      var N = treeNext(items), it = items[N.at], n = nodes[it.node];
      var before = itemsRow(items, N.at);
      joined[n.id] = true;
      order.push(n.id);
      var after = treeItems(t, joined, implied), at = -1;
      after.forEach(function (x, i) { if (x.kind === 'blk' && x.node === n.id) at = i; });
      k++;
      out.push({ text: 'Step ' + k + '. Which operator is worked out first? ' + opName(it) + '. Why: ' + N.why + '. ' +
        'It joins ' + b(NC.toInfix(n.l, { implied: implied })) + ' and ' + b(NC.toInfix(n.r, { implied: implied })) + ' into a small tree. Now ' + b(NC.toInfix(n, { implied: implied })) + ' counts as one value.',
        html: before + '<div class="wt-arrow">becomes</div>' + itemsRow(after, at, 'wt-new') + '<div class="wt-tree">' + treeSvg(t, { layout: 'height', joined: joined, hot: n.id, small: small, label: 'Example tree' }) + '</div>' });
    }
    out.push({ text: 'One tree is left, so the tree is built. The last operator joined, ' + (implied && NC.hiddenTimes(t) ? 'the hidden *' : b(t.op)) + ', sits at the <b>top</b>: it is worked out last, so it joins the two biggest parts. Now build your own tree the same way.',
      html: '<div class="wt-tree">' + treeSvg(t, { layout: 'height', small: small, label: 'Example tree' }) + '</div>' });
    return { steps: out, order: order, question: shownQ };
  }
  // Tree Reader walkthrough: walk round the outside of the tree, reading each node the first (prefix) or last
  // (postfix) time you pass it, with the reason for each node.
  function treeOrder(t, form) {
    return form === 'prefix' ? (function pre(n) { return n.op ? [n.id].concat(pre(n.l), pre(n.r)) : [n.id]; })(t) :
      (function post(n) { return n.op ? post(n.l).concat(post(n.r), [n.id]) : [n.id]; })(t);
  }
  function treeRead(tree, form, small) {
    var t = NC.clone(tree), nodes = treeIndex(t), list = treeOrder(t, form), read = [];
    var answer = NC.show(form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t));
    var out = [{ text: 'Walk round the outside of the tree. Start at the top and go down the left side. In <b>' + form + '</b>, read each node the <b>' + (form === 'prefix' ? 'first' : 'last') + '</b> time you pass it. Why: ' +
      (form === 'prefix' ? 'prefix puts each operator before its two branches.' : 'postfix puts each operator after its two branches.'),
      html: '<div class="wt-tree">' + treeSvg(t, { read: [], small: small, label: 'Example tree' }) + '</div>' }];
    list.forEach(function (id, k) {
      var n = nodes[id], lead = '';
      if (form === 'prefix') {
        if (n.parent && n === n.parent.r) lead = 'The left branch of ' + b(n.parent.op) + ' is finished, so go down its right branch. ';
      } else if (!n.op) {
        var c = n;
        while (c.parent && c === c.parent.l) c = c.parent;
        lead = c.parent ? 'The left branch of ' + b(c.parent.op) + ' is finished, so go down its right branch to the bottom. ' : 'Go down the left side to the bottom. ';
      }
      var why = n.op ? (form === 'prefix' ? 'This is the first time you reach ' + b(n.op) + ', so read it now, before its two branches.' :
        'Both branches below ' + b(n.op) + ' are read, so this is the last time you pass it. Read it now, after its two branches.') :
        b(n.v) + ' has nothing below it, so you pass it only once. Read it now.';
      read.push(id);
      out.push({ text: (k === 0 && form === 'prefix' ? 'Start at the top. ' : '') + lead + why,
        html: '<div class="wt-tree">' + treeSvg(t, { read: read.slice(), hot: id, small: small, label: 'Example tree' }) + '</div>' +
          strip(read.map(function (x) { return tile(nodes[x].op || nodes[x].v); }).join('')) });
    });
    out.push({ text: 'Every node is read. In ' + form + ' this tree is ' + b(answer) + '.' + (form === 'postfix' ? ' This is the order the Stack Machine needs: both values are on the stack before their operator arrives.' : '') + ' Now read your own tree the same way.',
      html: '<div class="wt-tree">' + treeSvg(t, { read: list, small: small, label: 'Example tree' }) + '</div>' });
    return { steps: out, answer: answer, order: list };
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
        (o.note != null ? (o.note ? '<p class="small wt-note">' + o.note + '</p>' : '') : '<p class="small wt-note">A similar question with different values, so you can see how and why. Your teacher can see that you used it.</p>') +
        (o.question ? '<p class="wt-q">' + o.question + '</p>' : '') +
        '<div class="wt-vis">' + (s.html || '') + '</div><p class="wk-text wt-text">' + s.text + '</p>';
      var row = document.createElement('div');
      row.className = 'actions';
      function btn(label, cls, fn) { var x = document.createElement('button'); x.type = 'button'; x.className = cls; x.innerHTML = label; x.addEventListener('click', fn); row.appendChild(x); return x; }
      var bk = btn('Back', 'btn secondary', function () { go(-1); });
      bk.disabled = at === 0;
      if (at < o.steps.length - 1) btn('Next', 'btn', function () { go(1); });
      btn(at < o.steps.length - 1 ? 'Close' : (o.doneLabel || 'Back to my question'), at < o.steps.length - 1 ? 'btn secondary' : 'btn', close);
      box.appendChild(row);
      if (window.NL) NL.reportHeight();
    }
    show();
    return { close: close };
  }

  return { stack: stack, group: group, bracket: bracket, pick: pick, leaks: leaks, button: button, open: open,
    treeIndex: treeIndex, treeItems: treeItems, treeNext: treeNext, treeWrong: treeWrong, treeSvg: treeSvg, treeBuild: treeBuild, treeRead: treeRead, treeOrder: treeOrder };
})(typeof NotationCore !== 'undefined' ? NotationCore : require('./core.js'));
if (typeof module === 'object' && module && module.exports) module.exports = NLWalk;
