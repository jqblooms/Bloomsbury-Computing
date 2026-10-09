// Year 10 Extension before 2.2 L4: every error check so far, with the why behind each
// Loaded by Drills/index.html?drill=y10-2-2-l4-ext
// James, 2026-10-09: the Do Now covers all the error checking methods so far and asks why, not just how or what.
// Parity (bit and block), checksum, echo check, ARQ, plus serial and parallel from 2.1. Calculation cards draw new
// numbers each time; every card has a "Walk me through it" on a different example, never this card's answer.
DrillData.register("y10-2-2-l4-ext", {
  title: "Year 10 Extension: Every Error Check So Far",
  subtitle: "2.2 L4 Do Now Extension",
  categories: [
    ["x-parity", "Parity Checks"],
    ["x-checksum", "Checksums"],
    ["x-echo", "Echo Checks"],
    ["x-arq", "ARQ"]
  ],
  cards: (function () {
    function t(text, code, hl, state) { return { text: text, code: code, hl: hl || [], state: state || "" }; }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (c) { return c === "1"; }).length; }
    function parityWalk(data, kind) {
      var n = ones(data), bit = kind === "even" ? (n % 2 ? "1" : "0") : (n % 2 ? "0" : "1");
      return [
        t("A different byte, " + kind + " parity. The parity bit makes the number of 1s " + kind + ".", ["Data: " + data.split("").join(" ")], [0]),
        t("Count the 1s in the data.", ["Data: " + data.split("").join(" "), "1s: " + n], [1], "1s = " + n),
        t(n + " is " + (n % 2 ? "odd" : "even") + ". To make the total " + kind + ", the parity bit is " + bit + ".", ["Data: " + data.split("").join(" "), "1s: " + n, "Parity bit: " + bit], [2], "parity bit = " + bit)
      ];
    }
    return [
      { id: "x-01", category: "x-parity", randomize: function () {
          var kind = Math.random() < 0.5 ? "even" : "odd", d; do { d = bits(7); } while (ones(d) === 0);
          var n = ones(d), a = kind === "even" ? (n % 2 ? "1" : "0") : (n % 2 ? "0" : "1");
          var w; do { w = bits(7); } while (w === d);
          return { prompt: "The system uses " + kind + " parity. What parity bit is added to the data " + d + "?", answers: [a], keywords: [new RegExp("^\\s*(the\\s+)?(parity\\s+bit\\s*(is|[:=])?\\s*)?" + a + "\\s*$", "i")],
            distractors: [a === "1" ? "0" : "1"], walk: parityWalk(w, kind),
            working: ["Count the 1s in the data.", "Choose the bit that makes the number of 1s " + kind + "."], note: d + " has " + n + " ones, so the parity bit is " + a + "." };
        } },
      { id: "x-02", category: "x-parity", prompt: "Two bits in a byte change during transmission. Why might a parity check not find the error?", answers: ["Two changed bits keep the number of 1s even or odd, so the parity still looks correct"],
        keywords: [/^(?=.*\b(two|2|both|even\s+number|pair)\b)(?=.*\b(still|same|correct|unchanged|even|odd|match\w*|cancel\w*)\b).*$/i],
        distractors: ["Parity checks only work on numbers", "The parity bit is sent first", "Parity checks need a timeout"],
        working: ["What happens to the count of 1s when one bit changes? When two change?", "Is the count still odd or even?"],
        walk: [t("A similar example, even parity. Sent: 0110 0110 has four 1s.", ["Sent:     0 1 1 0 0 1 1 0"], [0], "1s = 4 (even)"),
          t("Two bits change: the first 0 becomes 1, and the third bit 1 becomes 0.", ["Sent:     0 1 1 0 0 1 1 0", "Received: 1 1 0 0 0 1 1 0"], [1], "1s = 4 (even)"),
          t("The receiver counts four 1s, which is still even. The check passes even though the data is wrong.", ["Sent:     0 1 1 0 0 1 1 0", "Received: 1 1 0 0 0 1 1 0"], [1])] },
      { id: "x-03", category: "x-parity", prompt: "Why can a parity block check find WHICH bit is wrong, when a single parity bit cannot?", answers: ["It checks each row and each column, and the wrong bit is where they cross"],
        keywords: [/^(?=.*\b(rows?|columns?|across|down|cross\w*|meet\w*)\b).*$/i],
        distractors: ["It uses a timeout", "It sends the data twice", "It adds up all the bytes"],
        working: ["A parity block has a parity bit for each byte and a parity byte for each column.", "An error makes one row AND one column wrong. Where do they meet?"],
        walk: [t("A similar picture: a block of 4 bytes, each with its own parity bit, plus a parity byte checking each column."), t("One bit changes. The row with that bit now has the wrong number of 1s."), t("The column with that bit also has the wrong number of 1s. The bit where the bad row and bad column cross is the wrong one.")] },
      { id: "x-04", category: "x-checksum", randomize: function () {
          var v = [0, 0, 0].map(function () { return 10 + Math.floor(Math.random() * 80); }), a = v[0] + v[1] + v[2];
          var w; do { w = [0, 0, 0].map(function () { return 10 + Math.floor(Math.random() * 80); }); } while (w[0] + w[1] + w[2] === a);
          var ws = w[0] + w[1] + w[2];
          return { prompt: "The checksum algorithm adds up the data values. Data to send: " + v.join(", ") + ". What checksum value is sent with the data?", answers: [String(a)], keywords: [drillNumberRe(a, "checksum")],
            distractors: drillWrongNumbers(a, [a + 10, a - 10, a + 1, a - 1, v[0] + v[1]], 3),
            walk: [t("A different set of data: " + w.join(", ") + ". The sender adds the values.", ["Data: " + w.join(", ")], [0]),
              t(w[0] + " + " + w[1] + " = " + (w[0] + w[1]) + ".", ["Data: " + w.join(", "), w[0] + " + " + w[1] + " = " + (w[0] + w[1])], [1], "running total = " + (w[0] + w[1])),
              t("Add the last value: " + (w[0] + w[1]) + " + " + w[2] + " = " + ws + ". This is sent with the data.", ["Data: " + w.join(", "), w[0] + " + " + w[1] + " = " + (w[0] + w[1]), (w[0] + w[1]) + " + " + w[2] + " = " + ws], [2], "checksum = " + ws)],
            working: ["Add the data values, one at a time.", "The total is the value sent with the data."], note: v.join(" + ") + " = " + a + "." };
        } },
      { id: "x-05", category: "x-checksum", prompt: "Why is the checksum calculated before the data is sent AND again after it arrives?", answers: ["So the two values can be compared: different values mean an error"],
        keywords: [/^(?=.*\b(compar\w*|match\w*|same|differ\w*|check\w*\s+against)\b).*$/i],
        distractors: ["To make the data smaller", "To send the data twice", "To correct the error"],
        working: ["What does the receiver do with the value that arrived and the value it works out?", "When would the two values be different?"],
        walk: [t("A similar case: a parcel is weighed before it is posted, and weighed again when it arrives."), t("If the two weights are the same, nothing fell out. If they differ, something went wrong on the way."), t("A checksum works the same way: one value from the sender, one from the receiver, then compare.")] },
      { id: "x-06", category: "x-echo", prompt: "In an echo check, an error is found. Why can the sender not tell if it happened on the way there or on the way back?", answers: ["It only sees the data it sent and the copy that came back"],
        keywords: [/^(?=.*\b(copy|sent|back|returned|only|both|compar\w*|cannot\s+see|can.?t\s+see|either)\b).*$/i],
        distractors: ["The receiver deletes the data", "Echo checks use a timeout", "The parity bit is missing"],
        working: ["What two things does the sender compare?", "Could a bit change on the way there AND on the way back give the same picture?"],
        walk: [t("A similar case: you whisper a word to a friend, and they whisper back what they heard."), t("You hear the wrong word. Did your friend mishear you, or did you mishear them?"), t("You only know your word and the word that came back, not what happened in between. The sender sends the data again.")] },
      { id: "x-07", category: "x-echo", prompt: "In an echo check, who sends the data back?", answers: ["The receiver"],
        keywords: [/^\s*(the\s+)?receiv\w*(\s+(device|computer))?\s*\.?$/i],
        distractors: ["The sender", "The router", "The server"],
        working: ["The data goes there, then a copy comes back.", "Who has the data after the first trip?"],
        walk: [t("A similar setup: a laptop sends data to a printer and uses an echo check."), t("The printer gets the data and sends a copy straight back to the laptop."), t("The laptop compares the copy with what it sent.")] },
      { id: "x-08", category: "x-arq", prompt: "Why does ARQ need a timeout?", answers: ["So the sender sends the data again if no acknowledgement arrives"],
        keywords: [/^(?=.*\b(again|resen\w*|re-?send\w*|retransmit\w*|repeat\w*|lost|never\s+arriv\w*|no\s+acknowledg\w*|not\s+arriv\w*)\b).*$/i],
        distractors: ["To make the data travel faster", "To count the 1s", "To add up the data"],
        working: ["What if the data, or the acknowledgement, is lost?", "Without a time limit, how long would the sender wait?"],
        walk: [t("A similar case: you text a friend and wait for a reply that says it arrived."), t("If no reply comes, you cannot wait for ever. After a set time you send the text again."), t("ARQ does this: when the timer runs out (a timeout), the sender sends the data again.")] },
      { id: "x-09", category: "x-arq", prompt: "With negative acknowledgement, why does the sender not have to wait for a timeout to find out about an error?", answers: ["The receiver sends a negative acknowledgement straight away"],
        keywords: [/^(?=.*\b(negative|nak|nack|tells|sends|straight|immediate\w*|message|reply)\b).*$/i],
        distractors: ["The sender checks the data itself", "There are never errors", "The timer is shorter"],
        working: ["What does the receiver send when it finds an error?", "Does the sender have to wait for the timer then?"],
        walk: [t("A similar case: a shop rings you when a parcel arrives broken, instead of saying nothing."), t("You find out at once, so you send a new parcel straight away."), t("With negative acknowledgement, the receiver sends a message saying there was an error, so the sender sends the data again at once.")] },
      { id: "x-10", category: "x-arq", prompt: "A system uses a parity check AND ARQ. Why use both?", answers: ["The parity check finds the error and ARQ gets the data sent again"],
        keywords: [/^(?=.*\b(find\w*|detect\w*|check\w*)\b)(?=.*\b(again|resen\w*|re-?send\w*|retransmit\w*|repeat\w*|acknowledg\w*)\b).*$/i],
        distractors: ["Two checks make the data smaller", "ARQ corrects the parity bit", "Parity checks need ARQ to count"],
        working: ["Which one finds the error?", "Which one makes sure correct data arrives in the end?"],
        walk: [t("A similar case: a teacher marks a test (finds mistakes) and then asks for it to be done again (gets it fixed)."), t("Finding the mistake alone does not get a correct copy. Asking again alone does not know when to ask."), t("One check finds the error; ARQ uses acknowledgements and timeouts so the data is sent again.")] }
    ];
  })()
});
