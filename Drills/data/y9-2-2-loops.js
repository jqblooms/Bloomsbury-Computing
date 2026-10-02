// Year 9, 2.2: Loops and Combined Constructs (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-2-2-loops
// Count-controlled loops in Cambridge pseudocode, using only what Year 9 has
// met: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT and
// IF ... THEN ... ELSE ... ENDIF (no STEP, MOD, DIV, WHILE or REPEAT).
// Every card shows its whole program, so it can be answered typed, from the
// card alone. Help never gives the card's own answer: `example` is a
// similar program worked through, `working` two shorter nudges.
DrillData.register("y9-2-2-loops", {
  title: "Year 9, 2.2: Loops and Combined Constructs",
  subtitle: "Count-controlled loops, and decisions inside loops, in Cambridge pseudocode",
  // Races show buttons for every card (James 2026-10-02: Year 9 found the typed race answers too hard).
  choiceOnly: true,
  categories: [
    ["loops-count", "How Many Times?"],
    ["loops-predict", "Predict the Output"],
    ["loops-decide", "Decisions Inside Loops"],
    ["loops-write", "Writing Loops"]
  ],
  cards: (function () {
    var A = "\u2190";
    var ARROW = "\\s*(<-|\u2190)\\s*";
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v >= 0 && v !== n; }), 3); }

    return [
      // ================= how many times?
      { id: "count-body", category: "loops-count",
        randomize: function () {
          var a = drillRange(1, 1), n = drillRange(4, 9), b = a + n - 1;
          return {
            prompt: code("DECLARE Count : INTEGER", "FOR Count " + A + " " + a + " TO " + b, "    OUTPUT \"Jump!\"", "NEXT Count") + "\n\nHow many times does this loop run?",
            answers: [String(n)], keywords: [drillNumberRe(n, "times?")],
            distractors: others(n, [n - 1, n + 1, b + 1]),
            example: "A similar loop: FOR Count " + A + " 1 TO 6\nCount takes the values 1, 2, 3, 4, 5, 6.\nThat is 6 values, so the loop runs 6 times. Starting at 1 and ending at 6 means 6 passes.",
            working: ["List the values Count takes, from the first number to the last.", "Starting at 1, the last number is the number of passes."],
            note: "FOR Count " + A + " 1 TO " + b + " runs " + n + " times."
          };
        } },
      { id: "count-body-start", category: "loops-count",
        randomize: function () {
          var a = drillRange(3, 7), n = drillRange(4, 8), b = a + n - 1;
          return {
            prompt: code("DECLARE Count : INTEGER", "FOR Count " + A + " " + a + " TO " + b, "    OUTPUT Count", "NEXT Count") + "\n\nHow many times does this loop run?",
            answers: [String(n)], keywords: [drillNumberRe(n, "times?")],
            distractors: others(n, [n - 1, b - a, b, n + 1]),
            example: "A similar loop: FOR Count " + A + " 5 TO 8\nCount takes the values 5, 6, 7, 8.\nThat is 4 values: 8 - 5 = 3, then add 1 because both 5 and 8 are included.\nThe loop runs 4 times.",
            working: ["Last value - first value, then add 1: both ends are included.", "Write out the values of Count and count them."],
            note: "From " + a + " to " + b + ": " + b + " - " + a + " + 1 = " + n + " times."
          };
        } },
      { id: "count-lines", category: "loops-count",
        randomize: function () {
          var n = drillRange(3, 7), total = n + 2;
          return {
            prompt: code("DECLARE Count : INTEGER", "OUTPUT \"Ready\"", "FOR Count " + A + " 1 TO " + n, "    OUTPUT \"Coin\"", "NEXT Count", "OUTPUT \"Done\"") + "\n\nHow many lines of output does this program produce altogether?",
            answers: [String(total)], keywords: [drillNumberRe(total, "lines?")],
            distractors: others(total, [n, n + 1, total + 1]),
            example: "A similar program: OUTPUT \"Start\", then a loop from 1 TO 3 containing OUTPUT \"Beep\", then OUTPUT \"End\".\nStart is output once (before the loop).\nBeep is output 3 times (inside the loop).\nEnd is output once (after the loop).\n1 + 3 + 1 = 5 lines.",
            working: ["Only the lines between FOR and NEXT repeat.", "Add the output before the loop and the output after it."],
            note: "1 line before the loop + " + n + " inside it + 1 after it = " + total + "."
          };
        } },
      { id: "count-last", category: "loops-count",
        randomize: function () {
          var a = drillRange(1, 4), b = a + drillRange(4, 9);
          return {
            prompt: code("DECLARE Number : INTEGER", "FOR Number " + A + " " + a + " TO " + b, "    OUTPUT Number", "NEXT Number") + "\n\nWhat is the LAST value this program outputs?",
            answers: [String(b)], keywords: [drillNumberRe(b)],
            distractors: others(b, [b - 1, b + 1, a]),
            example: "A similar loop: FOR Number " + A + " 2 TO 9 with OUTPUT Number inside.\nNumber goes 2, 3, 4 ... and the last pass is when Number is 9.\nSo the last value output is 9. The loop stops after the TO value, never beyond it.",
            working: ["The last pass happens when the counter equals the TO value.", "The counter never goes past the number after TO."],
            note: "The last pass is Number = " + b + "."
          };
        } },

      // ================= predict the output
      { id: "total-constant", category: "loops-predict",
        randomize: function () {
          var s = drillRange(0, 5), n = drillRange(3, 6), k = drillRange(2, 5), t = s + n * k;
          return {
            prompt: code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " " + s, "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total + " + k, "NEXT Count", "OUTPUT Total") + "\n\nWhat does this program output?",
            answers: [String(t)], keywords: [drillNumberRe(t, "total")],
            distractors: others(t, [n * k, t + k, t - k, s + k]),
            example: "A similar program: Total starts at 1, then a loop from 1 TO 3 adds 4 each time.\nPass 1: Total = 1 + 4 = 5\nPass 2: Total = 5 + 4 = 9\nPass 3: Total = 9 + 4 = 13\nOUTPUT 13. Remember the starting value.",
            working: ["Trace Total pass by pass, starting from its first value.", "Add the same amount on every pass of the loop."],
            note: s + " + " + n + " \u00d7 " + k + " = " + t + "."
          };
        } },
      { id: "total-counter", category: "loops-predict",
        randomize: function () {
          var a = drillRange(1, 4), n = drillRange(3, 5), b = a + n - 1, t = 0;
          for (var c = a; c <= b; c++) t += c;
          return {
            prompt: code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " " + a + " TO " + b, "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total") + "\n\nWhat does this program output?",
            answers: [String(t)], keywords: [drillNumberRe(t, "total")],
            distractors: others(t, [t - b, t + b + 1, n, b]),
            example: "A similar program: Total starts at 0, then FOR Count " + A + " 2 TO 4 adds Count each time.\nCount = 2: Total = 0 + 2 = 2\nCount = 3: Total = 2 + 3 = 5\nCount = 4: Total = 5 + 4 = 9\nOUTPUT 9. The amount added changes because Count changes.",
            working: ["Each pass adds the value of Count itself.", "Keep a column for Count and a column for Total."],
            note: "Add every value of Count from " + a + " to " + b + ": " + t + "."
          };
        } },
      { id: "last-output", category: "loops-predict",
        randomize: function () {
          var n = drillRange(3, 6), k = drillRange(2, 6), last = n * k;
          return {
            prompt: code("DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    OUTPUT Count * " + k, "NEXT Count") + "\n\nWhat is the LAST number this program outputs?",
            answers: [String(last)], keywords: [drillNumberRe(last)],
            distractors: others(last, [(n - 1) * k, n + k, last + k]),
            example: "A similar program: FOR Count " + A + " 1 TO 5 with OUTPUT Count * 3 inside.\nIt outputs 3, 6, 9, 12, 15.\nThe last pass is Count = 5, so the last output is 5 \u00d7 3 = 15.",
            working: ["Find the value of Count on the last pass.", "Work out the expression for that value of Count."],
            note: "Last pass: Count = " + n + ", so " + n + " \u00d7 " + k + " = " + last + "."
          };
        } },
      { id: "double", category: "loops-predict",
        randomize: function () {
          var s = drillPick([1, 2, 3]), n = drillRange(3, 5), v = s;
          for (var i = 0; i < n; i++) v *= 2;
          return {
            prompt: code("DECLARE Value : INTEGER", "DECLARE Count : INTEGER", "Value " + A + " " + s, "FOR Count " + A + " 1 TO " + n, "    Value " + A + " Value * 2", "NEXT Count", "OUTPUT Value") + "\n\nWhat does this program output?",
            answers: [String(v)], keywords: [drillNumberRe(v, "value")],
            distractors: others(v, [v / 2, v * 2, s * n * 2, s + n * 2]),
            example: "A similar program: Value starts at 5, then a loop from 1 TO 2 doubles it each time.\nPass 1: Value = 5 \u00d7 2 = 10\nPass 2: Value = 10 \u00d7 2 = 20\nOUTPUT 20. Each pass doubles the NEW value, not the starting one.",
            working: ["Double the value you got on the pass before.", "Trace Value pass by pass."],
            note: s + " doubled " + n + " times is " + v + "."
          };
        } },
      { id: "input-total", category: "loops-predict",
        randomize: function () {
          var vals = [drillRange(2, 9), drillRange(2, 9), drillRange(2, 9), drillRange(2, 9)], n = 3, t = vals[0] + vals[1] + vals[2];
          return {
            prompt: code("DECLARE Total : INTEGER", "DECLARE Number : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    INPUT Number", "    Total " + A + " Total + Number", "NEXT Count", "OUTPUT Total") + "\n\nThe user types " + vals.join(", ") + ". What is output?",
            answers: [String(t)], keywords: [drillNumberRe(t, "total")],
            distractors: others(t, [t + vals[3], vals[0] + vals[1], t - vals[0]]),
            example: "A similar program loops 2 times, reading a Number and adding it to Total each time.\nThe user types 6, 4, 9.\nPass 1 reads 6: Total = 6. Pass 2 reads 4: Total = 10.\nThe loop has finished, so 9 is never read. OUTPUT 10.",
            working: ["The loop reads one number per pass: how many passes are there?", "Numbers typed after the last pass are never read."],
            note: "Only the first " + n + " numbers are read: " + t + "."
          };
        } },

      // ================= decisions inside loops
      { id: "count-if-greater", category: "loops-decide",
        randomize: function () {
          var n = drillRange(6, 10), k = drillRange(2, n - 2), c = n - k;
          return {
            prompt: code("DECLARE Big : INTEGER", "DECLARE Count : INTEGER", "Big " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    IF Count > " + k + " THEN", "        Big " + A + " Big + 1", "    ENDIF", "NEXT Count", "OUTPUT Big") + "\n\nWhat does this program output?",
            answers: [String(c)], keywords: [drillNumberRe(c, "big")],
            distractors: others(c, [c + 1, k, n]),
            example: "A similar program loops from 1 TO 6 and adds 1 to Big when Count > 4.\nCount 1, 2, 3, 4: not more than 4, so Big stays 0.\nCount 5: yes, Big = 1. Count 6: yes, Big = 2.\nOUTPUT 2. The loop runs 6 times, but Big only goes up when the IF is TRUE.",
            working: ["Check the IF condition for every value of Count.", "Equal to the number is NOT more than it."],
            note: "Only Count = " + (k + 1) + " to " + n + " are more than " + k + ": " + c + " values."
          };
        } },
      { id: "count-if-lesseq", category: "loops-decide",
        randomize: function () {
          var n = drillRange(6, 10), k = drillRange(2, n - 2);
          return {
            prompt: code("DECLARE Small : INTEGER", "DECLARE Count : INTEGER", "Small " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    IF Count <= " + k + " THEN", "        Small " + A + " Small + 1", "    ENDIF", "NEXT Count", "OUTPUT Small") + "\n\nWhat does this program output?",
            answers: [String(k)], keywords: [drillNumberRe(k, "small")],
            distractors: others(k, [k - 1, k + 1, n - k, n]),
            example: "A similar program loops from 1 TO 7 and adds 1 to Small when Count <= 3.\nCount 1, 2, 3: less than or equal to 3, so Small = 1, 2, 3.\nCount 4 to 7: no.\nOUTPUT 3. <= includes the number itself.",
            working: ["<= means less than OR equal to, so the number itself counts.", "Check the condition for every value of Count."],
            note: "Count = 1 to " + k + " pass the test: " + k + " values."
          };
        } },
      { id: "if-else", category: "loops-decide",
        randomize: function () {
          var n = drillRange(4, 7), k = drillRange(1, n - 1), a = drillRange(3, 5), b = drillRange(1, 2), s = k * a + (n - k) * b;
          return {
            prompt: code("DECLARE Score : INTEGER", "DECLARE Count : INTEGER", "Score " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    IF Count <= " + k + " THEN", "        Score " + A + " Score + " + a, "    ELSE", "        Score " + A + " Score + " + b, "    ENDIF", "NEXT Count", "OUTPUT Score") + "\n\nWhat does this program output?",
            answers: [String(s)], keywords: [drillNumberRe(s, "score")],
            distractors: others(s, [n * a, n * b, s + a - b, s - a + b]),
            example: "A similar program loops from 1 TO 4: IF Count <= 1 add 5, ELSE add 2.\nCount 1: THEN runs, Score = 5.\nCount 2, 3, 4: ELSE runs, Score = 7, 9, 11.\nOUTPUT 11. Exactly one branch runs on every pass.",
            working: ["On every pass, decide which branch runs: THEN or ELSE.", "Count how many passes take each branch, then add up."],
            note: k + " passes add " + a + " and " + (n - k) + " add " + b + ": " + s + "."
          };
        } },
      { id: "pass-count", category: "loops-decide",
        randomize: function () {
          var marks = [], passes = 0;
          for (var i = 0; i < 5; i++) { var m = drillPick([32, 41, 49, 50, 55, 63, 70, 88]); marks.push(m); if (m >= 50) passes++; }
          return {
            prompt: code("DECLARE Passes : INTEGER", "DECLARE Mark : INTEGER", "DECLARE Count : INTEGER", "Passes " + A + " 0", "FOR Count " + A + " 1 TO 5", "    INPUT Mark", "    IF Mark >= 50 THEN", "        Passes " + A + " Passes + 1", "    ENDIF", "NEXT Count", "OUTPUT Passes") + "\n\nThe user types " + marks.join(", ") + ". What is output?",
            answers: [String(passes)], keywords: [drillNumberRe(passes, "pass(es)?")],
            distractors: others(passes, [passes + 1, passes - 1, 5 - passes]),
            example: "A similar program reads 4 scores and adds 1 to Wins when Score >= 10.\nThe user types 12, 9, 10, 3.\n12 >= 10: Wins = 1. 9: no. 10 >= 10: Wins = 2 (10 counts). 3: no.\nOUTPUT 2.",
            working: [">= 50 includes 50 itself.", "Check each mark in turn against the condition."],
            note: "Marks of 50 or more: " + passes + "."
          };
        } },

      // ================= writing loops
      { id: "fill-end", category: "loops-write",
        randomize: function () {
          var a = drillRange(2, 7), n = drillRange(4, 8), b = a + n - 1;
          return {
            prompt: code("DECLARE Count : INTEGER", "FOR Count " + A + " " + a + " TO ____", "    OUTPUT Count", "NEXT Count") + "\n\nThe loop must run exactly " + n + " times, starting at " + a + ". What number goes in the gap?",
            answers: [String(b)], keywords: [drillNumberRe(b)],
            distractors: others(b, [a + n, n, b - 1]),
            example: "A similar gap: a loop must run 5 times, starting at 3.\nPass 1 is 3, pass 2 is 4, pass 3 is 5, pass 4 is 6, pass 5 is 7.\nSo the loop is FOR Count " + A + " 3 TO 7. Check: 7 - 3 + 1 = 5 passes.",
            working: ["Count the passes: pass 1 is the starting value.", "First value + number of passes - 1."],
            note: a + " + " + n + " - 1 = " + b + "."
          };
        } },
      { id: "for-line", category: "loops-write",
        randomize: function () {
          var a = drillRange(1, 5), b = a + drillRange(3, 8);
          return {
            prompt: code("DECLARE Number : INTEGER", "?????", "    OUTPUT Number", "NEXT Number") + "\n\nWrite the missing FOR line so this program outputs the numbers " + a + " to " + b + ".",
            answers: ["FOR Number " + A + " " + a + " TO " + b],
            keywords: [new RegExp("^\\s*for\\s+number" + ARROW + a + "\\s+to\\s+" + b + "\\s*$", "i")],
            distractors: ["FOR Number " + A + " " + b + " TO " + a, "FOR " + a + " TO " + b, "FOR Number " + A + " " + a + " TO " + (b + 1)],
            example: "A similar line: a loop that uses the counter Day to go from 1 to 7.\nStep 1: FOR\nStep 2: the counter variable, the same name as after NEXT: Day\nStep 3: " + A + " and the first value: " + A + " 1\nStep 4: TO and the last value: TO 7\nFOR Day " + A + " 1 TO 7",
            working: ["FOR, the counter, " + A + " and the first value, then TO and the last value.", "The counter is the variable named after NEXT."],
            note: "FOR, the counter, then first value TO last value."
          };
        } },
      { id: "declare-counter", category: "loops-write",
        prompt: code("?????", "FOR Lap " + A + " 1 TO 4", "    OUTPUT Lap", "NEXT Lap") + "\n\nEvery variable must be declared before it is used. Write the missing first line, declaring the counter Lap as a whole number.",
        answers: ["DECLARE Lap : INTEGER"], keywords: [/^\s*declare\s+lap\s*:\s*integer\s*$/i],
        distractors: ["DECLARE Lap : REAL", "Lap " + A + " 0", "DECLARE INTEGER : Lap"],
        example: "A similar line: a program uses the counter Row, which holds whole numbers.\nStep 1: DECLARE\nStep 2: the name: Row\nStep 3: a colon, then the type of data: INTEGER for whole numbers\nDECLARE Row : INTEGER",
        working: ["DECLARE, the name, a colon, then the data type.", "A counter holds whole numbers."],
        note: "A loop counter is declared as an INTEGER before the loop." },
      { id: "init-where", category: "loops-write",
        prompt: "A program adds 10 numbers together in a FOR loop, using the line Total " + A + " Total + Number inside the loop. Should the line Total " + A + " 0 go before the loop, inside the loop, or after the loop?",
        answers: ["Before the loop"], keywords: [{ required: [["before"]], excluded: ["inside", "after", "in the loop"] }],
        distractors: ["Inside the loop", "After the loop", "It is not needed"],
        example: "A similar case: counting laps with Laps " + A + " Laps + 1 inside a loop.\nIf Laps " + A + " 0 were inside the loop, it would reset the count to 0 on every pass.\nIf it were after the loop, the count would start with no value.\nSo it goes once, before the loop starts.",
        working: ["What would happen to the total if it was set to 0 on every pass?", "Setting a starting value happens once."],
        note: "Set the total to 0 once, before the loop, so it can build up." },
      { id: "output-where", category: "loops-write",
        prompt: "A program totals 10 numbers in a FOR loop and should output the final total ONCE. Should OUTPUT Total go before the loop, inside the loop, or after the loop?",
        answers: ["After the loop"], keywords: [{ required: [["after"]], excluded: ["inside", "before", "in the loop"] }],
        distractors: ["Inside the loop", "Before the loop", "Between FOR and the first line"],
        example: "A similar case: a program counts the laps run in a loop and should show the count once at the end.\nInside the loop, the OUTPUT would run on every lap.\nBefore the loop, nothing has been counted yet.\nSo it goes after NEXT, when the loop has finished.",
        working: ["Inside the loop, how many times would the OUTPUT run?", "The final total only exists when the loop has finished."],
        note: "After NEXT: the total is finished and it is output once." }
    ];
  })()
});
