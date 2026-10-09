// Year 9, Term 1a Revision
// Loaded by Drills/index.html?drill=y9-term1a-revision
// 20 minutes of revision before the Term 1a test: Number Systems, 2.2 Loops, 2.3 Data Types and Arrays,
// 2.6 Errors and Trace Tables. Questions are like the test's but never use its values or programs (the test's
// own numbers are left out of every random range below). Errors and Trace Tables has the most card kinds: the
// 2.6 race on 2026-10-05 showed Follow the Bug, Find the Line and boundaries were weakest.
// Only what Year 9 has met: DECLARE, assignment, INPUT, OUTPUT, FOR ... TO ... NEXT, IF ... THEN ... ELSE ... ENDIF,
// one-dimensional arrays from index 1. Each card's question comes first and its program after it.
// Help never gives the card's own answer: `example` is a similar question worked through, `working` two nudges.
DrillData.register("y9-term1a-revision", {
  title: "Year 9, Term 1a Revision",
  subtitle: "Number Systems, Loops, Data Types and Arrays, Errors and Trace Tables",
  // choiceOnly is read only by the game races (James 2026-10-02: Year 9 found typed race answers too hard). On the
  // site the drill types answers by default, like the test, so every card's keywords accept typed answers.
  choiceOnly: true,
  categories: [
    ["rv-numbers", "Number Systems"],
    ["rv-loops", "Loops"],
    ["rv-arrays", "Data Types and Arrays"],
    ["rv-errors", "Errors and Trace Tables"]
  ],
  cards: (function () {
    var A = "←";
    var HEX = "0123456789ABCDEF";
    var PLACE = "Place values: 128 64 32 16 8 4 2 1";
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }).join("\n"); }
    function lineRe(n) { return new RegExp("^\\s*(line\\s*)?0?" + n + "\\s*$", "i"); }
    function sum(n) { return n * (n + 1) / 2; }
    function sumFrom(a, b) { var t = 0; for (var i = a; i <= b; i++) t += i; return t; }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while (avoid.indexOf(n) !== -1); return n; }
    // Three different wrong numbers, none equal to the answer; pads with near misses if the slips collide.
    function others(n, list) {
      var pads = [n + 1, n + 2, n - 1, n + 3, n - 2, n + 4];
      return drillWrongNumbers(n, list.concat(pads).filter(function (v) { return v >= 0 && v !== n; }), 3);
    }
    function uniq(n, list) {
      var out = [];
      list.forEach(function (x) { if (x !== n && out.indexOf(x) === -1 && out.length < 3) out.push(x); });
      return out;
    }
    function step(text, lines, hl, state) { return { text: text, code: lines, hl: hl == null ? [] : [].concat(hl), state: state || "" }; }
    function hex2(n) { return HEX[Math.floor(n / 16)] + HEX[n % 16]; }
    function flip(b, i) { return b.slice(0, i) + (b[i] === "1" ? "0" : "1") + b.slice(i + 1); }
    function listRe(vals) { return new RegExp("^\\s*" + vals.join("[\\s,]+") + "\\s*$"); }
    function distinctValues(n, from, to) { var out = []; while (out.length < n) { var v = drillRange(from, to); if (out.indexOf(v) === -1) out.push(v); } return out; }
    function table(name, vals) {
      return name + " holds:\nIndex: " + vals.map(function (v, i) { return String(i + 1).padStart(3); }).join("") +
        "\nValue: " + vals.map(function (v) { return String(v).padStart(3); }).join("");
    }
    // The test's array is 8, 3, 9, 4, 6: never draw it.
    function arrayValues(n) { var v; do { v = distinctValues(n, 2, 19); } while (v.join(",") === "8,3,9,4,6"); return v; }
    var NAMES = ["Scores", "Points", "Goals", "Laps", "Stars"];
    // How many 1s are carried in a binary addition, and the longest run of carries in a row.
    function carries(a, c) {
      var carry = 0, total = 0, run = 0, best = 0;
      for (var i = 0; i < 8; i++) {
        var s = ((a >> i) & 1) + ((c >> i) & 1) + carry;
        carry = s >= 2 ? 1 : 0;
        if (carry) { total++; run++; if (run > best) best = run; } else run = 0;
      }
      return { total: total, run: best };
    }

    var TYPES = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    var TYPE_RE = {
      INTEGER: /^\s*(integer|int)\s*\.?\s*$/i, REAL: /^\s*(real|float)\s*\.?\s*$/i, CHAR: /^\s*(char|character)\s*\.?\s*$/i,
      STRING: /^\s*(string|str)\s*\.?\s*$/i, BOOLEAN: /^\s*(boolean|bool)\s*\.?\s*$/i
    };
    var TYPE_WORKED = {
      INTEGER: "Example: the number of pets a person has, such as 3. It is always a whole number, so it is INTEGER.",
      REAL: "Example: the length of a pencil, such as 14.5 cm. It has a decimal point, so it is REAL.",
      CHAR: "Example: the first letter of a name, such as 'K'. It is just one character, so it is CHAR.",
      STRING: "Example: the name of a street, such as \"Rama Road\". It has many characters, so it is STRING.",
      BOOLEAN: "Example: whether a shop is open. It can only be TRUE or FALSE, so it is BOOLEAN."
    };
    function otherTypes(t) { return TYPES.filter(function (x) { return x !== t; }); }

    return [
      // ================================================= Number Systems
      { id: "n-b2d", category: "rv-numbers", randomize: function () {
          var n = pick(20, 250, [105, 45, 32, 64, 128]), b = bin8(n);
          return { prompt: "Convert the binary number " + b + " to denary.", answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [parseInt(flip(b, 7), 2), parseInt(flip(b, 0), 2), parseInt(b.split("").reverse().join(""), 2)]),
            example: "Example: convert 00101101 to denary.\n" + PLACE + "\nStep 1: write each bit under its place value: 0 0 1 0 1 1 0 1\nStep 2: keep only the place values with a 1 under them: 32, 8, 4, 1\nStep 3: add them: 32 + 8 + 4 + 1 = 45.",
            working: [PLACE + ". Write the bits under them.", "Add up only the place values that have a 1 under them."],
            note: b + " = " + n + "." };
        } },
      { id: "n-d2b", category: "rv-numbers", randomize: function () {
          var n = pick(20, 250, [77, 75]), b = bin8(n);
          return { prompt: "Convert the denary number " + n + " to an 8-bit binary number.", answers: [b], keywords: [new RegExp("^\\s*" + b + "\\s*$")],
            distractors: uniq(b, [b.split("").reverse().join(""), flip(b, 7), flip(b, 6), flip(b, 1), flip(b, 2)]),
            example: "Example: convert 75 to 8-bit binary.\n" + PLACE + "\nStep 1: 128 is too big: 0. 64 fits: 1, and 75 - 64 = 11 left.\nStep 2: 32: 0. 16: 0. 8 fits: 1, and 11 - 8 = 3 left.\nStep 3: 4: 0. 2 fits: 1, 1 left. 1 fits: 1.\nSo 75 = 01001011.",
            working: ["Start at 128. If it fits into what is left, write 1 and take it away. If not, write 0.", "Move right through 64, 32, 16, 8, 4, 2, 1. Always write 8 bits."],
            note: n + " = " + b + "." };
        } },
      { id: "n-add", category: "rv-numbers", randomize: function () {
          var a, c, k;
          do {
            a = drillRange(20, 140); c = drillRange(15, 120); k = carries(a, c);
          } while (a + c > 255 || k.run < 2 || [53, 27, 80].indexOf(a + c) !== -1 ||
                   (a === 45 && c === 27) || (a === 27 && c === 45) || a === c);
          var s = bin8(a + c);
          return { prompt: "Add these two binary numbers. Give the 8-bit answer.\n  " + bin8(a) + "\n+ " + bin8(c), answers: [s], keywords: [new RegExp("^\\s*" + s + "\\s*$")],
            distractors: uniq(s, [bin8(a ^ c), bin8(a | c), flip(s, 7), flip(s, 3), flip(s, 5)]),
            example: "Example: 00110101 + 00011011\nWork from the right, one column at a time.\nRules: 0 + 0 = 0. 0 + 1 = 1. 1 + 1 = 0 carry 1. 1 + 1 + 1 = 1 carry 1.\nColumn 1: 1 + 1 = 0 carry 1. Column 2: 0 + 1 + 1 = 0 carry 1. Column 3: 1 + 0 + 1 = 0 carry 1.\nColumn 4: 0 + 1 + 1 = 0 carry 1. Column 5: 1 + 1 + 1 = 1 carry 1. Column 6: 1 + 0 + 1 = 0 carry 1.\nColumn 7: 0 + 0 + 1 = 1. Column 8: 0 + 0 = 0.\nAnswer: 01010000. Check: 53 + 27 = 80.",
            working: ["Start at the right-hand column. 1 + 1 = 0 carry 1.", "Add the carry into the next column. 1 + 1 + 1 = 1 carry 1."],
            note: bin8(a) + " + " + bin8(c) + " = " + s + " (" + a + " + " + c + " = " + (a + c) + ")." };
        } },
      { id: "n-hexdigit", category: "rv-numbers", randomize: function () {
          var i = drillRange(0, 5), letter = "ABCDEF"[i], v = 10 + i;
          var example = i <= 1
            ? "Example: what is the hex digit C in denary?\nStep 1: F is the biggest hex digit. It is 15.\nStep 2: count back one for each letter: F is 15, E is 14, D is 13.\nStep 3: one more step back: C is 12."
            : "Example: what is the hex digit " + "ABCDEF"[i - 1] + " in denary?\nStep 1: after 9 comes A. A is 10.\nStep 2: count on one for each letter: " +
              "ABCDEF".slice(0, i).split("").map(function (l, j) { return l + " is " + (10 + j); }).join(", ") + ".";
          return { prompt: "What is the hexadecimal digit " + letter + " in denary?", answers: [String(v)], keywords: [drillNumberRe(v)],
            distractors: others(v, [i + 1, v + 1, v - 1, 16]),
            example: example,
            working: ["After 9, the hex digits go on with letters: A, B, C, D, E, F.", "Each letter is one more than the one before it. A comes straight after 9."],
            note: letter + " = " + v + "." };
        } },
      { id: "n-h2d", category: "rv-numbers", randomize: function () {
          var n = pick(26, 250, [58, 60, 48]), h = hex2(n);
          return { prompt: "Convert the hexadecimal number " + h + " to denary.", answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [Math.floor(n / 16) * 10 + n % 16, Math.floor(n / 16) + n % 16, n + 16, n - 16]),
            example: "Example: convert 3C to denary.\nHex digits: 0 to 9 as normal, then A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.\nStep 1: the left digit is in the 16s column: 3 x 16 = 48.\nStep 2: the right digit is in the 1s column: C = 12.\nStep 3: add: 48 + 12 = 60.",
            working: ["Left digit x 16. A = 10, B = 11 ... F = 15.", "Then add the right digit's value."],
            note: h + " = " + Math.floor(n / 16) + " x 16 + " + (n % 16) + " = " + n + "." };
        } },
      { id: "n-d2h", category: "rv-numbers", randomize: function () {
          var n, h, hi, lo;
          do { n = pick(26, 250, [94, 200]); h = hex2(n); hi = Math.floor(n / 16); lo = n % 16; } while (hi === lo);
          return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [new RegExp("^\\s*" + h + "\\s*$", "i")],
            distractors: uniq(h, [hex2(lo * 16 + hi), hex2((n + 16) % 256), hex2((n + 1) % 256), hex2((n + 255) % 256)]),
            example: "Example: convert 200 to hexadecimal.\nStep 1: how many 16s fit into 200? 16 x 12 = 192, so 12. 12 is C.\nStep 2: what is left? 200 - 192 = 8.\nStep 3: write the 16s digit then the 1s digit: C8.\nHex digits: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.",
            working: ["How many 16s fit into " + n + "? That is the left digit.", "The amount left over is the right digit. Use A to F for 10 to 15."],
            note: n + " = " + hi + " x 16 + " + lo + " = " + h + "." };
        } },

      // ================================================= Loops
      { id: "l-expr", category: "rv-loops", randomize: function () {
          var op, n, k;
          do { op = drillPick(["*", "+"]); n = drillRange(3, 5); k = drillRange(2, 5); } while (op === "*" && k === 3 && n === 4);
          function run(o, last) { var out = []; for (var c = 1; c <= last; c++) out.push(o === "*" ? c * k : c + k); return out; }
          var ans = run(op, n), other = run(op === "*" ? "+" : "*", n);
          var plain = []; for (var c = 1; c <= n; c++) plain.push(c);
          var opts = [other.join(", "), run(op, n - 1).join(", "), run(op, n + 1).join(", "), plain.join(", ")];
          return { prompt: "What does this program output?\n" +
              code("DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    OUTPUT Count " + op + " " + k, "NEXT Count"),
            answers: [ans.join(", ")], keywords: [listRe(ans)], distractors: uniq(ans.join(", "), opts),
            example: op === "*"
              ? "A similar program: FOR Count " + A + " 1 TO 3 with OUTPUT Count * 10 inside.\nPass 1: Count is 1, so it outputs 1 * 10 = 10.\nPass 2: Count is 2, so it outputs 2 * 10 = 20.\nPass 3: Count is 3, so it outputs 3 * 10 = 30.\nOutput: 10, 20, 30. * means multiply."
              : "A similar program: FOR Count " + A + " 1 TO 3 with OUTPUT Count + 10 inside.\nPass 1: Count is 1, so it outputs 1 + 10 = 11.\nPass 2: Count is 2, so it outputs 2 + 10 = 12.\nPass 3: Count is 3, so it outputs 3 + 10 = 13.\nOutput: 11, 12, 13. + means add.",
            working: ["Count takes 1, then 2, and so on up to " + n + ". One output for each pass.", "Work out Count " + op + " " + k + " for each value of Count."],
            note: "Count " + op + " " + k + " for Count = 1 to " + n + ": " + ans.join(", ") + "." };
        } },
      { id: "l-iftotal", category: "rv-loops", randomize: function () {
          var n, t;
          do { n = drillRange(5, 8); t = drillRange(2, 5); } while (t >= n - 1 || (t === 3 && n === 6));
          var ans = sumFrom(t + 1, n);
          return { prompt: "What does this program output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + n,
                "    IF Count > " + t + " THEN", "        Total " + A + " Total + Count", "    ENDIF", "NEXT Count", "OUTPUT Total"),
            answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [sum(n), sumFrom(t, n), n - t, sum(t)]),
            example: "A similar program: Total starts at 0. FOR Count " + A + " 1 TO 42, and IF Count > 40 THEN Total " + A + " Total + Count.\nCount 1 to 40: is it more than 40? No, so nothing is added. 40 > 40 is false.\nCount 41: 41 > 40? Yes: Total = 0 + 41 = 41.\nCount 42: 42 > 40? Yes: Total = 41 + 42 = 83.\nOUTPUT 83.",
            working: ["For each value of Count, ask: is Count more than " + t + "? Equal is not more.", "Add only the values of Count where the answer is yes."],
            note: "Only Count = " + (t + 1) + " to " + n + " are added: " + ans + "." };
        } },
      { id: "l-times", category: "rv-loops", randomize: function () {
          var a = drillRange(2, 6), m = drillRange(4, 9), b = a + m - 1;
          return { prompt: "How many times does this loop run?\n" +
              code("DECLARE Count : INTEGER", "FOR Count " + A + " " + a + " TO " + b, "    OUTPUT \"Hello\"", "NEXT Count"),
            answers: [String(m)], keywords: [drillNumberRe(m, "times?")],
            distractors: others(m, [m - 1, b, m + 1]),
            example: "A similar loop: FOR Count " + A + " 11 TO 30\nStep 1: last value - first value: 30 - 11 = 19.\nStep 2: add 1, because both 11 and 30 are included: 19 + 1 = 20.\nThe loop runs 20 times.",
            working: ["Last value - first value, then add 1: both ends are included.", "Or write out the values of Count and count them."],
            note: "From " + a + " to " + b + ": " + b + " - " + a + " + 1 = " + m + " times." };
        } },
      { id: "l-start", category: "rv-loops", randomize: function () {
          var s = drillRange(2, 9), n = drillRange(3, 5), k = drillRange(2, 6), ans = s + n * k;
          return { prompt: "What does this program output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " " + s, "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total + " + k, "NEXT Count", "OUTPUT Total"),
            answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [n * k, s + (n - 1) * k, s + k, s + sum(n)]),
            example: "A similar program: Total starts at 100. A loop from 1 TO 2 adds 50 each time.\nPass 1: Total = 100 + 50 = 150\nPass 2: Total = 150 + 50 = 200\nOUTPUT 200. Do not forget the starting value.",
            working: ["What is Total before the loop starts?", "Add " + k + " once for every pass of the loop."],
            note: s + " + " + n + " x " + k + " = " + ans + "." };
        } },

      // ================================================= Data Types and Arrays
      { id: "a-type", category: "rv-arrays", randomize: function () {
          var v = drillPick([["the number of goals in a football match", "INTEGER"], ["the number of pupils on a bus", "INTEGER"],
            ["a pupil's height in metres, for example 1.62", "REAL"], ["a temperature, for example 31.5", "REAL"],
            ["the first letter of a city name, for example 'H'", "CHAR"], ["a Y or N answer, for example 'Y'", "CHAR"],
            ["a pupil's surname", "STRING"], ["the name of a town", "STRING"],
            ["whether a light is on", "BOOLEAN"], ["whether a game is over", "BOOLEAN"]]);
          var ex = drillPick(otherTypes(v[1]));
          return { prompt: "A variable stores " + v[0] + ". Which data type is best?", answers: [v[1]], keywords: [TYPE_RE[v[1]]],
            distractors: sample(otherTypes(v[1]), 3),
            example: TYPE_WORKED[ex] + "\nAsk in this order: only TRUE or FALSE? One character? Many characters? A decimal point? A whole number?",
            working: ["Could it only be TRUE or FALSE? Is it one character, or many?", "If it is a number: whole number, or does it have a decimal point?"],
            note: v[1] + "." };
        } },
      { id: "a-zero", category: "rv-arrays", randomize: function () {
          var v = drillPick([["a phone number such as 0812345678", "phone number"], ["a pupil code such as 00731", "pupil code"], ["a locker code such as 0429", "locker code"]]);
          return { prompt: "A variable stores " + v[0] + ". Which data type is best?", answers: ["STRING"], keywords: [TYPE_RE.STRING],
            distractors: ["INTEGER", "REAL", "CHAR"],
            example: "Example: a bus ticket number such as 00562.\nStep 1: as a whole number, 00562 becomes 562. The 0s at the start are lost.\nStep 2: we never add or multiply ticket numbers.\nStep 3: so it needs a type that keeps every character, in order, exactly as typed.",
            working: ["Look at the first digit. What happens to a 0 at the start of a whole number?", "Do we ever add or multiply a " + v[1] + "?"],
            note: "STRING keeps the 0 at the start, and no maths is done with it." };
        } },
      { id: "a-read", category: "rv-arrays", randomize: function () {
          var name = drillPick(NAMES), vals = arrayValues(5), k = drillRange(2, 5), ans = vals[k - 1];
          return { prompt: "What is " + name + "[" + k + "]?\n" + table(name, vals), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [vals[k - 2], vals[k] === undefined ? vals[0] : vals[k], k]),
            example: "Example: Heights holds 120, 140, 130 at index 1, 2, 3.\nHeights[2] means: go to index 2.\nIndex 1 is 120, index 2 is 140.\nSo Heights[2] is 140. The number in the brackets is the index, not the value.",
            working: ["The number in the square brackets is the index.", "Find that index in the top row, then read the value under it."],
            note: name + "[" + k + "] is the value at index " + k + ": " + ans + "." };
        } },
      { id: "a-index", category: "rv-arrays", randomize: function () {
          var name = drillPick(NAMES), vals = arrayValues(5), k = drillRange(1, 5), v = vals[k - 1];
          return { prompt: "Which index holds the value " + v + "?\n" + table(name, vals), answers: [String(k)], keywords: [drillNumberRe(k, "(index|position)")],
            distractors: others(k, [k + 1, k - 1, 6 - k, v]),
            example: "Example: Heights holds 120, 140, 130, 150, 110, 160 at index 1 to 6.\nWhich index holds 160?\nLook along the values until you find 160. It is the last one.\nRead the index above it: 160 is at index 6.",
            working: ["Find the value in the bottom row.", "Read the index number above it."],
            note: v + " is at index " + k + ", so " + name + "[" + k + "] = " + v + "." };
        } },
      { id: "a-total", category: "rv-arrays", randomize: function () {
          var name = drillPick(NAMES), vals = arrayValues(4), t = vals.reduce(function (a, b) { return a + b; }, 0);
          return { prompt: "What does this program output?\n" + table(name, vals) + "\n" +
              code("DECLARE " + name + " : ARRAY[1:4] OF INTEGER", "DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total " + A + " 0",
                "FOR Index " + A + " 1 TO 4", "    Total " + A + " Total + " + name + "[Index]", "NEXT Index", "OUTPUT Total"),
            answers: [String(t)], keywords: [drillNumberRe(t, "total")],
            distractors: others(t, [t - vals[3], t - vals[0], vals[3], 10]),
            example: "A similar program: Heights holds 120, 140, 130. Total starts at 0 and a loop from 1 TO 3 adds Heights[Index].\nIndex 1: Total = 0 + 120 = 120\nIndex 2: Total = 120 + 140 = 260\nIndex 3: Total = 260 + 130 = 390\nOUTPUT 390.",
            working: ["On each pass, Index is 1, then 2, then 3, then 4.", "Add the value at that index onto Total each time. Do not add the index."],
            note: vals.join(" + ") + " = " + t + "." };
        } },

      // ================================================= Errors and Trace Tables
      { id: "e-reset", category: "rv-errors", randomize: function () {
          var n = drillPick([3, 4, 6, 7]), a = drillPick([1, 1, 2]), v = drillPick([["Total", "Count"], ["Sum", "Number"]]);
          var T = v[0], C = v[1], intended = sumFrom(a, n);
          return { prompt: "This program should output the total of " + a + " to " + n + ". It has a bug. Follow it exactly as it is written. What does it output?\n" +
              code("DECLARE " + T + " : INTEGER", "DECLARE " + C + " : INTEGER", "FOR " + C + " " + A + " " + a + " TO " + n, "    " + T + " " + A + " 0", "    " + T + " " + A + " " + T + " + " + C, "NEXT " + C, "OUTPUT " + T),
            answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [intended, 0, n - 1, intended - n]),
            walk: (function () {
              var w = ["DECLARE Score : INTEGER", "DECLARE Num : INTEGER", "FOR Num " + A + " 1 TO 3", "    Score " + A + " 0", "    Score " + A + " Score + Num", "NEXT Num", "OUTPUT Score"];
              return [
                step("A similar program. Follow what it says, not what it should do. Lines 4 and 5 are inside the loop, so both run on every pass.", w, [3, 4]),
                step("Pass 1: Num = 1. Line 4 sets Score to 0. Line 5: Score = 0 + 1 = 1.", w, [3, 4], "Num 1, Score 1"),
                step("Pass 2: Num = 2. Line 4 sets Score back to 0. Line 5: Score = 0 + 2 = 2.", w, [3, 4], "Num 2, Score 2"),
                step("Pass 3: Num = 3. Score goes back to 0 again, then 0 + 3 = 3.", w, [3, 4], "Num 3, Score 3"),
                step("OUTPUT shows the Score left after the last pass: 3, not 1 + 2 + 3 = 6.", w, 6, "OUTPUT 3")
              ];
            })(),
            example: "A similar program: inside FOR Num " + A + " 1 TO 2 are the lines Score " + A + " 0 and Score " + A + " Score + Num.\nPass 1: Score " + A + " 0, then Score = 0 + 1 = 1.\nPass 2: Score " + A + " 0 again, then Score = 0 + 2 = 2.\nOUTPUT 2. Score goes back to 0 on every pass, so only the last pass is left.",
            working: ["Which lines are inside the loop? They run on every pass.", "What is " + T + " at the start of every pass? Trace the last pass."],
            note: T + " goes back to 0 on every pass, so only the last " + C + " is left: " + n + ". It should be " + intended + "." };
        } },
      { id: "e-times", category: "rv-errors", randomize: function () {
          var n = drillPick([3, 5, 6]), fact = 1; for (var i = 2; i <= n; i++) fact *= i;
          return { prompt: "This program should multiply the numbers 1 to " + n + " together. It has a bug. Follow it exactly as it is written. What does it output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total * Count", "NEXT Count", "OUTPUT Total"),
            answers: ["0"], keywords: [drillNumberRe(0)], distractors: others(0, [fact, n, sum(n)]),
            example: "A similar program: Product starts at 1. FOR Num " + A + " 1 TO 3 with Product " + A + " Product * Num.\nPass 1: Product = 1 * 1 = 1\nPass 2: Product = 1 * 2 = 2\nPass 3: Product = 2 * 3 = 6\nEach pass uses the value from the pass before. Trace yours the same way: start with the value before the loop.",
            working: ["What is Total before the loop starts?", "Work out Total after pass 1, then pass 2. What is that number times anything?"],
            note: "Total starts at 0, and 0 times anything is 0. It should be Total " + A + " 1 to multiply." };
        } },
      { id: "e-bound", category: "rv-errors", randomize: function () {
          var n = drillPick([5, 7, 8]), ans = sum(n - 1);
          return { prompt: "This program should add up 1 to " + n + ". It has a bug. Follow it exactly as it is written. What does it output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + (n - 1), "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"),
            answers: [String(ans)], keywords: [drillNumberRe(ans)], distractors: others(ans, [sum(n), n - 1, sum(n - 2)]),
            example: "A similar program should add up 1 to 3, but its loop is FOR Count " + A + " 1 TO 2.\nStep 1: read the FOR line. Count really takes 1 and 2.\nStep 2: Total = 0 + 1 = 1, then 1 + 2 = 3.\nStep 3: OUTPUT 3. The 3 is never added, because the loop stops at 2.",
            working: ["Read the FOR line. Where does the loop really stop?", "Add up only the values Count really takes."],
            note: "The loop stops at " + (n - 1) + ", so it outputs " + ans + ", not " + sum(n) + "." };
        } },
      { id: "e-trace", category: "rv-errors", randomize: function () {
          var s = drillRange(2, 9), p = drillRange(2, 4), ans = s + sum(p);
          return { prompt: "Complete a trace table for this program. What is Total after pass " + p + " of the loop?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " " + s, "FOR Count " + A + " 1 TO 5", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"),
            answers: [String(ans)], keywords: [drillNumberRe(ans)], distractors: others(ans, [sum(p), s + sum(p - 1), s + sum(5), s + p]),
            example: "A similar trace: Total " + A + " 20, then FOR Count " + A + " 1 TO 5 with Total " + A + " Total + Count.\nStart: Total = 20\nPass 1: Count = 1, Total = 20 + 1 = 21\nPass 2: Count = 2, Total = 21 + 2 = 23\nSo after pass 2, Total is 23. Each row uses the Total from the row above.",
            working: ["Write the first row: the value of Total before the loop.", "Add one row for each pass. Stop at pass " + p + "."],
            note: "Total: " + s + (function () { var t = s, out = ""; for (var c = 1; c <= p; c++) { t += c; out += ", " + t; } return out; })() + ". After pass " + p + " it is " + ans + "." };
        } },
      { id: "e-find-reset", category: "rv-errors", randomize: function () {
          var n = drillPick([3, 4, 6, 7]), head = drillPick([0, 1]);
          var lines = (head ? ["OUTPUT \"Adding up\""] : []).concat(["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n,
            "    Total " + A + " 0", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"]);
          var bad = 4 + head, out = 7 + head, add = 5 + head, forLine = 3 + head;
          return { prompt: "This program should output " + sum(n) + ", the total of 1 to " + n + ". It outputs " + n + ". Which line has the error?\n" + numbered(lines),
            answers: ["Line " + bad], keywords: [lineRe(bad)], distractors: ["Line " + out, "Line " + add, "Line " + forLine],
            example: "A similar program counts how many marks pass. Inside the loop are Passes " + A + " 0 and the IF that adds 1 to Passes.\nStep 1: say what each line should do.\nStep 2: trace it. Passes goes back to 0 on every pass, so it ends at 0 or 1.\nStep 3: the OUTPUT line only shows the wrong answer. The error is the line that sets Passes to 0 inside the loop. It belongs before FOR.",
            working: ["The OUTPUT line only shows the answer. Which line makes it wrong?", "Which line inside the loop runs on every pass, but should run only once?"],
            note: "Line " + bad + " sets Total back to 0 on every pass. It belongs before the loop." };
        } },
      { id: "e-find-bound", category: "rv-errors", randomize: function () {
          var n = drillRange(5, 8), head = drillPick([0, 1]);
          var lines = (head ? ["OUTPUT \"Adding up\""] : []).concat(["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0",
            "FOR Count " + A + " 1 TO " + (n - 1), "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"]);
          var bad = 4 + head;
          return { prompt: "This program should add up the numbers 1 to " + n + ". Which line has the error?\n" + numbered(lines),
            answers: ["Line " + bad], keywords: [lineRe(bad)], distractors: ["Line " + (3 + head), "Line " + (7 + head), "Line " + (5 + head)],
            example: "A similar program should output the numbers 1 to 3, but its loop is FOR Num " + A + " 1 TO 2.\nStep 1: say what it should do: output 1, 2, 3.\nStep 2: trace it: it outputs 1, 2. The 3 is missing.\nStep 3: which line decides when the loop stops? The FOR line. It should say 1 TO 3.",
            working: ["Which values does Count really take?", "Which line decides where the loop stops?"],
            note: "Line " + bad + " stops at " + (n - 1) + ". It should be FOR Count " + A + " 1 TO " + n + "." };
        } },
      { id: "e-find-out", category: "rv-errors", randomize: function () {
          var a = drillRange(2, 4), b = a + drillRange(2, 4), head = drillPick([0, 1]);
          var lines = (head ? ["OUTPUT \"Adding up\""] : []).concat(["DECLARE Sum : INTEGER", "DECLARE Number : INTEGER", "Sum " + A + " 0",
            "FOR Number " + A + " " + a + " TO " + b, "    Sum " + A + " Sum + Number", "NEXT Number", "OUTPUT Number"]);
          var bad = 7 + head;
          return { prompt: "This program should output the total of " + a + " to " + b + ". Which line has the error?\n" + numbered(lines),
            answers: ["Line " + bad], keywords: [lineRe(bad)], distractors: ["Line " + (3 + head), "Line " + (5 + head), "Line " + (4 + head)],
            example: "A similar program counts goals in a variable called Goals, using a loop with Match as its counter. Its last line is OUTPUT Match.\nStep 1: trace it. Goals is counted correctly inside the loop.\nStep 2: what does the last line show? Match, the loop counter, not Goals.\nStep 3: so the error is the OUTPUT line. It should be OUTPUT Goals.",
            working: ["Trace the loop. Is Sum worked out correctly?", "Which variable does the last line output? Is that the total?"],
            note: "Line " + bad + " outputs Number. It should output Sum." };
        } },
      { id: "e-find-calc", category: "rv-errors", randomize: function () {
          var k = drillRange(2, 5), n = drillRange(3, 5), head = drillPick([0, 1]), want = [];
          for (var c = 1; c <= n; c++) want.push(c * k);
          var lines = (head ? ["OUTPUT \"Times table\""] : []).concat(["DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    OUTPUT Count + " + k, "NEXT Count"]);
          var bad = 3 + head;
          return { prompt: "This program should output the " + k + " times table: " + want.join(", ") + ". Which line has the error?\n" + numbered(lines),
            answers: ["Line " + bad], keywords: [lineRe(bad)], distractors: ["Line " + (2 + head), "Line " + (4 + head), "Line " + (1 + head)],
            example: "A similar program should output 10, 20, 30, but the line inside its loop is OUTPUT Num + 10.\nStep 1: trace it: 1 + 10 = 11, 2 + 10 = 12, 3 + 10 = 13.\nStep 2: the loop runs the right number of times, so the FOR line is fine.\nStep 3: the line that makes each output adds instead of multiplying. It should be OUTPUT Num * 10.",
            working: ["Trace the first pass. What is output? What should be output?", "Which line makes each output?"],
            note: "Line " + bad + " adds " + k + ". It should be OUTPUT Count * " + k + "." };
        } },
      { id: "e-fix-boundary", category: "rv-errors", randomize: function () {
          var c = drillPick([
            ["The pass mark is X or more.", "Mark", [40, 45, 60, 65, 70, 75], "\"Pass\"", "\"Fail\""],
            ["A ride needs a height of X cm or more.", "Height", [110, 120, 130, 140], "\"Go on\"", "\"Too short\""],
            ["A player gets a bonus for X points or more.", "Points", [20, 30, 40, 60], "\"Bonus\"", "\"No bonus\""]]);
          var x = drillPick(c[2]), v = c[1];
          var ans = "IF " + v + " >= " + x + " THEN";
          return { prompt: c[0].replace("X", x) + " Which line should replace line 3?\n" +
              numbered(["DECLARE " + v + " : INTEGER", "INPUT " + v, "IF " + v + " > " + x + " THEN", "    OUTPUT " + c[3], "ELSE", "    OUTPUT " + c[4], "ENDIF"]),
            walk: [
              step("A similar question: a shop gives a gift when you spend 500 or more.", ["DECLARE Spend : INTEGER", "INPUT Spend", "IF Spend > 500 THEN", "    OUTPUT \"Gift\"", "ENDIF"], 2),
              step("Test the value exactly on the line: Spend = 500. Is 500 > 500? No. So spending exactly 500 gets no gift, which breaks the rule.", ["IF Spend > 500 THEN"], 0, "500 > 500 is FALSE"),
              step("\"500 or more\" must include 500. >= means more than or equal to: 500 >= 500 is TRUE.", ["IF Spend >= 500 THEN"], 0, "500 >= 500 is TRUE"),
              step("Check a value below the line too: 499 >= 500 is FALSE, so 499 still gets no gift. The new line works.", ["IF Spend >= 500 THEN"], 0, "499: no gift. 500: gift.")
            ],
            answers: [ans], keywords: [new RegExp("^\\s*if\\s*\\(?\\s*(" + v + "\\s*(>=|≥)\\s*" + x + "|" + v + "\\s*>\\s*" + (x - 1) + "|" + x + "\\s*(<=|≤)\\s*" + v + "|" + (x - 1) + "\\s*<\\s*" + v + ")\\s*\\)?\\s*(then)?\\s*$", "i")],
            distractors: ["IF " + v + " < " + x + " THEN", "IF " + v + " = " + x + " THEN", "IF " + v + " > " + x + " THEN"],
            example: "A similar question: a shop gives a gift when you spend 500 or more. The line is IF Spend > 500 THEN.\nStep 1: test the value exactly on the line: Spend = 500.\nStep 2: is 500 > 500? No, so a customer who spends 500 gets no gift. That is wrong.\nStep 3: >= means more than or equal to. IF Spend >= 500 THEN is true for 500.",
            working: ["Test the value exactly on the line: " + v + " = " + x + ". Is " + x + " > " + x + " true?", "\"Or more\" includes " + x + " itself. Which sign means more than or equal to?"],
            note: ">= means more than or equal to, so " + x + " is included." };
        } },
      { id: "e-boundary-count", category: "rv-errors", randomize: function () {
          var x = drillPick([40, 60, 70]), vals;
          do { vals = distinctValues(4, 20, 95).filter(function (v) { return v !== x && v !== 50; }); } while (vals.length < 4);
          vals.splice(drillRange(0, 4), 0, x);
          var ans = vals.filter(function (v) { return v > x; }).length, withEq = ans + 1;
          return { prompt: "The pass mark is " + x + " or more. This program has a bug. Follow it exactly as it is written. What does it output?\n" + table("Marks", vals) + "\n" +
              code("DECLARE Marks : ARRAY[1:5] OF INTEGER", "DECLARE Passes : INTEGER", "DECLARE Index : INTEGER", "Passes " + A + " 0", "FOR Index " + A + " 1 TO 5",
                "    IF Marks[Index] > " + x + " THEN", "        Passes " + A + " Passes + 1", "    ENDIF", "NEXT Index", "OUTPUT Passes"),
            answers: [String(ans)], keywords: [drillNumberRe(ans)], distractors: others(ans, [withEq, 5 - ans, 5]),
            example: "A similar program: Marks holds 35, 80, 45. The pass mark is 45 or more, but the line is IF Marks[Index] > 45 THEN.\n35 > 45? No.\n80 > 45? Yes: Passes = 1\n45 > 45? No. 45 is not MORE than 45, so it is not counted.\nOUTPUT 1. Follow the sign the code uses, not the one it should use.",
            working: ["Check each mark: is it MORE than " + x + "? Follow the sign in the code.", "What happens to the mark that is exactly " + x + "?"],
            note: "The mark " + x + " is not more than " + x + ", so it is not counted: " + ans + ". With >= it would be " + withEq + "." };
        } },
      { id: "e-kind", category: "rv-errors", randomize: function () {
          var v = drillPick([
            ["This line should add Score to Total.", "Total " + A + " Total - Score", "Logic error: it runs, but the answer is wrong"],
            ["This line should output Total.", "OUTPT Total", "Syntax error: it breaks the rules, so it will not run"],
            ["This loop should run 6 times.", "FOR Count " + A + " 1 TO 5", "Logic error: it runs, but the answer is wrong"],
            ["This line should declare Total.", "DECLARE Total INTEGER", "Syntax error: it breaks the rules, so it will not run"]]);
          var all = ["Logic error: it runs, but the answer is wrong", "Syntax error: it breaks the rules, so it will not run",
            "Logic error: it breaks the rules, so it will not run", "Syntax error: it runs, but the answer is wrong"];
          var logic = v[2].indexOf("Logic") === 0;
          return { prompt: v[0] + " Which kind of error is in it?\n" + v[1], answers: [v[2]],
            // "Logic error" or "syntax error" alone is enough; a description that fits the other kind is not.
            keywords: [logic ? /^(?!.*syntax)(?!.*rules)(?!.*not run)(?!.*won'?t run).*\blogic(al)?\b.*$/i : /^(?!.*logic)(?!.*\bruns\b)(?!.*wrong).*\bsyntax\b.*$/i],
            distractors: all.filter(function (x) { return x !== v[2]; }),
            example: "Example: the line Count " + A + " Count * 1 should add 1 to Count.\nStep 1: does it follow the rules? Yes, so it can run.\nStep 2: does it do the right thing? No: it multiplies instead of adding.\nA line that breaks the rules cannot run. A line that runs but gives the wrong answer has the other kind of error.",
            working: ["Does the line follow the rules exactly? Could it run?", "If it runs, does it do what it should?"],
            note: v[2] + "." };
        } },

      // A whole trace table, like the test's two: one with a starting row (b2's layout), one without (d1's).
      { id: "e-table", category: "rv-errors", widget: "trace", randomize: function () {
          var p, rows = [], t, n, intro;
          if (drillPick([0, 1])) {
            var lim, s0;
            do { n = drillRange(5, 7); lim = drillRange(2, 4); } while (lim >= n - 1 || (n === 6 && lim === 3));
            s0 = drillPick([0, 5, 10]);
            p = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " " + s0, "FOR Count " + A + " 1 TO " + n,
              "    IF Count > " + lim + " THEN", "        Total " + A + " Total + Count", "    ELSE", "        Total " + A + " Total + 1", "    ENDIF", "NEXT Count", "OUTPUT Total"];
            rows.push(["", String(s0), ""]); t = s0;
            for (var c = 1; c <= n; c++) { t += c > lim ? c : 1; rows.push([String(c), String(t), ""]); }
            intro = "Complete the trace table. The first row is before the loop starts. Write Total for every pass, and the output in the last row.";
          } else {
            n = drillPick([3, 4, 6]);
            p = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " 0",
              "    Total " + A + " Total + Count * 2", "NEXT Count", "OUTPUT Total"];
            for (var d = 1; d <= n; d++) rows.push([String(d), String(d * 2), ""]);
            t = n * 2;
            intro = "This program has a bug. Follow it exactly as it is written. There is no starting row: write one row for each pass, with Total at the end of that pass, and the output in the last row.";
          }
          rows.push(["", "", String(t)]);
          var col = rows.map(function (r) { return r[1]; }).filter(Boolean).join(", ");
          var w = ["DECLARE Total : INTEGER", "DECLARE Num : INTEGER", "Total " + A + " 0", "FOR Num " + A + " 1 TO 3", "    IF Num > 1 THEN", "        Total " + A + " Total + Num", "    ENDIF", "NEXT Num", "OUTPUT Total"];
          return { prompt: intro + "\n" + code.apply(null, p),
            trace: { columns: ["Count", "Total", "OUTPUT"], rows: rows, askable: [1] },
            answers: [col], keywords: [listRe(col.split(", "))], distractors: [],
            walk: [
              step("A similar program. A trace table has a row for each change, in order. This one starts with a row for before the loop.", w, []),
              step("Before the loop: Total " + A + " 0. Num has no value yet.", w, 2, "Num  Total\n       0"),
              step("Pass 1: Num = 1. Is 1 > 1? No, so Total stays 0.", w, [3, 4], "Num  Total\n 1     0"),
              step("Pass 2: Num = 2. Is 2 > 1? Yes: Total = 0 + 2 = 2.", w, [4, 5], "Num  Total\n 2     2"),
              step("Pass 3: Num = 3. 3 > 1: Total = 2 + 3 = 5. The loop ends, then OUTPUT 5 goes in the last row, once.", w, [5, 8], "OUTPUT 5")
            ],
            working: ["Read the question: is there a starting row before the loop, or not?", "On each pass, use the Total from the row above. The output goes in the last row only."],
            note: "Total: " + col + ". Output: " + t + "." };
        } },

      // "Which change fixes it?" (like the test's), with four kinds of bug.
      { id: "e-fix", category: "rv-errors", pickThenType: true, randomize: function () {
          var kind = drillPick(["start", "bound", "reset", "out"]), n = drillPick([3, 4, 6, 7]), want = sum(n);
          var L = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"];
          var fix, wrong, got;
          if (kind === "start") {
            L[2] = "Total " + A + " 1"; got = want + 1;
            fix = "Change line 3 to Total " + A + " 0";
            wrong = ["Change line 4 to FOR Count " + A + " 0 TO " + n, "Change line 5 to Total " + A + " Total * Count", "Change line 7 to OUTPUT Count"];
          } else if (kind === "bound") {
            L[3] = "FOR Count " + A + " 1 TO " + (n - 1); got = sum(n - 1);
            fix = "Change line 4 to FOR Count " + A + " 1 TO " + n;
            wrong = ["Change line 3 to Total " + A + " 1", "Change line 5 to Total " + A + " Total + Count + 1", "Change line 7 to OUTPUT Count"];
          } else if (kind === "reset") {
            L = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " 0", "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"]; got = n;
            fix = "Move line 4 to before the loop";
            wrong = ["Change line 3 to FOR Count " + A + " 0 TO " + n, "Delete line 5", "Change line 7 to OUTPUT Count"];
          } else {
            L[6] = "OUTPUT Count"; got = n;
            fix = "Change line 7 to OUTPUT Total";
            wrong = ["Change line 3 to Total " + A + " 1", "Change line 5 to Total " + A + " Count", "Change line 4 to FOR Count " + A + " 1 TO " + (n + 1)];
          }
          return { prompt: "This program should output " + want + ", the total of 1 to " + n + ". It outputs " + got + ". Which change fixes it?\n" + numbered(L),
            answers: [fix], keywords: [new RegExp("^\\s*" + fix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*") + "\\s*\\.?\\s*$", "i")],
            distractors: wrong,
            walk: [
              step("Test each change by tracing the program with that change made. Only one change gives the right answer.", L, []),
              step("Work out what the program should output: " + want + ". Then trace it as it is written: it gives " + got + ". Where does it go wrong?", L, []),
              step("Try a change in your head and trace again. If it still gives the wrong answer, it is not the fix.", L, [])
            ],
            working: ["Trace the program as written. Where does it first go wrong?", "For each change, trace the program again with that change made. Does it give " + want + "?"],
            note: fix + "." };
        } },

      // Several errors (like the test's last question): the line number and the correct line.
      { id: "e-multi", category: "rv-errors", randomize: function () {
          var v = drillPick([["Price", "prices"], ["Score", "scores"], ["Goals", "goal totals"]]), name = v[0], n = drillPick([3, 4, 6]);
          var L = ["DECLARE " + name + " : INTEGER", "DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0",
            "FOR Count " + A + " 1 TO " + n, "    OUTPUT " + name, "    Total " + A + " Total * " + name, "NEXT Count", "OUTPUT Count"];
          var fixes = [[6, "INPUT " + name, new RegExp("^\\s*input\\s+" + name + "\\s*$", "i")],
            [7, "Total " + A + " Total + " + name, new RegExp("^\\s*total\\s*(" + A + "|<-+|=)\\s*(total\\s*\\+\\s*" + name + "|" + name + "\\s*\\+\\s*total)\\s*$", "i")],
            [9, "OUTPUT Total", /^\s*output\s+total\s*$/i]];
          var f = drillPick(fixes);
          var others3 = fixes.filter(function (x) { return x !== f; });
          return { prompt: "This program should let the user input " + n + " " + v[1] + " and output their total. It has three errors. Line " + f[0] + " is one of them. Write the correct line " + f[0] + ".\n" + numbered(L),
            answers: [f[1]], keywords: [f[2]],
            distractors: [L[f[0] - 1].trim(), others3[0][1], others3[1][1]],
            walk: [
              step("A similar program should add up 3 heights that the user types in. Say what each line should do, then check it does that.", ["FOR Count " + A + " 1 TO 3", "    OUTPUT Height", "    Total " + A + " Total + Height", "NEXT Count"], []),
              step("The user should type each height. OUTPUT shows a value; INPUT lets the user type one. So OUTPUT Height should be INPUT Height.", ["    OUTPUT Height"], 0, "Fix: INPUT Height"),
              step("Adding up uses +. A line with * or - would multiply or take away instead.", ["    Total " + A + " Total + Height"], 0, "+ adds"),
              step("The last line should show the total. A line that outputs the loop counter shows how many passes ran, not the total.", ["OUTPUT Total"], 0)
            ],
            working: ["What should line " + f[0] + " do in a program that adds up typed values?", "Write the whole line, the way it should be."],
            note: "Line " + f[0] + " should be " + f[1] + "." };
        } },

      // Why use an array (like the test's).
      { id: "a-why", category: "rv-arrays", randomize: function () {
          var right = drillPick([
            "One name stores all the values, and a loop can go through them with the index",
            "A loop can use the index to go through every value, so the code is shorter",
            "It is easy to store more values without making new variables"]);
          var wrong = ["Each value takes up less memory in an array",
            "Separate variables cannot be used in a loop condition",
            "An array can store values of different data types",
            "An array sorts its values into order by itself"];
          return { prompt: "A program stores " + drillPick(["30 test marks", "20 race times", "12 monthly rainfall totals", "25 pupils' heights"]) + ". Give one reason to store them in an array instead of separate variables.",
            answers: [right], keywords: [/(loop.*\b(index|through|every|each|go)|\bindex\b|one name|single name|same name|shorter|less code|fewer lines|more values|add more|easy to (add|store|extend))/i],
            distractors: sample(wrong, 3),
            example: "Example: storing 6 dice rolls.\nWith separate variables you need Roll1, Roll2 ... Roll6, and six lines to add them up.\nWith an array Rolls[1:6], a FOR loop from 1 to 6 adds Rolls[Index] in three lines, and works the same for 600 rolls.",
            working: ["Think about adding up 30 separate variables. How many lines would that take?", "With an array, what can a FOR loop use to reach each value?"],
            note: "Any of: one name for all the values, a loop can use the index, shorter code, easy to add more values." };
        } }
    ];
  })()
});
