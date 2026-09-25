// Year 8, L2: Selection in Cambridge Pseudocode
// Loaded by Drills/index.html?drill=y8-algorithms-l2
DrillData.register("y8-algorithms-l2", {
  title: "Year 8, L2: Selection in Cambridge Pseudocode",
  subtitle: "Cambridge Pseudocode",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["seltrace", "Tracing Selection"],
    ["selsyntax", "IF/ELSE Syntax"],
    ["seloperators", "Comparison Operators"],
    ["selwrite", "Writing IF/ELSE"]
  ],
  cards: [
    {
      id: "l2-trace-1", category: "seltrace",
      prompt: "IF Score >= 60 THEN\n    OUTPUT \"Pass\"\nELSE\n    OUTPUT \"Fail\"\nENDIF\n\nScore is 45. What is the output?",
      answers: ["Fail"],
      keywords: [/fail/i],
      distractors: ["Pass","45","60","True"],
      note: "45 >= 60 is false, so the ELSE branch runs and outputs \"Fail\".",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: c.code + "\n\n" + c.scenario.varName + " is " + c.value + ". What is the output?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold), "True"]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so " + (c.isTrue ? "the IF" : "the ELSE") + " branch runs and outputs \"" + c.label + "\"."
        };
      }
    },
    {
      id: "l2-trace-2", category: "seltrace",
      prompt: "IF Score >= 60 THEN\n    OUTPUT \"Pass\"\nELSE\n    OUTPUT \"Fail\"\nENDIF\n\nScore is 72. What is the output?",
      answers: ["Pass"],
      keywords: [/pass/i],
      distractors: ["Fail","72","60","True"],
      note: "72 >= 60 is true, so the IF branch runs and outputs \"Pass\".",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: c.code + "\n\n" + c.scenario.varName + " is " + c.value + ". What is the output?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold), "False"]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so " + (c.isTrue ? "the IF" : "the ELSE") + " branch runs and outputs \"" + c.label + "\"."
        };
      }
    },
    {
      id: "l2-trace-3", category: "seltrace",
      prompt: "IF Temperature >= 20 THEN\n    OUTPUT \"Warm\"\nELSE\n    OUTPUT \"Cool\"\nENDIF\n\nTemperature is 20. What is the output?",
      answers: ["Warm"],
      keywords: [/warm/i],
      distractors: ["Cool","20","True","False"],
      note: "20 >= 20 is true (>= includes equal), so it outputs \"Warm\".",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: c.code + "\n\n" + c.scenario.varName + " is " + c.value + ". What is the output?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold)]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so it outputs \"" + c.label + "\"."
        };
      }
    },
    {
      id: "l2-trace-4", category: "seltrace",
      prompt: "IF Age < 13 THEN\n    OUTPUT \"Junior\"\nELSE\n    OUTPUT \"Senior\"\nENDIF\n\nAge is 13. What is the output?",
      answers: ["Senior"],
      keywords: [/senior/i],
      distractors: ["Junior","13","True","False"],
      note: "13 < 13 is false (13 is not less than 13), so the ELSE branch runs.",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: c.code + "\n\n" + c.scenario.varName + " is " + c.value + ". What is the output?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold)]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so " + (c.isTrue ? "the IF" : "the ELSE") + " branch runs."
        };
      }
    },
    {
      id: "l2-trace-5", category: "seltrace",
      prompt: "IF Height >= 150 THEN\n    OUTPUT \"Tall\"\nELSE\n    OUTPUT \"Short\"\nENDIF\n\nHeight is 149. Which branch runs, IF or ELSE?",
      answers: ["ELSE"],
      keywords: [/else/i],
      distractors: ["IF","Both","Neither"],
      note: "149 >= 150 is false, so exactly one branch runs - the ELSE branch.",
      randomize: function () {
        var c = randomSelectionCase();
        var branch = c.isTrue ? "IF" : "ELSE";
        var otherBranch = c.isTrue ? "ELSE" : "IF";
        return {
          prompt: c.code + "\n\n" + c.scenario.varName + " is " + c.value + ". Which branch runs, IF or ELSE?",
          answers: [branch], keywords: [new RegExp("^\\s*" + branch + "\\s*$", "i")],
          distractors: [otherBranch, "Both", "Neither"],
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so exactly one branch runs - the " + branch + " branch."
        };
      }
    },
    {
      id: "l2-syntax-endif", category: "selsyntax",
      prompt: "Which keyword closes an IF block in Cambridge pseudocode?",
      answers: ["ENDIF"],
      keywords: [/^\s*endif\s*$/i],
      distractors: ["ENDFOR","STOP","CLOSE","END"],
      note: "ENDIF closes an IF block - not ENDFOR (that closes a loop) or a plain END."
    },
    {
      id: "l2-syntax-then", category: "selsyntax",
      prompt: "What keyword must appear at the end of an IF line, after the condition?",
      answers: ["THEN"],
      keywords: [/^\s*then\s*$/i],
      distractors: ["DO","GO","START",":"],
      note: "Cambridge pseudocode IF lines end in THEN, with no colon and no \"DO\"."
    },
    {
      id: "l2-syntax-else", category: "selsyntax",
      prompt: "Does the ELSE line have its own condition?",
      answers: ["No, ELSE has no condition of its own"],
      keywords: [/no/i],
      distractors: ["Yes, the same condition as IF","Yes, the opposite of IF written out","Only if the IF condition is true"],
      note: "ELSE just means \"otherwise\" - it never repeats or negates the IF condition itself."
    },
    {
      id: "l2-syntax-structure", category: "selsyntax",
      prompt: "Put these in the correct order: ENDIF, IF ... THEN, ELSE, the two branches' instructions.",
      answers: ["IF ... THEN, then its instructions, ELSE, then its instructions, ENDIF"],
      keywords: [/if.*then.*else.*endif/i],
      distractors: ["ENDIF, IF ... THEN, ELSE","ELSE, IF ... THEN, ENDIF","IF ... THEN, ENDIF, ELSE"],
      note: "IF...THEN starts the block, ELSE marks the other branch, ENDIF closes it - always in that order."
    },
    {
      id: "l2-syntax-nocolon", category: "selsyntax",
      prompt: "A student writes: IF Score >= 50: \n\nWhat is wrong with this line?",
      answers: ["It should end in THEN, not a colon"],
      keywords: [/then/i],
      distractors: ["Nothing is wrong with it","It should end in DO","Score should be in quotation marks","It needs ENDIF at the end of the same line"],
      note: "Cambridge pseudocode has no colon on an IF line - it ends with THEN."
    },
    {
      id: "l2-op-gte", category: "seloperators",
      prompt: "Which comparison operator means \"50 or more\"?",
      answers: [">="],
      keywords: [/^\s*>=\s*$|greater than or equal/i],
      distractors: [">","<","<=","="],
      note: ">= means greater than OR equal to."
    },
    {
      id: "l2-op-lt", category: "seloperators",
      prompt: "Which comparison operator means \"under 13\" (strictly less than)?",
      answers: ["<"],
      keywords: [/^\s*<\s*$|less than(?! or equal)/i],
      distractors: ["<=",">",">=","="],
      note: "A plain < excludes 13 itself - \"under 13\" means strictly less than."
    },
    {
      id: "l2-op-lte", category: "seloperators",
      prompt: "Which comparison operator means \"150 or less\"?",
      answers: ["<="],
      keywords: [/^\s*<=\s*$|less than or equal/i],
      distractors: ["<",">",">=","="],
      note: "<= means less than OR equal to."
    },
    {
      id: "l2-op-eq", category: "seloperators",
      prompt: "Which operator checks whether two values are exactly equal?",
      answers: ["="],
      keywords: [/^\s*=\s*$/],
      distractors: ["<-","==","<=>","<>"],
      note: "Cambridge pseudocode compares equality with a single =, reserving <- for assignment."
    },
    {
      id: "l2-op-choose", category: "seloperators",
      prompt: "A rule says \"Free Delivery if the Total is 50 or more\". Which operator goes in IF Total ___ 50 THEN?",
      answers: [">="],
      keywords: [/^\s*>=\s*$/],
      distractors: [">","<","<=","="],
      note: "\"50 or more\" includes exactly 50, so it needs >=, not a plain >."
    },
    {
      id: "l2-write-1", category: "selwrite",
      prompt: "Write pseudocode that asks for a Score, outputs \"Pass\" if Score is 50 or more, otherwise outputs \"Fail\". If Score is 42, what does it display?",
      answers: ["Fail"],
      keywords: [/fail/i],
      distractors: ["Pass","42","50","True"],
      note: "42 >= 50 is false, so it outputs \"Fail\".",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: "Write pseudocode that asks for a " + c.scenario.varName + ", outputs \"" + c.scenario.trueLabel + "\" if " + c.scenario.varName + " is " + selectionOpPhrase(c.scenario.op, c.threshold) + ", otherwise outputs \"" + c.scenario.falseLabel + "\". If " + c.scenario.varName + " is " + c.value + ", what does it display?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold), "True"]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so it outputs \"" + c.label + "\"."
        };
      }
    },
    {
      id: "l2-write-2", category: "selwrite",
      prompt: "Write pseudocode that asks for an Age, outputs \"Junior\" if Age is under 13, otherwise outputs \"Senior\". If Age is 10, what does it display?",
      answers: ["Junior"],
      keywords: [/junior/i],
      distractors: ["Senior","10","13","True"],
      note: "10 < 13 is true, so it outputs \"Junior\".",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: "Write pseudocode that asks for a " + c.scenario.varName + ", outputs \"" + c.scenario.trueLabel + "\" if " + c.scenario.varName + " is " + selectionOpPhrase(c.scenario.op, c.threshold) + ", otherwise outputs \"" + c.scenario.falseLabel + "\". If " + c.scenario.varName + " is " + c.value + ", what does it display?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold), "True"]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so it outputs \"" + c.label + "\"."
        };
      }
    },
    {
      id: "l2-write-3", category: "selwrite",
      prompt: "Write pseudocode that asks for a Height, outputs \"Tall\" if Height is 150 or more, otherwise outputs \"Short\". If Height is 160, what does it display?",
      answers: ["Tall"],
      keywords: [/tall/i],
      distractors: ["Short","160","150","True"],
      note: "160 >= 150 is true, so it outputs \"Tall\".",
      randomize: function () {
        var c = randomSelectionCase();
        return {
          prompt: "Write pseudocode that asks for a " + c.scenario.varName + ", outputs \"" + c.scenario.trueLabel + "\" if " + c.scenario.varName + " is " + selectionOpPhrase(c.scenario.op, c.threshold) + ", otherwise outputs \"" + c.scenario.falseLabel + "\". If " + c.scenario.varName + " is " + c.value + ", what does it display?",
          answers: [c.label], keywords: [new RegExp("^\\s*" + c.label + "\\s*$", "i")],
          distractors: dedupeDistractors(c.label, [c.otherLabel, String(c.value), String(c.threshold), "True"]),
          note: c.value + " " + c.scenario.op + " " + c.threshold + " is " + c.isTrue + ", so it outputs \"" + c.label + "\"."
        };
      }
    },
    {
      id: "l2-write-4", category: "selwrite",
      prompt: "An algorithm asks for Price and Quantity, works out the Total, then outputs \"Free Delivery\" if Total is 50 or more, otherwise \"Delivery Charge Applies\". If Price is 10 and Quantity is 6, what does it display?",
      answers: ["Free Delivery"],
      keywords: [/free delivery/i],
      distractors: ["Delivery Charge Applies","60","16","50"],
      note: "Total = 10 * 6 = 60, and 60 >= 50 is true, so it outputs \"Free Delivery\".",
      randomize: function () {
        var price = randInt(2, 15), qty = randInt(2, 9), total = price * qty, threshold = 50;
        var isTrue = total >= threshold;
        var label = isTrue ? "Free Delivery" : "Delivery Charge Applies";
        var otherLabel = isTrue ? "Delivery Charge Applies" : "Free Delivery";
        return {
          prompt: "An algorithm asks for Price and Quantity, works out the Total, then outputs \"Free Delivery\" if Total is 50 or more, otherwise \"Delivery Charge Applies\". If Price is " + price + " and Quantity is " + qty + ", what does it display?",
          answers: [label], keywords: [new RegExp("^\\s*" + label + "\\s*$", "i")],
          distractors: dedupeDistractors(label, [otherLabel, String(total), String(price + qty)]),
          note: "Total = " + price + " * " + qty + " = " + total + ", and " + total + " >= 50 is " + isTrue + ", so it outputs \"" + label + "\"."
        };
      }
    },
    {
      id: "l2-write-5", category: "selwrite",
      prompt: "An algorithm asks for NumA, NumB and NumC, adds all three into a Total, then outputs \"High\" if Total is 100 or more, otherwise \"Low\". If NumA is 20, NumB is 25 and NumC is 30, what does it display?",
      answers: ["Low"],
      keywords: [/low/i],
      distractors: ["High","75","100","20"],
      note: "Total = 20 + 25 + 30 = 75, and 75 >= 100 is false, so it outputs \"Low\".",
      randomize: function () {
        var a = randInt(10, 60), b = randInt(10, 60), c2 = randInt(10, 60), total = a + b + c2, threshold = 100;
        var isTrue = total >= threshold;
        var label = isTrue ? "High" : "Low";
        var otherLabel = isTrue ? "Low" : "High";
        return {
          prompt: "An algorithm asks for NumA, NumB and NumC, adds all three into a Total, then outputs \"High\" if Total is 100 or more, otherwise \"Low\". If NumA is " + a + ", NumB is " + b + " and NumC is " + c2 + ", what does it display?",
          answers: [label], keywords: [new RegExp("^\\s*" + label + "\\s*$", "i")],
          distractors: dedupeDistractors(label, [otherLabel, String(total), String(a)]),
          note: "Total = " + a + " + " + b + " + " + c2 + " = " + total + ", and " + total + " >= 100 is " + isTrue + ", so it outputs \"" + label + "\"."
        };
      }
    }
  ]
});
