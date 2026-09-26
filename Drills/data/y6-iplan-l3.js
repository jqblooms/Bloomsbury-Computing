// Year 6, 6.2.3: Variables and Decisions
// Loaded by Drills/index.html?drill=y6-iplan-l3
DrillData.register("y6-iplan-l3", {
  title: "Year 6, 6.2.3: Variables and Decisions",
  subtitle: "Scratch: variables, comparisons and if then else",
  categories: [
    ["variables", "Variables"],
    ["compare", "Comparisons"],
    ["ifelse", "If Then Else"],
    ["catcher", "Game Scripts"]
  ],
  cards: [
    {
      id: "v-what", category: "variables",
      prompt: "What is a variable?",
      answers: ["A named place that stores a value that can change"],
      keywords: [[["store", "stores", "storing", "holds", "hold", "keeps", "keep", "saves", "save", "remembers", "remember"], ["value", "values", "number", "numbers", "data", "information", "score", "something"]]],
      distractors: ["A block that repeats forever", "A picture a sprite can wear", "The background of the stage"],
      note: "score, lives and clicks are variables: each stores a number that changes while the game runs."
    },
    {
      id: "v-set", category: "variables",
      prompt: "Which block puts score back to 0 at the start of a game?",
      answers: ["set [score] to (0)"],
      keywords: [/^\s*set\b(?!.*\bchange\b).*\b0\b/i],
      distractors: ["change [score] by (0)", "change [score] by (-1)", "show variable [score]"],
      note: "set gives the variable a new value. change adds to the value it already has."
    },
    {
      id: "v-change", category: "variables",
      prompt: "Which block adds 1 to score?",
      answers: ["change [score] by (1)"],
      keywords: [/^\s*change\s*\[?\s*score\s*(v\s*)?\]?\s*by\s*\(?\s*\+?\s*1\s*\)?\s*$/i],
      distractors: ["set [score] to (1)", "change [score] by (-1)", "say (score)"],
      note: "change [score] by (1) adds 1. set [score] to (1) would replace the score with 1."
    },
    {
      id: "v-clicks", category: "variables",
      randomize: function () {
        var k = drillPick([1, 2, 5]), n = drillRange(3, 9);
        var ans = n * k;
        return {
          blocks: "when flag clicked\nset [clicks v] to (0)\n\nwhen this sprite clicked\nchange [clicks v] by (" + k + ")",
          prompt: "After the green flag, the player clicks the sprite " + n + " times. What is clicks?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "clicks")],
          distractors: drillWrongNumbers(ans, [n, k, n + k, (n - 1) * k], 3),
          working: ["clicks starts at 0. After one click it is " + k + ". Keep adding " + k + " for each click.", "Start at 0 and add " + k + " for each click.", "Which script runs on each click?"],
          note: n + " clicks, each adding " + k + ": " + ans + "."
        };
      }
    },
    {
      id: "v-flag", category: "variables",
      blocks: "when flag clicked\nset [clicks v] to (0)\n\nwhen this sprite clicked\nchange [clicks v] by (1)",
      prompt: "clicks is 9. The player clicks the green flag. What is clicks now?",
      answers: ["0"],
      keywords: [drillNumberRe(0, "clicks"), /^\s*zero\s*$/i],
      distractors: ["9", "10", "1"],
      working: ["Which script runs when the green flag is clicked, and what does it do to clicks?", "Read the green flag script.", "The green flag starts a new game."],
      note: "The green flag script sets clicks to 0."
    },
    {
      id: "v-lives", category: "variables",
      randomize: function () {
        var start = drillPick([3, 4, 5]), misses = drillRange(1, start);
        var ans = start - misses;
        return {
          blocks: "when flag clicked\nset [lives v] to (" + start + ")",
          prompt: "Each miss runs change [lives v] by (-1). The player misses " + misses + " times. What is lives?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "lives")],
          distractors: drillWrongNumbers(ans, [start + misses, misses, start, ans + 1], 3),
          working: ["lives starts at " + start + ". Each miss takes one away, " + misses + " times.", "Start at " + start + " and take one away for each miss.", "change by (-1) takes one away."],
          note: start + " take away " + misses + " is " + ans + "."
        };
      }
    },
    {
      id: "c-gt", category: "compare",
      randomize: function () {
        var t = drillPick([5, 9, 10]), s = t + drillPick([-1, 0, 1]);
        var ans = s > t ? "true" : "false";
        return {
          prompt: "score is " + s + ". Is (score) > (" + t + ") true or false?",
          answers: [ans],
          keywords: [new RegExp("^\\s*" + ans + "\\s*$", "i")],
          distractors: [ans === "true" ? "false" : "true"],
          working: ["Is " + s + " bigger than " + t + "? Equal does not count as bigger.", "More than means bigger, not equal.", "Compare the two numbers."],
          note: s + (s > t ? " is" : " is not") + " more than " + t + "."
        };
      }
    },
    {
      id: "c-lt", category: "compare",
      randomize: function () {
        var t = drillPick([3, 10, 20]), s = t + drillPick([-2, 0, 2]);
        var ans = s < t ? "true" : "false";
        return {
          prompt: "clicks is " + s + ". Is (clicks) < (" + t + ") true or false?",
          answers: [ans],
          keywords: [new RegExp("^\\s*" + ans + "\\s*$", "i")],
          distractors: [ans === "true" ? "false" : "true"],
          working: ["Is " + s + " smaller than " + t + "? Equal does not count as smaller.", "Less than means smaller, not equal.", "Compare the two numbers."],
          note: s + (s < t ? " is" : " is not") + " less than " + t + "."
        };
      }
    },
    {
      id: "c-boundary", category: "compare",
      prompt: "A win should happen when clicks reaches 10. Which is true at 10 clicks but not at 9: (clicks) > (9) or (clicks) > (10)?",
      answers: ["(clicks) > (9)"],
      keywords: [/^[^0-9=<]*(>|more|greater)[^0-9]*\b9\b[^0-9]*$/i, /^\s*\(?\s*9\s*\)?\s*$/],
      distractors: ["(clicks) > (10)", "(clicks) < (10)", "(clicks) = (9)"],
      working: ["Try each condition with clicks at 9, then at 10. Which one changes from false to true?", "At 10 clicks, is 10 more than 10?", "Test both conditions."],
      note: "10 > 9 is true and 9 > 9 is false. But 10 > 10 is false, so that one misses the win."
    },
    {
      id: "ie-say", category: "ifelse",
      randomize: function () {
        var n = drillPick([3, 7, 9, 10, 12, 15]);
        var ans = n < 10 ? "Keep going!" : "You win!";
        return {
          blocks: "if <(clicks) < (10)> then\nsay [Keep going!]\nelse\nsay [You win!]\nend",
          prompt: "clicks is " + n + ". What does the sprite say?",
          answers: [ans],
          keywords: [n < 10 ? /^\W*keep\s+going\W*$/i : /^\W*you\s+win\W*$/i],
          distractors: [n < 10 ? "You win!" : "Keep going!", "Nothing"],
          working: ["Is " + n + " less than 10? True runs the top part, false runs the else part.", "Work out the condition first.", "True: top part. False: else part."],
          note: n + (n < 10 ? " is" : " is not") + " less than 10, so the " + (n < 10 ? "top" : "else") + " part runs."
        };
      }
    },
    {
      id: "ie-false", category: "ifelse",
      prompt: "The condition in an if then else block is false. Which part runs?",
      answers: ["The else part"],
      keywords: [/\belse\b|bottom|second|lower/i],
      distractors: ["The top part", "Both parts", "Neither part"],
      note: "True runs the top part, false runs the else part. Never both."
    },
    {
      id: "ie-lives", category: "ifelse",
      blocks: "if <(lives) = (0)> then\nsay [Game over]\nstop [all v]\nend",
      prompt: "What must lives be for this game to stop?",
      answers: ["0"],
      keywords: [drillNumberRe(0, "lives"), /^\s*zero\s*$/i],
      distractors: ["1", "3", "10"],
      working: ["An equals condition is true for one exact value only. Which value is in the block?", "Read the condition in the if block.", "When is the condition true?"],
      note: "(lives) = (0) is true only when lives is exactly 0."
    },
    {
      id: "g-random", category: "catcher",
      prompt: "Which block gives a different number each time, so the Apple drops from a new place?",
      answers: ["pick random (-200) to (200)"],
      keywords: [/random/i],
      distractors: ["go to x: (0) y: (170)", "change y by (-5)", "set x to (0)"],
      note: "go to x: (pick random (-200) to (200)) y: (170) drops the Apple from anywhere along the top."
    },
    {
      id: "g-catch", category: "catcher",
      prompt: "Which condition is true when the Bowl catches the Apple?",
      answers: ["touching [Bowl]?"],
      keywords: [/touching/i],
      distractors: ["(y position) < (-170)", "key [space] pressed?", "(score) = (0)"],
      note: "The Apple asks whether it is touching the Bowl."
    },
    {
      id: "g-misses", category: "catcher",
      randomize: function () {
        var lives = drillPick([3, 4, 5]);
        return {
          blocks: "when flag clicked\nset [lives v] to (" + lives + ")\n\nif <(lives) = (0)> then\nstop [all v]\nend",
          prompt: "Each miss takes 1 from lives. How many misses end the game?",
          answers: [String(lives)],
          keywords: [new RegExp("^\\s*" + lives + "\\s*(miss(es)?)?\\s*$", "i")],
          distractors: drillWrongNumbers(lives, [lives - 1, lives + 1, 1, 0], 3),
          working: ["lives starts at " + lives + " and each miss takes 1 away. Count down to 0.", "How many times can you take 1 from " + lives + " before it is 0?", "Count down."],
          note: "lives goes from " + lives + " down to 0 after " + lives + " misses."
        };
      }
    }
  ]
});
