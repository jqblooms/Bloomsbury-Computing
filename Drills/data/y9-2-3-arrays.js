// Year 9, 2.3: Data Types and Arrays (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-2-3-arrays
// The five data types (INTEGER, REAL, CHAR, STRING, BOOLEAN), what a one-dimensional array is for, reading a value
// from an array by its index, and loops that visit every element. Only what Year 9 has met: DECLARE, assignment,
// OUTPUT, FOR ... TO ... NEXT and IF ... THEN ... ENDIF. Arrays start at index 1. Values are drawn at random.
// Help never gives the card's own answer: `example` is a similar question worked through, `working` two nudges.
DrillData.register("y9-2-3-arrays", {
  title: "Year 9, 2.3: Data Types and Arrays",
  subtitle: "Data types, arrays and indexes in Cambridge pseudocode",
  categories: [
    ["ar-types", "Data Types"],
    ["ar-why", "What an Array Is For"],
    ["ar-index", "Reading an Array"],
    ["ar-loop", "Loops and Arrays"]
  ],
  cards: (function () {
    var A = "←";
    var TYPES = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    var TYPE_RE = {
      INTEGER: /^\s*(integer|int)\s*\.?\s*$/i, REAL: /^\s*(real|float)\s*\.?\s*$/i, CHAR: /^\s*(char|character)\s*\.?\s*$/i,
      STRING: /^\s*(string|str)\s*\.?\s*$/i, BOOLEAN: /^\s*(boolean|bool)\s*\.?\s*$/i
    };
    // One worked value for each type, used as the example for a card whose answer is a DIFFERENT type.
    var WORKED = {
      INTEGER: "Example: 42 has no decimal point and no quotes. It is a whole number, so it is INTEGER.",
      REAL: "Example: 2.5 has a decimal point. A number with a decimal point is REAL.",
      CHAR: "Example: 'Q' is in single quotes and is just one character, so it is CHAR.",
      STRING: "Example: \"Hat Yai\" is in double quotes and has many characters, so it is STRING.",
      BOOLEAN: "Example: FALSE can only be TRUE or FALSE, so it is BOOLEAN."
    };
    var TYPE_STEPS = ["Ask: TRUE or FALSE? Quotes? One character or many? A decimal point?",
      "Whole number, decimal number, one character, many characters, or TRUE/FALSE?"];
    function otherTypes(t) { return TYPES.filter(function (x) { return x !== t; }); }
    function typeCard(prompt, t) {
      var ex = drillPick(otherTypes(t));
      return { prompt: prompt, answers: [t], keywords: [TYPE_RE[t]], distractors: sample(otherTypes(t), 3),
        example: WORKED[ex] + "\nRules: whole number, decimal number, one character, many characters, TRUE or FALSE: each has its own type.",
        working: TYPE_STEPS, note: t + "." };
    }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v >= 0 && v !== n; }), 3); }
    function values(n) { var out = []; while (out.length < n) { var v = drillRange(2, 19); if (out.indexOf(v) === -1) out.push(v); } return out; }
    function table(name, vals) {
      return name + " holds:\nIndex: " + vals.map(function (v, i) { return String(i + 1).padStart(3); }).join("") +
        "\nValue: " + vals.map(function (v) { return String(v).padStart(3); }).join("");
    }
    var NAMES = ["Marks", "Scores", "Points", "Goals", "Laps"];

    return [
      // ================= data types
      { id: "t-01", category: "ar-types", randomize: function () {
          var v = drillPick([["16", "INTEGER"], ["-8", "INTEGER"], ["3.75", "REAL"], ["0.5", "REAL"], ["'Y'", "CHAR"], ["'7'", "CHAR"],
            ["\"Bangkok\"", "STRING"], ["\"Room 12\"", "STRING"], ["TRUE", "BOOLEAN"], ["FALSE", "BOOLEAN"]]);
          return typeCard("Which data type is best for the value " + v[0] + "?", v[1]);
        } },
      { id: "t-02", category: "ar-types", randomize: function () {
          var v = drillPick([["the number of students in a class", "INTEGER"], ["the price of a drink, for example 25.50", "REAL"],
            ["a student's first name", "STRING"], ["whether a door is locked", "BOOLEAN"], ["one letter grade, for example 'B'", "CHAR"],
            ["a height in metres, for example 1.68", "REAL"], ["a telephone number, for example +66 81 234 5678", "STRING"]]);
          return typeCard("A variable stores " + v[0] + ". Which data type is best?", v[1]);
        } },
      { id: "t-03", category: "ar-types", prompt: "Explain why a telephone number such as +66 81 234 5678 is stored as a STRING, not an INTEGER.",
        answers: ["It has a + and spaces, and no maths is done with it"],
        keywords: [/(\+|\bplus\b|\bspaces?\b|symbol|\bmaths?\b|calculat|\badd\w*\b|not\s+a\s+(real\s+)?number|leading\s+zero|start\w*\s+with\s+(a\s+)?0|zero\s+at\s+the\s+start)/i],
        distractors: ["An INTEGER can never hold more than three digits at once", "A STRING takes up less memory than an INTEGER", "Telephone numbers are always TRUE or FALSE"],
        example: "Example question: why is a postcode such as \"NW1 4RT\" a STRING?\nStep 1: look at the characters. It has letters and a space.\nStep 2: a number type can only hold digits.\nStep 3: and we never add or multiply postcodes.\nRule: if it has symbols, spaces or letters, or we never do maths with it, store it as a STRING.",
        working: ["Look at every character in +66 81 234 5678. Are they all digits?", "Would you ever add two telephone numbers together?"],
        note: "It has a + and spaces, which a number type cannot hold, and we never do maths with it." },

      // ================= what an array is for
      { id: "w-01", category: "ar-why", prompt: "What is an array?", answers: ["One name that stores many values of the same type"],
        keywords: [/^(?=.*\b(many|several|multiple|more\s+than\s+one|lots|list|group|collection|set|series)\b)(?=.*\b(values?|items?|data|elements?|numbers?|names?|things?)\b).*$/i],
        distractors: ["A variable that stores just one value of any type", "A loop that repeats the same lines again", "A data type that is used for whole numbers only"],
        example: "Example: a shoe rack.\nStep 1: the rack has ONE name: \"the shoe rack\".\nStep 2: it has numbered spaces: space 1, space 2, space 3.\nStep 3: each space holds one pair of shoes, and every space holds the same kind of thing.\nNow think: a variable is one box. What do we call one name with many numbered boxes?",
        working: ["A variable holds one value. How is an array different?", "Think of the shoe rack: one name, numbered spaces."],
        note: "An array is one name (identifier) that stores many values, all of the same data type, each at its own index." },
      { id: "w-02", category: "ar-why", prompt: "A teacher stores 30 marks. Why use one array instead of 30 separate variables?", answers: ["One name and a loop can process every mark"],
        keywords: [/\b(loops?|for|one\s+name|single\s+name|same\s+name|less\s+code|fewer|shorter|easier|quicker|faster|indexe?s?|positions?|together|organi[sz]ed?)\b/i],
        distractors: ["Arrays can only ever hold whole numbers in them", "30 variables would each need a type", "Separate variables cannot hold marks"],
        example: "Example question: why keep 50 photos in one album, not 50 loose pages?\nStep 1: the album has one name, so everything is in one place.\nStep 2: you can go through it page 1, page 2, page 3, one after another.\nStep 3: with loose pages you would need a name for each one.\nNow apply it: what can a FOR loop do with one name and index numbers 1 to 30?",
        working: ["How many DECLARE lines do 30 variables need? How many for one array?", "What can a FOR loop do with the index numbers 1 to 30?"],
        note: "One array name plus a loop can visit every mark (index 1 to 30): less code, all kept together." },
      { id: "w-03", category: "ar-why", prompt: "Every element in one array has the same ______.", answers: ["Data type"],
        keywords: [/^\s*(the\s+)?(data\s*)?type\s*\.?\s*$/i],
        distractors: ["Value", "Position", "Index"],
        example: "Example: DECLARE Names : ARRAY[1:5] OF STRING\nStep 1: read the end of the line: OF STRING.\nStep 2: that word applies to all 5 elements.\nStep 3: so Names[1] to Names[5] can each hold text, but not TRUE/FALSE or a decimal number.\nNow ask: what does OF STRING describe, the value or the kind of value?",
        working: ["Look at a DECLARE line: ARRAY[1:5] OF INTEGER. What does OF INTEGER apply to?", "The values can be different. What stays the same?"],
        note: "All elements share one data type, set by OF ... in the DECLARE line." },

      // ================= reading an array
      { id: "i-01", category: "ar-index", randomize: function () {
          var name = drillPick(NAMES), vals = values(5), k = drillRange(2, 5), ans = vals[k - 1];
          return { prompt: table(name, vals) + "\n\nWhat is " + name + "[" + k + "]?", answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [vals[k - 2], vals[k] === undefined ? vals[0] : vals[k], k]),
            example: "Example: Heights holds 120, 140, 130 at index 1, 2, 3.\nHeights[2] means: go to index 2.\nIndex 1 is 120, index 2 is 140.\nSo Heights[2] is 140. The number in the brackets is the index, not the value.",
            working: ["The number in the square brackets is the index.", "Find that index in the top row, then read the value under it."],
            note: name + "[" + k + "] is the value at index " + k + ": " + ans + "." };
        } },
      { id: "i-02", category: "ar-index", randomize: function () {
          var name = drillPick(NAMES), vals = values(5), k = drillRange(1, 5), v = vals[k - 1];
          return { prompt: table(name, vals) + "\n\nWhich index holds the value " + v + "?", answers: [String(k)], keywords: [drillNumberRe(k, "(index|position)")],
            distractors: others(k, [k + 1, k - 1, 6 - k, v]),
            example: "Example: Heights holds 120, 140, 130 at index 1, 2, 3.\nWhich index holds 130?\nLook along the values: 120 (index 1), 140 (index 2), 130 (index 3).\nSo 130 is at index 3.",
            working: ["Find the value in the bottom row.", "Read the index number above it."],
            note: v + " is at index " + k + ", so " + name + "[" + k + "] = " + v + "." };
        } },
      { id: "i-03", category: "ar-index", randomize: function () {
          var n = drillPick([5, 6, 8, 12, 20, 30]), name = drillPick(["Names", "Temps", "Prices", "Players"]);
          return { prompt: "DECLARE " + name + " : ARRAY[1:" + n + "] OF STRING\n\nHow many elements does " + name + " have?", answers: [String(n)], keywords: [drillNumberRe(n, "(elements?)")],
            distractors: others(n, [n - 1, n + 1, 1]),
            example: "Example: DECLARE Cities : ARRAY[1:4] OF STRING\n[1:4] means the index goes from 1 up to 4.\nThe elements are Cities[1], Cities[2], Cities[3], Cities[4].\nThat is 4 elements.",
            working: ["[1:?] gives the first and the last index.", "Starting at 1, the last index is the number of elements."],
            note: "[1:" + n + "] gives " + n + " elements, index 1 to " + n + "." };
        } },
      { id: "i-04", category: "ar-index", randomize: function () {
          var c = drillPick([["Temps", 7, "REAL", "7 temperatures, such as 31.5"], ["Names", 6, "STRING", "6 names"], ["Goals", 10, "INTEGER", "10 whole numbers"], ["Grades", 5, "CHAR", "5 letter grades, such as 'A'"]]);
          var ans = "DECLARE " + c[0] + " : ARRAY[1:" + c[1] + "] OF " + c[2];
          return { prompt: "Write the DECLARE line for an array called " + c[0] + " that stores " + c[3] + ", at index 1 to " + c[1] + ".", answers: [ans],
            keywords: [new RegExp("^\\s*declare\\s+" + c[0] + "\\s*:\\s*array\\s*\\[\\s*1\\s*:\\s*" + c[1] + "\\s*\\]\\s*of\\s+" + c[2] + "\\s*$", "i")],
            distractors: ["DECLARE " + c[0] + " : ARRAY[0:" + c[1] + "] OF " + c[2], "DECLARE " + c[0] + " : " + c[2] + "[1:" + c[1] + "] OF ARRAY", "DECLARE " + c[0] + " : ARRAY[1:" + c[1] + "] OF " + (c[2] === "STRING" ? "INTEGER" : "STRING")],
            example: "Example: an array called Ages that stores 3 whole numbers, index 1 to 3.\nStep 1: DECLARE, the name, a colon: DECLARE Ages :\nStep 2: ARRAY and the first and last index in square brackets: ARRAY[1:3]\nStep 3: OF and the data type of every element: OF INTEGER\nTogether: DECLARE Ages : ARRAY[1:3] OF INTEGER",
            working: ["DECLARE, the name, a colon, then ARRAY[first:last].", "End with OF and the data type of the values."],
            note: ans + "." };
        } },
      { id: "i-05", category: "ar-index", randomize: function () {
          var name = drillPick(NAMES), k = drillRange(2, 6);
          var ans = "OUTPUT " + name + "[" + k + "]";
          return { prompt: "Write the line that outputs the value at index " + k + " of the array " + name + ".", answers: [ans],
            keywords: [new RegExp("^\\s*output\\s+" + name + "\\s*\\[\\s*" + k + "\\s*\\]\\s*$", "i")],
            distractors: ["OUTPUT " + name + "(" + k + ")", "OUTPUT " + name + " " + k, "OUTPUT [" + k + "]" + name],
            example: "Example: output the value at index 4 of the array Ages.\nStep 1: OUTPUT, then the array name: OUTPUT Ages\nStep 2: the index goes straight after the name, in square brackets: [4]\nTogether: OUTPUT Ages[4]",
            working: ["OUTPUT, then the array's name.", "The index goes in square brackets, straight after the name."],
            note: ans + "." };
        } },

      // ================= loops and arrays
      { id: "l-01", category: "ar-loop", randomize: function () {
          var name = drillPick(NAMES), vals = values(4), t = vals.reduce(function (a, b) { return a + b; }, 0);
          return { prompt: table(name, vals) + "\n\n" + ["DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total " + A + " 0", "FOR Index " + A + " 1 TO 4", "    Total " + A + " Total + " + name + "[Index]", "NEXT Index", "OUTPUT Total"].join("\n") + "\n\nWhat does this program output?",
            answers: [String(t)], keywords: [drillNumberRe(t, "total")],
            distractors: others(t, [t - vals[3], t - vals[0], vals[3], t + 1]),
            example: "A similar program: Heights holds 120, 140, 130. Total starts at 0 and a loop from 1 TO 3 adds Heights[Index].\nIndex 1: Total = 0 + 120 = 120\nIndex 2: Total = 120 + 140 = 260\nIndex 3: Total = 260 + 130 = 390\nOUTPUT 390.",
            working: ["On each pass, Index is 1, then 2, then 3, then 4.", "Add the value at that index onto Total each time."],
            note: vals.join(" + ") + " = " + t + "." };
        } },
      { id: "l-02", category: "ar-loop", randomize: function () {
          var name = drillPick(NAMES), vals = values(5), s = drillRange(2, 3), ans = vals[s - 1];
          return { prompt: table(name, vals) + "\n\n" + ["DECLARE Index : INTEGER", "FOR Index " + A + " " + s + " TO 5", "    OUTPUT " + name + "[Index]", "NEXT Index"].join("\n") + "\n\nWhat is the FIRST value this program outputs?",
            answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [vals[0], s, vals[4], vals[s]]),
            example: "A similar program: Heights holds 120, 140, 130, 150. The loop is FOR Index " + A + " 3 TO 4 with OUTPUT Heights[Index].\nOn the first pass, Index is 3.\nSo it outputs Heights[3], which is 130.\nIt does not start at index 1, because the loop starts at 3.",
            working: ["What is Index on the first pass? Look at the number after " + A + ".", "Then read the value at that index."],
            note: "The first pass has Index = " + s + ", so it outputs " + name + "[" + s + "] = " + ans + "." };
        } },
      { id: "l-03", category: "ar-loop", randomize: function () {
          var name = drillPick(NAMES), vals = values(5), p = drillRange(8, 13), c = vals.filter(function (v) { return v > p; }).length;
          return { prompt: table(name, vals) + "\n\n" + ["DECLARE Count : INTEGER", "DECLARE Index : INTEGER", "Count " + A + " 0", "FOR Index " + A + " 1 TO 5", "    IF " + name + "[Index] > " + p + " THEN", "        Count " + A + " Count + 1", "    ENDIF", "NEXT Index", "OUTPUT Count"].join("\n") + "\n\nWhat does this program output?",
            answers: [String(c)], keywords: [drillNumberRe(c, "count")],
            distractors: others(c, [5 - c, c + 1, c - 1, vals.filter(function (v) { return v >= p; }).length]),
            example: c === 2
              ? "A similar program: Heights holds 120, 140, 130. Count goes up by 1 when Heights[Index] > 135.\n120 > 135? No.\n140 > 135? Yes: Count = 1\n130 > 135? No.\nOUTPUT 1. Only values MORE than 135 are counted."
              : "A similar program: Heights holds 120, 140, 130. Count goes up by 1 when Heights[Index] > 120.\n120 > 120? No (120 is not MORE than 120).\n140 > 120? Yes: Count = 1\n130 > 120? Yes: Count = 2\nOUTPUT 2.",
            working: ["Check each value in turn: is it MORE than " + p + "?", "Equal does not count: > means more than."],
            note: "Values more than " + p + ": " + (vals.filter(function (v) { return v > p; }).join(", ") || "none") + ". Count = " + c + "." };
        } },
      { id: "l-04", category: "ar-loop", randomize: function () {
          var n = drillPick([6, 7, 9, 12, 15]), name = drillPick(["Temps", "Names", "Prices"]);
          return { prompt: "DECLARE " + name + " : ARRAY[1:" + n + "] OF STRING\n\nA loop must visit every element of " + name + ":\nFOR Index " + A + " 1 TO ?\n\nWhat number goes in place of the ?", answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [n - 1, n + 1, 1]),
            example: "Example: DECLARE Cities : ARRAY[1:4] OF STRING\nThe last index of Cities is 4.\nTo visit every element, the loop must go from index 1 up to the last index.\nSo: FOR Index " + A + " 1 TO 4.",
            working: ["What is the last index in the DECLARE line?", "The loop must stop at the last element, not before or after it."],
            note: "The last index is " + n + ", so FOR Index " + A + " 1 TO " + n + "." };
        } }
    ];
  })()
});
