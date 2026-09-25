// Year 11: Databases, SQL and Program Development
// Loaded by Drills/index.html?drill=y11-p2-sql-dev
DrillData.register("y11-p2-sql-dev", {
  title: "Year 11: Databases, SQL and Program Development",
  subtitle: "Cambridge IGCSE Computer Science 0478 - Paper 2",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["y11sql", "Databases and SQL"],
    ["y11dev", "Program Development"]
  ],
  cards: [
    {
      id: "sql-kw-select", category: "y11sql",
      prompt: "Which SQL keyword says which fields to show?",
      answers: ["SELECT"],
      distractors: ["FROM", "WHERE", "ORDER BY", "COUNT", "SUM"],
      note: "SELECT lists the fields you want in the results."
    },
    {
      id: "sql-kw-from", category: "y11sql",
      prompt: "Which SQL keyword identifies the table?",
      answers: ["FROM"],
      distractors: ["SELECT", "WHERE", "ORDER BY", "COUNT", "SUM"],
      note: "FROM names the database table to use."
    },
    {
      id: "sql-kw-where", category: "y11sql",
      prompt: "Which SQL keyword picks only the records that meet a condition?",
      answers: ["WHERE"],
      distractors: ["SELECT", "FROM", "ORDER BY", "COUNT", "SUM"],
      note: "WHERE filters the records, for example WHERE Age > 5."
    },
    {
      id: "sql-kw-order", category: "y11sql",
      prompt: "Which SQL keyword sorts the results?",
      answers: ["ORDER BY"],
      distractors: ["SELECT", "FROM", "WHERE", "COUNT", "SUM"],
      note: "ORDER BY Field sorts lowest to highest (ascending) unless you add DESC."
    },
    {
      id: "sql-kw-count", category: "y11sql",
      prompt: "Which SQL keyword returns the number of records?",
      answers: ["COUNT"],
      distractors: ["SELECT", "FROM", "WHERE", "ORDER BY", "SUM"],
      note: "COUNT(Name) counts the records that match."
    },
    {
      id: "sql-kw-sum", category: "y11sql",
      prompt: "Which SQL keyword adds up the values of a field?",
      answers: ["SUM"],
      distractors: ["SELECT", "FROM", "WHERE", "ORDER BY", "COUNT"],
      note: "SUM(Age) adds all the ages together."
    },
    {
      id: "sql-q1", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT Name FROM PETS WHERE Type = \"Cat\";",
      answers: ["Luna, Tia"],
      distractors: ["Luna, Tia, Rex", "Milo, Rex", "P2, P5", "Cat, Cat", "Luna, Coco", "Tia"],
      note: "Only records where Type is Cat are kept (P2 and P5). SELECT Name shows only the Name field."
    },
    {
      id: "sql-q2", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT Name FROM PETS WHERE Age > 5;",
      answers: ["Luna, Rex"],
      distractors: ["Luna, Rex, Milo", "Milo, Coco, Tia", "7, 9", "Rex", "Luna", "Milo, Luna, Rex"],
      note: "Ages above 5 are 7 (Luna) and 9 (Rex). > means strictly greater than."
    },
    {
      id: "sql-q3", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT Name FROM PETS WHERE Age >= 4;",
      answers: ["Milo, Luna, Rex"],
      distractors: ["Luna, Rex", "Coco, Tia", "Milo, Luna, Rex, Tia", "Milo, Rex", "Coco, Tia, Milo", "4, 7, 9"],
      note: ">= includes 4, so Milo (4) is included as well as Luna (7) and Rex (9)."
    },
    {
      id: "sql-q4", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT Name FROM PETS ORDER BY Age;",
      answers: ["Coco, Tia, Milo, Luna, Rex"],
      distractors: ["Rex, Luna, Milo, Tia, Coco", "Milo, Luna, Rex, Coco, Tia", "Coco, Luna, Milo, Rex, Tia", "Luna, Milo, Rex, Tia, Coco", "Coco, Milo, Luna, Rex, Tia", "2, 3, 4, 7, 9"],
      note: "Ages in ascending order are 2, 3, 4, 7, 9: Coco, Tia, Milo, Luna, Rex."
    },
    {
      id: "sql-q5", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT COUNT(Name) FROM PETS WHERE Type = \"Dog\";",
      answers: ["2"],
      distractors: ["1", "3", "5", "Milo, Rex", "4", "9"],
      note: "There are two dogs (Milo and Rex), and COUNT returns how many records match."
    },
    {
      id: "sql-q6", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT SUM(Age) FROM PETS;",
      answers: ["25"],
      distractors: ["5", "9", "4", "24", "26", "2"],
      note: "4 + 7 + 9 + 2 + 3 = 25."
    },
    {
      id: "sql-q7", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT ID, Name FROM PETS WHERE Type = \"Dog\" ORDER BY Name;",
      answers: ["P1 Milo, P3 Rex"],
      distractors: ["P3 Rex, P1 Milo", "Milo, Rex", "P1, P3", "P2 Luna, P5 Tia", "P1 Dog, P3 Dog", "P4 Coco"],
      note: "Both dogs are selected, showing ID and Name, sorted alphabetically: Milo comes before Rex."
    },
    {
      id: "sql-q8", category: "y11sql",
      prompt: "Consider this table:\nPETS (ID, Name, Type, Age)\nP1 Milo Dog 4\nP2 Luna Cat 7\nP3 Rex Dog 9\nP4 Coco Rabbit 2\nP5 Tia Cat 3\nWhat does this SQL statement output?\nSELECT * FROM PETS WHERE Age < 3;",
      answers: ["All the fields of Coco's record: P4 Coco Rabbit 2"],
      keywords: [{ required: [["coco"]], optional: ["p4", "rabbit", "2", "all", "field", "record"], need: 1, excluded: ["tia", "only"] }],
      distractors: ["Only the name Coco", "All the fields of Tia's record", "The number 1", "All the records in the table", "An error, because * is not allowed"],
      note: "* means every field. Only Coco (2) is under 3."
    },
    {
      id: "sql-write1", category: "y11sql",
      prompt: "Which statement lists the names of pets aged under 4 from the table PETS?",
      answers: ["SELECT Name FROM PETS WHERE Age < 4;"],
      distractors: ["SELECT Age FROM PETS WHERE Name < 4;", "SELECT Name FROM PETS ORDER BY Age < 4;", "SELECT * WHERE Age < 4 FROM PETS;", "FROM PETS SELECT Name WHERE Age < 4;", "SELECT Name FROM PETS WHERE Age > 4;"],
      note: "The order is SELECT fields, FROM table, WHERE condition, ORDER BY field. Under 4 uses <."
    },
    {
      id: "sql-write2", category: "y11sql",
      prompt: "Which statement lists the name and type of all pets, in order of name?",
      answers: ["SELECT Name, Type FROM PETS ORDER BY Name;"],
      distractors: ["SELECT Name, Type FROM PETS WHERE Name;", "SELECT Name Type FROM PETS ORDER Name;", "ORDER BY Name SELECT Name, Type FROM PETS;", "SELECT Name, Type ORDER BY Name FROM PETS;", "SELECT Name, Type FROM PETS SORT Name;"],
      note: "Fields are separated by commas, and every SQL statement ends with a semicolon."
    },
    {
      id: "sql-desc", category: "y11sql",
      prompt: "What does ORDER BY Age DESC do?",
      answers: ["Sorts the records from the highest age to the lowest"],
      keywords: [/\b(highest|oldest|largest|biggest|greatest|high)\b.*\b(lowest|youngest|smallest|low)\b/i, /\bdescending\b/i, /\boldest\s*first\b/i],
      distractors: ["Sorts from lowest to highest", "Deletes the Age field", "Describes the Age field", "Only shows the oldest record", "Sorts alphabetically by Name"],
      note: "By default ORDER BY is ascending (lowest first). DESC reverses it."
    },
    {
      id: "db-field", category: "y11sql",
      prompt: "In a database table, what is a field?",
      answers: ["One column that stores one piece of data about each record, such as Name"],
      distractors: ["One whole row of data", "The whole table", "A unique code for the table", "A type of query", "A database program"],
      note: "Fields are the columns, records are the rows."
    },
    {
      id: "db-record", category: "y11sql",
      prompt: "In a database table, what is a record?",
      answers: ["One row containing all the data about one item"],
      distractors: ["One column of data", "A type of data", "A SQL keyword", "The name of the table", "A unique key"],
      note: "Each record is a row: for example everything about one pet."
    },
    {
      id: "db-pk", category: "y11sql",
      prompt: "What is a primary key?",
      answers: ["A field whose value is unique for every record"],
      distractors: ["The first field in the table", "A field that is always a number", "A field that can be left blank", "The field with the longest data", "A key that opens the database"],
      note: "A primary key identifies one record only, so no two records share the same value."
    },
    {
      id: "db-pkchoice", category: "y11sql",
      prompt: "Which field in PETS is the best primary key?",
      answers: ["ID"],
      distractors: ["Name", "Type", "Age", "Cat", "Milo"],
      note: "Names, types and ages can be repeated (two cats, two dogs). ID is different for every record."
    },
    {
      id: "db-pkwhy", category: "y11sql",
      prompt: "Why is a field like StudentID better than a Name as a primary key?",
      answers: ["Two students can share a name but never an ID"],
      distractors: ["Names are too long to store", "IDs are always text", "Names can only be integers", "IDs can be left blank", "Names cannot be sorted"],
      note: "A primary key must be unique. Names can be repeated (two students called Julie)."
    },
    {
      id: "life-an", category: "y11dev",
      prompt: "In which stage of the program development life cycle is the problem investigated and the requirements found?",
      answers: ["Analysis"],
      distractors: ["Design", "Coding", "Testing", "Maintenance", "Planning", "Debugging"],
      note: "Analysis: decide exactly what the program must do, break the problem down (decomposition) and identify inputs, processes and outputs."
    },
    {
      id: "life-de", category: "y11dev",
      prompt: "In which stage are structure diagrams, flowcharts and pseudocode produced?",
      answers: ["Design"],
      distractors: ["Analysis", "Coding", "Testing", "Maintenance", "Planning", "Debugging"],
      note: "Design: plan how the solution will work before writing any real code."
    },
    {
      id: "life-co", category: "y11dev",
      prompt: "In which stage is the program written in a programming language?",
      answers: ["Coding"],
      distractors: ["Analysis", "Design", "Testing", "Maintenance", "Planning", "Debugging"],
      note: "Coding: turn the design into a program, and the coder also tests as they go."
    },
    {
      id: "life-te", category: "y11dev",
      prompt: "In which stage is test data used to check the program works and meets the requirements?",
      answers: ["Testing"],
      distractors: ["Analysis", "Design", "Coding", "Maintenance", "Planning", "Debugging"],
      note: "Testing: run the program with normal, abnormal and extreme data and compare with the expected results."
    },
    {
      id: "life-order", category: "y11dev",
      prompt: "What is the correct order of the stages of the program development life cycle?",
      answers: ["Analysis, Design, Coding, Testing"],
      distractors: ["Design, Analysis, Coding, Testing", "Coding, Design, Analysis, Testing", "Analysis, Coding, Design, Testing", "Testing, Coding, Design, Analysis", "Analysis, Design, Testing, Coding"],
      note: "Understand the problem, plan a solution, write it, then test it."
    },
    {
      id: "dev-maintain", category: "y11dev",
      prompt: "Which of these does NOT help to make a program easier to maintain?",
      answers: ["Removing blank lines to make the code shorter"],
      distractors: ["Using meaningful variable names", "Adding comments", "Using procedures and functions", "Using consistent indentation", "Splitting the program into sections"],
      note: "Blank lines, indentation, comments, sensible names and subroutines make code readable. Cramming it together makes it harder to understand."
    },
    {
      id: "dev-identifiers", category: "y11dev",
      prompt: "Which identifier is the most meaningful for a variable holding the total price of an order?",
      answers: ["TotalPrice"],
      distractors: ["X", "Temp", "Data1", "Thing", "TP2", "A"],
      note: "A meaningful name explains what the variable holds so anyone reading the code can follow it."
    },
    {
      id: "dev-comments", category: "y11dev",
      prompt: "Why add comments to a program?",
      answers: ["To explain how the code works to anyone who reads it later"],
      distractors: ["To make the program run faster", "To stop the program crashing", "To check the data is valid", "To change the output", "To declare the variables"],
      note: "Comments start with // and are ignored by the computer. They help maintenance."
    },
    {
      id: "dev-structure", category: "y11dev",
      prompt: "What is a structure diagram used for?",
      answers: ["To show a system broken down into smaller sub-systems"],
      distractors: ["To record the values of variables", "To show the truth table of a circuit", "To store test data", "To list SQL keywords", "To show the order of the loops"],
      note: "A hotel booking system might split into booking, payment and room management. Structure diagrams show top-down decomposition."
    },
    {
      id: "dev-decomp", category: "y11dev",
      prompt: "What does decomposition mean?",
      answers: ["Breaking a problem into smaller, more manageable parts"],
      distractors: ["Combining several programs into one", "Removing errors from code", "Hiding details that are not needed", "Finding patterns in the data", "Writing the final program"],
      note: "Smaller parts are easier to understand, design and test."
    },
    {
      id: "dev-iopo", category: "y11dev",
      prompt: "A program asks for a number, doubles it and shows the result. Which is the process?",
      answers: ["Doubling the number"],
      distractors: ["Asking for the number", "Showing the result", "The number typed in", "The result shown", "The question shown on screen"],
      note: "Input is what goes in, process is what the program does with it, output is what comes out."
    }
  ]
});
