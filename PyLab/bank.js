// Python Lab question bank (Year 7, 2.1 Data Types and Variables and 2.2 Input and Output). Every generator returns
// a program as text with new values each time; the right answer is never written here: the app runs the program in
// real Python (Skulpt) and compares. Pure JavaScript, so tools/test_pylab.mjs can load it in Node too.
var PLBANK = (function () {
  'use strict';
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function q(s) { return '"' + s + '"'; }
  var NAMES = ['Mia', 'Tom', 'Ana', 'Ben', 'Lily', 'Sam', 'Nok', 'Kai'];
  var FOODS = ['cake', 'rice', 'soup', 'pie', 'tea', 'jam'];
  var VARS = ['score', 'coins', 'lives', 'points', 'steps', 'gems'];
  function twoVars() { var v = shuffle(VARS); return [v[0], v[1]]; }
  function dec() { return pick(['0.5', '1.5', '2.5', '3.5', '4.5', '0.25', '1.25', '2.75']); }

  // ------------------------------------------------------------------ Which data type? (pick a button)
  // Each item: { code, name } where name is the variable whose type is asked. The app adds print(type(name).__name__).
  var TYPES = {
    // Level 1: a value stored in a variable.
    value: function () {
      var name = pick(['x', 'item', 'data', 'value']);
      var kind = pick(['int', 'int', 'float', 'float', 'str', 'strnum', 'strnum', 'point0']);
      var v;
      if (kind === 'int') v = String(pick([rnd(2, 99), rnd(100, 2026), -rnd(1, 20), 0]));
      else if (kind === 'float') v = pick([dec(), String(rnd(1, 9)) + '.' + rnd(1, 9), '-' + dec()]);
      else if (kind === 'point0') v = rnd(1, 20) + '.0';
      else if (kind === 'str') v = q(pick(NAMES.concat(['hello', 'Bangkok', 'Yes'])));
      else v = q(pick([String(rnd(2, 99)), dec(), '0' + rnd(800000000, 999999999)]));
      return { code: name + ' = ' + v, name: name, why: kind };
    },
    // Level 2: the result of a calculation or a join.
    calc: function () {
      var a = rnd(2, 9), b = rnd(2, 9), kind = pick(['add', 'mul', 'div', 'divexact', 'mixed', 'join', 'joinnum', 'sub']);
      var code;
      if (kind === 'add') code = 'total = ' + a + ' + ' + b;
      else if (kind === 'sub') code = 'total = ' + (a + b) + ' - ' + b;
      else if (kind === 'mul') code = 'total = ' + a + ' * ' + b;
      else if (kind === 'div') { if (a % 2 === 0) a++; code = 'total = ' + a + ' / 2'; }
      else if (kind === 'divexact') code = 'total = ' + (a * 2) + ' / 2';
      else if (kind === 'mixed') code = 'total = ' + a + ' + ' + dec();
      else if (kind === 'join') code = 'total = ' + q(pick(NAMES)) + ' + ' + q(pick(['!', ' Lee', 'ya']));
      else code = 'total = ' + q(String(a)) + ' + ' + q(String(b));
      return { code: code, name: 'total', why: kind };
    },
    // Level 3: a short program; the type of the variable at the end.
    program: function () {
      var v = pick(VARS), a = rnd(2, 20), b = rnd(2, 9), kind = pick(['grow', 'half', 'last', 'lastnum', 'join', 'times']);
      var lines;
      if (kind === 'grow') lines = [v + ' = ' + a, v + ' = ' + v + ' + ' + b];
      else if (kind === 'half') lines = [v + ' = ' + (a * 2), v + ' = ' + v + ' / 2'];
      else if (kind === 'last') lines = [v + ' = ' + a, v + ' = ' + q(String(a))];
      else if (kind === 'lastnum') lines = [v + ' = ' + q(String(a)), v + ' = ' + a + '.5'];
      else if (kind === 'join') lines = ['word = ' + q(pick(FOODS)), 'word = word + ' + q('s')];
      else lines = [v + ' = ' + a, v + ' = ' + v + ' * ' + b + '.0'];
      return { code: lines.join('\n'), name: kind === 'join' ? 'word' : v, why: kind };
    }
  };
  var TYPE_WHY = {
    int: 'A whole number with no decimal point is an Integer.',
    float: 'A number with a decimal point is a Real.',
    point0: 'It has a decimal point, so it is a Real, even though .0 is nothing extra.',
    str: 'Text in quote marks is a String.',
    strnum: 'It is in quote marks, so it is a String. It looks like a number, but Python stores it as text.',
    add: 'A whole number + a whole number gives a whole number: an Integer.',
    sub: 'A whole number - a whole number gives a whole number: an Integer.',
    mul: 'A whole number * a whole number gives a whole number: an Integer.',
    div: '/ always gives a Real in Python.',
    divexact: '/ always gives a Real in Python, even when it divides exactly. Python shows it with .0.',
    mixed: 'A whole number + a Real gives a Real.',
    join: '+ with two Strings joins them into one String.',
    joinnum: 'Both are in quote marks, so + joins two Strings. The answer is a String.',
    grow: 'It starts as an Integer, and adding a whole number keeps it an Integer.',
    half: '/ always gives a Real, so the new value is a Real.',
    last: 'The last value stored is in quote marks. The variable holds that String now.',
    lastnum: 'The last value stored has a decimal point. The variable holds that Real now.',
    times: 'It is multiplied by a Real, so the answer is a Real.'
  };

  // ------------------------------------------------------------------ Predict, then run
  // Each item: { code, inputs (what the user types, in order), why }.
  var VARS_L = {
    // Level 1: store and store again.
    store: function () {
      var t = twoVars(), a = rnd(2, 30), b = rnd(31, 60), kind = rnd(0, 2);
      if (kind === 0) return { code: [t[0] + ' = ' + a, t[0] + ' = ' + b, 'print(' + t[0] + ')'].join('\n'), why: 'A variable holds one value. Storing ' + b + ' replaces ' + a + '.' };
      if (kind === 1) return { code: [t[0] + ' = ' + a, t[1] + ' = ' + b, 'print(' + t[1] + ')', 'print(' + t[0] + ')'].join('\n'), why: 'Each variable has its own name and its own value. The print lines run in order.' };
      return { code: [t[0] + ' = ' + a, 'print(' + t[0] + ')', t[0] + ' = ' + b, 'print(' + t[0] + ')'].join('\n'), why: 'The first print runs before the new value is stored, so it shows the old value.' };
    },
    // Level 2: change a variable using its own value.
    change: function () {
      var v = pick(VARS), a = rnd(5, 30), b = rnd(2, 9), c = rnd(2, 5), kind = rnd(0, 2);
      if (kind === 0) return { code: [v + ' = ' + a, v + ' = ' + v + ' + ' + b, 'print(' + v + ')'].join('\n'), why: 'The right side is worked out first: ' + a + ' + ' + b + '. Then the answer is stored back in ' + v + '.' };
      if (kind === 1) return { code: [v + ' = ' + a, v + ' = ' + v + ' - ' + b, v + ' = ' + v + ' - ' + b, 'print(' + v + ')'].join('\n'), why: 'Each line takes ' + b + ' away from the value it has now.' };
      return { code: [v + ' = ' + b, v + ' = ' + v + ' * ' + c, v + ' = ' + v + ' + 1', 'print(' + v + ')'].join('\n'), why: 'Work it out line by line: each line uses the value from the line before.' };
    },
    // Level 3: copies, order and two variables.
    copy: function () {
      var t = twoVars(), a = rnd(2, 20), b = rnd(21, 50), kind = rnd(0, 2);
      if (kind === 0) return { code: [t[0] + ' = ' + a, t[1] + ' = ' + t[0], t[0] + ' = ' + b, 'print(' + t[1] + ')'].join('\n'), why: t[1] + ' = ' + t[0] + ' copies the value ' + a + ' at that moment. Changing ' + t[0] + ' later does not change ' + t[1] + '.' };
      if (kind === 1) return { code: [t[0] + ' = ' + a, t[1] + ' = ' + b, t[0] + ' = ' + t[1], t[1] + ' = ' + t[0], 'print(' + t[0] + ')', 'print(' + t[1] + ')'].join('\n'), why: 'After ' + t[0] + ' = ' + t[1] + ', both hold ' + b + '. The old ' + a + ' is gone, so the last line copies ' + b + ' back.' };
      return { code: [t[0] + ' = ' + a, t[1] + ' = ' + t[0] + ' + ' + t[0], t[0] + ' = ' + t[1] + ' - 1', 'print(' + t[0] + ')', 'print(' + t[1] + ')'].join('\n'), why: 'Work line by line. ' + t[1] + ' is worked out from ' + t[0] + ' first, then ' + t[0] + ' changes.' };
    }
  };

  var IO_L = {
    // Part 1, level 1: one input of text.
    text: function () {
      var n = pick(NAMES), f = pick(FOODS), kind = rnd(0, 3);
      if (kind === 0) return { code: ['name = input("What is your name? ")', 'print("Hello " + name)'].join('\n'), inputs: [n], why: 'input() stores what the user types in name. + joins the two Strings.' };
      if (kind === 1) return { code: ['name = input("What is your name? ")', 'print("Hi", name)'].join('\n'), inputs: [n], why: 'A comma in print shows both things with one space between them.' };
      if (kind === 2) return { code: ['food = input("Favourite food? ")', 'print(food + food)'].join('\n'), inputs: [f], why: '+ joins two Strings with no space between them.' };
      return { code: ['name = input("Name? ")', 'print(name + "!")', 'print("Bye")'].join('\n'), inputs: [n], why: 'The prompt "Name? " is not printed by print. Only the print lines are output here.' };
    },
    // Part 1, level 2: two inputs, in order.
    two: function () {
      var p = shuffle(NAMES), f = shuffle(FOODS), kind = rnd(0, 2);
      if (kind === 0) return { code: ['first = input("First name? ")', 'last = input("Last name? ")', 'print(first + " " + last)'].join('\n'), inputs: [p[0], p[1]], why: 'The first thing typed goes into the first input(). " " is a String holding one space.' };
      if (kind === 1) return { code: ['a = input("Food? ")', 'b = input("Drink? ")', 'print(b)', 'print(a)'].join('\n'), inputs: [f[0], f[1]], why: 'a holds the first thing typed and b holds the second. print(b) runs first.' };
      return { code: ['pet = input("Pet? ")', 'name = input("Its name? ")', 'print(name + " the " + pet)'].join('\n'), inputs: [pick(['cat', 'dog', 'fish']), p[0]], why: 'Each input() stores one typed answer, in order. + joins the Strings.' };
    },
    // Part 2, level 1: numbers from input().
    numbers: function () {
      var a = rnd(2, 9), b = rnd(2, 9), kind = rnd(0, 3);
      if (kind === 0) return { code: ['a = input("Number? ")', 'b = input("Number? ")', 'print(a + b)'].join('\n'), inputs: [String(a), String(b)], why: 'input() always gives a String. + joins the two Strings, so it does not add.' };
      if (kind === 1) return { code: ['a = int(input("Number? "))', 'b = int(input("Number? "))', 'print(a + b)'].join('\n'), inputs: [String(a), String(b)], why: 'int() turns each String into an Integer, so + adds.' };
      if (kind === 2) return { code: ['n = float(input("Number? "))', 'print(n * 2)'].join('\n'), inputs: [String(a)], why: 'float() turns the String into a Real, so the answer is a Real and shows a decimal point.' };
      return { code: ['age = int(input("Age? "))', 'print(age + 1)'].join('\n'), inputs: [String(rnd(10, 14))], why: 'int() turns the String into an Integer, so age + 1 adds 1.' };
    },
    // Part 2, level 2: errors mixed with programs that work.
    errors: function () {
      var a = rnd(10, 14), kind = rnd(0, 5);
      if (kind === 0) return { code: ['age = input("Age? ")', 'print(age + 1)'].join('\n'), inputs: [String(a)], why: 'age is a String. Python cannot add the number 1 to a String, so it stops with an error.' };
      if (kind === 1) return { code: ['n = int(input("Number? "))', 'print(n * 2)'].join('\n'), inputs: [dec()], why: 'int() can only turn a whole number into an Integer. A number with a decimal point needs float().' };
      if (kind === 2) return { code: ['age = int(input("Age? "))', 'print("Age: " + age)'].join('\n'), inputs: [String(a)], why: '+ cannot join a String and an Integer. str(age) would turn it into text first.' };
      if (kind === 3) return { code: ['age = int(input("Age? "))', 'print("Age: " + str(age + 1))'].join('\n'), inputs: [String(a)], why: 'age + 1 is worked out first. str() turns the answer into text, so + can join it.' };
      if (kind === 4) return { code: ['n = float(input("Number? "))', 'print(n + 1)'].join('\n'), inputs: [String(rnd(2, 9))], why: 'float() turns a whole number into a Real too. A Real shows a decimal point.' };
      return { code: ['a = input("Number? ")', 'b = int(a)', 'print(b + b)'].join('\n'), inputs: [String(rnd(2, 9))], why: 'a is a String, but int(a) stores it as an Integer in b, so b + b adds.' };
    }
  };

  // ------------------------------------------------------------------ Write or fix a program
  // Each task: { title, brief (html), starter, ref (a correct program), tests (lists of typed inputs; tests[0] is the
  // sample run shown), vars (variables that must hold a value of a type at the end), rules [{re, not, msg}] on the code }.
  function ints(n, a, b) { var out = []; for (var i = 0; i < n; i++) out.push(String(rnd(a, b))); return out; }
  var WRITE = {
    // 2.1, Activity 3, level 1: three variables of the right types.
    store: function () {
      var n = pick(NAMES), age = rnd(11, 13), h = (1 + rnd(40, 65) / 100).toFixed(2);
      return { title: 'Store three values', brief: 'Make three variables: <b>name</b> holds <b>' + n + '</b>, <b>age</b> holds <b>' + age + '</b> and <b>height</b> holds <b>' + h + '</b>. Choose the right data type for each. Then print all three, one on each line.',
        starter: '# Store the three values here\n\n# Print them here\n', ref: 'name = "' + n + '"\nage = ' + age + '\nheight = ' + h + '\nprint(name)\nprint(age)\nprint(height)', tests: [[]],
        vars: { name: ['str', n], age: ['int', age], height: ['float', Number(h)] },
        rules: [{ re: /print\s*\(\s*name\s*\)/, msg: 'Print the variable name: print(name).' }, { re: /print\s*\(\s*age\s*\)/, msg: 'Print the variable age: print(age).' }, { re: /print\s*\(\s*height\s*\)/, msg: 'Print the variable height: print(height).' }] };
    },
    // Level 2: change a variable using its own value.
    change: function () {
      var a = rnd(5, 20), b = rnd(3, 9);
      return { title: 'Change a variable', brief: 'A player has <b>' + a + '</b> coins. Store it in a variable called <b>coins</b>. Then the player finds <b>' + b + '</b> more. Change <b>coins</b> using its own value. Then print coins.',
        starter: '', ref: 'coins = ' + a + '\ncoins = coins + ' + b + '\nprint(coins)', tests: [[]], vars: { coins: ['int', a + b] },
        rules: [{ re: new RegExp('coins\\s*=\\s*' + a + '\\s*(\\n|$)'), msg: 'Start by storing ' + a + ' in coins.' }, { re: /coins\s*(=\s*coins\s*\+|\+=|=\s*\d+\s*\+\s*coins\b)/, msg: 'Change coins using its own value: coins = coins + ...' },
          { re: new RegExp('\\b' + (a + b) + '\\b'), not: true, msg: 'Let Python work out the new number. Do not type it yourself.' }, { re: /print\s*\(\s*coins\s*\)/, msg: 'Print the variable: print(coins).' }] };
    },
    // Level 3: text and a number in one print.
    // Level 3: work out a new variable from two others.
    calc: function () {
      var p = dec(), n = rnd(2, 6), item = pick(['cake', 'pen', 'drink', 'ticket']);
      var total = Number(p) * n;
      return { title: 'Work it out', brief: 'One ' + item + ' costs <b>' + p + '</b>. Sam buys <b>' + n + '</b>. Store the cost in <b>price</b> and how many in <b>how_many</b>. Then store price times how_many in <b>total</b>, and print total. Let Python do the sum.',
        starter: '', ref: 'price = ' + p + '\nhow_many = ' + n + '\ntotal = price * how_many\nprint(total)', tests: [[]], vars: { price: ['float', Number(p)], how_many: ['int', n], total: ['float', total] },
        rules: [{ re: /total\s*=\s*(price\s*\*\s*how_many|how_many\s*\*\s*price)/, msg: 'Work out total from the two variables: total = price * how_many.' }, { re: /print\s*\(\s*total\s*\)/, msg: 'Print the variable: print(total).' }] };
    }
  };
  var FIX = {
    // 2.2: a program that runs wrong or stops; fix it so it works for any input.
    add: function () {
      return { title: 'Add two numbers', brief: 'This program should print the total of two whole numbers. It prints the wrong answer. Fix it.',
        starter: 'a = input("First number: ")\nb = input("Second number: ")\nprint(a + b)', ref: 'a = int(input("First number: "))\nb = int(input("Second number: "))\nprint(a + b)',
        tests: [ints(2, 2, 9), ints(2, 10, 60), ints(2, 1, 99)], vars: {}, rules: [] };
    },
    price: function () {
      return { title: 'Double the price', brief: 'This program should print double the price typed in. A price can have a decimal point, like 2.5. It stops with an error. Fix it.',
        starter: 'price = int(input("Price: "))\nprint(price * 2)', ref: 'price = float(input("Price: "))\nprint(price * 2)',
        tests: [[dec()], [String(rnd(3, 9)) + '.5'], [String(rnd(2, 9))]], vars: {}, rules: [] };
    },
    nextyear: function () {
      return { title: 'Age next year', brief: 'This program should print a message like the sample. It stops with an error. Fix it.',
        starter: 'age = int(input("Age: "))\nprint("Next year you will be " + age + 1)', ref: 'age = int(input("Age: "))\nprint("Next year you will be " + str(age + 1))',
        tests: [ints(1, 10, 14), ints(1, 15, 40), ints(1, 41, 90)], vars: {}, rules: [] };
    },
    stored: function () {
      return { title: 'Say hello', brief: 'This program should say hello to the person typed in, like the sample. It stops with an error. Fix it.',
        starter: 'input("Name: ")\nprint("Hello " + name)', ref: 'name = input("Name: ")\nprint("Hello " + name)',
        tests: shuffle(NAMES).slice(0, 3).map(function (n) { return [n]; }), vars: {}, rules: [] };
    }
  };
  var IOWRITE = {
    hello: function () {
      return { title: 'Hello', brief: 'Write a program that asks for a name and then prints Hello and the name, exactly like the sample.',
        starter: '', ref: 'name = input("Name: ")\nprint("Hello " + name)', tests: shuffle(NAMES).slice(0, 3).map(function (n) { return [n]; }), vars: {}, rules: [{ re: /input\s*\(/, msg: 'Use input() to ask for the name.' }] };
    },
    total: function () {
      return { title: 'Total of two numbers', brief: 'Write a program that asks for two whole numbers and prints their total.',
        starter: '', ref: 'a = int(input("First number: "))\nb = int(input("Second number: "))\nprint(a + b)', tests: [ints(2, 2, 9), ints(2, 10, 50), ints(2, 51, 99)], vars: {}, rules: [{ re: /input\s*\([\s\S]*input\s*\(/, msg: 'Use input() twice, once for each number.' }] };
    },
    cost: function () {
      var unit = pick(['cake', 'pen', 'drink']);
      return { title: 'Total cost', brief: 'Write a program that asks for the price of one ' + unit + ' (it can have a decimal point) and how many ' + unit + 's (a whole number). Print the total cost: price times how many.',
        starter: '', ref: 'price = float(input("Price: "))\nhow_many = int(input("How many: "))\nprint(price * how_many)', tests: [[dec(), String(rnd(2, 4))], [String(rnd(2, 9)) + '.5', String(rnd(2, 6))], [String(rnd(2, 9)), String(rnd(2, 5))]], vars: {},
        rules: [{ re: /float\s*\(/, msg: 'A price can have a decimal point. Which function turns text into a Real?' }] };
    },
    future: function () {
      var y = rnd(3, 9);
      return { title: 'In ' + y + ' years', brief: 'Write a program that asks for an age and prints a message exactly like the sample.',
        starter: '', ref: 'age = int(input("Age: "))\nprint("In ' + y + ' years you will be " + str(age + ' + y + '))', tests: [ints(1, 10, 14), ints(1, 15, 40), ints(1, 41, 80)], vars: {},
        rules: [{ re: /int\s*\(/, msg: 'Turn the age into a number before you add to it.' }] };
    }
  };

  return { rnd: rnd, pick: pick, shuffle: shuffle, TYPES: TYPES, TYPE_WHY: TYPE_WHY, VARS_L: VARS_L, IO_L: IO_L, WRITE: WRITE, FIX: FIX, IOWRITE: IOWRITE };
})();
if (typeof module !== 'undefined') module.exports = PLBANK;
