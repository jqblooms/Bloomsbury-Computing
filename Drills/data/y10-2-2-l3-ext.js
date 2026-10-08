// Year 10, 2.2 L3 Do Now Extension: 2.1 Data Transmission (packets, transmission methods, USB) and 2.2 L1 and L2
// (parity checks, parity blocks, checksums).
// Loaded by Drills/index.html?drill=y10-2-2-l3-ext
// For students who finish the Do Now early: a selection of 10 questions, written fresh. Every card has an `example`,
// a similar question worked through with different details, holding every rule and step needed, then two `working`
// nudges. An example never shows the card's own answer.
DrillData.register("y10-2-2-l3-ext", {
  title: "Year 10 Extension: Transmission, Parity and Checksums",
  subtitle: "2.2 L3 Do Now Extension",
  categories: [
    ["ex-trans", "Data Transmission (2.1)"],
    ["ex-parity", "Parity Checks (2.2 L1)"],
    ["ex-block", "Parity Blocks (2.2 L2)"],
    ["ex-checksum", "Checksums (2.2 L2)"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function word(w) { return new RegExp("^\\s*(the\\s+|a\\s+|an\\s+)?" + w + "\\s*\\.?\\s*$", "i"); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    function flip(s, k) { return s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1); }
    function column(rows, c) { return rows.map(function (r) { return r[c]; }).join(""); }
    function columnByte(rows, mode) { var s = ""; for (var c = 0; c < 8; c++) s += parityBit(column(rows, c), mode); return s; }
    function makeBlock(n, mode) {
      var rows = [];
      for (var i = 0; i < n; i++) { var d = bits(7); rows.push(parityBit(d, mode) + d); }
      return { rows: rows, pbyte: columnByte(rows, mode) };
    }
    function spaced(s) { return s.split("").join("  "); }
    function show(rows, pbyte, mode) {
      return (mode === "even" ? "Even" : "Odd") + " parity block. P is the parity bit.\n" +
        "             P  1  2  3  4  5  6  7\n" +
        rows.map(function (r, i) { return "Byte " + (i + 1) + "       " + spaced(r); }).join("\n") +
        "\nParity byte  " + spaced(pbyte);
    }
    function sum(a) { return a.reduce(function (t, v) { return t + v; }, 0); }
    function values(n) { var a = []; for (var i = 0; i < n; i++) a.push(10 + rnd(50)); return a; }
    return [
      // ------------------------------------------------ Data Transmission (2.1)
      { id: "ex-01", category: "ex-trans", prompt: "Which hardware device decides the route each packet takes across the internet?", answers: ["Router"],
        keywords: [word("routers?")], distractors: ["Switch", "Modem", "Server"],
        example: "Example question: which part of a packet holds the destination address?\nStep 1: a packet has three parts: header, payload, trailer.\nStep 2: the address is needed first, so the packet can be sent the right way. It is at the START.\nStep 3: the start of the packet is the header.\nNow your question asks for a DEVICE. At every junction on the internet, a device reads that destination address and sends the packet on towards it.",
        working: ["The device reads the destination address in the packet header.", "It sends the packet on along a route. Its name comes from the word route."],
        note: "A router reads the destination address and decides which way to send each packet." },
      { id: "ex-02", category: "ex-trans", randomize: function () {
          var s = drillPick([["Data is sent to a printer in another building, 200 metres away.", "Serial"], ["Data is sent from the processor to memory, a few centimetres away, as fast as possible.", "Parallel"]]);
          return { prompt: s[0] + " Should it use serial or parallel transmission?", answers: [s[1]], keywords: [word(s[1].toLowerCase())],
            distractors: [s[1] === "Serial" ? "Parallel" : "Serial"],
            example: "Example: data is sent down a cable 1 km long.\nStep 1: parallel sends several bits at once, down several wires.\nStep 2: over a long cable, the bits on different wires arrive at slightly different times (skew), so the data can be wrong.\nStep 3: serial sends one bit at a time down one wire, so the bits stay in order.\nRule: long distance = serial. Very short distance and very fast = parallel.",
            working: ["Is the distance long or very short?", "Over a long cable, parallel bits can arrive at different times."],
            note: s[1] + ". " + (s[1] === "Serial" ? "Over a long distance, the bits stay in order and do not skew." : "Over a very short distance, several bits at once is fastest.") };
        } },
      { id: "ex-03", category: "ex-trans", randomize: function () {
          var s = drillPick([["A webcam sends video to a computer. The computer never sends data back to the webcam.", "Simplex"],
            ["Two computers send files to each other, and both can send at the same moment.", "Full-duplex"],
            ["A computer sends a document to a printer. The printer can reply, but only when the computer has stopped sending.", "Half-duplex"]]);
          var rx = { "Simplex": /^\s*simplex\s*\.?\s*$/i, "Half-duplex": /^\s*half[\s-]*duplex\s*\.?\s*$/i, "Full-duplex": /^\s*full[\s-]*duplex\s*\.?\s*$/i };
          return { prompt: s[0] + " Simplex, half-duplex or full-duplex?", answers: [s[1]], keywords: [rx[s[1]]],
            distractors: ["Simplex", "Half-duplex", "Full-duplex"].filter(function (x) { return x !== s[1]; }),
            example: "Example: a radio station sends music to radios, and the radios never send anything back. Then: two people on a video call, both talking at once. Then: a walkie-talkie, where only one person can talk at a time.\nStep 1: ask: does data go both ways? The radio: no.\nStep 2: if it does go both ways, ask: can both send at the same moment? The video call: yes. The walkie-talkie: no, they take turns.\nRule: one way only = simplex. Both ways, taking turns = half-duplex. Both ways at the same time = full-duplex.",
            working: ["Does data ever travel back the other way?", "If it does, can both sides send at the same moment?"],
            note: s[1] + "." };
        } },
      { id: "ex-04", category: "ex-trans", prompt: "Does USB send data by serial or by parallel transmission?", answers: ["Serial"],
        keywords: [word("serial")], distractors: ["Parallel"],
        example: "Example question: can a USB cable supply power to a device?\nStep 1: think about charging a phone from a computer with a USB cable.\nStep 2: the phone charges, so the cable carries power as well as data.\nStep 3: so yes, USB carries data and power.\nNow your question: think about how the bits travel in a USB cable. Do they go one after another, or side by side down many wires?",
        working: ["A USB cable is thin, with only a few wires for data.", "Do the bits go one at a time, or several at once?"],
        note: "Serial: USB sends one bit at a time." },

      // ------------------------------------------------ Parity Checks (2.2 L1)
      { id: "ex-05", category: "ex-parity", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), p = parityBit(d, mode);
          return { prompt: (mode === "even" ? "Even" : "Odd") + " parity is used. What parity bit is added to the data " + d + "?", answers: [p], keywords: [new RegExp("^\\s*" + p + "\\s*$")],
            distractors: [p === "1" ? "0" : "1"],
            example: "Example: odd parity, data 1011001.\nStep 1: count the 1s: 1, 1, 1, 1. That is 4.\nStep 2: odd parity means the total number of 1s, with the parity bit, must be odd.\nStep 3: 4 is even, so the parity bit must add one more 1: the parity bit makes it 5.\nRule: if the count already matches the parity, the parity bit adds nothing. If it does not, the parity bit adds one more 1.",
            working: ["Count the 1s in " + d + ".", "Does that count already match " + mode + " parity?"],
            note: d + " has " + ones(d) + " ones. Parity bit " + p + " makes " + (ones(d) + Number(p)) + ", an " + mode + " number." };
        } },
      { id: "ex-06", category: "ex-parity", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), got = parityBit(d, mode) + d;
          if (Math.random() < 0.5) got = flip(got, rnd(8));
          var found = (ones(got) % 2 === 0) !== (mode === "even");
          return { prompt: "This byte arrived. The sender used " + mode + " parity.\n" + got + "\nDoes the parity check find an error? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
            example: "Example: even parity, this byte arrived: 01100111.\nStep 1: count every 1, including the parity bit at the start: 1, 1, 1, 1, 1. That is 5.\nStep 2: even parity means the count must be even.\nStep 3: 5 is odd, so it does not match: the check finds an error.\nRule: count matches the parity = no error found. Count does not match = error found.",
            working: ["Count every 1, including the parity bit.", "Is the total " + mode + "?"],
            note: ones(got) + " ones: " + (ones(got) % 2 === 0 ? "even" : "odd") + ". " + (found ? "That does not match " + mode + " parity: error found." : "That matches " + mode + " parity: no error found.") };
        } },

      // ------------------------------------------------ Parity Blocks (2.2 L2)
      { id: "ex-07", category: "ex-block", randomize: function () {
          var mode = drillPick(["even", "odd"]), b = makeBlock(3, mode), byte = rnd(3), bit = 1 + rnd(7), rows = b.rows.slice();
          rows[byte] = flip(rows[byte], bit);
          var ans = String(byte + 1);
          return { prompt: show(rows, b.pbyte, mode) + "\nOne bit was changed on the way. Which byte has the error?", answers: [ans],
            keywords: [drillNumberRe(byte + 1, "byte")], distractors: drillWrongNumbers(byte + 1, [1, 2, 3], 2), format: "Type the byte number",
            example: "Example: an even parity block arrived.\nByte 1: 0 1 1 0 0 0 1 1\nByte 2: 1 1 0 1 0 0 1 1\nStep 1: count the 1s in Byte 1, including P: 4. Even: this row is fine.\nStep 2: count the 1s in Byte 2: 5. Odd: this row does not match even parity.\nStep 3: so the error is in Byte 2. The columns would then show which bit.",
            working: ["Check each ROW: count the 1s in each byte, including P.", "Which byte does not have an " + mode + " number of 1s?"],
            note: "Byte " + ans + " has " + ones(rows[byte]) + " ones, which is not " + mode + "." };
        } },
      { id: "ex-08", category: "ex-block", randomize: function () {
          var mode = drillPick(["even", "odd"]), b = makeBlock(3, mode), c = 1 + rnd(7), ans = b.pbyte[c];
          var shown = b.pbyte.slice(0, c) + "?" + b.pbyte.slice(c + 1);
          return { prompt: show(b.rows, shown, mode) + "\nWhat is the missing bit (?) in the parity byte?", answers: [ans], keywords: [new RegExp("^\\s*" + ans + "\\s*$")],
            distractors: [ans === "1" ? "0" : "1"],
            example: "Example: odd parity block. Going DOWN the Bit 2 column, the bytes hold 1, 0, 1.\nStep 1: count the 1s in that column: 2.\nStep 2: odd parity means the column, with the parity byte bit, must have an odd number of 1s.\nStep 3: 2 is even, so the parity byte bit must add one more 1.\nRule: each bit of the parity byte checks the column above it.",
            working: ["The ? is under Bit " + c + ". Count the 1s going DOWN that column.", "Choose the bit that makes the column " + mode + "."],
            note: "Bit " + c + " column: " + column(b.rows, c) + " has " + ones(column(b.rows, c)) + " ones. The parity byte bit is " + ans + "." };
        } },

      // ------------------------------------------------ Checksums (2.2 L2)
      { id: "ex-09", category: "ex-checksum", randomize: function () {
          var v = values(3), ans = sum(v);
          return { prompt: "The checksum algorithm adds up the data values.\nData to send: " + v.join(", ") + "\nWhat checksum value is sent with the data?", answers: [String(ans)],
            keywords: [drillNumberRe(ans)], distractors: drillWrongNumbers(ans, [ans + 10, ans - 10, ans + 1], 3),
            example: "Example: data to send: 41, 17, 26.\nStep 1: add the first two values: 41 + 17 = 58.\nStep 2: add the next value: 58 + 26 = 84.\nStep 3: the checksum value is 84. It is sent with the data.",
            working: ["Add the first two values: " + v[0] + " + " + v[1] + ".", "Then add " + v[2] + "."],
            note: v.join(" + ") + " = " + ans + "." };
        } },
      { id: "ex-10", category: "ex-checksum", randomize: function () {
          var v = values(3), cs = sum(v), got = v.slice();
          if (Math.random() < 0.5) { var k = rnd(3); got[k] = got[k] + drillPick([-5, -2, 1, 3, 6]); }
          var found = sum(got) !== cs;
          return { prompt: "The checksum algorithm adds up the data values.\nData received: " + got.join(", ") + "\nChecksum received: " + cs + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
            example: "Example: data received: 33, 12, 20. Checksum received: 65.\nStep 1: the receiver uses the same algorithm: 33 + 12 + 20 = 65.\nStep 2: compare: 65 and 65 are the same.\nStep 3: the same values mean the data did not change, so no error is detected.\nRule: same values = no error detected. Different values = error detected.",
            working: ["Recalculate: add up the data received.", "Compare your total with the checksum received."],
            note: "Recalculated: " + got.join(" + ") + " = " + sum(got) + ". Checksum received: " + cs + ". " + (found ? "Different: an error is detected." : "The same: no error is detected.") };
        } }
    ];
  })()
});
