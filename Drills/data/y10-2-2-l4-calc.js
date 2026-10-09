// Year 10, 2.2 L4 Activity 1: Calculate the Check Digit
// Loaded by Drills/index.html?drill=y10-2-2-l4-calc
// The two methods the 0478 papers use. Method 1 (0478/23 November 2022 Q3): add the five digits, divide by 10, the
// remainder is the check digit. Method 2 (0478/21 November 2025 Q6): multiply each digit by its position, total,
// MOD(Total, 11), and a remainder of 10 is X. Numbers are drawn at random and every answer is worked out by code.
// Every card has a "Walk me through it": a different number worked digit by digit, the line being worked highlighted
// and the running total shown, never giving this card's answer. Wrong options are the usual slips: the total itself,
// the number of tens, 10 take away the remainder, the other method, the weights the wrong way round, 10 for X.
DrillData.register("y10-2-2-l4-calc", {
  title: "Year 10, 2.2 L4: Calculate the Check Digit",
  subtitle: "Method 1 and Method 2",
  categories: [
    ["sum", "Method 1: Add the Digits"],
    ["pos", "Method 2: Multiply by Position"]
  ],
  cards: (function () {
    // ---- shared check digit helpers (the same block is in y10-2-2-l4-valid.js and y10-2-2-l4.js) ----
    function rnd(n) { return Math.floor(Math.random() * n); }
    function digits(n) { var s; do { s = ""; for (var i = 0; i < n; i++) s += rnd(10); } while (/^(.)\1*$/.test(s)); return s; }
    function sumTotal(s) { return s.split("").reduce(function (t, d) { return t + Number(d); }, 0); }
    function sumCheck(s) { return String(sumTotal(s) % 10); }
    function posTotal(s) { return s.split("").reduce(function (t, d, i) { return t + Number(d) * (i + 1); }, 0); }
    function revTotal(s) { return s.split("").reduce(function (t, d, i) { return t + Number(d) * (s.length - i); }, 0); }
    function modX(t) { var r = t % 11; return r === 10 ? "X" : String(r); }
    function posCheck(s) { return modX(posTotal(s)); }
    function spaced(s) { return s.split("").join(" "); }
    function numRe(a) {
      return a === "X" ? /^\s*(the\s+)?(check\s+digit\s*(is|[:=])?\s*)?(the\s+letter\s+)?x\s*$/i
        : new RegExp("^\\s*(the\\s+)?(check\\s+digit\\s*(is|[:=])?\\s*)?" + a + "\\s*$", "i");
    }
    function others(ans, list) {
      var o = [];
      list.forEach(function (x) { x = String(x); if (x !== String(ans) && o.indexOf(x) === -1 && o.length < 3) o.push(x); });
      return o;
    }
    // A different 5-digit number whose result is not this card's answer.
    function otherNumber(card, fn) { var s; do { s = digits(5); } while (s === card || fn(s) === fn(card)); return s; }
    // Method 1, digit by digit. typed: the check digit that was typed (compare at the end), or null.
    function walkSum(s, typed) {
      var lines = ["Number:  " + spaced(s)], st = [], t = 0;
      st.push({ text: "A different number: " + s + ". Method 1: add the digits, divide by 10, and the remainder is the check digit.", code: lines.slice(), hl: [0] });
      s.split("").forEach(function (x, i) {
        var before = t; t += Number(x);
        lines.push("Digit " + (i + 1) + ":  " + (i ? before + " + " + x + " = " + t : x));
        st.push({ text: i ? "Add digit " + (i + 1) + ", which is " + x + ", to the total." : "Start with digit 1, which is " + x + ".", code: lines.slice(), hl: [lines.length - 1], state: "Running total: " + t });
      });
      var q = Math.floor(t / 10), r = t % 10;
      lines.push(t + " ÷ 10 = " + q + " remainder " + r);
      st.push({ text: "Divide the total by 10. " + t + " is " + q + " tens with " + r + " left over.", code: lines.slice(), hl: [lines.length - 1], state: "Remainder: " + r });
      if (typed == null) {
        lines.push("Check digit: " + r); lines.push("Full number: " + s + r);
        st.push({ text: "The remainder is the check digit. It goes on the end of the number.", code: lines.slice(), hl: [lines.length - 2, lines.length - 1], state: "Check digit: " + r });
      } else {
        lines.push("Calculated: " + r + "   Typed: " + typed);
        st.push({ text: String(r) === String(typed) ? "Compare with the check digit that was typed. They match, so the code is accepted." : "Compare with the check digit that was typed. They are different, so the code is rejected and must be entered again.", code: lines.slice(), hl: [lines.length - 1] });
      }
      return st;
    }
    // Method 2, digit by digit. mode: "check", "total", or the typed check digit (compare at the end).
    function walkPos(s, mode) {
      var lines = ["Number:    " + spaced(s), "Position:  1 2 3 4 5"], st = [], t = 0;
      st.push({ text: "A different number: " + s + ". Method 2: multiply each digit by its position, then add.", code: lines.slice(), hl: [0, 1] });
      s.split("").forEach(function (x, i) {
        var p = Number(x) * (i + 1), before = t; t += p;
        lines.push("Digit " + (i + 1) + ":  " + x + " x " + (i + 1) + " = " + p);
        st.push({ text: "Digit " + (i + 1) + " is " + x + ". Its position is " + (i + 1) + ", so multiply: " + x + " x " + (i + 1) + " = " + p + ".", code: lines.slice(), hl: [lines.length - 1], state: "Running total: " + (i ? before + " + " + p + " = " + t : t) });
      });
      lines.push("Total: " + t);
      st.push({ text: "Every product is added: the total is " + t + ".", code: lines.slice(), hl: [lines.length - 1], state: "Total: " + t });
      if (mode === "total") return st;
      var k = Math.floor(t / 11), r = t % 11;
      lines.push("MOD(" + t + ", 11): " + k + " x 11 = " + (11 * k) + ", " + t + " - " + (11 * k) + " = " + r);
      st.push({ text: "MOD(Total, 11) is the remainder after dividing by 11. " + k + " elevens make " + (11 * k) + ", and " + r + " is left over.", code: lines.slice(), hl: [lines.length - 1], state: "Remainder: " + r });
      var cd = r === 10 ? "X" : String(r);
      if (r === 10) { lines.push("Remainder 10 is written as X"); st.push({ text: "The remainder is 10, which is two digits. The rule says the check digit is then X.", code: lines.slice(), hl: [lines.length - 1], state: "Check digit: X" }); }
      if (mode === "check") {
        lines.push("Full number: " + s + cd);
        st.push({ text: "The check digit goes on the end of the number.", code: lines.slice(), hl: [lines.length - 1], state: "Check digit: " + cd });
      } else {
        lines.push("Calculated: " + cd + "   Typed: " + mode);
        st.push({ text: cd === String(mode) ? "Compare with the check digit that was typed. They match, so the code is accepted." : "Compare with the check digit that was typed. They are different, so the code is rejected and must be entered again.", code: lines.slice(), hl: [lines.length - 1] });
      }
      return st;
    }
    // MOD(Total, 11) on its own, counting in elevens.
    function walkMod(t) {
      var lines = [], st = [], k = 0;
      st.push({ text: "A different total: " + t + ". MOD(" + t + ", 11) is the remainder after dividing by 11. Count up in elevens.", code: ["Total: " + t], hl: [0] });
      lines.push("Total: " + t);
      while (11 * (k + 1) <= t) {
        k++;
        lines.push(k + " x 11 = " + (11 * k));
        st.push({ text: k === 1 ? "One eleven is 11." : k + " elevens make " + (11 * k) + ". Still not more than " + t + ".", code: lines.slice(), hl: [lines.length - 1], state: k + " elevens so far" });
      }
      lines.push((k + 1) + " x 11 = " + (11 * (k + 1)) + "  (too big)");
      st.push({ text: "One more eleven would be " + (11 * (k + 1)) + ", which is more than " + t + ". So stop at " + k + " elevens.", code: lines.slice(), hl: [lines.length - 1] });
      var r = t - 11 * k;
      lines.push(t + " - " + (11 * k) + " = " + r);
      st.push({ text: "Take away: " + t + " - " + (11 * k) + " = " + r + ". That is the remainder.", code: lines.slice(), hl: [lines.length - 1], state: "Remainder: " + r });
      if (r === 10) { lines.push("Remainder 10 is written as X"); st.push({ text: "The remainder is 10, so the check digit is X.", code: lines.slice(), hl: [lines.length - 1], state: "Check digit: X" }); }
      return st;
    }
    // ---- end of shared helpers ----
    var FORMAT = "Type the check digit";
    var M1 = "Method 1: add the five digits, divide the total by 10, and the remainder is the check digit.";
    var M2 = "Method 2: multiply each digit by its position (the first digit is position 1), add the results, then MOD(Total, 11). A result of 10 is written as X.";
    return [
      // ------------------------------------------------ Method 1
      { id: "c-01", category: "sum", randomize: function () {
          var s = digits(5), t = sumTotal(s), r = t % 10, w = otherNumber(s, sumCheck);
          return { prompt: M1 + "\nNumber: " + s + "\nWhat is the check digit?", answers: [String(r)], keywords: [numRe(String(r))], format: FORMAT,
            distractors: others(r, [(10 - r) % 10, t, Math.floor(t / 10), (r + 1) % 10, (r + 9) % 10, (r + 2) % 10]),
            walk: walkSum(w), working: ["Add the five digits, one at a time.", "Divide the total by ten. What is left over?"],
            note: spaced(s).replace(/ /g, " + ") + " = " + t + ". " + t + " ÷ 10 = " + Math.floor(t / 10) + " remainder " + r + ", so the check digit is " + r + " and the full number is " + s + r + "." };
        } },
      { id: "c-02", category: "sum", randomize: function () {
          var s = digits(5), t = sumTotal(s), r = t % 10, w = otherNumber(s, sumTotal);
          var st = walkSum(w).slice(0, 6);
          return { prompt: M1 + "\nNumber: " + s + "\nStep 1: what is the total of the five digits?", answers: [String(t)], keywords: [drillNumberRe(t, "total")], format: "Type the total",
            distractors: others(t, [t + 1, t - 1, r, t + 10, t - 2]),
            walk: st, working: ["Start with the first digit.", "Add each digit to the running total, left to right."],
            note: spaced(s).replace(/ /g, " + ") + " = " + t + "." };
        } },
      // ------------------------------------------------ Method 2
      { id: "c-03", category: "pos", randomize: function () {
          var s;
          do { s = digits(5); } while (posCheck(s) !== "X" && Math.random() < 0.2); // a few more X answers
          var t = posTotal(s), a = posCheck(s), w = otherNumber(s, posCheck);
          return { prompt: M2 + "\nNumber: " + s + "\nWhat is the check digit?", answers: [a], keywords: [numRe(a)], format: "Type the check digit (a digit or X)",
            distractors: others(a, [a === "X" ? "10" : t, sumCheck(s), modX(revTotal(s)), String(t % 10), String(Math.floor(t / 11)), "0"]),
            walk: walkPos(w, "check"), working: ["Multiply each digit by its position, then add the five results.", "Find the remainder after dividing the total by eleven."],
            note: s.split("").map(function (d, i) { return d + " x " + (i + 1); }).join(" + ") + " = " + t + ". MOD(" + t + ", 11) = " + (t % 11) + (a === "X" ? ", which is written as X." : ", so the check digit is " + a + ".") };
        } },
      { id: "c-04", category: "pos", randomize: function () {
          var s = digits(5), t = posTotal(s), w = otherNumber(s, posTotal);
          return { prompt: "Method 2: multiply each digit by its position (the first digit is position 1), then add the results.\nNumber: " + s + "\nWhat is the total?", answers: [String(t)], keywords: [drillNumberRe(t, "total")], format: "Type the total",
            distractors: others(t, [sumTotal(s), revTotal(s), t + 1, t - 1, t + 2]),
            walk: walkPos(w, "total"), working: ["The first digit is multiplied by one, the second by two, and so on.", "Add the five products."],
            note: s.split("").map(function (d, i) { return d + " x " + (i + 1); }).join(" + ") + " = " + t + "." };
        } },
      { id: "c-05", category: "pos", randomize: function () {
          var t, a, w;
          do { t = drillRange(20, 99); } while (t % 11 !== 10 && Math.random() < 0.15);
          a = modX(t);
          do { w = drillRange(20, 99); } while (w === t || modX(w) === a);
          return { prompt: "Method 2. The total is " + t + ".\nWhat is the check digit? MOD(Total, 11) is the remainder after dividing by 11, and 10 is written as X.", answers: [a], keywords: [numRe(a)], format: "Type the check digit (a digit or X)",
            distractors: others(a, [a === "X" ? "10" : String(t % 10), String(t % 10), String(Math.floor(t / 11)), String((11 - (t % 11)) % 11), String(t)]),
            walk: walkMod(w), working: ["Count up in elevens until the next one would be too big.", "Take that away from the total. Ten is written as X."],
            note: Math.floor(t / 11) + " x 11 = " + 11 * Math.floor(t / 11) + ". " + t + " - " + 11 * Math.floor(t / 11) + " = " + (t % 11) + (a === "X" ? ", which is written as X." : ", so the check digit is " + a + ".") };
        } }
    ];
  })()
});
