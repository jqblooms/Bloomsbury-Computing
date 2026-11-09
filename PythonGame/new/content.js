// Python Defense: the levels. Every task is made fresh each time (new values and names) in both languages: Python and
// Cambridge International pseudocode. The right answer is never stored: the game runs the program (run.js) and
// checks the student against what it really does.
//
// A task: { kind, ...fields }. Text fields may be a string, or { py, ps } when the two languages say it differently.
//   predict:   code { py, ps }, inputs?             type exactly what the program outputs
//   errortype: code, kind (syntax | logic | runtime | none), line { py, ps }, intent   which error, and on which line
//   fix:       code (broken), model, intent, tests [inputs], vars?   change it so it does what it should
//   write:     intent, model, tests, vars?, needs?  write a program from nothing (or from a start)
//   choice:    q, options, answer, why, code?       pick one answer
// vars: [{ py, ps, value }] values a variable must hold at the end (so a program cannot just print the answer).
// needs: [{ py, ps, say }] a regular expression the code must match (for example: use + to work it out).
var CONTENT = (function () {
  'use strict';
  var rnd = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var pick = function (l) { return l[Math.floor(Math.random() * l.length)]; };
  var shuffle = function (l) { var a = l.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var distinct = function (n, a, b) { var s = []; while (s.length < n) { var v = rnd(a, b); if (s.indexOf(v) < 0) s.push(v); } return s; };
  var PEOPLE = ['Ana', 'Ben', 'Chi', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivy', 'Jay', 'Kim', 'Leo'];
  var WORDS = ['Hello', 'Welcome', 'Ready', 'Goodbye', 'Level up', 'Game over', 'Well done', 'Try again', 'Good luck', 'You win'];
  var MISSPELL = { 'Hello': 'Helo', 'Welcome': 'Welcom', 'Ready': 'Raedy', 'Goodbye': 'Godbye', 'Level up': 'Levle up', 'Game over': 'Game ovre', 'Well done': 'Wel done', 'Try again': 'Try agian', 'Good luck': 'Good lcuk', 'You win': 'You wni' };
  // a variable's name in each language: Python snake_case, pseudocode in the Cambridge style (PascalCase)
  function V(n) { return { py: n, ps: n.split('_').map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('') }; }
  var q = function (s) { return '"' + s + '"'; };
  // one program in both languages from lines; a line is a string (the same in both) or [py, ps]
  function prog(lines) { return { py: lines.map(function (l) { return typeof l === 'string' ? l : l[0]; }).filter(function (l) { return l !== null; }).join('\n'), ps: lines.map(function (l) { return typeof l === 'string' ? l : l[1]; }).filter(function (l) { return l !== null; }).join('\n') }; }
  var out = function (py, ps) { return ['print(' + py + ')', 'OUTPUT ' + (ps == null ? py : ps)]; };
  var decl = function (v, type) { return [null, 'DECLARE ' + v.ps + ' : ' + type]; };
  var set = function (v, py, ps) { return [v.py + ' = ' + py, v.ps + ' <- ' + (ps == null ? py : ps)]; };
  var com = function (text) { return ['# ' + text, '// ' + text]; };
  // the line (1-based) of a program that holds a marker, in each language (DECLARE lines move pseudocode lines down)
  function lineOf(p, mark) { return { py: p.py.split('\n').findIndex(function (l) { return l.indexOf(mark) >= 0; }) + 1, ps: p.ps.split('\n').findIndex(function (l) { return l.indexOf(mark) >= 0; }) + 1 }; }

  // ------------------------------------------------------------------ stage 1: output and errors
  function printLine(kind) {   // one output line and what it prints, both languages
    var w = pick(WORDS), a = rnd(2, 12), b = rnd(2, 12);
    switch (kind || pick(['word', 'sum', 'quoted', 'times', 'join'])) {
      case 'word': return out(q(w));
      case 'sum': return out(a + ' + ' + b);
      case 'quoted': return out(q(a + ' + ' + b));          // the maths in quote marks is just text
      case 'times': return out(a + ' * ' + b);
      default: var n = pick(PEOPLE); return out(q(w + ' ') + ' + ' + q(n), q(w + ' ') + ' & ' + q(n));
    }
  }
  var S1 = {
    predict: function () {
      var lines = [printLine()]; if (Math.random() < 0.5) lines.push(printLine());
      return { kind: 'predict', code: prog(lines) };
    },
    predictComments: function () {
      var lines = shuffle([com(pick(['Say hello', 'Show the score', 'This line is a comment', 'Start of the program'])), printLine(), printLine()]);
      return { kind: 'predict', code: prog(lines), why: { py: 'A line starting with # is a comment: Python skips it.', ps: 'A line starting with // is a comment: it is not run.' } };
    },
    errortype: function () {
      var w = pick(WORDS), a = rnd(3, 12), b = rnd(3, 12), good = printLine('word');
      var cases = [
        function () { var p = prog([good, ['print("' + w + ')', 'OUTPUT "' + w]]); return { kind: 'syntax', code: p, line: { py: 2, ps: 2 }, intent: 'It should show ' + w + ' on a second line.' }; },
        function () { var p = prog([good, ['print("' + w + '"', 'OUTPUT "' + w]]); return { kind: 'syntax', code: p, line: { py: 2, ps: 2 }, intent: 'It should show a message, then ' + w + '.' }; },   // the faulty line last: Python reports a missing ) on the line after it
        function () { var p = prog([good, out(q(MISSPELL[w]))]); return { kind: 'logic', code: p, line: { py: 2, ps: 2 }, intent: 'It should show ' + w + ' on the second line.' }; },
        function () { var p = prog([out(a + ' - ' + b)]); return { kind: 'logic', code: p, line: { py: 1, ps: 1 }, intent: 'It should show the total of ' + a + ' and ' + b + '.' }; },
        function () { var p = prog([good, out(a + ' / 0')]); return { kind: 'runtime', code: p, line: { py: 2, ps: 2 }, intent: 'It should show a message, then a number.' }; },
        function () { var p = prog([good, out(a + ' + ' + b)]); return { kind: 'none', code: p, line: null, intent: 'It should show a message, then the total of ' + a + ' and ' + b + '.' }; }
      ];
      var t = pick(cases)(); return Object.assign({}, t, { kind: 'errortype', error: t.kind, why: WHY_ERR[t.kind] });
    },
    fix: function () {
      var w = pick(WORDS), n = pick(PEOPLE), a = rnd(3, 12), b = rnd(3, 12);
      var cases = [
        function () { return { code: prog([['print("' + w + ')', 'OUTPUT "' + w]]), model: prog([out(q(w))]) }; },
        function () { return { code: prog([['print("' + w + '"', 'OUTPUT ' + w + '"']]), model: prog([out(q(w))]) }; },
        function () { return { code: prog([out(q(MISSPELL[w]))]), model: prog([out(q(w))]) }; },
        function () { return { code: prog([out(q(w)), out(a + ' * ' + b)]), model: prog([out(q(w)), out(a + ' + ' + b)]) }; },
        function () { return { code: prog([out(q('Hello') + ' + ' + q(n), q('Hello') + ' & ' + q(n))]), model: prog([out(q('Hello ') + ' + ' + q(n), q('Hello ') + ' & ' + q(n))]) }; }
      ];
      var c = pick(cases)();
      return { kind: 'fix', code: c.code, model: c.model, tests: [[]] };
    },
    write: function () {
      var w = pick(WORDS), w2 = pick(WORDS.filter(function (x) { return x !== w; })), a = rnd(11, 40), b = rnd(11, 40);
      return pick([
        function () { return { kind: 'write', intent: 'Write a program that shows: ' + w, model: prog([out(q(w))]), tests: [[]] }; },
        function () { return { kind: 'write', intent: 'Write a program that shows ' + w + ', then ' + w2 + ' on the next line.', model: prog([out(q(w)), out(q(w2))]), tests: [[]] }; },
        function () { return { kind: 'write', intent: 'Write a program that works out ' + a + ' + ' + b + ' and shows the answer. Let the computer do the adding.', model: prog([out(a + ' + ' + b)]), tests: [[]], needs: [{ re: '\\+', say: 'Use + so the computer works it out.' }] }; }
      ])();
    },
    whyComments: function () {
      return { kind: 'choice', q: 'Why do programmers write comments in their code?', options: ['To explain the code to people reading it', 'To make the program run faster', 'To show text on the screen'], answer: 0,
        why: 'Comments are for people. The computer skips them, so they never change what the program does.' };
    }
  };
  var WHY_ERR = {
    syntax: { py: 'A syntax error breaks the rules of the language (a missing quote mark or bracket), so Python cannot run the program at all.', ps: 'A syntax error breaks the rules of the language (a missing quote mark), so the program cannot run at all.' },
    runtime: 'A runtime error happens while the program is running: here it tries to divide by zero, which cannot be done, so the program stops.',
    logic: 'A logic error runs without stopping, but does the wrong thing: the output is not what it should be.',
    none: 'The program runs and does exactly what it should, so there is no error.'
  };

  // ------------------------------------------------------------------ stage 2: variables and data types
  var S2 = {
    predict: function () {
      var x = V(pick(['score', 'coins', 'lives', 'points'])), a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9);
      return pick([
        function () { return prog([decl(x, 'INTEGER'), set(x, a), set(x, x.py + ' + ' + b, x.ps + ' + ' + b), out(x.py, x.ps)]); },
        function () { return prog([decl(x, 'INTEGER'), set(x, a), set(x, b), out(x.py, x.ps)]); },
        function () { return prog([decl(x, 'INTEGER'), set(x, a), set(x, x.py + ' * ' + c, x.ps + ' * ' + c), set(x, x.py + ' - ' + b, x.ps + ' - ' + b), out(x.py, x.ps)]); },
        function () { var n = V('name'), p = pick(PEOPLE); return prog([decl(n, 'STRING'), set(n, q(p)), out(q('Hi ') + ' + ' + n.py, q('Hi ') + ' & ' + n.ps)]); },
        function () { var t = V('total'), y = V('bonus'); return prog([decl(x, 'INTEGER'), decl(y, 'INTEGER'), decl(t, 'INTEGER'), set(x, a), set(y, b), set(t, x.py + ' + ' + y.py, x.ps + ' + ' + y.ps), out(t.py, t.ps)]); }
      ])();
    },
    types: function (lang) {
      var x = V(pick(['age', 'price', 'name', 'ready', 'letter', 'height', 'level']));
      var vals = [[rnd(2, 99), 'Integer'], [(rnd(10, 99) / 10).toFixed(1), 'Real'], [q(pick(PEOPLE)), 'String'], [q(String(rnd(10, 99))), 'String'], [['True', 'TRUE'], 'Boolean'], [['False', 'FALSE'], 'Boolean']];
      var v = pick(vals), opts = ['Integer', 'Real', 'String', 'Boolean'];
      var lit = Array.isArray(v[0]) ? v[0] : [String(v[0]), String(v[0])];
      return { kind: 'choice', code: prog([[x.py + ' = ' + lit[0], x.ps + ' <- ' + lit[1]]]), q: 'What data type is this value?', options: opts, answer: opts.indexOf(v[1]),
        why: { Integer: 'A whole number with no decimal point is an Integer.', Real: 'A number with a decimal point is a Real.', String: 'Anything in quote marks is a String, even digits.', Boolean: 'True and False are the two Boolean values.' }[v[1]] };
    },
    trace: function () {
      var a = V('a'), b = V('b'), t = V('temp'), va = rnd(2, 20), vb = rnd(21, 40);
      return pick([
        function () { return { kind: 'predict', code: prog([decl(a, 'INTEGER'), decl(b, 'INTEGER'), decl(t, 'INTEGER'), set(a, va), set(b, vb), set(t, a.py, a.ps), set(a, b.py, b.ps), set(b, t.py, t.ps), out(a.py, a.ps), out(b.py, b.ps)]),
          why: 'The temp variable keeps a copy of the first value, so the two values can swap.' }; },
        function () { var k = rnd(2, 9); return { kind: 'predict', code: prog([decl(a, 'INTEGER'), decl(b, 'INTEGER'), set(a, va), set(b, a.py + ' + ' + k, a.ps + ' + ' + k), set(a, b.py + ' * 2', b.ps + ' * 2'), out(a.py, a.ps), out(b.py, b.ps)]) }; }
      ])();
    },
    fix: function () {
      var x = V(pick(['score', 'coins', 'lives'])), a = rnd(5, 30), b = rnd(2, 9);
      return pick([
        function () {   // a misspelled variable: Python does not know the name; pseudocode says it was not declared
          var bad = x.py.slice(0, -1), badPs = x.ps.slice(0, -1);
          return { kind: 'fix', code: prog([decl(x, 'INTEGER'), set(x, a), out(bad, badPs)]), model: prog([decl(x, 'INTEGER'), set(x, a), out(x.py, x.ps)]), tests: [[]] };
        },
        function () {   // joining text and a number
          return { kind: 'fix', code: prog([decl(x, 'INTEGER'), set(x, a), ['print("You have " + ' + x.py + ')', 'OUTPUT "You have " & ' + x.ps]]), model: prog([decl(x, 'INTEGER'), set(x, a), ['print("You have " + str(' + x.py + '))', 'OUTPUT "You have ", ' + x.ps]]), tests: [[]],
            lang: 'py' };   // pseudocode joins them happily, so in pseudocode this task is the next one
        },
        function () {   // the wrong data type stored
          return { kind: 'fix', code: prog([decl(x, 'INTEGER'), [x.py + ' = "' + a + '"', x.ps + ' <- "' + a + '"'], set(x, x.py + ' + ' + b, x.ps + ' + ' + b), out(x.py, x.ps)]),
            model: prog([decl(x, 'INTEGER'), set(x, a), set(x, x.py + ' + ' + b, x.ps + ' + ' + b), out(x.py, x.ps)]), tests: [[]] };
        },
        function () {   // a logic error: the wrong operator
          return { kind: 'fix', code: prog([decl(x, 'INTEGER'), set(x, a), set(x, x.py + ' - ' + b, x.ps + ' - ' + b), out(x.py, x.ps)]), model: prog([decl(x, 'INTEGER'), set(x, a), set(x, x.py + ' + ' + b, x.ps + ' + ' + b), out(x.py, x.ps)]),
            intent: { py: x.py + ' should go up by ' + b + ', then be shown.', ps: x.ps + ' should go up by ' + b + ', then be shown.' }, tests: [[]] };
        }
      ])();
    },
    write: function () {
      var x = V(pick(['score', 'coins', 'points'])), a = rnd(5, 30), b = rnd(2, 9), n = V('name'), p = pick(PEOPLE);
      return pick([
        function () { return { kind: 'write', intent: { py: 'Store ' + a + ' in a variable called ' + x.py + '. Add ' + b + ' to it. Then show ' + x.py + '.', ps: 'Declare an INTEGER called ' + x.ps + '. Store ' + a + ' in it. Add ' + b + ' to it. Then output ' + x.ps + '.' },
          model: prog([decl(x, 'INTEGER'), set(x, a), set(x, x.py + ' + ' + b, x.ps + ' + ' + b), out(x.py, x.ps)]), tests: [[]], vars: [{ py: x.py, ps: x.ps, value: a + b }] }; },
        function () { return { kind: 'write', intent: { py: 'Store "' + p + '" in a variable called name. Then show Hello ' + p + ' using the variable.', ps: 'Declare a STRING called Name and store "' + p + '" in it. Then output Hello ' + p + ' using the variable.' },
          model: prog([decl(n, 'STRING'), set(n, q(p)), out(q('Hello ') + ' + ' + n.py, q('Hello ') + ' & ' + n.ps)]), tests: [[]], vars: [{ py: n.py, ps: n.ps, value: p }] }; }
      ])();
    },
    whyVariable: function () {
      return pick([
        { kind: 'choice', q: 'What does score = score + 5 do?', psq: 'What does Score <- Score + 5 do?', options: ['Adds 5 to the value already in score', 'Makes score equal to 5', 'Shows score + 5 on the screen'], answer: 0, why: 'The right-hand side is worked out first, using the old value, and the answer is stored back in the variable.' },
        { kind: 'choice', q: 'A variable is set to 4, then set to 9. What does it hold now?', options: ['9', '4', '13'], answer: 0, why: 'A variable holds one value at a time. Storing a new value replaces the old one.' },
        { kind: 'choice', q: 'Why use a variable instead of typing the number each time?', options: ['It stores a value that can change and be used again', 'It makes the program shorter to type every time', 'Numbers cannot be shown without one'], answer: 0, why: 'A variable is a named store in memory. Its value can change while the program runs.' }
      ]);
    }
  };

  // ------------------------------------------------------------------ the stages and levels
  // A level is a wave of bugs: one task per bug. mix: the generators to draw from, in order (cycled) or shuffled.
  var STAGES = [
    { stage: 1, title: 'Output and errors', band: 'KS3', levels: [
      { id: 1, title: 'What does it show?', bugs: 5, mix: [S1.predict] },
      { id: 2, title: 'Spot the error', bugs: 5, mix: [S1.errortype] },
      { id: 3, title: 'Fix the error', bugs: 4, mix: [S1.fix] },
      { id: 4, title: 'Write the output', bugs: 4, mix: [S1.write] },
      { id: 5, title: 'Comments', bugs: 4, mix: [S1.predictComments, S1.predictComments, S1.whyComments] },
      { id: 6, title: 'Stage 1 boss wave', bugs: 6, boss: true, mix: [S1.predict, S1.errortype, S1.fix, S1.write, S1.predictComments, S1.errortype] }] },
    { stage: 2, title: 'Variables and data types', band: 'KS3', levels: [
      { id: 7, title: 'Store and show', bugs: 5, mix: [function () { return { kind: 'predict', code: S2.predict() }; }] },
      { id: 8, title: 'Data types', bugs: 5, mix: [S2.types] },
      { id: 9, title: 'Trace the variables', bugs: 5, mix: [S2.trace, S2.trace, S2.whyVariable] },
      { id: 10, title: 'Fix the variable', bugs: 4, mix: [S2.fix] },
      { id: 11, title: 'Write with variables', bugs: 4, mix: [S2.write] },
      { id: 12, title: 'Stage 2 boss wave', bugs: 6, boss: true, mix: [function () { return { kind: 'predict', code: S2.predict() }; }, S2.types, S2.trace, S2.fix, S2.write, S2.whyVariable] }] }
  ];
  // A task for one bug: the level's generators in turn (shuffled once per wave), in the chosen language.
  function waveTasks(level, lang) {
    var gens = level.mix.length >= level.bugs ? shuffle(level.mix).slice(0, level.bugs) : Array.from({ length: level.bugs }, function (_, i) { return level.mix[i % level.mix.length]; });
    return gens.map(function (g) { var t; for (var k = 0; k < 20; k++) { t = g(lang); if (!t.lang || t.lang === lang) break; } return t; });
  }
  return { STAGES: STAGES, waveTasks: waveTasks, lineOf: lineOf };
})();
