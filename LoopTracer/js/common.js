// Loop Tracer shared pieces: element helpers, icons, the code box, the score bar, timers, answer matching, the
// height report for lesson embeds and the result report for the teacher.
// Timers use setTimeout and Date.now(), never requestAnimationFrame: a lesson preloads the app in a hidden iframe.
var LT = (function () {
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
    table: svg('M3 3h18v18H3zm2 2v4h6V5zm8 0v4h6V5zm-8 6v4h6v-4zm8 0v4h6v-4zm-8 6v2h6v-2zm8 0v2h6v-2z'),
    eye: svg('M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'),
    flag: svg('M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z')
  };

  // ------------------------------------------------------------------ the code box
  var KW = /\b(FOR|TO|STEP|NEXT|WHILE|END WHILE|IF|THEN|ELSE|END IF|OUTPUT|INPUT|END)\b/g;
  function highlight(line) {
    var parts = String(line).split('"');
    return parts.map(function (p, i) {
      if (i % 2) return '<span class="s">"' + esc(p) + '"</span>';
      return esc(p).replace(/\b(\d+(\.\d+)?)\b/g, '<span class="n">$1</span>')
        .replace(KW, '<span class="k">$1</span>')
        .replace(/\b(int|abs|sqrt)\(/g, '<span class="f">$1</span>(');
    }).join('');
  }
  function codeBox(lines, opts) {
    opts = opts || {};
    var box = el('div', { class: 'code' + (opts.small ? ' small' : '') });
    lines.forEach(function (line, i) {
      var row = el('div', { class: 'code-line', 'data-line': String(i + 1) });
      row.appendChild(el('span', { class: 'ln' }, String(i + 1)));
      row.appendChild(el('span', { class: 'src' }, highlight(line).replace(/^( +)/, function (m) { return '&nbsp;'.repeat(m.length); })));
      box.appendChild(row);
    });
    box.mark = function (n) {
      Array.prototype.forEach.call(box.children, function (r) { r.classList.toggle('now', Number(r.getAttribute('data-line')) === n); });
    };
    return box;
  }

  // ------------------------------------------------------------------ score bar
  function bestKey(name) { return 'bc-looptracer-best-v1:' + name; }
  function getBest(name) { try { return Number(localStorage.getItem(bestKey(name)) || 0); } catch (e) { return 0; } }
  function setBest(name, v) { try { localStorage.setItem(bestKey(name), String(v)); } catch (e) {} }
  function scoreBar(name) {
    var bar = el('div', { class: 'scorebar' });
    var s = { points: 0, streak: 0, bestStreak: 0, right: 0, tries: 0, best: getBest(name) };
    function chip(icon, label, id) { return '<span class="chip" id="' + id + '">' + icon + '<span class="lbl">' + label + '</span><b>0</b></span>'; }
    bar.innerHTML = chip(ICON.star, 'Score', 'sb-score') + chip(ICON.flame, 'Streak', 'sb-streak') + chip(ICON.flag, 'Best', 'sb-best') + chip(ICON.clock, 'Time', 'sb-time');
    var started = 0, tick = null;
    function q(id) { return bar.querySelector('#' + id + ' b'); }
    function draw() {
      q('sb-score').textContent = s.points;
      q('sb-streak').textContent = s.streak;
      q('sb-best').textContent = Math.max(s.best, s.points);
      bar.querySelector('#sb-streak').classList.toggle('hot', s.streak >= 3);
    }
    function time() {
      if (!started) { q('sb-time').textContent = '0:00'; return; }
      q('sb-time').textContent = clockText((Date.now() - started) / 1000);
    }
    var api = {
      el: bar, state: s,
      start: function () { if (started) return; started = Date.now(); (function loop() { time(); tick = setTimeout(loop, 500); })(); },
      stop: function () { if (tick) clearTimeout(tick); tick = null; time(); },
      seconds: function () { return started ? Math.round((Date.now() - started) / 1000) : 0; },
      right: function (base, perStreak) {
        s.streak++; s.right++; s.tries++;
        s.bestStreak = Math.max(s.bestStreak, s.streak);
        var gain = base + perStreak * Math.min(s.streak - 1, 5);
        s.points += gain; draw(); pop(bar.querySelector('#sb-score'), '+' + gain);
        return gain;
      },
      wrong: function () { s.streak = 0; s.tries++; draw(); },
      finish: function () { if (s.points > s.best) { s.best = s.points; setBest(name, s.points); } draw(); }
    };
    draw(); time();
    return api;
  }
  function pop(target, text) {
    var p = el('span', { class: 'pop' }, esc(text));
    target.appendChild(p);
    setTimeout(function () { p.remove(); }, 900);
  }
  function clockText(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

  // ------------------------------------------------------------------ answers
  // Equal when the same number (2.50 and 2.5), or the same text ignoring quote marks, spaces at the ends and case.
  function same(typed, want) {
    var a = String(typed == null ? '' : typed).trim().replace(/^["'“”]|["'“”]$/g, '').trim().replace(/−/g, '-');
    var b = String(want).trim();
    if (/^-?\d+(\.\d+)?$/.test(a) && /^-?\d+(\.\d+)?$/.test(b)) return Math.abs(Number(a) - Number(b)) < 1e-9;
    return a.toLowerCase() === b.toLowerCase();
  }
  function shown(v) { return v === '' ? '""' : String(v); }

  // ------------------------------------------------------------------ the page height (lesson embeds) and results
  function reportHeight() {
    if (window.parent === window) return;
    var main = document.getElementById('app');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.getElementById('app'));
  window.addEventListener('load', reportHeight);

  // After every round: the round's summary, saved by the lesson slide as its answer.
  function report(questionId, label, summary, complete) {
    if (window.parent === window) return;
    try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: questionId, label: label, summary: summary, complete: !!complete }, '*'); } catch (e) {}
  }

  function supportFader(key) { return window.BCSupport ? window.BCSupport.fader('looptracer:' + key) : { reveal: function () { return 0; }, correct: function () {}, wrong: function () {} }; }
  function supportOn() { return !!(window.BCSupport && window.BCSupport.isOn()); }

  return { params: params, embed: embed, el: el, esc: esc, ICON: ICON, codeBox: codeBox, highlight: highlight, scoreBar: scoreBar, clockText: clockText,
    same: same, shown: shown, reportHeight: reportHeight, report: report, supportFader: supportFader, supportOn: supportOn };
})();
