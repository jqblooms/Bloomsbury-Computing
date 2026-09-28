// Year 9, 2.2: Loops and Combined Constructs (Activity 2: write the loop)
// Loaded by Drills/index.html?drill=y9-2-2-code
// Code cards: the student writes Cambridge pseudocode, which is run against
// the reference program with the given values (and fresh ones) and must give
// the same output and variables. Only DECLARE, assignment, OUTPUT,
// FOR ... TO ... NEXT and IF ... THEN ... ELSE ... ENDIF are needed.
DrillData.register("y9-2-2-code", {
  title: "Year 9, 2.2: Write the Loop",
  subtitle: "Write count-controlled loops, then combine them with decisions",
  codeDrill: true,
  categories: [
    ["code-loop-output", "Output with a FOR Loop"],
    ["code-loop-total", "Running Totals"],
    ["code-loop-decide", "Decisions Inside a Loop"]
  ],
  cards: [
    {
      id: "code-loop-output-1", category: "code-loop-output",
      prompt: "Declare Count (INTEGER) first, then write a FOR loop that outputs every whole number from 1 to Limit, using Count as the loop variable.",
      setup: { "Limit": 4 },
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO Limit\n    OUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-loop-output-2", category: "code-loop-output",
      prompt: "Declare Number (INTEGER) first, then write a FOR loop that outputs every whole number from Start to Stop, using Number as the loop variable.",
      setup: { "Start": 3, "Stop": 7 },
      reference: "DECLARE Number : INTEGER\nFOR Number <- Start TO Stop\n    OUTPUT Number\nNEXT Number",
      checkOutput: true
    },
    {
      id: "code-loop-output-3", category: "code-loop-output",
      prompt: "Declare Count (INTEGER) first, then write a FOR loop that outputs the word \"Hello\" exactly Times times, using Count as the loop variable.",
      setup: { "Times": 3 },
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO Times\n    OUTPUT \"Hello\"\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-loop-total-1", category: "code-loop-total",
      prompt: "Declare Total (INTEGER) and Count (INTEGER) first. Set Total to 0, then write a FOR loop that adds every whole number from 1 to Limit onto Total, using Count as the loop variable. Output Total after the loop.",
      setup: { "Limit": 5 },
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO Limit\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-loop-total-2", category: "code-loop-total",
      prompt: "Declare Total (INTEGER) and Count (INTEGER) first. Set Total to 0, then write a FOR loop that runs Times times and adds Step onto Total on every pass. Output Total after the loop.",
      setup: { "Times": 4, "Step": 3 },
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO Times\n    Total <- Total + Step\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-loop-total-3", category: "code-loop-total",
      prompt: "Declare Value (INTEGER) and Count (INTEGER) first. Set Value to 1, then write a FOR loop that doubles Value once on each pass, for Times passes. Output Value after the loop.",
      setup: { "Times": 4 },
      reference: "DECLARE Value : INTEGER\nDECLARE Count : INTEGER\nValue <- 1\nFOR Count <- 1 TO Times\n    Value <- Value * 2\nNEXT Count\nOUTPUT Value",
      checkVars: ["Value"],
      checkOutput: true
    },
    {
      id: "code-loop-decide-1", category: "code-loop-decide",
      prompt: "Declare Big (INTEGER) and Count (INTEGER) first. Set Big to 0, then write a FOR loop from 1 to Limit that adds 1 to Big only when Count is more than Cutoff. Output Big after the loop.",
      setup: { "Limit": 8, "Cutoff": 5 },
      reference: "DECLARE Big : INTEGER\nDECLARE Count : INTEGER\nBig <- 0\nFOR Count <- 1 TO Limit\n    IF Count > Cutoff THEN\n        Big <- Big + 1\n    ENDIF\nNEXT Count\nOUTPUT Big",
      checkVars: ["Big"],
      checkOutput: true
    },
    {
      id: "code-loop-decide-2", category: "code-loop-decide",
      prompt: "Declare Count (INTEGER) first, then write a FOR loop from 1 to Limit. On each pass, output \"Low\" if Count is less than Half, otherwise output \"High\".",
      setup: { "Limit": 5, "Half": 3 },
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO Limit\n    IF Count < Half THEN\n        OUTPUT \"Low\"\n    ELSE\n        OUTPUT \"High\"\n    ENDIF\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-loop-decide-3", category: "code-loop-decide",
      prompt: "Declare Score (INTEGER) and Count (INTEGER) first. Set Score to 0, then write a FOR loop from 1 to Limit: if Count is Cutoff or less, add 2 to Score, otherwise add 1. Output Score after the loop.",
      setup: { "Limit": 6, "Cutoff": 2 },
      reference: "DECLARE Score : INTEGER\nDECLARE Count : INTEGER\nScore <- 0\nFOR Count <- 1 TO Limit\n    IF Count <= Cutoff THEN\n        Score <- Score + 2\n    ELSE\n        Score <- Score + 1\n    ENDIF\nNEXT Count\nOUTPUT Score",
      checkVars: ["Score"],
      checkOutput: true
    }
  ]
});
