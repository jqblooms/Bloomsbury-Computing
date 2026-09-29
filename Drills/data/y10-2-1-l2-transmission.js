// Year 10, 2.1 L2: Methods of Data Transmission
// Loaded by Drills/index.html?drill=y10-2-1-l2-transmission
// Serial and parallel, simplex, half-duplex and full-duplex, and choosing a method for a scenario.
// Keyword tokens are written the way the engine stems them: a trailing s is dropped from words over 4 letters ("wires" -> "wire"), so "bits" stays "bits".
DrillData.register("y10-2-1-l2-transmission", {
  title: "Year 10, 2.1 L2: Methods of Data Transmission",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["tx-serial", "Serial and Parallel"],
    ["tx-direction", "Simplex and Duplex"],
    ["tx-choose", "Choosing a Method"],
    ["tx-compare", "Advantages and Drawbacks"]
  ],
  cards: (function () {
    var DIRECTION = {
      simplex: ["Simplex", /^\s*(it\s+is\s+|it's\s+)?simplex(\s+(data\s+)?transmission)?\s*$/i],
      half: ["Half-duplex", /^\s*(it\s+is\s+|it's\s+)?half[\s-]*duplex(\s+(data\s+)?transmission)?\s*$/i],
      full: ["Full-duplex", /^\s*(it\s+is\s+|it's\s+)?full[\s-]*duplex(\s+(data\s+)?transmission)?\s*$/i]
    };
    var WIRING = {
      serial: ["Serial", /^\s*(it\s+is\s+|it's\s+)?serial(\s+(data\s+)?transmission)?\s*$/i],
      parallel: ["Parallel", /^\s*(it\s+is\s+|it's\s+)?parallel(\s+(data\s+)?transmission)?\s*$/i]
    };
    function others(map, key) { return Object.keys(map).filter(function (k) { return k !== key; }).map(function (k) { return map[k][0]; }); }

    // Scenarios for the "which method" cards. None is an exam question used in the lesson.
    var DIRECTION_SCENARIOS = [
      ["A radio station broadcasts music to car radios.", "simplex"],
      ["A temperature sensor sends readings to a computer. The computer never sends anything back.", "simplex"],
      ["A security camera sends its video to a recorder. Nothing is sent back to the camera.", "simplex"],
      ["A baby monitor sends sound from the baby's room to a speaker in another room.", "simplex"],
      ["Builders use two-way radios. Only one person can speak at a time, then the other replies.", "half"],
      ["A two-way radio has a button: hold it to talk, let go to listen.", "half"],
      ["Two friends on a video call can both talk and hear each other at the same moment.", "full"],
      ["Two computers send files to each other at the same time.", "full"],
      ["A phone call where both people can speak at once and still hear each other.", "full"]
    ];
    var WIRING_SCENARIOS = [
      ["Data is sent to a computer in a building 5 km away.", "serial"],
      ["A computer is connected to a router in a room at the other end of the school.", "serial"],
      ["A cable carries data between two offices on different floors, 200 m apart.", "serial"],
      ["Data moves between two chips inside a computer, a few centimetres apart, and must be as fast as possible.", "parallel"],
      ["Data travels a very short distance inside a device, where speed matters most.", "parallel"]
    ];

    return [
      // ------------------------------------------------ Serial and Parallel
      { id: "tx-01", category: "tx-serial", prompt: "In serial transmission, how many bits are sent at a time?", answers: ["One"],
        keywords: [/^\s*(one|1|a\s+single)(\s+bit)?(\s+at\s+a\s+time)?\s*$/i], distractors: ["Eight", "All of them", "Two"],
        note: "Serial sends one bit at a time, one after another, down a single wire." },
      { id: "tx-02", category: "tx-serial", prompt: "How many wires does serial transmission use to send the data?", answers: ["One"],
        keywords: [/^\s*(one|1|a\s+single|single)(\s+wires?)?\s*$/i], distractors: ["Eight", "One for each bit", "None"],
        note: "Serial uses a single wire, so the bits travel one after another." },
      { id: "tx-03", category: "tx-serial", prompt: "What does parallel transmission send at the same time?", answers: ["Several bits, down several wires"],
        keywords: [{ required: [["several", "multiple", "many", "8", "more", "lot"], ["bit", "bits"]], excluded: ["1"] }],
        distractors: ["One bit", "Only the packet header", "The whole file in one go"],
        note: "Parallel sends several bits at the same time, each down its own wire." },
      { id: "tx-04", category: "tx-serial", prompt: "Over a short distance, which is faster: serial or parallel transmission?", answers: ["Parallel"],
        keywords: [WIRING.parallel[1]], distractors: ["Serial", "They are the same speed"],
        note: "Parallel sends several bits at once, so it is faster over a short distance." },
      { id: "tx-05", category: "tx-serial", prompt: "Over a long distance, which is more reliable: serial or parallel transmission?", answers: ["Serial"],
        keywords: [WIRING.serial[1]], distractors: ["Parallel", "They are equally reliable"],
        note: "Serial bits travel one after another, so they cannot get out of step over a long distance." },
      { id: "tx-06", category: "tx-serial", prompt: "Over a long distance, bits sent in parallel can arrive at slightly different times. What is this called?", answers: ["Skewing"],
        keywords: [/^\s*(skew|skewing|skewed|bit\s+skew|data\s+skew|(the\s+)?bits\s+(are\s+|get\s+)?skewed|(getting\s+|being\s+)?out\s+of\s+sync(hroni[sz]ation)?)\s*$/i],
        distractors: ["Overflow", "Duplex", "Packet switching"],
        note: "Skewing: the bits get out of step, so the data received can be wrong." },

      // ------------------------------------------------ Simplex and Duplex
      { id: "tx-07", category: "tx-direction", prompt: "Data can only be sent in one direction. What is this method called?", answers: ["Simplex"],
        keywords: [DIRECTION.simplex[1]], distractors: others(DIRECTION, "simplex"),
        note: "Simplex: one direction only." },
      { id: "tx-08", category: "tx-direction", prompt: "Data can be sent in both directions, but only one direction at a time. What is this method called?", answers: ["Half-duplex"],
        keywords: [DIRECTION.half[1]], distractors: others(DIRECTION, "half"),
        note: "Half-duplex: both directions, taking turns." },
      { id: "tx-09", category: "tx-direction", prompt: "Data can be sent in both directions at the same time. What is this method called?", answers: ["Full-duplex"],
        keywords: [DIRECTION.full[1]], distractors: others(DIRECTION, "full"),
        note: "Full-duplex: both directions at once." },
      { id: "tx-10", category: "tx-direction", prompt: "Describe half-duplex data transmission.", answers: ["Data is sent in both directions, but only one direction at a time"],
        keywords: [{ required: [["both", "either", "two", "each"], ["not", "only", "turn", "wait"]] }],
        distractors: ["Data is sent in one direction", "Data is sent both ways at the same time", "Several bits are sent at the same time"],
        note: "Half-duplex: both directions, but not at the same time. From Cambridge IGCSE 0478/12, March 2021, Question 1(d)(ii)." },
      { id: "tx-11", category: "tx-direction", prompt: "Define full-duplex data transmission.", answers: ["Data is sent in both directions at the same time"],
        keywords: [{ required: [["both", "either", "two", "each"], ["same", "simultaneously", "simultaneous", "together", "once"]], excluded: ["not", "turn", "only"] }],
        distractors: ["Data is sent in both directions, but not at the same time", "Data is sent in one direction", "Data is sent one bit at a time"],
        note: "Full-duplex: both directions at the same time. From Cambridge IGCSE 0478/12, March 2023, Question 5(b)(ii)." },
      { id: "tx-12", category: "tx-direction", prompt: "In simplex transmission, can the receiver send data back to the sender?", answers: ["No"],
        keywords: [/^\s*no\b/i], distractors: ["Yes"],
        note: "Simplex is one direction only, so nothing can be sent back." },

      // ------------------------------------------------ Choosing a Method
      { id: "tx-13", category: "tx-choose", randomize: function () {
          var s = drillPick(DIRECTION_SCENARIOS), a = DIRECTION[s[1]];
          return { prompt: s[0] + " Simplex, half-duplex or full-duplex?", answers: [a[0]], keywords: [a[1]], distractors: others(DIRECTION, s[1]),
            working: ["Does data ever travel back the other way?", "If it does, can both sides send at the same moment?"],
            note: a[0] + ": " + (s[1] === "simplex" ? "data only ever travels one way." : s[1] === "half" ? "both ways, but one at a time." : "both ways at the same time.") };
        } },
      { id: "tx-14", category: "tx-choose", randomize: function () {
          var s = drillPick(DIRECTION_SCENARIOS.filter(function (x) { return x[1] !== "simplex"; })), a = DIRECTION[s[1]];
          return { prompt: s[0] + " Data travels both ways. Is this half-duplex or full-duplex?", answers: [a[0]], keywords: [a[1]], distractors: others(DIRECTION, s[1]),
            working: ["Both sides can send. The question is when.", "Can they send at the same moment, or must one wait?"],
            note: a[0] + (s[1] === "half" ? ": one side must wait for the other." : ": both sides send at the same time.") };
        } },
      { id: "tx-15", category: "tx-choose", randomize: function () {
          var s = drillPick(WIRING_SCENARIOS), a = WIRING[s[1]];
          return { prompt: s[0] + " Serial or parallel transmission?", answers: [a[0]], keywords: [a[1]], distractors: others(WIRING, s[1]).concat(["Simplex"]),
            working: ["How far does the data travel?", "Over a long distance, bits sent side by side get out of step."],
            note: s[1] === "serial" ? "Serial: over a long distance, bits sent in parallel would skew." : "Parallel: over a very short distance, sending several bits at once is faster." };
        } },
      { id: "tx-16", category: "tx-choose", prompt: "Data is sent to a computer 30 km away. Explain why serial is more suitable than parallel.",
        answers: ["Over a long distance, parallel bits can skew, but serial bits arrive in order"],
        keywords: [{ required: [["skew", "skewing", "skewed", "sync", "order", "error", "corrupt", "corrupted", "step", "interference", "reliable", "accurate", "accurately"], ["long", "distance", "far", "30", "km"]] }],
        distractors: ["Serial is faster than parallel", "Parallel is cheaper over a long distance", "Serial sends several bits at the same time"],
        note: "Over 30 km, bits sent in parallel can skew (arrive out of step); serial bits arrive in order, and one wire costs less. From Cambridge IGCSE 0478/12, March 2021, Question 1(d)(i)." },

      // ------------------------------------------------ Advantages and Drawbacks
      { id: "tx-17", category: "tx-compare", prompt: "Give one improvement to the data transmission if parallel is used instead of serial.", answers: ["Data is sent faster"],
        keywords: [{ required: [["fast", "faster", "quick", "quicker", "speed", "sooner", "less"]], excluded: ["slower", "slow"] }],
        distractors: ["Fewer wires are needed", "It works better over long distances", "Bits cannot skew"],
        note: "Parallel sends several bits at once, so data is sent faster. From Cambridge IGCSE 0478/11, June 2025, Question 4(a)(ii)." },
      { id: "tx-18", category: "tx-compare", prompt: "State one drawback of using serial data transmission, rather than parallel.", answers: ["It is slower"],
        keywords: [{ required: [["slow", "slower", "longer", "time"]], excluded: ["faster"] }],
        distractors: ["It needs more wires", "Bits can skew", "It only works in one direction"],
        note: "Serial sends one bit at a time, so it is slower. From Cambridge IGCSE 0478/13, June 2021, Question 6(c)(ii)." },
      { id: "tx-19", category: "tx-compare", prompt: "Give one reason parallel transmission is not suitable over a long distance.", answers: ["The bits can skew and arrive out of step"],
        keywords: [{ required: [["skew", "skewing", "skewed", "sync", "step", "order", "different", "corrupt", "corrupted", "error", "interference", "expensive", "cost"]] }],
        distractors: ["It is too fast", "It uses only one wire", "It sends one bit at a time"],
        note: "Over a long distance the bits can skew, and many wires cost more." },
      { id: "tx-20", category: "tx-compare", prompt: "Give one advantage of full-duplex over half-duplex transmission.", answers: ["Both sides can send at the same time, so there is no waiting"],
        keywords: [{ required: [["wait", "waiting", "same", "simultaneously", "once", "faster", "quicker"]], excluded: ["not"] }],
        distractors: ["It uses fewer wires", "Data only travels one way", "Bits cannot skew"],
        note: "Full-duplex sends both ways at once, so neither side has to wait." },
      { id: "tx-21", category: "tx-compare", prompt: "Give one drawback of simplex transmission.", answers: ["The receiver cannot send data back"],
        keywords: [{ required: [["back", "reply", "respond", "return", "confirm", "acknowledge", "1", "direction"]] }],
        distractors: ["It needs a wire for every bit", "Bits arrive at different times", "It is always slower than parallel"],
        note: "Simplex is one direction only, so the receiver cannot reply or confirm it received the data." }
    ];
  })()
});
