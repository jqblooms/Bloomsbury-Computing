// Year 11 Mock Test 1B Revision: Tracing and Correcting Algorithms
// Loaded by Drills/index.html?drill=y11-mock1-b
DrillData.register("y11-mock1-b", {
  title: "Year 11 Mock Test 1B Revision: Tracing and Correcting Algorithms",
  subtitle: "Cambridge IGCSE Computer Science 0478 - trace tables, finding errors and validation loops",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["m1b-trace", "Tracing Algorithms"],
    ["m1b-errors", "Finding and Correcting Errors"],
    ["m1b-valid", "Validation Loops"]
  ],
  cards: (function () {
    function exact(v) { return [new RegExp("^\\s*" + String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "i")]; }
    function fill(card) { var inst = card.randomize(); Object.keys(inst).forEach(function (k) { card[k] = inst[k]; }); return card; }
    function pick(list) { return list[randInt(0, list.length - 1)]; }
    return [
      // ---------------- tracing
      fill({
        id: "m1b-tr-repeat", category: "m1b-trace",
        randomize: function () {
          var m = randInt(4, 6), extra = randInt(1, 3), vals = [];
          for (var i = 0; i < m + extra; i++) vals.push(randInt(20, 80));
          if (Math.random() < 0.5) vals[randInt(0, m - 1)] = 50;
          var read = vals.slice(0, m);
          var pass = read.filter(function (v) { return v < 50; }).length;
          var passAll = vals.filter(function (v) { return v < 50; }).length;
          var passEq = read.filter(function (v) { return v <= 50; }).length;
          return {
            prompt: "PassCount <- 0\nCount <- 0\nREPEAT\n   INPUT Size\n   IF Size < 50\n     THEN\n       PassCount <- PassCount + 1\n   ENDIF\n   Count <- Count + 1\nUNTIL Count = " + m + "\nOUTPUT PassCount\n\nInput data: " + vals.join(", ") + "\nWhat is output?",
            answers: [String(pass)], keywords: exact(pass),
            distractors: dedupeDistractors(pass, [passAll, m - pass, m, passEq, pass + 1, pass - 1].filter(function (x) { return x >= 0; }), function (i) { return pass + i + 1; }),
            note: "The loop stops when Count = " + m + ", so only the first " + m + " values (" + read.join(", ") + ") are read. " + pass + " of them are below 50" + (read.indexOf(50) !== -1 ? " (50 is not below 50)." : ".")
          };
        }
      }),
      fill({
        id: "m1b-tr-unread", category: "m1b-trace",
        randomize: function () {
          var m = randInt(4, 7), extra = randInt(1, 3), vals = [];
          for (var i = 0; i < m + extra; i++) vals.push(randInt(1, 99));
          return {
            prompt: "Count <- 0\nREPEAT\n   INPUT Value\n   Count <- Count + 1\nUNTIL Count = " + m + "\n\nInput data: " + vals.join(", ") + "\nHow many of the input values are never read?",
            answers: [String(extra)], keywords: exact(extra),
            distractors: dedupeDistractors(extra, [0, m, m + extra, extra + 1, 1]),
            note: "The loop reads exactly " + m + " values, so the last " + extra + " are never input. Look at where a loop stops before you fill in a trace table."
          };
        }
      }),
      fill({
        id: "m1b-tr-while", category: "m1b-trace",
        randomize: function () {
          var step = randInt(3, 9), limit = randInt(15, 60), total = 0, count = 0;
          while (total < limit) { total += step; count++; }
          return {
            prompt: "Total <- 0\nCount <- 0\nWHILE Total < " + limit + " DO\n   Total <- Total + " + step + "\n   Count <- Count + 1\nENDWHILE\nOUTPUT Count\n\nWhat is output?",
            answers: [String(count)], keywords: exact(count),
            distractors: dedupeDistractors(count, [count - 1, count + 1, total, Math.floor(limit / step), limit], function (i) { return count + i + 1; }),
            note: "Total goes " + (function () { var t = 0, s = []; for (var i = 0; i < count; i++) { t += step; s.push(t); } return s.join(", "); })() + ". It stops once Total is no longer below " + limit + ", after " + count + " passes."
          };
        }
      }),
      fill({
        id: "m1b-tr-average", category: "m1b-trace",
        randomize: function () {
          var vals = [randInt(2, 20), randInt(2, 20), randInt(2, 20)];
          var total = vals[0] + vals[1] + vals[2];
          var avg = Math.round(total / 3 * 100) / 100;
          var wrong = Math.round(3 / total * 100) / 100;
          return {
            prompt: "Counter <- 0\nTotal <- 0\nINPUT Number\nWHILE Number <> -1 DO\n   Total <- Total + Number\n   Counter <- Counter + 1\n   INPUT Number\nENDWHILE\nOUTPUT ROUND(Total / Counter, 2)\n\nInput data: " + vals.join(", ") + ", -1\nWhat is output?",
            answers: [String(avg)], keywords: exact(avg),
            distractors: dedupeDistractors(avg, [total, wrong, Math.round(total / 4 * 100) / 100, Math.round((total - 1) / 4 * 100) / 100, Math.floor(total / 3)]),
            note: "-1 stops the loop and is not added. Total = " + total + ", Counter = 3, so the average is " + total + " / 3 = " + avg + " to 2 decimal places."
          };
        }
      }),
      fill({
        id: "m1b-tr-divmod", category: "m1b-trace",
        randomize: function () {
          var t = randInt(61, 3599), mins = Math.floor(t / 60), secs = t % 60;
          var ans = mins + " minutes " + secs + " seconds";
          return {
            prompt: "RunTime <- " + t + "\nRunMins <- DIV(RunTime, 60)\nRunSecs <- MOD(RunTime, 60)\nOUTPUT RunMins, \" minutes \", RunSecs, \" seconds\"\n\nWhat is output?",
            answers: [ans], keywords: [new RegExp("^\\D*" + mins + "\\D+" + secs + "\\D*$")],
            distractors: dedupeDistractors(ans, [secs + " minutes " + mins + " seconds", mins + " minutes " + mins + " seconds", (t / 60).toFixed(2) + " minutes 0 seconds", (mins + 1) + " minutes " + secs + " seconds", t + " minutes " + secs + " seconds"], function (i) { return (mins + i + 1) + " minutes " + ((secs + i) % 60) + " seconds"; }),
            note: "DIV gives the whole minutes (" + t + " DIV 60 = " + mins + ") and MOD gives the seconds left over (" + t + " MOD 60 = " + secs + ")."
          };
        }
      }),
      {
        id: "m1b-tr-rows", category: "m1b-trace",
        prompt: "When filling in a trace table, when do you write a new value?",
        answers: ["When a variable changes value, or when something is output"],
        keywords: [{ required: [["change", "changed", "new", "update", "updated"], ["output", "outputs", "printed"]] }],
        distractors: ["For every line of the program, including lines that are skipped", "Only when there is an OUTPUT", "Only at the start of each loop", "Once for each variable, at the end", "Only when an INPUT happens"],
        note: "Only record what actually happens: a new value when a variable changes, and anything that is output. Skipped lines add nothing."
      },
      // ---------------- finding errors
      fill({
        id: "m1b-err-cond", category: "m1b-errors",
        randomize: function () {
          var v = pick([
            { p: "// keep adding numbers until -1 is input\nTotal <- 0\nINPUT Number\nWHILE Number = -1 DO\n   Total <- Total + Number\n   INPUT Number\nENDWHILE", a: "In the WHILE line, = should be <>", k: [/<>|not\s*equal/i], n: "The loop should keep going while Number is NOT -1, so the condition is Number <> -1." },
            { p: "// keep asking while the password is shorter than 8 characters\nINPUT Password\nWHILE LENGTH(Password) > 8 DO\n   INPUT Password\nENDWHILE", a: "In the WHILE line, > should be <", k: [/(^|[^<>=-])<\s*(8)?\s*$|less\s*than|should\s*be\s*<(?![>=])/i], n: "Shorter than 8 characters means LENGTH(Password) < 8." },
            { p: "// repeat until the user types Y\nREPEAT\n   OUTPUT \"Continue? \"\n   INPUT Answer\nUNTIL Answer <> \"Y\"", a: "In the UNTIL line, <> should be =", k: [/should\s*be\s*=|(^|[^<>])=\s*("?y"?)?\s*$|equals?\s*("?y"?)?\s*$/i], n: "The loop should stop when Answer IS \"Y\", so the condition is Answer = \"Y\"." }
          ]);
          return {
            prompt: "Find the error in this pseudocode.\n" + v.p,
            answers: [v.a], keywords: v.k,
            distractors: ["INPUT should be OUTPUT", "The loop should be a FOR loop", "The first line should be deleted", "A variable is missing its quote marks", "Nothing is wrong"],
            note: v.n
          };
        }
      }),
      fill({
        id: "m1b-err-accum", category: "m1b-errors",
        randomize: function () {
          var v = pick([
            { p: "// total of 10 marks\nTotal <- 0\nFOR Count <- 1 TO 10\n   INPUT Mark\n   Total <- Total + 1\nNEXT Count", a: "Total <- Total + 1 should be Total <- Total + Mark", k: [/\+\s*mark\b/i], n: "A running total adds the value (Mark). Adding 1 just counts the passes." },
            { p: "// count how many marks are 50 or more\nPassCount <- 0\nFOR Count <- 1 TO 10\n   INPUT Mark\n   IF Mark >= 50\n     THEN\n       PassCount <- PassCount + Mark\n   ENDIF\nNEXT Count", a: "PassCount <- PassCount + Mark should add 1", k: [/\+\s*1\b|add(s|ing)?\s*(one|1)\b/i], n: "Counting adds 1 each time, not the value itself." }
          ]);
          return {
            prompt: "Find the error in this pseudocode.\n" + v.p,
            answers: [v.a], keywords: v.k,
            distractors: ["The loop should start at 0", "INPUT should be OUTPUT", "NEXT Count should be ENDFOR", "The total should start at 1", "Nothing is wrong"],
            note: v.n
          };
        }
      }),
      fill({
        id: "m1b-err-type", category: "m1b-errors",
        randomize: function () {
          var v = pick([
            { p: "DECLARE Mean : INTEGER\nMean <- Total / Count", a: "Mean should be declared as REAL", k: [{ required: [["real"]] }], n: "/ can give a decimal answer, which an INTEGER cannot hold." },
            { p: "DECLARE Seconds : STRING\nINPUT Seconds\nMinutes <- DIV(Seconds, 60)", a: "Seconds should be declared as INTEGER", k: [{ required: [["integer", "int"]] }], n: "DIV only works on numbers, so Seconds must be a whole number (INTEGER), not a STRING." },
            { p: "DECLARE StudentName : INTEGER\nOUTPUT \"Enter the student's name \"\nINPUT StudentName", a: "StudentName should be declared as STRING", k: [{ required: [["string"]] }], n: "A name is text, so it must be a STRING." }
          ]);
          return {
            prompt: "Find the error in this pseudocode.\n" + v.p,
            answers: [v.a], keywords: v.k,
            distractors: ["The DECLARE line should come last", "INPUT should be OUTPUT", "The variable needs quote marks", "<- should be =", "Nothing is wrong"],
            note: v.n
          };
        }
      }),
      fill({
        id: "m1b-err-io", category: "m1b-errors",
        randomize: function () {
          var name = pick(["Height", "Score", "Price", "Distance"]);
          return {
            prompt: "Find the error in this pseudocode.\nOUTPUT \"Enter the " + name.toLowerCase() + " \"\nOUTPUT " + name + "\nTotal <- Total + " + name,
            answers: ["The second line should be INPUT " + name],
            keywords: [{ required: [["input"]], excluded: ["first", "third", "last"] }],
            distractors: ["The first line should be INPUT", "The third line should be OUTPUT", name + " needs quote marks", "Total should be declared as a STRING", "Nothing is wrong"],
            note: "OUTPUT only displays a value. To get a value from the user, use INPUT " + name + "."
          };
        }
      }),
      fill({
        id: "m1b-err-divmod", category: "m1b-errors",
        randomize: function () {
          var v = pick([
            { p: "// seconds left over after the whole minutes\nSecs <- DIV(Time, 60)", a: "DIV should be MOD", k: [/div\W+(should\s+be|to|becomes?|->|\u2192)\W*mod|^\W*(use\s+)?mod\W*$/i], n: "The remainder (the seconds left over) comes from MOD. DIV gives the whole minutes." },
            { p: "// whole hours in Minutes\nHours <- MOD(Minutes, 60)", a: "MOD should be DIV", k: [/mod\W+(should\s+be|to|becomes?|->|\u2192)\W*div|^\W*(use\s+)?div\W*$/i], n: "Whole hours come from DIV. MOD would give the minutes left over." }
          ]);
          return {
            prompt: "Find the error in this pseudocode.\n" + v.p,
            answers: [v.a], keywords: v.k,
            distractors: ["60 should be 100", "The brackets are not needed", "The variable on the left is wrong", "<- should be =", "Nothing is wrong"],
            note: v.n
          };
        }
      }),
      fill({
        id: "m1b-err-store", category: "m1b-errors",
        randomize: function () {
          var v = pick([
            { p: "// store each student's name in Names[]\nFOR Index <- 1 TO 30\n   INPUT StudentName\n   INPUT Age\n   Names[Index] <- Age\nNEXT Index", a: "Names[Index] <- Age should store StudentName", k: [/studentname/i], n: "The array is for names, so it must store StudentName." },
            { p: "// store each price in Prices[]\nFOR Index <- 1 TO 20\n   INPUT Price\n   Prices[Index] <- Index\nNEXT Index", a: "Prices[Index] <- Index should store Price", k: [/(<-|\u2190|store(s)?|be)\s*price\s*$/i], n: "Index is only the position. The value to store is Price." }
          ]);
          return {
            prompt: "Find the error in this pseudocode.\n" + v.p,
            answers: [v.a], keywords: v.k,
            distractors: ["The FOR loop should start at 0", "NEXT Index should be NEXT Names", "INPUT should be OUTPUT", "The array needs to be declared as REAL", "Nothing is wrong"],
            note: v.n
          };
        }
      }),
      fill({
        id: "m1b-err-divide", category: "m1b-errors",
        randomize: function () {
          var v = pick([["Sum", "Items"], ["Total", "Count"], ["Points", "Games"]]);
          return {
            prompt: "Find the error in this pseudocode.\n// average = total divided by how many\nAverage <- " + v[1] + " / " + v[0],
            answers: ["It should be " + v[0] + " / " + v[1]],
            keywords: [new RegExp(v[0] + "\\s*\\/\\s*" + v[1], "i")],
            distractors: ["/ should be DIV", "/ should be *", "Average should be an INTEGER", v[1] + " should be 1", "Nothing is wrong"],
            note: "The average is the total divided by how many values there are: " + v[0] + " / " + v[1] + ". The division is the wrong way round."
          };
        }
      }),
      fill({
        id: "m1b-err-bound", category: "m1b-errors",
        randomize: function () {
          var n = randInt(5, 25), wrong = n + pick([1, -1, 10]);
          return {
            prompt: "Find the error in this pseudocode.\n// input " + n + " values\nFOR Count <- 1 TO " + wrong + "\n   INPUT Values[Count]\nNEXT Count",
            answers: ["The loop should end at " + n + ", not " + wrong],
            keywords: [new RegExp("(^|\\D)" + n + "(\\D|$)")],
            distractors: ["The loop should start at 0", "INPUT should be OUTPUT", "NEXT Count should be ENDFOR", "Values should not have [Count]", "Nothing is wrong"],
            note: n + " values need exactly " + n + " passes: FOR Count <- 1 TO " + n + "."
          };
        }
      }),
      // ---------------- validation loops
      fill({
        id: "m1b-val-while", category: "m1b-valid",
        randomize: function () {
          var name = pick(["Mark", "Age", "Speed", "Score", "Time"]), lo = randInt(0, 20), hi = lo + randInt(10, 90) * 5;
          var ans = "WHILE " + name + " < " + lo + " OR " + name + " > " + hi + " DO";
          return {
            prompt: "Only values from " + lo + " to " + hi + " (inclusive) are allowed. Which line starts a loop that keeps asking while " + name + " is NOT valid?",
            answers: [ans],
            keywords: [new RegExp("^\\s*while\\s+" + name + "\\s*<\\s*" + lo + "\\s+or\\s+" + name + "\\s*>\\s*" + hi + "(\\s+do)?\\s*$", "i")],
            distractors: [
              "WHILE " + name + " < " + lo + " AND " + name + " > " + hi + " DO",
              "WHILE " + name + " >= " + lo + " AND " + name + " <= " + hi + " DO",
              "WHILE " + name + " <= " + lo + " OR " + name + " >= " + hi + " DO",
              "WHILE " + name + " > " + lo + " OR " + name + " < " + hi + " DO",
              "IF " + name + " < " + lo + " OR " + name + " > " + hi
            ],
            note: "Describe the INVALID values and join them with OR: too small OR too big. AND could never be TRUE, because a number cannot be below " + lo + " and above " + hi + " at the same time."
          };
        }
      }),
      fill({
        id: "m1b-val-until", category: "m1b-valid",
        randomize: function () {
          var name = pick(["Mark", "Age", "Level"]), lo = randInt(1, 10), hi = lo + randInt(5, 50);
          var ans = "UNTIL " + name + " >= " + lo + " AND " + name + " <= " + hi;
          return {
            prompt: "REPEAT\n   OUTPUT \"Enter a value from " + lo + " to " + hi + " \"\n   INPUT " + name + "\n????\n\nWhich line finishes this validation loop?",
            answers: [ans],
            keywords: [new RegExp("^\\s*until\\s+" + name + "\\s*>=\\s*" + lo + "\\s+and\\s+" + name + "\\s*<=\\s*" + hi + "\\s*$", "i")],
            distractors: [
              "UNTIL " + name + " < " + lo + " OR " + name + " > " + hi,
              "UNTIL " + name + " >= " + lo + " OR " + name + " <= " + hi,
              "UNTIL " + name + " > " + lo + " AND " + name + " < " + hi,
              "ENDWHILE",
              "NEXT " + name
            ],
            note: "UNTIL describes the VALID value (stop once it is valid), so it is the opposite of the WHILE version: >= " + lo + " AND <= " + hi + "."
          };
        }
      }),
      fill({
        id: "m1b-val-neg", category: "m1b-valid",
        randomize: function () {
          var name = pick(["Size", "Length", "Weight", "Amount"]);
          var ans = "WHILE " + name + " < 0 DO";
          return {
            prompt: "Which line starts a loop that rejects negative values of " + name + "?",
            answers: [ans], keywords: [new RegExp("^\\s*while\\s+" + name + "\\s*<\\s*0(\\s+do)?\\s*$", "i")],
            distractors: ["WHILE " + name + " > 0 DO", "WHILE " + name + " >= 0 DO", "WHILE " + name + " = 0 DO", "IF " + name + " < 0", "UNTIL " + name + " < 0"],
            note: "A negative number is less than 0, so keep asking WHILE " + name + " < 0."
          };
        }
      }),
      {
        id: "m1b-val-where", category: "m1b-valid",
        prompt: "Where should a validation loop for an input go?",
        answers: ["Straight after the INPUT it is checking"],
        keywords: [{ required: [["after"]], excluded: ["before", "end"] }],
        distractors: ["Before the value is input", "At the end of the program", "Inside the IF statement that uses the value", "Once the value has been stored in the array", "Anywhere, it does not matter"],
        note: "Check the value as soon as it has been input, before it is used or stored."
      },
      {
        id: "m1b-val-inside", category: "m1b-valid",
        prompt: "What should happen inside a validation loop?",
        answers: ["Output an error message and input the value again"],
        keywords: [{ required: [["input", "enter", "ask", "reinput", "re"], ["again", "reinput", "re"]] }],
        distractors: ["Add the value to the total", "Output the value and stop the program", "Increase the counter by 1", "Sort the array", "Store the value in the array"],
        note: "Tell the user what went wrong, then INPUT the value again, so the loop condition can change."
      },
      {
        id: "m1b-val-range", category: "m1b-valid",
        prompt: "Checking that a time is from 1 to 3600 seconds is which type of validation check?",
        answers: ["Range check"], keywords: [{ required: [["range"]] }],
        distractors: ["Length check", "Presence check", "Type check", "Format check", "Check digit"],
        note: "A range check tests that a number is between two limits."
      },
      {
        id: "m1b-val-problem", category: "m1b-valid",
        prompt: "A program uses FOR Index <- 1 TO 250 to input every runner who finishes a race. What problem could this cause?",
        answers: ["It cannot stop early if fewer than 250 runners finish"],
        keywords: [{ required: [["fewer", "less", "early", "stop", "exactly", "always"]] }],
        distractors: ["It will crash after 10 runners", "It can only store numbers", "The loop runs forever", "It sorts the runners into order", "It skips the first runner"],
        note: "A count-controlled loop always runs all 250 times. A condition-controlled loop (or a way to finish early) would fix this."
      }
    ];
  })()
});
