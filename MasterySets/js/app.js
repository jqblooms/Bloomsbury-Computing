// Practice Sets (?group=y11-mastery): real exam questions one at a time, in sets mastered in order (js/scheduler.js).
// Questions come from shared/exam-game-questions.json (the combined sets y11-mastery-1 to 5); marking and progress go
// through the shell to MasterySets.gs (ExamGame.call). Progress is saved on the server after every answer, with a copy
// in localStorage per student as the backup. Teachers get the class list on the start screen.
// Local test without the site: ?examStub=1 (an answer containing "right" gets full marks, nothing is saved online).
(function () {
  'use strict';
  var GROUPS = {
    'y11-mastery': { title: 'Year 11 Practice Sets', sets: ['y11-mastery-1', 'y11-mastery-2', 'y11-mastery-3', 'y11-mastery-4', 'y11-mastery-5'] }
  };
  var params = new URLSearchParams(location.search);
  var groupId = GROUPS[params.get('group')] ? params.get('group') : 'y11-mastery';
  var group = GROUPS[groupId];
  var embed = params.get('embed') === '1';
  var stubTest = params.get('examStub') === '1';
  var S = window.MasteryScheduler, EG = window.ExamGame, EQ = window.BCExamQuestion;
  var app = document.getElementById('app');

  var sets = [];          // [{ setId, title, questions: [{ qid, text, marks, blocks }] }]
  var setQids = [];       // [[qid]]
  var byQid = {};
  var state = null, who = '', teacher = false;
  var saving = false, saveAgain = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(html) { app.innerHTML = html; postHeight(); window.scrollTo(0, 0); }

  // ---------------------------------------------------------------- height for lesson embeds
  function postHeight() {
    if (!embed || window.parent === window) return;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(document.documentElement.scrollHeight) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.body);

  // ---------------------------------------------------------------- server, with the stub for local tests
  function call(op, payload) {
    payload = Object.assign({ group: groupId }, payload || {});
    if (EG.isStub()) return stubCall(op, payload);
    return EG.call(op, payload);
  }
  function stubCall(op, p) {
    return new Promise(function (res) { setTimeout(res, 300); }).then(function () {
      if (op === 'masteryLoad') return { state: '', teacher: params.get('teacher') === '1', who: 'stub' };
      if (op === 'masterySave') return { ok: true };
      if (op === 'masteryClass') return { rows: [{ name: 'Test Student', email: 'test@example.com', set: 2, mastered: 4, size: 10, total: 14, of: 47, answers: 31, updated: '2026-11-23 09:10' }] };
      if (op === 'masterySubmit') {
        var q = byQid[p.qid], full = /right/i.test(p.answer + ' ' + p.working);
        return { qid: p.qid, marks: full ? q.marks : 0, max: q.marks, full: full, feedback: full ? 'Correct. Full marks.' : 'You earned 0 of ' + q.marks + ' marks. Practice mode: type right to get full marks.', model: 'Practice mode: the model answer shows here.' };
      }
      throw new Error('Unknown request.');
    });
  }

  function localKey() { return 'bc-mastery:' + groupId + ':' + who; }
  function readLocal() {
    try { var t = localStorage.getItem(localKey()); return t ? JSON.parse(t) : null; } catch (e) { return null; }
  }
  function writeLocal() { try { localStorage.setItem(localKey(), JSON.stringify(state)); } catch (e) {} }

  // Saves to the server (one at a time; a save asked for while one runs follows it). The server keeps the copy that
  // is further on; when that is not ours, we take it.
  function save() {
    writeLocal();
    if (saving) { saveAgain = true; return; }
    saving = true;
    call('masterySave', { state: JSON.stringify(state) }).then(function (r) {
      if (r && r.state) {
        try {
          var other = S.repair(JSON.parse(r.state), setQids.map(function (l) { return l.length; }));
          if (S.progress(other, setQids) > S.progress(state, setQids)) { state = other; writeLocal(); }
        } catch (e) {}
      }
    }, function () {}).then(function () {
      saving = false;
      if (saveAgain) { saveAgain = false; save(); }
    });
  }

  // ---------------------------------------------------------------- start
  function boot() {
    if (EG.isStub() && !stubTest) {
      el('<div class="ms-card"><h1>' + esc(group.title) + '</h1><p>Open this from the Bloomsbury Computing site, signed in, so your answers can be marked and your progress saved.</p></div>');
      return;
    }
    el('<div class="ms-card"><p class="ms-muted">Loading the questions...</p></div>');
    Promise.all([EG.file(), call('masteryLoad')]).then(function (res) {
      var file = res[0], load = res[1] || {};
      group.sets.forEach(function (id) {
        var s = file.sets.filter(function (x) { return x.setId === id; })[0];
        if (!s || !s.questions.length) throw new Error('missing set ' + id);
        sets.push(s);
        setQids.push(s.questions.map(function (q) { byQid[q.qid] = q; return q.qid; }));
      });
      who = String(load.who || '');
      teacher = !!load.teacher;
      var sizes = setQids.map(function (l) { return l.length; });
      var server = null, local = readLocal();
      try { server = load.state ? JSON.parse(load.state) : null; } catch (e) { server = null; }
      server = server ? S.repair(server, sizes) : null;
      local = local ? S.repair(local, sizes) : null;
      if (server && local) state = S.progress(local, setQids) > S.progress(server, setQids) ? local : server;
      else state = server || local || S.create(sizes);
      if (local && (!server || state === local) && S.progress(local, setQids) > 0) save();
      home();
    }).catch(function (e) {
      el('<div class="ms-card"><h1>' + esc(group.title) + '</h1><p class="ms-error">Your progress could not be loaded. Check you are signed in, then try again.</p>' +
        '<div class="ms-actions"><button class="ms-btn is-main" id="retry">Try again</button></div></div>');
      document.getElementById('retry').onclick = function () { sets = []; setQids = []; boot(); };
    });
  }

  function setChips() {
    return '<div class="ms-sets">' + sets.map(function (s, i) {
      var cls = state.sets[i].done ? 'is-done' : i === state.setIdx && !state.finished ? 'is-open' : '';
      var txt = state.sets[i].done ? 'mastered' : i === state.setIdx ? S.masteredCount(state, setQids[i], i) + ' of ' + setQids[i].length : 'locked';
      return '<span class="ms-set ' + cls + '">Set ' + (i + 1) + ': ' + txt + '</span>';
    }).join('') + '</div>';
  }

  function home() {
    var done = state.finished;
    var i = state.setIdx, n = S.masteredCount(state, setQids[i]);
    el('<div class="ms-card"><h1>' + esc(group.title) + '</h1>' +
      '<p>Real exam questions, one at a time. Write your working and your answer, then press Check.</p>' +
      '<p>Get a question right 2 times in a row to master it. If you make a mistake, it comes back soon and you need it right 3 times in a row.</p>' +
      '<p>Master all the questions in a set to open the next set.</p>' +
      setChips() +
      (done ? '<p class="ms-status">You have mastered every set.</p>' :
        '<div class="ms-actions"><button class="ms-btn is-main" id="go">' + (state.answers ? 'Continue' : 'Start') + ' Set ' + (i + 1) + '</button>' +
        '<span class="ms-muted">' + n + ' of ' + setQids[i].length + ' mastered</span></div>') +
      (teacher ? '<div class="ms-actions"><button class="ms-btn" id="cls">Class progress</button></div>' : '') +
      '</div>');
    var go = document.getElementById('go');
    if (go) go.onclick = ask;
    var cls = document.getElementById('cls');
    if (cls) cls.onclick = classView;
  }

  function progressLine() {
    var i = state.setIdx, n = S.masteredCount(state, setQids[i]), size = setQids[i].length;
    return '<div class="ms-progress"><span>Set <b>' + (i + 1) + '</b> of ' + sets.length + '</span><span><b>' + n + '</b> of ' + size + ' mastered</span>' +
      '<span class="ms-bar" aria-hidden="true"><i style="width:' + Math.round(n / size * 100) + '%"></i></span></div>';
  }

  // ---------------------------------------------------------------- one question
  function ask() {
    if (state.finished) { home(); return; }
    var qids = setQids[state.setIdx];
    var pick = S.next(state, qids);
    writeLocal();
    var q = byQid[pick.qid];
    el(progressLine() +
      '<div class="ms-card"><div class="ms-q" id="q"></div>' +
      '<div class="ms-boxes"><div><label for="work">Working</label><textarea id="work" rows="4" spellcheck="false" autocomplete="off"></textarea></div>' +
      '<div><label for="ans">Answer</label><textarea id="ans" rows="2" spellcheck="false" autocomplete="off"></textarea></div></div>' +
      '<div class="ms-actions"><button class="ms-btn is-main" id="check">Check</button><span class="ms-muted" id="wait"></span></div>' +
      '<div id="out"></div></div>');
    // The paper's own working space is the Working box here, so its ruled lines and label are left out.
    EQ.render(document.getElementById('q'), q.blocks ? {
      text: q.text,
      blocks: q.blocks.filter(function (b) { return b.type !== 'lines'; }).map(function (b) {
        return b.type === 'para' ? Object.assign({}, b, { text: String(b.text).replace(/\n?Working space\s*$/, '') }) : b;
      })
    } : q);
    postHeight();
    var work = document.getElementById('work'), ans = document.getElementById('ans'), check = document.getElementById('check');
    var out = document.getElementById('out'), wait = document.getElementById('wait');
    var rid = EG.newRid();
    ans.focus();
    check.onclick = function () {
      var w = work.value.trim(), a = ans.value.trim();
      if (!w && !a) { out.innerHTML = '<p class="ms-error">Write your working and your answer first.</p>'; postHeight(); return; }
      check.disabled = true; work.readOnly = true; ans.readOnly = true;
      wait.textContent = 'Marking...';
      out.innerHTML = '';
      call('masterySubmit', { qid: q.qid, working: w, answer: a, rid: rid }).then(function (r) {
        wait.textContent = '';
        var full = !!r.full || r.marks >= r.max;
        var res = S.answer(state, qids, full);
        save();
        var left = res.need - res.streak;
        var status = res.mastered ? 'Mastered.' :
          full ? 'Right. It will come back later. ' + left + ' more right ' + (left === 1 ? 'answer' : 'answers in a row') + ' to master it.' :
          'This question will come back soon. You need it right 3 times in a row.';
        var cls = full ? 'is-full' : r.marks > 0 ? 'is-part' : 'is-zero';
        out.innerHTML = '<div class="ms-result ' + cls + '"><p class="ms-mark">' + r.marks + ' out of ' + r.max + (r.max === 1 ? ' mark' : ' marks') + '</p>' +
          '<p class="ms-feedback">' + esc(r.feedback || '') + '</p>' +
          (r.model ? '<div class="ms-model"><b>Model answer</b><pre>' + esc(r.model) + '</pre></div>' : '') +
          '<p class="ms-status">' + esc(status) + '</p></div>' +
          '<div class="ms-actions"><button class="ms-btn is-main" id="next">Next</button></div>';
        check.hidden = true;
        postHeight();
        document.getElementById('next').onclick = function () {
          if (res.finished) finishedView();
          else if (res.setDone) setDoneView();
          else ask();
        };
      }, function (e) {
        wait.textContent = '';
        check.disabled = false; work.readOnly = false; ans.readOnly = false;
        out.innerHTML = '<p class="ms-error">' + esc((e && e.message) || 'Your answer could not be marked.') + ' Press Check to send it again.</p>';
        postHeight();
      });
    };
  }

  function setDoneView() {
    var i = state.setIdx;
    el('<div class="ms-card"><h2>Set ' + i + ' mastered</h2><p>Well done. Set ' + (i + 1) + ' is open now.</p>' + setChips() +
      '<div class="ms-actions"><button class="ms-btn is-main" id="go">Start Set ' + (i + 1) + '</button></div></div>');
    document.getElementById('go').onclick = ask;
  }
  function finishedView() {
    el('<div class="ms-card"><h2>Every set mastered</h2><p>You have mastered all ' + setQids.reduce(function (n, l) { return n + l.length; }, 0) + ' questions.</p>' + setChips() +
      '<div class="ms-actions"><button class="ms-btn" id="back">Back</button></div></div>');
    document.getElementById('back').onclick = home;
  }

  // ---------------------------------------------------------------- teacher: class progress
  function classView() {
    el('<div class="ms-card"><h2>Class progress</h2><p class="ms-muted">Loading...</p></div>');
    call('masteryClass').then(function (r) {
      var rows = (r && r.rows) || [];
      el('<div class="ms-card"><h2>Class progress</h2>' +
        (rows.length ? '<div style="overflow-x:auto"><table class="ms-table"><thead><tr><th>Student</th><th>Set</th><th>Mastered in set</th><th>All sets</th><th>Answers</th><th>Last answer</th></tr></thead><tbody>' +
          rows.map(function (x) {
            return '<tr><td>' + esc(x.name || x.email) + '</td><td>' + x.set + ' of ' + sets.length + '</td><td>' + x.mastered + ' of ' + x.size + '</td><td>' + x.total + ' of ' + x.of +
              '</td><td>' + x.answers + '</td><td>' + esc(x.updated) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<p>No student has started yet.</p>') +
        '<div class="ms-actions"><button class="ms-btn" id="refresh">Refresh</button><button class="ms-btn" id="back">Back</button></div></div>');
      document.getElementById('refresh').onclick = classView;
      document.getElementById('back').onclick = home;
    }, function (e) {
      el('<div class="ms-card"><h2>Class progress</h2><p class="ms-error">' + esc((e && e.message) || 'Could not load the class list.') + '</p>' +
        '<div class="ms-actions"><button class="ms-btn" id="back">Back</button></div></div>');
      document.getElementById('back').onclick = home;
    });
  }

  boot();
})();
