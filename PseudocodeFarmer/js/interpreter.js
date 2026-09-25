'use strict';

// ============================================================
// MINI PSEUDOCODE INTERPRETER
// ============================================================
// ---- Cambridge declarations (James, 2026-09-15): every variable must be
// DECLAREd with a type before it is assigned or read, and only holds values
// of that type. Types live on a hidden, non-enumerable property of the vars
// object so the rest of the engine can keep treating vars as a plain map.
var SIMPLE_TYPES = { INTEGER: 0, REAL: 0, STRING: '', CHAR: ' ', BOOLEAN: false };

function typesOf(vars) {
  if (!Object.prototype.hasOwnProperty.call(vars, '__types')) {
    Object.defineProperty(vars, '__types', { value: {}, enumerable: false, writable: true });
  }
  return vars.__types;
}

function undeclaredMessage(name, exampleType) {
  return name + ' has not been declared. Add a line such as: DECLARE ' + name + ' : ' + exampleType;
}

function parseTypeSpec(raw, line) {
  var text = raw.trim();
  var upper = text.toUpperCase();
  if (SIMPLE_TYPES.hasOwnProperty(upper)) return { kind: upper };
  var m = text.match(/^ARRAY\s*\[\s*(.+?)\s*:\s*(.+?)\s*\]\s*OF\s+([A-Za-z]+)\s*$/i);
  if (m) {
    var element = m[3].toUpperCase();
    if (!SIMPLE_TYPES.hasOwnProperty(element)) throw new PseudocodeError('An array must be OF a simple type such as INTEGER or STRING, not ' + m[3] + '.', line);
    return { kind: 'ARRAY', lowerCode: compileExpression(m[1], line), upperCode: compileExpression(m[2], line), element: element };
  }
  throw new PseudocodeError('"' + text + '" is not a data type. Use INTEGER, REAL, STRING, CHAR, BOOLEAN or ARRAY[1:10] OF INTEGER.', line);
}

function describeValue(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? 'an INTEGER' : 'a REAL';
  if (typeof v === 'string') return v.length === 1 ? 'a CHAR' : 'a STRING';
  if (typeof v === 'boolean') return 'a BOOLEAN';
  if (Array.isArray(v)) return 'an array';
  return 'nothing';
}

// A REAL with no fractional part is accepted by an INTEGER so that 10 / 2
// can be stored in a whole-number variable; anything else that does not fit
// the declared type is an error, as in the syllabus.
function coerceToType(value, kind, name, line) {
  if (kind === 'INTEGER') {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
    if (typeof value === 'number') throw new PseudocodeError(name + ' is an INTEGER and cannot hold ' + value + '. Declare it as REAL, or use DIV for whole-number division.', line);
  } else if (kind === 'REAL') {
    if (typeof value === 'number') return value;
  } else if (kind === 'STRING') {
    if (typeof value === 'string') return value;
  } else if (kind === 'CHAR') {
    if (typeof value === 'string' && value.length === 1) return value;
  } else if (kind === 'BOOLEAN') {
    if (typeof value === 'boolean') return value;
  } else {
    return value;
  }
  throw new PseudocodeError(name + ' is declared as ' + kind + ' but you tried to store ' + describeValue(value) + ' (' + JSON.stringify(value) + ') in it.', line);
}

function declareVariables(vars, instr, cursor) {
  var types = typesOf(vars);
  for (var d = 0; d < instr.names.length; d++) {
    var name = instr.names[d];
    if (Object.prototype.hasOwnProperty.call(vars, name)) throw new PseudocodeError(name + ' has already been declared.', instr.line);
    if (instr.spec.kind === 'ARRAY') {
      var lo = evaluateExpression(instr.spec.lowerCode, vars, cursor, instr.line);
      var hi = evaluateExpression(instr.spec.upperCode, vars, cursor, instr.line);
      if (typeof lo !== 'number' || typeof hi !== 'number' || !Number.isInteger(lo) || !Number.isInteger(hi)) throw new PseudocodeError('Array bounds must be whole numbers.', instr.line);
      if (hi < lo) throw new PseudocodeError('Array upper bound ' + hi + ' is below the lower bound ' + lo + '.', instr.line);
      if (hi - lo + 1 > 100000) throw new PseudocodeError('That array is too large.', instr.line);
      var arr = [];
      for (var i = 0; i <= hi - lo; i++) arr.push(SIMPLE_TYPES[instr.spec.element]);
      arr.lower = lo;
      vars[name] = arr;
      types[name] = instr.spec.element;
    } else {
      vars[name] = SIMPLE_TYPES[instr.spec.kind];
      types[name] = instr.spec.kind;
    }
  }
}

function storeVariable(vars, name, value, line) {
  if (!Object.prototype.hasOwnProperty.call(vars, name)) throw new PseudocodeError(undeclaredMessage(name, 'INTEGER'), line);
  var kind = typesOf(vars)[name];
  vars[name] = kind ? coerceToType(value, kind, name, line) : value;
}

