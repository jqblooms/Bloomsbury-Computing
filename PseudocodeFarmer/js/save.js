'use strict';
// Plant sprites and labels, and saving and loading the farm in this browser.
// ============================================================
// SAVE / LOAD (localStorage) - so a page refresh keeps the farm
// ============================================================
function makePlantSprite(vegName, x, z) {
  var veg = lookupItem(vegName);
  var material = new THREE.SpriteMaterial({ map: loadVeggieTexture(vegName), transparent: true });
  if (veg.tint) material.color.setHex(veg.tint);
  var sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0);
  sprite.scale.set(0.001, 0.001, 0.001);
  sprite.position.set(tileWorldX(x), 0.02, tileWorldZ(z));
  scene.add(sprite);
  return sprite;
}

// A small floating "47%" pill drawn above every plant, kept translucent so
// it doesn't crowd the field but stays readable. Reworked as a canvas texture
// on a sprite so it always faces the camera.
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// pct is 0-100 while growing (unclamped above 100 once ready, for a battery/fish plant
// whose live sell value has climbed past its base price - see the render loop below).
// `warn` swaps the pill to a red tint - a battery whose value has decayed under its base
// price. Cache key includes both so growth and live-value pills never collide.
var pctTextureCache = {};
function getPctTexture(pct, warn) {
  pct = Math.max(0, Math.round(pct));
  var key = pct + (warn ? 'w' : '');
  if (pctTextureCache[key]) return pctTextureCache[key];
  var canvas = document.createElement('canvas');
  canvas.width = 72; canvas.height = 26;
  var ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var txt = pct + '%';
  ctx.font = '800 17px "Baloo 2", system-ui, sans-serif';
  var tw = ctx.measureText(txt).width;
  var pad = 9;
  var bw = Math.max(24, tw + pad * 2);
  var bh = h - 4;
  var bx = (w - bw) / 2, by = (h - bh) / 2;
  ctx.fillStyle = warn ? 'rgba(122,42,32,0.75)' : 'rgba(18,26,18,0.60)';
  roundedRect(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, w / 2, h / 2);
  var texture = new THREE.CanvasTexture(canvas);
  pctTextureCache[key] = texture;
  return texture;
}
function drawPctLabel(label, pct, warn) {
  label.sprite.material.map = getPctTexture(pct, warn);
  label.sprite.material.needsUpdate = true;
}
function makePlantLabel(x, z) {
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getPctTexture(0), transparent: true, depthTest: false }));
  sprite.center.set(0.5, 0);
  sprite.scale.set(0.7, 0.26, 1);
  sprite.position.set(tileWorldX(x), 1.0, tileWorldZ(z));
  sprite.renderOrder = 20;
  scene.add(sprite);
  var label = { sprite: sprite, lastPct: -1, lastWarn: false };
  drawPctLabel(label, 0, false);
  return label;
}

// Captures the live game into the same plain-object shape saveGame() writes to
// localStorage - factored out so a tutorial sandbox snapshot (kept only in memory, see
// enterTutorialSandbox below) and the real localStorage save both go through exactly one
// place that knows how to describe "the current game state".
function serializeGameState() {
  var s = {
    v: SAVE_VERSION,
    money: money,
    totalEarned: totalEarned,
    farmEarned: farmEarned,
    bestSaleValue: bestSaleValue,
    currentFarmType: currentFarmType,
    farmTypesDiscovered: farmTypesDiscovered,
    rocketPartsOwned: rocketPartsOwned,
    rocketLaunchAt: rocketLaunchAt,
    inventory: inventory,
    soldCount: soldCount,
    playerCursor: { x: playerCursor.x, z: playerCursor.z, facing: playerCursor.facing },
    plants: [],
    machines: [],
    ownedTiles: Object.keys(tiles).map(function (key) { return [tiles[key].x, tiles[key].z]; }),
    nextMachineId: nextMachineId
  };
  plantedTiles.forEach(function (tile) {
    var plant = tile.plant;
    if (plant) s.plants.push({ x: tile.x, z: tile.z, type: plant.type, plantedAt: plant.plantedAt, growMs: plant.growMs });
  });
  machines.forEach(function (m) {
    s.machines.push({
      id: m.id, homeX: m.homeX, homeZ: m.homeZ, code: m.code, level: m.level,
      cost: m.cost, intervalMs: m.intervalMs, instructionsPerSecond: m.instructionsPerSecond,
      cursorX: m.cursor.x, cursorZ: m.cursor.z, cursorFacing: m.cursor.facing,
      runtimePc: m.runtime ? m.runtime.pc : 0,
      runtimeVars: m.runtime ? m.runtime.vars : {},
      runtimeForEnds: m.runtime ? m.runtime.forEnds : {},
      runtimeIfTaken: m.runtime ? m.runtime.ifTaken : {},
      runtimeVersion: 2
    });
  });
  return s;
}

