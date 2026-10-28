// Find X (?mode=findx). An equation with a 5-bit x: find every x that makes it true.
// - When one pattern describes all the answers, the student builds it: each bit is 0, 1 or * (any bit).
// - Otherwise the student picks every answer from the 32 possible values.
// Two free tests per puzzle show the working for one x of the student's choice. One Check per puzzle; a wrong answer
// costs a life and shows every answer. Levels move from x AND / OR a mask, through NOT and circulates, to shifts
// (lost bits), precedence inside the equation, and x used twice.
(function () {
  'use strict';
  var F = Flick, B = BitCore, el = F.el;
  var host = document.getElementById('game');
  var L = 5;
  var TEMPLATES = [
    ['x AND {M}', 'x OR {M}'],
    ['x XOR {M}', 'NOT x AND {M}', 'NOT x OR {M}', 'x AND {M}'],
    ['(LCIRC-{k} x) AND {M}', '(RCIRC-{k} x) OR {M}', '(LCIRC-{k} x) XOR {M}', 'NOT x OR {M}'],
    ['(LSHIFT-{k} x) OR {M}', '(RSHIFT-{k} x) AND {M}', '(LCIRC-{K} x) AND {M}', '(RCIRC-{K} x) OR {M}', 'NOT (RCIRC-{k} x) AND {M}']
  ];
  // Year 7 (2026-10-28): the levels stop at one mask, so every puzzle can be solved column by column (solveSteps).
  var game, area, report = F.results('findx', 'Find X', 5);
  var base = 1, inRow = 0, puzzleNo = 0, seen = {}, T = BitTeach;

  host.appendChild(el('p', { class: 'small' }, 'Find <b>every</b> 5-bit x that makes the equation true. Use <b>*</b> for a bit that can be 0 or 1. You get 2 free tests, then one Check. 2 right in a row moves you up a level.'));
  game = F.Game(host, { lives: 3 });
  area = el('div');
  host.appendChild(area);

  function level() { return Math.min(TEMPLATES.length, base); }
  function won() { inRow++; if (inRow >= 2) { inRow = 0; if (base < TEMPLATES.length) { base++; return true; } } return false; }

  // The column method on "chain(x) OP M = R": first find the bits the chain must give (y), column by column, then
  // undo each NOT, shift and circulate from the outside in. Returns { steps, pattern } or null for another shape.
  function solveSteps(tree, rhs) {
    if (tree.t !== 'bin' || tree.b.t !== 'bits') return null;
    var op = tree.op, M = tree.b.v, y = '', out = [], Rw = T.row, i;
    var inner = B.show(tree.a).replace(/^\((.*)\)$/, '$1');
    var yName = tree.a.t === 'var' ? 'x' : 'y';
    out.push({ text: (yName === 'y' ? 'Call the part before ' + op + ' <b>y</b> (here y = ' + T.code(inner) + '). ' : '') + 'First find what ' + yName + ' must be, <b>one column at a time</b>, using the ' + op + ' rule: ' + T.esc(T.RULE[op]),
      html: Rw(yName, '?????') + Rw(op, M) + '<div class="bt-line"></div>' + Rw('=', rhs) });
    for (i = 0; i < M.length; i++) {
      var m = M[i], r = rhs[i], v, why;
      if (op === 'AND') { if (m === '1') { v = r; why = 'AND with 1 copies the bit, so ' + yName + ' must be ' + r + '.'; } else { v = '*'; why = 'AND with 0 always gives 0, whatever ' + yName + ' is, so this bit can be 0 or 1: *.'; } }
      else if (op === 'OR') { if (m === '0') { v = r; why = 'OR with 0 copies the bit, so ' + yName + ' must be ' + r + '.'; } else { v = '*'; why = 'OR with 1 always gives 1, whatever ' + yName + ' is, so this bit can be 0 or 1: *.'; } }
      else { v = m === r ? '0' : '1'; why = 'XOR gives 1 when the bits are different. The mask bit is ' + m + ' and the answer is ' + r + ', so ' + yName + ' must be ' + v + '.'; }
      y += v;
      var hl = {}; hl[i] = 'hl';
      out.push({ text: 'Column ' + (i + 1) + ': the mask bit is ' + T.code(m) + ' and the answer bit is ' + T.code(r) + '. ' + why,
        html: Rw(yName, y + new Array(M.length - i).join('?'), hl) + Rw(op, M, hl) + '<div class="bt-line"></div>' + Rw('=', rhs, hl) });
    }
    var node = tree.a, pat = y, L = y.length;
    while (node.t !== 'var') {
      var before = pat, f = node.t === 'not' ? 'NOT' : node.op, n = node.n || 0, text;
      if (f === 'NOT') { pat = pat.replace(/[01]/g, function (c) { return c === '1' ? '0' : '1'; }); text = 'y has NOT in front, so undo it: flip every 0 and 1. A * stays *.'; }
      else if (f === 'LCIRC' || f === 'RCIRC') {
        var k = n % L, back = f === 'LCIRC' ? 'RCIRC' : 'LCIRC';
        for (var j = 0; j < k; j++) pat = B.shift(back, 1, pat);
        text = (n >= L ? n + ' moves on ' + L + ' bits is the same as ' + k + ' (every ' + L + ' moves go all the way round). ' : '') +
          'Undo ' + f + '-' + n + ' by moving the bits back the other way: ' + back + '-' + k + '. Nothing is lost in a circulate.';
      } else if (f === 'LSHIFT') { pat = new Array(n + 1).join('*') + pat.slice(0, L - n); text = 'Undo LSHIFT-' + n + ': move the bits back ' + n + ' place' + (n > 1 ? 's' : '') + ' right. The ' + n + ' left bit' + (n > 1 ? 's' : '') + ' of x fell off the end, so ' + (n > 1 ? 'they' : 'it') + ' can be anything: *.'; }
      else { pat = pat.slice(n) + new Array(n + 1).join('*'); text = 'Undo RSHIFT-' + n + ': move the bits back ' + n + ' place' + (n > 1 ? 's' : '') + ' left. The ' + n + ' right bit' + (n > 1 ? 's' : '') + ' of x fell off the end, so ' + (n > 1 ? 'they' : 'it') + ' can be anything: *.'; }
      out.push({ text: text, html: Rw('before', before) + Rw('after', pat) });
      node = node.a;
    }
    out.push({ text: 'So x = ' + T.code(pat) + '. Every * can be 0 or 1. Test one value to be sure.', html: Rw('x =', pat) });
    return { steps: out, pattern: pat };
  }
  function opsIn(tree) {
    var list = [];
    (function walk(n) { if (n.t === 'bits' || n.t === 'var') return; list.push(n.t === 'sh' ? n.op + '-' + n.n : B.opName(n)); walk(n.a); if (n.t === 'bin') walk(n.b); })(tree);
    return list;
  }
  function walkFind(lv, cur) {
    var ex = null;
    for (var t = 0; t < 300 && !ex; t++) {
      var e = make(lv);
      if (!e || !e.pat || e.src === cur.src || e.pat === cur.pat) continue;
      var w = solveSteps(e.tree, e.rhs);
      if (w && w.pattern === e.pat) ex = { e: e, w: w };
    }
    if (!ex) return;
    T.open(area, { question: 'Example: find x when ' + T.code(B.show(ex.e.tree) + ' = ' + ex.e.rhs), steps: ex.w.steps, note: 'A similar puzzle with different bits. Then solve yours the same way.' });
  }
  function make(lv) {
    for (var tries = 0; tries < 600; tries++) {
      var src = F.pick(TEMPLATES[lv - 1])
        .replace('{k}', String(F.rnd(1, 4)))
        .replace('{K}', String(F.rnd(6, 23)))
        .replace('{M}', F.randBits(L))
        .replace('{N}', F.randBits(L));
      var tree = B.parse(src), x0 = B.allX(L)[F.rnd(0, 31)], rhs = B.evaluate(tree, x0);
      var sols = B.solve(tree, rhs, L), pat = B.pattern(sols);
      if (sols.length >= 32 || sols.length > 16) continue;
      if (lv >= 2 && sols.length === 1 && Math.random() < 0.5) continue;
      if (!pat && sols.length > 8) continue;
      return { src: src, tree: tree, rhs: rhs, sols: sols, pat: pat };
    }
  }

  function play() {
    var lv = level(), p = make(lv), testsLeft = 2, done = false, picked = {};
    var stage = el('div', { class: 'stage' });
    stage.appendChild(el('div', { class: 'round-head' }, '<span class="round-kind">Puzzle ' + (puzzleNo + 1) + '</span><span class="small">' +
      (p.pat ? 'Answer as one pattern: click each bit for 0, 1 or *.' : 'No single pattern fits: pick every answer.') + '</span>'));
    stage.appendChild(el('div', { class: 'equation' }, F.esc(B.show(p.tree)) + ' = ' + p.rhs));
    stage.appendChild(el('div', { class: 'bt-rule' }, T.ruleLine(opsIn(p.tree))));
    var cols = el('div', { class: 'fx-cols' }), left = el('div'), right = el('div');
    cols.appendChild(left); cols.appendChild(right);
    stage.appendChild(cols);
    var answerBox = el('div', { class: 'answer-box' });
    left.appendChild(answerBox);
    var input = null, tiles = [];
    if (p.pat) {
      input = F.inputRow(L, ['0', '1', '*'], { label: 'x =', cls: 'result', onEnter: check, aria: 'Your pattern: click each bit for 0, 1 or *' });
      answerBox.appendChild(input.node);
    } else {
      var grid = el('div', { class: 'tiles', role: 'group', 'aria-label': 'Every possible x' });
      B.allX(L).forEach(function (x) {
        var t = el('button', { type: 'button', class: 'tile', 'aria-pressed': 'false' }, x);
        t.addEventListener('click', function () { if (done) return; picked[x] = !picked[x]; t.setAttribute('aria-pressed', String(!!picked[x])); });
        tiles.push({ x: x, b: t });
        grid.appendChild(t);
      });
      answerBox.appendChild(grid);
    }
    var actions = el('div', { class: 'actions' });
    var checkBtn = F.btn('Check', 'check', '', check);
    actions.appendChild(checkBtn);
    var walkBtn = T.button(function () { walkFind(lv, p); });
    actions.appendChild(walkBtn);
    left.appendChild(actions);
    var say = F.feedback(left);

    // The tester: try one x, see each step.
    var tester = el('div', { class: 'tester' });
    var tHead = el('p', { class: 'small' });
    tester.appendChild(tHead);
    var tInput = F.inputRow(L, ['0', '1'], { label: 'test x =', onEnter: runTest, aria: 'A value of x to test' });
    tester.appendChild(tInput.node);
    var tActions = el('div', { class: 'actions' });
    var testBtn = F.btn('Test it', 'test', 'secondary', runTest);
    tActions.appendChild(testBtn);
    tester.appendChild(tActions);
    var tOut = el('div');
    tester.appendChild(tOut);
    right.appendChild(tester);
    function testHead() { tHead.innerHTML = '<b>Test a value</b>: ' + testsLeft + ' test' + (testsLeft === 1 ? '' : 's') + ' left. It shows the working for one x.'; }
    testHead();
    area.innerHTML = '';
    area.appendChild(stage);
    (function teach(list) {
      if (!list.length) { if (input) input.focus(); return; }
      var op = list.shift();
      if (!T.newOp(area, seen, op, L, function () { teach(list); })) teach(list);
    })(opsIn(p.tree));
    F.reportHeight();

    function runTest() {
      if (done || testsLeft <= 0) return;
      if (!tInput.complete()) { tOut.innerHTML = '<p class="feedback hint">Set all 5 bits of the test value first.</p>'; F.reportHeight(); return; }
      testsLeft--;
      var x = tInput.value(), steps = B.trace(p.tree, x), got = B.evaluate(p.tree, x);
      tOut.innerHTML = '';
      var list = el('ol', { class: 'trace' });
      steps.forEach(function (s) { list.appendChild(el('li', null, F.esc(s.text))); });
      tOut.appendChild(list);
      tOut.appendChild(el('p', { class: got === p.rhs ? 'feedback good' : 'feedback bad' }, 'x = ' + x + ' gives ' + got + (got === p.rhs ? ': it works.' : ', not ' + p.rhs + ': it does not work.')));
      testHead();
      if (testsLeft <= 0) testBtn.disabled = true;
      F.reportHeight();
    }

    function check() {
      if (done) return;
      var ok, given;
      if (p.pat) {
        if (!input.complete()) { say('Set every bit first: 0, 1 or *.', 'hint'); return; }
        given = input.value();
        ok = given === p.pat;
        input.lock(F.diffMarks(given, p.pat));
      } else {
        var chosen = B.allX(L).filter(function (x) { return picked[x]; });
        if (!chosen.length) { say('Pick every value of x that works first.', 'hint'); return; }
        given = chosen.join(', ');
        ok = chosen.join() === p.sols.join();
        tiles.forEach(function (t) {
          var want = p.sols.indexOf(t.x) >= 0;
          if (want && picked[t.x]) t.b.classList.add('good');
          else if (want) t.b.classList.add('missed');
          else if (picked[t.x]) t.b.classList.add('bad');
        });
      }
      done = true;
      checkBtn.disabled = true;
      testBtn.disabled = true;
      walkBtn.remove();
      report.add(game, B.show(p.tree) + ' = ' + p.rhs + ': ' + given, ok);
      var list = p.sols.length <= 8 ? ' (' + p.sols.join(', ') + ')' : '';
      if (ok) {
        var up = won(), gain = game.right(15);
        say((up ? 'Level up! ' : '') + 'Right. ' + (p.pat ? p.pat + ' covers ' + p.sols.length + ' value' + (p.sols.length > 1 ? 's' : '') + list + '.' : 'All ' + p.sols.length + ' found.') + ' +' + gain, 'good');
        next(actions, false);
        return;
      }
      inRow = 0;
      var over = game.wrong();
      say('Not quite. This puzzle does not count. ' + (p.pat ? 'The answer is <code>' + p.pat + '</code>: ' + p.sols.length + ' value' + (p.sols.length > 1 ? 's' : '') + list + '.' : 'Green tiles you found, dashed tiles you missed, red tiles do not work.'), 'bad');
      var own = solveSteps(p.tree, p.rhs);
      left.insertBefore(el('div', { class: 'why' }, own && own.pattern === p.pat ? '<b>How to get it:</b><ol class="bt-steps">' + own.steps.slice(1).map(function (st) { return '<li>' + st.text + '</li>'; }).join('') + '</ol>' :
        'Work from the outside in. Undo each operator to find what x must be in every column. ' +
        'A column that a mask hides (AND with 0, OR with 1) or a bit that a shift pushes off can be anything: <b>*</b>. Then test one answer to be sure.'), actions);
      next(actions, over);
    }
  }
  function next(actions, over) {
    var b = F.btn(over ? 'See score' : 'Next puzzle', 'next', 'secondary', function () {
      if (over) return F.overPanel(area, game, 'You reached level ' + game.level + '.', function () { base = Math.max(1, game.level - 1); inRow = 0; game.restart(base); render(); });
      puzzleNo++;
      render();
    });
    actions.appendChild(b);
    b.focus();
    F.reportHeight();
  }
  function render() {
    game.level = level();
    game.draw();
    play();
  }
  if (F.embedded) render();
  else T.gate(host, { title: 'How to play Find X (challenge)', go: 'Start', onGo: render, html:
    '<ol><li>You see an equation with an unknown 5-bit string <b>x</b>. Find <b>every</b> x that makes it true.</li>' +
    '<li>Click each box of <b>x =</b> to set 0, 1 or <b>*</b>. A * means that bit can be 0 or 1.</li>' +
    '<li>You may <b>test</b> 2 values of x first: set the bits and press Test it. Then press <b>Check</b> once.</li>' +
    '<li>Stuck? Press <b>Walk me through it</b>. 2 right in a row moves you up a level.</li></ol>' +
    '<div class="bt-ex"><p class="bt-ex-title">Worked example</p><div class="bt-vis">' + T.row('x', '*100*') + T.row('AND', '01110') + '<div class="bt-line"></div>' + T.row('=', '01000') + '</div>' +
    '<p class="bt-text">Go column by column. Where the mask has 1, AND copies x, so x must match the answer: 1, 0, 0. ' +
    'Where the mask has 0, the answer is 0 whatever x is, so x can be anything: *. So x = <b class="bt-code">*100*</b>.</p></div>' });
})();
