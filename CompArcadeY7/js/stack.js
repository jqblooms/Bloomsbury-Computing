// Stack Stacker (?game=stack&form=postfix|prefix): work out postfix or prefix with a stack you can see.
// At each token the student chooses Push or Pop 2; a wrong choice costs a heart and the machine does the right
// thing. At an operator the two popped numbers sit on the bench in the right order and the student types the result
// (one try). Level 1 has one operator, Level 2 two, Level 3 three; the Boss level has no machine: type the answer.
CA.games.stack = function (host) {
  'use strict';
  var G = CompGenY7, NC = NotationCore, el = CA.el, esc = CA.esc;
  var form = CA.params.get('form') === 'prefix' ? 'prefix' : 'postfix';
  var NEED = Math.max(1, Math.min(4, Number(CA.params.get('rounds')) || 2)), MAXH = 3;
  var LEVELS = [
    { name: 'Level 1: one operator', lv: 1 },
    { name: 'Level 2: two operators', lv: 2 },
    { name: 'Level 3: three operators', lv: 3, need: Math.max(1, NEED - 1) },
    { name: 'Boss: no machine', lv: 3, boss: true, need: Math.max(1, NEED - 1) }
  ];
  var res = CA.results('stack-' + form, 'Stack Stacker (' + form + ')');
  var st = { li: 0, have: 0, hearts: MAXH, score: 0, streak: 0, mistakes: 0, q: null, order: [], pos: 0, stack: [], lostThisRound: false, busy: false };

  host.innerHTML = '';
  host.appendChild(el('div', { class: 'game-head' }, '<h1>Stack Stacker</h1><span class="muted">' + (form === 'postfix' ? 'Postfix' : 'Prefix') + '</span>'));
  var bar = CA.topbar(host);
  var board = el('div', { class: 'stack-board' });
  var left = el('div', { class: 'stack-left' }), right = el('div', { class: 'stack-right' });
  board.appendChild(left); board.appendChild(right);
  host.appendChild(board);
  var dir = el('p', { class: 'read-dir' }, form === 'postfix' ? 'Read from left to right &rarr;' : '&larr; Read from right to left');
  var strip = el('div', { class: 'strip' });
  var action = el('div', { class: 'action' });
  var fb = el('div', { class: 'feedback' });
  left.appendChild(dir); left.appendChild(strip); left.appendChild(action); left.appendChild(fb);
  right.appendChild(el('div', { class: 'well-title' }, 'Stack'));
  var well = el('div', { class: 'well' });
  right.appendChild(well);
  right.appendChild(el('div', { class: 'well-foot' }, 'top of the stack at the top'));

  function level() { return LEVELS[st.li]; }
  function drawBar() { bar.set({ level: level().name, have: st.have, need: level().need || NEED, score: st.score, streak: st.streak, hearts: st.hearts }); }
  function colour(v) { return 'c' + (Math.abs(Math.round(v)) % 6); }
  function drawStrip() {
    var cur = st.order[st.pos];
    strip.innerHTML = st.q.tokens.map(function (tk, i) {
      var done = st.order.indexOf(i) < st.pos && !level().boss;
      return '<span class="tok' + (NC.isOp(tk) ? ' op' : '') + (done ? ' done' : '') + (i === cur && !level().boss ? ' now' : '') + '">' + esc(tk) + '</span>';
    }).join('');
  }
  function drawWell(fresh) {
    well.innerHTML = '';
    if (level().boss) { well.appendChild(el('div', { class: 'well-hidden' }, 'No machine this time. Use the stack in your head or on paper.')); return; }
    st.stack.forEach(function (v, i) {
      var top = i === st.stack.length - 1;
      well.appendChild(el('div', { class: 'block ' + colour(v) + (top ? ' top' : '') + (top && fresh ? ' enter' : '') }, esc(v)));
    });
  }
  function draw(fresh) { drawBar(); drawStrip(); drawWell(fresh); CA.reportHeight(); }

  function newRound() {
    st.q = G.evalQ(form, level().lv);
    st.order = st.q.tokens.map(function (_, i) { return i; });
    if (form === 'prefix') st.order.reverse();
    st.pos = 0; st.stack = []; st.lostThisRound = false; st.busy = false;
    CA.say(fb, '', '');
    if (level().boss) askBoss(); else askChoice();
    draw(false);
  }

  function loseHeart() {
    st.hearts--; st.mistakes++; st.streak = 0; st.lostThisRound = true;
    drawBar();
    return st.hearts <= 0;
  }
  function outOfHearts() {
    action.innerHTML = '';
    CA.say(fb, 'Out of hearts. Try ' + esc(level().name.split(':')[0]) + ' again with new expressions.', 'bad');
    action.appendChild(CA.btn('Try again', '', function () { st.hearts = MAXH; st.have = 0; newRound(); }, 'redo'));
    res.add(st.q.text + ' (out of hearts)', false);
  }

  // ---------------------------------------------------------------- one token at a time
  function askChoice() {
    action.innerHTML = '';
    var tk = st.q.tokens[st.order[st.pos]];
    action.appendChild(el('p', { class: 'ask' }, 'Next token: <b class="mono">' + esc(tk) + '</b>. What does the machine do?'));
    var row = el('div', { class: 'actions' });
    row.appendChild(CA.btn('Push it', 'choice-btn', function () { choose('push'); }));
    row.appendChild(CA.btn('Pop 2 and work it out', 'choice-btn', function () { choose('pop'); }));
    action.appendChild(row);
  }
  function choose(what) {
    if (st.busy) return;
    var tk = st.q.tokens[st.order[st.pos]], want = NC.isOp(tk) ? 'pop' : 'push';
    if (what !== want) {
      CA.shake(action);
      var over = loseHeart();
      CA.say(fb, want === 'push' ? esc(tk) + ' is a number. Numbers are pushed onto the stack.' : esc(tk) + ' is an operator. Pop two numbers and work them out.', 'bad');
      if (over) { outOfHearts(); return; }
      st.busy = true;
      CA.later(900, function () { st.busy = false; if (want === 'push') doPush(); else doPop(); });
      return;
    }
    CA.say(fb, '', '');
    if (want === 'push') doPush(); else doPop();
  }
  function doPush() {
    st.stack.push(Number(st.q.tokens[st.order[st.pos]]));
    st.pos++;
    draw(true);
    afterToken();
  }
  function doPop() {
    var tk = st.q.tokens[st.order[st.pos]];
    var first = st.stack.pop(), second = st.stack.pop();
    var l = form === 'prefix' ? first : second, r = form === 'prefix' ? second : first;
    var v = NC.apply(tk, l, r);
    drawWell(false);
    action.innerHTML = '';
    var bench = el('div', { class: 'bench' });
    bench.innerHTML = '<span class="popped ' + colour(l) + '"><b>' + esc(l) + '</b><span>popped ' + (form === 'prefix' ? '1st' : '2nd') + '</span></span>' +
      '<span class="bench-op mono">' + esc(tk) + '</span>' +
      '<span class="popped ' + colour(r) + '"><b>' + esc(r) + '</b><span>popped ' + (form === 'prefix' ? '2nd' : '1st') + '</span></span><span class="bench-op mono">=</span>';
    var box = CA.answerBox({ label: 'Work it out', numeric: true }, submit);
    bench.appendChild(box.wrap);
    var go = CA.btn('Check', '', submit, 'check');
    bench.appendChild(go);
    action.appendChild(bench);
    action.appendChild(el('p', { class: 'small muted' }, form === 'postfix' ? 'The first number popped goes on the right.' : 'The first number popped goes on the left.'));
    CA.focusIn(box.input);
    CA.reportHeight();
    var done = false;
    function submit() {
      if (done) return;
      var typed = box.input.value.trim();
      if (!typed) { CA.say(fb, 'Type a number first.', 'hint'); return; }
      done = true;
      box.input.disabled = true; go.disabled = true;
      var ok = G.numRe(v).test(typed), sum = l + ' ' + tk + ' ' + r + ' = ' + v;
      if (ok) { st.streak++; st.score += CA.points(st.streak); CA.say(fb, 'Right: ' + esc(sum) + '. Push it.', ''); }
      else {
        var over = loseHeart();
        CA.say(fb, 'Not quite: ' + esc(sum) + '. The machine pushes ' + esc(v) + '.', 'bad');
        if (over) { outOfHearts(); return; }
      }
      st.busy = true;
      CA.later(ok ? 650 : 1300, function () { st.busy = false; st.stack.push(v); st.pos++; draw(true); afterToken(); });
    }
  }
  function afterToken() {
    if (st.pos < st.order.length) { askChoice(); return; }
    endRound(!st.lostThisRound, 'The answer is the last number left on the stack: <b>' + esc(st.q.value) + '</b>.');
  }

  // ---------------------------------------------------------------- the Boss level: no machine
  function askBoss() {
    action.innerHTML = '';
    action.appendChild(el('p', { class: 'ask' }, 'Work it out with no machine. One try.'));
    var row = el('div', { class: 'actions' });
    var box = CA.answerBox({ label: 'The answer', numeric: true }, submit);
    row.appendChild(box.wrap);
    var go = CA.btn('Check', '', submit, 'check');
    row.appendChild(go);
    action.appendChild(row);
    var done = false;
    function submit() {
      if (done) return;
      if (!box.input.value.trim()) { CA.say(fb, 'Type a number first.', 'hint'); return; }
      done = true; box.input.disabled = true; go.disabled = true;
      if (st.q.re.test(box.input.value)) { st.streak++; st.score += CA.points(st.streak) + 5; endRound(true, 'Right: the answer is <b>' + esc(st.q.value) + '</b>.'); }
      else {
        var over = loseHeart();
        CA.say(fb, 'Not this time. The answer is <b>' + esc(st.q.value) + '</b>.', 'bad');
        action.appendChild(el('div', { class: 'worked' }, st.q.steps.map(function (s) { return '<div>' + esc(s) + '</div>'; }).join('')));
        if (over) { outOfHearts(); return; }
        endRound(false, null, true);
      }
    }
  }

  function endRound(won, text, keep) {
    if (!keep) action.innerHTML = '';
    if (won) st.have++;
    res.add(st.q.text + ' = ' + st.q.value, won);
    drawBar();
    if (text) CA.say(fb, text + (won ? '' : ' A heart was lost, so this one does not count. Try another.'), won ? '' : 'hint');
    var row = el('div', { class: 'actions' });
    if (st.have >= (level().need || NEED)) {
      if (st.li === LEVELS.length - 1) { row.appendChild(CA.btn('See your stars', '', finish, 'star')); }
      else row.appendChild(CA.btn('Next level', '', function () { st.li++; st.have = 0; st.hearts = MAXH; newRound(); }, 'next'));
    } else row.appendChild(CA.btn('Next expression', '', newRound, 'next'));
    action.appendChild(row);
    CA.reportHeight();
  }
  function finish() {
    res.finish();
    board.style.display = 'none';
    var end = el('div', { class: 'end' });
    end.innerHTML = CA.endCard({ game: 'stack-' + form, score: st.score, stars: CA.starsFor(st.mistakes), title: 'Stack Stacker cleared!',
      text: 'You worked out ' + (form === 'postfix' ? 'postfix' : 'prefix') + ' with a stack, then with no machine at all.' });
    var row = el('div', { class: 'actions center' });
    row.appendChild(CA.btn('Play again', 'secondary', function () { end.remove(); board.style.display = ''; st.li = 0; st.have = 0; st.hearts = MAXH; st.score = 0; st.streak = 0; st.mistakes = 0; newRound(); }, 'redo'));
    end.appendChild(row);
    host.appendChild(end);
    drawBar();
    CA.reportHeight();
  }

  newRound();
};
