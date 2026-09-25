// Year 11: Validation, Verification and Test Data
// Loaded by Drills/index.html?drill=y11-p2-validation
DrillData.register("y11-p2-validation", {
  title: "Year 11: Validation, Verification and Test Data",
  subtitle: "Cambridge IGCSE Computer Science 0478 - Paper 2",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["y11valid", "Validation and Verification"],
    ["y11test", "Test Data"]
  ],
  cards: [
    {
      id: "val-purpose", category: "y11valid",
      prompt: "What is the purpose of validation?",
      answers: ["To check that the data entered is sensible and meets set rules"],
      distractors: ["To check that the data entered is definitely correct", "To check that the data typed matches the original source", "To make the data encrypted before it is stored", "To sort the data into order", "To copy the data to a backup"],
      note: "Validation is an automatic check that data is reasonable. It cannot prove data is correct: 17 passes a range check for ages 11 to 18 even if the real age is 18."
    },
    {
      id: "val-verif-purpose", category: "y11valid",
      prompt: "What is the purpose of verification?",
      answers: ["To check that no errors have been introduced when the data was input or copied"],
      distractors: ["To check that data falls inside a set range", "To check that data is the right data type", "To stop the user leaving a field blank", "To calculate a check digit", "To make sure the data is sensible"],
      note: "Verification checks that the data entered matches what was intended, for example by typing it twice (double entry) or by proofreading it against the source."
    },
    {
      id: "val-verif-methods", category: "y11valid",
      type: "multi",
      prompt: "Which of these is a verification method?",
      answers: ["Double entry", "Visual check"],
      distractors: ["Range check", "Length check", "Presence check", "Type check", "Format check", "Check digit"],
      note: "Two verification methods: double entry (type it twice and compare) and a visual check (read what was typed against the source). Range, length, presence, type, format and check digit are all validation checks."
    },
    {
      id: "val-why", category: "y11valid",
      prompt: "Why are validation checks used when data is input?",
      answers: ["To stop unsuitable data being accepted, which could cause errors or wrong results later"],
      distractors: ["To make the program run faster", "To prove that every value entered is true", "To hide the data from other users", "To reduce the amount of storage used", "To remove the need to test the program"],
      note: "Without validation a program might accept an age of -5 or text where a number is needed and then crash or give wrong answers. Validation is a filter, not a guarantee."
    },
    {
      id: "val-password", category: "y11valid",
      prompt: "A program asks the user to type a new password twice and compares the two. What is this?",
      answers: ["Verification (double entry)"],
      distractors: ["Validation (range check)", "Validation (length check)", "Validation (presence check)", "A check digit", "Test data"],
      note: "Typing the password a second time checks it was entered as intended, which is verification. Checking it is at least 10 characters long would be a separate validation (length) check."
    },
    {
      id: "val-def-range", category: "y11valid",
      prompt: "Which validation check tests that a number is between two set values?",
      answers: ["Range check"],
      distractors: ["Length check", "Presence check", "Type check", "Format check", "Check digit"],
      note: "A range check checks that a number is between two set values, for example an age from 11 to 18."
    },
    {
      id: "val-def-length", category: "y11valid",
      prompt: "Which validation check tests how many characters are in the data?",
      answers: ["Length check"],
      distractors: ["Range check", "Presence check", "Type check", "Format check", "Check digit"],
      note: "A length check checks the number of characters, for example a password of at least 8 characters."
    },
    {
      id: "val-def-presence", category: "y11valid",
      prompt: "Which validation check makes sure a field has not been left empty?",
      answers: ["Presence check"],
      distractors: ["Range check", "Length check", "Type check", "Format check", "Check digit"],
      note: "A presence check checks that data has been entered and not left blank."
    },
    {
      id: "val-def-type", category: "y11valid",
      prompt: "Which validation check makes sure only whole numbers can be entered?",
      answers: ["Type check"],
      distractors: ["Range check", "Length check", "Presence check", "Format check", "Check digit"],
      note: "A type check checks the data is the right data type, for example whole numbers only."
    },
    {
      id: "val-def-format", category: "y11valid",
      prompt: "Which validation check tests that data follows a set pattern such as two letters followed by three numbers?",
      answers: ["Format check"],
      distractors: ["Range check", "Length check", "Presence check", "Type check", "Check digit"],
      note: "A format check checks the data follows a set pattern, for example two letters then three digits."
    },
    {
      id: "val-def-checkdigit", category: "y11valid",
      prompt: "What is a value placed at the end of a sequence of numbers, calculated from all the other values before it, called?",
      answers: ["Check digit"],
      distractors: ["Range check", "Length check", "Presence check", "Type check", "Format check"],
      note: "A check digit is a value calculated from the other digits and placed at the end, then recalculated to check the number was entered correctly."
    },
    {
      id: "val-scen-age", category: "y11valid",
      prompt: "A form accepts an age only if it is from 11 to 18. Which check is this?",
      answers: ["Range check"],
      distractors: ["Length check", "Presence check", "Type check", "Format check", "Check digit"],
      note: "The value must lie between two limits, so it is a range check."
    },
    {
      id: "val-scen-postcode", category: "y11valid",
      prompt: "A system only accepts a code such as AB123: two letters then three digits. Which check is this?",
      answers: ["Format check"],
      distractors: ["Range check", "Length check", "Presence check", "Type check", "Check digit"],
      note: "A set pattern of letters and digits is a format check."
    },
    {
      id: "val-scen-surname", category: "y11valid",
      prompt: "A form will not submit until the surname box has something in it. Which check is this?",
      answers: ["Presence check"],
      distractors: ["Range check", "Length check", "Type check", "Format check", "Check digit"],
      note: "It only tests that something has been entered, so it is a presence check."
    },
    {
      id: "val-scen-quantity", category: "y11valid",
      prompt: "A shop system rejects the quantity 2.5 because it must be a whole number. Which check is this?",
      answers: ["Type check"],
      distractors: ["Range check", "Length check", "Presence check", "Format check", "Check digit"],
      note: "Whole numbers only means checking the data type."
    },
    {
      id: "val-scen-username", category: "y11valid",
      prompt: "A username must be between 6 and 12 characters. Which check tests this?",
      answers: ["Length check"],
      distractors: ["Range check", "Presence check", "Type check", "Format check", "Check digit"],
      note: "It counts characters, so it is a length check (note: not a range check, which tests a number's value)."
    },
    {
      id: "val-scen-isbn", category: "y11valid",
      prompt: "The last digit of a barcode number is recalculated from the other digits when it is scanned. Which check is this?",
      answers: ["Check digit"],
      distractors: ["Range check", "Length check", "Presence check", "Type check", "Format check"],
      note: "A digit worked out from the others is a check digit."
    },
    {
      id: "val-limits", category: "y11valid",
      prompt: "A range check for ages accepts 11 to 18. The user types 17 but their real age is 18. What happens?",
      answers: ["The value is accepted, because validation only checks it is sensible, not that it is correct"],
      distractors: ["The value is rejected because it is wrong", "The value is rejected because it is a whole number", "The program crashes", "The verification check corrects it", "The check digit changes"],
      note: "17 is inside the range so validation accepts it. Only verification (for example checking against the source) could catch that it is not the person's true age."
    },
    {
      id: "val-checkdigit-calc", category: "y11valid",
      prompt: "A check digit is the total of (each digit multiplied by its position from 1 to 5) MOD 11. What is the check digit for 12345?",
      answers: ["0"],
      distractors: ["1", "5", "11", "55", "4", "10"],
      note: "1x1 + 2x2 + 3x3 + 4x4 + 5x5 = 55. 55 MOD 11 = 0 because 11 goes into 55 exactly five times with nothing left over."
    },
    {
      id: "val-checkdigit-calc2", category: "y11valid",
      prompt: "A check digit is the total of (each digit multiplied by its position from 1 to 5) MOD 11. What is the check digit for 24680?",
      answers: ["5"],
      distractors: ["0", "6", "60", "4", "11", "9"],
      note: "2x1 + 4x2 + 6x3 + 8x4 + 0x5 = 2 + 8 + 18 + 32 + 0 = 60. 60 MOD 11: 11 goes into 60 five times (55), remainder 5."
    },
    {
      id: "test-def-normal", category: "y11test",
      prompt: "Which type of test data is valid data that should be accepted?",
      answers: ["Normal data"],
      distractors: ["Abnormal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "Normal data is valid data that should be accepted, for example 50 for a range of 1 to 100. (Extreme data is sometimes called boundary data.)"
    },
    {
      id: "test-def-abnormal", category: "y11test",
      prompt: "Which type of test data is invalid data that should be rejected?",
      answers: ["Abnormal data"],
      distractors: ["Normal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "Abnormal data is invalid data that should be rejected, for example 150 or the word 'ten' for a range of 1 to 100. (Extreme data is sometimes called boundary data.)"
    },
    {
      id: "test-def-extreme", category: "y11test",
      prompt: "Which type of test data is the highest or lowest value that should be accepted?",
      answers: ["Extreme data"],
      distractors: ["Normal data", "Abnormal data", "Boundary error data", "Invalid range data", "Random data"],
      note: "Extreme data is the largest or smallest value that should be accepted, for example 1 or 100 for a range of 1 to 100. (Extreme data is sometimes called boundary data.)"
    },
    {
      id: "test-sc-a", category: "y11test",
      prompt: "A program should accept whole numbers from 1 to 100. Which type of test data is 57?",
      answers: ["Normal data"],
      distractors: ["Abnormal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "57 is inside the range and should be accepted."
    },
    {
      id: "test-sc-b", category: "y11test",
      prompt: "A program should accept whole numbers from 1 to 100. Which type of test data is 100?",
      answers: ["Extreme data"],
      distractors: ["Normal data", "Abnormal data", "Boundary error data", "Invalid range data", "Random data"],
      note: "100 is the highest value that should still be accepted."
    },
    {
      id: "test-sc-c", category: "y11test",
      prompt: "A program should accept whole numbers from 1 to 100. Which type of test data is 101?",
      answers: ["Abnormal data"],
      distractors: ["Normal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "101 is just outside the range, so it should be rejected."
    },
    {
      id: "test-sc-d", category: "y11test",
      prompt: "A program should accept whole numbers from 1 to 100. Which type of test data is the word 'seven'?",
      answers: ["Abnormal data"],
      distractors: ["Normal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "Text where a number is needed is invalid and should be rejected."
    },
    {
      id: "test-sc-e", category: "y11test",
      prompt: "A program only accepts values between -99.99 and +99.99 inclusive. Which type of test data is -99.99?",
      answers: ["Extreme data"],
      distractors: ["Normal data", "Abnormal data", "Boundary error data", "Invalid range data", "Random data"],
      note: "It is the lowest value that is still accepted."
    },
    {
      id: "test-sc-f", category: "y11test",
      prompt: "A program only accepts values between -99.99 and +99.99 inclusive. Which type of test data is 0?",
      answers: ["Normal data"],
      distractors: ["Abnormal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "0 is comfortably inside the range."
    },
    {
      id: "test-sc-g", category: "y11test",
      prompt: "A program only accepts values between -99.99 and +99.99 inclusive. Which type of test data is 100.5?",
      answers: ["Abnormal data"],
      distractors: ["Normal data", "Extreme data", "Boundary error data", "Invalid range data", "Random data"],
      note: "It is above the highest accepted value."
    },
    {
      id: "test-purpose-ab", category: "y11test",
      prompt: "Why is abnormal data used when testing a program with a validation check?",
      answers: ["To check that the program rejects data it should not accept"],
      distractors: ["To check the program accepts the highest valid value", "To check the program works with typical values", "To make the program run more slowly", "To find out how fast the program is", "To check that the program is easy to read"],
      note: "Abnormal data should be rejected. If the program accepts it, the validation has a fault."
    },
    {
      id: "test-purpose-ex", category: "y11test",
      prompt: "Why is extreme data used when testing?",
      answers: ["To check the program accepts the highest and lowest valid values, so the limits are correct"],
      distractors: ["To check the program rejects invalid values", "To make sure the program does not crash on text", "To test the program with typical everyday values", "To check the layout of the screen", "To check the program can be maintained"],
      note: "Extreme data sits on the edge of the valid range. It catches mistakes like using < when <= was needed."
    }
  ]
});
