// Year 6, 6.2.5: Plan and Build Your Own Game
// Loaded by Drills/index.html?drill=y6-idevelop-l5
DrillData.register("y6-idevelop-l5", {
  title: "Year 6, 6.2.5: Plan and Build Your Own Game",
  subtitle: "Scratch: planning a game and building it in steps",
  // Races show buttons for every card, numbers too: Year 6 never has to guess a typed answer's wording.
  choiceOnly: true,
  categories: [
    ["plan", "Planning a Game"],
    ["parts", "Parts of a Game"],
    ["build", "Building in Steps"]
  ],
  cards: [
    {
      id: "pv-lives", category: "plan",
      blocks: "forever\nif <touching [Meteor v] ?> then\n\nend\nend",
      prompt: "In a dodge game, the Ship loses a life when a Meteor hits it. Which block goes inside the if?",
      answers: ["change [lives] by (-1)"],
      keywords: [/change\b.*lives.*[-−]\s*1\b/i],
      distractors: ["change [lives] by (1)", "set [lives] to (3)", "say [lives]"],
      working: ["Losing a life makes lives smaller.", "set replaces the value. change adds to it."],
      note: "change [lives] by (-1) takes one life away."
    },
    {
      id: "ps-ship", category: "plan",
      blocks: "when [right arrow v] key pressed\nchange x by (10)",
      prompt: "A dodge game has a Ship, a Meteor and a Star. Which sprite should get this script?",
      answers: ["Ship"],
      keywords: [/^\s*(the\s+)?ship\s*$/i],
      distractors: ["Meteor", "Star", "Stage"],
      working: ["The player moves one sprite with the arrow keys.", "Meteors and Stars fall by themselves."],
      note: "The player steers the Ship, so the Ship gets the arrow key scripts."
    },
    {
      id: "pc-mouse", category: "plan",
      blocks: "when flag clicked\nforever\n\nend",
      prompt: "In a catch game, the Bowl should follow the mouse left and right. Which block goes inside forever?",
      answers: ["set x to (mouse x)"],
      keywords: [/set\s*x\s*to\s*\(?\s*mouse\s*x/i],
      distractors: ["set y to (mouse x)", "change x by (10)", "go to x: (0) y: (0)"],
      working: ["Left and right is x.", "Which reporter tells you where the mouse is, left to right?"],
      note: "set x to (mouse x) inside forever keeps the Bowl under the mouse."
    },
    {
      id: "pe-hits", category: "plan",
      randomize: function () {
        var L = drillPick([3, 4, 5]);
        return {
          blocks: "when flag clicked\nset [lives v] to (" + L + ")\nwait until <(lives) = (0)>\nswitch backdrop to [Game Over v]\n\nwhen I receive [hit v]\nchange [lives v] by (-1)",
          prompt: "Each hit takes 1 life. How many hits until Game Over?",
          answers: [String(L)],
          keywords: [drillNumberRe(L)],
          distractors: drillWrongNumbers(L, [L - 1, L + 1, 1, 0], 3),
          working: ["Read what lives is set to at the start.", "Each hit takes one away. When does lives reach 0?"],
          note: "lives starts at " + L + ", so " + L + " hits bring it to 0."
        };
      }
    },
    {
      id: "pw-score", category: "plan",
      randomize: function () {
        var n = drillRange(2, 4);
        return {
          blocks: "when flag clicked\nset [score v] to (0)\nforever\nif <touching [Ship v] ?> then\nchange [score v] by (5)\ngo to (random position v)\nend\nend",
          prompt: "This is the Star. It touches the Ship " + n + " times. What is score?",
          answers: [String(5 * n)],
          keywords: [drillNumberRe(5 * n, "score")],
          distractors: drillWrongNumbers(5 * n, [n, 5, 5 * n + 5, 5 * n - 5], 3),
          working: ["score starts at 0.", "Each touch adds 5, then the Star moves away."],
          note: n + " touches of 5 points: " + (5 * n) + "."
        };
      }
    },
    {
      id: "pa-loop", category: "parts",
      prompt: "Which block keeps a game moving and checking the whole time it runs?",
      answers: ["forever"],
      keywords: [/^\s*(a\s+|the\s+)?forever(\s+loop)?\s*$/i],
      distractors: ["repeat (1)", "when green flag clicked", "say [Hello!]"],
      working: ["The game should keep checking until it ends.", "Which loop has no number in it?"],
      note: "Moving enemies and touching checks sit inside forever loops."
    },
    {
      id: "pr-reset", category: "parts",
      blocks: "when flag clicked\ngo to x: (0) y: (-140)",
      prompt: "Which block should go under go to x: (0) y: (-140), so every game starts with score 0?",
      answers: ["set [score] to (0)"],
      keywords: [/^\s*set\b(?!.*\bchange\b).*\b0\b/i],
      distractors: ["change [score] by (0)", "change [score] by (-1)", "show variable [score]"],
      working: ["change adds to the old score. That keeps the last game's points.", "Which block gives score a new value?"],
      note: "set [score] to (0) at the green flag starts every game at 0."
    },
    {
      id: "pa-decide", category: "parts",
      prompt: "Which block makes a decision, such as whether the Ship touches a Meteor?",
      answers: ["if then"],
      keywords: [/\bif\b/i],
      distractors: ["forever", "set [score] to (0)", "next costume"],
      working: ["A decision asks a question: is the Ship touching a Meteor?", "Look in the Control blocks for one with a space for a condition."],
      note: "An if block runs its blocks only when its condition is true."
    },
    {
      id: "pa-control", category: "parts",
      prompt: "Name a hat block that lets the player move a sprite with the keyboard.",
      answers: ["when [right arrow] key pressed"],
      keywords: [/key\b.*\bpressed/i],
      distractors: ["when green flag clicked", "when I receive [level up]", "when backdrop switches to [Level 2]"],
      working: ["A hat block starts a script.", "Look in the Events blocks for one about the keyboard."],
      note: "when [key] key pressed runs a script each time that key is pressed."
    },
    {
      id: "pa-end", category: "parts",
      prompt: "Which block ends the whole game when the player loses?",
      answers: ["stop [all]"],
      keywords: [/stop\s*\[?\s*all/i],
      distractors: ["stop [this script]", "hide", "wait (1) seconds"],
      working: ["Look in the Control blocks.", "It stops every script, not just one."],
      note: "stop [all] stops every script, so the game is over."
    },
    {
      id: "bt-ten", category: "build",
      blocks: "when flag clicked\nset [clicks v] to (0)\n\nwhen this sprite clicked\nchange [clicks v] by (1)\nif <(clicks) = (10)> then\nsay [You win!]\nend",
      prompt: "You test this by clicking the sprite 10 times. What should it say?",
      answers: ["You win!"],
      keywords: [/you\s+win/i],
      distractors: ["Nothing", "10", "clicks"],
      working: ["Each click adds 1 to clicks.", "After 10 clicks, is (clicks) = (10) true?"],
      note: "On the 10th click, clicks is 10, so the sprite says You win!"
    },
    {
      id: "bt-nine", category: "build",
      blocks: "when flag clicked\nset [clicks v] to (0)\n\nwhen this sprite clicked\nchange [clicks v] by (1)\nif <(clicks) = (10)> then\nsay [You win!]\nend",
      prompt: "You test it again with 9 clicks. What should it say?",
      answers: ["Nothing"],
      keywords: [/nothing|^\s*no\b/i],
      distractors: ["You win!", "9", "Keep going!"],
      working: ["After 9 clicks, what is clicks?", "If the condition is false, the blocks inside the if are skipped."],
      note: "9 is not 10, so nothing is said. Testing 9 checks the win does not come too early."
    },
    {
      id: "bt-start", category: "build",
      blocks: "when flag clicked\nset y to (-140)\nset [score v] to (0)\nshow",
      prompt: "You added this script. Now the Ship starts at the bottom of the stage. Which block did that?",
      answers: ["set y to (-140)"],
      keywords: [/[-−]\s*140/],
      distractors: ["set [score] to (0)", "show", "when flag clicked"],
      working: ["The bottom of the stage has a negative y.", "Which block changes where the sprite is?"],
      note: "set y to (-140) puts the Ship near the bottom of the stage."
    },
    {
      id: "b-star", category: "build",
      randomize: function () {
        var k = drillPick([2, 5, 10]), n = drillRange(2, 6);
        var ans = n * k;
        return {
          blocks: "when flag clicked\nforever\nif <touching [Player v] ?> then\nchange [score v] by (" + k + ")\ngo to (random position v)\nend\nend",
          prompt: "score starts at 0. The Player collects this Star " + n + " times. What is score?",
          answers: [String(ans)],
          keywords: [drillNumberRe(ans, "score")],
          distractors: drillWrongNumbers(ans, [n, k, n + k, (n + 1) * k], 3),
          working: ["Each time the Star is collected, score goes up by " + k + ". It is collected " + n + " times.", "Add " + k + " for each collection.", "Which block changes score?"],
          note: n + " stars at " + k + " points each: " + ans + "."
        };
      }
    },
    {
      id: "b-more", category: "build",
      randomize: function () {
        var k = drillPick([2, 5]), target = k * drillRange(6, 10), have = k * drillRange(1, 4);
        var ans = (target - have) / k;
        return {
          blocks: "if <(score) = (" + target + ")> then\nbroadcast [level up v]\nend",
          prompt: "score is " + have + " and each star adds " + k + ". How many more stars until level 2?",
          answers: [String(ans)],
          keywords: [new RegExp("^\\s*" + ans + "\\s*(more\\s+)?(stars?)?\\s*$", "i")],
          distractors: drillWrongNumbers(ans, [target - have, target / k, ans + 1, ans - 1], 3),
          working: ["score has to go from " + have + " to " + target + ". Each star adds " + k + ".", "How many more points are needed? How many stars is that?", "Work out the points still needed."],
          note: (target - have) + " more points at " + k + " a star is " + ans + " stars."
        };
      }
    }
  ]
});
