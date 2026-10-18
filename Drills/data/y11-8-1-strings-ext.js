// Year 11, 8.1 L5 Do Now Extension: 8.1 L1 to L4 (variables, constants, data types, input and output, arithmetic
// operators, relational and logical operators).
// Loaded by Drills/index.html?drill=y11-8-1-strings-ext. Written by tools/build_y11_8_1_strings.mjs: edit the builder.
// For students who finish the Do Now early: 10 questions across 8.1 so far, randomised. Every card has an `example`,
// a similar question worked through with different values, then two `working` nudges. An example never shows
// the card's own answer. Cambridge pseudocode, every variable declared.
DrillData.register("y11-8-1-strings-ext", {
  title: "Year 11 Extension: Variables, Data Types and Operators",
  subtitle: "8.1 L5 Do Now Extension",
  categories: [
    ["ex-vc", "Variables and Constants (8.1 L1)"],
    ["ex-types", "Data Types, Input and Output (8.1 L2)"],
    ["ex-arith", "Arithmetic Operators (8.1 L3)"],
    ["ex-ops", "Relational and Logical Operators (8.1 L4)"]
  ],
  cards: (function () {
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function word(w) { return new RegExp("^\\s*" + w + "\\s*$", "i"); }
    // A text answer: capital letters matter, quote marks are optional.
    function text(s) { return new RegExp("^\\s*[\"'\u201c\u201d\u2018\u2019]?" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+") + "[\"'\u201c\u201d\u2018\u2019]?\\s*$"); }
    function tfText(b) { return b ? "TRUE" : "FALSE"; }
    function tfCard(b) { var a = tfText(b); return { answers: [a], keywords: [word(a)], distractors: [tfText(!b)] }; }
    // Every answer comes from running the program in the site's pseudocode engine.
    function run(src, vars) {
      var r = PseudocodeEngine.runPseudocode(src, vars || {}, 5000, []);
      if (r.error) throw new Error("Line " + r.error.line + ": " + r.error.message);
      return r.outputs;
    }
    function val(expr, vars) { return run("OUTPUT " + expr, vars)[0]; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v !== n && v >= 0; }).concat([n + 1, n + 2, n + 3, n + 4]), 3); }
    function uniq(answer, list) { var out = []; list.forEach(function (d) { if (d !== answer && out.indexOf(d) === -1 && out.length < 3) out.push(d); }); return out; }
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var WORDS = ["Computer", "Keyboard", "Monitor", "Printer", "Network", "Program", "Laptop", "Science", "Speaker", "Library"];
    function div(a, b) { return Math.trunc(a / b); }
    var ALL = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    function typeRe(t) { return new RegExp("^\\s*" + (t === "CHAR" ? "(CHAR|CHARACTER)" : t === "BOOLEAN" ? "BOOL(EAN)?" : t) + "\\s*$", "i"); }

    return [
      // ------------------------------------------------ 8.1 L1 Variables and constants
      { id: "ex-01", category: "ex-vc", randomize: function () {
          var a, b, c, r; do { a = pick(10, 20); b = pick(2, 5); c = pick(2, 4); r = val("(" + a + " - " + b + ") * " + c); } while (r === 12);
          var src = code("DECLARE Total : INTEGER", "Total <- " + a, "Total <- Total - " + b, "Total <- Total * " + c, "OUTPUT Total");
          r = run(src)[0];
          return { prompt: "What is output?\n" + src,
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
      // ------------------------------------------------ 8.1 L2 Data types, input and output
      { id: "ex-03", category: "ex-types", randomize: function () {
          var t = drillPick([["the number of pupils in a class", "INTEGER", "a whole number"], ["the price of a drink, such as 1.25", "REAL", "a number with a decimal point"],
            ["one letter, such as 'Y' or 'N'", "CHAR", "one character"], ["a pupil's full name", "STRING", "many characters"], ["whether a light is on", "BOOLEAN", "only TRUE or FALSE"]]);
          var ex = t[1] === "BOOLEAN" ? ["a height in metres, such as 1.65", "REAL", "a number with a decimal point"] : ["whether a door is locked", "BOOLEAN", "only TRUE or FALSE"];
          return { prompt: "Which data type is best for " + t[0] + "?",
            answers: [t[1]], keywords: [typeRe(t[1])], distractors: ALL.filter(function (x) { return x !== t[1]; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3),
            example: "Example: which data type is best for " + ex[0] + "?\nIt is " + ex[2] + ", so it is " + ex[1] + ".\nAsk in order: only TRUE or FALSE? A number? A decimal point? One character or many?",
            working: ["Is it only TRUE or FALSE? Is it a number? Does it have a decimal point?", "If it is text: one character, or many?"],
            note: t[1] + ": " + t[2] + "." };
        } },
      { id: "ex-04", category: "ex-types", randomize: function () {
          var v = drillPick([["Count", "INTEGER", "a whole number"], ["Cost", "REAL", "a number with a decimal point"], ["Grade", "CHAR", "one character"], ["Town", "STRING", "a word"]]);
          var ex = ["Found", "BOOLEAN", "TRUE or FALSE"];
          var tsrc = typeRe(v[1]).source.replace(/^\^\\s\*|\\s\*\$$/g, "");
          return { prompt: "Write the line that declares a variable called " + v[0] + " that stores " + v[2] + ".",
            answers: ["DECLARE " + v[0] + " : " + v[1]], keywords: [new RegExp("^\\s*DECLARE\\s+" + v[0] + "\\s*:\\s*" + tsrc + "\\s*$", "i")],
            distractors: ALL.filter(function (x) { return x !== v[1]; }).slice(0, 3).map(function (t) { return "DECLARE " + v[0] + " : " + t; }), format: "Type the whole line",
            example: "Example: declare a variable called " + ex[0] + " that stores " + ex[2] + ".\nStart with DECLARE, then the name, then a colon, then the data type:\nDECLARE " + ex[0] + " : " + ex[1],
            working: ["DECLARE, the name, a colon, then the data type.", "Which data type stores " + v[2] + "?"],
            note: "DECLARE " + v[0] + " : " + v[1] };
        } },
      // ------------------------------------------------ 8.1 L3 Arithmetic operators
      { id: "ex-05", category: "ex-arith", randomize: function () {
          var a = drillPick([2, 3, 5, 6]), b = a === 2 ? drillPick([3, 4, 5]) : 2, r = val(a + " ^ " + b);
          return { prompt: "What is " + a + " ^ " + b + "?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a * b, a + b, r + a]),
            example: "Example: 7 ^ 3. ^ means raised to the power of.\nWrite 7 three times and multiply: 7 * 7 * 7.\n7 * 7 = 49, then 49 * 7 = 343.",
            working: ["^ means raised to the power of.", "Write " + a + " " + b + " times, with * between each one."],
            note: a + " ^ " + b + " = " + r + "." };
        } },
      { id: "ex-06", category: "ex-arith", randomize: function () {
          var b = pick(3, 8), a, r;
          do { a = pick(13, 50); r = div(a, b); } while (a % b === 0 || r === 3);
          r = val("DIV(" + a + ", " + b + ")");
          return { prompt: "What does DIV(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [a % b, r + 1, b]),
            example: "Example: DIV(17, 5). How many full groups of 5 fit into 17?\n5, 10, 15 fit. 20 is too many. That is 3 full groups.\nDIV gives the quotient, so the example returns 3.",
            working: ["DIV: how many full groups of " + b + " fit into " + a + "?", "Count up in " + b + "s without going past " + a + "."],
            note: "DIV(" + a + ", " + b + ") = " + r + ": " + r + " full groups of " + b + "." };
        } },
      { id: "ex-07", category: "ex-arith", randomize: function () {
          var b = pick(3, 8), a, r;
          do { a = pick(13, 50); r = a % b; } while (a % b === 0 || r === 2);
          r = val("MOD(" + a + ", " + b + ")");
          return { prompt: "What does MOD(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [div(a, b), r + 1, b]),
            example: "Example: MOD(17, 5). The full groups of 5 make 15.\n17 - 15 = 2 left over.\nMOD gives the remainder, so the example returns 2.",
            working: ["Find the full groups of " + b + " that fit into " + a + ".", "Take them away from " + a + ". What is left over?"],
            note: a + " - " + (div(a, b) * b) + " = " + r + " left over." };
        } },
      // ------------------------------------------------ 8.1 L4 Relational and logical operators
      { id: "ex-08", category: "ex-ops", randomize: function () {
          var n = drillPick([18, 40, 50, 60]), op = drillPick([">", ">="]), v = drillPick([n - 1, n, n, n + 1]);
          var r = run(code("IF Mark " + op + " " + n + " THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { Mark: v })[0];
          var c = tfCard(r);
          c.prompt = "Mark is " + v + ". Is the condition Mark " + op + " " + n + " TRUE or FALSE?";
          c.example = "Example: Age is 12. Is Age >= 12 TRUE or FALSE?\n>= means greater than or equal to. 12 is equal to 12, so it counts.\nWith > instead, 12 is not greater than 12, so the answer would change.";
          c.working = [op + (op === ">" ? " means greater than." : " means greater than or equal to."), "Is " + v + " " + (op === ">" ? "greater than " : "greater than or equal to ") + n + "?"];
          c.note = v + " " + op + " " + n + " is " + tfText(r) + ".";
          return c;
        } },
      { id: "ex-09", category: "ex-ops", randomize: function () {
          var x = pick(1, 12), join = drillPick(["AND", "OR"]), lo = pick(3, 5), hi = pick(8, 10);
          var cond = join === "AND" ? "X > " + lo + " AND X < " + hi : "X < " + lo + " OR X > " + hi;
          var r = run(code("IF " + cond + " THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { X: x })[0];
          var c = tfCard(r);
          c.prompt = "X is " + x + ". Is the condition " + cond + " TRUE or FALSE?";
          c.example = "Example: Y is 4. Is Y > 2 AND Y < 3 TRUE or FALSE?\nWork out each side first: Y > 2 is TRUE, Y < 3 is FALSE.\nAND needs both sides, OR needs at least one. Here AND gives FALSE.";
          c.working = ["Work out each side of " + join + " on its own first.", join === "AND" ? "AND is TRUE only when both sides are TRUE." : "OR is TRUE when at least one side is TRUE."];
          c.note = cond + " is " + tfText(r) + " when X is " + x + ".";
          return c;
        } },
      { id: "ex-10", category: "ex-ops", randomize: function () {
          var v = drillPick([["Mark", 50], ["Score", 40], ["Points", 70], ["Height", 120]]), n = v[1], name = v[0];
          var ans = name + " >= " + n;
          return { prompt: "Write the condition: " + name + " is " + n + " or more.",
            answers: [ans], keywords: [new RegExp("^\\s*(" + name + "\\s*>=\\s*" + n + "|" + n + "\\s*<=\\s*" + name + "|" + name + "\\s*>\\s*" + (n - 1) + ")\\s*$", "i")],
            distractors: [name + " > " + n, name + " <= " + n, name + " = " + n], format: "Type the condition",
            example: "Example: Age is 16 or more.\n\"Or more\" includes 16 itself, so use >=, greater than or equal to.\nThe example is written Age >= 16.",
            working: ["\"Or more\" includes the number itself.", "Which operator means greater than or equal to?"],
            note: name + " >= " + n + " is TRUE for " + n + " and every value above it." };
        } }
    ];
  })()
});
