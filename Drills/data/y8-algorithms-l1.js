// Year 8, L1: Writing Cambridge Pseudocode
// Loaded by Drills/index.html?drill=y8-algorithms-l1
DrillData.register("y8-algorithms-l1", {
  title: "Year 8, L1: Writing Cambridge Pseudocode",
  subtitle: "Cambridge Pseudocode",
  // [category id, label] in the order the topic picker and mastery overview show them
  categories: [
    ["seqtrace", "Tracing a Sequence"],
    ["seqsyntax", "Pseudocode Syntax"],
    ["seqwrite", "Writing a Sequence"],
    ["variables", "Variables and Values"]
  ],
  cards: [
    {
      id: "l1-trace-1", category: "seqtrace",
      prompt: "Number <- 5\nNumber <- Number + 3\nOUTPUT Number\n\nWhat does this output?",
      answers: ["8"],
      keywords: [/^\s*8\s*$/],
      distractors: ["5","3","35","53"],
      note: "5 + 3 = 8.",
      randomize: function () {
        var a = randInt(2, 20), b = randInt(2, 20), sum = a + b;
        return {
          prompt: "Number <- " + a + "\nNumber <- Number + " + b + "\nOUTPUT Number\n\nWhat does this output?",
          answers: [String(sum)], keywords: [new RegExp("^\\s*" + sum + "\\s*$")],
          distractors: dedupeDistractors(sum, [a, b, a * b], function (i) { return sum + i; }),
          note: a + " + " + b + " = " + sum + "."
        };
      }
    },
    {
      id: "l1-trace-2", category: "seqtrace",
      prompt: "Number <- 10\nNumber <- Number - 4\nOUTPUT Number\n\nWhat does this output?",
      answers: ["6"],
      keywords: [/^\s*6\s*$/],
      distractors: ["10","4","14","-6"],
      note: "10 - 4 = 6.",
      randomize: function () {
        var a = randInt(10, 40), b = randInt(1, a - 1), diff = a - b;
        return {
          prompt: "Number <- " + a + "\nNumber <- Number - " + b + "\nOUTPUT Number\n\nWhat does this output?",
          answers: [String(diff)], keywords: [new RegExp("^\\s*" + diff + "\\s*$")],
          distractors: dedupeDistractors(diff, [a, b, a + b], function (i) { return diff + i; }),
          note: a + " - " + b + " = " + diff + "."
        };
      }
    },
    {
      id: "l1-trace-3", category: "seqtrace",
      prompt: "A <- 2\nB <- 5\nA <- A + B\nOUTPUT A\n\nWhat does this output?",
      answers: ["7"],
      keywords: [/^\s*7\s*$/],
      distractors: ["2","5","10","25"],
      note: "A becomes 2 + 5 = 7. B itself never changes.",
      randomize: function () {
        var a = randInt(1, 20), b = randInt(1, 20), sum = a + b;
        return {
          prompt: "A <- " + a + "\nB <- " + b + "\nA <- A + B\nOUTPUT A\n\nWhat does this output?",
          answers: [String(sum)], keywords: [new RegExp("^\\s*" + sum + "\\s*$")],
          distractors: dedupeDistractors(sum, [a, b, a * b], function (i) { return sum + i; }),
          note: "A becomes " + a + " + " + b + " = " + sum + ". B itself never changes."
        };
      }
    },
    {
      id: "l1-trace-4", category: "seqtrace",
      prompt: "Number <- 4\nNumber <- Number * 3\nNumber <- Number + 1\nOUTPUT Number\n\nWhat does this output?",
      answers: ["13"],
      keywords: [/^\s*13\s*$/],
      distractors: ["12","15","4","43"],
      note: "4 * 3 = 12, then 12 + 1 = 13. Each line uses the value Number holds at that moment.",
      randomize: function () {
        var a = randInt(2, 10), b = randInt(2, 6), c = randInt(1, 10), product = a * b, total = product + c;
        return {
          prompt: "Number <- " + a + "\nNumber <- Number * " + b + "\nNumber <- Number + " + c + "\nOUTPUT Number\n\nWhat does this output?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [product, a, c], function (i) { return total + i; }),
          note: a + " * " + b + " = " + product + ", then " + product + " + " + c + " = " + total + ". Each line uses the value Number holds at that moment."
        };
      }
    },
    {
      id: "l1-trace-5", category: "seqtrace",
      prompt: "A <- 6\nB <- 2\nA <- A * B\nB <- A + 1\nOUTPUT B\n\nWhat does this output?",
      answers: ["13"],
      keywords: [/^\s*13\s*$/],
      distractors: ["12","6","2","8"],
      note: "A becomes 6 * 2 = 12 first, then B becomes 12 + 1 = 13 - B uses the NEW value of A.",
      randomize: function () {
        var a = randInt(2, 10), b = randInt(2, 10), aTimesB = a * b, total = aTimesB + 1;
        return {
          prompt: "A <- " + a + "\nB <- " + b + "\nA <- A * B\nB <- A + 1\nOUTPUT B\n\nWhat does this output?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [aTimesB, a, b], function (i) { return total + i; }),
          note: "A becomes " + a + " * " + b + " = " + aTimesB + " first, then B becomes " + aTimesB + " + 1 = " + total + " - B uses the NEW value of A."
        };
      }
    },
    {
      id: "l1-syntax-arrow", category: "seqsyntax",
      prompt: "Which symbol stores the value on the right in the variable on the left?",
      answers: ["<-"],
      keywords: [/^\s*<-\s*$|^\s*(assignment )?arrow\s*$/i],
      distractors: ["=","->","==",":"],
      note: "Cambridge pseudocode uses <-, never a plain =, for assignment."
    },
    {
      id: "l1-syntax-output", category: "seqsyntax",
      prompt: "Which keyword displays a value to the user?",
      answers: ["OUTPUT"],
      keywords: [/^\s*output\s*$/i],
      distractors: ["INPUT","DISPLAY","PRINT","SHOW"],
      note: "OUTPUT is the Cambridge pseudocode keyword for displaying a value - not DISPLAY, PRINT or SHOW."
    },
    {
      id: "l1-syntax-input", category: "seqsyntax",
      prompt: "Which keyword receives a value typed in by the user?",
      answers: ["INPUT"],
      keywords: [/^\s*input\s*$/i],
      distractors: ["OUTPUT","READ","GET","ASK"],
      note: "INPUT is the Cambridge pseudocode keyword for receiving a value - not READ, GET or ASK."
    },
    {
      id: "l1-syntax-order", category: "seqsyntax",
      prompt: "In a sequence, what order do the instructions run in?",
      answers: ["Top to bottom, one line at a time"],
      keywords: [/top.*(to|down).*bottom|first.*to.*last/i],
      distractors: ["Whichever order finishes fastest","Bottom to top","All at the same time","In a random order"],
      note: "A sequence is an ordered set of instructions - every line runs once, in the order it is written, top before bottom."
    },
    {
      id: "l1-syntax-fix", category: "seqsyntax",
      prompt: "A student writes: Total = Price * Quantity\n\nWhat is wrong with this line?",
      answers: ["It should use <- instead of ="],
      keywords: [/(?=.*(<-|arrow))(?=.*(instead|not|should|wrong))/i],
      distractors: ["Nothing is wrong with it","It should use OUTPUT instead of Total","Price and Quantity should be swapped","It needs an INPUT line first"],
      note: "Cambridge pseudocode assigns with <-, never a plain =."
    },
    {
      id: "l1-write-1", category: "seqwrite",
      prompt: "Write pseudocode that asks for a Length and a Width, works out the Area, then displays the Area.",
      answers: ["INPUT Length, INPUT Width, Area <- Length * Width, OUTPUT Area"],
      keywords: [/(?=.*input\s+length)(?=.*input\s+width)(?=.*area\s*<-\s*length\s*\*\s*width)(?=.*output\s+area)/i],
      distractors: ["Area <- Length * Width only, with no INPUT or OUTPUT","OUTPUT Length * Width with no variable","INPUT Area","PRINT Area <- Length * Width"],
      note: "Four lines: two INPUTs, one calculation with <-, one OUTPUT."
    },
    {
      id: "l1-write-2", category: "seqwrite",
      prompt: "Number <- 3\nNumber <- Number + 4\nWhat single value does OUTPUT Number display if a third line, OUTPUT Number, is added right after line 2?",
      answers: ["7"],
      keywords: [/^\s*7\s*$/],
      distractors: ["3","4","34","12"],
      note: "3 + 4 = 7.",
      randomize: function () {
        var a = randInt(2, 20), b = randInt(2, 20), sum = a + b;
        return {
          prompt: "Number <- " + a + "\nNumber <- Number + " + b + "\nWhat single value does OUTPUT Number display if a third line, OUTPUT Number, is added right after line 2?",
          answers: [String(sum)], keywords: [new RegExp("^\\s*" + sum + "\\s*$")],
          distractors: dedupeDistractors(sum, [a, b, a * b], function (i) { return sum + i; }),
          note: a + " + " + b + " = " + sum + "."
        };
      }
    },
    {
      id: "l1-write-3", category: "seqwrite",
      prompt: "An algorithm asks for a Price and a Quantity, then works out and displays the Total. If Price is 3 and Quantity is 7, what should it display?",
      answers: ["21"],
      keywords: [/^\s*21\s*$/],
      distractors: ["10","3","7","73"],
      note: "3 * 7 = 21 - Total <- Price * Quantity.",
      randomize: function () {
        var price = randInt(2, 12), qty = randInt(2, 9), total = price * qty;
        return {
          prompt: "An algorithm asks for a Price and a Quantity, then works out and displays the Total. If Price is " + price + " and Quantity is " + qty + ", what should it display?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [price, qty, price + qty], function (i) { return total + i; }),
          note: price + " * " + qty + " = " + total + " - Total <- Price * Quantity."
        };
      }
    },
    {
      id: "l1-write-4", category: "seqwrite",
      prompt: "An algorithm asks for the number of Tickets and the PricePerTicket, then works out and displays the Cost. If Tickets is 4 and PricePerTicket is 6, what should it display?",
      answers: ["24"],
      keywords: [/^\s*24\s*$/],
      distractors: ["10","4","6","46"],
      note: "4 * 6 = 24 - Cost <- Tickets * PricePerTicket.",
      randomize: function () {
        var tickets = randInt(2, 9), price = randInt(2, 15), cost = tickets * price;
        return {
          prompt: "An algorithm asks for the number of Tickets and the PricePerTicket, then works out and displays the Cost. If Tickets is " + tickets + " and PricePerTicket is " + price + ", what should it display?",
          answers: [String(cost)], keywords: [new RegExp("^\\s*" + cost + "\\s*$")],
          distractors: dedupeDistractors(cost, [tickets, price, tickets + price], function (i) { return cost + i; }),
          note: tickets + " * " + price + " = " + cost + " - Cost <- Tickets * PricePerTicket."
        };
      }
    },
    {
      id: "l1-write-5", category: "seqwrite",
      prompt: "Which line must come LAST in a sequence that inputs a value, calculates a result, then shows it?",
      answers: ["The OUTPUT line"],
      keywords: [/output/i],
      distractors: ["The INPUT line","The calculation line","Any line, order does not matter","A DECLARE line"],
      note: "The result must be worked out before it can be displayed, so OUTPUT comes after the calculation."
    },
    {
      id: "l1-var-text", category: "variables",
      prompt: "How do you store the text Amina in a variable called Name?",
      answers: ["Name <- \"Amina\""],
      keywords: [/name\s*<-\s*"amina"/i],
      distractors: ["Name <- Amina","Name = \"Amina\"","\"Name\" <- Amina","Name <- Amina;"],
      note: "Text values are written inside quotation marks: Name <- \"Amina\"."
    },
    {
      id: "l1-var-number", category: "variables",
      prompt: "How do you store the number 12 in a variable called Age?",
      answers: ["Age <- 12"],
      keywords: [/age\s*<-\s*12\s*$/i],
      distractors: ["Age <- \"12\"","Age = 12","12 <- Age","Age <- 12;"],
      note: "A number is stored with no quotation marks - quotes are only for text."
    },
    {
      id: "l1-var-quotes", category: "variables",
      prompt: "A student writes Hobby <- Football (no quotation marks). What is wrong?",
      answers: ["Football is text, so it needs quotation marks"],
      keywords: [/(?=.*(text|word|string))(?=.*(quot))/i],
      distractors: ["Nothing is wrong with it","Hobby should be a number instead","It should use OUTPUT instead of <-","Football should be written in capitals"],
      note: "Text values always need quotation marks: Hobby <- \"Football\"."
    },
    {
      id: "l1-var-name", category: "variables",
      prompt: "A program stores a value under a name it chooses, so it can be used again later. What is this called?",
      answers: ["A variable"],
      keywords: [/variable/i],
      distractors: ["A sequence","A function","An output","A loop"],
      note: "A variable is a named place where a program stores a value."
    },
    {
      id: "l1-var-reassign", category: "variables",
      prompt: "Age <- 12\nAge <- Age + 1\nOUTPUT Age\n\nWhat does this output?",
      answers: ["13"],
      keywords: [/^\s*13\s*$/],
      distractors: ["12","1","112","121"],
      note: "Age is reassigned: 12 + 1 = 13. The old value of 12 is overwritten.",
      randomize: function () {
        var start = randInt(5, 30), inc = randInt(1, 10), total = start + inc;
        return {
          prompt: "Age <- " + start + "\nAge <- Age + " + inc + "\nOUTPUT Age\n\nWhat does this output?",
          answers: [String(total)], keywords: [new RegExp("^\\s*" + total + "\\s*$")],
          distractors: dedupeDistractors(total, [start, inc], function (i) { return total + i; }),
          note: "Age is reassigned: " + start + " + " + inc + " = " + total + ". The old value of " + start + " is overwritten."
        };
      }
    }
  ]
});
