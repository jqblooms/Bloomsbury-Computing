// Year 6, 6.2.1: Events and Coordinates
// Loaded by Drills/index.html?drill=y6-icontrol-l1
// Cards with `blocks` show a real Scratch script (scratchblocks text).
// Cards with randomize() draw new numbers every time, so the answer
// has to be worked out rather than remembered.
DrillData.register("y6-icontrol-l1", {
  title: "Year 6, 6.2.1: Events and Coordinates",
  subtitle: "Scratch: events, the stage grid and motion",
  // Races show buttons for every card, numbers too: Year 6 never has to guess a typed answer's wording.
  choiceOnly: true,
  categories: [
    ["events", "Events"],
    ["grid", "The Stage Grid"],
    ["motion", "Motion Blocks"],
    ["predict", "Predict the Position"]
  ],
  cards: [
    {
      id: "ev-flag", category: "events",
      blocks: "when flag clicked\ngo to x: (0) y: (0)",
      prompt: "What does the player do to run this script?",
      answers: ["Click the green flag"],
      keywords: [/green\s*flag/i, /\bflag\b/i],
      distractors: ["Click the sprite", "Press the space bar", "Move the mouse"],
      working: ["Read the hat block at the top of the script.", "It is the button you press to start a Scratch game."],
      note: "The green flag starts the game, so it runs every when flag clicked script."
    },
    {
      id: "ev-key", category: "events",
      blocks: "when [space v] key pressed\nchange y by (50)",
      prompt: "What does the player do to run this script?",
      answers: ["Press the space bar"],
      keywords: [/\bspace\b/i],
      distractors: ["Click the green flag", "Click the sprite", "Press the up arrow"],
      working: ["Read the hat block at the top of the script.", "Which key is named in the hat block?"],
      note: "when [space] key pressed waits for that one key."
    },
    {
      id: "ev-sprite", category: "events",
      blocks: "when this sprite clicked\nsay [Ouch!] for (1) seconds",
      prompt: "What does the player do to make the sprite say Ouch!?",
      answers: ["Click the sprite"],
      keywords: [[["click", "clicks", "clicking", "clicked", "press", "tap"], ["sprite", "it"]]],
      distractors: ["Click the green flag", "Press any key", "Move the mouse over the stage"],
      working: ["Read the hat block at the top of the script.", "The hat block names what the player clicks."],
      note: "when this sprite clicked runs when the mouse clicks on that sprite."
    },
    {
      id: "ev-click", category: "events",
      blocks: "when this sprite clicked\nsay [Ouch!] for (2) seconds",
      prompt: "What must the player do to make the sprite say Ouch!?",
      answers: ["Click the sprite"],
      keywords: [/sprite/i],
      distractors: ["Click the green flag", "Press the space key", "Press any key"],
      working: ["Read the hat block at the top of the script.", "The hat block waits for one thing to happen, then runs the blocks under it."],
      note: "when this sprite clicked waits for a click on that sprite."
    },
    {
      id: "ev-order", category: "events",
      blocks: "when flag clicked\ngo to x: (0) y: (0)\nsay [Hi!] for (2) seconds\nchange x by (50)",
      prompt: "Which block runs straight after the go to block?",
      answers: ["say [Hi!] for (2) seconds"],
      keywords: [/\bsay\b/i],
      distractors: ["change x by (50)", "go to x: (0) y: (0)", "glide (2) secs to x: (50) y: (0)"],
      working: ["Scripts run from top to bottom.", "Find the go to block. Which block is right under it?"],
      note: "Blocks run in order from the top, one after another."
    },
    {
      id: "g-movex", category: "grid",
      randomize: function () {
        var x0, d, ans;
        do { x0 = drillRange(-100, 100, 20); d = drillPick([30, 40, 50, -30, -40, -50]); ans = x0 + d; } while ([x0, d].indexOf(ans) !== -1);
        return {
          blocks: "when flag clicked\ngo to x: (" + x0 + ") y: (0)\nchange x by (" + d + ")",
          prompt: "What is x after this script runs?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "x")],
          distractors: drillWrongNumbers(ans, [x0 - d, d, x0, -ans], 3),
          working: ["The sprite starts where go to puts it.", "change x adds its number to x. A negative number takes away."],
          note: x0 + " + " + d + " = " + ans + "."
        };
      }
    },
    {
      id: "g-movey", category: "grid",
      randomize: function () {
        var y0, d, ans;
        do { y0 = drillRange(-100, 100, 20); d = drillPick([20, 30, 50, -20, -30, -50]); ans = y0 + d; } while ([y0, d].indexOf(ans) !== -1);
        return {
          blocks: "when flag clicked\ngo to x: (0) y: (" + y0 + ")\nchange y by (" + d + ")",
          prompt: "What is y after this script runs?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "y")],
          distractors: drillWrongNumbers(ans, [y0 - d, d, y0, -ans], 3),
          working: ["The sprite starts where go to puts it.", "change y adds its number to y. A negative number takes away."],
          note: y0 + " + " + d + " = " + ans + "."
        };
      }
    },
    {
      id: "g-up", category: "grid",
      prompt: "Which block moves a sprite up the stage?",
      answers: ["change y by (20)"],
      keywords: [/change\s*y\s*(by)?\s*\(?\s*\+?\s*20\b/i],
      distractors: ["change y by (-20)", "change x by (20)", "change x by (-20)"],
      working: ["Up and down is y. Left and right is x.", "Up makes y bigger."],
      note: "change y by a positive number moves the sprite up."
    },
    {
      id: "g-where", category: "grid",
      randomize: function () {
        var sx = drillPick([1, -1]), sy = drillPick([1, -1]), x = sx * drillPick([60, 100, 150]), y = sy * drillPick([50, 80, 120]);
        var all = ["Right and up", "Left and up", "Right and down", "Left and down"];
        var ans = (sx > 0 ? "Right" : "Left") + " and " + (sy > 0 ? "up" : "down");
        return {
          blocks: "when flag clicked\ngo to x: (" + x + ") y: (" + y + ")",
          prompt: "Where does this put the sprite, from the middle of the stage?",
          answers: [ans],
          keywords: [new RegExp("^\\s*" + ans.replace(/ /g, "\\s+") + "\\s*$", "i")],
          distractors: all.filter(function (a) { return a !== ans; }),
          working: ["The middle is x: 0, y: 0. A positive x is right of it, a negative x is left.", "A positive y is above the middle, a negative y is below."],
          note: "x: " + x + " is " + (sx > 0 ? "right" : "left") + " of the middle and y: " + y + " is " + (sy > 0 ? "above" : "below") + " it."
        };
      }
    },
    {
      id: "g-centre", category: "grid",
      prompt: "What are x and y at the very middle of the stage?",
      answers: ["x: 0, y: 0"],
      keywords: [/^[^1-9]*\b0\b[^1-9]*\b0\b[^1-9]*$/],
      distractors: ["x: 240, y: 180", "x: 100, y: 100", "x: -240, y: -180"],
      working: ["The middle is where you have moved no distance left, right, up or down.", "Neither left nor right, neither up nor down.", "Which number means no distance at all?"],
      note: "The middle of the stage is x: 0, y: 0."
    },
    {
      id: "g-down", category: "grid",
      prompt: "A sprite moves straight down the stage. What happens to its y?",
      answers: ["It gets smaller"],
      keywords: [/^(?!.*\b(bigger|larger|more|increases?|higher|same)\b).*\b(smaller|less|lower|decreases?|goes\s+down|drops?)\b/i],
      distractors: ["It gets bigger", "It stays the same", "It becomes 240"],
      working: ["y is up and down. Up the stage, y gets bigger.", "Down is the opposite of up."],
      note: "Up the stage y gets bigger, down the stage y gets smaller."
    },
    {
      id: "m-goto", category: "motion",
      prompt: "Which block makes a sprite jump straight to an exact x and y?",
      answers: ["go to x: y:"],
      keywords: [/\bgo\s*to\b/i],
      distractors: ["glide (1) secs to x: y:", "change x by (10)", "move (10) steps"],
      working: ["This block moves the sprite at once, with no steps in between.", "It has boxes for x and y, and no seconds."],
      note: "go to x: y: jumps there at once. glide travels there over time."
    },
    {
      id: "m-glide", category: "motion",
      prompt: "Which block moves a sprite smoothly to an x and y, taking a number of seconds?",
      answers: ["glide (1) secs to x: y:"],
      keywords: [/\bglide/i],
      distractors: ["go to x: y:", "change x by (10)", "go to (random position)"],
      working: ["This block takes some time to arrive.", "Look for a block with seconds, x and y."],
      note: "The number in the glide block is how many seconds the journey takes."
    },
    {
      id: "m-left", category: "motion",
      prompt: "Which block moves a sprite 10 steps to the left?",
      answers: ["change x by (-10)"],
      keywords: [/change\s*x\s*(by)?\s*\(?\s*[-−]\s*10\b/i],
      distractors: ["change x by (10)", "change y by (-10)", "set x to (-10)"],
      working: ["Left and right is x. Left makes x smaller.", "Smaller means a negative number."],
      note: "Left makes x smaller, so the number is negative."
    },
    {
      id: "m-up", category: "motion",
      prompt: "Which block moves a sprite 10 steps up?",
      answers: ["change y by (10)"],
      keywords: [/change\s*y\s*(by)?\s*\(?\s*\+?\s*10\b/i],
      distractors: ["change y by (-10)", "change x by (10)", "set y to (10)"],
      working: ["Up and down is y. Up makes y bigger.", "Bigger means a positive number."],
      note: "Up makes y bigger, so change y by a positive number."
    },
    {
      id: "p-changes", category: "predict",
      randomize: function () {
        var x0, a, b, ans;
        do { x0 = drillRange(-100, 100, 10); a = drillPick([20, 30, 40, 50, 60, 80]); b = -drillPick([10, 20, 30, 40]); ans = x0 + a + b; }
        while ([x0, a, b, x0 + a].indexOf(ans) !== -1);
        return {
          blocks: "when flag clicked\ngo to x: (" + x0 + ") y: (0)\nchange x by (" + a + ")\nchange x by (" + b + ")",
          prompt: "What is x when this script ends?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "x")],
          distractors: drillWrongNumbers(ans, [x0 + a - b, x0 - a + b, a + b, x0 + a], 3),
          working: ["Start at x: " + x0 + ". Add " + a + " to get " + (x0 + a) + ". Now add " + b + ".", "Start at x: " + x0 + ", then do each change x block in order.", "Follow the change x blocks from the top."],
          note: "Start at x: " + x0 + ", add " + a + ", then add " + b + ": " + ans + "."
        };
      }
    },
    {
      id: "p-y", category: "predict",
      randomize: function () {
        var y0, a, dx, b, ans;
        do { y0 = drillRange(-60, 60, 20); a = drillPick([30, 40, 50, 70]); dx = drillPick([25, 35, 45]); b = -drillPick([10, 20, 30]); ans = y0 + a + b; }
        while ([y0, a, b, y0 + a].indexOf(ans) !== -1);
        return {
          blocks: "when flag clicked\ngo to x: (0) y: (" + y0 + ")\nchange y by (" + a + ")\nchange x by (" + dx + ")\nchange y by (" + b + ")",
          prompt: "What is y when this script ends?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "y")],
          distractors: drillWrongNumbers(ans, [ans + dx, y0 + a, y0 + a - b, a + b], 3),
          working: ["Start at y: " + y0 + ". Add " + a + " to get " + (y0 + a) + ". Skip the change x block. Now add " + b + ".", "Start at y: " + y0 + " and use only the change y blocks.", "change x does not change y."],
          note: "Only the change y blocks change y: " + y0 + " + " + a + " + (" + b + ") = " + ans + "."
        };
      }
    },
    {
      id: "p-keys", category: "predict",
      randomize: function () {
        var step, n, x0, ans;
        do { step = drillPick([5, 10, 15, 20]); n = drillRange(2, 6); x0 = drillRange(-50, 50, 10); ans = x0 + n * step; }
        while ([x0, step, x0 + step].indexOf(ans) !== -1);
        return {
          blocks: "when [right arrow v] key pressed\nchange x by (" + step + ")",
          prompt: "The sprite is at x: " + x0 + ". The player presses the right arrow " + n + " times. What is x now?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "x")],
          distractors: drillWrongNumbers(ans, [n * step, x0 + step, x0 - n * step, x0 + (n + 1) * step], 3),
          working: ["After one press x is " + (x0 + step) + ". Keep adding " + step + " for each press.", "Start at x: " + x0 + " and add " + step + " for each press.", "Each press runs the script once."],
          note: n + " presses add " + step + " each: " + x0 + " + " + (n * step) + " = " + ans + "."
        };
      }
    },
    {
      id: "p-glide", category: "predict",
      randomize: function () {
        var gx, gy, cx, ans;
        do { gx = drillRange(-150, 150, 50); gy = drillRange(-100, 100, 50); cx = drillPick([-40, -20, 20, 40]); ans = gx + cx; }
        while ([gx, cx].indexOf(ans) !== -1);
        return {
          blocks: "when flag clicked\ngo to x: (0) y: (0)\nglide (2) secs to x: (" + gx + ") y: (" + gy + ")\nchange x by (" + cx + ")",
          prompt: "What is x when this script ends?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "x")],
          distractors: drillWrongNumbers(ans, [gx, cx, gx - cx, gy + cx], 3),
          working: ["The glide ends at x: " + gx + ". Then change x adds " + cx + ".", "Where does the glide end? Then do the change x.", "Follow the blocks from the top."],
          note: "The glide ends at x: " + gx + ", then change x adds " + cx + "."
        };
      }
    }
  ]
});
