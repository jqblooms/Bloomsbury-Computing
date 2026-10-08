// Year 11, 8.1 L4 Do Now Extension: 8.1 L1 to L3 (variables, constants, data types, input and output, arithmetic
// operators with DIV and MOD).
// Loaded by Drills/index.html?drill=y11-8-1-ops-ext
// For students who finish the Do Now early: 10 questions across 8.1 so far, randomised. Every card has an `example`,
// a similar question worked through with different values, holding every rule and step needed, then two `working`
// nudges. An example never shows the card's own answer. Cambridge pseudocode, every variable declared.
DrillData.register("y11-8-1-ops-ext", {
  title: "Year 11 Extension: Variables, Data Types and Arithmetic",
  subtitle: "8.1 L4 Do Now Extension",
  categories: [
    ["ex-vc", "Variables and Constants (8.1 L1)"],
    ["ex-types", "Data Types, Input and Output (8.1 L2)"],
    ["ex-arith", "Arithmetic Operators (8.1 L3)"]
  ],
  cards: (function () {
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v !== n; }).concat([n + 1, n + 2, n + 3, n + 4]), 3); }
    function div(a, b) { return Math.trunc(a / b); }
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var ALL = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    function typeRe(t) { return new RegExp("^\\s*" + (t === "CHAR" ? "(CHAR|CHARACTER)" : t === "BOOLEAN" ? "BOOL(EAN)?" : t) + "\\s*$", "i"); }

    return [
      // ------------------------------------------------ 8.1 L1 Variables and constants
      { id: "ex-01", category: "ex-vc", randomize: function () {
          var a, b, c, r; do { a = pick(10, 20); b = pick(2, 5); c = pick(2, 4); r = (a - b) * c; } while (r === 12);
          return { prompt: "What is output?\n" + code("DECLARE Total : INTEGER", "Total <- " + a, "Total <- Total - " + b, "Total <- Total * " + c, "OUTPUT Total"),
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a - b, a * c - b, a]),
            example: "Example: Points <- 9, then Points <- Points - 3, then Points <- Points * 2.\nLine by line: Points is 9, then 9 - 3 = 6, then 6 * 2 = 12.\nEach new line replaces the old value, so it outputs 12.",
            working: ["Write the value of Total after each line.", "Each line uses the value from the line before."],
            note: a + " - " + b + " = " + (a - b) + ", then * " + c + " = " + r + "." };
        } },
      { id: "ex-02", category: "ex-vc", prompt: "Which keyword makes a value that cannot change while the program runs?", answers: ["CONSTANT"], keywords: [/^\s*constant\s*$/i],
        distractors: ["DECLARE", "INPUT", "OUTPUT"],
        example: "Example: which keyword takes a value from the user?\nLook at what each keyword does: DECLARE makes a variable, INPUT takes a value from the user, OUTPUT shows a value.\nSo the answer to the example is INPUT.",
        working: ["A variable can change. This value cannot.", "It is the opposite of a variable. Which keyword makes one?"],
        note: "CONSTANT makes a value that cannot change, for example CONSTANT Pi <- 3.142." },
      { id: "ex-03", category: "ex-vc", randomize: function () {
          var c = drillPick([["Rate", 5], ["Lives", 3], ["Max", 10]]), q = pick(2, 6), r = c[1] * q;
          return { prompt: "What is output?\n" + code("CONSTANT " + c[0] + " <- " + c[1], "DECLARE Answer : INTEGER", "Answer <- " + c[0] + " * " + q, "OUTPUT Answer"),
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [c[1] + q, c[1], q]),
            example: "Example: CONSTANT Fee <- 4, then Cost <- Fee * 7.\nA constant is used just like its value: Fee is 4.\nSo Cost = 4 * 7 = 28.",
            working: [c[0] + " is a constant. What value does it hold?", "Put that value into the Answer line."],
            note: c[1] + " * " + q + " = " + r + "." };
        } },
      // ------------------------------------------------ 8.1 L2 Data types, input and output
      { id: "ex-04", category: "ex-types", randomize: function () {
          var t = drillPick([["the number of pupils in a class", "INTEGER", "a whole number"], ["the price of a drink, such as 1.25", "REAL", "a number with a decimal point"],
            ["one letter, such as 'Y' or 'N'", "CHAR", "one character"], ["a pupil's full name", "STRING", "many characters"], ["whether a light is on", "BOOLEAN", "only TRUE or FALSE"]]);
          var ex = t[1] === "BOOLEAN" ? ["a height in metres, such as 1.65", "REAL", "a number with a decimal point"] : ["whether a door is locked", "BOOLEAN", "only TRUE or FALSE"];
          return { prompt: "Which data type is best for " + t[0] + "?",
            answers: [t[1]], keywords: [typeRe(t[1])], distractors: ALL.filter(function (x) { return x !== t[1]; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3),
            example: "Example: which data type is best for " + ex[0] + "?\nIt is " + ex[2] + ", so it is " + ex[1] + ".\nAsk in order: only TRUE or FALSE? A number? A decimal point? One character or many?",
            working: ["Is it only TRUE or FALSE? Is it a number? Does it have a decimal point?", "If it is text: one character, or many?"],
            note: t[1] + ": " + t[2] + "." };
        } },
      { id: "ex-05", category: "ex-types", randomize: function () {
          var v = drillPick([["Count", "INTEGER", "a whole number"], ["Cost", "REAL", "a number with a decimal point"], ["Grade", "CHAR", "one character"], ["Town", "STRING", "a word"]]);
          var ex = v[1] === "BOOLEAN" ? ["Height", "REAL", "a number with a decimal point"] : ["Found", "BOOLEAN", "TRUE or FALSE"];
          var tsrc = typeRe(v[1]).source.replace(/^\^\\s\*|\\s\*\$$/g, "");
          return { prompt: "Write the line that declares a variable called " + v[0] + " that stores " + v[2] + ".",
            answers: ["DECLARE " + v[0] + " : " + v[1]], keywords: [new RegExp("^\\s*DECLARE\\s+" + v[0] + "\\s*:\\s*" + tsrc + "\\s*$", "i")],
            distractors: ALL.filter(function (x) { return x !== v[1]; }).slice(0, 3).map(function (t) { return "DECLARE " + v[0] + " : " + t; }), format: "Type the whole line",
            example: "Example: declare a variable called " + ex[0] + " that stores " + ex[2] + ".\nStart with DECLARE, then the name, then a colon, then the data type:\nDECLARE " + ex[0] + " : " + ex[1],
            working: ["DECLARE, the name, a colon, then the data type.", "Which data type stores " + v[2] + "?"],
            note: "DECLARE " + v[0] + " : " + v[1] };
        } },
      { id: "ex-06", category: "ex-types", randomize: function () {
          var n, k, r; do { n = pick(3, 9); k = pick(2, 9); r = n + k; } while (r === 9);
          return { prompt: "The user types " + n + ". What is output?\n" + code("DECLARE Number : INTEGER", "INPUT Number", "Number <- Number + " + k, "OUTPUT Number"),
            answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [n, k, n * k]),
            example: "Example: the user types 6, then INPUT Size, Size <- Size + 3 and OUTPUT Size run.\nINPUT puts the typed value, 6, into Size. Then Size becomes 6 + 3 = 9.\nOUTPUT shows 9.",
            working: ["INPUT stores the typed value in Number.", "Then work out the next line with that value."],
            note: n + " + " + k + " = " + r + "." };
        } },
      // ------------------------------------------------ 8.1 L3 Arithmetic operators
      { id: "ex-07", category: "ex-arith", randomize: function () {
          var a = drillPick([2, 3, 5, 6]), b = a === 2 ? drillPick([3, 4, 5]) : 2, r = Math.pow(a, b);
          return { prompt: "What is " + a + " ^ " + b + "?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a * b, a + b, r + a]),
            example: "Example: 7 ^ 3. ^ means raised to the power of.\nWrite 7 three times and multiply: 7 * 7 * 7.\n7 * 7 = 49, then 49 * 7 = 343.",
            working: ["^ means raised to the power of.", "Write " + a + " " + b + " times, with * between each one."],
            note: a + " ^ " + b + " = " + r + "." };
        } },
      { id: "ex-08", category: "ex-arith", randomize: function () {
          var b = pick(3, 8), a, r;
          do { a = pick(13, 50); r = div(a, b); } while (a % b === 0 || r === 3);
          r = div(a, b);
          return { prompt: "What does DIV(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a % b, r + 1, b]),
            example: "Example: DIV(17, 5). How many full groups of 5 fit into 17?\n5, 10, 15 fit. 20 is too many. That is 3 full groups.\nDIV gives the quotient, so the example returns 3.",
            working: ["DIV: how many full groups of " + b + " fit into " + a + "?", "Count up in " + b + "s without going past " + a + "."],
            note: "DIV(" + a + ", " + b + ") = " + r + ": " + r + " full groups of " + b + "." };
        } },
      { id: "ex-09", category: "ex-arith", randomize: function () {
          var b = pick(3, 8), a, r;
          do { a = pick(13, 50); r = a % b; } while (a % b === 0 || r === 2);
          r = a % b;
          return { prompt: "What does MOD(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [div(a, b), r + 1, b]),
            example: "Example: MOD(17, 5). The full groups of 5 make 15.\n17 - 15 = 2 left over.\nMOD gives the remainder, so the example returns 2.",
            working: ["Find the full groups of " + b + " that fit into " + a + ".", "Take them away from " + a + ". What is left over?"],
            note: a + " - " + (div(a, b) * b) + " = " + r + " left over." };
        } },
      { id: "ex-10", category: "ex-arith", randomize: function () {
          var s, m;
          do { s = pick(65, 299); } while (s % 60 === 0 || div(s, 60) === 2);
          m = div(s, 60);
          return { prompt: "What is output?\n" + code("DECLARE Seconds : INTEGER", "DECLARE Minutes : INTEGER", "Seconds <- " + s, "Minutes <- DIV(Seconds, 60)", "OUTPUT Minutes"),
            answers: [String(m)], keywords: [drillNumberRe(m)], distractors: others(m, [s % 60, m + 1, s - 60]),
            example: "Example: Seconds <- 135, then Minutes <- DIV(Seconds, 60).\n60 and 120 fit into 135. 180 is too many.\nSo the example gives Minutes = 2.",
            working: ["DIV(Seconds, 60): how many full 60s fit into " + s + "?", "Count up in 60s without going past " + s + "."],
            note: "DIV(" + s + ", 60) = " + m + "." };
        } }
    ];
  })()
});
