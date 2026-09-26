// Searching Algorithms Practice: the student plays the algorithm, clicking
// each position in the order linear or binary search would check it, while
// the pseudocode and a trace table follow along. Positions count from 1, as
// Cambridge arrays do (ARRAY[1:n]).
(function () {
  "use strict";
  var $ = AP.$;
  var ARROW = "←";

  var s = {
    algo: "linear",
    size: 11,
    list: [],          // list[0] is position 1
    target: 0,
    scenario: "random",
    trace: [],
    comparisons: 0,
    finished: false,
    found: 0,          // position found, 0 if not
    checked: {},       // position -> true
    next: 1,           // linear: the position to check next
    low: 1, high: 1,   // binary: the range still in play
    mid: 0,            // binary: the position just checked (while it shows)
    busy: false,
    codeLine: null
  };

  // ---- Pseudocode ----
  function linearCode(n) {
    return [
      "DECLARE List : ARRAY[1:" + n + "] OF INTEGER",
      "DECLARE Target : INTEGER",
      "DECLARE Index : INTEGER",
      "DECLARE Found : BOOLEAN",
      "Index " + ARROW + " 1",
      "Found " + ARROW + " FALSE",
      "WHILE Found = FALSE AND Index <= " + n + " DO",
      "    IF List[Index] = Target",
      "      THEN",
      "        Found " + ARROW + " TRUE",
      "      ELSE",
      "        Index " + ARROW + " Index + 1",
      "    ENDIF",
      "ENDWHILE",
      "IF Found = TRUE",
      "  THEN",
      "    OUTPUT \"Found at position \", Index",
      "  ELSE",
      "    OUTPUT \"Not found\"",
      "ENDIF"
    ];
  }
  var LIN = { compare: 7, found: 9, step: 11, outFound: 16, outMissing: 18 };

  function binaryCode(n) {
    return [
      "DECLARE List : ARRAY[1:" + n + "] OF INTEGER",
      "DECLARE Target : INTEGER",
      "DECLARE Low : INTEGER",
      "DECLARE High : INTEGER",
      "DECLARE Mid : INTEGER",
      "DECLARE Found : BOOLEAN",
      "Low " + ARROW + " 1",
      "High " + ARROW + " " + n,
      "Found " + ARROW + " FALSE",
      "WHILE Found = FALSE AND Low <= High DO",
      "    Mid " + ARROW + " (Low + High) DIV 2",
      "    IF List[Mid] = Target",
      "      THEN",
      "        Found " + ARROW + " TRUE",
      "      ELSE",
      "        IF List[Mid] < Target",
      "          THEN",
      "            Low " + ARROW + " Mid + 1",
      "          ELSE",
      "            High " + ARROW + " Mid - 1",
      "        ENDIF",
      "    ENDIF",
      "ENDWHILE"
    ];
  }
  var BIN = { loop: 9, mid: 10, found: 13, low: 17, high: 19 };

  // ---- Setting up a run ----
  // How many comparisons binary search needs to find the value at `pos`.
  function binarySteps(n, pos) {
    var lo = 1, hi = n, steps = 0;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2);
      steps++;
      if (mid === pos) return steps;
      if (mid < pos) lo = mid + 1; else hi = mid - 1;
    }
    return steps;
  }
  function binaryMax(n) { return Math.floor(Math.log2(n)) + 1; }

  function missingTarget(list, sorted) {
    var have = {};
    list.forEach(function (v) { have[v] = true; });
    if (sorted) {
      // Between two values, so binary search has to narrow right down.
      var gaps = [];
      for (var i = 0; i < list.length - 1; i++) {
        for (var v = list[i] + 1; v < list[i + 1]; v++) gaps.push(v);
      }
      if (gaps.length) return gaps[Math.floor(Math.random() * gaps.length)];
    }
    var t;
    do { t = AP.randomInt(10, 99); } while (have[t]);
    return t;
  }

  function newRun(scenario) {
    s.scenario = scenario || "random";
    s.size = Number($("size").value) || 11;
    var n = s.size;
    var nums = AP.uniqueNumbers(n);
    if (s.algo === "binary") nums.sort(function (a, b) { return a - b; });
    s.list = nums;
    var pos;
    if (s.scenario === "best") {
      pos = s.algo === "linear" ? 1 : Math.floor((1 + n) / 2);
    } else if (s.scenario === "worst") {
      if (s.algo === "linear") pos = n;
      else {
        pos = 1;
        for (var p = 1; p <= n; p++) if (binarySteps(n, p) >= binarySteps(n, pos)) pos = p;
      }
    } else if (s.scenario !== "missing") {
      pos = AP.randomInt(1, n);
    }
    s.target = s.scenario === "missing" ? missingTarget(nums, s.algo === "binary") : nums[pos - 1];
    s.trace = [];
    s.comparisons = 0;
    s.finished = false;
    s.found = 0;
    s.checked = {};
    s.next = 1;
    s.low = 1;
    s.high = n;
    s.mid = 0;
    s.busy = false;
    s.codeLine = s.algo === "linear" ? LIN.compare : BIN.mid;
    AP.feedback("");
    $("done").classList.remove("show");
    render();
  }

  // ---- Drawing ----
  function taskHtml() {
    if (s.algo === "linear") {
      return "<strong>Linear search</strong> checks each item in turn, starting at position 1, until it finds the target or runs out of items. " +
        "Click the box it checks next.";
    }
    return "<strong>Binary search</strong> only works on a <strong>sorted</strong> list. It checks the middle of the range still in play, " +
      "then throws away the half the target cannot be in. Click the middle box: <code>Mid " + ARROW + " (Low + High) DIV 2</code>.";
  }

  var SCENARIO_NOTE = {
    random: "",
    best: " Best case: the target is the first item this algorithm checks.",
    worst: " Worst case: the target is where this algorithm finds it last.",
    missing: " The target is not in this list: see how the algorithm finds that out."
  };

  function render() {
    $("task").innerHTML = taskHtml() + (SCENARIO_NOTE[s.scenario] ? '<br><span style="color:var(--muted)">' + SCENARIO_NOTE[s.scenario] + "</span>" : "");
    $("target").textContent = s.target;
    renderRow();
    var code = s.algo === "linear" ? linearCode(s.size) : binaryCode(s.size);
    AP.renderCode($("code"), code, s.codeLine);
    $("code-note").textContent = s.algo === "linear"
      ? "Cambridge arrays count from 1, so the first item is List[1]."
      : "DIV divides and throws away the remainder: 13 DIV 2 = 6.";
    renderTrace();
    renderHint();
  }

  function renderRow() {
    var row = $("row");
    row.innerHTML = "";
    var hintPos = hintPosition();
    s.list.forEach(function (value, i) {
      var pos = i + 1;
      var cell = document.createElement("div");
      cell.className = "ap-cell";
      var box = document.createElement("button");
      box.type = "button";
      box.className = "ap-box";
      var shown = false;
      if (s.found === pos) { box.classList.add("is-found"); shown = true; }
      else if (s.finished && s.checked[pos]) { box.classList.add("is-active"); shown = true; }
      else if (!s.finished && s.algo === "binary" && (pos < s.low || pos > s.high)) { box.classList.add("is-out"); shown = true; }
      else if (s.checked[pos]) { box.classList.add("is-checked"); shown = true; }
      if (s.algo === "binary" && s.mid === pos && !s.found) { box.classList.add("is-active"); shown = true; }
      if (s.finished) shown = true;
      if (!shown) box.classList.add("is-hidden");
      if (hintPos === pos) box.classList.add("is-hint");
      box.textContent = shown ? value : "?";
      box.disabled = s.finished || s.busy;
      box.setAttribute("aria-label", "Position " + pos + (shown ? ", value " + value : ", not checked yet"));
      box.addEventListener("click", function () { choose(pos, box); });
      var idx = document.createElement("div");
      idx.className = "ap-idx";
      idx.textContent = "[" + pos + "]";
      cell.appendChild(box);
      cell.appendChild(idx);
      if (s.algo === "binary") {
        var ptr = document.createElement("div");
        ptr.className = "ap-ptr";
        var labels = [];
        if (!s.finished || !s.found) {
          if (pos === s.low && s.low <= s.high) labels.push('<span class="low">Low</span>');
          if (pos === s.high && s.low <= s.high) labels.push('<span class="high">High</span>');
        }
        if (s.mid === pos && !s.finished) labels.push('<span class="mid">Mid</span>');
        ptr.innerHTML = labels.join(" ");
        cell.appendChild(ptr);
      }
      row.appendChild(cell);
    });
  }

  function renderTrace() {
    var cols = s.algo === "linear" ? ["Index", "List[Index]", "Found"] : ["Low", "High", "Mid", "List[Mid]", "Found"];
    AP.renderTrace($("trace"), cols, s.trace);
    $("stats").innerHTML =
      '<span class="ap-stat">Comparisons<b>' + s.comparisons + "</b></span>" +
      '<span class="ap-stat">Items<b>' + s.size + "</b></span>" +
      (s.algo === "binary" ? '<span class="ap-stat">Most it can take<b>' + binaryMax(s.size) + "</b></span>" : "");
  }

  // ---- Support mode: show how to find the next box, less as they get it ----
  function expected() {
    if (s.algo === "linear") return s.next;
    return Math.floor((s.low + s.high) / 2);
  }
  function hintPosition() {
    if (s.finished || s.busy) return 0;
    return AP.reveal(s.algo) > 0.9 ? expected() : 0;
  }
  function renderHint() {
    if (s.finished || s.busy) { AP.showHint(""); return; }
    var r = AP.reveal(s.algo);
    var html = "";
    if (s.algo === "linear") {
      if (r > 0.9) html = s.next === 1 ? "Start at position 1, the first item." : "Index goes up by 1: after position " + (s.next - 1) + " comes position " + s.next + ".";
      else if (r > 0.5) html = "Check the box straight after the last one you checked.";
      else if (r > 0.1) html = "Linear search goes along the list in order.";
    } else {
      var m = expected();
      if (r > 0.9) html = "Mid " + ARROW + " (Low + High) DIV 2 = (" + s.low + " + " + s.high + ") DIV 2 = " + (s.low + s.high) + " DIV 2 = " + m;
      else if (r > 0.5) html = "Mid " + ARROW + " (" + s.low + " + " + s.high + ") DIV 2";
      else if (r > 0.1) html = "Mid " + ARROW + " (Low + High) DIV 2";
    }
    AP.showHint(html);
  }

  // ---- Playing ----
  function choose(pos, box) {
    if (s.finished || s.busy) return;
    var want = expected();
    if (pos !== want) {
      AP.record(s.algo, false);
      AP.shake(box);
      if (s.algo === "linear") {
        AP.feedback(s.checked[pos]
          ? "Position " + pos + " has already been checked."
          : "Not that one: linear search goes in order, so position " + want + " is next.", "bad");
      } else if (pos < s.low || pos > s.high) {
        AP.feedback("Position " + pos + " has already been ruled out. Only positions " + s.low + " to " + s.high + " are left.", "bad");
      } else {
        AP.feedback("Not the middle: (" + s.low + " + " + s.high + ") DIV 2 = " + want + ".", "bad");
      }
      renderHint();
      return;
    }
    AP.record(s.algo, true);
    s.comparisons++;
    if (s.algo === "linear") stepLinear(pos); else stepBinary(pos);
  }

  function stepLinear(pos) {
    var value = s.list[pos - 1];
    s.checked[pos] = true;
    if (value === s.target) {
      s.found = pos;
      s.trace.push([pos, value, "TRUE"]);
      s.codeLine = [LIN.found, LIN.outFound];
      finish();
      return;
    }
    s.trace.push([pos, value, "FALSE"]);
    s.next = pos + 1;
    if (s.next > s.size) {
      s.codeLine = LIN.outMissing;
      finish();
      return;
    }
    s.codeLine = [LIN.step, LIN.compare];
    AP.feedback(value + " is not " + s.target + ", so Index goes up to " + s.next + ".", "info");
    render();
  }

  function stepBinary(pos) {
    var value = s.list[pos - 1];
    s.mid = pos;
    s.checked[pos] = true;
    if (value === s.target) {
      s.found = pos;
      s.trace.push([s.low, s.high, pos, value, "TRUE"]);
      s.codeLine = BIN.found;
      finish();
      return;
    }
    s.trace.push([s.low, s.high, pos, value, "FALSE"]);
    var smaller = value < s.target;
    s.codeLine = smaller ? BIN.low : BIN.high;
    AP.feedback(smaller
      ? value + " is smaller than " + s.target + ", so the target must be to the right: Low " + ARROW + " " + (pos + 1) + "."
      : value + " is bigger than " + s.target + ", so the target must be to the left: High " + ARROW + " " + (pos - 1) + ".", "info");
    s.busy = true;
    render();
    setTimeout(function () {
      if (smaller) s.low = pos + 1; else s.high = pos - 1;
      s.mid = 0;
      s.busy = false;
      if (s.low > s.high) {
        s.codeLine = BIN.loop;
        finish();
        return;
      }
      s.codeLine = BIN.mid;
      render();
    }, 1100);
  }

  function finish() {
    s.finished = true;
    s.busy = false;
    var n = s.size;
    var msg;
    if (s.algo === "linear") {
      if (s.found) {
        AP.feedback("Found " + s.target + " at position " + s.found + ".", "good");
        msg = "<strong>Found after " + s.comparisons + " comparison" + (s.comparisons === 1 ? "" : "s") + ".</strong> " +
          "The worst case for " + n + " items is " + n + " comparisons: the target is last, or not there at all. " +
          "Binary search would need at most " + binaryMax(n) + ", but only because it needs the list sorted first.";
      } else {
        AP.feedback(s.target + " is not in the list.", "good");
        msg = "<strong>Not found, after checking all " + n + " items.</strong> Linear search cannot stop early when the target is missing: " +
          "it has to look at every item to be sure.";
      }
    } else {
      if (s.found) {
        AP.feedback("Found " + s.target + " at position " + s.found + ".", "good");
        msg = "<strong>Found after " + s.comparisons + " comparison" + (s.comparisons === 1 ? "" : "s") + ".</strong> " +
          "Halving the range each time means " + n + " items never take more than " + binaryMax(n) + ". " +
          "Linear search would have taken " + s.found + " for this target.";
      } else {
        AP.feedback("Low is now past High, so " + s.target + " is not in the list.", "good");
        msg = "<strong>Not found, after " + s.comparisons + " comparisons.</strong> When Low goes past High there is nowhere left to look. " +
          "Linear search would have needed all " + n + ".";
      }
    }
    $("done").innerHTML = msg + ' <button type="button" class="bc-btn is-tonal" id="again" style="margin-left:6px">Try another</button>';
    $("done").classList.add("show");
    $("again").addEventListener("click", function () { newRun(s.scenario); });
    render();
  }

  // ---- Wiring ----
  AP.wireTabs(function (algo) { s.algo = algo; newRun("random"); });
  $("size").addEventListener("change", function () { newRun(s.scenario); });
  $("new-random").addEventListener("click", function () { newRun("random"); });
  $("new-best").addEventListener("click", function () { newRun("best"); });
  $("new-worst").addEventListener("click", function () { newRun("worst"); });
  $("new-missing").addEventListener("click", function () { newRun("missing"); });
  AP.mountSupport(function () { render(); });

  var start = new URLSearchParams(location.search).get("algo");
  if (start === "binary") {
    var tab = document.querySelector('.ap-tab[data-algo="binary"]');
    if (tab) { tab.click(); return; }
  }
  newRun("random");
})();
