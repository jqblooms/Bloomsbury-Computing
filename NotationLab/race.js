// Convert Race (?mode=race): 90 seconds of mixed questions: evaluate prefix and postfix, infix to prefix and
// postfix, and prefix or postfix back to infix. Typed answers, spaces optional. Three right in a row moves up a
// tier (longer expressions, the power arrow, hidden multiplication); two wrong in a row moves down. Points grow
// with the tier and the streak. The clock reads Date.now on a setTimeout tick, so a slow tick never adds time.
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc;
  var FOUR = ['+', '-', '*', '/'], ALL = FOUR.concat([NC.POW]);
  var SECONDS = 90, PASS = 6; // pass: PASS right in a row in one race (James 2026-10-27: mistakes never count)
  var TIERS = [
    { kinds: ['evpost', 'topost'], n: 2, ops: FOUR },
    { kinds: ['evpost', 'evpre', 'topre', 'topost'], n: [2, 3], ops: FOUR },
    { kinds: ['evpre', 'evpost', 'topre', 'topost', 'toin'], n: [3, 4], ops: FOUR },
    { kinds: ['evpre', 'evpost', 'topre', 'topost', 'toin'], n: [4, 6], ops: ALL, implied: true }
  ];
  var BEST_KEY = 'bc-notation-race-best-v1';

  NL.activities.race = function (host) {
    var log = NL.results('Convert Race');
    var st = null, timer = null;
    var head = el('div', { class: 'race-head' }), body = el('div'), fb = el('div', { class: 'feedback' });
    host.appendChild(head); host.appendChild(body); host.appendChild(fb);
    function best() { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; } }

    function intro() {
      head.innerHTML = '';
      body.innerHTML = '<h1 style="font-size:1.35rem">Convert Race</h1><p class="intro">' + SECONDS + ' seconds. Work out values and convert between prefix, infix and postfix. ' +
        'Three right in a row moves you up a level, and a streak scores more. To pass, get ' + PASS + ' right in a row: a wrong answer starts the run again. Spaces in answers are optional. Type ^ for ' + NC.POW + '.</p>' +
        (best() ? '<p class="small">Your best score on this computer: <b>' + best() + '</b></p>' : '');
      var go = el('button', { type: 'button', class: 'btn' }, NL.ICON.play + ' Start the race');
      go.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(go); body.appendChild(row);
      NL.reportHeight();
    }

    function start() {
      st = { end: Date.now() + SECONDS * 1000, score: 0, right: 0, tries: 0, streak: 0, tier: 0, upRun: 0, downRun: 0, topTier: 0, q: null, wait: false };
      NL.say(fb, '');
      tick();
      next();
    }
    function tick() {
      clearTimeout(timer);
      if (!st) return;
      var left = Math.max(0, st.end - Date.now());
      drawHead(left);
      if (left <= 0) { finish(); return; }
      timer = NL.later(250, tick);
    }
    function drawHead(left) {
      var s = Math.ceil(left / 1000);
      head.innerHTML = '<span class="clock' + (s <= 10 ? ' low' : '') + '">' + Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) + '</span>' +
        '<span class="pill">Level ' + (st.tier + 1) + '</span><span class="stat">Score <b>' + st.score + '</b> &nbsp; Streak <b>' + st.streak + '</b> &nbsp; Right <b>' + st.right + '</b></span>';
    }

    function makeQuestion() {
      var T = TIERS[st.tier], kind = NC.pick(T.kinds), n = NL.sizeOf(T.n);
      if (kind === 'evpost' || kind === 'evpre') {
        var t = NC.randomTree({ n: n, ops: T.ops, max: st.tier < 2 ? 60 : 120, noNeg: st.tier < 2 });
        var list = kind === 'evpre' ? NC.toPrefix(t) : NC.toPostfix(t);
        return { kind: 'num', ask: 'Work out the value of this ' + (kind === 'evpre' ? 'prefix' : 'postfix') + ' expression.', show: NC.show(list), value: NC.evaluate(t), answer: String(NC.evaluate(t)) };
      }
      var tl = NC.randomTree({ n: n, ops: T.ops, letters: true, digitChance: T.implied ? 0.35 : 0 });
      if (kind === 'toin') {
        var from = NC.pick(['prefix', 'postfix']);
        return { kind: 'infix', ask: 'Write this ' + from + ' expression in infix.', show: NC.show(from === 'prefix' ? NC.toPrefix(tl) : NC.toPostfix(tl)), tree: tl, answer: NC.toInfix(tl) };
      }
      var target = kind === 'topre' ? NC.toPrefix(tl) : NC.toPostfix(tl);
      return { kind: 'seq', ask: 'Write this infix expression in ' + (kind === 'topre' ? 'prefix' : 'postfix') + '.', show: NC.toInfix(tl, { implied: !!T.implied }), list: target, answer: NC.show(target) };
    }
    function mark(q, raw) {
      if (q.kind === 'num') { var v = Number(String(raw).trim().replace(/\u2212/g, '-')); return String(raw).trim() !== '' && v === q.value; }
      if (q.kind === 'seq') { var t = NC.tokens(raw); return !!t && t.join('') === q.list.join(''); }
      return NC.sameTree(NC.parseInfix(raw), q.tree);
    }

    function next() {
      st.q = makeQuestion(); st.wait = false;
      body.innerHTML = '';
      body.appendChild(el('p', { class: 'race-q' }, esc(st.q.ask)));
      body.appendChild(el('div', { class: 'race-expr' }, esc(st.q.show)));
      var row = el('div', { class: 'actions' });
      var input = el('input', { class: 'answer-in' + (st.q.kind === 'num' ? '' : ' wide'), autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your answer' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Check');
      var skip = el('button', { type: 'button', class: 'btn secondary' }, 'Skip');
      function check() {
        if (st.wait || !st) return;
        var raw = String(input.value);
        if (!raw.trim()) { NL.say(fb, 'Type an answer, or Skip.', 'hint'); return; }
        answer(mark(st.q, raw), raw);
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      go.addEventListener('click', check);
      skip.addEventListener('click', function () { if (!st.wait) answer(false, '', true); });
      row.appendChild(input); row.appendChild(go); row.appendChild(skip);
      body.appendChild(row);
      NL.focusSoon(input);
      NL.reportHeight();
    }
    function answer(ok, raw, skipped) {
      st.tries++;
      if (ok) {
        st.right++; st.streak++; st.bestRun = Math.max(st.bestRun || 0, st.streak); st.downRun = 0; st.upRun++;
        var pts = 10 * (st.tier + 1) + 2 * Math.min(st.streak, 10);
        st.score += pts;
        NL.say(fb, 'Right: +' + pts + '.', '');
        if (st.upRun >= 3 && st.tier < TIERS.length - 1) { st.tier++; st.upRun = 0; NL.say(fb, 'Right: +' + pts + '. Level up.', ''); }
        st.topTier = Math.max(st.topTier, st.tier);
        drawHead(Math.max(0, st.end - Date.now()));
        next();
        return;
      }
      st.streak = 0; st.upRun = 0; st.downRun++;
      if (st.downRun >= 2 && st.tier > 0) { st.tier--; st.downRun = 0; }
      st.wait = true;
      NL.say(fb, (skipped ? 'Skipped.' : 'Not that one.') + ' The answer: <b class="calc">' + esc(st.q.answer) + '</b>', 'bad');
      NL.later(2200, function () { if (st && Date.now() < st.end) { NL.say(fb, ''); next(); } });
    }

    function finish() {
      clearTimeout(timer);
      var s = st; st = null;
      var old = best();
      if (s.score > old) { try { localStorage.setItem(BEST_KEY, String(s.score)); } catch (e) {} }
      log.add('race: ' + s.right + ' right of ' + s.tries + ', score ' + s.score + ', best run ' + (s.bestRun || 0) + ' in a row, reached level ' + (s.topTier + 1), (s.bestRun || 0) >= PASS);
      if ((s.bestRun || 0) >= PASS) log.finish();
      head.innerHTML = '';
      NL.say(fb, '');
      body.innerHTML = '<h1 style="font-size:1.35rem">Time!</h1><div class="big-score">' + s.score + '</div>' +
        '<div class="summary-grid"><div><span class="small">Right</span><b>' + s.right + ' of ' + s.tries + '</b></div>' +
        '<div><span class="small">Highest level</span><b>' + (s.topTier + 1) + ' of ' + TIERS.length + '</b></div>' +
        '<div><span class="small">Best on this computer</span><b>' + Math.max(old, s.score) + '</b></div></div>' +
        (s.score > old && old ? '<p>New best score.</p>' : '') + ((s.bestRun || 0) >= PASS ? NL.doneBanner(PASS + ' or more right in a row: race passed.') : '<p class="small">Best run: ' + (s.bestRun || 0) + ' in a row. A wrong answer starts the run again. Get ' + PASS + ' right in a row in one race to pass.</p>');
      var again = el('button', { type: 'button', class: 'btn' }, NL.ICON.play + ' Race again');
      again.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(again); body.appendChild(row);
      NL.reportHeight();
    }

    intro();
  };
})();
