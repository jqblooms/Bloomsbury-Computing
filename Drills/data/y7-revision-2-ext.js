// Year 7, Revision 2: Do Now Extension
// Loaded by Drills/index.html?drill=y7-revision-2-ext
// For students who finish the Do Now early: harder questions from all four Year 7 flowchart lessons (reading and
// fixing, key-press loops, AND, OR, NOT and comparisons, sub-routines), written fresh. Every card has an `example`,
// another draw of the same kind worked through step by step with a different answer, then two `working` nudges.
// Every answer comes from running the card's own flowchart (Drills/flowchart-core.js), in Year 7's words.
DrillData.register("y7-revision-2-ext", {
  title: "Year 7 Extension: All Four Lessons",
  subtitle: "Revision 2 Do Now Extension",
  categories: [
    ["x-l12", "Reading, Fixing and Loops (Lessons 1, 2)"],
    ["x-l3", "AND, OR, NOT and Comparisons (Lesson 3)"],
    ["x-l4", "Sub-routines (Lesson 4)"]
  ],
  cards: (function () {
    var FC = FlowchartCore;
    var WORDS = ["Hello", "Ready", "Go", "Done", "Hi", "Stop", "Yes", "Bye", "Wave", "Jump", "Clap", "Spin"];
    var DIRS = [["right", 90], ["left", -90], ["up", 0], ["down", 180]];

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
    function sayRe(w) { return new RegExp("^\\s*say\\s*:?\\s*[\"'\\u201c]?\\s*" + esc(w) + "\\s*[\"'\\u201d]?\\s*$", "i"); }
    function moveRe(n) { return new RegExp("^\\s*move\\s*:?\\s*" + n + "(\\s*steps?)?\\s*$", "i"); }
    function orderRe(list) {
      return new RegExp("^\\s*" + list.map(function (w) { return "[\"'\\u201c]?" + esc(w) + "[\"'\\u201d]?"; }).join("\\s*(,|;|then|and|\\s)\\s*(then\\s+)?") + "\\s*\\.?\\s*$", "i");
    }
    function others(ans, list) { return drillWrongNumbers(ans, list.filter(function (v) { return v !== ans; }), 3); }
    function keyWord(v) { return v ? "pressed" : "not pressed"; }
    function say(w) { return ["io", "Say \"" + w + "\""]; }
    function withSub(main, name, sub) { main.subs = {}; main.subs[name] = sub; return main; }
    function branch(question, trueBox, falseBox) {
      return { nodes: [
        { id: "s", type: "terminal", text: "Start" }, { id: "d", type: "decision", text: question },
        { id: "t", type: trueBox[0], text: trueBox[1] }, { id: "e", type: "terminal", text: "End" }, { id: "f", type: falseBox[0], text: falseBox[1] }
      ], edges: [
        { from: "s", to: "d", label: null }, { from: "d", to: "t", label: "True" }, { from: "d", to: "f", label: "False" },
        { from: "t", to: "e", label: null }, { from: "f", to: "e", label: null }
      ] };
    }
    function keyLoop(key, dir, step) {
      return { nodes: [
        { id: "s", type: "terminal", text: "Start" }, { id: "d", type: "decision", text: key + " pressed?" },
        { id: "p", type: "process", text: "Point in direction " + dir }, { id: "m", type: "process", text: "Move " + step + " steps" }
      ], edges: [
        { from: "s", to: "d", label: null }, { from: "d", to: "p", label: "True" }, { from: "p", to: "m", label: null },
        { from: "m", to: "d", label: null }, { from: "d", to: "d", label: "False" }
      ] };
    }

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

    return [
      // ================= Lessons 1 and 2
      card("x-read-order", "x-l12", function () {
        var w = words(3), a = range(10, 50, 10), b = range(10, 50, 10);
        var flow = FC.line(shuffled([["process", "Move " + a + " steps"], ["process", "Move " + b + " steps"]]).concat([say(w[0])]).concat(shuffled([say(w[1]), say(w[2])])));
        var r = FC.run(flow, {}), ans = r.said.join(", ");
        return { flow: flow, prompt: "Write everything the sprite says, in order.", answer: ans, re: orderRe(r.said),
          wrong: [r.said.slice().reverse().join(", "), r.said.slice(1).concat(r.said.slice(0, 1)).join(", "), r.said.slice(0, 2).join(", ")],
          steps: r.trace, working: ["Begin at Start and follow the arrows, one box at a time.", "Write each Say box as you reach it. Move boxes say nothing."],
          note: "In order: " + ans + "." };
      }),
      card("x-wrong-box", "x-l12", function () {
        var d = pick(DIRS), n = range(20, 60, 10), m = range(10, 40, 10), w = pick(WORDS), bad = range(2, 5);
        var dirs = DIRS.map(function (x) { return x[1]; }).filter(function (x) { return x !== d[1]; });
        var boxes = [
          ["process", "Point in direction " + (bad === 2 ? pick(dirs) : d[1])],
          ["process", "Move " + (bad === 3 ? n + pick([10, 20, -10]) : n) + " steps"],
          say(bad === 4 ? pick(WORDS.filter(function (x) { return x !== w; })) : w),
          ["process", "Move " + (bad === 5 ? m + pick([10, 20]) : m) + " steps"]
        ];
        var flow = FC.line(boxes); flow.numbered = true;
        var should = ["", "", "Point in direction " + d[1], "Move " + n + " steps", "Say \"" + w + "\"", "Move " + m + " steps"][bad];
        return { flow: flow, prompt: "It should: face " + d[0] + ", move " + n + " steps, say \"" + w + "\", then move " + m + " more steps. One box is wrong. Type its number.",
          answer: bad, re: numRe(bad), wrong: others(bad, [1, 2, 3, 4, 5, 6]),
          steps: ["Check each box against what it should do, one at a time.", "Box " + bad + " says " + boxes[bad - 2][1] + ". It should say: " + should + "."],
          working: ["Skip Start. Check the boxes one at a time, from the top.", "Right is 90, left is -90, up is 0, down is 180."],
          note: "Box " + bad + " should be: " + should + "." };
      }),
      card("x-loop-steps", "x-l12", function () {
        var k = pick([["Right arrow", 90], ["Left arrow", -90], ["Up arrow", 0], ["Down arrow", 180]]), step = pick([5, 15, 20, 25]);
        var n = range(5, 6), presses = [];
        for (var i = 0; i < n; i++) presses.push(Math.random() < 0.55 ? 1 : 0);
        if (presses.indexOf(1) < 0) presses[0] = 1;
        if (presses.indexOf(0) < 0) presses[n - 1] = 0;
        var flow = keyLoop(k[0], k[1], step), r = FC.run(flow, { presses: presses });
        var count = presses.filter(Boolean).length;
        return { flow: flow, prompt: "The key is checked " + n + " times: " + presses.map(keyWord).join(", ") + ". How many steps does the sprite move?",
          answer: r.steps, re: numRe(r.steps, "steps?"), wrong: others(r.steps, [step * n, step * (count + 1), step * (n - count), r.steps + step, step]), steps: r.trace,
          working: ["Pressed follows True: Point, then Move once.", "Not pressed follows False: straight back, no move. Count the presses, then multiply."],
          note: count + " presses x " + step + " steps = " + r.steps + " steps." };
      }),
      card("x-point-box", "x-l12", function () {
        var d = pick(DIRS), key = d[0].charAt(0).toUpperCase() + d[0].slice(1) + " arrow";
        var flow = keyLoop(key, "?", 10); flow.nodes[2].text = "?"; flow.numbered = true;
        return { flow: flow, prompt: "It should move the sprite " + d[0] + " when the " + key.toLowerCase() + " is pressed. Write the whole of box 3.",
          answer: "Point in direction " + d[1],
          re: new RegExp("^\\s*point\\s+in\\s+direction\\s*:?\\s*" + (d[1] < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(d[1]) + "(\\s*degrees?)?\\s*$", "i"),
          wrong: DIRS.filter(function (x) { return x[1] !== d[1]; }).map(function (x) { return "Point in direction " + x[1]; }),
          steps: ["Box 3 sets the direction before the sprite moves.", "Facing " + d[0] + " is " + d[1] + ", so box 3 is Point in direction " + d[1] + "."],
          working: ["Use the words Point in direction, then a number.", "Right is 90 and up is 0. Left is the opposite of right. Down is the opposite of up."],
          note: "Box 3 is Point in direction " + d[1] + "." };
      }),

      // ================= Lesson 3
      card("x-andor-say", "x-l3", function () {
        var t = pick([["Up", "Right", "Diagonal", "Straight"], ["Space", "Enter", "Pause", "Play"], ["Left", "Down", "Slide", "Stand"]]);
        var op = pick(["AND", "OR"]), a = range(0, 1), b = range(0, 1);
        var flow = branch(t[0] + " " + op + " " + t[1] + " pressed?", say(t[2]), say(t[3]));
        var keys = {}; keys[t[0]] = a; keys[t[1]] = b;
        var r = FC.run(flow, { keys: keys }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + keyWord(a) + ". " + t[1] + " is " + keyWord(b) + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"],
          steps: [t[0] + " is " + a + ". " + t[1] + " is " + b + ".", r.trace[1], "Say \"" + ans + "\"."],
          working: ["Write 1 for pressed and 0 for not pressed.", "AND is 1 only when both are 1. OR is 1 when at least one is 1. 1 follows True, 0 follows False."],
          note: r.trace[1] };
      }),
      card("x-not-arrow", "x-l3", function () {
        var key = pick(["Up", "Space", "Right", "Enter"]), v = range(0, 1);
        var flow = branch("NOT " + key + " pressed?", say("Wait"), say("Go"));
        var keys = {}; keys[key] = v;
        var r = FC.run(flow, { keys: keys }), ans = r.said[0] === "Wait" ? "True" : "False";
        return { flow: flow, prompt: key + " is " + keyWord(v) + ". Which arrow does the decision follow, True or False?", answer: ans,
          re: new RegExp("^\\s*(the\\s+)?" + ans + "(\\s+arrow)?\\s*$", "i"), wrong: [ans === "True" ? "False" : "True", "Both", "Neither"],
          steps: [key + " is " + v + ".", r.trace[1], "So it follows the " + ans + " arrow."],
          working: ["Write 1 for pressed and 0 for not pressed.", "NOT swaps the value. A decision that is 1 follows one arrow; 0 follows the other."],
          note: r.trace[1] };
      }),
      card("x-compare-say", "x-l3", function () {
        var t = pick([["Score", "Target", "Win", "Try again"], ["Coins", "Price", "Buy", "Save up"], ["Points", "Goal", "Level up", "Keep going"]]);
        var op = pick([">", "<", "=", "<>"]), a = range(10, 40), b = pick([a, a, a + range(1, 5), a - range(1, 5)]);
        var flow = branch(t[0] + " " + op + " " + t[1] + "?", say(t[2]), say(t[3]));
        var vals = {}; vals[t[0]] = a; vals[t[1]] = b;
        var r = FC.run(flow, { values: vals }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + a + ". " + t[1] + " is " + b + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"],
          steps: [r.trace[1], "Say \"" + ans + "\"."],
          working: ["Put the two numbers into the question. Is it 1 or 0?", "> bigger than, < smaller than, = the same, <> not the same. Check equal numbers carefully."],
          note: r.trace[1] };
      }),

      // ================= Lesson 4
      card("x-call-steps", "x-l4", function () {
        var m, k, extra;
        do { m = range(10, 40, 10); k = range(2, 3); extra = range(10, 30, 10); } while (m * k + extra === 90);
        var name = pick(["DrawSide", "Step", "Hop"]);
        var sub = FC.line([["process", "Move " + m + " steps"], ["process", "Turn right 90 degrees"]]);
        var boxes = []; for (var i = 0; i < k; i++) boxes.push(["call", "CALL " + name]);
        boxes.splice(1, 0, ["process", "Move " + extra + " steps"]);
        var flow = withSub(FC.line(boxes), name, sub), r = FC.run(flow, {});
        return { flow: flow, prompt: "How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
          wrong: others(r.steps, [m * k, m + extra, r.steps + m, m * (k + 1) + extra]), steps: r.trace,
          working: ["Each CALL runs every box in the sub-routine once.", "Add the steps from every CALL, then the Move box in Main."],
          note: name + " moves " + m + " steps and is CALLed " + k + " times, plus " + extra + " steps in Main: " + r.steps + " steps." };
      }),
      card("x-call-order", "x-l4", function () {
        var w = words(4), name = pick(["Beep", "Greet", "Signal"]);
        var sub = FC.line([say(w[0]), say(w[1])]);
        var flow = withSub(FC.line([say(w[2]), ["call", "CALL " + name], say(w[3]), ["call", "CALL " + name]]), name, sub);
        var r = FC.run(flow, {}), ans = r.said.join(", ");
        return { flow: flow, prompt: "Write everything the sprite says, in order.", answer: ans, re: orderRe(r.said),
          wrong: [[w[2], w[0], w[1], w[3]].join(", "), [w[2], w[3], w[0], w[1]].join(", "), [w[2], w[0], w[1], w[3], w[0]].join(", ")],
          steps: r.trace,
          working: ["Follow Main. At each CALL, go through the whole sub-routine, then come back just after the CALL.", "Write each Say as you reach it. Count how many words you should have."],
          note: "In order: " + ans + "." };
      }),
      card("x-call-next", "x-l4", function () {
        var w = words(3), name = pick(["Wave", "Flash", "Spin"]), m = range(20, 40, 10);
        if (w.indexOf(name) >= 0) w[w.indexOf(name)] = "Ok";
        var sub = FC.line([say(w[0]), ["process", "Move 10 steps"]]);
        var mid = Math.random() < 0.5 ? ["process", "Move " + m + " steps"] : say(w[1]);
        var flow = withSub(FC.line([say(w[2]), ["call", "CALL " + name], mid, ["call", "CALL " + name]]), name, sub);
        var r = FC.run(flow, {});
        var mm = /^Move (\d+) steps$/.exec(mid[1]), ss = /^Say "(.*)"$/.exec(mid[1]);
        return { flow: flow, prompt: name + " reaches its End the first time. Which box in Main runs next? Write the whole box.", answer: mid[1],
          re: mm ? moveRe(mm[1]) : sayRe(ss[1]), wrong: ["Say \"" + w[2] + "\"", "CALL " + name, "Start"],
          steps: ["Main runs Say \"" + w[2] + "\", then CALL " + name + ".", name + " runs from its own Start to its End.", "Main carries on just after the first CALL: " + mid[1] + "."],
          working: ["When a sub-routine ends, Main carries on just after the CALL, not at Main's Start.", "Find the first CALL in Main. Write the box just after it."],
          note: "After " + name + " ends, Main carries on with " + mid[1] + "." };
      })
    ];
  })()
});
