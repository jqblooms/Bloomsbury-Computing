// Year 11: Finding Errors, Tracing and Functions
// Loaded by Drills/index.html?drill=y11-p2-reading
DrillData.register("y11-p2-reading", {
  title: "Year 11: Finding Errors, Tracing and Functions",
  subtitle: "Cambridge IGCSE Computer Science 0478 - Paper 2",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["y11errors", "Finding Errors in Pseudocode"],
    ["y11trace", "Tracing and Calculating"],
    ["y11dev", "Program Development"]
  ],
  cards: [
    {
      id: "err-input", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nOUTPUT \"Enter a first name \"\nOUTPUT FirstName",
      answers: ["The second line should be INPUT FirstName"],
      keywords: [{ required: [["input"]], optional: ["second", "2", "firstname", "last", "output"], need: 1, excluded: ["first", "declare"] }],
      distractors: ["The first line should be INPUT", "FirstName needs quote marks", "OUTPUT should be spelt OUTPUT:", "Nothing is wrong", "The second line should use DECLARE"],
      note: "To collect something from the user use INPUT. OUTPUT displays a value, so the program would print an empty variable and never ask."
    },
    {
      id: "err-caseof", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nCASE OF AccountID = Accounts[Row, 1]\n   THEN\n      OUTPUT Accounts[Row, 2]\nENDIF",
      answers: ["CASE OF should be IF"],
      distractors: ["THEN should be ELSE", "ENDIF should be ENDWHILE", "OUTPUT should be INPUT", "Accounts should be a string", "Nothing is wrong"],
      note: "A single condition with THEN and ENDIF is an IF statement. CASE OF is a different structure for choosing between many values."
    },
    {
      id: "err-total", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nTotal <- 0\nFOR Count <- 1 TO 10\n   INPUT Number\n   Total <- Total + 1\nNEXT Count",
      answers: ["Total <- Total + 1 should add Number"],
      keywords: [{ required: [["number"]], optional: ["add", "total", "plus", "instead"], need: 1, excluded: ["next", "start", "while"] }],
      distractors: ["Total should start at 1", "NEXT Count should be NEXT Number", "INPUT should be OUTPUT", "FOR should be WHILE", "Nothing is wrong"],
      note: "Adding 1 each pass counts the loop; a running total must add the value: Total <- Total + Number."
    },
    {
      id: "err-bound", category: "y11errors",
      prompt: "What is the error in this pseudocode?\n// 5-digit number, one digit at a time\nFOR Count <- 1 TO 10\n   INPUT Digit\nNEXT Count",
      answers: ["The loop should end at 5, not 10"],
      distractors: ["The loop should start at 0", "INPUT should be OUTPUT", "Count needs quote marks", "NEXT Count should be ENDFOR", "Nothing is wrong"],
      note: "Five digits need five passes, so the final value must be 5."
    },
    {
      id: "err-operator", category: "y11errors",
      prompt: "What is the error in this pseudocode?\n// check digit: each digit multiplied by its position\nTotal <- Total + (Digit / Count)",
      answers: ["The / should be *"],
      keywords: [/\/\s*(should\s*be|to|with|by|into|becomes?|->)\s*(an?\s*)?\*/i, /\*\s*(instead\s*of|not)\s*(an?\s*)?\//i, { required: [["multiply", "multiplication", "multiplied", "time"]], excluded: ["plus", "minus", "add", "subtract", "bracket"] }],
      distractors: ["The + should be -", "Digit should be Total", "The brackets should be removed", "Count should be 10", "Nothing is wrong"],
      note: "'Multiplied by its position' means Digit * Count. Read the description carefully and compare the operator with it."
    },
    {
      id: "err-type", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nDECLARE Average : INTEGER\nAverage <- Total / Counter",
      answers: ["Average should be declared as REAL"],
      keywords: [{ required: [["real"]], excluded: ["boolean", "string"] }],
      distractors: ["Total should be a string", "The / should be DIV", "Average should be BOOLEAN", "There should be no DECLARE", "Nothing is wrong"],
      note: "An average usually has a decimal part, and INTEGER cannot store one. Use REAL."
    },
    {
      id: "err-nextvar", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nFOR Row <- 1 TO 200\n   OUTPUT Names[Row, 1]\nNEXT Column",
      answers: ["NEXT should be followed by Row"],
      distractors: ["FOR should end at 199", "OUTPUT should be INPUT", "Names should be a string", "Column should be declared", "Nothing is wrong"],
      note: "The variable after NEXT must be the same as the FOR loop variable."
    },
    {
      id: "err-index", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nFOR Row <- 1 TO 1000\n   IF AccountID = Accounts[Row, 1]\n      THEN\n         OUTPUT Accounts[1, 2]\n      ENDIF\nNEXT Row",
      answers: ["Accounts[1, 2] should be Accounts[Row, 2]"],
      keywords: [/\[\s*1\s*,\s*2\s*\][^[]*\[\s*row\s*,\s*2\s*\]/i, /\[\s*row\s*,\s*2\s*\]\s*(instead\s*of|not)\s*(accounts\s*)?\[\s*1\s*,\s*2\s*\]/i, /\b1\s*should\s*be\s*row\b/i],
      distractors: ["Accounts[Row, 1] should be Accounts[1, 1]", "FOR should start at 0", "OUTPUT should be INPUT", "ENDIF should be NEXT", "Nothing is wrong"],
      note: "The 1 is a fixed row, so the output is always the first customer's name. Using Row gives the name from the row that matched."
    },
    {
      id: "err-mod", category: "y11errors",
      prompt: "What is the error in this pseudocode?\n// seconds left over after removing whole minutes\nSeconds <- DIV(TotalSeconds, 60)",
      answers: ["It should use MOD, not DIV"],
      distractors: ["It should use ROUND", "TotalSeconds should be 60", "Seconds should be REAL", "The comment is wrong", "Nothing is wrong"],
      note: "DIV gives whole minutes. The seconds left over are the remainder, which is MOD."
    },
    {
      id: "err-until", category: "y11errors",
      prompt: "What is the error in this pseudocode?\nREPEAT\n   INPUT Guess\nNEXT Guess = 7",
      answers: ["NEXT should be UNTIL"],
      distractors: ["REPEAT should be WHILE", "INPUT should be OUTPUT", "7 should be a string", "Guess should be a CHAR", "Nothing is wrong"],
      note: "A REPEAT loop is closed with UNTIL and a condition."
    },
    {
      id: "trace-sum", category: "y11trace",
      prompt: "What is output by this pseudocode?\nTotal <- 0\nFOR Count <- 1 TO 4\n   Total <- Total + Count\nNEXT Count\nOUTPUT Total",
      answers: ["10"],
      distractors: ["4", "6", "24", "1234", "0", "8"],
      note: "1 + 2 + 3 + 4 = 10."
    },
    {
      id: "trace-divmod", category: "y11trace",
      prompt: "What is output by this pseudocode?\nX <- 17\nOUTPUT X DIV 5, X MOD 5",
      answers: ["3 2"],
      distractors: ["3.4", "2 3", "5 17", "3 5", "17 5", "0 3"],
      note: "17 DIV 5 = 3 and 17 MOD 5 = 2."
    },
    {
      id: "trace-while", category: "y11trace",
      prompt: "What is output by this pseudocode?\nCount <- 0\nWHILE Count < 3 DO\n   Count <- Count + 1\nENDWHILE\nOUTPUT Count",
      answers: ["3"],
      distractors: ["0", "1", "2", "4", "5"],
      note: "The loop adds 1 until Count is 3, then the condition is FALSE and it stops."
    },
    {
      id: "trace-repeat", category: "y11trace",
      prompt: "What is output by this pseudocode?\nN <- 10\nREPEAT\n   N <- N - 3\nUNTIL N < 0\nOUTPUT N",
      answers: ["-2"],
      distractors: ["1", "-3", "0", "10", "-1", "7"],
      note: "N goes 7, 4, 1, -2. At -2 the condition N < 0 is TRUE so it stops and outputs -2."
    },
    {
      id: "trace-whilenever", category: "y11trace",
      prompt: "What is output by this pseudocode?\nN <- 10\nWHILE N < 5 DO\n   N <- N + 1\nENDWHILE\nOUTPUT N",
      answers: ["10"],
      distractors: ["5", "6", "0", "4", "Nothing is output"],
      note: "The condition is FALSE the first time, so the loop never runs and N is still 10."
    },
    {
      id: "trace-max", category: "y11trace",
      prompt: "What is output by this pseudocode?\n// Values[1] = 4, Values[2] = 9, Values[3] = 2\nMax <- Values[1]\nFOR Index <- 2 TO 3\n   IF Values[Index] > Max\n      THEN\n         Max <- Values[Index]\n      ENDIF\nNEXT Index\nOUTPUT Max",
      answers: ["9"],
      distractors: ["4", "2", "15", "3", "1"],
      note: "Max starts as 4, becomes 9 at index 2, and 2 is not bigger, so 9 is output."
    },
    {
      id: "trace-count", category: "y11trace",
      prompt: "What is output by this pseudocode?\n// Marks: 40, 65, 72, 30, 88\nPasses <- 0\nFOR Index <- 1 TO 5\n   IF Marks[Index] >= 50\n      THEN\n         Passes <- Passes + 1\n      ENDIF\nNEXT Index\nOUTPUT Passes",
      answers: ["3"],
      distractors: ["2", "4", "5", "295", "1"],
      note: "65, 72 and 88 are 50 or more, so Passes counts 3."
    },
    {
      id: "trace-string", category: "y11trace",
      prompt: "What is output by this pseudocode?\nWord <- \"computer\"\nOUTPUT LENGTH(Word), SUBSTRING(Word, 1, 3)",
      answers: ["8 com"],
      distractors: ["7 com", "8 mpu", "3 com", "com 8", "8 comp", "8 put"],
      note: "computer has 8 letters; the first three are com."
    },
    {
      id: "trace-checkdigit", category: "y11trace",
      prompt: "What is output by this pseudocode?\n// digits 1, 2, 3, 4, 5 in positions 1 to 5\nTotal <- 0\nFOR Count <- 1 TO 5\n   Total <- Total + (Digit[Count] * Count)\nNEXT Count\nOUTPUT Total MOD 11",
      answers: ["0"],
      distractors: ["55", "5", "1", "11", "10", "4"],
      note: "The total is 1 + 4 + 9 + 16 + 25 = 55 and 55 MOD 11 = 0."
    },
    {
      id: "trace-flag", category: "y11trace",
      prompt: "What is output by this pseudocode?\nFound <- FALSE\nFOR Index <- 1 TO 3\n   IF Names[Index] = \"Ann\" // Names are Bo, Ann, Cy\n      THEN\n         Found <- TRUE\n      ENDIF\nNEXT Index\nOUTPUT Found",
      answers: ["TRUE"],
      distractors: ["FALSE", "Ann", "2", "3", "Index"],
      note: "Ann is in the array, so Found is set to TRUE, and it stays TRUE."
    },
    {
      id: "trace-bubble", category: "y11trace",
      prompt: "What order is the array in after one pass?\n// Array holds 5, 2, 8, 1. One pass of a bubble sort (compare neighbours, swap if the left is bigger)",
      answers: ["2, 5, 1, 8"],
      distractors: ["1, 2, 5, 8", "2, 5, 8, 1", "5, 2, 8, 1", "8, 5, 2, 1", "2, 1, 5, 8"],
      note: "5 and 2 swap (2, 5, 8, 1). 5 and 8 stay. 8 and 1 swap: 2, 5, 1, 8. One pass is not enough to fully sort; the biggest value has reached the end."
    },
    {
      id: "trace-purpose", category: "y11trace",
      prompt: "What is a trace table used for?",
      answers: ["To record the value of each variable step by step as an algorithm runs"],
      distractors: ["To store the test data", "To draw a flowchart", "To check the syntax of the code", "To speed up the program", "To list the users of the program"],
      note: "Work through the algorithm one statement at a time and write each variable's new value in its column. It helps find logic errors."
    },
    {
      id: "trace-search", category: "y11trace",
      prompt: "A linear search looks for a name in an array. What does it do?",
      answers: ["Checks each element in turn until it finds the value or reaches the end"],
      distractors: ["Splits the array in half each time", "Swaps neighbours until sorted", "Adds up every element", "Counts the elements", "Only checks the first element"],
      note: "Linear search compares each element with the value being looked for. Using a Found flag lets the program say whether it was found."
    },
    {
      id: "sub-func", category: "y11dev",
      prompt: "What is the main difference between a function and a procedure?",
      answers: ["A function returns a value; a procedure does not"],
      keywords: [/\bfunctions?\b(?:(?!\b(?:not|doesn'?t|never|cannot|can'?t)\b)[^;.,])*?\breturns?\b/i],
      distractors: ["A procedure returns a value; a function does not", "A function cannot have parameters", "A procedure must be written first", "A function only works with strings", "There is no difference"],
      note: "Functions end with RETURN and give a value back to be used; procedures just carry out a set of statements."
    },
    {
      id: "sub-keyword", category: "y11dev",
      prompt: "Which keyword sends a value back from a function?",
      answers: ["RETURN"],
      distractors: ["OUTPUT", "CALL", "ENDFUNCTION", "PROCEDURE", "PARAMETER"],
      note: "RETURN gives the result back to the code that called the function. ENDFUNCTION only marks the end."
    },
    {
      id: "sub-call", category: "y11dev",
      prompt: "Which keyword is used to run a procedure?",
      answers: ["CALL"],
      distractors: ["RETURN", "RUN", "FUNCTION", "ENDPROCEDURE", "START"],
      note: "CALL Time(500) runs the procedure Time. A function is used inside an expression, for example Value <- Power(A, B)."
    },
    {
      id: "sub-param", category: "y11dev",
      prompt: "What is a parameter?",
      answers: ["A value passed into a procedure or function when it is called"],
      distractors: ["A value stored in a file", "The result returned by a function", "A type of loop", "A mistake in the code", "A comment"],
      note: "In PROCEDURE Time(TotalSeconds), TotalSeconds is a parameter. Its value is given by the call: CALL Time(500)."
    },
    {
      id: "sub-trace", category: "y11dev",
      prompt: "What is output?\nFUNCTION Double(N : INTEGER) RETURNS INTEGER\n   RETURN N * 2\nENDFUNCTION\nOUTPUT Double(6)",
      answers: ["12"],
      distractors: ["6", "3", "Double", "2", "8", "N * 2"],
      note: "The parameter N is 6, so the function returns 6 * 2 = 12."
    },
    {
      id: "sub-time", category: "y11dev",
      prompt: "PROCEDURE Time(TotalSeconds) outputs the minutes and seconds. What is output by CALL Time(500)?",
      answers: ["8 minutes 20 seconds"],
      keywords: [/\b8\s*(minutes?|mins?|m)\b[^0-9]*\b20\s*(seconds?|secs?|s)\b/i, /\b8\s*:\s*20\b/],
      distractors: ["8 minutes 0 seconds", "9 minutes 20 seconds", "500 minutes 0 seconds", "20 minutes 8 seconds", "8 minutes 33 seconds"],
      note: "Minutes are 500 DIV 60 = 8 and seconds are 500 MOD 60 = 20."
    }
  ]
});
