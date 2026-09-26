'use strict';
// Resetting the game and selling the farm for the next farm type.
// ============================================================
// RESET GAME (top-bar button, two-click confirm)
// ============================================================
// Tears down every machine and floating text currently in the scene (aborting any in-flight
// program first) and resets the machine id counter - the part of "wipe the world" that's
// identical whether we're about to rebuild a fresh grid (resetGame, enterTutorialSandbox) or
// apply a saved/snapshotted state on top (loadGame's caller pattern via applyGameState,
// exitTutorialSandbox). Never touches tiles/plants itself - callers follow up with either
// rebuildGarden(list) or applyGameState(s), which does its own rebuildGarden.
function clearWorldObjects() {
  runEpoch++; // abort any in-flight program (its loop checks the epoch)
  setRunningUI(false);
  machines.forEach(function (m) {
    scene.remove(m.group);
    scene.remove(m.cursorMesh);
    disposeObject3D(m.group);
    disposeObject3D(m.cursorMesh);
  });
  machines = [];
  floatingTexts.forEach(function (floating) {
    scene.remove(floating.sprite);
    disposeSprite(floating.sprite, false);
  });
  floatingTexts = [];
  nextMachineId = 1;
}

function resetGame() {
  // The top-bar reset belongs to free play. Mission mode and tutorial mode both have their
  // own reset and must never remove (or overwrite) the student's normal farm save.
  if (lessonMissionMode) {
    clearMissionWorld();
    var missionStatus = document.getElementById('lesson-mission-status');
    if (missionStatus) { missionStatus.className = ''; missionStatus.textContent = 'Mission reset. Write your code, then press Run.'; }
    return;
  }
  if (tutorialMode) {
    resetTutorialWorld(TUTORIALS[activeTutorial.tutIdx]);
    return;
  }
  currentFarmType = 'crops'; // set before rebuildGarden() below, so fresh tiles get the right colour
  clearWorldObjects();
  rebuildGarden(initialTileList());
  money = 40;
  totalEarned = 0;
  farmEarned = 0;
  bestSaleValue = 0; // a full reset starts the whole game over, including which farm
  farmTypesDiscovered = ['crops'];
  rocketPartsOwned = 0;
  rocketLaunchAt = null;
  inventory = {};
  soldCount = {};
  unlockedState = {};
  selectedMachineId = null;
  editingMachineCodeId = null;
  playerCursor.x = Math.floor(GRID_SIZE / 2);
  playerCursor.z = Math.floor(GRID_SIZE / 2);
  playerCursor.facing = 0;
  updatePlayerCursorPosition();
  updateFacingIndicator(playerFacingIndicator, playerCursor.facing);
  codeInput.value = '';
  clearCodeError();
  consoleOutput.innerHTML = '';
  machineLogQueue = [];
  machineLogByKey = {};
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  lastSavedJson = '';
  gameStateDirty = true;
  buildShop();
  refreshUnlocks();
  updateHUD();
  updateTileInfoPanel();
  updateRocketUI();
  logConsole('Game reset. Good luck!');
}

// ============================================================
// SELL THE FARM - a prestige-style unlock (see sellFarmUnlocked() in the FARM TYPES section)
// ============================================================
// Clears everything currently on the farm off the board (ready plants, machines, anything
// still growing) - it still routes through sellAt()/sellMachine() so those stay the single
// source of truth for what a thing is worth and so soldCount/etc stay consistent, but
// sellTheFarm() then resets money to the fresh-game baseline, so the proceeds are not kept.
// Uses clearWorldObjects()/rebuildGarden() (the same primitives resetGame() and the tutorial
// sandbox use) to wipe the board.
function liquidateFarm() {
  var startMoney = money;
  plantedTiles.slice().forEach(function (tile) {
    if (!tile.plant) return;
    if (tile.plant.ready) {
      sellAt({ x: tile.x, z: tile.z }, false);
      return;
    }
    var item = lookupItem(tile.plant.type);
    if (item) money += Math.round(item.seedCost * 0.5); // still growing - a partial credit, not the full sale
    scene.remove(tile.plant.sprite);
    disposeSprite(tile.plant.sprite, false);
    if (tile.plant.pct) { scene.remove(tile.plant.pct.sprite); disposeSprite(tile.plant.pct.sprite, false); }
    tile.plant = null;
    removePlantedTile(tile);
  });
  machines.slice().forEach(function (m) { sellMachine(m); });
  return money - startMoney;
}

