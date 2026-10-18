// Year 11, 8.1 L5: String Handling (Activity 2: write the string code)
// Loaded by Drills/index.html?drill=y11-8-1-strings-code. Written by tools/build_y11_8_1_strings.mjs: edit the builder.
// Code cards: the student writes Cambridge pseudocode, which runs against the model program with a new word typed in
// on every card (`inputs`), so a start position or a length that only fits one word does not keep passing.
DrillData.register("y11-8-1-strings-code", {
  title: "Year 11, 8.1 L5: Write the String Code",
  subtitle: "Use LENGTH, SUBSTRING, UCASE and LCASE in your own programs",
  codeDrill: true,
  categories: [
    ["code-len", "LENGTH"],
    ["code-sub", "SUBSTRING"],
    ["code-case", "UCASE and LCASE"],
    ["code-both", "Put Them Together"]
  ],
  cards: (function () {
    var WORDS = ["Computer", "Keyboard", "Monitor", "Printer", "Network", "Program", "Laptop", "Science", "Speaker", "Library", "Mouse", "Byte"];
    var PASSWORDS = ["cat2024", "sunshine", "pass", "Bangkok99", "hatyai", "tiger12345", "abc", "letmein"];
    var REPLIES = ["yes", "YES", "Yes", "yEs", "no", "No", "maybe"];
    var NAMES = ["Hann", "smith", "Khan", "LEE", "nguyen", "Patel", "wong"];
    function one(list) { return function () { return [drillPick(list)]; }; }
    return [
      { id: "code-len-1", category: "code-len",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output the number of characters in Word.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT LENGTH(Word)",
        checkVars: [], checkOutput: true },
      { id: "code-len-2", category: "code-len",
        prompt: "A password is typed in. Declare Password (STRING) and input it. If it has fewer than 8 characters, output \"Too short\". Otherwise output \"OK\".",
        inputs: one(PASSWORDS), setup: {},
        reference: "DECLARE Password : STRING\nINPUT Password\nIF LENGTH(Password) < 8 THEN\n  OUTPUT \"Too short\"\nELSE\n  OUTPUT \"OK\"\nENDIF",
        checkVars: [], checkOutput: true },
      { id: "code-sub-1", category: "code-sub",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output its first three letters.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT SUBSTRING(Word, 1, 3)",
        checkVars: [], checkOutput: true },
      { id: "code-sub-2", category: "code-sub",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output its last letter. It must work for a word of any length.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT SUBSTRING(Word, LENGTH(Word), 1)",
        checkVars: [], checkOutput: true },
      { id: "code-case-1", category: "code-case",
        prompt: "A name is typed in. Declare Name (STRING) and input it. Change Name to upper case and store it back in Name. Then output Name.",
        inputs: one(NAMES), setup: {},
        reference: "DECLARE Name : STRING\nINPUT Name\nName <- UCASE(Name)\nOUTPUT Name",
        checkVars: ["Name"], checkOutput: true },
      { id: "code-case-2", category: "code-case",
        prompt: "A reply is typed in. Declare Reply (STRING) and input it. If the reply is yes, typed in any case, output \"Welcome\". Otherwise output \"Goodbye\".",
        inputs: one(REPLIES), setup: {},
        reference: "DECLARE Reply : STRING\nINPUT Reply\nIF UCASE(Reply) = \"YES\" THEN\n  OUTPUT \"Welcome\"\nELSE\n  OUTPUT \"Goodbye\"\nENDIF",
        checkVars: [], checkOutput: true },
      { id: "code-both-1", category: "code-both",
        prompt: "A last name is typed in. Declare LastName and Temp (both STRING) and input LastName. Store the first two letters of LastName, in upper case, in Temp. Output Temp.",
        inputs: one(NAMES), setup: {},
        reference: "DECLARE LastName : STRING\nDECLARE Temp : STRING\nINPUT LastName\nTemp <- UCASE(SUBSTRING(LastName, 1, 2))\nOUTPUT Temp",
        checkVars: ["Temp"], checkOutput: true },
      { id: "code-both-2", category: "code-both",
        prompt: "A word is typed in. Declare Word (STRING) and input it. Output the number of characters in Word. Then output Word in lower case.",
        inputs: one(WORDS), setup: {},
        reference: "DECLARE Word : STRING\nINPUT Word\nOUTPUT LENGTH(Word)\nOUTPUT LCASE(Word)",
        checkVars: [], checkOutput: true }
    ];
  })()
});