function saveGame(force) {
  // Neither a lesson mission nor a tutorial's practice world is ever the student's real
  // farm - saving here would silently overwrite their actual save with throwaway state.
  if (lessonMissionMode || tutorialMode) return;
  if (!force && !gameStateDirty) return;
  var s = serializeGameState();
  var json = JSON.stringify(s);
  if (!force && json === lastSavedJson) { gameStateDirty = false; return; }
  try {
    localStorage.setItem(SAVE_KEY, json);
    lastSavedJson = json;
    gameStateDirty = false;
  } catch (e) {}
}

function restoreMachine(s) {
  var legacyLevels = { Basic: 1, Quick: 2, Turbo: 3 };
  var savedLevel = Number(s.level) || legacyLevels[s.tierName] || 1;
  savedLevel = Math.max(1, Math.min(MACHINE_LEVELS.length, Math.round(savedLevel)));
  var levelConfig = MACHINE_LEVELS[savedLevel - 1];
  var compiledProgram;
  try { compiledProgram = compile(String(s.code || '')); }
  catch (e) { compiledProgram = []; }
  var built = createMachineMarkerGroup(levelConfig.color);
  built.group.position.set(tileWorldX(s.homeX), 0, tileWorldZ(s.homeZ));
  scene.add(built.group);
  scene.add(built.cursorMesh);
  var machine = {
    id: s.id, homeX: s.homeX, homeZ: s.homeZ,
    code: s.code, program: compiledProgram, level: savedLevel, cost: Number(s.cost) || levelConfig.price,
    instructionsPerSecond: levelConfig.instructionsPerSecond,
    intervalMs: Math.round(1000 / levelConfig.instructionsPerSecond),
    runtime: {
      vars: s.runtimeVars && typeof s.runtimeVars === 'object' ? s.runtimeVars : {},
      forEnds: s.runtimeForEnds && typeof s.runtimeForEnds === 'object' ? s.runtimeForEnds : {},
      ifTaken: s.runtimeIfTaken && typeof s.runtimeIfTaken === 'object' ? s.runtimeIfTaken : {},
      pc: Math.max(0, Math.min(compiledProgram.length, Number(s.runtimePc) || 0))
    },
    cursor: { x: s.cursorX, z: s.cursorZ, facing: s.cursorFacing || 0, homeX: s.homeX, homeZ: s.homeZ },
    group: built.group, cursorMesh: built.cursorMesh, facingIndicator: built.facingIndicator,
    diamond: built.diamond, body: built.body, running: false
  };
  machine.cursor.machine = machine;
  built.group.traverse(function (o) { if (o.isMesh) o.userData.machineId = machine.id; });
  var homeTile = tileAt(s.homeX, s.homeZ);
  if (homeTile) homeTile.hasMachine = true;
  machines.push(machine);
  positionMachineCursorMarker(machine);
  updateFacingIndicator(machine.facingIndicator, machine.cursor.facing);
  scheduleMachine(machine);
}

