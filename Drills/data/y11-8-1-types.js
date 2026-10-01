// Year 11, 8.1 L2: Data Types, Input and Output
// Loaded by Drills/index.html?drill=y11-8-1-types
// The five data types (INTEGER, REAL, CHAR, STRING, BOOLEAN), choosing one for a value, and tracing short programs
// that use INPUT and OUTPUT. Cambridge pseudocode, every variable declared.
DrillData.register("y11-8-1-types", {
  title: "Year 11, 8.1 L2: Data Types, Input and Output",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["ty-words", "The Five Types"],
    ["ty-choose", "Choose the Type"],
    ["ty-io", "Input and Output"],
    ["ty-write", "Write the Line"]
  ],
  cards: (function () {
    var T = {
      INTEGER: /^\s*(an?\s+)?integers?\s*$/i,
      REAL: /^\s*(an?\s+)?real(\s+number)?\s*$/i,
      CHAR: /^\s*(an?\s+)?(char|character)s?\s*$/i,
      STRING: /^\s*(an?\s+)?strings?\s*$/i,
      BOOLEAN: /^\s*(an?\s+)?boolean\s*$/i
    };
    var ALL = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    function others(t) { return ALL.filter(function (x) { return x !== t; }).slice(0, 3); }
    // [value or description, type, why]
    var VALUES = [
      ["16 (a student's age)", "INTEGER", "A whole number."],
      ["25 (the number of students in a class)", "INTEGER", "A whole number."],
      ["3.75 (the price of a drink)", "REAL", "It has a decimal point."],
      ["1.68 (a height in metres)", "REAL", "It has a decimal point."],
      ["'Y' (one key pressed)", "CHAR", "One character."],
      ["'A' (a grade)", "CHAR", "One character."],
      ["\"Muhammed\" (a first name)", "STRING", "Several characters."],
      ["\"+44 7846398573\" (a telephone number)", "STRING", "It has a + and spaces, and we never do maths with it."],
      ["TRUE (whether a student is a teenager)", "BOOLEAN", "Only TRUE or FALSE."],
      ["FALSE (whether a door is locked)", "BOOLEAN", "Only TRUE or FALSE."]
    ];
    return [
      // ------------------------------------------------ The Five Types
      { id: "ty-01", category: "ty-words", prompt: "Which data type stores a whole number, such as 16?", answers: ["INTEGER"], keywords: [T.INTEGER], distractors: ["REAL", "STRING", "CHAR"], note: "INTEGER: a whole number." },
      { id: "ty-02", category: "ty-words", prompt: "Which data type stores a number with a decimal point, such as 3.75?", answers: ["REAL"], keywords: [T.REAL], distractors: ["INTEGER", "CHAR", "STRING"], note: "REAL: a number with a decimal point." },
      { id: "ty-03", category: "ty-words", prompt: "Which data type stores one single letter, symbol or number, such as 'Y'?", answers: ["CHAR"], keywords: [T.CHAR], distractors: ["STRING", "INTEGER", "BOOLEAN"], note: "CHAR: one character. From Cambridge IGCSE 0478/22, June 2026, Question 2." },
      { id: "ty-04", category: "ty-words", prompt: "Which data type stores any combination of letters and numbers, such as \"Room12\"?", answers: ["STRING"], keywords: [T.STRING], distractors: ["CHAR", "REAL", "BOOLEAN"], note: "STRING: several characters. From Cambridge IGCSE 0478/23, June 2026, Question 2." },
      { id: "ty-05", category: "ty-words", prompt: "Which data type stores only TRUE or FALSE?", answers: ["BOOLEAN"], keywords: [T.BOOLEAN], distractors: ["STRING", "INTEGER", "CHAR"], note: "BOOLEAN: TRUE or FALSE." },

      // ------------------------------------------------ Choose the Type
      { id: "ty-06", category: "ty-choose", randomize: function () {
          var v = drillPick(VALUES);
          return { prompt: "Which data type is best for " + v[0] + "?", answers: [v[1]], keywords: [T[v[1]]], distractors: others(v[1]),
            working: ["Whole number, decimal, one character, many characters, or TRUE/FALSE?"], note: v[1] + ": " + v[2] };
        } },
      { id: "ty-07", category: "ty-choose", randomize: function () {
          var v = drillPick(VALUES);
          return { prompt: "Which data type is best for " + v[0] + "?", answers: [v[1]], keywords: [T[v[1]]], distractors: others(v[1]),
            working: ["Does it have a decimal point? Is it only TRUE or FALSE?"], note: v[1] + ": " + v[2] };
        } },
      { id: "ty-08", category: "ty-choose", prompt: "A telephone number is +44 7846398573. Why is STRING better than INTEGER for it?", answers: ["It has a + and spaces, which are not numbers"],
        keywords: [/\+|plus|space|symbol|not\s+(a\s+)?(whole\s+)?number|letters?|characters?|maths|calculat|leading\s+zero|start\s+with\s+0/i],
        distractors: ["It is a whole number, so INTEGER cannot store it", "It has a decimal point", "It is only TRUE or FALSE"],
        working: ["Look at the + and the space. Can an INTEGER hold them?"], note: "It has a + and a space, and we never do maths with it. From Cambridge IGCSE 0478/21, June 2026, Question 3." },

      // ------------------------------------------------ Input and Output
      { id: "ty-09", category: "ty-io", randomize: function () {
          var n = drillPick([3, 4, 5, 7]);
          return { prompt: "The user types " + n + ". What is output?\nDECLARE Number : INTEGER\nINPUT Number\nOUTPUT Number * 2",
            answers: [String(n * 2)], keywords: [new RegExp("^\\s*" + (n * 2) + "\\s*$")], distractors: [String(n), String(n + 2), String(n * 3)],
            working: ["INPUT puts the typed value in Number.", "Then work out Number * 2."], note: "Number is " + n + ", so the output is " + (n * 2) + "." };
        } },
      { id: "ty-10", category: "ty-io", randomize: function () {
          var name = drillPick(["Ana", "Ben", "Mai", "Tom"]);
          return { prompt: "The user types " + name + ". What is output?\nDECLARE Name : STRING\nINPUT Name\nOUTPUT \"Hello \", Name",
            answers: ["Hello " + name], keywords: [new RegExp("^\\s*[\"']?hello,?\\s+" + name + "[\"']?\\s*[.!]?\\s*$", "i")],
            distractors: ["Hello Name", name, "Hello"], format: "Type exactly what is output",
            working: ["Text in quotes is output as it is.", "Name is output as its value."], note: "Hello " + name };
        } },
      { id: "ty-11", category: "ty-io", prompt: "Which keyword takes a value from the user?", answers: ["INPUT"], keywords: [/^\s*input\s*$/i], distractors: ["OUTPUT", "DECLARE", "CONSTANT"], note: "INPUT takes a value from the user and stores it in a variable." },
      { id: "ty-12", category: "ty-io", prompt: "Which keyword shows a value to the user?", answers: ["OUTPUT"], keywords: [/^\s*output\s*$/i], distractors: ["INPUT", "DECLARE", "STRING"], note: "OUTPUT shows a value or a message." },
      { id: "ty-13", category: "ty-io", randomize: function () {
          var a = drillPick([2, 3, 4]), b = drillPick([5, 6, 10]);
          return { prompt: "The user types " + a + ", then " + b + ". What is output?\nDECLARE A : INTEGER\nDECLARE B : INTEGER\nINPUT A\nINPUT B\nOUTPUT A + B",
            answers: [String(a + b)], keywords: [new RegExp("^\\s*" + (a + b) + "\\s*$")], distractors: [String(a * b), String(b - a), String(a) + String(b)],
            working: ["The first value goes in A, the second in B.", "The lines run in order, one at a time."], note: "A = " + a + ", B = " + b + ", so A + B = " + (a + b) + "." };
        } },

      // ------------------------------------------------ Write the Line
      { id: "ty-14", category: "ty-write", randomize: function () {
          var v = drillPick([["Age", "INTEGER", "a whole number"], ["Price", "REAL", "a number with a decimal point"], ["Initial", "CHAR", "one character"], ["City", "STRING", "a word"], ["Passed", "BOOLEAN", "TRUE or FALSE"]]);
          return { prompt: "Write the line that declares a variable called " + v[0] + " that stores " + v[2] + ".", answers: ["DECLARE " + v[0] + " : " + v[1]],
            keywords: [new RegExp("^\\s*DECLARE\\s+" + v[0] + "\\s*:\\s*" + (v[1] === "CHAR" ? "(CHAR|CHARACTER)" : v[1]) + "\\s*$", "i")],
            distractors: others(v[1]).map(function (t) { return "DECLARE " + v[0] + " : " + t; }), format: "Type the whole line",
            working: ["DECLARE, the name, a colon, then the data type."], note: "DECLARE " + v[0] + " : " + v[1] };
        } },
      { id: "ty-15", category: "ty-write", randomize: function () {
          var v = drillPick(["Age", "Name", "Score", "City"]);
          return { prompt: "Write the line that takes a value from the user and stores it in " + v + ".", answers: ["INPUT " + v],
            keywords: [new RegExp("^\\s*INPUT\\s+" + v + "\\s*$", "i")], distractors: ["OUTPUT " + v, "DECLARE " + v, v + " <- INPUT"], format: "Type the whole line",
            working: ["The keyword, then the variable's name."], note: "INPUT " + v };
        } }
    ];
  })()
});
