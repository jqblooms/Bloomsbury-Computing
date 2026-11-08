// Which Data Type? (?activity=types). A line or a short program stores a value in a variable. Pick its data type
// first, then Python runs it and shows the type it really is. Level 1: values. Level 2: calculations and joins.
// Level 3: short programs (the type at the end). A wrong pick shows the reason and the round does not count.
(function () {
  'use strict';
  var el = PL.el, esc = PL.esc, B = PLBANK;
  var LEVELS = [
    { gen: 'value', size: 6, need: 1, ask: 'What data type is stored in <code>{v}</code>?' },
    { gen: 'calc', size: 5, need: 2, ask: 'What data type is stored in <code>{v}</code>?' },
    { gen: 'program', size: 4, need: 1, ask: 'What data type does <code>{v}</code> hold at the end?' }
  ];
  var OPTS = [['int', 'Integer', 'int'], ['float', 'Real', 'float'], ['str', 'String', 'str']];

  PL.activities.types = function (host) {
    var lead = el('p', { class: 'task-q' }), qn = el('p', { class: 'menu-q' }), box = el('div'), ask = el('div', { class: 'choices' });
    var shown = el('div'), fb = el('div', { class: 'feedback', role: 'status' }), bar = el('div', { class: 'actions' });
    [lead, qn, box, ask, shown, fb, bar].forEach(function (n) { host.appendChild(n); });
    var level = Math.max(0, Math.min(LEVELS.length - 1, (+PL.query.get('level') || 1) - 1)), upto = Math.min(LEVELS.length, +PL.query.get('upto') || LEVELS.length);
    var clean = 0, spoiled = false, inRound = 0, seen = {}, item = null, log = PL.results('which data type');
    PL.peek = function () { return { level: level, clean: clean, spoiled: spoiled, inRound: inRound, item: item }; };

    function header() { lead.innerHTML = PL.levelBar(level, upto, clean, LEVELS[level].need, spoiled) + '<span class="score">Question ' + (inRound + 1) + ' of ' + LEVELS[level].size + '</span>'; }
    function next() {
      var L = LEVELS[level];
      for (var i = 0; i < 40; i++) { item = B.TYPES[L.gen](); if (!seen[item.code]) break; }
      seen[item.code] = 1;
      header();
      qn.innerHTML = 'Predict first. ' + L.ask.replace('{v}', esc(item.name));
      box.innerHTML = PL.codeBox(item.code);
      shown.innerHTML = ''; PL.say(fb, '', ''); bar.innerHTML = ''; ask.innerHTML = '';
      OPTS.forEach(function (o) {
        var b = el('button', { type: 'button', class: 'choice', 'data-t': o[0] }, '<b>' + o[1] + '</b> <span class="small">(' + o[2] + ')</span>');
        b.addEventListener('click', function () { answer(o[0], b); });
        ask.appendChild(b);
      });
      PL.reportHeight();
    }
    function answer(t, btn) {
      Array.prototype.forEach.call(ask.querySelectorAll('button'), function (b) { b.disabled = true; });
      PL.run(item.code + '\nprint(type(' + item.name + ').__name__)', []).then(function (r) {
        var real = r.out[r.out.length - 1], right = real === t;
        btn.classList.add(right ? 'good' : 'bad');
        if (!right) { var g = ask.querySelector('[data-t="' + real + '"]'); if (g) g.classList.add('good'); spoiled = true; }
        shown.innerHTML = '<div class="screen"><div class="screen-title">Python ran it and asked for the type</div><div class="scr-out">' + esc(real) + ' <span class="dim">(' + (PL.TYPE_NAME[real] || real) + ')</span></div></div>';
        log.add('level ' + (level + 1) + ', ' + item.code.replace(/\n/g, '; ') + ': picked ' + t + ', it is ' + real, right);
        PL.say(fb, (right ? '<b>Right.</b> ' : '<b>Not this time.</b> It is ' + (PL.TYPE_NAME[real] || real) + '. ') + esc(B.TYPE_WHY[item.why] || ''), right ? '' : 'bad');
        inRound++;
        var L = LEVELS[level], label = 'Next question';
        if (inRound >= L.size) {
          if (!spoiled) clean++;
          var msg = spoiled ? 'That round had a mistake, so it does not count. Try a new round.' : 'A round with no mistakes.';
          inRound = 0; spoiled = false; seen = {};
          if (clean >= L.need) {
            if (level + 1 >= upto) { log.finish(); inRound = L.size - 1; header(); bar.innerHTML = PL.doneBanner('Done: you can tell Integer, Real and String apart.'); PL.reportHeight(); return; }
            clean = 0;
            level++; msg += ' <b>Level ' + level + ' done.</b>'; label = 'Start level ' + (level + 1);
          } else label = 'Start a new round';
          PL.say(fb, fb.innerHTML + '<br>' + msg, fb.className.indexOf('bad') >= 0 ? 'bad' : '');
        }
        header();
        var nb = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + label + '</span>' + PL.ICON.next);
        nb.addEventListener('click', next);
        bar.appendChild(nb);
        PL.reportHeight();
      });
    }
    next();
  };
})();
