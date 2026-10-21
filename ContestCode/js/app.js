// Contest Code: the page. A problem statement, a Python editor, Run (the sample) and Submit (all five tests, scored
// like ACSL: one point per output line that matches). The code is kept in this browser per problem.
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var embed = params.get('embed') === '1';
  var app = document.getElementById('app');
  var only = params.get('problem');
  var list = CC_PROBLEMS.filter(function (p) { return !only || p.id === only; });
  if (!list.length) list = CC_PROBLEMS;
  var current = list[0];
  var STARTER = 'line = input()\n\n# Print the five answers, one per line.\n';

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function saveKey(p) { return 'bc-contestcode-v1:' + p.id; }
  function loadCode(p) { try { return localStorage.getItem(saveKey(p)) || STARTER; } catch (e) { return STARTER; } }
  function saveCode(p, code) { try { localStorage.setItem(saveKey(p), code); } catch (e) {} }
  function reportHeight() {
    if (window.parent === window) return;
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(app.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(app);

  // ------------------------------------------------------------------ running Python
  function runPython(code, inputLine) {
    return new Promise(function (resolve) {
      var out = '', given = false;
      Sk.configure({
        output: function (t) { out += t; },
        read: function (x) {
          if (Sk.builtinFiles && Sk.builtinFiles.files[x]) return Sk.builtinFiles.files[x];
          throw new Error("File not found: '" + x + "'");
        },
        inputfun: function () { var v = given ? '' : inputLine; given = true; return v; },
        inputfunTakesPrompt: true,
        __future__: Sk.python3,
        execLimit: 5000,
        yieldLimit: 100
      });
      Sk.misceval.asyncToPromise(function () { return Sk.importMainWithBody('<stdin>', false, code, true); })
        .then(function () { resolve({ out: out }); }, function (e) {
          var msg = e && e.toString ? e.toString() : String(e);
          if (/TimeLimitError|TimeoutError|run time limit/.test(msg)) msg = 'Your program ran for more than 5 seconds. Is a loop stuck?';
          resolve({ out: out, error: msg });
        });
    });
  }
  function linesOf(out) {
    var l = String(out).replace(/\r/g, '').split('\n').map(function (s) { return s.replace(/\s+$/, ''); });
    while (l.length && l[l.length - 1] === '') l.pop();
    return l;
  }
  function marks(expected, got) { return expected.map(function (e, i) { return got[i] != null && got[i].trim() === e; }); }

  // ------------------------------------------------------------------ the page
  function render() {
    app.innerHTML = '';
    var page = el('div', { class: 'cc' });
    if (!embed || list.length > 1) {
      var head = el('div', { class: 'cc-head' });
      if (!embed) head.appendChild(el('h1', {}, 'Contest Code'));
      if (list.length > 1) {
        var tabs = el('div', { class: 'tabs', role: 'tablist' });
        list.forEach(function (p) {
          var t = el('button', { type: 'button', role: 'tab', 'aria-selected': String(p === current) }, esc(p.title));
          t.addEventListener('click', function () { current = p; render(); });
          tabs.appendChild(t);
        });
        head.appendChild(tabs);
      }
      page.appendChild(head);
    }
    var grid = el('div', { class: 'cc-grid' });
    var p = current, sample = p.solve(p.tests[0]);
    var task = el('section', { class: 'task' });
    task.innerHTML = '<h2>' + esc(p.title) + '</h2><p>' + esc(p.story) + '</p>' +
      '<h3>Input</h3><p>' + esc(p.input) + ' Read it with <code>input()</code>.</p>' +
      '<h3>Output: five lines</h3><ol>' + p.outputs.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ol>' +
      '<h3>Sample</h3><div class="sample"><div><span>Input</span><pre>' + esc(p.tests[0]) + '</pre></div><div><span>Output</span><pre>' + esc(sample.join('\n')) + '</pre></div></div>' +
      '<p class="muted">Submit runs your program on the sample and four more inputs you cannot see. Each line that matches scores 1 point: 25 points in all.</p>' +
      '<details class="py-help"><summary>Python you may need</summary><pre>' + esc([
        'words = line.split()       # a list of the words',
        'len(words)                 # how many items',
        'for w in words:            # each word in turn',
        'w.lower()   w.upper()      # change the case',
        'w[0]   w[-1]   w[1:3]      # letters by position',
        'ch in "aeiou"              # True if ch is a vowel',
        'int(x)   str(n)            # text to number, number to text',
        'ord("A")   chr(66)         # 65, and "B"',
        'print(answer)              # one answer per line'].join('\n')) + '</pre></details>';
    grid.appendChild(task);

    var work = el('section', { class: 'work' });
    var ta = el('textarea', { class: 'editor', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Your Python program', rows: '16' });
    ta.value = loadCode(p);
    ta.addEventListener('input', function () { saveCode(p, ta.value); });
    ta.addEventListener('keydown', editorKeys);
    work.appendChild(ta);
    var actions = el('div', { class: 'actions' });
    var runBtn = el('button', { type: 'button', class: 'btn secondary' }, '<span>Run on the sample</span>');
    var subBtn = el('button', { type: 'button', class: 'btn' }, '<span>Submit</span>');
    var resetBtn = el('button', { type: 'button', class: 'btn ghost' }, '<span>Start again</span>');
    actions.appendChild(runBtn); actions.appendChild(subBtn); actions.appendChild(resetBtn);
    work.appendChild(actions);
    var result = el('div', { class: 'result', role: 'status', 'aria-live': 'polite' });
    work.appendChild(result);
    grid.appendChild(work);
    page.appendChild(grid);
    app.appendChild(page);
    reportHeight();

    resetBtn.addEventListener('click', function () {
      if (!resetBtn.dataset.sure) { resetBtn.dataset.sure = '1'; resetBtn.querySelector('span').textContent = 'Clear your code?'; return; }
      ta.value = STARTER; saveCode(p, STARTER); delete resetBtn.dataset.sure; resetBtn.querySelector('span').textContent = 'Start again';
    });
    runBtn.addEventListener('click', function () {
      busy(true);
      runPython(ta.value, p.tests[0]).then(function (r) {
        busy(false);
        var got = linesOf(r.out), m = marks(sample, got);
        var rows = sample.map(function (e, i) {
          return '<tr class="' + (m[i] ? 'ok' : 'no') + '"><td>' + (i + 1) + '</td><td><code>' + esc(got[i] == null ? '' : got[i]) + '</code></td><td><code>' + esc(e) + '</code></td><td>' + (m[i] ? '&#10003;' : '&#10007;') + '</td></tr>';
        }).join('');
        result.innerHTML = (r.error ? '<p class="err">' + esc(r.error) + '</p>' : '') +
          '<table class="cmp"><thead><tr><th>Line</th><th>Your output</th><th>Sample output</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
          (got.length > 5 ? '<p class="warn">Your program printed ' + got.length + ' lines. Print exactly five.</p>' : '');
        reportHeight();
      });
    });
    subBtn.addEventListener('click', function () {
      busy(true);
      var scores = [], i = 0, errors = [];
      (function next() {
        if (i >= p.tests.length) return done();
        var exp = p.solve(p.tests[i]);
        runPython(ta.value, p.tests[i]).then(function (r) {
          if (r.error) errors.push(r.error);
          scores.push(marks(exp, linesOf(r.out)));
          i++;
          setTimeout(next, 0);
        });
      })();
      function done() {
        busy(false);
        var total = scores.reduce(function (a, s) { return a + s.filter(Boolean).length; }, 0);
        var html = '<div class="score"><b>' + total + ' / 25</b><span>' + (total === 25 ? 'Full marks.' : 'Find the lines that do not match. Make up your own inputs to test them.') + '</span></div><table class="tests"><tbody>' +
          scores.map(function (s, k) {
            return '<tr><th>' + (k === 0 ? 'Sample' : 'Test ' + (k + 1)) + '</th>' + s.map(function (ok, j) { return '<td class="' + (ok ? 'ok' : 'no') + '" title="Line ' + (j + 1) + '">' + (ok ? '&#10003;' : '&#10007;') + '</td>'; }).join('') +
              '<td class="n">' + s.filter(Boolean).length + '/5</td></tr>';
          }).join('') + '</tbody></table>' + (errors.length ? '<p class="err">' + esc(errors[0]) + '</p>' : '');
        result.innerHTML = html;
        try {
          if (window.parent !== window) window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'contest-code-' + p.id, label: 'Contest Code: ' + p.title,
            summary: 'Submitted: ' + total + ' of 25 lines right. ' + scores.map(function (s, k) { return (k === 0 ? 'Sample' : 'Test ' + (k + 1)) + ' ' + s.filter(Boolean).length + '/5'; }).join(', ') + '.', complete: total === 25 }, '*');
        } catch (e) {}
        reportHeight();
      }
    });
    function busy(on) { runBtn.disabled = subBtn.disabled = on; if (on) { result.innerHTML = '<p class="muted">Running...</p>'; reportHeight(); } }
  }

  // Tab indents by four spaces; Enter keeps the indent and adds four after a colon.
  function editorKeys(e) {
    var ta = e.target, s = ta.selectionStart, end = ta.selectionEnd, v = ta.value;
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ta.value = v.slice(0, s) + '    ' + v.slice(end); ta.selectionStart = ta.selectionEnd = s + 4; ta.dispatchEvent(new Event('input')); }
    else if (e.key === 'Enter') {
      var lineStart = v.lastIndexOf('\n', s - 1) + 1, line = v.slice(lineStart, s);
      var indent = (line.match(/^ */) || [''])[0] + (/:\s*$/.test(line) ? '    ' : '');
      e.preventDefault();
      ta.value = v.slice(0, s) + '\n' + indent + v.slice(end);
      ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
      ta.dispatchEvent(new Event('input'));
    }
  }

  render();
})();