// The actual transition: liquidate the old farm, wipe the board, switch farm type, and start
// the new one from scratch - money, totalEarned and bestSaleValue all reset to a fresh-game
// baseline. James: carrying a fortune forward broke every farm after the first - with
// millions in the bank a student could buy the top tier of Solar/Aquarium immediately and
// skip all of its progression. Sell the Farm is now a genuine new beginning with a different
// mechanic (battery timing, fish patience, the rocket build), not a head start. Expanded
// tiles still carry over (they were bought with real coins on an escalating curve).
// The actual mechanics of moving to a fresh start on a different farm type - shared by
// sellTheFarm() (progression: current farm mastered, move to a NEW or already-discovered
// type) and revertToFarmType() (recovery, James 2026-09-15: a student stuck with no money on
// a later stage jumps BACK to an already-discovered earlier one). Both end up in the exact
// same state: 40 coins, tier 1, board cleared, expanded tiles carried over. Callers do their
// own validation and their own logConsole message; this just performs the switch and hands
// back the outgoing farm's title, since currentFarmType has already moved on by the time a
// caller would otherwise read it.
function performFarmTypeSwitch(targetTypeId) {
  var fromTitle = activeFarmType().title;
  liquidateFarm(); // clears plants/machines off the board; its proceeds are wiped by the reset below
  // Liquidates what's GROWING on the land, not the land itself - any tiles bought expanding
  // the garden (real coins, on an escalating cost curve) carry over into the new farm type
  // rather than silently vanishing back to the starting 8x8 grid. Captured before
  // clearWorldObjects() wipes the live `tiles` object.
  var keepTiles = Object.keys(tiles).map(function (key) { return [tiles[key].x, tiles[key].z]; });
  currentFarmType = targetTypeId; // set before rebuildGarden() below, so fresh tiles get the right colour
  if (farmTypesDiscovered.indexOf(targetTypeId) === -1) farmTypesDiscovered.push(targetTypeId);
  clearWorldObjects();
  rebuildGarden(keepTiles.length ? keepTiles : initialTileList());
  // Fresh start on the target farm type - same baseline as a brand-new game, so its tiers
  // re-lock and have to be unlocked through real play again.
  //
  // James, 2026-09-16: "when a student sells their farm... they only have enough money for
  // one solar battery, this means that pupils are trying to make a machine and immediately
  // soft locking their game because they can't afford to buy the machine and the battery,
  // and selling the machine does not give enough." A flat 40 coins was fine for crops (tier
  // 1 Carrot is 5c) but Solar/Aquarium/Rocket's own tier 1 items start far higher (40/35/45c
  // respectively) - 40 coins buys exactly one Solar battery and nothing else, nowhere near
  // enough for a Level 1 machine (30c) too, and MACHINE_SELL_REFUND only pays back half of
  // what a machine cost, so a student who tries anyway can only ever end up with less, not
  // more. Fixed exactly as James suggested: twice the new farm type's own cheapest (tier 1)
  // item cost, floored at the original 40 so crops is completely unaffected (2 * 5 = 10,
  // Math.max keeps it at 40). This always leaves machine price (30) + at least one more item
  // after buying the first one, on every farm type - see the handoff entry for the numbers.
  var targetFarmType = FARM_TYPES[targetTypeId];
  var targetCheapestName = targetFarmType.itemNames[0];
  var targetCheapestCost = targetFarmType.items[targetCheapestName].seedCost;
  money = Math.max(40, targetCheapestCost * 2);
  totalEarned = 0;
  farmEarned = 0;
  bestSaleValue = 0;
  inventory = {};
  soldCount = {};
  unlockedState = {};
  selectedMachineId = null;
  editingMachineCodeId = null;
  playerCursor.x = Math.floor(GRID_SIZE / 2);
  playerCursor.z = Math.floor(GRID_SIZE / 2);
  playerCursor.facing = 0;
  updatePlayerCursorPosition();
  updateFacingIndicator(playerFacingIndicator, playerCursor.facing);
  codeInput.value = '';
  clearCodeError();
  buildShop();
  refreshUnlocks();
  markGameDirty();
  saveGame(true);
  lastHudSignature = '';
  lastTileInfoSignature = '';
  updateHUD();
  updateTileInfoPanel();
  updateRocketUI();
  return fromTitle;
}

