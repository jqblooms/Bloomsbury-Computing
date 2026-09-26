// Year 6, 6.2.5: Plan and Build Your Own Game
// Loaded by Drills/index.html?drill=y6-idevelop-l5
DrillData.register("y6-idevelop-l5", {
  title: "Year 6, 6.2.5: Plan and Build Your Own Game",
  subtitle: "Scratch: planning a game and building it in steps",
  categories: [
    ["plan", "Planning a Game"],
    ["parts", "Parts of a Game"],
    ["build", "Building in Steps"]
  ],
  cards: [
    {
      id: "pl-variable", category: "plan",
      prompt: "In a game plan, score and lives go in which section?",
      answers: ["Variables"],
      keywords: [/^\s*(the\s+)?variables?(\s+section)?\s*$/i],
      distractors: ["Sprites", "Backdrops", "Controls"],
      note: "Both store a number that changes while the game runs."
    },
    {
      id: "pl-sprite", category: "plan",
      prompt: "In a game plan, the Ship and the Meteor go in which section?",
      answers: ["Sprites"],
      keywords: [/^\s*(the\s+)?sprites?(\s+section)?\s*$/i],
      distractors: ["Variables", "Controls", "Levels"],
      note: "Characters and objects on the stage are sprites."
    },
    {
      id: "pl-controls", category: "plan",
      prompt: "In a game plan, \"left and right arrow keys\" goes in which section?",
      answers: ["Controls"],
      keywords: [/^\s*(the\s+)?controls?(\s+section)?\s*$/i],
      distractors: ["Sprites", "Variables", "Backdrops"],
      note: "Controls say how the player moves things."
    },
    {
      id: "pl-ending", category: "plan",
      prompt: "Which part of a game plan says what happens when lives reaches 0?",
      answers: ["How you win or lose"],
      keywords: [/\bwin|\blos[et]|\bend(s|ing)?\b|game\s*over/i],
      distractors: ["Sprites", "Controls", "Costumes"],
      note: "The ending says how the player wins and how they lose."
    },
    {
      id: "pl-why", category: "plan",
      prompt: "Why write a plan before you start building a game?",
      answers: ["So you know what to build and can build it one piece at a time"],
      keywords: [[["know", "decide", "remember", "clear", "organised", "organized", "list", "follow", "guide", "idea", "ideas", "piece", "pieces", "step", "steps", "order"], ["build", "building", "make", "making", "code", "coding", "program", "create"]]],
      distractors: ["So the game runs faster", "So Scratch saves it", "So the sprites are bigger"],
      note: "Each line of the plan becomes a sprite or a script, so nothing is guessed."
    },
    {
      id: "pa-loop", category: "parts",
      prompt: "Which block keeps a game moving and checking the whole time it runs?",
      answers: ["forever"],
      keywords: [/^\s*(a\s+|the\s+)?forever(\s+loop)?\s*$/i],
      distractors: ["repeat (1)", "when green flag clicked", "say [Hello!]"],
      note: "Moving enemies and touching checks sit inside forever loops."
    },
    {
      id: "pa-reset", category: "parts",
      prompt: "What should happen to score when the green flag is clicked?",
      answers: ["It is set to 0"],
      keywords: [/\b0\b|\bzero\b|\breset/i],
      distractors: ["It goes up by 1", "Nothing", "It is hidden"],
      note: "set [score] to (0) at the green flag starts every game fresh."
    },
    {
      id: "pa-decide", category: "parts",
      prompt: "Which block makes a decision, such as whether the Ship touches a Meteor?",
      answers: ["if then"],
      keywords: [/\bif\b/i],
      distractors: ["forever", "set [score] to (0)", "next costume"],
      note: "An if block runs its blocks only when its condition is true."
    },
    {
      id: "pa-control", category: "parts",
      prompt: "Name a hat block that lets the player move a sprite with the keyboard.",
      answers: ["when [right arrow] key pressed"],
      keywords: [/key\b.*\bpressed/i],
      distractors: ["when green flag clicked", "when I receive [level up]", "forever"],
      note: "when [key] key pressed runs a script each time that key is pressed."
    },
    {
      id: "pa-end", category: "parts",
      prompt: "Which block ends the whole game when the player loses?",
      answers: ["stop [all]"],
      keywords: [/stop\s*\[?\s*all/i],
      distractors: ["stop [this script]", "hide", "wait (1) seconds"],
      note: "stop [all] stops every script, so the game is over."
    },
    {
      id: "b-when", category: "build",
      prompt: "You build a game one small piece at a time. When should you test it?",
      answers: ["After every small change"],
      keywords: [/after\s+(each|every)|(each|every)\s+(time|change|piece|step|bit|block)|as\s+you\s+go|straight\s+away/i],
      distractors: ["Only when the whole game is finished", "Never", "Once at the start"],
      note: "Test each piece before adding the next."
    },
    {
      id: "b-where", category: "build",
      prompt: "You added 3 blocks and the game stopped working. Where is the bug most likely to be?",
      answers: ["In the 3 blocks you just added"],
      keywords: [/\bjust\b|\bnew\b|\badded\b|\blast\b|\b3\b|\bthree\b/i],
      distractors: ["In the backdrop", "In the costumes", "Anywhere in the game"],
      note: "It worked before those blocks, so start looking there."
    },
    {
      id: "b-first", category: "build",
      prompt: "Controls, sprites or the ending: which do you build first?",
      answers: ["Sprites"],
      keywords: [/^\s*(the\s+)?sprites?\s*$/i],
      distractors: ["Controls", "The ending", "It does not matter"],
      note: "The controls need a sprite to move, and the ending needs the game to work."
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
