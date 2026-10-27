// Tree Reader (?mode=read): the student is given a finished expression tree and taps its nodes in postfix or prefix
// order, one form per round (postfix first, then prefix, taking turns). James 2026-10-27: building a tree and reading
// it were one task in Tree Builder, and students mixed them up, so reading has its own mode. The rule: walk round the
// outside of the tree, starting at the top and going down the left side; prefix reads each node the first time you
// pass it, postfix the last time. A numbered example shows the rule, every wrong tap says why it is not next, and Walk
// me through it reads a different tree step by step. A tree with a mistake never counts; NEED clean trees in a row
// move up a level.
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc;
  var FOUR = ['+', '-', '*', '/'], ALL = FOUR.concat([NC.POW]);
  var LEVELS = [
    { name: 'Small trees', n: 2, ops: FOUR },
    { name: 'Bigger trees', n: [3, 4], ops: FOUR },
    { name: 'Power arrow', n: [3, 4], ops: ALL, mustUse: [NC.POW] },
    { name: 'Contest size', n: [5, 6], ops: ALL, digitChance: 0.3 }
  ];
  var NEED = 2, HEARTS = 3;
  var EXAMPLE = NC.parseInfix('P + Q * R');
  NLWalk.treeIndex(EXAMPLE);

  NL.activities.read = function (host) {
    var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(NL.params.get('level'), 10) || 1) - 1));
    var have = 0, score = 0, streak = 0, count = 0;
    var log = NL.results('Tree Reader');
    var small = document.documentElement.classList.contains('embed');
    var T = null;

    var bar = NL.topbar(host);
    var q = el('p', { class: 'task-q' });
    var how = el('div', { class: 'read-how' });
    var rule = el('div', { class: 'rule-box' });
    var sup = NL.support('read', rule);
    sup.toggle(bar.slot);
    var treeBox = el('div', { class: 'tree-wrap' }), soFar = el('div'), act = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback' });
    [q, how, rule, treeBox, soFar, act, fb].forEach(function (n) { host.appendChild(n); });

    function L() { return LEVELS[lv]; }
    function generate() {
      var lev = L();
      return NC.randomTree({ n: NL.sizeOf(lev.n), ops: lev.ops, letters: true, mustUse: lev.mustUse, digitChance: lev.digitChance || 0 });
    }
    function answerOf(t, form) { return NC.show(form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t)); }

    function newTree() {
      count++;
      var tree = generate();
      T = { tree: tree, nodes: NLWalk.treeIndex(tree), form: count % 2 ? 'postfix' : 'prefix', read: [], hearts: HEARTS, mistakes: 0, phase: 'read', bad: -1 };
      T.order = NLWalk.treeOrder(tree, T.form);
      sup.set(T.form === 'prefix' ? [
        'Prefix: a node is read <b>before</b> anything below it. Then the whole left branch, then the whole right branch.',
        'Prefix: the top first, then left, then right.',
        'First time you pass it.'
      ] : [
        'Postfix: a node is read only <b>after</b> everything below it. The whole left branch, then the whole right branch, then the node at the top.',
        'Postfix: left, then right, then the top.',
        'Last time you pass it.'
      ]);
      draw();
    }

    // The rule with the numbered example tree P + Q * R, read in this round's form.
    function drawHow() {
      var f = T.form, ex = answerOf(EXAMPLE, f);
      how.innerHTML = '<div class="read-how-row"><div class="tree-wrap read-ex">' + NLWalk.treeSvg(EXAMPLE, { read: NLWalk.treeOrder(EXAMPLE, f), small: true, label: 'Numbered example tree' }) + '</div>' +
        '<p class="small">How to read <b>' + f + '</b>: walk round the outside of the tree. Start at the top and go down the left side. Read each node the <b>' + (f === 'prefix' ? 'first' : 'last') + '</b> time you pass it' +
        (f === 'postfix' ? ', on the way back up' : '') + '. Why: ' + f + ' puts each operator ' + (f === 'prefix' ? 'before' : 'after') + ' its two branches. The numbers show the example read in ' + f + ': <b class="calc">' + esc(ex) + '</b>.</p></div>';
    }

    function draw(note) {
      var lev = L();
      bar.set({ level: 'Level ' + (lv + 1) + ': ' + lev.name, have: have, need: log.isDone() && lv === LEVELS.length - 1 ? 0 : NEED, score: score, streak: streak, hearts: T.hearts });
      q.innerHTML = T.phase === 'read' ? 'Tap the nodes of this tree in <b>' + T.form + '</b> order. A tree with a mistake does not count.' : 'The tree is read.';
      drawHow();
      treeBox.innerHTML = NLWalk.treeSvg(T.tree, { read: T.read, tap: T.phase === 'read', bad: T.bad, small: small });
      if (T.phase === 'read') Array.prototype.forEach.call(treeBox.querySelectorAll('.nd.tap'), function (g) {
        g.addEventListener('click', function () { tap(Number(g.getAttribute('data-node'))); });
      });
      var list = T.read.map(function (id) { var n = T.nodes[id]; return n.op || n.v; });
      soFar.innerHTML = '<div class="small" style="margin-top:8px">' + (T.form === 'prefix' ? 'Prefix' : 'Postfix') + (T.phase === 'read' ? ' so far:' : ':') + '</div><div class="strip">' +
        (list.length ? list.map(function (tk) { return NL.tile(tk); }).join('') : '<span class="small">Tap the first node.</span>') + '</div>';
      act.innerHTML = '';
      if (T.phase !== 'read') {
        var b = el('button', { type: 'button', class: 'btn' }, 'Next tree ' + NL.ICON.next);
        b.addEventListener('click', function () { NL.say(fb, ''); newTree(); });
        act.appendChild(b);
      }
      act.appendChild(NLWalk.button(walkMe));
      if (note) NL.say(fb, note[0], note[1]);
      NL.reportHeight();
    }

    function tap(id) {
      if (T.phase !== 'read') return;
      if (id === T.order[T.read.length]) {
        T.read.push(id); score += 3; streak++; sup.right();
        if (T.read.length === T.order.length) { finish(true); return; }
        draw(['', '']);
        return;
      }
      T.hearts--; T.mistakes++; streak = 0; sup.wrong();
      T.bad = id;
      NL.later(700, function () { T.bad = -1; if (T.phase === 'read') draw(); });
      var why = readWhy(T.nodes[id]);
      if (T.hearts <= 0) { T.read = T.order.slice(); finish(false, why + ' No hearts left: here is the order.'); return; }
      draw([why, 'bad']);
    }
    // Why a tapped node is not next (James 2026-10-27: students could not work out the order to tap in).
    function below(n) { return n.op ? [n.l.id, n.r.id].concat(below(n.l), below(n.r)) : []; }
    function done(n) { return T.read.indexOf(n.id) >= 0 && below(n).every(function (k) { return T.read.indexOf(k) >= 0; }); }
    function label(n) { return '<b class="calc">' + esc(n.op || n.v) + '</b>'; }
    function readWhy(n) {
      var left = null;
      for (var c = n; c.parent && !left; c = c.parent) if (c === c.parent.r && !done(c.parent.l)) left = c.parent;
      if (T.form === 'postfix') {
        if (n.op && below(n).some(function (k) { return T.read.indexOf(k) < 0; })) return 'Not yet. In postfix a node is read only after everything below it. Tap the nodes below ' + label(n) + ' first.';
        if (left) return 'Not yet. Finish the whole left branch under ' + label(left) + ' before you start its right branch.';
        return 'Not yet. Postfix: the whole left branch, then the whole right branch, then the node at the top.';
      }
      if (n.parent && T.read.indexOf(n.parent.id) < 0) return 'Not yet. In prefix a node is read before anything below it. Tap ' + label(n.parent) + ' first.';
      if (left) return 'Not yet. Finish the whole left branch under ' + label(left) + ' before you start its right branch.';
      return 'Not yet. Prefix: the node at the top first, then the whole left branch, then the whole right branch.';
    }

    function walkMe() {
      var form = T.form;
      var ex = NLWalk.pick(function () {
        var t = generate(), W = NLWalk.treeRead(t, form, small);
        return { key: NC.toPrefix(t).join(' '), answer: W.answer, steps: W.steps };
      }, { key: NC.toPrefix(T.tree).join(' '), answer: answerOf(T.tree, form) });
      if (!ex) { NL.say(fb, 'Try that again in a moment.', 'hint'); return; }
      T.walked = true;
      NLWalk.open(host, { title: 'Walk me through it', question: 'Read this tree in <b>' + form + '</b>.', steps: ex.steps,
        onClose: function (seen, total) { log.help('a different tree read in ' + form, seen, total); draw(); } });
    }

    function finish(solved, msg) {
      var shown = NC.toInfix(T.tree);
      log.add('tree of ' + shown + ' read in ' + T.form + (solved ? (T.mistakes ? ', ' + T.mistakes + ' mistake' + (T.mistakes > 1 ? 's' : '') + ' (not counted)' : ', no mistakes') : ', out of hearts') + (T.walked ? ', used Walk me through it' : ''), solved && !T.mistakes);
      var up = false;
      if (!solved || T.mistakes) have = 0;
      else {
        score += 10; have += 1;
        if (have >= NEED && lv < LEVELS.length - 1) { lv++; have = 0; up = true; }
        else if (have >= NEED) { log.finish(); have = 0; }
      }
      T.phase = solved ? 'end' : 'over';
      var text = (msg ? msg + ' ' : '') + (!solved ? 'This one does not count. You need ' + NEED + ' trees in a row with no mistakes.' :
        T.mistakes ? 'Read, but with ' + (T.mistakes === 1 ? 'a mistake' : T.mistakes + ' mistakes') + ', so it does not count. Read the next one with no mistakes.' : 'Read with no mistakes: +10.');
      if (T.form === 'postfix') text += ' Postfix is the order the Stack Machine needs: both values are on the stack before their operator arrives.';
      if (up) text += ' Level up: ' + esc(LEVELS[lv].name) + '.';
      if (log.isDone() && lv === LEVELS.length - 1 && solved && !T.mistakes) text = NL.doneBanner('You can read big trees in prefix and postfix. Keep going for a higher score.') + text;
      draw([text, solved && !T.mistakes ? '' : 'hint']);
    }

    newTree();
  };
})();
