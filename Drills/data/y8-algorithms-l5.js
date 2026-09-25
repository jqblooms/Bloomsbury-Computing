// Year 8, L5: Sequence, Selection and Iteration
// Loaded by Drills/index.html?drill=y8-algorithms-l5
DrillData.register("y8-algorithms-l5", {
  title: "Year 8, L5: Sequence, Selection and Iteration",
  subtitle: "Cambridge Pseudocode",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["ctvocab", "Computational Thinking Vocabulary"],
    ["declare", "Declaring Variables"],
    ["iteration", "Iteration: FOR and WHILE"],
    ["synthesis", "Combining Selection and Iteration"]
  ],
  cards: [
    {
      id: "ctvocab-algorithmic", category: "ctvocab",
      prompt: "What does Algorithmic Thinking mean?",
      answers: ["Breaking a solution down into a clear sequence of steps"],
      keywords: [/(?=.*(sequen|order|series))(?=.*(step|instruction))/i],
      distractors: ["Writing a program in a coding language", "Testing a program to find errors", "Removing detail so only the important parts of a problem remain", "Splitting a big problem into smaller problems"],
      note: "Algorithmic Thinking is about the clear, ordered sequence of steps itself, before any coding happens."
    },
    {
      id: "ctvocab-decomposition", category: "ctvocab",
      prompt: "What does Decomposition mean?",
      answers: ["Breaking down a larger problem into smaller, more manageable problems"],
      keywords: [/(?=.*(break|split|divid))(?=.*(smaller|manageable))(?=.*problem)/i],
      distractors: ["Removing detail so only the important parts of a problem remain", "Writing the steps of a solution in order", "Testing an algorithm with real data", "Choosing which variables to declare"],
      note: "Decomposition means splitting ONE big problem into several smaller ones."
    },
    {
      id: "ctvocab-abstraction", category: "ctvocab",
      prompt: "What does Abstraction mean?",
      answers: ["Removing unnecessary information so that the important parts of a problem can be focused on"],
      keywords: [/(?=.*(remov|ignor|hid))(?=.*(unnecessary|irrelevant|unimportant|detail))/i],
      distractors: ["Breaking a problem into smaller problems", "Writing a clear sequence of steps", "Running a program to check it works", "Combining two variables into one"],
      note: "Abstraction keeps what matters and throws away detail that doesn't."
    },
    {
      id: "ctvocab-identify-decomposition", category: "ctvocab",
      prompt: "A student splits 'build a quiz app' into 'design the questions', 'build the scoring system' and 'build the results screen'. Which technique is this?",
      answers: ["Decomposition"],
      keywords: [/decomposition/i],
      distractors: ["Abstraction", "Algorithmic Thinking", "Iteration", "Selection", "Sequence"],
      note: "Splitting one task into several smaller named tasks is Decomposition."
    },
    {
      id: "ctvocab-identify-abstraction", category: "ctvocab",
      prompt: "A map of the London Underground removes real geographic distances and shows only station names and connecting lines. Which technique is this?",
      answers: ["Abstraction"],
      keywords: [/abstraction/i],
      distractors: ["Decomposition", "Algorithmic Thinking", "Iteration", "Selection", "Sequence"],
      note: "Removing detail that doesn't matter (real distance) to keep only what's useful (station order) is Abstraction."
    },
    {
      id: "declare-integer", category: "declare",
      prompt: "Write the DECLARE line for an INTEGER variable called Score.",
      answers: ["DECLARE Score : INTEGER"],
      keywords: [/^\s*declare\s+score\s*:\s*integer\s*$/i],
      distractors: ["Score <- INTEGER", "INTEGER Score;", "DECLARE Score AS INTEGER", "DECLARE INTEGER : Score", "Score : INTEGER <- 0"],
      note: "DECLARE <name> : <type>, in that order, with no assignment yet."
    },
    {
      id: "declare-real", category: "declare",
      prompt: "Write the DECLARE line for a REAL variable called Average.",
      answers: ["DECLARE Average : REAL"],
      keywords: [/^\s*declare\s+average\s*:\s*real\s*$/i],
      distractors: ["DECLARE Average : INTEGER", "Average <- REAL", "DECLARE REAL : Average", "DECLARE Average : DECIMAL", "REAL Average;"],
      note: "A value that can have a decimal point, such as an average, needs type REAL, not INTEGER."
    },
    {
      id: "declare-string", category: "declare",
      prompt: "Write the DECLARE line for a STRING variable called Name.",
      answers: ["DECLARE Name : STRING"],
      keywords: [/^\s*declare\s+name\s*:\s*string\s*$/i],
      distractors: ["DECLARE Name : CHAR", "Name <- STRING", "DECLARE STRING : Name", "DECLARE Name : TEXT", "STRING Name;"],
      note: "A whole word or phrase needs STRING. CHAR only holds a single character."
    },
    {
      id: "declare-boolean", category: "declare",
      prompt: "Write the DECLARE line for a BOOLEAN variable called Found.",
      answers: ["DECLARE Found : BOOLEAN"],
      keywords: [/^\s*declare\s+found\s*:\s*boolean\s*$/i],
      distractors: ["DECLARE Found : INTEGER", "Found <- BOOLEAN", "DECLARE BOOLEAN : Found", "DECLARE Found : BOOL", "BOOLEAN Found;"],
      note: "A variable that only ever stores TRUE or FALSE needs type BOOLEAN."
    },
    {
      id: "declare-before-for", category: "declare",
      prompt: "Before FOR Count <- 1 TO 5 can run, what must happen first, and why?",
      answers: ["Count must be declared with DECLARE Count : INTEGER because every variable now needs a type before it is used"],
      keywords: [/(?=.*declar)(?=.*count)(?=.*(type|integer|before|use))/i],
      distractors: ["Count must be set to 0", "The loop body must be written first", "Count must be output once", "Nothing, FOR loops don't need declared variables"],
      note: "DECLARE must come before ANY use of a variable, including as a loop counter."
    },
    {
      id: "iter-for-end", category: "iteration",
      prompt: "Which keyword pairs with FOR to mark the end of a count-controlled loop?",
      answers: ["NEXT"],
      keywords: [/^\s*next(\s+\w+)?\s*$/i],
      distractors: ["ENDWHILE", "ENDIF", "ENDFOR", "STOP", "REPEAT"],
      note: "FOR ... NEXT is the count-controlled pair in Cambridge pseudocode."
    },
    {
      id: "iter-while-end", category: "iteration",
      prompt: "Which keyword pairs with WHILE to mark the end of a condition-controlled loop?",
      answers: ["ENDWHILE"],
      keywords: [/^\s*endwhile\s*$/i],
      distractors: ["NEXT", "ENDIF", "UNTIL", "STOP", "DONE"],
      note: "WHILE ... ENDWHILE is the condition-controlled pair."
    },
    {
      id: "iter-count-vs-condition", category: "iteration",
      prompt: "A FOR loop is count-controlled. What is a WHILE loop?",
      answers: ["Condition-controlled"],
      keywords: [/condition/i],
      distractors: ["Also count-controlled", "Selection-controlled", "Sequence-controlled", "Output-controlled"],
      note: "A WHILE loop keeps running for as long as its condition is TRUE - the number of passes is not fixed in advance."
    },
    {
      id: "iter-for-trace-total", category: "iteration",
      prompt: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total\n\nWhat does this output?",
      answers: ["10"],
      keywords: [/^\s*10\s*$/],
      distractors: ["4", "6", "16", "1234", "24"],
      note: "1 + 2 + 3 + 4 = 10.",
      randomize: function () {
        var n = randInt(3, 7);
        var total = n * (n + 1) / 2;
        return {
          prompt: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO " + n + "\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total\n\nWhat does this output?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [n, n * n], function (i) { return total + i; }),
          note: "1 + 2 + ... + " + n + " = " + total + "."
        };
      }
    },
    {
      id: "iter-while-trace-count", category: "iteration",
      prompt: "DECLARE Count : INTEGER\nCount <- 0\nWHILE Count < 3\n    OUTPUT \"Go\"\n    Count <- Count + 1\nENDWHILE\n\nHow many times is \"Go\" output?",
      answers: ["3 times"],
      keywords: [/^\s*3\s*(times?)?\s*$/i],
      distractors: ["2 times", "4 times", "0 times", "Forever", "1 time"],
      note: "Count goes 0, 1, 2 - the condition Count < 3 is true for all three, then false when Count = 3.",
      randomize: function () {
        var n = randInt(2, 6);
        var answer = n + " times";
        return {
          prompt: "DECLARE Count : INTEGER\nCount <- 0\nWHILE Count < " + n + "\n    OUTPUT \"Go\"\n    Count <- Count + 1\nENDWHILE\n\nHow many times is \"Go\" output?",
          answers: [answer], keywords: [new RegExp("^\\s*" + n + "\\s*(times?)?\\s*$", "i")],
          distractors: dedupeDistractors(answer, [(n - 1) + " times", (n + 1) + " times", "0 times", "Forever"]),
          note: "Count goes 0, 1, ... up to " + (n - 1) + " - the condition Count < " + n + " is true for all " + n + " of those, then false when Count = " + n + "."
        };
      }
    },
    {
      id: "synth-for-if-order", category: "synthesis",
      prompt: "FOR Count <- 1 TO 3\n    INPUT Mark\n    IF Mark >= 50 THEN\n        OUTPUT \"Pass\"\n    ELSE\n        OUTPUT \"Fail\"\n    ENDIF\nNEXT Count\n\nThe three Marks entered are 40, 60, 55. What are the three outputs, in order?",
      answers: ["Fail, Pass, Pass"],
      keywords: [/fail.*pass.*pass/i],
      distractors: ["Pass, Fail, Pass", "Pass, Pass, Pass", "Fail, Fail, Pass", "Pass, Fail, Fail"],
      note: "40 < 50 (Fail), 60 >= 50 (Pass), 55 >= 50 (Pass) - one decision made per pass of the loop.",
      randomize: function () {
        var marks = randInts(3, 0, 100);
        var labels = marks.map(function (m) { return m >= 50 ? "Pass" : "Fail"; });
        var answer = labels.join(", ");
        var wrongPerms = shuffle([
          [labels[1], labels[0], labels[2]].join(", "),
          [labels[0], labels[2], labels[1]].join(", "),
          labels.map(function () { return "Pass"; }).join(", "),
          labels.map(function () { return "Fail"; }).join(", ")
        ]);
        return {
          prompt: "FOR Count <- 1 TO 3\n    INPUT Mark\n    IF Mark >= 50 THEN\n        OUTPUT \"Pass\"\n    ELSE\n        OUTPUT \"Fail\"\n    ENDIF\nNEXT Count\n\nThe three Marks entered are " + marks.join(", ") + ". What are the three outputs, in order?",
          answers: [answer], keywords: [new RegExp("^\\s*" + answer.replace(/, /g, "\\s*,\\s*") + "\\s*$", "i")],
          distractors: dedupeDistractors(answer, wrongPerms),
          note: marks.map(function (m, i) { return m + " " + (m >= 50 ? ">= 50 (Pass)" : "< 50 (Fail)"); }).join(", ") + " - one decision made per pass of the loop."
        };
      }
    },
    {
      id: "synth-for-if-order-2", category: "synthesis",
      prompt: "FOR Count <- 1 TO 3\n    INPUT Temperature\n    IF Temperature >= 20 THEN\n        OUTPUT \"Warm\"\n    ELSE\n        OUTPUT \"Cool\"\n    ENDIF\nNEXT Count\n\nThe three Temperatures entered are 25, 12, 18. What are the three outputs, in order?",
      answers: ["Warm, Cool, Cool"],
      keywords: [/warm.*cool.*cool/i],
      distractors: ["Cool, Warm, Warm", "Warm, Warm, Cool", "Cool, Cool, Warm", "Warm, Warm, Warm"],
      note: "25 >= 20 (Warm), 12 < 20 (Cool), 18 < 20 (Cool).",
      randomize: function () {
        var temps = randInts(3, -5, 35);
        var labels = temps.map(function (t) { return t >= 20 ? "Warm" : "Cool"; });
        var answer = labels.join(", ");
        var wrongPerms = shuffle([
          [labels[1], labels[0], labels[2]].join(", "),
          [labels[0], labels[2], labels[1]].join(", "),
          labels.map(function () { return "Warm"; }).join(", "),
          labels.map(function () { return "Cool"; }).join(", ")
        ]);
        return {
          prompt: "FOR Count <- 1 TO 3\n    INPUT Temperature\n    IF Temperature >= 20 THEN\n        OUTPUT \"Warm\"\n    ELSE\n        OUTPUT \"Cool\"\n    ENDIF\nNEXT Count\n\nThe three Temperatures entered are " + temps.join(", ") + ". What are the three outputs, in order?",
          answers: [answer], keywords: [new RegExp("^\\s*" + answer.replace(/, /g, "\\s*,\\s*") + "\\s*$", "i")],
          distractors: dedupeDistractors(answer, wrongPerms),
          note: temps.map(function (t) { return t + " " + (t >= 20 ? ">= 20 (Warm)" : "< 20 (Cool)"); }).join(", ") + "."
        };
      }
    },
    {
      id: "synth-name-constructs", category: "synthesis",
      prompt: "Which two computational constructs are combined when a FOR loop contains an IF statement?",
      answers: ["Iteration and Selection"],
      keywords: [/(?=.*iteration)(?=.*selection)/i],
      distractors: ["Sequence and Selection", "Iteration and Sequence", "Abstraction and Decomposition", "Selection and Decomposition"],
      note: "The loop is Iteration, the IF inside it is Selection - one decision made on every pass."
    },
    {
      id: "synth-while-trace-shop", category: "synthesis",
      prompt: "DECLARE Stock : INTEGER\nStock <- 3\nWHILE Stock > 0\n    IF Stock = 1 THEN\n        OUTPUT \"Last one!\"\n    ELSE\n        OUTPUT \"In stock\"\n    ENDIF\n    Stock <- Stock - 1\nENDWHILE\n\nWhat is output on the very last pass?",
      answers: ["Last one!"],
      keywords: [/last one/i],
      distractors: ["In stock", "3", "0", "Out of stock"],
      note: "The final pass runs while Stock = 1, so the IF is true and outputs \"Last one!\".",
      // Two different question TYPES on the same randomised scenario, not
      // just different numbers - "what does the last pass output" has
      // the same answer regardless of the starting Stock, so on its own
      // it would still be memorisable; asking how many times "In stock"
      // is output instead genuinely depends on the random value.
      randomize: function () {
        var stock = randInt(2, 8);
        var code = "DECLARE Stock : INTEGER\nStock <- " + stock + "\nWHILE Stock > 0\n    IF Stock = 1 THEN\n        OUTPUT \"Last one!\"\n    ELSE\n        OUTPUT \"In stock\"\n    ENDIF\n    Stock <- Stock - 1\nENDWHILE";
        if (Math.random() < 0.5) {
          return {
            prompt: code + "\n\nWhat is output on the very last pass?",
            answers: ["Last one!"], keywords: [/last one/i],
            distractors: ["In stock", String(stock), "0", "Out of stock"],
            note: "The final pass runs while Stock = 1 (whatever Stock started at), so the IF is true and outputs \"Last one!\"."
          };
        }
        var inStockCount = stock - 1;
        return {
          prompt: code + "\n\nHow many times is \"In stock\" output in total?",
          answers: [String(inStockCount)], keywords: [new RegExp("^\\s*" + inStockCount + "\\s*$")],
          distractors: dedupeDistractors(inStockCount, [stock], function (i) { return inStockCount + i; }),
          note: "Every pass except the last one (Stock = 1) outputs \"In stock\" - that's " + inStockCount + " passes out of " + stock + "."
        };
      }
    },
    {
      id: "synth-for-vs-while-choice", category: "synthesis",
      prompt: "A programmer wants to keep asking the user to enter a password until they type it correctly, but doesn't know in advance how many attempts it will take. Should they use a FOR loop or a WHILE loop, and why?",
      answers: ["A WHILE loop, because the number of attempts is not known in advance"],
      keywords: [/(?=.*while)(?=.*(not known|don't know|unknown|no fixed|condition))/i],
      distractors: ["A FOR loop, because it always ends", "A FOR loop, because passwords are strings", "A WHILE loop, because it is shorter to write", "Either loop works exactly the same way here"],
      note: "FOR needs a known number of repeats in advance. Here the repeat count depends on when the user gets it right, so it must be WHILE."
    }
  ]
});
