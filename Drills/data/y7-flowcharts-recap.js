// Year 7: Flowcharts Recap (7CT.01 L5, the recap before the test)
// Loaded by Drills/index.html?drill=y7-flowcharts-recap
// Everything from L1 to L4, as real flowcharts drawn on the card (Drills/flowchart-core.js), with fresh values
// on every draw. Every answer and every worked example comes from running the flowchart, so what a card shows
// and what it marks always agree. Only Year 7's own blocks and words: Move, Turn, Point in direction, Say,
// decisions with True and False paths, keep-checking loops, AND / OR / NOT on 1 and 0, comparisons, and CALL.
// Help never gives the card's own answer: `example` is a similar flowchart worked through, `working` two nudges.
DrillData.register("y7-flowcharts-recap", {
  title: "Year 7: Flowcharts Recap",
  subtitle: "Reading flowcharts, inputs and loops, AND, OR, NOT and comparisons, and sub-routines",
  categories: [
    ["y7r-read", "Reading Flowcharts"],
    ["y7r-loops", "Inputs and Loops"],
    ["y7r-logic", "AND, OR, NOT and Comparisons"],
    ["y7r-sub", "Sub-routines"]
  ],
  cards: (function () {
    var FC = FlowchartCore;
    var WORDS = ["Hello", "Ready", "Go", "Finished", "Done", "Hi", "Stop", "Yes", "Bye", "Wave"];
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

    // A flowchart with one decision: True runs trueBoxes, False runs falseBoxes, both then reach End.
    function branch(before, question, trueBoxes, falseBoxes) {
      var nodes = [{ id: "s", type: "terminal", text: "Start" }], edges = [], prev = "s";
      before.forEach(function (b, i) { nodes.push({ id: "p" + i, type: b[0], text: b[1] }); edges.push({ from: prev, to: "p" + i, label: null }); prev = "p" + i; });
      nodes.push({ id: "d", type: "decision", text: question }); edges.push({ from: prev, to: "d", label: null });
      var t = "t0", f = "f0";
      trueBoxes.forEach(function (b, i) { nodes.push({ id: "t" + i, type: b[0], text: b[1] }); if (i) edges.push({ from: "t" + (i - 1), to: "t" + i, label: null }); });
      nodes.push({ id: "e", type: "terminal", text: "End" });
      falseBoxes.forEach(function (b, i) { nodes.push({ id: "f" + i, type: b[0], text: b[1] }); if (i) edges.push({ from: "f" + (i - 1), to: "f" + i, label: null }); });
      edges.push({ from: "d", to: t, label: "True" }, { from: "d", to: f, label: "False" });
      edges.push({ from: "t" + (trueBoxes.length - 1), to: "e", label: null }, { from: "f" + (falseBoxes.length - 1), to: "e", label: null });
      return { nodes: nodes, edges: edges };
    }

    // Year 7's keyboard loop: keep checking a key; True points and moves, then both paths go back to the check.
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

    /**
     * A card from a generator: gen() returns { flow, opts, prompt, answer, re, wrong, working, note }. The worked
     * example is another draw of the same kind with a different answer (and none of this card's words), run
     * through the flowchart and written out step by step.
     */
    function card(id, category, gen) {
      return { id: id, category: category, randomize: function () {
        var c = gen(), ex = null, exSteps = null;
        var mentions = new RegExp("(^|[^a-z0-9])" + String(c.answer).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])");
        // Running totals ("moved 80 steps so far") can pass through this card's answer; the second pass leaves them out.
        [function (s) { return s; }, function (s) { return s.replace(/ The sprite has moved \d+ steps so far\./, ""); }].forEach(function (tidy) {
          for (var i = 0; i < 60 && !ex; i++) {
            var e = gen(), st = e.steps.map(tidy);
            var text = ((e.flow ? FC.describe(e.flow) : "") + " " + e.prompt + " " + st.join(" ")).toLowerCase();
            // (A one- or two-character answer, like 1 or 0, is everywhere; only a different answer is needed then.)
            if (String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || !mentions.test(text))) { ex = e; exSteps = st; }
          }
        });
        var example = !ex ? null : (ex.flow ? "A similar flowchart: " + FC.describe(ex.flow) + "\n" : "A similar question:\n") +
          ex.prompt + "\n" + exSteps.join("\n") + "\nAnswer: " + ex.answer;
        return {
          prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
          flow: c.flow, example: example, working: c.working, note: c.note,
          trace: c.steps   // how this card's own flowchart runs: the class game shows it after a wrong answer
        };
      } };
    }

    // The name Year 7 gives each symbol, and the answers each accepts.
    var SYMBOL = {
      process: ["Process", /^\s*(an?\s+)?(process|rectangle)(\s+(symbol|shape|box))?\s*$/i],
      io: ["Input or output", /^\s*(an?\s+)?(input\s*(or|\/|and)?\s*output|output|input|sloping|parallelogram)(\s+(symbol|shape|box))?\s*$/i],
      decision: ["Decision", /^\s*(an?\s+)?(decision|diamond)(\s+(symbol|shape|box))?\s*$/i]
    };

    return [
      // ================= L1: reading flowcharts
      card("read-steps", "y7r-read", function () {
        var a = range(10, 60, 10), b = range(10, 60, 10), w = pick(WORDS);
        var flow = FC.line([["process", "Move " + a + " steps"], ["io", "Say \"" + w + "\""], ["process", "Move " + b + " steps"]]);
        var r = FC.run(flow, {});
        return { flow: flow, prompt: "How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
          wrong: others(r.steps, [a, b, r.steps + 10, Math.max(a, b) * 2]), steps: r.trace,
          working: ["Find every Move box and add up their numbers.", "A Say box shows a message; it does not move the sprite."],
          note: a + " + " + b + " = " + r.steps + " steps." };
      }),
      card("read-say", "y7r-read", function () {
        var w = words(3), a = range(10, 50, 10), which = pick(["first", "last"]);
        var flow = FC.line([["io", "Say \"" + w[0] + "\""], ["process", "Move " + a + " steps"], ["io", "Say \"" + w[1] + "\""], ["io", "Say \"" + w[2] + "\""]]);
        var r = FC.run(flow, {}), ans = which === "first" ? r.said[0] : r.said[r.said.length - 1];
        return { flow: flow, prompt: "What does the sprite say " + which + "?", answer: ans, re: wordRe(ans),
          wrong: w.filter(function (x) { return x !== ans; }).concat(["Move"]), steps: r.trace,
          working: ["Begin at Start and follow the arrows in order.", "Only the Say boxes are messages."],
          note: "Following the arrows, the " + which + " Say box is \"" + ans + "\"." };
      }),
      card("fix-requirement", "y7r-read", function () {
        var d = pick(DIRS), n = range(20, 90, 10), w = pick(WORDS), bad = range(2, 4);
        var dirs = DIRS.map(function (x) { return x[1]; }).filter(function (x) { return x !== d[1]; });
        var boxes = [
          ["process", "Point in direction " + (bad === 2 ? pick(dirs) : d[1])],
          ["process", "Move " + (bad === 3 ? pick([n - 10, n + 10, n * 2]) : n) + " steps"],
          ["io", "Say \"" + (bad === 4 ? pick(WORDS.filter(function (x) { return x !== w; })) : w) + "\""]
        ];
        var flow = FC.line(boxes); flow.numbered = true;
        var should = ["", "", "Point in direction " + d[1], "Move " + n + " steps", "Say \"" + w + "\""][bad];
        return { flow: flow, prompt: "This flowchart should make the sprite face " + d[0] + ", move " + n + " steps, then say \"" + w + "\". One box is wrong. Type the number of the wrong box.",
          answer: bad, re: numRe(bad), wrong: others(bad, [1, 2, 3, 4, 5]),
          steps: ["Check each box against what the flowchart should do.", "Box " + bad + " should say: " + should + "."],
          working: ["Compare each box with the requirement, one at a time.", "Facing right is 90, left is -90, up is 0 and down is 180."],
          note: "Box " + bad + " is wrong. It should be: " + should + "." };
      }),
      card("fix-shape", "y7r-read", function () {
        var d = pick(DIRS), n = range(20, 80, 10), w = pick(WORDS);
        var boxes = [["process", "Point in direction " + d[1]], ["process", "Move " + n + " steps"], ["io", "Say \"" + w + "\""]];
        var i = range(0, 2), wrongShape = boxes[i][0] === "io" ? pick(["process", "decision"]) : pick(["io", "decision"]);
        var right = boxes[i][0];
        boxes[i] = [wrongShape, boxes[i][1]];
        var flow = FC.line(boxes); flow.numbered = true;
        var num = i + 2, name = { process: "a rectangle (a process)", io: "a sloping input or output shape", decision: "a diamond (a decision)" };
        return { flow: flow, prompt: "One box in this flowchart is drawn with the wrong shape for what it does. Type its number.",
          answer: num, re: numRe(num), wrong: others(num, [1, 2, 3, 4, 5]),
          steps: ["Rounded: Start and End. Rectangle: an instruction such as Move or Point. Sloping: a message in or out, such as Say. Diamond: a question.",
            "Box " + num + " (" + boxes[i][1] + ") should be " + name[right] + ", not " + name[wrongShape] + "."],
          working: ["Say what each box does, then name the shape it needs.", "A diamond is only for a question with True and False paths."],
          note: "Box " + num + " (" + boxes[i][1] + ") should be " + name[right] + "." };
      }),

      card("fix-missing", "y7r-read", function () {
        var n = range(20, 90, 10), w = pick(WORDS);
        var flow = FC.line([["process", "Move " + n + " steps"]]);
        var ans = "Say \"" + w + "\"";
        return { flow: flow, prompt: "This flowchart should move the sprite " + n + " steps, then say \"" + w + "\". One instruction is missing. Type the missing instruction.",
          answer: ans, re: new RegExp("^\\s*say\\s*:?\\s*[\"'\\u201c]?\\s*" + w + "\\s*[\"'\\u201d]?\\s*$", "i"),
          wrong: ["Move " + n + " steps", "Say \"" + pick(WORDS.filter(function (x) { return x !== w; })) + "\"", "End"],
          steps: ["Start.", "Move " + n + " steps.", "End: nothing has been said yet.", "The missing box goes between Move and End: " + ans + "."],
          working: ["Read the requirement, then tick off each box that does part of it.", "What should happen after the sprite has moved?"],
          note: "Add " + ans + " after Move " + n + " steps." };
      }),
      card("symbol-name", "y7r-read", function () {
        var n = range(10, 50, 10), k = pick(["Right arrow", "Space", "Up arrow"]), w = words(2);
        var flow = branch([["process", "Move " + n + " steps"]], k + " pressed?", [["io", "Say \"" + w[0] + "\""]], [["io", "Say \"" + w[1] + "\""]]);
        flow.numbered = true;
        var boxes = flow.nodes.map(function (b, i) { return { b: b, num: i + 1 }; }).filter(function (x) { return SYMBOL[x.b.type]; });
        var pickBox = pick(boxes), sym = SYMBOL[pickBox.b.type];
        var look = { process: "a rectangle", io: "a sloping shape", decision: "a diamond" }[pickBox.b.type];
        return { flow: flow, prompt: "What is the name of the symbol used for box " + pickBox.num + "?", answer: sym[0], re: sym[1],
          wrong: ["Process", "Input or output", "Decision", "Start or End"].filter(function (x) { return x !== sym[0]; }),
          steps: ["Box " + pickBox.num + " (" + pickBox.b.text + ") is drawn as " + look + ".", "That symbol is called: " + sym[0] + "."],
          working: ["Look at the outline of the box, not the words inside it.", "Each outline shape has its own name."],
          note: "Box " + pickBox.num + " is " + look + ": the " + sym[0].toLowerCase() + " symbol." };
      }),

      // ================= L2: inputs, decisions and keep-checking loops
      card("key-moves", "y7r-loops", function () {
        var k = pick([["Right arrow", 90], ["Left arrow", -90], ["Up arrow", 0], ["Down arrow", 180]]), step = pick([5, 10, 20]);
        var n = range(4, 6), presses = [];
        for (var i = 0; i < n; i++) presses.push(Math.random() < 0.55 ? 1 : 0);
        if (presses.indexOf(1) < 0) presses[range(0, n - 1)] = 1;
        var flow = keyLoop(k[0], k[1], step);
        var r = FC.run(flow, { presses: presses });
        var list = presses.map(function (p) { return p ? "pressed" : "not pressed"; }).join(", ");
        var count = presses.filter(Boolean).length;
        return { flow: flow, prompt: "The " + k[0].toLowerCase() + " is checked " + n + " times: " + list + ". How many steps does the sprite move?",
          answer: r.steps, re: numRe(r.steps, "steps?"), wrong: others(r.steps, [step * n, step, step * (count + 1), step * (count - 1)]), steps: r.trace,
          working: ["Each time the key is pressed, the True path runs once.", "Count the presses, then use the number in the Move box."],
          note: "Pressed " + count + " times, " + step + " steps each time: " + r.steps + " steps." };
      }),
      card("key-direction", "y7r-loops", function () {
        var d = pick(DIRS), key = d[0].charAt(0).toUpperCase() + d[0].slice(1) + " arrow";
        var flow = keyLoop(key, "?", 10);
        var hints = {
          right: ["Facing up is 0 degrees.", "Turning clockwise from up makes the number bigger."],
          left: ["Facing right is 90 degrees.", "Left is the opposite way to right, so the number is negative."],
          up: ["Facing right is 90 degrees.", "Up is a quarter turn back from right."],
          down: ["Facing right is 90 degrees.", "Down is another quarter turn clockwise from right."]
        };
        return { flow: flow, prompt: "This flowchart should move the sprite " + d[0] + " while the " + key.toLowerCase() + " is pressed. What number replaces the ? in the Point in direction box?",
          answer: d[1], re: numRe(d[1], "degrees?"), wrong: others(d[1], DIRS.map(function (x) { return x[1]; }).concat([270])),
          steps: ["To move " + d[0] + ", the sprite must face " + d[0] + " first.", "Facing " + d[0] + " is " + d[1] + "."],
          working: hints[d[0]],
          note: "Facing " + d[0] + " is " + d[1] + "." };
      }),

      card("loop-why", "y7r-loops", function () {
        var d = pick(DIRS), key = d[0].charAt(0).toUpperCase() + d[0].slice(1) + " arrow";
        var flow = keyLoop(key, d[1], pick([5, 10, 20]));
        return { flow: flow, prompt: "Why does the arrow from the Move box go back to the decision?",
          answer: "So the key is checked again and again",
          re: /^(?=.*\b(check|checks|checked|checking|again|repeat|repeats|repeating|keep|keeps|loop|loops)\b)(?=.*\b(key|keys|keyboard|input|pressed|press|arrow|decision)\b).*$/i,
          wrong: ["To end the program", "To move the sprite further", "To change the direction"],
          steps: ["After moving, the arrow goes back to the decision.", "So the key is checked again: the flowchart keeps checking until Stop is pressed. This is an infinite loop."],
          working: ["What would happen if that arrow went to End instead?", "Think about a player holding the key down."],
          note: "It goes back so the key is checked again and again: an infinite loop that keeps checking." };
      }),
      card("loop-false", "y7r-loops", function () {
        var d = pick(DIRS), key = d[0].charAt(0).toUpperCase() + d[0].slice(1) + " arrow", step = pick([5, 10, 20]);
        var flow = keyLoop(key, d[1], step);
        return { flow: flow, prompt: "The " + key.toLowerCase() + " is not pressed. Which box does the flowchart go to next?",
          answer: key + " pressed?",
          re: /^(?!.*\b(move|point|end|start)\b)(?=.*\b(decision|pressed|check|checks|again|same)\b).*$/i,
          wrong: ["Move " + step + " steps", "Point in direction " + d[1], "End"],
          steps: ["Not pressed, so the answer to the decision is False.", "The False arrow goes back to the same decision, so the key is checked again."],
          working: ["Follow the arrow labelled False.", "Where does that arrow end?"],
          note: "False goes back to the decision (" + key + " pressed?) to check again." };
      }),

      // ================= L3: AND, OR, NOT and comparisons
      card("and-or", "y7r-logic", function () {
        var t = pick([["Up", "Right", "Diagonal", "Straight"], ["Space", "Enter", "Paused", "Playing"], ["Left", "Down", "Slide", "Stand"]]);
        var op = pick(["AND", "OR"]), a = range(0, 1), b = range(0, 1);
        var q = t[0] + " " + op + " " + t[1] + " pressed?";
        var flow = branch([], q, [["io", "Say \"" + t[2] + "\""]], [["io", "Say \"" + t[3] + "\""]]);
        var keys = {}; keys[t[0]] = a; keys[t[1]] = b;
        var r = FC.run(flow, { keys: keys }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + a + " and " + t[1] + " is " + b + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"], steps: r.trace,
          working: [op === "AND" ? "AND is only 1 when both parts are 1." : "OR is 1 when at least one part is 1.", "1 follows the True arrow; 0 follows the False arrow."],
          note: r.trace[1] };
      }),
      card("not", "y7r-logic", function () {
        var t = pick([["Up", "Stand still", "Jump"], ["Space", "Walk", "Shoot"], ["Right", "Wait", "Move right"]]);
        var v = range(0, 1);
        var flow = branch([], "NOT " + t[0] + " pressed?", [["io", "Say \"" + t[1] + "\""]], [["io", "Say \"" + t[2] + "\""]]);
        var keys = {}; keys[t[0]] = v;
        var r = FC.run(flow, { keys: keys }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + v + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[1] ? t[2] : t[1], "True", "False"], steps: r.trace,
          working: ["NOT swaps the value: 1 becomes 0, and 0 becomes 1.", "Work out NOT first, then follow True or False."],
          note: r.trace[1] };
      }),
      card("compare", "y7r-logic", function () {
        var t = pick([["Score", "Target", "Win", "Try again"], ["Coins", "Price", "Buy", "Save up"], ["Speed", "Limit", "Slow down", "Keep going"]]);
        var op = pick([">", "<", "=", "<>"]), a = range(5, 30), b = pick([a, a + range(1, 6), a - range(1, 4)]);
        var flow = branch([], t[0] + " " + op + " " + t[1] + "?", [["io", "Say \"" + t[2] + "\""]], [["io", "Say \"" + t[3] + "\""]]);
        var vals = {}; vals[t[0]] = a; vals[t[1]] = b;
        var r = FC.run(flow, { values: vals }), ans = r.said[0];
        return { flow: flow, prompt: t[0] + " is " + a + " and " + t[1] + " is " + b + ". What does the sprite say?",
          answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"], steps: r.trace,
          working: ["Put the two numbers into the question, then decide: 1 or 0?", "> means bigger than, < smaller than, = the same, <> not the same."],
          note: r.trace[1] };
      }),

      card("logic-value", "y7r-logic", function () {
        var t = pick([["Up", "Right"], ["Space", "Enter"], ["Left", "Down"]]), op = pick(["AND", "OR", "NOT"]);
        var a = range(0, 1), b = range(0, 1), vals = {}, expr, given;
        vals[t[0]] = a; vals[t[1]] = b;
        if (op === "NOT") { expr = "NOT " + t[0]; given = t[0] + " is " + a + "."; }
        else { expr = t[0] + " " + op + " " + t[1]; given = t[0] + " is " + a + " and " + t[1] + " is " + b + "."; }
        var v = FC.evaluate(expr, vals), st = { trace: [] };
        var ans = String(v), other = String(1 - v);
        return { flow: null, prompt: given + " What is " + expr + ": 1 or 0?", answer: ans,
          re: new RegExp("^\\s*(" + ans + "|" + (v ? "true" : "false") + ")\\s*$", "i"), wrong: [other, "2", "Both"],
          steps: [op === "AND" ? "AND is 1 only when both parts are 1." : op === "OR" ? "OR is 1 when at least one part is 1." : "NOT swaps the value: 1 becomes 0 and 0 becomes 1.",
            given + " So " + expr + " is " + ans + "."],
          working: [op === "AND" ? "AND needs both parts to be 1." : op === "OR" ? "OR needs at least one part to be 1." : "NOT gives the opposite value.", "Put the values in, then decide."],
          note: expr + " is " + ans + "." };
      }),
      card("compare-value", "y7r-logic", function () {
        var op = pick([">", "<", "=", "<>"]), a = range(1, 12), b = pick([a, range(1, 12)]);
        var expr = "A " + op + " B", v = FC.evaluate(expr, { A: a, B: b }), ans = String(v);
        var mean = { ">": "bigger than", "<": "smaller than", "=": "the same as", "<>": "not the same as" }[op];
        return { flow: null, prompt: "A is " + a + " and B is " + b + ". What is " + expr + ": 1 or 0?", answer: ans,
          re: new RegExp("^\\s*(" + ans + "|" + (v ? "true" : "false") + ")\\s*$", "i"), wrong: [String(1 - v), "2", "Both"],
          steps: [op + " asks whether A is " + mean + " B.", a + " " + op + " " + b + " is " + ans + "."],
          working: ["Say the question in words: is A " + mean + " B?", "Yes is 1; no is 0."],
          note: a + " " + op + " " + b + " is " + ans + "." };
      }),

      // ================= L4: sub-routines
      card("call-say", "y7r-sub", function () {
        var w = words(3), name = pick(["Beep", "Greet", "Signal"]), calls = range(2, 3), after = Math.random() < 0.5;
        var sub = FC.line([["io", "Say \"" + w[0] + "\""], ["io", "Say \"" + w[1] + "\""]]);
        var boxes = [];
        for (var i = 0; i < calls; i++) boxes.push(["call", "CALL " + name]);
        if (after) boxes.push(["io", "Say \"" + w[2] + "\""]);
        var flow = FC.line(boxes); flow.subs = {}; flow.subs[name] = sub;
        var r = FC.run(flow, {}), kind = pick(["count", "last"]);
        if (kind === "count") {
          var n = r.said.filter(function (s) { return s === w[0]; }).length;
          return { flow: flow, prompt: "How many times is \"" + w[0] + "\" said altogether?", answer: n, re: numRe(n, "times?"),
            wrong: others(n, [1, calls + 1, n * 2, 4]), steps: r.trace,
            working: ["Each CALL runs the whole sub-routine once.", "Count the CALL boxes in Main."],
            note: name + " is CALLed " + calls + " times, and says \"" + w[0] + "\" once each time." };
        }
        var last = r.said[r.said.length - 1];
        return { flow: flow, prompt: "What is the very last thing the sprite says?", answer: last, re: wordRe(last),
          wrong: w.filter(function (x) { return x !== last; }).concat(["End"]), steps: r.trace,
          working: ["After a sub-routine's End, Main carries on from just after the CALL.", "Follow Main to its own End."],
          note: "The last Say to run is \"" + last + "\"." };
      }),
      card("call-steps", "y7r-sub", function () {
        // Never a total of 90: the sub-routine's "Turn right 90 degrees" would look like the answer.
        var m, k, extra;
        do { m = range(20, 50, 10); k = range(2, 4); extra = Math.random() < 0.5 ? range(10, 30, 10) : 0; } while (m * k + extra === 90);
        var sub = FC.line([["process", "Move " + m + " steps"], ["process", "Turn right 90 degrees"]]);
        var boxes = [];
        for (var i = 0; i < k; i++) boxes.push(["call", "CALL DrawSide"]);
        if (extra) boxes.splice(1, 0, ["process", "Move " + extra + " steps"]);
        var flow = FC.line(boxes); flow.subs = { DrawSide: sub };
        var r = FC.run(flow, {});
        return { flow: flow, prompt: "How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
          wrong: others(r.steps, [m, m * k + m, m + extra, r.steps + m]), steps: r.trace,
          working: ["Each CALL runs every box in the sub-routine once.", "Add the steps from every CALL, then any Move boxes in Main itself."],
          note: "DrawSide moves " + m + " steps and is CALLed " + k + " times" + (extra ? ", plus " + extra + " steps in Main" : "") + ": " + r.steps + " steps." };
      }),
      card("call-return", "y7r-sub", function () {
        var w = words(3), name = pick(["Beep", "Flash", "Signal"]);
        var sub = FC.line([["io", "Say \"" + w[2] + "\""], ["process", "Wait 1 second"]]);
        var flow = FC.line([["io", "Say \"" + w[0] + "\""], ["call", "CALL " + name], ["io", "Say \"" + w[1] + "\""]]);
        flow.subs = {}; flow.subs[name] = sub;
        var r = FC.run(flow, {});
        return { flow: flow, prompt: "What does the sprite say straight after " + name + " reaches its End?", answer: w[1], re: wordRe(w[1]),
          wrong: [w[0], w[2], "Start"], steps: r.trace,
          working: ["When a sub-routine ends, Main carries on.", "Main carries on from just after the CALL, not from its own Start."],
          note: "After " + name + "'s End, Main carries on just after the CALL: Say \"" + w[1] + "\"." };
      }),
      card("call-written", "y7r-sub", function () {
        var name = pick(["DrawSquare", "Beep", "Jump"]), k = range(2, 4);
        var sub = name === "DrawSquare" ? FC.line([["process", "Move 50 steps"], ["process", "Turn right 90 degrees"]]) : FC.line([["io", "Say \"" + name + "\""]]);
        var boxes = []; for (var i = 0; i < k; i++) boxes.push(["call", "CALL " + name]);
        var flow = FC.line(boxes); flow.subs = {}; flow.subs[name] = sub;
        return { flow: flow, prompt: "Main CALLs " + name + " " + k + " times. How many times is " + name + " written out in full?", answer: "1",
          re: /^\s*(1|one|once)(\s*times?)?\s*$/i, wrong: [String(k), String(k + 1), "0"],
          steps: ["A sub-routine is written as its own flowchart.", "Each CALL runs that same flowchart again, so it is never copied out."],
          working: ["Count the sub-routine flowcharts, not the CALL boxes.", "A CALL jumps to the sub-routine; it does not copy its boxes."],
          note: name + " is written out once and CALLed " + k + " times." };
      })
    ];
  })()
});
