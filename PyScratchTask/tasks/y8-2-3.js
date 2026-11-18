// PyScratch Tasks for Year 8 2.3 Conditional Statements (LessonData/y8-2-3-conditions.json, slides pyscratch-1
// to pyscratch-3, built by tools/build_y8_2_3.mjs). Format: the shell's docs/pyscratch.md, PyScratch Tasks.
// 2.3 teaches conditions, the six comparison operators, IF inside an IF (nested) and testing every branch.
// Every check types in several values, always including the value written in the condition, so a > that
// should be >= (or an IF in the wrong order) fails. Help fades: 1 fix one line, 2 change a working program,
// 3 write it from the brief.
(function () {
  'use strict';
  var list = window.PyScratchTasks = window.PyScratchTasks || [];

  function dx(T, r) { return T.num(r.sprite.x - r.start.x); }
  function said(T, r) { var s = T.callsTo(r, 'say').map(function (a) { return String(a[0]); }); return s.length ? s[s.length - 1] : ''; }
  // Runs the program once for each [input, words, steps] and fails on the first wrong one.
  function each(T, cases, sayLine, moveLine, code) {
    var i = 0;
    function next() {
      if (i >= cases.length) return null;
      var c = cases[i++];
      var opts = { inputs: [String(c[0])] };
      if (code) opts.code = code;
      return T.run(opts).then(function (r) {
        var words = said(T, r), moved = dx(T, r);
        if (words !== c[1]) return T.fail(c[0] + ' was typed in and the sprite said ' + (words ? '"' + words + '"' : 'nothing'), 'For ' + c[0] + ' the sprite says "' + c[1] + '"', sayLine);
        if (moved !== c[2]) return T.fail(c[0] + ' was typed in and the sprite moved ' + moved + ' steps', 'For ' + c[0] + ' the sprite moves ' + c[2] + ' steps', moveLine);
        return next();
      });
    }
    return next();
  }

  // ---------------------------------------------------------------- 1: fix one line
  var RIDE = 'DECLARE Age : INTEGER\nINPUT Age\nIF Age > 12 THEN\n    CALL Say("Ride")\n    CALL MoveSteps(150)\nELSE\n    CALL Say("Too young")\nENDIF\n';
  list.push({
    id: 'y8-2-3-ride',
    tag: 'Task 1 of 3',
    title: 'The Ride Gate',
    brief: 'The rule: you can go on the ride if you are <strong>12 or older</strong>. Run the program and type 12. The sprite is stopped, but it should ride. <strong>Fix one line.</strong>',
    todo: ['A rider who can go says Ride and moves 150 steps.', 'A rider who is too young says Too young and does not move.', 'Test it: type a young age, an older age, and 12.'],
    help: 'Read the IF line. Put 12 into it. Is the condition TRUE or FALSE? Which comparison operator also lets in the number itself?',
    sprites: [{ name: 'Sprite1', x: -150, y: 0 }],
    starter: RIDE,
    checks: [
      function (T) {
        return each(T, [[12, 'Ride', 150], [9, 'Too young', 0], [15, 'Ride', 150], [11, 'Too young', 0], [40, 'Ride', 150]], T.lineOf(/^\s*IF\b/), T.lineOf(/MoveSteps/));
      }
    ],
    test: {
      solution: RIDE.replace('Age > 12', 'Age >= 12'),
      wrong: [
        RIDE.replace('Age > 12', 'Age >= 13'),
        RIDE.replace('Age > 12', 'Age = 12'),
        RIDE.replace('Age > 12', 'Age < 12'),
        RIDE.replace('Age > 12', 'Age >= 12').replace('MoveSteps(150)', 'MoveSteps(100)')
      ]
    }
  });

  // ---------------------------------------------------------------- 2: change a working program
  var MEDAL = 'DECLARE Score : INTEGER\nINPUT Score\nIF Score >= 50 THEN\n    CALL Say("Pass")\n    CALL MoveSteps(100)\nELSE\n    CALL Say("Try again")\nENDIF\n';
  list.push({
    id: 'y8-2-3-gold',
    tag: 'Task 2 of 3',
    title: 'Add a Gold Medal',
    brief: 'This program works: 50 or more says Pass and moves 100 steps. <strong>Change it</strong> so a score of <strong>80 or more</strong> says Gold and moves 200 steps instead.',
    todo: ['80 or more: say Gold, move 200 steps.', '50 to 79: say Pass, move 100 steps.', 'Under 50: say Try again, do not move.', 'Only one thing is said for each score.'],
    help: 'Which score must be checked first, 80 or 50? A score of 90 is also 50 or more. Put an IF inside the ELSE of the first IF.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: MEDAL,
    checks: [
      function (T) {
        return each(T, [[90, 'Gold', 200], [80, 'Gold', 200], [79, 'Pass', 100], [50, 'Pass', 100], [49, 'Try again', 0], [12, 'Try again', 0]], T.lineOf(/^\s*IF\b/), T.lineOf(/MoveSteps/));
      }
    ],
    test: {
      solution: 'DECLARE Score : INTEGER\nINPUT Score\nIF Score >= 80 THEN\n    CALL Say("Gold")\n    CALL MoveSteps(200)\nELSE\n    IF Score >= 50 THEN\n        CALL Say("Pass")\n        CALL MoveSteps(100)\n    ELSE\n        CALL Say("Try again")\n    ENDIF\nENDIF\n',
      wrong: [
        MEDAL,
        'DECLARE Score : INTEGER\nINPUT Score\nIF Score >= 50 THEN\n    CALL Say("Pass")\n    CALL MoveSteps(100)\nELSE\n    IF Score >= 80 THEN\n        CALL Say("Gold")\n        CALL MoveSteps(200)\n    ELSE\n        CALL Say("Try again")\n    ENDIF\nENDIF\n',
        'DECLARE Score : INTEGER\nINPUT Score\nIF Score > 80 THEN\n    CALL Say("Gold")\n    CALL MoveSteps(200)\nELSE\n    IF Score >= 50 THEN\n        CALL Say("Pass")\n        CALL MoveSteps(100)\n    ELSE\n        CALL Say("Try again")\n    ENDIF\nENDIF\n',
        'DECLARE Score : INTEGER\nINPUT Score\nIF Score >= 50 THEN\n    CALL Say("Pass")\n    CALL MoveSteps(100)\nELSE\n    CALL Say("Try again")\nENDIF\nIF Score >= 80 THEN\n    CALL Say("Gold")\n    CALL MoveSteps(100)\nENDIF\n'
      ]
    }
  });

  // ---------------------------------------------------------------- 3: write it from the brief
  list.push({
    id: 'y8-2-3-camera',
    tag: 'Task 3 of 3',
    title: 'Speed Camera',
    brief: 'Write a speed camera program. There is no starter code this time.',
    todo: ['A constant <strong>Limit</strong> set to 50.', '<strong>Speed</strong>: a whole number that is typed in.', 'More than Limit: the sprite says Slow down. Otherwise it says OK.', 'Then the sprite moves Speed steps.'],
    help: 'CONSTANT and DECLARE lines first, then INPUT. Is a car going at exactly the limit too fast? Read the brief again: "more than".',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: '',
    checks: [
      function (T) {
        if (!T.constant('Limit')) {
          var d = T.declared('Limit');
          if (d) return T.fail('Limit is a variable, declared with DECLARE', 'Limit is a constant', d.line);
          return T.fail('There is no constant called Limit', 'A constant called Limit, set to 50', 0);
        }
        var s = T.declared('Speed');
        if (!s) return T.fail('Speed is never declared', 'Speed is declared before it is used', 0);
        if (s.type !== 'INTEGER') return T.fail('Speed is declared as ' + s.type, 'Speed holds a whole number. Which data type is that?', s.line);
        return null;
      },
      function (T) {
        return each(T, [[30, 'OK', 30], [50, 'OK', 50], [51, 'Slow down', 51], [80, 'Slow down', 80]], T.lineOf(/^\s*IF\b/), T.lineOf(/MoveSteps/));
      },
      function (T) {
        var c = T.withConstant('Limit', 60);
        return each(T, [[55, 'OK', 55], [61, 'Slow down', 61]], T.lineOf(/^\s*IF\b/), T.lineOf(/MoveSteps/), c).then(function (f) {
          if (f) return T.fail('When Limit was changed to 60, ' + f.saw.charAt(0).toLowerCase() + f.saw.slice(1), 'The IF uses Limit, so one change to Limit changes the rule', T.lineOf(/^\s*IF\b/));
          return null;
        });
      }
    ],
    test: {
      solution: 'CONSTANT Limit <- 50\nDECLARE Speed : INTEGER\nINPUT Speed\nIF Speed > Limit THEN\n    CALL Say("Slow down")\nELSE\n    CALL Say("OK")\nENDIF\nCALL MoveSteps(Speed)\n',
      wrong: [
        'CONSTANT Limit <- 50\nDECLARE Speed : INTEGER\nINPUT Speed\nIF Speed >= Limit THEN\n    CALL Say("Slow down")\nELSE\n    CALL Say("OK")\nENDIF\nCALL MoveSteps(Speed)\n',
        'CONSTANT Limit <- 50\nDECLARE Speed : INTEGER\nINPUT Speed\nIF Speed > 50 THEN\n    CALL Say("Slow down")\nELSE\n    CALL Say("OK")\nENDIF\nCALL MoveSteps(Speed)\n',
        'CONSTANT Limit <- 50\nDECLARE Speed : INTEGER\nINPUT Speed\nIF Speed > Limit THEN\n    CALL Say("Slow down")\nELSE\n    CALL Say("OK")\nENDIF\n',
        'DECLARE Limit : INTEGER\nDECLARE Speed : INTEGER\nLimit <- 50\nINPUT Speed\nIF Speed > Limit THEN\n    CALL Say("Slow down")\nELSE\n    CALL Say("OK")\nENDIF\nCALL MoveSteps(Speed)\n',
        'CONSTANT Limit <- 50\nDECLARE Speed : REAL\nINPUT Speed\nIF Speed > Limit THEN\n    CALL Say("Slow down")\nELSE\n    CALL Say("OK")\nENDIF\nCALL MoveSteps(Speed)\n'
      ]
    }
  });
})();
