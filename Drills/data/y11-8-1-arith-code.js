// Year 11, 8.1 L3: Arithmetic Operators (Activity 2: write the lines)
// Loaded by Drills/index.html?drill=y11-8-1-arith-code
// Code cards: the student writes Cambridge pseudocode, which is run against the reference program with the given
// values (and fresh ones) and must give the same output and variables. Only DECLARE, assignment and OUTPUT, with the
// operators + - * / ^ and DIV and MOD (either DIV(A, B) or A DIV B is accepted by the engine).
DrillData.register("y11-8-1-arith-code", {
  title: "Year 11, 8.1 L3: Write the Lines",
  subtitle: "Use arithmetic operators, DIV and MOD in your own lines",
  codeDrill: true,
  categories: [
    ["code-ops", "The Five Operators"],
    ["code-div", "DIV"],
    ["code-mod", "MOD"],
    ["code-both", "DIV and MOD Together"]
  ],
  cards: [
    {
      id: "code-ops-1", category: "code-ops",
      prompt: "Declare Area (INTEGER). Set Area to Length multiplied by Width. Output Area.",
      setup: { "Length": 6, "Width": 4 },
      reference: "DECLARE Area : INTEGER\nArea <- Length * Width\nOUTPUT Area",
      checkVars: ["Area"], checkOutput: true
    },
    {
      id: "code-ops-2", category: "code-ops",
      prompt: "Declare Square (INTEGER). Set Square to Side raised to the power of 2. Output Square.",
      setup: { "Side": 5 },
      reference: "DECLARE Square : INTEGER\nSquare <- Side ^ 2\nOUTPUT Square",
      checkVars: ["Square"], checkOutput: true
    },
    {
      id: "code-ops-3", category: "code-ops",
      prompt: "Declare Half (REAL). Set Half to Total divided by 2. Output Half.",
      setup: { "Total": 9 },
      reference: "DECLARE Half : REAL\nHalf <- Total / 2\nOUTPUT Half",
      checkVars: ["Half"], checkOutput: true
    },
    {
      id: "code-div-1", category: "code-div",
      prompt: "Minutes holds a number of minutes. Declare Hours (INTEGER). Use DIV to set Hours to the number of whole hours in Minutes (60 minutes in an hour). Output Hours.",
      setup: { "Minutes": 150 },
      reference: "DECLARE Hours : INTEGER\nHours <- DIV(Minutes, 60)\nOUTPUT Hours",
      checkVars: ["Hours"], checkOutput: true
    },
    {
      id: "code-div-2", category: "code-div",
      prompt: "Sweets go into bags of Size. Declare Bags (INTEGER). Use DIV to set Bags to the number of full bags. Output Bags.",
      setup: { "Sweets": 17, "Size": 5 },
      reference: "DECLARE Bags : INTEGER\nBags <- DIV(Sweets, Size)\nOUTPUT Bags",
      checkVars: ["Bags"], checkOutput: true
    },
    {
      id: "code-mod-1", category: "code-mod",
      prompt: "Minutes holds a number of minutes. Declare Mins (INTEGER). Use MOD to set Mins to the minutes left over after the whole hours (60 minutes in an hour). Output Mins.",
      setup: { "Minutes": 150 },
      reference: "DECLARE Mins : INTEGER\nMins <- MOD(Minutes, 60)\nOUTPUT Mins",
      checkVars: ["Mins"], checkOutput: true
    },
    {
      id: "code-mod-2", category: "code-mod",
      prompt: "Declare LastDigit (INTEGER). Use MOD to set LastDigit to the remainder when Number is divided by 10. Output LastDigit.",
      setup: { "Number": 47 },
      reference: "DECLARE LastDigit : INTEGER\nLastDigit <- MOD(Number, 10)\nOUTPUT LastDigit",
      checkVars: ["LastDigit"], checkOutput: true
    },
    {
      id: "code-both-1", category: "code-both",
      prompt: "Sweets go into bags of Size. Declare Bags (INTEGER) and Left (INTEGER). Set Bags to the number of full bags and Left to the sweets left over. Output Bags, then output Left.",
      setup: { "Sweets": 23, "Size": 5 },
      reference: "DECLARE Bags : INTEGER\nDECLARE Left : INTEGER\nBags <- DIV(Sweets, Size)\nLeft <- MOD(Sweets, Size)\nOUTPUT Bags\nOUTPUT Left",
      checkVars: ["Bags", "Left"], checkOutput: true
    },
    {
      id: "code-both-2", category: "code-both",
      prompt: "Number holds a whole number. Declare Tens (INTEGER) and Units (INTEGER). Set Tens to DIV of Number by 10 and Units to MOD of Number by 10. Output Tens, then output Units.",
      setup: { "Number": 47 },
      reference: "DECLARE Tens : INTEGER\nDECLARE Units : INTEGER\nTens <- DIV(Number, 10)\nUnits <- MOD(Number, 10)\nOUTPUT Tens\nOUTPUT Units",
      checkVars: ["Tens", "Units"], checkOutput: true
    }
  ]
});
