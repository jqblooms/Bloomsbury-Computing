// Year 8, L4: Linear Search
// Loaded by Drills/index.html?drill=y8-algorithms-l4
DrillData.register("y8-algorithms-l4", {
  title: "Year 8, L4: Linear Search",
  subtitle: "Cambridge Pseudocode",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["searchconcept", "What a Linear Search Does"],
    ["searchtrace", "Tracing a Search"],
    ["searchflag", "The Found Flag"],
    ["searchwrite", "Writing a Linear Search"]
  ],
  cards: [
    {
      id: "l4-concept-start", category: "searchconcept",
      prompt: "Where does a linear search start checking from?",
      answers: ["The first position"],
      keywords: [/first/i],
      distractors: ["The last position","The middle position","A random position"],
      note: "A linear search checks one item at a time, starting from the first position."
    },
    {
      id: "l4-concept-compare", category: "searchconcept",
      prompt: "What does a linear search do at each position?",
      answers: ["Compares the item with the value being searched for"],
      keywords: [/compar/i],
      distractors: ["Deletes the item","Sorts the item","Doubles the item"],
      note: "It compares each item in turn with the target value."
    },
    {
      id: "l4-concept-sorted", category: "searchconcept",
      prompt: "Does a linear search require the list to be sorted first?",
      answers: ["No"],
      keywords: [/no/i],
      distractors: ["Yes, always","Only for text values","Only for numbers"],
      note: "A linear search works on any list, sorted or not - unlike some faster search methods."
    },
    {
      id: "l4-concept-flag", category: "searchconcept",
      prompt: "What can a Boolean variable like Found store?",
      answers: ["TRUE or FALSE, and nothing else"],
      keywords: [/(?=.*true)(?=.*false)/i],
      distractors: ["Any number","Any piece of text","A whole array"],
      note: "A Boolean variable can only ever hold TRUE or FALSE."
    },
    {
      id: "l4-concept-stop", category: "searchconcept",
      prompt: "In the search algorithm taught this lesson, does the loop stop as soon as a match is found?",
      answers: ["No, it keeps checking every position anyway"],
      keywords: [/no/i],
      distractors: ["Yes, it stops immediately","Only if Found is FALSE","Only on the last position"],
      note: "The FOR loop always runs the full range - Found simply remembers whether a match happened anywhere along the way."
    },
    {
      id: "l4-trace-1", category: "searchtrace",
      prompt: "Numbers = [12, 7, 19, 3, 25]\nSearchValue is 19.\nFound <- FALSE\nFOR Index <- 1 TO 5\n    IF Numbers[Index] = SearchValue THEN\n        Found <- TRUE\n    ENDIF\nNEXT Index\n\nWhat is the value of Found after the loop ends?",
      answers: ["TRUE"],
      keywords: [/true/i],
      distractors: ["FALSE","19","3"],
      note: "Numbers[3] is 19, which matches SearchValue, so Found becomes TRUE and stays TRUE.",
      randomize: function () {
        var d = randomSearchArray(5, 1, 40);
        var result = d.found ? "TRUE" : "FALSE";
        return {
          prompt: "Numbers = [" + d.arr.join(", ") + "]\nSearchValue is " + d.searchValue + ".\nFound <- FALSE\nFOR Index <- 1 TO 5\n    IF Numbers[Index] = SearchValue THEN\n        Found <- TRUE\n    ENDIF\nNEXT Index\n\nWhat is the value of Found after the loop ends?",
          answers: [result], keywords: [new RegExp("^\\s*" + result + "\\s*$", "i")],
          distractors: dedupeDistractors(result, [d.found ? "FALSE" : "TRUE", String(d.searchValue), String(d.arr[0])]),
          note: d.found
            ? "Numbers[" + d.foundAt + "] is " + d.searchValue + ", which matches SearchValue, so Found becomes TRUE and stays TRUE."
            : "None of " + d.arr.join(", ") + " equal " + d.searchValue + ", so Found stays FALSE."
        };
      }
    },
    {
      id: "l4-trace-2", category: "searchtrace",
      prompt: "Numbers = [12, 7, 19, 3, 25]\nSearchValue is 50.\nFound <- FALSE\nFOR Index <- 1 TO 5\n    IF Numbers[Index] = SearchValue THEN\n        Found <- TRUE\n    ENDIF\nNEXT Index\nIF Found = TRUE THEN\n    OUTPUT \"Found\"\nELSE\n    OUTPUT \"Not Found\"\nENDIF\n\nWhat is the output?",
      answers: ["Not Found"],
      keywords: [/not found/i],
      distractors: ["Found","50","TRUE"],
      note: "None of 12, 7, 19, 3 or 25 equal 50, so Found stays FALSE and the ELSE branch outputs \"Not Found\".",
      randomize: function () {
        var d = randomSearchArray(5, 1, 40);
        var result = d.found ? "Found" : "Not Found";
        return {
          prompt: "Numbers = [" + d.arr.join(", ") + "]\nSearchValue is " + d.searchValue + ".\nFound <- FALSE\nFOR Index <- 1 TO 5\n    IF Numbers[Index] = SearchValue THEN\n        Found <- TRUE\n    ENDIF\nNEXT Index\nIF Found = TRUE THEN\n    OUTPUT \"Found\"\nELSE\n    OUTPUT \"Not Found\"\nENDIF\n\nWhat is the output?",
          answers: [result], keywords: [new RegExp("^\\s*" + result + "\\s*$", "i")],
          distractors: dedupeDistractors(result, [d.found ? "Not Found" : "Found", String(d.searchValue), "TRUE"]),
          note: d.found
            ? "Numbers[" + d.foundAt + "] is " + d.searchValue + ", so Found becomes TRUE and the IF branch outputs \"Found\"."
            : "None of " + d.arr.join(", ") + " equal " + d.searchValue + ", so Found stays FALSE and the ELSE branch outputs \"Not Found\"."
        };
      }
    },
    {
      id: "l4-trace-3", category: "searchtrace",
      prompt: "Ages = [15, 22, 8, 34, 19]\nSearchAge is 8.\nHow many times does the comparison IF Ages[Index] = SearchAge THEN run in total?",
      answers: ["5"],
      keywords: [/^\s*5\s*$/],
      distractors: ["1","3","4","8"],
      note: "The FOR loop always runs once for every position, from 1 to 5, regardless of when the match is found.",
      randomize: function () {
        var n = randInt(4, 7);
        var d = randomSearchArray(n, 1, 40);
        return {
          prompt: "Ages = [" + d.arr.join(", ") + "]\nSearchAge is " + d.searchValue + ".\nHow many times does the comparison IF Ages[Index] = SearchAge THEN run in total?",
          answers: [String(n)], keywords: [new RegExp("^\\s*" + n + "\\s*$")],
          distractors: dedupeDistractors(n, [1, Math.max(1, d.foundAt), d.searchValue], function (i) { return n + i; }),
          note: "The FOR loop always runs once for every position, from 1 to " + n + ", regardless of when the match is found."
        };
      }
    },
    {
      id: "l4-trace-4", category: "searchtrace",
      prompt: "Colours = [\"Red\", \"Green\", \"Blue\", \"Yellow\"]\nSearchColour is \"Purple\".\nWhat will Found equal after the loop ends?",
      answers: ["FALSE"],
      keywords: [/false/i],
      distractors: ["TRUE","Purple","Red"],
      note: "\"Purple\" does not match any of the four stored colours, so Found is never set to TRUE.",
      randomize: function () {
        var d = randomSearchWords(COLOUR_POOL, 4);
        var result = d.found ? "TRUE" : "FALSE";
        return {
          prompt: "Colours = [\"" + d.arr.join("\", \"") + "\"]\nSearchColour is \"" + d.searchValue + "\".\nWhat will Found equal after the loop ends?",
          answers: [result], keywords: [new RegExp("^\\s*" + result + "\\s*$", "i")],
          distractors: dedupeDistractors(result, [d.found ? "FALSE" : "TRUE", d.searchValue, d.arr[0]]),
          note: d.found
            ? "\"" + d.searchValue + "\" is Colours[" + d.foundAt + "], so Found becomes TRUE."
            : "\"" + d.searchValue + "\" does not match any of the four stored colours, so Found is never set to TRUE."
        };
      }
    },
    {
      id: "l4-trace-5", category: "searchtrace",
      prompt: "Names = [\"Ivy\", \"Omar\", \"Zara\", \"Leo\", \"Mia\", \"Kofi\"]\nSearchName is \"Kofi\".\nAt which position (Index) does the match happen?",
      answers: ["6"],
      keywords: [/^\s*6\s*$/],
      distractors: ["1","5","4","It never matches"],
      note: "\"Kofi\" is the sixth and last name in the array.",
      randomize: function () {
        var n = randInt(4, 6);
        var arr = sample(NAME_POOL, n);
        var pos = randInt(1, n);
        var name = arr[pos - 1];
        var ordinal = ["first", "second", "third", "fourth", "fifth", "sixth"][pos - 1];
        return {
          prompt: "Names = [\"" + arr.join("\", \"") + "\"]\nSearchName is \"" + name + "\".\nAt which position (Index) does the match happen?",
          answers: [String(pos)], keywords: [new RegExp("^\\s*" + pos + "\\s*$")],
          distractors: dedupeDistractors(pos, [1, n, "It never matches"], function (i) { return pos + i; }),
          note: "\"" + name + "\" is the " + ordinal + " name in the array."
        };
      }
    },
    {
      id: "l4-flag-init", category: "searchflag",
      prompt: "Why must Found <- FALSE be written BEFORE the search loop begins?",
      answers: ["So Found starts fresh for every new search, not carrying over an old value"],
      keywords: [/(?=.*(fresh|new|start|before))(?=.*(search|loop|old|carry))/i],
      distractors: ["So the loop runs faster","So the array can be declared","It does not matter where it is written","So Found can never become TRUE"],
      note: "Without resetting it first, Found could still hold TRUE from an earlier search."
    },
    {
      id: "l4-flag-onlytrue", category: "searchflag",
      prompt: "Inside the loop, does the IF ever set Found back to FALSE?",
      answers: ["No, it only ever sets Found to TRUE"],
      keywords: [/^\s*no\b/i],
      distractors: ["Yes, every time there is no match","Yes, but only on the last position","Yes, at the start of every pass"],
      note: "The IF only ever changes Found to TRUE. If it also reset Found to FALSE on a non-match, an earlier real match could be lost."
    },
    {
      id: "l4-flag-secondif", category: "searchflag",
      prompt: "Why is Found tested in a SECOND IF, written AFTER NEXT Index?",
      answers: ["So the result is reported only once the whole array has been checked"],
      keywords: [/\b(after|once|whole|finish)\b/i],
      distractors: ["So it can be tested before the loop starts","So the loop can be skipped entirely","Because ENDIF requires it","So Found can be reset to FALSE again"],
      note: "Testing Found only makes sense once every position has actually been checked."
    },
    {
      id: "l4-flag-boolean", category: "searchflag",
      prompt: "What data type is used to DECLARE a variable like Found?",
      answers: ["BOOLEAN"],
      keywords: [/boolean/i],
      distractors: ["INTEGER","STRING","REAL","CHAR"],
      note: "Found only ever stores TRUE or FALSE, so its type is BOOLEAN."
    },
    {
      id: "l4-flag-output", category: "searchflag",
      prompt: "IF Found = TRUE THEN\n    OUTPUT \"Found\"\nELSE\n    OUTPUT \"Not Found\"\nENDIF\n\nWhat determines which line runs here?",
      answers: ["The value stored in Found after the loop finished"],
      keywords: [/(?=.*found)(?=.*(value|after|loop|finish))/i],
      distractors: ["The value of Index","The size of the array","Whichever line comes first"],
      note: "This second IF only checks the Found flag's final value, not the array or the loop counter directly."
    },
    {
      id: "l4-write-1", category: "searchwrite",
      prompt: "The array Ages = [15, 22, 8, 34, 19] is stored. An algorithm searches for SearchAge and outputs \"Found\" or \"Not Found\". If SearchAge is 8, what should it display?",
      answers: ["Found"],
      keywords: [/^\s*found\s*\.?\s*$/i],
      distractors: ["Not Found","8","15"],
      note: "8 is the third value in Ages, so it is found.",
      randomize: function () {
        var d = randomSearchArray(5, 1, 40);
        var result = d.found ? "Found" : "Not Found";
        return {
          prompt: "The array Ages = [" + d.arr.join(", ") + "] is stored. An algorithm searches for SearchAge and outputs \"Found\" or \"Not Found\". If SearchAge is " + d.searchValue + ", what should it display?",
          answers: [result], keywords: [d.found ? /^\s*found\s*\.?\s*$/i : /not found/i],
          distractors: dedupeDistractors(result, [d.found ? "Not Found" : "Found", String(d.searchValue), String(d.arr[0])]),
          note: d.found ? d.searchValue + " is the " + ["first", "second", "third", "fourth", "fifth"][d.foundAt - 1] + " value in Ages, so it is found." : d.searchValue + " does not appear in Ages, so it is not found."
        };
      }
    },
    {
      id: "l4-write-2", category: "searchwrite",
      prompt: "The array Colours = [\"Red\", \"Green\", \"Blue\", \"Yellow\"] is stored. An algorithm searches for SearchColour. If SearchColour is \"Purple\", what should it display?",
      answers: ["Not Found"],
      keywords: [/not found/i],
      distractors: ["Found","Purple","Red"],
      note: "\"Purple\" is not one of the four stored colours.",
      randomize: function () {
        var d = randomSearchWords(COLOUR_POOL, 4);
        var result = d.found ? "Found" : "Not Found";
        return {
          prompt: "The array Colours = [\"" + d.arr.join("\", \"") + "\"] is stored. An algorithm searches for SearchColour. If SearchColour is \"" + d.searchValue + "\", what should it display?",
          answers: [result], keywords: [new RegExp("^\\s*" + result + "\\s*$", "i")],
          distractors: dedupeDistractors(result, [d.found ? "Not Found" : "Found", d.searchValue, d.arr[0]]),
          note: d.found ? "\"" + d.searchValue + "\" is one of the stored colours." : "\"" + d.searchValue + "\" is not one of the stored colours."
        };
      }
    },
    {
      id: "l4-write-3", category: "searchwrite",
      prompt: "An array of 6 names is stored. What must the FOR loop's range be to check every position?",
      answers: ["1 TO 6"],
      keywords: [/1\s*(to|-)\s*6/i],
      distractors: ["0 TO 6","1 TO 5","0 TO 5","1 TO 7"],
      note: "Cambridge pseudocode arrays start at 1, so all 6 positions need FOR Index <- 1 TO 6.",
      randomize: function () {
        var n = randInt(4, 9);
        var answer = "1 TO " + n;
        return {
          prompt: "An array of " + n + " names is stored. What must the FOR loop's range be to check every position?",
          answers: [answer], keywords: [new RegExp("^\\s*1\\s*(to|-)\\s*" + n + "\\s*$", "i")],
          distractors: dedupeDistractors(answer, ["0 TO " + n, "1 TO " + (n - 1), "0 TO " + (n - 1), "1 TO " + (n + 1)]),
          note: "Cambridge pseudocode arrays start at 1, so all " + n + " positions need FOR Index <- 1 TO " + n + "."
        };
      }
    },
    {
      id: "l4-write-4", category: "searchwrite",
      prompt: "What line must come immediately after NEXT Index in a linear search algorithm, before reporting the result?",
      answers: ["IF Found = TRUE THEN"],
      keywords: [/if\s*found\s*=\s*true\s*then/i],
      distractors: ["FOR Index <- 1 TO n","Found <- FALSE","INPUT SearchValue","ENDIF"],
      note: "The second IF, testing Found, comes right after the loop ends."
    },
    {
      id: "l4-write-5", category: "searchwrite",
      prompt: "The array Values = [8, 15, 3, 21] is stored. If SearchValue is 3, how many times does line 4 (the comparison IF) run in total?",
      answers: ["4"],
      keywords: [/^\s*4\s*$/],
      distractors: ["1","3","2","8"],
      note: "The loop always checks every position from 1 to 4, regardless of where the match is.",
      randomize: function () {
        var n = randInt(3, 7);
        var d = randomSearchArray(n, 1, 40);
        return {
          prompt: "The array Values = [" + d.arr.join(", ") + "] is stored. If SearchValue is " + d.searchValue + ", how many times does line 4 (the comparison IF) run in total?",
          answers: [String(n)], keywords: [new RegExp("^\\s*" + n + "\\s*$")],
          distractors: dedupeDistractors(n, [1, Math.max(1, d.foundAt), d.searchValue], function (i) { return n + i; }),
          note: "The loop always checks every position from 1 to " + n + ", regardless of where the match is."
        };
      }
    }
  ]
});
