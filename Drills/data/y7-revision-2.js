// Year 7: Revision 2, Decisions and Sub-routines (the last lesson before the Term 1 exam)
// Loaded by Drills/index.html?drill=y7-revision-2
// Lessons 3 and 4 only: AND, OR and NOT on 1 and 0, comparing numbers, sub-routines and CALL, and filling in a
// decision or a CALL box from what a flowchart should do. Typed answers, short sentences (most of the class are
// EAL learners), fresh values on every draw. Every answer comes from running the card's own flowchart
// (Drills/flowchart-core.js), in Year 7's words: True and False arrows, pressed and not pressed, Say, Move, CALL.
DrillData.register("y7-revision-2", {
  title: "Year 7: Revision 2, Decisions and Sub-routines",
  subtitle: "AND, OR, NOT, comparisons and sub-routines",
  categories: [
    ["r2-logic", "AND, OR and NOT"],
    ["r2-compare", "Comparisons"],
    ["r2-sub", "Sub-routines"],
    ["r2-fill", "Fill In the Flowchart"]
  ],
  cards: (function () {
    var FC = FlowchartCore;
    var WORDS = ["Hello", "Ready", "Go", "Done", "Hi", "Stop", "Yes", "Bye", "Wave", "Jump", "Clap", "Spin"];
    var PAIRS = [["Up", "Right", "Diagonal", "Straight"], ["Space", "Enter", "Pause", "Play"], ["Left", "Down", "Slide", "Stand"], ["Up", "Left", "Climb", "Wait"]];
    var THINGS = [["Score", "Target", "Win", "Try again"], ["Coins", "Price", "Buy", "Save up"], ["Speed", "Limit", "Slow down", "Keep going"], ["Points", "Goal", "Level up", "Keep going"]];
    var SIGN = { ">": "bigger than", "<": "smaller than", "=": "the same as", "<>": "not the same as" };

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function range(a, b, step) { return drillRange(a, b, step); }
    function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }
    function words(n) { return shuffled(WORDS).slice(0, n); }
    function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function numRe(n, unit) {
      var body = (n < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(n);
      return new RegExp("^\\s*(box\\s*)?" + body + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*$", "i");
    }
    function wordRe(w) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + esc(w).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"); }
    function bitRe(v) { return new RegExp("^\\s*(" + v + "|" + (v ? "true" : "false") + ")\\s*$", "i"); }
    function sayRe(w) { return new RegExp("^\\s*say\\s*:?\\s*[\"'\\u201c]?\\s*" + esc(w) + "\\s*[\"'\\u201d]?\\s*$", "i"); }
    function moveRe(n) { return new RegExp("^\\s*move\\s*:?\\s*" + n + "(\\s*steps?)?\\s*$", "i"); }
    function orderRe(list) {
      return new RegExp("^\\s*" + list.map(function (w) { return "[\"'\\u201c]?" + esc(w) + "[\"'\\u201d]?"; }).join("\\s*(,|;|then|and|\\s)\\s*(then\\s+)?") + "\\s*\\.?\\s*$", "i");
    }
    function others(ans, list) { return drillWrongNumbers(ans, list.filter(function (v) { return v !== ans; }), 3); }
    function keyWord(v) { return v ? "pressed" : "not pressed"; }

    function branch(question, trueBox, falseBox) {
      return { nodes: [
        { id: "s", type: "terminal", text: "Start" }, { id: "d", type: "decision", text: question },
        { id: "t", type: trueBox[0], text: trueBox[1] }, { id: "e", type: "terminal", text: "End" }, { id: "f", type: falseBox[0], text: falseBox[1] }
      ], edges: [
        { from: "s", to: "d", label: null }, { from: "d", to: "t", label: "True" }, { from: "d", to: "f", label: "False" },
        { from: "t", to: "e", label: null }, { from: "f", to: "e", label: null }
      ] };
    }
    function say(w) { return ["io", "Say \"" + w + "\""]; }
    function withSub(main, name, sub) { main.subs = {}; main.subs[name] = sub; return main; }

    // As in the Year 7 recap drill: `example` is another draw of the same kind, with a different answer that
    // appears nowhere in it, worked through step by step.
    function card(id, category, gen) {
      return { id: id, category: category, randomize: function () {
        var c = gen(), ex = null, exSteps = null;
        var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
        [function (s) { return s; }, function (s) { return s.replace(/ The sprite has moved \d+ steps so far\./, ""); }].forEach(function (tidy) {
          for (var i = 0; i < 80 && !ex; i++) {
            var e = gen(), st = e.steps.map(tidy);
            var text = ((e.flow ? FC.describe(e.flow) : "") + " " + e.prompt + " " + st.join(" ")).toLowerCase();
            if (String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) { ex = e; exSteps = st; }
          }
        });
        var example = !ex ? null : (ex.flow ? "A similar flowchart: " + FC.describe(ex.flow) + "\n" : "A similar question:\n") +
          ex.prompt + "\n" + exSteps.join("\n") + "\nAnswer: " + ex.answer;
        return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
          flow: c.flow, example: example, working: c.working, note: c.note, trace: c.steps };
      } };
    }

    // A Main that CALLs a sub-routine; returns the flow and its run.
    function callFlow() {
      var w = words(3), name = pick(["Beep", "Hop", "Greet", "Flash"]), m = range(10, 30, 10), calls = range(2, 3);
      var sub = FC.line([["io", "Say \"" + w[0] + "\""], ["process", "Move " + m + " steps"]]);
      var boxes = [];
      for (var i = 0; i < calls; i++) boxes.push(["call", "CALL " + name]);
      var midMove = range(20, 50, 10);
      boxes.splice(1, 0, Math.random() < 0.5 ? ["io", "Say \"" + w[1] + "\""] : ["process", "Move " + midMove + " steps"]);
      if (Math.random() < 0.5) boxes.unshift(["io", "Say \"" + w[2] + "\""]);
      var flow = withSub(FC.line(boxes), name, sub);
      return { flow: flow, run: FC.run(flow, {}), name: name, word: w[0], calls: calls, m: m, boxes: boxes };
    }

    return [
      // ================= AND, OR and NOT
      card("r2-andor-say", "r2-logic", function () {
        var t = pick(PAIRS), op = pick(["AND", "OR"]), a = range(0, 1), b = range(0, 1);
        var flow = branch(t[0] + " " + op + " " + t[1] + " pressed?", say(t[2]), say(t[3]));
        var keys = {}; keys[t[0]] = a; keys[t[1]] = b;
        var r = FC.run(flow, { keys: keys }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + keyWord(a) + ". " + t[1] + " is " + keyWord(b) + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"],
          steps: [t[0] + " is " + a + ". " + t[1] + " is " + b + ".", r.trace[1], "Say \"" + ans + "\"."],
          working: ["Write 1 for pressed and 0 for not pressed.", op === "AND" ? "AND is 1 only when both parts are 1. Then follow the arrow." : "OR is 1 when at least one part is 1. Then follow the arrow."],
          note: t[0] + " " + op + " " + t[1] + " is " + (FC.evaluate(t[0] + " " + op + " " + t[1], keys)) + ", so the sprite says " + ans + "." };
      }),
      card("r2-not-say", "r2-logic", function () {
        var t = pick([["Up", "Stand still", "Jump"], ["Space", "Walk", "Shoot"], ["Right", "Wait", "Run"], ["Enter", "Play", "Pause"]]), v = range(0, 1);
        var flow = branch("NOT " + t[0] + " pressed?", say(t[1]), say(t[2]));
        var keys = {}; keys[t[0]] = v;
        var r = FC.run(flow, { keys: keys }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + keyWord(v) + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[1] ? t[2] : t[1], "True", "False"],
          steps: [t[0] + " is " + v + ".", r.trace[1], "Say \"" + ans + "\"."],
          working: ["Write 1 for pressed and 0 for not pressed.", "NOT swaps the value. Work out NOT first, then follow the arrow."],
          note: "NOT " + t[0] + " is " + (1 - v) + ", so the sprite says " + ans + "." };
      }),
      card("r2-logic-value", "r2-logic", function () {
        var t = pick(PAIRS), op = pick(["AND", "OR", "NOT"]), a = range(0, 1), b = range(0, 1), vals = {};
        vals[t[0]] = a; vals[t[1]] = b;
        var expr = op === "NOT" ? "NOT " + t[0] : t[0] + " " + op + " " + t[1];
        var given = op === "NOT" ? t[0] + " is " + a + "." : t[0] + " is " + a + " and " + t[1] + " is " + b + ".";
        var v = FC.evaluate(expr, vals), ans = String(v);
        var rule = op === "AND" ? "AND is 1 only when both parts are 1." : op === "OR" ? "OR is 1 when at least one part is 1." : "NOT swaps the value: 1 becomes 0 and 0 becomes 1.";
        return { flow: null, prompt: given + " What is " + expr + ": 1 or 0?", answer: ans, re: bitRe(v), wrong: [String(1 - v), "2", "Both"],
          steps: [rule, given + " So " + expr + " is " + ans + "."],
          working: [rule, "Put the values in, then use the rule."],
          note: expr + " is " + ans + "." };
      }),
      card("r2-arrow", "r2-logic", function () {
        var t = pick(PAIRS), op = pick(["AND", "OR", "NOT"]), a = range(0, 1), b = range(0, 1), keys = {};
        keys[t[0]] = a; keys[t[1]] = b;
        var q = op === "NOT" ? "NOT " + t[0] + " pressed?" : t[0] + " " + op + " " + t[1] + " pressed?";
        var flow = branch(q, say(t[2]), say(t[3]));
        var r = FC.run(flow, { keys: keys }), ans = r.said[0] === t[2] ? "True" : "False";
        var given = op === "NOT" ? t[0] + " is " + keyWord(a) + "." : t[0] + " is " + keyWord(a) + ". " + t[1] + " is " + keyWord(b) + ".";
        return { flow: flow, prompt: given + " Which arrow does the decision follow, True or False?", answer: ans, re: new RegExp("^\\s*(the\\s+)?" + ans + "(\\s+arrow)?\\s*$", "i"),
          wrong: [ans === "True" ? "False" : "True", "Both", "Neither"],
          steps: [r.trace[1], "So it follows the " + ans + " arrow."],
          working: ["Write 1 for pressed and 0 for not pressed. Work out the decision.", "A decision that is 1 follows one arrow; 0 follows the other. Read the labels on the arrows."],
          note: r.trace[1] };
      }),

      // ================= Comparisons
      card("r2-compare-say", "r2-compare", function () {
        var t = pick(THINGS), op = pick([">", "<", "=", "<>"]), a = range(5, 30), b = pick([a, a, a + range(1, 6), a - range(1, 4)]);
        var flow = branch(t[0] + " " + op + " " + t[1] + "?", say(t[2]), say(t[3]));
        var vals = {}; vals[t[0]] = a; vals[t[1]] = b;
        var r = FC.run(flow, { values: vals }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + a + ". " + t[1] + " is " + b + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"],
          steps: [r.trace[1], "Say \"" + ans + "\"."],
          working: ["Put the two numbers into the question. Is it 1 or 0?", "> bigger than, < smaller than, = the same, <> not the same. 1 follows True, 0 follows False."],
          note: r.trace[1] };
      }),
      card("r2-compare-value", "r2-compare", function () {
        var op = pick([">", "<", "=", "<>"]), a = range(1, 12), b = pick([a, range(1, 12)]);
        var expr = "A " + op + " B", v = FC.evaluate(expr, { A: a, B: b }), ans = String(v);
        return { flow: null, prompt: "A is " + a + " and B is " + b + ". What is " + expr + ": 1 or 0?", answer: ans,
          re: bitRe(v), wrong: [String(1 - v), "2", "Both"],
          steps: [op + " asks: is A " + SIGN[op] + " B?", "Is " + a + " " + SIGN[op] + " " + b + "? " + (v ? "Yes" : "No") + ", so " + a + " " + op + " " + b + " is " + ans + "."],
          working: ["Say it in words: is A " + SIGN[op] + " B?", "Yes is 1. No is 0."],
          note: a + " " + op + " " + b + " is " + ans + "." };
      }),
      card("r2-sign", "r2-compare", function () {
        var t = pick(THINGS), op = pick([">", "<", "=", "<>"]);
        var flow = branch(t[0] + " ? " + t[1] + "?", say(t[2]), say(t[3]));
        return { flow: flow, prompt: "It should say \"" + t[2] + "\" when " + t[0] + " is " + SIGN[op] + " " + t[1] + ". Which sign replaces the ?",
          answer: op, re: new RegExp("^\\s*" + { ">": ">", "<": "<", "=": "={1,2}", "<>": "<\\s*>" }[op] + "\\s*$"),
          wrong: [">", "<", "=", "<>"].filter(function (x) { return x !== op; }),
          steps: ["The four signs: > bigger than, < smaller than, = the same, <> not the same.", SIGN[op].charAt(0).toUpperCase() + SIGN[op].slice(1) + " is " + op + "."],
          working: ["Find the words in the question: bigger, smaller, the same or not the same.", "Each of those has its own sign. Type the sign, not words."],
          note: SIGN[op].charAt(0).toUpperCase() + SIGN[op].slice(1) + " is " + op + "." };
      }),

      // ================= Sub-routines
      card("r2-call-count", "r2-sub", function () {
        var c = callFlow(), n = c.run.said.filter(function (s) { return s === c.word; }).length;
        return { flow: c.flow, prompt: "How many times is \"" + c.word + "\" said altogether?", answer: n, re: numRe(n, "times?"),
          wrong: others(n, [1, n + 1, n * 2, 4]), steps: c.run.trace,
          working: ["Each CALL runs the whole sub-routine once.", "Count the CALL boxes in Main."],
          note: c.name + " is CALLed " + c.calls + " times. It says \"" + c.word + "\" once each time." };
      }),
      card("r2-call-steps", "r2-sub", function () {
        var c = callFlow(), s = c.run.steps;
        return { flow: c.flow, prompt: "How many steps does the sprite move altogether?", answer: s, re: numRe(s, "steps?"),
          wrong: others(s, [c.m, c.m * c.calls + c.m, s + 10, s - c.m]), steps: c.run.trace,
          working: ["Each CALL runs every box in the sub-routine once.", "Add the steps from every CALL, then any Move box in Main."],
          note: "The sprite moves " + s + " steps altogether." };
      }),
      card("r2-call-next", "r2-sub", function () {
        var c = callFlow(), i = c.boxes.map(function (b) { return b[0]; }).indexOf("call"), next = c.boxes[i + 1];
        var m = /^Move (\d+) steps$/.exec(next[1]), s = /^Say "(.*)"$/.exec(next[1]);
        var re = m ? moveRe(m[1]) : s ? sayRe(s[1]) : new RegExp("^\\s*call\\s+" + c.name + "\\s*$", "i");
        return { flow: c.flow, prompt: c.name + " reaches its End the first time. Which box in Main runs next? Write the whole box.", answer: next[1], re: re,
          wrong: ["Start", "End"].concat(i > 0 ? [c.boxes[i - 1][1]] : ["Say \"" + c.word + "\""]),
          steps: ["Main runs until the first CALL " + c.name + ".", c.name + " runs from its own Start to its End.", "Main carries on just after that CALL: " + next[1] + "."],
          working: ["When a sub-routine ends, Main carries on.", "Find the first CALL in Main. Look at the box just after it."],
          note: "After " + c.name + " ends, Main carries on just after the CALL: " + next[1] + "." };
      }),
      card("r2-call-order", "r2-sub", function () {
        var w = words(3), name = pick(["Beep", "Greet", "Signal"]);
        var sub = FC.line([["io", "Say \"" + w[0] + "\""]]);
        var flow = withSub(FC.line(shuffled([["io", "Say \"" + w[1] + "\""], ["call", "CALL " + name], ["io", "Say \"" + w[2] + "\""]])), name, sub);
        var r = FC.run(flow, {}), ans = r.said.join(", ");
        var rot = r.said.slice(1).concat(r.said.slice(0, 1)).join(", "), rev = r.said.slice().reverse().join(", ");
        return { flow: flow, prompt: "Write everything the sprite says, in order.", answer: ans, re: orderRe(r.said),
          wrong: [rot, rev, r.said.slice(0, 2).join(", ")].filter(function (x) { return x !== ans; }),
          steps: r.trace,
          working: ["Follow Main from its Start. At the CALL, go through the sub-routine, then come back.", "Write each Say as you reach it."],
          note: "In order: " + ans + "." };
      }),
      card("r2-call-written", "r2-sub", function () {
        var name = pick(["DrawSide", "Beep", "Hop"]), k = range(2, 4);
        var sub = name === "DrawSide" ? FC.line([["process", "Move 50 steps"], ["process", "Turn right 90 degrees"]]) : FC.line([["io", "Say \"" + name + "\""]]);
        var boxes = []; for (var i = 0; i < k; i++) boxes.push(["call", "CALL " + name]);
        var flow = withSub(FC.line(boxes), name, sub);
        if (Math.random() < 0.4) {
          return { flow: flow, prompt: "How many times does the sub-routine " + name + " run?", answer: k, re: numRe(k, "times?"),
            wrong: others(k, [1, k + 1, k * 2, 0]),
            steps: ["Each CALL runs the whole sub-routine once.", "Main has " + k + " CALL boxes, so " + name + " runs " + k + " times."],
            working: ["Count the CALL boxes in Main.", "Each CALL runs the sub-routine once."],
            note: "Main CALLs " + name + " " + k + " times, so it runs " + k + " times." };
        }
        return { flow: flow, prompt: "Main CALLs " + name + " " + k + " times. How many times is " + name + " written out in full?", answer: "1",
          re: /^\s*(1|one|once)(\s*times?)?\s*$/i, wrong: [String(k), String(k + 1), "0"],
          steps: ["A sub-routine is written as its own flowchart.", "Each CALL runs that same flowchart again. It is never copied out."],
          working: ["Count the sub-routine flowcharts, not the CALL boxes.", "A CALL jumps to the sub-routine. It does not copy its boxes."],
          note: name + " is written out once and CALLed " + k + " times." };
      }),

      // ================= Fill in the flowchart
      card("r2-fill-decision", "r2-fill", function () {
        var t = pick(PAIRS), op = pick(["AND", "OR"]);
        var flow = branch("?", say(t[2]), say(t[3]));
        var want = op === "AND" ? "only when " + t[0] + " and " + t[1] + " are both pressed" : "when " + t[0] + " or " + t[1] + " is pressed (one or both)";
        var k1 = t[0].toLowerCase(), k2 = t[1].toLowerCase();
        var re = new RegExp("^\\s*(is\\s+|are\\s+)?(both\\s+)?(" + k1 + "(\\s+(arrow|key))?\\s+" + op + "\\s+" + k2 + "|" + k2 + "(\\s+(arrow|key))?\\s+" + op + "\\s+" + k1 + ")(\\s+(arrows?|keys?))?(\\s+(both\\s+)?pressed)?\\s*\\??\\s*$", "i");
        var other = op === "AND" ? "OR" : "AND";
        return { flow: flow, prompt: "It should say \"" + t[2] + "\" " + want + ". What should the ? box say?",
          answer: t[0] + " " + op + " " + t[1] + " pressed?", re: re,
          wrong: [t[0] + " " + other + " " + t[1] + " pressed?", t[0] + " pressed?", "NOT " + t[0] + " pressed?"],
          steps: ["The ? box is a decision about two keys.", op === "AND" ? "Both keys must be pressed, so use AND." : "One key is enough, so use OR.", "The box says: " + t[0] + " " + op + " " + t[1] + " pressed?"],
          working: ["AND needs both parts to be 1. OR needs at least one.", "Write the two keys with the right word between them, then pressed?"],
          note: "The decision is: " + t[0] + " " + op + " " + t[1] + " pressed?" };
      }),
      card("r2-fill-compare", "r2-fill", function () {
        var t = pick(THINGS), op = pick([">", "<", "="]);
        var flow = branch("?", say(t[2]), say(t[3]));
        var s = { ">": ">", "<": "<", "=": "={1,2}" }[op], flip = { ">": "<", "<": ">", "=": "={1,2}" }[op];
        var a = t[0].toLowerCase(), b = t[1].toLowerCase();
        var re = new RegExp("^\\s*(is\\s+)?(" + a + "\\s*" + s + "\\s*" + b + "|" + b + "\\s*" + flip + "\\s*" + a + ")\\s*\\??\\s*$", "i");
        var wrongOps = [">", "<", "="].filter(function (x) { return x !== op; });
        return { flow: flow, prompt: "It should say \"" + t[2] + "\" when " + t[0] + " is " + SIGN[op] + " " + t[1] + ". Write the decision in the ? box.",
          answer: t[0] + " " + op + " " + t[1] + "?", re: re,
          wrong: [t[0] + " " + wrongOps[0] + " " + t[1] + "?", t[0] + " " + wrongOps[1] + " " + t[1] + "?", t[0] + " <> " + t[1] + "?"],
          steps: ["The words say: " + t[0] + " is " + SIGN[op] + " " + t[1] + ".", SIGN[op].charAt(0).toUpperCase() + SIGN[op].slice(1) + " is " + op + ".", "The decision is: " + t[0] + " " + op + " " + t[1] + "?"],
          working: ["Write the first name, then the sign, then the second name.", "> bigger than, < smaller than, = the same, <> not the same."],
          note: "The decision is: " + t[0] + " " + op + " " + t[1] + "?" };
      }),
      card("r2-fill-call", "r2-fill", function () {
        var name = pick(["DrawSide", "Beep", "Hop", "Flash", "Greet"]), w = pick(WORDS);
        var sub = name === "DrawSide" ? FC.line([["process", "Move 40 steps"], ["process", "Turn right 90 degrees"]]) : FC.line([["io", "Say \"" + w + "\""]]);
        var flow = withSub(FC.line([["io", "Say \"Ready\""], ["call", "?"]]), name, sub);
        return { flow: flow, prompt: "Main should run the sub-routine " + name + " after it says Ready. What should the ? box say?",
          answer: "CALL " + name, re: new RegExp("^\\s*call\\s+" + name + "\\s*\\(?\\)?\\s*$", "i"),
          wrong: [name, "Start " + name, "End"],
          steps: ["Main runs a sub-routine with a CALL box.", "A CALL box says CALL, then the name of the sub-routine: CALL " + name + "."],
          working: ["Use the block that jumps to a sub-routine.", "Write that word, then the sub-routine's name."],
          note: "The box is CALL " + name + "." };
      })
    ];
  })()
});
