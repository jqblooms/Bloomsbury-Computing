// Year 9, 2.3 Do Now Extension: Number Systems (binary, binary addition, hexadecimal) and 2.2 Loops.
// Loaded by Drills/index.html?drill=y9-2-3-ext
// For students who finish the Do Now early: a selection of 10 questions across Year 9 so far, written fresh. Every
// card has an `example`, a similar question worked through with different numbers, holding every rule and step
// needed, then two `working` nudges. An example never shows the card's own answer.
DrillData.register("y9-2-3-ext", {
  title: "Year 9 Extension: Number Systems and Loops",
  subtitle: "2.3 Do Now Extension",
  categories: [
    ["ex-binary", "Binary and Binary Addition"],
    ["ex-hex", "Hexadecimal"],
    ["ex-loops", "Loops (2.2)"]
  ],
  cards: (function () {
    var A = "←";
    var HEX = "0123456789ABCDEF";
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while (avoid.indexOf(n) !== -1); return n; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v >= 0 && v !== n; }), 3); }
    function hex2(n) { return HEX[Math.floor(n / 16)] + HEX[n % 16]; }
    function flip(b, i) { return b.slice(0, i) + (b[i] === "1" ? "0" : "1") + b.slice(i + 1); }
    var PLACE = "Place values: 128 64 32 16 8 4 2 1";

    return [
      // ------------------------------------------------ Binary and binary addition (Number Systems L1, L2)
      { id: "ex-01", category: "ex-binary", randomize: function () {
          var n = pick(20, 250, [45, 32, 64, 128]), b = bin8(n);
          return { prompt: "Convert the binary number " + b + " to denary.", answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [n + 1, n - 1, parseInt(flip(b, 7), 2), parseInt(flip(b, 0), 2)]),
            example: "Example: convert 00101101 to denary.\n" + PLACE + "\nStep 1: write each bit under its place value: 0 0 1 0 1 1 0 1\nStep 2: keep only the place values with a 1 under them: 32, 8, 4, 1\nStep 3: add them: 32 + 8 + 4 + 1 = 45.",
            working: [PLACE + ". Write the bits under them.", "Add up only the place values that have a 1 under them."],
            note: b + " = " + n + "." };
        } },
      { id: "ex-02", category: "ex-binary", randomize: function () {
          var n = pick(20, 250, [75]), b = bin8(n);
          return { prompt: "Convert the denary number " + n + " to an 8-bit binary number.", answers: [b], keywords: [new RegExp("^\\s*" + b + "\\s*$")],
            distractors: [flip(b, 7), flip(b, 6), flip(b, 1)].filter(function (x, i, all) { return all.indexOf(x) === i; }),
            example: "Example: convert 75 to 8-bit binary.\n" + PLACE + "\nStep 1: 128 is too big: 0. 64 fits: 1, and 75 - 64 = 11 left.\nStep 2: 32: 0. 16: 0. 8 fits: 1, and 11 - 8 = 3 left.\nStep 3: 4: 0. 2 fits: 1, 1 left. 1 fits: 1.\nSo 75 = 01001011.",
            working: ["Start at 128. If it fits into what is left, write 1 and take it away; if not, write 0.", "Move right through 64, 32, 16, 8, 4, 2, 1. Always write 8 bits."],
            note: n + " = " + b + "." };
        } },
      { id: "ex-03", category: "ex-binary", randomize: function () {
          var a, c; do { a = drillRange(20, 120); c = drillRange(15, 120); } while (a + c > 255 || [27, 53, 80].indexOf(a + c) !== -1);
          var s = bin8(a + c);
          return { prompt: "Add these two binary numbers. Give the 8-bit answer.\n  " + bin8(a) + "\n+ " + bin8(c), answers: [s], keywords: [new RegExp("^\\s*" + s + "\\s*$")],
            distractors: [flip(s, 7), flip(s, 5), flip(s, 3)].filter(function (x, i, all) { return all.indexOf(x) === i; }),
            example: "Example: 00110101 + 00011011\nWork from the right, one column at a time.\nRules: 0 + 0 = 0. 0 + 1 = 1. 1 + 1 = 0 carry 1. 1 + 1 + 1 = 1 carry 1.\nColumn 1: 1 + 1 = 0 carry 1. Column 2: 0 + 1 + 1 = 0 carry 1. Column 3: 1 + 0 + 1 = 0 carry 1.\nColumn 4: 0 + 1 + 1 = 0 carry 1. Column 5: 1 + 1 + 1 = 1 carry 1. Column 6: 1 + 0 + 1 = 0 carry 1.\nColumn 7: 0 + 0 + 1 = 1. Column 8: 0 + 0 = 0.\nAnswer: 01010000. Check: 53 + 27 = 80.",
            working: ["Start at the right-hand column. 1 + 1 = 0 carry 1.", "Do not forget to add the carry into the next column."],
            note: bin8(a) + " + " + bin8(c) + " = " + s + " (" + a + " + " + c + " = " + (a + c) + ")." };
        } },

      // ------------------------------------------------ Hexadecimal (Number Systems L3)
      { id: "ex-04", category: "ex-hex", randomize: function () {
          var n = pick(26, 250, [60, 48]), h = hex2(n);
          return { prompt: "Convert the hexadecimal number " + h + " to denary.", answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [Math.floor(n / 16) * 10 + n % 16, n + 16, n - 16, n + 1]),
            example: "Example: convert 3C to denary.\nHex digits: 0-9 as normal, then A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.\nStep 1: the left digit is in the 16s column: 3 x 16 = 48.\nStep 2: the right digit is in the 1s column: C = 12.\nStep 3: add: 48 + 12 = 60.",
            working: ["Left digit x 16. A = 10, B = 11 ... F = 15.", "Then add the right digit's value."],
            note: h + " = " + Math.floor(n / 16) + " x 16 + " + (n % 16) + " = " + n + "." };
        } },
      { id: "ex-05", category: "ex-hex", randomize: function () {
          var n = pick(26, 250, [200]), h = hex2(n), hi = Math.floor(n / 16), lo = n % 16;
          return { prompt: "Convert the denary number " + n + " to hexadecimal.", answers: [h], keywords: [new RegExp("^\\s*" + h + "\\s*$", "i")],
            distractors: [hex2((lo * 16 + hi) % 256), hex2((n + 16) % 256), hex2((n + 1) % 256)].filter(function (x, i, all) { return x !== h && all.indexOf(x) === i; }),
            example: "Example: convert 200 to hexadecimal.\nStep 1: how many 16s fit into 200? 16 x 12 = 192, so 12. 12 is C.\nStep 2: what is left? 200 - 192 = 8.\nStep 3: write the 16s digit then the 1s digit: C8.\nHex digits: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.",
            working: ["How many 16s fit into " + n + "? That is the left digit.", "The amount left over is the right digit. Use A to F for 10 to 15."],
            note: n + " = " + hi + " x 16 + " + lo + " = " + h + "." };
        } },
      { id: "ex-06", category: "ex-hex", prompt: "Give one reason why people use hexadecimal instead of binary.", answers: ["It is shorter and easier for people to read"],
        keywords: [/\b(short\w*|fewer|less|easier|simpl\w*|read\w*|remember\w*|mistakes?|errors?|understand\w*|compact|quicker|faster\s+to\s+(write|type|read))\b/i],
        distractors: ["Computers can only ever store numbers in hex", "It can store negative numbers but binary cannot", "It uses a completely different set of bits"],
        example: "Example: compare these two ways of writing the same byte.\nBinary: 11111111\nHexadecimal: FF\nStep 1: count the characters: 8 against 2.\nStep 2: one hex digit stands for 4 bits, so a long binary number becomes a short hex number.\nStep 3: the computer still stores binary; hex is only for the people reading it.\nNow give the reason in your own words.",
        working: ["Compare 11111111 with FF. Which is quicker to copy?", "Who is hexadecimal for: the computer, or the people reading it?"],
        note: "Hexadecimal is shorter, so it is easier for people to read and remember, with fewer mistakes. The computer still uses binary." },

      // ------------------------------------------------ Loops (2.2)
      { id: "ex-07", category: "ex-loops", randomize: function () {
          var a = drillRange(2, 6), n = drillRange(5, 9), b = a + n - 1;
          return { prompt: ["DECLARE Count : INTEGER", "FOR Count " + A + " " + a + " TO " + b, "    OUTPUT \"Go\"", "NEXT Count"].join("\n") + "\n\nHow many times does this loop run?",
            answers: [String(n)], keywords: [drillNumberRe(n, "times?")],
            distractors: others(n, [n - 1, n + 1, b]),
            example: "A similar loop: FOR Count " + A + " 3 TO 6\nCount takes 3, 4, 5, 6.\nThat is 6 - 3 = 3, then add 1 because both ends are included: 4 times.\nRule: last value - first value + 1.",
            working: ["Last value - first value, then add 1.", "Or write out every value Count takes and count them."],
            note: b + " - " + a + " + 1 = " + n + "." };
        } },
      { id: "ex-08", category: "ex-loops", randomize: function () {
          var s = drillRange(2, 9), n = drillRange(3, 5), k = drillRange(3, 6), t = s + n * k;
          return { prompt: ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " " + s, "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total + " + k, "NEXT Count", "OUTPUT Total"].join("\n") + "\n\nWhat does this program output?",
            answers: [String(t)], keywords: [drillNumberRe(t, "total")],
            distractors: others(t, [n * k, t + k, t - k, s + k]),
            example: "A similar program: Total starts at 100, then a loop from 1 TO 2 adds 10 each time.\nPass 1: Total = 100 + 10 = 110\nPass 2: Total = 110 + 10 = 120\nOUTPUT 120. Do not forget the starting value.",
            working: ["Start with Total's first value, then add on each pass.", "How many passes does the loop make?"],
            note: s + " + " + n + " x " + k + " = " + t + "." };
        } },
      { id: "ex-09", category: "ex-loops", randomize: function () {
          var marks = [], c = 0, i;
          for (i = 0; i < 5; i++) { var m = drillPick([35, 42, 48, 50, 55, 61, 70, 77, 49, 50]); marks.push(m); if (m >= 50) c++; }
          return { prompt: ["DECLARE Passes : INTEGER", "DECLARE Mark : INTEGER", "DECLARE Count : INTEGER", "Passes " + A + " 0", "FOR Count " + A + " 1 TO 5", "    INPUT Mark", "    IF Mark >= 50 THEN", "        Passes " + A + " Passes + 1", "    ENDIF", "NEXT Count", "OUTPUT Passes"].join("\n") + "\n\nThe user types " + marks.join(", ") + ". What is output?",
            answers: [String(c)], keywords: [drillNumberRe(c, "passes")],
            distractors: others(c, [5 - c, c + 1, c - 1, marks.filter(function (m) { return m > 50; }).length]),
            example: "A similar program: Passes goes up by 1 when Mark >= 60. The user types 60, 59, 75.\n60 >= 60? Yes (>= includes 60): Passes = 1\n59 >= 60? No.\n75 >= 60? Yes: Passes = 2\nThe loop has finished, so the output comes after it.",
            working: ["Check each mark: is it 50 or more?", ">= means more than OR equal to, so 50 counts."],
            note: "Marks of 50 or more: " + (marks.filter(function (m) { return m >= 50; }).join(", ") || "none") + ". Passes = " + c + "." };
        } },
      { id: "ex-10", category: "ex-loops", prompt: "A program counts passes in a loop. Should the line Passes " + "←" + " 0 go before, inside or after the loop?", answers: ["Before the loop"],
        keywords: [/^\s*(it\s+(goes|should\s+go)\s+)?before(\s+the\s+(loop|for))?\s*\.?\s*$/i],
        distractors: ["Inside the loop", "After the loop"],
        example: "Example question: where should OUTPUT Passes go, so the total is shown only once?\nStep 1: lines inside the loop run on every pass.\nStep 2: we only want to show the result once, when all the counting is done.\nStep 3: so OUTPUT Passes goes after NEXT.\nNow think about Passes " + "←" + " 0: what would happen if it ran on every pass?",
        working: ["Lines inside the loop run on every pass. What would that do to Passes?", "The starting value should be set only once, at the start."],
        note: "Before the loop: inside it, Passes would be reset to 0 on every pass." }
    ];
  })()
});
