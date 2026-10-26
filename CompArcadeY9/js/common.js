// Contest 2 Arcade shared pieces: element helpers, icons, the code box, answer matching, saved bests, the height
// report for lesson embeds and the result report for the teacher.
// Timers use setTimeout and Date.now(), never requestAnimationFrame: a lesson preloads the app in a hidden iframe.
var CA = (function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var embed = params.get('embed') === '1';

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>'; }
  var ICON = {
    check: svg('M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z'),
    next: svg('M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z'),
    again: svg('M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z'),
    back: svg('M15.4 16.6 10.8 12l4.6-4.6L14 6l-6 6 6 6z'),
    clock: svg('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z'),
    flame: svg('M13.5.7s.7 2.5.7 4.6c0 2-1.3 3.6-3.3 3.6S7.4 7.3 7.4 5.3l.1-.4C5.5 7.3 4.3 10.4 4.3 13.8c0 4.3 3.5 7.8 7.7 7.8s7.7-3.5 7.7-7.8C19.7 8.6 17.2 3.9 13.5.7zM11.7 18.8c-1.6 0-2.8-1.2-2.8-2.8 0-1.4.9-2.4 2.5-2.7 1.6-.3 3.2-1.1 4.1-2.3.4 1.2.6 2.5.6 3.8 0 2.2-2 4-4.4 4z'),
    star: svg('M12 17.3 18.2 21l-1.6-7L22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7z'),
    flag: svg('M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z'),
    heart: svg('M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5z'),
    lock: svg('M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9zm3 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z'),
    unlock: svg('M18 8h-8V6a2 2 0 0 1 4 0h2a4 4 0 0 0-8 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z'),
    bolt: svg('M11 21h-1l1-7H7.5c-.6 0-.6-.3-.4-.6L13 3h1l-1 7h3.5c.5 0 .6.3.4.6z'),
    trophy: svg('M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v1a5 5 0 0 0 4.4 5A5 5 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5 5 0 0 0 3.6-2.9A5 5 0 0 0 21 8V7a2 2 0 0 0-2-2zM5 8V7h2v3.8A3 3 0 0 1 5 8zm14 0a3 3 0 0 1-2 2.8V7h2z'),
    undo: svg('M12.5 8c-2.6 0-5 1-6.9 2.6L2 7v9h9l-3.6-3.6A8 8 0 0 1 20.1 16l2.4-.8A10.5 10.5 0 0 0 12.5 8z')
  };

  // ------------------------------------------------------------------ the code box (ACSL pseudocode)
  var KW = /\b(FOR|TO|STEP|NEXT|WHILE|END WHILE|IF|THEN|ELSE|END IF|OUTPUT|INPUT|END)\b/g;
  function highlight(line) {
    return String(line).split('"').map(function (p, i) {
      if (i % 2) return '<span class="s">"' + esc(p) + '"</span>';
      return esc(p).replace(/\b(\d+(\.\d+)?)\b/g, '<span class="n">$1</span>').replace(KW, '<span class="k">$1</span>')
        .replace(/\b(int|abs|sqrt)\(/g, '<span class="f">$1</span>(');
    }).join('');
  }
  function codeBox(lines, cls) {
    var box = el('div', { class: 'code' + (cls ? ' ' + cls : '') });
    lines.forEach(function (line, i) {
      var row = el('div', { class: 'code-line' });
      row.appendChild(el('span', { class: 'ln' }, String(i + 1)));
      row.appendChild(el('span', { class: 'src' }, highlight(line).replace(/^( +)/, function (m) { return '&nbsp;'.repeat(m.length); })));
      box.appendChild(row);
    });
    return box;
  }
  // A question's body: the program as a code box, anything else as one expression line.
  function questionBody(q, cls) {
    if (q.topic === 'loops') return codeBox(String(q.code).split('\n'), cls);
    return el('div', { class: 'expr' + (cls ? ' ' + cls : '') }, esc(q.code));
  }

  // ------------------------------------------------------------------ answers
  // Equivalent forms are accepted: spaces anywhere, capital letters, ^ for the up arrow, "x =" in front of a
  // bit string, the minus sign. Bit strings keep every bit, as ACSL asks: 110 is not 00110.
  var NUMERIC = /^-?\d+(\.\d+)?$/;
  function clean(s) { return String(s == null ? '' : s).replace(/[\u2212\u2013]/g, '-').replace(/\u2191/g, '^').trim(); }
  function accept(q, typed) {
    var t = clean(typed), a = clean(q.answer);
    if (!t) return false;
    if (q.kind === 'bits-eval' || q.kind === 'bits-solve') {
      t = t.replace(/\s+/g, '').replace(/^x=/i, '');
      return t === a.replace(/\s+/g, '');
    }
    if (q.kind === 'loop') {
      t = t.replace(/^["'“”]|["'“”]$/g, '').trim();
      if (NUMERIC.test(a)) { var n = t.replace(/\s+/g, ''); return NUMERIC.test(n) && Math.abs(Number(n) - Number(a)) < 1e-9; }
      return t.toLowerCase() === a.toLowerCase();
    }
    if (NUMERIC.test(a)) { var m = t.replace(/\s+/g, '').replace(/^\+/, ''); return NUMERIC.test(m) && Number(m) === Number(a); }
    return t.replace(/\s+/g, '').toLowerCase() === a.replace(/\s+/g, '').toLowerCase();
  }
  var FORMAT = { 'bits-eval': 'Type all 5 bits', 'bits-solve': 'Type 5 characters: 0, 1 or *', 'to-postfix': 'Type the postfix expression',
    'to-prefix': 'Type the prefix expression', 'pre-to-post': 'Type the postfix expression', 'post-to-pre': 'Type the prefix expression',
    'prefix-eval': 'Type a number', 'postfix-eval': 'Type a number', 'loop': 'Type what it outputs' };
  function format(q) { return FORMAT[q.kind] || 'Type the answer'; }
  var TOPIC = { notation: 'Prefix, Infix and Postfix', bits: 'Bit-String Flicking', loops: 'What Does This Program Do?' };

  // ------------------------------------------------------------------ saved bests (this browser only)
  function store(kind) { try { return kind === 'session' ? window.sessionStorage : window.localStorage; } catch (e) { return null; } }
  function load(key, fallback, kind) {
    try { var s = store(kind); var v = s && s.getItem('bc-comparcade-y9:' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value, kind) { try { var s = store(kind); if (s) s.setItem('bc-comparcade-y9:' + key, JSON.stringify(value)); } catch (e) {} }
  function clear(key, kind) { try { var s = store(kind); if (s) s.removeItem('bc-comparcade-y9:' + key); } catch (e) {} }

  function clockText(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
  function pop(target, text, bad) {
    var p = el('span', { class: 'pop' + (bad ? ' bad' : '') }, esc(text));
    target.appendChild(p);
    setTimeout(function () { p.remove(); }, 900);
  }
  function chip(icon, label, id) { return '<span class="chip" id="' + id + '">' + icon + '<span class="lbl">' + label + '</span><b>0</b></span>'; }
  function setChip(root, id, text) { var b = root.querySelector('#' + id + ' b'); if (b) b.textContent = text; }

  // An answer box with its own Enter key.
  function answerRow(id, label, onEnter, wide) {
    var row = el('div', { class: 'answer-row' });
    row.appendChild(el('label', { for: id }, esc(label)));
    var input = el('input', { id: id, type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', class: wide ? 'wide' : '' });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } });
    row.appendChild(input);
    return { row: row, input: input };
  }

  // ------------------------------------------------------------------ the page height (lesson embeds) and results
  function reportHeight() {
    if (window.parent === window) return;
    var main = document.getElementById('app');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 12 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.getElementById('app'));
  window.addEventListener('load', reportHeight);
  // After every round: the round's summary, saved by the lesson slide as its answer.
  function report(questionId, label, summary, complete) {
    if (window.parent === window) return;
    try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: questionId, label: label, summary: summary, complete: !!complete }, '*'); } catch (e) {}
  }
  function focus(input) { if (!input) return; try { if (!document.hidden) input.focus({ preventScroll: true }); } catch (e) {} }

  return { params: params, embed: embed, el: el, esc: esc, ICON: ICON, codeBox: codeBox, questionBody: questionBody, accept: accept,
    format: format, TOPIC: TOPIC, load: load, save: save, clear: clear, clockText: clockText, pop: pop, chip: chip, setChip: setChip,
    answerRow: answerRow, reportHeight: reportHeight, report: report, focus: focus };
})();
