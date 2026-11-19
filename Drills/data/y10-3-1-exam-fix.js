// Year 10 Unit 3.1 Exam Follow-up
// Loaded by Drills/index.html?drill=y10-3-1-exam-fix
// One ladder per subtopic of the Year 10 Unit 3.1 Exam (Computer Architecture, paper id y10-unit3-1-exam in the
// shell's ExamPapers.gs). Each subtopic has three tiers: key facts (short recall), exam wording (pick the line that
// earns the mark, then type it) and full answer (tick every statement a full-mark answer needs, one per mark).
// The `topic` strings match the exam's part topics exactly, so a student only climbs the ladders they lost marks on.
// Every mark-earning line comes from the exam's own mark scheme points or a real 0478 mark scheme.
(function () {
  var TOPICS = [
    ["cpu", "3.1 CPU and microprocessors", "The CPU and microprocessors"],
    ["comp", "3.1 CPU components and registers", "CPU components and registers"],
    ["bus", "3.1 Buses", "Buses"],
    ["fde", "3.1 Fetch-decode-execute cycle", "The fetch-decode-execute cycle"],
    ["perf", "3.1 Cores, cache and clock speed", "Cores, cache and clock speed"],
    ["emb", "3.1 Embedded systems", "Embedded systems"]
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

  var cards = [];
  function add() { for (var i = 0; i < arguments.length; i++) cards.push(arguments[i]); }

  // =====================================================================
  // 3.1 CPU and microprocessors
  // =====================================================================
  var W_CPU1 = "Think about the job this part does, not what it looks like.";
  var EX_CPU1 = "What does a printer do with data?\nStep 1: think about what the device is for.\nStep 2: it puts the data onto paper, so it is an output device.\nStep 3: name the job, not just the device.";
  var EX_CPU1B = "What does a sensor do in a sensor system?\nStep 1: a sensor measures something, such as temperature or light.\nStep 2: it sends its reading on as data.\nStep 3: the next part of the system decides what to do with the reading.";
  add(
    t1("cpu-1a", "cpu", "What does the CPU do with instructions and data?", "It processes them",
      /process|execut|carr(y|ies) out|\brun/i,
      ["It stores them permanently", "It inputs them", "It prints them", "It converts them to analogue", "It sends them to the internet"],
      "Mark scheme point: the CPU processes instructions and data. 0478/13, June 2024, Question 8(a), Question 2 of your exam.", EX_CPU1, W_CPU1),
    t1("cpu-1b", "cpu", "Which cycle does the CPU run to process each instruction?", "The fetch-decode-execute cycle",
      /fetch\W*decode\W*execut|\bFDE\b|fetch\W*execut/i,
      ["The input-process-output cycle", "The read-write cycle", "The parity cycle", "The packet cycle", "The power cycle"],
      "Mark scheme point: the CPU runs the fetch-decode-execute (FDE) cycle. 0478/13, June 2024, Question 8(a).", EX_CPU1, W_CPU1),
    t1("cpu-1c", "cpu", "A sensor sends data to a microprocessor. What does the microprocessor compare the data with?", "A stored value",
      /stored|preset|pre-set|set value|range/i,
      ["The actuator", "The screen", "The cache", "The keyboard", "The previous instruction"],
      "Mark scheme point: the microprocessor compares the data to a stored value (or a range of values). 0478/13, June 2021, Question 9(b), Question 10 of your exam.", EX_CPU1B, W_CPU1),
    t1("cpu-1d", "cpu", "After it compares the data, what does the microprocessor send to make something happen, for example to turn a light on?", "A signal",
      /signal/i,
      ["A packet", "An address", "A parity bit", "A password", "A file"],
      "Mark scheme point: the microprocessor sends a signal (to an actuator) to trigger an action. 0478/13, November 2024, Question 5(b), Question 9 of your exam.", EX_CPU1B, W_CPU1),
    t1("cpu-1e", "cpu", "What changes the sensor's analogue data into digital data?", "An ADC",
      /\bADC\b|analogue\W*(to\W*)?digital/i,
      ["A DAC", "An actuator", "The ALU", "The clock", "The cache"],
      "Mark scheme point: the data is converted from analogue to digital using an ADC. 0478/13, June 2021, Question 9(b).", EX_CPU1B, W_CPU1)
  );

  var Q_CPU_ROLE = "A student has a computer that has a central processing unit (CPU).\nDescribe the role of the CPU in the computer. [2]";
  var Q_MP_ROLE = "A farmer has a plough. The plough uses sensors and a microprocessor to maintain a straight line when digging the ground.\nDescribe the role of the microprocessor in this process. [3]";
  var Q_CAR = "Each parking space has a red and a green light above it. Sensors and a microprocessor are used to control the system.\nDescribe how the sensor and the microprocessor are used to display the red or green light above the parking space. [6]";
  var EX_CPU2A = "Describe the role of a keyboard in a computer. [2]\nStep 1: say what it does: it lets the user input data.\nStep 2: say how: each key press is sent to the computer.\nStep 3: lines like \"it is important\" or \"it is the main part\" earn nothing.";
  var EX_CPU2B = "Describe how a sensor and a microprocessor keep a fish tank warm. [4]\nStep 1: the temperature sensor sends its readings to the microprocessor.\nStep 2: the microprocessor checks each reading against the temperature it should be.\nStep 3: if it is too cold, the microprocessor tells an actuator to switch the heater on.\nStep 4: this repeats all the time.";
  var W_CPU2 = "Would this line still be true for almost any part of a computer? Then it earns nothing.";
  add(
    t2("cpu-2a", "cpu", Q_CPU_ROLE + WHICH, "It processes instructions and data",
      ["It stores all the files", "It is the brain of the computer", "It controls the computer", "It displays the output", "It makes the computer fast"],
      "Mark scheme point: to process instructions or data. \"The brain of the computer\" and \"it controls the computer\" earn nothing. 0478/13, June 2024, Question 8(a).", EX_CPU2A, W_CPU2),
    t2("cpu-2b", "cpu", Q_CPU_ROLE + WHICH, "It runs the fetch-decode-execute cycle",
      ["It stores the operating system", "It is where the computer thinks", "It connects to the internet", "It saves the files", "It checks data for transmission errors"],
      "Mark scheme point: to run the fetch-decode-execute cycle. 0478/13, June 2024, Question 8(a).", EX_CPU2A, W_CPU2),
    t2("cpu-2c", "cpu", Q_MP_ROLE + WHICH, "It receives data from the sensors",
      ["It measures the ground", "It digs the ground", "It is a small computer", "It stores the plough's files", "It moves the plough"],
      "Mark scheme point: it receives data from the sensor. The sensor measures; the microprocessor receives the data. 0478/13, November 2024, Question 5(b).", EX_CPU2B, W_CPU2),
    t2("cpu-2d", "cpu", Q_MP_ROLE + WHICH, "It sends signals to trigger actions based on the data",
      ["It controls the plough", "It does everything", "It is the brain of the plough", "It stores the data on a hard disk", "It turns the wheels itself"],
      "Mark scheme point: it sends signals to trigger actions based on the data. 0478/13, November 2024, Question 5(b).", EX_CPU2B, W_CPU2),
    t2("cpu-2e", "cpu", Q_CAR + WHICH, "The microprocessor compares the data to a stored value",
      ["The sensor decides which light to turn on", "The microprocessor sees the car", "The light turns itself on", "The microprocessor measures the car", "The sensor compares the data to a stored value"],
      "Mark scheme point: the data is compared to a stored value, by the microprocessor. The sensor only sends data. 0478/13, June 2021, Question 9(b).", EX_CPU2B, W_CPU2)
  );

  var W_CPU3 = "Each statement must say what one part does with the data, in the right order.";
  add(
    t3("cpu-3a", "cpu", Q_CPU_ROLE,
      ["It processes instructions and data", "It runs the fetch-decode-execute cycle"],
      ["It stores all the files", "It is the brain of the computer", "It displays the output", "It controls the computer", "It connects to the internet", "It makes the computer fast"],
      "Both mark scheme points of 0478/13, June 2024, Question 8(a), Question 2 of your exam.", EX_CPU2A, W_CPU3),
    t3("cpu-3b", "cpu", Q_MP_ROLE,
      ["It receives data from the sensors", "It checks if the data is out of range", "It sends signals to trigger actions"],
      ["It measures the ground", "It digs the ground", "It stores the data on a hard disk", "It is the brain of the plough", "It is a small computer", "It moves the plough by itself"],
      "The three mark scheme points of 0478/13, November 2024, Question 5(b), Question 9 of your exam.", EX_CPU2B, W_CPU3),
    t3("cpu-3c", "cpu", Q_CAR,
      ["The sensor sends data to the microprocessor", "The data is converted from analogue to digital", "The microprocessor compares the data to a stored value",
        "If a car is detected, it sends a signal to turn the red light on and the green light off", "An actuator turns the lights on and off", "The process is continuous"],
      ["The sensor decides which light to turn on", "The microprocessor stores the data on a hard disk", "The sensor converts digital data to analogue", "The light turns itself on",
        "The process happens once only", "The sensor sends a signal straight to the light"],
      "Six mark scheme points of 0478/13, June 2021, Question 9(b), Question 10 of your exam.", EX_CPU2B, W_CPU3)
  );

  // =====================================================================
  // 3.1 CPU components and registers
  // =====================================================================
  var W_COMP1 = "Find the key words in the question. Each part is named after its job.";
  var EX_COMP1 = "Which bus carries the read and write signals?\nStep 1: find the key words: read and write signals.\nStep 2: these signals manage what happens next.\nStep 3: each bus is named after what it carries, so it is the control bus.";
  add(
    t1("comp-1a", "comp", "Which register holds the address of the next instruction?", "Program counter",
      /program\s*counter|\bPC\b/i,
      ["Memory address register", "Memory data register", "Accumulator", "Current instruction register", "Cache"],
      "Mark scheme point: the program counter (PC) holds the address of the next instruction. 0478/13, November 2021, Question 5.", EX_COMP1, W_COMP1),
    t1("comp-1b", "comp", "Which register holds the result of a calculation from the ALU?", "Accumulator",
      /accumulator|\bACC\b/i,
      ["Program counter", "Memory address register", "Memory data register", "Current instruction register", "Control unit"],
      "Mark scheme point: the accumulator (ACC) temporarily holds the result of a calculation. It is built into the ALU. 0478/13, November 2021, Question 5.", EX_COMP1, W_COMP1),
    t1("comp-1c", "comp", "Which component decodes instructions and sends control signals?", "Control unit",
      /control\s*unit|\bCU\b/i,
      ["Arithmetic logic unit", "Accumulator", "Program counter", "Clock", "Control bus"],
      "Mark scheme point: the control unit (CU) decodes the instructions and manages the flow of data. 0478/13, June 2025, Question 3(a), Question 4 of your exam.", EX_COMP1, W_COMP1),
    t1("comp-1d", "comp", "Which component carries out calculations and logic operations?", "Arithmetic logic unit",
      /arithmetic|\bALU\b/i,
      ["Control unit", "Accumulator", "Program counter", "Memory data register", "Clock"],
      "Mark scheme point: the arithmetic logic unit (ALU) performs calculations and logical operations. 0478/13, June 2024, Question 8(c).", EX_COMP1, W_COMP1),
    t1("comp-1e", "comp", "In a few words, what does a register do?", "Temporarily stores data",
      /(temporar\w*|short).*(stor|hold)|(stor|hold)\w*.*(temporar|short)/i,
      ["Permanently stores files", "Carries out calculations", "Sends control signals", "Decodes instructions", "Counts clock pulses"],
      "Mark scheme point: a register is a component in the CPU that temporarily stores data. 0478/13, June 2025, Question 3(a).", EX_COMP1, W_COMP1)
  );

  var Q_REG = "A computer with a Von Neumann architecture has several hardware components.\nGive the description for register. [1]";
  var Q_CU = "A computer with a Von Neumann architecture has several hardware components.\nGive the description for control unit (CU). [1]";
  var Q_VN = "The accumulator is a register that is part of the Von Neumann model.\nGive two other registers that are part of the Von Neumann model. [2]";
  var EX_COMP2 = "Give the description for memory data register (MDR). [1]\nStep 1: say what it holds: the data or instruction just fetched from memory.\nStep 2: a description says what the part does, not that it is important.\nStep 3: \"it is a register\" repeats the question and earns nothing.";
  var W_COMP2 = "Does the line say what the part does? A line that only says it is important earns nothing.";
  add(
    t2("comp-2a", "comp", Q_REG + WHICH, "A component in the CPU that temporarily stores data",
      ["A component that stores files", "A part of the hard disk", "A component that carries out calculations", "A list of commands", "A type of bus"],
      "Mark scheme point: a component in the CPU that is used to temporarily store data. 0478/13, June 2025, Question 3(a).", EX_COMP2, W_COMP2),
    t2("comp-2b", "comp", Q_CU + WHICH, "It decodes the instructions",
      ["It controls the computer", "It is the brain of the CPU", "It carries out calculations", "It stores the result of calculations", "It counts the clock pulses"],
      "Mark scheme point: a component that decodes the instructions. \"It controls the computer\" earns nothing. 0478/13, June 2025, Question 3(a).", EX_COMP2, W_COMP2),
    t2("comp-2c", "comp", Q_CU + WHICH, "It manages the flow of data around the CPU",
      ["It is in charge of the computer", "It stores data permanently", "It performs logic operations", "It holds the address of the next instruction", "It makes the CPU faster"],
      "Mark scheme point: a component in the CPU that manages the flow of data around the CPU. 0478/13, June 2025, Question 3(a).", EX_COMP2, W_COMP2),
    t2("comp-2d", "comp", Q_VN + WHICH, "Memory address register (MAR)",
      ["Arithmetic logic unit (ALU)", "Control unit (CU)", "Accumulator (ACC)", "Random access memory (RAM)", "Cache"],
      "Any two from MAR, MDR, PC and CIR. The ALU and CU are not registers, and the accumulator is given in the question. 0478/13, June 2021, Question 10(b), Question 3 of your exam.", EX_COMP2, W_COMP2)
  );

  var W_COMP3 = "A register holds something. A unit does something. Check each line names the right kind of part.";
  add(
    t3("comp-3a", "comp", Q_VN,
      ["Program counter (PC)", "Current instruction register (CIR)"],
      ["Accumulator (ACC)", "Arithmetic logic unit (ALU)", "Control unit (CU)", "Random access memory (RAM)", "Cache", "Clock"],
      "Any two from MAR, MDR, PC and CIR. 0478/13, June 2021, Question 10(b), Question 3 of your exam.", EX_COMP2, W_COMP3),
    t3("comp-3b", "comp", "A computer has a central processing unit (CPU).\nIdentify three components that are built into the CPU. [3]",
      ["Accumulator (ACC)", "Control unit (CU)", "Program counter (PC)"],
      ["Random access memory (RAM)", "Hard disk drive (HDD)", "Graphics card", "Motherboard", "Read only memory (ROM)", "Monitor"],
      "The three answers of 0478/13, November 2023, Question 3(a), like Question 1 of your exam.", EX_COMP2, W_COMP3),
    t3("comp-3c", "comp", "One component in the CPU is the arithmetic logic unit (ALU).\nDescribe the purpose of the ALU. [3]",
      ["It executes instructions", "It performs calculations", "It performs logical operations"],
      ["It decodes instructions", "It stores the address of the next instruction", "It sends control signals", "It stores frequently used data", "It fetches instructions from RAM", "It sets the clock speed"],
      "Three mark scheme points of 0478/13, June 2024, Question 8(c).", EX_COMP2, W_COMP3)
  );

  // =====================================================================
  // 3.1 Buses
  // =====================================================================
  var W_BUS1 = "Each bus is named after what it carries.";
  var EX_BUS1 = "Which register holds the address of the next instruction?\nStep 1: find the key words: address, next instruction.\nStep 2: the register that counts through the program holds it.\nStep 3: it is the program counter.";
  add(
    t1("bus-1a", "bus", "Which bus carries addresses from the CPU to memory?", "Address bus",
      /^(?!.*\b(data|control)\b).*address/i,
      ["Data bus", "Control bus", "Universal serial bus (USB)", "Cache", "Clock"],
      "The address bus carries addresses. 0478/13, June 2023, Question 2(c)(ii).", EX_BUS1, W_BUS1),
    t1("bus-1b", "bus", "Which bus carries data and instructions between the CPU and memory?", "Data bus",
      /^(?!.*\b(address|control)\b).*\bdata\b/i,
      ["Address bus", "Control bus", "Universal serial bus (USB)", "Cache", "Clock"],
      "The data bus carries data and instructions. 0478/11, November 2022, Question 2(a).", EX_BUS1, W_BUS1),
    t1("bus-1c", "bus", "Which bus carries signals such as read and write?", "Control bus",
      /^(?!.*\b(address|data)\b).*\bcontrol\b/i,
      ["Address bus", "Data bus", "Universal serial bus (USB)", "Cache", "Clock"],
      "The control bus carries control signals. 0478/11, November 2022, Question 2(a).", EX_BUS1, W_BUS1),
    t1("bus-1d", "bus", "Which bus only transmits in one direction, out of the CPU?", "Address bus",
      /^(?!.*\b(data|control)\b).*address/i,
      ["Data bus", "Control bus", "Universal serial bus (USB)", "Cache", "Clock"],
      "Only the CPU chooses an address, so the address bus only goes out of the CPU. The data and control buses go both ways. Question 5 of your exam.", EX_BUS1, W_BUS1),
    t1("bus-1e", "bus", "Which two buses can transmit in both directions?", "Data bus and control bus",
      /^(?!.*address)(?=.*\bdata\b)(?=.*\bcontrol\b)/i,
      ["Address bus and data bus", "Address bus and control bus", "Only the address bus", "All three buses", "No bus"],
      "Data goes into the CPU for a read and out for a write; control signals go out from the CU and in from devices. 0478/12, March 2021, Question 8(b)(ii) mark scheme.", EX_BUS1, W_BUS1)
  );

  var Q_TWO_BUS = "One type of component within the CPU is an address bus.\nIdentify two other types of bus and state what each is responsible for transmitting in the CPU. [4]";
  var Q_CB = "A Von Neumann model, for a computer system, uses registers and buses.\nDescribe the role of the control bus. [2]";
  var Q_ONE_BUS = "The CPU contains registers and buses.\nIdentify one bus that can be found in the CPU and explain its purpose. [3]";
  var EX_BUS2 = "Identify one register and state what it holds. [2]\nStep 1: name it in full: memory data register.\nStep 2: then say what it holds: the data or instruction just fetched.\nStep 3: the second line must match the name you gave.";
  var W_BUS2 = "Does what it carries match the bus named?";
  add(
    t2("bus-2a", "bus", Q_TWO_BUS + WHICH, "Data bus: transmits data and instructions",
      ["Data bus: transmits addresses", "Control bus: transmits data", "Data bus: controls the computer", "Address bus: transmits addresses", "Data bus: stores data"],
      "Mark scheme points: data bus, transmitting data or instructions. The address bus is given in the question. 0478/11, November 2022, Question 2(a).", EX_BUS2, W_BUS2),
    t2("bus-2b", "bus", Q_TWO_BUS + WHICH, "Control bus: transmits control signals",
      ["Control bus: controls the CPU", "Control bus: transmits addresses", "Control bus: stores signals", "Address bus: transmits addresses", "Control bus: decodes instructions"],
      "Mark scheme points: control bus, transmitting control signals. 0478/11, November 2022, Question 2(a).", EX_BUS2, W_BUS2),
    t2("bus-2c", "bus", Q_CB + WHICH, "It carries control signals from the CU to other components",
      ["It controls the computer", "It carries addresses to memory", "It controls all the buses", "It stores control signals", "It carries data from RAM to the MDR"],
      "Mark scheme points: carries control signals, from the CPU or CU to components. \"It controls the computer\" earns nothing. 0478/12, March 2021, Question 8(b)(ii).", EX_BUS2, W_BUS2),
    t2("bus-2d", "bus", Q_ONE_BUS + WHICH, "Address bus: it carries addresses between components in the CPU",
      ["Address bus: it carries data", "Address bus: it controls the CPU", "Data bus: it carries addresses", "Control bus: it carries addresses", "Address bus: it is fast"],
      "One mark for the bus and two for its matching purpose: what it carries, and where. 0478/13, June 2023, Question 2(c)(ii).", EX_BUS2, W_BUS2)
  );

  var W_BUS3 = "Every statement about a bus must match the bus it names.";
  add(
    t3("bus-3a", "bus", Q_TWO_BUS,
      ["Data bus", "The data bus transmits data and instructions", "Control bus", "The control bus transmits control signals"],
      ["Address bus", "The data bus transmits addresses", "The control bus controls the computer", "The address bus transmits addresses", "Universal serial bus", "The data bus stores data"],
      "The four mark scheme points of 0478/11, November 2022, Question 2(a). The address bus is in the question, so it earns no mark.", EX_BUS2, W_BUS3),
    t3("bus-3b", "bus", Q_CB,
      ["It carries control signals", "It carries them from the CU to other components"],
      ["It controls the computer", "It carries addresses", "It stores signals", "It carries data and instructions", "It decodes instructions", "It counts clock pulses"],
      "Two mark scheme points of 0478/12, March 2021, Question 8(b)(ii).", EX_BUS2, W_BUS3),
    t3("bus-3c", "bus", "Circle the two buses that are used in the fetch stage of the FDE cycle. [2]\nbinary, control, denary, data, information, hardware, software",
      ["Control", "Data"],
      ["Binary", "Denary", "Information", "Hardware", "Software"],
      "Both answers of 0478/13, June 2025, Question 3(c). The address bus is used too, but it is not in this list.", EX_BUS2, W_BUS3)
  );

  // =====================================================================
  // 3.1 Fetch-decode-execute cycle
  // =====================================================================
  var W_FDE1 = "Follow the instruction: where is it now, and where does it go next?";
  var EX_FDE1 = "Which bus carries the read signal to memory?\nStep 1: a read signal is a control signal.\nStep 2: control signals travel on the control bus.\nStep 3: name the bus by what it carries.";
  add(
    t1("fde-1a", "fde", "What are the three stages of the cycle, in order?", "Fetch, decode, execute",
      /fetch\W+decode\W+(and\W+)?execut/i,
      ["Decode, fetch, execute", "Input, process, output", "Fetch, execute, decode", "Read, write, store", "Execute, decode, fetch"],
      "Fetch, then decode, then execute. 0478/11, June 2022, Question 2(a)(ii).", EX_FDE1, W_FDE1),
    t1("fde-1b", "fde", "In the fetch stage, which register is the address in the PC copied to?", "Memory address register",
      /memory\s*address\s*register|\bMAR\b/i,
      ["Memory data register", "Current instruction register", "Accumulator", "Control unit", "Cache"],
      "The PC sends the address to the MAR. 0478/11, November 2025, Question 6(a).", EX_FDE1, W_FDE1),
    t1("fde-1c", "fde", "Which register is the instruction stored in as soon as it arrives from RAM?", "Memory data register",
      /memory\s*data\s*register|\bMDR\b|\bMBR\b/i,
      ["Memory address register", "Program counter", "Accumulator", "Current instruction register", "Cache"],
      "The instruction is retrieved from RAM and immediately stored in the MDR. 0478/11, November 2025, Question 6(a).", EX_FDE1, W_FDE1),
    t1("fde-1d", "fde", "What does the CU use to decode an instruction?", "An instruction set",
      /instruction\s*set/i,
      ["The accumulator", "The program counter", "The clock", "The cache", "The address bus"],
      "The CU decodes the instruction using an instruction set. 0478/11, November 2024, Question 5(b).", EX_FDE1, W_FDE1),
    t1("fde-1e", "fde", "When an instruction is decoded, it is split into two parts. What are they?", "Opcode and operand",
      /(?=.*opcode)(?=.*operand)/i,
      ["Address and data", "Header and payload", "Input and output", "Fetch and execute", "Bus and register"],
      "The instruction is separated into opcode and operand. 0478/11, November 2024, Question 5(b).", EX_FDE1, W_FDE1)
  );

  var Q_DEC = "A smartphone has a processor. The processor performs the fetch-decode-execute (FDE) cycle.\nDescribe the actions that take place in the decode stage of the FDE cycle. [3]";
  var Q_CORR = "This statement about the fetch-decode-execute cycle is not correct:\nMAR sends the address it holds to RAM using the data bus.\nSuggest a corrected statement. [1]";
  var EX_FDE2 = "Describe what happens in the execute stage when the instruction is a calculation. [2]\nStep 1: say which part carries it out: the arithmetic logic unit.\nStep 2: say where the result goes: the accumulator.\nStep 3: \"the instruction happens\" says nothing and earns no mark.";
  var W_FDE2 = "Does the line name the part that does the job? \"It is decoded\" without saying by what earns nothing.";
  add(
    t2("fde-2a", "fde", Q_DEC + WHICH, "The control unit decodes the instruction",
      ["The ALU decodes the instruction", "The instruction is understood", "The MAR decodes the instruction", "The CPU looks at the instruction", "The accumulator decodes the instruction"],
      "Mark scheme point: the control unit (CU) decodes the instruction. It must say the CU. 0478/11, June 2026, Question 2(a)(ii).", EX_FDE2, W_FDE2),
    t2("fde-2b", "fde", Q_DEC + WHICH, "An instruction set is used to decode the instruction",
      ["The accumulator is used to decode the instruction", "A character set is used to decode the instruction", "The cache is used to decode the instruction", "The PC is used to decode the instruction", "The clock is used to decode the instruction"],
      "Mark scheme point: an instruction set is used. 0478/11, June 2026, Question 2(a)(ii).", EX_FDE2, W_FDE2),
    t2("fde-2c", "fde", Q_DEC + WHICH, "The instruction is sent from the MDR to the CIR",
      ["The instruction is sent from the CIR to the MDR", "The address is sent from the PC to the MAR", "The instruction is sent to RAM", "The ALU sends the instruction to the PC", "The instruction is sent from the ACC to the PC"],
      "Mark scheme point: the instruction is sent to the CIR, from the MDR. 0478/11, June 2026, Question 2(a)(ii).", EX_FDE2, W_FDE2),
    t2("fde-2d", "fde", Q_CORR + WHICH, "MAR sends the address it holds to RAM using the address bus",
      ["MDR sends the address it holds to RAM using the data bus", "MAR sends the data it holds to RAM using the data bus", "PC sends the address it holds to RAM using the data bus",
        "MAR sends the address it holds to the ALU using the address bus", "MAR sends the address it holds to RAM using the control bus"],
      "Addresses travel on the address bus. Question 8 of your exam, statement B.", EX_FDE2, W_FDE2)
  );

  var W_FDE3 = "Put the instruction's journey in order: MDR, then CIR, then the CU decodes it.";
  add(
    t3("fde-3a", "fde", Q_DEC,
      ["The instruction is sent from the MDR to the CIR", "The control unit decodes the instruction", "An instruction set is used"],
      ["The ALU decodes the instruction", "The PC is incremented", "The address is sent to the MAR", "The instruction is sent to RAM", "The accumulator stores the instruction", "A character set is used"],
      "Three mark scheme points of 0478/11, June 2026, Question 2(a)(ii).", EX_FDE2, W_FDE3),
    t3("fde-3b", "fde", "A central processing unit (CPU) performs the fetch-decode-execute (FDE) cycle.\nGive the name of two registers that are used in the fetch stage of the cycle. [2]",
      ["Program counter (PC)", "Memory address register (MAR)"],
      ["Accumulator (ACC)", "Arithmetic logic unit (ALU)", "Control unit (CU)", "Random access memory (RAM)", "Cache", "Clock"],
      "Any two from PC, MAR, MDR and CIR. 0478/11, November 2024, Question 5(a), Question 6 of your exam.", EX_FDE2, W_FDE3),
    t3("fde-3c", "fde", "Two of these statements are not correct.\nA: PC stores the address of the next instruction to be fetched\nB: MAR sends the address it holds to RAM using the data bus\nC: MDR stores the data or instruction that has been fetched from RAM\nD: CIR stores the instruction while it is being decoded\nE: ACC stores the instruction set that is used to decode the instruction\nIdentify the letter of each incorrect statement and suggest a corrected statement for each. [4]",
      ["Statement B", "The MAR sends the address using the address bus", "Statement E", "The ACC stores the result of a calculation"],
      ["Statement A", "Statement C", "Statement D", "The MAR sends the address using the control bus", "The ACC stores the address of the next instruction", "The CIR stores the instruction set"],
      "Question 8 of your exam: a letter and its correction for each.", EX_FDE2, W_FDE3)
  );

  // =====================================================================
  // 3.1 Cores, cache and clock speed
  // =====================================================================
  var W_PERF1 = "Ask what there is more of, and what that lets the CPU do.";
  var EX_PERF1 = "What does a 2 MB file size mean?\nStep 1: M stands for mega, about one million.\nStep 2: B stands for bytes.\nStep 3: so the file is about 2 million bytes.";
  add(
    t1("perf-1a", "perf", "What does a clock speed of 3 GHz mean?", "3 billion cycles per second",
      /(3|three)\s*billion.*(per|a|each|every)\s*second|3\s*000\s*000\s*000/i,
      ["3 million cycles per second", "3 thousand cycles per second", "3 cycles per second", "3 billion bytes of memory", "3 cores"],
      "G is giga, one billion; Hz is per second. 0478/12, June 2026, Question 2(d).", EX_PERF1, W_PERF1),
    t1("perf-1b", "perf", "What does cache store?", "Frequently used data and instructions",
      /frequent|often|most used|commonly/i,
      ["All the files", "The operating system permanently", "The address of the next instruction", "The result of each calculation", "Data that is never used"],
      "Mark scheme point: cache stores frequently used data or instructions. 0478/12, June 2025, Question 4(a).", EX_PERF1, W_PERF1),
    t1("perf-1c", "perf", "What is the name of a processing unit within the CPU that can fetch, decode and execute instructions?", "A core",
      /\bcores?\b/i,
      ["A register", "A cache", "A clock", "A bus", "An accumulator"],
      "Mark scheme: core. 0478/13, June 2025, Question 3(a), Question 4(v) of your exam.", EX_PERF1, W_PERF1),
    t1("perf-1d", "perf", "A CPU has more cores. What can it process simultaneously?", "More instructions",
      /more\s*(instructions|FDE|fetch|cycles)/i,
      ["Fewer instructions", "Bigger files", "More addresses", "More buses", "More cache"],
      "Each core runs its own FDE cycle, so more instructions are processed simultaneously. 0478/12, March 2024, Question 2(b)(ii).", EX_PERF1, W_PERF1),
    t1("perf-1e", "perf", "A CPU gets frequently used data from cache instead of RAM. What happens to its performance?", "It improves",
      /improv|increas|better|faster|quicker/i,
      ["It gets worse", "It stays the same", "It stops", "It crashes", "It uses more cores"],
      "Cache is faster to access than RAM, so performance improves. 0478/12, March 2024, Question 2(b)(iii).", EX_PERF1, W_PERF1)
  );

  var Q_CLK = "The CPU has a clock speed of 2.4 GHz.\nDescribe what is meant by a 2.4 GHz clock speed. [2]";
  var Q_CACHE = "The amount of cache is increased to 64 kB.\nExplain how the amount of cache affects the performance of a computer. [2]";
  var Q_CORES = "The CPU is changed to a dual-core processor.\nExplain how the number of cores affects the performance of a CPU. [2]";
  var Q_BC = "Computer B has a 2.2 GHz dual-core processor.\nComputer C has a 4.6 GHz single-core processor.\nExplain why Computer C can execute more instructions per second than Computer B. [2]";
  var EX_PERF2 = "Explain how the number of checkouts in a shop affects how fast customers are served. [2]\nStep 1: say what changes: more checkouts serve more customers at the same time.\nStep 2: say the effect: more customers are served each minute.\nStep 3: \"it is better\" with no reason earns nothing.";
  var W_PERF2 = "A mark needs the reason: more of what, each second or at the same time?";
  add(
    t2("perf-2a", "perf", Q_CLK + WHICH, "The CPU completes 2.4 billion cycles per second",
      ["The CPU is 2.4 times faster", "The CPU has 2.4 cores", "The CPU completes 2.4 million cycles per second", "The CPU has 2.4 GB of memory", "The CPU is fast"],
      "Mark scheme points: 2.4 billion ... cycles or clock pulses per second. 0478/11, November 2023, Question 1(d).", EX_PERF2, W_PERF2),
    t2("perf-2b", "perf", Q_CACHE + WHICH, "More cache means frequently used data can be accessed faster",
      ["More cache means more files can be saved", "More cache makes the CPU bigger", "More cache means more cores", "Cache stores all the data", "More cache slows the computer down"],
      "Mark scheme point: more frequently used data or instructions can be accessed faster. 0478/12, March 2024, Question 2(b)(iii).", EX_PERF2, W_PERF2),
    t2("perf-2c", "perf", Q_CORES + WHICH, "More cores means more instructions can be executed simultaneously",
      ["More cores makes the clock faster", "More cores means more storage", "More cores means fewer instructions per second", "More cores means bigger files", "More cores means more cache"],
      "Mark scheme point: each core runs an FDE cycle simultaneously. 0478/12, March 2024, Question 2(b)(ii).", EX_PERF2, W_PERF2),
    t2("perf-2d", "perf", Q_BC + WHICH, "C can run 4.6 billion instructions per second, but B can only run 4.4 billion",
      ["C has more cores", "B has more cores so it is faster", "C has more cache", "C is newer", "B can run 2.2 billion instructions per second in total"],
      "B has two cores at 2.2 GHz, so at most 4.4 billion a second; C runs 4.6 billion. Question 11(ii) of your exam.", EX_PERF2, W_PERF2)
  );

  var W_PERF3 = "Each change needs its reason. Pick the change and the line that explains it.";
  add(
    t3("perf-3a", "perf", Q_CLK,
      ["2.4 billion", "cycles per second"],
      ["2.4 million", "2.4 thousand", "cores per second", "bytes per second", "2.4 times faster", "files per second"],
      "The two mark scheme points of 0478/11, November 2023, Question 1(d).", EX_PERF2, W_PERF3),
    t3("perf-3b", "perf", "Explain two ways that the performance of the CPU could be increased. [4]",
      ["Increase the number of cores", "... so more instructions are processed simultaneously", "Increase the clock speed", "... so more instructions are processed per second"],
      ["Increase the size of the hard disk", "... so more files can be stored", "Use a bigger monitor", "Decrease the clock speed", "... so the CPU stays cool", "Add a printer"],
      "Four mark scheme points of 0478/12, November 2025, Question 4(c).", EX_PERF2, W_PERF3),
    t3("perf-3c", "perf", "Computer A has a 2.0 GHz quad-core processor.\nComputer B has a 2.2 GHz dual-core processor.\nComputer C has a 4.6 GHz single-core processor.\nIdentify which computer is most likely to execute more instructions simultaneously. Justify your answer. [3]",
      ["Computer A", "It has 4 cores", "4 instructions can be executed simultaneously"],
      ["Computer B", "Computer C", "It has the highest clock speed", "It has the most cache", "It can run 4.6 billion instructions per second", "It has 2 cores"],
      "Question 11(i) of your exam: the computer, then two points of justification.", EX_PERF2, W_PERF3)
  );

  // =====================================================================
  // 3.1 Embedded systems
  // =====================================================================
  var W_EMB1 = "Ask: does it do one job, chosen by its maker, or many jobs?";
  var EX_EMB1 = "Does a desktop computer do one job or many jobs?\nStep 1: list what people use it for: writing, games, the internet, music.\nStep 2: that is many jobs, and new software can be put on it.\nStep 3: ask the same question about any device.";
  add(
    t1("emb-1a", "emb", "An embedded system performs a ____ function. Give the missing word.", "Dedicated",
      /dedicated|single|limited|specific|\bone\b|special/i,
      ["General", "Many", "Changing", "Multiple", "Every"],
      "Mark scheme point: it has a single, limited or dedicated function. 0478/13, November 2025, Question 1(f).", EX_EMB1, W_EMB1),
    t1("emb-1b", "emb", "What does an embedded system contain to process its data?", "A microprocessor",
      /micro\s*-?\s*processor|microcontroller/i,
      ["A graphics card", "A hard disk", "A web server", "A printer", "A router"],
      "Mark scheme point: it has a microprocessor. 0478/13, November 2025, Question 1(f).", EX_EMB1, W_EMB1),
    t1("emb-1c", "emb", "Can the user of an embedded system easily reprogram it?", "No",
      /^\s*no\b|cannot|can't|can not|\bnot\b/i,
      ["Yes", "Yes, by downloading apps", "Yes, any time", "Yes, by installing software", "Only with a keyboard"],
      "Mark scheme point: it is difficult to change its function, or it cannot be reprogrammed. 0478/13, November 2025, Question 1(f).", EX_EMB1, W_EMB1),
    t1("emb-1d", "emb", "Is a laptop an embedded system or a general purpose computer?", "General purpose computer",
      /general/i,
      ["Embedded system", "Microprocessor", "Sensor", "Actuator", "Vending machine"],
      "A laptop performs many different functions, so it is a general purpose computer. 0478/12, June 2025, Question 4(b).", EX_EMB1, W_EMB1),
    t1("emb-1e", "emb", "Give one domestic appliance that contains an embedded system.", "Washing machine",
      /washing|microwave|fridge|freezer|oven|dishwasher|kettle|toaster|air\W*condition|thermostat|cooker|vacuum/i,
      ["Laptop", "Personal computer", "Smartphone", "Tablet computer", "Web server"],
      "Domestic appliances such as a washing machine, freezer or microwave oven contain embedded systems. 0478/12, November 2023, Question 4(b).", EX_EMB1, W_EMB1)
  );

  var Q_WHY = "A vending machine is an example of an embedded system.\nExplain why the vending machine is an embedded system. [2]";
  var Q_NOT = "A laptop is an example of a general purpose computer and not an embedded system.\nExplain why the laptop is not an embedded system. [2]";
  var EX_EMB2 = "Explain why a traffic light system is an embedded system. [2]\nStep 1: say how many jobs it does: just one, controlling the lights.\nStep 2: say whether its program can be changed by the user: no.\nStep 3: \"it is small\" or \"it is electronic\" is true of many devices and earns nothing.";
  var W_EMB2 = "Would this line also be true of a laptop? Then it does not show it is embedded.";
  add(
    t2("emb-2a", "emb", Q_WHY + WHICH, "It has a single function",
      ["It is a computer", "It is small", "It is cheap", "It sells drinks", "It has a screen"],
      "Mark scheme point: it has a single or limited function. 0478/13, November 2025, Question 1(f).", EX_EMB2, W_EMB2),
    t2("emb-2b", "emb", Q_WHY + WHICH, "It has a microprocessor",
      ["It has a CPU and a hard disk", "It is electronic", "It uses electricity", "It has buttons", "It has a keypad"],
      "Mark scheme point: it has a microprocessor. 0478/13, November 2025, Question 1(f).", EX_EMB2, W_EMB2),
    t2("emb-2c", "emb", Q_WHY + WHICH, "It cannot be reprogrammed",
      ["It can be reprogrammed by the user", "It can run any software", "It is easy to use", "It is a computer", "It has a keyboard"],
      "Mark scheme point: it is difficult to change its function, or it cannot be reprogrammed. 0478/13, November 2025, Question 1(f).", EX_EMB2, W_EMB2),
    t2("emb-2d", "emb", Q_NOT + WHICH, "A laptop can perform many different functions",
      ["A laptop is big", "A laptop is expensive", "A laptop has a screen", "A laptop is a computer", "A laptop uses electricity"],
      "Mark scheme point: a computer can be used to perform many different functions. 0478/12, June 2025, Question 4(b).", EX_EMB2, W_EMB2),
    t2("emb-2e", "emb", Q_NOT + WHICH, "Software can easily be updated on a laptop",
      ["A laptop is heavy", "A laptop has a battery", "A laptop has a keyboard", "A laptop is portable", "A laptop has a fan"],
      "Mark scheme point: software can easily be updated or reprogrammed on the computer. 0478/12, June 2025, Question 4(b).", EX_EMB2, W_EMB2)
  );

  var W_EMB3 = "Keep only lines that would NOT also be true of the other kind of computer.";
  add(
    t3("emb-3a", "emb", Q_WHY,
      ["It has a single function", "It has a microprocessor"],
      ["It is a computer", "It is small", "It sells drinks", "It has a screen", "It can run any software", "It has a hard disk"],
      "Two mark scheme points of 0478/13, November 2025, Question 1(f), as in Question 12(a) of your exam.", EX_EMB2, W_EMB3),
    t3("emb-3b", "emb", "A vending machine is an example of an embedded system.\nSelect three other examples of an embedded system. [3]",
      ["Microwave oven", "Burglar alarm", "Washing machine"],
      ["Personal computer (PC)", "Tablet computer", "Web server", "Smartphone", "Laptop", "Desktop computer"],
      "Question 12(b) of your exam: each one does a single job chosen by its maker.", EX_EMB2, W_EMB3),
    t3("emb-3c", "emb", Q_NOT,
      ["A laptop can perform many different functions", "Software can easily be updated on a laptop"],
      ["A laptop is big", "A laptop is expensive", "A laptop has a screen", "A laptop uses electricity", "A laptop has a microprocessor", "A laptop has one function"],
      "Two mark scheme points of 0478/12, June 2025, Question 4(b), as in Question 12(c) of your exam.", EX_EMB2, W_EMB3)
  );

  DrillData.register("y10-3-1-exam-fix", {
    title: "Year 10 Unit 3.1 Exam Follow-up",
    subtitle: "Cambridge IGCSE Computer Science 0478: practise the parts of the Computer Architecture exam you lost marks on",
    ladder: TOPICS.map(function (t) { return { topic: t[1], label: t[2], tiers: [t[0] + "-1", t[0] + "-2", t[0] + "-3"] }; }),
    categories: [].concat.apply([], TOPICS.map(function (t) {
      return TIER_NAMES.map(function (n, i) { return [t[0] + "-" + (i + 1), t[2] + ": " + n]; });
    })),
    cards: cards
  });
})();
