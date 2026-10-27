// Tree Builder (?mode=tree): build the expression tree of an infix expression, then read prefix or postfix off it.
// Build: the highlighted part of the expression is one branch. Click the operator in it that is worked out LAST:
// that operator is the top of the branch, and the parts on either side become its two branches. Read: tap the tree's
// nodes in prefix or postfix order. Wrong clicks cost hearts; the rule shows after a mistake. Levels rise from two
// operators to brackets, chains of equal operators, the power arrow and contest-style hidden multiplication (3(A+2B)).
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc;
  var FOUR = ['+', '-', '*', '/'], ALL = FOUR.concat([NC.POW]);
  var LEVELS = [
    { name: 'Two operators', n: 2, ops: FOUR, noBrackets: true },
    { name: 'Brackets', n: [2, 3], ops: FOUR, brackets: true },
    { name: 'Longer', n: [3, 4], ops: FOUR, chain: true },
    { name: 'Power arrow', n: [3, 4], ops: ALL, mustUse: [NC.POW] },
    { name: 'Contest style', n: [3, 5], ops: FOUR, implied: true }
  ];
  var NEED = 2, HEARTS = 3;

  NL.activities.tree = function (host) {
    var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(NL.params.get('level'), 10) || 1) - 1));
    var have = 0, score = 0, streak = 0, count = 0;
    var log = NL.results('Tree Builder');
    var T = null;

    var bar = NL.topbar(host);
    var q = el('p', { class: 'task-q' });
    var rule = el('div', { class: 'rule-box' });
    var sup = NL.support('tree', rule);
    sup.toggle(bar.slot);
    var stripBox = el('div'), treeBox = el('div', { class: 'tree-wrap' }), readBox = el('div'), act = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback' });
    [q, rule, stripBox, treeBox, readBox, act, fb].forEach(function (n) { host.appendChild(n); });

    function L() { return LEVELS[lv]; }

    function generate() {
      var lev = L();
      for (var k = 0; k < 400; k++) {
        var t = NC.randomTree({ n: NL.sizeOf(lev.n), ops: lev.ops, letters: true, mustUse: lev.mustUse, digitChance: lev.implied ? 0.45 : 0 });
        var plain = NC.toInfix(t), shown = NC.toInfix(t, { implied: !!lev.implied });
        if (lev.brackets && plain.indexOf('(') < 0) continue;
        if (lev.noBrackets && plain.indexOf('(') >= 0) continue;
        if (lev.chain && !hasChain(t)) continue;
        if (lev.implied && shown === plain) continue;
        if (lev.implied && !/[A-H]/.test(shown)) continue;
        return t;
      }
      return NC.randomTree({ n: 2, ops: FOUR, letters: true });
    }
    // Two operators of equal precedence next to each other with no brackets (A - B + C).
    function hasChain(t) {
      if (!t.op) return false;
      if (t.l.op && NC.PREC[t.l.op] === NC.PREC[t.op]) return true;
      return hasChain(t.l) || hasChain(t.r);
    }

    // Ids in preorder; display items with the node each operator belongs to, and each node's span.
    function prepare(tree, implied) {
      var nodes = [], items = [];
      (function idx(n, parent) { n.id = nodes.length; n.parent = parent; nodes.push(n); if (n.op) { idx(n.l, n); idx(n.r, n); } })(tree, null);
      (function emit(n, br) {
        var start = items.length;
        if (br) items.push({ kind: 'br', text: '(' });
        if (!n.op) items.push({ kind: 'val', text: n.v, node: n.id });
        else {
          emit(n.l, NC.needs(n.l, n.op, 'l'));
          items.push({ kind: implied && NC.hiddenTimes(n) ? 'hid' : 'op', text: n.op, node: n.id });
          emit(n.r, NC.needs(n.r, n.op, 'r'));
        }
        if (br) items.push({ kind: 'br', text: ')' });
        n.span = [start, items.length - 1];
      })(tree, false);
      return { nodes: nodes, items: items };
    }

    function newExpr() {
      var lev = L();
      var tree = generate();
      var p = prepare(tree, !!lev.implied);
      count++;
      T = { tree: tree, nodes: p.nodes, items: p.items, built: {}, pending: [0], hearts: HEARTS, mistakes: 0, phase: 'build',
        read: null, readOrder: null, readPos: 0, flash: null, form: count % 2 ? 'postfix' : 'prefix', shown: NC.toInfix(tree, { implied: !!lev.implied }) };
      sup.set([
        'The operator worked out <b>last</b> is the top. Brackets are worked out first, then ' + NC.POW + ', then * and /, then + and -. Two of the same rank: the one on the <b>right</b> is last.',
        'Last worked out: outside brackets, lowest rank, the one furthest right.',
        'Lowest rank, outside brackets.'
      ]);
      draw();
    }

    function draw(note) {
      var lev = L();
      bar.set({ level: 'Level ' + (lv + 1) + ': ' + lev.name, have: have, need: log.isDone() && lv === LEVELS.length - 1 ? 0 : NEED, score: score, streak: streak, hearts: T.hearts });
      if (T.phase === 'build') q.innerHTML = 'Build the tree. In the highlighted part, click the operator that is worked out <b>last</b>.' + (lev.implied ? ' A number written next to a letter or a bracket hides a *: it is the dashed tile.' : '') +
        '<span class="small" style="display:block;margin-top:6px">How a tree is built: (1) find the operator worked out last; (2) it goes at the top; (3) the part on its left becomes the left branch and the part on its right becomes the right branch; (4) do the same for each branch until only letters and numbers are left. A tree with a mistake does not count.</span>';
      else if (T.phase === 'read') q.innerHTML = 'Now tap the nodes of the tree in <b>' + T.form + '</b> order.';
      else q.innerHTML = 'Done. Here are all three forms.';
      drawStrip();
      drawTree();
      drawRead();
      act.innerHTML = '';
      if (T.phase === 'end' || T.phase === 'over') {
        var b = el('button', { type: 'button', class: 'btn' }, 'Next expression ' + NL.ICON.next);
        b.addEventListener('click', function () { NL.say(fb, ''); newExpr(); });
        act.appendChild(b);
      }
      if (note) NL.say(fb, note[0], note[1]);
      NL.reportHeight();
    }

    function current() { return T.phase === 'build' ? T.nodes[T.pending[0]] : null; }
    function drawStrip() {
      var cur = current();
      stripBox.innerHTML = '';
      var strip = el('div', { class: 'strip' });
      T.items.forEach(function (it, i) {
        var inRegion = cur && i >= cur.span[0] && i <= cur.span[1];
        var cls = 'tok' + (it.kind === 'op' ? ' op' : it.kind === 'hid' ? ' hid' : it.kind === 'br' ? ' br' : '');
        if (cur && inRegion) cls += ' region';
        if (cur && !inRegion) cls += ' outside';
        if ((it.kind === 'op' || it.kind === 'hid') && T.built[it.node]) cls += ' picked-ok';
        if (T.flash === i) cls += ' flash-bad';
        var text = it.kind === 'hid' ? '\u00b7' : esc(it.text);
        if ((it.kind === 'op' || it.kind === 'hid') && T.phase === 'build' && !T.built[it.node]) {
          var b = el('button', { type: 'button', class: cls, 'aria-label': it.kind === 'hid' ? 'hidden multiplication' : 'operator ' + it.text }, text);
          b.addEventListener('click', function () { pickOp(it, i); });
          strip.appendChild(b);
        } else strip.appendChild(el('span', { class: cls }, text));
      });
      stripBox.appendChild(strip);
    }

    function pickOp(it, i) {
      var cur = current();
      if (i < cur.span[0] || i > cur.span[1]) { NL.say(fb, 'Look inside the highlighted part.', 'hint'); return; }
      if (it.node === cur.id) {
        T.built[cur.id] = true;
        T.pending.shift();
        var kids = [cur.l, cur.r].filter(function (c) { return c.op; }).map(function (c) { return c.id; });
        T.pending = kids.concat(T.pending);
        score += 10; streak++; sup.right();
        if (!T.pending.length) {
          T.phase = 'read';
          T.readOrder = (T.form === 'prefix' ? preorder(T.tree) : postorder(T.tree));
          T.read = [];
          draw(['The tree is built. The top is the operator worked out last.', '']);
          return;
        }
        draw(['Yes. ' + esc(it.kind === 'hid' ? 'The hidden *' : it.text) + ' is worked out last in that part, so it goes at the top of this branch. ' +
          'Everything on its left, <b class="calc">' + esc(NC.toInfix(cur.l)) + '</b>, hangs below it on the left. Everything on its right, <b class="calc">' +
          esc(NC.toInfix(cur.r)) + '</b>, hangs below it on the right.' + (T.pending.length ? ' Now do the same for the next highlighted part.' : ''), '']);
        return;
      }
      T.hearts--; T.mistakes++; streak = 0; sup.wrong();
      T.flash = i;
      NL.later(700, function () { T.flash = null; if (T.phase === 'build') drawStrip(); });
      var why = whyNot(cur, it);
      if (T.hearts <= 0) { autoBuild(why); return; }
      draw([why, 'bad']);
    }
    function whyNot(cur, it) {
      var other = T.nodes[it.node];
      var inside = other.span && isBracketed(other, cur);
      if (inside) return 'That one is inside brackets, so it is worked out before the others.';
      if (NC.PREC[other.op] > NC.PREC[cur.op]) return 'That one ranks higher, so it is worked out earlier. Look for a lower rank.';
      return 'Two operators of the same rank go left to right, so the one further right is worked out last.';
    }
    function isBracketed(n, cur) {
      for (var p = n; p && p !== cur; p = p.parent) if (p.parent && p.parent !== null && NC.needs(p, p.parent.op, p === p.parent.l ? 'l' : 'r')) return true;
      return false;
    }
    function autoBuild(why) {
      T.nodes.forEach(function (n) { if (n.op) T.built[n.id] = true; });
      T.pending = [];
      T.phase = 'over';
      finishExpr(false, esc(why) + ' No hearts left: here is the whole tree.');
    }

    function preorder(n) { return n.op ? [n.id].concat(preorder(n.l), preorder(n.r)) : [n.id]; }
    function postorder(n) { return n.op ? postorder(n.l).concat(postorder(n.r), [n.id]) : [n.id]; }

    // ------------------------------------------------ the tree picture (SVG)
    function drawTree() {
      var nodes = T.nodes, order = [];
      (function ino(n) { if (n.op) { ino(n.l); order.push(n); ino(n.r); } else order.push(n); })(T.tree);
      var small = document.documentElement.classList.contains('embed');
      var dx = 46, dy = small ? 50 : 62, r = small ? 17 : 19, pad = small ? 30 : 34;
      var maxD = NC.depth(T.tree);
      var pos = {};
      order.forEach(function (n, i) { var d = 0; for (var p = n.parent; p; p = p.parent) d++; pos[n.id] = { x: pad + i * dx, y: pad + d * dy }; });
      var w = pad * 2 + (order.length - 1) * dx, h = pad * 2 + maxD * dy;
      var visible = function (n) { return !n.parent || T.built[n.parent.id]; };
      var lines = '', circles = '';
      nodes.forEach(function (n) {
        if (!visible(n)) return;
        if (n.parent) { var a = pos[n.parent.id], b = pos[n.id]; lines += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; }
        var built = !n.op || T.built[n.id];
        var cls = 'nd' + (n.op ? ' op' : ' leaf') + (built ? '' : ' todo') + (T.phase === 'build' && current() === n ? ' current' : '');
        var readIdx = T.read ? T.read.indexOf(n.id) : -1;
        if (readIdx >= 0) cls += ' read';
        if (T.phase === 'read' && readIdx < 0) cls += ' tap';
        if (T.flashNode === n.id) cls += ' bad';
        var label = built ? (n.op ? n.op : n.v) : '?';
        circles += '<g class="' + cls + '" data-node="' + n.id + '" transform="translate(' + pos[n.id].x + ',' + pos[n.id].y + ')"><circle r="' + r + '"/><text>' + esc(label) + '</text>' +
          (readIdx >= 0 ? '<text class="badge" y="-25">' + (readIdx + 1) + '</text>' : '') + '</g>';
      });
      treeBox.innerHTML = '<svg class="tree-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Expression tree">' + lines + circles + '</svg>';
      if (T.phase === 'read') Array.prototype.forEach.call(treeBox.querySelectorAll('.nd.tap'), function (g) {
        g.addEventListener('click', function () { tapNode(Number(g.getAttribute('data-node'))); });
      });
    }

    function tapNode(id) {
      var want = T.readOrder[T.read.length];
      if (id === want) {
        T.read.push(id); score += 3; streak++; sup.right();
        if (T.read.length === T.readOrder.length) { finishExpr(true); return; }
        draw(['', '']);
        return;
      }
      T.hearts--; T.mistakes++; streak = 0; sup.wrong();
      T.flashNode = id;
      NL.later(700, function () { T.flashNode = null; if (T.phase === 'read') drawTree(); });
      var why = T.form === 'postfix' ? 'Postfix: the whole left branch, then the whole right branch, then the node at the top.' :
        'Prefix: the node at the top first, then the whole left branch, then the whole right branch.';
      if (T.hearts <= 0) { T.read = T.readOrder.slice(); T.phase = 'over'; finishExpr(false, why + ' No hearts left: here is the order.'); return; }
      draw([why, 'bad']);
    }
    function drawRead() {
      if (T.phase === 'build') { readBox.innerHTML = ''; return; }
      var list = (T.read || []).map(function (id) { var n = T.nodes[id]; return n.op || n.v; });
      if (T.phase === 'read') {
        readBox.innerHTML = '<div class="small" style="margin-top:8px">' + (T.form === 'prefix' ? 'Prefix' : 'Postfix') + ' so far:</div><div class="strip">' +
          (list.length ? list.map(function (tk) { return NL.tile(tk); }).join('') : '<span class="small">Tap the first node.</span>') + '</div>';
        return;
      }
      readBox.innerHTML = '<div class="small" style="margin-top:8px">Infix: <b class="calc">' + esc(T.shown) + '</b></div>' +
        '<div class="small">Prefix: <b class="calc">' + esc(NC.show(NC.toPrefix(T.tree))) + '</b></div>' +
        '<div class="small">Postfix: <b class="calc">' + esc(NC.show(NC.toPostfix(T.tree))) + '</b></div>';
    }

    function finishExpr(solved, msg) {
      var lev = L();
      if (solved && T.mistakes === 0) score += 20;
      log.add(T.shown + ' to ' + T.form + (solved ? (T.mistakes ? ', ' + T.mistakes + ' mistake' + (T.mistakes > 1 ? 's' : '') + ' (not counted)' : ', no mistakes') : ', out of hearts'), solved && !T.mistakes);
      var up = false;
      // James 2026-10-27: a tree with any mistake never counts, so guessing cannot move anyone on.
      if (!solved || T.mistakes) have = 0;
      if (solved && !T.mistakes) {
        have += 1;
        if (have >= NEED && lv < LEVELS.length - 1) { lv++; have = 0; up = true; }
        else if (have >= NEED) { log.finish(); have = 0; }
      }
      T.phase = solved ? 'end' : 'over';
      var text = msg || (T.mistakes === 0 ? 'Tree built and read with no mistakes: +20.' : 'Tree built and read, but with ' + (T.mistakes === 1 ? 'a mistake' : T.mistakes + ' mistakes') + ', so it does not count. Build the next one with no mistakes.');
      if (!solved) text += ' This one does not count. You need ' + NEED + ' trees in a row with no mistakes.';
      if (up) text += ' Level up: ' + esc(LEVELS[lv].name) + '.';
      if (log.isDone() && lv === LEVELS.length - 1 && solved) text = NL.doneBanner('You can build contest-style trees. Keep going for a higher score.') + text;
      draw([text, solved ? '' : 'hint']);
      void lev;
    }

    newExpr();
  };
})();
