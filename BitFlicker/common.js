// Bit Flicker shared pieces: element helpers, icons, the height report for lesson embeds, bit rows (shown and
// editable), the score / streak / lives bar, and the result report a lesson slide saves.
// Timing uses setTimeout, never requestAnimationFrame: a lesson preloads the app in a hidden iframe.
var Flick = (function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var embedded = params.get('embed') === '1';

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    run: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>',
    heartOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 20s-7.2-4.4-9.2-8.8C1.4 8 3.4 4.8 6.7 4.8c2 0 3.5 1.1 4.3 2.4.8-1.3 2.3-2.4 4.3-2.4 3.3 0 5.3 3.2 3.9 6.4C17.2 15.6 12 20 12 20z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.3 1.8 1.2 2.8 2.2 3.2C10.6 9 11 6 12 3z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>',
    test: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // A random bit string with at least one 0 and one 1, so every operator changes something.
  function randBits(L) {
    var s;
    do { s = ''; for (var i = 0; i < L; i++) s += Math.random() < 0.5 ? '1' : '0'; } while (!/0/.test(s) || !/1/.test(s));
    return s;
  }

  // A row of bit cells. opts: { label, cls, mark: [indexes], pad: n (dim cells added on the left) }.
  function bitRow(bits, opts) {
    opts = opts || {};
    var row = el('div', { class: 'bitrow' + (opts.cls ? ' ' + opts.cls : '') });
    row.appendChild(el('span', { class: 'bitrow-label' }, opts.label || ''));
    var cells = el('span', { class: 'cells' });
    String(bits).split('').forEach(function (b, i) {
      var c = el('i', { class: 'cell ' + (b === '1' ? 'one' : b === '0' ? 'zero' : b === '*' ? 'star' : b === ' ' ? 'gap' : 'blank') + (opts.mark && opts.mark.indexOf(i) >= 0 ? ' mark' : '') + (opts.padCount && i < opts.padCount ? ' padded' : '') }, b === '?' ? '' : b);
      cells.appendChild(c);
    });
    row.appendChild(cells);
    if (opts.note) row.appendChild(el('span', { class: 'bitrow-note' }, opts.note));
    return row;
  }

  // An editable row: each cell cycles through `states` on click; typing a state character fills the next cell.
  function inputRow(length, states, opts) {
    opts = opts || {};
    var value = [], row = el('div', { class: 'bitrow input' + (opts.cls ? ' ' + opts.cls : '') });
    row.appendChild(el('span', { class: 'bitrow-label' }, opts.label || ''));
    var cells = el('span', { class: 'cells', role: 'group', 'aria-label': opts.aria || 'Your answer: click each cell or type' });
    var buttons = [], cursor = 0, locked = false;
    for (var i = 0; i < length; i++) value.push('?');
    function paint() {
      buttons.forEach(function (b, i) {
        var v = value[i];
        b.className = 'cell edit ' + (v === '1' ? 'one' : v === '0' ? 'zero' : v === '*' ? 'star' : 'blank') + (i === cursor && !locked ? ' cursor' : '');
        b.textContent = v === '?' ? '' : v;
        b.setAttribute('aria-label', 'Bit ' + (i + 1) + ': ' + (v === '?' ? 'empty' : v));
      });
    }
    function set(i, v) { if (locked) return; value[i] = v; paint(); if (opts.onChange) opts.onChange(); }
    for (var j = 0; j < length; j++) (function (i) {
      var b = el('button', { type: 'button' });
      b.addEventListener('click', function () {
        if (locked) return;
        cursor = i;
        var k = states.indexOf(value[i]);
        set(i, states[(k + 1) % states.length]);
      });
      buttons.push(b);
      cells.appendChild(b);
    })(j);
    row.appendChild(cells);
    row.tabIndex = 0;
    row.addEventListener('keydown', function (e) {
      if (locked) return;
      var k = e.key;
      if (states.indexOf(k) >= 0) { set(cursor, k); cursor = Math.min(length - 1, cursor + 1); paint(); e.preventDefault(); e.stopPropagation(); }
      else if (k === 'Backspace') { value[cursor] = '?'; cursor = Math.max(0, cursor - 1); paint(); e.preventDefault(); e.stopPropagation(); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { cursor = Math.max(0, Math.min(length - 1, cursor + (k === 'ArrowLeft' ? -1 : 1))); paint(); e.preventDefault(); }
      else if (k === 'Enter' && opts.onEnter) { opts.onEnter(); e.preventDefault(); }
    });
    paint();
    return {
      node: row,
      value: function () { return value.join(''); },
      complete: function () { return value.indexOf('?') < 0; },
      focus: function () { try { row.focus({ preventScroll: true }); } catch (e) {} },
      lock: function (marks) {
        locked = true; paint();
        (marks || []).forEach(function (m, i) { if (m) buttons[i].classList.add(m); });
      }
    };
  }

  // Score, streak, best streak, lives and level, drawn as one bar.
  function Game(host, opts) {
    var g = { score: 0, streak: 0, best: 0, lives: opts.lives || 3, maxLives: opts.lives || 3, level: 1, onOver: null };
    var bar = el('div', { class: 'hud', 'aria-live': 'polite' });
    host.appendChild(bar);
    g.draw = function () {
      var hearts = '';
      for (var i = 0; i < g.maxLives; i++) hearts += '<span class="heart' + (i < g.lives ? '' : ' lost') + '">' + (i < g.lives ? ICON.heart : ICON.heartOff) + '</span>';
      bar.innerHTML = '<span class="hud-item"><span class="hud-k">Level</span><b>' + g.level + '</b></span>' +
        '<span class="hud-item"><span class="hud-k">Score</span><b>' + g.score + '</b></span>' +
        '<span class="hud-item streak' + (g.streak >= 3 ? ' hot' : '') + '">' + ICON.flame + '<span class="hud-k">Streak</span><b>' + g.streak + '</b></span>' +
        '<span class="hud-item">' + ICON.star + '<span class="hud-k">Best</span><b>' + g.best + '</b></span>' +
        '<span class="hud-item lives" aria-label="' + g.lives + ' lives left">' + hearts + '</span>';
    };
    // A right answer: base points, plus a bonus that grows with the streak.
    g.right = function (points) {
      g.streak++;
      g.best = Math.max(g.best, g.streak);
      var gain = points + Math.min(g.streak - 1, 5) * Math.round(points / 5);
      g.score += gain;
      g.draw();
      return gain;
    };
    g.wrong = function () {
      g.streak = 0;
      g.lives = Math.max(0, g.lives - 1);
      g.draw();
      bar.classList.remove('shake');
      setTimeout(function () { bar.classList.add('shake'); }, 10);
      return g.lives === 0;
    };
    g.restart = function (level) { g.score = 0; g.streak = 0; g.lives = g.maxLives; g.level = level; g.draw(); };
    g.draw();
    return g;
  }

  // The result a lesson slide saves (js/steps/embeds.html in the shell): posted after every round.
  function results(mode, label, goal) {
    var lines = [], right = 0, done = false;
    function post(game) {
      if (window.parent === window) return;
      var head = 'Level ' + game.level + ', score ' + game.score + ', best streak ' + game.best + ', ' + right + ' right' + (done ? ' (goal reached)' : '') + '.';
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'bit-flicker-' + mode, label: 'Bit Flicker: ' + label,
          summary: head + (lines.length ? ' ' + lines.slice(-30).join(' ') : ''), complete: done }, '*');
      } catch (e) {}
    }
    return {
      add: function (game, text, ok, notGoal) {
        if (ok && !notGoal) right++;
        lines.push((lines.length + 1) + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.');
        if (right >= goal) done = true;
        post(game);
      },
      done: function () { return done; }
    };
  }

  function feedback(host) {
    var fb = el('div', { class: 'feedback', role: 'status' });
    host.appendChild(fb);
    return function (text, tone) { fb.className = 'feedback' + (tone ? ' ' + tone : ''); fb.innerHTML = text || ''; reportHeight(); };
  }
  function btn(label, icon, cls, onClick) {
    var b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : '') }, (icon ? ICON[icon] : '') + '<span>' + label + '</span>');
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }
  // Cells that differ from the right answer, for marking a wrong prediction.
  function diffMarks(given, right) {
    return given.split('').map(function (c, i) { return c === right[i] ? 'good' : 'bad'; });
  }
  function overPanel(host, game, text, onAgain) {
    host.innerHTML = '';
    var p = el('div', { class: 'over' });
    p.appendChild(el('h2', null, 'Out of lives'));
    p.appendChild(el('p', null, text + ' Final score <b>' + game.score + '</b>, best streak <b>' + game.best + '</b>.'));
    p.appendChild(btn('Play again', 'reset', '', onAgain));
    host.appendChild(p);
    reportHeight();
  }

  // Why an operator gave its result, in one or two short sentences. op: 'NOT', 'AND', 'LCIRC-7'...; b only for AND,
  // XOR and OR.
  var MOVE_RE = /^(LSHIFT|RSHIFT|LCIRC|RCIRC)-(\d+)$/;
  function explain(op, a, b) {
    var L = a.length, m = MOVE_RE.exec(op), out;
    if (op === 'NOT') return 'NOT flips every bit: each 1 becomes 0 and each 0 becomes 1.';
    if (!m) {
      out = { AND: 'AND gives 1 only where both bits are 1.', OR: 'OR gives 1 where at least one bit is 1.', XOR: 'XOR gives 1 where the two bits are different.' }[op];
      if (b != null && a.length !== b.length) {
        var s = a.length < b.length ? a : b, L2 = Math.max(a.length, b.length);
        return 'First pad the shorter string with zeros on the left: <code>' + s + '</code> becomes <code>' + BitCore.pad(s, L2) + '</code>. Then go column by column. ' + out;
      }
      return 'Go column by column. ' + out;
    }
    var n = Number(m[2]), dir = m[1].charAt(0) === 'L' ? 'left' : 'right', other = dir === 'left' ? 'right' : 'left', pl = n > 1;
    if (/SHIFT/.test(m[1])) {
      if (n >= L) return 'Shifting ' + n + ' places on ' + L + ' bits pushes every bit off the end. Only zeros are left.';
      return 'Every bit moves ' + n + ' place' + (pl ? 's' : '') + ' ' + dir + '. ' + n + ' bit' + (pl ? 's fall' : ' falls') + ' off the ' + dir + ' end, and ' + n + ' zero' + (pl ? 's come' : ' comes') + ' in on the ' + other + '.';
    }
    var r = n % L, base = 'Every bit moves ' + dir + ', and a bit that falls off the ' + dir + ' end comes back on the ' + other + '.';
    if (n >= L) return L + ' moves bring ' + L + ' bits back to the start. ' + n + ' = ' + Math.floor(n / L) + ' &times; ' + L + ' + ' + r + ', so ' + op + ' does the same as ' + (r ? m[1] + '-' + r : 'no move at all') + '.' + (r ? ' ' + base : '');
    return base;
  }
  // The string after each single move of a shift or circulate (at most the moves that matter).
  function moveFrames(op, s) {
    var m = MOVE_RE.exec(op), out = [];
    if (!m) return out;
    var n = Number(m[2]), L = s.length, k = /CIRC/.test(m[1]) ? n % L : Math.min(n, L), cur = s;
    for (var i = 0; i < k; i++) { cur = BitCore.shift(m[1], 1, cur); out.push(cur); }
    return out;
  }
  // Plays the frames in one row, a move every 420 ms (setTimeout, so it also runs while hidden).
  function playMoves(host, op, s) {
    var frames = moveFrames(op, s);
    if (!frames.length) return;
    var wrap = el('div', { class: 'moves' });
    host.appendChild(wrap);
    var i = 0;
    function draw(label, bits) { wrap.innerHTML = ''; wrap.appendChild(bitRow(bits, { label: label })); reportHeight(); }
    draw('start', s);
    function tick() {
      if (i >= frames.length || !wrap.isConnected) return;
      draw('move ' + (i + 1), frames[i]);
      i++;
      setTimeout(tick, 420);
    }
    setTimeout(tick, 420);
  }

  return { explain: explain, moveFrames: moveFrames, playMoves: playMoves, el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, rnd: rnd, pick: pick, shuffle: shuffle, randBits: randBits,
    bitRow: bitRow, inputRow: inputRow, Game: Game, results: results, feedback: feedback, btn: btn, diffMarks: diffMarks,
    overPanel: overPanel, embedded: embedded, params: params };
})();
