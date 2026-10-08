// Year 10, 2.2 L3: Echo Check and ARQ (Plenary)
// Loaded by Drills/index.html?drill=y10-2-2-l3
// The echo check (the receiver sends a copy back, the sender compares), where an error happened (there or back,
// and why the sender cannot tell), and automatic repeat query (ARQ): the timer, timeout, and positive and negative
// acknowledgement. Syllabus 0478 2.2 2 (echo check) and 2.2 4 (ARQ). Bytes, packet numbers and events are drawn
// at random and every answer is worked out by code. Wrong options are the usual mix-ups (the echo check corrects
// the error, the receiver compares, a timeout means the data was wrong).
DrillData.register("y10-2-2-l3", {
  title: "Year 10, 2.2 L3: Echo Check and ARQ",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["ec", "The Echo Check"],
    ["ec-where", "There or Back?"],
    ["arq", "ARQ: Timer and Timeout"],
    ["ack", "Positive and Negative Acknowledgement"]
  ],
  cards: (function () {
    function rnd(n) { return Math.floor(Math.random() * n); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    function flip(s, k) { return s.slice(0, k) + (s[k] === "1" ? "0" : "1") + s.slice(k + 1); }
    function trip(kind) {
      var sent = bits(8), arrived = kind === "there" ? flip(sent, rnd(8)) : sent;
      return { sent: sent, arrived: arrived, back: kind === "back" ? flip(arrived, rnd(8)) : arrived };
    }
    function whole(t) { return "Sent by the sender:        " + t.sent + "\nArrived at the receiver:   " + t.arrived + "\nCopy back at the sender:   " + t.back; }
    function arrival() {
      var mode = drillPick(["even", "odd"]), d = bits(7), got = parityBit(d, mode) + d;
      if (Math.random() < 0.5) got = flip(got, rnd(8));
      return { mode: mode, got: got, error: (ones(got) % 2 === 0) !== (mode === "even") };
    }
    var YES = /^\s*yes\b/i, NO = /^\s*no\b/i;
    var AGAIN = /^(?!\s*(no|not|it\s+does\s+not)\b)(?!.*\b(next|never)\b)(?!.*\b(not|don'?t)\s+(re-?)?send).*\b(again|resen[dt]|re-?send\w*|re-?transmit\w*|repeat\w*)\b/i;
    var PLACES = ["On the way there", "On the way back", "No error"];
    return [
      // ------------------------------------------------ The Echo Check
      { id: "pl-01", category: "ec", prompt: "In an echo check, what does the receiver send back to the sender?", answers: ["A copy of the data"],
        keywords: [/^(?!.*\b(checksum|parity|acknowledg\w*|total)\b).*\b(cop(y|ies)|data|same\s+bits|what\s+it\s+(got|received))\b/i],
        distractors: ["An acknowledgement", "A checksum value", "A parity bit"],
        working: ["The name is a clue: an echo is a sound that comes back to you.", "The sender wants to compare what it sent with what arrived."],
        note: "The receiver sends a copy of the data it received back to the sender." },
      { id: "pl-02", category: "ec", prompt: "In an echo check, who compares the data sent with the copy that came back: the sender or the receiver?", answers: ["The sender"],
        keywords: [/^\s*(the\s+)*(sender|sending\s+(device|computer))\b/i], distractors: ["The receiver"],
        working: ["Which side still has the original data?", "The copy travels back to that side."],
        note: "The sender. It still has the original data, and the copy comes back to it." },
      { id: "pl-03", category: "ec", randomize: function () {
          var t = trip(drillPick(["there", "back", "none"])), found = t.back !== t.sent;
          return { prompt: "Echo check. The sender sent: " + t.sent + "\nThe copy that came back: " + t.back + "\nIs an error detected? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? YES : NO], distractors: [found ? "No" : "Yes"],
            working: ["Write the copy under the data sent.", "Compare them bit by bit. Any difference means an error is detected."],
            note: found ? "The copy is different from the data sent: an error is detected." : "The copy is the same as the data sent: no error is detected." };
        } },
      { id: "pl-04", category: "ec", prompt: "In an echo check, the copy that came back does not match the data sent. What does the sender do?", answers: ["It sends the data again"],
        keywords: [AGAIN], distractors: ["It corrects the bit that changed", "It sends the next data", "It adds a parity bit to the data"],
        working: ["The sender knows there is an error, but not which bit.", "How can it get correct data to the receiver?"],
        note: "The sender sends the data again. The echo check detects an error; it does not correct it." },
      { id: "pl-05", category: "ec", prompt: "Explain how an echo check is used to check for errors in data after it is sent.", answers: ["The receiver sends a copy of the data back, and the sender compares it with the data it sent; if they do not match, there is an error"],
        keywords: [/^(?!\s*(no|not|it\s+does\s+not)\b)(?=.*\b(back|return\w*|echo\w*|cop(y|ies))\b)(?=.*\b(compar\w*|match\w*|same|differ\w*|check\w*)\b).*$/i],
        distractors: ["The receiver counts the 1s in each byte and checks the total is even", "The sender adds up the values and sends the total with the data", "The receiver sends an acknowledgement when the data is correct"],
        working: ["Step 1 happens at the receiver. What does it send, and to whom?", "Step 2 happens at the sender. What does it do with what comes back?"],
        note: "A copy of the data is sent back to the sender. The sender compares the data sent with the copy. If they do not match, an error has occurred. From Cambridge IGCSE 0478/13, November 2024, Question 2(f)(i)." },

      // ------------------------------------------------ There or Back?
      { id: "pl-06", category: "ec-where", randomize: function () {
          var kind = drillPick(["there", "back", "none"]), t = trip(kind);
          var ans = kind === "there" ? PLACES[0] : kind === "back" ? PLACES[1] : PLACES[2];
          return { prompt: "You can see the whole trip.\n" + whole(t) + "\nWhere did the error happen: on the way there, on the way back, or no error?", answers: [ans],
            keywords: [kind === "there" ? /^(?!.*\b(no|none|back)\b).*\b(there|to\s+(the\s+)?receiv\w*)\b/i : kind === "back" ? /^(?!.*\b(no|none)\b).*\b(back|to\s+(the\s+)?send\w*)\b/i : /^\s*(no|none|nowhere|nothing)\b|^\s*there\s+(is|was)\s+no\b/i],
            distractors: PLACES.filter(function (p) { return p !== ans; }), format: "Type: on the way there, on the way back, or no error",
            working: ["Compare the top two rows: did the data arrive as it was sent?", "Compare the bottom two rows: did the copy come back as the receiver sent it?"],
            note: kind === "there" ? "What arrived is different from what was sent: the error happened on the way there." : kind === "back" ? "The data arrived correctly; the copy changed on the way back." : "All three rows are the same: no error." };
        } },
      { id: "pl-07", category: "ec-where", prompt: "Echo check: the copy that came back does not match the data sent. Can the sender tell whether the error happened on the way there or on the way back? Yes or No?", answers: ["No"],
        keywords: [NO], distractors: ["Yes"],
        working: ["The sender only sees two things: the data it sent and the copy back.", "Does the sender ever see what arrived at the receiver?"],
        note: "No. An error on either trip gives the same result at the sender: a copy that does not match." },
      { id: "pl-08", category: "ec-where", randomize: function () {
          var kind = drillPick(["there", "back", "none"]), t = trip(kind), again = kind !== "none";
          return { prompt: "Echo check. You can see the whole trip.\n" + whole(t) + "\nDoes the sender send the data again? Yes or No?", answers: [again ? "Yes" : "No"],
            keywords: [again ? YES : NO], distractors: [again ? "No" : "Yes"],
            working: ["The sender cannot see the middle row. Cover it up.", "Compare the top row with the bottom row."],
            note: again ? (kind === "back" ? "Yes. The data arrived correctly, but the sender only sees a copy that does not match, so it sends the data again." : "Yes. The copy back does not match the data sent.") : "No. The copy back matches the data sent." };
        } },
      { id: "pl-09", category: "ec-where", prompt: "Give one drawback of using an echo check.", answers: ["The sender cannot tell if the error was on the way there or on the way back"],
        keywords: [/^(?!\s*(no|not|it\s+does\s+not)\b).*(\bthere\b.*\bback\b|\bback\b.*\bthere\b|\bwhich\s+(way|trip|direction)\b|\bwhere\b|\bdirection\b|\btwice\b|\btwo\s+times\b|\bdouble\w*|\blonger\b|\bslow\w*|\bmore\s+(data|traffic|time)\b)/i],
        distractors: ["It cannot detect a change in one bit", "It only works with even parity", "It adds a parity bit to every byte"],
        working: ["Think about the compare slide: an error on the way there and one on the way back look the same.", "Or think about how many times the data travels."],
        note: "Any one: the sender cannot tell whether the error was on the way there or on the way back; the data travels twice, so it takes longer." },

      // ------------------------------------------------ ARQ: Timer and Timeout
      { id: "pl-10", category: "arq", prompt: "ARQ: when the sender sends the data, what does it start at the same time?", answers: ["A timer"],
        keywords: [/^(?!.*\bnot\b).*\b(timer|clock|count\s*down|countdown|timing)\b/i], distractors: ["A parity check", "An echo check", "A checksum"],
        working: ["The sender waits for an acknowledgement, but not forever.", "Something must tell the sender when it has waited long enough."],
        note: "A timer. If no acknowledgement arrives before it runs out, the data is sent again." },
      { id: "pl-11", category: "arq", prompt: "ARQ: the timer runs out before an acknowledgement arrives. What is this called?", answers: ["Timeout"],
        keywords: [/^\s*(a\s+|the\s+)?time[\s-]*outs?\s*\.?\s*$/i], distractors: ["Acknowledgement", "Echo check", "Data loss"],
        working: ["The word has two parts: what has run out, and the word for finished.", "It is one word."],
        note: "A timeout. The sender then sends the data again." },
      { id: "pl-12", category: "arq", prompt: "ARQ: a timeout happens. What does the sender do?", answers: ["It sends the data again"],
        keywords: [AGAIN], distractors: ["It sends the next data", "It corrects the data", "It stops sending data"],
        working: ["Did the sender get an acknowledgement for this data?", "Without one, the sender cannot be sure the data arrived correctly."],
        note: "It sends the data again, and starts the timer again." },
      { id: "pl-13", category: "arq", randomize: function () {
          var q = drillPick([["the data arrived with an error", "No"], ["no acknowledgement arrived in time", "Yes"]]);
          return { prompt: "ARQ: a timeout happens. Does the sender know that " + q[0] + "? Yes or No?", answers: [q[1]],
            keywords: [q[1] === "Yes" ? YES : NO], distractors: [q[1] === "Yes" ? "No" : "Yes"],
            working: ["A timeout only means one thing: the timer ran out first.", "The data could have been lost, or had an error, or the acknowledgement could have been lost."],
            note: q[1] === "No" ? "No. A timeout only tells the sender that no acknowledgement arrived in time. It does not know why." : "Yes. That is exactly what a timeout means: the timer ran out before an acknowledgement arrived." };
        } },
      { id: "pl-14", category: "arq", randomize: function () {
          var p = 1 + rnd(4), log = [], steps = 2 + rnd(3), i, e;
          for (i = 0; i < steps; i++) {
            log.push("Sent packet " + p + ". Timer started.");
            e = i === steps - 1 ? drillPick(["ack", "timeout", "nak"]) : drillPick(["ack", "ack", "timeout", "nak"]);
            if (e === "ack") { log.push("Positive acknowledgement for packet " + p + " arrived."); p += 1; }
            else if (e === "nak") log.push("Negative acknowledgement for packet " + p + " arrived.");
            else log.push("Timeout: no acknowledgement arrived.");
          }
          return { prompt: "ARQ. This is what happened at the sender:\n" + log.map(function (l, k) { return (k + 1) + ". " + l; }).join("\n") + "\nWhich packet does the sender send next?", answers: [String(p)],
            keywords: [drillNumberRe(p, "packet")], distractors: drillWrongNumbers(p, [p + 1, p - 1, p + 2], 2), format: "Type the packet number",
            working: ["Which packet was sent LAST?", "Was it acknowledged? If not, it goes again."],
            note: "The last packet sent was " + (e === "ack" ? p - 1 : p) + ". " + (e === "ack" ? "It was acknowledged, so the next is packet " + p + "." : "It was not acknowledged, so packet " + p + " is sent again.") };
        } },
      { id: "pl-15", category: "arq", prompt: "Explain how ARQ uses a timeout to make sure data is received.", answers: ["A timer starts when the data is sent; if no acknowledgement arrives before the timer runs out, the data is sent again"],
        keywords: [/^(?!\s*(no|not|it\s+does\s+not)\b)(?=.*\b(timer|time|timeout|time-out|clock)\b)(?=.*\b(again|resen[dt]|re-?send\w*|re-?transmit\w*|repeat\w*)\b).*$/i],
        distractors: ["The receiver sends a copy of the data back to the sender to compare", "The sender adds up the values and sends the total with the data", "The receiver counts the 1s and checks they match the parity"],
        working: ["What does the sender start when it sends the data?", "What happens if nothing comes back before that runs out?"],
        note: "A timer is started when the data is sent. If no acknowledgement arrives before the timer runs out (a timeout), the data is sent again. From Cambridge IGCSE 0478/13, November 2023, Question 5(c)." },

      // ------------------------------------------------ Positive and Negative Acknowledgement
      { id: "pl-16", category: "ack", randomize: function () {
          var a = arrival(), ans = a.error ? "Send nothing" : "Send a positive acknowledgement";
          return { prompt: "You are the receiver. ARQ with positive acknowledgement is used, with " + a.mode + " parity.\nThis byte arrived: " + a.got + "\nWhat do you do: send a positive acknowledgement, or send nothing?", answers: [ans],
            keywords: [a.error ? /^\s*(send\s+)?(nothing|none|no\s+(acknowledg\w*|message|reply))\b|\b(do\s+not|don'?t)\s+send\b/i : /^(?!.*\b(nothing|no|not|don'?t|negative)\b).*\b(acknowledg\w*|ack)\b/i],
            distractors: [a.error ? "Send a positive acknowledgement" : "Send nothing", "Send a copy of the byte back"],
            working: ["Count the 1s, including the parity bit. Does the count match " + a.mode + " parity?", "Positive acknowledgement: the receiver only replies when the data is correct."],
            note: a.got + " has " + ones(a.got) + " ones. " + (a.error ? "That does not match " + a.mode + " parity, so the receiver sends nothing and the sender's timeout makes it send the byte again." : "That matches " + a.mode + " parity, so the receiver sends a positive acknowledgement.") };
        } },
      { id: "pl-17", category: "ack", randomize: function () {
          var a = arrival();
          return { prompt: "You are the receiver. ARQ with negative acknowledgement is used, with " + a.mode + " parity.\nThis byte arrived: " + a.got + "\nDo you send a negative acknowledgement? Yes or No?", answers: [a.error ? "Yes" : "No"],
            keywords: [a.error ? YES : NO], distractors: [a.error ? "No" : "Yes"],
            working: ["Count the 1s, including the parity bit.", "A negative acknowledgement is sent when an error is found."],
            note: a.got + " has " + ones(a.got) + " ones. " + (a.error ? "That does not match " + a.mode + " parity: an error, so a negative acknowledgement is sent." : "That matches " + a.mode + " parity: no error, so no negative acknowledgement is sent.") };
        } },
      { id: "pl-18", category: "ack", randomize: function () {
          var found = Math.random() < 0.5, ans = found ? "Negative" : "Positive";
          return { prompt: "The receiver checks the data and " + (found ? "finds an error" : "finds no error") + ". It sends an acknowledgement to the sender. Is it a positive or a negative acknowledgement?", answers: [ans],
            keywords: [found ? /^\s*(a\s+)?negative(\s+acknowledg\w*)?\s*\.?\s*$/i : /^\s*(a\s+)?positive(\s+acknowledg\w*)?\s*\.?\s*$/i], distractors: [found ? "Positive" : "Negative"],
            working: ["Positive: it arrived correctly.", "Negative: an error was found, send it again."],
            note: found ? "Negative: an error was found, so the sender sends the data again." : "Positive: no error was found, so the sender sends the next data." };
        } },
      { id: "pl-19", category: "ack", prompt: "ARQ: a negative acknowledgement arrives at the sender. What does the sender do?", answers: ["It sends the data again"],
        keywords: [AGAIN], distractors: ["It sends the next data", "It waits for the next acknowledgement", "It corrects the bit that changed"],
        working: ["A negative acknowledgement means the receiver found an error.", "How does the receiver get a correct copy?"],
        note: "It sends the data again. A negative acknowledgement means an error was found." },
      { id: "pl-20", category: "ack", randomize: function () {
          var s = drillPick([["The receiver sends a copy of the data back to the sender.", "Echo check"], ["Acknowledgement and timeout are used.", "ARQ"]]);
          return { prompt: "Which error detection method is this: echo check or ARQ?\n" + s[0], answers: [s[1]],
            keywords: [s[1] === "ARQ" ? /^\s*(an?\s+)?(arq|automatic\s+repeat\s+(query|request)(\s*\(?arq\)?)?)\s*\.?\s*$/i : /^\s*(an?\s+)?echo(\s+check)?\s*\.?\s*$/i],
            distractors: [s[1] === "ARQ" ? "Echo check" : "ARQ"],
            working: ["Which method sends the data back?", "Which method uses a timer?"],
            note: s[1] + ". From Cambridge IGCSE 0478/12, June 2024, Question 6." };
        } }
    ];
  })()
});
