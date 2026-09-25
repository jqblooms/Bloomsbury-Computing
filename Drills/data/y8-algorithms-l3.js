// Year 8, L3: Arrays
// Loaded by Drills/index.html?drill=y8-algorithms-l3
DrillData.register("y8-algorithms-l3", {
  title: "Year 8, L3: Arrays",
  subtitle: "Cambridge Pseudocode",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["arraybasics", "Declaring and Indexing Arrays"],
    ["arraytrace", "Tracing an Array Loop"],
    ["arraywrite", "Writing an Array Total or Count"],
    ["arrayconcepts", "Why Arrays and Loops"]
  ],
  cards: [
    {
      id: "l3-basics-declare", category: "arraybasics",
      prompt: "Write the DECLARE line for an array called Scores that holds 4 integers, positions 1 to 4.",
      answers: ["DECLARE Scores : ARRAY[1:4] OF INTEGER"],
      keywords: [/declare\s+scores\s*:\s*array\[1:4\]\s*of\s*integer/i],
      distractors: ["DECLARE Scores : ARRAY[0:4] OF INTEGER","Scores <- ARRAY[1:4]","DECLARE Scores : ARRAY[1:3] OF INTEGER","ARRAY Scores : DECLARE[1:4]"],
      note: "ARRAY[1:4] OF INTEGER gives exactly 4 positions, numbered 1 to 4."
    },
    {
      id: "l3-basics-start", category: "arraybasics",
      prompt: "What position does a Cambridge pseudocode array start counting from?",
      answers: ["1"],
      keywords: [/^\s*1\s*$/],
      distractors: ["0","-1","It depends on the array"],
      note: "Cambridge pseudocode arrays start at position 1, not 0."
    },
    {
      id: "l3-basics-index", category: "arraybasics",
      prompt: "Numbers = [12, 7, 19, 3]\n\nWhat value is stored at Numbers[3]?",
      answers: ["19"],
      keywords: [/^\s*19\s*$/],
      distractors: ["7","3","12","Numbers[3] does not exist"],
      note: "Position 3 is the third value: 12 (pos 1), 7 (pos 2), 19 (pos 3).",
      randomize: function () {
        var arr = randInts(4, 2, 40);
        var pos = randInt(1, 4);
        var value = arr[pos - 1];
        return {
          prompt: "Numbers = [" + arr.join(", ") + "]\n\nWhat value is stored at Numbers[" + pos + "]?",
          answers: [String(value)], keywords: [new RegExp("^\\s*" + value + "\\s*$")],
          distractors: dedupeDistractors(value, arr.filter(function (v, i) { return i !== pos - 1; }).concat(["Numbers[" + pos + "] does not exist"])),
          note: "Position " + pos + " is the " + ["first", "second", "third", "fourth"][pos - 1] + " value: " + arr.map(function (v, i) { return v + " (pos " + (i + 1) + ")"; }).join(", ") + "."
        };
      }
    },
    {
      id: "l3-basics-fixed", category: "arraybasics",
      prompt: "An array is declared as ARRAY[1:5] OF INTEGER. How many values can it store?",
      answers: ["5"],
      keywords: [/^\s*5\s*$/],
      distractors: ["4","6","As many as needed","1"],
      note: "The array holds a FIXED number of values - from the lower bound to the upper bound inclusive: 5 - 1 + 1 = 5."
    },
    {
      id: "l3-basics-assign", category: "arraybasics",
      prompt: "How do you store the value 8 in position 2 of an array called Prices?",
      answers: ["Prices[2] <- 8"],
      keywords: [/prices\[2\]\s*<-\s*8/i],
      distractors: ["Prices <- 8[2]","Prices(2) <- 8","2 <- Prices[8]","Prices[2] = 8"],
      note: "Square brackets choose the position, then <- assigns the value: Prices[2] <- 8."
    },
    {
      id: "l3-trace-1", category: "arraytrace",
      prompt: "Heights = [120, 135, 142]\nTotal <- 0\nFOR Index <- 1 TO 3\n    Total <- Total + Heights[Index]\nNEXT Index\nOUTPUT Total\n\nWhat does this output?",
      answers: ["397"],
      keywords: [/^\s*397\s*$/],
      distractors: ["142","3","120","277"],
      note: "120 + 135 + 142 = 397.",
      randomize: function () {
        var arr = randInts(3, 5, 60);
        var total = arr[0] + arr[1] + arr[2];
        return {
          prompt: "Heights = [" + arr.join(", ") + "]\nTotal <- 0\nFOR Index <- 1 TO 3\n    Total <- Total + Heights[Index]\nNEXT Index\nOUTPUT Total\n\nWhat does this output?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [arr[2], 3, arr[0]], function (i) { return total + i * 5; }),
          note: arr.join(" + ") + " = " + total + "."
        };
      }
    },
    {
      id: "l3-trace-2", category: "arraytrace",
      prompt: "Marks = [18, 25, 12, 30]\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Marks[Index]\nNEXT Index\nOUTPUT Total\n\nWhat does this output?",
      answers: ["85"],
      keywords: [/^\s*85\s*$/],
      distractors: ["4","30","55","75"],
      note: "18 + 25 + 12 + 30 = 85.",
      randomize: function () {
        var arr = randInts(4, 5, 40);
        var total = arr[0] + arr[1] + arr[2] + arr[3];
        return {
          prompt: "Marks = [" + arr.join(", ") + "]\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Marks[Index]\nNEXT Index\nOUTPUT Total\n\nWhat does this output?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [4, arr[3], arr[0] + arr[1]], function (i) { return total + i * 5; }),
          note: arr.join(" + ") + " = " + total + "."
        };
      }
    },
    {
      id: "l3-trace-3", category: "arraytrace",
      prompt: "Prices = [4, 9, 2, 7]\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total\n\nAfter the SECOND pass of the loop (Index = 2), what is the value of Total?",
      answers: ["13"],
      keywords: [/^\s*13\s*$/],
      distractors: ["4","9","22","2"],
      note: "First pass: Total = 0 + 4 = 4. Second pass: Total = 4 + 9 = 13.",
      randomize: function () {
        var arr = randInts(4, 2, 20);
        var afterFirst = arr[0], afterSecond = arr[0] + arr[1];
        return {
          prompt: "Prices = [" + arr.join(", ") + "]\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total\n\nAfter the SECOND pass of the loop (Index = 2), what is the value of Total?",
          answers: [String(afterSecond)], keywords: [new RegExp("^\\s*" + afterSecond + "\\s*$")],
          distractors: dedupeDistractors(afterSecond, [arr[0], arr[1], arr[0] + arr[1] + arr[2]], function (i) { return afterSecond + i; }),
          note: "First pass: Total = 0 + " + arr[0] + " = " + afterFirst + ". Second pass: Total = " + afterFirst + " + " + arr[1] + " = " + afterSecond + "."
        };
      }
    },
    {
      id: "l3-trace-4", category: "arraytrace",
      prompt: "Numbers = [5, 12, 8, 20, 3, 15]\nCount <- 0\nFOR Index <- 1 TO 6\n    IF Numbers[Index] > 10 THEN\n        Count <- Count + 1\n    ENDIF\nNEXT Index\nOUTPUT Count\n\nWhat does this output?",
      answers: ["3"],
      keywords: [/^\s*3\s*$/],
      distractors: ["2","4","6","55"],
      note: "12, 20 and 15 are each greater than 10 - three values in total.",
      randomize: function () {
        var arr = randInts(6, 1, 25);
        var over = arr.filter(function (v) { return v > 10; });
        var count = over.length;
        return {
          prompt: "Numbers = [" + arr.join(", ") + "]\nCount <- 0\nFOR Index <- 1 TO 6\n    IF Numbers[Index] > 10 THEN\n        Count <- Count + 1\n    ENDIF\nNEXT Index\nOUTPUT Count\n\nWhat does this output?",
          answers: [String(count)], keywords: [new RegExp("^\\s*" + count + "\\s*$")],
          distractors: dedupeDistractors(count, [6], function (i) { return count + i; }),
          note: (over.length ? over.join(", ") + (over.length > 1 ? " are each" : " is") : "None are") + " greater than 10 - " + count + " value" + (count === 1 ? "" : "s") + " in total."
        };
      }
    },
    {
      id: "l3-trace-5", category: "arraytrace",
      prompt: "Scores = [40, 55, 62, 48]\nCount <- 0\nFOR Index <- 1 TO 4\n    IF Scores[Index] >= 50 THEN\n        Count <- Count + 1\n    ENDIF\nNEXT Index\nOUTPUT Count\n\nWhat does this output?",
      answers: ["2"],
      keywords: [/^\s*2\s*$/],
      distractors: ["1","3","4","155"],
      note: "55 and 62 are each 50 or more - two values.",
      randomize: function () {
        var arr = randInts(4, 30, 75);
        var over = arr.filter(function (v) { return v >= 50; });
        var count = over.length;
        return {
          prompt: "Scores = [" + arr.join(", ") + "]\nCount <- 0\nFOR Index <- 1 TO 4\n    IF Scores[Index] >= 50 THEN\n        Count <- Count + 1\n    ENDIF\nNEXT Index\nOUTPUT Count\n\nWhat does this output?",
          answers: [String(count)], keywords: [new RegExp("^\\s*" + count + "\\s*$")],
          distractors: dedupeDistractors(count, [4], function (i) { return count + i; }),
          note: (over.length ? over.join(" and ") + " " + (over.length > 1 ? "are each" : "is") : "None are") + " 50 or more - " + count + " value" + (count === 1 ? "" : "s") + "."
        };
      }
    },
    {
      id: "l3-write-1", category: "arraywrite",
      prompt: "The array Heights = [120, 135, 142, 128, 150] is stored, five values. Write pseudocode that adds up every value and outputs the total. What is the total?",
      answers: ["675"],
      keywords: [/^\s*675\s*$/],
      distractors: ["5","150","120","575"],
      note: "120 + 135 + 142 + 128 + 150 = 675.",
      randomize: function () {
        var arr = randInts(5, 100, 160);
        var total = arr.reduce(function (a, b) { return a + b; }, 0);
        return {
          prompt: "The array Heights = [" + arr.join(", ") + "] is stored, five values. Write pseudocode that adds up every value and outputs the total. What is the total?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [5, arr[4], arr[0]], function (i) { return total + i * 10; }),
          note: arr.join(" + ") + " = " + total + "."
        };
      }
    },
    {
      id: "l3-write-2", category: "arraywrite",
      prompt: "A FOR loop totalling an array called Marks with four values must count from what to what?",
      answers: ["1 to 4"],
      keywords: [/1\s*(to|-)\s*4/i],
      distractors: ["0 to 4","1 to 3","0 to 3","1 to 5"],
      note: "Cambridge pseudocode arrays start at 1, so a 4-value array is visited with FOR Index <- 1 TO 4."
    },
    {
      id: "l3-write-3", category: "arraywrite",
      prompt: "Where must Total <- 0 be written when totalling an array with a loop?",
      answers: ["Before the loop begins"],
      keywords: [/before/i],
      distractors: ["Inside the loop, every pass","After the loop ends","It does not matter where"],
      note: "Setting Total to 0 before the loop means it starts fresh - if it were reset every pass, only the last value would ever be added."
    },
    {
      id: "l3-write-4", category: "arraywrite",
      prompt: "The array Numbers = [6, 14, 9, 22, 11] is stored, five values. Write pseudocode that counts how many values are greater than 10, then outputs the count. What is the count?",
      answers: ["3"],
      keywords: [/^\s*3\s*$/],
      distractors: ["2","4","5","62"],
      note: "14, 22 and 11 are each greater than 10 - three values.",
      randomize: function () {
        var arr = randInts(5, 1, 25);
        var over = arr.filter(function (v) { return v > 10; });
        var count = over.length;
        return {
          prompt: "The array Numbers = [" + arr.join(", ") + "] is stored, five values. Write pseudocode that counts how many values are greater than 10, then outputs the count. What is the count?",
          answers: [String(count)], keywords: [new RegExp("^\\s*" + count + "\\s*$")],
          distractors: dedupeDistractors(count, [5], function (i) { return count + i; }),
          note: (over.length ? over.join(", ") + (over.length > 1 ? " are each" : " is") : "None are") + " greater than 10 - " + count + " value" + (count === 1 ? "" : "s") + "."
        };
      }
    },
    {
      id: "l3-write-5", category: "arraywrite",
      prompt: "Inside a loop that counts matching values, what must happen ONLY when the IF condition is true?",
      answers: ["Count <- Count + 1"],
      keywords: [/count\s*<-\s*count\s*\+\s*1/i],
      distractors: ["Count <- 0","OUTPUT Count","NEXT Index","Total <- Total + Numbers[Index]"],
      note: "Only add 1 to Count when the IF test passes - adding it unconditionally would count every position, not just the matching ones."
    },
    {
      id: "l3-concept-why", category: "arrayconcepts",
      prompt: "Why use an array instead of five separate variables to store five scores?",
      answers: ["An array stores them all under one name, so a loop can visit every one"],
      keywords: [/(?=.*(one|single)\s+name)(?!.*no\s+loop)(?!.*could\s+n?o?t?\s*visit)/i],
      distractors: ["Arrays run faster than variables","Arrays can only ever store text","Five variables would need five DECLARE lines and no loop could visit them all together","There is no real difference"],
      note: "An array groups related values under one name, which is exactly what lets a single loop visit every one of them."
    },
    {
      id: "l3-concept-loop", category: "arrayconcepts",
      prompt: "Why is a loop the natural way to work through an array?",
      answers: ["It can visit every position with the same instructions, without repeating code for each one"],
      keywords: [/(?=.*(every|each|all))(?=.*(position|item|value))/i],
      distractors: ["Loops are required by DECLARE","An array cannot be read without a loop of exactly 10 passes","Loops make an array bigger","Arrays can only be read backwards"],
      note: "The same instruction, Total <- Total + Numbers[Index], works for every position just by changing Index."
    },
    {
      id: "l3-concept-next", category: "arrayconcepts",
      prompt: "What does NEXT Index do at the end of each pass through the loop?",
      answers: ["Increases Index by 1 and sends control back to FOR"],
      keywords: [/(?=.*(increas|add|next|move))(?=.*(index|1))/i],
      distractors: ["Resets Index back to 1","Ends the whole program","Deletes the current array position","Skips the next position"],
      note: "NEXT moves the loop counter on by one and loops back to the FOR line to test whether to continue."
    },
    {
      id: "l3-concept-declare", category: "arrayconcepts",
      prompt: "What does DECLARE create when used with an array?",
      answers: ["A new array with a fixed size"],
      keywords: [/(?=.*(array))(?=.*(fixed|size|new))/i],
      distractors: ["A single variable with no size","A loop","An IF statement","An output value"],
      note: "DECLARE Numbers : ARRAY[1:5] OF INTEGER creates an array with exactly 5 fixed positions."
    },
    {
      id: "l3-concept-perposition", category: "arrayconcepts",
      prompt: "What does each position in an array have, that lets a program pick out one specific value?",
      answers: ["An index"],
      keywords: [/index/i],
      distractors: ["A password","A separate DECLARE line","A random name"],
      note: "Every position has its own index, e.g. Numbers[3], used to read or change just that one value."
    }
  ]
});
