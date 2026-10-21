// Model Lab shared pieces: element helpers, the height report for lesson embeds, tap-or-drag placing (as in
// ProjectPlanner/common.js), and the result log posted to the site. Nothing waits for requestAnimationFrame: a lesson
// preloads the app in a hidden frame, where animation frames never fire, so every timed step is a setTimeout.
var ML = (function () {
  'use strict';
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
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10.2 15.6 6.8 12.2l-1.3 1.3 4.7 4.7 8.3-8.3-1.3-1.3z"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17v.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>'
  };

  function reportHeight() {
    if (window.parent === window) return;
    var main = document.querySelector('main');
    try { window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: Math.ceil(main.getBoundingClientRect().height) + 16 }, '*'); } catch (e) {}
  }
  if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.querySelector('main'));
  window.addEventListener('load', reportHeight);

  // The feedback line: kind is '' (good), 'bad' or 'hint'.
  function say(node, text, kind) {
    node.className = 'feedback' + (kind ? ' ' + kind : '');
    node.innerHTML = text;
    reportHeight();
  }
  function doneBanner(text) { return '<div class="done-banner">' + ICON.done + '<span>' + text + '</span></div>'; }
  function helpButton(host, text) {
    var btn = el('button', { type: 'button', class: 'btn ghost small-btn', 'aria-pressed': 'false' }, ICON.help + '<span>Help</span>');
    var box = el('div', { class: 'help-box', hidden: '' });
    btn.addEventListener('click', function () {
      var on = box.hidden;
      box.hidden = !on; btn.setAttribute('aria-pressed', String(on));
      box.innerHTML = typeof text === 'function' ? text() : text;
      reportHeight();
    });
    return { btn: btn, box: box, hide: function () { box.hidden = true; btn.setAttribute('aria-pressed', 'false'); } };
  }

  // ---------------------------------------------------------------- tap or drag to place
  // Items have data-item, places have data-place. Tap an item, then a place; or drag the item onto the place.
  function placer(root, onPlace, canPick) {
    var picked = null, drag = null, suppressClick = false;
    function setPicked(id) {
      picked = id;
      Array.prototype.forEach.call(root.querySelectorAll('[data-item]'), function (n) { n.classList.toggle('picked', n.getAttribute('data-item') === id); });
      root.classList.toggle('placing', !!id);
    }
    root.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; return; }
      var item = e.target.closest('[data-item]'), place = e.target.closest('[data-place]');
      if (item && root.contains(item) && (!canPick || canPick(item.getAttribute('data-item')))) {
        var id = item.getAttribute('data-item');
        if (picked && picked !== id && place) { var p = picked; setPicked(null); onPlace(p, place.getAttribute('data-place')); return; }
        setPicked(picked === id ? null : id);
        return;
      }
      if (place && picked) { var q = picked; setPicked(null); onPlace(q, place.getAttribute('data-place')); }
    });
    root.addEventListener('pointerdown', function (e) {
      var item = e.target.closest('[data-item]');
      if (!item || e.button > 0 || (canPick && !canPick(item.getAttribute('data-item')))) return;
      drag = { id: item.getAttribute('data-item'), node: item, x: e.clientX, y: e.clientY, ghost: null };
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.ghost) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
        var r = drag.node.getBoundingClientRect();
        drag.ghost = drag.node.cloneNode(true);
        drag.ghost.classList.add('drag-ghost');
        drag.ghost.style.width = r.width + 'px';
        drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
        document.body.appendChild(drag.ghost);
        drag.node.classList.add('dragging');
        setPicked(null);
      }
      drag.ghost.style.left = (e.clientX - drag.dx) + 'px';
      drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
      Array.prototype.forEach.call(root.querySelectorAll('[data-place].over'), function (n) { n.classList.remove('over'); });
      var under = document.elementFromPoint(e.clientX, e.clientY), place = under && under.closest('[data-place]');
      if (place && root.contains(place)) place.classList.add('over');
      e.preventDefault();
    }, { passive: false });
    function end(e) {
      if (!drag) return;
      var d = drag; drag = null;
      if (!d.ghost) return;
      d.ghost.remove();
      d.node.classList.remove('dragging');
      Array.prototype.forEach.call(root.querySelectorAll('[data-place].over'), function (n) { n.classList.remove('over'); });
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 50);
      if (!e || e.type === 'pointercancel') return;
      var under = document.elementFromPoint(e.clientX, e.clientY), place = under && under.closest('[data-place]');
      if (place && root.contains(place)) onPlace(d.id, place.getAttribute('data-place'));
    }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return { clear: function () { setPicked(null); } };
  }

  // ---------------------------------------------------------------- results for the teacher
  // Each activity logs its rounds and posts them after every round as BC_APP_RESULT; the lesson slide saves it as
  // that slide's answer (js/steps/embeds.html in the shell). Once finished on this computer it stays finished.
  var ACTIVITY = new URLSearchParams(location.search).get('activity') || '';
  function results(label) {
    var lines = [], right = 0, done = false, key = 'bc-ml-done-v1:' + ACTIVITY, before = false;
    try { before = localStorage.getItem(key) === '1'; } catch (e) {}
    function post() {
      if (window.parent === window || !ACTIVITY) return;
      var head = (done ? 'Finished. ' : before ? 'Finished on an earlier visit. Now: ' : 'Not finished yet. ') + right + ' right in ' + lines.length + ' tries.';
      try {
        window.parent.postMessage({ type: 'BC_APP_RESULT', questionId: 'lab-' + ACTIVITY, label: 'Model Lab: ' + label,
          summary: head + (lines.length ? ' ' + lines.join(' ') : ''), complete: done || before }, '*');
      } catch (e) {}
    }
    return {
      add: function (text, ok) { if (ok) right++; lines.push((lines.length + 1) + '. ' + (ok ? 'Right' : 'Wrong') + ': ' + text + '.'); if (lines.length > 30) lines.shift(); post(); },
      finish: function () { done = true; try { localStorage.setItem(key, '1'); } catch (e) {} post(); }
    };
  }

  // A data table: rows of [label, value]; a value of null is drawn as a blank.
  function dataTable(rows, cls) {
    return '<table class="data ' + (cls || '') + '"><tbody>' + rows.map(function (r) {
      return '<tr' + (r[2] ? ' class="' + r[2] + '"' : '') + '><td>' + esc(r[0]) + '</td><td class="val">' + (r[1] == null ? '<span class="blank">blank</span>' : esc(String(r[1]))) + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function modelBox(m, extraHtml) {
    return '<div class="model-box"><div class="model-name">' + ICON.gear + '<b>' + esc(m.name) + '</b><span>It predicts ' + esc(m.out) + '.</span></div>' +
      '<div class="model-rule"><b>Rule:</b> ' + esc(m.rule) + '</div>' + (extraHtml || '') + '</div>';
  }
  function fmt(n, unit) { return n + (unit === '%' ? '%' : unit ? ' ' + unit : ''); }

  return { el: el, esc: esc, ICON: ICON, reportHeight: reportHeight, say: say, doneBanner: doneBanner, helpButton: helpButton,
    placer: placer, results: results, dataTable: dataTable, modelBox: modelBox, fmt: fmt, activities: {} };
})();
