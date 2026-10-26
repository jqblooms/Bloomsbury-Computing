// Mini Contest (?mode=contest): five questions in the style of the ACSL Junior contest, one per topic area, against
// the clock (?minutes=n, 8 by default). Move between questions freely; nothing is marked until you hand in or time
// runs out. Then each question shows right or wrong with the answer and how it works, and the run goes on this
// computer's scoreboard (score, then time used).
(function () {
  'use strict';
  var el = CA.el, esc = CA.esc;
  var PLAN = [
    { kinds: ['post-eval', 'pre-eval'], level: 3 },
    { kinds: ['to-post', 'to-pre'], level: 3 },
    { kinds: ['bits-shift'], level: [3, 4] },
    { kinds: ['bits-chain', 'bits-logic'], level: [3, 4] },
    { kinds: ['loop'], level: [4, 5] }
  ];
  var PASS = 3, BOARD_KEY = 'bc-ca8-contest-board-v1';
  function minutes() { var m = Number(CA.params.get('minutes')); return m >= 1 && m <= 30 ? m : 8; }
  function board() { try { var b = JSON.parse(localStorage.getItem(BOARD_KEY) || '[]'); return Array.isArray(b) ? b : []; } catch (e) { return []; } }

  CA.modes.contest = function (host) {
    var log = CA.results('Mini Contest');
    var st = null, clock = null;
    var bar = el('div', { class: 'gbar' }), body = el('div');
    host.appendChild(bar); host.appendChild(body);

    function scoreTable(highlight) {
      var b = board();
      if (!b.length) return '';
      return '<h2 style="margin-top:10px">Scoreboard on this computer</h2><table class="scores"><tr><th>Place</th><th>Score</th><th>Time used</th><th>When</th></tr>' +
        b.slice(0, 5).map(function (r, i) {
          return '<tr class="' + (r.at === highlight ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + r.score + ' of 5</td><td>' + CA.mmss(r.used) + '</td><td>' + esc(r.when) + '</td></tr>';
        }).join('') + '</table>';
    }

    function intro() {
      st = null;
      bar.innerHTML = '<span class="pill">' + CA.ICON.trophy + ' Mini Contest</span>';
      body.innerHTML = '<h2>' + PLAN.length + ' questions, ' + minutes() + ' minutes</h2><p>Just like contest day: prefix and postfix, converting, two bit-string questions and a program. One point each.</p>' +
        '<ul class="rules"><li>Move between questions with the numbers. Nothing is marked until you hand in.</li>' +
        '<li>A tie on points goes to the faster time.</li></ul>' + scoreTable();
      var go = el('button', { type: 'button', class: 'btn big' }, CA.ICON.play + ' Start the contest');
      go.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(go); body.appendChild(row);
      CA.reportHeight();
    }
    function start() {
      var qs = PLAN.map(function (p) { return Y8Gen.question(Y8Gen.pick(p.kinds), Array.isArray(p.level) ? Y8Gen.pick(p.level) : p.level); });
      st = { qs: qs, typed: qs.map(function () { return ''; }), at: 0, began: Date.now() };
      var total = minutes() * 60000;
      clock = CA.countdown(total, function (ms) { st.left = ms; drawBar(); }, function () { handIn(true); });
      show(0);
    }
    function drawBar() {
      if (!st) return;
      var tabs = '';
      st.qs.forEach(function (q, i) { tabs += '<button type="button" class="qtab' + (i === st.at ? ' on' : '') + (st.typed[i].trim() ? ' has' : '') + '" data-q="' + i + '">' + (i + 1) + '</button>'; });
      bar.innerHTML = '<span class="qtabs">' + tabs + '</span><span class="spacer"></span><span class="chip' + (st.left < 60000 ? ' low' : '') + '">' + CA.ICON.clock + '<b>' + CA.mmss(st.left) + '</b></span>';
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (b && st && !st.done) show(Number(b.getAttribute('data-q')));
    });
    function show(i) {
      st.at = i; drawBar();
      var q = st.qs[i];
      body.innerHTML = '';
      body.appendChild(el('div', {}, '<span class="tag">Question ' + (i + 1) + ' of ' + st.qs.length + '</span><span class="tag">' + esc(CA.TOPIC[q.kind]) + '</span>'));
      body.appendChild(el('p', { class: 'ask' }, esc(q.ask)));
      body.appendChild(el('div', {}, CA.showQ(q)));
      var row = el('div', { class: 'actions' });
      var input = el('input', { class: 'answer-in', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Answer to question ' + (i + 1), placeholder: q.format });
      input.value = st.typed[i];
      input.addEventListener('input', function () { st.typed[i] = input.value; drawBar(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (i < st.qs.length - 1) show(i + 1); } });
      row.appendChild(input);
      var prev = el('button', { type: 'button', class: 'btn secondary' }, 'Previous');
      prev.disabled = i === 0;
      prev.addEventListener('click', function () { show(i - 1); });
      var nxt = el('button', { type: 'button', class: 'btn secondary' }, 'Next');
      nxt.disabled = i === st.qs.length - 1;
      nxt.addEventListener('click', function () { show(i + 1); });
      var hand = el('button', { type: 'button', class: 'btn' }, 'Hand in');
      hand.addEventListener('click', function () {
        var blank = st.typed.filter(function (t) { return !t.trim(); }).length;
        if (blank && !hand.dataset.sure) { hand.dataset.sure = '1'; hand.textContent = blank + ' blank. Hand in anyway?'; return; }
        handIn(false);
      });
      row.appendChild(prev); row.appendChild(nxt); row.appendChild(hand);
      body.appendChild(row);
      CA.focusSoon(input);
      CA.reportHeight();
    }

    function handIn(timeUp) {
      if (!st || st.done) return;
      st.done = true;
      if (clock) clock.stop();
      var used = Math.min(minutes() * 60000, Date.now() - st.began), score = 0;
      var marks = st.qs.map(function (q, i) { var ok = !!st.typed[i].trim() && q.check(st.typed[i]); if (ok) score++; return ok; });
      st.qs.forEach(function (q, i) { log.add('Q' + (i + 1) + ' ' + CA.TOPIC[q.kind] + ' (answer ' + q.answer + '): typed ' + (st.typed[i].trim() || 'nothing'), marks[i]); });
      log.note('Contest score ' + score + ' of ' + st.qs.length + ', time used ' + CA.mmss(used) + '.');
      if (score >= PASS) log.finish();
      var at = Date.now(), d = new Date(at);
      var b = board();
      b.push({ score: score, used: used, at: at, when: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) });
      b.sort(function (x, y) { return y.score - x.score || x.used - y.used; });
      try { localStorage.setItem(BOARD_KEY, JSON.stringify(b.slice(0, 20))); } catch (e) {}
      var place = b.findIndex(function (r) { return r.at === at; }) + 1;
      bar.innerHTML = '<span class="pill">' + CA.ICON.trophy + ' Mini Contest</span><span class="spacer"></span>' + CA.chip('Score', score + ' of ' + st.qs.length) + CA.chip('Time used', CA.mmss(used));
      body.innerHTML = '<div class="gbar"><h2 style="margin:0">' + (timeUp ? 'Time is up!' : 'Handed in') + '</h2><span class="big-score" style="margin:0">' + score + ' of ' + st.qs.length + '</span>' +
        (place ? '<span>Place <b>' + place + '</b> on this computer\'s scoreboard.</span>' : '') + '</div>' +
        (score >= PASS ? CA.doneBanner(PASS + ' or more: contest passed.') : '<p class="small">Get ' + PASS + ' or more to pass.</p>');
      var grid = el('div', { class: 'after' }), list = el('div'), side = el('div');
      grid.appendChild(list); grid.appendChild(side); body.appendChild(grid);
      st.qs.forEach(function (q, i) {
        var d2 = el('details', { class: 'review' });
        d2.innerHTML = '<summary><span class="mark ' + (marks[i] ? 'ok">&#10003; ' : 'no">&#10007; ') + 'Question ' + (i + 1) + '</span>: ' + esc(CA.TOPIC[q.kind]) +
          '. You typed <b>' + esc(st.typed[i].trim() || 'nothing') + '</b>. Answer <b>' + esc(q.answer) + '</b>.</summary>' + CA.showQ(q) + CA.whyBox(q);
        d2.addEventListener('toggle', CA.reportHeight);
        list.appendChild(d2);
      });
      side.innerHTML = scoreTable(at);
      var again = el('button', { type: 'button', class: 'btn' }, CA.ICON.play + ' New contest');
      again.addEventListener('click', start);
      var row = el('div', { class: 'actions' }); row.appendChild(again); body.appendChild(row);
      CA.reportHeight();
    }

    intro();
  };
})();
