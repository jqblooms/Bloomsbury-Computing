// Year 6, 6.2.2: Loops and Pong
// Loaded by Drills/index.html?drill=y6-igame-l2
DrillData.register("y6-igame-l2", {
  title: "Year 6, 6.2.2: Loops and Pong",
  subtitle: "Scratch: repeat, forever, sensing and if",
  categories: [
    ["loops", "Loops"],
    ["predictloop", "Predict the Loop"],
    ["sensing", "Sensing and If"],
    ["pong", "Pong Scripts"]
  ],
  cards: [
    {
      id: "l-forever", category: "loops",
      prompt: "Which loop keeps running the blocks inside it until the game stops?",
      answers: ["forever"],
      keywords: [/^\s*(a\s+|the\s+)?forever(\s+loop)?\s*$/i],
      distractors: ["repeat (10)", "if then", "wait (1) seconds"],
      working: ["This loop has no number in it.", "It never stops by itself."],
      note: "forever never finishes, so nothing can be snapped underneath it."
    },
    {
      id: "l-wrap", category: "loops",
      blocks: "move (100) steps\nturn right (90) degrees",
      prompt: "These two blocks draw one side of a square. Which loop should go around them to draw the whole square once?",
      answers: ["repeat (4)"],
      keywords: [/repeat\s*\(?\s*4\b/i],
      distractors: ["forever", "repeat (2)", "if then"],
      working: ["How many sides does a square have?", "The loop should stop when the square is finished."],
      note: "A square has 4 sides, so repeat (4) draws it once and stops."
    },
    {
      id: "l-after", category: "loops",
      blocks: "when flag clicked\nrepeat (4)\nmove (50) steps\nend\nsay [Done!]",
      prompt: "When does the say [Done!] block run?",
      answers: ["After the loop has run 4 times"],
      keywords: [/\bafter\b|\bend\b|finish|\bdone\b|4\s*times|four\s+times|last/i],
      distractors: ["Before the loop starts", "Every time round the loop", "At the same time as the first move"],
      working: ["Blocks under a loop wait until the loop is finished.", "How many times does the loop run first?"],
      note: "repeat finishes its turns, then the blocks underneath it run."
    },
    {
      id: "l-times", category: "predictloop",
      randomize: function () {
        var n = drillPick([3, 4, 5, 6, 8, 9, 10]);
        return {
          blocks: "when flag clicked\nrepeat (" + n + ")\nmove (10) steps\nturn right (" + (360 / n) + ") degrees\nend",
          prompt: "How many times does the move block run?",
          answers: [String(n)],
          keywords: [new RegExp("^\\s*" + n + "\\s*(times)?\\s*$", "i")],
          distractors: drillWrongNumbers(n, [1, 10 * n, 360 / n, n + 1], 3),
          working: ["The number in a repeat block is how many times the blocks inside it run.", "Look at the number in the repeat block.", "Count the turns of the loop."],
          note: "repeat (" + n + ") runs the blocks inside it " + n + " times."
        };
      }
    },
    {
      id: "l-x", category: "predictloop",
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
      id: "l-score", category: "predictloop",
      randomize: function () {
        var s0 = drillPick([0, 5, 10]), n = drillRange(2, 5), d = drillPick([2, 3, 5]);
        var ans = s0 + n * d;
        return {
          blocks: "when flag clicked\nset [score v] to (" + s0 + ")\nrepeat (" + n + ")\nchange [score v] by (" + d + ")\nend",
          prompt: "What is score after the loop?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "score")],
          distractors: drillWrongNumbers(ans, [n * d, s0 + d, s0 + (n + 1) * d, s0 * n], 3),
          working: ["score starts at " + s0 + ". After one turn it is " + (s0 + d) + ". Keep adding " + d + " for each turn.", "score starts at " + s0 + " and goes up by " + d + " each turn.", "Start value, then add once per turn."],
          note: "Start at " + s0 + " and add " + d + ", " + n + " times: " + ans + "."
        };
      }
    },
    {
      id: "l-square", category: "predictloop",
      randomize: function () {
        var len = drillPick([50, 80, 100, 120]);
        return {
          blocks: "when flag clicked\ngo to x: (0) y: (0)\npoint in direction (90)\nrepeat (4)\nmove (" + len + ") steps\nturn left (90) degrees\nend",
          prompt: "Where is the sprite when the loop finishes?",
          answers: ["x: 0, y: 0"],
          keywords: [/^[^1-9]*\b0\b[^1-9]*\b0\b[^1-9]*$/, /^(?!.*(\bnot\b|n't\b|\bnever\b)).*\b(start|same\s+place|where\s+it\s+(began|started)|middle|centre|center)\b/i],
          distractors: ["x: " + len + ", y: 0", "x: " + len + ", y: " + len, "x: 0, y: " + len],
          working: ["Four sides with a quarter turn after each: right, up, left, then down. Where does that leave it?", "Each side undoes the side two turns before it.", "Trace the path with your finger."],
          note: "Four sides and four quarter turns make a square, which ends where it began."
        };
      }
    },
    {
      id: "s-values", category: "sensing",
      prompt: "touching [Paddle]? is a condition. Which two values can a condition report?",
      answers: ["true or false"],
      keywords: [[["true"], ["false"]]],
      distractors: ["0 or 100", "yes or maybe", "left or right"],
      working: ["A condition is either right or wrong.", "Scratch uses two words for right and wrong."],
      note: "Every condition is either true or false."
    },
    {
      id: "s-mousex", category: "sensing",
      prompt: "Which reporter tells you how far left or right the mouse pointer is?",
      answers: ["mouse x"],
      keywords: [/mouse\s*x/i],
      distractors: ["mouse y", "x position", "direction"],
      working: ["Left and right is x.", "Look in the Sensing blocks for a reporter about the mouse."],
      note: "set x to (mouse x) inside forever makes a paddle follow the mouse."
    },
    {
      id: "s-false", category: "sensing",
      blocks: "if <touching [Paddle v] ?> then\nchange [score v] by (1)\nend",
      prompt: "The Ball is not touching the Paddle. What happens to score?",
      answers: ["Nothing: it stays the same"],
      keywords: [/nothing|same|no\s+change|(doesn.?t|does\s+not|won.?t|will\s+not)\s+change|stays|unchanged/i],
      distractors: ["It goes up by 1", "It goes down by 1", "It goes up by 1 every second"],
      working: ["The condition is false here.", "When an if condition is false, the blocks inside it are skipped."],
      note: "The condition is false, so the if block skips everything inside it."
    },
    {
      id: "s-bounce", category: "sensing",
      prompt: "Which block turns a sprite round when it reaches the edge of the stage?",
      answers: ["if on edge, bounce"],
      keywords: [/bounce/i],
      distractors: ["turn right (180) degrees", "point in direction (90)", "forever"],
      working: ["Look in the Motion blocks.", "The block's name talks about the edge."],
      note: "if on edge, bounce checks for the edge and points the sprite back."
    },
    {
      id: "s-check", category: "sensing",
      blocks: "when flag clicked\nif <touching [Paddle v] ?> then\nchange [score v] by (1)\nend",
      prompt: "The Ball hits the Paddle 5 seconds after the green flag, but score does not change. Which block should go around the if?",
      answers: ["forever"],
      keywords: [/forever|repeat|loop/i],
      distractors: ["wait (1) seconds", "say [Hit!]", "hide"],
      working: ["The if block checks once, straight after the green flag.", "Which block makes the check happen again and again?"],
      note: "forever around the if keeps checking for the Paddle all game."
    },
    {
      id: "p-direction", category: "pong",
      randomize: function () {
        var d = drillPick([120, 135, 150, 160, 180]);
        var ans = 180 - d;
        return {
          blocks: "point in direction ((180) - (direction))",
          prompt: "The Ball's direction is " + d + ", heading down. What is its direction after this block?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "direction")],
          distractors: drillWrongNumbers(ans, [d, 180 + d, d - 90, 360 - d], 3),
          working: ["Work out 180 take away " + d + ".", "180 minus the direction it has now.", "Work out the sum inside the block."],
          note: "180 take away " + d + " is " + ans + ", which points the Ball back up."
        };
      }
    },
    {
      id: "p-stop", category: "pong",
      prompt: "Which block ends the whole game when the Ball touches the red floor?",
      answers: ["stop [all]"],
      keywords: [/stop\s*\[?\s*all/i],
      distractors: ["stop [this script]", "wait (1) seconds", "hide"],
      working: ["Look in the Control blocks.", "It stops every script, not just one."],
      note: "stop [all] stops every script in every sprite."
    },
    {
      id: "p-colour", category: "pong",
      prompt: "Which sensing block checks whether the Ball is touching the red floor?",
      answers: ["touching color [red]?"],
      keywords: [/touching\s+colou?r/i],
      distractors: ["touching [Paddle]?", "mouse x", "key [space] pressed?"],
      working: ["The floor is a colour, not a sprite.", "Look in the Sensing blocks for a touching block with a colour square."],
      note: "Pick the colour with the colour picker, straight from the floor."
    },
    {
      id: "p-hits", category: "pong",
      randomize: function () {
        var hits = drillRange(2, 7), misses = drillRange(1, 4);
        return {
          blocks: "when flag clicked\nset [score v] to (0)\nforever\nif <touching [Paddle v] ?> then\nchange [score v] by (1)\nend\nend",
          prompt: "The Ball hits the Paddle " + hits + " times and misses it " + misses + " times. What is score?",
          answers: [String(hits)],
          keywords: [drillNumberRe(hits, "score")],
          distractors: drillWrongNumbers(hits, [hits + misses, hits - misses, misses, hits + 1], 3),
          working: ["Only a hit makes touching [Paddle]? true. A miss changes nothing.", "Count only the hits.", "When is the condition true?"],
          note: "Only a hit makes touching [Paddle]? true."
        };
      }
    }
  ]
});
