// Starts the activity named in ?activity=, or lists them all when the app is opened on its own.
(function () {
  'use strict';
  var host = document.getElementById('activity');
  var LIST = [
    ['pick', 'Choose the Data', 'Sort data cards into Needed and Not needed, then run the model with your data.'],
    ['run', 'What If?', 'One data item changes. Predict what the model predicts now, then run it.'],
    ['compare', 'Two Applications', 'Decide which data each of two applications needs, and why.'],
    ['design', 'Design the Data', 'Choose the data a model must collect from what a user asks.']
  ];
  var activity = new URLSearchParams(location.search).get('activity');
  function open(id) {
    host.innerHTML = '';
    ML.activities[id](host);
    ML.reportHeight();
  }
  if (ML.activities[activity]) { open(activity); return; }
  host.appendChild(ML.el('h1', {}, 'Model Lab'));
  host.appendChild(ML.el('p', { class: 'intro' }, 'Find the data a model needs, see what missing or wrong data does, and compare the data different applications need.'));
  var grid = ML.el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = ML.el('button', { type: 'button', class: 'menu-tile' }, '<b>' + a[1] + '</b><span>' + a[2] + '</span>');
    b.addEventListener('click', function () {
      history.replaceState(null, '', location.pathname + '?activity=' + a[0] + location.search.replace(/^\?/, '&').replace(/&activity=[^&]*/, ''));
      open(a[0]);
    });
    grid.appendChild(b);
  });
  host.appendChild(grid);
})();
