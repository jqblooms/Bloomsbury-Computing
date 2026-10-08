// Year 8, Term 1 Revision
// Loaded by Drills/index.html?drill=y8-term1-revision
// 20 minutes of revision before the Term 1 Test (TestBank.gs y8-term1). One card kind for every kind of test
// question, never the test's own values or programs (they are left out of every random range below). Every answer
// comes from running the program in the site's pseudocode engine. The wrong options are the answers common slips
// give (forgetting a variable changed, > for >=, stopping a loop one early, an OUTPUT inside a loop).
// Only what Year 8 has met: DECLARE, <-, INPUT, OUTPUT, IF ... THEN ... ELSE ... ENDIF, FOR ... NEXT,
// WHILE ... DO ... ENDWHILE, arrays from index 1, a Found flag. Each card's question comes first, its program after.
// Help never gives the card's own answer: `example` is a similar question worked through, `working` two nudges.
DrillData.register("y8-term1-revision", {
  title: "Year 8, Term 1 Revision",
  subtitle: "Sequence, Selection, Loops, Arrays, Searching, Flowcharts and Errors",
  categories: [
    ["t8-sel", "Sequence and Selection"],
    ["t8-loop", "Loops"],
    ["t8-arr", "Arrays and Searching"],
    ["t8-fc", "Flowcharts and Errors"]
  ],
  cards: (function () {
    function code(lines) { return lines.join("\n"); }
    function numbered(lines) { return lines.map(function (l, i) { return (i + 1) + "  " + l; }).join("\n"); }
    function run(lines, inputs, setup) {
      var r = PseudocodeEngine.runPseudocode((setup || []).concat(lines).join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(String);
    }
    function out(lines, inputs, setup) { return run(lines, inputs, setup).join(","); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function word(w) { return new RegExp("^\\s*(output\\s+)?[\"'\u201c\u2018]?\\s*" + w.replace(/ /g, "\\s*") + "\\s*[\"'\u201d\u2019]?\\s*[.!]?\\s*$", "i"); }
    function listRe(vals) { return new RegExp("^\\s*" + vals.join("[\\s,]+(then\\s+|and\\s+)?") + "\\s*[.]?\\s*$", "i"); }
    function others(n, list) {
      var pads = [n + 1, n - 1, n + 2, n - 2, n + 3];
      return drillWrongNumbers(n, list.concat(pads).filter(function (v) { return v !== n; }), 3);
    }
    function uniq(ans, list) {
      var o = [];
      list.forEach(function (x) { x = String(x); if (x !== String(ans) && o.indexOf(x) === -1 && o.length < 3) o.push(x); });
      return o;
    }
    function fill(name, vals) {
      return ["DECLARE " + name + " : ARRAY[1:" + vals.length + "] OF INTEGER"].concat(vals.map(function (v, i) { return name + "[" + (i + 1) + "] <- " + v; }));
    }
    function holds(name, vals) {
      return name + " holds:\nIndex: " + vals.map(function (v, i) { return String(i + 1).padStart(4); }).join("") +
        "\nValue: " + vals.map(function (v) { return String(v).padStart(4); }).join("");
    }
    function distinct(n, from, to, avoid) {
      var o = [];
      while (o.length < n) { var v = drillRange(from, to); if (o.indexOf(v) === -1 && (avoid || []).indexOf(v) === -1) o.push(v); }
      return o;
    }
    // The test's arrays are Marks 7, 12, 5, 9, 15 and Temps 9, 10, 14, 10, 6, 11: never draw them.
    function arrayValues(n) { var v; do { v = distinct(n, 2, 30); } while (v.join(",") === "7,12,5,9,15"); return v; }
    var NAMES = ["Scores", "Points", "Goals", "Laps", "Stars", "Ages"];
    var PAIRS = [["Yes", "No"], ["Open", "Closed"], ["Win", "Lose"], ["Hot", "Cold"], ["Fast", "Slow"]];
    var SYMBOLS = ["Start/End", "Process", "Input/Output", "Decision"];
    var SYM_RE = {
      "Process": /^\s*(a\s+)?(process|rectangle)(\s+(symbol|shape|box))?\s*$/i,
      "Input/Output": /^\s*(an?\s+)?(input\s*(\/|or|and)?\s*output|parallelogram|input|output|i\s*\/\s*o)(\s+(symbol|shape|box))?\s*$/i,
      "Decision": /^\s*(a\s+)?(decision|diamond)(\s+(symbol|shape|box))?\s*$/i
    };

    return [
      // ================================================= Sequence and Selection
      { id: "s-chain", category: "t8-sel", randomize: function () {
          var a, b, c;
          do { a = drillRange(2, 9); b = drillRange(2, 9); c = drillRange(2, 4); } while (a === 4 && b === 3 && c === 2);
          var p = ["DECLARE A : INTEGER", "DECLARE B : INTEGER", "A <- " + a, "B <- A + " + b, "A <- B * " + c, "OUTPUT A"];
          var ans = Number(out(p));
          return { prompt: "What does this program output?\n" + code(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [a * c, a + b, a + b + c]),
            example: "Example:\nX <- 3\nY <- X + 5\nX <- Y * 2\nOUTPUT X\nStep 1: X is 3.\nStep 2: Y is 3 + 5 = 8.\nStep 3: X changes to 8 x 2 = 16. The old 3 is gone.\nSo the output is 16.",
            working: ["Write each variable down. Change it every time a line gives it a new value.", "The last line uses the newest value, not the first one."],
            note: "B = " + (a + b) + ", then A = " + (a + b) + " x " + c + " = " + ans + "." };
        } },
      { id: "s-swap", category: "t8-sel", randomize: function () {
          var x = pick(2, 20, [5]), y = pick(2, 20, [9, x]);
          var p = ["DECLARE X : INTEGER", "DECLARE Y : INTEGER", "X <- " + x, "Y <- " + y, "X <- Y", "Y <- X", "OUTPUT X", "OUTPUT Y"];
          assert8(out(p) === y + "," + y, "swap");
          return { prompt: "This program is meant to swap X and Y. What does it actually output? Give both outputs, in order.\n" + code(p),
            answers: [y + " then " + y], keywords: [listRe([y, y])],
            distractors: [y + " then " + x, x + " then " + y, x + " then " + x],
            example: "Example:\nP <- 1\nQ <- 6\nP <- Q\nQ <- P\nStep 1: P <- Q makes P 6. The 1 is lost.\nStep 2: Q <- P copies P, which is now 6.\nSo P is 6 and Q is 6.",
            working: ["Trace the lines in order. After X <- Y, what is X now?", "When Y <- X runs, X has already changed."],
            note: "The first value is lost, so both are " + y + "." };
        } },
      { id: "s-change-if", category: "t8-sel", randomize: function () {
          var k = drillRange(2, 3), t, input;
          do { t = drillRange(4, 15) * k; input = t / k + drillPick([0, 0, -1, 1]); } while (t === 30 && k === 2);
          var w = drillPick(PAIRS), op = drillPick([">=", ">"]);
          var p = ["DECLARE Price : INTEGER", "INPUT Price", "Price <- Price * " + k, "IF Price " + op + " " + t + " THEN", "  OUTPUT \"" + w[0] + "\"", "ELSE", "  OUTPUT \"" + w[1] + "\"", "ENDIF"];
          var ans = out(p, [input]), wrongW = ans === w[0] ? w[1] : w[0];
          return { prompt: "The user types " + input + ". What does this program output?\n" + code(p), answers: [ans], keywords: [word(ans)],
            distractors: [wrongW, "Price", String(input * k)],
            example: "Example: the user types 6.\nPrice <- Price * 5\nIF Price > 30 THEN\nStep 1: Price changes first: 6 x 5 = 30.\nStep 2: the IF tests the new value. Is 30 > 30? No, they are equal.\nSo the ELSE part runs.",
            working: ["Work out the new Price on line 3 before you read the IF.", "Read the sign carefully. Does it include equal to?"],
            note: "Price becomes " + (input * k) + ". " + (input * k) + " " + op + " " + t + " is " + (ans === w[0] ? "true" : "false") + "." };
        } },
      { id: "s-count-pass", category: "t8-sel", randomize: function () {
          var t = pick(20, 80, [40]), op = drillPick([">", ">="]);
          var tries = drillPick([[t - 1, t, t + 1, t + 10], [t, t + 2, t - 5, t + 1], [t - 2, t, t + 5, t - 1]]);
          var p = ["DECLARE Mark : INTEGER", "INPUT Mark", "IF Mark " + op + " " + t + " THEN", "  OUTPUT \"Pass\"", "ELSE", "  OUTPUT \"Fail\"", "ENDIF"];
          var n = tries.filter(function (m) { return out(p, [m]) === "Pass"; }).length;
          var withEq = tries.filter(function (m) { return m >= t; }).length, noEq = tries.filter(function (m) { return m > t; }).length;
          return { prompt: "The user runs this program four times and types " + tries.join(", then ") + ". How many times does it output Pass?\n" + code(p),
            answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [op === ">" ? withEq : noEq, 4 - n]),
            example: "Example: IF Mark > 25 THEN, and the marks are 24, 25, 26.\n24 > 25? No. 25 > 25? No, they are equal. 26 > 25? Yes.\nSo Pass is output once.",
            working: ["Test each mark against the IF line, one at a time.", "Look at the sign: > does not include the equal number. >= does."],
            note: n + " of them pass with Mark " + op + " " + t + "." };
        } },
      { id: "s-two-if", category: "t8-sel", randomize: function () {
          var s, t, d;
          do { t = drillRange(5, 20); s = t + drillRange(1, 8); d = drillRange(2, 9); } while (s === 12 && t === 10 && d === 5);
          var p = ["DECLARE Score : INTEGER", "Score <- " + s, "IF Score > " + t + " THEN", "  Score <- Score - " + d, "ENDIF", "IF Score > " + t + " THEN", "  OUTPUT \"High\"", "ELSE", "  OUTPUT \"Low\"", "ENDIF"];
          var ans = out(p);
          return { prompt: "What does this program output?\n" + code(p), answers: [ans], keywords: [word(ans)],
            distractors: [ans === "High" ? "Low" : "High", String(s - d), "Score"],
            example: "Example:\nLevel <- 9\nIF Level > 6 THEN Level <- Level - 4\nIF Level > 6 THEN OUTPUT \"Up\" ELSE OUTPUT \"Down\"\nStep 1: 9 > 6, so Level becomes 5.\nStep 2: the second IF tests 5. Is 5 > 6? No.\nSo the output is Down.",
            working: ["The first IF may change Score. Work out Score after it.", "The second IF tests the new Score."],
            note: "Score becomes " + (s - d) + " before the second IF." };
        } },
      { id: "s-fix-if", category: "t8-sel", randomize: function () {
          var v = drillPick([["Height", "Ride", "Too small"], ["Score", "Winner", "Try again"], ["Speed", "Fast", "Slow"], ["Money", "Buy", "Save"]]);
          var t = pick(10, 120, [18]);
          var p = ["DECLARE " + v[0] + " : INTEGER", "INPUT " + v[0], "IF " + v[0] + " > " + t + " THEN", "  OUTPUT \"" + v[1] + "\"", "ELSE", "  OUTPUT \"" + v[2] + "\"", "ENDIF"];
          var fixed = p.slice(); fixed[2] = "IF " + v[0] + " >= " + t + " THEN";
          assert8(out(p, [t]) === v[2] && out(fixed, [t]) === v[1], "fix-if");
          var V = v[0], ans = "IF " + V + " >= " + t + " THEN";
          return { prompt: "A " + V + " of " + t + " should output " + v[1] + ", but this program outputs " + v[2] + ". Write the correct line 3.\n" + numbered(p),
            answers: [ans], keywords: [new RegExp("^\\s*if\\s*(" + V + "\\s*>=\\s*" + t + "|" + V + "\\s*>\\s*" + (t - 1) + "|" + t + "\\s*<=\\s*" + V + ")\\s*then\\s*$", "i")],
            distractors: ["IF " + V + " > " + (t + 1) + " THEN", "IF " + V + " <= " + t + " THEN", "IF " + V + " = " + t + " THEN"],
            example: "Example: a Mark of 50 should pass, but the line is IF Mark > 50 THEN.\n50 > 50 is false, so 50 fails.\nAdd equal to: IF Mark >= 50 THEN. Now 50 >= 50 is true.",
            working: ["Test the number in the question on line 3. Is the comparison true or false?", "Which sign means more than OR equal to?"],
            note: ans + " (or IF " + V + " > " + (t - 1) + " THEN)." };
        } },

      // ================================================= Loops
      { id: "l-for-out", category: "t8-loop", randomize: function () {
          var a, b, k;
          do { a = drillRange(1, 4); b = a + drillRange(2, 3); k = drillRange(2, 5); } while (a === 2 && b === 5 && k === 2);
          var p = ["DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "  OUTPUT Count * " + k, "NEXT Count"];
          var vals = run(p).map(Number), shortList = vals.slice(0, -1), fromOne = [];
          for (var i = 1; i <= b - a + 1; i++) fromOne.push(i * k);
          return { prompt: "Write every output of this program, in order.\n" + code(p), answers: [vals.join(", ")], keywords: [listRe(vals)],
            distractors: uniq(vals.join(", "), [shortList.join(", "), fromOne.join(", "), vals.map(function (x) { return x / k; }).join(", "), vals.slice(1).concat([(b + 1) * k]).join(", ")]),
            example: "Example:\nFOR Count <- 3 TO 5\n  OUTPUT Count * 10\nNEXT Count\nCount is 3, then 4, then 5 (the TO number is included).\nOutputs: 30, 40, 50.",
            working: ["List every value of Count, from the first number up to and including the TO number.", "Work out the OUTPUT line for each value of Count."],
            note: vals.join(", ") + "." };
        } },
      { id: "l-for-times", category: "t8-loop", randomize: function () {
          var a, b;
          do { a = drillRange(2, 9); b = a + drillRange(3, 9); } while (a === 3 && b === 8);
          var w = drillPick(["Hi", "Go", "Jump", "Clap"]);
          var p = ["DECLARE Count : INTEGER", "FOR Count <- " + a + " TO " + b, "  OUTPUT \"" + w + "\"", "NEXT Count"];
          var n = run(p).length;
          return { prompt: "How many times does this program output " + w + "?\n" + code(p), answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [b - a, b, b - a + 2]),
            example: "Example: FOR Count <- 4 TO 7\nCount is 4, 5, 6, 7. Count them: four values.\n(7 - 4 is only 3: it misses one. Add 1.)",
            working: ["Write down every value of Count, from the first number to the TO number.", "Count how many values you wrote."],
            note: a + " to " + b + " is " + n + " values." };
        } },
      { id: "l-trace", category: "t8-loop", randomize: function () {
          var s, n, minus = Math.random() < 0.5;
          do { s = drillRange(10, 40); n = drillRange(3, 5); } while (s === 20 && n === 4 && minus);
          var p = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- " + s, "FOR Count <- 1 TO " + n, "  Total <- Total " + (minus ? "-" : "+") + " Count", "NEXT Count", "OUTPUT Total"];
          var pass = drillRange(2, n - 1), probe = p.slice(0, 5).concat(["  IF Count = " + pass + " THEN", "    OUTPUT Total", "  ENDIF"], p.slice(5, 6));
          var atPass = Number(out(probe)), ans = Number(out(p));
          var ask = Math.random() < 0.5;
          var a = ask ? atPass : ans;
          return { prompt: (ask ? "Trace this program. What is Total at the end of the pass when Count is " + pass + "?" : "Trace this program. What does it output?") + "\n" + code(p),
            answers: [String(a)], keywords: [drillNumberRe(a, "total")],
            distractors: others(a, ask ? [minus ? s - pass : s + pass, minus ? atPass + pass : atPass - pass] : [minus ? s - n : s + n, minus ? ans + n : ans - n]),
            example: "Example:\nTotal <- 50\nFOR Count <- 1 TO 3\n  Total <- Total - Count\nNEXT Count\nPass 1: 50 - 1 = 49. Pass 2: 49 - 2 = 47. Pass 3: 47 - 3 = 44.\nEach pass uses the Total from the pass before.",
            working: ["Make a trace table with Count and Total. Write the start value of Total first.", "On each pass, use the Total from the row above, and that pass's Count."],
            note: (ask ? "After Count " + pass + ": " : "Output: ") + a + "." };
        } },
      // A whole trace table, like the test's: Count and OUTPUT are filled in, the student writes the Total column.
      { id: "l-table", category: "t8-loop", widget: "trace", randomize: function () {
          var s, n, k, op;
          do { s = drillRange(0, 30); n = drillRange(4, 5); k = drillRange(1, 3); op = drillPick(["+", "-"]); }
          while ((s === 20 && n === 4 && op === "-" && k === 1) || (op === "-" && s < n * (n + 1) * k / 2));
          var step = k === 1 ? "Count" : "Count * " + k;
          var p = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- " + s, "FOR Count <- 1 TO " + n, "  Total <- Total " + op + " " + step, "NEXT Count", "OUTPUT Total"];
          var rows = [["", String(s), ""]], t = s;
          for (var c = 1; c <= n; c++) { t = op === "+" ? t + c * k : t - c * k; rows.push([String(c), String(t), ""]); }
          rows.push(["", "", String(t)]);
          assert8(out(p) === String(t), "trace table");
          var col = rows.map(function (r) { return r[1]; }).filter(Boolean).join(", ");
          return { prompt: "Complete the trace table for this program. Write Total for each pass of the loop.\n" + code(p),
            trace: { columns: ["Count", "Total", "OUTPUT"], rows: rows, askable: [1] },
            answers: [col], keywords: [listRe(col.split(", "))], distractors: [],
            working: ["Write the first value of Total in the first row, before the loop starts.", "On each pass, use the Total from the row above, and that row's Count."],
            note: "Total: " + col + "." };
        } },
      { id: "l-inside", category: "t8-loop", randomize: function () {
          var k, n;
          do { k = drillRange(2, 9); n = drillRange(3, 4); } while (k === 5 && n === 3);
          var p = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO " + n, "  Total <- Total + " + k, "  OUTPUT Total", "NEXT Count"];
          var vals = run(p).map(Number), last = vals[vals.length - 1];
          var same = vals.map(function () { return k; }), before = vals.map(function (v) { return v - k; });
          return { prompt: "What does this program output? Give every output, in order.\n" + code(p), answers: [vals.join(", ")], keywords: [listRe(vals)],
            distractors: uniq(vals.join(", "), [String(last), same.join(", "), before.join(", ")]),
            example: "Example:\nTotal <- 0\nFOR Count <- 1 TO 3\n  Total <- Total + 10\n  OUTPUT Total\nNEXT Count\nOUTPUT is inside the loop, so it runs on every pass, after Total changes: 10, 20, 30.",
            working: ["Is the OUTPUT line inside the loop or after it?", "Inside the loop, OUTPUT runs on every pass, after the line above it."],
            note: vals.join(", ") + "." };
        } },
      { id: "l-while", category: "t8-loop", randomize: function () {
          var s, lim, d, r;
          do { s = drillRange(15, 40); lim = drillRange(2, 8); d = drillRange(3, 7); r = Number(out(["DECLARE Number : INTEGER", "Number <- " + s, "WHILE Number > " + lim + " DO", "  Number <- Number - " + d, "ENDWHILE", "OUTPUT Number"])); }
          while ((s === 20 && lim === 5 && d === 6) || r === lim || r < 0);
          var p = ["DECLARE Number : INTEGER", "Number <- " + s, "WHILE Number > " + lim + " DO", "  Number <- Number - " + d, "ENDWHILE", "OUTPUT Number"];
          return { prompt: "What does this program output?\n" + code(p), answers: [String(r)], keywords: [drillNumberRe(r)],
            distractors: others(r, [r + d, r - d, lim]),
            example: "Example:\nNumber <- 17\nWHILE Number > 4 DO\n  Number <- Number - 5\nENDWHILE\n17 > 4, so 12. 12 > 4, so 7. 7 > 4, so 2. 2 > 4? No: the loop stops.\nThe output is the value when the test fails.",
            working: ["Before each pass, test the WHILE line. Only go round if it is true.", "Keep going until the test is false. That value is output."],
            note: "The loop stops at " + r + "." };
        } },

      // ================================================= Arrays and Searching
      { id: "a-value", category: "t8-arr", randomize: function () {
          var name = drillPick(NAMES), v = arrayValues(5), i = drillRange(2, 4);
          var ans = v[i - 1];
          return { prompt: "What is the value of " + name + "[" + i + "]?\n" + holds(name, v), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: uniq(ans, [v[i], v[i - 2], i, v[(i + 1) % 5], v[(i + 2) % 5]]),
            example: "Example: Laps holds 8, 3, 6 at index 1 to 3.\nLaps[2] means the value at index 2. Find 2 in the Index row, then read the Value under it: 3.",
            working: ["The number in the brackets is the index.", "Find that index in the Index row. Read the value under it."],
            note: name + "[" + i + "] = " + ans + "." };
        } },
      { id: "a-index", category: "t8-arr", randomize: function () {
          var name = drillPick(NAMES), v = arrayValues(5), i = drillRange(1, 5);
          return { prompt: "Which index holds the value " + v[i - 1] + "?\n" + holds(name, v), answers: [String(i)], keywords: [drillNumberRe(i, "index")],
            distractors: uniq(i, [v[i - 1]].concat([i - 1, i + 1, i - 2, i + 2, 1, 2, 3, 4, 5].filter(function (x) { return x >= 1 && x <= 5; }))),
            example: "Example: Goals holds 4, 9, 2 at index 1 to 3. Which index holds 9?\nFind 9 in the Value row. The index above it is 2.",
            working: ["Find the value in the Value row.", "Read the index number above it."],
            note: v[i - 1] + " is at index " + i + "." };
        } },
      { id: "a-part", category: "t8-arr", randomize: function () {
          var name = drillPick(NAMES), v = arrayValues(5), a, b;
          do { a = drillRange(1, 3); b = drillRange(a + 1, 5); } while (a === 1 && b === 5);
          var p = ["DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total <- 0", "FOR Index <- " + a + " TO " + b, "  Total <- Total + " + name + "[Index]", "NEXT Index", "OUTPUT Total"];
          var ans = Number(out(p, [], fill(name, v))), all = v.reduce(function (x, y) { return x + y; }, 0), idx = 0;
          for (var i = a; i <= b; i++) idx += i;
          return { prompt: "What does this program output?\n" + holds(name, v) + "\n" + code(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [all, idx, ans - v[b - 1]]),
            example: "Example: Stars holds 5, 8, 1, 6. The loop is FOR Index <- 2 TO 3.\nOnly index 2 and 3 are added: 8 + 1 = 9. Index 1 and 4 are never visited.",
            working: ["Which indexes does the FOR line visit? Start and stop where it says.", "Add only the values at those indexes, not the index numbers."],
            note: "Index " + a + " to " + b + ": " + ans + "." };
        } },
      { id: "a-count", category: "t8-arr", randomize: function () {
          var name = drillPick(NAMES), t = pick(8, 20, [8]), v = arrayValues(5), op = drillPick([">", ">="]);
          v[drillRange(0, 4)] = t; // one value equals the limit, so the sign matters
          if (v.join(",") === "7,12,5,9,15") v[0] = 3;
          var p = ["DECLARE Tally : INTEGER", "DECLARE Index : INTEGER", "Tally <- 0", "FOR Index <- 1 TO 5", "  IF " + name + "[Index] " + op + " " + t + " THEN", "    Tally <- Tally + 1", "  ENDIF", "NEXT Index", "OUTPUT Tally"];
          var ans = Number(out(p, [], fill(name, v)));
          var gt = v.filter(function (x) { return x > t; }).length, ge = v.filter(function (x) { return x >= t; }).length;
          return { prompt: "What does this program output?\n" + holds(name, v) + "\n" + code(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [op === ">" ? ge : gt, 5 - ans]),
            example: "Example: Laps holds 4, 6, 9, 6. IF Laps[Index] > 6 THEN adds 1.\n4 > 6? No. 6 > 6? No, equal. 9 > 6? Yes. 6 > 6? No.\nTally is 1.",
            working: ["Test every value in the array against the IF line.", "Watch the values equal to the limit. Does the sign include equal to?"],
            note: "Values " + op + " " + t + ": " + ans + "." };
        } },
      { id: "a-search-line", category: "t8-arr", randomize: function () {
          var name = drillPick(NAMES), n = drillRange(4, 6);
          var p = ["DECLARE Search : INTEGER", "DECLARE Found : BOOLEAN", "DECLARE Index : INTEGER", "INPUT Search", "Found <- FALSE", "FOR Index <- 1 TO " + n,
            "  ....................", "    Found <- TRUE", "  ENDIF", "NEXT Index", "IF Found = TRUE THEN", "  OUTPUT \"Found\"", "ELSE", "  OUTPUT \"Not found\"", "ENDIF"];
          var ans = "IF " + name + "[Index] = Search THEN";
          var full = p.slice(); full[6] = "  " + ans;
          var v = arrayValues(n);
          assert8(out(full, [v[1]], fill(name, v)) === "Found" && out(full, [99], fill(name, v)) === "Not found", "search line");
          return { prompt: "This linear search looks through " + name + " for the number the user types. Line 7 is missing. Write line 7.\n" + numbered(p),
            answers: [ans], keywords: [new RegExp("^\\s*if\\s*(" + name + "\\s*\\[\\s*index\\s*\\]\\s*=\\s*search|search\\s*=\\s*" + name + "\\s*\\[\\s*index\\s*\\])\\s*then\\s*$", "i")],
            distractors: ["IF " + name + "[Search] = Index THEN", "IF Index = Search THEN", "IF Found = TRUE THEN"],
            example: "Example: a search through Names for the name in Wanted.\nEach pass compares the item at this index with the thing we want:\nIF Names[Index] = Wanted THEN",
            working: ["Which item does this pass of the loop look at? Use the loop variable as the index.", "Compare that item with the number the user typed."],
            note: ans };
        } },
      { id: "a-search-reset", category: "t8-arr", randomize: function () {
          var name = drillPick(NAMES), v = arrayValues(4);
          var p = ["DECLARE Search : INTEGER", "DECLARE Found : BOOLEAN", "DECLARE Index : INTEGER", "INPUT Search", "Found <- FALSE", "FOR Index <- 1 TO 4",
            "  IF " + name + "[Index] = Search THEN", "    Found <- TRUE", "  ELSE", "    Found <- FALSE", "  ENDIF", "NEXT Index", "IF Found = TRUE THEN", "  OUTPUT \"Found\"", "ELSE", "  OUTPUT \"Not found\"", "ENDIF"];
          var i = drillRange(1, 4), ans = out(p, [v[i - 1]], fill(name, v));
          return { prompt: "This search has a logic error. The user searches for " + v[i - 1] + ". What does it output?\n" + holds(name, v) + "\n" + code(p),
            answers: [ans], keywords: [word(ans)], distractors: [ans === "Found" ? "Not found" : "Found", "TRUE", "FALSE"],
            example: "Example: the same kind of search on Goals 3, 8, 5, searching for 8.\nIndex 1: 3 is not 8, Found is FALSE. Index 2: 8 matches, Found is TRUE.\nIndex 3: 5 is not 8, so the ELSE sets Found back to FALSE.\nAfter the loop, Found is FALSE.",
            working: ["Trace Found for every index, not just the one that matches.", "What does the ELSE do to Found after a match?"],
            note: "Only the last item can still be Found at the end: " + ans + "." };
        } },
      { id: "a-total-line", category: "t8-arr", randomize: function () {
          var name = drillPick(["Prices", "Costs", "Weights", "Times"]), n = drillRange(5, 10);
          var p = ["DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total <- 0", "FOR Index <- 1 TO " + n, "  ....................", "NEXT Index", "OUTPUT Total"];
          var ans = "Total <- Total + " + name + "[Index]";
          return { prompt: "This program should add up all " + n + " values in " + name + ". Line 5 is missing. Write line 5.\n" + numbered(p),
            answers: [ans], keywords: [new RegExp("^\\s*total\\s*(<-+|\u2190)\\s*(total\\s*\\+\\s*" + name + "\\s*\\[\\s*index\\s*\\]|" + name + "\\s*\\[\\s*index\\s*\\]\\s*\\+\\s*total)\\s*$", "i")],
            distractors: ["Total <- " + name + "[Index]", "Total <- Total + Index", "Total <- Total + " + name + "[" + n + "]"],
            example: "Example: count the laps in Laps.\nEach pass adds the value at this index to the running total:\nSum <- Sum + Laps[Index]",
            working: ["Total must keep what it had, and add one more value.", "Which value? The one at this pass's index."],
            note: ans };
        } },

      // ================================================= Flowcharts and Errors
      { id: "f-symbol", category: "t8-fc", randomize: function () {
          var t = drillRange(10, 50), w = drillPick(PAIRS);
          var p = ["DECLARE Price : INTEGER", "INPUT Price", "Price <- Price + " + drillRange(2, 9), "IF Price > " + t + " THEN", "  OUTPUT \"" + w[0] + "\"", "ELSE", "  OUTPUT \"" + w[1] + "\"", "ENDIF"];
          var line = drillPick([2, 3, 4, 5]), sym = { 2: "Input/Output", 3: "Process", 4: "Decision", 5: "Input/Output" }[line];
          return { prompt: "In a flowchart, which shape is used for line " + line + "?\n" + numbered(p), answers: [sym], keywords: [SYM_RE[sym]],
            distractors: SYMBOLS.filter(function (s) { return s !== sym; }),
            example: "Example:\nINPUT Age: data comes in, so it is a parallelogram.\nAge <- Age + 1: a calculation, so it is a rectangle.\nIF Age > 12 THEN: a question with two paths, so it is a diamond.\nOUTPUT Age: data goes out, so it is a parallelogram.",
            working: ["What does the line do: take data in or show it, calculate, or ask a question?", "A question with a true path and a false path has its own shape."],
            note: "Line " + line + ": " + sym + "." };
        } },
      { id: "f-bug-out", category: "t8-fc", randomize: function () {
          var t = pick(5, 20, [10]), v = distinct(6, 2, 30, []);
          v[drillRange(0, 2)] = t; v[drillRange(3, 5)] = t;
          var p = ["DECLARE Warm : INTEGER", "DECLARE Index : INTEGER", "Warm <- 0", "FOR Index <- 1 TO 6", "  IF Days[Index] > " + t + " THEN", "    Warm <- Warm + 1", "  ENDIF", "NEXT Index", "OUTPUT Warm"];
          var ans = Number(out(p, [], fill("Days", v))), meant = v.filter(function (x) { return x >= t; }).length;
          return { prompt: "This program should count the days that are " + t + " or more. Follow it exactly as it is written. What does it actually output?\n" + holds("Days", v) + "\n" + code(p),
            answers: [String(ans)], keywords: [drillNumberRe(ans)], distractors: others(ans, [meant, 6 - ans]),
            example: "Example: count marks of 5 or more, but the line is IF Marks[Index] > 5 THEN.\nMarks 5, 7, 3: 5 > 5 is false, 7 > 5 is true, 3 > 5 is false.\nIt outputs 1, not the 2 it should.",
            working: ["Do what the program says, not what it should do.", "Test each value with the sign that is written. Watch the equal values."],
            note: "As written it counts only values more than " + t + ": " + ans + "." };
        } },
      { id: "f-bug-line", category: "t8-fc", randomize: function () {
          var t = pick(5, 20, [10]), name = drillPick(["Days", "Marks", "Goals"]);
          var p = ["DECLARE Tally : INTEGER", "DECLARE Index : INTEGER", "Tally <- 0", "FOR Index <- 1 TO 6", "  IF " + name + "[Index] > " + t + " THEN", "    Tally <- Tally + 1", "  ENDIF", "NEXT Index", "OUTPUT Tally"];
          var ans = "IF " + name + "[Index] >= " + t + " THEN";
          return { prompt: "This program should count the values that are " + t + " or more. It has one logic error. Write the correct line.\n" + numbered(p),
            answers: [ans], keywords: [new RegExp("^\\s*(line\\s*\\d+\\s*[:.-]?\\s*)?if\\s*" + name + "\\s*\\[\\s*index\\s*\\]\\s*(>=\\s*" + t + "|>\\s*" + (t - 1) + ")\\s*then\\s*$", "i")],
            distractors: ["IF " + name + "[Index] > " + (t + 1) + " THEN", "IF " + name + "[Index] = " + t + " THEN", "IF " + name + "[Index] <= " + t + " THEN"],
            example: "Example: count scores of 20 or more, but the line is IF Scores[Index] > 20 THEN.\nA score of 20 is not counted. The fix adds equal to:\nIF Scores[Index] >= 20 THEN",
            working: ["Test a value equal to the limit. Is it counted?", "Which sign means more than OR equal to?"],
            note: ans + " (line 5)." };
        } }
    ];
    function assert8(ok, msg) { if (!ok) throw new Error("y8-term1-revision: " + msg); }
  })()
});
