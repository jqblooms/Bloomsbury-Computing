// Year 9, Number Systems
// Loaded by Drills/index.html?drill=y9-numbers
DrillData.register("y9-numbers", {
  title: "Year 9, Number Systems",
  subtitle: "Binary, Denary and Hexadecimal",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["bases", "Number Bases & Symbols"],
    ["hex", "Hexadecimal"],
    ["addition", "Binary Addition"],
    ["placevalues", "Place Values"],
    ["converting", "Converting Between Systems"]
  ],
  cards: [
    {
      id: "y9-why-binary", category: "bases",
      prompt: "Why do computers store data using binary?",
      answers: ["Every component inside a computer is a switch that is either electrically on or off"],
      // "Every component...can hold ten separate voltage levels..." also
      // shares "every"/"component"/"computer"/"one"/"each" with the real
      // answer - "switch" and "on"/"off" are the actual distinguishing
      // concept.
      keywords: [{ required: [["switch"], ["on", "off"]] }],
      distractors: [
        "Every component inside a computer can hold ten separate voltage levels at once, one for each denary digit",
        "Binary numbers always take up less space on a page than denary numbers",
        "Computers cannot store letters or symbols unless they use only two digits",
        "Binary was the only number system available before computers were invented",
        "Switches inside a computer can be set to any of sixteen different values",
        "Binary avoids the need for any electricity to flow through the components"
      ],
      note: "A switch has no in-between state, so it naturally gives two values: on (1) and off (0)."
    },
    {
      id: "y9-bit-definition", category: "bases",
      prompt: "What is one single 0 or 1 called?",
      answers: ["A bit"],
      distractors: [
        "A byte",
        "A nibble",
        "A digit switch",
        "A binary word",
        "A hex digit"
      ],
      note: "Bit is short for binary digit."
    },
    {
      id: "y9-byte-definition", category: "bases",
      prompt: "What is a group of 8 bits called?",
      answers: ["A byte"],
      distractors: [
        "A nibble",
        "A bit",
        "A word",
        "A hex digit",
        "A kilobyte"
      ]
    },
    {
      id: "y9-binary-column-rule", category: "placevalues",
      prompt: "Moving one column to the left in binary multiplies its value by what?",
      answers: ["2"],
      distractors: [
        "10",
        "4",
        "8",
        "1",
        "16"
      ],
      note: "Every binary column is worth double the column to its right."
    },
    {
      id: "y9-binary-columns-list", category: "placevalues",
      prompt: "What are the 8 place values of a byte, written from left to right?",
      answers: ["128, 64, 32, 16, 8, 4, 2, 1"],
      keywords: [/128\D+64\D+32\D+16\D+8\D+4\D+2\D+1\b/],
      distractors: [
        "256, 128, 64, 32, 16, 8, 4, 2",
        "128, 64, 32, 16, 8, 4, 2, 0",
        "1, 2, 4, 8, 16, 32, 64, 128",
        "100, 64, 32, 16, 8, 4, 2, 1",
        "128, 64, 16, 8, 4, 2, 1, 0"
      ]
    },
    {
      id: "y9-msb-value", category: "placevalues",
      prompt: "In an 8-bit binary number, what is the value of the leftmost (first) column?",
      answers: ["128"],
      distractors: [
        "1",
        "64",
        "256",
        "8",
        "100"
      ]
    },
    {
      id: "y9-lsb-value", category: "placevalues",
      prompt: "In an 8-bit binary number, what is the value of the rightmost (last) column?",
      answers: ["1"],
      distractors: [
        "0",
        "2",
        "128",
        "8",
        "10"
      ]
    },
    {
      id: "y9-max-8bit", category: "placevalues",
      prompt: "What is the largest denary number you can make with 8 bits?",
      answers: ["255"],
      distractors: [
        "256",
        "254",
        "128",
        "999",
        "100"
      ],
      note: "Every column full of 1s: 128+64+32+16+8+4+2+1 = 255."
    },
    {
      id: "y9-bits-per-byte", category: "placevalues",
      prompt: "How many bits make up one byte?",
      answers: ["8"],
      distractors: [
        "4",
        "16",
        "1",
        "2",
        "10"
      ]
    },
    {
      id: "y9-conv-bin-to-den-method", category: "converting",
      prompt: "How do you convert a binary number to denary?",
      answers: ["Add together the place values of every column that has a 1 in it"],
      keywords: [/add.*column.*has.*\b1\b/i],
      distractors: [
        "Add together the place values of every column that has a 0 in it",
        "Multiply every column's place value by 2, whether it is a 1 or a 0",
        "Write down each digit's place value in reverse order",
        "Add together only the two largest place values in the number",
        "Divide the whole binary number by 2 as many times as it has digits"
      ]
    },
    {
      id: "y9-conv-den-to-bin-start", category: "converting",
      prompt: "When converting denary to binary, which column do you start with?",
      answers: ["The largest column, 128"],
      distractors: [
        "The smallest column, 1",
        "The middle column, 16",
        "Whichever column is easiest to work out first",
        "The 10s column, like denary",
        "The 2s column"
      ]
    },
    {
      id: "y9-conv-den-to-bin-nofit", category: "converting",
      prompt: "When converting denary to binary, what do you write in a column that does not fit?",
      answers: ["0"],
      distractors: [
        "1",
        "Leave it blank",
        "A dash",
        "Whatever is left over",
        "2"
      ]
    },
    {
      id: "y9-conv-leading-zeros", category: "converting",
      prompt: "Does an 8-bit binary answer ever have fewer than 8 digits?",
      answers: ["No, missing columns are filled in with leading zeros"],
      distractors: [
        "Yes, columns that are not needed can just be left out",
        "Yes, but only if the denary number is smaller than 10",
        "No, but only because binary numbers are always written backwards",
        "Yes, leading zeros are removed once the conversion is finished",
        "No, because every binary number only ever has exactly 4 digits"
      ],
      note: "Write all 8 digits every time, including any leading 0s."
    },
    {
      id: "y9-conv-hex-to-den-method", category: "converting",
      prompt: "How do you convert a 2-digit hex number to denary?",
      answers: ["Multiply the left digit by 16, then add the right digit"],
      keywords: [/multiply\D*(the\s+)?left\D*16.*add\D*(the\s+)?right/i],
      distractors: [
        "Multiply the right digit by 16, then add the left digit",
        "Add the left digit to the right digit, then multiply the total by 16",
        "Multiply the left digit by 10, then add the right digit",
        "Multiply both digits by 16 and add the two results together",
        "Add 16 to the left digit, then multiply by the right digit"
      ]
    },
    {
      id: "y9-conv-den-to-hex-method", category: "converting",
      prompt: "How do you convert a denary number to a 2-digit hex number?",
      answers: ["Divide by 16 for the left digit, then use the remainder as the right digit"],
      keywords: [/divide\D*16.*left.*remainder.*right/i],
      distractors: [
        "Divide by 10 for the left digit, then use the remainder as the right digit",
        "Multiply by 16 for the left digit, then subtract for the right digit",
        "Divide by 16 for the right digit, then use the remainder as the left digit",
        "Add 16 to the number, then split the result into two digits",
        "Divide by 2 eight times and read off the remainders"
      ]
    },
    {
      id: "y9-conv-hex-remainder-10plus", category: "converting",
      prompt: "When converting denary to hex, what do you do if a digit works out to be 10 or more?",
      answers: ["Write it as the matching hex letter, A to F"],
      distractors: [
        "Write it as two separate denary digits instead",
        "Round it down to 9, the highest single denary digit",
        "Carry the extra amount into the next column along",
        "Write it as a 0 and note the overflow separately",
        "Leave it as a two-digit denary number in that one column"
      ]
    },
    {
      id: "y9-conv-hex-3digit", category: "converting",
      prompt: "If a denary number needs a hex digit worth 256s as well as 16s and 1s, how many hex digits will the answer have?",
      answers: ["3"],
      distractors: [
        "2",
        "4",
        "1",
        "16",
        "256"
      ],
      note: "256 is 16 x 16, so it is the next column along once 2 hex digits run out of room."
    },
    {
      id: "y9-add-rule-00", category: "addition",
      prompt: "In binary addition, what do you write for a column total of 0 + 0?",
      answers: ["Write 0, carry 0"],
      // These four cards' answers are all "Write X, carry Y" with X/Y
      // swapped between them - identical word sets, so only checking
      // digit order (not just presence) tells them apart. "Write" is
      // left out of the pattern since a student may reasonably drop it.
      keywords: [/0\D*carry\D*0/i],
      distractors: [
        "Write 1, carry 0",
        "Write 0, carry 1",
        "Write 1, carry 1",
        "Write 2, carry 0",
        "Write 0, carry 2"
      ]
    },
    {
      id: "y9-add-rule-01", category: "addition",
      prompt: "In binary addition, what do you write for a column total of 0 + 1?",
      answers: ["Write 1, carry 0"],
      keywords: [/1\D*carry\D*0/i],
      distractors: [
        "Write 0, carry 0",
        "Write 0, carry 1",
        "Write 1, carry 1",
        "Write 2, carry 0",
        "Write 1, carry 2"
      ]
    },
    {
      id: "y9-add-rule-11", category: "addition",
      prompt: "In binary addition, what do you write for a column total of 1 + 1?",
      answers: ["Write 0, carry 1"],
      keywords: [/0\D*carry\D*1/i],
      distractors: [
        "Write 1, carry 0",
        "Write 0, carry 0",
        "Write 1, carry 1",
        "Write 2, carry 0",
        "Write 0, carry 2"
      ]
    },
    {
      id: "y9-add-rule-111", category: "addition",
      prompt: "In binary addition, what do you write for a column total of 1 + 1 + 1?",
      answers: ["Write 1, carry 1"],
      keywords: [/1\D*carry\D*1/i],
      distractors: [
        "Write 0, carry 1",
        "Write 1, carry 0",
        "Write 0, carry 0",
        "Write 2, carry 1",
        "Write 1, carry 2"
      ]
    },
    {
      id: "y9-add-direction", category: "addition",
      prompt: "Which direction do you work when adding two binary numbers?",
      answers: ["Right to left, like denary addition"],
      // "Right to left, but only for the first four columns" has the
      // right phrase but wrongly narrows it to just some columns.
      keywords: [/^(?!.*\bonly\b).*right\s+to\s+left/i],
      distractors: [
        "Left to right, the opposite of denary addition",
        "Whichever direction has fewer 1s first",
        "Top to bottom, one number at a time",
        "Right to left, but only for the first four columns",
        "It does not matter which direction you use"
      ]
    },
    {
      id: "y9-add-carry-move", category: "addition",
      prompt: "What do you do with a carry that comes out of a column?",
      answers: ["Add it into the next column to the left"],
      keywords: [{ required: [["left"]], excluded: ["right"] }],
      distractors: [
        "Add it into the next column to the right",
        "Ignore it unless the final answer is wrong",
        "Write it underneath the final answer",
        "Add it to the very first column again",
        "Subtract it from the next column along"
      ]
    },
    {
      id: "y9-carry-chain-def", category: "addition",
      prompt: "What is a carry chain?",
      answers: ["A carry that keeps landing on more 1s, producing another carry each time"],
      distractors: [
        "A carry that is lost completely because the final answer does not have enough digits for it",
        "A rule that says a binary number can never be added more than once",
        "A separate table used only for adding hex numbers together",
        "A shortcut that skips over columns which are both 0",
        "A method for converting binary numbers straight into hex"
      ],
      note: "The chain keeps moving left as long as it keeps landing on 1s."
    },
    {
      id: "y9-carry-chain-stop", category: "addition",
      prompt: "What makes a carry chain stop?",
      answers: ["Landing on a column where both bits are 0"],
      keywords: [{ required: [["0"]], excluded: ["1"] }],
      distractors: [
        "Landing on a column where both bits are 1",
        "Reaching the leftmost column of the number",
        "Running out of carries left to add",
        "Landing on a column that is already correct",
        "Reaching exactly four columns along"
      ],
      note: "That column becomes a 1 with nothing left to carry."
    },
    {
      id: "y9-carry-chain-1111", category: "addition",
      prompt: "Why can adding just 1 to 00001111 change four digits at once?",
      answers: ["The carry chains through every column of 1s until it reaches a 0"],
      distractors: [
        "Binary addition always changes exactly four digits per calculation",
        "Adding 1 always flips every digit in the whole number",
        "00001111 is a special case that ignores the normal addition rules",
        "The extra digit has to be shared out evenly across the whole number",
        "Four is the maximum number of columns a carry chain can ever travel"
      ]
    },
    {
      id: "y9-what-is-hex", category: "hex",
      prompt: "What is hexadecimal?",
      answers: ["A number system with 16 possible digits, using 0-9 then A-F"],
      keywords: [{ required: [["16"], ["9"], ["f"]], excluded: ["8", "10", "p"] }],
      distractors: [
        "A number system with 8 possible digits, using 0-7 only",
        "A number system with 16 possible digits, using only the letters A-P",
        "A shorthand way of writing denary numbers with commas removed",
        "A number system with 10 possible digits, the same as denary",
        "A version of binary that uses 4 digits instead of 2"
      ]
    },
    {
      id: "y9-why-hex", category: "hex",
      prompt: "Why is hexadecimal used instead of binary?",
      answers: ["One hex digit represents exactly 4 bits, so a byte fits in just 2 hex digits"],
      keywords: [/represents?\D*4\D*bits?.*\b2\b.*hex\s*digit/i],
      distractors: [
        "One hex digit represents exactly 2 bits, so a whole byte needs 4 hex digits instead of 2",
        "Hexadecimal uses less electricity to store than binary does",
        "Hexadecimal is the number system computers actually store data in",
        "One hex digit represents a whole byte all on its own",
        "Hexadecimal numbers are always exactly the same length as denary numbers"
      ]
    },
    {
      id: "y9-hex-digit-A", category: "hex",
      prompt: "What denary value does the hex digit A represent?",
      answers: ["10"],
      distractors: [
        "9",
        "11",
        "16",
        "1",
        "0"
      ]
    },
    {
      id: "y9-hex-digit-B", category: "hex",
      prompt: "What denary value does the hex digit B represent?",
      answers: ["11"],
      distractors: [
        "10",
        "12",
        "2",
        "16",
        "1"
      ]
    },
    {
      id: "y9-hex-digit-C", category: "hex",
      prompt: "What denary value does the hex digit C represent?",
      answers: ["12"],
      distractors: [
        "11",
        "13",
        "3",
        "16",
        "2"
      ]
    },
    {
      id: "y9-hex-digit-D", category: "hex",
      prompt: "What denary value does the hex digit D represent?",
      answers: ["13"],
      distractors: [
        "12",
        "14",
        "4",
        "16",
        "3"
      ]
    },
    {
      id: "y9-hex-digit-E", category: "hex",
      prompt: "What denary value does the hex digit E represent?",
      answers: ["14"],
      distractors: [
        "13",
        "15",
        "4",
        "16",
        "5"
      ]
    },
    {
      id: "y9-hex-digit-F", category: "hex",
      prompt: "What denary value does the hex digit F represent?",
      answers: ["15"],
      distractors: [
        "14",
        "16",
        "5",
        "1",
        "0"
      ]
    },
    {
      id: "y9-hex-left-digit-worth", category: "hex",
      prompt: "In a 2-digit hex number, what do you multiply the left digit by?",
      answers: ["16"],
      distractors: [
        "1",
        "10",
        "2",
        "4",
        "256"
      ]
    },
    {
      id: "y9-hex-right-digit-worth", category: "hex",
      prompt: "In a 2-digit hex number, what do you multiply the right digit by?",
      answers: ["1"],
      distractors: [
        "16",
        "10",
        "2",
        "4",
        "0"
      ]
    },
    {
      id: "y9-hex-bits-per-digit", category: "hex",
      prompt: "How many bits does one hexadecimal digit represent?",
      answers: ["4"],
      distractors: [
        "1",
        "2",
        "8",
        "16",
        "3"
      ]
    },
    {
      id: "y9-hex-digits-per-byte", category: "hex",
      prompt: "How many hex digits are needed to represent one whole byte?",
      answers: ["2"],
      distractors: [
        "1",
        "4",
        "8",
        "16"
      ]
    },
    {
      id: "y9-hex-columns-worth", category: "hex",
      prompt: "What are hexadecimal's first two column values, from right to left?",
      answers: ["1 and 16"],
      distractors: [
        "1 and 10",
        "1 and 2",
        "1 and 8",
        "10 and 16",
        "16 and 256"
      ]
    }
  ]
});
