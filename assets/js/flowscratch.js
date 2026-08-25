/*
 * FlowScratch: flowchart program editor for TurboWarp
 *
 * Activated when the URL contains ?flowscratch (or ?flowscratch=1).
 * The blocks workspace is hidden; a flowchart canvas overlays the left
 * side (ported from the standalone Flowbox Playground prototype). TurboWarp's
 * stage (right side) remains fully interactive and is driven for real:
 * running the flowchart moves, recolours, and talks through the actual
 * selected sprite on the actual stage, via window.vm, the same way
 * PyScratch drives it from typed Python.
 *
 * Usage in a lesson:
 *   scratch/editor.html?flowscratch=1&project_url=https://...
 *
 * DOES NOT alter TurboWarp when ?flowscratch is absent.
 *
 * This is a deliberately independent file from pyscratch.js, not a shared
 * module. Both scripts need a small "drive window.vm targets from outside
 * Scratch's own blocks" core, but pyscratch.js's version is entangled with
 * its Skulpt/Python bridge (generation tokens, suspensions, thread
 * management) in a 7500-line file that's already proven in production.
 * Rather than risk that file to extract a shared core, FlowScratch carries
 * its own small copy of just the vm-driving calls the 7 flowchart blocks
 * need (see runBlock/evaluateCondition below). If a future change is meant
 * to apply to both apps' stage-driving code, make that call explicitly,
 * don't assume the two should be merged just because they look similar.
 *
 * Known limitation (v1): flowcharts are cached in localStorage per sprite
 * (same technique as PyScratch's own thread storage) but are NOT yet
 * embedded into the saved .sb3 project file the way PyScratch code is, so
 * a flowchart doesn't travel with a project export/share, only with this
 * browser's local storage. Add that the same way pyscratch.js patches
 * vm.toJSON/vm.loadProject if that's needed later.
 */
