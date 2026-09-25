// Year 11: Logic Gates and Truth Tables
// Loaded by Drills/index.html?drill=y11-p2-logic
DrillData.register("y11-p2-logic", {
  title: "Year 11: Logic Gates and Truth Tables",
  subtitle: "Cambridge IGCSE Computer Science 0478 - Paper 2",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["y11logic", "Logic Gates and Truth Tables"]
  ],
  cards: [
    {
      id: "gate-and", category: "y11logic",
      prompt: "What is the output column of A AND B for the rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["0 0 0 1"],
      distractors: ["0 1 0 0", "0 1 0 1", "0 1 1 1", "1 0 0 1", "1 1 0 1"],
      note: "AND gives 1 only when both inputs are 1. Output for 00, 01, 10, 11 is 0 0 0 1."
    },
    {
      id: "gate-or", category: "y11logic",
      prompt: "What is the output column of A OR B for the rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["0 1 1 1"],
      distractors: ["0 0 1 0", "0 0 1 1", "0 1 0 1", "0 1 1 0", "1 1 1 1"],
      note: "OR gives 1 when at least one input is 1. Output for 00, 01, 10, 11 is 0 1 1 1."
    },
    {
      id: "gate-nand", category: "y11logic",
      prompt: "What is the output column of A NAND B for the rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["1 1 1 0"],
      distractors: ["0 1 1 0", "1 0 0 0", "1 1 0 0", "1 1 0 1", "1 1 1 1"],
      note: "NAND gives the opposite of AND: 0 only when both inputs are 1. Output for 00, 01, 10, 11 is 1 1 1 0."
    },
    {
      id: "gate-nor", category: "y11logic",
      prompt: "What is the output column of A NOR B for the rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["1 0 0 0"],
      distractors: ["0 0 0 0", "0 0 1 0", "0 1 0 0", "1 0 1 0", "1 1 0 0"],
      note: "NOR gives the opposite of OR: 1 only when both inputs are 0. Output for 00, 01, 10, 11 is 1 0 0 0."
    },
    {
      id: "gate-xor", category: "y11logic",
      prompt: "What is the output column of A XOR B for the rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["0 1 1 0"],
      distractors: ["0 0 1 1", "0 1 1 1", "1 0 1 0", "1 1 0 0", "1 1 1 0"],
      note: "XOR gives 1 only when the two inputs are different. Output for 00, 01, 10, 11 is 0 1 1 0."
    },
    {
      id: "gate-not", category: "y11logic",
      prompt: "What is the output column of NOT A for A = 0, 1 (in that order)?",
      answers: ["1 0"],
      distractors: ["0 0", "1 1", "0 1", "1 0 1", "0"],
      note: "NOT flips the input: 0 becomes 1 and 1 becomes 0. It has only one input."
    },
    {
      id: "scen-and", category: "y11logic",
      prompt: "An alarm sounds only if the door is open AND the system is armed. Which gate?",
      answers: ["AND"],
      distractors: ["OR", "NOT", "NAND", "NOR", "XOR"],
      note: "Both conditions must be 1."
    },
    {
      id: "scen-or", category: "y11logic",
      prompt: "A light turns on if either switch is on. Which gate?",
      answers: ["OR"],
      distractors: ["AND", "NOT", "NAND", "NOR", "XOR"],
      note: "At least one input 1 gives 1."
    },
    {
      id: "scen-xor", category: "y11logic",
      prompt: "A staircase light turns on if exactly one of two switches is up (different positions). Which gate?",
      answers: ["XOR"],
      distractors: ["AND", "OR", "NOT", "NAND", "NOR"],
      note: "Different inputs give 1."
    },
    {
      id: "scen-nand", category: "y11logic",
      prompt: "Which gate gives 0 only when both inputs are 1?",
      answers: ["NAND"],
      distractors: ["AND", "OR", "NOT", "NOR", "XOR"],
      note: "It is AND followed by NOT."
    },
    {
      id: "scen-nor", category: "y11logic",
      prompt: "Which gate gives 1 only when both inputs are 0?",
      answers: ["NOR"],
      distractors: ["AND", "OR", "NOT", "NAND", "XOR"],
      note: "It is OR followed by NOT."
    },
    {
      id: "rows-count", category: "y11logic",
      prompt: "How many rows does a truth table need for three inputs?",
      answers: ["8"],
      distractors: ["3", "6", "9", "4", "16", "12"],
      note: "Each input doubles the rows: 2 x 2 x 2 = 8. Two inputs need 4 rows."
    },
    {
      id: "rows-order", category: "y11logic",
      prompt: "In which order are the input rows of a three-input truth table usually written?",
      answers: ["000, 001, 010, 011, 100, 101, 110, 111"],
      distractors: ["000, 111, 001, 110, 010, 101, 011, 100", "111, 110, 101, 100, 011, 010, 001, 000", "000, 100, 010, 001, 110, 101, 011, 111", "001, 010, 100, 011, 101, 110, 000, 111", "000, 001, 011, 010, 110, 111, 101, 100"],
      note: "Count up in binary: 000, 001, 010, 011, 100, 101, 110, 111. It makes sure no row is missed."
    },
    {
      id: "gate-inputs", category: "y11logic",
      prompt: "In the exam a logic circuit must use gates with at most how many inputs each?",
      answers: ["2"],
      distractors: ["1", "3", "4", "5", "Any number", "8"],
      note: "Draw the circuit with two-input gates, so a three-input expression is built from several gates."
    },
    {
      id: "expr-e1", category: "y11logic",
      prompt: "What is the output column for X = NOT A AND B, with input rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["0 1 0 0"],
      distractors: ["0 0 0 0", "0 0 0 1", "0 1 1 0", "1 0 0 0", "1 1 0 1"],
      note: "Work out NOT A first, then AND it with B. The output column is 0 1 0 0."
    },
    {
      id: "expr-e2", category: "y11logic",
      prompt: "What is the output column for X = (A OR B) AND C, with input rows A B C = 000, 001, 010, 011, 100, 101, 110, 111 (in that order)?",
      answers: ["0 0 0 1 0 1 0 1"],
      distractors: ["0 0 0 0 0 1 0 1", "0 0 0 1 0 1 1 1", "0 0 0 1 1 1 1 1", "1 0 0 1 0 1 0 1", "1 0 0 1 1 1 0 1"],
      note: "Do the brackets first: A OR B, then AND with C. The output column is 0 0 0 1 0 1 0 1."
    },
    {
      id: "expr-e3", category: "y11logic",
      prompt: "What is the output column for X = NOT (A AND B), with input rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["1 1 1 0"],
      distractors: ["0 1 1 0", "0 1 1 1", "1 0 1 0", "1 1 0 1", "1 1 1 1"],
      note: "This is the same as NAND. The output column is 1 1 1 0."
    },
    {
      id: "expr-e4", category: "y11logic",
      prompt: "What is the output column for X = (A XOR B) NAND B, with input rows A B = 00, 01, 10, 11 (in that order)?",
      answers: ["1 0 1 1"],
      distractors: ["0 0 0 1", "0 0 1 1", "0 1 1 1", "1 1 1 0", "1 1 1 1"],
      note: "Work out A XOR B first, then NAND that with B. The output column is 1 0 1 1."
    },
    {
      id: "expr-e5", category: "y11logic",
      prompt: "What is the output column for X = (A NAND NOT B) XOR (A NOR C), with input rows A B C = 000, 001, 010, 011, 100, 101, 110, 111 (in that order)?",
      answers: ["0 1 0 1 0 0 1 1"],
      distractors: ["0 0 0 1 0 0 1 1", "0 1 0 0 0 0 1 1", "0 1 0 1 0 0 0 0", "0 1 1 1 0 0 1 1", "1 1 0 1 0 0 1 1"],
      note: "Work out each bracket in its own column, then XOR them. The output column is 0 1 0 1 0 0 1 1."
    },
    {
      id: "expr-e6", category: "y11logic",
      prompt: "What is the output column for Z = NOT (B OR NOT C) XOR (A NAND C), with input rows A B C = 000, 001, 010, 011, 100, 101, 110, 111 (in that order)?",
      answers: ["1 0 1 1 1 1 1 0"],
      distractors: ["0 0 0 1 1 1 1 0", "0 0 1 1 0 1 1 0", "1 0 0 1 1 0 1 0", "1 0 1 1 1 0 1 0", "1 0 1 1 1 1 1 1"],
      note: "Work out NOT C, then B OR NOT C, then NOT that. Separately A NAND C. Then XOR the two results. The output column is 1 0 1 1 1 1 1 0."
    },
    {
      id: "expr-e7", category: "y11logic",
      prompt: "What is the output column for X = (J XOR NOT K) NAND NOT L, with input rows J K L = 000, 001, 010, 011, 100, 101, 110, 111 (in that order)?",
      answers: ["0 1 1 1 1 1 0 1"],
      distractors: ["0 0 0 1 1 1 0 1", "0 0 1 1 0 1 0 1", "0 0 1 1 1 1 0 1", "0 1 1 1 1 1 0 0", "1 1 0 1 1 1 0 1"],
      note: "Here J, K, L are the first, second and third input. Work out NOT K, then J XOR that, then NOT L, then NAND. The output column is 0 1 1 1 1 1 0 1."
    },
    {
      id: "expr-e8", category: "y11logic",
      prompt: "What is the output column for X = (NOT P AND Q) XOR (Q NOR R), with input rows P Q R = 000, 001, 010, 011, 100, 101, 110, 111 (in that order)?",
      answers: ["1 0 1 1 1 0 0 0"],
      distractors: ["0 1 1 1 1 0 0 0", "1 0 1 1 1 0 0 1", "1 0 1 1 1 0 1 0", "1 1 1 1 1 0 1 0", "1 1 1 1 1 1 0 0"],
      note: "Here P, Q, R are the first, second and third input. Work out each bracket in its own column, then XOR. The output column is 1 0 1 1 1 0 0 0."
    },
    {
      id: "val-v10", category: "y11logic",
      prompt: "What is X for X = (A OR B) AND C when A = 0, B = 1, C = 0?",
      answers: ["0"],
      distractors: ["1", "2", "Both", "Cannot tell", "-1"],
      note: "Substitute the values into the brackets first, then apply the outer gate."
    },
    {
      id: "val-v11", category: "y11logic",
      prompt: "What is X for X = (A OR B) AND C when A = 1, B = 0, C = 1?",
      answers: ["1"],
      distractors: ["0", "2", "Both", "Cannot tell", "-1"],
      note: "Substitute the values into the brackets first, then apply the outer gate."
    },
    {
      id: "val-v20", category: "y11logic",
      prompt: "What is X for X = A AND NOT B when A = 1, B = 0?",
      answers: ["1"],
      distractors: ["0", "2", "Both", "Cannot tell", "-1"],
      note: "Substitute the values into the brackets first, then apply the outer gate."
    },
    {
      id: "val-v21", category: "y11logic",
      prompt: "What is X for X = A AND NOT B when A = 1, B = 1?",
      answers: ["0"],
      distractors: ["1", "2", "Both", "Cannot tell", "-1"],
      note: "Substitute the values into the brackets first, then apply the outer gate."
    },
    {
      id: "logic-discount", category: "y11logic",
      prompt: "A meal discount (X = 1) is given if the person is a student (A = 1) or 65 or older (B = 1), but only if the order is $20 or more (C = 1). Which expression is right?",
      answers: ["X = (A OR B) AND C"],
      distractors: ["X = A OR B OR C", "X = A AND B AND C", "X = (A AND B) OR C", "X = A OR (B AND C)", "X = NOT (A OR B) AND C"],
      note: "Either of the two people conditions is enough (OR), and the order value must also be met (AND). Brackets make sure the OR is worked out before the AND."
    }
  ]
});
