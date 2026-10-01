// Year 8, Revision 1: Do Now Extension
// Loaded by Drills/index.html?drill=y8-revision-1-ext
// For students who finish the Do Now early: harder questions from every Year 8 Algorithms lesson so far (L1 to L7),
// written fresh (not taken from the older lesson drills). Every card has an `example`, a similar question worked
// through with different names and numbers, holding every rule and step needed; then two `working` nudges as help
// fades. An example never shows the card's own answer. Pseudocode is written the way the Year 8 lessons write it.
DrillData.register("y8-revision-1-ext", {
  title: "Year 8 Extension: Everything So Far",
  subtitle: "Revision 1 Do Now Extension",
  categories: [
    ["ex-seqsel", "Sequence and Selection (L1, L2)"],
    ["ex-arrays", "Arrays and Searching (L3, L4)"],
    ["ex-loops", "Loops (L5)"],
    ["ex-flowerr", "Flowcharts and Errors (L6, L7)"]
  ],
  cards: (function () {
    function n(x) { return new RegExp("^\\s*" + x + "\\s*$"); }
    function word(w) { return new RegExp("^\\s*[\"']?\\s*" + w + "\\s*[\"']?\\s*[.!]?\\s*$", "i"); }
    function wrong(answer, list) {
      var out = [];
      list.forEach(function (x) { x = String(x); if (x !== String(answer) && out.indexOf(x) < 0) out.push(x); });
      return out;
    }
    function other(list, not) { var c; do { c = drillPick(list); } while (c === not); return c; }

    return [
      // ------------------------------------------------ Sequence and Selection (L1, L2)
      { id: "ex-01", category: "ex-seqsel", randomize: function () {
          var a = drillPick([3, 4, 6]), b = drillPick([2, 5, 7]);
          var x = a + b, y = x - b;          // B ends up holding A's first value
          return { prompt: "What is the value of B at the end?\nDECLARE A : INTEGER\nDECLARE B : INTEGER\nA <- " + a + "\nB <- " + b + "\nA <- A + B\nB <- A - B",
            answers: [String(y)], keywords: [n(y)], distractors: wrong(y, [b, x, x - a]),
            example: "Example: P <- 10, Q <- 4, P <- P + Q, Q <- P - Q. What is Q?\nStep 1: after P <- 10 and Q <- 4, P is 10 and Q is 4.\nStep 2: P <- P + Q uses the values NOW: 10 + 4 = 14, so P is 14.\nStep 3: Q <- P - Q uses the NEW P: 14 - 4 = 10, so Q is 10.\nRule: each line uses the values from the line before it. A new value replaces the old one.",
            working: ["Write A and B after every line.", "Line 5 changes A. Line 6 must use that new A."],
            note: "A becomes " + x + ", then B = " + x + " - " + b + " = " + y + "." };
        } },
      { id: "ex-02", category: "ex-seqsel", randomize: function () {
          var s = drillPick([18, 22, 25, 30, 26]), d = s * 2, out = d > 50 ? "Gold" : "Silver";
          return { prompt: "The user types " + s + ". What is output?\nDECLARE Score : INTEGER\nINPUT Score\nScore <- Score * 2\nIF Score > 50 THEN\n  OUTPUT \"Gold\"\nELSE\n  OUTPUT \"Silver\"\nENDIF",
            answers: [out], keywords: [word(out)], distractors: [out === "Gold" ? "Silver" : "Gold", "Gold and Silver"],
            example: "Example: the user types 15. Level <- Level * 3, then IF Level >= 40 THEN OUTPUT \"Up\" ELSE OUTPUT \"Stay\".\nStep 1: INPUT puts 15 in Level.\nStep 2: Level <- Level * 3 makes Level 45 BEFORE the IF.\nStep 3: is 45 >= 40? TRUE, so the THEN line runs: Up.\nRule: > means more than. >= means more than or equal to. TRUE runs the THEN line, FALSE runs the ELSE line.",
            working: ["Work out Score after line 3 first.", "Then ask: is that number more than 50?"],
            note: s + " * 2 = " + d + ". " + d + " > 50 is " + (d > 50 ? "TRUE" : "FALSE") + ", so " + out + "." };
        } },
      { id: "ex-03", category: "ex-seqsel", randomize: function () {
          var t = drillPick([10, 15, 20]);
          return { prompt: "Temp is " + t + ". Is the condition Temp >= 15 TRUE or FALSE?", answers: [t >= 15 ? "TRUE" : "FALSE"], keywords: [word(t >= 15 ? "true" : "false")],
            distractors: [t >= 15 ? "FALSE" : "TRUE"],
            example: "Example: Speed is 30. Is Speed >= 40 TRUE or FALSE?\nStep 1: >= means more than OR equal to.\nStep 2: is 30 more than 40? No. Is 30 equal to 40? No.\nStep 3: neither is true, so the condition is FALSE.\nRule: if the value is equal, >= is TRUE but > is FALSE.",
            working: [">= is TRUE if the value is bigger OR the same.", "Compare " + t + " with 15."],
            note: t + " >= 15 is " + (t >= 15 ? "TRUE" : "FALSE") + "." };
        } },

      // ------------------------------------------------ Arrays and Searching (L3, L4)
      { id: "ex-04", category: "ex-arrays", randomize: function () {
          var v = [drillPick([4, 6, 9]), drillPick([3, 7, 8]), drillPick([2, 5, 10]), drillPick([1, 6, 12]), drillPick([11, 13, 15])];
          var i = drillPick([1, 2]), j = drillPick([3, 4, 5]), ans = v[i - 1] + v[j - 1];
          return { prompt: "Marks holds " + v.join(", ") + " in positions 1 to 5. What is output?\nOUTPUT Marks[" + i + "] + Marks[" + j + "]",
            answers: [String(ans)], keywords: [n(ans)], distractors: wrong(ans, [i + j, v[i] + v[j], v[i - 1], v[j - 1]]),
            example: "Example: Ages holds 12, 14, 9, 20 in positions 1 to 4. OUTPUT Ages[2] + Ages[4].\nStep 1: the number in [ ] is the POSITION (the index), not the value.\nStep 2: Ages[2] is the 2nd item: 14. Ages[4] is the 4th item: 20.\nStep 3: 14 + 20 = 34.\nRule: position 1 is the first item. Count along to find each one, then add the VALUES.",
            working: ["Count along the list to position " + i + ", then to position " + j + ".", "Add the two values you find, not the positions."],
            note: "Marks[" + i + "] is " + v[i - 1] + ", Marks[" + j + "] is " + v[j - 1] + ". " + v[i - 1] + " + " + v[j - 1] + " = " + ans + "." };
        } },
      { id: "ex-05", category: "ex-arrays", randomize: function () {
          var v = [drillPick([2, 3, 4]), drillPick([5, 6]), drillPick([1, 7]), drillPick([8, 10])], tot = v[0] + v[1] + v[2] + v[3];
          return { prompt: "Points holds " + v.join(", ") + " in positions 1 to 4. What is output?\nDECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 4\n  Total <- Total + Points[Index]\nNEXT Index\nOUTPUT Total",
            answers: [String(tot)], keywords: [n(tot)], distractors: wrong(tot, [v[3], 4, tot - v[0], 10]),
            example: "Example: Goals holds 3, 1, 4 in positions 1 to 3. Sum <- 0, FOR Pos <- 1 TO 3, Sum <- Sum + Goals[Pos], NEXT Pos, OUTPUT Sum.\nStep 1: Pos is 1: Sum <- 0 + Goals[1] = 0 + 3 = 3.\nStep 2: Pos is 2: Sum <- 3 + 1 = 4. Pos is 3: Sum <- 4 + 4 = 8.\nStep 3: the loop has finished, so OUTPUT shows 8.\nRule: the loop variable is used as the index, so each pass adds the NEXT item in the array.",
            working: ["Index goes 1, 2, 3, 4: each pass adds Points[Index].", "Keep a running total, starting at 0."],
            note: "0 + " + v.join(" + ") + " = " + tot + "." };
        } },
      { id: "ex-06", category: "ex-arrays", randomize: function () {
          var names = ["Amir", "Bea", "Chen", "Dina", "Eli"];
          var k = drillPick([2, 3, 4, 5]), target = names[k - 1];
          return { prompt: "Names holds Amir, Bea, Chen, Dina, Eli in positions 1 to 5. The user types " + target + ". What is output?\nDECLARE Search : STRING\nDECLARE Index : INTEGER\nDECLARE Position : INTEGER\nINPUT Search\nPosition <- 0\nFOR Index <- 1 TO 5\n  IF Names[Index] = Search THEN\n    Position <- Index\n  ENDIF\nNEXT Index\nOUTPUT Position",
            answers: [String(k)], keywords: [n(k)], distractors: wrong(k, [0, 5, k - 1, 1]),
            example: "Example: Pets holds Cat, Dog, Fish, Hen in positions 1 to 4. The user types Fish. The loop checks each item: IF Pets[Pos] = Search THEN Found <- Pos.\nStep 1: Pos 1: Cat = Fish? No. Pos 2: Dog = Fish? No.\nStep 2: Pos 3: Fish = Fish? Yes, so Found <- 3.\nStep 3: Pos 4: Hen = Fish? No, so Found stays 3. OUTPUT shows 3.\nRule: a linear search checks the items one at a time, in order, and stores the POSITION where it finds a match.",
            working: ["Check each name in order: is it " + target + "?", "The output is the position number, not the name."],
            note: target + " is at position " + k + ", so Position becomes " + k + "." };
        } },

      // ------------------------------------------------ Loops (L5)
      { id: "ex-07", category: "ex-loops", randomize: function () {
          var lim = drillPick([10, 20, 30]), x = 1, passes = 0;
          while (x < lim) { x = x * 2; passes++; }
          return { prompt: "What is output?\nDECLARE Value : INTEGER\nValue <- 1\nWHILE Value < " + lim + "\n  Value <- Value * 2\nENDWHILE\nOUTPUT Value",
            answers: [String(x)], keywords: [n(x)], distractors: wrong(x, [x / 2, lim, x * 2, passes]),
            example: "Example: Num <- 2, WHILE Num < 25, Num <- Num * 3, ENDWHILE, OUTPUT Num.\nStep 1: is 2 < 25? Yes, so Num <- 6. Is 6 < 25? Yes, so Num <- 18.\nStep 2: is 18 < 25? Yes, so Num <- 54.\nStep 3: is 54 < 25? No, so the loop stops. OUTPUT shows 54.\nRule: WHILE checks the condition BEFORE each pass. It keeps going while the condition is TRUE.",
            working: ["Check Value < " + lim + " before every pass.", "Double Value each time. Stop when the check is FALSE."],
            note: "Value goes 1, " + (function () { var s = [], y = 1; while (y < lim) { y *= 2; s.push(y); } return s.join(", "); })() + ". " + x + " < " + lim + " is FALSE, so it stops." };
        } },
      { id: "ex-08", category: "ex-loops", randomize: function () {
          var s = drillPick([3, 4, 5]);
          return { prompt: "How many times does the line inside the loop run?\nDECLARE Stock : INTEGER\nStock <- " + s + "\nWHILE Stock > 0\n  Stock <- Stock - 1\nENDWHILE",
            answers: [String(s)], keywords: [new RegExp("^\\s*" + s + "(\\s*times?)?\\s*$", "i")], distractors: wrong(s, [s - 1, s + 1, 0]),
            example: "Example: Lives <- 2, WHILE Lives > 0, Lives <- Lives - 1, ENDWHILE.\nStep 1: is 2 > 0? Yes: pass 1, Lives becomes 1.\nStep 2: is 1 > 0? Yes: pass 2, Lives becomes 0.\nStep 3: is 0 > 0? No: the loop stops. It ran 2 times.\nRule: count a pass only when the condition is TRUE. When it is FALSE, the loop ends.",
            working: ["Check Stock > 0, then take 1 away. Count each pass.", "Stop counting when Stock is 0."],
            note: "Stock goes " + s + " down to 0: " + s + " passes." };
        } },
      { id: "ex-09", category: "ex-loops", randomize: function () {
          var forLoop = drillPick([true, false]);
          return { prompt: forLoop ? "A loop is written FOR Count <- 1 TO 10 ... NEXT Count. Is it count-controlled or condition-controlled?" : "A loop is written WHILE Password <> \"open\" ... ENDWHILE. Is it count-controlled or condition-controlled?",
            answers: [forLoop ? "Count-controlled" : "Condition-controlled"],
            keywords: [forLoop ? /^\s*count[\s-]*controll?ed(\s+(loop|iteration))?\s*$/i : /^\s*condition[\s-]*controll?ed(\s+(loop|iteration))?\s*$/i],
            distractors: [forLoop ? "Condition-controlled" : "Count-controlled", "Selection"],
            example: "Example: a loop that repeats until the user types the right answer.\nStep 1: do we know how many times it will run before it starts? No: it depends on the user.\nStep 2: it keeps going while a condition is TRUE.\nStep 3: so it is condition-controlled (WHILE).\nRule: FOR ... NEXT runs an exact number of times: count-controlled. WHILE ... ENDWHILE runs while a condition is TRUE: condition-controlled.",
            working: ["Do we know how many times it runs before it starts?", "FOR counts. WHILE checks a condition."],
            note: forLoop ? "FOR runs an exact number of times: count-controlled." : "WHILE runs while a condition is TRUE: condition-controlled." };
        } },

      // ------------------------------------------------ Flowcharts and Errors (L6, L7)
      { id: "ex-10", category: "ex-flowerr", randomize: function () {
          var rel = drillPick([["more than", ">", ">"], ["less than", "<", "<"], ["at least", ">=", ">="], ["equal to", "=", "="]]);
          var name = drillPick(["Score", "Age", "Total"]), val = drillPick([12, 40, 75]);
          return { prompt: "A flowchart Decision says: Is " + name + " " + rel[0] + " " + val + "? Write the matching IF line.",
            answers: ["IF " + name + " " + rel[1] + " " + val + " THEN"],
            keywords: [new RegExp("^\\s*IF\\s+" + name + "\\s*" + rel[2].replace(/([<>=])/g, "\\$1") + "\\s*" + val + "\\s+THEN\\s*$", "i")],
            distractors: ["IF " + name + " " + (rel[1] === ">" ? "<" : ">") + " " + val + " THEN", name + " " + rel[1] + " " + val, "IF " + name + " " + rel[1] + " " + val],
            format: "Type the whole line",
            example: "Example: a Decision says: Is Height less than or equal to 120?\nStep 1: a Decision becomes IF ... THEN.\nStep 2: \"less than or equal to\" is the symbol <=.\nStep 3: so the line is IF Height <= 120 THEN.\nRule: more than is >, less than is <, at least is >=, equal to is =. The line starts with IF and ends with THEN.",
            working: ["Swap the words for a symbol: more than >, less than <, at least >=, equal to =.", "Start with IF, end with THEN."],
            note: "IF " + name + " " + rel[1] + " " + val + " THEN" };
        } },
      { id: "ex-11", category: "ex-flowerr", randomize: function () {
          var syn = drillPick([true, false]);
          var bad = syn ? drillPick(["OUTPT Total", "IF Total > 10", "ENDIFF"]) : drillPick(["Total <- Total - 5", "IF Total < 10 THEN"]);
          var why = syn ? (bad === "IF Total > 10" ? "the IF line is missing THEN" : "a keyword or symbol is written wrongly") : "it follows the rules but gives the wrong result";
          return { prompt: "A program should add 5 to Total and output \"Big\" when Total is more than 10. One line is: " + bad + ". Is this a syntax error or a logic error?",
            answers: [syn ? "Syntax error" : "Logic error"],
            keywords: [syn ? /^\s*(a\s+)?syntax(\s+error)?\s*$/i : /^\s*(a\s+)?logic(al)?(\s+error)?\s*$/i],
            distractors: [syn ? "Logic error" : "Syntax error", "No error"],
            example: "Example: a program should output the bigger of two numbers.\nStep 1: OUTPUT is spelt OUPUT. That breaks the rules of the language, so the program cannot run: a syntax error.\nStep 2: another line says IF A < B THEN OUTPUT A. That follows the rules, so it runs, but it outputs the SMALLER number: a logic error.\nRule: syntax error = the rules of the language are broken (spelling, missing THEN or ENDIF). Logic error = it runs but does the wrong thing.",
            working: ["Does the line break the rules of pseudocode (spelling, missing word)?", "If it follows the rules but does the wrong job, it is a logic error."],
            note: (syn ? "Syntax error: " : "Logic error: ") + why + "." };
        } },
      { id: "ex-12", category: "ex-flowerr", randomize: function () {
          var lim = drillPick([10, 20]), typo = drillPick([3, 4]);
          var lines = ["DECLARE Total : INTEGER", "INPUT Total", "Total <- Total + 5", "IF Total > " + lim + " THEN", "  OUTPUT \"Big\"", "ENDIF"];
          lines[typo - 1] = typo === 3 ? "Total <- Total - 5" : "IF Total < " + lim + " THEN";
          return { prompt: "This should add 5 to Total, then output \"Big\" if Total is more than " + lim + ". Which line has the logic error?\n" + lines.map(function (l, i) { return (i + 1) + "  " + l; }).join("\n"),
            answers: [String(typo)], keywords: [new RegExp("^\\s*(line\\s*)?" + typo + "\\s*$", "i")], distractors: wrong(typo, [1, 2, 5, 6]),
            example: "Example: a program should double Price, then output \"Sale\" if Price is less than 50. Line 3 says Price <- Price + 2.\nStep 1: read what the program SHOULD do: double means * 2.\nStep 2: compare each line with that job. Line 3 adds 2 instead of multiplying by 2.\nStep 3: so line 3 has the logic error.\nRule: test each line against the job described. The line that does a different job is the error.",
            working: ["Read the job: add 5, then check MORE than " + lim + ".", "Find the line that does something different from the job."],
            note: "Line " + typo + (typo === 3 ? " takes 5 away instead of adding 5." : " checks less than instead of more than.") };
        } }
    ];
  })()
});
