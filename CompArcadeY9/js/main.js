// Contest 2 Arcade: picks the game from the address (?game=race|blaster|lock|showdown|contest), or shows the menu.
(function () {
  'use strict';
  var el = CA.el, esc = CA.esc, app = document.getElementById('app');
  var GAMES = [
    ['race', 'Notation Race', '90 seconds of prefix, infix and postfix. Streaks multiply your points.', CA.ICON.flame, NotationRace],
    ['blaster', 'Bit Flick Blaster', 'Solve for x before the block lands. Three lives.', CA.ICON.bolt, BitBlaster],
    ['lock', 'Loop Lock', 'Trace four programs to open four locks. Wrong codes cost time.', CA.ICON.lock, LoopLock],
    ['showdown', 'Contest Showdown', 'Team A against Team B on one screen. The teacher runs the board.', CA.ICON.trophy, Showdown],
    ['contest', 'Mini-Contest', 'Five contest questions against the clock, then your scoreboard.', CA.ICON.clock, MiniContest]
  ];
  function run(id) {
    var g = GAMES.filter(function (x) { return x[0] === id; })[0];
    app.innerHTML = '';
    var host = el('div', { class: 'panel' });
    if (!CA.embed && !CA.params.get('game')) {
      var b = el('button', { type: 'button', class: 'btn secondary small back' }, CA.ICON.back + '<span>All games</span>');
      b.addEventListener('click', menu);
      app.appendChild(b);
    }
    app.appendChild(host);
    g[4].start(host);
    CA.reportHeight();
  }
  function menu() {
    app.innerHTML = '';
    var host = el('div', { class: 'panel menu' });
    host.appendChild(el('h1', {}, 'Contest 2 Arcade'));
    host.appendChild(el('p', { class: 'muted' }, 'ACSL Junior Contest 2 games: prefix, infix and postfix, bit-string flicking, and what does this program do.'));
    var grid = el('div', { class: 'mode-grid' });
    GAMES.forEach(function (g) {
      var b = el('button', { type: 'button', class: 'mode-card' }, g[3] + '<b>' + esc(g[1]) + '</b><span>' + esc(g[2]) + '</span>');
      b.addEventListener('click', function () { run(g[0]); });
      grid.appendChild(b);
    });
    host.appendChild(grid);
    app.appendChild(host);
    CA.reportHeight();
  }
  var game = CA.params.get('game');
  if (GAMES.some(function (g) { return g[0] === game; })) run(game); else menu();
})();
