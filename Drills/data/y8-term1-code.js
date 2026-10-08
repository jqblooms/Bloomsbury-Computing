// Year 8, Term 1 Revision: write the program
// Loaded by Drills/index.html?drill=y8-term1-code
// Code cards for the Term 1 Test's written questions (a whole array-total program, fixing an IF): the array is
// given already filled (its values are redrawn on every card), and the student writes the Cambridge pseudocode.
// It is run against the reference program with the same values and must give the same output and variables.
// Never the test's own arrays or names (Prices with 8 values, Marks, Temps). Only what Year 8 has met: DECLARE,
// <-, INPUT, OUTPUT, IF ... THEN ... ELSE ... ENDIF, FOR ... NEXT, arrays from index 1, a Found flag.
DrillData.register("y8-term1-code", {
  title: "Year 8, Term 1 Revision: Write the Program",
  subtitle: "Write whole programs that add up, count and search an array",
  codeDrill: true,
  categories: [
    ["code-total", "Add Up an Array"],
    ["code-count", "Count in an Array"],
    ["code-search", "Search an Array"]
  ],
  cards: [
    {
      id: "code-total-1", category: "code-total",
      prompt: "The array Goals holds 5 whole numbers (see Given). Write a program that adds up all 5 values and outputs the total. Declare every variable you use.",
      setup: { "Goals": [3, 1, 4, 2, 5] },
      reference: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 5\n    Total <- Total + Goals[Index]\nNEXT Index\nOUTPUT Total",
      checkVars: ["Total"], checkOutput: true
    },
    {
      id: "code-total-2", category: "code-total",
      prompt: "The array Laps holds 6 whole numbers (see Given). Write a program that adds up all 6 values and outputs the total. Use Sum for the total and Index for the loop. Declare every variable you use.",
      setup: { "Laps": [4, 7, 2, 6, 3, 5] },
      reference: "DECLARE Sum : INTEGER\nDECLARE Index : INTEGER\nSum <- 0\nFOR Index <- 1 TO 6\n    Sum <- Sum + Laps[Index]\nNEXT Index\nOUTPUT Sum",
      checkVars: ["Sum"], checkOutput: true
    },
    {
      id: "code-total-3", category: "code-total",
      prompt: "The array Stars holds 5 whole numbers (see Given). Write a program that adds up only the values at index 2 to 4, then outputs that total. Declare every variable you use.",
      setup: { "Stars": [5, 8, 1, 6, 9] },
      reference: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 2 TO 4\n    Total <- Total + Stars[Index]\nNEXT Index\nOUTPUT Total",
      checkVars: ["Total"], checkOutput: true
    },
    {
      id: "code-count-1", category: "code-count",
      prompt: "The array Scores holds 6 whole numbers (see Given). Write a program that counts how many values are 10 or more, then outputs the count. Use Tally for the count. Declare every variable you use.",
      setup: { "Scores": [12, 4, 10, 15, 7, 9] },
      reference: "DECLARE Tally : INTEGER\nDECLARE Index : INTEGER\nTally <- 0\nFOR Index <- 1 TO 6\n    IF Scores[Index] >= 10 THEN\n        Tally <- Tally + 1\n    ENDIF\nNEXT Index\nOUTPUT Tally",
      checkVars: ["Tally"], checkOutput: true
    },
    {
      id: "code-count-2", category: "code-count",
      prompt: "The array Ages holds 5 whole numbers (see Given). Write a program that counts how many values are less than 13, then outputs the count. Use Young for the count. Declare every variable you use.",
      setup: { "Ages": [11, 14, 12, 16, 13] },
      reference: "DECLARE Young : INTEGER\nDECLARE Index : INTEGER\nYoung <- 0\nFOR Index <- 1 TO 5\n    IF Ages[Index] < 13 THEN\n        Young <- Young + 1\n    ENDIF\nNEXT Index\nOUTPUT Young",
      checkVars: ["Young"], checkOutput: true
    },
    {
      id: "code-search-1", category: "code-search",
      prompt: "The array Points holds 5 whole numbers, and Search holds the number to look for (see Given). Write a linear search: use a BOOLEAN Found that starts as FALSE, check every value, then output \"Found\" or \"Not found\". Declare every variable you use.",
      setup: { "Points": [6, 2, 9, 4, 7], "Search": 4 },
      reference: "DECLARE Found : BOOLEAN\nDECLARE Index : INTEGER\nFound <- FALSE\nFOR Index <- 1 TO 5\n    IF Points[Index] = Search THEN\n        Found <- TRUE\n    ENDIF\nNEXT Index\nIF Found = TRUE THEN\n    OUTPUT \"Found\"\nELSE\n    OUTPUT \"Not found\"\nENDIF",
      checkVars: ["Found"], checkOutput: true
    }
  ]
});
