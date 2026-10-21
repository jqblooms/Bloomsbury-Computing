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
    ['(LSHIFT-{k} x) OR {M}', '(RSHIFT-{k} x) AND {M}', '(LCIRC-{K} x) AND {M}', '(RCIRC-{K} x) OR {M}', 'NOT (RCIRC-{k} x) AND {M}'],
    ['(LCIRC-{k} x) AND {M} OR {N}', 'x XOR {M} AND {N}', 'NOT x AND {M} XOR {N}', '(RSHIFT-{k} x) OR {M} AND {N}', 'x OR {M} AND {N}'],
    ['x AND (LCIRC-1 x)', 'x OR (RSHIFT-1 x)', 'x XOR (LCIRC-{k} x)', 'x AND NOT (RCIRC-1 x)', '(LCIRC-{K} x) AND {M} OR {N}']
  ];
  var game, area, report = F.results('findx', 'Find X', 5);
  var base = 1, solved = 0, puzzleNo = 0;

  host.appendChild(el('p', { class: 'small' }, 'Find <b>every</b> 5-bit x that makes the equation true. Use <b>*</b> for a bit that can be 0 or 1. You get 2 free tests, then one Check.'));
  game = F.Game(host, { lives: 3 });
  area = el('div');
  host.appendChild(area);

  function level() { return Math.min(TEMPLATES.length, base + Math.floor(solved / 2)); }
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
    if (input) input.focus();
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
      report.add(game, B.show(p.tree) + ' = ' + p.rhs + ': ' + given, ok);
      var list = p.sols.length <= 8 ? ' (' + p.sols.join(', ') + ')' : '';
      if (ok) {
        solved++;
        var gain = game.right(15);
        say('Right. ' + (p.pat ? p.pat + ' covers ' + p.sols.length + ' value' + (p.sols.length > 1 ? 's' : '') + list + '.' : 'All ' + p.sols.length + ' found.') + ' +' + gain, 'good');
        next(actions, false);
        return;
      }
      var over = game.wrong();
      say('Not quite. ' + (p.pat ? 'The answer is <code>' + p.pat + '</code>: ' + p.sols.length + ' value' + (p.sols.length > 1 ? 's' : '') + list + '.' : 'Green tiles you found, dashed tiles you missed, red tiles do not work.'), 'bad');
      left.insertBefore(el('div', { class: 'why' }, 'Work from the outside in. Undo each operator to find what x must be in every column. ' +
        'A column that a mask hides (AND with 0, OR with 1) or a bit that a shift pushes off can be anything: <b>*</b>. Then test one answer to be sure.'), actions);
      next(actions, over);
    }
  }
  function next(actions, over) {
    var b = F.btn(over ? 'See score' : 'Next puzzle', 'next', 'secondary', function () {
      if (over) return F.overPanel(area, game, 'You reached level ' + game.level + '.', function () { base = Math.max(1, game.level - 1); solved = 0; game.restart(base); render(); });
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
  render();
})();
