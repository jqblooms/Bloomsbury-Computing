// Group It (?mode=group): turn prefix or postfix back into infix. Click an operator that has two whole values right
// next to it (postfix: just before it; prefix: just after it). The three tiles join into one bracketed group. Repeat
// until one group is left: that is the infix. A click on an operator without two values beside it costs a heart.
// From level 4 the student types a prediction of the infix first, and the grouping checks it.
(function () {
  'use strict';
  var NC = NL.NC, el = NL.el, esc = NL.esc;
  var FOUR = ['+', '-', '*', '/'], ALL = FOUR.concat([NC.POW]);
  var LEVELS = [
    { name: 'Postfix', form: 'postfix', n: 2, ops: FOUR },
    { name: 'Prefix', form: 'prefix', n: 2, ops: FOUR },
    { name: 'Longer postfix', form: 'postfix', n: [3, 4], ops: FOUR },
    { name: 'Predict: prefix', form: 'prefix', n: [3, 4], ops: FOUR, predict: true },
    { name: 'Predict: either', form: 'mixed', n: [4, 5], ops: ALL, predict: true }
  ];
  var NEED = 2, HEARTS = 3;

  NL.activities.group = function (host) {
    var lv = Math.max(0, Math.min(LEVELS.length - 1, (parseInt(NL.params.get('level'), 10) || 1) - 1));
    var have = 0, score = 0, streak = 0;
    var log = NL.results('Group It');
    var G = null;

    var bar = NL.topbar(host);
    var q = el('p', { class: 'task-q' });
    var rule = el('div', { class: 'rule-box' });
    var sup = NL.support('group', rule);
    sup.toggle(bar.slot);
    var predBox = el('div'), stripBox = el('div'), act = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback' });
    var walkRow = el('div', { class: 'actions wt-row' });
    walkRow.appendChild(NLWalk.button(walkMe));
    [q, rule, predBox, stripBox, act, fb, walkRow].forEach(function (n) { host.appendChild(n); });

    // Walk me through it: grouping on a similar expression (same level and form, a different expression).
    function walkMe() {
      var lev = L(), form = G.form;
      var ex = NLWalk.pick(function () {
        var t = NC.randomTree({ n: NL.sizeOf(lev.n), ops: lev.ops, letters: true, digitChance: lev.ops === ALL ? 0.2 : 0 });
        var list = form === 'prefix' ? NC.toPrefix(t) : NC.toPostfix(t);
        return { key: NC.toPrefix(t).join(' '), answer: NC.toInfix(t), steps: NLWalk.group(t, form), show: NC.show(list) };
      }, { key: NC.toPrefix(G.tree).join(' '), answer: NC.toInfix(G.tree) });
      if (!ex) { NL.say(fb, 'Try that again in a moment.', 'hint'); return; }
      G.walked = true;
      var mine = G;
      NLWalk.open(host, { title: 'Walk me through it: ' + form + ' to infix', question: 'Similar question: write the ' + form + ' <b class="calc">' + esc(ex.show) + '</b> in infix.', steps: ex.steps,
        onClose: function (seen, total) { log.help(form + ' ' + ex.show + ' while on ' + mine.list.join(' '), seen, total); } });
    }

    function L() { return LEVELS[lv]; }
    function isValue(it) { return it && (it.tree && true); }

    function newExpr() {
      var lev = L();
      var form = lev.form === 'mixed' ? NC.pick(['prefix', 'postfix']) : lev.form;
      var tree = NC.randomTree({ n: NL.sizeOf(lev.n), ops: lev.ops, letters: true, digitChance: lev.ops === ALL ? 0.2 : 0 });
      var list = form === 'prefix' ? NC.toPrefix(tree) : NC.toPostfix(tree);
      G = { tree: tree, form: form, list: list, items: list.map(function (tk) { return NC.isOp(tk) ? { op: tk } : { tree: NC.leaf(tk) }; }),
        hearts: HEARTS, mistakes: 0, phase: lev.predict ? 'predict' : 'group', prediction: null, fresh: -1, flash: -1 };
      sup.set(form === 'postfix' ? [
        '<b>Postfix:</b> find an operator with two values just <b>before</b> it. Those two are its left and right: <code>A B -</code> becomes <code>(A - B)</code>.',
        'Postfix: two values just before the operator.',
        'Look before the operator.'
      ] : [
        '<b>Prefix:</b> find an operator with two values just <b>after</b> it. Those two are its left and right: <code>- A B</code> becomes <code>(A - B)</code>.',
        'Prefix: two values just after the operator.',
        'Look after the operator.'
      ]);
      draw();
    }

    function draw(note) {
      var lev = L();
      bar.set({ level: 'Level ' + (lv + 1) + ': ' + lev.name, have: have, need: log.isDone() && lv === LEVELS.length - 1 ? 0 : NEED, score: score, streak: streak, hearts: G.hearts });
      q.innerHTML = G.phase === 'predict' ? 'Predict first: write this ' + G.form + ' expression in infix. Then group it to check.' :
        G.phase === 'group' ? 'Turn this ' + G.form + ' expression into infix. Click an operator that has two values right next to it.' : 'Done.';
      predBox.innerHTML = '';
      if (G.phase === 'predict') drawPredict();
      else if (G.prediction != null) predBox.innerHTML = '<div class="small">Your prediction: <b class="calc">' + esc(G.prediction) + '</b></div>';
      drawStrip();
      act.innerHTML = '';
      if (G.phase === 'end' || G.phase === 'over') {
        var b = el('button', { type: 'button', class: 'btn' }, 'Next expression ' + NL.ICON.next);
        b.addEventListener('click', function () { NL.say(fb, ''); newExpr(); });
        act.appendChild(b);
      }
      if (note) NL.say(fb, note[0], note[1]);
      NL.reportHeight();
    }

    function drawPredict() {
      var row = el('div', { class: 'actions' });
      var input = el('input', { class: 'answer-in wide', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your infix prediction', placeholder: 'for example (A + B) * C' });
      var go = el('button', { type: 'button', class: 'btn' }, 'Lock it in');
      function lock() {
        var raw = String(input.value).trim();
        if (!raw) { NL.say(fb, 'Type your infix first.', 'hint'); return; }
        if (!NC.parseInfix(raw)) { NL.say(fb, 'That cannot be read as infix. Check the brackets and that every operator has a value on each side.', 'hint'); return; }
        G.prediction = raw; G.phase = 'group';
        draw(['Locked in. Now group it to check.', '']);
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); lock(); } });
      go.addEventListener('click', lock);
      row.appendChild(input); row.appendChild(go);
      predBox.appendChild(row);
    }

    function drawStrip() {
      stripBox.innerHTML = '';
      var strip = el('div', { class: 'strip' });
      G.items.forEach(function (it, i) {
        if (it.tree) {
          var text = it.tree.op ? '(' + NC.toInfix(it.tree) + ')' : it.tree.v;
          strip.appendChild(el('span', { class: 'tok' + (it.tree.op ? ' grp' : '') + (i === G.fresh ? ' enter' : '') }, esc(text)));
          return;
        }
        var cls = 'tok op' + (i === G.flash ? ' flash-bad' : '');
        if (G.phase === 'group') {
          var b = el('button', { type: 'button', class: cls, 'aria-label': 'operator ' + it.op }, esc(it.op));
          b.addEventListener('click', function () { pickOp(i); });
          strip.appendChild(b);
        } else strip.appendChild(el('span', { class: cls }, esc(it.op)));
      });
      stripBox.appendChild(strip);
    }

    function pickOp(i) {
      var a = G.form === 'postfix' ? i - 2 : i + 1, b = a + 1;
      var it = G.items;
      if (isValue(it[a]) && isValue(it[b])) {
        var group = { tree: NC.node(it[i].op, it[a].tree, it[b].tree) };
        var from = Math.min(i, a);
        it.splice(from, 3, group);
        G.fresh = from;
        score += 10; streak++; sup.right();
        if (it.length === 1) { finishExpr(true); return; }
        draw(['', '']);
        return;
      }
      G.hearts--; G.mistakes++; streak = 0; sup.wrong();
      G.flash = i;
      NL.later(700, function () { G.flash = -1; if (G.phase === 'group') drawStrip(); });
      var why = 'That operator does not have two values just ' + (G.form === 'postfix' ? 'before' : 'after') + ' it yet. Group another one first.';
      if (G.hearts <= 0) {
        G.items = [{ tree: G.tree }]; G.fresh = 0; G.phase = 'over';
        finishExpr(false, why + ' No hearts left: here is the whole expression.');
        return;
      }
      draw([why, 'bad']);
    }

    function finishExpr(solved, msg) {
      var infix = NC.toInfix(G.tree);
      var text = msg || ('One group is left. Without the outer brackets, the infix is <b class="calc">' + esc(infix) + '</b>.');
      if (msg) text += ' Infix: <b class="calc">' + esc(infix) + '</b>.';
      var predOk = null;
      if (G.prediction != null) {
        predOk = NC.sameTree(NC.parseInfix(G.prediction), G.tree);
        text += predOk ? ' Your prediction was right: +30.' : ' Your prediction reads as a different expression.';
        if (predOk) score += 30;
      }
      if (solved && G.mistakes === 0) score += 20;
      var ok = solved && predOk !== false;
      log.add(G.form + ' ' + G.list.join(' ') + ' is ' + infix + (G.prediction != null ? (predOk ? ', predicted right' : ', predicted ' + G.prediction) : '') + (solved ? (G.mistakes ? ', ' + G.mistakes + ' wrong clicks' : '') : ', out of hearts') + (G.walked ? ', used Walk me through it' : ''), ok);
      var up = false;
      // James 2026-10-27: an expression with any mistake never counts and starts the run again.
      if (ok && G.mistakes) text += ' It had ' + (G.mistakes === 1 ? 'a wrong click' : G.mistakes + ' wrong clicks') + ', so it does not count.';
      if (!ok || G.mistakes) { have = 0; text += ' Your run is back to 0: you need ' + NEED + ' in a row with no mistakes.'; }
      else {
        have += 1;
        if (have >= NEED && lv < LEVELS.length - 1) { lv++; have = 0; up = true; }
        else if (have >= NEED) { log.finish(); have = 0; }
      }
      G.phase = solved ? 'end' : 'over';
      if (up) text += ' Level up: ' + esc(LEVELS[lv].name) + '.';
      if (log.isDone() && lv === LEVELS.length - 1 && ok) text = NL.doneBanner('You can turn prefix and postfix into infix. Keep going for a higher score.') + text;
      draw([text, ok ? '' : 'hint']);
    }

    newExpr();
  };
})();
