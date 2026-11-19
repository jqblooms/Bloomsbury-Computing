// Exam question renderer: draws an Exam Game question's blocks (shell ExamGame.gs, examGameBlocksText_ lists them) the
// way the exam paper does: black-ruled tables and truth tables, ANSI gate symbols, register boxes, binary addition in
// columns, code and tick-box options. Used by every game that shows Exam Game questions (TowerDefence/, BridgeBuilder/).
//   BCExamQuestion.html(blocks)        -> HTML string ('' when there are no blocks)
//   BCExamQuestion.render(el, q)       -> draws q.blocks into el (or q.text as plain lines when there are none)
//   BCExamQuestion.gateSvg(gate, opts) -> one gate symbol as SVG ({ inputs: ['A','B'], output: 'X' })
// Blanks the student works out (null truth table cells, empty registers, the carry row and answer boxes of a sum) are
// drawn empty: the blocks never hold an answer. Colours come from the site theme (bc-theme.css), so it reads in both themes.
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
    '.eq-gate{display:flex;flex-direction:column;align-items:flex-start;gap:4px}' +
    '.eq-gate svg{display:block;width:240px;max-width:100%;height:auto;color:var(--ink)}' +
    '.eq-gate-name{font:700 16px/1 var(--font-body,sans-serif);color:var(--ink);margin-left:84px}';

  function style() {
    if (typeof document === 'undefined' || document.getElementById('bc-eq-style')) return;
    var s = document.createElement('style');
    s.id = 'bc-eq-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  var HEADS = { tc: [-128, 64, 32, 16, 8, 4, 2, 1], bin: [128, 64, 32, 16, 8, 4, 2, 1] };
  var GATES = ['NOT', 'AND', 'OR', 'NAND', 'NOR', 'XOR'];

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

  var DRAW = {
    para: function (b) { return '<p class="eq-para">' + esc(b.text) + '</p>'; },
    table: function (b) {
      var hl = {};
      (b.highlight || []).forEach(function (rc) { hl[rc[0] + ',' + rc[1]] = 1; });
      return '<div class="eq-wrap">' + cap(b) + '<table class="eq-table"><thead><tr>' +
        (b.head || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        (b.rows || []).map(function (r, ri) {
          return '<tr>' + r.map(function (c, ci) {
            var cls = (blank(c) ? 'is-blank' : '') + (hl[ri + ',' + ci] ? ' is-hl' : '');
            return '<td' + (cls ? ' class="' + cls.trim() + '"' : '') + '>' + (blank(c) ? '' : esc(c)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    },
    truthTable: function (b) {
      var n = (b.inputs || []).length;
      var th = (b.inputs || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
        (b.outputs || []).map(function (h, i) { return '<th' + (i === 0 ? ' class="is-out"' : '') + '>' + esc(h) + '</th>'; }).join('');
      return '<div class="eq-wrap">' + cap(b) + '<table class="eq-tt"><thead><tr>' + th + '</tr></thead><tbody>' +
        (b.rows || []).map(function (r) {
          return '<tr>' + r.map(function (v, i) {
            return '<td' + (i === n ? ' class="is-out"' : '') + (blank(v) ? ' aria-label="blank"' : '') + '>' + (blank(v) ? '' : esc(v)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    },
    register: function (b) {
      var bits = b.bits ? String(b.bits) : '', size = b.size || bits.length || 8;
      var heads = typeof b.heads === 'string' ? HEADS[b.heads] : b.heads, cells = '', hd = '';
      for (var i = 0; i < size; i++) {
        var c = bits.charAt(i);
        cells += '<td' + (c === '0' || c === '1' ? '' : ' aria-label="blank"') + '>' + (c === '0' || c === '1' ? c : '') + '</td>';
        if (heads) hd += '<th>' + esc(heads[i] == null ? '' : heads[i]) + '</th>';
      }
      var t = '<table class="eq-reg" aria-label="' + (bits ? 'Register holding ' + esc(bits) : 'Empty ' + size + '-bit register') + '">' +
        (hd ? '<thead><tr>' + hd + '</tr></thead>' : '') + '<tbody><tr>' + cells + '</tr></tbody></table>';
      return '<div class="eq-wrap"><div class="eq-reg-row">' + cap(b) + t + '</div></div>';
    },
    sum: function (b) {
      var rows = b.rows || [], w = rows.reduce(function (m, r) { return Math.max(m, String(r).length); }, 0), h = '', i, j;
      var digits = function (r, cls) {
        var s = String(r), out = '';
        for (j = 0; j < w; j++) { var k = j - (w - s.length); out += '<td class="eq-d' + (cls ? ' ' + cls : '') + '">' + (k >= 0 ? esc(s.charAt(k)) : '') + '</td>'; }
        return out;
      };
      var boxes = function (cls) { var out = ''; for (j = 0; j < w; j++) out += '<td class="eq-d eq-box' + (cls ? ' ' + cls : '') + '"></td>'; return out; };
      if (b.carry) h += '<tr class="eq-carry"><td class="eq-sign"></td>' + boxes() + '</tr>';
      for (i = 0; i < rows.length; i++) h += '<tr><td class="eq-sign">' + (i === rows.length - 1 && i ? '+' : '') + '</td>' + digits(rows[i]) + '</tr>';
      if (b.boxes) h += '<tr class="eq-rule eq-ans"><td class="eq-sign"></td>' + boxes() + '</tr>';
      else h += '<tr class="eq-rule"><td class="eq-sign"></td>' + digits('') + '</tr>';
      return '<div class="eq-wrap"><table class="eq-sum" aria-label="Binary addition: ' + esc(rows.join(' plus ')) + '">' + h + '</table></div>';
    },
    code: function (b) {
      var lines = b.lines || [];
      return '<pre class="eq-code" aria-label="' + esc(b.lang === 'python' ? 'Python program' : 'Pseudocode') + '">' + lines.map(function (l, i) {
        return (b.numbered ? '<span class="eq-ln">' + (i + 1) + '</span>' : '') + esc(l);
      }).join('\n') + '</pre>';
    },
    options: function (b) {
      return '<table class="eq-opts"><tbody>' + (b.items || []).map(function (it, i) {
        return '<tr><td class="eq-letter">' + 'ABCDEFGH'.charAt(i) + '</td><td>' + esc(it) + '</td><td class="eq-tick" aria-hidden="true"></td></tr>';
      }).join('') + '</tbody></table>';
    },
    gate: function (b) {
      var g = String(b.gate || '').toUpperCase();
      return '<div class="eq-gate">' + gateSvg(g, b) + (b.showName ? '<span class="eq-gate-name">' + esc(g) + '</span>' : '') + '</div>';
    }
  };

  function html(blocks) {
    if (!Array.isArray(blocks) || !blocks.length) return '';
    return '<div class="eq">' + blocks.map(function (b) {
      var f = b && DRAW[b.type];
      return f ? f(b) : '';
    }).join('') + '</div>';
  }

  function render(el, q) {
    if (!el) return;
    q = q || {};
    var h = html(q.blocks);
    if (h) { style(); el.innerHTML = h; el.classList.add('has-eq'); }
    else { el.textContent = String(q.text == null ? '' : q.text); el.classList.remove('has-eq'); }
  }

  var api = { html: html, render: render, gateSvg: gateSvg, css: CSS };
  if (typeof window !== 'undefined') window.BCExamQuestion = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
