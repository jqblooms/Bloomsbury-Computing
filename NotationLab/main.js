// Starts the mode named in ?mode=, or lists them all when the app is opened on its own.
(function () {
  'use strict';
  var host = document.getElementById('activity');
  var LIST = [
    ['stack', 'Stack Machine', 'Work out prefix and postfix with a stack. Choose every push and pop, then go without the machine.'],
    ['tree', 'Tree Builder', 'Build the tree of an infix expression, then read prefix and postfix off it.'],
    ['group', 'Group It', 'Turn prefix and postfix back into infix, one operator at a time.'],
    ['race', 'Convert Race', '90 seconds of mixed questions. Build a streak to move up.']
  ];
  var mode = NL.params.get('mode');
  function open(id) {
    host.innerHTML = '';
    NL.activities[id](host);
    NL.reportHeight();
  }
  if (NL.activities[mode]) {
    if (!document.documentElement.classList.contains('embed')) {
      var back = NL.el('button', { type: 'button', class: 'btn secondary nl-back' }, '&larr; All modes');
      back.addEventListener('click', function () {
        var p = new URLSearchParams(location.search);
        ['mode', 'level', 'form', 'pow'].forEach(function (k) { p.delete(k); });
        var q = p.toString();
        location.href = location.pathname + (q ? '?' + q : '');
      });
      host.parentNode.insertBefore(back, host);
    }
    open(mode);
    return;
  }
  host.appendChild(NL.el('h1', {}, 'NotationLab'));
  host.appendChild(NL.el('p', { class: 'intro' }, 'Prefix, infix and postfix: the same expression written three ways.'));
  var grid = NL.el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = NL.el('button', { type: 'button', class: 'menu-tile' }, '<b>' + a[1] + '</b><span>' + a[2] + '</span>');
    b.addEventListener('click', function () {
      var p = new URLSearchParams(location.search);
      p.set('mode', a[0]);
      history.replaceState(null, '', location.pathname + '?' + p.toString());
      location.reload();
    });
    grid.appendChild(b);
  });
  host.appendChild(grid);
})();
