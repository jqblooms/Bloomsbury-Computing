// Loop Tracer: picks the mode from the address (?mode=trace|predict|mock), or shows the menu.
(function () {
  'use strict';
  var el = LT.el, esc = LT.esc, app = document.getElementById('app');
  var mode = LT.params.get('mode'), level = Number(LT.params.get('level')) || 0;
  var rounds = Number(LT.params.get('rounds')) || 0, minutes = Number(LT.params.get('minutes')) || 0;

  function back(host) {
    if (LT.embed || mode) return;
    var b = el('button', { type: 'button', class: 'btn secondary back' }, LT.ICON.back + '<span>Menu</span>');
    b.addEventListener('click', menu);
    host.parentNode.insertBefore(b, host);
  }
  function run(m, lv) {
    var host = el('div', { class: 'panel' });
    app.innerHTML = '';
    app.appendChild(host);
    if (m === 'trace') TraceRace.start(host, { level: lv || 1, rounds: rounds || 3 });
    else if (m === 'predict') PredictRun.start(host, { level: lv || 1, rounds: rounds || 5 });
    else MockContest.start(host, { minutes: minutes || 15 });
    back(host);
    LT.reportHeight();
  }

  function menu() {
    app.innerHTML = '';
    var host = el('div', { class: 'panel menu' });
    host.appendChild(el('h1', {}, 'Loop Tracer'));
    host.appendChild(el('p', { class: 'muted' }, 'ACSL What Does This Program Do? Read the program, follow every loop, and predict what it does.'));
    var modes = [
      ['trace', 'Trace Table Race', 'Predict every new value in the trace table before it is shown. One try each: keep your streak going.', LT.ICON.table],
      ['predict', 'Predict the Output', 'One try at what the program outputs. Then watch the trace to see why.', LT.ICON.eye],
      ['mock', 'Mock Contest', 'Five contest questions against the clock: notation, bit strings and a program.', LT.ICON.clock]
    ];
    var chosen = 'trace', chosenLevel = 1;
    var grid = el('div', { class: 'mode-grid' });
    modes.forEach(function (m) {
      var b = el('button', { type: 'button', class: 'mode-card', 'aria-pressed': String(m[0] === chosen), 'data-mode': m[0] }, m[3] + '<b>' + esc(m[1]) + '</b><span>' + esc(m[2]) + '</span>');
      b.addEventListener('click', function () { chosen = m[0]; drawLevels(); Array.prototype.forEach.call(grid.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); }); });
      grid.appendChild(b);
    });
    host.appendChild(grid);
    var levelsBox = el('div', { class: 'levels' });
    host.appendChild(levelsBox);
    var go = el('button', { type: 'button', class: 'btn big' }, '<span>Play</span>' + LT.ICON.next);
    go.addEventListener('click', function () { run(chosen, chosenLevel); });
    host.appendChild(el('div', { class: 'actions' })).appendChild(go);
    app.appendChild(host);
    drawLevels();

    function drawLevels() {
      levelsBox.innerHTML = '';
      if (chosen === 'mock') { levelsBox.appendChild(el('p', { class: 'muted' }, '15 minutes. Answers are marked when you hand in.')); LT.reportHeight(); return; }
      var max = chosen === 'trace' ? 5 : 6;
      if (chosenLevel > max) chosenLevel = max;
      levelsBox.appendChild(el('div', { class: 'levels-label' }, 'Level'));
      var row = el('div', { class: 'level-row' });
      ACSLLoops.LEVELS.slice(0, max).forEach(function (L) {
        var b = el('button', { type: 'button', class: 'level-chip', 'aria-pressed': String(L.n === chosenLevel), title: L.blurb }, '<b>' + L.n + '</b> ' + esc(L.name));
        b.addEventListener('click', function () { chosenLevel = L.n; Array.prototype.forEach.call(row.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); }); desc.textContent = L.blurb; });
        row.appendChild(b);
      });
      levelsBox.appendChild(row);
      var desc = el('p', { class: 'muted small' }, esc(ACSLLoops.LEVELS[chosenLevel - 1].blurb));
      levelsBox.appendChild(desc);
      LT.reportHeight();
    }
  }

  if (mode === 'trace' || mode === 'predict' || mode === 'mock') run(mode, level);
  else menu();
})();
