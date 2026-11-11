// Python Defense: the menu, one wave at a time, and checking every answer by running the code (run.js).
// A wave counts only if no bug gets through (James: a mistake means the round does not count). Every wrong answer
// shows the working: what the program really does, and why.
// Progress: best score and stars per level in this browser ('pd2:'), and PG_PROGRESS to the site after each wave.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var shuffle = function (l) { var a = l.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var load = function (k, d) { try { var v = localStorage.getItem('pd2:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  var save = function (k, v) { try { localStorage.setItem('pd2:' + k, JSON.stringify(v)); } catch (e) { } };
  var LANG_NAME = { py: 'Python', ps: 'pseudocode' };
  var TIME = { predict: 50, errortype: 45, choice: 30, fix: 100, write: 130 };   // seconds a bug takes to reach the CPU
  var lang = load('lang', 'py'), slow = load('slow', false), best = load('best', {});
  var W = null;   // the wave being played

  // the text of a field in the chosen language
  var T = function (x) { return x == null ? '' : typeof x === 'string' ? x : x[lang] != null ? x[lang] : x.py; };
  var codeOf = function (c) { return c == null ? '' : typeof c === 'string' ? c : c[lang]; };
  var allLevels = function () { return CONTENT.STAGES.reduce(function (a, s) { return a.concat(s.levels.map(function (l) { return Object.assign({ stage: s }, l); })); }, []); };

  // ---------------------------------------------------------------- the menu
  function menu() {
    W = null;
    $('menu').hidden = false; $('play').hidden = true; $('learn').hidden = true; $('homeBtn').hidden = true; learnId = null;
    $('stages').innerHTML = CONTENT.STAGES.map(function (s) {
      return '<article class="pd-stage"><header><span class="pd-stage-n">Stage ' + s.stage + '</span><h2>' + esc(s.title) + '</h2><span class="pd-band">' + s.band + '</span></header><ol>' +
        s.levels.map(function (l) {
          var b = best[l.id], stars = b ? b.stars : 0;
          return '<li><button type="button" class="pd-level' + (l.boss ? ' boss' : '') + '" data-level="' + l.id + '"><span class="pd-lnum">' + l.id + '</span><span class="pd-lname">' + esc(l.title) + '</span>' +
            '<span class="pd-stars" aria-label="' + stars + ' of 3 stars">' + [1, 2, 3].map(function (k) { return '<i class="' + (k <= stars ? 'on' : '') + '"></i>'; }).join('') + '</span>' +
            '<span class="pd-best">' + (b ? b.score : '') + '</span></button></li>';
        }).join('') + '</ol></article>';
    }).join('');
  }
  $('stages').addEventListener('click', function (e) { var b = e.target.closest('[data-level]'); if (b) start(+b.dataset.level); });
  $('homeBtn').addEventListener('click', menu);
  document.querySelectorAll('.pd-lang button').forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    b.addEventListener('click', function () {
      if (W && !confirm('Change language? This wave starts again.')) return;
      lang = b.dataset.lang; save('lang', lang);
      document.querySelectorAll('.pd-lang button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.lang === lang)); });
      if (W) begin(W.level.id); else if (learnId) start(learnId);
    });
  });
  $('slowBugs').checked = !!slow;
  $('slowBugs').addEventListener('change', function () { slow = $('slowBugs').checked; save('slow', slow); });

  // ---------------------------------------------------------------- a wave
  // ---------------------------------------------------------------- before a level: what to know, with examples to run
  // start() shows the Learn screen; its Start button (or Play again) begins the wave. A boss wave shows a recap of its stage.
  var learnId = null;
  function start(id) {
    var level = allLevels().find(function (l) { return l.id === id; });
    W = null; learnId = id;
    $('menu').hidden = true; $('play').hidden = true; $('learn').hidden = false; $('homeBtn').hidden = false;
    var keys = level.boss ? level.stage.levels.map(function (l) { return LEARN.LEVEL[l.id]; }).filter(function (k, i, a) { return k && a.indexOf(k) === i; }) : [LEARN.LEVEL[id]].filter(Boolean);
    var go = '<button type="button" class="btn pd-go">Start the wave</button>';
    var h = '<header class="pd-learn-head"><div><span class="pd-stage-n">Before level ' + id + '</span><h2>' + esc(level.title) + '</h2></div>' + go + '</header>';
    if (level.boss) {
      h += '<p class="pd-lead">The boss wave mixes everything from stage ' + level.stage.stage + '. Here is what you need.</p>' +
        keys.map(function (k) { var t = LEARN.TOPICS[k]; return '<section class="pd-topic"><h3>' + esc(T(t.title)) + '</h3><ul>' + t.points.map(function (p) { return '<li>' + esc(T(p)) + '</li>'; }).join('') + '</ul></section>'; }).join('');
    } else keys.forEach(function (k) {
      var t = LEARN.TOPICS[k];
      h += '<section class="pd-topic"><h3>' + esc(T(t.title)) + '</h3><ul>' + t.points.map(function (p) { return '<li>' + esc(T(p)) + '</li>'; }).join('') + '</ul>';
      if (t.examples.length) h += '<p class="pd-lead">Predict what each example does. Then press Run it to check.</p>';
      h += t.examples.map(function (ex, i) {
        return '<div class="pd-ex" data-k="' + k + '" data-i="' + i + '">' + codeBox(codeOf(ex.code)) + typed(ex.inputs) +
          '<button type="button" class="btn secondary pd-run">Run it</button><div class="pd-ex-out" hidden></div><p class="pd-ex-why" hidden>' + esc(T(ex.note)) + '</p></div>';
      }).join('') + '</section>';
    });
    h += '<div class="pd-actions">' + go + '</div>';
    $('learn').innerHTML = h;
    $('learn').querySelectorAll('.pd-go').forEach(function (b) { b.addEventListener('click', function () { begin(id); }); });
    $('learn').querySelectorAll('.pd-run').forEach(function (b) {
      b.addEventListener('click', function () {
        var box = b.closest('.pd-ex'), ex = LEARN.TOPICS[box.dataset.k].examples[+box.dataset.i];
        b.disabled = true;
        RUN.run(lang, codeOf(ex.code), ex.inputs).then(function (r) {
          var o = box.querySelector('.pd-ex-out'); o.hidden = false; o.innerHTML = screen('It shows', r.out, r.error);
          box.querySelector('.pd-ex-why').hidden = false; b.hidden = true;
        });
      });
    });
    window.scrollTo(0, 0);
  }
  function begin(id) {
    var level = allLevels().find(function (l) { return l.id === id; });
    learnId = null; $('learn').hidden = true;
    W = { level: level, tasks: CONTENT.waveTasks(level, lang), i: 0, score: 0, correct: 0, wrong: 0, t0: Date.now(), used: [], over: false };
    $('menu').hidden = true; $('play').hidden = false; $('homeBtn').hidden = false;
    FIELD.wave(level.bugs, level.boss);
    $('hudLevel').textContent = 'Level ' + level.id + ': ' + level.title;
    hud(); next();
  }
  function hud() {
    $('hudScore').textContent = W.score + ' points';
    $('hudDots').innerHTML = W.tasks.map(function (t, k) { return '<i class="' + (k < W.i || (k === W.i && W.answered && !W.over) ? 'done' : k === W.i && !W.over ? 'now' : '') + (W.level.boss && k === W.tasks.length - 1 ? ' boss' : '') + '"></i>'; }).join('');
  }
  function next() {
    if (W.i >= W.tasks.length) { cleared(); return; }
    var t = W.tasks[W.i]; W.task = t; W.answered = false; W.pick = null; W.line = null;
    W.secs = TIME[t.kind] * (slow ? 2 : 1);
    render(t);
    FIELD.send(W.secs);
    clearInterval(W.timer);
    W.timer = setInterval(function () {
      var p = FIELD.progress(), bar = document.querySelector('.pd-time i');
      if (bar) bar.style.width = (100 - p * 100) + '%';
      if (p >= 1 && !W.answered) { clearInterval(W.timer); wrong('The bug reached the CPU before you answered.', null); }
    }, 200);
    hud();
  }

  // ---------------------------------------------------------------- the task on screen
  var KIND_HEAD = { predict: 'What does it show?', errortype: 'Spot the error', fix: 'Fix it', write: 'Write it', choice: 'Answer it' };
  function codeBox(code, clickable) {
    return '<ol class="pd-code' + (clickable ? ' pick' : '') + '">' + code.split('\n').map(function (l, i) {
      return '<li' + (clickable ? ' tabindex="0" role="button" data-line="' + (i + 1) + '"' : '') + '><code>' + (esc(l) || ' ') + '</code></li>';
    }).join('') + '</ol>';
  }
  // what the user types, shown under the code
  function typed(inputs) { return inputs && inputs.length ? '<p class="pd-typed">The user types: ' + inputs.map(function (v) { return '<kbd>' + esc(v) + '</kbd>'; }).join(' then ') + '</p>' : ''; }
  function render(t) {
    var code = codeOf(t.code), h = '<div class="pd-time" aria-hidden="true"><i></i></div><div class="pd-kind">' + KIND_HEAD[t.kind] + ' <span>' + LANG_NAME[lang] + '</span></div>';
    if (t.kind === 'predict') h += '<p class="pd-q">Type exactly what this program shows, one line at a time.</p>' + codeBox(code) + typed(t.inputs) + '<textarea id="ans" class="pd-ans" rows="3" spellcheck="false" autocomplete="off" aria-label="What it shows"></textarea>';
    else if (t.kind === 'errortype') h += '<p class="pd-q">' + esc(T(t.intent)) + ' Is there an error? If there is, pick its type, then click the line it is on.</p>' + codeBox(code, true) + typed(t.inputs) +
      '<div class="pd-opts" role="group" aria-label="Type of error">' + ['syntax', 'logic', 'runtime', 'none'].map(function (k) { return '<button type="button" class="pd-opt" data-err="' + k + '">' + (k === 'none' ? 'No error' : k[0].toUpperCase() + k.slice(1) + ' error') + '</button>'; }).join('') + '</div>';
    else if (t.kind === 'fix' || t.kind === 'write') {
      var ex = t.tests && t.tests[0] && t.tests[0].length;
      h += '<p class="pd-q">' + (t.kind === 'fix' ? (t.intent ? esc(T(t.intent)) + ' ' : '') + 'Change the program so it works.' + (ex ? '' : ' It should show:') : esc(T(t.intent)) + (lang === 'ps' ? ' Declare every variable first.' : '') + (ex ? '' : ' It should show:')) + '</p>' +
        (t.tests && t.tests[0] && t.tests[0].length ? '<p class="pd-typed">For example, when the user types ' + t.tests[0].map(function (v) { return '<kbd>' + esc(v) + '</kbd>'; }).join(' then ') + ', it should show:</p>' : '') + '<pre class="pd-want" id="want">...</pre><textarea id="ans" class="pd-ans pd-editor" rows="' + Math.max(5, (t.kind === 'fix' ? code : t.start ? codeOf(t.start) : '').split('\n').length + 3) + '" spellcheck="false" autocomplete="off" aria-label="Your program">' + esc(t.kind === 'fix' ? code : t.start ? codeOf(t.start) : '') + '</textarea>';
      expected(t).then(function (r) { var w = $('want'); if (w && W && W.task === t) w.textContent = r.out.join('\n'); });
    }
    else if (t.kind === 'choice') {
      W.order = shuffle(t.options.map(function (o, i) { return i; }));
      h += '<p class="pd-q">' + esc(lang === 'ps' && t.psq ? t.psq : t.q) + '</p>' + (t.code ? codeBox(code) : '') +
        '<div class="pd-opts col" role="group" aria-label="Answers">' + W.order.map(function (i) { return '<button type="button" class="pd-opt" data-opt="' + i + '">' + esc(t.options[i]) + '</button>'; }).join('') + '</div>';
    }
    h += '<div class="pd-actions"><button type="button" class="btn" id="checkBtn">Fire</button><span class="pd-hint">' + (t.kind === 'fix' || t.kind === 'write' ? 'Ctrl + Enter fires.' : '') + '</span></div><div id="fb" class="pd-fb" hidden></div>';
    $('task').innerHTML = h;
    var ans = $('ans');
    if (ans) {
      ans.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); check(); return; }
        if (!ans.classList.contains('pd-editor')) return;
        var s = ans.selectionStart, end = ans.selectionEnd, v = ans.value;
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ans.value = v.slice(0, s) + '    ' + v.slice(end); ans.selectionStart = ans.selectionEnd = s + 4; }
        else if (e.key === 'Enter') { var ls = v.lastIndexOf('\n', s - 1) + 1, ind = (v.slice(ls, s).match(/^ */) || [''])[0]; if (/:\s*$/.test(v.slice(ls, s))) ind += '    '; e.preventDefault(); ans.value = v.slice(0, s) + '\n' + ind + v.slice(end); ans.selectionStart = ans.selectionEnd = s + 1 + ind.length; }
      });
      setTimeout(function () { try { ans.focus(); } catch (e) { } }, 30);
    }
    $('task').querySelectorAll('[data-err]').forEach(function (b) { b.addEventListener('click', function () { W.pick = b.dataset.err; $('task').querySelectorAll('[data-err]').forEach(function (x) { x.classList.toggle('on', x === b); }); if (W.pick === 'none') pickLine(null); }); });
    $('task').querySelectorAll('[data-opt]').forEach(function (b) { b.addEventListener('click', function () { W.pick = +b.dataset.opt; $('task').querySelectorAll('[data-opt]').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
    $('task').querySelectorAll('.pd-code.pick li').forEach(function (li) {
      var f = function () { if (W.pick !== 'none') pickLine(+li.dataset.line); };
      li.addEventListener('click', f); li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
    });
    $('checkBtn').addEventListener('click', check);
  }
  function pickLine(n) { W.line = n; $('task').querySelectorAll('.pd-code.pick li').forEach(function (li) { li.classList.toggle('on', +li.dataset.line === n); }); }
  // what the program should show: the model (or, for predict, the code itself), run in this language
  function expected(t) { return RUN.run(lang, codeOf(t.model || t.code), (t.tests && t.tests[0]) || t.inputs || []); }

  // ---------------------------------------------------------------- checking
  function check() {
    if (!W || W.answered || W.busy) return;
    var t = W.task;
    if (t.kind === 'errortype' && !W.pick) { flash('Pick the type of error first (or No error).'); return; }
    if (t.kind === 'errortype' && W.pick !== 'none' && !W.line) { flash('Now click the line the error is on.'); return; }
    if (t.kind === 'choice' && W.pick == null) { flash('Pick an answer first.'); return; }
    if ((t.kind === 'predict' || t.kind === 'fix' || t.kind === 'write') && !$('ans').value.trim()) { flash(t.kind === 'predict' ? 'Type what it shows first.' : 'Type your program first.'); return; }
    W.busy = true; FIELD.hold();
    judge(t).then(function (res) { W.busy = false; if (res.ok) right(res.html); else wrong(res.why, res.html); }, function (e) { W.busy = false; FIELD.go(); flash('Something went wrong checking that: ' + e); });
  }
  function flash(msg) { var fb = $('fb'); fb.hidden = false; fb.className = 'pd-fb note'; fb.innerHTML = esc(msg); }
  function screen(title, lines, err) {
    return '<div class="pd-screen"><div class="pd-screen-t">' + esc(title) + '</div>' + (lines.length ? lines.map(function (l) { return '<div>' + (esc(l) || '&nbsp;') + '</div>'; }).join('') : '<div class="dim">(nothing shown)</div>') +
      (err ? '<div class="err">' + (err.kind === 'syntax' ? 'Syntax error' : 'Runtime error') + (err.line ? ' on line ' + err.line : '') + ': ' + esc(err.message) + '</div>' : '') + '</div>';
  }
  function judge(t) {
    var code = codeOf(t.code), why = T(t.why);
    if (t.kind === 'choice') {
      var ok = W.pick === t.answer;
      return Promise.resolve({ ok: ok, why: ok ? '' : 'The answer is: ' + t.options[t.answer] + '.', html: '<p>' + esc(why) + '</p>' });
    }
    if (t.kind === 'predict') {
      var typed = $('ans').value.replace(/\r/g, '').split('\n');
      return RUN.run(lang, code, t.inputs || []).then(function (r) {
        var ok = RUN.same(typed, r.out);
        return { ok: ok, why: ok ? '' : 'Not quite: the program shows something different.', html: screen('It shows', r.out, r.error) + (why ? '<p>' + esc(why) + '</p>' : '') };
      });
    }
    if (t.kind === 'errortype') {
      return RUN.run(lang, code, t.inputs || []).then(function (r) {
        var line = t.line ? t.line[lang] : null, okType = W.pick === t.error, okLine = t.error === 'none' || W.line === line;
        var name = t.error === 'none' ? 'no error' : 'a ' + t.error + ' error' + (line ? ' on line ' + line : '');
        return { ok: okType && okLine, why: okType && !okLine ? 'Right type, wrong line: it is ' + name + '.' : 'It has ' + name + '.', html: screen('When it runs', r.out, r.error) + '<p>' + esc(why) + '</p>' };
      });
    }
    // fix and write: run the student's program on every test and compare it with the model
    var mine = $('ans').value.replace(/\r/g, '');
    if (t.kind === 'fix' && mine.trim() === code.trim()) return Promise.resolve({ ok: false, why: 'The program is the same as before. Change the line with the problem.', html: '' });
    var tests = t.tests || [[]], need = (t.needs || []).find(function (n) { return !new RegExp(n.re).test(mine); });
    var chain = Promise.resolve({ ok: true });
    tests.forEach(function (inputs) {
      chain = chain.then(function (prev) {
        if (!prev.ok) return prev;
        return Promise.all([RUN.run(lang, mine, inputs), RUN.run(lang, codeOf(t.model), inputs)]).then(function (rr) {
          var me = rr[0], want = rr[1];
          if (me.error) return { ok: false, why: (me.error.kind === 'syntax' ? 'Your program has a syntax error' : 'Your program stopped with a runtime error') + (me.error.line ? ' on line ' + me.error.line : '') + '.', html: screen('Your program', me.out, me.error) + screen('It should show', want.out) };
          if (!RUN.same(me.out, want.out)) return { ok: false, why: 'Your program runs, but shows something different' + (inputs.length ? ' when the user types ' + inputs.join(' then ') : '') + '.', html: screen('Your program', me.out) + screen('It should show', want.out) };
          var bad = (t.vars || []).find(function (v) { return me.vars[v[lang]] !== v.value; });
          if (bad) return { ok: false, why: 'It shows the right thing, but ' + bad[lang] + ' should end up holding ' + bad.value + '. Use the variable, do not just show the answer.', html: '' };
          return { ok: true, html: screen('Your program', me.out) };
        });
      });
    });
    return chain.then(function (r) { if (r.ok && need) return { ok: false, why: need.say, html: r.html }; return r; });
  }

  // ---------------------------------------------------------------- right, wrong, cleared
  function right(html) {
    W.answered = true; clearInterval(W.timer);
    var p = FIELD.progress(), pts = 100 + Math.round(100 * (1 - p));
    W.used.push(p); W.score += pts; W.correct++;
    FIELD.squash();
    var fb = $('fb'); fb.hidden = false; fb.className = 'pd-fb good';
    fb.innerHTML = '<div class="pd-fb-h">Squashed! +' + pts + '</div>' + (html || '');
    $('checkBtn').textContent = W.i + 1 >= W.tasks.length ? 'Finish the wave' : 'Next bug';
    $('checkBtn').onclick = function (e) { e.stopImmediatePropagation(); W.i++; next(); };
    $('checkBtn').removeEventListener('click', check);
    $('checkBtn').focus();
    hud();
  }
  function wrong(why, html) {
    W.answered = true; W.over = true; W.wrong++; clearInterval(W.timer);
    FIELD.breach();
    var fb = $('fb'); fb.hidden = false; fb.className = 'pd-fb bad';
    fb.innerHTML = '<div class="pd-fb-h">A bug got through to the CPU</div><p>' + esc(why) + '</p>' + (html || '') + '<p class="pd-small">This wave does not count. Try a new wave: it has new code each time.</p>' +
      '<div class="pd-actions"><button type="button" class="btn" id="againBtn">New wave</button> <button type="button" class="btn secondary" id="menuBtn">Levels</button></div>';
    $('checkBtn').hidden = true;
    $('againBtn').addEventListener('click', function () { begin(W.level.id); });
    $('menuBtn').addEventListener('click', menu);
    report(false);
    hud();
  }
  function cleared() {
    W.over = true;
    var avg = W.used.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, W.used.length), stars = avg < 0.35 ? 3 : avg < 0.6 ? 2 : 1;
    var id = W.level.id, b = best[id] || { score: 0, stars: 0 };
    best[id] = { score: Math.max(b.score, W.score), stars: Math.max(b.stars, stars) }; save('best', best);
    report(true);
    var nextL = allLevels().find(function (l) { return l.id === id + 1; });
    $('task').innerHTML = '<div class="pd-clear"><div class="pd-clear-stars">' + [1, 2, 3].map(function (k) { return '<i class="' + (k <= stars ? 'on' : '') + '"></i>'; }).join('') + '</div><h2>Wave cleared</h2>' +
      '<p>Every bug squashed. ' + W.score + ' points. ' + (stars < 3 ? 'Answer faster for more stars.' : 'Top speed.') + '</p><div class="pd-actions">' +
      (nextL ? '<button type="button" class="btn" id="nextLvl">Next level: ' + esc(nextL.title) + '</button> ' : '') + '<button type="button" class="btn secondary" id="againLvl">Play again</button> <button type="button" class="btn secondary" id="toMenu">Levels</button></div></div>';
    if (nextL) $('nextLvl').addEventListener('click', function () { start(nextL.id); });
    $('againLvl').addEventListener('click', function () { begin(id); });
    $('toMenu').addEventListener('click', menu);
    hud();
  }
  function report(clean) {
    if (W.reported) return; W.reported = true;
    // levels go to the site as 101 and up: 1 to 52 are the old game's records, which meant other levels
    postToParent({ type: 'PG_PROGRESS', kind: 'level', level: 100 + W.level.id, score: clean ? W.score : 0, duration: Date.now() - W.t0, correct: W.correct, wrong: W.wrong, lang: lang });
  }

  FIELD.init($('field'));
  menu();

  // ---------------------------------------------------------------- self-test: ?selftest checks every generator in both languages
  if (/[?&]selftest/.test(location.search)) {
    window.__pdSelftest = (async function (n) {
      var fails = [], count = 0;
      for (var L of ['py', 'ps']) {
        for (var lvl of allLevels()) {
          for (var k = 0; k < (n || 8); k++) {
            for (var t of CONTENT.waveTasks(lvl, L)) {
              count++;
              var c = t.code ? (typeof t.code === 'string' ? t.code : t.code[L]) : null, say = function (m) { fails.push(L + ' L' + lvl.id + ' ' + t.kind + ': ' + m + '\n' + (c || (t.model && t.model[L]) || '')); };
              if (t.kind === 'predict') { var r = await RUN.run(L, c, t.inputs || []); if (r.error) say('predict code fails: ' + r.error.message); if (!r.out.length) say('predict shows nothing'); }
              if (t.kind === 'errortype') {
                var r2 = await RUN.run(L, c, t.inputs || []), want = t.error;
                if (want === 'syntax' || want === 'runtime') { if (!r2.error || r2.error.kind !== want) say('expected ' + want + ', got ' + (r2.error ? r2.error.kind + ' ' + r2.error.message : 'no error')); else if (r2.error.line && t.line && r2.error.line !== t.line[L]) say('line ' + t.line[L] + ' but error on ' + r2.error.line); }
                else if (r2.error) say(want + ' task but it errors: ' + r2.error.message);
              }
              if (t.kind === 'fix' || t.kind === 'write') {
                var m = await RUN.run(L, t.model[L], (t.tests || [[]])[0]);
                if (m.error) say('model fails: ' + m.error.message);
                (t.vars || []).forEach(function (v) { if (m.vars[v[L]] !== v.value) say('model var ' + v[L] + ' = ' + m.vars[v[L]]); });
                (t.needs || []).forEach(function (nd) { if (!new RegExp(nd.re).test(t.model[L])) say('model misses need ' + nd.re); });
                if (t.kind === 'fix') { var broken = true; for (var tin of (t.tests || [[]])) { var b2 = await RUN.run(L, c, tin), m2 = await RUN.run(L, t.model[L], tin); if (b2.error || !RUN.same(b2.out, m2.out)) broken = false; } if (broken) say('broken code already works on every test'); }
                for (var tin2 of (t.tests || [[]])) { var m3 = await RUN.run(L, t.model[L], tin2); if (m3.error) say('model fails on ' + tin2.join(',') + ': ' + m3.error.message); }
              }
              if (t.kind === 'choice' && !(t.answer >= 0 && t.answer < t.options.length)) say('bad answer index');
            }
          }
        }
      }
      for (var L2 of ['py', 'ps']) for (var key in LEARN.TOPICS) LEARN.TOPICS[key].examples.forEach(function (ex) { count++; fails.push(RUN.run(L2, typeof ex.code === 'string' ? ex.code : ex.code[L2], ex.inputs).then((function (L3, k) { return function (r) { var got = r.error ? r.error.kind : 'ok', want = typeof ex.expect === 'string' ? ex.expect : ex.expect[L3]; return got === want ? null : L3 + ' learn ' + k + ': expected ' + want + ', got ' + got + (r.error ? ' ' + r.error.message : '') + ' | ' + r.out.join(' / '); }; })(L2, key))); });
      fails = (await Promise.all(fails.map(function (f) { return Promise.resolve(f); }))).filter(Boolean);
      for (var lv of allLevels()) if (!lv.boss && !LEARN.LEVEL[lv.id]) fails.push('no Learn topic for level ' + lv.id);
      var res = { tasks: count, fails: fails.length, first: fails.slice(0, 12) };
      console.log('PD selftest', JSON.stringify(res, null, 1));
      return res;
    })();
  }
})();
