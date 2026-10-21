// What if? (?activity=run). A model with its data and its prediction. One data item changes: left blank (counts
// as 0), typed wrong, swapped for data that sounds right, or data the rule never uses is added or taken away.
// Predict first, then run it. Part 1: higher, lower or the same, three right in a row. Part 2: type the new
// prediction, two right in a row. A wrong answer starts the run of right answers again; every round has new values.
(function () {
  'use strict';
  var el = ML.el, esc = ML.esc, B = MLBANK;
  var NEED = [3, 2];
  function bold(s) { return '<b>' + esc(s) + '</b>'; }
  var KIND = { blank: 'left blank', typo: 'typed wrong', double: 'doubled', near: 'wrong data', 'extra-add': 'unused data added', 'extra-gone': 'unused data left out' };

  ML.activities.run = function (host) {
    var lead = el('p', { class: 'task-q' }), top = el('div'), what = el('div', { class: 'brief big' }), ask = el('div', { class: 'ask' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    var help = ML.helpButton(host, function () {
      return part === 0 ? 'Find the data item that changes. Does the rule use it? If not, nothing changes. If it does, is the number now bigger or smaller, and does the rule add it, take it away or multiply by it?'
        : 'Copy the rule. Put the new number in place of the old one, then work it out in order.';
    });
    var head = el('div', { class: 'head-row' }); head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, top, what, ask, bar, fb].forEach(function (n) { host.appendChild(n); });
    var part = 0, streak = 0, R = null, lastId = null, answered = false, log = ML.results('predict what changes when the data changes');
    ML.peek = function () { return { R: R, part: part, streak: streak }; };

    function start() {
      R = B.whatIf(part, lastId, bold); lastId = R.m.id; answered = false;
      lead.innerHTML = '<span class="round">Part ' + (part + 1) + ' of 2</span><span class="score">Right in a row: <b>' + streak + '</b> of ' + NEED[part] + ' needed</span>';
      top.innerHTML = ML.modelBox(R.m, '<div class="run-row">' + ML.dataTable(R.m.data.map(function (x) { return [x.text, R.v[x.slot]]; })) + '<div class="run-out"><div class="out-line"><span>It predicts</span><b>' + esc(ML.fmt(R.old, R.m.unit)) + '</b></div></div></div>');
      what.innerHTML = '<b>What if?</b> ' + R.text;
      ML.say(fb, '', '');
      help.hide();
      bar.innerHTML = '';
      if (part === 0) {
        ask.innerHTML = '<span class="menu-q">Predict first: will the prediction be higher, lower or the same?</span>';
        ['higher', 'lower', 'same'].forEach(function (k) {
          var b = el('button', { type: 'button', class: 'choice', 'data-v': k }, k === 'same' ? 'The same' : k.charAt(0).toUpperCase() + k.slice(1));
          b.addEventListener('click', function () { answer(k, b); });
          ask.appendChild(b);
        });
      } else {
        ask.innerHTML = '<label class="menu-q" for="ml-num">Predict first: what does the model predict now?</label>';
        var input = el('input', { id: 'ml-num', class: 'num-in', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'The new prediction' });
        var go = el('button', { type: 'button', class: 'btn' }, ML.ICON.play + '<span>Run it</span>');
        go.addEventListener('click', function () {
          var m = /^\s*(-?[\d,]+)\s*([a-z%]+)?\s*\.?\s*$/i.exec(input.value);
          if (!m) { ML.say(fb, 'Type a number.', 'hint'); input.focus(); return; }
          answer(Number(m[1].replace(/,/g, '')), go, input);
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
        ask.appendChild(input); ask.appendChild(go);
      }
      ML.reportHeight();
    }
    function answer(given, btn, input) {
      if (answered) return;
      answered = true;
      var right = part === 0 ? given === R.dir : given === R.now;
      Array.prototype.forEach.call(ask.querySelectorAll('button, input'), function (b) { b.disabled = true; });
      if (part === 0) { btn.classList.add(right ? 'good' : 'bad'); }
      // Run it: the new data and the new prediction, worked out.
      var rows = R.m.data.map(function (x) { return [x.text, R.nv[x.slot], x.slot === R.changed ? 'changed' : '']; });
      top.innerHTML = ML.modelBox(R.m, '<div class="run-row">' + ML.dataTable(rows) + '<div class="run-out"><div class="out-line"><span>It predicted</span><b>' + esc(ML.fmt(R.old, R.m.unit)) + '</b></div>' +
        '<div class="out-line ' + (right ? 'good' : 'bad') + '"><span>Now it predicts</span><b>' + esc(ML.fmt(R.now, R.m.unit)) + '</b></div>' +
        '<p class="small work">' + esc(R.m.work(R.nv)) + ' = ' + R.now + '</p></div></div>');
      streak = right ? streak + 1 : 0;
      log.add('part ' + (part + 1) + ', ' + R.m.name + ', ' + KIND[R.kind] + ': said ' + given + ', it was ' + (part === 0 ? R.dir : R.now), right);
      ML.say(fb, (right ? '<b>Right.</b> ' : '<b>Not this time.</b> It is ' + (part === 0 ? (R.dir === 'same' ? 'the same' : R.dir) : R.now) + '. ') + esc(R.why), right ? '' : 'bad');
      bar.innerHTML = '';
      if (streak >= NEED[part]) {
        if (part === 1) { log.finish(); bar.innerHTML = ML.doneBanner('Done: you can predict what changing the data does.'); ML.reportHeight(); return; }
        part = 1; streak = 0;
        ML.say(fb, fb.innerHTML + '<br><b>Part 1 done.</b> Now work out the new prediction.', '');
      }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next what if</span>' + ML.ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      ML.reportHeight();
    }
    start();
  };
})();
