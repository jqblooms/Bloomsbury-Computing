// PyScratch Tasks for Year 8 2.1 Libraries and Library Functions (LessonData/y8-2-1-libraries.json, slides
// pyscratch-1 to pyscratch-3, built by tools/build_y8_2_1.mjs). Format: the shell's docs/pyscratch.md, PyScratch Tasks.
// Only what 2.1 has taught by then: DECLARE with INTEGER, INPUT, OUTPUT, ROUND and RANDOM. REAL comes in 2.2, so
// fixMessage takes it out of the engine's messages. Help fades: 1 fill in a line, 2 change a working program,
// 3 write it from the brief (a 1 to 4 spinner, not the 1 to 6 dice the Random Numbers slide shows).
(function () {
  'use strict';
  var list = window.PyScratchTasks = window.PyScratchTasks || [];

  function fixMessage(msg) {
    return String(msg)
      .replace(/Declare it as REAL, or use DIV or ROUND to make a whole number\./g, 'Use ROUND to make a whole number.')
      .replace(/\ba REAL \(([^)]*)\)/g, 'the number $1')
      .replace(/Use INTEGER, REAL, STRING, CHAR,? or BOOLEAN[^.]*\./g, 'Use INTEGER or STRING.');
  }
  function lastGoTo(T, r) {
    var g = T.callsTo(r, 'go_to_xy');
    return g.length ? g[g.length - 1] : null;
  }
  function dx(T, r) { return T.num(r.sprite.x - r.start.x); }

  // ---------------------------------------------------------------- 1: fill in a line
  list.push({
    id: 'y8-2-1-random',
    tag: 'Task 1 of 3',
    title: 'A Random Place',
    brief: 'The sprite must jump to a random place each time the program runs. Line 3 makes a random X from -200 to 200. Finish line 4 so Y is a random whole number from <strong>-150 to 150</strong>.',
    todo: ['<code>CALL GoToXY(X, Y)</code> moves the sprite to X, Y.', 'Click the green flag to run it. Run it a few times.'],
    help: 'RANDOM() gives a number from 0 to 1. Work out what line 3 gives when RANDOM() is 0, then when it is 1. Choose the numbers on line 4 so they give -150 and 150.',
    sprites: [{ name: 'Sprite1', x: 0, y: 0 }],
    fixMessage: fixMessage,
    starter: 'DECLARE X : INTEGER\nDECLARE Y : INTEGER\nX <- ROUND(RANDOM() * 400, 0) - 200\nY <- \nCALL GoToXY(X, Y)\n',
    checks: [
      function (T) {
        var yLine = T.lineOf(/^\s*Y\s*<-/);
        return T.run({ random: 'min' }).then(function (r) {
          var g = lastGoTo(T, r);
          if (!g) return T.fail('The sprite did not move', 'The last line, CALL GoToXY(X, Y), moves the sprite', T.lineOf(/GoToXY/) || 0);
          if (r.randoms < 2) return T.fail('RANDOM() was used ' + r.randoms + ' time' + (r.randoms === 1 ? '' : 's'), 'X and Y each use RANDOM(), so both are random', yLine);
          if (T.num(g[0]) !== -200) return T.fail('With RANDOM() at 0, X was ' + T.num(g[0]), 'Keep line 3 as it was: X from -200 to 200', T.lineOf(/^\s*X\s*<-/));
          if (T.num(g[1]) !== -150) return T.fail('When RANDOM() gave 0, Y was ' + T.num(g[1]), 'The smallest Y is -150', yLine);
          return T.run({ random: 'max' }).then(function (r2) {
            var g2 = lastGoTo(T, r2);
            if (T.num(g2[0]) !== 200) return T.fail('With RANDOM() at 1, X was ' + T.num(g2[0]), 'Keep line 3 as it was: X from -200 to 200', T.lineOf(/^\s*X\s*<-/));
            if (T.num(g2[1]) !== 150) return T.fail('When RANDOM() gave its largest value, Y was ' + T.num(g2[1]), 'The largest Y is 150', yLine);
            return null;
          });
        });
      },
      function (T) {
        var seen = [];
        function once() {
          return T.run().then(function (r) {
            var g = lastGoTo(T, r);
            seen.push(g ? T.num(g[1]) : null);
          });
        }
        return once().then(once).then(once).then(once).then(function () {
          var differ = seen.some(function (y) { return y !== seen[0]; });
          if (!differ) return T.fail('Y was ' + seen[0] + ' every time', 'A different place each time the program runs', T.lineOf(/^\s*Y\s*<-/));
          return null;
        });
      }
    ],
    test: {
      solution: 'DECLARE X : INTEGER\nDECLARE Y : INTEGER\nX <- ROUND(RANDOM() * 400, 0) - 200\nY <- ROUND(RANDOM() * 300, 0) - 150\nCALL GoToXY(X, Y)\n',
      wrong: [
        'DECLARE X : INTEGER\nDECLARE Y : INTEGER\nX <- ROUND(RANDOM() * 400, 0) - 200\nY <- ROUND(RANDOM() * 150, 0)\nCALL GoToXY(X, Y)\n',
        'DECLARE X : INTEGER\nDECLARE Y : INTEGER\nX <- ROUND(RANDOM() * 400, 0) - 200\nY <- RANDOM() * 300 - 150\nCALL GoToXY(X, Y)\n',
        'DECLARE X : INTEGER\nDECLARE Y : INTEGER\nX <- ROUND(RANDOM() * 400, 0) - 200\nY <- 75\nCALL GoToXY(X, Y)\n'
      ]
    }
  });

  // ---------------------------------------------------------------- 2: change a working program
  var SPEEDS = [[200, 3], [250, 7], [100, 4], [130, 6]];
  list.push({
    id: 'y8-2-1-speed',
    tag: 'Task 2 of 3',
    title: 'Tidy the Speed',
    brief: 'This program works. It moves the sprite, then outputs its speed in steps per second. Run it: type 200 steps and 3 seconds. The speed has too many digits. <strong>Change the program</strong> so it outputs the speed rounded to 1 decimal place.',
    todo: ['The sprite must still move.', 'It must work for any steps and seconds typed in.'],
    help: 'Only the last line needs to change. ROUND needs two values in its brackets: the number to round, then how many decimal places to keep.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    fixMessage: fixMessage,
    starter: 'DECLARE Steps : INTEGER\nDECLARE Seconds : INTEGER\nINPUT Steps\nINPUT Seconds\nCALL MoveSteps(Steps)\nOUTPUT Steps / Seconds\n',
    checks: [
      function (T) {
        var outLine = T.lineOf(/^\s*OUTPUT\b/);
        var i = 0;
        function next() {
          if (i >= SPEEDS.length) return null;
          var s = SPEEDS[i++], want = Math.round(s[0] / s[1] * 10) / 10;
          return T.run({ inputs: s }).then(function (r) {
            var what = s[0] + ' steps in ' + s[1] + ' seconds';
            if (dx(T, r) !== s[0]) return T.fail('For ' + what + ', the sprite moved ' + dx(T, r) + ' steps', 'The sprite moves ' + s[0] + ' steps: keep the line that moves it', T.lineOf(/MoveSteps/) || 0);
            if (!r.out.length) return T.fail('For ' + what + ', nothing was output', 'The speed is output', outLine);
            var got = r.out[r.out.length - 1].trim();
            if (got !== String(want)) return T.fail('For ' + what + ', the output was ' + got, 'The speed rounded to 1 decimal place: ' + want, outLine);
            return next();
          });
        }
        return next();
      }
    ],
    test: {
      solution: 'DECLARE Steps : INTEGER\nDECLARE Seconds : INTEGER\nINPUT Steps\nINPUT Seconds\nCALL MoveSteps(Steps)\nOUTPUT ROUND(Steps / Seconds, 1)\n',
      wrong: [
        'DECLARE Steps : INTEGER\nDECLARE Seconds : INTEGER\nINPUT Steps\nINPUT Seconds\nCALL MoveSteps(Steps)\nOUTPUT ROUND(Steps / Seconds, 2)\n',
        'DECLARE Steps : INTEGER\nDECLARE Seconds : INTEGER\nINPUT Steps\nINPUT Seconds\nCALL MoveSteps(Steps)\nOUTPUT 66.7\n',
        'DECLARE Steps : INTEGER\nDECLARE Seconds : INTEGER\nINPUT Steps\nINPUT Seconds\nOUTPUT ROUND(Steps / Seconds, 1)\n'
      ]
    }
  });

  // ---------------------------------------------------------------- 3: write it from the brief
  list.push({
    id: 'y8-2-1-spin',
    tag: 'Task 3 of 3',
    title: 'Spin the Spinner',
    brief: 'Write a program that spins a spinner for the sprite. The spinner lands on 1, 2, 3 or 4. There is no starter code this time.',
    todo: ['Store a random whole number from 1 to 4 in a variable called <strong>Spin</strong>.', '<code>OUTPUT</code> Spin.', 'Move the sprite Spin x 60 steps with <code>CALL MoveSteps(...)</code>.'],
    help: 'DECLARE Spin first. When RANDOM() gives 0 the spinner must be 1, and when it gives 1 it must be 4. ROUND makes it a whole number.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    fixMessage: fixMessage,
    starter: '',
    checks: [
      function (T) {
        if (!T.declared('Spin')) return T.fail('There is no variable called Spin', 'A variable called Spin, declared at the top', 0);
        return null;
      },
      function (T) {
        var sLine = T.lineOf(/^\s*Spin\s*<-/);
        function look(r, label) {
          var d = r.vars.Spin;
          if (!d) return T.fail('Spin was never given a value', 'Spin holds the spinner number', sLine);
          if (r.randoms < 1) return T.fail('RANDOM() was not used', 'A random number each time', sLine);
          if (d.type !== 'INTEGER' || d.value < 1 || d.value > 4) return T.fail(label + 'Spin was ' + d.value, 'A whole number from 1 to 4', sLine);
          var o = r.out.length ? r.out[r.out.length - 1].trim() : '';
          if (o !== String(d.value)) return T.fail(o ? 'Spin was ' + d.value + ' but the output was ' + o : 'Nothing was output', 'OUTPUT shows Spin', T.lineOf(/^\s*OUTPUT\b/));
          if (dx(T, r) !== d.value * 60) return T.fail('Spin was ' + d.value + ' and the sprite moved ' + dx(T, r) + ' steps', 'The sprite moves Spin x 60 steps', T.lineOf(/MoveSteps/));
          return null;
        }
        return T.run({ random: 'min' }).then(function (r) {
          var f = look(r, 'When RANDOM() gave 0, ');
          if (f) return f;
          if (r.vars.Spin.value !== 1) return T.fail('When RANDOM() gave 0, Spin was ' + r.vars.Spin.value, 'The smallest number is 1', sLine);
          return T.run({ random: 'max' }).then(function (r2) {
            var f2 = look(r2, 'When RANDOM() gave its largest value, ');
            if (f2) return f2;
            if (r2.vars.Spin.value !== 4) return T.fail('When RANDOM() gave its largest value, Spin was ' + r2.vars.Spin.value, 'The largest number is 4', sLine);
            var n = 0;
            function again() {
              if (n++ >= 3) return null;
              return T.run().then(function (r3) { return look(r3, '') || again(); });
            }
            return again();
          });
        });
      }
    ],
    test: {
      solution: 'DECLARE Spin : INTEGER\nSpin <- ROUND(RANDOM() * 3, 0) + 1\nOUTPUT Spin\nCALL MoveSteps(Spin * 60)\n',
      wrong: [
        'DECLARE Spin : INTEGER\nSpin <- ROUND(RANDOM() * 4, 0)\nOUTPUT Spin\nCALL MoveSteps(Spin * 60)\n',
        'DECLARE Spin : INTEGER\nSpin <- ROUND(RANDOM() * 4, 0) + 1\nOUTPUT Spin\nCALL MoveSteps(Spin * 60)\n',
        'DECLARE Spin : INTEGER\nSpin <- ROUND(RANDOM() * 3, 0) + 1\nCALL MoveSteps(Spin * 60)\n',
        'DECLARE Spin : INTEGER\nSpin <- ROUND(RANDOM() * 3, 0) + 1\nOUTPUT Spin\nCALL MoveSteps(60)\n'
      ]
    }
  });
})();
