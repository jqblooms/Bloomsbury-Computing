// PyScratch Tasks for Year 7 2.2 Input and Output (LessonData/y7-2-2-input-output.json, slides pyscratch-1 to
// pyscratch-3, built by tools/build_y7_2_2.mjs). Python (lang 'python'): Year 7 learns real Python. Only what 2.2 has
// taught by then: input(), print(), + to join Strings, int(), float() and str(). Format: the shell's docs/pyscratch.md.
// Help fades: 1 fix one line, 2 change a working program, 3 write it from the brief.
(function () {
  'use strict';
  var list = window.PyScratchTasks = window.PyScratchTasks || [];
  function dx(T, r) { return T.num(r.sprite.x - r.start.x); }
  function said(T, r) { return T.callsTo(r, 'say').map(function (a) { return String(a[0]); }); }
  function last(r) { return r.out.length ? r.out[r.out.length - 1] : ''; }

  // ---------------------------------------------------------------- 1: fix one line
  var FIX = 'name = input("What is your name? ")\nage = input("How old are you? ")\nsay("Hi " + name)\nprint("Next year you will be " + str(age + 1))\n';
  list.push({
    id: 'y7-2-2-fix',
    lang: 'python',
    tag: 'Task 1 of 3',
    title: 'Fix the Age',
    brief: 'Run this program: type a name, then an age. It stops with an error. <strong>Fix line 2</strong> so the program works.',
    todo: ['<code>say("Hi")</code> makes the sprite say Hi.', 'The user types Mia and 12: the sprite says Hi Mia, and it prints Next year you will be 13.'],
    help: 'Read the error. What data type does input() always give? What must happen to it before you can add 1?',
    sprites: [{ name: 'Sprite1', x: 0, y: 0 }],
    starter: FIX,
    checks: [
      function (T) {
        var tries = [['Mia', '12'], ['Ben', '9']], i = 0;
        function next() {
          if (i >= tries.length) return null;
          var t = tries[i++], want = 'Next year you will be ' + (Number(t[1]) + 1);
          return T.run({ inputs: t }).then(function (r) {
            var what = 'The user typed ' + t[0] + ' and ' + t[1];
            if (said(T, r).indexOf('Hi ' + t[0]) === -1) return T.fail(what + '. The sprite did not say Hi ' + t[0], 'The sprite says Hi and the name', T.lineOf(/say\(/));
            if (last(r) !== want) return T.fail(what + '. It printed: ' + (last(r) || 'nothing'), 'It prints: ' + want, T.lineOf(/print\(/));
            return next();
          });
        }
        return next();
      }
    ],
    test: {
      solution: FIX.replace('age = input("How old are you? ")', 'age = int(input("How old are you? "))'),
      wrong: [
        FIX.replace('age = input("How old are you? ")', 'age = float(input("How old are you? "))'),
        FIX.replace('str(age + 1)', 'age + "1"'),
        FIX.replace('age = input("How old are you? ")', 'age = int("How old are you? ")')
      ]
    }
  });

  // ---------------------------------------------------------------- 2: change a working program
  var HELLO = 'name = input("Name? ")\nprint("Hello " + name)\nsay("Hello " + name)\n';
  list.push({
    id: 'y7-2-2-age',
    lang: 'python',
    tag: 'Task 2 of 3',
    title: 'Name and Age',
    brief: 'This program works. <strong>Change it</strong>: also ask <code>"Age? "</code> and store the age as a whole number in <strong>age</strong>. The sprite says the name and age, like <strong>Mia is 12</strong>, then moves age x 10 steps.',
    todo: ['<code>say()</code> shows one String. Join the parts with +.', '<code>move_steps(20)</code> moves the sprite 20 steps.'],
    help: 'input() gives a String. Which function turns it into a whole number? To join a number to text with +, which function turns the number into a String?',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: HELLO,
    checks: [
      function (T) {
        var tries = [['Mia', '12'], ['Ben', '9'], ['Ploy', '15']], i = 0;
        function next() {
          if (i >= tries.length) return null;
          var t = tries[i++], want = t[0] + ' is ' + t[1], steps = Number(t[1]) * 10;
          return T.run({ inputs: t }).then(function (r) {
            var what = 'The user typed ' + t[0] + ' and ' + t[1];
            var s = said(T, r);
            if (s.indexOf(want) === -1) return T.fail(what + '. The sprite said: ' + (s.length ? s[s.length - 1] : 'nothing'), 'The sprite says: ' + want, T.lineOf(/say\(/));
            if (!r.vars.age || r.vars.age.type !== 'INTEGER') return T.fail(what + '. age was ' + (!r.vars.age ? 'never stored' : r.vars.age.type === 'STRING' ? 'the String "' + r.vars.age.value + '"' : 'the Real ' + r.vars.age.value), 'age holds the age as a whole number', T.lineOf(/^\s*age\s*=/));
            if (dx(T, r) !== steps) return T.fail(what + '. The sprite moved ' + dx(T, r) + ' steps', 'It moves ' + t[1] + ' x 10 = ' + steps + ' steps', T.lineOf(/move_steps/));
            return next();
          });
        }
        return next();
      }
    ],
    test: {
      solution: 'name = input("Name? ")\nage = int(input("Age? "))\nprint("Hello " + name)\nsay(name + " is " + str(age))\nmove_steps(age * 10)\n',
      wrong: [
        'name = input("Name? ")\nage = input("Age? ")\nprint("Hello " + name)\nsay(name + " is " + age)\nmove_steps(age * 10)\n',
        'name = input("Name? ")\nage = int(input("Age? "))\nprint("Hello " + name)\nsay(name + " is " + age)\nmove_steps(age * 10)\n',
        'name = input("Name? ")\nage = int(input("Age? "))\nprint("Hello " + name)\nsay(name + "is" + str(age))\nmove_steps(age * 10)\n',
        'name = input("Name? ")\nage = int(input("Age? "))\nprint("Hello " + name)\nsay(name + " is " + str(age))\nmove_steps(age)\n'
      ]
    }
  });

  // ---------------------------------------------------------------- 3: write it from the brief
  list.push({
    id: 'y7-2-2-metres',
    lang: 'python',
    tag: 'Task 3 of 3',
    title: 'Walk the Metres',
    brief: 'Write a program that walks the sprite. There is no starter code this time.',
    todo: ['Ask <code>"How many metres? "</code> and store the answer in <strong>metres</strong>. The user can type a decimal, like 2.5.',
      'Move the sprite metres x 100 steps.', 'Print <strong>You walked 2.5 metres</strong>, with the number the user typed.'],
    help: 'Can the user type a decimal point? Choose the function round input() for that. Check the spaces in what you print.',
    sprites: [{ name: 'Sprite1', x: -200, y: 0 }],
    starter: '',
    checks: [
      function (T) {
        var tries = ['2.5', '1.2', '3'], i = 0;
        function next() {
          if (i >= tries.length) return null;
          var t = tries[i++], steps = T.num(Number(t) * 100), want = 'You walked ' + String(Number(t) === Math.floor(Number(t)) ? Number(t).toFixed(1) : t) + ' metres';
          return T.run({ inputs: [t] }).then(function (r) {
            var what = 'The user typed ' + t;
            if (!r.vars.metres) return T.fail(what + '. metres was never stored', 'metres holds what the user typed, as a number', 0);
            if (r.vars.metres.type === 'STRING') return T.fail(what + '. metres was the String "' + r.vars.metres.value + '"', 'metres holds a number, so the program can do maths with it', T.lineOf(/^\s*metres\s*=/));
            if (dx(T, r) !== steps) return T.fail(what + '. The sprite moved ' + dx(T, r) + ' steps', 'It moves ' + t + ' x 100 = ' + steps + ' steps', T.lineOf(/move_steps/));
            if (last(r) !== want) return T.fail(what + '. It printed: ' + (last(r) || 'nothing'), 'It prints: ' + want, T.lineOf(/print\(/));
            return next();
          });
        }
        return next();
      }
    ],
    test: {
      solution: 'metres = float(input("How many metres? "))\nmove_steps(metres * 100)\nprint("You walked " + str(metres) + " metres")\n',
      wrong: [
        'metres = int(input("How many metres? "))\nmove_steps(metres * 100)\nprint("You walked " + str(metres) + " metres")\n',
        'metres = input("How many metres? ")\nmove_steps(metres * 100)\nprint("You walked " + metres + " metres")\n',
        'metres = float(input("How many metres? "))\nmove_steps(metres * 100)\nprint("You walked" + str(metres) + "metres")\n',
        'metres = float(input("How many metres? "))\nmove_steps(100)\nprint("You walked", metres, "metres")\n'
      ]
    }
  });
})();
