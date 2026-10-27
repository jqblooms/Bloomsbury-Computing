// Mock Contest: five short questions as in an ACSL Junior Contest 2 paper (2 prefix/infix/postfix, 2 bit-string
// flicking, 1 What Does This Program Do), against the clock. Nothing is marked until the student hands in (or the
// time runs out); then each answer is marked with the working shown. ?minutes=n sets the time (default 15).
var MockContest = (function () {
  'use strict';
  var el = LT.el, esc = LT.esc;
  var TOPIC = { notation: 'Prefix, Infix and Postfix', bits: 'Bit-String Flicking', loops: 'What Does This Program Do?' };

  function start(host, opts) {
    var minutes = Math.min(60, Math.max(1, opts.minutes || 15));
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'level-name' }, 'Mock Contest <span>5 questions, ' + minutes + ' minutes</span>'));
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    var intro = el('div', { class: 'result-card intro' });
    intro.innerHTML = '<h2>Ready?</h2><ul class="facts"><li>Questions 1 and 2: prefix, infix and postfix.</li><li>Questions 3 and 4: bit-string flicking.</li><li>Question 5: what does this program do?</li>' +
      '<li>You can move between questions and change answers. Nothing is marked until you hand in.</li><li>Each right answer scores 1 point.</li></ul>';
    var go = el('button', { type: 'button', class: 'btn' }, LT.ICON.clock + '<span>Start the clock</span>');
    go.addEventListener('click', begin);
    intro.appendChild(el('div', { class: 'actions' })).appendChild(go);
    stage.appendChild(intro);
    LT.reportHeight();

    function begin() {
      var qs = ACSLGen.mock(), ends = Date.now() + minutes * 60000, handed = false, timer = null;
      stage.innerHTML = '';
      var clock = el('div', { class: 'mock-clock', role: 'timer' });
      top.appendChild(clock);
      var list = el('ol', { class: 'mock-list' });
      var inputs = [];
      qs.forEach(function (q, i) {
        var li = el('li', { class: 'mock-q' });
        li.appendChild(el('div', { class: 'mock-topic' }, 'Question ' + (i + 1) + ': ' + esc(TOPIC[q.topic])));
        li.appendChild(el('p', { class: 'mock-prompt' }, esc(q.prompt)));
        if (q.topic === 'loops') li.appendChild(LT.codeBox(q.code.split('\n'), { small: true }));
        else li.appendChild(el('div', { class: 'expr' }, esc(q.code)));
        var row = el('div', { class: 'answer-row' });
        var id = 'mock-a' + i;
        row.appendChild(el('label', { for: id }, 'Answer'));
        var input = el('input', { id: id, type: 'text', autocomplete: 'off', spellcheck: 'false' });
        row.appendChild(input);
        li.appendChild(row);
        li.appendChild(el('div', { class: 'mock-mark' }));
        inputs.push(input);
        list.appendChild(li);
      });
      stage.appendChild(list);
      var actions = el('div', { class: 'actions' });
      var hand = el('button', { type: 'button', class: 'btn' }, LT.ICON.flag + '<span>Hand in</span>');
      hand.addEventListener('click', function () {
        var blank = inputs.filter(function (x) { return !x.value.trim(); }).length;
        if (blank && !hand.dataset.sure) { hand.dataset.sure = '1'; hand.querySelector('span').textContent = blank + ' blank. Hand in anyway?'; return; }
        handIn();
      });
      actions.appendChild(hand);
      stage.appendChild(actions);
      inputs[0].focus({ preventScroll: true });
      (function tick() {
        var left = Math.max(0, (ends - Date.now()) / 1000);
        clock.innerHTML = LT.ICON.clock + '<b>' + LT.clockText(left) + '</b>';
        clock.classList.toggle('low', left <= 60);
        if (left <= 0) { handIn(true); return; }
        timer = setTimeout(tick, 250);
      })();
      LT.reportHeight();

      function handIn(timeUp) {
        if (handed) return;
        handed = true;
        if (timer) clearTimeout(timer);
        var used = Math.round(minutes * 60 - Math.max(0, (ends - Date.now()) / 1000));
        clock.classList.remove('low');
        clock.innerHTML = LT.ICON.clock + '<b>' + (timeUp ? 'Time is up' : 'Handed in at ' + LT.clockText(used)) + '</b>';
        var score = 0, marks = [];
        qs.forEach(function (q, i) {
          var input = inputs[i], typed = input.value, ok = !!typed.trim() && q.accept(typed);
          if (ok) score++;
          marks.push('Q' + (i + 1) + ' ' + (ok ? 'right' : 'wrong'));
          input.disabled = true;
          var li = list.children[i], mark = li.querySelector('.mock-mark');
          li.classList.add(ok ? 'good' : 'bad');
          mark.innerHTML = (ok ? '<b class="ok">Right.</b> ' : '<b class="no">' + (typed.trim() ? 'Not right.' : 'No answer.') + '</b> The answer is <code>' + esc(q.answer) + '</code>. ') +
            '<details><summary>How to get it</summary><ol>' + q.why.map(function (w) { return '<li><code>' + esc(w) + '</code></li>'; }).join('') + '</ol></details>';
        });
        actions.innerHTML = '';
        var banner = el('div', { class: 'mock-score' }, '<b>' + score + ' / 5</b><span>' + (score === 5 ? 'A perfect paper: finished.' : 'Not finished: you need all 5 right. ' + (score >= 3 ? 'Check the ones you missed: open How to get it.' : 'Open How to get it on each one, then try a new mock.')) + '</span>');
        stage.insertBefore(banner, list);
        var again = el('button', { type: 'button', class: 'btn' }, LT.ICON.again + '<span>New mock</span>');
        again.addEventListener('click', function () { start(host, opts); });
        actions.appendChild(again);
        LT.report('looptracer-mock', 'Loop Tracer: Mock Contest', 'Mock contest: ' + score + ' of 5 in ' + LT.clockText(used) + (timeUp ? ' (time ran out)' : '') + '. ' + marks.join(', ') + '.', score === 5);
        LT.reportHeight();
      }
    }
  }
  return { start: start };
})();
