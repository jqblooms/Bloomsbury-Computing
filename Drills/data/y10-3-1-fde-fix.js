// Fetch and Decode: Fix It (Year 10, 3.1 revision homework, James 2026-11-20)
// Loaded by Drills/index.html?drill=y10-3-1-fde-fix
// A revision ladder set as homework (the shell's TestBank.gs, `y10-3-1-hw-fde`, a follow-up with fixed topics). Five
// topics, each with three tiers: key facts (short recall), exam wording (pick the line that earns the mark, then type
// it) and full answer (tick every statement a full-mark answer needs). 3 right in a row passes a tier.
// Every question is a real 0478 Paper 1 question (or one gap or line of it) with its own mark scheme; `src` on each
// card names it (teacher only, never shown). None of them is a part of the Unit 3.1 exam (y10-unit3-1-exam) or of the
// 3.1.4 practice paper (y10-3-1-l4-paper).
(function () {
  var TOPICS = [
    ["pc", "The program counter and the MAR"],
    ["cir", "The MDR and the CIR"],
    ["dec", "How an instruction is decoded"],
    ["exe", "How an instruction is executed"],
    ["cyc", "The whole cycle in order"]
  ];
  var TIER_NAMES = ["key facts", "exam wording", "full answer"];

  var FULL = "\nPick every statement needed for full marks.";
  var WHICH = "\nWhich line earns a mark?";

  function t1(id, t, prompt, ans, kw, dis, note, ex, wk, src) {
    return { id: id, category: t + "-1", prompt: prompt, answers: [ans], keywords: [kw], distractors: dis, note: note, example: ex, working: [wk], src: src };
  }
  function t2(id, t, prompt, ans, dis, note, ex, wk, src) {
    return { id: id, category: t + "-2", pickThenType: true, prompt: prompt, answers: [ans], distractors: dis, note: note, example: ex, working: [wk], src: src };
  }
  function t3(id, t, prompt, answers, dis, note, ex, wk, src) {
    return { id: id, category: t + "-3", type: "multi", all: true, show: answers.length + Math.min(4, dis.length), prompt: prompt + FULL,
      answers: answers, distractors: dis, note: note, example: ex, working: [wk], src: src };
  }

  var cards = [];
  function add() { for (var i = 0; i < arguments.length; i++) cards.push(arguments[i]); }

  var PC_RE = /program\s*counter|\bPC\b/i;
  var MAR_RE = /memory\s*address\s*register|\bMAR\b/i;
  var MDR_RE = /memory\s*data\s*register|\bMDR\b|\bMBR\b/i;
  var CIR_RE = /current\s*instruction\s*register|\bCIR\b/i;

  // =====================================================================
  // The program counter and the MAR
  // =====================================================================
  var EX_PC1 = "A similar question: which register holds the result of a calculation?\n" +
    "Step 1: ask what is held. A result is data, not a location.\n" +
    "Step 2: find the register whose job is to hold results: the accumulator (ACC).\n" +
    "Step 3: now ask the same for your question. Is it a location (where something is) or the thing itself? Is it used first or later?";
  var W_PC1 = "An address says WHERE something is in RAM. The first register in the fetch stage only knows where the next instruction is.";
  add(
    t1("pc-1a", "pc", "Which register holds the address of the next instruction to be fetched?", "Program counter", PC_RE,
      ["Memory address register", "Memory data register", "Current instruction register", "Accumulator", "Control unit"],
      "The program counter (PC) stores the address of the next instruction to be fetched.", EX_PC1, W_PC1,
      "0478/12 November 2024 Q6, mark scheme"),
    t1("pc-1b", "pc", "A CPU carries out the fetch-decode-execute cycle.\nGive the name of the first register that is used in the fetch part of the cycle.", "Program counter", PC_RE,
      ["Memory address register", "Control unit", "Memory data register", "Current instruction register", "Accumulator"],
      "The first register is the program counter (PC). The control unit is not a register.", EX_PC1, W_PC1,
      "0478/13 November 2025 Q2(a)"),
    t1("pc-1c", "pc", "The program counter holds the address of the next instruction.\nWhich register is this address sent to next?", "Memory address register", MAR_RE,
      ["Memory data register", "Current instruction register", "Accumulator", "Program register", "Control unit"],
      "The address goes from the PC to the memory address register (MAR).", EX_PC1, W_PC1,
      "0478/12 June 2024 Q5(a), second gap"),
    t1("pc-1d", "pc", "Does the MAR store an address or an instruction?", "An address", /address/i,
      ["An instruction", "The result of a calculation", "A program", "A signal", "A list of commands"],
      "The MAR stores addresses, not instructions.", EX_PC1, W_PC1,
      "0478/12 March 2024 Q2(a), mark scheme for statement B"),
    t1("pc-1e", "pc", "In the fetch stage, which is used first: the PC or the MAR?", "The PC", PC_RE,
      ["The MAR", "Both at the same time", "The MDR", "The CIR", "The ALU"],
      "The PC is used first. It holds the address, then the address is copied to the MAR.", EX_PC1, W_PC1,
      "0478/12 June 2024 Q5(a), order of the paragraph")
  );

  var Q_PCROLE = "The fetch-execute cycle uses registers and buses.\nDescribe the role of the program counter. [2]";
  var Q_MARROLE = "The CPU contains a memory address register (MAR).\nDescribe the role of the MAR in the fetch-decode-execute cycle. [2]";
  var Q_STATB = "A student wrote this statement about a register in the fetch-decode-execute cycle. It is not correct:\nMAR stores the instructions of the program that is running.\nSuggest a corrected statement. [1]";
  var Q_STATC = "A student wrote this statement about a register in the fetch-decode-execute cycle. It is not correct:\nMDR stores the data passed to it from the PC.\nSuggest a corrected statement. [1]";
  var Q_PARA1 = "Complete the paragraph about fetching an instruction into the CPU.\nThe program counter contains the ________ of the next instruction to be processed; this is then sent to the ________ using the address bus. [2]";
  var EX_PC2 = "A similar question: describe the role of the accumulator. [2]\n" +
    "Step 1: say what it holds: a result.\n" +
    "Step 2: say a result of what: of a calculation.\n" +
    "Step 3: lines like \"it is important\" or \"it is a register\" earn nothing. Name what is held and why.";
  var W_PC2 = "Check two things in each line: is the thing held a location or the instruction itself, and are the registers in the right order?";
  add(
    t2("pc-2a", "pc", Q_PCROLE + WHICH, "It holds the address of the next instruction",
      ["It holds the next instruction", "It counts the programs", "It stores the data from RAM", "It decodes the instruction", "It holds the result of a calculation"],
      "Mark scheme: holds the address of the next instruction. It holds where the instruction is, not the instruction.", EX_PC2, W_PC2,
      "0478/12 March 2021 Q8(b)(i)"),
    t2("pc-2b", "pc", Q_MARROLE + WHICH, "It stores the address of the next instruction or data to be fetched",
      ["It stores the instruction that has been fetched", "It decodes the address", "It holds the result of a calculation", "It stores the data from RAM", "It counts the instructions"],
      "Mark scheme: stores addresses of the next instruction or data to be fetched.", EX_PC2, W_PC2,
      "0478/12 November 2023 Q3(b)"),
    t2("pc-2c", "pc", Q_STATB + WHICH, "MAR stores addresses, not instructions",
      ["MAR stores data, not instructions", "MAR stores the results of calculations", "MAR decodes the instructions", "PC stores the instructions of the program", "MAR stores the instructions of the next program"],
      "Mark scheme: MAR stores addresses and not instructions.", EX_PC2, W_PC2,
      "0478/12 March 2024 Q2(a), statement B"),
    t2("pc-2d", "pc", Q_STATC + WHICH, "The data comes from the address in the MAR, not the PC",
      ["The data comes from the CIR, not the PC", "The MDR stores addresses passed from the PC", "The data comes from the ALU, not the PC", "The MDR sends data to the PC", "The data comes from the accumulator, not the PC"],
      "Mark scheme: the data is from the address in the MAR (or from the bus), not from the PC.", EX_PC2, W_PC2,
      "0478/12 March 2024 Q2(a), statement C"),
    t2("pc-2e", "pc", Q_PARA1 + WHICH, "The program counter contains the address of the next instruction; this is sent to the MAR",
      ["The program counter contains the next instruction; this is sent to the MAR", "The MAR contains the address of the next instruction; this is sent to the program counter",
        "The program counter contains the address of the next instruction; this is sent to the MDR", "The program counter contains the data; this is sent to the CIR", "The MAR contains the next instruction; this is sent to the PC"],
      "Mark scheme: address, then memory address register (MAR).", EX_PC2, W_PC2,
      "0478/12 June 2024 Q5(a), first two gaps")
  );

  var EX_PC3 = "A similar question: describe the role of the accumulator. [2]\n" +
    "Step 1: one mark for what it stores: a result.\n" +
    "Step 2: one mark for more detail: of each calculation the ALU does.\n" +
    "Step 3: leave out lines about other registers, and lines that only say it is important.";
  var W_PC3 = "Each mark is one idea. Tick the line that says what is held, and the line that says which one (the next instruction). Leave out anything about decoding or results.";
  add(
    t3("pc-3a", "pc", Q_PCROLE, ["It holds an address", "It is the address of the next instruction to be fetched"],
      ["It holds the next instruction itself", "It decodes the instruction", "It stores the result of a calculation", "It is the brain of the CPU", "It sends the data to the ALU"],
      "Two mark scheme points: holds the address ... of the next instruction.", EX_PC3, W_PC3,
      "0478/12 March 2021 Q8(b)(i)"),
    t3("pc-3b", "pc", Q_MARROLE, ["It stores an address", "It is the address of the next instruction or data to be fetched"],
      ["It stores the instruction that was fetched", "It decodes the instruction", "It stores the result of a calculation", "It counts the instructions", "It sends signals to the ALU"],
      "Two mark scheme points: stores addresses ... of the next instruction or data to be fetched (or where data is to be written to).", EX_PC3, W_PC3,
      "0478/12 November 2023 Q3(b)"),
    t3("pc-3c", "pc", "The program counter contains the ________ of the next instruction to be processed; this is then sent to the ________ using the address bus.\nPick the word or name for each gap. [2]",
      ["address", "memory address register (MAR)"],
      ["data", "memory data register (MDR)", "current instruction register (CIR)", "control unit (CU)", "denary"],
      "Mark scheme: address, memory address register (MAR).", EX_PC3, W_PC3,
      "0478/12 June 2024 Q5(a), first two gaps"),
    t3("pc-3d", "pc", "Five statements about registers in the fetch-decode-execute cycle:\nA  PC stores the address of the next instruction to be accessed\nB  MAR stores the instructions of the program that is running\nC  MDR stores the data passed to it from the PC\nD  ACC stores the result of each calculation\nE  CIR stores the instruction currently being executed\nTwo are not correct. Pick each one with its correction. [4]",
      ["B: MAR stores addresses, not instructions", "C: the data comes from the address in the MAR, not from the PC"],
      ["A: PC stores the next instruction, not its address", "D: ACC stores addresses, not results", "E: CIR stores data, not instructions", "B: MAR stores data, not instructions"],
      "Mark scheme: B (MAR stores addresses and not instructions) and C (data is from the address in the MAR, not the PC).", EX_PC3, W_PC3,
      "0478/12 March 2024 Q2(a)")
  );

  // =====================================================================
  // The MDR and the CIR
  // =====================================================================
  var EX_CIR1 = "A similar question: which bus carries signals from the control unit to other parts?\n" +
    "Step 1: a signal tells a part what to do, so it is a control signal.\n" +
    "Step 2: control signals travel on the control bus.\n" +
    "Step 3: for your question, follow the instruction: where is it now, and where does it go next? Use the full, exact name.";
  var W_CIR1 = "Follow the instruction: from RAM it lands in a register in the fetch stage, then it moves to a register built into the control unit.";
  add(
    t1("cir-1a", "cir", "Which register stores the instruction while it is being decoded?", "Current instruction register", CIR_RE,
      ["Memory instruction register", "Next instruction register", "Program register", "Memory data register", "Instruction counter"],
      "The current instruction register (CIR) stores an instruction when it is being decoded.", EX_CIR1, W_CIR1,
      "0478/12 November 2024 Q6, mark scheme"),
    t1("cir-1b", "cir", "What does CIR stand for?", "Current instruction register", /current\s*instruction\s*register/i,
      ["Memory instruction register", "Control instruction register", "Central instruction register", "Current input register", "Computer instruction register"],
      "CIR is the current instruction register. It is not called the memory instruction register.", EX_CIR1, W_CIR1,
      "0478/11 June 2025 Q5(a), the CIR row"),
    t1("cir-1c", "cir", "The CPU has a control unit (CU).\nGive the name of the register that is part of the CU.", "Current instruction register", CIR_RE,
      ["Memory instruction register", "Program counter", "Memory address register", "Accumulator", "Memory data register"],
      "The current instruction register (CIR) is part of the control unit.", EX_CIR1, W_CIR1,
      "0478/13 November 2025 Q2(b)(ii)"),
    t1("cir-1d", "cir", "The instruction is retrieved from RAM. Which register is it stored in first?", "Memory data register", MDR_RE,
      ["Memory address register", "Current instruction register", "Program counter", "Accumulator", "Memory instruction register"],
      "It goes into the memory data register (MDR) first.", EX_CIR1, W_CIR1,
      "0478/12 June 2024 Q5(a), fourth gap"),
    t1("cir-1e", "cir", "The instruction is in the MDR. Which register is it sent to next?", "The CIR", CIR_RE,
      ["The MAR", "The PC", "The accumulator", "Back to RAM", "The memory instruction register"],
      "It is sent from the MDR to the current instruction register (CIR).", EX_CIR1, W_CIR1,
      "0478/11 November 2024 Q5(b), mark scheme"),
    t1("cir-1f", "cir", "Which bus carries the instruction from the MDR to the CIR?", "Data bus", /data\s*bus/i,
      ["Address bus", "Control bus", "Instruction bus", "USB", "Memory bus"],
      "The instruction travels on the data bus.", EX_CIR1, W_CIR1,
      "0478/11 November 2024 Q5(b), mark scheme")
  );

  var Q_MDRROLE = "The CPU contains registers including the memory data register (MDR).\nDescribe the role of the MDR in the fetch-decode-execute cycle. [2]";
  var Q_CIRDEF = "Complete the definition.\nCurrent instruction register (CIR): ________ [1]";
  var Q_CUREG = "The CPU has a control unit (CU).\nGive the name of the register that is part of the CU. [1]";
  var Q_DEC = "A central processing unit (CPU) performs the fetch-decode-execute (FDE) cycle.\nDescribe what happens at the decode stage of the cycle. [3]";
  var EX_CIR2 = "A similar question: describe the role of the program counter. [2]\n" +
    "Step 1: say what it holds: an address.\n" +
    "Step 2: say which address: the next instruction's.\n" +
    "Step 3: check the line names the right register and the right thing (an address, data, an instruction).";
  var W_CIR2 = "Is the register named exactly? Is the instruction moving the right way through the fetch and decode stages?";
  add(
    t2("cir-2a", "cir", Q_MDRROLE + WHICH, "It stores the data or instruction that has been fetched from memory",
      ["It stores the address of the next instruction", "It decodes the instruction", "It stores the result of a calculation", "It sends signals to the ALU", "It counts the instructions"],
      "Mark scheme: stores data ... that has been fetched from memory (or is to be written to memory).", EX_CIR2, W_CIR2,
      "0478/11 November 2023 Q1(e)(i)"),
    t2("cir-2b", "cir", Q_CIRDEF + WHICH, "It stores the instruction that is being decoded or executed",
      ["It stores the address of the next instruction", "It is a list of all the commands the CPU can process", "It counts the instructions", "It stores the result of a calculation", "It stores frequently used instructions"],
      "Mark scheme: stores the instruction that is being decoded or executed.", EX_CIR2, W_CIR2,
      "0478/11 June 2025 Q5(a), the CIR row"),
    t2("cir-2c", "cir", Q_CUREG + WHICH, "Current instruction register",
      ["Memory instruction register", "Next instruction register", "Control register", "Memory data register", "Program register"],
      "Mark scheme: current instruction register (CIR).", EX_CIR2, W_CIR2,
      "0478/13 November 2025 Q2(b)(ii)"),
    t2("cir-2d", "cir", Q_DEC + WHICH, "The instruction is sent from the MDR to the CIR",
      ["The instruction is sent from the CIR to the MDR", "The instruction is sent from the PC to the CIR", "The MDR stores the data that was fetched", "The instruction is sent from the MAR to the MDR", "The instruction is stored in RAM"],
      "Mark scheme: the instruction is sent from the MDR to the CIR.", EX_CIR2, W_CIR2,
      "0478/11 November 2024 Q5(b)"),
    t2("cir-2e", "cir", Q_DEC + WHICH, "It is sent from the MDR to the CIR using the data bus",
      ["It is sent from the MDR to the CIR using the address bus", "It is sent from the MDR to the CIR using the control bus", "It is stored on the data bus", "It is sent from the MAR to the CIR using the data bus", "It is sent from the CIR to RAM using the data bus"],
      "Mark scheme: ... using the data bus.", EX_CIR2, W_CIR2,
      "0478/11 November 2024 Q5(b)")
  );

  var EX_CIR3 = "A similar question: describe the role of the program counter. [2]\n" +
    "Step 1: one mark for what it holds: an address.\n" +
    "Step 2: one mark for which one: the next instruction to be fetched.\n" +
    "Step 3: leave out lines that are true of a different register.";
  var W_CIR3 = "Tick only the lines that give the right register the right job. Watch for made-up register names.";
  add(
    t3("cir-3a", "cir", Q_MDRROLE, ["It stores data or instructions", "They have been fetched from memory, or are to be written to memory"],
      ["It stores the address of the next instruction", "It decodes the instruction", "It sends signals to the ALU", "It stores the result of a calculation", "It is part of the control unit"],
      "Two mark scheme points: stores data ... that has been fetched or is to be written to memory.", EX_CIR3, W_CIR3,
      "0478/11 November 2023 Q1(e)(i)"),
    t3("cir-3b", "cir", "Once the address is received, the instruction stored at the location is sent to the ________, using the ________ bus. The instruction is then sent to the ________ that is built into the ________.\nPick the word or name for each gap. [4]",
      ["memory data register (MDR)", "data", "current instruction register (CIR)", "control unit (CU)"],
      ["memory address register (MAR)", "address", "arithmetic logic unit (ALU)", "random access memory (RAM)", "memory instruction register"],
      "Mark scheme: MDR, data, CIR, CU.", EX_CIR3, W_CIR3,
      "0478/12 June 2024 Q5(a), last four gaps"),
    t3("cir-3c", "cir", "A computer has a CPU that carries out the FDE cycle.\n(a) Give the name of the first register that is used in the fetch part of the cycle.\n(b) Give the name of the register that is part of the CU. [2]",
      ["(a) Program counter (PC)", "(b) Current instruction register (CIR)"],
      ["(a) Memory address register (MAR)", "(b) Memory instruction register", "(a) Control unit (CU)", "(b) Accumulator (ACC)", "(b) Next instruction register"],
      "Mark scheme: (a) program counter, (b) current instruction register.", EX_CIR3, W_CIR3,
      "0478/13 November 2025 Q2(a) and (b)(ii)")
  );

  // =====================================================================
  // How an instruction is decoded
  // =====================================================================
  var EX_DEC1 = "A similar question: which part of the CPU carries out calculations?\n" +
    "Step 1: a calculation is arithmetic.\n" +
    "Step 2: the part named after arithmetic and logic does it: the ALU.\n" +
    "Step 3: for your question, ask: is it asking for a PART of the CPU, or for a LIST that part looks things up in?";
  var W_DEC1 = "A part does the decoding. A list of all the commands the CPU knows is what it uses to decode.";
  add(
    t1("dec-1a", "dec", "Identify the component in the CPU that is responsible for decoding an instruction.", "Control unit", /control\s*unit|\bCU\b/i,
      ["Arithmetic logic unit", "Memory data register", "Accumulator", "Program counter", "Instruction set"],
      "The control unit (CU) decodes the instruction.", EX_DEC1, W_DEC1,
      "0478/11 June 2025 Q5(b)"),
    t1("dec-1b", "dec", "The control unit decodes an instruction. What does it use to decode it?", "An instruction set", /instruction\s*set/i,
      ["The control unit", "A character set", "A decoding set", "A cipher", "The program counter"],
      "The CU decodes the instruction using an instruction set.", EX_DEC1, W_DEC1,
      "0478/12 June 2024 Q5(b), the stem"),
    t1("dec-1c", "dec", "The CPU has a list of all the machine code commands it can process.\nState the name of this list of commands.", "Instruction set", /instruction\s*set/i,
      ["Control unit", "Character set", "Decoding set", "Program register", "Instruction counter"],
      "Mark scheme: instruction set.", EX_DEC1, W_DEC1,
      "0478/12 November 2023 Q3(c)"),
    t1("dec-1d", "dec", "When an instruction is decoded, it is separated into two parts. What are they?", "Opcode and operand", /(?=[\s\S]*op\s*code)(?=[\s\S]*operand)/i,
      ["Address and data", "Header and payload", "Input and output", "Fetch and execute", "Bits and bytes"],
      "The instruction is separated into opcode and operand.", EX_DEC1, W_DEC1,
      "0478/11 November 2024 Q5(b), mark scheme"),
    t1("dec-1e", "dec", "Is an instruction set a part of the CPU, or a list?", "A list of commands", /\blist/i,
      ["A part of the CPU", "A register", "A bus", "A type of memory", "The control unit"],
      "An instruction set is a list of the machine code commands the CPU can process. The control unit is the part that uses it.", EX_DEC1, W_DEC1,
      "0478/12 June 2024 Q5(b), mark scheme")
  );

  var Q_ISDEF = "The CPU uses an instruction set to decode the instruction.\nState what is meant by an instruction set. [1]";
  var Q_CUROLE = "A computer has a central processing unit (CPU) that carries out the fetch-decode-execute (FDE) cycle. The CPU has a control unit (CU).\nDescribe the role of the CU in the CPU. [3]";
  var EX_DEC2 = "A similar question: describe what happens in the execute stage. [2]\n" +
    "Step 1: name the part that does it: the arithmetic logic unit carries out the calculation.\n" +
    "Step 2: name where the result goes: the accumulator.\n" +
    "Step 3: \"it is done\" or \"the computer understands it\" earns nothing. Name the part and what it uses.";
  var W_DEC2 = "Does the line name the part that decodes, and what that part uses? \"It is understood\" earns nothing.";
  add(
    t2("dec-2a", "dec", Q_DEC + WHICH, "The control unit decodes the instruction",
      ["The ALU decodes the instruction", "The MDR decodes the instruction", "The instruction is understood", "The CPU looks at the instruction", "The control unit stores the instruction"],
      "Mark scheme: the control unit decodes the instruction.", EX_DEC2, W_DEC2,
      "0478/11 November 2024 Q5(b)"),
    t2("dec-2b", "dec", Q_DEC + WHICH, "The CU uses an instruction set to decode it",
      ["The CU uses a character set to decode it", "The CU uses the ALU to decode it", "The CU uses a decoding set to decode it", "The CU uses the cache to decode it", "The CU uses the program counter to decode it"],
      "Mark scheme: ... using an instruction set.", EX_DEC2, W_DEC2,
      "0478/11 November 2024 Q5(b)"),
    t2("dec-2c", "dec", Q_DEC + WHICH, "The instruction is separated into opcode and operand",
      ["The instruction is separated into address and data", "The instruction is separated into bits", "The instruction is separated into fetch and execute", "The instruction is turned into denary", "The instruction is separated into packets"],
      "Mark scheme: the instruction is separated into opcode and operand.", EX_DEC2, W_DEC2,
      "0478/11 November 2024 Q5(b)"),
    t2("dec-2d", "dec", Q_ISDEF + WHICH, "A list of the machine code commands that can be processed by the CPU",
      ["The part of the CPU that decodes instructions", "The instructions in one program", "A list of characters and their binary codes", "The register that stores the instruction", "A set of rules for sending data"],
      "Mark scheme: a list of (machine code) commands that can be processed by the CPU.", EX_DEC2, W_DEC2,
      "0478/12 June 2024 Q5(b)"),
    t2("dec-2e", "dec", Q_CUROLE + WHICH, "It decodes an instruction using an instruction set",
      ["It decodes an instruction using the ALU", "It carries out the calculations", "It stores the instruction", "It is the brain of the computer", "It stores the address of the next instruction"],
      "Mark scheme: it decodes an instruction ... using an instruction set.", EX_DEC2, W_DEC2,
      "0478/13 November 2025 Q2(b)(i)")
  );

  var EX_DEC3 = "A similar question: describe what happens in the execute stage. [2]\n" +
    "Step 1: one mark for the part that carries it out: the arithmetic logic unit.\n" +
    "Step 2: one mark for where the result is stored: the accumulator.\n" +
    "Step 3: leave out lines about storing the instruction in RAM, or about a different stage.";
  var W_DEC3 = "Each mark is one step of decoding: where the instruction moves to, which part decodes it, and what that part uses. Leave out lines that only say where something is stored.";
  add(
    t3("dec-3a", "dec", Q_DEC, ["The instruction is sent from the MDR to the CIR", "The control unit decodes the instruction", "It uses an instruction set to decode it"],
      ["The ALU decodes the instruction", "The MAR stores the address of the next instruction", "The MDR stores data that has been fetched from memory", "The instruction is sent from the PC to the CIR", "It uses a character set to decode it"],
      "Three mark scheme points: MDR to CIR; the CU decodes the instruction; using an instruction set.", EX_DEC3, W_DEC3,
      "0478/11 November 2024 Q5(b)"),
    t3("dec-3b", "dec", Q_DEC, ["The CIR receives the instruction from the MDR", "It is sent using the data bus", "The instruction is separated into opcode and operand"],
      ["It is sent using the address bus", "The instruction is separated into address and data", "The MDR stores data that has been fetched", "The ALU stores the instruction", "The PC sends the instruction to the CIR"],
      "Three mark scheme points: the CIR receives the instruction from the MDR; using the data bus; separated into opcode and operand.", EX_DEC3, W_DEC3,
      "0478/11 November 2024 Q5(b)"),
    t3("dec-3c", "dec", Q_CUROLE, ["It sends control signals to other components", "The signals manage the flow of data through the CPU", "It decodes an instruction using an instruction set"],
      ["It carries out the calculations", "It stores the address of the next instruction", "It is the brain of the computer", "It stores data fetched from RAM", "It stores the result of a calculation"],
      "Three mark scheme points: sends control signals; to manage the flow of data through the CPU; decodes an instruction using an instruction set.", EX_DEC3, W_DEC3,
      "0478/13 November 2025 Q2(b)(i)")
  );

  // =====================================================================
  // How an instruction is executed
  // =====================================================================
  var EX_EXE1 = "A similar question: which register holds the address of the next instruction?\n" +
    "Step 1: the thing held is an address.\n" +
    "Step 2: the register that keeps track of the next instruction is the program counter.\n" +
    "Step 3: for your question, ask which job is meant: sending signals, calculating, or holding a result. Then name the part with that job.";
  var W_EXE1 = "Think of three jobs: sending signals, calculating, holding a result. Each job has its own part. Which job does the question ask about?";
  add(
    t1("exe-1a", "exe", "A component in the CPU sends signals to manage the fetch-decode-execute cycle.\nState the name of this component.", "Control unit", /control\s*unit|\bCU\b/i,
      ["Arithmetic logic unit", "Clock", "Program counter", "Accumulator", "Cache"],
      "Mark scheme: control unit.", EX_EXE1, W_EXE1,
      "0478/11 November 2023 Q1(c)"),
    t1("exe-1b", "exe", "Which part of the CPU performs the calculations and logic operations needed to execute an instruction?", "Arithmetic logic unit", /arithmetic\s*(and\s*)?logic(al)?\s*unit|\bALU\b/i,
      ["Control unit", "Memory data register", "Program counter", "Current instruction register", "Cache"],
      "The arithmetic logic unit (ALU) performs the calculations and logic operations.", EX_EXE1, W_EXE1,
      "0478/13 November 2022 Q7, mark scheme"),
    t1("exe-1c", "exe", "Which register stores the result of interim calculations?", "Accumulator", /accumulator|\bACC\b/i,
      ["Program counter", "Memory address register", "Current instruction register", "Cache", "Control unit"],
      "The accumulator (ACC) stores the result of interim calculations.", EX_EXE1, W_EXE1,
      "0478/11 June 2025 Q5(a), the accumulator row"),
    t1("exe-1d", "exe", "The control unit sends control signals to other components. Which bus carries them?", "Control bus", /control\s*bus/i,
      ["Data bus", "Address bus", "Signal bus", "USB", "Instruction bus"],
      "The control signals are sent using the control bus.", EX_EXE1, W_EXE1,
      "0478/13 November 2025 Q2(b)(i), mark scheme"),
    t1("exe-1e", "exe", "Give one register in the CPU that is used in the execute stage of the cycle.", "Accumulator", /accumulator|\bACC\b|memory\s*address\s*register|\bMAR\b|memory\s*data\s*register|\bMDR\b/i,
      ["Program counter", "Control unit", "Cache", "Clock", "Instruction set"],
      "Mark scheme: accumulator (MAR or MDR are also accepted).", EX_EXE1, W_EXE1,
      "0478/11 November 2024 Q5(c)")
  );

  var Q_EXEPARA = "The paragraph explains how an instruction is processed by the CPU.\nThe ________ will then perform any ________ and logic operations that are required to ________ the instruction.";
  var Q_ACCDEF = "Complete the definition.\nAccumulator: ________ [1]";
  var EX_EXE2 = "A similar question: describe the role of the MAR. [2]\n" +
    "Step 1: say what it stores: an address.\n" +
    "Step 2: say which address: of the next instruction or data to be fetched.\n" +
    "Step 3: \"it controls everything\" earns nothing. Say what is sent or stored, and where.";
  var W_EXE2 = "Match the job to the part: which part sends signals, which part calculates, which register holds results? A line that gives a job to the wrong part earns nothing.";
  add(
    t2("exe-2a", "exe", Q_CUROLE + WHICH, "It sends control signals to other components",
      ["It sends the instruction to RAM", "It controls everything", "It sends data to the printer", "It is in charge of the computer", "It sends addresses on the data bus"],
      "Mark scheme: it sends control signals to other components.", EX_EXE2, W_EXE2,
      "0478/13 November 2025 Q2(b)(i)"),
    t2("exe-2b", "exe", Q_CUROLE + WHICH, "It sends signals to manage the flow of data through the CPU",
      ["It sends signals to make the computer faster", "It sends signals to store the data", "It sends signals to switch the computer on", "It sends signals on the data bus", "It sends signals to the user"],
      "Mark scheme: ... to manage the flow of data through the CPU.", EX_EXE2, W_EXE2,
      "0478/13 November 2025 Q2(b)(i)"),
    t2("exe-2c", "exe", Q_EXEPARA + WHICH, "The ALU will then perform any calculations and logic operations that are required to execute the instruction",
      ["The CU will then perform any calculations and logic operations that are required to execute the instruction", "The MDR will then perform any calculations and logic operations that are required to execute the instruction",
        "The ALU will then perform any calculations and logic operations that are required to decode the instruction", "The accumulator will then perform any calculations and logic operations that are required to execute the instruction",
        "The ALU will then perform any protocols and logic operations that are required to fetch the instruction"],
      "Mark scheme: ALU, calculations, execute.", EX_EXE2, W_EXE2,
      "0478/13 November 2022 Q7, last three gaps"),
    t2("exe-2d", "exe", Q_ACCDEF + WHICH, "It stores the result of interim calculations",
      ["It stores the address of the next instruction", "It performs the calculations", "It stores the instruction being decoded", "It counts the instructions", "It stores frequently used data"],
      "Mark scheme: stores the result of interim calculations.", EX_EXE2, W_EXE2,
      "0478/11 June 2025 Q5(a), the accumulator row")
  );

  var EX_EXE3 = "A similar question: describe the role of the MAR. [2]\n" +
    "Step 1: one mark for what it stores: an address.\n" +
    "Step 2: one mark for which one: the next instruction or data to be fetched.\n" +
    "Step 3: leave out lines that give a job to the wrong part.";
  var W_EXE3 = "Each description must match its part. Leave out lines that give a part a job that belongs to a different part.";
  add(
    t3("exe-3a", "exe", Q_EXEPARA + "\nPick the word or name for each gap. [3]", ["Arithmetic Logic Unit (ALU)", "calculations", "execute"],
      ["Memory Data Register (MDR)", "decoded", "fetched", "protocol", "Program Counter (PC)"],
      "Mark scheme: ALU, calculations, execute.", EX_EXE3, W_EXE3,
      "0478/13 November 2022 Q7, last three gaps"),
    t3("exe-3b", "exe", "Complete the descriptions of these CPU components. [2]\nControl unit: ________\nAccumulator: ________",
      ["Control unit: sends signals to manage the flow of data through the CPU", "Accumulator: stores the interim result for a calculation"],
      ["Control unit: performs the calculations", "Accumulator: stores the address of the next instruction", "Accumulator: decodes the instruction", "Control unit: stores the result of a calculation", "Accumulator: sends signals to the ALU"],
      "Mark scheme: the CU sends signals to manage the flow of data through the CPU; the accumulator stores the interim result for a calculation.", EX_EXE3, W_EXE3,
      "0478/12 November 2024 Q6 (adapted: names given, descriptions asked)"),
    t3("exe-3c", "exe", "Complete the definitions. [2]\nCurrent instruction register (CIR): ________\nAccumulator: ________",
      ["CIR: stores the instruction that is being decoded or executed", "Accumulator: stores the result of interim calculations"],
      ["CIR: stores the address of the next instruction", "Accumulator: performs the calculations", "CIR: decodes the instruction", "Accumulator: stores frequently used data", "CIR: stores the data from RAM"],
      "Mark scheme: the CIR stores the instruction being decoded or executed; the accumulator stores the result of interim calculations.", EX_EXE3, W_EXE3,
      "0478/11 June 2025 Q5(a), the CIR and accumulator rows")
  );

  // =====================================================================
  // The whole cycle in order (the paragraph wording)
  // =====================================================================
  var EX_CYC1 = "A similar question: \"The result of each calculation is stored in the ________.\"\n" +
    "Step 1: read the words around the gap: a result, of a calculation.\n" +
    "Step 2: the register that stores results is the accumulator.\n" +
    "Step 3: for your gap, read the words around it the same way: an address, an instruction, \"built into the control unit\", a bus.";
  var W_CYC1 = "Follow the instruction's journey: first a register knows WHERE it is, that location goes to memory, the instruction comes back into the CPU, then it moves into the control unit.";
  add(
    t1("cyc-1a", "cyc", "Put these registers in the order an instruction uses them, from first to last:\nCIR, PC, MDR, MAR", "PC, MAR, MDR, CIR",
      /(\bPC\b|program\s*counter)[\s\S]*?(\bMAR\b|memory\s*address\s*register)[\s\S]*?(\bMDR\b|memory\s*data\s*register)[\s\S]*?(\bCIR\b|current\s*instruction\s*register)/i,
      ["MAR, PC, MDR, CIR", "PC, MDR, MAR, CIR", "MAR, MDR, PC, CIR", "CIR, MDR, MAR, PC", "MDR, MAR, PC, CIR"],
      "PC, then MAR, then MDR, then CIR.", EX_CYC1, W_CYC1,
      "0478/12 June 2024 Q5(a), the order of the paragraph"),
    t1("cyc-1b", "cyc", "The program counter contains the address of the next instruction; this is then sent to the MAR using the ________ bus.", "Address", /address/i,
      ["Data", "Control", "Instruction", "Memory", "Signal"],
      "Mark scheme: the address is sent using the address bus.", EX_CYC1, W_CYC1,
      "0478/12 June 2024 Q5(a), the stem"),
    t1("cyc-1c", "cyc", "The instruction is then sent to the ________ that is built into the control unit.", "Current instruction register", CIR_RE,
      ["Memory instruction register", "Memory data register", "Next instruction register", "Program register", "Arithmetic logic unit"],
      "Mark scheme: current instruction register (CIR).", EX_CYC1, W_CYC1,
      "0478/12 June 2024 Q5(a), sixth gap"),
    t1("cyc-1d", "cyc", "Once the address is received, the instruction stored at the location is sent to the ________.", "Memory data register", MDR_RE,
      ["Memory address register", "Current instruction register", "Program counter", "Accumulator", "Memory instruction register"],
      "Mark scheme: memory data register (MDR).", EX_CYC1, W_CYC1,
      "0478/12 June 2024 Q5(a), fourth gap")
  );

  var Q_P7A = "The paragraph explains how an instruction is processed by the CPU.\nAn instruction is ________ from RAM into the CPU, where it is temporarily stored in the ________.";
  var Q_P7B = "The paragraph explains how an instruction is processed by the CPU.\nThe instruction is then sent along the ________ to the Control Unit (CU) to be ________.";
  var Q_P5 = "Complete the paragraph about fetching an instruction into the CPU.\nThe program counter contains the address of the next instruction to be processed; this is then sent to the memory address register (MAR) using the address bus. The address is then sent to the ________.";
  var Q_P5B = "Complete the paragraph about fetching an instruction into the CPU.\nThe instruction is then sent to the ________ that is built into the ________.";
  var EX_CYC2 = "A similar paragraph: \"The result of each calculation is stored in the ________.\"\n" +
    "Step 1: find the key words: result, calculation.\n" +
    "Step 2: the line that earns the mark names the accumulator, with its exact name.\n" +
    "Step 3: a line with a made-up register name, or the right name in the wrong place, earns nothing.";
  var W_CYC2 = "Read the whole line. One wrong word (a made-up register, the wrong bus, the wrong stage) and the line earns nothing.";
  add(
    t2("cyc-2a", "cyc", Q_P7A + WHICH, "An instruction is fetched from RAM into the CPU, where it is temporarily stored in the MDR",
      ["An instruction is fetched from RAM into the CPU, where it is temporarily stored in the MAR", "An instruction is decoded from RAM into the CPU, where it is temporarily stored in the MDR",
        "An instruction is fetched from RAM into the CPU, where it is temporarily stored in the PC", "An instruction is executed from RAM into the CPU, where it is temporarily stored in the MDR",
        "An instruction is fetched from RAM into the CPU, where it is temporarily stored in the CIR"],
      "Mark scheme: fetched, MDR.", EX_CYC2, W_CYC2,
      "0478/13 November 2022 Q7, first two gaps"),
    t2("cyc-2b", "cyc", Q_P7B + WHICH, "The instruction is then sent along the data bus to the Control Unit (CU) to be decoded",
      ["The instruction is then sent along the address bus to the Control Unit (CU) to be decoded", "The instruction is then sent along the data bus to the Control Unit (CU) to be fetched",
        "The instruction is then sent along the data bus to the ALU to be decoded", "The instruction is then sent along the control bus to the Control Unit (CU) to be stored",
        "The instruction is then sent along the address bus to the PC to be decoded"],
      "Mark scheme: data bus, decoded.", EX_CYC2, W_CYC2,
      "0478/13 November 2022 Q7, third and fourth gaps"),
    t2("cyc-2c", "cyc", Q_P5 + WHICH, "The address is then sent to the random access memory (RAM)",
      ["The address is then sent to the current instruction register (CIR)", "The address is then sent to the program counter", "The address is then sent to the arithmetic logic unit (ALU)",
        "The address is then sent to the read only memory (ROM)", "The address is then sent to the secondary storage"],
      "Mark scheme: random access memory (RAM).", EX_CYC2, W_CYC2,
      "0478/12 June 2024 Q5(a), third gap"),
    t2("cyc-2d", "cyc", Q_P5B + WHICH, "The instruction is then sent to the current instruction register (CIR) that is built into the control unit (CU)",
      ["The instruction is then sent to the memory instruction register that is built into the control unit (CU)", "The instruction is then sent to the current instruction register (CIR) that is built into the arithmetic logic unit (ALU)",
        "The instruction is then sent to the memory address register (MAR) that is built into the control unit (CU)", "The instruction is then sent to the next instruction register that is built into the control unit (CU)",
        "The instruction is then sent to the program register that is built into the random access memory (RAM)"],
      "Mark scheme: current instruction register (CIR), control unit (CU).", EX_CYC2, W_CYC2,
      "0478/12 June 2024 Q5(a), last two gaps")
  );

  var EX_CYC3 = "A similar paragraph: \"The ________ performs the calculation and the result is stored in the ________.\"\n" +
    "Step 1: the part that calculates is the arithmetic logic unit.\n" +
    "Step 2: the register that holds the result is the accumulator.\n" +
    "Step 3: pick one word for each gap, in the order the paragraph uses them.";
  var W_CYC3 = "Work gap by gap. For each gap, read the words around it: is it a location, a part of memory, a register, a bus or a stage?";
  add(
    t3("cyc-3a", "cyc", "Complete the paragraph about fetching an instruction into the CPU.\nThe program counter contains the ________ of the next instruction to be processed; this is then sent to the ________ using the address bus. The address is then sent to the ________ .\nOnce the address is received, the instruction stored at the location is sent to the ________, using the ________ bus. The instruction is then sent to the ________ that is built into the ________ .\nPick the word or name for each gap. [7]",
      ["address", "memory address register (MAR)", "random access memory (RAM)", "memory data register (MDR)", "data", "current instruction register (CIR)", "control unit (CU)"],
      ["arithmetic logic unit (ALU)", "read only memory (ROM)", "signal", "denary", "driver"],
      "Mark scheme: address, MAR, RAM, MDR, data, CIR, CU.", EX_CYC3, W_CYC3,
      "0478/12 June 2024 Q5(a)"),
    t3("cyc-3b", "cyc", "The paragraph explains how an instruction is processed by the CPU.\nAn instruction is ________ from RAM into the CPU, where it is temporarily stored in the ________ . The instruction is then sent along the ________ to the Control Unit (CU) to be ________ . The ________ will then perform any ________ and logic operations that are required to ________ the instruction.\nPick the word or name for each gap. [7]",
      ["fetched", "Memory Data Register (MDR)", "data bus", "decoded", "Arithmetic Logic Unit (ALU)", "calculations", "execute"],
      ["Memory Address Register (MAR)", "Program Counter (PC)", "address bus", "interrupt", "protocol"],
      "Mark scheme: fetched, MDR, data bus, decoded, ALU, calculations, execute.", EX_CYC3, W_CYC3,
      "0478/13 November 2022 Q7")
  );

  DrillData.register("y10-3-1-fde-fix", {
    title: "Fetch and Decode: Fix It",
    subtitle: "Cambridge IGCSE Computer Science 0478: the registers, decoding and executing, step by step",
    // Haiku second check on typed answers the keyword check rejects; each card waits for Next question (James 2026-11-20).
    aiFallback: true,
    waitForNext: true,
    ladder: TOPICS.map(function (t) { return { topic: t[1], label: t[1], tiers: [t[0] + "-1", t[0] + "-2", t[0] + "-3"] }; }),
    categories: [].concat.apply([], TOPICS.map(function (t) {
      return TIER_NAMES.map(function (n, i) { return [t[0] + "-" + (i + 1), t[1] + ": " + n]; });
    })),
    cards: cards
  });
})();
