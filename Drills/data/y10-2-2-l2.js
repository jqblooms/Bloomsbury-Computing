// Year 10, 2.2 L2: Parity Blocks and Checksums (Plenary)
// Loaded by Drills/index.html?drill=y10-2-2-l2
// Completing a parity byte, finding the bit in error from the row and column checks, what a parity block finds
// that a parity byte check misses, and the checksum: calculate it, recalculate it, compare. Syllabus 0478 2.2 2
// (parity byte and parity block check, checksum). Every block and every set of values is drawn at random and every
// answer is worked out by code. Blocks are laid out as in the exam: the parity bit first, then Bit 1 to Bit 7, with
// the parity byte as the last row. The checksum algorithm is the lesson's: add up the data values.
DrillData.register("y10-2-2-l2", {
  title: "Year 10, 2.2 L2: Parity Blocks and Checksums",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["pb-byte", "The Parity Byte"],
    ["pb-find", "Finding the Error"],
    ["cs-calc", "Checksum: Calculate and Compare"],
    ["cs-why", "Describing the Checks"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    function flip(s, k) { return s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1); }
    function word(w) { return new RegExp("^\\s*[\"']?\\s*" + w + "\\s*[\"']?\\s*\\.?\\s*$", "i"); }
    // A block: n bytes, each a parity bit then 7 data bits, and the parity byte that checks each column.
    function makeBlock(n, mode) {
      var rows = [];
      for (var i = 0; i < n; i++) { var d = bits(7); rows.push(parityBit(d, mode) + d); }
      return { mode: mode, rows: rows, pbyte: columnByte(rows, mode) };
    }
    function column(rows, c) { return rows.map(function (r) { return r[c]; }).join(""); }
    function columnByte(rows, mode) { var s = ""; for (var c = 0; c < 8; c++) s += parityBit(column(rows, c), mode); return s; }
    function spaced(s) { return s.split("").join("  "); }
    function show(rows, pbyte, mode) {
      return (mode === "even" ? "Even" : "Odd") + " parity block. P is the parity bit.\n" +
        "             P  1  2  3  4  5  6  7\n" +
        rows.map(function (r, i) { return "Byte " + (i + 1) + "       " + spaced(r); }).join("\n") +
        "\nParity byte  " + spaced(pbyte);
    }
    // A block that arrived with one data bit changed (bytes 1 to n, bits 1 to 7).
    function damaged(n) {
      var mode = drillPick(["even", "odd"]), b = makeBlock(n, mode), byte = rnd(n), bit = 1 + rnd(7);
      var rows = b.rows.slice(); rows[byte] = flip(rows[byte], bit);
      return { mode: mode, rows: rows, pbyte: b.pbyte, byte: byte + 1, bit: bit };
    }
    function sum(a) { return a.reduce(function (t, v) { return t + v; }, 0); }
    function values(n) { var a = []; for (var i = 0; i < n; i++) a.push(10 + rnd(50)); return a; }
    return [
      // ------------------------------------------------ The Parity Byte
      { id: "pl-01", category: "pb-byte", randomize: function () {
          var mode = drillPick(["even", "odd"]), b = makeBlock(4, mode), c = 1 + rnd(7), ans = b.pbyte[c];
          var shown = b.pbyte.slice(0, c) + "?" + b.pbyte.slice(c + 1);
          return { prompt: show(b.rows, shown, mode) + "\nWhat is the missing bit (?) in the parity byte?", answers: [ans], keywords: [new RegExp("^\\s*" + ans + "\\s*$")],
            distractors: [ans === "1" ? "0" : "1"],
            working: ["The ? is under Bit " + c + ". Count the 1s going DOWN that column, in Byte 1 to Byte 4.", mode.charAt(0).toUpperCase() + mode.slice(1) + " parity: the column, with the parity byte bit, must have an " + mode + " number of 1s."],
            note: "Bit " + c + " column: " + column(b.rows, c) + " has " + ones(column(b.rows, c)) + " ones. The parity byte bit is " + ans + ", making " + (ones(column(b.rows, c)) + Number(ans)) + ": " + mode + "." };
        } },
      { id: "pl-02", category: "pb-byte", randomize: function () {
          var mode = drillPick(["even", "odd"]), b = makeBlock(3, mode), ans = b.pbyte;
          var wrong = [flip(ans, 1 + rnd(7)), flip(ans, 0), ans.split("").map(function (x) { return x === "1" ? "0" : "1"; }).join("")].filter(function (x, i, all) { return x !== ans && all.indexOf(x) === i; });
          return { prompt: show(b.rows, "????????", mode) + "\nComplete the parity byte. Type all 8 bits, P first.", answers: [ans],
            keywords: [new RegExp("^\\s*" + ans.split("").join("\\s*") + "\\s*$")], distractors: wrong, format: "Type 8 bits",
            working: ["Work one column at a time, going DOWN. Start with the P column.", "For each column, count the 1s. Choose the bit that makes the count " + mode + "."],
            note: "Each bit of the parity byte makes its column " + mode + ". The parity byte is " + ans + "." };
        } },
      { id: "pl-03", category: "pb-byte", prompt: "In a parity block check, each bit of the parity byte checks one what: a row of bits or a column of bits?", answers: ["A column of bits"],
        keywords: [/^\s*(a\s+|the\s+|each\s+|one\s+)?columns?(\s+of\s+bits)?\s*\.?\s*$/i], distractors: ["A row of bits"],
        working: ["Each byte has its own parity bit. That checks the byte: a row.", "The parity byte sits under the bytes. Each of its bits is at the bottom of a..."],
        note: "Each byte's parity bit checks its row. Each bit of the parity byte checks its column." },
      { id: "pl-04", category: "pb-byte", randomize: function () {
          var mode = drillPick(["even", "odd"]), col = bits(5), ans = parityBit(col, mode);
          return { prompt: mode.charAt(0).toUpperCase() + mode.slice(1) + " parity block. Going down the Bit 3 column, the five bytes hold: " + col.split("").join(", ") + ".\nWhat is the parity byte bit for this column?", answers: [ans],
            keywords: [new RegExp("^\\s*" + ans + "\\s*$")], distractors: [ans === "1" ? "0" : "1"],
            working: ["Count the 1s in " + col.split("").join(", ") + ".", "Choose the bit that makes the total " + mode + "."],
            note: col + " has " + ones(col) + " ones. Bit " + ans + " makes " + (ones(col) + Number(ans)) + ": " + mode + "." };
        } },

      // ------------------------------------------------ Finding the Error
      { id: "pl-05", category: "pb-find", randomize: function () {
          var d = damaged(4), ans = String(d.byte);
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Which byte has the error?", answers: [ans],
            keywords: [drillNumberRe(d.byte, "byte")], distractors: drillWrongNumbers(d.byte, [1, 2, 3, 4], 3),
            format: "Type the byte number",
            working: ["Check each ROW: count the 1s in each byte, including P.", "Which byte does not have an " + d.mode + " number of 1s?"],
            note: "Byte " + ans + " has " + ones(d.rows[d.byte - 1]) + " ones, which is not " + d.mode + ". So the error is in Byte " + ans + "." };
        } },
      { id: "pl-06", category: "pb-find", randomize: function () {
          var d = damaged(4), ans = String(d.bit), col = column(d.rows, d.bit) + d.pbyte[d.bit];
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Which bit number has the error?", answers: [ans],
            keywords: [drillNumberRe(d.bit, "bit")], distractors: drillWrongNumbers(d.bit, [d.bit + 1, d.bit - 1, d.bit + 2, d.bit - 2, 8 - d.bit].filter(function (x) { return x >= 1 && x <= 7; }), 3),
            format: "Type the bit number",
            working: ["Check each COLUMN: count the 1s going down, including the parity byte.", "Which column does not have an " + d.mode + " number of 1s?"],
            note: "The Bit " + ans + " column (with the parity byte) has " + ones(col) + " ones, which is not " + d.mode + ". So the error is in Bit " + ans + "." };
        } },
      { id: "pl-07", category: "pb-find", randomize: function () {
          var d = damaged(5), ans = "Byte " + d.byte + ", Bit " + d.bit;
          var rx = new RegExp("^\\s*(byte\\s*" + d.byte + "\\s*[,;:/&]?\\s*(and\\s+)?bit\\s*" + d.bit + "|bit\\s*" + d.bit + "\\s*[,;:/&]?\\s*(and\\s+)?byte\\s*" + d.byte + ")\\s*\\.?\\s*$", "i");
          var wrong = [], tries = [[d.byte, d.bit === 7 ? 6 : d.bit + 1], [d.byte === 5 ? 4 : d.byte + 1, d.bit], [d.bit <= 5 ? d.bit : 1, d.byte]];
          tries.forEach(function (t) { var s = "Byte " + t[0] + ", Bit " + t[1]; if (s !== ans && wrong.indexOf(s) < 0) wrong.push(s); });
          return { prompt: show(d.rows, d.pbyte, d.mode) + "\nOne bit was changed on the way. Give the byte number and the bit number of the incorrect bit.", answers: [ans],
            keywords: [rx], distractors: wrong, format: "Type it like: Byte 2, Bit 4",
            working: ["Find the ROW (byte) whose count of 1s is not " + d.mode + ".", "Find the COLUMN (bit) whose count of 1s is not " + d.mode + ". The error is where they cross."],
            note: "Byte " + d.byte + " fails its row check and Bit " + d.bit + " fails its column check. They cross at Byte " + d.byte + ", Bit " + d.bit + "." };
        } },
      { id: "pl-08", category: "pb-find", randomize: function () {
          var kind = drillPick(["byte", "block"]);
          return { prompt: "Two bits change in the SAME byte. Will a parity " + kind + " check detect the error? Yes or No?", answers: [kind === "block" ? "Yes" : "No"],
            keywords: [kind === "block" ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [kind === "block" ? "No" : "Yes"],
            working: ["A parity byte check only counts the 1s in each byte (each row). Two changes in one row cancel out.", "A parity block check also checks each column. Two changed bits are in two different columns."],
            note: kind === "block" ? "Yes. The row still looks right, but the two columns with the changed bits are now wrong, so the parity block check detects it." : "No. Two changes keep the count of 1s in that byte " + "even (or odd), so the byte's parity bit still matches." };
        } },
      { id: "pl-09", category: "pb-find", prompt: "Explain how a parity block check can detect an error that a parity byte check would not detect.", answers: ["If two bits change in one byte the row still matches, but the columns are also checked, so the wrong columns show the error"],
        keywords: [/^(?=.*\b(column|columns|vertical\w*|down)\b)(?=.*\b(two|2|even\s+number|both|swap\w*|interchang\w*|transpos\w*|pairs?|more\s+than\s+one|row|byte|horizontal\w*)\b).*$/i],
        distractors: ["It sends the data more slowly so that fewer bits are changed", "It adds a parity bit to each byte to make every count even", "It sends a copy of the data back to the sender to compare"],
        working: ["Which errors does a parity byte check miss? Think about two bits changing in one byte.", "What else does a parity block check look at, as well as the rows?"],
        note: "A parity byte check misses an even number of changes in one byte (for example two bits swapped). A parity block check also checks every column, so the columns with the changed bits show where the error is. From Cambridge IGCSE 0478/12, March 2023, Question 5(c)(ii)." },

      // ------------------------------------------------ Checksum: Calculate and Compare
      { id: "pl-10", category: "cs-calc", randomize: function () {
          var v = values(drillPick([3, 4])), ans = sum(v);
          return { prompt: "The checksum algorithm adds up the data values.\nData to send: " + v.join(", ") + "\nWhat checksum value is sent with the data?", answers: [String(ans)],
            keywords: [drillNumberRe(ans)], distractors: drillWrongNumbers(ans, [ans + 10, ans - 10, ans + 1, ans - v[0]], 3),
            working: ["Add the values one at a time: start with " + v[0] + " + " + v[1] + ".", "Keep adding until every value is in the total."],
            note: v.join(" + ") + " = " + ans + ". The checksum " + ans + " is sent with the data." };
        } },
      { id: "pl-11", category: "cs-calc", randomize: function () {
          var v = values(3), cs = sum(v), got = v.slice(), k = rnd(3), bad = Math.random() < 0.5;
          if (bad) got[k] = got[k] + drillPick([-4, -2, 1, 3, 5]);
          var ans = sum(got);
          return { prompt: "The checksum algorithm adds up the data values.\nData received: " + got.join(", ") + "\nChecksum received: " + cs + "\nThe receiver recalculates the checksum. What value does it get?", answers: [String(ans)],
            keywords: [drillNumberRe(ans)], distractors: drillWrongNumbers(ans, [ans + 10, ans - 10, cs === ans ? ans + 1 : cs, ans + 2], 3),
            working: ["The receiver uses the same algorithm on the data it received.", "Add up " + got.join(", ") + "."],
            note: got.join(" + ") + " = " + ans + "." + (ans === cs ? " It matches the checksum received." : " It does not match the checksum received (" + cs + ").") };
        } },
      { id: "pl-12", category: "cs-calc", randomize: function () {
          var v = values(drillPick([3, 4])), cs = sum(v), got = v.slice(), k = rnd(v.length), bad = Math.random() < 0.5;
          if (bad) got[k] = got[k] + drillPick([-3, -1, 2, 4, 10]);
          var found = sum(got) !== cs;
          return { prompt: "The checksum algorithm adds up the data values.\nData received: " + got.join(", ") + "\nChecksum received: " + cs + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
            working: ["Recalculate: add up the data received.", "Compare your total with the checksum received. Different means an error."],
            note: "Recalculated: " + got.join(" + ") + " = " + sum(got) + ". Checksum received: " + cs + ". " + (found ? "They are different: an error is detected." : "They match: no error is detected.") };
        } },
      { id: "pl-13", category: "cs-calc", prompt: "The checksum the receiver calculates does not match the checksum it received. What happens next?", answers: ["The receiver asks for the data to be sent again"],
        keywords: [/(resen[dt]|sent\s+again|send\s+(it\s+)?again|again|re-?transmit\w*|request\w*|ask\w*)/i],
        distractors: ["The receiver deletes the checksum and keeps the data", "The receiver adds a parity bit to each byte", "The receiver changes the checksum to match"],
        working: ["The data has an error. Can the receiver use it?", "How can the receiver get a correct copy?"],
        note: "An error is detected, so the receiver requests that the data is sent again." },

      // ------------------------------------------------ Describing the Checks
      { id: "pl-14", category: "cs-why", prompt: "The checksum value is calculated from the data before it is sent. What happens to the checksum value next?", answers: ["It is sent with the data"],
        keywords: [/(sent|send\w*|transmit\w*|travel\w*|added|attached|goes)\b.*\b(with|along|together|data)|(with|alongside)\s+the\s+data/i],
        distractors: ["It is kept by the sender and never sent", "It is used to encrypt the data", "It is added to each byte as a parity bit"],
        working: ["The receiver needs the checksum to compare with. How does it get it?"],
        note: "The checksum value is transmitted with the data. From Cambridge IGCSE 0478/13, June 2026, Question 2(d)." },
      { id: "pl-15", category: "cs-why", prompt: "The receiver recalculates the checksum. Does it use the same algorithm as the sender, or a different one?", answers: ["The same algorithm"],
        keywords: [/^\s*(the\s+|it\s+uses\s+the\s+)?same(\s+(algorithm|one|calculation))?\s*\.?\s*$/i], distractors: ["A different algorithm"],
        working: ["If the data has not changed, the two checksums should be equal.", "That only works if both sides do the same calculation."],
        note: "The same algorithm, so correct data always gives the same checksum value." },
      { id: "pl-16", category: "cs-why", prompt: "Two checksum values are compared after transmission. Explain why values that do not match show an error has occurred.", answers: ["The checksum is calculated from the data with the same algorithm, so if the values are different the data must be different"],
        keywords: [/^(?=.*\b(data|values?|bytes?)\b)(?=.*\b(same\s+algorithm|same\s+calculation|calculated|calculates?|algorithm|from\s+the\s+data|using\s+the\s+data))(?=.*\b(different|differ\w*|changed?|not\s+the\s+same|wrong|altered)\b).*$/i],
        distractors: ["The sender always adds an extra checksum value by mistake", "The checksum is a parity bit that changes with every byte", "Checksums are only used when the data is encrypted"],
        working: ["Where does a checksum value come from?", "If both sides use the same algorithm, when can the two values be different?"],
        note: "The checksum is calculated from the data, using the same algorithm on both sides. So if the values are different, the data must be different. From Cambridge IGCSE 0478/13, November 2024, Question 2(f)(ii)." }
    ];
  })()
});
