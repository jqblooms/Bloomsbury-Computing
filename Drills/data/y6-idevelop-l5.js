// Year 6, 6.2.5: iDevelop
// Loaded by Drills/index.html?drill=y6-idevelop-l5
DrillData.register("y6-idevelop-l5", {
  title: "Year 6, 6.2.5: iDevelop",
  subtitle: "iProgram - scoring and levels",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["vocab", "Key Vocabulary"],
    ["testing", "Testing and Debugging"],
    ["y6dev-levels", "Levels and Backdrops"],
    ["y6dev-variables", "Scoring and Levelling Variables"]
  ],
  cards: [
    {
      id: "v-algorithm2", category: "vocab",
      prompt: "What word means a set of step-by-step instructions to solve a problem or complete a task?",
      answers: ["Algorithm"],
      keywords: [/algorithm/i],
      distractors: ["Program","Plan","Variable","Level"]
    },
    {
      id: "v-plan2", category: "vocab",
      prompt: "What document should you check if you forget a detail about what your game should do?",
      answers: ["Your plan"],
      keywords: [/\bplan/i],
      distractors: ["Your worksheet","Another group's game","The title slide"]
    },
    {
      id: "v-variable2", category: "vocab",
      prompt: "What word means a named place that stores a value that can change while your game runs, like score?",
      answers: ["Variable"],
      keywords: [/variable/i],
      distractors: ["Sprite","Costume","Algorithm","Constant"]
    },
    {
      id: "v-forever", category: "vocab",
      prompt: "Which loop block runs its code over and over without ever stopping on its own?",
      answers: ["Forever"],
      keywords: [/forever/i],
      distractors: ["Repeat 10","Wait","Repeat until"]
    },
    {
      id: "v-wait", category: "vocab",
      prompt: "Which block pauses a script for a set amount of time before continuing?",
      answers: ["Wait"],
      keywords: [/\bwait/i],
      distractors: ["Forever","Repeat","Stop"]
    },
    {
      id: "l-backdrop", category: "y6dev-levels",
      prompt: "In this lesson's design, what makes a level look different from another level?",
      answers: ["A different backdrop"],
      keywords: [/backdrop/i],
      distractors: ["A different sprite shape","A louder sound","A smaller stage"]
    },
    {
      id: "l-howmany", category: "y6dev-levels",
      prompt: "How many backdrops should you import or design today, at minimum?",
      answers: ["Two"],
      keywords: [/\btwo\b|\b2\b/i],
      distractors: ["One","Five","Ten"]
    },
    {
      id: "l-fromplan", category: "y6dev-levels",
      prompt: "Where should the number and design of your levels come from?",
      answers: ["Your plan"],
      keywords: [/\bplan/i],
      distractors: ["Whatever looks nicest at the time","Another group's game","A random generator"]
    },
    {
      id: "l-testswitch", category: "y6dev-levels",
      prompt: "After adding a second backdrop, what should you do before moving on?",
      answers: ["Test that you can switch between them"],
      keywords: [/\btest/i],
      distractors: ["Delete the first one","Add five more immediately","Ask a different group to check"]
    },
    {
      id: "l-notonlylook", category: "y6dev-levels",
      prompt: "True or false: sprites must behave completely differently on every level for it to count as a real level.",
      answers: ["False"],
      keywords: [/false/i],
      distractors: ["True"]
    },
    {
      id: "s-award", category: "y6dev-variables",
      prompt: "In this lesson's design, when should your score variable increase?",
      answers: ["When the goodie sprite touches the baddie sprite"],
      keywords: [new RegExp("^(?=.*touch)(?=.*(goodie|baddie))", "i")],
      distractors: ["Every time the green flag is clicked","When the game first loads","Never, it only counts time"]
    },
    {
      id: "s-levelup", category: "y6dev-variables",
      prompt: "What should happen once your score variable reaches the number you chose?",
      answers: ["The backdrop changes (the level goes up)"],
      keywords: [new RegExp("^(?=.*backdrop)", "i"), /level/i],
      distractors: ["The game ends immediately","The score resets to a negative number","Nothing, score is only for show"]
    },
    {
      id: "s-create", category: "y6dev-variables",
      prompt: "Before you can use score and level in your code, what do you need to do to them?",
      answers: ["Create and name them as variables"],
      keywords: [new RegExp("^(?=.*(create|make|add))(?=.*(variable|name))", "i")],
      distractors: ["Draw them as sprites","Record them on the worksheet","Ask a partner to test them"]
    },
    {
      id: "s-twovars", category: "y6dev-variables",
      prompt: "This lesson asks for at least two named variables. Which two?",
      answers: ["Score and level"],
      keywords: [new RegExp("^(?=.*score)(?=.*level)", "i")],
      distractors: ["Speed and colour","Sprite and costume","Name and age"]
    },
    {
      id: "s-goodiebaddie", category: "y6dev-variables",
      prompt: "In this lesson's design, which two sprites interact to change the score?",
      answers: ["The goodie and the baddie"],
      keywords: [new RegExp("^(?=.*goodie)(?=.*baddie)", "i")],
      distractors: ["The background and the score display","Two goodies","Two baddies"]
    },
    {
      id: "t-oftennotend", category: "testing",
      prompt: "Should you test your score and level code only once everything is finished, or as you go?",
      answers: ["As you go, a little at a time"],
      keywords: [new RegExp("^(?=.*(go|along))", "i"), /little at a time/i, /small/i],
      distractors: ["Only at the very end","Never, it is not necessary","Only if a friend asks to see it"]
    },
    {
      id: "t-whyoften", category: "testing",
      prompt: "Why is testing as you go easier than testing everything at the end?",
      answers: ["It is easier to spot which piece of code caused a bug"],
      keywords: [new RegExp("^(?=.*(easier|know|find))(?=.*(piece|which|caused|bug))", "i")],
      distractors: ["It takes longer overall","It makes the game run faster","It is not actually easier"]
    },
    {
      id: "t-systematic2", category: "testing",
      prompt: "What word describes testing in a planned, thorough way, rather than randomly?",
      answers: ["Systematically"],
      keywords: [/systematic/i],
      distractors: ["Randomly","Quickly","Secretly"]
    },
    {
      id: "t-bug2", category: "testing",
      prompt: "What word means a mistake in code that makes it behave in a way you did not intend?",
      answers: ["Bug"],
      keywords: [/\bbug/i],
      distractors: ["Feature","Variable","Backdrop"]
    },
    {
      id: "t-nextlesson", category: "testing",
      prompt: "Next lesson is iDebug. What will you do with a partner in that lesson?",
      answers: ["Swap games and test each other's for bugs"],
      keywords: [new RegExp("^(?=.*swap)(?=.*test)", "i")],
      distractors: ["Swap seats but keep working alone","Write a new plan together","Delete each other's games"]
    },
  ]
});
