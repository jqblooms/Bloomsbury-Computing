// Year 10, 2.2 L1: Why Errors Happen and Parity Checks
// Loaded by Drills/index.html?drill=y10-2-2-l1-parity
// Why data is checked after transmission and how errors occur (interference: data loss, gain and change), setting
// an odd or even parity bit, checking a received byte, and why a parity check can miss an error. Syllabus 0478
// 2.2 1 and 2 (parity check). Bytes are drawn at random; the parity bit is the first (left) bit, as in the exam.
DrillData.register("y10-2-2-l1-parity", {
  title: "Year 10, 2.2 L1: Errors and Parity Checks",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["pa-errors", "Why Errors Happen"],
    ["pa-bit", "Setting the Parity Bit"],
    ["pa-check", "Checking a Byte"],
    ["pa-miss", "When Parity Fails"]
  ],
  cards: (function () {
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    function word(w) { return new RegExp("^\\s*[\"']?\\s*" + w + "\\s*[\"']?\\s*\\.?\\s*$", "i"); }
    return [
      // ------------------------------------------------ Why Errors Happen
      { id: "pa-01", category: "pa-errors", prompt: "What can cause bits to change while data is being transmitted?", answers: ["Interference"],
        keywords: [/(interference|noise|electrical|magnetic|signal|lightning|weather|crosstalk)/i],
        distractors: ["Compression", "Encryption", "The parity bit"],
        working: ["Think of the lightning bolt on the cable in the lab."], note: "Interference, for example electrical or magnetic, can change bits on the way." },
      { id: "pa-02", category: "pa-errors", randomize: function () {
          var sent = bits(8), kind = drillPick(["lost", "gained", "changed"]), got;
          var k = Math.floor(Math.random() * 7) + 1;
          if (kind === "lost") got = sent.slice(0, k) + sent.slice(k + 1);
          else if (kind === "gained") got = sent.slice(0, k) + drillPick(["0", "1"]) + sent.slice(k);
          else got = sent.slice(0, k) + (sent[k] === "1" ? "0" : "1") + sent.slice(k + 1);
          return { prompt: "Sent: " + sent + "\nReceived: " + got + "\nWas a bit lost, gained or changed?", answers: [kind === "lost" ? "Lost" : kind === "gained" ? "Gained" : "Changed"],
            keywords: [kind === "lost" ? /^\s*(it\s+was\s+|a\s+bit\s+was\s+)?(lost|loss|data\s+loss)\s*\.?\s*$/i : kind === "gained" ? /^\s*(it\s+was\s+|a\s+bit\s+was\s+)?(gained|gain|data\s+gain|added)\s*\.?\s*$/i : /^\s*(it\s+was\s+|a\s+bit\s+was\s+)?(changed|change|data\s+change|flipped)\s*\.?\s*$/i],
            distractors: ["Lost", "Gained", "Changed"].filter(function (x) { return x.toLowerCase() !== kind; }),
            working: ["Count the bits in each row first: 8 sent. How many arrived?", "Same number of bits? Then look for a bit that is different."],
            note: got.length < 8 ? "Only " + got.length + " bits arrived: a bit was lost." : got.length > 8 ? got.length + " bits arrived: a bit was gained." : "Still 8 bits, but one is different: a bit was changed." };
        } },
      { id: "pa-03", category: "pa-errors", prompt: "Why is data checked for errors after it has been transmitted?", answers: ["To find out if the data was changed, so it can be sent again"],
        keywords: [/(error|wrong|damag|corrupt|chang|incorrect|accura|correct|lost|gain|same)/i],
        distractors: ["To make the file smaller so that it takes up less storage", "To stop anyone else from reading the data while it travels", "To choose the fastest route for every packet across the internet"],
        working: ["What can interference do to the bits on the way?", "Why would the receiver want to know?"],
        note: "Interference can change, lose or gain bits. Checking tells the receiver the data is wrong, so it can be sent again." },

      // ------------------------------------------------ Setting the Parity Bit
      { id: "pa-04", category: "pa-bit", randomize: function () {
          var d = bits(7), p = parityBit(d, "even");
          return { prompt: "Even parity. What parity bit should be added to " + d + "?", answers: [p], keywords: [new RegExp("^\\s*" + p + "\\s*$")],
            distractors: [p === "1" ? "0" : "1"],
            working: ["Count the 1s in " + d + ".", "Even parity: the total, including the parity bit, must be an even number."],
            note: d + " has " + ones(d) + " ones. Parity bit " + p + " makes " + (ones(d) + Number(p)) + ", an even number." };
        } },
      { id: "pa-05", category: "pa-bit", randomize: function () {
          var d = bits(7), p = parityBit(d, "odd");
          return { prompt: "Odd parity. What parity bit should be added to " + d + "?", answers: [p], keywords: [new RegExp("^\\s*" + p + "\\s*$")],
            distractors: [p === "1" ? "0" : "1"],
            working: ["Count the 1s in " + d + ".", "Odd parity: the total, including the parity bit, must be an odd number."],
            note: d + " has " + ones(d) + " ones. Parity bit " + p + " makes " + (ones(d) + Number(p)) + ", an odd number." };
        } },
      { id: "pa-06", category: "pa-bit", randomize: function () {
          var mode = drillPick(["even", "odd"]);
          return { prompt: "With " + mode + " parity, the parity bit makes the total number of 1s in the byte even or odd?", answers: [mode === "even" ? "Even" : "Odd"],
            keywords: [word(mode)], distractors: [mode === "even" ? "Odd" : "Even"],
            working: ["The name of the parity tells you."], note: mode.charAt(0).toUpperCase() + mode.slice(1) + " parity: the total number of 1s is " + mode + "." };
        } },

      // ------------------------------------------------ Checking a Byte
      { id: "pa-07", category: "pa-check", randomize: function () {
          var b = bits(8);
          return { prompt: "How many 1s are in this byte?\n" + b, answers: [String(ones(b))], keywords: [new RegExp("^\\s*" + ones(b) + "\\s*$")],
            distractors: [ones(b) + 1, ones(b) - 1, 8 - ones(b), ones(b) + 2].map(String).filter(function (x, i, all) { return x !== String(ones(b)) && Number(x) >= 0 && all.indexOf(x) === i; }).slice(0, 3),
            working: ["Point at each bit in turn and count only the 1s."], note: b + " has " + ones(b) + " ones." };
        } },
      { id: "pa-08", category: "pa-check", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), sent = parityBit(d, mode) + d, bad = Math.random() < 0.5, got = sent;
          if (bad) { var k = Math.floor(Math.random() * 8); got = sent.slice(0, k) + (sent[k] === "1" ? "0" : "1") + sent.slice(k + 1); }
          var found = (ones(got) % 2 === 0) !== (mode === "even");
          return { prompt: "This byte arrived. The sender used " + mode + " parity.\n" + got + "\nDoes the parity check find an error? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
            working: ["Count every 1, including the parity bit.", "Is the total " + mode + "? If not, an error is found."],
            note: ones(got) + " ones: " + (ones(got) % 2 === 0 ? "even" : "odd") + ". " + (found ? "That does not match " + mode + " parity: error found." : "That matches " + mode + " parity: no error found.") };
        } },
      { id: "pa-09", category: "pa-check", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), b = parityBit(d, mode) + d;
          return { prompt: "This byte arrived correctly:\n" + b + "\nWas it sent using odd or even parity?", answers: [mode === "even" ? "Even" : "Odd"],
            keywords: [word(mode)], distractors: [mode === "even" ? "Odd" : "Even"],
            working: ["Count the 1s in the whole byte.", "An even total means even parity; an odd total means odd parity."],
            note: b + " has " + ones(b) + " ones: " + mode + " parity." };
        } },
      { id: "pa-10", category: "pa-check", randomize: function () {
          var mode = drillPick(["even", "odd"]);
          return { prompt: "A byte sent with " + mode + " parity arrives with " + (mode === "even" ? "an odd" : "an even") + " number of 1s. What does the receiver know?", answers: ["An error has happened during transmission"],
            keywords: [/\b(error|errors|changed|corrupt\w*|damag\w*|incorrect|mistake|bits?\s+(is|are|was|were)\s+wrong|data\s+(is|was)\s+wrong|not\s+(the\s+)?same)\b/i],
            distractors: ["The byte arrived exactly as it was sent", "The sender used the wrong kind of cable", "The parity bit must always be a 0"],
            working: [mode.charAt(0).toUpperCase() + mode.slice(1) + " parity means the total must be " + mode + ".", "It is not. So what has happened to the bits?"],
            note: "The count of 1s does not match " + mode + " parity, so at least one bit was changed: an error is detected." };
        } },

      // ------------------------------------------------ When Parity Fails
      { id: "pa-11", category: "pa-miss", randomize: function () {
          var mode = drillPick(["even", "odd"]);
          return { prompt: "Two bits change in a byte sent with " + mode + " parity. Will the parity check find the error? Yes or No?", answers: ["No"],
            keywords: [/^\s*no\b/i], distractors: ["Yes"],
            working: ["When two bits change, does the number of 1s go from even to odd?", "Try it: 0110 becomes 1010. Count the 1s before and after."],
            note: "No: two changes keep the count of 1s even (or odd), so the check passes." };
        } },
      { id: "pa-12", category: "pa-miss", prompt: "Identify why an error may not be detected by a parity check.", answers: ["Two bits changed, so the number of 1s still matches"],
        keywords: [/\b(two|2|even\s+number|both|swap\w*|transpos\w*|more\s+than\s+one|pairs?|still\s+(even|odd|match\w*))\b/i],
        distractors: ["The byte was sent too slowly for the receiver to check it", "The parity bit is always sent first, before the data bits", "The data was compressed before it was sent across"],
        working: ["Think about what happens to the count of 1s when two bits change."],
        note: "An even number of bits changed (for example two bits, or two bits swapped), so the count of 1s still matches. From Cambridge IGCSE 0478/11, June 2021, Question 8(b)." },
      { id: "pa-13", category: "pa-miss", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), sent = parityBit(d, mode) + d;
          var a = sent.indexOf("1", 1), z = sent.indexOf("0", 1);
          if (a < 0 || z < 0) { d = "1010110"; sent = parityBit(d, mode) + d; a = sent.indexOf("1", 1); z = sent.indexOf("0", 1); }
          var got = sent.split(""); got[a] = "0"; got[z] = "1"; got = got.join("");
          return { prompt: "Sent with " + mode + " parity: " + sent + "\nReceived: " + got + "\nHow many bits were changed?", answers: ["2"],
            keywords: [/^\s*(2|two)(\s+bits?)?\s*$/i], distractors: ["1", "0", "3"],
            working: ["Compare the two rows one bit at a time.", "Count how many places are different."],
            note: "Two bits changed. The number of 1s is the same, so the parity check would not notice." };
        } }
    ];
  })()
});
