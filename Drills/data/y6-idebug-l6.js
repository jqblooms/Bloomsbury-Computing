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
      id: "t-bug", category: "testing",
      prompt: "What is a bug?",
      answers: ["A mistake in the code that makes it do the wrong thing"],
      keywords: [[["mistake", "mistakes", "error", "errors", "wrong", "problem", "problems", "fault", "faults"], ["code", "program", "script", "scripts", "blocks", "block", "game"]]],
      distractors: ["A sprite that moves", "A message to every sprite", "A new level"],
      note: "A bug is where what should happen and what does happen are different."
    },
    {
      id: "t-debug", category: "testing",
      prompt: "What word means finding and fixing the mistakes in a program?",
      answers: ["Debugging"],
      keywords: [/debug/i],
      distractors: ["Broadcasting", "Planning", "Animating"],
      note: "Debugging: find the bug, fix it, test again."
    },
    {
      id: "t-expected", category: "testing",
      prompt: "In a test, you compare what actually happened with what?",
      answers: ["What should have happened (the expected result)"],
      keywords: [/expect|should/i],
      distractors: ["The backdrop", "The first sprite", "Last lesson's game"],
      note: "Expected and actual: if they differ, there is a bug."
    },
    {
      id: "t-boundary", category: "testing",
      prompt: "A win should happen at 10 clicks. Which three click counts are worth testing?",
      answers: ["9, 10 and 11"],
      keywords: [[["9", "nine"], ["10", "ten"], ["11", "eleven"]]],
      distractors: ["1, 2 and 3", "10 only", "100, 200 and 300"],
      note: "Test just below, on and just above the target."
    },
    {
      id: "t-one", category: "testing",
      prompt: "You changed 5 things at once and it still does not work. What should you do instead?",
      answers: ["Change one thing at a time and test after each"],
      keywords: [/\bone\s+(thing|change|block|at\s+a\s+time)|\bat\s+a\s+time\b|\beach\s+(one|change)\b/i],
      distractors: ["Change 10 things at once", "Start a new project", "Stop testing"],
      note: "One change, one test: then you know which change fixed it, or broke it."
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
      note: "Blocks that should keep running go inside a forever loop."
    },
    {
      id: "f-reset", category: "findbug",
      blocks: "when this sprite clicked\nset [clicks v] to (0)\nchange [clicks v] by (1)",
      prompt: "clicks is always 1, however many times you click. Which block is in the wrong script?",
      answers: ["set [clicks] to (0)"],
      keywords: [/^\s*set\b/i],
      distractors: ["change [clicks] by (1)", "when this sprite clicked", "switch costume to [gem]"],
      note: "The reset belongs in the green flag script, not the click script."
    },
    {
      id: "f-sprite", category: "findbug",
      blocks: "if <touching [Wall v] ?> then\nchange [score v] by (1)\nend",
      prompt: "This is the Coin's script. It should score when the Hero collects it. What should Wall be changed to?",
      answers: ["Hero"],
      keywords: [/^\s*(the\s+)?hero\s*$/i],
      distractors: ["Wall", "Coin", "Stage"],
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
      answers: ["Red, the colour of the floor"],
      keywords: [/\bred\b/i],
      distractors: ["Blue", "Green", "Yellow"],
      note: "Use the colour picker on the floor itself so the colour matches exactly."
    },
    {
      id: "x-win", category: "fixes",
      prompt: "Change (clicks) > (10) so the win happens at exactly 10 clicks. Give the new condition.",
      answers: ["(clicks) = (10)"],
      keywords: [/=\s*\(?\s*10\b|equals?\s*(to\s*)?10\b|>\s*\(?\s*9\b|(more|greater)\s+than\s+9\b/i],
      distractors: ["(clicks) > (10)", "(clicks) < (10)", "(clicks) = (11)"],
      note: "(clicks) = (10) or (clicks) > (9) are both true at 10."
    },
    {
      id: "x-lives", category: "fixes",
      blocks: "if <(lives) < (0)> then\nstop [all v]\nend",
      prompt: "lives stops at 0, so this game never ends. What should < (0) be changed to?",
      answers: ["= (0)"],
      keywords: [/=\s*\(?\s*0\b|equals?\s*(to\s*)?(0|zero)\b|<\s*\(?\s*1\b|less\s+than\s+1\b/i],
      distractors: ["> (0)", "= (3)", "< (0)"],
      note: "lives is never less than 0, but it does reach 0."
    },
    {
      id: "x-away", category: "fixes",
      prompt: "score jumps by 3 when the Hero touches the Coin once, because they stay touching. What should the Coin do straight after change [score] by (1)?",
      answers: ["Move away, to a random position"],
      keywords: [/\bmove|\bgo\s*to|random|away|\bhide|\bjump/i],
      distractors: ["Wait for the green flag", "Change score by 3", "Switch backdrop"],
      note: "Once the Coin moves away it is no longer touching, so one collection counts once."
    },
    {
      id: "x-report", category: "fixes",
      prompt: "A good bug report has three parts. What are they?",
      answers: ["What I did, what I expected, what actually happened"],
      keywords: [[["did", "doing", "action", "steps", "pressed", "clicked", "tried"], ["expected", "expect", "should"], ["actual", "actually", "happened", "happens", "saw", "result"]]],
      distractors: ["Name, date and score", "Sprite, costume and sound", "Start, middle and end"],
      note: "Anyone can then repeat the test and see the bug for themselves."
    }
  ]
});
