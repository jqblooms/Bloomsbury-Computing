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
      st = { end: Date.now() + SECONDS * 1000, score: 0, right: 0, tries: 0, streak: 0, tier: 0, upRun: 0, downRun: 0, topTier: 0, q: null, wait: false, pausedAt: 0, walks: 0 };
      NL.say(fb, '');
      tick();
      next();
    }
    function tick() {
      clearTimeout(timer);
      if (!st) return;
      if (st.pausedAt) { timer = NL.later(250, tick); return; }
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

    // kind, from and tier keep to one kind of question at one level (the walkthrough makes a similar one).
    function makeQuestion(kind, from, tier) {
      var ti = tier == null ? st.tier : tier, T = TIERS[ti], n = NL.sizeOf(T.n);
      kind = kind || NC.pick(T.kinds);
      if (kind === 'evpost' || kind === 'evpre') {
        var t = NC.randomTree({ n: n, ops: T.ops, max: ti < 2 ? 60 : 120, noNeg: ti < 2 });
        var list = kind === 'evpre' ? NC.toPrefix(t) : NC.toPostfix(t);
        return { k: kind, tier: ti, kind: 'num', form: kind === 'evpre' ? 'prefix' : 'postfix', ask: 'Work out the value of this ' + (kind === 'evpre' ? 'prefix' : 'postfix') + ' expression.', show: NC.show(list), list: list, value: NC.evaluate(t), answer: String(NC.evaluate(t)) };
      }
      var tl = NC.randomTree({ n: n, ops: T.ops, letters: true, digitChance: T.implied ? 0.35 : 0 });
      if (kind === 'toin') {
        from = from || NC.pick(['prefix', 'postfix']);
        return { k: kind, tier: ti, from: from, kind: 'infix', ask: 'Write this ' + from + ' expression in infix.', show: NC.show(from === 'prefix' ? NC.toPrefix(tl) : NC.toPostfix(tl)), tree: tl, answer: NC.toInfix(tl) };
      }
      var target = kind === 'topre' ? NC.toPrefix(tl) : NC.toPostfix(tl);
      return { k: kind, tier: ti, implied: !!T.implied, kind: 'seq', ask: 'Write this infix expression in ' + (kind === 'topre' ? 'prefix' : 'postfix') + '.', show: NC.toInfix(tl, { implied: !!T.implied }), tree: tl, list: target, answer: NC.show(target) };
    }
    // Walk me through it: the right method for this kind of question, on a similar one. Evaluate: the stack.
    // Infix to prefix or postfix: the bracket method. Prefix or postfix to infix: grouping. The clock stops meanwhile.
    function walkSteps(q) {
      if (q.kind === 'num') return { steps: NLWalk.stack(q.list, q.form), title: 'evaluate ' + q.form + ' with a stack',
        intro: 'To work out a value, use a <b>stack</b>. ' };
      if (q.kind === 'infix') return { steps: NLWalk.group(q.tree, q.from), title: q.from + ' to infix by grouping',
        intro: 'To go back to infix, <b>group</b> each operator with its two values. ' };
      var to = q.k === 'topre' ? 'prefix' : 'postfix';
      return { steps: NLWalk.bracket(q.tree, 'infix', to, { implied: q.implied }).steps, title: 'infix to ' + to + ' by the bracket method',
        intro: 'To write infix in ' + to + ', use the <b>bracket method</b>. ' };
    }
    function walkMe() {
      if (!st || st.wait || st.pausedAt) return;
      var cur = st.q;
      var ex = NLWalk.pick(function () {
        var q = makeQuestion(cur.k, cur.from, cur.tier), w = walkSteps(q);
        return { key: q.show, question: q.show, answer: q.answer, steps: w.steps, q: q, w: w };
      }, { key: cur.show, question: cur.show, answer: cur.answer, numeric: cur.kind === 'num' });
      if (!ex) { NL.say(fb, 'Try that again in a moment.', 'hint'); return; }
      st.pausedAt = Date.now();
      NLWalk.open(host, { title: 'Walk me through it: ' + ex.w.title, question: ex.w.intro + 'Similar question: ' + esc(ex.q.ask) + ' <b class="calc">' + esc(ex.q.show) + '</b>', steps: ex.steps,
        onClose: function (seen, total) {
          if (st) { st.walks++; if (st.pausedAt) { st.end += Date.now() - st.pausedAt; st.pausedAt = 0; tick(); } }
          log.help(ex.w.title + ', ' + ex.q.show + ' while on ' + cur.show, seen, total);
        } });
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
      var wrow = el('div', { class: 'actions wt-row' });
      wrow.appendChild(NLWalk.button(walkMe));
      wrow.appendChild(el('span', { class: 'small' }, 'The clock stops while you look.'));
      body.appendChild(wrow);
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
      log.add('race: ' + s.right + ' right of ' + s.tries + ', score ' + s.score + ', best run ' + (s.bestRun || 0) + ' in a row, reached level ' + (s.topTier + 1) + (s.walks ? ', used Walk me through it ' + s.walks + (s.walks === 1 ? ' time' : ' times') : ''), (s.bestRun || 0) >= PASS);
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
