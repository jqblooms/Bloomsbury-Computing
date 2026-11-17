// Answer box: a monospace typing box with an optional table, like the notepad's text and tables
// (James, 2026-11-17). One copy of this file serves both repos: pages load it as shared/answer-box.js and the shell
// gets it as js/generated/answer-box.html (tools/build-generated.mjs), so keep it plain ES5 with no slash pair inside
// a string (the shell's HtmlService strips from one to the end of the line).
//
//   var box = BCAnswerBox.mount(host, { doc: doc | null, text: '...', placeholder: '...', label: '...', onChange: fn(text, doc) })
//   box.text()  the answer as plain text (BCAnswerBox.serialise(box.doc()))
//   box.doc()   { before: '', table: null | { rows: [['1', '0', ...], ...] }, after: '' }
//   box.setReadOnly(true | false), box.focus()
//   BCAnswerBox.serialise(doc) -> plain text: the text, then one line per table row (cells padded to the column's
//     width and joined by single spaces, empty rows and columns left out), then the text after the table.
//
// Keys: Tab in the text inserts spaces. In the table: Tab and Shift+Tab, Enter, the arrow keys at a cell's edge,
// Space at the end of a cell and Backspace in an empty cell move between cells. PageUp and PageDown are never used.
(function () {
  'use strict';
  if (window.BCAnswerBox) return;

  var DEFAULT_ROWS = 4, DEFAULT_COLS = 8, MAX_ROWS = 12, MAX_COLS = 16, CELL_MAX = 6, TAB_SPACES = '    ';

  var CSS = [
    '.bc-ab { display: grid; gap: 6px; min-width: 0; }',
    '.bc-ab-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; min-height: 26px; }',
    '.bc-ab-bar[hidden] { display: none; }',
    '.bc-ab-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; padding: 0 9px; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface-2); color: var(--ink); font: 600 12.5px var(--font-body, inherit); cursor: pointer; }',
    '.bc-ab-btn:hover { border-color: var(--brand); color: var(--brand); }',
    '.bc-ab-btn:disabled { opacity: .45; cursor: default; }',
    '.bc-ab-btn.is-step { padding: 0; font: 700 15px var(--font-mono); }',
    '.bc-ab-group { display: inline-flex; align-items: center; gap: 3px; color: var(--muted); font-size: 12.5px; }',
    '.bc-ab-group span { margin-right: 2px; }',
    '.bc-ab-text { display: block; box-sizing: border-box; width: 100%; min-width: 0; margin: 0; padding: 8px 10px; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--surface); color: var(--ink); font-family: var(--font-mono); font-size: 12.5px; line-height: 1.55; white-space: pre; overflow-x: auto; overflow-wrap: normal; tab-size: 4; -moz-tab-size: 4; resize: vertical; }',
    '.bc-ab-text:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand); }',
    '.bc-ab-text[readonly] { background: var(--surface-2); }',
    '.bc-ab-grid { max-width: 100%; overflow-x: auto; scrollbar-width: thin; }',
    '.bc-ab-grid table { border-collapse: collapse; table-layout: auto; background: var(--surface); color: var(--ink); font-family: var(--font-mono); font-size: 12.5px; }',
    '.bc-ab-grid td { height: 19px; padding: 0; border: 1px solid var(--line-strong); }',
    '.bc-ab-grid td:focus-within { background: var(--surface-2); box-shadow: inset 0 0 0 2px var(--brand); }',
    '.bc-ab-cell { display: block; box-sizing: content-box; width: 1ch; min-width: 1ch; height: 19px; margin: 0; padding: 0 6px; border: 0; outline: none; background: transparent; color: inherit; font: inherit; line-height: 19px; text-align: center; }',
    '.bc-ab-cell[readonly] { cursor: default; }'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('bc-ab-style')) return;
    var st = document.createElement('style');
    st.id = 'bc-ab-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function emptyRows(nr, nc) {
    var rows = [];
    for (var r = 0; r < nr; r++) { var row = []; for (var c = 0; c < nc; c++) row.push(''); rows.push(row); }
    return rows;
  }

  function cleanDoc(doc, text) {
    if (!doc || typeof doc !== 'object') return { before: String(text == null ? '' : text), table: null, after: '' };
    var out = { before: String(doc.before == null ? '' : doc.before), table: null, after: String(doc.after == null ? '' : doc.after) };
    var rows = doc.table && Array.isArray(doc.table.rows) ? doc.table.rows : null;
    if (rows && rows.length) {
      var nc = 1;
      rows.forEach(function (r) { if (Array.isArray(r)) nc = Math.max(nc, r.length); });
      nc = Math.min(nc, MAX_COLS);
      out.table = { rows: rows.slice(0, MAX_ROWS).map(function (r) {
        var row = [];
        for (var c = 0; c < nc; c++) row.push(String((Array.isArray(r) && r[c] != null) ? r[c] : '').replace(/\s+/g, '').slice(0, CELL_MAX));
        return row;
      }) };
    }
    return out;
  }

  function padStart(s, w) { while (s.length < w) s = ' ' + s; return s; }

  // The table as aligned rows of plain text: a row of single bits reads "1 1 0 0 0 0 0 0".
  function tableLines(table) {
    if (!table || !table.rows || !table.rows.length) return [];
    var rows = table.rows, nc = 0;
    rows.forEach(function (r) { nc = Math.max(nc, r.length); });
    var cols = [];
    for (var c = 0; c < nc; c++) {
      var w = 0;
      rows.forEach(function (r) { w = Math.max(w, String(r[c] || '').trim().length); });
      if (w) cols.push({ c: c, w: w });
    }
    if (!cols.length) return [];
    var lines = [];
    rows.forEach(function (r) {
      var cells = cols.map(function (k) { return String(r[k.c] || '').trim(); });
      if (!cells.some(function (v) { return v; })) return;
      lines.push(cells.map(function (v, i) { return padStart(v, cols[i].w); }).join(' ').replace(/\s+$/, ''));
    });
    return lines;
  }

  function serialise(doc) {
    doc = cleanDoc(doc);
    var parts = [];
    var before = doc.before.replace(/\s+$/, '');
    if (before) parts.push(before);
    var lines = tableLines(doc.table);
    if (lines.length) parts.push(lines.join('\n'));
    var after = doc.after.replace(/^\s*\n/, '').replace(/\s+$/, '');
    if (after) parts.push(after);
    return parts.join('\n');
  }

  function insertText(el, s) {
    el.focus();
    var done = false;
    try { done = document.execCommand('insertText', false, s); } catch (e) {}
    if (!done) {
      var a = el.selectionStart, b = el.selectionEnd;
      el.setRangeText(s, a, b, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function mount(host, opts) {
    opts = opts || {};
    injectCss();
    var doc = cleanDoc(opts.doc, opts.text);
    var readOnly = !!opts.readOnly;
    var label = opts.label || 'Your answer';

    var root = el('div', 'bc-ab');
    var bar = el('div', 'bc-ab-bar');
    var before = el('textarea', 'bc-ab-text', { rows: String(opts.rows || 3), wrap: 'off', spellcheck: 'false', 'aria-label': label });
    if (opts.maxLength) before.maxLength = opts.maxLength;
    if (opts.placeholder) before.placeholder = opts.placeholder;
    var grid = el('div', 'bc-ab-grid');
    var after = el('textarea', 'bc-ab-text', { rows: '2', wrap: 'off', spellcheck: 'false', 'aria-label': label + ', after the table', placeholder: 'Type more here if you need to' });
    root.appendChild(bar); root.appendChild(before); root.appendChild(grid); root.appendChild(after);
    host.innerHTML = '';
    host.appendChild(root);

    function changed() { if (typeof opts.onChange === 'function') opts.onChange(serialise(doc), api.doc()); }

    function fit(t) {
      var lines = t.value.split('\n').length + 1;
      var min = t === before ? (opts.rows || 3) : 2;
      t.rows = Math.max(min, Math.min(16, lines));
    }

    function renderBar() {
      bar.innerHTML = '';
      bar.hidden = readOnly;
      if (readOnly) return;
      if (!doc.table) {
        var b = el('button', 'bc-ab-btn', { type: 'button', 'data-ab': 'table', title: 'Add a table to type into, one digit per box' });
        b.textContent = 'Table';
        bar.appendChild(b);
        return;
      }
      var nr = doc.table.rows.length, nc = doc.table.rows[0].length;
      var step = function (act, text, aria, off) {
        var s = el('button', 'bc-ab-btn is-step', { type: 'button', 'data-ab': act, 'aria-label': aria, title: aria });
        s.textContent = text;
        s.disabled = !!off;
        return s;
      };
      var rows = el('span', 'bc-ab-group'), rl = el('span'); rl.textContent = 'Rows';
      rows.appendChild(rl);
      rows.appendChild(step('row-', '-', 'Remove the bottom row', nr <= 1));
      rows.appendChild(step('row+', '+', 'Add a row at the bottom', nr >= MAX_ROWS));
      var cols = el('span', 'bc-ab-group'), cl = el('span'); cl.textContent = 'Columns';
      cols.appendChild(cl);
      cols.appendChild(step('col-', '-', 'Remove the left column', nc <= 1));
      cols.appendChild(step('col+', '+', 'Add a column on the left', nc >= MAX_COLS));
      var rm = el('button', 'bc-ab-btn', { type: 'button', 'data-ab': 'remove', title: 'Remove the table (what you typed in it stays as text)' });
      rm.textContent = 'Remove table';
      bar.appendChild(rows); bar.appendChild(cols); bar.appendChild(rm);
    }

    function sizeCell(inp) { inp.style.width = Math.max(1, inp.value.length) + 'ch'; }

    function renderGrid() {
      grid.innerHTML = '';
      grid.hidden = !doc.table;
      after.hidden = !doc.table;
      if (!doc.table) return;
      var table = el('table', '', { role: 'grid', 'aria-label': label + ', table' });
      var tbody = el('tbody');
      doc.table.rows.forEach(function (row, r) {
        var tr = el('tr');
        row.forEach(function (v, c) {
          var td = el('td');
          var inp = el('input', 'bc-ab-cell', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
            'aria-label': 'Row ' + (r + 1) + ', column ' + (c + 1), 'data-r': String(r), 'data-c': String(c) });
          inp.value = v;
          inp.readOnly = readOnly;
          sizeCell(inp);
          td.appendChild(inp);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      grid.appendChild(table);
    }

    function render() {
      before.value = doc.before;
      after.value = doc.after;
      before.readOnly = after.readOnly = readOnly;
      fit(before); fit(after);
      renderBar();
      renderGrid();
    }

    function cell(r, c) { return grid.querySelector('input[data-r="' + r + '"][data-c="' + c + '"]'); }
    function focusCell(r, c, atStart) {
      var n = cell(r, c);
      if (!n) return false;
      n.focus();
      var p = atStart ? 0 : n.value.length;
      try { n.setSelectionRange(p, p); } catch (e) {}
      return true;
    }
    function focusText(t, atStart) {
      t.focus();
      var p = atStart ? 0 : t.value.length;
      try { t.setSelectionRange(p, p); } catch (e) {}
    }

    // Insert a table under the line the caret is on; the text after that line moves below the table.
    function addTable() {
      var v = before.value, at = typeof before.selectionEnd === 'number' ? before.selectionEnd : v.length;
      var end = v.indexOf('\n', at);
      if (end < 0 || !v.slice(end).trim()) end = v.length;
      doc.before = v.slice(0, end);
      doc.after = v.slice(end).replace(/^\n/, '');
      doc.table = { rows: emptyRows(DEFAULT_ROWS, DEFAULT_COLS) };
      render();
      changed();
      focusCell(0, 0, true);
    }
    function removeTable() {
      var parts = [doc.before.replace(/\s+$/, '')].concat(tableLines(doc.table)).concat([doc.after.replace(/^\s*\n/, '')]).filter(function (s) { return s; });
      doc = { before: parts.join('\n'), table: null, after: '' };
      render();
      changed();
      focusText(before);
    }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ab]');
      if (!b || readOnly) return;
      var act = b.getAttribute('data-ab');
      if (act === 'table') { addTable(); return; }
      if (act === 'remove') { removeTable(); return; }
      var rows = doc.table.rows, nc = rows[0].length;
      if (act === 'row+' && rows.length < MAX_ROWS) rows.push(emptyRows(1, nc)[0]);
      if (act === 'row-' && rows.length > 1) rows.pop();
      if (act === 'col+' && nc < MAX_COLS) rows.forEach(function (r) { r.unshift(''); });
      if (act === 'col-' && nc > 1) rows.forEach(function (r) { r.shift(); });
      renderBar();
      renderGrid();
      changed();
    });

    [before, after].forEach(function (t) {
      t.addEventListener('input', function () {
        if (t === before) doc.before = t.value; else doc.after = t.value;
        fit(t);
        changed();
      });
      t.addEventListener('keydown', function (e) {
        if (t.readOnly) return;
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); insertText(t, TAB_SPACES); return; }
        // From the text into the table: Down on the last line of the text above, Up on the first line of the text below.
        if (!doc.table || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
        if (t === before && e.key === 'ArrowDown' && t.value.indexOf('\n', t.selectionEnd) < 0) { e.preventDefault(); focusCell(0, 0, true); }
        else if (t === after && e.key === 'ArrowUp' && t.value.lastIndexOf('\n', t.selectionStart - 1) < 0) { e.preventDefault(); focusCell(doc.table.rows.length - 1, 0, true); }
      });
    });

    grid.addEventListener('input', function (e) {
      var inp = e.target.closest('.bc-ab-cell');
      if (!inp || !doc.table) return;
      var r = +inp.getAttribute('data-r'), c = +inp.getAttribute('data-c'), row = doc.table.rows[r];
      // A space that reached the cell (phones and on-screen keyboards send no Space key) moves on like Space does:
      // what comes after it goes into the next cells along the row.
      var parts = inp.value.split(/\s+/);
      row[c] = parts[0].slice(0, CELL_MAX);
      if (parts.length > 1) {
        for (var i = 1; i < parts.length && c + i < row.length; i++) if (parts[i]) row[c + i] = parts[i].slice(0, CELL_MAX);
        renderGrid();
        changed();
        focusCell(r, Math.min(row.length - 1, c + parts.length - 1));
        return;
      }
      if (row[c] !== inp.value) inp.value = row[c];
      sizeCell(inp);
      changed();
    });
    grid.addEventListener('keydown', function (e) {
      var inp = e.target.closest('.bc-ab-cell');
      if (!inp || !doc.table || e.ctrlKey || e.altKey || e.metaKey) return;
      var r = +inp.getAttribute('data-r'), c = +inp.getAttribute('data-c');
      var nr = doc.table.rows.length, nc = doc.table.rows[0].length;
      var s = inp.selectionStart, en = inp.selectionEnd, len = inp.value.length;
      var next = function () {
        if (c + 1 < nc) return focusCell(r, c + 1, true);
        if (r + 1 < nr) return focusCell(r + 1, 0, true);
        return false;
      };
      var prev = function () {
        if (c > 0) return focusCell(r, c - 1);
        if (r > 0) return focusCell(r - 1, nc - 1);
        return false;
      };
      var k = e.key;
      if (k === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) { if (!prev()) focusText(before); return; }
        if (next()) return;
        if (!readOnly && nr < MAX_ROWS) { doc.table.rows.push(emptyRows(1, nc)[0]); renderBar(); renderGrid(); changed(); focusCell(nr, 0, true); }
        else focusText(after, true);
        return;
      }
      if (k === 'Enter') { e.preventDefault(); if (r + 1 < nr) focusCell(r + 1, c, true); else focusText(after, true); return; }
      if (k === 'Escape') { e.preventDefault(); focusText(after, true); return; }
      if (k === 'ArrowUp') { e.preventDefault(); if (r > 0) focusCell(r - 1, c); else focusText(before); return; }
      if (k === 'ArrowDown') { e.preventDefault(); if (r + 1 < nr) focusCell(r + 1, c); else focusText(after, true); return; }
      if (e.shiftKey) return;
      if (k === 'ArrowLeft' && s === 0 && en === 0) { if (prev()) e.preventDefault(); return; }
      if (k === 'ArrowRight' && s === len && en === len) { if (next()) e.preventDefault(); return; }
      if (k === ' ' || k === 'Spacebar') { e.preventDefault(); if (s === len) next(); return; }
      if (k === 'Backspace' && !len) { if (prev()) e.preventDefault(); return; }
    });
    // Pasting a row of digits ("11000110" or "1 1 0 0 0 1 1 0") fills the cells from this one along the row.
    grid.addEventListener('paste', function (e) {
      var inp = e.target.closest('.bc-ab-cell');
      if (!inp || readOnly || !doc.table) return;
      var t = ((e.clipboardData || window.clipboardData) && (e.clipboardData || window.clipboardData).getData('text')) || '';
      var lines = t.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
      if (!lines.length || (lines.length === 1 && !/\s/.test(lines[0].trim()) && lines[0].trim().length <= 1)) return;
      e.preventDefault();
      var r0 = +inp.getAttribute('data-r'), c0 = +inp.getAttribute('data-c'), rows = doc.table.rows;
      lines.forEach(function (line, i) {
        var r = r0 + i;
        if (r >= rows.length) return;
        var bits = line.trim();
        var cells = /\s/.test(bits) ? bits.split(/\s+/) : bits.split('');
        cells.forEach(function (v, j) { if (c0 + j < rows[r].length) rows[r][c0 + j] = v.slice(0, CELL_MAX); });
      });
      renderGrid();
      changed();
      focusCell(r0, c0);
    });

    var api = {
      el: root,
      text: function () { return serialise(doc); },
      doc: function () { return JSON.parse(JSON.stringify(doc)); },
      setReadOnly: function (b) {
        readOnly = !!b;
        before.readOnly = after.readOnly = readOnly;
        Array.prototype.forEach.call(grid.querySelectorAll('.bc-ab-cell'), function (n) { n.readOnly = readOnly; });
        renderBar();
      },
      focus: function () {
        if (doc.table && !doc.before.trim()) { focusCell(0, 0, true); return; }
        focusText(before);
      },
      // Where the caret is, to put it back after the host redraws: [which box, row, column, caret].
      caret: function () {
        var a = document.activeElement;
        if (!a || !root.contains(a)) return null;
        var p = a.selectionStart || 0;
        if (a === before) return ['b', 0, 0, p];
        if (a === after) return ['a', 0, 0, p];
        return ['c', +a.getAttribute('data-r'), +a.getAttribute('data-c'), p];
      },
      restoreCaret: function (k) {
        if (!k) return;
        var n = k[0] === 'b' ? before : k[0] === 'a' ? after : cell(k[1], k[2]);
        if (!n) return;
        try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); }
        try { n.setSelectionRange(k[3], k[3]); } catch (e) {}
      }
    };
    host.__bcAnswerBox = api;
    render();
    return api;
  }

  window.BCAnswerBox = { mount: mount, serialise: serialise, tableLines: tableLines, cleanDoc: cleanDoc, DEFAULT_ROWS: DEFAULT_ROWS, DEFAULT_COLS: DEFAULT_COLS };
})();
