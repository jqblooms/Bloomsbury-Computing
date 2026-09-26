// Shared by the searching and sorting pages: small DOM helpers, the
// pseudocode panel, the trace table, feedback, and support mode.
window.AP = (function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  function randomInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  // `count` different whole numbers from 10 to 99.
  function uniqueNumbers(count) {
    var seen = {};
    var out = [];
    while (out.length < count) {
      var n = randomInt(10, 99);
      if (!seen[n]) { seen[n] = true; out.push(n); }
    }
    return out;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- Pseudocode panel ----
  var KEYWORDS = /\b(DECLARE|INTEGER|BOOLEAN|ARRAY|OF|WHILE|DO|ENDWHILE|IF|THEN|ELSE|ENDIF|FOR|TO|NEXT|REPEAT|UNTIL|OUTPUT|AND|OR|NOT|TRUE|FALSE|DIV)\b/g;
  function highlight(line) {
    var parts = line.split(/("[^"]*")/);
    return parts.map(function (p) {
      if (/^"/.test(p)) return '<span class="str">' + esc(p) + "</span>";
      return esc(p).replace(KEYWORDS, '<span class="kw">$1</span>');
    }).join("");
  }
  // lines: array of strings. active: index or array of indexes to light up.
  function renderCode(container, lines, active) {
    var on = {};
    [].concat(active == null ? [] : active).forEach(function (i) { on[i] = true; });
    container.innerHTML = lines.map(function (l, i) {
      return '<span class="ln' + (on[i] ? " is-on" : "") + '">' + (highlight(l) || " ") + "</span>";
    }).join("");
    var lit = container.querySelector(".is-on");
    if (lit && lit.scrollIntoView) {
      var top = lit.offsetTop, bottom = top + lit.offsetHeight;
      if (top < container.scrollTop || bottom > container.scrollTop + container.clientHeight) lit.scrollIntoView({ block: "nearest" });
    }
  }

  // ---- Trace table ----
  function renderTrace(container, columns, rows) {
    if (!rows.length) {
      container.innerHTML = '<div class="ap-trace-empty">Each step you take is written here.</div>';
      return;
    }
    container.innerHTML = '<table class="ap-trace"><thead><tr>' +
      columns.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      rows.map(function (r, i) {
        return '<tr class="' + (i === rows.length - 1 ? "is-new" : "") + '">' +
          r.map(function (v) { return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table>";
    container.scrollTop = container.scrollHeight;
  }

  function feedback(text, kind) {
    var el = $("feedback");
    el.textContent = text || "";
    el.className = "ap-feedback" + (kind ? " " + kind : "");
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  // ---- Support mode (shared/bc-support.js) ----
  // One site-wide switch. Each skill fades on its own: 3 right in a row
  // shows less, 2 wrong shows more again.
  var Support = window.BCSupport || null;
  var faders = {};
  function fader(key) {
    if (!Support) return null;
    if (!faders[key]) faders[key] = Support.fader("algorithms:" + key);
    return faders[key];
  }
  function supportOn() { return !!(Support && Support.isOn()); }
  function reveal(key) { var f = fader(key); return supportOn() && f ? f.reveal() : 0; }
  function record(key, right) {
    var f = fader(key);
    if (!supportOn() || !f) return;
    if (right) f.correct(); else f.wrong();
  }
  function showHint(html) {
    var el = $("hint");
    el.innerHTML = html || "";
    el.classList.toggle("show", !!html);
  }
  function mountSupport(onChange) {
    if (!Support) return;
    Support.mountToggle($("support-slot"), "Support");
    Support.onChange(onChange);
  }

  // ---- Tabs ----
  function wireTabs(onPick) {
    Array.prototype.forEach.call(document.querySelectorAll(".ap-tab"), function (tab) {
      tab.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll(".ap-tab"), function (t) {
          t.classList.toggle("is-active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        onPick(tab.dataset.algo);
      });
    });
  }

  return {
    $: $, esc: esc, randomInt: randomInt, uniqueNumbers: uniqueNumbers, shuffle: shuffle,
    renderCode: renderCode, renderTrace: renderTrace, feedback: feedback, shake: shake,
    reveal: reveal, record: record, showHint: showHint, supportOn: supportOn, mountSupport: mountSupport,
    wireTabs: wireTabs
  };
})();
