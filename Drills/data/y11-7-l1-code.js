// Year 11, Unit 7 L1: Write the Code
// Loaded by Drills/index.html?drill=y11-7-l1-code
DrillData.register("y11-7-l1-code", {
  title: "Year 11, Unit 7 L1: Write the Code",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  codeDrill: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["code-assign", "Writing an Assignment"],
    ["code-reassign", "Updating the Same Variable"],
    ["code-twovar", "Using Two Variables Together"],
    ["code-output", "Producing Output"]
  ],
  cards: [
    {
      id: "code-assign-1", category: "code-assign",
      prompt: "Declare Total (INTEGER) first, then write code that stores A + B in a variable called Total.",
      setup: {"A":4,"B":3},
      reference: "DECLARE Total : INTEGER\nTotal <- A + B",
      checkVars: ["Total"]
    },
    {
      id: "code-assign-2", category: "code-assign",
      prompt: "Declare Final (INTEGER) first, then write code that stores Price minus Discount in a variable called Final.",
      setup: {"Price":10,"Discount":2},
      reference: "DECLARE Final : INTEGER\nFinal <- Price - Discount",
      checkVars: ["Final"]
    },
    {
      id: "code-assign-3", category: "code-assign",
      prompt: "Declare Area (INTEGER) first, then write code that stores Length times Width in a variable called Area.",
      setup: {"Length":5,"Width":4},
      reference: "DECLARE Area : INTEGER\nArea <- Length * Width",
      checkVars: ["Area"]
    },
    {
      id: "code-assign-4", category: "code-assign",
      prompt: "Declare Average (REAL) first, then write code that stores Total divided by Count in a variable called Average.",
      setup: {"Total":20,"Count":4},
      reference: "DECLARE Average : REAL\nAverage <- Total / Count",
      checkVars: ["Average"]
    },
    {
      id: "code-reassign-1", category: "code-reassign",
      prompt: "Write one line that adds 4 to Number, storing the result back in Number.",
      setup: {"Number":6},
      reference: "Number <- Number + 4",
      checkVars: ["Number"]
    },
    {
      id: "code-reassign-2", category: "code-reassign",
      prompt: "Write one line that doubles Score, storing the result back in Score.",
      setup: {"Score":10},
      reference: "Score <- Score * 2",
      checkVars: ["Score"]
    },
    {
      id: "code-reassign-3", category: "code-reassign",
      prompt: "Write one line that subtracts 3 from Count, storing the result back in Count.",
      setup: {"Count":9},
      reference: "Count <- Count - 3",
      checkVars: ["Count"]
    },
    {
      id: "code-reassign-4", category: "code-reassign",
      prompt: "Write one line that halves Value, storing the result back in Value.",
      setup: {"Value":8},
      reference: "Value <- Value / 2",
      checkVars: ["Value"]
    },
    {
      id: "code-twovar-1", category: "code-twovar",
      prompt: "Write one line that adds First and Second together, storing the result back in First.",
      setup: {"First":8,"Second":3},
      reference: "First <- First + Second",
      checkVars: ["First"]
    },
    {
      id: "code-twovar-2", category: "code-twovar",
      prompt: "Declare Product (INTEGER) first, then write code that stores A multiplied by B in a variable called Product.",
      setup: {"A":5,"B":2},
      reference: "DECLARE Product : INTEGER\nProduct <- A * B",
      checkVars: ["Product"]
    },
    {
      id: "code-twovar-3", category: "code-twovar",
      prompt: "Declare Area (INTEGER) first, then write code that first store Width times Height in Area, then add 10 to Area.",
      setup: {"Width":6,"Height":2},
      reference: "DECLARE Area : INTEGER\nArea <- Width * Height\nArea <- Area + 10",
      checkVars: ["Area"]
    },
    {
      id: "code-twovar-4", category: "code-twovar",
      prompt: "Declare Result (INTEGER) first, then write code that first store X minus Y in Result, then double Result.",
      setup: {"X":10,"Y":4},
      reference: "DECLARE Result : INTEGER\nResult <- X - Y\nResult <- Result * 2",
      checkVars: ["Result"]
    },
    {
      id: "code-output-1", category: "code-output",
      prompt: "Write one line that outputs the value of Total.",
      setup: {"Total":15},
      reference: "OUTPUT Total",
      checkOutput: true
    },
    {
      id: "code-output-2", category: "code-output",
      prompt: "Declare Sum (INTEGER) first. Store A + B in Sum, then write a second line that outputs Sum.",
      setup: {"A":3,"B":4},
      reference: "DECLARE Sum : INTEGER\nSum <- A + B\nOUTPUT Sum",
      checkVars: ["Sum"],
      checkOutput: true
    },
    {
      id: "code-output-3", category: "code-output",
      prompt: "Declare Half (REAL) first. Halve X and store it in Half, then output Half.",
      setup: {"X":20},
      reference: "DECLARE Half : REAL\nHalf <- X / 2\nOUTPUT Half",
      checkVars: ["Half"],
      checkOutput: true
    },
    {
      id: "code-output-4", category: "code-output",
      prompt: "Declare Total (INTEGER) first. Store P times Q in Total, then output Total.",
      setup: {"P":6,"Q":2},
      reference: "DECLARE Total : INTEGER\nTotal <- P * Q\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    }
  ]
});
