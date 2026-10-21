// Why plan? (?activity=explain) Something went wrong in last year's project. Build a 2-mark answer from two parts:
// what the plan shows (1 mark) and what that gives the team (1 mark). One check per problem; a problem not given 2
// marks comes back later as a different problem of the same kind. Done when every kind has earned 2 marks.
(function () {
  'use strict';
  var el = PP.el, esc = PP.esc;
  var KINDS = {
    who: { shows: 'who does each task', gives: 'no task is done twice or forgotten',
      problems: ['Two people made the same sprite, and nobody made the score.', 'Ploy and Ben both drew the maze, and nobody tested it.'] },
    deadline: { shows: 'the deadline for each task', gives: 'the project is finished on time',
      problems: ['The game was still not ready on Sports Day.', 'Testing started on the last day, so there was no time to fix anything.'] },
    order: { shows: 'the order of the tasks', gives: 'nobody starts a task too early',
      problems: ['Mint made the game before the flowchart was drawn, then had to make it again.', 'Tom tried to test the quiz before anyone had made it.'] },
    needs: { shows: 'what each task needs', gives: 'nobody turns up without what they need',
      problems: ['On the day of the build, nobody had booked a computer.', 'Nat came to draw the sprites, but there was no paper.'] }
  };
  var IDS = Object.keys(KINDS);

  PP.activities.explain = function (host) {
    var lead = el('p', { class: 'task-q' }), problem = el('div', { class: 'brief big' }), build = el('div', { class: 'sentence' });
    var bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    var helpBtn = el('button', { type: 'button', class: 'btn ghost small-btn', 'aria-pressed': 'false' }, PP.ICON.help + '<span>Help</span>');
    var help = el('div', { class: 'help-box', hidden: '' });
    [lead, problem, build, help, bar, fb].forEach(function (n) { host.appendChild(n); });
    helpBtn.addEventListener('click', function () {
      var on = help.hidden;
      help.hidden = !on; helpBtn.setAttribute('aria-pressed', String(on));
      help.innerHTML = 'First part: if the plan had shown this, would the problem have happened? Second part: what does that part of a plan give the team? The two parts must link.';
      PP.reportHeight();
    });
    var queue = PP.shuffle(IDS).map(function (k) { return { kind: k, v: PP.rand(2) }; });
    var earned = {}, marks = 0, out = 0, n = 0, project = PP.pick(PP.PROJECTS), S, log = PP.results('explain why a plan is useful (2-mark answers)');
    // For the browser tests: the activity's current state.
    PP.peek = function () { return { S: S, earned: earned, KINDS: KINDS }; };

    function next() {
      if (IDS.every(function (k) { return earned[k]; })) {
        problem.innerHTML = ''; build.innerHTML = ''; help.hidden = true;
        lead.innerHTML = 'Marks: <b>' + marks + '</b> of ' + out + '.';
        bar.innerHTML = PP.doneBanner('Done: a 2-mark answer for every kind of problem.');
        PP.reportHeight();
        return;
      }
      var item = queue.shift();
      n++;
      S = { kind: item.kind, v: item.v, a: null, b: null, done: false,
        aOpts: PP.shuffle(IDS.map(function (k) { return [k, KINDS[k].shows]; })), bOpts: PP.shuffle(IDS.map(function (k) { return [k, KINDS[k].gives]; })) };
      lead.innerHTML = '<span class="round">Problem ' + n + '</span><span class="score">Marks: <b>' + marks + '</b> of ' + out + '</span><br>' +
        'Your class will make ' + esc(project.name) + ', in teams. Explain why a project plan is useful. [2]';
      lead.appendChild(helpBtn);
      problem.innerHTML = '<b>Last year this went wrong:</b> ' + esc(KINDS[item.kind].problems[item.v]);
      PP.say(fb, '', '');
      draw();
    }
    function draw(result) {
      var row = function (key, opts, title) {
        return '<div class="part"><span class="part-label">' + title + '</span><div class="choices">' + opts.map(function (o) {
          var cls = S[key] === o[0] ? ' picked' : '';
          if (result) cls += o[0] === S.kind ? ' good' : S[key] === o[0] ? ' bad' : '';
          return '<button type="button" class="choice' + cls + '" data-part="' + key + '" data-v="' + o[0] + '"' + (S.done ? ' disabled' : '') + '>' + esc(o[1]) + '</button>';
        }).join('') + '</div></div>';
      };
      build.innerHTML = row('a', S.aOpts, 'A project plan shows...') + row('b', S.bOpts, '...so...') +
        '<p class="said">' + (S.a || S.b ? 'A project plan shows <b>' + esc(S.a ? KINDS[S.a].shows : '...') + '</b>, so <b>' + esc(S.b ? KINDS[S.b].gives : '...') + '</b>.' : '&nbsp;') + '</p>';
      bar.innerHTML = '';
      if (!S.done) {
        var check = el('button', { type: 'button', class: 'btn' }, PP.ICON.check + '<span>Check</span>');
        check.disabled = !S.a || !S.b;
        check.addEventListener('click', mark);
        bar.appendChild(check);
      }
      PP.reportHeight();
    }
    build.addEventListener('click', function (e) {
      var b = e.target.closest('[data-part]');
      if (!b || S.done) return;
      S[b.getAttribute('data-part')] = b.getAttribute('data-v');
      draw();
    });
    function mark() {
      S.done = true;
      var m = (S.a === S.kind ? 1 : 0) + (S.b === S.kind ? 1 : 0);
      marks += m; out += 2;
      if (m === 2) earned[S.kind] = true;
      else queue.push({ kind: S.kind, v: 1 - S.v });
      log.add('"' + KINDS[S.kind].problems[S.v] + '" ' + m + ' of 2 marks: shows ' + KINDS[S.a].shows + ', so ' + KINDS[S.b].gives, m === 2);
      if (IDS.every(function (k) { return earned[k]; })) log.finish();
      draw(true);
      var k = KINDS[S.kind];
      PP.say(fb, (m === 2 ? '<b>2 marks.</b> ' : '<b>' + m + ' mark' + (m === 1 ? '' : 's') + '.</b> ') +
        (m === 2 ? 'The plan shows ' + k.shows + ', so ' + k.gives + '.' : 'Green shows the parts that answer this problem. A problem like it comes back later.'), m === 2 ? '' : 'bad');
      lead.querySelector('.score').innerHTML = 'Marks: <b>' + marks + '</b> of ' + out;
      var nx = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next problem</span>' + PP.ICON.next);
      nx.addEventListener('click', next);
      bar.innerHTML = ''; bar.appendChild(nx);
      PP.reportHeight();
    }
    next();
  };
})();
