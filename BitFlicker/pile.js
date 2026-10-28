// Precedence Pile-up (?mode=pile). A long bit-string expression: click the operator that is worked next. A wrong
// choice costs a life and says why it has to wait. A right choice opens that one step: set every bit of its result,
// then Check (a wrong result costs a life too). The step then collapses into its value, until one string is left.
// Levels add NOT, shifts and circulates, chains of unary operators, brackets and longer expressions.
(function () {
  'use strict';
  var F = Flick, B = BitCore, el = F.el;
  var host = document.getElementById('game');
  var UN = ['NOT', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC'];
  var LEVELS = [
    { L: 5, bin: 2, unary: 0, unOps: [] },
    { L: 5, bin: 2, unary: 1, unOps: ['NOT'] },
    { L: 5, bin: 3, unary: 1, unOps: UN },
    { L: 5, bin: 3, unary: 2, unOps: UN, chain: true, paren: 0.5 },
    { L: 5, bin: 4, unary: 2, unOps: UN, chain: true, paren: 0.6, big: true },
    { L: 6, bin: 4, unary: 3, unOps: UN, chain: true, paren: 0.7, big: true }
  ];
  var PREC = { AND: 3, XOR: 2, OR: 1 };
  var game, area, report = F.results('pile', 'Precedence Pile-up', 4);
  var base = 1, inRow = 0, exprNo = 0, seen = {}, T = BitTeach;

  host.appendChild(el('p', { class: 'small' }, 'Click the operator that is worked <b>next</b>. Then set every bit of its result and Check. Solve 2 expressions in a row with no mistakes to level up.'));
  game = F.Game(host, { lives: 3 });
  area = el('div');
  host.appendChild(area);

  function level() { return Math.min(LEVELS.length, base); }
  // James 2026-10-27: an expression with a mistake never counts. Two clean ones in a row move up a level.
  function won() { inRow++; if (inRow >= 2) { inRow = 0; if (base < LEVELS.length) { base++; return true; } } return false; }
  function unaryOp(c) {
    var op = F.pick(c.unOps);
    if (op === 'NOT') return 'NOT';
    var n = c.big && /CIRC/.test(op) && Math.random() < 0.5 ? F.rnd(c.L + 1, c.L * 3 + 2) : F.rnd(1, 3);
    return op + '-' + n;
  }
  function makeExpr(c) {
    for (var tries = 0; tries < 400; tries++) {
      var ops = [], i;
      for (i = 0; i < c.bin; i++) ops.push(F.pick(['AND', 'OR', 'XOR']));
      var precs = ops.map(function (o) { return PREC[o]; });
      // Order must matter: at least one operator outranks the one on its left.
      if (!precs.some(function (p, k) { return k > 0 && p > precs[k - 1]; })) continue;
      var parts = [];
      for (i = 0; i <= c.bin; i++) parts.push(F.randBits(c.L));
      var unaryAt = F.shuffle(parts.map(function (_, k) { return k; })).slice(0, c.unary);
      unaryAt.forEach(function (k) {
        parts[k] = unaryOp(c) + ' ' + parts[k];
        if (c.chain && Math.random() < 0.4) parts[k] = unaryOp(c) + ' ' + parts[k];
      });
      // Brackets round one pair whose operator would otherwise wait for a neighbour.
      if (c.paren && Math.random() < c.paren) {
        var cand = [];
        for (i = 0; i < ops.length; i++) {
          var lower = (i > 0 && precs[i - 1] > precs[i]) || (i < ops.length - 1 && precs[i + 1] >= precs[i]);
          if (lower) cand.push(i);
        }
        if (cand.length) { var j = F.pick(cand); parts[j] = '(' + parts[j]; parts[j + 1] = parts[j + 1] + ')'; }
      }
      var src = parts[0];
      for (i = 0; i < ops.length; i++) src += ' ' + ops[i] + ' ' + parts[i + 1];
      var tree = B.parse(src), steps = B.trace(tree);
      // Every step should change something, so no step can be guessed by copying an operand.
      if (steps.some(function (s, k) { return /^0+$/.test(s.result) && k < steps.length - 1; })) continue;
      // No step result may equal a string already on screen (an operand or an earlier step), or it can be copied.
      var shown = src.match(/[01]{2,}/g) || [];
      if (tries < 300 && steps.some(function (s, k) { return shown.indexOf(s.result) >= 0 || steps.slice(0, k).some(function (p) { return p.result === s.result; }); })) continue;
      return { src: src, tree: tree, answer: B.evaluate(src) };
    }
    return null;
  }
  function tokens(n, out) {
    if (n.paren) out.push({ k: 'paren', t: '(' });
    if (n.t === 'bits') out.push({ k: 'bits', t: n.v, node: n });
    else if (n.t === 'bin') { tokens(n.a, out); out.push({ k: 'op', t: n.op, node: n }); tokens(n.b, out); }
    else { out.push({ k: 'op', t: B.opName(n), node: n }); tokens(n.a, out); }
    if (n.paren) out.push({ k: 'paren', t: ')' });
    return out;
  }
  function reason(node) {
    var kids = node.t === 'bin' ? [node.a, node.b] : [node.a];
    var k = kids.filter(function (x) { return x.t !== 'bits'; })[0];
    if (k.paren) return 'the part in brackets is worked first.';
    if (node.t !== 'bin') return 'a chain of NOT, shifts and circulates works right to left: the one next to the bits goes first.';
    if (k.t !== 'bin') return B.opName(k) + ' comes first. NOT, shifts and circulates go before AND, XOR and OR.';
    if (k.op === node.op) return 'two ' + node.op + 's work left to right.';
    return k.op + ' comes before ' + node.op + '. The order is AND, then XOR, then OR.';
  }

  function play() {
    var c = LEVELS[level() - 1], e = makeExpr(c);
    var phase = 'choose', fresh = null, slips = 0;
    var stage = el('div', { class: 'stage' });
    stage.appendChild(el('div', { class: 'round-head' }, '<span class="round-kind">Expression ' + (exprNo + 1) + '</span><span class="small">Which operator is worked next?</span>'));
    var exprBox = el('div', { class: 'expr', role: 'group', 'aria-label': 'The expression' });
    stage.appendChild(exprBox);
    stage.appendChild(el('div', { class: 'ladder' }, 'Order, first to last: <span>( brackets )</span><span>NOT</span><span>SHIFT, CIRC</span><span>AND</span><span>XOR</span><span>OR</span> Equal ones: left to right.'));
    var work = el('div');
    stage.appendChild(work);
    var actions = el('div', { class: 'actions' });
    stage.appendChild(actions);
    var walkRow = el('div', { class: 'actions' });
    var cur = null;
    walkRow.appendChild(T.button(function () {
      if (phase === 'predict' && cur) T.walkOp(area, cur.op, cur.a, cur.b);
      else walkOrder(c, e);
    }));
    stage.appendChild(walkRow);
    var say = F.feedback(stage);
    area.innerHTML = '';
    area.appendChild(stage);

    function draw(chosen) {
      exprBox.innerHTML = '';
      tokens(e.tree, []).forEach(function (tk) {
        var n;
        if (tk.k === 'op') {
          n = el('button', { type: 'button', class: 'tok op' + (tk.node === chosen ? ' chosen' : '') }, F.esc(tk.t));
          n.disabled = phase !== 'choose';
          n.addEventListener('click', function () { choose(tk.node, n); });
        } else n = el('span', { class: 'tok ' + tk.k + (tk.node && tk.node === fresh ? ' fresh' : '') }, F.esc(tk.t));
        exprBox.appendChild(n);
      });
      F.reportHeight();
    }
    draw(null);

    function choose(node, button) {
      if (phase !== 'choose') return;
      if (B.ready(e.tree).indexOf(node) < 0) {
        button.classList.add('nope');
        slips++;
        var over = game.wrong();
        say('Not yet: ' + reason(node), 'bad');
        report.add(game, 'chose ' + B.opName(node) + ' too early in ' + e.src, false);
        if (over) { phase = 'over'; draw(null); next(true); }
        return;
      }
      phase = 'predict';
      say('');
      draw(node);
      predict(node);
    }
    function predict(node) {
      var a = node.a.v, b = node.t === 'bin' ? node.b.v : null, op = B.opName(node), right = B.apply(node, a, b), L = right.length;
      cur = { op: op, a: a, b: b };
      work.innerHTML = '';
      var box = el('div', { class: 'why' });
      if (b != null) {
        box.appendChild(F.bitRow(new Array(L - a.length + 1).join(' ') + a, { label: '' }));
        box.appendChild(F.bitRow(new Array(L - b.length + 1).join(' ') + b, { label: op }));
      } else box.appendChild(F.bitRow(a, { label: op }));
      box.appendChild(el('div', { class: 'rule' }));
      var input = F.inputRow(L, ['0', '1'], { label: '=', cls: 'result', onEnter: check });
      box.appendChild(input.node);
      box.appendChild(el('p', { class: 'small' }, 'Click each box on the <b>=</b> row to set 0 or 1, then press Check.'));
      box.appendChild(el('div', { class: 'bt-rule' }, T.ruleLine([op])));
      work.appendChild(box);
      var checkBtn = F.btn('Check', 'check', '', check);
      actions.innerHTML = '';
      actions.appendChild(checkBtn);
      if (!T.newOp(area, seen, op, L, function () { input.focus(); })) input.focus();
      F.reportHeight();
      function check() {
        if (checkBtn.disabled) return;
        if (!input.complete()) { say('Set every bit first: click a box, or type 0 and 1.', 'hint'); return; }
        checkBtn.disabled = true;
        var given = input.value(), ok = given === right;
        input.lock(F.diffMarks(given, right));
        report.add(game, op + ' step: ' + given, ok, true);
        if (ok) {
          var gain = slips ? 0 : game.right(10);
          say('Right.' + (gain ? ' +' + gain : ''), 'good');
          setTimeout(function () { collapse(node, right); }, 650);
          return;
        }
        slips++;
        var over = game.wrong();
        box.appendChild(F.bitRow(right, { label: 'answer' }));
        box.appendChild(el('p', { class: 'small' }, F.explain(op, a, b)));
        say('Not quite. The right answer is in the box. This expression will not count now, but finish it to practise.<div class="bt-wrong">' + T.wrongWhy(op, a, b, given, right) + '</div>', 'bad');
        if (over) { phase = 'over'; next(true); return; }
        actions.appendChild(F.btn('Continue', 'next', 'secondary', function () { collapse(node, right); }));
      }
    }
    function collapse(node, value) {
      if (phase === 'over') return;
      ['a', 'b', 'op', 'n', 'paren'].forEach(function (k) { delete node[k]; });
      node.t = 'bits';
      node.v = value;
      fresh = node;
      work.innerHTML = '';
      actions.innerHTML = '';
      if (e.tree.t === 'bits') {
        phase = 'done';
        walkRow.remove();
        var gain = 0, up = false;
        if (slips) inRow = 0;
        else { up = won(); gain = game.right(15); }
        draw(null);
        say('Solved: <code>' + e.src + '</code> = <code>' + e.answer + '</code>.' + (slips ? ' This one had a mistake, so it does not count. Solve the next one with no mistakes.' : ' +' + gain + (up ? ' Level up!' : inRow === 1 ? ' One more with no mistakes to level up.' : '')), slips ? 'hint' : 'good');
        report.add(game, 'solved ' + e.src + (slips ? ' after a mistake (does not count)' : ''), !slips);
        next(false);
        return;
      }
      phase = 'choose';
      say('Which operator is next?', '');
      draw(null);
    }
    function next(over) {
      var b = F.btn(over ? 'See score' : 'Next expression', 'next', 'secondary', function () {
        if (over) return F.overPanel(area, game, 'You reached level ' + game.level + '.', function () { base = Math.max(1, game.level - 1); inRow = 0; game.restart(base); render(); });
        exprNo++;
        render();
      });
      actions.appendChild(b);
      b.focus();
      F.reportHeight();
    }
  }
  // Walk me through it on a similar expression: which operator goes next and why, then its result, until one is left.
  function walkOrder(c, cur) {
    var avoid = [cur.answer], ex = null;
    B.trace(cur.src).forEach(function (s) { avoid.push(s.result); });
    for (var t = 0; t < 200 && !ex; t++) {
      var e2 = makeExpr(c);
      if (!e2 || e2.src === cur.src) continue;
      if (B.trace(e2.src).some(function (s) { return avoid.indexOf(s.result) >= 0; })) continue;
      ex = e2;
    }
    if (!ex) return;
    var tree = B.parse(ex.src), steps = [];
    function strip(hl) {
      return '<div class="expr">' + tokens(tree, []).map(function (tk) {
        return '<span class="tok ' + (tk.k === 'op' ? 'op' + (tk.node === hl ? ' chosen' : '') : tk.k) + '">' + F.esc(tk.t) + '</span>';
      }).join('') + '</div>';
    }
    function inBrackets(target) {
      var hit = false;
      (function walk(n, inside) {
        if (n === target) { hit = inside; return; }
        if (n.t === 'bits' || n.t === 'var') return;
        var k = inside || !!n.paren;
        walk(n.a, k); if (n.t === 'bin') walk(n.b, k);
      })(tree, false);
      return hit || !!target.paren;
    }
    function firstReady() {
      var found = null;
      (function walk(n) {
        if (found || n.t === 'bits') return;
        walk(n.a); if (n.t === 'bin') walk(n.b);
        if (!found && n.a.t === 'bits' && (n.t !== 'bin' || n.b.t === 'bits')) found = n;
      })(tree);
      return found;
    }
    steps.push({ text: 'Do not just go left to right. Work in this order: brackets first, then NOT, then SHIFT and CIRC, then AND, then XOR, then OR. Two the same: left to right.', html: strip(null) });
    while (tree.t !== 'bits') {
      var n = firstReady(), op = B.opName(n), a = n.a.v, b = n.t === 'bin' ? n.b.v : null, r = B.apply(n, a, b), why;
      if (n.t !== 'bin') why = op + ' goes before AND, XOR and OR. It works on the bits right next to it.';
      else if (inBrackets(n) && tree !== n) why = 'it is inside brackets, so it goes first.';
      else why = 'there is no NOT or shift left to do here, and ' + n.op + ' is the highest left in the order AND, XOR, OR' + (n.op === 'AND' ? '' : ' (no ' + (n.op === 'OR' ? 'AND or XOR' : 'AND') + ' is waiting next to it)') + '.';
      steps.push({ text: 'Next is ' + T.code(op) + ': ' + why + ' Work it out: ' + T.code(b != null ? a + ' ' + op + ' ' + b : op + ' ' + a) + ' = ' + T.code(r) + '.', html: strip(n) });
      ['a', 'b', 'op', 'n', 'paren'].forEach(function (k) { delete n[k]; });
      n.t = 'bits'; n.v = r;
    }
    steps.push({ text: 'One bit string is left: ' + T.code(tree.v) + '. That is the answer. Now do yours the same way: find the operator that goes next.', html: strip(null) });
    T.open(area, { question: 'Example: ' + T.code(ex.src), steps: steps });
  }
  function render() {
    game.level = level();
    game.draw();
    play();
  }
  if (F.embedded) render();
  else T.gate(host, { title: 'How to play Precedence Pile-up', go: 'Start', onGo: render, html:
    '<ol><li>You see a long expression with several operators. They are <b>not</b> worked left to right.</li>' +
    '<li>Click the operator that is worked <b>next</b>. Order, first to last: brackets, NOT, SHIFT and CIRC, AND, XOR, OR. Two the same: left to right.</li>' +
    '<li>Then click each box to set the bits of that one step, and press <b>Check</b>. It turns into one bit string. Keep going until one string is left.</li>' +
    '<li>Stuck? Press <b>Walk me through it</b>. Solve <b>2 in a row with no mistakes</b> to level up.</li></ol>' +
    '<div class="bt-ex"><p class="bt-ex-title">Worked example</p><div class="bt-vis"><div class="expr"><span class="tok bits">1100</span><span class="tok op">OR</span><span class="tok bits">1010</span><span class="tok op chosen">AND</span><span class="tok bits">0110</span></div></div>' +
    '<p class="bt-text">AND goes before OR, so do <b class="bt-code">1010 AND 0110 = 0010</b> first. Then <b class="bt-code">1100 OR 0010 = 1110</b>.</p></div>' });
})();
