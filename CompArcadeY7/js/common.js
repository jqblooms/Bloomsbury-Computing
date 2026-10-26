// Comp Arcade (Year 7) shared pieces: element helpers, icons, the height report for lesson embeds, the top bar
// (level, score, streak, hearts), stars, the result report a lesson slide saves, and a saved best score.
// Nothing waits for requestAnimationFrame: a lesson preloads the app in a hidden frame, where animation frames never
// fire, so every animation step is a setTimeout, and nothing starts moving until the student presses a button.
var CA = (function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var GAME = params.get('game') || '';

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
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.1l-5.7 3 1.2-6.3-4.6-4.4 6.3-.8z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.3 1.8 1.2 2.8 2.2 3.2C10.6 9 11 6 12 3z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M12 7v5l3 2"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4.5a3.5 3.5 0 0 0 4 4M16 5h3.5a3.5 3.5 0 0 1-4 4M12 13v4M8 21h8M9.5 21c0-2 1.1-3.5 2.5-3.5s2.5 1.5 2.5 3.5"/></svg>',
    redo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>'
  };

  // ---------------------------------------------------------------- the height report (lesson embeds)
  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 12 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  function later(ms, fn) { return setTimeout(fn, ms); }
  function say(node, text, kind) { node.className = 'feedback' + (kind ? ' ' + kind : ''); node.innerHTML = text; reportHeight(); }
  function focusIn(node) { later(20, function () { try { node.focus({ preventScroll: true }); } catch (e) {} }); }

  // ---------------------------------------------------------------- saved on this computer (conveniences only)
  function load(key, fallback) { try { var v = localStorage.getItem('bc-comparcade7-v1:' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem('bc-comparcade7-v1:' + key, JSON.stringify(value)); } catch (e) {} }

  // ---------------------------------------------------------------- results for the teacher
  // Posted after every round as BC_APP_RESULT; the lesson slide saves it as that slide's answer. Once a game is
  // finished on this computer it stays finished, even when the slide is opened again and the game started over.
  function results(id, label) {
    var lines = [], right = 0, tries = 0, done = false, before = !!load('done:' + id, false);
    function post() {
      if (window.parent === window) return;
      var head = (done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.') + (tries ? ' ' + right + ' right in ' + tries + ' tries.' : '');
      var shown = lines.slice(-12);
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label: label,
          summary: head + (shown.length ? ' ' + shown.join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { tries++; if (ok) right++; lines.push(tries + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.'); post(); },
      note: function (text) { lines.push(text); post(); },
      finish: function () { if (done) return; done = true; save('done:' + id, true); post(); },
      isDone: function () { return done; },
      right: function () { return right; }
    };
  }

  // ---------------------------------------------------------------- top bar
  function hearts(left, total) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<span class="' + (i < left ? '' : 'lost') + '">' + ICON.heart + '</span>';
    return '<span class="hearts" title="Hearts left: ' + left + '">' + h + '</span>';
  }
  function dots(have, need) {
    var h = '';
    for (var i = 0; i < need; i++) h += '<i class="' + (have > i ? 'on' : '') + '"></i>';
    return '<span class="dots" title="Rounds won on this level">' + h + '</span>';
  }
  function stars(n, of) {
    var h = '';
    for (var i = 0; i < (of || 3); i++) h += '<span class="' + (i < n ? 'on' : '') + '">' + ICON.star + '</span>';
    return '<span class="stars" aria-label="' + n + ' stars">' + h + '</span>';
  }
  function topbar(host) {
    var bar = el('div', { class: 'topbar' });
    host.appendChild(bar);
    return {
      node: bar,
      set: function (o) {
        bar.innerHTML = '<span class="pill">' + esc(o.level) + '</span>' + (o.need ? dots(o.have, o.need) : '') +
          '<span class="spacer"></span><span class="stat">Score <b>' + o.score + '</b></span>' +
          '<span class="stat streak' + (o.streak >= 3 ? ' hot' : '') + '">' + ICON.flame + '<b>' + o.streak + '</b></span>' +
          (o.hearts != null ? hearts(o.hearts, o.maxHearts || 3) : '');
      }
    };
  }
  // Points for a right answer: 10, plus 5 for every right answer in a row after the first two.
  function points(streak) { return 10 + (streak >= 3 ? 5 : 0); }
  // Stars at the end of a game, from the mistakes made.
  function starsFor(mistakes) { return mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1; }
  function best(game, score) {
    var b = load('best:' + game, 0);
    if (score > b) { save('best:' + game, score); return { best: score, isNew: true }; }
    return { best: b, isNew: false };
  }
  function endCard(o) {
    var b = best(o.game, o.score);
    return '<div class="end-card"><div class="end-stars">' + stars(o.stars) + '</div><h2>' + esc(o.title) + '</h2>' +
      '<p class="end-score">Score <b>' + o.score + '</b>' + (b.isNew ? ' <span class="pill good">New best</span>' : ' <span class="muted">Best ' + b.best + '</span>') + '</p>' +
      (o.text ? '<p>' + o.text + '</p>' : '') + '</div>';
  }
  function btn(text, cls, onclick, icon) {
    var b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : '') }, (icon ? ICON[icon] : '') + '<span>' + text + '</span>');
    if (onclick) b.addEventListener('click', onclick);
    return b;
  }
  // A typed answer box that submits on Enter.
  function answerBox(opts, onSubmit) {
    var wrap = el('span', { class: 'answer-wrap' });
    var input = el('input', { type: 'text', class: 'answer-in' + (opts.wide ? ' wide' : ''), autocomplete: 'off', spellcheck: 'false', 'aria-label': opts.label || 'Your answer', inputmode: opts.numeric ? 'numeric' : 'text' });
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } });
    wrap.appendChild(input);
    return { wrap: wrap, input: input };
  }
  function shake(node) { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); later(450, function () { node.classList.remove('shake'); }); }

  return { params: params, GAME: GAME, el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, later: later, say: say, focusIn: focusIn,
    load: load, save: save, results: results, hearts: hearts, dots: dots, stars: stars, topbar: topbar, points: points, starsFor: starsFor,
    endCard: endCard, btn: btn, answerBox: answerBox, shake: shake, games: {} };
})();
