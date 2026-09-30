// Year 8, L7: Finding and Fixing Errors
// Loaded by Drills/index.html?drill=y8-algorithms-l7
// Four categories, mirroring the lesson: what syntax and logic errors are, finding the line with the error (and the
// test value that shows it), writing the corrected line, and errors in flowcharts. Every algorithm card is drawn
// fresh from the same Year 8 algorithms the lesson uses (sequence, selection, FOR totals, linear search), with one
// error planted. The exam card uses the errors from two real Paper 2 questions, cited in its note.
// The class race (mp4party, "Bug Hunt Race") runs this file itself, so the two can never disagree.
DrillData.register("y8-algorithms-l7", {
  title: "Year 8, L7: Finding and Fixing Errors",
  subtitle: "Cambridge Pseudocode and Flowcharts",
  categories: [
    ["errkinds", "Syntax and Logic Errors"],
    ["errfind", "Finding the Error"],
    ["errfix", "Fixing the Error"],
    ["errflow", "Errors in Flowcharts"]
  ],
  cards: (function () {
    var pick = drillPick;
    function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function numRe(n) { return new RegExp("^\\s*(line\\s*)?" + n + "\\s*$", "i"); }
    var TOKEN_RE = /"[^"]*"|<-|<=|>=|[A-Za-z_][A-Za-z0-9_]*|\d+|[\[\]():,+\-*\/=<>]/g;
    // A typed line matches when its tokens match one of the accepted lines, whatever the spacing or letter case.
    function lineRe(accepted) {
      return new RegExp("^\\s*(" + accepted.map(function (l) {
        return (l.trim().match(TOKEN_RE) || []).map(function (t) { return t === "<-" ? "(<-|\\u2190)" : reEsc(t); }).join("\\s*");
      }).join("|") + ")\\s*$", "i");
    }
    function listing(lines) { return lines.map(function (l, i) { return (i + 1) + "  " + l; }).join("\n"); }
    var KIND_RE = { syntax: /^\s*(a\s+)?syntax(\s+error)?\s*$/i, logic: /^\s*(a\s+)?logic(al)?(\s+error)?\s*$/i };

    // ---------------------------------------------------------------- the algorithms, each with its errors
    // bug: { line (0-based), bad, kind, fix: [accepted corrected lines] }
    function calc() {
      var v = pick([["Price", "Quantity", "Cost"], ["Length", "Width", "Area"], ["Hours", "Rate", "Pay"]]);
      var a = v[0], b = v[1], r = v[2];
      var ok = [r + " <- " + a + " * " + b, r + " <- " + b + " * " + a];
      return { purpose: "It should input " + a + " and " + b + ", then output " + a + " multiplied by " + b + ".",
        lines: ["DECLARE " + a + " : INTEGER", "DECLARE " + b + " : INTEGER", "DECLARE " + r + " : INTEGER", "INPUT " + a, "INPUT " + b, ok[0], "OUTPUT " + r],
        bugs: [
          { line: 5, bad: r + " <- " + a + " + " + b, kind: "logic", fix: ok },
          { line: 4, bad: "OUTPUT " + b, kind: "logic", fix: ["INPUT " + b] },
          { line: 6, bad: "OUTPUT " + a, kind: "logic", fix: ["OUTPUT " + r] },
          { line: 5, bad: r + " = " + a + " * " + b, kind: "syntax", fix: ok },
          { line: 3, bad: "INPT " + a, kind: "syntax", fix: ["INPUT " + a] }
        ] };
    }
    function passFail() {
      var v = pick([["Mark", "Pass", "Fail"], ["Age", "Allowed", "Too young"], ["Score", "Winner", "Try again"]]);
      var n = v[0], cut = drillRange(3, 8) * 10;
      return { purpose: "It should output \"" + v[1] + "\" if " + n + " is " + cut + " or more, otherwise \"" + v[2] + "\".",
        lines: ["DECLARE " + n + " : INTEGER", "INPUT " + n, "IF " + n + " >= " + cut + " THEN", "    OUTPUT \"" + v[1] + "\"", "ELSE", "    OUTPUT \"" + v[2] + "\"", "ENDIF"],
        cut: cut,
        bugs: [
          { line: 2, bad: "IF " + n + " > " + cut + " THEN", kind: "logic", fix: ["IF " + n + " >= " + cut + " THEN"], boundary: true },
          { line: 2, bad: "IF " + n + " < " + cut + " THEN", kind: "logic", fix: ["IF " + n + " >= " + cut + " THEN"] },
          { line: 3, bad: "    OUTPUT \"" + v[2] + "\"", kind: "logic", fix: ["OUTPUT \"" + v[1] + "\""] },
          { line: 1, bad: "OUTPUT " + n, kind: "logic", fix: ["INPUT " + n] },
          { line: 2, bad: "IF " + n + " >= " + cut, kind: "syntax", fix: ["IF " + n + " >= " + cut + " THEN"] },
          { line: 6, bad: "END", kind: "syntax", fix: ["ENDIF"] }
        ] };
    }
    function forTotal() {
      var v = pick([["Total", "Score"], ["Sum", "Number"], ["Total", "Mark"]]), t = v[0], x = v[1], k = drillRange(3, 6);
      var ok = [t + " <- " + t + " + " + x, t + " <- " + x + " + " + t];
      return { purpose: "It should input " + k + " numbers and output their total.",
        lines: ["DECLARE " + t + " : INTEGER", "DECLARE Count : INTEGER", "DECLARE " + x + " : INTEGER", t + " <- 0", "FOR Count <- 1 TO " + k, "    INPUT " + x, "    " + ok[0], "NEXT Count", "OUTPUT " + t],
        bugs: [
          { line: 3, bad: t + " <- 1", kind: "logic", fix: [t + " <- 0"] },
          { line: 4, bad: "FOR Count <- 1 TO " + (k - 1), kind: "logic", fix: ["FOR Count <- 1 TO " + k] },
          { line: 6, bad: "    " + t + " <- " + t + " + Count", kind: "logic", fix: ok },
          { line: 8, bad: "OUTPUT " + x, kind: "logic", fix: ["OUTPUT " + t] },
          { line: 3, bad: t + " = 0", kind: "syntax", fix: [t + " <- 0"] },
          { line: 4, bad: "FOR Count 1 TO " + k, kind: "syntax", fix: ["FOR Count <- 1 TO " + k] }
        ] };
    }
    function search() {
      return { purpose: "It should output \"Found\" if Target is anywhere in the 5 items of Values, otherwise \"Not found\".",
        lines: ["DECLARE Target : INTEGER", "DECLARE Found : BOOLEAN", "DECLARE Index : INTEGER", "INPUT Target", "Found <- FALSE", "FOR Index <- 1 TO 5",
          "    IF Values[Index] = Target THEN", "        Found <- TRUE", "    ENDIF", "NEXT Index",
          "IF Found = TRUE THEN", "    OUTPUT \"Found\"", "ELSE", "    OUTPUT \"Not found\"", "ENDIF"],
        bugs: [
          { line: 4, bad: "Found <- TRUE", kind: "logic", fix: ["Found <- FALSE"] },
          { line: 5, bad: "FOR Index <- 1 TO 4", kind: "logic", fix: ["FOR Index <- 1 TO 5"] },
          { line: 6, bad: "    IF Values[1] = Target THEN", kind: "logic", fix: ["IF Values[Index] = Target THEN", "IF Target = Values[Index] THEN"] },
          { line: 7, bad: "        Found <- FALSE", kind: "logic", fix: ["Found <- TRUE"] },
          { line: 4, bad: "Found = FALSE", kind: "syntax", fix: ["Found <- FALSE"] },
          { line: 6, bad: "    IF Values[Index] = Target", kind: "syntax", fix: ["IF Values[Index] = Target THEN", "IF Target = Values[Index] THEN"] }
        ] };
    }
    var ALGORITHMS = [calc, passFail, forTotal, search];

    // One algorithm with one of its errors planted; `only` limits the kind of error.
    function planted(only) {
      var a = pick(ALGORITHMS)();
      var bugs = a.bugs.filter(function (b) { return !only || b.kind === only; });
      var bug = pick(bugs), lines = a.lines.slice();
      lines[bug.line] = bug.bad;
      return { a: a, bug: bug, lines: lines };
    }
    // Three other line numbers of the listing, as wrong options.
    function otherLines(p) {
      var out = [];
      while (out.length < 3) {
        var n = String(drillRange(1, p.lines.length));
        if (n !== String(p.bug.line + 1) && out.indexOf(n) === -1) out.push(n);
      }
      return out;
    }

    // ---------------------------------------------------------------- Syntax and Logic Errors
    var kindsCards = [
      { id: "l7-syntax-def", category: "errkinds",
        prompt: "What is a syntax error?",
        answers: ["A line that breaks the rules of the language, so the program cannot run"],
        keywords: [/(rule|grammar|spell|keyword|language|written\s+wrong|incorrect(ly)?\s+written).*(not|n't|cannot|unable|won't|stop|fail)|(not|n't|cannot|unable|won't|stop|fail).*(run|translat|execut).*(rule|grammar|spell|keyword|language)/i],
        distractors: ["The program runs but gives the wrong output", "A value typed in by the user", "A loop that runs one time too many"],
        working: ["Think about a misspelt keyword such as OUTPT.", "Can the computer run a line it cannot understand?"],
        note: "A syntax error breaks the rules of writing the language (a misspelt keyword, = instead of <-, a missing THEN), so the program cannot run at all." },
      { id: "l7-logic-def", category: "errkinds",
        prompt: "What is a logic error?",
        answers: ["The program runs but gives the wrong result"],
        keywords: [/(run|works|execut|no\s+error).*(wrong|incorrect|unexpected|not\s+what)|(wrong|incorrect|unexpected).*(output|result|answer).*(run|still|but)/i],
        distractors: ["A misspelt keyword, so the program cannot run", "A line with = instead of <-", "A missing ENDIF"],
        working: ["Think about Total <- 1 where it should be Total <- 0.", "Does that line stop the algorithm running, or does it run and give something else?"],
        note: "A logic error does not stop the program: it runs, but does the wrong thing, so the output is wrong." },
      { id: "l7-reported", category: "errkinds",
        prompt: "Which kind of error stops an algorithm running at all, with a message giving the line number?",
        answers: ["A syntax error"], keywords: [KIND_RE.syntax],
        distractors: ["A logic error", "A test value", "An output"],
        working: ["One kind of error breaks a rule of writing pseudocode.", "The computer can only point to a line it cannot understand."],
        note: "The computer cannot understand a line that breaks the rules, so the algorithm cannot run and the line is reported: a syntax error. A logic error has to be found by testing." }
    ];
    function classify(id) {
      return { id: id, category: "errkinds", randomize: function () {
        var p = planted(Math.random() < 0.5 ? "syntax" : "logic");
        var kind = p.bug.kind, ans = kind === "syntax" ? "Syntax error" : "Logic error";
        return { prompt: p.a.purpose + " Line " + (p.bug.line + 1) + " has an error. Is it a syntax error or a logic error?\n" + listing(p.lines),
          answers: [ans], keywords: [KIND_RE[kind]], distractors: [kind === "syntax" ? "Logic error" : "Syntax error", "No error", "Both"],
          working: ["Could the translator understand line " + (p.bug.line + 1) + " as it is written?", "If the line follows the rules but does the wrong thing, the program still runs."],
          note: kind === "syntax" ? "Line " + (p.bug.line + 1) + " breaks a rule of writing pseudocode, so the algorithm cannot run: a syntax error."
            : "Line " + (p.bug.line + 1) + " follows the rules, so the algorithm runs, but it gives the wrong output: a logic error." };
      } };
    }

    // ---------------------------------------------------------------- Finding the Error
    function findLine(id) {
      return { id: id, category: "errfind", randomize: function () {
        var p = planted(), n = p.bug.line + 1;
        return { prompt: p.a.purpose + " Which line has the error?\n" + listing(p.lines),
          answers: [String(n)], keywords: [numRe(n)], distractors: otherLines(p),
          working: ["Read the purpose first, then check each line does what it asks.", "Try a test value: follow it line by line and find where the algorithm goes differently from the purpose."],
          note: "Line " + n + " should be " + p.bug.fix[0].trim() + "." };
      } };
    }
    function boundary(id) {
      return { id: id, category: "errfind", randomize: function () {
        var v = pick([["Mark", "Pass", drillRange(3, 8) * 10], ["Score", "Winner", drillRange(3, 9) * 10], ["Age", "Allowed", pick([12, 13, 16, 18])]]);
        var n = v[0], cut = v[2];
        return { prompt: "An algorithm should output \"" + v[1] + "\" when " + n + " is " + cut + " or more. It uses IF " + n + " > " + cut + " THEN. Which input value shows this error?",
          answers: [String(cut)], keywords: [numRe(cut)], distractors: [String(cut + 1), String(cut - 1), String(cut + 10)],
          working: ["For most values, > and >= give the same result.", "Find the one value where \"" + cut + " or more\" is TRUE but \"more than " + cut + "\" is FALSE."],
          note: "Only " + cut + " itself is treated differently: it should output \"" + v[1] + "\", but " + cut + " > " + cut + " is FALSE." };
      } };
    }
    var findCards = [
      findLine("l7-find-1"), findLine("l7-find-2"), findLine("l7-find-3"), boundary("l7-boundary"),
      { id: "l7-compare", category: "errfind",
        prompt: "When you test an algorithm with a test value, what do you compare?",
        answers: ["The expected output with the actual output"],
        keywords: [/(expect|should|correct|right).*(actual|real|get|gives|produce|output)|(actual|real).*(expect|should|correct)/i],
        distractors: ["The number of lines with the number of variables", "The first line with the last line", "INPUT with OUTPUT"],
        working: ["Before you run it, the purpose tells you what should happen.", "After you run it, you see what did happen."],
        note: "Work out what the output should be, run (or trace) the algorithm, and compare what it actually outputs with what you expected." }
    ];

    // ---------------------------------------------------------------- Fixing the Error
    function fixLine(id, only) {
      return { id: id, category: "errfix", randomize: function () {
        var p = planted(only), n = p.bug.line + 1, right = lineRe(p.bug.fix);
        var wrong = [p.bug.bad.trim(), "OUTPUT " + n, "END", p.bug.fix[0].trim().replace("<-", "="), p.lines[Math.max(0, p.bug.line - 1)].trim()]
          .filter(function (d, i, all) { return !right.test(d) && all.indexOf(d) === i; }).slice(0, 3);
        return { prompt: p.a.purpose + " Line " + n + " has an error. Write the corrected line " + n + ".\n" + listing(p.lines),
          answers: [p.bug.fix[0].trim()], keywords: [right], distractors: wrong,
          working: ["Change as little as you can: find the one part of line " + n + " that does not match the purpose or the rules.", "Keep the keywords and the arrow <- as they are written everywhere else."],
          note: "Line " + n + " should be " + p.bug.fix[0].trim() + "." };
      } };
    }
    // Two real Paper 2 questions: the errors a Year 8 student can put right.
    // Each is the question's algorithm with its other errors already put right, so exactly one error is left.
    var AVERAGE_DECL = ["DECLARE Counter : INTEGER", "DECLARE Total : INTEGER", "DECLARE Number : INTEGER", "DECLARE Average : REAL", "DECLARE Values : ARRAY[1:100] OF INTEGER"];
    var RUNNER_DECL = ["DECLARE Runners : ARRAY[1:250] OF STRING", "DECLARE Times : ARRAY[1:250] OF INTEGER", "DECLARE Index : INTEGER", "DECLARE RunName : STRING", "DECLARE RunTime : INTEGER"];
    function averageBody(line11, line16) {
      return AVERAGE_DECL.concat(["Counter <- 1", "Total <- 0", "WHILE Counter <= 100 DO", "    INPUT Number", "    Values[Counter] <- Number", "    " + line11, "    Counter <- Counter + 1", "ENDWHILE", "Counter <- Counter - 1", line16]);
    }
    function runnerBody(line11, line16) {
      return RUNNER_DECL.concat(["FOR Index <- 1 TO 250", "    OUTPUT \"Enter a runner's name and then time (in seconds) \"", "    INPUT RunName", "    " + line11, "    " + line16, "    Times[Index] <- RunTime", "NEXT Index"]);
    }
    var AVERAGE = "It should input 100 numbers, store them in Values, add them up in Total and store their average in Average.";
    var RUNNERS = "It should input each runner's name and time, and store them in the arrays Runners and Times.";
    var EXAM = [
      { ref: "0478/21, June 2026, Question 7", purpose: AVERAGE, lines: averageBody("Total <- Total + 1", "Average <- Total / Counter"),
        line: 10, fix: ["Total <- Total + Number", "Total <- Number + Total"] },
      { ref: "0478/21, June 2026, Question 7", purpose: AVERAGE, lines: averageBody("Total <- Total + Number", "Average <- Counter / Total"),
        line: 14, fix: ["Average <- Total / Counter"] },
      { ref: "0478/23, June 2026, Question 4", purpose: RUNNERS, lines: runnerBody("OUTPUT RunTime", "Runners[Index] <- RunName"),
        line: 8, fix: ["INPUT RunTime"] },
      { ref: "0478/23, June 2026, Question 4", purpose: RUNNERS, lines: runnerBody("INPUT RunTime", "Runners[Index] <- RunMins"),
        line: 9, fix: ["Runners[Index] <- RunName"] }
    ];
    var examCard = { id: "l7-exam", category: "errfix", randomize: function () {
      var q = pick(EXAM), n = q.line + 1;
      return { prompt: q.purpose + " Line " + n + " has an error. Write the corrected line " + n + ".\n" + listing(q.lines),
        answers: [q.fix[0]], keywords: [lineRe(q.fix)], distractors: [q.lines[q.line].trim(), "OUTPUT " + n, "DECLARE " + n],
        working: ["Compare line " + n + " with the purpose: which variable or keyword is wrong?", "Keep the rest of the line as it is."],
        note: "Line " + n + " should be " + q.fix[0] + ". Adapted from Cambridge IGCSE " + q.ref + " (part of a find-the-errors question)." };
    } };
    var fixCards = [fixLine("l7-fix-1"), fixLine("l7-fix-2", "logic"), fixLine("l7-fix-3", "logic"), fixLine("l7-fix-4", "syntax"), examCard];

    // ---------------------------------------------------------------- Errors in Flowcharts
    var SHAPE_RE = {
      "Input/Output": /^\s*(an?\s+)?(input\s*(\/|or|and)?\s*output|i\s*\/\s*o|parallelogram)(\s+(symbol|box|shape))?\s*$/i,
      "Process": /^\s*(a\s+)?(process|rectangle)(\s+(symbol|box|shape))?\s*$/i,
      "Decision": /^\s*(a\s+)?(decision|diamond)(\s+(symbol|box|shape))?\s*$/i
    };
    var MISDRAWN = [
      { t: "Ask the user to enter Age", drawn: "a rectangle", s: "Input/Output" },
      { t: "Display the value of Total", drawn: "a rectangle", s: "Input/Output" },
      { t: "Store 0 in Count", drawn: "a parallelogram", s: "Process" },
      { t: "Store Price * Quantity in Cost", drawn: "a parallelogram", s: "Process" },
      { t: "Is Mark more than or equal to 50?", drawn: "a rectangle", s: "Decision" },
      { t: "Is Age less than 13?", drawn: "a parallelogram", s: "Decision" }
    ];
    var shapeCard = { id: "l7-flow-shape", category: "errflow", randomize: function () {
      var m = pick(MISDRAWN);
      return { prompt: "A flowchart box \"" + m.t + "\" is drawn as " + m.drawn + ". Which symbol should it be?",
        answers: [m.s], keywords: [SHAPE_RE[m.s]], distractors: ["Terminal", "Process", "Input/Output", "Decision"].filter(function (s) { return s !== m.s; }),
        working: ["What does the box do: ask for or display a value, store or work out a value, or ask a Yes/No question?", "Match that job to its symbol."],
        note: "\"" + m.t + "\" belongs in a" + (m.s === "Input/Output" ? "n" : "") + " " + m.s + " symbol." };
    } };
    var branchCard = { id: "l7-flow-branch", category: "errflow", randomize: function () {
      var v = pick([["Mark", "Pass", "Fail", 50], ["Age", "Allowed", "Too young", 13], ["Score", "Winner", "Try again", 70]]);
      var path = pick(["Yes", "No"]), shows = path === "Yes" ? v[2] : v[1], should = path === "Yes" ? v[1] : v[2];
      return { prompt: "A flowchart should display \"" + v[1] + "\" when " + v[0] + " is " + v[3] + " or more, otherwise \"" + v[2] + "\". Its decision asks \"Is " + v[0] + " more than or equal to " + v[3] + "?\" and the " + path + " path displays \"" + shows + "\". What should the " + path + " path display?",
        answers: [should], keywords: [new RegExp("^\\s*(display\\s+)?\"?" + reEsc(should) + "\"?\\s*$", "i")], distractors: [shows, v[0], String(v[3])],
        working: ["Pick a value that makes the question's answer " + path + ".", "What does the purpose say should happen for that value?"],
        note: "The " + path + " path is taken when " + v[0] + " is " + (path === "Yes" ? v[3] + " or more" : "less than " + v[3]) + ", so it should display \"" + should + "\"." };
    } };
    var askCard = { id: "l7-flow-ask", category: "errflow", randomize: function () {
      var n = pick(["Age", "Mark", "Price", "Height"]);
      return { prompt: "The first box of a flowchart says \"Display the value of " + n + "\", but " + n + " is then used in a decision. What should the first box say?",
        answers: ["Ask the user to enter " + n], keywords: [new RegExp("^\\s*(ask|input|enter|get|read).*" + n + "\\s*$", "i")],
        distractors: ["Display the value of " + n, "Store 0 in " + n, "End"],
        working: ["Before a value can be compared, the algorithm must get it.", "Where does the value of " + n + " come from?"],
        note: "The value has to be input first: \"Ask the user to enter " + n + "\" (INPUT " + n + " in pseudocode)." };
    } };
    var flowKindCard = { id: "l7-flow-kind", category: "errflow",
      prompt: "A flowchart's Yes path displays the message meant for the No path, and the No path displays the one meant for Yes. Is this a syntax error or a logic error?",
      answers: ["Logic error"], keywords: [KIND_RE.logic], distractors: ["Syntax error", "No error", "Both"],
      working: ["Is every box written with a correct shape and correct words?", "Would the algorithm still run? What would its output be?"],
      note: "Every box is correctly written and the algorithm still runs; it just gives the wrong output. That is a logic error." };

    return kindsCards.concat([classify("l7-classify-1"), classify("l7-classify-2")], findCards, fixCards, [shapeCard, branchCard, askCard, flowKindCard]);
  })()
});
