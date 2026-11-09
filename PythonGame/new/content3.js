// Python Defense: stage 12, IGCSE Paper 2. Original tasks in the style of the 0478 Paper 2 questions: trace an
// algorithm, DIV and MOD, state the purpose, find the line with the error, find and correct errors, write the
// algorithm. The same rules as content.js: made fresh each time in both languages, answers found by running the code.
(function () {
  'use strict';
  var H = CONTENT.H, G = CONTENT.H2, rnd = H.rnd, pick = H.pick, shuffle = H.shuffle, distinct = H.distinct, V = H.V, q = H.q, out = H.out, set = H.set;
  var ind = G.ind, IF = G.IF, WHILE = G.WHILE, FOR = G.FOR, INP = G.INP, add = G.add, T = G.T, outv = G.outv, dI = G.dI, dS = G.dS, choice = G.choice, err = G.err, M = G.M, pred = G.pred, fix = G.fix, write = G.write, LOOP = G.LOOP, prog = H.prog;
  var IND = '    ';
  // REPEAT ... UNTIL c: Python has no REPEAT, so it loops forever and breaks out when c is true
  function REPEAT(body, c) { return [['while True:', 'REPEAT']].concat(ind(body), [[IND + 'if ' + c[0] + ':', null], [IND + IND + 'break', null], [null, 'UNTIL ' + c[1]]]); }
  var DIVMOD = { re: '(//|%|\\bDIV\\b|\\bMOD\\b)', say: 'Use DIV and MOD (// and % in Python) to take the number apart.' };
  var DIV = function (a, b) { return [a.py + ' // ' + b, a.ps + ' DIV ' + b]; }, MOD = function (a, b) { return [a.py + ' % ' + b, a.ps + ' MOD ' + b]; };
  var labelled = function (text, v) { return out(q(text + ' ') + ' + str(' + v.py + ')', q(text + ' ') + ', ' + v.ps); };

  var n = V('number'), total = V('total'), cnt = V('count'), rev = V('reverse'), big = V('largest'), d = V('digit'), val = V('value'), k = V('k'), how = V('how_many'), mark = V('mark'), pw = V('password'), tries = V('tries');

  // ---------------------------------------------------------------- the algorithms (b: which errors to put in)
  // add up the digits
  function digitSum(b) {
    b = b || {};
    return [dI(n), dI(total), INP(n, 'int'), b.init ? M(set(total, 1)) : set(total, 0)].concat(
      WHILE(b.cond ? [n.py + ' > 9 @@', n.ps + ' > 9 @@'] : [n.py + ' > 0', n.ps + ' > 0'],
        [b.mod ? M(set(total, total.py + ' + ' + n.py + ' // 10', total.ps + ' + ' + n.ps + ' DIV 10')) : set(total, total.py + ' + ' + MOD(n, 10)[0], total.ps + ' + ' + MOD(n, 10)[1]), set(n, DIV(n, 10)[0], DIV(n, 10)[1])]),
      [outv(total)]);
  }
  // count the digits (REPEAT, so 0 has one digit)
  function digitCount() { return [dI(n), dI(cnt), INP(n, 'int'), set(cnt, 0)].concat(REPEAT([set(n, DIV(n, 10)[0], DIV(n, 10)[1]), add(cnt, 1)], [n.py + ' == 0', n.ps + ' = 0']), [outv(cnt)]); }
  // reverse the digits
  function digitReverse() { return [dI(n), dI(rev), INP(n, 'int'), set(rev, 0)].concat(WHILE([n.py + ' > 0', n.ps + ' > 0'], [set(rev, rev.py + ' * 10 + ' + MOD(n, 10)[0], rev.ps + ' * 10 + ' + MOD(n, 10)[1]), set(n, DIV(n, 10)[0], DIV(n, 10)[1])]), [outv(rev)]); }
  // the largest digit
  function digitLargest() { return [dI(n), dI(d), dI(big), INP(n, 'int'), set(big, 0)].concat(WHILE([n.py + ' > 0', n.ps + ' > 0'], [set(d, MOD(n, 10)[0], MOD(n, 10)[1])].concat(IF([d.py + ' > ' + big.py, d.ps + ' > ' + big.ps], [set(big, d.py, d.ps)]), [set(n, DIV(n, 10)[0], DIV(n, 10)[1])])), [outv(big)]); }
  var DIGIT = [[digitSum, 'Adds up the digits of the number'], [digitCount, 'Counts how many digits the number has'], [digitReverse, 'Outputs the number with its digits reversed'], [digitLargest, 'Finds the largest digit in the number']];

  // read values until -1 is typed (a rogue value), then output the total and how many were typed
  function rogue(b) {
    b = b || {};
    return [dI(val), dI(total), dI(cnt), b.init ? M(set(total, 1)) : set(total, 0), b.count0 ? M(set(cnt, 1)) : set(cnt, 0), INP(val, 'int')].concat(
      WHILE([val.py + ' != -1', val.ps + ' <> -1'], [add(total, val), b.step ? M(set(cnt, cnt.py + ' + ' + val.py, cnt.ps + ' + ' + val.ps)) : add(cnt, 1), INP(val, 'int')]),
      [labelled('Total', total), labelled('Count', cnt)]);
  }
  function rogueInputs() { return distinct(rnd(3, 5), 2, 40).map(String).concat(['-1']); }
  // rogue-value loops for the purpose questions
  function rogueKind(kind, lim) {
    var head = [dI(val), INP(val, 'int')];
    if (kind === 'count') return [dI(cnt), set(cnt, 0)].concat(head, WHILE([val.py + ' != -1', val.ps + ' <> -1'], IF([val.py + ' > ' + lim, val.ps + ' > ' + lim], [add(cnt, 1)]).concat([INP(val, 'int')])), [outv(cnt)]);
    if (kind === 'big') return [dI(big), set(big, 0)].concat(head, WHILE([val.py + ' != -1', val.ps + ' <> -1'], IF([val.py + ' > ' + big.py, val.ps + ' > ' + big.ps], [set(big, val.py, val.ps)]).concat([INP(val, 'int')])), [outv(big)]);
    if (kind === 'avg') return [dI(total), dI(cnt), set(total, 0), set(cnt, 0)].concat(head, WHILE([val.py + ' != -1', val.ps + ' <> -1'], [add(total, val), add(cnt, 1), INP(val, 'int')]), [out(total.py + ' // ' + cnt.py, total.ps + ' DIV ' + cnt.ps)]);
    return [dI(total), set(total, 0)].concat(head, WHILE([val.py + ' != -1', val.ps + ' <> -1'], [add(total, val), INP(val, 'int')]), [outv(total)]);
  }

  // count the marks that pass, each mark checked to be 0 to 100 first
  function passes(b, pass) {
    b = b || {};
    var bad = b.and ? [mark.py + ' < 0 and ' + mark.py + ' > 100 @@', mark.ps + ' < 0 AND ' + mark.ps + ' > 100 @@'] : [mark.py + ' < 0 or ' + mark.py + ' > 100', mark.ps + ' < 0 OR ' + mark.ps + ' > 100'];
    var test = b.gt ? [mark.py + ' > ' + pass + ' @@', mark.ps + ' > ' + pass + ' @@'] : [mark.py + ' >= ' + pass, mark.ps + ' >= ' + pass];
    return [dI(how), dI(k), dI(mark), dI(cnt), set(cnt, 0), INP(how, 'int')].concat(
      FOR(k, 1, how, [INP(mark, 'int')].concat(WHILE(bad, [out(q('Invalid')), INP(mark, 'int')]), IF(test, [add(cnt, 1)]))),
      [labelled('Passed', cnt)]);
  }
  // how many, the pass mark itself, a mark over 100 (asked again), then the rest
  function passInputs(pass) { var m = rnd(3, 4), l = [String(m), String(pass), String(rnd(101, 150))]; for (var i = 1; i < m; i++) l.push(String(rnd(0, 100))); return l; }

  // ---------------------------------------------------------------- the tasks
  var S12 = {
    // trace: the loop outputs on every pass, like filling in a trace table
    trace: function () {
      var num = rnd(1000, 9999), x = V('x'), y = V('y'), a = rnd(2, 6), lim = rnd(20, 60);
      return pick([
        function () { return pred([dI(n), INP(n, 'int')].concat(WHILE([n.py + ' > 0', n.ps + ' > 0'], [out(MOD(n, 10)[0], MOD(n, 10)[1]), set(n, DIV(n, 10)[0], DIV(n, 10)[1])])), [String(num)], 'Each pass shows the last digit (MOD 10), then removes it (DIV 10).'); },
        function () { return pred([dI(x), dI(y), set(x, a), set(y, 0)].concat(REPEAT([set(x, x.py + ' * 2', x.ps + ' * 2'), add(y, 1), out(x.py, x.ps)], [x.py + ' > ' + lim, x.ps + ' > ' + lim]), [outv(y)]), [], 'The loop body always runs before the condition is tested, and stops once the value is over ' + lim + '.'); },
        function () { var vs = distinct(4, 1, 30); return pred([dI(k), dI(val), dI(total), set(total, 0)].concat(FOR(k, 1, 4, [INP(val, 'int'), add(total, val), outv(total)])), vs.map(String), 'The total is shown after each value is added.'); }
      ])();
    },
    divmod: function () {
      var num = rnd(100, 999), a = rnd(20, 99), b = rnd(3, 9), s = rnd(70, 400);
      var mins = V('minutes'), h = V('hours'), r = V('left');
      return pick([
        function () { return pred(digitSum(), [String(rnd(1000, 99999))], 'MOD 10 gives the last digit, which is added. DIV 10 removes it.'); },
        function () { return pred(digitReverse(), [String(num)], 'Each pass moves the last digit onto the end of the reversed number.'); },
        function () { return pred([dI(n), set(n, a), out(DIV(n, b)[0], DIV(n, b)[1]), out(MOD(n, b)[0], MOD(n, b)[1])], [], 'DIV gives the whole number of times ' + b + ' goes in. MOD gives the remainder.'); },
        function () { return pred([dI(mins), dI(h), dI(r), INP(mins, 'int'), set(h, DIV(mins, 60)[0], DIV(mins, 60)[1]), set(r, MOD(mins, 60)[0], MOD(mins, 60)[1]), out(h.py, h.ps), out(r.py, r.ps)], [String(s)], 'DIV 60 gives whole hours; MOD 60 gives the minutes left over.'); }
      ])();
    },
    purpose: function (lang) {
      var fam = pick(['digit', 'rogue']), opts, ans, code;
      if (fam === 'digit') { var c = pick(DIGIT); code = prog(c[0]()); opts = shuffle(DIGIT.map(function (x) { return x[1]; })); ans = opts.indexOf(c[1]); }
      else {
        var lim = rnd(10, 50), kinds = { count: 'Counts the values over ' + lim + ', until -1 is typed', big: 'Finds the largest value typed, until -1 is typed', avg: 'Works out the whole-number average of the values, until -1 is typed', total: 'Adds up the values typed, until -1 is typed' };
        var kk = pick(Object.keys(kinds)); code = prog(rogueKind(kk, lim)); opts = shuffle(Object.keys(kinds).map(function (x) { return kinds[x]; })); ans = opts.indexOf(kinds[kk]);
      }
      return choice('State the purpose of this algorithm.', opts, ans, 'Follow it with a few values: ' + opts[ans].toLowerCase() + '.', code);
    },
    // which line holds the error (a logic error: it runs, but does the wrong thing)
    errorLine: function () {
      var pass = pick([40, 50, 60]);
      return pick([
        function () { return err('logic', digitSum({ init: true }), 'It should output the sum of the digits of the number.', null, [String(rnd(100, 9999))]); },
        function () { return err('logic', digitSum({ mod: true }), 'It should output the sum of the digits of the number.', null, [String(rnd(1000, 9999))]); },
        function () { return err('logic', rogue({ count0: true }), 'It should output the total and how many values were typed before -1.', null, rogueInputs()); },
        function () { return err('logic', rogue({ step: true }), 'It should output the total and how many values were typed before -1.', null, rogueInputs()); },
        function () { return err('logic', passes({ gt: true }, pass), 'It should count the marks of ' + pass + ' or more, after checking each mark is from 0 to 100.', null, passInputs(pass)); }
      ])();
    },
    // find and correct: two errors at once, as Paper 2 asks
    fix: function () {
      var pass = pick([40, 50, 60]), clean = function (lines) { return lines.map(function (l) { return typeof l === 'string' ? l.replace(/ ?@@/g, '') : [l[0] == null ? null : l[0].replace(/ ?@@/g, ''), l[1] == null ? null : l[1].replace(/ ?@@/g, '')]; }); };
      var tp = function () { return passInputs(pass); };
      return pick([
        function () { return fix(clean(digitSum({ init: true, cond: true })), digitSum(), [[String(rnd(100, 999))], [String(rnd(1000, 9999))], [String(rnd(1, 9))]], 'It should output the sum of the digits of the number. There are two errors.'); },
        function () { return fix(clean(rogue({ init: true, step: true })), rogue(), [rogueInputs(), rogueInputs(), ['-1']], 'It should output the total of the values typed before -1, and how many there were. There are two errors.'); },
        function () { return fix(clean(rogue({ count0: true, init: true })), rogue(), [rogueInputs(), rogueInputs()], 'It should output the total of the values typed before -1, and how many there were. There are two errors.'); },
        function () { return fix(clean(passes({ gt: true, and: true }, pass)), passes({}, pass), [tp(), tp()], 'Each mark must be from 0 to 100 (ask again until it is). It should count the marks of ' + pass + ' or more. There are two errors.'); }
      ])();
    },
    write: function () {
      var pass = pick([40, 50, 60]), tp = function () { return passInputs(pass); };
      var lenOK = rnd(6, 8), pws = function () { var w = ['cat', 'blue', 'key12', 'sunny', 'tiger7', 'pa55word', 'mountain', 'bookshelf', 'skateboard']; var short = shuffle(w.filter(function (x) { return x.length < lenOK; })).slice(0, rnd(0, 2)); return short.concat([pick(w.filter(function (x) { return x.length >= lenOK; }))]); };
      return pick([
        function () { return write(T('Read whole numbers until -1 is typed. Then show the total of the numbers (not counting the -1) and how many there were, as Total 12 and Count 3 on two lines.', 'INPUT whole numbers until -1 is input. Then OUTPUT the total of the numbers (not the -1) and how many there were, as Total 12 and Count 3 on two lines.'),
          rogue(), [rogueInputs(), rogueInputs(), ['-1']], [LOOP]); },
        function () { return write(T('Read a whole number. Use DIV and MOD (// and %) to add up its digits, then show the total.', 'INPUT a whole number. Use DIV and MOD to add up its digits, then OUTPUT the total.'),
          digitSum(), [[String(rnd(100, 999))], [String(rnd(1000, 99999))], [String(rnd(1, 9))]], [LOOP, DIVMOD]); },
        function () { return write(T('Read how many marks there are, then each mark. Check each mark is from 0 to 100: while it is not, show Invalid and read it again. Count the marks of ' + pass + ' or more and show Passed and the count, as Passed 2.', 'INPUT how many marks there are, then each mark. Validate each mark is from 0 to 100: while it is not, OUTPUT Invalid and INPUT it again. Count the marks of ' + pass + ' or more and OUTPUT Passed and the count, as Passed 2.'),
          passes({}, pass), [tp(), tp(), tp()], [LOOP]); },
        function () { return write(T('Keep reading a password until it has at least ' + lenOK + ' characters, counting the tries. Then show the number of tries.', 'Use a REPEAT loop to INPUT a password until it has at least ' + lenOK + ' characters, counting the tries. Then OUTPUT the number of tries.'),
          [dS(pw), dI(tries), set(tries, 0)].concat(REPEAT([INP(pw, 'str'), add(tries, 1)], ['len(' + pw.py + ') >= ' + lenOK, 'LENGTH(' + pw.ps + ') >= ' + lenOK]), [outv(tries)]), [pws(), pws(), pws()], [LOOP]); }
      ])();
    }
  };

  CONTENT.STAGES.push(
    { stage: 12, title: 'IGCSE Paper 2', band: 'IGCSE', levels: [
      { id: 62, title: 'Trace the algorithm', bugs: 5, mix: [S12.trace] },
      { id: 63, title: 'DIV and MOD', bugs: 5, mix: [S12.divmod] },
      { id: 64, title: 'State the purpose', bugs: 5, mix: [S12.purpose] },
      { id: 65, title: 'Find the error line', bugs: 5, mix: [S12.errorLine] },
      { id: 66, title: 'Find and correct the errors', bugs: 3, mix: [S12.fix] },
      { id: 67, title: 'Write the algorithm', bugs: 3, mix: [S12.write] },
      { id: 68, title: 'Paper 2 boss wave', bugs: 6, boss: true, mix: [S12.trace, S12.divmod, S12.purpose, S12.errorLine, S12.fix, S12.write] }] }
  );
})();