// Restores the live game world from a serializeGameState()-shaped object - the mirror image
// of that function, and shared the same way: loadGame() applies one parsed from
// localStorage, exitTutorialSandbox() applies one kept only in memory. Assumes the world is
// already blank (see clearWorldObjects) - it only ever creates things, never removes them.
function applyGameState(s) {
  money = s.money;
  totalEarned = s.totalEarned;
  // Absent on saves from before farm-scoped earnings: assume everything earned so far was on
  // the current farm (true for anyone who hasn't prestiged; harmlessly generous otherwise).
  farmEarned = (typeof s.farmEarned === 'number') ? s.farmEarned : (s.totalEarned || 0);
  bestSaleValue = s.bestSaleValue || 0; // absent on old saves - fine, it just starts at 0 again
  currentFarmType = FARM_TYPES[s.currentFarmType] ? s.currentFarmType : 'crops';
  // Backward compat: a save from before this field existed already had currentFarmType set
  // to wherever the player had switched to under the old (reveal-everything) picker - assume
  // they'd genuinely seen every type up to and including that one, rather than re-hiding
  // something they already found.
  farmTypesDiscovered = Array.isArray(s.farmTypesDiscovered) && s.farmTypesDiscovered.length
    ? s.farmTypesDiscovered.filter(function (id) { return FARM_TYPES[id]; })
    : FARM_TYPE_SEQUENCE.slice(0, FARM_TYPE_SEQUENCE.indexOf(currentFarmType) + 1);
  if (farmTypesDiscovered.indexOf('crops') === -1) farmTypesDiscovered.unshift('crops');
  rocketPartsOwned = Math.max(0, Math.min(ROCKET_PARTS.length, Number(s.rocketPartsOwned) || 0));
  rocketLaunchAt = Number(s.rocketLaunchAt) || null; // absent on an old/pre-rocket save - null is "not launched", same as a fresh start
  inventory = s.inventory || {};
  soldCount = s.soldCount || {};
  playerCursor.x = s.playerCursor.x; playerCursor.z = s.playerCursor.z; playerCursor.facing = s.playerCursor.facing || 0;
  // Restore the garden expansion if this save recorded one (older saves just
  // keep the starting GRID_SIZE x GRID_SIZE).
  if (Array.isArray(s.ownedTiles) && s.ownedTiles.length) rebuildGarden(s.ownedTiles);
  updatePlayerCursorPosition();
  updateFacingIndicator(playerFacingIndicator, playerCursor.facing);
  (s.plants || []).forEach(function (p) {
    if (!lookupItem(p.type)) return;
    var pt = tileAt(p.x, p.z);
    if (!pt || pt.plant) return;
    pt.plant = {
      type: p.type, plantedAt: p.plantedAt, growMs: p.growMs,
      sprite: makePlantSprite(p.type, p.x, p.z), pct: makePlantLabel(p.x, p.z), ready: false
    };
    addPlantedTile(pt);
  });
  (s.machines || []).forEach(function (m) {
    var mt = tileAt(m.homeX, m.homeZ);
    if (!mt || mt.hasMachine) return;
    restoreMachine(m);
  });
  nextMachineId = s.nextMachineId || 1;
  buildShop(); // rebuild shop rows for whichever farm type this state belongs to - cheap, and
               // means every applyGameState() caller gets a correct shop for free rather than
               // each one having to remember to do it themselves
}

// Restores the whole game from localStorage. Returns true if there was a
// save to restore; called once at boot, before the first HUD paint.
function loadGame() {
  var raw;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { raw = null; }
  if (!raw) return false;
  var s;
  try { s = JSON.parse(raw); } catch (e) { return false; }
  if (!s || s.v !== SAVE_VERSION) return false;
  lastSavedJson = raw;
  applyGameState(s);
  return true;
}

