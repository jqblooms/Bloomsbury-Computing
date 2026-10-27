// Design the data (?activity=design): the hardest task. A user asks a question in their own words; no rule is
// shown. From ten data items, choose what the model must collect: some sound right but are old or about another
// time or place, some are never used. Run the model on the real day. The first run says only how many items are
// wrong; the second names them. A brief is passed only with nothing wrong on the first run
// and the why question right, NEED in a row (James 2026-10-27). Two briefs passed.
(function () {
  'use strict';
  var el = ML.el, esc = ML.esc, B = MLBANK;
  var NEED = 2;
  var WHY_NEAR = { right: 'It is about another time or place, so the answer is wrong.',
    wrong: ['It is old, and a computer cannot store old data.', 'It is the same number, so it changes nothing.', 'It is personal, so nobody may collect it.'] };
  var WHY_EXTRA = { right: 'It does not change the answer, so it wastes time.',
    wrong: ['It is too hard to collect before the day.', 'It would make the answer far too big.', 'A computer cannot store this kind of data.'] };

  ML.activities.design = function (host) {
    var lead = el('p', { class: 'task-q' }), top = el('div'), board = el('div', { class: 'board' }), run = el('div', { class: 'run' }), ask = el('div', { class: 'ask' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    var help = ML.helpButton(host, 'Underline each thing the user says changes the answer. Collect one item for each. ' +
      'Check the time and place of each item: is it about today, this place and this event? Leave out anything that does not change the answer.');
    var head = el('div', { class: 'head-row' }); head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, top, ask, board, run, bar, fb].forEach(function (n) { host.appendChild(n); });
    var wins = 0, done = [], S, log = ML.results('design the data an application needs (hardest)');
    ML.peek = function () { return { S: S, wins: wins }; };

    function start() {
      var left = B.BRIEFS.filter(function (b) { return done.indexOf(b.id) < 0 && (!S || b.id !== S.b.id); });
      if (!left.length) { done = []; left = B.BRIEFS.filter(function (b) { return !S || b.id !== S.b.id; }); }
      var b = B.pick(left), v = {};
      b.data.forEach(function (d) { v[d.slot] = B.between(d.min, d.max, d.step); });
      var items = b.data.map(function (d) { return { text: d.text, kind: 'need', slot: d.slot, value: v[d.slot] }; });
      b.near.forEach(function (n) { items.push({ text: n.text, kind: 'near', slot: n.slot, value: B.briefNear(b, n, v), why: n.why }); });
      B.shuffle(b.extra).slice(0, 10 - items.length).forEach(function (t) { items.push({ text: t, kind: 'extra' }); });
      items = B.shuffle(items).map(function (x, i) { x.id = 'd' + i; return x; });
      S = { b: b, v: v, items: items, on: {}, runs: 0, firstWrong: 0, over: false };
      lead.innerHTML = '<span class="round">Brief ' + (wins + 1) + ' of ' + NEED + '</span>Choose the data the model must collect to answer the question. Then run it on the real day.';
      top.innerHTML = '<div class="brief big"><b>' + esc(b.who) + ' asks:</b> "' + esc(b.ask) + '"<br>' + esc(b.says) + '</div>';
      run.innerHTML = ''; ask.innerHTML = '';
      ML.say(fb, '', '');
      help.hide();
      draw();
    }
    function draw(show) {
      board.innerHTML = '<span class="pool-label">Data to collect: tap to choose</span><div class="toggle-grid">' + S.items.map(function (x) {
        var cls = S.on[x.id] ? ' picked' : '';
        if (show) cls += (!!S.on[x.id] === (x.kind === 'need')) ? ' good' : ' bad';
        return '<button type="button" class="chip toggle' + cls + '" data-id="' + x.id + '" aria-pressed="' + !!S.on[x.id] + '"' + (S.over ? ' disabled' : '') + '>' +
          '<span class="tick" aria-hidden="true">' + (S.on[x.id] ? ML.ICON.check : '') + '</span>' + esc(x.text) + '</button>';
      }).join('') + '</div>';
      bar.innerHTML = '';
      if (!S.over) {
        var go = el('button', { type: 'button', class: 'btn' }, ML.ICON.play + '<span>Run it on the real day</span>');
        go.disabled = !Object.keys(S.on).some(function (k) { return S.on[k]; });
        go.addEventListener('click', doRun);
        bar.appendChild(go);
        bar.appendChild(el('span', { class: 'small' }, 'Runs left: ' + (2 - S.runs)));
      }
      ML.reportHeight();
    }
    board.addEventListener('click', function (e) {
      var t = e.target.closest('[data-id]');
      if (!t || S.over) return;
      var id = t.getAttribute('data-id');
      S.on[id] = !S.on[id];
      draw();
    });

    function doRun() {
      S.runs++;
      var g = {}, rows = [];
      S.b.data.forEach(function (d) {
        var real = S.items.filter(function (x) { return x.kind === 'need' && x.slot === d.slot && S.on[x.id]; })[0];
        var near = S.items.filter(function (x) { return x.kind === 'near' && x.slot === d.slot && S.on[x.id]; })[0];
        var c = real || near;
        g[d.slot] = c ? c.value : null;
      });
      var vals = {}; S.b.data.forEach(function (d) { vals[d.slot] = g[d.slot] == null ? 0 : g[d.slot]; });
      var mine = S.b.calc(vals), real = S.b.calc(S.v);
      var missing = S.items.filter(function (x) { return x.kind === 'need' && !S.on[x.id]; });
      var wrongData = S.items.filter(function (x) { return x.kind === 'near' && S.on[x.id]; });
      var unused = S.items.filter(function (x) { return x.kind === 'extra' && S.on[x.id]; });
      var errors = missing.length + wrongData.length + unused.length;
      if (S.runs === 1) S.firstWrong = errors;
      run.innerHTML = '<div class="run-out wide"><div class="out-line"><span>Your model says</span><b>' + esc(ML.fmt(mine, S.b.unit)) + '</b></div>' +
        '<div class="out-line ' + (mine === real ? 'good' : 'bad') + '"><span>On the real day</span><b>' + esc(ML.fmt(real, S.b.unit)) + '</b></div>' +
        (S.runs === 1 && errors ? '<p class="small">Missing, or the wrong data for the question: <b>' + (missing.length + wrongData.length) + '</b>. Collected but never used: <b>' + unused.length + '</b>.</p>' : '') + '</div>';
      if (!errors) {
        S.over = true; draw(true);
        run.innerHTML = '';
        ML.say(fb, '<b>Your model matches the real day: ' + esc(ML.fmt(real, S.b.unit)) + '.</b> One last question.', '');
        return askWhy();
      }
      if (S.runs === 1) {
        draw();
        ML.say(fb, 'Not right yet. The counts say what kind of mistake, not which item. Read the brief again, then run it once more.', 'bad');
        return;
      }
      S.over = true; draw(true);
      wins = 0;
      log.add(S.b.ask + ' ' + S.firstWrong + ' wrong on the first run, ' + errors + ' on the second', false);
      ML.say(fb, '<b>Still ' + errors + ' wrong</b> (red):<br>' + missing.map(function (x) { return '"' + esc(x.text) + '": needed. The brief says it changes the answer.'; })
        .concat(wrongData.map(function (x) { return '"' + esc(x.text) + '": the wrong data. ' + esc(x.why); }))
        .concat(unused.map(function (x) { return '"' + esc(x.text) + '": never used. It does not change the answer.'; })).join('<br>') +
        '<br>Try a new brief.', 'bad');
      next();
    }
    function askWhy() {
      var useNear = B.rand(2) === 0;
      var item = useNear ? B.pick(S.items.filter(function (x) { return x.kind === 'near'; })) : B.pick(S.items.filter(function (x) { return x.kind === 'extra'; }));
      var w = useNear ? WHY_NEAR : WHY_EXTRA;
      top.innerHTML = '';
      ask.innerHTML = '<p class="menu-q">Why should the model not collect "' + esc(item.text) + '"? One try.</p>';
      var box = el('div', { class: 'choices col' });
      B.shuffle([w.right].concat(w.wrong)).forEach(function (o) {
        var b = el('button', { type: 'button', class: 'choice' }, esc(o));
        b.addEventListener('click', function () {
          var ok = o === w.right, pass = ok && S.firstWrong === 0;
          Array.prototype.forEach.call(box.querySelectorAll('button'), function (x) { x.disabled = true; if (x.textContent === w.right) x.classList.add('good'); });
          if (!ok) b.classList.add('bad');
          if (pass) { wins++; done.push(S.b.id); } else wins = 0;
          log.add(S.b.ask + ' ' + S.firstWrong + ' wrong on the first run, why ' + (ok ? 'right' : 'wrong'), pass);
          ML.say(fb, (ok ? '<b>Right.</b> ' : '<b>Not that one.</b> The green answer is right. ') + (useNear ? esc(item.why) : 'The answer stays the same without it.') +
            (pass ? '' : ' This brief does not count: it needs nothing wrong on the first run and the why right. The count starts again.'), pass ? '' : 'bad');
          next();
        });
        box.appendChild(b);
      });
      ask.appendChild(box);
      ML.reportHeight();
    }
    function next() {
      bar.innerHTML = '';
      if (wins >= NEED) { log.finish(); bar.innerHTML = ML.doneBanner('Done: you designed the data for two applications.'); ML.reportHeight(); return; }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next brief</span>' + ML.ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      bar.appendChild(el('span', { class: 'small' }, 'Briefs in a row with no mistakes: ' + wins + ' of ' + NEED));
      ML.reportHeight();
    }
    start();
  };
})();
