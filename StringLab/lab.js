// String Lab (Year 9, 2.5 String Manipulation). Two activities, each in levels; a level is passed with clean rounds
// in a row, and any mistake means that round does not count (the real output and the reason are shown). Every
// output comes from running the program in shared/pseudocode-engine.js. Every round posts BC_APP_RESULT, which the
// lesson slide saves as its answer. Nothing waits for requestAnimationFrame: a lesson preloads the app hidden.
//   predict  type exactly what a short program outputs. Level 1 LENGTH, level 2 UCASE and LCASE, level 3 both,
//            with IF tests on the value on the line and on capital letters.
//   check    a program checks what the user types. Mark each of five inputs Accepted or Rejected, then run it.
//            Level 1 at least n characters, level 2 the other length tests, level 3 capital letters, level 4 both.
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var ACTIVITY = params.get('activity') || '';
  var host = document.getElementById('activity');

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === 'class') node.className = attrs[k]; else node.setAttribute(k, attrs[k]); });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ICON = {
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17v.5"/></svg>'
  };
  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);
  function say(node, text, kind) { node.className = 'feedback' + (kind ? ' ' + kind : ''); node.innerHTML = text; reportHeight(); }
  function doneBanner(text) { return '<div class="done-banner">' + ICON.done + '<span>' + text + '</span></div>'; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[rnd(0, list.length - 1)]; }
  function shuffle(list) { var o = list.slice(); for (var i = o.length - 1; i > 0; i--) { var j = rnd(0, i), t = o[i]; o[i] = o[j]; o[j] = t; } return o; }
  function results(label, qid) {
    var lines = [], right = 0, done = false, key = 'bc-st-done-v1:' + qid, before = false;
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !ACTIVITY) return;
      var head = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' clean rounds in ' + lines.length + ' tries.';
      try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: qid, label: 'String Lab: ' + label, summary: head + (lines.length ? ' ' + lines.join(' ') : ''), complete: done || before }, '*'); } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; lines.push((lines.length + 1) + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); if (lines.length > 30) lines.shift(); post(); },
      finish: function () { done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); }
    };
  }
  function helpButton(text) {
    var btn = el('button', { type: 'button', class: 'btn ghost small-btn', 'aria-pressed': 'false' }, ICON.help + '<span>Help</span>');
    var box = el('div', { class: 'help-box' });
    box.hidden = true;
    btn.addEventListener('click', function () {
      var on = box.hidden; box.hidden = !on; btn.setAttribute('aria-pressed', String(on));
      box.innerHTML = typeof text === 'function' ? text() : text; reportHeight();
    });
    return { btn: btn, box: box, hide: function () { box.hidden = true; btn.setAttribute('aria-pressed', 'false'); } };
  }
  function levelRange(max) {
    var first = Math.min(max, Math.max(1, parseInt(params.get('level'), 10) || 1));
    var last = Math.min(max, Math.max(first, parseInt(params.get('upto'), 10) || max));
    return [first, last];
  }
  // Run a program; inputs are the values typed in. Returns the outputs as strings.
  function run(lines, inputs) {
    var r = PseudocodeEngine.runPseudocode(lines.join('\n'), {}, 5000, (inputs || []).map(String));
    if (r.error) throw new Error(r.error.message + '\n' + lines.join('\n'));
    return r.outputs.map(String);
  }
  function show(lines) { return esc(lines.join('\n')).replace(/&lt;-/g, '←'); }
  // One box per character with its position; spaces are marked, and changed letters when `before` is given.
  function chars(s, before) {
    return '<div class="chars">' + s.split('').map(function (c, i) {
      var cls = c === ' ' ? ' space' : before && before.charAt(i) !== c ? ' changed' : '';
      return '<span class="ch' + cls + '"><span class="ix">' + (i + 1) + '</span><span class="val">' + (c === ' ' ? ' ' : esc(c)) + '</span></span>';
    }).join('') + '</div>';
  }
  function unquote(s) { s = String(s).trim(); var m = /^(["'])(.*)\1$/.exec(s); return m ? m[2] : s; }

  var activities = {};

  // ================================================================ predict: type exactly what it outputs
  var WORDS = ['Hat Yai', 'Room 12B', 'Mai Tran', 'Year 9!', 'pass word', 'A-12', 'Song Kran', 'Bangkok', 'Ice cream', 'Level 3', 'My Cat',
    'Hello World', 'Thai Food', 'x = 5', 'Big Data', 'Go Team', 'Sea View', 'Top 10', 'Map Room', 'Lab 7a', 'Blue Sky', 'Pad Thai'];
  var PRED_LEVELS = [
    { need: 3, about: 'What does LENGTH output? Every character counts.' },
    { need: 3, about: 'UCASE and LCASE. Type the output exactly, with the right capital letters.' },
    { need: 3, about: 'Both together, and IF tests. Follow the program exactly.' }
  ];
  function predictRound(level) {
    var w = pick(WORDS), v = pick(['Word', 'Name', 'Text']);
    var top = ['DECLARE ' + v + ' : STRING', v + ' <- "' + w + '"'];
    var kind, lines, why;
    if (level === 1) kind = 'len';
    else if (level === 2) kind = pick(['up', 'low']);
    else kind = pick(['lenup', 'ifcase', 'ifexact', 'iflen', 'store']);
    if (kind === 'len') { lines = top.concat(['OUTPUT LENGTH(' + v + ')']); why = function (o) { return '"' + esc(w) + '" has ' + o + ' characters. Spaces, digits and symbols count too.'; }; }
    if (kind === 'up' || kind === 'low') {
      var f = kind === 'up' ? 'UCASE' : 'LCASE';
      lines = top.concat(['OUTPUT ' + f + '(' + v + ')']);
      why = function () { return f + ' changes only the letters, to ' + (kind === 'up' ? 'capitals' : 'small letters') + '. Digits, spaces and symbols stay the same.'; };
    }
    if (kind === 'lenup') { lines = top.concat(['OUTPUT LENGTH(UCASE(' + v + '))']); why = function (o) { return 'UCASE changes letters, not how many characters there are. Still ' + o + '.'; }; }
    if (kind === 'ifcase' || kind === 'ifexact') {
      var lit = pick([w.toUpperCase(), w.toLowerCase(), w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()]);
      var cond = kind === 'ifcase' ? pick(['UCASE', 'LCASE']) + '(' + v + ') = "' + lit + '"' : v + ' = "' + lit + '"';
      lines = top.concat(['IF ' + cond + ' THEN', '    OUTPUT "Match"', 'ELSE', '    OUTPUT "No match"', 'ENDIF']);
      why = function (o) { return '= compares every character, and a capital letter is a different character from a small one. So it is ' + (o === 'Match' ? 'TRUE' : 'FALSE') + '.'; };
    }
    if (kind === 'iflen') {
      var n = w.length + pick([-1, 0, 0, 1]), op = pick(['>', '>=']);
      lines = top.concat(['IF LENGTH(' + v + ') ' + op + ' ' + n + ' THEN', '    OUTPUT "Long"', 'ELSE', '    OUTPUT "Short"', 'ENDIF']);
      why = function () { return 'LENGTH is ' + w.length + '. Is ' + w.length + ' ' + op + ' ' + n + '? Check the value on the line carefully.'; };
    }
    if (kind === 'store') {
      var f2 = pick(['UCASE', 'LCASE']);
      lines = ['DECLARE ' + v + ' : STRING', 'DECLARE Copy : STRING', top[1], 'Copy <- ' + f2 + '(' + v + ')', 'OUTPUT ' + v];
      why = function () { return f2 + ' gives a new string, stored in Copy. ' + v + ' itself never changed.'; };
    }
    var out = run(lines)[0];
    return { lines: lines, out: out, word: w, kind: kind, why: why(out) };
  }
  activities.predict = function () {
    var range = levelRange(PRED_LEVELS.length), level = range[0], last = range[1];
    var log = results('predict the output, levels ' + range[0] + ' to ' + range[1], 'string-predict-' + range[0] + '-' + range[1]);
    var lead = el('p', { class: 'task-q' }), help = helpButton('<ol><li>LENGTH counts every character: letters, digits, spaces and symbols.</li><li>UCASE makes every letter a capital. LCASE makes every letter small. Nothing else changes.</li><li>= is TRUE only when every character is the same, capitals too.</li><li>Type the output only, with no quote marks.</li></ol>');
    var head = el('div', { class: 'head-row' }), brief = el('div', { class: 'brief' }), prog = el('pre', { class: 'prog' }), ask = el('div', { class: 'ask' }), boxes = el('div'), bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, brief, prog, ask, boxes, bar, fb].forEach(function (n) { host.appendChild(n); });
    var R, streak = 0, answered;
    window.__stringLab = function () { return { level: level, R: R, streak: streak }; };
    function start() {
      var cfg = PRED_LEVELS[level - 1];
      R = predictRound(level); answered = false; help.hide();
      lead.innerHTML = '<span class="round">Level ' + level + ' of ' + last + '</span><span class="score">Right in a row: <b>' + streak + '</b> of ' + cfg.need + '</span>';
      brief.innerHTML = cfg.about;
      prog.innerHTML = show(R.lines);
      ask.innerHTML = '<label class="menu-q" for="st-ans">Predict first: what does it output?</label>';
      var input = el('input', { id: 'st-ans', class: 'answer-in', autocomplete: 'off', spellcheck: 'false' });
      var go = el('button', { type: 'button', class: 'btn' }, ICON.play + '<span>Run it</span>');
      go.addEventListener('click', function () { answer(input); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') answer(input); });
      ask.appendChild(input); ask.appendChild(go);
      boxes.innerHTML = ''; bar.innerHTML = ''; say(fb, '', '');
      reportHeight();
    }
    function answer(input) {
      if (answered) return;
      var given = unquote(input.value);
      if (!given) { say(fb, 'Type what the program outputs.', 'hint'); input.focus(); return; }
      answered = true;
      var right = given === R.out;
      input.disabled = true; ask.querySelector('button').disabled = true;
      input.classList.add(right ? 'good' : 'bad');
      var pic = '<p class="small" style="margin:4px 0 0">"' + esc(R.word) + '"</p>' + chars(R.word);
      if (R.kind === 'up' || R.kind === 'low') pic += '<p class="small" style="margin:4px 0 0">Output</p>' + chars(R.out, R.word);
      boxes.innerHTML = pic;
      var caseOnly = !right && given.toLowerCase() === R.out.toLowerCase();
      log.add('level ' + level + ', ' + R.lines[R.lines.length - 1].trim() + ' with "' + R.word + '": said ' + given + ', it was ' + R.out, right);
      streak = right ? streak + 1 : 0;
      say(fb, (right ? '<b>Right.</b> ' : '<b>Not this time.</b> It outputs <b>' + esc(R.out) + '</b>. ' + (caseOnly ? 'Look at the capital letters. ' : '')) + R.why + (right ? '' : ' This round does not count.'), right ? '' : 'bad');
      bar.innerHTML = '';
      if (right && streak >= PRED_LEVELS[level - 1].need) {
        if (level >= last) { log.finish(); bar.innerHTML = doneBanner('Done: you can predict what LENGTH, UCASE and LCASE do.'); reportHeight(); return; }
        level++; streak = 0;
        say(fb, fb.innerHTML + ' <b>Level passed.</b>', '');
      }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next program</span>' + ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      reportHeight();
    }
    start();
  };

  // ================================================================ check: Accepted or Rejected?
  var SYL = ['ka', 'mo', 'ri', 'ta', 'ne', 'su', 'lo', 'pi', 'da', 've', 'zu', 'ho'];
  function wordOf(len, space) {
    var s = '';
    while (s.length < len) s += pick(SYL);
    s = s.slice(0, len);
    if (len >= 4 && Math.random() < 0.5) s = s.slice(0, len - 1) + rnd(1, 9);
    if (space && len >= 5) { var at = rnd(2, len - 3); s = s.slice(0, at) + ' ' + s.slice(at + 1); }
    return s;
  }
  var CHECK_LEVELS = [
    { need: 2, about: 'The program checks how many characters were typed.' },
    { need: 2, about: 'Other length checks. Read the operator carefully.' },
    { need: 2, about: 'The program checks a word. Watch the capital letters.' },
    { need: 2, about: 'Two checks, one inside the other.' }
  ];
  function checkRound(level) {
    var lines, inputs, rule;
    if (level === 1 || level === 2) {
      var n = rnd(5, 9), op = level === 1 ? '>=' : pick(['>', '<=', '<']), v = level === 1 ? 'Password' : pick(['Username', 'Nickname', 'Code']);
      rule = level === 1 ? 'A password must have at least ' + n + ' characters.' : '';
      lines = ['DECLARE ' + v + ' : STRING', 'INPUT ' + v, 'IF LENGTH(' + v + ') ' + op + ' ' + n + ' THEN', '    OUTPUT "Accepted"', 'ELSE', '    OUTPUT "Rejected"', 'ENDIF'];
      inputs = shuffle([wordOf(n - 1), wordOf(n), wordOf(n, true), wordOf(n + 1, Math.random() < 0.5), wordOf(pick([n - 2, n + 2, n + 3]))]);
    } else if (level === 3) {
      var target = pick(['paris', 'yes', 'blue', 'tokyo', 'green', 'lima']), up = target.toUpperCase(), cap = up.charAt(0) + target.slice(1);
      var form = pick(['up', 'low', 'none', 'trap']);
      var cond = form === 'up' ? 'UCASE(Answer) = "' + up + '"' : form === 'low' ? 'LCASE(Answer) = "' + target + '"' : form === 'none' ? 'Answer = "' + cap + '"' : 'UCASE(Answer) = "' + cap + '"';
      lines = ['DECLARE Answer : STRING', 'INPUT Answer', 'IF ' + cond + ' THEN', '    OUTPUT "Accepted"', 'ELSE', '    OUTPUT "Rejected"', 'ENDIF'];
      var mixed = target.split('').map(function (c, i) { return i % 2 ? c.toUpperCase() : c; }).join('');
      inputs = shuffle([target, up, cap, mixed, target.slice(0, -1)]);
    } else {
      var m = rnd(3, 5), bad = pick(['admin', 'guest', 'teacher']);
      lines = ['DECLARE User : STRING', 'INPUT User', 'IF LENGTH(User) < ' + m + ' THEN', '    OUTPUT "Rejected"', 'ELSE', '    IF LCASE(User) = "' + bad + '" THEN', '        OUTPUT "Rejected"', '    ELSE',
        '        OUTPUT "Accepted"', '    ENDIF', 'ENDIF'];
      inputs = shuffle([bad.charAt(0).toUpperCase() + bad.slice(1), bad.toUpperCase(), wordOf(m - 1), wordOf(m), bad + rnd(1, 9)]);
    }
    var outs = inputs.map(function (s) { return run(lines, [s])[0]; });
    return { lines: lines, inputs: inputs, outs: outs, rule: rule };
  }
  activities.check = function () {
    var range = levelRange(CHECK_LEVELS.length), level = range[0], last = range[1];
    var log = results('accepted or rejected, levels ' + range[0] + ' to ' + range[1], 'string-check-' + range[0] + '-' + range[1]);
    var lead = el('p', { class: 'task-q' }), help = helpButton('<ol><li>Count every character of the input, spaces too.</li><li>Put that number into the IF line. Equal is not more, and equal is not less.</li><li>UCASE or LCASE changes the input first. Then = compares every character, capitals too.</li></ol>');
    var head = el('div', { class: 'head-row' }), brief = el('div', { class: 'brief' }), prog = el('pre', { class: 'prog' }), tbl = el('div'), bar = el('div', { class: 'actions' }), fb = el('div', { class: 'feedback', role: 'status' });
    head.appendChild(lead); head.appendChild(help.btn);
    [head, help.box, brief, prog, tbl, bar, fb].forEach(function (n) { host.appendChild(n); });
    var R, picks, streak = 0, answered;
    window.__stringLab = function () { return { level: level, R: R, picks: picks, streak: streak }; };
    function draw(done) {
      tbl.innerHTML = '<table class="inputs"><tr><th>Typed in</th><th>LENGTH</th><th>Your prediction</th>' + (done ? '<th>It outputs</th>' : '') + '</tr>' + R.inputs.map(function (s, i) {
        var mine = picks[i];
        return '<tr><td class="typed">"' + esc(s) + '"</td><td>' + (done ? s.length : '?') + '</td><td>' +
          ['Accepted', 'Rejected'].map(function (k) { return '<button type="button" class="choice' + (mine === k ? ' on' : '') + '" data-row="' + i + '" data-v="' + k + '"' + (done ? ' disabled' : '') + '>' + k + '</button>'; }).join(' ') + '</td>' +
          (done ? '<td class="res ' + (mine === R.outs[i] ? 'good' : 'bad') + '">' + R.outs[i] + '</td>' : '') + '</tr>';
      }).join('') + '</table>';
      reportHeight();
    }
    tbl.addEventListener('click', function (e) {
      var b = e.target.closest('.choice');
      if (!b || answered) return;
      picks[+b.getAttribute('data-row')] = b.getAttribute('data-v');
      draw(false);
    });
    function start() {
      var cfg = CHECK_LEVELS[level - 1];
      R = checkRound(level); picks = R.inputs.map(function () { return null; }); answered = false; help.hide();
      lead.innerHTML = '<span class="round">Level ' + level + ' of ' + last + '</span><span class="score">Clean rounds in a row: <b>' + streak + '</b> of ' + cfg.need + '</span>';
      brief.innerHTML = cfg.about + (R.rule ? ' ' + R.rule : '') + ' Predict each output, then run the program.';
      prog.innerHTML = show(R.lines);
      draw(false);
      bar.innerHTML = '';
      var go = el('button', { type: 'button', class: 'btn' }, ICON.play + '<span>Run it for all five</span>');
      go.addEventListener('click', check);
      bar.appendChild(go);
      say(fb, '', '');
    }
    function check() {
      if (answered) return;
      if (picks.some(function (p) { return !p; })) { say(fb, 'Predict every row first.', 'hint'); return; }
      answered = true;
      var wrong = R.inputs.filter(function (s, i) { return picks[i] !== R.outs[i]; });
      var right = !wrong.length;
      draw(true);
      log.add('level ' + level + ', ' + R.lines[2].trim() + (wrong.length ? ': wrong for ' + wrong.map(function (s) { return '"' + s + '"'; }).join(', ') : ''), right);
      streak = right ? streak + 1 : 0;
      var why = wrong.length ? ' Look again at "' + esc(wrong[0]) + '": it has ' + wrong[0].length + ' characters' + (level >= 3 ? ', and ' + (/LCASE/.test(R.lines.join(' ')) ? 'LCASE gives "' + esc(wrong[0].toLowerCase()) + '"' : /UCASE/.test(R.lines.join(' ')) ? 'UCASE gives "' + esc(wrong[0].toUpperCase()) + '"' : 'nothing changes its capitals') : '') + '.' : '';
      say(fb, right ? '<b>Right.</b> Every prediction matches.' : '<b>Not this time.</b> ' + wrong.length + ' prediction' + (wrong.length > 1 ? 's were' : ' was') + ' wrong.' + why + ' This round does not count.', right ? '' : 'bad');
      bar.innerHTML = '';
      if (right && streak >= CHECK_LEVELS[level - 1].need) {
        if (level >= last) { log.finish(); bar.innerHTML = doneBanner('Done: you can predict what a string check accepts.'); reportHeight(); return; }
        level++; streak = 0;
        say(fb, fb.innerHTML + ' <b>Level passed.</b>', '');
      }
      var b = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next program</span>' + ICON.next);
      b.addEventListener('click', start);
      bar.appendChild(b);
      reportHeight();
    }
    start();
  };

  // ================================================================ start
  var LIST = [
    ['predict', 'Predict the Output', 'Type exactly what LENGTH, UCASE and LCASE give.'],
    ['check', 'Accepted or Rejected?', 'Predict what a program that checks the input does with five inputs.']
  ];
  if (activities[ACTIVITY]) { activities[ACTIVITY](); return; }
  host.appendChild(el('h1', {}, 'String Lab'));
  host.appendChild(el('p', { class: 'intro' }, 'Predict what string programs output, and what a check on the input accepts.'));
  var grid = el('div', { class: 'menu-grid' });
  LIST.forEach(function (a) {
    var b = el('button', { type: 'button', class: 'menu-tile' }, '<b>' + a[1] + '</b><span>' + a[2] + '</span>');
    b.addEventListener('click', function () { location.search = '?activity=' + a[0] + (params.get('bcv') ? '&bcv=' + encodeURIComponent(params.get('bcv')) : ''); });
    grid.appendChild(b);
  });
  host.appendChild(grid);
  reportHeight();
})();
