// Year 6, 6.2.6: Test and Debug
// Loaded by Drills/index.html?drill=y6-idebug-l6
DrillData.register("y6-idebug-l6", {
  title: "Year 6, 6.2.6: Test and Debug",
  subtitle: "Scratch: testing, finding bugs and fixing them",
  categories: [
    ["testing", "Testing"],
    ["findbug", "Spot the Bug"],
    ["fixes", "Fix It"]
  ],
  cards: [
    {
      id: "d-replay", category: "testing",
      blocks: "when flag clicked\nset [score v] to (0)\nwait until <(lives) = (0)>\nswitch backdrop to [Game Over v]",
      prompt: "The first game works. Click the green flag again and the game is over straight away. Which variable does this script forget to reset?",
      answers: ["lives"],
      keywords: [/^\s*(the\s+)?lives\s*$/i],
      distractors: ["score", "speed", "time"],
      working: ["Play two games in your head. What is each variable at the end of the first game?", "Which variables does the green flag script set?"],
      note: "lives is still 0 from the last game. Add set [lives] to (3) at the green flag."
    },
    {
      id: "d-start", category: "testing",
      blocks: "when flag clicked\nset [time v] to (2)\nrepeat until <(time) = (0)>\nwait (1) seconds\nchange [time v] by (-1)\nend",
      prompt: "A game should last 20 seconds. It ends after 2 seconds. Which block is wrong?",
      answers: ["set [time] to (2)"],
      keywords: [/set\s*\[?\s*time\s*(v\s*)?\]?\s*to\s*\(?\s*2\b/i],
      distractors: ["change [time] by (-1)", "wait (1) seconds", "repeat until <(time) = (0)>"],
      working: ["How long should the game last?", "Which block decides how many seconds there are?"],
      note: "set [time] to (2) gives only 2 seconds. It should be 20."
    },
    {
      id: "d-key", category: "testing",
      blocks: "when flag clicked\ngo to x: (-190) y: (130)\nwait until <touching [Hero v] ?>\nhide",
      prompt: "You collect the Key and win. In the next game, the Key is gone. Which block is missing at the start of this script?",
      answers: ["show"],
      keywords: [/^\s*show\s*$/i],
      distractors: ["hide", "next costume", "say [Key!]"],
      working: ["At the end of the last game, the Key was hidden.", "Which block makes a hidden sprite appear again?"],
      note: "Put show under when flag clicked, so the Key is back for every game."
    },
    {
      id: "t-boundary", category: "testing",
      prompt: "A win should happen at 10 clicks. Which three click counts are worth testing?",
      answers: ["9, 10 and 11"],
      keywords: [[["9", "nine"], ["10", "ten"], ["11", "eleven"]]],
      distractors: ["1, 2 and 3", "10 only", "100, 200 and 300"],
      working: ["Test just below the target, on it, and just above it.", "The target here is 10 clicks."],
      note: "Test just below, on and just above the target."
    },
    {
      id: "d-escape", category: "testing",
      blocks: "forever\nchange y by (3)\nif <(y position) > (250)> then\ngo to x: (0) y: (-170)\nend\nend",
      prompt: "This Balloon floats off the top and never comes back. The top of the stage is y: 180. Is (y position) > (250) ever true?",
      answers: ["No"],
      keywords: [/^\s*no\b|never|false/i],
      distractors: ["Yes"],
      working: ["A sprite cannot go far above the top of the stage.", "Can y position get bigger than 250?"],
      note: "y never reaches 250, so the Balloon never goes back. Use a number below 180."
    },
    {
      id: "f-way", category: "findbug",
      randomize: function () {
        var key = drillPick(["left arrow", "down arrow"]), step = drillPick([5, 10, 15, 20]);
        var axis = key === "left arrow" ? "x" : "y", way = key === "left arrow" ? "left" : "down";
        return {
          blocks: "when [" + key + " v] key pressed\nchange " + axis + " by (" + step + ")",
          prompt: "This should move the sprite " + way + " by " + step + ". What number should be in the change " + axis + " block?",
          answers: ["-" + step],
          keywords: [drillNumberRe(-step, axis)],
          distractors: [String(step), "0", "-" + (step * 2)],
          working: ["Moving " + way + " makes " + axis + " smaller, so the number must be negative. Keep the same size of step.", "Which way should " + axis + " go? Up or down?", "Down and left make numbers smaller."],
          note: "Moving " + way + " makes " + axis + " smaller, so the number is negative."
        };
      }
    },
    {
      id: "f-once", category: "findbug",
      blocks: "when flag clicked\nmove (10) steps\nif on edge, bounce",
      prompt: "The Ball moves once and stops. Which block is missing around the move and bounce?",
      answers: ["forever"],
      keywords: [/forever|repeat|loop/i],
      distractors: ["say [Go!]", "wait (1) seconds", "hide"],
      working: ["The script runs from top to bottom once, then ends.", "Which block makes blocks run again and again?"],
      note: "Blocks that should keep running go inside a forever loop."
    },
    {
      id: "f-reset", category: "findbug",
      blocks: "when this sprite clicked\nset [clicks v] to (0)\nchange [clicks v] by (1)",
      prompt: "clicks is always 1, however many times you click. Which block is in the wrong script?",
      answers: ["set [clicks] to (0)"],
      keywords: [/^\s*set\b/i],
      distractors: ["change [clicks] by (1)", "when this sprite clicked", "switch costume to [gem]"],
      working: ["The click script runs every time you click.", "Which block should only run once, at the green flag?"],
      note: "The reset belongs in the green flag script, not the click script."
    },
    {
      id: "f-sprite", category: "findbug",
      blocks: "if <touching [Wall v] ?> then\nchange [score v] by (1)\nend",
      prompt: "This is the Coin's script. It should score when the Hero collects it. What should Wall be changed to?",
      answers: ["Hero"],
      keywords: [/^\s*(the\s+)?hero\s*$/i],
      distractors: ["Wall", "Coin", "Stage"],
      working: ["The Coin should score when one sprite touches it.", "Which sprite does the player move to collect coins?"],
      note: "The Coin must check for the sprite that collects it."
    },
    {
      id: "f-gt", category: "findbug",
      blocks: "when this sprite clicked\nchange [clicks v] by (1)\nif <(clicks) > (10)> then\nsay [You win!]\nend",
      prompt: "The win should happen on the 10th click. At 10 clicks, is (clicks) > (10) true or false?",
      answers: ["false"],
      keywords: [/^\s*false\s*$/i],
      distractors: ["true"],
      working: ["Is 10 more than 10? Equal does not count as more.", "More than means bigger, not equal.", "Compare 10 with 10."],
      note: "10 is not more than 10, so the win waits until click 11. That is the bug."
    },
    {
      id: "f-colour", category: "findbug",
      blocks: "wait until <touching color [#1a73e8] ?>\nstop [all v]",
      prompt: "The game never ends at the red floor. This script checks for a blue colour. What should the colour be?",
      answers: ["Red"],
      keywords: [/\bred\b/i],
      distractors: ["Blue", "Green", "Yellow"],
      working: ["Look at the floor's colour on the stage.", "The block should check that colour."],
      note: "Use the colour picker on the floor itself so the colour matches exactly."
    },
    {
      id: "x-win", category: "fixes",
      prompt: "Change (clicks) > (10) so the win happens at exactly 10 clicks. Give the new condition.",
      answers: ["(clicks) = (10)"],
      keywords: [/=\s*\(?\s*10\b|equals?\s*(to\s*)?10\b|>\s*\(?\s*9\b|(more|greater)\s+than\s+9\b/i],
      distractors: ["(clicks) > (10)", "(clicks) < (10)", "(clicks) = (11)"],
      working: ["At exactly 10, (clicks) > (10) is false.", "Which comparison is true when clicks is 10?"],
      note: "(clicks) = (10) or (clicks) > (9) are both true at 10."
    },
    {
      id: "x-lives", category: "fixes",
      blocks: "if <(lives) < (0)> then\nstop [all v]\nend",
      prompt: "lives stops at 0, so this game never ends. What should < (0) be changed to?",
      answers: ["= (0)"],
      keywords: [/=\s*\(?\s*0\b|equals?\s*(to\s*)?(0|zero)\b|<\s*\(?\s*1\b|less\s+than\s+1\b/i],
      distractors: ["> (0)", "= (3)", "< (0)"],
      working: ["lives goes 3, 2, 1, 0, then stops.", "Which comparison is true when lives is 0?"],
      note: "lives is never less than 0, but it does reach 0."
    },
    {
      id: "d-star", category: "fixes",
      blocks: "forever\nchange y by (-3)\nif <touching [Ship v] ?> then\nchange [score v] by (5)\nend\nend",
      prompt: "One Star touches the Ship and score jumps by 50. Which block is missing after change [score] by (5)?",
      answers: ["go to (random position)"],
      keywords: [/go\s*to|random/i],
      distractors: ["wait (1) seconds", "say [Star!]", "change [score] by (5)"],
      working: ["The Star stays touching the Ship, so the if is true again and again.", "How can the Star stop touching the Ship?"],
      note: "Moving the Star away means one catch counts once."
    },
    {
      id: "d-wall", category: "fixes",
      blocks: "if <key [right arrow v] pressed?> then\nchange x by (4)\nif <touching color [#6c7fd8] ?> then\nchange x by (4)\nend\nend",
      prompt: "The Hero should stop at the blue walls, but it walks through them going right. What number should the second change x block use?",
      answers: ["-4"],
      keywords: [drillNumberRe(-4, "x")],
      distractors: ["4", "0", "8"],
      working: ["The second block should move the Hero back out of the wall.", "Back means the other way: left."],
      note: "change x by (-4) undoes the step into the wall."
    }
  ]
});
