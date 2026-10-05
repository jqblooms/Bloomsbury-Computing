// Year 10, 2.2 L2 Activity 2: Be the Receiver (checksums)
// Loaded by Drills/index.html?drill=y10-2-2-l2-checksum
// Random data values: be the sender and calculate the checksum, then be the receiver: recalculate it, compare it
// and decide. The checksum algorithm is the lesson's: add up the data values. Every answer is worked out by code.
// Each card has a worked example with different values, then two nudges.
DrillData.register("y10-2-2-l2-checksum", {
  title: "Year 10, 2.2 L2: Be the Receiver",
  subtitle: "Checksum practice",
  categories: [
    ["ck-send", "Be the Sender"],
    ["ck-receive", "Be the Receiver"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function values(n) { var a = []; for (var i = 0; i < n; i++) a.push(10 + rnd(50)); return a; }
    function sum(a) { return a.reduce(function (t, v) { return t + v; }, 0); }
    // A received packet: the data (perhaps with one value changed on the way) and the checksum that came with it.
    function received(n) {
      var v = values(n), cs = sum(v), got = v.slice(), bad = Math.random() < 0.5;
      if (bad) { var k = rnd(n); got[k] = got[k] + (Math.random() < 0.5 ? -1 : 1) * (1 + rnd(9)); }
      return { got: got, cs: cs, total: sum(got) };
    }
    var ALG = "The checksum algorithm adds up the data values.\n";
    return [
      // ------------------------------------------------ Be the Sender
      { id: "ck-01", category: "ck-send", randomize: function () {
          var v = values(3), ans = sum(v);
          return { prompt: ALG + "Data to send: " + v.join(", ") + "\nWhat checksum value is sent with the data?", answers: [String(ans)],
            keywords: [drillNumberRe(ans)], distractors: drillWrongNumbers(ans, [ans + 10, ans - 10, ans + 1], 3),
            example: "Example: data to send: 12, 30, 25.\nStep 1: add the first two values: 12 + 30 = 42.\nStep 2: add the next value: 42 + 25 = 67.\nStep 3: the checksum value is 67. It is sent with the data.",
            working: ["Add the first two values: " + v[0] + " + " + v[1] + ".", "Then add " + v[2] + "."],
            note: v.join(" + ") + " = " + ans + "." };
        } },
      { id: "ck-02", category: "ck-send", randomize: function () {
          var v = values(4);
          while (sum(v) === 108) v = values(4);
          var ans = sum(v);
          return { prompt: ALG + "Data to send: " + v.join(", ") + "\nWhat checksum value is sent with the data?", answers: [String(ans)],
            keywords: [drillNumberRe(ans)], distractors: drillWrongNumbers(ans, [ans + 10, ans - 10, ans - v[3]], 3),
            example: "Example: data to send: 21, 14, 33, 40.\nStep 1: 21 + 14 = 35.\nStep 2: 35 + 33 = 68.\nStep 3: 68 + 40 = 108.\nStep 4: the checksum value is 108. It is sent with the data.",
            working: ["Add the values one at a time, keeping a running total.", "Check you have added all four values."],
            note: v.join(" + ") + " = " + ans + "." };
        } },

      // ------------------------------------------------ Be the Receiver
      { id: "ck-03", category: "ck-receive", randomize: function () {
          var r = received(3), ans = r.total;
          return { prompt: ALG + "Data received: " + r.got.join(", ") + "\nChecksum received: " + r.cs + "\nYou are the receiver. Recalculate the checksum. What value do you get?", answers: [String(ans)],
            keywords: [drillNumberRe(ans)], distractors: drillWrongNumbers(ans, [r.cs === ans ? ans + 1 : r.cs, ans + 10, ans - 10], 3),
            example: "Example: data received: 18, 27, 31. Checksum received: 76.\nStep 1: use the same algorithm on the data received. Do not copy the checksum received.\nStep 2: 18 + 27 = 45.\nStep 3: 45 + 31 = 76.\nStep 4: the recalculated value is 76.",
            working: ["Use the same algorithm on the data received. Do not copy the checksum received.", "Add up " + r.got.join(", ") + "."],
            note: r.got.join(" + ") + " = " + ans + "." };
        } },
      { id: "ck-04", category: "ck-receive", randomize: function () {
          var r = received(drillPick([3, 4])), found = r.total !== r.cs;
          return { prompt: ALG + "Data received: " + r.got.join(", ") + "\nChecksum received: " + r.cs + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
            example: "Example: data received: 15, 22, 40. Checksum received: 79.\nStep 1: recalculate: 15 + 22 + 40 = 77.\nStep 2: compare: 77 and 79 are different.\nStep 3: different values mean the data changed on the way, so an error is detected.\nRule: same values = no error detected. Different values = error detected.",
            working: ["Recalculate the checksum from the data received.", "Compare it with the checksum received. Are they the same?"],
            note: "Recalculated: " + r.got.join(" + ") + " = " + r.total + ". Received: " + r.cs + ". " + (found ? "Different: an error is detected, so the data is sent again." : "The same: no error is detected.") };
        } }
    ];
  })()
});
