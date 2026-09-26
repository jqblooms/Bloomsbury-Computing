// Year 6, 6.2.1: Events and Coordinates
// Loaded by Drills/index.html?drill=y6-icontrol-l1
// Cards with `blocks` show a real Scratch script (scratchblocks text).
// Cards with randomize() draw new numbers every time, so the answer
// has to be worked out rather than remembered.
DrillData.register("y6-icontrol-l1", {
  title: "Year 6, 6.2.1: Events and Coordinates",
  subtitle: "Scratch: events, the stage grid and motion",
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
      note: "The green flag starts the game, so it runs every when flag clicked script."
    },
    {
      id: "ev-key", category: "events",
      blocks: "when [space v] key pressed\nchange y by (50)",
      prompt: "What does the player do to run this script?",
      answers: ["Press the space bar"],
      keywords: [/\bspace\b/i],
      distractors: ["Click the green flag", "Click the sprite", "Press the up arrow"],
      note: "when [space] key pressed waits for that one key."
    },
    {
      id: "ev-sprite", category: "events",
      blocks: "when this sprite clicked\nsay [Ouch!] for (1) seconds",
      prompt: "What does the player do to make the sprite say Ouch!?",
      answers: ["Click the sprite"],
      keywords: [[["click", "clicks", "clicking", "clicked", "press", "tap"], ["sprite", "it"]]],
      distractors: ["Click the green flag", "Press any key", "Move the mouse over the stage"],
      note: "when this sprite clicked runs when the mouse clicks on that sprite."
    },
    {
      id: "ev-name", category: "events",
      prompt: "In Scratch, a key press or mouse click that starts a script is called an what?",
      answers: ["Event"],
      keywords: [/^\s*(an?\s+)?events?\s*$/i],
      distractors: ["Loop", "Variable", "Costume", "Sprite"],
      note: "The yellow Events blocks wait for these inputs."
    },
    {
      id: "ev-order", category: "events",
      blocks: "when flag clicked\ngo to x: (0) y: (0)\nsay [Hi!] for (2) seconds\nchange x by (50)",
      prompt: "Which block runs straight after the go to block?",
      answers: ["say [Hi!] for (2) seconds"],
      keywords: [/\bsay\b/i],
      distractors: ["change x by (50)", "when flag clicked", "go to x: (0) y: (0)"],
      note: "Blocks run in order from the top, one after another."
    },
    {
      id: "g-right", category: "grid",
      prompt: "What is x at the right-hand edge of the Scratch stage?",
      answers: ["240"],
      keywords: [drillNumberRe(240, "x")],
      distractors: ["180", "480", "100", "-240"],
      working: ["The stage is 480 steps wide and x: 0 is the middle, so the right edge is half of 480 from the middle.", "x: 0 is the middle. The right edge is half the stage width away.", "Right of the middle, x is positive."],
      note: "x runs from -240 at the left edge to 240 at the right edge."
    },
    {
      id: "g-left", category: "grid",
      prompt: "What is x at the left-hand edge of the Scratch stage?",
      answers: ["-240"],
      keywords: [drillNumberRe(-240, "x")],
      distractors: ["0", "240", "-180", "-480"],
      working: ["The stage is 480 steps wide and x: 0 is the middle. Left of the middle is negative: minus half of 480.", "Left of the middle, x is negative. How far is the edge?", "Left of the middle, x is negative."],
      note: "The left edge is x: -240. The middle is x: 0."
    },
    {
      id: "g-top", category: "grid",
      prompt: "What is y at the top edge of the Scratch stage?",
      answers: ["180"],
      keywords: [drillNumberRe(180, "y")],
      distractors: ["240", "360", "-180", "100"],
      working: ["The stage is 360 steps tall and y: 0 is the middle, so the top is half of 360 above it.", "Above the middle, y is positive. How far is the top edge?", "Up the stage, y gets bigger."],
      note: "y runs from -180 at the bottom to 180 at the top."
    },
    {
      id: "g-bottom", category: "grid",
      prompt: "What is y at the bottom edge of the Scratch stage?",
      answers: ["-180"],
      keywords: [drillNumberRe(-180, "y")],
      distractors: ["0", "180", "-240", "-360"],
      working: ["The stage is 360 steps tall. The bottom is half of 360 below the middle, so y is negative there.", "Below the middle, y is negative. How far is the bottom edge?", "Down the stage, y gets smaller."],
      note: "The bottom edge is y: -180."
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
      note: "Up the stage y gets bigger, down the stage y gets smaller."
    },
    {
      id: "m-goto", category: "motion",
      prompt: "Which block makes a sprite jump straight to an exact x and y?",
      answers: ["go to x: y:"],
      keywords: [/\bgo\s*to\b/i],
      distractors: ["glide (1) secs to x: y:", "change x by (10)", "move (10) steps"],
      note: "go to x: y: jumps there at once. glide travels there over time."
    },
    {
      id: "m-glide", category: "motion",
      prompt: "Which block moves a sprite smoothly to an x and y, taking a number of seconds?",
      answers: ["glide (1) secs to x: y:"],
      keywords: [/\bglide/i],
      distractors: ["go to x: y:", "change x by (10)", "move (10) steps"],
      note: "The number in the glide block is how many seconds the journey takes."
    },
    {
      id: "m-left", category: "motion",
      prompt: "Which block moves a sprite 10 steps to the left?",
      answers: ["change x by (-10)"],
      keywords: [/change\s*x\s*(by)?\s*\(?\s*[-−]\s*10\b/i],
      distractors: ["change x by (10)", "change y by (-10)", "set x to (-10)"],
      note: "Left makes x smaller, so the number is negative."
    },
    {
      id: "m-up", category: "motion",
      prompt: "Which block moves a sprite 10 steps up?",
      answers: ["change y by (10)"],
      keywords: [/change\s*y\s*(by)?\s*\(?\s*\+?\s*10\b/i],
      distractors: ["change y by (-10)", "change x by (10)", "set y to (10)"],
      note: "Up makes y bigger, so change y by a positive number."
    },
    {
      id: "p-changes", category: "predict",
      randomize: function () {
        var x0 = drillRange(-100, 100, 10), a = drillPick([20, 30, 40, 50, 60, 80]), b = -drillPick([10, 20, 30, 40]);
        var ans = x0 + a + b;
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
        var y0 = drillRange(-60, 60, 20), a = drillPick([30, 40, 50, 70]), dx = drillPick([25, 35, 45]), b = -drillPick([10, 20, 30]);
        var ans = y0 + a + b;
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
        var step = drillPick([5, 10, 15, 20]), n = drillRange(2, 6), x0 = drillRange(-50, 50, 10);
        var ans = x0 + n * step;
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
        var gx = drillRange(-150, 150, 50), gy = drillRange(-100, 100, 50), cx = drillPick([-40, -20, 20, 40]);
        var ans = gx + cx;
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
