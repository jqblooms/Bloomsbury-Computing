'use strict';
// Machines: placing, levels, running their programs on a schedule, editing, selling and upgrading them.
// ============================================================
// MACHINES
// ============================================================
// Every machine is bought at Level 1. Each later level is an upgrade with
// its own increasing price. Levels 1 to 9 match their instruction rate;
// Level 10 is the final 15-instruction-per-second upgrade.
var MACHINE_LEVELS = [
  { level: 1, price: 30, instructionsPerSecond: 1, color: 0x6ea8fe },
  { level: 2, price: 50, instructionsPerSecond: 2, color: 0x62b7ed },
  { level: 3, price: 80, instructionsPerSecond: 3, color: 0x56c4d5 },
  { level: 4, price: 120, instructionsPerSecond: 4, color: 0x4fd1c5 },
  { level: 5, price: 180, instructionsPerSecond: 5, color: 0x69c879 },
  { level: 6, price: 260, instructionsPerSecond: 6, color: 0x8fc45b },
  { level: 7, price: 380, instructionsPerSecond: 7, color: 0xb8bd4f },
  { level: 8, price: 550, instructionsPerSecond: 8, color: 0xdfae49 },
  { level: 9, price: 800, instructionsPerSecond: 9, color: 0xff9347 },
  { level: 10, price: 1500, instructionsPerSecond: 15, color: 0xffd24d }
];
var MACHINE_SELL_REFUND = 0.5; // refunds half the machine's total purchase and upgrade spend

var MACHINE_CURSOR_COLOR = 0x2f6fe0;          // default, unselected
var MACHINE_CURSOR_SELECTED_COLOR = 0xff5fc1; // clearly different from both
                                               // the default blue and the
                                               // player's own gold arrow
var selectedMachineId = null;
var editingMachineCodeId = null; // set while the tile-info panel is showing the inline code editor

// Clicking a machine's body (see handleTileClick) calls this with that
// machine, or with null to clear the selection (clicking open ground).
// The selected machine's own roaming cursor turns pink so it stands out
// from every other machine's default blue one - useful as soon as there
// is more than one machine on the field at once.
function selectMachine(machine) {
  selectedMachineId = machine ? machine.id : null;
  machines.forEach(function (m) {
    var isSel = m.id === selectedMachineId;
    var color = isSel ? MACHINE_CURSOR_SELECTED_COLOR : MACHINE_CURSOR_COLOR;
    m.diamond.material.color.setHex(color);
    m.diamond.material.emissive.setHex(color);
    // The selected machine's own roaming cursor grows, so it stays easy to
    // pick out even when it is sitting on the machine's home tile right
    // next to the body (which is exactly where it starts).
    var s = isSel ? 1.7 : 1.0;
    m.diamond.scale.set(s, s, s);
  });
  updateTileInfoPanel();
}

function escapeHtmlLocal(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function createMachineMarkerGroup(bodyColor) {
  var group = new THREE.Group();

  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: bodyColor || 0x6ea8fe, metalness: 0.2, roughness: 0.4 })
  );
  body.position.y = 0.3;
  body.castShadow = true;
  group.add(body);

  var eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x0b1b3a, emissive: 0x274a8a, emissiveIntensity: 0.6 })
  );
  eye.position.set(0, 0.42, 0.2);
  group.add(eye);

  // The machine's own roaming cursor - visually distinct (blue diamond,
  // floats higher) from the player's gold arrow, so a machine mid-program
  // never reads as "the player moved". It's a small group, not a single
  // mesh, so it can carry its own facing indicator the same way the
  // player's cursorGroup does.
  var cursorMesh = new THREE.Group();
  var diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.15, 0),
    new THREE.MeshStandardMaterial({ color: MACHINE_CURSOR_COLOR, emissive: 0x123a8a, emissiveIntensity: 0.4 })
  );
  diamond.castShadow = true;
  cursorMesh.add(diamond);
  var facingIndicator = makeFacingIndicator(0xbfe0ff);
  cursorMesh.add(facingIndicator);

  return { group: group, cursorMesh: cursorMesh, facingIndicator: facingIndicator, diamond: diamond, body: body };
}

function positionMachineCursorMarker(machine) {
  machine.cursorMesh.position.set(tileWorldX(machine.cursor.x), 1.0, tileWorldZ(machine.cursor.z));
}

