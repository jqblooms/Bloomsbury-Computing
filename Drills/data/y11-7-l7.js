// Year 11, Unit 7 L7: Recap - Sequence, Selection and Iteration
// Loaded by Drills/index.html?drill=y11-7-l7
DrillData.register("y11-7-l7", {
  title: "Year 11, Unit 7 L7: Recap - Sequence, Selection and Iteration",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  codeDrill: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["l7-sequence", "Sequence"],
    ["l7-selection", "Selection"],
    ["l7-iteration", "Iteration"],
    ["l7-write", "Writing a Full Algorithm"]
  ],
  cards: [
    {
      id: "l7-seq-1", category: "l7-sequence",
      prompt: "Declare Total (INTEGER) first, then write code that stores A plus double B in a variable called Total.",
      setup: {"A":3,"B":4},
      reference: "DECLARE Total : INTEGER\nTotal <- A + B * 2",
      checkVars: ["Total"]
    },
    {
      id: "l7-seq-2", category: "l7-sequence",
      prompt: "Declare Result (REAL) first, then write code that stores the average of X and Y in a variable called Result.",
      setup: {"X":10,"Y":4},
      reference: "DECLARE Result : REAL\nResult <- (X + Y) / 2",
      checkVars: ["Result"]
    },
    {
      id: "l7-seq-3", category: "l7-sequence",
      prompt: "Declare Remainder (INTEGER) first, then write code that stores the remainder when Total is divided by Size in Remainder.",
      setup: {"Total":17,"Size":5},
      reference: "DECLARE Remainder : INTEGER\nRemainder <- Total MOD Size",
      checkVars: ["Remainder"]
    },
    {
      id: "l7-seq-4", category: "l7-sequence",
      prompt: "Write one line that increases Score by Bonus, storing the result back in Score.",
      setup: {"Score":50,"Bonus":15},
      reference: "Score <- Score + Bonus",
      checkVars: ["Score"]
    },
    {
      id: "l7-seq-5", category: "l7-sequence",
      prompt: "Declare Area (INTEGER) first, then write code that stores Width times Height in Area, then outputs it.",
      setup: {"Width":6,"Height":3},
      reference: "DECLARE Area : INTEGER\nArea <- Width * Height\nOUTPUT Area",
      checkVars: ["Area"],
      checkOutput: true
    },
    {
      id: "l7-sel-1", category: "l7-selection",
      prompt: "Declare Grade (STRING) first, then write an IF/ELSE that stores \"Pass\" in Grade if Mark is 50 or more, otherwise stores \"Fail\".",
      setup: {"Mark":72},
      reference: "DECLARE Grade : STRING\nIF Mark >= 50 THEN\nGrade <- \"Pass\"\nELSE\nGrade <- \"Fail\"\nENDIF",
      checkVars: ["Grade"]
    },
    {
      id: "l7-sel-2", category: "l7-selection",
      prompt: "Declare Grade (STRING) first, then write an IF/ELSE that stores \"Pass\" in Grade if Mark is 50 or more, otherwise stores \"Fail\".",
      setup: {"Mark":40},
      reference: "DECLARE Grade : STRING\nIF Mark >= 50 THEN\nGrade <- \"Pass\"\nELSE\nGrade <- \"Fail\"\nENDIF",
      checkVars: ["Grade"]
    },
    {
      id: "l7-sel-3", category: "l7-selection",
      prompt: "Declare Fee (INTEGER) first, then write an IF/ELSE that stores 7 in Fee if Age is under 12, otherwise stores 12.",
      setup: {"Age":9},
      reference: "DECLARE Fee : INTEGER\nIF Age < 12 THEN\nFee <- 7\nELSE\nFee <- 12\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "l7-sel-4", category: "l7-selection",
      prompt: "Declare Fee (INTEGER) first, then write an IF/ELSE that stores 7 in Fee if Age is under 12, otherwise stores 12.",
      setup: {"Age":15},
      reference: "DECLARE Fee : INTEGER\nIF Age < 12 THEN\nFee <- 7\nELSE\nFee <- 12\nENDIF",
      checkVars: ["Fee"]
    },
    {
      id: "l7-sel-5", category: "l7-selection",
      prompt: "Declare Total (INTEGER) first, then write an IF/ELSE that stores Price times ItemCount minus 5 in Total if ItemCount is 10 or more, otherwise stores Price times ItemCount with no discount.",
      setup: {"Price":2,"ItemCount":12},
      reference: "DECLARE Total : INTEGER\nIF ItemCount >= 10 THEN\nTotal <- Price * ItemCount - 5\nELSE\nTotal <- Price * ItemCount\nENDIF",
      checkVars: ["Total"]
    },
    {
      id: "l7-iter-1", category: "l7-iteration",
      prompt: "Declare Total (INTEGER) and Count (INTEGER) first. Total starts at 0. Write a FOR loop that adds every whole number from 1 to N onto Total, then outputs Total.",
      setup: {"N":5},
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO N\nTotal <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "l7-iter-2", category: "l7-iteration",
      prompt: "Declare Product (INTEGER) and I (INTEGER) first. Product starts at 1. Write a FOR loop that doubles Product once for every value from 1 to N, then outputs Product.",
      setup: {"N":4},
      reference: "DECLARE Product : INTEGER\nDECLARE I : INTEGER\nProduct <- 1\nFOR I <- 1 TO N\nProduct <- Product * 2\nNEXT I\nOUTPUT Product",
      checkVars: ["Product"],
      checkOutput: true
    },
    {
      id: "l7-iter-3", category: "l7-iteration",
      prompt: "Declare Count (INTEGER) first, set it to 0. Write a WHILE loop that adds 1 to Count while Count is less than Limit, then outputs Count.",
      setup: {"Limit":6},
      reference: "DECLARE Count : INTEGER\nCount <- 0\nWHILE Count < Limit DO\nCount <- Count + 1\nENDWHILE\nOUTPUT Count",
      checkVars: ["Count"],
      checkOutput: true
    },
    {
      id: "l7-iter-4", category: "l7-iteration",
      prompt: "Declare Total (INTEGER) first, set it to Start. Write a WHILE loop that subtracts 1 from Total while Total is greater than 0, then outputs Total.",
      setup: {"Start":3},
      reference: "DECLARE Total : INTEGER\nTotal <- Start\nWHILE Total > 0 DO\nTotal <- Total - 1\nENDWHILE\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "l7-iter-5", category: "l7-iteration",
      prompt: "Declare Factorial (INTEGER) and I (INTEGER) first. Factorial starts at 1. Write a FOR loop that multiplies Factorial by every value from 1 to N, then outputs Factorial.",
      setup: {"N":5},
      reference: "DECLARE Factorial : INTEGER\nDECLARE I : INTEGER\nFactorial <- 1\nFOR I <- 1 TO N\nFactorial <- Factorial * I\nNEXT I\nOUTPUT Factorial",
      checkVars: ["Factorial"],
      checkOutput: true
    },
    {
      id: "l7-write-1", category: "l7-write",
      prompt: "Declare EvenCount (INTEGER) and I (INTEGER) first, set EvenCount to 0. Write a FOR loop from 1 to N that adds 1 to EvenCount only when I is even (use MOD), then outputs EvenCount.",
      setup: {"N":10},
      reference: "DECLARE EvenCount : INTEGER\nDECLARE I : INTEGER\nEvenCount <- 0\nFOR I <- 1 TO N\nIF I MOD 2 = 0 THEN\nEvenCount <- EvenCount + 1\nENDIF\nNEXT I\nOUTPUT EvenCount",
      checkVars: ["EvenCount"],
      checkOutput: true
    },
    {
      id: "l7-write-2", category: "l7-write",
      prompt: "Declare Total (INTEGER) and Count (INTEGER) first, set Total to 0. Write a FOR loop that adds Price to Total once for each of ItemCount items. If Total reaches Threshold or more, subtract Discount from Total. Output Total.",
      setup: {"Price":4,"ItemCount":6,"Threshold":20,"Discount":3},
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO ItemCount\nTotal <- Total + Price\nNEXT Count\nIF Total >= Threshold THEN\nTotal <- Total - Discount\nENDIF\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "l7-write-3", category: "l7-write",
      prompt: "Declare Guess (INTEGER) and Attempts (INTEGER) first. Guess starts at StartGuess, Attempts starts at 0. Write a WHILE loop that adds Step to Guess and 1 to Attempts while Guess is less than Target. Output Attempts.",
      setup: {"StartGuess":0,"Target":12,"Step":3},
      reference: "DECLARE Guess : INTEGER\nDECLARE Attempts : INTEGER\nGuess <- StartGuess\nAttempts <- 0\nWHILE Guess < Target DO\nGuess <- Guess + Step\nAttempts <- Attempts + 1\nENDWHILE\nOUTPUT Attempts",
      checkVars: ["Attempts"],
      checkOutput: true
    },
    {
      id: "l7-write-4", category: "l7-write",
      prompt: "Declare Count (INTEGER) and Value (INTEGER) first, set Count to 0. Write a FOR loop from Low to High that adds 1 to Count whenever Value divides exactly by Divisor (use MOD). Output Count.",
      setup: {"Low":1,"High":20,"Divisor":5},
      reference: "DECLARE Count : INTEGER\nDECLARE Value : INTEGER\nCount <- 0\nFOR Value <- Low TO High\nIF Value MOD Divisor = 0 THEN\nCount <- Count + 1\nENDIF\nNEXT Value\nOUTPUT Count",
      checkVars: ["Count"],
      checkOutput: true
    },
    {
      id: "l7-write-5", category: "l7-write",
      prompt: "Declare Total (INTEGER) first, set it to 0. Write a WHILE loop that adds Step to Total while Total is less than Target. Output Total.",
      setup: {"Step":7,"Target":20},
      reference: "DECLARE Total : INTEGER\nTotal <- 0\nWHILE Total < Target DO\nTotal <- Total + Step\nENDWHILE\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    }
  ]
});
