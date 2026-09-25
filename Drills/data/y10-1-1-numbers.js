// Year 10, 1.1 Number Systems
// Loaded by Drills/index.html?drill=y10-1-1-numbers
DrillData.register("y10-1-1-numbers", {
  title: "Year 10, 1.1 Number Systems",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["bases", "Number Bases & Symbols"],
    ["hex", "Hexadecimal"],
    ["addition", "Binary Addition"],
    ["shifts", "Binary Shifts"],
    ["twos", "Two's Complement"],
    ["units", "Units & Terminology"],
    ["lsbmsb", "LSB & MSB"],
    ["placevalues", "Place Values"],
    ["converting", "Converting Between Systems"]
  ],
  cards: [
    {
      id: "why-binary", category: "bases",
      prompt: "Why do computers use binary?",
      answers: ["Electronic components in a computer have two states, often represented as 0 and 1"],
      distractors: [
        "Binary is the only number system a human can read without a calculator",
        "Electronic components can hold ten separate voltage levels, one for each denary digit",
        "Binary numbers are always shorter than the denary number they represent",
        "Binary uses less electricity because each digit is smaller than a denary digit",
        "Computers were built before other number systems had been invented",
        "It lets a computer store negative numbers without any extra circuits"
      ]
    },
    {
      id: "base-denary", category: "bases",
      prompt: "What base is the denary number system?",
      answers: ["Base 10"],
      distractors: ["Base 2", "Base 16", "Base 8", "Base 12", "Base 1", "Base 100"]
    },
    {
      id: "base-binary", category: "bases",
      prompt: "What base is the binary number system?",
      answers: ["Base 2"],
      distractors: ["Base 10", "Base 16", "Base 8", "Base 1", "Base 4", "Base 0"]
    },
    {
      id: "base-hex", category: "bases",
      prompt: "What base is the hexadecimal number system?",
      answers: ["Base 16"],
      distractors: ["Base 10", "Base 2", "Base 8", "Base 6", "Base 32", "Base 15"]
    },
    {
      id: "symbols-binary", category: "bases",
      prompt: "What symbols does the binary number system use?",
      answers: ["0 and 1"],
      // A bag-of-words check alone lets "0, 1 and 2" pass since 0 and 1
      // are both present - excluded rules out every distractor that adds
      // a digit binary doesn't use.
      keywords: [{ required: [["0"], ["1"]], excluded: ["2", "3", "7", "9"] }],
      distractors: ["0, 1 and 2", "1 and 2", "0 to 9", "0 to 7", "−1 and 1", "0, 1, 2 and 3"]
    },
    {
      id: "symbols-denary", category: "bases",
      prompt: "What symbols does the denary number system use?",
      answers: ["0 to 9"],
      keywords: [{ required: [["0"], ["9"]], excluded: ["10", "15", "a", "f"] }],
      distractors: ["0 to 10", "1 to 9", "1 to 10", "0 and 1", "0 to 9 and A to F", "0 to 15"]
    },
    {
      id: "symbols-hex", category: "bases",
      prompt: "What symbols does the hexadecimal number system use?",
      answers: ["0 to 9 and A to F"],
      keywords: [{ required: [["0"], ["9"], ["a"], ["f"]], excluded: ["z", "e", "g", "15"] }],
      distractors: ["0 to 9 and A to Z", "0 to 15", "A to F only", "0 to 9 and A to E", "0 to 9 and A to G", "1 to 9 and A to F"]
    },
    {
      id: "uses-hex", category: "hex",
      type: "multi", show: 6,
      prompt: "Which of these are real uses of hexadecimal in computer science? (Pick every one shown that is correct.)",
      answers: ["HTML colour codes", "MAC addresses", "IPv6 addresses", "Memory addresses", "Assembly / machine code values"],
      distractors: ["IPv4 addresses", "Denary temperature readings", "Wi‑Fi passwords", "Spreadsheet cell references", "Screen sizes in centimetres", "File names"]
    },
    {
      id: "why-hex-not-binary", category: "hex",
      prompt: "Why represent data in hexadecimal instead of binary?",
      answers: ["It represents the same binary data using far fewer digits, so it is easier to read"],
      distractors: [
        "It is able to store much larger numbers than binary ever could",
        "A processor is only able to understand hexadecimal, never binary",
        "It removes the need for a computer to use the letters A to F",
        "Hexadecimal values never have to be converted back into binary",
        "A computer is able to process hexadecimal faster than binary",
        "It takes up less memory than the binary data that it represents"
      ]
    },
    {
      id: "add-0-0", category: "addition",
      prompt: "In binary addition, what is 0 + 0?",
      answers: ["0"],
      // A bare "0" answer needs an exact match, not just "0 present
      // somewhere" - otherwise "0 carry 1" (a different card's answer)
      // would also pass here.
      keywords: [{ required: [["0"]], excluded: ["carry", "1"] }],
      distractors: ["1", "10", "0 carry 1", "1 carry 1", "2", "0 carry 0"]
    },
    {
      id: "add-0-1", category: "addition",
      prompt: "In binary addition, what is 0 + 1?",
      answers: ["1"],
      keywords: [{ required: [["1"]], excluded: ["carry", "0"] }],
      distractors: ["0", "10", "1 carry 1", "0 carry 1", "2", "11"]
    },
    {
      id: "add-1-0", category: "addition",
      prompt: "In binary addition, what is 1 + 0?",
      answers: ["1"],
      keywords: [{ required: [["1"]], excluded: ["carry", "0"] }],
      distractors: ["0", "10", "1 carry 1", "0 carry 1", "2", "11"]
    },
    {
      id: "add-1-1", category: "addition",
      prompt: "In binary addition, what is 1 + 1?",
      answers: ["0 carry 1"],
      // "0 carry 1" and "1 carry 1" (add-1-1-1's answer) are the exact
      // same words with the first digit swapped - a bag-of-words check
      // can't tell them apart, so this checks digit order directly.
      keywords: [/0\D*carry\D*1/i],
      distractors: ["1 carry 1", "1", "0", "1 carry 0", "0 carry 0", "11"],
      note: "The column result is 0 and a 1 is carried into the next column (1 + 1 = binary 10)."
    },
    {
      id: "add-1-1-1", category: "addition",
      prompt: "In binary addition, what is 1 + 1 + 1?",
      answers: ["1 carry 1"],
      keywords: [/1\D*carry\D*1/i],
      distractors: ["0 carry 1", "1", "1 carry 0", "0 carry 0", "11", "3"],
      note: "The column result is 1 and a 1 is carried (1 + 1 + 1 = binary 11)."
    },
    {
      id: "overflow", category: "addition",
      prompt: "What is it called when there is not enough space to store the result of a binary addition?",
      answers: ["Overflow"],
      distractors: ["Underflow", "Carry error", "Rounding error", "Truncation", "Buffer overrun", "Wraparound"],
      note: "Overflow happens when the result needs more bits than the register can hold; the extra carry bit is lost."
    },
    {
      id: "add-carry-chain-apply", category: "addition",
      prompt: "Add these two 8-bit binary numbers: 00101101 + 00011011. Give your answer as an 8-bit binary number.",
      answers: ["01001000"],
      keywords: [/^\s*0\s*1\s*0\s*0\s*1\s*0\s*0\s*0\s*$/],
      distractors: ["01001001", "01000111", "00110110", "01011000"],
      note: "Work from the right, carrying into the next column whenever a column totals 2 or 3: 00101101 + 00011011 = 01001000 (45 + 27 = 72).",
      randomize: function () {
        var a = randInt(1, 120), b = randInt(1, 120);
        var sum = a + b;
        var bitsA = bin8(a), bitsB = bin8(b), bitsSum = bin8(sum);
        var noCarry = bin8(a ^ b);
        return {
          prompt: "Add these two 8-bit binary numbers: " + bitsA + " + " + bitsB + ". Give your answer as an 8-bit binary number.",
          answers: [bitsSum],
          keywords: [new RegExp("^\\s*" + bitsSum.split("").join("\\s*") + "\\s*$")],
          distractors: dedupeDistractors(bitsSum, [noCarry, bin8(sum - 1), bin8(sum + 1), bin8(sum + 8)]),
          note: "Work from the right, carrying into the next column whenever a column totals 2 or 3: " + bitsA + " + " + bitsB + " = " + bitsSum + " (" + a + " + " + b + " = " + sum + ")."
        };
      }
    },

    {
      id: "shift-left-1", category: "shifts",
      prompt: "What is the effect of a logical LEFT shift of 1 place on an unsigned binary number?",
      answers: ["Multiplies the number by 2"],
      // "Multiply" plus the specific multiplier - a sibling distractor
      // for this exact card just swaps in "4"/"10", and "divides" (a
      // different distractor) must not accidentally satisfy this either.
      keywords: [{ required: [["multiply"], ["2"]] }],
      distractors: ["Divides the number by 2", "Multiplies the number by 4", "Multiplies the number by 10", "Adds 1 to the number", "Divides the number by 10", "Leaves the number unchanged"],
      note: "Each place a number shifts left multiplies it by 2 (2¹)."
    },
    {
      id: "shift-left-2", category: "shifts",
      prompt: "What is the effect of a logical LEFT shift of 2 places?",
      answers: ["Multiplies the number by 4"],
      keywords: [{ required: [["multiply"], ["4"]] }],
      distractors: ["Multiplies the number by 2", "Multiplies the number by 8", "Divides the number by 4", "Multiplies the number by 16", "Adds 2 to the number", "Multiplies the number by 3"],
      note: "2 places left = × 2² = × 4."
    },
    {
      id: "shift-left-3", category: "shifts",
      prompt: "What is the effect of a logical LEFT shift of 3 places?",
      answers: ["Multiplies the number by 8"],
      keywords: [{ required: [["multiply"], ["8"]] }],
      distractors: ["Multiplies the number by 4", "Multiplies the number by 16", "Multiplies the number by 6", "Divides the number by 8", "Multiplies the number by 3", "Adds 3 to the number"],
      note: "3 places left = × 2³ = × 8."
    },
    {
      id: "shift-right-1", category: "shifts",
      prompt: "What is the effect of a logical RIGHT shift of 1 place on an unsigned binary number?",
      answers: ["Divides the number by 2, rounding down if needed"],
      // The auto-derived fallback needed 4 of {divide, number, 2,
      // rounding, down, if, needed}, so a real, correct short answer
      // like "divides by 2" (without spelling out "rounding down")
      // failed. "Divide" and the specific number are both essential -
      // a distractor for this exact card just swaps in "4"/"10"/"1" or
      // "multiplies" - but "rounding down" is safe to make optional.
      keywords: [
        { required: [["divide"], ["2"]], optional: ["round", "rounding", "down"] }
      ],
      distractors: [
        "Multiplies the number by 2, rounding down if needed",
        "Divides the number by 4, rounding down if needed",
        "Divides the number by 10, rounding down if needed",
        "Subtracts 1 from the number, every single time",
        "Leaves the number completely unchanged either way",
        "Divides the number by 1, rounding down if needed"
      ],
      note: "Each place right = ÷ 2. Any bit shifted off the end is lost, so odd numbers round down."
    },
    {
      id: "shift-right-2", category: "shifts",
      prompt: "What is the effect of a logical RIGHT shift of 2 places?",
      answers: ["Divides the number by 4, rounding down if needed"],
      // Same fix as shift-right-1 - "divide" plus the specific number
      // are essential (a sibling distractor for this exact card just
      // swaps in "2"/"8"/"16"/"3"), "rounding down" is optional detail.
      keywords: [
        { required: [["divide"], ["4"]], optional: ["round", "rounding", "down"] }
      ],
      distractors: [
        "Divides the number by 2, rounding down if needed",
        "Divides the number by 8, rounding down if needed",
        "Multiplies the number by 4, rounding down if needed",
        "Divides the number by 16, rounding down if needed",
        "Subtracts 2 from the number, every single time",
        "Divides the number by 3, rounding down if needed"
      ],
      note: "2 places right = ÷ 2² = ÷ 4."
    },
    {
      id: "shift-loss", category: "shifts",
      prompt: "What happens to bits that are shifted out of the end of a register during a logical shift?",
      answers: ["They are simply lost, so data or precision can be lost"],
      // The auto-derived fallback required 4 of {they, simply, lost,
      // data, precision, can} - so even "the bits are lost" failed.
      // "Lost" (or an equivalent word) IS the whole answer; explicit
      // keywords with no optional requirement fix that (James: this
      // should be acceptable). `excluded` guards against the "Nothing
      // is ever lost..." distractor, which also contains "lost" but
      // means the opposite.
      keywords: [
        {
          required: [["lost", "discarded", "gone", "dropped", "disappear", "disappears"]],
          excluded: ["nothing", "never", "not"]
        }
      ],
      distractors: [
        "Nothing is ever lost during a logical shift at all",
        "Only the leading zeros are ever removed by a shift",
        "They move around to the other end of the register",
        "They get stored inside the carry flag permanently",
        "The whole number simply becomes zero afterwards",
        "Only the sign of the number changes, nothing else"
      ]
    },
    {
      id: "shift-left-apply", category: "shifts",
      prompt: "An 8-bit register holds 00010110. What is the result of a logical shift LEFT by 2 places? (Zero-fill on the right; bits shifted off the left are lost.)",
      answers: ["01011000"],
      keywords: [/^\s*0\s*1\s*0\s*1\s*1\s*0\s*0\s*0\s*$/],
      distractors: ["01011010", "00101100", "01011001", "10110000"],
      note: "Every bit moves 2 places left, zeros fill in on the right: 00010110 -> 01011000.",
      randomize: function () {
        var val = randInt(1, 63);
        var n = randInt(1, 3);
        var result = (val << n) & 0xFF;
        var bitsIn = bin8(val), bitsOut = bin8(result);
        return {
          prompt: "An 8-bit register holds " + bitsIn + ". What is the result of a logical shift LEFT by " + n + " place(s)? (Zero-fill on the right; bits shifted off the left are lost.)",
          answers: [bitsOut],
          keywords: [new RegExp("^\\s*" + bitsOut.split("").join("\\s*") + "\\s*$")],
          distractors: dedupeDistractors(bitsOut, [bin8((val << (n - 1)) & 0xFF), bin8((val << (n + 1)) & 0xFF), bin8(val >>> n)]),
          note: "Every bit moves " + n + " place(s) left, zero(s) fill in on the right: " + bitsIn + " -> " + bitsOut + "."
        };
      }
    },
    {
      id: "shift-right-apply", category: "shifts",
      prompt: "An 8-bit register holds 11010000. What is the result of a logical shift RIGHT by 3 places? (Zero-fill on the left; bits shifted off the right are lost.)",
      answers: ["00011010"],
      keywords: [/^\s*0\s*0\s*0\s*1\s*1\s*0\s*1\s*0\s*$/],
      distractors: ["00011011", "10001101", "00011000", "00110100"],
      note: "Every bit moves 3 places right, zeros fill in on the left: 11010000 -> 00011010.",
      randomize: function () {
        var val = randInt(64, 255);
        var n = randInt(1, 3);
        var result = val >>> n;
        var bitsIn = bin8(val), bitsOut = bin8(result);
        return {
          prompt: "An 8-bit register holds " + bitsIn + ". What is the result of a logical shift RIGHT by " + n + " place(s)? (Zero-fill on the left; bits shifted off the right are lost.)",
          answers: [bitsOut],
          keywords: [new RegExp("^\\s*" + bitsOut.split("").join("\\s*") + "\\s*$")],
          distractors: dedupeDistractors(bitsOut, [bin8(val >>> (n - 1)), bin8(val >>> (n + 1)), bin8((val << n) & 0xFF)]),
          note: "Every bit moves " + n + " place(s) right, zero(s) fill in on the left: " + bitsIn + " -> " + bitsOut + "."
        };
      }
    },

    {
      id: "twos-purpose", category: "twos",
      prompt: "Two's complement lets a fixed number of bits represent what?",
      answers: ["Both positive and negative whole numbers together"],
      distractors: [
        "Only numbers larger than 255, nothing smaller",
        "Fractions and numbers with decimal points",
        "Hexadecimal digits, without converting them",
        "Text characters, in place of numbers",
        "Only positive numbers, just processed faster",
        "Numbers written only in base 10 form"
      ],
      note: "In two's complement the most significant bit has a negative place value, which is how negative numbers are stored."
    },
    {
      id: "twos-msb-value", category: "twos",
      prompt: "In an 8‑bit two's complement number, what is the place value of the most significant (leftmost) bit?",
      answers: ["−128"],
      distractors: ["128", "−1", "−256", "255", "−127", "64"]
    },
    {
      id: "twos-negate", category: "twos",
      prompt: "How do you find the two's complement (the negative) of a positive binary number?",
      answers: ["Invert every bit, then add 1"],
      // Bag-of-words alone lets "Invert every bit" (missing the add-1
      // step), "Add 1, then invert" (right words, wrong order) and
      // "...then subtract 1" (wrong verb) all pass - a regex enforces
      // both the invert-before-add ORDER and the correct verb.
      keywords: [/(invert|flip).*add\D*1/i],
      distractors: ["Invert every bit", "Add 1, then invert every bit", "Invert every bit, then subtract 1", "Swap the first and last bits", "Reverse the order of all the bits", "Add 1 to the number"]
    },
    {
      id: "twos-is-negative", category: "twos",
      prompt: "In two's complement, how can you tell a number is negative?",
      answers: ["The most significant bit is 1"],
      keywords: [/most\s+significant\s+bit\s+is\s+1\b/i],
      distractors: ["The least significant bit is 1", "The most significant bit is 0", "It contains more 1s than 0s", "The last two bits are both 1", "There is a carry out of the top bit", "It is written with a minus sign in front"]
    },
    {
      id: "twos-range-8bit", category: "twos",
      prompt: "What is the denary range of an 8‑bit two's complement number?",
      answers: ["−128 to 127"],
      distractors: ["0 to 255", "−127 to 128", "−128 to 128", "−255 to 255", "0 to 127", "−256 to 255"]
    },
    {
      id: "twos-denary-to-comp-apply", category: "twos",
      prompt: "Convert the denary value -45 to 8-bit two's complement.",
      answers: ["11010011"],
      keywords: [/^\s*1\s*1\s*0\s*1\s*0\s*0\s*1\s*1\s*$/],
      distractors: ["11010010", "00101101", "11010100", "10101101"],
      note: "Write 45 in 8-bit binary (00101101), flip every bit (11010010), then add 1: 11010011.",
      randomize: function () {
        var n = randInt(1, 127);
        var bitsPositive = bin8(n);
        var bitsComp = bin8(256 - n);
        var bitsFlipped = bin8(255 - n);
        return {
          prompt: "Convert the denary value -" + n + " to 8-bit two's complement.",
          answers: [bitsComp],
          keywords: [new RegExp("^\\s*" + bitsComp.split("").join("\\s*") + "\\s*$")],
          distractors: dedupeDistractors(bitsComp, [bitsPositive, bitsFlipped, bin8(256 - n - 1), bin8(256 - n + 1)]),
          note: "Write " + n + " in 8-bit binary (" + bitsPositive + "), flip every bit (" + bitsFlipped + "), then add 1: " + bitsComp + "."
        };
      }
    },
    {
      id: "twos-comp-to-denary-apply", category: "twos",
      prompt: "The 8-bit two's complement number 11010011 represents which denary value?",
      answers: ["-45"],
      keywords: [/^\s*-\s*45\s*$/],
      distractors: ["45", "-46", "-44", "211"],
      note: "The leading 1 means it is negative. Flip every bit (00101100), add 1 (00101101 = 45), so the value is -45.",
      randomize: function () {
        var n = randInt(1, 127);
        var bitsComp = bin8(256 - n);
        return {
          prompt: "The 8-bit two's complement number " + bitsComp + " represents which denary value?",
          answers: ["-" + n],
          keywords: [new RegExp("^\\s*-\\s*" + n + "\\s*$")],
          distractors: dedupeDistractors("-" + n, [String(n), "-" + (n - 1), "-" + (n + 1), String(256 - n)]),
          note: "The leading 1 means it is negative. Flip every bit and add 1 to find the size: " + n + ", so the value is -" + n + "."
        };
      }
    },

    {
      id: "term-bit", category: "units",
      prompt: "What is the name for the smallest unit of data, which holds a single 0 or 1?",
      answers: ["Bit"],
      distractors: ["Byte", "Nibble", "Character", "Digit", "Kibibyte", "Word"]
    },
    {
      id: "term-nibble", category: "units",
      prompt: "What is the name for a group of 4 bits?",
      answers: ["Nibble"],
      distractors: ["Byte", "Word", "Bit", "Kibibyte", "Octet", "Half‑word"]
    },
    {
      id: "term-byte", category: "units",
      prompt: "What is the name for a group of 8 bits?",
      answers: ["Byte"],
      distractors: ["Nibble", "Word", "Kibibyte", "Bit", "Kilobit", "Double nibble"]
    },
    {
      id: "bits-in-nibble", category: "units",
      prompt: "How many bits are there in a nibble?",
      answers: ["4"],
      distractors: ["8", "2", "1", "16", "0.5", "3"]
    },
    {
      id: "bits-in-byte", category: "units",
      prompt: "How many bits are there in a byte?",
      answers: ["8"],
      distractors: ["4", "16", "1", "1024", "2", "10"]
    },
    {
      id: "nibbles-in-byte", category: "units",
      prompt: "How many nibbles are there in a byte?",
      answers: ["2"],
      distractors: ["4", "8", "1", "16", "0.5", "3"]
    },
    {
      id: "kibibyte-bytes", category: "units",
      prompt: "In the Cambridge IGCSE 0478 course, how many bytes are there in 1 kibibyte (KiB)?",
      answers: ["1024"],
      distractors: ["1000", "1", "8", "512", "2048", "100"],
      note: "0478 uses the IEC binary prefixes: 1 KiB = 1024 bytes. (The SI unit 1 kilobyte, kB, is 1000 bytes.)"
    },
    {
      id: "kibi-vs-kilo", category: "units",
      prompt: "Which unit does Cambridge IGCSE 0478 use for a multiple of 1024 bytes?",
      answers: ["Kibibyte (KiB)"],
      distractors: ["Kilobyte (kB)", "Kilobit (Kb)", "Megabyte (MB)", "Binary byte (Bb)", "Kibbyte (KB)", "Kilo unit (K)"],
      note: "KiB, MiB, GiB, TiB, PiB, EiB are each 1024 times the one below. Kilobyte (kB) means exactly 1000 bytes."
    },
    {
      id: "mebibyte-kibibytes", category: "units",
      prompt: "How many kibibytes (KiB) are there in 1 mebibyte (MiB)?",
      answers: ["1024"],
      distractors: ["1000", "1", "8", "1048576", "512", "100"]
    },
    {
      id: "unit-order-largest", category: "units",
      prompt: "Which of these units is the largest?",
      answers: ["Kibibyte (KiB)"],
      distractors: ["Single bit", "One nibble", "Single byte", "Two nibbles", "Half a byte"]
    },
    {
      id: "unit-order-smallest", category: "units",
      prompt: "Which of these units is the smallest?",
      answers: ["Bit"],
      distractors: ["Nibble", "Byte", "Kibibyte (KiB)", "Two bits", "Half a nibble"]
    },
    {
      id: "msb-meaning", category: "lsbmsb",
      prompt: "What does MSB stand for?",
      answers: ["Most Significant Bit"],
      // The exact phrase, not just "most" and "bit" both present - every
      // distractor here shares two of the three words with the answer.
      keywords: [/most\s+significant\s+bit\b/i],
      distractors: ["Most Significant Byte", "Maximum Signed Byte", "Main System Bit", "Middle Significant Bit", "Master Sign Bit", "Most Simple Bit"]
    },
    {
      id: "lsb-meaning", category: "lsbmsb",
      prompt: "What does LSB stand for?",
      answers: ["Least Significant Bit"],
      keywords: [/least\s+significant\s+bit\b/i],
      distractors: ["Least Significant Byte", "Lowest Stored Bit", "Last Sent Bit", "Low Speed Bus", "Left Side Bit", "Least Simple Bit"]
    },
    {
      id: "msb-which-bit", category: "lsbmsb",
      prompt: "In the 8‑bit binary number 10000000, which bit is the most significant bit?",
      answers: ["The leftmost bit (the 1)"],
      distractors: ["The rightmost bit", "The middle bit", "The last 0 on the right", "There is no most significant bit", "Every bit is equally significant", "The second bit from the left"]
    },
    {
      id: "msb-place-value-unsigned", category: "lsbmsb",
      prompt: "In an 8‑bit UNSIGNED binary number, what is the place value of the most significant bit?",
      answers: ["128"],
      distractors: ["256", "64", "1", "255", "127", "−128"]
    },
    {
      id: "lsb-place-value", category: "lsbmsb",
      prompt: "What is the place value of the least significant bit in any binary number?",
      answers: ["1"],
      distractors: ["0", "2", "8", "−1", "10", "128"]
    },
    {
      id: "pv-bit0", category: "placevalues",
      prompt: "What is the place value of bit position 0 (the rightmost bit) in binary?",
      answers: ["1"],
      distractors: ["0", "2", "10", "8", "−1"],
      note: "2⁰ = 1."
    },
    {
      id: "pv-bit1", category: "placevalues",
      prompt: "What is the place value of bit position 1 in binary?",
      answers: ["2"],
      distractors: ["1", "4", "3", "10", "8"],
      note: "2¹ = 2."
    },
    {
      id: "pv-bit2", category: "placevalues",
      prompt: "What is the place value of bit position 2 in binary?",
      answers: ["4"],
      distractors: ["2", "8", "6", "3", "16"],
      note: "2² = 4."
    },
    {
      id: "pv-bit3", category: "placevalues",
      prompt: "What is the place value of bit position 3 in binary?",
      answers: ["8"],
      distractors: ["4", "16", "6", "10", "12"],
      note: "2³ = 8."
    },
    {
      id: "pv-bit4", category: "placevalues",
      prompt: "What is the place value of bit position 4 in binary?",
      answers: ["16"],
      distractors: ["8", "32", "12", "20", "4"],
      note: "2⁴ = 16."
    },
    {
      id: "pv-bit5", category: "placevalues",
      prompt: "What is the place value of bit position 5 in binary?",
      answers: ["32"],
      distractors: ["16", "64", "24", "30", "8"],
      note: "2⁵ = 32."
    },
    {
      id: "pv-bit6", category: "placevalues",
      prompt: "What is the place value of bit position 6 in binary?",
      answers: ["64"],
      distractors: ["32", "128", "48", "60", "16"],
      note: "2⁶ = 64."
    },
    {
      id: "pv-bit7", category: "placevalues",
      prompt: "What is the place value of bit position 7 (the leftmost bit of a byte) in binary?",
      answers: ["128"],
      distractors: ["64", "256", "100", "127", "32"],
      note: "2⁷ = 128."
    },
    {
      id: "two-pow-8", category: "placevalues",
      prompt: "What is 2⁸?",
      answers: ["256"],
      distractors: ["128", "512", "255", "64", "16"]
    },
    {
      id: "values-in-8-bits", category: "placevalues",
      prompt: "How many different values can be represented using 8 bits?",
      answers: ["256"],
      distractors: ["255", "128", "512", "8", "64"],
      note: "8 bits give 2⁸ = 256 different patterns (0 to 255 for an unsigned byte)."
    },
    {
      id: "byte-place-values", category: "placevalues",
      prompt: "What are the 8 place values of a byte, written from left to right?",
      answers: ["128, 64, 32, 16, 8, 4, 2, 1"],
      // An ordered list needs the exact sequence, not just "most of the
      // same numbers present" - every distractor here shares 6+ of the
      // 8 numbers with the real answer, just reordered/altered.
      keywords: [/128\D+64\D+32\D+16\D+8\D+4\D+2\D+1\b/],
      distractors: [
        "1, 2, 4, 8, 16, 32, 64, 128",
        "256, 128, 64, 32, 16, 8, 4, 2",
        "128, 64, 32, 16, 8, 4, 2, 0",
        "100, 90, 80, 70, 60, 50, 40, 30",
        "128, 64, 16, 8, 4, 2, 1, 0"
      ]
    },
    {
      id: "bin-to-den", category: "converting",
      prompt: "How do you convert a binary number to denary?",
      answers: ["Add together the place values in every column that contains a 1"],
      // Requires "add" to actually be paired with "column...1", not just
      // present anywhere - a distractor that says "add" but multiplies,
      // or says "column" but means the 0 columns, must still fail.
      keywords: [/add.*column.*contains?.*\b1\b/i],
      distractors: [
        "Add together every single place value in the whole number",
        "Simply count up how many 1s appear in the number",
        "Multiply the place values in every column that contains a 1",
        "Add 1 onto the total for every digit in the number",
        "Add together the place values in every column that contains a 0",
        "Multiply the total number of 1s in the number by 2"
      ]
    },
    {
      id: "den-to-bin", category: "converting",
      prompt: "How can you convert a denary number to binary?",
      answers: ["Subtract the largest place value that fits, write a 1, and repeat with what is left"],
      distractors: [
        "Divide the whole number by 10, over and over again, until it reaches zero",
        "Multiply the whole number by 2, over and over again, a fixed number of times",
        "Add every one of the denary digits together, then convert that total",
        "Write the denary digits out in reverse order, then read them as binary",
        "Count upward in twos, starting from zero, until you reach the number",
        "Convert the number to hexadecimal first, then simply read that off"
      ]
    },
    {
      id: "bin-to-hex", category: "hex",
      prompt: "How do you convert a binary number to hexadecimal?",
      answers: ["Split it into groups of 4 bits and convert each group to one hex digit"],
      // Requires the literal "4" between "group" and "bit" - a groups-
      // of-3/groups-of-8 distractor otherwise passes on word overlap.
      keywords: [/group.*\b4\b.*bit/i],
      distractors: [
        "Split it into groups of 3 bits and convert each group to a digit",
        "Split it into groups of 8 bits and convert each group to a digit",
        "Convert the whole number to denary first, then divide it by 16",
        "Convert every single individual bit into its own hex digit",
        "Group the bits into pairs, then convert each pair separately",
        "Reverse the order of the bits, then read them off in fours"
      ],
      note: "One nibble (4 bits) is exactly one hexadecimal digit."
    },
    {
      id: "hex-digit-bits", category: "hex",
      prompt: "How many bits does one hexadecimal digit represent?",
      answers: ["4"],
      distractors: ["1", "2", "8", "16", "3"]
    },
    {
      id: "hex-F", category: "hex",
      prompt: "The hexadecimal digit F represents which denary value?",
      answers: ["15"],
      distractors: ["16", "14", "10", "6", "255", "12"]
    },
    {
      id: "hex-A", category: "hex",
      prompt: "The hexadecimal digit A represents which denary value?",
      answers: ["10"],
      distractors: ["1", "11", "15", "14", "16", "0"]
    },
    {
      id: "hex-to-denary-apply", category: "hex",
      prompt: "Convert the hexadecimal value 2B to denary.",
      answers: ["43"],
      keywords: [/^\s*43\s*$/],
      distractors: ["23", "42", "44", "27"],
      note: "2 x 16 = 32, plus B (11) = 43.",
      randomize: function () {
        var hi = randInt(1, 15), lo = randInt(0, 15);
        var val = hi * 16 + lo;
        var hex = hi.toString(16).toUpperCase() + lo.toString(16).toUpperCase();
        return {
          prompt: "Convert the hexadecimal value " + hex + " to denary.",
          answers: [String(val)],
          keywords: [new RegExp("^\\s*" + val + "\\s*$")],
          distractors: dedupeDistractors(val, [val - 1, val + 1, hi + lo, lo * 16 + hi]),
          note: hi + " x 16 = " + (hi * 16) + ", plus " + lo.toString(16).toUpperCase() + " (" + lo + ") = " + val + "."
        };
      }
    },
    {
      id: "denary-to-hex-apply", category: "hex",
      prompt: "Convert the denary value 172 to hexadecimal.",
      answers: ["AC"],
      keywords: [/^\s*AC\s*$/i],
      distractors: ["AB", "AD", "BC", "CA"],
      note: "172 / 16 = 10 remainder 12. 10 = A, 12 = C, so 172 = AC.",
      randomize: function () {
        var val = randInt(16, 255);
        var hex = val.toString(16).toUpperCase();
        if (hex.length < 2) hex = "0" + hex;
        var hi = Math.floor(val / 16), lo = val % 16;
        var wrongHex = ((hi + 1) % 16).toString(16).toUpperCase() + lo.toString(16).toUpperCase();
        return {
          prompt: "Convert the denary value " + val + " to hexadecimal.",
          answers: [hex],
          keywords: [new RegExp("^\\s*" + hex + "\\s*$", "i")],
          distractors: dedupeDistractors(hex, [wrongHex, hex.split("").reverse().join("")]),
          note: val + " / 16 = " + hi + " remainder " + lo + ". " + hi + " = " + hi.toString(16).toUpperCase() + ", " + lo + " = " + lo.toString(16).toUpperCase() + ", so " + val + " = " + hex + "."
        };
      }
    },
  ]
});
