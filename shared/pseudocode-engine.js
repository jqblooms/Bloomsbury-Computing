// Minimal Cambridge-pseudocode compiler + synchronous interpreter, used by
// the Drills app's "write the code" cards (type: 'code'). This is a fresh,
// self-contained implementation, not a shared import from PseudocodeFarmer -
// Farmer's own engine is tightly coupled to its animated, async, farm-command
// game loop, and touching a live, working game to extract from it under time
// pressure was a worse risk than writing a smaller, purpose-built interpreter
// with the same grammar (assignment <-, IF/ELSEIF/ELSE/ENDIF, FOR/NEXT,
// WHILE/ENDWHILE, OUTPUT, array indexing). No CALL/farm-command support here -
// drill content never needs it, and leaving it out keeps this file small.
//
// Public API:
//   PseudocodeError(message, line)
//   runPseudocode(source, initialVars, maxSteps) -> { vars, outputs, error }
//     - vars: final value of every variable that exists after running
//       (starts from a fresh copy of initialVars)
//     - outputs: array of every OUTPUT value, in order
//     - error: null on success, else { message, line }
//     - a runaway loop is stopped after maxSteps (default 5000) instructions
//       and reported as an error, rather than hanging the page
(function (global) {
  'use strict';

  function PseudocodeError(message, line) {
    this.message = message;
    this.line = line;
  }
  PseudocodeError.prototype.toString = function () { return this.message; };

  // ---- lexer: one token stream shared by expression and condition parsing ----
  function lex(raw, line) {
    var tokens = [];
    var s = raw;
    var i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '"') {
        var j = i + 1, val = '';
        while (j < s.length && s[j] !== '"') {
          if (s[j] === '\\' && j + 1 < s.length) { val += s[j + 1]; j += 2; }
          else { val += s[j]; j++; }
        }
        if (j >= s.length) throw new PseudocodeError('Missing a closing " for a text value.', line);
        tokens.push({ type: 'string', value: val });
        i = j + 1;
        continue;
      }
      var two = s.substr(i, 2);
      if (two === '<=' || two === '>=' || two === '<>' || two === '<-') {
        tokens.push({ type: 'op', value: two });
        i += 2;
        continue;
      }
      if ('()[]+-*/&,=<>'.indexOf(ch) !== -1) {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }
      var numMatch = /^\d+(\.\d+)?/.exec(s.slice(i));
      if (numMatch) {
        tokens.push({ type: 'number', value: parseFloat(numMatch[0]) });
        i += numMatch[0].length;
        continue;
      }
      var idMatch = /^[A-Za-z_]\w*/.exec(s.slice(i));
      if (idMatch) {
        var word = idMatch[0];
        var upper = word.toUpperCase();
        if (upper === 'TRUE' || upper === 'FALSE') {
          tokens.push({ type: 'bool', value: upper === 'TRUE' });
        } else if (upper === 'AND' || upper === 'OR' || upper === 'NOT' || upper === 'DIV' || upper === 'MOD') {
          tokens.push({ type: 'kw', value: upper });
        } else {
          tokens.push({ type: 'ident', value: word });
        }
        i += word.length;
        continue;
      }
      throw new PseudocodeError('I don’t recognise the character "' + ch + '" in this line.', line);
    }
    return tokens;
  }

  function isOp(t, v) { return !!t && t.type === 'op' && t.value === v; }
  function isKw(t, v) { return !!t && t.type === 'kw' && t.value === v; }

  function makeBinOp(leftFn, rightFn, op, line) {
    return function (vars) {
      var a = leftFn(vars), b = rightFn(vars);
      if (op === '&') return String(a) + String(b);
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new PseudocodeError('"' + op + '" needs two numbers.', line);
      }
      if (op === '+') return a + b;
      if (op === '-') return a - b;
      if (op === '*') return a * b;
      if (op === '/' || op === 'DIV' || op === 'MOD') {
        if (b === 0) throw new PseudocodeError('Cannot divide by zero.', line);
        if (op === '/') return a / b;
        if (op === 'DIV') return Math.trunc(a / b);
        return a % b;
      }
      throw new PseudocodeError('Unknown operator "' + op + '".', line);
    };
  }

  function makeCompareOp(leftFn, rightFn, op, line) {
    return function (vars) {
      var a = leftFn(vars), b = rightFn(vars);
      if (op === '=') return a === b;
      if (op === '<>') return a !== b;
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new PseudocodeError('"' + op + '" compares numbers only.', line);
      }
      if (op === '<') return a < b;
      if (op === '>') return a > b;
      if (op === '<=') return a <= b;
      if (op === '>=') return a >= b;
      throw new PseudocodeError('Unknown comparison "' + op + '".', line);
    };
  }

  // Builds a recursive-descent parser over `tokens`. `parseExpr` covers
  // arithmetic/concatenation (used inside expressions AND as the operands
  // of a comparison); `parseCondition` covers OR/AND/NOT/comparison on top
  // of that, matching how Cambridge pseudocode actually nests the two.
  function makeParser(tokens, line) {
    var pos = 0;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function expectOp(op) {
      var t = next();
      if (!isOp(t, op)) throw new PseudocodeError('Expected "' + op + '" in this line.', line);
    }

    function parseAtom() {
      var t = peek();
      if (!t) throw new PseudocodeError('This line ends before it is finished.', line);
      if (t.type === 'number') { next(); var nv = t.value; return function () { return nv; }; }
      if (t.type === 'string') { next(); var sv = t.value; return function () { return sv; }; }
      if (t.type === 'bool') { next(); var bv = t.value; return function () { return bv; }; }
      if (isOp(t, '(')) {
        next();
        var inner = parseExpr();
        expectOp(')');
        return inner;
      }
      if (isOp(t, '-')) {
        next();
        var operand = parseUnary();
        return function (vars) {
          var v = operand(vars);
          if (typeof v !== 'number') throw new PseudocodeError('"-" needs a number.', line);
          return -v;
        };
      }
      if (t.type === 'ident') {
        next();
        var name = t.value;
        if (isOp(peek(), '[')) {
          next();
          var indexEval = parseExpr();
          expectOp(']');
          return function (vars) {
            if (!Array.isArray(vars[name])) throw new PseudocodeError(name + ' is not an array.', line);
            var idx = indexEval(vars);
            if (typeof idx !== 'number') throw new PseudocodeError('An array index must be a number.', line);
            return vars[name][idx];
          };
        }
        return function (vars) {
          if (!(name in vars)) throw new PseudocodeError(name + ' has not been given a value yet.', line);
          return vars[name];
        };
      }
      throw new PseudocodeError('I don’t understand this part of the line.', line);
    }

    function parseUnary() { return parseAtom(); }

    function parseProduct() {
      var left = parseUnary();
      while (isOp(peek(), '*') || isOp(peek(), '/') || isKw(peek(), 'DIV') || isKw(peek(), 'MOD')) {
        var op = next().value;
        var right = parseUnary();
        left = makeBinOp(left, right, op, line);
      }
      return left;
    }

    function parseSum() {
      var left = parseProduct();
      while (isOp(peek(), '+') || isOp(peek(), '-')) {
        var op = next().value;
        var right = parseProduct();
        left = makeBinOp(left, right, op, line);
      }
      return left;
    }

    function parseConcat() {
      var left = parseSum();
      while (isOp(peek(), '&')) {
        next();
        var right = parseSum();
        left = makeBinOp(left, right, '&', line);
      }
      return left;
    }

    function parseExpr() { return parseConcat(); }

    function parseComparison() {
      var left = parseExpr();
      var t = peek();
      if (t && t.type === 'op' && (t.value === '=' || t.value === '<>' || t.value === '<' || t.value === '>' || t.value === '<=' || t.value === '>=')) {
        next();
        var right = parseExpr();
        return makeCompareOp(left, right, t.value, line);
      }
      // No comparison operator: treat the bare expression as truthy/falsy,
      // e.g. a boolean variable used directly in an IF.
      return function (vars) { return !!left(vars); };
    }

    function parseNot() {
      if (isKw(peek(), 'NOT')) {
        next();
        var operand = parseNot();
        return function (vars) { return !operand(vars); };
      }
      return parseComparison();
    }

    function parseAnd() {
      var left = parseNot();
      while (isKw(peek(), 'AND')) {
        next();
        var right = parseNot();
        left = (function (l, r) { return function (vars) { return !!l(vars) && !!r(vars); }; })(left, right);
      }
      return left;
    }

    function parseOr() {
      var left = parseAnd();
      while (isKw(peek(), 'OR')) {
        next();
        var right = parseAnd();
        left = (function (l, r) { return function (vars) { return !!l(vars) || !!r(vars); }; })(left, right);
      }
      return left;
    }

    return {
      parseExpr: function () {
        var fn = parseExpr();
        if (pos < tokens.length) throw new PseudocodeError('There is extra text at the end of this line I don’t understand.', line);
        return fn;
      },
      parseCondition: function () {
        var fn = parseOr();
        if (pos < tokens.length) throw new PseudocodeError('There is extra text at the end of this condition I don’t understand.', line);
        return fn;
      }
    };
  }

  function compileExpression(raw, line) {
    return makeParser(lex(raw, line), line).parseExpr();
  }
  function compileCondition(raw, line) {
    return makeParser(lex(raw, line), line).parseCondition();
  }

  // ---- compile a whole program into a flat, jump-indexed instruction list ----
  function compile(source) {
    var lines = String(source || '').replace(/←/g, '<-').split('\n');
    var instructions = [];
    var blockStack = [];

    for (var i = 0; i < lines.length; i++) {
      var lineNo = i + 1;
      var line = lines[i].replace(/\/\/.*$/, '').trim();
      if (!line) continue;

      var m;
      if ((m = line.match(/^IF\s+(.+?)\s+THEN\s*$/i))) {
        var ifIndex = instructions.length;
        instructions.push({ type: 'IF', conditionCode: compileCondition(m[1], lineNo), rootIndex: ifIndex, line: lineNo });
        blockStack.push({ type: 'IF', rootIndex: ifIndex, branchIndex: ifIndex, branchIndices: [ifIndex], hasElse: false, line: lineNo });
        continue;
      }
      if (/^IF\b/i.test(line)) throw new PseudocodeError('IF needs a condition and "THEN" at the end, e.g. IF Total > 10 THEN', lineNo);

      if ((m = line.match(/^ELSE\s*IF\s+(.+?)\s+THEN\s*$/i))) {
        var ifBlock = blockStack[blockStack.length - 1];
        if (!ifBlock || ifBlock.type !== 'IF') throw new PseudocodeError('ELSEIF has no matching IF.', lineNo);
        if (ifBlock.hasElse) throw new PseudocodeError('ELSEIF cannot come after ELSE.', lineNo);
        var elseIfIndex = instructions.length;
        instructions[ifBlock.branchIndex].falseIndex = elseIfIndex;
        instructions.push({ type: 'ELSEIF', conditionCode: compileCondition(m[1], lineNo), rootIndex: ifBlock.rootIndex, line: lineNo });
        ifBlock.branchIndex = elseIfIndex;
        ifBlock.branchIndices.push(elseIfIndex);
        continue;
      }
      if (/^ELSE\s*IF\b/i.test(line)) throw new PseudocodeError('ELSEIF needs a condition and "THEN" at the end.', lineNo);

      if (/^ELSE$/i.test(line)) {
        var elseBlock = blockStack[blockStack.length - 1];
        if (!elseBlock || elseBlock.type !== 'IF') throw new PseudocodeError('ELSE has no matching IF.', lineNo);
        if (elseBlock.hasElse) throw new PseudocodeError('An IF block can only have one ELSE.', lineNo);
        var elseIndex = instructions.length;
        instructions[elseBlock.branchIndex].falseIndex = elseIndex;
        instructions.push({ type: 'ELSE', rootIndex: elseBlock.rootIndex, line: lineNo });
        elseBlock.branchIndex = elseIndex;
        elseBlock.branchIndices.push(elseIndex);
        elseBlock.hasElse = true;
        continue;
      }

      if (/^ENDIF$/i.test(line)) {
        var endIfBlock = blockStack[blockStack.length - 1];
        if (!endIfBlock || endIfBlock.type !== 'IF') throw new PseudocodeError('ENDIF has no matching IF.', lineNo);
        blockStack.pop();
        var endIfIndex = instructions.length;
        var finalBranch = instructions[endIfBlock.branchIndex];
        if (finalBranch.type !== 'ELSE') finalBranch.falseIndex = endIfIndex;
        instructions.push({ type: 'ENDIF', rootIndex: endIfBlock.rootIndex, line: lineNo });
        endIfBlock.branchIndices.forEach(function (index) { instructions[index].endIndex = endIfIndex; });
        continue;
      }

      if ((m = line.match(/^FOR\s+([A-Za-z_]\w*)\s*(?:<-)\s*(.+?)\s+TO\s+(.+)$/i))) {
        instructions.push({ type: 'FOR', var: m[1], startCode: compileExpression(m[2], lineNo), endCode: compileExpression(m[3], lineNo), line: lineNo });
        blockStack.push({ type: 'FOR', index: instructions.length - 1, var: m[1], line: lineNo });
        continue;
      }
      if (/^FOR\b/i.test(line)) throw new PseudocodeError('FOR needs a loop variable and TO, e.g. FOR Index <- 1 TO 5', lineNo);

      if ((m = line.match(/^WHILE\s+(.+?)\s+DO\s*$/i))) {
        instructions.push({ type: 'WHILE', conditionCode: compileCondition(m[1], lineNo), line: lineNo });
        blockStack.push({ type: 'WHILE', index: instructions.length - 1, line: lineNo });
        continue;
      }
      if (/^WHILE\b/i.test(line)) throw new PseudocodeError('WHILE needs a condition and "DO" at the end, e.g. WHILE Total < 10 DO', lineNo);

      if ((m = line.match(/^NEXT\s+([A-Za-z_]\w*)$/i))) {
        var top = blockStack[blockStack.length - 1];
        if (!top || top.type !== 'FOR') throw new PseudocodeError('NEXT ' + m[1] + ' has no matching FOR.', lineNo);
        blockStack.pop();
        var nextIndex = instructions.length;
        instructions.push({ type: 'NEXT', var: m[1], pairedForIndex: top.index, line: lineNo });
        instructions[top.index].pairedNextIndex = nextIndex;
        continue;
      }

      if (/^ENDWHILE$/i.test(line)) {
        var top2 = blockStack[blockStack.length - 1];
        if (!top2 || top2.type !== 'WHILE') throw new PseudocodeError('ENDWHILE has no matching WHILE.', lineNo);
        blockStack.pop();
        var endIndex = instructions.length;
        instructions.push({ type: 'ENDWHILE', pairedWhileIndex: top2.index, line: lineNo });
        instructions[top2.index].pairedEndIndex = endIndex;
        continue;
      }

      if ((m = line.match(/^OUTPUT\s+(.+)$/i))) {
        instructions.push({ type: 'OUTPUT', exprCode: compileExpression(m[1], lineNo), line: lineNo });
        continue;
      }

      if ((m = line.match(/^([A-Za-z_]\w*)\s*\[\s*(.+?)\s*\]\s*(?:<-)\s*(.+)$/))) {
        instructions.push({ type: 'ASSIGN_INDEX', var: m[1], indexCode: compileExpression(m[2], lineNo), exprCode: compileExpression(m[3], lineNo), line: lineNo });
        continue;
      }
      if ((m = line.match(/^([A-Za-z_]\w*)\s*(?:<-)\s*(.+)$/))) {
        instructions.push({ type: 'ASSIGN', var: m[1], exprCode: compileExpression(m[2], lineNo), line: lineNo });
        continue;
      }
      if ((m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/))) {
        throw new PseudocodeError('Use "<-" for assignment, not "=": ' + m[1] + ' <- ' + m[2], lineNo);
      }
      throw new PseudocodeError('I can’t understand this line: "' + line + '"', lineNo);
    }

    if (blockStack.length) {
      var unclosed = blockStack[0];
      if (unclosed.type === 'IF') throw new PseudocodeError('IF is missing its ENDIF.', unclosed.line);
      if (unclosed.type === 'FOR') throw new PseudocodeError('FOR ' + unclosed.var + ' is missing its NEXT ' + unclosed.var + '.', unclosed.line);
      throw new PseudocodeError('WHILE is missing its ENDWHILE.', unclosed.line);
    }
    return instructions;
  }

  // ---- run a compiled program to completion, synchronously ----
  function runPseudocode(source, initialVars, maxSteps) {
    maxSteps = maxSteps || 5000;
    var vars = {};
    Object.keys(initialVars || {}).forEach(function (k) { vars[k] = initialVars[k]; });
    var outputs = [];

    var instructions;
    try {
      instructions = compile(source);
    } catch (e) {
      return { vars: vars, outputs: outputs, error: { message: e.message, line: e.line } };
    }

    var ifTaken = {};
    var pc = 0;
    var steps = 0;
    try {
      while (pc < instructions.length) {
        if (++steps > maxSteps) {
          throw new PseudocodeError('This looks like it might run forever - check your loop condition.', instructions[pc].line);
        }
        var instr = instructions[pc];
        if (instr.type === 'ASSIGN') { vars[instr.var] = instr.exprCode(vars); pc++; continue; }
        if (instr.type === 'ASSIGN_INDEX') {
          if (!Array.isArray(vars[instr.var])) throw new PseudocodeError(instr.var + ' is not an array.', instr.line);
          vars[instr.var][instr.indexCode(vars)] = instr.exprCode(vars);
          pc++; continue;
        }
        if (instr.type === 'IF') {
          ifTaken[instr.rootIndex] = !!instr.conditionCode(vars);
          pc = ifTaken[instr.rootIndex] ? pc + 1 : instr.falseIndex;
          continue;
        }
        if (instr.type === 'ELSEIF') {
          if (ifTaken[instr.rootIndex]) { delete ifTaken[instr.rootIndex]; pc = instr.endIndex + 1; }
          else { ifTaken[instr.rootIndex] = !!instr.conditionCode(vars); pc = ifTaken[instr.rootIndex] ? pc + 1 : instr.falseIndex; }
          continue;
        }
        if (instr.type === 'ELSE') {
          if (ifTaken[instr.rootIndex]) { delete ifTaken[instr.rootIndex]; pc = instr.endIndex + 1; }
          else { ifTaken[instr.rootIndex] = true; pc++; }
          continue;
        }
        if (instr.type === 'ENDIF') { delete ifTaken[instr.rootIndex]; pc++; continue; }
        if (instr.type === 'FOR') {
          var startVal = instr.startCode(vars), endVal = instr.endCode(vars);
          if (typeof startVal !== 'number' || typeof endVal !== 'number') throw new PseudocodeError('FOR needs numbers.', instr.line);
          vars[instr.var] = startVal;
          instr.currentEnd = endVal;
          pc = startVal > endVal ? instr.pairedNextIndex + 1 : pc + 1;
          continue;
        }
        if (instr.type === 'NEXT') {
          var forInstr = instructions[instr.pairedForIndex];
          vars[forInstr.var]++;
          pc = vars[forInstr.var] <= forInstr.currentEnd ? instr.pairedForIndex + 1 : pc + 1;
          continue;
        }
        if (instr.type === 'WHILE') { pc = instr.conditionCode(vars) ? pc + 1 : instr.pairedEndIndex + 1; continue; }
        if (instr.type === 'ENDWHILE') { pc = instr.pairedWhileIndex; continue; }
        if (instr.type === 'OUTPUT') { outputs.push(instr.exprCode(vars)); pc++; continue; }
        pc++;
      }
    } catch (e) {
      return { vars: vars, outputs: outputs, error: { message: e.message, line: e.line } };
    }
    return { vars: vars, outputs: outputs, error: null };
  }

  var api = { PseudocodeError: PseudocodeError, compile: compile, runPseudocode: runPseudocode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) { global.PseudocodeEngine = api; }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
