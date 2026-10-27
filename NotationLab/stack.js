// Stack Machine (?mode=stack): evaluate postfix and prefix with a stack, one token at a time. The student chooses
// each action (push the number, or pop two), picks which way round the popped values go, and works out the value
// before the machine pushes it. Mistakes cost hearts; with no hearts left the machine finishes the expression and
// shows how. Levels rise from short postfix to long prefix with the power arrow, then "No machine": the final value
// only, as in the contest. ?form=postfix or ?form=prefix keeps to one form; ?level=n starts at level n; ?pow=0
// leaves the power arrow out.
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc;
  var ALL = ['+', '-', '*', '/', NC.POW];
  var LEVELS = [
    { name: 'Postfix', form: 'postfix', n: [1, 2], ops: ['+', '-', '*'], max: 60, noNeg: true },
    { name: 'Longer postfix', form: 'postfix', n: [2, 3], ops: ['+', '-', '*', '/'], max: 80, noNeg: true },
    { name: 'Prefix', form: 'prefix', n: [1, 2], ops: ['+', '-', '*', '/'], max: 80, noNeg: true },
    { name: 'Longer prefix', form: 'prefix', n: [3, 4], ops: ['+', '-', '*', '/'], max: 99 },
    { name: 'Power arrow', form: 'mixed', n: [3, 5], ops: ALL, mustUse: [NC.POW], max: 150 },
    { name: 'No machine', form: 'mixed', n: [4, 6], ops: ALL, max: 150, blind: true }
  ];
  var NEED = 2, HEARTS = 3;

  NL.activities.stack = function (host) {
    var only = NL.params.get('form');
    var levels = LEVELS.map(function (L) { return only === 'postfix' || only === 'prefix' ? Object.assign({}, L, { form: only }) : L; });
    if (only === 'postfix') levels = levels.filter(function (L, i) { return i !== 2 && i !== 3; });
    // ?pow=0: no power arrow (a lesson slide before the arrow is taught).
    if (NL.params.get('pow') === '0') levels = levels.filter(function (L) { return !L.mustUse; }).map(function (L) {
      return Object.assign({}, L, { ops: L.ops.filter(function (op) { return op !== NC.POW; }) });
    });
    var lv = Math.max(0, Math.min(levels.length - 1, (parseInt(NL.params.get('level'), 10) || 1) - 1));
    var have = 0, score = 0, streak = 0, best = 0, solvedTop = 0;
    var log = NL.results('Stack Machine');
    var S = null;   // the expression being worked: { list, form, steps, pos, hearts, mistakes, stack, phase, popped }

    var bar = NL.topbar(host);
    var rule = el('div', { class: 'rule-box' });
    var sup = NL.support('stack', rule);
    sup.toggle(bar.slot);
    var q = el('p', { class: 'task-q' });
    var grid = el('div', { class: 'machine' });
    var left = el('div'), right = el('div', { class: 'stack-col' });
    grid.appendChild(left); grid.appendChild(right);
    host.appendChild(q); host.appendChild(rule); host.appendChild(grid);
    var stripBox = el('div'), dir = el('div', { class: 'read-dir' }), tray = el('div', { class: 'tray' }), act = el('div', { class: 'actions' });
    var fb = el('div', { class: 'feedback' }), logBox = el('div', { class: 'log' });
    [dir, stripBox, tray, act, fb, logBox].forEach(function (n) { left.appendChild(n); });
    right.innerHTML = '<div class="stack-title">Stack</div>';
    var well = el('div', { class: 'stack-well' });
    right.appendChild(well);
    right.appendChild(el('div', { class: 'stack-label' }, 'The top is the last value pushed.'));

    function L() { return levels[lv]; }
    function sym(op) { return op; }
    function calcText(a, op, b) { return a + ' ' + sym(op) + ' ' + b; }

    function newExpr() {
      var lev = L();
      var form = lev.form === 'mixed' ? NC.pick(['prefix', 'postfix']) : lev.form;
      var tree = NC.randomTree({ n: NL.sizeOf(lev.n), ops: lev.ops, max: lev.max, noNeg: lev.noNeg, mustUse: lev.mustUse });
      var list = form === 'prefix' ? NC.toPrefix(tree) : NC.toPostfix(tree);
      S = { list: list, form: form, steps: NC.stackSteps(list, form), pos: 0, hearts: lev.blind ? 2 : HEARTS, mistakes: 0, stack: [], phase: lev.blind ? 'blind' : 'token', popped: null, value: NC.evaluate(tree), lines: [] };
      sup.set(form === 'postfix' ? [
        '<b>Postfix:</b> read from left to right. A number: push it. An operator: pop two values. The <b>first</b> value popped goes on the <b>right</b>: <code>9 4 -</code> works out 9 - 4.',
        '<b>Postfix:</b> left to right. The first value popped goes on the right.',
        'First pop: right side.'
      ] : [
        '<b>Prefix:</b> read from right to left. A number: push it. An operator: pop two values. The <b>first</b> value popped goes on the <b>left</b>: <code>- 9 4</code> works out 9 - 4.',
        '<b>Prefix:</b> right to left. The first value popped goes on the left.',
        'First pop: left side.'
      ]);
      draw();
    }

    function draw(note) {
      var lev = L();
      bar.set({ level: 'Level ' + (lv + 1) + ': ' + lev.name, have: have, need: lv < levels.length - 1 || !log.isDone() ? NEED : 0, score: score, streak: streak, hearts: S.hearts, maxHearts: lev.blind ? 2 : HEARTS });
      var formName = S.form === 'prefix' ? 'prefix' : 'postfix';
      q.innerHTML = lev.blind ? 'No machine: work out the value of this ' + formName + ' expression. Then the machine checks it.' :
        'Work out this ' + formName + ' expression with the stack. Choose each step.';
      dir.textContent = lev.blind ? '' : (S.form === 'prefix' ? 'Read from right to left' : 'Read from left to right');
      var cur = S.steps[S.pos];
      stripBox.innerHTML = '<div class="strip">' + S.list.map(function (tk, i) {
        var done = S.steps.slice(0, S.pos).some(function (s) { return s.i === i; });
        return NL.tile(tk, (done ? 'done' : '') + (!lev.blind && cur && cur.i === i && S.phase !== 'over' ? ' now' : ''));
      }).join('') + '</div>';
      drawStack();
      tray.innerHTML = '';
      act.innerHTML = '';
      if (S.phase === 'token') tokenActions(cur);
      else if (S.phase === 'order') orderActions(cur);
      else if (S.phase === 'value') valueActions(cur);
      else if (S.phase === 'blind') blindActions();
      else if (S.phase === 'end' || S.phase === 'over') endActions();
      logBox.innerHTML = S.lines.slice(-4).map(function (l) { return '<div>' + l + '</div>'; }).join('');
      if (note) NL.say(fb, note[0], note[1]);
      NL.reportHeight();
    }
    function drawStack(enterTop) {
      var st = S.stack;
      well.innerHTML = st.map(function (v, i) {
        return '<div class="stack-item' + (i === st.length - 1 ? ' top' : '') + (enterTop && i === st.length - 1 ? ' enter' : '') + '">' + v + '</div>';
      }).reverse().join('');
    }

    function lose(msg) {
      S.hearts--; S.mistakes++; streak = 0;
      sup.wrong();
      if (S.hearts <= 0) { autoFinish(msg); return true; }
      return false;
    }
    function gain(points) { score += points; streak++; best = Math.max(best, streak); sup.right(); }

    // A token: push the number, or pop two.
    function tokenActions(cur) {
      var isNum = cur.kind === 'push';
      var push = el('button', { type: 'button', class: 'choice' }, 'Push ' + esc(cur.token));
      var pop = el('button', { type: 'button', class: 'choice' }, 'Pop two');
      push.addEventListener('click', function () {
        if (!isNum) { if (!lose('An operator is never pushed.')) draw(['An operator is never pushed. It pops two values and works them out.', 'bad']); return; }
        S.stack.push(cur.value); S.pos++; gain(2);
        S.lines.push('Push ' + cur.value);
        advance(true);
      });
      pop.addEventListener('click', function () {
        if (isNum) { if (!lose('Numbers are pushed.')) draw(['A number goes on the stack. Only an operator pops.', 'bad']); return; }
        S.popped = [S.stack.pop(), S.stack.pop()];
        S.phase = cur.first === cur.second ? 'value' : 'order';
        draw(['', '']);
      });
      act.appendChild(push); act.appendChild(pop);
    }
    function trayHtml(cur) {
      return '<span class="popped"><b>' + S.popped[0] + '</b><span>1st pop</span></span><span class="popped"><b>' + S.popped[1] + '</b><span>2nd pop</span></span>' +
        '<span class="small">Operator: <b class="calc">' + esc(cur.token) + '</b></span>';
    }
    // Which way round? Both orders are offered.
    function orderActions(cur) {
      tray.innerHTML = trayHtml(cur);
      act.appendChild(el('span', { class: 'small' }, 'Which does the machine work out?'));
      var right = calcText(cur.left, cur.token, cur.right), wrong = calcText(cur.right, cur.token, cur.left);
      var opts = Math.random() < 0.5 ? [right, wrong] : [wrong, right];
      opts.forEach(function (text) {
        var b = el('button', { type: 'button', class: 'choice' }, esc(text));
        b.addEventListener('click', function () {
          if (text === right) { gain(5); S.phase = 'value'; draw(['', '']); return; }
          var why = S.form === 'prefix' ? 'Prefix is read from the right, so the value written first is popped first. It goes on the left.' :
            'Postfix is read from the left, so the value written first is pushed first and popped second. It goes on the left.';
          if (!lose(why)) draw([why, 'bad']);
        });
        act.appendChild(b);
      });
    }
    function valueActions(cur) {
      tray.innerHTML = trayHtml(cur);
      var label = el('span', { class: 'calc' }, esc(calcText(cur.left, cur.token, cur.right)) + ' =');
      var input = el('input', { class: 'answer-in', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Value' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Push the answer');
      function check() {
        var v = Number(String(input.value).trim().replace(/\u2212/g, '-'));
        if (String(input.value).trim() === '' || isNaN(v)) { NL.say(fb, 'Type a number.', 'hint'); return; }
        if (v === cur.value) {
          S.stack.push(cur.value); S.pos++; S.popped = null; gain(10);
          S.lines.push(calcText(cur.left, cur.token, cur.right) + ' = ' + cur.value + ', push it');
          advance(true);
          return;
        }
        var how = cur.token === NC.POW ? cur.left + ' ' + NC.POW + ' ' + cur.right + ' means ' + cur.right + ' copies of ' + cur.left + ' multiplied together.' :
          'Not quite. Work out ' + esc(calcText(cur.left, cur.token, cur.right)) + ' again.';
        if (!lose(how)) { draw([how, 'bad']); }
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      act.appendChild(label); act.appendChild(input); act.appendChild(go);
      NL.focusSoon(input);
    }
    function advance(pushed) {
      if (S.pos >= S.steps.length) { S.phase = 'end'; finishExpr(); return; }
      S.phase = 'token';
      draw(['', '']);
      if (pushed) drawStack(true);
    }

    // No machine: type the value, then the machine replays every step.
    function blindActions() {
      var input = el('input', { class: 'answer-in', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Value' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Check');
      function check() {
        var raw = String(input.value).trim().replace(/\u2212/g, '-'), v = Number(raw);
        if (raw === '' || isNaN(v)) { NL.say(fb, 'Type a number.', 'hint'); return; }
        if (v === S.value) { gain(25); S.phase = 'end'; replay(function () { finishExpr(); }); return; }
        S.hearts--; S.mistakes++; streak = 0;
        if (S.hearts > 0) { draw(['Not that one. Check each operator: which value goes on the left?', 'bad']); return; }
        S.phase = 'over';
        replay(function () { finishExpr(); }, 'You typed ' + esc(raw) + '. Watch the machine work it out.');
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      act.appendChild(el('span', { class: 'calc' }, 'Value =')); act.appendChild(input); act.appendChild(go);
    }
    // Shows the machine doing every step that is left, one every 0.9 s (setTimeout: it keeps going while hidden).
    function replay(then, msg) {
      if (S.phase !== 'over') S.phase = S.phase === 'end' ? 'end' : 'over';
      var from = S.pos;
      act.innerHTML = '';
      if (from === 0) S.stack = [];
      NL.say(fb, msg || 'Right. Watch the machine check it.', msg ? 'bad' : '');
      (function step(k) {
        if (k >= S.steps.length) { S.pos = S.steps.length; then(); return; }
        var s = S.steps[k];
        S.pos = k + 1;
        S.stack = s.stack.slice();
        S.lines.push(s.kind === 'push' ? 'Push ' + s.value : calcText(s.left, s.token, s.right) + ' = ' + s.value + ', push it');
        var keepPhase = S.phase; S.phase = 'replay';
        draw();
        S.phase = keepPhase;
        drawStack(true);
        NL.later(900, function () { step(k + 1); });
      })(from);
    }
    function autoFinish(msg) {
      S.phase = 'over';
      if (S.popped) { S.stack.push(S.popped[1]); S.stack.push(S.popped[0]); S.popped = null; }
      replay(function () { finishExpr(); }, esc(msg) + ' No hearts left: watch the machine finish it.');
    }

    function finishExpr() {
      var lev = L(), shown = S.list.join(' ');
      var solved = S.phase !== 'over';
      if (solved && S.mistakes === 0) score += 20;
      log.add((S.form === 'prefix' ? 'prefix ' : 'postfix ') + shown + ' = ' + S.value + (solved ? (S.mistakes ? ', ' + S.mistakes + ' mistake' + (S.mistakes > 1 ? 's' : '') : ', no mistakes') : ', out of hearts'), solved);
      var levelled = false;
      // James 2026-10-27: an expression with any mistake never counts and starts the run again.
      if (!solved || S.mistakes) have = 0;
      if (solved && !S.mistakes) {
        have += 1;
        solvedTop += lv === levels.length - 1 ? 1 : 0;
        if (have >= NEED && lv < levels.length - 1) { lv++; have = 0; levelled = true; }
        if (lv === levels.length - 1 && have >= NEED) { log.finish(); have = 0; }
      }
      S.phase = solved ? 'end' : 'over';
      var msg = solved ? 'The stack holds one value: <b>' + S.value + '</b>.' + (S.mistakes === 0 ? ' No mistakes: +20. ' + (levelled ? '' : have + ' of ' + NEED + ' in a row.') : ' It had ' + (S.mistakes === 1 ? 'a mistake' : S.mistakes + ' mistakes') + ', so it does not count. Your run is back to 0: you need ' + NEED + ' in a row with no mistakes.') : 'The value is <b>' + S.value + '</b>. This one does not count. Your run is back to 0: you need ' + NEED + ' in a row with no mistakes.';
      if (levelled) msg += ' Level up: ' + esc(levels[lv].name) + '.';
      if (log.isDone() && lv === levels.length - 1) msg = NL.doneBanner('You can work without the machine. Keep going for a higher score.') + msg;
      draw([msg, solved ? '' : 'hint']);
    }
    function endActions() {
      var b = el('button', { type: 'button', class: 'btn' }, 'Next expression ' + NL.ICON.next);
      b.addEventListener('click', function () { NL.say(fb, ''); newExpr(); });
      act.appendChild(b);
    }

    newExpr();
  };
})();
