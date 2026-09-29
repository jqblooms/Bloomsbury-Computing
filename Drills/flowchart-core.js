// Year 7 flowcharts: run one and draw one.
//
// Used by the Year 7 recap drill (Drills/data/y7-flowcharts-recap.js). A copy runs the matching class game
// on the teacher's PC, so the two draw and mark the same flowcharts. Keep them in step.
//
// A flowchart is { nodes: [{ id, type, text }], edges: [{ from, to, label }], subs: { Name: flowchart } }, using
// what Year 7 has been taught (7CT.01 L1 to L4) and their words:
//   terminal  Start / End
//   process   Move 30 steps, Turn right 90 degrees, Point in direction 90, Wait 1 second, Light on
//   io        Say "Hello"
//   decision  Right arrow pressed?   Up AND Right pressed?   NOT Up pressed?   Score > Target?
//             with a True arrow and a False arrow. An arrow back to an earlier box joins the line above it,
//             the way Year 7 made their loops ("keep checking").
//   call      CALL DrawSquare (runs the sub-routine's own flowchart, then comes back)
// Keys and values are 1 or 0 (Year 7 wrote AND, OR and NOT with 1 and 0).
(function (root) {
  "use strict";

  // ------------------------------------------------------------------ running

  var MAX_STEPS = 400;

  /**
   * opts.keys: fixed key values for AND / OR / NOT decisions, e.g. { Up: 1, Right: 0 }.
   * opts.presses: a key's state at each check of a "... pressed?" loop, e.g. [1, 1, 0]; when they run out the
   *   program is stopped (Year 7's loops keep checking until Stop is pressed).
   * opts.values: numbers for comparisons, e.g. { Score: 12, Target: 20 }.
   * Returns { said, steps, direction, trace, visits, checks, stopped, error }.
   */
  function run(flow, opts) {
    opts = opts || {};
    var st = { said: [], steps: 0, direction: 90, trace: [], visits: {}, checks: 0, stopped: false, error: null, presses: (opts.presses || []).slice() };
    runOne(flow, opts, st, null, 0);
    return st;
  }

  function runOne(flow, opts, st, name, depth) {
    var byId = {}, outs = {};
    flow.nodes.forEach(function (n) { byId[n.id] = n; });
    flow.edges.forEach(function (e) { (outs[e.from] = outs[e.from] || []).push(e); });
    var cur = flow.nodes.filter(function (n) { return n.type === "terminal" && /start/i.test(n.text || "Start") && !(flow.edges.some(function (e) { return e.to === n.id; })); })[0];
    var guard = 0;
    while (cur) {
      if (++guard > MAX_STEPS) { st.error = "The flowchart never reaches End."; return; }
      st.visits[cur.id] = (st.visits[cur.id] || 0) + 1;
      var o = outs[cur.id] || [];
      if (cur.type === "terminal") {
        if (!o.length) { st.trace.push(name ? "End of " + name + ": back to Main, just after the CALL." : "End."); return; }
        if (!name) st.trace.push("Start.");
        cur = byId[o[0].to];
        continue;
      }
      if (cur.type === "decision") {
        var r = decide(cur.text, opts, st);
        if (r === null) { st.stopped = true; st.trace.push("No more checks: the program is stopped."); return; }
        var edge = o.filter(function (e) { return e.label === (r ? "True" : "False"); })[0];
        if (!edge) { st.error = "The decision needs a True and a False arrow."; return; }
        cur = byId[edge.to];
        continue;
      }
      if (cur.type === "call") {
        var sub = /^CALL\s+(\w+)/i.exec(cur.text || "");
        var f = sub && flow.subs && flow.subs[sub[1]] || sub && opts.subs && opts.subs[sub[1]];
        if (!f) { st.error = "No sub-routine called " + (sub ? sub[1] : "?") + "."; return; }
        if (depth > 5) { st.error = "Too many CALLs inside CALLs."; return; }
        st.trace.push(cur.text + ": go to the " + sub[1] + " flowchart.");
        runOne(f, opts, st, sub[1], depth + 1);
        if (st.error || st.stopped) return;
      } else doBox(cur, st);
      cur = byId[(o[0] || {}).to];
    }
  }

  function doBox(n, st) {
    var t = n.text || "", m;
    if ((m = /^Move\s+(-?\d+)\s+steps?$/i.exec(t))) {
      st.steps += +m[1];
      st.trace.push(t + ". The sprite has moved " + st.steps + " steps so far.");
    } else if ((m = /^Turn\s+(right|left)\s+(\d+)\s+degrees?$/i.exec(t))) {
      st.direction += (m[1].toLowerCase() === "right" ? 1 : -1) * +m[2];
      st.trace.push(t + ".");
    } else if ((m = /^Point in direction\s+(-?\d+)$/i.exec(t))) {
      st.direction = +m[1];
      st.trace.push(t + ": the sprite now faces " + m[1] + ".");
    } else if ((m = /^Say\s+"(.*)"$/i.exec(t))) {
      st.said.push(m[1]);
      st.trace.push("Say \"" + m[1] + "\".");
    } else {
      st.trace.push(t + ".");
    }
  }

  // A decision: true / false, or null when a keep-checking loop has no more checks.
  function decide(text, opts, st) {
    var q = String(text).replace(/\?\s*$/, "").trim(), m;
    if ((m = /^(.*?)\s+pressed$/i.exec(q))) {
      var expr = m[1];
      if (!/\b(AND|OR|NOT)\b/.test(expr) && opts.presses) {
        // A single key checked again and again: the next state in the list.
        if (!st.presses.length) return null;
        st.checks++;
        var p = !!st.presses.shift();
        st.trace.push(text + " " + (p ? "It is pressed: True." : "It is not pressed: False."));
        return p;
      }
      return explain(text, expr, opts.keys || {}, st);
    }
    return explain(text, q, opts.values || {}, st);
  }

  function explain(text, expr, vals, st) {
    var v = evaluate(expr, vals) ? 1 : 0;
    var names = namesIn(expr).filter(function (k) { return k in vals; });
    var given = names.map(function (k) { return k + " is " + vals[k]; }).join(", ");
    var why;
    if (/\bAND\b/.test(expr)) why = "AND needs both to be 1, so it is " + v;
    else if (/\bOR\b/.test(expr)) why = "OR needs at least one 1, so it is " + v;
    else if (/^\s*NOT\b/.test(expr)) why = "NOT turns " + (1 - v) + " into " + v;
    else if (/[<>=]/.test(expr)) why = expr.replace(/\b[A-Za-z]\w*\b/g, function (k) { return k in vals ? vals[k] : k; }) + " is " + v;
    else why = "it is " + v;
    st.trace.push(text + " " + (given ? given + ". " : "") + why + ": " + (v ? "True" : "False") + ".");
    return !!v;
  }

  function namesIn(expr) {
    return (String(expr).match(/\b[A-Za-z]\w*\b/g) || []).filter(function (w) { return !/^(AND|OR|NOT)$/.test(w); });
  }

  // or -> and -> not -> compare -> atom. Values are numbers; anything but 0 counts as 1.
  function evaluate(expr, vals) {
    var toks = String(expr).match(/<>|>=|<=|[()<>=]|\d+|[A-Za-z]\w*/g) || [], i = 0;
    function peek() { return toks[i]; }
    function or() { var v = and(); while (/^OR$/i.test(peek() || "")) { i++; var r = and(); v = v || r ? 1 : 0; } return v; }
    function and() { var v = not(); while (/^AND$/i.test(peek() || "")) { i++; var r = not(); v = v && r ? 1 : 0; } return v; }
    function not() { if (/^NOT$/i.test(peek() || "")) { i++; return not() ? 0 : 1; } return cmp(); }
    function cmp() {
      var a = atom(), op = peek();
      if (/^(<>|>=|<=|<|>|=)$/.test(op || "")) {
        i++; var b = atom();
        return ({ "<>": a !== b, ">=": a >= b, "<=": a <= b, "<": a < b, ">": a > b, "=": a === b })[op] ? 1 : 0;
      }
      return a;
    }
    function atom() {
      var t = toks[i++];
      if (t === "(") { var v = or(); i++; return v; }
      if (/^\d+$/.test(t)) return +t;
      if (t in vals) return +vals[t];
      throw new Error("No value for " + t);
    }
    return or();
  }

  // ------------------------------------------------------------------ drawing

  var SIZE = { terminal: [104, 32], process: [160, 36], io: [160, 36], call: [160, 36], decision: [176, 58] };
  var DY = 64, DX = 196, PAD = 12, LANE = 24, RLANE = 46;   // the right lane leaves room for a False label

  /** Positions for one flowchart: a spine down the middle (True first), a False branch to its right. */
  function layout(flow) {
    var byId = {}, outs = {}, into = {};
    flow.nodes.forEach(function (n) { byId[n.id] = n; });
    flow.edges.forEach(function (e) { (outs[e.from] = outs[e.from] || []).push(e); (into[e.to] = into[e.to] || []).push(e); });
    var start = flow.nodes.filter(function (n) { return !into[n.id]; })[0] || flow.nodes[0];
    var pos = {}, row = 0, cur = start;
    // Spine: follow the arrows from Start, taking True at a decision, until End or a box already placed.
    while (cur && !pos[cur.id]) {
      pos[cur.id] = { col: 0, row: row++ };
      var o = outs[cur.id] || [];
      var next = o.filter(function (e) { return e.label === "True"; })[0] || o[0];
      cur = next && byId[next.to];
    }
    // Each decision's False branch, beside it, until it rejoins the spine.
    flow.nodes.forEach(function (d) {
      if (!pos[d.id]) return;
      var f = (outs[d.id] || []).filter(function (e) { return e.label === "False"; })[0];
      var r = pos[d.id].row + 1, n = f && byId[f.to];
      while (n && !pos[n.id]) {
        pos[n.id] = { col: 1, row: r++ };
        var o = outs[n.id] || [];
        n = o[0] && byId[o[0].to];
      }
    });
    // Anything left over (should not happen) goes below.
    flow.nodes.forEach(function (n) { if (!pos[n.id]) pos[n.id] = { col: 0, row: row++ }; });

    var hasRight = flow.nodes.some(function (n) { return pos[n.id].col === 1; });
    var backLeft = false, backRight = false, joinRows = {};
    flow.edges.forEach(function (e) {
      var s = pos[e.from], t = pos[e.to];
      if (t.row <= s.row) { joinRows[t.row] = true; if (byId[e.from].type === "decision" || s.col === 1) backRight = true; else backLeft = true; }
    });
    // A box that a loop comes back to gets extra room above it, where the returning arrows join the line.
    var JOIN_GAP = 16;
    function rowY(r) { var extra = 0; for (var k in joinRows) if (+k <= r) extra += JOIN_GAP; return PAD + 20 + r * DY + extra; }
    var half = Math.max.apply(null, flow.nodes.map(function (n) { return (SIZE[n.type] || SIZE.process)[0] / 2; }));
    var cx = PAD + (backLeft ? LANE + 6 : 0) + half;
    var boxes = flow.nodes.map(function (n, i) {
      var p = pos[n.id], sz = SIZE[n.type] || SIZE.process;
      return { id: n.id, type: n.type, text: n.type === "terminal" ? (n.text || (outs[n.id] ? "Start" : "End")) : n.text, num: i + 1,
        x: cx + p.col * DX, y: rowY(p.row), w: sz[0], h: sz[1], row: p.row, col: p.col };
    });
    var box = {}; boxes.forEach(function (b) { box[b.id] = b; });
    var rightEdge = Math.max.apply(null, boxes.map(function (b) { return b.x + b.w / 2; }));
    var width = rightEdge + (backRight ? RLANE + 6 : 0) + PAD;
    var height = Math.max.apply(null, boxes.map(function (b) { return b.y + b.h / 2; })) + PAD;
    var leftLane = cx - half - LANE / 2, spineRight = Math.max.apply(null, boxes.filter(function (b) { return b.col === 0; }).map(function (b) { return b.x + b.w / 2; }));

    var edges = flow.edges.map(function (e) {
      var s = box[e.from], t = box[e.to], pts, lab = null;
      var bottom = function (b) { return [b.x, b.y + b.h / 2]; }, top = function (b) { return [b.x, b.y - b.h / 2]; };
      var right = function (b) { return [b.x + b.w / 2, b.y]; }, left = function (b) { return [b.x - b.w / 2, b.y]; };
      if (t.row > s.row && t.col === s.col) {
        pts = [bottom(s), top(t)];
        lab = [s.x + 10, s.y + s.h / 2 + 14, "start"];
      } else if (t.row > s.row && s.col === 0 && t.col === 1) {
        pts = [right(s), [t.x, s.y], top(t)];
        lab = [s.x + s.w / 2 + 8, s.y - 6, "start"];
      } else if (t.row >= s.row && s.col === 1 && t.col === 0) {
        pts = [bottom(s), [s.x, t.y], right(t)];
      } else {
        // Back to an earlier box: round the side and join the line just above it.
        var joinY = t.y - t.h / 2 - 22;   // in the JOIN_GAP room above the box; the right-hand arrow joins 10 px lower
        if (s.type === "decision" || s.col === 1) {
          var rx = Math.max(spineRight, s.x + s.w / 2) + RLANE;
          if (s.col === 1) rx = s.x + s.w / 2 + RLANE;
          pts = [right(s), [rx, s.y], [rx, joinY + 10], [t.x, joinY + 10]];   // joins a little below the left-lane one
          lab = [s.x + s.w / 2 + 6, s.y - 6, "start"];
        } else {
          pts = [left(s), [leftLane, s.y], [leftLane, joinY], [t.x, joinY]];
        }
      }
      return { from: e.from, to: e.to, label: e.label || null, points: pts, labelAt: lab };
    });
    return { width: width, height: height, boxes: boxes, edges: edges };
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /** Up to two lines that fit the box width (about 7.8 px a character at 13 to 14 px). */
  function lines(text, w) {
    var max = Math.max(8, Math.floor((w - 18) / 7.8)), words = String(text).split(/\s+/), out = [""];
    words.forEach(function (wd) {
      var cur = out[out.length - 1];
      if ((cur + " " + wd).trim().length <= max || !cur) out[out.length - 1] = (cur + " " + wd).trim();
      else out.push(wd);
    });
    return out;
  }

  function shape(b) {
    var x = b.x - b.w / 2, y = b.y - b.h / 2, w = b.w, h = b.h;
    if (b.type === "terminal") return '<rect class="fc-t" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + h / 2 + '"/>';
    if (b.type === "decision") return '<polygon class="fc-d" points="' + b.x + "," + y + " " + (x + w) + "," + b.y + " " + b.x + "," + (y + h) + " " + x + "," + b.y + '"/>';
    if (b.type === "io") return '<polygon class="fc-b" points="' + (x + 14) + "," + y + " " + (x + w) + "," + y + " " + (x + w - 14) + "," + (y + h) + " " + x + "," + (y + h) + '"/>';
    if (b.type === "call") return '<rect class="fc-b" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3"/><path class="fc-line" d="M' + (x + 10) + " " + y + "V" + (y + h) + "M" + (x + w - 10) + " " + y + "V" + (y + h) + '"/>';
    return '<rect class="fc-b" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3"/>';
  }

  function drawOne(L, dx, dy, numbered, title, idp) {
    var out = [];
    if (title) out.push('<text class="fc-title" x="' + (dx + 6) + '" y="' + (dy + 12) + '">' + esc(title) + "</text>");
    L.edges.forEach(function (e) {
      var d = e.points.map(function (p, i) { return (i ? "L" : "M") + (p[0] + dx) + " " + (p[1] + dy); }).join(" ");
      out.push('<path class="fc-e" d="' + d + '" marker-end="url(#' + idp + 'a)"/>');
      if (e.label && e.labelAt) out.push('<text class="fc-l" x="' + (e.labelAt[0] + dx) + '" y="' + (e.labelAt[1] + dy) + '" text-anchor="' + e.labelAt[2] + '">' + esc(e.label) + "</text>");
    });
    L.boxes.forEach(function (b) {
      var bb = { type: b.type, x: b.x + dx, y: b.y + dy, w: b.w, h: b.h };
      out.push(shape(bb));
      var ls = lines(b.text, b.type === "decision" ? b.w - 40 : b.w);
      var small = ls.length > 1 || b.type === "decision";
      ls.forEach(function (t, k) {
        var y = bb.y + (k - (ls.length - 1) / 2) * 14 + 4.5;
        out.push('<text class="fc-x' + (small ? " fc-sm" : "") + '" x="' + bb.x + '" y="' + y + '">' + esc(t) + "</text>");
      });
      if (numbered) out.push('<circle class="fc-n" cx="' + (bb.x - b.w / 2 + 2) + '" cy="' + (bb.y - b.h / 2 + 2) + '" r="11"/><text class="fc-nt" x="' + (bb.x - b.w / 2 + 2) + '" y="' + (bb.y - b.h / 2 + 6.5) + '">' + b.num + "</text>");
    });
    return out.join("");
  }

  var uid = 0;
  /**
   * The flowchart (and any sub-routines, beside it) as an SVG string that scales to its container.
   * Colours come from CSS variables so each page can theme it: --fc-box, --fc-edge, --fc-ink, --fc-dec,
   * --fc-dec-edge, --fc-label, --fc-badge, --fc-badge-ink.
   */
  function svg(flow, numbered) {
    var idp = "fc" + (++uid);
    var parts = [], x = 0, h = 0;
    var subs = flow.subs ? Object.keys(flow.subs) : [];
    var charts = [{ f: flow, title: subs.length ? "Main" : null }].concat(subs.map(function (k) { return { f: flow.subs[k], title: "Sub-routine: " + k }; }));
    charts.forEach(function (c, i) {
      var L = layout(c.f), top = c.title ? 18 : 0;
      parts.push(drawOne(L, x, top, numbered && i === 0, c.title, idp));
      x += L.width + (i < charts.length - 1 ? 16 : 0);
      h = Math.max(h, L.height + top);
    });
    var style = "<style>" +
      ".fc-b{fill:var(--fc-box,#262a5a);stroke:var(--fc-edge,#8ab4f8);stroke-width:2}" +
      ".fc-t{fill:var(--fc-box,#262a5a);stroke:var(--fc-term,#9aa0c8);stroke-width:2}" +
      ".fc-d{fill:var(--fc-dec,#3a2f10);stroke:var(--fc-dec-edge,#fdd663);stroke-width:2}" +
      ".fc-line{stroke:var(--fc-edge,#8ab4f8);stroke-width:2;fill:none}" +
      ".fc-e{stroke:var(--fc-arrow,#9aa6ff);stroke-width:2;fill:none}" +
      ".fc-x{fill:var(--fc-ink,#eef0ff);font:600 14px/1 system-ui,Roboto,sans-serif;text-anchor:middle}" +
      ".fc-sm{font-size:13px}" +
      ".fc-l{fill:var(--fc-label,#fdd663);font:700 13px system-ui,Roboto,sans-serif}" +
      ".fc-title{fill:var(--fc-label,#fdd663);font:700 13px system-ui,Roboto,sans-serif}" +
      ".fc-n{fill:var(--fc-badge,#fdd663)}" +
      ".fc-nt{fill:var(--fc-badge-ink,#1f1400);font:800 13px system-ui,sans-serif;text-anchor:middle}" +
      "</style>";
    return '<svg class="fc-svg" viewBox="0 0 ' + x + " " + h + '" width="' + x + '" height="' + h + '" role="img" aria-label="' + esc(describe(flow)) + '">' +
      style + '<defs><marker id="' + idp + 'a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" style="fill:var(--fc-arrow,#9aa6ff)"/></marker></defs>' +
      parts.join("") + "</svg>";
  }

  /** The flowchart in words, for screen readers and as a text fallback. */
  function describe(flow) {
    var outs = {};
    flow.edges.forEach(function (e) { (outs[e.from] = outs[e.from] || []).push(e); });
    return flow.nodes.map(function (n) {
      var t = n.type === "terminal" ? (outs[n.id] ? "Start" : "End") : n.text;
      var br = (outs[n.id] || []).filter(function (e) { return e.label; }).map(function (e) {
        var to = flow.nodes.filter(function (m) { return m.id === e.to; })[0];
        return e.label + " to " + (to.type === "terminal" ? "End" : to.text);
      });
      return t + (br.length ? " (" + br.join(", ") + ")" : "");
    }).join("; ");
  }

  // ------------------------------------------------------------------ building

  /** A chart from a list of boxes joined in order: [["process", "Move 30 steps"], ...]; Start and End added. */
  function line(boxes) {
    var nodes = [{ id: "s", type: "terminal", text: "Start" }], edges = [];
    boxes.forEach(function (b, i) { nodes.push({ id: "b" + i, type: b[0], text: b[1] }); });
    nodes.push({ id: "e", type: "terminal", text: "End" });
    for (var i = 1; i < nodes.length; i++) edges.push({ from: nodes[i - 1].id, to: nodes[i].id, label: null });
    return { nodes: nodes, edges: edges };
  }

  var api = { run: run, evaluate: evaluate, layout: layout, svg: svg, describe: describe, line: line };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.FlowchartCore = api;
})(typeof window !== "undefined" ? window : globalThis);
