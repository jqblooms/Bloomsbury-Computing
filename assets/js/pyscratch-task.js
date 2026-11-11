/*
 * PyScratch Tasks: a small, self-checking Cambridge pseudocode task on a lesson slide.
 * Loaded by scratch/editor.html only with ?pstask=<id>, after the task data file
 * (PyScratchTask/tasks/<lesson>.js, which adds to window.PyScratchTasks) and pyscratch.js.
 * pyscratch.js calls window.PyScratchTaskBoot(api) once its editor is ready.
 *
 * The task's checks run the student's program for real (green flag, the same engine) and look at what
 * happened: OUTPUT lines, every sprite command and its values, where the sprite ended, the variables
 * left at the end and any error. RANDOM can be forced to its smallest or largest value, INPUT is
 * answered from a list, and a CONSTANT's value can be swapped to prove the program uses it.
 * A pass posts BC_APP_RESULT (the slide saves it as its answer). Format: the shell's docs/pyscratch.md.
 */
(function () {
  'use strict';
  if (!/[?&]pstask=/.test(location.search)) return;

  var params = new URLSearchParams(location.search);
  var TASK_ID = params.get('pstask') || '';
  var RUN_LIMIT_MS = 4000;

  function findTask() {
    var list = window.PyScratchTasks || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === TASK_ID) return list[i];
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // ---------------------------------------------------------------- reading the program
  var PY = false;   // the task's language is Python (task.lang 'python'); otherwise Cambridge pseudocode
  function stripComment(line) {
    var out = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') q = !q;
      if (!q && (PY ? ch === '#' : ch === '/' && line[i + 1] === '/')) break;
      out += ch;
    }
    return out;
  }
  function codeLines(code) { return String(code || '').split('\n').map(stripComment); }

  // Python's own error messages in plain words (the pseudocode engine's are plain already), as PyLab's friendly()
  // in PyLab/common.js. The line stays in the Fail, shown as "Look at line N".
  function plainError(msg, line) {
    msg = String(msg || '');
    if (!PY) return msg;
    var at = line ? ' line ' + line : ' this line';
    var m;
    if (/SyntaxError|ParseError|TokenError|bad input|EOF in multi-line/.test(msg)) return 'Python cannot read' + at + '. Check it is finished, and check the quote marks and brackets.';
    if (/IndentationError|unexpected indent|unindent/.test(msg)) return 'A line starts with spaces it should not have, or is missing them.';
    if (/unsupported operand type\(s\) for [-*\/%]|can't multiply sequence/.test(msg)) return '- * and / only work on numbers. Is one of these a String?';
    if (/concatenate|unsupported operand type\(s\) for \+|must be str|can only concatenate/.test(msg)) return '+ cannot join a String and a number. Is one of them in quote marks?';
    if ((m = /invalid literal for int\(\) with base 10: '([^']*)'/.exec(msg))) return 'int() cannot turn "' + m[1] + '" into a whole number.';
    if ((m = /could not convert string to float: '?([^']*)'?/.exec(msg))) return 'float() cannot turn "' + m[1] + '" into a number.';
    if ((m = /NameError: name '([^']+)' is not defined/.exec(msg))) return 'Python does not know ' + m[1] + '. If ' + m[1] + ' is text, put quote marks round it. If it is a variable, give it a value first and check the spelling.';
    if (/ZeroDivisionError/.test(msg)) return 'The program divides by 0.';
    // Anything else: drop the Python error name and the long hint after it.
    return msg.replace(/^\w+Error:\s*/, '').replace(/\. (To join|Check the spelling|Add global|Use int)[\s\S]*$/, '.');
  }

  // A check failed: what was seen, what was expected, and the line (0 = no line).
  function Fail(saw, expected, line) { this.saw = saw; this.expected = expected; this.line = line || 0; }

  function makeToolkit(api, task, code) {
    var S = api.S, lines = codeLines(code);
    var T = {
      code: code,
      lines: lines,
      fail: function (saw, expected, line) { return new Fail(saw, expected, line); },
      // The first line (1-based) whose code matches re, or 0.
      lineOf: function (re) {
        for (var i = 0; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
        return 0;
      },
      // The data type a DECLARE line gives name, or null.
      declared: function (name) {
        for (var i = 0; i < lines.length; i++) {
          var m = /^\s*DECLARE\s+(.+?)\s*:\s*([A-Z]+)\s*$/.exec(lines[i]);
          if (!m) continue;
          var names = m[1].split(',').map(function (x) { return x.trim(); });
          if (names.indexOf(name) !== -1) return { type: m[2], line: i + 1 };
        }
        return null;
      },
      // A CONSTANT line for name: { value, line }, or null.
      constant: function (name) {
        for (var i = 0; i < lines.length; i++) {
          var m = /^\s*CONSTANT\s+(\w+)\s*(<-|=)\s*(.+?)\s*$/.exec(lines[i]);
          if (m && m[1] === name) return { value: m[3], line: i + 1 };
        }
        return null;
      },
      // The program with the first line matching re replaced by line (Python: start a variable at another value).
      withLine: function (re, line) {
        var all = String(code).split('\n');
        for (var i = 0; i < all.length; i++) if (re.test(stripComment(all[i]))) { all[i] = line; break; }
        return all.join('\n');
      },
      // The program with name's CONSTANT value changed, to show every line uses the constant.
      withConstant: function (name, value) {
        var c = T.constant(name);
        if (!c) return code;
        var all = String(code).split('\n');
        all[c.line - 1] = all[c.line - 1].replace(/(<-|=)\s*[^/]*?(\s*(\/\/.*)?)$/, '$1 ' + value + '$2');
        return all.join('\n');
      },
      // Runs the program once. opts: random 'min' | 'max', inputs [values for INPUT], code (another version),
      // allowError. Resolves to { out, error, timedOut, calls, randoms, sprite, start, vars }.
      // An error or a program that never ends fails the check, unless allowError.
      run: function (opts) {
        opts = opts || {};
        return runOnce(api, task, opts).then(function (r) {
          if (!opts.allowError) {
            var f = T.stopped(r);
            if (f) throw f;
          }
          return r;
        });
      },
      // The failure for a run that stopped with an error or never ended, or null.
      stopped: function (r) {
        if (r.error) return new Fail('Your program stopped: ' + plainError(r.error.msg, r.error.line), 'A program that runs to the end with no error', r.error.line);
        if (r.timedOut) return new Fail('Your program was still running after ' + (RUN_LIMIT_MS / 1000) + ' seconds', 'A program that ends. Does a loop never stop?', 0);
        return null;
      },
      // Sprite commands of one kind, from a run: [[arg1, arg2, ...], ...].
      callsTo: function (r, fn) {
        return r.calls.filter(function (c) { return c.fn === fn; }).map(function (c) { return c.args; });
      },
      num: function (v) { return Math.round(Number(v) * 1000) / 1000; }
    };
    return T;
  }

  // ---------------------------------------------------------------- running it
  var running = null;

  function skValue(v) {
    if (!window.Sk || v == null) return null;
    try {
      if (v instanceof Sk.builtin.bool) return { type: 'BOOLEAN', value: v.v ? true : false };
      if (v instanceof Sk.builtin.int_) return { type: 'INTEGER', value: Number(Sk.ffi.remapToJs(v)) };
      if (v instanceof Sk.builtin.float_) return { type: 'REAL', value: Number(Sk.ffi.remapToJs(v)) };
      if (v instanceof Sk.builtin.str) return { type: 'STRING', value: String(Sk.ffi.remapToJs(v)) };
    } catch (e) {}
    return null;
  }

  function moduleVars(mod) {
    var vars = {};
    var d = mod && mod.$d;
    if (!d) return vars;
    Object.keys(d).forEach(function (k) {
      if (PY ? k.charAt(0) === '_' : k.indexOf('v_') !== 0) return;
      var val = skValue(d[k]);
      // Skulpt renames globals that are JavaScript words (name is name_$rw$).
      if (val) vars[PY ? k.replace(/_\$rw\$$/, '') : k.slice(2)] = val;
    });
    return vars;
  }

  function runOnce(api, task, opts) {
    var S = api.S;
    var main = task.sprites[0].name;
    return new Promise(function (resolve) {
      var out = [], errs = [], calls = [], mods = {}, randoms = 0;
      var inputs = (opts.inputs || []).slice();
      if (S.running) { try { S.vm.stopAll(); } catch (e) { api.stopAll(); } }
      S.taskOut = out; S.taskErrors = errs; S.taskMods = mods;
      S.taskCode = opts.code != null ? opts.code : null;
      S.taskInput = function () { return inputs.length ? String(inputs.shift()) : ''; };
      S.taskHook = function (fn, sprite, args) {
        calls.push({ fn: fn, sprite: sprite, args: args.slice() });
        if (fn === 'pick_random') {
          if (Number(args[0]) === 0 && Number(args[1]) === 999999) randoms++;
          if (opts.random === 'min') return { value: Number(args[0]) };
          if (opts.random === 'max') return { value: Number(args[1]) };
        }
        if (fn === 'ask' && PY) return null;
        if (fn === 'ask') {
          S.lastAnswer = inputs.length ? String(inputs.shift()) : '';
          return { value: S.lastAnswer };
        }
        return null;
      };
      var sp0 = task.sprites[0];
      var start = { x: sp0.x || 0, y: sp0.y || 0, direction: sp0.direction == null ? 90 : sp0.direction };
      // startAll puts the sprites back (S.taskReset) and starts every thread.
      api.startAll();
      var startedAt = Date.now();
      var settled = false;
      function finish(timedOut) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        var t3 = api.getTargetByName(main);
        var sprite = t3 ? { x: t3.x, y: t3.y, direction: t3.direction, visible: t3.visible } : null;
        try { S.vm.stopAll(); } catch (e) { api.stopAll(); }
        S.taskHook = null; S.taskInput = null; S.taskOut = null; S.taskErrors = null; S.taskMods = null; S.taskCode = null;
        var text = out.join('');
        var lines = text.split('\n');
        if (lines.length && lines[lines.length - 1] === '') lines.pop();
        var err = errs.length ? errs[0] : null;
        resolve({ out: lines, error: err, timedOut: !!timedOut && !err, calls: calls, randoms: randoms,
          sprite: sprite, start: start, vars: moduleVars(mods[main]), ms: Date.now() - startedAt });
      }
      var timer = setTimeout(function () { finish(true); }, RUN_LIMIT_MS);
      Promise.all(S.runPromises || []).then(function () { setTimeout(function () { finish(false); }, 30); });
    });
  }

  // ---------------------------------------------------------------- the task bar
  var CSS = [
    'html.ps-task-mode [class*="menu-bar_menu-bar"]{display:none!important}',
    'html.ps-task-mode [class*="gui_tab-list"],html.ps-task-mode [class*="react-tabs_react-tabs__tab-list"]{visibility:hidden!important}',
    'html.ps-task-mode [class*="target-pane_target-pane"]{visibility:hidden!important}',
    'html.ps-task-mode #ps-threads,html.ps-task-mode #ps-tut-btn,html.ps-task-mode #ps-help-btn,html.ps-task-mode #ps-lang{display:none!important}',
    '#ps-task{flex-shrink:0;padding:10px 12px 10px;background:var(--ps-panel-2,#18182a);border-bottom:1px solid var(--ps-border,#312d4b);color:var(--ps-text,#cdd6f4);font-size:13px;line-height:1.45;max-height:58%;overflow-y:auto}',
    '#ps-task .pst-head{display:flex;align-items:baseline;gap:8px;margin-bottom:3px}',
    '#ps-task .pst-tag{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ps-accent-bright,#a87fff)}',
    '#ps-task .pst-title{font-size:15px;font-weight:700;color:var(--ps-text-strong,#fff)}',
    '#ps-task .pst-brief{margin:0 0 4px}',
    '#ps-task .pst-todo{margin:0 0 6px;padding-left:18px}',
    '#ps-task .pst-todo li{margin:1px 0}',
    '#ps-task code{font-family:"Roboto Mono","Consolas",monospace;font-size:12px;background:var(--ps-code-bg,#312d4b);padding:1px 4px;border-radius:4px}',
    '#ps-task .pst-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}',
    '#ps-task button{font-family:inherit;font-size:12px;border-radius:6px;padding:5px 11px;cursor:pointer;border:1px solid var(--ps-border-strong,#45456a);background:var(--ps-panel-3,#252537);color:var(--ps-text,#cdd6f4)}',
    '#ps-task button:hover{border-color:var(--ps-accent,#7c5fcf)}',
    '#ps-task button.pst-check{background:var(--ps-accent,#7c5fcf);border-color:var(--ps-accent,#7c5fcf);color:#fff;font-weight:700;font-size:13px}',
    '#ps-task button:disabled{opacity:.6;cursor:default}',
    '#ps-task .pst-help{margin-top:6px;padding:6px 9px;border-radius:6px;background:var(--ps-panel-3,#252537);border:1px dashed var(--ps-border-strong,#45456a)}',
    '#ps-task .pst-result{margin-top:7px}',
    '#ps-task .pst-result:empty{display:none}',
    '#ps-task .pst-fail{padding:7px 10px;border-radius:6px;border:1px solid var(--ps-error,#f38ba8);background:rgba(243,139,168,.08)}',
    '#ps-task .pst-pass{padding:7px 10px;border-radius:6px;border:1px solid var(--ps-success,#a6e3a1);background:rgba(166,227,161,.10);color:var(--ps-success,#a6e3a1);font-weight:700}',
    '#ps-task .pst-busy{color:var(--ps-muted,#9090b0)}',
    '#ps-task .pst-row{margin:2px 0}',
    '#ps-task .pst-row b{color:var(--ps-text-strong,#fff)}'
  ].join('\n');

  window.PyScratchTaskBoot = function (api) {
    var task = findTask();
    var S = api.S;
    document.documentElement.classList.add('ps-task-mode');
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    if (!task) {
      api.logError('This task was not found: ' + TASK_ID);
      return;
    }
    PY = task.lang === 'python';
    api.setLang(PY ? 'python' : 'pseudo', false);
    if (task.fixMessage) S.taskMsgFilter = task.fixMessage;
    var CODE_KEY = 'pstask:' + task.id + ':code', DONE_KEY = 'pstask:' + task.id + ':done';
    var main = task.sprites[0];

    // Sprites back where the task starts them, before every run (the student's and the checks').
    S.taskReset = function () {
      task.sprites.forEach(function (sp) {
        var t = api.getTargetByName(sp.name);
        if (!t) return;
        try {
          t.setXY(sp.x || 0, sp.y || 0);
          t.setDirection(sp.direction == null ? 90 : sp.direction);
          t.setVisible(true);
          t.setSize(sp.size || 100);
          t.runtime.emit('SAY', t, 'say', '');
        } catch (e) {}
      });
    };

    function setup() {
      var sprites = api.getSprites();
      if (!sprites.length) { setTimeout(setup, 200); return; }
      var t = sprites[0];
      if (t.sprite.name !== main.name) {
        try { S.vm.renameSprite(t.id, main.name); } catch (e) {}
      }
      var saved = read(CODE_KEY);
      var code = saved != null ? saved : (task.starter || '');
      S.spriteCode[main.name] = [PY ? { id: 't_task', name: 'Main', code: code } : { id: 't_task', name: 'Main', code: '', pseudo: code }];
      api.sync();
      api.selectSpriteByName(main.name);
      S.activeThreadIdx = 0;
      api.loadCodeToEditor();
      S.taskReset();
      buildBar();
      var timer = null;
      api.ui.editor.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { store(CODE_KEY, api.ui.editor.value); }, 400);
      });
      setTimeout(api.adjustOverlay, 300);
      setTimeout(api.adjustOverlay, 1200);
    }
    setTimeout(setup, 700);

    var bar, resultEl, checkBtn, tries = 0, log = [], doneBefore = read(DONE_KEY) === '1';

    function buildBar() {
      var wrap = document.getElementById('ps-editor-wrap');
      if (!wrap || document.getElementById('ps-task')) return;
      bar = document.createElement('div');
      bar.id = 'ps-task';
      bar.innerHTML =
        '<div class="pst-head"><span class="pst-tag">' + esc(task.tag || 'PyScratch Task') + '</span><span class="pst-title">' + esc(task.title) + '</span></div>' +
        '<p class="pst-brief">' + task.brief + '</p>' +
        (task.todo && task.todo.length ? '<ul class="pst-todo">' + task.todo.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="pst-actions">' +
          '<button type="button" class="pst-check">Check my program</button>' +
          (task.help ? '<button type="button" class="pst-help-btn" aria-expanded="false">I need help</button>' : '') +
          '<button type="button" class="pst-reset">Start again</button>' +
        '</div>' +
        (task.help ? '<div class="pst-help" hidden>' + task.help + '</div>' : '') +
        '<div class="pst-result" role="status" aria-live="polite"></div>';
      wrap.insertBefore(bar, wrap.firstChild);
      resultEl = bar.querySelector('.pst-result');
      checkBtn = bar.querySelector('.pst-check');
      checkBtn.addEventListener('click', check);
      var hb = bar.querySelector('.pst-help-btn');
      if (hb) hb.addEventListener('click', function () {
        var h = bar.querySelector('.pst-help');
        h.hidden = !h.hidden;
        hb.setAttribute('aria-expanded', String(!h.hidden));
        hb.textContent = h.hidden ? 'I need help' : 'Hide help';
        api.updateIndentGutter();   // the editor moved down or up
      });
      var rb = bar.querySelector('.pst-reset'), armed = null;
      rb.addEventListener('click', function () {
        if (!armed) {
          rb.textContent = 'Click again: your code is lost';
          armed = setTimeout(function () { armed = null; rb.textContent = 'Start again'; }, 3000);
          return;
        }
        clearTimeout(armed); armed = null; rb.textContent = 'Start again';
        if (S.running) { try { S.vm.stopAll(); } catch (e) {} }
        api.ui.editor.value = task.starter || '';
        api.saveCurrentCode();
        store(CODE_KEY, null);
        resultEl.innerHTML = '';
        S.lastError = null; api.updateIndentGutter();
        S.taskReset();
      });
      if (doneBefore) resultEl.innerHTML = '<div class="pst-pass">You finished this task before. You can check it again.</div>';
      if (doneBefore && window.parent !== window) post(false);
    }

    function markLine(line) {
      S.lastError = line ? { sprite: main.name, threadIdx: 0, line: line, lang: PY ? 'python' : 'pseudo' } : null;
      api.updateIndentGutter();
    }

    function showFail(f) {
      var saw = f.saw;
      resultEl.innerHTML = '<div class="pst-fail">' +
        '<div class="pst-row"><b>Not yet.</b></div>' +
        '<div class="pst-row"><b>What happened:</b> ' + esc(saw) + '</div>' +
        '<div class="pst-row"><b>What should happen:</b> ' + esc(f.expected) + '</div>' +
        (f.line ? '<div class="pst-row"><b>Look at line ' + f.line + '.</b></div>' : '') +
        '</div>';
      markLine(f.line);
    }

    function post(complete) {
      if (window.parent === window) return;
      var done = complete || doneBefore;
      var head = complete ? 'Finished on check ' + tries + '.' : (doneBefore ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + (tries ? tries + (tries === 1 ? ' check.' : ' checks.') : 'Opened.');
      var code = (api.ui.editor && api.ui.editor.value || '').trim();
      var summary = head + (log.length ? ' ' + log.slice(-3).join(' ') : '') + (code ? ' Program: ' + code.replace(/\s*\n\s*/g, ' / ') : '');
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: ('pstask-' + task.id).slice(0, 40),
          label: 'PyScratch Task: ' + task.title, summary: summary.slice(0, 1500), complete: done }, '*');
      } catch (e) {}
    }

    function check() {
      if (running) return;
      api.saveCurrentCode();
      var code = api.ui.editor.value;
      store(CODE_KEY, code);
      tries++;
      checkBtn.disabled = true;
      api.ui.editor.readOnly = true;
      markLine(0);
      resultEl.innerHTML = '<div class="pst-busy">Running your program...</div>';
      var result;
      var tr = PY ? { errors: [] } : api.PSEUDO.transpile(code);
      if (tr.errors.length) {
        result = Promise.resolve(new Fail('The program has a mistake: ' + tr.errors[0].message, 'A program with no mistakes, so it can run', tr.errors[0].line));
      } else {
        var T = makeToolkit(api, task, code);
        var checks = task.checks.slice();
        result = (function next() {
          if (!checks.length) return Promise.resolve(null);
          var c = checks.shift();
          return Promise.resolve().then(function () { return c(T); }).then(function (r) {
            return r ? r : next();
          });
        })().catch(function (e) {
          if (e instanceof Fail) return e;
          console.error(e);
          return new Fail('The check could not finish: ' + (e && e.message || e), 'Try again', 0);
        });
      }
      running = result;
      result.then(function (f) {
        running = null;
        checkBtn.disabled = false;
        api.ui.editor.readOnly = false;
        S.taskReset();
        if (f && S.taskMsgFilter) f.saw = S.taskMsgFilter(f.saw);
        if (f) {
          showFail(f);
          log.push('Check ' + tries + ': ' + f.saw + (f.line ? ' (line ' + f.line + ')' : '') + '.');
          post(false);
        } else {
          resultEl.innerHTML = '<div class="pst-pass">' + esc(task.pass || 'Well done. Your program does everything the task asks.') + '</div>';
          doneBefore = true;
          store(DONE_KEY, '1');
          log.push('Check ' + tries + ': passed.');
          post(true);
        }
      });
      return result;
    }

    // For tests (?pstest=1): check any program without touching the saved code.
    if (/[?&]pstest=1/.test(location.search)) {
      window.PyScratchTaskTest = {
        task: task,
        check: function (code) {
          api.ui.editor.value = code;
          api.saveCurrentCode();
          return check().then(function (f) { return f ? { ok: false, saw: f.saw, expected: f.expected, line: f.line } : { ok: true }; });
        }
      };
    }
  };
})();
