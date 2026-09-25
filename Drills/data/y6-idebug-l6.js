// Year 6, 6.2.6: iDebug
// Loaded by Drills/index.html?drill=y6-idebug-l6
DrillData.register("y6-idebug-l6", {
  title: "Year 6, 6.2.6: iDebug",
  subtitle: "iProgram - testing and fixing your game",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["vocab", "Key Vocabulary"],
    ["testing", "Testing and Debugging"],
    ["y6debug-record", "Recording a Bug"],
    ["y6debug-process", "Testing and Fixing Process"]
  ],
  cards: [
    {
      id: "v-test", category: "vocab",
      prompt: "What word means trying out your program to see if it works as expected?",
      answers: ["Test"],
      keywords: [/\btest/i],
      distractors: ["Debug","Plan","Amend","Bug"]
    },
    {
      id: "v-bug2", category: "vocab",
      prompt: "What word means a mistake in code that makes it behave in a way you did not intend?",
      answers: ["Bug"],
      keywords: [/\bbug/i],
      distractors: ["Feature","Sprite","Costume","Variable"]
    },
    {
      id: "v-debug", category: "vocab",
      prompt: "What word means finding and fixing bugs in a program?",
      answers: ["Debug"],
      keywords: [/debug/i],
      distractors: ["Test","Plan","Code","Amend"]
    },
    {
      id: "v-amend", category: "vocab",
      prompt: "What word means to change or correct part of your code?",
      answers: ["Amend"],
      keywords: [/amend/i],
      distractors: ["Delete","Test","Plan","Debug"]
    },
    {
      id: "v-systematically", category: "vocab",
      prompt: "What word describes testing in a planned, thorough way, rather than randomly?",
      answers: ["Systematically"],
      keywords: [/systematic/i],
      distractors: ["Randomly","Quickly","Quietly","Carefully"]
    },
    {
      id: "t-everyway", category: "testing",
      prompt: "A systematic test should try to go through what?",
      answers: ["Every way the program could be used"],
      keywords: [new RegExp("^(?=.*\\b(every|all)\\b)(?=.*\\bway\\b)", "i")],
      distractors: ["Only the way you expect players to use it","Only the first screen","Only the parts you wrote last"]
    },
    {
      id: "t-deliberate", category: "testing",
      prompt: "Why do good testers deliberately try to make a game fail?",
      answers: ["To find bugs before a player does"],
      keywords: [new RegExp("^(?=.*\\bfind)(?=.*\\bbug)", "i")],
      distractors: ["To prove the programmer got it wrong","Because it is more fun than playing normally","To make the game harder for players"]
    },
    {
      id: "t-eachstatement", category: "testing",
      prompt: "In a systematic test, how many times should every statement in the code be run and checked?",
      answers: ["At least once"],
      keywords: [/\bat least once\b/i, /\bonce\b/i],
      distractors: ["Never","Only if it looks wrong","Only the statements you wrote today"]
    },
    {
      id: "t-swap", category: "testing",
      prompt: "Why is it useful to swap games with a partner and test each other's, instead of only testing your own?",
      answers: ["You are used to your own game, so a fresh player finds bugs you missed"],
      keywords: [new RegExp("^(?=.*\\b(fresh|else|other|partner|someone)\\b)(?=.*\\b(find|miss|notice))", "i")],
      distractors: ["It is faster than testing alone","Your own game does not need testing","Partners always agree with you"]
    },
    {
      id: "t-record", category: "testing",
      prompt: "What should you do with a bug you find while testing a partner's game?",
      answers: ["Record it, then discuss it with them"],
      keywords: [new RegExp("^(?=.*\\b(record|write|note)\\b)", "i")],
      distractors: ["Fix it yourself in their project","Ignore it if it seems small","Delete the sprite that caused it"]
    },
    {
      id: "r-where", category: "y6debug-record",
      prompt: "On the Testing Record sheet, \"Where did the bug happen?\" is really asking what?",
      answers: ["What you were doing when it happened"],
      keywords: [new RegExp("^(?=.*\\bdoing\\b)(?=.*\\b(you|when)\\b)", "i")],
      distractors: ["What the correct answer should have been","What colour the sprite was","How long the game had been running"]
    },
    {
      id: "r-what", category: "y6debug-record",
      prompt: "On the Testing Record sheet, \"What happened?\" is asking you to describe what?",
      answers: ["What actually went wrong"],
      keywords: [new RegExp("^(?=.*\\b(went|wrong|actual)\\b)", "i")],
      distractors: ["What you expected to happen","Whose game it was","How you fixed it"]
    },
    {
      id: "r-expect", category: "y6debug-record",
      prompt: "On the Testing Record sheet, \"What did you expect to happen?\" is asking for what?",
      answers: ["What you thought would happen instead"],
      keywords: [new RegExp("^(?=.*\\b(thought|expect|should)\\b)", "i")],
      distractors: ["What actually happened","The name of the bug","Who found the bug"]
    },
    {
      id: "r-vague", category: "y6debug-record",
      prompt: "\"It doesn't work\" is a bad bug report. Why?",
      answers: ["It does not say what you were doing, what happened, or what you expected"],
      keywords: [new RegExp("^(?=.*\\b(specific|detail|say|explain)\\b)", "i"), /doesn.?t (say|explain|give)/i],
      distractors: ["It is too polite","It uses too many words","It is written in the wrong colour"]
    },
    {
      id: "r-return", category: "y6debug-record",
      prompt: "After you have collected bug reports about your own game, whose game should you fix next?",
      answers: ["Your own"],
      keywords: [new RegExp("^(?=.*\\bown\\b)", "i"), /\bmine\b/i, /\bmy own\b/i],
      distractors: ["Your partner's game","A different group's game","The example game from the slides"]
    },
    {
      id: "p-onechange", category: "y6debug-process",
      prompt: "When fixing several bugs, why should you test again after each single fix, rather than fixing them all and testing once at the end?",
      answers: ["So you know that fix actually worked, on its own"],
      keywords: [new RegExp("^(?=.*\\bknow\\b)(?=.*\\b(work|fixed|worked)\\b)", "i"), /one at a time/i],
      distractors: ["It saves time overall","It is not necessary to test again","So the game looks more finished"]
    },
    {
      id: "p-order", category: "y6debug-process",
      prompt: "Put these in order: (1) fix your own bugs, (2) test your own game, (3) swap and test a partner's game, (4) record the bugs you find.",
      answers: ["2, 3, 4, 1"],
      keywords: [/2.*3.*4.*1/],
      distractors: ["1, 2, 3, 4","4, 3, 2, 1","3, 1, 2, 4"]
    },
    {
      id: "p-evaluate", category: "y6debug-process",
      prompt: "Beyond finding bugs, what else can you do when you play a partner's finished game?",
      answers: ["Evaluate it and suggest how it could be extended or improved"],
      keywords: [new RegExp("^(?=.*\\b(extend|improve|better))", "i")],
      distractors: ["Nothing else, only look for bugs","Delete parts you do not like","Rename their sprites"]
    },
    {
      id: "p-source", category: "y6debug-process",
      prompt: "A bug report should point to what, so it can actually be fixed?",
      answers: ["The block or blocks causing it"],
      keywords: [/\bblock/i],
      distractors: ["The player's name","The colour of the stage","The time of day it happened"]
    },
    {
      id: "p-honest", category: "y6debug-process",
      prompt: "If you tested a partner's game carefully and only found one bug, what should you write on the Testing Record?",
      answers: ["An honest note that only one bug was found"],
      keywords: [new RegExp("^(?=.*\\b(honest|true|only one|say so)\\b)", "i")],
      distractors: ["Invent a second bug so the sheet looks full","Leave the rest of the sheet blank and say nothing","Write the same bug twice"]
    },
  ]
});
