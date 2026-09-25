// Year 11, Unit 7 L3: Iteration and Trace Tables
// Loaded by Drills/index.html?drill=y11-7-l3-code
DrillData.register("y11-7-l3-code", {
  title: "Year 11, Unit 7 L3: Iteration and Trace Tables",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  codeDrill: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["code-for-output", "Outputting Values from a FOR Loop"],
    ["code-for-total", "Building a Running Total"],
    ["code-for-bounds", "Choosing the Right Loop Bounds"],
    ["code-for-count", "Counting with a Loop"]
  ],
  cards: [
    {
      id: "code-for-output-1", category: "code-for-output",
      prompt: "Declare Count (INTEGER) first, then write a FOR loop that outputs every whole number from 1 to Limit, using Count as the loop variable.",
      setup: {"Limit":3},
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO Limit\nOUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-for-output-2", category: "code-for-output",
      prompt: "Declare X (INTEGER) first, then write a FOR loop that outputs every whole number from Start to End, using X as the loop variable.",
      setup: {"Start":2,"End":5},
      reference: "DECLARE X : INTEGER\nFOR X <- Start TO End\nOUTPUT X\nNEXT X",
      checkOutput: true
    },
    {
      id: "code-for-output-3", category: "code-for-output",
      prompt: "Declare Number (INTEGER) first, then write a FOR loop that outputs every whole number from 1 to Max, using Number as the loop variable.",
      setup: {"Max":4},
      reference: "DECLARE Number : INTEGER\nFOR Number <- 1 TO Max\nOUTPUT Number\nNEXT Number",
      checkOutput: true
    },
    {
      id: "code-for-output-4", category: "code-for-output",
      prompt: "Declare Item (INTEGER) first, then write a FOR loop that outputs every whole number from Low to High, using Item as the loop variable.",
      setup: {"Low":3,"High":6},
      reference: "DECLARE Item : INTEGER\nFOR Item <- Low TO High\nOUTPUT Item\nNEXT Item",
      checkOutput: true
    },
    {
      id: "code-for-total-1", category: "code-for-total",
      prompt: "Declare Total (INTEGER) and Count (INTEGER) first, then write code that adds up every whole number from 1 to Limit (the accumulator pattern: start Total at 0, add Count on every pass), then outputs Total.",
      setup: {"Limit":3},
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO Limit\nTotal <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-for-total-2", category: "code-for-total",
      prompt: "Declare Total (INTEGER) and Number (INTEGER) first, then write code that adds up every whole number from 1 to Limit using Number as the loop variable, storing the result in Total, then outputs Total.",
      setup: {"Limit":4},
      reference: "DECLARE Total : INTEGER\nDECLARE Number : INTEGER\nTotal <- 0\nFOR Number <- 1 TO Limit\nTotal <- Total + Number\nNEXT Number\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-for-total-3", category: "code-for-total",
      prompt: "Declare Total (INTEGER) and X (INTEGER) first, then write code that adds up every whole number from Start to End, storing the result in Total, then outputs Total.",
      setup: {"Start":2,"End":5},
      reference: "DECLARE Total : INTEGER\nDECLARE X : INTEGER\nTotal <- 0\nFOR X <- Start TO End\nTotal <- Total + X\nNEXT X\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-for-total-4", category: "code-for-total",
      prompt: "Declare Sum (INTEGER) and Item (INTEGER) first, then write code that adds up every whole number from 1 to Max, storing the result in Sum, then outputs Sum.",
      setup: {"Max":5},
      reference: "DECLARE Sum : INTEGER\nDECLARE Item : INTEGER\nSum <- 0\nFOR Item <- 1 TO Max\nSum <- Sum + Item\nNEXT Item\nOUTPUT Sum",
      checkVars: ["Sum"],
      checkOutput: true
    },
    {
      id: "code-for-bounds-1", category: "code-for-bounds",
      prompt: "Declare Count (INTEGER) first, then write a FOR loop that runs exactly Times times, starting at 1, outputting the loop counter each time.",
      setup: {"Times":4},
      reference: "DECLARE Count : INTEGER\nFOR Count <- 1 TO Times\nOUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-for-bounds-2", category: "code-for-bounds",
      prompt: "Declare Count (INTEGER) first, then write a FOR loop that runs exactly Times times, starting at 0, outputting the loop counter each time - get the end bound exactly right.",
      setup: {"Times":4},
      reference: "DECLARE Count : INTEGER\nFOR Count <- 0 TO Times - 1\nOUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-for-bounds-3", category: "code-for-bounds",
      prompt: "Declare Count (INTEGER) first. A loop must output the numbers from From up to (but not including) Stop. Write the FOR loop - get the end bound exactly right.",
      setup: {"From":2,"Stop":6},
      reference: "DECLARE Count : INTEGER\nFOR Count <- From TO Stop - 1\nOUTPUT Count\nNEXT Count",
      checkOutput: true
    },
    {
      id: "code-for-bounds-4", category: "code-for-bounds",
      prompt: "Declare Total (INTEGER) and Count (INTEGER) first. A loop must add up exactly Times numbers starting from 0. Write the code that stores the total in Total and outputs it - get the end bound exactly right.",
      setup: {"Times":5},
      reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 0 TO Times - 1\nTotal <- Total + Count\nNEXT Count\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-for-count-1", category: "code-for-count",
      prompt: "Declare Total (INTEGER) and Number (INTEGER) first, then write code that counts how many whole numbers there are from Start to End (inclusive), storing the count in Total, then outputs Total.",
      setup: {"Start":3,"End":7},
      reference: "DECLARE Total : INTEGER\nDECLARE Number : INTEGER\nTotal <- 0\nFOR Number <- Start TO End\nTotal <- Total + 1\nNEXT Number\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    },
    {
      id: "code-for-count-2", category: "code-for-count",
      prompt: "Declare Tally (INTEGER) and Count (INTEGER) first, then write code that counts how many whole numbers there are from 1 to Limit, storing the count in Tally, then outputs Tally.",
      setup: {"Limit":6},
      reference: "DECLARE Tally : INTEGER\nDECLARE Count : INTEGER\nTally <- 0\nFOR Count <- 1 TO Limit\nTally <- Tally + 1\nNEXT Count\nOUTPUT Tally",
      checkVars: ["Tally"],
      checkOutput: true
    },
    {
      id: "code-for-count-3", category: "code-for-count",
      prompt: "Declare Amount (INTEGER) and Item (INTEGER) first, then write code that counts how many whole numbers there are from Low to High (inclusive), storing the count in Amount, then outputs Amount.",
      setup: {"Low":2,"High":9},
      reference: "DECLARE Amount : INTEGER\nDECLARE Item : INTEGER\nAmount <- 0\nFOR Item <- Low TO High\nAmount <- Amount + 1\nNEXT Item\nOUTPUT Amount",
      checkVars: ["Amount"],
      checkOutput: true
    },
    {
      id: "code-for-count-4", category: "code-for-count",
      prompt: "Declare Total (INTEGER) and Number (INTEGER) first, then write code that counts how many whole numbers there are from 0 to Max (inclusive), storing the count in Total, then outputs Total.",
      setup: {"Max":5},
      reference: "DECLARE Total : INTEGER\nDECLARE Number : INTEGER\nTotal <- 0\nFOR Number <- 0 TO Max\nTotal <- Total + 1\nNEXT Number\nOUTPUT Total",
      checkVars: ["Total"],
      checkOutput: true
    }
  ]
});
