// Tree Builder (?mode=tree): build the expression tree of an infix expression from the bottom up, in the order you
// would work it out (James 2026-10-27: "Shouldn't we work from the bottom up when creating a tree?", and students were
// confused by building a tree and converting to prefix or postfix at the same time, so this mode only builds; Tree
// Reader reads a finished tree). Click the operator worked out FIRST: inside brackets first, then the power arrow
// (right to left), then * and /, then + and - (left to right). It joins its two values into a small tree, which then
// counts as one value (one block in the expression). Repeat until one tree is left: the last operator joined is the
// top. Every right click shows why; every wrong click says why not. A tree with a mistake never counts; NEED clean
// trees in a row move up a level. Levels: two operators, brackets, same rank, the power arrow, contest style (3(A+2B)).
// How it works: before the first tree of each level, and on its button, a worked example on another expression.
// Walk me through it: the same on a fresh expression of the same level, never the student's own.
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc;
  var FOUR = ['+', '-', '*', '/'], ALL = FOUR.concat([NC.POW]);
  var LEVELS = [
    { name: 'Two operators', n: 2, ops: FOUR, noBrackets: true },
    { name: 'Brackets', n: [2, 3], ops: FOUR, brackets: true },
    { name: 'Same rank', n: [3, 4], ops: FOUR, chain: true },
    { name: 'Power arrow', n: [3, 4], ops: ALL, mustUse: [NC.POW] },
    { name: 'Contest style', n: [3, 5], ops: FOUR, implied: true }
  ];
  var EXAMPLES = ['P - Q * R', '(P + Q) * R', 'P - Q + R * S', 'P * Q ' + NC.POW + ' 2', '2(P + 3Q)'];
  var NEED = 2, HEARTS = 3;

  NL.activities.tree = function (host) {
    var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(NL.params.get('level'), 10) || 1) - 1));
    var have = 0, score = 0, streak = 0;
    var log = NL.results('Tree Builder');
    var small = document.documentElement.classList.contains('embed');
    var T = null, walked = {};

    var bar = NL.topbar(host);
    var q = el('p', { class: 'task-q' });
    var rule = el('div', { class: 'rule-box' });
    var sup = NL.support('tree', rule);
    sup.toggle(bar.slot);
    var stripBox = el('div'), treeBox = el('div', { class: 'tree-wrap' }), endBox = el('div'), act = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback' });
    [q, rule, stripBox, treeBox, endBox, act, fb].forEach(function (n) { host.appendChild(n); });

    function L() { return LEVELS[lv]; }
    function implied() { return !!L().implied; }

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
    // Two operators of the same rank next to each other with no brackets (A - B + C).
    function hasChain(t) {
      if (!t.op) return false;
      if (t.l.op && NC.PREC[t.l.op] === NC.PREC[t.op]) return true;
      return hasChain(t.l) || hasChain(t.r);
    }

    // ------------------------------------------------ How it works and Walk me through it
    function howItWorks() {
      var W = NLWalk.treeBuild(NC.parseInfix(EXAMPLES[lv]), implied(), small);
      NLWalk.open(host, { title: 'How to build a tree', note: '', steps: W.steps, doneLabel: 'Build a tree ' + NL.ICON.play, onClose: function () { draw(); } });
    }
    function walkMe() {
      var mine = T;
      var ex = NLWalk.pick(function () {
        var t = generate(), W = NLWalk.treeBuild(t, implied(), small);
        return { key: NC.toPrefix(t).join(' '), question: W.question, answer: W.question, steps: W.steps };
      }, { key: NC.toPrefix(T.tree).join(' '), question: T.shown, answer: T.shown });
      if (!ex) { NL.say(fb, 'Try that again in a moment.', 'hint'); return; }
      T.walked = true;
      NLWalk.open(host, { title: 'Walk me through it', question: 'Build the tree of ' + '<b class="calc">' + esc(ex.question) + '</b>', steps: ex.steps,
        onClose: function (seen, total) { log.help('tree for ' + ex.question + ' while on ' + mine.shown, seen, total); draw(); } });
    }

    function newExpr() {
      var tree = generate();
      T = { tree: tree, nodes: NLWalk.treeIndex(tree), joined: {}, newest: -1, hearts: HEARTS, mistakes: 0, phase: 'build', flash: null, shown: NC.toInfix(tree, { implied: implied() }) };
      sup.set([
        'Click the operator worked out <b>first</b>. Brackets first, then ' + NC.POW + ' (right to left), then * and /, then + and -. Two of the same rank: go from left to right.',
        'First: brackets, then ' + NC.POW + ', then * and /, then + and -.',
        'Which one would you work out first?'
      ]);
      draw();
      if (!walked[lv]) { walked[lv] = true; howItWorks(); }
    }

    function draw(note) {
      var lev = L();
      bar.set({ level: 'Level ' + (lv + 1) + ': ' + lev.name, have: have, need: log.isDone() && lv === LEVELS.length - 1 ? 0 : NEED, score: score, streak: streak, hearts: T.hearts });
      if (T.phase === 'build') q.innerHTML = 'Build the tree from the bottom up. Click the operator that is worked out <b>first</b>.' + (lev.implied ? ' A number written next to a letter or a bracket hides a *: it is the dashed tile.' : '') +
        '<span class="small" style="display:block;margin-top:6px">How: (1) find the operator worked out first; (2) it joins its two values into a small tree; (3) that small tree now counts as one value; (4) do the same again until one tree is left. A tree with a mistake does not count.</span>';
      else q.innerHTML = 'The tree is built.';
      drawStrip();
      treeBox.innerHTML = NLWalk.treeSvg(T.tree, { layout: 'height', joined: T.phase === 'build' ? T.joined : null, hot: T.newest, small: small });
      endBox.innerHTML = T.phase === 'build' ? '' : '<p class="small" style="margin-top:8px">The last operator joined, <b class="calc">' + esc(implied() && NC.hiddenTimes(T.tree) ? 'the hidden *' : T.tree.op) +
        '</b>, sits at the <b>top</b> of the tree. It is worked out last, so it joins the two biggest parts.</p>';
      act.innerHTML = '';
      if (T.phase !== 'build') {
        var b = el('button', { type: 'button', class: 'btn' }, 'Next expression ' + NL.ICON.next);
        b.addEventListener('click', function () { NL.say(fb, ''); newExpr(); });
        act.appendChild(b);
      }
      act.appendChild(NLWalk.button(walkMe));
      var how = el('button', { type: 'button', class: 'btn secondary' }, 'How it works');
      how.addEventListener('click', howItWorks);
      act.appendChild(how);
      if (note) NL.say(fb, note[0], note[1]);
      NL.reportHeight();
    }

    function items() { return NLWalk.treeItems(T.tree, T.joined, implied()); }
    function drawStrip() {
      stripBox.innerHTML = '';
      var strip = el('div', { class: 'strip' });
      var list = T.phase === 'build' ? items() : [{ kind: 'blk', node: 0, text: T.shown }];
      list.forEach(function (it, i) {
        if (it.kind === 'blk') { strip.appendChild(el('span', { class: 'tok grp' + (it.node === T.newest ? ' enter' : '') }, esc(it.text))); return; }
        var cls = 'tok' + (it.kind === 'op' ? ' op' : it.kind === 'hid' ? ' hid' : it.kind === 'br' ? ' br' : '') + (T.flash === i ? ' flash-bad' : '');
        var text = it.kind === 'hid' ? '·' : esc(it.text);
        if (it.kind === 'op' || it.kind === 'hid') {
          var b = el('button', { type: 'button', class: cls, 'aria-label': it.kind === 'hid' ? 'hidden multiplication' : 'operator ' + it.text }, text);
          b.addEventListener('click', function () { pickOp(i); });
          strip.appendChild(b);
        } else strip.appendChild(el('span', { class: cls }, text));
      });
      stripBox.appendChild(strip);
    }

    function pickOp(i) {
      if (T.phase !== 'build') return;
      var list = items(), N = NLWalk.treeNext(list), it = list[i];
      if (i === N.at) {
        var n = T.nodes[it.node], imp = implied();
        T.joined[n.id] = true;
        T.newest = n.id;
        score += 10; streak++; sup.right();
        var name = it.kind === 'hid' ? 'The hidden *' : '<b class="calc">' + esc(it.text) + '</b>';
        var msg = 'Yes. ' + name + ' is worked out first: ' + N.why + '. It joins <b class="calc">' + esc(NC.toInfix(n.l, { implied: imp })) + '</b> and <b class="calc">' +
          esc(NC.toInfix(n.r, { implied: imp })) + '</b> into a small tree. Now <b class="calc">' + esc(NC.toInfix(n, { implied: imp })) + '</b> counts as one value.';
        if (n === T.tree) { finish(true, msg); return; }
        draw([msg, '']);
        return;
      }
      T.hearts--; T.mistakes++; streak = 0; sup.wrong();
      T.flash = i;
      NL.later(700, function () { T.flash = null; if (T.phase === 'build') drawStrip(); });
      var why = NLWalk.treeWrong(list, i, N);
      if (T.hearts <= 0) {
        T.nodes.forEach(function (x) { if (x.op) T.joined[x.id] = true; });
        finish(false, why + ' No hearts left: here is the whole tree.');
        return;
      }
      draw([why, 'bad']);
    }

    function finish(solved, msg) {
      log.add(T.shown + (solved ? (T.mistakes ? ', ' + T.mistakes + ' mistake' + (T.mistakes > 1 ? 's' : '') + ' (not counted)' : ', no mistakes') : ', out of hearts') + (T.walked ? ', used Walk me through it' : ''), solved && !T.mistakes);
      var up = false;
      // James 2026-10-27: a tree with any mistake never counts, so guessing cannot move anyone on.
      if (!solved || T.mistakes) have = 0;
      else {
        score += 20; have += 1;
        if (have >= NEED && lv < LEVELS.length - 1) { lv++; have = 0; up = true; }
        else if (have >= NEED) { log.finish(); have = 0; }
      }
      T.phase = solved ? 'end' : 'over';
      T.newest = -1;
      var text = msg + ' ' + (!solved ? 'This one does not count. You need ' + NEED + ' trees in a row with no mistakes.' :
        T.mistakes ? 'The tree is built, but with ' + (T.mistakes === 1 ? 'a mistake' : T.mistakes + ' mistakes') + ', so it does not count. Build the next one with no mistakes.' : 'Tree built with no mistakes: +20.');
      if (up) text += ' Level up: ' + esc(LEVELS[lv].name) + '.';
      if (log.isDone() && lv === LEVELS.length - 1 && solved && !T.mistakes) text = NL.doneBanner('You can build contest-style trees. Keep going for a higher score.') + text;
      draw([text, solved && !T.mistakes ? '' : 'hint']);
    }

    newExpr();
  };
})();
