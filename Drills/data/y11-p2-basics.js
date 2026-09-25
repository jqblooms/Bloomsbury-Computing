// Year 11: Data Types, Operators, Strings, Files and Arrays
// Loaded by Drills/index.html?drill=y11-p2-basics
DrillData.register("y11-p2-basics", {
  title: "Year 11: Data Types, Operators, Strings, Files and Arrays",
  subtitle: "Cambridge IGCSE Computer Science 0478 - Paper 2",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["y11types", "Data Types"],
    ["y11ops", "Operators and Iteration"],
    ["y11strings", "Strings, Files and Arrays"]
  ],
  cards: [
    {
      id: "type-age", category: "y11types",
      prompt: "Which data type would you use for Age, a whole number such as 16?",
      answers: ["INTEGER"],
      distractors: ["REAL", "BOOLEAN", "CHAR", "STRING", "ARRAY"],
      note: "Whole numbers with no decimal part are INTEGER."
    },
    {
      id: "type-price", category: "y11types",
      prompt: "Which data type would you use for a price such as 9.99?",
      answers: ["REAL"],
      distractors: ["INTEGER", "BOOLEAN", "CHAR", "STRING", "ARRAY"],
      note: "Numbers with a decimal part are REAL."
    },
    {
      id: "type-pass", category: "y11types",
      prompt: "Which data type would you use for a value that is only ever TRUE or FALSE?",
      answers: ["BOOLEAN"],
      distractors: ["INTEGER", "REAL", "CHAR", "STRING", "ARRAY"],
      note: "Two possible values, TRUE or FALSE, is BOOLEAN."
    },
    {
      id: "type-initial", category: "y11types",
      prompt: "Which data type would you use for a single letter such as 'K'?",
      answers: ["CHAR"],
      distractors: ["INTEGER", "REAL", "BOOLEAN", "STRING", "ARRAY"],
      note: "One single character is CHAR."
    },
    {
      id: "type-name", category: "y11types",
      prompt: "Which data type would you use for a name such as Priya?",
      answers: ["STRING"],
      distractors: ["INTEGER", "REAL", "BOOLEAN", "CHAR", "ARRAY"],
      note: "Text made of several characters is STRING."
    },
    {
      id: "type-mix", category: "y11types",
      prompt: "Which data type would you use for a value made of letters and numbers, such as AB12?",
      answers: ["STRING"],
      distractors: ["INTEGER", "REAL", "BOOLEAN", "CHAR", "ARRAY"],
      note: "Letters and digits together are stored as text (STRING)."
    },
    {
      id: "type-phone", category: "y11types",
      prompt: "Which data type is best for a phone number such as 07700 900123?",
      answers: ["STRING"],
      distractors: ["INTEGER", "REAL", "BOOLEAN", "CHAR", "ARRAY"],
      note: "You never do arithmetic on a phone number, and an INTEGER would drop the leading 0, so it is stored as STRING."
    },
    {
      id: "type-teen", category: "y11types",
      prompt: "A variable Teenager holds TRUE if a student is aged 13 to 19. Which data type?",
      answers: ["BOOLEAN"],
      distractors: ["INTEGER", "REAL", "CHAR", "STRING", "ARRAY"],
      note: "The answer to a yes/no question is BOOLEAN."
    },
    {
      id: "dbtype-dist", category: "y11types",
      prompt: "A database field Distance stores a whole number of metres, for example 1500. Which data type?",
      answers: ["Integer"],
      distractors: ["Text", "Character", "Boolean", "Real", "Date/Time"],
      note: "A whole number is Integer."
    },
    {
      id: "dbtype-date", category: "y11types",
      prompt: "A database field DateReceived stores 03/03/2025. Which data type?",
      answers: ["Date/Time"],
      distractors: ["Text", "Character", "Boolean", "Integer", "Real"],
      note: "Dates are stored as Date/Time."
    },
    {
      id: "dbtype-stock", category: "y11types",
      prompt: "A database field InStock stores whether a part is in stock (yes or no). Which data type?",
      answers: ["Boolean"],
      distractors: ["Text", "Character", "Integer", "Real", "Date/Time"],
      note: "Yes/no is Boolean."
    },
    {
      id: "dbtype-colour", category: "y11types",
      prompt: "A database field Colour stores a single letter code such as R. Which data type?",
      answers: ["Character"],
      distractors: ["Text", "Boolean", "Integer", "Real", "Date/Time"],
      note: "One letter is Character."
    },
    {
      id: "dbtype-size", category: "y11types",
      prompt: "A database field Size stores values such as 'Large' or 'one size'. Which data type?",
      answers: ["Text"],
      distractors: ["Character", "Boolean", "Integer", "Real", "Date/Time"],
      note: "Several characters of text is Text."
    },
    {
      id: "dbtype-price", category: "y11types",
      prompt: "A database field Price stores values such as 12.50. Which data type?",
      answers: ["Real"],
      distractors: ["Text", "Character", "Boolean", "Integer", "Date/Time"],
      note: "A number with a decimal part is Real."
    },
    {
      id: "op-div1", category: "y11ops",
      prompt: "What is 17 DIV 5?",
      answers: ["3"],
      distractors: ["2", "3.4", "4", "5", "12", "85"],
      note: "DIV gives the whole number of times 5 goes into 17: 5 goes in 3 times (15), so 3."
    },
    {
      id: "op-mod1", category: "y11ops",
      prompt: "What is 17 MOD 5?",
      answers: ["2"],
      distractors: ["3", "3.4", "12", "0", "5", "22"],
      note: "MOD gives the remainder: 17 - 15 = 2."
    },
    {
      id: "op-div2", category: "y11ops",
      prompt: "What is 500 DIV 60?",
      answers: ["8"],
      distractors: ["9", "8.33", "20", "10", "500", "60"],
      note: "60 goes into 500 eight times (480). This is how you find whole minutes in 500 seconds."
    },
    {
      id: "op-mod2", category: "y11ops",
      prompt: "What is 500 MOD 60?",
      answers: ["20"],
      distractors: ["8", "8.33", "480", "40", "60", "0"],
      note: "500 - 480 = 20 seconds left over."
    },
    {
      id: "op-pow1", category: "y11ops",
      prompt: "What is 4 ^ 2?",
      answers: ["16"],
      distractors: ["8", "6", "2", "42", "24", "4"],
      note: "^ means 'to the power of': 4 x 4 = 16, not 4 x 2."
    },
    {
      id: "op-pow2", category: "y11ops",
      prompt: "What is 2 ^ 5?",
      answers: ["32"],
      distractors: ["10", "25", "7", "16", "64", "52"],
      note: "2 x 2 x 2 x 2 x 2 = 32."
    },
    {
      id: "op-slash", category: "y11ops",
      prompt: "What is 10 / 4?",
      answers: ["2.5"],
      distractors: ["2", "3", "2.25", "1", "6", "0.4"],
      note: "/ is ordinary division and keeps the decimal part. (10 DIV 4 would be 2.)"
    },
    {
      id: "op-even", category: "y11ops",
      prompt: "Which test is TRUE only when Number is even?",
      answers: ["Number MOD 2 = 0"],
      distractors: ["Number DIV 2 = 0", "Number MOD 2 = 1", "Number / 2 = 0", "Number ^ 2 = 0", "Number DIV 2 = 1"],
      note: "An even number leaves a remainder of 0 when divided by 2, so MOD 2 = 0. Number MOD 2 = 1 would be odd numbers."
    },
    {
      id: "op-time", category: "y11ops",
      prompt: "Which expression gives the whole minutes in TotalSeconds?",
      answers: ["TotalSeconds DIV 60"],
      distractors: ["TotalSeconds MOD 60", "TotalSeconds / 60", "TotalSeconds * 60", "TotalSeconds ^ 60", "TotalSeconds - 60"],
      note: "DIV 60 gives whole minutes; MOD 60 gives the seconds left over."
    },
    {
      id: "op-notarith", category: "y11ops",
      type: "multi",
      prompt: "Which of these is NOT an arithmetic operator?",
      answers: ["AND", ">", "NOT", "<="],
      distractors: ["+", "*", "DIV", "MOD", "^", "-"],
      note: "Arithmetic operators do calculations: + - * / ^ DIV MOD. > and <= are comparison operators; AND, OR and NOT are logical operators."
    },
    {
      id: "op-neq", category: "y11ops",
      prompt: "Which comparison operator means 'not equal to'?",
      answers: ["<>"],
      distractors: ["=", "!", "<=", ">=", "><>", "NOT"],
      note: "In Cambridge pseudocode not equal to is <>. <= means less than or equal to and >= means greater than or equal to."
    },
    {
      id: "op-atleast", category: "y11ops",
      prompt: "Which condition is TRUE when Length is 10 or more?",
      answers: ["Length >= 10"],
      distractors: ["Length > 10", "Length < 10", "Length <= 10", "Length = 10", "Length <> 10"],
      note: ">= means 'greater than or equal to'. Length > 10 would leave out 10 itself."
    },
    {
      id: "op-and", category: "y11ops",
      prompt: "What does the condition Age >= 13 AND Age <= 19 test?",
      answers: ["That Age is from 13 to 19 inclusive"],
      keywords: [{ required: [["13"], ["19"]], optional: ["from", "to", "between", "inclusive", "range", "through", "and"], need: 1, excluded: ["either"] }, /\b13\s*-\s*19\b/],
      distractors: ["That Age is either 13 or 19", "That Age is less than 13 or more than 19", "That Age is exactly 13", "That Age is above 19", "That Age is below 13"],
      note: "AND needs both parts to be TRUE. Both limits together give the range 13 to 19, including 13 and 19."
    },
    {
      id: "op-or", category: "y11ops",
      prompt: "What does the condition Answer = 'N' OR Answer = 'n' test?",
      answers: ["That Answer is a capital or a lower case N"],
      distractors: ["That Answer is both N and n at once", "That Answer is not N", "That Answer is any letter", "That Answer is empty", "That Answer is N and then n"],
      note: "OR needs only one part to be TRUE. This is how a program accepts either upper or lower case."
    },
    {
      id: "lib-len", category: "y11strings",
      prompt: "Which library routine returns the number of characters in a string?",
      answers: ["LENGTH"],
      distractors: ["UCASE", "LCASE", "SUBSTRING", "ROUND", "RANDOM"],
      note: "LENGTH(\"Hello\") is 5. Spaces count as characters."
    },
    {
      id: "lib-ucase", category: "y11strings",
      prompt: "Which library routine converts a string to upper case?",
      answers: ["UCASE"],
      distractors: ["LENGTH", "LCASE", "SUBSTRING", "ROUND", "RANDOM"],
      note: "UCASE(\"hello\") is \"HELLO\"."
    },
    {
      id: "lib-lcase", category: "y11strings",
      prompt: "Which library routine converts a string to lower case?",
      answers: ["LCASE"],
      distractors: ["LENGTH", "UCASE", "SUBSTRING", "ROUND", "RANDOM"],
      note: "LCASE(\"HELLO\") is \"hello\"."
    },
    {
      id: "lib-sub", category: "y11strings",
      prompt: "Which library routine takes part of a string?",
      answers: ["SUBSTRING"],
      distractors: ["LENGTH", "UCASE", "LCASE", "ROUND", "RANDOM"],
      note: "SUBSTRING(Text, Start, Length) takes Length characters beginning at position Start (the first character is position 1)."
    },
    {
      id: "lib-round", category: "y11strings",
      prompt: "Which library routine sets a number to a given number of decimal places?",
      answers: ["ROUND"],
      distractors: ["LENGTH", "UCASE", "LCASE", "SUBSTRING", "RANDOM"],
      note: "ROUND(45.849, 2) is 45.85."
    },
    {
      id: "lib-rand", category: "y11strings",
      prompt: "Which library routine produces a random number?",
      answers: ["RANDOM"],
      distractors: ["LENGTH", "UCASE", "LCASE", "SUBSTRING", "ROUND"],
      note: "RANDOM() gives a random real number from 0 up to but not including 1; multiply and ROUND to get a whole number in a range."
    },
    {
      id: "libval-len1", category: "y11strings",
      prompt: "What is LENGTH(\"Hello World\")?",
      answers: ["11"],
      distractors: ["10", "5", "12", "2", "Hello", "0"],
      note: "H-e-l-l-o is 5, the space is 1, W-o-r-l-d is 5: 11 characters. The space counts."
    },
    {
      id: "libval-len2", category: "y11strings",
      prompt: "What is LENGTH(\"I learnt to program in computer science\")?",
      answers: ["39"],
      distractors: ["38", "40", "7", "31", "41", "8"],
      note: "Count every letter and every space: 39 characters in total."
    },
    {
      id: "libval-sub1", category: "y11strings",
      prompt: "What is SUBSTRING(\"Computer\", 1, 3)?",
      answers: ["Com"],
      distractors: ["Comp", "Cmp", "put", "omp", "Co", "Computer"],
      note: "Start at position 1 and take 3 characters: C, o, m."
    },
    {
      id: "libval-sub2", category: "y11strings",
      prompt: "What is SUBSTRING(\"Computer\", 4, 2)?",
      answers: ["pu"],
      distractors: ["mp", "ut", "Co", "put", "om", "p"],
      note: "Position 4 is p (C=1, o=2, m=3, p=4), then take 2 characters: p, u."
    },
    {
      id: "libval-sub3", category: "y11strings",
      prompt: "What is SUBSTRING(\"Tomlinson\", 1, 1)?",
      answers: ["T"],
      distractors: ["To", "Tom", "n", "o", "Tomlinson", "1"],
      note: "One character starting at position 1 is the first letter. This is how a first initial is taken."
    },
    {
      id: "libval-ucase1", category: "y11strings",
      prompt: "A username is the first letter of the first name, then the first two letters of the last name, then the number 305, all in upper case. What is it for Sarah Tomlinson?",
      answers: ["STO305"],
      distractors: ["Sto305", "SAR305", "TOM305", "STOM305", "ST305", "sto305"],
      note: "S from Sarah, TO from Tomlinson, then 305, in upper case: STO305."
    },
    {
      id: "libval-round1", category: "y11strings",
      prompt: "What is ROUND(3.14159, 2)?",
      answers: ["3.14"],
      distractors: ["3.1", "3.15", "3.142", "3", "3.14159", "314"],
      note: "Two decimal places: 3.14 (the next digit, 1, means round down)."
    },
    {
      id: "libval-round2", category: "y11strings",
      prompt: "What is ROUND(45.849, 2)?",
      answers: ["45.85"],
      distractors: ["45.84", "45.8", "45.9", "46", "45.849", "45.86"],
      note: "The third decimal place is 9, so round the second decimal place up: 45.85."
    },
    {
      id: "file-open", category: "y11strings",
      prompt: "Which statement opens a file called Names.txt so a program can read from it?",
      answers: ["OPENFILE \"Names.txt\" FOR READ"],
      distractors: ["READFILE \"Names.txt\"", "OPEN \"Names.txt\" READ", "OPENFILE \"Names.txt\" FOR WRITE", "CLOSEFILE \"Names.txt\"", "WRITEFILE \"Names.txt\"", "GETFILE \"Names.txt\""],
      note: "A file must be opened first with OPENFILE, saying whether it is FOR READ, FOR WRITE or FOR APPEND."
    },
    {
      id: "file-read", category: "y11strings",
      prompt: "Which statement reads one line of text from an open file into the variable Line?",
      answers: ["READFILE \"Names.txt\", Line"],
      distractors: ["OPENFILE \"Names.txt\", Line", "INPUT Line", "WRITEFILE \"Names.txt\", Line", "CLOSEFILE \"Names.txt\", Line", "GETLINE Line"],
      note: "READFILE takes the file name and the variable that will hold the line that is read."
    },
    {
      id: "file-write", category: "y11strings",
      prompt: "Which statement stores the value in NewUsername in an open file Username.txt?",
      answers: ["WRITEFILE \"Username.txt\", NewUsername"],
      distractors: ["READFILE \"Username.txt\", NewUsername", "OUTPUT NewUsername", "OPENFILE \"Username.txt\", NewUsername", "SAVEFILE \"Username.txt\", NewUsername", "CLOSEFILE \"Username.txt\""],
      note: "WRITEFILE puts the value into the file. The file must have been opened FOR WRITE (or FOR APPEND) first."
    },
    {
      id: "file-close", category: "y11strings",
      prompt: "Why should a program use CLOSEFILE when it has finished with a file?",
      answers: ["So the file is saved properly and is free for other programs to use"],
      distractors: ["To delete the file", "To make the file read only", "To sort the contents of the file", "To rename the file", "To turn the file into an array"],
      note: "Closing a file finishes any writing and releases it. Forgetting to close can lose data or lock the file."
    },
    {
      id: "file-modes", category: "y11strings",
      prompt: "Which file mode adds new lines to the end of a file without erasing what is already in it?",
      answers: ["APPEND"],
      distractors: ["READ", "WRITE", "INPUT", "OUTPUT", "CLOSE"],
      note: "WRITE starts the file afresh and replaces what was there. APPEND keeps the existing lines and adds to the end."
    },
    {
      id: "file-why", category: "y11strings",
      prompt: "Give a reason to store data in a file.",
      answers: ["So the data is kept after the program ends and can be used again"],
      distractors: ["So the data runs faster", "So the data is validated", "So the data is never needed again", "So the program uses less code", "So the variable does not need declaring"],
      note: "Variables are lost when the program stops. A file keeps the data for next time."
    },
    {
      id: "arr-declare1", category: "y11strings",
      prompt: "Which statement declares a 1D array Names that holds 50 strings?",
      answers: ["DECLARE Names : ARRAY[1:50] OF STRING"],
      distractors: ["DECLARE Names : STRING[50]", "DECLARE Names : ARRAY OF STRING", "DECLARE Names[50] : STRING", "ARRAY Names : STRING(1:50)", "DECLARE Names : STRING ARRAY[1:50]"],
      note: "The form is DECLARE name : ARRAY[first:last] OF type. [1:50] means indexes 1 up to 50, so 50 elements."
    },
    {
      id: "arr-declare2", category: "y11strings",
      prompt: "Which statement declares a 2D array Accounts with 1000 rows and 2 columns of strings?",
      answers: ["DECLARE Accounts : ARRAY[1:1000, 1:2] OF STRING"],
      distractors: ["DECLARE Accounts : ARRAY[1:1000] OF STRING", "DECLARE Accounts : ARRAY[1000, 2] OF STRING", "DECLARE Accounts : ARRAY[1:2, 1:1000] OF STRING", "DECLARE Accounts : ARRAY[1:1000:2] OF STRING", "DECLARE Accounts : STRING[1:1000, 1:2]"],
      note: "A 2D array gives two ranges, row first then column: [1:1000, 1:2] is 1000 rows and 2 columns."
    },
    {
      id: "arr-size", category: "y11strings",
      prompt: "DECLARE Runners : ARRAY[1:250] OF STRING. How many names can the array hold?",
      answers: ["250"],
      distractors: ["249", "251", "1", "2", "500", "25"],
      note: "Indexes 1 to 250 are 250 elements. This array starts at index 1, not 0."
    },
    {
      id: "arr-2d", category: "y11strings",
      prompt: "In Accounts[Row, 2], which part of the 2D array do you get?",
      answers: ["Column 2 of the row numbered Row"],
      keywords: [/^(?!.*\brow\s*2\b)(?!.*\bwhole\b)(?=.*\brow\b).*\bcol(umn)?\s*(number\s*)?2\b/i],
      distractors: ["Row 2 of the column numbered Row", "The whole of column 2", "Row 2 and Row together", "The second array", "Every element"],
      note: "The first number is the row and the second is the column. Accounts[1, 2] is row 1, column 2."
    },
    {
      id: "arr-loop", category: "y11strings",
      prompt: "Which loop visits every element of Values[1:100] in order?",
      answers: ["FOR Index <- 1 TO 100 ... NEXT Index"],
      distractors: ["FOR Index <- 100 ... NEXT Index", "WHILE Index <- 1 TO 100", "REPEAT Values UNTIL 100", "FOR Values <- 1 TO 100 ... NEXT Values", "IF Index = 1 TO 100 THEN"],
      note: "A count-controlled FOR loop with the index as the loop variable is the standard way to go through an array."
    },
    {
      id: "loop-total", category: "y11ops",
      prompt: "What is 'totalling' in a loop?",
      answers: ["Adding each value to a running total that started at 0"],
      distractors: ["Counting how many times the loop runs", "Finding the largest value", "Sorting the values", "Searching for a value", "Stopping the loop early"],
      note: "Totalling: Total <- Total + Number on every pass, with Total set to 0 before the loop starts."
    },
    {
      id: "loop-count", category: "y11ops",
      prompt: "What is 'counting' in a loop?",
      answers: ["Adding 1 to a variable each time something happens"],
      distractors: ["Adding each value to a running total", "Finding the smallest value", "Multiplying each value", "Reading from a file", "Converting to upper case"],
      note: "Counting: Count <- Count + 1. Note the difference from totalling, which adds the value itself."
    },
    {
      id: "loop-for", category: "y11ops",
      prompt: "Which loop is best when you know exactly how many times to repeat?",
      answers: ["FOR ... NEXT (count-controlled)"],
      distractors: ["WHILE ... ENDWHILE (pre-condition)", "REPEAT ... UNTIL (post-condition)", "IF ... ENDIF", "CASE ... ENDCASE", "DECLARE"],
      note: "A FOR loop is count-controlled: it runs a set number of times. WHILE and REPEAT run until a condition changes."
    },
    {
      id: "loop-repeat", category: "y11ops",
      prompt: "Which loop always runs its body at least once?",
      answers: ["REPEAT ... UNTIL"],
      distractors: ["WHILE ... DO ... ENDWHILE", "FOR ... NEXT with the start above the end", "IF ... THEN", "CASE OF", "None of them"],
      note: "REPEAT tests its condition at the end (post-condition), so the body runs before the first test. A WHILE loop tests first and may never run."
    },
    {
      id: "loop-ends", category: "y11ops",
      prompt: "Which keyword ends a WHILE loop?",
      answers: ["ENDWHILE"],
      distractors: ["NEXT", "UNTIL", "ENDIF", "ENDLOOP", "STOP"],
      note: "FOR ends with NEXT, REPEAT ends with UNTIL condition, and WHILE ends with ENDWHILE."
    },
    {
      id: "loop-until", category: "y11ops",
      prompt: "In a REPEAT loop, when does the loop stop?",
      answers: ["When the condition after UNTIL becomes TRUE"],
      keywords: [{ required: [["true"]], excluded: ["false", "not", "never"] }],
      distractors: ["When the condition after UNTIL becomes FALSE", "After exactly 10 times", "When the keyword ENDREPEAT is reached", "It never stops", "After one pass"],
      note: "REPEAT ... UNTIL Number < 0 keeps going while the condition is FALSE and stops the moment it becomes TRUE."
    }
  ]
});
