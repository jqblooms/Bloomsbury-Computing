// Year 11, 8.1 L4: Relational and Logical Operators (Activity 2: write the IF)
// Loaded by Drills/index.html?drill=y11-8-1-ops-code
// Code cards: the student writes Cambridge pseudocode, which is run against the reference program with fresh values
// and must give the same output and variables. Each program is IF ... THEN ... ELSE ... ENDIF with one relational
// operator or two joined by AND or OR. Fresh values are drawn from 1 to twice the given value (at least 10), so each
// condition sits near the middle of that range: both the THEN and the ELSE part come up often, and an answer that
// skips the IF does not keep passing.
DrillData.register("y11-8-1-ops-code", {
  title: "Year 11, 8.1 L4: Write the IF",
  subtitle: "Use relational and logical operators in your own IF statements",
  codeDrill: true,
  categories: [
    ["code-rel", "Relational Operators"],
    ["code-line", "The Value on the Line"],
    ["code-and", "AND"],
    ["code-or", "OR"]
  ],
  cards: [
    {
      id: "code-rel-1", category: "code-rel",
      prompt: "Temp holds a temperature. If Temp is less than 15, output \"Cold\". Otherwise output \"Warm\".",
      setup: { "Temp": 15 },
      reference: "IF Temp < 15 THEN\n  OUTPUT \"Cold\"\nELSE\n  OUTPUT \"Warm\"\nENDIF",
      checkVars: [], checkOutput: true
    },
    {
      id: "code-rel-2", category: "code-rel",
      prompt: "Points holds a number of points. If Points is greater than 30, output \"Winner\". Otherwise output \"Keep going\".",
      setup: { "Points": 30 },
      reference: "IF Points > 30 THEN\n  OUTPUT \"Winner\"\nELSE\n  OUTPUT \"Keep going\"\nENDIF",
      checkVars: [], checkOutput: true
    },
    {
      id: "code-line-1", category: "code-line",
      prompt: "Score holds a score. Declare Message (STRING). If Score is 5 or more, set Message to \"Level up\". Otherwise set Message to \"Try again\". Output Message.",
      setup: { "Score": 5 },
      reference: "DECLARE Message : STRING\nIF Score >= 5 THEN\n  Message <- \"Level up\"\nELSE\n  Message <- \"Try again\"\nENDIF\nOUTPUT Message",
      checkVars: ["Message"], checkOutput: true
    },
    {
      id: "code-line-2", category: "code-line",
      prompt: "Age holds an age. If Age is 4 or less, output \"Free\". Otherwise output \"Pay\".",
      setup: { "Age": 4 },
      reference: "IF Age <= 4 THEN\n  OUTPUT \"Free\"\nELSE\n  OUTPUT \"Pay\"\nENDIF",
      checkVars: [], checkOutput: true
    },
    {
      id: "code-and-1", category: "code-and",
      prompt: "Age holds an age. If Age is 13 or more AND Age is 19 or less, output \"Teen\". Otherwise output \"Not teen\".",
      setup: { "Age": 10 },
      reference: "IF Age >= 13 AND Age <= 19 THEN\n  OUTPUT \"Teen\"\nELSE\n  OUTPUT \"Not teen\"\nENDIF",
      checkVars: [], checkOutput: true
    },
    {
      id: "code-and-2", category: "code-and",
      prompt: "Mark holds a mark. Declare Valid (BOOLEAN). If Mark is 1 or more AND Mark is 10 or less, set Valid to TRUE. Otherwise set Valid to FALSE.",
      setup: { "Mark": 10 },
      reference: "DECLARE Valid : BOOLEAN\nIF Mark >= 1 AND Mark <= 10 THEN\n  Valid <- TRUE\nELSE\n  Valid <- FALSE\nENDIF",
      checkVars: ["Valid"], checkOutput: true
    },
    {
      id: "code-or-1", category: "code-or",
      prompt: "Speed holds a speed. If Speed is less than 3 OR Speed is greater than 8, output \"Warning\". Otherwise output \"OK\".",
      setup: { "Speed": 5 },
      reference: "IF Speed < 3 OR Speed > 8 THEN\n  OUTPUT \"Warning\"\nELSE\n  OUTPUT \"OK\"\nENDIF",
      checkVars: [], checkOutput: true
    },
    {
      id: "code-or-2", category: "code-or",
      prompt: "Lives holds the number of lives and Time holds the seconds left. If Lives is less than 3 OR Time is less than 3, output \"Hurry\". Otherwise output \"Play\".",
      setup: { "Lives": 5, "Time": 5 },
      reference: "IF Lives < 3 OR Time < 3 THEN\n  OUTPUT \"Hurry\"\nELSE\n  OUTPUT \"Play\"\nENDIF",
      checkVars: [], checkOutput: true
    }
  ]
});
