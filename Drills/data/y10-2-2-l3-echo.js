// Year 10, 2.2 L3 Activity 1: There or Back? (the echo check)
// Loaded by Drills/index.html?drill=y10-2-2-l3-echo
// Random bytes: be the sender and compare the copy that came back with the data sent, then look at the whole trip
// and say where the error happened: on the way there, on the way back, or nowhere. Every answer is worked out by
// code. Each card has a worked example with different bytes, then two nudges. No ARQ terms: ARQ comes later.
DrillData.register("y10-2-2-l3-echo", {
  title: "Year 10, 2.2 L3: There or Back?",
  subtitle: "Echo check practice",
  categories: [
    ["ec-sender", "Be the Sender"],
    ["ec-where", "There or Back?"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function flip(s, k) { return s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1); }
    // One trip: the data sent, what arrived at the receiver, and the copy that came back to the sender.
    function trip(kind) {
      var sent = bits(8), arrived = sent, back;
      if (kind === "there") arrived = flip(sent, rnd(8));
      back = arrived;
      if (kind === "back") back = flip(arrived, rnd(8));
      return { sent: sent, arrived: arrived, back: back };
    }
    function whole(t) {
      return "Sent by the sender:        " + t.sent + "\nArrived at the receiver:   " + t.arrived + "\nCopy back at the sender:   " + t.back;
    }
    var YES = /^\s*yes\b/i, NO = /^\s*no\b/i;
    var THERE = /^(?!.*\b(no|none|back)\b).*\b(there|to\s+(the\s+)?receiv\w*)\b/i;
    var BACK = /^(?!.*\b(no|none)\b).*\b(back|to\s+(the\s+)?send\w*)\b/i;
    var NONE = /^\s*(no|none|nowhere|nothing)\b|^\s*there\s+(is|was)\s+no\b/i;
    var PLACES = ["On the way there", "On the way back", "No error"];
    return [
      // ------------------------------------------------ Be the Sender
      { id: "ec-01", category: "ec-sender", randomize: function () {
          var t = trip(drillPick(["there", "back", "none", "none"])), found = t.back !== t.sent;
          return { prompt: "You are the sender. You sent: " + t.sent + "\nThe copy that came back: " + t.back + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? YES : NO], distractors: [found ? "No" : "Yes"],
            example: "Example: the sender sent 11001010. The copy that came back is 11001110.\nStep 1: put the two bytes one above the other.\n11001010\n11001110\nStep 2: compare them bit by bit, left to right. Bit 6 is 0 in one and 1 in the other.\nStep 3: the two are different, so an error is detected.\nRule: the same = no error detected. Different = error detected.",
            working: ["Write the copy under the data sent.", "Compare them bit by bit. Is any bit different?"],
            note: found ? "The copy is different from the data sent, so an error is detected." : "The copy is the same as the data sent, so no error is detected." };
        } },
      { id: "ec-02", category: "ec-sender", randomize: function () {
          var t = trip(drillPick(["there", "back", "none"])), found = t.back !== t.sent;
          var ans = found ? "Send the data again" : "Send the next data";
          return { prompt: "You are the sender. You sent: " + t.sent + "\nThe copy that came back: " + t.back + "\nWhat do you do next: send the data again, or send the next data?", answers: [ans],
            keywords: [found ? /^(?!\s*(no|not|it\s+does\s+not)\b)(?!.*\b(next|never)\b)(?!.*\b(not|don'?t)\s+(re-?)?send).*\b(again|resen[dt]|re-?send\w*|re-?transmit\w*|repeat\w*)\b/i : /^(?!\s*(no|not|it\s+does\s+not)\b)(?!.*\b(again|resen[dt]|re-?send\w*|don'?t|never)\b).*\b(next|new|carry\s+on|continue)\b/i],
            distractors: [found ? "Send the next data" : "Send the data again", "Correct the bit that changed"],
            example: "Example: the sender sent 00110101. The copy that came back is 00110101.\nStep 1: compare the copy with the data sent, bit by bit.\nStep 2: every bit is the same, so no error is detected.\nStep 3: the data is fine, so the sender moves on to the next data.\nRule: if the copy is different, the sender cannot trust the data, so it sends it again. The echo check does not correct a bit.",
            working: ["Compare the copy with the data sent. Are they the same?", "Different: the sender cannot trust the data. Same: the data is fine."],
            note: found ? "The copy is different, so an error is detected. The sender sends the data again." : "The copy is the same, so no error is detected. The sender sends the next data." };
        } },

      // ------------------------------------------------ There or Back?
      { id: "ec-03", category: "ec-where", randomize: function () {
          var kind = drillPick(["there", "back", "none"]), t = trip(kind);
          var ans = kind === "there" ? PLACES[0] : kind === "back" ? PLACES[1] : PLACES[2];
          return { prompt: "You can see the whole trip.\n" + whole(t) + "\nWhere did the error happen: on the way there, on the way back, or no error?", answers: [ans],
            keywords: [kind === "there" ? THERE : kind === "back" ? BACK : NONE], distractors: PLACES.filter(function (p) { return p !== ans; }),
            format: "Type: on the way there, on the way back, or no error",
            example: "Example:\nSent by the sender:        10011100\nArrived at the receiver:   10011100\nCopy back at the sender:   10111100\nStep 1: compare what was sent with what arrived. They are the same, so the trip TO the receiver was fine.\nStep 2: compare what arrived with the copy back. Bit 3 is different. The receiver sent back what it got, so the bit changed on the trip BACK to the sender.\nRule: sent and arrived differ = the trip to the receiver. Arrived and copy differ = the trip back to the sender.",
            working: ["First compare the top two rows: did the data arrive as it was sent?", "Then compare the bottom two rows: did the copy come back as the receiver sent it?"],
            note: kind === "there" ? "What arrived is different from what was sent, so the error happened on the way there." : kind === "back" ? "The data arrived correctly, but the copy changed on the way back to the sender." : "All three rows are the same: no error." };
        } },
      { id: "ec-04", category: "ec-where", randomize: function () {
          var t = trip(drillPick(["there", "back"])), ask = drillPick(["where", "error"]);
          var q = ask === "where" ? "Can the sender tell whether the error happened on the way there or on the way back? Yes or No?" : "Can the sender tell that there is an error? Yes or No?";
          var ans = ask === "where" ? "No" : "Yes";
          return { prompt: "You are the sender. You can only see these two rows.\nSent:            " + t.sent + "\nCopy came back:  " + t.back + "\n" + q, answers: [ans],
            keywords: [ans === "Yes" ? YES : NO], distractors: [ans === "Yes" ? "No" : "Yes"],
            example: "Example: a sender sent 01110001 and the copy back is 01010001.\nStep 1: the sender compares its two rows. Bit 3 is different, so it knows something went wrong.\nStep 2: the sender never sees what the receiver got. The bit could have changed on the trip to the receiver, or on the trip back.\nStep 3: both trips end with the same copy at the sender. So the sender knows THAT there was an error, but not WHICH trip it was on.",
            working: ["The sender only has two rows: what it sent and the copy back.", "Does the sender ever see what arrived at the receiver?"],
            note: ask === "where" ? "No. The sender only sees the data it sent and the copy back. An error on either trip looks the same." : "Yes. The copy is different from the data sent, so the sender knows there is an error." };
        } },
      { id: "ec-05", category: "ec-where", randomize: function () {
          var kind = drillPick(["there", "back", "none"]), t = trip(kind), again = kind !== "none";
          return { prompt: "You can see the whole trip.\n" + whole(t) + "\nDoes the sender send the data again? Yes or No?", answers: [again ? "Yes" : "No"],
            keywords: [again ? YES : NO], distractors: [again ? "No" : "Yes"],
            example: "Example:\nSent by the sender:        01101100\nArrived at the receiver:   01101100\nCopy back at the sender:   01101101\nStep 1: the sender only compares the top row and the bottom row: 01101100 and 01101101. They are different.\nStep 2: the sender cannot see the middle row, so it does not know the data arrived safely.\nStep 3: different means an error is detected, so the sender sends the data again.\nRule: the sender decides from the data sent and the copy back only.",
            working: ["The sender cannot see the middle row. Cover it up.", "Compare the top row with the bottom row. Different means the sender sends the data again."],
            note: again ? (kind === "back" ? "Yes. The data arrived correctly, but the copy changed on the way back. The sender only sees that the copy is different, so it sends the data again." : "Yes. The copy back is different from the data sent, so the sender sends the data again.") : "No. The copy back is the same as the data sent, so no error is detected." };
        } }
    ];
  })()
});
