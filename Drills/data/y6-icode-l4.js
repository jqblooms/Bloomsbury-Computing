// Year 6, 6.2.4: iCode
// Loaded by Drills/index.html?drill=y6-icode-l4
DrillData.register("y6-icode-l4", {
  title: "Year 6, 6.2.4: iCode",
  subtitle: "iProgram - from plan to program",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["vocab", "Key Vocabulary"],
    ["motion", "Reading Motion Blocks"],
    ["testing", "Testing and Debugging"],
    ["plantocode", "Plan to Code"]
  ],
  cards: [
    {
      id: "v-algorithm", category: "vocab",
      prompt: "What word means a set of step-by-step instructions to solve a problem or complete a task?",
      answers: ["Algorithm"],
      keywords: [/algorithm/i],
      distractors: ["Program","Plan","Code","Bug"]
    },
    {
      id: "v-sprite", category: "vocab",
      prompt: "What word means a character or object in a Scratch/TurboWarp project, like the Bird or the Pig?",
      answers: ["Sprite"],
      keywords: [/sprite/i],
      distractors: ["Costume","Backdrop","Variable","Stage"]
    },
    {
      id: "v-costume", category: "vocab",
      prompt: "What word means a different look or image a sprite can switch between?",
      answers: ["Costume"],
      keywords: [/costume/i],
      distractors: ["Sprite","Backdrop","Sound","Script"]
    },
    {
      id: "v-variable", category: "vocab",
      prompt: "What word means a named place that stores a value that can change while a program runs, like score?",
      answers: ["Variable"],
      keywords: [/variable/i],
      distractors: ["Sprite","Costume","Algorithm","Constant"]
    },
    {
      id: "v-bug", category: "vocab",
      prompt: "What word means a mistake in code that makes it behave in a way you did not intend?",
      answers: ["Bug"],
      keywords: [/bug/i],
      distractors: ["Feature","Plan","Variable","Test"]
    },
    {
      id: "m-glide", category: "motion",
      prompt: "In the Fly High! script, which block moves a sprite smoothly to an exact x and y position over time?",
      answers: ["Glide"],
      keywords: [/glide/i],
      distractors: ["Move","Point in direction","Go to"]
    },
    {
      id: "m-point", category: "motion",
      prompt: "Which block points a sprite in a specific compass-style direction, for example 90?",
      answers: ["Point in direction"],
      keywords: [/point\s*in\s*direction/i],
      distractors: ["Turn ccw","Glide","Move"]
    },
    {
      id: "m-turn", category: "motion",
      prompt: "In Fly High!, which block turns the bird based on the angle the player just typed in?",
      answers: ["Turn ccw"],
      keywords: [/turn/i],
      distractors: ["Glide","Move","Point in direction"]
    },
    {
      id: "m-move", category: "motion",
      prompt: "Which block moves a sprite forward by a number of steps, in the direction it is currently facing?",
      answers: ["Move"],
      keywords: [/^\s*move\s*$/i],
      distractors: ["Glide","Turn","Point in direction"]
    },
    {
      id: "m-repeatuntil", category: "motion",
      prompt: "In Fly High!, name BOTH things that can make the repeat until block stop the bird moving.",
      answers: ["Touching the edge and touching the Pig"],
      keywords: [/(?=.*edge)(?=.*pig)/i],
      distractors: ["A ten second timer","Reaching 100 points","Pressing the space bar"]
    },
    {
      id: "t-fix", category: "testing",
      prompt: "What should you do immediately after you find a bug, before adding your next piece of code?",
      answers: ["Fix it"],
      keywords: [/fix/i],
      distractors: ["Ignore it","Delete the whole project","Save it for later"]
    },
    {
      id: "t-greenflag", category: "testing",
      prompt: "In TurboWarp, what do you click to test whether your code actually works?",
      answers: ["Green flag"],
      keywords: [/green\s*flag/i],
      distractors: ["Red stop sign","File menu","Save button"]
    },
    {
      id: "t-costumecentre", category: "testing",
      prompt: "What goes wrong if a sprite's costume centre is set in the wrong place?",
      answers: ["It spins or moves oddly instead of rotating or gliding correctly"],
      keywords: [/(?=.*(spin|odd|wrong|strange))/i],
      distractors: ["The sprite disappears completely","The whole project stops saving","The backdrop changes colour"]
    },
    {
      id: "t-smallsteps", category: "testing",
      prompt: "Why test after adding just one or two blocks, instead of waiting until the whole project is finished?",
      answers: ["It is much easier to find which block caused a bug"],
      keywords: [/(?=.*(easier|quicker|faster))(?=.*(find|know|which|caused))/i],
      distractors: ["It makes the project run faster","It uses less internet data","TurboWarp requires it every minute"]
    },
    {
      id: "t-endonly", category: "testing",
      prompt: "True or False: only testing at the very end of a project makes bugs easier to find.",
      answers: ["False"],
      keywords: [/false/i],
      distractors: ["True"]
    },
    {
      id: "p-changescore", category: "plantocode",
      prompt: "Your plan's Variables table listed score. Which block would increase it by 1 when something good happens?",
      answers: ["Change score by 1"],
      keywords: [/(?=.*change)(?=.*score)/i],
      distractors: ["Set score to 0","Show variable score","Repeat until score"]
    },
    {
      id: "p-backdrop", category: "plantocode",
      prompt: "Your plan said each level has a different background. What is the picture behind the sprites called in Scratch/TurboWarp?",
      answers: ["Backdrop"],
      keywords: [/backdrop|background/i],
      distractors: ["Costume","Sprite","Stage size"]
    },
    {
      id: "p-beforecoding", category: "plantocode",
      prompt: "What should you do with a sprite BEFORE you can start coding it, if it is not already in the assets folder?",
      answers: ["Import or draw it"],
      keywords: [/(import|draw)/i],
      distractors: ["Name a variable after it","Add it to the backdrop","Write its code first"]
    },
    {
      id: "p-checkplan", category: "plantocode",
      prompt: "If you cannot remember a detail about what a sprite should do, what should you do before writing its code?",
      answers: ["Check your plan"],
      keywords: [/(?=.*(check|look|go back))(?=.*plan)/i],
      distractors: ["Guess and move on","Delete the sprite","Ask a different group's plan"]
    },
    {
      id: "p-matchplan", category: "plantocode",
      prompt: "Once you have written real code for a sprite, what should you check it against?",
      answers: ["Your plan"],
      keywords: [/plan/i],
      distractors: ["Another group's game","The title slide","The assets folder name"]
    },
  ]
});
