// Starts the game named in ?game=, or lists them all when the app is opened on its own.
(function () {
  'use strict';
  var host = document.getElementById('game');
  var LIST = [
    ['stack', 'form=postfix', 'Stack Stacker: Postfix', 'Push the numbers, pop two at each operator, and watch the stack work it out.'],
    ['stack', 'form=prefix', 'Stack Stacker: Prefix', 'The same stack, read from right to left.'],
    ['bits', 'ops=logic', 'Bit strings 1. Switch Board: NOT, AND, OR, XOR', 'Flip the switches to show the answer, one column at a time.'],
    ['bits', 'ops=shift', 'Bit strings 2. Shifts and circulates', 'Slide the bits left or right: LSHIFT, RSHIFT, LCIRC, RCIRC.'],
    ['../BitFlicker/', 'mode=menu', 'Bit strings 3 to 5: Flick Lab, Pile-up, Find X', 'The next bit string games, in Bit Flicker.'],
    ['loop', '', 'Loop Runner', 'Predict what a FOR loop outputs, then watch the runner do one lap for every turn.'],
    ['quiz', '', 'Team Quiz Board', 'Team A against Team B on the projector. The teacher runs it.'],
    ['contest', '', 'Mini Contest', 'Five contest questions in five minutes. Get stars and beat the scoreboard.']
  ];
  var game = CA.GAME;
  if (CA.games[game]) { CA.games[game](host); CA.reportHeight(); return; }
  host.appendChild(CA.el('h1', {}, 'Comp Arcade'));
  host.appendChild(CA.el('p', { class: 'muted' }, 'Games for Contest 2: prefix, infix and postfix, bit strings, and loops.'));
  var grid = CA.el('div', { class: 'menu-grid' });
  LIST.forEach(function (g) {
    var b = CA.el('button', { type: 'button', class: 'menu-tile' }, '<b>' + g[2] + '</b><span>' + g[3] + '</span>');
    b.addEventListener('click', function () {
      if (g[0].indexOf('/') >= 0) { var v = CA.params.get('bcv'); location.href = g[0] + '?' + g[1] + (v ? '&bcv=' + encodeURIComponent(v) : ''); return; }
      var p = new URLSearchParams(location.search);
      p.set('game', g[0]);
      p.delete('form'); p.delete('ops');
      if (g[1]) { var kv = g[1].split('='); p.set(kv[0], kv[1]); }
      location.search = p.toString();
    });
    grid.appendChild(b);
  });
  host.appendChild(grid);
  CA.reportHeight();
})();
