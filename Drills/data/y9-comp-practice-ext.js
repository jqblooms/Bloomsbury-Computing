// Year 9 Competition Practice Do Now Extension: ACSL Junior Contest 2 at contest level.
// Written by tools/build_y9_comp.mjs (edit the builder). Carries shared/acsl-pseudocode.js and Loop Tracer's
// programs.js and contest-gen.js so every answer is worked out when the card is drawn.
(function () {
/* ACSL pseudocode interpreter (American Computer Science League, "What Does This Program Do?").
   Used by LoopTracer, the acsl-c2 drills (the builder copies this file into them) and the lesson builders.
   Rules, as in the ACSL wiki:
   - Assignment a = 5. Several statements on one line are separated by ':'.
   - INPUT a, b and OUTPUT expr (several expressions are joined with a space).
   - IF cond THEN ... ELSE ... END IF (a statement may follow THEN or ELSE on the same line; the block still ends
     with END IF). FOR v = start TO end STEP inc ... NEXT v (STEP may be negative; start, end and step are worked
     out once; the loop runs while v <= end, or v >= end for a negative step). WHILE cond ... END WHILE. END stops.
   - Operators, highest first: ! and unary minus; ^ or the up arrow (power, right to left); * / (real division) %;
     + -; > < >= <= != ==; &&; ||. Functions abs(x), sqrt(x), int(x) (the greatest whole number not above x).
   - Keywords and variable names are not case sensitive. A variable must be given a value before it is used.
   run(src, { inputs, maxSteps, trace }) returns { outputs: [text], values: [raw], error: {line, message} | null,
   events: [...] when trace is on }. Events: { type: 'assign', line, name, value, kind: 'set' | 'for-start' |
   'for-next' | 'input', final } and { type: 'output', line, value }. A 'for-next' event with final: true is the
   step that takes the loop variable past the end, so the loop stops. */
(function (root) {
  'use strict';

  function fail(message, line) { var e = new Error(message); e.acslLine = line; throw e; }

  // ------------------------------------------------------------------ expressions
  var OPS = ['==', '!=', '>=', '<=', '&&', '||', '>', '<', '+', '-', '*', '/', '%', '^', '↑', '!', '(', ')', ',', '='];
  function tokenize(text, line) {
    var out = [], i = 0;
    while (i < text.length) {
      var ch = text[i];
      if (/\s/.test(ch)) { i++; continue; }
      var m = /^(\d+(\.\d+)?|\.\d+)/.exec(text.slice(i));
      if (m) { out.push({ t: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
      m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i));
      if (m) { out.push({ t: 'id', v: m[0].toLowerCase(), raw: m[0] }); i += m[0].length; continue; }
      if (ch === '"') {
        var end = text.indexOf('"', i + 1);
        if (end < 0) fail('A string has no closing quote mark.', line);
        out.push({ t: 'str', v: text.slice(i + 1, end) }); i = end + 1; continue;
      }
      var op = null;
      for (var k = 0; k < OPS.length; k++) if (text.substr(i, OPS[k].length) === OPS[k]) { op = OPS[k]; break; }
      if (!op) fail('I do not understand "' + ch + '".', line);
      out.push({ t: 'op', v: op === '↑' ? '^' : op }); i += op.length;
    }
    return out;
  }

  var BINARY = { '||': 1, '&&': 2, '==': 3, '!=': 3, '>': 3, '<': 3, '>=': 3, '<=': 3, '+': 4, '-': 4, '*': 5, '/': 5, '%': 5, '^': 6 };
  var FUNCS = { abs: 1, sqrt: 1, int: 1 };

  function parseExpr(text, line) {
    var toks = tokenize(text, line), pos = 0;
    if (!toks.length) fail('An expression is missing.', line);
    function peek() { return toks[pos]; }
    function isOp(v) { var t = toks[pos]; return t && t.t === 'op' && t.v === v; }
    function expect(v) { if (!isOp(v)) fail('Expected ' + v + '.', line); pos++; }
    function unary() {
      if (isOp('!')) { pos++; return { k: 'not', a: unary() }; }
      if (isOp('-')) { pos++; return { k: 'neg', a: unary() }; }
      if (isOp('+')) { pos++; return unary(); }
      return primary();
    }
    function primary() {
      var t = peek();
      if (!t) fail('The expression stops too early.', line);
      pos++;
      if (t.t === 'num') return { k: 'num', v: t.v };
      if (t.t === 'str') return { k: 'str', v: t.v };
      if (t.t === 'id') {
        if (isOp('(')) {
          if (!FUNCS[t.v]) fail(t.raw + ' is not a function. Use abs, sqrt or int.', line);
          pos++;
          var arg = binary(1);
          expect(')');
          return { k: 'call', f: t.v, a: arg };
        }
        return { k: 'var', name: t.v, raw: t.raw };
      }
      if (t.t === 'op' && t.v === '(') { var e = binary(1); expect(')'); return e; }
      if (t.t === 'op' && t.v === '=') fail('Use == to compare. A single = stores a value.', line);
      fail('I did not expect "' + t.v + '" here.', line);
    }
    // Precedence climbing. ^ joins right to left; the others left to right.
    function binary(min) {
      var left = unary();
      for (;;) {
        var t = peek();
        if (!t || t.t !== 'op') break;
        if (t.v === '=') fail('Use == to compare. A single = stores a value.', line);
        var p = BINARY[t.v];
        if (!p || p < min) break;
        pos++;
        var right = binary(t.v === '^' ? p : p + 1);
        left = { k: 'bin', op: t.v, a: left, b: right };
      }
      return left;
    }
    var tree = binary(1);
    if (pos < toks.length) fail('I did not expect "' + toks[pos].v + '" here.', line);
    return tree;
  }

  function truthy(v) { return typeof v === 'string' ? v.length > 0 : !!v; }
  function num(v, line, what) {
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v !== 'number') fail(what + ' needs a number.', line);
    return v;
  }
  function evaluate(node, env, line) {
    switch (node.k) {
      case 'num': case 'str': return node.v;
      case 'var':
        if (!Object.prototype.hasOwnProperty.call(env, node.name)) fail(node.raw + ' has no value yet.', line);
        return env[node.name];
      case 'not': return !truthy(evaluate(node.a, env, line));
      case 'neg': return -num(evaluate(node.a, env, line), line, 'Minus');
      case 'call': {
        var x = num(evaluate(node.a, env, line), line, node.f);
        if (node.f === 'abs') return Math.abs(x);
        if (node.f === 'int') return Math.floor(clean(x));
        if (x < 0) fail('sqrt of a negative number.', line);
        return Math.sqrt(x);
      }
      case 'bin': {
        var op = node.op;
        if (op === '&&') return truthy(evaluate(node.a, env, line)) && truthy(evaluate(node.b, env, line));
        if (op === '||') return truthy(evaluate(node.a, env, line)) || truthy(evaluate(node.b, env, line));
        var a = evaluate(node.a, env, line), b = evaluate(node.b, env, line);
        if (op === '==') return a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9);
        if (op === '!=') return !(a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9));
        if (op === '+' && (typeof a === 'string' || typeof b === 'string')) return fmt(a) + fmt(b);
        if (typeof a === 'string' && typeof b === 'string' && /^[<>]=?$/.test(op)) {
          return op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : a <= b;
        }
        a = num(a, line, op); b = num(b, line, op);
        switch (op) {
          case '>': return a > b;
          case '<': return a < b;
          case '>=': return a >= b;
          case '<=': return a <= b;
          case '+': return clean(a + b);
          case '-': return clean(a - b);
          case '*': return clean(a * b);
          case '/': if (b === 0) fail('Division by zero.', line); return clean(a / b);
          case '%': if (b === 0) fail('% by zero.', line); return clean(a % b);
          case '^': return clean(Math.pow(a, b));
        }
      }
    }
    fail('I cannot work this out.', line);
  }
  // Keeps 0.1 + 0.2 from showing as 0.30000000000000004, so a value that should be whole is whole.
  function clean(x) {
    if (!isFinite(x)) return x;
    var r = Math.round(x);
    if (Math.abs(x - r) < 1e-9) return r;
    return parseFloat(x.toPrecision(12));
  }
  function fmt(v) {
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return String(clean(v));
    return String(v);
  }

  // ------------------------------------------------------------------ statements
  // Splits the program into statements: one per line, or several separated by ':' (not inside quotes).
  function splitStatements(src) {
    var out = [];
    String(src).replace(/\r\n?/g, '\n').split('\n').forEach(function (text, i) {
      var parts = [], cur = '', inStr = false;
      for (var j = 0; j < text.length; j++) {
        var ch = text[j];
        if (ch === '"') inStr = !inStr;
        if (ch === ':' && !inStr) { parts.push(cur); cur = ''; } else cur += ch;
      }
      parts.push(cur);
      parts.forEach(function (p) { p = p.trim(); if (p) out.push({ text: p, line: i + 1 }); });
    });
    return out;
  }

  var RX = {
    forLoop: /^for\s+([a-z_]\w*)\s*=\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/i,
    next: /^next(?:\s+([a-z_]\w*))?$/i,
    whileLoop: /^while\s+(.+?)(?:\s+do)?$/i,
    endWhile: /^end\s*while$/i,
    ifThen: /^if\s+(.+?)\s+then(?:\s+(.*))?$/i,
    elseLine: /^else(?:\s+(.*))?$/i,
    endIf: /^end\s*if$/i,
    input: /^input\s+(.+)$/i,
    output: /^output\s+(.+)$/i,
    end: /^end$/i,
    assign: /^([a-z_]\w*)\s*=(?!=)\s*(.+)$/i
  };

  function parseProgram(src) {
    var list = splitStatements(src), pos = 0;
    // Parses statements until one of the stop patterns; returns { body, stop }.
    function block(stops) {
      var body = [];
      while (pos < list.length) {
        var s = list[pos];
        for (var k = 0; k < stops.length; k++) if (RX[stops[k]].test(s.text)) return { body: body, stop: stops[k], at: s };
        pos++;
        body.push(statement(s.text, s.line));
      }
      return { body: body, stop: null };
    }
    function statement(text, line) {
      var m;
      if ((m = RX.forLoop.exec(text))) {
        var node = { k: 'for', line: line, v: m[1].toLowerCase(), raw: m[1], from: parseExpr(m[2], line), to: parseExpr(m[3], line), step: m[4] ? parseExpr(m[4], line) : null };
        var b = block(['next']);
        if (!b.stop) fail('FOR ' + m[1] + ' has no NEXT.', line);
        var nm = RX.next.exec(b.at.text);
        if (nm[1] && nm[1].toLowerCase() !== node.v) fail('NEXT ' + nm[1] + ' does not match FOR ' + m[1] + '.', b.at.line);
        pos++;
        node.body = b.body;
        return node;
      }
      if ((m = RX.whileLoop.exec(text))) {
        var w = { k: 'while', line: line, cond: parseExpr(m[1], line) };
        var wb = block(['endWhile']);
        if (!wb.stop) fail('WHILE has no END WHILE.', line);
        pos++;
        w.body = wb.body;
        return w;
      }
      if ((m = RX.ifThen.exec(text))) {
        var f = { k: 'if', line: line, cond: parseExpr(m[1], line), then: [], other: [] };
        if (m[2] && m[2].trim()) f.then.push(inlineStatement(m[2].trim(), line));
        var tb = block(['elseLine', 'endIf']);
        f.then = f.then.concat(tb.body);
        if (!tb.stop) fail('IF has no END IF.', line);
        if (tb.stop === 'elseLine') {
          var em = RX.elseLine.exec(tb.at.text);
          pos++;
          if (em[1] && em[1].trim()) f.other.push(inlineStatement(em[1].trim(), tb.at.line));
          var eb = block(['endIf']);
          if (!eb.stop) fail('IF has no END IF.', line);
          f.other = f.other.concat(eb.body);
        }
        pos++;
        return f;
      }
      if (RX.next.test(text)) fail('NEXT without a FOR.', line);
      if (RX.endWhile.test(text)) fail('END WHILE without a WHILE.', line);
      if (RX.endIf.test(text)) fail('END IF without an IF.', line);
      if (RX.elseLine.test(text)) fail('ELSE without an IF.', line);
      return inlineStatement(text, line);
    }
    // A simple statement (assignment, INPUT, OUTPUT, END).
    function inlineStatement(text, line) {
      var m;
      if (RX.end.test(text)) return { k: 'end', line: line };
      if ((m = RX.input.exec(text))) return { k: 'input', line: line, names: m[1].split(',').map(function (n) {
        n = n.trim(); if (!/^[a-z_]\w*$/i.test(n)) fail('INPUT needs variable names.', line); return n.toLowerCase(); }) };
      if ((m = RX.output.exec(text))) return { k: 'output', line: line, items: splitArgs(m[1]).map(function (p) { return parseExpr(p, line); }) };
      if ((m = RX.assign.exec(text))) {
        if (/^(if|for|while|next|else|end|output|input)$/i.test(m[1])) fail('Check the line: ' + text, line);
        return { k: 'set', line: line, name: m[1].toLowerCase(), raw: m[1], expr: parseExpr(m[2], line) };
      }
      if (/^(if|for|while)\b/i.test(text)) fail('This ' + text.split(/\s/)[0].toUpperCase() + ' line is not complete.', line);
      fail('I do not understand: ' + text, line);
    }
    var top = block([]);
    return top.body;
  }
  function splitArgs(text) {
    var out = [], cur = '', depth = 0, inStr = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') inStr = !inStr;
      if (!inStr && ch === '(') depth++;
      if (!inStr && ch === ')') depth--;
      if (!inStr && ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out;
  }

  function run(src, opts) {
    opts = opts || {};
    var inputs = (opts.inputs || []).slice(), maxSteps = opts.maxSteps || 200000, trace = !!opts.trace;
    var env = {}, outputs = [], values = [], events = [], steps = 0;
    var STOP = {};
    function tick(line) { if (++steps > maxSteps) fail('The program ran too many steps. Is a loop stuck?', line); }
    function setVar(name, value, line, kind, final) {
      env[name] = value;
      if (trace) events.push({ type: 'assign', line: line, name: name, value: value, kind: kind, final: !!final });
    }
    function exec(body) {
      for (var i = 0; i < body.length; i++) {
        var s = body[i];
        tick(s.line);
        switch (s.k) {
          case 'set': setVar(s.name, evaluate(s.expr, env, s.line), s.line, 'set'); break;
          case 'input':
            s.names.forEach(function (n) {
              if (!inputs.length) fail('INPUT has no value left to read.', s.line);
              var raw = String(inputs.shift()), v = /^\s*-?\d+(\.\d+)?\s*$/.test(raw) ? Number(raw) : raw;
              setVar(n, v, s.line, 'input');
            });
            break;
          case 'output': {
            var vals = s.items.map(function (e) { return evaluate(e, env, s.line); });
            var text = vals.map(fmt).join(' ');
            outputs.push(text);
            values.push(vals.length === 1 ? vals[0] : text);
            if (trace) events.push({ type: 'output', line: s.line, value: text });
            break;
          }
          case 'end': throw STOP;
          case 'if':
            if (truthy(evaluate(s.cond, env, s.line))) exec(s.then); else exec(s.other);
            break;
          case 'while':
            while (truthy(evaluate(s.cond, env, s.line))) { exec(s.body); tick(s.line); }
            break;
          case 'for': {
            var from = num(evaluate(s.from, env, s.line), s.line, 'FOR');
            var to = num(evaluate(s.to, env, s.line), s.line, 'TO');
            var step = s.step ? num(evaluate(s.step, env, s.line), s.line, 'STEP') : 1;
            if (step === 0) fail('STEP 0 never ends.', s.line);
            setVar(s.v, from, s.line, 'for-start');
            while (step > 0 ? env[s.v] <= to + 1e-9 : env[s.v] >= to - 1e-9) {
              exec(s.body);
              tick(s.line);
              var nv = clean(num(env[s.v], s.line, 'NEXT') + step);
              setVar(s.v, nv, s.line, 'for-next', step > 0 ? nv > to + 1e-9 : nv < to - 1e-9);
            }
            break;
          }
        }
      }
    }
    var error = null;
    try {
      exec(parseProgram(src));
    } catch (e) {
      if (e !== STOP) error = { line: e.acslLine || 0, message: e && e.message ? e.message : String(e) };
    }
    var result = { outputs: outputs, values: values, error: error, vars: env };
    if (trace) result.events = events;
    return result;
  }

  // One expression's value (for checking an operator question).
  function evalExpr(text, vars) {
    var env = {};
    Object.keys(vars || {}).forEach(function (k) { env[k.toLowerCase()] = vars[k]; });
    return evaluate(parseExpr(text, 1), env, 1);
  }

  var api = { run: run, evalExpr: evalExpr, format: fmt, parse: parseProgram };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ACSLPseudo = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

// Loop Tracer programs: random ACSL pseudocode loop programs by level, every answer worked out by
// shared/acsl-pseudocode.js. tools/build_acsl_c2_loops.mjs copies this file into the acsl-c2 drills, so it must
// stay a plain script that needs only ACSLPseudo.
//   ACSLLoops.make(level, { maxRows }) -> { level, skill, lines, src, output, rows, events }
// Levels: 1 FOR loops, 2 STEP (and negative STEP), 3 WHILE loops, 4 IF inside a loop (% and the int() test),
// 5 nested loops, 6 contest length (long loops: spot the pattern; too long to trace row by row).
var ACSLLoops = (function () {
  'use strict';
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function v2() { var p = pick([['s', 'i'], ['t', 'k'], ['a', 'j'], ['x', 'n'], ['s', 'j']]); return { acc: p[0], i: p[1] }; }

  var LEVELS = [
    { n: 1, name: 'FOR loops', blurb: 'Accumulators and counters in a FOR loop.' },
    { n: 2, name: 'STEP', blurb: 'FOR loops that count up or down in steps.' },
    { n: 3, name: 'WHILE loops', blurb: 'Loops that run until a condition is false.' },
    { n: 4, name: 'IF and int()', blurb: 'Tests inside a loop: %, and x / k == int(x / k).' },
    { n: 5, name: 'Nested loops', blurb: 'A loop inside a loop.' },
    { n: 6, name: 'Contest', blurb: 'Long loops: spot the pattern instead of tracing every step.' }
  ];

  var T = {
    1: [
      { skill: 'Accumulator', make: function () {
        var v = v2(), a = R(1, 4), b = a + R(2, 4);
        return [v.acc + ' = 0', 'FOR ' + v.i + ' = ' + a + ' TO ' + b, '  ' + v.acc + ' = ' + v.acc + ' + ' + v.i, 'NEXT ' + v.i, 'OUTPUT ' + v.acc];
      } },
      { skill: 'Accumulator', make: function () {
        var v = v2(), k = R(2, 4), c = R(1, 3), n = R(3, 5);
        return [v.acc + ' = ' + R(0, 5), 'FOR ' + v.i + ' = 1 TO ' + n, '  ' + v.acc + ' = ' + v.acc + ' + ' + k + ' * ' + v.i + ' - ' + c, 'NEXT ' + v.i, 'OUTPUT ' + v.acc];
      } },
      { skill: 'Product', make: function () {
        var n = R(3, 5), s = R(1, 2);
        return ['p = 1', 'FOR i = ' + s + ' TO ' + n, '  p = p * i', 'NEXT i', 'OUTPUT p'];
      } },
      { skill: 'Doubling', make: function () {
        var n = R(3, 5), a = R(1, 3), k = pick([2, 3]), c = R(0, a - 1);
        return ['x = ' + a, 'FOR i = 1 TO ' + n, '  x = x * ' + k + (c ? ' - ' + c : ''), 'NEXT i', 'OUTPUT x'];
      } },
      { skill: 'Counter', make: function () {
        var a = R(2, 6), b = a + R(3, 6), k = R(2, 3);
        return ['c = 0 : t = 0', 'FOR i = ' + a + ' TO ' + b, '  c = c + 1', '  t = t + ' + k, 'NEXT i', 'OUTPUT c * t'];
      } },
      { skill: 'Swap', make: function () {
        var n = R(3, 5);
        return ['a = ' + R(1, 2) + ' : b = ' + R(1, 3), 'FOR i = 1 TO ' + n, '  c = a + b : a = b : b = c', 'NEXT i', 'OUTPUT b'];
      } }
    ],
    2: [
      { skill: 'STEP', make: function () {
        var st = R(2, 3), a = R(1, 3), b = a + st * R(3, 4) + R(0, st - 1);
        return ['s = 0', 'FOR i = ' + a + ' TO ' + b + ' STEP ' + st, '  s = s + i', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Negative STEP', make: function () {
        var a = R(6, 9), st = pick([1, 2]), b = R(1, 3);
        return ['s = 0', 'FOR k = ' + a + ' TO ' + b + ' STEP -' + st, '  s = s + k', 'NEXT k', 'OUTPUT s'];
      } },
      { skill: 'Negative STEP', make: function () {
        var a = R(10, 20), st = R(3, 5), b = R(0, 4);
        return ['c = 0', 'FOR k = ' + a + ' TO ' + b + ' STEP -' + st, '  c = c + 1', 'NEXT k', 'OUTPUT c'];
      } },
      { skill: 'STEP', make: function () {
        var st = R(3, 5), b = R(12, 20);
        return ['c = 0 : t = 0', 'FOR j = 0 TO ' + b + ' STEP ' + st, '  c = c + 1', '  t = t + j', 'NEXT j', 'OUTPUT t - c'];
      } },
      { skill: 'Negative STEP', make: function () {
        var a = R(4, 6);
        return ['t = ""', 'FOR i = ' + a + ' TO 1 STEP -' + pick([1, 2]), '  t = t + i', 'NEXT i', 'OUTPUT t'];
      } },
      { skill: 'STEP', make: function () {
        var a = R(1, 3), st = R(2, 3), n = R(3, 4), b = a + st * n;
        return ['p = 1', 'FOR i = ' + a + ' TO ' + b + ' STEP ' + st, '  p = p + i * 2', 'NEXT i', 'OUTPUT p'];
      } }
    ],
    3: [
      { skill: 'WHILE', make: function () {
        var a = R(1, 5), k = pick([2, 3]), lim = R(40, 120);
        return ['x = ' + a + ' : c = 0', 'WHILE x < ' + lim, '  x = x * ' + k, '  c = c + 1', 'END WHILE', 'OUTPUT c'];
      } },
      { skill: 'Digit sum', make: function () {
        var n = R(100, 999);
        return ['n = ' + n + ' : s = 0', 'WHILE n > 0', '  s = s + n % 10', '  n = int(n / 10)', 'END WHILE', 'OUTPUT s'];
      } },
      { skill: 'WHILE', make: function () {
        var a = R(30, 60), k = R(5, 9);
        return ['x = ' + a + ' : c = 0', 'WHILE x >= ' + k, '  x = x - ' + k, '  c = c + 1', 'END WHILE', 'OUTPUT c * 10 + x'];
      } },
      { skill: 'Running total', make: function () {
        var lim = R(15, 40);
        return ['s = 0 : i = 0', 'WHILE s < ' + lim, '  i = i + 1', '  s = s + i', 'END WHILE', 'OUTPUT i'];
      } },
      { skill: 'Halving', make: function () {
        var n = pick([48, 80, 96, 112, 144, 160, 176, 208]);
        return ['n = ' + n + ' : c = 0', 'WHILE n / 2 == int(n / 2)', '  n = n / 2', '  c = c + 1', 'END WHILE', 'OUTPUT n + c'];
      } },
      { skill: 'Reverse digits', make: function () {
        var n = R(102, 987);
        return ['n = ' + n + ' : r = 0', 'WHILE n > 0', '  r = r * 10 + n % 10', '  n = int(n / 10)', 'END WHILE', 'OUTPUT r'];
      } }
    ],
    4: [
      { skill: 'int() test', make: function () {
        var k = R(3, 4), b = R(10, 14);
        return ['c = 0', 'FOR i = 1 TO ' + b, '  IF i / ' + k + ' == int(i / ' + k + ') THEN', '    c = c + i', '  END IF', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: '% test', make: function () {
        var a = R(1, 3), b = a + R(4, 6);
        return ['e = 0 : d = 0', 'FOR i = ' + a + ' TO ' + b, '  IF i % 2 == 0 THEN', '    e = e + i', '  ELSE', '    d = d + 1', '  END IF', 'NEXT i', 'OUTPUT e - d'];
      } },
      { skill: 'int() test', make: function () {
        var n = pick([12, 18, 20, 24, 28, 30]);
        return ['n = ' + n + ' : c = 0', 'FOR k = 1 TO n', '  IF n / k == int(n / k) THEN c = c + 1', '  END IF', 'NEXT k', 'OUTPUT c'];
      } },
      { skill: 'Biggest', make: function () {
        var a = R(2, 5), b = R(5, 9);
        return ['m = 0', 'FOR i = 1 TO ' + b, '  x = (i * ' + a + ') % ' + (b + 2), '  IF x > m THEN m = x', '  END IF', 'NEXT i', 'OUTPUT m'];
      } },
      { skill: '&& test', make: function () {
        var b = R(15, 24);
        return ['c = 0', 'FOR i = 1 TO ' + b, '  IF i % 2 == 1 && i % 3 == 0 THEN', '    c = c + 1', '  END IF', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'abs()', make: function () {
        var t = R(4, 7);
        return ['s = 0', 'FOR i = 1 TO ' + (t + R(2, 3)), '  s = s + abs(i - ' + t + ')', 'NEXT i', 'OUTPUT s'];
      } }
    ],
    5: [
      { skill: 'Nested count', make: function () {
        var a = R(2, 4), b = R(2, 4);
        return ['c = 0', 'FOR i = 1 TO ' + a, '  FOR j = 1 TO ' + b, '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Triangle', make: function () {
        var a = R(3, 4);
        return ['c = 0', 'FOR i = 1 TO ' + a, '  FOR j = i TO ' + a, '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Nested sum', make: function () {
        var a = R(2, 3), b = R(2, 3);
        return ['s = 0', 'FOR i = 1 TO ' + a, '  FOR j = 1 TO ' + b, '    s = s + i * j', '  NEXT j', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Sum of squares', make: function () {
        var a = R(3, 4);
        return ['s = 0', 'FOR i = 1 TO ' + a, '  FOR j = 1 TO i', '    s = s + i', '  NEXT j', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Nested WHILE', make: function () {
        var a = R(2, 3);
        return ['c = 0', 'FOR i = 1 TO ' + a, '  x = i', '  WHILE x < 6', '    x = x * 2', '    c = c + 1', '  END WHILE', 'NEXT i', 'OUTPUT c'];
      } }
    ],
    6: [
      { skill: 'Sum of squares', make: function () {
        var n = pick([7, 8, 9, 10, 11, 12]);
        return ['a = 0', 'FOR i = 1 TO ' + n, '  FOR j = 1 TO i', '    a = a + i', '  NEXT j', 'NEXT i', 'c = 0', 'FOR k = 1 TO a', '  IF a / k == int(a / k) THEN c = c + 1', '  END IF', 'NEXT k', 'OUTPUT c'];
      } },
      { skill: 'Gauss', make: function () {
        var n = pick([20, 30, 40, 50, 60, 80, 100]), st = pick([1, 1, 2]);
        return ['s = 0', 'FOR i = ' + (st === 2 ? 2 : 1) + ' TO ' + n + (st === 2 ? ' STEP 2' : ''), '  s = s + i', 'NEXT i', 'OUTPUT s'];
      } },
      { skill: 'Odd numbers', make: function () {
        var n = R(12, 25);
        return ['s = 0', 'FOR i = 1 TO ' + (2 * n - 1) + ' STEP 2', '  s = s + i', 'NEXT i', 'OUTPUT sqrt(s)'];
      } },
      { skill: 'Multiples', make: function () {
        var a = pick([3, 4, 6]), b = pick([5, 7]), n = pick([50, 60, 70, 84, 100]);
        return ['c = 0', 'FOR i = 1 TO ' + n, '  IF i % ' + a + ' == 0 || i % ' + b + ' == 0 THEN', '    c = c + 1', '  END IF', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Factors', make: function () {
        var n = pick([36, 48, 60, 72, 84, 90, 96, 100]);
        return ['n = ' + n + ' : s = 0', 'FOR k = 1 TO n', '  IF n / k == int(n / k) THEN s = s + k', '  END IF', 'NEXT k', 'OUTPUT s'];
      } },
      { skill: 'Nested count', make: function () {
        var n = pick([8, 9, 10, 12, 15]);
        return ['c = 0', 'FOR i = 1 TO ' + n, '  FOR j = i + 1 TO ' + n, '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'];
      } },
      { skill: 'Countdown', make: function () {
        var a = pick([50, 60, 75, 90, 100]), st = pick([3, 4, 6, 7]);
        return ['c = 0 : s = 0', 'FOR i = ' + a + ' TO 1 STEP -' + st, '  c = c + 1', '  s = i', 'NEXT i', 'OUTPUT c * 100 + s'];
      } }
    ]
  };

  // The rows of a trace table: every value a variable is given, and every output, in order. The step that takes a
  // FOR variable past its end is left out, as in a written trace table.
  function rowsOf(events) {
    return events.filter(function (e) { return !(e.type === 'assign' && e.final); }).map(function (e) {
      return e.type === 'output' ? { line: e.line, name: 'OUTPUT', value: String(e.value) } : { line: e.line, name: e.name, value: ACSLPseudo.format(e.value), kind: e.kind };
    });
  }

  function make(level, opts) {
    opts = opts || {};
    var list = T[level] || T[1], maxRows = opts.maxRows || 0;
    for (var tries = 0; tries < 200; tries++) {
      var t = opts.skill ? (list.filter(function (x) { return x.skill === opts.skill; })[0] || pick(list)) : pick(list);
      var lines = t.make(), src = lines.join('\n');
      var r = ACSLPseudo.run(src, { trace: true });
      if (r.error) throw new Error('Loop Tracer program failed: ' + r.error.message + '\n' + src);
      var rows = rowsOf(r.events);
      if (maxRows && rows.length > maxRows) continue;
      if (opts.avoid && opts.avoid.indexOf(src) !== -1) continue;
      return { level: level, skill: t.skill, lines: lines, src: src, output: r.outputs.join('\n'), outputs: r.outputs, rows: rows, events: r.events };
    }
    throw new Error('No program fits level ' + level + ' with at most ' + maxRows + ' rows.');
  }

  return { LEVELS: LEVELS, make: make, rowsOf: rowsOf, templates: T, R: R, pick: pick };
})();

// ACSL Contest 2 question generators, original questions in the ACSL style: prefix, infix and postfix notation,
// bit-string flicking, and What Does This Program Do (loops). Every answer is worked out in code.
// Used by Loop Tracer's Mock Contest and copied by tools/build_acsl_c2_contest.mjs into the acsl-c2-mock and
// acsl-c2-contest-ext drills, so it must stay a plain script that needs only ACSLPseudo and ACSLLoops.
//   ACSLGen.question(kind) -> { kind, topic, prompt, code, answer, keyword (RegExp), accept(typed), distractors,
//                               why: [lines], example, working: [two nudges] }
// Kinds: 'prefix-eval', 'postfix-eval', 'to-postfix', 'to-prefix', 'bits-eval', 'bits-solve', 'loop'.
var ACSLGen = (function () {
  'use strict';
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var UP = '↑';

  // ================================================================== notation
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  var SHOW = { '+': '+', '-': '-', '*': '*', '/': '/', '^': UP };
  function leaf(v) { return { leaf: String(v) }; }
  function node(op, l, r) { return { op: op, l: l, r: r }; }
  // A random tree shape with n operators.
  function shape(n) {
    if (n === 0) return { leaf: '?' };
    var left = R(0, n - 1);
    return { op: '?', l: shape(left), r: shape(n - 1 - left) };
  }
  function leaves(t, out) { out = out || []; if (t.leaf != null) out.push(t); else { leaves(t.l, out); leaves(t.r, out); } return out; }
  function opsOf(t, out) { out = out || []; if (t.leaf == null) { opsOf(t.l, out); out.push(t); opsOf(t.r, out); } return out; }
  function clone(t) { return t.leaf != null ? { leaf: t.leaf } : { op: t.op, l: clone(t.l), r: clone(t.r) }; }

  function value(t, swap) {
    if (t.leaf != null) return Number(t.leaf);
    var a = value(t.l, swap), b = value(t.r, swap);
    if (a === null || b === null) return null;
    if (swap && (t.op === '-' || t.op === '/')) { var x = a; a = b; b = x; }
    switch (t.op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 && a % b === 0 ? a / b : null;
      case '^': return Math.pow(a, b);
    }
    return null;
  }
  function postfix(t) { return t.leaf != null ? t.leaf : postfix(t.l) + ' ' + postfix(t.r) + ' ' + SHOW[t.op]; }
  function prefix(t) { return t.leaf != null ? t.leaf : SHOW[t.op] + ' ' + prefix(t.l) + ' ' + prefix(t.r); }
  // Infix with only the brackets it needs. implied: 3(a + b) and 2b for a digit times a letter or a bracket.
  function infix(t, implied) {
    if (t.leaf != null) return t.leaf;
    var L = infix(t.l, implied), Rt = infix(t.r, implied);
    var p = PREC[t.op];
    var needL = t.l.op && (PREC[t.l.op] < p || (PREC[t.l.op] === p && t.op === '^'));
    var needR = t.r.op && (PREC[t.r.op] < p || (PREC[t.r.op] === p && t.op !== '^'));
    if (needL) L = '(' + L + ')';
    if (needR) Rt = '(' + Rt + ')';
    if (implied && t.op === '*' && t.l.leaf != null && /^\d$/.test(t.l.leaf) && ((t.r.leaf != null && /^[a-z]$/.test(t.r.leaf)) || needR)) return L + Rt;
    return L + ' ' + SHOW[t.op] + ' ' + Rt;
  }
  function fullBrackets(t) { return t.leaf != null ? t.leaf : '(' + fullBrackets(t.l) + ' ' + SHOW[t.op] + ' ' + fullBrackets(t.r) + ')'; }
  // Reads infix with every operator at the same level, left to right: the slip of ignoring precedence.
  function flatTree(t) {
    var toks = [];
    (function walk(n, top) {
      if (n.leaf != null) { toks.push(n.leaf); return; }
      var p = PREC[n.op];
      var needL = n.l.op && (PREC[n.l.op] < p || (PREC[n.l.op] === p && n.op === '^'));
      var needR = n.r.op && (PREC[n.r.op] < p || (PREC[n.r.op] === p && n.op !== '^'));
      if (needL) toks.push('('); walk(n.l); if (needL) toks.push(')');
      toks.push(n.op);
      if (needR) toks.push('('); walk(n.r); if (needR) toks.push(')');
    })(t, true);
    var i = 0;
    function atom() { var x = toks[i++]; if (x === '(') { var e = expr(); i++; return e; } return { leaf: x }; }
    function expr() { var l = atom(); while (i < toks.length && toks[i] !== ')') { var op = toks[i++]; l = node(op, l, atom()); } return l; }
    return expr();
  }

  // A number tree whose value is a whole number, every step small.
  function numberTree(nOps) {
    for (var tries = 0; tries < 2000; tries++) {
      var t = shape(nOps);
      var ok = true;
      opsOf(t).forEach(function (o) { o.op = pick(['+', '-', '*', '*', '/', '/', '+', '-', '^']); });
      leaves(t).forEach(function (l) { l.leaf = String(R(1, 9)); });
      (function check(n) {
        if (!ok || n.leaf != null) return;
        check(n.l); check(n.r);
        if (n.op === '^') { if (n.r.leaf == null || ['2', '3'].indexOf(n.r.leaf) < 0) { ok = false; return; } }
        var v = value(n);
        if (v === null || Math.abs(v) > 200 || (n.op === '^' && Math.abs(value(n.l)) > 6)) ok = false;
      })(t);
      if (!ok) continue;
      if (opsOf(t).filter(function (o) { return o.op === '^'; }).length > 1) continue;
      var v = value(t);
      if (v === null || v === 0 || Math.abs(v) > 120) continue;
      return t;
    }
    throw new Error('numberTree');
  }
  function letterTree(nOps, implied) {
    for (var tries = 0; tries < 500; tries++) {
      var t = shape(nOps);
      opsOf(t).forEach(function (o) { o.op = pick(['+', '-', '*', '*', '/', '+', '-', '^']); });
      var letters = ['a', 'b', 'c', 'd', 'e'], li = 0;
      leaves(t).forEach(function (l) { l.leaf = Math.random() < 0.25 ? String(R(2, 5)) : letters[li++ % 5]; });
      if (opsOf(t).filter(function (o) { return o.op === '^'; }).length > 1) continue;
      if (implied) {
        // Put a digit in front of a letter or a bracket somewhere, so the infix has implied multiplication.
        var cands = opsOf(t).filter(function (o) { return o.op === '*' && o.l.leaf != null; });
        if (!cands.length) continue;
        cands[0].l.leaf = String(R(2, 5));
        if (infix(t, true) === infix(t, false)) continue;
      }
      if (leaves(t).every(function (l) { return /\d/.test(l.leaf); })) continue;
      var text = infix(t, implied);
      if (text.indexOf('(') < 0 && Math.random() < 0.6) continue;   // most questions have brackets
      return t;
    }
    throw new Error('letterTree');
  }
  function numRe(n) { return new RegExp('^\\s*' + (n < 0 ? '[-−]\\s*' : '') + esc(Math.abs(n)) + '\\s*$'); }
  function others(ans, list) {
    var out = [];
    list.concat([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, -ans]).forEach(function (x) {
      if (x === null || x === undefined || !isFinite(x) || x === ans || out.indexOf(String(x)) !== -1 || out.length >= 3) return;
      out.push(String(x));
    });
    return out;
  }
  // ACSL's method for prefix: find an operator followed by two numbers, work it out, repeat.
  function prefixSteps(t) {
    var toks = prefix(t).split(' '), steps = [toks.join(' ')];
    var ops = { '+': 1, '-': 1, '*': 1, '/': 1 }; ops[UP] = 1;
    while (toks.length > 1) {
      for (var i = 0; i + 2 < toks.length; i++) {
        if (ops[toks[i]] && !ops[toks[i + 1]] && !ops[toks[i + 2]]) {
          var a = Number(toks[i + 1]), b = Number(toks[i + 2]);
          var v = toks[i] === '+' ? a + b : toks[i] === '-' ? a - b : toks[i] === '*' ? a * b : toks[i] === '/' ? a / b : Math.pow(a, b);
          toks.splice(i, 3, String(v));
          steps.push(toks.join(' '));
          break;
        }
      }
    }
    return steps;
  }
  // The stack method for postfix: numbers go on the stack; an operator takes the top two.
  function postfixSteps(t) {
    var toks = postfix(t).split(' '), stack = [], steps = [];
    toks.forEach(function (x) {
      if (/^\d+$/.test(x)) { stack.push(Number(x)); return; }
      var b = stack.pop(), a = stack.pop();
      var v = x === '+' ? a + b : x === '-' ? a - b : x === '*' ? a * b : x === '/' ? a / b : Math.pow(a, b);
      stack.push(v);
      steps.push(a + ' ' + x + ' ' + b + ' = ' + v + '   stack: ' + stack.join(' '));
    });
    return steps;
  }

  function evalQuestion(kind) {
    var t = numberTree(R(4, 5)), ans = value(t), isPre = kind === 'prefix-eval';
    var text = isPre ? prefix(t) : postfix(t);
    var swapped = value(t, true);
    var ex;
    do { ex = numberTree(3); } while (value(ex) === ans || String(isPre ? prefix(ex) : postfix(ex)) === text);
    var exSteps = isPre ? prefixSteps(ex) : postfixSteps(ex);
    return {
      kind: kind, topic: 'notation',
      prompt: 'Evaluate this ' + (isPre ? 'prefix' : 'postfix') + ' expression.',
      code: text, answer: String(ans), keyword: numRe(ans),
      accept: function (s) { return numRe(ans).test(String(s)); },
      distractors: others(ans, [swapped, value(flatTree(t))]),
      why: isPre ? prefixSteps(t) : postfixSteps(t),
      example: 'Example: ' + (isPre ? prefix(ex) : postfix(ex)) + '\n' + (isPre
        ? 'Find an operator followed by two numbers. Work it out and put the answer in its place. Repeat.\n'
        : 'Read left to right. Push each number. An operator takes the top two numbers: the lower one goes first.\n') +
        exSteps.join('\n') + '\nSo the example is ' + value(ex) + '.',
      working: isPre
        ? ['Look for an operator with two numbers straight after it.', 'Replace those three with the answer, then look again.']
        : ['Use a stack: push each number as you read it.', 'An operator takes the top two numbers. The one pushed first goes on the left.']
    };
  }
  function strRe(s) {
    return new RegExp('^\\s*' + s.replace(/\s+/g, '').split('').map(function (ch) { return ch === UP ? '(\\^|' + UP + ')' : esc(ch); }).join('\\s*') + '\\s*$', 'i');
  }
  function convertQuestion(kind) {
    var implied = Math.random() < 0.35, t = letterTree(R(3, 4), implied), toPost = kind === 'to-postfix';
    var conv = toPost ? postfix : prefix;
    var ans = conv(t);
    var wrong = [];
    var flat = flatTree(t);
    [conv(flat), (toPost ? prefix : postfix)(t), conv(node(t.op, t.r, t.l)),
      leaves(t).map(function (l) { return l.leaf; }).join(' ') + ' ' + opsOf(t).map(function (o) { return SHOW[o.op]; }).join(' ')].forEach(function (w) {
      var k = w.replace(/\s+/g, '');
      if (k !== ans.replace(/\s+/g, '') && wrong.every(function (x) { return x.replace(/\s+/g, '') !== k; }) && wrong.length < 3) wrong.push(w);
    });
    var ex;
    do { ex = letterTree(2, false); } while (conv(ex).replace(/\s/g, '') === ans.replace(/\s/g, ''));
    return {
      kind: kind, topic: 'notation',
      prompt: 'Write this infix expression in ' + (toPost ? 'postfix' : 'prefix') + '.',
      code: infix(t, implied), answer: ans, keyword: strRe(ans),
      accept: function (s) { return strRe(ans).test(String(s)); },
      distractors: wrong,
      why: ['Brackets round every operation: ' + fullBrackets(t), 'Move each operator ' + (toPost ? 'after' : 'before') + ' its two operands, inside out: ' + ans],
      example: 'Example: ' + infix(ex, false) + '\nPut brackets round every operation, in the order they are worked out: ' + fullBrackets(ex) +
        '\nThen move each operator ' + (toPost ? 'to just after' : 'to just before') + ' its two operands, starting with the inside brackets.\nSo the example is ' + conv(ex) + '.',
      working: ['Put brackets round every operation, in the order the rules work them out.' + (implied ? ' A number next to a letter or a bracket means multiply.' : ''),
        'Start with the inside brackets. Move each operator ' + (toPost ? 'after' : 'before') + ' its two operands.']
    };
  }

  // ================================================================== bit strings
  var BITS = 5;
  function rb(n) { var s = ''; for (var i = 0; i < (n || BITS); i++) s += R(0, 1); return s; }
  function bnot(a) { return a.replace(/./g, function (c) { return c === '1' ? '0' : '1'; }); }
  function band(a, b) { var s = ''; for (var i = 0; i < a.length; i++) s += a[i] === '1' && b[i] === '1' ? '1' : '0'; return s; }
  function bor(a, b) { var s = ''; for (var i = 0; i < a.length; i++) s += a[i] === '1' || b[i] === '1' ? '1' : '0'; return s; }
  function bxor(a, b) { var s = ''; for (var i = 0; i < a.length; i++) s += a[i] !== b[i] ? '1' : '0'; return s; }
  function shift(op, k, a) {
    var n = a.length; k = k % (n + 1);
    if (op === 'LSHIFT') return (a + '0'.repeat(k)).slice(k);
    if (op === 'RSHIFT') return ('0'.repeat(k) + a).slice(0, n);
    k = k % n;
    if (op === 'LCIRC') return a.slice(k) + a.slice(0, k);
    return a.slice(n - k) + a.slice(0, n - k);
  }
  var BPREC = { AND: 3, XOR: 2, OR: 1 };
  // A bit tree: { lit } | { x: true } | { un: 'NOT' | 'LSHIFT' ..., k, a } | { bin: 'AND' | 'XOR' | 'OR', l, r }.
  function bval(t, x) {
    if (t.lit != null) return t.lit;
    if (t.x) return x;
    if (t.un === 'NOT') return bnot(bval(t.a, x));
    if (t.un) return shift(t.un, t.k, bval(t.a, x));
    var a = bval(t.l, x), b = bval(t.r, x);
    return t.bin === 'AND' ? band(a, b) : t.bin === 'OR' ? bor(a, b) : bxor(a, b);
  }
  function bshow(t, prec) {
    prec = prec || BPREC;
    if (t.lit != null) return t.lit;
    if (t.x) return 'x';
    if (t.un) {
      var inner = bshow(t.a, prec);
      if (t.a.bin) inner = '(' + inner + ')';
      return (t.un === 'NOT' ? 'NOT' : t.un + '-' + t.k) + ' ' + inner;
    }
    var p = prec[t.bin];
    var L = bshow(t.l, prec), Rt = bshow(t.r, prec);
    if (t.l.bin && prec[t.l.bin] < p) L = '(' + L + ')';
    if (t.r.bin && prec[t.r.bin] <= p) Rt = '(' + Rt + ')';
    return L + ' ' + t.bin + ' ' + Rt;
  }
  // Parses a bit-string expression with a precedence table: the real one, or every binary operator equal.
  function bparse(text, prec) {
    var toks = text.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim().split(/\s+/), i = 0;
    function unary() {
      var t = toks[i];
      if (t === 'NOT') { i++; return { un: 'NOT', a: unary() }; }
      var m = /^(LSHIFT|RSHIFT|LCIRC|RCIRC)-(\d)$/.exec(t || '');
      if (m) { i++; return { un: m[1], k: Number(m[2]), a: unary() }; }
      if (t === '(') { i++; var e = expr(1); i++; return e; }
      i++;
      return t === 'x' ? { x: true } : { lit: t };
    }
    function expr(min) {
      var l = unary();
      while (i < toks.length && prec[toks[i]] && prec[toks[i]] >= min) { var op = toks[i++]; l = { bin: op, l: l, r: expr(prec[op] + 1) }; }
      return l;
    }
    return expr(1);
  }
  function randomUnary(a, depth) {
    var t = a;
    for (var d = 0; d < depth; d++) {
      var un = pick(['NOT', 'LSHIFT', 'RSHIFT', 'LCIRC', 'RCIRC', 'LCIRC', 'RSHIFT']);
      t = un === 'NOT' ? { un: 'NOT', a: t } : { un: un, k: R(1, 3), a: t };
    }
    return t;
  }
  function bitsEvalQuestion() {
    for (var tries = 0; tries < 500; tries++) {
      var n = R(2, 3), t = randomUnary({ lit: rb() }, R(0, 2));
      for (var j = 1; j < n; j++) {
        var right = randomUnary({ lit: rb() }, R(0, 1));
        t = Math.random() < 0.5 ? { bin: pick(['AND', 'XOR', 'OR']), l: t, r: right } : { bin: pick(['AND', 'XOR', 'OR']), l: right, r: t };
      }
      if (Math.random() < 0.25) t = { un: 'NOT', a: t };
      var text = bshow(t), ans = bval(bparse(text, BPREC));
      if (ans !== bval(t)) continue;
      var unCount = (text.match(/NOT|SHIFT|CIRC/g) || []).length;
      if (unCount < 2) continue;
      var flat = bval(bparse(text, { AND: 1, XOR: 1, OR: 1 }));
      var swapText = text.replace(/LSHIFT|RSHIFT|LCIRC|RCIRC/, function (m) { return { LSHIFT: 'LCIRC', RSHIFT: 'RCIRC', LCIRC: 'LSHIFT', RCIRC: 'RSHIFT' }[m]; });
      var wrong = [];
      [flat, bval(bparse(swapText, BPREC)), bnot(ans), ans.slice(0, 2) + bnot(ans.slice(2, 3)) + ans.slice(3), bnot(ans.slice(0, 1)) + ans.slice(1)].forEach(function (w) {
        if (w !== ans && wrong.indexOf(w) < 0 && wrong.length < 3) wrong.push(w);
      });
      var steps = [];
      (function walk(n2) {
        if (n2.lit != null) return n2.lit;
        if (n2.un) { var a = walk(n2.a), v = bval(n2); steps.push((n2.un === 'NOT' ? 'NOT' : n2.un + '-' + n2.k) + ' ' + a + ' = ' + v); return v; }
        var l = walk(n2.l), r = walk(n2.r), v2 = bval(n2);
        steps.push(l + ' ' + n2.bin + ' ' + r + ' = ' + v2);
        return v2;
      })(bparse(text, BPREC));
      var exT, exText;
      do { exT = { bin: pick(['AND', 'OR', 'XOR']), l: randomUnary({ lit: rb() }, 1), r: { lit: rb() } }; exText = bshow(exT); } while (bval(exT) === ans || /^0+$|^1+$/.test(bval(exT)) || /\b(00000|11111)\b/.test(exText));
      var exSteps = [];
      (function walk(n2) {
        if (n2.lit != null) return n2.lit;
        if (n2.un) { var a = walk(n2.a), v = bval(n2); exSteps.push((n2.un === 'NOT' ? 'NOT' : n2.un + '-' + n2.k) + ' ' + a + ' = ' + v); return v; }
        var l = walk(n2.l), r = walk(n2.r), v2 = bval(n2);
        exSteps.push(l + ' ' + n2.bin + ' ' + r + ' = ' + v2);
        return v2;
      })(exT);
      return {
        kind: 'bits-eval', topic: 'bits',
        prompt: 'Evaluate this bit-string expression.',
        code: text, answer: ans, keyword: new RegExp('^\\s*' + ans + '\\s*$'),
        accept: function (s) { return String(s).replace(/\s+/g, '') === ans; },
        distractors: wrong,
        why: steps,
        example: 'Example: ' + exText + '\nNOT, shifts and circulates first, then AND, then XOR, then OR.\n' + exSteps.join('\n') + '\nSo the example is ' + bval(exT) + '.',
        working: ['Do NOT, the shifts and the circulates first. Then AND, then XOR, then OR.', 'Write each step as a new 5-bit string. A shift keeps 5 bits: zeros come in.']
      };
    }
    throw new Error('bitsEval');
  }
  function bitsSolveQuestion() {
    for (var tries = 0; tries < 500; tries++) {
      var form = R(0, 2), t;
      var x = { x: true };
      if (form === 0) t = randomUnary(x, R(1, 2));
      else t = { bin: pick(['AND', 'OR', 'XOR']), l: randomUnary(x, R(0, 1)), r: { lit: rb() } };
      if (form === 2) t = { bin: pick(['AND', 'OR']), l: randomUnary(x, 1), r: { lit: rb() } };
      var x0 = rb(), target = bval(t, x0), sols = [];
      for (var v = 0; v < 32; v++) { var s = ('00000' + v.toString(2)).slice(-5); if (bval(t, s) === target) sols.push(s); }
      var pat = '';
      for (var i = 0; i < BITS; i++) pat += sols.every(function (s) { return s[i] === sols[0][i]; }) ? sols[0][i] : '*';
      var stars = (pat.match(/\*/g) || []).length;
      if (sols.length !== Math.pow(2, stars) || stars > 3) continue;
      var text = bshow(t) + ' = ' + target;
      if (stars === 0 && Math.random() < 0.5) continue;   // mostly questions with a * in the answer
      var wrong = [];
      [pat.replace(/\*/g, '0'), pat.replace(/\*/g, '1'), target, bnot(pat.replace(/\*/g, '0')).replace(/./g, function (c, j) { return pat[j] === '*' ? '*' : c; }),
        pat.indexOf('*') > 0 ? '*' + pat.slice(0, 4) : pat.slice(1) + '*'].forEach(function (w) {
        if (w !== pat && wrong.indexOf(w) < 0 && wrong.length < 3) wrong.push(w);
      });
      var exT, exTarget, exPat;
      do {
        exT = { bin: 'AND', l: { x: true }, r: { lit: rb() } };
        exTarget = bval(exT, rb());
        exPat = exT.r.lit.replace(/./g, function (c, j) { return c === '1' ? exTarget[j] : '*'; });
      } while (exPat === pat || exT.r.lit.indexOf('0') < 0);
      return {
        kind: 'bits-solve', topic: 'bits',
        prompt: 'Find all 5-bit values of x that make this true. Use * for a bit that can be 0 or 1.',
        code: text, answer: pat, keyword: new RegExp('^\\s*' + pat.split('').map(function (c) { return c === '*' ? '\\*' : c; }).join('\\s*') + '\\s*$'),
        accept: function (s) { return String(s).replace(/\s+/g, '') === pat; },
        distractors: wrong,
        why: ['Work back from the answer one bit at a time.', 'Every value that works: ' + sols.join(', '), 'So x = ' + pat],
        example: 'Example: x AND ' + exT.r.lit + ' = ' + exTarget + '\nWhere the mask has a 1, the bit of x must equal the answer bit.\nWhere the mask has a 0, the answer is 0 whatever x is, so that bit is *.\nSo x = ' + exPat + '.',
        working: ['Undo the operations one at a time, from the outside in.', 'A bit that a shift pushes out, or an AND with 0 hides, can be anything: write *.']
      };
    }
    throw new Error('bitsSolve');
  }

  // ================================================================== loops
  // Plausible slips: a bound one out, < for <=, a total that starts at 1. Each is run, so the wrong answers are real.
  function slips(lines) {
    var out = [];
    lines.forEach(function (l, i) {
      var m;
      var vars = [];
      if ((m = /^(\s*FOR \w+ = .+ TO )(\d+)(.*)$/.exec(l))) vars.push(m[1] + (Number(m[2]) - 1) + m[3], m[1] + (Number(m[2]) + 1) + m[3]);
      if ((m = /^(\s*WHILE .*?)(<=|>=|<|>)(.*)$/.exec(l))) vars.push(m[1] + { '<': '<=', '<=': '<', '>': '>=', '>=': '>' }[m[2]] + m[3]);
      if (/^\w = 0\b/.test(l)) vars.push(l.replace(/^(\w) = 0/, '$1 = 1'));
      vars.forEach(function (v) { var c = lines.slice(); c[i] = v; out.push(c); });
    });
    return out;
  }
  function loopQuestion(level) {
    var p = ACSLLoops.make(level || pick([4, 5, 6]));
    var ans = p.output;
    var wrong = [];
    slips(p.lines).forEach(function (ls) {
      var r = ACSLPseudo.run(ls.join('\n'), { maxSteps: 50000 });
      if (!r.error && r.outputs.length === 1 && (/^-?[0-9]+$/.test(r.outputs[0]) || !/^-?[0-9]+$/.test(ans)) && r.outputs[0] !== ans && wrong.indexOf(r.outputs[0]) < 0 && wrong.length < 3) wrong.push(r.outputs[0]);
    });
    var n = Number(ans);
    if (isFinite(n)) [n + 1, n - 1, n + 2, n * 2].forEach(function (x) { if (wrong.length < 3 && String(x) !== ans && wrong.indexOf(String(x)) < 0) wrong.push(String(x)); });
    var ex;
    do { ex = ACSLLoops.make(pick([1, 2]), { maxRows: 12 }); } while (ex.output === ans);
    var final = Object.keys(ACSLPseudo.run(p.src).vars);
    var vals = ACSLPseudo.run(p.src).vars;
    return {
      kind: 'loop', topic: 'loops', skill: p.skill,
      prompt: 'What is output by this program?',
      code: p.src, answer: ans, keyword: isFinite(n) ? numRe(n) : new RegExp('^\\s*' + esc(ans) + '\\s*$', 'i'),
      accept: function (s) { return isFinite(n) ? numRe(n).test(String(s)) : String(s).trim().toLowerCase() === ans.toLowerCase(); },
      distractors: wrong,
      why: ['At the end: ' + final.map(function (k) { return k + ' = ' + ACSLPseudo.format(vals[k]); }).join(', '), 'Output: ' + ans],
      example: 'Example:\n' + ex.src + '\nTrace it: write each new value in a table.\n' +
        ex.rows.map(function (r) { return r.name === 'OUTPUT' ? 'output ' + r.value : r.name + ' = ' + (r.value === '' ? '""' : r.value); }).join(', ') + '\nSo the example outputs ' + ex.output + '.',
      working: ['Write the variables as columns. Add a row each time one changes.', p.level >= 6 ? 'Is it a pattern? A long sum, or a count of factors or multiples, can be worked out without every row.' : 'Follow the loop exactly: check the condition or the end value before every turn.']
    };
  }

  function question(kind) {
    for (var tries = 0; tries < 60; tries++) {
      var q = make(kind), ex = String(q.example).toLowerCase(), a = q.answer.toLowerCase();
      var whole = new RegExp('(^|[^a-z0-9*])' + esc(a) + '($|[^a-z0-9*])');
      var long = (q.prompt + '\n' + q.code).split('\n').filter(function (l) { return l.trim().length > 12 && ex.indexOf(l.trim().toLowerCase()) >= 0; });
      if (whole.test(ex) || long.length >= 2) continue;
      return q;
    }
    throw new Error('No clean question for ' + kind);
  }
  function make(kind) {
    if (kind === 'prefix-eval' || kind === 'postfix-eval') return evalQuestion(kind);
    if (kind === 'to-postfix' || kind === 'to-prefix') return convertQuestion(kind);
    if (kind === 'bits-eval') return bitsEvalQuestion();
    if (kind === 'bits-solve') return bitsSolveQuestion();
    if (kind === 'loop') return loopQuestion();
    if (/^loop-[1-6]$/.test(kind)) return loopQuestion(Number(kind.slice(5)));
    throw new Error('Unknown question kind ' + kind);
  }
  // A mock contest: 2 notation, 2 bit strings, 1 loop program, in that order.
  function mock() {
    return [question(pick(['prefix-eval', 'postfix-eval'])), question(pick(['to-postfix', 'to-prefix'])), question('bits-eval'), question('bits-solve'), question('loop')];
  }

  return { question: question, mock: mock, loopQuestion: loopQuestion,
    notation: { numberTree: numberTree, letterTree: letterTree, infix: infix, prefix: prefix, postfix: postfix, value: value, fullBrackets: fullBrackets, prefixSteps: prefixSteps, postfixSteps: postfixSteps },
    bits: { parse: bparse, value: bval, show: bshow, shift: shift, PREC: BPREC } };
})();


  function numKw(n) { return new RegExp("^\\s*" + (n < 0 ? "[-−]\\s*" : "") + String(Math.abs(n)).replace(".", "\\.") + "\\s*$"); }
  function wrongNums(ans, list) {
    var out = [];
    list.concat([ans + 1, ans - 1, ans + 2, ans * 2]).forEach(function (x) {
      var s = ACSLPseudo.format(x);
      if (x === ans || !isFinite(x) || out.indexOf(s) !== -1 || out.length >= 3 || s === ACSLPseudo.format(ans)) return;
      out.push(s);
    });
    return out;
  }
  function val(e) { return ACSLPseudo.evalExpr(e); }
  function runOut(lines) { var r = ACSLPseudo.run(lines.join("\n")); if (r.error) throw new Error(r.error.message); return r.outputs[0]; }
  var R = ACSLLoops.R, pick = ACSLLoops.pick;
  var FORMAT = { "bits-eval": "Type 5 bits", "bits-solve": "Type 5 characters: 0, 1 or *", "to-postfix": "Type the postfix expression", "to-prefix": "Type the prefix expression" };
  // A card drawn from the generators: the question, the answer, slips as wrong options, a worked example.
  // kinds may be a list: each draw picks one of them.
  function genCard(id, category, kinds) {
    return { id: id, category: category, randomize: function () {
      var kind = typeof kinds === "string" ? kinds : pick(kinds);
      var q = ACSLGen.question(kind);
      var d = { prompt: q.prompt + "\n" + q.code, answers: [q.answer], keywords: [q.keyword], distractors: q.distractors,
        example: q.example, working: q.working, note: q.why.join("\n") };
      if (FORMAT[kind]) d.format = FORMAT[kind];
      return d;
    } };
  }
  // How many times a loop body runs, worked out by adding a counter to the loop.
  function turns(head) { return Number(runOut(["n = 0", head, "  n = n + 1", "NEXT " + head.split(" ")[1], "OUTPUT n"])); }
  DrillData.register("y9-comp-practice-ext", {
    title: "Contest 2 Extension: Contest Level",
    subtitle: "Year 9 Competition Practice Do Now Extension",
    categories: [["ce-notation", "Prefix, Infix and Postfix"], ["ce-bits", "Bit-String Flicking"], ["ce-loops", "What Does This Program Do?"]],
    cards: [
      genCard("ce-01", "ce-notation", "postfix-eval"), genCard("ce-02", "ce-notation", "prefix-eval"), genCard("ce-03", "ce-notation", ["to-prefix", "to-postfix"]),
      genCard("ce-04", "ce-bits", "bits-eval"), genCard("ce-05", "ce-bits", "bits-solve"), genCard("ce-06", "ce-bits", "bits-solve"),
      genCard("ce-07", "ce-loops", "loop-3"), genCard("ce-08", "ce-loops", "loop-4"), genCard("ce-09", "ce-loops", "loop-5"), genCard("ce-10", "ce-loops", "loop-6")
    ]
  });
})();
