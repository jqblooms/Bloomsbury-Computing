// Year 11, 8.1 L3 Do Now Extension: 8.1 L1 and L2 (variables, constants, data types, INPUT, OUTPUT, sequence).
// Loaded by Drills/index.html?drill=y11-8-1-arith-ext
// For students who finish the Do Now early: 10 questions across 8.1 so far, written fresh and randomised. Every card
// has an `example`, a similar question worked through with different values, holding every rule and step needed,
// then two `working` nudges. An example never shows the card's own answer. Cambridge pseudocode, every variable
// declared.
DrillData.register("y11-8-1-arith-ext", {
  title: "Year 11 Extension: Variables, Data Types, Input and Output",
  subtitle: "8.1 L3 Do Now Extension",
  categories: [
    ["ex-vc", "Variables and Constants (8.1 L1)"],
    ["ex-types", "Data Types (8.1 L2)"],
    ["ex-io", "Input, Output and Sequence (8.1 L2)"]
  ],
  cards: (function () {
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while (avoid.indexOf(n) !== -1); return n; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v !== n; }).concat([n + 1, n + 2, n + 3, n + 4]), 3); }
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var TYPES = [
      ["16 (the number of students in a group)", "INTEGER", "a whole number"],
      ["2.75 (the price of a pen)", "REAL", "a number with a decimal point"],
      ["'Y' (one key pressed)", "CHAR", "one character in single quotes"],
      ["\"Bangkok\" (a city)", "STRING", "several characters in speech marks"],
      ["TRUE (whether a door is open)", "BOOLEAN", "only TRUE or FALSE"]
    ];
    var ALL = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    function typeRe(t) { return new RegExp("^\\s*" + (t === "CHAR" ? "(CHAR|CHARACTER)" : t === "BOOLEAN" ? "BOOL(EAN)?" : t) + "\\s*$", "i"); }

    return [
      // ------------------------------------------------ 8.1 L1 Variables and constants
      { id: "ex-01", category: "ex-vc", randomize: function () {
          var a = pick(3, 9, [5]), b = pick(2, 6, [4]), r = (a + b) * 2;
          return { prompt: "What is output?\n" + code("DECLARE Score : INTEGER", "Score <- " + a, "Score <- Score + " + b, "Score <- Score * 2", "OUTPUT Score"),
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a + b, a * 2 + b, r + 2]),
            example: "Example: Points <- 5, then Points <- Points + 4, then Points <- Points * 2.\nLine by line: Points is 5, then 5 + 4 = 9, then 9 * 2 = 18.\nA variable holds one value. Each new line replaces the old value, so it outputs 18.",
            working: ["Write the value of Score after each line.", "Each line uses the value from the line before."],
            note: a + " + " + b + " = " + (a + b) + ", then * 2 = " + r + "." };
        } },
      { id: "ex-02", category: "ex-vc", randomize: function () {
          var p = pick(3, 9, [4]), q = pick(2, 6, [5]), t = p * q;
          return { prompt: "What is output?\n" + code("CONSTANT Price <- " + p, "DECLARE Total : INTEGER", "Total <- Price * " + q, "OUTPUT Total"),
            answers: [String(t)], keywords: [drillNumberRe(t)], distractors: others(t, [p + q, p, t + p]),
            example: "Example: CONSTANT Fee <- 4, then Cost <- Fee * 5.\nA constant is used just like its value: Fee is 4.\nSo Cost = 4 * 5 = 20, and OUTPUT Cost outputs 20.",
            working: ["Price is a constant. What value does it hold?", "Put that value into the Total line."],
            note: p + " * " + q + " = " + t + "." };
        } },
      { id: "ex-03", category: "ex-vc", randomize: function () {
          var bad = pick(3, 5, []);
          var lines = ["CONSTANT MaxLives <- 3", "DECLARE Lives : INTEGER", "Lives <- MaxLives", "Lives <- Lives - 1", "OUTPUT Lives"];
          lines.splice(bad - 1, 0, "MaxLives <- 5");
          var shown = lines.slice(0, 5).map(function (l, i) { return (i + 1) + "  " + l; });
          return { prompt: "Which line has an error? Type the line number.\n" + shown.join("\n"),
            answers: [String(bad)], keywords: [new RegExp("^\\s*(line\\s*)?" + bad + "\\s*$", "i")], distractors: [1, 2, 3, 4, 5].filter(function (n) { return n !== bad; }).slice(0, 3).map(String),
            example: "Example:\n1  CONSTANT Rate <- 10\n2  Rate <- 12\nLine 2 tries to change Rate, but a constant cannot change while the program runs.\nSo the error is on the line that stores a new value in the constant.",
            working: ["Which name was made with CONSTANT?", "Find the line that tries to store a new value in it."],
            note: "Line " + bad + " tries to change the constant MaxLives." };
        } },
      { id: "ex-04", category: "ex-vc", randomize: function () {
          var c = drillPick([["MaxScore", 100], ["Lives", 3], ["Bonus", 50], ["Limit", 20]]);
          return { prompt: "Write the line that makes a constant called " + c[0] + " with the value " + c[1] + ".",
            answers: ["CONSTANT " + c[0] + " <- " + c[1]], keywords: [new RegExp("^\\s*CONSTANT\\s+" + c[0] + ARROW + c[1] + "\\s*$", "i")],
            distractors: ["DECLARE " + c[0] + " : INTEGER", c[0] + " <- " + c[1], "CONSTANT " + c[0] + " : " + c[1]], format: "Type the whole line",
            example: "Example: a constant called Pi with the value 3.142.\nStart with the keyword CONSTANT, then the name, then the arrow, then the value:\nCONSTANT Pi <- 3.142",
            working: ["Which keyword makes a value that cannot change?", "The keyword, the name, an arrow, the value."],
            note: "CONSTANT " + c[0] + " <- " + c[1] };
        } },
      // ------------------------------------------------ 8.1 L2 Data types
      { id: "ex-05", category: "ex-types", randomize: function () {
          var t = drillPick(TYPES), ex = drillPick(TYPES.filter(function (x) { return x[1] !== t[1]; }));
          return { prompt: "Which data type is best for " + t[0] + "?",
            answers: [t[1]], keywords: [typeRe(t[1])], distractors: ALL.filter(function (x) { return x !== t[1]; }).slice(0, 3),
            example: "Example: which data type is best for " + ex[0] + "?\nIt is " + ex[2] + ", so it is " + ex[1] + ".\nEvery type has a clue: a whole number, a decimal point, one character, several characters, or only TRUE or FALSE.",
            working: ["Is it a number? Does it have a decimal point?", "Is it text? One character or several? Or only TRUE or FALSE?"],
            note: t[1] + ": " + t[2] + "." };
        } },
      { id: "ex-06", category: "ex-types", randomize: function () {
          var v = drillPick([["Age", "INTEGER", "a whole number"], ["Price", "REAL", "a number with a decimal point"], ["Initial", "CHAR", "one character"], ["City", "STRING", "a word"], ["Passed", "BOOLEAN", "TRUE or FALSE"]]);
          var ex = v[1] === "REAL" ? ["Grade", "CHAR", "one letter"] : ["Height", "REAL", "a number with a decimal point"];
          return { prompt: "Write the line that declares a variable called " + v[0] + " that stores " + v[2] + ".",
            answers: ["DECLARE " + v[0] + " : " + v[1]], keywords: [new RegExp("^\\s*DECLARE\\s+" + v[0] + "\\s*:\\s*" + typeRe(v[1]).source.replace(/^\^\\s\*|\\s\*\$$/g, "") + "\\s*$", "i")],
            distractors: ALL.filter(function (x) { return x !== v[1]; }).slice(0, 3).map(function (t) { return "DECLARE " + v[0] + " : " + t; }), format: "Type the whole line",
            example: "Example: declare a variable called " + ex[0] + " that stores " + ex[2] + ".\nStart with DECLARE, then the name, then a colon, then the data type:\nDECLARE " + ex[0] + " : " + ex[1],
            working: ["DECLARE, the name, a colon, then the data type.", "Which data type stores " + v[2] + "?"],
            note: "DECLARE " + v[0] + " : " + v[1] };
        } },
      // ------------------------------------------------ 8.1 L2 Input, output and sequence
      { id: "ex-07", category: "ex-io", randomize: function () {
          var n = pick(3, 9, [4, 5]), k = pick(3, 5, []), r = n * k;
          return { prompt: "The user types " + n + ". What is output?\n" + code("DECLARE Number : INTEGER", "INPUT Number", "OUTPUT Number * " + k),
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [n, n + k, k]),
            example: "Example: the user types 4, then INPUT Size and OUTPUT Size * 2 run.\nINPUT puts the typed value, 4, into Size.\nOUTPUT works out Size * 2 = 8 and shows 8.",
            working: ["INPUT stores the typed value in Number.", "Work out the OUTPUT line with that value."],
            note: n + " * " + k + " = " + r + "." };
        } },
      { id: "ex-08", category: "ex-io", randomize: function () {
          var name = drillPick(["Ana", "Ben", "Mai", "Tom", "Niran"]);
          return { prompt: "The user types " + name + ". What is output?\n" + code("DECLARE Name : STRING", "INPUT Name", "OUTPUT \"Hello \", Name"),
            answers: ["Hello " + name], keywords: [new RegExp("^\\s*[\"']?hello,?\\s+" + name + "[\"']?\\s*[.!]?\\s*$", "i")],
            distractors: ["Hello Name", name, "Hello"], format: "Type exactly what is output",
            example: "Example: the user types Lee, then OUTPUT \"Hi \", Person runs, where INPUT Person stored the value.\nText in quotes is shown exactly: Hi\nPerson has no quotes, so its value is shown: Lee. The output is Hi Lee.",
            working: ["Text in quotes is output exactly as it is.", "A name without quotes is a variable, so its value is output."],
            note: "Hello " + name };
        } },
      { id: "ex-09", category: "ex-io", randomize: function () {
          var a = pick(2, 6, []), b, r; do { b = pick(7, 12, []); r = b - a; } while (r === 7);
          return { prompt: "The user types " + a + ", then " + b + ". What is output?\n" + code("DECLARE First : INTEGER", "DECLARE Second : INTEGER", "INPUT First", "INPUT Second", "OUTPUT Second - First"),
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a - b, a + b, a]),
            example: "Example: the user types 3, then 10, for INPUT X then INPUT Y, then OUTPUT Y - X runs.\nThe lines run in order: the first value goes into X, the second into Y.\nSo X = 3, Y = 10, and Y - X = 7.",
            working: ["The first value typed goes into First. The second goes into Second.", "Then work out Second - First."],
            note: "First = " + a + ", Second = " + b + ", so " + b + " - " + a + " = " + r + "." };
        } },
      { id: "ex-10", category: "ex-io", randomize: function () {
          var v = drillPick(["Score", "Name", "Price", "City"]);
          return { prompt: "Write the line that takes a value from the user and stores it in " + v + ".",
            answers: ["INPUT " + v], keywords: [new RegExp("^\\s*INPUT\\s+" + v + "\\s*$", "i")],
            distractors: ["OUTPUT " + v, "DECLARE " + v, v + " <- INPUT"], format: "Type the whole line",
            example: "Example: take a value from the user and store it in Age.\nThe keyword that takes a value from the user comes first, then the variable's name:\nINPUT Age",
            working: ["Which keyword takes a value from the user?", "The keyword, then the variable's name."],
            note: "INPUT " + v };
        } }
    ];
  })()
});
