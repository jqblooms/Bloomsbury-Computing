// Data Bridge fact rounds (James 2026-11-26): a Fact Chain pack as the question source. Each Data Bridge round is one
// short Fact Chain activity (FactChain/js/rounds.js has the rules and marking, FactChain/js/logic.js the matching),
// one item per screen. A wrong typed answer goes to Haiku (op drillCheck, Drills/ai-check.js, 15 s) before it counts.
// A pass with any mistake runs again (Play: the same items in a new order; Learn: each missed item swapped for a new
// one) and only a clean pass finishes the round. Learn: "See the fact" shows the chain line, then hides it again.
// Packs load from ../FactChain/packs/ (registry index.js); a missing or incomplete pack is skipped.
(function () {
  'use strict';
  var FR = window.FactRounds, L = window.FactChainLogic, AI = window.DrillAiCheck;
  var INDEX = window.FACT_CHAIN_INDEX || { groups: {} };
  var loaded = {}, ready = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  function loadPack(id, v) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = '../FactChain/packs/' + encodeURIComponent(id) + '.js?v=' + encodeURIComponent(v);
      s.onload = function () {
        var p = (window.FACT_CHAIN_PACKS || {})[id];
        if (p && !L.packProblems(p).length) loaded[id] = p;
        resolve();
      };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }
  // Every pack in the registry, once. Resolves with the topic list for the picker.
  function init(v) {
    if (!FR || !L) return Promise.resolve([]);
    if (!ready) {
      var ids = [];
      Object.keys(INDEX.groups || {}).forEach(function (g) { INDEX.groups[g].packs.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
      ready = Promise.all(ids.map(function (id) { return loadPack(id, v); }));
    }
    return ready.then(function () { return FR.topics(INDEX, loaded); });
  }

  // ---------------------------------------------------------------- one fact round
  // ctx: { S, LV, learn, stub, save(), pay(n), hud(), finish({ right, total, stage }), roundLine }
  // S.exam for a fact round: { facts: true, n, topic, pack, stage, items, pass, pos, res, firstRight, missed, paid, pool, rate, intro }
  function start(ctx, topic) {
    var S = ctx.S, list = FR.packsFor(INDEX, loaded, topic);
    if (!list.length) return false;
    if (!S.exam || !S.exam.facts || S.exam.topic !== topic || !loaded[S.exam.pack]) {
      if (S.factSeed == null) S.factSeed = Math.floor(Math.random() * 1000);
      var pack = FR.packForRound(list, S.round, S.factSeed), stage = FR.stageFor(pack, S.round), r = FR.build(pack, stage);
      S.exam = { facts: true, n: S.round, topic: topic, pack: pack.id, stage: stage, items: r.items, pass: 1, pos: 0, res: [],
        firstRight: 0, missed: 0, paid: 0, pool: ctx.LV.pool, rate: FR.rate(ctx.LV.pool, FR.units(r.items)), intro: true };
      ctx.save();
    }
    draw(ctx);
    return true;
  }

  function pack(ctx) { return loaded[ctx.S.exam.pack]; }
  function head(ctx) {
    var r = ctx.S.exam, p = pack(ctx);
    return '<div class="bb-round-head"><h2>Fact round ' + r.n + '</h2>' +
      '<span class="bb-pill">' + esc(FR.NAMES[r.stage]) + '</span>' +
      '<span class="bb-pill">' + (r.pos + 1) + ' of ' + r.items.length + '</span>' +
      (r.pass > 1 ? '<span class="bb-pill is-warn">Try again: half coins for the ones you missed</span>' : '') +
      (ctx.learn ? '<span class="bb-pill bb-learn-tag">Learn mode</span>' : '') + '</div>' +
      '<p class="bb-label">' + esc(p.title) + '</p>';
  }

  function draw(ctx) {
    var r = ctx.S.exam, p = pack(ctx);
    if (r.intro) {
      ctx.screen.innerHTML = '<div class="bb-card bb-q bb-intro"><h2>Fact round ' + r.n + ': ' + esc(FR.NAMES[r.stage]) + '</h2>' +
        '<p class="bb-lead">' + esc(ctx.roundLine) + '</p>' +
        '<p class="bb-lead"><b>' + esc(p.title) + '.</b> ' + esc(FR.HOW[r.stage]) + '</p>' +
        '<p class="bb-lead">' + r.items.length + (r.items.length === 1 ? ' task' : ' tasks') + '. Get them all right to pass the round. All right pays ' + r.pool + ' coins.</p>' +
        (ctx.S.coins ? '<p class="bb-lead">You also have ' + ctx.S.coins + ' coins saved.</p>' : '') +
        (ctx.learn ? '<p class="bb-lead"><span class="bb-pill bb-learn-tag">Learn mode</span> Press See the fact to look at the fact before you answer. It is free.</p>' : '') +
        '<div class="bb-start-go"><button class="bc-btn bb-big" id="go">Start</button></div></div>';
      $('go').onclick = function () { r.intro = false; ctx.save(); draw(ctx); };
      $('go').focus();
      return;
    }
    if (r.pos >= r.items.length) { endPass(ctx); return; }
    item(ctx, r.items[r.pos]);
  }

  // The fact(s) for a wrong answer or for Learn's "See the fact", with any code lines.
  function factsHtml(lines) {
    return lines.map(function (c) { return '<p class="bb-fact-line">' + esc(c.text) + '</p>' + FR.codeHtml(c.code); }).join('');
  }
  function lineMarked(c) {
    var parts = L.blanks(c, Math.max(0, (c.gaps || []).length - 1)) || [{ type: 'text', text: c.text }];
    return '<p class="bb-fact-line">' + parts.map(function (x) { return x.type === 'gap' ? '<mark>' + esc(x.gap) + '</mark>' : esc(x.text); }).join('') + '</p>' + FR.codeHtml(c.code);
  }

  function item(ctx, it) {
    var r = ctx.S.exam, p = pack(ctx), body = '', order = null;
    if (it.kind === 'gap') {
      var c = p.chain[it.line], parts = L.blanks(c, it.k);
      if (parts) {
        body = '<p class="bb-label">' + esc(FR.HOW['gap' + Math.min(1, it.k)]) + '</p><p class="bb-fact">' + parts.map(function (x) {
          return x.type === 'gap' ? '<input class="bb-gap" data-gap="' + x.n + '" size="' + Math.max(6, x.gap.length + 2) + '" autocomplete="off" spellcheck="false" aria-label="Gap ' + (x.n + 1) + '">' : esc(x.text);
        }).join('') + '</p>' + FR.codeHtml(c.code);
      } else {
        var cue = FR.cueLine(p, it.line);
        body = c.ask ? '<p class="bb-label">Answer with the fact, in one sentence.</p><p class="bb-fact-line is-cue">' + esc(c.ask) + '</p>' +
          FR.codeHtml(c.code) + '<textarea class="bb-fact-in" id="fin" rows="2" autocomplete="off" spellcheck="false" aria-label="The fact"></textarea>' : (cue ? '<p class="bb-label">The fact before it:</p><p class="bb-fact-line is-cue">' + esc(cue.text) + '</p><p class="bb-label">Write the next fact.</p>' :
          '<p class="bb-label">Write the first fact about ' + esc(p.title) + '.</p>') +
          FR.codeHtml(c.code) + '<textarea class="bb-fact-in" id="fin" rows="2" autocomplete="off" spellcheck="false" aria-label="The fact"></textarea>';
      }
    } else if (it.kind === 'order') {
      order = it.start.map(function (k) { return it.lines[k]; });
      body = '<p class="bb-label">Put the facts in the right order. Use Up and Down.</p><ol class="bb-order" id="ord"></ol>';
    } else if (it.kind === 'spot') {
      var s = p.spot[it.i];
      body = '<p class="bb-label">One word or phrase is wrong. Type the right word.</p><p class="bb-fact">' + esc(s.wrong) + '</p>' + FR.codeHtml(s.code) +
        '<input class="bb-fact-in" id="fin" autocomplete="off" spellcheck="false" aria-label="The right word">';
    } else if (it.kind === 'quick') {
      var q = p.quick[it.i];
      body = '<p class="bb-fact">' + esc(q.q) + '</p>' + FR.codeHtml(q.code) +
        '<input class="bb-fact-in" id="fin" autocomplete="off" spellcheck="false" aria-label="Your answer">';
    } else if (it.kind === 'recall') {
      body = '<p class="bb-label">Write ' + it.need + ' facts about ' + esc(p.title) + ' from memory, one per line. Any ' + it.need + ' facts from the chain.</p>' +
        '<textarea class="bb-fact-in" id="fin" rows="' + (it.need + 1) + '" autocomplete="off" spellcheck="false" aria-label="Your facts"></textarea>';
    }
    var peek = ctx.learn && it.kind !== 'recall';
    ctx.screen.innerHTML = '<div class="bb-card bb-q" id="factForm">' + head(ctx) +
      (peek ? '<div class="bb-ex" id="peek"><button type="button" class="bc-btn is-outline bb-ex-btn" id="peekGo">See the fact</button></div>' : '') +
      '<div id="fbody">' + body + '</div>' +
      '<div class="bb-fb" id="ffb" hidden></div>' +
      '<div class="bb-q-actions"><span class="bb-label" id="fwait"></span><button class="bc-btn bb-big" id="fcheck">Check</button></div></div>';
    if (order) drawOrder();
    var first = ctx.screen.querySelector('#fbody input, #fbody textarea');
    if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 30);
    // Look, cover, write: the fact shows and the answer waits until it is hidden again.
    function openPeek() {
      $('fbody').hidden = true; $('fcheck').hidden = true;
      $('peek').innerHTML = '<div class="bb-ex-card"><div class="bb-ex-head"><b>The fact</b><span class="bb-ex-note">Read it. Then hide it and answer from memory.</span></div>' +
        factsHtml(FR.exampleLines(p, it).map(function (c) { return { text: c.text, code: c.code }; })) +
        '<div class="bb-q-actions"><button type="button" class="bc-btn" id="peekHide">Hide it and answer</button></div></div>';
      $('peekHide').onclick = function () {
        $('peek').innerHTML = '<button type="button" class="bc-btn is-outline bb-ex-btn" id="peekGo2">See the fact again</button>';
        $('fbody').hidden = false; $('fcheck').hidden = false;
        $('peekGo2').onclick = openPeek;
        if (first) try { first.focus(); } catch (e) {}
      };
    }
    if (peek) $('peekGo').onclick = openPeek;

    function drawOrder() {
      $('ord').innerHTML = order.map(function (ci, pos) {
        return '<li class="bb-order-item"><span>' + esc(p.chain[ci].text) + '</span><span class="bb-order-move">' +
          '<button type="button" class="bc-btn is-outline bb-mini" data-up="' + pos + '"' + (pos ? '' : ' disabled') + ' aria-label="Move up">Up</button>' +
          '<button type="button" class="bc-btn is-outline bb-mini" data-down="' + pos + '"' + (pos < order.length - 1 ? '' : ' disabled') + ' aria-label="Move down">Down</button></span></li>';
      }).join('');
      Array.prototype.forEach.call($('ord').querySelectorAll('[data-up],[data-down]'), function (b) {
        b.onclick = function () {
          var up = b.hasAttribute('data-up'), pos = Number(b.getAttribute(up ? 'data-up' : 'data-down')), to = pos + (up ? -1 : 1);
          var t = order[pos]; order[pos] = order[to]; order[to] = t;
          drawOrder();
          var nb = $('ord').querySelector('[data-' + (up ? 'up' : 'down') + '="' + to + '"]');
          if (nb && !nb.disabled) nb.focus();
        };
      });
    }

    $('fcheck').onclick = function () {
      var answer, kw, typed = '', units = it.w || 1, got = 0, rec = null, boxes = null;
      if (it.kind === 'gap' && it.k < 2) {
        var ins = ctx.screen.querySelectorAll('.bb-gap');
        if (Array.prototype.some.call(ins, function (b) { return !b.value.trim(); })) { needText('Fill every gap first.'); return; }
        answer = Array.prototype.map.call(ins, function (b) { return b.value; });
        var mg = FR.markGap(p, it, answer); kw = mg.right; boxes = mg.boxes;
        var k = 0;
        typed = (L.blanks(p.chain[it.line], it.k) || []).map(function (x) { return x.type === 'gap' ? answer[k++] : x.text; }).join('');
        Array.prototype.forEach.call(ins, function (b, j) { b.readOnly = true; b.classList.add(boxes[j] ? 'is-right' : 'is-wrong'); });
      } else if (it.kind === 'order') {
        kw = FR.markOrder(it, order).right;
        Array.prototype.forEach.call($('ord').querySelectorAll('button'), function (b) { b.disabled = true; });
      } else {
        var fin = $('fin');
        typed = fin.value.trim();
        if (!typed) { needText(it.kind === 'recall' ? 'Write some facts first.' : 'Type an answer first.'); return; }
        fin.readOnly = true;
        if (it.kind === 'gap') kw = FR.markGap(p, it, typed).right;
        else if (it.kind === 'spot') kw = FR.markSpot(p, it, typed);
        else if (it.kind === 'quick') kw = FR.markQuick(p, it, typed);
        else { rec = FR.markRecall(p, it, typed); kw = rec.count >= it.need; }
      }
      $('fcheck').disabled = true;
      if (peek && $('peek')) $('peek').hidden = true;
      var check;
      if (kw || it.kind === 'order') check = Promise.resolve(kw ? units : 0);
      else if (it.kind === 'recall') {
        var asks = FR.recallAiBodies(p, it, rec), found = rec.found.slice();
        if (asks.length) $('fwait').textContent = 'Checking...';
        check = Promise.all(asks.map(function (a) { return ask(ctx, a.body).then(function (ok) { if (ok && found.indexOf(a.line) < 0) found.push(a.line); }); }))
          .then(function () { rec.found = found; return Math.min(it.need, found.length); });
      } else {
        $('fwait').textContent = 'Checking...';
        check = ask(ctx, FR.aiBody(p, it, typed)).then(function (ok) { return ok ? units : 0; });
      }
      check.then(function (n) {
        got = n;
        $('fwait').textContent = '';
        var right = got >= units;
        r.res[r.pos] = got;
        var pay = 0;
        if (r.pass === 1 && got) { pay = Math.min(Math.max(0, r.pool - r.paid), FR.firstPay(r.rate, got)); }
        if (pay) { r.paid += pay; ctx.pay(pay); }
        r.pos++;
        ctx.save();
        feedback(right, got, pay, rec, boxes);
      });
    };
    function needText(t) { var f = $('ffb'); f.hidden = false; f.className = 'bb-fb is-part'; f.textContent = t; }

    function feedback(right, got, pay, rec, boxes) {
      var f = $('ffb'), h;
      f.hidden = false;
      f.className = 'bb-fb ' + (right ? 'is-good' : got ? 'is-part' : 'is-bad');
      h = '<div class="bb-fb-head"><b>' + (right ? 'Right.' : it.kind === 'recall' ? 'You found ' + got + ' of ' + it.need + ' facts.' : 'Not quite.') + '</b>' +
        (pay ? '<span class="bb-coin-pop">+' + pay + ' coins</span>' : '') + '</div>';
      if (it.kind === 'gap') h += right ? '' : '<p>The fact is:</p>' + lineMarked(p.chain[it.line]);
      else if (it.kind === 'order') h += right ? '' : '<p>This is the right order:</p><ol class="bb-fact-list">' + it.lines.map(function (i) { return '<li>' + esc(p.chain[i].text) + '</li>'; }).join('') + '</ol>';
      else if (it.kind === 'spot') h += '<p>' + esc(p.spot[it.i].model || p.spot[it.i].fix[0]) + '</p>';
      else if (it.kind === 'quick') h += '<p>' + esc(p.quick[it.i].model || p.quick[it.i].accept[0]) + '</p>';
      else if (it.kind === 'recall') {
        h += rec.found.length ? '<p>Facts you wrote:</p><ul class="bb-fact-list">' + rec.found.map(function (i) { return '<li>' + esc(p.chain[i].text) + '</li>'; }).join('') + '</ul>' : '';
        if (!right) h += '<p>Some facts from the chain:</p><ul class="bb-fact-list">' + p.chain.filter(function (c, i) { return rec.found.indexOf(i) < 0; }).slice(0, 4).map(function (c) { return '<li>' + esc(c.text) + '</li>'; }).join('') + '</ul>';
      }
      if (!right && ctx.learn) h += '<p>You will get a new one like this when you try the round again.</p>';
      f.innerHTML = h;
      $('fcheck').hidden = true;
      var acts = $('fcheck').parentNode;
      acts.insertAdjacentHTML('beforeend', '<button class="bc-btn bb-big" id="fnext">Next</button>');
      $('fnext').onclick = function () { draw(ctx); };
      try { $('fnext').focus({ preventScroll: true }); } catch (e) {}
    }
  }

  // Haiku's second opinion on a typed answer the keywords rejected (true only for a Haiku "correct").
  function ask(ctx, body) {
    if (!body) return Promise.resolve(false);
    if (ctx.stub) return new Promise(function (res) { setTimeout(function () { res(/right/i.test(body.answer)); }, 700); });
    if (!AI) return Promise.resolve(false);
    return AI.ask(body);
  }

  function endPass(ctx) {
    var r = ctx.S.exam, p = pack(ctx), total = FR.units(r.items);
    var got = r.items.reduce(function (a, it, i) { return a + Math.min(it.w || 1, r.res[i] || 0); }, 0);
    if (r.pass === 1) { r.firstRight = got; r.missed = total - got; }
    if (got >= total) {
      var pay = r.pass > 1 ? Math.min(Math.max(0, r.pool - r.paid), FR.redoPay(r.rate, r.missed)) : 0;
      if (pay) { r.paid += pay; ctx.pay(pay); }
      ctx.save();
      ctx.screen.innerHTML = '<div class="bb-card bb-q bb-intro"><h2>Round passed</h2>' +
        '<p class="bb-lead">' + (r.pass === 1 ? 'Every answer was right first time.' : 'Every answer was right this time.') + '</p>' +
        '<p class="bb-lead">This round: +' + r.paid + ' coins' + (pay ? ' (' + pay + ' for the try again)' : '') + '.</p>' +
        '<div class="bb-start-go"><button class="bc-btn bb-big" id="toBuild">Build the bridge</button></div></div>';
      $('toBuild').onclick = function () { ctx.finish({ right: r.firstRight, total: total, stage: r.stage, paid: r.paid }); };
      $('toBuild').focus();
      return;
    }
    // A mistake never completes a round: run it again.
    var wrong = total - got;
    ctx.screen.innerHTML = '<div class="bb-card bb-q bb-intro"><h2>Try this round again</h2>' +
      '<p class="bb-lead">You missed ' + wrong + '. A round only counts with no mistakes.</p>' +
      '<p class="bb-lead">' + (ctx.learn ? 'The ones you missed are now new ones like them.' : 'You have seen the right answers. Try them again now.') +
      (r.pass === 1 && r.missed ? ' Getting them right pays half coins.' : '') + '</p>' +
      '<div class="bb-start-go"><button class="bc-btn bb-big" id="again">Try again</button></div></div>';
    $('again').onclick = function () {
      if (ctx.learn) {
        var keep = { items: r.items };
        r.items = r.items.map(function (it, i) { return (r.res[i] || 0) >= (it.w || 1) ? it : FR.swap(p, keep, i); });
        r.items = L.shuffle(r.items);
      } else r.items = FR.again(r);
      r.pass++; r.pos = 0; r.res = [];
      ctx.save(); draw(ctx);
    };
    $('again').focus();
  }

  window.BBFacts = { init: init, start: start, isFacts: function (t) { return !!(FR && FR.isFacts(t)); },
    packsFor: function (t) { return FR ? FR.packsFor(INDEX, loaded, t) : []; }, loaded: loaded };
})();
