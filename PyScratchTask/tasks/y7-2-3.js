// PyScratch Tasks for Year 7 2.3 Programs Using Data Types (LessonData/y7-2-3-programs.json, slides pyscratch-1 and
// pyscratch-2, built by tools/build_y7_2_3.mjs). Python (lang 'python'), as in 2.1 and 2.2. Only what Year 7 has met by
// then: variables, Integer, Real and String, input(), print(), int(), float(), str(), and the same name every time.
// Format: the shell's docs/pyscratch.md. Help fades: 1 fix a program, 2 write it from the brief.
(function () {
  'use strict';
  var list = window.PyScratchTasks = window.PyScratchTasks || [];
  function dx(T, r) { return T.num(r.sprite.x - r.start.x); }
  function said(T, r) { return T.callsTo(r, 'say').map(function (a) { return String(a[0]); }); }
  // How Python shows a Real: always with a decimal point.
  function pyReal(x) { var s = String(Math.round(x * 1000) / 1000); return s.indexOf('.') < 0 ? s + '.0' : s; }
  function typeName(v) { return !v ? 'never stored' : v.type === 'STRING' ? 'the String "' + v.value + '"' : v.type === 'REAL' ? 'the Real ' + pyReal(v.value) : 'the Integer ' + v.value; }

  // ---------------------------------------------------------------- 1: fix the program
  var FIX = 'coins = int(input("How many coins? "))\ncoins = coins + 5\nsay("You have " + str(Coins) + " coins")\nmove_steps(coins * 10)\n';
  list.push({
    id: 'y7-2-3-names',
    lang: 'python',
    tag: 'Task 1 of 2',
    title: 'Fix the Coins',
    brief: 'Run this program and type a number. It stops with an error. <strong>Fix it</strong> so it works.',
    todo: ['The user types 3: the sprite says <strong>You have 8 coins</strong>, then moves 80 steps.', 'Read the error message. Which name could Python not find?'],
    help: 'Compare every variable name with the name on line 1, letter by letter. Capital letters count.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: FIX,
    checks: [
      function (T) {
        var tries = ['3', '12'], i = 0;
        function next() {
          if (i >= tries.length) return null;
          var t = tries[i++], coins = Number(t) + 5, want = 'You have ' + coins + ' coins';
          return T.run({ inputs: [t] }).then(function (r) {
            var what = 'The user typed ' + t;
            var s = said(T, r);
            if (s.indexOf(want) === -1) return T.fail(what + '. The sprite said: ' + (s.length ? s[s.length - 1] : 'nothing'), 'The sprite says: ' + want, T.lineOf(/say\(/));
            if (dx(T, r) !== coins * 10) return T.fail(what + '. The sprite moved ' + dx(T, r) + ' steps', 'It moves ' + coins + ' x 10 = ' + coins * 10 + ' steps', T.lineOf(/move_steps/));
            return next();
          });
        }
        return next();
      }
    ],
    test: {
      solution: FIX.replace('str(Coins)', 'str(coins)'),
      wrong: [
        FIX.replace('coins = coins + 5', 'Coins = coins + 5'),
        FIX.replace('str(Coins)', 'str(coins + 5)'),
        FIX.replace('str(Coins)', 'coins')
      ]
    }
  });

  // ---------------------------------------------------------------- 2: write it from the brief
  list.push({
    id: 'y7-2-3-shop',
    lang: 'python',
    tag: 'Task 2 of 2',
    title: 'Snack Shop',
    brief: 'Write a program for a snack shop. There is no starter code this time.',
    todo: ['Ask <code>"Price? "</code> and store it in <strong>price</strong>. A price can have a decimal point, like 2.5.',
      'Ask <code>"How many? "</code> and store it in <strong>count</strong>, a whole number.',
      'Work out <strong>total</strong> = price x count. The sprite says <strong>Total: 7.5</strong> (with the total), then moves count x 20 steps.'],
    help: 'Choose the data type for each input: can it have a decimal point? To join the total to text with +, which function turns it into a String?',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: '',
    checks: [
      function (T) {
        var tries = [['2.5', '3'], ['1.25', '4'], ['3', '2']], i = 0;
        function next() {
          if (i >= tries.length) return null;
          var t = tries[i++], count = Number(t[1]), total = Number(t[0]) * count, want = 'Total: ' + pyReal(total);
          return T.run({ inputs: t }).then(function (r) {
            var what = 'The user typed ' + t[0] + ' then ' + t[1];
            var v = r.vars;
            if (!v.price || v.price.type !== 'REAL') return T.fail(what + '. price was ' + typeName(v.price), 'price holds the price as a number that can have a decimal point', T.lineOf(/^\s*price\s*=/));
            if (!v.count || v.count.type !== 'INTEGER') return T.fail(what + '. count was ' + typeName(v.count), 'count holds a whole number', T.lineOf(/^\s*count\s*=/));
            if (!v.total || v.total.type !== 'REAL' || Math.abs(v.total.value - total) > 1e-9) return T.fail(what + '. total was ' + typeName(v.total), 'total holds price x count = ' + pyReal(total), T.lineOf(/^\s*total\s*=/));
            var s = said(T, r);
            if (s.indexOf(want) === -1) return T.fail(what + '. The sprite said: ' + (s.length ? s[s.length - 1] : 'nothing'), 'The sprite says: ' + want, T.lineOf(/say\(/));
            if (dx(T, r) !== count * 20) return T.fail(what + '. The sprite moved ' + dx(T, r) + ' steps', 'It moves ' + count + ' x 20 = ' + count * 20 + ' steps', T.lineOf(/move_steps/));
            return next();
          });
        }
        return next();
      }
    ],
    test: {
      solution: 'price = float(input("Price? "))\ncount = int(input("How many? "))\ntotal = price * count\nsay("Total: " + str(total))\nmove_steps(count * 20)\n',
      wrong: [
        'price = int(input("Price? "))\ncount = int(input("How many? "))\ntotal = price * count\nsay("Total: " + str(total))\nmove_steps(count * 20)\n',
        'price = float(input("Price? "))\ncount = float(input("How many? "))\ntotal = price * count\nsay("Total: " + str(total))\nmove_steps(count * 20)\n',
        'price = float(input("Price? "))\ncount = int(input("How many? "))\ntotal = price * count\nsay("Total: " + total)\nmove_steps(count * 20)\n',
        'price = float(input("Price? "))\ncount = int(input("How many? "))\ntotal = price + count\nsay("Total: " + str(total))\nmove_steps(count * 20)\n',
        'price = float(input("Price? "))\ncount = int(input("How many? "))\ntotal = price * count\nsay("Total:" + str(total))\nmove_steps(total * 20)\n'
      ]
    }
  });
})();
