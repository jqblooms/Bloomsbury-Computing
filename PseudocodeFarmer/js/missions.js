'use strict';

// ============================================================
// LESSON MISSION MODE
// ============================================================
// Missions are deliberately small, deterministic sandboxes for lessons. They
// never touch the normal free-play localStorage save.
function lessonMissionConfig(id) { return LESSON_MISSIONS[id] || null; }

function clearMissionWorld() {
  // This function only makes sense with a mission config to rebuild from - it reads
  // lessonMissionMode.tiles/targets/money/inventory/start below. Guarding here, not just at
  // each call site, means it can never be invoked into a crash (or a half-run, partially
  // reset state) no matter what calls it or how the UI around it changes later - the "Reset
  // Mission" button and resetGame()'s mission branch both stay correct by construction.
  if (!lessonMissionMode) return;
  // Missions are always written in Cambridge Pseudocode against Carrots, same as tutorials -
  // force the crop farm regardless of currentFarmType, so activeItems()/currentSeedPrice()
  // resolve mission crop names correctly no matter what farm type happened to be active.
  // Set before rebuildGarden() below, so fresh tiles get the right colour too.
  currentFarmType = 'crops';
  clearWorldObjects();
  rebuildGarden(lessonMissionMode.tiles || initialTileList());
  // Lesson worlds are fixed teaching spaces. Remove expansion tiles so the
  // only visible squares are the ones needed for the current task.
  edgeTiles = {};
  (lessonMissionMode.targets || []).forEach(function (target) {
    var targetTile = tileAt(target.x, target.z);
    if (targetTile) targetTile.color = new THREE.Color(0xb88345);
  });
  rebuildTileBatches();
  money = Number(lessonMissionMode.money) || 0;
  totalEarned = 0;
  farmEarned = 0;
  inventory = {};
  Object.keys(lessonMissionMode.inventory || {}).forEach(function (name) { inventory[name] = lessonMissionMode.inventory[name]; });
  soldCount = {};
  unlockedState = {};
  selectedMachineId = null;
  editingMachineCodeId = null;
  var start = lessonMissionMode.start || { x: 0, z: 0 };
  playerCursor.x = start.x; playerCursor.z = start.z; playerCursor.homeX = start.x; playerCursor.homeZ = start.z; playerCursor.facing = 0;
  updatePlayerCursorPosition();
  updateFacingIndicator(playerFacingIndicator, playerCursor.facing);
  var missionTiles = lessonMissionMode.tiles || [[start.x, start.z]];
  var centreX = missionTiles.reduce(function (sum, tile) { return sum + tile[0]; }, 0) / missionTiles.length;
  var centreZ = missionTiles.reduce(function (sum, tile) { return sum + tile[1]; }, 0) / missionTiles.length;
  var xs = missionTiles.map(function (tile) { return tile[0]; });
  var zs = missionTiles.map(function (tile) { return tile[1]; });
  var baseFullSize = GRID_SIZE + MAX_EXPANSION * 2 + 0.4;
  base.scale.set((Math.max.apply(null, xs) - Math.min.apply(null, xs) + 1.4) / baseFullSize, 1, (Math.max.apply(null, zs) - Math.min.apply(null, zs) + 1.4) / baseFullSize);
  base.position.x = tileWorldX(centreX);
  base.position.z = tileWorldZ(centreZ);
  camState.target.set(tileWorldX(centreX), 0, tileWorldZ(centreZ));
  camState.radius = Math.max(5, 4.5 + missionTiles.length * 0.45);
  applyCameraState();
  codeInput.value = '';
  clearCodeError();
  consoleOutput.innerHTML = '';
  machineLogQueue = [];
  machineLogByKey = {};
  gameStateDirty = false;
  lastHudSignature = '';
  lastTileInfoSignature = '';
  refreshUnlocks();
  updateHUD();
  updateTileInfoPanel();
  updateMissionStuckWarning(); // fresh state should never be a dead end, but re-check for real
}

function missionCodeHas(program, names) {
  return names.some(function (name) { return program.some(function (instr) { return instr.name === name; }); });
}

