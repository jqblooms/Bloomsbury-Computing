// Year 8, Revision 2: Do Now Extension
// Loaded by Drills/index.html?drill=y8-revision-2-ext
// For students who finish the Do Now early: harder questions on Revision 1 (sequence, selection, FOR loops and
// flowcharts), written fresh. Every card has an `example`, a similar question worked through with different names and
// numbers, holding every rule and step needed; then two `working` nudges as help fades. An example never shows the
// card's own answer. Every answer that comes from a program is worked out by running it in the pseudocode engine.
DrillData.register("y8-revision-2-ext", {
  title: "Year 8 Extension: Revision 1 Challenge",
  subtitle: "Revision 2 Do Now Extension",
  categories: [
    ["x2-seq", "Sequence"],
    ["x2-sel", "Selection"],
    ["x2-loop", "Loops"],
    ["x2-flow", "Flowcharts"]
  ],
  cards: (function () {
    function n(x) { return new RegExp("^\\s*" + x + "\\s*$"); }
    function word(w) { return new RegExp("^\\s*[\"']?\\s*" + w + "\\s*[\"']?\\s*[.!]?\\s*$", "i"); }
    function wrong(answer, list) {
      var out = [];
      list.forEach(function (x) { x = String(x); if (x !== String(answer) && out.indexOf(x) < 0) out.push(x); });
      return out;
    }
    function out(lines, inputs) {
      var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(String);
    }

    return [
      // ------------------------------------------------ Sequence
      { id: "x2-01", category: "x2-seq", randomize: function () {
          var a = drillPick([3, 4, 6]), b = drillPick([7, 8, 9]);
          var lines = ["DECLARE A : INTEGER", "DECLARE B : INTEGER", "A <- " + a, "B <- " + b, "A <- B", "B <- A", "OUTPUT A + B"];
          var ans = out(lines)[0];
          return { prompt: "What is output?\n" + lines.join("\n"),
            answers: [ans], keywords: [n(ans)], distractors: wrong(ans, [a + b, a * 2, b]),
            example: "Example: P <- 2, Q <- 5, P <- Q, Q <- P, OUTPUT P + Q.\nStep 1: after the first two lines, P is 2 and Q is 5.\nStep 2: P <- Q copies Q into P, so P is 5. The old 2 is gone.\nStep 3: Q <- P copies the NEW P into Q, so Q is still 5.\nStep 4: P + Q = 5 + 5 = 10.\nRule: a new value replaces the old one. Each line uses the values from the line before it.",
            working: ["Write A and B after every line.", "After line 5, the old value of A is gone."],
            note: "Both A and B end up as " + b + ", so the output is " + ans + "." };
        } },
      { id: "x2-02", category: "x2-seq", randomize: function () {
          var x = drillPick([4, 5, 6, 7]), m = drillPick([2, 3]), s = drillPick([1, 2, 3]);
          var lines = ["DECLARE Num : INTEGER", "INPUT Num", "Num <- Num * " + m, "Num <- Num - " + s, "OUTPUT Num"];
          var ans = out(lines, [x])[0];
          return { prompt: "The user types " + x + ". What is output?\n" + lines.join("\n"),
            answers: [ans], keywords: [n(ans)], distractors: wrong(ans, [x * m, x - s, (x - s) * m]),
            example: "Example: the user types 9. Val <- Val * 4, then Val <- Val - 10, then OUTPUT Val.\nStep 1: INPUT puts 9 in Val.\nStep 2: Val <- Val * 4: 9 * 4 = 36.\nStep 3: Val <- Val - 10 uses the NEW value: 36 - 10 = 26.\nRule: do the lines in order, top to bottom. Each line uses the newest value.",
            working: ["Do line 3 first: multiply.", "Then take away, using the new value."],
            note: x + " * " + m + " = " + (x * m) + ", then - " + s + " = " + ans + "." };
        } },

      // ------------------------------------------------ Selection
      { id: "x2-03", category: "x2-sel", randomize: function () {
          var a = drillPick([3, 5, 6, 8]), b = drillPick([2, 4, 7]);
          var lines = ["DECLARE A : INTEGER", "DECLARE B : INTEGER", "DECLARE Total : INTEGER", "INPUT A", "INPUT B", "Total <- A + B", "IF Total >= 10 THEN", "  OUTPUT \"Team\"", "ELSE", "  OUTPUT \"Solo\"", "ENDIF"];
          var ans = out(lines, [a, b])[0];
          return { prompt: "The user types " + a + ", then " + b + ". What is output?\n" + lines.join("\n"),
            answers: [ans], keywords: [word(ans)], distractors: [ans === "Team" ? "Solo" : "Team", "Team and Solo"],
            example: "Example: the user types 4, then 3. Sum <- X + Y, then IF Sum > 7 THEN OUTPUT \"Up\" ELSE OUTPUT \"Down\".\nStep 1: X is 4 and Y is 3, so Sum = 4 + 3 = 7.\nStep 2: is 7 > 7? No: 7 is not more than 7. FALSE.\nStep 3: FALSE runs the ELSE line: Down.\nRule: work out the total first. > means more than. >= means more than or equal to.",
            working: ["Work out Total on line 6 first.", "Then ask: is Total more than or equal to 10?"],
            note: a + " + " + b + " = " + (a + b) + ". " + (a + b) + " >= 10 is " + (a + b >= 10 ? "TRUE" : "FALSE") + ", so " + ans + "." };
        } },
      { id: "x2-04", category: "x2-sel", randomize: function () {
          var t = drillPick([0, 5, 10, 15]), lim = drillPick([5, 10]);
          var lines = ["DECLARE Temp : INTEGER", "INPUT Temp", "IF Temp < " + lim + " THEN", "  OUTPUT \"Coat\"", "ELSE", "  OUTPUT \"Shirt\"", "ENDIF"];
          var ans = out(lines, [t])[0];
          return { prompt: "The user types " + t + ". What is output?\n" + lines.join("\n"),
            answers: [ans], keywords: [word(ans)], distractors: [ans === "Coat" ? "Shirt" : "Coat", "Coat and Shirt"],
            example: "Example: the user types 20. IF Age < 20 THEN OUTPUT \"Young\" ELSE OUTPUT \"Old\".\nStep 1: < means LESS than.\nStep 2: is 20 less than 20? No. It is the same, not less. FALSE.\nStep 3: FALSE runs the ELSE line: Old.\nRule: < means less than. When the numbers are the same, < is FALSE and <= is TRUE.",
            working: ["< means less than. Is " + t + " less than " + lim + "?", "TRUE runs the THEN line. FALSE runs the ELSE line."],
            note: t + " < " + lim + " is " + (t < lim ? "TRUE" : "FALSE") + ", so " + ans + "." };
        } },
      { id: "x2-05", category: "x2-sel", randomize: function () {
          var s = drillPick([7, 8, 9, 10, 11]), gt = drillPick([true, false]);
          var lines = ["DECLARE Score : INTEGER", "DECLARE Bonus : INTEGER", "INPUT Score", "Bonus <- 0", "IF Score " + (gt ? ">" : ">=") + " 9 THEN", "  Bonus <- 5", "ENDIF", "OUTPUT Score + Bonus"];
          var ans = out(lines, [s])[0];
          return { prompt: "The user types " + s + ". What is output?\n" + lines.join("\n"),
            answers: [ans], keywords: [n(ans)], distractors: wrong(ans, [s, s + 5, 5]),
            example: "Example: the user types 20. Extra <- 0, IF Level >= 20 THEN Extra <- 2, ENDIF, OUTPUT Level + Extra.\nStep 1: Extra starts at 0.\nStep 2: is 20 >= 20? Yes: TRUE, so Extra <- 2 runs.\nStep 3: OUTPUT 20 + 2 = 22.\nRule: an IF with no ELSE skips its lines when the question is FALSE. Then the program carries on after ENDIF.",
            working: ["Bonus starts at 0. Does line 6 run?", "Read the symbol on line 5. Then add Score and Bonus."],
            note: s + " " + (gt ? ">" : ">=") + " 9 is " + (Number(ans) > s ? "TRUE, so Bonus is 5" : "FALSE, so Bonus stays 0") + ". Output: " + ans + "." };
        } },

      // ------------------------------------------------ Loops
      { id: "x2-06", category: "x2-loop", randomize: function () {
          var k = drillPick([3, 4, 5]);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO " + k, "  Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
          var ans = out(lines)[0];
          return { prompt: "What is output?\n" + lines.join("\n"),
            answers: [ans], keywords: [n(ans)], distractors: wrong(ans, [k, k * 2, Number(ans) - k]),
            example: "Example: FOR Num <- 2 TO 5, Sum <- Sum + Num, NEXT Num, OUTPUT Sum. Sum starts at 0.\nStep 1: Num = 2: Sum = 0 + 2 = 2. Num = 3: Sum = 2 + 3 = 5.\nStep 2: Num = 4: Sum = 5 + 4 = 9.\nStep 3: Num = 5: Sum = 9 + 5 = 14. The loop stops. OUTPUT shows 14.\nRule: the loop adds Num itself, so each time it adds a bigger number.",
            working: ["Line 5 adds Count, not 1. Count goes 1, 2, 3 ...", "Write Total after each time round."],
            note: "1 + 2 + ... + " + k + " = " + ans + "." };
        } },
      { id: "x2-07", category: "x2-loop", randomize: function () {
          var a = drillPick([2, 3]), b = drillPick([5, 6, 7]);
          var lines = ["DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "  OUTPUT \"Go\"", "NEXT Count"];
          var ans = String(out(lines).length);
          return { prompt: "How many times is Go output?\n" + lines.join("\n"),
            answers: [ans], keywords: [new RegExp("^\\s*" + ans + "(\\s*times?)?\\s*$", "i")], distractors: wrong(ans, [b, b - a, b + 1]),
            example: "Example: FOR Step <- 4 TO 10, OUTPUT \"Hop\", NEXT Step.\nStep 1: Step starts at 4, not 1.\nStep 2: list the values: 4, 5, 6, 7, 8, 9, 10.\nStep 3: count them: 7 values, so Hop is output 7 times.\nRule: count every value from the start to the end, both included.",
            working: ["Count starts at " + a + ", not 1.", "List every value of Count, then count them."],
            note: "Count goes " + a + " to " + b + ": " + ans + " values." };
        } },
      { id: "x2-08", category: "x2-loop", randomize: function () {
          var k = drillPick([3, 4, 5]), m = drillPick([2, 3, 10]);
          var lines = ["DECLARE Count : INTEGER", "FOR Count <- 1 TO " + k, "  OUTPUT Count * " + m, "NEXT Count"];
          var outs = out(lines), ans = outs[outs.length - 1];
          return { prompt: "What is the LAST number output?\n" + lines.join("\n"),
            answers: [ans], keywords: [n(ans)], distractors: wrong(ans, [k, m, (k - 1) * m]),
            example: "Example: FOR Turn <- 1 TO 6, OUTPUT Turn * 4, NEXT Turn.\nStep 1: the first time, Turn is 1, so it outputs 1 * 4 = 4.\nStep 2: the last time, Turn is 6, the end value.\nStep 3: so the last output is 6 * 4 = 24.\nRule: on the last time round, the loop variable equals the end value.",
            working: ["What is Count the last time round?", "Multiply that value by " + m + "."],
            note: "The outputs are " + outs.join(", ") + ". The last is " + ans + "." };
        } },
      { id: "x2-09", category: "x2-loop", randomize: function () {
          var k = drillPick([5, 6, 8]), lim = drillPick([2, 3, 4]);
          var lines = ["DECLARE Count : INTEGER", "FOR Count <- 1 TO " + k, "  IF Count > " + lim + " THEN", "    OUTPUT \"Hi\"", "  ENDIF", "NEXT Count"];
          var ans = String(out(lines).length);
          return { prompt: "How many times is Hi output?\n" + lines.join("\n"),
            answers: [ans], keywords: [new RegExp("^\\s*" + ans + "(\\s*times?)?\\s*$", "i")], distractors: wrong(ans, [k, lim, Number(ans) + 1]),
            example: "Example: FOR Day <- 1 TO 10, IF Day > 3 THEN OUTPUT \"Rest\", ENDIF, NEXT Day.\nStep 1: Day goes 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.\nStep 2: Day > 3 is TRUE for 4, 5, 6, 7, 8, 9 and 10.\nStep 3: count them: Rest is output 7 times.\nRule: the loop runs every time, but the IF only lets the OUTPUT run when the question is TRUE.",
            working: ["List the values of Count: 1 to " + k + ".", "Which of them are more than " + lim + "? Count those."],
            note: "Count > " + lim + " is TRUE for " + ans + " values." };
        } },

      // ------------------------------------------------ Flowcharts
      { id: "x2-10", category: "x2-flow", randomize: function () {
          var x = drillPick([7, 8, 9, 10, 12]), add = drillPick([2, 3]);
          var lines = ["DECLARE Num : INTEGER", "INPUT Num", "Num <- Num + " + add, "IF Num > 10 THEN", "  OUTPUT \"Big\"", "ELSE", "  OUTPUT \"Small\"", "ENDIF"];
          var ans = out(lines, [x])[0];
          return { prompt: "A flowchart: Start, then INPUT Num, then Num <- Num + " + add + ", then a Decision: Num > 10? Yes goes to OUTPUT \"Big\". No goes to OUTPUT \"Small\". Then End.\nThe user types " + x + ". What is output?",
            answers: [ans], keywords: [word(ans)], distractors: [ans === "Big" ? "Small" : "Big", "Big and Small"],
            example: "Example: Start, INPUT Cost, Cost <- Cost * 2, Decision: Cost >= 20? Yes: OUTPUT \"Dear\". No: OUTPUT \"Cheap\". End. The user types 9.\nStep 1: the sloping box INPUT puts 9 in Cost.\nStep 2: the rectangle (Process) makes Cost 9 * 2 = 18.\nStep 3: the diamond asks: is 18 >= 20? No, so follow the No arrow: Cheap.\nRule: follow the arrows in order. A diamond (Decision) has a Yes arrow and a No arrow.",
            working: ["Follow the arrows. Do the Process box before the Decision.", "Is the new Num more than 10? Follow Yes or No."],
            note: x + " + " + add + " = " + (x + add) + ". " + (x + add) + " > 10 is " + (x + add > 10 ? "TRUE (Yes)" : "FALSE (No)") + ", so " + ans + "." };
        } }
    ];
  })()
});
