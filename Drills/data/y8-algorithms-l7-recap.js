// Year 8, L7 Do Now: a recap of the Algorithms unit so far (L1 to L6)
// Loaded by Drills/index.html?drill=y8-algorithms-l7-recap
// Ten cards, two per topic: L1 and L2 Sequence and Selection, L3 Arrays, L4 Linear Search, L5 Iteration and Data
// Types, L6 Flowcharts. Every card draws a fresh question each time. The L5 cards sometimes draw a real Cambridge
// IGCSE 0478 Paper 2 question, cited in the note. Number cards carry `example` (a similar question worked
// through); word cards carry only `working` nudges, since an example with another word would narrow the answer.
DrillData.register("y8-algorithms-l7-recap", {
  title: "Year 8, L7 Do Now: Recap So Far",
  subtitle: "Cambridge Pseudocode: L1 to L6",
  categories: [
    ["rc-seqsel", "L1 and L2: Sequence and Selection"],
    ["rc-arrays", "L3: Arrays"],
    ["rc-search", "L4: Linear Search"],
    ["rc-iteration", "L5: Iteration and Data Types"],
    ["rc-flow", "L6: Flowcharts"]
  ],
  cards: (function () {
    var pick = drillPick;
    function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function numRe(n) { return new RegExp("^\\s*" + (n < 0 ? "-\\s*" : "") + Math.abs(n) + "\\s*$"); }
    function wordRe(src) { return new RegExp("^\\s*(the\\s+|an?\\s+)?(" + src + ")\\s*$", "i"); }
    function others(answer, list) { return drillWrongNumbers(String(answer), list.map(String), 4); }
    function fromPaper(ref) { return "From Cambridge IGCSE " + ref + "."; }
    function code(lines) { return lines.join("\n"); }
    function distinct(n, lo, hi) {
      var out = [];
      while (out.length < n) { var v = drillRange(lo, hi); if (out.indexOf(v) === -1) out.push(v); }
      return out;
    }

    // As in the Year 10 recap: a draw picks a kind; a kind with a real past-paper version uses it about a third of
    // the time. The worked example is another draw of the same kind whose answer appears nowhere in it.
    function card(id, category, kinds, withExample) {
      return { id: id, category: category, randomize: function () {
        var kind = pick(kinds), c = kind(Math.random() < 0.35), example = null;
        if (withExample) {
          var ans = String(c.answer).toLowerCase();
          var mentions = new RegExp("(^|[^a-z0-9])" + reEsc(ans) + "($|[^a-z0-9])");
          for (var i = 0; i < 60 && !example; i++) {
            var e = kind(false), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
            if (String(e.answer) !== String(c.answer) && e.prompt !== c.prompt && !mentions.test(text)) {
              example = "A similar question:\n" + e.prompt + "\n" + e.steps.join("\n") + "\nAnswer: " + e.answer;
            }
          }
        }
        return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
          working: c.working, example: example, note: c.note };
      } };
    }

    // ================================================================ L1 and L2: Sequence and Selection
    function sequence() {
      var a = drillRange(2, 9), k = drillRange(2, 5), m = drillRange(1, 9);
      var b = a * k, out = b - m;
      return { prompt: code(["What does this algorithm output?", "DECLARE A : INTEGER", "DECLARE B : INTEGER", "A <- " + a, "B <- A * " + k, "A <- B - " + m, "OUTPUT A"]),
        answer: out, re: numRe(out), wrong: others(out, [a, b, a - m, b + m]),
        steps: ["A starts as " + a + ".", "B <- A * " + k + " makes B " + b + ".", "A <- B - " + m + " makes A " + out + "."],
        working: ["Go line by line and keep a note of each variable's value.", "A line with <- replaces the value on the left with the value worked out on the right."],
        note: "A = " + a + ", then B = " + a + " * " + k + " = " + b + ", then A = " + b + " - " + m + " = " + out + "." };
    }
    function selection() {
      var v = pick([["Mark", "Pass", "Fail"], ["Age", "Allowed", "Too young"], ["Score", "Winner", "Try again"]]);
      var cut = drillRange(3, 8) * 10, op = pick([">=", ">", "<"]);
      var x = pick([cut, cut + drillRange(1, 9), cut - drillRange(1, 9)]);
      var yes = op === ">=" ? x >= cut : op === ">" ? x > cut : x < cut;
      var ans = yes ? v[1] : v[2];
      return { prompt: code([v[0] + " is input as " + x + ". What is output?", "DECLARE " + v[0] + " : INTEGER", "INPUT " + v[0], "IF " + v[0] + " " + op + " " + cut + " THEN", "    OUTPUT \"" + v[1] + "\"", "ELSE", "    OUTPUT \"" + v[2] + "\"", "ENDIF"]),
        answer: ans, re: wordRe(reEsc(ans)), wrong: [yes ? v[2] : v[1], v[0], String(x)], steps: [],
        working: ["Put the input into the condition in place of " + v[0] + ".", "If the condition is TRUE the line after THEN runs; if it is FALSE the line after ELSE runs."],
        note: x + " " + op + " " + cut + " is " + (yes ? "TRUE" : "FALSE") + ", so the " + (yes ? "THEN" : "ELSE") + " branch outputs " + ans + "." };
    }

    // ================================================================ L3: Arrays
    function readItem() {
      var name = pick(["Marks", "Scores", "Ages", "Temps"]), size = drillRange(5, 7);
      var items = distinct(size, 3, 60), idx = drillRange(2, size);
      var ans = items[idx - 1];
      return { prompt: code(["The array " + name + " holds: " + items.join(", ") + ".", "What is " + name + "[" + idx + "]?"]),
        answer: ans, re: numRe(ans), wrong: others(ans, [items[idx - 2], items[idx] !== undefined ? items[idx] : items[0], idx, items[0]]),
        steps: ["The first item is position 1, so count along from " + items[0] + ".", "Position " + idx + " is the " + idx + (idx === 2 ? "nd" : idx === 3 ? "rd" : "th") + " item."],
        working: ["In these arrays the first item is at position 1.", "Count along the list until you reach the position in the brackets."],
        note: name + "[" + idx + "] is the item at position " + idx + ": " + ans + "." };
    }
    function arraySize() {
      var name = pick(["Marks", "Scores", "Names", "Heights"]), hi = drillRange(4, 30);
      var type = name === "Names" ? "STRING" : "INTEGER";
      return { prompt: "DECLARE " + name + " : ARRAY[1:" + hi + "] OF " + type + " creates an array with how many positions?",
        answer: hi, re: numRe(hi), wrong: others(hi, [hi - 1, hi + 1, 1, hi * 2]),
        steps: ["[1:" + hi + "] means positions 1, 2, 3 and so on up to " + hi + ".", "Count them: from 1 to " + hi + " inclusive."],
        working: ["The two numbers in the brackets are the first and the last position.", "Both ends count."],
        note: "Positions 1 to " + hi + " make " + hi + " positions." };
    }

    // ================================================================ L4: Linear Search
    function foundAt() {
      var size = drillRange(5, 7), items = distinct(size, 2, 50), pos = drillRange(2, size), target = items[pos - 1];
      return { prompt: "A linear search looks for " + target + " in this array: " + items.join(", ") + ". At which position does it find it?",
        answer: pos, re: numRe(pos), wrong: others(pos, [pos - 1, pos + 1, target, size]),
        steps: ["Start at position 1 and compare each item with the target in turn.", "Stop at the first item that matches."],
        working: ["A linear search starts at the first position.", "Count each item you compare until you reach the one that matches."],
        note: target + " is the item at position " + pos + "." };
    }
    function flagOutput() {
      var items = distinct(5, 2, 40), present = Math.random() < 0.5;
      var target = present ? pick(items) : drillRange(41, 60);
      var ans = present ? "Found" : "Not found";
      return { prompt: code(["Values holds " + items.join(", ") + ". Target is input as " + target + ". What is output?",
        "DECLARE Found : BOOLEAN", "DECLARE Index : INTEGER", "Found <- FALSE", "FOR Index <- 1 TO 5", "    IF Values[Index] = Target THEN", "        Found <- TRUE", "    ENDIF", "NEXT Index",
        "IF Found = TRUE THEN", "    OUTPUT \"Found\"", "ELSE", "    OUTPUT \"Not found\"", "ENDIF"]),
        answer: ans, re: present ? /^\s*found\s*$/i : /^\s*not\s+found\s*$/i, wrong: [present ? "Not found" : "Found", "TRUE", "FALSE"], steps: [],
        working: ["Found starts as FALSE and only becomes TRUE when an item matches the target.", "Check every item in Values against the target."],
        note: present ? target + " is in Values, so Found becomes TRUE and the output is Found." : target + " is not in Values, so Found stays FALSE and the output is Not found." };
    }

    // ================================================================ L5: Iteration and Data Types
    function forTotal() {
      var n = drillRange(3, 6), k = drillRange(2, 9), start = drillRange(0, 10), total = start + n * k;
      return { prompt: code(["What does this algorithm output?", "DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- " + start, "FOR Count <- 1 TO " + n, "    Total <- Total + " + k, "NEXT Count", "OUTPUT Total"]),
        answer: total, re: numRe(total), wrong: others(total, [start + (n - 1) * k, start + (n + 1) * k, n * k, start + k]),
        steps: ["FOR Count <- 1 TO " + n + " runs the loop " + n + " times.", "Each pass adds " + k + " to Total, which starts at " + start + "."],
        working: ["Work out how many times the loop body runs.", "Add the same amount once for every pass, starting from the first value of Total."],
        note: start + " + " + n + " x " + k + " = " + total + "." };
    }
    function loopTypes(real) {
      var prompt = real
        ? "Complete the sentence: two types of pseudocode statements used for iteration are ___ and ___."
        : "Name the two kinds of loop you have met in Cambridge Pseudocode.";
      return { prompt: prompt, answer: "FOR ... NEXT and WHILE ... DO ... ENDWHILE",
        re: /^(?=.*\bfor\b)(?=.*\bwhile\b)(?!.*\b(if|case|repeat)\b).*$/i,
        wrong: ["CASE and IF", "FOR ... NEXT and IF", "REPEAT ... UNTIL and CASE"], steps: [],
        working: ["One loop runs a set number of times, the other keeps going while a condition is TRUE.", "Name the keyword that starts each one."],
        note: "FOR ... NEXT is count-controlled and WHILE ... DO ... ENDWHILE is condition-controlled." + (real ? " " + fromPaper("0478/22, June 2026, Question 1") : "") };
    }
    var TYPES = [
      { d: "the number of students in a class, for example 28", t: "INTEGER" },
      { d: "a height in metres, for example 1.62", t: "REAL" },
      { d: "a pet's name, for example Biscuit", t: "STRING" },
      { d: "whether a door is locked or not, for example FALSE", t: "BOOLEAN" },
      { d: "one grade letter, for example B", t: "CHAR" },
      { d: "a price with pence, for example 4.99", t: "REAL" },
      { d: "a postcode, for example HY1 2AB", t: "STRING" }
    ];
    var REAL_TYPES = [
      { d: "a single letter, symbol or number input from the keyboard", t: "CHAR", ref: "0478/22, June 2026, Question 2" },
      { d: "any combination of letters and numbers", t: "STRING", ref: "0478/23, June 2026, Question 2" },
      { d: "Age, the age of the student, for example 16", t: "INTEGER", ref: "0478/21, June 2026, Question 3" },
      { d: "Teenager, whether the student is a teenager or not, for example TRUE", t: "BOOLEAN", ref: "0478/21, June 2026, Question 3" }
    ];
    function dataType(real) {
      var it = pick(real ? REAL_TYPES : TYPES);
      return { prompt: "Which data type is most appropriate to store " + it.d + "?", answer: it.t,
        re: it.t === "CHAR" ? /^\s*(char|character)\s*$/i : it.t === "BOOLEAN" ? /^\s*(boolean|bool)\s*$/i : it.t === "INTEGER" ? /^\s*(integer|int)\s*$/i : wordRe(it.t.toLowerCase()),
        wrong: ["INTEGER", "REAL", "STRING", "BOOLEAN", "CHAR"].filter(function (t) { return t !== it.t; }).slice(0, 3), steps: [],
        working: ["Whole numbers, numbers with a decimal point, text, TRUE or FALSE, or exactly one character?", "Look at the example value: what kind of value is it?"],
        note: "The type is " + it.t + "." + (it.ref ? " " + fromPaper(it.ref) : "") };
    }
    function declareTwo(real) {
      var pair = real ? ["Seconds", "Minutes"] : pick([["Width", "Height"], ["Goals", "Points"], ["Lives", "Level"]]);
      var ans = "DECLARE " + pair[0] + ", " + pair[1] + " : INTEGER";
      var lead = real
        ? "The variables Seconds and Minutes are used in a program. Seconds holds the number of seconds as a whole number and Minutes holds the number of minutes as a whole number. Write pseudocode to declare them."
        : "The variables " + pair[0] + " and " + pair[1] + " both hold whole numbers. Write pseudocode to declare them.";
      var a = reEsc(pair[0]), b = reEsc(pair[1]);
      var one = "DECLARE\\s+(" + a + "\\s*,\\s*" + b + "|" + b + "\\s*,\\s*" + a + ")\\s*:\\s*INTEGER";
      var two = "DECLARE\\s+" + a + "\\s*:\\s*INTEGER[\\s;,]+DECLARE\\s+" + b + "\\s*:\\s*INTEGER";
      var twoB = "DECLARE\\s+" + b + "\\s*:\\s*INTEGER[\\s;,]+DECLARE\\s+" + a + "\\s*:\\s*INTEGER";
      return { prompt: lead, answer: ans, re: new RegExp("^\\s*(" + one + "|" + two + "|" + twoB + ")\\s*$", "i"),
        wrong: ["DECLARE " + pair[0] + ", " + pair[1] + " : REAL", pair[0] + " <- INTEGER", "DECLARE INTEGER : " + pair[0] + ", " + pair[1]], steps: [],
        working: ["A declaration starts with DECLARE, then the name, a colon and the type.", "Whole numbers are INTEGER. Two variables of the same type can share one DECLARE line, separated by a comma."],
        note: ans + " (or one DECLARE line for each)." + (real ? " " + fromPaper("0478/21, November 2025, Question 10(a)") : "") };
    }

    // ================================================================ L6: Flowcharts
    var BOXES = [
      { t: "Ask the user to enter Age", s: "Input/Output" },
      { t: "Display the value of Total", s: "Input/Output" },
      { t: "Store 0 in Count", s: "Process" },
      { t: "Store Price * Quantity in Cost", s: "Process" },
      { t: "Is Mark more than or equal to 50?", s: "Decision" },
      { t: "Is Age less than 13?", s: "Decision" },
      { t: "Start", s: "Terminal" },
      { t: "End", s: "Terminal" }
    ];
    var SYMBOL_RE = { "Input/Output": /^\s*(an?\s+)?(input\s*(\/|or|and)?\s*output|i\s*\/\s*o|parallelogram)(\s+(symbol|box|shape))?\s*$/i,
      "Process": /^\s*(a\s+)?(process|rectangle)(\s+(symbol|box|shape))?\s*$/i,
      "Decision": /^\s*(a\s+)?(decision|diamond)(\s+(symbol|box|shape))?\s*$/i,
      "Terminal": /^\s*(a\s+)?(terminal|terminator|rounded\s+(box|rectangle)|start\s*\/?\s*end)(\s+(symbol|box|shape))?\s*$/i };
    function symbol() {
      var b = pick(BOXES);
      return { prompt: "Which flowchart symbol holds \"" + b.t + "\"?", answer: b.s, re: SYMBOL_RE[b.s],
        wrong: ["Terminal", "Process", "Input/Output", "Decision"].filter(function (s) { return s !== b.s; }), steps: [],
        working: ["Asking for or displaying a value, storing or working out a value, a Yes/No question, or the start or end?", "Match what the box does to the symbol for that job."],
        note: "\"" + b.t + "\" goes in a" + (b.s === "Input/Output" ? "n" : "") + " " + b.s + " symbol." };
    }
    function boxToLine() {
      var kind = pick(["store", "ask", "show"]);
      var name = pick(["Total", "Score", "Count", "Age", "Price"]), n = drillRange(1, 99);
      if (kind === "store") {
        return { prompt: "A Process box says: Store " + n + " in " + name + ". Write the matching pseudocode line.",
          answer: name + " <- " + n, re: new RegExp("^\\s*" + name + "\\s*(<-|\\u2190)\\s*" + n + "\\s*$", "i"),
          wrong: [name + " = " + n, "OUTPUT " + n, n + " <- " + name], steps: [],
          working: ["Storing a value is an assignment.", "The variable goes on the left of the arrow <- and the value on the right."],
          note: "Store " + n + " in " + name + " becomes " + name + " <- " + n + "." };
      }
      if (kind === "ask") {
        return { prompt: "An Input/Output box says: Ask the user to enter " + name + ". Write the matching pseudocode line.",
          answer: "INPUT " + name, re: new RegExp("^\\s*INPUT\\s+" + name + "\\s*$", "i"),
          wrong: ["OUTPUT " + name, name + " <- INPUT", "DECLARE " + name + " : INTEGER"], steps: [],
          working: ["Asking the user for a value is an input.", "The keyword comes first, then the variable that stores what they type."],
          note: "Ask the user to enter " + name + " becomes INPUT " + name + "." };
      }
      return { prompt: "An Input/Output box says: Display the value of " + name + ". Write the matching pseudocode line.",
        answer: "OUTPUT " + name, re: new RegExp("^\\s*OUTPUT\\s+" + name + "\\s*$", "i"),
        wrong: ["INPUT " + name, "OUTPUT \"" + name + "\"", "PRINT " + name], steps: [],
        working: ["Displaying a value is an output.", "The keyword comes first, then the variable whose value is shown."],
        note: "Display the value of " + name + " becomes OUTPUT " + name + "." };
    }

    return [
      card("rc-sequence", "rc-seqsel", [sequence], false),
      card("rc-selection", "rc-seqsel", [selection], false),
      card("rc-read", "rc-arrays", [readItem], true),
      card("rc-size", "rc-arrays", [arraySize], true),
      card("rc-found-at", "rc-search", [foundAt], true),
      card("rc-flag", "rc-search", [flagOutput], false),
      card("rc-loop", "rc-iteration", [forTotal, loopTypes], false),
      card("rc-types", "rc-iteration", [dataType, declareTwo], false),
      card("rc-symbol", "rc-flow", [symbol], false),
      card("rc-box", "rc-flow", [boxToLine], false)
    ];
  })()
});
