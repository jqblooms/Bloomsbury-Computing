// Year 10, 1.1 Number Systems - Exam Questions
// Loaded by Drills/index.html?drill=examqs-y10-1-1
DrillData.register("examqs-y10-1-1", {
  title: "Year 10, 1.1 Number Systems - Exam Questions",
  subtitle: "Cambridge IGCSE Computer Science 0478 - real past-paper questions",
  isExamSet: true,
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["hex", "Hexadecimal"],
    ["addition", "Binary Addition"],
    ["shifts", "Binary Shifts"],
    ["twos", "Two's Complement"],
    ["converting", "Converting Between Systems"]
  ],
  cards: [
    {
      id: "y10-1-1-l2", category: "converting",
      source: "Cambridge IGCSE 0478, June 2022 Paper 11, Question 4(b)",
      marks: 3,
      stem: "The denary values 64, 101 and 242 are converted to 8-bit binary values. Give the 8-bit binary value for each denary value.",
      parts: [
        { label: "Convert 64 to 8-bit binary.", correctAnswer: "01000000" },
        { label: "Convert 101 to 8-bit binary.", correctAnswer: "01100101" },
        { label: "Convert 242 to 8-bit binary.", correctAnswer: "11110010" }
      ]
    },
    {
      id: "y10-1-1-l2-2", category: "converting",
      source: "Cambridge IGCSE 0478, June 2021 Paper 11, Question 1(a)",
      marks: 2,
      stem: "Benedict has a computer that is assigned an Internet Protocol (IP) address. The IP address is: 198.167.214.0. Convert the denary values 167 and 214 from the IP address to 8-bit binary.",
      parts: [
        { label: "Convert 167 to 8-bit binary.", correctAnswer: "10100111" },
        { label: "Convert 214 to 8-bit binary.", correctAnswer: "11010110" }
      ]
    },
    {
      id: "y10-1-1-l2-plenary", category: "addition",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 6(e)",
      marks: 3,
      stem: "Add the two binary integers using binary addition and give your answer in binary. Show all your working.",
      parts: [
        { label: "Add 00011010 + 01101110 (binary):", correctAnswer: "10001000" }
      ]
    },
    {
      id: "y10-1-1-l2-plenary-2", category: "addition",
      source: "Cambridge IGCSE 0478, October/November 2024 Paper 11, Question 3(d)",
      marks: 3,
      stem: "The character 'T' is represented by the binary ASCII number 01010100. The character 't' is represented by the binary ASCII number 01110100. Add the two binary numbers using binary addition. Give your answer in binary. Show all your working.",
      parts: [
        { label: "Add 01010100 + 01110100 (binary):", correctAnswer: "11001000" }
      ]
    },
    {
      id: "y10-1-1-l2-plenary-3", category: "addition",
      source: "Cambridge IGCSE 0478, February/March 2025 Paper 12, Question 1(b)",
      marks: 3,
      stem: "Add the two 8-bit binary numbers using binary addition. Give your answer in binary. Show all your working.",
      parts: [
        { label: "Add 10011011 + 00010011 (binary):", correctAnswer: "10101110" }
      ]
    },
    {
      id: "y10-1-1-l2-plenary-4", category: "addition",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 12, Question 1(e)",
      marks: 3,
      stem: "The 8-bit binary numbers 01100101 and 01110000 are stored in RAM and added together. Add the two binary numbers using binary addition. Give your answer in binary. You must show all your working.",
      parts: [
        { label: "Add 01100101 + 01110000 (binary):", correctAnswer: "11010101" }
      ]
    },
    {
      id: "y10-1-1-l2-plenary-5", category: "addition",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 12, Question 2(a)",
      marks: 4,
      stem: "Add the two binary numbers using binary addition. Give your answer in binary. Show all of your working.",
      parts: [
        { label: "Add 11110101 + 00111001 (binary):", correctAnswer: "100101110" }
      ]
    },
    {
      id: "y10-1-1-l3", category: "converting",
      source: "Cambridge IGCSE 0478, October/November 2024 Paper 11, Question 3(b)(i)",
      marks: 2,
      stem: "The character 'A' is represented by the denary ASCII number 65. The character 'm' is represented by the denary ASCII number 109. Convert the two denary ASCII numbers to 8-bit binary.",
      parts: [
        { label: "Convert 65 to 8-bit binary.", correctAnswer: "01000001" },
        { label: "Convert 109 to 8-bit binary.", correctAnswer: "01101101" }
      ]
    },
    {
      id: "y10-1-1-l3-2", category: "converting",
      source: "Cambridge IGCSE 0478, October/November 2024 Paper 11, Question 3(c)(i)",
      marks: 1,
      stem: "The character 'y' is represented by the binary ASCII number 01111001. Convert the binary ASCII number to denary.",
      parts: [
        { label: "Convert 01111001 to denary.", correctAnswer: "121" }
      ]
    },
    {
      id: "y10-1-1-l3-plenary", category: "hex",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 11, Question 2(c)(i)",
      marks: 2,
      stem: "A ticket number is stored as 02C. Another ticket number is stored as 10B. Convert the two ticket numbers from hexadecimal to denary.",
      parts: [
        { label: "Convert 02C to denary.", correctAnswer: "44" },
        { label: "Convert 10B to denary.", correctAnswer: "267" }
      ]
    },
    {
      id: "y10-1-1-l3-plenary-2", category: "hex",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 11, Question 2(c)(ii)",
      marks: 2,
      stem: "Convert the two denary ticket numbers into hexadecimal.",
      parts: [
        { label: "Convert 109 to hexadecimal.", correctAnswer: "6D" },
        { label: "Convert 415 to hexadecimal.", correctAnswer: "19F" }
      ]
    },
    {
      id: "y10-1-1-l3-plenary-3", category: "hex",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 12, Question 1(c)",
      marks: 2,
      stem: "A toy store gives each toy a 3-digit hexadecimal code, stored in a 12-bit register. Two toys have the hexadecimal codes 429 and 1A3. Convert the two hexadecimal codes to 12-bit binary numbers.",
      parts: [
        { label: "Convert 429 to binary.", correctAnswer: "010000101001" },
        { label: "Convert 1A3 to binary.", correctAnswer: "000110100011" }
      ]
    },
    {
      id: "y10-1-1-l3-plenary-4", category: "hex",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 12, Question 1(d)",
      marks: 2,
      stem: "Two binary numbers stored in the 12-bit registers are 100010100001 and 011100001011. Convert the two binary numbers to hexadecimal numbers.",
      parts: [
        { label: "Convert 100010100001 to hexadecimal.", correctAnswer: "8A1" },
        { label: "Convert 011100001011 to hexadecimal.", correctAnswer: "70B" }
      ]
    },
    {
      id: "y10-1-1-l3-plenary-5", category: "hex",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 6(b)",
      marks: 1,
      stem: "Convert the hexadecimal number F08 into a 12-bit binary number.",
      parts: [
        { label: "Convert F08 to binary.", correctAnswer: "111100001000" }
      ]
    },
    {
      id: "y10-1-1-l4", category: "hex",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 11, Question 3(b)",
      marks: 1,
      stem: "Convert the hexadecimal number 2A to an 8-bit binary number.",
      parts: [
        { label: "Convert 2A to binary.", correctAnswer: "00101010" }
      ]
    },
    {
      id: "y10-1-1-l4-2", category: "hex",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 11, Question 3(c)",
      marks: 1,
      stem: "Convert the hexadecimal number 101 to a 12-bit binary number.",
      parts: [
        { label: "Convert 101 to binary.", correctAnswer: "000100000001" }
      ]
    },
    {
      id: "y10-1-1-l4-3", category: "hex",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 11, Question 3(d)",
      marks: 1,
      stem: "Convert the binary number 01110001 to a hexadecimal number.",
      parts: [
        { label: "Convert 01110001 to hexadecimal.", correctAnswer: "71" }
      ]
    },
    {
      id: "y10-1-1-l4-4", category: "hex",
      source: "Cambridge IGCSE 0478, May/June 2026 Paper 11, Question 3(e)",
      marks: 1,
      stem: "Convert the binary number 001011011000 to a hexadecimal number.",
      parts: [
        { label: "Convert 001011011000 to hexadecimal.", correctAnswer: "2D8" }
      ]
    },
    {
      id: "y10-1-1-l4-plenary", category: "shifts",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 6(c)",
      marks: 1,
      stem: "Give the 8-bit binary value after a logical binary shift left of two places is performed on the binary number 00110101.",
      parts: [
        { label: "Shift 00110101 left (result): ", correctAnswer: "11010100" }
      ]
    },
    {
      id: "y10-1-1-l4-plenary-2", category: "shifts",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 13, Question 1(c)(iii)",
      marks: 1,
      stem: "A logical right shift of two places is performed on the binary number 10100100. Give the binary number that would be stored after the logical shift has taken place.",
      parts: [
        { label: "Shift 10100100 right (result): ", correctAnswer: "00101001" }
      ]
    },
    {
      id: "y10-1-1-l4-plenary-3", category: "shifts",
      source: "Cambridge IGCSE 0478, October/November 2025 Paper 12, Question 2(b)",
      marks: 3,
      stem: "A logic right shift of three places is performed on the binary number 11110101. Give the denary number for the binary number that would be stored after the logical shift of three places has occurred.",
      parts: [
        { label: "Shift 11110101 right (result): ", correctAnswer: "30" }
      ]
    },
    {
      id: "y10-1-1-l4-plenary-4", category: "twos",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 12, Question 1(g)",
      marks: 2,
      stem: "The negative denary number -22 is stored in RAM. Negative denary numbers can be represented as binary using two's complement. Give the two's complement 8-bit binary integer that would be stored for the denary number -22.",
      parts: [
        { label: "Convert -22 to 8-bit two's complement.", correctAnswer: "11101010" }
      ]
    },
    {
      id: "y10-1-1-l4-plenary-5", category: "twos",
      source: "Cambridge IGCSE 0478, May/June 2025 Paper 13, Question 1(d)",
      marks: 2,
      stem: "The two's complement 8-bit binary integer 11001001 is stored in a register. Convert the two's complement 8-bit binary integer to denary.",
      parts: [
        { label: "Convert the two's complement value 11001001 to denary.", correctAnswer: "-55" }
      ]
    },
    {
      id: "y10-1-1-converting-5", category: "converting",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 6(a)",
      marks: 1,
      stem: "Convert the denary number 150 into an 8-bit binary number.",
      parts: [
        { label: "Convert 150 to 8-bit binary.", correctAnswer: "10010110" }
      ]
    },
    {
      id: "y10-1-1-shifts-4", category: "shifts",
      source: "Cambridge IGCSE 0478, October/November 2024 Paper 11, Question 3(c)(iii)",
      marks: 1,
      stem: "A logical right shift of two places is performed on the binary ASCII number 01111001. Give the binary number after the logical right shift of two places is performed.",
      parts: [
        { label: "Give the shifted 8-bit binary number.", correctAnswer: "00011110" }
      ]
    },
    {
      id: "y10-1-1-twos-3", category: "twos",
      source: "Cambridge IGCSE 0478, February/March 2026 Paper 12, Question 6(d)",
      marks: 1,
      stem: "Convert the two's complement binary integer 01110101 into denary.",
      parts: [
        { label: "Give the denary value.", correctAnswer: "117" }
      ]
    }
  ]
});
