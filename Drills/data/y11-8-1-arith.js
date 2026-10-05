// Year 11, 8.1 L3: Arithmetic Operators (Plenary)
// Loaded by Drills/index.html?drill=y11-8-1-arith
// The five arithmetic operators (+ - * / ^), DIV and MOD (quotient and remainder), tracing short programs that use
// them, and writing the lines. Every value is drawn fresh; every answer is worked out the way the program runs it
// (DIV keeps the whole number part, MOD the remainder), and a scratch test runs each program through
// shared/pseudocode-engine.js to confirm. Cambridge pseudocode, every variable declared.
DrillData.register("y11-8-1-arith", {
  title: "Year 11, 8.1 L3: Arithmetic Operators",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["ar-ops", "The Operators"],
    ["ar-divmod", "DIV and MOD"],
    ["ar-trace", "Trace the Program"],
    ["ar-write", "Write the Line"]
  ],
  cards: (function () {
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function numRe(n) { return new RegExp("^\\s*" + String(n).replace(".", "\\.") + "\\s*$"); }
    function uniq(n, list) { var out = []; list.concat([Number(n) + 1, Number(n) + 2, Number(n) + 3, Number(n) + 4]).forEach(function (v) { v = String(v); if (v !== String(n) && out.indexOf(v) === -1) out.push(v); }); return out.slice(0, 3); }
    function div(a, b) { return Math.trunc(a / b); }
    function mod(a, b) { return a % b; }
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var OPS = {
      "+": ["add", function (a, b) { return a + b; }],
      "-": ["subtract", function (a, b) { return a - b; }],
      "*": ["multiply", function (a, b) { return a * b; }],
      "^": ["raised to the power of", function (a, b) { return Math.pow(a, b); }]
    };

    return [
      // ------------------------------------------------ The Operators
      { id: "op-01", category: "ar-ops", randomize: function () {
          var op = drillPick(["+", "-", "*", "^"]), a = pick(3, 9, [4]), b = op === "^" ? pick(2, 3) : pick(2, 6, [a]), r = OPS[op][1](a, b);
          return { prompt: "What is " + a + " " + op + " " + b + "?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [a + b, a * b, a - b, Math.pow(a, b), r + 1]),
            example: "Example: 4 ^ 3. ^ means raised to the power of: 4 * 4 * 4 = 64.\nThe other operators: + add, - subtract, * multiply, / divide.",
            working: [op + " means " + OPS[op][0] + ".", "Work it out with " + a + " and " + b + "."],
            note: a + " " + op + " " + b + " = " + r + " (" + OPS[op][0] + ")." };
        } },
      { id: "op-02", category: "ar-ops", randomize: function () {
          var b = drillPick([2, 4]), a, r;
          do { a = pick(5, 19); } while (a % b === 0 || a / b === 3.25);
          r = a / b;
          return { prompt: "What is " + a + " / " + b + "?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [div(a, b), mod(a, b), a * b, div(a, b) + 1]),
            example: "Example: 13 / 4. / is normal division, so the answer can have a decimal point.\n13 / 4 = 3.25.",
            working: ["/ is normal division. It keeps the decimal part.", "How many times does " + b + " go into " + a + ", with a decimal point?"],
            note: a + " / " + b + " = " + r + "." };
        } },
      { id: "op-03", category: "ar-ops", prompt: "Which operator means raised to the power of?", answers: ["^"], keywords: [/^\s*\^\s*$/], distractors: ["*", "/", "MOD"],
        note: "^ means raised to the power of: 2 ^ 3 = 2 * 2 * 2 = 8." },
      { id: "op-04", category: "ar-ops", prompt: "Which operator returns the remainder of a division?", answers: ["MOD"], keywords: [/^\s*mod\s*$/i], distractors: ["DIV", "/", "^"],
        note: "MOD returns the remainder: MOD(10, 3) returns 1. From Cambridge IGCSE 0478/23, November 2023, Question 2." },
      { id: "op-05", category: "ar-ops", prompt: "Which operator returns the quotient of a calculation with the fractional part discarded?", answers: ["DIV"], keywords: [/^\s*div\s*$/i], distractors: ["MOD", "/", "^"],
        note: "DIV returns the quotient, the whole number part: DIV(10, 3) returns 3. From Cambridge IGCSE 0478/21, November 2025, Question 3." },
      { id: "op-06", category: "ar-ops", prompt: "Which operator means multiply?", answers: ["*"], keywords: [/^\s*\*\s*$/], distractors: ["^", "+", "/"],
        note: "* means multiply: 7 * 2 = 14." },

      // ------------------------------------------------ DIV and MOD
      { id: "dm-01", category: "ar-divmod", randomize: function () {
          var b = pick(3, 7), a, r;
          do { a = pick(11, 40); } while (a % b === 0 || div(a, b) === 3);
          r = div(a, b);
          return { prompt: "What does DIV(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [mod(a, b), r + 1, a / b]),
            example: "Example: DIV(17, 5). How many full groups of 5 fit into 17?\n5, 10, 15: that is 3 full groups. 20 is too many.\nSo DIV(17, 5) returns 3.",
            working: ["DIV: how many full groups of " + b + " fit into " + a + "?", "Count up in " + b + "s without going past " + a + "."],
            note: b + " goes into " + a + " " + r + " whole times: DIV(" + a + ", " + b + ") = " + r + "." };
        } },
      { id: "dm-02", category: "ar-divmod", randomize: function () {
          var b = pick(3, 7), a, r;
          do { a = pick(11, 40); } while (a % b === 0 || mod(a, b) === 2);
          r = mod(a, b);
          return { prompt: "What does MOD(" + a + ", " + b + ") return?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [div(a, b), r + 1, a / b]),
            example: "Example: MOD(17, 5). The full groups of 5 make 15.\n17 - 15 = 2 left over.\nSo MOD(17, 5) returns 2.",
            working: ["Find the biggest number of full groups of " + b + " that fits into " + a + ".", "Take that away from " + a + ". What is left over?"],
            note: a + " - " + (div(a, b) * b) + " = " + r + " left over: MOD(" + a + ", " + b + ") = " + r + "." };
        } },
      { id: "dm-03", category: "ar-divmod", randomize: function () {
          var a, r;
          do { a = pick(101, 999); } while (a % 10 === 0 || a === 355 || div(a, 10) === 48);
          r = div(a, 10);
          return { prompt: "What is " + a + " DIV 10?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [mod(a, 10), a / 10, r + 1]),
            example: "Example: 482 DIV 10. This means the same as DIV(482, 10).\n482 / 10 = 48.2. Throw away the fractional part: 48.",
            working: ["Work out " + a + " / 10.", "Throw away the part after the decimal point."],
            note: a + " / 10 = " + (a / 10) + ", so " + a + " DIV 10 = " + r + ". Like Cambridge IGCSE 0478/23, June 2025, Question 2." };
        } },
      { id: "dm-04", category: "ar-divmod", randomize: function () {
          var a, r;
          do { a = pick(101, 999); } while (a % 10 === 0 || a === 355 || a % 10 === 2);
          r = mod(a, 10);
          return { prompt: "What is " + a + " MOD 10?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [div(a, 10), a / 10, r + 1]),
            example: "Example: 482 MOD 10. 48 full tens make 480.\n482 - 480 = 2 left over. So 482 MOD 10 = 2.",
            working: ["How many full tens fit into " + a + "?", "Take them away. What is left over?"],
            note: a + " - " + (div(a, 10) * 10) + " = " + r + ". Like Cambridge IGCSE 0478/23, June 2025, Question 2." };
        } },
      { id: "dm-05", category: "ar-divmod", randomize: function () {
          var n = pick(11, 49), r = mod(n, 2);
          return { prompt: "What does MOD(" + n + ", 2) return?", answers: [String(r)], keywords: [numRe(r)],
            distractors: uniq(r, [div(n, 2), 2, n / 2, 1 - r]),
            example: "Example: MOD(9, 2). Full groups of 2 in 9: 4 groups make 8.\n9 - 8 = 1 left over, so MOD(9, 2) returns 1.\nMOD(8, 2) returns 0: 8 splits into 2s exactly.",
            working: ["Split " + n + " into groups of 2.", "Is anything left over?"],
            note: "MOD(" + n + ", 2) = " + r + (r === 0 ? ": " + n + " splits into 2s exactly." : ": 1 is left over.") };
        } },

      // ------------------------------------------------ Trace the Program
      { id: "tr-01", category: "ar-trace", randomize: function () {
          var m, h;
          do { m = pick(65, 299); } while (m % 60 === 0 || div(m, 60) === 2);
          h = div(m, 60);
          return { prompt: "What is the FIRST output?\n" + code("DECLARE Minutes : INTEGER", "DECLARE Hours : INTEGER", "DECLARE Mins : INTEGER", "Minutes <- " + m, "Hours <- DIV(Minutes, 60)", "Mins <- MOD(Minutes, 60)", "OUTPUT Hours", "OUTPUT Mins"),
            answers: [String(h)], keywords: [numRe(h)], distractors: uniq(h, [mod(m, 60), h + 1, (m / 60).toFixed(2)]),
            example: "Example: Minutes <- 135. The first output is Hours.\nHours <- DIV(135, 60): 60, 120 fit, 180 is too many. Hours = 2.\nMins <- MOD(135, 60) = 135 - 120 = 15. So it outputs 2, then 15.",
            working: ["The first OUTPUT is Hours.", "Hours <- DIV(Minutes, 60): how many full 60s fit into " + m + "?"],
            note: "DIV(" + m + ", 60) = " + h + "." };
        } },
      { id: "tr-02", category: "ar-trace", randomize: function () {
          var m, r;
          do { m = pick(65, 299); } while (m % 60 === 0 || m % 60 === 15);
          r = mod(m, 60);
          return { prompt: "What is the SECOND output?\n" + code("DECLARE Minutes : INTEGER", "DECLARE Hours : INTEGER", "DECLARE Mins : INTEGER", "Minutes <- " + m, "Hours <- DIV(Minutes, 60)", "Mins <- MOD(Minutes, 60)", "OUTPUT Hours", "OUTPUT Mins"),
            answers: [String(r)], keywords: [numRe(r)], distractors: uniq(r, [div(m, 60), r + 1, m - 60]),
            example: "Example: Minutes <- 135. The second output is Mins.\nThe full hours are 2 * 60 = 120.\nMins <- MOD(135, 60) = 135 - 120 = 15.",
            working: ["The second OUTPUT is Mins.", "Take the full hours (60s) away from " + m + ". What is left over?"],
            note: "MOD(" + m + ", 60) = " + m + " - " + (div(m, 60) * 60) + " = " + r + "." };
        } },
      { id: "tr-03", category: "ar-trace", randomize: function () {
          var size = pick(3, 6), s, r;
          do { s = pick(13, 40); } while (s % size === 0 || s % size === 2);
          r = mod(s, size);
          return { prompt: "What is output?\n" + code("DECLARE Sweets : INTEGER", "DECLARE Left : INTEGER", "Sweets <- " + s, "Left <- MOD(Sweets, " + size + ")", "OUTPUT Left"),
            answers: [String(r)], keywords: [numRe(r)], distractors: uniq(r, [div(s, size), r + 1, s - size]),
            example: "Example: Sweets <- 17, then Left <- MOD(Sweets, 5).\nFull bags of 5 hold 15 sweets. 17 - 15 = 2.\nLeft is 2, so it outputs 2.",
            working: ["MOD gives what is left over.", "Fill as many full groups of " + size + " as you can, then count what is left."],
            note: "MOD(" + s + ", " + size + ") = " + r + "." };
        } },
      { id: "tr-04", category: "ar-trace", randomize: function () {
          var side = pick(3, 9, [4]), add = pick(2, 9), r = side * side + add;
          return { prompt: "What is output?\n" + code("DECLARE Side : INTEGER", "DECLARE Area : INTEGER", "Side <- " + side, "Area <- Side ^ 2", "Area <- Area + " + add, "OUTPUT Area"),
            answers: [String(r)], keywords: [numRe(r)], distractors: uniq(r, [side * 2 + add, side * side, r + side]),
            example: "Example: Side <- 4, Area <- Side ^ 2, then Area <- Area + 3.\nSide ^ 2 = 4 * 4 = 16. Then 16 + 3 = 19.\nIt outputs 19.",
            working: ["Side ^ 2 means Side * Side.", "Then add " + add + " to that value."],
            note: side + " ^ 2 = " + (side * side) + ", + " + add + " = " + r + "." };
        } },
      { id: "tr-05", category: "ar-trace", randomize: function () {
          var n, r;
          do { n = pick(12, 98); } while (n % 10 === 0 || n === 47 || div(n, 10) + n % 10 === 11);
          r = div(n, 10) + mod(n, 10);
          return { prompt: "What is output?\n" + code("DECLARE Number : INTEGER", "DECLARE Tens : INTEGER", "DECLARE Units : INTEGER", "Number <- " + n, "Tens <- DIV(Number, 10)", "Units <- MOD(Number, 10)", "OUTPUT Tens + Units"),
            answers: [String(r)], keywords: [numRe(r)], distractors: uniq(r, [n, div(n, 10), mod(n, 10), r + 1]),
            example: "Example: Number <- 47.\nTens <- DIV(47, 10) = 4. Units <- MOD(47, 10) = 7.\nOUTPUT Tens + Units outputs 4 + 7 = 11.",
            working: ["Tens is DIV(" + n + ", 10). Units is MOD(" + n + ", 10).", "Add Tens and Units."],
            note: "Tens = " + div(n, 10) + ", Units = " + mod(n, 10) + ", so " + div(n, 10) + " + " + mod(n, 10) + " = " + r + "." };
        } },

      // ------------------------------------------------ Write the Line
      { id: "wr-01", category: "ar-write",
        prompt: "Area, Length and Width have been declared. Write the line that stores Length multiplied by Width in Area.",
        answers: ["Area <- Length * Width"], keywords: [new RegExp("^\\s*Area" + ARROW + "(Length\\s*\\*\\s*Width|Width\\s*\\*\\s*Length)\\s*$", "i")],
        distractors: ["Area <- Length + Width", "Area <- Length ^ Width", "Length * Width <- Area"], format: "Type the whole line",
        example: "Example: store Price multiplied by Quantity in Cost.\nThe variable that gets the value goes first, then the arrow, then the calculation:\nCost <- Price * Quantity",
        working: ["Which operator means multiply?", "The variable first, then the arrow, then the calculation."],
        note: "Area <- Length * Width" },
      { id: "wr-02", category: "ar-write",
        prompt: "Hours and Minutes have been declared. Write the line that uses DIV to store the number of whole hours in Minutes in Hours (60 minutes in an hour).",
        answers: ["Hours <- DIV(Minutes, 60)"], keywords: [new RegExp("^\\s*Hours" + ARROW + "(DIV\\s*\\(\\s*Minutes\\s*,\\s*60\\s*\\)|Minutes\\s+DIV\\s+60)\\s*$", "i")],
        distractors: ["Hours <- MOD(Minutes, 60)", "Hours <- Minutes / 60", "Hours <- DIV(60, Minutes)"], format: "Type the whole line",
        example: "Example: store the number of full weeks in Days in Weeks (7 days in a week).\nDIV gives the full groups. The number being split goes first:\nWeeks <- DIV(Days, 7)",
        working: ["DIV(the number being split, the size of each group).", "The variable first, then the arrow."],
        note: "Hours <- DIV(Minutes, 60). Minutes DIV 60 also works." },
      { id: "wr-03", category: "ar-write", randomize: function () {
          var d = pick(3, 9, [7]);
          return { prompt: "Left and Total have been declared. Write the line that uses MOD to store the remainder of Total divided by " + d + " in Left.",
            answers: ["Left <- MOD(Total, " + d + ")"], keywords: [new RegExp("^\\s*Left" + ARROW + "(MOD\\s*\\(\\s*Total\\s*,\\s*" + d + "\\s*\\)|Total\\s+MOD\\s+" + d + ")\\s*$", "i")],
            distractors: ["Left <- DIV(Total, " + d + ")", "Left <- Total / " + d, "Left <- MOD(" + d + ", Total)"], format: "Type the whole line",
            example: "Example: store the remainder of Score divided by 7 in Spare.\nMOD gives the remainder. The number being divided goes first:\nSpare <- MOD(Score, 7)",
            working: ["MOD(the number being divided, the number to divide by).", "The variable first, then the arrow."],
            note: "Left <- MOD(Total, " + d + "). Total MOD " + d + " also works." };
        } },
      { id: "wr-04", category: "ar-write",
        prompt: "Square and Side have been declared. Write the line that stores Side raised to the power of 2 in Square.",
        answers: ["Square <- Side ^ 2"], keywords: [new RegExp("^\\s*Square" + ARROW + "(Side\\s*\\^\\s*2|Side\\s*\\*\\s*Side)\\s*$", "i")],
        distractors: ["Square <- Side * 2", "Square <- 2 ^ Side", "Square <- Side + 2"], format: "Type the whole line",
        example: "Example: store Base raised to the power of 3 in Cube.\n^ means raised to the power of:\nCube <- Base ^ 3",
        working: ["Which operator means raised to the power of?", "The variable first, then the arrow, then the calculation."],
        note: "Square <- Side ^ 2" }
    ];
  })()
});
