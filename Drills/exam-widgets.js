// Exam-format drill cards that a list of options can't express (the site mirror of the class game's Exam Race,
// mp4party ExamDeck.cs). A card with `widget: "trace"` or `widget: "errorline"` is drawn and marked here; engine.js
// only mounts it, then scores the result like any other card.
//
//   trace:     the paper's trace table with every column but one filled in from the mark scheme; the student fills
//              that one column (a different one each time the card comes up). The test data is numbered in the
//              order it is read, and the same number sits on the cell that read each value. A column is right when
//              its values, top to bottom, match the mark scheme's (row placement and blank rows don't matter), which
//              is how the mark scheme gives the mark.
//   errorline: click the numbered line with an error, then rewrite it. Any of the card's errors counts; spacing,
//              capitals and the arrow (<- or ←) don't matter.
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function cellNorm(s) {
    var t = String(s == null ? "" : s).trim().replace(/^["“”']+|["“”']+$/g, "").replace(/\s+/g, " ").toLowerCase();
    return t !== "" && !isNaN(Number(t)) ? String(Number(t)) : t;
  }
  function codeNorm(s) {
    return String(s == null ? "" : s).replace(/←/g, "<").replace(/<-/g, "<").replace(/≠/g, "<>")
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, "").toLowerCase();
  }
  function columnValues(rows, c) {
    return rows.map(function (r) { return r[c] == null ? "" : String(r[c]); })
      .filter(function (v) { return v.trim() !== ""; }).map(cellNorm);
  }
  function rawColumn(rows, c) {
    return rows.map(function (r) { return String(r[c] == null ? "" : r[c]).trim(); }).filter(function (v) { return v !== ""; }).join(", ");
  }
  function numbered(lines) {
    var w = String(lines.length).length;
    return lines.map(function (l, i) { var n = String(i + 1); while (n.length < w) n = "0" + n; return n; });
  }

  // ---- trace table, one column ----
  function mountTrace(card, box, api) {
    var t = card.trace, cols = t.columns, rows = t.rows, pre = t.prefilled || null;
    var k = t.askable[Math.floor(Math.random() * t.askable.length)];
    var grid = rows.map(function (r, i) { return r.map(function (_, c) { return pre && pre[i][c] ? pre[i][c] : ""; }); });
    var html = "";
    if (t.testData && t.testData.length) {
      var read = t.read == null ? t.testData.length : t.read;
      html += '<div class="xw-testdata"><span class="xw-label">Test data, in the order it is read:</span>' +
        t.testData.map(function (v, i) {
          return i < read ? '<span class="xw-chip"><span class="xw-tag">' + (i + 1) + "</span>" + esc(v) + "</span>"
            : '<span class="xw-chip unread" title="Never read: the algorithm stops before this value">' + esc(v) + "</span>";
        }).join("") + (read < t.testData.length ? '<span class="xw-label">(greyed: never read, the algorithm stops first)</span>' : "") + "</div>";
    }
    html += '<p class="xw-ask">The other columns are filled in. Complete the <b>' + esc(cols[k]) + "</b> column. Leave a cell empty when it doesn't change on that row.</p>";
    html += '<div class="xw-scroll"><table class="xw-trace"><thead><tr>' +
      cols.map(function (h, c) { return '<th class="' + (c === k ? "focus" : "") + '">' + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (r, i) {
      html += "<tr>" + r.map(function (v, c) {
        if (c === k && !(pre && pre[i][c])) return '<td class="focus"><input type="text" autocomplete="off" spellcheck="false" data-r="' + i + '" aria-label="' + esc(cols[k]) + ", row " + (i + 1) + '"></td>';
        var shown = c === k ? pre[i][c] : v;
        var tag = t.tags && t.tags[i] && t.tags[i][c] && c !== k ? '<span class="xw-tag">' + t.tags[i][c] + "</span>" : "";
        return '<td class="fixed">' + esc(shown) + tag + "</td>";
      }).join("") + "</tr>";
    });
    html += "</tbody></table></div>";
    box.innerHTML = html;
    var inputs = box.querySelectorAll("input");
    Array.prototype.forEach.call(inputs, function (inp, idx) {
      inp.addEventListener("input", function () { grid[+inp.getAttribute("data-r")][k] = inp.value; });
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); api.submit(); }
        else if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); if (inputs[idx + 1]) inputs[idx + 1].focus(); else api.submit(); }
        else if (e.key === "ArrowUp" && inputs[idx - 1]) { e.preventDefault(); inputs[idx - 1].focus(); }
      });
    });
    if (inputs[0]) setTimeout(function () { inputs[0].focus(); }, 30);
    return {
      check: function () {
        var right = JSON.stringify(columnValues(grid, k)) === JSON.stringify(columnValues(rows, k));
        Array.prototype.forEach.call(inputs, function (inp) { inp.disabled = true; });
        box.querySelector("th.focus").classList.add(right ? "ok" : "no");
        var fb = right ? "Correct: the " + esc(cols[k]) + " column matches the mark scheme." :
          "Not quite. The " + esc(cols[k]) + " column should be: <b>" + esc(rawColumn(rows, k)) + "</b>. You wrote: " + esc(rawColumn(grid, k) || "(nothing)") + ".";
        if (!right) fb += '<span class="note">The mark scheme\'s full table:</span>' + fullTable(cols, rows, k);
        return { right: right, html: fb };
      },
      // Help shows how to start this column (its first value and where it goes), then how to carry on.
      hint: (function () {
        for (var i = 0; i < rows.length; i++) {
          var v = String(rows[i][k] == null ? "" : rows[i][k]).trim();
          if (v && !(pre && pre[i][k])) {
            return "Start at the top of the algorithm and follow it one line at a time, using the filled-in columns to keep your place. " +
              cols[k] + " first gets the value " + v + ", on row " + (i + 1) + ". After that, write a new value only on the row where " +
              cols[k] + " changes, and leave the cell empty when it does not.";
          }
        }
        return "Follow the algorithm one line at a time. Write a value in the " + cols[k] + " column only on the row where it changes.";
      })()
    };
  }
  function fullTable(cols, rows, k) {
    return '<div class="xw-scroll"><table class="xw-trace result"><thead><tr>' +
      cols.map(function (h, c) { return '<th class="' + (c === k ? "focus" : "") + '">' + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (v, c) { return '<td class="' + (c === k ? "focus" : "") + '">' + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>";
  }

  // ---- find the error line and correct it ----
  function mountErrorLine(card, box, api) {
    var e = card.errorline, lines = e.code.split("\n"), nums = numbered(lines), chosen = 0;
    box.innerHTML = '<p class="xw-ask">Click the line with the error, then rewrite it correctly.</p>' +
      '<div class="xw-lines">' + lines.map(function (l, i) {
        return '<div class="xw-line" role="button" tabindex="0" data-line="' + (i + 1) + '"><span class="xw-num">' + nums[i] + "</span>" + esc(l) + "</div>";
      }).join("") + "</div>" +
      '<div class="xw-fix" hidden><label class="xw-label" for="xw-fix-input"></label>' +
      '<input type="text" id="xw-fix-input" autocomplete="off" spellcheck="false" autocapitalize="off"></div>';
    var fixBox = box.querySelector(".xw-fix"), input = box.querySelector("#xw-fix-input"), label = box.querySelector(".xw-fix label");
    Array.prototype.forEach.call(box.querySelectorAll(".xw-line"), function (el) {
      function pick() {
        if (api.checked()) return;
        Array.prototype.forEach.call(box.querySelectorAll(".xw-line"), function (x) { x.classList.remove("chosen"); });
        el.classList.add("chosen");
        chosen = +el.getAttribute("data-line");
        fixBox.hidden = false;
        label.textContent = "Line " + nums[chosen - 1] + " rewritten correctly (Enter to check):";
        input.value = lines[chosen - 1].trim();
        setTimeout(function () { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 0);
      }
      el.addEventListener("click", pick);
      el.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
    });
    input.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); api.submit(); } });
    return {
      check: function () {
        if (!chosen) return { error: "Click the line with the error first." };
        if (!input.value.trim()) return { error: "Rewrite the line first." };
        var fix = codeNorm(input.value);
        var right = e.errors.some(function (er) { return er.line === chosen && er.fixes.some(function (f) { return codeNorm(f) === fix; }); });
        input.disabled = true;
        var list = e.errors.map(function (er) { return "<li>Line " + nums[er.line - 1] + ": <code>" + esc(er.fixes.join("  or  ")) + "</code></li>"; }).join("");
        return {
          right: right,
          html: (right ? "Correct." : "Not quite. You changed line " + nums[chosen - 1] + " to <code>" + esc(input.value.trim()) + "</code>.") +
            '<span class="note">The mark scheme\'s corrections:</span><ul class="xw-fixes">' + list + "</ul>"
        };
      },
      // Help points at the line of one error, then says what to compare it with.
      hint: "One error is on line " + nums[e.errors[0].line - 1] + ". Read the question again and compare that line with what the algorithm " +
        "should do: is it using the right variable, the right comparison (<, <=, >, >=, =, <>), the right value, and the right arithmetic? " +
        "Rewrite the line so it does what the question describes."
    };
  }

  global.ExamWidgets = {
    mount: function (card, box, api) {
      if (card.widget === "trace") return mountTrace(card, box, api);
      if (card.widget === "errorline") return mountErrorLine(card, box, api);
      return null;
    }
  };
})(typeof window !== "undefined" ? window : this);
