// Year 11, 8.1 L4: Relational and Logical Operators (Plenary)
// Loaded by Drills/index.html?drill=y11-8-1-ops
// The six relational operators (= < <= > >= <>), the value on the line (> and >=), the logical operators AND, OR and
// NOT, and writing conditions. Every value is drawn fresh; every TRUE or FALSE is worked out the way the program
// runs it. Cambridge pseudocode, every variable declared, IF ... THEN on one line.
DrillData.register("y11-8-1-ops", {
  title: "Year 11, 8.1 L4: Relational and Logical Operators",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["op-rel", "Relational Operators"],
    ["op-line", "The Value on the Line"],
    ["op-logic", "AND, OR and NOT"],
    ["op-write", "Write the Condition"]
  ],
  cards: (function () {
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function word(w) { return new RegExp("^\\s*" + w + "\\s*$", "i"); }
    function tfText(b) { return b ? "TRUE" : "FALSE"; }
    function tfCard(b) { var a = tfText(b); return { answers: [a], keywords: [word(a)], distractors: [tfText(!b)] }; }
    var REL = {
      "=": ["equal to", function (a, b) { return a === b; }],
      "<": ["less than", function (a, b) { return a < b; }],
      "<=": ["less than or equal to", function (a, b) { return a <= b; }],
      ">": ["greater than", function (a, b) { return a > b; }],
      ">=": ["greater than or equal to", function (a, b) { return a >= b; }],
      "<>": ["not equal to", function (a, b) { return a !== b; }]
    };
    var OPS = ["=", "<", "<=", ">", ">=", "<>"];
    function opRe(op) { return new RegExp("^\\s*" + op + "\\s*$"); }
    function others(op) { return OPS.filter(function (o) { return o !== op; }).sort(function () { return Math.random() - 0.5; }).slice(0, 3); }
    var S = "\\s*";
    function either(a, b, join) { return new RegExp("^\\s*((" + a + ")\\s+" + join + "\\s+(" + b + ")|(" + b + ")\\s+" + join + "\\s+(" + a + "))\\s*$", "i"); }

    return [
      // ------------------------------------------------ Relational operators
      { id: "rel-01", category: "op-rel", randomize: function () {
          var op = drillPick(OPS);
          return { prompt: "Which relational operator means " + REL[op][0] + "?", answers: [op], keywords: [opRe(op)], distractors: others(op),
            working: ["There are six: = < <= > >= <>", "Read each symbol: less, greater, equal. Some use two symbols."],
            note: op + " means " + REL[op][0] + "." };
        } },
      { id: "rel-02", category: "op-rel", randomize: function () {
          var op = drillPick(["<=", ">=", "<>"]), wrong = OPS.filter(function (o) { return o !== op; }).slice(0, 3).map(function (o) { return REL[o][0]; });
          return { prompt: "What does the operator " + op + " mean?", answers: [REL[op][0]], keywords: [word(REL[op][0].replace(/ /g, "\\s+"))], distractors: wrong,
            working: ["Read the symbols one at a time.", "< is less than, > is greater than, = is equal to."],
            note: op + " means " + REL[op][0] + "." };
        } },
      { id: "rel-03", category: "op-rel", randomize: function () {
          var op = drillPick(["<", ">", "<=", ">="]), a = pick(3, 30), b = pick(3, 30, [a]), r = REL[op][1](a, b);
          var c = tfCard(r);
          c.prompt = "Score is " + a + ". Is the condition Score " + op + " " + b + " TRUE or FALSE?";
          c.working = [op + " means " + REL[op][0] + ".", "Is " + a + " " + REL[op][0] + " " + b + "?"];
          c.note = a + " " + op + " " + b + " is " + tfText(r) + ".";
          return c;
        } },
      { id: "rel-04", category: "op-rel", randomize: function () {
          var op = drillPick(["=", "<>"]), a = pick(2, 9), b = drillPick([a, pick(2, 9, [a])]), r = REL[op][1](a, b);
          var c = tfCard(r);
          c.prompt = "Guess is " + a + ". Is the condition Guess " + op + " " + b + " TRUE or FALSE?";
          c.working = [op + " means " + REL[op][0] + ".", "Is " + a + " " + REL[op][0] + " " + b + "?"];
          c.note = a + " " + op + " " + b + " is " + tfText(r) + ".";
          return c;
        } },
      { id: "rel-05", category: "op-rel", randomize: function () {
          var t = pick(10, 40, [25]), out = t < 25 ? "Cold" : "Warm";
          return { prompt: "The user types " + t + ". What is output?\n" + code("DECLARE Temp : INTEGER", "INPUT Temp", "IF Temp < 25 THEN", "  OUTPUT \"Cold\"", "ELSE", "  OUTPUT \"Warm\"", "ENDIF"),
            answers: [out], keywords: [word(out)], distractors: [out === "Cold" ? "Warm" : "Cold", "Cold Warm"], format: "Type exactly what is output",
            example: "Example: the user types 30 for a program with IF Speed < 50 THEN OUTPUT \"Slow\" ELSE OUTPUT \"Fast\".\nIs 30 less than 50? Yes, so the condition is TRUE.\nTRUE runs the THEN part: the output is Slow.",
            working: ["< means less than. Is " + t + " less than 25?", "TRUE runs the THEN part. FALSE runs the ELSE part."],
            note: t + " < 25 is " + tfText(t < 25) + ", so the output is " + out + "." };
        } },

      // ------------------------------------------------ The value on the line
      { id: "line-01", category: "op-line", randomize: function () {
          var n = drillPick([18, 40, 50, 60, 100]), op = drillPick([">", ">="]), r = REL[op][1](n, n);
          var c = tfCard(r);
          c.prompt = "Mark is " + n + ". Is the condition Mark " + op + " " + n + " TRUE or FALSE?";
          c.working = [op + " means " + REL[op][0] + ".", "Is " + n + " " + REL[op][0] + " " + n + "?"];
          c.note = n + " " + op + " " + n + " is " + tfText(r) + (op === ">" ? ": " + n + " is not greater than itself." : ": " + n + " is equal to " + n + ".");
          return c;
        } },
      { id: "line-02", category: "op-line", randomize: function () {
          var n = drillPick([10, 20, 30, 50]), op = drillPick(["<", "<="]), r = REL[op][1](n, n);
          var c = tfCard(r);
          c.prompt = "Speed is " + n + ". Is the condition Speed " + op + " " + n + " TRUE or FALSE?";
          c.working = [op + " means " + REL[op][0] + ".", "Is " + n + " " + REL[op][0] + " " + n + "?"];
          c.note = n + " " + op + " " + n + " is " + tfText(r) + ".";
          return c;
        } },
      { id: "line-03", category: "op-line", randomize: function () {
          var n = drillPick([18, 40, 50, 60]);
          return { prompt: "A pass is " + n + " or more. Which operator goes in the gap?\nIF Mark ___ " + n + " THEN", answers: [">="], keywords: [opRe(">=")], distractors: [">", "<=", "="],
            working: ["\"or more\" includes " + n + " itself.", "Which operator is greater than, or equal to?"],
            note: n + " or more: Mark >= " + n + ". Mark > " + n + " would leave out " + n + " itself." };
        } },
      { id: "line-04", category: "op-line", randomize: function () {
          var n = drillPick([5, 10, 12, 20]);
          return { prompt: "A ticket is free for a child aged " + n + " or less. Which operator goes in the gap?\nIF Age ___ " + n + " THEN", answers: ["<="], keywords: [opRe("<=")], distractors: ["<", ">=", "<>"],
            working: ["\"or less\" includes " + n + " itself.", "Which operator is less than, or equal to?"],
            note: n + " or less: Age <= " + n + ". Age < " + n + " would leave out " + n + " itself." };
        } },
      { id: "line-05", category: "op-line", randomize: function () {
          var n = drillPick([40, 50, 60]), m = drillPick([n - 1, n, n]), out = m >= n ? "Pass" : "Fail";
          return { prompt: "The user types " + m + ". What is output?\n" + code("DECLARE Mark : INTEGER", "INPUT Mark", "IF Mark >= " + n + " THEN", "  OUTPUT \"Pass\"", "ELSE", "  OUTPUT \"Fail\"", "ENDIF"),
            answers: [out], keywords: [word(out)], distractors: [out === "Pass" ? "Fail" : "Pass", "Pass Fail"], format: "Type exactly what is output",
            example: "Example: the user types 30 for IF Score >= 30 THEN OUTPUT \"Win\" ELSE OUTPUT \"Lose\".\n>= means greater than or equal to. 30 is equal to 30, so the condition is TRUE.\nTRUE runs the THEN part: the output is Win.",
            working: [">= means greater than or equal to.", "Is " + m + " greater than " + n + ", or equal to " + n + "?"],
            note: m + " >= " + n + " is " + tfText(m >= n) + ", so the output is " + out + "." };
        } },

      // ------------------------------------------------ AND, OR and NOT
      { id: "log-01", category: "op-logic", randomize: function () {
          var lo = pick(5, 15), hi = lo + pick(5, 15), x = drillPick([pick(1, lo - 1), pick(lo + 1, hi - 1), pick(hi + 1, hi + 10)]), r = x > lo && x < hi;
          var c = tfCard(r);
          c.prompt = "X is " + x + ". Is the condition X > " + lo + " AND X < " + hi + " TRUE or FALSE?";
          c.working = ["Work out X > " + lo + ". Then work out X < " + hi + ".", "AND needs both sides to hold."];
          c.note = "X > " + lo + " is " + tfText(x > lo) + ", X < " + hi + " is " + tfText(x < hi) + ". AND gives " + tfText(r) + ".";
          return c;
        } },
      { id: "log-02", category: "op-logic", randomize: function () {
          var a = pick(2, 8), b = pick(9, 15), x = drillPick([a, b, pick(16, 30), pick(16, 30)]), r = x === a || x === b;
          var c = tfCard(r);
          c.prompt = "Day is " + x + ". Is the condition Day = " + a + " OR Day = " + b + " TRUE or FALSE?";
          c.working = ["Work out each side: Day = " + a + ", then Day = " + b + ".", "OR needs at least one side to hold."];
          c.note = "Day = " + a + " is " + tfText(x === a) + ", Day = " + b + " is " + tfText(x === b) + ". OR gives " + tfText(r) + ".";
          return c;
        } },
      { id: "log-03", category: "op-logic", randomize: function () {
          var n = pick(3, 20), x = drillPick([n, pick(3, 20, [n])]), r = !(x === n);
          var c = tfCard(r);
          c.prompt = "Lives is " + x + ". Is the condition NOT Lives = " + n + " TRUE or FALSE?";
          c.working = ["Work out Lives = " + n + " first.", "NOT changes that answer to the other one."];
          c.note = "Lives = " + n + " is " + tfText(x === n) + ". NOT changes it to " + tfText(r) + ".";
          return c;
        } },
      { id: "log-04", category: "op-logic", prompt: "Which logical operator gives TRUE only when both conditions are TRUE?", answers: ["AND"], keywords: [word("AND")], distractors: ["OR", "NOT", "<>"],
        working: ["There are three logical operators: AND, OR and NOT.", "Which one needs both?"],
        note: "AND: both conditions must be TRUE." },
      { id: "log-05", category: "op-logic", prompt: "Which logical operator gives TRUE when at least one condition is TRUE?", answers: ["OR"], keywords: [word("OR")], distractors: ["AND", "NOT", "="],
        working: ["There are three logical operators: AND, OR and NOT.", "Which one is happy with either side?"],
        note: "OR: one TRUE condition is enough." },
      { id: "log-06", category: "op-logic", randomize: function () {
          var age = drillPick([pick(5, 12), pick(13, 19), pick(13, 19), pick(20, 40)]), out = age >= 13 && age <= 19 ? "Teen" : "Not teen";
          return { prompt: "The user types " + age + ". What is output?\n" + code("DECLARE Age : INTEGER", "INPUT Age", "IF Age >= 13 AND Age <= 19 THEN", "  OUTPUT \"Teen\"", "ELSE", "  OUTPUT \"Not teen\"", "ENDIF"),
            answers: [out], keywords: [word(out.replace(" ", "\\s+"))], distractors: [out === "Teen" ? "Not teen" : "Teen", "Teen Not teen"], format: "Type exactly what is output",
            example: "Example: the user types 70 for IF Mark >= 0 AND Mark <= 100 THEN OUTPUT \"OK\" ELSE OUTPUT \"Error\".\n70 >= 0 holds. 70 <= 100 holds. Both hold, so AND gives TRUE.\nTRUE runs the THEN part: the output is OK.",
            working: ["Work out Age >= 13. Then work out Age <= 19.", "AND needs both. Then choose the THEN part or the ELSE part."],
            note: "Age >= 13 is " + tfText(age >= 13) + ", Age <= 19 is " + tfText(age <= 19) + ", so the output is " + out + "." };
        } },

      // ------------------------------------------------ Write the condition
      { id: "wr-01", category: "op-write", randomize: function () {
          var n = drillPick([16, 18, 21]);
          return { prompt: "Write the condition: Age is " + n + " or more.", answers: ["Age >= " + n],
            keywords: [new RegExp("^\\s*(Age" + S + ">=" + S + n + "|" + n + S + "<=" + S + "Age|Age" + S + ">" + S + (n - 1) + ")\\s*$", "i")],
            distractors: ["Age > " + n, "Age <= " + n, "Age = " + n], format: "Type the condition",
            example: "Example: Score is 10 or more.\nThe variable, then the operator, then the number. \"or more\" includes 10 itself:\nScore >= 10",
            working: ["\"or more\" includes " + n + " itself.", "The variable, then the operator, then the number."],
            note: "Age >= " + n };
        } },
      { id: "wr-02", category: "op-write", randomize: function () {
          var n = pick(3, 9);
          return { prompt: "Write the condition: Answer is not equal to " + n + ".", answers: ["Answer <> " + n],
            keywords: [new RegExp("^\\s*(Answer" + S + "<>" + S + n + "|" + n + S + "<>" + S + "Answer|NOT\\s+Answer" + S + "=" + S + n + ")\\s*$", "i")],
            distractors: ["Answer = " + n, "Answer < " + n, "Answer > " + n], format: "Type the condition",
            example: "Example: Colour is not equal to 2.\nThe operator for not equal to is two symbols, < then >:\nColour <> 2",
            working: ["Which operator means not equal to?", "The variable, then the operator, then the number."],
            note: "Answer <> " + n };
        } },
      { id: "wr-03", category: "op-write", randomize: function () {
          var lo = drillPick([1, 0, 5]), hi = drillPick([10, 20, 50]);
          var a = "Score" + S + ">=" + S + lo + "|" + lo + S + "<=" + S + "Score|Score" + S + ">" + S + (lo - 1);
          var b = "Score" + S + "<=" + S + hi + "|" + hi + S + ">=" + S + "Score|Score" + S + "<" + S + (hi + 1);
          return { prompt: "Write the condition: Score is from " + lo + " to " + hi + ", including " + lo + " and " + hi + ".", answers: ["Score >= " + lo + " AND Score <= " + hi],
            keywords: [either(a, b, "AND")],
            distractors: ["Score >= " + lo + " OR Score <= " + hi, "Score > " + lo + " AND Score < " + hi, "Score <= " + lo + " AND Score >= " + hi], format: "Type the condition",
            example: "Example: Level is from 2 to 8, including 2 and 8.\nBetween two numbers means two conditions, and both must hold, so join them with AND.\nLevel >= 2 AND Level <= 8",
            working: ["Between two numbers: two conditions joined with AND.", "\"Including\" means use >= and <=."],
            note: "Score >= " + lo + " AND Score <= " + hi };
        } },
      { id: "wr-04", category: "op-write", randomize: function () {
          var a = pick(1, 4), b = a + pick(1, 4);
          return { prompt: "Write the condition: Choice is " + a + " or Choice is " + b + ".", answers: ["Choice = " + a + " OR Choice = " + b],
            keywords: [either("Choice" + S + "=" + S + a, "Choice" + S + "=" + S + b, "OR")],
            distractors: ["Choice = " + a + " AND Choice = " + b, "Choice = " + a + " OR " + b, "Choice <> " + a + " OR Choice <> " + b], format: "Type the condition",
            example: "Example: Key is 5 or Key is 9.\nEither one is enough, so join two whole conditions with OR. Write Key and = both times:\nKey = 5 OR Key = 9",
            working: ["Either one is enough: which logical operator?", "Each side is a whole condition: the variable, =, the number."],
            note: "Choice = " + a + " OR Choice = " + b };
        } }
    ];
  })()
});
