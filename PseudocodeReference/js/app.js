(function () {
  'use strict';
  var TOPICS = window.RECAP_TOPICS;
  var STORE_KEY = 'bc-pseudocode-recap-v1';
  var LEVEL_NAMES = { 1: 'Fill the gaps', 2: 'Finish the code', 3: 'Write it yourself' };

  // ---------------------------------------------------------------- storage (optional)
  var store = { done: {}, drafts: {} };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && typeof saved === 'object') store = { done: saved.done || {}, drafts: saved.drafts || {} };
  } catch (e) { /* storage unavailable: progress lasts for this visit only */ }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- helpers
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function allTasks() {
    var out = [];
    TOPICS.forEach(function (t) { t.tasks.forEach(function (k) { out.push(k); }); });
    return out;
  }
  function topicDone(t) { return t.tasks.filter(function (k) { return store.done[k.id]; }).length; }
  function parseInputs(text) {
    if (!text.trim()) return [];
    return text.split(',').map(function (s) { return s.trim(); });
  }

  var KEYWORDS = ['DECLARE', 'CONSTANT', 'INPUT', 'OUTPUT', 'IF', 'THEN', 'ELSE', 'ENDIF', 'CASE', 'OF', 'OTHERWISE', 'ENDCASE',
    'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'DO', 'ENDWHILE', 'REPEAT', 'UNTIL', 'AND', 'OR', 'NOT', 'MOD', 'DIV', 'TRUE', 'FALSE', 'ARRAY'];
  var TYPE_WORDS = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN'];
  var FN_WORDS = ['LENGTH', 'UCASE', 'LCASE', 'SUBSTRING', 'ROUND', 'RANDOM', 'INT'];

  function highlight(line) {
    var out = '';
    var re = /(\/\/.*$)|("[^"]*"?)|('[^']*'?)|(<-|←)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|([\s\S])/g;
    var m;
    while ((m = re.exec(line))) {
      if (m[1]) out += '<span class="c">' + esc(m[1]) + '</span>';
      else if (m[2] || m[3]) out += '<span class="s">' + esc(m[2] || m[3]) + '</span>';
      else if (m[4]) out += '<span class="ar">' + esc(m[4]) + '</span>';
      else if (m[5]) out += '<span class="n">' + m[5] + '</span>';
      else if (m[6]) {
        var up = m[6];
        if (KEYWORDS.indexOf(up) !== -1) out += '<span class="k">' + up + '</span>';
        else if (TYPE_WORDS.indexOf(up) !== -1) out += '<span class="ty">' + up + '</span>';
        else if (FN_WORDS.indexOf(up) !== -1) out += '<span class="fn">' + up + '</span>';
        else out += esc(m[6]);
      } else out += esc(m[7]);
    }
    return out;
  }

  // Read-only code view with line numbers.
  function codeView(code, opts) {
    opts = opts || {};
    var box = el('div', { class: 'code' });
    code.split('\n').forEach(function (line, i) {
      var row = el('div', { class: 'row', 'data-line': i + 1 });
      row.appendChild(el('span', { class: 'gut' }, String(i + 1)));
      row.appendChild(el('span', { class: 'src' }, highlight(line) || ' '));
      box.appendChild(row);
    });
    box.setLine = function (n, cls) {
      Array.prototype.forEach.call(box.querySelectorAll('.row'), function (r) {
        r.classList.remove('cur', 'errline', 'hot');
        if (n && Number(r.getAttribute('data-line')) === n) {
          r.classList.add(cls || 'cur');
          if (opts.scroll !== false && box.scrollHeight > box.clientHeight) r.scrollIntoView({ block: 'nearest' });
        }
      });
    };
    box.hot = function (n, on) {
      var r = box.querySelector('.row[data-line="' + n + '"]');
      if (r) r.classList.toggle('hot', on);
    };
    return box;
  }

  // ---------------------------------------------------------------- editor
  function createEditor(initial, onChange) {
    var wrap = el('div', { class: 'editor' });
    var gut = el('div', { class: 'egut', 'aria-hidden': 'true' });
    var area = el('div', { class: 'earea' });
    var pre = el('pre', { 'aria-hidden': 'true' });
    var ta = el('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'Pseudocode editor', placeholder: 'Write your pseudocode here...' });
    ta.value = initial || '';
    area.appendChild(pre);
    area.appendChild(ta);
    wrap.appendChild(gut);
    wrap.appendChild(area);
    var errLine = null;

    function render() {
      var lines = ta.value.split('\n');
      pre.innerHTML = lines.map(function (l, i) {
        return '<div class="ln' + (errLine === i + 1 ? ' errline' : '') + '">' + (highlight(l) || '​') + '</div>';
      }).join('');
      gut.textContent = lines.map(function (_, i) { return i + 1; }).join('\n');
      var rows = Math.max(12, lines.length + 2);
      ta.style.height = 'calc(' + rows + ' * var(--code-line) + 1.2rem)';
      sync();
    }
    function sync() {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
      gut.scrollTop = ta.scrollTop;
    }
    function insert(text) {
      var s = ta.selectionStart, e = ta.selectionEnd;
      ta.setRangeText(text, s, e, 'end');
      ta.dispatchEvent(new Event('input'));
      ta.focus();
    }
    ta.addEventListener('input', function () { errLine = null; render(); if (onChange) onChange(ta.value); });
    ta.addEventListener('scroll', sync);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = ta.selectionStart, v = ta.value;
        if (e.shiftKey) {
          var ls = v.lastIndexOf('\n', s - 1) + 1;
          if (v.substr(ls, 2) === '  ') {
            ta.setRangeText('', ls, ls + 2, 'preserve');
            ta.selectionStart = ta.selectionEnd = Math.max(ls, s - 2);
            ta.dispatchEvent(new Event('input'));
          }
        } else insert('  ');
      } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        var pos = ta.selectionStart, val = ta.value;
        var lineStart = val.lastIndexOf('\n', pos - 1) + 1;
        var cur = val.slice(lineStart, pos);
        var indent = /^\s*/.exec(cur)[0];
        var t = cur.trim().toUpperCase();
        if (/^(THEN|ELSE|REPEAT)$/.test(t) || /^(FOR|WHILE|CASE OF)\b/.test(t) || /\bTHEN$/.test(t) || /^IF\b/.test(t) && !/\bTHEN$/.test(t)) indent += '  ';
        insert('\n' + indent);
      }
    });
    render();
    return {
      el: wrap,
      get value() { return ta.value; },
      set value(v) { ta.value = v; errLine = null; render(); },
      insert: insert,
      markError: function (line) { errLine = line; render(); },
      focus: function () { ta.focus(); }
    };
  }

  // ---------------------------------------------------------------- stepper
  // Runs code one event at a time, showing the line, an explanation,
  // variables, the console and a trace table.
  function createStepper(opts) {
    var root = el('div', { class: 'stepper' });
    var codeHolder = el('div');
    var explain = el('div', { class: 'explain', 'aria-live': 'polite' }, 'Press <b>Step</b> to run the first line.');
    var varsBox = el('div');
    var consoleBox = el('div', { class: 'console' });
    var traceBox = el('div', { class: 'scroll-x' });
    var inputRow = el('div', { class: 'inputs-row' });
    var inputField = el('input', { type: 'text', 'aria-label': 'Input values, separated by commas' });
    inputField.value = (opts.inputs || []).join(', ');
    var runner, log, view, code, initialSnap;

    var stepBtn = el('button', { class: 'btn primary', type: 'button', onclick: function () { step(); } }, 'Step ▶');
    var runBtn = el('button', { class: 'btn', type: 'button', onclick: function () { runAll(); } }, 'Run to the end');
    var resetBtn = el('button', { class: 'btn', type: 'button', onclick: function () { reset(); } }, 'Reset');
    inputRow.appendChild(el('label', null, '<b>Inputs</b> <span class="note">(comma separated)</span>'));
    inputRow.appendChild(inputField);
    if (opts.hideInputs) inputRow.style.display = 'none';
    var controls = el('div', { class: 'btn-row' });
    [stepBtn, runBtn, resetBtn].forEach(function (b) { controls.appendChild(b); });

    var grid = el('div', { class: 'step-grid' });
    var left = el('div');
    left.appendChild(codeHolder);
    var right = el('div');
    right.appendChild(explain);
    right.appendChild(el('div', { class: 'panel-title' }, 'Variables'));
    right.appendChild(varsBox);
    right.appendChild(el('div', { class: 'panel-title' }, 'Output'));
    right.appendChild(consoleBox);
    grid.appendChild(left);
    grid.appendChild(right);
    root.appendChild(inputRow);
    root.appendChild(controls);
    root.appendChild(el('div', { style: 'height:.8rem' }));
    root.appendChild(grid);
    root.appendChild(el('div', { class: 'panel-title', style: 'margin-top:1rem' }, 'Trace table <span style="text-transform:none;letter-spacing:0;font-weight:400">(a row is added when a value changes or there is output)</span>'));
    root.appendChild(traceBox);

    function reset(newCode) {
      if (typeof newCode === 'string') code = newCode;
      runner = new CIE.Runner(code, { inputs: parseInputs(inputField.value), givens: opts.givens });
      initialSnap = runner.prev ? JSON.parse(JSON.stringify(runner.prev)) : {};
      log = [];
      codeHolder.innerHTML = '';
      view = codeView(code);
      codeHolder.appendChild(view);
      stepBtn.disabled = false;
      runBtn.disabled = false;
      if (runner.error) {
        showError();
      } else {
        explain.className = 'explain';
        explain.innerHTML = 'Press <b>Step</b> to run the first line' + (opts.givens ? '. The given data is already stored.' : '.');
      }
      render();
    }
    function showError() {
      explain.className = 'explain err';
      explain.innerHTML = '<b>Error' + (runner.error.line ? ' on line ' + runner.error.line : '') + ':</b> ' + esc(runner.error.message);
      if (runner.error.line) view.setLine(runner.error.line, 'errline');
      stepBtn.disabled = true;
      runBtn.disabled = true;
      if (opts.onError) opts.onError(runner.error);
    }
    function step() {
      var e = runner.step();
      if (e) {
        log.push(e);
        explain.className = 'explain';
        explain.innerHTML = '<b>Line ' + e.line + ':</b> ' + esc(e.msg);
        view.setLine(e.line);
      }
      if (runner.done) {
        if (runner.error) showError();
        else if (!e) finished();
        else { stepBtn.disabled = false; }
      }
      render();
      return e;
    }
    function finished() {
      explain.className = 'explain done';
      explain.innerHTML = '<b>Finished.</b> The program has run every line it needs to.';
      view.setLine(null);
      stepBtn.disabled = true;
      runBtn.disabled = true;
    }
    function runAll() {
      var guard = 0;
      while (!runner.done && guard < 20000) { var e = runner.step(); if (e) log.push(e); guard++; }
      if (runner.error) showError();
      else finished();
      render();
    }
    function render() {
      // variables
      var S = runner.state;
      var cur = log.length ? log[log.length - 1] : null;
      var changed = cur ? Object.keys(cur.changes || {}) : [];
      var rows = S.order.map(function (key) {
        var v = S.vars[key];
        var val, isChanged;
        if (v.arr) {
          var d = v.arr.dims[0];
          if (v.arr.dims.length === 1) {
            var parts = [];
            for (var i = d.lo; i <= d.hi; i++) { var x = v.arr.data[String(i)]; parts.push(x === undefined ? '_' : CIE.describe(x)); }
            val = '[' + parts.join(', ') + ']';
          } else val = '(2D array)';
          isChanged = changed.some(function (c) { return c.indexOf(v.name + '[') === 0; });
        } else {
          val = v.value === undefined ? '<span style="color:var(--text-dimmer)">no value yet</span>' : esc(CIE.describe(v.value));
          isChanged = changed.indexOf(v.name) !== -1;
        }
        return '<tr' + (isChanged ? ' class="changed"' : '') + '><td>' + esc(v.name) + '</td><td class="type">' + (v.arr ? 'ARRAY OF ' : '') + v.type + (v.constant ? ' (constant)' : '') + '</td><td class="val">' + (v.arr ? esc(val) : val) + '</td></tr>';
      });
      varsBox.innerHTML = rows.length ? '<table class="vars"><tr><th>Name</th><th>Type</th><th>Value</th></tr>' + rows.join('') + '</table>' : '<div class="note">No variables yet.</div>';
      // console
      var lines = [];
      log.forEach(function (e) {
        if (e.output !== undefined) lines.push(esc(e.output));
        if (e.input !== undefined) lines.push('<span class="in">&gt; ' + esc(e.input) + '</span>');
      });
      consoleBox.innerHTML = lines.length ? lines.join('\n') : '<span class="empty">Nothing output yet.</span>';
      consoleBox.scrollTop = consoleBox.scrollHeight;
      // trace
      var cols = Object.keys(initialSnap);
      runner.columns.forEach(function (c) { if (cols.indexOf(c) === -1) cols.push(c); });
      var head = '<tr><th>Line</th>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '<th>OUTPUT</th></tr>';
      var body = '';
      var initKeys = Object.keys(initialSnap);
      if (initKeys.length) {
        body += '<tr><td class="ln">start</td>' + cols.map(function (c) { return '<td>' + (initialSnap[c] !== undefined ? esc(initialSnap[c]) : '') + '</td>'; }).join('') + '<td></td></tr>';
      }
      var lastIsCurrent = cur && ((Object.keys(cur.changes || {}).length) || cur.output !== undefined);
      runner.trace.forEach(function (r, i) {
        var last = lastIsCurrent && i === runner.trace.length - 1;
        body += '<tr' + (last ? ' class="last"' : '') + '><td class="ln">' + r.line + '</td>' + cols.map(function (c) {
          return '<td>' + (r.changes[c] !== undefined ? esc(r.changes[c]) : '') + '</td>';
        }).join('') + '<td>' + (r.output !== undefined ? esc(r.output) : '') + '</td></tr>';
      });
      traceBox.innerHTML = (body ? '<table class="trace">' + head + body + '</table>' : '<div class="note">The trace table fills in as you step.</div>');
    }

    reset(opts.code);
    return { el: root, reset: reset, setInputs: function (arr) { inputField.value = arr.join(', '); } };
  }

  // ---------------------------------------------------------------- navigation state
  var current = { topic: null, tab: 'learn', example: 0, task: 0 };

  function renderNav() {
    var nav = document.getElementById('nav');
    nav.innerHTML = '';
    var home = el('button', { type: 'button', class: current.topic === null ? 'active' : '', onclick: function () { go(null); } }, '<span class="tag" style="background:var(--text-dimmer)"></span>Start here');
    nav.appendChild(home);
    var lastGroup = null;
    TOPICS.forEach(function (t) {
      if (t.group !== lastGroup) { nav.appendChild(el('h3', null, esc(t.group))); lastGroup = t.group; }
      var done = topicDone(t);
      var b = el('button', { type: 'button', class: current.topic === t.id ? 'active' : '', onclick: function () { go(t.id); } },
        '<span class="tag ' + t.colour + '"></span>' + esc(t.title) + '<span class="count' + (done === t.tasks.length ? ' full' : '') + '">' + done + '/' + t.tasks.length + '</span>');
      nav.appendChild(b);
    });
    var all = allTasks();
    var n = all.filter(function (k) { return store.done[k.id]; }).length;
    document.getElementById('progText').textContent = n + ' of ' + all.length + ' tasks done';
    document.getElementById('progBar').style.width = (100 * n / all.length) + '%';
  }

  function go(topicId, tab, index) {
    current.topic = topicId;
    current.tab = tab || 'learn';
    current.example = 0;
    current.task = 0;
    var t = topicById(topicId);
    if (t && current.tab === 'practice') {
      if (typeof index === 'number') current.task = index;
      else {
        var firstOpen = t.tasks.findIndex(function (k) { return !store.done[k.id]; });
        current.task = firstOpen === -1 ? 0 : firstOpen;
      }
    }
    var hash = topicId ? '#' + topicId + (current.tab !== 'learn' ? '/' + current.tab : '') : '#';
    if (location.hash !== hash) history.replaceState(null, '', hash === '#' ? location.pathname + location.search : hash);
    render();
    window.scrollTo(0, 0);
  }
  function topicById(id) { return TOPICS.filter(function (t) { return t.id === id; })[0] || null; }

  function render() {
    renderNav();
    repaintSupport = null;
    var main = document.getElementById('main');
    main.innerHTML = '';
    var t = topicById(current.topic);
    if (!t) { renderHome(main); return; }
    var head = el('div', { class: 'topic-head' });
    head.appendChild(el('h2', null, '<span class="tag ' + t.colour + '"></span>' + esc(t.title)));
    head.appendChild(el('p', { class: 'lead' }, esc(t.summary)));
    main.appendChild(head);
    var tabs = el('div', { class: 'tabs', role: 'tablist' });
    var list = [['learn', 'Learn the syntax']];
    if (t.examples.length) list.push(['examples', 'Worked examples']);
    list.push(['practice', 'Practice (' + topicDone(t) + '/' + t.tasks.length + ')']);
    list.forEach(function (p) {
      tabs.appendChild(el('button', { type: 'button', role: 'tab', 'aria-selected': String(current.tab === p[0]), class: current.tab === p[0] ? 'active' : '', onclick: function () { go(t.id, p[0]); } }, p[1]));
    });
    main.appendChild(tabs);
    if (current.tab === 'examples' && t.examples.length) renderExamples(main, t);
    else if (current.tab === 'practice') renderPractice(main, t);
    else renderLearn(main, t);
  }

  // ---------------------------------------------------------------- home
  function renderHome(main) {
    var intro = el('div', { class: 'card' });
    intro.innerHTML = '<h3>How to use this recap</h3>' +
      '<p class="lead" style="margin-bottom:0">Pick a topic. Each one has three parts. Work through them in order, or jump straight to Practice if you are confident.</p>' +
      '<div class="how">' +
      '<div><b>1. Learn the syntax</b>The rules, and annotated templates showing exactly how Cambridge pseudocode is laid out.</div>' +
      '<div><b>2. Worked examples</b>Run a real program one line at a time. Watch the variables, the output and the trace table change.</div>' +
      '<div><b>3. Practice</b>Fill the gaps, then finish some code, then write it yourself. Your code is run and checked against test data.</div>' +
      '<div><b>Stuck?</b>Use Step through to watch your own code run, take a hint, and only then look at the model answer.</div>' +
      '</div>';
    main.appendChild(intro);
    var grid = el('div', { class: 'topic-grid' });
    TOPICS.forEach(function (t) {
      var dots = t.tasks.map(function (k) { return '<i class="' + (store.done[k.id] ? 'on' : '') + '"></i>'; }).join('');
      grid.appendChild(el('button', { type: 'button', class: 'topic-card', onclick: function () { go(t.id); } },
        '<h4><span class="tag ' + t.colour + '"></span>' + esc(t.title) + '</h4><p>' + esc(t.summary) + '</p><div class="dots">' + dots + '</div>'));
    });
    main.appendChild(grid);
  }

  // ---------------------------------------------------------------- learn
  function renderLearn(main, t) {
    var rules = el('div', { class: 'card' });
    rules.innerHTML = '<h3>Key rules</h3><ul class="rules">' + t.rules.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>';
    main.appendChild(rules);
    t.syntax.forEach(function (s) {
      var card = el('div', { class: 'card' });
      card.appendChild(el('h3', null, esc(s.title)));
      var view = codeView(s.code, { scroll: false });
      if (s.notes.length) {
        var grid = el('div', { class: 'syntax-grid' });
        grid.appendChild(view);
        var ul = el('ul', { class: 'annot' });
        s.notes.forEach(function (n) {
          var li = el('li', null, '<span class="pill">' + n[0] + '</span><span>' + n[1] + '</span>');
          li.addEventListener('mouseenter', function () { view.hot(n[0], true); });
          li.addEventListener('mouseleave', function () { view.hot(n[0], false); });
          ul.appendChild(li);
        });
        grid.appendChild(ul);
        card.appendChild(grid);
      } else card.appendChild(view);
      main.appendChild(card);
    });
    var next = el('div', { class: 'btn-row' });
    if (t.examples.length) next.appendChild(el('button', { class: 'btn primary', type: 'button', onclick: function () { go(t.id, 'examples'); } }, 'Next: worked examples →'));
    else next.appendChild(el('button', { class: 'btn primary', type: 'button', onclick: function () { go(t.id, 'practice'); } }, 'Next: practice →'));
    main.appendChild(next);
  }

  // ---------------------------------------------------------------- examples
  function renderExamples(main, t) {
    if (t.examples.length > 1) {
      var picker = el('div', { class: 'ex-picker' });
      t.examples.forEach(function (ex, i) {
        picker.appendChild(el('button', { type: 'button', class: 'btn' + (i === current.example ? ' active' : ''), onclick: function () { current.example = i; render(); } }, (i + 1) + '. ' + esc(ex.title)));
      });
      main.appendChild(picker);
    }
    var ex = t.examples[current.example];
    var card = el('div', { class: 'card' });
    card.appendChild(el('h3', null, esc(ex.title)));
    card.appendChild(el('p', { class: 'lead' }, esc(ex.scenario)));
    if (ex.givens) card.appendChild(givensBox(ex.givens));
    if (ex.predict) {
      var pr = el('div', { class: 'predict' });
      pr.appendChild(el('label', { for: 'predict-' + t.id + current.example }, 'Predict first: ' + esc(ex.predict)));
      pr.appendChild(el('textarea', { id: 'predict-' + t.id + current.example, rows: '2', placeholder: 'Write your prediction, then step through to check it.' }));
      card.appendChild(pr);
    }
    var hasInput = /\bINPUT\b/.test(ex.code);
    var stepper = createStepper({ code: ex.code, inputs: ex.inputs, givens: ex.givens, hideInputs: !hasInput });
    card.appendChild(stepper.el);
    if (hasInput) card.appendChild(el('p', { class: 'note' }, 'Change the inputs and press Reset to try different data.'));
    main.appendChild(card);
    var next = el('div', { class: 'btn-row' });
    if (current.example < t.examples.length - 1) {
      next.appendChild(el('button', { class: 'btn', type: 'button', onclick: function () { current.example++; render(); window.scrollTo(0, 0); } }, 'Next example →'));
    }
    next.appendChild(el('button', { class: 'btn primary', type: 'button', onclick: function () { go(t.id, 'practice'); } }, 'Go to practice →'));
    main.appendChild(next);
  }

  function givensBox(givens) {
    var box = el('div', { class: 'givens' });
    box.innerHTML = '<b>Given data</b> <span class="note">(already declared and filled in, do not DECLARE these again)</span>' +
      givens.map(function (g) {
        if (!g.values) return '<div>' + esc(g.name) + ' : ' + g.type + ' = ' + esc(CIE.describe(g.value)) + '</div>';
        var lo = g.lo || 1;
        return '<div>' + esc(g.name) + ' : ARRAY[' + lo + ':' + (lo + g.values.length - 1) + '] OF ' + g.type + ' = [' +
          g.values.map(function (v) { return esc(CIE.describe(v)); }).join(', ') + ']</div>';
      }).join('');
    return box;
  }

  // ---------------------------------------------------------------- practice
  var BANK = {
    common: ['DECLARE ', ' : INTEGER', ' : REAL', ' : STRING', ' : BOOLEAN', 'OUTPUT ""', 'INPUT ', ' <- '],
    selection: ['IF ', 'THEN', 'ELSE', 'ENDIF', ' AND ', ' OR ', '>=', '<>'],
    for: ['FOR ', ' <- 1 TO ', 'NEXT '],
    while: ['WHILE ', ' DO', 'ENDWHILE'],
    repeat: ['REPEAT', 'UNTIL '],
    arrays: ['[Index]'],
    search: ['FALSE', 'TRUE', 'NOT '],
    text: ['LENGTH()', ' & ']
  };
  var TOPIC_BANK = {
    sequence: ['common', ' DIV ', ' MOD '],
    selection: ['common', 'selection', 'CASE OF ', 'OTHERWISE : ', 'ENDCASE'],
    for: ['common', 'for', 'selection'],
    while: ['common', 'while', 'selection'],
    repeat: ['common', 'repeat', 'selection'],
    arrays: ['common', 'for', 'arrays', 'selection'],
    search: ['common', 'while', 'arrays', 'search', 'selection'],
    sort: ['common', 'repeat', 'for', 'arrays', 'search', 'selection'],
    exam: ['common', 'selection', 'for', 'while', 'repeat', 'search', 'text']
  };
  function bankFor(topicId) {
    var out = [];
    (TOPIC_BANK[topicId] || ['common']).forEach(function (k) {
      (BANK[k] || [k]).forEach(function (s) { if (out.indexOf(s) === -1) out.push(s); });
    });
    return out;
  }

  function renderPractice(main, t) {
    var list = el('div', { class: 'task-list' });
    t.tasks.forEach(function (k, i) {
      list.appendChild(el('button', { type: 'button', class: 'task-pick' + (i === current.task ? ' active' : ''), onclick: function () { current.task = i; render(); } },
        '<span class="tick' + (store.done[k.id] ? ' on' : '') + '">' + (store.done[k.id] ? '✓' : '') + '</span>' +
        '<span><span class="level l' + k.level + '">' + (k.extension ? 'Extension' : LEVEL_NAMES[k.level]) + '</span><br>' + esc(k.title) + '</span>'));
    });
    main.appendChild(list);
    main.appendChild(renderTask(t, t.tasks[current.task], current.task));
  }

  function normGap(s) { return String(s).replace(/←/g, '<-').replace(/\s+/g, '').toUpperCase(); }

  // ---------------------------------------------------------------- support mode
  // One switch for the whole site (shared/bc-support.js). Level 1 shows each
  // missing part greyed out inside its gap, carrying on from what the student
  // has typed. Levels 2 and 3 show the model answer under the editor, coloured
  // as they type. The help fades per level as tasks are checked correct; level
  // 3 never shows more than the start of each line.
  var Support = window.BCSupport || null;
  var repaintSupport = null;
  function supportReveal(level) {
    if (!Support || !Support.isOn()) return 0;
    var r = Support.fader('recap:L' + level).reveal();
    return level === 3 ? Math.min(r, 2 / 3) : r;
  }
  function recordSupport(level, right) {
    if (!Support || !Support.isOn()) return;
    var f = Support.fader('recap:L' + level);
    if (right) f.correct(); else f.wrong();
  }
  // How far into `model` the typed text reaches, ignoring spacing and case.
  function gapProgress(model, typed) {
    var i = 0, j = 0;
    model = model.replace(/←/g, '<-');
    typed = typed.replace(/←/g, '<-');
    while (j < typed.length) {
      if (/\s/.test(typed[j])) { j++; continue; }
      while (i < model.length && /\s/.test(model[i])) i++;
      if (i < model.length && model[i].toUpperCase() === typed[j].toUpperCase()) { i++; j++; }
      else return { at: i, ok: false };
    }
    return { at: i, ok: true };
  }
  function paintGap(g) {
    var reveal = supportReveal(1), typed = g.input.value;
    g.input.classList.toggle('guided', reveal > 0);
    var best = null;
    if (reveal) g.answers.forEach(function (a) {
      var p = gapProgress(a, typed);
      if (!best || (p.ok && !best.p.ok)) best = { model: a, p: p };
    });
    g.input.classList.toggle('off', !!best && !best.p.ok);
    if (!best || !best.p.ok) { g.ghost.innerHTML = ''; return; }
    var model = best.model;
    var shown = reveal >= 1 ? model.length : Math.max(1, Math.ceil(model.length * reveal));
    var rest = model.slice(best.p.at);
    if (/\s$/.test(typed)) rest = rest.replace(/^\s+/, '');
    var visible = rest.slice(0, Math.max(0, shown - (model.length - rest.length)));
    var hidden = rest.length - visible.length;
    g.ghost.innerHTML = '<span class="gh-typed">' + esc(typed) + '</span>' + esc(visible) +
      (hidden ? '<span class="gh-blank" style="width:' + hidden + 'ch"></span>' : '');
  }
  // Comment and blank lines are skipped on both sides, so a two-line TODO
  // comment does not push the model out of line with the student's code.
  function codeLines(text) {
    return String(text || '').split('\n').filter(function (l) { return l.trim() && !/^\s*\/\//.test(l); });
  }

  function renderTask(t, k, idx) {
    var card = el('div', { class: 'card' });
    var head = el('div', { class: 'task-head' });
    head.appendChild(el('span', { class: 'level l' + k.level }, 'Level ' + k.level + ': ' + LEVEL_NAMES[k.level]));
    if (k.extension) head.appendChild(el('span', { class: 'ext' }, 'Extension'));
    head.appendChild(el('h3', null, esc(k.title)));
    if (store.done[k.id]) head.appendChild(el('span', { class: 'level', style: 'background:var(--good-soft);color:var(--good)' }, '✓ Done'));
    card.appendChild(head);
    card.appendChild(el('p', { style: 'margin:.2rem 0 .6rem' }, esc(k.brief)));
    if (k.must) card.appendChild(el('div', null, '<b style="font-size:.9rem">Your algorithm must:</b><ul class="must">' + k.must.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>'));
    if (k.givens) card.appendChild(givensBox(k.givens));

    var intro = {
      1: 'Most of the program is written. Type the missing parts into the boxes, then press Check answer.',
      2: 'The start of the program is written for you. Replace each // TODO comment with real pseudocode.',
      3: 'Write the whole algorithm. Plan it first if you need to, and use Step through to test it.'
    }[k.level];
    card.appendChild(el('div', { class: 'msg info' }, intro));

    // Level 3 planning scaffold
    if (k.level === 3 && k.plan) {
      var plan = el('details', { class: 'fold' });
      var p = k.plan;
      var declares = p.vars.map(function (v) { return 'DECLARE ' + v[0] + ' : ' + v[1]; }).join('\n');
      plan.innerHTML = '<summary>Need a plan? Open the planning scaffold</summary>' +
        '<div class="plan-grid">' +
        '<div><b>Inputs</b><ul>' + p.inputs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div><b>Process</b><ul>' + p.process.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div><b>Outputs</b><ul>' + p.outputs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +
        '<div class="panel-title">Suggested variables</div>' +
        '<table class="vars"><tr><th>Name</th><th>Type</th><th>Used for</th></tr>' + p.vars.map(function (v) {
          return '<tr><td><code>' + esc(v[0]) + '</code></td><td class="type">' + v[1] + '</td><td>' + esc(v[2]) + '</td></tr>';
        }).join('') + '</table>';
      var insertDecl = el('button', { class: 'btn', type: 'button', style: 'margin-top:.6rem' }, 'Insert these DECLARE lines at the top');
      plan.appendChild(insertDecl);
      card.appendChild(plan);
    }

    // The code area
    var getCode, editor = null, gaps = [], lastSupportCode = null;
    var draft = store.drafts[k.id];
    if (k.level === 1) {
      var parts = k.code.split(/\{\{(.+?)\}\}/);
      var holder = el('div', { class: 'code' });
      var lineNo = 1;
      var row = null, src = null;
      function newRow() {
        row = el('div', { class: 'row' });
        row.appendChild(el('span', { class: 'gut' }, String(lineNo++)));
        src = el('span', { class: 'src' });
        row.appendChild(src);
        holder.appendChild(row);
      }
      newRow();
      parts.forEach(function (part, i) {
        if (i % 2 === 0) {
          part.split('\n').forEach(function (seg, j) {
            if (j > 0) newRow();
            if (seg) src.appendChild(el('span', null, highlight(seg)));
          });
        } else {
          var answers = part.split('|');
          var gi = gaps.length;
          var input = el('input', { class: 'gap', type: 'text', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': 'Gap ' + (gi + 1) });
          var ghost = el('span', { class: 'gap-ghost', 'aria-hidden': 'true' });
          var wrap = el('span', { class: 'gap-wrap' });
          var baseWidth = Math.max(answers[0].length, 3) + 2;
          function sizeGap() { input.style.width = Math.max(baseWidth, input.value.length + 2) + 'ch'; }
          if (draft && draft[gi] !== undefined) input.value = draft[gi];
          sizeGap();
          input.addEventListener('input', function () {
            sizeGap();
            input.classList.remove('right', 'wrong');
            store.drafts[k.id] = gaps.map(function (g) { return g.input.value; });
            persist();
            paintGap(gaps[gi]);
          });
          input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); var nxt = gaps[gi + 1]; if (nxt) nxt.input.focus(); else checkBtn.click(); }
          });
          gaps.push({ input: input, answers: answers, ghost: ghost });
          wrap.appendChild(input);
          wrap.appendChild(ghost);
          src.appendChild(wrap);
        }
      });
      card.appendChild(holder);
      repaintSupport = function () { gaps.forEach(paintGap); };
      getCode = function () {
        var gi2 = 0;
        return k.code.replace(/\{\{(.+?)\}\}/g, function () { return gaps[gi2++].input.value; });
      };
    } else {
      var starter = k.level === 2 ? k.code : '';
      editor = createEditor(typeof draft === 'string' ? draft : starter, function (v) { store.drafts[k.id] = v; persist(); repaintSupport(); });
      var modelHint = el('div', { hidden: 'hidden' });
      repaintSupport = function () {
        var reveal = supportReveal(k.level);
        if (!reveal) { modelHint.innerHTML = ''; modelHint.hidden = true; return; }
        Support.renderTypedHint(modelHint, codeLines(k.model), codeLines(editor.value).join('\n'), reveal,
          reveal >= 1 ? 'Model answer: type it yourself' : 'Model answer with parts hidden: type it yourself');
      };
      var bank = el('div', { class: 'bank' });
      bank.appendChild(el('span', null, 'Insert:'));
      bankFor(t.id).forEach(function (s) {
        bank.appendChild(el('button', { type: 'button', class: 'chip', onclick: function () { editor.insert(s); } }, esc(s.trim() || s)));
      });
      card.appendChild(bank);
      card.appendChild(editor.el);
      card.appendChild(modelHint);
      card.appendChild(el('p', { class: 'note', style: 'margin:.3rem 0 0' }, 'Tip: Tab indents, Shift+Tab un-indents, and Enter keeps your indentation.'));
      getCode = function () { return editor.value; };
      if (k.level === 3 && k.plan) {
        insertDecl.addEventListener('click', function () {
          var decl = k.plan.vars.map(function (v) { return 'DECLARE ' + v[0] + ' : ' + v[1]; }).join('\n');
          var cur = editor.value.replace(/^\s+/, '');
          editor.value = decl + '\n' + cur;
          store.drafts[k.id] = editor.value;
          persist();
          repaintSupport();
          editor.focus();
        });
      }
    }

    // Run inputs + buttons
    var firstTest = k.tests[0];
    var usesInput = /\bINPUT\b/.test(k.code || '') || /\bINPUT\b/.test(k.model || '') || (firstTest.inputs && firstTest.inputs.length);
    var inputsRow = el('div', { class: 'inputs-row' });
    var runInputs = el('input', { type: 'text', 'aria-label': 'Inputs for Run, separated by commas' });
    runInputs.value = (firstTest.inputs || []).join(', ');
    inputsRow.appendChild(el('label', null, '<b>Inputs for Run</b> <span class="note">(comma separated)</span>'));
    inputsRow.appendChild(runInputs);
    if (!usesInput) inputsRow.style.display = 'none';
    card.appendChild(inputsRow);

    var btns = el('div', { class: 'btn-row' });
    var runBtn = el('button', { class: 'btn', type: 'button' }, '▶ Run');
    var stepBtn = el('button', { class: 'btn', type: 'button' }, 'Step through');
    var checkBtn = el('button', { class: 'btn primary', type: 'button' }, 'Check answer');
    var resetBtn = el('button', { class: 'btn', type: 'button' }, 'Start again');
    [runBtn, stepBtn, checkBtn, resetBtn].forEach(function (b) { btns.appendChild(b); });
    card.appendChild(btns);

    var results = el('div', { 'aria-live': 'polite' });
    card.appendChild(results);
    var stepHolder = el('div');
    card.appendChild(stepHolder);

    // Hints and model answer
    var helpBox = el('div', { class: 'hints' });
    var shownHints = 0;
    var attempts = 0;
    var hintBtn = el('button', { class: 'btn', type: 'button' }, 'Get a hint (' + k.hints.length + ' available)');
    var modelBtn = el('button', { class: 'btn', type: 'button', disabled: 'disabled' }, 'Show model answer');
    var hintList = el('ol');
    var modelHolder = el('div');
    var helpRow = el('div', { class: 'btn-row', style: 'margin-top:1rem' });
    helpRow.appendChild(hintBtn);
    helpRow.appendChild(modelBtn);
    helpBox.appendChild(helpRow);
    helpBox.appendChild(hintList);
    helpBox.appendChild(modelHolder);
    card.appendChild(helpBox);
    var modelNote = el('p', { class: 'note' }, 'The model answer unlocks after you have checked your answer once, or used every hint.');
    helpBox.appendChild(modelNote);
    function updateHelp() {
      hintBtn.disabled = shownHints >= k.hints.length;
      hintBtn.textContent = shownHints >= k.hints.length ? 'No more hints' : shownHints ? 'Next hint (' + (k.hints.length - shownHints) + ' left)' : 'Get a hint (' + k.hints.length + ' available)';
      var unlocked = attempts > 0 || shownHints >= k.hints.length || store.done[k.id];
      if (unlocked) modelBtn.removeAttribute('disabled');
      modelNote.style.display = unlocked ? 'none' : '';
    }
    hintBtn.addEventListener('click', function () {
      if (shownHints < k.hints.length) {
        hintList.appendChild(el('li', null, esc(k.hints[shownHints])));
        shownHints++;
        updateHelp();
      }
    });
    modelBtn.addEventListener('click', function () {
      modelHolder.innerHTML = '';
      var ans = k.level === 1 ? k.code.replace(/\{\{(.+?)\}\}/g, function (m, a) { return a.split('|')[0]; }) : k.model;
      modelHolder.appendChild(el('div', { class: 'panel-title' }, 'Model answer'));
      modelHolder.appendChild(codeView(ans));
      modelHolder.appendChild(el('p', { class: 'note' }, 'Other answers can be right too. Yours is correct if it passes every test. Compare the two line by line: what is different, and does it matter?'));
      modelBtn.disabled = true;
    });
    updateHelp();

    function showError(err) {
      if (err && err.line && editor) editor.markError(err.line);
    }
    function styleNotes(code) {
      var notes = CIE.lint(code);
      if (!notes.length) return null;
      return el('div', { class: 'msg warn' }, '<b>Style tips</b> (these do not stop your code working)<ul>' +
        notes.map(function (n) { return '<li>Line ' + n.line + ': ' + esc(n.msg) + '</li>'; }).join('') + '</ul>');
    }

    runBtn.addEventListener('click', function () {
      stepHolder.innerHTML = '';
      results.innerHTML = '';
      var code = getCode();
      var runner = new CIE.Runner(code, { inputs: parseInputs(runInputs.value), givens: k.givens });
      var lines = [];
      var guard = 0;
      while (!runner.done && guard < 25000) {
        var e = runner.step();
        if (e && e.output !== undefined) lines.push(esc(e.output));
        if (e && e.input !== undefined) lines.push('<span class="in">&gt; ' + esc(e.input) + '</span>');
        guard++;
      }
      results.appendChild(el('div', { class: 'panel-title' }, 'Output'));
      results.appendChild(el('div', { class: 'console' }, lines.length ? lines.join('\n') : '<span class="empty">No output.</span>'));
      if (runner.error) {
        results.appendChild(el('div', { class: 'msg err' }, '<b>Error' + (runner.error.line ? ' on line ' + runner.error.line : '') + ':</b> ' + esc(runner.error.message)));
        showError(runner.error);
      } else if (runner.inputsLeft > 0) {
        results.appendChild(el('div', { class: 'msg warn' }, 'The program finished with ' + runner.inputsLeft + ' input value' + (runner.inputsLeft === 1 ? '' : 's') + ' not used.'));
      }
      var sn = styleNotes(code);
      if (sn) results.appendChild(sn);
    });

    stepBtn.addEventListener('click', function () {
      results.innerHTML = '';
      stepHolder.innerHTML = '';
      var code = getCode();
      var st = createStepper({ code: code, inputs: parseInputs(runInputs.value), givens: k.givens, hideInputs: !usesInput, onError: showError });
      var closeRow = el('div', { class: 'btn-row', style: 'justify-content:space-between;margin-top:1rem' });
      closeRow.appendChild(el('b', null, 'Stepping through your code'));
      closeRow.appendChild(el('button', { class: 'btn', type: 'button', onclick: function () { stepHolder.innerHTML = ''; } }, 'Close'));
      stepHolder.appendChild(closeRow);
      stepHolder.appendChild(st.el);
      st.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    checkBtn.addEventListener('click', function () {
      stepHolder.innerHTML = '';
      results.innerHTML = '';
      attempts++;
      updateHelp();
      var code = getCode();
      var res = CIE.checkTask(code, k);
      // Checking the same code twice counts once.
      if (code !== lastSupportCode) { recordSupport(k.level, res.pass); lastSupportCode = code; }
      repaintSupport();
      if (k.level === 1) {
        gaps.forEach(function (g) {
          var ok = g.answers.some(function (a) { return normGap(a) === normGap(g.input.value); });
          g.input.classList.remove('right', 'wrong');
          if (!res.pass) g.input.classList.add(ok ? 'right' : 'wrong');
          else g.input.classList.add('right');
        });
      }
      if (res.pass) {
        var wasDone = store.done[k.id];
        store.done[k.id] = true;
        persist();
        var ok = el('div', { class: 'msg ok success' }, '<b>All ' + res.results.length + ' tests passed.</b> ' + (wasDone ? 'Still correct.' : 'Task complete.'));
        var nextIdx = idx + 1;
        if (nextIdx < t.tasks.length) {
          ok.appendChild(el('button', { class: 'btn good', type: 'button', onclick: function () { current.task = nextIdx; render(); window.scrollTo(0, 0); } }, 'Next task →'));
        } else {
          var ti = TOPICS.indexOf(t);
          if (ti < TOPICS.length - 1) ok.appendChild(el('button', { class: 'btn good', type: 'button', onclick: function () { go(TOPICS[ti + 1].id); } }, 'Next topic: ' + esc(TOPICS[ti + 1].title) + ' →'));
        }
        results.appendChild(ok);
        renderNav();
      } else {
        var firstErr = res.results.filter(function (r) { return r.error; })[0];
        if (firstErr) {
          results.appendChild(el('div', { class: 'msg err' }, '<b>Your code stopped with an error' + (firstErr.error.line ? ' on line ' + firstErr.error.line : '') + ':</b> ' + esc(firstErr.error.message)));
          showError(firstErr.error);
        } else {
          var passed = res.results.filter(function (r) { return r.pass; }).length;
          results.appendChild(el('div', { class: 'msg warn' }, '<b>' + passed + ' of ' + res.results.length + ' tests passed.</b> Look at the failing tests below, then use Step through with those inputs to find out why.' +
            (k.level === 1 ? ' Gaps in orange are the ones to look at again.' : '')));
        }
        if (res.requireFails.length) {
          results.appendChild(el('div', { class: 'msg warn' }, '<b>Check the task rules:</b><ul>' + res.requireFails.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>'));
        }
      }
      var table = '<table class="tests"><tr><th>Test</th><th>Inputs</th><th>Should output</th><th>Result</th></tr>';
      res.results.forEach(function (r, i) {
        var ins = (r.test.inputs || []).join(', ') || (r.test.givens ? 'different given data' : 'none');
        var should = (r.test.expect || []).map(function (x) { return esc(CIE.describe(x)); }).join(', ');
        var detail = r.pass ? '' : '<div style="font-weight:400;color:var(--text-dim);white-space:normal">' + esc(r.msg) +
          (r.outputs.length ? '<br>Your output: <span class="io">' + r.outputs.map(esc).join(' | ') + '</span>' : '') + '</div>';
        table += '<tr><td>' + (i + 1) + '</td><td class="io">' + esc(ins) + '</td><td class="io">' + should + '</td><td class="res ' + (r.pass ? 'p' : 'f') + '">' + (r.pass ? '✓ Pass' : '✗ Not yet') + detail + '</td></tr>';
      });
      table += '</table>';
      results.appendChild(el('div', { class: 'scroll-x', style: 'margin-top:.6rem' }, table));
      var sn = styleNotes(code);
      if (sn) results.appendChild(sn);
      if (!res.pass) {
        var failing = res.results.filter(function (r) { return !r.pass; })[0];
        if (failing && failing.test.inputs && failing.test.inputs.length) runInputs.value = failing.test.inputs.join(', ');
      }
    });

    resetBtn.addEventListener('click', function () {
      if (!confirm('Clear your work on this task and start again?')) return;
      delete store.drafts[k.id];
      persist();
      render();
    });

    repaintSupport();
    return card;
  }

  // ---------------------------------------------------------------- start
  function fromHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    var parts = h.split('/');
    var t = topicById(parts[0]);
    if (!t) { current.topic = null; render(); return; }
    var tab = ['learn', 'examples', 'practice'].indexOf(parts[1]) !== -1 ? parts[1] : 'learn';
    var idx = parts[2] ? parseInt(parts[2], 10) - 1 : undefined;
    go(t.id, tab, isNaN(idx) ? undefined : idx);
  }
  window.addEventListener('hashchange', fromHash);
  if (Support) {
    var slot = document.getElementById('supportSlot');
    if (slot) Support.mountToggle(slot, 'Support');
    Support.onChange(function () { if (repaintSupport) repaintSupport(); });
  }
  fromHash();
})();
