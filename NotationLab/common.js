// NotationLab shared pieces: element helpers, the height report for lesson embeds, the top bar (level, score,
// streak, hearts), results for the teacher, and the support rule box. Nothing waits for requestAnimationFrame: a
// lesson preloads the app in a hidden frame, where animation frames never fire, so every timed step is a setTimeout.
var NL = (function () {
  'use strict';
  var NC = NotationCore;
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
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.5 5c2 0 3.4 1.1 4.2 2.4h2.6C14.1 6.1 15.5 5 17.5 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  function later(ms, fn) { return setTimeout(fn, ms); }
  function range(a, b) { return a + NC.rand(b - a + 1); }
  function sizeOf(n) { return Array.isArray(n) ? range(n[0], n[1]) : n; }
  function opText(t) { return t; }

  function say(node, text, kind) {
    node.className = 'feedback' + (kind ? ' ' + kind : '');
    node.innerHTML = text;
    reportHeight();
  }
  function hearts(left, total) {
    var h = '';
    for (var i = 0; i < total; i++) h += '<span class="' + (i < left ? '' : 'lost') + '">' + ICON.heart + '</span>';
    return '<span class="hearts" title="Hearts left: ' + left + '">' + h + '</span>';
  }
  function dots(have, need) {
    var h = '';
    for (var i = 0; i < need; i++) h += '<i class="' + (have >= i + 1 ? 'on' : have > i ? 'half' : '') + '"></i>';
    return '<span class="progress-dots" title="Level progress">' + h + '</span>';
  }
  function doneBanner(text) { return '<div class="done-banner">' + ICON.done + '<span>' + text + '</span></div>'; }

  // ---------------------------------------------------------------- results for the teacher
  // Posted after every expression as BC_APP_RESULT (the lesson slide saves it as that slide's answer). Once a mode is
  // finished on this computer it stays finished, even when the slide is opened again and the mode started over.
  var MODE = params.get('mode') || '';
  function results(label) {
    var lines = [], right = 0, tries = 0, walks = 0, done = false, key = 'bc-notation-done-v1:' + MODE;
    var before = false;
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !MODE) return;
      var head = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' right in ' + tries + ' tries.' + (walks ? ' Used Walk me through it ' + walks + (walks === 1 ? ' time.' : ' times.') : '');
      var shown = lines.slice(-12);
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'notation-' + MODE, label: 'NotationLab: ' + label,
          summary: head + (shown.length ? ' ' + shown.join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; tries++; lines.push(tries + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.'); post(); },
      // A walkthrough was opened (seen of total steps viewed). Shown to the teacher, never counted as a try.
      help: function (what, seen, total) { walks++; lines.push('Used Walk me through it (' + what + ', viewed ' + seen + ' of ' + total + ' steps).'); post(); },
      finish: function () { if (done) return; done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); },
      isDone: function () { return done; }
    };
  }

  // ---------------------------------------------------------------- support: the rule, fading as the student gets it
  // levels: the rule in three strengths, most help first. Off until the student switches it on (shared/bc-support.js).
  function support(key, box) {
    var S = window.BCSupport, fade = S ? S.fader('notation:' + key) : null, levels = [];
    function draw() {
      if (!S || !S.isOn() || !levels.length) { box.innerHTML = ''; reportHeight(); return; }
      var r = fade.reveal(), i = r >= 1 ? 0 : r >= 0.6 ? 1 : r > 0 ? 2 : -1;
      box.innerHTML = i < 0 ? '' : levels[i];
      reportHeight();
    }
    if (S) S.onChange(draw);
    return {
      set: function (list) { levels = list || []; draw(); },
      right: function () { if (fade && S.isOn()) { fade.correct(); draw(); } },
      wrong: function () { if (fade && S.isOn()) { fade.wrong(); draw(); } },
      toggle: function (host) { if (S) S.mountToggle(host); }
    };
  }

  // A top bar: title pill, level progress, score, streak, hearts and the support switch.
  function topbar(host) {
    var bar = el('div', { class: 'topbar' });
    var left = el('span'), stats = el('span', { class: 'stat' }), sp = el('span', { class: 'spacer' }), right = el('span');
    bar.appendChild(left); bar.appendChild(stats); bar.appendChild(sp); bar.appendChild(right);
    host.appendChild(bar);
    return {
      bar: bar, slot: right,
      set: function (o) {
        left.innerHTML = '<span class="pill">' + esc(o.level) + '</span> ' + (o.need ? dots(o.have, o.need) : '');
        stats.innerHTML = 'Score <b>' + o.score + '</b> &nbsp; Streak <b>' + o.streak + '</b> &nbsp; ' + (o.hearts != null ? hearts(o.hearts, o.maxHearts || 3) : '');
      }
    };
  }

  // Tokens drawn as a row of tiles.
  function tile(tk, cls) {
    var isOp = NC.isOp(tk);
    return '<span class="tok' + (isOp ? ' op' : '') + (cls ? ' ' + cls : '') + '">' + esc(tk) + '</span>';
  }
  function focusSoon(node) { later(30, function () { try { node.focus({ preventScroll: true }); } catch (e) {} }); }

  return { NC: NC, params: params, el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, later: later, range: range, sizeOf: sizeOf,
    opText: opText, say: say, hearts: hearts, dots: dots, doneBanner: doneBanner, results: results, support: support, topbar: topbar,
    tile: tile, focusSoon: focusSoon, activities: {} };
})();
