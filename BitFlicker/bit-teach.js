// Bit string teaching pieces shared by Bit Flicker and Comp Arcade (Year 7). James 2026-10-28: the games are opened
// on their own, with no lesson, so each one teaches itself: the rule for the operator on screen, a worked example
// before the first round of each new operator, "Walk me through it" on every question (a SIMILAR question with
// different values, bit by bit, with why; never the student's own question or its answer), and wrong answers
// explained bit by bit. Needs BitCore (bits-core.js). Plain ES5. Timing never uses requestAnimationFrame.
var BitTeach = (function (B) {
  'use strict';
  var MOVE_RE = /^(LSHIFT|RSHIFT|LCIRC|RCIRC)-(\d+)$/;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function code(s) { return '<b class="bt-code">' + esc(s) + '</b>'; }
  function family(op) { var m = MOVE_RE.exec(op); return m ? m[1] : op; }
  function count(op) { var m = MOVE_RE.exec(op); return m ? Number(m[2]) : 0; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randBits(L) {
    var s;
    do { s = ''; for (var i = 0; i < L; i++) s += Math.random() < 0.5 ? '1' : '0'; } while (!/0/.test(s) || !/1/.test(s));
    return s;
  }

  // ------------------------------------------------ the rules, in short plain sentences
  var RULE = {
    NOT: 'NOT flips every bit: 1 becomes 0, 0 becomes 1.',
    AND: 'AND gives 1 only when both bits are 1.',
    OR: 'OR gives 1 when at least one bit is 1.',
    XOR: 'XOR gives 1 when the two bits are different.',
    LSHIFT: 'LSHIFT: every bit moves left. The left bit falls off. A 0 comes in on the right.',
    RSHIFT: 'RSHIFT: every bit moves right. The right bit falls off. A 0 comes in on the left.',
    LCIRC: 'LCIRC: every bit moves left. The bit that falls off comes back on the right.',
    RCIRC: 'RCIRC: every bit moves right. The bit that falls off comes back on the left.'
  };
  function rule(op) {
    var f = family(op), n = count(op);
    if (!MOVE_RE.test(op)) return RULE[f] || '';
    var dir = f.charAt(0) === 'L' ? 'left' : 'right', other = dir === 'left' ? 'right' : 'left', s = n === 1 ? '' : 's';
    if (/SHIFT/.test(f)) return f + '-' + n + ': every bit moves ' + n + ' place' + s + ' ' + dir + '. ' + (n === 1 ? 'The ' + dir + ' bit falls' : n + ' bits fall') + ' off. ' + (n === 1 ? 'A 0 comes' : n + ' zeros come') + ' in on the ' + other + '.';
    return f + '-' + n + ': every bit moves ' + n + ' place' + s + ' ' + dir + '. A bit that falls off comes back on the ' + other + '.';
  }
  function ruleLine(ops) {
    var seen = {}, out = [];
    ops.forEach(function (op) {
      var r = MOVE_RE.test(op) ? rule(op) : RULE[family(op)];
      if (!r || seen[r]) return;
      seen[r] = 1;
      var name = MOVE_RE.test(op) ? op : family(op);
      out.push({ name: name, text: r.replace(/^[A-Z]+(-\d+)?:\s*/, '') });
    });
    return out.map(function (r) { return '<span class="bt-rule-item"><b>' + esc(r.name) + ':</b> ' + esc(r.text) + '</span>'; }).join('');
  }

  // ------------------------------------------------ drawing rows of bits
  // marks: { index: 'hl' | 'new' | 'off' | 'pad' }
  function row(label, bits, marks) {
    marks = marks || {};
    var cells = String(bits).split('').map(function (c, i) {
      var cls = 'bt-cell' + (c === '1' ? ' one' : c === '0' ? ' zero' : c === '*' ? ' star' : c === ' ' ? ' gap' : ' empty') + (marks[i] ? ' ' + marks[i] : '');
      return '<i class="' + cls + '">' + (c === '?' || c === ' ' ? '' : c) + '</i>';
    }).join('');
    return '<div class="bt-row"><span class="bt-label">' + esc(label) + '</span><span class="bt-cells">' + cells + '</span></div>';
  }
  function col(i) { var m = {}; m[i] = 'hl'; return m; }
  function boxName(i) { return 'box ' + (i + 1); }

  // ------------------------------------------------ step by step for one operator
  // op: 'NOT', 'AND', 'OR', 'XOR', 'LSHIFT-2'...; a the bits; b the second string for AND, OR, XOR.
  function steps(op, a, b) {
    var f = family(op), out = [], L, i, res;
    if (b != null) {
      L = Math.max(a.length, b.length);
      var A = B.pad(a, L), Bb = B.pad(b, L), right = B.binop(f, a, b);
      out.push({ text: (a.length !== b.length ? 'One string is shorter, so put 0s on its left until both have ' + L + ' bits. ' : '') +
        'Line the two strings up and work <b>one column at a time</b>, left to right. Rule: ' + esc(RULE[f]),
        html: row('', A) + row(f, Bb) + '<div class="bt-line"></div>' + row('=', new Array(L + 1).join('?')) });
      for (i = 0; i < L; i++) {
        var p = A[i], q = Bb[i], r = right[i], why;
        if (f === 'AND') why = r === '1' ? 'both bits are 1, so AND gives 1.' : 'they are not both 1, so AND gives 0.';
        else if (f === 'OR') why = r === '1' ? 'at least one bit is 1, so OR gives 1.' : 'both bits are 0, so OR gives 0.';
        else why = r === '1' ? 'the bits are different, so XOR gives 1.' : 'the bits are the same, so XOR gives 0.';
        res = right.slice(0, i + 1) + new Array(L - i).join('?');
        out.push({ text: 'Column ' + (i + 1) + ': ' + code(p) + ' and ' + code(q) + '. ' + why.charAt(0).toUpperCase() + why.slice(1) + ' Write ' + code(r) + '.',
          html: row('', A, col(i)) + row(f, Bb, col(i)) + '<div class="bt-line"></div>' + row('=', res, col(i)) });
      }
      out.push({ text: 'Every column is done. ' + code(A) + ' ' + f + ' ' + code(Bb) + ' = ' + code(right) + '.', html: row('', A) + row(f, Bb) + '<div class="bt-line"></div>' + row('=', right) });
      return out;
    }
    L = a.length;
    if (f === 'NOT') {
      var nr = B.not(a);
      out.push({ text: 'Rule: ' + esc(RULE.NOT) + ' Go one bit at a time, left to right.', html: row('NOT', a) + '<div class="bt-line"></div>' + row('=', new Array(L + 1).join('?')) });
      for (i = 0; i < L; i++) {
        out.push({ text: 'Box ' + (i + 1) + ' is ' + code(a[i]) + '. NOT flips it, so write ' + code(nr[i]) + '.',
          html: row('NOT', a, col(i)) + '<div class="bt-line"></div>' + row('=', nr.slice(0, i + 1) + new Array(L - i).join('?'), col(i)) });
      }
      out.push({ text: 'Every bit is flipped. NOT ' + code(a) + ' = ' + code(nr) + '.', html: row('NOT', a) + '<div class="bt-line"></div>' + row('=', nr) });
      return out;
    }
    var n = count(op), left = f.charAt(0) === 'L', circ = /CIRC/.test(f), k = circ ? n % L : Math.min(n, L), cur = a;
    out.push({ text: 'Rule: ' + esc(rule(op)) + ' The string keeps ' + L + ' bits. Do it <b>one move at a time</b>.', html: row('start', a) });
    if (circ && n >= L) out.push({ text: L + ' moves bring ' + L + ' bits all the way round, back to the start. ' + n + ' = ' + Math.floor(n / L) + ' &times; ' + L + ' + ' + k + ', so you only need ' + k + ' move' + (k === 1 ? '' : 's') + '.', html: row('start', a) });
    if (!circ && n >= L) {
      out.push({ text: 'Shifting ' + n + ' places on ' + L + ' bits pushes every bit off the end, and only 0s come in. The answer is all 0s: ' + code(new Array(L + 1).join('0')) + '.', html: row('start', a) + row('=', new Array(L + 1).join('0')) });
      return out;
    }
    for (i = 0; i < k; i++) {
      var nxt = B.shift(f, 1, cur), offAt = left ? 0 : L - 1, inAt = left ? L - 1 : 0, m1 = {}, m2 = {};
      m1[offAt] = 'off'; m2[inAt] = 'new';
      var fell = cur[offAt];
      out.push({ text: 'Move ' + (i + 1) + ': every bit slides one place ' + (left ? 'left' : 'right') + '. The ' + (left ? 'left' : 'right') + ' bit ' + code(fell) + ' falls off. ' +
        (circ ? 'It is a circulate, so that ' + code(fell) + ' comes back on the ' + (left ? 'right' : 'left') + '.' : 'It is a shift, so it is lost and a ' + code('0') + ' comes in on the ' + (left ? 'right' : 'left') + '.'),
        html: row(i ? 'move ' + i : 'start', cur, m1) + row('move ' + (i + 1), nxt, m2) });
      cur = nxt;
    }
    out.push({ text: (k === 0 ? 'No moves are needed, so the string stays the same: ' : 'After ' + k + ' move' + (k === 1 ? '' : 's') + ': ') + op + ' ' + code(a) + ' = ' + code(cur) + '.', html: row('start', a) + row('=', cur) });
    return out;
  }

  // A similar question: the same operator and length, different bits, and nothing in it equals the student's
  // strings or their answer.
  function similar(op, a, b) {
    var cur = B.evaluate(b != null ? a + ' ' + op + ' ' + b : op + ' ' + a), avoid = [a, b, cur];
    for (var t = 0; t < 400; t++) {
      var a2 = randBits(a.length), b2 = b != null ? randBits(b.length) : null;
      var r = B.evaluate(b2 != null ? a2 + ' ' + op + ' ' + b2 : op + ' ' + a2);
      if (r === a2 && t < 300) continue;
      // A shift past the end always gives 0s, so only that answer may repeat.
      if ([a2, b2, r].some(function (s) { return s != null && avoid.indexOf(s) >= 0 && !(t > 350 && s === cur && /^0+$/.test(s)); })) continue;
      return { op: op, a: a2, b: b2, answer: r };
    }
    return null;
  }

  // ------------------------------------------------ why a wrong answer is wrong, bit by bit
  function wrongWhy(op, a, b, given, right) {
    var f = family(op), L = right.length, out = [];
    if (b != null) { a = B.pad(a, L); b = B.pad(b, L); }
    for (var i = 0; i < L && out.length < 2; i++) {
      if (given[i] === right[i]) continue;
      var s = '<b>Box ' + (i + 1) + '</b> should be ' + code(right[i]) + ': ';
      if (b != null) {
        s += a[i] + ' ' + f + ' ' + b[i] + ' = ' + right[i] + ', because ' +
          (f === 'AND' ? (right[i] === '1' ? 'both are 1.' : 'AND needs both bits to be 1.') :
           f === 'OR' ? (right[i] === '1' ? 'at least one is 1.' : 'both are 0.') :
           (right[i] === '1' ? 'they are different.' : 'they are the same.'));
      } else if (f === 'NOT') s += 'NOT flips ' + a[i] + ' to ' + right[i] + '.';
      else {
        var n = count(op), Ln = a.length, src;
        if (f === 'LSHIFT') src = i + n < Ln ? i + n : -1;
        else if (f === 'RSHIFT') src = i - n >= 0 ? i - n : -1;
        else if (f === 'LCIRC') src = (i + n) % Ln;
        else src = ((i - n) % Ln + Ln) % Ln;
        if (src < 0) s += 'a 0 comes in on the ' + (f === 'LSHIFT' ? 'right' : 'left') + ' when bits shift.';
        else s += 'every bit moves ' + n + ' place' + (n === 1 ? '' : 's') + ' ' + (f.charAt(0) === 'L' ? 'left' : 'right') + ', so this box gets ' + boxName(src) + ' of the start, a ' + a[src] + '.';
      }
      out.push(s);
    }
    var wrongCount = 0;
    for (var j = 0; j < L; j++) if (given[j] !== right[j]) wrongCount++;
    return out.join('<br>') + (wrongCount > out.length ? '<br>' + (wrongCount - out.length) + ' more box' + (wrongCount - out.length === 1 ? ' was' : 'es were') + ' wrong too.' : '');
  }

  // ------------------------------------------------ on the page
  var css = '.bt-row{display:flex;align-items:center;gap:8px;margin:3px 0}.bt-label{min-width:74px;text-align:right;font:700 14px var(--font-mono);color:var(--ink-soft);white-space:nowrap}' +
    '.bt-cells{display:inline-flex;gap:4px}.bt-cell{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:7px;font:700 18px var(--font-mono);font-style:normal;background:var(--surface-3);border:2px solid transparent;color:var(--ink)}' +
    '.bt-cell.one{color:var(--syn-number,var(--brand))}.bt-cell.zero{color:var(--muted)}.bt-cell.star{color:var(--brand)}.bt-cell.empty{border:2px dashed var(--line-strong);background:transparent}.bt-cell.gap{visibility:hidden}' +
    '.bt-cell.hl{border-color:var(--warn);background:var(--warn-soft);box-shadow:0 0 0 2px var(--warn)}.bt-cell.new{border-color:var(--good);background:var(--good-soft)}.bt-cell.off{border-color:var(--bad);background:var(--bad-soft)}' +
    '.bt-line{height:2px;background:var(--line-strong);margin:3px 0 3px 82px;max-width:200px}.bt-code{font-family:var(--font-mono)}' +
    '.bt-box{padding:12px 14px;border-radius:12px;border:1px solid var(--line-strong);background:var(--surface-2)}.bt-box h2{margin:0 0 4px;font:700 1.2rem/1.25 var(--font-display)}' +
    '.bt-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 12px;margin-bottom:6px}.bt-dots{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}' +
    '.bt-dots i{width:9px;height:9px;border-radius:50%;border:1px solid var(--brand)}.bt-dots i.past{background:var(--brand-soft-strong)}.bt-dots i.on{background:var(--brand)}' +
    '.bt-vis{padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);overflow-x:auto}.bt-text{margin:8px 0 0;padding:8px 12px;border-left:3px solid var(--brand);background:var(--surface);border-radius:0 10px 10px 0;max-width:70ch;font-size:1.05rem}' +
    '.bt-note{margin:0 0 6px;color:var(--muted);font-size:.88rem}.bt-q{margin:0 0 6px;font-weight:600}' +
    '.bt-rule{margin:8px 0;padding:6px 10px;border-radius:10px;background:var(--brand-soft);color:var(--ink);font-size:.95rem;display:flex;flex-wrap:wrap;gap:4px 14px}.bt-rule-item b{color:var(--brand);font-family:var(--font-mono)}' +
    '.bt-how ol{margin:6px 0 8px;padding-left:22px}.bt-how li{margin:3px 0}.bt-ex{margin:8px 0}.bt-ex-title{font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--brand);font-weight:700;margin:0 0 4px}' +
    '.bt-wrong{margin-top:6px;font-weight:400;color:var(--ink)}.bt-steps{margin:4px 0 0;padding-left:20px}.bt-steps li{margin:3px 0}' +
    '.bt-menu{display:grid;gap:8px;margin:10px 0 0;padding:0;list-style:none}.bt-menu a{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center;padding:10px 14px;border:1px solid var(--line-strong);border-radius:12px;background:var(--surface-2);color:var(--ink);text-decoration:none}' +
    '.bt-menu a:hover{border-color:var(--brand)}.bt-menu .num{grid-row:span 2;width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--brand-soft-strong);color:var(--brand);font-weight:700}' +
    '.bt-menu b{font-size:1.05rem}.bt-menu span.what{color:var(--muted);font-size:.92rem}.bt-chip{display:inline-block;margin-left:6px;padding:0 8px;border-radius:999px;background:var(--warn-soft);color:var(--warn);font-size:.75rem;font-weight:700;vertical-align:middle}' +
    '@media (max-width:520px){.bt-cell{width:30px;height:30px;font-size:16px}.bt-label{min-width:56px;font-size:12px}.bt-line{margin-left:64px}}';
  if (typeof document !== 'undefined') {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }
  function report() { if (window.Flick) Flick.reportHeight(); if (window.CA) CA.reportHeight(); }

  // Hides everything else in host and shows one box; done() puts the page back.
  function cover(host, box) {
    var kids = Array.prototype.slice.call(host.children), keep = kids.map(function (n) { return n.style.display; });
    kids.forEach(function (n) { n.style.display = 'none'; });
    host.appendChild(box);
    report();
    return function () { box.remove(); kids.forEach(function (n, i) { n.style.display = keep[i]; }); report(); };
  }
  function mkBtn(label, cls, fn) { var x = document.createElement('button'); x.type = 'button'; x.className = cls; x.innerHTML = label; x.addEventListener('click', fn); return x; }

  // The step by step. o: { title, question, steps, note, onClose }
  function open(host, o) {
    var box = document.createElement('div');
    box.className = 'bt-box bt-walk';
    var restore = cover(host, box), at = 0;
    function close() { document.removeEventListener('keydown', onKey, true); restore(); if (o.onClose) o.onClose(); }
    function go(d) { at = Math.max(0, Math.min(o.steps.length - 1, at + d)); show(); }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); e.stopPropagation(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); e.stopPropagation(); go(-1); }
    }
    document.addEventListener('keydown', onKey, true);
    function show() {
      var s = o.steps[at];
      box.innerHTML = '<div class="bt-head"><h2>' + esc(o.title || 'Walk me through it') + '</h2><span class="small">Step ' + (at + 1) + ' of ' + o.steps.length + '</span></div>' +
        '<div class="bt-dots">' + o.steps.map(function (_, i) { return '<i class="' + (i === at ? 'on' : i < at ? 'past' : '') + '"></i>'; }).join('') + '</div>' +
        '<p class="bt-note">' + (o.note || 'A similar question with different bits, so you can see how and why. Then do yours the same way.') + '</p>' +
        (o.question ? '<p class="bt-q">' + o.question + '</p>' : '') +
        (s.html ? '<div class="bt-vis">' + s.html + '</div>' : '') + '<p class="bt-text">' + s.text + '</p>';
      var r = document.createElement('div');
      r.className = 'actions';
      var bk = mkBtn('Back', 'btn secondary', function () { go(-1); });
      bk.disabled = at === 0;
      r.appendChild(bk);
      var last = at === o.steps.length - 1;
      var nx = mkBtn(last ? 'Back to my question' : 'Next step', 'btn', last ? close : function () { go(1); });
      nx.className += ' bt-next';
      r.appendChild(nx);
      if (!last) r.appendChild(mkBtn('Close', 'btn secondary bt-close', close));
      box.appendChild(r);
      report();
      try { nx.focus({ preventScroll: true }); } catch (e) {}
    }
    show();
  }
  function button(fn) { return mkBtn('Walk me through it', 'btn secondary bt-walk-btn', fn); }
  // Walk through one operator on a similar question.
  function walkOp(host, op, a, b, onClose) {
    var ex = similar(op, a, b);
    if (!ex) return;
    open(host, { question: 'Example: ' + code(b != null ? ex.a + ' ' + op + ' ' + ex.b : op + ' ' + ex.a), steps: steps(op, ex.a, ex.b), onClose: onClose });
  }

  // A worked example before the first round of a new operator: the rule, a solved example and how it was done.
  function exampleHtml(op, L, avoidA) {
    var f = family(op), a, b = null, r;
    for (var t = 0; t < 100; t++) {
      a = randBits(L);
      b = /^(AND|OR|XOR)$/.test(f) ? randBits(L) : null;
      r = B.evaluate(b != null ? a + ' ' + f + ' ' + b : op + ' ' + a);
      if (r !== a && a !== avoidA) break;
    }
    var sts = steps(b != null ? f : op, a, b), last = sts[sts.length - 1];
    var how;
    if (b != null) how = 'Go column by column. ' + RULE[f];
    else if (f === 'NOT') how = 'Flip each bit, one at a time.';
    else how = 'Do one move at a time. ' + (/CIRC/.test(f) ? 'The bit that falls off comes back on the other side.' : 'The bit that falls off is lost, and a 0 comes in on the other side.');
    return '<div class="bt-ex"><p class="bt-ex-title">Worked example</p><div class="bt-vis">' + last.html + '</div><p class="bt-text">' + esc(how) + ' ' + last.text + '</p></div>';
  }
  // A card that covers host until the student presses the button. o: { title, html, go, onGo }
  function gate(host, o) {
    var box = document.createElement('div');
    box.className = 'bt-box bt-how';
    box.innerHTML = '<h2>' + esc(o.title) + '</h2>' + o.html;
    var r = document.createElement('div');
    r.className = 'actions';
    var restore = cover(host, box);
    var b = mkBtn(o.go || 'Start', 'btn bt-go', function () { restore(); if (o.onGo) o.onGo(); });
    r.appendChild(b);
    box.appendChild(r);
    try { b.focus({ preventScroll: true }); } catch (e) {}
    report();
  }
  // "New operator" card: shown once per operator family.
  function newOp(host, seen, op, L, onGo) {
    var f = family(op);
    if (seen[f]) { if (onGo) onGo(); return false; }
    seen[f] = true;
    gate(host, { title: 'New: ' + f, html: '<p class="bt-rule"><span class="bt-rule-item"><b>' + esc(f) + ':</b> ' + esc((MOVE_RE.test(op) ? rule(op) : RULE[f]).replace(/^[A-Z]+(-\d+)?:\s*/, '')) + '</span></p>' + exampleHtml(op, L), go: 'Got it: try one', onGo: onGo });
    return true;
  }

  return { RULE: RULE, rule: rule, ruleLine: ruleLine, family: family, count: count, row: row, steps: steps, similar: similar, wrongWhy: wrongWhy,
    open: open, button: button, walkOp: walkOp, exampleHtml: exampleHtml, gate: gate, newOp: newOp, cover: cover, esc: esc, code: code, randBits: randBits, rnd: rnd };
})(typeof BitCore !== 'undefined' ? BitCore : require('./bits-core.js'));
if (typeof module === 'object' && module && module.exports) module.exports = BitTeach;
