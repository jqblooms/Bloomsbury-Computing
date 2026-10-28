// The start menu when Bit Flicker is opened on its own (no ?mode): what bit strings are, then every bit-string game
// in the order a Year 7 class should play them. The two switch boards live in Comp Arcade (Year 7).
(function () {
  'use strict';
  var host = document.getElementById('game');
  var v = Flick.params.get('bcv');
  function q(path, extra) { return path + '?' + extra + (v ? '&bcv=' + encodeURIComponent(v) : ''); }
  var LIST = [
    [q('../CompArcadeY7/', 'game=bits&ops=logic'), 'Switch Board: NOT, AND, OR, XOR', 'Flip switches to show the answer, one column at a time.'],
    [q('../CompArcadeY7/', 'game=bits&ops=shift'), 'Shifts and circulates', 'Slide the bits left or right. See which bit falls off and what comes in.'],
    [q('', 'mode=lab'), 'Flick Lab', 'Work out one operator, then pick the move that turns one string into another.'],
    [q('', 'mode=pile'), 'Precedence Pile-up', 'A long sum of bit strings: choose which operator goes first, then work it out.'],
    [q('', 'mode=findx'), 'Find X', 'Find every x that makes an equation true.', true]
  ];
  host.innerHTML = '<h2>Bit string games</h2><p>A <b>bit string</b> is a row of 0s and 1s, like <b class="bt-code">10110</b>. Operators such as NOT, AND and LSHIFT change it into a new bit string.</p>' +
    '<p class="small">Play them in this order. Each game shows you how to play, the rule and a worked example. Stuck? Press <b>Walk me through it</b>.</p>';
  var ul = document.createElement('ol');
  ul.className = 'bt-menu';
  LIST.forEach(function (g, i) {
    var li = document.createElement('li');
    li.innerHTML = '<a href="' + g[0] + '"><span class="num">' + (i + 1) + '</span><b>' + g[1] + (g[3] ? '<span class="bt-chip">Challenge</span>' : '') + '</b><span class="what">' + g[2] + '</span></a>';
    ul.appendChild(li);
  });
  host.appendChild(ul);
  Flick.reportHeight();
})();
