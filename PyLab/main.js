// Starts the activity named in ?activity=, or lists them all when the app is opened on its own.
(function () {
  'use strict';
  var host = document.getElementById('activity');
  var LIST = [
    ['vars', '', 'Predict, Then Run', 'Predict what a program with variables prints. Then Python runs it.'],
    ['types', '', 'Which Data Type?', 'Integer, Real or String? Pick first, then Python shows the type.'],
    ['write', '', 'Write the Program: Variables', 'Store values in variables with the right data types.'],
    ['io', '1', 'Predict with Input: Text', 'Predict what a program prints from what the user types.'],
    ['io', '2', 'Predict with Input: Numbers', 'int(), float() and the programs that stop with an error.'],
    ['fix', '', 'Fix the Program', 'Find and fix the input or output mistake.'],
    ['iowrite', '', 'Write the Program: Input and Output', 'Ask the user, work it out, print the answer.']
  ];
  var activity = PL.query.get('activity');
  function open(id) { host.innerHTML = ''; PL.activities[id](host); PL.reportHeight(); }
  if (PL.activities[activity]) { open(activity); return; }
  host.appendChild(PL.el('h1', {}, 'Python Lab'));
  host.appendChild(PL.el('p', { class: 'intro' }, 'Real Python: variables, data types, input and output. Predict first, then run it.'));
  var grid = PL.el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = PL.el('button', { type: 'button', class: 'menu-tile' }, '<b>' + a[2] + '</b><span>' + a[3] + '</span>');
    b.addEventListener('click', function () { location.search = '?activity=' + a[0] + (a[1] ? '&part=' + a[1] : '') + location.search.replace(/^\?/, '&').replace(/&(activity|part)=[^&]*/g, ''); });
    grid.appendChild(b);
  });
  host.appendChild(grid);
})();
