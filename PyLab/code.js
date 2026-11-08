// Write or fix a program. ?activity=write (2.1: variables with the right data types), ?activity=fix (2.2: a program
// with an input or output mistake) or ?activity=iowrite (2.2: programs that use input() and print()). Run tries the
// program as often as you like. Check runs it on the sample and on hidden inputs and compares what it prints with a
// correct program (both in real Python); it also checks the variables and how they are made. Three checks per task:
// after the third miss the task comes back with new values. Each task is harder than the one before.
(function () {
  'use strict';
  var el = PL.el, esc = PL.esc, B = PLBANK;
  var SETS = {
    write: { label: 'write programs with variables', tasks: [B.WRITE.store, B.WRITE.change, B.WRITE.calc], done: 'Done: you can store values with the right data types.' },
    fix: { label: 'fix input and output programs', tasks: [B.FIX.add, B.FIX.stored, B.FIX.price, B.FIX.nextyear], done: 'Done: you can fix programs that use input().' },
    iowrite: { label: 'write input and output programs', tasks: [B.IOWRITE.hello, B.IOWRITE.total, B.IOWRITE.cost, B.IOWRITE.future], done: 'Done: you can write programs that ask, work it out and print.' }
  };
  var CHECKS = 3;
  function an(w) { return (/^[AEIOUaeiou]/.test(w) ? 'an ' : 'a ') + w; }
  function trimLines(a) { return a.map(function (l) { return l.replace(/\s+$/, ''); }); }

  // Compares a run with the correct program's run on the same inputs; '' when it matches.
  function compare(r, want, inputs, k, n) {
    var got = trimLines(r.out), exp = trimLines(want.out);
    var said = inputs.length ? 'the user typed ' + inputs.join(' then ') : 'it ran';
    var tag = n > 1 ? (k === 0 ? 'Sample: ' : 'Test ' + (k + 1) + ': ') : '';
    if (r.error) return tag + (tag ? 'when ' : 'When ') + said + ', your program stopped. ' + r.error;
    if (got.join('\n') === exp.join('\n')) return '';
    return tag + (tag ? 'when ' : 'When ') + said + ', your program printed <code>' + (esc(got.join(' / ')) || 'nothing') + '</code>. It should print <code>' + esc(exp.join(' / ')) + '</code>.';
  }

  function coder(host, set) {
    var S = SETS[set];
    var lead = el('p', { class: 'task-q' }), brief = el('div', { class: 'brief big' }), sample = el('div');
    var cols = el('div', { class: 'two-col code-cols' }), left = el('div'), right = el('div');
    var ta = el('textarea', { class: 'editor', rows: '7', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Your Python program' });
    var acts = el('div', { class: 'actions tight' }), shown = el('div'), fb = el('div', { class: 'feedback', role: 'status' }), bar = el('div', { class: 'actions' });
    left.appendChild(ta); left.appendChild(acts); right.appendChild(sample); right.appendChild(shown);
    cols.appendChild(left); cols.appendChild(right);
    [lead, brief, cols, fb, bar].forEach(function (n) { host.appendChild(n); });
    ta.addEventListener('keydown', PL.editorKeys);
    var runBtn = el('button', { type: 'button', class: 'btn secondary' }, PL.ICON.play + '<span>Run</span>');
    var checkBtn = el('button', { type: 'button', class: 'btn' }, PL.ICON.check + '<span>Check</span>');
    var resetBtn = el('button', { type: 'button', class: 'btn ghost' }, '<span>Start again</span>');
    var left3 = el('span', { class: 'score' });
    [runBtn, checkBtn, resetBtn, left3].forEach(function (b) { acts.appendChild(b); });
    var t = 0, task = null, checks = 0, busy = false, log = PL.results(S.label);
    PL.peek = function () { return { t: t, task: task, checks: checks, ta: ta }; };

    function header() {
      lead.innerHTML = '<span class="round">Task ' + (t + 1) + ' of ' + S.tasks.length + '</span><b>' + esc(task.title) + '</b>';
      left3.innerHTML = 'Checks left: <b>' + (CHECKS - checks) + '</b>';
    }
    function load(keepCode) {
      task = S.tasks[t](); checks = 0;
      header();
      brief.innerHTML = task.brief;
      if (!keepCode) ta.value = task.starter;
      shown.innerHTML = ''; PL.say(fb, '', ''); bar.innerHTML = '';
      sample.innerHTML = '';
      runBtn.disabled = checkBtn.disabled = false;
      if (task.tests[0].length) {
        PL.run(task.ref, task.tests[0]).then(function (r) {
          sample.innerHTML = '<div class="screen sample-run"><div class="screen-title">Sample: what the screen should show</div>' +
            r.prompts.map(function (p) { return '<div class="scr-in"><span class="dim">(a question)</span><b>' + esc(p.typed) + '</b></div>'; }).join('') +
            r.out.map(function (l) { return '<div class="scr-out">' + esc(l) + '</div>'; }).join('') + '</div>';
          PL.reportHeight();
        });
      }
      PL.reportHeight();
    }
    function setBusy(on) { busy = on; runBtn.disabled = checkBtn.disabled = on; }
    runBtn.addEventListener('click', function () {
      if (busy) return;
      setBusy(true);
      PL.run(ta.value, task.tests[0]).then(function (r) { setBusy(false); shown.innerHTML = PL.screen(r); PL.reportHeight(); });
    });
    resetBtn.addEventListener('click', function () {
      if (!resetBtn.dataset.sure) { resetBtn.dataset.sure = '1'; resetBtn.querySelector('span').textContent = 'Clear your code?'; return; }
      delete resetBtn.dataset.sure; resetBtn.querySelector('span').textContent = 'Start again'; ta.value = task.starter;
    });
    checkBtn.addEventListener('click', function () {
      if (busy) return;
      setBusy(true);
      var code = ta.value, problems = [], k = 0, firstRun = null;
      (function nextTest() {
        if (k >= task.tests.length) return finish();
        var inputs = task.tests[k];
        Promise.all([PL.run(code, inputs), PL.run(task.ref, inputs)]).then(function (pair) { // queued one after the other
          if (k === 0) firstRun = pair[0];
          var m = compare(pair[0], pair[1], inputs, k, task.tests.length);
          if (m) problems.push(m);
          k++;
          setTimeout(nextTest, 0);
        });
      })();
      function finish() {
        // Variables: the right data type and value at the end.
        if (firstRun && firstRun.globals) Object.keys(task.vars).forEach(function (name) {
          var want = task.vars[name], v = firstRun.globals[name] || firstRun.globals[name + "_$rw$"]; // Skulpt renames JavaScript words such as name
          if (!v) { problems.push('There is no variable called <b>' + esc(name) + '</b>. Check the spelling.'); return; }
          var type = PL.pyType(v);
          if (type !== want[0]) problems.push('<b>' + esc(name) + '</b> holds ' + an(PL.TYPE_NAME[type] || type) + '. It should hold ' + an(PL.TYPE_NAME[want[0]]) + '.');
          else if (PL.pyValue(v) !== want[1]) problems.push('<b>' + esc(name) + '</b> holds ' + esc(String(PL.pyValue(v))) + '. Read the task again.');
        });
        task.rules.forEach(function (rule) { if (rule.re.test(code) === !!rule.not) problems.push(esc(rule.msg)); });
        setBusy(false);
        shown.innerHTML = firstRun ? PL.screen(firstRun) : '';
        var ok = !problems.length;
        checks++;
        log.add('task ' + (t + 1) + ' (' + task.title + '), check ' + checks + (ok ? '' : ': ' + problems[0].replace(/<[^>]+>/g, '')), ok);
        header();
        if (ok) {
          runBtn.disabled = checkBtn.disabled = true;
          PL.say(fb, '<b>Right.</b> It works for every test' + (task.tests.length > 1 ? ', the hidden ones too' : '') + '.', '');
          if (t + 1 >= S.tasks.length) { log.finish(); bar.innerHTML = PL.doneBanner(S.done); PL.reportHeight(); return; }
          var nb = el('button', { type: 'button', class: 'btn secondary' }, '<span>Next task</span>' + PL.ICON.next);
          nb.addEventListener('click', function () { t++; load(false); });
          bar.appendChild(nb);
        } else if (checks >= CHECKS) {
          runBtn.disabled = checkBtn.disabled = true;
          PL.say(fb, '<b>Not yet.</b> ' + problems[0] + '<br>No checks left. The task starts again with new values. Your code stays, so change it to fit.', 'bad');
          var rb = el('button', { type: 'button', class: 'btn secondary' }, '<span>Try it with new values</span>' + PL.ICON.next);
          rb.addEventListener('click', function () { load(true); });
          bar.appendChild(rb);
        } else {
          PL.say(fb, '<b>Not yet.</b> ' + problems[0] + (problems.length > 1 ? ' <span class="dim">(' + (problems.length - 1) + ' other check' + (problems.length > 2 ? 's' : '') + ' failed too.)</span>' : ''), 'bad');
        }
        PL.reportHeight();
      }
    });
    load(false);
  }
  PL.activities.write = function (host) { coder(host, 'write'); };
  PL.activities.fix = function (host) { coder(host, 'fix'); };
  PL.activities.iowrite = function (host) { coder(host, 'iowrite'); };
})();
