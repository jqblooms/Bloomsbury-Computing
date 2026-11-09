// Python Defense: running a program in either language and saying what happened.
//   Python: real Python in the page (Skulpt, as Python Lab, PyLab/common.js).
//   Pseudocode: Cambridge International pseudocode (shared/pseudocode-engine.js): every variable is DECLAREd first,
//   <- assigns, OUTPUT shows a value. OUTPUT "Total is ", Total is written the Cambridge way with a comma: the
//   commas between values are joined as & before the engine runs it.
// run(lang, code, inputs) resolves { out: [lines], error: null | { kind: 'syntax' | 'runtime', message, line },
//   vars: { name: value } }. Nothing here waits for an animation frame.
var RUN = (function () {
  'use strict';

  // ------------------------------------------------------------------ Python
  var queue = Promise.resolve();
  function py(code, inputs) {
    var p = queue.then(function () { return pyNow(code, inputs); });
    queue = p.then(function () {}, function () {});
    return p;
  }
  function pyNow(code, inputs) {
    return new Promise(function (resolve) {
      var out = '', k = 0;
      Sk.configure({
        output: function (t) { out += t; },
        read: function (x) { if (Sk.builtinFiles && Sk.builtinFiles.files[x]) return Sk.builtinFiles.files[x]; throw new Error("File not found: '" + x + "'"); },
        inputfun: function () { var v = inputs && k < inputs.length ? String(inputs[k]) : ''; k++; return v; },
        inputfunTakesPrompt: true,
        __future__: Sk.python3,
        execLimit: 3000,
        yieldLimit: 100
      });
      var done = function (mod, err) {
        var lines = String(out).replace(/\r/g, '').split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        var vars = {};
        if (mod && mod.$d) Object.keys(mod.$d).forEach(function (n) { if (!/^__/.test(n)) { try { vars[n.replace(/_\$r[nw]\$$/, '')] = Sk.ffi.remapToJs(mod.$d[n]); } catch (e) { } } });   // Skulpt renames names that clash with JavaScript (name -> name_$rw$)
        var error = err ? pyError(err) : null, last = code.replace(/\s+$/, '').split('\n').length;
        if (error && error.line > last) error.line = last;   // a bracket never closed: Skulpt says the end of the file, real Python 3 says the line it opened on (the last one here)
        resolve({ out: lines, error: error, vars: vars });
      };
      Sk.misceval.asyncToPromise(function () { return Sk.importMainWithBody('<stdin>', false, code, true); })
        .then(function (m) { done(m, null); }, function (e) { done(null, e); });
    });
  }
  // Errors in the words of the lesson: a syntax error stops Python reading the program; a runtime error happens
  // while it runs.
  function pyError(e) {
    var msg = e && e.toString ? e.toString() : String(e), m = /on line (\d+)/.exec(msg), line = m ? +m[1] : null;
    var syntax = /SyntaxError|ParseError|TokenError|IndentationError/.test(msg);
    var text;
    if (/TimeLimitError|run time limit/.test(msg)) text = 'The program ran too long (a loop that never stops?).';
    else if (/ZeroDivisionError/.test(msg)) text = 'You cannot divide by zero.';
    else if (/NameError/.test(msg)) { var n = /name '([^']+)'/.exec(msg); text = 'Python does not know the name ' + (n ? '"' + n[1] + '"' : 'used here') + '. Check the spelling, and store a value in it first.'; }
    else if (/concatenate|unsupported operand|must be str|can only concatenate/.test(msg)) text = '+ cannot join a string and a number. Use str() to turn the number into a string first.';
    else if (/invalid literal for int\(\)/.test(msg)) text = 'int() was given text that is not a whole number.';
    else if (/could not convert string to float/.test(msg)) text = 'float() was given text that is not a number.';
    else if (/IndexError/.test(msg)) text = 'That index is outside the list.';
    else if (/IndentationError/.test(msg)) text = 'The spaces at the start of a line are wrong.';
    else if (syntax) text = 'Python cannot read this line. Check the brackets and quote marks.';
    else text = msg.replace(/ on line \d+/, '');
    return { kind: syntax ? 'syntax' : 'runtime', message: text, line: line };
  }

  // ------------------------------------------------------------------ Cambridge pseudocode
  // OUTPUT a, b, c: join the values with & (the shared engine takes one value per OUTPUT).
  function outputCommas(src) {
    return src.split('\n').map(function (line) {
      var m = /^(\s*OUTPUT\s+)(.*)$/i.exec(line); if (!m) return line;
      var s = m[2], parts = [], depth = 0, q = null, cur = '';
      for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (q) { cur += c; if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; cur += c; continue; }
        if (c === '/' && s[i + 1] === '/') { cur += s.slice(i); i = s.length; break; }
        if (c === '(' || c === '[') depth++;
        if (c === ')' || c === ']') depth--;
        if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
        cur += c;
      }
      parts.push(cur.trim());
      return parts.length > 1 ? m[1] + parts.join(' & ') : line;
    }).join('\n');
  }
  var showPs = function (v) { return v === true ? 'TRUE' : v === false ? 'FALSE' : String(v); };
  function ps(code, inputs) {
    var E = window.PseudocodeEngine, src = outputCommas(code);
    try { E.compile(src); }
    catch (e) { return Promise.resolve({ out: [], error: { kind: 'syntax', message: e.message, line: e.line || null }, vars: {} }); }
    var r = E.runPseudocode(src, {}, 3000, (inputs || []).map(String));
    var out = [];
    r.outputs.forEach(function (o) { String(showPs(o)).split('\n').forEach(function (l) { out.push(l); }); });
    return Promise.resolve({ out: out, error: r.error ? { kind: 'runtime', message: r.error.message, line: r.error.line || null } : null, vars: r.vars || {} });
  }

  function run(lang, code, inputs) { return lang === 'ps' ? ps(code, inputs) : py(code, inputs); }
  // Output lines as typed by a student: trailing spaces and blank lines at the end do not count.
  function clean(lines) { var a = lines.map(function (l) { return String(l).replace(/\s+$/, ''); }); while (a.length && a[a.length - 1] === '') a.pop(); return a; }
  function same(a, b) { a = clean(a); b = clean(b); return a.length === b.length && a.every(function (l, i) { return l === b[i]; }); }
  return { run: run, clean: clean, same: same, outputCommas: outputCommas };
})();
