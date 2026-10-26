// Expression Tower (?mode=tower): prefix, infix and postfix. Every right answer adds a floor; a wrong answer or the
// clock running out knocks the top floor off. The floor you are on sets the level, so the questions get harder as
// the tower grows. 3 right in a row doubles the points, 5 in a row triples them. 15 bricks, 10 floors to the top.
// One try per question, typed; the answer and how it works only show after the try.
(function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var TOP = 10, BRICKS = 15, PASS = 7;
  function levelOf(floor) { return floor < 2 ? 1 : floor < 5 ? 2 : floor < 8 ? 3 : 4; }
  var KINDS = { 1: ['post-eval', 'to-post'], 2: ['post-eval', 'pre-eval', 'to-post', 'to-pre'], 3: ['pre-eval', 'post-eval', 'to-pre', 'to-post'], 4: ['pre-eval', 'post-eval', 'to-pre', 'to-post'] };
  var SHORT = { 'post-eval': 'POST =', 'pre-eval': 'PRE =', 'to-post': 'to POST', 'to-pre': 'to PRE' };
  function seconds(level) { return level <= 2 ? 45 : 60; }

  CA.modes.tower = function (host) {
    var log = CA.results('Expression Tower');
    var st = null, clock = null;
    var bar = el('div', { class: 'gbar' }), wrap = el('div', { class: 'tower-wrap' });
    var left = el('div'), tower = el('div', { class: 'tower', 'aria-label': 'Your tower' }), bricks = el('div', { class: 'bricks' });
    var right = el('div');
    left.appendChild(tower); left.appendChild(bricks);
    wrap.appendChild(left); wrap.appendChild(right);
    host.appendChild(bar); host.appendChild(wrap);

    function drawTower(newFloor) {
      var h = '';
      for (var f = 0; f < TOP; f++) {
        var b = st && st.floors[f];
        h += '<div class="floor' + (b ? ' built l' + b.level + (newFloor === f ? ' new' : '') : '') + (f === TOP - 1 && !b ? ' top' : '') + '">' +
          '<span>' + (b ? esc(SHORT[b.kind]) : f === TOP - 1 ? 'TOP' : '') + '</span><span>' + (f + 1) + '</span></div>';
      }
      tower.innerHTML = h;
      bricks.innerHTML = st ? 'Bricks left: <b>' + (BRICKS - st.used) + '</b>' : 'Floors: ' + TOP;
    }
    function drawBar() {
      if (!st) { bar.innerHTML = '<span class="pill">' + CA.ICON.tower + ' Expression Tower</span>'; return; }
      var mult = st.streak >= 5 ? 3 : st.streak >= 3 ? 2 : 1;
      bar.innerHTML = '<span class="pill">Floor ' + st.floors.length + ' of ' + TOP + '</span><span class="pill">Level ' + levelOf(st.floors.length) + '</span>' +
        '<span class="spacer"></span>' + CA.chip('Score', st.score) + CA.chip('Streak', st.streak, mult > 1 ? 'hot' : '') + (mult > 1 ? CA.chip('Combo', 'x' + mult, 'hot') : '');
    }

    function intro() {
      st = null; drawBar(); drawTower();
      right.innerHTML = '<h2>Build the tallest tower</h2><p>Work out prefix and postfix values, and turn infix into prefix or postfix.</p>' +
        '<ul class="rules"><li>Right: a new floor. Wrong or out of time: the top floor falls off.</li>' +
        '<li>Higher floors, harder questions. 3 right in a row: points x2. 5 in a row: x3.</li>' +
        '<li>' + BRICKS + ' bricks to reach floor ' + TOP + '. Spaces are optional. Type ^ for ' + NotationCore.POW + '.</li></ul>' +
        (CA.best('tower') ? '<p class="small">Best score on this computer: <b>' + CA.best('tower') + '</b></p>' : '');
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.play + ' Start building');
      go.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(go); right.appendChild(row);
      CA.reportHeight();
    }
    function start() {
      st = { floors: [], used: 0, score: 0, streak: 0, right: 0, maxFloor: 0, seen: [] };
      next();
    }

    function next() {
      if (st.floors.length >= TOP || st.used >= BRICKS) { finish(); return; }
      var level = levelOf(st.floors.length), kind = Y8Gen.pick(KINDS[level]);
      var q = Y8Gen.question(kind, level, st.seen);
      st.seen.push(q.show);
      st.q = q; st.busy = false;
      drawBar(); drawTower();
      right.innerHTML = '';
      right.appendChild(el('div', {}, '<span class="tag">' + esc(CA.TOPIC[kind]) + '</span><span class="tag">Brick ' + (st.used + 1) + ' of ' + BRICKS + '</span>'));
      right.appendChild(el('p', { class: 'ask' }, esc(q.ask)));
      right.appendChild(el('div', {}, CA.showQ(q)));
      var tb = el('div', { class: 'timebar' });
      right.appendChild(tb);
      var row = el('div', { class: 'actions' });
      var input = el('input', { class: 'answer-in', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your answer', placeholder: q.format });
      var go = el('button', { type: 'button', class: 'btn' }, 'Place brick');
      row.appendChild(input); row.appendChild(go);
      right.appendChild(row);
      var fb = el('div', { class: 'feedback' }), why = el('div');
      right.appendChild(fb); right.appendChild(why);
      var total = seconds(level) * 1000;
      clock = CA.countdown(total, function (msLeft) { CA.timebar(tb, msLeft, total); }, function () { answer(false, '', true); });
      function check() {
        if (st.busy) return;
        if (!input.value.trim()) { CA.say(fb, 'Type your answer first.', 'hint'); return; }
        answer(q.check(input.value), input.value);
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      CA.focusSoon(input);

      function answer(ok, raw, timeout) {
        if (st.busy) return;
        st.busy = true;
        clock.stop();
        input.disabled = true; go.disabled = true;
        st.used++;
        log.add(CA.TOPIC[kind] + ' ' + q.show + (timeout ? ': out of time' : ': typed ' + raw.trim()), ok);
        if (ok) {
          st.streak++; st.right++;
          var mult = st.streak >= 5 ? 3 : st.streak >= 3 ? 2 : 1, pts = 10 * level * mult;
          st.score += pts;
          st.floors.push({ kind: kind, level: level });
          st.maxFloor = Math.max(st.maxFloor, st.floors.length);
          if (st.maxFloor >= PASS) log.finish();
          drawBar(); drawTower(st.floors.length - 1);
          CA.say(fb, 'Right. <span class="pop">+' + pts + '</span>' + (mult > 1 ? ' Combo x' + mult + '.' : ''), '');
          CA.later(900, next);
          return;
        }
        st.streak = 0;
        row.style.display = 'none'; tb.style.display = 'none';
        var fell = st.floors.pop();
        drawBar(); drawTower();
        tower.classList.remove('wobble'); void tower.offsetWidth; tower.classList.add('wobble');
        CA.say(fb, (timeout ? 'Out of time.' : 'Not that one: you typed <b>' + esc(raw.trim()) + '</b>.') + (fell ? ' The top floor fell off.' : '') + ' The answer: <b>' + esc(q.answer) + '</b>', 'bad');
        why.innerHTML = CA.whyBox(q);
        var nx = el('button', { type: 'button', class: 'btn' }, CA.ICON.next + (st.used >= BRICKS ? ' See your tower' : ' Next brick'));
        nx.addEventListener('click', next);
        var r2 = el('div', { class: 'actions' }); r2.appendChild(nx); why.appendChild(r2);
        CA.focusSoon(nx);
        CA.reportHeight();
      }
    }

    function finish() {
      if (clock) clock.stop();
      var s = st, old = CA.best('tower', s.score), won = s.floors.length >= TOP;
      log.note('Score ' + s.score + ', highest floor ' + s.maxFloor + ' of ' + TOP + '.');
      drawBar(); drawTower();
      right.innerHTML = '<h2>' + (won ? 'You reached the top!' : 'Out of bricks') + '</h2><div class="big-score">' + s.score + '</div>' +
        '<div class="summary-grid"><div><span class="small">Right</span><b>' + s.right + ' of ' + s.used + '</b></div>' +
        '<div><span class="small">Highest floor</span><b>' + s.maxFloor + ' of ' + TOP + '</b></div>' +
        '<div><span class="small">Best on this computer</span><b>' + Math.max(old, s.score) + '</b></div></div>' +
        (s.maxFloor >= PASS ? CA.doneBanner('Floor ' + PASS + ' or higher: tower passed.') : '<p class="small">Reach floor ' + PASS + ' to pass. New expressions every game.</p>');
      var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.play + ' Build again');
      again.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(again); right.appendChild(row);
      st.floors = s.floors;
      CA.reportHeight();
    }

    intro();
  };
})();
