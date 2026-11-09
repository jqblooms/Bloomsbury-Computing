// Python Defense: stages 3 to 11 (input to searching and sorting). The same rules as content.js: every task is made
// fresh in both languages, and the game finds the right answer by running the code.
(function () {
  'use strict';
  var H = CONTENT.H, rnd = H.rnd, pick = H.pick, shuffle = H.shuffle, distinct = H.distinct, V = H.V, q = H.q, prog = H.prog, out = H.out, decl = H.decl, set = H.set, PEOPLE = H.PEOPLE;
  var IND = '    ';
  // indent a block of lines (a line is a string, the same in both, or [py, ps]; null leaves a language out)
  function ind(lines) { return lines.map(function (l) { return typeof l === 'string' ? IND + l : [l[0] == null ? null : IND + l[0], l[1] == null ? null : IND + l[1]]; }); }
  var OPS = { '==': '=', '!=': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=' };
  // a comparison in both languages: a and b are variables V(...) or plain values
  function cmp(a, op, b) { var s = function (x, L) { return typeof x === 'object' ? x[L] : String(x); }; return [s(a, 'py') + ' ' + op + ' ' + s(b, 'py'), s(a, 'ps') + ' ' + OPS[op] + ' ' + s(b, 'ps')]; }
  function IF(c, body, els) { return [['if ' + c[0] + ':', 'IF ' + c[1] + ' THEN']].concat(ind(body), els ? [['else:', 'ELSE']].concat(ind(els)) : [], [[null, 'ENDIF']]); }
  function CHAIN(branches, els) {   // if / elif / else
    var l = [];
    branches.forEach(function (b, i) { l.push(i ? ['elif ' + b[0][0] + ':', 'ELSEIF ' + b[0][1] + ' THEN'] : ['if ' + b[0][0] + ':', 'IF ' + b[0][1] + ' THEN']); l = l.concat(ind(b[1])); });
    if (els) l = l.concat([['else:', 'ELSE']], ind(els));
    return l.concat([[null, 'ENDIF']]);
  }
  // FOR v <- a TO b (STEP s): Python's range stops before its end, so its end is one past b
  function FOR(v, a, b, body, step) {
    var end = typeof b === 'number' ? String(b + (step && step < 0 ? -1 : 1)) : b.py + (step && step < 0 ? ' - 1' : ' + 1');
    var r = 'range(' + (typeof a === 'object' ? a.py : a) + ', ' + end + (step ? ', ' + step : '') + ')';
    return [['for ' + v.py + ' in ' + r + ':', 'FOR ' + v.ps + ' <- ' + (typeof a === 'object' ? a.ps : a) + ' TO ' + (typeof b === 'object' ? b.ps : b) + (step ? ' STEP ' + step : '')]].concat(ind(body), [[null, 'NEXT ' + v.ps]]);
  }
  function WHILE(c, body) { return [['while ' + c[0] + ':', 'WHILE ' + c[1] + ' DO']].concat(ind(body), [[null, 'ENDWHILE']]); }
  function INP(v, type) { return [v.py + ' = ' + (type === 'int' ? 'int(input())' : type === 'real' ? 'float(input())' : 'input()'), 'INPUT ' + v.ps]; }
  var add = function (v, e) { return set(v, v.py + ' + ' + (typeof e === 'object' ? e.py : e), v.ps + ' + ' + (typeof e === 'object' ? e.ps : e)); };
  // an array: Python list, pseudocode ARRAY[1:n] filled one item at a time (the Cambridge way)
  function ARR(v, vals, type) { return [[v.py + ' = [' + vals.join(', ') + ']', 'DECLARE ' + v.ps + ' : ARRAY[1:' + vals.length + '] OF ' + (type || 'INTEGER')]].concat(vals.map(function (x, i) { return [null, v.ps + '[' + (i + 1) + '] <- ' + x]; })); }
  var at = function (v, i0) { return [v.py + '[' + i0 + ']', v.ps + '[' + (i0 + 1) + ']']; };   // the item at 0-based i0 in each language
  var T = function (py, ps) { return { py: py, ps: ps }; };
  var outv = function (v) { return out(v.py, v.ps); };
  var dI = function (v) { return decl(v, 'INTEGER'); }, dS = function (v) { return decl(v, 'STRING'); };
  function choice(q, opts, answer, why, code, psq) { return { kind: 'choice', q: q, psq: psq, options: opts, answer: answer, why: why, code: code }; }
  // an error task, its line found from a marker comment that is then removed
  function err(kind, lines, intent, why, inputs) {
    var p = prog(lines), mark = '@@';
    var line = kind === 'none' ? null : { py: p.py.split('\n').findIndex(function (l) { return l.indexOf(mark) >= 0; }) + 1, ps: p.ps.split('\n').findIndex(function (l) { return l.indexOf(mark) >= 0; }) + 1 };
    p = { py: p.py.replace(/ ?@@/g, ''), ps: p.ps.replace(/ ?@@/g, '') };
    return { kind: 'errortype', error: kind, code: p, line: line, intent: intent, why: why || H.WHY_ERR[kind], inputs: inputs || [] };
  }
  var M = function (l) { return typeof l === 'string' ? l + ' @@' : [l[0] == null ? null : l[0] + ' @@', l[1] == null ? null : l[1] + ' @@']; };   // mark the faulty line
  var pred = function (lines, inputs, why) { return { kind: 'predict', code: prog(lines), inputs: inputs || [], why: why }; };
  var fix = function (broken, model, tests, intent, vars) { return { kind: 'fix', code: prog(broken), model: prog(model), tests: tests || [[]], intent: intent, vars: vars }; };
  var write = function (intent, model, tests, needs, vars, start) { return { kind: 'write', intent: intent, model: prog(model), tests: tests || [[]], needs: needs, vars: vars, start: start }; };
  var LOOP = { re: '\\b(for|while|FOR|WHILE|REPEAT)\\b', say: 'Use a loop for this.' };
  var IFNEED = { re: '\\b(if|IF)\\b', say: 'Use an IF to decide.' };

  // ================================================================ stage 3: input and casting
  var x = V('number'), a = V('first'), b = V('second'), n = V('name'), age = V('age');
  var S3 = {
    predict: function () {
      var p = pick(PEOPLE), k = rnd(3, 20), j = rnd(3, 20);
      return pick([
        function () { return pred([dS(n), INP(n, 'str'), out(q('Hello ') + ' + ' + n.py, q('Hello ') + ', ' + n.ps)], [p]); },
        function () { return pred([dI(x), INP(x, 'int'), out(x.py + ' * 2', x.ps + ' * 2')], [String(k)]); },
        function () { return pred([dI(a), dI(b), INP(a, 'int'), INP(b, 'int'), out(a.py + ' + ' + b.py, a.ps + ' + ' + b.ps)], [String(k), String(j)]); },
        function () { return pred([dS(x), INP(x, 'str'), out(x.py + ' + ' + x.py, x.ps + ' & ' + x.ps)], [String(k)], { py: 'input() gives a String, so + joins the two copies of the text: it does not add.', ps: 'Number is a STRING, so & joins the two copies of the text.' }); }
      ])();
    },
    types: function (lang) {
      var v = pick([['str', 'String', 'STRING'], ['int', 'Integer', 'INTEGER'], ['real', 'Real', 'REAL']]), opts = ['Integer', 'Real', 'String', 'Boolean'];
      var code = { py: age.py + ' = ' + (v[0] === 'int' ? 'int(input())' : v[0] === 'real' ? 'float(input())' : 'input()'), ps: 'DECLARE ' + age.ps + ' : ' + v[2] + '\nINPUT ' + age.ps };
      return choice('The user types 14. What data type does ' + (lang === 'ps' ? age.ps : age.py) + ' hold?', opts, opts.indexOf(v[1]),
        lang === 'ps' ? 'INPUT stores what is typed in the variable, as the data type it was declared with.' : v[0] === 'str' ? 'input() always gives a String, even when the user types digits. Use int() or float() to change it.' : v[0] === 'int' ? 'int() changes the String from input() into an Integer.' : 'float() changes the String from input() into a Real.', code);
    },
    errortype: function () {
      var k = rnd(3, 20), j = rnd(3, 20), p = pick(PEOPLE);
      return pick([
        function () { return err('runtime', [dS(age), INP(age, 'str'), M(out(age.py + ' + 1', age.ps + ' + 1'))], 'It should show the age next year.', { py: 'A runtime error: age is a String, and + cannot add a String and a number. Python stops when it reaches that line.', ps: 'A runtime error: Age is a STRING, so + cannot add 1 to it. The program stops when it reaches that line.' }, [String(k)]); },
        function () { return err('runtime', [dI(age), M(INP(age, 'int')), out(age.py + ' + 1', age.ps + ' + 1')], 'It should show the age next year.', 'A runtime error: the user typed a word, which cannot be stored as a whole number, so the program stops.', ['ten']); },
        function () { return err('logic', [dI(a), dI(b), INP(a, 'int'), INP(b, 'int'), M(out(a.py + ' - ' + b.py, a.ps + ' - ' + b.ps))], 'It should show the total of the two numbers.', null, [String(k), String(j)]); },
        function () { return err('syntax', [dS(n), INP(n, 'str'), M(['print("Hi " + ' + n.py, 'OUTPUT "Hi , ' + n.ps])], 'It should say Hi to the user.', null, [p]); },
        function () { return err('none', [dS(n), INP(n, 'str'), out(q('Hi ') + ' + ' + n.py, q('Hi ') + ', ' + n.ps)], 'It should say Hi to the user.', null, [p]); }
      ])();
    },
    fix: function () {
      var t = [[String(rnd(3, 9))], [String(rnd(10, 30))]], t2 = [[String(rnd(3, 9)), String(rnd(3, 9))], [String(rnd(10, 30)), String(rnd(10, 30))]];
      return pick([
        function () { return fix([dS(x), INP(x, 'str'), out(x.py + ' * 3', x.ps + ' * 3')], [dI(x), INP(x, 'int'), out(x.py + ' * 3', x.ps + ' * 3')], t, 'It should show three times the number typed in.'); },
        function () { return fix([dS(a), dS(b), INP(a, 'str'), INP(b, 'str'), out(a.py + ' + ' + b.py, a.ps + ' + ' + b.ps)], [dI(a), dI(b), INP(a, 'int'), INP(b, 'int'), out(a.py + ' + ' + b.py, a.ps + ' + ' + b.ps)], t2, 'It should add the two numbers typed in.'); }
      ])();
    },
    write: function () {
      var t = [[pick(PEOPLE)], [pick(PEOPLE)]], t2 = [[String(rnd(2, 30)), String(rnd(2, 30))], [String(rnd(2, 30)), String(rnd(2, 30))], [String(rnd(2, 30)), String(rnd(2, 30))]];
      return pick([
        function () { return write(T('Ask for a name with input(), then show Welcome followed by the name.', 'Declare a STRING, INPUT a name into it, then OUTPUT Welcome followed by the name.'), [dS(n), INP(n, 'str'), out(q('Welcome ') + ' + ' + n.py, q('Welcome ') + ', ' + n.ps)], t); },
        function () { return write(T('Read two whole numbers with int(input()), then show their total.', 'Declare two INTEGERs, INPUT two numbers, then OUTPUT their total.'), [dI(a), dI(b), INP(a, 'int'), INP(b, 'int'), out(a.py + ' + ' + b.py, a.ps + ' + ' + b.ps)], t2); },
        function () { return write(T('Read a whole number, then show double it.', 'INPUT a whole number, then OUTPUT double it.'), [dI(x), INP(x, 'int'), out(x.py + ' * 2', x.ps + ' * 2')], [[String(rnd(2, 40))], [String(rnd(2, 40))]]); }
      ])();
    }
  };

  // ================================================================ stage 4: selection
  var mark = V('mark'), temp = V('temp');
  var S4 = {
    predict: function () {
      var pass = pick([40, 50, 60]), v = pick([pass - rnd(1, 9), pass, pass + rnd(1, 9)]), w = rnd(5, 35);
      return pick([
        function () { return pred([dI(mark), INP(mark, 'int')].concat(IF(cmp(mark, '>=', pass), [out(q('Pass'))], [out(q('Fail'))])), [String(v)]); },
        function () { return pred([dI(temp), INP(temp, 'int')].concat(CHAIN([[cmp(temp, '>', 25), [out(q('Hot'))]], [cmp(temp, '>', 15), [out(q('Warm'))]]], [out(q('Cold'))])), [String(w)]); },
        function () { var s = rnd(2, 9); return pred([dI(x), set(x, s)].concat(IF(cmp(x, '!=', 5), [set(x, x.py + ' * 2', x.ps + ' * 2')]), [outv(x)])); }
      ])();
    },
    ops: function (lang) {
      var py = lang !== 'ps', list = [['not equal to', py ? '!=' : '<>'], ['equal to', py ? '==' : '='], ['greater than or equal to', '>='], ['less than or equal to', '<=']];
      var k = rnd(0, 3), opts = list.map(function (o) { return o[1]; });
      return choice('Which operator means "' + list[k][0] + '"?', opts, k, py ? 'In Python, == compares and = stores; != means not equal to.' : 'In pseudocode, = compares, <- stores, and <> means not equal to.');
    },
    errortype: function () {
      var pass = pick([40, 50, 60]);
      return pick([
        function () { return err('syntax', [dI(mark), INP(mark, 'int'), M(['if ' + mark.py + ' >= ' + pass, 'IF ' + mark.ps + ' >= ' + pass]), ['    print("Pass")', '    OUTPUT "Pass"'], [null, 'ENDIF']], 'It should show Pass for ' + pass + ' or more.', { py: 'A syntax error: an if line must end with a colon.', ps: 'A syntax error: an IF line must end with THEN.' }, [String(pass + 3)]); },
        function () { return err('syntax', [dI(mark), INP(mark, 'int'), M(['if ' + mark.py + ' = ' + pass + ':', 'IF ' + mark.ps + ' <- ' + pass + ' THEN']), ['    print("Full marks")', '    OUTPUT "Full marks"'], [null, 'ENDIF']], 'It should show Full marks for exactly ' + pass + '.', { py: 'A syntax error: = stores a value. To compare, use ==.', ps: 'A syntax error: <- stores a value. To compare, use =.' }, [String(pass)]); },
        function () { return err('logic', [dI(mark), INP(mark, 'int')].concat([M(['if ' + mark.py + ' > ' + pass + ':', 'IF ' + mark.ps + ' > ' + pass + ' THEN'])], ind([out(q('Pass'))]), [['else:', 'ELSE']], ind([out(q('Fail'))]), [[null, 'ENDIF']]), 'A mark of ' + pass + ' or more should pass. The user types ' + pass + '.', 'A logic error: > leaves out ' + pass + ' itself. It should be >=, so ' + pass + ' passes too.', [String(pass)]); },
        function () { return err('none', [dI(mark), INP(mark, 'int')].concat(IF(cmp(mark, '>=', pass), [out(q('Pass'))], [out(q('Fail'))])), 'A mark of ' + pass + ' or more should pass.', null, [String(pass + 5)]); }
      ])();
    },
    fix: function () {
      var pass = pick([40, 50, 60]);
      return pick([
        function () { return fix([dI(mark), INP(mark, 'int')].concat(IF(cmp(mark, '>', pass), [out(q('Pass'))], [out(q('Fail'))])), [dI(mark), INP(mark, 'int')].concat(IF(cmp(mark, '>=', pass), [out(q('Pass'))], [out(q('Fail'))])), [[String(pass)], [String(pass - 1)], [String(pass + 7)]], 'A mark of ' + pass + ' or more should show Pass.'); },
        function () { return fix([dI(mark), INP(mark, 'int')].concat(CHAIN([[cmp(mark, '>=', 40), [out(q('C'))]], [cmp(mark, '>=', 70), [out(q('A'))]]], [out(q('U'))])), [dI(mark), INP(mark, 'int')].concat(CHAIN([[cmp(mark, '>=', 70), [out(q('A'))]], [cmp(mark, '>=', 40), [out(q('C'))]]], [out(q('U'))])), [[String(rnd(70, 99))], [String(rnd(40, 69))], [String(rnd(1, 39))]], '70 or more should be A, 40 to 69 should be C, and anything less U.'); }
      ])();
    },
    write: function () {
      return pick([
        function () { return write(T('Read an age (a whole number). Show Adult if it is 18 or more, otherwise show Child.', 'INPUT an age into an INTEGER. OUTPUT Adult if it is 18 or more, otherwise OUTPUT Child.'), [dI(age), INP(age, 'int')].concat(IF(cmp(age, '>=', 18), [out(q('Adult'))], [out(q('Child'))])), [['18'], ['17'], [String(rnd(30, 70))], [String(rnd(5, 12))]], [IFNEED]); },
        function () { return write(T('Read a temperature (a whole number). Show Hot if it is over 25, Warm if it is over 15, otherwise Cold.', 'INPUT a temperature into an INTEGER. OUTPUT Hot if it is over 25, Warm if it is over 15, otherwise Cold.'), [dI(temp), INP(temp, 'int')].concat(CHAIN([[cmp(temp, '>', 25), [out(q('Hot'))]], [cmp(temp, '>', 15), [out(q('Warm'))]]], [out(q('Cold'))])), [['30'], ['25'], ['20'], ['15'], ['3']], [IFNEED]); }
      ])();
    }
  };

  // ================================================================ stage 5: for loops
  var i = V('i'), total = V('total'), cnt = V('count');
  var S5 = {
    predict: function () {
      var s = rnd(1, 4), e = s + rnd(2, 4), k = rnd(2, 5);
      return pick([
        function () { return pred([dI(i)].concat(FOR(i, s, e, [outv(i)]))); },
        function () { return pred([dI(i)].concat(FOR(i, 1, rnd(3, 4), [out(i.py + ' * ' + k, i.ps + ' * ' + k)]))); },
        function () { return pred([dI(i), dI(total), set(total, 0)].concat(FOR(i, s, e, [add(total, i)]), [outv(total)]), [], 'The total gets each value of the loop counter added to it, one pass at a time.'); },
        function () { var top = pick([10, 12, 9]), st = pick([2, 3]); return pred([dI(i)].concat(FOR(i, top, 1, [outv(i)], -st))); }
      ])();
    },
    howMany: function (lang) {
      var s = rnd(1, 3), e = s + rnd(3, 6), times = e - s + 1, opts = shuffle([times, times - 1, times + 1]);
      return choice('How many times does this loop show Hi?', opts.map(String), opts.indexOf(times), lang === 'ps' ? 'FOR runs once for every value from ' + s + ' to ' + e + ', including both ends: ' + times + ' times.' : 'range(' + s + ', ' + (e + 1) + ') counts from ' + s + ' up to ' + e + ', and stops before ' + (e + 1) + ': ' + times + ' times.',
        prog([dI(i)].concat(FOR(i, s, e, [out(q('Hi'))]))));
    },
    errortype: function () {
      var e = rnd(4, 7);
      return pick([
        function () { return err('logic', [dI(i)].concat([M(['for ' + i.py + ' in range(1, ' + e + '):', 'FOR ' + i.ps + ' <- 1 TO ' + (e - 1)])], ind([outv(i)]), [[null, 'NEXT ' + i.ps]]), 'It should show every number from 1 to ' + e + '.', { py: 'A logic error: range(1, ' + e + ') stops before ' + e + '. To include ' + e + ', the end must be ' + (e + 1) + '.', ps: 'A logic error: the loop stops at ' + (e - 1) + ', so ' + e + ' is never shown.' }); },
        function () { return err('syntax', [dI(i), M(['for ' + i.py + ' in range(1, ' + (e + 1) + ')', 'FOR ' + i.ps + ' 1 TO ' + e]), ['    print(' + i.py + ')', '    OUTPUT ' + i.ps], [null, 'NEXT ' + i.ps]], 'It should show every number from 1 to ' + e + '.', { py: 'A syntax error: a for line must end with a colon.', ps: 'A syntax error: a FOR line needs <- to set the counter: FOR I <- 1 TO ' + e + '.' }); },
        function () { return err('none', [dI(i)].concat(FOR(i, 1, e, [outv(i)])), 'It should show every number from 1 to ' + e + '.'); }
      ])();
    },
    fix: function () {
      var e = rnd(4, 7), k = rnd(2, 5);
      return pick([
        function () { return fix([dI(i)].concat([['for ' + i.py + ' in range(1, ' + e + '):', 'FOR ' + i.ps + ' <- 1 TO ' + (e - 1)]], ind([outv(i)]), [[null, 'NEXT ' + i.ps]]), [dI(i)].concat(FOR(i, 1, e, [outv(i)])), [[]], 'It should show every number from 1 to ' + e + '.'); },
        function () { return fix([dI(i), dI(total), set(total, 0)].concat(FOR(i, 1, e, [set(total, i.py, i.ps)]), [outv(total)]), [dI(i), dI(total), set(total, 0)].concat(FOR(i, 1, e, [add(total, i)]), [outv(total)]), [[]], 'It should add up every number from 1 to ' + e + '.'); },
        function () { return fix([dI(i)].concat(FOR(i, 1, 5, [out(i.py + ' + ' + k, i.ps + ' + ' + k)])), [dI(i)].concat(FOR(i, 1, 5, [out(i.py + ' * ' + k, i.ps + ' * ' + k)])), [[]], 'It should show the first five answers of the ' + k + ' times table.'); }
      ])();
    },
    write: function () {
      var nn = V('n');
      return pick([
        function () { return write(T('Read a whole number n. Show every number from 1 to n, one per line. Use a for loop.', 'INPUT a whole number N. OUTPUT every number from 1 to N, one per line. Use a FOR loop.'), [dI(nn), dI(i), INP(nn, 'int')].concat(FOR(i, 1, nn, [outv(i)])), [[String(rnd(3, 6))], [String(rnd(7, 9))]], [LOOP]); },
        function () { return write(T('Read a whole number n. Show the first five answers of the n times table (n, 2n ... 5n), one per line.', 'INPUT a whole number N. OUTPUT the first five answers of the N times table, one per line.'), [dI(nn), dI(i), INP(nn, 'int')].concat(FOR(i, 1, 5, [out(i.py + ' * ' + nn.py, i.ps + ' * ' + nn.ps)])), [[String(rnd(2, 9))], [String(rnd(11, 15))]], [LOOP]); }
      ])();
    }
  };

  // ================================================================ stage 6: while loops
  var num = V('num'), sum = V('total');
  var S6 = {
    predict: function () {
      var s = rnd(1, 3), lim = rnd(20, 60), c = rnd(4, 7);
      return pick([
        function () { return pred([dI(x), set(x, s)].concat(WHILE(cmp(x, '<', lim), [set(x, x.py + ' * 2', x.ps + ' * 2')]), [outv(x)])); },
        function () { return pred([dI(x), set(x, c)].concat(WHILE(cmp(x, '>', 0), [outv(x), set(x, x.py + ' - 2', x.ps + ' - 2')]))); },
        function () { var v1 = rnd(2, 9), v2 = rnd(2, 9); return pred([dI(num), dI(sum), set(sum, 0), INP(num, 'int')].concat(WHILE(cmp(num, '!=', 0), [add(sum, num), INP(num, 'int')]), [outv(sum)]), [String(v1), String(v2), '0'], 'The loop keeps going until 0 is typed. 0 stops it and is not added.'); }
      ])();
    },
    errortype: function () {
      var c = rnd(4, 7);
      return pick([
        function () { return err('logic', [dI(x), set(x, 1)].concat([M(['while ' + x.py + ' < ' + c + ':', 'WHILE ' + x.ps + ' < ' + c + ' DO'])], ind([outv(x), add(x, 1)]), [[null, 'ENDWHILE']]), 'It should show every number from 1 to ' + c + '.', 'A logic error: < stops before ' + c + '. It should be <= so ' + c + ' is shown too.'); },
        function () { return err('syntax', [dI(x), set(x, 1), M(['while ' + x.py + ' <= ' + c, 'WHILE ' + x.ps + ' <= ' + c]), ['    print(' + x.py + ')', '    OUTPUT ' + x.ps], ['    ' + x.py + ' = ' + x.py + ' + 1', '    ' + x.ps + ' <- ' + x.ps + ' + 1'], [null, 'ENDWHILE']], 'It should show every number from 1 to ' + c + '.', { py: 'A syntax error: a while line must end with a colon.', ps: 'A syntax error: a WHILE line must end with DO.' }); },
        function () { return err('none', [dI(x), set(x, 1)].concat(WHILE(cmp(x, '<=', c), [outv(x), add(x, 1)])), 'It should show every number from 1 to ' + c + '.'); }
      ])();
    },
    fix: function () {
      var c = rnd(4, 7);
      return pick([
        function () { return fix([dI(x), set(x, 1)].concat(WHILE(cmp(x, '<', c), [outv(x), add(x, 1)])), [dI(x), set(x, 1)].concat(WHILE(cmp(x, '<=', c), [outv(x), add(x, 1)])), [[]], 'It should show every number from 1 to ' + c + '.'); },
        function () { return fix([dI(x), set(x, 1)].concat(WHILE(cmp(x, '<=', c), [outv(x)])), [dI(x), set(x, 1)].concat(WHILE(cmp(x, '<=', c), [outv(x), add(x, 1)])), [[]], 'It should show every number from 1 to ' + c + '. At the moment it never stops.'); }
      ])();
    },
    write: function () {
      return write(T('Keep reading whole numbers until the user types 0. Then show the total of the numbers. Use a while loop.', 'Keep INPUTting whole numbers until the user types 0. Then OUTPUT the total of the numbers. Use a WHILE loop.'),
        [dI(num), dI(sum), set(sum, 0), INP(num, 'int')].concat(WHILE(cmp(num, '!=', 0), [add(sum, num), INP(num, 'int')]), [outv(sum)]),
        [[String(rnd(2, 9)), String(rnd(2, 9)), '0'], ['0'], [String(rnd(10, 30)), String(rnd(10, 30)), String(rnd(10, 30)), '0']], [LOOP]);
    },
    forOrWhile: function () {
      return pick([
        choice('A program must show the numbers 1 to 100. Which loop fits best?', ['A count-controlled loop (for)', 'A condition-controlled loop (while)'], 0, 'You know before it starts how many times it runs, so a count-controlled loop fits.'),
        choice('A program must keep asking for a password until it is right. Which loop fits best?', ['A condition-controlled loop (while)', 'A count-controlled loop (for)'], 0, 'Nobody knows how many tries it will take, so the loop must keep going while a condition is true.'),
        choice('Why does a while loop need a line that changes its variable?', ['Otherwise the condition never becomes false and the loop never stops', 'Otherwise it runs only once', 'Otherwise it skips the loop'], 0, 'The condition is checked before each pass. If nothing inside changes it, it stays true for ever.')
      ]);
    }
  };

  // ================================================================ stage 7: lists and arrays (IGCSE)
  var L = V('scores'), item = V('item');
  var S7 = {
    predict: function () {
      var vals = distinct(5, 2, 60), k = rnd(0, 4);
      return pick([
        function () { var a0 = at(L, k); return pred(ARR(L, vals).concat([out(a0[0], a0[1])]), [], T('List indexes start at 0, so ' + L.py + '[' + k + '] is item number ' + (k + 1) + '.', 'This array starts at 1, so ' + L.ps + '[' + (k + 1) + '] is item number ' + (k + 1) + '.')); },
        function () { var c = V('i'); return pred(ARR(L, vals.slice(0, 4)).concat([dI(c), dI(total), set(total, 0)], [['for ' + c.py + ' in range(4):', 'FOR ' + c.ps + ' <- 1 TO 4']], ind([[total.py + ' = ' + total.py + ' + ' + L.py + '[' + c.py + ']', total.ps + ' <- ' + total.ps + ' + ' + L.ps + '[' + c.ps + ']']]), [[null, 'NEXT ' + c.ps]], [outv(total)])); },
        function () { var a1 = at(L, 1), a3 = at(L, 3); return pred(ARR(L, vals).concat([[a1[0] + ' = ' + a3[0], a1[1] + ' <- ' + a3[1]], out(a1[0], a1[1])])); }
      ])();
    },
    errortype: function () {
      var vals = distinct(4, 2, 60);
      return pick([
        function () { return err('runtime', ARR(L, vals).concat([M(['print(' + L.py + '[4])', 'OUTPUT ' + L.ps + '[5]'])]), 'It should show the last item.', T('A runtime error: the list has 4 items, at indexes 0 to 3. Index 4 is outside the list.', 'A runtime error: the array goes from 1 to 4, so 5 is outside it.')); },
        function () { return err('logic', ARR(L, vals).concat([M(['print(' + L.py + '[1])', 'OUTPUT ' + L.ps + '[2]'])]), 'It should show the first item.', T('A logic error: indexes start at 0, so the first item is ' + L.py + '[0].', 'A logic error: this array starts at 1, so the first item is ' + L.ps + '[1].')); },
        function () { return err('none', ARR(L, vals).concat([out(at(L, 0)[0], at(L, 0)[1])]), 'It should show the first item.'); }
      ])();
    },
    fix: function () {
      var vals = distinct(5, 2, 40), c = V('i');
      return fix(ARR(L, vals).concat([dI(c)], [['for ' + c.py + ' in range(1, 5):', 'FOR ' + c.ps + ' <- 2 TO 5']], ind([out(L.py + '[' + c.py + ']', L.ps + '[' + c.ps + ']')]), [[null, 'NEXT ' + c.ps]]),
        ARR(L, vals).concat([dI(c)], [['for ' + c.py + ' in range(0, 5):', 'FOR ' + c.ps + ' <- 1 TO 5']], ind([out(L.py + '[' + c.py + ']', L.ps + '[' + c.ps + ']')]), [[null, 'NEXT ' + c.ps]]), [[]], 'It should show every item, one per line. At the moment it misses one.');
    },
    write: function () {
      var vals = distinct(5, 2, 40), c = V('i'), s = vals.reduce(function (p, v) { return p + v; }, 0);
      var start = prog(ARR(L, vals));
      return write(T('The list ' + L.py + ' is set up for you. Use a loop to add up every item into a variable called total, then show total.', 'The array ' + L.ps + ' is set up for you. Use a loop to add up every item into an INTEGER called Total, then OUTPUT Total.'),
        ARR(L, vals).concat([dI(c), dI(total), set(total, 0)], [['for ' + c.py + ' in range(5):', 'FOR ' + c.ps + ' <- 1 TO 5']], ind([[total.py + ' = ' + total.py + ' + ' + L.py + '[' + c.py + ']', total.ps + ' <- ' + total.ps + ' + ' + L.ps + '[' + c.ps + ']']]), [[null, 'NEXT ' + c.ps]], [outv(total)]),
        [[]], [LOOP], [{ py: 'total', ps: 'Total', value: s }], start);
    }
  };

  // ================================================================ stage 8: strings (IGCSE)
  var wd = V('word');
  var WORDLIST = ['python', 'castle', 'planet', 'rocket', 'garden', 'silver', 'monkey', 'laptop', 'school', 'button'];
  var S8 = {
    predict: function () {
      var w = pick(WORDLIST), k = rnd(2, 4), s0 = rnd(0, 2);
      return pick([
        function () { return pred([dS(wd), set(wd, q(w)), out('len(' + wd.py + ')', 'LENGTH(' + wd.ps + ')')]); },
        function () { return pred([dS(wd), set(wd, q(w)), out(wd.py + '.upper()', 'UCASE(' + wd.ps + ')')]); },
        function () { return pred([dS(wd), set(wd, q(w)), out(wd.py + '[' + s0 + ':' + (s0 + k) + ']', 'SUBSTRING(' + wd.ps + ', ' + (s0 + 1) + ', ' + k + ')')], [], T('A slice [a:b] starts at index a (counting from 0) and stops before index b.', 'SUBSTRING(S, start, length): the first character is position 1.')); },
        function () { return pred([dS(wd), set(wd, q(w.toUpperCase())), out(wd.py + '.lower() + "!"', 'LCASE(' + wd.ps + ') & "!"')]); }
      ])();
    },
    errortype: function () {
      var w = pick(WORDLIST);
      return pick([
        function () { return err('logic', [dS(wd), set(wd, q(w)), M(['print(' + wd.py + '[1:4])', 'OUTPUT SUBSTRING(' + wd.ps + ', 2, 3)'])], 'It should show the first three letters.', T('A logic error: indexes start at 0, so the first three letters are ' + wd.py + '[0:3].', 'A logic error: the first character is position 1, so it should be SUBSTRING(' + wd.ps + ', 1, 3).')); },
        function () { return err('runtime', [dS(wd), set(wd, q(w)), M(['print("Letters: " + len(' + wd.py + '))', 'OUTPUT "Letters: " + LENGTH(' + wd.ps + ')'])], 'It should show how many letters the word has.', T('A runtime error: len() gives a number, and + cannot join text and a number. Use str(len(' + wd.py + ')).', 'A runtime error: + adds numbers, it cannot join text. Join with & or a comma.')); },
        function () { return err('none', [dS(wd), set(wd, q(w)), out(wd.py + '[0:3]', 'SUBSTRING(' + wd.ps + ', 1, 3)')], 'It should show the first three letters.'); }
      ])();
    },
    fix: function () {
      var w = pick(WORDLIST);
      return pick([
        function () { return fix([dS(wd), set(wd, q(w)), out(wd.py + '[1:3]', 'SUBSTRING(' + wd.ps + ', 2, 2)')], [dS(wd), set(wd, q(w)), out(wd.py + '[0:3]', 'SUBSTRING(' + wd.ps + ', 1, 3)')], [[]], 'It should show the first three letters of the word.'); },
        function () { return fix([dS(wd), set(wd, q(w)), out(wd.py + '.lower()', 'LCASE(' + wd.ps + ')')], [dS(wd), set(wd, q(w)), out(wd.py + '.upper()', 'UCASE(' + wd.ps + ')')], [[]], 'It should show the word in capital letters.'); }
      ])();
    },
    write: function () {
      var t = [[pick(WORDLIST)], [pick(WORDLIST)], [pick(PEOPLE)]];
      return pick([
        function () { return write(T('Read a word. Show how many letters it has, then show it in capital letters.', 'INPUT a word into a STRING. OUTPUT how many letters it has, then OUTPUT it in capital letters.'), [dS(wd), INP(wd, 'str'), out('len(' + wd.py + ')', 'LENGTH(' + wd.ps + ')'), out(wd.py + '.upper()', 'UCASE(' + wd.ps + ')')], t); },
        function () { return write(T('Read a word. Show its first letter.', 'INPUT a word into a STRING. OUTPUT its first letter.'), [dS(wd), INP(wd, 'str'), out(wd.py + '[0]', 'SUBSTRING(' + wd.ps + ', 1, 1)')], t); }
      ])();
    }
  };

  // ================================================================ stage 9: totals, counts, largest and smallest (IGCSE)
  var big = V('largest'), c9 = V('i');
  function loopOver(vals, body) { return [dI(c9)].concat([['for ' + c9.py + ' in range(' + vals.length + '):', 'FOR ' + c9.ps + ' <- 1 TO ' + vals.length]], ind(body), [[null, 'NEXT ' + c9.ps]]); }
  var el = [L.py + '[' + c9.py + ']', L.ps + '[' + c9.ps + ']'];
  var S9 = {
    predict: function () {
      var vals = distinct(5, 1, 40), lim = rnd(10, 30);
      return pick([
        function () { return pred(ARR(L, vals).concat([dI(cnt), set(cnt, 0)], loopOver(vals, IF([el[0] + ' > ' + lim, el[1] + ' > ' + lim], [add(cnt, 1)])), [outv(cnt)]), [], 'The count goes up by 1 for each item over ' + lim + '.'); },
        function () { return pred(ARR(L, vals).concat([dI(big), set(big, at(L, 0)[0], at(L, 0)[1])], loopOver(vals, IF([el[0] + ' > ' + big.py, el[1] + ' > ' + big.ps], [set(big, el[0], el[1])])), [outv(big)]), [], 'Each item bigger than the largest so far replaces it.'); },
        function () { return pred(ARR(L, vals).concat([dI(total), set(total, 0)], loopOver(vals, [set(total, total.py + ' + ' + el[0], total.ps + ' + ' + el[1])]), [outv(total)])); }
      ])();
    },
    fix: function () {
      var vals = distinct(5, 1, 40);
      return pick([
        function () { return fix(ARR(L, vals).concat([dI(total)], loopOver(vals, [set(total, 0), set(total, total.py + ' + ' + el[0], total.ps + ' + ' + el[1])]), [outv(total)]), ARR(L, vals).concat([dI(total), set(total, 0)], loopOver(vals, [set(total, total.py + ' + ' + el[0], total.ps + ' + ' + el[1])]), [outv(total)]), [[]], 'It should show the total of all the items. At the moment the total starts again on every pass.'); },
        function () { return fix(ARR(L, vals).concat([dI(big), set(big, at(L, 0)[0], at(L, 0)[1])], loopOver(vals, IF([el[0] + ' < ' + big.py, el[1] + ' < ' + big.ps], [set(big, el[0], el[1])])), [outv(big)]), ARR(L, vals).concat([dI(big), set(big, at(L, 0)[0], at(L, 0)[1])], loopOver(vals, IF([el[0] + ' > ' + big.py, el[1] + ' > ' + big.ps], [set(big, el[0], el[1])])), [outv(big)]), [[]], 'It should show the largest item.'); }
      ])();
    },
    write: function () {
      var how = V('how_many'), k = V('k');
      var mk = function () { var m = rnd(3, 5), vs = distinct(m, 1, 50).map(String); return [String(m)].concat(vs); };
      return pick([
        function () { return write(T('Read a whole number: how many numbers will follow. Then read that many whole numbers. Show their total.', 'INPUT how many numbers will follow, then INPUT that many whole numbers. OUTPUT their total.'),
          [dI(how), dI(k), dI(num), dI(total), set(total, 0), INP(how, 'int')].concat(FOR(k, 1, how, [INP(num, 'int'), add(total, num)]), [outv(total)]), [mk(), mk(), mk()], [LOOP]); },
        function () { return write(T('Read a whole number: how many numbers will follow. Then read that many whole numbers. Show the largest.', 'INPUT how many numbers will follow, then INPUT that many whole numbers. OUTPUT the largest.'),
          [dI(how), dI(k), dI(num), dI(big), set(big, 0), INP(how, 'int')].concat(FOR(k, 1, how, [INP(num, 'int')].concat(IF(cmp(num, '>', big), [set(big, num.py, num.ps)]))), [outv(big)]), [mk(), mk(), mk()], [LOOP]); }
      ])();
    },
    why: function () {
      return pick([
        choice('Why must total be set to 0 before the loop, and not inside it?', ['Inside the loop it would go back to 0 on every pass', 'Python needs every variable to be 0', 'It makes the loop run faster'], 0, 'A running total starts once, before the loop. Each pass then adds to what is already there.', null, 'Why must Total be set to 0 before the loop, and not inside it?'),
        choice('Why is largest set to the first item, not to 0, before the loop?', ['If every item were below 0, 0 would wrongly stay the largest', 'Arrays cannot hold 0', 'The loop starts at the last item'], 0, 'Starting with a real item from the list means the answer is always one of the items.', null, 'Why is Largest set to the first item, not to 0, before the loop?')
      ]);
    }
  };

  // ================================================================ stage 10: validation (IGCSE)
  var S10 = {
    which: function () {
      var c = pick([
        ['A mark must be between 0 and 100.', 'Range check'], ['A password must have at least 8 characters.', 'Length check'], ['An age must be a whole number, not text.', 'Type check'],
        ['The name box must not be left empty.', 'Presence check'], ['A date must look like 12/05/2026.', 'Format check'], ['The last digit of an ISBN is worked out from the other digits to catch typing mistakes.', 'Check digit']]);
      var opts = shuffle(['Range check', 'Length check', 'Type check', 'Presence check', 'Format check', 'Check digit']).filter(function (o) { return o !== c[1]; }).slice(0, 3).concat([c[1]]);
      opts = shuffle(opts);
      return choice(c[0] + ' Which validation check is this?', opts, opts.indexOf(c[1]), 'This is a ' + c[1].toLowerCase() + '.');
    },
    predict: function () {
      var lo = 1, hi = pick([10, 20, 100]), bad1 = hi + rnd(1, 20), good = rnd(lo, hi);
      return pred([dI(x), INP(x, 'int')].concat(WHILE([x.py + ' < ' + lo + ' or ' + x.py + ' > ' + hi, x.ps + ' < ' + lo + ' OR ' + x.ps + ' > ' + hi], [out(q('Try again')), INP(x, 'int')]), [out(q('Accepted ') + ' + str(' + x.py + ')', q('Accepted ') + ', ' + x.ps)]), [String(bad1), '0', String(good)], 'Each value outside ' + lo + ' to ' + hi + ' shows Try again and asks again. A value in range ends the loop.');
    },
    fix: function () {
      var hi = pick([10, 20, 100]);
      return fix([dI(x), INP(x, 'int')].concat(WHILE([x.py + ' < 1 or ' + x.py + ' >= ' + hi, x.ps + ' < 1 OR ' + x.ps + ' >= ' + hi], [out(q('Try again')), INP(x, 'int')]), [outv(x)]),
        [dI(x), INP(x, 'int')].concat(WHILE([x.py + ' < 1 or ' + x.py + ' > ' + hi, x.ps + ' < 1 OR ' + x.ps + ' > ' + hi], [out(q('Try again')), INP(x, 'int')]), [outv(x)]),
        [[String(hi)], [String(hi + 5), String(hi)], ['0', '3']], 'Any number from 1 to ' + hi + ' should be accepted, and ' + hi + ' itself is in range.');
    },
    write: function () {
      var hi = pick([10, 20, 50]);
      return write(T('Read a whole number. While it is less than 1 or more than ' + hi + ', show Invalid and read it again. Then show the number.', 'INPUT a whole number. While it is less than 1 or more than ' + hi + ', OUTPUT Invalid and INPUT it again. Then OUTPUT the number.'),
        [dI(x), INP(x, 'int')].concat(WHILE([x.py + ' < 1 or ' + x.py + ' > ' + hi, x.ps + ' < 1 OR ' + x.ps + ' > ' + hi], [out(q('Invalid')), INP(x, 'int')]), [outv(x)]),
        [[String(hi + 7), '0', String(rnd(1, hi))], [String(rnd(1, hi))], [String(-3), String(hi)]], [LOOP]);
    }
  };

  // ================================================================ stage 11: linear search and bubble sort (IGCSE)
  var tgt = V('target'), found = V('found'), j = V('j'), tmp = V('temp');
  function search(vals, target) {   // a linear search with a found flag, showing Found or Not found
    return ARR(L, vals).concat([dI(c9), dI(tgt), decl(found, 'BOOLEAN'), set(tgt, target), [found.py + ' = False', found.ps + ' <- FALSE']],
      [['for ' + c9.py + ' in range(' + vals.length + '):', 'FOR ' + c9.ps + ' <- 1 TO ' + vals.length]], ind(IF([el[0] + ' == ' + tgt.py, el[1] + ' = ' + tgt.ps], [[found.py + ' = True', found.ps + ' <- TRUE']])), [[null, 'NEXT ' + c9.ps]],
      IF([found.py, found.ps + ' = TRUE'], [out(q('Found'))], [out(q('Not found'))]));
  }
  function onePass(vals) {   // one pass of a bubble sort, then show every item
    var n1 = vals.length - 1;
    return ARR(L, vals).concat([dI(j), dI(tmp)], [['for ' + j.py + ' in range(' + n1 + '):', 'FOR ' + j.ps + ' <- 1 TO ' + n1]],
      ind(IF([L.py + '[' + j.py + '] > ' + L.py + '[' + j.py + ' + 1]', L.ps + '[' + j.ps + '] > ' + L.ps + '[' + j.ps + ' + 1]'], [[tmp.py + ' = ' + L.py + '[' + j.py + ']', tmp.ps + ' <- ' + L.ps + '[' + j.ps + ']'], [L.py + '[' + j.py + '] = ' + L.py + '[' + j.py + ' + 1]', L.ps + '[' + j.ps + '] <- ' + L.ps + '[' + j.ps + ' + 1]'], [L.py + '[' + j.py + ' + 1] = ' + tmp.py, L.ps + '[' + j.ps + ' + 1] <- ' + tmp.ps]])),
      [[null, 'NEXT ' + j.ps]], loopOver(vals, [out(el[0], el[1])]));
  }
  var S11 = {
    predictSearch: function () { var vals = distinct(5, 2, 60); return pred(search(vals, pick([pick(vals), rnd(61, 90)])), [], 'A linear search checks every item in turn, and sets found when it meets the target.'); },
    predictPass: function () { var vals = distinct(4, 2, 40); return pred(onePass(vals), [], 'In one pass, each pair next to each other is compared and swapped if the first is bigger. The largest item ends up at the end.'); },
    fix: function () {
      var vals = distinct(5, 2, 60), t = pick(vals.slice(0, 4));   // never the last item: with the bug, only the last item counts
      var broken = search(vals, t).map(function (l) { return Array.isArray(l) && l[0] === found.py + ' = True' ? l : l; });
      // the found flag is set to False inside the loop, so only the last item counts
      var bad = ARR(L, vals).concat([dI(c9), dI(tgt), decl(found, 'BOOLEAN'), set(tgt, t), [found.py + ' = False', found.ps + ' <- FALSE']],
        [['for ' + c9.py + ' in range(' + vals.length + '):', 'FOR ' + c9.ps + ' <- 1 TO ' + vals.length]], ind(IF([el[0] + ' == ' + tgt.py, el[1] + ' = ' + tgt.ps], [[found.py + ' = True', found.ps + ' <- TRUE']], [[found.py + ' = False', found.ps + ' <- FALSE']])), [[null, 'NEXT ' + c9.ps]],
        IF([found.py, found.ps + ' = TRUE'], [out(q('Found'))], [out(q('Not found'))]));
      void broken;
      return fix(bad, search(vals, t), [[]], 'It should show Found, because ' + t + ' is in the list. Each item that does not match should not undo an earlier match.');
    },
    write: function () {
      var vals = distinct(5, 2, 60), c = V('i');
      return write(T('The list ' + L.py + ' is set up for you. Read a whole number. Search the list with a loop, then show Found or Not found.', 'The array ' + L.ps + ' is set up for you. INPUT a whole number. Search the array with a loop, then OUTPUT Found or Not found.'),
        ARR(L, vals).concat([dI(c9), dI(tgt), decl(found, 'BOOLEAN'), INP(tgt, 'int'), [found.py + ' = False', found.ps + ' <- FALSE']], [['for ' + c9.py + ' in range(' + vals.length + '):', 'FOR ' + c9.ps + ' <- 1 TO ' + vals.length]], ind(IF([el[0] + ' == ' + tgt.py, el[1] + ' = ' + tgt.ps], [[found.py + ' = True', found.ps + ' <- TRUE']])), [[null, 'NEXT ' + c9.ps]], IF([found.py, found.ps + ' = TRUE'], [out(q('Found'))], [out(q('Not found'))])),
        [[String(vals[rnd(0, 4)])], [String(rnd(61, 90))], [String(vals[4])]], [LOOP], null, prog(ARR(L, vals)));
    },
    why: function () {
      return pick([
        choice('A list has 1000 items and the target is not in it. How many items does a linear search check?', ['1000', '1', '500'], 0, 'It only knows the target is missing after checking every item.'),
        choice('After one pass of a bubble sort, where is the largest item?', ['At the end', 'At the start', 'In the middle'], 0, 'Each swap carries the larger item one place along, so the largest is carried all the way to the end.')
      ]);
    }
  };

  // ================================================================ the stages
  var g = function (f) { return function (lang) { return f(lang); }; };
  CONTENT.STAGES.push(
    { stage: 3, title: 'Input and casting', band: 'KS3', levels: [
      { id: 13, title: 'What does it show? (input)', bugs: 5, mix: [S3.predict] },
      { id: 14, title: 'Input data types', bugs: 5, mix: [S3.types] },
      { id: 15, title: 'Spot the error (input)', bugs: 5, mix: [S3.errortype] },
      { id: 16, title: 'Fix the input', bugs: 4, mix: [S3.fix] },
      { id: 17, title: 'Write with input', bugs: 4, mix: [S3.write] },
      { id: 18, title: 'Stage 3 boss wave', bugs: 6, boss: true, mix: [S3.predict, g(S3.types), S3.errortype, S3.fix, S3.write, S3.predict] }] },
    { stage: 4, title: 'Selection', band: 'KS3', levels: [
      { id: 19, title: 'Follow the IF', bugs: 5, mix: [S4.predict] },
      { id: 20, title: 'Which operator?', bugs: 5, mix: [S4.ops] },
      { id: 21, title: 'Spot the error (IF)', bugs: 5, mix: [S4.errortype] },
      { id: 22, title: 'Fix the IF', bugs: 4, mix: [S4.fix] },
      { id: 23, title: 'Write an IF', bugs: 4, mix: [S4.write] },
      { id: 24, title: 'Stage 4 boss wave', bugs: 6, boss: true, mix: [S4.predict, S4.ops, S4.errortype, S4.fix, S4.write, S4.predict] }] },
    { stage: 5, title: 'FOR loops', band: 'KS3', levels: [
      { id: 25, title: 'Follow the loop', bugs: 5, mix: [S5.predict] },
      { id: 26, title: 'How many times?', bugs: 5, mix: [S5.howMany] },
      { id: 27, title: 'Spot the error (FOR)', bugs: 5, mix: [S5.errortype] },
      { id: 28, title: 'Fix the loop', bugs: 4, mix: [S5.fix] },
      { id: 29, title: 'Write a FOR loop', bugs: 4, mix: [S5.write] },
      { id: 30, title: 'Stage 5 boss wave', bugs: 6, boss: true, mix: [S5.predict, S5.howMany, S5.errortype, S5.fix, S5.write, S5.predict] }] },
    { stage: 6, title: 'WHILE loops', band: 'KS3', levels: [
      { id: 31, title: 'Follow the WHILE', bugs: 5, mix: [S6.predict] },
      { id: 32, title: 'FOR or WHILE?', bugs: 4, mix: [S6.forOrWhile, S6.predict, S6.forOrWhile] },
      { id: 33, title: 'Spot the error (WHILE)', bugs: 5, mix: [S6.errortype] },
      { id: 34, title: 'Fix the WHILE', bugs: 4, mix: [S6.fix] },
      { id: 35, title: 'Keep going until 0', bugs: 3, mix: [S6.write] },
      { id: 36, title: 'Stage 6 boss wave', bugs: 6, boss: true, mix: [S6.predict, S6.forOrWhile, S6.errortype, S6.fix, S6.write, S6.predict] }] },
    { stage: 7, title: 'Lists and arrays', band: 'IGCSE', levels: [
      { id: 37, title: 'Find the item', bugs: 5, mix: [S7.predict] },
      { id: 38, title: 'Spot the error (index)', bugs: 5, mix: [S7.errortype] },
      { id: 39, title: 'Fix the loop through', bugs: 4, mix: [S7.fix] },
      { id: 40, title: 'Total of a list', bugs: 3, mix: [S7.write] },
      { id: 41, title: 'Stage 7 boss wave', bugs: 6, boss: true, mix: [S7.predict, S7.errortype, S7.fix, S7.write, S7.predict, S7.errortype] }] },
    { stage: 8, title: 'String handling', band: 'IGCSE', levels: [
      { id: 42, title: 'Length, case and parts', bugs: 5, mix: [S8.predict] },
      { id: 43, title: 'Spot the error (strings)', bugs: 5, mix: [S8.errortype] },
      { id: 44, title: 'Fix the string', bugs: 4, mix: [S8.fix] },
      { id: 45, title: 'Write with strings', bugs: 4, mix: [S8.write] },
      { id: 46, title: 'Stage 8 boss wave', bugs: 6, boss: true, mix: [S8.predict, S8.errortype, S8.fix, S8.write, S8.predict, S8.errortype] }] },
    { stage: 9, title: 'Totals, counts, largest', band: 'IGCSE', levels: [
      { id: 47, title: 'Follow the total', bugs: 5, mix: [S9.predict] },
      { id: 48, title: 'Why start there?', bugs: 4, mix: [S9.why, S9.predict] },
      { id: 49, title: 'Fix the total', bugs: 4, mix: [S9.fix] },
      { id: 50, title: 'Write a total or largest', bugs: 3, mix: [S9.write] },
      { id: 51, title: 'Stage 9 boss wave', bugs: 6, boss: true, mix: [S9.predict, S9.why, S9.fix, S9.write, S9.predict, S9.fix] }] },
    { stage: 10, title: 'Validation', band: 'IGCSE', levels: [
      { id: 52, title: 'Which check?', bugs: 5, mix: [S10.which] },
      { id: 53, title: 'Follow the validation', bugs: 4, mix: [S10.predict] },
      { id: 54, title: 'Fix the range check', bugs: 3, mix: [S10.fix] },
      { id: 55, title: 'Write a range check', bugs: 3, mix: [S10.write] },
      { id: 56, title: 'Stage 10 boss wave', bugs: 6, boss: true, mix: [S10.which, S10.predict, S10.fix, S10.write, S10.which, S10.predict] }] },
    { stage: 11, title: 'Searching and sorting', band: 'IGCSE', levels: [
      { id: 57, title: 'Follow a linear search', bugs: 4, mix: [S11.predictSearch] },
      { id: 58, title: 'One bubble sort pass', bugs: 3, mix: [S11.predictPass] },
      { id: 59, title: 'Fix the search', bugs: 3, mix: [S11.fix] },
      { id: 60, title: 'Write a linear search', bugs: 3, mix: [S11.write] },
      { id: 61, title: 'Stage 11 boss wave', bugs: 6, boss: true, mix: [S11.predictSearch, S11.why, S11.predictPass, S11.fix, S11.write, S11.why] }] }
  );
})();