function arrayOffset(arr, idx, name, line) {
  var lower = typeof arr.lower === 'number' ? arr.lower : 1;
  if (typeof idx !== 'number' || !Number.isInteger(idx)) throw new PseudocodeError('An array index must be a whole number.', line);
  if (idx < lower || idx > lower + arr.length - 1) throw new PseudocodeError('Index ' + idx + ' is outside the bounds of ' + name + ' (' + lower + ' to ' + (lower + arr.length - 1) + ').', line);
  return idx - lower;
}

function storeArrayElement(vars, name, idx, value, line) {
  if (!Object.prototype.hasOwnProperty.call(vars, name)) throw new PseudocodeError(undeclaredMessage(name, 'ARRAY[1:5] OF INTEGER'), line);
  var arr = vars[name];
  if (!Array.isArray(arr)) throw new PseudocodeError('"' + name + '" is not an array. Declare it with DECLARE ' + name + ' : ARRAY[1:5] OF INTEGER', line);
  var kind = typesOf(vars)[name];
  arr[arrayOffset(arr, idx, name, line)] = kind ? coerceToType(value, kind, name + '[...]', line) : value;
}

function PseudocodeError(message, line) {
  this.message = line ? ('Line ' + line + ': ' + message) : message;
  this.name = 'PseudocodeError';
  this.line = line || 0; // the 1-based source line, for highlighting the code box
}
PseudocodeError.prototype = Object.create(Error.prototype);

