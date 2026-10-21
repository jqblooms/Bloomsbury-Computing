// Which stage is it? (?activity=sort) Ten jumbled tasks from different projects go into the five stages. Two
// checks: the first sends the wrong ones back to look at again, the second shows where each one belongs. A set is
// passed with at most two wrong on the first check and none on the second; otherwise a new set.
(function () {
  'use strict';
  var el = PP.el, esc = PP.esc;
  // Some tasks use a word that belongs to another stage ("make" in a fix, "flowchart" in a build): read the whole task.
  var BANK = [
    ['Write what the game must do', 'List what the maze must do', 'Write the questions the quiz must ask', 'Ask Year 3 what the app should have',
      'Write down who will use the app', 'List the rules the game must follow', 'Agree what the card must show'],
    ['Draw the flowchart for catching', 'Sketch the maze levels on paper', 'Plan the score screen on paper', 'Draw the flowchart for one answer',
      'Plan where each button goes', 'Draw the sprites on paper first', 'Draw how the screens link together'],
    ['Make the game on the computer', 'Type the questions into the quiz', 'Make the maze and the sprite', 'Turn the flowchart into Scratch blocks',
      'Put the drawings into the project on the computer', 'Make the buttons work on the computer', 'Add the sounds to the app'],
    ['Play every level to find mistakes', 'Ask Year 5 to try the quiz', 'Try right and wrong answers', 'Watch it run, check every part',
      'Press every button to see what happens', 'Let a friend play and note what goes wrong', 'Check the score goes up when you catch a fruit'],
    ['Fix the walls, make it harder', 'Fix the questions that went wrong', 'Make the fruit fall slower after the test', 'Change the colours the testers found hard to read',
      'Fix what went wrong, then test again', 'Add the music the testers asked for', 'Make the buttons bigger after Year 3 tried them']
  ];
  var WHY = ['It says what it must do.', 'It plans it on paper before anyone makes it.', 'It makes it on the computer.', 'It tries it out to find mistakes.', 'It changes it after the test.'];

  PP.activities.sort = function (host) {
    var lead = el('p', { class: 'task-q' });
    var helpBtn = el('button', { type: 'button', class: 'btn ghost small-btn', 'aria-pressed': 'false' }, PP.ICON.help + '<span>Help</span>');
    var help = el('div', { class: 'help-box', hidden: '' });
    var board = el('div', { class: 'board' });
    var bar = el('div', { class: 'actions' });
    var fb = el('div', { class: 'feedback', role: 'status' });
    var head = el('div', { class: 'head-row' }); head.appendChild(lead); head.appendChild(helpBtn);
    host.appendChild(head); host.appendChild(help); host.appendChild(board); host.appendChild(bar); host.appendChild(fb);
    helpBtn.addEventListener('click', function () {
      var on = help.hidden;
      help.hidden = !on; helpBtn.setAttribute('aria-pressed', String(on));
      help.innerHTML = 'Ask what the task <b>does</b>, not which word it uses. Does it say what it must do? Plan it on paper? Make it on the computer? Try it? Change it after trying it?';
      PP.reportHeight();
    });
    var set = 0, state, log = PP.results('sort tasks into their stages');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { state: state, set: set }; };

    function start() {
      set++;
      var items = [];
      BANK.forEach(function (list, s) { PP.shuffle(list).slice(0, 2).forEach(function (t) { items.push({ text: t, stage: s }); }); });
      items = PP.shuffle(items).map(function (x, i) { x.id = i; return x; });
      state = { items: items, at: {}, locked: {}, look: {}, checks: 0, firstWrong: 0, over: false };
      lead.innerHTML = (set > 1 ? '<span class="round">Set ' + set + '</span> ' : '') + 'Put each task into its stage. Tap a task, then a stage, or drag it. Then press <b>Check</b>.';
      PP.say(fb, '', '');
      draw();
    }
    function draw(show) {
      var free = state.items.filter(function (x) { return state.at[x.id] == null; });
      var chip = function (x) {
        var cls = state.locked[x.id] ? 'good' : state.look[x.id] ? 'hint' : show && show[x.id] ? 'bad' : '';
        return '<button type="button" class="chip ' + cls + '" data-item="' + x.id + '"' + (state.locked[x.id] || state.over ? ' disabled' : '') + '>' + esc(x.text) + '</button>';
      };
      board.innerHTML = (free.length ? '<div class="pool wrap" data-place="pool"><span class="pool-label">Tasks</span>' + free.map(chip).join('') + '</div>' : '') +
        '<div class="bins">' + PP.STAGES.map(function (n, s) {
          return '<div class="bin" data-place="b' + s + '"><b class="bin-name">' + n + '</b>' +
            state.items.filter(function (x) { return state.at[x.id] === s; }).map(chip).join('') + '</div>';
        }).join('') + '</div>';
      bar.innerHTML = '';
      if (!state.over) {
        var check = el('button', { type: 'button', class: 'btn' }, PP.ICON.check + '<span>Check</span>');
        check.disabled = free.length > 0;
        check.addEventListener('click', doCheck);
        bar.appendChild(check);
        bar.appendChild(el('span', { class: 'small' }, 'Checks left: ' + (2 - state.checks)));
      }
      PP.reportHeight();
    }
    PP.placer(board, function (id, place) {
      if (state.over || state.locked[id]) return;
      state.at[id] = place === 'pool' ? null : +place.slice(1);
      delete state.look[id];
      draw();
    }, function (id) { return !state.over && !state.locked[id]; });

    function doCheck() {
      state.checks++;
      var wrong = state.items.filter(function (x) { return !state.locked[x.id] && state.at[x.id] !== x.stage; });
      state.items.forEach(function (x) { if (state.at[x.id] === x.stage) state.locked[x.id] = true; });
      if (state.checks === 1) state.firstWrong = wrong.length;
      if (!wrong.length) {
        var pass = state.firstWrong <= 2;
        state.over = true; draw();
        log.add('set ' + set + ', ' + state.firstWrong + ' of 10 wrong on the first check', pass);
        PP.say(fb, pass ? '<b>All right.</b> ' + (state.firstWrong ? state.firstWrong + ' needed a second look.' : 'All ten on the first check.') :
          '<b>All right now</b>, but ' + state.firstWrong + ' were wrong on the first check. Try a new set: get at most two wrong first time.', pass ? '' : 'bad');
        return pass ? done() : again();
      }
      if (state.checks === 1) {
        wrong.forEach(function (x) { state.at[x.id] = null; state.look[x.id] = true; });
        draw();
        PP.say(fb, wrong.length + ' in the wrong stage went back to the tasks. Read each one again: what does it <b>do</b>?', 'bad');
        return;
      }
      // Second check: show where each wrong one belongs.
      var show = {};
      wrong.forEach(function (x) { show[x.id] = true; state.at[x.id] = x.stage; });
      state.over = true; draw(show);
      log.add('set ' + set + ', ' + state.firstWrong + ' of 10 wrong on the first check, ' + wrong.length + ' still wrong on the second', false);
      PP.say(fb, '<b>' + wrong.length + ' still wrong</b> (red, now in the right stage):<br>' + wrong.map(function (x) {
        return '"' + esc(x.text) + '" is <b>' + PP.STAGES[x.stage] + '</b>. ' + WHY[x.stage];
      }).join('<br>'), 'bad');
      again();
    }
    function again() {
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Try a new set</span>' + PP.ICON.next);
      b.addEventListener('click', start);
      bar.innerHTML = ''; bar.appendChild(b); PP.reportHeight();
    }
    function done() { log.finish(); bar.innerHTML = PP.doneBanner('Done: every task is in its stage.'); PP.reportHeight(); }
    start();
  };
})();
