// Shared by the drill content (data/*.js) and the engine (engine.js): random
// draws for randomised cards, the flowchart symbol renderer, and a few small
// utilities. Plain globals, since every data file calls them directly.
"use strict";
// ============================================================
// RANDOMISED CARD INSTANCES ("trace" cards - Y8 algorithms drills)
// ------------------------------------------------------------
// A card can define `randomize()` instead of (or alongside) static
// prompt/answers/keywords/distractors: called fresh on every single
// draw (see nextCard()/resolveCard() above) so a card that traces or
// predicts the output of real code shows different numbers - and
// sometimes a different scenario entirely - every time, the same
// anti-memorisation guarantee randomizeSetup() already gives type:'code'
// cards. James, 2026-09-16: "students are memorising answers for
// code-based questions... make sure numbers are randomised... if there
// is text-based output make sure there are multiple possible types of
// that question too." A card with no `randomize` is unaffected -
// resolveCard() passes it straight through.
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
// Lowercase, drop punctuation, collapse whitespace - used only to accept
// a student typing a card's own `hint` text back verbatim (or near
// enough), never for grading against `answers`/`keywords` generally.
function normalizeLoose(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function randInts(n, min, max) { var out = []; for (var i = 0; i < n; i++) out.push(randInt(min, max)); return out; }
function bin8(n) { n = ((n % 256) + 256) % 256; return n.toString(2).replace(/^/, "00000000").slice(-8); }
// A random linear-search draw: an n-element array plus a search value that
// matches an existing position about 60% of the time (foundAt = 1-based
// index) and is guaranteed absent otherwise (foundAt = -1) - so a search
// card genuinely varies between Found and Not Found across draws instead
// of a fixed card always being one or the other, on top of the array
// itself being different every time.
function randomSearchArray(n, min, max) {
  var arr = randInts(n, min, max);
  var found = Math.random() < 0.6;
  var searchValue, foundAt;
  if (found) {
    foundAt = randInt(1, n);
    searchValue = arr[foundAt - 1];
  } else {
    foundAt = -1;
    do { searchValue = randInt(min - 5, max + 5); } while (arr.indexOf(searchValue) !== -1);
  }
  return { arr: arr, searchValue: searchValue, foundAt: foundAt, found: found };
}
var NAME_POOL = ["Ivy", "Omar", "Zara", "Leo", "Mia", "Kofi", "Priya", "Ben", "Sofia", "Noah", "Aisha", "Theo"];
var COLOUR_POOL = ["Red", "Green", "Blue", "Yellow", "Purple", "Orange", "Pink", "Teal"];
// Same idea as randomSearchArray but for a pool of text values (names or
// colours) instead of numbers - sample() (already used elsewhere for MC
// option pools) picks n distinct values without repeats.
function randomSearchWords(pool, n) {
  var arr = sample(pool, n);
  var found = Math.random() < 0.6;
  var searchValue, foundAt;
  if (found) {
    foundAt = randInt(1, n);
    searchValue = arr[foundAt - 1];
  } else {
    foundAt = -1;
    var remaining = pool.filter(function (w) { return arr.indexOf(w) === -1; });
    searchValue = remaining.length ? remaining[randInt(0, remaining.length - 1)] : "Nobody";
  }
  return { arr: arr, searchValue: searchValue, foundAt: foundAt, found: found };
}
// Filters out anything equal to the correct answer (a randomised
// distractor can otherwise collide with the randomised answer, e.g. sum
// and product both landing on 4), then tops back up to 4 using `filler`
// (called with 1, 2, 3... until enough unique values exist) if the
// dedupe left fewer than that.
function dedupeDistractors(correct, list, filler) {
  var seen = {}; seen[String(correct)] = true;
  var out = [];
  list.forEach(function (d) {
    d = String(d);
    if (!seen[d]) { seen[d] = true; out.push(d); }
  });
  var i = 1;
  while (out.length < 4 && filler) {
    var f = filler(i++);
    if (f == null) break;
    f = String(f);
    if (!seen[f]) { seen[f] = true; out.push(f); }
    if (i > 40) break; // filler ran out of genuinely new values - stop rather than loop forever
  }
  return out;
}
// A shared pool of IF/ELSE scenarios (different variable, different pair
// of output labels, different comparison) that every Y8 Selection-style
// "what does this output" card draws from - so the SAME card slot can
// come up as a Score/Pass-Fail question one time and a Height/Tall-Short
// question the next, not just the same scenario with different numbers.
// Every scenario's thresholdRange/valueRange is wide enough that both
// branches are genuinely reachable, so a card cannot settle into always
// producing the same label.
var SELECTION_SCENARIOS = [
  { varName: "Score", op: ">=", trueLabel: "Pass", falseLabel: "Fail", thresholdRange: [40, 70], valueRange: [0, 100] },
  { varName: "Temperature", op: ">=", trueLabel: "Warm", falseLabel: "Cool", thresholdRange: [15, 25], valueRange: [-5, 35] },
  { varName: "Age", op: "<", trueLabel: "Junior", falseLabel: "Senior", thresholdRange: [10, 16], valueRange: [1, 25] },
  { varName: "Height", op: ">=", trueLabel: "Tall", falseLabel: "Short", thresholdRange: [140, 160], valueRange: [100, 190] }
];
function evalSelectionOp(op, value, threshold) {
  if (op === ">=") return value >= threshold;
  if (op === "<") return value < threshold;
  if (op === "<=") return value <= threshold;
  return value > threshold;
}
// English phrasing of a scenario's condition, for cards that describe the
// algorithm in words (write-practice style) rather than showing the
// literal IF/ELSE code.
function selectionOpPhrase(op, threshold) {
  if (op === ">=") return threshold + " or more";
  if (op === "<") return "under " + threshold;
  if (op === "<=") return threshold + " or less";
  return "more than " + threshold;
}
// Picks one random scenario + threshold + test value (spanning the whole
// valueRange, so either branch can come up) and returns everything a
// card needs: the IF/ELSE code itself, which label is correct, and the
// other label as a ready-made distractor.
function randomSelectionCase() {
  var s = SELECTION_SCENARIOS[randInt(0, SELECTION_SCENARIOS.length - 1)];
  var threshold = randInt(s.thresholdRange[0], s.thresholdRange[1]);
  var value = randInt(s.valueRange[0], s.valueRange[1]);
  var isTrue = evalSelectionOp(s.op, value, threshold);
  var code = "IF " + s.varName + " " + s.op + " " + threshold + " THEN\n    OUTPUT \"" + s.trueLabel + "\"\nELSE\n    OUTPUT \"" + s.falseLabel + "\"\nENDIF";
  return { scenario: s, threshold: threshold, value: value, isTrue: isTrue, code: code, label: isTrue ? s.trueLabel : s.falseLabel, otherLabel: isTrue ? s.falseLabel : s.trueLabel };
}

// ============================================================
// REAL FLOWCHART SYMBOLS (Year 7 flowchart drills)
// ------------------------------------------------------------
// James, 2026-09-16: "displaying actual flowchart symbols in the
// questions rather than just describing them where necessary." A card
// can carry a `diagram` field - an array of { shape, text } nodes,
// rendered top-to-bottom with down-arrows between them, the same visual
// language (shapes, colours, clip-paths) as the lesson shell's
// .lesson-flow-node - or a `legend` field (one shape name) to show all
// four symbol types side by side with that one emphasised, for "what is
// this symbol called / what goes inside it" questions. Both are rendered
// by flowchartCardExtraHtml() and prepended to the prompt in
// renderCard(); a card with neither is unaffected.
var FC_SHAPES = ["terminal", "process", "decision", "io"];
var FC_SHAPE_LABEL = { terminal: "Start / End", process: "Process", decision: "Decision", io: "Input / Output" };
function fcNodeHtml(shape, text) {
  var inner = shape === "decision" || shape === "io" ? "<span>" + escapeHtml(text) + "</span>" : escapeHtml(text);
  return '<div class="fc-node is-' + shape + '">' + inner + "</div>";
}
function flowchartDiagramHtml(nodes) {
  return '<div class="fc-diagram">' + nodes.map(function (n, i) {
    return fcNodeHtml(n.shape, n.text) + (i < nodes.length - 1 ? '<div class="fc-arrow" aria-hidden="true">&#8595;</div>' : "");
  }).join("") + "</div>";
}
function flowchartLegendHtml(focusShape) {
  return '<div class="fc-legend">' + FC_SHAPES.map(function (shape) {
    var cls = shape === focusShape ? "is-focus" : "is-dim";
    return '<div class="fc-legend-item ' + cls + '">' + fcNodeHtml(shape, "") + '<span class="fc-legend-label">' + escapeHtml(FC_SHAPE_LABEL[shape]) + "</span></div>";
  }).join("") + "</div>";
}
// Called by renderCard()/renderCodeCard() - a plain function, not a CSS
// class toggle, since only some cards define either field.
function flowchartCardExtraHtml(card) {
  if (card.diagram) return flowchartDiagramHtml(card.diagram);
  if (card.legend) return flowchartLegendHtml(card.legend);
  if (card.blocks) return '<div class="card-blocks"><pre class="blocks">' + escapeHtml(card.blocks) + "</pre></div>";
  return "";
}

// A card's Scratch script (card.blocks, scratchblocks text) is drawn as
// real Scratch blocks. The library loads the first time a card needs it.
var scratchBlocksLoading = null;
function renderCardBlocks(root) {
  if (!root || !root.querySelector("pre.blocks")) return;
  function draw() {
    if (!window.scratchblocks) return;
    try { window.scratchblocks.renderMatching("#stage pre.blocks", { style: "scratch3", languages: ["en"], scale: 0.8 }); } catch (e) {}
  }
  if (window.scratchblocks) { draw(); return; }
  if (!scratchBlocksLoading) {
    scratchBlocksLoading = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = "../vendor/scratchblocks-3.6.4.min.js";
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  scratchBlocksLoading.then(draw);
}

function shuffle(arr) {
  arr = arr.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function sample(arr, n) { return shuffle(arr).slice(0, Math.max(0, n)); }

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// ---- helpers for randomised cards (the Year 6 Scratch drills) ----
function drillPick(list) { return list[Math.floor(Math.random() * list.length)]; }
function drillRange(from, to, step) {
  step = step || 1;
  var n = Math.floor((to - from) / step) + 1;
  return from + step * Math.floor(Math.random() * n);
}
// A typed number, allowing "x: 70" or "x = 70" as well as "70", either minus sign.
function drillNumberRe(n, label) {
  var body = (n < 0 ? "[-\\u2212]\\s*" : "") + String(Math.abs(n)).replace(".", "\\.");
  return new RegExp("^\\s*" + (label ? "(" + label + "\\s*[:=]?\\s*)?" : "") + body + "\\s*$", "i");
}
// Up to `count` different wrong numbers, in order, none equal to the answer.
function drillWrongNumbers(answer, candidates, count) {
  var out = [];
  candidates.forEach(function (c) {
    var s = String(c);
    if (c !== answer && out.indexOf(s) === -1 && out.length < (count || 4)) out.push(s);
  });
  return out;
}
