// Sorting Algorithms Practice: the student makes every move of bubble,
// insertion or merge sort themselves; a wrong move is explained and can be
// tried again. The pseudocode and a trace table follow along. Positions
// count from 1, as Cambridge arrays do.
(function () {
  "use strict";
  var $ = AP.$;
  var ARROW = "←";

  var s = { algo: "bubble", size: 6, scenario: "random", trace: [], finished: false, busy: false, codeLine: null };

  function makeList(scenario, n) {
    var nums = AP.uniqueNumbers(n);
    if (scenario === "sorted") nums.sort(function (a, b) { return a - b; });
    else if (scenario === "reversed") nums.sort(function (a, b) { return b - a; });
    else {
      // A random order that is not already sorted.
      var sorted = nums.slice().sort(function (a, b) { return a - b; }).join();
      while (nums.join() === sorted) nums = AP.shuffle(nums);
    }
    return nums;
  }

  function newRun(scenario) {
    s.scenario = scenario || "random";
    s.size = Number($("size").value) || 6;
    s.trace = [];
    s.finished = false;
    s.busy = false;
    s.comparisons = 0;
    s.moves = 0;
    var list = makeList(s.scenario, s.size);
    ALGOS[s.algo].start(list);
    AP.feedback("");
    $("done").classList.remove("show");
    render();
  }

  function render() {
    var a = ALGOS[s.algo];
    $("task").innerHTML = a.task();
    a.board($("board"));
    $("code-title").textContent = a.codeTitle || "The algorithm";
    AP.renderCode($("code"), a.code(s.size), s.codeLine);
    $("code-note").textContent = a.note || "";
    AP.renderTrace($("trace"), a.columns, s.trace);
    $("stats").innerHTML = a.stats();
    renderHint();
  }

  function renderHint() {
    if (s.finished || s.busy) { AP.showHint(""); return; }
    AP.showHint(ALGOS[s.algo].hint(AP.reveal(s.algo)));
  }

  function stat(label, value) { return '<span class="ap-stat">' + label + "<b>" + value + "</b></span>"; }

  function cell(value, cls, pos) {
    var c = document.createElement("div");
    c.className = "ap-cell";
    var box = document.createElement("div");
    box.className = "ap-box" + (cls ? " " + cls : "");
    box.textContent = value;
    c.appendChild(box);
    if (pos) {
      var idx = document.createElement("div");
      idx.className = "ap-idx";
      idx.textContent = "[" + pos + "]";
      c.appendChild(idx);
    }
    return c;
  }

  function finish(html) {
    s.finished = true;
    s.busy = false;
    $("done").innerHTML = html + ' <button type="button" class="bc-btn is-tonal" id="again" style="margin-left:6px">Try another</button>';
    $("done").classList.add("show");
    $("again").addEventListener("click", function () { newRun(s.scenario); });
    render();
  }

  // ================= Bubble sort =================
  var bubble = {
    columns: ["Pass", "Index", "List[Index]", "List[Index + 1]", "Swap?"],
    note: "Swapped is the flag that lets bubble sort stop early: a pass with no swaps means the list is sorted.",
    code: function (n) {
      return [
        "DECLARE List : ARRAY[1:" + n + "] OF INTEGER",
        "DECLARE Top : INTEGER",
        "DECLARE Index : INTEGER",
        "DECLARE Temp : INTEGER",
        "DECLARE Swapped : BOOLEAN",
        "Top " + ARROW + " " + n,
        "REPEAT",
        "    Swapped " + ARROW + " FALSE",
        "    FOR Index " + ARROW + " 1 TO Top - 1",
        "        IF List[Index] > List[Index + 1]",
        "          THEN",
        "            Temp " + ARROW + " List[Index]",
        "            List[Index] " + ARROW + " List[Index + 1]",
        "            List[Index + 1] " + ARROW + " Temp",
        "            Swapped " + ARROW + " TRUE",
        "        ENDIF",
        "    NEXT Index",
        "    Top " + ARROW + " Top - 1",
        "UNTIL Swapped = FALSE OR Top = 1"
      ];
    },
    start: function (list) {
      s.list = list;
      s.top = list.length;
      s.index = 1;
      s.pass = 1;
      s.swappedThisPass = false;
      s.codeLine = 9;
    },
    task: function () {
      return "<strong>Bubble sort</strong> compares each pair of neighbours, left to right, and swaps them if the left one is bigger. " +
        "After each pass the biggest number left has bubbled to the end. Decide for the highlighted pair: <strong>swap</strong> or <strong>leave</strong>?";
    },
    stats: function () {
      return stat("Pass", s.pass) + stat("Comparisons", s.comparisons) + stat("Swaps", s.moves);
    },
    board: function (root) {
      root.innerHTML = "";
      var row = document.createElement("div");
      row.className = "ap-row";
      s.list.forEach(function (v, i) {
        var pos = i + 1;
        var cls = s.finished || pos > s.top ? "is-sorted" : (pos === s.index || pos === s.index + 1 ? "is-active" : "");
        row.appendChild(cell(v, cls, pos));
      });
      root.appendChild(row);
      var decide = document.createElement("div");
      decide.className = "ap-decide";
      decide.innerHTML = '<button type="button" class="bc-btn" id="do-swap">Swap</button>' +
        '<button type="button" class="bc-btn is-outline" id="do-leave">Leave</button>';
      root.appendChild(decide);
      var off = s.finished || s.busy;
      $("do-swap").disabled = off;
      $("do-leave").disabled = off;
      $("do-swap").addEventListener("click", function () { bubble.decide(true); });
      $("do-leave").addEventListener("click", function () { bubble.decide(false); });
    },
    hint: function (r) {
      if (!r) return "";
      var a = s.list[s.index - 1], b = s.list[s.index];
      if (r > 0.9) return "Is " + a + " &gt; " + b + "? " + (a > b ? "Yes, so swap them." : "No, so leave them.");
      if (r > 0.5) return "Is List[Index] &gt; List[Index + 1]? That is, is " + a + " &gt; " + b + "?";
      return "Swap only when the left number is bigger.";
    },
    decide: function (swap) {
      if (s.finished || s.busy) return;
      var a = s.list[s.index - 1], b = s.list[s.index];
      var should = a > b;
      if (swap !== should) {
        AP.record("bubble", false);
        AP.shake(document.querySelector(".ap-box.is-active"));
        AP.feedback(should ? a + " is bigger than " + b + ", so they swap." : a + " is smaller than " + b + ", so they stay where they are.", "bad");
        renderHint();
        return;
      }
      AP.record("bubble", true);
      s.comparisons++;
      s.trace.push([s.pass, s.index, a, b, should ? "Yes" : "No"]);
      if (should) {
        s.list[s.index - 1] = b;
        s.list[s.index] = a;
        s.moves++;
        s.swappedThisPass = true;
        s.codeLine = [11, 12, 13, 14];
        AP.feedback("Swapped: " + b + " now comes before " + a + ".", "good");
      } else {
        s.codeLine = 9;
        AP.feedback(a + " and " + b + " are already in order.", "good");
      }
      s.index++;
      if (s.index > s.top - 1) {
        // End of a pass: the last unsorted place is now final.
        s.top--;
        if (!s.swappedThisPass || s.top <= 1) {
          s.codeLine = 18;
          var early = !s.swappedThisPass && s.top > 1;
          finish("<strong>Sorted in " + s.pass + " pass" + (s.pass === 1 ? "" : "es") + ", " + s.comparisons + " comparisons and " + s.moves + " swaps.</strong> " +
            (early ? "The last pass made no swaps, so Swapped stayed FALSE and the loop stopped early." :
              "Each pass fixed one more number at the end, until only one was left."));
          return;
        }
        s.codeLine = [17, 18];
        AP.feedback("End of pass " + s.pass + ": " + s.list[s.top] + " is in its final place." + (s.swappedThisPass ? " There were swaps, so go again." : ""), "info");
        s.pass++;
        s.index = 1;
        s.swappedThisPass = false;
      } else if (!should) {
        s.codeLine = 9;
      }
      render();
    }
  };

  // ================= Insertion sort =================
  var insertion = {
    columns: ["Pointer", "ItemToInsert", "Moved right", "CurrentPos"],
    note: "Each number bigger than ItemToInsert moves one place right to make room, then ItemToInsert drops into the gap.",
    code: function (n) {
      return [
        "DECLARE List : ARRAY[1:" + n + "] OF INTEGER",
        "DECLARE Pointer : INTEGER",
        "DECLARE CurrentPos : INTEGER",
        "DECLARE ItemToInsert : INTEGER",
        "FOR Pointer " + ARROW + " 2 TO " + n,
        "    ItemToInsert " + ARROW + " List[Pointer]",
        "    CurrentPos " + ARROW + " Pointer",
        "    WHILE CurrentPos > 1 AND List[CurrentPos - 1] > ItemToInsert DO",
        "        List[CurrentPos] " + ARROW + " List[CurrentPos - 1]",
        "        CurrentPos " + ARROW + " CurrentPos - 1",
        "    ENDWHILE",
        "    List[CurrentPos] " + ARROW + " ItemToInsert",
        "NEXT Pointer"
      ];
    },
    start: function (list) {
      s.list = list;
      s.pointer = 2;
      s.codeLine = [5, 7];
    },
    task: function () {
      return "<strong>Insertion sort</strong> builds a sorted part on the left. It takes the next number and slides it left past every bigger number. " +
        "Click the <strong>gap</strong> where the highlighted number belongs (the gap next to it means it stays put).";
    },
    stats: function () {
      return stat("Sorted", Math.min(s.pointer - 1, s.size) + " / " + s.size) + stat("Comparisons", s.comparisons) + stat("Moves", s.moves);
    },
    target: function () {
      var item = s.list[s.pointer - 1];
      var g = 0;
      for (var i = 0; i < s.pointer - 1; i++) if (s.list[i] < item) g = i + 1;
      return g;
    },
    board: function (root) {
      root.innerHTML = "";
      var row = document.createElement("div");
      row.className = "ap-row";
      row.style.gap = "10px";
      var hintGap = !s.finished && !s.busy && AP.reveal("insertion") > 0.9 ? insertion.target() : -1;
      s.list.forEach(function (v, i) {
        var pos = i + 1;
        if (!s.finished && pos <= s.pointer) {
          var gap = document.createElement("button");
          gap.type = "button";
          gap.className = "ap-gap" + (hintGap === i ? " is-hint" : "");
          gap.setAttribute("aria-label", i === 0 ? "Put it first" : "Put it after " + s.list[i - 1]);
          gap.disabled = s.busy;
          (function (g) { gap.addEventListener("click", function () { insertion.place(g, gap); }); })(i);
          row.appendChild(gap);
        }
        var cls = s.finished || pos < s.pointer ? "is-sorted" : (pos === s.pointer ? "is-active" : "");
        row.appendChild(cell(v, cls, pos));
      });
      root.appendChild(row);
    },
    hint: function (r) {
      if (!r) return "";
      var item = s.list[s.pointer - 1];
      var bigger = s.list.slice(0, s.pointer - 1).filter(function (v) { return v > item; });
      if (r > 0.9) {
        return bigger.length
          ? "Slide " + item + " left past every bigger number: " + bigger.join(", ") + "."
          : "Nothing to its left is bigger than " + item + ", so it stays where it is.";
      }
      if (r > 0.5) return "Slide " + item + " left past every number bigger than it.";
      return "Compare it with the sorted numbers, starting from the right.";
    },
    place: function (g, gapEl) {
      if (s.finished || s.busy) return;
      var item = s.list[s.pointer - 1];
      var want = insertion.target();
      if (g !== want) {
        AP.record("insertion", false);
        AP.shake(document.querySelector(".ap-box.is-active"));
        if (g < want) {
          AP.feedback(s.list[g] + " is smaller than " + item + ", so " + item + " goes to its right.", "bad");
        } else {
          AP.feedback(s.list[g - 1] + " is bigger than " + item + ", so " + item + " goes to its left.", "bad");
        }
        renderHint();
        return;
      }
      AP.record("insertion", true);
      var moved = s.pointer - 1 - g;
      s.comparisons += moved + (g > 0 ? 1 : 0);
      s.moves += moved;
      s.list.splice(s.pointer - 1, 1);
      s.list.splice(g, 0, item);
      s.trace.push([s.pointer, item, moved, g + 1]);
      s.codeLine = 11;
      AP.feedback(moved
        ? moved + " number" + (moved === 1 ? "" : "s") + " moved right, and " + item + " went into position " + (g + 1) + "."
        : item + " was already bigger than everything before it, so it stays.", "good");
      s.pointer++;
      if (s.pointer > s.size) {
        finish("<strong>Sorted with " + s.comparisons + " comparisons and " + s.moves + " moves.</strong> " +
          (s.moves === 0 ? "An already sorted list needs no moves at all: each number is only compared once." :
            "A number far from its place costs many moves, which is why a reversed list is the worst case."));
        return;
      }
      render();
      s.codeLine = [5, 7];
    }
  };

  // ================= Merge sort =================
  var merge = {
    columns: ["Round", "Fronts compared", "Taken"],
    codeTitle: "How a merge works",
    note: "Merge sort is not on the 0478 syllabus, but merging two sorted lists shows why sorting can be much faster than bubble sort.",
    code: function () {
      return [
        "1. Split the list into single numbers.",
        "   A single number is already sorted.",
        "2. Merge neighbouring lists in pairs:",
        "   compare the front number of each list",
        "   and move the smaller one to the new list.",
        "3. When one list is empty, the rest of",
        "   the other list goes on the end.",
        "4. Repeat with the new lists until",
        "   only one list is left."
      ];
    },
    start: function (list) {
      s.round = 1;
      s.levels = [list.map(function (v) { return [v]; })];
      merge.beginRound();
    },
    beginRound: function () {
      var lists = s.levels[s.levels.length - 1];
      s.pairs = [];
      for (var i = 0; i < lists.length; i += 2) s.pairs.push(lists[i + 1] ? [lists[i].slice(), lists[i + 1].slice()] : [lists[i].slice()]);
      s.outputs = [];
      s.pairIdx = -1;
      merge.nextPair();
    },
    nextPair: function () {
      s.pairIdx++;
      // A list with no partner goes up unchanged.
      while (s.pairIdx < s.pairs.length && s.pairs[s.pairIdx].length === 1) {
        s.outputs.push(s.pairs[s.pairIdx][0]);
        s.pairIdx++;
      }
      if (s.pairIdx >= s.pairs.length) {
        s.levels.push(s.outputs);
        if (s.outputs.length === 1) {
          s.codeLine = [7, 8];
          finish("<strong>Sorted after " + s.round + " rounds of merging and " + s.comparisons + " comparisons.</strong> " +
            "Each round halves the number of lists, so " + s.size + " numbers need only " + s.round + " rounds.");
          return false;
        }
        s.round++;
        merge.beginRound();
        return true;
      }
      s.A = s.pairs[s.pairIdx][0];
      s.B = s.pairs[s.pairIdx][1];
      s.out = [];
      s.codeLine = [3, 4];
      return true;
    },
    task: function () {
      return "<strong>Merge sort</strong> splits the list into single numbers, then merges pairs of sorted lists into bigger sorted lists. " +
        "To merge, click whichever <strong>front number</strong> is smaller: it moves to the new list.";
    },
    stats: function () {
      return stat("Round", s.round) + stat("Comparisons", s.comparisons);
    },
    board: function (root) {
      root.innerHTML = "";
      var wrap = document.createElement("div");
      wrap.className = "ap-merge";
      // Every finished level, so the split and the merges stay visible.
      s.levels.forEach(function (lists, li) {
        var label = document.createElement("div");
        label.className = "ap-merge-label";
        label.textContent = li === 0 ? "Split into single numbers" : "After round " + li;
        wrap.appendChild(label);
        var level = document.createElement("div");
        level.className = "ap-merge-level";
        lists.forEach(function (list, idx) {
          var el = document.createElement("div");
          var current = !s.finished && li === s.levels.length - 1 && Math.floor(idx / 2) === s.pairIdx;
          el.className = "ap-list" + (current ? " is-current" : "") + (s.finished && li === s.levels.length - 1 ? " is-merged" : "");
          list.forEach(function (v) {
            var b = document.createElement("div");
            b.className = "ap-box" + (s.finished && li === s.levels.length - 1 ? " is-sorted" : "");
            b.textContent = v;
            el.appendChild(b);
          });
          level.appendChild(el);
        });
        wrap.appendChild(level);
      });
      if (!s.finished && s.outputs.length) {
        var soFar = document.createElement("div");
        soFar.className = "ap-merge-label";
        soFar.textContent = "Round " + s.round + " so far";
        wrap.appendChild(soFar);
        var doneLevel = document.createElement("div");
        doneLevel.className = "ap-merge-level";
        s.outputs.forEach(function (list) {
          var el = document.createElement("div");
          el.className = "ap-list is-merged";
          list.forEach(function (v) {
            var b = document.createElement("div");
            b.className = "ap-box";
            b.textContent = v;
            el.appendChild(b);
          });
          doneLevel.appendChild(el);
        });
        wrap.appendChild(doneLevel);
      }
      if (!s.finished) {
        var label = document.createElement("div");
        label.className = "ap-merge-label";
        label.textContent = "Round " + s.round + ": merging list " + (s.pairIdx * 2 + 1) + " and list " + (s.pairIdx * 2 + 2);
        wrap.appendChild(label);
        var work = document.createElement("div");
        work.className = "ap-merge-work";
        var smaller = merge.smallerSide();
        var hint = !s.busy && AP.reveal("merge") > 0.9 ? smaller : "";
        work.appendChild(merge.listEl(s.A, "A", hint === "A"));
        work.appendChild(merge.listEl(s.B, "B", hint === "B"));
        var arrow = document.createElement("div");
        arrow.className = "ap-merge-arrow";
        arrow.textContent = "into";
        work.appendChild(arrow);
        var out = document.createElement("div");
        out.className = "ap-list is-output";
        s.out.forEach(function (v) {
          var b = document.createElement("div");
          b.className = "ap-box is-picked";
          b.textContent = v;
          out.appendChild(b);
        });
        out.style.minWidth = (s.A.length + s.B.length + s.out.length) * 52 + 16 + "px";
        work.appendChild(out);
        wrap.appendChild(work);
      }
      root.appendChild(wrap);
    },
    listEl: function (list, side, hinted) {
      var el = document.createElement("div");
      el.className = "ap-list";
      list.forEach(function (v, i) {
        var b = document.createElement(i === 0 ? "button" : "div");
        b.className = "ap-box" + (i === 0 ? "" : " is-checked") + (i === 0 && hinted ? " is-hint" : "");
        b.textContent = v;
        if (i === 0) {
          b.type = "button";
          b.disabled = s.busy;
          b.setAttribute("aria-label", "Take " + v);
          b.addEventListener("click", function () { merge.take(side, b); });
        }
        el.appendChild(b);
      });
      if (!list.length) {
        var empty = document.createElement("div");
        empty.className = "ap-idx";
        empty.style.padding = "0 10px";
        empty.textContent = "empty";
        el.appendChild(empty);
      }
      return el;
    },
    smallerSide: function () {
      if (!s.A.length) return "B";
      if (!s.B.length) return "A";
      return s.A[0] <= s.B[0] ? "A" : "B";
    },
    hint: function (r) {
      if (!r || !s.A || !s.A.length || !s.B || !s.B.length) return "";
      var a = s.A[0], b = s.B[0];
      if (r > 0.9) return "Compare the fronts: " + a + " and " + b + ". The smaller is " + Math.min(a, b) + ".";
      if (r > 0.5) return "Compare the fronts: " + a + " and " + b + ".";
      return "Take the smaller of the two front numbers.";
    },
    take: function (side, el) {
      if (s.finished || s.busy) return;
      var want = merge.smallerSide();
      var a = s.A[0], b = s.B[0];
      if (side !== want) {
        AP.record("merge", false);
        AP.shake(el);
        AP.feedback((side === "A" ? a : b) + " is bigger than " + (side === "A" ? b : a) + ": take the smaller front number first.", "bad");
        renderHint();
        return;
      }
      AP.record("merge", true);
      s.comparisons++;
      var took = side === "A" ? s.A.shift() : s.B.shift();
      s.out.push(took);
      s.trace.push([s.round, a + " and " + b, took]);
      AP.feedback("", "");
      if (!s.A.length || !s.B.length) {
        // One side is empty: the rest of the other goes on the end.
        var rest = s.A.length ? s.A : s.B;
        s.busy = true;
        s.codeLine = [5, 6];
        AP.feedback(rest.length ? "One list is empty, so the rest (" + rest.join(", ") + ") goes on the end." : "", "info");
        render();
        setTimeout(function () {
          s.out = s.out.concat(rest);
          s.A = [];
          s.B = [];
          s.outputs.push(s.out);
          s.busy = false;
          AP.feedback("Merged into " + s.out.join(", ") + ".", "good");
          if (merge.nextPair()) render();
        }, rest.length ? 1200 : 300);
        return;
      }
      s.codeLine = [3, 4];
      render();
    }
  };

  var ALGOS = { bubble: bubble, insertion: insertion, merge: merge };

  // ---- Wiring ----
  AP.wireTabs(function (algo) { s.algo = algo; newRun(s.scenario === "random" ? "random" : s.scenario); });
  $("size").addEventListener("change", function () { newRun(s.scenario); });
  $("new-random").addEventListener("click", function () { newRun("random"); });
  $("new-sorted").addEventListener("click", function () { newRun("sorted"); });
  $("new-reversed").addEventListener("click", function () { newRun("reversed"); });
  AP.mountSupport(function () { render(); });
  document.addEventListener("keydown", function (e) {
    if (s.algo !== "bubble" || e.target.closest("select, input, textarea")) return;
    if (e.key === "s" || e.key === "S") bubble.decide(true);
    if (e.key === "l" || e.key === "L") bubble.decide(false);
  });

  var start = new URLSearchParams(location.search).get("algo");
  var tab = start && document.querySelector('.ap-tab[data-algo="' + start + '"]');
  if (tab && start !== "bubble") tab.click();
  else newRun("random");
})();
