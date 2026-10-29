// CPU Lab shared pieces: element helpers, the height report for lesson embeds, results for the teacher
// (BC_APP_RESULT, as Comp Arcade), the level bar, and the Walk me through it / How it works overlay.
// No requestAnimationFrame: a lesson preloads the lab in a hidden iframe, where it never fires.
var Lab = (function () {
  'use strict';
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function button(label, cls, onClick) {
    var b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : '') }, label);
    b.addEventListener('click', onClick);
    return b;
  }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    var walk = document.querySelector('.walk');
    var h = Math.max(main.getBoundingClientRect().height, walk ? walk.getBoundingClientRect().height + 40 : 0);
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(h) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  function load(key, fallback) { try { var v = localStorage.getItem('bc-cpulab-v1:' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem('bc-cpulab-v1:' + key, JSON.stringify(value)); } catch (e) {} }

  // Posted after every round; the lesson slide saves it as the slide's answer. Once finished on this computer it
  // stays finished.
  function results(id, label) {
    var lines = [], right = 0, tries = 0, done = false, before = !!load('done:' + id, false);
    function post() {
      if (window.parent === window) return;
      var head = (done ? 'Finished.' : before ? 'Finished on an earlier visit.' : 'Not finished yet.') + (tries ? ' ' + right + ' clean rounds in ' + tries + '.' : '');
      try { window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: id, label: label, summary: head + ' ' + lines.slice(-12).join(' '), complete: done || before }, '*'); } catch (e) {}
    }
    return {
      add: function (text, ok) { tries++; if (ok) right++; lines.push(tries + '. ' + (ok ? 'Clean' : 'Mistake') + ': ' + text + '.'); post(); },
      note: function (text) { lines.push(text); post(); },
      finish: function () { if (done) return; done = true; save('done:' + id, true); post(); },
      isDone: function () { return done; }
    };
  }

  // Level name, clean rounds in a row (pips), and how many are needed.
  function bar(level, have, need) {
    var pips = '';
    for (var i = 0; i < need; i++) pips += '<i class="' + (i < have ? 'on' : '') + '"></i>';
    return el('div', { class: 'bar' }, '<span class="level">' + level + '</span><span class="pips">' + pips + '<span>' + have + ' of ' + need + ' clean rounds in a row</span></span>');
  }

  // A step-by-step overlay: steps [{ text, visual }], one at a time with Back and Next.
  function walk(title, intro, steps, onClose) {
    var i = 0;
    var back = el('div', { class: 'walk-back', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
    var box = el('div', { class: 'walk' });
    back.appendChild(box);
    document.body.appendChild(back);
    function close() { back.remove(); reportHeight(); if (onClose) onClose(i + 1, steps.length); }
    function draw() {
      var s = steps[i];
      box.innerHTML = '<h2>' + title + '</h2>' + (intro ? '<p class="small">' + intro + '</p>' : '') + '<div class="count">Step ' + (i + 1) + ' of ' + steps.length + '</div>' +
        '<p class="text">' + s.text + '</p>' + (s.visual || '');
      var act = el('div', { class: 'actions' });
      var prev = button('Back', 'secondary', function () { if (i > 0) { i--; draw(); } });
      prev.disabled = i === 0;
      act.appendChild(prev);
      act.appendChild(button(i === steps.length - 1 ? 'Done' : 'Next step', '', function () { if (i < steps.length - 1) { i++; draw(); } else close(); }));
      box.appendChild(act);
      reportHeight();
      var f = box.querySelector('.btn:not([disabled])');
      if (f && i === 0) f.focus();
    }
    draw();
  }

  return { el: el, button: button, rnd: rnd, pick: pick, shuffle: shuffle, reportHeight: reportHeight, results: results, bar: bar, walk: walk, load: load, save: save };
})();
