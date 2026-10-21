// Starts the activity named in ?activity=, or lists them all when the app is opened on its own.
(function () {
  'use strict';
  var host = document.getElementById('activity');
  var LIST = [
    ['stages', 'The Five Stages', 'Put the stages in an order that works. Then find where a broken order gets stuck.'],
    ['sort', 'Which Stage Is It?', 'Sort jumbled tasks into their stages.'],
    ['order', 'Put the Tasks in Order', 'What each task needs decides the order. Run it to see if it works.'],
    ['read', 'Read the Plan', 'Click the part of the plan that answers each question.'],
    ['gaps', 'What Is Missing?', 'Find every fault in a plan.'],
    ['whatif', 'What If?', 'Something changes. Predict which tasks will be late, then run it.'],
    ['build', 'Plan the Project', 'Give every task a person and a day, so the project is ready by Friday.'],
    ['explain', 'Why Plan?', 'Build a 2-mark answer: what the plan shows, and what that gives the team.'],
    ['fix', 'Fix the Plan', 'Find every fault in a broken plan, then fix it.']
  ];
  var activity = new URLSearchParams(location.search).get('activity');
  function open(id) {
    host.innerHTML = '';
    PP.activities[id](host);
    PP.reportHeight();
  }
  if (PP.activities[activity]) { open(activity); return; }
  host.appendChild(PP.el('h1', {}, 'Project Planner'));
  host.appendChild(PP.el('p', { class: 'intro' }, 'Plan a software project: the stages, the order of the tasks, who does each one and when.'));
  var grid = PP.el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = PP.el('button', { type: 'button', class: 'menu-tile' }, '<b>' + a[1] + '</b><span>' + a[2] + '</span>');
    b.addEventListener('click', function () {
      history.replaceState(null, '', location.pathname + '?activity=' + a[0] + location.search.replace(/^\?/, '&').replace(/&activity=[^&]*/, ''));
      open(a[0]);
    });
    grid.appendChild(b);
  });
  host.appendChild(grid);
})();
