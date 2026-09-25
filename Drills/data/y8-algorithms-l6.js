// Year 8, L6: Flowcharts and Pseudocode
// Loaded by Drills/index.html?drill=y8-algorithms-l6
DrillData.register("y8-algorithms-l6", {
  title: "Year 8, L6: Flowcharts and Pseudocode",
  subtitle: "Cambridge Pseudocode",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["fc-symbols", "Naming the Symbols"],
    ["fc-shapemap", "Shape to Pseudocode"],
    ["fc-toCode", "Flowchart to Pseudocode"],
    ["fc-toFlow", "Pseudocode to Flowchart"]
  ],
  cards: [
    {
      id: "fc-name-terminal", category: "fc-symbols",
      prompt: "Name the flowchart symbol that marks where an algorithm begins or ends.",
      answers: ["Terminal"],
      keywords: [/terminal|start\s*\/?\s*(and|or)?\s*end/i],
      distractors: ["Process", "Decision", "Input/Output", "Sequence"],
      note: "The rounded Terminal shape is used for Start and End only."
    },
    {
      id: "fc-name-process", category: "fc-symbols",
      prompt: "Name the flowchart symbol shaped like a rectangle.",
      answers: ["Process"],
      keywords: [/^\s*process\s*$/i],
      distractors: ["Terminal", "Decision", "Input/Output"],
      note: "A rectangle holds an action, such as setting or changing a variable."
    },
    {
      id: "fc-name-decision", category: "fc-symbols",
      prompt: "Name the flowchart symbol shaped like a diamond.",
      answers: ["Decision"],
      keywords: [/^\s*decision\s*$/i],
      distractors: ["Process", "Terminal", "Input/Output"],
      note: "A diamond always asks a question with exactly two possible answers."
    },
    {
      id: "fc-name-io", category: "fc-symbols",
      prompt: "Name the flowchart symbol shaped like a slanted parallelogram.",
      answers: ["Input/Output"],
      keywords: [/input\s*\/?\s*(or)?\s*output/i],
      distractors: ["Process", "Decision", "Terminal"],
      note: "The slanted shape is used for both receiving information (input) and displaying it (output)."
    },
    {
      id: "fc-decision-paths", category: "fc-symbols",
      prompt: "A decision diamond can only lead to two possible paths. What are they usually labelled?",
      answers: ["Yes and No"],
      keywords: [/(?=.*(yes|true))(?=.*(no|false))/i],
      distractors: ["Left and Right", "In and Out", "High and Low", "On and Off"],
      note: "Yes/No or True/False - every decision has exactly two paths out of it."
    },
    {
      id: "fc-map-input", category: "fc-shapemap",
      prompt: "Which Cambridge Pseudocode keyword does an Input/Output shape become when it RECEIVES a value?",
      answers: ["INPUT"],
      keywords: [/^\s*input\s*$/i],
      distractors: ["OUTPUT", "DECLARE", "IF"],
      note: "Receiving a value from the user is always INPUT."
    },
    {
      id: "fc-map-output", category: "fc-shapemap",
      prompt: "Which Cambridge Pseudocode keyword does an Input/Output shape become when it DISPLAYS a value?",
      answers: ["OUTPUT"],
      keywords: [/^\s*output\s*$/i],
      distractors: ["INPUT", "DECLARE", "PRINT"],
      note: "Displaying a value to the user is always OUTPUT, never PRINT, in Cambridge Pseudocode."
    },
    {
      id: "fc-map-process-symbol", category: "fc-shapemap",
      prompt: "Which symbol does a Process shape that sets a variable's value use in Cambridge Pseudocode?",
      answers: ["<-"],
      keywords: [/^\s*<-\s*$/],
      distractors: ["=", "==", "->"],
      note: "Cambridge Pseudocode assigns with the arrow <-, not =."
    },
    {
      id: "fc-map-decision-keyword", category: "fc-shapemap",
      prompt: "Which Cambridge Pseudocode keyword does a Decision shape's question become?",
      answers: ["IF"],
      keywords: [/^\s*if\s*$/i],
      distractors: ["ELSE", "ENDIF", "WHILE"],
      note: "A decision becomes an IF ... THEN line."
    },
    {
      id: "fc-declare-no-shape", category: "fc-shapemap",
      prompt: "True or False: every flowchart shape has a matching DECLARE line.",
      answers: ["False"],
      keywords: [/^\s*false\s*$/i],
      distractors: ["True"],
      note: "A flowchart has no shape for DECLARE - it shows what happens, not each variable's type."
    },
    {
      id: "fc-code-process", category: "fc-toCode",
      prompt: "A process shape says 'Store 5 in Count'. Write the matching pseudocode line.",
      answers: ["Count <- 5"],
      keywords: [/^\s*count\s*<-\s*5\s*$/i],
      distractors: ["Count = 5", "5 <- Count", "Count == 5", "SET Count TO 5"],
      note: "Count <- 5 stores 5 in Count. The arrow always points into the variable being changed."
    },
    {
      id: "fc-code-input", category: "fc-toCode",
      prompt: "An input/output shape says 'Ask the user to enter Name'. Write the matching pseudocode line.",
      answers: ["INPUT Name"],
      keywords: [/^\s*input\s+name\s*$/i],
      distractors: ["OUTPUT Name", "GET Name", "READ Name"],
      note: "Receiving a value from the user is INPUT, followed by the variable name."
    },
    {
      id: "fc-code-output", category: "fc-toCode",
      prompt: "An input/output shape says 'Display the value of Total'. Write the matching pseudocode line.",
      answers: ["OUTPUT Total"],
      keywords: [/^\s*output\s+total\s*$/i],
      distractors: ["PRINT Total", "DISPLAY Total", "INPUT Total"],
      note: "Displaying a value is OUTPUT, followed by the variable name."
    },
    {
      id: "fc-code-decision", category: "fc-toCode",
      prompt: "A decision shape says 'Is Age more than 17?'. Write the IF line only (not the whole block).",
      answers: ["IF Age > 17 THEN"],
      keywords: [/^\s*if\s+age\s*>\s*17\s+then\s*$/i],
      distractors: ["IF Age >= 17 THEN", "IF Age < 17 THEN", "WHILE Age > 17"],
      note: "\"More than\" is strictly greater than, so the operator is >, not >=."
    },
    {
      id: "fc-code-endif", category: "fc-toCode",
      prompt: "Which keyword marks the end of an IF/ELSE block in Cambridge Pseudocode?",
      answers: ["ENDIF"],
      keywords: [/^\s*endif\s*$/i],
      distractors: ["ENDWHILE", "ELSE", "NEXT"],
      note: "Every IF block, with or without an ELSE, is closed with ENDIF."
    },
    {
      id: "fc-flow-process", category: "fc-toFlow",
      prompt: "Which flowchart shape matches this pseudocode line?\nTotal <- Total + 1",
      answers: ["Process"],
      keywords: [/^\s*process\s*$/i],
      distractors: ["Decision", "Input/Output", "Terminal"],
      note: "Changing a variable's value is always a Process shape."
    },
    {
      id: "fc-flow-input", category: "fc-toFlow",
      prompt: "Which flowchart shape matches this pseudocode line?\nINPUT Score",
      answers: ["Input/Output"],
      keywords: [/input\s*\/?\s*(or)?\s*output/i],
      distractors: ["Process", "Decision", "Terminal"],
      note: "INPUT and OUTPUT both belong to the Input/Output shape."
    },
    {
      id: "fc-flow-output", category: "fc-toFlow",
      prompt: "Which flowchart shape matches this pseudocode line?\nOUTPUT \"Done\"",
      answers: ["Input/Output"],
      keywords: [/input\s*\/?\s*(or)?\s*output/i],
      distractors: ["Process", "Decision", "Terminal"],
      note: "INPUT and OUTPUT both belong to the Input/Output shape."
    },
    {
      id: "fc-flow-decision", category: "fc-toFlow",
      prompt: "Which flowchart shape matches this pseudocode line?\nIF Score >= 50 THEN",
      answers: ["Decision"],
      keywords: [/^\s*decision\s*$/i],
      distractors: ["Process", "Input/Output", "Terminal"],
      note: "A condition being tested is always a Decision diamond."
    },
    {
      id: "fc-flow-declare", category: "fc-toFlow",
      prompt: "A flowchart has no DECLARE shape drawn anywhere on it. Is this a mistake?",
      answers: ["No"],
      keywords: [/^\s*no\b/i],
      distractors: ["Yes"],
      note: "DECLARE has no flowchart symbol of its own, so a correct flowchart never shows one."
    }
  ]
});