// Returns true only once the machine has actually been placed - the
// caller (machineBtn's click handler) uses this to decide whether the
// code box's contents were genuinely handed off (clear it) or the
// placement failed for some reason (leave the student's typing alone,
// nothing was lost).
// Movement/turn commands whose *literal*, constant-argument calls can be
// checked ahead of a machine's placement, without running the whole
// program for real: reuses runCommand() - the exact same dispatcher a live
// machine tick already uses - against a disposable scratch cursor, calling
// it only for movement/turn commands (never Plant/Buy/Sell - no economy
// side effects here, and onCursorMoved() is a safe no-op for a cursor that
// isn't the player's and has no .machine, so nothing visual updates either).
// Only literal numeric arguments (SetPosition(1, 0), not
// SetPosition(Xs[i], Zs[i])) can be checked this way without a full
// expression evaluator plus a simulated economy - a program using
// variables or array values for its offsets is silently skipped instead of
// guessed at, exactly as if this check didn't exist for it.
var MOVEMENT_COMMANDS = { MoveUp: 1, MoveDown: 1, MoveLeft: 1, MoveRight: 1, MoveForward: 1, TurnLeft: 1, TurnRight: 1, SetPosition: 1 };
// argsCode entries are compiled evaluator FUNCTIONS (see compileExpression),
// not the raw parse tree - astNode is the one property that still exposes
// it, stashed there for exactly this kind of static check.
function isLiteralConstArg(exprCode) {
  return typeof exprCode === 'function' && Array.isArray(exprCode.astNode) && exprCode.astNode[0] === EX_CONST;
}
function noopLog() {}
// True if every literal-argument movement/turn CALL in this program, run in
// sequence from a candidate machine home tile, never actually leaves it -
// almost always because the machine was placed too close to the field's
// edge and its own SetPosition/Move calls keep clamping right back onto
// itself. A machine stuck like that can never plant anywhere but its own
// tile, which always "has a machine standing on it" (itself) - so it can
// never plant at all, for a reason that isn't obvious just from reading
// the code, since the code itself is perfectly correct.
function machineWouldBeStuckAtHome(program, homeX, homeZ) {
  var sim = { x: homeX, z: homeZ, facing: 0, homeX: homeX, homeZ: homeZ };
  var sawCheckableMovement = false;
  for (var i = 0; i < program.length; i++) {
    var instr = program[i];
    if (instr.type !== 'CALL' || !MOVEMENT_COMMANDS[instr.name]) continue;
    if (!instr.argsCode.every(isLiteralConstArg)) continue;
    sawCheckableMovement = true;
    // Safe to evaluate right now with no real vars/cursor - isLiteralConstArg
    // already confirmed each one is a bare constant, so it can't actually
    // read either.
    var args = instr.argsCode.map(function (a) { return evaluateExpression(a, {}, sim, instr.line); });
    runCommand(instr.name, args, sim, noopLog, instr.line);
  }
  return sawCheckableMovement && sim.x === homeX && sim.z === homeZ;
}

