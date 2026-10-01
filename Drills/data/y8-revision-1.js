// Year 8, Revision 1: Reading Pseudocode
// Loaded by Drills/index.html?drill=y8-revision-1
// The first of two lessons before the Unit 1 assessment: sequence (INPUT, OUTPUT, the arrow), selection
// (IF ... THEN ... ELSE ... ENDIF), FOR loops, and the four flowchart symbols. Short programs only, written the way
// the Year 8 lessons write them: IF ... THEN on one line, every variable declared.
DrillData.register("y8-revision-1", {
  title: "Year 8, Revision 1: Reading Pseudocode",
  subtitle: "Algorithms",
  categories: [
    ["rv-words", "Key Words and Symbols"],
    ["rv-seq", "Sequence"],
    ["rv-sel", "Selection"],
    ["rv-loop", "Loops"]
  ],
  cards: (function () {
    function n(x) { return new RegExp("^\\s*" + x + "\\s*$"); }
    function wrong(answer, list) {
      var out = [];
      list.forEach(function (x) { x = String(x); if (x !== String(answer) && out.indexOf(x) < 0) out.push(x); });
      return out;
    }
    function word(w) { return new RegExp("^\\s*[\"']?\\s*" + w + "\\s*[\"']?\\s*[.!]?\\s*$", "i"); }
    return [
      // ------------------------------------------------ Key Words and Symbols
      { id: "rv-01", category: "rv-words", prompt: "Which keyword takes a value typed in by the user?", answers: ["INPUT"], keywords: [/^\s*input\s*$/i], distractors: ["OUTPUT", "DECLARE", "ENDIF"], note: "INPUT takes a value from the user and stores it in a variable." },
      { id: "rv-02", category: "rv-words", prompt: "Which keyword shows a value on the screen?", answers: ["OUTPUT"], keywords: [/^\s*output\s*$/i], distractors: ["INPUT", "NEXT", "THEN"], note: "OUTPUT shows a value or a message." },
      { id: "rv-03", category: "rv-words", prompt: "Which keyword closes every IF?", answers: ["ENDIF"], keywords: [/^\s*end\s*if\s*$/i], distractors: ["NEXT", "ELSE", "STOP"], note: "Every IF is closed with ENDIF." },
      { id: "rv-04", category: "rv-words", prompt: "Which keyword closes a FOR loop?", answers: ["NEXT"], keywords: [/^\s*next(\s+\w+)?\s*$/i], distractors: ["ENDIF", "ELSE", "END"], note: "FOR ... NEXT: NEXT ends the loop." },
      { id: "rv-05", category: "rv-words", randomize: function () {
          var s = drillPick([["a diamond", "Decision", /^\s*(a\s+)?decision(\s+(symbol|shape|box))?\s*$/i, "It asks a question with a Yes and a No path."],
            ["a rectangle", "Process", /^\s*(a\s+)?process(\s+(symbol|shape|box))?\s*$/i, "It does an action, like storing a value."],
            ["a sloping box (parallelogram)", "Input/Output", /^\s*(an?\s+)?(input\s*(\/|or|and)?\s*output|input|output)(\s+(symbol|shape|box))?\s*$/i, "It takes a value in or shows a value."],
            ["a rounded box", "Terminal", /^\s*(a\s+)?(terminal|terminator|start\s*(\/|or|and)?\s*end)(\s+(symbol|shape|box))?\s*$/i, "It shows where the flowchart starts and ends."]]);
          var names = ["Decision", "Process", "Input/Output", "Terminal"];
          return { prompt: "In a flowchart, what is " + s[0] + " called?", answers: [s[1]], keywords: [s[2]],
            distractors: names.filter(function (x) { return x !== s[1]; }), note: s[1] + ": " + s[3] };
        } },

      // ------------------------------------------------ Sequence
      { id: "rv-06", category: "rv-seq", randomize: function () {
          var a = drillPick([3, 4, 5, 6]), b = drillPick([2, 3, 7]);
          return { prompt: "What is output?\nDECLARE Number : INTEGER\nNumber <- " + a + "\nNumber <- Number + " + b + "\nOUTPUT Number",
            answers: [String(a + b)], keywords: [n(a + b)], distractors: wrong(a + b, [a, b, a * b]),
            working: ["Write down Number after each line.", "Line 3 uses the value from line 2."], note: "Number is " + a + ", then " + (a + b) + "." };
        } },
      { id: "rv-07", category: "rv-seq", randomize: function () {
          var age = drillPick([11, 12, 13]);
          return { prompt: "The user types " + age + ". What is output?\nDECLARE Age : INTEGER\nINPUT Age\nAge <- Age + 1\nOUTPUT Age",
            answers: [String(age + 1)], keywords: [n(age + 1)], distractors: wrong(age + 1, [age, age + 2, 1]),
            working: ["INPUT puts " + age + " in Age.", "Then line 3 adds 1."], note: "Age is " + age + ", then " + (age + 1) + "." };
        } },
      { id: "rv-08", category: "rv-seq", randomize: function () {
          var a = drillPick([2, 4, 5]), b = drillPick([3, 6]);
          return { prompt: "What is the value of B at the end?\nDECLARE A : INTEGER\nDECLARE B : INTEGER\nA <- " + a + "\nB <- " + b + "\nB <- A + B",
            answers: [String(a + b)], keywords: [n(a + b)], distractors: wrong(a + b, [a, b, a * b]),
            working: ["The lines run in order.", "The last line puts A + B into B."], note: "B = " + a + " + " + b + " = " + (a + b) + "." };
        } },

      // ------------------------------------------------ Selection
      { id: "rv-09", category: "rv-sel", randomize: function () {
          var m = drillPick([30, 45, 50, 55, 80]), out = m >= 50 ? "Pass" : "Fail";
          return { prompt: "The user types " + m + ". What is output?\nDECLARE Mark : INTEGER\nINPUT Mark\nIF Mark >= 50 THEN\n  OUTPUT \"Pass\"\nELSE\n  OUTPUT \"Fail\"\nENDIF",
            answers: [out], keywords: [word(out)], distractors: [out === "Pass" ? "Fail" : "Pass", "Pass and Fail"],
            working: ["Is " + m + " >= 50 TRUE or FALSE?", "TRUE runs the THEN line. FALSE runs the ELSE line."],
            note: m + " >= 50 is " + (m >= 50 ? "TRUE" : "FALSE") + ", so the output is " + out + "." };
        } },
      { id: "rv-10", category: "rv-sel", randomize: function () {
          var t = drillPick([18, 25, 26, 31]), out = t > 25 ? "Hot" : "Cold";
          return { prompt: "The user types " + t + ". What is output?\nDECLARE Temp : INTEGER\nINPUT Temp\nIF Temp > 25 THEN\n  OUTPUT \"Hot\"\nELSE\n  OUTPUT \"Cold\"\nENDIF",
            answers: [out], keywords: [word(out)], distractors: [out === "Hot" ? "Cold" : "Hot", "Hot and Cold"],
            working: ["> means more than. Is " + t + " more than 25?"],
            note: t + " > 25 is " + (t > 25 ? "TRUE" : "FALSE") + ", so the output is " + out + "." };
        } },
      { id: "rv-11", category: "rv-sel", prompt: "Mark is 50. Is the condition Mark > 50 TRUE or FALSE?", answers: ["FALSE"], keywords: [word("false")],
        distractors: ["TRUE"], working: ["> means more than. Is 50 more than 50?"], note: "50 is not more than 50, so Mark > 50 is FALSE. Mark >= 50 would be TRUE." },

      // ------------------------------------------------ Loops
      { id: "rv-12", category: "rv-loop", randomize: function () {
          var k = drillPick([3, 4, 5, 6]);
          return { prompt: "How many times is Hi output?\nDECLARE Count : INTEGER\nFOR Count <- 1 TO " + k + "\n  OUTPUT \"Hi\"\nNEXT Count",
            answers: [String(k)], keywords: [new RegExp("^\\s*" + k + "(\\s*times?)?\\s*$", "i")], distractors: wrong(k, [k - 1, k + 1, 1]),
            working: ["Count goes 1, 2, 3 ... up to " + k + ".", "The line inside runs once for each value."], note: "Count goes from 1 to " + k + ", so Hi is output " + k + " times." };
        } },
      { id: "rv-13", category: "rv-loop", randomize: function () {
          var k = drillPick([2, 3, 4]), add = drillPick([2, 5, 10]);
          return { prompt: "What is output?\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO " + k + "\n  Total <- Total + " + add + "\nNEXT Count\nOUTPUT Total",
            answers: [String(k * add)], keywords: [n(k * add)], distractors: wrong(k * add, [add, k + add, k]),
            working: ["The loop runs " + k + " times.", "Each time, add " + add + " to Total."], note: "Total: " + k + " lots of " + add + " = " + (k * add) + "." };
        } },
      { id: "rv-14", category: "rv-loop", randomize: function () {
          var k = drillPick([3, 4, 5]);
          var outs = []; for (var i = 1; i <= k; i++) outs.push(i);
          return { prompt: "What is the LAST number output?\nDECLARE Count : INTEGER\nFOR Count <- 1 TO " + k + "\n  OUTPUT Count\nNEXT Count",
            answers: [String(k)], keywords: [n(k)], distractors: wrong(k, [1, k - 1, k + 1]),
            working: ["The loop outputs Count each time.", "What is Count the last time?"], note: "It outputs " + outs.join(", ") + ". The last is " + k + "." };
        } }
    ];
  })()
});
