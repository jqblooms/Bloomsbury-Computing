// Year 6, 6.2.4.5: Scratch Skills Recap
// Loaded by Drills/index.html?drill=y6-recap-l45
// The skills 6.2.5 needs, from all four earlier lessons.
DrillData.register("y6-recap-l45", {
  title: "Year 6, 6.2.4.5: Scratch Skills Recap",
  subtitle: "Scratch: the blocks every game needs",
  categories: [
    ["control", "Keyboard and the Grid"],
    ["loops", "Loops and Sensing"],
    ["variables", "Variables and Decisions"],
    ["looks", "Costumes, Backdrops and Messages"]
  ],
  cards: [
    {
      id: "r-key-event", category: "control",
      blocks: "when [space v] key pressed\nchange y by (50)",
      prompt: "What does the player do to run this script?",
      answers: ["Press the space bar"],
      keywords: [/\bspace\b/i],
      distractors: ["Click the green flag", "Click the sprite", "Press the up arrow"],
      note: "when [space] key pressed waits for that one key."
    },
    {
      id: "r-left", category: "control",
      prompt: "Which block moves a sprite 10 steps to the left?",
      answers: ["change x by (-10)"],
      keywords: [/change\s*x\s*(by)?\s*\(?\s*[-−]\s*10\b/i],
      distractors: ["change x by (10)", "change y by (-10)", "set x to (-10)"],
      note: "Left makes x smaller, so the number is negative."
    },
    {
      id: "r-top", category: "control",
      prompt: "What is y at the top edge of the Scratch stage?",
      answers: ["180"],
      keywords: [drillNumberRe(180, "y")],
      distractors: ["240", "360", "-180", "100"],
      working: ["The stage is 360 steps tall and y: 0 is the middle, so the top is half of 360 above it.", "Above the middle, y is positive. How far is the top edge?", "Up the stage, y gets bigger."],
      note: "y runs from -180 at the bottom to 180 at the top."
    },
    {
      id: "r-right", category: "control",
      prompt: "What is x at the right-hand edge of the Scratch stage?",
      answers: ["240"],
      keywords: [drillNumberRe(240, "x")],
      distractors: ["180", "480", "100", "-240"],
      working: ["The stage is 480 steps wide and x: 0 is the middle, so the right edge is half of 480 from the middle.", "x: 0 is the middle. The right edge is half the stage width away.", "Right of the middle, x is positive."],
      note: "x runs from -240 at the left edge to 240 at the right edge."
    },
    {
      id: "r-keys", category: "control",
      randomize: function () {
        var step = drillPick([5, 10, 15, 20]), n = drillRange(2, 6), x0 = drillRange(-50, 50, 10), dir = drillPick([1, -1]);
        var key = dir > 0 ? "right arrow" : "left arrow", ans = x0 + dir * n * step;
        return {
          blocks: "when [" + key + " v] key pressed\nchange x by (" + (dir * step) + ")",
          prompt: "The sprite is at x: " + x0 + ". The player presses the " + key + " " + n + " times. What is x now?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "x")],
          distractors: drillWrongNumbers(ans, [x0 - dir * n * step, dir * n * step, x0 + dir * step, x0 + dir * (n + 1) * step], 3),
          working: ["After one press x is " + (x0 + dir * step) + ". Keep adding " + (dir * step) + " for each press.", "Start at x: " + x0 + " and add " + (dir * step) + " for each press.", "Each press runs the script once."],
          note: n + " presses of " + (dir * step) + " from x: " + x0 + " is " + ans + "."
        };
      }
    },
    {
      id: "r-forever", category: "loops",
      prompt: "Which loop keeps running the blocks inside it until the game stops?",
      answers: ["forever"],
      keywords: [/^\s*(a\s+|the\s+)?forever(\s+loop)?\s*$/i],
      distractors: ["repeat (10)", "if then", "wait (1) seconds"],
      note: "forever never finishes, so nothing can be snapped underneath it."
    },
    {
      id: "r-loop-x", category: "loops",
      randomize: function () {
        var n = drillRange(3, 8), d = drillPick([5, 10, 15, 20, 25]);
        var ans = n * d;
        return {
          blocks: "when flag clicked\nset x to (0)\nrepeat (" + n + ")\nchange x by (" + d + ")\nend",
          prompt: "What is x after the loop?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "x")],
          distractors: drillWrongNumbers(ans, [d, n + d, (n + 1) * d, (n - 1) * d], 3),
          working: ["x starts at 0. After one turn x is " + d + ". Keep adding " + d + " for each turn.", "x starts at 0 and goes up by " + d + " each turn.", "How many turns, and how much each turn?"],
          note: n + " turns, each adding " + d + ": " + ans + "."
        };
      }
    },
    {
      id: "r-if-false", category: "loops",
      blocks: "if <touching [Bowl v] ?> then\nchange [score v] by (1)\nend",
      prompt: "The Apple is not touching the Bowl. What happens to score?",
      answers: ["Nothing: it stays the same"],
      keywords: [/nothing|same|no\s+change|(doesn.?t|does\s+not|won.?t|will\s+not)\s+change|stays|unchanged/i],
      distractors: ["It goes up by 1", "It goes down by 1", "It resets to 0"],
      note: "The condition is false, so the if block skips everything inside it."
    },
    {
      id: "r-mousex", category: "loops",
      prompt: "Which reporter tells you how far left or right the mouse pointer is?",
      answers: ["mouse x"],
      keywords: [/mouse\s*x/i],
      distractors: ["mouse y", "x position", "direction"],
      note: "set x to (mouse x) inside forever makes a paddle follow the mouse."
    },
    {
      id: "r-set", category: "variables",
      prompt: "Which block puts score back to 0 at the start of a game?",
      answers: ["set [score] to (0)"],
      keywords: [/^\s*set\b(?!.*\bchange\b).*\b0\b/i],
      distractors: ["change [score] by (0)", "change [score] by (-1)", "show variable [score]"],
      note: "set gives the variable a new value. change adds to the value it already has."
    },
    {
      id: "r-change", category: "variables",
      prompt: "Which block adds 1 to score?",
      answers: ["change [score] by (1)"],
      keywords: [/^\s*change\s*\[?\s*score\s*(v\s*)?\]?\s*by\s*\(?\s*\+?\s*1\s*\)?\s*$/i],
      distractors: ["set [score] to (1)", "change [score] by (-1)", "say (score)"],
      note: "change [score] by (1) adds 1. set [score] to (1) would replace the score with 1."
    },
    {
      id: "r-lives", category: "variables",
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
      id: "r-compare", category: "variables",
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
      id: "r-say", category: "variables",
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
      id: "r-wait", category: "looks",
      prompt: "A walk animation is far too fast to see. Which block do you add inside the loop?",
      answers: ["wait (0.2) seconds"],
      keywords: [/\bwait\b/i],
      distractors: ["next costume", "hide", "move (10) steps"],
      note: "A short wait slows each costume change down to a walking pace."
    },
    {
      id: "r-broadcast", category: "looks",
      prompt: "Which block sends a message to every sprite and the stage?",
      answers: ["broadcast [level up]"],
      keywords: [/broadcast/i],
      distractors: ["when I receive [level up]", "say [level up]", "switch backdrop to [Level 2]"],
      note: "broadcast sends the message. when I receive waits for it."
    },
    {
      id: "r-receive", category: "looks",
      prompt: "Which hat block starts a script when a message arrives?",
      answers: ["when I receive [level up]"],
      keywords: [/receive/i],
      distractors: ["broadcast [level up]", "when green flag clicked", "when this sprite clicked"],
      note: "Every when I receive script for that message starts together."
    },
    {
      id: "r-backdrop", category: "looks",
      prompt: "Which block changes the stage picture to show level 2?",
      answers: ["switch backdrop to [Level 2]"],
      keywords: [/switch\s+backdrop|backdrop\s+to|next\s+backdrop/i],
      distractors: ["switch costume to [Level 2]", "next costume", "broadcast [Level 2]"],
      note: "Backdrops belong to the stage. Costumes belong to sprites."
    },
    {
      id: "r-coins", category: "looks",
      randomize: function () {
        var k = drillPick([2, 5]), coins = drillRange(3, 8), target = k * coins;
        return {
          blocks: "if <(score) = (" + target + ")> then\nbroadcast [level up v]\nend",
          prompt: "score starts at 0 and each coin adds " + k + ". How many coins until the level up message?",
          answers: [String(coins)],
          keywords: [new RegExp("^\\s*" + coins + "\\s*(coins?)?\\s*$", "i")],
          distractors: drillWrongNumbers(coins, [target, coins + 1, coins - 1, k], 3),
          working: ["Each coin adds " + k + ". How many lots of " + k + " make " + target + "?", "Divide the target by the points per coin.", "Count coins until score equals the target."],
          note: target + " points at " + k + " a coin is " + coins + " coins."
        };
      }
    }
  ]
});
