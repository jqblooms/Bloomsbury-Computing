// Year 8, Revision 2: Arrays and Searching
// Loaded by Drills/index.html?drill=y8-revision-2
// The last lesson before the Unit 1 assessment: an array's index and value, adding up an array in a loop, a linear
// search with a Found flag, and mixed questions across the unit. Programs are written the way the Year 8 lessons write
// them (IF ... THEN on one line, every variable declared). Every answer that comes from a program is worked out by
// running that program in the site's pseudocode engine (shared/pseudocode-engine.js, loaded before this file).
DrillData.register("y8-revision-2", {
  title: "Year 8, Revision 2: Arrays and Searching",
  subtitle: "Algorithms",
  categories: [
    ["r2-idx", "Index and Value"],
    ["r2-loop", "Arrays and Loops"],
    ["r2-search", "Linear Search"],
    ["r2-mix", "Mixed Practice"]
  ],
  cards: (function () {
    function n(x) { return new RegExp("^\\s*" + x + "\\s*$"); }
    function word(w) { return new RegExp("^\\s*[\"']?\\s*" + w + "\\s*[\"']?\\s*[.!]?\\s*$", "i"); }
    function wrong(answer, list) {
      var out = [];
      list.forEach(function (x) { x = String(x); if (x !== String(answer) && out.indexOf(x) < 0) out.push(x); });
      return out;
    }
    // Run a program (hidden setup lines first) in the pseudocode engine.
    function run(lines, inputs, setup) {
      var r = PseudocodeEngine.runPseudocode((setup || []).concat(lines).join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r;
    }
    function out(lines, inputs, setup) { return run(lines, inputs, setup).outputs.map(String); }
    function fill(name, type, vals) {
      return ["DECLARE " + name + " : ARRAY[1:" + vals.length + "] OF " + type].concat(vals.map(function (v, i) {
        return name + "[" + (i + 1) + "] <- " + (type === "STRING" ? "\"" + v + "\"" : v);
      }));
    }
    function holds(name, vals) { return name + " holds " + vals.join(", ") + " at index 1 to " + vals.length + "."; }
    // n different values from a list, in random order
    function some(list, k) {
      var pool = list.slice(), outv = [];
      while (outv.length < k) outv.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      return outv;
    }
    function search(arr, size, type) {
      return ["DECLARE Search : " + type, "DECLARE Found : BOOLEAN", "DECLARE Index : INTEGER", "INPUT Search", "Found <- FALSE",
        "FOR Index <- 1 TO " + size, "  IF " + arr + "[Index] = Search THEN", "    Found <- TRUE", "  ENDIF", "NEXT Index",
        "IF Found = TRUE THEN", "  OUTPUT \"Found\"", "ELSE", "  OUTPUT \"Not Found\"", "ENDIF"];
    }
    function total(arr, to) {
      return ["DECLARE Total : INTEGER", "DECLARE Index : INTEGER", "Total <- 0", "FOR Index <- 1 TO " + to, "  Total <- Total + " + arr + "[Index]", "NEXT Index", "OUTPUT Total"];
    }
    var BIG = [5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    return [
      // ------------------------------------------------ Index and Value
      { id: "r2-01", category: "r2-idx", randomize: function () {
          var v = some(BIG, 4), i = drillPick([1, 2, 3, 4]);
          var a = out(["OUTPUT Marks[" + i + "]"], [], fill("Marks", "INTEGER", v))[0];
          return { prompt: holds("Marks", v) + " What is output?\nOUTPUT Marks[" + i + "]",
            answers: [a], keywords: [n(a)], distractors: wrong(a, [i].concat(v)).slice(0, 3),
            working: ["The number in [ ] is the index: the position.", "Count along to index " + i + ". Read the value there."],
            note: "Index " + i + " holds " + a + "." };
        } },
      { id: "r2-02", category: "r2-idx", randomize: function () {
          var v = some(BIG, 4), i = drillPick([1, 2, 3, 4]), target = v[i - 1];
          return { prompt: holds("Scores", v) + " Which index holds the value " + target + "?",
            answers: [String(i)], keywords: [new RegExp("^\\s*(index\\s*)?" + i + "\\s*$", "i")], distractors: wrong(i, [1, 2, 3, 4, target]).slice(0, 3),
            working: ["Find " + target + " in the list.", "Count its position: the first value is index 1."],
            note: target + " is at index " + i + "." };
        } },
      { id: "r2-03", category: "r2-idx", randomize: function () {
          var v = some(BIG, 4), i = drillPick([1, 2]), j = drillPick([3, 4]);
          var a = out(["OUTPUT Ages[" + i + "] + Ages[" + j + "]"], [], fill("Ages", "INTEGER", v))[0];
          return { prompt: holds("Ages", v) + " What is output?\nOUTPUT Ages[" + i + "] + Ages[" + j + "]",
            answers: [a], keywords: [n(a)], distractors: wrong(a, [i + j, v[i - 1], v[j - 1], v[i] + v[j - 2]]).slice(0, 3),
            working: ["Find the value at index " + i + " and the value at index " + j + ".", "Add the two values, not the indexes."],
            note: "Ages[" + i + "] is " + v[i - 1] + ", Ages[" + j + "] is " + v[j - 1] + ". The output is " + a + "." };
        } },
      { id: "r2-04", category: "r2-idx", randomize: function () {
          var k = drillPick([3, 4, 5, 6, 8, 10]), name = drillPick(["Marks", "Prices", "Goals"]);
          return { prompt: "How many values can this array hold?\nDECLARE " + name + " : ARRAY[1:" + k + "] OF INTEGER",
            answers: [String(k)], keywords: [new RegExp("^\\s*" + k + "(\\s*values?)?\\s*$", "i")], distractors: wrong(k, [k - 1, k + 1, 1]),
            working: ["[1:" + k + "] means index 1 up to index " + k + ".", "Count the indexes from the first to the last."],
            note: "Index 1 to " + k + ": " + k + " values." };
        } },
      { id: "r2-05", category: "r2-idx", randomize: function () {
          var v = some(BIG, 3), add = drillPick([1, 2, 5]);
          var lines = ["Marks[2] <- Marks[1] + " + add, "OUTPUT Marks[2]"];
          var a = out(lines, [], fill("Marks", "INTEGER", v))[0];
          return { prompt: holds("Marks", v) + " What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [n(a)], distractors: wrong(a, [v[1], v[1] + add, 2 + add, v[0]]).slice(0, 3),
            working: ["Line 1 reads the value at index 1, then adds " + add + ".", "It stores the answer at index 2, in place of the old value."],
            note: "Marks[1] is " + v[0] + ". " + v[0] + " + " + add + " = " + a + " goes into Marks[2]." };
        } },

      // ------------------------------------------------ Arrays and Loops
      { id: "r2-06", category: "r2-loop", randomize: function () {
          var v = some(BIG, 3), lines = total("Prices", 3);
          var a = out(lines, [], fill("Prices", "INTEGER", v))[0];
          return { prompt: holds("Prices", v) + " What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [n(a)], distractors: wrong(a, [v[2], v[0] + v[1], 3, 6]).slice(0, 3),
            working: ["Total starts at 0. Index goes 1, 2, 3.", "Each time round, add Prices[Index], the value at that index."],
            note: "0 + " + v.join(" + ") + " = " + a + "." };
        } },
      { id: "r2-07", category: "r2-loop", randomize: function () {
          var v = some(BIG, 4), k = drillPick([2, 3]), lines = total("Coins", 4);
          var a = String(run(total("Coins", k), [], fill("Coins", "INTEGER", v)).vars.Total);
          return { prompt: holds("Coins", v) + " What is Total after line 5 runs with Index = " + k + "?\n" + lines.join("\n"),
            answers: [a], keywords: [n(a)], distractors: wrong(a, [v[k - 1], v.reduce(function (s, x) { return s + x; }, 0), v[0] + v[k]]).slice(0, 3),
            working: ["Index = 1 adds Coins[1]. Index = 2 adds Coins[2].", "Stop after Index = " + k + ". Do not add any more."],
            note: "After Index = " + k + ", Total = " + v.slice(0, k).join(" + ") + " = " + a + "." };
        } },
      { id: "r2-08", category: "r2-loop", randomize: function () {
          var v = some(BIG, 4), to = drillPick([2, 3]), lines = total("Bags", to);
          var a = out(lines, [], fill("Bags", "INTEGER", v))[0];
          var all = v.reduce(function (s, x) { return s + x; }, 0);
          return { prompt: holds("Bags", v) + " What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [n(a)], distractors: wrong(a, [all, v[to - 1], to]).slice(0, 3),
            working: ["Read the FOR line. Index stops at " + to + ".", "Add only the values at index 1 to " + to + "."],
            note: "Only index 1 to " + to + " are added: " + v.slice(0, to).join(" + ") + " = " + a + "." };
        } },
      { id: "r2-09", category: "r2-loop", randomize: function () {
          var to = drillPick([3, 4, 5, 6]);
          var lines = ["DECLARE Index : INTEGER", "FOR Index <- 1 TO " + to, "  OUTPUT Names[Index]", "NEXT Index"];
          var names = ["Ana", "Ben", "Chen", "Dina", "Eli", "Fay"].slice(0, to);
          var a = String(out(lines, [], fill("Names", "STRING", names)).length);
          return { prompt: "Names holds " + to + " names. How many times does line 3 run?\n" + lines.join("\n"),
            answers: [a], keywords: [new RegExp("^\\s*" + a + "(\\s*times?)?\\s*$", "i")], distractors: wrong(a, [to - 1, to + 1, 1]),
            working: ["Index starts at 1.", "Line 3 runs once for each value of Index, up to the end value."],
            note: "Index goes 1 to " + to + ", so line 3 runs " + a + " times." };
        } },
      { id: "r2-10", category: "r2-loop", randomize: function () {
          var v = some(BIG, 4), last = drillPick([true, false]);
          var lines = ["DECLARE Index : INTEGER", "FOR Index <- 1 TO 4", "  OUTPUT Points[Index]", "NEXT Index"];
          var outs = out(lines, [], fill("Points", "INTEGER", v)), a = last ? outs[outs.length - 1] : outs[0];
          return { prompt: holds("Points", v) + " What is the " + (last ? "LAST" : "FIRST") + " number output?\n" + lines.join("\n"),
            answers: [a], keywords: [n(a)], distractors: wrong(a, [v[0], v[3], last ? 4 : 1, v[1]]).slice(0, 3),
            working: ["Index starts at 1 and stops at 4.", "Each time round, line 3 outputs the value at that index."],
            note: "The outputs are " + outs.join(", ") + "." };
        } },

      // ------------------------------------------------ Linear Search
      { id: "r2-11", category: "r2-search", randomize: function () {
          var v = some(BIG, 4), hit = drillPick([true, false]);
          var s = hit ? drillPick(v) : drillPick(BIG.filter(function (x) { return v.indexOf(x) < 0; }));
          var lines = search("Numbers", 4, "INTEGER"), a = out(lines, [s], fill("Numbers", "INTEGER", v))[0];
          return { prompt: holds("Numbers", v) + " The user types " + s + ". What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [a === "Found" ? word("found") : word("not\\s*found")], distractors: [a === "Found" ? "Not Found" : "Found", "TRUE"],
            working: ["Check each value in Numbers, from index 1. Is it " + s + "?", "A match sets Found to TRUE. After the loop, line 11 checks Found."],
            note: hit ? s + " is at index " + (v.indexOf(s) + 1) + ", so Found becomes TRUE." : s + " is not in Numbers, so Found stays FALSE." };
        } },
      { id: "r2-12", category: "r2-search", randomize: function () {
          var pets = some(["Cat", "Dog", "Fish", "Hen", "Duck", "Goat"], 3), hit = drillPick([true, false]);
          var s = hit ? drillPick(pets) : drillPick(["Cow", "Frog", "Owl"]);
          var lines = search("Pets", 3, "STRING"), a = out(lines, [s], fill("Pets", "STRING", pets))[0];
          return { prompt: "Pets holds \"" + pets.join("\", \"") + "\" at index 1 to 3. The user types " + s + ". What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [a === "Found" ? word("found") : word("not\\s*found")], distractors: [a === "Found" ? "Not Found" : "Found", "FALSE"],
            working: ["Compare " + s + " with each pet in turn.", "Found starts FALSE. Only a match changes it to TRUE."],
            note: hit ? s + " matches at index " + (pets.indexOf(s) + 1) + ": Found." : "No pet is " + s + ": Not Found." };
        } },
      { id: "r2-13", category: "r2-search", randomize: function () {
          var v = some(BIG, 4), hit = drillPick([true, false]);
          var s = hit ? drillPick(v) : drillPick(BIG.filter(function (x) { return v.indexOf(x) < 0; }));
          var lines = search("Codes", 4, "INTEGER"), f = run(lines, [s], fill("Codes", "INTEGER", v)).vars.Found;
          var a = f ? "TRUE" : "FALSE";
          return { prompt: holds("Codes", v) + " The user types " + s + ". What is Found after the loop?\n" + lines.join("\n"),
            answers: [a], keywords: [word(a.toLowerCase())], distractors: [f ? "FALSE" : "TRUE", "Found"],
            working: ["Found starts as FALSE on line 5.", "Does any value in Codes equal " + s + "? Only a match sets Found to TRUE."],
            note: hit ? s + " is in Codes, so Found is TRUE." : s + " is not in Codes, so Found stays FALSE." };
        } },
      { id: "r2-14", category: "r2-search", randomize: function () {
          var v = some(BIG, 4), i = drillPick([1, 2, 3]), s = v[i - 1];
          var lines = search("Numbers", 4, "INTEGER"), f = run(lines, [s], fill("Numbers", "INTEGER", v)).vars.Found;
          var a = f ? "TRUE" : "FALSE";
          return { prompt: holds("Numbers", v) + " The user types " + s + ". It matches at index " + i + ". Then index " + (i + 1) + " does not match. What is Found now?\n" + lines.join("\n"),
            answers: [a], keywords: [word(a.toLowerCase())], distractors: [f ? "FALSE" : "TRUE"],
            working: ["Which lines can change Found? Look at line 5 and line 8.", "Line 5 runs once, before the loop. Inside the loop, only line 8 changes Found."],
            note: "Nothing sets Found back to FALSE, so it stays " + a + "." };
        } },
      { id: "r2-15", category: "r2-search", randomize: function () {
          var arr = drillPick(["Numbers", "Ages", "Codes"]);
          var lines = search(arr, 4, "INTEGER").map(function (l, k) { return k === 7 ? "    ........" : l; });
          return { prompt: "Line 8 is missing. Write line 8.\n" + lines.join("\n"),
            answers: ["Found <- TRUE"], keywords: [/^\s*found\s*(<-|\u2190|<--)\s*true\s*$/i], format: "Type the whole line",
            distractors: ["Found <- FALSE", "Found = TRUE", "OUTPUT \"Found\""],
            working: ["Line 8 runs when " + arr + "[Index] = Search: an item matches.", "A match changes the flag. Use the arrow to store a value."],
            note: "Found <- TRUE: a match sets the flag." };
        } },

      // ------------------------------------------------ Mixed Practice
      { id: "r2-16", category: "r2-mix", randomize: function () {
          var p = drillPick([6, 8, 10, 11, 12, 15]);
          var lines = ["DECLARE Price : INTEGER", "INPUT Price", "Price <- Price * 2", "IF Price > 20 THEN", "  OUTPUT \"Big\"", "ELSE", "  OUTPUT \"Small\"", "ENDIF"];
          var a = out(lines, [p])[0];
          return { prompt: "The user types " + p + ". What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [word(a)], distractors: [a === "Big" ? "Small" : "Big", "Big and Small"],
            working: ["Work out Price after line 3 first.", "Then ask: is that number more than 20?"],
            note: p + " * 2 = " + (p * 2) + ". " + (p * 2) + " > 20 is " + (p * 2 > 20 ? "TRUE" : "FALSE") + ", so " + a + "." };
        } },
      { id: "r2-17", category: "r2-mix", randomize: function () {
          var k = drillPick([2, 3, 4, 5]), add = drillPick([2, 3, 5, 10]);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- 0", "FOR Count <- 1 TO " + k, "  Total <- Total + " + add, "NEXT Count", "OUTPUT Total"];
          var a = out(lines)[0];
          return { prompt: "What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [n(a)], distractors: wrong(a, [add, k + add, k, k * add + add]).slice(0, 3),
            working: ["How many times does the loop run?", "Each time, add " + add + " to Total. Total starts at 0."],
            note: k + " lots of " + add + " = " + a + "." };
        } },
      { id: "r2-18", category: "r2-mix", randomize: function () {
          var s = drillPick([["INPUT Age", "Input/Output", /^\s*(an?\s+)?(input\s*(\/|or|and)?\s*output|input|output)(\s+(symbol|shape|box))?\s*$/i, "It takes a value in from the user."],
            ["OUTPUT Total", "Input/Output", /^\s*(an?\s+)?(input\s*(\/|or|and)?\s*output|input|output)(\s+(symbol|shape|box))?\s*$/i, "It shows a value."],
            ["IF Age > 12 THEN", "Decision", /^\s*(a\s+)?(decision|diamond)(\s+(symbol|shape|box))?\s*$/i, "It asks a question with a Yes and a No path."],
            ["Total <- 0", "Process", /^\s*(a\s+)?(process|rectangle)(\s+(symbol|shape|box))?\s*$/i, "It stores a value."]]);
          var names = ["Decision", "Process", "Input/Output", "Terminal"];
          return { prompt: "In a flowchart, which shape is used for this line?\n" + s[0], answers: [s[1]], keywords: [s[2]],
            distractors: names.filter(function (x) { return x !== s[1]; }),
            working: ["Does the line take a value in or show one? Does it ask a question? Does it store a value?", "Terminal is only for Start and End."],
            note: s[1] + ": " + s[3] };
        } },
      { id: "r2-19", category: "r2-mix", randomize: function () {
          var lim = drillPick([30, 40, 50]), gt = drillPick([true, false]), m = lim - drillPick([0, 0, 1, 5]);
          var lines = ["DECLARE Mark : INTEGER", "INPUT Mark", "IF Mark " + (gt ? ">" : ">=") + " " + lim + " THEN", "  OUTPUT \"Pass\"", "ELSE", "  OUTPUT \"Fail\"", "ENDIF"];
          var a = out(lines, [m])[0];
          return { prompt: "The user types " + m + ". What is output?\n" + lines.join("\n"),
            answers: [a], keywords: [word(a)], distractors: [a === "Pass" ? "Fail" : "Pass", "Pass and Fail"],
            working: [(gt ? "> means more than." : ">= means more than or equal to.") + " Read the symbol on line 3.", "TRUE runs the THEN line. FALSE runs the ELSE line."],
            note: m + " " + (gt ? ">" : ">=") + " " + lim + " is " + (a === "Pass" ? "TRUE" : "FALSE") + ", so " + a + "." };
        } },
      { id: "r2-20", category: "r2-mix", randomize: function () {
          var v = some(BIG, 4), lim = drillPick([10, 12, 15]);
          var lines = ["DECLARE Index : INTEGER", "FOR Index <- 1 TO 4", "  IF Ages[Index] > " + lim + " THEN", "    OUTPUT Ages[Index]", "  ENDIF", "NEXT Index"];
          var outs = out(lines, [], fill("Ages", "INTEGER", v)), a = String(outs.length);
          return { prompt: holds("Ages", v) + " How many numbers are output?\n" + lines.join("\n"),
            answers: [a], keywords: [new RegExp("^\\s*" + a + "(\\s*numbers?)?\\s*$", "i")], distractors: wrong(a, [0, 1, 2, 3, 4]).slice(0, 3),
            working: ["The loop checks all 4 values, one at a time.", "A value is output only when it is more than " + lim + "."],
            note: outs.length ? "Output: " + outs.join(", ") + "." : "No value is more than " + lim + ", so nothing is output." };
        } }
    ];
  })()
});
