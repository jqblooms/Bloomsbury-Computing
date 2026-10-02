// Year 6, 6.2.4.6 Do Now Extension: Scratch skills from 6.2.1 to 6.2.4.
// Loaded by Drills/index.html?drill=y6-bughunt-l46-ext
// For students who finish the Do Now early: a selection of 10 questions across Year 6 so far, written fresh. Every
// card has an `example`, a similar question worked through with different numbers, holding every rule and step
// needed, then two `working` nudges. An example never shows the card's own answer.
DrillData.register("y6-bughunt-l46-ext", {
  title: "Year 6 Extension: Scratch Skills",
  subtitle: "6.2.4.6 Do Now Extension",
  // Races show buttons for every card, numbers too: Year 6 never has to guess a typed answer's wording.
  choiceOnly: true,
  categories: [
    ["ex-move", "Moving and the Stage"],
    ["ex-loops", "Loops"],
    ["ex-vars", "Variables and Decisions"],
    ["ex-looks", "Costumes and Messages"]
  ],
  cards: (function () {
    function pick(list, avoid) { var v; do { v = drillPick(list); } while (avoid.indexOf(v) !== -1); return v; }
    return [
      // ------------------------------------------------ 6.2.1 Events and Coordinates
      { id: "ex-01", category: "ex-move", randomize: function () {
          var step, n, x0, dir, ans;
          do {
            step = drillPick([5, 10, 15, 20]); n = drillRange(2, 6); x0 = drillRange(-50, 50, 10); dir = drillPick([1, -1]);
            ans = x0 + dir * n * step;
          } while (ans === 70 || [x0, dir * step].indexOf(ans) !== -1);
          var key = dir > 0 ? "right arrow" : "left arrow";
          return {
            blocks: "when [" + key + " v] key pressed\nchange x by (" + (dir * step) + ")",
            prompt: "The sprite is at x: " + x0 + ". The player presses the " + key + " " + n + " times. What is x now?",
            answers: [String(ans)], keywords: [drillNumberRe(ans, "x")],
            distractors: drillWrongNumbers(ans, [x0 - dir * n * step, dir * n * step, x0 + dir * step, x0 + dir * (n + 1) * step], 3),
            example: "Example: a sprite is at x: 10. The script is when [right arrow] key pressed, change x by (20). The player presses the right arrow 3 times.\nStep 1: each press runs the script once, so x changes 3 times.\nStep 2: 3 presses of 20 is 3 x 20 = 60.\nStep 3: start at 10 and add 60: x is now 70.\nA negative number in change x moves left, so take it away instead.",
            working: ["Each press adds " + (dir * step) + " to x. How many presses?", "Start at x: " + x0 + ", then add " + (dir * step) + " for every press."],
            note: n + " presses of " + (dir * step) + " from x: " + x0 + " is " + ans + "."
          };
        } },
      { id: "ex-02", category: "ex-move",
        prompt: "Which block moves a sprite down the stage?",
        answers: ["change y by (-20)"],
        keywords: [/change\s*y\s*(by)?\s*\(?\s*[-−]\s*20\b/i],
        distractors: ["change y by (20)", "change x by (-20)", "change x by (20)"],
        example: "Example: which block moves a sprite to the right?\nLeft and right is x. Up and down is y.\nRight makes x bigger, so add a positive number: change x by (20) moves right, and change x by (-20) would move left.",
        working: ["Up and down is y. Left and right is x.", "Down makes y smaller, so the number is negative."],
        note: "change y by a negative number moves the sprite down." },
      // ------------------------------------------------ 6.2.2 Loops and Pong
      { id: "ex-03", category: "ex-loops", randomize: function () {
          var n, d, ans;
          do { n = drillRange(3, 8); d = drillPick([5, 15, 20, 25]); ans = n * d; } while (ans === 40);
          return {
            blocks: "when flag clicked\nset x to (0)\nrepeat (" + n + ")\nchange x by (" + d + ")\nend",
            prompt: "What is x after the loop?",
            answers: [String(ans)], keywords: [drillNumberRe(ans, "x")],
            distractors: drillWrongNumbers(ans, [d, n + d, (n + 1) * d, (n - 1) * d], 3),
            example: "Example: set x to (0), then repeat (4) with change x by (10) inside.\nStep 1: x starts at 0.\nStep 2: the loop runs 4 times, and each time adds 10.\nStep 3: 4 x 10 = 40, so x is 40 after the loop.",
            working: ["How many times does the loop run? How much does each turn add?", "Multiply the number of turns by the amount added each turn."],
            note: n + " turns of " + d + " is " + ans + "."
          };
        } },
      { id: "ex-04", category: "ex-loops", randomize: function () {
          var n, w, ans;
          do { n = drillPick([2, 4, 5, 6, 8]); w = drillPick([0.5, 2]); ans = n * w; } while (ans === 3);
          return {
            blocks: "repeat (" + n + ")\nnext costume\nwait (" + w + ") seconds\nend",
            prompt: "How many seconds does this loop take?",
            answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: drillWrongNumbers(ans, [n, w, n + w, ans * 2], 3),
            example: "Example: repeat (6) with wait (0.5) seconds inside.\nStep 1: the wait runs once every turn, so it runs 6 times.\nStep 2: each wait is 0.5 seconds: 6 x 0.5 = 3.\nThe loop takes 3 seconds. next costume takes no time at all.",
            working: ["The wait runs once every turn of the loop.", "Multiply the number of turns by the length of the wait."],
            note: n + " waits of " + w + " seconds is " + ans + " seconds."
          };
        } },
      { id: "ex-05", category: "ex-loops",
        prompt: "Which loop keeps running the blocks inside it until the game stops?",
        answers: ["forever"],
        keywords: [/^\s*(a\s+|the\s+)?forever(\s+loop)?\s*$/i],
        distractors: ["repeat (10)", "if then", "wait (1)"],
        example: "Example: which loop runs the blocks inside it exactly 10 times, then carries on?\nrepeat (10) counts the turns and stops after 10, then the blocks under it run.\nA loop that never stops by itself has no number to count to.",
        working: ["This loop has no number in it: it never counts.", "Nothing can go underneath it, because it never ends."],
        note: "forever never finishes, so it keeps a game running."
      },
      // ------------------------------------------------ 6.2.3 Variables and Decisions
      { id: "ex-06", category: "ex-vars", randomize: function () {
          var start, misses, ans;
          do { start = drillPick([3, 4, 5]); misses = drillRange(1, start); ans = start - misses; } while ((start === 5 && misses === 2) || ans === 1);
          return {
            blocks: "when flag clicked\nset [lives v] to (" + start + ")",
            prompt: "Each miss runs change [lives v] by (-1). The player misses " + misses + " times. What is lives?",
            answers: [String(ans)], keywords: [drillNumberRe(ans, "lives")],
            distractors: drillWrongNumbers(ans, [start + misses, misses, start, ans + 1], 3),
            example: "Example: set [lives] to (5), then the player misses 2 times.\nStep 1: each miss runs change [lives] by (-1), which takes 1 away.\nStep 2: 2 misses take away 2.\nStep 3: 5 - 2 = 3, so lives is 3.",
            working: ["lives starts at " + start + ". Each miss takes 1 away.", "Take away the number of misses from " + start + "."],
            note: start + " take away " + misses + " is " + ans + "."
          };
        } },
      { id: "ex-07", category: "ex-vars", randomize: function () {
          var a, b, c, ans;
          do { a = drillRange(2, 9); b = drillRange(2, 9); c = drillRange(1, 4); ans = b + c; } while (ans === 6 || a === b);
          return {
            blocks: "set [score v] to (" + a + ")\nchange [score v] by (3)\nset [score v] to (" + b + ")\nchange [score v] by (" + c + ")",
            prompt: "What is score after these four blocks?",
            answers: [String(ans)], keywords: [drillNumberRe(ans, "score")],
            distractors: drillWrongNumbers(ans, [a + 3 + b + c, a + 3, b, a + c], 3),
            example: "Example: set [score] to (4), change [score] by (2), set [score] to (5), change [score] by (1).\nset replaces the value. change adds to it.\nStep 1: set to 4, so score is 4. Step 2: change by 2, so score is 6.\nStep 3: set to 5 replaces the 6, so score is 5. Step 4: change by 1, so score is 6.",
            working: ["Work through the blocks in order. set throws away the old value.", "After the second set, score is " + b + ". Then add the last change."],
            note: "The last set makes score " + b + ", then it goes up by " + c + ": " + ans + "."
          };
        } },
      { id: "ex-08", category: "ex-vars", randomize: function () {
          var t = pick([5, 9, 10], []), ans = t + 1;
          return {
            blocks: "if <(score) > (" + t + ")> then\nsay [You win!]\nend",
            prompt: "score goes up by 1 at a time, starting at 0. What is the smallest score that makes the sprite say You win!?",
            answers: [String(ans)], keywords: [drillNumberRe(ans, "score")],
            distractors: [String(t), String(t - 1), String(t + 2)],
            example: "Example: if <(clicks) > (7)> then say [Well done].\n> means more than. Equal does not count.\nclicks = 6: 6 is not more than 7. clicks = 7: equal, so not more than 7.\nclicks = 8: 8 is more than 7, so 8 is the smallest number that works.",
            working: ["Is " + t + " more than " + t + "? Equal does not count.", "Try the next number up after " + t + "."],
            note: t + " is not more than " + t + ". " + ans + " is the first score that is."
          };
        } },
      // ------------------------------------------------ 6.2.4 Costumes, Backdrops and Messages
      { id: "ex-09", category: "ex-looks",
        prompt: "Which block sends a message to every sprite and the stage?",
        answers: ["broadcast"],
        keywords: [/broadcast/i],
        distractors: ["say [message]", "when I receive", "next costume"],
        example: "Example: which block starts a script when a message arrives?\nwhen I receive [level up] is a hat block. Its script waits until the message level up is sent, then runs.\nThe message has to be sent by a different block, from any sprite or the stage.",
        working: ["You are looking for the block that sends, not the one that waits.", "It is in the Events blocks, next to when I receive."],
        note: "broadcast sends the message. Every when I receive script with that message starts."
      },
      { id: "ex-10", category: "ex-looks",
        prompt: "A sprite has two costumes. Which block, inside a loop, swaps between them to make it walk?",
        answers: ["next costume"],
        keywords: [/next\s*costume/i],
        distractors: ["next backdrop", "switch backdrop", "show"],
        example: "Example: which block changes the picture on the stage to the Level 2 picture?\nswitch backdrop to [Level 2] changes the stage's backdrop.\nA sprite's own pictures are called costumes, and they have their own blocks.",
        working: ["A sprite's pictures are costumes. The stage's pictures are backdrops.", "You want the block that moves on to the following costume each time."],
        note: "next costume inside forever, with a short wait, makes an animation."
      }
    ];
  })()
});
