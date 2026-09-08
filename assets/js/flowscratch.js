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
    mouse: { x: 0, y: 0, down: false },
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
    sound:     { label: 'Sound',     color: '#CF63CF' },
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
    go_to:              { shape: 'process',   title: 'Go to',              data: { target: 'random_position' },  category: 'motion' },
    go_to_xy:           { shape: 'process',   title: 'Go to x y',          data: { x: 0, y: 0 },                 category: 'motion' },
    glide_to:           { shape: 'process',   title: 'Glide to',           data: { seconds: 1, target: 'random_position' }, category: 'motion' },
    glide_to_xy:        { shape: 'process',   title: 'Glide to x y',       data: { seconds: 1, x: 0, y: 0 },     category: 'motion' },
    point_in_direction: { shape: 'process',   title: 'Point in direction', data: { degrees: 90 },                category: 'motion' },
    point_towards:      { shape: 'process',   title: 'Point towards',      data: { target: 'mouse_pointer' },    category: 'motion' },
    change_x_by:        { shape: 'process',   title: 'Change x by',        data: { x: 10 },                      category: 'motion' },
    set_x_to:           { shape: 'process',   title: 'Set x to',           data: { x: 0 },                       category: 'motion' },
    change_y_by:        { shape: 'process',   title: 'Change y by',        data: { y: 10 },                      category: 'motion' },
    set_y_to:           { shape: 'process',   title: 'Set y to',           data: { y: 0 },                       category: 'motion' },
    if_on_edge_bounce:  { shape: 'process',   title: 'If on edge, bounce', data: {},                             category: 'motion' },
    set_rotation_style: { shape: 'process',   title: 'Set rotation style', data: { style: 'all around' },        category: 'motion' },
    next_costume:       { shape: 'process',   title: 'Next costume',       data: {},                             category: 'looks' },
    change_color:       { shape: 'process',   title: 'Change colour',      data: { value: 25 },                  category: 'looks' },
    say:                { shape: 'io',        title: 'Say',                data: { text: 'Hello!' },             category: 'looks' },
    say_for:            { shape: 'process',   title: 'Say for secs',       data: { text: 'Hello!', seconds: 2 }, category: 'looks' },
    think:              { shape: 'io',        title: 'Think',              data: { text: 'Hmm...' },             category: 'looks' },
    think_for:          { shape: 'process',   title: 'Think for secs',     data: { text: 'Hmm...', seconds: 2 }, category: 'looks' },
    switch_costume_to:  { shape: 'process',   title: 'Switch costume to',  data: { costume: '' },                category: 'looks' },
    change_size_by:     { shape: 'process',   title: 'Change size by',     data: { size: 10 },                   category: 'looks' },
    set_size_to:        { shape: 'process',   title: 'Set size to',        data: { size: 100 },                  category: 'looks' },
    change_effect:      { shape: 'process',   title: 'Change effect',      data: { effect: 'color', value: 25 }, category: 'looks' },
    set_effect:         { shape: 'process',   title: 'Set effect',         data: { effect: 'color', value: 0 },  category: 'looks' },
    clear_effects:      { shape: 'process',   title: 'Clear graphic effects', data: {},                         category: 'looks' },
    show:               { shape: 'process',   title: 'Show',               data: {},                             category: 'looks' },
    hide:               { shape: 'process',   title: 'Hide',               data: {},                             category: 'looks' },
    go_to_layer:        { shape: 'process',   title: 'Go to layer',        data: { layer: 'front' },             category: 'looks' },
    change_layer:       { shape: 'process',   title: 'Change layer',       data: { direction: 'forward', layers: 1 }, category: 'looks' },
    play_sound:            { shape: 'process', title: 'Play sound',         data: { sound: '' },                  category: 'sound' },
    play_sound_until_done: { shape: 'process', title: 'Play sound until done', data: { sound: '' },                category: 'sound' },
    stop_all_sounds:       { shape: 'process', title: 'Stop all sounds',    data: {},                             category: 'sound' },
    change_volume_by:      { shape: 'process', title: 'Change volume by',   data: { volume: 10 },                 category: 'sound' },
    set_volume_to:         { shape: 'process', title: 'Set volume to',      data: { volume: 100 },                category: 'sound' },
    ask:                { shape: 'io',        title: 'Ask',                data: { text: 'What is your name?' }, category: 'sensing' },
    set_drag_mode:      { shape: 'process',   title: 'Set drag mode',      data: { mode: 'draggable' },          category: 'sensing' },
    set_variable:       { shape: 'process',   title: 'Set variable',       data: { varName: '', value: 0 },      category: 'variables' },
    set_var_to_random:  { shape: 'process',   title: 'Set variable to random number', data: { varName: '', min: 1, max: 10 }, category: 'variables' },
    multiply_variable:  { shape: 'process',   title: 'Multiply variable by',  data: { varName: '', value: -1 }, category: 'variables' },
    change_variable:    { shape: 'process',   title: 'Change variable',    data: { varName: '', value: 1 },      category: 'variables' },
    list_add:           { shape: 'process',   title: 'Add to list',        data: { listName: '', item: 'thing' }, category: 'variables' },
    list_delete:        { shape: 'process',   title: 'Delete item of list', data: { listName: '', index: 1 },    category: 'variables' },
    list_delete_all:    { shape: 'process',   title: 'Delete all of list', data: { listName: '' },               category: 'variables' },
    list_insert:        { shape: 'process',   title: 'Insert at list',     data: { listName: '', index: 1, item: 'thing' }, category: 'variables' },
    list_replace:       { shape: 'process',   title: 'Replace item of list', data: { listName: '', index: 1, item: 'thing' }, category: 'variables' },
    list_item_to_var:   { shape: 'process',   title: 'Set var to item of list', data: { varName: '', listName: '', index: 1 }, category: 'variables' },
    wait_seconds:       { shape: 'process',   title: 'Wait seconds',       data: { seconds: 1 },                 category: 'control' },
    selection:          { shape: 'selection', title: 'Selection',          data: { negate: 'is', condition: 'key', value: 'Space' }, category: 'control' },
    subroutine_start:   { shape: 'oval',      title: 'Sub-routine start',  data: { name: 'DrawSquare' },         category: 'control' },
    call_subroutine:    { shape: 'subroutine', title: 'Call sub-routine',  data: { name: 'DrawSquare' },         category: 'control' },
    broadcast:          { shape: 'process',   title: 'Broadcast',         data: { message: 'message1' },        category: 'control' },
    when_i_receive:     { shape: 'oval',      title: 'When I receive',    data: { message: 'message1' },        category: 'control' }
  };
  var PALETTE_ORDER = ['flow', 'motion', 'looks', 'sound', 'sensing', 'variables', 'control'];

  // Reporters (sensing values) that can be plugged into any numeric value
  // field, the same idea as Scratch's rounded reporter blocks. Each one
  // reads a live value off the active sprite (or the mouse/answer) at run
  // time instead of a fixed number.
  var REPORTERS = [
    { id: 'x_position', label: 'x position', read: function (t) { return t ? t.x : 0; } },
    { id: 'y_position', label: 'y position', read: function (t) { return t ? t.y : 0; } },
    { id: 'direction',  label: 'direction',  read: function (t) { return t ? t.direction : 0; } },
    { id: 'size',       label: 'size',       read: function (t) { return t ? t.size : 0; } },
    { id: 'answer',     label: 'answer',     read: function () { return Number(FS.answer) || 0; } },
    { id: 'mouse_x',    label: 'mouse x',    read: function () { return FS.mouse.x; } },
    { id: 'mouse_y',    label: 'mouse y',    read: function () { return FS.mouse.y; } }
  ];
  function reporterById(id) {
    for (var i = 0; i < REPORTERS.length; i++) if (REPORTERS[i].id === id) return REPORTERS[i];
    return null;
  }
  // A value field can hold a literal number, a built-in reporter, or a
  // variable's own live value ('var:<name>' - a global variable, plugged
  // into a movement/looks field the same way a Scratch script would drop
  // the round variable reporter into a block's number slot). The choice is
  // stored as a companion "<field>Src" key on the block's data ('num', a
  // reporter id, or 'var:<name>'), so graphs saved before reporters
  // existed (a plain number and no Src key) keep working unchanged.
  function valueSrc(data, field) { return (data && data[field + 'Src']) || 'num'; }
  function readValue(target, data, field) {
    var src = valueSrc(data, field);
    if (src.indexOf('var:') === 0) {
      var v = findGlobalVariable(src.slice(4));
      return v ? Number(v.value) || 0 : 0;
    }
    if (src.indexOf('listlen:') === 0) {
      var lst = findGlobalList(src.slice(8));
      return (lst && Array.isArray(lst.value)) ? lst.value.length : 0;
    }
    if (src !== 'num') { var r = reporterById(src); if (r) return r.read(target); }
    return Number(data[field] || 0);
  }
  // Short display string for a value field, used in node subtitles and the
  // Mermaid diagram: the literal number (with an optional unit), the
  // reporter's label, or the variable's/list's own name.
  function valueDisplay(data, field, unit) {
    var src = valueSrc(data, field);
    if (src.indexOf('var:') === 0) return src.slice(4);
    if (src.indexOf('listlen:') === 0) return 'length of ' + src.slice(8);
    if (src !== 'num') { var r = reporterById(src); return r ? r.label : src; }
    return unit ? String(data[field]) + ' ' + unit : String(data[field]);
  }

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
  // Every sprite name except the one currently being edited - used by the
  // Selection block's "touching" dropdown, since touching yourself isn't a
  // meaningful check the way touching mouse pointer or another sprite is.
  function otherSpriteNames() {
    return getSprites()
      .filter(function (t) { return t.sprite && t.sprite.name !== FS.activeSprite; })
      .map(function (t) { return t.sprite.name; });
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
  // Resolves a sound by exact name (falling back to 1-based index, matching Scratch's own
  // number-or-name argument convention) - same lookup pyscratch.js's own findSound() already
  // uses in production, kept as an independent copy for the reason given in this file's own
  // header comment (no shared module between the two apps).
  function findSound(target, name) {
    if (!target || !target.sprite || !target.sprite.sounds) return null;
    var sounds = target.sprite.sounds;
    if (!sounds.length) return null;
    var s = sounds.filter(function (snd) { return snd.name === String(name); })[0];
    if (!s) {
      var n = parseInt(name, 10);
      if (!isNaN(n)) s = sounds[n - 1];
    }
    return s || null;
  }

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

  // ── Lists ────────────────────────────────────────────────────────────
  // Same real-Scratch-VM-variable approach as scalar variables above (see
  // that block's own comment) - a list is just a stage variable whose
  // `type` is 'list' and whose `value` is a genuine array, so it
  // serializes and shows an on-stage monitor the normal Scratch way.
  function getGlobalLists() {
    try {
      var stage = FS.vm.runtime.getTargetForStage();
      return Object.keys(stage.variables)
        .map(function (id) { return stage.variables[id]; })
        .filter(function (v) { return v.type === 'list'; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
    } catch (e) { return []; }
  }
  function findGlobalList(name) {
    var v = getGlobalLists().filter(function (v) { return v.name === name; })[0];
    return v || null;
  }
  // A list monitor is its own opcode/shape (data_listcontents, a resizable
  // box) rather than data_variable's single-line readout - otherwise the
  // same requestAddMonitor/show/hide dance as addVariableMonitor above.
  function addListMonitor(v, visible) {
    try {
      var stackedCount = FS.vm.runtime.getMonitorState().size;
      FS.vm.runtime.requestAddMonitor({
        id: v.id, mode: 'list', opcode: 'data_listcontents',
        params: { LIST: v.name }, spriteName: null, value: v.value,
        width: 100, height: 120, x: 5, y: 5 + stackedCount * 26,
        visible: visible !== false
      });
    } catch (e) {}
  }
  function setListMonitorVisible(v, visible) {
    try {
      if (!hasVariableMonitor(v.id)) { addListMonitor(v, visible); return; }
      if (visible) FS.vm.runtime.requestShowMonitor(v.id);
      else FS.vm.runtime.requestHideMonitor(v.id);
    } catch (e) {}
  }
  function createGlobalList(name) {
    name = (name || '').trim();
    if (!name) return;
    try {
      var stage = FS.vm.runtime.getTargetForStage();
      if (stage.lookupVariableByNameAndType(name, 'list')) {
        notify('A list called "' + name + '" already exists.', 'error');
        return;
      }
      var id = 'flowscratch_list_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      stage.createVariable(id, name, 'list');
      var v = stage.lookupVariableByNameAndType(name, 'list');
      if (v && !Array.isArray(v.value)) v.value = []; // defensive - scratch-vm's own Variable already defaults list values to []
      addListMonitor(v, true);
      renderSidebar();
      renderAll();
    } catch (e) {}
  }
  function deleteGlobalList(name) {
    try {
      var stage = FS.vm.runtime.getTargetForStage();
      var v = stage.lookupVariableByNameAndType(name, 'list');
      if (!v) return;
      if (!confirm('Delete the list "' + name + '"? Any blocks using it will need a different list chosen.')) return;
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
  // `nodesArr` defaults to the active editor buffer (FS.nodes) - the vast
  // majority of call sites are editor code, which only ever means "the
  // graph currently open." A background sprite's own run loop (see
  // runBackgroundFlow) passes its own captured nodes array explicitly
  // instead, so it never touches - or is disturbed by - whatever the
  // student switches to look at in the editor meanwhile.
  function getNode(id, nodesArr) { return (nodesArr || FS.nodes).find(function (n) { return n.id === id; }); }
  // A standard flowchart block has exactly one exit path; only a
  // Selection (decision) block branches, and only ever two ways (True and
  // False). Unconditional fan-out from an ordinary block is not valid
  // flowchart behaviour and was already implicitly assumed by validate(),
  // but nothing stopped the editor itself from creating it, which is what
  // let two edges quietly pile up on the same block and cross visually.
  // Enforced here instead: connecting a new wire from a non-Selection
  // block replaces its existing outgoing wire; a Selection block is
  // capped at two and a third attempt is refused with an explanation.
  function edgeBranch(edge, nodesArr, edgesArr) {
    if (!edge) return '';
    if (edge.branch === 'true' || edge.branch === 'false') return edge.branch;
    // Only reached for a graph saved before edge.branch existed - every
    // edge created since carries its own branch, so a background sprite's
    // run loop hits the fast path above without ever needing its own
    // nodes/edges arrays; they're only for this legacy fallback.
    var fromNode = getNode(edge.from, nodesArr);
    if (!fromNode || fromNode.type !== 'selection') return '';
    var siblings = (edgesArr || FS.edges).filter(function (e) { return e.from === edge.from; });
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
    // Straight by default - a new wire reads as "A connects to B" at a
    // glance; right-angle routing is opt-in per edge via the inspector for
    // the cases where a straight line would cross other blocks awkwardly.
    var edge = { id: 'e' + (++FS.edgeId), from: from, to: to, fromA: fromA || 'E', toA: toA || 'W', lineType: 'straight' };
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

  // ── Undo / redo ───────────────────────────────────────────────────────
  // The graph (nodes + edges) is snapshotted as JSON before each mutating
  // action, so Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) step back and forth
  // through recent edits. snapshotForUndo() is called from the handful of
  // mutation sites below (add/drop, delete, connect, drag, field edits);
  // any fresh action clears the redo stack.
  var undoStack = [], redoStack = [], UNDO_LIMIT = 50;
  function graphSnapshot() { return JSON.stringify({ nodes: FS.nodes, edges: FS.edges }); }
  function snapshotForUndo() {
    undoStack.push(graphSnapshot());
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack.length = 0;
  }
  function restoreGraph(snap) {
    var g = JSON.parse(snap);
    FS.nodes = g.nodes; FS.edges = g.edges;
    FS.selected = null; FS.selectedEdgeId = null;
    // Recompute the id counters so a newly added node/edge after an undo
    // never reuses a stale id and collides.
    FS.id = FS.nodes.reduce(function (m, n) { return Math.max(m, parseInt(String(n.id).slice(1), 10) || 0); }, 0);
    FS.edgeId = FS.edges.reduce(function (m, e) { return Math.max(m, parseInt(String(e.id).slice(1), 10) || 0); }, 0);
    renderAll(); saveGraph(FS.activeSprite);
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(graphSnapshot());
    restoreGraph(undoStack.pop());
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(graphSnapshot());
    restoreGraph(redoStack.pop());
  }

  // ── Mermaid diagram export ("View as diagram") ──────────────────────
  // Plain-text description of a block, for the diagram label - the actual
  // editable node markup (nodeMarkup, above) embeds live <select>/<input>
  // controls, which makes no sense as SVG text, so this is a deliberately
  // separate function rather than trying to strip HTML out of that one.
  function nodeSummaryText(n) {
    var d = n.data || {};
    if (n.type === 'wait_seconds') return 'Wait ' + valueDisplay(d, 'seconds', 'secs');
    if (n.type === 'subroutine_start') return 'Sub-routine: ' + (d.name || 'unnamed');
    if (n.type === 'call_subroutine') return 'CALL ' + (d.name || 'unnamed');
    if (n.type === 'broadcast') return 'Broadcast "' + (d.message || '') + '"';
    if (n.type === 'when_i_receive') return 'When I receive "' + (d.message || '') + '"';
    if (n.type === 'move_steps') return 'Move ' + valueDisplay(d, 'steps', 'steps');
    if (n.type === 'turn_right') return 'Turn right ' + valueDisplay(d, 'degrees', 'degrees');
    if (n.type === 'turn_left') return 'Turn left ' + valueDisplay(d, 'degrees', 'degrees');
    if (n.type === 'point_in_direction') return 'Point in direction ' + valueDisplay(d, 'degrees', 'degrees');
    if (n.type === 'point_towards') return 'Point towards ' + (d.target === 'mouse_pointer' ? 'mouse pointer' : 'random direction');
    if (n.type === 'go_to') return 'Go to ' + (d.target === 'mouse_pointer' ? 'mouse pointer' : 'random position');
    if (n.type === 'go_to_xy') return 'Go to x ' + valueDisplay(d, 'x') + ', y ' + valueDisplay(d, 'y');
    if (n.type === 'glide_to') return 'Glide ' + valueDisplay(d, 'seconds', 'secs') + ' to ' + (d.target === 'mouse_pointer' ? 'mouse pointer' : 'random position');
    if (n.type === 'glide_to_xy') return 'Glide ' + valueDisplay(d, 'seconds', 'secs') + ' to x ' + valueDisplay(d, 'x') + ', y ' + valueDisplay(d, 'y');
    if (n.type === 'change_x_by') return 'Change x by ' + valueDisplay(d, 'x');
    if (n.type === 'set_x_to') return 'Set x to ' + valueDisplay(d, 'x');
    if (n.type === 'change_y_by') return 'Change y by ' + valueDisplay(d, 'y');
    if (n.type === 'set_y_to') return 'Set y to ' + valueDisplay(d, 'y');
    if (n.type === 'if_on_edge_bounce') return 'If on edge, bounce';
    if (n.type === 'set_rotation_style') return 'Set rotation style to ' + (d.style || 'all around');
    if (n.type === 'next_costume') return 'Next costume';
    if (n.type === 'change_color') return 'Change colour by ' + valueDisplay(d, 'value');
    if (n.type === 'say') return 'Say "' + d.text + '"';
    if (n.type === 'say_for') return 'Say "' + d.text + '" for ' + valueDisplay(d, 'seconds', 'secs');
    if (n.type === 'think') return 'Think "' + d.text + '"';
    if (n.type === 'think_for') return 'Think "' + d.text + '" for ' + valueDisplay(d, 'seconds', 'secs');
    if (n.type === 'switch_costume_to') return 'Switch costume to ' + (d.costume || '...');
    if (n.type === 'change_size_by') return 'Change size by ' + valueDisplay(d, 'size');
    if (n.type === 'set_size_to') return 'Set size to ' + valueDisplay(d, 'size');
    if (n.type === 'change_effect') return 'Change ' + (d.effect || 'color') + ' effect by ' + valueDisplay(d, 'value');
    if (n.type === 'set_effect') return 'Set ' + (d.effect || 'color') + ' effect to ' + valueDisplay(d, 'value');
    if (n.type === 'clear_effects') return 'Clear graphic effects';
    if (n.type === 'show') return 'Show';
    if (n.type === 'hide') return 'Hide';
    if (n.type === 'go_to_layer') return 'Go to ' + (d.layer === 'back' ? 'back' : 'front') + ' layer';
    if (n.type === 'change_layer') return 'Go ' + (d.direction || 'forward') + ' ' + valueDisplay(d, 'layers', 'layers');
    if (n.type === 'play_sound') return 'Play sound ' + (d.sound || '...');
    if (n.type === 'play_sound_until_done') return 'Play sound ' + (d.sound || '...') + ' until done';
    if (n.type === 'stop_all_sounds') return 'Stop all sounds';
    if (n.type === 'change_volume_by') return 'Change volume by ' + valueDisplay(d, 'volume');
    if (n.type === 'set_volume_to') return 'Set volume to ' + valueDisplay(d, 'volume');
    if (n.type === 'ask') return 'Ask "' + d.text + '"';
    if (n.type === 'set_drag_mode') return 'Set drag mode ' + (d.mode === 'not_draggable' ? 'not draggable' : 'draggable');
    if (n.type === 'set_variable') return 'Set ' + (d.varName || 'variable') + ' to ' + d.value;
    if (n.type === 'change_variable') return 'Change ' + (d.varName || 'variable') + ' by ' + d.value;
    if (n.type === 'set_var_to_random') return 'Set ' + (d.varName || 'variable') + ' to random ' + d.min + '-' + d.max;
    if (n.type === 'multiply_variable') return 'Multiply ' + (d.varName || 'variable') + ' by ' + d.value;
    if (n.type === 'list_add') return 'Add "' + d.item + '" to ' + (d.listName || 'list');
    if (n.type === 'list_delete') return 'Delete item ' + d.index + ' of ' + (d.listName || 'list');
    if (n.type === 'list_delete_all') return 'Delete all of ' + (d.listName || 'list');
    if (n.type === 'list_insert') return 'Insert "' + d.item + '" at ' + d.index + ' of ' + (d.listName || 'list');
    if (n.type === 'list_replace') return 'Replace item ' + d.index + ' of ' + (d.listName || 'list') + ' with "' + d.item + '"';
    if (n.type === 'list_item_to_var') return 'Set ' + (d.varName || 'variable') + ' to item ' + d.index + ' of ' + (d.listName || 'list');
    if (n.type === 'selection') {
      var desc;
      if (d.condition === 'key') {
        var keyLabels = { Space: 'space', ArrowRight: 'right arrow', ArrowLeft: 'left arrow', ArrowUp: 'up arrow', ArrowDown: 'down arrow' };
        desc = (keyLabels[d.value] || d.value) + ' key pressed';
      } else if (d.condition === 'edge') {
        desc = d.value === 'any' ? 'touching any edge' : 'touching ' + d.value + ' edge';
      } else if (d.condition === 'answer') {
        desc = 'answer exists';
      } else if (d.condition === 'touching') {
        desc = (!d.value || d.value === 'mouse') ? 'touching mouse pointer' : 'touching ' + d.value;
      } else if (d.condition === 'mouse_down') {
        desc = 'mouse down';
      } else if (d.condition === 'variable') {
        var opSym = d.operator === 'gt' ? '>' : d.operator === 'lt' ? '<' : '=';
        desc = (d.varName || 'variable') + ' ' + opSym + ' ' + (d.varValue != null ? d.varValue : 0);
      } else if (d.condition === 'list_contains') {
        desc = (d.listName || 'list') + ' contains "' + (d.value || '') + '"';
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
      var wrap = shape === 'oval' ? ['([', '])'] : shape === 'io' ? ['[/', '/]'] : shape === 'selection' ? ['{', '}'] : shape === 'subroutine' ? ['[[', ']]'] : ['[', ']'];
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
    // CALL keeps its normal outgoing connector because that is where
    // execution returns. A dotted link also shows which separate named
    // flowchart is entered while the call is running.
    FS.nodes.filter(function (n) { return n.type === 'call_subroutine'; }).forEach(function (callNode) {
      var target = FS.nodes.find(function (n) {
        return n.type === 'subroutine_start' && String(n.data.name || '').trim() === String(callNode.data.name || '').trim();
      });
      if (!target) return;
      lines.push('  ' + idFor[callNode.id] + ' -.-> ' + idFor[target.id]);
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
  function listSelectHtml(fieldName, selectedName) {
    var lists = getGlobalLists();
    if (!lists.length) return '<select data-field="' + fieldName + '"><option value="">(no lists yet)</option></select>';
    return '<select data-field="' + fieldName + '">' + lists.map(function (l) {
      return '<option value="' + esc(l.name) + '"' + (selectedName === l.name ? ' selected' : '') + '>' + esc(l.name) + '</option>';
    }).join('') + '</select>';
  }
  function subroutineSelectHtml(fieldName, selectedName) {
    var names = FS.nodes.filter(function (n) { return n.type === 'subroutine_start'; })
      .map(function (n) { return String(n.data.name || '').trim(); })
      .filter(function (name, i, all) { return name && all.indexOf(name) === i; });
    if (selectedName && names.indexOf(selectedName) === -1) names.push(selectedName);
    if (!names.length) return '<select data-field="' + fieldName + '"><option value="">(add a sub-routine first)</option></select>';
    return '<select data-field="' + fieldName + '">' + names.map(function (name) {
      return '<option value="' + esc(name) + '"' + (selectedName === name ? ' selected' : '') + '>' + esc(name) + '</option>';
    }).join('') + '</select>';
  }
  // Costume names are per-sprite and live on the active sprite, so this is
  // built at render time from whatever costumes that sprite currently has.
  // A saved graph's costume name is kept even if it's not in the current
  // list, so a rename/removal degrades gracefully rather than dropping the
  // choice.
  function costumeSelectHtml(fieldName, selectedName) {
    var target = activeTarget();
    var costumes = (target && target.sprite && target.sprite.costumes) ? target.sprite.costumes.slice() : [];
    if (selectedName && !costumes.some(function (c) { return c.name === selectedName; })) {
      costumes.push({ name: selectedName });
    }
    if (!costumes.length) return '<select data-field="' + fieldName + '"><option value="">(no costumes)</option></select>';
    return '<select data-field="' + fieldName + '">' + costumes.map(function (c) {
      return '<option value="' + esc(c.name) + '"' + (selectedName === c.name ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('') + '</select>';
  }
  function soundSelectHtml(fieldName, selectedName) {
    var target = activeTarget();
    var sounds = (target && target.sprite && target.sprite.sounds) ? target.sprite.sounds.slice() : [];
    if (selectedName && !sounds.some(function (s) { return s.name === selectedName; })) {
      sounds.push({ name: selectedName });
    }
    if (!sounds.length) return '<select data-field="' + fieldName + '"><option value="">(no sounds)</option></select>';
    return '<select data-field="' + fieldName + '">' + sounds.map(function (s) {
      return '<option value="' + esc(s.name) + '"' + (selectedName === s.name ? ' selected' : '') + '>' + esc(s.name) + '</option>';
    }).join('') + '</select>';
  }
  function effectSelectHtml(fieldName, selected) {
    var effects = ['color', 'fisheye', 'whirl', 'pixelate', 'mosaic', 'brightness', 'ghost'];
    return '<select data-field="' + fieldName + '">' + effects.map(function (e) {
      return '<option value="' + e + '"' + (selected === e ? ' selected' : '') + '>' + e + '</option>';
    }).join('') + '</select>';
  }
  // Inline value editor, shown directly on the block instead of the right-
  // hand inspector: a number input for a literal value, or a read-only
  // label when a reporter is chosen (the source is switched in the
  // inspector). The number input is wired by the generic data-field change
  // handler in bindNodes, so no separate inspector wiring is needed.
  function inlineValueHtml(data, field) {
    var src = valueSrc(data, field);
    if (src !== 'num') {
      var label = src.indexOf('var:') === 0 ? src.slice(4)
        : src.indexOf('listlen:') === 0 ? 'length of ' + src.slice(8)
        : ((reporterById(src) || {}).label || src);
      return '<span class="fs-inline-reporter">' + esc(label) + '</span>';
    }
    return '<input type="number" class="fs-inline-num" data-field="' + field + '" value="' + esc(data[field]) + '">';
  }
  function inlineTextHtml(data, field) {
    return '<input type="text" class="fs-inline-text" data-field="' + field + '" value="' + esc(data[field]) + '" spellcheck="false">';
  }
  function nodeMarkup(n) {
    var sub = '';
    if (n.type === 'wait_seconds') sub = '<span class="fs-inline-label">wait</span>' + inlineValueHtml(n.data, 'seconds') + '<span class="fs-inline-label">secs</span>';
    if (n.type === 'subroutine_start') sub = '<input type="text" class="fs-inline-name" data-field="name" value="' + esc(n.data.name || '') + '" aria-label="Sub-routine name">';
    if (n.type === 'when_i_receive') sub = '<input type="text" class="fs-inline-name" data-field="message" value="' + esc(n.data.message || '') + '" aria-label="Message name">';
    if (n.type === 'broadcast') sub = inlineTextHtml(n.data, 'message');
    if (n.type === 'call_subroutine') sub = subroutineSelectHtml('name', n.data.name || '');
    if (n.type === 'move_steps') sub = inlineValueHtml(n.data, 'steps');
    if (n.type === 'turn_right' || n.type === 'turn_left' || n.type === 'point_in_direction') sub = inlineValueHtml(n.data, 'degrees');
    if (n.type === 'point_towards') sub = '<select data-field="target"><option value="mouse_pointer"' + (n.data.target === 'mouse_pointer' ? ' selected' : '') + '>mouse pointer</option><option value="random"' + (n.data.target === 'random' ? ' selected' : '') + '>random direction</option></select>';
    if (n.type === 'go_to') sub = '<select data-field="target"><option value="random_position"' + (n.data.target === 'random_position' ? ' selected' : '') + '>random position</option><option value="mouse_pointer"' + (n.data.target === 'mouse_pointer' ? ' selected' : '') + '>mouse pointer</option></select>';
    if (n.type === 'glide_to') sub = '<span class="fs-inline-label">secs</span>' + inlineValueHtml(n.data, 'seconds') + '<select data-field="target"><option value="random_position"' + (n.data.target === 'random_position' ? ' selected' : '') + '>random position</option><option value="mouse_pointer"' + (n.data.target === 'mouse_pointer' ? ' selected' : '') + '>mouse pointer</option></select>';
    if (n.type === 'go_to_xy') sub = '<span class="fs-inline-label">x</span>' + inlineValueHtml(n.data, 'x') + '<span class="fs-inline-label">y</span>' + inlineValueHtml(n.data, 'y');
    if (n.type === 'glide_to_xy') sub = '<span class="fs-inline-label">secs</span>' + inlineValueHtml(n.data, 'seconds') + '<span class="fs-inline-label">x</span>' + inlineValueHtml(n.data, 'x') + '<span class="fs-inline-label">y</span>' + inlineValueHtml(n.data, 'y');
    if (n.type === 'change_x_by') sub = inlineValueHtml(n.data, 'x');
    if (n.type === 'set_x_to') sub = inlineValueHtml(n.data, 'x');
    if (n.type === 'change_y_by') sub = inlineValueHtml(n.data, 'y');
    if (n.type === 'set_y_to') sub = inlineValueHtml(n.data, 'y');
    if (n.type === 'set_rotation_style') sub = '<select data-field="style"><option value="all around"' + (n.data.style === 'all around' ? ' selected' : '') + '>all around</option><option value="left-right"' + (n.data.style === 'left-right' ? ' selected' : '') + '>left-right</option><option value="don\'t rotate"' + (n.data.style === 'don\'t rotate' ? ' selected' : '') + '>don\'t rotate</option></select>';
    if (n.type === 'change_color') sub = inlineValueHtml(n.data, 'value');
    if (n.type === 'say' || n.type === 'ask') sub = inlineTextHtml(n.data, 'text');
    if (n.type === 'say_for') sub = inlineTextHtml(n.data, 'text') + '<span class="fs-inline-label">for</span>' + inlineValueHtml(n.data, 'seconds') + '<span class="fs-inline-label">secs</span>';
    if (n.type === 'think') sub = inlineTextHtml(n.data, 'text');
    if (n.type === 'think_for') sub = inlineTextHtml(n.data, 'text') + '<span class="fs-inline-label">for</span>' + inlineValueHtml(n.data, 'seconds') + '<span class="fs-inline-label">secs</span>';
    if (n.type === 'switch_costume_to') sub = costumeSelectHtml('costume', n.data.costume || '');
    if (n.type === 'change_size_by') sub = inlineValueHtml(n.data, 'size');
    if (n.type === 'set_size_to') sub = inlineValueHtml(n.data, 'size');
    if (n.type === 'change_effect') sub = effectSelectHtml('effect', n.data.effect || 'color') + inlineValueHtml(n.data, 'value');
    if (n.type === 'set_effect') sub = effectSelectHtml('effect', n.data.effect || 'color') + inlineValueHtml(n.data, 'value');
    if (n.type === 'go_to_layer') sub = '<select data-field="layer"><option value="front"' + (n.data.layer !== 'back' ? ' selected' : '') + '>front</option><option value="back"' + (n.data.layer === 'back' ? ' selected' : '') + '>back</option></select>';
    if (n.type === 'change_layer') sub = '<select data-field="direction"><option value="forward"' + (n.data.direction !== 'backward' ? ' selected' : '') + '>forward</option><option value="backward"' + (n.data.direction === 'backward' ? ' selected' : '') + '>backward</option></select><span class="fs-inline-label">layers</span>' + inlineValueHtml(n.data, 'layers');
    if (n.type === 'set_drag_mode') sub = '<select data-field="mode"><option value="draggable"' + (n.data.mode !== 'not_draggable' ? ' selected' : '') + '>draggable</option><option value="not_draggable"' + (n.data.mode === 'not_draggable' ? ' selected' : '') + '>not draggable</option></select>';
    if (n.type === 'play_sound' || n.type === 'play_sound_until_done') sub = soundSelectHtml('sound', n.data.sound || '');
    if (n.type === 'change_volume_by') sub = inlineValueHtml(n.data, 'volume');
    if (n.type === 'set_volume_to') sub = inlineValueHtml(n.data, 'volume');
    if (n.type === 'set_variable' || n.type === 'change_variable') {
      sub = variableSelectHtml('varName', n.data.varName) + inlineValueHtml(n.data, 'value');
    }
    if (n.type === 'set_var_to_random') {
      sub = variableSelectHtml('varName', n.data.varName) + '<span class="fs-inline-label">random</span>' + inlineValueHtml(n.data, 'min') + '<span class="fs-inline-label">to</span>' + inlineValueHtml(n.data, 'max');
    }
    if (n.type === 'multiply_variable') {
      sub = variableSelectHtml('varName', n.data.varName) + '<span class="fs-inline-label">&times;</span>' + inlineValueHtml(n.data, 'value');
    }
    if (n.type === 'list_add') sub = inlineTextHtml(n.data, 'item') + '<span class="fs-inline-label">to</span>' + listSelectHtml('listName', n.data.listName);
    if (n.type === 'list_delete') sub = '<span class="fs-inline-label">item</span>' + inlineValueHtml(n.data, 'index') + '<span class="fs-inline-label">of</span>' + listSelectHtml('listName', n.data.listName);
    if (n.type === 'list_delete_all') sub = listSelectHtml('listName', n.data.listName);
    if (n.type === 'list_insert') sub = inlineTextHtml(n.data, 'item') + '<span class="fs-inline-label">at</span>' + inlineValueHtml(n.data, 'index') + '<span class="fs-inline-label">of</span>' + listSelectHtml('listName', n.data.listName);
    if (n.type === 'list_replace') sub = '<span class="fs-inline-label">item</span>' + inlineValueHtml(n.data, 'index') + '<span class="fs-inline-label">of</span>' + listSelectHtml('listName', n.data.listName) + '<span class="fs-inline-label">with</span>' + inlineTextHtml(n.data, 'item');
    if (n.type === 'list_item_to_var') sub = variableSelectHtml('varName', n.data.varName) + '<span class="fs-inline-label">to item</span>' + inlineValueHtml(n.data, 'index') + '<span class="fs-inline-label">of</span>' + listSelectHtml('listName', n.data.listName);
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
      } else if (condition === 'touching') {
        tail = '<select data-field="value"><option value="mouse"' + (n.data.value === 'mouse' || !n.data.value ? ' selected' : '') + '>mouse pointer</option>' +
          otherSpriteNames().map(function (name) {
            return '<option value="' + esc(name) + '"' + (n.data.value === name ? ' selected' : '') + '>' + esc(name) + '</option>';
          }).join('') + '</select>';
      } else if (condition === 'mouse_down') {
        tail = '';
      } else if (condition === 'list_contains') {
        tail = listSelectHtml('listName', n.data.listName) + inlineTextHtml(n.data, 'value');
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
        '<select data-field="condition"><option value="key"' + (condition === 'key' ? ' selected' : '') + '>key pressed</option><option value="edge"' + (condition === 'edge' ? ' selected' : '') + '>touching edge</option><option value="touching"' + (condition === 'touching' ? ' selected' : '') + '>touching</option><option value="mouse_down"' + (condition === 'mouse_down' ? ' selected' : '') + '>mouse down</option><option value="answer"' + (condition === 'answer' ? ' selected' : '') + '>answer exists</option><option value="variable"' + (condition === 'variable' ? ' selected' : '') + '>variable</option><option value="list_contains"' + (condition === 'list_contains' ? ' selected' : '') + '>list contains</option></select>' +
        tail + '</div>';
    } else {
      content = '<div class="fs-node-title">' + typeTitle(n) + '</div>' + sub;
    }
    var catColor = (TYPES[n.type] && CATEGORIES[TYPES[n.type].category]) ? CATEGORIES[TYPES[n.type].category].color : '#4d515a';
    return '<div class="fs-node ' + n.shape + (FS.selected === n.id ? ' selected' : '') + '" data-id="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px;--fs-cat-color:' + catColor + '"><div class="fs-node-body">' + content + '</div></div>';
  }

  function renderAll() { els.nodes.innerHTML = FS.nodes.map(nodeMarkup).join(''); bindNodes(); renderWires(); renderInspector(); updateFsTutorialChecklist(); }

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
        FS.drag = { kind: 'node', id: n.id, startX: e.clientX, startY: e.clientY, x: n.x, y: n.y, moved: false };
        try { el.setPointerCapture(e.pointerId); } catch (_err) {}
      });
      el.addEventListener('click', function (e) { if (!e.target.matches('select,input')) select(el.dataset.id); });
      Array.prototype.forEach.call(el.querySelectorAll('[data-field]'), function (c) {
        c.addEventListener('change', function (e) {
          var n = getNode(el.dataset.id), field = e.target.dataset.field;
          var oldValue = n.data[field];
          snapshotForUndo();
          n.data[field] = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
          if (n.type === 'subroutine_start' && field === 'name' && oldValue !== n.data.name) {
            FS.nodes.forEach(function (other) {
              if (other.type === 'call_subroutine' && other.data.name === oldValue) other.data.name = n.data.name;
            });
          }
          if (field === 'condition') {
            if (e.target.value === 'variable') {
              var firstVar = getGlobalVariables()[0];
              n.data.varName = firstVar ? firstVar.name : '';
              n.data.operator = n.data.operator || 'eq';
              n.data.varValue = n.data.varValue != null ? n.data.varValue : 0;
            } else if (e.target.value === 'touching') {
              n.data.value = 'mouse';
            } else if (e.target.value === 'mouse_down') {
              n.data.value = '';
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
  // The rotated square inside .fs-node.selection .fs-node-body (CSS below) - kept as a named
  // constant, not just a CSS number, because the diamond hitbox math a few lines down derives
  // its true on-screen shape from this value. Change the CSS width/height together with this.
  var SELECTION_BODY_SIZE = 96;
  // Nearest point on a node's own VISUAL perimeter to a local point (px, py) - used both for
  // the live hover-anchor and for picking a sensible anchor point automatically (connecting
  // to a node by dropping near it, or splicing a node into an existing wire). This used to
  // always treat the node as a plain w x h rectangle, which is exactly right for
  // process/io/subroutine but wrong for oval and selection: their visible border is a
  // curve/diamond genuinely inset from (oval) or overflowing (selection - the rotated square
  // is taller than its own 150x112 box, see the CSS) the rectangle nodeDims() measures, so
  // the old rectangle-only math put the connectable hitbox visibly outside the drawn border
  // in the corners (oval) or short of the drawn tip (selection, top/bottom). Both branches
  // below use the same idea: project outward from the shape's centre, along the direction of
  // (px, py), until hitting that shape's own true boundary - the standard technique for
  // snapping a connector to a convex shape's edge.
  function nearestPerimeterPoint(n, px, py) {
    var d = nodeDims(n), w = d.w, h = d.h;
    var cx = w / 2, cy = h / 2, dx = px - cx, dy = py - cy;
    if (n.shape === 'oval') {
      if (!dx && !dy) return { x: w, y: cy }; // exact centre has no defined direction - default to due east
      var a = w / 2, b = h / 2;
      var ot = 1 / Math.sqrt((dx / a) * (dx / a) + (dy / b) * (dy / b));
      return { x: cx + dx * ot, y: cy + dy * ot };
    }
    if (n.shape === 'selection') {
      if (!dx && !dy) return { x: w, y: cy };
      // Rotating a square 45 degrees turns it into a diamond whose vertices sit on the axes
      // at the square's own half-diagonal (side / sqrt(2)) from centre - independent of the
      // outer 150x112 box's own w/h, which is why this doesn't use nodeDims() here at all.
      var half = SELECTION_BODY_SIZE / Math.SQRT2;
      var manhattan = Math.abs(dx) + Math.abs(dy);
      var st = half / manhattan;
      return { x: cx + dx * st, y: cy + dy * st };
    }
    // Rectangle (process, io, subroutine, and anything else): clamp inside the box, then
    // project to whichever edge is nearest.
    var ccx = Math.max(0, Math.min(w, px)), ccy = Math.max(0, Math.min(h, py));
    if (px > 0 && px < w && py > 0 && py < h) {
      var dl = px, dr = w - px, dt = py, db = h - py, m = Math.min(dl, dr, dt, db);
      if (m === dl) return { x: 0, y: ccy };
      if (m === dr) return { x: w, y: ccy };
      if (m === dt) return { x: ccx, y: 0 };
      return { x: ccx, y: h };
    }
    return { x: ccx, y: ccy };
  }
  function anchorPointOnNode(n, towardWorldX, towardWorldY) {
    return nearestPerimeterPoint(n, towardWorldX - n.x, towardWorldY - n.y);
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
  // Same idea as setActiveNode, for the outgoing wire: toggles the
  // 'active' class on the existing <path>, it does not rebuild the SVG.
  // Used every step during a run instead of calling the full renderWires()
  // (which recomputes every edge's route and rebuilds the whole wire
  // layer's innerHTML, including reattaching a click listener to every
  // wire) - the graph's edges don't change while a flowchart is actually
  // running, only which one is lit up, so a full rebuild every single
  // step was by far the biggest cost in the run loop (measured live: over
  // two thirds of total run time), not the step-pacing delay it was
  // originally mistaken for.
  function setActiveWire(edgeId) {
    if (!els.wireLayer) return;
    var current = els.wireLayer.querySelector('.fs-wire.active');
    if (current) current.classList.remove('active');
    if (edgeId) {
      var g = els.wireLayer.querySelector('g[data-edge="' + edgeId + '"]');
      var wire = g && g.querySelector('.fs-wire');
      if (wire) wire.classList.add('active');
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
    if (n.type === 'move_steps') f = sourceField('Distance (steps)', 'steps', n.data);
    if (n.type === 'turn_right' || n.type === 'turn_left' || n.type === 'point_in_direction') f = sourceField('Degrees', 'degrees', n.data);
    if (n.type === 'change_x_by') f = sourceField('Change x by', 'x', n.data);
    if (n.type === 'set_x_to') f = sourceField('Set x to', 'x', n.data);
    if (n.type === 'change_y_by') f = sourceField('Change y by', 'y', n.data);
    if (n.type === 'set_y_to') f = sourceField('Set y to', 'y', n.data);
    if (n.type === 'go_to_xy') f = sourceField('X', 'x', n.data) + sourceField('Y', 'y', n.data);
    if (n.type === 'glide_to_xy') f = sourceField('Seconds', 'seconds', n.data) + sourceField('X', 'x', n.data) + sourceField('Y', 'y', n.data);
    if (n.type === 'glide_to') f = sourceField('Seconds', 'seconds', n.data) + '<p class="fs-empty">Choose the destination with the dropdown inside this block.</p>';
    if (n.type === 'change_color') f = sourceField('Change by', 'value', n.data);
    if (n.type === 'change_size_by') f = sourceField('Change size by', 'size', n.data);
    if (n.type === 'set_size_to') f = sourceField('Set size to', 'size', n.data);
    if (n.type === 'change_effect') f = sourceField('Change by', 'value', n.data) + '<p class="fs-empty">Choose the effect with the dropdown inside this block.</p>';
    if (n.type === 'set_effect') f = sourceField('Set to', 'value', n.data) + '<p class="fs-empty">Choose the effect with the dropdown inside this block.</p>';
    if (n.type === 'change_layer') f = sourceField('Layers', 'layers', n.data) + '<p class="fs-empty">Choose forward or backward with the dropdown inside this block.</p>';
    if (n.type === 'say_for' || n.type === 'think_for') f = sourceField('Seconds', 'seconds', n.data);
    if (n.type === 'wait_seconds') f = sourceField('Seconds', 'seconds', n.data);
    if (n.type === 'subroutine_start') f = '<p class="fs-empty">Give this sub-routine a unique name inside the block.</p>';
    if (n.type === 'call_subroutine') f = '<p class="fs-empty">Choose the named sub-routine to run inside the block.</p>';
    if (n.type === 'broadcast' || n.type === 'when_i_receive') f = '<p class="fs-empty">Type the message name inside the block - any "When I receive" block (on any sprite) with the same exact name will run when this fires.</p>';
    if (n.type === 'point_towards' || n.type === 'go_to' || n.type === 'set_rotation_style' || n.type === 'switch_costume_to' || n.type === 'go_to_layer' || n.type === 'set_drag_mode' || n.type === 'play_sound' || n.type === 'play_sound_until_done' ||
        n.type === 'list_add' || n.type === 'list_delete' || n.type === 'list_delete_all' || n.type === 'list_insert' || n.type === 'list_replace' || n.type === 'list_item_to_var') f = '<p class="fs-empty">Use the fields inside this block.</p>';
    // set_variable/change_variable's own value field can source a
    // reporter/variable/list-length too - e.g. "Set count to length of
    // points" - the same sourceField() every other numeric field already
    // gets, not the generic "use the fields inside this block" placeholder.
    if (n.type === 'set_variable' || n.type === 'change_variable') f = sourceField('Value', 'value', n.data);
    if (n.type === 'set_var_to_random') f = sourceField('Min', 'min', n.data) + sourceField('Max', 'max', n.data);
    if (n.type === 'multiply_variable') f = sourceField('Multiply by', 'value', n.data);
    if (n.type === 'change_volume_by') f = sourceField('Change volume by', 'volume', n.data);
    if (n.type === 'set_volume_to') f = sourceField('Set volume to', 'volume', n.data);
    if (n.type === 'selection') f = '<p class="fs-empty">Use the dropdowns inside this block. Select either outgoing connector to set it as True or False.</p>';
    host.innerHTML = '<b>' + typeTitle(n) + '</b>' + f + '<button class="fs-danger" id="fsDeleteNode">Delete block</button>';
    Array.prototype.forEach.call(host.querySelectorAll('[data-inspect-src]'), function (s) {
      s.addEventListener('change', function () {
        var key = s.dataset.inspectSrc;
        if (s.value === 'num') delete n.data[key + 'Src'];
        else n.data[key + 'Src'] = s.value;
        renderAll(); select(n.id); saveGraph(FS.activeSprite);
      });
    });
    var del = host.querySelector('#fsDeleteNode');
    if (del) del.onclick = removeSelected;
  }
  // A value field's source: literal number (typed on the block itself),
  // one of the reporters (REPORTERS), or a variable's own live value -
  // the flowchart equivalent of dropping a round variable reporter into a
  // Scratch block's number slot (e.g. "Change y by (vy)" for gravity, or
  // "Change x by (vx)" for a bouncing ball). The dropdown sets a
  // companion "<key>Src" field; the number itself is edited inline on the
  // block, and stays there unused (but harmless) while a reporter/variable
  // source is selected.
  function sourceField(label, key, data) {
    var src = valueSrc(data, key);
    var vars = getGlobalVariables();
    var lists = getGlobalLists();
    return '<div class="fs-field"><label>' + label + '</label>' +
      '<select data-inspect-src="' + key + '">' +
        '<option value="num"' + (src === 'num' ? ' selected' : '') + '>number</option>' +
        REPORTERS.map(function (r) { return '<option value="' + r.id + '"' + (src === r.id ? ' selected' : '') + '>' + esc(r.label) + '</option>'; }).join('') +
        (vars.length
          ? '<optgroup label="Variables">' + vars.map(function (v) {
              var srcId = 'var:' + v.name;
              return '<option value="' + esc(srcId) + '"' + (src === srcId ? ' selected' : '') + '>' + esc(v.name) + '</option>';
            }).join('') + '</optgroup>'
          : '') +
        (lists.length
          ? '<optgroup label="List lengths">' + lists.map(function (l) {
              var srcId = 'listlen:' + l.name;
              return '<option value="' + esc(srcId) + '"' + (src === srcId ? ' selected' : '') + '>length of ' + esc(l.name) + '</option>';
            }).join('') + '</optgroup>'
          : '') +
      '</select></div>';
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
      snapshotForUndo();
      FS.edges = FS.edges.filter(function (e) { return e.id !== edge.id; });
      FS.selectedEdgeId = null; renderAll(); saveGraph(FS.activeSprite);
    };
  }
  function deleteNode(id, skipSnapshot) {
    if (!id) return;
    if (!skipSnapshot) snapshotForUndo();
    FS.nodes = FS.nodes.filter(function (n) { return n.id !== id; });
    FS.edges = FS.edges.filter(function (e) { return e.from !== id && e.to !== id; });
    if (FS.selected === id) FS.selected = null;
    renderAll(); saveGraph(FS.activeSprite);
  }
  function removeSelected() {
    if (!FS.selected) return;
    deleteNode(FS.selected);
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
    var routineStarts = FS.nodes.filter(function (n) { return n.type === 'subroutine_start'; });
    var ends = FS.nodes.filter(function (n) { return n.type === 'end'; });
    if (starts.length !== 1) errors.push('Flow needs exactly one Start block (found ' + starts.length + ').');
    var out = function (id) { return FS.edges.filter(function (e) { return e.from === id; }).map(function (e) { return e.to; }); };
    var inc = function (id) { return FS.edges.filter(function (e) { return e.to === id; }).map(function (e) { return e.from; }); };
    function reachableFrom(startId) {
      var seen = {};
      (function walk(id) { if (seen[id]) return; seen[id] = true; out(id).forEach(walk); })(startId);
      return seen;
    }
    // A flowchart doesn't have to end: a "forever" loop (a game's main
    // loop, say) is just a wire connected back to an earlier block, a
    // cycle, with no End block at all, same as Scratch's own forever
    // block never finishes on its own either. So an End block is only
    // required when there's no loop to keep the flow running instead.
    var mainSeen = starts.length === 1 ? reachableFrom(starts[0].id) : {};
    var mainHasEnd = ends.some(function (n) { return mainSeen[n.id]; });
    if (starts.length === 1 && !mainHasEnd && !hasCycleFrom(starts[0].id, out)) {
      errors.push('Flow needs an End block, or a connection looping back to an earlier block to keep it running.');
    }
    var routineNames = {};
    routineStarts.forEach(function (n) {
      var name = String(n.data.name || '').trim();
      if (!name) errors.push('Each sub-routine needs a name.');
      else if (routineNames[name]) errors.push('Each sub-routine needs a unique name. "' + name + '" is used more than once.');
      else routineNames[name] = n;
      if (inc(n.id).length) errors.push('Sub-routine "' + (name || 'unnamed') + '" must begin at its own Start block, with no incoming connector.');
      var routineSeen = reachableFrom(n.id);
      if (!ends.some(function (endNode) { return routineSeen[endNode.id]; })) {
        errors.push('Sub-routine "' + (name || 'unnamed') + '" needs a path to an End block so it can return after CALL.');
      }
    });
    FS.nodes.forEach(function (n) {
      if (n.type !== 'end' && !out(n.id).length) errors.push(typeTitle(n) + ' has no outgoing connection.');
      if (n.type !== 'start' && n.type !== 'subroutine_start' && n.type !== 'when_i_receive' && !inc(n.id).length) errors.push(typeTitle(n) + ' has no incoming connection.');
      if (n.type === 'selection' && out(n.id).length !== 2) errors.push('Each Selection must have exactly two outgoing connections, one True and one False.');
      // addEdge() already refuses to create this, but defends here too in
      // case a graph saved before that enforcement existed gets loaded:
      // Run must never execute a flowchart with an ambiguous branch.
      if (n.type !== 'selection' && n.type !== 'end' && out(n.id).length > 1) errors.push(typeTitle(n) + ' has more than one outgoing connection, only a Selection block can branch.');
      if ((n.type === 'set_variable' || n.type === 'change_variable' || n.type === 'set_var_to_random' || n.type === 'multiply_variable') && !n.data.varName) errors.push(typeTitle(n) + ' has no variable selected.');
      if (n.type === 'selection' && n.data.condition === 'variable' && !n.data.varName) errors.push('Selection has no variable selected.');
      if (n.type === 'selection' && n.data.condition === 'list_contains' && !n.data.listName) errors.push('Selection has no list selected.');
      if (n.type === 'when_i_receive') {
        if (!String(n.data.message || '').trim()) errors.push('A "When I receive" block needs a message name.');
        if (inc(n.id).length) errors.push('"When I receive" must have no incoming connector - it starts its own script, the same way Start does.');
      }
      if (n.type === 'broadcast' && !String(n.data.message || '').trim()) errors.push('A Broadcast block needs a message name.');
      if (n.type === 'call_subroutine') {
        var callName = String(n.data.name || '').trim();
        if (!callName) errors.push('Each CALL block must name a sub-routine.');
        else if (!routineNames[callName]) errors.push('CALL ' + callName + ' cannot run because that sub-routine has not been created.');
      }
    });
    // "When I receive" blocks are their own script roots, same idea as a
    // sub-routine Start - reachable from a broadcast, not from Main, so
    // they need to count as valid roots here too or every node downstream
    // of one gets wrongly flagged as unreachable.
    var receiveStarts = FS.nodes.filter(function (n) { return n.type === 'when_i_receive'; });
    if (starts.length === 1 || routineStarts.length || receiveStarts.length) {
      var seen = {};
      [starts[0]].concat(routineStarts).concat(receiveStarts).filter(Boolean).forEach(function (root) {
        var rootSeen = reachableFrom(root.id);
        Object.keys(rootSeen).forEach(function (id) { seen[id] = true; });
      });
      FS.nodes.forEach(function (n) { if (!seen[n.id]) errors.push(typeTitle(n) + ' is not reachable from Main, a sub-routine Start, or a "When I receive" block.'); });
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
  // moment), ask (genuinely waits on the student), the glide blocks
  // (which animate over time), and wait_seconds (a deliberate, student-
  // placed pause - the general-purpose Control block, distinct from the
  // pacing delay below). Pacing between steps is handled centrally in
  // run(), not per-block, so slow mode can control it uniformly instead
  // of fighting a per-block wait baked in here.
  function randomStagePosition() {
    return { x: (Math.random() - 0.5) * (STAGE_HALF_W * 2), y: (Math.random() - 0.5) * (STAGE_HALF_H * 2) };
  }
  function resolvePositionTarget(value) {
    if (value === 'mouse_pointer') return { x: FS.mouse.x, y: FS.mouse.y };
    return randomStagePosition();
  }
  // Glide: move the sprite in a straight line from where it is to (ex, ey)
  // over `seconds` real seconds, linear interpolation, no easing (matching
  // Scratch's own glide). Returns a promise the run loop awaits, so slow
  // mode's per-step pacing delay still applies after the glide, not instead
  // of it. Checks FS.running each frame so hitting TurboWarp's stop button
  // mid-glide aborts the rest of the animation instead of coasting on.
  function glideTo(target, ex, ey, seconds) {
    var ms = (seconds == null ? 1 : Number(seconds) || 0) * 1000;
    var sx = target.x, sy = target.y;
    var start = Date.now();
    return (function tick() {
      if (!FS.running) return Promise.resolve();
      var elapsed = Date.now() - start;
      if (elapsed >= ms) { target.setXY(ex, ey); return Promise.resolve(); }
      var p = elapsed / ms;
      target.setXY(sx + (ex - sx) * p, sy + (ey - sy) * p);
      return wait(1000 / 60).then(tick);
    })();
  }
  function normalizeRotationStyle(style) {
    var s = String(style || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
    if (s === 'left right' || s === 'leftright') return 'left-right';
    if (s === 'do not rotate' || s === "don't rotate" || s === 'dont rotate' || s === 'none') return "don't rotate";
    return 'all around';
  }
  // "If on edge, bounce": if the sprite's centre has crossed a stage edge
  // while moving further out, reflect its direction across that axis
  // (horizontal bounce flips the direction sign, vertical bounce mirrors
  // around 90), the same centre-based test the Selection block's "touching
  // edge" condition already uses, so the two stay consistent.
  function bounceOffEdges(target) {
    var dir = target.direction;
    var vx = Math.sin(dir * Math.PI / 180);
    var vy = Math.cos(dir * Math.PI / 180);
    if ((target.x <= -STAGE_HALF_W && vx < 0) || (target.x >= STAGE_HALF_W && vx > 0)) dir = -dir;
    if ((target.y >= STAGE_HALF_H && vy > 0) || (target.y <= -STAGE_HALF_H && vy < 0)) dir = 180 - dir;
    target.setDirection(dir);
  }
  // Show a say/think bubble for `ms` milliseconds, then clear it. Returns
  // a promise the run loop awaits, same as say/ask, so the flow pauses
  // while the bubble is visible.
  function bubbleFor(target, text, type, ms) {
    try { target.runtime.emit('SAY', target, type, text == null ? '' : String(text)); } catch (e) {}
    return wait(ms).then(function () {
      try { target.runtime.emit('SAY', target, type, ''); } catch (e) {}
    });
  }
  // targetOverride lets a background sprite's own run loop (see
  // runBackgroundFlow) drive ITS target directly, instead of whatever
  // sprite happens to be open in the editor (activeTarget()) - the active
  // sprite's own run() still calls this with no override, unchanged.
  function runBlock(n, targetOverride) {
    var target = targetOverride || activeTarget();
    if (n.type === 'set_variable' || n.type === 'change_variable') {
      var v = findGlobalVariable(n.data.varName);
      if (v) {
        if (n.type === 'set_variable') v.value = readValue(target, n.data, 'value');
        else v.value = (Number(v.value) || 0) + readValue(target, n.data, 'value');
      }
      return;
    }
    if (n.type === 'set_var_to_random') {
      var vr = findGlobalVariable(n.data.varName);
      if (vr) {
        var lo = Math.round(readValue(target, n.data, 'min')), hi = Math.round(readValue(target, n.data, 'max'));
        if (lo > hi) { var tmp = lo; lo = hi; hi = tmp; }
        vr.value = lo + Math.floor(Math.random() * (hi - lo + 1));
      }
      return;
    }
    // The one thing change_variable (add-only) can't express: flipping a
    // velocity's sign on a bounce (vx = vx * -1) - the standard technique
    // Pong/Breakout-style games need for wall bounces, since there's no
    // "if on edge, bounce" equivalent for a single axis with a custom
    // touch condition.
    if (n.type === 'multiply_variable') {
      var vmul = findGlobalVariable(n.data.varName);
      if (vmul) vmul.value = (Number(vmul.value) || 0) * readValue(target, n.data, 'value');
      return;
    }
    // Lists, like variables above, are stage-level state - no sprite
    // target needed, so these are handled here too, before the `!target`
    // guard that every other (sprite-driving) block case needs.
    if (n.type === 'list_add' || n.type === 'list_delete' || n.type === 'list_delete_all' ||
        n.type === 'list_insert' || n.type === 'list_replace' || n.type === 'list_item_to_var') {
      var list = findGlobalList(n.data.listName);
      if (list && Array.isArray(list.value)) {
        if (n.type === 'list_add') list.value.push(n.data.item != null ? String(n.data.item) : '');
        else if (n.type === 'list_delete_all') list.value.length = 0;
        else if (n.type === 'list_delete') {
          var delIdx = Math.round(readValue(target, n.data, 'index')) - 1;
          if (delIdx >= 0 && delIdx < list.value.length) list.value.splice(delIdx, 1);
        } else if (n.type === 'list_insert') {
          var insIdx = Math.max(0, Math.min(list.value.length, Math.round(readValue(target, n.data, 'index')) - 1));
          list.value.splice(insIdx, 0, n.data.item != null ? String(n.data.item) : '');
        } else if (n.type === 'list_replace') {
          var repIdx = Math.round(readValue(target, n.data, 'index')) - 1;
          if (repIdx >= 0 && repIdx < list.value.length) list.value[repIdx] = n.data.item != null ? String(n.data.item) : '';
        } else if (n.type === 'list_item_to_var') {
          var destVar = findGlobalVariable(n.data.varName);
          var itemIdx = Math.round(readValue(target, n.data, 'index')) - 1;
          if (destVar) destVar.value = (itemIdx >= 0 && itemIdx < list.value.length) ? list.value[itemIdx] : '';
        }
      }
      return;
    }
    // Broadcasting, like variables/lists above, is a stage-wide effect -
    // no sprite target of its own needed. Reaches every sprite's "When I
    // receive" handlers, including this one's, via fireBroadcast (see its
    // own comment for the active/background split).
    if (n.type === 'broadcast') { fireBroadcast(n.data.message); return; }
    if (!target) return;
    switch (n.type) {
      case 'move_steps': {
        var rad = d2r(target.direction);
        var dist = readValue(target, n.data, 'steps');
        target.setXY(target.x + dist * Math.cos(rad), target.y + dist * Math.sin(rad));
        return;
      }
      case 'turn_right':
        target.setDirection(target.direction + readValue(target, n.data, 'degrees'));
        return;
      case 'turn_left':
        target.setDirection(target.direction - readValue(target, n.data, 'degrees'));
        return;
      case 'point_in_direction':
        target.setDirection(readValue(target, n.data, 'degrees'));
        return;
      case 'point_towards':
        if (n.data.target === 'random') {
          target.setDirection((Math.random() * 360) - 180);
        } else {
          var dx = FS.mouse.x - target.x, dy = FS.mouse.y - target.y;
          target.setDirection(90 - Math.atan2(dy, dx) * 180 / Math.PI);
        }
        return;
      case 'go_to': {
        var pos = resolvePositionTarget(n.data.target);
        target.setXY(pos.x, pos.y);
        return;
      }
      case 'go_to_xy':
        target.setXY(readValue(target, n.data, 'x'), readValue(target, n.data, 'y'));
        return;
      case 'glide_to': {
        var gpos = resolvePositionTarget(n.data.target);
        return glideTo(target, gpos.x, gpos.y, readValue(target, n.data, 'seconds'));
      }
      case 'glide_to_xy':
        return glideTo(target, readValue(target, n.data, 'x'), readValue(target, n.data, 'y'), readValue(target, n.data, 'seconds'));
      case 'change_x_by':
        target.setXY(target.x + readValue(target, n.data, 'x'), target.y);
        return;
      case 'set_x_to':
        target.setXY(readValue(target, n.data, 'x'), target.y);
        return;
      case 'change_y_by':
        target.setXY(target.x, target.y + readValue(target, n.data, 'y'));
        return;
      case 'set_y_to':
        target.setXY(target.x, readValue(target, n.data, 'y'));
        return;
      case 'if_on_edge_bounce':
        bounceOffEdges(target);
        return;
      case 'set_rotation_style': {
        var style = normalizeRotationStyle(n.data.style);
        try {
          if (typeof target.setRotationStyle === 'function') target.setRotationStyle(style);
          else target.rotationStyle = style;
        } catch (e) {}
        try { target.setDirection(target.direction); } catch (e) {}
        try { target.runtime.emit('TARGET_INFO_CHANGED', target); } catch (e) {}
        return;
      }
      case 'next_costume':
        try { target.setCostume((target.currentCostume + 1) % target.sprite.costumes.length); } catch (e) {}
        return;
      case 'change_color':
        try { target.changeEffect('color', readValue(target, n.data, 'value')); } catch (e) {
          try {
            var cur = (target.effects && target.effects.color) || 0;
            target.setEffect('color', cur + readValue(target, n.data, 'value'));
          } catch (e2) {}
        }
        return;
      case 'say':
        return bubbleFor(target, n.data.text, 'say', 850);
      case 'say_for':
        return bubbleFor(target, n.data.text, 'say', Math.max(0, readValue(target, n.data, 'seconds')) * 1000);
      case 'think':
        return bubbleFor(target, n.data.text, 'think', 850);
      case 'think_for':
        return bubbleFor(target, n.data.text, 'think', Math.max(0, readValue(target, n.data, 'seconds')) * 1000);
      case 'switch_costume_to': {
        var cname = String(n.data.costume || '');
        if (cname) {
          try {
            var idx = target.sprite.costumes.findIndex(function (c) { return c.name === cname; });
            if (idx >= 0) target.setCostume(idx);
          } catch (e) {}
        }
        return;
      }
      case 'change_size_by':
        try { target.setSize(target.size + readValue(target, n.data, 'size')); } catch (e) {}
        return;
      case 'set_size_to':
        try { target.setSize(readValue(target, n.data, 'size')); } catch (e) {}
        return;
      case 'change_effect':
        try { target.changeEffect(n.data.effect || 'color', readValue(target, n.data, 'value')); } catch (e) {
          try {
            var cce = (target.effects && target.effects[n.data.effect]) || 0;
            target.setEffect(n.data.effect || 'color', cce + readValue(target, n.data, 'value'));
          } catch (e2) {}
        }
        return;
      case 'set_effect':
        try { target.setEffect(n.data.effect || 'color', readValue(target, n.data, 'value')); } catch (e) {
          try { if (target.effects) target.effects[n.data.effect || 'color'] = readValue(target, n.data, 'value'); } catch (e2) {}
        }
        return;
      case 'clear_effects':
        try { target.clearEffects(); } catch (e) {}
        return;
      case 'show':
        try { target.setVisible(true); } catch (e) {}
        return;
      case 'hide':
        try { target.setVisible(false); } catch (e) {}
        return;
      case 'go_to_layer':
        try { if (n.data.layer === 'back') target.goToBack(); else target.goToFront(); } catch (e) {}
        return;
      case 'change_layer':
        try {
          if (n.data.direction === 'backward') target.goBackwardLayers(Math.max(0, readValue(target, n.data, 'layers')));
          else target.goForwardLayers(Math.max(0, readValue(target, n.data, 'layers')));
        } catch (e) {}
        return;
      case 'set_drag_mode':
        try {
          if (typeof target.setDraggable === 'function') target.setDraggable(n.data.mode !== 'not_draggable');
          else target.draggable = (n.data.mode !== 'not_draggable');
        } catch (e) {}
        return;
      // ── Sound (same target.sprite.soundBank / target.setVolume calls pyscratch.js's own
      // production-proven findSound()/play/volume handling already uses - see this file's
      // header comment on why that's a small independent copy, not a shared import) ──
      case 'play_sound': {
        var playSnd = findSound(target, n.data.sound);
        if (playSnd) { try { target.sprite.soundBank.playSound(target, playSnd.soundId); } catch (e) {} }
        return; // non-blocking, matches Scratch's own "play sound" (not "...until done")
      }
      case 'play_sound_until_done': {
        var waitSnd = findSound(target, n.data.sound);
        if (waitSnd) {
          try {
            var soundPromise = target.sprite.soundBank.playSound(target, waitSnd.soundId);
            if (soundPromise && typeof soundPromise.then === 'function') return soundPromise;
          } catch (e) {}
        }
        return;
      }
      case 'stop_all_sounds':
        try { target.sprite.soundBank.stopAllSounds(); } catch (e) {
          try { FS.vm.runtime.audioEngine.stopAll(); } catch (e2) {}
        }
        return;
      case 'change_volume_by':
        try {
          // Scratch's own default volume is 100, not 0 - a straight `|| 100` (the pattern
          // pyscratch.js's own change_volume uses) would misfire if a student had genuinely
          // set volume to exactly 0 already, silently jumping it back to 100 instead of
          // changing from 0. An explicit undefined check avoids that.
          var curVol = target.volume !== undefined ? target.volume : 100;
          target.setVolume(Math.max(0, Math.min(100, curVol + readValue(target, n.data, 'volume'))));
        } catch (e) {}
        return;
      case 'set_volume_to':
        try { target.setVolume(Math.max(0, Math.min(100, readValue(target, n.data, 'volume')))); } catch (e) {}
        return;
      case 'wait_seconds':
        return wait(Math.max(0, readValue(target, n.data, 'seconds')) * 1000);
      case 'ask':
        return showAskBox(n.data.text).then(function (answer) {
          FS.answer = answer || '';
          els.answerValue.textContent = FS.answer || String.fromCharCode(8709);
        });
      default:
        return;
    }
  }
  function evaluateCondition(n, targetOverride) {
    var target = targetOverride || activeTarget();
    var v = false;
    if (n.data.condition === 'key') v = !!FS.pressedKeys[n.data.value];
    else if (n.data.condition === 'edge' && target) {
      var edges = {
        left: target.x <= -STAGE_HALF_W, right: target.x >= STAGE_HALF_W,
        top: target.y >= STAGE_HALF_H, bottom: target.y <= -STAGE_HALF_H
      };
      v = n.data.value === 'any' ? (edges.left || edges.right || edges.top || edges.bottom) : !!edges[n.data.value];
    } else if (n.data.condition === 'answer') v = !!FS.answer;
    else if (n.data.condition === 'touching' && target) {
      // "mouse pointer" checks real pixel collision against the cursor
      // position; anything else names another sprite and checks real
      // pixel collision against ITS drawable - isTouchingDrawables (not
      // the singular isTouchingDrawable, which is mouse-position-only)
      // takes an array of candidate drawables, same technique
      // pyscratch.js's own touching() already uses in production, kept
      // independent per this file's header comment. Falls back to a
      // rough bounding-box distance check if the renderer call itself
      // throws, so a collision check never just silently does nothing.
      if (!n.data.value || n.data.value === 'mouse') {
        try {
          v = !!(FS.vm.runtime.renderer &&
            FS.vm.runtime.renderer.isTouchingDrawable(target.drawableID, FS.mouse.x, FS.mouse.y));
        } catch (e) { v = false; }
      } else {
        var otherTouch = getTargetByName(n.data.value);
        if (otherTouch) {
          try {
            v = !!(FS.vm.runtime.renderer &&
              FS.vm.runtime.renderer.isTouchingDrawables(target.drawableID, [otherTouch.drawableID]));
          } catch (e) {
            v = Math.abs(target.x - otherTouch.x) < 30 && Math.abs(target.y - otherTouch.y) < 30;
          }
        }
      }
    } else if (n.data.condition === 'mouse_down') v = !!FS.mouse.down;
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
    } else if (n.data.condition === 'list_contains') {
      var lst = findGlobalList(n.data.listName);
      if (lst && Array.isArray(lst.value)) {
        v = lst.value.some(function (item) { return String(item) === String(n.data.value); });
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

  // ── Background flows: other sprites' flowcharts, running concurrently ──
  // Real Scratch runs every sprite's own scripts at once on green flag;
  // FlowScratch previously only ran whichever ONE sprite happened to be
  // open in the editor (vm.runtime.on('PROJECT_START', ...) called run()
  // just once), which made any multi-sprite project - a pipe alongside a
  // bird, an enemy alongside a tower - silently do nothing for every
  // sprite except the one on screen. Each background flow captures its
  // own sprite's nodes/edges ONCE at start (loadGraph(name), not FS.nodes)
  // and drives its own target directly via the targetOverride parameters
  // runBlock()/evaluateCondition() and the nodes/edges-array overrides
  // getNode()/edgeBranch() already accept - so switching which sprite is
  // open in the editor, or editing that sprite's own graph, can never
  // disturb an already-running background flow. It updates nothing in the
  // editor UI (no wires/highlighting/status text) since it isn't the
  // graph on screen - that's still exactly what the active sprite's own
  // run() below does.
  // Keyed by "<targetId>:<rootNodeId>", not just target id - a sprite can
  // have more than one script running at once (its own green-flag Start
  // loop AND a broadcast-triggered "When I receive" handler, same as real
  // Scratch), and each needs its own independent gen counter so firing one
  // doesn't cancel the other. Bumping a key's counter stops just that one
  // script; stopAllBackgroundFlows() bumps every key.
  FS.bgRuns = {};
  function stopAllBackgroundFlows() {
    Object.keys(FS.bgRuns).forEach(function (key) { FS.bgRuns[key]++; });
  }
  // startNode is the script's own entry point - the Start node for a
  // green-flag-triggered flow, or a "When I receive" node for a broadcast
  // handler (see fireBroadcast below). Falls back to hunting for a Start
  // node when omitted, so existing green-flag call sites don't need to
  // change.
  function runBackgroundFlow(spriteName, nodes, edges, startNode) {
    var target = getTargetByName(spriteName);
    if (!target) return;
    var start = startNode || nodes.find(function (n) { return n.type === 'start'; });
    if (!start) return;
    var key = target.id + ':' + start.id;
    var myGen = (FS.bgRuns[key] = (FS.bgRuns[key] || 0) + 1);
    var current = start, steps = 0, callStack = [];
    var PACE_EVERY = 20;
    function pace(stepNum) {
      if (FS.slowMode) return wait(FS.slowDelayMs);
      if (stepNum % PACE_EVERY === 0) return wait(0);
      return Promise.resolve();
    }
    var STEP_CAP = 200000;
    (async function loop() {
      while (FS.bgRuns[key] === myGen && current && steps++ < STEP_CAP) {
        var outs = edges.filter(function (e) { return e.from === current.id; });
        if (current.type === 'end') {
          if (!callStack.length) break;
          current = callStack.pop();
          await pace(steps);
          continue;
        }
        if (current.type === 'call_subroutine') {
          var routine = nodes.find(function (n) {
            return n.type === 'subroutine_start' && String(n.data.name || '').trim() === String(current.data.name || '').trim();
          });
          callStack.push(getNode(outs[0] ? outs[0].to : undefined, nodes));
          await pace(steps);
          current = routine;
          continue;
        }
        await runBlock(current, target);
        if (FS.bgRuns[key] !== myGen) return;
        await pace(steps);
        if (FS.bgRuns[key] !== myGen) return;
        if (current.type === 'selection') {
          var truth = evaluateCondition(current, target);
          var chosen = outs.find(function (edge) { return edgeBranch(edge, nodes, edges) === (truth ? 'true' : 'false'); });
          current = getNode(chosen ? chosen.to : undefined, nodes);
        } else {
          current = getNode(outs[0] ? outs[0].to : undefined, nodes);
        }
      }
    })();
  }
  // Starts every OTHER sprite's saved flowchart as a background flow -
  // called alongside run() (which still handles the active sprite) on
  // green flag. Reads straight from each sprite's own localStorage-saved
  // graph (loadGraph), not FS.nodes, so it never depends on that sprite
  // ever having been opened in the editor this session.
  function runAllOtherSpritesFlowcharts() {
    getSprites().forEach(function (t) {
      var name = t.sprite && t.sprite.name;
      if (!name || name === FS.activeSprite) return;
      var g = loadGraph(name);
      if (g.nodes.some(function (n) { return n.type === 'start'; })) runBackgroundFlow(name, g.nodes, g.edges);
    });
  }
  // A broadcast reaches every sprite (matching real Scratch), not just the
  // one that sent it. The active sprite is checked against its live,
  // in-editor graph (FS.nodes/FS.edges); every other sprite against its
  // own saved graph (loadGraph) - same split runAllOtherSpritesFlowcharts()
  // already uses. A "When I receive" handler always runs as a background
  // flow (headless, no wire/node highlighting) even on the active sprite,
  // since it's a second concurrent script alongside whatever the visible
  // run() is doing and there is no sane way to highlight two scripts on
  // one canvas at once - a known, accepted simplification.
  function fireBroadcast(message) {
    message = String(message || '').trim();
    if (!message) return;
    function startReceivers(spriteName, nodes, edges) {
      nodes.filter(function (n) { return n.type === 'when_i_receive' && String(n.data.message || '').trim() === message; })
        .forEach(function (recv) { runBackgroundFlow(spriteName, nodes, edges, recv); });
    }
    if (FS.activeSprite) startReceivers(FS.activeSprite, FS.nodes, FS.edges);
    getSprites().forEach(function (t) {
      var name = t.sprite && t.sprite.name;
      if (!name || name === FS.activeSprite) return;
      var g = loadGraph(name);
      startReceivers(name, g.nodes, g.edges);
    });
  }

  function run() {
    if (FS.running) return;
    var errors = validate();
    if (errors.length) { notify(errors[0] + (errors.length > 1 ? ' (+' + (errors.length - 1) + ' more)' : ''), 'error'); return; }
    FS.running = true;
    var myGen = ++FS.gen;
    FS.answer = ''; els.answerValue.textContent = String.fromCharCode(8709);
    var start = FS.nodes.find(function (n) { return n.type === 'start'; });
    var current = start, steps = 0, callStack = [];
    // A "forever" flowchart loop is just a wire connected back to an
    // earlier block, a normal cycle, not a special block type. Some pacing
    // yield is needed every so often so this can't lock up the tab like a
    // true synchronous busy-loop could, and so the stop button stays
    // responsive. STEP_CAP is a generous last-resort safety net only, not
    // the intended way to stop a deliberate loop, that's what the stop
    // button (wired to TurboWarp's own) is for.
    //
    // pace() used to be an unconditional `await wait(FS.slowMode ?
    // FS.slowDelayMs : 0)` on every single step. That looked right (0ms
    // delay when slow mode is off) but a real `setTimeout(fn, 0)` is not
    // actually 0ms in a browser: after a handful of nested zero-delay
    // timeouts in the same chain, browsers clamp them to a ~4ms floor
    // (measured live: ~224 iterations/sec, not thousands). Every flowchart
    // was silently throttled to that floor on every step regardless of the
    // slow mode toggle - invisible on a short flow (a few steps finishes
    // in well under a frame either way) but very obvious on any loop,
    // which is exactly when a flowchart is likely to have many steps.
    // Fixed by only actually awaiting a real timer when slow mode is on,
    // or once every PACE_EVERY steps as a periodic yield back to the
    // browser - most steps with slow mode off now run at essentially
    // native speed instead of being capped by the timer floor.
    var PACE_EVERY = 20;
    function pace(stepNum) {
      if (FS.slowMode) return wait(FS.slowDelayMs);
      if (stepNum % PACE_EVERY === 0) return wait(0);
      return Promise.resolve();
    }
    var STEP_CAP = 200000;
    renderWires();
    (async function loop() {
      while (FS.running && FS.gen === myGen && current && steps++ < STEP_CAP) {
        setRunStatus(typeTitle(current));
        var outs = FS.edges.filter(function (e) { return e.from === current.id; });
        setActiveWire(current.type === 'call_subroutine' ? null : (outs[0] && outs[0].id));
        setActiveNode(current.id);
        if (current.type === 'end') {
          if (!callStack.length) break;
          current = callStack.pop();
          await pace(steps);
          continue;
        }
        if (current.type === 'call_subroutine') {
          var routine = FS.nodes.find(function (n) {
            return n.type === 'subroutine_start' && String(n.data.name || '').trim() === String(current.data.name || '').trim();
          });
          callStack.push(getNode(outs[0] ? outs[0].to : undefined));
          await pace(steps);
          current = routine;
          continue;
        }
        await runBlock(current);
        if (FS.gen !== myGen) return;
        await pace(steps);
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
      '#fs-overlay{color-scheme:light;user-select:none;-webkit-user-select:none}',
      // Re-enable text selection only inside editable fields, so dragging a
      // block or panning the canvas never starts a highlight-selection of
      // the inspector/status text around it.
      '#fs-overlay select,#fs-overlay input,#fs-overlay textarea{background:#fff;color:#18191b;user-select:auto;-webkit-user-select:auto}',
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
      '.fs-inline-name{width:112px;font-size:10px;padding:2px 4px;border:1px solid #c8c9ce;border-radius:4px;text-align:center}',
      '.fs-inline-text{width:112px;max-width:100%;font-size:10px;padding:2px 4px;border:1px solid #c8c9ce;border-radius:4px}',
      '.fs-inline-reporter{font-size:10px;font-weight:600;color:#1479be;background:#eef5fb;border-radius:4px;padding:1px 5px;max-width:112px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.fs-inline-label{font-size:9px;color:#686b73}',
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
      '.fs-node.subroutine .fs-node-body{border-style:solid;border-width:2px;padding-left:18px;padding-right:18px}',
      '.fs-node.subroutine .fs-node-body::before,.fs-node.subroutine .fs-node-body::after{content:"";position:absolute;top:7px;bottom:7px;width:2px;background:var(--fs-cat-color, #4d515a)}',
      '.fs-node.subroutine .fs-node-body::before{left:8px}',
      '.fs-node.subroutine .fs-node-body::after{right:8px}',
      '.fs-node.io .fs-node-body{clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);padding-left:20px;padding-right:20px}',
      '.fs-node.selection .fs-node-body{width:96px;height:96px;min-height:96px;padding:14px;transform:rotate(45deg)}',
      '.fs-node.selection{width:150px;height:112px}',
      '.fs-node.selection .fs-node-content{transform:rotate(-45deg);width:106px}',
      '.fs-node.selection select{max-width:90px;font-size:9px;padding:1px}',
      // Kept narrow enough that a variable-name select plus its value
      // input fit on one row without wrapping: a wrap makes the node
      // grow taller than center() assumes, which is exactly the bug that
      // broke wire-anchor alignment before (see center()'s own comment).
      '.fs-node.process select,.fs-node.subroutine select{font-size:9px;padding:1px 2px;max-width:112px}',
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
      '.fs-field{display:grid;gap:4px;margin:8px 0}.fs-field label{font-size:10px;color:#686b73}.fs-field input{width:100%;border:1px solid #c8c9ce;border-radius:6px;padding:5px;background:#fff;font-size:11px}.fs-field select{width:100%;border:1px solid #c8c9ce;border-radius:6px;padding:5px;background:#fff;font-size:11px}',
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
      '.fs-diagram-loading{color:#686b73;font-size:13px;margin:20px 0}',

      // ── Tutorials (PyScratch-style: a docked bar, never a blocking modal
      // while a tutorial is actually in progress - see buildTutorialUI) ──
      '#fsTutorialsBtn{background:#2e8b57;color:#fff;border:0;border-radius:6px;padding:6px 10px;font:inherit;font-weight:700;cursor:pointer}',
      '#fsTutorialsBtn:hover{background:#257048}',
      // Back/Next must never scroll out of reach on a short window - the tutorial bar was
      // originally one single overflow:auto block, and on a constrained-height screen that
      // put the primary action buttons below the fold along with everything else, exactly
      // the same "found the bug by actually using it, not just reading the code" class of
      // issue as the anchor/hitbox fix earlier in this file. #fs-tut-scroll is now the ONLY
      // thing that scrolls; #fs-tut-foot sits outside it, pinned to the bottom of a
      // fixed-max-height bar, always visible regardless of how long the step text or
      // checklist gets.
      '#fs-tutorial-bar{display:none;flex-direction:column;background:#eefaf2;border-bottom:3px solid #6cc499;flex-shrink:0;max-height:min(46vh,320px)}',
      '#fs-overlay.fs-tutorial-active #fs-tutorial-bar{display:flex}',
      '#fs-tut-scroll{overflow:auto;display:flex;flex-direction:column;gap:6px;padding:10px 12px}',
      '#fs-tut-head{display:flex;align-items:center;gap:8px}',
      '#fs-tut-titlewrap{flex:1;display:flex;align-items:baseline;gap:6px;min-width:0}',
      '#fs-tut-name{font-weight:800;color:#1f4d38;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#fs-tut-stepcount{font-size:10px;font-weight:700;color:#4d8a6c;flex-shrink:0}',
      '#fs-tut-exit{background:transparent;border:0;color:#4d6b5b;font-size:16px;line-height:1;cursor:pointer;padding:2px 4px;flex-shrink:0}',
      '#fs-tut-exit:hover{color:#1f4d38}',
      '#fs-tut-dots{display:flex;gap:5px}',
      '.fs-tut-dot{width:7px;height:7px;border-radius:50%;background:#cfe9da}',
      '.fs-tut-dot.done{background:#4fbf87}',
      '.fs-tut-dot.cur{background:#1f8a5a;transform:scale(1.3)}',
      '#fs-tut-title{font-weight:800;color:#1f4d38;font-size:12.5px}',
      '#fs-tut-text{font-size:11.5px;line-height:1.4;color:#33241a}',
      '#fs-tut-text code{background:#dff2e6;border-radius:3px;padding:1px 4px;font-weight:700;color:#1f6e4f}',
      '#fs-tut-checklist{font-size:11px;font-family:inherit}',
      '.fs-tut-check{display:flex;align-items:center;gap:6px;padding:2px 0;color:#7a8f83}',
      '.fs-tut-check.ok{color:#1f8a5a;font-weight:700}',
      '.fs-tut-check-icon{width:11px;height:11px;border-radius:50%;border:2px solid #b9d6c4;flex-shrink:0;display:inline-block}',
      '.fs-tut-check.ok .fs-tut-check-icon{background:#2e8b57;border-color:#2e8b57}',
      '#fs-tut-foot{display:flex;gap:8px;padding:8px 12px;flex-shrink:0;border-top:1px solid #bfe6cf;background:#e3f5e9}',
      '#fs-tut-back,#fs-tut-next{border:0;border-radius:6px;padding:6px 10px;font-weight:800;cursor:pointer;font:inherit;font-size:11.5px}',
      '#fs-tut-back{background:#dff2e6;color:#1f6e4f}',
      '#fs-tut-back:disabled{opacity:.4;cursor:not-allowed}',
      '#fs-tut-next{background:#2e8b57;color:#fff;flex:1}',
      '#fs-tut-next:disabled{opacity:.45;cursor:not-allowed;background:#9cc9ac}',
      '#fs-tut-picker-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;align-items:center;justify-content:center}',
      '#fs-tut-picker-modal.show{display:flex}',
      '#fs-tut-picker-card{background:#fff;border-radius:12px;max-width:420px;width:92%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.35)}',
      '#fs-tut-picker-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e3e3e6}',
      '#fs-tut-picker-head h2{margin:0;font-size:15px;color:#1f4d38}',
      '#fs-tut-picker-close{background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:#4d6b5b}',
      '#fs-tut-picker-list{padding:12px 16px;overflow:auto;display:flex;flex-direction:column;gap:8px}',
      '.fs-tut-card{display:flex;align-items:center;gap:10px;width:100%;padding:10px;border-radius:9px;border:1px solid #d9e6dd;background:#fbfff9;cursor:pointer;text-align:left;font:inherit}',
      '.fs-tut-card:hover{background:#eefaf2}',
      '.fs-tut-card-badge{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0}',
      '.fs-tut-card-body{flex:1;min-width:0}',
      '.fs-tut-card-title{display:block;font-weight:800;color:#1f4d38;font-size:13px}',
      '.fs-tut-card-desc{display:block;font-size:11px;color:#4d6b5b;line-height:1.35}',
      '.fs-tut-card-status{font-size:10px;font-weight:800;color:#2e8b57;white-space:nowrap;flex-shrink:0}',
      '.fs-tut-card-status.prog{color:#a3711f}',
      '.fs-tut-card-wrap{position:relative}',
      '.fs-tut-card-reset{position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;border:1px solid #d9e6dd;background:#fff;color:#4d6b5b;font-size:12px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '.fs-tut-card-reset:hover{background:#f2fbf5;color:#1f4d38}',
      // Category grouping in the picker - a single open <details> today,
      // matching pyscratch.js's own buildTutorialGroupsHTML markup shape
      // so a second/third tutorial category needs no new CSS to slot in.
      '.fs-tut-cat{border:1px solid #e3e3e6;border-radius:9px;overflow:hidden}',
      '.fs-tut-cat+.fs-tut-cat{margin-top:2px}',
      '.fs-tut-cat-summary{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#f5f8f6;font-weight:800;font-size:12px;color:#1f4d38;cursor:pointer;list-style:none}',
      '.fs-tut-cat-summary::-webkit-details-marker{display:none}',
      '.fs-tut-cat-chevron{transition:transform .12s;display:inline-block}',
      '.fs-tut-cat[open] .fs-tut-cat-chevron{transform:rotate(90deg)}',
      '.fs-tut-cat-count{margin-left:auto;font-size:10px;color:#7a8f83;background:#e3f5e9;border-radius:99px;padding:1px 7px}',
      '.fs-tut-cat-list{display:flex;flex-direction:column;gap:8px;padding:10px}',

      // ── Highlighting a real page element (see showFsHighlight) - same
      // pulsing-box technique as pyscratch.js's #ps-hl, colours matched to
      // FlowScratch's own green tutorial palette instead of PyScratch's.
      '@keyframes fs-hl-pulse{0%,100%{border-color:#ffbf00;box-shadow:0 0 0 3px #ffbf00,0 0 16px 5px rgba(255,191,0,.7)}50%{border-color:#2e8b57;box-shadow:0 0 0 3px #2e8b57,0 0 16px 5px rgba(46,139,87,.7)}}',
      '@keyframes fs-hl-label-pulse{0%,100%{background:#ffbf00;color:#3a2c00}50%{background:#2e8b57;color:#eafbf2}}',
      '#fs-hl{position:fixed;pointer-events:none;z-index:99999;border:3px solid #ffbf00;border-radius:7px;animation:fs-hl-pulse 1.2s ease-in-out infinite;display:none;box-sizing:border-box;transition:left .12s,top .12s,width .12s,height .12s}',
      '#fs-hl-label{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#ffbf00;color:#3a2c00;font-size:11px;font-weight:700;font-family:inherit;padding:3px 10px;border-radius:99px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.35);animation:fs-hl-label-pulse 1.2s ease-in-out infinite}',

      // ── Resume-or-restart / keep-or-restore dialog (see showFsTutDialog) -
      // same role as pyscratch.js's #ps-tut-dialog, styled to match.
      '#fs-tut-dialog{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;align-items:center;justify-content:center}',
      '#fs-tut-dialog.show{display:flex}',
      '#fs-td-card{background:#fff;border-radius:14px;max-width:360px;width:90%;padding:22px 20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}',
      '#fs-td-icon{font-size:34px;line-height:1;margin-bottom:8px}',
      '#fs-td-title{font-weight:800;font-size:15px;color:#1f4d38;margin-bottom:8px}',
      '#fs-td-body{font-size:12.5px;color:#41463f;line-height:1.5;margin-bottom:16px}',
      '#fs-td-btns{display:flex;flex-direction:column;gap:8px}',
      '.fs-td-btn{border:0;border-radius:8px;padding:10px 14px;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer}',
      '.fs-td-primary{background:#2e8b57;color:#fff}',
      '.fs-td-primary:hover{background:#257048}',
      '.fs-td-secondary{background:#eefaf2;color:#1f4d38}',
      '.fs-td-secondary:hover{background:#dff2e6}',
      '.fs-td-danger{background:#fdecec;color:#a3241f}',
      '.fs-td-danger:hover{background:#fbd9d9}'
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
        '<div id="fs-list-list"></div>' +
        '<button type="button" id="fsNewListBtn" class="fs-new-var-btn">+ New list</button>' +
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
    if (!els.listList) return;
    var lists = getGlobalLists();
    els.listList.innerHTML = lists.length
      ? lists.map(function (l) {
          return '<div class="fs-var-row"><label class="fs-var-check" title="Show on stage"><input type="checkbox" class="fs-var-monitor" data-list="' + esc(l.name) + '"' + (isVariableMonitorVisible(l.id) ? ' checked' : '') + '> ' + esc(l.name) + '</label><button type="button" class="fs-var-del" data-list="' + esc(l.name) + '">&times;</button></div>';
        }).join('')
      : '<div class="fs-empty" style="padding:2px 0 6px">No lists yet.</div>';
    Array.prototype.forEach.call(els.listList.querySelectorAll('.fs-var-del'), function (btn) {
      btn.addEventListener('click', function () { deleteGlobalList(btn.dataset.list); });
    });
    Array.prototype.forEach.call(els.listList.querySelectorAll('.fs-var-monitor'), function (cb) {
      cb.addEventListener('change', function () {
        var l = findGlobalList(cb.dataset.list);
        if (l) setListMonitorVisible(l, cb.checked);
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
      listList: root.querySelector('#fs-list-list'),
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
    root.querySelector('#fsNewListBtn').onclick = function () {
      var name = prompt('New list name:');
      if (name) createGlobalList(name);
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
    // Left-button state, for the "mouse down" Selection condition.
    window.addEventListener('mousedown', function (e) { if (e.button === 0) FS.mouse.down = true; });
    window.addEventListener('mouseup', function (e) { if (e.button === 0) FS.mouse.down = false; });
    window.addEventListener('keydown', function (e) {
      if (!els.overlay || els.overlay.style.display === 'none') { FS.pressedKeys[normKey(e.code)] = true; return; }
      FS.pressedKeys[normKey(e.code)] = true;
      var editingText = /INPUT|SELECT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName);
      // Undo / redo. Leave Ctrl+Z to the browser's own text undo while the
      // focus is inside an input/select; otherwise step the graph history.
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.code === 'KeyY')) {
        if (editingText) return;
        e.preventDefault();
        if (e.code === 'KeyZ') { if (e.shiftKey) redo(); else undo(); }
        else redo();
        return;
      }
      if (e.code === 'Space' && !editingText) { space = true; e.preventDefault(); }
      // Delete / Backspace removes the selected block or connector, unless
      // the user is currently editing a value on the block itself.
      if ((e.code === 'Delete' || e.code === 'Backspace') && !editingText) {
        e.preventDefault();
        if (FS.selected) removeSelected();
        else if (FS.selectedEdgeId) {
          snapshotForUndo();
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
      // Selection's true diamond tip can sit outside its own 150x112 box (see
      // nearestPerimeterPoint's comment) - widen this quick-reject box a little for it so a
      // hover right at the tip isn't thrown out before the real shape-aware check below runs.
      var reject = n.shape === 'selection' ? threshold + (SELECTION_BODY_SIZE / Math.SQRT2 - h / 2) : threshold;
      if (lx < -threshold || lx > w + threshold || ly < -reject || ly > h + reject) return;
      var pt = nearestPerimeterPoint(n, lx, ly);
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
        if (!FS.drag.moved) { FS.drag.moved = true; snapshotForUndo(); }
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
          snapshotForUndo();
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
          snapshotForUndo();
          addEdge(FS.connect.from, joinedEdge.to, FS.connect.fromA, joinedEdge.toA, {
            joinEdgeId: joinedEdge.id,
            joinAt: { x: joinPoint.x, y: joinPoint.y }
          });
          saveGraph(FS.activeSprite);
        } else if (target && target.dataset.id !== FS.connect.from) {
          var wp2 = screenToWorld(e.clientX, e.clientY);
          var n2 = getNode(target.dataset.id);
          snapshotForUndo();
          addEdge(FS.connect.from, n2.id, FS.connect.fromA, anchorPointOnNode(n2, wp2.x, wp2.y));
          saveGraph(FS.activeSprite);
        }
        FS.connect = null; els.draft.style.display = 'none'; els.canvasWrap.classList.remove('connecting');
        hideHoverAnchor();
        // Connecting a wire updates FS.edges but (unlike dropping a new
        // block) never runs through renderAll(), so the tutorial checklist
        // - which only recomputes there - was going stale on every connect.
        // Found by actually wiring up a tutorial's "connect them" step live.
        updateFsTutorialChecklist();
      }
      if (FS.drag && FS.drag.kind === 'node') {
        // Dragging a block back onto the palette (the sidebar it came from)
        // deletes it, same as the delete key. If the block was moved on the
        // way there the pre-move snapshot is already on the undo stack, so
        // skip an extra snapshot; a block already sitting over the sidebar
        // (moved:false) still gets one so it can be undone.
        var sidebar = els.overlay.querySelector('#fs-sidebar');
        if (sidebar) {
          var sr = sidebar.getBoundingClientRect();
          if (e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom) {
            deleteNode(FS.drag.id, FS.drag.moved);
            FS.drag = null; els.canvasWrap.classList.remove('panning');
            return;
          }
        }
        saveGraph(FS.activeSprite);
      }
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
    // Undo/redo history is per-sprite (it snapshots that sprite's graph);
    // a different sprite's snapshots would otherwise be restored onto this
    // one's canvas, so drop the history on every sprite switch.
    undoStack.length = 0; redoStack.length = 0;
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

  // ============================================================
  // TUTORIALS - PyScratch-style: a docked bar (never a blocking modal
  // while a tutorial is actually in progress), a per-step checklist, and
  // resumable progress. Modeled directly on pyscratch.js's own TUTORIALS
  // system (and Pseudocode Farmer's later adaptation of the same idea) but
  // adapted to THIS app's model: there's no typed code to require literal
  // lines from, so a step's `requires` are checked against the live
  // FS.nodes/FS.edges graph structurally - "does a Start block exist",
  // "is there a connected path from Start to End" - the same "a real
  // structural fact, not a fragile text guess" principle Farmer's own
  // tutorial engine already uses for its compiled-instruction checks.
  //
  // Extending this: add another entry to FS_TUTORIALS with its own
  // `steps` array. Two requirement shapes are supported so far -
  // { node: 'start' } (at least one/`count` nodes of that TYPES key
  // exist) and { path: true } (some Start reaches some End via edges) -
  // add more to tutorialRequirementMet/tutorialRequirementLabel as later
  // tutorials need them, the same incremental way Farmer's own
  // tutorialRequirementMet grew past its first couple of req shapes.
  // ============================================================
  var FS_TUTORIALS = [
    {
      id: 'first-flowchart',
      title: 'Your First Flowchart',
      color: '#FFBF00',
      category: 'Flowchart Basics',
      desc: 'Every flowchart starts with Start and ends with End - build the simplest one and run it for real.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Every flowchart begins with exactly one <b>Start</b> block, at the top of the <b>Flow</b> category in the palette on the left. Drag one onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a Move steps block',
          text: 'Open the <b>Motion</b> category and drag a <b>Move steps</b> block onto the canvas too.',
          requires: [{ node: 'start' }, { node: 'move_steps' }],
          highlight: 'palette-move-steps',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add an End block',
          text: 'Back in <b>Flow</b>, drag out an <b>End</b> block.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'end' }],
          highlight: 'palette-end',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Connect them in order',
          text: 'Hover near a block\'s edge until the green dot appears, then press and drag to the next block: <b>Start &rarr; Move steps &rarr; End</b>.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'end' }, { path: true }]
        },
        {
          title: 'Try it!',
          text: 'Use the green flag above the stage to run your flowchart - the sprite should move.<br><br><b>Challenge:</b> add a Turn right block between Move steps and End, and watch it face a new direction every run.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // ── The rest of this library mirrors pyscratch.js's own tutorial list,
    // one FlowScratch-native step arc per PyScratch concept - not a literal
    // line-for-line port, since PyScratch teaches typed Python and these
    // teach the block equivalent. Two adaptations worth flagging:
    // - PyScratch's "If Statements" and "Left & Right Movement" tutorials
    //   teach the same if/key_pressed/change_x idea twice with more polish
    //   the second time; merged here into one "Making Choices" tutorial
    //   rather than build two near-duplicates.
    // - "Bouncing Ball" doesn't port the hand-written vx/vy sign-flipping
    //   PyScratch needs, because there's no "multiply a variable by -1"
    //   block to flip it with - and If on edge, bounce already does the
    //   whole mechanic in one existing block. Taught as itself instead,
    //   with the text calling out why.
    {
      id: 'making-choices',
      title: 'Making Choices',
      color: '#FFAB19',
      category: 'Branching & Loops',
      desc: 'Use a Selection block to branch your flowchart - move the sprite only while an arrow key is held.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Every flowchart begins with a <b>Start</b> block. Drag one onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a Selection block',
          text: 'A <b>Selection</b> block is a diamond that checks a condition and branches into <b>True</b> and <b>False</b> paths - the flowchart equivalent of an "if". Open <b>Control</b> and drag one onto the canvas.',
          requires: [{ node: 'start' }, { node: 'selection' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Set the condition to a key',
          text: 'Click the Selection block. Set its first dropdown to <b>Key</b>, then choose <b>Right Arrow</b>.',
          requires: [{ node: 'start' }, { node: 'selection' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'key' }, label: 'Selection is set to check a key' }]
        },
        {
          title: 'Add a second Selection',
          text: 'A Selection\'s False output can\'t point back to itself, so checking a key "every frame" always needs a second thing for False to reach. Add a <b>second</b> Selection block (condition: key, <b>Left Arrow</b>) - you\'ll wire the two into a loop together next.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move on the True branches',
          text: 'Drag two <b>Change x by</b> blocks from Motion - one set to <b>5</b>, one to <b>-5</b>. Connect <b>Start</b> to the first (right-key) Selection. Connect each Selection\'s <b>True</b> output to its own Change x by block.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }],
          highlight: 'palette-change-x-by',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Wire the loop',
          text: 'Now connect everything so both Selections keep checking forever: <b>right Change x by &rarr; left Selection</b>, and the right Selection\'s <b>False</b> output <b>also &rarr; left Selection</b> (both paths converge there). Then the same in reverse: <b>left Change x by &rarr; right Selection</b>, and the left Selection\'s <b>False</b> output <b>also &rarr; right Selection</b>. Every Selection now has exactly two outgoing wires, and the whole thing loops.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }, { loop: true }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and hold the arrow keys - your sprite should move left and right.<br><br><b>Challenge:</b> add <b>Point in direction</b> blocks (90 for right, -90 for left) so the sprite turns to face the way it\'s moving - try a <b>Set rotation style</b> block set to left-right first.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'loops-that-repeat',
      title: 'Loops That Repeat',
      color: '#FFAB19',
      category: 'Branching & Loops',
      desc: 'Use a variable and a Selection block to repeat part of your flowchart a fixed number of times, then carry on.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Drag a <b>Start</b> block onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Create a counter variable',
          text: 'Drag a <b>Set variable</b> block from Variables. Create a new variable called exactly <b>count</b> and set it to 0.',
          requires: [{ node: 'start' }, { node: 'set_variable' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a Selection that checks the count',
          text: 'Drag a Selection block. Set its condition to <b>Variable</b>, choose <b>count</b>, operator <b>&lt;</b>, value <b>5</b>.',
          requires: [{ node: 'start' }, { node: 'set_variable' }, { node: 'selection' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'variable' }, label: 'Selection is set to check a variable' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Repeat and count up',
          text: 'On the <b>True</b> branch, add a block that does something (try Move steps), then a <b>Change variable</b> block that adds 1 to count. Connect it back to the Selection block to keep checking.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'change_variable' }, { loop: true }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Do something once the loop ends',
          text: 'On the <b>False</b> branch (once count reaches 5), connect to a <b>Say</b> block, then an <b>End</b> block.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'say' }, { node: 'end' }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Your flowchart should repeat 5 times, then say something and stop.<br><br><b>Challenge:</b> change the 5 to 10, or count down from 10 to 0 instead.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'costume-animation',
      title: 'Costume Animation',
      color: '#9966FF',
      category: 'Movement & Animation',
      desc: 'Animate your sprite through its costumes while it moves, and snap back to a resting pose when it stops.',
      steps: [
        {
          title: 'Set up movement',
          text: 'Add a <b>Start</b>, a <b>Selection</b> (key: Right Arrow), a <b>Change x by</b> (5), and a <b>Wait seconds</b> block. Wire <b>Start &rarr; Selection</b>; the Selection\'s <b>True</b> output <b>&rarr; Change x by &rarr; Wait seconds</b>; the Selection\'s <b>False</b> output <b>also &rarr; Wait seconds</b> (both paths converge there); then <b>Wait seconds</b> back to the Selection, closing the loop.<br><br>⚠️ Make sure your sprite has <b>at least 2 costumes</b> before continuing.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'change_x_by' }, { node: 'wait_seconds' }, { loop: true }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Animate while moving',
          text: 'Add a <b>Next costume</b> block between <b>Change x by</b> and <b>Wait seconds</b>, on the True path only.',
          requires: [{ node: 'start' }, { node: 'selection' }, { node: 'change_x_by' }, { node: 'next_costume' }, { node: 'wait_seconds' }, { loop: true }],
          highlight: 'palette-next-costume',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Rest when still',
          text: 'Add a <b>Switch costume to</b> block set to your first costume, and drop it directly onto the <b>False</b> wire between the Selection and Wait seconds - it splices straight into that connection, so the sprite resets to its resting pose whenever the key isn\'t held.',
          requires: [{ node: 'start' }, { node: 'switch_costume_to' }],
          highlight: 'palette-switch-costume-to',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and walk left and right - your sprite should animate while moving and rest when still.<br><br><b>Challenge:</b> try a shorter Wait for a sprint, or a longer one for a slow walk. Add the same shape again for the left arrow key.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'gravity-jumping',
      title: 'Gravity & Jumping',
      color: '#9966FF',
      category: 'Movement & Animation',
      desc: 'Give your sprite a velocity variable, pull it down every frame with gravity, and let it jump when it touches the ground.',
      steps: [
        {
          title: 'Create the velocity variable',
          text: 'Drag a <b>Start</b> block, then a <b>Set variable</b> block. Create a variable called exactly <b>vy</b> (vertical velocity) and set it to 0.',
          requires: [{ node: 'start' }, { node: 'set_variable' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Apply gravity every frame',
          text: 'Add a <b>Change variable</b> block that changes <b>vy</b> by <b>-0.5</b>, then a <b>Change y by</b> block. Click Change y by, and in the panel on the right set its source to the <b>vy</b> variable instead of a plain number.',
          requires: [{ node: 'start' }, { node: 'change_variable' }, { node: 'change_y_by' },
            { nodeWhere: { type: 'change_y_by', field: 'ySrc', value: 'var:vy' }, label: 'Change y by uses the vy variable' }],
          highlight: 'palette-change-y-by',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add a loop and land on the floor',
          text: 'Wire Start through the gravity blocks, looping back so gravity applies every frame. Add a Selection that checks <b>touching edge: bottom</b> - on <b>True</b>, use Set variable to set <b>vy</b> back to 0.',
          requires: [{ node: 'start' }, { loop: true }, { node: 'selection' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'edge' }, label: 'Selection checks for touching an edge' }]
        },
        {
          title: 'Jumping',
          text: 'Add a second Selection that checks the <b>Up Arrow</b> key. On <b>True</b>, use Set variable to set <b>vy</b> to <b>8</b> - gravity pulls it back down automatically.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and press the up arrow to jump. The sprite should fall, land, and jump on command.<br><br><b>Challenge:</b> add left/right movement with two more Selection blocks and Change x by.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'bouncing-ball',
      title: 'Bouncing Ball',
      color: '#9966FF',
      category: 'Movement & Animation',
      desc: 'Make a sprite bounce around the stage forever using a loop and the If on edge, bounce block.',
      steps: [
        {
          title: 'Add a Start block',
          text: 'Drag a <b>Start</b> block onto the canvas.',
          requires: [{ node: 'start' }],
          highlight: 'palette-start',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move every frame',
          text: 'Add a <b>Move steps</b> block (try 8 steps) and connect it to Start.',
          requires: [{ node: 'start' }, { node: 'move_steps' }],
          highlight: 'palette-move-steps',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Bounce off the edges',
          text: 'Add an <b>If on edge, bounce</b> block after Move steps and connect it. This one block does what would otherwise need its own vx/vy variables and manual sign-flipping to write by hand.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'if_on_edge_bounce' }],
          highlight: 'palette-if-on-edge-bounce',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Loop it forever',
          text: 'Connect <b>If on edge, bounce</b> back to <b>Move steps</b> so this repeats every frame.',
          requires: [{ node: 'start' }, { node: 'move_steps' }, { node: 'if_on_edge_bounce' }, { loop: true }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> - the ball should bounce around the stage forever.<br><br><b>Challenge:</b> increase Move steps for a faster ball, or add a Turn right block before bouncing for a less predictable path.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'working-with-lists',
      title: 'Working with Lists',
      color: '#FF8C1A',
      category: 'Code Organisation',
      desc: 'Store many values in one list, grow it while the flow runs, and read them back one at a time.',
      steps: [
        {
          title: 'Make a list',
          text: 'Click <b>+ New list</b> in the Variables category and create one called exactly <b>points</b>. Drag a <b>Start</b> block, then three <b>Add to list</b> blocks to add <b>-150</b>, <b>0</b>, and <b>150</b> to it.',
          requires: [{ node: 'start' }, { node: 'list_add', count: 3 }],
          highlight: 'palette-list-add',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Read an item back',
          text: 'Drag a <b>Set var to item of list</b> block. Create a variable called exactly <b>current</b>, and read item <b>1</b> of <b>points</b> into it.',
          requires: [{ node: 'start' }, { node: 'set_variable' }, { node: 'list_item_to_var' }],
          highlight: 'palette-list-item-to-var',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move there and loop',
          text: 'Add a <b>Set x to</b> block - click it, and in the panel on the right set its source to the <b>current</b> variable. Add a <b>Wait seconds</b> block, then loop back so the flow keeps patrolling.',
          requires: [{ node: 'start' }, { node: 'set_x_to' }, { loop: true },
            { nodeWhere: { type: 'set_x_to', field: 'xSrc', value: 'var:current' }, label: 'Set x to uses the current variable' }],
          highlight: 'palette-set-x-to',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Grow the list',
          text: 'Lists can change size while the flow runs. Add one more <b>Add to list</b> block (a fourth stop) before the loop starts.',
          requires: [{ node: 'start' }, { node: 'list_add', count: 4 }]
        },
        {
          title: 'How long is the list?',
          text: 'Add a <b>Set variable</b> block, name a variable <b>count</b>, and in the panel on the right set its source to <b>length of points</b>.',
          requires: [{ node: 'start' }, { node: 'set_variable' },
            { nodeWhere: { type: 'set_variable', field: 'valueSrc', value: 'listlen:points' }, label: 'Set variable uses the length of points' }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> - the sprite should patrol between the stops in your list forever.<br><br><b>Challenge:</b> change which item you read each time through the loop (using another variable as the index) so it actually visits every stop in order, not just the first.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    {
      id: 'messages-events',
      title: 'Messages & Events',
      color: '#FFAB19',
      category: 'Code Organisation',
      desc: 'Split a trigger from its reaction - one part of your flow broadcasts a message, a separate script reacts.',
      steps: [
        {
          title: 'Two checks, chained',
          text: 'Add a <b>Start</b> block and <b>two</b> Selection blocks - one checking key <b>Space</b>, one checking key <b>Up Arrow</b>. A Selection\'s False output can never point back to itself, so two checks that both loop into each other is the standard way to keep checking several keys forever. Connect <b>Start</b> to the first Selection.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Broadcast on each True branch',
          text: 'Add two <b>Broadcast</b> blocks - one set to <b>cheer</b>, one set to <b>vanish</b>. Connect the Space Selection\'s <b>True</b> output to the cheer Broadcast, and the Up Arrow Selection\'s <b>True</b> output to the vanish Broadcast.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'broadcast', count: 2 }],
          highlight: 'palette-broadcast',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Wire the loop',
          text: 'Connect <b>cheer Broadcast &rarr; Up Arrow Selection</b>, and the Space Selection\'s <b>False</b> output <b>also &rarr; Up Arrow Selection</b> (both paths converge there). Then the same in reverse: <b>vanish Broadcast &rarr; Space Selection</b>, and the Up Arrow Selection\'s <b>False</b> output <b>also &rarr; Space Selection</b>. Every Selection now has exactly two outgoing wires, and the whole thing loops forever.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'broadcast', count: 2 }, { loop: true }]
        },
        {
          title: 'React to the messages',
          text: 'Add two <b>separate</b> scripts, each starting with its own <b>When I receive</b> block (no incoming wire): one set to <b>cheer</b> connected to a <b>Say</b> block, one set to <b>vanish</b> connected to a <b>Hide</b> block. Finish each with an <b>End</b> block - you can connect both Say and Hide to the <em>same</em> End. Your main flow never calls these directly - it just broadcasts, and they react on their own.',
          requires: [{ node: 'start' }, { node: 'when_i_receive', count: 2 }, { node: 'say' }, { node: 'hide' }, { node: 'end' }],
          highlight: 'palette-when-i-receive',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Press <b>space</b> to cheer and <b>up</b> to vanish - the reactions live in totally separate scripts from the key checks.<br><br><b>Challenge:</b> give a <em>second sprite</em> its own <b>When I receive: cheer</b> block too - one broadcast, many sprites responding. That is how whole games are coordinated.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // First of the PyScratch "Applied Games" tutorials to be ported - the
    // simplest of that set, chosen deliberately to prove the two-sprite
    // shape (movement sprite + falling sprite, coordinated only through
    // touching/variables, no clones or broadcasts needed) before
    // attempting the more involved ones (Flappy Bird, Duck Hunt, Tower
    // Defense, ...), each a separate future session's worth of work.
    // Simplified from PyScratch's own version in one place: the apple
    // resets to a fixed top position rather than a random x each time
    // (pick_random(-200, 200)) - FlowScratch has no "random number"
    // reporter yet (a real gap, worth adding before porting the tutorials
    // that lean on real randomness, like Flappy Bird's pipe gaps).
    {
      id: 'apple-catcher',
      title: 'Apple Catcher',
      color: '#4C97FF',
      category: 'Games',
      desc: 'Catch a falling apple with a basket sprite you steer - two sprites working together through touching and shared variables.',
      steps: [
        {
          title: 'Build the basket\'s movement',
          text: 'On your first sprite (the basket), build the same left/right movement shape as <b>Making Choices</b>: Start, two Selections (Right Arrow / Left Arrow), two Change x by blocks (5 / -5), all chained together so both Selections keep checking forever.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }, { loop: true }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add score and lives',
          text: 'Add two <b>Set variable</b> blocks between Start and the movement chain: <b>Score</b> set to 0, and <b>Lives</b> set to 3.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 2 }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Apple sprite',
          text: 'Click the highlighted button to add a second sprite. Give it a small round costume and a name like <b>Apple</b> - you\'ll pick it by name from a dropdown shortly.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 2 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Apple: fall from the top',
          text: 'With the <b>Apple</b> sprite selected, build: <b>Start &rarr; Go to x y (0, 160) &rarr; Change y by (-4)</b>, looping Change y by back to itself is not allowed - you\'ll connect the rest (and close the loop) in the next step.',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'change_y_by' }],
          highlight: 'palette-go-to-xy',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Catch or miss',
          text: 'Add a Selection checking <b>touching</b> your basket sprite\'s name. True: <b>Change variable Score by 1</b>, then back to <b>Go to x y</b> (resets position and continues falling). False: add a second Selection checking <b>touching edge: bottom</b>. Its True: <b>Change variable Lives by -1</b>, then also back to <b>Go to x y</b>. Its False: back to <b>Change y by</b>, closing the falling loop.',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'change_y_by' }, { node: 'selection', count: 2 }, { node: 'change_variable', count: 2 },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'touching' }, label: 'A Selection checks touching' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'edge' }, label: 'A Selection checks touching an edge' }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. The apple should fall, and catching it with your basket scores a point while missing it costs a life.<br><br><b>Challenge:</b> add a Selection on the basket that checks <code>Lives</code> &lt;= 0 and ends the game with a Say block. Try changing Change y by\'s amount to speed the apple up over time.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // Pong needed one more capability first: change_variable only adds,
    // so nothing could express PyScratch's `vx = vx * -1` sign-flip on a
    // wall bounce - added Multiply variable by alongside this tutorial.
    // Simplified from PyScratch's own version by dropping the paddle's
    // own edge-clamping (x_position() > 200: set_x(200)) - a nice-to-have
    // left as a Challenge, not essential to the bounce/score mechanic.
    {
      id: 'pong',
      title: 'Pong',
      color: '#4C97FF',
      category: 'Games',
      desc: 'One-player Pong - bounce a ball off the walls and your paddle using velocity variables and Multiply variable by.',
      steps: [
        {
          title: 'Build the paddle',
          text: 'On your first sprite (the paddle), add a <b>Go to x y</b> block set to <b>(0, -150)</b>, then the same left/right movement chain as <b>Making Choices</b> (two Selections, two Change x by blocks, both wired into a loop).',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'selection', count: 2 }, { node: 'change_x_by', count: 2 }, { loop: true }],
          highlight: 'palette-go-to-xy',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Ball sprite',
          text: 'Click the highlighted button to add a second sprite. Give it a small round costume and a name like <b>Ball</b>.',
          requires: [{ node: 'start' }, { node: 'go_to_xy' }, { node: 'selection', count: 2 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Ball: set up velocity and score',
          text: 'With the <b>Ball</b> sprite selected: three <b>Set variable</b> blocks - <b>vx</b> to 4, <b>vy</b> to 3, <b>Score</b> to 0 - then a <b>Go to x y</b> set to <b>(0, 50)</b>.',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 3 }, { node: 'go_to_xy' }],
          highlight: 'palette-set-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Ball: move and bounce off the side walls',
          text: 'Add a <b>Change x by</b> sourced from <b>vx</b> and a <b>Change y by</b> sourced from <b>vy</b>. Then a Selection checking <b>touching edge: left</b> - True: <b>Multiply variable vx by -1</b> - and a Selection checking <b>touching edge: right</b> - True: <b>Multiply variable vx by -1</b> too. Chain them: each False output leads to the next Selection.',
          requires: [{ node: 'start' }, { node: 'change_x_by' }, { node: 'change_y_by' }, { node: 'selection', count: 2 }, { node: 'multiply_variable' },
            { nodeWhere: { type: 'selection', field: 'value', value: 'left' }, label: 'A Selection checks the left edge' }],
          highlight: 'palette-multiply-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Ball: bounce off the top and the paddle',
          text: 'Chain on two more Selections: <b>touching edge: top</b> (True: <b>Multiply vy by -1</b>), then <b>touching</b> your paddle sprite\'s name (True: <b>Multiply vy by -1</b> and <b>Change variable Score by 1</b>). Keep chaining False onward.',
          requires: [{ node: 'start' }, { node: 'selection', count: 4 }, { node: 'multiply_variable', count: 3 }, { node: 'change_variable' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'touching' }, label: 'A Selection checks touching' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Game over',
          text: 'Add one final Selection: <b>touching edge: bottom</b>. True: a <b>Say</b> block ("Game Over!") then an <b>End</b>. False: back to <b>Change x by</b>, closing the whole loop.',
          requires: [{ node: 'start' }, { node: 'selection', count: 5 }, { node: 'say' }, { node: 'end' }, { loop: true }]
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Keep the ball alive with your paddle - each bounce off it scores a point.<br><br><b>Challenge:</b> add the edge-clamping from Making Choices so the paddle can\'t slide off screen. Try speeding the ball up over time with a second Multiply variable block on <code>vy</code> (a number just over 1, like 1.05) each time it hits the paddle.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // Simplified from PyScratch's own version in one place: PyScratch's
    // flap uses when_key_pressed, a genuine tap-only (edge-triggered)
    // event - FlowScratch's Selection only ever polls "is this key held
    // right now", so holding Space here keeps giving upward lift every
    // frame, rather than one impulse per tap. A real gap (an edge-
    // triggered key event, distinct from the held-key poll Selection
    // already does) worth adding later; noted in the tutorial text
    // rather than hidden. The bird's tilt-with-velocity is left as a
    // Challenge, not a required step, to keep the base flow's Selection
    // chain from growing past what's still easy to follow on screen.
    {
      id: 'flappy-bird',
      title: 'Flappy Bird',
      color: '#9966FF',
      category: 'Games',
      desc: 'Gravity, a floor and ceiling, flap-to-rise, and a pipe that loops across the screen at a random height.',
      steps: [
        {
          title: 'Gravity',
          text: 'Add a <b>Set variable</b> block (<b>vy</b> to 0), a <b>Change variable</b> block (<b>vy</b> by -0.3), and a <b>Change y by</b> block sourced from <b>vy</b>. Wire them in that order after Start - you\'ll close the loop in a later step.',
          requires: [{ node: 'start' }, { node: 'set_variable' }, { node: 'change_variable' }, { node: 'change_y_by' },
            { nodeWhere: { type: 'change_y_by', field: 'ySrc', value: 'var:vy' }, label: 'Change y by uses the vy variable' }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Floor and ceiling',
          text: 'Add a Selection checking <b>touching edge: bottom</b> - True: <b>Set y to</b> -180, then <b>Set variable vy</b> to 0. Add a second Selection checking <b>touching edge: top</b> - True: <b>Set y to</b> 180, then <b>Set variable vy</b> to 0. Chain False onward through both.<br><br>The reset position has to match the edge exactly (-180/180, the real edge of the stage) - resetting to a value the edge check itself wouldn\'t also flag as "touching" (like -150) would let the bird fall further before the next check catches it.',
          requires: [{ node: 'start' }, { node: 'selection', count: 2 }, { node: 'set_y_to', count: 2 }, { node: 'set_variable', count: 3 }],
          highlight: 'palette-set-y-to',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Flap',
          text: 'Add one more Selection checking key <b>Space</b> - True: <b>Set variable vy</b> to 5. Connect its False output, and its True output after Set variable, both back to the very first <b>Change variable vy</b> block - closing the loop.<br><br>⚠️ Since Selection only checks "is this key held right now" (not a single tap), the bird rises the whole time Space is held rather than flapping once per press.',
          requires: [{ node: 'start' }, { node: 'selection', count: 3 }, { loop: true }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Pipe sprite',
          text: 'Click the highlighted button to add a second sprite - anything to dodge. Then click it in the sprite panel to switch to its code.',
          requires: [{ node: 'start' }, { node: 'selection', count: 3 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Pipe: move and loop at a random height',
          text: 'With the <b>Pipe</b> sprite selected: <b>Set variable to random number</b> (name it <b>pipeY</b>, -100 to 100), a <b>Go to x y</b> at x <b>240</b> sourced from <b>pipeY</b> for y, and a <b>Change x by</b> of -3. Add a Selection checking <b>touching edge: left</b> - True: set <b>pipeY</b> to a new random number again, then another <b>Go to x y</b> at x <b>260</b> sourced from <b>pipeY</b>. Loop both the True and False paths back to <b>Change x by</b>.',
          requires: [{ node: 'start' }, { node: 'set_var_to_random', count: 2 }, { node: 'go_to_xy', count: 2 }, { node: 'change_x_by' }, { node: 'selection' }, { loop: true },
            { nodeWhere: { type: 'go_to_xy', field: 'ySrc', value: 'var:pipeY' }, label: 'Go to x y uses the pipeY variable' }],
          highlight: 'palette-set-var-to-random',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b> and hold <b>Space</b> to rise. The bird should fall with gravity and stay between the floor and ceiling, while the pipe scrolls across at a random height on a loop.<br><br><b>Challenge:</b> add a <b>Set rotation style</b> block (all around) and tilt the bird based on <code>vy</code> - point in direction 20 while falling, -20 while rising, using a Selection with condition Variable.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    },
    // Three sprites (Player, Platform, Death), no clones needed. One
    // simplification from PyScratch's own version: its platform-bounce
    // check is `touching("Platform") and vy < 0` (compound AND) - a
    // Selection only ever checks one condition, so this checks touching
    // alone, meaning (unlike PyScratch) bouncing off a platform works
    // even while still rising into it from below. A minor gameplay
    // difference, not a functional gap worth blocking on.
    {
      id: 'doodle-jump',
      title: 'Doodle Jump',
      color: '#9966FF',
      category: 'Games',
      desc: 'A character that bounces automatically, wraps around the screen edges, and lands on falling platforms - or falls to a death barrier below.',
      steps: [
        {
          title: 'Set up bouncing',
          text: 'Add a <b>Set variable</b> (<b>vy</b> to 8), a <b>Change variable</b> (<b>vy</b> by -0.4), and a <b>Change y by</b> sourced from <b>vy</b>. Then a Selection checking <b>touching edge: bottom</b> - True: <b>Set y to</b> -180, then <b>Set variable vy</b> to 8 (relaunches it upward instead of just stopping).',
          requires: [{ node: 'start' }, { node: 'set_variable', count: 2 }, { node: 'change_variable' }, { node: 'change_y_by' }, { node: 'selection' }, { node: 'set_y_to' },
            { nodeWhere: { type: 'selection', field: 'value', value: 'bottom' }, label: 'A Selection checks the bottom edge' }],
          highlight: 'palette-change-variable',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Move left and right',
          text: 'Chain on two more Selections: key <b>Right Arrow</b> (True: <b>Change x by</b> 4) and key <b>Left Arrow</b> (True: <b>Change x by</b> -4).',
          requires: [{ node: 'start' }, { node: 'selection', count: 3 }, { node: 'change_x_by', count: 2 }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Wrap around the screen',
          text: 'Chain on two final Selections: <b>touching edge: right</b> (True: <b>Set x to</b> -230) and <b>touching edge: left</b> (True: <b>Set x to</b> 230). Loop the last one\'s False output back to <b>Change variable vy</b>, closing the whole thing.<br><br>Use -230/230, not the exact edge value (-240/240) - landing exactly on the edge would immediately re-trigger the <em>other</em> wrap check too, and the sprite would flicker back and forth instead of actually wrapping across.',
          requires: [{ node: 'start' }, { node: 'selection', count: 5 }, { node: 'set_x_to', count: 2 }, { loop: true }]
        },
        {
          title: 'Add the Platform sprite',
          text: 'Click the highlighted button to add a second sprite - a flat wide costume works well. Name it something like <b>Platform</b>.',
          requires: [{ node: 'start' }, { node: 'selection', count: 5 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Platform: fall and reset',
          text: 'With <b>Platform</b> selected: <b>Set variable to random number</b> (name it <b>platX</b>, -150 to 150), a <b>Go to x y</b> at y <b>0</b> sourced from <b>platX</b> for x, and a <b>Change y by</b> of -2. Add a Selection checking <b>touching edge: bottom</b> - True: set <b>platX</b> to a new random number, then a second <b>Go to x y</b> at y <b>180</b> sourced from <b>platX</b>. Loop both paths back to <b>Change y by</b>.',
          requires: [{ node: 'start' }, { node: 'set_var_to_random', count: 2 }, { node: 'go_to_xy', count: 2 }, { node: 'change_y_by' }, { node: 'selection' }, { loop: true }],
          highlight: 'palette-set-var-to-random',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Add the Death sprite',
          text: 'Click the highlighted button again to add a third sprite - a wide flat costume spanning the stage works well. Name it something like <b>Death</b>, and position it at the very bottom of the stage.',
          requires: [{ node: 'start' }, { node: 'set_var_to_random', count: 2 }],
          highlight: 'add-sprite-btn',
          highlightLabel: 'Add a sprite here'
        },
        {
          title: 'Bounce on the platform, and game over',
          text: 'Switch back to your <b>player</b> sprite. Chain on a Selection checking <b>touching</b> your Platform sprite\'s name - True: <b>Set variable vy</b> to 8. Chain on one more Selection checking <b>touching</b> your Death sprite\'s name - True: a <b>Say</b> block ("Game Over!") then an <b>End</b>. Its False loops back into your existing loop.',
          requires: [{ node: 'start' }, { node: 'selection', count: 7 }, { node: 'say' }, { node: 'end' },
            { nodeWhere: { type: 'selection', field: 'condition', value: 'touching' }, label: 'A Selection checks touching' }],
          highlight: 'palette-selection',
          highlightLabel: 'Drag this onto the canvas'
        },
        {
          title: 'Try it!',
          text: 'Click the <b>green flag</b>. Bounce on the platform to stay alive - fall into the death zone and it\'s game over.<br><br><b>Challenge:</b> add 2-3 more Platform sprites at different starting heights so there\'s always something to land on.',
          requires: [],
          highlight: 'green-flag',
          highlightLabel: 'Click to run'
        }
      ]
    }
  ];
  // Categories are display-only grouping in the tutorial picker, the same
  // way PyScratch's own tutorialCategory() groups its (much larger) list -
  // an explicit `category` on the tutorial wins; anything without one falls
  // into a single default bucket so a new tutorial never has to remember to
  // set this before it'll show up somewhere.
  var FS_TUTORIAL_CATEGORY_ORDER = ['Flowchart Basics', 'Branching & Loops', 'Movement & Animation', 'Code Organisation', 'Games'];
  function fsTutorialCategory(t) { return t.category || 'Flowchart Basics'; }
  function compareFsTutorialCategories(a, b) {
    var ai = FS_TUTORIAL_CATEGORY_ORDER.indexOf(a), bi = FS_TUTORIAL_CATEGORY_ORDER.indexOf(b);
    if (ai !== -1 || bi !== -1) { if (ai === -1) return 1; if (bi === -1) return -1; return ai - bi; }
    return a.localeCompare(b);
  }
  // ── Highlighting a real page element ─────────────────────────────────
  // Same technique pyscratch.js's own showHighlight/clearHighlight use: a
  // fixed-position pulsing box tracked onto a live element's
  // getBoundingClientRect() every frame, so it stays put through scrolling,
  // resizing, or the block panel re-rendering. Named presets (rather than
  // steps embedding raw selectors) keep the tutorial data readable and
  // give future tutorials a stable name to highlight instead of a stable
  // selector - TurboWarp's own class names are hashed and can change.
  var FS_HIGHLIGHT_PRESETS = {
    'tutorials-btn':      '#fsTutorialsBtn',
    // TurboWarp's own green flag / stop buttons - same best-effort selector
    // pyscratch.js's own HIGHLIGHT_PRESETS uses, since this file deliberately
    // keeps no shared module with that one (see this file's header comment).
    'green-flag':         '[class*="green-flag_"],[class*="greenFlag"],[aria-label*="Green Flag"],[title*="Green Flag"]',
    'stop':               '[class*="stop-all_"],[class*="stopAll"],[aria-label*="Stop All"],[title*="Stop"]',
    // TurboWarp's own sprite-panel "add a sprite" action menu button -
    // same best-effort selector pyscratch.js's own preset of the same
    // name uses, for the same reason as green-flag/stop above.
    'add-sprite-btn':     '[class*="action-menu_"],[class*="actionMenu_"]'
  };
  // 'palette-<type>' (dashes for underscores, e.g. 'palette-change-x-by')
  // resolves automatically to that TYPES key's own palette item, so a new
  // tutorial step never needs a hand-added preset entry just to point at
  // an existing block in the palette.
  function fsHighlightSelector(name) {
    if (FS_HIGHLIGHT_PRESETS[name]) return FS_HIGHLIGHT_PRESETS[name];
    if (name.indexOf('palette-') === 0) {
      var typeKey = name.slice('palette-'.length).replace(/-/g, '_');
      if (TYPES[typeKey]) return '.fs-palette-item[data-type="' + typeKey + '"]';
    }
    return name;
  }
  var _fsHlBox = null, _fsHlRafId = null, _fsHlTargetEl = null;
  function _fsEnsureHighlightBox() {
    if (_fsHlBox) return;
    _fsHlBox = document.createElement('div');
    _fsHlBox.id = 'fs-hl';
    _fsHlBox.innerHTML = '<span id="fs-hl-label"></span>';
    document.body.appendChild(_fsHlBox);
  }
  function _fsPositionHighlight() {
    if (!_fsHlBox || !_fsHlTargetEl) return;
    var r = _fsHlTargetEl.getBoundingClientRect();
    if (!r.width && !r.height) return;
    var P = 5;
    _fsHlBox.style.left = (r.left - P) + 'px';
    _fsHlBox.style.top = (r.top - P) + 'px';
    _fsHlBox.style.width = (r.width + P * 2) + 'px';
    _fsHlBox.style.height = (r.height + P * 2) + 'px';
  }
  function showFsHighlight(targetOrSelector, label) {
    _fsEnsureHighlightBox();
    clearFsHighlight();
    var sel = fsHighlightSelector(targetOrSelector);
    var el = null;
    try { el = sel ? document.querySelector(sel) : null; } catch (e) {}
    if (!el) return;
    _fsHlTargetEl = el;
    var labelEl = document.getElementById('fs-hl-label');
    if (labelEl) { labelEl.textContent = label || ''; labelEl.style.display = label ? '' : 'none'; }
    _fsPositionHighlight();
    _fsHlBox.style.display = 'block';
    (function track() { _fsPositionHighlight(); _fsHlRafId = requestAnimationFrame(track); })();
  }
  function clearFsHighlight() {
    if (_fsHlRafId) { cancelAnimationFrame(_fsHlRafId); _fsHlRafId = null; }
    if (_fsHlBox) _fsHlBox.style.display = 'none';
    _fsHlTargetEl = null;
  }

  // ── Before/after snapshots for the resume-or-restart and finish-or-exit
  // dialogs ─────────────────────────────────────────────────────────────
  // FlowScratch's graph is always a small, well-formed nodes/edges object
  // (unlike PyScratch's freely-typed code, which can be left mid-edit or
  // syntactically broken), so a plain localStorage JSON blob via the same
  // graphSnapshot()/restoreGraph() the undo stack already uses is enough -
  // no need for PyScratch's heavier IndexedDB SB3-blob snapshot mechanism.
  function _fsTutSnapshotKey(tutId) { return 'flowscratchTutSnapshot_v1:' + tutId; }
  function saveFsTutSnapshot(tutId) {
    try { localStorage.setItem(_fsTutSnapshotKey(tutId), graphSnapshot()); } catch (e) {}
  }
  function hasFsTutSnapshot(tutId) {
    try { return !!localStorage.getItem(_fsTutSnapshotKey(tutId)); } catch (e) { return false; }
  }
  function restoreFsTutSnapshot(tutId) {
    try {
      var snap = localStorage.getItem(_fsTutSnapshotKey(tutId));
      if (snap) restoreGraph(snap);
    } catch (e) {}
  }
  function clearFsTutSnapshot(tutId) {
    try { localStorage.removeItem(_fsTutSnapshotKey(tutId)); } catch (e) {}
  }

  // ── Small modal dialog, reused for both the resume-or-start-fresh choice
  // (opening a tutorial with saved progress) and the keep-or-restore choice
  // (finishing or exiting one) - same shape as pyscratch.js's own
  // showTutDialog(), an icon/title/body plus a row of caller-supplied
  // buttons, styled to match FlowScratch's own green tutorial palette
  // instead of copying PyScratch's colours wholesale.
  function showFsTutDialog(icon, title, bodyHtml, buttons) {
    var dlg = document.getElementById('fs-tut-dialog');
    if (!dlg) return;
    dlg.querySelector('#fs-td-icon').textContent = icon || '📚';
    dlg.querySelector('#fs-td-title').textContent = title;
    dlg.querySelector('#fs-td-body').innerHTML = bodyHtml;
    var btnsEl = dlg.querySelector('#fs-td-btns');
    btnsEl.innerHTML = '';
    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fs-td-btn ' + (b.cls || 'fs-td-secondary');
      btn.textContent = b.label;
      btn.addEventListener('click', function () { dlg.classList.remove('show'); if (b.cb) b.cb(); });
      btnsEl.appendChild(btn);
    });
    dlg.classList.add('show');
    dlg.onclick = function (e) {
      if (e.target === dlg) { dlg.classList.remove('show'); if (buttons[0] && buttons[0].cb) buttons[0].cb(); }
    };
  }

  var FS_TUT_STORAGE_KEY = 'flowscratchTutorialProgress_v1';
  var fsTutState = (function () {
    try { return JSON.parse(localStorage.getItem(FS_TUT_STORAGE_KEY) || '{}'); } catch (e) { return {}; }
  })();
  function saveFsTutorialProgress() {
    try { localStorage.setItem(FS_TUT_STORAGE_KEY, JSON.stringify(fsTutState)); } catch (e) {}
  }
  var activeFsTutorial = null; // { tutIdx, stepIdx }
  function currentFsTutorialStep() {
    if (!activeFsTutorial) return null;
    return FS_TUTORIALS[activeFsTutorial.tutIdx].steps[activeFsTutorial.stepIdx];
  }
  function fsTutorialOutEdges(id) { return FS.edges.filter(function (e) { return e.from === id; }); }
  function fsTutorialReachableFrom(startId) {
    var seen = {};
    (function walk(id) { if (seen[id]) return; seen[id] = true; fsTutorialOutEdges(id).forEach(function (e) { walk(e.to); }); })(startId);
    return seen;
  }
  function tutorialRequirementMet(req) {
    if (req.node) return FS.nodes.filter(function (n) { return n.type === req.node; }).length >= (req.count || 1);
    // { path: true } keeps its original meaning (Start reaches an End);
    // { path: 'sometype' } generalises it to "Start reaches a node of that
    // TYPES key" - e.g. { path: 'move_steps' } for a tutorial that doesn't
    // use an End block at all (a "forever" loop), grown the same
    // incremental way this whole requirement checker already has.
    if (req.path) {
      var starts = FS.nodes.filter(function (n) { return n.type === 'start'; });
      var targetType = req.path === true ? 'end' : req.path;
      var targets = FS.nodes.filter(function (n) { return n.type === targetType; });
      return starts.some(function (s) {
        var seen = fsTutorialReachableFrom(s.id);
        return targets.some(function (t) { return seen[t.id]; });
      });
    }
    // { nodeWhere: { type, field, value, count } } - a node of that type
    // exists whose data[field] matches value, e.g. a Selection block whose
    // condition is actually set to 'key'. Coarser than PyScratch's own
    // literal-line matching would be for the same idea, but the same
    // "a real structural fact" principle applied to a single field instead
    // of a whole node's existence.
    if (req.nodeWhere) {
      var w = req.nodeWhere;
      return FS.nodes.filter(function (n) {
        return n.type === w.type && n.data && String(n.data[w.field]) === String(w.value);
      }).length >= (w.count || 1);
    }
    // A "forever"/counted loop is a wire connected back to an earlier
    // block - the same directed-cycle check validate() already uses to
    // decide whether a flow without an End block is still valid (its own
    // hasCycleFrom() helper, reused here rather than duplicated).
    if (req.loop) {
      var loopStarts = FS.nodes.filter(function (n) { return n.type === 'start'; });
      var out = function (id) { return fsTutorialOutEdges(id).map(function (e) { return e.to; }); };
      return loopStarts.some(function (s) { return hasCycleFrom(s.id, out); });
    }
    return false;
  }
  function tutorialRequirementLabel(req) {
    // An explicit label always wins - lets a step spell out what a plain
    // node/path/loop check can't say on its own (e.g. *which* key a
    // Selection block should be checking), without inventing a stricter,
    // more fragile requirement shape just to render better checklist text.
    if (req.label) return req.label;
    if (req.node) {
      var label = (TYPES[req.node] && TYPES[req.node].title) || req.node;
      return req.count > 1 ? label + ' ×' + req.count : label;
    }
    if (req.path) return 'Connected: Start → … → ' + ((TYPES[req.path === true ? 'end' : req.path] || {}).title || 'End');
    if (req.loop) return 'A connection looping back to an earlier block';
    if (req.nodeWhere) return (TYPES[req.nodeWhere.type] && TYPES[req.nodeWhere.type].title) || req.nodeWhere.type;
    return 'Unknown requirement';
  }
  function fsTutorialRequiresMet(requires) { return (requires || []).every(tutorialRequirementMet); }

  function renderFsTutorialStep() {
    if (!activeFsTutorial) return;
    var bar = document.getElementById('fs-tutorial-bar');
    if (!bar) return;
    var tut = FS_TUTORIALS[activeFsTutorial.tutIdx];
    var step = tut.steps[activeFsTutorial.stepIdx];
    bar.querySelector('#fs-tut-name').textContent = tut.title;
    bar.querySelector('#fs-tut-stepcount').textContent = 'Step ' + (activeFsTutorial.stepIdx + 1) + '/' + tut.steps.length;
    bar.querySelector('#fs-tut-title').textContent = step.title;
    bar.querySelector('#fs-tut-text').innerHTML = step.text;
    bar.querySelector('#fs-tut-dots').innerHTML = tut.steps.map(function (s, i) {
      var cls = i < activeFsTutorial.stepIdx ? 'done' : (i === activeFsTutorial.stepIdx ? 'cur' : '');
      return '<span class="fs-tut-dot ' + cls + '"></span>';
    }).join('');
    bar.querySelector('#fs-tut-back').disabled = activeFsTutorial.stepIdx === 0;
    updateFsTutorialChecklist();
    // Highlight a palette item / TurboWarp control if this step asks for
    // one, same as pyscratch.js's applyTutBar does for its own steps -
    // cleared automatically on the next step render or on exit.
    if (step.highlight) showFsHighlight(step.highlight, step.highlightLabel || '');
    else clearFsHighlight();
  }
  // Called from renderAll() on every graph change (a block dropped, a wire
  // connected/removed) so the checklist and Next button react live, the
  // same "recheck on every relevant change, not just on demand" approach
  // Farmer's own renderTutorialChecklist() already uses. No-ops instantly
  // whenever no tutorial is active, which is the common case.
  function updateFsTutorialChecklist() {
    if (!activeFsTutorial) return;
    var bar = document.getElementById('fs-tutorial-bar');
    if (!bar) return;
    var step = currentFsTutorialStep();
    if (!step) return;
    bar.querySelector('#fs-tut-checklist').innerHTML = (step.requires || []).map(function (req) {
      var ok = tutorialRequirementMet(req);
      return '<div class="fs-tut-check' + (ok ? ' ok' : '') + '"><span class="fs-tut-check-icon"></span>' + esc(tutorialRequirementLabel(req)) + '</div>';
    }).join('');
    var tut = FS_TUTORIALS[activeFsTutorial.tutIdx];
    var isLast = activeFsTutorial.stepIdx === tut.steps.length - 1;
    var nextBtn = bar.querySelector('#fs-tut-next');
    nextBtn.disabled = !fsTutorialRequiresMet(step.requires);
    nextBtn.textContent = isLast ? 'Finish ✓' : 'Next ▶';
  }
  function goToFsTutorialStep(delta) {
    if (!activeFsTutorial) return;
    var tut = FS_TUTORIALS[activeFsTutorial.tutIdx];
    var next = activeFsTutorial.stepIdx + delta;
    if (next < 0 || next >= tut.steps.length) return;
    activeFsTutorial.stepIdx = next;
    fsTutState[tut.id] = { stepIdx: next, completed: false };
    saveFsTutorialProgress();
    renderFsTutorialStep();
  }
  // Tells the parent frame (the Bloomsbury Computing shell, if embedded
  // there) that a tutorial was just completed, so it can be recorded
  // against the signed-in student and shown to their teacher - same
  // protocol shape as pyscratch.js's own reportTutorialCompletion(), just
  // a different message type so the two apps' completions are told apart
  // server-side. No-op standalone or outside an iframe.
  function reportFsTutorialCompletion(tut) {
    try {
      if (!window.parent || window.parent === window) return;
      window.parent.postMessage({ type: 'FS_TUTORIAL_COMPLETE', tutorialId: tut.id, tutorialTitle: tut.title }, '*');
    } catch (e) {}
  }
  function advanceOrCompleteFsTutorial() {
    var tut = FS_TUTORIALS[activeFsTutorial.tutIdx];
    if (activeFsTutorial.stepIdx === tut.steps.length - 1) exitFsTutorial(true);
    else goToFsTutorialStep(1);
  }
  // Opening a tutorial: fresh start snapshots the current graph as a
  // "before" baseline (so exiting/finishing can offer to restore it, same
  // pairing as pyscratch.js's saveTutSnapshot()+exitTutorial() dialogs),
  // while resuming leaves the graph exactly as the student left it -
  // FlowScratch's graph is always well-formed, unlike arbitrary typed
  // code, so unlike PyScratch's own resume there is nothing to fix up.
  function startFsTutorial(tutIdx) {
    var tut = FS_TUTORIALS[tutIdx];
    if (!tut || !els.overlay) return;
    var saved = fsTutState[tut.id];
    if (saved && !saved.completed && saved.stepIdx > 0) {
      showFsTutDialog('📚', tut.title,
        'You left off at <b>Step ' + (saved.stepIdx + 1) + ' of ' + tut.steps.length + '</b>. Want to pick up where you left off?',
        [
          { label: 'Resume →', cls: 'fs-td-primary', cb: function () { _doStartFsTutorial(tutIdx, Math.min(saved.stepIdx, tut.steps.length - 1)); } },
          { label: 'Start Fresh', cls: 'fs-td-secondary', cb: function () {
              fsTutState[tut.id] = { stepIdx: 0, completed: false };
              saveFsTutorialProgress();
              saveFsTutSnapshot(tut.id); // new baseline: today's messy state, not the very first one
              _doStartFsTutorial(tutIdx, 0);
          }}
        ]);
    } else {
      saveFsTutSnapshot(tut.id);
      _doStartFsTutorial(tutIdx, 0);
    }
    closeTutorialPicker();
  }
  function _doStartFsTutorial(tutIdx, stepIdx) {
    activeFsTutorial = { tutIdx: tutIdx, stepIdx: stepIdx };
    els.overlay.classList.add('fs-tutorial-active');
    fsTutState[FS_TUTORIALS[tutIdx].id] = { stepIdx: stepIdx, completed: false };
    saveFsTutorialProgress();
    renderFsTutorialStep();
  }
  function _doExitFsTutorial() {
    activeFsTutorial = null;
    clearFsHighlight();
    if (els.overlay) els.overlay.classList.remove('fs-tutorial-active');
  }
  // Public exit - offers to keep or restore the graph, same as
  // pyscratch.js's own exitTutorial(isFinished): a Keep/Restore choice on
  // manual exit, and a congratulations dialog with the same choice on
  // finishing (which is why the "Next" button on the last step routes
  // here via advanceOrCompleteFsTutorial() instead of finishing in place).
  function exitFsTutorial(isFinished) {
    if (!activeFsTutorial) { _doExitFsTutorial(); return; }
    var tutIdx = activeFsTutorial.tutIdx;
    var tut = FS_TUTORIALS[tutIdx];
    var hasSnap = hasFsTutSnapshot(tut.id);
    if (isFinished) {
      fsTutState[tut.id] = { stepIdx: tut.steps.length - 1, completed: true };
      saveFsTutorialProgress();
      reportFsTutorialCompletion(tut);
    }
    if (!hasSnap) { _doExitFsTutorial(); return; }
    var icon = isFinished ? '🎉' : '📚';
    var title = isFinished ? 'Tutorial complete!' : 'Exit tutorial';
    var body = isFinished
      ? 'Great work finishing <b>' + esc(tut.title) + '</b>! What would you like to do with the flowchart you built?'
      : 'What would you like to do with the changes you made during <b>' + esc(tut.title) + '</b>?';
    showFsTutDialog(icon, title, body, [
      { label: 'Keep My Flowchart', cls: 'fs-td-primary', cb: function () { clearFsTutSnapshot(tut.id); _doExitFsTutorial(); } },
      { label: 'Restore Original', cls: 'fs-td-danger', cb: function () {
          restoreFsTutSnapshot(tut.id);
          clearFsTutSnapshot(tut.id);
          _doExitFsTutorial();
      }}
    ]);
  }
  function fsTutorialCardHtml(tut, i) {
    var prog = fsTutState[tut.id];
    var status = '';
    var resetBtn = '';
    if (prog && prog.completed) status = '<span class="fs-tut-card-status">Done</span>';
    else if (prog && prog.stepIdx > 0) status = '<span class="fs-tut-card-status prog">Step ' + (prog.stepIdx + 1) + '/' + tut.steps.length + '</span>';
    if (prog && (prog.completed || prog.stepIdx > 0)) {
      resetBtn = '<button type="button" class="fs-tut-card-reset" data-tut="' + i + '" title="Clear saved progress">&#8634;</button>';
    }
    return '<div class="fs-tut-card-wrap">' +
      '<button type="button" class="fs-tut-card" data-tut="' + i + '">' +
        '<span class="fs-tut-card-badge" style="background:' + tut.color + '">' + esc(tut.title.charAt(0)) + '</span>' +
        '<span class="fs-tut-card-body"><span class="fs-tut-card-title">' + esc(tut.title) + '</span>' +
        '<span class="fs-tut-card-desc">' + esc(tut.desc) + '</span></span>' + status +
      '</button>' + resetBtn +
    '</div>';
  }
  // Grouped under collapsible categories the same way pyscratch.js's own
  // buildTutorialGroupsHTML does - with only one tutorial today this is a
  // single open group, but it means a second and third tutorial slot
  // straight into the picker without this view needing to change again.
  function renderTutorialPicker() {
    var list = document.getElementById('fs-tut-picker-list');
    if (!list) return;
    var groups = {};
    FS_TUTORIALS.forEach(function (tut, i) {
      var cat = fsTutorialCategory(tut);
      (groups[cat] = groups[cat] || []).push({ tut: tut, i: i });
    });
    var catKeys = Object.keys(groups).sort(compareFsTutorialCategories);
    list.innerHTML = catKeys.map(function (cat, catIdx) {
      var cards = groups[cat].map(function (entry) { return fsTutorialCardHtml(entry.tut, entry.i); }).join('');
      return '<details class="fs-tut-cat"' + (catIdx === 0 ? ' open' : '') + '>' +
        '<summary class="fs-tut-cat-summary"><span class="fs-tut-cat-chevron">&#8250;</span><span>' + esc(cat) + '</span>' +
        '<span class="fs-tut-cat-count">' + groups[cat].length + '</span></summary>' +
        '<div class="fs-tut-cat-list">' + cards + '</div>' +
      '</details>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.fs-tut-card'), function (card) {
      card.addEventListener('click', function () { startFsTutorial(parseInt(card.dataset.tut, 10)); });
    });
    Array.prototype.forEach.call(list.querySelectorAll('.fs-tut-card-reset'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var tut = FS_TUTORIALS[parseInt(btn.dataset.tut, 10)];
        if (!tut) return;
        delete fsTutState[tut.id];
        saveFsTutorialProgress();
        clearFsTutSnapshot(tut.id);
        renderTutorialPicker();
      });
    });
  }
  function openTutorialPicker() {
    renderTutorialPicker();
    var modal = document.getElementById('fs-tut-picker-modal');
    if (modal) modal.classList.add('show');
  }
  function closeTutorialPicker() {
    var modal = document.getElementById('fs-tut-picker-modal');
    if (modal) modal.classList.remove('show');
  }
  // Builds the tutorial bar + picker modal as their own DOM subtree,
  // appended after buildUI() rather than spliced into its own already-
  // large innerHTML literal - keeps this whole feature a self-contained,
  // independently reviewable addition.
  function buildTutorialUI() {
    if (!els.overlay || document.getElementById('fs-tutorial-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'fs-tutorial-bar';
    bar.innerHTML =
      '<div id="fs-tut-scroll">' +
        '<div id="fs-tut-head">' +
          '<div id="fs-tut-titlewrap"><span id="fs-tut-name"></span><span id="fs-tut-stepcount"></span></div>' +
          '<button type="button" id="fs-tut-exit" title="Exit tutorial">&times;</button>' +
        '</div>' +
        '<div id="fs-tut-dots"></div>' +
        '<div id="fs-tut-title"></div>' +
        '<div id="fs-tut-text"></div>' +
        '<div id="fs-tut-checklist"></div>' +
      '</div>' +
      '<div id="fs-tut-foot"><button type="button" id="fs-tut-back">&laquo; Back</button><button type="button" id="fs-tut-next">Next</button></div>';
    var topbar = els.overlay.querySelector('#fs-topbar');
    if (topbar && topbar.nextSibling) topbar.parentNode.insertBefore(bar, topbar.nextSibling);
    else els.overlay.appendChild(bar);

    var modal = document.createElement('div');
    modal.id = 'fs-tut-picker-modal';
    modal.innerHTML =
      '<div id="fs-tut-picker-card">' +
        '<div id="fs-tut-picker-head"><h2>Tutorials</h2><button type="button" id="fs-tut-picker-close" aria-label="Close">&times;</button></div>' +
        '<div id="fs-tut-picker-list"></div>' +
      '</div>';
    els.overlay.appendChild(modal);

    var dlg = document.createElement('div');
    dlg.id = 'fs-tut-dialog';
    dlg.innerHTML =
      '<div id="fs-td-card">' +
        '<div id="fs-td-icon"></div>' +
        '<div id="fs-td-title"></div>' +
        '<div id="fs-td-body"></div>' +
        '<div id="fs-td-btns"></div>' +
      '</div>';
    els.overlay.appendChild(dlg);

    var tutBtn = document.createElement('button');
    tutBtn.id = 'fsTutorialsBtn';
    tutBtn.type = 'button';
    tutBtn.textContent = 'Tutorials';
    var diagramBtn = els.overlay.querySelector('#fsDiagramBtn');
    if (diagramBtn && diagramBtn.parentNode) diagramBtn.parentNode.insertBefore(tutBtn, diagramBtn.nextSibling);

    tutBtn.addEventListener('click', openTutorialPicker);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeTutorialPicker(); });
    modal.querySelector('#fs-tut-picker-close').addEventListener('click', closeTutorialPicker);
    // Wrapped, not passed directly - exitFsTutorial(isFinished) must not
    // receive the click Event object itself as a truthy "isFinished".
    bar.querySelector('#fs-tut-exit').addEventListener('click', function () { exitFsTutorial(false); });
    bar.querySelector('#fs-tut-back').addEventListener('click', function () { goToFsTutorialStep(-1); });
    bar.querySelector('#fs-tut-next').addEventListener('click', function () {
      var step = currentFsTutorialStep();
      if (step && fsTutorialRequiresMet(step.requires)) advanceOrCompleteFsTutorial();
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  waitFor(function () { return (window.vm && window.vm.runtime) ? window.vm : null; }).then(function (vm) {
    FS.vm = vm;
    // Opt-in only (add ?fsdebug to the URL): exposes the closure state and
    // a few mutators that are otherwise unreachable from outside this IIFE,
    // for driving/inspecting a real run from the console instead of only
    // through simulated clicks - how the two run-loop bugs fixed alongside
    // this were actually found and measured. No effect unless requested.
    if (/fsdebug/.test(location.search)) { window.__FS = FS; window.__addNode = addNode; window.__addEdge = addEdge; window.__renderAll = renderAll; window.__run = run; }
    buildUI();
    buildTutorialUI();
    updateTransform();
    syncSelectedSprite();
    setInterval(syncSelectedSprite, 500);
    setTimeout(adjustOverlay, 400);
    setTimeout(adjustOverlay, 1200);
    window.addEventListener('resize', adjustOverlay);
    try { vm.runtime.on('TARGETS_UPDATE', adjustOverlay); } catch (e) {}
    watchTurboWarpTabsAndModals();

    // Hook TurboWarp's green flag -> run the active sprite's flowchart
    // (run(), driving the visible canvas) AND every other sprite's own
    // saved flowchart concurrently in the background - real Scratch runs
    // every sprite's scripts at once, not just whichever one you have
    // open for editing.
    try {
      vm.runtime.on('PROJECT_START', function () {
        setTimeout(function () { run(); runAllOtherSpritesFlowcharts(); }, 0);
      });
    } catch (e) {}

    // Hook TurboWarp's stop button -> stop the active sprite's flowchart
    // and every background one too.
    try {
      var origStop = vm.stopAll.bind(vm);
      vm.stopAll = function () { stop(); stopAllBackgroundFlows(); return origStop(); };
    } catch (e) {}
    try {
      var origRtStop = vm.runtime.stopAll.bind(vm.runtime);
      vm.runtime.stopAll = function () { stop(); stopAllBackgroundFlows(); return origRtStop(); };
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
