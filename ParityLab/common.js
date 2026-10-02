// Parity Lab shared pieces (copied from Transmission Lab): element helpers, icons, the height report for lesson
// embeds, a timer-driven animation loop, and the step-by-step task card.
// Animation runs on setTimeout, never requestAnimationFrame: a lesson preloads the lab in a hidden iframe, where
// requestAnimationFrame does not fire.
var Lab = (function () {
  'use strict';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, text) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }
  var ICON = {
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 20.5v-6l8-2.5-8-2.5v-6L22 12z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  // Calls frame(t) with t from 0 to 1 over `ms`, then done(). Returns a stop function.
  function animate(ms, frame, done) {
    if (reduceMotion) ms = Math.min(ms, 150);
    var start = Date.now(), stopped = false;
    (function tick() {
      if (stopped) return;
      var t = Math.min(1, (Date.now() - start) / ms);
      frame(t);
      if (t < 1) setTimeout(tick, 30);
      else if (done) done();
    })();
    return function () { stopped = true; };
  }

  // A segmented control: options [[value, label]], onChange(value).
  function segmented(options, value, onChange, label) {
    var seg = el('div', { class: 'seg', role: 'group', 'aria-label': label });
    options.forEach(function (o) {
      var b = el('button', { type: 'button', 'aria-pressed': String(o[0] === value), 'data-value': o[0] }, o[1]);
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(seg.children, function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        onChange(o[0]);
      });
      seg.appendChild(b);
    });
    return seg;
  }

  /**
   * One task at a time. A task is { q, kind: 'number' | 'choice', options?, answer, why, ready?() }.
   * ready() returns a message while the student still has to try something in the lab first.
   */
  function taskCard(host, tasks, onDone) {
    var i = 0, chosen = null;
    function render() {
      host.innerHTML = '';
      if (i >= tasks.length) {
        host.appendChild(el('div', { class: 'task' }, '<div class="done-banner">' + ICON.done + '<span>All ' + tasks.length + ' tasks done.</span></div>'));
        if (onDone) onDone();
        reportHeight();
        return;
      }
      var t = tasks[i];
      chosen = null;
      var card = el('div', { class: 'task' });
      card.appendChild(el('div', { class: 'task-head' }, '<h2>Task ' + (i + 1) + '</h2><span class="task-count">' + i + ' of ' + tasks.length + ' done</span>'));
      card.appendChild(el('p', { class: 'task-q' }, t.q));
      var answer = el('div', { class: 'task-answer' });
      var input = null;
      if (t.kind === 'number') {
        input = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Your answer', id: 'task-input-' + i });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
        answer.appendChild(input);
      } else {
        t.options.forEach(function (o) {
          var b = el('button', { type: 'button', class: 'choice', 'aria-pressed': 'false' }, o);
          b.addEventListener('click', function () {
            chosen = o;
            Array.prototype.forEach.call(answer.querySelectorAll('.choice'), function (c) { c.setAttribute('aria-pressed', String(c === b)); });
          });
          answer.appendChild(b);
        });
      }
      var checkBtn = el('button', { type: 'button', class: 'btn' }, ICON.check + '<span>Check</span>');
      checkBtn.addEventListener('click', check);
      answer.appendChild(checkBtn);
      card.appendChild(answer);
      var fb = el('div', { class: 'feedback', role: 'status' });
      card.appendChild(fb);
      host.appendChild(card);
      reportHeight();

      function check() {
        var waiting = t.ready && t.ready();
        if (waiting) { fb.className = 'feedback hint'; fb.textContent = waiting; reportHeight(); return; }
        var given = t.kind === 'number' ? input.value.trim() : chosen;
        if (!given) { fb.className = 'feedback hint'; fb.textContent = t.kind === 'number' ? 'Type a number first.' : 'Choose an answer first.'; return; }
        var ok = t.kind === 'number' ? Number(given.replace(/[^\d.-]/g, '')) === t.answer : given === t.answer;
        if (!ok) { fb.className = 'feedback error'; fb.textContent = 'Not yet. ' + t.retry; reportHeight(); return; }
        fb.className = 'feedback';
        fb.textContent = t.why;
        checkBtn.disabled = true;
        var next = el('button', { type: 'button', class: 'btn secondary' }, '<span>' + (i === tasks.length - 1 ? 'Finish' : 'Next task') + '</span>' + ICON.next);
        next.addEventListener('click', function () { i++; render(); });
        answer.appendChild(next);
        next.focus();
        reportHeight();
      }
    }
    render();
  }

  return { el: el, svgEl: svgEl, ICON: ICON, animate: animate, segmented: segmented, taskCard: taskCard, reportHeight: reportHeight, reduceMotion: reduceMotion };
})();
