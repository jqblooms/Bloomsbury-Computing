// Year 10, 2.2 L4 Activity 2: Accept or Reject?
// Loaded by Drills/index.html?drill=y10-2-2-l4-valid
// Be the computer: a code is typed in (correctly, with one digit wrong, or with two neighbouring digits swapped), and
// the student recalculates the check digit with Method 1 (add the digits, remainder after dividing by 10; 0478/23
// November 2022 Q3) or Method 2 (multiply by position, MOD 11, 10 is X; 0478/21 November 2025 Q6) and accepts or
// rejects it. Then: name the error, and say which method finds it. Every answer is worked out by code. Every card has
// a "Walk me through it" on a different code. Wrong options are the usual mix-ups: the check digit corrects the error,
// the data is sent again (that is transmission), the adding method finds a swap.
DrillData.register("y10-2-2-l4-valid", {
  title: "Year 10, 2.2 L4: Accept or Reject?",
  subtitle: "Check digit practice",
  categories: [
    ["check", "Be the Computer"],
    ["error", "Which Error?"]
  ],
  cards: (function () {
    // ---- shared check digit helpers (the same block is in y10-2-2-l4-calc.js and y10-2-2-l4.js) ----
    function rnd(n) { return Math.floor(Math.random() * n); }
    function digits(n) { var s; do { s = ""; for (var i = 0; i < n; i++) s += rnd(10); } while (/^(.)\1*$/.test(s)); return s; }
    function sumTotal(s) { return s.split("").reduce(function (t, d) { return t + Number(d); }, 0); }
    function sumCheck(s) { return String(sumTotal(s) % 10); }
    function posTotal(s) { return s.split("").reduce(function (t, d, i) { return t + Number(d) * (i + 1); }, 0); }
    function modX(t) { var r = t % 11; return r === 10 ? "X" : String(r); }
    function posCheck(s) { return modX(posTotal(s)); }
    function spaced(s) { return s.split("").join(" "); }
    function walkSum(s, typed) {
      var lines = ["Number:  " + spaced(s)], st = [], t = 0;
      st.push({ text: "A different code. The first five digits are " + s + " and the check digit typed is " + typed + ". Method 1: add the digits, divide by 10, and the remainder is the check digit.", code: lines.slice(), hl: [0] });
      s.split("").forEach(function (x, i) {
        var before = t; t += Number(x);
        lines.push("Digit " + (i + 1) + ":  " + (i ? before + " + " + x + " = " + t : x));
        st.push({ text: i ? "Add digit " + (i + 1) + ", which is " + x + ", to the total." : "Start with digit 1, which is " + x + ".", code: lines.slice(), hl: [lines.length - 1], state: "Running total: " + t });
      });
      var q = Math.floor(t / 10), r = t % 10;
      lines.push(t + " ÷ 10 = " + q + " remainder " + r);
      st.push({ text: "Divide the total by 10. " + t + " is " + q + " tens with " + r + " left over.", code: lines.slice(), hl: [lines.length - 1], state: "Remainder: " + r });
      lines.push("Calculated: " + r + "   Typed: " + typed);
      st.push({ text: String(r) === String(typed) ? "Compare with the check digit that was typed. They match, so the code is accepted." : "Compare with the check digit that was typed. They are different, so the code is rejected and must be entered again.", code: lines.slice(), hl: [lines.length - 1] });
      return st;
    }
    function walkPos(s, typed) {
      var lines = ["Number:    " + spaced(s), "Position:  1 2 3 4 5"], st = [], t = 0;
      st.push({ text: "A different code. The first five digits are " + s + " and the check digit typed is " + typed + ". Method 2: multiply each digit by its position, then add.", code: lines.slice(), hl: [0, 1] });
      s.split("").forEach(function (x, i) {
        var p = Number(x) * (i + 1), before = t; t += p;
        lines.push("Digit " + (i + 1) + ":  " + x + " x " + (i + 1) + " = " + p);
        st.push({ text: "Digit " + (i + 1) + " is " + x + ". Multiply by its position: " + x + " x " + (i + 1) + " = " + p + ".", code: lines.slice(), hl: [lines.length - 1], state: "Running total: " + (i ? before + " + " + p + " = " + t : t) });
      });
      var k = Math.floor(t / 11), r = t % 11, cd = r === 10 ? "X" : String(r);
      lines.push("MOD(" + t + ", 11): " + k + " x 11 = " + (11 * k) + ", " + t + " - " + (11 * k) + " = " + r + (r === 10 ? ", written X" : ""));
      st.push({ text: "The total is " + t + ". " + k + " elevens make " + (11 * k) + ", and " + r + " is left over" + (r === 10 ? ", which is written as X." : "."), code: lines.slice(), hl: [lines.length - 1], state: "Calculated check digit: " + cd });
      lines.push("Calculated: " + cd + "   Typed: " + typed);
      st.push({ text: cd === String(typed) ? "Compare with the check digit that was typed. They match, so the code is accepted." : "Compare with the check digit that was typed. They are different, so the code is rejected and must be entered again.", code: lines.slice(), hl: [lines.length - 1] });
      return st;
    }
    // ---- end of shared helpers ----
    // One digit typed wrong, or two neighbouring different digits swapped, somewhere in the first five digits.
    function mistype(s, kind) {
      var a = s.split(""), i;
      if (kind === "wrong") { i = rnd(5); var d; do { d = String(rnd(10)); } while (d === a[i]); a[i] = d; }
      else if (kind === "swap") { do { i = rnd(4); } while (a[i] === a[i + 1]); var x = a[i]; a[i] = a[i + 1]; a[i + 1] = x; }
      else if (kind === "missing") { a.splice(rnd(5), 1); }
      return a.join("");
    }
    function marks(a, b) { var m = ""; for (var i = 0; i < Math.max(a.length, b.length); i++) m += a[i] === b[i] ? " " : "^"; return m; }
    var ACCEPT = /^(?!.*\b(not|reject\w*|invalid|don'?t|correct\w*|fix\w*|send\w*)\b).*\b(accept\w*|valid|ok|okay|fine|allow\w*|pass\w*)\b/i;
    var REJECT = /^(?!.*\b(correct\w*|fix\w*|send\w*)\b).*\b(reject\w*|invalid|not\s+(valid|accept\w*|ok)|refus\w*|error|re-?enter\w*|re-?typ\w*|re-?scan\w*|(type|enter|scan)\s+(it\s+|the\s+code\s+)?again)\b/i;
    var VERDICTS = ["Accept the code", "Reject the code", "Correct the wrong digit", "Send the code again"];
    function judge(method) {
      var calc = method === 1 ? sumCheck : posCheck;
      var base = digits(5), cd = calc(base), kind = drillPick(["ok", "ok", "wrong", "wrong", "swap", "swap"]);
      var typed = mistype(base, kind), ok = calc(typed) === cd;
      var wb = digits(5), wcd = Math.random() < 0.5 ? calc(wb) : drillPick(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].filter(function (x) { return x !== calc(wb); }));
      var ans = ok ? VERDICTS[0] : VERDICTS[1];
      var t = method === 1 ? sumTotal(typed) : posTotal(typed);
      return { prompt: (method === 1 ? "Method 1: add the first five digits, divide by 10, and the remainder is the check digit." : "Method 2: multiply each of the first five digits by its position, add the results, then MOD(Total, 11). 10 is written as X.") +
          "\nThis code is typed in: " + typed + cd + "\nThe last digit is the check digit. Does the computer accept or reject the code?",
        answers: [ans], keywords: [ok ? ACCEPT : REJECT], distractors: VERDICTS.filter(function (v) { return v !== ans; }),
        format: "Type: accept or reject",
        walk: method === 1 ? walkSum(wb, wcd) : walkPos(wb, wcd),
        working: ["Work out the check digit from the first five digits only.", "Compare it with the last digit that was typed."],
        note: "Calculated from " + typed + ": " + (method === 1 ? "total " + t + ", remainder " + (t % 10) : "total " + t + ", MOD 11 gives " + calc(typed)) + ". Typed check digit: " + cd + ". " +
          (ok ? "They match, so the code is accepted." + (kind === "swap" ? " Two digits were swapped, but Method 1 gives the same total, so it cannot see the error." : "") : "They are different, so the code is rejected and entered again. A check digit cannot correct the error.") };
    }
    var KINDS = { wrong: "One digit typed wrong", swap: "Two digits swapped", missing: "A digit missed out", ok: "No error" };
    var KIND_RE = {
      wrong: /^(?!.*\b(swap\w*|switch\w*|transpos\w*|order|places|miss\w*|left\s+out|omit\w*|no\s+error|none)\b).*\b(wrong|changed?|different|mistyp\w*|incorrect|typo)\b/i,
      swap: /^(?!.*\b(miss\w*|left\s+out|omit\w*|no\s+error)\b).*\b(swap\w*|switch\w*|transpos\w*|order|places|revers\w*|round|interchang\w*|mixed)\b/i,
      missing: /^(?!.*\b(swap\w*|switch\w*|transpos\w*|no\s+error)\b).*\b(miss\w*|left\s+out|omit\w*|forg[eo]t\w*|skipp?\w*|dropped|lost|short)\b/i,
      ok: /^\s*(no|none|nothing)\b|^(?=.*\b(correct|right|same|fine|ok)\b)(?!.*\b(wrong|swap\w*|miss\w*|changed)\b)/i
    };
    var WHICH = ["Both methods", "Only adding the digits", "Only multiplying by position", "Neither method"];
    var BOTH = /^(?!.*\b(neither|only|none)\b).*(\b(both|each|all\s+of\s+them|all\s+methods)\b|\badd\w*\b.*\bmultipl\w*|\bmultipl\w*\b.*\badd\w*)/i;
    var POSONLY = /^(?!.*\b(both|neither|add\w*|each)\b).*\b(multipl\w*|position\w*|method\s*2|second|weight\w*|times)\b/i;
    return [
      // ------------------------------------------------ Be the Computer
      { id: "v-01", category: "check", randomize: function () { return judge(1); } },
      { id: "v-02", category: "check", randomize: function () { return judge(2); } },
      // ------------------------------------------------ Which Error?
      { id: "v-03", category: "error", randomize: function () {
          var kind = drillPick(["wrong", "swap", "missing", "ok"]), base = digits(5), code = base + sumCheck(base);
          var typed = kind === "ok" ? code : mistype(base, kind) + code[5];
          var wk = drillPick(["wrong", "swap", "missing"]), wbase = digits(5), wcode = wbase + sumCheck(wbase), wtyped = mistype(wbase, wk) + wcode[5];
          var lines = ["Should be:  " + spaced(wcode), "Typed:      " + spaced(wtyped)];
          var walk = [
            { text: "A different code. Write the code that was typed under the code it should be.", code: lines.slice(), hl: [0, 1] },
            { text: "Compare them digit by digit, left to right. Mark every place where they are not the same.", code: lines.concat(["            " + spaced(marks(wcode, wtyped)).replace(/ (?= )/g, " ")]), hl: [2] },
            { text: "Count the marks, and look at the digits under them. " + (wk === "swap" ? "Two marks next to each other, and the same two digits in the other order." : wk === "wrong" ? "One mark: one digit is different." : "The typed code is shorter: every digit after the gap has moved one place left."), code: lines, hl: [1] },
            { text: "Rule: one digit different = one digit typed wrong. Two neighbours in the other order = two digits swapped. One digit fewer = a digit missed out. All the same = no error.", code: lines, hl: [0, 1] }
          ];
          return { prompt: "The code should be: " + code + "\nIt was typed as:    " + typed + "\nWhat went wrong?", answers: [KINDS[kind]], keywords: [KIND_RE[kind]],
            distractors: Object.keys(KINDS).filter(function (k) { return k !== kind; }).map(function (k) { return KINDS[k]; }),
            format: "Type: one digit wrong, two digits swapped, a digit missed out, or no error",
            walk: walk, working: ["Compare the two codes one digit at a time.", "How many places are different, and how?"],
            note: kind === "ok" ? "Every digit is the same: no error." : kind === "wrong" ? "One digit is different: one digit typed wrong." : kind === "swap" ? "Two neighbouring digits are in the other order: two digits swapped." : "The typed code is one digit shorter: a digit missed out." };
        } },
      { id: "v-04", category: "error", randomize: function () {
          var kind = drillPick(["wrong", "swap"]), base = digits(5), typed = mistype(base, kind);
          var m1 = sumCheck(typed) !== sumCheck(base), m2 = posCheck(typed) !== posCheck(base);
          if (m1 !== (kind === "wrong") || !m2) throw new Error("v-04: the methods did not behave as expected for " + base + " -> " + typed);
          var ans = m1 ? WHICH[0] : WHICH[2];
          var wk = drillPick(["wrong", "swap"]), wb = digits(5), wt = mistype(wb, wk);
          var lines = ["Should be:  " + wb, "Typed:      " + wt,
            "Method 1:  " + spaced(wb).replace(/ /g, "+") + " = " + sumTotal(wb) + ", remainder " + sumCheck(wb),
            "           " + spaced(wt).replace(/ /g, "+") + " = " + sumTotal(wt) + ", remainder " + sumCheck(wt),
            "Method 2:  total " + posTotal(wb) + ", MOD 11 = " + posCheck(wb),
            "           total " + posTotal(wt) + ", MOD 11 = " + posCheck(wt)];
          var walk = [
            { text: "A different number, typed wrongly. The first five digits only.", code: lines.slice(0, 2), hl: [0, 1] },
            { text: "Method 1: add the digits of both. Do the remainders differ?", code: lines.slice(0, 4), hl: [2, 3], state: sumCheck(wb) === sumCheck(wt) ? "Same remainder: Method 1 does not find it" : "Different remainders: Method 1 finds it" },
            { text: "Method 2: multiply by position and add, for both. Do the results differ?", code: lines, hl: [4, 5], state: posCheck(wb) === posCheck(wt) ? "Same result: Method 2 does not find it" : "Different results: Method 2 finds it" },
            { text: "A method finds the error when its result for the typed number is different from the check digit. Now check both methods on your number.", code: lines, hl: [0, 1] }
          ];
          return { prompt: "The number should be " + base + ". It was typed as " + typed + ".\nMethod 1 adds the digits. Method 2 multiplies each digit by its position.\nWhich method finds this error: both methods, only adding the digits, only multiplying by position, or neither method?",
            answers: [ans], keywords: [m1 ? BOTH : POSONLY], distractors: WHICH.filter(function (w) { return w !== ans; }),
            format: "Type: both, only adding, only multiplying, or neither",
            walk: walk, working: ["Work out the Method 1 remainder for both numbers, then the Method 2 result for both.", "A method finds the error if its two results are different."],
            note: "Method 1: " + sumCheck(base) + " and " + sumCheck(typed) + (m1 ? " (different, found)" : " (the same, missed)") + ". Method 2: " + posCheck(base) + " and " + posCheck(typed) + " (different, found). " +
              (m1 ? "One wrong digit changes the total, so both methods find it." : "A swap keeps the same total, so only multiplying by position finds it.") };
        } }
    ];
  })()
});
