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
  var base = 1, solved = 0, exprNo = 0;

  host.appendChild(el('p', { class: 'small' }, 'Click the operator that is worked <b>next</b>. Then set every bit of its result and Check. A wrong choice or a wrong result costs a life.'));
  game = F.Game(host, { lives: 3 });
  area = el('div');
  host.appendChild(area);

  function level() { return Math.min(LEVELS.length, base + Math.floor(solved / 2)); }
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
    var phase = 'choose', fresh = null;
    var stage = el('div', { class: 'stage' });
    stage.appendChild(el('div', { class: 'round-head' }, '<span class="round-kind">Expression ' + (exprNo + 1) + '</span><span class="small">Which operator is worked next?</span>'));
    var exprBox = el('div', { class: 'expr', role: 'group', 'aria-label': 'The expression' });
    stage.appendChild(exprBox);
    if (level() <= 2) stage.appendChild(el('div', { class: 'ladder' }, 'First to last: <span>NOT</span><span>SHIFT, CIRC</span><span>AND</span><span>XOR</span><span>OR</span>'));
    var work = el('div');
    stage.appendChild(work);
    var actions = el('div', { class: 'actions' });
    stage.appendChild(actions);
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
      work.innerHTML = '';
      var box = el('div', { class: 'why' });
      if (b != null) {
        box.appendChild(F.bitRow(new Array(L - a.length + 1).join(' ') + a, { label: '' }));
        box.appendChild(F.bitRow(new Array(L - b.length + 1).join(' ') + b, { label: op }));
      } else box.appendChild(F.bitRow(a, { label: op }));
      box.appendChild(el('div', { class: 'rule' }));
      var input = F.inputRow(L, ['0', '1'], { label: '=', cls: 'result', onEnter: check });
      box.appendChild(input.node);
      work.appendChild(box);
      var checkBtn = F.btn('Check', 'check', '', check);
      actions.innerHTML = '';
      actions.appendChild(checkBtn);
      input.focus();
      F.reportHeight();
      function check() {
        if (checkBtn.disabled) return;
        if (!input.complete()) { say('Set every bit first: click a box, or type 0 and 1.', 'hint'); return; }
        checkBtn.disabled = true;
        var given = input.value(), ok = given === right;
        input.lock(F.diffMarks(given, right));
        report.add(game, op + ' step: ' + given, ok, true);
        if (ok) {
          var gain = game.right(10);
          say('Right. +' + gain, 'good');
          setTimeout(function () { collapse(node, right); }, 650);
          return;
        }
        var over = game.wrong();
        box.appendChild(F.bitRow(right, { label: 'answer' }));
        box.appendChild(el('p', { class: 'small' }, F.explain(op, a, b)));
        say('Not quite. The answer is in the box.', 'bad');
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
        solved++;
        var gain = game.right(15);
        draw(null);
        say('Solved: <code>' + e.src + '</code> = <code>' + e.answer + '</code>. +' + gain, 'good');
        report.add(game, 'solved ' + e.src, true);
        next(false);
        return;
      }
      phase = 'choose';
      say('Which operator is next?', '');
      draw(null);
    }
    function next(over) {
      var b = F.btn(over ? 'See score' : 'Next expression', 'next', 'secondary', function () {
        if (over) return F.overPanel(area, game, 'You reached level ' + game.level + '.', function () { base = Math.max(1, game.level - 1); solved = 0; game.restart(base); render(); });
        exprNo++;
        render();
      });
      actions.appendChild(b);
      b.focus();
      F.reportHeight();
    }
  }
  function render() {
    game.level = level();
    game.draw();
    play();
  }
  render();
})();
