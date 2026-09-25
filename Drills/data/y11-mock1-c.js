// Year 11 Mock Test 1C Revision: Writing Algorithms and Programs
// Loaded by Drills/index.html?drill=y11-mock1-c
DrillData.register("y11-mock1-c", {
  title: "Year 11 Mock Test 1C Revision: Writing Algorithms and Programs",
  subtitle: "Cambridge IGCSE Computer Science 0478 - validation, arrays, statistics and writing a full program",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["m1c-valid", "Writing Validation Algorithms"],
    ["m1c-arrays", "Declaring and Filling Arrays"],
    ["m1c-stats", "Totals, Averages, Counts and Rounding"],
    ["m1c-runs", "Longest Run (Consecutive Days)"],
    ["m1c-program", "Writing a Full Program"]
  ],
  cards: (function () {
    function exact(v) { return [new RegExp("^\\s*" + String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "i")]; }
    function fill(card) { var inst = card.randomize(); Object.keys(inst).forEach(function (k) { card[k] = inst[k]; }); return card; }
    function pick(list) { return list[randInt(0, list.length - 1)]; }
    return [
      // ---------------- validation algorithms
      {
        id: "m1c-v-structure", category: "m1c-valid",
        prompt: "An algorithm must input 20 numbers, asking again for each one until it is valid. Which structure fits best?",
        answers: ["A FOR loop, with a WHILE validation loop inside it"],
        keywords: [/\bfor\b.*\b(while|repeat)\b/i],
        distractors: ["A WHILE loop, with a FOR loop inside it", "One IF statement", "A single FOR loop with no other loop", "A CASE statement", "Twenty separate IF statements"],
        note: "The FOR loop counts the 20 numbers. Inside it, a WHILE (or REPEAT) loop keeps asking until the current number is valid."
      },
      fill({
        id: "m1c-v-cond", category: "m1c-valid",
        randomize: function () {
          var lo = randInt(1, 10), hi = lo + randInt(10, 90);
          var v = pick([
            { rule: "negative", a: "WHILE Number >= 0 DO", n: "A valid number is below 0, so keep asking while it is 0 or more." },
            { rule: "positive (above 0)", a: "WHILE Number <= 0 DO", n: "A valid number is above 0, so keep asking while it is 0 or less." },
            { rule: "from " + lo + " to " + hi, a: "WHILE Number < " + lo + " OR Number > " + hi + " DO", n: "Keep asking while it is too small OR too big." },
            { rule: "not zero", a: "WHILE Number = 0 DO", n: "Keep asking while the number is 0." }
          ]);
          var all = ["WHILE Number >= 0 DO", "WHILE Number <= 0 DO", "WHILE Number < 0 DO", "WHILE Number > 0 DO", "WHILE Number = 0 DO", "WHILE Number <> 0 DO",
            "WHILE Number < " + lo + " OR Number > " + hi + " DO", "WHILE Number < " + lo + " AND Number > " + hi + " DO"];
          return {
            prompt: "Each number must be " + v.rule + ". Which line starts the loop that asks for the number again until it is valid?",
            answers: [v.a],
            keywords: [new RegExp("^\\s*" + v.a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s*").replace(/\\s\*DO$/, "(\\s+do)?") + "\\s*$", "i")],
            distractors: all.filter(function (x) { return x !== v.a; }),
            note: v.n + " The WHILE condition always describes the INVALID values."
          };
        }
      }),
      fill({
        id: "m1c-v-store", category: "m1c-valid",
        randomize: function () {
          var arr = pick(["NegNumbers", "Accepted", "Scores", "Readings"]), c = pick(["Count", "Index", "Position"]);
          var ans = arr + "[" + c + "] <- Number";
          return {
            prompt: "Inside FOR " + c + " <- 1 TO 20, after validation, which line stores Number in the current element of " + arr + "[]?",
            answers: [ans],
            keywords: [new RegExp("^\\s*" + arr + "\\s*\\[\\s*" + c + "\\s*\\]\\s*(<-|\\u2190)\\s*number\\s*$", "i")],
            distractors: [arr + " <- Number", arr + "[Number] <- " + c, "Number <- " + arr + "[" + c + "]", arr + "[1] <- Number", arr + "[20] <- Number"],
            note: "The loop variable " + c + " is the position, so " + arr + "[" + c + "] is the current element."
          };
        }
      }),
      {
        id: "m1c-v-message", category: "m1c-valid",
        prompt: "Where should the message 'The check has been completed' be output?",
        answers: ["After the loop has finished (after NEXT)"],
        keywords: [{ required: [["after", "end", "finish", "finished"]], excluded: ["inside", "before", "each", "every"] }],
        distractors: ["Inside the loop, after each number", "Before the loop starts", "Inside the validation loop", "After every valid number", "It does not need a message"],
        note: "The message should appear once, when all the numbers are stored, so it goes after NEXT."
      },
      {
        id: "m1c-v-prompt", category: "m1c-valid",
        prompt: "What should come straight before every INPUT in a program?",
        answers: ["An OUTPUT prompt telling the user what to enter"],
        keywords: [{ required: [["prompt", "output", "message"]] }],
        distractors: ["A DECLARE line", "An ENDIF", "A comment", "Another INPUT", "A blank line"],
        note: "Exam questions say 'use appropriate input prompts'. OUTPUT \"Enter a negative number \" then INPUT Number."
      },
      // ---------------- arrays
      fill({
        id: "m1c-a-declare", category: "m1c-arrays",
        randomize: function () {
          var v = pick([
            { what: "a rainfall reading in millimetres, e.g. 2.5, for each of 365 days", name: "Rainfall", n: 365, t: "REAL" },
            { what: "the number of visitors, a whole number, for each of 7 days", name: "Visitors", n: 7, t: "INTEGER" },
            { what: "a temperature, e.g. 21.5, for each of 30 days", name: "Temps", n: 30, t: "REAL" },
            { what: "the name of each of 28 students", name: "Names", n: 28, t: "STRING" }
          ]);
          var other = v.t === "REAL" ? "INTEGER" : "REAL";
          var ans = "DECLARE " + v.name + " : ARRAY[1:" + v.n + "] OF " + v.t;
          return {
            prompt: "Which line declares an array to store " + v.what + "?",
            answers: [ans],
            keywords: [new RegExp("^\\s*declare\\s+" + v.name + "\\s*:\\s*array\\s*\\[\\s*1\\s*:\\s*" + v.n + "\\s*\\]\\s*of\\s+" + v.t + "\\s*$", "i")],
            distractors: [
              "DECLARE " + v.name + " : ARRAY[0:" + v.n + "] OF " + v.t,
              "DECLARE " + v.name + " : ARRAY[1:" + v.n + "] OF " + other,
              "DECLARE " + v.name + " : ARRAY[1:" + (v.n - 1) + "] OF " + v.t,
              "DECLARE " + v.name + " : " + v.t + "[" + v.n + "]",
              "DECLARE " + v.name + "[" + v.n + "] : ARRAY"
            ],
            note: "DECLARE Name : ARRAY[1:size] OF TYPE. Choose the element type from the example values."
          };
        }
      }),
      {
        id: "m1c-a-init", category: "m1c-arrays",
        prompt: "Which code sets every element of Rainfall[1:365] to zero?",
        answers: ["FOR Day <- 1 TO 365\n   Rainfall[Day] <- 0\nNEXT Day"],
        keywords: [/for\s+(\w+)\s*(<-|\u2190)\s*1\s+to\s+365[\s\S]*rainfall\s*\[\s*\1\s*\]\s*(<-|\u2190)\s*0/i],
        distractors: ["Rainfall <- 0", "FOR Day <- 1 TO 365\n   Rainfall <- 0\nNEXT Day", "Rainfall[365] <- 0", "FOR Day <- 1 TO 365\n   Day <- 0\nNEXT Day", "Rainfall[Day] <- 0"],
        note: "A loop visits every index, and each pass sets one element: Rainfall[Day] <- 0."
      },
      {
        id: "m1c-a-input", category: "m1c-arrays",
        prompt: "Inside FOR Day <- 1 TO 365, which line stores the reading for that day in the array?",
        answers: ["INPUT Rainfall[Day]"], keywords: [/^\s*input\s+rainfall\s*\[\s*day\s*\]\s*$/i],
        distractors: ["INPUT Rainfall", "OUTPUT Rainfall[Day]", "INPUT Day", "Rainfall[Day] <- Day", "INPUT Rainfall[365]"],
        note: "The loop variable picks a different element each pass."
      },
      // ---------------- statistics
      fill({
        id: "m1c-s-cm", category: "m1c-stats",
        randomize: function () {
          var mm = randInt(1000, 9999) / 10;
          var ans = String(Math.round(mm * 10) / 100);
          return {
            prompt: "The total rainfall is " + mm + " mm. 1 centimetre = 10 millimetres. What is the total in centimetres?",
            answers: [ans], keywords: exact(ans),
            distractors: dedupeDistractors(ans, [String(Math.round(mm * 10 * 10) / 10), String(Math.round(mm / 100 * 1000) / 1000), String(Math.round(mm / 1000 * 10000) / 10000), String(mm)]),
            note: "Millimetres to centimetres: divide by 10. " + mm + " / 10 = " + ans + "."
          };
        }
      }),
      fill({
        id: "m1c-s-round", category: "m1c-stats",
        randomize: function () {
          var p = pick([2, 4]), x = randInt(100000, 999999) / 10000 + randInt(1, 9);
          x = Math.round(x * 100000) / 100000;
          var r = Math.round(x * Math.pow(10, p)) / Math.pow(10, p);
          var ans = r.toFixed(p).replace(/0+$/, "").replace(/\.$/, "");
          var trunc = (Math.floor(x * Math.pow(10, p)) / Math.pow(10, p)).toFixed(p).replace(/0+$/, "").replace(/\.$/, "");
          return {
            prompt: "What is ROUND(" + x + ", " + p + ")?",
            answers: [ans], keywords: [new RegExp("^\\s*" + ans.replace(".", "\\.") + "0*\\s*$")],
            distractors: dedupeDistractors(ans, [trunc, x.toFixed(p === 2 ? 1 : 3), String(Math.round(x)), x.toFixed(p === 2 ? 3 : 2), String(x)].filter(function (d) { return Math.abs(parseFloat(d) - r) > 1e-9; }), function (i) { return (r + i / Math.pow(10, p)).toFixed(p); }),
            note: "ROUND(Value, Places) rounds to that many decimal places: " + x + " to " + p + " decimal places is " + ans + "."
          };
        }
      }),
      {
        id: "m1c-s-mean", category: "m1c-stats",
        prompt: "Which expression gives the mean daily rainfall for a 365-day year?",
        answers: ["Total / 365"], keywords: [/^\s*total\s*\/\s*365\s*$/i],
        distractors: ["365 / Total", "Total DIV 365", "Total MOD 365", "Total * 365", "Total - 365"],
        note: "Mean = total of the values / how many values. DIV would throw away the decimal part."
      },
      {
        id: "m1c-s-total", category: "m1c-stats",
        prompt: "Inside FOR Day <- 1 TO 365, which line adds that day's rainfall to the total?",
        answers: ["Total <- Total + Rainfall[Day]"], keywords: [/^\s*total\s*(<-|\u2190)\s*total\s*\+\s*rainfall\s*\[\s*day\s*\]\s*$/i],
        distractors: ["Total <- Total + 1", "Total <- Rainfall[Day]", "Rainfall[Day] <- Total + Rainfall[Day]", "Total <- Total + Day", "Total <- Total + Rainfall"],
        note: "Totalling adds each element onto the running total."
      },
      {
        id: "m1c-s-dry", category: "m1c-stats",
        prompt: "Which code counts the days with no rainfall?",
        answers: ["IF Rainfall[Day] = 0\n  THEN\n    DryDays <- DryDays + 1\nENDIF"],
        keywords: [/rainfall\s*\[\s*day\s*\]\s*=\s*0[\s\S]*dry\w*\s*(<-|\u2190)\s*dry\w*\s*\+\s*1/i],
        distractors: ["IF Rainfall[Day] = 0\n  THEN\n    DryDays <- DryDays + Rainfall[Day]\nENDIF", "IF Rainfall[Day] <> 0\n  THEN\n    DryDays <- DryDays + 1\nENDIF", "DryDays <- DryDays + 1", "IF Rainfall = 0\n  THEN\n    DryDays <- 1\nENDIF", "IF Rainfall[Day] > 0\n  THEN\n    DryDays <- DryDays - 1\nENDIF"],
        note: "Counting: test the condition, then add 1."
      },
      fill({
        id: "m1c-s-countzero", category: "m1c-stats",
        randomize: function () {
          var vals = []; for (var i = 0; i < 8; i++) vals.push(Math.random() < 0.4 ? 0 : randInt(1, 12));
          var dry = vals.filter(function (v) { return v === 0; }).length;
          return {
            prompt: "Rainfall for 8 days (mm): " + vals.join(", ") + "\nHow many days had no rainfall?",
            answers: [String(dry)], keywords: exact(dry),
            distractors: dedupeDistractors(dry, [8 - dry, dry + 1, dry - 1, 8, 0].filter(function (x) { return x >= 0; }), function (i) { return dry + i + 1; }),
            note: "Count the zeros: " + dry + "."
          };
        }
      }),
      // ---------------- longest run (consecutive days)
      fill({
        id: "m1c-r-trace", category: "m1c-runs",
        randomize: function () {
          var vals = []; for (var i = 0; i < 12; i++) vals.push(Math.random() < 0.55 ? 0 : randInt(1, 9));
          var run = 0, best = 0, runs = 0, first = -1;
          vals.forEach(function (v) {
            if (v === 0) { run++; if (run === 1) runs++; if (run > best) best = run; }
            else { if (first === -1 && run > 0) first = run; run = 0; }
          });
          if (first === -1) first = run;
          var zeros = vals.filter(function (v) { return v === 0; }).length;
          return {
            prompt: "Rainfall for 12 days (mm): " + vals.join(", ") + "\nWhat is the longest number of consecutive days with no rainfall?",
            answers: [String(best)], keywords: exact(best),
            distractors: dedupeDistractors(best, [zeros, first, best + 1, runs, best - 1].filter(function (x) { return x >= 0; }), function (i) { return best + i + 1; }),
            note: "Look for the longest unbroken run of zeros: " + best + ". The total number of dry days (" + zeros + ") is a different statistic."
          };
        }
      }),
      {
        id: "m1c-r-reset", category: "m1c-runs",
        prompt: "A program counts the current run of dry days in CurrentRun. What should happen to CurrentRun on a day when it rains?",
        answers: ["Set it back to 0"], keywords: [{ required: [["0", "zero", "reset"]] }],
        distractors: ["Add 1 to it", "Add the rainfall to it", "Leave it unchanged", "Set it to LongestRun", "Output it"],
        note: "Rain breaks the run, so CurrentRun <- 0. A dry day adds 1."
      },
      {
        id: "m1c-r-update", category: "m1c-runs",
        prompt: "When should LongestRun be updated?",
        answers: ["When CurrentRun is greater than LongestRun"],
        keywords: [{ required: [["greater", "bigger", "more", "larger", "higher", "exceed", "longer"]] }],
        distractors: ["On every day", "On every rainy day", "When CurrentRun is less than LongestRun", "When CurrentRun equals 0", "Only on day 1"],
        note: "IF CurrentRun > LongestRun THEN LongestRun <- CurrentRun, the same pattern as finding the highest value."
      },
      {
        id: "m1c-r-drought", category: "m1c-runs",
        prompt: "Which line starts the check for a drought (15 or more consecutive dry days)?",
        answers: ["IF LongestRun >= 15"], keywords: [/^\s*if\s+longestrun\s*>=\s*15(\s+then)?\s*$/i],
        distractors: ["IF LongestRun > 15", "IF DryDays >= 15", "IF LongestRun = 15", "WHILE LongestRun >= 15 DO", "IF CurrentRun <= 15"],
        note: "'15 or more' means >= 15. DryDays counts all dry days, not consecutive ones."
      },
      // ---------------- writing a full program
      {
        id: "m1c-p-comment", category: "m1c-program",
        prompt: "How do you write a comment in pseudocode?",
        answers: ["Start it with //"], keywords: [/\/\//],
        distractors: ["Start it with #", "Put it inside quote marks", "Start it with REM", "Put it after OUTPUT", "Start it with --"],
        note: "// Comment text. Exam questions often say 'add comments to explain how your code works'."
      },
      {
        id: "m1c-p-const", category: "m1c-program",
        prompt: "Which line declares a constant for the number of days in a year?",
        answers: ["CONSTANT DaysInYear <- 365"], keywords: [/^\s*constant\s+\w+\s*(<-|\u2190|=)\s*365\s*$/i],
        distractors: ["DECLARE DaysInYear : 365", "DaysInYear <- 365", "CONSTANT 365 <- DaysInYear", "DECLARE DaysInYear : CONSTANT", "INPUT DaysInYear"],
        note: "A constant is a value that never changes while the program runs."
      },
      {
        id: "m1c-p-marks", category: "m1c-program", type: "multi",
        prompt: "A 15-mark programming question says: add comments, declare everything, and give all inputs and outputs suitable messages. Which of these help you meet those requirements? Pick every one shown.",
        answers: ["Comments that explain each section", "A prompt before every INPUT", "A message with every output value", "A DECLARE line for every variable and array"],
        distractors: ["Using as few lines as possible", "Writing everything on one line", "Leaving out ENDIF to save time", "Only outputting the numbers, with no messages", "Using single-letter variable names everywhere"],
        note: "Follow every bullet in the question. Comments, declarations, prompts and output messages are all asked for."
      },
      {
        id: "m1c-p-order", category: "m1c-program",
        prompt: "What is a sensible order for the parts of the rainfall program?",
        answers: ["Declare, initialise, input, calculate, output"],
        keywords: [/declare[\s\S]*initiali[sz]e[\s\S]*input[\s\S]*calculat[\s\S]*output/i],
        distractors: ["Output, calculate, input, declare, initialise", "Input, output, declare, calculate, initialise", "Calculate, declare, input, output, initialise", "Declare, output, calculate, input, initialise", "Initialise, output, declare, input, calculate"],
        note: "You cannot use a variable before it is declared, or calculate statistics before the data has been input."
      },
      {
        id: "m1c-p-plan", category: "m1c-program",
        prompt: "Before writing a long program in an exam, what should you do first?",
        answers: ["Plan the inputs, the processes and the outputs"],
        keywords: [{ required: [["plan", "planning", "process", "processes"]] }],
        distractors: ["Start writing code straight away", "Write the output lines first", "Copy the example algorithm", "Declare every variable as STRING", "Skip the question and come back later"],
        note: "Tick off each bullet point of the question as you plan it: what is input, what is calculated and stored, and what is output."
      }
    ];
  })()
});
