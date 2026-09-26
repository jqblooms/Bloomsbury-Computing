// Scratch Challenges, part 1 of 5: builds the starter projects.
//
// A challenge's starter is written as data (sprites, costumes as SVG text,
// and scripts in a short block notation), turned into a real .sb3 here, and
// loaded into TurboWarp with vm.loadProject. Nothing binary lives in the
// repo, and a starter can be read and changed as text.
//
// Block notation, used by starters and by the self-test solutions:
//   ['motion_gotoxy', { X: 0, Y: 0 }]                a block and its inputs
//   ['control_forever', { SUBSTACK: [ ...blocks ] }]  a C block's inside
//   ['operator_gt', { OPERAND1: V('score'), OPERAND2: 9 }]
//   V('score') is the variable reporter; any array inside an input is a
//   reporter or boolean block.
// A script is { x, y, blocks: [hat, block, block, ...] }.
(function () {
  'use strict';
  if (!/[?&]scratchcheck/.test(location.search)) return;

  // ---- zip (stored, not compressed: the vm reads it with JSZip) ----
  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(text) { return new TextEncoder().encode(text); }

  function zip(files) {
    var parts = [], central = [], offset = 0;
    function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
    function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }
    files.forEach(function (file) {
      var name = utf8(file.name);
      var data = typeof file.data === 'string' ? utf8(file.data) : file.data;
      var crc = crc32(data);
      var head = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0x21),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0x21),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset)), name);
      offset += head.length + name.length + data.length;
    });
    var cdStart = offset, cdSize = 0;
    central.forEach(function (piece) {
      var bytes = piece instanceof Uint8Array ? piece : new Uint8Array(piece);
      parts.push(bytes);
      cdSize += bytes.length;
    });
    parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(cdSize), u32(cdStart), u16(0))));
    var total = parts.reduce(function (sum, p) { return sum + p.length; }, 0);
    var out = new Uint8Array(total), at = 0;
    parts.forEach(function (p) { out.set(p, at); at += p.length; });
    return out.buffer;
  }

  // A stable 32-hex-digit id for an asset, from its text.
  function assetId(text) {
    var h = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      for (var j = 0; j < 4; j++) h[j] = Math.imul(h[j] ^ (c + j * 31), 0x01000193 + j * 2) >>> 0;
    }
    return h.map(function (v) { return ('00000000' + v.toString(16)).slice(-8); }).join('');
  }

  // ---- art: flat SVG costumes, one colour story across every challenge ----
  function svg(w, h, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>';
  }
  var TEXT = 'font-family="Sans Serif" font-weight="bold"';

  function gridBackdrop(extra, ground) {
    var lines = '';
    for (var x = 40; x < 480; x += 50) lines += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="360" stroke="#26314a" stroke-width="1"/>';
    for (var y = 30; y < 360; y += 50) lines += '<line x1="0" y1="' + y + '" x2="480" y2="' + y + '" stroke="#26314a" stroke-width="1"/>';
    var labels = '';
    [-200, -100, 100, 200].forEach(function (v) {
      labels += '<text x="' + (240 + v) + '" y="176" fill="#8ea3c9" font-size="11" text-anchor="middle" ' + TEXT + '>' + v + '</text>';
    });
    [-100, 100].forEach(function (v) {
      labels += '<text x="246" y="' + (184 - v) + '" fill="#8ea3c9" font-size="11" ' + TEXT + '>' + v + '</text>';
    });
    return svg(480, 360, '<rect width="480" height="360" fill="' + (ground || '#141b2d') + '"/>' + lines +
      '<line x1="0" y1="180" x2="480" y2="180" stroke="#4d6190" stroke-width="2"/>' +
      '<line x1="240" y1="0" x2="240" y2="360" stroke="#4d6190" stroke-width="2"/>' +
      '<text x="470" y="172" fill="#c7d5f5" font-size="13" text-anchor="end" ' + TEXT + '>x</text>' +
      '<text x="248" y="16" fill="#c7d5f5" font-size="13" ' + TEXT + '>y</text>' + labels + (extra || ''));
  }

  // Scratch coordinates to the backdrop's own pixel coordinates.
  function px(x) { return 240 + x; }
  function py(y) { return 180 - y; }

  function marker(x, y, colour, label) {
    return '<circle cx="' + px(x) + '" cy="' + py(y) + '" r="15" fill="none" stroke="' + colour + '" stroke-width="3" stroke-dasharray="5 4"/>' +
      '<circle cx="' + px(x) + '" cy="' + py(y) + '" r="4" fill="' + colour + '"/>' +
      '<text x="' + px(x) + '" y="' + (py(y) + (y > 120 ? 32 : -22)) + '" fill="' + colour + '" font-size="13" text-anchor="middle" ' + TEXT + '>' + label + '</text>';
  }

  var ART = {
    rocket: svg(72, 44,
      '<path d="M8 22 L0 10 L14 14 Z M8 22 L0 34 L14 30 Z" fill="#f28b82"/>' +
      '<path d="M10 12 H46 C60 12 70 18 72 22 C70 26 60 32 46 32 H10 Z" fill="#e8eaed"/>' +
      '<circle cx="44" cy="22" r="6" fill="#8ab4f8" stroke="#1a73e8" stroke-width="2"/>' +
      '<rect x="4" y="18" width="7" height="8" rx="2" fill="#fbbc04"/>'),
    robot: svg(48, 56,
      '<rect x="20" y="0" width="8" height="8" rx="4" fill="#fbbc04"/><rect x="22" y="6" width="4" height="6" fill="#9aa0a6"/>' +
      '<rect x="6" y="12" width="36" height="26" rx="8" fill="#8ab4f8"/>' +
      '<circle cx="18" cy="25" r="5" fill="#0b1a33"/><circle cx="30" cy="25" r="5" fill="#0b1a33"/>' +
      '<circle cx="19" cy="24" r="2" fill="#fff"/><circle cx="31" cy="24" r="2" fill="#fff"/>' +
      '<rect x="10" y="40" width="28" height="12" rx="4" fill="#1a73e8"/><rect x="12" y="52" width="8" height="4" rx="2" fill="#5f6368"/><rect x="28" y="52" width="8" height="4" rx="2" fill="#5f6368"/>'),
    bee: svg(52, 40,
      '<ellipse cx="18" cy="8" rx="10" ry="7" fill="#e8f0fe" opacity=".85"/><ellipse cx="32" cy="8" rx="10" ry="7" fill="#e8f0fe" opacity=".85"/>' +
      '<ellipse cx="26" cy="24" rx="22" ry="14" fill="#fbbc04"/>' +
      '<rect x="14" y="11" width="6" height="26" fill="#202124"/><rect x="26" y="10" width="6" height="28" fill="#202124"/>' +
      '<circle cx="42" cy="21" r="3" fill="#202124"/><path d="M4 24 L0 22 L0 26 Z" fill="#202124"/>'),
    paddle: svg(110, 18, '<rect x="1" y="1" width="108" height="16" rx="8" fill="#81c995" stroke="#e8eaed" stroke-width="2"/>'),
    ball: svg(24, 24, '<circle cx="12" cy="12" r="11" fill="#fdd663" stroke="#fff" stroke-width="2"/>'),
    gem: svg(96, 90,
      '<path d="M20 4 H76 L94 30 L48 88 L2 30 Z" fill="#8ab4f8" stroke="#e8f0fe" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M2 30 H94 M20 4 L34 30 L48 88 L62 30 L76 4 M34 30 L48 4 L62 30" fill="none" stroke="#1a73e8" stroke-width="2"/>'),
    goldGem: svg(96, 90,
      '<path d="M20 4 H76 L94 30 L48 88 L2 30 Z" fill="#fdd663" stroke="#fff7d6" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M2 30 H94 M20 4 L34 30 L48 88 L62 30 L76 4 M34 30 L48 4 L62 30" fill="none" stroke="#e37400" stroke-width="2"/>'),
    bowl: svg(100, 44,
      '<path d="M2 6 H98 C96 30 76 42 50 42 C24 42 4 30 2 6 Z" fill="#c58af9" stroke="#f3e8fd" stroke-width="3"/>' +
      '<rect x="0" y="2" width="100" height="8" rx="4" fill="#e9d2fd"/>'),
    apple: svg(36, 40,
      '<path d="M18 10 C10 4 0 8 2 20 C4 32 12 40 18 36 C24 40 32 32 34 20 C36 8 26 4 18 10 Z" fill="#f28b82" stroke="#fce8e6" stroke-width="2"/>' +
      '<path d="M18 10 C18 6 20 2 23 0" stroke="#81c995" stroke-width="3" fill="none"/><ellipse cx="25" cy="5" rx="5" ry="3" fill="#81c995"/>'),
    walk1: svg(56, 72,
      '<circle cx="28" cy="14" r="12" fill="#fcad70"/><circle cx="33" cy="12" r="2.5" fill="#202124"/>' +
      '<rect x="18" y="26" width="20" height="24" rx="6" fill="#78d9ec"/>' +
      '<path d="M22 48 L12 70 M34 48 L44 70" stroke="#e8eaed" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M20 32 L8 44 M36 32 L48 44" stroke="#fcad70" stroke-width="5" stroke-linecap="round"/>'),
    walk2: svg(56, 72,
      '<circle cx="28" cy="14" r="12" fill="#fcad70"/><circle cx="33" cy="12" r="2.5" fill="#202124"/>' +
      '<rect x="18" y="26" width="20" height="24" rx="6" fill="#78d9ec"/>' +
      '<path d="M24 48 L26 70 M32 48 L30 70" stroke="#e8eaed" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M22 32 L20 48 M34 32 L36 48" stroke="#fcad70" stroke-width="5" stroke-linecap="round"/>'),
    hero: svg(50, 50,
      '<rect x="3" y="3" width="44" height="44" rx="14" fill="#81c995" stroke="#e6f4ea" stroke-width="3"/>' +
      '<circle cx="18" cy="21" r="5" fill="#fff"/><circle cx="34" cy="21" r="5" fill="#fff"/>' +
      '<circle cx="19" cy="22" r="2.5" fill="#202124"/><circle cx="35" cy="22" r="2.5" fill="#202124"/>' +
      '<path d="M16 34 Q25 41 34 34" stroke="#202124" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    coin: svg(32, 32,
      '<circle cx="16" cy="16" r="14" fill="#fdd663" stroke="#e37400" stroke-width="3"/>' +
      '<rect x="13" y="8" width="6" height="16" rx="3" fill="#e37400"/>'),
    wall: svg(24, 120, '<rect x="1" y="1" width="22" height="118" rx="4" fill="#9aa0a6" stroke="#e8eaed" stroke-width="2"/>'),
    flag: svg(40, 56,
      '<rect x="4" y="2" width="5" height="54" rx="2" fill="#e8eaed"/><path d="M9 4 H38 L30 16 L38 28 H9 Z" fill="#81c995"/>'),

    space: svg(480, 360, (function () {
      var stars = '', seed = 7;
      for (var i = 0; i < 60; i++) {
        seed = (seed * 9301 + 49297) % 233280;
        var sx = seed % 480;
        seed = (seed * 9301 + 49297) % 233280;
        var sy = seed % 360;
        stars += '<circle cx="' + sx + '" cy="' + sy + '" r="' + (i % 5 === 0 ? 2 : 1) + '" fill="#e8eaed" opacity="' + (i % 3 ? 0.5 : 0.9) + '"/>';
      }
      return '<rect width="480" height="360" fill="#0b1020"/>' + stars +
        '<circle cx="410" cy="70" r="34" fill="#c58af9" opacity=".8"/><circle cx="60" cy="300" r="22" fill="#78d9ec" opacity=".7"/>';
    })()),
    grid: gridBackdrop(''),
    treasureGrid: gridBackdrop(
      marker(-150, 100, '#fdd663', '(-150, 100)') +
      marker(150, 100, '#78d9ec', '(150, 100)') +
      marker(150, -100, '#f28b82', '(150, -100)')),
    squareGrid: gridBackdrop(
      '<rect x="' + px(-100) + '" y="' + py(100) + '" width="200" height="200" fill="none" stroke="#fdd663" stroke-width="3" stroke-dasharray="10 8"/>' +
      marker(-100, -100, '#81c995', 'Start (-100, -100)')),
    pong: svg(480, 360,
      '<rect width="480" height="360" fill="#101828"/>' +
      '<line x1="0" y1="120" x2="480" y2="120" stroke="#1d2a44" stroke-width="2" stroke-dasharray="12 10"/>' +
      '<line x1="0" y1="240" x2="480" y2="240" stroke="#1d2a44" stroke-width="2" stroke-dasharray="12 10"/>' +
      '<rect x="0" y="345" width="480" height="15" fill="#e02424"/>'),
    gemRoom: svg(480, 360,
      '<rect width="480" height="360" fill="#1b1330"/>' +
      '<circle cx="240" cy="180" r="150" fill="#2a1d4d"/><circle cx="240" cy="180" r="95" fill="#35265f"/>'),
    orchard: svg(480, 360,
      '<rect width="480" height="360" fill="#8ab4f8"/><circle cx="410" cy="60" r="30" fill="#fdd663"/>' +
      '<ellipse cx="110" cy="70" rx="60" ry="18" fill="#e8f0fe"/><ellipse cx="300" cy="110" rx="50" ry="15" fill="#e8f0fe"/>' +
      '<rect x="0" y="330" width="480" height="30" fill="#34a853"/>'),
    street: svg(480, 360,
      '<rect width="480" height="360" fill="#1e2a3a"/><rect x="0" y="250" width="480" height="110" fill="#3c4043"/>' +
      '<rect x="40" y="120" width="70" height="130" fill="#2b3a55"/><rect x="150" y="80" width="90" height="170" fill="#273449"/>' +
      '<rect x="290" y="140" width="60" height="110" fill="#2b3a55"/><rect x="380" y="100" width="80" height="150" fill="#273449"/>' +
      '<rect x="0" y="300" width="480" height="6" fill="#fdd663" opacity=".6"/>'),
    level1: svg(480, 360,
      '<rect width="480" height="360" fill="#1f3b2c"/><rect x="0" y="300" width="480" height="60" fill="#2d5a3d"/>' +
      '<text x="240" y="40" fill="#81c995" font-size="26" text-anchor="middle" ' + TEXT + '>LEVEL 1</text>'),
    level2: svg(480, 360,
      '<rect width="480" height="360" fill="#2a1830"/><rect x="0" y="300" width="480" height="60" fill="#4a2a52"/>' +
      '<text x="240" y="40" fill="#f28b82" font-size="26" text-anchor="middle" ' + TEXT + '>LEVEL 2</text>'),
    maze: svg(480, 360,
      '<rect width="480" height="360" fill="#101828"/>' +
      '<rect x="0" y="0" width="480" height="16" fill="#1a73e8"/><rect x="0" y="344" width="480" height="16" fill="#1a73e8"/>' +
      '<rect x="0" y="0" width="16" height="360" fill="#1a73e8"/><rect x="464" y="0" width="16" height="360" fill="#1a73e8"/>' +
      '<rect x="140" y="16" width="20" height="230" fill="#1a73e8"/><rect x="320" y="114" width="20" height="230" fill="#1a73e8"/>')
  };

  // ---- project builder ----
  // Inputs that take a number shadow, and which kind of shadow.
  var NUM_KIND = { math_number: 4, math_positive_number: 5, math_whole_number: 6, math_integer: 7, math_angle: 8, text: 10 };
  // opcode -> { inputName: shadow kind | 'bool' | 'stack' | ['menu', menuOpcode, menuField] }, plus fields.
  var SPEC = {
    event_whenflagclicked: {},
    event_whenthisspriteclicked: {},
    event_whenkeypressed: { fields: ['KEY_OPTION'] },
    event_whenbroadcastreceived: { fields: ['BROADCAST_OPTION'] },
    event_broadcast: { BROADCAST_INPUT: 'broadcast' },
    event_broadcastandwait: { BROADCAST_INPUT: 'broadcast' },
    motion_movesteps: { STEPS: 'math_number' },
    motion_turnright: { DEGREES: 'math_number' },
    motion_turnleft: { DEGREES: 'math_number' },
    motion_pointindirection: { DIRECTION: 'math_angle' },
    motion_gotoxy: { X: 'math_number', Y: 'math_number' },
    motion_glidesecstoxy: { SECS: 'math_number', X: 'math_number', Y: 'math_number' },
    motion_changexby: { DX: 'math_number' },
    motion_changeyby: { DY: 'math_number' },
    motion_setx: { X: 'math_number' },
    motion_sety: { Y: 'math_number' },
    motion_ifonedgebounce: {},
    motion_setrotationstyle: { fields: ['STYLE'] },
    motion_xposition: {}, motion_yposition: {}, motion_direction: {},
    looks_say: { MESSAGE: 'text' },
    looks_sayforsecs: { MESSAGE: 'text', SECS: 'math_number' },
    looks_switchcostumeto: { COSTUME: ['menu', 'looks_costume', 'COSTUME'] },
    looks_nextcostume: {},
    looks_switchbackdropto: { BACKDROP: ['menu', 'looks_backdrops', 'BACKDROP'] },
    looks_show: {}, looks_hide: {},
    control_forever: { SUBSTACK: 'stack' },
    control_repeat: { TIMES: 'math_whole_number', SUBSTACK: 'stack' },
    control_if: { CONDITION: 'bool', SUBSTACK: 'stack' },
    control_if_else: { CONDITION: 'bool', SUBSTACK: 'stack', SUBSTACK2: 'stack' },
    control_wait: { DURATION: 'math_positive_number' },
    control_wait_until: { CONDITION: 'bool' },
    control_repeat_until: { CONDITION: 'bool', SUBSTACK: 'stack' },
    control_stop: { fields: ['STOP_OPTION'] },
    sensing_touchingobject: { TOUCHINGOBJECTMENU: ['menu', 'sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU'] },
    sensing_touchingcolor: { COLOR: 'colour' },
    sensing_keypressed: { KEY_OPTION: ['menu', 'sensing_keyoptions', 'KEY_OPTION'] },
    sensing_mousex: {}, sensing_mousey: {},
    operator_gt: { OPERAND1: 'text', OPERAND2: 'text' },
    operator_lt: { OPERAND1: 'text', OPERAND2: 'text' },
    operator_equals: { OPERAND1: 'text', OPERAND2: 'text' },
    operator_and: { OPERAND1: 'bool', OPERAND2: 'bool' },
    operator_or: { OPERAND1: 'bool', OPERAND2: 'bool' },
    operator_add: { NUM1: 'math_number', NUM2: 'math_number' },
    operator_subtract: { NUM1: 'math_number', NUM2: 'math_number' },
    operator_random: { FROM: 'math_number', TO: 'math_number' },
    data_setvariableto: { VALUE: 'text', fields: ['VARIABLE'] },
    data_changevariableby: { VALUE: 'math_number', fields: ['VARIABLE'] }
  };

  function V(name) { return { variable: name }; }

  function Builder() {
    this.count = 0;
    this.variables = {};   // name -> id (all stage variables)
    this.broadcasts = {};  // name -> id
  }
  Builder.prototype.id = function (prefix) { this.count += 1; return (prefix || 'b') + this.count; };
  Builder.prototype.varId = function (name) {
    if (!this.variables[name]) this.variables[name] = 'var-' + name.replace(/\W+/g, '-');
    return this.variables[name];
  };
  Builder.prototype.broadcastId = function (name) {
    if (!this.broadcasts[name]) this.broadcasts[name] = 'msg-' + name.replace(/\W+/g, '-');
    return this.broadcasts[name];
  };

  // Adds one block (and anything inside it) to `out`; returns its id.
  Builder.prototype.block = function (out, spec, parentId) {
    var self = this;
    var opcode = spec[0], args = spec[1] || {};
    var def = SPEC[opcode];
    if (!def) throw new Error('scratchcheck-kit: no spec for ' + opcode);
    var id = this.id();
    var block = { opcode: opcode, next: null, parent: parentId || null, inputs: {}, fields: {}, shadow: false, topLevel: false };
    out[id] = block;
    (def.fields || []).forEach(function (field) {
      var value = args[field];
      if (field === 'VARIABLE') block.fields.VARIABLE = [value, self.varId(value)];
      else if (field === 'BROADCAST_OPTION') block.fields.BROADCAST_OPTION = [value, self.broadcastId(value)];
      else block.fields[field] = [value, null];
    });
    if (opcode === 'control_stop') {
      block.mutation = { tagName: 'mutation', children: [], hasnext: args.STOP_OPTION === 'other scripts in sprite' ? 'true' : 'false' };
    }
    Object.keys(def).forEach(function (name) {
      if (name === 'fields') return;
      var kind = def[name], value = args[name];
      if (kind === 'stack') {
        if (value && value.length) block.inputs[name] = [2, self.stack(out, value, id)];
      } else if (kind === 'bool') {
        if (value) block.inputs[name] = [2, self.block(out, value, id)];
      } else if (kind === 'broadcast') {
        block.inputs[name] = [1, [11, value, self.broadcastId(value)]];
      } else if (kind === 'colour') {
        block.inputs[name] = [1, [9, value]];
      } else if (Array.isArray(kind)) {
        var menuId = self.id();
        out[menuId] = { opcode: kind[1], next: null, parent: id, inputs: {}, fields: {}, shadow: true, topLevel: false };
        out[menuId].fields[kind[2]] = [String(value), null];
        block.inputs[name] = [1, menuId];
      } else {
        var shadow = [NUM_KIND[kind], kind === 'text' ? String(value == null ? '' : value) : String(value == null ? 0 : value)];
        if (value && value.variable) block.inputs[name] = [3, [12, value.variable, self.varId(value.variable)], [NUM_KIND[kind], kind === 'text' ? '' : '0']];
        else if (Array.isArray(value)) block.inputs[name] = [3, self.block(out, value, id), [NUM_KIND[kind], kind === 'text' ? '' : '0']];
        else block.inputs[name] = [1, shadow];
      }
    });
    return id;
  };

  Builder.prototype.stack = function (out, list, parentId) {
    var self = this, firstId = null, prevId = null;
    list.forEach(function (spec) {
      var id = self.block(out, spec, prevId || parentId);
      if (prevId) out[prevId].next = id; else firstId = id;
      prevId = id;
    });
    return firstId;
  };

  Builder.prototype.scripts = function (scripts) {
    var self = this, out = {};
    (scripts || []).forEach(function (script) {
      var first = self.stack(out, script.blocks, null);
      out[first].topLevel = true;
      out[first].x = script.x || 0;
      out[first].y = script.y || 0;
    });
    return out;
  };

  function costume(name, artKey, files) {
    var text = ART[artKey];
    if (!text) throw new Error('scratchcheck-kit: no art called ' + artKey);
    var id = assetId(text);
    if (!files.some(function (f) { return f.name === id + '.svg'; })) files.push({ name: id + '.svg', data: text });
    var size = /width="(\d+)" height="(\d+)"/.exec(text);
    return { name: name, dataFormat: 'svg', assetId: id, md5ext: id + '.svg',
      rotationCenterX: Number(size[1]) / 2, rotationCenterY: Number(size[2]) / 2 };
  }

  // def: { backdrops: [[name, art]], sprites: [{ name, costumes: [[name, art]], x, y, direction, size,
  //        rotationStyle, visible, scripts }], stageScripts, variables: { name: value }, showVariables: [names] }
  function buildProject(def) {
    var files = [], b = new Builder();
    Object.keys(def.variables || {}).forEach(function (name) { b.varId(name); });
    var spriteTargets = (def.sprites || []).map(function (s, i) {
      return {
        isStage: false, name: s.name, variables: {}, lists: {}, broadcasts: {},
        blocks: b.scripts(s.scripts), comments: {}, currentCostume: 0,
        costumes: s.costumes.map(function (c) { return costume(c[0], c[1], files); }),
        sounds: [], volume: 100, layerOrder: i + 1, visible: s.visible !== false,
        x: s.x || 0, y: s.y || 0, size: s.size || 100, direction: s.direction == null ? 90 : s.direction,
        draggable: false, rotationStyle: s.rotationStyle || 'all around'
      };
    });
    var stageBlocks = b.scripts(def.stageScripts);
    var stage = {
      isStage: true, name: 'Stage', variables: {}, lists: {}, broadcasts: {}, blocks: stageBlocks, comments: {},
      currentCostume: 0,
      costumes: (def.backdrops || [['backdrop1', 'grid']]).map(function (c) {
        var entry = costume(c[0], c[1], files);
        entry.rotationCenterX = 240; entry.rotationCenterY = 180;
        return entry;
      }),
      sounds: [], volume: 100, layerOrder: 0, tempo: 60, videoTransparency: 50, videoState: 'on', textToSpeechLanguage: null
    };
    Object.keys(b.variables).forEach(function (name) {
      var start = def.variables && Object.prototype.hasOwnProperty.call(def.variables, name) ? def.variables[name] : 0;
      stage.variables[b.variables[name]] = [name, start];
    });
    Object.keys(b.broadcasts).forEach(function (name) { stage.broadcasts[b.broadcasts[name]] = name; });
    var monitors = (def.showVariables || []).map(function (name, i) {
      return { id: b.varId(name), mode: 'default', opcode: 'data_variable', params: { VARIABLE: name }, spriteName: null,
        value: 0, width: 0, height: 0, x: 5, y: 5 + i * 27, visible: true, sliderMin: 0, sliderMax: 100, isDiscrete: true };
    });
    var project = { targets: [stage].concat(spriteTargets), monitors: monitors, extensions: [],
      meta: { semver: '3.0.0', vm: '0.2.0', agent: 'Bloomsbury Computing Scratch Challenges' } };
    files.unshift({ name: 'project.json', data: JSON.stringify(project) });
    return zip(files);
  }

  // The challenge list, filled by the challenge files in the order they load.
  var challenges = [];
  function add(def) { challenges.push(def); }
  function find(id) { return challenges.filter(function (c) { return c.id === id; })[0] || null; }

  window.ScratchCheckKit = { buildProject: buildProject, V: V, ART: ART, SPEC: SPEC, challenges: challenges, add: add, find: find };
})();
