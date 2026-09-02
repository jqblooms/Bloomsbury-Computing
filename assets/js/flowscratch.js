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
 * its own small copy of just the vm-driving calls the flowchart blocks
 * need (see runBlock/evaluateCondition below). If a future change is meant
 * to apply to both apps' stage-driving code, make that call explicitly,
 * don't assume the two should be merged just because they look similar.
 *
 * Each sprite has its own independent flowchart, cached in localStorage
 * keyed by that sprite's stable target id (same technique as PyScratch's
 * own thread storage) and also embedded into the saved .sb3 project file
 * (vm.toJSON/vm.loadProject patches, same field-per-target approach
 * pyscratch.js uses for Python), so a flowchart travels with a project
 * export/share too, not just this browser's local storage.
 */
(function () {
  'use strict';

  if (!/[?&]flowscratch/.test(location.search)) return; // no-op for normal TurboWarp / PyScratch

  // Mermaid: "View as diagram" renders the actual FS.nodes/FS.edges graph
  // as a clean read-only flowchart, alongside the interactive canvas, not
  // instead of it - Mermaid has no drag/connect/run model of its own, so
  // it can't replace the hand-rolled editor below, only add a second view
  // onto the same data. Loaded from a local copy (assets/js/mermaid.min.js,
  // same file this project's lesson pages already vendor), not a CDN -
  // this script is injected only in FlowScratch mode (this early-return
  // guard already establishes that), so it never adds weight to a normal
  // TurboWarp/PyBot embed.
  var mermaidReady = new Promise(function (resolve) {
    var s = document.createElement('script');
    s.src = '../assets/js/mermaid.min.js';
    s.onload = function () {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: '#ffffff',
          primaryBorderColor: '#52647a',
          primaryTextColor: '#172033',
          lineColor: '#52647a',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
        }
      });
      resolve();
    };
    document.head.appendChild(s);
  });

  var STAGE_HALF_W = 240, STAGE_HALF_H = 180; // Scratch's native 480x360 stage, centered on 0,0

  var FS = {
    vm: null,
    nodes: [], edges: [], selected: null, selectedEdgeId: null, hoverAnchor: null,
    scale: 1, panX: 20, panY: 20, id: 0, edgeId: 0,
    drag: null, connect: null, palette: null,
    running: false, gen: 0,
    answer: '',
    pressedKeys: {},
    mouse: { x: 0, y: 0 },
    slowMode: false, slowDelayMs: 500,
    activeSprite: null, activeSpriteId: null
  };

  // Colours match Scratch's own real block-category colours exactly, so a
  // student who's used Scratch before recognises the categories on sight.
  // 'flow' (Start/End) has no direct Scratch equivalent category; it uses
  // Events' gold since Start plays the same role as a green-flag hat block.
  var CATEGORIES = {
    flow:      { label: 'Flow',      color: '#FFBF00' },
    motion:    { label: 'Motion',    color: '#4C97FF' },
    looks:     { label: 'Looks',     color: '#9966FF' },
    sensing:   { label: 'Sensing',   color: '#5CB1D6' },
    variables: { label: 'Variables', color: '#FF8C1A' },
    control:   { label: 'Control',   color: '#FFAB19' }
  };

  var TYPES = {
    start:              { shape: 'oval',      title: 'Start',              data: {},                             category: 'flow' },
    end:                { shape: 'oval',      title: 'End',                data: {},                             category: 'flow' },
    move_steps:         { shape: 'process',   title: 'Move steps',         data: { steps: 10 },                  category: 'motion' },
    turn_right:         { shape: 'process',   title: 'Turn right',         data: { degrees: 15 },                category: 'motion' },
    turn_left:          { shape: 'process',   title: 'Turn left',          data: { degrees: 15 },                category: 'motion' },
    point_in_direction: { shape: 'process',   title: 'Point in direction', data: { degrees: 90 },                category: 'motion' },
    point_towards:      { shape: 'process',   title: 'Point towards',      data: { target: 'mouse_pointer' },    category: 'motion' },
    next_costume:       { shape: 'process',   title: 'Next costume',       data: {},                             category: 'looks' },
    change_color:       { shape: 'process',   title: 'Change colour',      data: { value: 25 },                  category: 'looks' },
    say:                { shape: 'io',        title: 'Say',                data: { text: 'Hello!' },             category: 'looks' },
    ask:                { shape: 'io',        title: 'Ask',                data: { text: 'What is your name?' }, category: 'sensing' },
    set_variable:       { shape: 'process',   title: 'Set variable',       data: { varName: '', value: 0 },      category: 'variables' },
    change_variable:    { shape: 'process',   title: 'Change variable',    data: { varName: '', value: 1 },      category: 'variables' },
    selection:          { shape: 'selection', title: 'Selection',          data: { negate: 'is', condition: 'key', value: 'Space' }, category: 'control' }
  };
  var PALETTE_ORDER = ['flow', 'motion', 'looks', 'sensing', 'variables', 'control'];
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // Looks up a block's display title defensively: a graph saved before a
  // block type was renamed or removed (e.g. the old 'move'/'colour'
  // blocks) would otherwise throw here and break the whole editor for
  // that sprite instead of just showing an unrecognised block.
  function typeTitle(n) { return (TYPES[n.type] && TYPES[n.type].title) || 'Unknown block'; }
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

  // ── Variables ────────────────────────────────────────────────────────
  // Real Scratch VM variables (created on the stage target, so they're
  // global to every sprite, matching Scratch's own "For all sprites"
  // default), not a separate FlowScratch-only store. This means they
  // behave like genuine Scratch variables: they serialize with the
  // project normally (no flowscratch-specific save/load code needed for
  // them) and would show up in the regular Scratch blocks editor too if
  // a student switched over.
  function getGlobalVariables() {
    try {
      var stage = FS.vm.runtime.getTargetForStage();
      return Object.keys(stage.variables)
        .map(function (id) { return stage.variables[id]; })
        .filter(function (v) { return v.type === ''; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
    } catch (e) { return []; }
  }
  function findGlobalVariable(name) {
    var v = getGlobalVariables().filter(function (v) { return v.name === name; })[0];
    return v || null;
  }
  // On-stage value monitors, the checkbox Scratch itself shows next to
  // every variable ("Show on stage"). requestShowMonitor/requestHideMonitor
  // only toggle an EXISTING monitor record; they don't create one, so a
  // variable that's never been shown needs requestAddMonitor first (a
  // plain object works in this scratch-vm build, verified live, no
  // MonitorRecord/Immutable class needed).
  function hasVariableMonitor(id) {
    try { return FS.vm.runtime.getMonitorState().has(id); } catch (e) { return false; }
  }
  function isVariableMonitorVisible(id) {
    try {
      var m = FS.vm.runtime.getMonitorState().get(id);
      return !!(m && m.visible);
    } catch (e) { return false; }
  }
  function addVariableMonitor(v, visible) {
    try {
      var stackedCount = FS.vm.runtime.getMonitorState().size;
      FS.vm.runtime.requestAddMonitor({
        id: v.id, mode: 'default', opcode: 'data_variable',
        params: { VARIABLE: v.name }, spriteName: null, value: v.value,
        width: 0, height: 0, x: 5, y: 5 + stackedCount * 26,
        visible: visible !== false, sliderMin: 0, sliderMax: 100, isDiscrete: true
      });
    } catch (e) {}
  }
  function setVariableMonitorVisible(v, visible) {
    try {
      if (!hasVariableMonitor(v.id)) { addVariableMonitor(v, visible); return; }
      if (visible) FS.vm.runtime.requestShowMonitor(v.id);
      else FS.vm.runtime.requestHideMonitor(v.id);
    } catch (e) {}
  }
  function createGlobalVariable(name) {
    name = (name || '').trim();
    if (!name) return;
    try {
      var stage = FS.vm.runtime.getTargetForStage();
      if (stage.lookupVariableByNameAndType(name, '')) {
        notify('A variable called "' + name + '" already exists.', 'error');
        return;
      }
      var id = 'flowscratch_var_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      stage.createVariable(id, name, '');
      // Visible by default, same as a newly made Scratch variable.
      addVariableMonitor(stage.lookupVariableByNameAndType(name, ''), true);
      renderSidebar();
      renderAll();
    } catch (e) {}
  }
  function deleteGlobalVariable(name) {
    try {
      var stage = FS.vm.runtime.getTargetForStage();
      var v = stage.lookupVariableByNameAndType(name, '');
      if (!v) return;
      if (!confirm('Delete the variable "' + name + '"? Any blocks using it will need a different variable chosen.')) return;
      try { FS.vm.runtime.requestRemoveMonitor(v.id); } catch (e) {}
      delete stage.variables[v.id];
      renderSidebar();
      renderAll();
    } catch (e) {}
  }

  // Scratch's colour graphic effect is a 0-200 hue-rotation dial, not an
  // arbitrary hex fill (sprites are costume bitmaps, not solid shapes with
  // a settable fill colour). "Set colour" applies the closest honest
  // equivalent: rotate the sprite's colour effect to the hue of the chosen
  // colour. On a mostly-white/grey costume this reads as a genuine recolour;
  // on a highly coloured costume it shifts hue rather than replacing it,
  // same as Scratch's own colour effect always has.
  // Scratch's own direction convention: 0 = up, clockwise positive, so
  // converting to a standard math angle (0 = right, counterclockwise
  // positive) needs this flip. Same formula pyscratch.js uses.
  function d2r(deg) { return ((90 - deg) * Math.PI) / 180; }

  // ── Project save/load: embed flowcharts inside project.json ────────────
  // Own copy of pyscratch.js's own zip-handling pattern (see the top-of-
  // file note on why this file doesn't share code with pyscratch.js).
  function ensureJSZip() {
    return new Promise(function (resolve, reject) {
      if (window.JSZip) { resolve(window.JSZip); return; }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      s.onload = function () { resolve(window.JSZip); };
      s.onerror = function () { reject(new Error('Could not load JSZip')); };
      document.head.appendChild(s);
    });
  }
  function toArrayBuffer(input) {
    if (input instanceof ArrayBuffer) return Promise.resolve(input);
    if (input instanceof Uint8Array) return Promise.resolve(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
    if (typeof input.arrayBuffer === 'function') return input.arrayBuffer();
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function (e) { resolve(e.target.result); };
      fr.onerror = reject;
      fr.readAsArrayBuffer(input);
    });
  }
  // Reads a loaded .sb3's per-target "flowscratch" fields out before
  // TurboWarp's own loader sees them (unknown target fields are normally
  // harmless to leave in, but stripped anyway for the same belt-and-
  // braces reason pyscratch.js strips its own field). Returns the
  // possibly-cleaned buffer plus { spriteName: {nodes, edges} } for
  // whatever this project actually shipped with, or extracted:null if
  // this wasn't a binary project (e.g. a fresh blank project) at all.
  function extractFlowScratchData(input) {
    var isBinary = (input instanceof ArrayBuffer) || (input instanceof Uint8Array) ||
      (typeof Blob !== 'undefined' && input instanceof Blob);
    if (!isBinary) return Promise.resolve({ buffer: input, extracted: null });
    return ensureJSZip().then(function (JSZip) {
      return toArrayBuffer(input).then(function (buf) {
        return JSZip.loadAsync(buf.slice(0)).then(function (zip) {
          var projFile = zip.file('project.json');
          if (!projFile) return { buffer: buf, extracted: null };
          return projFile.async('string').then(function (raw) {
            var proj;
            try { proj = JSON.parse(raw); } catch (e) { return { buffer: buf, extracted: null }; }
            if (!proj || !Array.isArray(proj.targets)) return { buffer: buf, extracted: null };
            var extracted = {}, found = false;
            proj.targets.forEach(function (t) {
              if (t.flowscratch) { extracted[t.name] = t.flowscratch; delete t.flowscratch; found = true; }
            });
            if (!found) return { buffer: buf, extracted: null };
            zip.file('project.json', JSON.stringify(proj));
            return zip.generateAsync({ type: 'arraybuffer' }).then(function (clean) {
              return { buffer: clean, extracted: extracted };
            });
          });
        }).catch(function () {
          return toArrayBuffer(input).then(function (buf2) { return { buffer: buf2, extracted: null }; });
        });
      });
    }).catch(function () {
      return { buffer: input, extracted: null };
    });
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
  // A standard flowchart block has exactly one exit path; only a
  // Selection (decision) block branches, and only ever two ways (True and
  // False). Unconditional fan-out from an ordinary block is not valid
  // flowchart behaviour and was already implicitly assumed by validate(),
  // but nothing stopped the editor itself from creating it, which is what
  // let two edges quietly pile up on the same block and cross visually.
  // Enforced here instead: connecting a new wire from a non-Selection
  // block replaces its existing outgoing wire; a Selection block is
  // capped at two and a third attempt is refused with an explanation.
  function edgeBranch(edge) {
    if (!edge) return '';
    if (edge.branch === 'true' || edge.branch === 'false') return edge.branch;
    var fromNode = getNode(edge.from);
    if (!fromNode || fromNode.type !== 'selection') return '';
    var siblings = FS.edges.filter(function (e) { return e.from === edge.from; });
    return siblings.indexOf(edge) === 0 ? 'true' : 'false';
  }
  function addEdge(from, to, fromA, toA, options) {
    if ((from === to && !(options && options.joinEdgeId)) || FS.edges.some(function (e) { return e.from === from && e.to === to; })) return false;
    var fromNode = getNode(from);
    var existingOut = FS.edges.filter(function (e) { return e.from === from; });
    if (fromNode && fromNode.type === 'selection') {
      if (existingOut.length >= 2) {
        notify('Selection blocks can only have two outgoing connections (True and False). Delete one first.', 'error');
        return false;
      }
    } else if (existingOut.length >= 1) {
      FS.edges = FS.edges.filter(function (e) { return e.from !== from; });
    }
    var edge = { id: 'e' + (++FS.edgeId), from: from, to: to, fromA: fromA || 'E', toA: toA || 'W', lineType: 'orthogonal' };
    if (fromNode && fromNode.type === 'selection') {
      edge.branch = existingOut.some(function (e) { return edgeBranch(e) === 'true'; }) ? 'false' : 'true';
    }
    if (options && options.joinEdgeId) {
      edge.joinEdgeId = options.joinEdgeId;
      edge.joinAt = options.joinAt;
    }
    FS.edges.push(edge);
    renderWires();
    return true;
  }

  // ── Mermaid diagram export ("View as diagram") ──────────────────────
  // Plain-text description of a block, for the diagram label - the actual
  // editable node markup (nodeMarkup, above) embeds live <select>/<input>
  // controls, which makes no sense as SVG text, so this is a deliberately
  // separate function rather than trying to strip HTML out of that one.
  function nodeSummaryText(n) {
    var d = n.data || {};
    if (n.type === 'move_steps') return 'Move ' + d.steps + ' steps';
    if (n.type === 'turn_right') return 'Turn right ' + d.degrees + ' degrees';
    if (n.type === 'turn_left') return 'Turn left ' + d.degrees + ' degrees';
    if (n.type === 'point_in_direction') return 'Point in direction ' + d.degrees + ' degrees';
    if (n.type === 'point_towards') return 'Point towards ' + (d.target === 'mouse_pointer' ? 'mouse pointer' : 'random direction');
    if (n.type === 'next_costume') return 'Next costume';
    if (n.type === 'change_color') return 'Change colour by ' + d.value;
    if (n.type === 'say') return 'Say "' + d.text + '"';
    if (n.type === 'ask') return 'Ask "' + d.text + '"';
    if (n.type === 'set_variable') return 'Set ' + (d.varName || 'variable') + ' to ' + d.value;
    if (n.type === 'change_variable') return 'Change ' + (d.varName || 'variable') + ' by ' + d.value;
    if (n.type === 'selection') {
      var desc;
      if (d.condition === 'key') {
        var keyLabels = { Space: 'space', ArrowRight: 'right arrow', ArrowLeft: 'left arrow', ArrowUp: 'up arrow', ArrowDown: 'down arrow' };
        desc = (keyLabels[d.value] || d.value) + ' key pressed';
      } else if (d.condition === 'edge') {
        desc = d.value === 'any' ? 'touching any edge' : 'touching ' + d.value + ' edge';
      } else if (d.condition === 'answer') {
        desc = 'answer exists';
      } else if (d.condition === 'variable') {
        var opSym = d.operator === 'gt' ? '>' : d.operator === 'lt' ? '<' : '=';
        desc = (d.varName || 'variable') + ' ' + opSym + ' ' + (d.varValue != null ? d.varValue : 0);
      } else {
        desc = 'condition';
      }
      return 'Is ' + (d.negate === 'not' ? 'not ' : '') + desc + '?';
    }
    return typeTitle(n);
  }
  // Converts the live FS.nodes/FS.edges graph (arbitrary directed graph,
  // may include loops back to an earlier block via a join connector - see
  // addEdge's own joinEdgeId handling) into Mermaid flowchart syntax.
  // Shapes mirror the editor's own (.fs-node.oval/io/selection CSS,
  // TYPES[...].shape above): stadium for Start/End, parallelogram for
  // input/output, diamond for a decision, rectangle for everything else.
  // True/False branch colouring matches the lesson pages' own Mermaid
  // diagrams (green/red via linkStyle) for a consistent look across the
  // whole site, not just this editor.
  function graphToMermaidDefinition() {
    var lines = ['graph TD'];
    var linkStyles = [];
    var idFor = {};
    FS.nodes.forEach(function (n) { idFor[n.id] = 'n' + String(n.id).replace(/[^a-zA-Z0-9]/g, ''); });
    FS.nodes.forEach(function (n) {
      var shape = (TYPES[n.type] && TYPES[n.type].shape) || 'process';
      var label = '"' + nodeSummaryText(n).replace(/"/g, '#quot;') + '"';
      var wrap = shape === 'oval' ? ['([', '])'] : shape === 'io' ? ['[/', '/]'] : shape === 'selection' ? ['{', '}'] : ['[', ']'];
      lines.push('  ' + idFor[n.id] + wrap[0] + label + wrap[1]);
    });
    var edgeIndex = 0;
    FS.edges.forEach(function (e) {
      var fromId = idFor[e.from], toId = idFor[e.to];
      if (!fromId || !toId) return;
      var branch = edgeBranch(e);
      var labelPart = branch === 'true' ? '|True|' : branch === 'false' ? '|False|' : '';
      lines.push('  ' + fromId + ' -->' + labelPart + ' ' + toId);
      if (branch === 'true') linkStyles.push('  linkStyle ' + edgeIndex + ' stroke:#2f9e58,stroke-width:2px');
      else if (branch === 'false') linkStyles.push('  linkStyle ' + edgeIndex + ' stroke:#d64545,stroke-width:2px');
      edgeIndex++;
    });
    return lines.concat(linkStyles).join('\n');
  }
  function showDiagramModal() {
    if (!FS.nodes.length) { notify('Add some blocks first, there is nothing to diagram yet.', 'error'); return; }
    els.diagramModal.classList.add('show');
    els.diagramBody.innerHTML = '<p class="fs-diagram-loading">Drawing diagram&hellip;</p>';
    mermaidReady.then(function () {
      var definition = graphToMermaidDefinition();
      return mermaid.render('fs-mermaid-render', definition);
    }).then(function (result) {
      els.diagramBody.innerHTML = result.svg;
    }).catch(function () {
      els.diagramBody.innerHTML = '<p class="fs-diagram-loading">Could not draw this flowchart. Check every block is connected and try again.</p>';
    });
  }

  // ── DOM refs (created in buildUI) ───────────────────────────────────
  var els = {};

  function variableSelectHtml(fieldName, selectedName) {
    var vars = getGlobalVariables();
    if (!vars.length) return '<select data-field="' + fieldName + '"><option value="">(no variables yet)</option></select>';
    return '<select data-field="' + fieldName + '">' + vars.map(function (v) {
      return '<option value="' + esc(v.name) + '"' + (selectedName === v.name ? ' selected' : '') + '>' + esc(v.name) + '</option>';
    }).join('') + '</select>';
  }
  function nodeMarkup(n) {
    var sub = '';
    if (n.type === 'move_steps') sub = '<span class="fs-node-subtitle">' + n.data.steps + ' steps</span>';
    if (n.type === 'turn_right' || n.type === 'turn_left' || n.type === 'point_in_direction') sub = '<span class="fs-node-subtitle">' + n.data.degrees + ' degrees</span>';
    if (n.type === 'point_towards') sub = '<select data-field="target"><option value="mouse_pointer"' + (n.data.target === 'mouse_pointer' ? ' selected' : '') + '>mouse pointer</option><option value="random"' + (n.data.target === 'random' ? ' selected' : '') + '>random direction</option></select>';
    if (n.type === 'change_color') sub = '<span class="fs-node-subtitle">by ' + n.data.value + '</span>';
    if (n.type === 'say' || n.type === 'ask') sub = '<span class="fs-node-subtitle">' + esc(n.data.text) + '</span>';
    if (n.type === 'set_variable' || n.type === 'change_variable') {
      sub = variableSelectHtml('varName', n.data.varName) +
        '<input type="number" class="fs-inline-num" data-field="value" value="' + n.data.value + '">';
    }
    var content;
    if (n.type === 'selection') {
      var condition = n.data.condition;
      var tail;
      if (condition === 'variable') {
        tail = variableSelectHtml('varName', n.data.varName) +
          '<select data-field="operator">' +
          '<option value="eq"' + (n.data.operator === 'eq' ? ' selected' : '') + '>=</option>' +
          '<option value="gt"' + (n.data.operator === 'gt' ? ' selected' : '') + '>&gt;</option>' +
          '<option value="lt"' + (n.data.operator === 'lt' ? ' selected' : '') + '>&lt;</option>' +
          '</select>' +
          '<input type="number" class="fs-inline-num" data-field="varValue" value="' + (n.data.varValue != null ? n.data.varValue : 0) + '">';
      } else {
        var choices = condition === 'key'
          ? [['Space', 'space'], ['ArrowRight', 'right arrow'], ['ArrowLeft', 'left arrow'], ['ArrowUp', 'up arrow'], ['ArrowDown', 'down arrow']]
          : condition === 'edge'
            ? [['any', 'any edge'], ['left', 'left edge'], ['right', 'right edge'], ['top', 'top edge'], ['bottom', 'bottom edge']]
            : [['any', 'any answer']];
        tail = '<select data-field="value">' + choices.map(function (c) { return '<option value="' + c[0] + '"' + (n.data.value === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select>';
      }
      content = '<div class="fs-node-content"><div class="fs-node-title">If</div>' +
        '<select data-field="negate"><option value="is"' + (n.data.negate === 'is' ? ' selected' : '') + '>is</option><option value="not"' + (n.data.negate === 'not' ? ' selected' : '') + '>not</option></select>' +
        '<select data-field="condition"><option value="key"' + (condition === 'key' ? ' selected' : '') + '>key pressed</option><option value="edge"' + (condition === 'edge' ? ' selected' : '') + '>touching edge</option><option value="answer"' + (condition === 'answer' ? ' selected' : '') + '>answer exists</option><option value="variable"' + (condition === 'variable' ? ' selected' : '') + '>variable</option></select>' +
        tail + '</div>';
    } else {
      content = '<div class="fs-node-title">' + typeTitle(n) + '</div>' + sub;
    }
    var catColor = (TYPES[n.type] && CATEGORIES[TYPES[n.type].category]) ? CATEGORIES[TYPES[n.type].category].color : '#4d515a';
    return '<div class="fs-node ' + n.shape + (FS.selected === n.id ? ' selected' : '') + '" data-id="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px;--fs-cat-color:' + catColor + '"><div class="fs-node-body">' + content + '</div></div>';
  }

  function renderAll() { els.nodes.innerHTML = FS.nodes.map(nodeMarkup).join(''); bindNodes(); renderWires(); renderInspector(); }

  // Starts a connection drag from wherever the green hover-anchor dot
  // currently is, regardless of what element the pointerdown actually
  // landed on. The dot is shown by proximity (HOVER_ANCHOR_SCREEN_PX,
  // below) rather than "cursor literally over the node", so without this
  // shared check a press just outside the node's own DOM box - close
  // enough that the dot is visible and inviting a drag, but not close
  // enough to hit the node element itself - fell through to canvasWrap's
  // blank-space handler and started a pan instead of a connection. Used
  // both from a node's own pointerdown (the common case: cursor is over
  // the node) and from canvasWrap's (the anchor is showing but the
  // cursor is just outside the node).
  function startConnectFromHoverAnchor(e) {
    if (!FS.hoverAnchor) return false;
    var el = els.nodes.querySelector('.fs-node[data-id="' + FS.hoverAnchor.nodeId + '"]');
    FS.connect = { from: FS.hoverAnchor.nodeId, fromA: { x: FS.hoverAnchor.x, y: FS.hoverAnchor.y } };
    els.canvasWrap.classList.add('connecting');
    els.draft.style.display = 'block';
    updateDraft(e.clientX, e.clientY);
    try { (el || els.canvasWrap).setPointerCapture(e.pointerId); } catch (_err) {}
    return true;
  }

  function bindNodes() {
    Array.prototype.forEach.call(els.nodes.querySelectorAll('.fs-node'), function (el) {
      el.addEventListener('pointerdown', function (e) {
        if (e.target.matches('select,input')) return;
        // Hovering near this node's edge shows the single green anchor dot
        // (updateHoverAnchor, tracked continuously on pointermove); pressing
        // down while it's showing starts a connection from that exact point
        // instead of selecting/dragging the block.
        if (FS.hoverAnchor && FS.hoverAnchor.nodeId === el.dataset.id) {
          startConnectFromHoverAnchor(e);
          e.stopPropagation();
          return;
        }
        select(el.dataset.id);
        var n = getNode(el.dataset.id);
        FS.drag = { kind: 'node', id: n.id, startX: e.clientX, startY: e.clientY, x: n.x, y: n.y };
        try { el.setPointerCapture(e.pointerId); } catch (_err) {}
      });
      el.addEventListener('click', function (e) { if (!e.target.matches('select,input')) select(el.dataset.id); });
      Array.prototype.forEach.call(el.querySelectorAll('[data-field]'), function (c) {
        c.addEventListener('change', function (e) {
          var n = getNode(el.dataset.id), field = e.target.dataset.field;
          n.data[field] = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
          if (field === 'condition') {
            if (e.target.value === 'variable') {
              var firstVar = getGlobalVariables()[0];
              n.data.varName = firstVar ? firstVar.name : '';
              n.data.operator = n.data.operator || 'eq';
              n.data.varValue = n.data.varValue != null ? n.data.varValue : 0;
            } else {
              n.data.value = e.target.value === 'key' ? 'Space' : 'any';
            }
          }
          renderAll(); saveGraph(FS.activeSprite);
        });
      });
    });
  }

  function select(id) { FS.selected = id; FS.selectedEdgeId = null; renderAll(); }
  function selectEdge(id) { FS.selectedEdgeId = id; FS.selected = null; renderAll(); }

  // Actual on-screen size of a node, converted back to world units
  // (dividing out the canvas's own pan/zoom scale), rather than a
  // hardcoded 150x66/112 guess. Nodes with more inline fields (a
  // variable select plus a value input, say) can genuinely need more
  // room than that guess assumed and grow taller, which twice already
  // broke wire-anchor alignment when the guess and the real rendered box
  // disagreed (see the CSS width limits on .fs-node.process select and
  // .fs-inline-num, which exist to keep that from happening, plus this,
  // which makes the geometry correct even if a future block still ends
  // up wider than expected). Falls back to the old guess only for a node
  // that hasn't been rendered into the DOM yet.
  function nodeDims(n) {
    try {
      var el = els.nodes && els.nodes.querySelector('.fs-node[data-id="' + n.id + '"]');
      if (el) {
        var r = el.getBoundingClientRect();
        if (r.width && r.height) return { w: r.width / FS.scale, h: r.height / FS.scale };
      }
    } catch (e) {}
    return { w: 150, h: n.shape === 'selection' ? 112 : 66 };
  }
  // An edge's anchor (fromA/toA) is a continuous {x, y} point in the
  // node's own local space, picked by hovering anywhere along the node's
  // edge rather than snapping to one of 8 fixed compass points. Old saved
  // graphs from before this change stored a named direction string
  // instead ('N'/'NE'/...); the fallback branch below still understands
  // those so nothing already saved breaks.
  function center(n, a) {
    if (a && typeof a === 'object') return { x: n.x + a.x, y: n.y + a.y };
    var d = nodeDims(n), w = d.w, h = d.h;
    var legacy = { N: [w / 2, 0], NE: [w * .86, 8], E: [w, h / 2], SE: [w * .86, h - 8], S: [w / 2, h], SW: [w * .14, h - 8], W: [0, h / 2], NW: [w * .14, 8] };
    var p = legacy[a] || legacy.E;
    return { x: n.x + p[0], y: n.y + p[1] };
  }
  // Nearest point on a w x h rectangle's own perimeter to a local point
  // (px, py), used both for the live hover-anchor and for picking a
  // sensible anchor point automatically (connecting to a node by dropping
  // near it, or splicing a node into an existing wire).
  function nearestPerimeterPoint(w, h, px, py) {
    var cx = Math.max(0, Math.min(w, px)), cy = Math.max(0, Math.min(h, py));
    if (px > 0 && px < w && py > 0 && py < h) {
      var dl = px, dr = w - px, dt = py, db = h - py, m = Math.min(dl, dr, dt, db);
      if (m === dl) return { x: 0, y: cy };
      if (m === dr) return { x: w, y: cy };
      if (m === dt) return { x: cx, y: 0 };
      return { x: cx, y: h };
    }
    return { x: cx, y: cy };
  }
  function anchorPointOnNode(n, towardWorldX, towardWorldY) {
    var d = nodeDims(n);
    return nearestPerimeterPoint(d.w, d.h, towardWorldX - n.x, towardWorldY - n.y);
  }
  // Anchor's local (x,y) regardless of stored format (new continuous
  // {x,y} point, or a legacy named direction from a saved-before-this-
  // change graph).
  function anchorLocalPoint(n, a) {
    if (a && typeof a === 'object') return { x: a.x, y: a.y };
    var d = nodeDims(n), w = d.w, h = d.h;
    var legacy = { N: [w / 2, 0], NE: [w * .86, 8], E: [w, h / 2], SE: [w * .86, h - 8], S: [w / 2, h], SW: [w * .14, h - 8], W: [0, h / 2], NW: [w * .14, 8] };
    var p = legacy[a] || legacy.E;
    return { x: p[0], y: p[1] };
  }
  // Which side of the node's rectangle the anchor sits on, as an outward
  // unit vector, used to route the connector straight out of the block
  // before turning rather than diving in at an angle.
  function anchorDirection(n, a) {
    var d = nodeDims(n), w = d.w, h = d.h;
    var p = anchorLocalPoint(n, a);
    var dl = p.x, dr = w - p.x, dt = p.y, db = h - p.y, m = Math.min(dl, dr, dt, db);
    if (m === dl) return { x: -1, y: 0 };
    if (m === dr) return { x: 1, y: 0 };
    if (m === dt) return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }
  function routeClearance(p1, p2) {
    var distance = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
    return Math.max(14, Math.min(30, 10 + distance * .035));
  }
  function routeRects(padding) {
    return FS.nodes.map(function (n) {
      var d = nodeDims(n);
      return { id: n.id, left: n.x - padding, right: n.x + d.w + padding, top: n.y - padding, bottom: n.y + d.h + padding };
    });
  }
  function forwardNodeGap(p, dir, ignoreId) {
    var best = Infinity, e = .01;
    routeRects(0).forEach(function (r) {
      if (r.id === ignoreId) return;
      if (dir.x > 0 && p.y > r.top + e && p.y < r.bottom - e && r.left >= p.x - e) best = Math.min(best, r.left - p.x);
      if (dir.x < 0 && p.y > r.top + e && p.y < r.bottom - e && r.right <= p.x + e) best = Math.min(best, p.x - r.right);
      if (dir.y > 0 && p.x > r.left + e && p.x < r.right - e && r.top >= p.y - e) best = Math.min(best, r.top - p.y);
      if (dir.y < 0 && p.x > r.left + e && p.x < r.right - e && r.bottom <= p.y + e) best = Math.min(best, p.y - r.bottom);
    });
    return best;
  }
  function pointInsideRouteRect(p, r) {
    var e = .01;
    return p.x > r.left + e && p.x < r.right - e && p.y > r.top + e && p.y < r.bottom - e;
  }
  function routeSegmentBlocked(a, b, rects) {
    var e = .01, min, max;
    if (Math.abs(a.y - b.y) < e) {
      min = Math.min(a.x, b.x); max = Math.max(a.x, b.x);
      return rects.some(function (r) {
        return a.y > r.top + e && a.y < r.bottom - e && max > r.left + e && min < r.right - e;
      });
    }
    if (Math.abs(a.x - b.x) < e) {
      min = Math.min(a.y, b.y); max = Math.max(a.y, b.y);
      return rects.some(function (r) {
        return a.x > r.left + e && a.x < r.right - e && max > r.top + e && min < r.bottom - e;
      });
    }
    return true;
  }
  function routeWirePenalty(a, b, occupied) {
    var penalty = 0, e = .01;
    (occupied || []).forEach(function (s) {
      var aH = Math.abs(a.y - b.y) < e, sH = Math.abs(s.a.y - s.b.y) < e;
      if (aH && sH && Math.abs(a.y - s.a.y) < e) {
        var overlapX = Math.min(Math.max(a.x, b.x), Math.max(s.a.x, s.b.x)) - Math.max(Math.min(a.x, b.x), Math.min(s.a.x, s.b.x));
        if (overlapX > e) penalty += 160 + overlapX;
      } else if (!aH && !sH && Math.abs(a.x - s.a.x) < e) {
        var overlapY = Math.min(Math.max(a.y, b.y), Math.max(s.a.y, s.b.y)) - Math.max(Math.min(a.y, b.y), Math.min(s.a.y, s.b.y));
        if (overlapY > e) penalty += 160 + overlapY;
      } else if (aH !== sH) {
        var h = aH ? { a: a, b: b } : s;
        var v = aH ? s : { a: a, b: b };
        var ix = v.a.x, iy = h.a.y;
        if (ix > Math.min(h.a.x, h.b.x) + e && ix < Math.max(h.a.x, h.b.x) - e &&
            iy > Math.min(v.a.y, v.b.y) + e && iy < Math.max(v.a.y, v.b.y) - e) penalty += 70;
      }
    });
    return penalty;
  }
  function compactRoutePoints(points) {
    var out = [];
    points.forEach(function (p) {
      var last = out[out.length - 1];
      if (last && Math.abs(last.x - p.x) < .01 && Math.abs(last.y - p.y) < .01) return;
      if (out.length > 1) {
        var before = out[out.length - 2];
        if ((Math.abs(before.x - last.x) < .01 && Math.abs(last.x - p.x) < .01) ||
            (Math.abs(before.y - last.y) < .01 && Math.abs(last.y - p.y) < .01)) out.pop();
      }
      out.push(p);
    });
    return out;
  }
  function simpleOrthogonalRoute(s1, s2, rects, occupied) {
    var candidates = [
      [s1, { x: s2.x, y: s1.y }, s2],
      [s1, { x: s1.x, y: s2.y }, s2]
    ];
    var dx = Math.abs(s2.x - s1.x), dy = Math.abs(s2.y - s1.y);
    if (dx > 1) {
      var mx = (s1.x + s2.x) / 2;
      candidates.push([s1, { x: mx, y: s1.y }, { x: mx, y: s2.y }, s2]);
    }
    if (dy > 1) {
      var my = (s1.y + s2.y) / 2;
      candidates.push([s1, { x: s1.x, y: my }, { x: s2.x, y: my }, s2]);
    }
    var best = null;
    candidates.forEach(function (candidate) {
      candidate = compactRoutePoints(candidate);
      var blocked = false, cost = 0;
      for (var i = 1; i < candidate.length; i++) {
        if (routeSegmentBlocked(candidate[i - 1], candidate[i], rects)) { blocked = true; break; }
        cost += Math.abs(candidate[i].x - candidate[i - 1].x) + Math.abs(candidate[i].y - candidate[i - 1].y);
        cost += routeWirePenalty(candidate[i - 1], candidate[i], occupied);
      }
      cost += Math.max(0, candidate.length - 2) * 22;
      if (!blocked && (!best || cost < best.cost)) best = { points: candidate, cost: cost };
    });
    return best && best.points;
  }
  function heapPush(heap, item) {
    heap.push(item);
    var i = heap.length - 1;
    while (i > 0) {
      var p = Math.floor((i - 1) / 2);
      if (heap[p].cost <= item.cost) break;
      heap[i] = heap[p]; i = p;
    }
    heap[i] = item;
  }
  function heapPop(heap) {
    if (!heap.length) return null;
    var root = heap[0], last = heap.pop();
    if (!heap.length) return root;
    var i = 0;
    while (true) {
      var left = i * 2 + 1, right = left + 1;
      if (left >= heap.length) break;
      var child = right < heap.length && heap[right].cost < heap[left].cost ? right : left;
      if (heap[child].cost >= last.cost) break;
      heap[i] = heap[child]; i = child;
    }
    heap[i] = last;
    return root;
  }
  function smartGridRoute(s1, s2, rects, occupied) {
    var xs = [s1.x, s2.x], ys = [s1.y, s2.y];
    rects.forEach(function (r) { xs.push(r.left, r.right); ys.push(r.top, r.bottom); });
    function uniqueSorted(values) {
      values.sort(function (a, b) { return a - b; });
      return values.filter(function (v, i) { return !i || Math.abs(v - values[i - 1]) > .01; });
    }
    xs = uniqueSorted(xs); ys = uniqueSorted(ys);
    var nodes = [], at = {};
    xs.forEach(function (x, ix) {
      ys.forEach(function (y, iy) {
        var p = { x: x, y: y, ix: ix, iy: iy };
        if (rects.some(function (r) { return pointInsideRouteRect(p, r); })) return;
        at[ix + ',' + iy] = nodes.length; nodes.push(p);
      });
    });
    function coordIndex(values, value) {
      for (var i = 0; i < values.length; i++) if (Math.abs(values[i] - value) < .01) return i;
      return -1;
    }
    var start = at[coordIndex(xs, s1.x) + ',' + coordIndex(ys, s1.y)];
    var goal = at[coordIndex(xs, s2.x) + ',' + coordIndex(ys, s2.y)];
    if (start == null || goal == null) return null;
    var heap = [], distances = {}, previous = {};
    heapPush(heap, { node: start, dir: 'N', cost: 0 });
    distances[start + '|N'] = 0;
    var finishKey = null;
    while (heap.length) {
      var current = heapPop(heap), currentKey = current.node + '|' + current.dir;
      if (current.cost !== distances[currentKey]) continue;
      if (current.node === goal) { finishKey = currentKey; break; }
      var p = nodes[current.node];
      [[-1, 0, 'H'], [1, 0, 'H'], [0, -1, 'V'], [0, 1, 'V']].forEach(function (move) {
        var ix = p.ix + move[0], iy = p.iy + move[1], next = null;
        while (ix >= 0 && ix < xs.length && iy >= 0 && iy < ys.length) {
          var candidate = at[ix + ',' + iy];
          if (candidate != null) { next = candidate; break; }
          ix += move[0]; iy += move[1];
        }
        if (next == null || routeSegmentBlocked(p, nodes[next], rects)) return;
        var length = Math.abs(nodes[next].x - p.x) + Math.abs(nodes[next].y - p.y);
        var bend = current.dir !== 'N' && current.dir !== move[2] ? 22 : 0;
        var nextCost = current.cost + length + bend + routeWirePenalty(p, nodes[next], occupied);
        var nextKey = next + '|' + move[2];
        if (distances[nextKey] == null || nextCost < distances[nextKey]) {
          distances[nextKey] = nextCost;
          previous[nextKey] = currentKey;
          heapPush(heap, { node: next, dir: move[2], cost: nextCost });
        }
      });
    }
    if (!finishKey) return null;
    var route = [];
    while (finishKey) {
      route.push(nodes[parseInt(finishKey.split('|')[0], 10)]);
      finishKey = previous[finishKey];
    }
    route.reverse();
    return compactRoutePoints(route);
  }
  // Orthogonal connectors use a clearance based on the distance between
  // their anchors, try the clean one- and two-bend routes first, then use
  // a Manhattan visibility grid when blocks are in the way.
  function orthogonalRoute(p1, dir1, p2, dir2, occupied, fromId, toId) {
    var clearance = routeClearance(p1, p2);
    var startGap = forwardNodeGap(p1, dir1, fromId), endGap = forwardNodeGap(p2, dir2, toId);
    if (isFinite(startGap)) clearance = Math.min(clearance, Math.max(4, startGap / 2 - 1));
    if (isFinite(endGap)) clearance = Math.min(clearance, Math.max(4, endGap / 2 - 1));
    var escape = clearance + 1;
    var s1 = { x: p1.x + dir1.x * escape, y: p1.y + dir1.y * escape };
    var s2 = { x: p2.x + dir2.x * escape, y: p2.y + dir2.y * escape };
    var rects = routeRects(clearance);
    var middle = simpleOrthogonalRoute(s1, s2, rects, occupied) || smartGridRoute(s1, s2, rects, occupied);
    if (!middle) {
      var fallback = dir1.x !== 0
        ? [s1, { x: s2.x, y: s1.y }, s2]
        : [s1, { x: s1.x, y: s2.y }, s2];
      middle = compactRoutePoints(fallback);
    }
    return compactRoutePoints([p1].concat(middle, [p2]));
  }
  function draftOrthogonalPath(p1, dir1, mouse) {
    var stub = routeClearance(p1, mouse) + 2;
    var s1 = { x: p1.x + dir1.x * stub, y: p1.y + dir1.y * stub };
    var pts = [p1, s1];
    pts.push(dir1.x !== 0 ? { x: mouse.x, y: s1.y } : { x: s1.x, y: mouse.y });
    pts.push(mouse);
    return 'M' + pts.map(function (p) { return p.x + ',' + p.y; }).join(' L ');
  }
  // A student can pick a plain straight line instead of the default
  // right-angle routing per connector, via the inspector (edge.lineType).
  function routePath(points) {
    return 'M' + points.map(function (p) { return p.x + ',' + p.y; }).join(' L ');
  }
  function edgeRoute(edge, p1, dir1, p2, dir2, occupied) {
    if (edge.lineType === 'straight') return [p1, p2];
    return orthogonalRoute(p1, dir1, p2, dir2, occupied, edge.from, edge.to);
  }
  function branchLabelPoint(p, dir) {
    if (dir.x > 0) return { x: p.x + 10, y: p.y - 8, anchor: 'start' };
    if (dir.x < 0) return { x: p.x - 10, y: p.y - 8, anchor: 'end' };
    if (dir.y > 0) return { x: p.x + 8, y: p.y + 18, anchor: 'start' };
    return { x: p.x + 8, y: p.y - 8, anchor: 'start' };
  }
  function nearestPointOnRoute(points, toward) {
    var best = null;
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1], b = points[i], p;
      if (Math.abs(a.y - b.y) < .01) {
        p = { x: Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), toward.x)), y: a.y, horizontal: true };
      } else {
        p = { x: a.x, y: Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), toward.y)), horizontal: false };
      }
      var distance = Math.hypot(p.x - toward.x, p.y - toward.y);
      if (!best || distance < best.distance) { p.distance = distance; best = p; }
    }
    return best;
  }
  function renderWires(activeId) {
    var occupied = [], renderedRoutes = {};
    els.wireLayer.innerHTML = FS.edges.map(function (e) {
      var a = getNode(e.from), b = getNode(e.to);
      if (!a || !b) return '';
      var p1 = center(a, e.fromA), p2 = center(b, e.toA);
      var dir1 = anchorDirection(a, e.fromA), dir2 = anchorDirection(b, e.toA);
      var joinedRoute = e.joinEdgeId && renderedRoutes[e.joinEdgeId];
      if (joinedRoute) {
        var join = nearestPointOnRoute(joinedRoute, e.joinAt || p2);
        if (join) {
          p2 = { x: join.x, y: join.y };
          dir2 = join.horizontal
            ? { x: 0, y: p1.y < p2.y ? -1 : 1 }
            : { x: p1.x < p2.x ? -1 : 1, y: 0 };
        }
      }
      var points = edgeRoute(e, p1, dir1, p2, dir2, occupied);
      renderedRoutes[e.id] = points;
      var d = routePath(points);
      if (e.lineType !== 'straight') {
        for (var i = 1; i < points.length; i++) occupied.push({ a: points[i - 1], b: points[i] });
      }
      var branch = a.type === 'selection' ? edgeBranch(e) : '';
      var label = branch === 'true' ? 'True' : branch === 'false' ? 'False' : '';
      var labelPoint = branchLabelPoint(p1, dir1);
      var cls = (activeId === e.id ? 'active' : '') + (FS.selectedEdgeId === e.id ? ' selected' : '');
      return '<g data-edge="' + e.id + '"><path class="fs-wire-hit" d="' + d + '"/><path class="fs-wire ' + cls + '" d="' + d + '"' + (joinedRoute ? '' : ' marker-end="url(#fsArrow)"') + '/>' +
        (label ? '<text class="fs-wire-label" text-anchor="' + labelPoint.anchor + '" x="' + labelPoint.x + '" y="' + labelPoint.y + '">' + label + '</text>' : '') + '</g>';
    }).join('');
    Array.prototype.forEach.call(els.wireLayer.querySelectorAll('.fs-wire-hit'), function (p) {
      p.addEventListener('click', function () { selectEdge(p.parentNode.dataset.edge); });
    });
  }

  // Marks the block currently being executed, alongside renderWires'
  // active outgoing arrow, so a run/step lights up the whole path -
  // symbol and wire together - instead of just the arrows between them,
  // which was hard for students to actually trace during a walkthrough.
  // Toggles a class directly on the existing DOM node rather than going
  // through renderAll(), so it doesn't disturb whatever the student has
  // focused (e.g. mid-edit in an inline select/input).
  function setActiveNode(id) {
    if (!els.nodes) return;
    var current = els.nodes.querySelector('.fs-node.active');
    if (current && current.dataset.id !== id) current.classList.remove('active');
    if (id) {
      var next = els.nodes.querySelector('.fs-node[data-id="' + id + '"]');
      if (next) next.classList.add('active');
    }
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
    var fromNode = getNode(FS.connect.from);
    var p1 = center(fromNode, FS.connect.fromA), p2 = screenToWorld(x, y);
    els.draft.setAttribute('d', draftOrthogonalPath(p1, anchorDirection(fromNode, FS.connect.fromA), p2));
  }

  function renderInspector() {
    var host = els.inspector;
    if (FS.selectedEdgeId) { renderEdgeInspector(host); return; }
    var n = getNode(FS.selected);
    if (!n) { host.className = 'fs-empty'; host.innerHTML = 'Select a block or connector to edit it.'; return; }
    host.className = '';
    var f = '';
    if (n.type === 'move_steps') f = field('Distance (steps)', 'number', 'steps', n.data.steps);
    if (n.type === 'turn_right' || n.type === 'turn_left' || n.type === 'point_in_direction') f = field('Degrees', 'number', 'degrees', n.data.degrees);
    if (n.type === 'change_color') f = field('Change by', 'number', 'value', n.data.value);
    if (n.type === 'say' || n.type === 'ask') f = field(n.type === 'say' ? 'Message' : 'Question', 'text', 'text', n.data.text);
    if (n.type === 'point_towards' || n.type === 'set_variable' || n.type === 'change_variable') f = '<p class="fs-empty">Use the dropdown inside this block.</p>';
    if (n.type === 'selection') f = '<p class="fs-empty">Use the dropdowns inside this block. Select either outgoing connector to set it as True or False.</p>';
    host.innerHTML = '<b>' + typeTitle(n) + '</b>' + f + '<button class="fs-danger" id="fsDeleteNode">Delete block</button>';
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
  function renderEdgeInspector(host) {
    var edge = FS.edges.find(function (e) { return e.id === FS.selectedEdgeId; });
    if (!edge) { FS.selectedEdgeId = null; host.className = 'fs-empty'; host.innerHTML = 'Select a block or connector to edit it.'; return; }
    host.className = '';
    var fromNode = getNode(edge.from), branchField = '';
    if (fromNode && fromNode.type === 'selection') {
      var currentBranch = edgeBranch(edge);
      branchField = '<div class="fs-field"><label>Decision branch</label><select id="fsEdgeBranch">' +
        '<option value="true"' + (currentBranch === 'true' ? ' selected' : '') + '>True</option>' +
        '<option value="false"' + (currentBranch === 'false' ? ' selected' : '') + '>False</option>' +
        '</select></div>';
    }
    host.innerHTML = '<b>Connector</b>' + branchField +
      '<div class="fs-field"><label>Line type</label><select id="fsEdgeLineType">' +
      '<option value="orthogonal"' + (edge.lineType !== 'straight' ? ' selected' : '') + '>Right-angle</option>' +
      '<option value="straight"' + (edge.lineType === 'straight' ? ' selected' : '') + '>Straight</option>' +
      '</select></div>' +
      '<button class="fs-danger" id="fsDeleteEdge">Delete connection</button>';
    host.querySelector('#fsEdgeLineType').addEventListener('change', function (e) {
      edge.lineType = e.target.value; renderWires(); saveGraph(FS.activeSprite);
    });
    var branchSelect = host.querySelector('#fsEdgeBranch');
    if (branchSelect) branchSelect.addEventListener('change', function (event) {
      var requested = event.target.value;
      var sibling = FS.edges.find(function (other) {
        return other.id !== edge.id && other.from === edge.from && edgeBranch(other) === requested;
      });
      edge.branch = requested;
      if (sibling) sibling.branch = requested === 'true' ? 'false' : 'true';
      renderAll(); selectEdge(edge.id); saveGraph(FS.activeSprite);
    });
    host.querySelector('#fsDeleteEdge').onclick = function () {
      FS.edges = FS.edges.filter(function (e) { return e.id !== edge.id; });
      FS.selectedEdgeId = null; renderAll(); saveGraph(FS.activeSprite);
    };
  }
  function removeSelected() {
    if (!FS.selected) return;
    FS.nodes = FS.nodes.filter(function (n) { return n.id !== FS.selected; });
    FS.edges = FS.edges.filter(function (e) { return e.from !== FS.selected && e.to !== FS.selected; });
    FS.selected = null;
    renderAll(); saveGraph(FS.activeSprite);
  }

  // True if any node reachable from startId can eventually reach itself
  // again, i.e. the graph has a loop (standard directed-cycle detection:
  // DFS tracking the current recursion stack, not just visited nodes).
  function hasCycleFrom(startId, out) {
    var visited = {}, onStack = {};
    function dfs(id) {
      visited[id] = true; onStack[id] = true;
      var found = out(id).some(function (next) {
        if (onStack[next]) return true;
        if (visited[next]) return false;
        return dfs(next);
      });
      onStack[id] = false;
      return found;
    }
    return dfs(startId);
  }
  function validate() {
    var errors = [];
    var starts = FS.nodes.filter(function (n) { return n.type === 'start'; });
    var ends = FS.nodes.filter(function (n) { return n.type === 'end'; });
    if (starts.length !== 1) errors.push('Flow needs exactly one Start block (found ' + starts.length + ').');
    var out = function (id) { return FS.edges.filter(function (e) { return e.from === id; }).map(function (e) { return e.to; }); };
    var inc = function (id) { return FS.edges.filter(function (e) { return e.to === id; }).map(function (e) { return e.from; }); };
    // A flowchart doesn't have to end: a "forever" loop (a game's main
    // loop, say) is just a wire connected back to an earlier block, a
    // cycle, with no End block at all, same as Scratch's own forever
    // block never finishes on its own either. So an End block is only
    // required when there's no loop to keep the flow running instead.
    if (!ends.length && starts.length === 1 && !hasCycleFrom(starts[0].id, out)) {
      errors.push('Flow needs an End block, or a connection looping back to an earlier block to keep it running.');
    }
    FS.nodes.forEach(function (n) {
      if (n.type !== 'end' && !out(n.id).length) errors.push(typeTitle(n) + ' has no outgoing connection.');
      if (n.type !== 'start' && !inc(n.id).length) errors.push(typeTitle(n) + ' has no incoming connection.');
      if (n.type === 'selection' && out(n.id).length !== 2) errors.push('Each Selection must have exactly two outgoing connections, one True and one False.');
      // addEdge() already refuses to create this, but defends here too in
      // case a graph saved before that enforcement existed gets loaded:
      // Run must never execute a flowchart with an ambiguous branch.
      if (n.type !== 'selection' && n.type !== 'end' && out(n.id).length > 1) errors.push(typeTitle(n) + ' has more than one outgoing connection, only a Selection block can branch.');
      if ((n.type === 'set_variable' || n.type === 'change_variable') && !n.data.varName) errors.push(typeTitle(n) + ' has no variable selected.');
      if (n.type === 'selection' && n.data.condition === 'variable' && !n.data.varName) errors.push('Selection has no variable selected.');
    });
    if (starts.length === 1) {
      var seen = {};
      (function walk(id) { if (seen[id]) return; seen[id] = true; out(id).forEach(walk); })(starts[0].id);
      FS.nodes.forEach(function (n) { if (!seen[n.id]) errors.push(typeTitle(n) + ' is not reachable from Start.'); });
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
  // Every case here does its work synchronously and returns nothing to
  // await, EXCEPT say (its bubble needs to actually be visible for a
  // moment) and ask (genuinely waits on the student). Pacing between
  // steps is handled centrally in run(), not per-block, so slow mode can
  // control it uniformly instead of fighting a per-block wait baked in
  // here.
  function runBlock(n) {
    var target = activeTarget();
    if (n.type === 'set_variable' || n.type === 'change_variable') {
      var v = findGlobalVariable(n.data.varName);
      if (v) {
        if (n.type === 'set_variable') v.value = Number(n.data.value || 0);
        else v.value = (Number(v.value) || 0) + Number(n.data.value || 0);
      }
      return;
    }
    if (!target) return;
    switch (n.type) {
      case 'move_steps': {
        var rad = d2r(target.direction);
        target.setXY(target.x + Number(n.data.steps || 0) * Math.cos(rad), target.y + Number(n.data.steps || 0) * Math.sin(rad));
        return;
      }
      case 'turn_right':
        target.setDirection(target.direction + Number(n.data.degrees || 0));
        return;
      case 'turn_left':
        target.setDirection(target.direction - Number(n.data.degrees || 0));
        return;
      case 'point_in_direction':
        target.setDirection(Number(n.data.degrees || 0));
        return;
      case 'point_towards':
        if (n.data.target === 'random') {
          target.setDirection((Math.random() * 360) - 180);
        } else {
          var dx = FS.mouse.x - target.x, dy = FS.mouse.y - target.y;
          target.setDirection(90 - Math.atan2(dy, dx) * 180 / Math.PI);
        }
        return;
      case 'next_costume':
        try { target.setCostume((target.currentCostume + 1) % target.sprite.costumes.length); } catch (e) {}
        return;
      case 'change_color':
        try { target.changeEffect('color', Number(n.data.value || 0)); } catch (e) {
          try {
            var cur = (target.effects && target.effects.color) || 0;
            target.setEffect('color', cur + Number(n.data.value || 0));
          } catch (e2) {}
        }
        return;
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
        return;
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
    else if (n.data.condition === 'variable') {
      var vv = findGlobalVariable(n.data.varName);
      if (vv) {
        var a = Number(vv.value), b = Number(n.data.varValue);
        if (!isNaN(a) && !isNaN(b)) {
          if (n.data.operator === 'gt') v = a > b;
          else if (n.data.operator === 'lt') v = a < b;
          else v = a === b;
        } else {
          v = String(vv.value) === String(n.data.varValue);
        }
      }
    }
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
    FS.answer = ''; els.answerValue.textContent = String.fromCharCode(8709);
    var start = FS.nodes.find(function (n) { return n.type === 'start'; });
    var current = start, steps = 0;
    // A "forever" flowchart loop is just a wire connected back to an
    // earlier block, a normal cycle, not a special block type. The pacing
    // wait() below every step (zero when slow mode is off, still a real
    // await so control always yields back to the browser) is what stops
    // this from ever locking up the tab like a true synchronous busy-loop
    // could. STEP_CAP is a generous last-resort safety net only, not the
    // intended way to stop a deliberate loop, that's what the stop button
    // (wired to TurboWarp's own) is for.
    var STEP_CAP = 200000;
    (async function loop() {
      while (FS.running && FS.gen === myGen && current && steps++ < STEP_CAP) {
        setRunStatus(typeTitle(current));
        var outs = FS.edges.filter(function (e) { return e.from === current.id; });
        renderWires(outs[0] && outs[0].id);
        setActiveNode(current.id);
        if (current.type === 'end') break;
        await runBlock(current);
        if (FS.gen !== myGen) return;
        await wait(FS.slowMode ? FS.slowDelayMs : 0);
        if (FS.gen !== myGen) return;
        if (current.type === 'selection') {
          var truth = evaluateCondition(current);
          var chosen = outs.find(function (edge) { return edgeBranch(edge) === (truth ? 'true' : 'false'); });
          current = getNode(chosen ? chosen.to : undefined);
        } else {
          current = getNode(outs[0] ? outs[0].to : undefined);
        }
      }
      if (steps >= STEP_CAP) notify('Stopped after a very long run, in case something is stuck. Use the stop button to end a deliberate loop instead.', 'error');
      finishRun(myGen);
    })();
  }
  function finishRun(myGen) {
    if (myGen !== undefined && myGen !== FS.gen) return;
    FS.running = false;
    setRunStatus('Ready');
    els.askWrap.classList.remove('active');
    renderWires();
    setActiveNode(null);
  }
  function stop() { FS.gen++; finishRun(FS.gen); }

  // ── UI construction ──────────────────────────────────────────────────
  function injectStyle() {
    var style = document.createElement('style');
    style.textContent = [
      // border-box so the padding/border on .fs-node-body don't add on top
      // of its declared min-height, keeping the actual rendered box the
      // same size center() assumes below (content-box was silently
      // inflating nodes to ~87px/66px, which is what threw wire endpoints
      // off their anchor dots).
      '#fs-overlay,#fs-overlay *{box-sizing:border-box}',
      // Force light mode regardless of TurboWarp's own dark theme setting.
      // color-scheme is inherited, so without this, native <select>/<input>
      // controls inside the overlay render with the OS's dark-mode chrome
      // (dark background, light text) even though every element around
      // them still has its own explicit light background here, making
      // dropdown text unreadable. Belt-and-braces: also pin background/
      // color directly on the controls themselves.
      '#fs-overlay{color-scheme:light}',
      '#fs-overlay select,#fs-overlay input{background:#fff;color:#18191b}',
      '#fs-overlay{position:fixed;left:0;top:92px;right:60%;bottom:0;z-index:45;display:flex;flex-direction:column;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:13px;color:#18191b;background:#e9e9eb;border-right:2px solid #151619;box-shadow:4px 0 20px rgba(0,0,0,.35)}',
      '#fs-overlay.fs-suppressed{display:none}',
      '.blocklyDiv,.blocklyToolboxDiv,.blocklyFlyout,.blocklyWidgetDiv{display:none !important}',
      '#fs-topbar{display:flex;align-items:center;gap:8px;padding:0 10px;height:42px;flex-shrink:0;background:#151619;color:#fff;border-bottom:1px solid #000}',
      '#fs-topbar button{font:inherit;cursor:pointer;border:1px solid #3d3f45;background:#24262a;color:#fff;border-radius:7px;padding:5px 9px;font-size:12px}',
      '#fs-topbar button:hover{background:#32343a}',
      '#fs-topbar .fs-hint{font-size:11px;color:#aeb1b8}',
      '#fs-topbar .fs-spacer{flex:1}',
      '#fs-zoom-readout{min-width:38px;text-align:center;color:#c7c9ce;font-variant-numeric:tabular-nums;font-size:11px}',
      '#fs-body{flex:1;display:flex;min-height:0}',
      '#fs-sidebar{width:150px;flex-shrink:0;background:#fff;border-right:1px solid #d8d9dd;display:flex;flex-direction:column;min-height:0}',
      // Sticky strip of coloured category chips, always visible above the
      // scrolling palette; clicking one jumps that category's <h2> into
      // view, the same "click a category to jump to it" behaviour
      // Scratch's own category bar gives you.
      '#fs-cat-jump{display:flex;flex-wrap:wrap;gap:5px;padding:8px;border-bottom:1px solid #d8d9dd;flex-shrink:0}',
      '.fs-cat-chip{width:16px;height:16px;border-radius:5px;border:1px solid rgba(0,0,0,.15);background:var(--fs-cat-color);cursor:pointer;padding:0}',
      '.fs-cat-chip:hover{box-shadow:0 0 0 2px rgba(0,0,0,.12)}',
      '#fs-palette-scroll{flex:1;overflow:auto;padding:8px}',
      // Category colours match Scratch's own real block-category colours
      // (see CATEGORIES) so a returning Scratch user recognises them.
      '#fs-sidebar h2{font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px;padding:3px 6px;border-radius:5px;color:#fff;background:var(--fs-cat-color);cursor:pointer;scroll-margin-top:4px}',
      '#fs-sidebar h2:first-child{margin-top:0}',
      '.fs-palette-item{display:flex;align-items:center;gap:6px;min-height:34px;padding:6px 7px;border:1px solid #d8d9dd;border-left:4px solid var(--fs-cat-color);border-radius:6px;background:#fff;cursor:grab;user-select:none;margin-bottom:6px;font-size:11px}',
      '.fs-palette-item:hover{border-color:#9ea1aa;border-left-color:var(--fs-cat-color);box-shadow:0 3px 10px rgba(0,0,0,.08)}',
      '.fs-new-var-btn{width:100%;margin-bottom:6px;border:1px solid #d8d9dd;background:#f6f6f7;border-radius:6px;padding:6px;font-size:11px;cursor:pointer}',
      '.fs-new-var-btn:hover{background:#eceded}',
      '.fs-var-row{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:3px 2px;font-size:11px}',
      '.fs-var-check{display:flex;align-items:center;gap:5px;cursor:pointer;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.fs-var-del{border:none;background:none;color:#b43030;cursor:pointer;font-size:13px;line-height:1;padding:0 4px}',
      '.fs-slow-toggle{display:flex;align-items:center;gap:4px;font-size:12px;color:#c7c9ce;cursor:pointer;white-space:nowrap}',
      '#fsSlowSlider{width:80px}',
      '#fsSlowReadout{font-size:11px;color:#aeb1b8;min-width:44px}',
      '.fs-inline-num{width:36px;font-size:9px;padding:1px 2px}',
      '#fs-canvas-wrap{position:relative;overflow:hidden;flex:1;min-width:0;background:#ededee;touch-action:none;cursor:grab}',
      '#fs-canvas-wrap.panning{cursor:grabbing}#fs-canvas-wrap.connecting,#fs-canvas-wrap.fs-anchor-hover{cursor:crosshair}',
      '#fs-world{position:absolute;left:0;top:0;width:2200px;height:1400px;transform-origin:0 0;background-color:#fafafa;background-image:radial-gradient(#c9cbd0 1px,transparent 1px);background-size:22px 22px;box-shadow:0 0 0 1px #d3d4d7}',
      '#fs-wires{position:absolute;inset:0;width:2200px;height:1400px;overflow:visible;pointer-events:none}',
      '#fs-draft-wire{pointer-events:none}',
      '.fs-wire{fill:none;stroke:#646873;stroke-width:2.2}.fs-wire.active{stroke:#22b36b;stroke-width:3.6}.fs-wire.selected{stroke:#4b66e8;stroke-width:3.2}',
      '.fs-wire-hit{fill:none;stroke:transparent;stroke-width:13;pointer-events:stroke;cursor:pointer}.fs-wire-hit:hover+.fs-wire{stroke:#d84c4c}',
      '.fs-wire-label{font-size:10px;font-weight:750;fill:#454850;paint-order:stroke;stroke:#fafafa;stroke-width:5px;stroke-linejoin:round}',
      '.fs-node{position:absolute;width:150px;min-height:66px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,.12));user-select:none}',
      // Border colour matches the block's own category colour (set as
      // --fs-cat-color on .fs-node in nodeMarkup); width stays 2px like
      // before so this can't disturb the anchor-alignment fix, which
      // depends on the node's actual box-model dimensions staying exactly
      // what center() assumes.
      '.fs-node-body{position:relative;width:100%;min-height:66px;padding:9px 12px;background:#fff;border:2px solid var(--fs-cat-color, #4d515a);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;font-size:11px}',
      '.fs-node.selected .fs-node-body{border-color:#4b66e8;box-shadow:0 0 0 3px rgba(75,102,232,.17)}',
      // Same green as the active wire (.fs-wire.active above), so the
      // whole path - block and arrow together - reads as one highlighted
      // trail during a run/step walkthrough, not just the arrows between
      // otherwise-unmarked blocks.
      // Static, not animated: an infinite box-shadow pulse forces a
      // continuous main-thread repaint (box-shadow isn't compositable
      // the way transform/opacity are), which competes with the run
      // loop's own per-step work - renderWires() already rebuilds the
      // whole wire SVG every step - and made every run feel sluggish
      // even with slow mode off and its delay at 0.
      '.fs-node.active .fs-node-body{border-color:#22b36b;box-shadow:0 0 0 4px rgba(34,179,107,.25);background:#eafbf2}',
      '.fs-node.oval .fs-node-body{border-radius:50%}',
      '.fs-node.io .fs-node-body{clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);padding-left:20px;padding-right:20px}',
      '.fs-node.selection .fs-node-body{width:96px;height:96px;min-height:96px;padding:14px;transform:rotate(45deg)}',
      '.fs-node.selection{width:150px;height:112px}',
      '.fs-node.selection .fs-node-content{transform:rotate(-45deg);width:106px}',
      '.fs-node.selection select{max-width:90px;font-size:9px;padding:1px}',
      // Kept narrow enough that a variable-name select plus its value
      // input fit on one row without wrapping: a wrap makes the node
      // grow taller than center() assumes, which is exactly the bug that
      // broke wire-anchor alignment before (see center()'s own comment).
      '.fs-node.process select{font-size:9px;padding:1px 2px;max-width:64px}',
      '.fs-node-title{font-size:11px;font-weight:750}',
      '.fs-node-subtitle{font-size:10px;color:#686b73;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      // Single hover-following anchor dot (replaces the previous 8 fixed
      // compass-point dots): positioned in #fs-world's own coordinate
      // space (left/top in world pixels), so it automatically tracks the
      // canvas's pan/zoom without any extra transform math.
      '.fs-anchor{position:absolute;width:12px;height:12px;border-radius:50%;background:#24bc70;border:2px solid #fff;box-shadow:0 0 0 1px #16864f;transform:translate(-50%,-50%);z-index:6;pointer-events:none;display:none}',
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
      // Wraps a real nodeMarkup() render (see bindPalette) rather than a
      // plain text label, so what a student sees held under the cursor
      // while dragging from the palette is the actual block - its shape
      // (oval/io/diamond/process), category colour and content - not a
      // generic rounded rectangle unrelated to what gets dropped.
      '#fs-palette-ghost{position:fixed;z-index:100;pointer-events:none;box-shadow:0 10px 28px rgba(0,0,0,.18);opacity:.92;transform:translate(-50%,-50%) rotate(-2deg)}',
      '#fs-palette-ghost .fs-node{position:static;filter:none}',
      // "View as diagram" modal: a read-only Mermaid render of the current
      // graph, layered above everything else in the overlay (z-index
      // higher than #fs-ask-wrap's 10010, since a student could in theory
      // open the diagram while an Ask block is waiting for input).
      '#fs-diagram-modal{display:none;position:fixed;inset:0;z-index:10020;background:rgba(15,23,42,.55);align-items:center;justify-content:center;padding:24px}',
      '#fs-diagram-modal.show{display:flex}',
      '#fs-diagram-card{background:#fff;border-radius:12px;max-width:min(900px,100%);max-height:100%;width:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35)}',
      '#fs-diagram-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e2e3e7}',
      '#fs-diagram-head h2{font-size:14px;margin:0}',
      '#fsDiagramCloseBtn{border:none;background:none;font-size:20px;line-height:1;cursor:pointer;color:#686b73;padding:2px 6px}',
      '#fsDiagramCloseBtn:hover{color:#18191b}',
      '#fs-diagram-body{padding:20px;overflow:auto;text-align:center}',
      '#fs-diagram-body svg{max-width:100%;height:auto}',
      '.fs-diagram-loading{color:#686b73;font-size:13px;margin:20px 0}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // Palette markup is generated from TYPES/CATEGORIES rather than hand-
  // listed, so a category's colour and membership only need to be
  // declared once, in TYPES itself.
  function paletteItemHtml(typeKey) {
    var t = TYPES[typeKey];
    var label = typeKey === 'selection' ? 'Condition' : t.title;
    return '<div class="fs-palette-item" data-type="' + typeKey + '" style="--fs-cat-color:' + CATEGORIES[t.category].color + '"><b>' + esc(label) + '</b></div>';
  }
  function categorySectionHtml(catKey) {
    var cat = CATEGORIES[catKey];
    var keys = Object.keys(TYPES).filter(function (k) { return TYPES[k].category === catKey; });
    var itemsHtml = keys.map(paletteItemHtml).join('');
    // Variables gets a live list of existing variables plus a "+ New
    // variable" control above its draggable blocks, matching Scratch's
    // own Variables category layout (Make a Variable, then the blocks).
    if (catKey === 'variables') {
      itemsHtml = '<div id="fs-var-list"></div>' +
        '<button type="button" id="fsNewVarBtn" class="fs-new-var-btn">+ New variable</button>' +
        itemsHtml;
    }
    return '<h2 data-cat="' + catKey + '" style="--fs-cat-color:' + cat.color + '">' + esc(cat.label) + '</h2>' + itemsHtml;
  }
  function paletteSidebarHtml() {
    // A slim sticky strip of coloured chips, one per category, always
    // visible above the scrollable palette list, the same jump-to-
    // category behaviour Scratch's own category bar gives you.
    var chips = PALETTE_ORDER.map(function (k) {
      return '<button type="button" class="fs-cat-chip" data-jump="' + k + '" style="--fs-cat-color:' + CATEGORIES[k].color + '" title="' + esc(CATEGORIES[k].label) + '"></button>';
    }).join('');
    var sections = PALETTE_ORDER.map(categorySectionHtml).join('');
    return '<div id="fs-cat-jump">' + chips + '</div><div id="fs-palette-scroll">' + sections + '</div>';
  }
  function renderSidebar() {
    if (!els.varList) return;
    var vars = getGlobalVariables();
    els.varList.innerHTML = vars.length
      ? vars.map(function (v) {
          return '<div class="fs-var-row"><label class="fs-var-check" title="Show on stage"><input type="checkbox" class="fs-var-monitor" data-var="' + esc(v.name) + '"' + (isVariableMonitorVisible(v.id) ? ' checked' : '') + '> ' + esc(v.name) + '</label><button type="button" class="fs-var-del" data-var="' + esc(v.name) + '">&times;</button></div>';
        }).join('')
      : '<div class="fs-empty" style="padding:2px 0 6px">No variables yet.</div>';
    Array.prototype.forEach.call(els.varList.querySelectorAll('.fs-var-del'), function (btn) {
      btn.addEventListener('click', function () { deleteGlobalVariable(btn.dataset.var); });
    });
    Array.prototype.forEach.call(els.varList.querySelectorAll('.fs-var-monitor'), function (cb) {
      cb.addEventListener('change', function () {
        var v = findGlobalVariable(cb.dataset.var);
        if (v) setVariableMonitorVisible(v, cb.checked);
      });
    });
  }

  function buildUI() {
    injectStyle();
    var root = document.createElement('div');
    root.id = 'fs-overlay';
    root.innerHTML =
      '<div id="fs-topbar">' +
        '<button id="fsValidateBtn">Check flow</button>' +
        '<button id="fsClearBtn">Clear</button>' +
        '<button id="fsDiagramBtn">View as diagram</button>' +
        '<label class="fs-slow-toggle"><input type="checkbox" id="fsSlowModeToggle"> Slow mode</label>' +
        '<input type="range" id="fsSlowSlider" min="0" max="2000" step="50" value="500" style="display:none">' +
        '<span id="fsSlowReadout" style="display:none">500ms</span>' +
        '<span class="fs-hint">Use the green flag / stop button above the stage to run</span>' +
        '<div class="fs-spacer"></div>' +
        '<button id="fsZoomOut">&minus;</button><span id="fs-zoom-readout">100%</span><button id="fsZoomIn">+</button><button id="fsFitBtn">Fit</button>' +
      '</div>' +
      '<div id="fs-body">' +
        '<aside id="fs-sidebar">' + paletteSidebarHtml() + '</aside>' +
        '<section id="fs-canvas-wrap">' +
          '<div id="fs-toast"></div>' +
          '<div id="fs-world"><svg id="fs-wires"><defs><marker id="fsArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#646873"/></marker></defs><g id="fs-wire-layer"></g><path id="fs-draft-wire" class="fs-wire active" style="display:none"/></svg><div id="fs-nodes"></div><div id="fs-hover-anchor" class="fs-anchor"></div></div>' +
        '</section>' +
        '<aside id="fs-inspector"><h2>Selected block</h2><div id="fs-inspector-body" class="fs-empty">Select a block to edit it.</div></aside>' +
      '</div>' +
      '<div id="fs-status-bar"><span id="fs-run-status">Ready</span><span>answer: <span id="fs-answer-value">&empty;</span></span></div>' +
      '<div id="fs-ask-wrap"><form id="fs-ask-form"><div id="fs-ask-box"><label id="fs-ask-label"></label><div id="fs-ask-row"><input id="fs-ask-input" autocomplete="off"><button>Answer</button></div></div></form></div>' +
      '<div id="fs-diagram-modal"><div id="fs-diagram-card"><div id="fs-diagram-head"><h2>Flowchart diagram</h2><button id="fsDiagramCloseBtn" aria-label="Close">&times;</button></div><div id="fs-diagram-body"></div></div></div>';
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
      runStatus: root.querySelector('#fs-run-status'),
      answerValue: root.querySelector('#fs-answer-value'),
      askWrap: root.querySelector('#fs-ask-wrap'),
      askForm: root.querySelector('#fs-ask-form'),
      askLabel: root.querySelector('#fs-ask-label'),
      askInput: root.querySelector('#fs-ask-input'),
      hoverAnchorEl: root.querySelector('#fs-hover-anchor'),
      varList: root.querySelector('#fs-var-list'),
      diagramModal: root.querySelector('#fs-diagram-modal'),
      diagramBody: root.querySelector('#fs-diagram-body')
    };

    bindGlobalPointer();
    bindPalette();
    bindCanvas();
    renderSidebar();

    root.querySelector('#fsValidateBtn').onclick = function () {
      var e = validate();
      notify(e.length ? e.join(' ') : 'Flow is valid.', e.length ? 'error' : 'ok');
    };
    root.querySelector('#fsClearBtn').onclick = function () {
      if (confirm('Clear every block and connector for this sprite?')) {
        FS.nodes = []; FS.edges = []; FS.selected = null; FS.selectedEdgeId = null; renderAll(); saveGraph(FS.activeSprite);
      }
    };
    root.querySelector('#fsDiagramBtn').onclick = showDiagramModal;
    root.querySelector('#fsDiagramCloseBtn').onclick = function () { els.diagramModal.classList.remove('show'); };
    els.diagramModal.addEventListener('click', function (event) {
      if (event.target === els.diagramModal) els.diagramModal.classList.remove('show');
    });
    root.querySelector('#fsNewVarBtn').onclick = function () {
      var name = prompt('New variable name:');
      if (name) createGlobalVariable(name);
    };
    var slowToggle = root.querySelector('#fsSlowModeToggle');
    var slowSlider = root.querySelector('#fsSlowSlider');
    var slowReadout = root.querySelector('#fsSlowReadout');
    slowToggle.onchange = function () {
      FS.slowMode = slowToggle.checked;
      slowSlider.style.display = FS.slowMode ? 'inline-block' : 'none';
      slowReadout.style.display = FS.slowMode ? 'inline' : 'none';
    };
    slowSlider.oninput = function () {
      FS.slowDelayMs = Number(slowSlider.value);
      slowReadout.textContent = FS.slowDelayMs + 'ms';
    };
    Array.prototype.forEach.call(root.querySelectorAll('.fs-cat-chip'), function (chip) {
      chip.addEventListener('click', function () {
        var target = root.querySelector('h2[data-cat="' + chip.dataset.jump + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    root.querySelector('#fsZoomIn').onclick = function () { zoom(1.15); };
    root.querySelector('#fsZoomOut').onclick = function () { zoom(.87); };
    root.querySelector('#fsFitBtn').onclick = fitToScreen;
  }

  function zoom(by) { FS.scale = Math.min(1.8, Math.max(.35, FS.scale * by)); updateTransform(); }
  function fitToScreen() {
    if (!FS.nodes.length) return;
    var minX = Math.min.apply(null, FS.nodes.map(function (n) { return n.x; }));
    var minY = Math.min.apply(null, FS.nodes.map(function (n) { return n.y; }));
    var maxX = Math.max.apply(null, FS.nodes.map(function (n) { return n.x + nodeDims(n).w; }));
    var maxY = Math.max.apply(null, FS.nodes.map(function (n) { return n.y + nodeDims(n).h; }));
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
        // A real block preview: same nodeMarkup() every actual node on the
        // canvas uses, fed a throwaway node with that type's default data,
        // so the shape/colour/content match exactly what will be dropped.
        // Selects/inputs inside render but aren't wired up - harmless,
        // since the ghost has pointer-events:none anyway.
        var t = TYPES[p.dataset.type];
        ghost.innerHTML = nodeMarkup({ id: 'fs-ghost-preview', type: p.dataset.type, shape: t.shape, x: 0, y: 0, data: clone(t.data) });
        document.body.appendChild(ghost);
        ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
        FS.palette = { type: p.dataset.type, ghost: ghost };
        try { p.setPointerCapture(e.pointerId); } catch (_err) {}
      });
    });
  }

  function bindCanvas() {
    var space = false;
    els.canvasWrap.addEventListener('pointerleave', hideHoverAnchor);
    els.canvasWrap.addEventListener('pointerdown', function (e) {
      var blank = e.target === els.world || e.target === els.canvasWrap;
      // The anchor dot can be showing (cursor within HOVER_ANCHOR_SCREEN_PX
      // of a node's edge) even when the pointerdown target is blank canvas,
      // not the node itself - e.g. the cursor is just outside the node's
      // own box. Starting the connection here too, before falling through
      // to pan, means the drag a student sees invited (the green dot) is
      // the drag they actually get, instead of silently panning the canvas.
      if (blank && e.button === 0 && startConnectFromHoverAnchor(e)) { e.preventDefault(); return; }
      if (!FS.connect && ((blank && e.button === 0) || space || e.button === 1)) {
        FS.selected = null; FS.selectedEdgeId = null; renderAll();
        FS.drag = { kind: 'pan', startX: e.clientX, startY: e.clientY, x: FS.panX, y: FS.panY };
        els.canvasWrap.classList.add('panning');
        try { els.canvasWrap.setPointerCapture(e.pointerId); } catch (_err) {}
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
    // Mouse position in Scratch stage coordinates (centre 0,0, Y-up), for
    // Point towards's mouse-pointer option. Same conversion pyscratch.js
    // uses, tracked independently since FlowScratch doesn't share state
    // with it.
    window.addEventListener('mousemove', function (e) {
      var canvas = document.querySelector('canvas');
      if (!canvas) return;
      var r = canvas.getBoundingClientRect();
      FS.mouse.x = ((e.clientX - r.left) / r.width) * 480 - 240;
      FS.mouse.y = -(((e.clientY - r.top) / r.height) * 360 - 180);
    });
    window.addEventListener('keydown', function (e) {
      if (!els.overlay || els.overlay.style.display === 'none') { FS.pressedKeys[normKey(e.code)] = true; return; }
      FS.pressedKeys[normKey(e.code)] = true;
      if (e.code === 'Space' && !/INPUT|SELECT/.test(e.target.tagName)) { space = true; e.preventDefault(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !/INPUT|SELECT/.test(e.target.tagName) && els.overlay.contains(document.activeElement) === false) {
        if (FS.selected) removeSelected();
        else if (FS.selectedEdgeId) {
          FS.edges = FS.edges.filter(function (e2) { return e2.id !== FS.selectedEdgeId; });
          FS.selectedEdgeId = null; renderAll(); saveGraph(FS.activeSprite);
        }
      }
    });
    window.addEventListener('keyup', function (e) { FS.pressedKeys[normKey(e.code)] = false; if (e.code === 'Space') space = false; });
  }
  function normKey(code) {
    var map = { ArrowRight: 'ArrowRight', ArrowLeft: 'ArrowLeft', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', Space: 'Space' };
    return map[code] || code;
  }

  // Splices a freshly-dropped node into the middle of an existing edge:
  // removes that edge and reconnects fromNode -> n -> toNode, keeping the
  // two original nodes' own anchor points (fromA/toA) and picking the
  // point on the new node's own edge nearest to each neighbour.
  function spliceNodeIntoEdge(n, edge) {
    var fromNode = getNode(edge.from), toNode = getNode(edge.to);
    if (!fromNode || !toNode) return;
    FS.edges = FS.edges.filter(function (e) { return e.id !== edge.id; });
    var fromDims = nodeDims(fromNode), toDims = nodeDims(toNode);
    var fromCenter = { x: fromNode.x + fromDims.w / 2, y: fromNode.y + fromDims.h / 2 };
    var toCenter = { x: toNode.x + toDims.w / 2, y: toNode.y + toDims.h / 2 };
    addEdge(fromNode.id, n.id, edge.fromA, anchorPointOnNode(n, fromCenter.x, fromCenter.y));
    addEdge(n.id, toNode.id, anchorPointOnNode(n, toCenter.x, toCenter.y), edge.toA);
  }

  // ── Hover anchor: a single green dot that follows the cursor along
  // whichever node's edge it's nearest to, replacing the previous 8 fixed
  // compass-point dots. Pressing down while it's showing (handled in
  // bindNodes above) starts a connection from that exact spot.
  var HOVER_ANCHOR_SCREEN_PX = 14; // how close the cursor must be, in screen pixels
  function updateHoverAnchor(clientX, clientY) {
    if (FS.drag || FS.connect || FS.palette || !els.hoverAnchorEl) { hideHoverAnchor(); return; }
    var wp = screenToWorld(clientX, clientY);
    var threshold = HOVER_ANCHOR_SCREEN_PX / FS.scale;
    var best = null;
    FS.nodes.forEach(function (n) {
      var d = nodeDims(n), w = d.w, h = d.h;
      var lx = wp.x - n.x, ly = wp.y - n.y;
      if (lx < -threshold || lx > w + threshold || ly < -threshold || ly > h + threshold) return;
      var pt = nearestPerimeterPoint(w, h, lx, ly);
      var dist = Math.hypot(lx - pt.x, ly - pt.y);
      if (dist <= threshold && (!best || dist < best.dist)) best = { nodeId: n.id, x: pt.x, y: pt.y, dist: dist };
    });
    if (!best) { hideHoverAnchor(); return; }
    FS.hoverAnchor = best;
    var node = getNode(best.nodeId);
    els.hoverAnchorEl.style.left = (node.x + best.x) + 'px';
    els.hoverAnchorEl.style.top = (node.y + best.y) + 'px';
    els.hoverAnchorEl.style.display = 'block';
    els.canvasWrap.classList.add('fs-anchor-hover');
  }
  function hideHoverAnchor() {
    FS.hoverAnchor = null;
    if (els.hoverAnchorEl) els.hoverAnchorEl.style.display = 'none';
    if (els.canvasWrap) els.canvasWrap.classList.remove('fs-anchor-hover');
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
      if (!FS.drag && !FS.connect && !FS.palette) updateHoverAnchor(e.clientX, e.clientY);
    });
    window.addEventListener('pointerup', function (e) {
      if (FS.palette) {
        var p = FS.palette, r = els.canvasWrap.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          // Dropping directly on an existing wire splices the new block
          // into that connection instead of leaving it disconnected.
          var hitEl = document.elementFromPoint(e.clientX, e.clientY);
          var wireHit = hitEl && hitEl.closest ? hitEl.closest('.fs-wire-hit') : null;
          var targetEdge = wireHit ? FS.edges.find(function (ed) { return ed.id === wireHit.parentNode.dataset.edge; }) : null;
          var wp = screenToWorld(e.clientX, e.clientY);
          var n = addNode(p.type, Math.max(0, wp.x - 75), Math.max(0, wp.y - 33), false);
          if (targetEdge) spliceNodeIntoEdge(n, targetEdge);
          renderAll();
          select(n.id); saveGraph(FS.activeSprite);
        }
        p.ghost.remove(); FS.palette = null;
      }
      if (FS.connect) {
        var dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        var targetWire = dropTarget && dropTarget.closest ? dropTarget.closest('.fs-wire-hit') : null;
        var joinedEdge = targetWire ? FS.edges.find(function (ed) { return ed.id === targetWire.parentNode.dataset.edge; }) : null;
        var target = dropTarget && dropTarget.closest ? dropTarget.closest('.fs-node') : null;
        if (joinedEdge && joinedEdge.from !== FS.connect.from) {
          var joinPoint = screenToWorld(e.clientX, e.clientY);
          addEdge(FS.connect.from, joinedEdge.to, FS.connect.fromA, joinedEdge.toA, {
            joinEdgeId: joinedEdge.id,
            joinAt: { x: joinPoint.x, y: joinPoint.y }
          });
          saveGraph(FS.activeSprite);
        } else if (target && target.dataset.id !== FS.connect.from) {
          var wp2 = screenToWorld(e.clientX, e.clientY);
          var n2 = getNode(target.dataset.id);
          addEdge(FS.connect.from, n2.id, FS.connect.fromA, anchorPointOnNode(n2, wp2.x, wp2.y));
          saveGraph(FS.activeSprite);
        }
        FS.connect = null; els.draft.style.display = 'none'; els.canvasWrap.classList.remove('connecting');
        hideHoverAnchor();
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
    // No default Start/End pair: a new sprite starts with an empty canvas,
    // Check Flow/Run already explain what's missing if the student tries
    // to run before adding a Start block.
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

    // ── Project save: embed flowcharts inside project.json ───────────
    // Patch vm.toJSON, called by every TurboWarp save path (File > Save,
    // Ctrl+S, restore points). A flowchart is added as a "flowscratch"
    // field on each non-stage target, same field-per-target approach
    // pyscratch.js uses for Python. Every sprite's flowchart is embedded,
    // not just the currently-open one, pulling from localStorage for any
    // sprite that isn't the active one right now.
    try {
      var origToJSON = vm.toJSON.bind(vm);
      vm.toJSON = function (optTargetId, serializationOptions) {
        saveGraph(FS.activeSprite);
        var jsonStr = origToJSON(optTargetId, serializationOptions);
        try {
          var proj = JSON.parse(jsonStr);
          (proj.targets || []).forEach(function (t) {
            if (t.isStage) return;
            var graph = (t.name === FS.activeSprite) ? { nodes: FS.nodes, edges: FS.edges } : loadGraph(t.name);
            if (graph.nodes.length || graph.edges.length) t.flowscratch = graph;
          });
          return JSON.stringify(proj);
        } catch (e) {
          return jsonStr;
        }
      };
    } catch (e) {
      console.warn('[FlowScratch] Could not patch vm.toJSON:', e);
    }

    // ── Project load: pull flowcharts back out ────────────────────────
    // A freshly loaded project assigns brand new target ids, so the
    // localStorage cache (keyed by id) can't be relied on to survive a
    // save/reload round trip on its own, same reason pyscratch.js embeds
    // its own data rather than only caching it. Extracted data is applied
    // into localStorage under each sprite's fresh id once loading
    // finishes, so the normal load path picks it up exactly as if it had
    // always been there for this session.
    try {
      var origLoadProject = vm.loadProject.bind(vm);
      vm.loadProject = function (input) {
        return extractFlowScratchData(input).then(function (result) {
          return origLoadProject(result.buffer).then(function (r) {
            if (result.extracted) {
              Object.keys(result.extracted).forEach(function (name) {
                var t = getTargetByName(name);
                if (!t) return;
                try { localStorage.setItem('flowscratch:' + t.id, JSON.stringify(result.extracted[name])); } catch (e) {}
              });
              // Force the currently-active sprite to reload its graph from
              // what was just restored, rather than keeping whatever was
              // on the canvas from before this project loaded.
              if (FS.activeSprite) { FS.activeSprite = null; syncSelectedSprite(); }
            }
            return r;
          });
        });
      };
    } catch (e) {
      console.warn('[FlowScratch] Could not patch vm.loadProject:', e);
    }

    console.log('[FlowScratch] Ready. vm=', vm);
  });
})();
