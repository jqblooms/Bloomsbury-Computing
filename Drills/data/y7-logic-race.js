// Year 7: AND, OR and NOT on 1 and 0 (the class race, and its mirror drill)
// Loaded by Drills/index.html?drill=y7-logic-race
// Twenty fixed cards: ten "work it out" (1 AND 0 = ?) and ten "fill the gap" in a truth table row.
DrillData.register("y7-logic-race", {
  title: "Year 7: AND, OR and NOT",
  subtitle: "Truth tables on 1 and 0",
  choiceOnly: true,
  categories: [
    ["lg-calc", "Work It Out"],
    ["lg-gap", "Fill the Gap"]
  ],
  cards: (function () {
    var HELP = {
      AND: ["AND gives 1 only when both sides are 1.", "Look at both sides. Are they both 1?"],
      OR: ["OR gives 1 when at least one side is 1.", "Look at both sides. Is either one a 1?"],
      NOT: ["NOT flips the value.", "What is the opposite of the value?"],
      PICK: ["One of them gives 1 only when both sides are 1. The other gives 1 when either side is 1.", "Here one side is 1, the other side is 0. Which one gives this answer?"]
    };
    function calc(id, q, ans, op) {
      return { id: id, category: "lg-calc", prompt: "What is the answer?\n" + q + " = ?", answers: [ans],
        keywords: [new RegExp("^\\s*" + ans + "\\s*$")], distractors: [ans === "1" ? "0" : "1"], working: HELP[op] };
    }
    // A whole truth table with one output missing (row `miss`, counting from 0).
    function table(id, op, miss) {
      var rows = op === "NOT" ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      var out = function (r) { return op === "NOT" ? 1 - r[0] : op === "AND" ? (r[0] && r[1]) : (r[0] || r[1]); };
      var head = op === "NOT" ? "A | NOT A" : "A | B | A " + op + " B";
      var lines = rows.map(function (r, i) { return r.join(" | ") + " | " + (i === miss ? "?" : out(r)); });
      var ans = String(out(rows[miss]));
      return { id: id, category: "lg-gap", prompt: "Fill the gap in the truth table.\n" + head + "\n" + lines.join("\n"), answers: [ans],
        keywords: [new RegExp("^\\s*" + ans + "\\s*$")], distractors: [ans === "1" ? "0" : "1"], working: HELP[op] };
    }
    return [
      calc("c-and-00", "0 AND 0", "0", "AND"),
      calc("c-and-01", "0 AND 1", "0", "AND"),
      calc("c-and-10", "1 AND 0", "0", "AND"),
      calc("c-and-11", "1 AND 1", "1", "AND"),
      calc("c-or-00", "0 OR 0", "0", "OR"),
      calc("c-or-01", "0 OR 1", "1", "OR"),
      calc("c-or-10", "1 OR 0", "1", "OR"),
      calc("c-or-11", "1 OR 1", "1", "OR"),
      calc("c-not-0", "NOT 0", "1", "NOT"),
      calc("c-not-1", "NOT 1", "0", "NOT"),
      table("t-and-0", "AND", 0), table("t-and-1", "AND", 1), table("t-and-2", "AND", 2), table("t-and-3", "AND", 3),
      table("t-or-0", "OR", 0), table("t-or-1", "OR", 1), table("t-or-2", "OR", 2), table("t-or-3", "OR", 3),
      table("t-not-0", "NOT", 0), table("t-not-1", "NOT", 1)
    ];
  })()
});
