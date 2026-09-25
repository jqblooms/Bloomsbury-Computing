// Cambridge IGCSE 0478 pseudocode interpreter for the Pseudocode Recap
// resource (PseudocodeReference/). Separate from pseudocode-engine.js on
// purpose: the Drills app depends on that engine's exact behaviour, and the
// recap needs a wider grammar (THEN on its own line, REPEAT...UNTIL, CASE OF,
// INPUT from a queue of test inputs) plus line-by-line stepping for trace
// tables. Execution is a generator, so "Run" and "Step" share one code path.
//
// House rule (James, 2026-09-15): every variable must be DECLAREd with a type
// before it is assigned or read, and only holds values of that type. Givens
// (arrays already filled in by the task) are the exception.
//
// Public API (window.CIE, or module.exports in Node):
//   new CIE.Runner(source, { inputs, givens, maxSteps })
//     .step()      -> next event { line, msg, output, changes } or null when finished
//     .runToEnd()  -> the runner, with .outputs, .trace, .error, .inputsLeft
//   CIE.lint(source)              -> [{ line, msg }] non-blocking style notes
//   CIE.checkTask(source, task)   -> { pass, results, requireFails }
//   CIE.formatValue(value)        -> how OUTPUT shows a value
(function (global) {
  'use strict';

  function CieError(message, line) {
    this.message = message;
    this.line = line || null;
  }
  CieError.prototype.toString = function () { return this.message; };

  var TYPES = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN'];
  var TYPE_ALIASES = {
    INT: 'INTEGER', FLOAT: 'REAL', DOUBLE: 'REAL', DECIMAL: 'REAL', STR: 'STRING', TEXT: 'STRING',
    BOOL: 'BOOLEAN', CHARACTER: 'CHAR', NUMBER: 'INTEGER or REAL'
  };
  var FUNCS = { LENGTH: 1, UCASE: 1, LCASE: 1, SUBSTRING: 3, ROUND: 2, RANDOM: 0, INT: 1, MOD: 2, DIV: 2 };
  var EXPR_KW = ['AND', 'OR', 'NOT', 'MOD', 'DIV'];

  // ---------------------------------------------------------------- values
  function formatValue(v) {
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      return String(Number(v.toFixed(10)));
    }
    return String(v);
  }
  function describe(v) {
    if (typeof v === 'string') return '"' + v + '"';
    return formatValue(v);
  }

  // ---------------------------------------------------------------- lexer
  function lex(src, line) {
    var toks = [];
    var i = 0;
    while (i < src.length) {
      var ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '"' || ch === '“' || ch === '”') {
        var j = i + 1, val = '';
        while (j < src.length && src[j] !== '"' && src[j] !== '“' && src[j] !== '”') { val += src[j]; j++; }
        if (j >= src.length) throw new CieError('This line has a " to start some text but no " to end it.', line);
        toks.push({ t: 'str', v: val });
        i = j + 1;
        continue;
      }
      if (ch === "'" || ch === '‘' || ch === '’') {
        var end = src.slice(i + 1).search(/['‘’]/);
        if (end === -1) throw new CieError("This line has a ' with no closing '.", line);
        var inner = src.substr(i + 1, end);
        if (inner.length !== 1) throw new CieError("Single quotes are only for one CHAR, like 'A'. Use double quotes for text: \"" + inner + '".', line);
        toks.push({ t: 'str', v: inner, isChar: true });
        i = i + end + 2;
        continue;
      }
      if (ch === '←') { toks.push({ t: 'op', v: '<-' }); i++; continue; }
      if (ch === '≤') { toks.push({ t: 'op', v: '<=' }); i++; continue; }
      if (ch === '≥') { toks.push({ t: 'op', v: '>=' }); i++; continue; }
      if (ch === '≠') { toks.push({ t: 'op', v: '<>' }); i++; continue; }
      var two = src.substr(i, 2);
      if (two === '<-' || two === '<=' || two === '>=' || two === '<>' || two === '==' || two === '!=') {
        toks.push({ t: 'op', v: two });
        i += 2;
        continue;
      }
      if ('()[],+-*/^&=<>:'.indexOf(ch) !== -1) { toks.push({ t: 'op', v: ch }); i++; continue; }
      var num = /^\d+(\.\d+)?/.exec(src.slice(i));
      if (num) { toks.push({ t: 'num', v: parseFloat(num[0]), isReal: !!num[1] }); i += num[0].length; continue; }
      var id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      if (id) {
        var up = id[0].toUpperCase();
        if (up === 'TRUE' || up === 'FALSE') toks.push({ t: 'bool', v: up === 'TRUE' });
        else if (EXPR_KW.indexOf(up) !== -1) toks.push({ t: 'kw', v: up });
        else toks.push({ t: 'id', v: id[0] });
        i += id[0].length;
        continue;
      }
      throw new CieError('The character ' + ch + ' is not used in Cambridge pseudocode.', line);
    }
    return toks;
  }

  // ---------------------------------------------------------------- expressions
  function Parser(toks, line) {
    this.toks = toks;
    this.pos = 0;
    this.line = line;
  }
  Parser.prototype.peek = function () { return this.toks[this.pos]; };
  Parser.prototype.next = function () { return this.toks[this.pos++]; };
  Parser.prototype.isOp = function (v) { var t = this.peek(); return !!t && t.t === 'op' && t.v === v; };
  Parser.prototype.isKw = function (v) { var t = this.peek(); return !!t && t.t === 'kw' && t.v === v; };
  Parser.prototype.atEnd = function () { return this.pos >= this.toks.length; };
  Parser.prototype.expectOp = function (v, msg) {
    if (!this.isOp(v)) throw new CieError(msg || ('Expected ' + v + ' here.'), this.line);
    this.next();
  };
  Parser.prototype.expr = function () { return this.or(); };
  Parser.prototype.or = function () {
    var l = this.and();
    while (this.isKw('OR')) { this.next(); l = { k: 'bin', op: 'OR', l: l, r: this.and() }; }
    return l;
  };
  Parser.prototype.and = function () {
    var l = this.not();
    while (this.isKw('AND')) { this.next(); l = { k: 'bin', op: 'AND', l: l, r: this.not() }; }
    return l;
  };
  Parser.prototype.not = function () {
    if (this.isKw('NOT')) { this.next(); return { k: 'not', e: this.not() }; }
    return this.cmp();
  };
  Parser.prototype.cmp = function () {
    var l = this.concat();
    var t = this.peek();
    if (t && t.t === 'op') {
      if (t.v === '==') throw new CieError('Use a single = to compare two values, not ==.', this.line);
      if (t.v === '!=') throw new CieError('Use <> for "not equal to", not !=.', this.line);
      if (t.v === '<-') throw new CieError('<- stores a value. To compare two values use = instead.', this.line);
      if (['=', '<>', '<', '>', '<=', '>='].indexOf(t.v) !== -1) {
        this.next();
        var r = this.concat();
        var t2 = this.peek();
        if (t2 && t2.t === 'op' && ['=', '<>', '<', '>', '<=', '>='].indexOf(t2.v) !== -1) {
          throw new CieError('Only one comparison is allowed at a time. Join two comparisons with AND, e.g. X >= 1 AND X <= 10.', this.line);
        }
        return { k: 'bin', op: t.v, l: l, r: r };
      }
    }
    return l;
  };
  Parser.prototype.concat = function () {
    var l = this.add();
    while (this.isOp('&')) { this.next(); l = { k: 'bin', op: '&', l: l, r: this.add() }; }
    return l;
  };
  Parser.prototype.add = function () {
    var l = this.mul();
    while (this.isOp('+') || this.isOp('-')) { var op = this.next().v; l = { k: 'bin', op: op, l: l, r: this.mul() }; }
    return l;
  };
  Parser.prototype.mul = function () {
    var l = this.pow();
    while (this.isOp('*') || this.isOp('/') || this.isKw('MOD') || this.isKw('DIV')) {
      var op = this.next().v;
      l = { k: 'bin', op: op, l: l, r: this.pow() };
    }
    return l;
  };
  Parser.prototype.pow = function () {
    var l = this.unary();
    if (this.isOp('^')) { this.next(); l = { k: 'bin', op: '^', l: l, r: this.unary() }; }
    return l;
  };
  Parser.prototype.unary = function () {
    if (this.isOp('-')) { this.next(); return { k: 'neg', e: this.unary() }; }
    if (this.isOp('+')) { this.next(); return this.unary(); }
    return this.primary();
  };
  Parser.prototype.primary = function () {
    var t = this.peek();
    if (!t) throw new CieError('This line ends too early. Something is missing at the end.', this.line);
    if (t.t === 'num') { this.next(); return { k: 'lit', v: t.v, isReal: t.isReal }; }
    if (t.t === 'str') { this.next(); return { k: 'lit', v: t.v }; }
    if (t.t === 'bool') { this.next(); return { k: 'lit', v: t.v }; }
    if (t.t === 'op' && t.v === '(') {
      this.next();
      var e = this.expr();
      this.expectOp(')', 'A ( has no matching ).');
      return e;
    }
    if (t.t === 'kw' && (t.v === 'MOD' || t.v === 'DIV')) {
      this.next();
      return this.callArgs(t.v);
    }
    if (t.t === 'id') {
      this.next();
      var up = t.v.toUpperCase();
      if (this.isOp('(')) {
        if (!Object.prototype.hasOwnProperty.call(FUNCS, up)) {
          throw new CieError(t.v + '( ) is not a function you can use here. Available: LENGTH, UCASE, LCASE, SUBSTRING, ROUND, RANDOM, INT, MOD, DIV.', this.line);
        }
        return this.callArgs(up);
      }
      if (this.isOp('[')) {
        this.next();
        var idx = [this.expr()];
        while (this.isOp(',')) { this.next(); idx.push(this.expr()); }
        this.expectOp(']', 'An array index [ has no matching ].');
        return { k: 'idx', name: t.v, idx: idx };
      }
      return { k: 'var', name: t.v };
    }
    if (t.t === 'op' && t.v === '<-') throw new CieError('<- can only be used once, to store a value in the variable on its left.', this.line);
    throw new CieError('Did not expect "' + (t.v === undefined ? '' : t.v) + '" here.', this.line);
  };
  Parser.prototype.callArgs = function (name) {
    this.expectOp('(', name + ' needs brackets, e.g. ' + name + '(...).');
    var args = [];
    if (!this.isOp(')')) {
      args.push(this.expr());
      while (this.isOp(',')) { this.next(); args.push(this.expr()); }
    }
    this.expectOp(')', name + '( has no closing ).');
    if (args.length !== FUNCS[name]) {
      throw new CieError(name + ' needs ' + FUNCS[name] + ' value' + (FUNCS[name] === 1 ? '' : 's') + ' inside its brackets.', this.line);
    }
    return { k: 'call', name: name, args: args };
  };

  function parseExprFrom(toks, line) {
    var p = new Parser(toks, line);
    if (p.atEnd()) throw new CieError('A value or condition is missing here.', line);
    var e = p.expr();
    if (!p.atEnd()) {
      var t = p.peek();
      if (t.t === 'op' && t.v === '=') throw new CieError('Unexpected = here.', line);
      throw new CieError('Did not expect "' + t.v + '" here. Check for a missing operator or an extra word.', line);
    }
    return e;
  }
  function parseExprText(text, line) { return parseExprFrom(lex(text, line), line); }

  function splitTopLevelCommas(toks) {
    var parts = [[]], depth = 0;
    toks.forEach(function (t) {
      if (t.t === 'op' && (t.v === '(' || t.v === '[')) depth++;
      if (t.t === 'op' && (t.v === ')' || t.v === ']')) depth--;
      if (t.t === 'op' && t.v === ',' && depth === 0) parts.push([]);
      else parts[parts.length - 1].push(t);
    });
    return parts;
  }

  // ---------------------------------------------------------------- statements
  function stripComment(text) {
    var inStr = false;
    for (var i = 0; i < text.length - 1; i++) {
      if (text[i] === '"') inStr = !inStr;
      if (!inStr && text[i] === '/' && text[i + 1] === '/') return text.slice(0, i);
    }
    return text;
  }

  function preprocess(source) {
    var out = [];
    String(source).replace(/\r/g, '').split('\n').forEach(function (raw, i) {
      var text = stripComment(raw).trim();
      if (text) out.push({ text: text, line: i + 1 });
    });
    return out;
  }

  var CASE_LITERAL = '(?:-?\\d+(?:\\.\\d+)?|"[^"]*"|\'[^\']\')';
  var CASE_LABEL_RE = new RegExp('^(OTHERWISE\\b|' + CASE_LITERAL + '(?:\\s+TO\\s+' + CASE_LITERAL + ')?\\s*:)', 'i');

  function terminatorOf(text) {
    var u = text.toUpperCase();
    if (/^ELSE\s*IF\b/.test(u)) return 'ELSEIF';
    if (/^ELSE\b/.test(u)) return 'ELSE';
    if (/^ENDIF\b/.test(u)) return 'ENDIF';
    if (/^NEXT\b/.test(u)) return 'NEXT';
    if (/^ENDWHILE\b/.test(u)) return 'ENDWHILE';
    if (/^UNTIL\b/.test(u)) return 'UNTIL';
    if (/^ENDCASE\b/.test(u)) return 'ENDCASE';
    if (/^THEN\b/.test(u)) return 'THEN';
    if (CASE_LABEL_RE.test(text)) return 'CASELABEL';
    return null;
  }

  var CLOSER_FOR = { IF: 'ENDIF', FOR: 'NEXT', WHILE: 'ENDWHILE', REPEAT: 'UNTIL', CASE: 'ENDCASE' };

  function strayMessage(term, L, open) {
    var what = term === 'CASELABEL' ? 'a CASE option' : term;
    if (open) {
      return 'Line ' + L.line + ' has ' + what + ', but the ' + open.kind + ' on line ' + open.line +
        ' is still open. Close it with ' + CLOSER_FOR[open.kind] + ' first.';
    }
    var owner = { ELSE: 'IF', ELSEIF: 'IF', ENDIF: 'IF', THEN: 'IF', NEXT: 'FOR', ENDWHILE: 'WHILE', UNTIL: 'REPEAT', ENDCASE: 'CASE OF', CASELABEL: 'CASE OF' }[term];
    return what + ' on line ' + L.line + ' has no ' + owner + ' to belong to. Check each block has one opening line and one closing line.';
  }

  function Program(source) {
    this.lines = preprocess(source);
    this.i = 0;
    this.open = [];
    this.body = this.block([]);
    if (this.i < this.lines.length) {
      var L = this.lines[this.i];
      throw new CieError(strayMessage(terminatorOf(L.text), L, null), L.line);
    }
  }
  Program.prototype.peekTerm = function () {
    return this.i < this.lines.length ? terminatorOf(this.lines[this.i].text) : null;
  };
  Program.prototype.block = function (terms) {
    var out = [];
    while (this.i < this.lines.length) {
      var L = this.lines[this.i];
      var term = terminatorOf(L.text);
      if (term && terms.indexOf(term) !== -1) return out;
      if (term) throw new CieError(strayMessage(term, L, this.open[this.open.length - 1]), L.line);
      out.push(this.statement(L));
    }
    return out;
  };
  Program.prototype.requireClose = function (kind, line, term) {
    if (this.i >= this.lines.length) {
      throw new CieError('The ' + kind + ' on line ' + line + ' is never closed. Add ' + CLOSER_FOR[kind] + ' at the end of the block.', line);
    }
    var L = this.lines[this.i];
    if (terminatorOf(L.text) !== term) throw new CieError(strayMessage(terminatorOf(L.text), L, { kind: kind, line: line }), L.line);
    return L;
  };

  Program.prototype.ifHeader = function (L, word) {
    var re = word === 'IF' ? /^IF\b(.*)$/i : /^ELSE\s*IF\b(.*)$/i;
    var rest = re.exec(L.text)[1].trim();
    var inline = /^(.*?)\s+THEN\s+(\S.*)$/i.exec(rest);
    if (inline) throw new CieError('Put the statement on its own line after THEN, not on the same line.', L.line);
    var hasThen = /(^|\s)THEN$/i.test(rest);
    var condText = hasThen ? rest.replace(/\s*THEN$/i, '').trim() : rest;
    if (!condText) throw new CieError(word + ' needs a condition, e.g. IF Age >= 18.', L.line);
    var cond = parseExprText(condText, L.line);
    this.i++;
    if (!hasThen) {
      var nextL = this.lines[this.i];
      if (!nextL || terminatorOf(nextL.text) !== 'THEN') {
        throw new CieError('After ' + word + ' ' + condText + ' write THEN, either at the end of the line or on the next line.', L.line);
      }
      if (!/^THEN\s*$/i.test(nextL.text)) throw new CieError('Put the statement on its own line after THEN.', nextL.line);
      this.i++;
    }
    return { cond: cond, condText: condText };
  };

  Program.prototype.statement = function (L) {
    var text = L.text;
    var line = L.line;
    var u = text.toUpperCase();
    var m;

    if (/^IF\b/.test(u)) {
      this.open.push({ kind: 'IF', line: line });
      var h = this.ifHeader(L, 'IF');
      var node = { k: 'if', line: line, cond: h.cond, condText: h.condText, then: null, elifs: [], els: null };
      node.then = this.block(['ELSE', 'ELSEIF', 'ENDIF']);
      while (this.peekTerm() === 'ELSEIF') {
        var EL = this.lines[this.i];
        if (node.els) throw new CieError('ELSE IF cannot come after ELSE.', EL.line);
        var eh = this.ifHeader(EL, 'ELSEIF');
        node.elifs.push({ line: EL.line, cond: eh.cond, condText: eh.condText, body: this.block(['ELSE', 'ELSEIF', 'ENDIF']) });
      }
      if (this.peekTerm() === 'ELSE') {
        var ElseL = this.lines[this.i];
        if (!/^ELSE\s*$/i.test(ElseL.text)) throw new CieError('ELSE goes on a line by itself. It never has a condition.', ElseL.line);
        node.elseLine = ElseL.line;
        this.i++;
        node.els = this.block(['ENDIF', 'ELSE', 'ELSEIF']);
        if (this.peekTerm() === 'ELSE' || this.peekTerm() === 'ELSEIF') {
          throw new CieError('An IF can only have one ELSE. To test another condition, put a new IF inside the ELSE.', this.lines[this.i].line);
        }
      }
      var endL = this.requireClose('IF', line, 'ENDIF');
      if (!/^ENDIF\s*$/i.test(endL.text)) throw new CieError('ENDIF goes on a line by itself.', endL.line);
      node.endLine = endL.line;
      this.i++;
      this.open.pop();
      return node;
    }

    if (/^FOR\b/.test(u)) {
      m = /^FOR\s+([A-Za-z_]\w*)\s*(<-|←|=)\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i.exec(text);
      if (!m) throw new CieError('A FOR line looks like: FOR Count <- 1 TO 10', line);
      if (m[2] === '=') throw new CieError('Use <- in a FOR line: FOR ' + m[1] + ' <- ' + m[3] + ' TO ' + m[4], line);
      this.open.push({ kind: 'FOR', line: line });
      this.i++;
      var fnode = {
        k: 'for', line: line, v: m[1], from: parseExprText(m[3], line), to: parseExprText(m[4], line),
        toText: m[4], step: m[5] ? parseExprText(m[5], line) : null, body: this.block(['NEXT'])
      };
      var nextL = this.requireClose('FOR', line, 'NEXT');
      var nm = /^NEXT(?:\s+([A-Za-z_]\w*))?\s*$/i.exec(nextL.text);
      if (!nm) throw new CieError('NEXT is followed only by the loop variable, e.g. NEXT ' + m[1], nextL.line);
      if (nm[1] && nm[1].toUpperCase() !== m[1].toUpperCase()) {
        throw new CieError('NEXT ' + nm[1] + ' does not match FOR ' + m[1] + ' on line ' + line + '. Write NEXT ' + m[1] + '.', nextL.line);
      }
      fnode.nextLine = nextL.line;
      this.i++;
      this.open.pop();
      return fnode;
    }

    if (/^WHILE\b/.test(u)) {
      var wText = text.replace(/^WHILE\b/i, '').trim().replace(/\s+DO$/i, '').trim();
      if (!wText || /^DO$/i.test(wText)) throw new CieError('WHILE needs a condition, e.g. WHILE Number < 1 DO', line);
      this.open.push({ kind: 'WHILE', line: line });
      this.i++;
      var wnode = { k: 'while', line: line, cond: parseExprText(wText, line), condText: wText, body: this.block(['ENDWHILE']) };
      var ewL = this.requireClose('WHILE', line, 'ENDWHILE');
      if (!/^ENDWHILE\s*$/i.test(ewL.text)) throw new CieError('ENDWHILE goes on a line by itself.', ewL.line);
      wnode.endLine = ewL.line;
      this.i++;
      this.open.pop();
      return wnode;
    }

    if (/^REPEAT\b/.test(u)) {
      if (!/^REPEAT\s*$/i.test(text)) throw new CieError('REPEAT goes on a line by itself. The condition goes at the end, after UNTIL.', line);
      this.open.push({ kind: 'REPEAT', line: line });
      this.i++;
      var rbody = this.block(['UNTIL']);
      var uL = this.requireClose('REPEAT', line, 'UNTIL');
      var uText = uL.text.replace(/^UNTIL\b/i, '').trim();
      if (!uText) throw new CieError('UNTIL needs a condition, e.g. UNTIL Guess = Secret', uL.line);
      this.i++;
      this.open.pop();
      return { k: 'repeat', line: line, body: rbody, cond: parseExprText(uText, uL.line), condText: uText, untilLine: uL.line };
    }

    if (/^CASE\b/.test(u)) {
      m = /^CASE\s+OF\s+(.+)$/i.exec(text);
      if (!m) throw new CieError('Cambridge writes this as CASE OF Choice (the variable goes after OF).', line);
      this.open.push({ kind: 'CASE', line: line });
      this.i++;
      var cnode = { k: 'case', line: line, expr: parseExprText(m[1], line), exprText: m[1], clauses: [] };
      while (this.peekTerm() === 'CASELABEL') {
        var CL = this.lines[this.i];
        var lm = CASE_LABEL_RE.exec(CL.text);
        var labelText = lm[1].replace(/:$/, '').trim();
        var rest = CL.text.slice(lm[1].length).replace(/^\s*:?/, '').trim();
        var clause = { line: CL.line, labelText: labelText, other: /^OTHERWISE$/i.test(labelText), body: [] };
        if (!clause.other) {
          var parts = labelText.split(/\s+TO\s+/i);
          clause.lo = parseExprText(parts[0], CL.line).v;
          clause.hi = parts[1] ? parseExprText(parts[1], CL.line).v : clause.lo;
        }
        this.i++;
        if (rest) clause.body.push(this.statementOnly({ text: rest, line: CL.line }));
        clause.body = clause.body.concat(this.block(['CASELABEL', 'ENDCASE']));
        cnode.clauses.push(clause);
      }
      var ecL = this.requireClose('CASE', line, 'ENDCASE');
      cnode.endLine = ecL.line;
      this.i++;
      this.open.pop();
      return cnode;
    }

    this.i++;
    return this.statementOnly(L);
  };

  // Single-line statements. Also used for the statement after a CASE label.
  Program.prototype.statementOnly = function (L) {
    var text = L.text;
    var line = L.line;
    var u = text.toUpperCase();
    var m;

    if (/^DECLARE\b/.test(u)) {
      m = /^DECLARE\s+(.+?)\s*:\s*(.+)$/i.exec(text);
      if (!m) throw new CieError('A DECLARE line looks like: DECLARE Total : INTEGER', line);
      var names = m[1].split(',').map(function (s) { return s.trim(); });
      names.forEach(function (n) {
        if (!/^[A-Za-z_]\w*$/.test(n)) throw new CieError('"' + n + '" is not a valid variable name. Use letters and digits only, no spaces.', line);
      });
      return { k: 'declare', line: line, names: names, type: parseType(m[2].trim(), line) };
    }
    if (/^CONSTANT\b/.test(u)) {
      m = /^CONSTANT\s+([A-Za-z_]\w*)\s*(=|<-|←)\s*(.+)$/i.exec(text);
      if (!m) throw new CieError('A CONSTANT line looks like: CONSTANT VatRate <- 0.2', line);
      var ce = parseExprText(m[3], line);
      if (ce.k !== 'lit') throw new CieError('A CONSTANT must be given a fixed value, like 0.2 or "Admin".', line);
      return { k: 'const', line: line, name: m[1], value: ce.v };
    }
    if (/^INPUT\b/.test(u)) {
      var itoks = lex(text.replace(/^INPUT\b/i, ''), line);
      if (!itoks.length) throw new CieError('INPUT needs a variable to store the value in, e.g. INPUT Age', line);
      if (itoks[0].t === 'str') throw new CieError('Put the message in its own OUTPUT line before INPUT. INPUT is followed only by a variable.', line);
      var target = parseExprFrom(itoks, line);
      if (target.k !== 'var' && target.k !== 'idx') throw new CieError('INPUT must be followed by one variable, e.g. INPUT Age', line);
      return { k: 'input', line: line, target: target };
    }
    if (/^OUTPUT\b/.test(u)) {
      var otoks = lex(text.replace(/^OUTPUT\b/i, ''), line);
      if (!otoks.length) throw new CieError('OUTPUT needs something to show, e.g. OUTPUT Total', line);
      var exprs = splitTopLevelCommas(otoks).map(function (part) {
        if (!part.length) throw new CieError('There is an extra comma in this OUTPUT line.', line);
        return parseExprFrom(part, line);
      });
      return { k: 'output', line: line, exprs: exprs };
    }

    var first = (/^[A-Za-z_]+/.exec(text) || [''])[0].toUpperCase();
    var MISTAKES = {
      PRINT: 'Cambridge pseudocode uses OUTPUT, not PRINT.',
      READ: 'Cambridge pseudocode uses INPUT, not READ.',
      LET: 'Leave out LET. Just write Total <- 0',
      SET: 'Leave out SET. Just write Total <- 0',
      VAR: 'Use DECLARE Name : TYPE to create a variable.',
      DIM: 'Use DECLARE Name : TYPE to create a variable.',
      ELIF: 'Write ELSE, then a new IF on the next line (or use CASE OF).',
      ENDFOR: 'A FOR loop is closed with NEXT and the loop variable, e.g. NEXT Count',
      END: 'Closing words are one word in Cambridge pseudocode: ENDIF, ENDWHILE, ENDCASE. FOR closes with NEXT, REPEAT closes with UNTIL.',
      ENDREPEAT: 'A REPEAT loop is closed with UNTIL and a condition, e.g. UNTIL Guess = Secret',
      LOOP: 'Use FOR...NEXT, WHILE...ENDWHILE or REPEAT...UNTIL for a loop.',
      DO: 'A condition-controlled loop starts with WHILE condition DO, or REPEAT.',
      PROCEDURE: 'Procedures are not part of this recap. Write the algorithm as one program.',
      FUNCTION: 'Functions are not part of this recap. Write the algorithm as one program.',
      CALL: 'Procedures are not part of this recap. Write the algorithm as one program.',
      RETURN: 'RETURN is only used in functions, which are not part of this recap.',
      ENDWHILE: 'ENDWHILE has no WHILE to close.'
    };
    if (MISTAKES[first]) throw new CieError(MISTAKES[first], line);

    var toks = lex(text, line);
    var arrowAt = -1;
    toks.some(function (t, i) { if (t.t === 'op' && t.v === '<-') { arrowAt = i; return true; } return false; });
    if (arrowAt === -1) {
      if (toks.length > 1 && toks[0].t === 'id' && toks[1].t === 'op' && toks[1].v === '=') {
        throw new CieError('To store a value use <- , e.g. ' + toks[0].v + ' <- ... (= is only for comparing).', line);
      }
      if (toks.length >= 1 && toks[0].t === 'id' && toks[toks.length - 1].t === 'op' && toks[toks.length - 1].v === ']' && toks.some(function (t) { return t.t === 'op' && t.v === '='; })) {
        throw new CieError('To store a value use <- (= is only for comparing).', line);
      }
      throw new CieError('Line ' + line + ' is not a statement Cambridge pseudocode recognises. Check the spelling of the first word.', line);
    }
    if (arrowAt === 0) throw new CieError('Put the variable name before <-, e.g. Total <- 0', line);
    var tgt = parseExprFrom(toks.slice(0, arrowAt), line);
    if (tgt.k !== 'var' && tgt.k !== 'idx') throw new CieError('The left of <- must be a single variable (or array element) to store into.', line);
    if (arrowAt === toks.length - 1) throw new CieError('Nothing to store: add a value after <-.', line);
    var exprText = text.replace(/^.*?(<-|←)/, '').trim();
    return { k: 'assign', line: line, target: tgt, expr: parseExprFrom(toks.slice(arrowAt + 1), line), exprText: exprText };
  };

  function parseType(raw, line) {
    var up = raw.toUpperCase().replace(/\s+/g, ' ');
    if (TYPES.indexOf(up) !== -1) return { base: up };
    var am = /^ARRAY\s*\[(.+)\]\s*OF\s+([A-Z]+)$/i.exec(raw);
    if (am) {
      var base = am[2].toUpperCase();
      if (TYPES.indexOf(base) === -1) throw new CieError(am[2] + ' is not a data type. Use INTEGER, REAL, CHAR, STRING or BOOLEAN.', line);
      var dims = am[1].split(',').map(function (d) {
        var b = d.split(':');
        if (b.length !== 2) throw new CieError('Array bounds are written [1:10], with a colon between the first and last index.', line);
        return [parseExprText(b[0], line), parseExprText(b[1], line)];
      });
      if (dims.length > 2) throw new CieError('Arrays here have one or two dimensions.', line);
      return { base: base, dims: dims };
    }
    if (/^ARRAY/i.test(raw)) throw new CieError('An array is declared like: DECLARE Scores : ARRAY[1:30] OF INTEGER', line);
    if (TYPE_ALIASES[up]) throw new CieError(raw + ' is not a Cambridge data type. Use ' + TYPE_ALIASES[up] + '.', line);
    throw new CieError(raw + ' is not a data type. Use INTEGER, REAL, CHAR, STRING or BOOLEAN.', line);
  }

  // ---------------------------------------------------------------- run-time state
  function State(opts) {
    this.vars = {};
    this.order = [];
    this.inputs = (opts.inputs || []).map(String);
    this.outputs = [];
    this.lastOutputIndex = -1;
  }
  State.prototype.lookup = function (name, line, forWhat) {
    var v = this.vars[name.toUpperCase()];
    if (!v) {
      var hint = forWhat || 'INTEGER';
      throw new CieError(name + ' has not been declared. Add DECLARE ' + name + ' : ' + hint + ' near the top, before line ' + line + '.', line);
    }
    return v;
  };
  State.prototype.create = function (name, type, line, opts) {
    var key = name.toUpperCase();
    var existing = this.vars[key];
    if (existing) {
      if (existing.given) throw new CieError(existing.name + ' is already declared and filled in for you (see Given data). Remove this DECLARE.', line);
      throw new CieError(existing.name + ' is declared twice. Keep one DECLARE line for it.', line);
    }
    var v = { name: name, type: type.base, value: undefined, arr: null, constant: !!(opts && opts.constant), given: !!(opts && opts.given) };
    if (type.dims) {
      v.arr = { dims: type.dims, data: {} };
    }
    this.vars[key] = v;
    this.order.push(key);
    return v;
  };

  function typeGuess(value) {
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'string') return 'STRING';
    if (typeof value === 'number' && !Number.isInteger(value)) return 'REAL';
    return 'INTEGER';
  }

  function checkType(v, value, label, line) {
    var t = v.type;
    if (t === 'INTEGER') {
      if (typeof value !== 'number') throw new CieError(label + ' is an INTEGER, so it cannot store ' + describe(value) + '.', line);
      if (!Number.isInteger(value)) throw new CieError(label + ' is an INTEGER, so it cannot store ' + formatValue(value) + '. Declare it as REAL, or use DIV for whole-number division.', line);
    } else if (t === 'REAL') {
      if (typeof value !== 'number') throw new CieError(label + ' is a REAL, so it cannot store ' + describe(value) + '.', line);
    } else if (t === 'STRING') {
      if (typeof value !== 'string') throw new CieError(label + ' is a STRING, so it cannot store ' + describe(value) + '. Put text in double quotes.', line);
    } else if (t === 'CHAR') {
      if (typeof value !== 'string' || value.length !== 1) throw new CieError(label + ' is a CHAR, so it can only store one character.', line);
    } else if (t === 'BOOLEAN') {
      if (typeof value !== 'boolean') throw new CieError(label + ' is a BOOLEAN, so it can only store TRUE or FALSE.', line);
    }
  }

  function elementKey(v, idxVals, line) {
    var dims = v.arr.dims;
    if (idxVals.length !== dims.length) {
      throw new CieError(v.name + ' has ' + dims.length + ' dimension' + (dims.length === 1 ? '' : 's') + ', so use ' + (dims.length === 1 ? v.name + '[Index]' : v.name + '[Row, Column]') + '.', line);
    }
    idxVals.forEach(function (x, i) {
      if (typeof x !== 'number' || !Number.isInteger(x)) throw new CieError('An array index must be a whole number, not ' + describe(x) + '.', line);
      var lo = dims[i].lo, hi = dims[i].hi;
      if (x < lo || x > hi) throw new CieError(v.name + '[' + idxVals.join(', ') + '] does not exist. ' + v.name + ' only goes from ' + lo + ' to ' + hi + '.', line);
    });
    return idxVals.join(', ');
  }

  function evalE(n, S, line) {
    switch (n.k) {
      case 'lit': return n.v;
      case 'var': {
        var v = S.lookup(n.name, line);
        if (v.arr) throw new CieError(v.name + ' is an array. Use one element, e.g. ' + v.name + '[Index].', line);
        if (v.value === undefined) {
          throw new CieError(v.name + ' has been declared but has not been given a value yet. Store a starting value in it (e.g. ' + v.name + ' <- 0) before line ' + line + '.', line);
        }
        return v.value;
      }
      case 'idx': {
        var av = S.lookup(n.name, line);
        if (!av.arr) throw new CieError(av.name + ' is not an array, so it cannot be followed by [ ].', line);
        var key = elementKey(av, n.idx.map(function (e) { return evalE(e, S, line); }), line);
        var val = av.arr.data[key];
        if (val === undefined) throw new CieError(av.name + '[' + key + '] has not been given a value yet.', line);
        return val;
      }
      case 'neg': {
        var x = evalE(n.e, S, line);
        if (typeof x !== 'number') throw new CieError('Only numbers can be negative.', line);
        return -x;
      }
      case 'not': {
        var b = evalE(n.e, S, line);
        if (typeof b !== 'boolean') throw new CieError('NOT must be followed by a condition (TRUE or FALSE).', line);
        return !b;
      }
      case 'call': return callFn(n, S, line);
      case 'bin': return evalBin(n, S, line);
    }
    throw new CieError('Could not work out this value.', line);
  }

  function callFn(n, S, line) {
    var a = n.args.map(function (e) { return evalE(e, S, line); });
    function needStr(x) { if (typeof x !== 'string') throw new CieError(n.name + ' works on text (a STRING or CHAR).', line); }
    function needNum(x) { if (typeof x !== 'number') throw new CieError(n.name + ' works on numbers.', line); }
    switch (n.name) {
      case 'LENGTH': needStr(a[0]); return a[0].length;
      case 'UCASE': needStr(a[0]); return a[0].toUpperCase();
      case 'LCASE': needStr(a[0]); return a[0].toLowerCase();
      case 'SUBSTRING':
        needStr(a[0]); needNum(a[1]); needNum(a[2]);
        if (a[1] < 1 || a[1] > a[0].length) throw new CieError('SUBSTRING start position ' + a[1] + ' is outside the text. The first character is position 1.', line);
        return a[0].substr(a[1] - 1, a[2]);
      case 'ROUND': needNum(a[0]); needNum(a[1]); { var p = Math.pow(10, a[1]); return Math.round(a[0] * p) / p; }
      case 'RANDOM': return Math.random();
      case 'INT': needNum(a[0]); return Math.trunc(a[0]);
      case 'MOD': needNum(a[0]); needNum(a[1]); if (a[1] === 0) throw new CieError('Cannot MOD by zero.', line); return a[0] % a[1];
      case 'DIV': needNum(a[0]); needNum(a[1]); if (a[1] === 0) throw new CieError('Cannot DIV by zero.', line); return Math.trunc(a[0] / a[1]);
    }
    throw new CieError('Unknown function ' + n.name, line);
  }

  function evalBin(n, S, line) {
    var op = n.op;
    if (op === 'AND' || op === 'OR') {
      // Short-circuit, so WHILE Index <= 6 AND Names[Index] <> X never reads Names[7].
      var bothSides = op + ' joins two full conditions. Write both sides out, e.g. Age >= 13 ' + op + ' Age <= 19.';
      var l = evalE(n.l, S, line);
      if (typeof l !== 'boolean') throw new CieError(bothSides, line);
      if (op === 'AND' && !l) return false;
      if (op === 'OR' && l) return true;
      var r = evalE(n.r, S, line);
      if (typeof r !== 'boolean') throw new CieError(bothSides, line);
      return r;
    }
    var a = evalE(n.l, S, line);
    var b = evalE(n.r, S, line);
    if (op === '&') return formatValue(a) + formatValue(b);
    if (['+', '-', '*', '/', '^', 'MOD', 'DIV'].indexOf(op) !== -1) {
      if (typeof a !== 'number' || typeof b !== 'number') {
        if (op === '+' && (typeof a === 'string' || typeof b === 'string')) throw new CieError('To join text together use &, not +.', line);
        throw new CieError('You can only do ' + op + ' with numbers.', line);
      }
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '^': return Math.pow(a, b);
        case '/': if (b === 0) throw new CieError('Cannot divide by zero.', line); return a / b;
        case 'DIV': if (b === 0) throw new CieError('Cannot DIV by zero.', line); return Math.trunc(a / b);
        case 'MOD': if (b === 0) throw new CieError('Cannot MOD by zero.', line); return a % b;
      }
    }
    if (typeof a !== typeof b) {
      throw new CieError('Cannot compare ' + describe(a) + ' with ' + describe(b) + ': one is ' + (typeof a === 'string' ? 'text' : typeof a === 'number' ? 'a number' : 'TRUE/FALSE') +
        ' and the other is ' + (typeof b === 'string' ? 'text' : typeof b === 'number' ? 'a number' : 'TRUE/FALSE') + '.', line);
    }
    if (typeof a === 'boolean' && op !== '=' && op !== '<>') throw new CieError('TRUE and FALSE can only be compared with = or <>.', line);
    switch (op) {
      case '=': return a === b;
      case '<>': return a !== b;
      case '<': return a < b;
      case '>': return a > b;
      case '<=': return a <= b;
      case '>=': return a >= b;
    }
    throw new CieError('Unknown operator ' + op, line);
  }

  function evalCond(e, text, S, line) {
    var c = evalE(e, S, line);
    if (typeof c !== 'boolean') {
      throw new CieError(text + ' is not a condition. A condition must be TRUE or FALSE, e.g. Total > 10.', line);
    }
    return c;
  }

  function targetLabel(t, S, line) {
    if (t.k === 'var') return S.lookup(t.name, line).name;
    var v = S.lookup(t.name, line);
    return v.name + '[' + t.idx.map(function (e) { return formatValue(evalE(e, S, line)); }).join(', ') + ']';
  }

  function store(t, value, S, line, guessType) {
    var v = S.lookup(t.name, line, guessType || typeGuess(value));
    if (v.constant) throw new CieError(v.name + ' is a CONSTANT, so its value cannot be changed.', line);
    if (t.k === 'var') {
      if (v.arr) throw new CieError(v.name + ' is an array. Store into one element, e.g. ' + v.name + '[Index] <- ...', line);
      checkType(v, value, v.name, line);
      v.value = value;
      return v.name;
    }
    if (!v.arr) throw new CieError(v.name + ' is not an array, so it cannot be followed by [ ].', line);
    var key = elementKey(v, t.idx.map(function (e) { return evalE(e, S, line); }), line);
    checkType(v, value, v.name + '[' + key + ']', line);
    v.arr.data[key] = value;
    return v.name + '[' + key + ']';
  }

  function ev(line, msg, extra) {
    var e = { line: line, msg: msg };
    if (extra) for (var k in extra) e[k] = extra[k];
    return e;
  }

  function* execBlock(stmts, S) {
    for (var i = 0; i < stmts.length; i++) yield* execStmt(stmts[i], S);
  }

  function* execStmt(s, S) {
    var line = s.line;
    switch (s.k) {
      case 'declare': {
        var t = { base: s.type.base };
        if (s.type.dims) {
          t.dims = s.type.dims.map(function (d) {
            var lo = evalE(d[0], S, line), hi = evalE(d[1], S, line);
            if (!Number.isInteger(lo) || !Number.isInteger(hi) || hi < lo) throw new CieError('Array bounds must be whole numbers with the first index lower than the last, e.g. [1:10].', line);
            return { lo: lo, hi: hi };
          });
        }
        s.names.forEach(function (n) { S.create(n, t, line); });
        yield ev(line, s.names.join(', ') + (s.names.length > 1 ? ' are' : ' is') + ' declared as ' +
          (t.dims ? 'an ARRAY[' + t.dims.map(function (d) { return d.lo + ':' + d.hi; }).join(', ') + '] OF ' + t.base : t.base) + '. Nothing is stored yet.');
        return;
      }
      case 'const': {
        var cv = S.create(s.name, { base: typeGuess(s.value) }, line, { constant: true });
        cv.value = s.value;
        yield ev(line, 'CONSTANT ' + s.name + ' is fixed at ' + describe(s.value) + '.');
        return;
      }
      case 'assign': {
        var val = evalE(s.expr, S, line);
        var label = store(s.target, val, S, line);
        var simple = s.expr.k === 'lit';
        yield ev(line, simple ? label + ' becomes ' + describe(val) + '.' :
          'Work out ' + s.exprText + ' first, then store the result: ' + label + ' becomes ' + describe(val) + '.');
        return;
      }
      case 'input': {
        var tv = S.lookup(s.target.name, line, 'INTEGER (or STRING for text)');
        if (!S.inputs.length) {
          throw new CieError('The program asked for another INPUT but there are no input values left. If this is inside a loop, check the loop stops when it should.', line);
        }
        var raw = S.inputs.shift();
        var value = raw;
        var label0 = tv.name;
        if (tv.type === 'INTEGER') {
          if (!/^\s*-?\d+\s*$/.test(raw)) throw new CieError('The input "' + raw + '" is not a whole number, but ' + label0 + ' is an INTEGER.', line);
          value = parseInt(raw, 10);
        } else if (tv.type === 'REAL') {
          if (!/^\s*-?\d+(\.\d+)?\s*$/.test(raw)) throw new CieError('The input "' + raw + '" is not a number, but ' + label0 + ' is a REAL.', line);
          value = parseFloat(raw);
        } else if (tv.type === 'BOOLEAN') {
          if (!/^\s*(TRUE|FALSE)\s*$/i.test(raw)) throw new CieError('The input "' + raw + '" is not TRUE or FALSE.', line);
          value = /TRUE/i.test(raw);
        }
        var lbl = store(s.target, value, S, line);
        if (S.lastOutputIndex >= 0) S.outputs[S.lastOutputIndex].prompt = true;
        S.lastOutputIndex = -1;
        yield ev(line, 'INPUT: the user types ' + raw + ', which is stored in ' + lbl + '.', { input: raw });
        return;
      }
      case 'output': {
        var text = s.exprs.map(function (e) { return formatValue(evalE(e, S, line)); }).join('');
        S.outputs.push({ text: text, line: line, prompt: false });
        S.lastOutputIndex = S.outputs.length - 1;
        yield ev(line, 'OUTPUT shows: ' + text, { output: text });
        return;
      }
      case 'if': {
        var c = evalCond(s.cond, s.condText, S, line);
        if (c) {
          yield ev(line, s.condText + ' is TRUE, so the THEN branch runs.');
          yield* execBlock(s.then, S);
          return;
        }
        var rest = s.elifs.length ? 'try the next ELSE IF.' : s.els ? 'the ELSE branch runs.' : 'skip to ENDIF (there is no ELSE).';
        yield ev(line, s.condText + ' is FALSE, so ' + rest);
        for (var i = 0; i < s.elifs.length; i++) {
          var e = s.elifs[i];
          var ec = evalCond(e.cond, e.condText, S, e.line);
          var more = i + 1 < s.elifs.length ? 'try the next ELSE IF.' : s.els ? 'the ELSE branch runs.' : 'skip to ENDIF.';
          yield ev(e.line, e.condText + ' is ' + (ec ? 'TRUE, so this branch runs.' : 'FALSE, so ' + more));
          if (ec) { yield* execBlock(e.body, S); return; }
        }
        if (s.els) yield* execBlock(s.els, S);
        return;
      }
      case 'case': {
        var cvx = evalE(s.expr, S, line);
        for (var ci = 0; ci < s.clauses.length; ci++) {
          var cl = s.clauses[ci];
          var hit = cl.other || (typeof cvx === typeof cl.lo && cvx >= cl.lo && cvx <= cl.hi);
          if (hit) {
            yield ev(line, s.exprText + ' is ' + describe(cvx) + ', so the ' + cl.labelText + ' option on line ' + cl.line + ' runs.');
            yield* execBlock(cl.body, S);
            return;
          }
        }
        yield ev(line, s.exprText + ' is ' + describe(cvx) + ', which matches no option (and there is no OTHERWISE), so nothing runs.');
        return;
      }
      case 'for': {
        var lv = S.lookup(s.v, line, 'INTEGER');
        if (lv.arr) throw new CieError(lv.name + ' is an array and cannot be a loop variable.', line);
        var from = evalE(s.from, S, line);
        var to = evalE(s.to, S, line);
        var step = s.step ? evalE(s.step, S, line) : 1;
        if (typeof from !== 'number' || typeof to !== 'number' || typeof step !== 'number') throw new CieError('FOR needs numbers for its start and end values.', line);
        if (step === 0) throw new CieError('STEP 0 would loop for ever.', line);
        var ref = { k: 'var', name: s.v };
        store(ref, from, S, line, 'INTEGER');
        var cmp = step > 0 ? '<=' : '>=';
        function inRange(x) { return step > 0 ? x <= to : x >= to; }
        if (inRange(lv.value)) {
          yield ev(line, 'FOR sets ' + lv.name + ' to ' + formatValue(from) + '. The loop body runs while ' + lv.name + ' ' + cmp + ' ' + formatValue(to) + '.');
        } else {
          yield ev(line, 'FOR sets ' + lv.name + ' to ' + formatValue(from) + ', which is already past ' + formatValue(to) + ', so the body never runs.');
          return;
        }
        for (;;) {
          yield* execBlock(s.body, S);
          store(ref, lv.value + step, S, s.nextLine, 'INTEGER');
          var again = inRange(lv.value);
          yield ev(s.nextLine, 'NEXT ' + (step === 1 ? 'adds 1 to ' : 'adds ' + formatValue(step) + ' to ') + lv.name + ', so it is now ' + formatValue(lv.value) + '. ' +
            (again ? 'That is still ' + cmp + ' ' + formatValue(to) + ', so go back to the top of the loop.' : 'That is past ' + formatValue(to) + ', so the loop ends.'));
          if (!again) return;
        }
      }
      case 'while': {
        for (;;) {
          var wc = evalCond(s.cond, s.condText, S, line);
          yield ev(line, s.condText + ' is ' + (wc ? 'TRUE, so the loop body runs.' : 'FALSE, so the loop ends and the program continues after ENDWHILE.'));
          if (!wc) return;
          yield* execBlock(s.body, S);
        }
      }
      case 'repeat': {
        for (;;) {
          yield* execBlock(s.body, S);
          var rc = evalCond(s.cond, s.condText, S, s.untilLine);
          yield ev(s.untilLine, s.condText + ' is ' + (rc ? 'TRUE, so the loop stops.' : 'FALSE, so go back to REPEAT and run the body again.'));
          if (rc) return;
        }
      }
    }
  }

  // ---------------------------------------------------------------- runner
  function setupGivens(S, givens) {
    (givens || []).forEach(function (g) {
      if (g.values) {
        var lo = g.lo || 1;
        var v = S.create(g.name, { base: g.type, dims: [{ lo: lo, hi: lo + g.values.length - 1 }] }, 0, { given: true });
        g.values.forEach(function (x, i) { v.arr.data[String(lo + i)] = x; });
      } else {
        var sv = S.create(g.name, { base: g.type }, 0, { given: true });
        sv.value = g.value;
      }
    });
  }

  function snapshot(S) {
    var snap = {};
    S.order.forEach(function (key) {
      var v = S.vars[key];
      if (v.arr) {
        Object.keys(v.arr.data).forEach(function (k) { snap[v.name + '[' + k + ']'] = describe(v.arr.data[k]); });
      } else if (v.value !== undefined) {
        snap[v.name] = describe(v.value);
      }
    });
    return snap;
  }

  function Runner(source, opts) {
    opts = opts || {};
    this.maxSteps = opts.maxSteps || 20000;
    this.state = new State(opts);
    this.outputs = this.state.outputs;
    this.trace = [];
    this.columns = [];
    this.events = 0;
    this.error = null;
    this.done = false;
    this.current = null;
    try {
      this.program = new Program(source);
      setupGivens(this.state, opts.givens);
      this.gen = execBlock(this.program.body, this.state);
      this.prev = snapshot(this.state);
    } catch (e) {
      this.fail(e);
    }
  }
  Runner.prototype.fail = function (e) {
    if (e instanceof CieError) this.error = e;
    else this.error = new CieError('Something unexpected went wrong running this code (' + (e && e.message) + ').', null);
    this.done = true;
  };
  Runner.prototype.step = function () {
    if (this.done) return null;
    var r;
    try {
      r = this.gen.next();
    } catch (e) {
      this.fail(e);
      return null;
    }
    if (r.done) { this.done = true; this.current = null; return null; }
    this.events++;
    var e = r.value;
    var snap = snapshot(this.state);
    var changes = {};
    var changed = false;
    var self = this;
    Object.keys(snap).forEach(function (k) {
      if (snap[k] !== self.prev[k]) {
        changes[k] = snap[k];
        changed = true;
        if (self.columns.indexOf(k) === -1) self.columns.push(k);
      }
    });
    this.prev = snap;
    e.changes = changes;
    e.vars = snap;
    if (changed || e.output !== undefined) {
      this.trace.push({ line: e.line, changes: changes, output: e.output });
    }
    this.current = e;
    if (this.events >= this.maxSteps) {
      this.error = new CieError('The program ran for too long and was stopped. Is there a loop whose condition never changes?', e.line);
      this.done = true;
    }
    return e;
  };
  Runner.prototype.runToEnd = function () {
    while (!this.done) this.step();
    return this;
  };
  Object.defineProperty(Runner.prototype, 'inputsLeft', { get: function () { return this.state.inputs.length; } });

  // ---------------------------------------------------------------- style notes
  var BLOCK_WORDS = ['IF', 'THEN', 'ELSE', 'ENDIF', 'FOR', 'TO', 'NEXT', 'WHILE', 'DO', 'ENDWHILE', 'REPEAT', 'UNTIL',
    'CASE', 'OF', 'OTHERWISE', 'ENDCASE', 'INPUT', 'OUTPUT', 'DECLARE', 'CONSTANT', 'AND', 'OR', 'NOT', 'MOD', 'DIV', 'TRUE', 'FALSE', 'ARRAY', 'STEP'];

  function lint(source) {
    var notes = [];
    var lines = String(source).replace(/\r/g, '').split('\n');
    var lowercaseFlagged = false, promptFlags = 0, indentFlagged = false;
    var declared = {};
    var stack = [];
    var prevCode = null;
    lines.forEach(function (raw, i) {
      var lineNo = i + 1;
      var code = stripComment(raw);
      var text = code.trim();
      if (!text) return;
      var noStr = text.replace(/"[^"]*"/g, '""');
      if (!lowercaseFlagged) {
        var words = noStr.match(/[A-Za-z_]\w*/g) || [];
        for (var w = 0; w < words.length; w++) {
          var up = words[w].toUpperCase();
          if (BLOCK_WORDS.indexOf(up) !== -1 && words[w] !== up) {
            notes.push({ line: lineNo, msg: 'Write keywords in capitals, e.g. ' + up + ' not ' + words[w] + '.' });
            lowercaseFlagged = true;
            break;
          }
        }
      }
      var dm = /^DECLARE\s+(.+?)\s*:/i.exec(text);
      if (dm) dm[1].split(',').forEach(function (n) { declared[n.trim().toUpperCase()] = n.trim(); });
      if (/^INPUT\b/i.test(text) && promptFlags < 2 && !(prevCode && /^OUTPUT\b/i.test(prevCode))) {
        notes.push({ line: lineNo, msg: 'Put an OUTPUT prompt just before this INPUT so the user knows what to type.' });
        promptFlags++;
      }
      var indent = code.length - code.replace(/^\s+/, '').length;
      var u = text.toUpperCase();
      var isCloser = /^(ENDIF|NEXT|ENDWHILE|UNTIL|ENDCASE)\b/.test(u);
      var isMiddle = /^(ELSE|THEN|OTHERWISE)\b/.test(u) || CASE_LABEL_RE.test(text);
      if (isCloser) stack.pop();
      else if (!isMiddle && stack.length && indent <= stack[stack.length - 1] && !indentFlagged) {
        notes.push({ line: lineNo, msg: 'Indent the lines inside IF, FOR, WHILE, REPEAT and CASE so the structure is easy to see.' });
        indentFlagged = true;
      }
      if (/^(IF|FOR|WHILE|REPEAT|CASE)\b/.test(u)) stack.push(indent);
      prevCode = text;
    });
    var seenCase = {};
    lines.forEach(function (raw, i) {
      var noStr = stripComment(raw).replace(/"[^"]*"/g, '""');
      (noStr.match(/[A-Za-z_]\w*/g) || []).forEach(function (w) {
        var key = w.toUpperCase();
        if (declared[key] && declared[key] !== w && !seenCase[key]) {
          seenCase[key] = true;
          notes.push({ line: i + 1, msg: 'You declared ' + declared[key] + ' but wrote ' + w + ' here. Keep the same capital letters every time.' });
        }
      });
    });
    return notes;
  }

  // ---------------------------------------------------------------- checking
  function norm(s) { return String(s).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // A line can satisfy several expected values in order ("4 each, 3 left").
  // Each match consumes what it matched so one number cannot count twice.
  function matchLine(rest, exp) {
    if (typeof exp === 'number') {
      var re = /-?\d+(?:\.\d+)?/g, m;
      while ((m = re.exec(rest))) {
        var x = parseFloat(m[0]);
        var dp = (m[0].split('.')[1] || '').length;
        var ok = Math.abs(x - exp) < 1e-6 || (dp > 0 && dp <= 3 && Math.abs(x - Math.round(exp * Math.pow(10, dp)) / Math.pow(10, dp)) < 1e-9);
        if (ok) return rest.slice(0, m.index) + ' ' + rest.slice(m.index + m[0].length);
      }
      return null;
    }
    var e = norm(exp);
    var rx = new RegExp('(^|[^a-z0-9])' + escapeRe(e) + '(?![a-z0-9])');
    var mm = rx.exec(rest);
    if (!mm) return null;
    return rest.slice(0, mm.index + mm[1].length) + ' ' + rest.slice(mm.index + mm[0].length);
  }

  function matchSequence(lines, expected) {
    var j = 0;
    for (var i = 0; i < lines.length && j < expected.length; i++) {
      var rest = norm(lines[i]);
      var r;
      while (j < expected.length && (r = matchLine(rest, expected[j])) !== null) { rest = r; j++; }
    }
    return j;
  }

  function codeOnly(source) {
    return String(source).split('\n').map(function (l) { return stripComment(l).replace(/"[^"]*"/g, '""'); }).join('\n');
  }

  function checkTask(source, task) {
    var code = codeOnly(source);
    var requireFails = (task.requires || []).filter(function (r) { return !new RegExp(r.re, 'i').test(code); }).map(function (r) { return r.msg; });
    var results = (task.tests || []).map(function (test) {
      var runner = new Runner(source, { inputs: test.inputs || [], givens: test.givens || task.givens }).runToEnd();
      var res = { test: test, outputs: runner.outputs.map(function (o) { return o.text; }), error: runner.error, pass: false, msg: '' };
      if (runner.error) { res.msg = 'Error' + (runner.error.line ? ' on line ' + runner.error.line : '') + ': ' + runner.error.message; return res; }
      var exp = test.expect || [];
      var real = runner.outputs.filter(function (o) { return !o.prompt; }).map(function (o) { return o.text; });
      var all = runner.outputs.map(function (o) { return o.text; });
      var got = Math.max(matchSequence(real, exp), matchSequence(all, exp));
      if (got < exp.length) {
        res.msg = 'Expected the output to include ' + describe(exp[got]) + (exp.length > 1 ? ' (result ' + (got + 1) + ' of ' + exp.length + ', in order)' : '') + '.';
        return res;
      }
      var bad = (test.forbid || []).filter(function (f) { return matchSequence(real, [f]) === 1; });
      if (bad.length) { res.msg = 'Your program also output ' + describe(bad[0]) + ', which should not happen for this input.'; return res; }
      if (test.useAllInputs && runner.inputsLeft > 0) {
        res.msg = 'Your program stopped asking for input too early: ' + runner.inputsLeft + ' test input' + (runner.inputsLeft === 1 ? ' was' : 's were') + ' never used. Should it have asked again?';
        return res;
      }
      res.pass = true;
      return res;
    });
    return {
      pass: requireFails.length === 0 && results.every(function (r) { return r.pass; }),
      results: results,
      requireFails: requireFails
    };
  }

  var api = {
    CieError: CieError,
    Runner: Runner,
    lint: lint,
    checkTask: checkTask,
    formatValue: formatValue,
    describe: describe,
    parse: function (src) { return new Program(src); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.CIE = api;
})(typeof window !== 'undefined' ? window : this);