// Splits call arguments on commas outside quotes and nested brackets.
function splitArgs(raw) {
  if (!raw.trim()) return [];
  var parts = []; var cur = ''; var inQuotes = false; var depth = 0;
  for (var i = 0; i < raw.length; i++) {
    var ch = raw[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes && ch === '(') depth++;
    if (!inQuotes && ch === ')') depth--;
    if (ch === ',' && !inQuotes && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts.map(function (p) { return p.trim(); });
}

// Evaluates an expression: a quoted string, or an arithmetic expression of
// numbers, variables and TRUE/FALSE with + - * / DIV MOD and brackets, plus "&" for
// string concatenation (Cambridge pseudocode's concatenation operator, not
// "+"). Arithmetic is what makes WHILE actually useful - the loop variable
// has to change, so "N <- N + 1" needs it. Precedence is & (loosest), then
// + -, then * / DIV MOD, and brackets group.
// Word processors and smart keyboards often produce a Unicode minus sign
// (U+2212) or a dash where a hyphen-minus was meant - fold those into "-"
// so "N <- N + 1" or "SetPosition(0, -i)" pasted from a doc still works.
function normalizeDashes(s) {
  return String(s).replace(/[\u2212\u2013\u2014]/g, '-');
}
function tokenizeExpr(raw, line) {
  var tokens = [];
  var re = /(\d+(?:\.\d+)?|"[^"]*"|[A-Za-z_]\w*|[,&+\-*/()\[\]])/g;
  var m, last = 0;
  while ((m = re.exec(raw)) !== null) {
    if (!/^\s*$/.test(raw.slice(last, m.index))) {
      throw new PseudocodeError('I can\'t understand "' + raw.slice(last, m.index).trim() + '" here.', line);
    }
    tokens.push(m[0]);
    last = re.lastIndex;
  }
  if (!/^\s*$/.test(raw.slice(last))) {
    throw new PseudocodeError('I can\'t understand "' + raw.slice(last).trim() + '" here.', line);
  }
  return tokens;
}

// Expressions are tokenised and parsed once, then turned into specialised
// evaluator functions. Machines never repeat regular-expression tokenising,
// parsing or operator dispatch while they are running.
var EX_CONST = 0, EX_VAR = 1, EX_UNARY = 2, EX_BINARY = 3, EX_CALL = 4, EX_INDEX = 5;

function compileExpression(raw, line) {
  var tokens = tokenizeExpr(normalizeDashes(raw).trim(), line);
  var pos = 0;
  function peek() { return tokens[pos]; }
  function take() { return tokens[pos++]; }
  function isWord(token, word) { return typeof token === 'string' && token.toUpperCase() === word; }
  function binary(op, left, right) { return [EX_BINARY, op, left, right]; }

  function parseCall(name) {
    var canonicalName = canonicalFunctionName(name);
    if (!canonicalName) {
      throw new PseudocodeError('"' + name + '" is not a function I know. Try ' + FUNCTIONS.join(', ') + '.', line);
    }
    take();
    var args = [];
    if (peek() !== ')') {
      args.push(parseConcat());
      while (peek() === ',') { take(); args.push(parseConcat()); }
    }
    if (peek() !== ')') throw new PseudocodeError('Missing closing bracket ")" after ' + name + '.', line);
    take();
    return [EX_CALL, canonicalName, args];
  }
  function parseConcat() {
    var node = parseSum();
    while (peek() === '&') { take(); node = binary('&', node, parseSum()); }
    return node;
  }
  function parseSum() {
    var node = parseProduct();
    while (peek() === '+' || peek() === '-') { var op = take(); node = binary(op, node, parseProduct()); }
    return node;
  }
  function parseProduct() {
    var node = parseUnary();
    while (peek() === '*' || peek() === '/' || isWord(peek(), 'DIV') || isWord(peek(), 'MOD')) {
      var op = take().toUpperCase();
      node = binary(op, node, parseUnary());
    }
    return node;
  }
  function parseUnary() {
    if (peek() === '-') { take(); return [EX_UNARY, '-', parseUnary()]; }
    if (peek() === '(') {
      take();
      var grouped = parseConcat();
      if (peek() !== ')') throw new PseudocodeError('Missing closing bracket ")".', line);
      take();
      return grouped;
    }
    var token = take();
    if (token === undefined) throw new PseudocodeError('Missing a value.', line);
    if (/^\d+(?:\.\d+)?$/.test(token)) return [EX_CONST, Number(token)];
    if (/^".*"$/.test(token)) return [EX_CONST, token.slice(1, -1)];
    if (/^true$/i.test(token)) return [EX_CONST, true];
    if (/^false$/i.test(token)) return [EX_CONST, false];
    if (peek() === '(') return parseCall(token);
    if (peek() === '[') {
      take();
      var indexNode = parseConcat();
      if (peek() !== ']') throw new PseudocodeError('Missing closing bracket "]" after ' + token + '[...', line);
      take();
      return [EX_INDEX, token, indexNode];
    }
    return [EX_VAR, token];
  }

  var code = parseConcat();
  if (pos < tokens.length) throw new PseudocodeError('I don\'t understand "' + tokens[pos] + '".', line);
  var evaluator = buildExpressionEvaluator(code);
  // Stashed for static analysis (machineWouldBeStuckAtHome's literal-argument
  // check) without a second parse - the evaluator itself is a closure with no
  // way to ask "were you actually just a plain number", so the raw AST node
  // it was built from is exposed right on the function instead. Never read
  // by evaluateExpression itself - purely an inspection hook for code that
  // already has an argsCode entry in hand and wants to know its shape.
  evaluator.astNode = code;
  return evaluator;
}

// ============================================================
// CONDITIONS (for WHILE) - Cambridge pseudocode operators
// ============================================================
// Cambridge pseudocode compares with =, <>, <, >, <=, >= (NOT ==, !=),
// combines with AND / OR / NOT (NOT binds tightest, then AND, then OR), and
// lets either side of a comparison be a full arithmetic expression - so
// "WHILE N < Total + 1 DO" is valid. Brackets group either a boolean or a
// piece of arithmetic.
function tokenizeCondition(raw, line) {
  var tokens = [];
  var re = /(<=|>=|<>|[=<>+,\-*/()\[\]]|"[^"]*"|\d+(?:\.\d+)?|[A-Za-z_]\w*)/g;
  var m, last = 0;
  while ((m = re.exec(raw)) !== null) {
    if (!/^\s*$/.test(raw.slice(last, m.index))) {
      throw new PseudocodeError('I can\'t understand "' + raw.slice(last, m.index).trim() + '" in the condition. Use =, <>, <, >, <=, >=, +, -, *, /, DIV, MOD, AND, OR and NOT.', line);
    }
    tokens.push(m[0]);
    last = re.lastIndex;
  }
  if (!/^\s*$/.test(raw.slice(last))) {
    throw new PseudocodeError('I can\'t understand "' + raw.slice(last).trim() + '" in the condition. Use =, <>, <, >, <=, >=, +, -, *, /, DIV, MOD, AND, OR and NOT.', line);
  }
  return tokens;
}

function compileCondition(raw, line) {
  raw = normalizeDashes(raw);
  if (/==|!=|&&|\|\|/.test(raw)) {
    throw new PseudocodeError('Cambridge pseudocode uses "=" and "<>" for comparisons (not "==" or "!=") and AND/OR (not && or ||).', line);
  }
  var tokens = tokenizeCondition(raw, line);
  var pos = 0;
  function peek() { return tokens[pos]; }
  function take() { return tokens[pos++]; }
  function isWord(token, word) { return typeof token === 'string' && token.toUpperCase() === word; }
  function binary(op, left, right) { return [EX_BINARY, op, left, right]; }

  function parseCall(name) {
    var canonicalName = canonicalFunctionName(name);
    if (!canonicalName) {
      throw new PseudocodeError('"' + name + '" is not a function I know. Try ' + FUNCTIONS.join(', ') + '.', line);
    }
    take();
    var args = [];
    if (peek() !== ')') {
      args.push(parseArith());
      while (peek() === ',') { take(); args.push(parseArith()); }
    }
    if (peek() !== ')') throw new PseudocodeError('Missing closing bracket ")" after ' + name + '.', line);
    take();
    return [EX_CALL, canonicalName, args];
  }
  function parseOr() {
    var node = parseAnd();
    while (isWord(peek(), 'OR')) { take(); node = binary('OR', node, parseAnd()); }
    return node;
  }
  function parseAnd() {
    var node = parseNot();
    while (isWord(peek(), 'AND')) { take(); node = binary('AND', node, parseNot()); }
    return node;
  }
  function parseNot() {
    if (isWord(peek(), 'NOT')) { take(); return [EX_UNARY, 'NOT', parseNot()]; }
    return parseComparison();
  }
  function parseComparison() {
    var node = parseArith();
    var op = peek();
    if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
      take();
      node = binary(op, node, parseArith());
    }
    return node;
  }
  function parseArith() {
    var node = parseTerm();
    while (peek() === '+' || peek() === '-') { var op = take(); node = binary(op, node, parseTerm()); }
    return node;
  }
  function parseTerm() {
    var node = parseUnary();
    while (peek() === '*' || peek() === '/' || isWord(peek(), 'DIV') || isWord(peek(), 'MOD')) {
      var op = take().toUpperCase();
      node = binary(op, node, parseUnary());
    }
    return node;
  }
  function parseUnary() {
    if (peek() === '-') { take(); return [EX_UNARY, '-', parseUnary()]; }
    return parseFactor();
  }
  function parseFactor() {
    if (peek() === '(') {
      take();
      var grouped = parseOr();
      if (peek() !== ')') throw new PseudocodeError('Missing closing bracket ")".', line);
      take();
      return grouped;
    }
    var token = take();
    if (token === undefined) throw new PseudocodeError('The condition is missing a value.', line);
    if (/^\d+(?:\.\d+)?$/.test(token)) return [EX_CONST, Number(token)];
    if (/^".*"$/.test(token)) return [EX_CONST, token.slice(1, -1)];
    if (/^true$/i.test(token)) return [EX_CONST, true];
    if (/^false$/i.test(token)) return [EX_CONST, false];
    if (peek() === '(') return parseCall(token);
    if (peek() === '[') {
      take();
      var indexNode = parseArith();
      if (peek() !== ']') throw new PseudocodeError('Missing closing bracket "]" after ' + token + '[...', line);
      take();
      return [EX_INDEX, token, indexNode];
    }
    return [EX_VAR, token];
  }

  var code = parseOr();
  if (pos < tokens.length) throw new PseudocodeError('I can\'t understand "' + tokens[pos] + '" in the condition.', line);
  return buildExpressionEvaluator(code);
}

function buildExpressionEvaluator(node) {
  var kind = node[0];
  if (kind === EX_CONST) {
    var constantValue = node[1];
    return function () { return constantValue; };
  }
  if (kind === EX_VAR) {
    var variableName = node[1];
    return function (vars, cursor, line) {
      if (Object.prototype.hasOwnProperty.call(vars, variableName)) return vars[variableName];
      throw new PseudocodeError(undeclaredMessage(variableName, 'INTEGER'), line);
    };
  }
  if (kind === EX_INDEX) {
    var arrayName = node[1];
    var indexEvaluator = buildExpressionEvaluator(node[2]);
    return function (vars, cursor, line) {
      if (!Object.prototype.hasOwnProperty.call(vars, arrayName)) throw new PseudocodeError(undeclaredMessage(arrayName, 'ARRAY[1:5] OF INTEGER'), line);
      var arr = vars[arrayName];
      if (!Array.isArray(arr)) throw new PseudocodeError('"' + arrayName + '" is not an array. Declare it with DECLARE ' + arrayName + ' : ARRAY[1:5] OF INTEGER', line);
      var idx = indexEvaluator(vars, cursor, line);
      return arr[arrayOffset(arr, idx, arrayName, line)];
    };
  }
  if (kind === EX_CALL) {
    var functionName = node[1];
    var argumentEvaluators = node[2].map(buildExpressionEvaluator);
    return function (vars, cursor, line) {
      var values = new Array(argumentEvaluators.length);
      for (var i = 0; i < argumentEvaluators.length; i++) values[i] = argumentEvaluators[i](vars, cursor, line);
      return callFunction(functionName, values, cursor, line);
    };
  }
  if (kind === EX_UNARY) {
    var unary = buildExpressionEvaluator(node[2]);
    if (node[1] === 'NOT') return function (vars, cursor, line) { return !unary(vars, cursor, line); };
    return function (vars, cursor, line) { return -unary(vars, cursor, line); };
  }
  var left = buildExpressionEvaluator(node[2]);
  var right = buildExpressionEvaluator(node[3]);
  var op = node[1];
  if (op === '+') return function (v, c, l) { return left(v, c, l) + right(v, c, l); };
  if (op === '-') return function (v, c, l) { return left(v, c, l) - right(v, c, l); };
  if (op === '*') return function (v, c, l) { return left(v, c, l) * right(v, c, l); };
  if (op === '/') return function (v, c, l) { return left(v, c, l) / right(v, c, l); };
  if (op === 'DIV') return function (v, c, l) { return Math.trunc(left(v, c, l) / right(v, c, l)); };
  if (op === 'MOD') return function (v, c, l) { return left(v, c, l) % right(v, c, l); };
  if (op === '&') return function (v, c, l) { return String(left(v, c, l)) + String(right(v, c, l)); };
  if (op === 'AND') return function (v, c, l) { return !!left(v, c, l) && !!right(v, c, l); };
  if (op === 'OR') return function (v, c, l) { return !!left(v, c, l) || !!right(v, c, l); };
  if (op === '=') return function (v, c, l) { return left(v, c, l) === right(v, c, l); };
  if (op === '<>') return function (v, c, l) { return left(v, c, l) !== right(v, c, l); };
  return function (v, c, l) { return compareConditionValues(left(v, c, l), right(v, c, l), op, l); };
}

function evaluateExpression(evaluator, vars, cursor, line) {
  return evaluator(vars, cursor, line);
}

// These wrappers remain useful to tests and one-off callers. Compiled
// programs use their stored nodes directly and do not call the parser again.
function evalExpr(raw, vars, line, cursor) {
  return evaluateExpression(compileExpression(raw, line), vars, cursor, line);
}
function evalCondition(raw, vars, line, cursor) {
  return !!evaluateExpression(compileCondition(raw, line), vars, cursor, line);
}

function compareConditionValues(a, b, op, line) {
  if (op === '=') return a === b;
  if (op === '<>') return a !== b;
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new PseudocodeError('"' + op + '" compares numbers only, but one side is not a number.', line);
  }
  if (op === '<') return a < b;
  if (op === '>') return a > b;
  if (op === '<=') return a <= b;
  if (op === '>=') return a >= b;
  return false;
}

