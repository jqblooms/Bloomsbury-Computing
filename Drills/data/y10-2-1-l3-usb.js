// Year 10, 2.1 L3: USB
// Loaded by Drills/index.html?drill=y10-2-1-l3-usb
// What USB is and how it transmits data (serial, half-duplex, data and power), its benefits and drawbacks, and
// whether it suits a given job. Syllabus 0478 2.1 3. Keyword tokens follow the engine's stemming: a trailing s is
// dropped from words over 4 letters.
DrillData.register("y10-2-1-l3-usb", {
  title: "Year 10, 2.1 L3: USB",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["usb-what", "What USB Is"],
    ["usb-how", "How USB Sends Data"],
    ["usb-good", "Benefits and Drawbacks"],
    ["usb-choose", "Is USB Suitable?"]
  ],
  cards: (function () {
    var BENEFIT = /(universal|standard|most\s+(computers|devices)|many\s+devices|fits?\s+(many|most|any)|automatic|detect|recogni[sz]|driver|power|charg|one\s+way|wrong\s+way|cannot\s+be\s+(put|plugged|inserted)\s+in\s+wrong|backward|different\s+speed|order|skew)/i;
    var DRAWBACK = /(length|long|short|5\s*m|five\s+metres?|distance|far|slow|speed|older|old\s+version|not\s+support|compatib|limited\s+power|power\s+(is\s+)?limited)/i;
    // Jobs: [description, suitable?, reason]
    var JOBS = [
      ["A keyboard plugged into a laptop on the same desk.", true, "It is a short distance, and USB can power the keyboard."],
      ["A phone connected to a computer to copy photos.", true, "USB is a standard connection and the cable is short."],
      ["A printer in an office 20 metres away from the computer.", false, "A USB cable can only be about 5 metres long."],
      ["A webcam plugged into a computer.", true, "It is close by, and USB sends the data and powers the webcam."],
      ["A security camera on the other side of a large building.", false, "The distance is far longer than a USB cable can be."]
    ];
    return [
      // ------------------------------------------------ What USB Is
      { id: "usb-01", category: "usb-what", prompt: "What do the letters USB stand for?", answers: ["Universal Serial Bus"],
        keywords: [/^\s*universal\s+serial\s+bus\s*\.?\s*$/i], distractors: ["Universal System Board", "Unified Serial Bridge", "Universal Storage Bus"],
        working: ["The S is a word from last lesson: one bit at a time."], note: "USB: Universal Serial Bus." },
      { id: "usb-02", category: "usb-what", prompt: "Which two things does a USB cable carry to a device like a mouse?", answers: ["Data and power"],
        keywords: [{ required: [["data", "information", "signal"], ["power", "electricity", "charge", "energy"]] }],
        distractors: ["Data and sound waves", "Only power", "Light and packets"], note: "A USB cable carries data and power, so a mouse needs no battery or plug." },
      { id: "usb-03", category: "usb-what", prompt: "What is meant by a USB interface?", answers: ["A standard connection between a device and a computer"],
        keywords: [{ required: [["standard", "universal", "common", "connect", "connection", "port", "plug"], ["device", "devices", "computer", "peripheral", "peripherals"]] }],
        distractors: ["A program that copies files from one hard disk to another hard disk", "A type of storage that keeps data when the power is switched off", "A wireless network that links all the laptops in a home"],
        note: "A standard connection between a device and a computer, used to send data. From Cambridge IGCSE 0478/12, March 2026, Question 3(c)(i)." },

      // ------------------------------------------------ How USB Sends Data
      { id: "usb-04", category: "usb-how", prompt: "Does USB send data by serial or parallel transmission?", answers: ["Serial"],
        keywords: [/^\s*(it\s+is\s+|it's\s+)?serial(\s+(data\s+)?transmission)?\s*\.?\s*$/i], distractors: ["Parallel"],
        working: ["Look at the letters: what does the S in USB stand for?"],
        note: "Serial: USB stands for Universal Serial Bus. From Cambridge IGCSE 0478/11, June 2021, Question 2(c)(ii)." },
      { id: "usb-05", category: "usb-how", prompt: "In serial transmission, how many bits are sent at a time?", answers: ["One"],
        keywords: [/^\s*(one|1|a\s+single)(\s+bit)?(\s+at\s+a\s+time)?\s*$/i], distractors: ["Eight", "Two", "All of them"],
        note: "Serial sends one bit at a time, one after another." },
      { id: "usb-06", category: "usb-how", prompt: "A USB mouse uses half-duplex. Can data go both ways at the same time?", answers: ["No"],
        keywords: [/^\s*no\b/i], distractors: ["Yes"],
        working: ["Half-duplex: both ways, but one way at a time."], note: "No: half-duplex sends both ways, but only one way at a time." },
      { id: "usb-07", category: "usb-how", prompt: "Describe how serial half-duplex transmission sends data.", answers: ["One bit at a time, both ways, but only one way at a time"],
        keywords: [{ required: [["one", "1", "single", "after"], ["both", "either", "two"], ["not", "only", "turn"]] }],
        distractors: ["Several bits at once, down several wires, in one direction only", "One bit at a time, in one direction only, never back the other way", "Several bits at once, in both directions at exactly the same time"],
        note: "Serial: one bit at a time. Half-duplex: both directions, one direction at a time. From Cambridge IGCSE 0478/11, June 2026, Question 4(b)." },

      // ------------------------------------------------ Benefits and Drawbacks
      { id: "usb-08", category: "usb-good", prompt: "Give one benefit of using a USB connection.", answers: ["It is a standard connection, so it fits most devices"],
        keywords: [BENEFIT], distractors: ["The cable can be any length you need, even 100 metres", "It sends many bits at the same time down several wires", "Every device needs its own battery to work"],
        working: ["Think about plugging in a new mouse: what happens, and what does it not need?"],
        note: "Any one: universal standard; device detected and driver loaded automatically; supplies power; only fits one way; backward compatible. From Cambridge IGCSE 0478/12, November 2025, Question 5(c)(ii)." },
      { id: "usb-09", category: "usb-good", prompt: "Give one drawback of using a USB connection.", answers: ["The cable can only be about 5 metres long"],
        keywords: [DRAWBACK], distractors: ["It fits most computers and most devices", "It powers the device through the same cable", "The computer detects the device automatically"],
        working: ["Think about a printer in a room far away."],
        note: "Any one: the cable length is limited (about 5 m); slower than some other connections; older versions may not be supported. From Cambridge IGCSE 0478/12, November 2025, Question 5(c)(iii)." },
      { id: "usb-10", category: "usb-good", prompt: "A new USB mouse works as soon as it is plugged in. Which benefit of USB is this?", answers: ["It is detected automatically and its driver is loaded"],
        keywords: [/(automatic|detect|recogni[sz]|driver|plug\s+and\s+play|straight\s+away|instant)/i],
        distractors: ["The cable can be up to 100 metres long", "It sends the bits in parallel, all at once", "It has its own battery and its own on and off switch"],
        note: "The computer detects the device and loads its driver automatically." },
      { id: "usb-11", category: "usb-good", prompt: "A USB mouse has no battery. Which benefit of USB makes this possible?", answers: ["The USB cable supplies power"],
        keywords: [/(power|electricity|charg|energy)/i], distractors: ["It is detected automatically", "It uses serial transmission", "It only fits one way"],
        note: "USB carries power as well as data." },

      // ------------------------------------------------ Is USB Suitable?
      { id: "usb-12", category: "usb-choose", randomize: function () {
          var j = drillPick(JOBS);
          return { prompt: j[0] + " Is a USB cable suitable?", answers: [j[1] ? "Yes" : "No"], keywords: [j[1] ? /^\s*yes\b/i : /^\s*no\b/i],
            distractors: [j[1] ? "No" : "Yes"], working: ["How far apart are the two devices? A USB cable is about 5 metres at most."],
            note: (j[1] ? "Yes: " : "No: ") + j[2] };
        } },
      { id: "usb-13", category: "usb-choose", randomize: function () {
          var j = drillPick(JOBS.filter(function (x) { return !x[1]; }));
          return { prompt: j[0] + " Why is a USB cable not suitable?", answers: ["The distance is too far for a USB cable"],
            keywords: [/(length|long|short|5\s*m|five|metre|meter|distance|far)/i],
            distractors: ["USB cannot send pictures or text to a printer", "USB needs a battery in every device", "USB only works with phones and cameras"],
            working: ["Compare the distance with how long a USB cable can be."], note: j[2] };
        } },
      { id: "usb-14", category: "usb-choose", prompt: "One benefit of USB is that the bits arrive in order. Why do they arrive in order?", answers: ["It is serial, so the bits are sent one at a time and cannot skew"],
        keywords: [/(serial|one\s+(bit\s+)?at\s+a\s+time|one\s+after|single\s+wire|skew)/i],
        distractors: ["It is parallel, so all eight bits travel together down eight wires", "It uses wireless signals instead of a cable", "It sends the bits in packets that each have a header"],
        note: "USB is serial: bits go one after another down one wire, so they cannot skew. From Cambridge IGCSE 0478/11, June 2026, Question 4(c)." }
    ];
  })()
});
