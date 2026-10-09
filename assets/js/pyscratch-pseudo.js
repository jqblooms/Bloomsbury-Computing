/*
 * PyScratch CIE pseudocode mode: turns Cambridge IGCSE pseudocode into the
 * Python that PyScratch already runs, so threads, events, clones, waits and
 * on-screen variables behave exactly as they do in Python mode.
 *
 * transpile(source) returns { python: [{ text, src }], errors: [{ line, message }] }
 * where src is the pseudocode line each Python line came from (0 for helper
 * lines), so runtime errors can be reported against the student's own lines.
 *
 * Loaded by scratch/editor.html just before pyscratch.js. No-op in the
 * browser unless ?pyscratch is in the URL; also loadable in Node for tests.
 */
(function (root) {
  'use strict';

  if (typeof location !== 'undefined' && typeof module === 'undefined' && !/[?&]pyscratch/.test(location.search)) return;

  // ── The sprite commands ─────────────────────────────────────────
  // kind 'proc' is used with CALL; kind 'func' gives back a value.
  // py is the Python call each one runs; args is [fewest, most].
  var API = [
    // Motion
    { n: 'MoveSteps', k: 'proc', py: 'move_steps', a: [1, 1], p: 'Steps', cat: 'mov', d: 'Move forward in the direction the sprite faces.' },
    { n: 'TurnRight', k: 'proc', py: 'turn_right', a: [1, 1], p: 'Degrees', cat: 'mov', d: 'Turn clockwise.' },
    { n: 'TurnLeft', k: 'proc', py: 'turn_left', a: [1, 1], p: 'Degrees', cat: 'mov', d: 'Turn anticlockwise.' },
    { n: 'GoTo', k: 'proc', py: 'go_to', a: [1, 1], p: 'Target', cat: 'mov', d: 'Jump to "random", "mouse_pointer" or another sprite.' },
    { n: 'GoToXY', k: 'proc', py: 'go_to_xy', a: [2, 2], p: 'X, Y', cat: 'mov', d: 'Jump to a position. The centre of the stage is 0, 0.' },
    { n: 'GlideToXY', k: 'proc', py: 'glide_to_xy', a: [3, 3], p: 'X, Y, Seconds', cat: 'mov', d: 'Glide smoothly to a position.' },
    { n: 'GlideTo', k: 'proc', py: 'glide_to', a: [2, 2], p: 'Target, Seconds', cat: 'mov', d: 'Glide to "random", "mouse_pointer" or another sprite.' },
    { n: 'PointInDirection', k: 'proc', py: 'point_in_direction', a: [1, 1], p: 'Degrees', cat: 'mov', d: '90 is right, -90 is left, 0 is up, 180 is down.' },
    { n: 'PointTowards', k: 'proc', py: 'point_towards', a: [1, 1], p: 'Target', cat: 'mov', d: 'Face "mouse_pointer" or another sprite.' },
    { n: 'ChangeX', k: 'proc', py: 'change_x', a: [1, 1], p: 'Amount', cat: 'mov', d: 'Move left or right.' },
    { n: 'ChangeY', k: 'proc', py: 'change_y', a: [1, 1], p: 'Amount', cat: 'mov', d: 'Move up or down.' },
    { n: 'SetX', k: 'proc', py: 'set_x', a: [1, 1], p: 'X', cat: 'mov', d: 'Set the x position.' },
    { n: 'SetY', k: 'proc', py: 'set_y', a: [1, 1], p: 'Y', cat: 'mov', d: 'Set the y position.' },
    { n: 'IfOnEdgeBounce', k: 'proc', py: 'if_on_edge_bounce', a: [0, 0], p: '', cat: 'mov', d: 'Turn around at the edge of the stage.' },
    { n: 'SetRotationStyle', k: 'proc', py: 'set_rotation_style', a: [1, 1], p: 'Style', cat: 'mov', d: '"left-right", "all around" or "don\'t rotate".' },
    { n: 'XPosition', k: 'func', py: 'x_position', a: [0, 0], p: '', cat: 'mov', d: 'The x position.' },
    { n: 'YPosition', k: 'func', py: 'y_position', a: [0, 0], p: '', cat: 'mov', d: 'The y position.' },
    { n: 'Direction', k: 'func', py: 'direction', a: [0, 0], p: '', cat: 'mov', d: 'The direction the sprite faces.' },
    { n: 'OnEdge', k: 'func', py: 'on_edge', a: [0, 0], p: '', cat: 'mov', d: 'TRUE when touching the edge of the stage.' },
    // Looks
    { n: 'Say', k: 'proc', py: 'say', a: [1, 1], p: 'Message', cat: 'look', d: 'Show a speech bubble.', str: true },
    { n: 'SayFor', k: 'proc', py: 'say_for', a: [2, 2], p: 'Message, Seconds', cat: 'look', d: 'Show a speech bubble, then wait.', str: true },
    { n: 'Think', k: 'proc', py: 'think', a: [1, 1], p: 'Message', cat: 'look', d: 'Show a thought bubble.', str: true },
    { n: 'ThinkFor', k: 'proc', py: 'think_for', a: [2, 2], p: 'Message, Seconds', cat: 'look', d: 'Show a thought bubble, then wait.', str: true },
    { n: 'SetCostume', k: 'proc', py: 'set_costume', a: [1, 1], p: 'Costume', cat: 'look', d: 'Change costume by name or number.' },
    { n: 'NextCostume', k: 'proc', py: 'next_costume', a: [0, 0], p: '', cat: 'look', d: 'Change to the next costume.' },
    { n: 'CostumeNumber', k: 'func', py: 'costume_number', a: [0, 0], p: '', cat: 'look', d: 'The costume number, starting at 1.' },
    { n: 'CostumeName', k: 'func', py: 'costume_name', a: [0, 0], p: '', cat: 'look', d: 'The costume name.' },
    { n: 'SetBackdrop', k: 'proc', py: 'set_backdrop', a: [1, 1], p: 'Backdrop', cat: 'look', d: 'Change the stage backdrop.' },
    { n: 'NextBackdrop', k: 'proc', py: 'next_backdrop', a: [0, 0], p: '', cat: 'look', d: 'Change to the next backdrop.' },
    { n: 'BackdropName', k: 'func', py: 'backdrop_name', a: [0, 0], p: '', cat: 'look', d: 'The backdrop name.' },
    { n: 'SetSize', k: 'proc', py: 'set_size', a: [1, 1], p: 'Percent', cat: 'look', d: 'Set the size. 100 is normal.' },
    { n: 'ChangeSize', k: 'proc', py: 'change_size', a: [1, 1], p: 'Amount', cat: 'look', d: 'Make the sprite bigger or smaller.' },
    { n: 'Size', k: 'func', py: 'size', a: [0, 0], p: '', cat: 'look', d: 'The size as a percentage.' },
    { n: 'Show', k: 'proc', py: 'show', a: [0, 0], p: '', cat: 'look', d: 'Show the sprite.' },
    { n: 'Hide', k: 'proc', py: 'hide', a: [0, 0], p: '', cat: 'look', d: 'Hide the sprite.' },
    { n: 'SetEffect', k: 'proc', py: 'set_effect', a: [2, 2], p: 'Effect, Value', cat: 'look', d: '"color", "ghost", "brightness", "fisheye", "whirl", "pixelate" or "mosaic".' },
    { n: 'ChangeEffect', k: 'proc', py: 'change_effect', a: [2, 2], p: 'Effect, Amount', cat: 'look', d: 'Change a graphic effect.' },
    { n: 'ClearEffects', k: 'proc', py: 'clear_effects', a: [0, 0], p: '', cat: 'look', d: 'Remove all graphic effects.' },
    { n: 'GoToFront', k: 'proc', py: 'go_to_front', a: [0, 0], p: '', cat: 'look', d: 'Move in front of the other sprites.' },
    { n: 'GoToBack', k: 'proc', py: 'go_to_back', a: [0, 0], p: '', cat: 'look', d: 'Move behind the other sprites.' },
    // Sound
    { n: 'PlaySound', k: 'proc', py: 'play_sound', a: [1, 1], p: 'Sound', cat: 'snd', d: 'Start a sound.' },
    { n: 'PlaySoundUntilDone', k: 'proc', py: 'play_sound_until_done', a: [1, 1], p: 'Sound', cat: 'snd', d: 'Play a sound and wait for it to finish.' },
    { n: 'StopAllSounds', k: 'proc', py: 'stop_all_sounds', a: [0, 0], p: '', cat: 'snd', d: 'Stop every sound.' },
    { n: 'SetVolume', k: 'proc', py: 'set_volume', a: [1, 1], p: 'Percent', cat: 'snd', d: 'Set the volume, 0 to 100.' },
    // Events and control
    { n: 'Wait', k: 'proc', py: 'wait', a: [1, 1], p: 'Seconds', cat: 'ctrl', d: 'Pause this procedure.' },
    { n: 'Stop', k: 'proc', py: 'stop', a: [0, 0], p: '', cat: 'ctrl', d: 'Stop the whole project.' },
    { n: 'CreateClone', k: 'proc', py: 'create_clone', a: [0, 0], p: '', cat: 'ctrl', d: 'Make a copy of this sprite. The copy runs WhenIStartAsAClone.' },
    { n: 'CreateCloneOf', k: 'proc', py: 'create_clone_of', a: [1, 1], p: 'Sprite', cat: 'ctrl', d: 'Make a copy of another sprite.' },
    { n: 'DeleteClone', k: 'proc', py: 'delete_clone', a: [0, 0], p: '', cat: 'ctrl', d: 'Remove this clone.' },
    { n: 'IsClone', k: 'func', py: 'is_clone', a: [0, 0], p: '', cat: 'ctrl', d: 'TRUE when this sprite is a clone.' },
    { n: 'Broadcast', k: 'proc', py: 'broadcast', a: [1, 1], p: 'Message', cat: 'evt', d: 'Send a message to every WhenMessageReceived.' },
    { n: 'BroadcastAndWait', k: 'proc', py: 'broadcast_and_wait', a: [1, 1], p: 'Message', cat: 'evt', d: 'Send a message and wait until every reply has finished.' },
    // Sensing
    { n: 'KeyPressed', k: 'func', py: 'key_pressed', a: [1, 1], p: 'Key', cat: 'sens', d: 'TRUE while a key is held: "space", "up", "down", "left", "right", "a" to "z".' },
    { n: 'Touching', k: 'func', py: 'touching', a: [1, 1], p: 'Sprite', cat: 'sens', d: 'TRUE when touching another sprite (or any of its clones), "mouse_pointer" or "edge".' },
    { n: 'TouchingColour', k: 'func', py: 'touching_colour', a: [1, 1], p: 'Colour', cat: 'sens', d: 'TRUE when touching a colour such as "#ff0000".' },
    { n: 'DistanceTo', k: 'func', py: 'distance_to', a: [1, 1], p: 'Sprite', cat: 'sens', d: 'How far away another sprite or "mouse_pointer" is.' },
    { n: 'MouseX', k: 'func', py: 'mouse_x', a: [0, 0], p: '', cat: 'sens', d: 'The mouse x position.' },
    { n: 'MouseY', k: 'func', py: 'mouse_y', a: [0, 0], p: '', cat: 'sens', d: 'The mouse y position.' },
    { n: 'MouseDown', k: 'func', py: 'mouse_down', a: [0, 0], p: '', cat: 'sens', d: 'TRUE while the mouse button is held.' },
    { n: 'Timer', k: 'func', py: 'timer', a: [0, 0], p: '', cat: 'sens', d: 'Seconds since the green flag was clicked.' },
    { n: 'ResetTimer', k: 'proc', py: 'reset_timer', a: [0, 0], p: '', cat: 'sens', d: 'Set the timer back to 0.' },
    // Variables shown on the stage
    { n: 'SetVariable', k: 'proc', py: 'set_variable', a: [2, 2], p: 'Name, Value', cat: 'vars', d: 'Set a stage variable, making it if needed.' },
    { n: 'ChangeVariable', k: 'proc', py: 'change_variable', a: [2, 2], p: 'Name, Amount', cat: 'vars', d: 'Add to a stage variable.' },
    { n: 'GetVariable', k: 'func', py: 'get_variable', a: [1, 1], p: 'Name', cat: 'vars', d: 'Read a stage variable.' },
    { n: 'DisplayVariable', k: 'proc', py: 'display_variable', a: [1, 2], p: 'Name, Show', cat: 'vars', d: 'Show (TRUE) or hide (FALSE) a variable on the stage. Showing one of your own variables keeps it up to date by itself.' },
    { n: 'PickRandom', k: 'func', py: 'pick_random', a: [2, 2], p: 'Low, High', cat: 'ops', d: 'A random whole number from Low to High.' }
  ];

  // Cambridge library routines.
  var BUILTINS = {
    LENGTH: { a: [1, 1], py: '_ps_length', d: 'The number of characters in a string.' },
    LCASE: { a: [1, 1], py: '_ps_lcase', d: 'A string or character in lower case.' },
    UCASE: { a: [1, 1], py: '_ps_ucase', d: 'A string or character in upper case.' },
    SUBSTRING: { a: [3, 3], py: '_ps_substring', d: 'SUBSTRING(Text, Start, Length). The first character is position 1.' },
    ROUND: { a: [2, 2], py: '_ps_round', d: 'ROUND(Number, Places).' },
    RANDOM: { a: [0, 0], py: '_ps_random', d: 'A random number from 0 up to 1.' },
    INT: { a: [1, 1], py: '_ps_int', d: 'The whole number part of a number.' },
    MOD: { a: [2, 2], py: '_ps_mod', d: 'The remainder after dividing.' },
    DIV: { a: [2, 2], py: '_ps_div', d: 'Whole-number division.' }
  };

  // The procedures PyScratch runs by itself, and the Python names it looks for.
  var EVENTS = {
    GameStart: { py: 'game_start', params: 0, d: 'Runs when the green flag is clicked.' },
    WhenClicked: { py: 'when_clicked', params: 0, d: 'Runs when this sprite is clicked.' },
    WhenKeyPressed: { py: 'when_key_pressed', params: 1, sig: 'Key : STRING', d: 'Runs each time a key is pressed. Key holds its name, such as "space".' },
    WhenMessageReceived: { py: 'when_message_received', params: 1, sig: 'Message : STRING', d: 'Runs when a message is broadcast. Message holds the message.' },
    WhenBackdropSwitchesTo: { py: 'when_backdrop_switches_to', params: 1, sig: 'Backdrop : STRING', d: 'Runs when the backdrop changes.' },
    WhenIStartAsAClone: { py: 'when_I_start_as_a_clone', params: 0, d: 'Runs in each new clone.' }
  };

  var TYPES = { INTEGER: '0', REAL: '0.0', STRING: '""', CHAR: '" "', BOOLEAN: 'False' };
  var KEYWORDS = ['DECLARE', 'CONSTANT', 'ARRAY', 'OF', 'INTEGER', 'REAL', 'STRING', 'CHAR', 'BOOLEAN',
    'IF', 'THEN', 'ELSE', 'ELSEIF', 'ENDIF', 'CASE', 'OTHERWISE', 'ENDCASE', 'FOR', 'TO', 'STEP', 'NEXT',
    'WHILE', 'DO', 'ENDWHILE', 'REPEAT', 'UNTIL', 'PROCEDURE', 'ENDPROCEDURE', 'FUNCTION', 'RETURNS',
    'RETURN', 'ENDFUNCTION', 'CALL', 'INPUT', 'OUTPUT', 'AND', 'OR', 'NOT', 'MOD', 'DIV', 'TRUE', 'FALSE', 'BYVAL', 'BYREF'];
  var KW_SET = {};
  KEYWORDS.forEach(function (k) { KW_SET[k] = true; });

  var API_BY_NAME = {};
  API.forEach(function (a) { API_BY_NAME[a.n] = a; });

  var MISTAKES = {
    PRINT: 'Cambridge pseudocode uses OUTPUT, not PRINT.',
    READ: 'Cambridge pseudocode uses INPUT, not READ.',
    LET: 'Leave out LET. Just write Total <- 0',
    SET: 'Leave out SET. Just write Total <- 0',
    VAR: 'Use DECLARE Name : TYPE to create a variable.',
    DIM: 'Use DECLARE Name : TYPE to create a variable.',
    ELIF: 'Write ELSE, then a new IF on the next line (or use CASE OF).',
    ENDFOR: 'A FOR loop is closed with NEXT and the loop variable, e.g. NEXT Count',
    END: 'Closing words are one word in Cambridge pseudocode: ENDIF, ENDWHILE, ENDCASE, ENDPROCEDURE, ENDFUNCTION. FOR closes with NEXT, REPEAT closes with UNTIL.',
    ENDREPEAT: 'A REPEAT loop is closed with UNTIL and a condition, e.g. UNTIL Lives = 0',
    LOOP: 'Use FOR...NEXT, WHILE...ENDWHILE or REPEAT...UNTIL for a loop.',
    DEF: 'Cambridge pseudocode uses PROCEDURE Name() ... ENDPROCEDURE.'
  };

  function CieError(message, line) { this.message = message; this.line = line; }

  // Loose match for a mistyped name: ignores case and underscores.
  function looseKey(s) { return String(s).replace(/_/g, '').toLowerCase(); }
  var PY_TO_API = {};
  API.forEach(function (a) { PY_TO_API[looseKey(a.py)] = a.n; PY_TO_API[looseKey(a.n)] = a.n; });
  PY_TO_API.walkforward = 'MoveSteps';
  Object.keys(EVENTS).forEach(function (e) { PY_TO_API[looseKey(EVENTS[e].py)] = e; PY_TO_API[looseKey(e)] = e; });

  // ── Lines ───────────────────────────────────────────────────────
  function stripComment(text) {
    var inStr = null;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inStr) { if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; continue; }
      if (c === '/' && text[i + 1] === '/') return text.slice(0, i);
    }
    return text;
  }

  function normalise(text) {
    return text.replace(/←/g, '<-').replace(/[−–—]/g, '-')
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '<>');
  }

  // ── Expressions ─────────────────────────────────────────────────
  function lex(src, line) {
    var toks = [], i = 0;
    while (i < src.length) {
      var ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '"') {
        var j = src.indexOf('"', i + 1);
        if (j === -1) throw new CieError('This line has a " to start some text but no " to end it.', line);
        toks.push({ t: 'str', v: src.slice(i + 1, j) });
        i = j + 1; continue;
      }
      if (ch === "'") {
        var k = src.indexOf("'", i + 1);
        if (k === -1) throw new CieError("This line has a ' with no closing '.", line);
        var inner = src.slice(i + 1, k);
        if (inner.length !== 1) throw new CieError("Single quotes are only for one CHAR, like 'A'. Use double quotes for text: \"" + inner + '"', line);
        toks.push({ t: 'str', v: inner });
        i = k + 1; continue;
      }
      var two = src.substr(i, 2);
      if (two === '<-' || two === '<=' || two === '>=' || two === '<>' || two === '==' || two === '!=') {
        if (two === '==' || two === '!=') throw new CieError('Cambridge pseudocode compares with = and <>, not ' + two + '.', line);
        toks.push({ t: 'op', v: two }); i += 2; continue;
      }
      if ('()[],+-*/^&=<>'.indexOf(ch) !== -1) { toks.push({ t: 'op', v: ch }); i++; continue; }
      var num = /^\d+(\.\d+)?/.exec(src.slice(i));
      if (num) { toks.push({ t: 'num', v: num[0] }); i += num[0].length; continue; }
      var id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      if (id) { toks.push({ t: 'id', v: id[0] }); i += id[0].length; continue; }
      throw new CieError('I can\'t understand "' + ch + '" here.', line);
    }
    return toks;
  }

  function Parser(toks, line) { this.t = toks; this.i = 0; this.line = line; }
  Parser.prototype.peek = function () { return this.t[this.i]; };
  Parser.prototype.next = function () { return this.t[this.i++]; };
  Parser.prototype.isOp = function (v) { var x = this.t[this.i]; return x && x.t === 'op' && x.v === v; };
  Parser.prototype.isWord = function (v) {
    var x = this.t[this.i];
    if (!x || x.t !== 'id') return false;
    if (x.v === v) return true;
    if (x.v.toUpperCase() === v && KW_SET[v]) throw new CieError('Keywords are written in capitals in pseudocode: ' + v, this.line);
    return false;
  };
  Parser.prototype.expect = function (v, msg) {
    if (!this.isOp(v)) throw new CieError(msg, this.line);
    this.i++;
  };
  Parser.prototype.or = function () {
    var l = this.and();
    while (this.isWord('OR')) { this.i++; l = { k: 'bin', op: 'OR', l: l, r: this.and() }; }
    return l;
  };
  Parser.prototype.and = function () {
    var l = this.not();
    while (this.isWord('AND')) { this.i++; l = { k: 'bin', op: 'AND', l: l, r: this.not() }; }
    return l;
  };
  Parser.prototype.not = function () {
    if (this.isWord('NOT')) { this.i++; return { k: 'not', e: this.not() }; }
    return this.cmp();
  };
  Parser.prototype.cmp = function () {
    var l = this.add();
    var x = this.peek();
    if (x && x.t === 'op' && ['=', '<>', '<', '>', '<=', '>='].indexOf(x.v) !== -1) {
      this.i++;
      l = { k: 'bin', op: x.v, l: l, r: this.add() };
      var y = this.peek();
      if (y && y.t === 'op' && ['=', '<>', '<', '>', '<=', '>='].indexOf(y.v) !== -1) {
        throw new CieError('Compare two things at a time and join comparisons with AND or OR, e.g. X > 1 AND X < 10', this.line);
      }
    }
    return l;
  };
  Parser.prototype.add = function () {
    var l = this.mul();
    while (this.isOp('+') || this.isOp('-') || this.isOp('&')) {
      var op = this.next().v;
      l = { k: 'bin', op: op, l: l, r: this.mul() };
    }
    return l;
  };
  Parser.prototype.mul = function () {
    var l = this.pow();
    while (this.isOp('*') || this.isOp('/') || this.isWord('MOD') || this.isWord('DIV')) {
      var op = this.next().v;
      l = { k: 'bin', op: op, l: l, r: this.pow() };
    }
    return l;
  };
  Parser.prototype.pow = function () {
    var l = this.unary();
    if (this.isOp('^')) { this.i++; return { k: 'bin', op: '^', l: l, r: this.pow() }; }
    return l;
  };
  Parser.prototype.unary = function () {
    if (this.isOp('-')) { this.i++; return { k: 'neg', e: this.unary() }; }
    if (this.isOp('+')) { this.i++; return this.unary(); }
    return this.primary();
  };
  Parser.prototype.args = function (closer) {
    var list = [];
    if (this.isOp(closer)) { this.i++; return list; }
    for (;;) {
      list.push(this.or());
      if (this.isOp(',')) { this.i++; continue; }
      if (this.isOp(closer)) { this.i++; return list; }
      throw new CieError('Missing a closing bracket "' + closer + '" or a comma between values.', this.line);
    }
  };
  Parser.prototype.primary = function () {
    var x = this.next();
    if (!x) throw new CieError('Something is missing at the end of this line.', this.line);
    if (x.t === 'num') return { k: 'num', v: x.v };
    if (x.t === 'str') return { k: 'str', v: x.v };
    if (x.t === 'op' && x.v === '(') {
      var e = this.or();
      this.expect(')', 'Missing a closing bracket ")".');
      return e;
    }
    if (x.t === 'id') {
      var up = x.v.toUpperCase();
      if (x.v === 'TRUE' || x.v === 'FALSE') return { k: 'bool', v: x.v === 'TRUE' };
      if (up === 'TRUE' || up === 'FALSE') throw new CieError('Keywords are written in capitals in pseudocode: ' + up, this.line);
      if (KW_SET[x.v] && !BUILTINS[x.v]) throw new CieError('"' + x.v + '" can\'t be used here.', this.line);
      if (this.isOp('(')) { this.i++; return { k: 'call', name: x.v, args: this.args(')') }; }
      if (this.isOp('[')) { this.i++; return { k: 'idx', name: x.v, idx: this.args(']') }; }
      return { k: 'var', name: x.v };
    }
    throw new CieError('I can\'t understand "' + x.v + '" here.', this.line);
  };

  function parseExpr(text, line) {
    var p = new Parser(lex(text, line), line);
    if (!p.peek()) throw new CieError('Something is missing here.', line);
    var e = p.or();
    if (p.peek()) {
      var rest = p.peek();
      if (rest.t === 'op' && rest.v === '<-') throw new CieError('Use = to compare. <- stores a value and goes at the start of a line.', line);
      throw new CieError('I don\'t understand "' + rest.v + '" here.', line);
    }
    return e;
  }

  // Splits on commas that are not inside brackets or quotes.
  function splitTop(text) {
    var parts = [], depth = 0, cur = '', q = null;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === '(' || c === '[') depth++;
      if (c === ')' || c === ']') depth--;
      if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts.map(function (s) { return s.trim(); });
  }

  // Index of a top-level "<-" (not in quotes or brackets), or -1.
  function topArrow(text) {
    var depth = 0, q = null;
    for (var i = 0; i < text.length - 1; i++) {
      var c = text[i];
      if (q) { if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; continue; }
      if (c === '(' || c === '[') depth++;
      if (c === ')' || c === ']') depth--;
      if (depth === 0 && c === '<' && text[i + 1] === '-') return i;
    }
    return -1;
  }

  function parseType(text, line) {
    var t = text.trim();
    if (TYPES.hasOwnProperty(t)) return { kind: t };
    if (TYPES.hasOwnProperty(t.toUpperCase())) throw new CieError('Data types are written in capitals: ' + t.toUpperCase(), line);
    var m = /^ARRAY\s*\[(.+)\]\s*OF\s+(\w+)$/.exec(t);
    if (m) {
      var el = m[2];
      if (!TYPES.hasOwnProperty(el)) throw new CieError('An array must be OF INTEGER, REAL, STRING, CHAR or BOOLEAN.', line);
      var dims = splitTop(m[1]).map(function (d) {
        var b = /^(.+?):(.+)$/.exec(d);
        if (!b) throw new CieError('Array bounds look like ARRAY[1:10] OF INTEGER.', line);
        return { lo: parseExpr(b[1], line), hi: parseExpr(b[2], line) };
      });
      if (dims.length > 2) throw new CieError('Arrays can have one or two dimensions.', line);
      return { kind: 'ARRAY', elem: el, dims: dims };
    }
    if (/^array\b/i.test(t)) throw new CieError('Write arrays like this: ARRAY[1:10] OF INTEGER', line);
    throw new CieError('"' + t + '" is not a data type. Use INTEGER, REAL, STRING, CHAR, BOOLEAN or ARRAY[1:10] OF INTEGER.', line);
  }

  function parseParams(text, line) {
    if (!text || !text.trim()) return [];
    return splitTop(text).map(function (p) {
      var s = p.replace(/^BYVAL\s+/, '');
      if (/^BYREF\b/.test(s)) throw new CieError('BYREF is not available here. Return a value from a FUNCTION instead.', line);
      var m = /^([A-Za-z_]\w*)\s*:\s*(\w+)$/.exec(s);
      if (!m) throw new CieError('Parameters look like this: (Steps : INTEGER, Name : STRING)', line);
      if (!TYPES.hasOwnProperty(m[2])) throw new CieError('"' + m[2] + '" is not a data type. Use INTEGER, REAL, STRING, CHAR or BOOLEAN.', line);
      return { name: m[1], type: m[2] };
    });
  }

  // ── Statements ──────────────────────────────────────────────────
  var CASE_LIT = '(?:-?\\d+(?:\\.\\d+)?|"[^"]*"|\'[^\']\'|TRUE|FALSE)';
  var CASE_LABEL = new RegExp('^(' + CASE_LIT + ')(?:\\s+TO\\s+(' + CASE_LIT + '))?\\s*:\\s*(.*)$');

  function firstWord(text) { return (/^[A-Za-z_]+/.exec(text) || [''])[0]; }

  function terminator(text) {
    var w = firstWord(text);
    if (w === 'ELSE' && /^ELSE\s+IF\b/.test(text)) return 'ELSEIF';
    if (['ELSE', 'ELSEIF', 'ENDIF', 'NEXT', 'ENDWHILE', 'UNTIL', 'ENDCASE', 'OTHERWISE', 'ENDPROCEDURE', 'ENDFUNCTION', 'THEN'].indexOf(w) !== -1) return w;
    if (CASE_LABEL.test(text)) return 'CASELABEL';
    return null;
  }

  function StmtParser(lines) { this.L = lines; this.i = 0; }
  StmtParser.prototype.peek = function () { return this.L[this.i]; };

  // Reads statements until one of the closing words; returns them.
  StmtParser.prototype.block = function (closers, opener) {
    var out = [];
    for (;;) {
      var L = this.L[this.i];
      if (!L) {
        if (!closers) return out;
        throw new CieError(opener.word + ' is missing its ' + (opener.need || closers[0]) + '.', opener.line);
      }
      var term = terminator(L.text);
      if (term && closers && closers.indexOf(term) !== -1) return out;
      if (term && term !== 'CASELABEL') {
        var owner = { ELSE: 'IF', ELSEIF: 'IF', ENDIF: 'IF', THEN: 'IF', NEXT: 'FOR', ENDWHILE: 'WHILE', UNTIL: 'REPEAT', ENDCASE: 'CASE OF', OTHERWISE: 'CASE OF', ENDPROCEDURE: 'PROCEDURE', ENDFUNCTION: 'FUNCTION' }[term];
        if (closers) throw new CieError(term + ' does not match. The open ' + opener.word + ' (line ' + opener.line + ') needs ' + (opener.need || closers[0]) + ' first.', L.line);
        throw new CieError(term + ' has no ' + owner + ' to go with it.', L.line);
      }
      this.i++;
      out.push(this.statement(L));
    }
  };

  StmtParser.prototype.ifHeader = function (L, rest, word) {
    var inline = /^(.*?)\s+THEN\s+(\S.*)$/.exec(rest);
    if (inline) throw new CieError('Put the statement on its own line after THEN, not on the same line.', L.line);
    var hasThen = /(^|\s)THEN$/.test(rest);
    if (!hasThen && /(^|\s)then$/i.test(rest)) throw new CieError('Keywords are written in capitals in pseudocode: THEN', L.line);
    var condText = hasThen ? rest.replace(/\s*THEN$/, '').trim() : rest.trim();
    if (!condText) throw new CieError(word + ' needs a condition, e.g. ' + word + ' Score > 10 THEN', L.line);
    if (!hasThen) {
      var nx = this.L[this.i];
      if (!nx || nx.text !== 'THEN') throw new CieError('After ' + word + ' ' + condText + ' write THEN, either at the end of the line or on the next line.', L.line);
      this.i++;
    }
    return parseExpr(condText, L.line);
  };

  StmtParser.prototype.statement = function (L) {
    var text = L.text, line = L.line, m;
    var w = firstWord(text);

    // Keywords must be capitals.
    if (w && w !== w.toUpperCase() && KW_SET[w.toUpperCase()] && !/^\w+\s*(<-|\[)/.test(text)) {
      throw new CieError('Keywords are written in capitals in pseudocode: ' + w.toUpperCase(), line);
    }

    if (w === 'DECLARE') {
      m = /^DECLARE\s+([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*)\s*:\s*(.+)$/.exec(text);
      if (!m) throw new CieError('DECLARE needs a name, a colon and a type, e.g. DECLARE Score : INTEGER', line);
      return { k: 'declare', line: line, names: m[1].split(',').map(function (s) { return s.trim(); }), type: parseType(m[2], line) };
    }
    if (w === 'CONSTANT') {
      m = /^CONSTANT\s+([A-Za-z_]\w*)\s*(?:<-|=)\s*(.+)$/.exec(text);
      if (!m) throw new CieError('A CONSTANT line looks like: CONSTANT Speed <- 5', line);
      var ce = parseExpr(m[2], line);
      if (['num', 'str', 'bool'].indexOf(ce.k) === -1 && !(ce.k === 'neg' && ce.e.k === 'num')) throw new CieError('A CONSTANT must be given a fixed value, like 5 or "Player".', line);
      return { k: 'constant', line: line, name: m[1], e: ce };
    }
    if (w === 'IF') {
      var node = { k: 'if', line: line, cond: this.ifHeader(L, text.replace(/^IF\b/, ''), 'IF'), elifs: [], els: null };
      node.then = this.block(['ELSE', 'ELSEIF', 'ENDIF'], { word: 'IF', line: line, need: 'ENDIF' });
      while (terminator(this.peek().text) === 'ELSEIF') {
        var EL = this.peek(); this.i++;
        var rest = EL.text.replace(/^ELSE\s*IF\b/, '');
        node.elifs.push({ line: EL.line, cond: this.ifHeader(EL, rest, 'ELSE IF'), body: this.block(['ELSE', 'ELSEIF', 'ENDIF'], { word: 'IF', line: line, need: 'ENDIF' }) });
      }
      if (terminator(this.peek().text) === 'ELSE') {
        if (this.peek().text !== 'ELSE') throw new CieError('Put ELSE on a line by itself.', this.peek().line);
        this.i++;
        node.els = this.block(['ENDIF'], { word: 'IF', line: line, need: 'ENDIF' });
      }
      if (this.peek().text !== 'ENDIF') throw new CieError('Put ENDIF on a line by itself.', this.peek().line);
      this.i++;
      return node;
    }
    if (w === 'CASE') {
      m = /^CASE\s+OF\s+(.+)$/.exec(text);
      if (!m) throw new CieError('A CASE starts like this: CASE OF Choice', line);
      var cnode = { k: 'case', line: line, e: parseExpr(m[1], line), branches: [], other: null };
      for (;;) {
        var BL = this.peek();
        if (!BL) throw new CieError('CASE OF is missing its ENDCASE.', line);
        var t = terminator(BL.text);
        if (t === 'ENDCASE') { this.i++; break; }
        this.i++;
        var body = [], inlineText;
        if (t === 'OTHERWISE') {
          inlineText = BL.text.replace(/^OTHERWISE\s*:?\s*/, '');
        } else if (t === 'CASELABEL') {
          var lm = CASE_LABEL.exec(BL.text);
          inlineText = lm[3];
        } else {
          throw new CieError('Inside CASE OF, each line starts with a value and a colon, e.g. 1 : CALL Say("One"), or OTHERWISE.', BL.line);
        }
        if (inlineText) body.push(this.statement({ text: inlineText, line: BL.line }));
        body = body.concat(this.block(['CASELABEL', 'OTHERWISE', 'ENDCASE'], { word: 'CASE OF', line: line, need: 'ENDCASE' }));
        if (t === 'OTHERWISE') {
          if (cnode.other) throw new CieError('A CASE can only have one OTHERWISE.', BL.line);
          cnode.other = body;
        } else {
          if (cnode.other) throw new CieError('OTHERWISE goes last in a CASE.', BL.line);
          var lm2 = CASE_LABEL.exec(BL.text);
          cnode.branches.push({ line: BL.line, lo: parseExpr(lm2[1], BL.line), hi: lm2[2] ? parseExpr(lm2[2], BL.line) : null, body: body });
        }
      }
      return cnode;
    }
    if (w === 'FOR') {
      m = /^FOR\s+([A-Za-z_]\w*)\s*<-\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/.exec(text);
      if (!m) throw new CieError('A FOR loop looks like this: FOR Count <- 1 TO 10', line);
      var fnode = { k: 'for', line: line, v: m[1], from: parseExpr(m[2], line), to: parseExpr(m[3], line), step: m[4] ? parseExpr(m[4], line) : null };
      fnode.body = this.block(['NEXT'], { word: 'FOR', line: line });
      var NL = this.peek(); this.i++;
      var nm = /^NEXT(?:\s+([A-Za-z_]\w*))?$/.exec(NL.text);
      if (!nm) throw new CieError('Close a FOR loop with NEXT ' + fnode.v, NL.line);
      if (nm[1] && nm[1] !== fnode.v) throw new CieError('NEXT ' + nm[1] + ' does not match FOR ' + fnode.v + ' (line ' + line + ').', NL.line);
      return fnode;
    }
    if (w === 'WHILE') {
      m = /^WHILE\s+(.+?)\s+DO$/.exec(text);
      if (!m) throw new CieError('A WHILE loop looks like this: WHILE Lives > 0 DO', line);
      var wnode = { k: 'while', line: line, cond: parseExpr(m[1], line) };
      wnode.body = this.block(['ENDWHILE'], { word: 'WHILE', line: line });
      if (this.peek().text !== 'ENDWHILE') throw new CieError('Put ENDWHILE on a line by itself.', this.peek().line);
      this.i++;
      return wnode;
    }
    if (w === 'REPEAT') {
      if (text !== 'REPEAT') throw new CieError('REPEAT goes on a line by itself. The condition goes at the end, after UNTIL.', line);
      var rnode = { k: 'repeat', line: line };
      rnode.body = this.block(['UNTIL'], { word: 'REPEAT', line: line });
      var UL = this.peek(); this.i++;
      var um = /^UNTIL\s+(.+)$/.exec(UL.text);
      if (!um) throw new CieError('UNTIL needs a condition, e.g. UNTIL Lives = 0', UL.line);
      rnode.until = parseExpr(um[1], UL.line);
      rnode.untilLine = UL.line;
      return rnode;
    }
    if (w === 'PROCEDURE' || w === 'FUNCTION') {
      var isFn = w === 'FUNCTION';
      m = isFn
        ? /^FUNCTION\s+([A-Za-z_]\w*)\s*(?:\((.*)\))?\s+RETURNS\s+(\w+)$/.exec(text)
        : /^PROCEDURE\s+([A-Za-z_]\w*)\s*(?:\((.*)\))?$/.exec(text);
      if (!m) throw new CieError(isFn ? 'A FUNCTION starts like this: FUNCTION Double(N : INTEGER) RETURNS INTEGER' : 'A PROCEDURE starts like this: PROCEDURE GameStart()', line);
      if (isFn && !TYPES.hasOwnProperty(m[3])) throw new CieError('"' + m[3] + '" is not a data type. Use INTEGER, REAL, STRING, CHAR or BOOLEAN.', line);
      var pnode = { k: 'proc', line: line, isFn: isFn, name: m[1], params: parseParams(m[2], line), returns: isFn ? m[3] : null };
      var closer = isFn ? 'ENDFUNCTION' : 'ENDPROCEDURE';
      pnode.body = this.block([closer], { word: w, line: line });
      if (this.peek().text !== closer) throw new CieError('Put ' + closer + ' on a line by itself.', this.peek().line);
      this.i++;
      return pnode;
    }
    if (w === 'CALL') {
      m = /^CALL\s+([A-Za-z_]\w*)\s*(?:\((.*)\))?$/.exec(text);
      if (!m) throw new CieError('CALL needs a procedure name and brackets, e.g. CALL MoveSteps(10)', line);
      return { k: 'call', line: line, name: m[1], args: m[2] && m[2].trim() ? splitTop(m[2]).map(function (s) { return parseExpr(s, line); }) : [] };
    }
    if (w === 'RETURN') {
      m = /^RETURN\s+(.+)$/.exec(text);
      if (!m) throw new CieError('RETURN needs a value, e.g. RETURN Total', line);
      return { k: 'return', line: line, e: parseExpr(m[1], line) };
    }
    if (w === 'OUTPUT') {
      m = /^OUTPUT\s+(.+)$/.exec(text);
      if (!m) throw new CieError('OUTPUT needs something to show, e.g. OUTPUT Score', line);
      return { k: 'output', line: line, es: splitTop(m[1]).map(function (s) {
        if (!s) throw new CieError('There is an extra comma in this OUTPUT line.', line);
        return parseExpr(s, line);
      }) };
    }
    if (w === 'INPUT') {
      m = /^INPUT\s+(.+)$/.exec(text);
      if (!m) throw new CieError('INPUT needs a variable to store the value in, e.g. INPUT Name', line);
      if (/^"/.test(m[1].trim())) throw new CieError('Put the message in its own OUTPUT line before INPUT. INPUT is followed only by a variable.', line);
      var target = parseExpr(m[1], line);
      if (target.k !== 'var' && target.k !== 'idx') throw new CieError('INPUT must be followed by one variable, e.g. INPUT Name', line);
      return { k: 'input', line: line, target: target };
    }
    if (MISTAKES[w.toUpperCase()] && !/^\w+\s*(<-|\[)/.test(text)) throw new CieError(MISTAKES[w.toUpperCase()], line);

    var arrow = topArrow(text);
    if (arrow !== -1) {
      var left = text.slice(0, arrow).trim(), right = text.slice(arrow + 2).trim();
      if (!right) throw new CieError('Put a value after <-, e.g. Score <- 0', line);
      var tgt = parseExpr(left, line);
      if (tgt.k !== 'var' && tgt.k !== 'idx') throw new CieError('The left of <- must be a variable or an array element.', line);
      return { k: 'assign', line: line, target: tgt, e: parseExpr(right, line) };
    }
    if (/^[A-Za-z_]\w*(\s*\[.*\])?\s*=[^=]/.test(text)) {
      var eq = text.indexOf('=');
      throw new CieError('Use <- to store a value, not =: ' + text.slice(0, eq).trim() + ' <- ' + text.slice(eq + 1).trim(), line);
    }
    m = /^([A-Za-z_]\w*)\s*\((.*)\)$/.exec(text) || /^([A-Za-z_]\w*)$/.exec(text);
    if (m) {
      var known = API_BY_NAME[m[1]] || PY_TO_API[looseKey(m[1])];
      if (known) throw new CieError('Procedures need CALL in front: CALL ' + (API_BY_NAME[m[1]] ? m[1] : known) + '(' + (m[2] || '') + ')', line);
      throw new CieError('Procedures need CALL in front: CALL ' + text, line);
    }
    throw new CieError('I can\'t understand this line: "' + text + '"', line);
  };

  // ── Python output ───────────────────────────────────────────────
  var PY_RESERVED = {};
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield print len str int float range list'.split(' ')
    .forEach(function (k) { PY_RESERVED[k] = true; });

  function V(name) { return 'v_' + name; }
  function P(name) { return 'p_' + name; }
  function pyStr(s) { return JSON.stringify(s); }

  function Emitter() {
    this.out = [];
    this.errors = [];
    this.procs = {};     // user PROCEDUREs and FUNCTIONs by name
    this.globals = {};   // top-level variables: name -> { type, elem, dims, constant }
    this.caseN = 0;
  }
  Emitter.prototype.push = function (depth, text, src) {
    this.out.push({ text: new Array(depth * 4 + 1).join(' ') + text, src: src || 0 });
  };

  // Edit distance, for "did you mean" on a near-miss name such as MoveStep.
  function distance(a, b) {
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  function suggestName(name) {
    var hit = PY_TO_API[looseKey(name)];
    if (!hit) {
      var key = looseKey(name), best = null, bestD = 3;
      Object.keys(API_BY_NAME).concat(Object.keys(EVENTS)).forEach(function (n) {
        var d = distance(key, n.toLowerCase());
        if (d < bestD) { bestD = d; best = n; }
      });
      if (best && key.length > 3) hit = best;
    }
    return hit && hit !== name ? ' Did you mean ' + hit + '?' : '';
  }

  // Scope: { vars: {name: info}, parent, proc }
  function lookup(scope, name) {
    for (var s = scope; s; s = s.parent) if (s.vars.hasOwnProperty(name)) return s.vars[name];
    return null;
  }

  Emitter.prototype.expr = function (e, scope, line) {
    var self = this;
    switch (e.k) {
      case 'num': return e.v;
      case 'str': return pyStr(e.v);
      case 'bool': return e.v ? 'True' : 'False';
      case 'neg': return '(-' + this.expr(e.e, scope, line) + ')';
      case 'not': return '(not ' + this.expr(e.e, scope, line) + ')';
      case 'var': {
        var info = lookup(scope, e.name);
        if (!info) {
          if (this.procs[e.name] || API_BY_NAME[e.name] || BUILTINS[e.name]) throw new CieError(e.name + ' needs brackets: ' + e.name + '()', line);
          throw new CieError(e.name + ' has not been declared. Add a line such as: DECLARE ' + e.name + ' : INTEGER' + suggestName(e.name), line);
        }
        if (info.kind === 'ARRAY') throw new CieError(e.name + ' is an array: say which element, e.g. ' + e.name + '[1]', line);
        return V(e.name);
      }
      case 'idx': {
        var ai = lookup(scope, e.name);
        if (!ai) throw new CieError(e.name + ' has not been declared. Add a line such as: DECLARE ' + e.name + ' : ARRAY[1:10] OF INTEGER', line);
        if (ai.kind !== 'ARRAY') throw new CieError(e.name + ' is not an array, so it can\'t have [ ].', line);
        if (e.idx.length !== ai.dims) throw new CieError(e.name + ' has ' + ai.dims + (ai.dims === 1 ? ' dimension' : ' dimensions') + ': write ' + e.name + (ai.dims === 1 ? '[1]' : '[1, 1]'), line);
        return V(e.name) + '[' + (e.idx.length === 1 ? this.expr(e.idx[0], scope, line) : '(' + e.idx.map(function (x) { return self.expr(x, scope, line); }).join(', ') + ')') + ']';
      }
      case 'call': {
        var args = e.args.map(function (a) { return self.expr(a, scope, line); });
        if (BUILTINS[e.name]) {
          checkArgs(e.name, args.length, BUILTINS[e.name].a, line);
          return BUILTINS[e.name].py + '(' + args.join(', ') + ')';
        }
        if (this.procs[e.name]) {
          var up = this.procs[e.name];
          if (!up.isFn) throw new CieError(e.name + ' is a PROCEDURE, so use it on its own line with CALL ' + e.name + '(...)', line);
          checkArgs(e.name, args.length, [up.params.length, up.params.length], line);
          return P(e.name) + '(' + args.join(', ') + ')';
        }
        var api = API_BY_NAME[e.name];
        if (api) {
          if (api.k !== 'func') throw new CieError(e.name + ' does not give back a value. Use it on its own line: CALL ' + e.name + '(...)', line);
          checkArgs(e.name, args.length, api.a, line);
          return e.name + '(' + args.join(', ') + ')';
        }
        if (BUILTINS[e.name.toUpperCase()]) throw new CieError('Library routines are written in capitals: ' + e.name.toUpperCase() + '(...)', line);
        throw new CieError('"' + e.name + '" is not a function I know.' + suggestName(e.name), line);
      }
      case 'bin': {
        var l = this.expr(e.l, scope, line), r = this.expr(e.r, scope, line);
        switch (e.op) {
          case 'OR': return '(' + l + ' or ' + r + ')';
          case 'AND': return '(' + l + ' and ' + r + ')';
          case '=': return '(' + l + ' == ' + r + ')';
          case '<>': return '(' + l + ' != ' + r + ')';
          case '&': return '_ps_cat(' + l + ', ' + r + ')';
          case 'MOD': return '_ps_mod(' + l + ', ' + r + ')';
          case 'DIV': return '_ps_div(' + l + ', ' + r + ')';
          case '^': return '(' + l + ' ** ' + r + ')';
          case '+': return '_ps_add(' + l + ', ' + r + ', ' + line + ')';
          case '<': case '>': case '<=': case '>=':
            return '_ps_cmp(' + l + ', ' + r + ', ' + pyStr(e.op) + ', ' + line + ')';
          default: return '(' + l + ' ' + e.op + ' ' + r + ')';
        }
      }
    }
    throw new CieError('I can\'t understand this expression.', line);
  };

  function checkArgs(name, got, range, line) {
    if (got < range[0] || got > range[1]) {
      var want = range[0] === range[1] ? String(range[0]) : range[0] + ' or ' + range[1];
      throw new CieError(name + ' needs ' + want + (want === '1' ? ' value' : ' values') + ' in its brackets, not ' + got + '.', line);
    }
  }

  // Names a block of statements stores into (for Python's global lines).
  function assignedNames(stmts, set) {
    stmts.forEach(function (s) {
      if (s.k === 'assign' || s.k === 'input') set[s.target.name] = true;
      if (s.k === 'for') set[s.v] = true;
      ['then', 'els', 'body', 'other'].forEach(function (key) { if (Array.isArray(s[key])) assignedNames(s[key], set); });
      if (s.elifs) s.elifs.forEach(function (b) { assignedNames(b.body, set); });
      if (s.branches) s.branches.forEach(function (b) { assignedNames(b.body, set); });
    });
    return set;
  }
  function declaredNames(stmts, set) {
    stmts.forEach(function (s) {
      if (s.k === 'declare') s.names.forEach(function (n) { set[n] = true; });
      if (s.k === 'constant') set[s.name] = true;
      ['then', 'els', 'body', 'other'].forEach(function (key) { if (Array.isArray(s[key])) declaredNames(s[key], set); });
      if (s.elifs) s.elifs.forEach(function (b) { declaredNames(b.body, set); });
      if (s.branches) s.branches.forEach(function (b) { declaredNames(b.body, set); });
    });
    return set;
  }

  Emitter.prototype.declare = function (s, scope, depth) {
    var self = this;
    s.names.forEach(function (n) {
      if (scope.vars.hasOwnProperty(n)) throw new CieError(n + ' has already been declared.', s.line);
      if (self.procs[n] || API_BY_NAME[n] || EVENTS[n]) throw new CieError(n + ' is already the name of a procedure. Choose another name.', s.line);
      if (KW_SET[n] || KW_SET[n.toUpperCase()]) throw new CieError(n + ' is a keyword, so it can\'t be a variable name.', s.line);
      if (s.type.kind === 'ARRAY') {
        var d = s.type.dims.map(function (dim) { return self.expr(dim.lo, scope, s.line) + ', ' + self.expr(dim.hi, scope, s.line); });
        scope.vars[n] = { kind: 'ARRAY', elem: s.type.elem, dims: s.type.dims.length };
        self.push(depth, V(n) + ' = _PsArray(' + pyStr(n) + ', ' + d[0] + ', ' + (d[1] || 'None, None') + ', ' + TYPES[s.type.elem] + ', ' + s.line + ')', s.line);
      } else {
        scope.vars[n] = { kind: s.type.kind };
        self.push(depth, V(n) + ' = ' + TYPES[s.type.kind], s.line);
      }
    });
  };

  Emitter.prototype.store = function (target, valuePy, scope, line) {
    var info = lookup(scope, target.name);
    if (!info) throw new CieError(target.name + ' has not been declared. Add a line such as: DECLARE ' + target.name + ' : INTEGER' + suggestName(target.name), line);
    if (info.constant) throw new CieError(target.name + ' is a CONSTANT, so its value can\'t be changed.', line);
    if (target.k === 'var') {
      if (info.kind === 'ARRAY') throw new CieError(target.name + ' is an array: say which element, e.g. ' + target.name + '[1] <- ...', line);
      return V(target.name) + ' = _ps_chk(' + valuePy + ', ' + pyStr(info.kind) + ', ' + pyStr(target.name) + ', ' + line + ')';
    }
    var ref = this.expr(target, scope, line);
    return ref + ' = _ps_chk(' + valuePy + ', ' + pyStr(info.elem) + ', ' + pyStr(target.name + '[...]') + ', ' + line + ')';
  };

  Emitter.prototype.typeOf = function (target, scope) {
    var info = lookup(scope, target.name);
    if (!info) return 'STRING';
    return target.k === 'idx' ? info.elem : info.kind;
  };

  Emitter.prototype.stmts = function (list, scope, depth) {
    var start = this.out.length;
    for (var i = 0; i < list.length; i++) this.stmt(list[i], scope, depth);
    if (this.out.length === start) this.push(depth, 'pass', 0);
  };

  Emitter.prototype.stmt = function (s, scope, depth) {
    var self = this, line = s.line;
    switch (s.k) {
      case 'declare': this.declare(s, scope, depth); return;
      case 'constant':
        if (scope.vars.hasOwnProperty(s.name)) throw new CieError(s.name + ' has already been declared.', line);
        scope.vars[s.name] = { kind: s.e.k === 'str' ? 'STRING' : s.e.k === 'bool' ? 'BOOLEAN' : 'REAL', constant: true };
        this.push(depth, V(s.name) + ' = ' + this.expr(s.e, scope, line), line);
        return;
      case 'assign':
        this.push(depth, this.store(s.target, this.expr(s.e, scope, line), scope, line), line);
        return;
      case 'input':
        this.push(depth, this.store(s.target, '_ps_input(' + pyStr(this.typeOf(s.target, scope)) + ', ' + pyStr(s.target.name) + ', ' + line + ')', scope, line), line);
        return;
      case 'output':
        this.push(depth, '_ps_output([' + s.es.map(function (e) { return self.expr(e, scope, line); }).join(', ') + '])', line);
        return;
      case 'if':
        this.push(depth, 'if _ps_bool(' + this.expr(s.cond, scope, line) + ', ' + line + '):', line);
        this.stmts(s.then, scope, depth + 1);
        s.elifs.forEach(function (b) {
          self.push(depth, 'elif _ps_bool(' + self.expr(b.cond, scope, b.line) + ', ' + b.line + '):', b.line);
          self.stmts(b.body, scope, depth + 1);
        });
        if (s.els) { this.push(depth, 'else:', line); this.stmts(s.els, scope, depth + 1); }
        return;
      case 'case': {
        var tmp = '_ps_case' + (++this.caseN);
        this.push(depth, tmp + ' = ' + this.expr(s.e, scope, line), line);
        if (!s.branches.length && !s.other) return;
        s.branches.forEach(function (b, i) {
          var test = b.hi
            ? '_ps_cmp(' + self.expr(b.lo, scope, b.line) + ', ' + tmp + ', "<=", ' + b.line + ') and _ps_cmp(' + tmp + ', ' + self.expr(b.hi, scope, b.line) + ', "<=", ' + b.line + ')'
            : tmp + ' == ' + self.expr(b.lo, scope, b.line);
          self.push(depth, (i === 0 ? 'if ' : 'elif ') + test + ':', b.line);
          self.stmts(b.body, scope, depth + 1);
        });
        if (s.other) {
          if (s.branches.length) { this.push(depth, 'else:', line); this.stmts(s.other, scope, depth + 1); }
          else this.stmts(s.other, scope, depth);
        }
        return;
      }
      case 'for': {
        var fi = lookup(scope, s.v);
        if (!fi) throw new CieError(s.v + ' has not been declared. Add a line such as: DECLARE ' + s.v + ' : INTEGER', line);
        if (fi.kind !== 'INTEGER') throw new CieError('The FOR loop counter ' + s.v + ' must be declared as an INTEGER.', line);
        this.push(depth, 'for ' + V(s.v) + ' in _ps_range(' + this.expr(s.from, scope, line) + ', ' + this.expr(s.to, scope, line) + ', ' +
          (s.step ? this.expr(s.step, scope, line) : '1') + ', ' + pyStr(s.v) + ', ' + line + '):', line);
        this.stmts(s.body, scope, depth + 1);
        return;
      }
      case 'while':
        // WHILE TRUE DO is a forever loop: one pass per frame, like Python's while True.
        if (s.cond.k === 'bool' && s.cond.v === true) this.push(depth, 'while True:', line);
        else this.push(depth, 'while _ps_bool(' + this.expr(s.cond, scope, line) + ', ' + line + '):', line);
        this.stmts(s.body, scope, depth + 1);
        return;
      case 'repeat':
        // "while 1" (not "while True") so it runs at full speed until something visible changes.
        this.push(depth, 'while 1:', line);
        this.stmts(s.body, scope, depth + 1);
        this.push(depth + 1, 'if _ps_bool(' + this.expr(s.until, scope, s.untilLine) + ', ' + s.untilLine + '):', s.untilLine);
        this.push(depth + 2, 'break', s.untilLine);
        return;
      case 'call': {
        var args = s.args.map(function (a) { return self.expr(a, scope, line); });
        if (this.procs[s.name]) {
          var up = this.procs[s.name];
          if (up.isFn) throw new CieError(s.name + ' is a FUNCTION, so use its result, e.g. Total <- ' + s.name + '(...)', line);
          checkArgs(s.name, args.length, [up.params.length, up.params.length], line);
          this.push(depth, P(s.name) + '(' + args.join(', ') + ')', line);
          return;
        }
        if (EVENTS[s.name]) {
          throw new CieError(s.name + ' has not been written yet. Add PROCEDURE ' + s.name + '() ... ENDPROCEDURE first.', line);
        }
        var api = API_BY_NAME[s.name];
        if (!api) throw new CieError('"' + s.name + '" is not a procedure I know.' + suggestName(s.name), line);
        if (api.k === 'func') throw new CieError(s.name + ' gives back a value, so use it in an expression, e.g. IF ' + s.name + '(...) THEN', line);
        checkArgs(s.name, args.length, api.a, line);
        this.push(depth, s.name + '(' + args.join(', ') + ')', line);
        return;
      }
      case 'return': {
        var proc = scope.proc;
        if (!proc || !proc.isFn) throw new CieError('RETURN can only be used inside a FUNCTION.', line);
        this.push(depth, 'return _ps_chk(' + this.expr(s.e, scope, line) + ', ' + pyStr(proc.returns) + ', ' + pyStr(proc.name) + ', ' + line + ')', line);
        return;
      }
      case 'proc':
        throw new CieError('A ' + (s.isFn ? 'FUNCTION' : 'PROCEDURE') + ' can\'t go inside another block. Move it out to the left edge.', line);
    }
  };

  Emitter.prototype.proc = function (p, globalScope) {
    var self = this;
    var scope = { vars: {}, parent: globalScope, proc: p };
    var names = p.params.map(function (x) {
      if (scope.vars.hasOwnProperty(x.name)) throw new CieError('Two parameters are both called ' + x.name + '.', p.line);
      scope.vars[x.name] = { kind: x.type };
      return V(x.name);
    });
    this.push(0, 'def ' + P(p.name) + '(' + names.join(', ') + '):', p.line);
    var locals = declaredNames(p.body, {});
    p.params.forEach(function (x) { locals[x.name] = true; });
    var g = Object.keys(assignedNames(p.body, {})).filter(function (n) {
      return !locals[n] && self.globals.hasOwnProperty(n);
    });
    if (g.length) this.push(1, 'global ' + g.map(V).join(', '), 0);
    p.params.forEach(function (x) {
      self.push(1, V(x.name) + ' = _ps_chk(' + V(x.name) + ', ' + pyStr(x.type) + ', ' + pyStr(x.name) + ', ' + p.line + ')', p.line);
    });
    this.stmts(p.body, scope, 1);
    this.push(0, '', 0);
  };

  function transpile(source) {
    var em = new Emitter();
    var raw = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    var lines = [];
    raw.forEach(function (t, i) {
      var text = normalise(stripComment(t)).trim();
      if (text) lines.push({ text: text, line: i + 1 });
    });
    var tree;
    try {
      tree = new StmtParser(lines).block(null);
    } catch (e) {
      if (!(e instanceof CieError)) throw e;
      return { python: [], errors: [{ line: e.line, message: e.message }] };
    }

    try {
      // Procedures and functions first, so they can be called from anywhere.
      tree.forEach(function (s) {
        if (s.k !== 'proc') return;
        if (em.procs[s.name]) throw new CieError('There are two procedures called ' + s.name + '.', s.line);
        if (API_BY_NAME[s.name]) throw new CieError(s.name + ' is already a PyScratch ' + (API_BY_NAME[s.name].k === 'func' ? 'function' : 'procedure') + '. Choose another name.', s.line);
        if (BUILTINS[s.name]) throw new CieError(s.name + ' is already a library routine. Choose another name.', s.line);
        var ev = EVENTS[s.name];
        if (!ev) {
          var loose = PY_TO_API[looseKey(s.name)];
          if (loose && EVENTS[loose]) throw new CieError('This event procedure is written ' + loose + '.', s.line);
        }
        if (ev) {
          if (s.isFn) throw new CieError(s.name + ' must be a PROCEDURE, not a FUNCTION.', s.line);
          if (s.params.length !== ev.params) throw new CieError(ev.params ? 'Write it as PROCEDURE ' + s.name + '(' + ev.sig + ')' : s.name + ' has no parameters: PROCEDURE ' + s.name + '()', s.line);
        }
        em.procs[s.name] = s;
      });
      // A procedure spelt nearly like an event (GameStrat) would never run.
      var called = {};
      (function walk(list) {
        list.forEach(function (st) {
          if (st.k === 'call') called[st.name] = true;
          ['then', 'els', 'body', 'other'].forEach(function (key) { if (Array.isArray(st[key])) walk(st[key]); });
          if (st.elifs) st.elifs.forEach(function (b) { walk(b.body); });
          if (st.branches) st.branches.forEach(function (b) { walk(b.body); });
        });
      })(tree);
      Object.keys(em.procs).forEach(function (n) {
        if (EVENTS[n] || called[n]) return;
        Object.keys(EVENTS).forEach(function (e) {
          if (distance(n.toLowerCase(), e.toLowerCase()) <= 2) {
            throw new CieError(n + ' is never run. If you meant the event procedure, it is spelt ' + e + '.', em.procs[n].line);
          }
        });
      });
      var globalScope = { vars: {}, parent: null, proc: null };
      // Top-level variables are global: declared first, then set up at module level.
      tree.forEach(function (s) {
        if (s.k === 'declare') s.names.forEach(function (n) { em.globals[n] = true; });
        if (s.k === 'constant') em.globals[s.name] = true;
      });
      var main = [];
      tree.forEach(function (s) {
        if (s.k === 'declare' || s.k === 'constant') em.stmt(s, globalScope, 0);
        else if (s.k !== 'proc') main.push(s);
      });
      tree.forEach(function (s) { if (s.k === 'proc') em.proc(s, globalScope); });
      if (main.length) {
        em.push(0, 'def _ps_main():', main[0].line);
        var mainLocals = declaredNames(main, {});
        var g = Object.keys(assignedNames(main, {})).filter(function (n) { return em.globals.hasOwnProperty(n) && !mainLocals[n]; });
        if (g.length) em.push(1, 'global ' + g.map(V).join(', '), 0);
        em.stmts(main, { vars: {}, parent: globalScope, proc: null }, 1);
        em.push(0, '', 0);
      }
      Object.keys(EVENTS).forEach(function (n) {
        if (em.procs[n]) em.push(0, EVENTS[n].py + ' = ' + P(n), 0);
      });
    } catch (e2) {
      if (!(e2 instanceof CieError)) throw e2;
      return { python: [], errors: [{ line: e2.line, message: e2.message }] };
    }
    return { python: em.out, errors: [], hasMain: em.out.some(function (l) { return l.text === 'def _ps_main():'; }) };
  }

  // ── Python run alongside the student's code ─────────────────────
  // Uses the Python prologue's snake_case commands (move_steps, say, ...).
  function prologue() {
    var lines = [
      'def _ps_err(line, msg):',
      '    raise Exception("Line " + str(line) + ": " + msg)',
      'def _ps_str(v):',
      '    if isinstance(v, bool): return "TRUE" if v else "FALSE"',
      '    if isinstance(v, float):',
      '        if v == int(v) and abs(v) < 1e15: return str(int(v))',
      '        return str(round(v, 10))',
      '    return str(v)',
      'def _ps_desc(v):',
      '    if isinstance(v, bool): return "a BOOLEAN (" + _ps_str(v) + ")"',
      '    if isinstance(v, int): return "an INTEGER (" + str(v) + ")"',
      '    if isinstance(v, float): return "a REAL (" + _ps_str(v) + ")"',
      '    if isinstance(v, str): return ("a CHAR" if len(v) == 1 else "a STRING") + " (\\"" + v + "\\")"',
      '    return "nothing"',
      'def _ps_chk(v, t, name, line):',
      '    if t == "INTEGER":',
      '        if isinstance(v, bool): pass',
      '        elif isinstance(v, int): return v',
      '        elif isinstance(v, float):',
      '            if v == int(v): return int(v)',
      '            _ps_err(line, name + " is an INTEGER and cannot hold " + _ps_str(v) + ". Declare it as REAL, or use DIV or ROUND to make a whole number.")',
      '    elif t == "REAL":',
      '        if isinstance(v, bool): pass',
      '        elif isinstance(v, int) or isinstance(v, float): return v',
      '    elif t == "STRING":',
      '        if isinstance(v, str): return v',
      '    elif t == "CHAR":',
      '        if isinstance(v, str) and len(v) == 1: return v',
      '    elif t == "BOOLEAN":',
      '        if isinstance(v, bool): return v',
      '    else:',
      '        return v',
      '    _ps_err(line, name + " is declared as " + t + " but you tried to store " + _ps_desc(v) + " in it.")',
      'def _ps_bool(v, line):',
      '    if not isinstance(v, bool): _ps_err(line, "A condition must be TRUE or FALSE, but this one gave " + _ps_desc(v) + ". Did you mean to compare, e.g. X = 1?")',
      '    return v',
      'def _ps_num(v, line, what):',
      '    if isinstance(v, bool) or not (isinstance(v, int) or isinstance(v, float)): _ps_err(line, what + " needs numbers, but got " + _ps_desc(v) + ".")',
      'def _ps_add(a, b, line):',
      '    if isinstance(a, str) or isinstance(b, str):',
      '        if isinstance(a, str) and isinstance(b, str): return a + b',
      '        _ps_err(line, "+ adds numbers. To join text and a number use &, e.g. \\"Score: \\" & Score")',
      '    _ps_num(a, line, "+"); _ps_num(b, line, "+")',
      '    return a + b',
      'def _ps_cmp(a, b, op, line):',
      '    an = (isinstance(a, int) or isinstance(a, float)) and not isinstance(a, bool)',
      '    bn = (isinstance(b, int) or isinstance(b, float)) and not isinstance(b, bool)',
      '    if not ((an and bn) or (isinstance(a, str) and isinstance(b, str))): _ps_err(line, op + " compares numbers with numbers or text with text, but this compares " + _ps_desc(a) + " with " + _ps_desc(b) + ".")',
      '    if op == "<": return a < b',
      '    if op == ">": return a > b',
      '    if op == "<=": return a <= b',
      '    return a >= b',
      'def _ps_cat(a, b): return _ps_str(a) + _ps_str(b)',
      'def _ps_div(a, b):',
      '    if b == 0: raise Exception("You can\'t DIV by zero.")',
      '    return int(a / b)',
      'def _ps_mod(a, b):',
      '    if b == 0: raise Exception("You can\'t MOD by zero.")',
      '    return a - b * int(a / b)',
      'def _ps_length(s):',
      '    if not isinstance(s, str): raise Exception("LENGTH needs a STRING, but got " + _ps_desc(s) + ".")',
      '    return len(s)',
      'def _ps_lcase(s):',
      '    if not isinstance(s, str): raise Exception("LCASE needs a STRING or CHAR, but got " + _ps_desc(s) + ".")',
      '    return s.lower()',
      'def _ps_ucase(s):',
      '    if not isinstance(s, str): raise Exception("UCASE needs a STRING or CHAR, but got " + _ps_desc(s) + ".")',
      '    return s.upper()',
      'def _ps_substring(s, start, length):',
      '    if not isinstance(s, str): raise Exception("SUBSTRING needs a STRING first, but got " + _ps_desc(s) + ".")',
      '    if start < 1 or start > len(s): raise Exception("SUBSTRING start position " + str(start) + " is outside the text. The first character is position 1.")',
      '    return s[start - 1:start - 1 + length]',
      'def _ps_round(n, places):',
      '    f = 10 ** places',
      '    r = int(abs(n) * f + 0.5) / f',
      '    if n < 0: r = -r',
      '    if places == 0: return int(r)',
      '    return r',
      'def _ps_random(): return pick_random(0, 999999) / 1000000',
      'def _ps_int(n): return int(n)',
      'def _ps_range(a, b, step, name, line):',
      '    for v in [a, b, step]:',
      '        if isinstance(v, bool) or not isinstance(v, int): _ps_err(line, "FOR " + name + " needs whole numbers, but got " + _ps_desc(v) + ".")',
      '    if step == 0: _ps_err(line, "STEP can\'t be 0.")',
      '    if step > 0: return range(a, b + 1, step)',
      '    return range(a, b - 1, step)',
      'def _ps_output(parts):',
      '    print("".join([_ps_str(p) for p in parts]))',
      'def _ps_input(t, name, line):',
      '    ask("Type a value for " + name)',
      '    s = answer()',
      '    if t == "INTEGER":',
      '        try: return int(s)',
      '        except: _ps_err(line, name + " is an INTEGER, so type a whole number (you typed \\"" + s + "\\").")',
      '    if t == "REAL":',
      '        try: return float(s)',
      '        except: _ps_err(line, name + " is a REAL, so type a number (you typed \\"" + s + "\\").")',
      '    if t == "BOOLEAN":',
      '        if s.upper() == "TRUE": return True',
      '        if s.upper() == "FALSE": return False',
      '        _ps_err(line, name + " is a BOOLEAN, so type TRUE or FALSE.")',
      '    return s',
      'class _PsArray:',
      '    def __init__(self, name, lo, hi, lo2, hi2, default, line):',
      '        for v in [lo, hi]:',
      '            if isinstance(v, bool) or not isinstance(v, int): _ps_err(line, "Array bounds must be whole numbers.")',
      '        if hi < lo: _ps_err(line, "The upper bound of " + name + " is below its lower bound.")',
      '        self.name = name',
      '        self.lo = lo',
      '        self.hi = hi',
      '        self.lo2 = lo2',
      '        self.hi2 = hi2',
      '        if lo2 is None:',
      '            self.data = [default] * (hi - lo + 1)',
      '        else:',
      '            self.data = [[default] * (hi2 - lo2 + 1) for i in range(hi - lo + 1)]',
      '    def _at(self, k, lo, hi):',
      '        if isinstance(k, bool) or not isinstance(k, int): raise Exception("An array index must be a whole number, but got " + _ps_desc(k) + ".")',
      '        if k < lo or k > hi: raise Exception("Index " + str(k) + " is outside the bounds of " + self.name + " (" + str(lo) + " to " + str(hi) + ").")',
      '        return k - lo',
      '    def __getitem__(self, k):',
      '        if self.lo2 is None: return self.data[self._at(k, self.lo, self.hi)]',
      '        return self.data[self._at(k[0], self.lo, self.hi)][self._at(k[1], self.lo2, self.hi2)]',
      '    def __setitem__(self, k, v):',
      '        if self.lo2 is None:',
      '            self.data[self._at(k, self.lo, self.hi)] = v',
      '        else:',
      '            self.data[self._at(k[0], self.lo, self.hi)][self._at(k[1], self.lo2, self.hi2)] = v'
    ];
    API.forEach(function (a) {
      var params = [];
      for (var i = 0; i < a.a[1]; i++) params.push('a' + i + (i >= a.a[0] ? '=None' : ''));
      var callArgs = params.map(function (p) { return p.split('=')[0]; });
      if (a.str) callArgs[0] = '_ps_str(' + callArgs[0] + ')';
      if (a.n === 'DisplayVariable') {
        lines.push('def DisplayVariable(a0, a1=True): return _psc("display_variable", a0, a1, "v_" + str(a0))');
        return;
      }
      if (a.a[1] > a.a[0]) {
        // Optional value: only pass it on when given.
        lines.push('def ' + a.n + '(' + params.join(', ') + '):');
        lines.push('    if a' + (a.a[1] - 1) + ' is None: return ' + a.py + '(' + callArgs.slice(0, a.a[0]).join(', ') + ')');
        lines.push('    return ' + a.py + '(' + callArgs.join(', ') + ')');
        return;
      }
      lines.push('def ' + a.n + '(' + params.join(', ') + '): return ' + a.py + '(' + callArgs.join(', ') + ')');
    });
    return lines.join('\n') + '\n';
  }

  // ── Editor help ─────────────────────────────────────────────────
  var DEFAULT_CODE = 'PROCEDURE GameStart()\n    CALL Say("Hello!")\nENDPROCEDURE\n';

  var COMPLETIONS = [];
  ['CONSTANT', 'INTEGER', 'REAL', 'STRING', 'CHAR', 'BOOLEAN', 'ARRAY', 'THEN', 'ELSE', 'ENDIF', 'OTHERWISE', 'ENDCASE',
    'NEXT', 'STEP', 'ENDWHILE', 'UNTIL', 'ENDPROCEDURE', 'ENDFUNCTION', 'RETURNS', 'RETURN', 'CALL', 'INPUT', 'OUTPUT', 'TRUE', 'FALSE']
    .forEach(function (k) { COMPLETIONS.push({ t: k, ins: k + ' ', detail: 'Keyword', kind: 'kw' }); });
  // In ins, | marks where the cursor goes; later lines are indented to match.
  COMPLETIONS.push(
    { t: 'DECLARE', ins: 'DECLARE | : INTEGER', detail: 'Make a variable', kind: 'sn' },
    { t: 'IF', ins: 'IF | THEN\n    \nENDIF', detail: 'IF ... THEN ... ENDIF', kind: 'sn' },
    { t: 'WHILE', ins: 'WHILE | DO\n    \nENDWHILE', detail: 'WHILE ... DO ... ENDWHILE', kind: 'sn' },
    { t: 'REPEAT', ins: 'REPEAT\n    |\nUNTIL ', detail: 'REPEAT ... UNTIL', kind: 'sn' },
    { t: 'FOR', ins: 'FOR Count <- 1 TO 10\n    |\nNEXT Count', detail: 'FOR ... NEXT', kind: 'sn' },
    { t: 'CASE', ins: 'CASE OF |\n    1 : \n    OTHERWISE : \nENDCASE', detail: 'CASE OF ... ENDCASE', kind: 'sn' },
    { t: 'PROCEDURE', ins: 'PROCEDURE |()\n    \nENDPROCEDURE', detail: 'PROCEDURE ... ENDPROCEDURE', kind: 'sn' },
    { t: 'FUNCTION', ins: 'FUNCTION |() RETURNS INTEGER\n    RETURN 0\nENDFUNCTION', detail: 'FUNCTION ... RETURNS ... ENDFUNCTION', kind: 'sn' }
  );
  Object.keys(EVENTS).forEach(function (n) {
    var ev = EVENTS[n];
    COMPLETIONS.push({ t: n, ins: 'PROCEDURE ' + n + '(' + (ev.sig || '') + ')\n    |\nENDPROCEDURE', detail: ev.d, kind: 'sn' });
  });
  API.forEach(function (a) {
    var prefix = a.k === 'proc' ? 'CALL ' : '';
    COMPLETIONS.push({ t: a.n, ins: a.n + (a.a[1] ? '(|)' : '()'), detail: a.d, kind: 'fn', pre: prefix });
  });
  Object.keys(BUILTINS).forEach(function (n) {
    COMPLETIONS.push({ t: n, ins: n + (BUILTINS[n].a[1] ? '(|)' : '()'), detail: BUILTINS[n].d, kind: 'fn' });
  });

  // Reference sections for the Help window (same shape as the Python ones).
  function helpSections() {
    var cats = { mov: 'Motion', look: 'Looks', snd: 'Sound', evt: 'Events', ctrl: 'Control', sens: 'Sensing', vars: 'Variables on the stage', ops: 'Operators' };
    var events = { cat: 'evt', title: 'Event procedures', items: Object.keys(EVENTS).map(function (n) {
      return { code: 'PROCEDURE ' + n + '(' + (EVENTS[n].sig || '') + ')', desc: EVENTS[n].d };
    }) };
    var lang = { cat: 'ctrl', title: 'Cambridge pseudocode', items: [
      { code: 'DECLARE Score : INTEGER', desc: 'Every variable is declared first. Types: INTEGER, REAL, STRING, CHAR, BOOLEAN, ARRAY[1:10] OF INTEGER. Variables declared outside a procedure can be used in every procedure.' },
      { code: 'Score <- Score + 1', desc: 'Store a value. You can also type the arrow character.' },
      { code: 'IF Score > 10 THEN ... ELSE ... ENDIF', desc: 'THEN can go at the end of the line or on the next line.' },
      { code: 'CASE OF Key ... "a" : ... OTHERWISE : ... ENDCASE', desc: 'Choose between several values.' },
      { code: 'FOR Count <- 1 TO 10 ... NEXT Count', desc: 'Repeat a set number of times. Add STEP 2 to count in twos.' },
      { code: 'WHILE Lives > 0 DO ... ENDWHILE', desc: 'Repeat while a condition is TRUE. WHILE TRUE DO repeats forever, like a forever block.' },
      { code: 'REPEAT ... UNTIL Lives = 0', desc: 'Repeat until a condition is TRUE.' },
      { code: 'PROCEDURE Jump(Height : INTEGER) ... ENDPROCEDURE', desc: 'Your own procedure. Run it with CALL Jump(10).' },
      { code: 'FUNCTION Double(N : INTEGER) RETURNS INTEGER ... RETURN N * 2 ... ENDFUNCTION', desc: 'Your own function. Use it in an expression: Total <- Double(4)' },
      { code: 'OUTPUT "Score: ", Score', desc: 'Show values in the console below the code.' },
      { code: 'INPUT Name', desc: 'Ask the player to type a value.' },
      { code: '= <> < > <= >= AND OR NOT', desc: 'Compare and combine conditions.' },
      { code: '+ - * / ^ MOD DIV &', desc: 'Arithmetic. & joins text: "Score: " & Score' },
      { code: 'LENGTH UCASE LCASE SUBSTRING ROUND RANDOM INT', desc: 'Library routines, e.g. SUBSTRING("Hello", 1, 3) gives "Hel".' }
    ] };
    var groups = {};
    API.forEach(function (a) {
      (groups[a.cat] = groups[a.cat] || []).push({
        code: (a.k === 'proc' ? 'CALL ' : '') + a.n + '(' + a.p + ')',
        desc: a.d
      });
    });
    return [events, lang].concat(Object.keys(cats).filter(function (c) { return groups[c]; }).map(function (c) {
      return { cat: c, title: cats[c], items: groups[c] };
    }));
  }

  var api = {
    transpile: transpile,
    prologue: prologue,
    helpSections: helpSections,
    COMPLETIONS: COMPLETIONS,
    DEFAULT_CODE: DEFAULT_CODE,
    EVENTS: EVENTS,
    API: API
  };
  root.PyScratchPseudo = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