function placeMachine(code) {
  var hasCode = !!code.trim();
  // A tutorial step that asks for a machine always wants it to actually do the step's
  // work, so an empty one there is just a "type the code first" mistake.
  if (!hasCode && tutorialMode) {
    logConsole('Write the code for this step first, then place the machine.', true);
    return false;
  }
  var compiledProgram;
  try {
    // Empty is allowed in free play: place a blank machine now, then click it and use
    // "Edit code" to give it instructions later. compile('') is just an empty program,
    // and runMachineInstruction already no-ops a machine with no instructions.
    compiledProgram = hasCode ? compile(code) : [];
  } catch (e) {
    setCodeError(e.line || 1);
    logConsole('Cannot place machine: ' + e.message, true);
    return false;
  }
  clearCodeError();
  var levelConfig = MACHINE_LEVELS[0];
  if (money < levelConfig.price) {
    logConsole('A Level 1 Machine costs ' + levelConfig.price + ' coins, but you only have ' + money + '.', true);
    return false;
  }
  var x = playerCursor.x, z = playerCursor.z;
  var tile = tileAt(x, z);
  if (!tile) { logConsole('There is no garden tile there.', true); return false; }
  if (tile.hasMachine) { logConsole('There is already a machine on this tile.', true); return false; }
  if (tile.plant) { logConsole('Clear the plant on this tile before placing a machine here.', true); return false; }
  // Tutorial-only lockout: refuse a placement that would leave the machine
  // permanently unable to do anything but fail (see
  // machineWouldBeStuckAtHome's own comment). Free play doesn't get this
  // block - an experienced player deliberately building an odd machine
  // shouldn't be second-guessed by a static check that can't see their
  // actual plan - but a tutorial's whole job is to guarantee this exact
  // step can be completed successfully, so here it's a hard stop with a
  // specific, actionable reason instead of a silent dead end discovered
  // only after the fact.
  if (tutorialMode && machineWouldBeStuckAtHome(compiledProgram, x, z)) {
    logConsole('Placing the machine here would trap it - its own movement clamps right back onto its own tile, so it could never plant anything. Move to a tile with more open space around it and try again.', true);
    return false;
  }

  money -= levelConfig.price;

  var built = createMachineMarkerGroup(levelConfig.color);
  built.group.position.set(tileWorldX(x), 0, tileWorldZ(z));
  scene.add(built.group);
  scene.add(built.cursorMesh);

  var machine = {
    id: nextMachineId++,
    homeX: x, homeZ: z,
    code: code,
    level: levelConfig.level,
    cost: levelConfig.price,
    instructionsPerSecond: levelConfig.instructionsPerSecond,
    intervalMs: Math.round(1000 / levelConfig.instructionsPerSecond),
    program: compiledProgram,
    runtime: { vars: {}, forEnds: {}, ifTaken: {}, pc: 0 },
    // The machine's own home tile is (0, 0) for its SetPosition calls -
    // see setPositionRelative().
    cursor: { x: x, z: z, facing: 0, homeX: x, homeZ: z },
    group: built.group,
    cursorMesh: built.cursorMesh,
    facingIndicator: built.facingIndicator,
    diamond: built.diamond,
    body: built.body,
    running: false
  };
  machine.cursor.machine = machine;
  // Tag every mesh in the machine's visible body so a raycast hit on any
  // part of it (see handleTileClick) resolves back to this machine.
  built.group.traverse(function (o) { if (o.isMesh) o.userData.machineId = machine.id; });
  tile.hasMachine = true;
  machines.push(machine);
  markGameDirty();
  positionMachineCursorMarker(machine);
  updateFacingIndicator(machine.facingIndicator, machine.cursor.facing);
  scheduleMachine(machine);
  updateHUD();
  logConsole('Level 1 Machine placed for ' + levelConfig.price + ' coins. It runs ' + machineRateLabel(machine) + '.' +
    (hasCode ? '' : ' It has no code yet - click it and choose "Edit code" to give it instructions.'));
  return true;
}

function buildMachineLevelNotice() {
  var container = document.getElementById('machine-tiers');
  container.innerHTML = 'All machines start at Level 1 &middot; 30c &middot; 1 instruction/s';
}
buildMachineLevelNotice();

function machineRateLabel(machine) {
  var rate = machine.instructionsPerSecond || 1;
  return rate + ' instruction' + (rate === 1 ? '' : 's') + ' per second';
}

function resetMachineRuntime(machine) {
  machine.runtime = { vars: {}, forEnds: {}, ifTaken: {}, pc: 0 };
}

