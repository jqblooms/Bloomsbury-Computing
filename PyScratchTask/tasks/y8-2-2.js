// PyScratch Tasks for Year 8 2.2 Data Types and Constants (LessonData/y8-2-2-data-types.json, slides pyscratch-1
// to pyscratch-3, built by tools/build_y8_2_2.mjs). Format: the shell's docs/pyscratch.md, PyScratch Tasks.
// 2.2 teaches INTEGER, REAL, STRING and BOOLEAN (CHAR is not taught) and CONSTANT Name <- value. Help fades:
// 1 fix a nearly finished program, 2 change a working program, 3 write it from the brief.
(function () {
  'use strict';
  var list = window.PyScratchTasks = window.PyScratchTasks || [];

  function fixMessage(msg) {
    return String(msg).replace(/Use INTEGER, REAL, STRING, CHAR,? or BOOLEAN([^.]*)\./g, 'Use INTEGER, REAL, STRING or BOOLEAN.');
  }
  function dx(T, r) { return T.num(r.sprite.x - r.start.x); }
  function moves(T, r) {
    return r.calls.filter(function (c) { return c.fn === 'move_steps' || c.fn === 'change_x' || c.fn === 'change_y'; })
      .map(function (c) { return { fn: c.fn, n: T.num(c.args[0]) }; });
  }

  // ---------------------------------------------------------------- 1: fix a nearly finished program
  var FIX = 'DECLARE Name : STRING\nDECLARE Speed : INTEGER\nDECLARE Happy : BOOLEAN\nName <- "Tom"\nSpeed <- 2.5\nHappy <- TRUE\nCALL Say(Name)\nCALL MoveSteps(Speed * 40)\n';
  list.push({
    id: 'y8-2-2-fix',
    tag: 'Task 1 of 3',
    title: 'Fix the Data Type',
    brief: 'Run this program: it stops with an error. <strong>Fix one DECLARE line</strong> so the program runs.',
    todo: ['Do not change the values: Speed must stay 2.5.', 'The sprite says Tom, then moves Speed x 40 steps.', '<code>CALL Say(Name)</code> shows Name in a speech bubble.'],
    help: 'Read the error: which line stops, and which variable is on it? Look at the value it holds. Which data type lets in a number with a decimal part?',
    sprites: [{ name: 'Sprite1', x: -150, y: 0 }],
    fixMessage: fixMessage,
    starter: FIX,
    checks: [
      function (T) {
        return T.run().then(function (r) {
          var v = r.vars;
          if (!v.Speed || v.Speed.value !== 2.5) return T.fail('Speed was ' + (v.Speed ? v.Speed.value : 'never set'), 'Speed holds 2.5. Change the data type, not the value', T.lineOf(/^\s*Speed\s*<-/));
          if (!v.Name || v.Name.value !== 'Tom') return T.fail('Name was ' + (v.Name ? v.Name.value : 'never set'), 'Name holds "Tom". Change only one DECLARE line', T.lineOf(/^\s*Name\s*<-/));
          if (!v.Happy || v.Happy.value !== true) return T.fail('Happy was ' + (v.Happy ? String(v.Happy.value).toUpperCase() : 'never set'), 'Happy holds TRUE. Change only one DECLARE line', T.lineOf(/^\s*Happy\s*<-/));
          var said = T.callsTo(r, 'say').map(function (a) { return a[0]; });
          if (said.indexOf('Tom') === -1) return T.fail('The sprite did not say Tom', 'The sprite says Tom', T.lineOf(/Say/));
          if (dx(T, r) !== 100) return T.fail('The sprite moved ' + dx(T, r) + ' steps', 'The sprite moves 2.5 x 40 = 100 steps', T.lineOf(/MoveSteps/));
          var types = { Name: 'STRING', Happy: 'BOOLEAN' };
          for (var k in types) {
            var d = T.declared(k);
            if (!d || d.type !== types[k]) return T.fail(k + ' is declared as ' + (d ? d.type : 'nothing'), k + ' was right before. Change only the DECLARE line that was wrong', d ? d.line : 0);
          }
          return null;
        });
      }
    ],
    test: {
      solution: FIX.replace('Speed : INTEGER', 'Speed : REAL'),
      wrong: [
        FIX.replace('Speed <- 2.5', 'Speed <- 3'),
        FIX.replace('Speed : INTEGER', 'Speed : STRING'),
        FIX.replace('Speed : INTEGER', 'Speed : REAL').replace('Happy : BOOLEAN', 'Happy : STRING')
      ]
    }
  });

  // ---------------------------------------------------------------- 2: change a working program
  var STAIRS = 'DECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    CALL ChangeX(30)\n    CALL ChangeY(30)\nNEXT Count\n';
  list.push({
    id: 'y8-2-2-constant',
    tag: 'Task 2 of 3',
    title: 'Use a Constant',
    brief: 'This program works: the sprite climbs 4 stairs, 30 steps at a time. <strong>Change it</strong> to use a constant called <strong>Jump</strong> for the 30. Then make each jump 20.',
    todo: ['<code>CALL ChangeX(...)</code> moves the sprite across. <code>CALL ChangeY(...)</code> moves it up.', 'In the end, one change to Jump must change every move.'],
    help: 'Write the constant at the top of the program. Then no line that moves the sprite should have a number in its brackets.',
    sprites: [{ name: 'Sprite1', x: -150, y: -120 }],
    fixMessage: fixMessage,
    starter: STAIRS,
    checks: [
      function (T) {
        if (!T.constant('Jump')) {
          var d = T.declared('Jump');
          if (d) return T.fail('Jump is a variable, declared with DECLARE', 'Jump is a constant', d.line);
          return T.fail('There is no constant called Jump', 'A constant called Jump, at the top of the program', 0);
        }
        return null;
      },
      function (T) {
        return T.run().then(function (r) {
          var m = moves(T, r);
          var xs = m.filter(function (x) { return x.fn === 'change_x'; }), ys = m.filter(function (x) { return x.fn === 'change_y'; });
          if (xs.length !== 4 || ys.length !== 4) return T.fail('The sprite moved across ' + xs.length + ' times and up ' + ys.length + ' times', 'It still climbs 4 stairs: across and up 4 times each', T.lineOf(/^\s*FOR\b/));
          var bad = m.filter(function (x) { return x.n !== 20; })[0];
          if (bad) return T.fail('A move was ' + bad.n + ' steps', 'Each move is 20 steps', T.constant('Jump').line);
          return T.run({ code: T.withConstant('Jump', 7) }).then(function (r2) {
            var bad2 = moves(T, r2).filter(function (x) { return x.n !== 7; })[0];
            var at = T.lineOf(/Change[XY]\s*\(\s*-?\d/);
            if (bad2) return T.fail('When Jump was changed to 7, a move was still ' + bad2.n + ' steps', 'Every move uses Jump, so one change to Jump changes them all', at);
            return null;
          });
        });
      }
    ],
    test: {
      solution: 'CONSTANT Jump <- 20\nDECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    CALL ChangeX(Jump)\n    CALL ChangeY(Jump)\nNEXT Count\n',
      wrong: [
        STAIRS.replace(/30/g, '20'),
        'CONSTANT Jump <- 20\nDECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    CALL ChangeX(Jump)\n    CALL ChangeY(20)\nNEXT Count\n',
        'CONSTANT Jump <- 30\nDECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    CALL ChangeX(Jump)\n    CALL ChangeY(Jump)\nNEXT Count\n',
        'DECLARE Jump : INTEGER\nDECLARE Count : INTEGER\nJump <- 20\nFOR Count <- 1 TO 4\n    CALL ChangeX(Jump)\n    CALL ChangeY(Jump)\nNEXT Count\n'
      ]
    }
  });

  // ---------------------------------------------------------------- 3: write it from the brief
  list.push({
    id: 'y8-2-2-score',
    tag: 'Task 3 of 3',
    title: 'Catch the Fish',
    brief: 'Write a program for a sprite that catches 3 fish. There is no starter code this time.',
    todo: ['A constant <strong>FishPoints</strong> set to 10.', '<strong>Score</strong>: a whole number that starts at 0.', '3 times: move the sprite 60 steps with <code>CALL MoveSteps(60)</code>, and add FishPoints to Score.', 'At the end, OUTPUT Score.'],
    help: 'Write the CONSTANT and DECLARE lines first. A FOR loop can do the move and the adding 3 times.',
    sprites: [{ name: 'Sprite1', x: -150, y: 0 }],
    fixMessage: fixMessage,
    starter: '',
    checks: [
      function (T) {
        if (!T.constant('FishPoints')) return T.fail('There is no constant called FishPoints', 'A constant called FishPoints, set to 10', T.lineOf(/FishPoints/));
        var d = T.declared('Score');
        if (!d) return T.fail('Score is never declared', 'Score is declared before it is used', 0);
        if (d.type !== 'INTEGER') return T.fail('Score is declared as ' + d.type, 'Score holds a whole number. Which data type is that?', d.line);
        return null;
      },
      function (T) {
        var outLine = T.lineOf(/^\s*OUTPUT\b/);
        return T.run().then(function (r) {
          var m = moves(T, r).filter(function (x) { return x.fn === 'move_steps'; });
          if (m.length !== 3 || m.some(function (x) { return x.n !== 60; })) return T.fail('The sprite moved ' + m.length + ' time' + (m.length === 1 ? '' : 's') + (m.length ? ': ' + m.map(function (x) { return x.n; }).join(', ') + ' steps' : ''), '3 moves of 60 steps', T.lineOf(/MoveSteps/));
          if (!r.out.length) return T.fail('Nothing was output', 'OUTPUT Score at the end', outLine);
          var o = r.out[r.out.length - 1].trim();
          if (o !== '30') return T.fail('The output was ' + o, 'Score after 3 fish of 10 points: 30', outLine);
          if (!r.vars.Score || r.vars.Score.value !== 30) return T.fail('Score was ' + (r.vars.Score ? r.vars.Score.value : 'never set'), 'Score holds 30 at the end', T.lineOf(/^\s*Score\s*<-/));
          return T.run({ code: T.withConstant('FishPoints', 7) }).then(function (r2) {
            var o2 = r2.out.length ? r2.out[r2.out.length - 1].trim() : '';
            if (o2 !== '21') return T.fail('When FishPoints was changed to 7, the output was ' + (o2 || 'nothing'), 'Score adds FishPoints each time, so 3 fish of 7 points give 21', T.lineOf(/^\s*Score\s*<-\s*Score/) || T.lineOf(/^\s*Score\s*<-/));
            return null;
          });
        });
      }
    ],
    test: {
      solution: 'CONSTANT FishPoints <- 10\nDECLARE Score : INTEGER\nDECLARE Fish : INTEGER\nScore <- 0\nFOR Fish <- 1 TO 3\n    CALL MoveSteps(60)\n    Score <- Score + FishPoints\nNEXT Fish\nOUTPUT Score\n',
      wrong: [
        'CONSTANT FishPoints <- 10\nDECLARE Score : REAL\nDECLARE Fish : INTEGER\nScore <- 0\nFOR Fish <- 1 TO 3\n    CALL MoveSteps(60)\n    Score <- Score + FishPoints\nNEXT Fish\nOUTPUT Score\n',
        'CONSTANT FishPoints <- 10\nDECLARE Score : INTEGER\nDECLARE Fish : INTEGER\nScore <- 0\nFOR Fish <- 1 TO 3\n    CALL MoveSteps(60)\n    Score <- Score + 10\nNEXT Fish\nOUTPUT Score\n',
        'CONSTANT FishPoints <- 10\nDECLARE Score : INTEGER\nDECLARE Fish : INTEGER\nScore <- 0\nFOR Fish <- 1 TO 2\n    CALL MoveSteps(60)\n    Score <- Score + FishPoints\nNEXT Fish\nOUTPUT Score\n',
        'DECLARE Score : INTEGER\nDECLARE Fish : INTEGER\nScore <- 0\nFOR Fish <- 1 TO 3\n    CALL MoveSteps(60)\n    Score <- Score + 10\nNEXT Fish\nOUTPUT Score\n'
      ]
    }
  });
})();
