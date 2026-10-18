// Year 9, 3.1: Following and Correcting Pseudocode (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-3-1-pseudocode
// Four categories, mirroring the lesson: follow a program line by line; why the order of the lines changes the
// result; the value on the line (> and >=, < and <=); and find, fix and prove a correction. Number and word answers
// are worked out by running the card's own program in shared/pseudocode-engine.js when the card is drawn.
// Explanation cards need two connected ideas. The question comes first and the program after it.
DrillData.register("y9-3-1-pseudocode", {
  title: "Year 9, 3.1: Following and Correcting Pseudocode",
  subtitle: "Line by line, order, the value on the line, and find, fix, prove",
  choiceOnly: true,
  categories: [
    ["pl-line", "Line by Line"],
    ["pl-order", "Order Matters"],
    ["pl-bound", "The Value on the Line"],
    ["pl-fix", "Find, Fix, Prove"]
  ],
  cards: (function () {
    var A = "\u2190";
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    // Run a program in the pseudocode engine. watch: [line, expr] also records expr each time that line has run.
    function run(lines, inputs, watch) {
      var src = lines.slice();
      if (watch) src.splice(watch[0], 0, "OUTPUT \"#w#\"", "OUTPUT " + watch[1]);
      var r = PseudocodeEngine.runPseudocode(src.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + src.join("\n"));
      var o = [], w = [];
      for (var i = 0; i < r.outputs.length; i++) {
        if (r.outputs[i] === "#w#") { w.push(String(r.outputs[i + 1])); i++; } else o.push(String(r.outputs[i]));
      }
      return { out: o, watched: w };
    }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) + 2, Number(ans) - 1, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function lineRe(n) { return new RegExp("^\\s*(line\\s*)?0?" + n + "\\s*\\.?\\s*$", "i"); }
    function nums(n, from, to, avoid) { var o = [], v; while (o.length < n) { v = drillRange(from, to); if (!avoid || avoid.indexOf(v) === -1) o.push(v); } return o; }
    function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }

    return [
      // ------------------------------------------------ Line by Line
      { id: "l-chain", category: "pl-line", randomize: function () {
          var a = drillRange(2, 6), b = drillRange(2, 5), c = drillRange(2, 3);
          var lines = ["DECLARE A : INTEGER", "DECLARE B : INTEGER", "A <- " + a, "B <- A + " + b, "A <- B * " + c, "OUTPUT A"];
          var o = run(lines).out[0];
          return { prompt: "Follow this program one line at a time. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [a * c, a + b, a + b + c]),
            working: ["Line 4 uses the value A holds now.", "Line 5 uses the new B. The old value of A is replaced."],
            note: "B = " + a + " + " + b + " = " + (a + b) + ". Then A = " + (a + b) + " * " + c + " = " + o + "." };
        } },
      { id: "l-copy", category: "pl-line", randomize: function () {
          var a = drillRange(3, 9), b = drillRange(2, 6);
          var lines = ["DECLARE X : INTEGER", "DECLARE Y : INTEGER", "X <- " + a, "Y <- X", "X <- X + " + b, "OUTPUT Y"];
          var o = run(lines).out[0];
          return { prompt: "Follow this program exactly as it is written. What does line 6 output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [a + b, b, 0]),
            working: ["Line 4 copies the value of X into Y.", "Does line 5 change Y, or only X?"],
            note: "Y got a copy of " + a + " on line 4. Line 5 changes only X." };
        } },
      { id: "l-pass", category: "pl-line", randomize: function () {
          var a = drillRange(2, 7), k = drillRange(2, 4);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- " + a + " TO " + (a + 3), "    Total <- Total + Count * " + k, "NEXT Count", "OUTPUT Total"];
          var r = run(lines, [], [5, "Total"]), second = r.watched[1];
          return { prompt: "Trace this program slowly. What is Total after the SECOND pass of the loop?\n" + show(numbered(lines)),
            answers: [second], keywords: [drillNumberRe(Number(second))], distractors: others(second, [Number(r.out[0]), Number(r.watched[0]), Number(r.watched[2])]),
            working: ["Pass 1 uses the first value of Count. Work out line 5.", "Pass 2 uses the next value. Add it to Total, then stop."],
            note: "Total after each pass: " + r.watched.join(", ") + "." };
        } },
      { id: "l-why", category: "pl-line",
        prompt: "Why does this program output 5, and not 9?\n" + "01 DECLARE X : INTEGER\n02 DECLARE Y : INTEGER\n03 X \u2190 5\n04 Y \u2190 X\n05 X \u2190 X + 4\n06 OUTPUT Y",
        answers: ["Y got a copy of 5; line 5 changes only X"],
        keywords: [/^(?=.*\b(cop(y|ied|ies)|stor(e|ed|es)|gave|given|got|gets|value|5)\b)(?=.*(only\s+(changes\s+)?x\b|not\s+y\b|x\s+(changes|is\s+changed|was\s+changed)|chang(e|es|ed)\s+(only\s+)?x\b|after|later|separate))/i],
        distractors: ["Y always keeps the first value it sees", "OUTPUT cannot show the new value of X", "X + 4 is a syntax error, so it stops"],
        working: ["What did line 4 put into Y?", "Which variable does line 5 change?"],
        note: "Line 4 copies 5 into Y. Line 5 changes only X, so Y is still 5." },

      // ------------------------------------------------ Order Matters
      { id: "o-inside", category: "pl-order", randomize: function () {
          var n = drillRange(3, 7);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO " + n, "    Total <- Total + Count", "    OUTPUT Total", "NEXT Count"];
          var c = run(lines).out.length;
          return { prompt: "This program should output the total once. Follow it exactly as it is written. How many numbers does it output?\n" + show(numbered(lines)),
            answers: [String(c)], keywords: [new RegExp("^\\s*" + c + "\\s*(numbers?|times?)?\\s*\\.?\\s*$", "i")], distractors: others(c, [1, c - 1, c + 1]),
            working: ["Which lines are between FOR and NEXT?", "A line inside the loop runs on every pass."],
            note: "OUTPUT is inside the loop, so it runs on all " + c + " passes. It belongs after NEXT." };
        } },
      { id: "o-reset", category: "pl-order", randomize: function () {
          var a = drillRange(2, 5), b = a + drillRange(2, 4);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    Total <- 0", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
          var o = run(lines).out[0], sum = 0;
          for (var c = a; c <= b; c++) sum += c;
          return { prompt: "This program should add up " + a + " to " + b + ". Follow it exactly as it is written. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [sum, 0, a]),
            working: ["What happens to Total at the start of every pass?", "After the last pass, what is left in Total?"],
            note: "Line 4 sets Total back to 0 on every pass, so only the last Count is left. It belongs before the loop." };
        } },
      { id: "o-ifafter", category: "pl-order", randomize: function () {
          var typed, good;
          do { typed = nums(5, 2, 25); good = typed.filter(function (v) { return v >= 10; }).length; } while (good < 2);
          var lines = ["DECLARE Number : INTEGER", "DECLARE Count : INTEGER", "DECLARE Big : INTEGER", "Big <- 0", "FOR Count <- 1 TO 5", "    INPUT Number", "NEXT Count",
            "IF Number >= 10 THEN", "    Big <- Big + 1", "ENDIF", "OUTPUT Big"];
          var o = run(lines, typed).out[0];
          return { prompt: "This program should count the numbers that are 10 or more. The user types " + typed.join(", ") + ". Follow it exactly as it is written. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [good, good - 1, 5]),
            working: ["Is the IF inside the loop, or after NEXT?", "After the loop, Number holds only the last value typed."],
            note: "The IF runs once, after the loop, on the last number only. It should be inside the loop, after INPUT." };
        } },
      { id: "o-why", category: "pl-order",
        prompt: "Why does putting Total \u2190 0 inside the loop give the wrong total?",
        answers: ["Total goes back to 0 on every pass"],
        keywords: [/^(?=.*\b(every|each)\b)(?=.*(\b0\b|zero|reset|start(s|ed)?\s+again|back))/i],
        distractors: ["Total can never hold the value 0", "The loop then runs one extra time", "OUTPUT then runs before the loop"],
        working: ["How many times does a line inside the loop run?", "What happens to the total so far when Total is set to 0?"],
        note: "Inside the loop, Total \u2190 0 runs on every pass, so the total so far is lost. It belongs before the loop." },

      // ------------------------------------------------ The Value on the Line
      { id: "b-equal", category: "pl-bound", randomize: function () {
          var op = drillPick([">", ">", "<"]);
          var v = op === ">" ? drillPick([["Mark", "Pass", "Fail"], ["Score", "Win", "Lose"], ["Age", "Join", "Wait"]]) : drillPick([["Temp", "Cold", "Warm"], ["Price", "Cheap", "Dear"]]);
          var k = drillRange(3, 14) * 5;
          var rule = op === ">" ? k + " or more" : k + " or less";
          var lines = ["DECLARE " + v[0] + " : INTEGER", v[0] + " <- " + k, "IF " + v[0] + " " + op + " " + k + " THEN", "    OUTPUT \"" + v[1] + "\"", "ELSE", "    OUTPUT \"" + v[2] + "\"", "ENDIF"];
          var o = run(lines).out[0];
          return { prompt: "The rule says " + v[1] + " for " + rule + ". Follow this program exactly as it is written. What does it output?\n" + show(lines),
            answers: [o], keywords: [new RegExp("^\\s*[\"']?\\s*" + o + "\\s*[\"']?\\s*\\.?\\s*$", "i")], distractors: [o === v[1] ? v[2] : v[1]],
            working: ["Put the value into the condition. Is it TRUE or FALSE?", "Equal is not more, and not less. Which part runs when the condition is FALSE?"],
            note: k + " " + op + " " + k + " is FALSE, so the ELSE part runs. The rule needs " + op + "=." };
        } },
      { id: "b-count", category: "pl-bound", randomize: function () {
          var k = drillRange(4, 9) * 10, typed = shuffled([k, k].concat(nums(3, k - 15, k + 15, [k])));
          var lines = ["DECLARE Mark : INTEGER", "DECLARE Count : INTEGER", "DECLARE Passes : INTEGER", "Passes <- 0", "FOR Count <- 1 TO 5", "    INPUT Mark",
            "    IF Mark > " + k + " THEN", "        Passes <- Passes + 1", "    ENDIF", "NEXT Count", "OUTPUT Passes"];
          var o = run(lines, typed).out[0], good = typed.filter(function (m) { return m >= k; }).length;
          return { prompt: "A pass is " + k + " or more. The user types " + typed.join(", ") + ". Follow this program exactly as it is written. What does it output?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [good, good - 1, 5]),
            working: ["Check each mark with line 7, one at a time.", "A mark exactly on the line: is it more?"],
            note: "Only the marks more than " + k + " count: " + o + ". The two marks of " + k + " are missed. It should be >= " + k + "." };
        } },
      { id: "b-fix", category: "pl-bound", randomize: function () {
          var k = drillRange(4, 9) * 10 + drillPick([0, 5]);
          var lines = ["DECLARE Score : INTEGER", "INPUT Score", "IF Score > " + k + " THEN", "    OUTPUT \"Bonus\"", "ENDIF"];
          return { prompt: "A bonus is for a score of " + k + " or more. Which line should replace line 3?\n" + show(numbered(lines)),
            answers: ["IF Score >= " + k + " THEN"], keywords: [new RegExp("^\\s*if\\s+(score\\s*(>=\\s*" + k + "|>\\s*" + (k - 1) + ")|" + k + "\\s*<=\\s*score)\\s*(then)?\\s*\\.?\\s*$", "i")],
            distractors: ["IF Score <= " + k + " THEN", "IF Score = " + k + " THEN", "IF Score > " + (k + 1) + " THEN"],
            working: ["Does \"or more\" include the number itself?", "Which comparison is TRUE when the score is exactly on the line?"],
            note: ">= means more than or equal to, so a score of " + k + " gets the bonus." };
        } },
      { id: "b-why", category: "pl-bound",
        prompt: "Members must be 13 or over. Why does IF Age > 13 THEN not let a member aged 13 join?",
        answers: ["13 is not more than 13, so it needs >="],
        keywords: [/^(?=.*(not\s+(more|greater|bigger|over|larger)|equal|same))(?=.*(>=|or\s+equal|greater\s+than\s+or|more\s+than\s+or|equal\s+to))/i],
        distractors: ["13 is a syntax error in the IF line", "The IF runs before the INPUT line", "Age must be stored as a STRING"],
        working: ["Is 13 > 13 TRUE or FALSE?", "Which operator also includes the value itself?"],
        note: "13 > 13 is FALSE: 13 is equal, not more. Age >= 13 includes 13." },

      // ------------------------------------------------ Find, Fix, Prove
      { id: "f-input", category: "pl-fix", randomize: function () {
          var v = drillPick([["Mark", "marks"], ["Price", "prices"], ["Score", "scores"]]);
          var typed = nums(4, 2, 20);
          var lines = ["DECLARE " + v[0] + " : INTEGER", "DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    OUTPUT " + v[0],
            "    Total <- Total + " + v[0], "NEXT Count", "OUTPUT Total"];
          var o = run(lines, typed).out;
          return { prompt: "This program should input 4 " + v[1] + " and output their total. The user types " + typed.join(", ") + ". It outputs " + o.join(", ") + ". Which line causes it?\n" + show(numbered(lines)),
            answers: ["Line 6"], keywords: [lineRe(6)], distractors: ["Line 9", "Line 7", "Line 4"],
            working: ["Which line should take in what the user types?", "Is that line an INPUT, or an OUTPUT?"],
            note: "Line 6 should be INPUT " + v[0] + ". The wrong total shows on line 9, but it starts on line 6." };
        } },
      { id: "f-start", category: "pl-fix", randomize: function () {
          var vals = nums(4, 3, 15), sum = vals.reduce(function (a, b) { return a + b; }, 0);
          var lines = ["DECLARE Values : ARRAY[1:4] OF INTEGER", "DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total <- 0", "FOR Index <- 2 TO 4",
            "    Total <- Total + Values[Index]", "NEXT Index", "OUTPUT Total"];
          var full = lines.slice(0, 1).concat(vals.map(function (x, j) { return "Values[" + (j + 1) + "] <- " + x; })).concat(lines.slice(1));
          var o = run(full).out[0];
          return { prompt: "Values holds " + vals.join(", ") + " at index 1 to 4. This program should output their total, " + sum + ". It outputs " + o + ". Which line causes it?\n" + show(numbered(lines)),
            answers: ["Line 5"], keywords: [lineRe(5)], distractors: ["Line 8", "Line 6", "Line 4"],
            working: ["Which values of Index does the loop use?", "Is the first value in the array ever added?"],
            note: "Line 5 starts at 2, so Values[1] is never added. The wrong total shows on line 8, but the cause is line 5." };
        } },
      { id: "f-write", category: "pl-fix",
        prompt: "This program should input 4 prices and output their total. It outputs only the last price. Which line should replace line 7?\n" +
          "01 DECLARE Price : INTEGER\n02 DECLARE Total : INTEGER\n03 DECLARE Count : INTEGER\n04 Total \u2190 0\n05 FOR Count \u2190 1 TO 4\n06     INPUT Price\n07     Total \u2190 Price\n08 NEXT Count\n09 OUTPUT Total",
        answers: ["Total \u2190 Total + Price"], keywords: [/^\s*total\s*(<-|\u2190)\s*(total\s*\+\s*price|price\s*\+\s*total)\s*\.?\s*$/i],
        distractors: ["Total \u2190 Price + 1", "Price \u2190 Total + Price", "Total \u2190 Total + 1"],
        working: ["Should Total keep its old value on each pass?", "What must be added to Total on each pass?"],
        note: "Total \u2190 Total + Price keeps the total so far and adds the new price." },
      { id: "f-prove", category: "pl-fix", randomize: function () {
          var typed = nums(4, 2, 20);
          var lines = ["DECLARE Price : INTEGER", "DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    INPUT Price",
            "    Total <- Total + Price", "NEXT Count", "OUTPUT Total"];
          var o = run(lines, typed).out[0];
          return { prompt: "Line 7 was Total " + A + " Price. It has been corrected. The user types " + typed.join(", ") + ". Trace it again. What does it output now?\n" + show(numbered(lines)),
            answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [typed[3], Number(o) - typed[0], Number(o) + 1]),
            working: ["Total starts at 0. Each pass adds the price typed.", "Write Total after every pass."],
            note: "Total after each pass: " + run(lines, typed, [7, "Total"]).watched.join(", ") + ". The new trace gives the total, so the fix works." };
        } },
      { id: "f-why", category: "pl-fix",
        prompt: "Why should you trace a program again after you correct it?",
        answers: ["To check the fix gives the right output"],
        keywords: [/^(?=.*\b(prove|proves|check|checks|test|tests|see|show|shows|sure|confirm)\b)(?=.*\b(right|correct|works?|purpose|expected|job|new\s+error|another\s+error)\b)/i],
        distractors: ["To make the corrected program run faster", "To change the purpose of the program", "To find the line where the error shows"],
        working: ["Could a fix be wrong, or cause a new error?", "What must the new trace give?"],
        note: "A fix is a guess until it is tested. The new trace must give what the purpose says." }
    ];
  })()
});