function runMachineInstruction(machine) {
  var instructions = machine.program;
  if (!instructions || !instructions.length) return true;
  if (!machine.runtime || machine.runtime.pc >= instructions.length) resetMachineRuntime(machine);
  var runtime = machine.runtime;

  var instr = instructions[runtime.pc];
  if (instr.type === 'IF') {
    runtime.ifTaken[instr.rootIndex] = !!evaluateExpression(instr.conditionCode, runtime.vars, machine.cursor, instr.line);
    runtime.pc = runtime.ifTaken[instr.rootIndex] ? runtime.pc + 1 : instr.falseIndex;
    return false;
  }
  if (instr.type === 'ELSEIF') {
    if (runtime.ifTaken[instr.rootIndex]) {
      delete runtime.ifTaken[instr.rootIndex];
      runtime.pc = instr.endIndex + 1;
    } else {
      runtime.ifTaken[instr.rootIndex] = !!evaluateExpression(instr.conditionCode, runtime.vars, machine.cursor, instr.line);
      runtime.pc = runtime.ifTaken[instr.rootIndex] ? runtime.pc + 1 : instr.falseIndex;
    }
    return false;
  }
  if (instr.type === 'ELSE') {
    if (runtime.ifTaken[instr.rootIndex]) {
      delete runtime.ifTaken[instr.rootIndex];
      runtime.pc = instr.endIndex + 1;
    } else {
      runtime.ifTaken[instr.rootIndex] = true;
      runtime.pc++;
    }
    return false;
  }
  if (instr.type === 'ENDIF') {
    delete runtime.ifTaken[instr.rootIndex];
    runtime.pc++;
    return false;
  }
  if (instr.type === 'FOR') {
    var startVal = evaluateExpression(instr.startCode, runtime.vars, machine.cursor, instr.line);
    var endVal = evaluateExpression(instr.endCode, runtime.vars, machine.cursor, instr.line);
    if (typeof startVal !== 'number' || typeof endVal !== 'number') {
      throw new PseudocodeError('FOR needs numbers, e.g. FOR ' + instr.var + ' <- 1 TO 5', instr.line);
    }
    storeVariable(runtime.vars, instr.var, startVal, instr.line);
    runtime.forEnds[runtime.pc] = endVal;
    runtime.pc = startVal > endVal ? instr.pairedNextIndex + 1 : runtime.pc + 1;
    return false;
  }
  if (instr.type === 'DECLARE') {
    declareVariables(runtime.vars, instr, machine.cursor);
    runtime.pc++;
    return false;
  }
  if (instr.type === 'NEXT') {
    var forInstr = instructions[instr.pairedForIndex];
    runtime.vars[forInstr.var]++;
    runtime.pc = runtime.vars[forInstr.var] <= runtime.forEnds[instr.pairedForIndex] ? instr.pairedForIndex + 1 : runtime.pc + 1;
    return false;
  }
  if (instr.type === 'WHILE') {
    runtime.pc = evaluateExpression(instr.conditionCode, runtime.vars, machine.cursor, instr.line)
      ? runtime.pc + 1
      : instr.pairedEndIndex + 1;
    return false;
  }
  if (instr.type === 'ENDWHILE') {
    runtime.pc = instr.pairedWhileIndex;
    return false;
  }
  if (instr.type === 'OUTPUT') {
    logConsole('[Machine #' + machine.id + '] ' + String(evaluateExpression(instr.exprCode, runtime.vars, machine.cursor, instr.line)), false, true);
    runtime.pc++;
    return true;
  }
  if (instr.type === 'ASSIGN_INDEX') {
    var machineIndexValue = evaluateExpression(instr.indexCode, runtime.vars, machine.cursor, instr.line);
    storeArrayElement(runtime.vars, instr.var, machineIndexValue, evaluateExpression(instr.exprCode, runtime.vars, machine.cursor, instr.line), instr.line);
    runtime.pc++;
    return true;
  }
  if (instr.type === 'ASSIGN') {
    storeVariable(runtime.vars, instr.var, evaluateExpression(instr.exprCode, runtime.vars, machine.cursor, instr.line), instr.line);
    runtime.pc++;
    return true;
  }
  if (instr.type === 'CALL') {
    var args = instr.argsCode.map(function (code) {
      return evaluateExpression(code, runtime.vars, machine.cursor, instr.line);
    });
    runCommand(instr.name, args, machine.cursor, function (message, isError) {
      logConsole('[Machine #' + machine.id + '] ' + message, isError, true);
    }, instr.line);
    runtime.pc++;
    return true;
  }
  runtime.pc++;
  return true;
}

function runMachineAction(machine) {
  // Selection and loop boundaries are evaluated immediately. One scheduled
  // machine tick is consumed only when an instruction performs work.
  var controlHops = 0;
  while (!runMachineInstruction(machine)) {
    if (++controlHops > 1000) {
      logConsole('[Machine #' + machine.id + '] No action was reached. Check for a loop containing only control lines.', true, true);
      resetMachineRuntime(machine);
      return;
    }
  }
}

function scheduleMachine(machine) {
  machine.nextInstructionAt = performance.now() + machine.intervalMs;
}

// All machines share the animation clock. This avoids a collection of
// independent intervals waking the main thread together every few seconds.
// A machine can catch up by one action per frame after a slow frame, without
// creating a burst of work in a single frame.
function updateMachineScheduler(now) {
  machines.forEach(function (machine) {
    if (!machine.nextInstructionAt) {
      machine.nextInstructionAt = now + machine.intervalMs;
      return;
    }
    if (machine.running || now < machine.nextInstructionAt) return;
    machine.nextInstructionAt += machine.intervalMs;
    if (machine.nextInstructionAt < now - machine.intervalMs) {
      machine.nextInstructionAt = now + machine.intervalMs;
    }
    machine.running = true;
    try {
      runMachineAction(machine);
      markGameDirty();
    } catch (err) {
      logConsole('[Machine #' + machine.id + '] Error: ' + (err.message || err), true, true);
      resetMachineRuntime(machine);
    }
    machine.running = false;
  });
}

