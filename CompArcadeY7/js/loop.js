// Loop Runner (?game=loop): a runner does one lap of the track for every turn of a FOR loop. The student predicts
// the OUTPUT (or how many laps) first and locks it in, then watches the run: each lap shows i and the new value.
// Level 1: c = c + k. Level 2: a total of i, or a loop that does not start at 1. Level 3: STEP. Level 4: doubling,
// or a total with STEP. Every program is ACSL pseudocode, run by shared/acsl-pseudocode.js (CompGenY7.loopQ).
CA.games.loop = function (host) {
  'use strict';
  var G = CompGenY7, el = CA.el, esc = CA.esc;
  var NEED = Math.max(1, Math.min(4, Number(CA.params.get('rounds')) || 2)), MAXH = 3;
  var LEVELS = [
    { name: 'Level 1: add each lap', lv: 1 },
    { name: 'Level 2: add i', lv: 2 },
    { name: 'Level 3: STEP', lv: 3 },
    { name: 'Level 4: contest style', lv: 4 }
  ];
  var res = CA.results('loop-runner', 'Loop Runner');
  var st = { li: 0, have: 0, hearts: MAXH, score: 0, streak: 0, mistakes: 0, q: null, timer: null, running: false, guess: null };

  host.innerHTML = '';
  host.appendChild(el('div', { class: 'game-head' }, '<h1>Loop Runner</h1><span class="muted">FOR loops</span>'));
  var bar = CA.topbar(host);
  var board = el('div', { class: 'loop-board' });
  host.appendChild(board);
  var left = el('div', { class: 'loop-left' }), right = el('div', { class: 'loop-right' });
  board.appendChild(left); board.appendChild(right);
  var codeBox = el('div', { class: 'code-box' });
  var ask = el('div', { class: 'loop-ask' });
  var fb = el('div', { class: 'feedback' });
  left.appendChild(codeBox); left.appendChild(ask); left.appendChild(fb);

  // The track: an oval with a start line. The runner's place on it is worked out with sin and cos, so nothing
  // needs to be measured (sizes are 0 while the lesson keeps the app hidden).
  var CX = 160, CY = 92, RX = 128, RY = 62;
  right.innerHTML = '<svg class="track" viewBox="0 0 320 190" role="img" aria-label="The running track">' +
    '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + (RX + 14) + '" ry="' + (RY + 14) + '" class="track-out"/>' +
    '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + (RX - 14) + '" ry="' + (RY - 14) + '" class="track-in"/>' +
    '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + RX + '" ry="' + RY + '" class="track-lane"/>' +
    '<line x1="' + CX + '" y1="' + (CY + RY - 16) + '" x2="' + CX + '" y2="' + (CY + RY + 16) + '" class="track-start"/>' +
    '<text x="' + CX + '" y="' + (CY + 6) + '" class="track-big" id="lap-text">Ready</text>' +
    '<text x="' + CX + '" y="' + (CY + 30) + '" class="track-small" id="var-text"></text>' +
    '<g id="runner"><circle r="11" class="runner-body"/><circle cx="3" cy="-3" r="2.2" class="runner-eye"/><path d="M-9 9 L-15 15 M9 9 L14 16" class="runner-legs"/></g>' +
    '</svg>';
  var runner = right.querySelector('#runner'), lapText = right.querySelector('#lap-text'), varText = right.querySelector('#var-text');
  var chips = el('div', { class: 'i-chips' });
  right.appendChild(chips);

  function level() { return LEVELS[st.li]; }
  function drawBar() { bar.set({ level: level().name, have: st.have, need: NEED, score: st.score, streak: st.streak, hearts: st.hearts }); }
  function place(t) {
    // t = 0 is the start line at the bottom of the oval; one lap is t from 0 to 1, running anticlockwise.
    var a = Math.PI / 2 - t * 2 * Math.PI;
    var x = CX + RX * Math.cos(a), y = CY + RY * Math.sin(a);
    runner.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
  }
  function drawCode(hl) {
    codeBox.innerHTML = st.q.lines.map(function (l, i) {
      return '<div class="code-line' + (hl === i ? ' hl' : '') + '"><span class="ln">' + (i + 1) + '</span>' + esc(l).replace(/^( +)/, function (m) { return '&nbsp;'.repeat(m.length * 2); }) + '</div>';
    }).join('');
  }
  function drawChips(upto) {
    chips.innerHTML = '<span class="small muted">i:</span>' + (upto < 0 ? '<span class="chip ghost">?</span>' :
      st.q.laps.slice(0, upto + 1).map(function (x, k) { return '<span class="chip' + (k === upto ? ' now' : '') + '">' + x.i + '</span>'; }).join(''));
  }

  function newRound() {
    clearTimeout(st.timer); st.running = false;
    st.q = G.loopQ(level().lv);
    st.guess = null;
    drawCode(-1);
    place(0);
    lapText.textContent = 'Ready';
    varText.textContent = st.q.v + ' = ?';
    drawChips(-1);
    ask.innerHTML = '';
    var isTurns = st.q.ask === 'turns';
    ask.appendChild(el('p', { class: 'ask' }, isTurns ? '<b>Predict:</b> how many laps will the runner do? (One lap is one time line 3 runs.)' : '<b>Predict:</b> what will the program OUTPUT?'));
    var row = el('div', { class: 'actions' });
    var box = CA.answerBox({ label: isTurns ? 'Laps' : 'Output', numeric: true }, lock);
    row.appendChild(box.wrap);
    var go = CA.btn('Lock in and run', '', lock, 'play');
    row.appendChild(go);
    ask.appendChild(row);
    CA.say(fb, '', '');
    drawBar();
    CA.reportHeight();
    function lock() {
      if (st.guess != null) return;
      var t = box.input.value.trim();
      if (!t) { CA.say(fb, 'Type your prediction first.', 'hint'); return; }
      st.guess = t; box.input.disabled = true; go.disabled = true;
      CA.say(fb, 'Locked in: <b>' + esc(t) + '</b>. Watch the runner.', 'hint');
      var skip = CA.btn('Skip to the end', 'secondary', function () { skip.disabled = true; finishRun(); }, 'next');
      row.appendChild(skip);
      run();
    }
  }

  // ---------------------------------------------------------------- the run, one lap per turn of the loop
  function run() {
    st.running = true;
    var laps = st.q.laps, lap = 0, frame = 0, FRAMES = 22;
    varText.textContent = st.q.v + ' = ' + st.q.start;
    drawCode(0);
    function tick() {
      if (!st.running) return;
      if (frame === 0) { drawCode(1); lapText.textContent = 'Lap ' + (lap + 1); drawChips(lap); }
      if (frame === Math.floor(FRAMES / 2)) drawCode(2);
      place(frame / FRAMES);
      frame++;
      if (frame > FRAMES) {
        varText.textContent = st.q.v + ' = ' + laps[lap].value;
        lap++; frame = 0;
        if (lap >= laps.length) { finishRun(); return; }
      }
      st.timer = setTimeout(tick, 45);
    }
    if (!laps.length) { finishRun(); return; }
    tick();
  }
  function finishRun() {
    if (!st.running && st.q.done) return;
    st.running = false; clearTimeout(st.timer); st.q.done = true;
    var q = st.q;
    place(0);
    drawCode(4);
    lapText.textContent = q.turns + ' lap' + (q.turns === 1 ? '' : 's');
    varText.textContent = 'OUTPUT ' + q.output;
    drawChips(q.laps.length - 1);
    var ok = q.re.test(st.guess);
    ask.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    var isTurns = q.ask === 'turns';
    var said = isTurns ? 'The runner did <b>' + q.turns + '</b> laps: i was ' + q.laps.map(function (x) { return x.i; }).join(', ') + '.'
      : 'The OUTPUT is <b>' + q.output + '</b>: ' + q.v + ' started at ' + q.start + ' and became ' + q.laps.map(function (x) { return x.value; }).join(', ') + '.';
    if (ok) { st.streak++; st.score += CA.points(st.streak); st.have++; CA.say(fb, 'Right! ' + said, ''); }
    else { st.hearts--; st.mistakes++; st.streak = 0; CA.say(fb, 'You said ' + esc(st.guess) + '. ' + said, 'bad'); }
    res.add(q.lines.join(' / ') + (isTurns ? ': laps ' : ': output ') + q.answer + ' (said ' + st.guess + ')', ok);
    drawBar();
    var row = el('div', { class: 'actions' });
    if (st.hearts <= 0) {
      CA.say(fb, fb.innerHTML + '<br>Out of hearts. Try this level again with new programs.', 'bad');
      row.appendChild(CA.btn('Try again', '', function () { st.hearts = MAXH; st.have = 0; newRound(); }, 'redo'));
    } else if (st.have >= NEED) {
      if (st.li === LEVELS.length - 1) row.appendChild(CA.btn('See your stars', '', finish, 'star'));
      else row.appendChild(CA.btn('Next level', '', function () { st.li++; st.have = 0; st.hearts = MAXH; newRound(); }, 'next'));
    } else row.appendChild(CA.btn('Next program', '', newRound, 'next'));
    ask.appendChild(row);
    CA.reportHeight();
  }
  function finish() {
    res.finish();
    board.style.display = 'none';
    var end = el('div', { class: 'end' });
    end.innerHTML = CA.endCard({ game: 'loop', score: st.score, stars: CA.starsFor(st.mistakes), title: 'Loop Runner cleared!',
      text: 'One lap for each value of i. Follow the value lap by lap.' });
    var row = el('div', { class: 'actions center' });
    row.appendChild(CA.btn('Play again', 'secondary', function () { end.remove(); board.style.display = ''; st.li = 0; st.have = 0; st.hearts = MAXH; st.score = 0; st.streak = 0; st.mistakes = 0; newRound(); }, 'redo'));
    end.appendChild(row);
    host.appendChild(end);
    CA.reportHeight();
  }

  newRound();
};
