// Notation Race: 90 seconds of prefix, infix and postfix. One try at each expression. Every 3 right in a row
// raises the multiplier (x2, then x3); every 3 right in all raises the level (longer expressions, implied
// multiplication, prefix to postfix). Personal best kept in this browser.
var NotationRace = (function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var PASS_RUN = 6; // James 2026-10-27: finished only with this many right in a row in one race.
  var SECONDS = 90;
  var KIND = { 'prefix-eval': 'Evaluate prefix', 'postfix-eval': 'Evaluate postfix', 'to-prefix': 'Infix to prefix', 'to-postfix': 'Infix to postfix',
    'pre-to-post': 'Prefix to postfix', 'post-to-pre': 'Postfix to prefix' };

  function start(host) {
    var seconds = Math.max(30, Math.min(300, Number(CA.params.get('seconds')) || SECONDS));
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'game-name' }, 'Notation Race <span>Prefix, infix and postfix against the clock</span>'));
    var bar = el('div', { class: 'scorebar' }, CA.chip(CA.ICON.star, 'Score', 'nr-score') + CA.chip(CA.ICON.flame, 'Streak', 'nr-streak') +
      CA.chip(CA.ICON.bolt, 'Level', 'nr-level') + CA.chip(CA.ICON.trophy, 'Best', 'nr-best') + CA.chip(CA.ICON.clock, 'Time', 'nr-time'));
    top.appendChild(bar);
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    var best = CA.load('race-best', 0);
    CA.setChip(bar, 'nr-best', best); CA.setChip(bar, 'nr-level', 1); CA.setChip(bar, 'nr-time', CA.clockText(seconds));
    intro();

    function intro() {
      stage.innerHTML = '';
      var card = el('div', { class: 'card intro' });
      card.innerHTML = '<h2>' + seconds + ' seconds. How many can you get?</h2><ul class="facts">' +
        '<li>Evaluate, or convert between prefix, infix and postfix. <b>One try</b> at each.</li>' +
        '<li>3 right in a row: points <b>x2</b>. 6 in a row: <b>x3</b>. A miss resets the streak.</li>' +
        '<li>Every 3 right, the level goes up: longer expressions, more points.</li>' +
        '<li>Type <code>^</code> for the up arrow. Spaces do not matter.</li></ul>';
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.clock + '<span>Start the race</span>');
      go.addEventListener('click', run);
      card.appendChild(el('div', { class: 'actions' })).appendChild(go);
      stage.appendChild(card);
      CA.reportHeight();
    }

    function run() {
      var s = { score: 0, streak: 0, bestStreak: 0, right: 0, tries: 0, level: 1, missed: [] };
      var ends = Date.now() + seconds * 1000, over = false, timer = null, q = null;
      stage.innerHTML = '';
      var card = el('div', { class: 'card race' });
      var head = el('div', { class: 'q-head' });
      var body = el('div', { class: 'q-body' });
      var prompt = el('p', { class: 'q-prompt' });
      var ans = CA.answerRow('nr-answer', 'Answer', submit, true);
      var fmt = el('div', { class: 'format muted small' });
      var go = el('button', { type: 'button', class: 'btn' }, CA.ICON.check + '<span>Submit</span>');
      go.addEventListener('click', submit);
      ans.row.appendChild(go);
      var fb = el('div', { class: 'feedback', role: 'status' });
      card.appendChild(head); card.appendChild(prompt); card.appendChild(body); card.appendChild(fmt); card.appendChild(ans.row); card.appendChild(fb);
      stage.appendChild(card);
      next();
      (function tick() {
        var left = Math.max(0, (ends - Date.now()) / 1000);
        CA.setChip(bar, 'nr-time', CA.clockText(left));
        bar.querySelector('#nr-time').classList.toggle('low', left <= 10);
        if (left <= 0) { finish(); return; }
        timer = setTimeout(tick, 200);
      })();

      function mult() { return s.streak >= 6 ? 3 : s.streak >= 3 ? 2 : 1; }
      function draw() {
        CA.setChip(bar, 'nr-score', s.score);
        CA.setChip(bar, 'nr-streak', s.streak + (mult() > 1 ? ' x' + mult() : ''));
        CA.setChip(bar, 'nr-level', s.level);
        CA.setChip(bar, 'nr-best', Math.max(best, s.score));
        bar.querySelector('#nr-streak').classList.toggle('hot', s.streak >= 3);
      }
      function next() {
        q = CAGen.notation(s.level);
        head.innerHTML = '<span class="tag">' + esc(KIND[q.kind]) + '</span><span class="muted small">Level ' + s.level + '</span>';
        prompt.textContent = q.prompt;
        body.innerHTML = '';
        body.appendChild(CA.questionBody(q, 'big'));
        fmt.textContent = CA.format(q);
        ans.input.value = '';
        ans.input.disabled = false;
        CA.focus(ans.input);
        draw();
        CA.reportHeight();
      }
      function submit() {
        if (over || !ans.input.value.trim()) return;
        s.tries++;
        if (CA.accept(q, ans.input.value)) {
          s.streak++; s.right++;
          s.bestStreak = Math.max(s.bestStreak, s.streak);
          var gain = (5 + 5 * q.level) * mult();
          s.score += gain;
          fb.className = 'feedback';
          fb.innerHTML = 'Right. <b>+' + gain + '</b>' + (s.streak === 3 ? ' Streak x2!' : s.streak === 6 ? ' Streak x3!' : '');
          CA.pop(bar.querySelector('#nr-score'), '+' + gain);
          if (s.right % 3 === 0 && s.level < 4) s.level++;
        } else {
          s.streak = 0;
          s.missed.push(q);
          fb.className = 'feedback error';
          fb.innerHTML = 'Not this time. <code>' + esc(q.code) + '</code> is <code>' + esc(q.answer) + '</code>.';
        }
        next();
      }
      function finish() {
        if (over) return;
        over = true;
        if (timer) clearTimeout(timer);
        var newBest = s.score > best;
        if (newBest) { best = s.score; CA.save('race-best', best); }
        draw();
        stage.innerHTML = '';
        var res = el('div', { class: 'card result' });
        res.innerHTML = '<h2>' + (newBest && s.score > 0 ? 'New personal best!' : 'Time is up') + '</h2>' +
          '<div class="big-stats"><div><b>' + s.score + '</b><span>score</span></div><div><b>' + s.right + ' / ' + s.tries + '</b><span>right</span></div>' +
          '<div><b>' + s.bestStreak + '</b><span>best streak</span></div><div><b>' + s.level + '</b><span>level reached</span></div></div>' +
          '<p class="small">' + (s.bestStreak >= PASS_RUN ? 'Finished: ' + PASS_RUN + ' right in a row.' : 'Not finished yet: you need ' + PASS_RUN + ' right in a row in one race. Your best run: ' + s.bestStreak + '.') + '</p>' +
          (s.missed.length ? '<p class="muted small">Missed:</p><ul class="missed">' + s.missed.slice(-3).map(function (m) {
            return '<li><code>' + esc(m.code) + '</code> <span class="muted">' + esc(KIND[m.kind]) + '</span> <code class="ok">' + esc(m.answer) + '</code></li>'; }).join('') + '</ul>' : '');
        var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.again + '<span>Race again</span>');
        again.addEventListener('click', run);
        res.appendChild(el('div', { class: 'actions' })).appendChild(again);
        stage.appendChild(res);
        CA.report('arcade-race', 'Notation Race', 'Notation Race: score ' + s.score + ', ' + s.right + ' right of ' + s.tries + ', best streak ' + s.bestStreak + ', level ' + s.level + ' reached. Best ' + best + '.', s.bestStreak >= PASS_RUN);
        CA.reportHeight();
      }
    }
  }
  return { start: start };
})();