// Compiles pseudocode source into a flat instruction list. Selection and
// loop boundaries are matched here via one stack, so all supported Cambridge
// blocks can be nested and crossed endings are caught before the program runs.
function compile(source) {
  var lines = source.split('\n');
  var instructions = [];
  var blockStack = []; // open IF / FOR / WHILE blocks, innermost last

  for (var i = 0; i < lines.length; i++) {
    var lineNo = i + 1;
    var raw = lines[i];
    var line = normalizeDashes(raw).replace(/\/\/.*$/, '').trim();
    if (!line) continue;

    var m;
    if ((m = line.match(/^IF\s+(.+?)\s+THEN\s*$/i))) {
      var ifIndex = instructions.length;
      instructions.push({ type: 'IF', conditionCode: compileCondition(m[1], lineNo), rootIndex: ifIndex, line: lineNo });
      blockStack.push({ type: 'IF', rootIndex: ifIndex, branchIndex: ifIndex, branchIndices: [ifIndex], hasElse: false, line: lineNo });
      continue;
    }
    if (/^IF\b/i.test(line)) {
      throw new PseudocodeError('IF needs a condition and "THEN" at the end, e.g. IF HasCrop() THEN', lineNo);
    }
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
    if (/^ELSE\s*IF\b/i.test(line)) {
      throw new PseudocodeError('ELSEIF needs a condition and "THEN" at the end.', lineNo);
    }
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
    if (/^ELSE\b/i.test(line)) {
      throw new PseudocodeError('Use ELSE on its own, or ELSEIF Condition THEN.', lineNo);
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
    if (/^END\s*IF\s*$/i.test(line)) {
      throw new PseudocodeError('Use "ENDIF" (one word) to close an IF block.', lineNo);
    }
    if ((m = line.match(/^DECLARE\s+([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:\s*(.+)$/i))) {
      instructions.push({
        type: 'DECLARE',
        names: m[1].split(',').map(function (s) { return s.trim(); }),
        spec: parseTypeSpec(m[2], lineNo),
        line: lineNo
      });
      continue;
    }
    if (/^DECLARE\b/i.test(line)) {
      throw new PseudocodeError('DECLARE needs a name, a colon and a type, e.g. DECLARE Total : INTEGER', lineNo);
    }
    if ((m = line.match(/^FOR\s+([A-Za-z_]\w*)\s*(?:<-|←)\s*(.+?)\s+TO\s+(.+)$/i))) {
      instructions.push({ type: 'FOR', var: m[1], startCode: compileExpression(m[2], lineNo), endCode: compileExpression(m[3], lineNo), line: lineNo });
      blockStack.push({ type: 'FOR', index: instructions.length - 1, var: m[1], line: lineNo });
      continue;
    }
    if (/^FOR\b/i.test(line)) {
      throw new PseudocodeError('FOR needs a loop variable and TO, e.g. FOR Index <- 1 TO 5', lineNo);
    }
    if ((m = line.match(/^WHILE\s+(.+?)\s+DO\s*$/i))) {
      instructions.push({ type: 'WHILE', conditionCode: compileCondition(m[1], lineNo), line: lineNo });
      blockStack.push({ type: 'WHILE', index: instructions.length - 1, line: lineNo });
      continue;
    }
    if (/^WHILE\b/i.test(line)) {
      throw new PseudocodeError('WHILE needs a condition and "DO" at the end, e.g. WHILE X < 10 DO', lineNo);
    }
    if ((m = line.match(/^NEXT\s+([A-Za-z_]\w*)$/i))) {
      var top = blockStack[blockStack.length - 1];
      if (!top || top.type !== 'FOR') {
        throw new PseudocodeError('NEXT ' + m[1] + ' has no matching FOR.' + (top && top.type === 'WHILE' ? ' The open loop is a WHILE (line ' + top.line + '), which ends with ENDWHILE.' : ''), lineNo);
      }
      blockStack.pop();
      var forInstr = instructions[top.index];
      if (forInstr.var.toLowerCase() !== m[1].toLowerCase()) {
        throw new PseudocodeError('NEXT ' + m[1] + ' does not match FOR ' + forInstr.var + ' (line ' + forInstr.line + ').', lineNo);
      }
      var nextIndex = instructions.length;
      instructions.push({ type: 'NEXT', var: m[1], pairedForIndex: top.index, line: lineNo });
      forInstr.pairedNextIndex = nextIndex;
      continue;
    }
    if (/^ENDWHILE$/i.test(line)) {
      var top2 = blockStack[blockStack.length - 1];
      if (!top2 || top2.type !== 'WHILE') {
        throw new PseudocodeError('ENDWHILE has no matching WHILE.' + (top2 && top2.type === 'FOR' ? ' The open loop is a FOR (' + top2.var + ' on line ' + top2.line + '), which ends with NEXT.' : ''), lineNo);
      }
      blockStack.pop();
      var endIndex = instructions.length;
      instructions.push({ type: 'ENDWHILE', pairedWhileIndex: top2.index, line: lineNo });
      instructions[top2.index].pairedEndIndex = endIndex;
      continue;
    }
    if (/^END\s*WHILE\s*$/i.test(line)) {
      throw new PseudocodeError('Use "ENDWHILE" (one word) to close a WHILE loop.', lineNo);
    }
    if ((m = line.match(/^OUTPUT\s+(.+)$/i))) {
      instructions.push({ type: 'OUTPUT', exprCode: compileExpression(m[1], lineNo), line: lineNo });
      continue;
    }
    // CALL is mandatory in front of a procedure, matching real Cambridge
    // pseudocode - "CALL" was previously optional here ((?:CALL\s+)?), so
    // Sell() and CALL Sell() were silently treated as the same statement.
    // That let students skip the exact syntax every tutorial and mark
    // scheme is trying to teach. The bare-Name(...) case right below
    // exists only to catch that mistake with a specific, helpful error
    // instead of falling through to the generic "can't understand this
    // line" message.
    if ((m = line.match(/^CALL\s+([A-Za-z_]\w*)\s*\(\s*(.*?)\s*\)$/i))) {
      var commandName = canonicalCommandName(m[1]);
      if (!commandName) {
        throw new PseudocodeError('"' + m[1] + '" is not a command I know. Try ' + validCommandsForDisplay().join(', ') + '.', lineNo);
      }
      instructions.push({
        type: 'CALL', name: commandName,
        argsCode: splitArgs(m[2]).map(function (arg) { return compileExpression(arg, lineNo); }),
        line: lineNo
      });
      continue;
    }
    if (/^CALL\b/i.test(line)) {
      throw new PseudocodeError('CALL needs a procedure name and brackets, e.g. CALL SetPosition(2, 0)', lineNo);
    }
    if ((m = line.match(/^([A-Za-z_]\w*)\s*\(\s*(.*?)\s*\)$/i)) && canonicalCommandName(m[1])) {
      throw new PseudocodeError('Procedures need CALL in front: CALL ' + canonicalCommandName(m[1]) + '(' + m[2] + ')', lineNo);
    }
    if ((m = line.match(/^([A-Za-z_]\w*)\s*\[\s*(.+?)\s*\]\s*(?:<-|←)\s*(.+)$/))) {
      instructions.push({
        type: 'ASSIGN_INDEX', var: m[1],
        indexCode: compileExpression(m[2], lineNo),
        exprCode: compileExpression(m[3], lineNo),
        line: lineNo
      });
      continue;
    }
    if ((m = line.match(/^([A-Za-z_]\w*)\s*(?:<-|←)\s*(.+)$/))) {
      instructions.push({ type: 'ASSIGN', var: m[1], exprCode: compileExpression(m[2], lineNo), line: lineNo });
      continue;
    }
    if ((m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/))) {
      throw new PseudocodeError('Use "<-" for assignment, not "=": ' + m[1] + ' <- ' + m[2], lineNo);
    }
    throw new PseudocodeError('I can\'t understand this line: "' + line + '"', lineNo);
  }

  if (blockStack.length) {
    var unclosed = blockStack[0];
    if (unclosed.type === 'IF') {
      throw new PseudocodeError('IF is missing its ENDIF.', unclosed.line);
    }
    if (unclosed.type === 'FOR') {
      throw new PseudocodeError('FOR ' + unclosed.var + ' is missing its NEXT ' + unclosed.var + '.', unclosed.line);
    }
    throw new PseudocodeError('WHILE is missing its ENDWHILE.', unclosed.line);
  }
  return instructions;
}

var VALID_COMMANDS = [
  'Plant', 'Buy', 'Sell',
  'MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight',
  'MoveForward', 'TurnLeft', 'TurnRight', 'SetPosition'
];
function canonicalCommandName(name) {
  var key = identifierKey(name);
  for (var i = 0; i < VALID_COMMANDS.length; i++) {
    if (identifierKey(VALID_COMMANDS[i]) === key) return VALID_COMMANDS[i];
  }
  // Each farm type names the "put an item on this tile" action to fit what it is - Plant a
  // crop, but Place a battery / fish / canister. They all run the exact same plantAt(), so
  // the fitting verb is just an alias for Plant that resolves against whichever farm is
  // active. Plant itself still works everywhere, so nothing a student already learned breaks.
  var ft = FARM_TYPES[currentFarmType];
  if (ft && ft.plantVerb && identifierKey(ft.plantVerb) === key) return 'Plant';
  return null;
}
// The action verb a student should actually type on the current farm type (Plant / Place).
function activePlantVerb() {
  var ft = FARM_TYPES[currentFarmType];
  return (ft && ft.plantVerb) || 'Plant';
}
// VALID_COMMANDS with Plant shown as the farm-appropriate verb, for error-message lists.
function validCommandsForDisplay() {
  var verb = activePlantVerb();
  return VALID_COMMANDS.map(function (c) { return c === 'Plant' ? verb : c; });
}

function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

// `cursor` is either the player's own cursor, or a machine's own roaming
// cursor - whichever one this run's Move_*/Plant/Sell calls should act on.
// `stepDelayMs` slows action commands down enough to watch when a human is
// driving (the player's Run button); machines run at full speed since
// nobody is watching a single tick fire.
function runProgram(sourceOrInstructions, cursor, log, stepDelayMs) {
  var instructions = Array.isArray(sourceOrInstructions) ? sourceOrInstructions : compile(sourceOrInstructions);
  var vars = {};
  var ifTaken = {};
  var pc = 0;
  var actionSteps = 0;
  var controlHops = 0;
  var MAX_ACTIONS = 400;
  var MAX_CONTROL_HOPS = 1000;
  var WATCH_DELAY_STEPS = 40; // animate only the first ~40 steps, then run fast
  var myEpoch = runEpoch; // if Reset Game bumps runEpoch, this run stops itself

  function step() {
    return new Promise(function (resolve, reject) {
      (async function () {
        while (pc < instructions.length && runEpoch === myEpoch) {
          var instr = instructions[pc];
          var isControl = instr.type === 'IF' || instr.type === 'ELSEIF' || instr.type === 'ELSE' || instr.type === 'ENDIF' ||
            instr.type === 'FOR' || instr.type === 'NEXT' || instr.type === 'WHILE' || instr.type === 'ENDWHILE';
          if (isControl) {
            if (++controlHops > MAX_CONTROL_HOPS) {
              log('Stopped because the program passed through too many control lines without reaching an action.', true);
              break;
            }
          } else {
            controlHops = 0;
            if (++actionSteps > MAX_ACTIONS) {
              log('Stopped after ' + MAX_ACTIONS + ' actions. Use a machine for programs that need to keep running.', true);
              break;
            }
          }
          if (instr.type === 'IF') {
            ifTaken[instr.rootIndex] = !!evaluateExpression(instr.conditionCode, vars, cursor, instr.line);
            pc = ifTaken[instr.rootIndex] ? pc + 1 : instr.falseIndex;
            continue;
          }
          if (instr.type === 'ELSEIF') {
            if (ifTaken[instr.rootIndex]) {
              delete ifTaken[instr.rootIndex];
              pc = instr.endIndex + 1;
            } else {
              ifTaken[instr.rootIndex] = !!evaluateExpression(instr.conditionCode, vars, cursor, instr.line);
              pc = ifTaken[instr.rootIndex] ? pc + 1 : instr.falseIndex;
            }
            continue;
          }
          if (instr.type === 'ELSE') {
            if (ifTaken[instr.rootIndex]) {
              delete ifTaken[instr.rootIndex];
              pc = instr.endIndex + 1;
            } else {
              ifTaken[instr.rootIndex] = true;
              pc++;
            }
            continue;
          }
          if (instr.type === 'ENDIF') {
            delete ifTaken[instr.rootIndex];
            pc++;
            continue;
          }
          if (instr.type === 'FOR') {
            var startVal = evaluateExpression(instr.startCode, vars, cursor, instr.line);
            var endVal = evaluateExpression(instr.endCode, vars, cursor, instr.line);
            if (typeof startVal !== 'number' || typeof endVal !== 'number') {
              throw new PseudocodeError('FOR needs numbers, e.g. FOR ' + instr.var + ' <- 1 TO 5', instr.line);
            }
            storeVariable(vars, instr.var, startVal, instr.line);
            instr.currentEnd = endVal;
            pc = startVal > endVal ? instr.pairedNextIndex + 1 : pc + 1;
            continue;
          }
          if (instr.type === 'DECLARE') {
            declareVariables(vars, instr, cursor);
            pc++;
            continue;
          }
          if (instr.type === 'NEXT') {
            var forInstr2 = instructions[instr.pairedForIndex];
            vars[forInstr2.var]++;
            pc = vars[forInstr2.var] <= forInstr2.currentEnd ? instr.pairedForIndex + 1 : pc + 1;
            continue;
          }
          if (instr.type === 'WHILE') {
            if (evaluateExpression(instr.conditionCode, vars, cursor, instr.line)) {
              pc++; // condition true: step into the body
            } else {
              pc = instr.pairedEndIndex + 1; // condition false: skip past ENDWHILE
            }
            continue;
          }
          if (instr.type === 'ENDWHILE') {
            pc = instr.pairedWhileIndex; // loop back and re-test the WHILE condition
            continue;
          }
          if (instr.type === 'OUTPUT') {
            log(String(evaluateExpression(instr.exprCode, vars, cursor, instr.line)));
            pc++;
            continue;
          }
          if (instr.type === 'ASSIGN_INDEX') {
            var indexValue = evaluateExpression(instr.indexCode, vars, cursor, instr.line);
            storeArrayElement(vars, instr.var, indexValue, evaluateExpression(instr.exprCode, vars, cursor, instr.line), instr.line);
            pc++;
            continue;
          }
          if (instr.type === 'ASSIGN') {
            storeVariable(vars, instr.var, evaluateExpression(instr.exprCode, vars, cursor, instr.line), instr.line);
            pc++;
            continue;
          }
          if (instr.type === 'CALL') {
            var args = instr.argsCode.map(function (code) { return evaluateExpression(code, vars, cursor, instr.line); });
            runCommand(instr.name, args, cursor, log, instr.line);
            if (stepDelayMs && actionSteps <= WATCH_DELAY_STEPS) await sleep(stepDelayMs);
            pc++;
            continue;
          }
          pc++;
        }
        resolve();
      })().catch(reject);
    });
  }
  return step();
}

function runCommand(name, args, cursor, log, line) {
  name = canonicalCommandName(name) || name;
  switch (name) {
    case 'MoveUp': moveCursor(cursor, 0, -1); onCursorMoved(cursor); break;
    case 'MoveDown': moveCursor(cursor, 0, 1); onCursorMoved(cursor); break;
    case 'MoveLeft': moveCursor(cursor, -1, 0); onCursorMoved(cursor); break;
    case 'MoveRight': moveCursor(cursor, 1, 0); onCursorMoved(cursor); break;
    case 'MoveForward': moveForward(cursor); onCursorMoved(cursor); break;
    case 'TurnLeft': turnCursor(cursor, -1); onCursorMoved(cursor); break;
    case 'TurnRight': turnCursor(cursor, 1); onCursorMoved(cursor); break;
    case 'SetPosition': {
      var dx = args[0], dz = args[1];
      if (typeof dx !== 'number' || typeof dz !== 'number') {
        throw new PseudocodeError('SetPosition needs two numbers, e.g. CALL SetPosition(2, 0)', line);
      }
      setPositionRelative(cursor, dx, dz);
      onCursorMoved(cursor);
      break;
    }
    case 'Plant': log(plantAt(cursor, args[0]).message); break;
    case 'Buy': log(buySeedByLabel(args[0], true).message); break;
    case 'Sell': log(sellAt(cursor, true).message); break;
    default:
      if (VALID_COMMANDS.indexOf(name) === -1) {
        throw new PseudocodeError('"' + name + '" is not a command I know. Try ' + validCommandsForDisplay().join(', ') + '.', line);
      }
  }
  markGameDirty();
}

// Called after every movement, turn or SetPosition call so both the player's arrow
// and a machine's own marker visually follow their cursor's position and
// facing mid-program, not just at the end.
function onCursorMoved(cursor) {
  if (cursor === playerCursor) {
    updatePlayerCursorPosition();
    updateFacingIndicator(playerFacingIndicator, cursor.facing);
    updateTileInfoPanel();
    // A tutorial step's highlight can be relative to wherever the player is
    // CURRENTLY standing (e.g. "here's where a machine placed right here
    // would act"), not just a fixed tile - keep it live as the player moves,
    // not just redrawn once when the step first appeared.
    if (activeTutorial) refreshTutorialHighlight();
    return;
  }
  var machine = cursor.machine;
  if (machine) {
    positionMachineCursorMarker(machine);
    updateFacingIndicator(machine.facingIndicator, cursor.facing);
  }
}
