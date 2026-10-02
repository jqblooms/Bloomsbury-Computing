// Year 6, 6.2.4.6: Bug Hunt
// Loaded by Drills/index.html?drill=y6-bughunt-l46
// The plenary: every card shows a broken Scratch script from the Bug Hunts' kind of game. Spot the wrong block,
// pick the block that fixes it, or run the broken script in your head and say what it really does.
DrillData.register("y6-bughunt-l46", {
  title: "Year 6, 6.2.4.6: Bug Hunt",
  subtitle: "Scratch: spotting, fixing and tracing bugs",
  categories: [
    ["spot", "Spot the Bug"],
    ["fix", "Fix It"],
    ["predict", "What Happens?"]
  ],
  cards: (function () {
    var TIMER = "when flag clicked\nset [time v] to (20)\nrepeat until <(time) = (0)>\nwait (1) seconds\nchange [time v] by (1)\nend";
    var CLICK = "when flag clicked\nset [score v] to (0)\n\nwhen this sprite clicked\nstart sound [pop v]\nset [score v] to (1)";
    var DOOR = "when flag clicked\nwait until <<touching [Ghost v] ?> and <(keys) = (1)>>\nswitch costume to [open v]\nbroadcast [escaped v]";
    var LIVES = "when flag clicked\nset [lives v] to (3)\nwait until <(lives) < (0)>\nswitch backdrop to [Game Over v]";
    var GHOST = "when flag clicked\nglide (1.5) secs to x: (100) y: (0)\nglide (1.5) secs to x: (-100) y: (0)";
    return [
      // ------------------------------------------------ Spot the Bug: which block in the script is wrong?
      {
        id: "s-timer", category: "spot", blocks: TIMER,
        prompt: "This timer should count down from 20 to 0. Which block is wrong?",
        answers: ["change [time] by (1)"],
        keywords: [/change\s*\[?\s*time/i],
        distractors: ["set [time] to (20)", "wait (1) seconds", "repeat until <(time) = (0)>"],
        working: ["Count down means time gets smaller every second.", "Which block changes time each second? Does it make time bigger or smaller?"],
        note: "change [time] by (1) makes time go up. Counting down needs (-1)."
      },
      {
        id: "s-set", category: "spot", blocks: CLICK,
        prompt: "This is a Balloon. Each click should add 1 to score, but score is always 1. Which block is wrong?",
        answers: ["set [score] to (1)"],
        keywords: [/set\s*\[?\s*score\s*(v\s*)?\]?\s*to\s*\(?\s*1\b/i],
        distractors: ["set [score] to (0)", "start sound [pop]", "when this sprite clicked"],
        working: ["The green flag script runs once, at the start. That part is fine.", "Which block runs on every click? Does it add to score, or replace it?"],
        note: "set [score] to (1) makes score 1 on every click. It should add 1 instead."
      },
      {
        id: "s-door", category: "spot", blocks: DOOR,
        prompt: "This Door should open when the Hero touches it with the key. It never opens. Which part is wrong?",
        answers: ["touching [Ghost]"],
        keywords: [/ghost/i],
        distractors: ["(keys) = (1)", "switch costume to [open]", "broadcast [escaped]"],
        working: ["Read the wait until block. What two things must be true?", "Which sprite should touch the Door?"],
        note: "The Door waits for the Ghost. It should wait for the Hero."
      },
      {
        id: "s-lives", category: "spot", blocks: LIVES,
        prompt: "Each hit takes 1 life. The game should end when lives reaches 0, but it never ends. Which block is wrong?",
        answers: ["wait until <(lives) < (0)>"],
        keywords: [/lives\s*\)?\s*<\s*\(?\s*0/i],
        distractors: ["set [lives] to (3)", "when flag clicked", "switch backdrop to [Game Over]"],
        working: ["lives goes 3, 2, 1, 0, then stops.", "Read each condition. Can it ever be true?"],
        note: "lives stops at 0, and 0 is not less than 0, so the wait never ends."
      },
      {
        id: "s-once", category: "spot",
        blocks: "when flag clicked\ngo to x: (0) y: (0)\nmove (10) steps\nif on edge, bounce",
        prompt: "This Ball should keep moving round the stage. It moves once, then stops. Which block is missing?",
        answers: ["forever"],
        keywords: [/forever|repeat|loop/i],
        distractors: ["wait (1) seconds", "say [Go!]", "hide"],
        working: ["The script runs from top to bottom once, then ends.", "Which block makes blocks run again and again?"],
        note: "Put move and bounce inside forever, so they keep running."
      },
      // ------------------------------------------------ Fix It: which block makes it work?
      {
        id: "x-timer", category: "fix", blocks: TIMER,
        prompt: "This timer should count down from 20 to 0. Which block should replace change [time] by (1)?",
        answers: ["change [time] by (-1)"],
        keywords: [/change\b.*[-−]\s*1\b/i],
        distractors: ["change [time] by (2)", "set [time] to (-1)", "change [time] by (0)"],
        working: ["Count down means time gets smaller.", "set replaces time. change adds to it. Which way should it go?"],
        note: "change [time] by (-1) takes 1 away every second."
      },
      {
        id: "x-set", category: "fix", blocks: CLICK,
        prompt: "This is a Balloon. Each click should add 1 to score. Which block should replace set [score] to (1)?",
        answers: ["change [score] by (1)"],
        keywords: [/change\b.*\b1\b/i],
        distractors: ["set [score] to (2)", "change [score] by (0)", "set [score] to (0)"],
        working: ["set replaces the value. Which block adds to it?", "It should add 1 each time."],
        note: "change [score] by (1) adds 1 to the score it already has."
      },
      {
        id: "x-door", category: "fix", blocks: DOOR,
        prompt: "This Door should open when the Hero touches it with the key. What should Ghost be changed to?",
        answers: ["Hero"],
        keywords: [/^\s*(the\s+)?hero\s*$/i],
        distractors: ["Ghost", "Key", "Door"],
        working: ["Which sprite should walk up to the Door?", "It is the sprite the player moves with the arrow keys."],
        note: "touching [Hero] makes the Door wait for the player."
      },
      {
        id: "x-lives", category: "fix", blocks: LIVES,
        prompt: "The game should end when lives reaches 0. Which block should replace wait until <(lives) < (0)>?",
        answers: ["wait until <(lives) = (0)>"],
        keywords: [/lives\s*\)?\s*=\s*\(?\s*0\b/i],
        distractors: ["wait until <(lives) > (0)>", "wait until <(lives) = (3)>", "wait until <(lives) < (-1)>"],
        working: ["lives goes 3, 2, 1, 0, then stops.", "Which condition becomes true when lives is 0?"],
        note: "(lives) = (0) is true as soon as the last life is lost."
      },
      {
        id: "x-forever", category: "fix", blocks: GHOST,
        prompt: "This Ghost should walk back and forth for the whole game. It goes once, then stops. Which block should go around the two glides?",
        answers: ["forever"],
        keywords: [/forever|repeat|loop/i],
        distractors: ["if then", "wait (1) seconds", "say [Boo]"],
        working: ["The glides run once, then the script ends.", "Which loop keeps blocks running for the whole game?"],
        note: "forever around both glides keeps the Ghost walking."
      },
      { id: "x-left", category: "fix", randomize: function () {
          var step = drillPick([4, 6, 8, 10]);
          return {
            blocks: "when [left arrow v] key pressed\nchange x by (" + step + ")",
            prompt: "This should move the Ship left by " + step + ". It moves right. What number should be in the change x block?",
            answers: ["-" + step],
            keywords: [drillNumberRe(-step, "x")],
            distractors: [String(step), "0", "-" + (step * 2)],
            working: ["Moving left makes x smaller.", "Keep the same size of step, but make it go the other way."],
            note: "Left makes x smaller, so the number is negative."
          };
        } },
      // ------------------------------------------------ What Happens?: run the broken script in your head
      { id: "p-set", category: "predict", randomize: function () {
          var n = drillRange(2, 6);
          return {
            blocks: CLICK,
            prompt: "The player clicks the green flag, then clicks the Balloon " + n + " times. What is score now?",
            answers: ["1"],
            keywords: [drillNumberRe(1, "score")],
            distractors: [String(n), String(n + 1), "0"],
            working: ["Run the click script once. What is score after it?", "Every click runs the same block again. Does it add, or replace?"],
            note: "set [score] to (1) makes score 1 on every click, so it stays 1."
          };
        } },
      { id: "p-timer", category: "predict", randomize: function () {
          var s = drillRange(2, 5);
          return {
            blocks: TIMER,
            prompt: "The player clicks the green flag. What is time after " + s + " seconds?",
            answers: [String(20 + s)],
            keywords: [drillNumberRe(20 + s, "time")],
            distractors: [String(20 - s), "20", String(s)],
            working: ["time starts at 20.", "Each second, the loop runs change [time] by (1) once."],
            note: "time goes up by 1 each second: " + (20 + s) + " after " + s + " seconds. That is the bug."
          };
        } },
      { id: "p-left", category: "predict", randomize: function () {
          var n = drillRange(2, 5);
          return {
            blocks: "when flag clicked\ngo to x: (0) y: (0)\n\nwhen [left arrow v] key pressed\nchange x by (10)",
            prompt: "The player clicks the green flag, then presses the left arrow " + n + " times. What is x now?",
            answers: [String(10 * n)],
            keywords: [drillNumberRe(10 * n, "x")],
            distractors: [String(-10 * n), "10", "0"],
            working: ["x starts at 0.", "Each press runs change x by (10) once. Read the number carefully."],
            note: n + " presses of change x by (10) make x " + (10 * n) + ": the sprite goes right. That is the bug."
          };
        } },
      {
        id: "p-ghost", category: "predict", blocks: GHOST,
        prompt: "The player clicks the green flag. How many times does the Ghost glide to x: 100?",
        answers: ["1"],
        keywords: [drillNumberRe(1)],
        distractors: ["2", "0", "10"],
        working: ["Read the script from top to bottom.", "Is there a loop to make the glides happen again?"],
        note: "With no loop, each glide happens once. Then the script ends."
      }
    ];
  })()
});
