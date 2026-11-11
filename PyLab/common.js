// Python Lab shared pieces: element helpers, the height report for lesson embeds, running Python (Skulpt, as in
// ContestCode/js/app.js), plain error messages, the code box, the code editor keys and the result log posted to the
// site. Nothing waits for requestAnimationFrame: a lesson preloads the app in a hidden frame, where animation
// frames never fire.
var PL = (function () {
  'use strict';
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>'
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

  // ------------------------------------------------------------------ running Python
  // inputs: what the user types, in order. Prompts go to `prompts`, not to the output, so a check compares only
  // what print shows. Resolves { out: [lines], error, globals, prompts }.
  // Skulpt has one global configuration, so runs wait for each other in a queue.
  var queue = Promise.resolve();
  function run(code, inputs) {
    var p = queue.then(function () { return runNow(code, inputs); });
    queue = p.then(function () {}, function () {});
    return p;
  }
  function runNow(code, inputs) {
    return new Promise(function (resolve) {
      var out = '', k = 0, prompts = [];
      Sk.configure({
        output: function (t) { out += t; },
        read: function (x) { if (Sk.builtinFiles && Sk.builtinFiles.files[x]) return Sk.builtinFiles.files[x]; throw new Error("File not found: '" + x + "'"); },
        inputfun: function (p) { var v = inputs && k < inputs.length ? inputs[k] : ''; prompts.push({ prompt: p == null ? '' : String(p), typed: v }); k++; return v; },
        inputfunTakesPrompt: true,
        __future__: Sk.python3,
        execLimit: 4000,
        yieldLimit: 100
      });
      var done = function (mod, err) {
        var lines = String(out).replace(/\r/g, '').split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        resolve({ out: lines, error: err ? friendly(err) : null, raw: err ? String(err) : null, globals: mod ? mod.$d : null, prompts: prompts });
      };
      Sk.misceval.asyncToPromise(function () { return Sk.importMainWithBody('<stdin>', false, code, true); })
        .then(function (m) { done(m, null); }, function (e) { done(null, e); });
    });
  }
  // A plain message for the errors Year 7 meets, with the line number.
  function friendly(e) {
    var msg = e && e.toString ? e.toString() : String(e);
    var line = /on line (\d+)/.exec(msg), at = line ? ' (line ' + line[1] + ')' : '';
    if (/TimeLimitError|run time limit/.test(msg)) return 'Your program ran too long.';
    // + gets the join message; - * / with a String get their own (a reviewer saw "5" - 1 called a join).
    if (/unsupported operand type\(s\) for [-*\/%]|can't multiply sequence/.test(msg)) return 'Error' + at + ': - * and / only work on numbers. Is one of these a String?';
    if (/concatenate|unsupported operand|must be str|can only concatenate/.test(msg)) return 'Error' + at + ': + cannot join a String and a number. Turn one into the other type first.';
    if (/invalid literal for int\(\)/.test(msg)) return 'Error' + at + ': int() was given text that is not a whole number.';
    if (/could not convert string to float|invalid literal for float/.test(msg)) return 'Error' + at + ': float() was given text that is not a number.';
    if (/NameError/.test(msg)) { var n = /name '([^']+)'/.exec(msg); return 'Error' + at + ': Python does not know ' + (n ? '"' + n[1] + '"' : 'a name') + '. Store a value in it first, and check the spelling. If it is text, put quote marks round it.'; }
    if (/SyntaxError|ParseError|TokenError/.test(msg)) return 'Error' + at + ': Python cannot read this line. Check brackets, quote marks and the = sign.';
    if (/IndentationError/.test(msg)) return 'Error' + at + ': a line starts with spaces it should not have.';
    return 'Error' + at + ': ' + msg.replace(/ on line \d+/, '');
  }
  function pyType(v) {
    if (!v) return null;
    if (v instanceof Sk.builtin.bool) return 'bool';
    if (v instanceof Sk.builtin.int_ || (Sk.builtin.lng && v instanceof Sk.builtin.lng)) return 'int';
    if (v instanceof Sk.builtin.float_) return 'float';
    if (v instanceof Sk.builtin.str) return 'str';
    return 'other';
  }
  function pyValue(v) { try { return Sk.ffi.remapToJs(v); } catch (e) { return null; } }
  var TYPE_NAME = { int: 'Integer', float: 'Real', str: 'String' };

  // A program in a code box, lines numbered.
  function codeBox(code, cls) {
    return '<ol class="code ' + (cls || '') + '">' + code.split('\n').map(function (l) { return '<li><code>' + (esc(l) || ' ') + '</code></li>'; }).join('') + '</ol>';
  }
  // The screen after a run: prompts with what was typed, then each print line.
  function screen(r, marks) {
    var rows = r.prompts.map(function (p) { return '<div class="scr-in"><span>' + esc(p.prompt) + '</span><b>' + esc(p.typed) + '</b></div>'; });
    r.out.forEach(function (l, i) { rows.push('<div class="scr-out' + (marks ? (marks[i] ? ' good' : ' bad') : '') + '">' + (esc(l) || '&nbsp;') + '</div>'); });
    if (r.error) rows.push('<div class="scr-err">' + esc(r.error) + '</div>');
    if (!rows.length) rows.push('<div class="scr-out dim">(nothing printed)</div>');
    return '<div class="screen"><div class="screen-title">Python ran it</div>' + rows.join('') + '</div>';
  }

  // Tab indents by four spaces; Enter keeps the indent.
  function editorKeys(e) {
    var ta = e.target, s = ta.selectionStart, end = ta.selectionEnd, v = ta.value;
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ta.value = v.slice(0, s) + '    ' + v.slice(end); ta.selectionStart = ta.selectionEnd = s + 4; ta.dispatchEvent(new Event('input')); }
    else if (e.key === 'Enter') {
      var lineStart = v.lastIndexOf('\n', s - 1) + 1, indent = (v.slice(lineStart, s).match(/^ */) || [''])[0];
      e.preventDefault();
      ta.value = v.slice(0, s) + '\n' + indent + v.slice(end);
      ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
      ta.dispatchEvent(new Event('input'));
    }
  }

  // ------------------------------------------------------------------ results for the teacher
  // Each activity posts its rounds after every round as BC_APP_RESULT; the lesson slide saves it as that slide's
  // answer (js/steps/embeds.html in the shell). Once finished on this computer it stays finished.
  var Q = new URLSearchParams(location.search);
  var KEY = (Q.get('activity') || '') + (Q.get('part') ? '-' + Q.get('part') : '');
  function results(label) {
    var lines = [], right = 0, done = false, key = 'bc-pylab-done-v1:' + KEY, before = false;
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !KEY) return;
      var head = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' right in ' + lines.length + ' tries.';
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'pylab-' + KEY, label: 'Python Lab: ' + label,
          summary: head + (lines.length ? ' ' + lines.join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; lines.push((lines.length + 1) + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.'); if (lines.length > 30) lines.shift(); post(); },
      finish: function () { done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); }
    };
  }
  // The level bar: "Level 2 of 3", clean rounds so far.
  function levelBar(level, levels, clean, need, spoiled) {
    return '<span class="round">Level ' + (level + 1) + ' of ' + levels + '</span><span class="score">Rounds with no mistakes: <b>' + clean + '</b> of ' + need + ' needed</span>' +
      (spoiled ? '<span class="spoiled">A mistake: this round does not count</span>' : '');
  }

  return { el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, say: say, doneBanner: doneBanner, run: run, friendly: friendly,
    pyType: pyType, pyValue: pyValue, TYPE_NAME: TYPE_NAME, codeBox: codeBox, screen: screen, editorKeys: editorKeys, results: results,
    levelBar: levelBar, query: Q, activities: {} };
})();
