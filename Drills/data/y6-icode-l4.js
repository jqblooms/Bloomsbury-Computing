// Year 6, 6.2.4: Costumes, Backdrops and Messages
// Loaded by Drills/index.html?drill=y6-icode-l4
DrillData.register("y6-icode-l4", {
  title: "Year 6, 6.2.4: Costumes, Backdrops and Messages",
  subtitle: "Scratch: costumes, animation, broadcasts and levels",
  categories: [
    ["costumes", "Costumes"],
    ["animation", "Animation"],
    ["messages", "Broadcasts"],
    ["levels", "Backdrops and Levels"]
  ],
  cards: [
    {
      id: "co-what", category: "costumes",
      prompt: "What is a costume in Scratch?",
      answers: ["A different look for a sprite"],
      keywords: [[["look", "looks", "picture", "pictures", "image", "images", "appearance", "outfit", "drawing"]]],
      distractors: ["A named place that stores a value", "A message sent to every sprite", "The background of the stage"],
      note: "A sprite can have several costumes and switch between them."
    },
    {
      id: "co-switch", category: "costumes",
      prompt: "Which block puts a sprite into one exact costume, such as gold?",
      answers: ["switch costume to [gold]"],
      keywords: [/switch\s+costume/i],
      distractors: ["next costume", "show", "set size to (100) %"],
      note: "switch costume to picks one costume by name. next costume moves along the list."
    },
    {
      id: "co-next", category: "costumes",
      randomize: function () {
        var k = drillPick([2, 3]), n = drillRange(1, 5);
        var names = ["walk1", "walk2", "walk3"].slice(0, k);
        var ans = names[n % k];
        return {
          blocks: "when flag clicked\nswitch costume to [walk1 v]\nrepeat (" + n + ")\nnext costume\nend",
          prompt: "The sprite has " + k + " costumes: " + names.join(", ") + ". Which costume is it wearing when the script ends?",
          answers: [ans],
          keywords: [new RegExp("^\\s*(costume\\s*)?" + ans.replace("walk", "walk\\s*") + "\\s*$", "i")],
          distractors: names.filter(function (c) { return c !== ans; }),
          working: ["Start on walk1. Each turn of the loop moves one costume along, and after the last costume it goes back to walk1.", "Count along the costumes, one per turn of the loop.", "next costume moves one along the list."],
          note: "Count one step per turn of the loop, and go back to walk1 after the last costume."
        };
      }
    },
    {
      id: "co-last", category: "costumes",
      prompt: "A sprite with 3 costumes is wearing costume 3. What does next costume do?",
      answers: ["Switches to costume 1"],
      keywords: [/\b1\b|\bfirst\b|\bone\b|start/i],
      distractors: ["Stays on costume 3", "Switches to costume 4", "Hides the sprite"],
      note: "After the last costume, next costume goes back to the first."
    },
    {
      id: "an-wait", category: "animation",
      prompt: "A walk animation is far too fast to see. Which block do you add inside the loop?",
      answers: ["wait (0.2) seconds"],
      keywords: [/\bwait\b/i],
      distractors: ["next costume", "hide", "move (10) steps"],
      note: "A short wait slows each costume change down to a walking pace."
    },
    {
      id: "an-rotation", category: "animation",
      prompt: "A walking sprite turns upside down when it bounces off the edge. Which block fixes it?",
      answers: ["set rotation style [left-right]"],
      keywords: [/rotation\s*style|left\s*[-\s]?\s*right/i],
      distractors: ["point in direction (90)", "turn right (180) degrees", "next costume"],
      note: "Left-right rotation flips the sprite instead of turning it over."
    },
    {
      id: "an-loop", category: "animation",
      prompt: "Which loop keeps a walk animation going for the whole game?",
      answers: ["forever"],
      keywords: [/^\s*(a\s+|the\s+)?forever(\s+loop)?\s*$/i],
      distractors: ["repeat (2)", "if then", "wait until"],
      note: "forever keeps switching costumes until the game stops."
    },
    {
      id: "an-time", category: "animation",
      randomize: function () {
        var n = drillPick([4, 5, 6, 8, 10]), tenths = drillPick([1, 2, 5]);
        var total = n * tenths / 10;
        var wait = String(tenths / 10);
        return {
          blocks: "when flag clicked\nrepeat (" + n + ")\nnext costume\nwait (" + wait + ") seconds\nend",
          prompt: "How many seconds does this loop take to finish?",
          answers: [String(total)],
          keywords: [new RegExp("^\\s*" + String(total).replace(".", "\\.") + "\\s*(s|secs?|seconds?)?\\s*$", "i")],
          distractors: drillWrongNumbers(total, [n, tenths / 10, n + tenths / 10, total * 2], 3),
          working: ["Each turn waits " + wait + " seconds, and the loop runs " + n + " times.", "How long is one turn? How many turns?", "Only the wait block takes time."],
          note: n + " turns of " + wait + " seconds: " + total + " seconds."
        };
      }
    },
    {
      id: "m-broadcast", category: "messages",
      prompt: "Which block sends a message to every sprite and the stage?",
      answers: ["broadcast [level up]"],
      keywords: [/broadcast/i],
      distractors: ["when I receive [level up]", "say [level up]", "switch backdrop to [Level 2]"],
      note: "broadcast sends the message. when I receive waits for it."
    },
    {
      id: "m-receive", category: "messages",
      prompt: "Which hat block starts a script when a message arrives?",
      answers: ["when I receive [level up]"],
      keywords: [/receive/i],
      distractors: ["broadcast [level up]", "when green flag clicked", "when this sprite clicked"],
      note: "Every when I receive script for that message starts together."
    },
    {
      id: "m-who", category: "messages",
      prompt: "Which scripts start when [level up] is broadcast?",
      answers: ["Every when I receive [level up] script, in any sprite"],
      keywords: [/\b(every|all|each|any)\b/i],
      distractors: ["Only scripts in the sprite that sent it", "Only the stage scripts", "None until the green flag"],
      note: "A broadcast reaches every sprite and the stage."
    },
    {
      id: "lv-backdrop", category: "levels",
      prompt: "Which block changes the stage picture to show level 2?",
      answers: ["switch backdrop to [Level 2]"],
      keywords: [/switch\s+backdrop|backdrop\s+to|next\s+backdrop/i],
      distractors: ["switch costume to [Level 2]", "next costume", "broadcast [Level 2]"],
      note: "Backdrops belong to the stage. Costumes belong to sprites."
    },
    {
      id: "lv-coins", category: "levels",
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
    },
    {
      id: "lv-level", category: "levels",
      blocks: "when I receive [level up v]\nswitch backdrop to [Level 2 v]\nchange [level v] by (1)",
      prompt: "level is 1 when the message arrives. What is level afterwards?",
      answers: ["2"],
      keywords: [drillNumberRe(2, "level")],
      distractors: ["1", "0", "3"],
      working: ["change adds to the value level already has.", "level was 1 before the message.", "change is not the same as set."],
      note: "change adds 1 to the 1 it already had."
    },
    {
      id: "lv-reset", category: "levels",
      prompt: "Which backdrop should the green flag switch to, so each new game starts on the first level?",
      answers: ["Level 1"],
      keywords: [/level\s*1\b|level\s+one|\bfirst\b/i],
      distractors: ["Level 2", "The last backdrop", "No backdrop"],
      note: "Reset everything at the green flag: backdrop, score and level."
    }
  ]
});
