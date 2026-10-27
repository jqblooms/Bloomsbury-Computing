// Choose the data (?activity=pick). A model and its rule; eight data cards. Sort each card into Needed or Not
// needed, then run the model with the Needed cards: a missing card is a blank (0), a card that sounds right but is
// old or about something else gives the rule the wrong value. Two runs per model: the first sends wrong cards back
// to look at again, the second shows where each belongs. A model is passed only with every card right on the first
// run, NEED in a row (James 2026-10-27). Three models passed, each harder: 2 or 3 needed, then 3 with one card that sounds right, then 4 with one.
(function () {
  'use strict';
  var el = ML.el, esc = ML.esc, B = MLBANK;
  var LEVELS = [
    function (m) { return m.data.length <= 3; },
    function (m) { return m.data.length === 3; },
    function (m) { return m.data.length === 4; }
  ];
  var NEED = 3;

  ML.activities.pick = function (host) {
    var lead = el('p', { class: 'task-q' }), top = el('div'), board = el('div', { class: 'board' }), run = el('div', { class: 'run' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    var help = ML.helpButton(host, 'Read the rule. Find each thing it uses: each one is a card you need. A card is needed only if the rule uses it. ' +
      'Some cards sound right but are old, or about something else: the rule would get the wrong number.');
    var head = el('div', { class: 'head-row' }); head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, top, board, bar, fb].forEach(function (n) { host.appendChild(n); });
    var wins = 0, tries = 0, lastId = null, S, log = ML.results('choose the data a model needs');
    ML.peek = function () { return { S: S, wins: wins }; };

    function start() {
      tries++;
      var level = Math.min(wins, 2);
      // The school trip model is on two slides before this one, so it is never the first model.
      var options = B.MODELS.filter(LEVELS[level]).filter(function (m) { return m.id !== lastId && !(level === 0 && m.id === 'trip'); });
      var m = B.pick(options); lastId = m.id;
      var v = B.values(m), cards = [];
      m.data.forEach(function (d) { cards.push({ text: d.text, kind: 'need', slot: d.slot, value: v[d.slot] }); });
      if (level > 0) { var n = B.pick(m.near); cards.push({ text: n.text, kind: 'near', slot: n.slot, value: B.nearValue(m, n, v), why: n.why }); }
      B.shuffle(m.extra).slice(0, 8 - cards.length).forEach(function (t) { cards.push({ text: t, kind: 'extra' }); });
      cards = B.shuffle(cards).map(function (c, i) { c.id = 'c' + i; return c; });
      S = { m: m, v: v, cards: cards, at: {}, look: {}, runs: 0, firstWrong: 0, over: false, ran: null };
      lead.innerHTML = '<span class="round">Model ' + (wins + 1) + ' of ' + NEED + '</span>' +
        'Which data does this model need? Put each card in <b>Needed</b> or <b>Not needed</b>. Then run the model.';
      top.innerHTML = ML.modelBox(m);
      run.innerHTML = '';
      ML.say(fb, '', '');
      help.hide();
      draw();
    }
    // After a run, each Needed card shows what the rule did with it: its value, or "not used".
    function card(c, show) {
      var cls = S.look[c.id] ? ' hint' : '', tag = '';
      if (show) cls = S.at[c.id] === (c.kind === 'need' ? 'need' : 'not') ? ' good' : ' bad';
      if (S.ran && S.at[c.id] === 'need') tag = S.ran.used[c.slot] === c ? '<span class="tag">= ' + c.value + '</span>' : '<span class="tag dim">not used</span>';
      return '<button type="button" class="chip' + cls + '" data-item="' + c.id + '"' + (S.over ? ' disabled' : '') + '>' + esc(c.text) + tag + '</button>';
    }
    function draw(show) {
      var col = function (place, title, more) {
        return '<div class="bin" data-place="' + place + '"><b class="bin-name">' + title + '</b>' +
          S.cards.filter(function (c) { return S.at[c.id] === place; }).map(function (c) { return card(c, show); }).join('') + (more || '') + '</div>';
      };
      var free = S.cards.filter(function (c) { return !S.at[c.id]; });
      board.innerHTML = '<div class="pool' + (free.length ? '' : ' empty') + '" data-place="pool"><span class="pool-label">Data cards</span>' +
        (free.length ? free.map(function (c) { return card(c, show); }).join('') : '<span class="slot-empty">All sorted.</span>') + '</div><div class="pick-grid">' +
        col('need', 'Needed', S.ran ? S.m.data.filter(function (d) { return !S.ran.used[d.slot]; }).map(function (d) {
          return '<span class="ghost-chip">' + esc(d.text) + ' <span class="tag bad">blank</span></span>';
        }).join('') : '') + col('not', 'Not needed') + '</div>';
      bar.innerHTML = '';
      if (!S.over) {
        var go = el('button', { type: 'button', class: 'btn' }, ML.ICON.play + '<span>Run the model</span>');
        go.disabled = free.length > 0;
        go.addEventListener('click', doRun);
        bar.appendChild(go);
        bar.appendChild(el('span', { class: 'small' }, free.length ? 'Sort every card first.' : 'Runs left: ' + (2 - S.runs)));
      }
      bar.appendChild(run);
      ML.reportHeight();
    }
    ML.placer(board, function (id, place) {
      if (S.over) return;
      S.at[id] = place === 'pool' ? null : place;
      delete S.look[id];
      S.ran = null;
      draw();
    }, function () { return !S.over; });

    // What the rule gets from the Needed cards: a real card's value, else a near card's value, else blank.
    function given() {
      var g = {}, used = {};
      S.m.data.forEach(function (d) {
        var real = S.cards.filter(function (c) { return c.kind === 'need' && c.slot === d.slot && S.at[c.id] === 'need'; })[0];
        var near = S.cards.filter(function (c) { return c.kind === 'near' && c.slot === d.slot && S.at[c.id] === 'need'; })[0];
        var c = real || near;
        g[d.slot] = c ? c.value : null;
        used[d.slot] = c || null;
      });
      return { g: g, used: used };
    }
    function doRun() {
      S.runs++;
      var G = given(), mine = B.predict(S.m, G.g), real = S.m.calc(S.v);
      var wrong = S.cards.filter(function (c) { return S.at[c.id] !== (c.kind === 'need' ? 'need' : 'not'); });
      if (S.runs === 1) S.firstWrong = wrong.length;
      S.ran = G;
      run.innerHTML = '<div class="run-out wide"><div class="out-line"><span>Your model predicts</span><b>' + esc(ML.fmt(mine, S.m.unit)) + '</b></div>' +
        '<div class="out-line ' + (mine === real ? 'good' : 'bad') + '"><span>With the right data</span><b>' + esc(ML.fmt(real, S.m.unit)) + '</b></div></div>';
      if (!wrong.length) {
        var pass = S.firstWrong === 0;
        S.over = true; draw(true);
        log.add(S.m.name + ', ' + S.firstWrong + ' of 8 cards wrong on the first run', pass);
        if (pass) wins++; else wins = 0;
        ML.say(fb, pass ? '<b>Right.</b> ' + 'Every card right on the first run.' + ' The rule uses exactly these cards.' :
          '<b>All right now</b>, but ' + S.firstWrong + ' cards were wrong on the first run. This model does not count, and the count starts again: you need every card right on the first run.', pass ? '' : 'bad');
        return next();
      }
      if (S.runs === 1) {
        wrong.forEach(function (c) { S.at[c.id] = null; S.look[c.id] = true; });
        draw();
        ML.say(fb, wrong.length + ' card' + (wrong.length === 1 ? ' was' : 's were') + ' in the wrong place and went back. ' +
          (mine === real ? '' : 'Look at what the rule used: a blank or a wrong number gives a wrong prediction. ') + 'For each card ask: does the rule use it?', 'bad');
        return;
      }
      S.over = true;
      wrong.forEach(function (c) { S.at[c.id] = c.kind === 'need' ? 'need' : 'not'; });
      draw(true);
      wins = 0;
      log.add(S.m.name + ', ' + S.firstWrong + ' of 8 cards wrong on the first run, ' + wrong.length + ' still wrong on the second', false);
      ML.say(fb, '<b>' + wrong.length + ' still wrong</b> (now moved to the right place):<br>' + wrong.map(function (c) {
        return '"' + esc(c.text) + '": ' + (c.kind === 'need' ? 'needed. The rule uses it.' : c.kind === 'near' ? 'not needed. ' + esc(c.why) : 'not needed. The rule never uses it.');
      }).join('<br>'), 'bad');
      next();
    }
    function next() {
      bar.innerHTML = '';
      if (wins >= NEED) { log.finish(); bar.innerHTML = ML.doneBanner('Done: three models, each with exactly the data its rule needs.'); bar.appendChild(run); ML.reportHeight(); return; }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next model</span>' + ML.ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      bar.appendChild(el('span', { class: 'small' }, 'Models in a row with no mistakes: ' + wins + ' of ' + NEED));
      bar.appendChild(run);
      ML.reportHeight();
    }
    start();
  };
})();
