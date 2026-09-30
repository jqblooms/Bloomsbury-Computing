// Year 7: Revision 1, Reading Flowcharts (before the Term 1 exam)
// Loaded by Drills/index.html?drill=y7-revision-1
// Lessons 1 and 2 only: the four symbols, reading a flowchart from Start to End, finding and fixing a wrong or
// missing box, and key-press loops (direction numbers, True and False arrows, counting steps). Typed answers,
// short sentences (most of the class are EAL learners), fresh values on every draw. Every answer comes from
// running the card's own flowchart (Drills/flowchart-core.js). The class race "Flowchart Race: Revision 1" runs
// this file itself.
DrillData.register("y7-revision-1", {
  title: "Year 7: Revision 1, Reading Flowcharts",
  subtitle: "Symbols, reading, fixing and key-press loops",
  categories: [
    ["r1-symbols", "Symbols"],
    ["r1-read", "Reading a Flowchart"],
    ["r1-fix", "Fixing a Flowchart"],
    ["r1-loops", "Key-Press Loops"]
  ],
  cards: (function () {
    var FC = FlowchartCore;
    var WORDS = ["Hello", "Ready", "Go", "Done", "Hi", "Stop", "Yes", "Bye", "Wave", "Jump"];
    var DIRS = [["right", 90], ["left", -90], ["up", 0], ["down", 180]];

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function range(a, b, step) { return drillRange(a, b, step); }
    function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }
    function words(n) { return shuffled(WORDS).slice(0, n); }
    function numRe(n, unit) {
      var body = (n < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(n);
      return new RegExp("^\\s*(box\\s*)?" + body + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*$", "i");
    }
    function wordRe(w) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"); }
    function others(ans, list) { return drillWrongNumbers(ans, list.filter(function (v) { return v !== ans; }), 3); }

    function keyLoop(key, dir, step) {
      return { nodes: [
        { id: "s", type: "terminal", text: "Start" },
        { id: "d", type: "decision", text: key + " pressed?" },
        { id: "p", type: "process", text: "Point in direction " + dir },
        { id: "m", type: "process", text: "Move " + step + " steps" }
      ], edges: [
        { from: "s", to: "d", label: null }, { from: "d", to: "p", label: "True" }, { from: "p", to: "m", label: null },
        { from: "m", to: "d", label: null }, { from: "d", to: "d", label: "False" }
      ] };
    }

    // As in the Year 7 recap drill: `example` is another draw of the same kind, with a different answer that
    // appears nowhere in it, worked through step by step.
    function card(id, category, gen) {
      return { id: id, category: category, randomize: function () {
        var c = gen(), ex = null;
        var mentions = new RegExp("(^|[^a-z0-9])" + String(c.answer).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])");
        for (var i = 0; i < 60 && !ex && c.steps.length; i++) {
          var e = gen();
          var text = ((e.flow ? FC.describe(e.flow) : "") + " " + e.prompt + " " + e.steps.join(" ")).toLowerCase();
          if (String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || !mentions.test(text))) ex = e;
        }
        var example = !ex ? null : (ex.flow ? "A similar flowchart: " + FC.describe(ex.flow) + "\n" : "A similar question:\n") +
          ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer;
        return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
          flow: c.flow, example: example, working: c.working, note: c.note, trace: c.steps };
      } };
    }

    var SYMBOL = {
      terminal: ["Start/End", /^\s*(an?\s+)?(start\s*(\/|or|and)?\s*end|terminal|terminator|rounded(\s+box)?)(\s+(symbol|shape|box))?\s*$/i],
      process: ["Process", /^\s*(an?\s+)?(process|rectangle)(\s+(symbol|shape|box))?\s*$/i],
      io: ["Input or output", /^\s*(an?\s+)?(input\s*(or|\/|and)?\s*output|output|input|sloping|parallelogram)(\s+(symbol|shape|box))?\s*$/i],
      decision: ["Decision", /^\s*(an?\s+)?(decision|diamond)(\s+(symbol|shape|box))?\s*$/i]
    };
    var LOOK = { terminal: "a rounded box", process: "a rectangle", io: "a sloping box", decision: "a diamond" };
    var JOBS = [
      ["Move 30 steps", "process"], ["Point in direction 90", "process"], ["Turn right 90 degrees", "process"],
      ["Say \"Hello\"", "io"], ["Say \"Go\"", "io"],
      ["Space pressed?", "decision"], ["Right arrow pressed?", "decision"],
      ["Start", "terminal"], ["End", "terminal"]
    ];

    return [
      // ================= Symbols
      card("r1-symbol-box", "r1-symbols", function () {
        var w = words(2), n = range(10, 50, 10), k = pick(["Right arrow", "Space", "Up arrow"]);
        var flow = { nodes: [
          { id: "s", type: "terminal", text: "Start" }, { id: "m", type: "process", text: "Move " + n + " steps" },
          { id: "d", type: "decision", text: k + " pressed?" }, { id: "t", type: "io", text: "Say \"" + w[0] + "\"" },
          { id: "e", type: "terminal", text: "End" }, { id: "f", type: "io", text: "Say \"" + w[1] + "\"" }
        ], edges: [
          { from: "s", to: "m", label: null }, { from: "m", to: "d", label: null }, { from: "d", to: "t", label: "True" },
          { from: "d", to: "f", label: "False" }, { from: "t", to: "e", label: null }, { from: "f", to: "e", label: null }
        ], numbered: true };
        var i = range(0, flow.nodes.length - 1), b = flow.nodes[i], sym = SYMBOL[b.type];
        return { flow: flow, prompt: "What is the name of the symbol for box " + (i + 1) + "?", answer: sym[0], re: sym[1],
          wrong: ["Process", "Input or output", "Decision", "Start/End"].filter(function (x) { return x !== sym[0]; }),
          steps: ["Box " + (i + 1) + " is " + LOOK[b.type] + ".", "That symbol is: " + sym[0] + "."],
          working: ["Look at the shape of the box, not the words inside.", "Rounded, rectangle, sloping or diamond?"],
          note: "Box " + (i + 1) + " is " + LOOK[b.type] + ": " + sym[0] + "." };
      }),
      card("r1-symbol-job", "r1-symbols", function () {
        var j = pick(JOBS), sym = SYMBOL[j[1]];
        return { prompt: "A box says: " + j[0] + ". Which symbol does it need?", answer: sym[0], re: sym[1],
          wrong: ["Process", "Input or output", "Decision", "Start/End"].filter(function (x) { return x !== sym[0]; }),
          steps: [j[0] + (j[1] === "process" ? " is an instruction." : j[1] === "io" ? " shows a message." : j[1] === "decision" ? " is a question." : " is where the flowchart begins or stops."),
            "So it needs " + LOOK[j[1]] + ": " + sym[0] + "."],
          working: ["Is it an instruction, a message, a question, or the beginning or end?", "Each of those has its own shape. Which shape is it?"],
          note: j[0] + " goes in " + LOOK[j[1]] + ": " + sym[0] + "." };
      }),
      card("r1-shape-wrong", "r1-symbols", function () {
        var d = pick(DIRS), n = range(20, 80, 10), w = pick(WORDS);
        var boxes = [["process", "Point in direction " + d[1]], ["process", "Move " + n + " steps"], ["io", "Say \"" + w + "\""]];
        var i = range(0, 2), right = boxes[i][0], wrongShape = right === "io" ? "process" : "io";
        boxes[i] = [wrongShape, boxes[i][1]];
        var flow = FC.line(boxes); flow.numbered = true;
        var num = i + 2;
        return { flow: flow, prompt: "One box has the wrong shape. Type its number.", answer: num, re: numRe(num), wrong: others(num, [1, 2, 3, 4, 5]),
          steps: ["Move and Point are instructions: rectangle. Say is a message: sloping box.", "Box " + num + " (" + boxes[i][1] + ") should be " + LOOK[right] + "."],
          working: ["Say what each box does.", "Then check its shape matches that job."],
          note: "Box " + num + " should be " + LOOK[right] + "." };
      }),

      // ================= Reading a flowchart
      card("r1-steps", "r1-read", function () {
        var a = range(10, 50, 10), b = range(10, 50, 10), c = range(10, 50, 10), w = pick(WORDS);
        var flow = FC.line([["process", "Move " + a + " steps"], ["io", "Say \"" + w + "\""], ["process", "Move " + b + " steps"], ["process", "Move " + c + " steps"]]);
        var r = FC.run(flow, {});
        return { flow: flow, prompt: "How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
          wrong: others(r.steps, [a + b, b + c, r.steps + 10, a]), steps: r.trace,
          working: ["Find every Move box.", "Add their numbers. Say boxes do not move the sprite."],
          note: a + " + " + b + " + " + c + " = " + r.steps + " steps." };
      }),
      card("r1-say", "r1-read", function () {
        var w = words(3), a = range(10, 50, 10), which = pick(["first", "last"]);
        var flow = FC.line([["process", "Move " + a + " steps"], ["io", "Say \"" + w[0] + "\""], ["io", "Say \"" + w[1] + "\""], ["process", "Move " + a + " steps"], ["io", "Say \"" + w[2] + "\""]]);
        var r = FC.run(flow, {}), ans = which === "first" ? r.said[0] : r.said[r.said.length - 1];
        return { flow: flow, prompt: "What does the sprite say " + which + "?", answer: ans, re: wordRe(ans),
          wrong: w.filter(function (x) { return x !== ans; }).concat(["Move"]), steps: r.trace,
          working: ["Start at Start. Follow the arrows.", "Only the Say boxes are messages."],
          note: "The " + which + " Say box is \"" + ans + "\"." };
      }),
      card("r1-say-after", "r1-read", function () {
        var w = words(3), a = range(10, 40, 10), b = a + 10;
        var flow = FC.line([["io", "Say \"" + w[0] + "\""], ["process", "Move " + a + " steps"], ["io", "Say \"" + w[1] + "\""], ["process", "Move " + b + " steps"], ["io", "Say \"" + w[2] + "\""]]);
        var r = FC.run(flow, {});
        return { flow: flow, prompt: "What does the sprite say straight after it moves " + a + " steps?", answer: w[1], re: wordRe(w[1]),
          wrong: [w[0], w[2], "Move"], steps: r.trace,
          working: ["Find the box Move " + a + " steps.", "Follow its arrow to the next box."],
          note: "The box after Move " + a + " steps is Say \"" + w[1] + "\"." };
      }),

      // ================= Fixing a flowchart
      card("r1-wrong-box", "r1-fix", function () {
        var d = pick(DIRS), n = range(20, 90, 10), w = pick(WORDS), bad = range(2, 4);
        var dirs = DIRS.map(function (x) { return x[1]; }).filter(function (x) { return x !== d[1]; });
        var boxes = [
          ["process", "Point in direction " + (bad === 2 ? pick(dirs) : d[1])],
          ["process", "Move " + (bad === 3 ? pick([n - 10, n + 10, n * 2]) : n) + " steps"],
          ["io", "Say \"" + (bad === 4 ? pick(WORDS.filter(function (x) { return x !== w; })) : w) + "\""]
        ];
        var flow = FC.line(boxes); flow.numbered = true;
        var should = ["", "", "Point in direction " + d[1], "Move " + n + " steps", "Say \"" + w + "\""][bad];
        return { flow: flow, prompt: "It should: face " + d[0] + ", move " + n + " steps, then say \"" + w + "\". One box is wrong. Type its number.",
          answer: bad, re: numRe(bad), wrong: others(bad, [1, 2, 3, 4, 5]),
          steps: ["Check each box against what it should do.", "Box " + bad + " should be: " + should + "."],
          working: ["Check the boxes one at a time.", "Right is 90, left is -90, up is 0, down is 180."],
          note: "Box " + bad + " should be: " + should + "." };
      }),
      card("r1-correct-box", "r1-fix", function () {
        var d = pick(DIRS), n = range(20, 90, 10), w = pick(WORDS), bad = pick(["move", "point"]);
        var dirs = DIRS.map(function (x) { return x[1]; }).filter(function (x) { return x !== d[1]; });
        var boxes = [
          ["process", "Point in direction " + (bad === "point" ? pick(dirs) : d[1])],
          ["process", "Move " + (bad === "move" ? pick([n - 10, n + 10]) : n) + " steps"],
          ["io", "Say \"" + w + "\""]
        ];
        var flow = FC.line(boxes); flow.numbered = true;
        var box = bad === "point" ? 2 : 3;
        var ans = bad === "point" ? "Point in direction " + d[1] : "Move " + n + " steps";
        var re = bad === "point"
          ? new RegExp("^\\s*point\\s+in\\s+direction\\s*:?\\s*" + (d[1] < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(d[1]) + "(\\s*degrees?)?\\s*$", "i")
          : new RegExp("^\\s*move\\s*:?\\s*" + n + "(\\s*steps?)?\\s*$", "i");
        return { flow: flow, prompt: "It should: face " + d[0] + ", move " + n + " steps, then say \"" + w + "\". Box " + box + " is wrong. Write the correct box " + box + ".",
          answer: ans, re: re, wrong: [boxes[box - 2][1], bad === "point" ? "Point in direction " + (d[1] === 90 ? 180 : 90) : "Move " + (n + 20) + " steps", "Say \"" + w + "\""],
          steps: ["Box " + box + " says: " + boxes[box - 2][1] + ".", "It should say: " + ans + "."],
          working: ["Read what the flowchart should do.", bad === "point" ? "Right is 90, left is -90, up is 0, down is 180." : "How many steps should it move?"],
          note: "Box " + box + " should be: " + ans + "." };
      }),
      card("r1-missing", "r1-fix", function () {
        var n = range(20, 90, 10), w = pick(WORDS), missing = pick(["say", "move"]);
        var flow = missing === "say" ? FC.line([["process", "Move " + n + " steps"]]) : FC.line([["io", "Say \"" + w + "\""]]);
        var ans = missing === "say" ? "Say \"" + w + "\"" : "Move " + n + " steps";
        var re = missing === "say" ? new RegExp("^\\s*say\\s*:?\\s*[\"'\\u201c]?\\s*" + w + "\\s*[\"'\\u201d]?\\s*$", "i")
          : new RegExp("^\\s*move\\s*:?\\s*" + n + "(\\s*steps?)?\\s*$", "i");
        var should = missing === "say" ? "move " + n + " steps, then say \"" + w + "\"" : "say \"" + w + "\", then move " + n + " steps";
        return { flow: flow, prompt: "It should " + should + ". One box is missing. Type the missing box.",
          answer: ans, re: re, wrong: [missing === "say" ? "Move " + n + " steps" : "Say \"" + w + "\"", "End", "Start"],
          steps: ["Tick off each part of what it should do.", "The part with no box is: " + ans + "."],
          working: ["Read what it should do, one part at a time.", "Which part has no box?"],
          note: "The missing box is " + ans + "." };
      }),

      // ================= Key-press loops
      card("r1-direction", "r1-loops", function () {
        var d = pick(DIRS), key = d[0].charAt(0).toUpperCase() + d[0].slice(1) + " arrow";
        var flow = keyLoop(key, "?", 10);
        return { flow: flow, prompt: "It should move the sprite " + d[0] + ". What number replaces the ?", answer: d[1], re: numRe(d[1], "degrees?"),
          wrong: others(d[1], DIRS.map(function (x) { return x[1]; }).concat([270])),
          steps: ["The sprite must face " + d[0] + " first.", "Facing " + d[0] + " is " + d[1] + "."],
          working: {
            right: ["Facing up is 0.", "Turning clockwise from up makes the number bigger."],
            left: ["Facing right is 90.", "Left is the opposite way to right, so the number is negative."],
            up: ["Facing right is 90.", "Up is a quarter turn back from right."],
            down: ["Facing right is 90.", "Down is another quarter turn clockwise from right."]
          }[d[0]],
          note: "Facing " + d[0] + " is " + d[1] + "." };
      }),
      card("r1-presses", "r1-loops", function () {
        var k = pick([["Right arrow", 90], ["Left arrow", -90], ["Up arrow", 0], ["Down arrow", 180]]), step = pick([5, 10, 20]);
        var n = range(3, 5), presses = [];
        for (var i = 0; i < n; i++) presses.push(Math.random() < 0.6 ? 1 : 0);
        if (presses.indexOf(1) < 0) presses[0] = 1;
        if (presses.indexOf(0) < 0) presses[n - 1] = 0;
        var flow = keyLoop(k[0], k[1], step);
        var r = FC.run(flow, { presses: presses });
        var list = presses.map(function (p) { return p ? "pressed" : "not pressed"; }).join(", ");
        var count = presses.filter(Boolean).length;
        return { flow: flow, prompt: "The key is checked " + n + " times: " + list + ". How many steps does the sprite move?",
          answer: r.steps, re: numRe(r.steps, "steps?"), wrong: others(r.steps, [step * n, step, step * (count + 1)]), steps: r.trace,
          working: ["Pressed: the True arrow runs Move once.", "Not pressed: the False arrow. No move."],
          note: "Pressed " + count + " times x " + step + " steps = " + r.steps + " steps." };
      }),
      card("r1-false-next", "r1-loops", function () {
        var k = pick(["Right arrow", "Left arrow", "Up arrow", "Down arrow"]);
        var flow = keyLoop(k, 90, 10); flow.numbered = true;
        var which = pick(["False", "True"]);
        var ans = which === "False" ? 2 : 3;
        return { flow: flow, prompt: which === "False" ? "The key is not pressed. Which box number comes next?" : "The key is pressed. Which box number comes next?",
          answer: ans, re: numRe(ans), wrong: others(ans, [1, 2, 3, 4]),
          steps: [which === "False" ? "Not pressed: follow the False arrow." : "Pressed: follow the True arrow.", which === "False" ? "It goes back to box 2, to check the key again." : "It goes to box 3, Point in direction."],
          working: ["Pressed follows True. Not pressed follows False.", "Follow that arrow to the box it points to."],
          note: which === "False" ? "False goes back to box 2 to check again." : "True goes to box 3." };
      }),
      card("r1-why-back", "r1-loops", function () {
        var k = pick(["Right arrow", "Left arrow", "Up arrow"]);
        var flow = keyLoop(k, pick([90, -90, 0]), 10);
        return { flow: flow, prompt: "Why does the arrow from the Move box go back to the decision?", answer: "To check the key again",
          re: /^(?=.*\b(check|checks|checked|checking|again|repeat|repeats|keep|keeps|loop|loops)\b)(?=.*\b(key|keys|arrow|press|pressed|decision)\b).*$/i,
          wrong: ["To end the program", "To say Hello", "To change the direction"],
          steps: [],
          working: ["What would happen if the arrow went to End instead?", "The player may press the key again."],
          note: "It goes back so the key is checked again and again." };
      })
    ];
  })()
});
