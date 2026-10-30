// Year 10 Unit 2 Exam Follow-up
// Loaded by Drills/index.html?drill=y10-2-exam-fix
// One ladder per subtopic of the Year 10 Unit 2 Exam (Data Transmission, paper id y10-unit2-exam in the shell's
// ExamPapers.gs). Each subtopic has three tiers: key facts (short recall), exam wording (pick the line that earns
// the mark, then type it) and full answer (tick every statement a full-mark answer needs, one per mark).
// The `topic` strings match the exam's part topics exactly, so a student only climbs the ladders they lost marks on.
// Every mark-earning line comes from the exam's own mark scheme points or a real 0478 mark scheme; the near misses
// are the answers the class actually wrote that earned no mark.
(function () {
  var TOPICS = [
    ["meth", "2.1 Methods of transmission", "Methods of transmission"],
    ["usb", "2.1 USB", "USB"],
    ["choose", "2.1 Choosing a method of transmission", "Choosing a method"],
    ["pkt", "2.1 Packets", "Packets"],
    ["psw", "2.1 Packet switching", "Packet switching"],
    ["par", "2.2 Parity check", "Parity check"],
    ["blk", "2.2 Parity block check", "Parity block check"],
    ["other", "2.2 Checksum, echo check and ARQ", "Checksum, echo check and ARQ"],
    ["arq", "2.2 ARQ", "ARQ"],
    ["cd", "2.2 Check digits", "Check digits"],
    ["enc", "2.3 Symmetric and asymmetric encryption", "Symmetric and asymmetric encryption"],
    ["sym", "2.3 Symmetric encryption", "Symmetric encryption"]
  ];
  var TIER_NAMES = ["key facts", "exam wording", "full answer"];

  var FULL = "\nPick every statement needed for full marks.";
  var WHICH = "\nWhich line earns a mark?";

  function t1(id, t, prompt, ans, kw, dis, note, ex, wk) {
    var c = { id: id, category: t + "-1", prompt: prompt, answers: [ans], distractors: dis, note: note, example: ex };
    if (kw) c.keywords = [kw];
    if (wk) c.working = [wk];
    return c;
  }
  function t2(id, t, prompt, ans, dis, note, ex, wk) {
    var c = { id: id, category: t + "-2", pickThenType: true, prompt: prompt, answers: [ans], distractors: dis, note: note, example: ex };
    if (wk) c.working = [wk];
    return c;
  }
  function t3(id, t, prompt, answers, dis, note, ex, wk) {
    var c = { id: id, category: t + "-3", type: "multi", all: true, show: answers.length + 3, prompt: prompt + FULL,
      answers: answers, distractors: dis, note: note, example: ex };
    if (wk) c.working = [wk];
    return c;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(list) { return list[rnd(list.length)]; }

  // ---- parity block: 8 bytes (parity bit first, then bits 2 to 8) and a parity byte, with one bit flipped ----
  function makeBlock(mode) {
    var rows = [], r, c;
    for (r = 0; r < 8; r++) {
      var data = [], ones = 0;
      for (c = 0; c < 7; c++) { var b = rnd(2); data.push(b); ones += b; }
      var p = (ones % 2 === 0) === (mode === "even") ? 0 : 1;
      rows.push([p].concat(data));
    }
    var pbyte = [];
    for (c = 0; c < 8; c++) {
      var n = 0;
      for (r = 0; r < 8; r++) n += rows[r][c];
      pbyte.push((n % 2 === 0) === (mode === "even") ? 0 : 1);
    }
    var byteNo = 1 + rnd(8), bitNo;
    do { bitNo = 2 + rnd(7); } while (bitNo === byteNo);
    rows[byteNo - 1][bitNo - 1] = 1 - rows[byteNo - 1][bitNo - 1];
    var lines = ["          P  2  3  4  5  6  7  8"];
    for (r = 0; r < 8; r++) lines.push("Byte " + (r + 1) + ":   " + rows[r].join("  "));
    lines.push("Parity:   " + pbyte.join("  "));
    return { table: lines.join("\n"), byteNo: byteNo, bitNo: bitNo };
  }
  function blockIntro(mode, b) {
    return "8 bytes are sent with a parity byte. " + cap(mode) + " parity is used. P is each byte's parity bit, then bits 2 to 8. " +
      "Each bit of the parity byte checks one column. One bit has changed.\n" + b.table;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function other(mode) { return mode === "odd" ? "even" : "odd"; }

  var BLOCK_EXAMPLE = "Four bytes, even parity, each row should have an even number of 1s:\n" +
    "row A: 1 1 0 0 (two 1s, fine)\nrow B: 1 0 1 1 (three 1s, wrong)\nrow C: 0 1 1 0 (two 1s, fine)\n" +
    "Step 1: count the 1s in every row. Only row B has the wrong count.\n" +
    "Step 2: count the 1s in every column the same way. Suppose only the third column has the wrong count.\n" +
    "Step 3: the changed bit is where the wrong row and the wrong column cross: row B, third column.\n" +
    "Step 4: to explain it, name the parity that was agreed, then name the row and the column whose counts break it.";

  // ---- ARQ scenarios: [sender, receiver] ----
  var PAIRS = [["computer", "printer"], ["web server", "laptop"], ["phone", "computer"], ["computer", "web server"], ["laptop", "printer"]];

  var ARQ_EXAMPLE = "Explain how ARQ using positive acknowledgement works. [3]\n" +
    "Step 1: sort every step by who does it. The device that sends the data is the sender; the device that gets it is the receiver.\n" +
    "Step 2: sender: it starts a timer as soon as the data leaves.\n" +
    "Step 3: receiver: it checks what arrived. If it is error free, it replies with a positive acknowledgement.\n" +
    "Step 4: sender: if the timer runs out with no reply, it sends the same data again.\n" +
    "Step 5: one mark per step, so a [3] question needs three steps, each with the right device doing it.";

  var cards = [];
  function add() { for (var i = 0; i < arguments.length; i++) cards.push(arguments[i]); }

  // =====================================================================
  // 2.1 Methods of transmission
  // =====================================================================
  var EX_PARALLEL = "How does parallel transmission send data?\nStep 1: parallel uses several wires side by side.\nStep 2: each wire carries its own bit.\nStep 3: so several bits travel at the same time, over several wires.";
  var EX_SIMPLEX = "Which directions can data travel in simplex?\nStep 1: think of a radio station: it sends, and you only listen.\nStep 2: nothing travels back to the station.\nStep 3: so simplex sends data in one direction only.";
  var W_METH = "Picture the wires: how many are there, and which way can the data go?";
  add(
    t1("meth-1a", "meth", "How many bits does serial transmission send at a time?", "One bit at a time",
      /^(?!.*\b(several|many|eight|8|multiple|two|2)\b).*(\b(one|1|single)\s+bit\b|\bbit\s+by\s+bit\b)/i,
      ["Several bits at the same time", "Eight bits at the same time", "One byte at a time", "One packet at a time", "Two bits at a time"],
      "Serial sends one bit at a time, one after another. Mark scheme point in 0478/13, June 2024, Question 7(a).", EX_PARALLEL, W_METH),
    t1("meth-1b", "meth", "How many wires does serial transmission use?", "A single wire",
      /\b(one|1|single)\s+wire\b|^\s*(one|1|single)\s*$/i,
      ["Several wires", "Eight wires", "Two wires, one for each direction", "A wire for each bit", "No wires"],
      "Serial sends its bits over a single wire. Mark scheme point in 0478/13, June 2024, Question 7(a).", EX_PARALLEL, W_METH),
    t1("meth-1c", "meth", "Half-duplex: which directions can data travel, and when?", "Both directions, but not at the same time",
      /^(?=.*\b(both|either|two)\b)(?=.*(not\s+at\s+the\s+same\s+time|one\s+(direction\s+)?at\s+a\s+time|\bturns?\b)).*/i,
      ["Both directions at the same time", "One direction only", "Only from the sender to the receiver", "Only from the receiver to the sender", "Both directions over several wires at once"],
      "Half-duplex: data can travel in either direction, but not in both directions at the same time. From the tick table in 0478/12, November 2021, Question 3.", EX_SIMPLEX, W_METH),
    t1("meth-1d", "meth", "Which method can make bits arrive skewed over a long distance?", "Parallel",
      /^(?!.*\bserial\b).*\bparallel\b/i,
      ["Serial", "Simplex", "Half-duplex", "Full-duplex", "Serial half-duplex"],
      "Parallel bits travel side by side on several wires and can arrive skewed (out of step). From the tick table in 0478/12, November 2021, Question 3.", EX_SIMPLEX, W_METH),
    t1("meth-1e", "meth", "Full-duplex: which directions can data travel, and when?", "Both directions at the same time",
      /^(?!.*\bnot\b)(?=.*\b(both|two)\b)(?=.*\b(same\s+time|simultaneous\w*|at\s+once)\b).*/i,
      ["Both directions, but not at the same time", "One direction only", "One direction at a time", "Only from the receiver to the sender", "Both directions, taking turns"],
      "Full-duplex: data is transmitted in both directions at the same time. From the tick table in 0478/12, November 2021, Question 3.", EX_SIMPLEX, W_METH)
  );

  var EX_METH2A = "Describe how data is transmitted using parallel simplex data transmission. [4]\n" +
    "Step 1: 4 marks means 4 separate facts.\nStep 2: how the bits travel: several bits are sent at the same time.\n" +
    "Step 3: the wires: the bits travel over several wires.\nStep 4: the direction: in one direction only.\n" +
    "Step 5: a line like \"it is fast\" says nothing about how the data travels, so it earns no mark.";
  var EX_METH2B = "Describe how data is transmitted using parallel full-duplex data transmission. [4]\n" +
    "Step 1: 4 marks means 4 separate facts.\nStep 2: several bits are sent at the same time, over several wires.\n" +
    "Step 3: data goes both ways, and both ways at once.\nStep 4: just naming the method again (\"it uses parallel\") repeats the question and earns no mark.";
  var Q_HALF = "A company network includes a web server. Data is transmitted using serial half-duplex data transmission.\nDescribe how the data is transmitted using serial half-duplex data transmission. [4]";
  var W_METH2 = "The mark goes to a line that says exactly how the bits travel. Which line could a student write about any connection at all?";
  add(
    t2("meth-2a", "meth", Q_HALF + "\nWhich line earns the mark about how the bits travel?", "Bits are sent one at a time",
      ["Several bits are sent at the same time", "Data is sent one byte at a time", "Data is sent fast because it is wired", "Data is sent using serial", "Data is sent in packets"],
      "Mark scheme point: bits are sent one at a time. \"Using serial\" only repeats the question. From 0478/13, June 2024, Question 7(a).", EX_METH2A, W_METH2),
    t2("meth-2b", "meth", Q_HALF + "\nWhich line earns the mark about the wire?", "Bits are sent over a single wire",
      ["Bits are sent over several wires", "It is sent by cable", "It is a wired connection", "Bits are sent through the air", "It uses a USB port"],
      "Many students left this point out. Mark scheme point: bits are sent over a single wire. \"By cable\" does not say how many wires. From 0478/13, June 2024, Question 7(a).", EX_METH2A, W_METH2),
    t2("meth-2c", "meth", Q_HALF + "\nWhich line earns both of the direction marks?", "Data is sent to and from the web server, but not at the same time",
      ["Data is sent in both directions at the same time", "Data is sent in one direction only", "Data is sent from the web server only", "Data goes both ways", "Data is sent at the same time"],
      "Two mark scheme points: data can be sent to and from the web server, and not at the same time. \"Both ways\" alone earns only the first. From 0478/13, June 2024, Question 7(a).", EX_METH2B, W_METH2),
    t2("meth-2d", "meth", "A sensor sends readings to a computer using serial simplex data transmission.\nDescribe how the data is transmitted. [3]\nWhich line earns the mark for the direction?", "Data is sent in one direction only",
      ["Data is sent in both directions", "Data is sent in both directions, one at a time", "Data is sent to and from the computer", "Data is sent at the same time", "Data is sent in a straight line"],
      "Simplex: data can only be transmitted in one direction. From the tick table in 0478/12, November 2021, Question 3, with the mark scheme style of 0478/13, June 2024, Question 7(a).", EX_METH2B, W_METH2)
  );

  var W_METH3 = "One statement per mark: how many bits at a time, how many wires, which directions, and when.";
  add(
    t3("meth-3a", "meth", Q_HALF,
      ["Bits are sent one at a time", "Bits are sent over a single wire", "Data can be sent to and from the web server", "Data is not sent both ways at the same time"],
      ["Several bits are sent at the same time", "Data is sent over several wires", "Data is sent in both directions at the same time", "Data is sent in one direction only", "Data is sent fast because it is wired", "The data is split into packets"],
      "The four mark scheme points of 0478/13, June 2024, Question 7(a), the same as Question 2(a) of your exam.",
      "Describe how data is transmitted using parallel full-duplex data transmission. [4]\nStep 1: how many bits at once? Parallel: several at the same time.\nStep 2: how many wires? Several, one for each bit.\nStep 3: which directions? Full-duplex: both.\nStep 4: when? Both directions at once.\nStep 5: four facts, one for each mark.", W_METH3),
    t3("meth-3b", "meth", "A computer and a nearby device are connected using parallel full-duplex data transmission.\nDescribe how the data is transmitted. [4]",
      ["Several bits are sent at the same time", "Bits are sent over several wires", "Data can be sent in both directions", "Data can travel both ways at the same time"],
      ["Bits are sent one at a time", "Bits are sent over a single wire", "Data is sent in one direction only", "Data is not sent both ways at the same time", "Bits never arrive skewed", "It is fast because it is wired"],
      "The same four kinds of point as 0478/13, June 2024, Question 7(a), for parallel full-duplex.",
      "Describe how data is transmitted using serial simplex data transmission. [3]\nStep 1: how many bits at once? Serial: one bit, then the next.\nStep 2: how many wires? Just one.\nStep 3: which directions? Simplex: one way only.\nStep 4: three facts, one for each mark.", W_METH3),
    t3("meth-3c", "meth", "A sensor sends readings to a computer using serial simplex data transmission.\nDescribe how the data is transmitted. [3]",
      ["Bits are sent one at a time", "Bits are sent over a single wire", "Data is sent in one direction only"],
      ["Several bits are sent at the same time", "Bits are sent over several wires", "Data can be sent to and from the sensor", "Data is sent both ways at the same time", "The sensor detects the computer automatically", "Data is sent fast because it is wired"],
      "Serial: one bit at a time over a single wire. Simplex: one direction only. 0478/12, November 2021, Question 3 and 0478/13, June 2024, Question 7(a).",
      "Describe how data is transmitted using parallel half-duplex data transmission. [4]\nStep 1: how many bits at once? Parallel: several at the same time.\nStep 2: how many wires? Several.\nStep 3: which directions? Half-duplex: both, ...\nStep 4: ... but never both at once.", W_METH3),
    t3("meth-3d", "meth", "A computer and a nearby device are connected using parallel half-duplex data transmission.\nDescribe how the data is transmitted. [4]",
      ["Several bits are sent at the same time", "Bits are sent over several wires", "Data can be sent in both directions", "Data is not sent both ways at the same time"],
      ["Bits are sent one at a time", "Bits are sent over a single wire", "Data is sent in one direction only", "Data can travel both ways at the same time", "Data is sent fast because it is wired", "Bits never arrive skewed"],
      "Parallel: several bits at the same time over several wires. Half-duplex: either direction, not both at the same time. 0478/12, November 2021, Question 3.",
      "Describe how data is transmitted using serial full-duplex data transmission. [4]\nStep 1: how many bits at once? Serial: one, then the next.\nStep 2: how many wires? One.\nStep 3: which directions? Full-duplex: both.\nStep 4: when? Both directions at once.", W_METH3)
  );

  // =====================================================================
  // 2.1 USB
  // =====================================================================
  var W_USB = "Think about what the cable carries, and how many wires carry the data.";
  var EX_USB1 = "Which method sends several bits at the same time, along several wires?\nStep 1: several wires side by side means the bits travel together.\nStep 2: that is parallel transmission.\nStep 3: a USB cable does not work this way.";
  var EX_USB1B = "Name one benefit of a USB connection that is not about speed or power.\nStep 1: think of what happens when you plug a new mouse in.\nStep 2: it is a universal standard, so it fits most computers.\nStep 3: \"it is easy\" or \"it is cheap\" never earns the mark.";
  add(
    t1("usb-1a", "usb", "Which method of transmission does a USB connection use?", "Serial",
      /^(?!.*\bparallel\b).*\bserial\b/i,
      ["Parallel", "Simplex", "Full-duplex", "Packet switching", "Wireless"],
      "USB is the universal serial bus: it uses serial transmission. 0478/13, November 2022, Question 4(c)(i).", EX_USB1, W_USB),
    t1("usb-1b", "usb", "How many bits does a USB connection send at a time?", "One bit at a time",
      /^(?!.*\b(several|many|eight|8|multiple|two|2)\b).*(\b(one|1|single)\s+bit\b|\bbit\s+by\s+bit\b)/i,
      ["Eight bits at a time", "Several bits at the same time", "One byte at a time", "A whole file at a time", "Two bits at a time"],
      "Many students wrote about the phone being detected. The mark is for how the data travels: one bit at a time. 0478/13, November 2022, Question 4(c)(i).", EX_USB1, W_USB),
    t1("usb-1c", "usb", "Give one benefit of USB that is about power.", "It can charge the device",
      /\b(charg\w*|power\w*)\b/i,
      ["It is cheap", "It is fast because it is wired", "It is easy", "It is wireless", "It is secure"],
      "Mark scheme point: it can charge or power the device. \"Cheap\", \"easy\" and \"fast because it is wired\" earn nothing. 0478/13, November 2022, Question 4(c)(ii).", EX_USB1B, W_USB),
    t1("usb-1d", "usb", "A USB device is plugged into a computer. What does the computer do automatically?", "It detects the device",
      /detect|recogni[sz]|driver/i,
      ["It encrypts the data", "It deletes old files", "It splits the data into packets", "It adds a check digit", "It sends a negative acknowledgement"],
      "Mark scheme point: the device is automatically detected (a benefit). It is not how the data is transmitted. 0478/12, November 2025, Question 5(c)(ii).", EX_USB1B, W_USB),
    t1("usb-1e", "usb", "A new USB device still works in an older USB port. What is this benefit called?", "Backward compatible",
      /backward\w*[\s-]*compat/i,
      ["Universal standard", "Full-duplex", "Skewed", "Automatic detection", "Fast transfer"],
      "Mark scheme point: USB is backward compatible. 0478/13, November 2022, Question 4(c)(ii).", EX_USB1, W_USB)
  );

  var Q_USB_HOW = "A mobile phone has a USB port to allow a USB connection to a computer.\nDescribe how data is transmitted using a USB connection. [2]";
  var Q_USB_BEN = "One benefit of a USB connection is that the cable can only be inserted into the port one way.\nGive three other benefits of using a USB connection to connect a mobile phone to a computer. [3]";
  var EX_USB2A = "Explain how data is sent using a parallel cable. [2]\nStep 1: the question asks how the data travels, so each line must be about the bits.\nStep 2: several bits are sent at the same time.\nStep 3: they go down several wires.\nStep 4: lines about plugging in, drivers or detecting the device answer a different question.";
  var EX_USB2B = "Give two benefits of using a USB connection for a keyboard. [2]\nStep 1: a benefit must be a fact about USB, not a feeling. \"Easy\" and \"cheap\" are feelings.\nStep 2: the keyboard is detected automatically.\nStep 3: it is a universal standard, so it fits most computers.\nStep 4: anything the question already gives you earns no mark.";
  var W_USB2 = "Would this line still be true for almost any cable? Then it earns nothing.";
  add(
    t2("usb-2a", "usb", Q_USB_HOW + WHICH, "Data is sent one bit at a time",
      ["The computer detects the phone automatically", "A driver is installed automatically", "The cable only fits one way", "It can charge the phone", "Data is sent fast because it is wired", "Several bits are sent at the same time"],
      "Many students described detection or drivers. The question asks how data is transmitted: serial, one bit at a time, single wire. 0478/13, November 2022, Question 4(c)(i).", EX_USB2A, W_USB2),
    t2("usb-2b", "usb", Q_USB_HOW + WHICH, "It uses serial transmission",
      ["It uses a USB port", "It uses parallel transmission", "It is plugged into the computer", "It uses a universal cable", "The phone is detected"],
      "Mark scheme point: using serial transmission. 0478/13, November 2022, Question 4(c)(i).", EX_USB2A, W_USB2),
    t2("usb-2c", "usb", Q_USB_HOW + WHICH, "Data is sent down a single wire",
      ["Data is sent down a cable", "Data is sent down several wires", "The cable is plugged in", "Data is sent wirelessly", "The driver sends the data"],
      "Mark scheme point: data is sent down a single wire. \"A cable\" does not say how many wires. 0478/13, November 2022, Question 4(c)(i).", EX_USB2A, W_USB2),
    t2("usb-2d", "usb", Q_USB_BEN + WHICH, "It has a fast rate of data transfer",
      ["It is fast because it is wired", "It is cheap", "It is easy to use", "The cable only goes in one way", "It is wired", "It is good"],
      "Mark scheme point: fast rate of data transfer. \"Fast because it is wired\" gives a wrong reason and earns nothing. 0478/13, November 2022, Question 4(c)(ii).", EX_USB2B, W_USB2),
    t2("usb-2e", "usb", Q_USB_BEN + WHICH, "It can charge the phone",
      ["It is cheap", "It is easy", "It is convenient", "Everyone has one", "The cable can only be inserted one way"],
      "Mark scheme point: it can charge or power the device. The one-way cable is given in the question, so it earns no mark. 0478/13, November 2022, Question 4(c)(ii).", EX_USB2B, W_USB2),
    t2("usb-2f", "usb", Q_USB_BEN + WHICH, "It is backward compatible",
      ["It works", "It is simple", "It is reliable", "It is cheap", "It is fast because it is wired"],
      "Mark scheme point: backward compatible. 0478/13, November 2022, Question 4(c)(ii).", EX_USB2B, W_USB2)
  );

  var W_USB3 = "Each statement must be a fact about USB that the question has not already given you.";
  add(
    t3("usb-3a", "usb", Q_USB_HOW,
      ["It uses serial transmission", "Data is sent one bit at a time"],
      ["The computer detects the phone automatically", "A driver is installed", "Several bits are sent at the same time", "Data is sent fast because it is wired", "It uses parallel transmission", "The cable only fits one way"],
      "Any two of: serial transmission, one bit at a time, a single wire. Detection and drivers are benefits, not how data is transmitted. 0478/13, November 2022, Question 4(c)(i).", EX_USB2A, W_USB3),
    t3("usb-3b", "usb", "A mouse is connected to a computer using a universal serial bus (USB) connection.\nExplain how data is sent using the USB connection. [2]",
      ["Data is sent one bit at a time", "Data is sent down a single wire"],
      ["The mouse is detected automatically", "Several bits are sent at the same time", "Data is sent down several wires", "The mouse is powered by the computer", "It is fast because it is wired", "A driver is installed"],
      "The two mark scheme points of 0478/12, November 2025, Question 5(c)(i).", EX_USB2A, W_USB3),
    t3("usb-3c", "usb", Q_USB_BEN,
      ["It can charge the phone", "It has a fast rate of data transfer", "It is backward compatible"],
      ["It is cheap", "It is easy", "It is fast because it is wired", "The cable only goes in one way", "It is wireless", "It sends several bits at the same time"],
      "Three mark scheme points from 0478/13, November 2022, Question 4(c)(ii), the same as Question 1(c) of your exam.", EX_USB2B, W_USB3),
    t3("usb-3d", "usb", "A mouse is connected to a computer using a USB connection.\nGive two benefits of using a USB connection for this purpose. [2]",
      ["The mouse can be powered by the computer", "The mouse is detected automatically"],
      ["It is cheap", "It is easy to use", "It is wireless", "The mouse is faster because it is wired", "It uses parallel transmission", "Several bits are sent at the same time"],
      "Two mark scheme points from 0478/12, November 2025, Question 5(c)(ii).", EX_USB2B, W_USB3),
    t3("usb-3e", "usb", "Julia uses a USB connection to transfer data onto her USB flash memory drive.\nOne benefit of using a USB connection is that it is a universal connection.\nState two other benefits of using a USB connection. [2]",
      ["It is backward compatible", "There is little chance of the data being skewed"],
      ["It is a universal connection", "It is cheap", "It is easy", "It is fast because it is wired", "It uses parallel transmission", "It is wireless"],
      "From 0478/11, June 2021, Question 2(c)(i). The universal connection is given in the question, so it earns no mark.", EX_USB2B, W_USB3)
  );

  // =====================================================================
  // 2.1 Choosing a method of transmission
  // =====================================================================
  var W_CH = "What goes wrong when bits travel side by side over a long cable?";
  var EX_CH1A = "A printer sits right next to a computer. Which method sends more bits at the same time?\nStep 1: several wires side by side carry several bits together.\nStep 2: over a short cable the bits stay in step.\nStep 3: so the method with several wires wins over a short distance.";
  var EX_CH1B = "Serial or parallel: which uses fewer wires?\nStep 1: serial sends one bit, then the next, so it needs just one wire for the data.\nStep 2: parallel needs one wire for each bit sent together.\nStep 3: so serial uses fewer wires.";
  var EX_CH1C = "Over a long distance, which method keeps the bits in order?\nStep 1: with one wire, each bit follows the one before.\nStep 2: nothing can overtake, so the bits stay in order.\nStep 3: that is the one-wire method, serial.";
  add(
    t1("choose-1a", "choose", "Serial or parallel: which is better over a long distance?", "Serial",
      /^(?!.*\bparallel\b).*\bserial\b/i,
      ["Parallel", "Both are the same", "Neither", "Simplex", "Full-duplex"],
      "Serial bits arrive in order, so it works over a long distance. Mark scheme point in 0478/13, June 2024, Question 7(b).", EX_CH1A, W_CH),
    t1("choose-1b", "choose", "Bits sent side by side arrive out of step over a long cable. What is this called?", "Skew",
      /skew/i,
      ["Crosstalk", "Interference", "Echo", "Parity", "Collision"],
      "Skew: parallel bits arrive out of step. Serial bits are not skewed. 0478/13, June 2024, Question 7(b).", EX_CH1B, W_CH),
    t1("choose-1c", "choose", "Give one drawback of half-duplex compared with full-duplex.", "Data cannot be sent and received at the same time",
      /(not|cannot|can't|never).*(same\s+time|at\s+once|together|simultaneous)|one\s+(direction\s+)?at\s+a\s+time|\bwait|\bturns?\b/i,
      ["Bits will be skewed", "It cannot send data over a long distance", "It needs several wires", "It only sends data in one direction", "It sends several bits at the same time"],
      "Mark scheme point: data cannot be sent and received at the same time. 0478/13, June 2024, Question 7(c).", EX_CH1B, W_CH),
    t1("choose-1d", "choose", "Over a short distance, which is faster: serial or parallel?", "Parallel",
      /^(?!.*\bserial\b).*\bparallel\b/i,
      ["Serial", "Both are the same", "Simplex", "Half-duplex", "Neither"],
      "Parallel sends several bits at the same time, so it is faster over a short distance. Serial may be relatively slow. 0478/13, June 2024, Question 7(c).", EX_CH1C, W_CH),
    t1("choose-1e", "choose", "Give one benefit of serial transmission over parallel.", "Bits will not be skewed",
      /skew|in\s+order|less\s+(chance\s+of\s+)?error|fewer\s+errors|crosstalk|interference|long\w*\s+distance|further|far/i,
      ["It is faster", "It sends several bits at the same time", "It sends data both ways at the same time", "It uses more wires", "It is wireless"],
      "Mark scheme points: bits will not be skewed, less chance of error, less interference, works over a long distance. 0478/13, June 2024, Question 7(b).", EX_CH1A, W_CH)
  );

  var Q_CH_BEN = "A company network includes a web server. Data is transmitted using serial half-duplex data transmission.\nGive two benefits of the company using serial half-duplex data transmission for this purpose. [2]";
  var Q_CH_DRAW = "A company network includes a web server. Data is transmitted using serial half-duplex data transmission.\nGive one drawback of the company using serial half-duplex data transmission for this purpose. [1]";
  var EX_CH2 = "Give one benefit of using parallel simplex to send data to a printer next to a computer. [1]\n" +
    "Step 1: a benefit must come from how the method works, not a feeling like \"cheap\" or \"easy\".\n" +
    "Step 2: parallel sends several bits at the same time.\nStep 3: so the data reaches the printer quickly over the short cable.";
  var W_CH2 = "Does the line say something that follows from serial or from half-duplex?";
  add(
    t2("choose-2a", "choose", Q_CH_BEN + WHICH, "Bits will not be skewed",
      ["It is fast because it is wired", "It is cheap", "It is easy to set up", "Bits are sent at the same time", "It is better", "It is more secure"],
      "Mark scheme point: bits will not be skewed. 0478/13, June 2024, Question 7(b).", EX_CH2, W_CH2),
    t2("choose-2b", "choose", Q_CH_BEN + WHICH, "Data can be sent over a long distance",
      ["Data is sent quickly", "Data is safe", "Data is sent in both directions at the same time", "It uses less electricity", "It is cheap"],
      "Mark scheme point: data can be sent over a long distance. 0478/13, June 2024, Question 7(b).", EX_CH2, W_CH2),
    t2("choose-2c", "choose", Q_CH_BEN + WHICH, "Data can be uploaded to and downloaded from the web server",
      ["Data can be sent both ways at the same time", "It is cheap", "Data is sent faster than parallel", "Data cannot be intercepted", "Data is encrypted"],
      "Mark scheme point: it is possible to download and upload data to the web server. 0478/13, June 2024, Question 7(b).", EX_CH2, W_CH2),
    t2("choose-2d", "choose", Q_CH_DRAW + WHICH, "Data cannot be sent and received at the same time",
      ["Data is sent one bit at a time", "It is expensive", "Bits will be skewed", "Data can only go in one direction", "It is wired"],
      "Mark scheme point: data cannot be sent and received at the same time. \"One bit at a time\" describes serial but does not say what is bad. 0478/13, June 2024, Question 7(c).", EX_CH2, W_CH2),
    t2("choose-2e", "choose", Q_CH_DRAW + WHICH, "The transmission of data may be slow",
      ["It is expensive", "Bits will be skewed", "It cannot send data far", "Data can only go in one direction", "It needs many wires"],
      "Mark scheme point: the transmission of data may be relatively slow. 0478/13, June 2024, Question 7(c).", EX_CH2, W_CH2)
  );

  var W_CH3 = "A benefit is a good result of how the method works. Skew, distance and errors are the usual ones.";
  add(
    t3("choose-3a", "choose", Q_CH_BEN,
      ["Bits will not be skewed", "Data can be sent over a long distance"],
      ["It is cheap", "It is fast because it is wired", "Data is sent both ways at the same time", "Several bits are sent at the same time", "It is easy to use", "Data cannot be intercepted"],
      "Two of the mark scheme points of 0478/13, June 2024, Question 7(b), the same as Question 2(b) of your exam.", EX_CH2, W_CH3),
    t3("choose-3b", "choose", "A company network includes a web server. Data is transmitted using serial half-duplex data transmission.\nGive one benefit and one drawback of using serial half-duplex for this purpose. [2]",
      ["Benefit: there is less chance of error", "Drawback: data cannot be sent and received at the same time"],
      ["Benefit: it is cheap", "Drawback: bits will be skewed", "Benefit: data is sent both ways at the same time", "Drawback: data can only be sent in one direction", "Benefit: it is fast because it is wired"],
      "Benefit and drawback points from 0478/13, June 2024, Question 7(b) and (c).", EX_CH2, W_CH3),
    t3("choose-3c", "choose", "Two buildings are 100 metres apart.\nExplain why serial transmission is used to connect them, not parallel. [2]",
      ["Serial bits are sent one at a time, so they arrive in order", "Parallel bits can be skewed over a long distance"],
      ["Serial is faster than parallel", "Parallel bits are sent one at a time", "Serial bits can be skewed over a long distance", "Parallel cannot send data in both directions", "Serial is cheaper because it is wired"],
      "Serial bits are not skewed and can travel over a long distance. 0478/13, June 2024, Question 7(b), and the skew row of 0478/12, November 2021, Question 3.", EX_CH2, W_CH3),
    t3("choose-3d", "choose", "Two friends make a video call over the internet. The data is sent using serial full-duplex data transmission.\nGive two benefits of using serial full-duplex for this purpose. [2]",
      ["Both friends can send and receive at the same time", "Data can be sent over a long distance"],
      ["Data is sent in one direction only", "Several bits are sent at the same time", "It is cheap", "It is easy", "Bits will be skewed"],
      "Full-duplex sends both ways at the same time; serial can be used over a long distance. 0478/13, June 2024, Question 7(b).", EX_CH2, W_CH3)
  );

  // =====================================================================
  // 2.1 Packets
  // =====================================================================
  var W_PKT = "Think of a parcel: the label, what is inside, and the seal at the end.";
  var EX_PKT_COUNT = "How many bits are in one byte?\nStep 1: write a byte out: 1 0 1 1 0 0 1 0.\nStep 2: count each bit: there are 8.\nStep 3: so a byte has 8 bits.";
  var EX_PKT_PART = "Which section of a letter tells the post office where it goes?\nStep 1: the address is written on the outside, at the front.\nStep 2: the post office reads that part first.\nStep 3: a packet keeps its addresses in the same kind of place: the part at the start.";
  var EX_PKT_PAY = "Which section of a packet comes first?\nStep 1: the router needs to read where the packet is going before anything else.\nStep 2: so the section with the addresses comes first: the header.";
  add(
    t1("pkt-1a", "pkt", "How many sections does a data packet have?", "Three",
      /^\s*(3|three)\b/i,
      ["Two", "Four", "One", "Five", "Eight"],
      "A packet is split into three sections: the header, the payload and the trailer. 0478/11, June 2024, Question 4(a).", EX_PKT_COUNT, W_PKT),
    t1("pkt-1b", "pkt", "Which section of a packet holds the destination address?", "Header",
      /^\s*(the\s+|packet\s+)?header\b/i,
      ["Payload", "Trailer", "Parity byte", "Check digit", "Router"],
      "The header holds the destination address, the originator's address and the packet number. 0478/12, March 2024, Question 7(b)(i).", EX_PKT_PART, W_PKT),
    t1("pkt-1c", "pkt", "Which section of a packet holds the actual data?", "Payload",
      /^\s*(the\s+)?pay\s*load\b/i,
      ["Header", "Trailer", "Parity byte", "Packet number", "Router"],
      "The payload is the actual data. 0478/11, June 2024, Question 4(a).", EX_PKT_PART, W_PKT),
    t1("pkt-1d", "pkt", "Which section of a packet holds a method of error checking?", "Trailer",
      /^\s*(the\s+)?trailer\b/i,
      ["Header", "Payload", "Packet number", "Router", "Check digit"],
      "The trailer holds an error checking method. 0478/12, March 2025, Question 2(d)(i) mark scheme.", EX_PKT_PART, W_PKT),
    t1("pkt-1e", "pkt", "Apart from the destination address, name one item stored in a packet header.", "Packet number",
      /packet\s+(number|order)|sequence\s+number|originator|sender'?s?\s+(ip\s+)?address|source\s+(ip\s+)?address/i,
      ["The payload", "The check digit", "The parity byte", "The encryption key", "The trailer"],
      "Header items: destination address, originator's (sender's) address, packet number. 0478/11, June 2023, Question 2(c)(i).", EX_PKT_PAY, W_PKT)
  );

  var Q_PKT = "An artist emails an image file to their friends. The file is transmitted across a network as data packets.\nDescribe the structure of a data packet. [3]";
  var EX_PKT2 = "Describe what is held in a packet header. [2]\nStep 1: the question asks about one section, so name what is inside it.\nStep 2: the destination address, so routers know where to send it.\nStep 3: the packet number, so the file can be put back in order.\nStep 4: a vague word like \"information\" earns nothing: name the item.";
  var W_PKT2 = "The mark goes to the exact name of a section. Is this the name, or a description that could mean anything?";
  add(
    t2("pkt-2a", "pkt", Q_PKT + "\nWhich line earns the first mark?", "A packet is split into three sections",
      ["A packet is split into bits", "A file is split into packets", "A packet has a start and an end", "A packet has data in it", "A packet is a small piece of data"],
      "Mark scheme point: a packet is split into three sections. \"A file is split into packets\" answers a different question (packet switching). 0478/11, June 2024, Question 4(a).", EX_PKT2, W_PKT2),
    t2("pkt-2b", "pkt", Q_PKT + WHICH, "One section is the header",
      ["One section is the address", "One section is the top", "One section is the router", "One section is the front", "One section is the label"],
      "Mark scheme point: the header. Use the section's name. 0478/11, June 2024, Question 4(a).", EX_PKT2, W_PKT2),
    t2("pkt-2c", "pkt", Q_PKT + WHICH, "One section is the payload",
      ["One section is the packet number", "One section is the router", "One section is the parity bit", "One section is the address", "One section is the file"],
      "Mark scheme point: the payload. 0478/11, June 2024, Question 4(a).", EX_PKT2, W_PKT2),
    t2("pkt-2d", "pkt", Q_PKT + WHICH, "One section is the trailer",
      ["One section is the end", "One section is the check digit", "One section is the last packet", "One section is the receiver", "One section is the parity byte"],
      "Mark scheme point: the trailer. 0478/11, June 2024, Question 4(a).", EX_PKT2, W_PKT2)
  );

  var EX_PKT3 = "Describe the structure of a letter sent by post. [3]\nStep 1: say how many parts it has.\nStep 2: name each part: the envelope with the address, the letter inside, and the signature at the end.\nStep 3: one mark for each named part, so give the names, not a story about posting it.";
  var W_PKT3 = "Name the sections, and only what is inside one packet. How the packets travel is a different question.";
  add(
    t3("pkt-3a", "pkt", Q_PKT,
      ["One section is the header", "One section is the payload", "One section is the trailer"],
      ["A file is split into packets", "One section is the router", "One section is the check digit", "The packets take different routes", "One section is the parity byte"],
      "Any three of: three sections, the header, the payload, the trailer. 0478/11, June 2024, Question 4(a), the same as Question 3(a) of your exam.", EX_PKT3, W_PKT3),
    t3("pkt-3b", "pkt", "A company sends an email using packet switching.\nDescribe the structure of a packet of data for the email. [3]",
      ["A packet is split into three sections", "The header holds the destination address", "The payload holds the data"],
      ["The trailer holds the destination address", "The header holds the data", "The payload holds the packet number", "A packet is split into two sections", "The router is part of the packet"],
      "Three sections, each named with what it holds. 0478/11, November 2024, Question 4(a) and 0478/11, June 2024, Question 4(a).", EX_PKT3, W_PKT3),
    t3("pkt-3c", "pkt", "A student sends a sound file across a network.\nIdentify three items of data that would be included in the header of each packet. [3]",
      ["The destination address", "The originator's address", "The packet number"],
      ["The payload", "The error checking method", "The file's name", "The encryption key", "The check digit"],
      "Header items from the 0478/11, June 2023, Question 2(c)(i) mark scheme.", EX_PKT3, W_PKT3),
    t3("pkt-3d", "pkt", "Describe what the payload and the trailer of a packet hold. [2]",
      ["The payload holds the actual data", "The trailer holds a method of error checking"],
      ["The payload holds the destination address", "The trailer holds the packet number", "The trailer is the first section", "The payload holds the originator's address", "The trailer holds the encryption key"],
      "Payload: the data. Trailer: an error checking method. 0478/12, March 2025, Question 2(d)(i) mark scheme.", EX_PKT3, W_PKT3)
  );

  // =====================================================================
  // 2.1 Packet switching
  // =====================================================================
  var W_PSW = "Follow one packet from the sender to the receiver. What happens to it on the way?";
  var EX_PSW1 = "What does each byte get added to it in a parity check?\nStep 1: the sender counts the 1s in the byte.\nStep 2: it adds one extra bit so the count matches the agreed parity.\nStep 3: that extra bit is the parity bit.";
  var EX_PSW1B = "Who reads the destination address in a header?\nStep 1: the header is read at every stop on the way.\nStep 2: the device at each stop decides where the packet goes next.\nStep 3: so the device reading it is the router.";
  add(
    t1("psw-1a", "psw", "What is a file split into before it is sent across a network?", "Packets",
      /packet/i,
      ["Bytes", "Bits", "Sections", "Check digits", "Parity blocks"],
      "The file is split into packets. Many students left this first step out. 0478/12, March 2025, Question 2(d)(i).", EX_PSW1, W_PSW),
    t1("psw-1b", "psw", "Which device directs each packet towards its destination?", "Router",
      /\brouter/i,
      ["Web server", "Printer", "Receiver", "Payload", "Trailer"],
      "A router directs each packet towards its destination and selects the most efficient path. 0478/12, March 2025, Question 2(d)(i).", EX_PSW1, W_PSW),
    t1("psw-1c", "psw", "Can packets from the same file take different routes?", "Yes, each packet can take a different route",
      /^\s*yes\b/i,
      ["No, they all take the same route", "No, only one packet is sent at a time", "Only if the file is encrypted", "Only if parity is used", "No, the router keeps them together"],
      "Each packet can take a different path. 0478/12, March 2025, Question 2(d)(i).", EX_PSW1B, W_PSW),
    t1("psw-1d", "psw", "Why can packets arrive out of order?", "They take different routes",
      /(different|other|separate)\s+(routes?|paths?|ways?)/i,
      ["The router reorders them", "They are encrypted", "Parity bits change their order", "The header is lost", "They are too big"],
      "Each packet can take a different route, and some routes are slower, so packets can arrive out of order. 0478/11, June 2023, Question 2(c)(ii).", EX_PSW1B, W_PSW),
    t1("psw-1e", "psw", "How does the receiver put the packets back in order?", "Using the packet numbers",
      /number/i,
      ["Using the arrival order", "Using the destination address", "Using the trailer", "Using a check digit", "Using the parity bits"],
      "After the last packet arrives, the packets are reordered using the packet number in each header. 0478/12, March 2025, Question 2(d)(i).", EX_PSW1, W_PSW)
  );

  var Q_PSW = "An artist emails an image file to their friends.\nExplain how a file is broken down into packets and transmitted over a network. [5]";
  var EX_PSW2 = "Explain how a letter gets from a sender to a receiver by post. [4]\nStep 1: say what happens to it first: it is put in an envelope with an address.\nStep 2: say who moves it: sorting offices send it on towards the address.\nStep 3: say what can happen on the way: two letters posted together can go different ways.\n" +
    "Step 4: say what happens at the end. Each step names who does what, so each one earns a mark.";
  var W_PSW2 = "Who does it, and what exactly do they do? A vague line names neither.";
  add(
    t2("psw-2a", "psw", Q_PSW + WHICH, "The file is split into packets",
      ["The file is sent all at once", "The file is sent in one go", "The file is compressed", "The file is encrypted", "The file is sent through the internet"],
      "Mark scheme point: data is split into packets. 0478/12, March 2025, Question 2(d)(i).", EX_PSW2, W_PSW2),
    t2("psw-2b", "psw", Q_PSW + WHICH, "Each packet has a header with the destination address",
      ["Each packet has an address", "The packet goes to the right place", "Each packet has the sender's name", "The header holds the data", "The trailer holds the destination address"],
      "Mark scheme points: each packet is given a header, with an example such as the destination IP address. 0478/12, March 2025, Question 2(d)(i).", EX_PSW2, W_PSW2),
    t2("psw-2c", "psw", Q_PSW + WHICH, "A router directs each packet towards its destination",
      ["The packets find their own way", "The internet sends the packets", "The sender directs each packet", "The packets go straight to the receiver", "A router sends all the packets together"],
      "Mark scheme point: a router directs each packet towards its destination. 0478/12, March 2025, Question 2(d)(i).", EX_PSW2, W_PSW2),
    t2("psw-2d", "psw", Q_PSW + WHICH, "Each packet can take a different route",
      ["All packets take the same route", "The packets travel together", "The packets travel in order", "The packets go through one router", "The packets go one at a time"],
      "Mark scheme point: each packet can take a different path. 0478/12, March 2025, Question 2(d)(i).", EX_PSW2, W_PSW2),
    t2("psw-2e", "psw", Q_PSW + WHICH, "The packets are reordered using the packet numbers",
      ["The receiver reads the packets as they arrive", "The packets are reordered using the destination address", "The router puts the packets in order", "The packets always arrive in order", "The packets are reordered using the parity bits"],
      "Mark scheme points: packets can arrive out of order, and after the last one arrives they are reordered. 0478/12, March 2025, Question 2(d)(i).", EX_PSW2, W_PSW2)
  );

  var W_PSW3 = "Go in order: split, label, direct, travel, put back together.";
  add(
    t3("psw-3a", "psw", Q_PSW,
      ["The file is split into packets", "Each packet has a header with the destination IP address", "A router directs each packet towards its destination", "Each packet can take a different route", "Packets can arrive out of order and are then reordered"],
      ["The file is sent all at once", "All the packets take the same route", "The sender directs each packet", "The packets always arrive in order", "The header holds the data", "The packets are reordered using the destination address"],
      "Five mark scheme points of 0478/12, March 2025, Question 2(d)(i), the same as Question 3(b) of your exam.", EX_PSW2, W_PSW3),
    t3("psw-3b", "psw", "A student sends a sound file to a friend. The file is transmitted across a network that uses packet switching.\nExplain how the file is transmitted using packet switching. [5]",
      ["The data is split into packets", "A router controls the route each packet takes", "Each packet can take a different route", "Packets may arrive out of order", "Once the last packet has arrived, the packets are reordered"],
      ["The data is sent as one packet", "The sender controls the route each packet takes", "All packets take the same route", "Packets always arrive in order", "The router reorders the packets", "The packets are reordered using the trailer"],
      "Five mark scheme points of 0478/11, June 2023, Question 2(c)(ii).", EX_PSW2, W_PSW3),
    t3("psw-3c", "psw", "Data is transmitted using packet switching.\nIdentify two items of data contained in a packet header. [2]",
      ["The destination address", "The packet number"],
      ["The payload", "The error checking method", "The file's name", "The parity byte", "The encryption key"],
      "Header items from the 0478/12, March 2024, Question 7(b)(i) mark scheme.", EX_PSW2, W_PSW3),
    t3("psw-3d", "psw", "Data is transmitted using packet switching.\nDescribe the role of a router in packet switching. [2]",
      ["It controls the route each packet takes", "It chooses the most efficient route"],
      ["It splits the file into packets", "It reorders the packets", "It adds the parity bit", "It encrypts the packets", "It sends every packet on the same route"],
      "Router points from the 0478/12, March 2024, Question 7(b)(ii) mark scheme.", EX_PSW2, W_PSW3)
  );

  // =====================================================================
  // 2.2 Parity check
  // =====================================================================
  var W_PAR = "Sender or receiver? Who does this step?";
  var EX_PAR1 = "Odd parity is used. The sender has the 7 bits 1010000. What parity bit does it add?\nStep 1: count the 1s: there are two.\nStep 2: two is not odd, so one more 1 is needed.\nStep 3: the sender adds a parity bit of 1, making three 1s.";
  var EX_PAR1B = "In ARQ, who sends a negative acknowledgement?\nStep 1: only the device that gets the data can check it.\nStep 2: if its check fails, it tells the other device.\nStep 3: so the receiving device sends it.";
  add(
    t1("par-1a", "par", "Even parity is used. How many 1s must each byte have, counting the parity bit?", "An even number",
      /^(?!.*\bodd\b).*\beven\b/i,
      ["An odd number", "Exactly eight", "Exactly one", "None", "Exactly seven"],
      "With even parity every byte, parity bit included, has an even number of 1s. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR1, W_PAR),
    t1("par-1b", "par", "In a parity check, who adds the parity bit?", "The sender",
      /^(?!.*receiv).*\bsend(er|ing)?\b/i,
      ["The receiver", "The router", "The user", "The check digit", "The printer"],
      "The sender counts the 1s in each byte and adds the parity bit. Many students left this out. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR1B, W_PAR),
    t1("par-1c", "par", "In a parity check, who recounts the 1s in each byte after it arrives?", "The receiver",
      /^(?!.*\bsend).*\breceiv(er|ing)/i,
      ["The sender", "The router", "The user", "The check digit", "The web server"],
      "The receiving device recounts the 1s in each byte. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR1, W_PAR),
    t1("par-1d", "par", "Before a parity check, what must the sender and receiver agree on?", "Odd or even parity",
      /\b(odd|even)\b|which\s+parity|type\s+of\s+parity/i,
      ["The encryption key", "The packet number", "The check digit", "The route", "The length of the timer"],
      "Mark scheme point: sender and receiver agree on the parity to use. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR1B, W_PAR),
    t1("par-1e", "par", "The data is split into which units, so that each one gets a parity bit?", "Bytes",
      /\bbytes?\b/i,
      ["Packets", "Files", "Check digits", "Keys", "Wires"],
      "Mark scheme point: data is split into bytes. Many students left this out. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR1, W_PAR)
  );

  var Q_PAR = "An email service uses parity bits as a method of error detection during the transmission of data.\nDescribe how the parity bits are used to detect errors. [5]";
  var EX_PAR2 = "Describe how a check digit is used to find errors in a bar code. [3]\nStep 1: say what is made, and who makes it: a digit is calculated from the other digits.\nStep 2: say where it goes: on the end of the number.\nStep 3: say what happens when it is read: it is calculated again and compared.\nStep 4: \"the data is checked\" names nobody and nothing, so it earns no mark.";
  var W_PAR2 = "The mark scheme names who does it (sender or receiver) and what they count. Does this line?";
  add(
    t2("par-2a", "par", Q_PAR + WHICH, "The sender and receiver agree on odd or even parity",
      ["The parity is set to the right number", "The sender picks any parity", "The receiver chooses the parity after the data arrives", "Parity checks the data is correct", "The bits are checked"],
      "Mark scheme point: sender and receiver agree on the parity to use. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR2, W_PAR2),
    t2("par-2b", "par", Q_PAR + WHICH, "The data is split into bytes",
      ["The data is split into packets", "The data is checked", "The data is split up", "The data is sent in bits", "The data is encrypted first"],
      "Mark scheme point: data is split into bytes. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR2, W_PAR2),
    t2("par-2c", "par", Q_PAR + WHICH, "The sender adds a parity bit to each byte to match the parity",
      ["The receiver adds a parity bit to each byte", "A check digit is added to each byte", "The sender adds a 1 to every byte", "The sender counts the bits", "Parity bits are added to make the data bigger"],
      "Mark scheme point: each byte is assigned a parity bit to match the parity. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR2, W_PAR2),
    t2("par-2d", "par", Q_PAR + WHICH, "The receiver recounts the 1s in each byte",
      ["The receiver checks the data", "The sender recounts the 1s", "The receiver sends the data back", "The receiver counts the bytes", "The router counts the 1s"],
      "Mark scheme point: the receiving device recounts the 1s in each byte. \"Checks the data\" does not say how. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR2, W_PAR2),
    t2("par-2e", "par", Q_PAR + WHICH, "If the count does not match the parity, an error is reported",
      ["If there is an error it is fixed", "If the count matches, an error is reported", "The receiver fixes the wrong bit", "If the count does not match, the data is deleted", "The error is found"],
      "Mark scheme point: compares to the parity used, and if it does not match, an error is reported. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR2, W_PAR2)
  );

  var EX_PAR3 = "Describe how a checksum is used to detect errors. [4]\nStep 1: before sending: a value is worked out from the data with an algorithm.\nStep 2: sending: the value travels with the data.\nStep 3: after arriving: the receiver works the value out again.\nStep 4: the result: different values mean an error.\nOne step per mark, each saying who does what.";
  var W_PAR3 = "Put the steps in order: agree, split, add the bit, recount, report.";
  add(
    t3("par-3a", "par", Q_PAR,
      ["The sender and receiver agree on odd or even parity", "The data is split into bytes", "The sender adds a parity bit to each byte to match the parity", "The receiver recounts the 1s in each byte", "If the count does not match the parity, an error is reported"],
      ["The receiver adds the parity bit", "The sender recounts the 1s after the data arrives", "The parity bit corrects the error", "The data is split into packets", "If the count matches the parity, an error is reported", "A check digit is added to the end"],
      "Five mark scheme points of 0478/12, March 2022, Question 2(c)(iii), the same as Question 4(a) of your exam.", EX_PAR3, W_PAR3),
    t3("par-3b", "par", "A computer sends data to a printer. Even parity is used.\nDescribe how a parity check finds an error in the data. [4]",
      ["The computer counts the 1s in each byte", "The computer sets the parity bit so the count is even", "The printer recounts the 1s in each byte", "If a count is odd, an error is reported"],
      ["The printer adds the parity bit", "The computer recounts the 1s after the data arrives", "If a count is even, an error is reported", "The parity bit corrects the error", "The printer sends the data back to the computer"],
      "The sender, parity bit, recount and report points of 0478/12, March 2022, Question 2(c)(iii), with even parity.", EX_PAR3, W_PAR3),
    t3("par-3c", "par", "Explain why a parity check may not detect an error in a byte. [2]",
      ["Two bits in the byte could change", "The number of 1s would still match the parity"],
      ["The parity bit is always correct", "Parity only checks the first bit", "The receiver does not count the 1s", "The data is encrypted", "The check digit is wrong"],
      "If two bits change, the count still matches the parity, so the error is not detected. From the 2.2 parity lesson.", EX_PAR3, W_PAR3),
    t3("par-3d", "par", "Odd parity is used. This byte arrives, parity bit first: 1 0 1 1 0 1 1 1\nExplain how the receiver knows there is an error. [2]",
      ["The receiver counts six 1s, an even number", "Odd parity is used, so the count should be odd"],
      ["The receiver counts five 1s, an odd number", "Even parity is used, so the count should be even", "The parity bit is a 1, so it is wrong", "The byte has eight bits", "The sender reports the error"],
      "The receiver recounts the 1s and compares with the agreed parity. 0478/12, March 2022, Question 2(c)(iii).", EX_PAR3, W_PAR3)
  );

  // =====================================================================
  // 2.2 Parity block check
  // =====================================================================
  var W_BLK = "Find the row with the wrong count, then the column with the wrong count.";
  var EX_BLK1 = "Even parity. A row has the bits 1 0 1 1 0 0 1 0. Is its count right?\nStep 1: count the 1s: there are four.\nStep 2: even parity wants an even count.\nStep 3: four is even, so this row is fine.";
  add(
    t1("blk-1a", "blk", "In a parity block check, what does each bit of the parity byte check?", "One column of bits",
      /column/i,
      ["One row of bits", "One byte", "The whole file", "The packet number", "The check digit"],
      "Each bit in the parity byte allows a check on one column of bits. 0478/12, November 2022, Question 5.", EX_BLK1, W_BLK),
    t1("blk-1b", "blk", "Each byte's own parity bit checks what: its row, or a column?", "Its row",
      /^(?!.*column).*\brow\b/i,
      ["A column", "Every column", "The parity byte", "The whole table", "The check digit"],
      "Each byte's parity bit checks that byte, which is one row of the table. 0478/12, November 2022, Question 5.", EX_BLK1, W_BLK),
    { id: "blk-1c", category: "blk-1", note: "The wrong bit is where the row with the wrong count crosses the column with the wrong count. 0478/12, March 2022, Question 2(c)(iii), last point.",
      working: [W_BLK],
      randomize: function () {
        var r = 1 + rnd(8), c;
        do { c = 2 + rnd(7); } while (c === r);
        var ans = "Byte " + r + ", bit " + c;
        var dis = [];
        function d(a, b) { var s = "Byte " + a + ", bit " + b; if (s !== ans && dis.indexOf(s) < 0) dis.push(s); }
        d(c, r); d(r, r); d(c, c); d(r === 8 ? 7 : r + 1, c); d(r, c === 8 ? 7 : c + 1); d(r === 1 ? 2 : r - 1, c); d(r, c === 2 ? 3 : c - 1); d(c, c === 8 ? 7 : c + 1);
        while (dis.length < 5) d(1 + rnd(8), 2 + rnd(7));
        return {
          prompt: "A parity block check finds a wrong count in the row for byte " + r + " and in the column for bit " + c + ".\nWhere is the bit with the error?",
          answers: [ans],
          keywords: [new RegExp("byte\\D*" + r + "\\b.*bit\\D*" + c + "\\b|bit\\D*" + c + "\\b.*byte\\D*" + r + "\\b", "i")],
          distractors: dis.slice(0, 5),
          example: "A check finds a wrong count in the row for byte " + (r === 1 ? 8 : r - 1) + " and in the column for bit " + (c === 2 ? 8 : c - 1) + ".\nStep 1: the row tells you the byte.\nStep 2: the column tells you the bit.\nStep 3: so the error is in byte " + (r === 1 ? 8 : r - 1) + ", at bit " + (c === 2 ? 8 : c - 1) + "."
        };
      } },
    { id: "blk-1d", category: "blk-1", note: "A row is right when its count of 1s matches the agreed parity. 0478/12, November 2022, Question 5.",
      working: [W_BLK],
      randomize: function () {
        var mode = pick(["odd", "even"]), n = 1 + rnd(7), ok = (n % 2 === 1) === (mode === "odd");
        var kind = n % 2 === 1 ? "odd" : "even";
        var ans = (ok ? "Yes" : "No") + ", the count is " + kind;
        var bits = [], k;
        for (k = 0; k < 8; k++) bits.push(k < n ? 1 : 0);
        for (k = bits.length - 1; k > 0; k--) { var j = rnd(k + 1), t = bits[k]; bits[k] = bits[j]; bits[j] = t; }
        return {
          prompt: cap(mode) + " parity is used. One row of a parity block arrives as: " + bits.join(" ") + "\nIs the count of 1s in this row right?",
          answers: [ans],
          keywords: [ok ? /^\s*yes\b/i : /^\s*no\b/i],
          distractors: [(ok ? "No" : "Yes") + ", the count is " + kind, (ok ? "No" : "Yes") + ", the count is " + other(kind),
            (ok ? "No, every row is wrong" : "Yes, every row is correct"), (ok ? "No, the parity bit is wrong" : "Yes, the parity bit fixes it"), "Only if the column is wrong too"],
          example: EX_BLK1
        };
      } },
    t1("blk-1e", "blk", "Odd parity is used. A column of the block should have what kind of count of 1s?", "An odd number",
      /^(?!.*\beven\b).*\bodd\b/i,
      ["An even number", "Exactly eight", "Exactly one", "None", "The same as the row"],
      "With odd parity every row and every column should have an odd number of 1s. 0478/12, November 2022, Question 5.", EX_BLK1, W_BLK)
  );

  var W_BLK2 = "The marks are for naming the parity, and naming the row and the column with the wrong count.";
  function blk2(id, which) {
    return { id: id, category: "blk-2", pickThenType: true, working: [W_BLK2], example: BLOCK_EXAMPLE,
      note: "Mark scheme points: counted the 1s, the parity used, and the row (byte) and column (bit) with the wrong count. 0478/12, November 2022, Question 5, the same as Question 4(b)(ii) of your exam.",
      randomize: function () {
        var mode = pick(["odd", "even"]), b = makeBlock(mode), q = blockIntro(mode, b) +
          "\nThe error is in byte " + b.byteNo + ", bit " + b.bitNo + ".\nExplain how you found the error. [2]" + WHICH;
        var wrongKind = other(mode);
        var lines = {
          parity: [cap(mode) + " parity is used",
            ["Parity is used", "The bit looks wrong", "I looked at the table", cap(wrongKind) + " parity is used", "The parity byte is wrong"]],
          place: ["Byte " + b.byteNo + " and the bit " + b.bitNo + " column each have an " + wrongKind + " number of 1s",
            ["Byte " + b.byteNo + " is wrong", "Bit " + b.bitNo + " is wrong", "Byte " + b.byteNo + " and the bit " + b.bitNo + " column each have an " + mode + " number of 1s",
              "Byte " + b.byteNo + " has too many bits", "The error is where they cross"]],
          count: ["I counted the 1s in every row and column",
            ["I looked at every bit", "I checked the parity byte only", "I counted the 0s in byte 1 only", "I guessed the bit", "I added up the bytes"]]
        }[which];
        return { prompt: q, answers: [lines[0]], distractors: lines[1] };
      } };
  }
  add(blk2("blk-2a", "parity"), blk2("blk-2b", "place"), blk2("blk-2c", "count"), blk2("blk-2d", "place"));

  var W_BLK3 = "One statement for the counting, one for the parity, one for where the counts go wrong.";
  function blk3(id, marks) {
    return { id: id, category: "blk-3", type: "multi", all: true, show: marks + 3, working: [W_BLK3], example: BLOCK_EXAMPLE,
      note: "Mark scheme points: counted all the 1s, the parity used, and the wrong count in that row (byte) and column (bit). 0478/12, November 2022, Question 5, the same as Question 4(b)(ii) of your exam.",
      randomize: function () {
        var mode = pick(["odd", "even"]), b = makeBlock(mode), wrongKind = other(mode);
        var place = "Byte " + b.byteNo + " and the bit " + b.bitNo + " column each have an " + wrongKind + " number of 1s";
        var answers = marks === 3 ? [place, cap(mode) + " parity is used", "I counted the 1s in every row and column"] : [place, cap(mode) + " parity is used"];
        return {
          prompt: blockIntro(mode, b) + "\nThe error is in byte " + b.byteNo + ", bit " + b.bitNo + ".\nExplain how you found the error. [" + marks + "]" + FULL,
          answers: answers,
          distractors: [cap(wrongKind) + " parity is used",
            "Byte " + b.byteNo + " and the bit " + b.bitNo + " column each have an " + mode + " number of 1s",
            "Byte " + b.bitNo + " and the bit " + b.byteNo + " column each have an " + wrongKind + " number of 1s",
            "The parity byte is always wrong", "I found the bit that looked different", "I counted the 0s in the first row only"]
        };
      } };
  }
  add(blk3("blk-3a", 2), blk3("blk-3b", 3), blk3("blk-3c", 2), blk3("blk-3d", 3));

  // =====================================================================
  // 2.2 Checksum, echo check and ARQ
  // =====================================================================
  var W_OTH = "Which device does this step: the one that sends, or the one that receives?";
  var EX_OTH1 = "In a parity check, what does the receiver do with each byte?\nStep 1: it counts the 1s again.\nStep 2: it compares the count with the agreed parity.\nStep 3: a count that does not match means an error.";
  var EX_OTH1B = "Name an error detection method used for data typed or scanned in, not for data sent.\nStep 1: think of a bar code at a shop till.\nStep 2: its last digit is worked out from the others.\nStep 3: that is a check digit, used for data entry.";
  add(
    t1("other-1a", "other", "In a checksum, what does the receiver do with the checksum value?", "Recalculates it and compares the two values",
      /^(?=.*(recalc|calculat|work\w*\s+(it\s+)?out))(?=.*(compar|match|same|differen)).*/i,
      ["Sends it back to the sender", "Deletes it", "Encrypts it", "Ignores it", "Uses it as the packet number"],
      "The receiver recalculates the value with the same algorithm; different values mean an error. 0478/13, November 2024, Question 2(f)(i) and 0478/12, March 2022, Question 2(c)(iv).", EX_OTH1, W_OTH),
    t1("other-1b", "other", "In an echo check, what is sent back to the sender?", "A copy of the data",
      /\bcop(y|ies)\b|\bthe\s+(same\s+)?data\b/i,
      ["A negative acknowledgement", "A checksum", "A parity bit", "A check digit", "The private key"],
      "Echo check: a copy of the data is sent back to the sender. 0478/13, November 2024, Question 2(f)(i).", EX_OTH1, W_OTH),
    t1("other-1c", "other", "In an echo check, who compares the original data with the copy?", "The sender",
      /^(?!.*receiv).*\bsend(er|ing)?\b/i,
      ["The receiver", "The router", "The user", "The web server", "Nobody"],
      "The sender compares the data it sent with the copy sent back. 0478/13, November 2024, Question 2(f)(i).", EX_OTH1, W_OTH),
    t1("other-1d", "other", "Name one error detection method, other than parity, used during transmission.", "Checksum",
      /check\s*sum|echo|\barq\b|automatic\s+repeat/i,
      ["Parity check", "Check digit", "Parity byte", "Encryption", "Packet switching"],
      "Checksum, echo check or ARQ. A check digit is for data entry, and a parity description earns no marks here. 0478/12, March 2022, Question 2(c)(iv).", EX_OTH1B, W_OTH),
    t1("other-1e", "other", "In a checksum, how is the value worked out from the data?", "Using an algorithm",
      /algorithm|calculat|formula|\badd/i,
      ["It is chosen at random", "It is typed in by the user", "It is the packet number", "It is the number of packets", "It is copied from the header"],
      "Checksum: a value is calculated from the data using an algorithm. 0478/12, March 2022, Question 2(c)(iv).", EX_OTH1, W_OTH)
  );

  var Q_OTH = "An email service uses parity bits as a method of error detection during the transmission of data.\nIdentify and describe one other method of error detection used during the transmission of data. [4]";
  var EX_OTH2 = "Identify and describe one method of error detection used for data entry. [3]\nStep 1: the first mark is for the name: check digit.\nStep 2: then describe only that method: the digit is calculated from the other digits.\nStep 3: when the number is entered, it is calculated again and compared.\nStep 4: points about a different method earn nothing.";
  var W_OTH2 = "Does the line name the method or a real step of it, with the right device doing it?";
  add(
    t2("other-2a", "other", Q_OTH + "\nWhich line earns the mark for identifying the method?", "The method is a checksum",
      ["The method is a parity check", "The method is a parity block check", "The method is a check digit", "The method is encryption", "The method is packet switching"],
      "Mark scheme point: checksum, ARQ or echo check. Parity is in the question, so a parity description earns nothing. 0478/12, March 2022, Question 2(c)(iv).", EX_OTH2, W_OTH2),
    t2("other-2b", "other", Q_OTH + "\nThe method is a checksum." + WHICH, "A value is calculated from the data using an algorithm",
      ["A value is added to the data", "A random value is sent with the data", "The data is counted", "A parity bit is added to each byte", "A value is calculated from the packet number"],
      "Mark scheme points: a value is calculated from the data, using an algorithm. 0478/12, March 2022, Question 2(c)(iv).", EX_OTH2, W_OTH2),
    t2("other-2c", "other", Q_OTH + "\nThe method is a checksum." + WHICH, "The receiver recalculates the value using the same algorithm",
      ["The receiver checks the value", "The sender recalculates the value", "The receiver sends the value back", "The receiver uses a different algorithm", "The router recalculates the value"],
      "Mark scheme point: the value is recalculated by the receiver using the same algorithm. 0478/12, March 2022, Question 2(c)(iv).", EX_OTH2, W_OTH2),
    t2("other-2d", "other", Q_OTH + "\nThe method is an echo check." + WHICH, "The receiver sends a copy of the data back to the sender",
      ["The sender sends a copy of the data back to the receiver", "The data is sent again", "The receiver sends an acknowledgement", "The receiver checks the data", "The data is echoed"],
      "Mark scheme point: a copy of the data is sent back to the sender. 0478/13, November 2024, Question 2(f)(i).", EX_OTH2, W_OTH2),
    t2("other-2e", "other", Q_OTH + "\nThe method is an echo check." + WHICH, "If the data and the copy do not match, an error has occurred",
      ["If they match, an error has occurred", "The receiver compares the data", "The error is corrected", "The data is checked again", "If they do not match, the copy is deleted"],
      "Mark scheme point: if the original and the copy do not match, an error has occurred. 0478/13, November 2024, Question 2(f)(i).", EX_OTH2, W_OTH2)
  );

  var W_OTH3 = "One mark for the name, then three steps of that one method only.";
  add(
    t3("other-3a", "other", Q_OTH,
      ["The method is a checksum", "A value is calculated from the data using an algorithm", "The value is transmitted with the data", "The receiver recalculates the value using the same algorithm"],
      ["The method is a parity check", "A parity bit is added to each byte", "The sender recalculates the value", "The receiver sends a copy of the data back", "The value is chosen at random", "The receiver uses a different algorithm"],
      "Identify plus three checksum points from 0478/12, March 2022, Question 2(c)(iv), the same as Question 4(c) of your exam.", EX_OTH2, W_OTH3),
    t3("other-3b", "other", Q_OTH,
      ["The method is an echo check", "The receiver sends a copy of the data back to the sender", "The sender compares the data sent with the copy", "If they do not match, an error has occurred"],
      ["The receiver compares the data sent with the copy", "The method is a parity check", "The sender sends a copy to the receiver", "If they match, an error has occurred", "A check digit is added to the data"],
      "Identify plus the three echo check points of 0478/13, November 2024, Question 2(f)(i).", EX_OTH2, W_OTH3),
    t3("other-3c", "other", Q_OTH,
      ["The method is automatic repeat query (ARQ)", "The sender starts a timer when the data is sent", "The receiver checks the data for errors", "If an error is found, a negative acknowledgement is sent to the sender"],
      ["The receiver starts a timer when the data is sent", "The sender checks the data for errors", "If an error is found, the sender sends a negative acknowledgement", "The method is a parity check", "If no error is found, the data is resent"],
      "Identify plus three ARQ points from 0478/12, March 2022, Question 2(c)(iv).", EX_OTH2, W_OTH3),
    t3("other-3d", "other", Q_OTH,
      ["The method is a checksum", "A value is calculated from the data using an algorithm", "The receiver recalculates the value using the same algorithm", "If the two values are different, there is an error"],
      ["The method is a check digit", "The sender recalculates the value", "If the two values are the same, there is an error", "The receiver counts the 1s in each byte", "A copy of the data is sent back"],
      "Identify plus three checksum points from 0478/12, March 2022, Question 2(c)(iv).", EX_OTH2, W_OTH3)
  );

  // =====================================================================
  // 2.2 ARQ
  // =====================================================================
  var W_ARQ = "Only the device that receives the data can check it. Only the device that sent it can send it again.";
  var EX_ARQ1 = "In an echo check, who compares the two copies of the data?\nStep 1: the copy travels back to where the data started.\nStep 2: so the device that started it has both copies.\nStep 3: the sending device compares them.";
  var EX_ARQ1B = "In a checksum, what happens when the two values are different?\nStep 1: the values were worked out from the same data with the same algorithm.\nStep 2: so they should be equal.\nStep 3: different values mean the data changed: an error is reported.";
  add(
    t1("arq-1a", "arq", "In ARQ, who checks the data for errors?", "The receiver",
      /^(?!.*\bsend).*\breceiv(er|ing)/i,
      ["The sender", "The router", "The user", "Both devices", "Nobody, it is automatic"],
      "The receiver uses an error checking method to check the data. 0478/13, November 2022, Question 9.", EX_ARQ1B, W_ARQ),
    t1("arq-1b", "arq", "In ARQ with negative acknowledgement, who sends the negative acknowledgement?", "The receiver",
      /^(?!.*\bsend(er|ing)\b).*\breceiv(er|ing)/i,
      ["The sender", "The router", "The user", "Both the sender and the receiver", "Nobody, it is automatic"],
      "The receiver sends the negative acknowledgement to the sender. Many students had these roles the wrong way round. 0478/12, March 2022, Question 2(c)(iv).", EX_ARQ1, W_ARQ),
    t1("arq-1c", "arq", "In ARQ, what does the sender do when it gets a negative acknowledgement?", "Resends the data",
      /resen|re-sen|sen\w*\s+(it\s+|the\s+data\s+|the\s+packet\s+)?again|re-?transmit/i,
      ["Deletes the data", "Sends a positive acknowledgement", "Stops sending", "Corrects the error", "Checks the parity bit"],
      "A negative acknowledgement triggers the data to be resent. 0478/12, March 2022, Question 2(c)(iv).", EX_ARQ1B, W_ARQ),
    t1("arq-1d", "arq", "In ARQ, when does the sender start the timer?", "When the data is sent",
      /\bsen(d|t|ds|ding)\b|transmit/i,
      ["When the acknowledgement arrives", "When an error is found", "When the data is received", "After a timeout", "When the receiver checks the data"],
      "Mark scheme point: when the data is sent, a timer is started. 0478/13, November 2022, Question 9.", EX_ARQ1B, W_ARQ),
    t1("arq-1e", "arq", "In ARQ, no acknowledgement arrives before the timer runs out. What happens?", "The data is resent",
      /^(?!.*acknowledg).*(resen|re-sen|sent\s+again|sen\w*\s+(it\s+)?again|re-?transmit)/i,
      ["The data is deleted", "The receiver sends an acknowledgement", "Nothing happens", "The timer stops for good", "An error is corrected"],
      "Mark scheme point: if an acknowledgement is not received within the set time, the data is resent. 0478/13, November 2023, Question 5(c).", EX_ARQ1, W_ARQ),
    t1("arq-1f", "arq", "In ARQ, what is it called when the timer runs out and no acknowledgement has arrived?", "A timeout",
      /time\s*-?\s*out/i,
      ["A negative acknowledgement", "An echo", "A checksum", "A collision", "Skew"],
      "A timeout occurs and the data packet is resent. 0478/13, November 2023, Question 5(c).", EX_ARQ1, W_ARQ)
  );

  var Q_ARQ = "Data is transmitted between a computer and a printer. The computer transmits the data to the printer.\nThe computer and printer agree to use automatic repeat query (ARQ).\nExplain how ARQ using negative acknowledgement is used to establish that data is received without error. [3]";
  var W_ARQ2 = "Here the computer sends and the printer receives. Is the right device doing this step?";
  add(
    t2("arq-2a", "arq", Q_ARQ + WHICH, "The printer checks the data for errors",
      ["The computer checks the data for errors", "The data is checked", "The printer prints the data", "The printer sends the data back", "The router checks the data"],
      "Mark scheme point: the receiver checks the data for errors. Here the receiver is the printer. From the ARQ points of 0478/13, November 2022, Question 9.", ARQ_EXAMPLE, W_ARQ2),
    t2("arq-2b", "arq", Q_ARQ + WHICH, "If there is an error, the printer sends a negative acknowledgement",
      ["If there is an error, the computer sends a negative acknowledgement", "If there is no error, the printer sends a negative acknowledgement", "The printer sends an acknowledgement", "If there is an error, the printer fixes it", "If there is an error, the printer resends the data"],
      "Mark scheme point: if an error is found, a negative acknowledgement is sent to the sender. 0478/12, March 2022, Question 2(c)(iv).", ARQ_EXAMPLE, W_ARQ2),
    t2("arq-2c", "arq", Q_ARQ + WHICH, "The computer then resends the data",
      ["The printer then resends the data", "The computer then deletes the data", "The computer sends a negative acknowledgement", "The data is fixed", "The computer then stops"],
      "Mark scheme point: the negative acknowledgement triggers the data to be resent, by the sender. 0478/12, March 2022, Question 2(c)(iv).", ARQ_EXAMPLE, W_ARQ2),
    t2("arq-2d", "arq", Q_ARQ + WHICH, "A timer is started when the data is sent",
      ["A timer is started when the error is found", "The printer starts a timer when the data is printed", "A timer is used", "The data is sent at a set time", "A timer is started when the data is deleted"],
      "Mark scheme point: when the data is sent, a timer is started. 0478/13, November 2022, Question 9.", ARQ_EXAMPLE, W_ARQ2),
    t2("arq-2e", "arq", Q_ARQ + WHICH, "If no acknowledgement arrives in time, the data is resent",
      ["If no acknowledgement arrives, the printer resends the data", "If no acknowledgement arrives, the data is deleted", "If an acknowledgement arrives, the data is resent", "The data is sent again later", "If no acknowledgement arrives, the data is ignored"],
      "Mark scheme point: if an acknowledgement is not received within the time set, the data is resent. 0478/13, November 2022, Question 9.", ARQ_EXAMPLE, W_ARQ2)
  );

  var W_ARQ3 = "Write each step with its device: the receiver checks and replies, the sender times and resends.";
  function arq3(id, kind) {
    return { id: id, category: "arq-3", type: "multi", all: true, show: (kind === "pos" ? 4 : 3) + 3, working: [W_ARQ3], example: ARQ_EXAMPLE,
      note: kind === "pos" ? "Points from 0478/13, November 2023, Question 5(c): timer, receiver checks, positive acknowledgement, resend after a timeout."
        : "Points from 0478/12, March 2022, Question 2(c)(iv) and 0478/13, November 2022, Question 9, the same as Question 5 of your exam.",
      randomize: function () {
        var p = pick(PAIRS), s = p[0], r = p[1];
        var intro = "Data is transmitted from a " + s + " to a " + r + ". They agree to use automatic repeat query (ARQ).\n";
        var answers, dis;
        if (kind === "neg") {
          answers = ["The " + r + " checks the data for errors", "If there is an error, the " + r + " sends a negative acknowledgement to the " + s, "The " + s + " then resends the data"];
          dis = ["The " + s + " checks the data for errors", "If there is an error, the " + s + " sends a negative acknowledgement to the " + r, "The " + r + " then resends the data",
            "If there is no error, a negative acknowledgement is sent", "The " + r + " corrects the error itself", "The data is deleted"];
        } else if (kind === "timer") {
          answers = ["The " + s + " starts a timer when the data is sent", "If an error is found, the " + r + " sends a negative acknowledgement", "If no acknowledgement arrives in time, the " + s + " resends the data"];
          dis = ["The " + r + " starts a timer when the data arrives", "If an error is found, the " + s + " sends a negative acknowledgement", "If no acknowledgement arrives in time, the " + r + " resends the data",
            "If no acknowledgement arrives in time, the data is deleted", "The " + s + " corrects the error itself"];
        } else if (kind === "neg2") {
          answers = ["The " + r + " checks the data using an error checking method", "If an error is found, a negative acknowledgement is sent to the " + s, "This makes the " + s + " resend the data"];
          dis = ["The " + s + " checks the data using an error checking method", "If an error is found, a negative acknowledgement is sent to the " + r, "This makes the " + r + " resend the data",
            "If no error is found, a negative acknowledgement is sent", "The " + r + " resends a copy of the data to check it"];
        } else {
          answers = ["The " + s + " starts a timer when the data is sent", "The " + r + " checks the data for errors", "If there is no error, the " + r + " sends a positive acknowledgement", "If no acknowledgement arrives before the timer ends, the data is resent"];
          dis = ["The " + r + " starts a timer when the data is sent", "The " + s + " checks the data for errors", "If there is an error, the " + r + " sends a positive acknowledgement",
            "If an acknowledgement arrives, the data is resent", "The " + s + " sends a positive acknowledgement"];
        }
        var q = kind === "pos" ? "Explain how ARQ using positive acknowledgement makes sure that data is received free of errors. [4]"
          : "Explain how ARQ using negative acknowledgement is used to establish that data is received without error. [3]";
        return { prompt: intro + q + FULL, answers: answers, distractors: dis };
      } };
  }
  add(arq3("arq-3a", "neg"), arq3("arq-3b", "timer"), arq3("arq-3c", "pos"), arq3("arq-3d", "neg2"));

  // =====================================================================
  // 2.2 Check digits
  // =====================================================================
  var W_CD = "The check digit is made once when the number is made, and again every time it is read.";
  var EX_CD1 = "In a parity check, what is added to each byte?\nStep 1: the sender counts the 1s.\nStep 2: it adds one bit so the count matches the agreed parity.\nStep 3: that bit is the parity bit, and it goes in front of the data bits.";
  var EX_CD1B = "Is a parity check used for numbers typed in by a person, or for data sent between devices?\nStep 1: parity bits are added by the sending device.\nStep 2: they are recounted by the receiving device.\nStep 3: so a parity check is for data sent between devices.";
  add(
    t1("cd-1a", "cd", "Where is the check digit placed in a bar code?", "At the end",
      /\b(end|last|right)\b/i,
      ["At the start", "In the middle", "In the header", "In the trailer", "In the parity byte", "It is sent separately"],
      "The check digit is added to the bar code, as its last digit. 0478/12, November 2024, Question 5(a).", EX_CD1, W_CD),
    t1("cd-1b", "cd", "How is a check digit made?", "It is calculated from the other digits",
      /calculat|work\w*\s+out|algorithm|from\s+the\s+(other\s+)?digits/i,
      ["It is chosen at random", "It is the first digit copied", "It is typed in by the user", "It is the number of digits", "It is the packet number"],
      "A check digit is calculated from the bar code data using an algorithm. Many students left out how it is made. 0478/12, November 2024, Question 5(a).", EX_CD1B, W_CD),
    t1("cd-1c", "cd", "A bar code is scanned. What happens to the check digit?", "It is recalculated",
      /recalc|re-calc|calculat\w*\s+again|work\w*\s+(it\s+)?out\s+again/i,
      ["It is deleted", "It is sent back to the sender", "It is encrypted", "It is ignored", "It is added to the price"],
      "When the bar code is scanned, the check digit is recalculated using the same algorithm. 0478/12, November 2024, Question 5(a).", EX_CD1B, W_CD),
    t1("cd-1d", "cd", "Check digits find errors in which kind of data?", "Data entry",
      /entry|enter|\btyp|scan|input/i,
      ["Data sent down a cable", "Data in packets", "Encrypted data", "Data sent wirelessly", "Data in the trailer"],
      "A check digit checks for errors in data entry, such as a bar code being scanned or a number typed in. 0478/12, March 2026, Question 9(a).", EX_CD1B, W_CD),
    t1("cd-1e", "cd", "The recalculated check digit does not match the one in the bar code. What does that mean?", "There is an error",
      /^(?!.*\bno\s+error).*\b(error|mistake|wrong|incorrect)/i,
      ["There is no error", "The bar code is correct", "The check digit is changed to match", "The price is zero", "The data is resent"],
      "If the check digits do not match, an error has occurred. 0478/12, November 2024, Question 5(a).", EX_CD1, W_CD)
  );

  var Q_CD = "A programmer is writing a program that will take data from bar codes as input. A bar code includes a check digit.\nExplain how the check digit is used to check for errors in data entry. [3]";
  var EX_CD2 = "Explain how a checksum is used to check for errors. [3]\nStep 1: say how the value is made: calculated from the data with an algorithm.\nStep 2: say what happens at the other end: it is calculated again the same way.\nStep 3: say what a difference means: an error.\n\"The data is checked\" names no step, so it earns no mark.";
  var W_CD2 = "Does the line say how the digit is made, where it goes, or what happens when it is read?";
  add(
    t2("cd-2a", "cd", Q_CD + WHICH, "The check digit is calculated from the bar code data",
      ["The check digit is a random digit", "The check digit checks the data", "The check digit is the first digit", "The check digit is typed by the user", "The check digit counts the 1s"],
      "Mark scheme point: a check digit is calculated from the bar code data. 0478/12, November 2024, Question 5(a).", EX_CD2, W_CD2),
    t2("cd-2b", "cd", Q_CD + "\nA student has written that the check digit is calculated from the bar code data." + WHICH, "It is calculated using an algorithm",
      ["It is calculated by the user", "It is calculated using the parity", "It is calculated by guessing", "It is checked carefully", "It is calculated by the router"],
      "Mark scheme point: ... using an algorithm. 0478/12, November 2024, Question 5(a).", EX_CD2, W_CD2),
    t2("cd-2c", "cd", Q_CD + WHICH, "The check digit is added to the end of the bar code",
      ["The check digit is added to the front", "The check digit is sent separately", "The check digit is added to the header", "The check digit is added to each byte", "The check digit is put in the payload"],
      "Mark scheme point: ... and added to the bar code. 0478/12, November 2024, Question 5(a).", EX_CD2, W_CD2),
    t2("cd-2d", "cd", Q_CD + WHICH, "When scanned, the check digit is recalculated using the same algorithm",
      ["When scanned, the check digit is read", "When scanned, the check digit is deleted", "When scanned, a new algorithm is used", "When scanned, the bar code is sent back", "When scanned, the bits are counted"],
      "Mark scheme points: when the bar code is scanned the check digit is recalculated, using the same algorithm. 0478/12, November 2024, Question 5(a).", EX_CD2, W_CD2),
    t2("cd-2e", "cd", Q_CD + WHICH, "If the check digits do not match, an error has occurred",
      ["If they match, an error has occurred", "The check digit fixes the error", "The bar code is checked", "If they do not match, the price is changed", "The error is found by the user"],
      "Mark scheme point: if the check digits do not match, an error has occurred. 0478/12, November 2024, Question 5(a).", EX_CD2, W_CD2)
  );

  var W_CD3 = "One statement per mark: made from the digits, with an algorithm, put on the end, recalculated, compared.";
  var CD_DIS = ["The check digit is chosen at random", "It is added to the start of the bar code", "The check digit corrects the error", "It finds errors in data sent down a cable", "A parity bit is added to each digit", "If the check digits match, an error has occurred"];
  add(
    t3("cd-3a", "cd", Q_CD,
      ["A check digit is calculated from the bar code data", "It is calculated using an algorithm", "It is added to the end of the bar code"],
      CD_DIS,
      "Points 1 to 3 of the 0478/12, November 2024, Question 5(a) mark scheme, the same as Question 6 of your exam.", EX_CD2, W_CD3),
    t3("cd-3b", "cd", Q_CD,
      ["When the bar code is scanned, the check digit is recalculated", "It is recalculated using the same algorithm", "If the check digits do not match, an error has occurred"],
      ["The check digit is read and nothing else", "A new algorithm is used when it is scanned", "The check digit corrects the error", "The scanner sends the bar code back to be checked", "If the check digits match, an error has occurred"],
      "Points 4 to 6 of the 0478/12, November 2024, Question 5(a) mark scheme, the same as Question 6 of your exam.", EX_CD2, W_CD3),
    t3("cd-3c", "cd", "A shop scans bar codes at the till. Each bar code includes a check digit.\nExplain how the check digit is used to check for errors. [3]",
      ["A check digit is calculated from the bar code data", "When scanned, the check digit is recalculated", "If the check digits do not match, there is an error"],
      CD_DIS,
      "Points from the 0478/12, November 2024, Question 5(a) mark scheme.", EX_CD2, W_CD3),
    t3("cd-3d", "cd", "A library types in each book's ISBN. The last digit of an ISBN is a check digit.\nExplain how the check digit is used to check for errors in data entry. [3]",
      ["The check digit is calculated from the other digits using an algorithm", "When the ISBN is typed in, the check digit is recalculated", "If the check digits do not match, an error has occurred"],
      ["The check digit is chosen at random", "The check digit is the first digit of the ISBN", "The check digit corrects the error", "It finds errors in data sent down a cable", "If the check digits match, an error has occurred"],
      "Points from the 0478/12, November 2024, Question 5(a) mark scheme, for an ISBN.", EX_CD2, W_CD3)
  );

  // =====================================================================
  // 2.3 Symmetric and asymmetric encryption
  // =====================================================================
  var W_ENC = "Public: anyone can have it. Private: only its owner has it.";
  var EX_ENC1 = "What is data called before it is encrypted?\nStep 1: before encryption anyone can read it.\nStep 2: readable data is plain text.\nStep 3: so data before encryption is plain text.";
  var EX_ENC1B = "Hana wants anyone to be able to send her secret messages. Which of her keys does she give out?\nStep 1: a key she gives to everyone cannot be secret.\nStep 2: the key everyone may have is the public one.\nStep 3: so she gives out her public key and keeps the other.";
  add(
    t1("enc-1a", "enc", "Does encryption stop data being intercepted?", "No, it makes the data meaningless",
      /^\s*no\b/i,
      ["Yes, it stops all hackers", "Yes, the data cannot be taken", "Yes, it hides the data from the network", "Yes, the router blocks it", "Yes, if it uses a public key"],
      "Encryption does not stop interception. If the data is intercepted, it cannot be understood. 0478/12, March 2024, Question 7(a)(i).", EX_ENC1, W_ENC),
    t1("enc-1b", "enc", "In symmetric encryption, how many different keys are used?", "One key, the same for both",
      /^(?!.*\b(two|2|different)\b).*\b(one|1|same|single)\b/i,
      ["Two different keys", "A public key and a private key", "Three keys", "No key", "A new key for each byte"],
      "Symmetric encryption uses the same key to encrypt and decrypt. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC1B, W_ENC),
    t1("enc-1c", "enc", "In asymmetric encryption, which key encrypts the data?", "The receiver's public key",
      /^(?!.*\b(sender|private)).*public/i,
      ["The receiver's private key", "The sender's private key", "The sender's public key", "A symmetric key", "The check digit"],
      "The public key is used to encrypt the data. It is the receiver's, so only the receiver can decrypt. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC1, W_ENC),
    t1("enc-1d", "enc", "In asymmetric encryption, which key decrypts the data?", "The receiver's private key",
      /^(?!.*\b(sender|public)).*private/i,
      ["The receiver's public key", "The sender's private key", "The sender's public key", "The same key used to encrypt", "Any public key"],
      "The private key decrypts the data, and only the receiver knows it. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC1B, W_ENC),
    t1("enc-1e", "enc", "What is encrypted data called?", "Cipher text",
      /ciph\w*\s*-?\s*text|cypher\s*-?\s*text/i,
      ["Plain text", "Binary", "Hexadecimal", "Payload", "Public key"],
      "Data after encryption is cipher text. 0478/11, November 2022, Question 4(b)(ii).", EX_ENC1B, W_ENC)
  );

  var EX_ENC2 = "Give one reason a bank encrypts the data it sends. [1]\nStep 1: think of what happens if a hacker gets the data on the way.\nStep 2: encryption does not stop them getting it.\nStep 3: the mark is for what it does do: they cannot understand what they took.";
  var W_ENC2 = "Does the line say which key does which job, or only that keys are used?";
  var Q_ENC_DIFF = "Data can be encrypted using symmetric or asymmetric encryption.\nDescribe the differences between symmetric and asymmetric encryption. [4]";
  add(
    t2("enc-2a", "enc", "Data is encrypted before it is transmitted.\nState the purpose of encrypting the data. [1]" + WHICH, "If the data is intercepted, it cannot be understood",
      ["It stops the data being intercepted", "It stops hackers", "It keeps data safe", "It makes the data smaller", "It stops viruses"],
      "Mark scheme point: if the data is intercepted, it cannot be understood. Encryption never stops interception. 0478/12, March 2024, Question 7(a)(i).", EX_ENC2, W_ENC2),
    t2("enc-2b", "enc", Q_ENC_DIFF + WHICH, "Symmetric uses the same key to encrypt and decrypt",
      ["Symmetric uses two keys", "Symmetric is better", "Symmetric uses a public key", "Symmetric is the same as asymmetric", "Symmetric uses a key"],
      "Mark scheme points: symmetric has a shared key, used to encrypt and decrypt. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC2, W_ENC2),
    t2("enc-2c", "enc", Q_ENC_DIFF + WHICH, "Asymmetric uses a public key and a private key",
      ["Asymmetric uses one key", "Asymmetric uses two keys that are the same", "Asymmetric uses a private key only", "Asymmetric is safer", "Asymmetric uses no key"],
      "Mark scheme point: asymmetric has different keys, a public key and a private key. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC2, W_ENC2),
    t2("enc-2d", "enc", Q_ENC_DIFF + WHICH, "The public key encrypts and the private key decrypts",
      ["The private key encrypts and the public key decrypts", "The public key encrypts and decrypts", "The private key is sent to everyone", "Both keys are public", "The keys encrypt the data"],
      "Mark scheme point: public to encrypt the data and private to decrypt. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC2, W_ENC2),
    t2("enc-2e", "enc", Q_ENC_DIFF + WHICH, "Anyone can know the public key, but only the receiver knows the private key",
      ["Anyone can know the private key", "Only the receiver knows the public key", "Nobody knows the public key", "Both keys are shared", "The private key is sent with the data"],
      "Mark scheme point: anyone can know the public key but only those intended know the private key. 0478/12, March 2024, Question 7(a)(ii).", EX_ENC2, W_ENC2)
  );

  var EX_ENC3 = "Explain how Hana receives a secret message using asymmetric encryption. [3]\nStep 1: Hana gives out her public key; anyone may have it.\nStep 2: a friend uses that key to turn the message into cipher text.\nStep 3: only Hana's private key can turn it back into plain text, and she never sends that key.";
  var W_ENC3 = "For each key, say whose it is and what it does.";
  add(
    t3("enc-3a", "enc", Q_ENC_DIFF,
      ["Symmetric uses the same key to encrypt and decrypt", "Asymmetric uses a public key and a private key", "The public key encrypts the data and the private key decrypts it", "Anyone can know the public key, but only the receiver knows the private key"],
      ["Symmetric uses a public key and a private key", "Asymmetric uses the same key to encrypt and decrypt", "The private key encrypts the data and the public key decrypts it", "Anyone can know the private key", "Encryption stops the data being intercepted"],
      "Four mark scheme points of 0478/12, March 2024, Question 7(a)(ii).", EX_ENC3, W_ENC3),
    t3("enc-3b", "enc", "Ana sends a secret message to Ben using asymmetric encryption.\nExplain how the message is kept secret. [3]",
      ["Ben's public key is used to encrypt the plain text", "The plain text becomes cipher text", "Only Ben's private key can decrypt the cipher text"],
      ["Ben's private key is used to encrypt the plain text", "Ana's public key is used to encrypt the plain text", "The cipher text cannot be intercepted", "Ben's private key is sent with the data", "Anyone with Ben's public key can decrypt it"],
      "Public key to encrypt, private key to decrypt, plain text to cipher text. 0478/12, March 2024, Question 7(a)(ii) and the 2.3 encryption lessons.", EX_ENC3, W_ENC3),
    t3("enc-3c", "enc", "Data is encrypted before it is transmitted.\nExplain what encryption does to the data if it is intercepted. [2]",
      ["Encryption does not stop the data being intercepted", "It makes the data meaningless to anyone without the key"],
      ["Encryption stops the data being intercepted", "It makes the data smaller", "It finds errors in the data", "It deletes the data if a hacker takes it", "It sends the data a different way"],
      "From 0478/12, March 2024, Question 7(a)(i) and 0478/11, November 2022, Question 4(b)(i): the data will be meaningless if it is stolen.", EX_ENC3, W_ENC3),
    t3("enc-3d", "enc", "Complete the sentence about asymmetric encryption. [2]\nThe sender uses the receiver's ____ key to encrypt the plain text. Only the receiver's ____ key can decrypt the cipher text.",
      ["The first gap is public", "The second gap is private"],
      ["The first gap is private", "The second gap is public", "Both gaps are the same key", "The first gap is the sender's private key", "The second gap is the symmetric key"],
      "From the paragraph of Question 7(a) of your exam, based on 0478/11, June 2025, Question 6.", EX_ENC3, W_ENC3)
  );

  // =====================================================================
  // 2.3 Symmetric encryption
  // =====================================================================
  var W_SYM = "With one key that both sides need, how does the receiver get it?";
  var EX_SYM1 = "In asymmetric encryption, which key is never sent anywhere?\nStep 1: the public key can be given to anyone.\nStep 2: the private key stays with its owner.\nStep 3: so the private key never travels across the network.";
  var EX_SYM1B = "What is data called before it is encrypted?\nStep 1: before encryption anyone can read it.\nStep 2: readable data is plain text.";
  add(
    t1("sym-1a", "sym", "In symmetric encryption, what must the receiver be sent so that it can decrypt the cipher text?", "The key",
      /\bkey\b/i,
      ["The plain text", "A check digit", "A parity bit", "A negative acknowledgement", "The packet number"],
      "Mark scheme point: the key is sent to the receiver. 0478/11, November 2022, Question 4(b)(ii).", EX_SYM1, W_SYM),
    t1("sym-1b", "sym", "A hacker intercepts the symmetric key. What can the hacker now do?", "Decrypt the data",
      /decrypt|read|understand|unlock/i,
      ["Nothing, the key is safe", "Only delete the data", "Make the data meaningless", "Add a check digit", "Change the parity"],
      "If the key is intercepted, the data can be decrypted. That is the drawback of symmetric encryption.", EX_SYM1, W_SYM),
    t1("sym-1c", "sym", "Which is more secure when the key would have to be sent: symmetric or asymmetric?", "Asymmetric",
      /^\s*asym/i,
      ["Symmetric", "Both the same", "Neither", "Parity check", "Check digit"],
      "With asymmetric encryption the private key is never sent, so it cannot be intercepted. Symmetric is less secure.", EX_SYM1B, W_SYM),
    t1("sym-1d", "sym", "In symmetric encryption, which key decrypts the data?", "The same key that encrypted it",
      /\bsame\b|that\s+encrypt/i,
      ["A private key", "A public key", "A different key", "No key is needed", "The check digit"],
      "Data is encrypted and decrypted using the same key. 0478/11, November 2022, Question 4(b)(ii).", EX_SYM1, W_SYM),
    t1("sym-1e", "sym", "Give one drawback of symmetric encryption.", "The key has to be sent to the receiver",
      /key.*(sen[dt]|shar|give|given|transmit|intercept)|intercept|less\s+secure/i,
      ["It is too slow", "It uses two keys", "It makes data meaningless", "It cannot encrypt text", "It needs a check digit"],
      "The key has to be sent to the receiver, so it could be intercepted. Question 7(b) of your exam.", EX_SYM1, W_SYM)
  );

  var Q_SYM = "Data can be encrypted before it is transmitted.\nGive one drawback of using symmetric encryption. [1]";
  var EX_SYM2 = "Give one drawback of using a parity check. [1]\nStep 1: a drawback must be true of this method, not of every method.\nStep 2: if two bits change, the count can still match.\nStep 3: so an error may not be detected.";
  var W_SYM2 = "Is this line true of every kind of encryption? Then it is not a drawback of symmetric.";
  add(
    t2("sym-2a", "sym", Q_SYM + WHICH, "The key has to be sent to the receiver",
      ["It uses a key", "It is not safe", "It is slow", "It uses two keys", "The data can be intercepted", "The key is too short"],
      "Mark scheme point: the key has to be shared with or sent to the receiver. \"The data can be intercepted\" is true of all encryption. Question 7(b) of your exam.", EX_SYM2, W_SYM2),
    t2("sym-2b", "sym", Q_SYM + WHICH, "If the key is intercepted, the data can be decrypted",
      ["If the data is intercepted, it can be read", "If the data is intercepted, it is lost", "The key can be lost", "The hacker can see the data", "The key cannot be changed"],
      "Mark scheme point: if the key is intercepted, the data can be decrypted. Question 7(b) of your exam.", EX_SYM2, W_SYM2),
    t2("sym-2c", "sym", "The data is encrypted using symmetric encryption.\nDescribe how the data is encrypted using symmetric encryption. [4]" + WHICH, "The same key is used to encrypt and decrypt the data",
      ["Two keys are used", "A public key encrypts the data", "The data is made secure", "The private key decrypts the data", "The key is kept secret by the sender only"],
      "Mark scheme point: data is encrypted and decrypted using the same key. 0478/11, November 2022, Question 4(b)(ii).", EX_SYM2, W_SYM2),
    t2("sym-2d", "sym", "The data is encrypted using symmetric encryption.\nDescribe how the data is encrypted using symmetric encryption. [4]" + WHICH, "Plain text is encrypted into cipher text",
      ["Cipher text is encrypted into plain text", "The data is locked", "The data is hidden", "Plain text is turned into binary", "The data is compressed"],
      "Mark scheme point: plain text is encrypted into cipher text. 0478/12, June 2024, Question 2(c)(i).", EX_SYM2, W_SYM2)
  );

  var EX_SYM3 = "Describe how asymmetric encryption is used to send data. [4]\nStep 1: two different keys are used, a public key and a private key.\nStep 2: the receiver's public key turns plain text into cipher text.\nStep 3: only the receiver's private key turns it back.\nStep 4: the private key is never sent, so it cannot be intercepted.";
  var W_SYM3 = "Name the key, what it does, what the data is called before and after, and how the receiver gets the key.";
  add(
    t3("sym-3a", "sym", "Rebekah's data is encrypted using symmetric encryption.\nDescribe how the data is encrypted using symmetric encryption. [4]",
      ["The same key is used to encrypt and decrypt the data", "Data before encryption is called plain text", "Data after encryption is called cipher text", "The key is sent to the receiver"],
      ["A public key encrypts and a private key decrypts", "Two different keys are used", "Data before encryption is called cipher text", "The key is kept by the sender only", "Encryption stops the data being intercepted"],
      "Four mark scheme points of 0478/11, November 2022, Question 4(b)(ii).", EX_SYM3, W_SYM3),
    t3("sym-3b", "sym", "Explain how data is encrypted using symmetric encryption. [4]",
      ["The same key is used to encrypt and decrypt the data", "Plain text is encrypted into cipher text", "The data is encrypted using an algorithm", "The algorithm uses a key"],
      ["Cipher text is encrypted into plain text", "A public key and a private key are used", "The key is never sent to the receiver", "Encryption stops hackers taking the data", "The data is compressed first"],
      "Four mark scheme points of 0478/12, June 2024, Question 2(c)(i).", EX_SYM3, W_SYM3),
    t3("sym-3c", "sym", "Give two drawbacks of using symmetric encryption. [2]",
      ["The key has to be sent to the receiver", "If the key is intercepted, the data can be decrypted"],
      ["It uses two keys", "It is too slow", "It cannot encrypt images", "Encrypted data cannot be intercepted", "The public key must be kept secret"],
      "Both mark scheme points of Question 7(b) of your exam.", EX_SYM3, W_SYM3),
    t3("sym-3d", "sym", "Explain why asymmetric encryption is more secure than symmetric encryption. [2]",
      ["In symmetric encryption the key has to be sent to the receiver", "In asymmetric encryption the private key is never sent"],
      ["In symmetric encryption the private key is never sent", "In asymmetric encryption the private key is sent with the data", "Symmetric encryption uses two keys", "Asymmetric encryption stops data being intercepted", "In symmetric encryption no key is needed"],
      "The drawback of symmetric (the key is sent, so it can be intercepted) against asymmetric (the private key is never sent). From the 2.3 encryption lessons.", EX_SYM3, W_SYM3)
  );

  DrillData.register("y10-2-exam-fix", {
    title: "Year 10 Unit 2 Exam Follow-up",
    subtitle: "Cambridge IGCSE Computer Science 0478: practise the parts of the Data Transmission exam you lost marks on",
    ladder: TOPICS.map(function (t) { return { topic: t[1], label: t[2], tiers: [t[0] + "-1", t[0] + "-2", t[0] + "-3"] }; }),
    categories: [].concat.apply([], TOPICS.map(function (t) {
      return TIER_NAMES.map(function (n, i) { return [t[0] + "-" + (i + 1), t[2] + ": " + n]; });
    })),
    cards: cards
  });
})();
