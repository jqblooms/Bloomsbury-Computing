// Year 10, 2.2 L2 Activity 1: Find the Error (parity blocks)
// Loaded by Drills/index.html?drill=y10-2-2-l2-block
// Practice on random parity blocks: check one row, complete one column of the parity byte, then find the byte and
// the bit of a changed bit where a failed row and a failed column cross. Every answer is worked out by code. Each
// card has a worked example on a different block, then two nudges.
DrillData.register("y10-2-2-l2-block", {
  title: "Year 10, 2.2 L2: Find the Error",
  subtitle: "Parity block practice",
  categories: [
    ["bk-row", "Check the Rows"],
    ["bk-col", "Check the Columns"],
    ["bk-find", "Find the Bit"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    function flip(s, k) { return s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1); }
    function column(rows, c) { return rows.map(function (r) { return r[c]; }).join(""); }
    function makeBlock(n, mode) {
      var rows = [];
      for (var i = 0; i < n; i++) { var d = bits(7); rows.push(parityBit(d, mode) + d); }
      var pbyte = ""; for (var c = 0; c < 8; c++) pbyte += parityBit(column(rows, c), mode);
      return { mode: mode, rows: rows, pbyte: pbyte };
    }
    function spaced(s) { return s.split("").join("  "); }
    function show(rows, pbyte, mode) {
      return (mode === "even" ? "Even" : "Odd") + " parity block. P is the parity bit.\n" +
        "             P  1  2  3  4  5  6  7\n" +
        rows.map(function (r, i) { return "Byte " + (i + 1) + "       " + spaced(r); }).join("\n") +
        "\nParity byte  " + spaced(pbyte);
    }
    function damaged(n) {
      var mode = drillPick(["even", "odd"]), b = makeBlock(n, mode), byte = rnd(n), bit = 1 + rnd(7);
      var rows = b.rows.slice(); rows[byte] = flip(rows[byte], bit);
      return { mode: mode, rows: rows, pbyte: b.pbyte, byte: byte + 1, bit: bit };
    }
    // The worked examples use one fixed even parity block: 00110000, 01100011, 11011110, parity byte 10001101.
    var EX_ROWS = ["00110000", "01100011", "11011110"], EX_PBYTE = "10001101";
    // Examples are laid out more compactly than the cards, so they never copy a card's own lines.
    function exShow(rows, pbyte) {
      return "Bits:   P 1 2 3 4 5 6 7\n" + rows.map(function (r, i) { return "Byte " + (i + 1) + ": " + r.split("").join(" "); }).join("\n") + "\nParity: " + pbyte.split("").join(" ");
    }
    return [
      // ------------------------------------------------ Check the Rows
      { id: "bk-01", category: "bk-row", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), r = parityBit(d, mode) + d, bad = Math.random() < 0.5;
          if (bad) r = flip(r, rnd(8));
          var ok = (ones(r) % 2 === 0) === (mode === "even");
          return { prompt: "One row of an " + mode + " parity block:\nByte 3   " + spaced(r) + "\nDoes this byte pass its row check? Yes or No?", answers: [ok ? "Yes" : "No"],
            keywords: [ok ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [ok ? "No" : "Yes"],
            example: "Example: one row of an odd parity block:\nByte 5   0  1  1  0  1  0  0  0\nStep 1: count every 1 in the row, including P: 1, 1, 1. That is 3.\nStep 2: odd parity needs an odd count.\nStep 3: 3 is odd, so this byte passes its row check.\nRule: count matches the parity = passes. Count does not match = fails.",
            working: ["Count every 1 in the row, including P.", "Is the count " + mode + "?"],
            note: "Byte 3 has " + ones(r) + " ones: " + (ones(r) % 2 === 0 ? "even" : "odd") + ". " + (ok ? "That matches " + mode + " parity: it passes." : "That does not match " + mode + " parity: it fails.") };
        } },
      { id: "bk-02", category: "bk-row", randomize: function () {
          var d = damaged(4), ans = String(d.byte);
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Which byte fails its row check?", answers: [ans],
            keywords: [drillNumberRe(d.byte, "byte")], distractors: [1, 2, 3, 4].filter(function (x) { return x !== d.byte; }).map(String),
            format: "Type the byte number",
            example: "Example: this even parity block arrived with one bit changed.\n" + exShow([EX_ROWS[0], "01101011", EX_ROWS[2]], EX_PBYTE) + "\nStep 1: count the 1s in Byte 1, including P: 2. Even, so it passes.\nStep 2: Byte 2: 5 ones. Odd, so it fails.\nStep 3: Byte 3: 6 ones. Even, so it passes.\nStep 4: only Byte 2 fails its row check, so the error is in Byte 2.",
            working: ["Count the 1s in each byte, one row at a time, including P.", "Which byte does not have an " + d.mode + " number of 1s?"],
            note: "Byte " + ans + " has " + ones(d.rows[d.byte - 1]) + " ones, which is not " + d.mode + "." };
        } },

      // ------------------------------------------------ Check the Columns
      { id: "bk-03", category: "bk-col", randomize: function () {
          var mode = drillPick(["even", "odd"]), b = makeBlock(4, mode), c = 1 + rnd(7), ans = b.pbyte[c];
          var shown = b.pbyte.slice(0, c) + "?" + b.pbyte.slice(c + 1);
          return { prompt: show(b.rows, shown, mode) + "\nWhat is the missing bit (?) in the parity byte?", answers: [ans], keywords: [new RegExp("^\\s*" + ans + "\\s*$")],
            distractors: [ans === "1" ? "0" : "1"],
            example: "Example: the block below uses even parity.\n" + exShow(EX_ROWS, "10001?01") + "\nStep 1: the ? is under Bit 5. Go DOWN that column: 0, 0, 1.\nStep 2: that is one 1. Even parity needs an even count.\nStep 3: a 1 makes two 1s, so the missing bit is 1.",
            working: ["The ? is under Bit " + c + ". Count the 1s going DOWN that column.", "Choose the bit that makes the column " + mode + "."],
            note: "Bit " + c + " column: " + column(b.rows, c) + " has " + ones(column(b.rows, c)) + " ones. The parity byte bit is " + ans + ", making it " + mode + "." };
        } },
      { id: "bk-04", category: "bk-col", randomize: function () {
          var d = damaged(4), ans = String(d.bit), col = column(d.rows, d.bit) + d.pbyte[d.bit];
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Which bit column fails its column check?", answers: [ans],
            keywords: [drillNumberRe(d.bit, "bit")], distractors: [d.bit + 1, d.bit - 1, d.bit + 2, d.bit - 2].filter(function (x) { return x >= 1 && x <= 7; }).map(String).slice(0, 3),
            format: "Type the bit number",
            example: "Example: one column of an odd parity block, going down, with the parity byte bit last: 1, 0, 1, 1, 0.\nStep 1: count the 1s: 1, 1, 1. That is 3.\nStep 2: odd parity needs an odd count. 3 is odd, so this column passes.\nStep 3: do this for every column. The column with the wrong count is the one with the error.",
            working: ["Count the 1s going DOWN each column, including the parity byte.", "Which column does not have an " + d.mode + " number of 1s?"],
            note: "The Bit " + ans + " column has " + ones(col) + " ones with the parity byte, which is not " + d.mode + "." };
        } },

      // ------------------------------------------------ Find the Bit
      { id: "bk-05", category: "bk-find", randomize: function () {
          var d = damaged(4);
          while (d.byte === 3 && d.bit === 6) d = damaged(4);
          var ans = "Byte " + d.byte + ", Bit " + d.bit;
          var rx = new RegExp("^\\s*(byte\\s*" + d.byte + "\\s*[,;:/&]?\\s*(and\\s+)?bit\\s*" + d.bit + "|bit\\s*" + d.bit + "\\s*[,;:/&]?\\s*(and\\s+)?byte\\s*" + d.byte + ")\\s*\\.?\\s*$", "i");
          var wrong = [];
          [[d.byte, d.bit === 7 ? 6 : d.bit + 1], [d.byte === 4 ? 3 : d.byte + 1, d.bit], [d.byte === 1 ? 2 : d.byte - 1, d.bit === 1 ? 2 : d.bit - 1]].forEach(function (t) {
            var s = "Byte " + t[0] + ", Bit " + t[1]; if (s !== ans && wrong.indexOf(s) < 0) wrong.push(s); });
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Give the byte number and the bit number.", answers: [ans],
            keywords: [rx], distractors: wrong, format: "Type it like: Byte 2, Bit 4",
            example: "Example: in an even parity block, Byte 3 is the only row with an odd count of 1s.\nStep 1: so the error is somewhere in Byte 3.\nStep 2: the Bit 6 column is the only column with an odd count of 1s.\nStep 3: so the error is somewhere in Bit 6.\nStep 4: the changed bit is where the row and the column cross: Byte 3, Bit 6.",
            working: ["Find the row (byte) that fails.", "Find the column (bit) that fails. The error is where they cross."],
            note: "Byte " + d.byte + " fails its row check and Bit " + d.bit + " fails its column check. The error is at Byte " + d.byte + ", Bit " + d.bit + "." };
        } },
      { id: "bk-06", category: "bk-find", randomize: function () {
          var d = damaged(5);
          var fixed = d.rows[d.byte - 1][d.bit] === "1" ? "0" : "1";
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Find it. What should that bit have been?", answers: [fixed],
            keywords: [new RegExp("^\\s*" + fixed + "\\s*$")], distractors: [fixed === "1" ? "0" : "1"],
            example: "Example: the error is found at Byte 2, Bit 3, and that bit arrived as 0.\nStep 1: a bit can only be 0 or 1.\nStep 2: it was changed on the way, so it must have been the other value.\nStep 3: it should have been 1. Changing it back makes the row and the column right again.",
            working: ["Find the failed row and the failed column. Look at the bit where they cross.", "That bit was changed. What is the other value a bit can be?"],
            note: "The error is at Byte " + d.byte + ", Bit " + d.bit + ". It arrived as " + d.rows[d.byte - 1][d.bit] + ", so it should have been " + fixed + "." };
        } }
    ];
  })()
});
