// Year 9, 2.6: Errors and Trace Tables (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-2-6-errors
// Syntax and logic errors in short Cambridge pseudocode programs: name the kind of error, find the line, follow a
// program with a bug exactly as written, and pick the line that fixes it. Each card's question comes first and its
// program after it, so a race shows the question as the question and the program in its code box.
DrillData.register("y9-2-6-errors", {
  title: "Year 9, 2.6: Errors and Trace Tables",
  subtitle: "Syntax errors, logic errors, and tracing a program to find them",
  choiceOnly: true,
  categories: [
    ["err-kind", "Syntax or Logic?"],
    ["err-find", "Find the Line"],
    ["err-trace", "Follow the Bug"],
    ["err-fix", "Fix the Line"]
  ],
  cards: (function () {
    var A = "←";
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }).join("\n"); }
    function lineRe(n) { return new RegExp("^\\s*(line\\s*)?0?" + n + "\\s*$", "i"); }
    function sum(n) { return n * (n + 1) / 2; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v >= 0 && v !== n; }), 3); }
    var SYNTAX = { answers: ["Syntax error"], keywords: [/syntax/i], distractors: ["Logic error"] };
    var LOGIC = { answers: ["Logic error"], keywords: [/logic/i], distractors: ["Syntax error"] };
    function kind(base, extra) { var o = {}; for (var k in base) o[k] = base[k]; for (var j in extra) o[j] = extra[j]; return o; }

    var BOUND = numbered(["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO 4", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"]);
    var RESET = numbered(["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO 4", "    Total " + A + " 0", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"]);
    var DOUBLE = numbered(["DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO 4", "    OUTPUT Count + 2", "NEXT Count"]);
    var LASTOUT = numbered(["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO 4", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Count"]);
    var PASS = code("DECLARE Mark : INTEGER", "Mark " + A + " 50", "IF Mark > 50 THEN", "    OUTPUT \"Pass\"", "ELSE", "    OUTPUT \"Fail\"", "ENDIF");

    return [
      // ------------------------------------------------ Syntax or logic?
      { id: "k-syntax", category: "err-kind", randomize: function () {
          var v = drillPick([
            ["OUTPT Total", "OUTPUT is spelt wrong, so the computer cannot run this line."],
            ["FOR Count " + A + " 1 5", "The keyword TO is missing, so the line breaks the rules."],
            ["DECLARE Total INTEGER", "The colon is missing after Total, so the line breaks the rules."],
            ["OUTPUT \"Hello", "The closing speech mark is missing, so the line breaks the rules."]]);
          return kind(SYNTAX, { prompt: "Which kind of error is in this line?\n" + v[0],
            working: ["Does the line follow the rules of pseudocode exactly?", "Could the computer run this line at all?"], note: v[1] + " That is a syntax error." });
        } },
      { id: "k-logic", category: "err-kind", randomize: function () {
          var v = drillPick([
            ["This line should add Count to Total. Which kind of error is in it?", "Total " + A + " Total - Count", "The line runs, but it takes away instead of adding."],
            ["This loop should run 5 times. Which kind of error is in it?", "FOR Count " + A + " 1 TO 4", "The line runs, but the loop runs 4 times, not 5."],
            ["This line should double Number. Which kind of error is in it?", "Number " + A + " Number + 2", "The line runs, but it adds 2 instead of doubling."],
            ["This line should output Total. Which kind of error is in it?", "OUTPUT Count", "The line runs, but it outputs the wrong variable."]]);
          return kind(LOGIC, { prompt: v[0] + "\n" + v[1],
            working: ["Does the line follow the rules? Could it run?", "If it runs, does it do what it should?"], note: v[2] + " That is a logic error." });
        } },
      kind(LOGIC, { id: "k-runs", category: "err-kind",
        prompt: "A program runs, but outputs 12 when it should output 15. Which kind of error does it have?",
        working: ["Did the program run?", "It runs but gives the wrong answer. Which kind of error is that?"],
        note: "The program runs but gives the wrong answer: a logic error." }),
      kind(SYNTAX, { id: "k-norun", category: "err-kind",
        prompt: "The computer cannot run a program at all, because one line breaks the rules of the language. Which kind of error is it?",
        working: ["Did the program run?", "Breaking the rules of the language stops it running. Which kind of error is that?"],
        note: "Breaking the rules of the language is a syntax error. The program cannot run." }),

      // ------------------------------------------------ Find the line
      { id: "f-bound", category: "err-find",
        prompt: "This program should add up the numbers 1 to 5. Which line has the error?\n" + BOUND,
        answers: ["Line 4"], keywords: [lineRe(4)], distractors: ["Line 3", "Line 5", "Line 7"],
        working: ["Which numbers does Count take?", "Should the loop stop at 4?"],
        note: "Line 4 stops at 4. It should be FOR Count " + A + " 1 TO 5." },
      { id: "f-reset", category: "err-find",
        prompt: "This program should output 10, the total of 1 to 4. It outputs 4. Which line has the error?\n" + RESET,
        answers: ["Line 4"], keywords: [lineRe(4)], distractors: ["Line 3", "Line 5", "Line 7"],
        working: ["Which lines are inside the loop?", "What happens to Total at the start of every pass?"],
        note: "Line 4 sets Total back to 0 on every pass. It belongs before the loop." },
      { id: "f-double", category: "err-find",
        prompt: "This program should output each number doubled: 2, 4, 6, 8. Which line has the error?\n" + DOUBLE,
        answers: ["Line 3"], keywords: [lineRe(3)], distractors: ["Line 1", "Line 2", "Line 4"],
        working: ["Which line makes the output?", "Does that line double Count?"],
        note: "Line 3 adds 2. It should be OUTPUT Count * 2." },
      { id: "f-out", category: "err-find",
        prompt: "This program should output the total of 1 to 4. Which line has the error?\n" + LASTOUT,
        answers: ["Line 7"], keywords: [lineRe(7)], distractors: ["Line 3", "Line 5", "Line 6"],
        working: ["The loop adds up the total correctly.", "Which variable does the last line output?"],
        note: "Line 7 outputs Count. It should output Total." },

      // ------------------------------------------------ Follow the bug
      { id: "t-reset", category: "err-trace", randomize: function () {
          var n = drillRange(3, 6);
          return {
            prompt: "This program has a bug. Follow it exactly as it is written. What does it output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " 0", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"),
            answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [sum(n), 0, n - 1]),
            working: ["What is Total at the start of every pass?", "So after the last pass, Total is 0 plus the last value of Count."],
            note: "Total goes back to 0 on every pass, so only the last Count is left: " + n + "."
          };
        } },
      { id: "t-bound", category: "err-trace", randomize: function () {
          var n = drillRange(4, 7);
          return {
            prompt: "This program should add up 1 to " + n + ", but it has a bug. Follow it exactly as it is written. What does it output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + (n - 1), "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"),
            answers: [String(sum(n - 1))], keywords: [drillNumberRe(sum(n - 1))], distractors: others(sum(n - 1), [sum(n), n - 1, sum(n - 2)]),
            working: ["Read the FOR line. Where does the loop really stop?", "Add up the values Count really takes."],
            note: "The loop stops at " + (n - 1) + ", so the total is " + sum(n - 1) + ", not " + sum(n) + "."
          };
        } },
      { id: "t-times", category: "err-trace", randomize: function () {
          var n = drillRange(3, 6);
          return {
            prompt: "This program should add up 1 to " + n + ", but it has a bug. Follow it exactly as it is written. What does it output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total * Count", "NEXT Count", "OUTPUT Total"),
            answers: ["0"], keywords: [drillNumberRe(0)], distractors: others(0, [sum(n), n, 1]),
            working: ["What is Total before the loop?", "Work out Total after the first pass, then the second."],
            note: "Total starts at 0, and 0 times anything is 0. It should be Total " + A + " Total + Count."
          };
        } },
      { id: "t-pass", category: "err-trace",
        prompt: "The pass mark is 50 or more. This program has a bug. Follow it exactly as it is written. What does it output?\n" + PASS,
        answers: ["Fail"], keywords: [/^\s*["']?fail["']?\s*\.?\s*$/i], distractors: ["Pass"],
        working: ["Mark is 50. Is 50 > 50 true?", "If the condition is false, the ELSE part runs."],
        note: "50 is not more than 50, so it outputs Fail. It should be IF Mark >= 50 THEN." },

      // ------------------------------------------------ Fix the line
      { id: "x-bound", category: "err-fix",
        prompt: "This program should add up the numbers 1 to 5. Which line should replace line 4?\n" + BOUND,
        answers: ["FOR Count " + A + " 1 TO 5"], keywords: [new RegExp("^\\s*for\\s+count\\s*(<-|←)\\s*1\\s+to\\s+5\\s*$", "i")],
        distractors: ["FOR Count " + A + " 0 TO 4", "FOR Count " + A + " 1 TO 6", "FOR Count " + A + " 2 TO 5"],
        working: ["Which numbers should Count take?", "The first number and the last number go in the FOR line."],
        note: "Count should take 1, 2, 3, 4, 5." },
      { id: "x-double", category: "err-fix",
        prompt: "This program should output each number doubled: 2, 4, 6, 8. Which line should replace line 3?\n" + DOUBLE,
        answers: ["OUTPUT Count * 2"], keywords: [/count\s*\*\s*2|2\s*\*\s*count/i],
        distractors: ["OUTPUT Count - 2", "OUTPUT Count / 2", "OUTPUT Count + 1"],
        working: ["Doubling means two lots of the number.", "Which operator means multiply?"],
        note: "Count * 2 doubles Count." },
      { id: "x-pass", category: "err-fix",
        prompt: "The pass mark is 50 or more. Which line should replace IF Mark > 50 THEN?\n" + PASS,
        answers: ["IF Mark >= 50 THEN"], keywords: [/>=\s*50|>\s*49\b/],
        distractors: ["IF Mark < 50 THEN", "IF Mark = 49 THEN", "IF Mark > 51 THEN"],
        working: ["50 or more includes 50 itself.", "Which comparison is true when Mark is 50?"],
        note: ">= means more than or equal to, so 50 passes." }
    ];
  })()
});
