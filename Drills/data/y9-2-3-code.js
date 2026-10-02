// Year 9, 2.3: Data Types and Arrays (Activity 2: write the array code)
// Loaded by Drills/index.html?drill=y9-2-3-code
// Code cards: the array is given already filled (its values are redrawn on every card), and the student writes
// Cambridge pseudocode that reads it. The code is run against the reference program with the same values and
// must give the same output and variables. Only DECLARE, assignment, OUTPUT, FOR ... TO ... NEXT and
// IF ... THEN ... ELSE ... ENDIF are needed. Arrays start at index 1.
DrillData.register("y9-2-3-code", {
  title: "Year 9, 2.3: Write the Array Code",
  subtitle: "Read values from an array by index, then visit every value with a loop",
  codeDrill: true,
  categories: [
    ["code-arr-read", "Read One Value"],
    ["code-arr-loop", "Visit Every Value"],
    ["code-arr-total", "Totals and Decisions"]
  ],
  cards: [
    {
      id: "code-arr-read-1", category: "code-arr-read",
      prompt: "The array Marks is already filled (see Given). Write one line that outputs the value at index 3 of Marks.",
      setup: { "Marks": [6, 3, 8, 5] },
      reference: "OUTPUT Marks[3]",
      checkOutput: true
    },
    {
      id: "code-arr-read-2", category: "code-arr-read",
      prompt: "The array Marks is already filled (see Given). Output the FIRST value in Marks, then the LAST value in Marks.",
      setup: { "Marks": [6, 3, 8, 5] },
      reference: "OUTPUT Marks[1]\nOUTPUT Marks[4]",
      checkOutput: true
    },
    {
      id: "code-arr-read-3", category: "code-arr-read",
      prompt: "The array Scores is already filled (see Given). Declare Sum (INTEGER). Store Scores[2] + Scores[3] in Sum, then output Sum.",
      setup: { "Scores": [4, 9, 2, 7, 5] },
      reference: "DECLARE Sum : INTEGER\nSum <- Scores[2] + Scores[3]\nOUTPUT Sum",
      checkVars: ["Sum"],
      checkOutput: true
    },
    {
      id: "code-arr-loop-1", category: "code-arr-loop",
      prompt: "The array Marks is already filled (see Given). Declare Index (INTEGER), then write a FOR loop that outputs every value in Marks, from index 1 to 4.",
      setup: { "Marks": [6, 3, 8, 5] },
      reference: "DECLARE Index : INTEGER\nFOR Index <- 1 TO 4\n    OUTPUT Marks[Index]\nNEXT Index",
      checkOutput: true
    },
    {
      id: "code-arr-loop-2", category: "code-arr-loop",
      prompt: "The array Temps holds 5 temperatures (see Given). Declare Day (INTEGER), then write a FOR loop that outputs every value in Temps, using Day as the loop variable.",
      setup: { "Temps": [31, 33, 30, 34, 32] },
      reference: "DECLARE Day : INTEGER\nFOR Day <- 1 TO 5\n    OUTPUT Temps[Day]\nNEXT Day",
      checkOutput: true
    },
    {
      id: "code-arr-loop-3", category: "code-arr-loop",
      prompt: "The array Marks is already filled (see Given). Declare Index (INTEGER), then write a FOR loop that outputs every value in Marks multiplied by 2.",
      setup: { "Marks": [6, 3, 8, 5] },
      reference: "DECLARE Index : INTEGER\nFOR Index <- 1 TO 4\n    OUTPUT Marks[Index] * 2\nNEXT Index",
      checkOutput: true
    },
    {
      id: "code-arr-total-1", category: "code-arr-total",
      prompt: "The array Marks is already filled (see Given). Declare Total and Index (INTEGER). Set Total to 0, then use a FOR loop to add every value in Marks onto Total. Output Total after the loop.",
      setup: { "Marks": [6, 3, 8, 5] },
      reference: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Marks[Index]\nNEXT Index\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-arr-total-2", category: "code-arr-total",
      prompt: "The array Marks and the number Pass are given. Declare Count and Index (INTEGER). Set Count to 0, then use a FOR loop from 1 to 4 that adds 1 to Count only when Marks[Index] is Pass or more. Output Count after the loop.",
      setup: { "Marks": [6, 3, 8, 5], "Pass": 5 },
      reference: "DECLARE Count : INTEGER\nDECLARE Index : INTEGER\nCount <- 0\nFOR Index <- 1 TO 4\n    IF Marks[Index] >= Pass THEN\n        Count <- Count + 1\n    ENDIF\nNEXT Index\nOUTPUT Count",
      checkVars: ["Count"],
      checkOutput: true
    },
    {
      id: "code-arr-total-3", category: "code-arr-total",
      prompt: "The array Marks and the number Pass are given. Declare Index (INTEGER), then write a FOR loop from 1 to 4. On each pass, output \"Pass\" if Marks[Index] is Pass or more, otherwise output \"Try again\".",
      setup: { "Marks": [6, 3, 8, 5], "Pass": 5 },
      reference: "DECLARE Index : INTEGER\nFOR Index <- 1 TO 4\n    IF Marks[Index] >= Pass THEN\n        OUTPUT \"Pass\"\n    ELSE\n        OUTPUT \"Try again\"\n    ENDIF\nNEXT Index",
      checkOutput: true
    }
  ]
});
