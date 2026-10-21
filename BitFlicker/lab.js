// Flick Lab (?mode=lab). Rounds alternate:
// - Predict: one operator on a bit string. Set every bit of the result, then Check once. A wrong prediction costs a
//   life and shows the right row, why, and (for shifts and circulates) the bits moving one place at a time.
// - Target: turn the start string into the target in exactly k moves. Plan every move first, then Run. Two runs per
//   target, and a failed run costs a life, so it cannot be clicked until it turns green.
// The level rises every two rounds right: more operators, longer strings, more moves, big shift and circulate counts.
(function () {
  'use strict';
  var F = Flick, B = BitCore, el = F.el;
  var host = document.getElementById('game');
  var ALL = ['NOT', 'AND', 'OR', 'XOR', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC'];
  var LEVELS = [
    { L: 5, ops: ['NOT', 'AND', 'OR', 'XOR'], max: 1, moves: 1 },
    { L: 5, ops: ['NOT', 'AND', 'OR', 'XOR', 'LSHIFT', 'RSHIFT'], max: 3, moves: 2 },
    { L: 5, ops: ['NOT', 'XOR', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC'], max: 4, moves: 2 },
    { L: 5, ops: ALL, max: 4, big: true, moves: 2, pad: true },
    { L: 6, ops: ALL, max: 5, big: true, moves: 3, pad: true },
    { L: 8, ops: ALL, max: 7, big: true, moves: 3, pad: true }
  ];
  var BINOPS = { AND: 1, OR: 1, XOR: 1 };
  var game, area, report = F.results('lab', 'Flick Lab', 8);
  var base = 1, solved = 0, roundNo = 0;

  host.appendChild(el('p', { class: 'small' }, '<b>Predict</b> rounds: set every bit of the answer, then Check. <b>Target</b> rounds: plan every move, then Run. A wrong answer costs a life.'));
  game = F.Game(host, { lives: 3 });
  area = el('div');
  host.appendChild(area);

  function level() { return Math.min(LEVELS.length, base + Math.floor(solved / 2)); }
  function cfg() { return LEVELS[level() - 1]; }
  function count(c, op) {
    if (c.big && /CIRC/.test(op) && Math.random() < 0.6) return F.rnd(c.L + 1, c.L * 4 + 3);
    if (c.big && /SHIFT/.test(op) && Math.random() < 0.2) return F.rnd(c.L, c.L + 2);
    return F.rnd(1, c.max);
  }

  // ------------------------------------------------------------ Predict
  function makePredict(c) {
    for (;;) {
      var op = F.pick(c.ops), s = F.randBits(c.L), m = null, expr;
      if (op === 'NOT') expr = 'NOT ' + s;
      else if (BINOPS[op]) {
        m = c.pad && Math.random() < 0.3 ? '1' + F.randBits(F.rnd(2, c.L - 2)) : F.randBits(c.L);
        expr = s + ' ' + op + ' ' + m;
      } else expr = op + '-' + count(c, op) + ' ' + s;
      var r = B.evaluate(expr);
      if (r !== s || Math.random() < 0.1) return { expr: expr, s: s, m: m, op: m ? op : expr.split(' ')[0], result: r };
    }
  }
  function predictRound() {
    var c = cfg(), p = makePredict(c), L = p.result.length;
    var stage = el('div', { class: 'stage' });
    stage.appendChild(el('div', { class: 'round-head' }, '<span class="round-kind">Predict</span><span class="small">Round ' + (roundNo + 1) + '</span>'));
    stage.appendChild(el('p', { class: 'expr-line' }, 'What is <code>' + F.esc(p.expr) + '</code>?'));
    if (p.m) {
      stage.appendChild(F.bitRow(p.s, { label: '' }));
      stage.appendChild(F.bitRow(new Array(L - p.m.length + 1).join(' ') + p.m, { label: p.op }));
    } else stage.appendChild(F.bitRow(p.s, { label: p.op }));
    stage.appendChild(el('div', { class: 'rule' }));
    var input = F.inputRow(L, ['0', '1'], { label: '=', cls: 'result', onEnter: check });
    stage.appendChild(input.node);
    var actions = el('div', { class: 'actions' });
    var checkBtn = F.btn('Check', 'check', '', check);
    actions.appendChild(checkBtn);
    stage.appendChild(actions);
    var say = F.feedback(stage);
    area.innerHTML = '';
    area.appendChild(stage);
    input.focus();
    F.reportHeight();

    function check() {
      if (checkBtn.disabled) return;
      if (!input.complete()) { say('Set every bit first: click a box, or type 0 and 1.', 'hint'); return; }
      checkBtn.disabled = true;
      var given = input.value(), ok = given === p.result;
      input.lock(F.diffMarks(given, p.result));
      if (ok) {
        solved++;
        var gain = game.right(10);
        say('Right. +' + gain, 'good');
      } else {
        var out = game.wrong();
        say('Not quite. The answer is below.', 'bad');
        stage.insertBefore(F.bitRow(p.result, { label: 'answer' }), actions);
      }
      var why = el('div', { class: 'why' }, F.explain(p.op, p.s, p.m));
      stage.insertBefore(why, actions);
      if (!ok && !p.m && p.op !== 'NOT') F.playMoves(why, p.op, p.s);
      report.add(game, p.expr + ' = ' + given, ok);
      next(actions, !ok && game.lives === 0);
    }
  }

  // ------------------------------------------------------------ Target
  function move(op, n, mask) { return op === 'NOT' ? 'NOT' : BINOPS[op] ? op + ' ' + mask : op + '-' + n; }
  function applyMove(mv, s) {
    var parts = mv.split(' ');
    if (parts.length === 2) return B.binop(parts[0], s, parts[1]);
    if (mv === 'NOT') return B.not(s);
    return B.evaluate(mv + ' ' + s);
  }
  function makeTarget(c) {
    for (var tries = 0; tries < 500; tries++) {
      var s = F.randBits(c.L), masks = [F.randBits(c.L)], cur = s, seen = [s], path = [], ok = true;
      if (c.moves >= 3) masks.push(F.randBits(c.L));
      for (var i = 0; i < c.moves && ok; i++) {
        var op = F.pick(c.ops), mv = move(op, op === 'NOT' || BINOPS[op] ? 0 : count(c, op), F.pick(masks));
        cur = applyMove(mv, cur);
        if (seen.indexOf(cur) >= 0 || /^0+$/.test(cur)) ok = false;
        seen.push(cur);
        path.push(mv);
      }
      if (ok) return { s: s, t: cur, masks: masks, path: path };
    }
    return null;
  }
  function targetRound() {
    var c = cfg(), p = makeTarget(c);
    if (!p) return predictRound();
    var plan = [], runsLeft = 2, n = 1, maxN = c.big ? c.L * 3 : c.max, running = false;
    var stage = el('div', { class: 'stage' });
    stage.appendChild(el('div', { class: 'round-head' }, '<span class="round-kind">Target</span><span class="small">Round ' + (roundNo + 1) + ': exactly ' + c.moves + ' move' + (c.moves > 1 ? 's' : '') + ', 2 runs</span>'));
    var cols = el('div', { class: 'lab-cols' });
    var left = el('div'), right = el('div');
    left.appendChild(F.bitRow(p.s, { label: 'start' }));
    left.appendChild(F.bitRow(p.t, { label: 'target', cls: 'result' }));
    var traceBox = el('div', { class: 'trace-box' });
    left.appendChild(traceBox);
    var palette = el('div', { class: 'palette', role: 'group', 'aria-label': 'Operators' });
    var countBox = el('span', { class: 'count' });
    var minus = el('button', { type: 'button', 'aria-label': 'Fewer places' }, '&minus;'), plus = el('button', { type: 'button', 'aria-label': 'More places' }, '+'), nShow = el('b', null, '1');
    countBox.appendChild(minus); countBox.appendChild(nShow); countBox.appendChild(plus);
    var opButtons = [];
    function addOp(label, make) {
      var b = el('button', { type: 'button', class: 'op' }, label);
      b.addEventListener('click', function () { if (!running && plan.length < c.moves) { plan.push(make()); drawPlan(); } });
      opButtons.push({ b: b, label: label });
      palette.appendChild(b);
      return b;
    }
    var hasMoves = c.ops.some(function (o) { return /SHIFT|CIRC/.test(o); });
    c.ops.forEach(function (op) {
      if (op === 'NOT') addOp('NOT', function () { return 'NOT'; });
      else if (BINOPS[op]) p.masks.forEach(function (m) { addOp(op + ' ' + m, function () { return op + ' ' + m; }); });
    });
    var shiftBtns = [];
    c.ops.forEach(function (op) {
      if (/SHIFT|CIRC/.test(op)) shiftBtns.push({ op: op, b: addOp(op + '-1', function () { return op + '-' + n; }) });
    });
    if (hasMoves) {
      var cl = el('span', { class: 'small' }, 'places:');
      palette.appendChild(cl);
      palette.appendChild(countBox);
    }
    function setN(v) { n = Math.max(1, Math.min(maxN, v)); nShow.textContent = n; shiftBtns.forEach(function (s) { s.b.textContent = s.op + '-' + n; }); }
    minus.addEventListener('click', function () { setN(n - 1); });
    plus.addEventListener('click', function () { setN(n + 1); });
    right.appendChild(el('p', { class: 'small' }, 'Click operators to fill the plan. Click a move in the plan to take it out.'));
    right.appendChild(palette);
    var planBox = el('div', { class: 'plan', 'aria-label': 'Your plan' });
    right.appendChild(planBox);
    var actions = el('div', { class: 'actions' });
    var runBtn = F.btn('Run', 'run', '', run);
    actions.appendChild(runBtn);
    right.appendChild(actions);
    cols.appendChild(left); cols.appendChild(right);
    stage.appendChild(cols);
    var say = F.feedback(stage);
    area.innerHTML = '';
    area.appendChild(stage);

    function drawPlan() {
      planBox.innerHTML = '';
      for (var i = 0; i < c.moves; i++) (function (i) {
        var b = el('button', { type: 'button', class: 'slot' + (plan[i] ? ' filled' : '') }, plan[i] ? (i + 1) + '. ' + F.esc(plan[i]) : (i + 1) + '. ?');
        b.disabled = running || !plan[i];
        b.addEventListener('click', function () { if (!running) { plan.splice(i, 1); drawPlan(); } });
        planBox.appendChild(b);
      })(i);
      runBtn.disabled = running || plan.length !== c.moves;
      if (!running) traceBox.innerHTML = '';
      F.reportHeight();
    }
    drawPlan();

    function run() {
      if (running || plan.length !== c.moves) return;
      running = true;
      drawPlan();
      opButtons.forEach(function (o) { o.b.disabled = true; });
      traceBox.innerHTML = '';
      var cur = p.s, i = 0;
      function step() {
        if (i < plan.length) {
          cur = applyMove(plan[i], cur);
          traceBox.appendChild(F.bitRow(cur, { label: plan[i].split(' ')[0] }));
          F.reportHeight();
          i++;
          setTimeout(step, 520);
          return;
        }
        finish(cur === p.t);
      }
      setTimeout(step, 250);
    }
    function finish(ok) {
      runsLeft--;
      var log = 'target ' + p.t + ' from ' + p.s + ' by ' + plan.join(', ');
      if (ok) {
        solved++;
        var gain = game.right(10 + 5 * c.moves);
        say('Target reached. +' + gain, 'good');
        report.add(game, log, true);
        next(actions, false);
        return;
      }
      var out = game.wrong();
      report.add(game, log, false);
      if (runsLeft > 0 && !out) {
        say('That is not the target. Change your plan, then run it again. 1 run left.', 'bad');
        running = false;
        opButtons.forEach(function (o) { o.b.disabled = false; });
        var keep = traceBox.innerHTML;
        drawPlan();
        traceBox.innerHTML = keep;
        return;
      }
      say('Not reached. One plan that works: <code>' + p.path.map(F.esc).join('</code>, then <code>') + '</code>.', 'bad');
      next(actions, out);
    }
  }

  // ------------------------------------------------------------ flow
  function next(actions, over) {
    var b = F.btn(over ? 'See score' : 'Next round', 'next', 'secondary', function () {
      if (over) return F.overPanel(area, game, 'You reached level ' + game.level + '.', function () { base = Math.max(1, game.level - 1); solved = 0; game.restart(base); render(); });
      roundNo++;
      render();
    });
    actions.appendChild(b);
    b.focus();
    F.reportHeight();
  }
  function render() {
    game.level = level();
    game.draw();
    if (roundNo % 2 === 0) predictRound(); else targetRound();
  }
  render();
})();
