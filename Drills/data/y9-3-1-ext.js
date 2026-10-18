// Year 9, 3.1 Do Now Extension: Term 1a (number systems, 2.2 loops, 2.3 arrays, 2.6 errors and trace tables).
// Loaded by Drills/index.html?drill=y9-3-1-ext
// For students who finish the Do Now early. Every card has an `example`, a similar question worked through with
// different values, then two `working` nudges. An example never shows the card's own answer. Every answer that comes
// from a program is worked out by running it in shared/pseudocode-engine.js (loaded before this file). The question
// comes first and the program after it.
DrillData.register("y9-3-1-ext", {
  title: "Year 9 Extension: Term 1a Review",
  subtitle: "3.1 Do Now Extension",
  choiceOnly: true,
  categories: [
    ["ex-num", "Number Systems"],
    ["ex-loops", "Loops (2.2)"],
    ["ex-arrays", "Arrays (2.3)"],
    ["ex-errors", "Errors and Trace Tables (2.6)"]
  ],
  cards: (function () {
    var A = "\u2190";
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function run(lines, inputs) {
      var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(String);
    }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) + 2, Number(ans) - 1, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function bits(n) { return ("00000000" + n.toString(2)).slice(-8); }
    function lineRe(n) { return new RegExp("^\\s*(line\\s*)?0?" + n + "\\s*\\.?\\s*$", "i"); }
    // Draw until the answer is not one of the worked example's own numbers.
    function avoid(make, example) {
      var c, tries = 0;
      do { c = make(); tries++; } while (tries < 50 && new RegExp("(^|[^0-9A-Za-z])" + c.answers[0] + "($|[^0-9A-Za-z])").test(example));
      c.example = example;
      return c;
    }

    return [
      // ------------------------------------------------ number systems
      { id: "ex-01", category: "ex-num", randomize: function () {
          var ex = "Example: change 75 into 8-bit binary.\nPlace values: 128 64 32 16 8 4 2 1.\n128 does not fit: 0. 64 fits: 1, and 75 - 64 = 11 is left.\n32 and 16 do not fit: 0 0. 8 fits: 1, 11 - 8 = 3 left.\n4 does not fit: 0. 2 fits: 1, 1 left. 1 fits: 1.\nSo 75 is 01001011.";
          return avoid(function () {
            var n; do { n = drillRange(20, 250); } while (n === 75 || n === 128);
            var b = bits(n), wrong = [];
            [0, 3, 6, 7].forEach(function (i) { var w = b.slice(0, i) + (b[i] === "1" ? "0" : "1") + b.slice(i + 1); if (wrong.length < 3 && w !== b) wrong.push(w); });
            return { prompt: "Convert the denary number " + n + " into 8-bit binary.", answers: [b], keywords: [new RegExp("^\\s*" + b + "\\s*$")], distractors: wrong,
              working: ["Write the eight place values, from 128 on the left.", "Does each place value fit into what is left? Write 1 if it fits, 0 if not."],
              note: n + " in 8-bit binary is " + b + "." };
          }, ex);
        } },
      { id: "ex-02", category: "ex-num", randomize: function () {
          var ex = "Example: convert 10010110 into denary.\nPlace values: 128 64 32 16 8 4 2 1.\nThe 1s are under 128, 16, 4 and 2.\n128 + 16 + 4 + 2 = 150.";
          return avoid(function () {
            var n; do { n = drillRange(20, 250); } while (n === 150 || n === 128);
            var b = bits(n), low = n & -n, rev = parseInt(b.split("").reverse().join(""), 2);
            return { prompt: "Convert the binary number " + b + " into denary.", answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - low, rev, n + 16]),
              working: ["Write the place values above the bits, from 128 on the left.", "Add up the place values that have a 1 under them."],
              note: b + " is " + n + " in denary." };
          }, ex);
        } },
      { id: "ex-03", category: "ex-num", randomize: function () {
          var H = "0123456789ABCDEF";
          var ex = "Example: convert the hexadecimal number 3C into denary.\nThe left digit is worth 16 each: 3 x 16 = 48.\nC is 12.\n48 + 12 = 60.";
          return avoid(function () {
            var n; do { n = drillRange(26, 250); } while (n === 60 || n === 48);
            var h = H[Math.floor(n / 16)] + H[n % 16];
            return { prompt: "Convert the hexadecimal number " + h + " into denary.", answers: [String(n)], keywords: [drillNumberRe(n)],
              distractors: others(n, [Math.floor(n / 16) * 10 + (n % 16), Math.floor(n / 16) + (n % 16), n + 16]),
              working: ["The left digit counts lots of 16.", "A is 10, B is 11, up to F, which is 15. Add the right digit."],
              note: h + " = " + Math.floor(n / 16) + " x 16 + " + (n % 16) + " = " + n + "." };
          }, ex);
        } },
      // ------------------------------------------------ 2.2 loops
      { id: "ex-04", category: "ex-loops", randomize: function () {
          var ex = "Example: FOR Count " + A + " 3 TO 7\nCount takes the values 3, 4, 5, 6, 7.\nThat is 5 values, so the loop runs 5 times.";
          return avoid(function () {
            var a = drillRange(2, 6), b = a + drillRange(3, 8);
            var lines = ["DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    OUTPUT Count", "NEXT Count"];
            var n = run(lines).length;
            return { prompt: "How many times does this loop run?\n" + show(lines), answers: [String(n)], keywords: [new RegExp("^\\s*" + n + "\\s*(times?)?\\s*\\.?\\s*$", "i")], distractors: others(n, [n - 1, b - a, b]),
              working: ["List the values Count takes, from the first number to the last.", "Count them. The first and the last both count."],
              note: "Count takes " + a + " to " + b + ": " + n + " times." };
          }, ex);
        } },
      { id: "ex-05", category: "ex-loops", randomize: function () {
          var ex = "Example: the same program with FOR Count " + A + " 1 TO 4.\nTotal starts at 0.\nPass 1: 0 + 1 = 1. Pass 2: 1 + 2 = 3. Pass 3: 3 + 3 = 6. Pass 4: 6 + 4 = 10.\nAfter the loop it outputs 10.";
          return avoid(function () {
            var a = drillRange(2, 4), b = a + drillRange(2, 3);
            var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- " + a + " TO " + b, "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
            var t = run(lines)[0];
            return { prompt: "What does this program output?\n" + show(lines), answers: [t], keywords: [drillNumberRe(Number(t))], distractors: others(t, [Number(t) - b, Number(t) - a, b]),
              working: ["Total starts at 0. Each pass adds the value of Count.", "Write Total after every pass."],
              note: "Total is the sum of " + a + " to " + b + ": " + t + "." };
          }, ex);
        } },
      // ------------------------------------------------ 2.3 arrays
      { id: "ex-06", category: "ex-arrays", randomize: function () {
          var ex = "Example: Heights holds 120, 140, 130 at index 1 to 3.\nOUTPUT Heights[2]\nIndex 2 is the second position. Its value is 140.\nThe number in the square brackets is a position, not a value.";
          return avoid(function () {
            var vals = [], i = drillRange(1, 5);
            while (vals.length < 5) { var v = drillRange(3, 29); if (vals.indexOf(v) === -1 && v !== i) vals.push(v); }
            var lines = ["DECLARE Marks : ARRAY[1:5] OF INTEGER"].concat(vals.map(function (v, k) { return "Marks[" + (k + 1) + "] <- " + v; })).concat(["OUTPUT Marks[" + i + "]"]);
            var a = run(lines)[0];
            return { prompt: "Marks holds " + vals.join(", ") + " at index 1 to 5. What does this line output?\nOUTPUT Marks[" + i + "]",
              answers: [a], keywords: [drillNumberRe(Number(a))], distractors: others(a, [i, vals[i % 5], vals[(i + 3) % 5]]),
              working: ["The number in the square brackets is a position.", "Count along the positions from the start."],
              note: "Marks[" + i + "] is " + a + "." };
          }, ex);
        } },
      { id: "ex-07", category: "ex-arrays", randomize: function () {
          var ex = "Example: Ages holds 9, 14, 12, 16, and the IF is Ages[Index] > 12.\n9: no. 14: yes. 12: no, 12 is equal, not more. 16: yes.\nSo the program outputs 2.";
          return avoid(function () {
            var k = drillRange(10, 20), vals = [k], v;
            while (vals.length < 5) { v = drillRange(k - 8, k + 8); if (v !== k && vals.indexOf(v) === -1) vals.push(v); }
            vals.sort(function () { return Math.random() - 0.5; });
            var lines = ["DECLARE Temps : ARRAY[1:5] OF INTEGER", "DECLARE Index : INTEGER", "DECLARE Count : INTEGER", "Count <- 0", "FOR Index <- 1 TO 5", "    IF Temps[Index] > " + k + " THEN", "        Count <- Count + 1", "    ENDIF", "NEXT Index", "OUTPUT Count"];
            var full = lines.slice(0, 1).concat(vals.map(function (x, j) { return "Temps[" + (j + 1) + "] <- " + x; })).concat(lines.slice(1));
            var a = run(full)[0];
            return { prompt: "Temps holds " + vals.join(", ") + " at index 1 to 5. What does this program output?\n" + show(lines),
              answers: [a], keywords: [drillNumberRe(Number(a))], distractors: others(a, [Number(a) + 1, 5 - Number(a), 5]),
              working: ["Check each value against the number in the IF.", "Equal does not count: the value must be more."],
              note: "Only the values more than " + k + " are counted: " + a + "." };
          }, ex);
        } },
      // ------------------------------------------------ 2.6 errors and trace tables
      { id: "ex-08", category: "ex-errors", randomize: function () {
          var ex = "Example: the same bug with FOR Count " + A + " 1 TO 3.\nEvery pass starts with Total " + A + " 0.\nPass 1: 0 + 1 = 1. Pass 2: 0 + 2 = 2. Pass 3: 0 + 3 = 3.\nIt outputs 3, not 6.";
          return avoid(function () {
            var a = drillRange(2, 4), b = a + drillRange(2, 4);
            var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "    Total <- 0", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"];
            var o = run(lines)[0], sum = 0;
            for (var c = a; c <= b; c++) sum += c;
            return { prompt: "This program should add up " + a + " to " + b + ". Follow it exactly as it is written. What does it output?\n" + show(lines),
              answers: [o], keywords: [drillNumberRe(Number(o))], distractors: others(o, [sum, 0, a]),
              working: ["What happens to Total at the start of every pass?", "After the last pass, what is left in Total?"],
              note: "Total goes back to 0 every pass, so only the last Count is left: " + o + "." };
          }, ex);
        } },
      { id: "ex-09", category: "ex-errors", randomize: function () {
          var v = drillPick([
            { q: "This program should add up 1 to 5. Which line has the error?", lines: ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    Total <- Total + Count", "NEXT Count", "OUTPUT Total"], line: 4, wrong: [3, 5, 7],
              ex: "Example: a loop should run 6 times, but the FOR line says 1 TO 5.\nThe FOR line decides how many passes there are, so the FOR line has the error.", why: "Line 4 stops at 4. It should be 1 TO 5." },
            { q: "This program should output each number doubled: 2, 4, 6, 8. Which line has the error?", lines: ["DECLARE Count : INTEGER", "FOR Count <- 1 TO 4", "    OUTPUT Count + 2", "NEXT Count"], line: 3, wrong: [1, 2, 4],
              ex: "Example: a program should output each number tripled, but it says OUTPUT Count + 3.\nThe OUTPUT line makes the numbers, so that line has the error: it should be Count * 3.", why: "Line 3 adds 2. It should be OUTPUT Count * 2." },
            { q: "This program should output the total of 1 to 4. Which line has the error?", lines: ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO 4", "    Total <- Total + Count", "NEXT Count", "OUTPUT Count"], line: 7, wrong: [3, 5, 6],
              ex: "Example: a program adds up Score in a loop, then its last line is OUTPUT Number.\nThe loop is right, but the last line outputs the wrong variable.", why: "Line 7 outputs Count. It should output Total." }]);
          return { prompt: v.q + "\n" + show(numbered(v.lines)), answers: ["Line " + v.line], keywords: [lineRe(v.line)],
            distractors: v.wrong.map(function (n) { return "Line " + n; }), example: v.ex,
            working: ["Say what each line does to each variable.", "Which line first makes the result different from what it should be?"], note: v.why };
        } },
      { id: "ex-10", category: "ex-errors", randomize: function () {
          var v = drillPick([["Mark", "Pass", "Fail", "the pass mark"], ["Points", "Win", "Lose", "the winning score"], ["Height", "Ride", "Wait", "the height limit"]]);
          var k = drillRange(4, 14) * 5;
          var lines = ["DECLARE " + v[0] + " : INTEGER", v[0] + " <- " + k, "IF " + v[0] + " > " + k + " THEN", "    OUTPUT \"" + v[1] + "\"", "ELSE", "    OUTPUT \"" + v[2] + "\"", "ENDIF"];
          var o = run(lines)[0];
          return { prompt: "The rule is " + k + " or more. Follow this program exactly as it is written. What does it output?\n" + show(lines),
            answers: [o], keywords: [new RegExp("^\\s*[\"']?\\s*" + o + "\\s*[\"']?\\s*\\.?\\s*$", "i")], distractors: [o === v[1] ? v[2] : v[1]],
            example: "Example: the rule is 20 or more, and the program says IF Temp > 20 THEN OUTPUT \"Hot\" ELSE OUTPUT \"Cold\".\nTemp is 20. Is 20 > 20? No: 20 is equal, not more.\nSo the ELSE part runs, and it outputs Cold.",
            working: ["Put the value into the condition. Is it more than the number?", "Equal is not more. Which part runs when the condition is FALSE?"],
            note: k + " is not more than " + k + ", so the ELSE part runs. It should be >= " + k + "." };
        } }
    ];
  })()
});
