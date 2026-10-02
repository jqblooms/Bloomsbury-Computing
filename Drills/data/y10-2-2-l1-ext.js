// Year 10, 2.2 L1 Do Now Extension: the whole of 2.1 Data Transmission (packets, transmission methods, USB).
// Loaded by Drills/index.html?drill=y10-2-2-l1-ext
// For students who finish the Do Now early: a selection of 10 questions across the topic, written fresh. Every
// card has an `example`, a similar question worked through with different details, holding every rule and step
// needed, then two `working` nudges. An example never shows the card's own answer.
DrillData.register("y10-2-2-l1-ext", {
  title: "Year 10 Extension: Data Transmission (2.1)",
  subtitle: "2.2 L1 Do Now Extension",
  categories: [
    ["ex-packets", "Packets (2.1 L1)"],
    ["ex-methods", "Transmission Methods (2.1 L2)"],
    ["ex-usb", "USB (2.1 L3)"]
  ],
  cards: (function () {
    function word(w) { return new RegExp("^\\s*(the\\s+|a\\s+)?" + w + "\\s*\\.?\\s*$", "i"); }
    return [
      // ------------------------------------------------ Packets (2.1 L1)
      { id: "ex-01", category: "ex-packets", randomize: function () {
          var p = drillPick([["holds the actual data being sent", "Payload", "payload"],
            ["is at the start, and holds the addresses and the packet number", "Header", "header"],
            ["is at the end, and holds a check that the packet arrived without errors", "Trailer", "trailer"]]);
          return { prompt: "A packet has three parts: header, payload and trailer. Which part " + p[0] + "?", answers: [p[1]], keywords: [word(p[2])],
            distractors: ["Header", "Payload", "Trailer"].filter(function (x) { return x !== p[1]; }),
            example: "Example: think of a letter in the post.\nStep 1: the envelope at the front says where it is going and who sent it. In a packet this is the header: destination address, originator's address, packet number.\nStep 2: the letter inside is what you actually want to send. In a packet this is the payload: the data.\nStep 3: a packet also ends with a trailer, holding a check that it arrived without errors.\nRule: header = start (addresses, packet number); payload = middle (the data); trailer = end (error check).",
            working: ["Header = start, payload = middle, trailer = end.", "Which part does this job: " + p[0] + "?"],
            note: p[1] + ": it " + p[0] + "." };
        } },
      { id: "ex-02", category: "ex-packets", prompt: "Give one item stored in a packet's header.", answers: ["The destination address"],
        keywords: [/\b(destination|originator|sender|source|address|addresses|packet\s+number|sequence\s+number|ip)\b/i],
        distractors: ["The photo or text being sent", "The total size of the whole file", "The name of the program used"],
        example: "Example question: give one item stored in a packet's trailer.\nStep 1: the trailer is the END of the packet.\nStep 2: it holds a value the receiver uses to check the packet for errors.\nStep 3: so one item in the trailer is an error check.\nNow the header: think about what a router needs to know to deliver the packet, and what the receiver needs to put the packets back in order.",
        working: ["What does a router need to know to deliver the packet?", "How does the receiver put packets back in the right order?"],
        note: "Any one: destination address, originator's (sender's) address, packet number." },
      { id: "ex-03", category: "ex-packets", prompt: "Packets can arrive in a different order from the order they were sent. Explain why.", answers: ["Each packet can take a different route across the network"],
        keywords: [/(route|path|way|road).*(different|own|separate|another|each|other)|(different|own|separate|another|each|other).*(route|path|way|road)|busy|traffic|congest|delay/i],
        distractors: ["Packets are always put in alphabetical order before they leave", "The trailer sorts the packets into order before they leave", "The payload changes size during the trip across the internet"],
        example: "Example: three cars leave school together to go to the same mall.\nStep 1: each driver chooses a road. One road has heavy traffic.\nStep 2: the cars reach the mall at different times, not in the order they left.\nStep 3: packets are the same: routers send each one along whichever path is best at that moment.\nRule: if things travel by different paths, they can arrive in a different order, so the packet number is used to put them back in order.",
        working: ["Do all packets travel along the same path?", "What happens if one path is busier than another?"],
        note: "Each packet can take a different route (path), so some arrive before others. The packet number puts them back in order." },

      // ------------------------------------------------ Transmission Methods (2.1 L2)
      { id: "ex-04", category: "ex-methods", randomize: function () {
          var s = drillPick([["to a computer in another building, 3 km away", "Serial"], ["between two chips inside a computer, a few centimetres apart, as fast as possible", "Parallel"], ["to a printer on another floor, 150 metres away", "Serial"]]);
          return { prompt: "Data is sent " + s[0] + ". Serial or parallel transmission?", answers: [s[1]], keywords: [word(s[1].toLowerCase())],
            distractors: [s[1] === "Serial" ? "Parallel" : "Serial"],
            example: "Example: data is sent to a camera at the other end of a sports field, 400 metres away.\nStep 1: how far does the data travel? A long way.\nStep 2: over a long distance, bits sent side by side (parallel) arrive out of step and the data can be wrong.\nStep 3: one bit at a time down one wire (serial) arrives in order. So: serial.\nRule: long distance: serial. Very short distance where speed matters most: parallel.",
            working: ["How far does the data travel?", "Long distance: serial. Very short and fast: parallel."],
            note: s[1] + (s[1] === "Serial" ? ": over a long distance parallel bits would skew." : ": over a very short distance, sending several bits at once is faster.") };
        } },
      { id: "ex-05", category: "ex-methods", prompt: "Bits sent at the same time down a long parallel cable arrive at slightly different times. What is this problem called?", answers: ["Skewing"],
        keywords: [/^\s*(skew|skewing|skewed|bit\s+skew|data\s+skew)\s*\.?\s*$/i], distractors: ["Simplex", "Interference", "Packet switching"],
        example: "Example: eight runners start a race at exactly the same moment, one in each lane.\nStep 1: the lanes are not all the same; some runners are slightly slower.\nStep 2: they finish at slightly different times, out of step.\nStep 3: bits in a long parallel cable do the same: each wire is a lane, and the bits get out of step, so the data received can be wrong.\nRule: this problem only affects parallel transmission over long distances. Its name begins with the letters s-k.",
        working: ["It happens in parallel cables over a long distance.", "Its name begins with s-k."],
        note: "Skewing: parallel bits get out of step over a long distance." },
      { id: "ex-06", category: "ex-methods", randomize: function () {
          var s = drillPick([["A radio station sends music to car radios. Nothing comes back.", "Simplex"], ["Two-way radios: only one person can talk at a time, then the other replies.", "Half-duplex"], ["A video call where both people can talk and hear each other at the same moment.", "Full-duplex"]]);
          var rx = { "Simplex": /^\s*simplex\s*\.?\s*$/i, "Half-duplex": /^\s*half[\s-]*duplex\s*\.?\s*$/i, "Full-duplex": /^\s*full[\s-]*duplex\s*\.?\s*$/i };
          return { prompt: s[0] + " Simplex, half-duplex or full-duplex?", answers: [s[1]], keywords: [rx[s[1]]],
            distractors: ["Simplex", "Half-duplex", "Full-duplex"].filter(function (x) { return x !== s[1]; }),
            example: "Example: a sensor sends temperatures to a computer, and a computer also sends it new settings, but not at the same time.\nStep 1: does data ever go back the other way? Yes, settings go to the sensor. So it is not simplex.\nStep 2: can both send at the same moment? No, they take turns. So it is half-duplex.\nRule: one way only: simplex. Both ways, one at a time: half-duplex. Both ways at the same time: full-duplex.",
            working: ["Does data ever travel back the other way?", "If it does, can both sides send at the same moment?"],
            note: s[1] + "." };
        } },
      { id: "ex-07", category: "ex-methods", prompt: "Give one benefit of serial transmission compared with parallel transmission.", answers: ["The bits cannot skew, so it works over long distances"],
        keywords: [/(skew|order|long|distance|far|cheap|cost|fewer\s+wires|one\s+wire|single\s+wire|less\s+wire|reliab|interference|crosstalk|accura)/i],
        distractors: ["It sends eight bits at the same time down eight wires", "It is always quicker than parallel, whatever the cable", "It needs a separate wire for every single bit sent"],
        example: "Example question: give one benefit of parallel compared with serial.\nStep 1: parallel sends several bits at the same time, one down each wire.\nStep 2: so over a SHORT distance it moves data faster.\nStep 3: one benefit of parallel: it is faster over a short distance.\nNow serial: think about what goes wrong for parallel over a long cable, and how many wires serial needs.",
        working: ["What goes wrong for parallel over a long distance?", "How many wires does serial need?"],
        note: "Any one: no skewing, so it is reliable over long distances; fewer wires, so it is cheaper." },

      // ------------------------------------------------ USB (2.1 L3)
      { id: "ex-08", category: "ex-usb", prompt: "What do the letters USB stand for?", answers: ["Universal Serial Bus"],
        keywords: [/^\s*universal\s+serial\s+bus\s*\.?\s*$/i], distractors: ["Universal System Board", "Unified Serial Bridge", "Universal Storage Bus"],
        example: "Example: what do the letters CPU stand for?\nStep 1: C is Central, P is Processing, U is Unit: Central Processing Unit.\nNow USB:\nStep 2: U means it is a standard used almost everywhere, a word that also starts \"uni\".\nStep 3: S is the method from Lesson 2 that sends one bit at a time.\nStep 4: B is a short word for a connection that carries data, like a bus carries people.",
        working: ["The S is the method that sends one bit at a time.", "The U means it works almost everywhere."],
        note: "USB: Universal Serial Bus." },
      { id: "ex-09", category: "ex-usb", prompt: "Give one benefit of using a USB connection.", answers: ["Devices are detected automatically when plugged in"],
        keywords: [/(universal|standard|most\s+(computers|devices)|many\s+devices|automatic|detect|recogni[sz]|driver|power|charg|one\s+way|wrong\s+way|backward|order|skew)/i],
        distractors: ["The cable can be any length you like, even 50 metres", "It sends eight bits at once down eight separate wires", "Every device needs its own battery to be able to work"],
        example: "Example question: give one drawback of a USB connection.\nStep 1: think about a printer in another room, 20 metres away.\nStep 2: a USB cable can only be about 5 metres long.\nStep 3: so one drawback is the limited cable length.\nNow a benefit: think about plugging a new mouse in. Does it need setting up? Does it need a battery? Does the plug fit most computers?",
        working: ["Think about plugging in a new mouse: what happens straight away?", "Does a USB mouse need a battery?"],
        note: "Any one: standard connection that fits most devices; detected automatically and the driver loaded; supplies power; only fits one way; bits arrive in order." },
      { id: "ex-10", category: "ex-usb", prompt: "A printer is 20 metres from the computer. Explain why a USB cable is not suitable.", answers: ["A USB cable only reaches about 5 metres"],
        keywords: [/(5\s*m|five\s+met|length|too\s+long|too\s+far|distance|far|reach|short)/i],
        distractors: ["USB cannot send any pictures", "USB only works with phones and cameras", "A printer needs a parallel cable"],
        example: "Example: a keyboard sits 1 metre from a laptop.\nStep 1: how far is it? Only 1 metre.\nStep 2: a USB cable can be at most about 5 metres.\nStep 3: 1 metre is within that, so USB is fine here.\nRule: compare the distance with the most a USB cable can reach. If the distance is more, USB is not suitable.",
        working: ["How long can a USB cable be?", "Compare that with 20 metres."],
        note: "A USB cable can only be about 5 metres long, and 20 metres is much further." }
    ];
  })()
});
