// Competition Arcade (Year 8) shared pieces: element helpers, the height report for lesson embeds, the game bar, a
// countdown, ACSL code drawn with line numbers, worked steps, and results for the teacher (BC_APP_RESULT).
// Nothing waits for requestAnimationFrame: a lesson preloads the app in a hidden frame, where animation frames never
// fire, so every timed step is a setTimeout and every clock reads Date.now.
var CA = (function () {
  'use strict';
  var params = new URLSearchParams(location.search);
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
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.5 5c2 0 3.4 1.1 4.2 2.4h2.6C14.1 6.1 15.5 5 17.5 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M12 7v5l3 2"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.6" fill="currentColor"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M8 10V7a4 4 0 0 1 7.7-1.5"/><circle cx="12" cy="15.5" r="1.6" fill="currentColor"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>',
    tower: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M5 21h14M7 21V15h10v6M8 15V9h8v6M9 9V4h6v5"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="m15 15 5 5"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 4h18v16H3zM3 9.3h18M3 14.6h18M9 4v16M15 4v16"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9.5 17h5v4h-5z"/></svg>',
    badge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 12 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  function later(ms, fn) { return setTimeout(fn, ms); }
  function say(node, text, kind) { node.className = 'feedback' + (kind ? ' ' + kind : ''); node.innerHTML = text; reportHeight(); }
  function doneBanner(text) { return '<div class="done-banner">' + ICON.done + '<span>' + text + '</span></div>'; }
  function focusSoon(node) { later(30, function () { try { node.focus({ preventScroll: true }); } catch (e) {} }); }
  function lives(left, total) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<span class="' + (i < left ? '' : 'lost') + '">' + ICON.heart + '</span>';
    return '<span class="lives" title="' + left + ' left">' + h + '</span>';
  }
  function chip(label, value, cls) { return '<span class="chip' + (cls ? ' ' + cls : '') + '"><span class="lbl">' + label + '</span><b>' + value + '</b></span>'; }
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  // A countdown on setTimeout: onTick(msLeft) about four times a second, onEnd once. stop() and add(ms).
  function countdown(ms, onTick, onEnd) {
    var end = Date.now() + ms, t = null, live = true, paused = 0;
    function tick() {
      if (!live) return;
      if (paused) { t = later(250, tick); return; }
      var left = end - Date.now();
      onTick(Math.max(0, left));
      if (left <= 0) { live = false; onEnd(); return; }
      t = later(250, tick);
    }
    tick();
    return {
      stop: function () { live = false; clearTimeout(t); },
      left: function () { return paused ? paused : Math.max(0, end - Date.now()); },
      add: function (extra) { if (paused) paused += extra; else end += extra; },
      pause: function () { if (!paused && live) paused = Math.max(1, end - Date.now()); },
      resume: function () { if (paused) { end = Date.now() + paused; paused = 0; } },
      paused: function () { return !!paused; }
    };
  }
  function timebar(node, left, total) {
    node.className = 'timebar' + (left < total * 0.25 ? ' low' : '');
    node.innerHTML = '<i style="width:' + Math.round(100 * left / total) + '%"></i>';
  }

  // ACSL pseudocode, numbered, with the keywords coloured.
  var KW = /\b(FOR|TO|STEP|NEXT|WHILE|END WHILE|END IF|IF|THEN|ELSE|OUTPUT|INPUT|END)\b/g;
  function codeBox(src, cls) {
    return '<div class="code' + (cls ? ' ' + cls : '') + '">' + String(src).split('\n').map(function (line, i) {
      var html = esc(line).replace(/("[^"]*")/g, '<span class="s">$1</span>')
        .replace(/\b(int|abs|sqrt)\(/g, '<span class="f">$1</span>(')
        .replace(KW, '<span class="k">$1</span>').replace(/(^|[^\w>])(\d+)(?![\w<])/g, '$1<span class="n">$2</span>');
      return '<div class="code-line"><span class="ln">' + (i + 1) + '</span><span class="src">' + html + '</span></div>';
    }).join('') + '</div>';
  }
  // A question's worked steps: the first is a plain sentence, the rest are working lines.
  function whyBox(q) {
    return '<div class="why"><b>How it works</b><ol>' + q.why.map(function (s, i) {
      return '<li class="' + (i === 0 || /^[A-Z][a-z]/.test(s) ? 'say' : '') + '">' + esc(s) + '</li>';
    }).join('') + '</ol></div>';
  }
  // The question's expression or program.
  function showQ(q, big) {
    if (q.topic === 'loops') return codeBox(q.show);
    return '<div class="expr' + (q.show.length > 34 && !big ? ' mid' : '') + '">' + esc(q.show) + '</div>';
  }
  var TOPIC = { 'post-eval': 'Postfix', 'pre-eval': 'Prefix', 'to-post': 'Infix to postfix', 'to-pre': 'Infix to prefix',
    'bits-logic': 'Bit strings', 'bits-shift': 'Shifts and circulates', 'bits-chain': 'Bit strings', loop: 'Loops' };

  // ---------------------------------------------------------------- results for the teacher
  // Posted after every question as BC_APP_RESULT; the lesson slide saves it as that slide's answer. Once a game is
  // finished on this computer it stays finished, even when the slide is opened again and the game started over.
  var MODE = params.get('mode') || '';
  function results(label) {
    var lines = [], right = 0, done = false, key = 'bc-ca8-done-v1:' + MODE, before = false, head = '';
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !MODE) return;
      var top = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' right in ' + lines.length + ' tries.' + (head ? ' ' + head : '');
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'arcade-' + MODE, label: 'Competition Arcade: ' + label,
          summary: top + (lines.length ? ' ' + lines.slice(-14).join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; lines.push((lines.length + 1) + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.'); post(); },
      note: function (text) { head = text; post(); },
      finish: function () { if (done) return; done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); },
      isDone: function () { return done || before; }
    };
  }
  function best(key, value) {
    var k = 'bc-ca8-best-v1:' + key, old = 0;
    try { old = Number(localStorage.getItem(k)) || 0; } catch (e) {}
    if (value != null && value > old) { try { localStorage.setItem(k, String(value)); } catch (e) {} }
    return old;
  }

  return { params: params, el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, later: later, say: say, doneBanner: doneBanner,
    focusSoon: focusSoon, lives: lives, chip: chip, mmss: mmss, countdown: countdown, timebar: timebar, codeBox: codeBox,
    whyBox: whyBox, showQ: showQ, TOPIC: TOPIC, results: results, best: best, modes: {} };
})();