(function () {
  'use strict';

  if (!/[?&]flowscratch/.test(location.search)) return; // no-op for normal TurboWarp / PyScratch

  var STAGE_HALF_W = 240, STAGE_HALF_H = 180; // Scratch's native 480x360 stage, centered on 0,0

  var FS = {
    vm: null,
    nodes: [], edges: [], selected: null,
    scale: 1, panX: 20, panY: 20, id: 0, edgeId: 0,
    drag: null, connect: null, palette: null,
    running: false, gen: 0,
    answer: '',
    pressedKeys: {},
    activeSprite: null, activeSpriteId: null
  };

  var TYPES = {
    start:     { shape: 'oval',    title: 'Start',      data: {} },
    end:       { shape: 'oval',    title: 'End',        data: {} },
    colour:    { shape: 'process', title: 'Set colour',  data: { colour: '#ff5566' } },
    move:      { shape: 'process', title: 'Move right',  data: { amount: 60 } },
    say:       { shape: 'io',      title: 'Say',         data: { text: 'Hello!' } },
    ask:       { shape: 'io',      title: 'Ask',         data: { text: 'What is your name?' } },
    selection: { shape: 'selection', title: 'Selection', data: { negate: 'is', condition: 'key', value: 'Space' } }
  };
  var ANCHOR_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function waitFor(test) {
    return new Promise(function (resolve) {
      (function check() { var r = test(); if (r) resolve(r); else setTimeout(check, 100); })();
    });
  }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ── vm target helpers (independent of pyscratch.js's own copy) ─────────
  function getTargetByName(name) {
    try {
      if (!FS.vm || !FS.vm.runtime || !FS.vm.runtime.targets) return null;
      return FS.vm.runtime.targets.find(function (t) { return t.sprite && t.sprite.name === name; }) || null;
    } catch (e) { return null; }
  }
  function getSprites() {
    try { return FS.vm.runtime.targets.filter(function (t) { return !t.isStage; }); } catch (e) { return []; }
  }
  function nativeSelectedSpriteName() {
    try {
      var target = FS.vm && FS.vm.editingTarget;
      if (!target && FS.vm && FS.vm.runtime && typeof FS.vm.runtime.getEditingTarget === 'function') {
        target = FS.vm.runtime.getEditingTarget();
      }
      if (target && !target.isStage && target.sprite) return target.sprite.name;
    } catch (e) {}
    return null;
  }
  function activeTarget() { return FS.activeSprite ? getTargetByName(FS.activeSprite) : null; }

  // Scratch's colour graphic effect is a 0-200 hue-rotation dial, not an
  // arbitrary hex fill (sprites are costume bitmaps, not solid shapes with
  // a settable fill colour). "Set colour" applies the closest honest
  // equivalent: rotate the sprite's colour effect to the hue of the chosen
  // colour. On a mostly-white/grey costume this reads as a genuine recolour;
  // on a highly coloured costume it shifts hue rather than replacing it,
  // same as Scratch's own colour effect always has.
  function hexToScratchColourEffect(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0;
    var r = parseInt(m[1].slice(0, 2), 16) / 255, g = parseInt(m[1].slice(2, 4), 16) / 255, b = parseInt(m[1].slice(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0;
    if (max !== min) {
      var d = max - min;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return (h / 360) * 200;
  }

  // ── Per-sprite flowchart storage (localStorage, keyed by stable target id) ─
  function storeKey(spriteName) {
    var t = getTargetByName(spriteName);
    if (t && t.id) return 'flowscratch:' + t.id;
    return 'flowscratch:name:' + spriteName;
  }
  function loadGraph(spriteName) {
    try {
      var raw = localStorage.getItem(storeKey(spriteName));
      if (raw) { var g = JSON.parse(raw); return { nodes: g.nodes || [], edges: g.edges || [] }; }
    } catch (e) {}
    return { nodes: [], edges: [] };
  }
  function saveGraph(spriteName) {
    if (!spriteName) return;
    try { localStorage.setItem(storeKey(spriteName), JSON.stringify({ nodes: FS.nodes, edges: FS.edges })); } catch (e) {}
  }

  // ── Graph model ──────────────────────────────────────────────────────
  function addNode(type, x, y, render) {
    var t = TYPES[type];
    var n = { id: 'n' + (++FS.id), type: type, shape: t.shape, x: x, y: y, data: clone(t.data) };
    FS.nodes.push(n);
    if (render !== false) renderAll();
    return n;
  }
  function getNode(id) { return FS.nodes.find(function (n) { return n.id === id; }); }
  function addEdge(from, to, fromA, toA) {
    if (from === to || FS.edges.some(function (e) { return e.from === from && e.to === to; })) return;
    FS.edges.push({ id: 'e' + (++FS.edgeId), from: from, to: to, fromA: fromA || 'E', toA: toA || 'W' });
    renderWires();
  }

  // ── DOM refs (created in buildUI) ───────────────────────────────────
  var els = {};

  function nodeMarkup(n) {
    var sub = '';
    if (n.type === 'colour') sub = '<input type="color" data-field="colour" value="' + n.data.colour + '">';
    if (n.type === 'move') sub = '<span class="fs-node-subtitle">' + n.data.amount + ' pixels</span>';
    if (n.type === 'say' || n.type === 'ask') sub = '<span class="fs-node-subtitle">' + esc(n.data.text) + '</span>';
    var content;
    if (n.type === 'selection') {
      var choices = n.data.condition === 'key'
        ? [['Space', 'space'], ['ArrowRight', 'right arrow'], ['ArrowLeft', 'left arrow'], ['ArrowUp', 'up arrow'], ['ArrowDown', 'down arrow']]
        : n.data.condition === 'edge'
          ? [['any', 'any edge'], ['left', 'left edge'], ['right', 'right edge'], ['top', 'top edge'], ['bottom', 'bottom edge']]
          : [['any', 'any answer']];
      content = '<div class="fs-node-content"><div class="fs-node-title">If</div>' +
        '<select data-field="negate"><option value="is"' + (n.data.negate === 'is' ? ' selected' : '') + '>is</option><option value="not"' + (n.data.negate === 'not' ? ' selected' : '') + '>not</option></select>' +
        '<select data-field="condition"><option value="key"' + (n.data.condition === 'key' ? ' selected' : '') + '>key pressed</option><option value="edge"' + (n.data.condition === 'edge' ? ' selected' : '') + '>touching edge</option><option value="answer"' + (n.data.condition === 'answer' ? ' selected' : '') + '>answer exists</option></select>' +
        '<select data-field="value">' + choices.map(function (c) { return '<option value="' + c[0] + '"' + (n.data.value === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></div>';
    } else {
      content = '<div class="fs-node-title">' + TYPES[n.type].title + '</div>' + sub;
    }
    return '<div class="fs-node ' + n.shape + (FS.selected === n.id ? ' selected' : '') + '" data-id="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px"><div class="fs-node-body">' + content + '</div>' +
      ANCHOR_NAMES.map(function (a) { return '<span class="fs-anchor" data-a="' + a + '"></span>'; }).join('') + '</div>';
  }

  function renderAll() { els.nodes.innerHTML = FS.nodes.map(nodeMarkup).join(''); bindNodes(); renderWires(); renderInspector(); }

  function bindNodes() {
    Array.prototype.forEach.call(els.nodes.querySelectorAll('.fs-node'), function (el) {
      el.addEventListener('pointerdown', function (e) {
        if (e.target.matches('.fs-anchor,select,input')) return;
        select(el.dataset.id);
        var n = getNode(el.dataset.id);
        FS.drag = { kind: 'node', id: n.id, startX: e.clientX, startY: e.clientY, x: n.x, y: n.y };
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('click', function (e) { if (!e.target.matches('.fs-anchor')) select(el.dataset.id); });
      Array.prototype.forEach.call(el.querySelectorAll('.fs-anchor'), function (a) {
        a.addEventListener('pointerdown', function (e) {
          e.stopPropagation();
          var n = getNode(el.dataset.id);
          FS.connect = { from: n.id, fromA: a.dataset.a };
          els.canvasWrap.classList.add('connecting');
          els.draft.style.display = 'block';
          updateDraft(e.clientX, e.clientY);
          a.setPointerCapture(e.pointerId);
        });
      });
      Array.prototype.forEach.call(el.querySelectorAll('[data-field]'), function (c) {
        c.addEventListener('change', function (e) {
          var n = getNode(el.dataset.id), field = e.target.dataset.field;
          n.data[field] = e.target.value;
          if (field === 'condition') n.data.value = e.target.value === 'key' ? 'Space' : 'any';
          renderAll(); saveGraph(FS.activeSprite);
        });
      });
    });
  }

  function select(id) { FS.selected = id; renderAll(); }

  function center(n, a) {
    var w = 174, h = n.shape === 'selection' ? 130 : 78;
    var points = { N: [w / 2, 0], NE: [w * .86, 8], E: [w, h / 2], SE: [w * .86, h - 8], S: [w / 2, h], SW: [w * .14, h - 8], W: [0, h / 2], NW: [w * .14, 8] };
    var p = points[a] || points.E;
    return { x: n.x + p[0], y: n.y + p[1] };
  }
  function curve(p1, p2) {
    var dx = Math.max(55, Math.abs(p2.x - p1.x) * .45);
    return 'M' + p1.x + ',' + p1.y + ' C' + (p1.x + dx) + ',' + p1.y + ' ' + (p2.x - dx) + ',' + p2.y + ' ' + p2.x + ',' + p2.y;
  }
  function renderWires(activeId) {
    els.wireLayer.innerHTML = FS.edges.map(function (e) {
      var a = getNode(e.from), b = getNode(e.to);
      if (!a || !b) return '';
      var p1 = center(a, e.fromA), p2 = center(b, e.toA), d = curve(p1, p2);
      var branch = a.type === 'selection' ? FS.edges.filter(function (x) { return x.from === a.id; }).indexOf(e) : -1;
      var label = branch === 0 ? 'True' : branch === 1 ? 'False' : '';
      return '<g data-edge="' + e.id + '"><path class="fs-wire-hit" d="' + d + '"/><path class="fs-wire ' + (activeId === e.id ? 'active' : '') + '" d="' + d + '" marker-end="url(#fsArrow)"/>' +
        (label ? '<text class="fs-wire-label" x="' + (p1.x + p2.x) / 2 + '" y="' + ((p1.y + p2.y) / 2 - 7) + '">' + label + '</text>' : '') + '</g>';
    }).join('');
    Array.prototype.forEach.call(els.wireLayer.querySelectorAll('.fs-wire-hit'), function (p) {
      p.addEventListener('click', function () {
        FS.edges = FS.edges.filter(function (e) { return e.id !== p.parentNode.dataset.edge; });
        renderWires(); saveGraph(FS.activeSprite);
      });
    });
  }

  function screenToWorld(x, y) {
    var r = els.canvasWrap.getBoundingClientRect();
    return { x: (x - r.left - FS.panX) / FS.scale, y: (y - r.top - FS.panY) / FS.scale };
  }
  function updateTransform() {
    els.world.style.transform = 'translate(' + FS.panX + 'px,' + FS.panY + 'px) scale(' + FS.scale + ')';
    els.zoomReadout.textContent = Math.round(FS.scale * 100) + '%';
  }
  function updateDraft(x, y) {
    if (!FS.connect) return;
    var p1 = center(getNode(FS.connect.from), FS.connect.fromA), p2 = screenToWorld(x, y);
    els.draft.setAttribute('d', curve(p1, p2));
  }

  function renderInspector() {
    var host = els.inspector, n = getNode(FS.selected);
    if (!n) { host.className = 'fs-empty'; host.innerHTML = 'Select a block to edit it.'; return; }
    host.className = '';
    var f = '';
    if (n.type === 'move') f = field('Distance (pixels)', 'number', 'amount', n.data.amount);
    if (n.type === 'say' || n.type === 'ask') f = field(n.type === 'say' ? 'Message' : 'Question', 'text', 'text', n.data.text);
    if (n.type === 'colour') f = field('Sprite colour', 'color', 'colour', n.data.colour);
    if (n.type === 'selection') f = '<p class="fs-empty">Use the dropdowns inside this block. Its first outgoing connector is True; its second is False.</p>';
    host.innerHTML = '<b>' + TYPES[n.type].title + '</b>' + f + '<button class="fs-danger" id="fsDeleteNode">Delete block</button>';
    Array.prototype.forEach.call(host.querySelectorAll('[data-inspect]'), function (i) {
      i.addEventListener('input', function () {
        n.data[i.dataset.inspect] = i.type === 'number' ? Number(i.value) : i.value;
        renderAll(); select(n.id); saveGraph(FS.activeSprite);
      });
    });
    var del = host.querySelector('#fsDeleteNode');
    if (del) del.onclick = removeSelected;
  }
  function field(label, type, key, value) {
    return '<div class="fs-field"><label>' + label + '</label><input data-inspect="' + key + '" type="' + type + '" value="' + esc(value) + '"></div>';
  }
  function removeSelected() {
    if (!FS.selected) return;
    FS.nodes = FS.nodes.filter(function (n) { return n.id !== FS.selected; });
    FS.edges = FS.edges.filter(function (e) { return e.from !== FS.selected && e.to !== FS.selected; });
    FS.selected = null;
    renderAll(); saveGraph(FS.activeSprite);
  }

  function validate() {
    var errors = [];
    var starts = FS.nodes.filter(function (n) { return n.type === 'start'; });
    var ends = FS.nodes.filter(function (n) { return n.type === 'end'; });
    if (starts.length !== 1) errors.push('Flow needs exactly one Start block (found ' + starts.length + ').');
    if (!ends.length) errors.push('Flow needs at least one End block.');
    var out = function (id) { return FS.edges.filter(function (e) { return e.from === id; }).map(function (e) { return e.to; }); };
    var inc = function (id) { return FS.edges.filter(function (e) { return e.to === id; }).map(function (e) { return e.from; }); };
    FS.nodes.forEach(function (n) {
      if (n.type !== 'end' && !out(n.id).length) errors.push(TYPES[n.type].title + ' has no outgoing connection.');
      if (n.type !== 'start' && !inc(n.id).length) errors.push(TYPES[n.type].title + ' has no incoming connection.');
      if (n.type === 'selection' && out(n.id).length !== 2) errors.push('Each Selection must have exactly two outgoing connections (True first, False second).');
    });
    if (starts.length === 1) {
      var seen = {};
      (function walk(id) { if (seen[id]) return; seen[id] = true; out(id).forEach(walk); })(starts[0].id);
      FS.nodes.forEach(function (n) { if (!seen[n.id]) errors.push(TYPES[n.type].title + ' is not reachable from Start.'); });
    }
    return errors.filter(function (e, i, a) { return a.indexOf(e) === i; });
  }

  function notify(msg, kind) {
    var t = els.toast;
    t.textContent = msg; t.className = 'fs-toast show ' + (kind || '');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(function () { t.className = 'fs-toast'; }, 4300);
  }

  // ── Runtime: drive the real, currently-selected TurboWarp sprite ───────
  function runBlock(n) {
    var target = activeTarget();
    if (!target) return Promise.resolve();
    switch (n.type) {
      case 'colour':
        try { target.setEffect('color', hexToScratchColourEffect(n.data.colour)); } catch (e) {}
        return wait(120);
      case 'move':
        target.setXY(target.x + Number(n.data.amount || 0), target.y);
        return wait(120);
      case 'say':
        try { target.runtime.emit('SAY', target, 'say', n.data.text == null ? '' : String(n.data.text)); } catch (e) {}
        return wait(850).then(function () {
          try { target.runtime.emit('SAY', target, 'say', ''); } catch (e) {}
        });
      case 'ask':
        return showAskBox(n.data.text).then(function (answer) {
          FS.answer = answer || '';
          els.answerValue.textContent = FS.answer || String.fromCharCode(8709);
        });
      default:
        return wait(60);
    }
  }
  function evaluateCondition(n) {
    var target = activeTarget();
    var v = false;
    if (n.data.condition === 'key') v = !!FS.pressedKeys[n.data.value];
    else if (n.data.condition === 'edge' && target) {
      var edges = {
        left: target.x <= -STAGE_HALF_W, right: target.x >= STAGE_HALF_W,
        top: target.y >= STAGE_HALF_H, bottom: target.y <= -STAGE_HALF_H
      };
      v = n.data.value === 'any' ? (edges.left || edges.right || edges.top || edges.bottom) : !!edges[n.data.value];
    } else if (n.data.condition === 'answer') v = !!FS.answer;
    return n.data.negate === 'not' ? !v : v;
  }
  function showAskBox(text) {
    return new Promise(function (resolve) {
      els.askLabel.textContent = text;
      els.askWrap.classList.add('active');
      els.askInput.value = '';
      els.askInput.focus();
      els.askForm.onsubmit = function (e) {
        e.preventDefault();
        els.askWrap.classList.remove('active');
        resolve(els.askInput.value);
      };
    });
  }

  function setRunStatus(text) { if (els.runStatus) els.runStatus.textContent = text; }

  function run() {
    if (FS.running) return;
    var errors = validate();
    if (errors.length) { notify(errors[0] + (errors.length > 1 ? ' (+' + (errors.length - 1) + ' more)' : ''), 'error'); return; }
    FS.running = true;
    var myGen = ++FS.gen;
    els.runBtn.style.display = 'none'; els.stopBtn.style.display = 'inline-block';
    FS.answer = ''; els.answerValue.textContent = String.fromCharCode(8709);
    var start = FS.nodes.find(function (n) { return n.type === 'start'; });
    var current = start, steps = 0;
    (async function loop() {
      while (FS.running && FS.gen === myGen && current && steps++ < 400) {
        setRunStatus(TYPES[current.type].title);
        var outs = FS.edges.filter(function (e) { return e.from === current.id; });
        renderWires(outs[0] && outs[0].id);
        if (current.type === 'end') break;
        await runBlock(current);
        if (FS.gen !== myGen) return;
        if (current.type === 'selection') {
          var truth = evaluateCondition(current);
          current = getNode(outs[truth ? 0 : 1] ? outs[truth ? 0 : 1].to : undefined);
        } else {
          current = getNode(outs[0] ? outs[0].to : undefined);
        }
      }
      if (steps >= 400) notify('Stopped: possible infinite loop.', 'error');
      finishRun(myGen);
    })();
  }
  function finishRun(myGen) {
    if (myGen !== undefined && myGen !== FS.gen) return;
    FS.running = false;
    els.runBtn.style.display = 'inline-block'; els.stopBtn.style.display = 'none';
    setRunStatus('Ready');
    els.askWrap.classList.remove('active');
    renderWires();
  }
  function stop() { FS.gen++; finishRun(FS.gen); }

  // ── UI construction ──────────────────────────────────────────────────
  function injectStyle() {
    var style = document.createElement('style');
    style.textContent = [
      '#fs-overlay{position:fixed;left:0;top:92px;right:60%;bottom:0;z-index:45;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:13px;color:#18191b;background:#e9e9eb;border-right:2px solid #151619;box-shadow:4px 0 20px rgba(0,0,0,.35)}',
      '#fs-overlay.fs-suppressed{display:none}',
      '.blocklyDiv,.blocklyToolboxDiv,.blocklyFlyout,.blocklyWidgetDiv{display:none !important}',
      '#fs-topbar{display:flex;align-items:center;gap:8px;padding:0 10px;height:42px;flex-shrink:0;background:#151619;color:#fff;border-bottom:1px solid #000}',
      '#fs-topbar button{font:inherit;cursor:pointer;border:1px solid #3d3f45;background:#24262a;color:#fff;border-radius:7px;padding:5px 9px;font-size:12px}',
      '#fs-topbar button:hover{background:#32343a}',
      '#fs-topbar .fs-run{border-color:#32c87d;background:#1d9d5d;font-weight:700}#fs-topbar .fs-run:hover{background:#22ad66}',
      '#fs-topbar .fs-stop{display:none}',
      '#fs-topbar .fs-spacer{flex:1}',
      '#fs-zoom-readout{min-width:38px;text-align:center;color:#c7c9ce;font-variant-numeric:tabular-nums;font-size:11px}',
      '#fs-body{flex:1;display:flex;min-height:0}',
      '#fs-sidebar{width:150px;flex-shrink:0;background:#fff;border-right:1px solid #d8d9dd;padding:10px 8px;overflow:auto}',
      '#fs-sidebar h2{font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin:8px 0 6px;color:#666970}',
      '.fs-palette-item{display:flex;align-items:center;gap:6px;min-height:34px;padding:6px 7px;border:1px solid #d8d9dd;border-radius:8px;background:#fff;cursor:grab;user-select:none;margin-bottom:6px;font-size:11px}',
      '.fs-palette-item:hover{border-color:#9ea1aa;box-shadow:0 3px 10px rgba(0,0,0,.08)}',
      '#fs-canvas-wrap{position:relative;overflow:hidden;flex:1;min-width:0;background:#ededee;touch-action:none;cursor:grab}',
      '#fs-canvas-wrap.panning{cursor:grabbing}#fs-canvas-wrap.connecting{cursor:crosshair}',
      '#fs-world{position:absolute;left:0;top:0;width:2200px;height:1400px;transform-origin:0 0;background-color:#fafafa;background-image:radial-gradient(#c9cbd0 1px,transparent 1px);background-size:22px 22px;box-shadow:0 0 0 1px #d3d4d7}',
      '#fs-wires{position:absolute;inset:0;width:2200px;height:1400px;overflow:visible;pointer-events:none}',
      '.fs-wire{fill:none;stroke:#646873;stroke-width:2.2}.fs-wire.active{stroke:#22b36b;stroke-width:3.6}',
      '.fs-wire-hit{fill:none;stroke:transparent;stroke-width:13;pointer-events:stroke;cursor:pointer}.fs-wire-hit:hover+.fs-wire{stroke:#d84c4c}',
      '.fs-wire-label{font-size:10px;font-weight:750;fill:#454850;paint-order:stroke;stroke:#fafafa;stroke-width:5px;stroke-linejoin:round}',
      '.fs-node{position:absolute;width:150px;min-height:66px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,.12));user-select:none}',
      '.fs-node-body{position:relative;width:100%;min-height:66px;padding:9px 12px;background:#fff;border:2px solid #4d515a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;font-size:11px}',
      '.fs-node.selected .fs-node-body{border-color:#4b66e8;box-shadow:0 0 0 3px rgba(75,102,232,.17)}',
      '.fs-node.oval .fs-node-body{border-radius:50%}',
      '.fs-node.io .fs-node-body{clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);padding-left:20px;padding-right:20px}',
      '.fs-node.selection .fs-node-body{width:96px;height:96px;min-height:96px;padding:14px;transform:rotate(45deg)}',
      '.fs-node.selection{width:150px;height:112px}',
      '.fs-node.selection .fs-node-content{transform:rotate(-45deg);width:106px}',
      '.fs-node.selection select{max-width:90px;font-size:9px;padding:1px}',
      '.fs-node-title{font-size:11px;font-weight:750}',
      '.fs-node-subtitle{font-size:10px;color:#686b73;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.fs-node input[type=color]{width:38px;height:19px;padding:1px;border:1px solid #bbb;border-radius:4px}',
      '.fs-anchor{position:absolute;width:10px;height:10px;border-radius:50%;background:#24bc70;border:2px solid #fff;box-shadow:0 0 0 1px #16864f;z-index:5;cursor:crosshair;opacity:.7}',
      '.fs-node:hover .fs-anchor,.fs-node.selected .fs-anchor{opacity:1}',
      '.fs-anchor[data-a=N]{left:50%;top:-5px;transform:translateX(-50%)}.fs-anchor[data-a=NE]{right:14%;top:2px}.fs-anchor[data-a=E]{right:-5px;top:50%;transform:translateY(-50%)}.fs-anchor[data-a=SE]{right:14%;bottom:2px}.fs-anchor[data-a=S]{left:50%;bottom:-5px;transform:translateX(-50%)}.fs-anchor[data-a=SW]{left:14%;bottom:2px}.fs-anchor[data-a=W]{left:-5px;top:50%;transform:translateY(-50%)}.fs-anchor[data-a=NW]{left:14%;top:2px}',
      '#fs-toast{display:none;position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:30;max-width:90%;padding:8px 12px;border-radius:8px;color:#fff;background:#202226;font-size:12px;box-shadow:0 8px 22px rgba(0,0,0,.3)}',
      '#fs-toast.show{display:block}#fs-toast.error{background:#ad3535}#fs-toast.ok{background:#168653}',
      '#fs-status-bar{flex-shrink:0;display:flex;justify-content:space-between;padding:6px 10px;background:#fff;border-top:1px solid #d8d9dd;color:#686b73;font-size:11px}',
      '#fs-answer-value{font-family:ui-monospace,monospace;color:#333}',
      '#fs-inspector{width:170px;flex-shrink:0;background:#fff;border-left:1px solid #d8d9dd;padding:10px 9px;overflow:auto;font-size:11px}',
      '#fs-inspector h2{font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;color:#666970}',
      '.fs-empty{color:#686b73;font-size:11px}',
      '.fs-field{display:grid;gap:4px;margin:8px 0}.fs-field label{font-size:10px;color:#686b73}.fs-field input{width:100%;border:1px solid #c8c9ce;border-radius:6px;padding:5px;background:#fff;font-size:11px}',
      '.fs-danger{width:100%;margin-top:8px;border:1px solid #e2b3b3;color:#b43030;background:#fff;border-radius:6px;padding:5px;cursor:pointer;font-size:11px}',
      '#fs-ask-wrap{position:fixed;bottom:14px;left:14px;width:280px;z-index:10010;pointer-events:none;display:none}',
      '#fs-ask-wrap.active{display:block;pointer-events:auto}',
      '#fs-ask-box{background:#fff;border:2px solid #4c97ff;border-radius:8px;padding:9px 11px;box-shadow:0 4px 20px rgba(0,0,0,.3)}',
      '#fs-ask-label{font-size:12px;color:#333;margin-bottom:6px}',
      '#fs-ask-row{display:flex;gap:6px}',
      '#fs-ask-row input{min-width:0;flex:1;border:1px solid #bbb;border-radius:6px;padding:6px}',
      '#fs-ask-row button{border:0;border-radius:6px;background:#4b66e8;color:#fff;padding:6px 10px;cursor:pointer}',
      '#fs-palette-ghost{position:fixed;z-index:100;pointer-events:none;padding:8px 10px;border:1px solid #8b8f98;border-radius:8px;background:#fff;box-shadow:0 10px 28px rgba(0,0,0,.13);font-weight:700;font-size:11px;opacity:.9;transform:translate(-50%,-50%) rotate(-2deg)}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function buildUI() {
    injectStyle();
    var root = document.createElement('div');
    root.id = 'fs-overlay';
    root.innerHTML =
      '<div id="fs-topbar">' +
        '<button id="fsRunBtn" class="fs-run">&#9654; Run</button>' +
        '<button id="fsStopBtn" class="fs-stop">&#9632; Stop</button>' +
        '<button id="fsValidateBtn">Check flow</button>' +
        '<button id="fsClearBtn">Clear</button>' +
        '<div class="fs-spacer"></div>' +
        '<button id="fsZoomOut">&minus;</button><span id="fs-zoom-readout">100%</span><button id="fsZoomIn">+</button><button id="fsFitBtn">Fit</button>' +
      '</div>' +
      '<div id="fs-body">' +
        '<aside id="fs-sidebar">' +
          '<h2>Flow</h2>' +
          '<div class="fs-palette-item" data-type="start"><b>Start</b></div>' +
          '<div class="fs-palette-item" data-type="end"><b>End</b></div>' +
          '<h2>Process</h2>' +
          '<div class="fs-palette-item" data-type="colour"><b>Set colour</b></div>' +
          '<div class="fs-palette-item" data-type="move"><b>Move right</b></div>' +
          '<h2>Input / output</h2>' +
          '<div class="fs-palette-item" data-type="say"><b>Say</b></div>' +
          '<div class="fs-palette-item" data-type="ask"><b>Ask</b></div>' +
          '<h2>Selection</h2>' +
          '<div class="fs-palette-item" data-type="selection"><b>Condition</b></div>' +
        '</aside>' +
        '<section id="fs-canvas-wrap">' +
          '<div id="fs-toast"></div>' +
          '<div id="fs-world"><svg id="fs-wires"><defs><marker id="fsArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#646873"/></marker></defs><g id="fs-wire-layer"></g><path id="fs-draft-wire" class="fs-wire active" style="display:none"/></svg><div id="fs-nodes"></div></div>' +
        '</section>' +
        '<aside id="fs-inspector"><h2>Selected block</h2><div id="fs-inspector-body" class="fs-empty">Select a block to edit it.</div></aside>' +
      '</div>' +
      '<div id="fs-status-bar"><span id="fs-run-status">Ready</span><span>answer: <span id="fs-answer-value">&empty;</span></span></div>' +
      '<div id="fs-ask-wrap"><form id="fs-ask-form"><div id="fs-ask-box"><label id="fs-ask-label"></label><div id="fs-ask-row"><input id="fs-ask-input" autocomplete="off"><button>Answer</button></div></div></form></div>';
    document.body.appendChild(root);

    els = {
      overlay: root,
      nodes: root.querySelector('#fs-nodes'),
      canvasWrap: root.querySelector('#fs-canvas-wrap'),
      world: root.querySelector('#fs-world'),
      wireLayer: root.querySelector('#fs-wire-layer'),
      draft: root.querySelector('#fs-draft-wire'),
      toast: root.querySelector('#fs-toast'),
      inspector: root.querySelector('#fs-inspector-body'),
      zoomReadout: root.querySelector('#fs-zoom-readout'),
      runBtn: root.querySelector('#fsRunBtn'),
      stopBtn: root.querySelector('#fsStopBtn'),
      runStatus: root.querySelector('#fs-run-status'),
      answerValue: root.querySelector('#fs-answer-value'),
      askWrap: root.querySelector('#fs-ask-wrap'),
      askForm: root.querySelector('#fs-ask-form'),
      askLabel: root.querySelector('#fs-ask-label'),
      askInput: root.querySelector('#fs-ask-input')
    };

    bindGlobalPointer();
    bindPalette();
    bindCanvas();

    els.runBtn.onclick = run;
    els.stopBtn.onclick = stop;
    els.runBtn.parentElement.querySelector('#fsValidateBtn').onclick = function () {
      var e = validate();
      notify(e.length ? e.join(' ') : 'Flow is valid and every path reaches an End.', e.length ? 'error' : 'ok');
    };
    root.querySelector('#fsClearBtn').onclick = function () {
      if (confirm('Clear every block and connector for this sprite?')) {
        FS.nodes = []; FS.edges = []; FS.selected = null; renderAll(); saveGraph(FS.activeSprite);
      }
    };
    root.querySelector('#fsZoomIn').onclick = function () { zoom(1.15); };
    root.querySelector('#fsZoomOut').onclick = function () { zoom(.87); };
    root.querySelector('#fsFitBtn').onclick = fitToScreen;
  }

  function zoom(by) { FS.scale = Math.min(1.8, Math.max(.35, FS.scale * by)); updateTransform(); }
  function fitToScreen() {
    if (!FS.nodes.length) return;
    var minX = Math.min.apply(null, FS.nodes.map(function (n) { return n.x; }));
    var minY = Math.min.apply(null, FS.nodes.map(function (n) { return n.y; }));
    var maxX = Math.max.apply(null, FS.nodes.map(function (n) { return n.x + 150; }));
    var maxY = Math.max.apply(null, FS.nodes.map(function (n) { return n.y + (n.shape === 'selection' ? 112 : 66); }));
    var r = els.canvasWrap.getBoundingClientRect();
    FS.scale = Math.min(1.2, Math.max(.35, Math.min((r.width - 60) / (maxX - minX), (r.height - 60) / (maxY - minY))));
    FS.panX = 30 - minX * FS.scale; FS.panY = 30 - minY * FS.scale;
    updateTransform();
  }

  function bindPalette() {
    Array.prototype.forEach.call(els.overlay.querySelectorAll('.fs-palette-item'), function (p) {
      p.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        var ghost = document.createElement('div');
        ghost.id = 'fs-palette-ghost';
        ghost.textContent = TYPES[p.dataset.type].title;
        document.body.appendChild(ghost);
        ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
        FS.palette = { type: p.dataset.type, ghost: ghost };
        p.setPointerCapture(e.pointerId);
      });
    });
  }

  function bindCanvas() {
    var space = false;
    els.canvasWrap.addEventListener('pointerdown', function (e) {
      var blank = e.target === els.world || e.target === els.canvasWrap;
      if (!FS.connect && ((blank && e.button === 0) || space || e.button === 1)) {
        FS.selected = null; renderAll();
        FS.drag = { kind: 'pan', startX: e.clientX, startY: e.clientY, x: FS.panX, y: FS.panY };
        els.canvasWrap.classList.add('panning');
        els.canvasWrap.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    });
    els.canvasWrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      var before = screenToWorld(e.clientX, e.clientY);
      FS.scale = Math.min(1.8, Math.max(.35, FS.scale * (e.deltaY < 0 ? 1.1 : .9)));
      var r = els.canvasWrap.getBoundingClientRect();
      FS.panX = e.clientX - r.left - before.x * FS.scale;
      FS.panY = e.clientY - r.top - before.y * FS.scale;
      updateTransform();
    }, { passive: false });
    window.addEventListener('keydown', function (e) {
      if (!els.overlay || els.overlay.style.display === 'none') { FS.pressedKeys[normKey(e.code)] = true; return; }
      FS.pressedKeys[normKey(e.code)] = true;
      if (e.code === 'Space' && !/INPUT|SELECT/.test(e.target.tagName)) { space = true; e.preventDefault(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && FS.selected && !/INPUT|SELECT/.test(e.target.tagName) && els.overlay.contains(document.activeElement) === false) removeSelected();
    });
    window.addEventListener('keyup', function (e) { FS.pressedKeys[normKey(e.code)] = false; if (e.code === 'Space') space = false; });
  }
  function normKey(code) {
    var map = { ArrowRight: 'ArrowRight', ArrowLeft: 'ArrowLeft', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', Space: 'Space' };
    return map[code] || code;
  }

  function bindGlobalPointer() {
    window.addEventListener('pointermove', function (e) {
      if (FS.palette) {
        FS.palette.ghost.style.left = e.clientX + 'px'; FS.palette.ghost.style.top = e.clientY + 'px';
      }
      if (FS.drag && FS.drag.kind === 'node') {
        var n = getNode(FS.drag.id);
        n.x = Math.max(0, FS.drag.x + (e.clientX - FS.drag.startX) / FS.scale);
        n.y = Math.max(0, FS.drag.y + (e.clientY - FS.drag.startY) / FS.scale);
        var el = els.nodes.querySelector('[data-id="' + n.id + '"]');
        if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
        renderWires();
      }
      if (FS.drag && FS.drag.kind === 'pan') {
        FS.panX = FS.drag.x + e.clientX - FS.drag.startX;
        FS.panY = FS.drag.y + e.clientY - FS.drag.startY;
        updateTransform();
      }
      if (FS.connect) updateDraft(e.clientX, e.clientY);
    });
    window.addEventListener('pointerup', function (e) {
      if (FS.palette) {
        var p = FS.palette, r = els.canvasWrap.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          var wp = screenToWorld(e.clientX, e.clientY);
          var n = addNode(p.type, Math.max(0, wp.x - 75), Math.max(0, wp.y - 33));
          select(n.id); saveGraph(FS.activeSprite);
        }
        p.ghost.remove(); FS.palette = null;
      }
      if (FS.connect) {
        var target = document.elementFromPoint(e.clientX, e.clientY);
        target = target && target.closest ? target.closest('.fs-node') : null;
        if (target && target.dataset.id !== FS.connect.from) {
          var wp2 = screenToWorld(e.clientX, e.clientY);
          var n2 = getNode(target.dataset.id);
          var cx = n2.x + 75, cy = n2.y + (n2.shape === 'selection' ? 56 : 33);
          var ang = Math.atan2(wp2.y - cy, wp2.x - cx);
          var dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
          var idx = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8;
          addEdge(FS.connect.from, n2.id, FS.connect.fromA, dirs[idx]);
          saveGraph(FS.activeSprite);
        }
        FS.connect = null; els.draft.style.display = 'none'; els.canvasWrap.classList.remove('connecting');
      }
      if (FS.drag && FS.drag.kind === 'node') saveGraph(FS.activeSprite);
      FS.drag = null; els.canvasWrap.classList.remove('panning');
    });
  }

  // ── Overlay suppression: only cover the Code tab ─────────────────────
  // The flowchart canvas replaces the blocks workspace, which only exists
  // under TurboWarp's own "Code" tab. Left permanently visible, the
  // overlay also blanks out the Costumes and Sounds tabs (and anything
  // TurboWarp opens as a real modal, e.g. the costume library), which have
  // nothing to do with the flowchart and must stay reachable. Same
  // approach pyscratch.js already uses for the same reason, reimplemented
  // independently rather than shared (see the top-of-file note on why).
  function isCodeTabActive() {
    var tabs = document.querySelectorAll('[role="tab"], button, li');
    for (var i = 0; i < tabs.length; i++) {
      var el = tabs[i];
      if ((el.textContent || '').trim() !== 'Code') continue;
      var cls = typeof el.className === 'string' ? el.className : '';
      if (el.getAttribute('aria-selected') === 'true') return true;
      if (cls.indexOf('selected') !== -1 || cls.indexOf('--selected') !== -1) return true;
    }
    return false;
  }
  function isVisibleOverlayElement(el) {
    if (!el || el.id === 'fs-overlay' || el.closest('#fs-overlay')) return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 36 && rect.height > 18 && rect.bottom > 0 && rect.right > 0 &&
      rect.top < window.innerHeight && rect.left < window.innerWidth;
  }
  function hasTurboWarpBlockingOverlayOpen() {
    var nodes = document.body ? document.body.querySelectorAll('body *') : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!isVisibleOverlayElement(el)) continue;
      var cls = typeof el.className === 'string' ? el.className : '';
      var role = el.getAttribute && el.getAttribute('role');
      var modal = el.getAttribute && el.getAttribute('aria-modal');
      var looksLikeTwOverlay = cls.indexOf('modal_') !== -1 || cls.indexOf('library_') !== -1 ||
        cls.indexOf('ReactModal') !== -1 || role === 'dialog' || modal === 'true';
      if (!looksLikeTwOverlay) continue;
      var rect = el.getBoundingClientRect();
      if (role === 'dialog' || modal === 'true') return true;
      if (rect.width > window.innerWidth * 0.45 && rect.height > window.innerHeight * 0.35) return true;
    }
    return false;
  }
  function updateOverlaySuppression() {
    if (!els.overlay) return;
    var suppressed = !isCodeTabActive() || hasTurboWarpBlockingOverlayOpen();
    els.overlay.classList.toggle('fs-suppressed', suppressed);
    if (suppressed && FS.running) stop();
  }
  function watchTurboWarpTabsAndModals() {
    if (!window.MutationObserver || !document.body) return;
    var pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; updateOverlaySuppression(); adjustOverlay(); }, 50);
    }
    var observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'aria-modal', 'role'] });
    schedule();
  }

  // ── Overlay sizing: mirror the visible stage canvas exactly ─────────
  function adjustOverlay() {
    var canvas = document.querySelector('canvas');
    if (!canvas || !els.overlay) return;
    var rect = canvas.getBoundingClientRect();
    if (rect.top > 40 && rect.top < window.innerHeight - 80) {
      els.overlay.style.top = Math.round(rect.top) + 'px';
    }
    if (rect.left > 60 && rect.left < window.innerWidth - 60) {
      els.overlay.style.right = 'auto';
      els.overlay.style.width = Math.round(rect.left) + 'px';
    }
  }

  // ── Sprite switching ─────────────────────────────────────────────────
  function syncSelectedSprite() {
    var sprites = getSprites();
    if (!sprites.length) return;
    var selectedName = nativeSelectedSpriteName() || (FS.activeSprite && getTargetByName(FS.activeSprite) ? FS.activeSprite : sprites[0].sprite.name);
    if (!selectedName || selectedName === FS.activeSprite) return;
    if (FS.running) stop();
    if (FS.activeSprite) saveGraph(FS.activeSprite);
    FS.activeSprite = selectedName;
    var t = getTargetByName(selectedName);
    FS.activeSpriteId = t ? t.id : null;
    var g = loadGraph(selectedName);
    FS.nodes = g.nodes; FS.edges = g.edges; FS.selected = null;
    FS.id = FS.nodes.reduce(function (m, n) { return Math.max(m, parseInt(n.id.slice(1), 10) || 0); }, 0);
    FS.edgeId = FS.edges.reduce(function (m, e) { return Math.max(m, parseInt(e.id.slice(1), 10) || 0); }, 0);
    if (!FS.nodes.length) {
      var a = addNode('start', 60, 90, false), b = addNode('end', 380, 90, false);
      addEdge(a.id, b.id);
    }
    renderAll();
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  waitFor(function () { return (window.vm && window.vm.runtime) ? window.vm : null; }).then(function (vm) {
    FS.vm = vm;
    buildUI();
    updateTransform();
    syncSelectedSprite();
    setInterval(syncSelectedSprite, 500);
    setTimeout(adjustOverlay, 400);
    setTimeout(adjustOverlay, 1200);
    window.addEventListener('resize', adjustOverlay);
    try { vm.runtime.on('TARGETS_UPDATE', adjustOverlay); } catch (e) {}
    watchTurboWarpTabsAndModals();

    // Hook TurboWarp's green flag -> run the active sprite's flowchart.
    try { vm.runtime.on('PROJECT_START', function () { setTimeout(run, 0); }); } catch (e) {}

    // Hook TurboWarp's stop button -> stop the flowchart too.
    try {
      var origStop = vm.stopAll.bind(vm);
      vm.stopAll = function () { stop(); return origStop(); };
    } catch (e) {}
    try {
      var origRtStop = vm.runtime.stopAll.bind(vm.runtime);
      vm.runtime.stopAll = function () { stop(); return origRtStop(); };
    } catch (e) {}

    console.log('[FlowScratch] Ready. vm=', vm);
  });
})();
