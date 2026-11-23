// Exam question renderer: draws an Exam Game question's blocks (shell ExamGame.gs, examGameBlocksText_ lists them) the
// way the exam paper does: black-ruled tables and truth tables, ANSI gate symbols, register boxes, binary addition in
// columns, code, tick-box options and tick grids. Used by every game that shows Exam Game questions (TowerDefence/, BridgeBuilder/).
//   BCExamQuestion.html(blocks)        -> HTML string ('' when there are no blocks), drawn on paper (nothing to fill in)
//   BCExamQuestion.render(el, q)       -> draws q.blocks into el (or q.text as plain lines when there are none)
//   BCExamQuestion.gateSvg(gate, opts) -> one gate symbol as SVG ({ inputs: ['A','B'], output: 'X' })
//   BCExamQuestion.answerUI(qEl, ansEl, q, opts) -> the question drawn with its answer spaces live, answered as on the
//     paper: tick the boxes of a tickGrid or of options, type 0 or 1 into the blank cells of a truth table, the bits
//     into empty register boxes and the boxes of a sum, a value into a blank table cell, a word on a "line". The free
//     answer box (shared/answer-box.js) is mounted only where the question needs writing: at a "lines" block, or in
//     ansEl when the question has nothing to fill in. Returns the answer box's API: text(), doc(), state(),
//     setReadOnly(b), focus(), filled(). opts: { state, doc, text, readOnly, label, placeholder, labelEl,
//     onChange(text, doc, state) }. Keep state() with the saved round so a reload keeps the ticks and cells.
//   BCExamQuestion.serialise(blocks, state, typed) -> the plain text answer sent for marking (format below).
//
// The answer as plain text (what ExamGame.gs marks: Haiku, its keyword and key marks, and the LAN party's C# port).
// One line per answer space, in block order, lines joined by "\n"; a space with nothing filled in writes no line:
//   tickGrid    every row, once anything in the grid is ticked: "Row 1: AND, OR." then "Row 2: none."
//               (the ticked column heads, left to right, joined by ", "; "none" for a row with no tick)
//   options     one line per ticked box: "Option C: truth table."
//   truthTable  one line per output column that has a blank: "X: 0001" (the whole column, top row first; a printed
//               cell gives its own value, a blank left empty is "?")
//   register    "Register: 10110010" (the caption without its colon, else "Register"; an empty box is "?")
//   table       one line per filled blank cell: "<first cell of its row>: <value>", or "<column head>, row n: <value>"
//               when the blank is in the first column
//   sum         "Carry: 01100110" (an empty carry box is 0) and "Answer: 10011001" (an empty box is "?")
//   line        "<label>: <value>" (mono: true draws a wider monospace input, for an expression or a bit string)
//   expr, tree  nothing to fill in: { type: 'expr', text, label? } one expression drawn large in monospace;
//               { type: 'tree', prefix: '+ A * B C' } an expression tree drawn as SVG from its prefix form
//   lines       the typed text of the answer box, as typed, at the place of the lines block
// With no lines block, a free box's typed text comes first. Blanks the student works out are drawn empty: the blocks
// never hold an answer. Colours come from the site theme (bc-theme.css), so it reads in both themes.
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  var CSS = '' +
    '.eq{display:flex;flex-direction:column;gap:14px;align-items:flex-start;max-width:100%}' +
    '.eq-para{margin:0;white-space:pre-wrap}' +
    '.eq-wrap{max-width:100%;overflow-x:auto}' +
    '.eq-cap{font:600 17px/1.3 var(--font-body,sans-serif);color:var(--ink);margin:0 0 6px}' +
    '.eq-table{border-collapse:collapse;font:500 18px/1.35 var(--font-body,sans-serif);color:var(--ink);background:var(--surface)}' +
    '.eq-table th,.eq-table td{border:2px solid var(--ink);padding:7px 14px;text-align:left;vertical-align:top}' +
    '.eq-table th{font-weight:700;background:var(--surface-2)}' +
    '.eq-table td.is-blank{min-width:7em}' +
    '.eq-table td.is-hl{background:var(--brand-soft)}' +
    '.eq-table td.is-in{padding:0}' +
    '.eq-table td.eq-gl{white-space:pre-line;vertical-align:middle}' +
    '.eq-table th.eq-tc,.eq-table td.eq-tc{text-align:center;vertical-align:middle;padding:0;min-width:3.4em}' +
    '.eq-table th.eq-tc{padding:7px 10px}' +
    '.eq-tt{border-collapse:collapse;font:600 20px/1 var(--font-mono,monospace);color:var(--ink);background:var(--surface)}' +
    '.eq-tt th,.eq-tt td{border:2px solid var(--ink);width:2.6em;height:1.9em;text-align:center;padding:0}' +
    '.eq-tt th{font-family:var(--font-body,sans-serif);font-weight:700;background:var(--surface-2)}' +
    '.eq-tt .is-out{border-left-width:5px;border-left-style:double}' +
    '.eq-reg{border-collapse:collapse;font:600 20px/1 var(--font-mono,monospace);color:var(--ink)}' +
    '.eq-reg td{border:2px solid var(--ink);width:1.9em;height:1.9em;text-align:center;padding:0;background:var(--surface)}' +
    '.eq-reg th{font:600 14px/1 var(--font-body,sans-serif);color:var(--ink-soft,var(--ink));padding:0 0 5px;text-align:center}' +
    '.eq-reg-row{display:flex;align-items:flex-end;gap:12px}' +
    '.eq-reg-row .eq-cap{margin:0 0 10px}' +
    '.eq-sum{border-collapse:collapse;font:600 22px/1 var(--font-mono,monospace);color:var(--ink)}' +
    '.eq-sum td{width:1.45em;height:1.6em;text-align:center;padding:0}' +
    '.eq-sum .eq-sign{width:1.2em;font-family:var(--font-body,sans-serif)}' +
    '.eq-sum .eq-carry td.eq-box{height:1.15em;font-size:15px}' +
    '.eq-sum td.eq-box{border:1.5px solid var(--ink);background:var(--surface)}' +
    '.eq-sum .eq-carry td.eq-box{border-style:dashed}' +
    '.eq-sum .eq-carry td{padding-bottom:4px}' +
    '.eq-sum .eq-rule td.eq-d{border-top:3px solid var(--ink)}' +
    '.eq-sum .eq-ans td.eq-box{height:1.7em}' +
    '.eq-code{margin:0;padding:12px 16px;border:2px solid var(--ink);border-radius:4px;background:var(--code-bg,var(--surface-2));' +
      'color:var(--ink);font:500 18px/1.5 var(--font-mono,monospace);white-space:pre;overflow-x:auto;max-width:100%;tab-size:4}' +
    '.eq-code .eq-ln{display:inline-block;min-width:2em;color:var(--muted,var(--ink-soft));user-select:none}' +
    '.eq-opts{border-collapse:collapse;font:500 19px/1.35 var(--font-body,sans-serif);color:var(--ink)}' +
    '.eq-opts td{padding:6px 10px;vertical-align:middle}' +
    '.eq-opts .eq-letter{font-weight:700;padding-left:0}' +
    '.eq-opts .eq-tick{width:1.5em;height:1.5em;border:2px solid var(--ink);background:var(--surface);padding:0}' +
    '.eq-opts tr+tr td{border-top:6px solid transparent}' +
    '.eq-opts td.eq-tick.is-in{width:2.2em;height:2.2em}' +
    '.eq-gate{display:flex;flex-direction:column;align-items:flex-start;gap:4px}' +
    '.eq-gate svg{display:block;width:240px;max-width:100%;height:auto;color:var(--ink)}' +
    '.eq-gate-name{font:700 16px/1 var(--font-body,sans-serif);color:var(--ink);margin-left:84px}' +
    '.eq-line{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;font:500 18px/1.35 var(--font-body,sans-serif);color:var(--ink)}' +
    '.eq-line-dots{display:inline-block;min-width:12em;border-bottom:2px dotted var(--ink);height:1.1em}' +
    '.eq-lines{width:100%}' +
    '.eq-lines-paper{display:block;width:100%;height:1.6em;border-bottom:2px dotted var(--ink)}' +
    '.eq-in{display:block;box-sizing:border-box;width:100%;height:100%;min-height:1.9em;margin:0;padding:0 4px;border:0;outline:none;' +
      'background:transparent;color:var(--brand,var(--ink));font:inherit;text-align:center}' +
    '.eq-in:focus{background:var(--brand-soft,var(--surface-2));box-shadow:inset 0 0 0 2px var(--brand,var(--ink))}' +
    '.eq-in[readonly]{cursor:default}' +
    '.eq-table td .eq-in{min-width:7em;text-align:left;padding:7px 14px}' +
    '.eq-line .eq-in{display:inline-block;width:auto;min-width:12em;height:auto;min-height:0;padding:2px 6px;border-bottom:2px dotted var(--ink);text-align:left}' +
    '.eq-line .eq-in.is-mono{min-width:16em;font-family:var(--font-mono,monospace);font-weight:600;letter-spacing:.04em}' +
    '.eq-expr{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;max-width:100%;font:600 17px/1.3 var(--font-body,sans-serif);color:var(--ink)}' +
    '.eq-expr code{display:inline-block;max-width:100%;overflow-x:auto;padding:8px 16px;border:2px solid var(--ink);border-radius:4px;' +
      'background:var(--code-bg,var(--surface-2));color:var(--ink);font:600 24px/1.3 var(--font-mono,monospace);white-space:pre;word-spacing:.25em}' +
    '.eq-tree{max-width:100%;overflow-x:auto}' +
    '.eq-tree svg{display:block;height:auto;max-width:100%}' +
    '.eq-tree line{stroke:var(--ink);stroke-width:2}' +
    '.eq-tree circle{fill:var(--surface);stroke:var(--ink);stroke-width:2}' +
    '.eq-tree circle.is-op{fill:var(--surface-2)}' +
    '.eq-tree text{fill:var(--ink);font:700 20px var(--font-mono,monospace);text-anchor:middle;dominant-baseline:central}' +
    '.eq-tk{display:block;width:100%;min-width:2.4em;height:100%;min-height:2.2em;margin:0;padding:0;border:0;background:transparent;' +
      'color:var(--brand,var(--ink));font:700 24px/1 var(--font-body,sans-serif);cursor:pointer}' +
    '.eq-tk:hover:not(:disabled){background:var(--surface-2)}' +
    '.eq-tk:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--brand,var(--ink))}' +
    '.eq-tk:disabled{cursor:default}';

  function style() {
    if (typeof document === 'undefined' || document.getElementById('bc-eq-style')) return;
    var s = document.createElement('style');
    s.id = 'bc-eq-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  var HEADS = { tc: [-128, 64, 32, 16, 8, 4, 2, 1], bin: [128, 64, 32, 16, 8, 4, 2, 1] };
  var GATES = ['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR'];
  var TICK = '✓';

  // ANSI gate symbols in a 160 x 80 box: inputs on the left, output on the right.
  function gateSvg(gate, opts) {
    opts = opts || {};
    var g = String(gate || '').toUpperCase();
    if (GATES.indexOf(g) < 0) return '';
    var ins = Array.isArray(opts.inputs) ? opts.inputs : (g === 'NOT' ? ['A'] : ['A', 'B']);
    var body = '', inX, outX, ys = ins.length === 1 ? [40] : [28, 52];
    if (g === 'NOT') {
      body = '<path d="M52 16 L52 64 L96 40 Z"/><circle cx="101" cy="40" r="5"/>';
      inX = function () { return 52; }; outX = 106;
    } else if (g === 'AND' || g === 'NAND') {
      body = '<path d="M50 14 H78 A26 26 0 0 1 78 66 H50 Z"/>' + (g === 'NAND' ? '<circle cx="109" cy="40" r="5"/>' : '');
      inX = function () { return 50; }; outX = g === 'NAND' ? 114 : 104;
    } else {
      // OR family: curved back (quadratic, x = 46 + 40t(1 - t) along it) and a pointed front at (112, 40)
      body = '<path d="M46 14 Q66 40 46 66 Q90 66 112 40 Q90 14 46 14 Z"/>' +
        (g === 'XOR' ? '<path d="M37 14 Q57 40 37 66"/>' : '') + (g === 'NOR' ? '<circle cx="117" cy="40" r="5"/>' : '');
      inX = function (y) { var t = (y - 14) / 52; return 46 + 40 * t * (1 - t); };
      outX = g === 'NOR' ? 122 : 112;
    }
    var wires = ys.map(function (y) { return '<path d="M16 ' + y + ' H' + (inX(y)).toFixed(1) + '"/>'; }).join('') +
      '<path d="M' + outX + ' 40 H146"/>';
    var labels = ys.map(function (y, i) { return ins[i] ? '<text x="10" y="' + (y + 6) + '" text-anchor="end">' + esc(ins[i]) + '</text>' : ''; }).join('') +
      (opts.output ? '<text x="152" y="46">' + esc(opts.output) + '</text>' : '');
    return '<svg viewBox="-12 0 184 80" role="img" aria-label="' + esc(opts.showName ? g + ' gate symbol' : 'Logic gate symbol') + '">' +
      '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' + wires + body + '</g>' +
      '<g fill="currentColor" font-family="sans-serif" font-size="17" font-weight="700">' + labels + '</g></svg>';
  }

  function cap(b) { return b.caption ? '<p class="eq-cap">' + esc(b.caption) + '</p>' : ''; }
  function blank(v) { return v === null || v === undefined || v === ''; }
  function capName(b, dflt) { return b.caption ? String(b.caption).replace(/[:\s]+$/, '') : dflt; }
  function oneLine(s) { return String(s == null ? '' : s).replace(/\s*\n\s*/g, ', ').trim(); }
  function gridGiven(b) { return (b.rows || []).reduce(function (m, r) { return Math.max(m, r.length); }, 0); }

  // ia (interactive): { st: state object, ro: read only, ip: key prefix for this block }. Without it, paper only.
  function cellIn(ia, k, max, label, mode, mono) {
    var v = ia.st[ia.ip + k] == null ? '' : String(ia.st[ia.ip + k]);
    return '<input class="eq-in' + (mono ? ' is-mono' : '') + '" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-k="' + esc(ia.ip + k) + '"' +
      (mode ? ' data-mode="' + mode + '" inputmode="numeric"' : '') + ' maxlength="' + max + '" aria-label="' + esc(label) + '" value="' + esc(v) + '"' +
      (ia.ro ? ' readonly' : '') + '>';
  }
  function tickBtn(ia, k, label) {
    var on = !!ia.st[ia.ip + k];
    return '<button type="button" class="eq-tk" data-k="' + esc(ia.ip + k) + '" aria-pressed="' + on + '" aria-label="' + esc(label) + '"' +
      (ia.ro ? ' disabled' : '') + '>' + (on ? TICK : '') + '</button>';
  }

  // An expression tree from its prefix form ('+ A * B C', ^ for the power arrow): each value is one token.
  function treeOf(prefix) {
    var t = String(prefix || '').replace(/\^/g, '↑').split(/\s+/).filter(function (x) { return x; }), p = 0;
    function walk() {
      var tk = t[p++];
      if (tk == null) return null;
      if (!/^[-+*\/↑]$/.test(tk)) return { v: tk };
      var l = walk(), r = walk();
      return l && r ? { v: tk, op: true, l: l, r: r } : null;
    }
    var root = walk();
    return root && p === t.length ? root : null;
  }
  function treeSvg(prefix) {
    var root = treeOf(prefix);
    if (!root) return '';
    var col = 0, depth = 0, nodes = [], R = 20, DX = 46, DY = 64;
    (function place(n, d) {          // in-order: x by order left to right, y by depth
      if (n.l) place(n.l, d + 1);
      n.x = col++; n.d = d; if (d > depth) depth = d;
      if (n.r) place(n.r, d + 1);
      nodes.push(n);
    })(root, 0);
    var X = function (n) { return R + 6 + n.x * DX; }, Y = function (n) { return R + 6 + n.d * DY; };
    var w = 2 * (R + 6) + (col - 1) * DX, h = 2 * (R + 6) + depth * DY, lines = '', dots = '';
    nodes.forEach(function (n) {
      if (n.op) [n.l, n.r].forEach(function (c) { lines += '<line x1="' + X(n) + '" y1="' + Y(n) + '" x2="' + X(c) + '" y2="' + Y(c) + '"/>'; });
      dots += '<circle' + (n.op ? ' class="is-op"' : '') + ' cx="' + X(n) + '" cy="' + Y(n) + '" r="' + R + '"/><text x="' + X(n) + '" y="' + Y(n) + '">' + esc(n.v) + '</text>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" role="img" aria-label="Expression tree">' + lines + dots + '</svg>';
  }

  var DRAW = {
    para: function (b) { return '<p class="eq-para">' + esc(b.text) + '</p>'; },
    table: function (b, ia) {
      var hl = {};
      (b.highlight || []).forEach(function (rc) { hl[rc[0] + ',' + rc[1]] = 1; });
      return '<div class="eq-wrap">' + cap(b) + '<table class="eq-table"><thead><tr>' +
        (b.head || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        (b.rows || []).map(function (r, ri) {
          return '<tr>' + r.map(function (c, ci) {
            var isIn = ia && blank(c);
            var cls = (blank(c) ? 'is-blank' : '') + (isIn ? ' is-in' : '') + (hl[ri + ',' + ci] ? ' is-hl' : '');
            return '<td' + (cls ? ' class="' + cls.trim() + '"' : '') + '>' +
              (isIn ? cellIn(ia, 'r' + ri + 'c' + ci, 40, (b.head && b.head[ci] ? b.head[ci] + ', ' : '') + 'row ' + (ri + 1)) : blank(c) ? '' : esc(c)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    },
    truthTable: function (b, ia) {
      var n = (b.inputs || []).length, heads = (b.inputs || []).concat(b.outputs || []);
      var th = (b.inputs || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
        (b.outputs || []).map(function (h, i) { return '<th' + (i === 0 ? ' class="is-out"' : '') + '>' + esc(h) + '</th>'; }).join('');
      return '<div class="eq-wrap">' + cap(b) + '<table class="eq-tt"><thead><tr>' + th + '</tr></thead><tbody>' +
        (b.rows || []).map(function (r, ri) {
          return '<tr>' + r.map(function (v, i) {
            var inner = blank(v) ? (ia ? cellIn(ia, 'r' + ri + 'c' + i, 1, heads[i] + ', row ' + (ri + 1), 'bit') : '') : esc(v);
            return '<td' + (i === n ? ' class="is-out"' : '') + (blank(v) && !ia ? ' aria-label="blank"' : '') + '>' + inner + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    },
    register: function (b, ia) {
      var bits = b.bits ? String(b.bits) : '', size = b.size || bits.length || 8;
      var heads = typeof b.heads === 'string' ? HEADS[b.heads] : b.heads, cells = '', hd = '';
      for (var i = 0; i < size; i++) {
        var c = bits.charAt(i), given = c === '0' || c === '1';
        cells += '<td' + (given || ia ? '' : ' aria-label="blank"') + '>' + (given ? c : ia ? cellIn(ia, 'c' + i, 1, 'Bit ' + (i + 1) + ' of ' + size, 'bit') : '') + '</td>';
        if (heads) hd += '<th>' + esc(heads[i] == null ? '' : heads[i]) + '</th>';
      }
      var t = '<table class="eq-reg" aria-label="' + (bits ? 'Register holding ' + esc(bits) : 'Empty ' + size + '-bit register') + '">' +
        (hd ? '<thead><tr>' + hd + '</tr></thead>' : '') + '<tbody><tr>' + cells + '</tr></tbody></table>';
      return '<div class="eq-wrap"><div class="eq-reg-row">' + cap(b) + t + '</div></div>';
    },
    sum: function (b, ia) {
      var rows = b.rows || [], w = rows.reduce(function (m, r) { return Math.max(m, String(r).length); }, 0), h = '', i, j;
      var digits = function (r, cls) {
        var s = String(r), out = '';
        for (j = 0; j < w; j++) { var k = j - (w - s.length); out += '<td class="eq-d' + (cls ? ' ' + cls : '') + '">' + (k >= 0 ? esc(s.charAt(k)) : '') + '</td>'; }
        return out;
      };
      var boxes = function (pre, what) {
        var out = '';
        for (j = 0; j < w; j++) out += '<td class="eq-d eq-box">' + (ia ? cellIn(ia, pre + j, 1, what + ', column ' + (j + 1), 'bit') : '') + '</td>';
        return out;
      };
      if (b.carry) h += '<tr class="eq-carry"><td class="eq-sign"></td>' + boxes('k', 'Carry') + '</tr>';
      for (i = 0; i < rows.length; i++) h += '<tr><td class="eq-sign">' + (i === rows.length - 1 && i ? '+' : '') + '</td>' + digits(rows[i]) + '</tr>';
      if (b.boxes) h += '<tr class="eq-rule eq-ans"><td class="eq-sign"></td>' + boxes('s', 'Answer') + '</tr>';
      else h += '<tr class="eq-rule"><td class="eq-sign"></td>' + digits('') + '</tr>';
      return '<div class="eq-wrap"><table class="eq-sum" aria-label="Binary addition: ' + esc(rows.join(' plus ')) + '">' + h + '</table></div>';
    },
    code: function (b) {
      var lines = b.lines || [];
      return '<pre class="eq-code" aria-label="' + esc(b.lang === 'python' ? 'Python program' : 'Pseudocode') + '">' + lines.map(function (l, i) {
        return (b.numbered ? '<span class="eq-ln">' + (i + 1) + '</span>' : '') + esc(l);
      }).join('\n') + '</pre>';
    },
    options: function (b, ia) {
      return '<table class="eq-opts"><tbody>' + (b.items || []).map(function (it, i) {
        var L = 'ABCDEFGH'.charAt(i);
        return '<tr><td class="eq-letter">' + L + '</td><td>' + esc(it) + '</td>' +
          (ia ? '<td class="eq-tick is-in">' + tickBtn(ia, 'o' + i, 'Tick ' + L + ', ' + it) + '</td>' : '<td class="eq-tick" aria-hidden="true"></td>') + '</tr>';
      }).join('') + '</tbody></table>';
    },
    // { type: 'tickGrid', head: ['Inputs', 'AND', 'OR'], rows: [['A = 1\nB = 1'], ..] }: each row's own cells fill the
    // first columns; every head after them is a column of tick boxes.
    tickGrid: function (b, ia) {
      var head = b.head || [], rows = b.rows || [], nGiven = gridGiven(b);
      return '<div class="eq-wrap">' + cap(b) + '<table class="eq-table eq-grid"><thead><tr>' +
        head.map(function (h, i) { return '<th' + (i >= nGiven ? ' class="eq-tc"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r, ri) {
          var h = '<tr>';
          for (var c = 0; c < head.length; c++) {
            if (c < nGiven) h += '<td class="eq-gl">' + esc(r[c] == null ? '' : r[c]) + '</td>';
            else h += '<td class="eq-tc">' + (ia ? tickBtn(ia, 'r' + ri + 'c' + c, 'Tick ' + head[c] + ' for row ' + (ri + 1) + ', ' + oneLine(r.join(', '))) : '') + '</td>';
          }
          return h + '</tr>';
        }).join('') + '</tbody></table></div>';
    },
    // { type: 'line', label: 'Logic gate' }: one answer line, "Logic gate ........" on the paper.
    line: function (b, ia) {
      return '<div class="eq-line"><span>' + esc(b.label || '') + '</span>' +
        (ia ? cellIn(ia, 'v', 60, b.label || 'Answer', null, b.mono) : '<span class="eq-line-dots"></span>') + '</div>';
    },
    // { type: 'expr', text: '- * 3 4 5', label?: 'Prefix' }: one expression, large and monospace.
    expr: function (b) {
      return '<div class="eq-expr">' + (b.label ? '<span>' + esc(b.label) + ':</span>' : '') + '<code>' + esc(b.text) + '</code></div>';
    },
    // { type: 'tree', prefix: '+ A * B C' }: an expression tree.
    tree: function (b) { return '<div class="eq-tree">' + treeSvg(b.prefix) + '</div>'; },
    // { type: 'lines', rows?: 3 }: answer lines for writing; the game mounts the answer box here.
    lines: function (b, ia, bi) {
      if (ia) return '<div class="eq-lines" data-lines="' + bi + '"></div>';
      var h = '', n = Math.max(1, Math.min(8, Number(b.rows) || 2));
      for (var i = 0; i < n; i++) h += '<span class="eq-lines-paper"></span>';
      return '<div class="eq-lines">' + h + '</div>';
    },
    gate: function (b) {
      var g = String(b.gate || '').toUpperCase();
      return '<div class="eq-gate">' + gateSvg(g, b) + (b.showName ? '<span class="eq-gate-name">' + esc(g) + '</span>' : '') + '</div>';
    }
  };

  function draw(blocks, st, ro) {
    if (!Array.isArray(blocks) || !blocks.length) return '';
    return '<div class="eq">' + blocks.map(function (b, bi) {
      var f = b && DRAW[b.type];
      return f ? f(b, st ? { st: st, ro: !!ro, ip: 'b' + bi } : null, bi) : '';
    }).join('') + '</div>';
  }
  function html(blocks) { return draw(blocks, null); }

  function render(el, q) {
    if (!el) return;
    q = q || {};
    var h = html(q.blocks);
    if (h) { style(); el.innerHTML = h; el.classList.add('has-eq'); }
    else { el.textContent = String(q.text == null ? '' : q.text); el.classList.remove('has-eq'); }
  }

  // ---------------------------------------------------------------- answering in the blocks

  // True when a block has a space the student fills in.
  function answerable(b) {
    if (!b) return false;
    if (b.type === 'tickGrid' || b.type === 'options' || b.type === 'line' || b.type === 'lines') return true;
    if (b.type === 'truthTable' || b.type === 'table') return (b.rows || []).some(function (r) { return r.some(blank); });
    if (b.type === 'register') return !b.bits;
    if (b.type === 'sum') return !!(b.carry || b.boxes);
    return false;
  }
  function hasLines(blocks) { return (blocks || []).some(function (b) { return b && b.type === 'lines'; }); }
  // The free answer box is needed at a "lines" block, and for a question with nothing to fill in.
  function needsWriting(blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return true;
    return hasLines(blocks) || !blocks.some(answerable);
  }

  function sv(st, k) { var v = st[k]; return v == null ? '' : String(v).trim(); }

  // The plain text answer (see the format at the top). typed: the free answer box's text.
  function serialise(blocks, st, typed) {
    st = st || {}; typed = String(typed == null ? '' : typed);
    var out = [], placed = false;
    (blocks || []).forEach(function (b, bi) {
      var p = 'b' + bi, t = b && b.type;
      if (t === 'tickGrid') {
        var head = b.head || [], nG = gridGiven(b), lines = [], any = false;
        (b.rows || []).forEach(function (r, ri) {
          var ticks = [];
          for (var c = nG; c < head.length; c++) if (st[p + 'r' + ri + 'c' + c]) { ticks.push(oneLine(head[c])); any = true; }
          lines.push('Row ' + (ri + 1) + ': ' + (ticks.length ? ticks.join(', ') : 'none') + '.');
        });
        if (any) out = out.concat(lines);
      } else if (t === 'options') {
        (b.items || []).forEach(function (it, i) { if (st[p + 'o' + i]) out.push('Option ' + 'ABCDEFGH'.charAt(i) + ': ' + oneLine(it) + '.'); });
      } else if (t === 'truthTable') {
        var n = (b.inputs || []).length;
        (b.outputs || []).forEach(function (name, oi) {
          var c = n + oi, rows = b.rows || [];
          if (!rows.some(function (r) { return blank(r[c]); })) return;
          var col = '', filled = false;
          rows.forEach(function (r, ri) {
            if (!blank(r[c])) { col += String(r[c]); return; }
            var v = sv(st, p + 'r' + ri + 'c' + c);
            if (v) filled = true;
            col += v || '?';
          });
          if (filled) out.push(name + ': ' + col);
        });
      } else if (t === 'register' && !b.bits) {
        var size = b.size || 8, bits = '', got = false;
        for (var i = 0; i < size; i++) { var v = sv(st, p + 'c' + i); if (v) got = true; bits += v || '?'; }
        if (got) out.push(capName(b, 'Register') + ': ' + bits);
      } else if (t === 'table') {
        (b.rows || []).forEach(function (r, ri) {
          r.forEach(function (c, ci) {
            if (!blank(c)) return;
            var v = sv(st, p + 'r' + ri + 'c' + ci);
            if (!v) return;
            out.push((ci > 0 && !blank(r[0]) ? oneLine(r[0]) : oneLine((b.head || [])[ci] || 'Answer') + ', row ' + (ri + 1)) + ': ' + v);
          });
        });
      } else if (t === 'sum' && (b.carry || b.boxes)) {
        var w = (b.rows || []).reduce(function (m, r) { return Math.max(m, String(r).length); }, 0);
        var row = function (pre, empty) {
          var s = '', got = false;
          for (var j = 0; j < w; j++) { var v = sv(st, p + pre + j); if (v) got = true; s += v || empty; }
          return got ? s : '';
        };
        var carry = b.carry ? row('k', '0') : '', ans = b.boxes ? row('s', '?') : '';
        if (carry) out.push('Carry: ' + carry);
        if (ans) out.push('Answer: ' + ans);
      } else if (t === 'line') {
        var lv = sv(st, p + 'v');
        if (lv) out.push(oneLine(b.label || 'Answer') + ': ' + lv);
      } else if (t === 'lines') {
        if (!placed && typed.trim()) out.push(typed.replace(/\s+$/, ''));
        placed = true;
      }
    });
    if (!placed && typed.trim()) out.unshift(typed.replace(/\s+$/, ''));
    return out.join('\n');
  }

  function answerUI(qEl, ansEl, q, opts) {
    opts = opts || {};
    q = q || {};
    var blocks = Array.isArray(q.blocks) && q.blocks.length ? q.blocks : null;
    var st = {}, ro = !!opts.readOnly, box = null, k;
    if (opts.state && typeof opts.state === 'object') for (k in opts.state) st[k] = opts.state[k];
    var live = !!blocks && blocks.some(answerable);
    style();
    if (live) { qEl.innerHTML = draw(blocks, st, ro); qEl.classList.add('has-eq'); }
    else render(qEl, q);
    var writing = needsWriting(blocks);
    var host = live && hasLines(blocks) ? qEl.querySelector('[data-lines]') : null;
    if (ansEl) ansEl.hidden = !writing || !!host;
    if (opts.labelEl) opts.labelEl.hidden = !writing || !!host;
    var api;
    var changed = function () { if (typeof opts.onChange === 'function') opts.onChange(api.text(), api.doc(), api.state()); };
    if (writing && window.BCAnswerBox && (host || ansEl)) {
      var linesBlock = (blocks || []).filter(function (b) { return b.type === 'lines'; })[0];
      box = window.BCAnswerBox.mount(host || ansEl, { doc: opts.doc, text: opts.text || '', rows: linesBlock ? Math.max(2, Number(linesBlock.rows) || 3) : 3,
        maxLength: 800, label: opts.label, readOnly: ro, placeholder: opts.placeholder, onChange: function () { changed(); } });
      if (ro) box.setReadOnly(true);
    }
    var bitsIn = function () { return Array.prototype.slice.call(qEl.querySelectorAll('input[data-mode="bit"]')); };
    if (live) {
      qEl.addEventListener('input', function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'INPUT' || !t.hasAttribute('data-k')) return;
        if (t.getAttribute('data-mode') === 'bit') {
          var clean = String(t.value).replace(/[^01]/g, '').slice(-1);
          if (clean !== t.value) t.value = clean;
          if (clean) {
            // On to the next box, as when writing along a row of bits.
            var all = bitsIn(), at = all.indexOf(t);
            if (at >= 0 && at + 1 < all.length && !all[at + 1].readOnly) { try { all[at + 1].focus(); all[at + 1].select(); } catch (er) {} }
          }
        }
        st[t.getAttribute('data-k')] = t.value;
        changed();
      });
      qEl.addEventListener('keydown', function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'INPUT' || t.getAttribute('data-mode') !== 'bit') return;
        if (e.key === 'Backspace' && !t.value) {
          var all = bitsIn(), at = all.indexOf(t);
          if (at > 0) { e.preventDefault(); all[at - 1].focus(); }
        }
      });
      qEl.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('button.eq-tk') : null;
        if (!b || b.disabled || !qEl.contains(b)) return;
        var key = b.getAttribute('data-k'), on = !st[key];
        if (on) st[key] = 1; else delete st[key];
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? TICK : '';
        changed();
      });
    }
    api = {
      text: function () { return live ? serialise(blocks, st, box ? box.text() : '') : (box ? box.text() : ''); },
      doc: function () { return box ? box.doc() : null; },
      state: function () { var o = {}; for (var kk in st) o[kk] = st[kk]; return o; },
      filled: function () { return !!String(api.text()).trim(); },
      setReadOnly: function (v) {
        ro = !!v;
        Array.prototype.forEach.call(qEl.querySelectorAll('[data-k]'), function (n) { if (n.tagName === 'INPUT') n.readOnly = ro; else n.disabled = ro; });
        if (box) box.setReadOnly(ro);
      },
      focus: function () {
        if (box && !host) { box.focus(); return; }
        var first = qEl.querySelector('input[data-k]:not([readonly]),button.eq-tk:not([disabled])');
        if (first) first.focus(); else if (box) box.focus();
      }
    };
    return api;
  }

  var api = { html: html, render: render, gateSvg: gateSvg, css: CSS, answerUI: answerUI, serialise: serialise,
    needsWriting: needsWriting, answerable: answerable };
  if (typeof window !== 'undefined') window.BCExamQuestion = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
