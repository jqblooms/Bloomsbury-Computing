// Year 11 Mock Test 1A Revision: Programming Concepts
// Loaded by Drills/index.html?drill=y11-mock1-a
DrillData.register("y11-mock1-a", {
  title: "Year 11 Mock Test 1A Revision: Programming Concepts",
  subtitle: "Cambridge IGCSE Computer Science 0478 - operators, data types, loops and standard methods",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["m1a-ops", "Operators (=, <>, DIV, MOD, AND, OR, NOT)"],
    ["m1a-types", "Data Types"],
    ["m1a-loops", "Loops and Iteration"],
    ["m1a-methods", "Standard Methods and Bubble Sort"]
  ],
  cards: (function () {
    function exact(v) { return [new RegExp("^\\s*" + String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "i")]; }
    function fill(card) { var inst = card.randomize(); Object.keys(inst).forEach(function (k) { card[k] = inst[k]; }); return card; }
    var TYPES = ["INTEGER", "REAL", "CHAR", "STRING", "BOOLEAN"];
    var TYPE_KEYS = { INTEGER: [["integer", "int"]], REAL: [["real"]], CHAR: [["char", "character"]], STRING: [["string", "str"]], BOOLEAN: [["boolean", "bool"]] };
    function typeCard(id, what, type, note) {
      return {
        id: id, category: "m1a-types",
        prompt: "Which data type is most appropriate for " + what + "?",
        answers: [type],
        keywords: [{ required: TYPE_KEYS[type], excluded: TYPES.filter(function (t) { return t !== type; }).map(function (t) { return t.toLowerCase(); }) }],
        distractors: TYPES.filter(function (t) { return t !== type; }).concat(["ARRAY"]),
        note: note
      };
    }
    var OPS = [
      ["=", "equal to"], ["<>", "not equal to"], ["<", "less than"], [">", "greater than"],
      ["<=", "less than or equal to"], [">=", "greater than or equal to"], ["<-", "store (assign) a value in a variable"]
    ];
    return [
      // ---------------- operators
      {
        id: "m1a-noteq", category: "m1a-ops",
        prompt: "What does the <> operator mean in pseudocode?",
        answers: ["Not equal to"],
        keywords: [{ required: [["not"], ["equal"]] }],
        distractors: ["Equal to", "Less than", "Greater than", "Less than or equal to", "Greater than or equal to", "Stores a value in a variable"],
        note: "<> means 'not equal to'. IF Guess <> Secret is TRUE when the two values are different."
      },
      fill({
        id: "m1a-opsymbol", category: "m1a-ops",
        randomize: function () {
          var pick = OPS[randInt(0, OPS.length - 1)];
          return {
            prompt: "Which operator is used in pseudocode to mean '" + pick[1] + "'?",
            answers: [pick[0]],
            keywords: exact(pick[0]),
            distractors: OPS.filter(function (o) { return o[0] !== pick[0]; }).map(function (o) { return o[0]; }).concat(["==", "!="]),
            note: "Comparison operators: =  <>  <  >  <=  >=. The arrow <- stores a value; == and != are used in some programming languages but not in Cambridge pseudocode."
          };
        }
      }),
      {
        id: "m1a-notarith", category: "m1a-ops", type: "multi",
        prompt: "Which of these are NOT arithmetic operators? Pick every one shown.",
        answers: [">", "<=", "AND", "NOT", "<>", "OR", "="],
        distractors: ["+", "-", "*", "/", "^", "DIV", "MOD"],
        note: "Arithmetic operators do calculations: + - * / ^ DIV MOD. Comparison operators (= <> < > <= >=) and Boolean operators (AND OR NOT) are not arithmetic."
      },
      {
        id: "m1a-arith", category: "m1a-ops", type: "multi",
        prompt: "Which of these ARE arithmetic operators? Pick every one shown.",
        answers: ["+", "-", "*", "/", "^", "DIV", "MOD"],
        distractors: [">", "<", "=", "<>", "<=", ">=", "AND", "OR", "NOT"],
        note: "Arithmetic operators: + - * / ^ DIV MOD. DIV and MOD are arithmetic even though they are words."
      },
      fill({
        id: "m1a-div", category: "m1a-ops",
        randomize: function () {
          var b = randInt(3, 9), a = randInt(2, 11) * b + randInt(1, b - 1);
          var d = Math.floor(a / b), m = a % b;
          return {
            prompt: "What is " + a + " DIV " + b + "?",
            answers: [String(d)], keywords: exact(d),
            distractors: dedupeDistractors(d, [m, d + 1, d - 1, (a / b).toFixed(2), b, a - b]),
            note: "DIV gives the whole number of times " + b + " fits into " + a + ": " + a + " DIV " + b + " = " + d + " (the remainder, " + m + ", is thrown away)."
          };
        }
      }),
      fill({
        id: "m1a-mod", category: "m1a-ops",
        randomize: function () {
          var b = randInt(3, 9), a = randInt(2, 11) * b + randInt(1, b - 1);
          var d = Math.floor(a / b), m = a % b;
          return {
            prompt: "What is " + a + " MOD " + b + "?",
            answers: [String(m)], keywords: exact(m),
            distractors: dedupeDistractors(m, [d, m + 1, b - m, (a / b).toFixed(2), 0, b]),
            note: "MOD gives the remainder: " + a + " = " + d + " x " + b + " + " + m + ", so " + a + " MOD " + b + " = " + m + "."
          };
        }
      }),
      fill({
        id: "m1a-pow", category: "m1a-ops",
        randomize: function () {
          var b = randInt(2, 5), e = randInt(2, 4), p = Math.pow(b, e);
          return {
            prompt: "What is the result of " + b + " ^ " + e + "?",
            answers: [String(p)], keywords: exact(p),
            distractors: dedupeDistractors(p, [b * e, b + e, Math.pow(e, b), p * 2, String(b) + String(e)], function (i) { return p + i * b; }),
            note: "^ means 'to the power of': " + b + " ^ " + e + " = " + Array(e + 1).join(b + " x ").slice(0, -3) + " = " + p + "."
          };
        }
      }),
      fill({
        id: "m1a-slash", category: "m1a-ops",
        randomize: function () {
          var b = [2, 4, 5, 8][randInt(0, 3)], a = randInt(3, 12) * b + randInt(1, b - 1);
          var q = a / b;
          return {
            prompt: "What is " + a + " / " + b + "?",
            answers: [String(q)], keywords: exact(q),
            distractors: dedupeDistractors(q, [Math.floor(q), a % b, Math.ceil(q), Math.floor(q) + "." + (a % b), b / a > 0.1 ? (b / a).toFixed(2) : Math.floor(q) + 2]),
            note: "/ is normal division, so the answer can be a decimal: " + a + " / " + b + " = " + q + ". DIV would give " + Math.floor(q) + " and MOD would give " + (a % b) + "."
          };
        }
      }),
      {
        id: "m1a-and", category: "m1a-ops",
        prompt: "Which Boolean operator gives TRUE only when BOTH conditions are TRUE?",
        answers: ["AND"], keywords: [/^\s*and\s*$/i],
        distractors: ["OR", "NOT", "<>", "DIV", "MOD"],
        note: "AND needs both sides TRUE, e.g. Age >= 13 AND Age <= 19."
      },
      {
        id: "m1a-or", category: "m1a-ops",
        prompt: "Which Boolean operator gives TRUE when AT LEAST ONE of the conditions is TRUE?",
        answers: ["OR"], keywords: [/^\s*or\s*$/i],
        distractors: ["AND", "NOT", "<>", "DIV", "MOD"],
        note: "OR needs only one side TRUE, e.g. Number < 1 OR Number > 10 is TRUE for any number outside 1 to 10."
      },
      {
        id: "m1a-not", category: "m1a-ops",
        prompt: "What does NOT do to a condition?",
        answers: ["Reverses it, so TRUE becomes FALSE and FALSE becomes TRUE"],
        keywords: [{ required: [["reverse", "opposite", "flip", "invert", "swap"]] }, { required: [["true"], ["false"], ["become", "turn", "change"]] }],
        distractors: ["Makes the condition always TRUE", "Checks that two conditions are both TRUE", "Joins two conditions together", "Stops the program", "Compares two values to see if they are equal"],
        note: "NOT flips a condition. WHILE NOT Found keeps looping while Found is FALSE."
      },
      fill({
        id: "m1a-evaluate", category: "m1a-ops", show: 2,
        randomize: function () {
          var x = randInt(1, 40), lo = randInt(5, 15), hi = lo + randInt(5, 15), useAnd = Math.random() < 0.6;
          var val = useAnd ? (x >= lo && x <= hi) : (x < lo || x > hi);
          var cond = useAnd ? "X >= " + lo + " AND X <= " + hi : "X < " + lo + " OR X > " + hi;
          var ans = val ? "TRUE" : "FALSE";
          return {
            prompt: "X <- " + x + "\nIs this condition TRUE or FALSE?\n" + cond,
            answers: [ans], keywords: exact(ans),
            distractors: [val ? "FALSE" : "TRUE"],
            note: useAnd ? "AND: both " + x + " >= " + lo + " and " + x + " <= " + hi + " must be TRUE." : "OR: TRUE if " + x + " < " + lo + " or " + x + " > " + hi + "."
          };
        }
      }),
      // ---------------- data types
      typeCard("m1a-t-int", "the number of students in a class, e.g. 28", "INTEGER", "A whole number is an INTEGER."),
      typeCard("m1a-t-age", "an age in whole years, e.g. 16", "INTEGER", "A whole number is an INTEGER."),
      typeCard("m1a-t-real", "the price of a ticket, e.g. 12.50", "REAL", "A number with a decimal part is REAL."),
      typeCard("m1a-t-temp", "a temperature, e.g. 21.5", "REAL", "A number with a decimal part is REAL."),
      typeCard("m1a-t-str", "a person's name, e.g. Priya", "STRING", "Text of any length is a STRING."),
      typeCard("m1a-t-mix", "a product code made of letters and numbers, e.g. AB12", "STRING", "Any combination of letters and numbers is a STRING."),
      typeCard("m1a-t-phone", "a telephone number, e.g. +66 812345678", "STRING", "A phone number is a STRING: it can start with + or 0, can contain spaces, and is never used in calculations."),
      typeCard("m1a-t-char", "a single letter grade, e.g. 'B'", "CHAR", "One single character (a letter, symbol or digit) is a CHAR."),
      typeCard("m1a-t-sym", "a single symbol typed at the keyboard, e.g. #", "CHAR", "One single character (a letter, symbol or digit) is a CHAR."),
      typeCard("m1a-t-bool", "whether a door is locked or not", "BOOLEAN", "A value that can only be TRUE or FALSE is BOOLEAN."),
      typeCard("m1a-t-pass", "whether a student has passed, e.g. TRUE", "BOOLEAN", "A value that can only be TRUE or FALSE is BOOLEAN."),
      {
        id: "m1a-t-why", category: "m1a-types",
        prompt: "Why is a telephone number such as 07700 900123 stored as a STRING, not an INTEGER?",
        answers: ["It can start with 0 or + and contain spaces, and it is never used in calculations"],
        keywords: [{ required: [["0", "zero", "plus", "space", "calculation", "calculate", "arithmetic", "maths", "math", "symbol"]] }],
        distractors: ["Because phone numbers are always negative", "Because a STRING uses less memory than an INTEGER", "Because it is a whole number", "Because it can only be TRUE or FALSE", "Because it is a single character"],
        note: "An INTEGER would lose the leading 0 and cannot hold + or spaces. You never add or multiply phone numbers."
      },
      // ---------------- loops
      {
        id: "m1a-l-count", category: "m1a-loops",
        prompt: "Which loop is a count-controlled loop?",
        answers: ["FOR ... NEXT"], keywords: [/\bfor\b/i, { required: [["next"]] }],
        distractors: ["REPEAT ... UNTIL", "WHILE ... DO ... ENDWHILE", "IF ... THEN ... ENDIF", "CASE OF ... ENDCASE", "INPUT ... OUTPUT"],
        note: "FOR Count <- 1 TO 10 ... NEXT Count repeats a set number of times."
      },
      {
        id: "m1a-l-post", category: "m1a-loops",
        prompt: "Which loop is a post-condition loop?",
        answers: ["REPEAT ... UNTIL"], keywords: [{ required: [["repeat", "until"]] }],
        distractors: ["FOR ... NEXT", "WHILE ... DO ... ENDWHILE", "IF ... THEN ... ENDIF", "CASE OF ... ENDCASE", "INPUT ... OUTPUT"],
        note: "REPEAT ... UNTIL tests its condition at the END (post) of each pass."
      },
      {
        id: "m1a-l-pre", category: "m1a-loops",
        prompt: "Which loop is a pre-condition loop?",
        answers: ["WHILE ... DO ... ENDWHILE"], keywords: [{ required: [["while", "endwhile"]] }],
        distractors: ["FOR ... NEXT", "REPEAT ... UNTIL", "IF ... THEN ... ENDIF", "CASE OF ... ENDCASE", "INPUT ... OUTPUT"],
        note: "WHILE ... DO ... ENDWHILE tests its condition BEFORE (pre) each pass."
      },
      {
        id: "m1a-l-once", category: "m1a-loops",
        prompt: "Which loop ALWAYS runs its body at least once?",
        answers: ["REPEAT ... UNTIL"], keywords: [{ required: [["repeat", "until"]] }],
        distractors: ["WHILE ... DO ... ENDWHILE", "FOR Count <- 1 TO 0 ... NEXT Count", "IF ... THEN ... ENDIF", "CASE OF ... ENDCASE", "None of them"],
        note: "REPEAT checks at UNTIL, after the body has already run once."
      },
      {
        id: "m1a-l-zero", category: "m1a-loops",
        prompt: "Which loop might not run its body at all?",
        answers: ["WHILE ... DO ... ENDWHILE"], keywords: [{ required: [["while", "endwhile"]] }],
        distractors: ["REPEAT ... UNTIL", "IF ... THEN ... ELSE ... ENDIF", "CASE OF ... ENDCASE", "OUTPUT", "None of them"],
        note: "If the WHILE condition is FALSE the first time it is tested, the body is skipped completely."
      },
      {
        id: "m1a-l-desc-count", category: "m1a-loops",
        prompt: "Describe a count-controlled loop.",
        answers: ["It repeats a set number of times"],
        keywords: [{ required: [["set", "fixed", "known", "certain", "specific", "exact", "given"]] }],
        distractors: ["It repeats until a condition becomes TRUE", "It tests its condition before each pass", "It always runs at least once and tests at the end", "It runs one line at a time from top to bottom", "It chooses one of two branches"],
        note: "A count-controlled loop (FOR) knows how many times it will run before it starts."
      },
      {
        id: "m1a-l-desc-post", category: "m1a-loops",
        prompt: "Describe a post-condition loop.",
        answers: ["The condition is tested at the end of each pass, so the loop always runs at least once"],
        keywords: [{ required: [["end", "least", "once", "after"]] }],
        distractors: ["The condition is tested before each pass, so it may not run at all", "It repeats a set number of times", "It runs forever", "It chooses between several values", "It only runs if the condition is TRUE at the start"],
        note: "Post means after: REPEAT ... UNTIL checks its condition after the body, so the body always runs at least once."
      },
      fill({
        id: "m1a-l-identify", category: "m1a-loops", show: 5,
        randomize: function () {
          var n = randInt(3, 12), k = randInt(0, 2);
          var code = [
            "FOR Count <- 1 TO " + n + "\n   OUTPUT Count\nNEXT Count",
            "Number <- 0\nWHILE Number < " + n + " DO\n   Number <- Number + 2\nENDWHILE",
            "REPEAT\n   INPUT Guess\nUNTIL Guess = " + n
          ][k];
          var names = ["Count-controlled loop", "Pre-condition loop", "Post-condition loop"];
          var keys = [[{ required: [["count"]] }], [{ required: [["pre"]] }], [{ required: [["post"]] }]];
          return {
            prompt: "What type of loop is this?\n" + code,
            answers: [names[k]], keywords: keys[k],
            distractors: names.filter(function (x, i) { return i !== k; }).concat(["Selection", "Sequence"]),
            note: "FOR ... NEXT is count-controlled, WHILE is pre-condition (tests first), REPEAT ... UNTIL is post-condition (tests last)."
          };
        }
      }),
      fill({
        id: "m1a-l-times", category: "m1a-loops",
        randomize: function () {
          var a = randInt(0, 5), b = a + randInt(3, 12), t = b - a + 1;
          return {
            prompt: "How many times does the body of this loop run?\nFOR Index <- " + a + " TO " + b + "\n   OUTPUT Index\nNEXT Index",
            answers: [String(t)], keywords: exact(t),
            distractors: dedupeDistractors(t, [b - a, b, t + 1, a, b + 1], function (i) { return t + i + 1; }),
            note: "Count both ends: " + a + " TO " + b + " is " + b + " - " + a + " + 1 = " + t + " passes."
          };
        }
      }),
      {
        id: "m1a-l-pairs", category: "m1a-loops",
        prompt: "Which pair are BOTH pseudocode statements used for iteration?",
        answers: ["FOR ... NEXT and REPEAT ... UNTIL", "WHILE ... DO ... ENDWHILE and REPEAT ... UNTIL", "FOR ... NEXT and WHILE ... DO ... ENDWHILE"],
        keywords: [{ required: [["next", "until", "endwhile"]], optional: ["next", "until", "endwhile"], need: 2, excluded: ["if", "case", "input", "output", "declare"] }],
        distractors: ["IF and CASE", "CASE and FOR ... NEXT", "IF and WHILE ... DO ... ENDWHILE", "INPUT and OUTPUT", "DECLARE and CONSTANT", "IF ... THEN and REPEAT ... UNTIL"],
        note: "Iteration means loops: FOR ... NEXT, WHILE ... DO ... ENDWHILE and REPEAT ... UNTIL. IF and CASE are selection."
      },
      // ---------------- standard methods and bubble sort
      {
        id: "m1a-m-total", category: "m1a-methods",
        prompt: "Which standard method of solution adds together a set of values during iteration?",
        answers: ["Totalling"], keywords: [{ required: [["totalling", "total", "totaling"]] }],
        distractors: ["Counting", "Searching", "Sorting", "Validating", "Verifying"],
        note: "Totalling: Total <- Total + Value inside a loop."
      },
      {
        id: "m1a-m-count", category: "m1a-methods",
        prompt: "Which standard method of solution adds 1 each time something happens?",
        answers: ["Counting"], keywords: [{ required: [["counting", "count"]] }],
        distractors: ["Totalling", "Searching", "Sorting", "Validating", "Verifying"],
        note: "Counting: Count <- Count + 1, usually inside an IF."
      },
      {
        id: "m1a-m-search", category: "m1a-methods",
        prompt: "Which standard method checks each item in turn until the one you want is found?",
        answers: ["Linear search"], keywords: [{ required: [["search", "searching", "linear"]] }],
        distractors: ["Bubble sort", "Totalling", "Counting", "Validation", "Verification"],
        note: "A linear search checks element 1, then 2, then 3, until it finds a match or runs out of elements."
      },
      {
        id: "m1a-m-sort", category: "m1a-methods",
        prompt: "Which standard method puts the values in an array into order?",
        answers: ["Sorting (bubble sort)"], keywords: [{ required: [["sort", "sorting", "bubble"]] }],
        distractors: ["Linear search", "Totalling", "Counting", "Validation", "Verification"],
        note: "Sorting puts data in order. The sort you need to know is the bubble sort."
      },
      {
        id: "m1a-m-where", category: "m1a-methods",
        prompt: "Where should the line Total <- 0 go in a totalling algorithm?",
        answers: ["Before the loop starts"],
        keywords: [{ required: [["before"]], excluded: ["inside", "after", "end"] }],
        distractors: ["Inside the loop body", "After the loop ends", "At the end of the program", "It is not needed", "Inside an IF statement"],
        note: "Inside the loop, Total would be reset to 0 on every pass and only the last value would be kept."
      },
      {
        id: "m1a-m-totalline", category: "m1a-methods",
        prompt: "Which line adds Price onto a running total?",
        answers: ["Total <- Total + Price"], keywords: [/^\s*total\s*(<-|\u2190)\s*total\s*\+\s*price\s*$/i],
        distractors: ["Total <- Total + 1", "Price <- Total + Price", "Total <- Price", "Total = Total + Price", "Total <- Total * Price"],
        note: "Add the new value onto the old total and store it back in Total. Adding 1 would count instead."
      },
      {
        id: "m1a-m-countline", category: "m1a-methods",
        prompt: "Which line counts one more pass mark?",
        answers: ["PassCount <- PassCount + 1"], keywords: [/^\s*passcount\s*(<-|\u2190)\s*passcount\s*\+\s*1\s*$/i],
        distractors: ["PassCount <- PassCount + Mark", "PassCount <- 1", "PassCount <- Mark", "PassCount = PassCount + 1", "Mark <- Mark + 1"],
        note: "Counting always adds exactly 1."
      },
      {
        id: "m1a-b-compare", category: "m1a-methods",
        prompt: "In a bubble sort, which values are compared?",
        answers: ["Each pair of neighbouring (adjacent) values"],
        keywords: [{ required: [["neighbour", "neighbor", "neighbouring", "neighboring", "adjacent", "next", "beside", "side"]], excluded: ["every", "all", "first", "largest"] }],
        distractors: ["Every value with the first value", "The largest value with the smallest value", "Every possible pair of values", "Only the first and last values", "Each value with the value to be found"],
        note: "Index is compared with Index + 1, all the way along the array."
      },
      {
        id: "m1a-b-flag", category: "m1a-methods",
        prompt: "In a bubble sort, what is Swap set to at the start of every pass?",
        answers: ["FALSE"], keywords: exact("FALSE"),
        distractors: ["TRUE", "0", "1", "Last", "Temp"],
        note: "Swap starts FALSE. It becomes TRUE only if a swap happens during the pass."
      },
      {
        id: "m1a-b-temp", category: "m1a-methods",
        prompt: "Why does a bubble sort use a Temp variable when swapping two values?",
        answers: ["To hold one value so it is not overwritten (lost) during the swap"],
        keywords: [{ required: [["overwritten", "overwrite", "lost", "lose", "hold", "store", "keep", "save", "copy"]] }],
        distractors: ["To count how many passes there have been", "To make the loop run faster", "To remember whether a swap happened", "To mark the end of the array", "To sort the array in descending order"],
        note: "Without Temp, Names[Index] <- Names[Index + 1] would wipe out the first value before it could be moved."
      },
      fill({
        id: "m1a-b-last", category: "m1a-methods",
        randomize: function () {
          var n = randInt(6, 60);
          return {
            prompt: "An array has " + n + " elements. The inner loop of a bubble sort compares Index with Index + 1. What should the loop go up to?\nFOR Index <- 1 TO ?",
            answers: [String(n - 1)], keywords: exact(n - 1),
            distractors: dedupeDistractors(n - 1, [n, n + 1, n - 2, Math.floor(n / 2), 1]),
            note: "The last pair is element " + (n - 1) + " with element " + n + ", so the loop stops at " + (n - 1) + " (Last - 1)."
          };
        }
      }),
      {
        id: "m1a-b-stop", category: "m1a-methods",
        prompt: "When does a bubble sort with a Swap flag stop?",
        answers: ["When a whole pass makes no swaps"],
        keywords: [{ required: [["no", "without", "zero"], ["swap", "swapped", "swapping"]] }],
        distractors: ["When the first swap happens", "After exactly one pass", "When Temp is empty", "When a swap is made", "After 10 passes"],
        note: "A pass with no swaps means every neighbour is already in order, so the array is sorted: UNTIL NOT Swap."
      },
      {
        id: "m1a-b-until", category: "m1a-methods",
        prompt: "Complete the last line of a bubble sort:\nUNTIL ____ Swap OR Last = 1",
        answers: ["NOT"], keywords: exact("NOT"),
        distractors: ["AND", "OR", "TRUE", "FALSE", "Temp"],
        note: "UNTIL NOT Swap stops the loop once a pass makes no swaps (Swap is still FALSE)."
      },
      fill({
        id: "m1a-b-pass", category: "m1a-methods",
        randomize: function () {
          var a = [];
          while (a.length < 5) { var v = randInt(1, 30); if (a.indexOf(v) === -1) a.push(v); }
          if (a[4] === Math.max.apply(null, a)) { var t = a[4]; a[4] = a[0]; a[0] = t; }
          var b = a.slice();
          for (var i = 0; i < 4; i++) if (b[i] > b[i + 1]) { var x = b[i]; b[i] = b[i + 1]; b[i + 1] = x; }
          var sorted = a.slice().sort(function (p, q) { return p - q; });
          var oneSwap = a.slice(); for (var j = 0; j < 4; j++) if (oneSwap[j] > oneSwap[j + 1]) { var y = oneSwap[j]; oneSwap[j] = oneSwap[j + 1]; oneSwap[j + 1] = y; break; }
          var fmt = function (arr) { return arr.join(", "); };
          var ans = fmt(b);
          return {
            prompt: "An array holds " + fmt(a) + ".\nWhat does it hold after ONE pass of a bubble sort into ascending order?",
            answers: [ans], keywords: [new RegExp("^\\D*" + b.join("\\D+") + "\\D*$")],
            distractors: dedupeDistractors(ans, [fmt(sorted), fmt(a), fmt(oneSwap), fmt(sorted.slice().reverse())], function (i) { return i > 4 ? null : fmt(b.slice(i).concat(b.slice(0, i))); }),
            note: "One pass compares pairs 1-2, 2-3, 3-4, 4-5 and swaps each pair that is the wrong way round. The largest value, " + Math.max.apply(null, a) + ", ends up at the end."
          };
        }
      })
    ];
  })()
});
