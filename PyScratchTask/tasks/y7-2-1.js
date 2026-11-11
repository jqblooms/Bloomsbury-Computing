// PyScratch Tasks for Year 7 2.1 Data Types and Variables (LessonData/y7-2-1-variables.json, slides pyscratch-1 to
// pyscratch-3, built by tools/build_y7_2_1.mjs). Python (lang 'python'). Only what 2.1 has taught by each slide:
// task 1 comes before the data types slide, so its words never name a data type. No input() (that is 2.2) and no str().
// Format: the shell's docs/pyscratch.md. Help fades: 1 finish one line, 2 change a working program, 3 write it.
(function () {
  'use strict';
  var list = window.PyScratchTasks = window.PyScratchTasks || [];
  // str() is taught in 2.2: take the engine's str() hint out.
  function fixMessage(msg) { return String(msg).replace(/. To join text and a number, turn the number into text first:.*$/, '. + adds two numbers or joins two Strings.'); }
  function moves(T, r) { return T.callsTo(r, 'move_steps').map(function (a) { return T.num(a[0]); }); }
  function said(T, r) { return T.callsTo(r, 'say').map(function (a) { return String(a[0]); }); }
  function kind(v) { return !v ? 'nothing' : v.type === 'INTEGER' ? 'the Integer ' + v.value : v.type === 'REAL' ? 'the Real ' + (Number.isInteger(v.value) ? v.value.toFixed(1) : v.value) : v.type === 'STRING' ? 'the String "' + v.value + '"' : String(v.value); }

  // ---------------------------------------------------------------- 1: finish one line
  var DOUBLE = 'steps = 50\nmove_steps(steps)\nsteps = \nmove_steps(steps)\n';
  list.push({
    id: 'y7-2-1-double',
    lang: 'python',
    fixMessage: fixMessage,
    tag: 'Task 1 of 3',
    title: 'Double the Steps',
    brief: 'The sprite moves, then moves again. <strong>Finish line 3</strong> so steps becomes twice as big, worked out from its own value.',
    todo: ['<code>move_steps(steps)</code> moves the sprite that many steps.', 'With steps = 50 the sprite moves 50, then 100.', 'In Python, * means times.'],
    help: 'Look back at Change a Variable Using Its Own Value. The right side is worked out first, using the value steps holds now.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: DOUBLE,
    checks: [
      function (T) {
        var line3 = T.lineOf(/^\s*steps\s*=/) ? 3 : 0;
        return T.run({ allowError: true }).then(function (r) {
          // steps = "100" moves the sprite (Scratch reads the digits) but is a String: say that, not the odd distance.
          if (r.vars.steps && r.vars.steps.type === 'STRING') return T.fail('steps holds a String', 'Take away the quote marks, so steps holds a number', T.lineOf(/^\s*steps\s*=\s*["']/) || line3);
          var stop = T.stopped(r);
          if (stop) return stop;
          var m = moves(T, r);
          if (m.join() !== '50,100') return T.fail('The sprite moved ' + (m.length ? m.join(' then ') : 'no') + ' steps', 'It moves 50, then 100', line3);
          return T.run({ code: T.withLine(/^\s*steps\s*=\s*50\s*$/, 'steps = 30') }).then(function (r2) {
            var m2 = moves(T, r2);
            if (m2.join() !== '30,60') return T.fail('When line 1 was changed to steps = 30, the sprite moved ' + m2.join(' then '), 'It moves 30, then 60: line 3 works it out from steps itself', line3);
            return null;
          });
        });
      }
    ],
    test: {
      solution: DOUBLE.replace('steps = \n', 'steps = steps * 2\n'),
      wrong: [DOUBLE.replace('steps = \n', 'steps = 100\n'), DOUBLE.replace('steps = \n', 'steps = "100"\n'), DOUBLE.replace('steps = \n', 'steps = steps + 2\n'), DOUBLE.replace('steps = \n', 'steps * 2\n')]
    }
  });

  // ---------------------------------------------------------------- 2: change a working program
  var JOIN = 'a = "5"\nb = "5"\nsay(a + b)\n';
  list.push({
    id: 'y7-2-1-add',
    lang: 'python',
    fixMessage: fixMessage,
    tag: 'Task 2 of 3',
    title: 'Add, Not Join',
    brief: 'This program works, but the sprite says 55. <strong>Change lines 1 and 2</strong> so the sprite says 10. Do not change line 3.',
    todo: ['<code>say(a + b)</code> makes the sprite say what a + b gives.'],
    help: 'Look at the data type of a and b. Which data type does + add, and which does it join?',
    sprites: [{ name: 'Sprite1', x: 0, y: 0 }],
    starter: JOIN,
    checks: [
      function (T) {
        if (!T.lineOf(/^\s*say\(\s*a\s*\+\s*b\s*\)\s*$/)) return T.fail('Line 3 was changed', 'Line 3 stays say(a + b). Change the values in lines 1 and 2', 3);
        return T.run().then(function (r) {
          var a = r.vars.a, b = r.vars.b, s = said(T, r);
          // Any two whole numbers that add up to 10 (a reviewer typed 4 and 6).
          if (!a || a.type !== 'INTEGER') return T.fail('a holds ' + kind(a), 'a holds a whole number', T.lineOf(/^\s*a\s*=/));
          if (!b || b.type !== 'INTEGER') return T.fail('b holds ' + kind(b), 'b holds a whole number', T.lineOf(/^\s*b\s*=/));
          if (s[s.length - 1] !== '10') return T.fail('The sprite said ' + (s.length ? s[s.length - 1] : 'nothing'), 'The sprite says 10: a + b adds up to 10', T.lineOf(/^\s*a\s*=/));
          return null;
        });
      }
    ],
    test: {
      solution: 'a = 5\nb = 5\nsay(a + b)\n',
      also: ['a = 4\nb = 6\nsay(a + b)\n'],
      wrong: ['a = 5.0\nb = 5.0\nsay(a + b)\n', 'a = 4\nb = 5\nsay(a + b)\n', 'a = 5\nb = "5"\nsay(a + b)\n', 'a = "1"\nb = "0"\nsay(a + b)\n']
    }
  });

  // ---------------------------------------------------------------- 3: write it from the brief
  list.push({
    id: 'y7-2-1-pip',
    lang: 'python',
    fixMessage: fixMessage,
    tag: 'Task 3 of 3',
    title: 'Pip the Sprite',
    brief: 'Write a program with three variables. There is no starter code this time.',
    todo: ['<strong>name</strong> holds the String Pip.', '<strong>lives</strong> holds the Integer 3.', '<strong>speed</strong> holds the Real 1.5.',
      'Move the sprite speed * 100 steps (* means times).', '<code>say(name)</code> makes the sprite say name.', 'Pip loses a life: change lives using its own value.', 'Make the sprite say name, then print lives.'],
    help: 'Choose each value so Python stores the right data type: quote marks, a whole number, or a decimal point.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: '',
    checks: [
      function (T) {
        return T.run().then(function (r) {
          var v = r.vars;
          if (!v.name || v.name.type !== 'STRING' || v.name.value !== 'Pip') return T.fail(v.name ? 'name holds ' + kind(v.name) : 'There is no variable called name yet', 'name holds the String "Pip"', T.lineOf(/^\s*name\s*=/));
          if (!v.speed || v.speed.type !== 'REAL' || v.speed.value !== 1.5) return T.fail('speed holds ' + kind(v.speed), 'speed holds the Real 1.5', T.lineOf(/^\s*speed\s*=/));
          if (!v.lives || v.lives.type !== 'INTEGER') return T.fail('lives holds ' + kind(v.lives), 'lives holds an Integer', T.lineOf(/^\s*lives\s*=/));
          if (v.lives.value !== 2) return T.fail('At the end, lives holds ' + v.lives.value, 'lives starts at 3 and loses 1, so it ends at 2', T.lineOf(/^\s*lives\s*=/));
          var m = moves(T, r);
          if (m.reduce(function (a, b) { return a + b; }, 0) !== 150) return T.fail('The sprite moved ' + (m.length ? m.join(' and ') : 'no') + ' steps', 'It moves 1.5 x 100 = 150 steps', T.lineOf(/move_steps/));
          var s = said(T, r);
          if (s.indexOf('Pip') === -1) return T.fail('The sprite said ' + (s.length ? s[s.length - 1] : 'nothing'), 'The sprite says Pip', T.lineOf(/say\(/));
          var o = r.out.length ? r.out[r.out.length - 1] : '';
          if (o !== '2') return T.fail('It printed: ' + (o || 'nothing'), 'It prints lives: 2', T.lineOf(/print\(/));
          return T.run({ code: T.withLine(/^\s*lives\s*=\s*3\s*$/, 'lives = 7') }).then(function (r2) {
            var o2 = r2.out.length ? r2.out[r2.out.length - 1] : '';
            if (o2 !== '6') return T.fail('When lives started at 7, it printed ' + (o2 || 'nothing'), 'It prints 6: lives changes using its own value', T.lineOf(/^\s*lives\s*=\s*lives/) || T.lineOf(/^\s*lives\s*=/));
            // The move must use speed, not a typed 150.
            return T.run({ code: T.withLine(/^\s*speed\s*=\s*1\.5\s*$/, 'speed = 2.5') }).then(function (r3) {
              var m3 = moves(T, r3).reduce(function (a, b) { return a + b; }, 0);
              if (m3 !== 250) return T.fail('When speed was changed to 2.5, the sprite moved ' + m3 + ' steps', 'It moves 2.5 * 100 = 250 steps: the move uses speed', T.lineOf(/move_steps/));
              return null;
            });
          });
        });
      }
    ],
    test: {
      solution: 'name = "Pip"\nlives = 3\nspeed = 1.5\nmove_steps(speed * 100)\nlives = lives - 1\nsay(name)\nprint(lives)\n',
      wrong: [
        'name = "Pip"\nlives = 3\nspeed = 1.5\nmove_steps(speed * 100)\nlives = 2\nsay(name)\nprint(lives)\n',
        'name = "Pip"\nlives = "3"\nspeed = 1.5\nmove_steps(speed * 100)\nlives = lives - 1\nsay(name)\nprint(lives)\n',
        'name = "Pip"\nlives = 3\nspeed = 1\nmove_steps(speed * 100)\nlives = lives - 1\nsay(name)\nprint(lives)\n',
        'name = "Pip"\nlives = 3\nspeed = 1.5\nmove_steps(150)\nlives = lives - 1\nsay(name)\nprint(lives)\n',
        'name = Pip\nlives = 3\nspeed = 1.5\nmove_steps(speed * 100)\nlives = lives - 1\nsay(name)\nprint(lives)\n'
      ]
    }
  });
})();
