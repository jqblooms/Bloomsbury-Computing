// Year 10, 2.2 L2 Do Now Extension: 2.1 Data Transmission (packets, transmission methods, USB) and 2.2 L1 (errors
// and the parity check on one byte).
// Loaded by Drills/index.html?drill=y10-2-2-l2-ext
// For students who finish the Do Now early: a selection of 10 questions, written fresh. Every card has an `example`,
// a similar question worked through with different details, holding every rule and step needed, then two `working`
// nudges. An example never shows the card's own answer.
DrillData.register("y10-2-2-l2-ext", {
  title: "Year 10 Extension: Data Transmission and Parity",
  subtitle: "2.2 L2 Do Now Extension",
  categories: [
    ["ex-packets", "Packets (2.1 L1)"],
    ["ex-methods", "Transmission Methods (2.1 L2)"],
    ["ex-usb", "USB (2.1 L3)"],
    ["ex-parity", "Errors and Parity (2.2 L1)"]
  ],
  cards: (function () {
    function word(w) { return new RegExp("^\\s*(the\\s+|a\\s+)?" + w + "\\s*\\.?\\s*$", "i"); }
    function bits(n) { var s = ""; for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? "1" : "0"; return s; }
    function ones(s) { return s.split("").filter(function (b) { return b === "1"; }).length; }
    function parityBit(data, mode) { return (ones(data) % 2 === 0) === (mode === "even") ? "0" : "1"; }
    return [
      // ------------------------------------------------ Packets (2.1 L1)
      { id: "ex-01", category: "ex-packets", randomize: function () {
          var p = drillPick([["the destination address", "Header", "header"], ["the packet number", "Header", "header"],
            ["the actual data being sent", "Payload", "payload"], ["a check that the packet arrived without errors", "Trailer", "trailer"]]);
          return { prompt: "A packet has a header, a payload and a trailer. Which part holds " + p[0] + "?", answers: [p[1]], keywords: [word(p[2])],
            distractors: ["Header", "Payload", "Trailer"].filter(function (x) { return x !== p[1]; }),
            example: "Example: a parcel sent in the post.\nStep 1: the label on the outside says where it is going and who sent it. In a packet, this is the part at the START: the addresses and the packet number.\nStep 2: the thing inside the box is what you really wanted to send. In a packet, this is the MIDDLE part: the data.\nStep 3: a packet also has a part at the END: a check that it arrived without errors.\nRule: start = addresses and packet number; middle = the data; end = the error check.",
            working: ["Start = addresses and packet number; middle = the data; end = error check.", "Which part holds " + p[0] + "?"],
            note: p[1] + " holds " + p[0] + "." };
        } },
      { id: "ex-02", category: "ex-packets", prompt: "Data is broken into packets. Each packet can take a different route, and they are put back in order at the end. What is this method called?", answers: ["Packet switching"],
        keywords: [/^\s*packet[\s-]*switch(ing|ed)?\s*\.?\s*$/i], distractors: ["Serial transmission", "Parity check", "Full-duplex"],
        example: "Example question: name the device that decides which way each packet goes next.\nStep 1: packets travel across many networks.\nStep 2: at each junction, a device reads the destination address and sends the packet on its way.\nStep 3: that device is a router.\nNow your question: it asks for the name of the METHOD. The name has two words: what is being sent (packets), and a word meaning they change from path to path.",
        working: ["The name has two words. The first word is what the data is broken into.", "The second word means moving from one path to another."],
        note: "Packet switching: each packet can take its own route; the packet numbers put them back in order." },

      // ------------------------------------------------ Transmission Methods (2.1 L2)
      { id: "ex-03", category: "ex-methods", randomize: function () {
          var s = drillPick([["sends one bit at a time down a single wire", "Serial"], ["sends several bits at the same time, down several wires", "Parallel"]]);
          return { prompt: "Which method of data transmission " + s[0] + "? Serial or parallel?", answers: [s[1]], keywords: [word(s[1].toLowerCase())],
            distractors: [s[1] === "Serial" ? "Parallel" : "Serial"],
            example: "Example: think of cars on a road.\nStep 1: a road with ONE lane: the cars go one after another, in a line.\nStep 2: a road with EIGHT lanes: eight cars can go side by side at the same time.\nStep 3: bits are the same. One wire, one bit after another, is serial. Many wires, many bits side by side, is parallel.\nRule: one bit at a time on one wire = serial. Several bits at once on several wires = parallel.",
            working: ["One wire, one bit after another: serial.", "Several wires, several bits at once: parallel."],
            note: s[1] + " transmission " + s[0] + "." };
        } },
      { id: "ex-04", category: "ex-methods", randomize: function () {
          var s = drillPick([["A TV station sends a programme to a television. The television never sends data back.", "Simplex"],
            ["A walkie-talkie: one person talks, then lets go of the button so the other can reply.", "Half-duplex"],
            ["A phone call: both people can talk and hear each other at the same moment.", "Full-duplex"]]);
          var rx = { "Simplex": /^\s*simplex\s*\.?\s*$/i, "Half-duplex": /^\s*half[\s-]*duplex\s*\.?\s*$/i, "Full-duplex": /^\s*full[\s-]*duplex\s*\.?\s*$/i };
          return { prompt: s[0] + " Simplex, half-duplex or full-duplex?", answers: [s[1]], keywords: [rx[s[1]]],
            distractors: ["Simplex", "Half-duplex", "Full-duplex"].filter(function (x) { return x !== s[1]; }),
            example: "Example: a weather station sends readings to a computer, and the computer sends it new settings, but they take turns.\nStep 1: does data go both ways? Yes. So it is not simplex.\nStep 2: can both send at the same moment? No, they take turns.\nStep 3: both ways, one at a time: half-duplex.\nRule: one way only = simplex. Both ways, one at a time = half-duplex. Both ways at the same time = full-duplex.",
            working: ["Does data ever travel back the other way?", "If it does, can both sides send at the same moment?"],
            note: s[1] + "." };
        } },

      // ------------------------------------------------ USB (2.1 L3)
      { id: "ex-05", category: "ex-usb", prompt: "Give one drawback of using a USB connection.", answers: ["The cable can only be about 5 metres long"],
        keywords: [/(5\s*m|five\s+met|length|short|long|distance|far|reach|slow|speed|old\s+version|older\s+version|version)/i],
        distractors: ["It needs a separate wire for every bit", "It cannot supply any power to a device", "It only fits one way round"],
        example: "Example question: give one benefit of using a USB connection.\nStep 1: think about plugging in a new mouse.\nStep 2: the computer notices it straight away and loads its driver.\nStep 3: so one benefit is that the device is detected automatically.\nNow a drawback: think about a printer in another room, far away. And think about very fast devices.",
        working: ["Think about a printer in another room, 20 metres away.", "Is USB the fastest connection there is?"],
        note: "Any one: the cable can only be about 5 metres long; it is slower than some other connections; older versions may not work with newer devices." },
      { id: "ex-06", category: "ex-usb", prompt: "A new USB device is plugged into a computer. What does the computer do automatically?", answers: ["It detects the device and loads its driver"],
        keywords: [/(detect|recogni[sz]|identif|driver|install)/i],
        distractors: ["It encrypts every file on the device", "It adds a parity bit to every byte", "It breaks the device into packets"],
        example: "Example: you plug a new phone charger into the wall.\nStep 1: the socket just gives power; it does not know what the phone is.\nStep 2: a computer is cleverer: when a USB device is plugged in, it finds out what kind of device it is.\nStep 3: then it needs the right small program to talk to that kind of device.\nRule: think of two jobs: noticing the device, and getting the program that runs it.",
        working: ["The computer notices the device. What word means notices?", "It also loads a small program for the device. What is that program called?"],
        note: "The computer detects (recognises) the device automatically and loads the right driver." },

      // ------------------------------------------------ Errors and Parity (2.2 L1)
      { id: "ex-07", category: "ex-parity", randomize: function () {
          var sent = bits(8), kind = drillPick(["lost", "gained", "changed"]), got;
          var k = Math.floor(Math.random() * 7) + 1;
          if (kind === "lost") got = sent.slice(0, k) + sent.slice(k + 1);
          else if (kind === "gained") got = sent.slice(0, k) + drillPick(["0", "1"]) + sent.slice(k);
          else got = sent.slice(0, k) + (sent[k] === "1" ? "0" : "1") + sent.slice(k + 1);
          var ans = kind === "lost" ? "Data loss" : kind === "gained" ? "Data gain" : "Data change";
          return { prompt: "Sent:     " + sent + "\nReceived: " + got + "\nWhich kind of error is this: data loss, data gain or data change?", answers: [ans],
            keywords: [kind === "lost" ? /^\s*(data\s+)?(lost|loss)\s*\.?\s*$/i : kind === "gained" ? /^\s*(data\s+)?(gained|gain)\s*\.?\s*$/i : /^\s*(data\s+)?(changed|change)\s*\.?\s*$/i],
            distractors: ["Data loss", "Data gain", "Data change"].filter(function (x) { return x !== ans; }),
            example: "Example:\nSent:     1100\nReceived: 11000\nStep 1: count the bits sent: 4.\nStep 2: count the bits received: 5. One MORE bit arrived, so this is data gain.\nStep 3: if FEWER bits arrive, it is data loss.\nStep 4: if the SAME number arrive but one is different, it is data change.",
            working: ["Count the bits in each row: 8 were sent. How many arrived?", "Same number of bits? Then look for one bit that is different."],
            note: got.length < 8 ? "Only " + got.length + " bits arrived: data loss." : got.length > 8 ? got.length + " bits arrived: data gain." : "Still 8 bits, but one is different: data change." };
        } },
      { id: "ex-08", category: "ex-parity", randomize: function () {
          var d = bits(7), p = parityBit(d, "even");
          return { prompt: "An even parity check is used. What parity bit is added to the data " + d + "?", answers: [p], keywords: [new RegExp("^\\s*" + p + "\\s*$")],
            distractors: [p === "1" ? "0" : "1"],
            example: "Example: even parity, data 1100101.\nStep 1: count the 1s: 1, 1, 1, 1. That is 4.\nStep 2: even parity means the total number of 1s, with the parity bit, must be even.\nStep 3: 4 is already even, so the parity bit is 0.\nStep 4: if the count had been odd (say 3), the parity bit would be 1, to make it even.",
            working: ["Count the 1s in " + d + ".", "Is that count already even? If yes, the parity bit adds nothing."],
            note: d + " has " + ones(d) + " ones. Parity bit " + p + " makes " + (ones(d) + Number(p)) + ", an even number." };
        } },
      { id: "ex-09", category: "ex-parity", randomize: function () {
          var d = bits(7), p = parityBit(d, "odd");
          return { prompt: "An odd parity check is used. What parity bit is added to the data " + d + "?", answers: [p], keywords: [new RegExp("^\\s*" + p + "\\s*$")],
            distractors: [p === "1" ? "0" : "1"],
            example: "Example: odd parity, data 0110100.\nStep 1: count the 1s: 1, 1, 1. That is 3.\nStep 2: odd parity means the total number of 1s, with the parity bit, must be odd.\nStep 3: 3 is already odd, so the parity bit is 0.\nStep 4: if the count had been even (say 4), the parity bit would be 1, to make it odd.",
            working: ["Count the 1s in " + d + ".", "Is that count already odd? If yes, the parity bit adds nothing."],
            note: d + " has " + ones(d) + " ones. Parity bit " + p + " makes " + (ones(d) + Number(p)) + ", an odd number." };
        } },
      { id: "ex-10", category: "ex-parity", randomize: function () {
          var mode = drillPick(["even", "odd"]), d = bits(7), sent = parityBit(d, mode) + d, bad = Math.random() < 0.5, got = sent;
          if (bad) { var k = Math.floor(Math.random() * 8); got = sent.slice(0, k) + (sent[k] === "1" ? "0" : "1") + sent.slice(k + 1); }
          var found = (ones(got) % 2 === 0) !== (mode === "even");
          return { prompt: "This byte arrived. The sender used " + mode + " parity.\n" + got + "\nDoes the parity check find an error? Yes or No?", answers: [found ? "Yes" : "No"],
            keywords: [found ? /^\s*yes\b/i : /^\s*no\b/i], distractors: [found ? "No" : "Yes"],
            example: "Example: odd parity, this byte arrived: 10110001.\nStep 1: count every 1, including the parity bit at the start: 1, 1, 1, 1. That is 4.\nStep 2: odd parity means the count must be odd.\nStep 3: 4 is even, so it does not match: the check finds an error.\nRule: count matches the parity = no error found. Count does not match = error found.",
            working: ["Count every 1, including the parity bit.", "Is the total " + mode + "? If not, an error is found."],
            note: ones(got) + " ones: " + (ones(got) % 2 === 0 ? "even" : "odd") + ". " + (found ? "That does not match " + mode + " parity: error found." : "That matches " + mode + " parity: no error found.") };
        } }
    ];
  })()
});
