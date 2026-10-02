// Year 6, 6.2.4.6: Bug Hunt
// Loaded by Drills/index.html?drill=y6-bughunt-l46
// The plenary: what a bug is, the four kinds of bug from the six Bug Hunts, and their fixes.
DrillData.register("y6-bughunt-l46", {
  title: "Year 6, 6.2.4.6: Bug Hunt",
  subtitle: "Scratch: spotting, finding and fixing bugs",
  categories: [
    ["bugs", "Bugs and Testing"],
    ["kinds", "Which Kind of Bug?"],
    ["fixes", "Fix It"]
  ],
  cards: (function () {
    var KINDS = ["Goes the wrong way", "Runs once, then stops", "A value gets stuck", "Never happens at all"];
    var KIND_RE = [/wrong\s*way|backwards|opposite/i, /\bonce\b/i, /\bstuck\b/i, /\bnever\b/i];
    var KIND_NOTE = [
      "Goes the wrong way: look for a number that should be negative, or the other way round.",
      "Runs once, then stops: the blocks need to be inside a forever loop.",
      "A value gets stuck: the script uses set when it should use change.",
      "Never happens at all: read the condition. Is it checking the right sprite? Can it ever be true?"
    ];
    function kind(i, scenario) {
      return { prompt: scenario + " Which kind of bug is it?", answers: [KINDS[i]], keywords: [KIND_RE[i]],
        distractors: KINDS.filter(function (k, j) { return j !== i; }),
        working: ["Say what you expected, then what actually happened.", "Is something backwards, stopping early, stuck on one value, or never happening?"],
        note: KIND_NOTE[i] };
    }
    return [
      {
        id: "b-bug", category: "bugs",
        prompt: "What should happen and what does happen are different. What do we call that?",
        answers: ["A bug"],
        keywords: [/\bbugs?\b/i],
        distractors: ["A sprite", "A loop", "A level"],
        working: ["Compare what should happen with what does happen.", "They are different. There is a short word for that."],
        note: "A bug: expected and actual are different."
      },
      {
        id: "b-expected", category: "bugs",
        prompt: "In a test, what do we call what should happen?",
        answers: ["Expected"],
        keywords: [/expect/i],
        distractors: ["Actual", "Broadcast", "Variable"],
        working: ["What you expect to happen has its own word.", "It is the opposite of actual."],
        note: "Expected is what should happen. Actual is what really happens."
      },
      {
        id: "b-actual", category: "bugs",
        prompt: "In a test, what do we call what really happens?",
        answers: ["Actual"],
        keywords: [/actual/i],
        distractors: ["Expected", "Costume", "Event"],
        working: ["What really happens, not what should.", "It is the opposite of expected."],
        note: "Compare actual with expected. Different means a bug."
      },
      {
        id: "b-next", category: "bugs",
        prompt: "You found the bug and changed one block. What is the next step?",
        answers: ["Test again"],
        keywords: [/\btest|\bcheck|\bplay|\btry/i],
        distractors: ["Change 5 more", "Delete the sprite", "Start a new game"],
        working: ["You changed one block. Did it work?", "Find out by running the game."],
        note: "Change one thing, then test again."
      },
      {
        id: "b-one", category: "bugs",
        prompt: "Why change only one thing before you test again?",
        answers: ["So you know what fixed it"],
        keywords: [[["know", "tell", "see", "find", "which"], ["fix", "fixed", "fixes", "change", "changed", "broke", "worked", "works"]]],
        distractors: ["It makes the game faster", "Scratch only allows one", "It saves the project"],
        working: ["Imagine you changed five blocks and now it works. Which one did it?", "With only one change, you can tell."],
        note: "One change, one test: if it works, you know which change fixed it."
      },
      { id: "k-way", category: "kinds", randomize: function () {
          return kind(0, drillPick(["time should count down 20, 19, 18. It counts 20, 21, 22.", "The left arrow should move the Ship left. It moves right."]));
        } },
      { id: "k-once", category: "kinds", randomize: function () {
          return kind(1, drillPick(["The Ghost glides there and back one time, then stands still.", "The Ball moves one step after the green flag, then stops."]));
        } },
      { id: "k-stuck", category: "kinds", randomize: function () {
          return kind(2, drillPick(["Every pop should add 1, but score is always 1.", "Each click should add 1 to clicks, but clicks never goes past 1."]));
        } },
      { id: "k-never", category: "kinds", randomize: function () {
          return kind(3, drillPick(["You have the key and you touch the Door. The Door does not open.", "lives reaches 0, but Game Over does not come."]));
        } },
      {
        id: "f-timer", category: "fixes",
        blocks: "repeat until <(time) = (0)>\nwait (1) seconds\nchange [time v] by (1)\nend",
        prompt: "time should count down to 0. What number should be in the change [time] block?",
        answers: ["-1"],
        keywords: [drillNumberRe(-1)],
        distractors: ["1", "0", "20"],
        working: ["Counting down makes time smaller each second.", "Smaller means the change must be negative."],
        note: "change [time] by (-1) takes one away each second."
      },
      {
        id: "f-forever", category: "fixes",
        blocks: "when flag clicked\nglide (1.5) secs to x: (100) y: (0)\nglide (1.5) secs to x: (-100) y: (0)",
        prompt: "The Ghost should patrol for the whole game, but it goes there and back once. Which block should go around the two glides?",
        answers: ["forever"],
        keywords: [/forever|repeat|loop/i],
        distractors: ["if then", "wait (1) seconds", "say [Boo]"],
        working: ["Which loop keeps blocks running for the whole game?", "It has no number in it: it never stops."],
        note: "Blocks that should keep running go inside forever."
      },
      {
        id: "f-set", category: "fixes",
        blocks: "when this sprite clicked\nstart sound [pop v]\nset [score v] to (1)",
        prompt: "score is always 1. Which block should replace set [score] to (1)?",
        answers: ["change [score] by (1)"],
        keywords: [/change\b.*\b1\b/i],
        distractors: ["set [score] to (0)", "set [score] to (2)", "change [score] by (0)"],
        working: ["set replaces the value. Which block adds to it instead?", "Each pop should add 1 to the score it already has."],
        note: "change adds 1 to what score already is. set makes it 1 every time."
      },
      {
        id: "f-door", category: "fixes",
        blocks: "wait until <<touching [Ghost v] ?> and <(keys) = (1)>>\nswitch costume to [open v]",
        prompt: "The Door should open when the Hero arrives with the key. What should Ghost be changed to?",
        answers: ["Hero"],
        keywords: [/^\s*(the\s+)?hero\s*$/i],
        distractors: ["Ghost", "Key", "Door"],
        working: ["Which sprite should walk up to the Door?", "It is the sprite the player moves with the arrow keys."],
        note: "The Door must wait for the sprite that opens it: the Hero."
      },
      { id: "f-lives", category: "fixes", randomize: function () {
          var start = drillPick([3, 4, 5]);
          return {
            blocks: "when flag clicked\nset [lives v] to (" + start + ")\nwait until <(lives) < (0)>\nswitch backdrop to [Game Over v]",
            prompt: "Each hit takes 1 life, and lives stops at 0. Is (lives) < (0) ever true?",
            answers: ["No"],
            keywords: [/^\s*no\b|never|false/i],
            distractors: ["Yes"],
            working: ["Count down: " + start + ", then " + (start - 1) + ", and so on, down to 0. Then the game should end.", "Is 0 less than 0?"],
            note: "lives stops at 0, and 0 is not less than 0. Use (lives) = (0)."
          };
        } },
      { id: "f-left", category: "fixes", randomize: function () {
          var step = drillPick([4, 6, 8, 10]);
          return {
            blocks: "if <key [left arrow v] pressed?> then\nchange x by (" + step + ")\nend",
            prompt: "This should move the Ship left by " + step + ". What number should be in the change x block?",
            answers: ["-" + step],
            keywords: [drillNumberRe(-step, "x")],
            distractors: [String(step), "0", "-" + (step * 2)],
            working: ["Moving left makes x smaller.", "Keep the same size of step, but make it negative."],
            note: "Left makes x smaller, so the number is negative."
          };
        } }
    ];
  })()
});
