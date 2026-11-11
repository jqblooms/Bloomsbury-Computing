// Year 10, 3.1.3: Buses and Data Movement. Plenary: the address, data and control buses, which way each goes and why.
// Loaded by Drills/index.html?drill=y10-3-1-l3
// noHelp (docs/drills.md): the lesson is worked through alone, so no card has help; a wrong answer names the lesson
// slide to go back to (goBack), never the answer. The slide titles are the lesson's own (tools/build_y10_3_1_l3.mjs).
// The lesson says "one way" and "both ways"; "unidirectional" and "bidirectional" are accepted when typed, never shown.
(function () {
  var SLIDE = {
    buses: "Why the CPU Needs Buses",
    addrWhy: "Which Way Does the Address Bus Go?",
    dataWhy: "Which Way Does the Data Bus Go?",
    ctrlWhy: "Why the Control Bus Is Needed",
    readWrite: "Compare: A Read and a Write",
    examTwo: "Exam Question: Two Other Buses",
    examCtrl: "Exam Question: The Control Bus",
    examOne: "Exam Question: One Bus and Its Purpose"
  };

  // A place in memory (its address) and a value stored there, never the same number.
  function draw() {
    var a = drillRange(1, 30), v = drillRange(10, 99);
    return { a: a, v: v };
  }

  var BUS_OPTS = { addr: "Address bus", data: "Data bus", ctrl: "Control bus" };
  var BUS_RE = {
    addr: /^\s*(the\s+)?add?ress?(\s+bus(es)?)?\s*$/i,
    data: /^\s*(the\s+)?data(\s+bus(es)?)?\s*$/i,
    ctrl: /^\s*(the\s+)?cont?roll?(\s+bus(es)?)?\s*$/i
  };
  function busCard(which) {
    return {
      answers: [BUS_OPTS[which]],
      keywords: [BUS_RE[which]],
      distractors: Object.keys(BUS_OPTS).filter(function (k) { return k !== which; }).map(function (k) { return BUS_OPTS[k]; }),
      format: "Type the name of the bus"
    };
  }

  // Which way: "out of the CPU (to memory)" or "into the CPU (from memory)", in the words a student might type.
  var CPU = "(cpu|processor)", MEM = "(memory|ram|main\\s+memory)";
  var TO_MEM = "\\b(out\\s+of|from|leaves?)\\s+(the\\s+)?" + CPU + "\\b|\\b(in)?to\\s+(the\\s+)?" + MEM + "\\b|\\b" + CPU + "\\s*(->|\u2192)\\s*" + MEM + "\\b|\\bout(\\s+only)?\\s*$";
  var TO_CPU = "\\b(out\\s+of|from|leaves?)\\s+(the\\s+)?" + MEM + "\\b|\\b(in)?to\\s+(the\\s+)?" + CPU + "\\b|\\b" + MEM + "\\s*(->|\u2192)\\s*(the\\s+)?" + CPU + "\\b|\\bin(\\s+only)?\\s*$";
  var WAY_RE = {
    toMem: "(?=.*(" + TO_MEM + "))(?!.*(" + TO_CPU + "))(?!.*\\bboth\\b)",
    toCpu: "(?=.*(" + TO_CPU + "))(?!.*(" + TO_MEM + "))(?!.*\\bboth\\b)"
  };
  var WAY_TEXT = { toMem: "out of the CPU to memory", toCpu: "into the CPU from memory" };
  function busWayRe(bus, way) {
    var others = { addr: "data|control", data: "address\\w*|control" }[bus];
    var word = { addr: "address", data: "data" }[bus];
    return new RegExp("^(?!.*\\b(" + others + ")\\b)(?=.*\\b" + word + "\\b)" + WAY_RE[way], "i");
  }
  function wayCard(bus, way) {
    var all = [];
    ["addr", "data"].forEach(function (b) {
      ["toMem", "toCpu"].forEach(function (w) { all.push({ b: b, w: w, text: BUS_OPTS[b] + ", " + WAY_TEXT[w] }); });
    });
    return {
      answers: [BUS_OPTS[bus] + ", " + WAY_TEXT[way]],
      keywords: [busWayRe(bus, way)],
      distractors: all.filter(function (o) { return !(o.b === bus && o.w === way); }).map(function (o) { return o.text; }),
      format: "Type the bus, then which way it goes"
    };
  }
  // A randomised card's plain fields come from one draw, so the card is complete without randomize() too.
  function drawn(base) {
    var d = base.randomize();
    for (var k in d) if (base[k] == null) base[k] = d[k];
    return base;
  }

  var ONE_WAY = new RegExp("^(?!.*\\bboth\\b)(?!.*(" + TO_CPU + "))(\\s*(it\\s+)?(is\\s+|goes\\s+)?(only\\s+)?(uni-?\\s?directional|(in\\s+)?one[\\s-]+(way|direction)|(out|out\\s+of\\s+the\\s+" + CPU + ")(\\s+only)?\\b)|.*(" + TO_MEM + "))", "i");
  var BOTH_WAYS = /^(?!.*\b(uni-?\s?directional|one[\s-]+(way|direction)|only)\b).*\b(bi-?\s?directional|both\s+(ways?|directions?)|^\s*both\s*$|two[\s-]+(ways?|directions?)|in(to)?\s+and\s+out|to\s+and\s+from)\b/i;
  var WAY_OPTS = ["Out of the CPU only", "Into the CPU only", "Both ways"];

  DrillData.register("y10-3-1-l3", {
    title: "Year 10, 3.1.3: Buses and Data Movement",
    subtitle: "Cambridge IGCSE Computer Science 0478",
    noHelp: true,
    categories: [
      ["what", "What each bus carries"],
      ["way", "Which way, and why"],
      ["move", "A read and a write"],
      ["exam", "Exam wording"]
    ],
    cards: [
      drawn({
        id: "w-01", category: "what", goBack: SLIDE.buses,
        note: "The place in memory is the address. It goes on the address bus.",
        randomize: function () {
          var d = draw(), c = busCard("addr");
          c.prompt = "The CPU wants the value stored at address " + d.a + " in memory.\nWhich bus carries the number " + d.a + "?";
          return c;
        }
      }),
      drawn({
        id: "w-02", category: "what", goBack: SLIDE.buses,
        note: "Data and instructions go on the data bus.",
        randomize: function () {
          var d = draw(), c = busCard("data");
          c.prompt = drillPick([
            "Memory sends the value " + d.v + " to the CPU.\nWhich bus carries " + d.v + "?",
            "Memory sends an instruction to the CPU.\nWhich bus carries the instruction?",
            "The CPU sends the value " + d.v + " to memory to be stored.\nWhich bus carries " + d.v + "?"
          ]);
          return c;
        }
      }),
      drawn({
        id: "w-03", category: "what", goBack: SLIDE.buses,
        note: "Read, write and other signals that say what to do go on the control bus.",
        randomize: function () {
          var c = busCard("ctrl");
          c.prompt = drillPick([
            "The CPU tells memory to read.\nWhich bus carries the read signal?",
            "The CPU tells memory to write.\nWhich bus carries the write signal?",
            "A keyboard tells the CPU that a key has been pressed.\nWhich bus carries this signal?"
          ]);
          return c;
        }
      }),
      drawn({
        id: "y-01", category: "way",
        randomize: function () {
          var bus = drillPick(["address", "data", "control"]);
          var one = bus === "address";
          return {
            prompt: "Which way does the " + bus + " bus go?",
            answers: [one ? "Out of the CPU only" : "Both ways"],
            keywords: [one ? ONE_WAY : BOTH_WAYS],
            distractors: WAY_OPTS.filter(function (o) { return o !== (one ? "Out of the CPU only" : "Both ways"); }),
            format: "Type which way it goes",
            goBack: bus === "control" ? SLIDE.ctrlWhy : bus === "data" ? SLIDE.dataWhy : SLIDE.addrWhy,
            note: one ? "Only the CPU chooses the address, so the address bus goes one way: out of the CPU to memory."
              : bus === "data" ? "Data comes into the CPU in a read and goes out in a write, so the data bus goes both ways."
              : "The CPU sends signals out and devices send signals in, so the control bus goes both ways."
          };
        }
      }),
      {
        id: "y-02", category: "way", goBack: SLIDE.addrWhy, pickThenType: true,
        prompt: "Why does the address bus only go one way?",
        answers: ["Only the CPU chooses which address to use"],
        keywords: [/^(?!.*\b(memory|ram|devices?)\s+(chooses|picks|sends|decides)\b)(?=.*\b(only|just)\b)(?=.*\b(cpu|processor)\b).*\b(address\w*|chooses|choose|picks|decides|places?)\b/i],
        distractors: ["Memory chooses which address to send", "Data is read and written in memory", "The CU sends signals out and devices send signals in"],
        note: "Memory never sends an address back, so the address bus goes one way: from the CPU towards memory."
      },
      {
        id: "y-03", category: "way", goBack: SLIDE.dataWhy, pickThenType: true,
        prompt: "Why does the data bus go both ways?",
        answers: ["Data is read from memory and written to it"],
        keywords: [/^(?!.*\bonly\b)(?=.*\b(read\w*|load\w*|fetch\w*)\b)(?=.*\b(writ\w*|wrote|sav\w*|stor\w*)\b)/i, /^(?!.*\bonly\b)(?=.*\b(sends?|sent|gives?)\b)(?=.*\b(receiv\w*|gets?|takes?)\b).*\b(data|values?|cpu)\b/i],
        distractors: ["Only the CPU chooses which address to use", "The CU sends signals out and devices send signals in", "Memory chooses which data the CPU needs"],
        note: "In a read the value comes into the CPU. In a write it goes out to memory. One bus does both jobs."
      },
      {
        id: "y-04", category: "way", goBack: SLIDE.ctrlWhy, pickThenType: true,
        prompt: "Why does the control bus go both ways?",
        answers: ["The CU sends signals out and devices send signals in"],
        keywords: [/^(?!.*\bonly\b)(?=.*\b(signals?|messages?)\b)(?=.*\b(back|return\w*|repl(y|ies)|respond\w*|from\s+(the\s+)?(devices?|keyboard|memory)|(devices?|keyboard)\s+(send|sends)|in\s+and\s+out|to\s+and\s+from)\b)/i],
        distractors: ["Only the CPU chooses which address to use", "Data is read from memory and written to it", "Signals only ever go out from the CPU"],
        note: "The CPU sends read or write out. Devices send signals in, for example a key has been pressed."
      },
      drawn({
        id: "m-01", category: "move", goBack: SLIDE.readWrite,
        note: "In a read and in a write, the address goes out of the CPU to memory.",
        randomize: function () {
          var d = draw(), c = wayCard("addr", "toMem");
          c.prompt = drillPick([
            "The CPU reads the value stored at address " + d.a + " in memory.\nWhich bus carries the number " + d.a + ", and which way?",
            "The CPU writes " + d.v + " into address " + d.a + " in memory.\nWhich bus carries the number " + d.a + ", and which way?"
          ]);
          return c;
        }
      }),
      drawn({
        id: "m-02", category: "move", goBack: SLIDE.readWrite,
        note: "In a read, the value comes into the CPU from memory on the data bus.",
        randomize: function () {
          var d = draw(), c = wayCard("data", "toCpu");
          c.prompt = "The CPU reads address " + d.a + " in memory. The value stored there is " + d.v + ".\nWhich bus carries " + d.v + ", and which way?";
          return c;
        }
      }),
      drawn({
        id: "m-03", category: "move", goBack: SLIDE.readWrite,
        note: "In a write, the value goes out of the CPU to memory on the data bus.",
        randomize: function () {
          var d = draw(), c = wayCard("data", "toMem");
          c.prompt = "The CPU writes the value " + d.v + " into address " + d.a + " in memory.\nWhich bus carries " + d.v + ", and which way?";
          return c;
        }
      }),
      drawn({
        id: "m-04", category: "move", goBack: SLIDE.readWrite,
        note: "Read and write are control signals, so they go on the control bus.",
        randomize: function () {
          var d = draw(), c = busCard("ctrl");
          c.prompt = drillPick([
            "The CPU reads address " + d.a + " in memory.\nWhich bus tells memory to read, not write?",
            "The CPU writes " + d.v + " into address " + d.a + " in memory.\nWhich bus tells memory to write, not read?"
          ]);
          return c;
        }
      }),
      {
        id: "e-01", category: "exam", goBack: SLIDE.examTwo, pickThenType: true,
        prompt: "One type of bus is the address bus.\nIdentify one other type of bus and state what it is responsible for transmitting.",
        answers: ["Data bus: transmits data and instructions", "Control bus: transmits control signals"],
        keywords: [/^\s*(the\s+)?data\s+bus\b(?!.*\b(control|address\w*)\b).*\b(data|instructions?)\b/i, /^\s*(the\s+)?control\s+bus\b(?!.*\b(data|instructions?|address\w*)\b).*\b(signals?|commands?)\b/i],
        distractors: ["Data bus: transmits control signals", "Control bus: transmits memory addresses", "Data bus: transmits memory addresses", "Control bus: transmits data and instructions"],
        note: "From Cambridge IGCSE 0478/11, November 2022, Question 2(a)."
      },
      {
        id: "e-02", category: "exam", goBack: SLIDE.examOne, pickThenType: true,
        prompt: "Describe the address bus.\nGive one point that earns a mark.",
        answers: ["It carries memory addresses", "It sends addresses out of the CPU to memory"],
        keywords: [
          new RegExp("^(?!.*\\b(data|instructions?|control|signals?|both)\\b)(?!.*(" + TO_CPU + "))(?=.*\\baddress(es)?\\b).*\\b(carr\\w*|transmit\\w*|sends?|moves?|holds?|go(es)?|travels?)\\b", "i")
        ],
        distractors: ["It carries data and instructions", "It goes both ways", "It carries control signals", "It sends addresses into the CPU from memory"],
        note: "What the address bus does."
      },
      {
        id: "e-03", category: "exam", goBack: SLIDE.examCtrl, pickThenType: true,
        prompt: "Describe the role of the control bus.\nGive one point that earns a mark.",
        answers: ["It carries control signals", "It carries signals such as read and write", "It carries signals from devices to the CU"],
        keywords: [/^(?!.*\b(address\w*|data|instructions?)\b).*\b(signals?|commands?)\b/i, /\bfrom\s+(the\s+)?(devices?|peripherals?|keyboard|memory)\b.*\b(cpu|cu|control\s+unit|processor)\b/i],
        distractors: ["It carries memory addresses", "It carries data and instructions", "It goes one way only", "It carries the address of the data"],
        note: "From Cambridge IGCSE 0478/12, March 2021, Question 8(b)(ii)."
      },
      {
        id: "e-04", category: "exam", goBack: SLIDE.readWrite, pickThenType: true,
        prompt: "State one difference between the address bus and the data bus.",
        answers: ["The address bus goes one way but the data bus goes both ways", "The address bus carries addresses but the data bus carries data"],
        keywords: [/^(?!.*\baddress\s+bus\s+(goes\s+|is\s+)?(both|bi|two))(?!.*\bdata\s+bus\s+(goes\s+|is\s+)?(one|uni))(?=.*\baddress\s+bus\b.*\b(uni-?\s?directional|one[\s-]+way|one\s+direction)\b.*\bdata\s+bus\b.*\b(bi-?\s?directional|both\s+(ways|directions)|two[\s-]+ways?)\b)/i, /^(?!.*\bdata\s+bus\s+(goes\s+|is\s+)?(one|uni))(?!.*\baddress\s+bus\s+(goes\s+|is\s+)?(both|bi|two)).*\bdata\s+bus\b.*\b(bi-?\s?directional|both\s+(ways|directions)|two[\s-]+ways?)\b.*\baddress\s+bus\b.*\b(uni-?\s?directional|one[\s-]+way|one\s+direction)\b/i, /^.*\baddress\s+bus\b.*\b(carr\w*|transmit\w*|sends?)\s+(memory\s+)?addresses\b.*\bdata\s+bus\b.*\b(carr\w*|transmit\w*|sends?)\s+data\b/i],
        distractors: ["The address bus goes both ways but the data bus goes one way", "The address bus carries data but the data bus carries addresses", "The address bus carries signals but the data bus carries addresses"],
        note: "Either difference is right: which way each bus goes, or what each bus carries."
      }
    ]
  });
})();