function sellTheFarm(targetTypeId) {
  if (!sellFarmUnlocked() || !FARM_TYPES[targetTypeId] || targetTypeId === currentFarmType) return false;
  // Defence in depth alongside updateSellFarmUI() only ever rendering these same two kinds of
  // option - never let a caller (a bug, a stray console call) skip straight to something not
  // yet discovered and more than one step ahead in the sequence.
  var alreadyDiscovered = farmTypesDiscovered.indexOf(targetTypeId) !== -1;
  if (!alreadyDiscovered && targetTypeId !== nextFarmTypeInSequence(currentFarmType)) return false;
  var fromTitle = performFarmTypeSwitch(targetTypeId);
  logConsole('Sold the ' + fromTitle + ' and made a fresh start on the ' + FARM_TYPES[targetTypeId].title + ' - back to 40 coins, tier 1 only. A whole new way to farm!');
  return true;
}

// Recovery path, not progression: James, 2026-09-15 - "if a student spends all of their
// money but is on a later stage... give them the option of which stage to revert to (only
// show stages they have unlocked)". No earnings gate at all (a broke student has nothing
// left to earn with, which is exactly the problem), and it only ever offers an
// ALREADY-discovered stage (farmTypesDiscovered) - never a step ahead into something new the
// way sellTheFarm()'s mystery-row shortcut can, since this is meant to get someone unstuck,
// not to skip content. See updateRevertFarmUI() for the picker this drives.
function revertToFarmType(targetTypeId) {
  if (!FARM_TYPES[targetTypeId] || targetTypeId === currentFarmType) return false;
  if (farmTypesDiscovered.indexOf(targetTypeId) === -1) return false;
  var fromTitle = performFarmTypeSwitch(targetTypeId);
  logConsole('Switched back from the ' + fromTitle + ' to the ' + FARM_TYPES[targetTypeId].title + ' - back to 40 coins, tier 1 only, so you can build back up without losing what you had already discovered.');
  return true;
}

