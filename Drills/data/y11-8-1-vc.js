// Year 11, 8.1 L1: Variables and Constants
// Loaded by Drills/index.html?drill=y11-8-1-vc
// What a variable and a constant are, tracing short programs that use them, choosing which one a value needs,
// and writing the DECLARE and CONSTANT lines. Cambridge pseudocode, every variable declared.
DrillData.register("y11-8-1-vc", {
  title: "Year 11, 8.1 L1: Variables and Constants",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["vc-words", "What They Are"],
    ["vc-trace", "Trace the Program"],
    ["vc-choose", "Variable or Constant?"],
    ["vc-write", "Write the Line"]
  ],
  cards: (function () {
    var VAR = /^\s*(an?\s+)?variables?\s*\.?\s*$/i;
    var CON = /^\s*(an?\s+)?constants?\s*\.?\s*$/i;
    function n(x) { return new RegExp("^\\s*" + String(x).replace(".", "\\.") + "\\s*$"); }
    // Wrong options for a number answer: never the answer itself, never twice.
    function wrong(answer, list) {
      var out = [];
      list.forEach(function (x) { x = String(x); if (x !== String(answer) && out.indexOf(x) < 0) out.push(x); });
      return out;
    }

    // Values from a real exam scenario and everyday programs: [description, variable or constant, reason].
    var VALUES = [
      ["The price of an adult meal, which is always $9.99.", "c", "It is the same every time the program runs."],
      ["The number of adults at a table, typed in by the waiter.", "v", "It is different for every table."],
      ["The total cost of a table's meal.", "v", "It is worked out again for every table."],
      ["The 15% discount for tables of 6 or more.", "c", "It is the same for every table."],
      ["A player's score, which goes up during the game.", "v", "It changes while the program runs."],
      ["The number of seconds in a minute: 60.", "c", "It never changes."],
      ["The number of lives a player starts with: always 3.", "c", "It is the same for every game."],
      ["The number of lives a player has left.", "v", "It goes down while the game runs."],
      ["The name a user types in.", "v", "It is different for each user."],
      ["The highest mark allowed on a test: 100.", "c", "It is the same for every test."]
    ];
    var NAMES = [["Score", 4], ["Lives", 3], ["Coins", 5], ["Points", 2]];

    return [
      // ------------------------------------------------ What They Are
      { id: "vc-01", category: "vc-words", prompt: "A named value that CAN change while the program runs. Is it a variable or a constant?", answers: ["Variable"],
        keywords: [VAR], distractors: ["Constant", "Array"], note: "A variable: its value can change (vary) while the program runs." },
      { id: "vc-02", category: "vc-words", prompt: "A named value that CANNOT change while the program runs. Is it a variable or a constant?", answers: ["Constant"],
        keywords: [CON], distractors: ["Variable", "Array"], note: "A constant: its value stays the same while the program runs." },
      { id: "vc-03", category: "vc-words", prompt: "Which keyword starts the line that makes a constant?", answers: ["CONSTANT"],
        keywords: [/^\s*constant\s*$/i], distractors: ["DECLARE", "OUTPUT"], note: "CONSTANT Pi <- 3.142" },
      { id: "vc-04", category: "vc-words", prompt: "Which keyword starts the line that makes a variable?", answers: ["DECLARE"],
        keywords: [/^\s*declare\s*$/i], distractors: ["CONSTANT", "INPUT"], note: "DECLARE Score : INTEGER" },
      { id: "vc-05", category: "vc-words", prompt: "Give one reason to use a constant instead of typing the same value many times.", answers: ["You only change it in one place"],
        keywords: [/\b(one|1|single)\s+(place|line)|\bonce\b|by\s+mistake|accident|\bcannot\s+(be\s+)?chang|can'?t\s+(be\s+)?chang|easier\s+to\s+(change|update)|same\s+value\s+everywhere/i],
        distractors: ["It makes the program run longer", "Its value can go up and down", "It makes the value change"],
        note: "Change the value in one line and every use updates. It also cannot be changed by mistake while the program runs." },

      // ------------------------------------------------ Trace the Program
      { id: "vc-06", category: "vc-trace", randomize: function () {
          var p = drillPick(NAMES), a = p[1], b = drillPick([1, 2, 3]), c = drillPick([2, 4, 5]);
          var out = a + b + c;
          return { prompt: "What is output?\nDECLARE " + p[0] + " : INTEGER\n" + p[0] + " <- " + a + "\n" + p[0] + " <- " + p[0] + " + " + b + "\n" + p[0] + " <- " + p[0] + " + " + c + "\nOUTPUT " + p[0],
            answers: [String(out)], keywords: [n(out)], distractors: wrong(out, [c, a + b, a, out + 1]),
            working: ["Write the value after each line.", "Each new line uses the value from the line before."],
            note: p[0] + " goes " + a + ", then " + (a + b) + ", then " + out + "." };
        } },
      { id: "vc-07", category: "vc-trace", randomize: function () {
          var price = drillPick([2, 3, 5, 6]), qty = drillPick([2, 3, 4]);
          return { prompt: "What is output?\nCONSTANT Price <- " + price + "\nDECLARE Total : INTEGER\nTotal <- Price * " + qty + "\nOUTPUT Total",
            answers: [String(price * qty)], keywords: [n(price * qty)], distractors: wrong(price * qty, [price + qty, price, qty, price * qty + price]),
            working: ["Price is a constant. Find its value on line 1.", "Then work out line 3."],
            note: "Total = " + price + " * " + qty + " = " + (price * qty) + "." };
        } },
      { id: "vc-08", category: "vc-trace", randomize: function () {
          var start = drillPick([3, 4, 5]), times = drillPick([2, 3]);
          return { prompt: "What is output?\nDECLARE Lives : INTEGER\nDECLARE Count : INTEGER\nLives <- " + start + "\nFOR Count <- 1 TO " + times + "\n  Lives <- Lives - 1\nNEXT Count\nOUTPUT Lives",
            answers: [String(start - times)], keywords: [n(start - times)], distractors: wrong(start - times, [start, start - 1, times, start + times]),
            working: ["The loop runs " + "the line inside it more than once.", "Take 1 away each time the loop runs."],
            note: "The loop runs " + times + " times, so Lives goes from " + start + " to " + (start - times) + "." };
        } },
      { id: "vc-09", category: "vc-trace", prompt: "Which line has an error?\n1  CONSTANT MaxScore <- 100\n2  DECLARE Score : INTEGER\n3  Score <- 0\n4  MaxScore <- 50\n5  OUTPUT Score",
        answers: ["4"], keywords: [/^\s*(line\s*)?4\s*$/i], distractors: ["1", "3", "5"],
        working: ["Find the constant.", "Is there a line that tries to give it a new value?"],
        note: "Line 4 tries to change MaxScore, but MaxScore is a constant." },
      { id: "vc-10", category: "vc-trace", prompt: "Which line has an error?\n1  DECLARE Total : INTEGER\n2  CONSTANT Bonus <- 10\n3  Total <- 5\n4  Bonus <- Bonus + 1\n5  OUTPUT Total + Bonus",
        answers: ["4"], keywords: [/^\s*(line\s*)?4\s*$/i], distractors: ["2", "3", "5"],
        working: ["Which name was made with CONSTANT?", "Look for a line that gives that name a new value."],
        note: "Line 4 tries to change Bonus, but Bonus is a constant." },

      // ------------------------------------------------ Variable or Constant?
      { id: "vc-11", category: "vc-choose", randomize: function () {
          var s = drillPick(VALUES), isC = s[1] === "c";
          return { prompt: s[0] + " Should it be stored in a variable or a constant?", answers: [isC ? "Constant" : "Variable"],
            keywords: [isC ? CON : VAR], distractors: [isC ? "Variable" : "Constant", "Array"],
            working: ["Ask: can this value change while the program runs?"],
            note: (isC ? "Constant: " : "Variable: ") + s[2] };
        } },
      { id: "vc-12", category: "vc-choose", randomize: function () {
          var s = drillPick(VALUES.filter(function (x) { return x[1] === "c"; }));
          return { prompt: s[0] + " Why should this be a constant?", answers: ["It does not change while the program runs"],
            keywords: [/(not|never|n't|doesn'?t|does\s+not|won'?t|cannot|can'?t)\s+(\w+\s+)?chang|(stays?|always|is)\s+(\w+\s+)?(the\s+)?same|same\s+(every|each|for|all)|fixed|\balways\b/i],
            distractors: ["It changes every time the program runs again", "It is typed in by the user", "It goes up during the program"],
            working: ["Does this value ever change while the program runs?"],
            note: s[2] };
        } },
      { id: "vc-13", category: "vc-choose", randomize: function () {
          var s = drillPick(VALUES.filter(function (x) { return x[1] === "v"; }));
          return { prompt: s[0] + " Why should this be a variable?", answers: ["It can change while the program runs"],
            keywords: [/^(?!.*\b(not|never|n't|cannot)\b).*(chang|differ|goes\s+(up|down)|go\s+(up|down)|\btyp(e|es|ed|ing)\b|input|enter|vary|varies|each\s+(time|table|user|game))/i],
            distractors: ["It stays the same for every user", "It never changes while the program runs", "It is fixed when the program is written"],
            working: ["Is it the same every time, or can it change?"],
            note: s[2] };
        } },

      // ------------------------------------------------ Write the Line
      { id: "vc-14", category: "vc-write", randomize: function () {
          var c = drillPick([["AdultPrice", "9.99"], ["ChildPrice", "6.99"], ["MaxLives", "3"], ["Pi", "3.142"], ["MinutesInHour", "60"]]);
          return { prompt: "Write the line that makes a constant called " + c[0] + " with the value " + c[1] + ".", answers: ["CONSTANT " + c[0] + " <- " + c[1]],
            keywords: [new RegExp("^\\s*CONSTANT\\s+" + c[0] + "\\s*(<-|\\u2190|=)\\s*" + c[1].replace(".", "\\.") + "\\s*$", "i")],
            distractors: ["DECLARE " + c[0] + " : REAL", c[0] + " <- " + c[1], "CONSTANT " + c[0] + " : " + c[1]],
            working: ["Start with the keyword that makes a constant.", "Then the name, an arrow, and the value."],
            format: "Type the whole line",
            note: "CONSTANT " + c[0] + " <- " + c[1] };
        } },
      { id: "vc-15", category: "vc-write", randomize: function () {
          var v = drillPick([["Adults", "INTEGER", "whole number"], ["Score", "INTEGER", "whole number"], ["TotalCost", "REAL", "number with a decimal point"], ["Height", "REAL", "number with a decimal point"]]);
          return { prompt: "Write the line that declares a variable called " + v[0] + " that stores a " + v[2] + ".", answers: ["DECLARE " + v[0] + " : " + v[1]],
            keywords: [new RegExp("^\\s*DECLARE\\s+" + v[0] + "\\s*:\\s*" + v[1] + "\\s*$", "i")],
            distractors: ["CONSTANT " + v[0] + " : " + v[1], "DECLARE " + v[0] + " <- " + v[1], v[0] + " : " + v[1]],
            working: ["Start with the keyword that makes a variable.", "Then the name, a colon, and the data type: INTEGER for whole numbers, REAL for decimals."],
            format: "Type the whole line",
            note: "DECLARE " + v[0] + " : " + v[1] };
        } },
      { id: "vc-16", category: "vc-write", randomize: function () {
          var v = drillPick([["Adults", 4], ["Lives", 3], ["Score", 0], ["Coins", 10]]);
          return { prompt: "The variable " + v[0] + " has been declared. Write the line that stores " + v[1] + " in it.", answers: [v[0] + " <- " + v[1]],
            keywords: [new RegExp("^\\s*" + v[0] + "\\s*(<-|\\u2190|=)\\s*" + v[1] + "\\s*$", "i")],
            distractors: [v[1] + " <- " + v[0], "DECLARE " + v[0] + " <- " + v[1], "CONSTANT " + v[0] + " <- " + v[1]],
            working: ["The name goes on the left of the arrow.", "The value goes on the right."],
            format: "Type the whole line",
            note: v[0] + " <- " + v[1] };
        } }
    ];
  })()
});
