// Year 11 Mock Test 1: Revision
// Loaded by Drills/index.html?drill=y11-mock1-revision
// Teaches the content and the answer format of every question type on the
// Year 11 Mock Test 1 paper, using only what the Year 11 lessons (7 L1 to
// 7 L7, 8.1 L1) have taught, and never the paper's own statements, data,
// code or program scenario.
DrillData.register("y11-mock1-revision", {
  title: "Year 11 Mock Test 1: Revision",
  subtitle: "Cambridge IGCSE Computer Science 0478 - every question type on the mock, and how it is marked",
  categories: [
    ["rev-format", "Exam Technique"],
    ["rev-constructs", "Statement Types"],
    ["rev-types", "Data Types and Validation"],
    ["rev-trace", "Tracing Algorithms"],
    ["rev-errors", "Finding and Correcting Errors"],
    ["rev-program", "Writing a Program"]
  ],
  cards: (function () {
    var A = "\u2190";
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var WORDS = ["selection", "iteration", "output", "counting", "totalling"];
    var TYPES = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    var TYPE_KEYS = { INTEGER: [["integer", "int"]], REAL: [["real"]], CHAR: [["char", "character"]], STRING: [["string", "str"]], BOOLEAN: [["boolean", "bool"]] };
    function numbered(lines) {
      return lines.map(function (l, i) { return (i + 1 < 10 ? "0" : "") + (i + 1) + " " + l; }).join("\n");
    }

    // ---- statement types: never the paper's own three statements ----
    var STATEMENTS = [
      ["IF Age >= 18", "selection"], ["CASE OF Choice", "selection"], ["IF Guess = Secret", "selection"],
      ["FOR Index " + A + " 1 TO 10", "iteration"], ["WHILE Guess <> Secret DO", "iteration"], ["REPEAT", "iteration"],
      ["OUTPUT \"Well done\"", "output"], ["OUTPUT Score", "output"], ["OUTPUT Total", "output"],
      ["Passes " + A + " Passes + 1", "counting"], ["Laps " + A + " Laps + 1", "counting"], ["Absences " + A + " Absences + 1", "counting"],
      ["Total " + A + " Total + Price", "totalling"], ["Sum " + A + " Sum + Mark", "totalling"], ["Distance " + A + " Distance + Leg", "totalling"]
    ];

    // ---- data types: never the paper's own examples ----
    var DATA = [
      ["a customer's first name", "STRING", "A name is several characters."],
      ["a postcode such as CB2 1TN", "STRING", "Letters, digits and a space together are a string."],
      ["whether a library book is on loan", "BOOLEAN", "Only two possible values: TRUE or FALSE."],
      ["whether a door is locked", "BOOLEAN", "Locked or not: TRUE or FALSE."],
      ["the number of goals scored in a match", "INTEGER", "A whole number."],
      ["the number of pupils in a class", "INTEGER", "You cannot have part of a pupil, so it is a whole number."],
      ["the price of a sandwich, such as 3.75", "REAL", "A number with a fractional part."],
      ["a temperature such as 21.5", "REAL", "A number with a fractional part."],
      ["a grade letter such as B", "CHAR", "Exactly one character."],
      ["the answer to a Y/N question, such as Y", "CHAR", "Exactly one character."]
    ];

    // ---- error cards: one planted error in an algorithm unlike the paper's ----
    var CORRECT = [
      "DECLARE Mark : INTEGER",
      "DECLARE Sum : INTEGER",
      "DECLARE Entries : INTEGER",
      "DECLARE Mean : REAL",
      "Sum " + A + " 0",
      "Entries " + A + " 0",
      "OUTPUT \"Enter a mark, or 0 to finish \"",
      "INPUT Mark",
      "WHILE Mark <> 0 DO",
      "   Sum " + A + " Sum + Mark",
      "   Entries " + A + " Entries + 1",
      "   INPUT Mark",
      "ENDWHILE",
      "Mean " + A + " Sum / Entries",
      "OUTPUT \"The mean mark is \", Mean"
    ];
    var ERRORS = [
      { line: 4, wrong: "DECLARE Mean : INTEGER", fix: "DECLARE Mean : REAL", why: "a mean can have a fractional part",
        re: /\breal\b/i, wrongOpts: ["DECLARE Mean : STRING", "DECLARE Mean : BOOLEAN", "DECLARE Mean : CHAR"] },
      { line: 9, wrong: "WHILE Mark = 0 DO", fix: "WHILE Mark <> 0 DO", why: "the loop must keep going until 0 is entered",
        re: /mark\s*<>\s*0/i, wrongOpts: ["WHILE Mark > 0 AND Mark = 0 DO", "WHILE Mark = 1 DO", "REPEAT Mark = 0"] },
      { line: 10, wrong: "   Sum " + A + " Sum + 1", fix: "   Sum " + A + " Sum + Mark", why: "totalling adds the mark, not 1",
        re: new RegExp("sum" + ARROW + "sum\\s*\\+\\s*mark", "i"), wrongOpts: ["Sum " + A + " Mark", "Sum " + A + " Sum + Entries", "Sum " + A + " Sum - Mark"] },
      { line: 11, wrong: "   Entries " + A + " Entries - 1", fix: "   Entries " + A + " Entries + 1", why: "counting adds 1 for each mark",
        re: new RegExp("entries" + ARROW + "entries\\s*\\+\\s*1\\b", "i"), wrongOpts: ["Entries " + A + " 1", "Entries " + A + " Entries + Mark", "Entries " + A + " 0"] },
      { line: 12, wrong: "   OUTPUT Mark", fix: "   INPUT Mark", why: "without a new INPUT the loop never ends",
        re: /^\s*input\s+mark\s*$/i, wrongOpts: ["OUTPUT \"Enter a mark\"", "Mark " + A + " 0", "INPUT Sum"] },
      { line: 14, wrong: "Mean " + A + " Entries / Sum", fix: "Mean " + A + " Sum / Entries", why: "the mean is the total divided by how many",
        re: new RegExp("mean" + ARROW + "sum\\s*/\\s*entries", "i"), wrongOpts: ["Mean " + A + " Sum * Entries", "Mean " + A + " Sum - Entries", "Mean " + A + " Entries"] }
    ];
    function buggy(err) {
      var lines = CORRECT.slice();
      lines[err.line - 1] = err.wrong;
      return numbered(lines);
    }

    // ---- trace cards: REPEAT with a boundary value, never the paper's data ----
    function traceSetup() {
      var limit = drillPick([20, 25, 30, 40]), n = drillRange(5, 7);
      var values = [];
      for (var i = 0; i < n + 2; i++) values.push(limit + drillPick([-12, -7, -3, 4, 8, 15]));
      values[drillRange(0, n - 1)] = limit;
      var above = 0, rest = 0;
      for (var j = 0; j < n; j++) { if (values[j] > limit) above++; else rest++; }
      var code = ["Hot " + A + " 0", "Other " + A + " 0", "Count " + A + " 0", "REPEAT", "   INPUT Temp", "   IF Temp > " + limit,
        "     THEN", "       Hot " + A + " Hot + 1", "     ELSE", "       Other " + A + " Other + 1", "   ENDIF",
        "   Count " + A + " Count + 1", "UNTIL Count = " + n, "OUTPUT Hot, \" hot days\""].join("\n");
      return { limit: limit, n: n, values: values, above: above, rest: rest, code: code };
    }

    function streak(days) {
      var run = 0, best = 0;
      days.forEach(function (d) { if (d === 0) { run++; if (run > best) best = run; } else run = 0; });
      return best;
    }

    var cards = [
      // ================= exam technique
      { id: "f-tick", category: "rev-format",
        prompt: "A question says Tick one box. You tick the right answer and also one wrong answer. How many marks do you get?",
        answers: ["0"], keywords: [/^\s*(0|zero|none|no marks?)\s*$/i], distractors: ["1", "Half a mark", "2"],
        note: "Ticking two boxes when one is asked for gets no mark, even if one of them is right." },
      { id: "f-wordbank", category: "rev-format",
        prompt: "A word bank has 5 words. You label 3 statements and each word is used once at most. How many words are left unused?",
        answers: ["2"], keywords: [/^\s*(2|two)(\s+words?)?\s*$/i], distractors: ["0", "3", "5"],
        note: "Word banks include extra words on purpose, so you cannot get the last one by elimination." },
      { id: "f-errors", category: "rev-format",
        prompt: "In a question that asks you to identify errors and suggest corrections, what two things must you give for each error to earn the mark?",
        answers: ["The line number and the correction"],
        keywords: [[["line", "lines"], ["correction", "corrected", "correct", "fix", "fixed", "should"]]],
        distractors: ["The line number only", "The variable names used", "Why the program was written"],
        note: "Both are needed for each mark: the line number, and what the line should be." },
      { id: "f-trace-new", category: "rev-format",
        prompt: "When filling in a trace table, when do you write a new value in a variable's column?",
        answers: ["Only when its value changes"], keywords: [/chang|updat|new value|assign/i],
        distractors: ["On every row", "Only at the end", "Only for OUTPUT"],
        note: "Write a value when the variable is given one; leave the column blank on rows where it does not change." },
      { id: "f-trace-unused", category: "rev-format",
        prompt: "A trace table question gives 10 input values, but the loop stops after reading 8 of them. What happens to the last 2 values?",
        answers: ["Nothing: they are never read"], keywords: [/never|not\s+(read|used|input)|ignore|unused|nothing|left over/i],
        distractors: ["They are read after the loop", "They replace the first two", "They are added to the total"],
        note: "Only trace inputs the algorithm actually reads. Extra values are there to test that you stop at the right time." },
      { id: "f-comment", category: "rev-format",
        prompt: "The 15-mark program must include comments. Which symbol starts a comment in pseudocode?",
        answers: ["//"], keywords: [/\/\//], distractors: ["#", "--", "**"],
        note: "// starts a comment: // count the days with no sales" },
      { id: "f-declare", category: "rev-format",
        prompt: "The question says all arrays and variables used must be declared. Which keyword begins every declaration?",
        answers: ["DECLARE"], keywords: [/^\s*declare\s*$/i], distractors: ["INPUT", "SET", "ARRAY"],
        note: "DECLARE Total : INTEGER. Declarations earn credit in the 15-mark answer, so do not skip them." },
      { id: "f-prompt", category: "rev-format",
        prompt: "All inputs must contain suitable messages. What should come straight before every INPUT in your program?",
        answers: ["An OUTPUT with a message telling the user what to enter"], keywords: [/output|prompt|message/i],
        distractors: ["A comment", "A DECLARE", "A FOR loop"],
        note: "OUTPUT \"Enter the sales for day \", Day, then INPUT Sales[Day]." },
      { id: "f-identifiers", category: "rev-format",
        prompt: "The 15-mark program earns marks for identifier names. Which kind of name earns them?",
        answers: ["Meaningful names, such as TotalSales"], keywords: [/meaningful|descriptive|sensible|clear|explain/i],
        distractors: ["Short names, such as T", "Numbered names, such as Var1", "Names in capitals, such as X"],
        note: "TotalSales tells the examiner what it stores; T does not." },

      // ================= statement types
      { id: "c-iter-pair", category: "rev-constructs",
        prompt: "Which pair of pseudocode statements are both used for iteration?",
        answers: ["WHILE ... ENDWHILE and REPEAT ... UNTIL"],
        keywords: [{ required: [["while"], ["repeat"]], excluded: ["if", "case"] }],
        distractors: ["IF and CASE", "REPEAT ... UNTIL and IF", "CASE and WHILE ... ENDWHILE"],
        note: "Iteration statements repeat: FOR ... NEXT, WHILE ... ENDWHILE and REPEAT ... UNTIL." },
      { id: "c-sel-pair", category: "rev-constructs",
        prompt: "Which pair of pseudocode statements are both used for selection?",
        answers: ["IF and CASE"], keywords: [{ required: [["if"], ["case"]], excluded: ["for", "while", "repeat"] }],
        distractors: ["IF and WHILE", "FOR and CASE", "REPEAT and IF"],
        note: "Selection chooses a path: IF ... THEN ... ELSE ... ENDIF and CASE OF ... ENDCASE." },
      { id: "c-classify", category: "rev-constructs",
        randomize: function () {
          var s = drillPick(STATEMENTS);
          return {
            prompt: "Word bank: selection, iteration, output, counting, totalling.\nWhich word describes this statement?\n\n" + s[0],
            answers: [s[1]], keywords: [new RegExp("^\\s*" + s[1] + "\\s*$", "i")],
            distractors: WORDS.filter(function (w) { return w !== s[1]; }),
            working: ["Does it choose a path, repeat, show something, add 1, or add a value?", "Look at what the statement does, not the variable name.", "Match the statement to its job."],
            note: s[0] + " is " + s[1] + "."
          };
        } },
      { id: "c-count-total", category: "rev-constructs",
        prompt: "What is the difference between counting and totalling?",
        answers: ["Counting adds 1 each time; totalling adds a value, such as a price or a mark"],
        keywords: [[["1", "one"], ["value", "values", "amount", "price", "mark", "number", "numbers"]]],
        distractors: ["They are the same", "Counting uses FOR and totalling uses WHILE", "Totalling can only be used with arrays"],
        note: "Passes \u2190 Passes + 1 is counting. Total \u2190 Total + Price is totalling." },

      // ================= data types and validation
      { id: "t-type", category: "rev-types",
        randomize: function () {
          var d = drillPick(DATA);
          return {
            prompt: "Which data type is most appropriate for " + d[0] + "?",
            answers: [d[1]],
            keywords: [{ required: TYPE_KEYS[d[1]], excluded: TYPES.filter(function (t) { return t !== d[1]; }).map(function (t) { return t.toLowerCase(); }) }],
            distractors: TYPES.filter(function (t) { return t !== d[1]; }),
            note: d[2]
          };
        } },
      { id: "t-char-string", category: "rev-types",
        prompt: "What is the difference between CHAR and STRING?",
        answers: ["CHAR holds a single character; STRING holds any number of characters"],
        keywords: [[["single", "one", "1"], ["many", "several", "more", "multiple", "number", "sequence", "any"]]],
        distractors: ["CHAR is for numbers and STRING is for letters", "They are the same", "STRING can only hold letters"],
        note: "CHAR: exactly one character, such as 'Y'. STRING: zero or more characters, such as \"Yes please\"." },
      { id: "t-range", category: "rev-types",
        randomize: function () {
          var d = drillPick(["A mark must be from 0 to 100.", "An age must be from 11 to 18.", "A quantity must be at least 1 and at most 50.", "A temperature must be between -10 and 45 inclusive."]);
          return {
            prompt: "Which type of validation check is this?\n" + d,
            answers: ["Range check"], keywords: [/\brange\b/i],
            distractors: ["Length check", "Presence check", "Type check"],
            note: "A lower and an upper limit: a range check."
          };
        } },
      { id: "t-range-code", category: "rev-types",
        prompt: "A validation loop must reject Mark when it is outside 0 to 100. Which condition is TRUE for an invalid Mark?",
        answers: ["Mark < 0 OR Mark > 100"],
        keywords: [/^\s*(mark\s*<\s*0\s+or\s+mark\s*>\s*100|mark\s*>\s*100\s+or\s+mark\s*<\s*0)\s*$/i],
        distractors: ["Mark < 0 AND Mark > 100", "Mark >= 0 OR Mark <= 100", "Mark <= 0 OR Mark >= 100"],
        note: "Invalid means below the bottom OR above the top. It cannot be both, so AND is never TRUE." },

      // ================= tracing
      { id: "tr-hot", category: "rev-trace",
        randomize: function () {
          var s = traceSetup();
          return {
            prompt: s.code + "\n\nInput data: " + s.values.join(", ") + "\nWhat is output?",
            answers: [s.above + " hot days"], keywords: [new RegExp("^\\D*" + s.above + "(\\s*hot(\\s*days?)?)?\\s*$", "i")],
            distractors: drillWrongNumbers(s.above, [s.above + 1, s.rest, s.n, s.above + 2].filter(function (v) { return v >= 0; }), 3).map(function (v) { return v + " hot days"; }),
            working: ["Read inputs one at a time until Count reaches " + s.n + ". Add to Hot only when Temp is more than " + s.limit + ".", "A value equal to " + s.limit + " is not more than it.", "Stop when Count reaches the UNTIL value."],
            note: "Only the first " + s.n + " inputs are read. " + s.limit + " itself is not more than " + s.limit + ", so it counts as Other."
          };
        } },
      { id: "tr-other", category: "rev-trace",
        randomize: function () {
          var s = traceSetup();
          return {
            prompt: s.code + "\n\nInput data: " + s.values.join(", ") + "\nWhat is the final value of Other?",
            answers: [String(s.rest)], keywords: [drillNumberRe(s.rest, "other")],
            distractors: drillWrongNumbers(s.rest, [s.rest + 1, s.above, s.rest + 2, s.rest - 1].filter(function (v) { return v >= 0; }), 3),
            working: ["Other goes up for every input that is not more than " + s.limit + ", including " + s.limit + " itself.", "Only the first " + s.n + " inputs are read.", "Check each input read against the condition."],
            note: "Count the inputs up to " + s.limit + " inclusive, among the first " + s.n + "."
          };
        } },
      { id: "tr-count", category: "rev-trace",
        randomize: function () {
          var s = traceSetup();
          return {
            prompt: s.code + "\n\nInput data: " + s.values.join(", ") + "\nHow many of the input values are read?",
            answers: [String(s.n)], keywords: [drillNumberRe(s.n)],
            distractors: drillWrongNumbers(s.n, [s.values.length, s.n + 1, s.n - 1], 3),
            note: "The loop stops when Count = " + s.n + ", so the other values are never read."
          };
        } },
      { id: "tr-while", category: "rev-trace",
        randomize: function () {
          var vals = [drillRange(2, 9), drillRange(2, 9), drillRange(2, 9), drillRange(2, 9)].slice(0, drillRange(2, 4));
          var total = vals.reduce(function (a, b) { return a + b; }, 0);
          var input = vals.concat([-1, drillRange(2, 9)]);
          return {
            prompt: "Total " + A + " 0\nINPUT Number\nWHILE Number <> -1 DO\n   Total " + A + " Total + Number\n   INPUT Number\nENDWHILE\nOUTPUT Total\n\nInput data: " + input.join(", ") + "\nWhat is output?",
            answers: [String(total)], keywords: [drillNumberRe(total, "total")],
            distractors: drillWrongNumbers(total, [total - 1, total + input[input.length - 1], total + 1, vals.length], 3),
            working: ["Add each number to Total until -1 is input. -1 is not added, and nothing after it is read.", "The loop checks for -1 before adding.", "Stop at the -1."],
            note: "-1 stops the loop before it is added, and the value after it is never read."
          };
        } },

      // ================= finding and correcting errors
      { id: "e-line", category: "rev-errors",
        randomize: function () {
          var err = drillPick(ERRORS);
          return {
            prompt: "This algorithm should total marks until 0 is input, then output the mean mark. One line contains an error.\n\n" + buggy(err) + "\n\nGive the line number of the error.",
            answers: [String(err.line)], keywords: [new RegExp("^\\D*0?" + err.line + "\\D*$")],
            distractors: drillWrongNumbers(err.line, ERRORS.map(function (e) { return e.line; }).concat([1, 7]), 3),
            working: ["Check each line does its job: declarations, the stopping condition, totalling, counting, reading the next input, then the mean.", "Ask what each variable should hold at the end.", "Read the algorithm line by line."],
            note: "Line " + err.line + " should be: " + err.fix.trim() + " (" + err.why + ")."
          };
        } },
      { id: "e-fix", category: "rev-errors",
        randomize: function () {
          var err = drillPick(ERRORS);
          return {
            prompt: "This algorithm should total marks until 0 is input, then output the mean mark.\n\n" + buggy(err) + "\n\nLine " + err.line + " contains an error. Write the corrected line.",
            answers: [err.fix.trim()], keywords: [err.re], distractors: err.wrongOpts,
            note: "Because " + err.why + "."
          };
        } },

      // ================= writing a program (a different scenario from the paper)
      { id: "p-declare", category: "rev-program",
        prompt: "A shop records the number of items sold each day for 30 days. Which line declares an array to store them?",
        answers: ["DECLARE Sales : ARRAY[1:30] OF INTEGER"],
        keywords: [/^\s*declare\s+sales\s*:\s*array\s*\[\s*1\s*:\s*30\s*\]\s*of\s+integer\s*$/i],
        distractors: ["DECLARE Sales : INTEGER", "DECLARE Sales : ARRAY[1:30] OF STRING", "DECLARE Sales : ARRAY[1:7] OF INTEGER"],
        note: "One element per day, whole numbers of items: ARRAY[1:30] OF INTEGER." },
      { id: "p-init", category: "rev-program",
        prompt: "Which code sets every element of Sales[1:30] to zero?",
        answers: ["FOR Day " + A + " 1 TO 30  Sales[Day] " + A + " 0  NEXT Day"],
        keywords: [new RegExp("for\\s+(\\w+)" + ARROW + "1\\s+to\\s+30.*sales\\s*\\[\\s*\\1\\s*\\]" + ARROW + "0\\b.*next", "i")],
        distractors: ["Sales " + A + " 0", "Sales[30] " + A + " 0", "FOR Day " + A + " 1 TO 30  Sales[Day] " + A + " Day  NEXT Day"],
        note: "A FOR loop visits every index, setting each element in turn." },
      { id: "p-input", category: "rev-program",
        prompt: "Inside FOR Day " + A + " 1 TO 30, which line stores that day's sales figure in the array?",
        answers: ["INPUT Sales[Day]"], keywords: [/^\s*input\s+sales\s*\[\s*day\s*\]\s*$/i],
        distractors: ["INPUT Sales", "OUTPUT Sales[Day]", "Sales[Day] " + A + " Day"],
        note: "The loop variable picks the element: INPUT Sales[Day], after an OUTPUT prompt." },
      { id: "p-total", category: "rev-program",
        prompt: "Inside the loop, which line adds that day's sales to TotalSales?",
        answers: ["TotalSales " + A + " TotalSales + Sales[Day]"],
        keywords: [new RegExp("^\\s*totalsales" + ARROW + "totalsales\\s*\\+\\s*sales\\s*\\[\\s*day\\s*\\]\\s*$", "i")],
        distractors: ["TotalSales " + A + " TotalSales + 1", "TotalSales " + A + " Sales[Day]", "TotalSales " + A + " TotalSales + Day"],
        note: "Totalling: add the value stored for this day. TotalSales must be set to 0 before the loop." },
      { id: "p-count", category: "rev-program",
        prompt: "Inside the loop, which code counts the days with no sales?",
        answers: ["IF Sales[Day] = 0 THEN NoSaleDays " + A + " NoSaleDays + 1 ENDIF"],
        keywords: [new RegExp("if\\s+sales\\s*\\[\\s*day\\s*\\]\\s*=\\s*0\\b.*nosaledays" + ARROW + "nosaledays\\s*\\+\\s*1", "i")],
        distractors: ["NoSaleDays " + A + " NoSaleDays + 1", "IF Sales[Day] = 0 THEN NoSaleDays " + A + " 0 ENDIF", "IF Sales[Day] > 0 THEN NoSaleDays " + A + " NoSaleDays + 1 ENDIF"],
        note: "Counting inside selection: add 1 only on the days that match." },
      { id: "p-mean", category: "rev-program",
        randomize: function () {
          var mean = drillRange(3, 12), total = mean * 30;
          return {
            prompt: "After 30 days TotalSales is " + total + ". Which expression gives the mean daily sales, and what is its value?",
            answers: ["TotalSales / 30 = " + mean],
            keywords: [new RegExp("totalsales\\s*/\\s*30\\D*" + mean + "\\s*$|^\\s*" + mean + "\\s*$", "i")],
            distractors: ["30 / TotalSales", "TotalSales * 30", "TotalSales - 30"],
            working: ["The mean is the total divided by how many days.", "Divide the total by the number of days.", "Total divided by count."],
            note: "Mean = total / number of values: " + total + " / 30 = " + mean + "."
          };
        } },
      { id: "p-units", category: "rev-program",
        prompt: "A distance is totalled in metres in TotalMetres. Which expression converts it to kilometres (1 kilometre = 1000 metres)?",
        answers: ["TotalMetres / 1000"], keywords: [/^\s*totalmetres\s*\/\s*1000\s*$/i],
        distractors: ["TotalMetres * 1000", "1000 / TotalMetres", "TotalMetres - 1000"],
        note: "Bigger units mean a smaller number, so divide." },
      { id: "p-streak", category: "rev-program",
        randomize: function () {
          var days = [];
          for (var i = 0; i < 12; i++) days.push(drillPick([0, 0, 3, 5, 8, 12]));
          var best = streak(days);
          return {
            prompt: "Sales for 12 days: " + days.join(", ") + "\nWhat is the longest run of consecutive days with no sales?",
            answers: [String(best)], keywords: [drillNumberRe(best)],
            distractors: drillWrongNumbers(best, [best + 1, best - 1, days.filter(function (d) { return d === 0; }).length, best + 2].filter(function (v) { return v >= 0; }), 3),
            working: ["Go through the days in order. Each zero makes the current run one longer; any other number ends the run.", "Keep the biggest run you have seen so far.", "Look for zeros next to each other."],
            note: "Consecutive means next to each other. A day with sales starts the count again."
          };
        } },
      { id: "p-run-reset", category: "rev-program",
        prompt: "A program keeps CurrentRun (dry days in a row so far). On a day that does have sales, what should happen to CurrentRun?",
        answers: ["It is set back to 0"], keywords: [/\b0\b|zero|reset/i],
        distractors: ["It goes up by 1", "It stays the same", "It is set to LongestRun"],
        note: "A day with sales breaks the run: CurrentRun \u2190 0." },
      { id: "p-run-longest", category: "rev-program",
        prompt: "When should LongestRun be changed?",
        answers: ["When CurrentRun is greater than LongestRun"],
        keywords: [/current\s*run\s*(>|is\s+(greater|bigger|more|larger|higher)\s+than)\s*(the\s+)?longest\s*run|(greater|bigger|more|larger|higher)\s+than\s+(the\s+)?longest/i],
        distractors: ["Every day", "Only when CurrentRun is 0", "Only once, at the start"],
        note: "IF CurrentRun > LongestRun THEN LongestRun \u2190 CurrentRun ENDIF" },
      { id: "p-warning", category: "rev-program",
        prompt: "The program must output a warning if NoSaleDays is 10 or more. Which line starts that check?",
        answers: ["IF NoSaleDays >= 10"], keywords: [/^\s*if\s+nosaledays\s*>=\s*10(\s+then)?\s*$/i],
        distractors: ["IF NoSaleDays > 10", "IF NoSaleDays = 10", "WHILE NoSaleDays >= 10"],
        note: "10 or more means >= 10. > 10 would miss exactly 10." },
      { id: "p-order", category: "rev-program",
        prompt: "In a 15-mark program: calculate, declare, output results, input data. Which of these comes first?",
        answers: ["Declare"], keywords: [/^\s*(the\s+)?declar(e|ations?|ing)\s*$/i],
        distractors: ["Input data", "Calculate", "Output results"],
        note: "Declare, initialise, input, calculate, output: the order the program runs in." }
    ];
    return cards;
  })()
});
