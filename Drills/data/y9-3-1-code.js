// Year 9, 3.1: Following and Correcting Pseudocode (Activity 2: correct the program)
// Loaded by Drills/index.html?drill=y9-3-1-code
// Code cards: the editor opens holding a program with ONE error (`starter`). The question states the purpose and
// what goes wrong; the student finds the line that causes it, corrects it and runs it. It must give the same output
// as the reference with new values each time (typed-in values and array values are redrawn on every card).
// Fix the Order: a line is in the wrong place. Fix the Line: one line says the wrong thing.
DrillData.register("y9-3-1-code", {
  title: "Year 9, 3.1: Correct the Program",
  subtitle: "Each program has one error. Read the purpose, find the line, correct it, run it.",
  codeDrill: true,
  categories: [
    ["code-order", "Fix the Order"],
    ["code-line", "Fix the Line"]
  ],
  cards: (function () {
    function nums(n, from, to) { var o = []; while (o.length < n) o.push(from + Math.floor(Math.random() * (to - from + 1))); return o; }
    function withValue(n, from, to, must, times) {
      var o = nums(n - times, from, to);
      for (var i = 0; i < times; i++) o.splice(Math.floor(Math.random() * (o.length + 1)), 0, must);
      return o;
    }
    return [
      {
        id: "code-order-1", category: "code-order",
        prompt: "This program should output the total of 1 to 5, once, at the end. It outputs 1, 3, 6, 10, 15. Move one line, then run it.",
        starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 5\n    Total <- Total + Count\n    OUTPUT Total\nNEXT Count",
        reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 5\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-order-2", category: "code-order",
        prompt: "This program should add up 2 to 6 and output 20. It outputs 6. Move one line, then run it.",
        starter: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nFOR Count <- 2 TO 6\n    Total <- 0\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
        reference: "DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 2 TO 6\n    Total <- Total + Count\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-order-3", category: "code-order",
        prompt: "This program should count how many of the 5 numbers typed in are 10 or more. It only ever checks the last number. Move the IF so it checks every number, then run it.",
        inputs: function () {
          var o;
          do { o = withValue(5, 1, 20, 10, 1); } while (o.filter(function (v) { return v >= 10; }).length < 2);
          return o;
        },
        starter: "DECLARE Number : INTEGER\nDECLARE Count : INTEGER\nDECLARE Big : INTEGER\nBig <- 0\nFOR Count <- 1 TO 5\n    INPUT Number\nNEXT Count\nIF Number >= 10 THEN\n    Big <- Big + 1\nENDIF\nOUTPUT Big",
        reference: "DECLARE Number : INTEGER\nDECLARE Count : INTEGER\nDECLARE Big : INTEGER\nBig <- 0\nFOR Count <- 1 TO 5\n    INPUT Number\n    IF Number >= 10 THEN\n        Big <- Big + 1\n    ENDIF\nNEXT Count\nOUTPUT Big",
        checkVars: ["Big"],
        checkOutput: true
      },
      {
        id: "code-order-4", category: "code-order",
        prompt: "This program should output the total of the 4 numbers typed in. It always outputs 0. Move one line, then run it.",
        inputs: function () { return nums(4, 2, 30); },
        starter: "DECLARE Number : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nOUTPUT Total\nFOR Count <- 1 TO 4\n    INPUT Number\n    Total <- Total + Number\nNEXT Count",
        reference: "DECLARE Number : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Number\n    Total <- Total + Number\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-line-1", category: "code-line",
        prompt: "This program should input 4 marks and output their total. It ignores every mark typed in. Correct the line that causes it, then run it.",
        inputs: function () { return nums(4, 1, 20); },
        starter: "DECLARE Mark : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    OUTPUT Mark\n    Total <- Total + Mark\nNEXT Count\nOUTPUT Total",
        reference: "DECLARE Mark : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Mark\n    Total <- Total + Mark\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-line-2", category: "code-line",
        prompt: "This program should count the marks of 50 or more. A mark of exactly 50 is not counted. Correct the line that causes it, then run it.",
        inputs: function () { return withValue(5, 30, 70, 50, 2); },
        starter: "DECLARE Mark : INTEGER\nDECLARE Count : INTEGER\nDECLARE Passes : INTEGER\nPasses <- 0\nFOR Count <- 1 TO 5\n    INPUT Mark\n    IF Mark > 50 THEN\n        Passes <- Passes + 1\n    ENDIF\nNEXT Count\nOUTPUT Passes",
        reference: "DECLARE Mark : INTEGER\nDECLARE Count : INTEGER\nDECLARE Passes : INTEGER\nPasses <- 0\nFOR Count <- 1 TO 5\n    INPUT Mark\n    IF Mark >= 50 THEN\n        Passes <- Passes + 1\n    ENDIF\nNEXT Count\nOUTPUT Passes",
        checkVars: ["Passes"],
        checkOutput: true
      },
      {
        id: "code-line-3", category: "code-line",
        prompt: "This program should output the total of all four values in Prices (see Given). The wrong total shows at the end, but the error is earlier: one value is never added. Correct it, then run it.",
        setup: { "Prices": [5, 12, 3, 10] },
        starter: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 2 TO 4\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total",
        reference: "DECLARE Total : INTEGER\nDECLARE Index : INTEGER\nTotal <- 0\nFOR Index <- 1 TO 4\n    Total <- Total + Prices[Index]\nNEXT Index\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      },
      {
        id: "code-line-4", category: "code-line",
        prompt: "This program should input 4 prices and output their total. It outputs only the last price. Correct the line that causes it, then run it.",
        inputs: function () { return nums(4, 2, 25); },
        starter: "DECLARE Price : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Price\n    Total <- Price\nNEXT Count\nOUTPUT Total",
        reference: "DECLARE Price : INTEGER\nDECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal <- 0\nFOR Count <- 1 TO 4\n    INPUT Price\n    Total <- Total + Price\nNEXT Count\nOUTPUT Total",
        checkVars: ["Total"],
        checkOutput: true
      }
    ];
  })()
});
