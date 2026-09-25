// Year 11 Algorithms and Pseudocode - Exam Questions
// Loaded by Drills/index.html?drill=examqs-y11-algorithms
DrillData.register("examqs-y11-algorithms", {
  title: "Year 11 Algorithms and Pseudocode - Exam Questions",
  subtitle: "Cambridge IGCSE Computer Science 0478 - Paper 2 past-paper questions",
  isExamSet: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["y11valid", "Validation and Verification"],
    ["y11test", "Test Data"],
    ["y11types", "Data Types"],
    ["y11ops", "Operators and Iteration"],
    ["y11strings", "Strings, Files and Arrays"],
    ["y11errors", "Finding Errors in Pseudocode"],
    ["y11trace", "Tracing and Calculating"],
    ["y11logic", "Logic Gates and Truth Tables"],
    ["y11sql", "Databases and SQL"],
    ["y11dev", "Program Development"]
  ],
  cards: [
    {
      id: "y11-verif-reason", category: "y11valid",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 1",
      marks: 1,
      stem: "Tick one box to identify the reason for applying a verification check to input data. A: To make sure that all the data is in the correct range. B: To make sure that all the data is accurate. C: To make sure that no errors have been introduced during input. D: To make sure that all the data is of the correct length.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "C" }
      ]
    },
    {
      id: "y11-format-type", category: "y11valid",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 2(a)",
      marks: 2,
      stem: "Identify the type of validation check in each description. Each check must be different.",
      parts: [
        { label: "A check to make sure that data input follows a set pattern such as two letters followed by three numbers.", correctAnswer: "Format check", acceptedAnswers: ["Format"] },
        { label: "A check to make sure that only whole numbers can be input.", correctAnswer: "Type check", acceptedAnswers: ["Type", "Data type check"] }
      ]
    },
    {
      id: "y11-range-check", category: "y11valid",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 1",
      marks: 1,
      stem: "Identify the type of validation check used to test whether a number entered into a computer system is between two set values.",
      parts: [
        { label: "Enter the name of the check.", correctAnswer: "Range check", acceptedAnswers: ["Range"] }
      ]
    },
    {
      id: "y11-presence-checkdigit", category: "y11valid",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 22, Question 2(a)",
      marks: 2,
      stem: "Identify the validation check or data item in each description.",
      parts: [
        { label: "A check to make sure that data has been input and not left blank.", correctAnswer: "Presence check", acceptedAnswers: ["Presence"] },
        { label: "A value placed at the end of a sequence of numbers in the code. The value is calculated from all the other values before it.", correctAnswer: "Check digit", acceptedAnswers: ["Check digit check"] }
      ]
    },
    {
      id: "y11-password-checks", category: "y11valid",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 3(c) (adapted)",
      marks: 3,
      stem: "A program asks for a new password. If the password is shorter than 10 characters it must be input again. If it is at least 10 characters long the user is asked to input it a second time, and the program only accepts it if both inputs match.",
      parts: [
        { label: "Name the validation check that makes sure the password is at least 10 characters long.", correctAnswer: "Length check", acceptedAnswers: ["Length"] },
        { label: "Name the verification method used when the password is input a second time and compared.", correctAnswer: "Double entry", acceptedAnswers: ["Double entry check", "Double-entry", "Double entry verification"] },
        { label: "Enter the comparison operator you would use in the length test to show a password is long enough, when Length is the number of characters (>, <, >=, <=, =).", correctAnswer: ">=" }
      ]
    },
    {
      id: "y11-checkdigit-calc", category: "y11valid",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 6 (adapted)",
      marks: 2,
      stem: "A check digit validates a 5-digit number. Multiply each digit by its position (1 to 5) and total the results. The check digit is MOD(Total, 11). For example, 30475 gives (3*1)+(0*2)+(4*3)+(7*4)+(5*5) = 68 and MOD(68, 11) = 2. Now use the same method for the number 24680.",
      parts: [
        { label: "Enter the total after multiplying each digit by its position.", correctAnswer: "60" },
        { label: "Enter the check digit, MOD(Total, 11).", correctAnswer: "5" }
      ]
    },
    {
      id: "y11-test-types", category: "y11test",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 2",
      marks: 3,
      stem: "A program is tested with three different types of test data.",
      parts: [
        { label: "Data that is inside the accepted range and should be accepted.", correctAnswer: "Normal", acceptedAnswers: ["Normal data"] },
        { label: "Data that is outside the accepted range and should be rejected.", correctAnswer: "Abnormal", acceptedAnswers: ["Erroneous", "Invalid", "Abnormal data"] },
        { label: "Data that is on the very edge of the accepted range (the highest or lowest accepted value).", correctAnswer: "Extreme", acceptedAnswers: ["Boundary", "Extreme data", "Boundary data"] }
      ]
    },
    {
      id: "y11-test-terms", category: "y11test",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 2(b)",
      marks: 2,
      stem: "Identify the type of test data described.",
      parts: [
        { label: "Data that falls within the accepted parameters of a validation check and is accepted.", correctAnswer: "Normal", acceptedAnswers: ["Normal data"] },
        { label: "Data that is the highest or lowest value to be accepted.", correctAnswer: "Extreme", acceptedAnswers: ["Boundary", "Extreme data", "Boundary data"] }
      ]
    },
    {
      id: "y11-test-range", category: "y11test",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 3 (adapted)",
      marks: 3,
      stem: "A program only accepts values between -99.99 and +99.99 inclusive. It is tested with the values 0, -99.99 and 100.5.",
      parts: [
        { label: "Enter the type of test data that 0 is.", correctAnswer: "Normal", acceptedAnswers: ["Normal data"] },
        { label: "Enter the type of test data that -99.99 is.", correctAnswer: "Extreme", acceptedAnswers: ["Boundary", "Extreme data", "Boundary data"] },
        { label: "Enter the type of test data that 100.5 is.", correctAnswer: "Abnormal", acceptedAnswers: ["Erroneous", "Invalid", "Abnormal data"] }
      ]
    },
    {
      id: "y11-types-student", category: "y11types",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 3",
      marks: 2,
      stem: "Complete the table by writing the most appropriate data type for each variable described. The variable Age holds the age of the student, for example 16. The variable Teenager holds whether the student is a teenager or not, for example TRUE.",
      parts: [
        { label: "Data type for Age.", correctAnswer: "INTEGER", acceptedAnswers: ["Int"] },
        { label: "Data type for Teenager.", correctAnswer: "BOOLEAN", acceptedAnswers: ["Bool"] }
      ]
    },
    {
      id: "y11-types-string", category: "y11types",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 2",
      marks: 1,
      stem: "Tick one box to identify the most appropriate data type to store a value made of letters and numbers. A: char. B: Boolean. C: string. D: real.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "C", acceptedAnswers: ["STRING"] }
      ]
    },
    {
      id: "y11-types-count", category: "y11types",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 7(c) (adapted)",
      marks: 1,
      stem: "A flowchart uses a variable Count. It starts at 0, is increased by 1 or decreased by 1 by whole-number steps, and is multiplied by an integer Number. State a suitable data type for the variable Count.",
      parts: [
        { label: "Enter the data type.", correctAnswer: "INTEGER", acceptedAnswers: ["Int"] }
      ]
    },
    {
      id: "y11-types-swim", category: "y11types",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 9(a)",
      marks: 2,
      stem: "A swimming club stores the fields Distance (distance swum in metres, for example 1500) and Date (the date the member swam the distance) in the table SWIMMERS. Only the data types text, character, Boolean, integer, real and date/time are available. Each data type must be different.",
      parts: [
        { label: "Data type for Distance.", correctAnswer: "Integer", acceptedAnswers: ["INT"] },
        { label: "Data type for Date.", correctAnswer: "Date/Time", acceptedAnswers: ["Date", "Date time", "Datetime"] }
      ]
    },
    {
      id: "y11-types-parts", category: "y11types",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 22, Question 9(a)",
      marks: 4,
      stem: "A table CAR_PARTS has these fields. Only the data types text, character, Boolean, integer, real and date/time are available. Colour holds a single letter code for the colour of the car part. NumberInStock holds the quantity of car parts in stock. InStock holds whether or not the car part is in stock. Size specifies the size if relevant, otherwise stores 'one size'.",
      parts: [
        { label: "Data type for Colour.", correctAnswer: "Character", acceptedAnswers: ["Char"] },
        { label: "Data type for NumberInStock.", correctAnswer: "Integer", acceptedAnswers: ["Int"] },
        { label: "Data type for InStock.", correctAnswer: "Boolean", acceptedAnswers: ["Bool"] },
        { label: "Data type for Size.", correctAnswer: "Text", acceptedAnswers: ["String"] }
      ]
    },
    {
      id: "y11-types-trip", category: "y11types",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 8(c)",
      marks: 3,
      stem: "A school database table SchoolTrip has the fields ParentName (for example Mr Akar), Permission (TRUE or FALSE) and DateReceived (for example 03/03/2025). The database only uses the data types text, Boolean and date/time. Each data type must be different.",
      parts: [
        { label: "Data type for ParentName.", correctAnswer: "Text", acceptedAnswers: ["String"] },
        { label: "Data type for Permission.", correctAnswer: "Boolean", acceptedAnswers: ["Bool"] },
        { label: "Data type for DateReceived.", correctAnswer: "Date/Time", acceptedAnswers: ["Date", "Date time", "Datetime"] }
      ]
    },
    {
      id: "y11-types-waterfowl", category: "y11types",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 7(b) (adapted)",
      marks: 2,
      stem: "A table WATERFOWL has the fields Species, Family, Length (for example 63.5 cm), Wingspan (for example 130.0 cm) and Lifespan (whole years, for example 14). Identify one field that is most likely to use each data type. Each field must be different.",
      parts: [
        { label: "Field that uses Integer.", correctAnswer: "Lifespan" },
        { label: "Field that uses Real.", correctAnswer: "Length", acceptedAnswers: ["Wingspan"] }
      ]
    },
    {
      id: "y11-operators", category: "y11ops",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 2 (adapted)",
      marks: 8,
      stem: "The operators in the list are: / > <= + * ^ AND DIV MOD NOT. Decide whether each of these operators is an arithmetic operator.",
      parts: [
        { label: "Is > an arithmetic operator? Enter YES or NO.", correctAnswer: "NO" },
        { label: "Is DIV an arithmetic operator? Enter YES or NO.", correctAnswer: "YES" },
        { label: "Is AND an arithmetic operator? Enter YES or NO.", correctAnswer: "NO" },
        { label: "Is ^ an arithmetic operator? Enter YES or NO.", correctAnswer: "YES" },
        { label: "Is NOT an arithmetic operator? Enter YES or NO.", correctAnswer: "NO" },
        { label: "Is MOD an arithmetic operator? Enter YES or NO.", correctAnswer: "YES" },
        { label: "Is <= an arithmetic operator? Enter YES or NO.", correctAnswer: "NO" },
        { label: "Is * an arithmetic operator? Enter YES or NO.", correctAnswer: "YES" }
      ]
    },
    {
      id: "y11-power", category: "y11ops",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 1",
      marks: 1,
      stem: "Tick one box to complete this sentence. The result of the arithmetic operation 4 ^ 2 is: A: 2. B: 8. C: 16.",
      parts: [
        { label: "Enter A, B or C.", correctAnswer: "C", acceptedAnswers: ["16"] }
      ]
    },
    {
      id: "y11-div-operator", category: "y11ops",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 3",
      marks: 1,
      stem: "Tick one box to identify the arithmetic operator that divides two values and returns only the whole number part, with the remainder (fractional part) discarded. A: /. B: DIV. C: ^. D: MOD.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "B", acceptedAnswers: ["DIV"] }
      ]
    },
    {
      id: "y11-iteration-types", category: "y11ops",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 22, Question 1",
      marks: 1,
      stem: "Tick one box to complete the following sentence. Two types of pseudocode statements used for iteration are: A CASE and IF; B FOR ... NEXT and IF; C FOR ... NEXT and WHILE ... DO ... ENDWHILE; D REPEAT ... UNTIL and IF.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "C", acceptedAnswers: ["FOR NEXT AND WHILE DO ENDWHILE", "FOR ... NEXT AND WHILE ... DO ... ENDWHILE"] }
      ]
    },
    {
      id: "y11-totalling", category: "y11ops",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 1",
      marks: 1,
      stem: "Tick one box to complete this sentence. A standard method of solution used for adding together a set of values during iteration is: A counting; B searching; C sorting; D totalling.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "D", acceptedAnswers: ["TOTALLING", "TOTALING"] }
      ]
    },
    {
      id: "y11-loop-examples", category: "y11ops",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 6",
      marks: 2,
      stem: "Give programming examples for a count-controlled loop and a post-condition loop.",
      parts: [
        { label: "Give the count-controlled loop example.", correctAnswer: "FOR ... NEXT", acceptedAnswers: ["FOR NEXT", "FOR ... TO ... NEXT", "FOR TO NEXT"] },
        { label: "Give the post-condition loop example.", correctAnswer: "REPEAT ... UNTIL", acceptedAnswers: ["REPEAT UNTIL"] }
      ]
    },
    {
      id: "y11-loop-choice", category: "y11ops",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 2(c) (adapted)",
      marks: 3,
      stem: "An algorithm inputs 20 numbers one at a time. If a number is not negative it must be input again until a negative number is input. Then the next number is input, until 20 negative numbers have been stored.",
      parts: [
        { label: "Which loop statement is best for repeating the whole process exactly 20 times (FOR, WHILE or REPEAT)?", correctAnswer: "FOR" },
        { label: "Which keyword ends a WHILE ... DO loop?", correctAnswer: "ENDWHILE" },
        { label: "Which keyword ends a REPEAT loop and holds its condition?", correctAnswer: "UNTIL" }
      ]
    },
    {
      id: "y11-string-routines", category: "y11strings",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 6(a)",
      marks: 3,
      stem: "The string \"I learnt to program in computer science\" is stored in the variable Fact. The algorithm must output the length of the string in Fact and output the string in upper case.",
      parts: [
        { label: "Enter the library routine that returns the length of a string.", correctAnswer: "LENGTH", acceptedAnswers: ["LENGTH(FACT)"] },
        { label: "Enter the number of characters in the string, including spaces.", correctAnswer: "39" },
        { label: "Enter the library routine that converts a string to upper case.", correctAnswer: "UCASE", acceptedAnswers: ["UCASE(FACT)"] }
      ]
    },
    {
      id: "y11-username", category: "y11strings",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 5 (adapted)",
      marks: 3,
      stem: "A system creates a username for a new user by taking the first letter of the first name, taking the first two letters of the last name, converting all the letters to upper case, and adding a random whole number between 1 and 1000 inclusive. For example, first name Muhammed, last name Hann and generated number 492 gives MHA492.",
      parts: [
        { label: "Enter the username for first name Sarah, last name Tomlinson and generated number 305.", correctAnswer: "STO305" },
        { label: "Enter the library routine you would use to take part of a string, such as the first two letters of LastName.", correctAnswer: "SUBSTRING", acceptedAnswers: ["SUBSTRING(LASTNAME, 1, 2)"] },
        { label: "Enter the library routine you would use to convert the letters to upper case.", correctAnswer: "UCASE" }
      ]
    },
    {
      id: "y11-email-at", category: "y11strings",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 4(b) (adapted)",
      marks: 3,
      stem: "An email address is validated by checking that it contains an @ symbol, using SUBSTRING(EmailAddress, Start, 1) to return one character starting at position Start. The first character of a string is in position 1.",
      parts: [
        { label: "In the address pat@mail.com, enter the position of the @ symbol.", correctAnswer: "4" },
        { label: "Enter the library routine that returns the number of characters in EmailAddress, so a loop knows when to stop.", correctAnswer: "LENGTH" },
        { label: "Enter the data type of the value returned by SUBSTRING.", correctAnswer: "STRING", acceptedAnswers: ["CHAR", "CHARACTER"] }
      ]
    },
    {
      id: "y11-file-statements", category: "y11strings",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 9",
      marks: 3,
      stem: "A school stores students' attendance data in a file called Attendance.txt. An algorithm must read one line of text from the file and store it in the variable StudentAttendance.",
      parts: [
        { label: "Enter the keyword that opens the file.", correctAnswer: "OPENFILE" },
        { label: "Enter the keyword that reads a line from the file.", correctAnswer: "READFILE" },
        { label: "Enter the keyword that closes the file when finished.", correctAnswer: "CLOSEFILE" }
      ]
    },
    {
      id: "y11-file-write", category: "y11strings",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 5(c)",
      marks: 2,
      stem: "The new username is stored in the variable NewUsername. It must be stored in the file Username.txt.",
      parts: [
        { label: "Enter the file mode used when opening the file to store data (READ, WRITE or APPEND).", correctAnswer: "WRITE", acceptedAnswers: ["APPEND"] },
        { label: "Enter the keyword that writes a line to the file.", correctAnswer: "WRITEFILE" }
      ]
    },
    {
      id: "y11-array-declare", category: "y11strings",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 5(c)",
      marks: 3,
      stem: "A one-dimensional (1D) string array CodeStore[] with six elements is needed. The statement starts DECLARE CodeStore : ___[1:6] OF ___",
      parts: [
        { label: "Enter the keyword for the structure.", correctAnswer: "ARRAY" },
        { label: "Enter the data type of each element.", correctAnswer: "STRING" },
        { label: "Enter the highest index used for the array.", correctAnswer: "6" }
      ]
    },
    {
      id: "y11-checkdigit-errors", category: "y11errors",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 6(a)",
      marks: 4,
      stem: "The pseudocode should calculate the check digit for a 5-digit number entered one digit at a time (each digit multiplied by its position, total, then MOD 11).\n03 DECLARE CheckDigit : CHAR\n04 Total <- 0\n05 FOR Count <- 1 TO 10\n06    OUTPUT \"Please enter digit \", Count\n07    INPUT Digit\n08    Total <- Total + (Digit / Count)\n09 NEXT Count\n10 CheckDigit <- MOD(Total, 11)\n...\n14 ELSE\n15    OUTPUT \"The check digit is \", Count\n16 ENDIF",
      parts: [
        { label: "Line 3: enter the correct data type for CheckDigit.", correctAnswer: "INTEGER" },
        { label: "Line 5: enter the correct final value of the FOR loop.", correctAnswer: "5" },
        { label: "Line 8: enter the correct arithmetic operator to combine Digit and Count.", correctAnswer: "*", acceptedAnswers: ["MULTIPLY", "X"] },
        { label: "Line 15: enter the name of the variable that should be output instead of Count.", correctAnswer: "CheckDigit" }
      ]
    },
    {
      id: "y11-errors-accounts", category: "y11errors",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 22, Question 5(a)",
      marks: 3,
      stem: "This pseudocode should ask for an account ID and output the name of the customer, using the 2D array Accounts[1:1000, 1:2] (column 1 is the ID, column 2 is the name).\n04 OUTPUT \"Please enter an account ID \"\n05 OUTPUT AccountID\n06 FOR Row <- 1 TO 1000\n07    CASE OF AccountID = Accounts[Row, 1]\n08       THEN\n09          OUTPUT \"The customer's name is \", Accounts[1, 2]\n10    ENDIF\n11 NEXT Row",
      parts: [
        { label: "Line 5: enter the keyword that should replace OUTPUT.", correctAnswer: "INPUT" },
        { label: "Line 7: enter the keyword that should replace CASE OF.", correctAnswer: "IF" },
        { label: "Line 9: enter the variable that should replace 1 in Accounts[1, 2].", correctAnswer: "Row" }
      ]
    },
    {
      id: "y11-errors-runners", category: "y11errors",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 4(a)",
      marks: 4,
      stem: "This algorithm should input a runner's name and finish time in seconds for 250 runners, then output the time as minutes and seconds.\n05 DECLARE RunTime : STRING\n06 DECLARE RunMins : INTEGER\n07 DECLARE RunSecs : INTEGER\n08 FOR Index <- 1 TO 250\n10    INPUT RunName\n11    OUTPUT RunTime\n12    RunMins <- DIV(RunTime, 60)\n13    RunSecs <- DIV(RunTime, 60)\n16    Runners[Index] <- RunMins\n17    Times[Index] <- RunTime\n18 NEXT Index",
      parts: [
        { label: "Line 5: enter the correct data type for RunTime.", correctAnswer: "INTEGER" },
        { label: "Line 11: enter the keyword that should replace OUTPUT.", correctAnswer: "INPUT" },
        { label: "Line 13: enter the function that gives the remaining seconds.", correctAnswer: "MOD" },
        { label: "Line 16: enter the variable that should be stored in Runners[Index].", correctAnswer: "RunName" }
      ]
    },
    {
      id: "y11-errors-bubble", category: "y11errors",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 5(a)",
      marks: 4,
      stem: "This algorithm should bubble sort 200 names into ascending order using the 2D array Names[1:200, 1:2] (last names in column 1, first names in column 2).\n03 DECLARE Row : STRING\n08 WHILE NOT Swap DO\n09    Swap <- FALSE\n10    FOR Row <- 2 TO 199\n11       IF Names[Row, 1] > Names[Row + 1, 1]\n12          THEN\n15             Names[Row, 1] <- Names[Row + 1, 1]\n16             Names[Row, 1] <- Names[Row + 1, 2]\n21    NEXT Column",
      parts: [
        { label: "Line 3: enter the correct data type for Row.", correctAnswer: "INTEGER" },
        { label: "Line 10: enter the correct starting value for Row.", correctAnswer: "1" },
        { label: "Line 16: enter the column number that should be used on the left side.", correctAnswer: "2" },
        { label: "Line 21: enter the variable that should follow NEXT.", correctAnswer: "Row" }
      ]
    },
    {
      id: "y11-errors-contacts", category: "y11errors",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 2(a)",
      marks: 5,
      stem: "This algorithm should search the 2D array Contacts[1:500, 1:4] for a first name and output all the details for that name.\n01 DECLARE Contacts : ARRAY[1:500, 1:4] OF REAL\n12 OUTPUT FirstName\n13 REPEAT\n14    IF Contacts[Row, 1] = FirstName\n16       FOR Column <- 1 TO 4\n17          OUTPUT Contacts[Row, 1]\n23 NEXT Stop OR Row > 500\n26 IF Answer = 'N' OR Answer = 'n'\n27 THEN\n28    Continue <- TRUE",
      parts: [
        { label: "Line 1: enter the data type that should replace REAL for names and details.", correctAnswer: "STRING" },
        { label: "Line 12: enter the keyword that should replace OUTPUT.", correctAnswer: "INPUT" },
        { label: "Line 17: enter the variable that should replace the 1 in Contacts[Row, 1].", correctAnswer: "Column" },
        { label: "Line 23: enter the keyword that should replace NEXT.", correctAnswer: "UNTIL" },
        { label: "Line 28: enter the value Continue should be set to.", correctAnswer: "FALSE" }
      ]
    },
    {
      id: "y11-errors-average", category: "y11errors",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 7 (adapted)",
      marks: 3,
      stem: "This algorithm inputs whole numbers into the array Values[] until -1 is input, then outputs the average to 2 decimal places.\n03 DECLARE Average : INTEGER\n10    Values[Counter] <- Number\n11    Total <- Total + 1\n12    Counter <- Counter + 1\n15 Counter <- Counter - 1\n16 Average <- Counter / Total",
      parts: [
        { label: "Line 3: enter the data type Average needs to hold a decimal result.", correctAnswer: "REAL" },
        { label: "Line 11: enter the variable that should be added to Total instead of 1.", correctAnswer: "Number" },
        { label: "Line 16: enter the variable that should be the dividend (the top of the division).", correctAnswer: "Total" }
      ]
    },
    {
      id: "y11-trace-sentence", category: "y11trace",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 6 (adapted)",
      marks: 3,
      stem: "A flowchart takes the sentence \"Computing is fun\" (16 characters, first character in position 1). It steps LetterNo along the sentence. Whenever it reaches a space it sets Word to the letters since Start and outputs Word, a space and LENGTH(Word). At the end of the sentence it does the same for the final word.",
      parts: [
        { label: "How many lines are output for this sentence?", correctAnswer: "3" },
        { label: "Enter the length output next to the first word.", correctAnswer: "9" },
        { label: "Enter the last word that is output.", correctAnswer: "fun", acceptedAnswers: ["FUN"] }
      ]
    },
    {
      id: "y11-restaurant", category: "y11trace",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 4(a) (adapted)",
      marks: 4,
      stem: "A meal for an adult costs $9.99 and a meal for a child costs $6.99. If there are 6 or more people at a table, a 15% discount is applied to the total cost. A table has 4 adults and 2 children.",
      parts: [
        { label: "Enter the total cost before any discount.", correctAnswer: "53.94" },
        { label: "Is the discount applied? Enter YES or NO.", correctAnswer: "YES" },
        { label: "Enter the final cost after the discount, set to 2 decimal places.", correctAnswer: "45.85" },
        { label: "Enter the library routine used to set a value to 2 decimal places.", correctAnswer: "ROUND" }
      ]
    },
    {
      id: "y11-archery", category: "y11trace",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 11 (adapted)",
      marks: 3,
      stem: "An archer's 10 round scores are 20, 25, 30, 18, 22, 27, 24, 29, 21 and 26. The highest and lowest scores are discarded and the other 8 are totalled. An overall score of 210 or more qualifies, 180 to 209 inclusive becomes a reserve, and below 180 does not qualify.",
      parts: [
        { label: "Enter the total of all 10 scores.", correctAnswer: "242" },
        { label: "Enter the overall score after discarding the highest and lowest.", correctAnswer: "194" },
        { label: "Enter the result (QUALIFY, RESERVE or NOT QUALIFY).", correctAnswer: "RESERVE" }
      ]
    },
    {
      id: "y11-rainfall", category: "y11trace",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 22, Question 10 (adapted)",
      marks: 3,
      stem: "A program records the rainfall in millimetres for each of 365 days. The total for a year is 1234 mm. A drought message is output if the longest run of days with no rainfall is 15 or more.",
      parts: [
        { label: "Enter the total rainfall in centimetres (1 cm = 10 mm).", correctAnswer: "123.4", acceptedAnswers: ["123.40"] },
        { label: "Enter the mean daily rainfall in millimetres rounded to four decimal places.", correctAnswer: "3.3808" },
        { label: "The longest run with no rainfall is 15 days. Is the drought message output? Enter YES or NO.", correctAnswer: "YES" }
      ]
    },
    {
      id: "y11-pollution", category: "y11trace",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 10 (adapted)",
      marks: 4,
      stem: "A program classes each daily river reading in mg/L. A reading between 2 and 8 inclusive is moderate pollution. A reading greater than 8 is high pollution. Any other reading is neither.",
      parts: [
        { label: "Enter the class for a reading of 2.0 (MODERATE, HIGH or NEITHER).", correctAnswer: "MODERATE" },
        { label: "Enter the class for a reading of 8.0.", correctAnswer: "MODERATE" },
        { label: "Enter the class for a reading of 8.1.", correctAnswer: "HIGH" },
        { label: "Enter the class for a reading of 1.9.", correctAnswer: "NEITHER", acceptedAnswers: ["NONE"] }
      ]
    },
    {
      id: "y11-random-chance", category: "y11trace",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 8 (adapted)",
      marks: 2,
      stem: "A program tests a random number generator using 100 000 numbers. The chance of a number is calculated using chance = frequency / 100000.",
      parts: [
        { label: "Enter the chance of a number that was generated 9850 times.", correctAnswer: "0.0985" },
        { label: "Enter the chance of a number that was generated 10120 times.", correctAnswer: "0.1012" }
      ]
    },
    {
      id: "y11-tt-z", category: "y11logic",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 22, Question 8(b)",
      marks: 6,
      stem: "Consider the logic expression: Z = NOT (B OR NOT C) XOR (A NAND C). Complete the truth table. Inputs are written in the order A B C. Give the output Z (0 or 1).",
      parts: [
        { label: "Output Z for A B C = 001.", correctAnswer: "0" },
        { label: "Output Z for A B C = 011.", correctAnswer: "1" },
        { label: "Output Z for A B C = 100.", correctAnswer: "1" },
        { label: "Output Z for A B C = 101.", correctAnswer: "1" },
        { label: "Output Z for A B C = 110.", correctAnswer: "1" },
        { label: "Output Z for A B C = 111.", correctAnswer: "0" }
      ]
    },
    {
      id: "y11-tt-x-nand-nor", category: "y11logic",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 7(b)",
      marks: 6,
      stem: "Consider the logic expression: X = (A NAND NOT B) XOR (A NOR C). Complete the truth table. Inputs are written in the order A B C. Give the output X (0 or 1).",
      parts: [
        { label: "Output X for A B C = 001.", correctAnswer: "1" },
        { label: "Output X for A B C = 011.", correctAnswer: "1" },
        { label: "Output X for A B C = 100.", correctAnswer: "0" },
        { label: "Output X for A B C = 101.", correctAnswer: "0" },
        { label: "Output X for A B C = 110.", correctAnswer: "1" },
        { label: "Output X for A B C = 111.", correctAnswer: "1" }
      ]
    },
    {
      id: "y11-tt-pqr", category: "y11logic",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 7(b)",
      marks: 6,
      stem: "Consider the logic expression: X = (NOT P AND Q) XOR (Q NOR R). Complete the truth table. Inputs are written in the order P Q R. Give the output X (0 or 1).",
      parts: [
        { label: "Output X for P Q R = 001.", correctAnswer: "0" },
        { label: "Output X for P Q R = 010.", correctAnswer: "1" },
        { label: "Output X for P Q R = 011.", correctAnswer: "1" },
        { label: "Output X for P Q R = 100.", correctAnswer: "1" },
        { label: "Output X for P Q R = 110.", correctAnswer: "0" },
        { label: "Output X for P Q R = 111.", correctAnswer: "0" }
      ]
    },
    {
      id: "y11-tt-jkl", category: "y11logic",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 6(b)",
      marks: 7,
      stem: "Consider the logic expression: X = (J XOR NOT K) NAND NOT L. Complete the truth table. Inputs are written in the order J K L. Give the output X (0 or 1).",
      parts: [
        { label: "Output X for J K L = 001.", correctAnswer: "1" },
        { label: "Output X for J K L = 010.", correctAnswer: "1" },
        { label: "Output X for J K L = 011.", correctAnswer: "1" },
        { label: "Output X for J K L = 100.", correctAnswer: "1" },
        { label: "Output X for J K L = 101.", correctAnswer: "1" },
        { label: "Output X for J K L = 110.", correctAnswer: "0" },
        { label: "Output X for J K L = 111.", correctAnswer: "1" }
      ]
    },
    {
      id: "y11-nand-table", category: "y11logic",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 4(d)",
      marks: 4,
      stem: "Complete the truth table for a NAND logic gate with inputs A and B. Give the output X (0 or 1).",
      parts: [
        { label: "Output X for A B = 00.", correctAnswer: "1" },
        { label: "Output X for A B = 01.", correctAnswer: "1" },
        { label: "Output X for A B = 10.", correctAnswer: "1" },
        { label: "Output X for A B = 11.", correctAnswer: "0" }
      ]
    },
    {
      id: "y11-discount-logic", category: "y11logic",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 4(c) (adapted)",
      marks: 4,
      stem: "A restaurant gives a discount (X = 1) if the person ordering is a student (A = 1) or is 65 years or older (B = 1), but only if the order is $20.00 or over (C = 1). So X = (A OR B) AND C.",
      parts: [
        { label: "Enter X when A = 1, B = 0 and C = 1.", correctAnswer: "1" },
        { label: "Enter X when A = 0, B = 0 and C = 1.", correctAnswer: "0" },
        { label: "Enter X when A = 0, B = 1 and C = 0.", correctAnswer: "0" },
        { label: "Enter X when A = 0, B = 1 and C = 1.", correctAnswer: "1" }
      ]
    },
    {
      id: "y11-sql-keywords", category: "y11sql",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 1",
      marks: 4,
      stem: "Match each description to the SQL keyword from this list: ORDER BY, WHERE, SUM, FROM, COUNT.",
      parts: [
        { label: "Identifies the database table.", correctAnswer: "FROM" },
        { label: "Sorts the results.", correctAnswer: "ORDER BY" },
        { label: "Returns the number of records.", correctAnswer: "COUNT" },
        { label: "Selects only the records that meet a condition.", correctAnswer: "WHERE" }
      ]
    },
    {
      id: "y11-sql-europe", category: "y11sql",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 8(c)",
      marks: 3,
      stem: "The table NATIONAL_TREES holds these records (IDCode, Country, Continent, CommonName). EU121 Albania Europe Olive; NO126 The Bahamas North America Lignum vitae; AS534 Bangladesh Asia Mango tree; SO326 Brazil South America Brazilwood; NO124 Canada North America Maple; EU321 Cyprus Europe Golden oak; EU652 Finland Europe Silver birch; AS222 India Asia Indian banyan; AF875 Madagascar Africa Baobab. Consider: SELECT IDCode, Country, CommonName FROM NATIONAL_TREES WHERE Continent = \"Europe\";",
      parts: [
        { label: "How many records are output?", correctAnswer: "3" },
        { label: "Enter the country of the first record output.", correctAnswer: "Albania" },
        { label: "Enter the CommonName output for Finland.", correctAnswer: "Silver birch" }
      ]
    },
    {
      id: "y11-sql-swans", category: "y11sql",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 7(c) (adapted)",
      marks: 3,
      stem: "The table WATERFOWL holds Species, Family, Length, Wingspan, Lifespan. The Swan records are: Mute swan, Swan, 150.0, 220.2, lifespan 10; Whooper swan, Swan, 150.0, 230.0, lifespan 9. Consider: SELECT Species, Length, Wingspan FROM WATERFOWL WHERE Family = \"Swan\" ORDER BY Lifespan;",
      parts: [
        { label: "How many records are output?", correctAnswer: "2" },
        { label: "Enter the Species of the first record output.", correctAnswer: "Whooper swan" },
        { label: "Enter the Wingspan of the first record output.", correctAnswer: "230.0", acceptedAnswers: ["230"] }
      ]
    },
    {
      id: "y11-sql-complete", category: "y11sql",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 22, Question 7(d)",
      marks: 3,
      stem: "Complete the SQL statement to list only the species, family and lifespan of all waterfowl whose typical lifespan is at least 10 years, sorted in order of species. SELECT Species, Family, ___ FROM WATERFOWL WHERE Lifespan ___ 10 ORDER BY ___;",
      parts: [
        { label: "Enter the third field to select.", correctAnswer: "Lifespan" },
        { label: "Enter the comparison operator for at least 10.", correctAnswer: ">=" },
        { label: "Enter the field to sort by.", correctAnswer: "Species" }
      ]
    },
    {
      id: "y11-sql-options", category: "y11sql",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 23, Question 8(c)",
      marks: 3,
      stem: "Complete the SQL statement to list only the subject code, subject name and level from the table OPTION_SUBJECTS for a minimum class size of less than 10, in order of subject code from lowest to highest. SELECT SubjectCode, SubjectName, Level FROM ___ WHERE MinimumClassSize ___ 10 ORDER BY ___;",
      parts: [
        { label: "Enter the table name.", correctAnswer: "OPTION_SUBJECTS" },
        { label: "Enter the comparison operator for less than.", correctAnswer: "<" },
        { label: "Enter the field to sort by.", correctAnswer: "SubjectCode" }
      ]
    },
    {
      id: "y11-sql-swim", category: "y11sql",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 9(c)",
      marks: 2,
      stem: "Write the condition to list members of the table SWIMMERS who swam a distance of 1500 metres or more. SELECT MemberName FROM ___ WHERE Distance ___ 1500;",
      parts: [
        { label: "Enter the table name.", correctAnswer: "SWIMMERS" },
        { label: "Enter the comparison operator for 1500 or more.", correctAnswer: ">=" }
      ]
    },
    {
      id: "y11-function", category: "y11dev",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 21, Question 11 (adapted)",
      marks: 3,
      stem: "A function takes two integers, FirstNumber and SecondNumber, and returns FirstNumber raised to the power of SecondNumber. It is called with A and B and the result is stored in Value.",
      parts: [
        { label: "Enter the keyword that ends the function definition.", correctAnswer: "ENDFUNCTION" },
        { label: "Enter the keyword that sends the result back to the calling code.", correctAnswer: "RETURN" },
        { label: "Enter the data type that follows RETURNS in the function header.", correctAnswer: "INTEGER" }
      ]
    },
    {
      id: "y11-procedure", category: "y11dev",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 21, Question 10 (adapted)",
      marks: 5,
      stem: "A procedure Time(TotalSeconds) converts TotalSeconds into minutes and seconds and outputs the result. Minutes and Seconds are whole numbers.",
      parts: [
        { label: "Enter the data type used to declare Minutes and Seconds.", correctAnswer: "INTEGER" },
        { label: "Enter the operator that gives the whole number of minutes in TotalSeconds.", correctAnswer: "DIV" },
        { label: "Enter the operator that gives the seconds left over.", correctAnswer: "MOD" },
        { label: "Enter the value of Minutes when TotalSeconds is 500.", correctAnswer: "8" },
        { label: "Enter the value of Seconds when TotalSeconds is 500.", correctAnswer: "20" }
      ]
    },
    {
      id: "y11-maintainable", category: "y11dev",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 4",
      marks: 1,
      stem: "Tick one box to identify the option that would not help to make a program maintainable. A: Use meaningful identifiers for variable names. B: Remove blank lines to make the program code shorter. C: Use procedures and functions. D: Use the commenting feature provided by the programming language.",
      parts: [
        { label: "Enter A, B, C or D.", correctAnswer: "B" }
      ]
    },
    {
      id: "y11-lifecycle", category: "y11dev",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 22, Question 3 (adapted)",
      marks: 4,
      stem: "The program development life cycle is split into stages: analysis, design, coding and testing.",
      parts: [
        { label: "In which stage are the requirements of the problem identified and the problem decomposed?", correctAnswer: "Analysis" },
        { label: "In which stage are structure diagrams, flowcharts and pseudocode produced?", correctAnswer: "Design" },
        { label: "In which stage is the program written in a programming language?", correctAnswer: "Coding" },
        { label: "In which stage is test data used to check the program works?", correctAnswer: "Testing" }
      ]
    }
  ]
});
