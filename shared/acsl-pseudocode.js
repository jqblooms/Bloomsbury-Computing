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
