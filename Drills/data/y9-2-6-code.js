// Year 9, 2.6: Errors and Trace Tables (Activity 2: fix the program)
// Loaded by Drills/index.html?drill=y9-2-6-code
// Code cards: the editor opens holding a short program with ONE error (`starter`). The student fixes it and runs
// it; it must give the same output and variables as the reference. Syntax errors first (the program will not
// run), then logic errors (it runs but gives the wrong answer). Only DECLARE, assignment, OUTPUT and
// FOR ... TO ... NEXT, plus a one-dimensional array starting at index 1.
DrillData.register("y9-2-6-code", {
  title: "Year 9, 2.6: Fix the Program",
  subtitle: "Each program has one error. Find it, fix it, run it.",
  codeDrill: true,
  categories: [
    ["code-fix-syntax", "Fix a Syntax Error"],
    ["code-fix-logic", "Fix a Logic Error"]
  ],
  cards: [
    {
      id: "code-fix-syntax-1", category: "code-fix-syntax",
      prompt: "This program should output 8. It will not run: one keyword is spelt wrong. Fix it, then run it.",
      starter: "DECLARE Total : INTEGER\nTotal <- 5 + 3\nOUTPT Total",
      reference: "DECLARE Total : INTEGER\nTotal <- 5 + 3\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-fix-syntax-2", category: "code-fix-syntax",
      prompt: "This program should output 1, 2, 3. It will not run: a line is missing at the end. Add it, then run it.",
      starter: "DECLARE Count : INTEGER\nFOR Count <- 1 TO 3\n    OUTPUT Count",
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO 3\n    OUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-fix-syntax-3", category: "code-fix-syntax",
      prompt: "This program should output 1 to 5. It will not run: the FOR line is missing a keyword. Fix it, then run it.",
      starter: "DECLARE Count : INTEGER\nFOR Count <- 1 5\n    OUTPUT Count\nNEXT Count",
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO 5\n    OUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-fix-logic-1", category: "code-fix-logic",
      prompt: "This program should add up the numbers 1 to 5 and output 15. It runs, but outputs 10. Fix it, then run it.",
      starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 5\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-fix-logic-2", category: "code-fix-logic",
      prompt: "This program should add up the numbers 1 to 4 and output 10. It runs, but outputs 4. Fix it, then run it.",
      starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    Total <- 0\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-fix-logic-3", category: "code-fix-logic",
      prompt: "This program should output each number doubled: 2, 4, 6, 8. It runs, but outputs 3, 4, 5, 6. Fix it, then run it.",
      starter: "DECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    OUTPUT Count + 2\nNEXT Count",
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO 4\n    OUTPUT Count * 2\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-fix-logic-4", category: "code-fix-logic",
      prompt: "This program should output the total of all the values in Marks (see Given). It runs, but adds the first value four times. Fix it, then run it.",
      setup: { "Marks": [6, 3, 8, 5] },
      starter: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Marks[1]\nNEXT Index\nOUTPUT Total",
      reference: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Marks[Index]\nNEXT Index\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-fix-logic-5", category: "code-fix-logic",
      prompt: "This program should output the total, 10. It runs, but outputs the wrong number. The loop is correct. Fix the last line, then run it.",
      starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    Total <- Total + Count\nNEXT Count\nOUTPUT Count",
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    }
  ]
});
