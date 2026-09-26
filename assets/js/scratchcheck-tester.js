// Scratch Challenges, part 2 of 5: drives the student's real project.
//
// A task's test is an async function given a Tester `t`. It plays the
// project the way a person would (green flag, keys, mouse, clicks, typed
// answers) through the TurboWarp vm, watches what the sprites do, and
// calls t.fail('what I saw') when the behaviour is wrong. Tests describe
// behaviour, never a particular arrangement of blocks, so any working
// solution passes; a few also read the blocks where the task names a block
// ("use a repeat loop").
(function () {
  'use strict';
  if (!/[?&]scratchcheck/.test(location.search)) return;

  function CheckFail(message) { this.message = message; }

  function Tester(vm) {
    this.vm = vm;
    this.runtime = vm.runtime;
    this.traces = {};
    this.stopSeen = false;
    this.keysDown = {};
    this.selfStopping = false;
    var self = this;
    this.onStop = function () { if (!self.selfStopping) self.stopSeen = true; };
  }

  Tester.prototype.begin = function () {
    var self = this;
    this.runtime.on('PROJECT_STOP_ALL', this.onStop);
    // Every position change, even several in one frame, goes into the
    // moving sprite's trace (glides and loops that move without yielding).
    var sample = this.runtime.targets.filter(function (t) { return !t.isStage; })[0];
    if (sample) {
      var proto = Object.getPrototypeOf(sample);
      this.proto = proto;
      this.origSetXY = proto.setXY;
      proto.setXY = function (x, y, force) {
        self.origSetXY.call(this, x, y, force);
        if (!this.isOriginal) return;
        var list = self.traces[this.getName()];
        if (list && list.length < 5000) list.push({ x: this.x, y: this.y, at: Date.now() });
      };
    }
  };

  Tester.prototype.end = function () {
    this.runtime.removeListener('PROJECT_STOP_ALL', this.onStop);
    if (this.proto && this.origSetXY) this.proto.setXY = this.origSetXY;
    this.releaseKeys();
  };

  // ---- flow ----
  Tester.prototype.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  Tester.prototype.until = function (test, timeoutMs) {
    var started = Date.now();
    return new Promise(function (resolve, reject) {
      (function tick() {
        var ok = false;
        try { ok = !!test(); } catch (e) { if (e instanceof CheckFail) return reject(e); }
        if (ok) return resolve(true);
        if (Date.now() - started > (timeoutMs || 2000)) return resolve(false);
        setTimeout(tick, 16);
      })();
    });
  };
  Tester.prototype.fail = function (message) { throw new CheckFail(message); };
  Tester.prototype.check = function (ok, message) { if (!ok) throw new CheckFail(message); };
  Tester.prototype.near = function (a, b, tolerance) { return Math.abs(Number(a) - Number(b)) <= (tolerance == null ? 1 : tolerance); };

  Tester.prototype.stop = function () {
    this.selfStopping = true;
    try { this.vm.stopAll(); } finally { this.selfStopping = false; }
    this.releaseKeys();
  };
  Tester.prototype.flag = function (settleMs) {
    this.stop();
    this.clearTraces();
    // The green flag stops everything first; that stop is not the project's.
    this.selfStopping = true;
    try { this.vm.greenFlag(); } finally { this.selfStopping = false; }
    this.stopSeen = false;
    return this.wait(settleMs == null ? 250 : settleMs);
  };
  Tester.prototype.running = function () { return this.runtime.threads.length > 0; };

  // ---- sprites ----
  Tester.prototype.findSprite = function (name) {
    var wanted = String(name).toLowerCase();
    return this.runtime.targets.filter(function (t) {
      return !t.isStage && t.isOriginal && t.getName().toLowerCase() === wanted;
    })[0] || null;
  };
  Tester.prototype.sprite = function (name) {
    var target = this.findSprite(name);
    if (!target) this.fail('I cannot find a sprite called ' + name + '. Keep the sprite names from the starter project.');
    return target;
  };
  Tester.prototype.spriteNames = function () {
    return this.runtime.targets.filter(function (t) { return !t.isStage && t.isOriginal; }).map(function (t) { return t.getName(); });
  };
  Tester.prototype.place = function (name, x, y, direction) {
    var target = this.sprite(name);
    target.setXY(x, y, true);
    if (direction != null) target.setDirection(direction);
    return target;
  };
  Tester.prototype.pos = function (name) {
    var target = this.sprite(name);
    return { x: Math.round(target.x * 10) / 10, y: Math.round(target.y * 10) / 10 };
  };
  Tester.prototype.where = function (name) {
    var p = this.pos(name);
    return 'x: ' + Math.round(p.x) + ', y: ' + Math.round(p.y);
  };
  Tester.prototype.clearTraces = function () {
    var self = this;
    this.traces = {};
    this.spriteNames().forEach(function (n) { self.traces[n] = []; });
  };
  Tester.prototype.trace = function (name) { return (this.traces[this.sprite(name).getName()] || []).slice(); };
  // Did the trace pass through every point, in order (within `tolerance`)?
  Tester.prototype.visitedInOrder = function (name, points, tolerance) {
    var trace = this.trace(name), at = 0, self = this;
    var reached = 0;
    points.forEach(function (p) {
      for (var i = at; i < trace.length; i++) {
        if (self.near(trace[i].x, p[0], tolerance || 2) && self.near(trace[i].y, p[1], tolerance || 2)) {
          at = i; reached += 1; return;
        }
      }
      at = trace.length;
    });
    return reached;
  };
  Tester.prototype.saying = function (name) {
    var state = this.sprite(name).getCustomState('Scratch.looks');
    return state && state.text ? String(state.text) : '';
  };
  Tester.prototype.said = function (name, words) {
    var clean = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    return clean(this.saying(name)) === clean(words);
  };
  Tester.prototype.costume = function (name) {
    var target = this.sprite(name);
    var list = target.getCostumes();
    return list[target.currentCostume] ? list[target.currentCostume].name : '';
  };
  Tester.prototype.backdrop = function () {
    var stage = this.runtime.getTargetForStage();
    var list = stage.getCostumes();
    return list[stage.currentCostume] ? list[stage.currentCostume].name : '';
  };
  Tester.prototype.touching = function (a, b) {
    return this.sprite(a).isTouchingSprite(this.sprite(b).getName());
  };

  // ---- variables (any sprite or the stage, name not case-sensitive) ----
  Tester.prototype.findVariable = function (name) {
    var wanted = String(name).toLowerCase().trim();
    var targets = [this.runtime.getTargetForStage()].concat(this.runtime.targets.filter(function (t) { return !t.isStage && t.isOriginal; }));
    for (var i = 0; i < targets.length; i++) {
      var vars = targets[i].variables;
      for (var id in vars) {
        if (vars[id].type === '' && String(vars[id].name).toLowerCase().trim() === wanted) return vars[id];
      }
    }
    return null;
  };
  Tester.prototype.variable = function (name) {
    var v = this.findVariable(name);
    if (!v) this.fail('I cannot find a variable called ' + name + '. Make one with Make a Variable.');
    return v;
  };
  Tester.prototype.value = function (name) {
    var n = Number(this.variable(name).value);
    return isNaN(n) ? this.variable(name).value : n;
  };
  Tester.prototype.setValue = function (name, value) { this.variable(name).value = value; };

  // ---- input ----
  var KEY_NAMES = { right: 'ArrowRight', left: 'ArrowLeft', up: 'ArrowUp', down: 'ArrowDown', space: ' ' };
  Tester.prototype.keyEvent = function (key, isDown) {
    var name = KEY_NAMES[key] || key;
    this.vm.postIOData('keyboard', { key: name, isDown: isDown });
    if (isDown) this.keysDown[key] = true; else delete this.keysDown[key];
  };
  Tester.prototype.releaseKeys = function () {
    var self = this;
    Object.keys(this.keysDown).forEach(function (k) { self.keyEvent(k, false); });
  };
  // One tap: key down, a short pause, key up.
  Tester.prototype.press = function (key) {
    var self = this;
    this.keyEvent(key, true);
    return this.wait(90).then(function () { self.keyEvent(key, false); return self.wait(160); });
  };
  // Held down, with the keyboard's own repeat, the way a player holds a key.
  Tester.prototype.hold = function (key, ms) {
    var self = this, until = Date.now() + (ms || 500);
    return new Promise(function (resolve) {
      (function again() {
        self.keyEvent(key, true);
        if (Date.now() < until) setTimeout(again, 50);
        else { self.keyEvent(key, false); setTimeout(resolve, 120); }
      })();
    });
  };
  Tester.prototype.mouse = function (x, y) {
    var w = this.runtime.stageWidth || 480, h = this.runtime.stageHeight || 360;
    this.vm.postIOData('mouse', { x: x + w / 2 + 0.001, y: h / 2 - y + 0.001, canvasWidth: w, canvasHeight: h });
  };
  Tester.prototype.click = function (name) {
    var target = this.sprite(name);
    this.runtime.startHats('event_whenthisspriteclicked', null, target);
    return this.wait(120);
  };
  Tester.prototype.answer = function (text) { this.runtime.emit('ANSWER', String(text)); return this.wait(150); };
  Tester.prototype.broadcast = function (message) {
    this.runtime.startHats('event_whenbroadcastreceived', { BROADCAST_OPTION: message });
    return this.wait(150);
  };

  // ---- blocks ----
  // Every block in a sprite (or all sprites and the stage when name is
  // omitted), as { opcode, fields, target } records.
  Tester.prototype.blocks = function (name) {
    var targets = name ? [this.sprite(name)] : this.runtime.targets.filter(function (t) { return t.isOriginal; });
    var out = [];
    targets.forEach(function (t) {
      var all = t.blocks._blocks;
      Object.keys(all).forEach(function (id) {
        var b = all[id];
        if (b.shadow) return;
        out.push({ id: id, opcode: b.opcode, fields: b.fields, target: t, block: b });
      });
    });
    return out;
  };
  Tester.prototype.uses = function (opcode, name) {
    return this.blocks(name).some(function (b) { return b.opcode === opcode; });
  };
  // Is a block with this opcode inside a script that starts with `hat`?
  Tester.prototype.usedUnder = function (hatOpcode, opcode, name) {
    return this.blocks(name).some(function (rec) {
      if (rec.opcode !== opcode) return false;
      var blocks = rec.target.blocks, id = rec.id;
      var top = blocks.getTopLevelScript ? blocks.getTopLevelScript(id) : null;
      if (!top) {
        var cur = rec.block;
        while (cur && cur.parent) cur = blocks.getBlock(cur.parent);
        top = cur ? cur.id : null;
      }
      var hat = top && blocks.getBlock(top);
      return !!hat && hat.opcode === hatOpcode;
    });
  };
  // Blocks and scripts as text, for spotting when nothing changed between checks.
  Tester.prototype.fingerprint = function () {
    return this.runtime.targets.filter(function (t) { return t.isOriginal; }).map(function (t) {
      var all = t.blocks._blocks;
      return t.getName() + ':' + Object.keys(all).sort().map(function (id) {
        var b = all[id];
        return b.opcode + JSON.stringify(b.fields) + (b.next || '') + JSON.stringify(b.inputs);
      }).join('|');
    }).join('#');
  };

  // ---- the project's state before a check, put back afterwards ----
  Tester.prototype.snapshot = function () {
    var targets = this.runtime.targets.filter(function (t) { return t.isOriginal; });
    return targets.map(function (t) {
      var vars = {};
      Object.keys(t.variables).forEach(function (id) {
        var v = t.variables[id];
        vars[id] = Array.isArray(v.value) ? v.value.slice() : v.value;
      });
      return { target: t, x: t.x, y: t.y, direction: t.direction, size: t.size, visible: t.visible,
        costume: t.currentCostume, rotationStyle: t.rotationStyle, effects: Object.assign({}, t.effects), vars: vars };
    });
  };
  Tester.prototype.restore = function (snap) {
    this.stop();
    snap.forEach(function (s) {
      var t = s.target;
      try {
        if (!t.isStage) {
          t.setXY(s.x, s.y, true);
          t.setDirection(s.direction);
          t.setSize(s.size);
          t.setVisible(s.visible);
          t.setRotationStyle(s.rotationStyle);
          Object.keys(s.effects).forEach(function (k) { t.setEffect(k, s.effects[k]); });
        }
        t.setCostume(s.costume);
        Object.keys(s.vars).forEach(function (id) { if (t.variables[id]) t.variables[id].value = s.vars[id]; });
      } catch (e) {}
    });
    try { this.vm.emitTargetsUpdate(false); } catch (e) {}
  };

  window.ScratchCheckTester = { Tester: Tester, CheckFail: CheckFail };
})();
