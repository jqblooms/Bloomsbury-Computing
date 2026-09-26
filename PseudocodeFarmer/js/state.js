'use strict';
// Game state: money, inventory, tiles, machines, missions; unlocks and seed prices.

// ============================================================
// GAME STATE
// ============================================================
var SAVE_KEY = 'pseudocodeFarmerSave';
var SAVE_VERSION = 1;
var lastSavedJson = '';
var gameStateDirty = false;
var hudDirty = false;
var tileInfoDirty = false;
function markGameDirty() { gameStateDirty = true; }
function requestHUDUpdate() { hudDirty = true; }
function requestTileInfoUpdate() { tileInfoDirty = true; }
var money = 40;
var totalEarned = 0; // lifetime coins earned from selling - never goes down, gates vegetable unlocks
var farmEarned = 0;  // coins earned on the CURRENT farm type since arriving on it - reset to 0 by
                     // sellTheFarm(). Gates Sell the Farm, so each farm has to be genuinely
                     // developed before it can be sold, not just parked on with an inherited fortune.
var inventory = {}; // { Carrot: 2, ... } seed packets owned but not yet planted
var soldCount = {};  // { Carrot: 5, ... } lifetime sales per vegetable (tracked, not used for unlocking)
var unlockedState = {};   // { Carrot: true, ... } cached from the last refreshUnlocks() call, so
                           // sellAt() can tell what just changed rather than only what's true now
// Owned tiles, keyed by "x,z" (x/z are grid coords, which can go negative
// once the garden expands). edgeTiles holds the purchasable tiles just
// outside the owned region, rendered dimmer and bought one at a time.
var tiles = {};       // "x,z" -> { x, z, color, plant: null | PlantRecord, hasMachine: bool }
var edgeTiles = {};   // "x,z" -> { x, z }
var plantedTiles = []; // only occupied tiles, so animation never scans empty soil
function addPlantedTile(tile) {
  tile.plantedIndex = plantedTiles.length;
  plantedTiles.push(tile);
}
function removePlantedTile(tile) {
  var index = tile.plantedIndex;
  if (index === undefined || plantedTiles[index] !== tile) index = plantedTiles.indexOf(tile);
  if (index < 0) return;
  var last = plantedTiles.pop();
  if (last !== tile) {
    plantedTiles[index] = last;
    last.plantedIndex = index;
  }
  tile.plantedIndex = -1;
}
var ownedMinX = 0, ownedMaxX = GRID_SIZE - 1, ownedMinZ = 0, ownedMaxZ = GRID_SIZE - 1;
var ownedTileCount = GRID_SIZE * GRID_SIZE;
// Every cursor (the player's own, and each machine's) is shaped the same:
// {x, z} is its current tile, `facing` drives MoveForward/TurnLeft/
// TurnRight, and {homeX, homeZ} is the origin SetPosition(x, z) counts
// from - (0, 0) for the player, a machine's own placement tile for a
// machine, so "the machine itself is 0,0" as asked for.
var playerCursor = { x: Math.floor(GRID_SIZE / 2), z: Math.floor(GRID_SIZE / 2), facing: 0, homeX: 0, homeZ: 0 };
var machines = [];
// Lesson missions are an additive classroom layer. They use a deterministic
// temporary world and never write to the normal free-play save.
var lessonMissionMode = null;
var lessonMissionPendingSource = '';
var lessonMissionAttempt = 0;
// Machine Tutorials get their own disposable practice world, the same idea as a lesson
// mission's deterministic sandbox but swapped in/out of the SAME farm view rather than a
// separate URL mode - see the "Machine Tutorials engine" section for enterTutorialSandbox /
// exitTutorialSandbox. tutorialSavedRealState is a full snapshot of the student's real
// free-play state, taken once when the first tutorial of a session starts and restored the
// moment they leave tutorial mode; it is never itself written to localStorage.
var tutorialMode = false;
var tutorialSavedRealState = null;
// Defined with the rest of the game state because boot-time save selection
// needs to know whether this URL is a mission before it decides whether to
// load the student's free-play farm.
var LESSON_MISSIONS = {
  'sequence-01': { title: 'Sequence 1: Plant one crop', objective: 'Run one action and plant the starter Carrot on tile (0, 0).', money: 0, inventory: { Carrot: 1 }, tiles: [[0, 0]], start: { x: 0, z: 0 }, targets: [{ x: 0, z: 0, type: 'Carrot' }], required: ['Plant'], forbidden: ['IF', 'FOR', 'WHILE'] },
  'sequence-02': { title: 'Sequence 2: Buy, move, plant', objective: 'Write a sequence that buys a Carrot, moves to (1, 0), then plants it.', money: 10, inventory: {}, tiles: [[0, 0], [1, 0]], start: { x: 0, z: 0 }, targets: [{ x: 1, z: 0, type: 'Carrot' }], required: ['Buy', 'SetPosition', 'Plant'], forbidden: ['IF', 'FOR', 'WHILE'] },
  'sequence-03': { title: 'Sequence 3: Two squares', objective: 'Write explicit instructions to plant Carrots on (2, 0) and (3, 0).', money: 0, inventory: { Carrot: 2 }, tiles: [[0, 0], [1, 0], [2, 0], [3, 0]], start: { x: 0, z: 0 }, targets: [{ x: 2, z: 0, type: 'Carrot' }, { x: 3, z: 0, type: 'Carrot' }], required: ['SetPosition', 'Plant'], forbidden: ['IF', 'FOR', 'WHILE'] }
};
var nextMachineId = 1;
var isRunning = false; // true while the player's own program is executing
var runEpoch = 0;      // bumped by Reset Game so any in-flight program aborts cleanly

function invCount(name) { return inventory[name] || 0; }

// ============================================================
// ECONOMY: unlocks and dynamic seed pricing
// ============================================================
function isUnlocked(name) {
  var item = activeItems()[name];
  if (!item || item.tier === 0) return true;
  // Unlock is a single, natural gate: lifetime coins earned. There is no
  // "sell N of the previous vegetable" requirement - money (and prices)
  // scaling exponentially is the pacing, so a player with enough earned
  // coins can always advance, exactly like Cookie Clicker's building
  // unlocks follow ownership rather than a separate chore.
  return totalEarned >= item.unlockEarned;
}

// How much more (in lifetime coins earned) is needed before this one
// unlocks - used to show shop rows a helpful "you need X more" message
// instead of just hiding them.
function unlockProgressMessage(name) {
  var item = activeItems()[name];
  var earnedLeft = Math.max(0, item.unlockEarned - totalEarned);
  return 'Earn ' + earnedLeft.toLocaleString() + ' more coins total (lifetime, not current balance).';
}

// The price of the NEXT seed/battery packet of this item - a fixed tier price
// (no per-purchase escalation, see the economy comment above for why).
function currentSeedPrice(name) {
  return activeItems()[name].seedCost;
}

