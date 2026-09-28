// Year 11 Mock Test 1: Revision
// Loaded by Drills/index.html?drill=y11-mock1-revision
// Teaches the content and the answer format of every question type on the
// Year 11 Mock Test 1 paper, using only what the Year 11 lessons (7 L1 to
// 7 L7, 8.1 L1) have taught, and never the paper's own statements, data,
// code or program scenario.
//
// Support never shows a card's own answer. Every card has an `example`: a
// similar question, worked through step by step, shown at full support;
// and `working`: two shorter nudges shown as support fades.
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
    function others(list, not) { return list.filter(function (x) { return x !== not; }); }

    // ---- statement types: never the paper's own three statements ----
    var STATEMENTS = [
      ["IF Age >= 18", "selection"], ["CASE OF Choice", "selection"], ["IF Guess = Secret", "selection"],
      ["FOR Index " + A + " 1 TO 10", "iteration"], ["WHILE Guess <> Secret DO", "iteration"], ["REPEAT", "iteration"],
      ["OUTPUT \"Well done\"", "output"], ["OUTPUT Score", "output"], ["OUTPUT Total", "output"],
      ["Passes " + A + " Passes + 1", "counting"], ["Laps " + A + " Laps + 1", "counting"], ["Absences " + A + " Absences + 1", "counting"],
      ["Total " + A + " Total + Price", "totalling"], ["Sum " + A + " Sum + Mark", "totalling"], ["Distance " + A + " Distance + Leg", "totalling"]
    ];
    // A worked example for each word, used when the card is a different word.
    var STATEMENT_EXAMPLES = {
      selection: "IF Temperature > 30 checks a condition and chooses whether to run the next lines. Choosing a path is selection.",
      iteration: "FOR Row " + A + " 1 TO 5 runs the lines inside it five times. Repeating lines is iteration.",
      output: "OUTPUT \"Game over\" shows something on the screen. That is output.",
      counting: "Goals " + A + " Goals + 1 adds exactly 1 each time a goal is scored. Adding 1 each time is counting.",
      totalling: "Bill " + A + " Bill + Cost adds whatever value Cost holds. Adding a value is totalling."
    };

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
    var TYPE_EXAMPLES = {
      INTEGER: "the number of pets a person owns: always a whole number, so INTEGER.",
      REAL: "a person's height in metres, such as 1.62: it has a fractional part, so REAL.",
      CHAR: "the first letter of a surname, such as 'K': exactly one character, so CHAR.",
      STRING: "a street name such as \"High Street\": several characters, so STRING.",
      BOOLEAN: "whether a light is switched on: only TRUE or FALSE, so BOOLEAN."
    };

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
    // Each error comes with a worked example of the same kind of error in a
    // different program (a shop totalling prices until -1 is entered).
    var ERRORS = [
      { line: 4, wrong: "DECLARE Mean : INTEGER", fix: "DECLARE Mean : REAL", why: "a mean can have a fractional part",
        re: /\breal\b/i, wrongOpts: ["DECLARE Mean : STRING", "DECLARE Mean : BOOLEAN", "DECLARE Mean : CHAR"],
        example: "In a shop program, a line says DECLARE AveragePrice : INTEGER.\nStep 1: what can the average price be? 2.5 is possible.\nStep 2: an INTEGER cannot hold 2.5.\nStep 3: so the line should declare AveragePrice as a type that holds fractional numbers." },
      { line: 9, wrong: "WHILE Mark = 0 DO", fix: "WHILE Mark <> 0 DO", why: "the loop must keep going until 0 is entered",
        re: /mark\s*<>\s*0/i, wrongOpts: ["WHILE Mark > 0 AND Mark = 0 DO", "WHILE Mark = 1 DO", "REPEAT Mark = 0"],
        example: "In a shop program that should stop when -1 is entered, a line says WHILE Price = -1 DO.\nStep 1: the loop body runs while the condition is TRUE.\nStep 2: with = -1 it only runs when the user types -1, which is the stopping value.\nStep 3: it should run while Price is NOT -1, so the condition becomes Price <> -1." },
      { line: 10, wrong: "   Sum " + A + " Sum + 1", fix: "   Sum " + A + " Sum + Mark", why: "totalling adds the mark, not 1",
        re: new RegExp("sum" + ARROW + "sum\\s*\\+\\s*mark", "i"), wrongOpts: ["Sum " + A + " Mark", "Sum " + A + " Sum + Entries", "Sum " + A + " Sum - Mark"],
        example: "In a shop program, a line meant to add up prices says Bill " + A + " Bill + 1.\nStep 1: adding 1 each time is counting, not totalling.\nStep 2: the total should grow by each price entered.\nStep 3: so the line becomes Bill " + A + " Bill + Price." },
      { line: 11, wrong: "   Entries " + A + " Entries - 1", fix: "   Entries " + A + " Entries + 1", why: "counting adds 1 for each mark",
        re: new RegExp("entries" + ARROW + "entries\\s*\\+\\s*1\\b", "i"), wrongOpts: ["Entries " + A + " 1", "Entries " + A + " Entries + Mark", "Entries " + A + " 0"],
        example: "In a shop program, a line meant to count items says Items " + A + " Items - 2.\nStep 1: counting goes up by exactly one for each item.\nStep 2: - 2 makes the count go down, by the wrong amount.\nStep 3: so the line becomes Items " + A + " Items + 1." },
      { line: 12, wrong: "   OUTPUT Mark", fix: "   INPUT Mark", why: "without a new INPUT the loop never ends",
        re: /^\s*input\s+mark\s*$/i, wrongOpts: ["OUTPUT \"Enter a mark\"", "Mark " + A + " 0", "INPUT Sum"],
        example: "In a shop program, the last line inside WHILE Price <> -1 DO is OUTPUT Price.\nStep 1: the loop stops when Price becomes -1.\nStep 2: nothing inside the loop gives Price a new value, so it never changes and the loop never ends.\nStep 3: the last line must read the next price from the user: INPUT Price." },
      { line: 14, wrong: "Mean " + A + " Entries / Sum", fix: "Mean " + A + " Sum / Entries", why: "the mean is the total divided by how many",
        re: new RegExp("mean" + ARROW + "sum\\s*/\\s*entries", "i"), wrongOpts: ["Mean " + A + " Sum * Entries", "Mean " + A + " Sum - Entries", "Mean " + A + " Entries"],
        example: "In a shop program, a line says AveragePrice " + A + " Items / Bill.\nStep 1: an average is the total divided by how many there are.\nStep 2: Bill is the total and Items is how many, so the division is the wrong way round.\nStep 3: so the line becomes AveragePrice " + A + " Bill / Items." }
    ];
    function buggy(err) {
      var lines = CORRECT.slice();
      lines[err.line - 1] = err.wrong;
      return numbered(lines);
    }
    function lineExample(err) {
      var other = ERRORS.filter(function (e) { return e !== err; })[0];
      return "A similar algorithm has an error on the line where a " + {
        4: "variable is declared with the wrong type", 9: "loop condition is the wrong way round", 10: "total goes up by 1",
        11: "count goes down", 12: "loop never reads a new value", 14: "division is upside down" }[other.line] +
        ".\n" + other.example + "\n\nFind your error the same way: for each line, ask what it should do, then check that it does it.";
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
    // The same shape of algorithm with other names and numbers, traced line by line.
    var TRACE_EXAMPLE = "A similar algorithm:\nTall " + A + " 0\nShort " + A + " 0\nCount " + A + " 0\nREPEAT\n   INPUT Height\n   IF Height > 150 THEN Tall " + A + " Tall + 1 ELSE Short " + A + " Short + 1\n   Count " + A + " Count + 1\nUNTIL Count = 3\n\n" +
      "Input data: 162, 150, 139, 171\n" +
      "Read 162: more than 150, so Tall = 1. Count = 1, not 3 yet, so repeat.\n" +
      "Read 150: equal to 150 is NOT more than 150, so Short = 1. Count = 2, repeat.\n" +
      "Read 139: not more than 150, so Short = 2. Count = 3, so the loop stops.\n" +
      "171 is never read. Final values: Tall = 1, Short = 2.";

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
        example: "A similar question: a short-answer question asks for one name and you write two, one right and one wrong.\nThe examiner cannot tell which one you meant, so they cannot give you the mark.\nTicking boxes is marked the same way.",
        working: ["Can the examiner tell which of your two ticks you meant?", "One box asked for means one tick."],
        note: "Ticking two boxes when one is asked for gets no mark, even if one of them is right." },
      { id: "f-wordbank", category: "rev-format",
        prompt: "A word bank has 5 words. You label 3 statements and each word is used once at most. How many words are left unused?",
        answers: ["2"], keywords: [/^\s*(2|two)(\s+words?)?\s*$/i], distractors: ["0", "3", "5"],
        example: "A similar question: a bank has 8 words and you label 5 statements, each word used once at most.\nStep 1: 5 statements use 5 of the words.\nStep 2: 8 words in the bank take away the 5 used.\nThat leaves 3 words unused. Do the same subtraction with your numbers.",
        working: ["Take the number of words used away from the number of words in the bank.", "Bank size minus words used."],
        note: "Word banks include extra words on purpose, so you cannot get the last one by elimination." },
      { id: "f-errors", category: "rev-format",
        prompt: "In a question that asks you to identify errors and suggest corrections, what two things must you give for each error to earn the mark?",
        answers: ["The line number and the correction"],
        keywords: [[["line", "lines"], ["correction", "corrected", "correct", "fix", "fixed", "should"]]],
        distractors: ["The line number only", "The variable names used", "Why the program was written"],
        example: "A similar answer that earns the mark:\nerror 1: 07   Total " + A + " 0 (it said Total " + A + " 1)\nIt says WHERE the error is (07) and WHAT the line should be. An answer that only says '07' or only says 'Total should start at 0' is not enough.",
        working: ["Where is the error, and what should it say instead?", "Two parts for every error."],
        note: "Both are needed for each mark: the line number, and what the line should be." },
      { id: "f-trace-new", category: "rev-format",
        prompt: "When filling in a trace table, when do you write a new value in a variable's column?",
        answers: ["Only when its value changes"], keywords: [/chang|updat|new value|assign/i],
        distractors: ["On every row", "Only at the end", "Only for OUTPUT"],
        example: "A similar trace: Name " + A + " \"Ali\", then Count " + A + " Count + 1 runs three times.\nThe Count column gets 1, 2, 3 on the rows where those lines run.\nThe Name column is written once, on its own row, and left blank after that because nothing happens to it.",
        working: ["Leave a cell blank if nothing happened to that variable on that step.", "Write a value when a line gives the variable one."],
        note: "Write a value when the variable is given one; leave the column blank on rows where it does not change." },
      { id: "f-trace-unused", category: "rev-format",
        prompt: "A trace table question gives 10 input values, but the loop stops after reading 8 of them. What happens to the last 2 values?",
        answers: ["Nothing: they are never read"], keywords: [/never|not\s+(read|used|input)|ignore|unused|nothing|left over/i],
        distractors: ["They are read after the loop", "They replace the first two", "They are added to the total"],
        example: "A similar trace: a FOR loop runs 5 times, and the input data lists 7 numbers.\nStep 1: each time round the loop, INPUT takes the next number.\nStep 2: after 5 times round, the loop ends and no more INPUT lines run.\nStep 3: so numbers 6 and 7 never appear in the trace table.",
        working: ["How many times does the loop run INPUT?", "Follow the loop, not the length of the list."],
        note: "Only trace inputs the algorithm actually reads. Extra values are there to test that you stop at the right time." },
      { id: "f-comment", category: "rev-format",
        prompt: "The 15-mark program must include comments. Which symbol starts a comment in pseudocode?",
        answers: ["//"], keywords: [/\/\//], distractors: ["#", "--", "**"],
        example: "A similar question: in Python, which symbol starts a comment? The hash, #, as in # add up the prices.\nPseudocode uses a different symbol: two identical characters, the same slanting line twice.",
        working: ["It is two characters, both the same.", "A comment line explains the code and is ignored when it runs."],
        note: "// starts a comment: // count the days with no sales" },
      { id: "f-declare", category: "rev-format",
        prompt: "The question says all arrays and variables used must be declared. Which keyword begins every declaration?",
        answers: ["DECLARE"], keywords: [/^\s*declare\s*$/i], distractors: ["INPUT", "SET", "ARRAY"],
        example: "A similar question: which keyword reads a value typed by the user? INPUT, as in INPUT Age.\nA declaration line also starts with one keyword, then the name, a colon and the type:\n______ Total : INTEGER\nThe missing keyword is the word that means 'announce' or 'state'.",
        working: ["It comes before the name, the colon and the type.", "It creates a variable before it is used."],
        note: "DECLARE Total : INTEGER. Declarations earn credit in the 15-mark answer, so do not skip them." },
      { id: "f-prompt", category: "rev-format",
        prompt: "All inputs must contain suitable messages. What should come straight before every INPUT in your program?",
        answers: ["An OUTPUT with a message telling the user what to enter"], keywords: [/output|prompt|message/i],
        distractors: ["A comment", "A DECLARE", "A FOR loop"],
        example: "A similar situation: a program runs INPUT Age with nothing before it.\nStep 1: the user sees a blank screen and does not know what to type.\nStep 2: a line that shows \"Enter your age\" on screen fixes that.\nStep 3: think which statement shows text on the screen.",
        working: ["The user needs to be told what to type.", "Which statement shows text on the screen?"],
        note: "OUTPUT \"Enter the sales for day \", Day, then INPUT Sales[Day]." },
      { id: "f-identifiers", category: "rev-format",
        prompt: "In the 15-mark program, marks are given for identifiers: the names you choose for variables and arrays. What kind of identifier earns these marks?",
        answers: ["Meaningful names, such as TotalSales"], keywords: [/meaningful|descriptive|sensible|clear|explain/i],
        distractors: ["Short names, such as T", "Numbered names, such as Var1", "Names in capitals, such as X"],
        example: "A similar choice: N or NumberOfPupils for the number of pupils in a class?\nSomeone reading the code later knows what NumberOfPupils stores without guessing. N could mean anything.",
        working: ["Would another person know what the variable stores from its name?", "Names should say what they store."],
        note: "TotalSales tells the examiner what it stores; T does not." },

      // ================= statement types
      { id: "c-iter-pair", category: "rev-constructs",
        prompt: "Which pair of pseudocode statements are both used for iteration?",
        answers: ["WHILE ... ENDWHILE and REPEAT ... UNTIL"],
        keywords: [{ required: [["while"], ["repeat"]], excluded: ["if", "case"] }],
        distractors: ["IF and CASE", "REPEAT ... UNTIL and IF", "CASE and WHILE ... ENDWHILE"],
        example: "A similar question: is FOR ... NEXT iteration? Yes: it runs its lines again and again.\nIs IF iteration? No: it checks once and chooses a path (selection).\nFor a pair, test BOTH statements: an option is only right if both of them repeat.",
        working: ["Cross out any option containing a statement that chooses rather than repeats.", "Iteration means repeating."],
        note: "Iteration statements repeat: FOR ... NEXT, WHILE ... ENDWHILE and REPEAT ... UNTIL." },
      { id: "c-sel-pair", category: "rev-constructs",
        prompt: "Which pair of pseudocode statements are both used for selection?",
        answers: ["IF and CASE"], keywords: [{ required: [["if"], ["case"]], excluded: ["for", "while", "repeat"] }],
        distractors: ["IF and WHILE", "FOR and CASE", "REPEAT and IF"],
        example: "A similar question: is WHILE selection? No: it repeats, so it is iteration.\nSelection statements check a condition and choose one path to follow.\nFor a pair, test BOTH statements: an option is only right if both of them choose a path.",
        working: ["Cross out any option containing a statement that repeats.", "Selection means choosing a path."],
        note: "Selection chooses a path: IF ... THEN ... ELSE ... ENDIF and CASE OF ... ENDCASE." },
      { id: "c-classify", category: "rev-constructs",
        randomize: function () {
          var s = drillPick(STATEMENTS);
          var exWord = drillPick(others(WORDS, s[1]));
          return {
            prompt: "Word bank: selection, iteration, output, counting, totalling.\nWhich word describes this statement?\n\n" + s[0],
            answers: [s[1]], keywords: [new RegExp("^\\s*" + s[1] + "\\s*$", "i")],
            distractors: others(WORDS, s[1]),
            example: "A similar statement: " + STATEMENT_EXAMPLES[exWord] + "\nAsk the same questions of your statement: does it choose a path, repeat, show something, add exactly 1, or add a value?",
            working: ["Does it choose, repeat, show, add 1, or add a value?", "Look at what the statement does, not the variable name."],
            note: s[0] + " is " + s[1] + "."
          };
        } },
      { id: "c-count-total", category: "rev-constructs",
        prompt: "What is the difference between counting and totalling?",
        answers: ["Counting adds 1 each time; totalling adds a value, such as a price or a mark"],
        keywords: [[["1", "one"], ["value", "values", "amount", "price", "mark", "number", "numbers"]]],
        distractors: ["They are the same", "Counting uses FOR and totalling uses WHILE", "Totalling can only be used with arrays"],
        example: "Two similar lines:\nWins " + A + " Wins + 1 goes up by the same amount every time.\nScore " + A + " Score + Points goes up by whatever Points holds (3, then 1, then 3...).\nDescribe what each kind of line adds, and name them.",
        working: ["What does each kind of line add on each time?", "One adds a fixed amount; the other adds a value that changes."],
        note: "Passes \u2190 Passes + 1 is counting. Total \u2190 Total + Price is totalling." },

      // ================= data types and validation
      { id: "t-type", category: "rev-types",
        randomize: function () {
          var d = drillPick(DATA);
          var exType = drillPick(others(TYPES, d[1]));
          return {
            prompt: "Which data type is most appropriate for " + d[0] + "?",
            answers: [d[1]],
            keywords: [{ required: TYPE_KEYS[d[1]], excluded: others(TYPES, d[1]).map(function (t) { return t.toLowerCase(); }) }],
            distractors: others(TYPES, d[1]),
            example: "A similar item: " + TYPE_EXAMPLES[exType] + "\nAsk the same questions of your data: one character? several characters? only TRUE or FALSE? a whole number? a number with a decimal part?",
            working: ["One character, several characters, TRUE/FALSE, whole number or decimal?", "Think about every value the data could possibly hold."],
            note: d[2]
          };
        } },
      { id: "t-char-string", category: "rev-types",
        prompt: "What is the difference between CHAR and STRING?",
        answers: ["CHAR holds a single character; STRING holds any number of characters"],
        keywords: [[["single", "one", "1"], ["many", "several", "more", "multiple", "number", "sequence", "any"]]],
        distractors: ["CHAR is for numbers and STRING is for letters", "They are the same", "STRING can only hold letters"],
        example: "A similar comparison: 'A' and \"Apple\".\n'A' is exactly one character. \"Apple\" is five characters in a row.\nWhich type can hold each? Describe the difference in how many characters each type holds.",
        working: ["Compare how many characters each type can hold.", "Think of 'Y' compared with \"Yes please\"."],
        note: "CHAR: exactly one character, such as 'Y'. STRING: zero or more characters, such as \"Yes please\"." },
      { id: "t-range", category: "rev-types",
        randomize: function () {
          var d = drillPick(["A mark must be from 0 to 100.", "An age must be from 11 to 18.", "A quantity must be at least 1 and at most 50.", "A temperature must be between -10 and 45 inclusive."]);
          return {
            prompt: "Which type of validation check is this?\n" + d,
            answers: ["Range check"], keywords: [/\brange\b/i],
            distractors: ["Length check", "Presence check", "Type check"],
            example: "A similar rule: a password must be at least 8 characters long.\nThat rule is about how many characters there are, so it is a length check.\nYour rule gives a lowest AND a highest allowed value. Which check tests that a value lies between two limits?",
            working: ["Does the rule give a lowest and a highest allowed value?", "Between two limits."],
            note: "A lower and an upper limit: a range check."
          };
        } },
      { id: "t-range-code", category: "rev-types",
        prompt: "A validation loop must reject Mark when it is outside 0 to 100. Which condition is TRUE for an invalid Mark?",
        answers: ["Mark < 0 OR Mark > 100"],
        keywords: [/^\s*(mark\s*<\s*0\s+or\s+mark\s*>\s*100|mark\s*>\s*100\s+or\s+mark\s*<\s*0)\s*$/i],
        distractors: ["Mark < 0 AND Mark > 100", "Mark >= 0 OR Mark <= 100", "Mark <= 0 OR Mark >= 100"],
        example: "A similar rule: Age must be from 11 to 18.\nStep 1: too small means Age < 11 (11 itself is allowed, so not <=).\nStep 2: too big means Age > 18.\nStep 3: a value can only be one of these at once, so join them with OR: Age < 11 OR Age > 18.\nNow do the same with 0 and 100.",
        working: ["Write 'too small' and 'too big' as two comparisons, then join them.", "The limits themselves are allowed."],
        note: "Invalid means below the bottom OR above the top. It cannot be both, so AND is never TRUE." },

      // ================= tracing
      { id: "tr-hot", category: "rev-trace",
        randomize: function () {
          var s = traceSetup();
          return {
            prompt: s.code + "\n\nInput data: " + s.values.join(", ") + "\nWhat is output?",
            answers: [s.above + " hot days"], keywords: [new RegExp("^\\D*" + s.above + "(\\s*hot(\\s*days?)?)?\\s*$", "i")],
            distractors: drillWrongNumbers(s.above, [s.above + 1, s.rest, s.n, s.above + 2].filter(function (v) { return v >= 0; }), 3).map(function (v) { return v + " hot days"; }),
            example: TRACE_EXAMPLE + "\n\nTrace your algorithm the same way, one input per row, and stop when the UNTIL condition is TRUE.",
            working: ["A value equal to the limit is not more than it.", "Stop reading when Count reaches the UNTIL value."],
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
            example: TRACE_EXAMPLE + "\n\nTrace your algorithm the same way, one input per row, and stop when the UNTIL condition is TRUE.",
            working: ["Other goes up for every value read that is not more than the limit, including the limit itself.", "Stop reading when Count reaches the UNTIL value."],
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
            example: TRACE_EXAMPLE + "\n\nThere, 4 values were given but the loop stopped after reading 3, because Count reached the UNTIL value. Look at your UNTIL line.",
            working: ["Each time round the loop reads one value and adds 1 to Count.", "Look at the number in the UNTIL line."],
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
            example: "A similar algorithm totals Score until 0 is entered.\nInput data: 12, 20, 0, 15\n" +
              "Read 12 before the loop. 12 <> 0, so Total = 12, then read 20.\n" +
              "20 <> 0, so Total = 32, then read 0.\n" +
              "0 stops the loop BEFORE it is added. 15 is never read. Output: 32.\n\nTrace yours the same way, checking the condition before each addition.",
            working: ["The stopping value is checked before it can be added.", "Nothing after the stopping value is read."],
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
            example: lineExample(err),
            working: ["Check the declarations, the stopping condition, the totalling, the counting, the next INPUT, then the mean.", "Ask what each variable should hold at the end."],
            note: "Line " + err.line + " should be: " + err.fix.trim() + " (" + err.why + ")."
          };
        } },
      { id: "e-fix", category: "rev-errors",
        randomize: function () {
          var err = drillPick(ERRORS);
          return {
            prompt: "This algorithm should total marks until 0 is input, then output the mean mark.\n\n" + buggy(err) + "\n\nLine " + err.line + " contains an error. Write the corrected line.",
            answers: [err.fix.trim()], keywords: [err.re], distractors: err.wrongOpts,
            example: "The same kind of error in a different program:\n" + err.example + "\n\nNow apply the same reasoning to line " + err.line + ".",
            working: ["What should this line do, and what does it actually do?", "Change only what is wrong; keep the rest of the line."],
            note: "Because " + err.why + "."
          };
        } },

      // ================= writing a program (a different scenario from the paper)
      { id: "p-declare", category: "rev-program",
        prompt: "A shop records the number of items sold each day for 30 days. Which line declares an array called Sales to store them?",
        answers: ["DECLARE Sales : ARRAY[1:30] OF INTEGER"],
        keywords: [/^\s*declare\s+sales\s*:\s*array\s*\[\s*1\s*:\s*30\s*\]\s*of\s+integer\s*$/i],
        distractors: ["DECLARE Sales : INTEGER", "DECLARE Sales : ARRAY[1:30] OF STRING", "DECLARE Sales : ARRAY[1:7] OF INTEGER"],
        example: "A similar array: the heights of 12 plants in centimetres, to one decimal place.\nStep 1: DECLARE, then the name: DECLARE Heights\nStep 2: one element per plant: ARRAY[1:12]\nStep 3: the type of each element, a decimal number: OF REAL\nDECLARE Heights : ARRAY[1:12] OF REAL\nNow build yours: how many days, and what type is a number of items?",
        working: ["Name, then ARRAY[first:last], then OF and the type of each element.", "How many elements, and what type is each one?"],
        note: "One element per day, whole numbers of items: ARRAY[1:30] OF INTEGER." },
      { id: "p-init", category: "rev-program",
        prompt: "A shop program stores the number of items sold on each of 30 days in the array Sales[1:30], using the loop FOR Day ← 1 TO 30.\nWhich code uses the Day loop to set every element of Sales to zero?",
        answers: ["FOR Day " + A + " 1 TO 30  Sales[Day] " + A + " 0  NEXT Day"],
        keywords: [new RegExp("for\\s+(\\w+)" + ARROW + "1\\s+to\\s+30.*sales\\s*\\[\\s*\\1\\s*\\]" + ARROW + "0\\b.*next", "i")],
        distractors: ["Sales " + A + " 0", "Sales[30] " + A + " 0", "FOR Day " + A + " 1 TO 30  Sales[Day] " + A + " Day  NEXT Day"],
        example: "A similar task: set every element of Heights[1:12] to 0.\nStep 1: a FOR loop visits every index: FOR Plant " + A + " 1 TO 12\nStep 2: inside it, set the element at that index: Heights[Plant] " + A + " 0\nStep 3: close the loop: NEXT Plant\nWriting Heights " + A + " 0 on its own would not set the elements one by one.",
        working: ["A loop that visits every index, setting the element at that index.", "The loop variable goes inside the square brackets."],
        note: "A FOR loop visits every index, setting each element in turn." },
      { id: "p-input", category: "rev-program",
        prompt: "A shop program stores the number of items sold on each of 30 days in the array Sales[1:30], using the loop FOR Day ← 1 TO 30.\nInside the loop, which line reads that day's sales figure straight into the array?",
        answers: ["INPUT Sales[Day]"], keywords: [/^\s*input\s+sales\s*\[\s*day\s*\]\s*$/i],
        distractors: ["INPUT Sales", "OUTPUT Sales[Day]", "Sales[Day] " + A + " Day"],
        example: "A similar task: inside FOR Plant " + A + " 1 TO 12, store each plant's height.\nStep 1: prompt first: OUTPUT \"Enter the height of plant \", Plant\nStep 2: read the value straight into the element for this plant: INPUT Heights[Plant]\nThe loop variable in the brackets picks a different element each time round.",
        working: ["INPUT, then the array name with the loop variable as the index.", "Which element belongs to this day?"],
        note: "The loop variable picks the element: INPUT Sales[Day], after an OUTPUT prompt." },
      { id: "p-total", category: "rev-program",
        prompt: "A shop program stores the number of items sold on each of 30 days in the array Sales[1:30], using the loop FOR Day ← 1 TO 30.\nThe variable TotalSales holds the running total. Inside the loop, which line adds that day's sales to TotalSales?",
        answers: ["TotalSales " + A + " TotalSales + Sales[Day]"],
        keywords: [new RegExp("^\\s*totalsales" + ARROW + "totalsales\\s*\\+\\s*sales\\s*\\[\\s*day\\s*\\]\\s*$", "i")],
        distractors: ["TotalSales " + A + " TotalSales + 1", "TotalSales " + A + " Sales[Day]", "TotalSales " + A + " TotalSales + Day"],
        example: "A similar task: add each plant's height to TotalHeight.\nStep 1: the new total is the old total plus this element.\nStep 2: TotalHeight " + A + " TotalHeight + Heights[Plant]\nStep 3: before the loop, TotalHeight " + A + " 0, so it starts empty.\nAdding 1 instead would count the plants, not add up their heights.",
        working: ["New total = old total + this day's element.", "Totalling adds the value, not 1."],
        note: "Totalling: add the value stored for this day. TotalSales must be set to 0 before the loop." },
      { id: "p-count", category: "rev-program",
        prompt: "A shop program stores the number of items sold on each of 30 days in the array Sales[1:30], using the loop FOR Day ← 1 TO 30.\nThe variable NoSaleDays counts the days with no sales. Inside the loop, which code adds 1 to NoSaleDays on a day with no sales?",
        answers: ["IF Sales[Day] = 0 THEN NoSaleDays " + A + " NoSaleDays + 1 ENDIF"],
        keywords: [new RegExp("if\\s+sales\\s*\\[\\s*day\\s*\\]\\s*=\\s*0\\b.*nosaledays" + ARROW + "nosaledays\\s*\\+\\s*1", "i")],
        distractors: ["NoSaleDays " + A + " NoSaleDays + 1", "IF Sales[Day] = 0 THEN NoSaleDays " + A + " 0 ENDIF", "IF Sales[Day] > 0 THEN NoSaleDays " + A + " NoSaleDays + 1 ENDIF"],
        example: "A similar task: count the plants taller than 30 cm.\nStep 1: only some plants should be counted, so the counting goes inside an IF.\nStep 2: IF Heights[Plant] > 30 THEN\nStep 3:    TallPlants " + A + " TallPlants + 1\nStep 4: ENDIF\nWithout the IF, every plant would be counted.",
        working: ["Counting inside an IF: add 1 only when the condition is TRUE.", "Which condition means 'no sales'?"],
        note: "Counting inside selection: add 1 only on the days that match." },
      { id: "p-mean", category: "rev-program",
        randomize: function () {
          var mean = drillRange(3, 12), total = mean * 30;
          return {
            prompt: "After 30 days TotalSales is " + total + ". Which expression gives the mean daily sales, and what is its value?",
            answers: ["TotalSales / 30 = " + mean],
            keywords: [new RegExp("totalsales\\s*/\\s*30\\D*" + mean + "\\s*$|^\\s*" + mean + "\\s*$", "i")],
            distractors: ["30 / TotalSales", "TotalSales * 30", "TotalSales - 30"],
            example: "A similar task: 12 plants have a TotalHeight of 360.\nStep 1: the mean is the total divided by how many values there are.\nStep 2: TotalHeight / 12\nStep 3: 360 / 12 = 30, so the mean height is 30.\nDo the same with your total and number of days.",
            working: ["Divide the total by the number of values.", "Total divided by count, not the other way round."],
            note: "Mean = total / number of values: " + total + " / 30 = " + mean + "."
          };
        } },
      { id: "p-units", category: "rev-program",
        prompt: "A distance is totalled in metres in TotalMetres. Which expression converts it to kilometres (1 kilometre = 1000 metres)?",
        answers: ["TotalMetres / 1000"], keywords: [/^\s*totalmetres\s*\/\s*1000\s*$/i],
        distractors: ["TotalMetres * 1000", "1000 / TotalMetres", "TotalMetres - 1000"],
        example: "A similar conversion: a time is stored in minutes in TotalMinutes, and 1 hour = 60 minutes.\nStep 1: hours are a bigger unit, so the number gets smaller.\nStep 2: divide by how many small units make one big one: TotalMinutes / 60.\nApply the same idea to metres and kilometres.",
        working: ["Converting to a bigger unit makes the number smaller.", "Divide by how many small units make one big unit."],
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
            example: "A similar list: 4, 0, 0, 7, 0, 0, 0, 2\nGo left to right keeping a current run and a longest run:\n4: run 0. 0: run 1 (longest 1). 0: run 2 (longest 2). 7: run back to 0.\n0: run 1. 0: run 2. 0: run 3 (longest 3). 2: run back to 0.\nThe longest run is 3, even though there are 5 zeros altogether.",
            working: ["A day with sales sets the current run back to zero.", "Keep the biggest run you have seen so far."],
            note: "Consecutive means next to each other. A day with sales starts the count again."
          };
        } },
      { id: "p-run-reset", category: "rev-program",
        prompt: "A program keeps CurrentRun (dry days in a row so far). On a day that does have sales, what should happen to CurrentRun?",
        answers: ["It is set back to 0"], keywords: [/\b0\b|zero|reset/i],
        distractors: ["It goes up by 1", "It stays the same", "It is set to LongestRun"],
        example: "A similar idea: a streak of correct answers in a quiz.\nRight, right, right: the streak is 3. Then a wrong answer.\nThe streak does not stay at 3 or go up: the wrong answer breaks it, and the next right answer starts a new streak from the beginning.",
        working: ["A day with sales breaks the run of dry days.", "What does a broken streak go back to?"],
        note: "A day with sales breaks the run: CurrentRun \u2190 0." },
      { id: "p-run-longest", category: "rev-program",
        prompt: "In the shop program, CurrentRun counts the days in a row with no sales so far, and LongestRun stores the longest run found so far. When should LongestRun be changed?",
        answers: ["When CurrentRun is greater than LongestRun"],
        keywords: [/current\s*run\s*(>|is\s+(greater|bigger|more|larger|higher)\s+than)\s*(the\s+)?longest\s*run|(greater|bigger|more|larger|higher)\s+than\s+(the\s+)?longest/i],
        distractors: ["Every day", "Only when CurrentRun is 0", "Only once, at the start"],
        example: "A similar idea: keeping the highest score in a game.\nAfter each round, compare this round's score with HighScore.\nOnly when this round's score beats HighScore do you replace HighScore with it; otherwise HighScore stays as it was.",
        working: ["Compare the current run with the longest so far.", "Only replace the record when it is beaten."],
        note: "IF CurrentRun > LongestRun THEN LongestRun \u2190 CurrentRun ENDIF" },
      { id: "p-warning", category: "rev-program",
        prompt: "The program must output a warning if NoSaleDays is 10 or more. Which line starts that check?",
        answers: ["IF NoSaleDays >= 10"], keywords: [/^\s*if\s+nosaledays\s*>=\s*10(\s+then)?\s*$/i],
        distractors: ["IF NoSaleDays > 10", "IF NoSaleDays = 10", "WHILE NoSaleDays >= 10"],
        example: "A similar rule: output a message if a student scores 50 or more.\nStep 1: it is a one-off decision, so IF (not WHILE).\nStep 2: '50 or more' includes 50 itself, so the operator is >= (> would leave out 50).\nIF Score >= 50 THEN\nNow write yours with NoSaleDays and 10.",
        working: ["'Or more' includes the number itself.", "A one-off decision uses IF."],
        note: "10 or more means >= 10. > 10 would miss exactly 10." },
      { id: "p-order", category: "rev-program",
        prompt: "In a 15-mark program: calculate, declare, output results, input data. Which of these comes first?",
        answers: ["Declare"], keywords: [/^\s*(the\s+)?declar(e|ations?|ing)\s*$/i],
        distractors: ["Input data", "Calculate", "Output results"],
        example: "A similar plan, for the plant heights program:\nThe array and variables must exist before anything is stored in them.\nThen: set the totals to 0, input each height, work out the total and mean, output the results.\nWhich step makes the variables exist?",
        working: ["Nothing can be stored until the variables exist.", "Which step creates the variables?"],
        note: "Declare, initialise, input, calculate, output: the order the program runs in." }
    ];
    return cards;
  })()
});
