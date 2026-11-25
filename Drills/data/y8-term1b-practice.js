// Year 8, Term 1b Test Practice
// Loaded by Drills/index.html?drill=y8-term1b-practice
// 20 minutes of revision before the Term 1b Test (TestBank.gs y8-term1b). One card kind for every kind of test
// question, never the test's own values or programs (they are left out of every random range below). Every answer
// comes from running the program in the site's pseudocode engine. The wrong options are the answers common slips
// give (MOD for DIV, forgetting the space in LENGTH, > for >=, OR for AND, NOT read backwards).
// Only what Year 8 met in Unit 2: MOD, DIV, ROUND, LENGTH, UCASE, RANDOM, INTEGER, REAL, STRING, BOOLEAN, CONSTANT,
// IF ... ELSE, nested IF, the six comparison operators, AND, OR, NOT. Help never gives the card's own answer:
// `example` is a similar question worked through, `working` two nudges.
DrillData.register("y8-term1b-practice", {
  title: "Year 8, Term 1b Test Practice",
  subtitle: "Library Functions, Data Types, Constants, IF, AND, OR and NOT",
  categories: [
    ["t8b-lib", "Library Functions"],
    ["t8b-type", "Data Types and Constants"],
    ["t8b-if", "Conditional Statements"],
    ["t8b-logic", "AND, OR and NOT"]
  ],
  cards: (function () {
    function code(lines) { return lines.join("\n"); }
    function numbered(lines) { return lines.map(function (l, i) { return (i + 1) + "  " + l; }).join("\n"); }
    function exec(lines, inputs) { return PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String)); }
    function run(lines, inputs) {
      var r = exec(lines, inputs);
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(function (v) { return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v); });
    }
    function out(lines, inputs) { return run(lines, inputs).join(","); }
    function pick(from, to, avoid) { var n; do { n = drillRange(from, to); } while ((avoid || []).indexOf(n) !== -1); return n; }
    function word(w) { return new RegExp("^\\s*(output\\s+)?[\"'\u201c\u2018]?\\s*" + w.replace(/ /g, "\\s*") + "\\s*[\"'\u201d\u2019]?\\s*[.!]?\\s*$", "i"); }
    function others(n, list) {
      var pads = [n + 1, n - 1, n + 2, n - 2, n + 3];
      return drillWrongNumbers(n, list.concat(pads).filter(function (v) { return v !== n; }), 3);
    }
    function uniq(ans, list) {
      var o = [];
      list.forEach(function (x) { x = String(x); if (x !== String(ans) && o.indexOf(x) === -1 && o.length < 3) o.push(x); });
      return o;
    }
    function ifElse(cond, a, b) { return ["IF " + cond + " THEN", "  OUTPUT \"" + a + "\"", "ELSE", "  OUTPUT \"" + b + "\"", "ENDIF"]; }
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function tf(b) { return b ? "TRUE" : "FALSE"; }
    function check(ok, msg) { if (!ok) throw new Error("y8-term1b-practice: " + msg); }
    var TYPES = ["INTEGER", "REAL", "STRING", "BOOLEAN"];

    return [
      // ================================================= Library Functions
      { id: "l-divmod", category: "t8b-lib", randomize: function () {
          var by, n;
          do { by = drillPick([4, 5, 7, 8, 9, 12, 24]); n = drillRange(2, 12) * by + drillRange(1, by - 1); } while (n === 200 || n === 45);
          var fn = drillPick(["DIV", "MOD"]), v = drillPick(["Eggs", "Days", "Hours", "Cards"]);
          var p = ["DECLARE " + v + " : INTEGER", "INPUT " + v, "OUTPUT " + fn + "(" + v + ", " + by + ")"];
          var ans = Number(out(p, [n])), q = Math.floor(n / by), r = n % by;
          return { prompt: "The user types " + n + ". What does this program output?\n" + code(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: uniq(ans, [fn === "DIV" ? r : q, Math.round(n / by * 100) / 100, n - by, q + 1]),
            example: "Example: 30 is typed in, with DIV(30, 4) and MOD(30, 4).\n4 goes into 30 seven whole times: 4 x 7 = 28.\nDIV(30, 4) is 7, the whole number of times.\nMOD(30, 4) is 30 - 28 = 2, the remainder.",
            working: ["How many whole times does " + by + " go into " + n + "?", fn === "DIV" ? "DIV keeps the whole number of times and throws the remainder away." : "MOD gives what is left over after the whole times."],
            note: n + " = " + by + " x " + q + " + " + r + ", so " + fn + " gives " + ans + "." };
        } },
      { id: "l-round", category: "t8b-lib", randomize: function () {
          var t, d, x;
          do { t = drillRange(20, 99); d = drillPick([3, 6, 7, 9]); x = t / d * 10; }
          while ((t === 53 && d === 6) || (t * 10) % d === 0 || Math.abs(x - Math.floor(x) - 0.5) < 0.02);
          var p = ["DECLARE Total : INTEGER", "Total <- " + t, "OUTPUT ROUND(Total / " + d + ", 1)"];
          var ans = out(p), full = Math.floor(t / d * 1000) / 1000;
          return { prompt: "What does this program output?\n" + code(p), answers: [ans], keywords: [drillNumberRe(Number(ans))],
            distractors: uniq(ans, [String(Math.round(t / d)), String(full), String(Math.floor(t / d * 10) / 10), (Number(ans) + 0.1).toFixed(1), String(Math.floor(t / d))]),
            example: "Example: OUTPUT ROUND(29 / 7, 1)\n29 / 7 = 4.142...\nKeep 1 decimal place: 4.1. The next digit is 4, less than 5, so it stays 4.1.",
            working: ["Work out the division first, to 3 decimal places.", "Keep 1 decimal place. Look at the next digit: 5 or more rounds up."],
            note: t + " / " + d + " = " + full + "..., rounded to 1 decimal place: " + ans + "." };
        } },
      { id: "l-length", category: "t8b-lib", randomize: function () {
          var town = drillPick(["Hat Yai", "Ko Samui", "Phang Nga", "Chiang Rai", "Nakhon Pathom", "Mae Sot", "Krabi Town"]);
          var k = drillPick([3, 4, 5]);
          var p = ["DECLARE Town : STRING", "DECLARE Size : INTEGER", "INPUT Town", "Size <- LENGTH(Town)", "OUTPUT MOD(Size, " + k + ")"];
          var ans = Number(out(p, [town])), noSpace = town.replace(/ /g, "").length % k;
          return { prompt: "The user types " + town + ". What does this program output?\n" + code(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: uniq(ans, [noSpace, town.length, Math.floor(town.length / k), ans + 1, ans + 2]),
            example: "Example: the user types Ban Na, then MOD(LENGTH(Town), 4).\nB-a-n, the space, N-a: 6 characters. The space counts.\nMOD(6, 4) = 2.",
            working: ["Count every character of the name. Is the space a character?", "Then find the remainder after dividing by " + k + "."],
            note: "LENGTH is " + town.length + " (the space counts). MOD(" + town.length + ", " + k + ") = " + ans + "." };
        } },
      { id: "l-random", category: "t8b-lib", randomize: function () {
          var a, b;
          do { a = drillRange(3, 9); b = drillRange(1, 5); } while (a === 8 && b === 2);
          var p = ["DECLARE Roll : INTEGER", "Roll <- ROUND(RANDOM() * " + a + ", 0) + " + b];
          var ans = b + " to " + (a + b);
          return { prompt: "RANDOM() gives a number from 0 to 1. Which whole numbers can Roll hold? Give the smallest and largest, like 1 to 6.\n" + code(p),
            answers: [ans], keywords: [new RegExp("^\\s*(from\\s+)?" + b + "\\s*(to|-|and)\\s*" + (a + b) + "\\s*\\.?\\s*$", "i")],
            distractors: ["0 to " + a, b + " to " + a, (b + 1) + " to " + (a + b)],
            example: "Example: ROUND(RANDOM() * 5, 0) + 1\nRANDOM() * 5 is 0 to 5.\nROUND(..., 0) makes a whole number, 0 to 5.\n+ 1 moves both ends up: 1 to 6.",
            working: ["What are the smallest and largest values of RANDOM() * " + a + "?", "The + " + b + " is added to both the smallest and the largest."],
            note: "0 to " + a + ", then + " + b + ": " + ans + "." };
        } },
      { id: "l-count", category: "t8b-lib", randomize: function () {
          var pool = [["OUTPUT UCASE(Name)", 1], ["OUTPUT Name", 0], ["OUTPUT LENGTH(Name)", 1], ["OUTPUT Mark * 2", 0], ["OUTPUT MOD(Mark, 2)", 1],
            ["OUTPUT DIV(Mark, 10)", 1], ["OUTPUT Mark + 5", 0], ["OUTPUT ROUND(Mark / 7, 1)", 1]];
          var lines, n;
          do { lines = shuffle(pool.slice()).slice(0, 4); n = lines.filter(function (l) { return l[1]; }).length; } while (n === 0 || n === 4);
          var p = ["DECLARE Name : STRING", "DECLARE Mark : INTEGER", "INPUT Name", "INPUT Mark"].concat(lines.map(function (l) { return l[0]; }));
          out(p, ["Ann", 40]);
          return { prompt: "How many lines of this program call a library function?\n" + numbered(p), answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [p.length, 4 + n, 4]),
            example: "Example:\nINPUT Word\nOUTPUT UCASE(Word)\nOUTPUT Word\nOnly UCASE(Word) is a library function: a name with brackets.\nINPUT and OUTPUT are part of the language. So 1 line.",
            working: ["A library function has a name followed by brackets with values inside.", "DECLARE, INPUT and OUTPUT are not library functions."],
            note: n + " lines call MOD, DIV, ROUND, LENGTH or UCASE." };
        } },

      // ================================================= Data Types and Constants
      { id: "d-type", category: "t8b-type", randomize: function () {
          var c = drillPick([
            ["the height of a plant in metres", "0.85", "REAL"], ["the price of a snack", "12.50 baht", "REAL"], ["a temperature", "31.5", "REAL"],
            ["the number of goals in a match", "3", "INTEGER"], ["how many pupils are in a class", "26", "INTEGER"], ["the floor of a lift", "-2", "INTEGER"],
            ["the name of a town", "\"Hat Yai\"", "STRING"], ["a pupil's house team", "\"Blue\"", "STRING"],
            ["whether a door is locked", "TRUE", "BOOLEAN"], ["whether a game is over", "FALSE", "BOOLEAN"], ["whether a book was returned", "TRUE", "BOOLEAN"]]);
          return { prompt: "A variable holds " + c[0] + ", for example " + c[1] + ". Which data type should it have?", answers: [c[2]], keywords: [word(c[2])],
            distractors: TYPES.filter(function (t) { return t !== c[2]; }),
            example: "Example: a pencil is 14.5 cm long.\nAsk in order: is it a number? Can it have a decimal part? Is it text in quotes? Can it only be TRUE or FALSE?\nA number with a decimal part needs the decimal number type, not the whole number type.",
            working: ["Is it a number? Can it have a decimal part?", "If it can only ever be TRUE or FALSE, it has its own data type."],
            note: c[1] + ": " + c[2] + "." };
        } },
      { id: "d-error", category: "t8b-type", randomize: function () {
          var bad = drillPick([["Lives : INTEGER", "Lives <- \"" + drillRange(2, 9) + "\"", "Lives"], ["Goals : INTEGER", "Goals <- " + drillRange(1, 9) + ".5", "Goals"],
            ["Paid : BOOLEAN", "Paid <- \"Yes\"", "Paid"], ["Age : INTEGER", "Age <- \"thirteen\"", "Age"]]);
          var good = drillPick([["Town : STRING", "Town <- \"Trang\""], ["Height : REAL", "Height <- 1.47"], ["Score : INTEGER", "Score <- 12"]]);
          var decl = shuffle(["DECLARE " + bad[0], "DECLARE " + good[0]]), sets = shuffle([bad[1], good[1]]);
          var p = decl.concat(sets, ["OUTPUT " + bad[2]]);
          var r = exec(p), line = p.indexOf(bad[1]) + 1;
          check(r.error && r.error.line === line, "error line " + p.join("|"));
          return { prompt: "This program stops with an error. On which line does it stop?\n" + numbered(p), answers: [String(line)], keywords: [drillNumberRe(line, "line")],
            distractors: others(line, [p.indexOf("DECLARE " + bad[0]) + 1, p.length]),
            example: "Example:\n1  DECLARE Pets : INTEGER\n2  Pets <- \"2\"\n3  OUTPUT Pets\n\"2\" in quotes is text, and Pets holds whole numbers only.\nDECLARE is fine. The error comes when the wrong kind of value is stored: line 2.",
            working: ["Check each line that stores a value. Is it the kind of value DECLARE said?", "Quotes make a value text. A decimal part needs REAL."],
            note: "Line " + line + " stores the wrong kind of value." };
        } },
      { id: "d-fix-type", category: "t8b-type", randomize: function () {
          var c = drillPick([["Weight", "42.5", "REAL"], ["Finished", "TRUE", "BOOLEAN"], ["Width", "3.75", "REAL"], ["Team", "\"Red\"", "STRING"], ["Open", "FALSE", "BOOLEAN"]]);
          var wrong = c[2] === "STRING" ? "INTEGER" : drillPick(TYPES.filter(function (t) { return t !== c[2] && !(c[2] === "REAL" && t === "STRING"); }));
          var p = ["DECLARE Name : STRING", "DECLARE " + c[0] + " : " + wrong, "Name <- \"Fah\"", c[0] + " <- " + c[1], "OUTPUT " + c[0]];
          var fixed = p.slice(); fixed[1] = "DECLARE " + c[0] + " : " + c[2];
          check(exec(p).error && !exec(fixed).error, "fix type " + c[0]);
          return { prompt: "This program stops on line 4. Which data type should line 2 use?\n" + numbered(p), answers: [c[2]], keywords: [word(c[2])],
            distractors: TYPES.filter(function (t) { return t !== c[2]; }),
            example: "Example:\n1  DECLARE Cost : INTEGER\n2  Cost <- 9.99\nThe program stops on line 2: 9.99 has a decimal part, and that kind of variable holds whole numbers only.\nLine 1 needs the data type for decimal numbers.",
            working: ["Look at the value line 4 stores. What kind of value is it?", "Match it: whole number, decimal number, text in quotes, or TRUE/FALSE."],
            note: c[1] + " needs " + c[2] + "." };
        } },
      { id: "d-constant", category: "t8b-type", randomize: function () {
          var price, n, limit, off;
          do { price = drillPick([15, 20, 25, 30, 40, 45]); n = drillRange(2, 6); limit = price * drillRange(n - 1, n + 1); off = drillPick([5, 10, 15]); }
          while (price === 35 || limit < price);
          var p = ["CONSTANT Price <- " + price, "DECLARE Tickets : INTEGER", "DECLARE Total : INTEGER", "INPUT Tickets", "Total <- Tickets * Price",
            "IF Total >= " + limit + " THEN", "  Total <- Total - " + off, "ENDIF", "OUTPUT Total"];
          var ans = Number(out(p, [n])), t = n * price;
          return { prompt: "The user types " + n + ". What does this program output?\n" + numbered(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [ans === t ? t - off : t, price, n + price]),
            example: "Example: CONSTANT Cost <- 20, and 3 is typed in.\nTotal = 3 x 20 = 60.\nIF Total >= 60: 60 >= 60 is TRUE, so the discount is taken off.",
            working: ["Work out Total on line 5 using the constant's value.", "Test Total with the sign on line 6. Does >= include equal?"],
            note: "Total = " + t + ". " + t + " >= " + limit + " is " + tf(t >= limit) + ", so the output is " + ans + "." };
        } },
      { id: "d-const-change", category: "t8b-type", randomize: function () {
          var price = pick(10, 60, [35]), newP = price + drillPick([5, 10]), name = drillPick(["Fee", "Cost", "Rate"]);
          var p = ["CONSTANT " + name + " <- " + price, "DECLARE Days : INTEGER", "INPUT Days", "OUTPUT Days * " + name, name + " <- " + newP, "OUTPUT Days * " + name];
          var r = exec(p, [3]);
          check(r.error && r.error.line === 5 && r.outputs.length === 1, "constant change");
          var ans = "The program stops with an error on line 5";
          return { prompt: "What happens when line 5 of this program runs?\n" + numbered(p), answers: [ans], keywords: [/\b(error|stops?|crash)/i],
            distractors: [name + " changes to " + newP, name + " stays " + price + " and the program carries on", "Both outputs use " + newP],
            example: "Example: CONSTANT Speed <- 30, then later Speed <- 40.\nA constant is set once and can never change while the program runs.\nSo the line Speed <- 40 stops the program with an error.",
            working: ["What did line 1 make " + name + "?", "Can a constant be given a new value while the program runs?"],
            note: name + " is a CONSTANT, so line 5 stops the program." };
        } },

      // ================================================= Conditional Statements
      { id: "c-count", category: "t8b-if", randomize: function () {
          var op = drillPick(["<=", "<", ">=", ">"]), t = pick(20, 90, [60]);
          var tries = shuffle([t, t - drillRange(1, 3), t + drillRange(1, 3), t + drillPick([-10, 12])]);
          var p = ["DECLARE Speed : INTEGER", "INPUT Speed"].concat(ifElse("Speed " + op + " " + t, "Yes", "No"));
          var n = tries.filter(function (s) { return out(p, [s]) === "Yes"; }).length;
          var flip = { "<=": "<", "<": "<=", ">=": ">", ">": ">=" }[op];
          var slip = tries.filter(function (s) { return flip === "<" ? s < t : flip === "<=" ? s <= t : flip === ">" ? s > t : s >= t; }).length;
          return { prompt: "The user runs this program four times and types " + tries.join(", then ") + ". How many times does it output Yes?\n" + code(p),
            answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [slip, 4 - n]),
            example: "Example: IF Speed <= 40, and 39, 40, 41 are typed in.\n39 <= 40 TRUE. 40 <= 40 TRUE, equal counts. 41 <= 40 FALSE.\nSo Yes twice.",
            working: ["Put each number into the condition and say it in words.", "Look at the sign: does it include the number written in the condition?"],
            note: n + " of them make Speed " + op + " " + t + " TRUE." };
        } },
      { id: "c-nested", category: "t8b-if", randomize: function () {
          var hi, lo, add, input;
          do { hi = drillPick([60, 70, 75, 80, 90]); lo = hi - drillPick([20, 25, 30]); add = drillPick([2, 3, 5, 10]);
            input = drillPick([hi, lo, hi + 3, lo + 2, lo - 4]) - add; } while ((hi === 70 && lo === 40) || input < 0);
          var p = ["DECLARE Points : INTEGER", "INPUT Points", "Points <- Points + " + add, "IF Points >= " + hi + " THEN", "  OUTPUT \"Gold\"", "ELSE",
            "  IF Points >= " + lo + " THEN", "    OUTPUT \"Silver\"", "  ELSE", "    OUTPUT \"Bronze\"", "  ENDIF", "ENDIF"];
          var ans = out(p, [input]);
          return { prompt: "The user types " + input + ". What does this program output?\n" + numbered(p), answers: [ans], keywords: [word(ans)],
            distractors: ["Gold", "Silver", "Bronze", "Points"].filter(function (w) { return w !== ans; }),
            example: "Example: 48 is typed, then Points <- Points + 2, then IF Points >= 50 ... ELSE IF Points >= 30.\nPoints becomes 50 first.\n50 >= 50 is TRUE, so the first branch runs and the ELSE is skipped.",
            working: ["Line 3 changes Points before any IF. Work out the new value.", "Check the first IF. Only go into the ELSE if it is FALSE."],
            note: "Points becomes " + (input + add) + ", so " + ans + "." };
        } },
      { id: "c-order", category: "t8b-if", randomize: function () {
          var hi = drillPick([60, 70, 80, 85, 90]), lo = hi - drillPick([30, 35, 40]), wrong = Math.random() < 0.6;
          var w = drillPick([["Merit", "Pass", "Fail"], ["Gold", "Silver", "Bronze"], ["Expert", "Good", "Beginner"]]);
          if (hi === 75 && lo === 40) lo = 45;
          var first = wrong ? lo : hi, second = wrong ? hi : lo, top = wrong ? w[1] : w[0], inner = wrong ? w[0] : w[1];
          var p = ["DECLARE Score : INTEGER", "INPUT Score", "IF Score >= " + first + " THEN", "  OUTPUT \"" + top + "\"", "ELSE",
            "  IF Score >= " + second + " THEN", "    OUTPUT \"" + inner + "\"", "  ELSE", "    OUTPUT \"" + w[2] + "\"", "  ENDIF", "ENDIF"];
          var got = []; for (var s = 0; s <= 100; s++) if (out(p, [s]) === w[0]) got.push(s);
          var ans = got.length === 0 ? "No score can" : hi + " or more";
          check(got.length === 0 || (got[0] === hi && got[got.length - 1] === 100), "order");
          return { prompt: "Which scores make this program output " + w[0] + "?\n" + numbered(p), answers: [ans],
            keywords: [got.length === 0 ? /^\s*(no\s*(score|one|number)?(\s*can)?|none|never|nothing)\s*\.?\s*$/i : new RegExp("^\\s*" + hi + "\\s*(or\\s*more|or\\s*over|or\\s*above|\\+|and\\s*(above|over|more))\\s*\\.?\\s*$", "i")],
            distractors: uniq(ans, ["No score can", hi + " or more", lo + " to " + (hi - 1), "Less than " + lo]),
            example: "Example: IF Score >= 35 THEN Pass, ELSE IF Score >= 95 THEN Top.\nA score of 99 is also at least 35, so Pass is output first.\nThe 95 check is only reached by scores under 35, and none of them reach 95.\nSo with the lower number first, Top can never be output.",
            working: ["Try a big score, like 100. Which line is TRUE first?", "The inner IF is only checked when the first IF is FALSE."],
            note: got.length === 0 ? "Every score of " + hi + " or more is also " + lo + " or more, so the first IF catches it." : "The highest number is checked first, so " + hi + " or more." };
        } },
      { id: "c-test", category: "t8b-if", randomize: function () {
          var t = pick(4, 16, [5]), under = Math.random() < 0.5;
          var rule = under ? "aged " + t + " or under pay half price" : "aged " + t + " or over can play";
          var cond = under ? "Age < " + t : "Age > " + t, yes = under ? "Half price" : "Play", no = under ? "Full price" : "Wait";
          var p = ["DECLARE Age : INTEGER", "INPUT Age"].concat(ifElse(cond, yes, no));
          var ages = shuffle([t, t - drillRange(2, 3), t + drillRange(2, 4), t + drillRange(6, 9)]);
          var bad = ages.filter(function (a) { return out(p, [a]) !== ((under ? a <= t : a >= t) ? yes : no); });
          check(bad.length === 1 && bad[0] === t, "test");
          return { prompt: "The rule: people " + rule + ". A tester types each of these ages: " + ages.join(", ") + ". Which age gives the wrong output?\n" + numbered(p),
            answers: [String(t)], keywords: [drillNumberRe(t)], distractors: uniq(t, ages),
            example: "Example: the rule is 10 or over, and the line is IF Age > 10 THEN.\n11 and 15 work. 10 > 10 is FALSE, but 10 should be allowed.\nSo 10, the number in the condition, shows the error.",
            working: ["Work out the expected output for each age from the rule first.", "Test the number written in the condition. Is the equal case right?"],
            note: t + " is in the rule, but " + cond.replace("Age", String(t)) + " is FALSE." };
        } },
      { id: "c-fix", category: "t8b-if", randomize: function () {
          var t = pick(4, 16, [5]), under = Math.random() < 0.5;
          var p = ["DECLARE Age : INTEGER", "INPUT Age"].concat(ifElse(under ? "Age < " + t : "Age > " + t, "Yes", "No"));
          var ans = under ? "IF Age <= " + t + " THEN" : "IF Age >= " + t + " THEN";
          var alt = under ? "<\\s*" + (t + 1) : ">\\s*" + (t - 1), main = under ? "<=\\s*" + t : ">=\\s*" + t;
          return { prompt: "The rule: Yes for ages " + t + " or " + (under ? "under" : "over") + ". This program gives the wrong output for one age. Write the correct line 3.\n" + numbered(p),
            answers: [ans], keywords: [new RegExp("^\\s*(line\\s*3\\s*[:.-]?\\s*)?if\\s*age\\s*(" + main + "|" + alt + ")\\s*then\\s*$", "i")],
            distractors: under ? ["IF Age < " + (t - 1) + " THEN", "IF Age = " + t + " THEN", "IF Age >= " + t + " THEN"] : ["IF Age > " + (t + 1) + " THEN", "IF Age = " + t + " THEN", "IF Age <= " + t + " THEN"],
            example: "Example: the rule is 18 or over, and the line is IF Age > 18 THEN.\n18 must give Yes, so the sign must include equal:\nIF Age >= 18 THEN",
            working: ["Which age is wrong? Try the number in the condition.", "Which sign includes the equal number: >= or <=?"],
            note: ans + "." };
        } },

      // ================================================= AND, OR and NOT
      { id: "g-and", category: "t8b-logic", randomize: function () {
          var a = pick(6, 14, [8]), h = pick(11, 15, [12]) * 10;
          var pool = [[a, h + drillRange(1, 9)], [a + drillRange(1, 5), h], [a + drillRange(1, 5), h + drillRange(1, 9)], [a + drillRange(1, 5), h - drillRange(1, 5)],
            [a - drillRange(1, 2), h + drillRange(5, 15)], [a - drillRange(1, 2), h - drillRange(1, 5)], [a, h - 1]], pairs, yes;
          do { pairs = shuffle(pool.slice()).slice(0, 4); yes = pairs.filter(function (q) { return q[0] >= a && q[1] >= h; }).length; } while (yes === 0 || yes === 4);
          var p = ["DECLARE Age : INTEGER", "DECLARE Height : INTEGER", "INPUT Age", "INPUT Height"].concat(ifElse("Age >= " + a + " AND Height >= " + h, "Ride", "Sorry"));
          var n = pairs.filter(function (q) { return out(p, q) === "Ride"; }).length;
          var orN = pairs.filter(function (q) { return q[0] >= a || q[1] >= h; }).length;
          return { prompt: "The user runs this program four times. Age and Height typed in: " + pairs.map(function (q) { return q[0] + " and " + q[1]; }).join(", then ") + ". How many times does it output Ride?\n" + code(p),
            answers: [String(n)], keywords: [drillNumberRe(n)], distractors: others(n, [orN, 4 - n]),
            example: "Example: IF Age >= 9 AND Height >= 130\n9 and 135: TRUE and TRUE, so Ride.\n12 and 128: TRUE and FALSE, so Sorry. One FALSE is enough.",
            working: ["For each pair, write TRUE or FALSE for each condition first.", "AND needs both to be TRUE."],
            note: n + " pairs make both conditions TRUE." };
        } },
      { id: "g-or", category: "t8b-logic", randomize: function () {
          var lo = pick(3, 8, [6]), hi = pick(55, 70, [60]);
          var age = drillPick([lo, lo - 1, hi, hi - 1, drillRange(lo + 5, hi - 10)]);
          var p = ["DECLARE Age : INTEGER", "INPUT Age"].concat(ifElse("Age < " + lo + " OR Age >= " + hi, "Free", "Pay"));
          var ans = out(p, [age]), a = tf(age < lo), b = tf(age >= hi);
          var full = a + " " + b + " " + ans;
          return { prompt: "The user types " + age + ". Write TRUE or FALSE for Age < " + lo + ", then for Age >= " + hi + ", then the output. For example: TRUE FALSE Free\n" + code(p),
            answers: [full], keywords: [new RegExp("^\\s*" + a + "[\\s,]+" + b + "[\\s,]+(output\\s+)?[\"']?" + ans + "[\"']?\\s*\\.?\\s*$", "i")],
            distractors: uniq(full, [tf(age <= lo) + " " + b + " " + (age <= lo || age >= hi ? "Free" : "Pay"), a + " " + tf(age > hi) + " " + (age < lo || age > hi ? "Free" : "Pay"),
              a + " " + b + " " + (ans === "Free" ? "Pay" : "Free"), "TRUE FALSE Free", "FALSE TRUE Free", "FALSE FALSE Pay"]),
            example: "Example: IF Age < 4 OR Age >= 65, and 65 is typed in.\n65 < 4 is FALSE. 65 >= 65 is TRUE.\nOR needs at least one TRUE, so the THEN branch runs. Write FALSE, TRUE, then the THEN output.",
            working: ["Put " + age + " into each condition and say it in words.", "OR is TRUE when at least one condition is TRUE."],
            note: full + "." };
        } },
      { id: "g-range", category: "t8b-logic", randomize: function () {
          var lo, hi;
          do { lo = drillRange(1, 20); hi = lo + drillRange(4, 30); } while (lo === 1 && hi === 10);
          var v = drillPick(["Seats", "Level", "Guess", "Nights"]);
          var ans = "IF " + v + " >= " + lo + " AND " + v + " <= " + hi + " THEN";
          var opts = [ans, "IF " + v + " >= " + lo + " OR " + v + " <= " + hi + " THEN", "IF " + v + " > " + lo + " AND " + v + " < " + hi + " THEN", "IF " + v + " <= " + lo + " AND " + v + " >= " + hi + " THEN"];
          var good = opts.filter(function (o) {
            var p = ["DECLARE " + v + " : INTEGER", "INPUT " + v].concat(ifElse(o.replace(/^IF | THEN$/g, ""), "In", "Out"));
            for (var n = lo - 3; n <= hi + 3; n++) if ((out(p, [n]) === "In") !== (n >= lo && n <= hi)) return false;
            return true;
          });
          check(good.length === 1 && good[0] === ans, "range");
          return { prompt: "A program accepts " + v + " from " + lo + " to " + hi + ". Which line lets in only " + lo + " to " + hi + "? Type the line.",
            answers: [ans], keywords: [new RegExp("^\\s*if\\s*" + v + "\\s*>=\\s*" + lo + "\\s*and\\s*" + v + "\\s*<=\\s*" + hi + "\\s*then\\s*$", "i")],
            distractors: opts.slice(1),
            example: "Example: 2 to 5 people.\nIF People >= 2 AND People <= 5 THEN\nBoth must be TRUE, and the end numbers 2 and 5 are let in.\nWith OR, every number is 2 or more, or 5 or less, so all get in.",
            working: ["Inside a range a number must pass both checks. Which word needs both?", "Are the end numbers " + lo + " and " + hi + " let in? Then include equal."],
            note: ans + "." };
        } },
      { id: "g-not", category: "t8b-logic", randomize: function () {
          var c, typed, flag = drillPick(["Locked", "Closed", "Blocked"]);
          do { c = drillRange(1000, 9999); } while (c === 4321);
          typed = Math.random() < 0.5 ? c : c + drillPick([1, -1, 10, 9]);
          if (typed === 4321) typed = c;
          var p = ["DECLARE " + flag + " : BOOLEAN", "DECLARE Code : INTEGER", flag + " <- TRUE", "INPUT Code", "IF Code = " + c + " THEN", "  " + flag + " <- FALSE", "ENDIF"]
            .concat(ifElse("NOT " + flag, "Open", "Stay shut"));
          var ans = out(p, [typed]);
          return { prompt: "The user types " + typed + ". What does this program output?\n" + numbered(p), answers: [ans], keywords: [word(ans)],
            distractors: uniq(ans, ["Open", "Stay shut", "TRUE", "FALSE"]),
            example: "Example: Raining <- FALSE, then IF NOT Raining THEN OUTPUT \"Out\".\nNOT FALSE is TRUE, so Out is output.\nNOT changes TRUE to FALSE, and FALSE to TRUE.",
            working: ["Does the code typed in match line 5? What is " + flag + " after line 7?", "NOT changes TRUE to FALSE and FALSE to TRUE."],
            note: flag + " is " + tf(typed !== c) + ", so NOT " + flag + " is " + tf(typed === c) + ": " + ans + "." };
        } },
      { id: "g-outside", category: "t8b-logic", randomize: function () {
          var max = pick(5, 12, [8]), useAnd = Math.random() < 0.5, a = drillRange(1, max), b = drillRange(0, max);
          var p = ["DECLARE Adults : INTEGER", "DECLARE Children : INTEGER", "DECLARE Seats : INTEGER", "INPUT Adults", "INPUT Children", "Seats <- Adults + Children"]
            .concat(ifElse("Seats < 1 " + (useAnd ? "AND" : "OR") + " Seats > " + max, "Rejected", "Accepted"));
          var ans = out(p, [a, b]);
          return { prompt: "The rule: a booking must be for 1 to " + max + " seats. The user types " + a + ", then " + b + ". What does this program output?\n" + numbered(p),
            answers: [ans], keywords: [word(ans)], distractors: uniq(ans, ["Accepted", "Rejected", String(a + b), "Seats"]),
            example: "Example: IF Seats < 1 AND Seats > 6, and Seats is 9.\n9 < 1 is FALSE, 9 > 6 is TRUE. AND needs both, so FALSE.\nNo number is less than 1 and more than 6 at once, so this IF is never TRUE.",
            working: ["Work out Seats on line 6 first.", "Write TRUE or FALSE for each condition, then join them with the word on line 7."],
            note: "Seats is " + (a + b) + ". The condition is " + tf(useAnd ? false : (a + b < 1 || a + b > max)) + ", so " + ans + "." };
        } },
      { id: "g-mixed", category: "t8b-logic", randomize: function () {
          var age, member, price, off1, off2, lim;
          do { lim = drillPick([12, 14, 16, 18]); age = lim + drillPick([-1, 0, 0, 1]); member = Math.random() < 0.4; price = drillPick([60, 90, 100, 120]);
            off1 = drillPick([20, 30]); off2 = drillPick([5, 10]); } while (age === 16 && !member && price === 80);
          var p = ["DECLARE Age : INTEGER", "DECLARE Member : BOOLEAN", "DECLARE Price : INTEGER", "Age <- " + age, "Member <- " + tf(member), "Price <- " + price,
            "IF Age < " + lim + " AND NOT Member THEN", "  Price <- Price - " + off1, "ENDIF", "IF Age >= " + lim + " OR Member THEN", "  Price <- Price - " + off2, "ENDIF", "OUTPUT Price"];
          var ans = Number(out(p));
          return { prompt: "What does this program output?\n" + numbered(p), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [price - off1, price - off2, price - off1 - off2, price]),
            example: "Example: Age 10, Member TRUE, Price 50.\nIF Age < 12 AND NOT Member: TRUE AND NOT TRUE = TRUE AND FALSE = FALSE.\nIF Age >= 12 OR Member: FALSE OR TRUE = TRUE, so that change happens.",
            working: ["Line 7: write TRUE or FALSE for Age < " + lim + " and for NOT Member, then join with AND.", "Line 10: write TRUE or FALSE for each part, then join with OR."],
            note: "The output is " + ans + "." };
        } }
    ];
  })()
});
