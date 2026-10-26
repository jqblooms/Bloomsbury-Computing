// Starts the game named in ?mode=, or lists them all when the app is opened on its own.
(function () {
  'use strict';
  var host = document.getElementById('activity');
  var LIST = [
    ['tower', 'tower', 'Expression Tower', 'Prefix, infix and postfix. Every right answer adds a floor; streaks score more.'],
    ['heist', 'lock', 'Bit Heist', 'Crack five vaults locked by bit-string expressions. Two tries each, three alarms.'],
    ['detective', 'search', 'Loop Detective', 'Name what mystery loop programs output and climb the ranks.'],
    ['board', 'grid', 'Team Quiz Board', 'Two teams, one screen. The teacher runs it on the board.'],
    ['contest', 'trophy', 'Mini Contest', 'Five contest questions against the clock, with a scoreboard.']
  ];
  var mode = CA.params.get('mode');
  function open(id) { host.innerHTML = ''; CA.modes[id](host); CA.reportHeight(); }
  if (CA.modes[mode]) { open(mode); return; }
  host.appendChild(CA.el('h1', {}, 'Competition Arcade'));
  host.appendChild(CA.el('p', { class: 'intro' }, 'Games for ACSL Junior Contest 2: prefix, infix and postfix, bit-string flicking, and what loop programs output.'));
  var grid = CA.el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = CA.el('button', { type: 'button', class: 'menu-tile' }, CA.ICON[a[1]] + '<b>' + a[2] + '</b><span>' + a[3] + '</span>');
    b.addEventListener('click', function () {
      var q = new URLSearchParams(location.search); q.set('mode', a[0]);
      history.replaceState(null, '', location.pathname + '?' + q.toString());
      CA.params.set('mode', a[0]);
      open(a[0]);
    });
    grid.appendChild(b);
  });
  host.appendChild(grid);
})();
