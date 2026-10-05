// Year 9, 2.6 Do Now Extension: 2.2 Loops and 2.3 Data Types and Arrays.
// Loaded by Drills/index.html?drill=y9-2-6-ext
// For students who finish the Do Now early: a selection of 10 questions across the unit so far, written fresh. Every
// card has an `example`, a similar question worked through with different numbers, holding every rule and step
// needed, then two `working` nudges. An example never shows the card's own answer. The question comes first and the
// program after it, so a race shows the question as the question.
DrillData.register("y9-2-6-ext", {
  title: "Year 9 Extension: Loops, Data Types and Arrays",
  subtitle: "2.6 Do Now Extension",
  choiceOnly: true,
  categories: [
    ["ex-loops", "Loops (2.2)"],
    ["ex-types", "Data Types (2.3)"],
    ["ex-arrays", "Arrays (2.3)"]
  ],
  cards: (function () {
    var A = "←";
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while (avoid.indexOf(n) !== -1); return n; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v >= 0 && v !== n; }), 3); }
    function arr(vals) { return vals.join(", "); }
    var TYPES = [["3.75", "REAL"], ["\"Ali\"", "STRING"], ["TRUE", "BOOLEAN"], ["'Y'", "CHAR"], ["42", "INTEGER"]];
    var TYPE_WHY = { REAL: "it has a decimal point", STRING: "it is several characters in speech marks", BOOLEAN: "it can only be TRUE or FALSE",
      CHAR: "it is one character in single quotes", INTEGER: "it is a whole number" };

    return [
      // ------------------------------------------------ 2.2 Loops
      { id: "ex-01", category: "ex-loops", randomize: function () {
          var a = pick(2, 6, []), n = pick(4, 8, [5]), b = a + n - 1;
          return { prompt: "How many times does this loop run?\n" + code("DECLARE Count : INTEGER", "FOR Count " + A + " " + a + " TO " + b, "    OUTPUT Count", "NEXT Count"),
            answers: [String(n)], keywords: [drillNumberRe(n, "times?")], distractors: others(n, [n - 1, n + 1, b]),
            example: "Example: FOR Count " + A + " 3 TO 7\nCount takes the values 3, 4, 5, 6, 7.\nCount them: that is 5 values, so the loop runs 5 times.\nA quick way: last - first + 1 = 7 - 3 + 1 = 5.",
            working: ["List the values Count takes, from the first number to the last.", "Last - first + 1."],
            note: b + " - " + a + " + 1 = " + n + " times." };
        } },
      { id: "ex-02", category: "ex-loops", randomize: function () {
          var n = pick(3, 7, [4]), t = n * (n + 1) / 2;
          return { prompt: "What does this program output?\n" + code("DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total " + A + " 0", "FOR Count " + A + " 1 TO " + n, "    Total " + A + " Total + Count", "NEXT Count", "OUTPUT Total"),
            answers: [String(t)], keywords: [drillNumberRe(t)], distractors: others(t, [t - n, n, t + n + 1]),
            example: "Example: the same program with FOR Count " + A + " 1 TO 4.\nTotal starts at 0.\nPass 1: 0 + 1 = 1. Pass 2: 1 + 2 = 3. Pass 3: 3 + 3 = 6. Pass 4: 6 + 4 = 10.\nAfter the loop it outputs 10.",
            working: ["Total starts at 0. Each pass adds the value of Count.", "Write Total after every pass."],
            note: "1 + 2 + ... + " + n + " = " + t + "." };
        } },
      { id: "ex-03", category: "ex-loops", randomize: function () {
          var n = pick(6, 9, []), k = pick(2, 5, []), c = n - k;
          return { prompt: "How many numbers does this program output?\n" + code("DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    IF Count > " + k + " THEN", "        OUTPUT Count", "    ENDIF", "NEXT Count"),
            answers: [String(c)], keywords: [drillNumberRe(c)], distractors: others(c, [n, k, c + 1]),
            example: "Example: FOR Count " + A + " 1 TO 10, with IF Count > 7.\nCount takes 1 to 10. Only 8, 9 and 10 are more than 7.\nSo it outputs 3 numbers.",
            working: ["Which values does Count take?", "Which of them are more than the number in the IF? Equal does not count."],
            note: "Count from " + (k + 1) + " to " + n + ": " + c + " numbers." };
        } },
      { id: "ex-04", category: "ex-loops", randomize: function () {
          var n = pick(3, 9, [5]), last = n * 3;
          return { prompt: "What is the LAST number this program outputs?\n" + code("DECLARE Count : INTEGER", "FOR Count " + A + " 1 TO " + n, "    OUTPUT Count * 3", "NEXT Count"),
            answers: [String(last)], keywords: [drillNumberRe(last)], distractors: others(last, [n, last - 3, last + 3]),
            example: "Example: FOR Count " + A + " 1 TO 5 with OUTPUT Count * 2.\nThe last pass is Count = 5.\nSo the last output is 5 * 2 = 10.",
            working: ["What is Count on the last pass?", "Work out the OUTPUT line for that value."],
            note: "The last pass is Count = " + n + ": " + n + " * 3 = " + last + "." };
        } },
      // ------------------------------------------------ 2.3 Data types
      { id: "ex-05", category: "ex-types", randomize: function () {
          var t = drillPick(TYPES), ex = drillPick(TYPES.filter(function (x) { return x[1] !== t[1]; }));
          return { prompt: "Which data type is best for the value " + t[0] + "?",
            answers: [t[1]], keywords: [new RegExp("^\\s*" + t[1] + "\\s*$", "i")],
            distractors: TYPES.filter(function (x) { return x[1] !== t[1]; }).map(function (x) { return x[1]; }).slice(0, 3),
            example: "Example: which type is best for " + ex[0] + "?\n" + ex[0] + " is " + ex[1] + ", because " + TYPE_WHY[ex[1]] + ".\nEvery type has a clue: a whole number, a decimal point, one character in single quotes, several characters in speech marks, or only TRUE or FALSE.",
            working: ["Is it a number? Does it have a decimal point?", "Is it text? One character, or many? Or is it TRUE or FALSE?"],
            note: t[0] + " is " + t[1] + ": " + TYPE_WHY[t[1]] + "." };
        } },
      { id: "ex-06", category: "ex-types",
        prompt: "A variable stores whether a student is a teenager: TRUE or FALSE. Which data type is best?",
        answers: ["BOOLEAN"], keywords: [/^\s*bool(ean)?\s*$/i], distractors: ["STRING", "INTEGER", "CHAR"],
        example: "Example: a variable stores a price, such as 3.99. Which type?\nIt is a number with a decimal point, so it is REAL.\nA value that can only be TRUE or FALSE has its own type.",
        working: ["How many different values can it have?", "Which type has only two values?"],
        note: "Only TRUE or FALSE: BOOLEAN." },
      // ------------------------------------------------ 2.3 Arrays
      { id: "ex-07", category: "ex-arrays", randomize: function () {
          var vals, i;
          do { vals = [drillRange(2, 19), drillRange(2, 19), drillRange(2, 19), drillRange(2, 19)]; i = drillRange(1, 4); } while (vals[i - 1] === 8 || vals.indexOf(vals[i - 1]) !== i - 1);
          return { prompt: "Marks holds " + arr(vals) + " (index 1 to 4). What does this line output?\nOUTPUT Marks[" + i + "]",
            answers: [String(vals[i - 1])], keywords: [drillNumberRe(vals[i - 1])], distractors: others(vals[i - 1], vals.concat([i, vals[i - 1] + 1, vals[i - 1] - 1])),
            example: "Example: Heights holds 120, 140, 130 (index 1 to 3). OUTPUT Heights[2]\nIndex 1 is 120, index 2 is 140.\nSo it outputs 140. The number in the square brackets is a position, not a value.",
            working: ["The number in the square brackets is a position.", "Count along from index 1."],
            note: "Marks[" + i + "] is " + vals[i - 1] + "." };
        } },
      { id: "ex-08", category: "ex-arrays", randomize: function () {
          var n = pick(5, 30, [12]);
          return { prompt: "How many elements does this array have?\nDECLARE Scores : ARRAY[1:" + n + "] OF INTEGER",
            answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - 1, n + 1, 1]),
            example: "Example: DECLARE Days : ARRAY[1:12] OF STRING\n[1:12] means the first index is 1 and the last is 12.\nSo it has 12 elements.",
            working: ["Read the numbers in the square brackets.", "The first index is 1. What is the last?"],
            note: "[1:" + n + "]: " + n + " elements." };
        } },
      { id: "ex-09", category: "ex-arrays", randomize: function () {
          var vals, t;
          do { vals = [drillRange(2, 9), drillRange(2, 9), drillRange(2, 9), drillRange(2, 9)]; t = vals.reduce(function (a, b) { return a + b; }, 0); } while (t === 22);
          return { prompt: "Scores holds " + arr(vals) + " (index 1 to 4). What does this program output?\n" +
              code("DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total " + A + " 0", "FOR Index " + A + " 1 TO 4", "    Total " + A + " Total + Scores[Index]", "NEXT Index", "OUTPUT Total"),
            answers: [String(t)], keywords: [drillNumberRe(t)], distractors: others(t, [t - vals[3], t + 1, vals[3]]),
            example: "Example: Scores holds 7, 2, 9, 4.\nTotal starts at 0. Index 1: 0 + 7 = 7. Index 2: 7 + 2 = 9. Index 3: 9 + 9 = 18. Index 4: 18 + 4 = 22.\nIt outputs 22.",
            working: ["Each pass adds Scores[Index], the next value.", "Add up all four values."],
            note: arr(vals).replace(/, /g, " + ") + " = " + t + "." };
        } },
      { id: "ex-10", category: "ex-arrays",
        prompt: "Why use one array instead of 30 separate variables for 30 marks?",
        answers: ["One name holds all the marks"], keywords: [/\b(one|single)\b.*\b(name|identifier|array)\b/i],
        distractors: ["Arrays make each mark bigger", "Arrays store marks as text", "Arrays stop marks changing"],
        example: "Example: why store 7 daily temperatures in Temps : ARRAY[1:7] OF REAL?\nOne name, Temps, holds all seven values, each found by its index.\nA FOR loop can then visit Temps[1] to Temps[7] in three lines.",
        working: ["How many DECLARE lines would 30 separate variables need?", "How can a loop reach every value in an array?"],
        note: "One name, one DECLARE, and a loop can visit every element by its index." }
    ];
  })()
});