// Softlock failsafe: a mission gives a fixed, small amount of starting money and seeds
// (GDD-style "deliberately small, deterministic sandbox"), so a student who spends it all on
// the wrong crop - e.g. buying two of the wrong vegetable for a "buy two things" mission -
// can end up with no seeds of what they need and no money to buy more. Reset Mission always
// fixes this (it fully re-seeds money/inventory/tiles from the mission config), but a student
// who doesn't realise they're stuck can sit there confused. This detects the *unambiguous*
// dead end - no seeds of any crop still needed, no money to buy one, and nothing planted
// anywhere (growing or ready) that could ever be sold for cash - and points at the fix.
// Deliberately conservative: it only fires when there is truly no way forward, never on a
// "just wait for it to grow" state, so it's never wrong when it does fire.
function missionNeededCrops(cfg) {
  var needed = [];
  cfg.targets.forEach(function (target) {
    var tile = tileAt(target.x, target.z);
    var satisfied = !!(tile && tile.plant && tile.plant.type === target.type);
    if (!satisfied && needed.indexOf(target.type) === -1) needed.push(target.type);
  });
  return needed;
}
function missionIsDeadEnd(cfg) {
  if (!cfg) return false;
  var needed = missionNeededCrops(cfg);
  if (!needed.length) return false; // nothing left to get - mission is complete or trivially fine
  var canObtainAny = needed.some(function (type) {
    if (invCount(type) > 0) return true; // already own a seed for it
    if (!isUnlocked(type)) return false; // can't buy what isn't unlocked yet
    return money >= Math.round(currentSeedPrice(type) * CODE_BUY_DISCOUNT);
  });
  if (canObtainAny) return false;
  // Can't get a needed seed right now - but if anything anywhere is planted (growing or
  // ready), selling it later could still raise the cash, so this isn't a dead end yet.
  return plantedTiles.length === 0;
}
function updateMissionStuckWarning() {
  var cfg = lessonMissionMode;
  var warning = document.getElementById('lesson-mission-stuck-warning');
  if (!warning) return;
  var status = document.getElementById('lesson-mission-status');
  var complete = status && status.classList.contains('complete');
  warning.hidden = !cfg || complete || !missionIsDeadEnd(cfg);
}

function checkLessonMission(source) {
  var cfg = lessonMissionMode;
  if (!cfg) return;
  updateMissionStuckWarning(); // world state is already settled by now, win or lose this run
  var program;
  try { program = compile(source || ''); } catch (e) { return; }
  if (cfg.required.some(function (name) { return !missionCodeHas(program, [name]); })) return;
  if (cfg.forbidden.some(function (name) { return program.some(function (instr) { return instr.type === name; }); })) return;
  var complete = cfg.targets.every(function (target) {
    var tile = tileAt(target.x, target.z);
    return !!(tile && tile.plant && tile.plant.type === target.type);
  });
  if (!complete) return;
  var status = document.getElementById('lesson-mission-status');
  if (status && !status.classList.contains('complete')) {
    status.classList.add('complete');
    status.textContent = 'Mission complete. Your solution worked.';
  }
  updateMissionStuckWarning(); // hides itself once the mission is actually solved
  try { window.parent.postMessage({ type: 'pseudocodeFarmerLessonProgress', missionId: lessonMissionMode.id, status: 'complete', attempts: lessonMissionAttempt, code: source }, '*'); } catch (e) {}
}

