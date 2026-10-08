// Year 10, 2.2 L3 Activity 2: Be the Sender, Be the Receiver (automatic repeat query, ARQ)
// Loaded by Drills/index.html?drill=y10-2-2-l3-arq
// Be the receiver: check a byte with its parity bit (2.2 L1) and decide what to send back, with positive or
// negative acknowledgement. Be the sender: read what happened after a packet was sent (an acknowledgement, a
// negative acknowledgement, or a timeout) and decide which packet to send next. Every answer is worked out by code.
// Each card has a worked example with different values, then two nudges.
DrillData.register("y10-2-2-l3-arq", {
  title: "Year 10, 2.2 L3: Be the Sender, Be the Receiver",
  subtitle: "ARQ practice",
  categories: [
    ["aq-receiver", "Be the Receiver"],
    ["aq-sender", "Be the Sender"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    function flip(s, k) { return s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1); }
    // A byte that arrived: sent with the agreed parity, and perhaps one bit changed on the way.
    function arrival() {
      var mode = drillPick(["even", "odd"]), d = bits(7), got = parityBit(d, mode) + d, bad = Math.random() < 0.5;
      if (bad) got = flip(got, rnd(8));
      return { mode: mode, got: got, error: (ones(got) % 2 === 0) !== (mode === "even") };
    }
    var YES = /^\s*yes\b/i, NO = /^\s*no\b/i;
    var ACK = /^(?!.*\b(nothing|no|not|don'?t|negative)\b).*\b(acknowledg\w*|ack)\b/i;
    var NOTHING = /^\s*(send\s+)?(nothing|none|no\s+(acknowledg\w*|message|reply))\b|\b(do\s+not|don'?t)\s+send\b/i;
    // What happened after packet n was sent.
    var EVENTS = [
      ["ack", "A positive acknowledgement for packet # arrives."],
      ["timeout", "The timer runs out. No acknowledgement has arrived: a timeout."],
      ["nak", "A negative acknowledgement for packet # arrives."]
    ];
    return [
      // ------------------------------------------------ Be the Receiver
      { id: "aq-01", category: "aq-receiver", randomize: function () {
          var a = arrival(), ans = a.error ? "Send nothing" : "Send a positive acknowledgement";
          return { prompt: "You are the receiver. ARQ with positive acknowledgement is used. The bytes use " + a.mode + " parity.\nThis byte arrived: " + a.got + "\nWhat do you do: send a positive acknowledgement, or send nothing?", answers: [ans],
            keywords: [a.error ? NOTHING : ACK], distractors: [a.error ? "Send a positive acknowledgement" : "Send nothing", "Send a copy of the byte back"],
            example: "Example: positive acknowledgement, even parity. This byte arrived: 10110010.\nStep 1: count the 1s, including the parity bit: 1, 1, 1, 1. That is 4.\nStep 2: even parity needs an even count. 4 is even, so no error is found.\nStep 3: with positive acknowledgement, the receiver only replies when the data is correct: it sends an acknowledgement.\nStep 4: if an error had been found, the receiver would send nothing. The sender's timer would run out and it would send the byte again.",
            working: ["Count the 1s in " + a.got + ", including the parity bit. Does the count match " + a.mode + " parity?", "Positive acknowledgement: the receiver only replies when the data is correct."],
            note: a.got + " has " + ones(a.got) + " ones. " + (a.error ? "That does not match " + a.mode + " parity, so an error is found. The receiver sends nothing; the timeout will make the sender send it again." : "That matches " + a.mode + " parity, so no error is found. The receiver sends a positive acknowledgement.") };
        } },
      { id: "aq-02", category: "aq-receiver", randomize: function () {
          var a = arrival();
          return { prompt: "You are the receiver. ARQ with negative acknowledgement is used. The bytes use " + a.mode + " parity.\nThis byte arrived: " + a.got + "\nDo you send a negative acknowledgement? Yes or No?", answers: [a.error ? "Yes" : "No"],
            keywords: [a.error ? YES : NO], distractors: [a.error ? "No" : "Yes"],
            example: "Example: negative acknowledgement, odd parity. This byte arrived: 01101100.\nStep 1: count the 1s, including the parity bit: 1, 1, 1, 1. That is 4.\nStep 2: odd parity needs an odd count. 4 is even, so an error is found.\nStep 3: a negative acknowledgement tells the sender: an error was found, send it again.\nRule: error found = send a negative acknowledgement. No error found = do not.",
            working: ["Count the 1s in " + a.got + ", including the parity bit.", "A negative acknowledgement is sent when an error is found. Is there one?"],
            note: a.got + " has " + ones(a.got) + " ones. " + (a.error ? "That does not match " + a.mode + " parity: an error is found, so the receiver sends a negative acknowledgement." : "That matches " + a.mode + " parity: no error is found, so no negative acknowledgement is sent.") };
        } },
      { id: "aq-03", category: "aq-receiver", randomize: function () {
          var found = Math.random() < 0.5, ans = found ? "Negative" : "Positive";
          return { prompt: "You are the receiver. You check packet " + (2 + rnd(7)) + " and " + (found ? "find an error" : "find no error") + ". You send an acknowledgement to the sender.\nIs it a positive or a negative acknowledgement?", answers: [ans],
            keywords: [found ? /^\s*(a\s+)?negative(\s+acknowledg\w*)?\s*\.?\s*$/i : /^\s*(a\s+)?positive(\s+acknowledg\w*)?\s*\.?\s*$/i], distractors: [found ? "Positive" : "Negative"],
            example: "Example: think of a teacher marking homework and sending it back.\nStep 1: a tick means: this is right, carry on. That is like a positive acknowledgement.\nStep 2: a cross means: this is wrong, do it again. That is like a negative acknowledgement.\nNow your question: did the receiver find an error, or not?",
            working: ["Positive means: it arrived correctly.", "Negative means: an error was found, send it again."],
            note: found ? "An error was found, so it is a negative acknowledgement. The sender sends the packet again." : "No error was found, so it is a positive acknowledgement. The sender sends the next packet." };
        } },

      // ------------------------------------------------ Be the Sender
      { id: "aq-04", category: "aq-sender", randomize: function () {
          var n = 2 + rnd(7), e = drillPick(EVENTS), next = e[0] === "ack" ? n + 1 : n;
          return { prompt: "You are the sender. You sent packet " + n + " and started the timer.\n" + e[1].replace("#", n) + "\nWhich packet do you send next?", answers: [String(next)],
            keywords: [drillNumberRe(next, "packet")], distractors: drillWrongNumbers(next, [n + 1, n, n - 1], 2), format: "Type the packet number",
            example: "Example: the sender sent packet 12 and started the timer.\nStep 1: if a positive acknowledgement for packet 12 arrives, packet 12 got there safely. Send packet 13.\nStep 2: if a negative acknowledgement arrives, packet 12 had an error. Send packet 12 again.\nStep 3: if the timer runs out first (a timeout), the sender does not know if packet 12 got there. Send packet 12 again.",
            working: ["Did packet " + n + " get there safely? Only a positive acknowledgement says so.", "Negative acknowledgement or timeout: the same packet goes again."],
            note: e[0] === "ack" ? "Packet " + n + " was acknowledged, so the sender sends packet " + next + "." : (e[0] === "nak" ? "A negative acknowledgement means packet " + n + " had an error" : "A timeout means no acknowledgement came in time") + ", so the sender sends packet " + n + " again." };
        } },
      { id: "aq-05", category: "aq-sender", randomize: function () {
          // A short log of what happened, worked through to find the next packet.
          var p = 1 + rnd(4), log = [], steps = 2 + rnd(3), i, e;
          for (i = 0; i < steps; i++) {
            log.push("Sent packet " + p + ". Timer started.");
            e = i === steps - 1 ? drillPick(["ack", "timeout", "nak"]) : drillPick(["ack", "ack", "timeout", "nak"]);
            if (e === "ack") { log.push("Positive acknowledgement for packet " + p + " arrived."); p += 1; }
            else if (e === "nak") log.push("Negative acknowledgement for packet " + p + " arrived.");
            else log.push("Timeout: no acknowledgement arrived.");
          }
          return { prompt: "You are the sender. This is what happened:\n" + log.map(function (l, k) { return (k + 1) + ". " + l; }).join("\n") + "\nWhich packet do you send next?", answers: [String(p)],
            keywords: [drillNumberRe(p, "packet")], distractors: drillWrongNumbers(p, [p + 1, p - 1, p + 2], 2), format: "Type the packet number",
            example: "Example log:\n1. Sent packet 7. Timer started.\n2. Positive acknowledgement for packet 7 arrived.\n3. Sent packet 8. Timer started.\n4. Timeout: no acknowledgement arrived.\nStep 1: packet 7 was acknowledged, so the sender moved on to packet 8.\nStep 2: packet 8 timed out, so packet 8 was not acknowledged.\nStep 3: the next packet sent is packet 8 again.",
            working: ["Read the log one line at a time. Which packet was sent LAST?", "Was that packet acknowledged? If not, it goes again."],
            note: "Work down the log. The last packet sent was " + (e === "ack" ? p - 1 : p) + ". " + (e === "ack" ? "It was acknowledged, so the next is packet " + p + "." : "It was not acknowledged, so it is sent again: packet " + p + ".") };
        } }
    ];
  })()
});
