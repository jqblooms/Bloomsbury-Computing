// Mini-Contest: five short questions in the real ACSL Junior Contest 2 order (2 prefix/infix/postfix, 2 bit-string
// flicking, 1 What Does This Program Do?), against the clock. Move between questions and change answers; nothing
// is marked until hand in (or time up). Then each answer is marked with the working, and the result goes on this
// browser's scoreboard. ?minutes=n sets the lesson time; the real contest gives 30 minutes. A run in progress
// survives leaving the slide (this tab only).
var MiniContest = (function () {
  'use strict';
  var el = CA.el, esc = CA.esc;

  function start(host) {
    var lessonMinutes = Math.max(1, Math.min(60, Number(CA.params.get('minutes')) || 12));
    host.innerHTML = '';
    var top = el('div', { class: 'topline' });
    top.appendChild(el('div', { class: 'game-name' }, 'Mini-Contest <span>Five contest questions against the clock</span>'));
    var clock = el('div', { class: 'mock-clock', role: 'timer' }, CA.ICON.clock + '<b>' + lessonMinutes + ':00</b>');
    top.appendChild(clock);
    host.appendChild(top);
    var stage = el('div', { class: 'stage' });
    host.appendChild(stage);
    var saved = CA.load('contest-run', null, 'session');
    if (saved && saved.qs && !saved.handed) sit(saved); else intro();

    function scoreboard(rows) {
      var list = CA.load('contest-board', []);
      if (!list.length) return '<p class="muted small">Your scoreboard is empty. Sit the contest to get on it.</p>';
      return '<table class="board-table"><tr><th>Rank</th><th>Score</th><th>Time</th><th>When</th></tr>' + list.slice(0, rows || 5).map(function (r, i) {
        return '<tr' + (r.latest ? ' class="latest"' : '') + '><td>' + (i + 1) + '</td><td>' + r.score + ' / 5</td><td>' + CA.clockText(r.secs) + '</td><td>' + esc(r.when) + '</td></tr>';
      }).join('') + '</table>';
    }
    function intro() {
      stage.innerHTML = '';
      var card = el('div', { class: 'card intro' });
      card.innerHTML = '<div class="two"><div><h2>Ready?</h2><ul class="facts">' +
        '<li>Questions 1 and 2: prefix, infix and postfix.</li><li>Questions 3 and 4: bit-string flicking.</li><li>Question 5: what does this program do?</li>' +
        '<li>Change answers as often as you like. Nothing is marked until you hand in.</li></ul></div><div><h2>Your scoreboard</h2>' + scoreboard() + '</div></div>';
      var row = el('div', { class: 'actions' });
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.clock + '<span>Start: ' + lessonMinutes + ' minutes</span>');
      go.addEventListener('click', function () { sit({ qs: CAGen.contest(), answers: ['', '', '', '', ''], minutes: lessonMinutes, ends: Date.now() + lessonMinutes * 60000, at: 0, handed: false }); });
      row.appendChild(go);
      if (lessonMinutes !== 30) {
        var real = el('button', { type: 'button', class: 'btn secondary' }, '<span>Real contest time: 30 minutes</span>');
        real.addEventListener('click', function () { sit({ qs: CAGen.contest(), answers: ['', '', '', '', ''], minutes: 30, ends: Date.now() + 30 * 60000, at: 0, handed: false }); });
        row.appendChild(real);
      }
      card.appendChild(row);
      stage.appendChild(card);
      CA.reportHeight();
    }

    function sit(run) {
      var timer = null;
      CA.save('contest-run', run, 'session');
      stage.innerHTML = '';
      var tabs = el('div', { class: 'qtabs', role: 'tablist' });
      var pane = el('div', { class: 'card qpane' });
      var qhead = el('div', { class: 'qhead' });
      qhead.appendChild(tabs);
      stage.appendChild(qhead); stage.appendChild(pane);
      var hand = el('button', { type: 'button', class: 'btn' }, CA.ICON.flag + '<span>Hand in</span>');
      hand.addEventListener('click', function () {
        var blank = run.answers.filter(function (a) { return !String(a).trim(); }).length;
        if (blank && !hand.dataset.sure) { hand.dataset.sure = '1'; hand.querySelector('span').textContent = blank + ' blank. Hand in anyway?'; return; }
        handIn(false);
      });
      qhead.appendChild(hand);
      (function tick() {
        var left = Math.max(0, (run.ends - Date.now()) / 1000);
        clock.innerHTML = CA.ICON.clock + '<b>' + CA.clockText(left) + '</b>';
        clock.classList.toggle('low', left <= 60);
        if (left <= 0) { handIn(true); return; }
        timer = setTimeout(tick, 250);
      })();
      show(run.at || 0);

      function drawTabs() {
        tabs.innerHTML = '';
        run.qs.forEach(function (q, i) {
          var b = el('button', { type: 'button', role: 'tab', class: 'qtab' + (i === run.at ? ' now' : '') + (String(run.answers[i]).trim() ? ' filled' : ''), 'aria-selected': String(i === run.at) }, 'Q' + (i + 1));
          b.addEventListener('click', function () { show(i); });
          tabs.appendChild(b);
        });
      }
      function show(i) {
        run.at = i;
        CA.save('contest-run', run, 'session');
        drawTabs();
        var q = run.qs[i];
        pane.innerHTML = '';
        pane.appendChild(el('div', { class: 'mock-topic' }, 'Question ' + (i + 1) + ': ' + esc(CA.TOPIC[q.topic])));
        pane.appendChild(el('p', { class: 'q-prompt' }, esc(q.prompt)));
        var grid = el('div', { class: q.topic === 'loops' ? 'qgrid' : '' }), side = el('div', { class: 'side' });
        grid.appendChild(CA.questionBody(q, q.topic === 'loops' ? 'small' : 'big'));
        grid.appendChild(side);
        pane.appendChild(grid);
        var a = CA.answerRow('mc-answer', 'Answer', function () { if (i < 4) show(i + 1); }, true);
        a.input.value = run.answers[i] || '';
        a.input.addEventListener('input', function () { run.answers[i] = a.input.value; CA.save('contest-run', run, 'session'); drawTabs(); });
        side.appendChild(el('div', { class: 'format muted small' }, esc(CA.format(q))));
        side.appendChild(a.row);
        var nav = el('div', { class: 'actions' });
        if (i > 0) { var p = el('button', { type: 'button', class: 'btn secondary small' }, CA.ICON.back + '<span>Question ' + i + '</span>'); p.addEventListener('click', function () { show(i - 1); }); nav.appendChild(p); }
        if (i < 4) { var n = el('button', { type: 'button', class: 'btn secondary small' }, '<span>Question ' + (i + 2) + '</span>' + CA.ICON.next); n.addEventListener('click', function () { show(i + 1); }); nav.appendChild(n); }
        side.appendChild(nav);
        CA.focus(a.input);
        CA.reportHeight();
      }
      function handIn(timeUp) {
        if (run.handed) return;
        run.handed = true;
        if (timer) clearTimeout(timer);
        CA.clear('contest-run', 'session');
        var used = Math.min(run.minutes * 60, Math.round(run.minutes * 60 - Math.max(0, (run.ends - Date.now()) / 1000)));
        clock.classList.remove('low');
        clock.innerHTML = CA.ICON.clock + '<b>' + (timeUp ? 'Time is up' : 'Handed in at ' + CA.clockText(used)) + '</b>';
        var score = 0, marks = [];
        var oks = run.qs.map(function (q, i) { var ok = CA.accept(q, run.answers[i]); if (ok) score++; marks.push('Q' + (i + 1) + ' ' + (ok ? 'right' : 'wrong')); return ok; });
        var list = CA.load('contest-board', []).map(function (r) { delete r.latest; return r; });
        var d = new Date();
        list.push({ score: score, secs: used, when: d.getDate() + '/' + (d.getMonth() + 1) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), latest: true });
        list.sort(function (a, b) { return b.score - a.score || a.secs - b.secs; });
        list = list.slice(0, 10);
        CA.save('contest-board', list);
        var rank = list.map(function (r) { return !!r.latest; }).indexOf(true) + 1;
        stage.innerHTML = '';
        var res = el('div', { class: 'card result' });
        res.innerHTML = '<div class="two"><div class="left"><div class="mock-score"><b>' + score + ' / 5</b><span>' + (score === 5 ? 'A perfect paper.' : 'Open each question to see how to get it.') + '</span></div></div>' +
          '<div><h2>Your scoreboard</h2>' + (rank && rank <= 5 ? '<p class="small">You are number <b>' + rank + '</b> on your scoreboard.</p>' : '') + scoreboard(3) + '<div class="actions again"></div></div></div>';
        var ol = el('ol', { class: 'marked' });
        run.qs.forEach(function (q, i) {
          var typed = String(run.answers[i] || '').trim();
          ol.appendChild(el('li', { class: oks[i] ? 'good' : 'bad' }, '<details><summary><b>Q' + (i + 1) + '</b> ' + (oks[i] ? '<span class="ok">Right</span>' : '<span class="no">' + (typed ? 'Not right' : 'No answer') + '</span>') +
            ' <code>' + esc(q.code.split('\n')[0]) + (q.topic === 'loops' ? ' ...' : '') + '</code></summary>' +
            '<p>You typed <code>' + esc(typed || '(nothing)') + '</code>. The answer is <code class="ok">' + esc(q.answer) + '</code>.</p><ol>' +
            q.why.map(function (w) { return '<li><code>' + esc(w) + '</code></li>'; }).join('') + '</ol></details>'));
        });
        res.querySelector('.left').appendChild(ol);
        var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.again + '<span>A new contest</span>');
        again.addEventListener('click', function () { start(host); });
        res.querySelector('.again').appendChild(again);
        stage.appendChild(res);
        CA.report('arcade-contest', 'Mini-Contest', 'Mini-Contest: ' + score + ' of 5 in ' + CA.clockText(used) + ' (' + run.minutes + ' minutes allowed' + (timeUp ? ', time ran out' : '') + '). ' + marks.join(', ') + '.', true);
        CA.reportHeight();
      }
    }
  }
  return { start: start };
})();