// Syntax + plain-English description for every command a mission's `required`/`forbidden`
// list can name. Kept in the exact wording/syntax the full cheat sheet already uses, so a
// student never sees two different explanations of the same command in the same game.
// Blanks ("____") are left for the student to fill in - showing the shape of a command
// scaffolds the syntax a total beginner hasn't seen before, without handing them the
// mission's actual answer (same "hint, not answer" rule used across this project).
var MISSION_COMMAND_REFERENCE = {
  Plant: { syntax: 'CALL Plant("____")', desc: 'Plants a seed you own where your cursor is standing. Put the crop name in the quotes.' },
  Buy: { syntax: 'CALL Buy("____")', desc: 'Buys one seed packet of that crop, cheaper than the shop button.' },
  Sell: { syntax: 'CALL Sell()', desc: 'Sells a fully grown plant where your cursor is standing.' },
  SetPosition: { syntax: 'CALL SetPosition(__, __)', desc: 'Jumps straight to a tile, counted from home: first number right/left, second number up/down.' },
  MoveUp: { syntax: 'CALL MoveUp()', desc: 'Moves your cursor one tile up the field.' },
  MoveDown: { syntax: 'CALL MoveDown()', desc: 'Moves your cursor one tile down the field.' },
  MoveLeft: { syntax: 'CALL MoveLeft()', desc: 'Moves your cursor one tile left.' },
  MoveRight: { syntax: 'CALL MoveRight()', desc: 'Moves your cursor one tile right.' },
  MoveForward: { syntax: 'CALL MoveForward()', desc: 'Moves one tile in the direction your cursor is facing.' },
  TurnLeft: { syntax: 'CALL TurnLeft()', desc: "Turns your cursor 90° left, without moving it." },
  TurnRight: { syntax: 'CALL TurnRight()', desc: "Turns your cursor 90° right, without moving it." }
};
function renderMissionCommands(cfg) {
  var table = document.getElementById('lesson-mission-commands');
  if (!table) return;
  table.innerHTML = (cfg.required || []).map(function (name) {
    var ref = MISSION_COMMAND_REFERENCE[name];
    if (!ref) return '';
    return '<tr><td><code>' + ref.syntax + '</code></td><td class="desc">' + ref.desc + '</td></tr>';
  }).join('');
}
function setMissionCollapsed(collapsed) {
  var panel = document.getElementById('lesson-mission-panel');
  var toggle = document.getElementById('lesson-mission-toggle');
  if (!panel || !toggle) return;
  panel.classList.toggle('collapsed', collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
}
function initMissionToggle() {
  var toggle = document.getElementById('lesson-mission-toggle');
  if (!toggle || toggle.dataset.bound) return;
  toggle.dataset.bound = '1';
  toggle.addEventListener('click', function () {
    setMissionCollapsed(!document.getElementById('lesson-mission-panel').classList.contains('collapsed'));
  });
  toggle.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.click(); }
  });
}

function startLessonMission(id) {
  var cfg = lessonMissionConfig(id);
  if (!cfg) return;
  lessonMissionMode = Object.assign({ id: id }, cfg);
  document.body.classList.add('lesson-mission-mode');
  var panel = document.getElementById('lesson-mission-panel');
  if (panel) {
    panel.classList.add('active');
    // Draw the eye to the mission card the moment it appears, since it's now the first
    // thing in the sidebar rather than a card a student has to scroll past everything to find.
    panel.classList.add('just-started');
    setTimeout(function () { panel.classList.remove('just-started'); }, 1700);
  }
  setMissionCollapsed(false); // always start expanded, even if a previous mission was left collapsed
  initMissionToggle();
  var title = document.getElementById('lesson-mission-title');
  var titleCollapsed = document.getElementById('lesson-mission-title-collapsed');
  var objective = document.getElementById('lesson-mission-objective');
  var status = document.getElementById('lesson-mission-status');
  if (title) title.textContent = cfg.title;
  if (titleCollapsed) titleCollapsed.textContent = cfg.title;
  if (objective) objective.textContent = cfg.objective;
  if (status) { status.className = ''; status.textContent = 'Write your code, then press Run.'; }
  renderMissionCommands(cfg);
  // The full 30-command reference is for free play; a mission has its own short list above,
  // so relabel the generic one as a fallback rather than two competing "the" cheat sheets.
  var cheatSummary = document.getElementById('cheat-sheet-summary');
  if (cheatSummary) cheatSummary.textContent = 'Need a command not listed above? Full cheat sheet';
  clearMissionWorld();
  var reset = document.getElementById('lesson-mission-reset');
  if (reset && !reset.dataset.bound) { reset.dataset.bound = '1'; reset.addEventListener('click', handleMissionResetClick); }
}

// Bound once, ever (see the dataset.bound guard above) - reads lessonMissionMode fresh on
// every click rather than closing over the mission that happened to be active when the
// listener was first attached, so it always resets *whichever* mission is current.
function handleMissionResetClick() {
  // Explicit, self-documenting guard: this button (and the panel it lives in) should only
  // ever be visible while lessonMissionMode is set, but checking here too - not just relying
  // on clearMissionWorld()'s own guard - means a click can never touch mission-only UI state
  // (the status text below) when there is no mission to reset.
  if (!lessonMissionMode) return;
  clearMissionWorld();
  var status = document.getElementById('lesson-mission-status');
  if (status) { status.className = ''; status.textContent = 'Mission reset. Write your code, then press Run.'; }
}

function watchLessonRun() {
  if (!lessonMissionMode || !lessonMissionPendingSource) return;
  lessonMissionAttempt++;
  var source = lessonMissionPendingSource;
  lessonMissionPendingSource = '';
  var timer = setInterval(function () {
    if (!isRunning) { clearInterval(timer); checkLessonMission(source); }
  }, 100);
}
