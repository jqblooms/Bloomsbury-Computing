// Year 11, 8.1 L5: String Handling (Plenary)
// Loaded by Drills/index.html?drill=y11-8-1-strings. Written by tools/build_y11_8_1_strings.mjs: edit the builder.
// LENGTH, SUBSTRING (first character at position 1, the third value is how many), UCASE and LCASE, and why each
// gives its answer. Words are drawn fresh; every answer comes from running it in shared/pseudocode-engine.js. Text
// answers keep their case: a card that turns "yes" into "YES" must not accept "yes".
DrillData.register("y11-8-1-strings", {
  title: "Year 11, 8.1 L5: String Handling",
  subtitle: "Cambridge IGCSE Computer Science 0478",
  categories: [
    ["st-len", "LENGTH"],
    ["st-sub", "SUBSTRING"],
    ["st-case", "UCASE and LCASE"],
    ["st-why", "Why It Works"]
  ],
  cards: (function () {
    function code() { return Array.prototype.slice.call(arguments).join("\n"); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function word(w) { return new RegExp("^\\s*" + w + "\\s*$", "i"); }
    // A text answer: capital letters matter, quote marks are optional.
    function text(s) { return new RegExp("^\\s*[\"'\u201c\u201d\u2018\u2019]?" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+") + "[\"'\u201c\u201d\u2018\u2019]?\\s*$"); }
    function tfText(b) { return b ? "TRUE" : "FALSE"; }
    function tfCard(b) { var a = tfText(b); return { answers: [a], keywords: [word(a)], distractors: [tfText(!b)] }; }
    // Every answer comes from running the program in the site's pseudocode engine.
    function run(src, vars) {
      var r = PseudocodeEngine.runPseudocode(src, vars || {}, 5000, []);
      if (r.error) throw new Error("Line " + r.error.line + ": " + r.error.message);
      return r.outputs;
    }
    function val(expr, vars) { return run("OUTPUT " + expr, vars)[0]; }
    function others(n, list) { return drillWrongNumbers(n, list.filter(function (v) { return v !== n && v >= 0; }).concat([n + 1, n + 2, n + 3, n + 4]), 3); }
    function uniq(answer, list) { var out = []; list.forEach(function (d) { if (d !== answer && out.indexOf(d) === -1 && out.length < 3) out.push(d); }); return out; }
    var ARROW = "\\s*(<-|\u2190)\\s*";
    var WORDS = ["Computer", "Keyboard", "Monitor", "Printer", "Network", "Program", "Laptop", "Science", "Speaker", "Library"];
    var PHRASES = ["Hat Yai", "Big Data", "Hello World", "Year 11", "Thai Food", "Main Hall"];
    function sentence(re1, re2, not) { return new RegExp("^" + (not ? "(?!.*\\b(" + not + ")\\b)" : "") + "(?=.*\\b(" + re1 + ")\\b)(?=.*\\b(" + re2 + ")\\b)", "i"); }

    return [
      // ------------------------------------------------ LENGTH
      { id: "len-01", category: "st-len", randomize: function () {
          var w = drillPick(WORDS), n = val("LENGTH(\"" + w + "\")");
          return { prompt: "What does LENGTH(\"" + w + "\") return?", answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - 1, n + 1, n - 2]),
            working: ["Count every character, one at a time.", "LENGTH gives a number: how many characters."],
            note: "\"" + w + "\" has " + n + " characters." };
        } },
      { id: "len-02", category: "st-len", randomize: function () {
          var p = drillPick(PHRASES), n = val("LENGTH(\"" + p + "\")");
          return { prompt: "What does LENGTH(\"" + p + "\") return?", answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [n - 1, n + 1, n - 2]),
            working: ["Count the letters and the digits.", "A space is a character too."],
            note: "\"" + p + "\" has " + n + " characters, and the space is one of them." };
        } },
      { id: "len-03", category: "st-len", randomize: function () {
          var w = drillPick(WORDS), k = pick(1, 5);
          var src = code("DECLARE Word : STRING", "DECLARE Size : INTEGER", "Word <- \"" + w + "\"", "Size <- LENGTH(Word) + " + k, "OUTPUT Size");
          var r = run(src)[0];
          return { prompt: "What is output?\n" + src, answers: [String(r)], keywords: [drillNumberRe(r)], distractors: others(r, [r - k, r + 1, k]),
            working: ["Work out LENGTH(Word) first.", "Then add " + k + "."],
            note: "LENGTH(Word) is " + (r - k) + ", and " + (r - k) + " + " + k + " = " + r + "." };
        } },
      { id: "len-04", category: "st-len", randomize: function () {
          var v = drillPick([["Password", "Size"], ["Name", "Letters"], ["Code", "CodeLength"]]), ans = v[1] + " <- LENGTH(" + v[0] + ")";
          return { prompt: "Write the line that stores the number of characters in " + v[0] + " in the variable " + v[1] + ".",
            answers: [ans], keywords: [new RegExp("^\\s*" + v[1] + ARROW + "LENGTH\\s*\\(\\s*" + v[0] + "\\s*\\)\\s*$", "i")],
            distractors: [v[1] + " <- " + v[0], "LENGTH(" + v[0] + ") <- " + v[1], v[1] + " <- LENGTH(" + v[1] + ")"], format: "Type the whole line",
            example: "Example: store the number of characters in Town in the variable Count.\nThe variable comes first, then <-, then the function:\nCount <- LENGTH(Town)",
            working: ["The variable that stores the result comes first, then <-.", "LENGTH needs the string inside its brackets."],
            note: ans };
        } },
      { id: "len-05", category: "st-len", randomize: function () {
          var codeV = drillPick(["A7X2", "B12", "Z9QK", "M4", "K3PZ1", "QR77"]), r = run(code("IF LENGTH(Code) = 4 THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { Code: codeV })[0];
          var c = tfCard(r);
          c.prompt = "Code holds \"" + codeV + "\". Is the condition LENGTH(Code) = 4 TRUE or FALSE?";
          c.working = ["Work out LENGTH(Code) first: count the characters.", "Then ask: is that number equal to 4?"];
          c.note = "LENGTH(Code) is " + codeV.length + ", so LENGTH(Code) = 4 is " + tfText(r) + ".";
          return c;
        } },
      // ------------------------------------------------ SUBSTRING
      { id: "sub-01", category: "st-sub", randomize: function () {
          var w = drillPick(WORDS), k = pick(2, 4), r = val("SUBSTRING(\"" + w + "\", 1, " + k + ")");
          return { prompt: "What does SUBSTRING(\"" + w + "\", 1, " + k + ") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.substr(1, k), w.substr(0, k + 1), w.substr(0, k - 1), r.toUpperCase()]), format: "Type the text: capital letters matter",
            working: ["Position 1 is the first character.", "The third value says how many characters to take."],
            note: "Start at position 1 and take " + k + " characters: " + r + "." };
        } },
      { id: "sub-02", category: "st-sub", randomize: function () {
          var w, s, n; do { w = drillPick(WORDS); s = pick(2, 3); n = pick(3, 5); } while (s + n - 1 > w.length || n <= s);
          var r = val("SUBSTRING(\"" + w + "\", " + s + ", " + n + ")");
          return { prompt: "What does SUBSTRING(\"" + w + "\", " + s + ", " + n + ") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.substr(s - 1, n - s + 1), w.substr(s, n), w.substr(s - 1, n - 1)]), format: "Type the text: capital letters matter",
            working: ["Start at position " + s + ". Number the characters from 1 to find it.", "Then take " + n + " characters: " + n + " is how many, not where to stop."],
            note: "Start at position " + s + ", take " + n + " characters: " + r + "." };
        } },
      { id: "sub-03", category: "st-sub", randomize: function () {
          var w = drillPick(WORDS), r = val("SUBSTRING(Word, LENGTH(Word), 1)", { Word: w });
          return { prompt: "Word holds \"" + w + "\". What does SUBSTRING(Word, LENGTH(Word), 1) return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.charAt(0), w.charAt(w.length - 2), String(w.length), r.toUpperCase()]), format: "Type the text: capital letters matter",
            working: ["Work out LENGTH(Word) first. That is the start position.", "Then take 1 character from there."],
            note: "LENGTH(Word) is " + w.length + ", the position of the last character: " + r + "." };
        } },
      { id: "sub-04", category: "st-sub", randomize: function () {
          var v = drillPick([["Name", "Initial", 1, "first letter"], ["Postcode", "Area", 2, "first two characters"], ["Code", "Prefix", 3, "first three characters"]]);
          var ans = v[1] + " <- SUBSTRING(" + v[0] + ", 1, " + v[2] + ")";
          return { prompt: "Write the line that stores the " + v[3] + " of " + v[0] + " in the variable " + v[1] + ".",
            answers: [ans], keywords: [new RegExp("^\\s*" + v[1] + ARROW + "SUBSTRING\\s*\\(\\s*" + v[0] + "\\s*,\\s*1\\s*,\\s*" + v[2] + "\\s*\\)\\s*$", "i")],
            distractors: [v[1] + " <- SUBSTRING(" + v[0] + ", 0, " + v[2] + ")", v[1] + " <- SUBSTRING(" + v[0] + ", 2, " + v[2] + ")", v[1] + " <- SUBSTRING(" + v[0] + ", 1, " + (v[2] + 1) + ")"], format: "Type the whole line",
            example: "Example: store the first four characters of Phone in the variable Start.\nStart at position 1 and take 4 characters:\nStart <- SUBSTRING(Phone, 1, 4)",
            working: ["SUBSTRING needs the string, where to start, and how many characters.", "The first character is position 1."],
            note: ans };
        } },
      { id: "sub-05", category: "st-sub", randomize: function () {
          var w = drillPick(WORDS);
          var src = code("DECLARE Word : STRING", "Word <- \"" + w + "\"", "OUTPUT SUBSTRING(Word, LENGTH(Word) - 2, 3)");
          var r = run(src)[0];
          return { prompt: "What is output?\n" + src, answers: [r], keywords: [text(r)],
            distractors: uniq(r, [w.substr(w.length - 2, 2), w.substr(w.length - 4, 3), w.substr(0, 3)]), format: "Type the text: capital letters matter",
            working: ["Work out LENGTH(Word) - 2 first. That is the start position.", "Then take 3 characters from there."],
            note: "LENGTH(Word) - 2 is " + (w.length - 2) + ". Three characters from there are the last three: " + r + "." };
        } },
      { id: "sub-06", category: "st-sub", randomize: function () {
          var p = drillPick(PHRASES.filter(function (x) { return x !== "Year 11"; })), sp = p.indexOf(" "), ch = p.charAt(sp + 1), pos = sp + 2;
          var r = run(code("DECLARE Phrase : STRING", "Phrase <- \"" + p + "\"", "OUTPUT SUBSTRING(Phrase, " + pos + ", 1)"))[0];
          if (r !== ch) throw new Error("sub-06 position");
          return { prompt: "Phrase holds \"" + p + "\". At what position is the " + ch + "?", answers: [String(pos)], keywords: [drillNumberRe(pos)], distractors: others(pos, [pos - 1, pos + 1, pos - 2]),
            working: ["Number the characters from 1.", "The space has a position too."],
            note: "The space is position " + (sp + 1) + ", so the " + ch + " is position " + pos + "." };
        } },
      // ------------------------------------------------ UCASE and LCASE
      { id: "case-01", category: "st-case", randomize: function () {
          var w = drillPick(["Happy", "Bangkok", "Room 12b", "Hat Yai", "Science", "Year 11"]), r = val("UCASE(\"" + w + "\")");
          return { prompt: "What does UCASE(\"" + w + "\") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [r.toLowerCase(), w, r.charAt(0) + r.slice(1).toLowerCase()]), format: "Type the text: capital letters matter",
            working: ["UCASE changes small letters to capital letters.", "Digits and spaces stay the same."],
            note: "UCASE(\"" + w + "\") is \"" + r + "\"." };
        } },
      { id: "case-02", category: "st-case", randomize: function () {
          var w = drillPick(["PD12", "HELLO", "Hat Yai", "CODE 7", "Monday", "ICT"]), r = val("LCASE(\"" + w + "\")");
          return { prompt: "What does LCASE(\"" + w + "\") return?", answers: [r], keywords: [text(r)],
            distractors: uniq(r, [r.toUpperCase(), r.charAt(0).toUpperCase() + r.slice(1), w === r ? r.toUpperCase() : w]), format: "Type the text: capital letters matter",
            working: ["LCASE changes capital letters to small letters.", "Digits and spaces stay the same."],
            note: "LCASE(\"" + w + "\") is \"" + r + "\"." };
        } },
      { id: "case-03", category: "st-case", randomize: function () {
          var a = drillPick(["yes", "Yes", "YES", "yEs"]), up = Math.random() < 0.5;
          var cond = up ? "UCASE(Answer) = \"YES\"" : "Answer = \"YES\"";
          var r = run(code("IF " + cond + " THEN", "  OUTPUT TRUE", "ELSE", "  OUTPUT FALSE", "ENDIF"), { Answer: a })[0];
          var c = tfCard(r);
          c.prompt = "Answer holds \"" + a + "\". Is the condition " + cond + " TRUE or FALSE?";
          c.working = [up ? "Work out UCASE(Answer) first." : "= checks every character, and capital letters matter.", "Then compare it with \"YES\", character by character."];
          c.note = up ? "UCASE(Answer) is \"YES\", so the condition is TRUE." : "\"" + a + "\" = \"YES\" is " + tfText(r) + ": = checks the case of every letter.";
          return c;
        } },
      { id: "case-04", category: "st-case", randomize: function () {
          var n = drillPick(["sam", "mia", "leo", "omar", "zara", "ivy"]);
          var src = code("DECLARE Name : STRING", "DECLARE Big : STRING", "Name <- \"" + n + "\"", "Big <- UCASE(Name)", "OUTPUT Name");
          var r = run(src)[0];
          return { prompt: "What is output?\n" + src, answers: [r], keywords: [text(r)],
            distractors: uniq(r, [n.toUpperCase(), n.charAt(0).toUpperCase() + n.slice(1), "Big"]), format: "Type the text: capital letters matter",
            working: ["Which variable does OUTPUT show?", "Did any line store a new value in Name?"],
            note: "UCASE(Name) went into Big. Name still holds \"" + r + "\"." };
        } },
      { id: "case-05", category: "st-case", randomize: function () {
          var v = drillPick([["Reply", "UCASE", "upper"], ["Town", "UCASE", "upper"], ["Email", "LCASE", "lower"], ["Answer", "LCASE", "lower"]]), ans = v[0] + " <- " + v[1] + "(" + v[0] + ")";
          var other = v[1] === "UCASE" ? "LCASE" : "UCASE";
          return { prompt: "Write the line that changes " + v[0] + " to " + v[2] + " case and stores it back in " + v[0] + ".",
            answers: [ans], keywords: [new RegExp("^\\s*" + v[0] + ARROW + v[1] + "\\s*\\(\\s*" + v[0] + "\\s*\\)\\s*$", "i")],
            distractors: [v[1] + "(" + v[0] + ")", v[0] + " <- " + other + "(" + v[0] + ")", v[1] + "(" + v[0] + ") <- " + v[0]], format: "Type the whole line",
            example: "Example: change Code to lower case and keep it in Code.\nThe function gives back a new string, so store it back with <-:\nCode <- LCASE(Code)",
            working: ["On its own, the function changes nothing.", "Store the result back in " + v[0] + " with <-."],
            note: ans };
        } },
      { id: "case-06", category: "st-case", randomize: function () {
          var ans = "UCASE(Answer) = \"YES\"";
          // Names in any case; the word in quotes must be in the case the function makes.
          function ci(s) { return s.replace(/[a-z]/gi, function (ch) { return "[" + ch.toUpperCase() + ch.toLowerCase() + "]"; }); }
          var Q = "[\"'\u201c\u201d]", call = function (f) { return ci(f) + "\\s*\\(\\s*" + ci("Answer") + "\\s*\\)"; };
          var up = call("UCASE") + "\\s*=\\s*" + Q + "YES" + Q, lo = call("LCASE") + "\\s*=\\s*" + Q + "yes" + Q;
          var upR = Q + "YES" + Q + "\\s*=\\s*" + call("UCASE"), loR = Q + "yes" + Q + "\\s*=\\s*" + call("LCASE");
          return { prompt: "Write the condition that is TRUE when Answer holds yes, typed in any mix of capital and small letters.",
            answers: [ans], keywords: [new RegExp("^\\s*(" + up + "|" + lo + "|" + upR + "|" + loR + ")\\s*$")],
            distractors: ["Answer = \"YES\"", "UCASE(Answer) = \"yes\"", "Answer = \"yes\""], format: "Type the condition",
            example: "Example: TRUE when Town holds rome, in any case.\nChange Town to one case first, then compare it with the same word in that case:\nUCASE(Town) = \"ROME\"",
            working: ["Change Answer to one case first.", "Compare it with yes written in that same case."],
            note: "UCASE(Answer) = \"YES\" is TRUE for yes, Yes and YES. LCASE(Answer) = \"yes\" works too." };
        } },
      // ------------------------------------------------ Why it works (two connected ideas each)
      { id: "why-01", category: "st-why", prompt: "Why does SUBSTRING(\"Computer\", 1, 3) give \"Com\"?",
        answers: ["It starts at position 1 and takes 3 characters."],
        keywords: [sentence("start|starts|starting|begin|begins|first|position 1", "3 characters|three characters|3 letters|three letters|how many|3 long|three long|takes 3|takes three|length")],
        distractors: ["It starts at position 0 and stops at position 3.", "It counts back 3 characters from the end.", "Position 3 is where SUBSTRING stops taking letters."],
        working: ["What does the 1 tell SUBSTRING?", "What does the 3 tell SUBSTRING?"],
        note: "1 is where to start, and the first character is position 1. 3 is how many characters to take." },
      { id: "why-02", category: "st-why", prompt: "Why does a program check UCASE(Answer) = \"YES\" and not Answer = \"YES\"?",
        answers: ["Users type yes in any case, and = checks the case exactly."],
        keywords: [sentence("case|capital|capitals|upper|lower|small|yes", "same|exact|exactly|match|matches|different|any|every|all|whatever")],
        distractors: ["UCASE makes the comparison run faster than =.", "= cannot compare two strings without UCASE first.", "YES is a keyword, so it must be written in capitals."],
        working: ["The user might type yes, Yes or YES.", "Does = see y and Y as the same character?"],
        note: "= checks every character exactly, so yes and YES are different. UCASE changes the input to one case first." },
      { id: "why-03", category: "st-why", prompt: "After Big <- UCASE(Name), why does Name still hold small letters?",
        answers: ["UCASE gives back a new string, which is stored in Big."],
        keywords: [sentence("new|copy|returns|return|gives|result|value", "stored|store|stores|saved|put|goes|went|assigned|Big")],
        distractors: ["UCASE only works on a CHAR, and Name is a STRING.", "Name is a constant, so its value cannot be changed.", "Big must be declared before UCASE can change Name."],
        working: ["Does UCASE change the variable inside its brackets?", "Which variable does the arrow store the result in?"],
        note: "UCASE gives back a new string. The line stores it in Big, so Name does not change." },
      { id: "why-04", category: "st-why", prompt: "Why does FOR Count <- 1 TO LENGTH(Word) reach the last character of any word?",
        answers: ["LENGTH(Word) is the position of the last character."],
        keywords: [sentence("last|end|final", "length|characters|position|any|every|size|long")],
        distractors: ["The loop always runs 10 times, enough for most words.", "LENGTH starts the loop at position 0 of the word.", "LENGTH changes Word so that every word is 10 long."],
        working: ["How many characters does LENGTH(Word) count?", "Which position holds the last character?"],
        note: "The last character is at position LENGTH(Word), so the loop ends on it whatever the word is." },
      { id: "why-05", category: "st-why", prompt: "Why is LENGTH(\"Hat Yai\") 7 and not 6?",
        answers: ["The space is a character, so LENGTH counts it too."],
        keywords: [sentence("space|spaces|gap", "character|characters|counted|count|counts|counting")],
        distractors: ["LENGTH counts from 0, so it always adds one more.", "Capital letters count twice in the LENGTH function.", "LENGTH adds 1 at the end of every string it reads."],
        working: ["Count the letters: H, a, t, Y, a, i.", "What else is between the two words?"],
        note: "H, a, t, space, Y, a, i: the space is one of the 7 characters." }
    ];
  })()
});