// Renders the sell-farm panel: hidden entirely until sellFarmUnlocked(), then one option per
// OTHER farm type (never the one you're currently on). Each option needs a second click to
// confirm - same two-click-arm pattern as the top-bar Reset Game button, since this is
// genuinely destructive to the current farm.
var sellFarmArmedId = null;
var sellFarmArmTimer = null;
function disarmSellFarm() {
  clearTimeout(sellFarmArmTimer);
  sellFarmArmTimer = null;
  if (sellFarmArmedId === null) return;
  sellFarmArmedId = null;
  updateSellFarmUI();
}
function updateSellFarmUI() {
  var panel = document.getElementById('sell-farm-panel');
  var unlocked = sellFarmUnlocked();
  panel.classList.toggle('unlocked', unlocked);
  if (!unlocked) { sellFarmArmedId = null; clearTimeout(sellFarmArmTimer); return; }
  document.getElementById('sell-farm-desc').textContent =
    'You\'ve unlocked everything on this farm and earned ' + Math.floor(farmEarned).toLocaleString() +
    'c here - enough to move on. Selling clears this farm and starts the next one from scratch: back to 40 coins and tier 1, with a whole new way to farm. Your expanded land carries over.';
  var optionsEl = document.getElementById('sell-farm-options');
  // Already-discovered types (revisitable, nothing new to spoil) plus exactly one step ahead
  // in the fixed sequence if that hasn't been reached yet - never anything further than that.
  var targets = farmTypesDiscovered.filter(function (id) { return id !== currentFarmType; });
  var next = nextFarmTypeInSequence(currentFarmType);
  if (next && targets.indexOf(next) === -1) targets.push(next);
  optionsEl.innerHTML = targets.map(function (id) {
    var ft = FARM_TYPES[id];
    var armed = sellFarmArmedId === id;
    return '<button type="button" class="sell-farm-option' + (armed ? ' armed' : '') + '" data-target="' + id + '">' +
      '<span class="sfo-badge" style="background:' + ft.badgeColor + '">' + escapeHtmlLocal(ft.title.charAt(0)) + '</span>' +
      '<span class="sfo-body"><span class="sfo-title">' + (armed ? 'Click again to confirm' : ft.title) + '</span>' +
      '<span class="sfo-desc">' + escapeHtmlLocal(ft.desc) + '</span></span></button>';
  }).join('');
  optionsEl.querySelectorAll('.sell-farm-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.dataset.target;
      if (sellFarmArmedId !== id) {
        // Same two-click-then-auto-forget pattern as the top-bar Reset Game button - a
        // liquidation is just as destructive to the current farm, so it gets the same safety.
        sellFarmArmedId = id;
        updateSellFarmUI();
        clearTimeout(sellFarmArmTimer);
        sellFarmArmTimer = setTimeout(disarmSellFarm, 3000);
        return;
      }
      clearTimeout(sellFarmArmTimer);
      sellFarmArmedId = null;
      sellTheFarm(id);
    });
  });
}

// Renders the "Stuck? Switch Back" panel: one option per OTHER already-discovered farm type,
// never the current one and never anything not yet discovered. Hidden entirely once there is
// nothing to revert to (a player who has only ever played 'crops'). Same two-click-arm-then-
// confirm safety as Sell the Farm and the top-bar Reset Game button, since this discards
// whatever is currently growing/built - just as destructive, only recoverable in the other
// direction.
var revertFarmArmedId = null;
var revertFarmArmTimer = null;
function disarmRevertFarm() {
  clearTimeout(revertFarmArmTimer);
  revertFarmArmTimer = null;
  if (revertFarmArmedId === null) return;
  revertFarmArmedId = null;
  updateRevertFarmUI();
}
function updateRevertFarmUI() {
  var panel = document.getElementById('revert-farm-panel');
  if (!panel) return;
  var targets = farmTypesDiscovered.filter(function (id) { return id !== currentFarmType; });
  panel.classList.toggle('shown', targets.length > 0);
  if (!targets.length) { revertFarmArmedId = null; clearTimeout(revertFarmArmTimer); return; }
  var optionsEl = document.getElementById('revert-farm-options');
  optionsEl.innerHTML = targets.map(function (id) {
    var ft = FARM_TYPES[id];
    var armed = revertFarmArmedId === id;
    return '<button type="button" class="revert-farm-option' + (armed ? ' armed' : '') + '" data-target="' + id + '">' +
      '<span class="rfo-badge" style="background:' + ft.badgeColor + '">' + escapeHtmlLocal(ft.title.charAt(0)) + '</span>' +
      '<span class="rfo-body"><span class="rfo-title">' + (armed ? 'Click again to confirm' : ft.title) + '</span>' +
      '<span class="rfo-desc">Fresh start: 40 coins, tier 1</span></span></button>';
  }).join('');
  optionsEl.querySelectorAll('.revert-farm-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.dataset.target;
      if (revertFarmArmedId !== id) {
        revertFarmArmedId = id;
        updateRevertFarmUI();
        clearTimeout(revertFarmArmTimer);
        revertFarmArmTimer = setTimeout(disarmRevertFarm, 3000);
        return;
      }
      clearTimeout(revertFarmArmTimer);
      revertFarmArmedId = null;
      revertToFarmType(id);
    });
  });
}

