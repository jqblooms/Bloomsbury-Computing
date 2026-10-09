    // ---- Year 6 Term 1: a small Scratch simulator and the revision drill's card kinds ----
    // tools/build_y6_term1_test.mjs copies this into Drills/data/y6-term1-revision.js and also uses the simulator
    // to work out and check every test answer. A script is a list of stacks; each stack is a list of blocks made
    // with B (below). Y6.text gives scratchblocks text (drawn on the card), Y6.plain gives one plain line per
    // block (the walk's code box), Y6.run plays events through it, and Y6.walk turns a run into a "Walk me
    // through it": a similar script with its own values, one block per step, the block highlighted and the
    // values shown after it. Help never gives the card's own answer.
    var Y6 = (function () {
      var B = {
        flag: function () { return { op: "flag" }; },
        key: function (k) { return { op: "key", k: k }; },
        click: function () { return { op: "click" }; },
        receive: function (m) { return { op: "receive", m: m }; },
        goto: function (x, y) { return { op: "goto", x: x, y: y }; },
        glide: function (s, x, y) { return { op: "glide", s: s, x: x, y: y }; },
        setx: function (v) { return { op: "setx", v: v }; },
        changex: function (v) { return { op: "changex", v: v }; },
        changey: function (v) { return { op: "changey", v: v }; },
        move: function (n) { return { op: "move", v: n }; },
        set: function (name, v) { return { op: "set", name: name, v: v }; },
        change: function (name, v) { return { op: "change", name: name, v: v }; },
        repeat: function (n, body) { return { op: "repeat", n: n, body: body }; },
        forever: function (body) { return { op: "forever", body: body }; },
        ifThen: function (c, body, els) { return { op: "if", c: c, body: body, els: els || null }; },
        say: function (t) { return { op: "say", t: t }; },
        wait: function (s) { return { op: "wait", s: s }; },
        costume: function (c) { return { op: "costume", c: c }; },
        next: function () { return { op: "next" }; },
        broadcast: function (m) { return { op: "broadcast", m: m }; },
        backdrop: function (b) { return { op: "backdrop", b: b }; },
        waitUntil: function (c) { return { op: "waituntil", c: c }; }
      };
      var C = {
        gt: function (name, n) { return { k: ">", name: name, n: n }; },
        lt: function (name, n) { return { k: "<", name: name, n: n }; },
        eq: function (name, n) { return { k: "=", name: name, n: n }; },
        touching: function (s) { return { k: "touching", s: s }; }
      };
      function condText(c, plain) {
        if (c.k === "touching") return "<touching [" + c.s + (plain ? "" : " v") + "] ?>";
        return "<(" + c.name + ") " + c.k + " (" + c.n + ")>";
      }
      function blockText(b, plain) {
        var v = plain ? "" : " v";
        switch (b.op) {
          case "flag": return "when flag clicked";
          case "key": return "when [" + b.k + v + "] key pressed";
          case "click": return "when this sprite clicked";
          case "receive": return "when I receive [" + b.m + v + "]";
          case "goto": return "go to x: (" + b.x + ") y: (" + b.y + ")";
          case "glide": return "glide (" + b.s + ") secs to x: (" + b.x + ") y: (" + b.y + ")";
          case "setx": return "set x to (" + b.v + ")";
          case "changex": return "change x by (" + b.v + ")";
          case "changey": return "change y by (" + b.v + ")";
          case "move": return "move (" + b.v + ") steps";
          case "set": return "set [" + b.name + v + "] to (" + b.v + ")";
          case "change": return "change [" + b.name + v + "] by (" + b.v + ")";
          case "repeat": return "repeat (" + b.n + ")";
          case "forever": return "forever";
          case "if": return "if " + condText(b.c, plain) + " then";
          case "say": return "say [" + b.t + "]";
          case "wait": return "wait (" + b.s + ") seconds";
          case "costume": return "switch costume to [" + b.c + v + "]";
          case "next": return "next costume";
          case "broadcast": return "broadcast [" + b.m + v + "]";
          case "backdrop": return "switch backdrop to [" + b.b + v + "]";
          case "waituntil": return "wait until " + condText(b.c, plain);
        }
        throw new Error("Y6 sim: no text for " + b.op);
      }
      // Lines for the stacks, blank line between stacks. Each block remembers its line (__i).
      function layout(stacks, plain) {
        var out = [];
        function add(list, depth) {
          list.forEach(function (b) {
            b.__i = out.length;
            out.push((plain ? new Array(depth + 1).join("  ") : "") + blockText(b, plain));
            if (b.body) {
              add(b.body, depth + 1);
              if (b.els) { out.push((plain ? new Array(depth + 1).join("  ") : "") + "else"); add(b.els, depth + 1); }
              out.push((plain ? new Array(depth + 1).join("  ") : "") + "end");
            }
          });
        }
        stacks.forEach(function (s, i) { if (i) out.push(""); add(s, 0); });
        return out;
      }
      function text(stacks) { return layout(stacks, false).join("\n"); }
      function plain(stacks) { return layout(stacks, true); }

      function test(c, st) {
        if (c.k === "touching") return st.touching === c.s;
        var a = Number(st.vars[c.name]);
        return c.k === ">" ? a > c.n : c.k === "<" ? a < c.n : a === c.n;
      }
      // init: {x, y, vars: {}, costumes: [], costume}. events: "flag", "click", {key: k}, {tick: true, touching: name}.
      function run(stacks, events, init) {
        init = init || {};
        var st = { x: init.x || 0, y: init.y || 0, vars: {}, costumes: init.costumes || [], ci: 0, said: "", backdrop: init.backdrop || "" };
        Object.keys(init.vars || {}).forEach(function (k) { st.vars[k] = init.vars[k]; });
        if (init.costume) st.ci = st.costumes.indexOf(init.costume);
        var trace = [], forevers = [], queue = [];
        function snap() {
          return { x: st.x, y: st.y, vars: JSON.parse(JSON.stringify(st.vars)), costume: st.costumes[st.ci], said: st.said, backdrop: st.backdrop };
        }
        function note(b, info) { trace.push({ b: b, info: info || {}, st: snap() }); }
        function exec(list, pass) {
          for (var i = 0; i < list.length; i++) {
            var b = list[i], before;
            switch (b.op) {
              case "goto": st.x = b.x; st.y = b.y; note(b, { pass: pass }); break;
              case "glide": st.x = b.x; st.y = b.y; note(b, { pass: pass }); break;
              case "setx": st.x = b.v; note(b, { pass: pass }); break;
              case "changex": before = st.x; st.x += b.v; note(b, { pass: pass, before: before }); break;
              case "changey": before = st.y; st.y += b.v; note(b, { pass: pass, before: before }); break;
              case "move": before = st.x; st.x += b.v; note(b, { pass: pass, before: before }); break;
              case "set": before = st.vars[b.name]; st.vars[b.name] = b.v; note(b, { pass: pass, before: before }); break;
              case "change": before = Number(st.vars[b.name] || 0); st.vars[b.name] = before + b.v; note(b, { pass: pass, before: before }); break;
              case "say": st.said = b.t; note(b, { pass: pass }); break;
              case "wait": note(b, { pass: pass }); break;
              case "costume": before = st.costumes[st.ci]; st.ci = st.costumes.indexOf(b.c); if (st.ci < 0) throw new Error("Y6 sim: no costume " + b.c); note(b, { pass: pass, before: before }); break;
              case "next": before = st.costumes[st.ci]; st.ci = (st.ci + 1) % st.costumes.length; note(b, { pass: pass, before: before, wrapped: st.ci === 0 }); break;
              case "backdrop": st.backdrop = b.b; note(b, { pass: pass }); break;
              case "broadcast": note(b, { pass: pass }); queue.push(b.m); break;
              case "repeat":
                note(b, { pass: pass, start: true });
                for (var n = 1; n <= b.n; n++) exec(b.body, { i: n, of: b.n });
                break;
              case "forever": note(b, { pass: pass, start: true }); forevers.push(b); return;
              case "if":
                var ok = test(b.c, st);
                note(b, { pass: pass, ok: ok, value: b.c.name ? st.vars[b.c.name] : null });
                if (ok) exec(b.body, pass); else if (b.els) exec(b.els, pass);
                break;
              case "waituntil":
                if (!test(b.c, st)) { note(b, { pass: pass, ok: false, value: st.vars[b.c.name] }); return; }
                note(b, { pass: pass, ok: true, value: st.vars[b.c.name] }); break;
              default: throw new Error("Y6 sim: cannot run " + b.op);
            }
          }
        }
        function start(match, ev) {
          stacks.forEach(function (s) {
            if (!match(s[0])) return;
            note(s[0], { event: ev });
            exec(s.slice(1), null);
          });
          while (queue.length) {
            var m = queue.shift();
            stacks.forEach(function (s) {
              if (s[0].op !== "receive" || s[0].m !== m) return;
              note(s[0], { event: { msg: m } });
              exec(s.slice(1), null);
            });
          }
        }
        events.forEach(function (ev) {
          if (ev === "flag") start(function (h) { return h.op === "flag"; }, ev);
          else if (ev === "click") start(function (h) { return h.op === "click"; }, ev);
          else if (ev.key) start(function (h) { return h.op === "key" && h.k === ev.key; }, ev);
          else if (ev.tick) {
            st.touching = ev.touching || null;
            forevers.forEach(function (f) { exec(f.body, { tick: ev }); });
            st.touching = null;
          }
        });
        var end = snap();
        end.trace = trace;
        return end;
      }

      function plus(a, v) { return v < 0 ? a + " - " + Math.abs(v) + " = " + (a + v) : a + " + " + v + " = " + (a + v); }
      function describe(e) {
        var b = e.b, info = e.info, st = e.st, pre = "";
        if (info.pass && info.pass.i) pre = "Turn " + info.pass.i + " of " + info.pass.of + ". ";
        if (info.pass && info.pass.tick) pre = (info.pass.tick.touching ? "The " + info.pass.tick.touching + " touches the sprite. " : "") + "The forever loop runs its blocks again. ";
        switch (b.op) {
          case "flag": return "The green flag is clicked. This script starts at the top.";
          case "click": return "The player clicks the sprite. The when this sprite clicked script runs once.";
          case "key": return "The player presses the " + b.k + " key. The when " + b.k + " key pressed script runs once.";
          case "receive": return "The message " + b.m + " arrives. The when I receive [" + b.m + "] script starts.";
          case "goto": return pre + "go to puts the sprite at x: " + b.x + ", y: " + b.y + ".";
          case "glide": return pre + "glide moves the sprite slowly to x: " + b.x + ", y: " + b.y + ". It stops there.";
          case "setx": return pre + "set x puts x at " + b.v + ".";
          case "changex": return pre + "change x by (" + b.v + "): " + plus(info.before, b.v) + ".";
          case "changey": return pre + "change y by (" + b.v + "): " + plus(info.before, b.v) + ".";
          case "move": return pre + "move (" + b.v + ") steps: the sprite moves right, so x goes " + plus(info.before, b.v) + ".";
          case "set": return pre + "set gives " + b.name + " a new value: " + b.v + ". The old value is gone.";
          case "change": return pre + "change adds to " + b.name + ": " + plus(info.before, b.v) + ".";
          case "say": return pre + "The sprite says " + b.t + ".";
          case "wait": return pre + "wait: nothing changes while it waits.";
          case "costume": return pre + "switch costume to " + b.c + ".";
          case "next": return pre + "next costume: from " + info.before + " to " + st.costume + "." + (info.wrapped ? " After the last costume it goes back to the first." : "");
          case "backdrop": return pre + "The backdrop switches to " + b.b + ".";
          case "broadcast": return pre + "broadcast sends the message " + b.m + " to every sprite.";
          case "repeat": return pre + "repeat (" + b.n + "): the blocks inside run " + b.n + " times. Then the script carries on below the loop.";
          case "forever": return pre + "forever: the blocks inside run again and again until the game stops.";
          case "if":
            var q = b.c.k === "touching" ? "Is it touching the " + b.c.s + "? " + (info.ok ? "Yes." : "No.")
              : "Is " + b.c.name + " " + ({ ">": "more than", "<": "less than", "=": "equal to" })[b.c.k] + " " + b.c.n + "? " + b.c.name + " is " + info.value + ", so " + (info.ok ? "yes." : "no.");
            return pre + q + (info.ok ? " The blocks inside if run." : b.els ? " The blocks under else run." : " The blocks inside are skipped.");
          case "waituntil": return pre + "wait until: " + b.c.name + " is " + info.value + (info.ok ? ", so it goes on." : ", so it keeps waiting.");
        }
        return pre + blockText(b, true);
      }
      function stateText(st, show) {
        return show.map(function (k) {
          if (k === "x" || k === "y") return k + " = " + st[k];
          if (k === "costume") return "costume = " + st.costume;
          if (k === "said") return "says: " + (st.said || "nothing yet");
          if (k === "backdrop") return "backdrop = " + st.backdrop;
          return k + " = " + (st.vars[k] == null ? "?" : st.vars[k]);
        }).join("   ");
      }
      function step(textLine, code, hl, state) { return { text: textLine, code: code, hl: hl == null ? [] : [].concat(hl), state: state || "" }; }
      // A walk of a similar script: an intro, then one step per block that runs.
      function walk(stacks, events, init, show, intro, outro) {
        var code = plain(stacks), r = run(stacks, events, init);
        var steps = [step(intro, code, [])];
        r.trace.forEach(function (e) { steps.push(step(describe(e), code, e.b.__i, stateText(e.st, show))); });
        if (outro) steps.push(step(outro, code, [], stateText(r, show)));
        return { steps: steps, end: r };
      }
      return { B: B, C: C, text: text, plain: plain, run: run, walk: walk, step: step, stateText: stateText };
    })();

    var B = Y6.B, C = Y6.C;
    function exactRe(s) {
      return new RegExp("^\\s*" + String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*") + "\\s*[.]?\\s*$", "i");
    }
    function pick(from, to, avoid, stepBy) { var n, guard = 0; do { n = drillRange(from, to, stepBy); } while ((avoid || []).indexOf(n) !== -1 && ++guard < 200); return n; }
    function four(ans, list) {
      var o = [];
      list.forEach(function (x) { x = String(x); if (x !== String(ans) && o.indexOf(x) === -1 && o.length < 3) o.push(x); });
      if (o.length < 3) throw new Error("Y6 revision: fewer than 3 wrong options for " + ans + ": " + list.join(" | "));
      return o;
    }
    function nums(ans, list) {
      var pads = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 5, ans - 5];
      return four(ans, list.concat(pads).filter(function (v) { return v !== ans; }));
    }
    function pos(x, y) { return "x: " + x + "  y: " + y; }
    function posRe(x, y) { return new RegExp("^\\s*\\(?\\s*(x\\s*[:=]?\\s*)?" + String(x).replace("-", "[-\\u2212]") + "\\s*[,;]?\\s*(and\\s*)?(y\\s*[:=]?\\s*)?" + String(y).replace("-", "[-\\u2212]") + "\\s*\\)?\\s*$", "i"); }
    var WORDS = ["Hello", "Ouch", "Jump", "Yes", "Wow", "Hi", "Run", "Stop"];
    var KEYS = ["space", "up arrow", "down arrow", "a", "b"];
    var CARDS = [];
    function card(id, category, randomize) { CARDS.push({ id: id, category: category, randomize: randomize }); }

    // ================================================================ events
    card("ev-mix", "events", function () {
      var a, b, n;
      do { a = drillPick([1, 2, 3]); b = drillPick([2, 3, 4, 10]); n = drillRange(2, 4); } while (a === 1 && b === 5 && n === 2);
      var k = drillPick(["space", "up arrow", "a"]);
      var s = [[B.flag(), B.set("score", 0)], [B.click(), B.change("score", a)], [B.key(k), B.change("score", b)]];
      var ev = ["flag"]; for (var i = 0; i < n; i++) ev.push("click"); ev.push({ key: k });
      var ans = Y6.run(s, ev).vars.score;
      var wa, wb; do { wa = pick(1, 3, [a]); wb = pick(2, 6, [b]); } while (2 * wa + wb === ans);
      var ws = [[B.flag(), B.set("coins", 0)], [B.click(), B.change("coins", wa)], [B.key("down arrow"), B.change("coins", wb)]];
      var w = Y6.walk(ws, ["flag", "click", { key: "down arrow" }, "click"], {}, ["coins"],
        "A similar script. Each event runs only its own script. The player clicks the green flag, clicks the sprite, presses the down arrow, then clicks the sprite again.",
        "Each click ran the click script once. The key ran its own script once.");
      return {
        blocks: Y6.text(s),
        prompt: "The player clicks the green flag. Then they click the sprite " + n + " times and press the " + k + " key once. What is score now?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, "score")],
        distractors: nums(ans, [n * a, n * a + 1, a + b, ans + a]),
        working: ["Which script runs for each thing the player does? Each event runs its own script once.", "Start at the green flag script. Then follow every click, one at a time, then the key."],
        walk: w.steps,
        note: "Flag: score is 0. " + n + " clicks add " + (n * a) + ". The " + k + " key adds " + b + ". Total " + ans + "."
      };
    });
    card("ev-which", "events", function () {
      var ws = sample(WORDS, 4), keys = sample(KEYS, 2);
      var s = [[B.flag(), B.say(ws[0])], [B.key(keys[0]), B.say(ws[1])], [B.key(keys[1]), B.say(ws[2])], [B.click(), B.say(ws[3])]];
      var which = drillPick([1, 2, 3]);
      var ev = which === 3 ? ["flag", "click"] : ["flag", { key: keys[which - 1] }];
      var ans = Y6.run(s, ev).said;
      var what = which === 3 ? "clicks the sprite" : "presses the " + keys[which - 1] + " key";
      var other = WORDS.filter(function (w) { return ws.indexOf(w) === -1; });
      var wk = KEYS.filter(function (k) { return keys.indexOf(k) === -1; })[0];
      var wsl = [[B.flag(), B.say(other[0])], [B.key(wk), B.say(other[1])], [B.click(), B.say(other[2])]];
      var w = Y6.walk(wsl, ["flag", { key: wk }], {}, ["said"],
        "A similar sprite. The player clicks the green flag, then presses the " + wk + " key. Find the hat block for each event.",
        "The sprite says what the LAST script made it say. The click script did not run: nobody clicked.");
      return {
        blocks: Y6.text(s),
        prompt: "The player clicks the green flag, then " + what + ". What does the sprite say now?",
        answers: [ans], keywords: [exactRe(ans)],
        distractors: four(ans, ws),
        working: ["Find the hat block that matches what the player did last.", "The green flag script ran first. A later script can change what the sprite says."],
        walk: w.steps,
        note: "The " + (which === 3 ? "when this sprite clicked" : "when " + keys[which - 1] + " key pressed") + " script ran last, so it says " + ans + "."
      };
    });

    // ================================================================ coordinates and motion
    card("co-change", "motion", function () {
      var x0, y0, dx, dy;
      do { x0 = drillRange(-100, 100, 10); y0 = drillRange(-80, 80, 10); dx = drillPick([-40, -30, -20, 20, 30, 40, 50]); dy = drillPick([-50, -40, -30, 30, 40, 50]); }
      while (dx === dy || dx === -dy || (x0 === -50 && y0 === 20));
      var s = [[B.flag(), B.goto(x0, y0), B.changex(dx), B.changey(dy)]];
      var r = Y6.run(s, ["flag"]), ans = pos(r.x, r.y);
      var wx = pick(-100, 100, [x0], 10), wy = pick(-80, 80, [y0], 10), wdx = drillPick([-25, 15, 35]), wdy = drillPick([-15, 25, -35]);
      var ws = [[B.flag(), B.goto(wx, wy), B.changex(wdx), B.changey(wdy)]];
      var w = Y6.walk(ws, ["flag"], {}, ["x", "y"], "A similar script. Keep a note of x and y. Change only the one the block names.");
      return {
        blocks: Y6.text(s),
        prompt: "Where is the sprite when this script ends?",
        answers: [ans], keywords: [posRe(r.x, r.y)],
        distractors: four(ans, [pos(r.x, y0 - dy), pos(x0 + dy, y0 + dx), pos(x0 - dx, y0 - dy), pos(x0 + dx, y0)]),
        working: ["change x moves left or right. change y moves up or down.", "A minus number makes it go down or left."],
        walk: w.steps,
        note: "x: " + x0 + " + (" + dx + ") = " + r.x + ". y: " + y0 + " + (" + dy + ") = " + r.y + "."
      };
    });
    card("co-glide", "motion", function () {
      var x0, gx, gy, c, axis;
      do { x0 = drillRange(-150, 150, 50); gx = drillRange(-150, 150, 50); gy = drillRange(-100, 100, 50); c = drillPick([-30, -20, 20, 30, 40]); axis = drillPick(["x", "y"]); }
      while (gx === x0 || gy === 0 || (gx === -100 && gy === 50));
      var s = [[B.flag(), B.goto(x0, 0), B.glide(drillPick([1, 2, 3]), gx, gy), axis === "x" ? B.changex(c) : B.changey(c)]];
      var r = Y6.run(s, ["flag"]), ans = pos(r.x, r.y);
      var wrongAxis = axis === "x" ? pos(gx, gy + c) : pos(gx + c, gy);
      var ws = [[B.flag(), B.goto(pick(-150, 150, [x0], 50), 50), B.glide(2, pick(-150, 150, [gx], 50), pick(-100, 100, [gy, 50], 50)), axis === "x" ? B.changey(drillPick([-10, 10])) : B.changex(drillPick([-10, 10]))]];
      var w = Y6.walk(ws, ["flag"], {}, ["x", "y"], "A similar script. glide ends at the place in the block, wherever the sprite started.");
      return {
        blocks: Y6.text(s),
        prompt: "Where is the sprite when this script ends?",
        answers: [ans], keywords: [posRe(r.x, r.y)],
        distractors: four(ans, [pos(gx, gy), wrongAxis, axis === "x" ? pos(x0 + gx + c, gy) : pos(x0 + gx, gy + c), pos(x0, gy)]),
        working: ["glide goes to the x and y in the glide block.", "Then the last block moves it from there."],
        walk: w.steps,
        note: "glide ends at x: " + gx + ", y: " + gy + ". Then change " + axis + " by " + c + "."
      };
    });

    // ================================================================ loops
    card("lp-after", "loops", function () {
      var s0, n, d, e;
      do { s0 = drillPick([-20, -10, 0, 10, 20]); n = drillRange(2, 6); d = drillPick([5, 10, 20, 25]); e = drillPick([5, 10, -10]); } while (s0 === 0 && n === 4 && d === 15);
      var s = [[B.flag(), B.setx(s0), B.repeat(n, [B.changex(d)]), B.changex(e)]];
      var ans = Y6.run(s, ["flag"]).x;
      var wn, wd; do { wn = pick(2, 3, [n]); wd = pick(3, 9, [d]); } while (25 + wn * wd === ans);
      var ws = [[B.flag(), B.setx(30), B.repeat(wn, [B.changex(wd)]), B.changex(-5)]];
      var w = Y6.walk(ws, ["flag"], {}, ["x"], "A similar script. Count every turn of the loop. Then do the block after the loop once.");
      return {
        blocks: Y6.text(s),
        prompt: "What is x when this script ends?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, "x")],
        distractors: nums(ans, [s0 + (n + 1) * d + e, s0 + n * d, s0 + d + e, s0 + (n - 1) * d + e]),
        working: ["The blocks inside repeat run once for each turn. The number in repeat is the number of turns.", "The block below the loop runs once, after the last turn."],
        walk: w.steps,
        note: s0 + " + " + n + " x " + d + " + (" + e + ") = " + ans + "."
      };
    });
    // Moving inside a repeat: both blocks run on every turn (James 2026-10-09: the test gained this question).
    card("lp-move", "loops", function () {
      var n, dx, dy;
      do { n = drillRange(2, 5); dx = drillPick([5, 10, 15, 20]); dy = drillPick([10, 20, -10, 25]); } while (n === 3 && dx === 5 && dy === 10);
      var s = [[B.flag(), B.goto(0, 0), B.repeat(n, [B.changey(dy), B.changex(dx)])]];
      var r = Y6.run(s, ["flag"]), ans = pos(r.x, r.y);
      var wn = pick(2, 3, [n]), wdx = pick(2, 8, [dx]), wdy = pick(2, 8, [dy]);
      var ws = [[B.flag(), B.goto(10, 10), B.repeat(wn, [B.changex(wdx), B.changey(wdy)])]];
      var w = Y6.walk(ws, ["flag"], {}, ["x", "y"], "A similar script. Each turn of the loop runs both blocks inside it. Keep x and y apart.");
      return {
        blocks: Y6.text(s),
        prompt: "Where is the sprite when this script ends?",
        answers: [ans], keywords: [posRe(r.x, r.y)],
        distractors: four(ans, [pos(r.y, r.x), pos(r.x + dx, r.y + dy), pos(dx, dy), pos(r.x - dx, r.y - dy), pos(r.x, 0)]),
        working: ["Count the turns of the loop. Both blocks inside run on every turn.", "Add up the x changes on their own, then the y changes on their own."],
        walk: w.steps,
        note: "x: " + n + " x " + dx + " = " + r.x + ". y: " + n + " x " + dy + " = " + r.y + "."
      };
    });
    card("lp-forever", "loops", function () {
      var d = drillPick([3, 4, 6, 8, 12]), n = drillRange(3, 6), x0 = drillPick([0, 10, -20]);
      var s = [[B.flag(), B.setx(x0), B.forever([B.changex(d), B.wait(1)])]];
      var ev = ["flag"]; for (var i = 0; i < n; i++) ev.push({ tick: true });
      var ans = Y6.run(s, ev).x;
      var wd; do { wd = pick(2, 9, [d]); } while (50 - 2 * wd === ans);
      var ws = [[B.flag(), B.setx(50), B.forever([B.changex(-wd), B.wait(1)])]];
      var w = Y6.walk(ws, ["flag", { tick: true }, { tick: true }], {}, ["x"], "A similar script. Watch the forever loop go round 2 times.");
      return {
        blocks: Y6.text(s),
        prompt: "The forever loop has gone round " + n + " times. What is x now?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, "x")],
        distractors: nums(ans, [x0 + (n + 1) * d, x0 + (n - 1) * d, x0 + n + d, n * d === ans ? ans + d : n * d]),
        working: ["Each time round, the blocks inside run once.", "Start from the set x block. Add the change once for each time round."],
        walk: w.steps,
        note: x0 + " + " + n + " x " + d + " = " + ans + "."
      };
    });

    // ================================================================ variables
    card("var-seq", "variables", function () {
      var name = drillPick(["score", "coins", "points"]), a, b, c, d;
      do { a = drillRange(1, 6); b = drillRange(2, 6); c = drillRange(1, 8); d = drillRange(1, 4); } while (a + b === c || (a === 2 && b === 3 && c === 4 && d === 1));
      var s = [[B.flag(), B.set(name, a), B.change(name, b), B.set(name, c), B.change(name, d)]];
      var ans = Y6.run(s, ["flag"]).vars[name];
      var ws = [[B.flag(), B.set("lives", pick(2, 6, [a])), B.change("lives", -1), B.set("lives", pick(3, 9, [c, ans + 2])), B.change("lives", -2)]];
      var w = Y6.walk(ws, ["flag"], {}, ["lives"], "A similar script. set gives a new value. change adds to the value that is there.");
      return {
        blocks: Y6.text(s),
        prompt: "What is " + name + " when this script ends?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, name)],
        distractors: nums(ans, [a + b + c + d, c, a + b + d, a + b]),
        working: ["set throws the old value away. change adds to it.", "Go one block at a time and write the value down each time."],
        walk: w.steps,
        note: "The second set gives " + c + ". Then + " + d + " = " + ans + "."
      };
    });
    card("var-block", "variables", function () {
      var name = drillPick(["score", "coins", "points", "gems"]), k = drillPick([1, 2, 3, 5, 10]), thing = drillPick(["Apple", "Coin", "Gem", "Star"]);
      var s = [[B.flag(), B.set(name, 0), B.forever([B.ifThen(C.touching(thing), [B.say("Got it!"), B.goto(0, 180)])])]];
      var ans = "change [" + name + "] by (" + k + ")";
      var code = ["when flag clicked", "set [lives] to (3)", "forever", "  if <touching [Rock] ?> then", "    change [lives] by (-1)", "    go to x: (0) y: (180)", "  end", "end"];
      var walk = [
        Y6.step("A similar game. Each time the Rock hits the sprite, lives should go down by 1.", code, []),
        Y6.step("set puts lives at 3 at the start. It throws away the old value, so set is for starting again.", code, 1, "lives = 3"),
        Y6.step("The Rock touches the sprite. The if block runs its blocks.", code, 3, "lives = 3"),
        Y6.step("change [lives] by (-1) adds -1 to the value that is there: 3 - 1 = 2. change is for going up or down.", code, 4, "lives = 2"),
        Y6.step("The Rock hits again: 2 - 1 = 1. With set [lives] to (-1), lives would be -1 every time.", code, 4, "lives = 1")
      ];
      return {
        blocks: Y6.text(s),
        prompt: "Each " + thing + " caught should add " + k + " to " + name + ". Which block goes inside the if block?",
        answers: [ans], keywords: [exactRe(ans)],
        distractors: ["set [" + name + "] to (" + k + ")", "change [" + name + "] by (-" + k + ")", "set [" + name + "] to (0)"],
        working: ["One block adds to the value that is there. One block throws it away.", "Should " + name + " go up or down?"],
        walk: walk,
        note: "change adds " + k + " each time. set would put " + name + " at the same number every time."
      };
    });

    // ================================================================ decisions
    card("dec-count", "decisions", function () {
      var t, op, vals, ans, inc, above;
      do { t = drillRange(5, 20); } while (t === 10);
      op = drillPick([">", "<"]); above = drillRange(0, 3);
      vals = [t];
      while (vals.length < 1 + above) { var hi = t + drillRange(1, 9); if (vals.indexOf(hi) === -1) vals.push(hi); }
      while (vals.length < 4) { var lo = t - drillRange(1, 4); if (vals.indexOf(lo) === -1) vals.push(lo); }
      vals = shuffle(vals);
      inc = vals.filter(function (v) { return op === ">" ? v >= t : v <= t; }).length;
      var s = [[B.flag(), B.ifThen(op === ">" ? C.gt("score", t) : C.lt("score", t), [B.say("You win!")], [B.say("Try again")])]];
      ans = vals.filter(function (v) { return Y6.run(s, ["flag"], { vars: { score: v } }).said === "You win!"; }).length;
      var wt = pick(8, 20, [t]), wop = op === ">" ? "<" : ">";
      var ws = [[B.flag(), B.ifThen(wop === ">" ? C.gt("time", wt) : C.lt("time", wt), [B.say("Hurry")], [B.say("OK")])]];
      var w1 = Y6.walk(ws, ["flag"], { vars: { time: wt } }, ["time", "said"], "A similar script. Try it with time = " + wt + ", exactly the number in the if block.");
      var w2 = Y6.walk(ws, ["flag"], { vars: { time: wt + (wop === ">" ? 2 : -2) } }, ["time", "said"], "Now try time = " + (wt + (wop === ">" ? 2 : -2)) + ".");
      return {
        blocks: Y6.text(s),
        prompt: "The game is played 4 times. score is " + vals.slice(0, 3).join(", then ") + ", then " + vals[3] + ". How many times does the sprite say You win!?",
        answers: [String(ans)], keywords: [drillNumberRe(ans)],
        distractors: four(ans, [inc, ans + 1, ans - 1, 4 - ans, 0, 1, 2, 3, 4].filter(function (v) { return v >= 0 && v <= 4; })),
        working: ["Test each score in the if block, one at a time.", "A number equal to the one in the block is not more than it, and not less than it."],
        walk: w1.steps.concat(w2.steps),
        note: (op === ">" ? "More than " : "Less than ") + t + ": " + ans + " of them. " + t + " itself does not count."
      };
    });
    // An if inside a repeat: the if is checked on every turn (James 2026-10-09: the test gained this question).
    card("dec-loop", "decisions", function () {
      var n, t, l0;
      do { n = drillRange(4, 6); t = drillRange(1, n - 2); l0 = drillPick([3, 4, 5, 6]); } while ((n === 5 && t === 3 && l0 === 3) || l0 - (n - t) < 0);
      var s = [[B.flag(), B.set("lives", l0), B.set("score", 0), B.repeat(n, [B.change("score", 1), B.ifThen(C.gt("score", t), [B.change("lives", -1)])])]];
      var ans = Y6.run(s, ["flag"]).vars.lives;
      // The walk's last values (score = its turns, coins) must not be this card's answer.
      var wt = 1, wn = [3, 4, 5].filter(function (k) { return k !== n && k !== ans && 10 + 5 * (k - wt) !== ans; })[0];
      var ws = [[B.flag(), B.set("coins", 10), B.set("score", 0), B.repeat(wn, [B.change("score", 1), B.ifThen(C.gt("score", wt), [B.change("coins", 5)])])]];
      var w = Y6.walk(ws, ["flag"], {}, ["score", "coins"], "A similar script. On every turn, score goes up first, then the if checks the new score.");
      return {
        blocks: Y6.text(s),
        prompt: "What is lives when this script ends?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, "lives")],
        distractors: nums(ans, [ans - 1, l0 - 1, l0, l0 - n]),
        working: ["Write score down after each turn of the loop.", "For each turn, is score more than the number in the if? Only then does lives change."],
        walk: w.steps,
        note: "score is more than " + t + " on " + (n - t) + " turns, so lives = " + l0 + " - " + (n - t) + " = " + ans + "."
      };
    });
    card("dec-ifelse", "decisions", function () {
      var s0, t, a, b;
      do { s0 = drillRange(3, 15); t = drillRange(4, 14); a = drillPick([2, 3, 5, 10]); b = drillPick([-1, -2, -3, 1]); } while (s0 === t || a === -b);
      var s = [[B.flag(), B.set("score", s0), B.ifThen(C.gt("score", t), [B.change("score", a)], [B.change("score", b)])]];
      var ans = Y6.run(s, ["flag"]).vars.score;
      var other = s0 > t ? s0 + b : s0 + a;
      var ws = [[B.flag(), B.set("gems", t + 3), B.ifThen(C.lt("gems", t), [B.change("gems", 4)], [B.change("gems", -2)])]];
      var w = Y6.walk(ws, ["flag"], {}, ["gems"], "A similar script. Only one part of an if else runs: the if part or the else part.");
      return {
        blocks: Y6.text(s),
        prompt: "What is score when this script ends?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, "score")],
        distractors: nums(ans, [other, s0 + a + b, s0]),
        working: ["Put score into the if block. Is it true or false?", "True runs the if part. False runs the else part. Never both."],
        walk: w.steps,
        note: s0 + " > " + t + " is " + (s0 > t) + ", so score = " + ans + "."
      };
    });
    card("dec-touch", "decisions", function () {
      var L = drillRange(3, 6), n = drillRange(1, 3), name = drillPick(["Rock", "Ghost", "Bat"]);
      var s = [[B.flag(), B.set("lives", L), B.forever([B.ifThen(C.touching(name), [B.change("lives", -1), B.goto(0, 180)])])]];
      var ev = ["flag"]; for (var i = 0; i < n; i++) { ev.push({ tick: true }); ev.push({ tick: true, touching: name }); }
      var ans = Y6.run(s, ev).vars.lives;
      var ws = [[B.flag(), B.set("score", 10), B.forever([B.ifThen(C.touching("Apple"), [B.change("score", 5)])])]];
      var w = Y6.walk(ws, ["flag", { tick: true }, { tick: true, touching: "Apple" }], {}, ["score"], "A similar game. The forever loop checks the if block again and again.");
      return {
        blocks: Y6.text(s),
        prompt: "The " + name + " touches the sprite " + n + " times. What is lives now?",
        answers: [String(ans)], keywords: [drillNumberRe(ans, "lives")],
        distractors: nums(ans, [L + n, ans - 1, L, n]),
        working: ["The blocks inside if run only while it is touching.", "Start from the set block. Each touch runs the blocks inside if once."],
        walk: w.steps,
        note: L + " - " + n + " = " + ans + "."
      };
    });

    // ================================================================ costumes and messages
    card("cos-next", "looks", function () {
      var base = drillPick(["run", "fly", "swim", "dance"]), count = 4, n, start;
      var costumes = []; for (var i = 1; i <= count; i++) costumes.push(base + i);
      do { n = drillRange(1, 5); start = drillRange(0, count - 1); } while (n === count);
      var s = [[B.flag(), B.costume(costumes[start]), B.repeat(n, [B.next(), B.wait(0.2)])]];
      var ans = Y6.run(s, ["flag"], { costumes: costumes }).costume;
      var noWrap = costumes[Math.min(count - 1, start + n)], short = costumes[(start + n - 1) % count];
      var wc = ["hop1", "hop2", "hop3"];
      var ws = [[B.flag(), B.costume("hop2"), B.repeat(2, [B.next()])]];
      var w = Y6.walk(ws, ["flag"], { costumes: wc }, ["costume"], "A similar sprite with 3 costumes: hop1, hop2, hop3. Follow each next costume.");
      return {
        blocks: Y6.text(s),
        prompt: "The sprite has " + count + " costumes: " + costumes.join(", ") + ". Which costume does it show when this script ends?",
        answers: [ans], keywords: [exactRe(ans)],
        distractors: four(ans, [short, noWrap, costumes[start], costumes[(start + n + 1) % count]].concat(costumes)),
        working: ["Each turn of the loop moves on 1 costume.", "After the last costume, next costume goes back to the first."],
        walk: w.steps,
        note: "From " + costumes[start] + ", " + n + " next costume blocks reach " + ans + "."
      };
    });
    card("msg-hat", "looks", function () {
      var msgs = sample(["game over", "you win", "start", "level 3", "time up", "boss"], 2), m = msgs[0];
      var s = [[B.flag(), B.waitUntil(C.eq("score", drillPick([5, 20, 50]))), B.broadcast(m)]];
      var ans = "when I receive [" + m + "]";
      var code = ["when flag clicked", "wait until <(time) = (0)>", "broadcast [ring]", "", "when I receive [ring]", "say [Bring!]"];
      var walk = [
        Y6.step("A similar game. The Stage runs the top script. The Clock has the bottom script.", code, []),
        Y6.step("wait until stops here until time is 0.", code, 1, "time = 0"),
        Y6.step("broadcast [ring] sends the message ring to every sprite. It does not start anything by itself.", code, 2),
        Y6.step("Every script whose hat block waits for the message ring starts now.", code, 4),
        Y6.step("So the Clock says Bring!", code, 5, "says: Bring!")
      ];
      return {
        blocks: Y6.text(s),
        prompt: "When this broadcast happens, another sprite should show a message. Which hat block should start that sprite's script?",
        answers: [ans], keywords: [exactRe(ans)],
        distractors: ["broadcast [" + m + "]", "when I receive [" + msgs[1] + "]", "when flag clicked"],
        working: ["A hat block starts a script. Which hat block waits for a message?", "It must wait for the same message the broadcast sends."],
        walk: walk,
        note: "broadcast [" + m + "] starts every when I receive [" + m + "] script."
      };
    });

    // ================================================================ finding bugs
    var BUGS = [
      function () {
        var d = drillPick([5, 10, 15]);
        return { what: "The left arrow should move the sprite left. It moves right.", s: [[B.key("left arrow"), B.changex(d)]],
          ans: "change x by (-" + d + ")", wrong: ["change y by (-" + d + ")", "change x by (" + (d * 2) + ")", "set x to (-" + d + ")"] };
      },
      function () {
        var d = drillPick([5, 10]);
        return { what: "The up arrow should move the sprite up. It moves down.", s: [[B.key("up arrow"), B.changey(-d)]],
          ans: "change y by (" + d + ")", wrong: ["change x by (" + d + ")", "change y by (-" + (d * 2) + ")", "set y to (" + d + ")"] };
      },
      function () {
        var t = drillPick([20, 30, 60]);
        return { what: "The timer should count down from " + t + ". It counts up.", s: [[B.flag(), B.set("time", t), B.repeat(t, [B.wait(1), B.change("time", 1)])]],
          ans: "change [time] by (-1)", wrong: ["set [time] to (-1)", "change [time] by (0)", "wait (-1) seconds"] };
      },
      function () {
        var k = drillPick([1, 2, 5]);
        return { what: "Each click should add " + k + " to coins. coins gets stuck.", s: [[B.click(), B.set("coins", k)]],
          ans: "change [coins] by (" + k + ")", wrong: ["set [coins] to (" + (k + 1) + ")", "change [coins] by (0)", "set [coins] to (0)"] };
      },
      function () {
        return { what: "The game should end when lives reaches 0. It never ends.", s: [[B.flag(), B.set("lives", 3), B.waitUntil(C.lt("lives", 0)), B.backdrop("Game Over")]],
          ans: "wait until <(lives) = (0)>", wrong: ["wait until <(lives) > (0)>", "wait until <(lives) = (3)>", "wait until <(lives) < (-1)>"] };
      }
    ];
    var BUG_WALKS = [
      function () {
        var code = ["when [right arrow] key pressed", "change x by (-10)"];
        return [Y6.step("A similar bug: the right arrow should move the sprite right. Test it first: press the right arrow.", code, 0, "x = 0"),
          Y6.step("The sprite went left. x went from 0 to -10, so x went down.", code, 1, "x = -10"),
          Y6.step("Right means x goes up. This is the block that moved it the wrong way. It needs a plus number.", code, 1)];
      },
      function () {
        var code = ["when flag clicked", "set [score] to (0)", "", "when this sprite clicked", "change [score] by (-1)"];
        return [Y6.step("A similar bug: each click should add 1 to score. Test it: click the sprite twice.", code, [3], "score = 0"),
          Y6.step("Click 1: score went from 0 to -1. It went down, not up.", code, 4, "score = -1"),
          Y6.step("Click 2: -1 - 1 = -2. The block inside the click script is the bug: it takes away. It needs to add.", code, 4, "score = -2")];
      }
    ];
    card("bug-fix", "bugs", function () {
      var bug = drillPick(BUGS)();
      var walk = /arrow/.test(bug.what) ? BUG_WALKS[1]() : BUG_WALKS[0]();
      return {
        blocks: Y6.text(bug.s),
        prompt: bug.what + " Which block fixes it?",
        answers: [bug.ans], keywords: [exactRe(bug.ans)],
        distractors: bug.wrong,
        working: ["Test it in your head: what does the script do now? What should it do?", "Find the block that makes the wrong thing happen. Then pick the block that does the right thing."],
        walk: walk,
        note: bug.ans + " fixes it."
      };
    });
