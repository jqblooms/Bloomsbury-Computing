// Year 11, Unit 7 L2: Selection and Trace Tables
// Loaded by Drills/index.html?drill=y11-7-l2-code
DrillData.register("y11-7-l2-code", {
  title: "Year 11, Unit 7 L2: Selection and Trace Tables",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  codeDrill: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["code-if-else", "Writing a Simple IF/ELSE"],
    ["code-if-nested", "Writing a Nested IF/ELSE"],
    ["code-if-operator", "Choosing the Right Comparison Operator"],
    ["code-if-compound", "Combining Conditions with AND/OR"]
  ],
  cards: [
    {
      id: "code-if-else-1", category: "code-if-else",
      prompt: "Declare Status (STRING) first, then write an IF/ELSE that stores \"Hot\" in Status if Temp is more than 25, otherwise stores \"Mild\".",
      setup: {"Temp":30},
      reference: "DECLARE Status : STRING\nIF Temp > 25 THEN\nStatus <- \"Hot\"\nELSE\nStatus <- \"Mild\"\nENDIF",
      checkVars: ["Status"]
    },
    {
      id: "code-if-else-2", category: "code-if-else",
      prompt: "Declare Result (STRING) first, then write an IF/ELSE that stores \"Pass\" in Result if Score is 50 or more, otherwise stores \"Fail\".",
      setup: {"Score":65},
      reference: "DECLARE Result : STRING\nIF Score >= 50 THEN\nResult <- \"Pass\"\nELSE\nResult <- \"Fail\"\nENDIF",
      checkVars: ["Result"]
    },
    {
      id: "code-if-else-3", category: "code-if-else",
      prompt: "Declare Fee (INTEGER) first, then write an IF/ELSE that stores 20 in Fee if Weight is more than 50, otherwise stores 0.",
      setup: {"Weight":55},
      reference: "DECLARE Fee : INTEGER\nIF Weight > 50 THEN\nFee <- 20\nELSE\nFee <- 0\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "code-if-else-4", category: "code-if-else",
      prompt: "Declare Fee (INTEGER) first, then write an IF/ELSE that stores 3 in Fee if Age is less than 16, otherwise stores 5.",
      setup: {"Age":12},
      reference: "DECLARE Fee : INTEGER\nIF Age < 16 THEN\nFee <- 3\nELSE\nFee <- 5\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "code-if-nested-1", category: "code-if-nested",
      prompt: "Declare Grade (STRING) first, then write nested IF/ELSE statements that store \"Distinction\" in Grade if Marks is 80 or more, \"Merit\" if Marks is 60 or more (but under 80), otherwise \"Pass\".",
      setup: {"Marks":65},
      reference: "DECLARE Grade : STRING\nIF Marks >= 80 THEN\nGrade <- \"Distinction\"\nELSE\nIF Marks >= 60 THEN\nGrade <- \"Merit\"\nELSE\nGrade <- \"Pass\"\nENDIF\nENDIF",
      checkVars: ["Grade"]
    },
    {
      id: "code-if-nested-2", category: "code-if-nested",
      prompt: "Declare Grade (STRING) first, then write nested IF/ELSE statements that store \"A\" in Grade if Score is 70 or more, \"C\" if Score is 50 or more (but under 70), otherwise \"F\".",
      setup: {"Score":72},
      reference: "DECLARE Grade : STRING\nIF Score >= 70 THEN\nGrade <- \"A\"\nELSE\nIF Score >= 50 THEN\nGrade <- \"C\"\nELSE\nGrade <- \"F\"\nENDIF\nENDIF",
      checkVars: ["Grade"]
    },
    {
      id: "code-if-nested-3", category: "code-if-nested",
      prompt: "Declare Status (STRING) first, then write nested IF/ELSE statements that store \"Cold\" in Status if Temp is less than 10, \"Mild\" if Temp is less than 25 (but at least 10), otherwise \"Hot\".",
      setup: {"Temp":15},
      reference: "DECLARE Status : STRING\nIF Temp < 10 THEN\nStatus <- \"Cold\"\nELSE\nIF Temp < 25 THEN\nStatus <- \"Mild\"\nELSE\nStatus <- \"Hot\"\nENDIF\nENDIF",
      checkVars: ["Status"]
    },
    {
      id: "code-if-nested-4", category: "code-if-nested",
      prompt: "Declare Fee (INTEGER) first, then write nested IF/ELSE statements that store 0 in Fee if Weight is 50 or less, 20 if Weight is 100 or less (but over 50), otherwise 40.",
      setup: {"Weight":75},
      reference: "DECLARE Fee : INTEGER\nIF Weight <= 50 THEN\nFee <- 0\nELSE\nIF Weight <= 100 THEN\nFee <- 20\nELSE\nFee <- 40\nENDIF\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "code-if-operator-1", category: "code-if-operator",
      prompt: "Declare Fee (INTEGER) first. A club charges Fee 5 if Age is under 16, otherwise Fee 10. Write the IF/ELSE - get the comparison exactly right.",
      setup: {"Age":20},
      reference: "DECLARE Fee : INTEGER\nIF Age < 16 THEN\nFee <- 5\nELSE\nFee <- 10\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "code-if-operator-2", category: "code-if-operator",
      prompt: "Declare Fee (INTEGER) first. A delivery company charges Fee 5 if Weight is 10 or more, otherwise Fee 0. Write the IF/ELSE - get the comparison exactly right.",
      setup: {"Weight":12},
      reference: "DECLARE Fee : INTEGER\nIF Weight >= 10 THEN\nFee <- 5\nELSE\nFee <- 0\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "code-if-operator-3", category: "code-if-operator",
      prompt: "Declare Bonus (INTEGER) first. A distinction bonus of 10 is given if Marks is more than 80, otherwise Bonus is 0. Write the IF/ELSE - get the comparison exactly right.",
      setup: {"Marks":85},
      reference: "DECLARE Bonus : INTEGER\nIF Marks > 80 THEN\nBonus <- 10\nELSE\nBonus <- 0\nENDIF",
      checkVars: ["Bonus"]
    },
    {
      id: "code-if-operator-4", category: "code-if-operator",
      prompt: "Declare ValidHigh (STRING) first. A range check needs Value to be no more than 100. Write an IF/ELSE that stores \"Yes\" in ValidHigh if Value is 100 or less, otherwise \"No\".",
      setup: {"Value":75},
      reference: "DECLARE ValidHigh : STRING\nIF Value <= 100 THEN\nValidHigh <- \"Yes\"\nELSE\nValidHigh <- \"No\"\nENDIF",
      checkVars: ["ValidHigh"]
    },
    {
      id: "code-if-compound-1", category: "code-if-compound",
      prompt: "Declare Result (STRING) first, then write an IF/ELSE that stores \"Accept\" in Result if Value is 50 or more AND Value is 100 or less, otherwise stores \"Reject\".",
      setup: {"Value":75},
      reference: "DECLARE Result : STRING\nIF Value >= 50 AND Value <= 100 THEN\nResult <- \"Accept\"\nELSE\nResult <- \"Reject\"\nENDIF",
      checkVars: ["Result"]
    },
    {
      id: "code-if-compound-2", category: "code-if-compound",
      prompt: "Declare Level (STRING) first, then write an IF/ELSE that stores \"Extreme\" in Level if Diff1 is less than 1 OR Diff2 is less than 1, otherwise stores \"Normal\".",
      setup: {"Diff1":5,"Diff2":3},
      reference: "DECLARE Level : STRING\nIF Diff1 < 1 OR Diff2 < 1 THEN\nLevel <- \"Extreme\"\nELSE\nLevel <- \"Normal\"\nENDIF",
      checkVars: ["Level"]
    },
    {
      id: "code-if-compound-3", category: "code-if-compound",
      prompt: "Declare Status (STRING) first, then write an IF/ELSE that stores \"InRange\" in Status if Marks is 40 or more AND Marks is 80 or less, otherwise stores \"OutOfRange\".",
      setup: {"Marks":60},
      reference: "DECLARE Status : STRING\nIF Marks >= 40 AND Marks <= 80 THEN\nStatus <- \"InRange\"\nELSE\nStatus <- \"OutOfRange\"\nENDIF",
      checkVars: ["Status"]
    },
    {
      id: "code-if-compound-4", category: "code-if-compound",
      prompt: "Declare Check (STRING) first, then write an IF/ELSE that stores \"OutOfBounds\" in Check if Value is less than 50 OR Value is more than 100, otherwise stores \"InBounds\".",
      setup: {"Value":30},
      reference: "DECLARE Check : STRING\nIF Value < 50 OR Value > 100 THEN\nCheck <- \"OutOfBounds\"\nELSE\nCheck <- \"InBounds\"\nENDIF",
      checkVars: ["Check"]
    }
  ]
});