function machineLevelConfig(machine) {
  var index = Math.max(0, Math.min(MACHINE_LEVELS.length - 1, (Number(machine.level) || 1) - 1));
  return MACHINE_LEVELS[index];
}

// Sell a machine back: refunds half its cost and frees its home tile. The
// machine's cursor may have roamed during a run, but the machine itself
// still stands on its home tile, so that is the tile that gets cleared.
function sellMachine(machine) {
  var refund = Math.floor(machine.cost * MACHINE_SELL_REFUND);
  money += refund;
  var homeTile = tileAt(machine.homeX, machine.homeZ);
  if (homeTile) homeTile.hasMachine = false;
  scene.remove(machine.group);
  scene.remove(machine.cursorMesh);
  disposeObject3D(machine.group);
  disposeObject3D(machine.cursorMesh);
  machines = machines.filter(function (m) { return m.id !== machine.id; });
  markGameDirty();
  if (selectedMachineId === machine.id) selectedMachineId = null;
  if (editingMachineCodeId === machine.id) editingMachineCodeId = null;
  updateHUD();
  updateTileInfoPanel();
  logConsole('Sold Machine #' + machine.id + ' for ' + refund + ' coins.');
}

// Upgrade a machine one level without changing its code or current state.
function upgradeMachine(machine) {
  var idx = machineLevelConfig(machine).level - 1;
  if (idx >= MACHINE_LEVELS.length - 1) return;
  var nextLevel = MACHINE_LEVELS[idx + 1];
  var cost = nextLevel.price;
  if (money < cost) {
    logConsole('Upgrading Machine #' + machine.id + ' to Level ' + nextLevel.level + ' costs ' + cost + ' coins, but you only have ' + money + '.', true);
    return;
  }
  money -= cost;
  machine.cost += cost;
  machine.level = nextLevel.level;
  machine.instructionsPerSecond = nextLevel.instructionsPerSecond;
  machine.intervalMs = Math.round(1000 / nextLevel.instructionsPerSecond);
  if (machine.body) machine.body.material.color.setHex(nextLevel.color);
  scheduleMachine(machine);
  markGameDirty();
  updateHUD();
  updateTileInfoPanel();
  logConsole('Machine #' + machine.id + ' upgraded to Level ' + nextLevel.level + '. It now runs ' + machineRateLabel(machine) + '.');
}

function startEditingMachine(machine) {
  editingMachineCodeId = machine.id;
  lastTileInfoSignature = '';
  tileInfoEl.className = 'show';
  tileInfoEl.innerHTML = '<b>Editing Machine #' + machine.id + ' code</b>' +
    '<textarea id="machine-code-edit" spellcheck="false" autocomplete="off"></textarea>' +
    '<div class="machine-actions">' +
      '<button type="button" class="machine-action-btn is-primary" id="machine-save-btn">Save code</button>' +
      '<button type="button" class="machine-action-btn" id="machine-cancel-btn">Cancel</button>' +
    '</div>';
  document.getElementById('machine-code-edit').value = machine.code;
  document.getElementById('machine-save-btn').addEventListener('click', function () { saveMachineCode(machine); });
  document.getElementById('machine-cancel-btn').addEventListener('click', function () { cancelEditMachine(); });
}

function saveMachineCode(machine) {
  var newCode = document.getElementById('machine-code-edit').value;
  var compiledProgram;
  try {
    compiledProgram = compile(newCode);
  } catch (e) {
    var ta = document.getElementById('machine-code-edit');
    if (ta) ta.classList.add('has-error');
    logConsole('Cannot save machine code: ' + e.message, true);
    return;
  }
  machine.code = newCode;
  machine.program = compiledProgram;
  resetMachineRuntime(machine);
  markGameDirty();
  editingMachineCodeId = null;
  lastTileInfoSignature = '';
  updateTileInfoPanel();
  logConsole('Machine #' + machine.id + ' code updated.');
}

function cancelEditMachine() {
  editingMachineCodeId = null;
  lastTileInfoSignature = '';
  updateTileInfoPanel();
}

