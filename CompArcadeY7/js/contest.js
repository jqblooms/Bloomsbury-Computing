// Mini Contest (?game=contest&minutes=5): five short questions, contest style, on a clock. Typed answers, marked
// only when the student hands in (or the time runs out). Stars: 5 right is 3 stars, 4 is 2, 3 is 1. Every try goes
// on the scoreboard on this computer, best first. The clock reads Date.now(), so a slow timer cannot cheat it.
CA.games.contest = function (host) {
  'use strict';
  var G = CompGenY7, el = CA.el, esc = CA.esc;
  var MINUTES = Math.max(1, Math.min(15, Number(CA.params.get('minutes')) || 5));
  var res = CA.results('mini-contest', 'Mini Contest');
  var SET = [
    function () { return G.question(G.pick(['postfix', 'postfix', 'prefix']), 3); },
    function () { return G.pick([function () { return G.question('prefix', 2); }, function () { return G.question(G.pick(['to-postfix', 'to-prefix']), 3); }])(); },
    function () { return G.question(G.pick(['bits-xor', 'bits-two']), 2); },
    function () { return G.question(G.pick(['bits-two', 'bits-shift2']), 2); },
    function () { return G.question('loop', G.pick([3, 4])); }
  ];
  var KEY = 'contest-board';
  var timer = null, qs = [], boxes = [], endAt = 0, startedAt = 0, handed = false;

  function starsFor(n) { return n >= 5 ? 3 : n === 4 ? 2 : n === 3 ? 1 : 0; }
  function board() { return CA.load(KEY, []); }

  function menu(last) {
    clearInterval(timer);
    host.innerHTML = '';
    host.appendChild(el('div', { class: 'game-head' }, '<h1>Mini Contest</h1><span class="muted">5 questions, ' + MINUTES + ' minutes</span>'));
    var wrap = el('div', { class: 'contest-menu' });
    var info = el('div', { class: 'contest-info' });
    info.innerHTML = '<p>Like the real contest: one answer for each question, no calculator. Write your working on paper.</p>' +
      '<ul class="plain"><li>Questions 1 and 2: prefix, postfix and infix</li><li>Questions 3 and 4: bit strings</li><li>Question 5: a loop</li></ul>' +
      '<p class="stars-key">' + CA.stars(3) + ' 5 right &nbsp; ' + CA.stars(2) + ' 4 right &nbsp; ' + CA.stars(1) + ' 3 right</p>';
    var row = el('div', { class: 'actions' });
    row.appendChild(CA.btn(last ? 'Try a new contest' : 'Start the contest', '', start, 'play'));
    info.appendChild(row);
    wrap.appendChild(info);
    wrap.appendChild(scoreboard(last));
    host.appendChild(wrap);
    CA.reportHeight();
  }
  function scoreboard(last) {
    var list = board().slice().sort(function (a, b) { return b.score - a.score || a.secs - b.secs; }).slice(0, 6);
    var box = el('div', { class: 'scoreboard' });
    box.innerHTML = '<h2>' + CA.ICON.trophy + 'Scoreboard</h2>' + (list.length ? '<table><tr><th>#</th><th>Score</th><th>Stars</th><th>Time</th></tr>' +
      list.map(function (r, i) {
        return '<tr' + (last && r.at === last.at ? ' class="me"' : '') + '><td>' + (i + 1) + '</td><td><b>' + r.score + '</b> / 5</td><td>' + CA.stars(r.stars) + '</td><td>' + clockText(r.secs) + '</td></tr>';
      }).join('') + '</table>' : '<p class="muted">No tries yet on this computer. Be the first!</p>');
    return box;
  }
  function clockText(s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }

  function start() {
    handed = false;
    qs = SET.map(function (f) { return f(); });
    host.innerHTML = '';
    var head = el('div', { class: 'contest-head' });
    var clock = el('span', { class: 'clock mono' });
    head.appendChild(el('h1', {}, 'Mini Contest'));
    head.appendChild(clock);
    head.appendChild(el('span', { class: 'spacer' }));
    var foot = el('span', { class: 'contest-foot' });
    head.appendChild(foot);
    host.appendChild(head);
    var fb = el('div', { class: 'feedback' });
    host.appendChild(fb);
    var grid = el('div', { class: 'contest-grid' });
    boxes = qs.map(function (q, i) {
      var card = el('div', { class: 'contest-q' + (q.show.type === 'code' ? ' wide' : '') });
      card.appendChild(el('p', { class: 'cq-title' }, '<b>' + (i + 1) + '.</b> ' + esc(q.prompt)));
      var body = el('div', { class: q.show.type === 'code' ? 'cq-body cq-code' : 'cq-body' });
      if (q.show.type === 'code') body.appendChild(el('div', { class: 'code-box' }, q.show.lines.map(function (l, k) {
        return '<div class="code-line"><span class="ln">' + (k + 1) + '</span>' + esc(l).replace(/^( +)/, function (m) { return '&nbsp;'.repeat(m.length * 2); }) + '</div>';
      }).join('')));
      else body.appendChild(el('p', { class: 'cq-expr mono' }, esc(q.show.text)));
      var ans = el('div', { class: 'cq-answer' });
      var box = CA.answerBox({ label: 'Answer to question ' + (i + 1), wide: q.topic !== 'loops', placeholder: q.format }, function () {
        var next = boxes[i + 1]; if (next) CA.focusIn(next.input); else CA.focusIn(handBtn);
      });
      ans.appendChild(box.wrap);
      var mark = el('div', { class: 'cq-mark' });
      ans.appendChild(mark);
      body.appendChild(ans);
      card.appendChild(body);
      grid.appendChild(card);
      return { input: box.input, mark: mark, card: card };
    });
    host.appendChild(grid);
    var handBtn = CA.btn('Hand in', '', function () {
      var blank = boxes.filter(function (b) { return !b.input.value.trim(); }).length;
      if (blank && !handBtn.armed) { handBtn.armed = true; CA.say(fb, blank + ' question' + (blank > 1 ? 's are' : ' is') + ' blank. Press Hand in again to hand in anyway.', 'hint'); return; }
      handIn(false);
    }, 'check');
    foot.appendChild(handBtn);
    startedAt = Date.now();
    endAt = startedAt + MINUTES * 60000;
    function tick() {
      var left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      clock.innerHTML = CA.ICON.clock + clockText(left);
      clock.classList.toggle('low', left <= 30);
      if (!left) handIn(true);
    }
    tick();
    timer = setInterval(tick, 250);
    CA.focusIn(boxes[0].input);
    CA.reportHeight();

    function handIn(timeUp) {
      if (handed) return;
      handed = true;
      clearInterval(timer);
      var right = 0, lines = [];
      qs.forEach(function (q, i) {
        var b = boxes[i], typed = b.input.value.trim(), ok = !!typed && q.re.test(typed);
        if (ok) right++;
        b.input.disabled = true;
        b.card.classList.add(ok ? 'good' : 'bad');
        b.mark.innerHTML = ok ? '<span class="good-text">' + CA.ICON.check + ' Right</span>' : '<span class="bad-text">Answer: <b class="mono">' + esc(q.answer) + '</b></span>';
        lines.push((i + 1) + ' ' + (ok ? 'right' : 'wrong') + ' (' + (q.show.text || 'loop') + ' = ' + q.answer + ', typed ' + (typed || 'nothing') + ')');
      });
      var secs = Math.min(MINUTES * 60, Math.round((Date.now() - startedAt) / 1000)), stars = starsFor(right);
      var entry = { at: Date.now(), score: right, stars: stars, secs: secs };
      var list = board(); list.push(entry); CA.save(KEY, list.slice(-30));
      res.note('Contest: ' + right + ' of 5 in ' + clockText(secs) + (timeUp ? ' (time up)' : '') + '. ' + lines.join('; ') + '.');
      // James 2026-10-27: only a contest with every answer right counts as finished.
      if (right === qs.length) res.finish();
      foot.innerHTML = '';
      CA.say(fb, '', '');
      var sum = el('div', { class: 'contest-result' });
      sum.innerHTML = CA.stars(stars) + '<span class="big">' + right + ' / 5</span><span class="muted">' + (timeUp ? 'Time up. ' : '') + 'Time ' + clockText(secs) + '</span>';
      foot.appendChild(sum);
      foot.appendChild(el('p', { class: 'muted' }, right === qs.length ? 'Every answer right: finished.' : 'This contest does not count as finished: get all ' + qs.length + ' right in one contest.'));
      foot.appendChild(CA.btn('Scoreboard', '', function () { menu(entry); }, 'trophy'));
      CA.reportHeight();
    }
  }

  menu(null);
};
