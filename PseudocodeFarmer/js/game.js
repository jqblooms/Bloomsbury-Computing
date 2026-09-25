'use strict';

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

// ============================================================
// THREE.JS SCENE SETUP
// ============================================================
var canvas = document.getElementById('three-canvas');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecae6);
scene.fog = new THREE.Fog(0x8ecae6, 14, 30);

var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

var ambient = new THREE.AmbientLight(0xfff2d8, 0.75);
scene.add(ambient);
var sun = new THREE.DirectionalLight(0xfff6e0, 1.05);
sun.position.set(6, 10, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
scene.add(sun);
scene.add(sun.target);

// A soft ring of fill light so the underside of plants/machines isn't pitch black
var fill = new THREE.HemisphereLight(0xcfe8ff, 0x6b8f4a, 0.4);
scene.add(fill);

// ---------- Ground tiles ----------
var tileGroup = new THREE.Group();
scene.add(tileGroup);
var tileGeometry = new THREE.BoxGeometry(TILE_SIZE * 0.94, 0.22, TILE_SIZE * 0.94);
var ownedTileMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
var edgeTileMaterial = new THREE.MeshStandardMaterial({ color: 0x33402c, roughness: 1, transparent: true, opacity: 0.55 });
var ownedTileMesh = null;
var edgeTileMesh = null;
var tileMatrix = new THREE.Matrix4();
var MAX_TILE_INSTANCES = Math.pow(GRID_SIZE + MAX_EXPANSION * 2, 2);

function makeTileColor() {
  // Keep the existing per-tile colour variation while allowing every soil/water/rock square
  // to be rendered in a single instanced draw call. Each non-crop farm type gets a genuinely
  // different hue, not just different words - watery blue for Aquarium, dusty grey rock for
  // Rocket Yard. currentFarmType must already be set to its NEW value by the time this runs
  // (every caller that switches farm type sets it before calling rebuildGarden(), never
  // after) or new tiles would pick up the previous type's colour.
  var hue = 0.27 + (Math.random() - 0.5) * 0.03, sat = 0.35 + Math.random() * 0.08, light = 0.30 + Math.random() * 0.05;
  if (currentFarmType === 'aquarium') {
    hue = 0.56 + (Math.random() - 0.5) * 0.04; sat = 0.45 + Math.random() * 0.10; light = 0.38 + Math.random() * 0.06;
  } else if (currentFarmType === 'rocket') {
    hue = 0.07 + (Math.random() - 0.5) * 0.03; sat = 0.08 + Math.random() * 0.05; light = 0.34 + Math.random() * 0.08;
  }
  return new THREE.Color().setHSL(hue, sat, light);
}

// Garden tiles: owned ones are normal soil; the purchasable edge tiles are
// rendered dimmer so students can see where they can expand.
function tileKey(x, z) { return x + ',' + z; }
function tileAt(x, z) { return tiles[tileKey(x, z)] || null; }
function isOwned(x, z) { return !!tiles[tileKey(x, z)]; }
function makeOwnedTile(x, z) {
  tiles[tileKey(x, z)] = { x: x, z: z, color: makeTileColor(), plant: null, hasMachine: false };
}
function makeEdgeTile(x, z) {
  edgeTiles[tileKey(x, z)] = { x: x, z: z };
}
function rebuildTileBatches() {
  var ownedKeys = Object.keys(tiles);
  if (!ownedTileMesh) {
    ownedTileMesh = new THREE.InstancedMesh(tileGeometry, ownedTileMaterial, MAX_TILE_INSTANCES);
    ownedTileMesh.receiveShadow = true;
    ownedTileMesh.frustumCulled = false;
    ownedTileMesh.userData.isTileBatch = true;
    ownedTileMesh.userData.isEdge = false;
    tileGroup.add(ownedTileMesh);
  }
  ownedTileMesh.count = ownedKeys.length;
  ownedTileMesh.userData.gridByInstance = [];
  ownedKeys.forEach(function (key, index) {
    var tile = tiles[key];
    tileMatrix.makeTranslation(tileWorldX(tile.x), -0.11, tileWorldZ(tile.z));
    ownedTileMesh.setMatrixAt(index, tileMatrix);
    ownedTileMesh.setColorAt(index, tile.color);
    ownedTileMesh.userData.gridByInstance[index] = { gridX: tile.x, gridZ: tile.z, isEdge: false };
  });
  ownedTileMesh.instanceMatrix.needsUpdate = true;
  if (ownedTileMesh.instanceColor) ownedTileMesh.instanceColor.needsUpdate = true;

  var edgeKeys = Object.keys(edgeTiles);
  if (!edgeTileMesh) {
    edgeTileMesh = new THREE.InstancedMesh(tileGeometry, edgeTileMaterial, MAX_TILE_INSTANCES);
    edgeTileMesh.userData.isTileBatch = true;
    edgeTileMesh.userData.isEdge = true;
    edgeTileMesh.frustumCulled = false;
    tileGroup.add(edgeTileMesh);
  }
  edgeTileMesh.count = edgeKeys.length;
  edgeTileMesh.userData.gridByInstance = [];
  edgeKeys.forEach(function (key, index) {
    var tile = edgeTiles[key];
    tileMatrix.makeTranslation(tileWorldX(tile.x), -0.11, tileWorldZ(tile.z));
    edgeTileMesh.setMatrixAt(index, tileMatrix);
    edgeTileMesh.userData.gridByInstance[index] = { gridX: tile.x, gridZ: tile.z, isEdge: true };
  });
  edgeTileMesh.instanceMatrix.needsUpdate = true;
}
function tileDataFromHit(hit) {
  if (!hit || !hit.object) return null;
  if (hit.object.userData.isTileBatch) {
    return hit.object.userData.gridByInstance[hit.instanceId] || null;
  }
  return hit.object.userData;
}
function inExpansionBounds(x, z) {
  return x >= -MAX_EXPANSION && x <= (GRID_SIZE - 1) + MAX_EXPANSION &&
         z >= -MAX_EXPANSION && z <= (GRID_SIZE - 1) + MAX_EXPANSION;
}
// Recompute which locked tiles border the owned region.
function refreshEdgeTiles() {
  var needed = {};
  for (var key in tiles) {
    var p = key.split(','); var x = +p[0], z = +p[1];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var nx = x + d[0], nz = z + d[1];
      if (inExpansionBounds(nx, nz) && !isOwned(nx, nz)) needed[tileKey(nx, nz)] = true;
    });
  }
  for (var ekey in edgeTiles) {
    if (!needed[ekey]) delete edgeTiles[ekey];
  }
  for (var nkey in needed) {
    if (!edgeTiles[nkey]) { var np = nkey.split(','); makeEdgeTile(+np[0], +np[1]); }
  }
  rebuildTileBatches();
}

// Initial GRID_SIZE x GRID_SIZE garden, then draw its purchasable border.
for (var x = 0; x < GRID_SIZE; x++) {
  for (var z = 0; z < GRID_SIZE; z++) {
    makeOwnedTile(x, z);
  }
}
refreshEdgeTiles();

// A slightly larger, darker slab underneath so tile gaps read as soil, not
// void. Sized for the maximum expansion so it never needs to grow later.
var base = new THREE.Mesh(
  new THREE.BoxGeometry((GRID_SIZE + MAX_EXPANSION * 2) + 0.4, 0.18, (GRID_SIZE + MAX_EXPANSION * 2) + 0.4),
  new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 })
);
base.position.y = -0.3;
base.receiveShadow = true;
scene.add(base);

// ============================================================
// GARDEN EXPANSION (buy one tile at a time)
// ============================================================
// Tiles are one-time purchases, so an escalating per-tile cost works here
// (Cookie Clicker's 1.15^owned for buildings), unlike the seed "heat" idea
// which broke the recurring buy-sell loop. The cost rises with how many
// tiles you've bought beyond the starting GRID_SIZE x GRID_SIZE.
var TILE_COST_BASE = 20;
var TILE_COST_GROWTH = 1.15;
function nextTileCost() {
  var extra = ownedTileCount - GRID_SIZE * GRID_SIZE;
  return Math.round(TILE_COST_BASE * Math.pow(TILE_COST_GROWTH, extra));
}
function buyTile(x, z) {
  if (isOwned(x, z)) return false;
  if (!edgeTiles[tileKey(x, z)]) return false;
  var cost = nextTileCost();
  if (money < cost) {
    logConsole('This tile costs ' + cost + ' coins, but you only have ' + money + '.', true);
    return false;
  }
  money -= cost;
  delete edgeTiles[tileKey(x, z)];
  makeOwnedTile(x, z);
  ownedTileCount++;
  ownedMinX = Math.min(ownedMinX, x); ownedMaxX = Math.max(ownedMaxX, x);
  ownedMinZ = Math.min(ownedMinZ, z); ownedMaxZ = Math.max(ownedMaxZ, z);
  refreshEdgeTiles();
  markGameDirty();
  requestHUDUpdate();
  requestTileInfoUpdate();
  logConsole('Bought a new garden tile for ' + cost + ' coins!');
  return true;
}
// Clear every owned + edge tile mesh and rebuild the garden from a list of
// [x, z] coordinates. Used by loadGame (restore the saved expansion) and
// resetGame (back to the starting GRID_SIZE x GRID_SIZE).
function rebuildGarden(ownedTilesList) {
  for (var key in tiles) {
    var tl = tiles[key];
    if (tl.plant) {
      scene.remove(tl.plant.sprite);
      disposeSprite(tl.plant.sprite, false);
      if (tl.plant.pct) {
        scene.remove(tl.plant.pct.sprite);
        disposeSprite(tl.plant.pct.sprite, false);
      }
    }
  }
  tiles = {};
  edgeTiles = {};
  plantedTiles = [];
  ownedMinX = Infinity; ownedMaxX = -Infinity; ownedMinZ = Infinity; ownedMaxZ = -Infinity;
  ownedTileCount = 0;
  ownedTilesList.forEach(function (c) {
    makeOwnedTile(c[0], c[1]);
    ownedMinX = Math.min(ownedMinX, c[0]); ownedMaxX = Math.max(ownedMaxX, c[0]);
    ownedMinZ = Math.min(ownedMinZ, c[1]); ownedMaxZ = Math.max(ownedMaxZ, c[1]);
    ownedTileCount++;
  });
  refreshEdgeTiles();
}
function initialTileList() {
  var list = [];
  for (var x = 0; x < GRID_SIZE; x++) for (var z = 0; z < GRID_SIZE; z++) list.push([x, z]);
  return list;
}

// ---------- Player cursor arrow ----------
var cursorGroup = new THREE.Group();
var arrowGeom = new THREE.ConeGeometry(0.16, 0.34, 4);
var arrowMat = new THREE.MeshStandardMaterial({ color: 0xf2b53c, emissive: 0x5a3c00, emissiveIntensity: 0.3 });
var arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
arrowMesh.rotation.x = Math.PI; // point downward
arrowMesh.castShadow = true;
cursorGroup.add(arrowMesh);
scene.add(cursorGroup);

// A small glowing "nose" that sits off to whichever side the cursor is
// currently facing - the cone/diamond markers are round, so this is the
// only thing that actually shows TurnLeft/TurnRight doing anything.
// Every facing is one of 4 grid-aligned directions (never diagonal), so
// this only ever needs a position offset, no rotation - simpler and
// nothing to get backwards.
function makeFacingIndicator(color) {
  var mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 10),
    new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.7 })
  );
  return mesh;
}
function updateFacingIndicator(indicatorMesh, facing) {
  var v = FACING_VECTORS[((facing % 4) + 4) % 4];
  indicatorMesh.position.set(v.dx * 0.34, 0.02, v.dz * 0.34);
}
var playerFacingIndicator = makeFacingIndicator(0xffffff);
cursorGroup.add(playerFacingIndicator);
updateFacingIndicator(playerFacingIndicator, playerCursor.facing);

function tileWorldX(x) { return x - HALF; }
function tileWorldZ(z) { return z - HALF; }

// ── Tutorial tile highlights: a pulsing ring on the ground marking exactly
// which tile(s) a tutorial step wants the student standing on, clicking, or
// placing a machine on. Independent freestanding meshes (same idea as the
// player/machine cursor markers above), not part of the tile grid's own
// instanced mesh - that instancing shares one material across every tile,
// so it can't highlight a single one on its own. Cleared and rebuilt
// whenever the active tutorial step changes (renderTutorialStep) and on
// every exit/finish, so nothing lingers once the reason for it is gone.
var tutorialHighlightMeshes = [];
function makeTutorialHighlightRing() {
  var mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.47, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2; // lie flat on the ground, not stand up like a wall
  mesh.renderOrder = 5;
  return mesh;
}
function clearTutorialHighlights() {
  tutorialHighlightMeshes.forEach(function (m) { scene.remove(m); disposeObject3D(m); });
  tutorialHighlightMeshes = [];
}
// tilesXZ: array of {x, z} in absolute grid coordinates (a tutorial step
// resolves its own home-relative offsets to absolute tiles before calling
// this - see resolveTutorialHighlightTiles).
function setTutorialHighlights(tilesXZ) {
  clearTutorialHighlights();
  (tilesXZ || []).forEach(function (t) {
    var mesh = makeTutorialHighlightRing();
    mesh.position.set(tileWorldX(t.x), 0.14, tileWorldZ(t.z));
    scene.add(mesh);
    tutorialHighlightMeshes.push(mesh);
  });
}
// Animated once per frame from animate() below - a slow opacity/scale pulse,
// not a static ring, so it reads as "look here" rather than blending into
// the rest of the field's fixed decoration.
function updateTutorialHighlightPulse(elapsed) {
  if (!tutorialHighlightMeshes.length) return;
  var pulse = 0.55 + Math.sin(elapsed * 3.2) * 0.35;
  var scale = 1 + Math.sin(elapsed * 3.2) * 0.14;
  tutorialHighlightMeshes.forEach(function (m) {
    m.material.opacity = pulse;
    m.scale.set(scale, 1, scale);
  });
}

var coordsEl = document.getElementById('coords');
function updateCoordReadout() {
  if (!coordsEl) return;
  coordsEl.innerHTML = 'Tile <b>(' + playerCursor.x + ', ' + playerCursor.z + ')</b>';
}
function updatePlayerCursorPosition() {
  cursorGroup.position.set(tileWorldX(playerCursor.x), 0.85, tileWorldZ(playerCursor.z));
  updateCoordReadout();
}
updatePlayerCursorPosition();

// ============================================================
// CAMERA CONTROLS (hand-rolled pan + zoom, so the whole app has no extra
// dependency beyond three.js itself - no examples/jsm build needed). The
// garden expands now, so the view slides around the field on the ground
// plane instead of orbiting it.
// ============================================================
var camState = { radius: 11, theta: 0, phi: 1.0, target: new THREE.Vector3(0, 0, 0) };
var pointer = { down: false, moved: false, lastX: 0, lastY: 0, downX: 0, downY: 0, id: null, button: 0 };
var heldKeys = {};
var lastFrameMs = 0;

// Screen-right and screen-"away" directions flattened onto the ground (X/Z)
// plane. Panning always uses these, so the camera can only slide sideways
// and never changes height.
function cameraHorizontalVectors() {
  var theta = camState.theta;
  return {
    right: new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta)),
    forward: new THREE.Vector3(-Math.sin(theta), 0, -Math.cos(theta))
  };
}

var compassCard = document.getElementById('compass-card');
// The compass dial spins with the camera so N always points to true world
// north (the -Z / "up" direction) wherever it appears on screen. World north
// shows up at a screen angle equal to the camera azimuth `theta`, so rotating
// the card by theta lines the N label up with it. Letters counter-rotate via
// --rot so they stay upright, and a fixed notch marks screen-up.
function updateCompass() {
  if (!compassCard) return;
  compassCard.style.setProperty('--rot', (camState.theta * 180 / Math.PI) + 'deg');
}

function applyCameraState() {
  var r = camState.radius;
  var phi = camState.phi;
  var theta = camState.theta;
  camera.position.set(
    camState.target.x + r * Math.sin(phi) * Math.sin(theta),
    camState.target.y + r * Math.cos(phi),
    camState.target.z + r * Math.sin(phi) * Math.cos(theta)
  );
  camera.lookAt(camState.target);
  updateCompass();
}
applyCameraState();

canvas.addEventListener('pointerdown', function (e) {
  pointer.down = true; pointer.moved = false;
  pointer.button = e.button;
  pointer.lastX = pointer.downX = e.clientX;
  pointer.lastY = pointer.downY = e.clientY;
  pointer.id = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', function (e) {
  if (!pointer.down || e.pointerId !== pointer.id) return;
  var dx = e.clientX - pointer.lastX;
  var dy = e.clientY - pointer.lastY;
  if (Math.abs(e.clientX - pointer.downX) > 4 || Math.abs(e.clientY - pointer.downY) > 4) pointer.moved = true;
  pointer.lastX = e.clientX; pointer.lastY = e.clientY;
  // Right-button drag orbits the camera around the point you're looking at,
  // changing both the azimuth (dx) and the tilt (dy).
  if (pointer.button === 2) {
    camState.theta -= dx * 0.008;
    camState.phi = Math.min(1.45, Math.max(0.35, camState.phi - dy * 0.008));
    applyCameraState();
    return;
  }
  // Grab-and-pan (left button): the ground follows the cursor, so dragging
  // right slides the view left and dragging down slides it towards you. The
  // movement stays on the ground plane (X/Z) - never up or down.
  var v = cameraHorizontalVectors();
  var k = camState.radius * 0.0016; // perspective-correct pan speed
  camState.target.addScaledVector(v.right, -dx * k);
  camState.target.addScaledVector(v.forward, dy * k);
  applyCameraState();
});
// Hovering over a purchasable edge tile swaps the bottom hint for a "buy"
// prompt, so students can see the expansion cost before committing.
var canvasHintEl = document.getElementById('canvas-hint');
canvas.addEventListener('pointermove', function (e) {
  if (pointer.down) return;
  var hitData = raycastTileMesh(e.clientX, e.clientY);
  if (hitData && hitData.isEdge) {
    canvasHintEl.textContent = '🪙 Click to buy this tile (' + nextTileCost() + ' coins)';
  } else {
    canvasHintEl.textContent = 'Drag or WASD / arrows to move · Right-drag or Q/E/R/F to rotate · Scroll to zoom · Click a tile';
  }
});
canvas.addEventListener('pointerup', function (e) {
  if (e.pointerId !== pointer.id) return;
  pointer.down = false;
  if (pointer.button === 2) { pointer.button = 0; return; } // right-drag orbits, never a tile click
  pointer.button = 0;
  if (!pointer.moved) handleTileClick(e.clientX, e.clientY);
});
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
canvas.addEventListener('wheel', function (e) {
  e.preventDefault();
  camState.radius = Math.min(20, Math.max(5, camState.radius + e.deltaY * 0.01));
  applyCameraState();
}, { passive: false });

// WASD / arrow keys slide the camera around the field while held; Q/E rotate
// it left/right and R/F tilt it up/down. Only the ground plane is used for
// panning, so the view never changes height. Keys are ignored while the
// player is typing in a text box.
var CAM_KEYS = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'e', 'r', 'f'];
function keyName(e) { return e.key.length === 1 ? e.key.toLowerCase() : e.key; }
window.addEventListener('keydown', function (e) {
  var tag = (e.target && e.target.tagName) || '';
  if (tag === 'TEXTAREA' || tag === 'INPUT' || (e.target && e.target.isContentEditable)) return;
  var k = keyName(e);
  heldKeys[k] = true;
  if (CAM_KEYS.indexOf(k) !== -1) e.preventDefault();
});
window.addEventListener('keyup', function (e) {
  heldKeys[keyName(e)] = false;
});
window.addEventListener('blur', function () { heldKeys = {}; });

// ============================================================
// TILE SELECTION (raycasting)
// ============================================================
var raycaster = new THREE.Raycaster();
var ndc = new THREE.Vector2();

function handleTileClick(clientX, clientY) {
  // Clicking anywhere on the field leaves an in-progress machine code edit
  // (its changes are discarded, same as pressing Cancel).
  editingMachineCodeId = null;
  var rect = canvas.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);

  // Clicking directly on a machine's little robot body selects it (a
  // distinct pink cursor colour, its code shown in the info panel)
  // instead of moving the player there - useful once more than one
  // machine is on the field and they need telling apart.
  var machineHitObjects = [];
  machines.forEach(function (m) { m.group.traverse(function (o) { if (o.isMesh) machineHitObjects.push(o); }); });
  var machineHits = machineHitObjects.length ? raycaster.intersectObjects(machineHitObjects) : [];
  if (machineHits.length) {
    var hitId = machineHits[0].object.userData.machineId;
    var hitMachine = machines.filter(function (m) { return m.id === hitId; })[0];
    if (hitMachine) { selectMachine(hitMachine); return; }
  }

  var tileBatches = [ownedTileMesh, edgeTileMesh].filter(Boolean);
  var hits = raycaster.intersectObjects(tileBatches);
  if (!hits.length) return;
  var hit = tileDataFromHit(hits[0]);
  if (!hit) return;
  // Clicking a dimmer edge tile buys it (garden expansion); owned tiles move
  // the cursor there.
  if (hit.isEdge) {
    buyTile(hit.gridX, hit.gridZ);
    return;
  }
  playerCursor.x = hit.gridX;
  playerCursor.z = hit.gridZ;
  markGameDirty();
  updatePlayerCursorPosition();
  if (activeTutorial) refreshTutorialHighlight(); // a click-to-move, same as any other player move - see onCursorMoved's own call
  selectMachine(null); // clicking open ground clears any machine selection
  updateTileInfoPanel();
}

function raycastTileMesh(clientX, clientY) {
  var rect = canvas.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  var tileBatches = [ownedTileMesh, edgeTileMesh].filter(Boolean);
  var hits = raycaster.intersectObjects(tileBatches);
  return hits.length ? tileDataFromHit(hits[0]) : null;
}

// ============================================================
// PLANT TEXTURES (loaded once, cached, shared by every sprite of that veg)
// ============================================================
var textureCache = {};
function loadVeggieTexture(name) {
  if (textureCache[name]) return textureCache[name];
  var veg = lookupItem(name);
  var tex = new THREE.Texture();
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    var size = 128;
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    tex.image = c;
    tex.needsUpdate = true;
  };
  img.onerror = function () {
    console.warn('Could not load texture for', name);
  };
  img.src = twemojiUrl(veg.emoji);
  textureCache[name] = tex;
  return tex;
}
VEGGIE_NAMES.forEach(loadVeggieTexture); // warm the cache before anyone plants
BATTERY_NAMES.forEach(loadVeggieTexture); // same warm-up for Solar Farm, so switching to it never has a texture-load delay
FISH_NAMES.forEach(loadVeggieTexture); // same warm-up for Aquarium
FUEL_NAMES.forEach(loadVeggieTexture); // same warm-up for Rocket Yard

// ============================================================
// PLANTING / GROWING / SELLING
// ============================================================
// vegNameRaw goes through matchSeedName first - the same lenient "Carrot" OR
// "Carrot Seeds" matching Buy()/SeedCount()/HasCrop() already give, via the
// exact same function. Before this, Plant() alone required the bare crop
// name and silently rejected the shop's own displayed label ("Carrot
// Seeds") with "no seed called that" - a real asymmetry a student could hit
// by typing the exact name shown on screen, even though every other
// command already accepted it fine.
function plantAt(cursor, vegNameRaw) {
  var ft = activeFarmType();
  var vegName = matchSeedName(vegNameRaw);
  if (!vegName) {
    return { ok: false, message: 'There is no ' + ft.unitLabel + ' called "' + vegNameRaw + '". Look at the shop for the names you can use.' };
  }
  var tile = tileAt(cursor.x, cursor.z);
  if (tile.plant) {
    return { ok: false, message: 'That tile already has something growing on it.' };
  }
  if (tile.hasMachine) {
    return { ok: false, message: 'There is a machine standing on that tile.' };
  }
  if (invCount(vegName) <= 0) {
    return { ok: false, message: 'You do not have any ' + vegName + ' ' + ft.unitLabelPlural + '. Buy some first with CALL Buy("' + vegName + ft.nameSuffix + '").' };
  }
  inventory[vegName]--;
  var veg = activeItems()[vegName];
  var material = new THREE.SpriteMaterial({ map: loadVeggieTexture(vegName), transparent: true });
  if (veg.tint) material.color.setHex(veg.tint);
  var sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0);
  sprite.scale.set(0.001, 0.001, 0.001);
  sprite.position.set(tileWorldX(cursor.x), 0.02, tileWorldZ(cursor.z));
  scene.add(sprite);
  tile.plant = {
    type: vegName,
    plantedAt: Date.now(), // wall-clock, so growth survives a page reload
    growMs: veg.growSeconds * 1000,
    sprite: sprite,
    pct: makePlantLabel(cursor.x, cursor.z),
    ready: false
  };
  addPlantedTile(tile);
  markGameDirty();
  requestHUDUpdate();
  var placedVerbPast = ft.plantVerb === 'Plant' ? 'Planted' : 'Placed';
  return { ok: true, message: placedVerbPast + ' a ' + vegName + '! It will be ready to sell in ' + veg.growSeconds + ' seconds.' };
}

function sellAt(cursor, viaCode) {
  var tile = tileAt(cursor.x, cursor.z);
  if (!tile.plant) return { ok: false, message: 'There is nothing ' + (activeFarmType().plantVerb === 'Plant' ? 'planted' : 'placed') + ' here.' };
  if (!tile.plant.ready) return { ok: false, message: 'That is not ready to sell yet.' };
  var wasSellFarmUnlocked = sellFarmUnlocked();
  var baseValue = currentSellValue(tile.plant); // flat for crops; time-dependent for batteries
  var price = Math.round(baseValue * (viaCode ? CODE_SELL_BONUS : 1));
  money += price;
  totalEarned += price;
  farmEarned += price;
  if (price > bestSaleValue) bestSaleValue = price;
  soldCount[tile.plant.type] = (soldCount[tile.plant.type] || 0) + 1;
  scene.remove(tile.plant.sprite);
  disposeSprite(tile.plant.sprite, false);
  if (tile.plant.pct) {
    scene.remove(tile.plant.pct.sprite);
    disposeSprite(tile.plant.pct.sprite, false);
  }
  spawnFloatingText(cursor.x, cursor.z, '+' + price + 'c', viaCode ? '#9a5b0a' : '#2e6b30');
  var soldName = tile.plant.type;
  tile.plant = null;
  removePlantedTile(tile);
  var justUnlocked = refreshUnlocks();
  markGameDirty();
  requestHUDUpdate();
  requestTileInfoUpdate();
  var message = 'Sold the ' + soldName + ' for ' + price.toLocaleString() + ' coins' + (viaCode ? ' (code bonus!)' : '') + '!';
  if (justUnlocked.length) message += ' New in the shop: ' + justUnlocked.join(', ') + '!';
  if (!wasSellFarmUnlocked && sellFarmUnlocked()) message += ' You can now Sell the Farm and try a new kind of farm!';
  return { ok: true, message: message };
}

// Re-checks every vegetable's unlock state after something that could
// have changed it (selling something). Returns the names that flipped
// from locked to unlocked just now, so the caller can tell the player.
function refreshUnlocks() {
  var justUnlocked = [];
  activeItemNames().forEach(function (name) {
    var wasUnlocked = unlockedState[name];
    var nowUnlocked = isUnlocked(name);
    if (nowUnlocked && !wasUnlocked) justUnlocked.push(name);
    unlockedState[name] = nowUnlocked;
  });
  return justUnlocked;
}

function buySeed(vegName, viaCode) {
  if (!activeItems()[vegName]) {
    return { ok: false, message: 'There is no ' + activeFarmType().unitLabel + ' called "' + vegName + '". Look at the shop for the names you can use.' };
  }
  if (!isUnlocked(vegName)) {
    return { ok: false, message: vegName + ' is not unlocked yet. ' + unlockProgressMessage(vegName) };
  }
  var ft = activeFarmType();
  var price = viaCode ? Math.round(currentSeedPrice(vegName) * CODE_BUY_DISCOUNT) : currentSeedPrice(vegName);
  if (money < price) {
    return { ok: false, message: 'You need ' + price + ' coins for ' + vegName + ' ' + ft.unitLabelPlural + ' right now, but you only have ' + money + '.' };
  }
  money -= price;
  inventory[vegName] = invCount(vegName) + 1;
  markGameDirty();
  requestHUDUpdate();
  return { ok: true, message: 'Bought 1 ' + ft.unitLabel + ' of ' + vegName + ' for ' + price.toLocaleString() + ' coins' + (viaCode ? ' (code discount!)' : '') + '.' };
}

// Buy() in code takes the shop's exact label, e.g. "Carrot Seeds" - this peels off the
// " Seeds" suffix (harmless to try even on the Solar Farm, whose battery names never end in
// "seed(s)") so students can type the same phrase the shop panel shows them. Turns a shop
// label into its canonical item name for the CURRENTLY active farm type, so both Buy("...")
// and SeedCount(...) accept the same wording the shop panel shows. Returns null if it isn't
// something the active farm type's shop knows.
function matchSeedName(label) {
  var name = String(label || '').replace(/\s*seeds?\s*$/i, '').trim();
  return activeItemNames().filter(function (n) { return n.toLowerCase() === name.toLowerCase(); })[0] || null;
}
function buySeedByLabel(label, viaCode) {
  var match = matchSeedName(label);
  if (!match) {
    return { ok: false, message: '"' + label + '" is not something the shop sells right now.' };
  }
  return buySeed(match, viaCode);
}

// Read-only pseudo-functions a program can call inside expressions (WHILE /
// IF conditions, OUTPUT, or an assignment). They return values rather than
// acting, so a machine can reason about the world instead of blindly looping.
// Cambridge identifiers use mixed case with a capital at the start of each
// word. Legacy spellings with underscores remain accepted so saved machines
// continue to run, but all newly compiled calls use these canonical names.
var FUNCTIONS = ['HasCrop', 'CropOnTile', 'Money', 'SeedCount'];
// These names predate Solar Farm/Aquarium and stay the primary, documented ones everywhere
// (tutorials, the cheat sheet, error messages) - but "HasCrop" reads oddly for a battery or
// a fish. FUNCTION_ALIASES gives each a farm-type-neutral synonym that resolves to the exact
// same canonical name and behaviour, the same "legacy spelling accepted" idea already used
// for underscored names, just for a different reason.
var FUNCTION_ALIASES = { HasPlant: 'HasCrop', PlantOnTile: 'CropOnTile', ItemCount: 'SeedCount' };
function identifierKey(name) { return String(name || '').replace(/_/g, '').toLowerCase(); }
function canonicalFunctionName(name) {
  var key = identifierKey(name);
  for (var i = 0; i < FUNCTIONS.length; i++) {
    if (identifierKey(FUNCTIONS[i]) === key) return FUNCTIONS[i];
  }
  for (var alias in FUNCTION_ALIASES) {
    if (identifierKey(alias) === key) return FUNCTION_ALIASES[alias];
  }
  return null;
}
function callFunction(name, args, cursor, line) {
  name = canonicalFunctionName(name) || name;
  if (name === 'Money') return money; // coins in your wallet right now
  if (name === 'HasCrop') {
    var tile = cursor ? tileAt(cursor.x, cursor.z) : null;
    if (!args.length) return !!(tile && tile.plant);
    var requestedCrop = matchSeedName(String(args[0]));
    if (!requestedCrop) throw new PseudocodeError('"' + args[0] + '" is not a crop name. Try HasCrop("Carrot").', line);
    return !!(tile && tile.plant && tile.plant.type === requestedCrop);
  }
  if (name === 'CropOnTile') {
    var tile2 = cursor ? tileAt(cursor.x, cursor.z) : null;
    return (tile2 && tile2.plant) ? tile2.plant.type : 'None';
  }
  if (name === 'SeedCount') {
    if (args[0] === undefined) throw new PseudocodeError('SeedCount needs a seed name, e.g. SeedCount("Carrot").', line);
    var veg = matchSeedName(String(args[0]));
    if (!veg) throw new PseudocodeError('"' + args[0] + '" is not a seed name. Try SeedCount("Carrot Seeds").', line);
    return invCount(veg);
  }
  throw new PseudocodeError('"' + name + '" is not a function I know. Try ' + FUNCTIONS.join(', ') + '.', line);
}

function moveCursor(cursor, dx, dz) {
  var nx = Math.min(ownedMaxX, Math.max(ownedMinX, cursor.x + dx));
  var nz = Math.min(ownedMaxZ, Math.max(ownedMinZ, cursor.z + dz));
  var moved = nx !== cursor.x || nz !== cursor.z;
  cursor.x = nx; cursor.z = nz;
  return moved;
}

// Turtle-style movement: steps one tile in whichever direction the cursor
// is currently facing (see FACING_VECTORS above).
function moveForward(cursor) {
  var v = FACING_VECTORS[((cursor.facing % 4) + 4) % 4];
  return moveCursor(cursor, v.dx, v.dz);
}

function turnCursor(cursor, delta) {
  cursor.facing = ((cursor.facing + delta) % 4 + 4) % 4;
}

// SetPosition(x, z) is relative to the cursor's own home tile - (0, 0)
// for the player, a machine's own placement tile for a machine - so "the
// machine itself is 0,0", as asked for.
function setPositionRelative(cursor, dx, dz) {
  cursor.x = Math.min(ownedMaxX, Math.max(ownedMinX, cursor.homeX + Math.round(dx)));
  cursor.z = Math.min(ownedMaxZ, Math.max(ownedMinZ, cursor.homeZ + Math.round(dz)));
}

// ============================================================
// FLOATING TEXT (a little "+9c" popup that rises and fades)
// ============================================================
var floatingTexts = [];
var floatingTextTextureCache = {};
function disposeSprite(sprite, disposeMap) {
  if (!sprite || !sprite.material) return;
  if (disposeMap && sprite.material.map) sprite.material.map.dispose();
  sprite.material.dispose();
}
function disposeObject3D(object) {
  if (!object) return;
  object.traverse(function (child) {
    if (!child.isMesh) return;
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) child.material.forEach(function (material) { material.dispose(); });
    else if (child.material) child.material.dispose();
  });
}
function getFloatingTextTexture(text, color) {
  var key = (color || '#2e6b30') + '|' + text;
  if (floatingTextTextureCache[key]) return floatingTextTextureCache[key];
  var c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  var ctx = c.getContext('2d');
  ctx.font = '800 54px "Baloo 2", sans-serif';
  ctx.fillStyle = color || '#2e6b30';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(text, 128, 48);
  ctx.fillText(text, 128, 48);
  var tex = new THREE.CanvasTexture(c);
  floatingTextTextureCache[key] = tex;
  return tex;
}
function spawnFloatingText(gx, gz, text, color) {
  var tex = getFloatingTextTexture(text, color);
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(1.1, 0.42, 1);
  sprite.position.set(tileWorldX(gx), 1.1, tileWorldZ(gz));
  sprite.renderOrder = 10;
  scene.add(sprite);
  floatingTexts.push({ sprite: sprite, born: performance.now() });
}
function updateFloatingTexts(now) {
  for (var i = floatingTexts.length - 1; i >= 0; i--) {
    var f = floatingTexts[i];
    var t = (now - f.born) / 900;
    if (t >= 1) {
      scene.remove(f.sprite);
      disposeSprite(f.sprite, false);
      floatingTexts.splice(i, 1);
      continue;
    }
    f.sprite.position.y = 1.1 + t * 0.8;
    f.sprite.material.opacity = 1 - t;
  }
}

// ============================================================
// PLAYER CODE BOX WIRING
// ============================================================
var codeInput = document.getElementById('code-input');
var codeBackdrop = document.getElementById('code-backdrop');
var codeEditorEl = document.querySelector('.code-editor');
var runBtn = document.getElementById('run-btn');
var machineBtn = document.getElementById('machine-btn');
var consoleOutput = document.getElementById('console-output');

// The code box is scratch space for a one-time task, not a saved script -
// Run executes whatever is in it and empties it straight away, exactly
// like handing in a single piece of work. A machine is the only place
// code actually keeps running: Place Machine also empties the box, but
// because the code has gone to live inside the machine (see placeMachine
// below), not because it's been thrown away. Typing is still normal;
// only copying/cutting/pasting text in or out of the box is blocked, so
// a solution can't be lifted from (or dropped into) it.
['copy', 'cut', 'paste', 'contextmenu'].forEach(function (evt) {
  codeInput.addEventListener(evt, function (e) { e.preventDefault(); });
});

// The textarea's text is transparent - the code is actually rendered by
// the backdrop <div> behind it, so an error line can be tinted red. Both
// layers share the same font/padding/line-height, so they stay in line;
// renderCodeBackdrop re-syncs the backdrop whenever the text changes.
var errorLine = 0; // 1-based line currently flagged as wrong; 0 = none

function renderCodeBackdrop() {
  var lines = codeInput.value.split('\n');
  codeBackdrop.innerHTML = lines.map(function (line, i) {
    var cls = (errorLine > 0 && i + 1 === errorLine) ? ' class="code-line error"' : ' class="code-line"';
    return '<div' + cls + '>' + (line ? escapeHtmlLocal(line) : '&nbsp;') + '</div>';
  }).join('');
}

function setCodeError(lineNo) {
  errorLine = lineNo || 0;
  renderCodeBackdrop();
  codeEditorEl.classList.add('has-error');
  var lh = parseFloat(getComputedStyle(codeInput).lineHeight) || 18;
  codeInput.scrollTop = Math.max(0, (errorLine - 1) * lh - codeInput.clientHeight / 2);
  codeBackdrop.scrollTop = codeInput.scrollTop;
}

function clearCodeError() {
  errorLine = 0;
  renderCodeBackdrop();
  codeEditorEl.classList.remove('has-error');
}

codeInput.addEventListener('input', function () { clearCodeError(); }); // typing invalidates the flagged line
codeInput.addEventListener('scroll', function () {
  codeBackdrop.scrollTop = codeInput.scrollTop;
  codeBackdrop.scrollLeft = codeInput.scrollLeft;
});

var machineLogQueue = [];
var machineLogByKey = {};
var lastMachineLogFlush = 0;

function appendConsoleRow(message, isError, isMachine, count, fragment) {
  var row = document.createElement('div');
  if (isError) row.className = 'err';
  else if (isMachine) row.className = 'machine-line';
  row.textContent = message + (count > 1 ? ' (x' + count + ')' : '');
  (fragment || consoleOutput).appendChild(row);
}

function logConsole(message, isError, isMachine) {
  if (isMachine) {
    var key = (isError ? '1|' : '0|') + message;
    var pending = machineLogByKey[key];
    if (pending) {
      pending.count++;
    } else if (machineLogQueue.length < 200) {
      pending = { message: message, isError: !!isError, count: 1 };
      machineLogByKey[key] = pending;
      machineLogQueue.push(pending);
    }
    return;
  }
  appendConsoleRow(message, isError, false, 1);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
  while (consoleOutput.children.length > 60) consoleOutput.removeChild(consoleOutput.firstChild);
}

function flushMachineConsole(now, force) {
  if (!machineLogQueue.length || (!force && now - lastMachineLogFlush < 250)) return;
  lastMachineLogFlush = now;
  var queue = machineLogQueue;
  machineLogQueue = [];
  machineLogByKey = {};
  var fragment = document.createDocumentFragment();
  queue.forEach(function (entry) {
    appendConsoleRow(entry.message, entry.isError, true, entry.count, fragment);
  });
  consoleOutput.appendChild(fragment);
  while (consoleOutput.children.length > 60) consoleOutput.removeChild(consoleOutput.firstChild);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function setRunningUI(running) {
  isRunning = running;
  runBtn.disabled = running;
  runBtn.textContent = running ? '⏳ Running...' : '▶ Run';
}

runBtn.addEventListener('click', function () {
  if (isRunning) return;
  var source = codeInput.value;
  if (!source.trim()) { logConsole('Write some code first.', true); return; }
  var compiledProgram;
  try {
    compiledProgram = compile(source); // tokenise and validate once before execution
  } catch (e) {
    setCodeError(e.line || 1);
    logConsole(e.message || String(e), true);
    return;
  }
  clearCodeError();
  setRunningUI(true);
  runProgram(compiledProgram, playerCursor, function (msg, isErr) { logConsole(msg, isErr); }, 350)
    .then(function () {
      codeInput.value = '';
      renderCodeBackdrop();
      setRunningUI(false);
    })
    .catch(function (err) {
      setCodeError(err.line || 1);
      logConsole(err.message || String(err), true);
      setRunningUI(false);
    });
});

machineBtn.addEventListener('click', function () {
  if (isRunning) return;
  var source = codeInput.value;
  if (placeMachine(source)) {
    codeInput.value = ''; // handed off to the machine, not lost
    renderCodeBackdrop();
  }
});

// Capture lesson code before the normal Run handler clears the editor. The
// mission watcher checks the resulting garden after the run finishes.
runBtn.addEventListener('click', function () {
  if (!lessonMissionMode || !codeInput.value.trim()) return;
  lessonMissionPendingSource = codeInput.value;
  setTimeout(watchLessonRun, 0);
});

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
      '<button type="button" class="machine-action-btn" id="machine-save-btn" style="background:#4c9a4a;color:#fff">Save code</button>' +
      '<button type="button" class="machine-action-btn" id="machine-cancel-btn" style="background:#8a5a34;color:#fff">Cancel</button>' +
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
    if (ta) ta.style.borderColor = '#d9534f';
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

// ============================================================
// ROCKET YARD - the capstone build/launch, only reachable once on the 'rocket' farm type
// ============================================================
// Mining fuel is mechanically identical to growing a crop (see the FARM TYPES comment where
// FUEL is defined) - what's actually new here is a one-time, five-part build funded by those
// coins, then a launch whose flight time is real wall-clock hours, counted from
// rocketLaunchAt the same way a plant's own growMs already counts from plantedAt, just at a
// much bigger scale. It ticks on regardless of whether the tab is open, and survives a
// farm-type switch or a page reload (see its two new save/load fields) - a student can start
// a launch, go do something else, and come back later to find it arrived (or still climbing).
var ROCKET_PARTS = [
  { name: 'Fuselage', cost: 500 },
  { name: 'Engine', cost: 2000 },
  { name: 'Fuel Tank', cost: 6000 },
  { name: 'Heat Shield', cost: 15000 },
  { name: 'Boosters', cost: 35000 }
];
var ROCKET_LAUNCH_DURATION_MS = 4 * 60 * 60 * 1000; // 4 real hours - "takes hours to reach"
var rocketPartsOwned = 0;     // 0..ROCKET_PARTS.length, bought strictly in order
var rocketLaunchAt = null;    // ms epoch once launched (Date.now()), null before liftoff

function rocketReadyToLaunch() { return rocketPartsOwned >= ROCKET_PARTS.length; }
function rocketLaunched() { return !!rocketLaunchAt; }
function rocketProgress() {
  if (!rocketLaunchAt) return 0;
  return Math.min(1, (Date.now() - rocketLaunchAt) / ROCKET_LAUNCH_DURATION_MS);
}
function rocketArrived() { return rocketLaunched() && rocketProgress() >= 1; }

function buyRocketPart() {
  if (rocketReadyToLaunch()) return { ok: false, message: 'Every part is already bought - press Launch!' };
  var part = ROCKET_PARTS[rocketPartsOwned];
  if (money < part.cost) {
    return { ok: false, message: 'You need ' + part.cost.toLocaleString() + ' coins for the ' + part.name + ', but you only have ' + Math.floor(money).toLocaleString() + '.' };
  }
  money -= part.cost;
  rocketPartsOwned++;
  markGameDirty();
  requestHUDUpdate();
  updateRocketUI();
  return { ok: true, message: 'Bought the ' + part.name + ' for ' + part.cost.toLocaleString() + ' coins!' };
}
function launchRocket() {
  if (!rocketReadyToLaunch() || rocketLaunched()) return false;
  rocketLaunchAt = Date.now();
  markGameDirty();
  saveGame(true); // never let a real launch be lost to an autosave that hasn't fired yet
  updateRocketUI();
  logConsole('Liftoff! Your rocket is on its way to space - the flight takes real hours, so check back later.');
  return true;
}
// Only reachable once the flight has actually arrived - starts another build from scratch,
// so the capstone can be a repeatable celebration (a class demo, a second attempt) rather
// than a permanent one-shot end state.
function resetRocket() {
  if (!rocketArrived()) return;
  rocketPartsOwned = 0;
  rocketLaunchAt = null;
  markGameDirty();
  updateRocketUI();
}

var rocketLaunchArmed = false;
var rocketLaunchArmTimer = null;
function updateRocketUI() {
  var panel = document.getElementById('rocket-panel');
  var onRocketYard = currentFarmType === 'rocket';
  panel.classList.toggle('shown', onRocketYard);
  if (!onRocketYard) return;

  var buildEl = document.getElementById('rocket-build');
  var flightEl = document.getElementById('rocket-flight');
  var arrivedEl = document.getElementById('rocket-arrived');

  if (rocketArrived()) {
    buildEl.innerHTML = ''; flightEl.innerHTML = '';
    arrivedEl.classList.add('shown');
    arrivedEl.innerHTML = '<span class="arrived-anim">🚀</span>' +
      '<div class="arrived-title">You reached space!</div>' +
      '<div style="font-size:.76rem;color:#b6a6de">Every part built, every hour of the flight real - your rocket made it.</div>' +
      '<button type="button" id="rocket-reset-btn">Build Another Rocket</button>';
    document.getElementById('rocket-reset-btn').addEventListener('click', resetRocket);
    return;
  }
  arrivedEl.classList.remove('shown'); arrivedEl.innerHTML = '';

  if (rocketLaunched()) {
    buildEl.innerHTML = '';
    var pct = Math.floor(rocketProgress() * 100);
    var remainingMs = Math.max(0, ROCKET_LAUNCH_DURATION_MS - (Date.now() - rocketLaunchAt));
    var remainingH = Math.floor(remainingMs / 3600000);
    var remainingM = Math.floor((remainingMs % 3600000) / 60000);
    flightEl.innerHTML =
      '<div class="rocket-flight-track"><span class="stars"></span><span class="rocket-icon" style="bottom:' + (4 + pct * 1.1) + 'px">🚀</span></div>' +
      '<div id="rocket-flight-pct">' + pct + '% there</div>' +
      '<div id="rocket-flight-eta">' + (remainingMs > 0 ? (remainingH + 'h ' + remainingM + 'm remaining - it keeps flying whether or not you\'re watching, come back later') : 'Arriving...') + '</div>';
    return;
  }

  flightEl.innerHTML = '';
  buildEl.innerHTML = ROCKET_PARTS.map(function (part, i) {
    var owned = i < rocketPartsOwned;
    var isNext = i === rocketPartsOwned;
    var cls = owned ? 'owned' : (isNext ? '' : 'locked');
    return '<div class="rocket-part-row ' + cls + '"><span class="rocket-part-check"></span>' +
      '<span class="rocket-part-name">' + escapeHtmlLocal(part.name) + '</span>' +
      '<span class="rocket-part-cost">' + (owned ? 'Owned' : part.cost.toLocaleString() + 'c') + '</span></div>';
  }).join('');
  var launchBtn = document.createElement('button');
  launchBtn.type = 'button';
  launchBtn.className = 'rocket-action-btn';
  var ready = rocketReadyToLaunch();
  launchBtn.disabled = !ready;
  launchBtn.textContent = ready ? (rocketLaunchArmed ? 'Click again to confirm liftoff' : 'Launch!') : 'Buy every part to unlock Launch';
  launchBtn.classList.toggle('armed', rocketLaunchArmed);
  launchBtn.addEventListener('click', function () {
    if (!rocketLaunchArmed) {
      rocketLaunchArmed = true;
      updateRocketUI();
      clearTimeout(rocketLaunchArmTimer);
      rocketLaunchArmTimer = setTimeout(function () { rocketLaunchArmed = false; updateRocketUI(); }, 3000);
      return;
    }
    clearTimeout(rocketLaunchArmTimer);
    rocketLaunchArmed = false;
    launchRocket();
  });
  buildEl.appendChild(launchBtn);
  if (!ready) {
    var buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.className = 'rocket-action-btn';
    buyBtn.style.background = '#4a3874';
    buyBtn.textContent = 'Buy ' + ROCKET_PARTS[rocketPartsOwned].name + ' (' + ROCKET_PARTS[rocketPartsOwned].cost.toLocaleString() + 'c)';
    buyBtn.disabled = money < ROCKET_PARTS[rocketPartsOwned].cost;
    buyBtn.addEventListener('click', function () {
      var result = buyRocketPart();
      logConsole(result.message, !result.ok);
    });
    buildEl.appendChild(buyBtn);
  }
}

var resetBtn = document.getElementById('reset-btn');
var resetArmed = false;
var resetArmTimer = null;
resetBtn.addEventListener('click', function () {
  if (!resetArmed) {
    resetArmed = true;
    resetBtn.textContent = '⚠️ Click again to confirm';
    resetBtn.classList.add('armed');
    clearTimeout(resetArmTimer);
    resetArmTimer = setTimeout(function () {
      resetArmed = false;
      resetBtn.textContent = '🔁 Reset Game';
      resetBtn.classList.remove('armed');
    }, 3000);
  } else {
    clearTimeout(resetArmTimer);
    resetArmed = false;
    resetBtn.textContent = '🔁 Reset Game';
    resetBtn.classList.remove('armed');
    resetGame();
  }
});

// ============================================================
// HUD / SHOP RENDERING
// ============================================================
var moneyValueEl = document.getElementById('money-value');
var shopListEl = document.getElementById('shop-list');
var tileInfoEl = document.getElementById('tile-info');

var earnedValueEl = document.getElementById('earned-value');
var lastHudSignature = '';

function updateHUD() {
  hudDirty = false;
  var ft = activeFarmType();
  updateMysteryRow(); // not folded into the signature check below - the arm/confirm timer needs to repaint even when nothing else changed
  var signature = currentFarmType + '|' + money + '|' + totalEarned + '|' + sellFarmUnlocked() + '|' + activeItemNames().map(function (name) {
    return invCount(name) + ':' + (isUnlocked(name) ? 1 : 0);
  }).join(',');
  if (signature === lastHudSignature) return;
  lastHudSignature = signature;
  moneyValueEl.textContent = money.toLocaleString();
  earnedValueEl.textContent = totalEarned.toLocaleString();
  activeItemNames().forEach(function (name) {
    var row = shopListEl.querySelector('[data-veg="' + name + '"]');
    if (!row) return;
    var unlocked = isUnlocked(name);
    row.classList.toggle('locked', !unlocked);
    if (!unlocked) {
      row.querySelector('.locked-msg').textContent = '🔒 ' + unlockProgressMessage(name);
      row.querySelector('.buy-btn').disabled = true;
      return;
    }
    row.querySelector('.locked-msg').textContent = '';
    var price = currentSeedPrice(name);
    var item = ft.items[name];
    var priceEl = row.querySelector('.price');
    priceEl.textContent = price.toLocaleString() + ' coins · sells for ' + item.sellPrice.toLocaleString();
    row.querySelector('.buy-btn').disabled = money < price;
    row.querySelector('.have').textContent = 'You have ' + invCount(name) + ' ' + (invCount(name) === 1 ? ft.unitLabel : ft.unitLabelPlural) + '.';
  });
  updateSellFarmUI();
  updateRevertFarmUI();
}

// Rebuilds the shop's rows from scratch for whichever farm type is currently active -
// callable more than once (unlike the old crops-only version), since switching farm type
// needs a genuinely different set of rows, not just different values in the same ones.
function buildShop() {
  shopListEl.innerHTML = '';
  var ft = activeFarmType();
  var shopTitleEl = document.getElementById('shop-title');
  if (shopTitleEl) shopTitleEl.textContent = ft.shopTitle;
  var badgeEl = document.getElementById('farm-type-badge');
  if (badgeEl) {
    // Crops is the default everyone starts on - labelling it explicitly would just be noise
    // on every single load, so the badge only ever appears once you're on something else.
    badgeEl.classList.toggle('shown', currentFarmType !== 'crops');
    badgeEl.textContent = ft.title;
    badgeEl.style.background = ft.badgeColor;
  }
  // The two cheat-sheet notes that used to hardcode "vegetable"/"crop" wording, now generic
  // to whichever farm type is actually active - deliberately says nothing about any OTHER
  // farm type, so it can never spoil what's still undiscovered (see farmTypesDiscovered).
  var unlockNoteEl = document.getElementById('cheat-sheet-unlock-note');
  if (unlockNoteEl) {
    unlockNoteEl.innerHTML = 'New ' + ft.unlockNoun + ' unlock as your <b>total coins earned</b> (top right, not your current balance) goes up. Prices rise fast, so keep selling to afford the next one. Spending money doesn\'t undo that progress.';
  }
  var expansionNoteEl = document.getElementById('cheat-sheet-expansion-note');
  if (expansionNoteEl) {
    expansionNoteEl.innerHTML = 'Out of room? Hover over a dim tile at the edge of your garden and click it to <b>buy more land</b>. Each extra tile costs more than the last, and each pricier tier of ' + ft.growNoun + ' takes longer to ' + ft.growVerb + '.';
  }
  // Every code example in the cheat sheet uses the active farm type's own first two item
  // tiers (always unlocked, so the example is never one a brand new player can't try) instead
  // of a hardcoded "Carrot" - so a student on the Solar Farm sees CALL Buy("AA Battery"),
  // not a vegetable example that doesn't even exist in their shop right now.
  if (document.getElementById('cheat-ex-plant')) {
    var exItem1 = activeItemNames()[0];
    var exItem2 = activeItemNames()[1] || exItem1;
    var exBuyLabel1 = exItem1 + ft.nameSuffix;
    var exBuyLabel2 = exItem2 + ft.nameSuffix;
    document.getElementById('cheat-ex-plant').textContent = 'CALL ' + ft.plantVerb + '("' + exItem1 + '")';
    document.getElementById('cheat-ex-plant-desc').textContent =
      (ft.plantVerb === 'Plant' ? 'Plants a seed' : 'Places a ' + ft.unitLabel) + ' you own on the tile where your cursor is standing.';
    document.getElementById('cheat-ex-buy').textContent = 'CALL Buy("' + exBuyLabel1 + '")';
    document.getElementById('cheat-ex-buy-desc').textContent =
      'Buys one ' + ft.unitLabel + ', 20% cheaper than the shop button. The price never goes up from buying, so a machine can buy, ' + ft.plantVerb.toLowerCase() + ' and sell the same ' + ft.kindNounSingular + ' forever.';
    document.getElementById('cheat-ex-sell-desc').textContent =
      'Sells a fully grown ' + ft.placedNoun + ' where your cursor is standing, for 1.5x what the on-screen Sell button pays.';
    document.getElementById('cheat-ex-hascrop').textContent = 'HasCrop("' + exItem1 + '")';
    document.getElementById('cheat-ex-hascrop-desc').innerHTML =
      'TRUE if the square has that ' + ft.placedNoun + ' ' + ft.onTileVerb + '. Leave the name out to check whether anything is there. Also callable as <code>HasPlant(...)</code> - same thing, worded more generally.';
    document.getElementById('cheat-ex-cropontile-desc').innerHTML =
      'What\'s on the square your cursor is on ("' + escapeHtmlLocal(exItem1) + '"), or "None" if it\'s empty. E.g. IF CropOnTile() = "' + escapeHtmlLocal(exItem1) + '" THEN ... Also callable as <code>PlantOnTile()</code>.';
    document.getElementById('cheat-ex-seedcount').textContent = 'SeedCount("' + exItem1 + '")';
    document.getElementById('cheat-ex-seedcount-desc').innerHTML =
      'How many ' + ft.unitLabelPlural + ' of that kind you own. E.g. IF SeedCount("' + escapeHtmlLocal(exItem2) + '") = 0 THEN CALL Buy("' + escapeHtmlLocal(exBuyLabel2) + '"). Also callable as <code>ItemCount(...)</code>.';
  }
  activeItemNames().forEach(function (name) {
    var item = ft.items[name];
    var row = document.createElement('div');
    row.className = 'shop-item';
    row.setAttribute('data-veg', name);
    row.innerHTML =
      '<img src="' + twemojiUrl(item.emoji) + '" alt="' + name + '">' +
      '<div><div class="name">' + name + ft.nameSuffix + '</div><div class="price"></div></div>' +
      '<button type="button" class="buy-btn">Buy</button>' +
      '<div class="have"></div>' +
      '<div class="locked-msg"></div>';
    row.querySelector('.buy-btn').addEventListener('click', function () {
      var result = buySeed(name);
      logConsole(result.message, !result.ok);
      updateHUD();
    });
    shopListEl.appendChild(row);
  });
  shopListEl.appendChild(buildMysteryRow());
  lastHudSignature = ''; // force the next updateHUD() to repaint these freshly-built rows
}

// ============================================================
// MYSTERY SHOP ROW - see the CSS comment above .shop-item.mystery for why this exists.
// A fixed "?" row appears below the active farm type's final item once that item unlocks,
// well before sellFarmUnlocked() is actually true (see the FARM TYPES comment on how much
// lower that unlock threshold is than a genuine milestone sale). It never names "Sell the
// Farm" while locked - just a progress readout, same "Earn X more" spirit as a locked crop's
// own message - so a player who just bought the last vegetable sees proof there's more
// ahead, instead of assuming the shop (and the game) is finished. Once genuinely unlocked it
// reveals what it is and, on click, performs the actual liquidation - reusing the same
// two-click arm/confirm safety updateSellFarmUI() already uses for its own options, just
// aimed at the single "next" farm type in the fixed sequence (the common case for a player
// seeing this for the first time).
var mysteryArmed = false;
var mysteryArmTimer = null;
function buildMysteryRow() {
  var row = document.createElement('div');
  row.className = 'shop-item mystery';
  row.id = 'mystery-shop-row';
  row.innerHTML =
    '<div class="mystery-icon">?</div>' +
    '<div><div class="name">???</div><div class="price"></div></div>' +
    '<button type="button" class="buy-btn">Buy</button>' +
    '<div class="locked-msg"></div>';
  row.querySelector('.buy-btn').addEventListener('click', handleMysteryRowClick);
  return row;
}
function disarmMysteryRow() {
  clearTimeout(mysteryArmTimer);
  mysteryArmTimer = null;
  if (!mysteryArmed) return;
  mysteryArmed = false;
  updateMysteryRow();
}
function handleMysteryRowClick() {
  if (!sellFarmUnlocked()) return; // button is disabled while locked - defence in depth only
  var next = nextFarmTypeInSequence(currentFarmType);
  if (!next) return;
  if (!mysteryArmed) {
    mysteryArmed = true;
    updateMysteryRow();
    clearTimeout(mysteryArmTimer);
    mysteryArmTimer = setTimeout(disarmMysteryRow, 3000);
    return;
  }
  clearTimeout(mysteryArmTimer);
  mysteryArmed = false;
  sellTheFarm(next);
}
function updateMysteryRow() {
  var row = document.getElementById('mystery-shop-row');
  if (!row) return;
  var next = nextFarmTypeInSequence(currentFarmType);
  var itemNames = activeItemNames();
  var lastName = itemNames[itemNames.length - 1];
  var lastUnlocked = lastName && isUnlocked(lastName);
  // Also require some earnings ON THIS FARM - so straight after a prestige the row doesn't
  // pop back up at 0% on a farm the player hasn't actually started yet (it reappears after
  // their first sale here, which is the right "there's a path forward here too" moment).
  if (!next || !lastUnlocked || farmEarned <= 0) { row.style.display = 'none'; return; }
  row.style.display = '';
  var unlocked = sellFarmUnlocked();
  row.classList.toggle('revealed', unlocked);
  var nameEl = row.querySelector('.name');
  var btnEl = row.querySelector('.buy-btn');
  var msgEl = row.querySelector('.locked-msg');
  if (!unlocked) {
    nameEl.textContent = '???';
    btnEl.disabled = true;
    btnEl.textContent = 'Buy';
    var lastItem = activeItems()[lastName];
    var target = lastItem.unlockEarned * SELL_FARM_EARN_MULTIPLE;
    var pct = Math.max(1, Math.min(100, Math.floor((farmEarned / target) * 100)));
    msgEl.textContent = '🔒 ' + pct + '% revealed. Keep earning on this farm to unlock it.';
    return;
  }
  nameEl.textContent = mysteryArmed ? 'Click again to confirm' : 'Sell the Farm!';
  btnEl.disabled = false;
  btnEl.textContent = mysteryArmed ? 'Confirm' : 'Buy';
  msgEl.textContent = '🎉 Unlocked! This clears the farm and starts a brand-new kind of farm from scratch - 40 coins, tier 1, a whole new mechanic.';
}
buildShop();
var missionParam = new URLSearchParams(window.location.search).get('lessonMission');
var restored = missionParam && lessonMissionConfig(missionParam) ? false : loadGame(); // lesson missions never load free-play state
refreshUnlocks();
updateHUD();
updateRocketUI();
// Seed prices cool down over real time even with nobody clicking anything,
// and later tiers should visibly unlock the moment they're earned - both
// need the shop to refresh on its own, not only after a Buy/Sell click.
// This also requests an autosave once per second. The serialisation and
// synchronous localStorage write run during browser idle time, while
// pagehide still forces the latest state to disk before navigation.
var autosavePending = false;
function scheduleAutosave() {
  if (autosavePending) return;
  autosavePending = true;
  var write = function () {
    autosavePending = false;
    saveGame(false);
  };
  if (window.requestIdleCallback) window.requestIdleCallback(write, { timeout: 2000 });
  else setTimeout(write, 50);
}
setInterval(function () {
  refreshUnlocks(); updateHUD(); updateTileInfoPanel();
  // Not folded into updateHUD() - its flight progress moves purely from elapsed real time,
  // so it needs its own tick even on a second where nothing else (money, inventory) changed
  // and updateHUD() would otherwise short-circuit on an unchanged signature.
  updateRocketUI();
}, 1000);
setInterval(scheduleAutosave, 5000);
window.addEventListener('pagehide', function () { saveGame(true); });

// ============================================================
// CLOUD SAVE - opt-in, additive on top of the localStorage save above
// ============================================================
// This page is embedded as a GitHub Pages iframe inside the Apps Script shell, which has no
// way to run server code of its own and never handles student identity (same trust boundary
// the lesson-mission progress messages already use) - so instead of talking to a backend
// directly, it asks its PARENT window to do it: postMessage a request, the shell relays it to
// Progress.gs's farmerSync()/farmerLoad() using its own authenticated session, and posts the
// plain result back. Opened directly (not embedded, e.g. this file's own GitHub Pages URL, or
// a local dev server) this whole section is inert - window.parent === window, every function
// here becomes a no-op, and the game behaves exactly as it always has, local-save-only.
//
// The cloud save is treated as authoritative once it arrives: a signed-in student's cloud
// save (if any) replaces whatever localStorage/loadGame() already put on screen the moment
// the round trip resolves. Lesson missions and the tutorial sandbox both already have their
// own state and never touch the free-play save - a cloud response is simply ignored while
// either is active, the same guard saveGame() itself already uses.
var isEmbeddedInShell = window.parent !== window;
var lastCloudPushJson = '';
var lastCloudPushAt = 0;
var CLOUD_PUSH_MIN_INTERVAL_MS = 20000; // separate, slower cadence than the 5s local autosave - a Sheets write is a real network round trip, not a synchronous local write
var cloudSaveTooLargeWarned = false;

function requestCloudLoad() {
  if (!isEmbeddedInShell) return;
  try { window.parent.postMessage({ type: 'pseudocodeFarmerCloudLoadRequest' }, '*'); } catch (e) {}
}
function pushCloudSave(force) {
  if (!isEmbeddedInShell || lessonMissionMode || tutorialMode) return;
  var json = JSON.stringify(serializeGameState());
  if (!force && json === lastCloudPushJson) return; // nothing's changed since the last push
  if (!force && Date.now() - lastCloudPushAt < CLOUD_PUSH_MIN_INTERVAL_MS) return;
  lastCloudPushAt = Date.now();
  lastCloudPushJson = json;
  try { window.parent.postMessage({ type: 'pseudocodeFarmerCloudSaveRequest', saveJson: json }, '*'); } catch (e) {}
}
window.addEventListener('message', function (event) {
  // Only ever trust postMessages that genuinely came from the parent frame that embedded
  // this page - not any other origin, and not a sibling iframe (there is no reliable single
  // origin string to allowlist here, since the Apps Script shell's own URL varies by
  // deployment/domain; requiring the exact source window is simpler and just as sound).
  if (event.source !== window.parent) return;
  var data = event.data;
  if (!data) return;
  if (data.type === 'pseudocodeFarmerCloudLoadResult') {
    if (!data.ok || !data.signedIn || !data.saveJson) return;
    if (lessonMissionMode || tutorialMode) return; // neither ever touches the free-play save
    var s;
    try { s = JSON.parse(data.saveJson); } catch (e) { return; }
    if (!s || s.v !== SAVE_VERSION) return;
    clearWorldObjects();
    applyGameState(s);
    lastSavedJson = data.saveJson; // so the very next local autosave tick doesn't immediately re-write an unchanged save
    lastCloudPushJson = data.saveJson;
    refreshUnlocks();
    updateHUD();
    updateTileInfoPanel();
    logConsole('Loaded your saved farm from the cloud.');
    return;
  }
  if (data.type === 'pseudocodeFarmerCloudSaveResult') {
    if (!data.ok && !cloudSaveTooLargeWarned) {
      cloudSaveTooLargeWarned = true;
      console.warn('Pseudocode Farmer: cloud save failed - ' + (data.error || 'unknown error') + '. Your local save is unaffected.');
    }
    return;
  }
});
requestCloudLoad();
setInterval(function () { pushCloudSave(false); }, CLOUD_PUSH_MIN_INTERVAL_MS);
window.addEventListener('pagehide', function () { pushCloudSave(true); });

var lastTileInfoSignature = '';
function updateTileInfoPanel() {
  tileInfoDirty = false;
  if (editingMachineCodeId) return; // the inline editor owns the panel while it is open
  var selectedForSignature = selectedMachineId
    ? machines.filter(function (m) { return m.id === selectedMachineId; })[0]
    : null;
  var tileForSignature = tileAt(playerCursor.x, playerCursor.z);
  var plantForSignature = tileForSignature && tileForSignature.plant;
  // Before "ready", the growth percentage is enough to know when to repaint. Once ready, a
  // crop's value never changes again - but a battery's does, continuously (see FARM TYPES) -
  // so the panel needs its own live sell value in the signature too, or it would freeze on
  // whatever number happened to be showing the instant it first became ready.
  var plantPctForSignature = plantForSignature
    ? Math.min(100, Math.round(((Date.now() - plantForSignature.plantedAt) / plantForSignature.growMs) * 100))
    : -1;
  var plantValueForSignature = (plantForSignature && plantForSignature.ready) ? currentSellValue(plantForSignature) : -1;
  var signature = selectedForSignature
    ? ['machine', selectedForSignature.id, selectedForSignature.level, selectedForSignature.instructionsPerSecond,
        selectedForSignature.cursor.x, selectedForSignature.cursor.z, selectedForSignature.code, money].join('|')
    : ['tile', playerCursor.x, playerCursor.z, tileForSignature && tileForSignature.hasMachine ? 1 : 0,
        plantForSignature ? plantForSignature.type : '', plantForSignature && plantForSignature.ready ? 1 : 0,
        plantPctForSignature, plantValueForSignature, money].join('|');
  if (signature === lastTileInfoSignature) return;
  lastTileInfoSignature = signature;
  if (selectedMachineId) {
    var selected = machines.filter(function (m) { return m.id === selectedMachineId; })[0];
    if (selected) {
      var refund = Math.floor(selected.cost * MACHINE_SELL_REFUND);
      var upgradeHtml = '';
      var levelConfig = machineLevelConfig(selected);
      var idx = levelConfig.level - 1;
      if (idx < MACHINE_LEVELS.length - 1) {
        var nextLevel = MACHINE_LEVELS[idx + 1];
        upgradeHtml = '<button type="button" class="machine-action-btn" id="machine-upgrade-btn" style="background:#6ea8fe;color:#04214f">Upgrade to Level ' + nextLevel.level + ' (' + nextLevel.price + 'c)</button>';
      }
      tileInfoEl.className = 'show';
      tileInfoEl.innerHTML = '<b>Machine #' + selected.id + ' · Level ' + levelConfig.level + '</b> (pink cursor) &middot; ' +
        machineRateLabel(selected) + ' &middot; cursor at (' + selected.cursor.x + ', ' + selected.cursor.z + ')' +
        '<pre style="white-space:pre-wrap;margin:6px 0 0;font-size:.7rem;background:#12190f;color:#b9e6b0;padding:6px;border-radius:6px;max-height:80px;overflow:auto">' +
        (selected.code.trim() ? escapeHtmlLocal(selected.code) : '<span style="color:#6f8f68">(no code yet - press Edit code)</span>') + '</pre>' +
        '<div class="machine-actions">' +
          '<button type="button" class="machine-action-btn" id="machine-edit-btn" style="background:#6ea8fe;color:#04214f">Edit code</button>' +
          upgradeHtml +
          '<button type="button" class="machine-action-btn" id="machine-sell-btn" style="background:#d9534f;color:#fff">Sell for ' + refund + 'c</button>' +
        '</div>';
      tileInfoEl.querySelector('#machine-edit-btn').addEventListener('click', function () { startEditingMachine(selected); });
      var upBtn = tileInfoEl.querySelector('#machine-upgrade-btn');
      if (upBtn) upBtn.addEventListener('click', function () { upgradeMachine(selected); });
      tileInfoEl.querySelector('#machine-sell-btn').addEventListener('click', function () { sellMachine(selected); });
      return;
    }
  }
  var tile = tileAt(playerCursor.x, playerCursor.z);
  if (!tile) { tileInfoEl.className = ''; tileInfoEl.innerHTML = ''; return; }
  if (tile.plant && tile.plant.ready) {
    tileInfoEl.className = 'show';
    // currentSellValue() is flat for crops (unchanged) but genuinely live for a battery or
    // fish - its value keeps moving over time even after "ready", see the FARM TYPES comment.
    var liveValue = currentSellValue(tile.plant);
    var valueHint = '';
    var phase = sellValuePhase(tile.plant);
    if (phase === 'decaying') {
      valueHint = '<br><span style="font-size:.68rem;color:#a3271f;font-weight:700">This has been sitting too long and lost value - sell it now.</span>';
    } else if (phase === 'peak') {
      valueHint = '<br><span style="font-size:.68rem;color:#8a6416;font-weight:700">At its best value right now - sell before it starts losing value.</span>';
    } else if (phase === 'climbing' && BATTERIES[tile.plant.type]) {
      valueHint = '<br><span style="font-size:.68rem;color:#1f6e4f">Still climbing towards its best value - wait a little longer for more, or sell now.</span>';
    } else if (phase === 'climbing' && FISH[tile.plant.type]) {
      valueHint = '<br><span style="font-size:.68rem;color:#1f6e4f">Its value only ever grows the longer it stays here - no rush to sell.</span>';
    }
    tileInfoEl.innerHTML = 'A fully grown <b>' + tile.plant.type + '</b> is here!' +
      '<br><button type="button" class="sell-btn">Sell for ' + liveValue.toLocaleString() + ' coins</button>' +
      '<br><span style="font-size:.68rem;color:#7a6650">Tip: CALL Sell() pays ' + Math.round(liveValue * CODE_SELL_BONUS).toLocaleString() + ' coins.</span>' +
      valueHint;
    tileInfoEl.querySelector('.sell-btn').addEventListener('click', function () {
      var result = sellAt(playerCursor);
      logConsole(result.message, !result.ok);
    });
  } else if (tile.plant) {
    var pct = Math.min(100, Math.round(((Date.now() - tile.plant.plantedAt) / tile.plant.growMs) * 100));
    tileInfoEl.className = 'show';
    tileInfoEl.innerHTML = 'A <b>' + tile.plant.type + '</b> is growing here (' + pct + '%).';
  } else if (tile.hasMachine) {
    tileInfoEl.className = 'show';
    tileInfoEl.innerHTML = 'A machine is standing here.';
  } else {
    tileInfoEl.className = '';
    tileInfoEl.innerHTML = '';
  }
}

// ============================================================
// TUTORIAL SANDBOX - each tutorial gets its own fresh, disposable practice world
// ============================================================
// Fixes a real problem: tutorials used to run directly in the student's own free-play farm,
// so a tutorial's requirements (enough coins, a clear home tile, no seed already in
// inventory before an IF/ELSE step that assumes there isn't one) routinely clashed with
// whatever state an earlier tutorial - or ordinary free play - had left behind. Now every
// tutorial starts from a small, deterministic world sized exactly for what it needs
// (tut.minMoney as a real starting balance, not just a worst-case threshold to clear before
// starting; empty inventory; an untouched tile grid), so it is always completable regardless
// of what the student has been doing. The world is a genuine practice sandbox - see the
// AskUserQuestion decision this was built against: what's built during a tutorial (a placed
// machine, planted crops) stays in the sandbox and does not carry over when the student
// leaves it, exactly the way a lesson mission never touches the free-play save either. The
// student's real farm is snapshotted once (enterTutorialSandbox) and restored byte-for-byte
// (exitTutorialSandbox) - it is never visible or mutable while any tutorial is active.
function resetTutorialWorld(tut) {
  // Every tutorial is written in Cambridge Pseudocode against Carrots specifically - force
  // the crop farm regardless of which farm type the student's real save was on, the same way
  // everything else here is reset to a known-good baseline rather than inherited. Set before
  // rebuildGarden() below, so fresh tiles get the right colour.
  currentFarmType = 'crops';
  clearWorldObjects();
  rebuildGarden(initialTileList());
  money = typeof tut.minMoney === 'number' ? tut.minMoney : 40;
  totalEarned = 0;
  farmEarned = 0;
  buildShop();
  inventory = {};
  soldCount = {};
  unlockedState = {};
  selectedMachineId = null;
  editingMachineCodeId = null;
  // Player "home" - the origin SetPosition(x, z) counts from - is always the fixed (0, 0)
  // corner in free play (see the playerCursor comment near its declaration), so leaving
  // homeX/homeZ untouched here keeps every tutorial's SetPosition offsets meaning exactly
  // what their instructions say, same as they always have.
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
  gameStateDirty = false; // the sandbox never persists - see saveGame()'s tutorialMode guard
  lastHudSignature = '';
  lastTileInfoSignature = '';
  refreshUnlocks();
  updateHUD();
  updateTileInfoPanel();
}
// Enters tutorial mode if not already in it (snapshotting the real farm exactly once - a
// student can move straight from one tutorial to another via "Browse Tutorials" without ever
// returning to free play in between, and that must never re-snapshot an already-sandboxed
// world over the real one), then builds tut's fresh world.
function enterTutorialSandbox(tut) {
  if (!tutorialMode) {
    saveGame(true); // make sure the real save on disk is current before we leave it behind
    tutorialSavedRealState = serializeGameState();
    tutorialMode = true;
  }
  resetTutorialWorld(tut);
}
// Restores the student's real farm exactly as it was before any tutorial this session
// touched it. Safe to call even if a snapshot was somehow never taken (defensive - should
// never happen given enterTutorialSandbox always takes one first).
function exitTutorialSandbox() {
  if (!tutorialMode) return;
  var saved = tutorialSavedRealState;
  tutorialMode = false;
  tutorialSavedRealState = null;
  clearWorldObjects();
  if (saved) applyGameState(saved);
  else rebuildGarden(initialTileList());
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
}

function renderTutorialPicker() {
  var list = document.getElementById('tutorial-picker-list');
  if (!list) return;
  list.innerHTML = TUTORIALS.map(function (tut, i) {
    var prog = tutState[tut.id];
    var status = '';
    if (prog && prog.completed) status = '<span class="tut-card-status">Done</span>';
    else if (prog && prog.stepIdx > 0) status = '<span class="tut-card-status tut-inprogress">Step ' + (prog.stepIdx + 1) + '/' + tut.steps.length + '</span>';
    return '<button type="button" class="tut-card" data-tut="' + i + '">' +
      '<span class="tut-card-badge" style="background:' + tut.color + '">' + escapeHtmlLocal(tut.title.charAt(0)) + '</span>' +
      '<span class="tut-card-body"><span class="tut-card-title">' + escapeHtmlLocal(tut.title) + '</span>' +
      '<span class="tut-card-desc">' + escapeHtmlLocal(tut.desc) + '</span></span>' + status + '</button>';
  }).join('');
  list.querySelectorAll('.tut-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var tutIdx = parseInt(card.dataset.tut, 10);
      startTutorial(tutIdx);
      closeTutorialModal();
    });
  });
  var doneCount = TUTORIALS.filter(function (t) { return tutState[t.id] && tutState[t.id].completed; }).length;
  var summary = document.getElementById('tutorial-picker-summary');
  if (summary) summary.textContent = TUTORIALS.length + ' tutorial' + (TUTORIALS.length === 1 ? '' : 's') + ' · ' + doneCount + ' completed';
}

// Modal (same "browse all tutorials" pattern as PyScratch's own tutorial pick modal in
// assets/js/pyscratch.js) rather than a permanently-expanded sidebar list.
function openTutorialModal() {
  renderTutorialPicker();
  document.getElementById('tutorial-modal-overlay').classList.add('open');
}
function closeTutorialModal() {
  document.getElementById('tutorial-modal-overlay').classList.remove('open');
}

// Pop-out code window - a 1:1 live copy of the current tutorial step's reference code
// (same diff colouring: grey/old, amber/new, green/typed) that floats free of the sidebar
// and can be dragged anywhere, the same idea as PyScratch's own draggable code window. It
// never has its own state - openTutorialCodeModal() and every place that already updates
// #tutorial-bar-code's content (renderTutorialStep, renderTutorialChecklist) also mirror
// that same innerHTML in here, so the two are never out of sync.
function syncTutorialCodeModal() {
  var modal = document.getElementById('tutorial-code-modal');
  if (!modal.classList.contains('open')) return;
  document.getElementById('tutorial-code-modal-body').innerHTML = document.getElementById('tutorial-bar-code').innerHTML;
}
function openTutorialCodeModal() {
  var step = currentTutorialStep();
  var tut = activeTutorial ? TUTORIALS[activeTutorial.tutIdx] : null;
  document.getElementById('tutorial-code-modal-title').textContent = (tut ? tut.title + ' - ' : '') + (step ? step.title : 'Code');
  document.getElementById('tutorial-code-modal').classList.add('open'); // before sync - sync no-ops while not open
  syncTutorialCodeModal();
}
function closeTutorialCodeModal() {
  document.getElementById('tutorial-code-modal').classList.remove('open');
}
document.getElementById('tutorial-code-expand').addEventListener('click', openTutorialCodeModal);
document.getElementById('tutorial-code-modal-close').addEventListener('click', closeTutorialCodeModal);

// Dragging: same pointerdown/pointermove/pointerup + pointer-capture pattern already used
// elsewhere in this file for camera panning. Once dragged even once, position switches from
// the initial centred transform to an explicit left/top so it stays exactly where dropped.
(function setupTutorialCodeModalDrag() {
  var modal = document.getElementById('tutorial-code-modal');
  var head = document.getElementById('tutorial-code-modal-head');
  var dragState = null;
  head.addEventListener('pointerdown', function (e) {
    if (e.target.closest('#tutorial-code-modal-close')) return;
    var rect = modal.getBoundingClientRect();
    dragState = { id: e.pointerId, startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    modal.style.transform = 'none';
    head.setPointerCapture && head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener('pointermove', function (e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    var nextLeft = dragState.left + (e.clientX - dragState.startX);
    var nextTop = dragState.top + (e.clientY - dragState.startY);
    // Keep at least a corner of the header on-screen so it can never be dragged somewhere unreachable.
    nextLeft = Math.max(-modal.offsetWidth + 60, Math.min(window.innerWidth - 60, nextLeft));
    nextTop = Math.max(0, Math.min(window.innerHeight - 40, nextTop));
    modal.style.left = nextLeft + 'px';
    modal.style.top = nextTop + 'px';
  });
  function endDrag(e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    dragState = null;
  }
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);
})();

// ── Pop-out Code Box ─────────────────────────────────────────────────
// Unlike the tutorial reference code's pop-out above (a read-only 1:1 COPY,
// re-synced on every change), this one relocates the REAL .code-editor node
// - the live #code-backdrop/#code-input pair - into the floating window and
// back again, never a clone. Every existing bit of wiring (typing, scroll
// sync, error-line highlighting, and the Run/Place Machine buttons, which
// only ever read codeInput.value) already works on that exact element
// regardless of which parent currently contains it, so none of it needs to
// know or care that the box moved. codeEditorHomeParent/NextSibling
// remembers exactly where it came from so closing puts it back in the same
// spot, not just "somewhere in #code-panel".
var codeModal = document.getElementById('code-modal');
var codeModalBody = document.getElementById('code-modal-body');
var codeEditorHomeParent = codeEditorEl.parentNode;
var codeEditorHomeNextSibling = codeEditorEl.nextSibling;
function openCodeModal() {
  codeModalBody.appendChild(codeEditorEl);
  codeModal.classList.add('open');
  codeInput.focus();
}
function closeCodeModal() {
  if (codeEditorHomeNextSibling && codeEditorHomeNextSibling.parentNode === codeEditorHomeParent) {
    codeEditorHomeParent.insertBefore(codeEditorEl, codeEditorHomeNextSibling);
  } else {
    codeEditorHomeParent.appendChild(codeEditorEl);
  }
  codeModal.classList.remove('open');
}
document.getElementById('code-expand').addEventListener('click', function () {
  if (codeModal.classList.contains('open')) closeCodeModal(); else openCodeModal();
});
document.getElementById('code-modal-close').addEventListener('click', closeCodeModal);
(function setupCodeModalDrag() {
  var modal = codeModal;
  var head = document.getElementById('code-modal-head');
  var dragState = null;
  head.addEventListener('pointerdown', function (e) {
    if (e.target.closest('#code-modal-close')) return;
    var rect = modal.getBoundingClientRect();
    dragState = { id: e.pointerId, startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    modal.style.transform = 'none';
    head.setPointerCapture && head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener('pointermove', function (e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    var nextLeft = dragState.left + (e.clientX - dragState.startX);
    var nextTop = dragState.top + (e.clientY - dragState.startY);
    nextLeft = Math.max(-modal.offsetWidth + 60, Math.min(window.innerWidth - 60, nextLeft));
    nextTop = Math.max(0, Math.min(window.innerHeight - 40, nextTop));
    modal.style.left = nextLeft + 'px';
    modal.style.top = nextTop + 'px';
  });
  function endDrag(e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    dragState = null;
  }
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);
})();

document.getElementById('tutorial-picker-open').addEventListener('click', openTutorialModal);
document.getElementById('tutorial-modal-close').addEventListener('click', closeTutorialModal);
document.getElementById('tutorial-modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeTutorialModal(); // click on the dark backdrop, not the card itself
});
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('tutorial-modal-overlay').classList.contains('open')) closeTutorialModal();
});

function startTutorial(tutIdx) {
  var tut = TUTORIALS[tutIdx];
  if (!tut) return;
  var saved = tutState[tut.id];
  var stepIdx = (saved && !saved.completed) ? Math.min(saved.stepIdx, tut.steps.length - 1) : 0;
  activeTutorial = { tutIdx: tutIdx, stepIdx: stepIdx };
  enterTutorialSandbox(tut); // swaps in this tutorial's own fresh, guaranteed-workable world
  document.body.classList.add('tutorial-active'); // disables the shop Buy / ground Sell shortcuts
  var panel = document.getElementById('tutorial-bar-panel');
  panel.classList.add('active');
  panel.classList.add('just-started');
  setTimeout(function () { panel.classList.remove('just-started'); }, 1700);
  setTutorialCollapsed(false);
  renderTutorialStep();
}
function exitTutorial() {
  activeTutorial = null;
  exitTutorialSandbox(); // hands the student's real farm back exactly as they left it
  document.body.classList.remove('tutorial-active');
  document.getElementById('tutorial-bar-panel').classList.remove('active');
  closeTutorialCodeModal(); // no current step left for it to be a copy of
  clearTutorialHighlights(); // no current step left for a highlight ring to belong to either
  renderTutorialPicker();
}
function setTutorialCollapsed(collapsed) {
  var panel = document.getElementById('tutorial-bar-panel');
  var toggle = document.getElementById('tutorial-bar-toggle');
  panel.classList.toggle('collapsed', collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
}

// --- Live per-character diff for a tutorial's "new" reference lines, ported from
// Pseudocode Blitz's Support Mode hint system (its hintLineCharStatuses/stringLiteralMask).
// Replaces the old all-or-nothing check (a line stayed flat amber until an exact copy of
// its full text appeared anywhere in codeInput.value, and could never show a mistake) with
// a per-character comparison against the student's line at the same position: matched
// characters turn green as they're typed, a genuine wrong character turns red, anything
// not reached yet stays amber.
function tutorialStringLiteralMask(text) {
  var mask = new Array(text.length).fill(false);
  var inString = false;
  for (var i = 0; i < text.length; i++) {
    if (text[i] === '"') { inString = !inString; mask[i] = true; }
    else mask[i] = inString;
  }
  return mask;
}
function tutorialLineCharStatuses(targetLine, studentLine) {
  var caseSensitive = tutorialStringLiteralMask(targetLine);
  var student = String(studentLine || '');
  return targetLine.split('').map(function (ch, i) {
    if (i >= student.length) return 'pending';
    var typed = student[i];
    var match = caseSensitive[i] ? typed === ch : typed.toUpperCase() === ch.toUpperCase();
    return match ? 'match' : 'mismatch';
  });
}
function tutorialNewLineHtml(targetLine, studentLine) {
  var statuses = tutorialLineCharStatuses(targetLine, studentLine);
  return targetLine.split('').map(function (ch, i) {
    var cls = statuses[i] === 'match' ? 'tc-match' : statuses[i] === 'mismatch' ? 'tc-mismatch' : 'tc-pending';
    return '<span class="' + cls + '">' + escapeHtmlLocal(ch) + '</span>';
  }).join('');
}
// Builds the full reference-code block for the current step. Student lines are matched to
// target lines by position among non-blank lines only (mirroring compile(), which skips
// blank lines outright) - so a stray blank line the student adds doesn't throw every later
// line's diff out of alignment.
function tutorialCodeHtml(step) {
  if (!step.target) return '';
  var newSet = {};
  (step.newLines || []).forEach(function (l) { newSet[l] = true; });
  var studentLines = codeInput.value.split('\n').filter(function (l) { return l.trim() !== ''; });
  var studentIdx = 0;
  return step.target.split('\n').map(function (line) {
    var isNew = !!newSet[line];
    var html = isNew ? tutorialNewLineHtml(line, studentLines[studentIdx]) : escapeHtmlLocal(line);
    if (line.trim() !== '') studentIdx++;
    return '<span class="tb-line ' + (isNew ? 'new' : 'old') + '" data-line="' + escapeHtmlLocal(line) + '">' + html + '</span>';
  }).join('');
}

function renderTutorialStep() {
  if (!activeTutorial) return;
  var tut = TUTORIALS[activeTutorial.tutIdx];
  var step = tut.steps[activeTutorial.stepIdx];
  document.getElementById('tutorial-bar-name').textContent = tut.title;
  document.getElementById('tutorial-bar-stepcount').textContent = 'Step ' + (activeTutorial.stepIdx + 1) + '/' + tut.steps.length;
  if (step.action === 'machine') tutorialMachineBaseline = machines.length;
  document.getElementById('tutorial-bar-attempt-warning').hidden = true;
  document.getElementById('tutorial-bar-title').textContent = step.title;
  document.getElementById('tutorial-bar-text').innerHTML = step.text;
  document.getElementById('tutorial-bar-dots').innerHTML = tut.steps.map(function (s, i) {
    var cls = i < activeTutorial.stepIdx ? 'tb-done' : (i === activeTutorial.stepIdx ? 'tb-cur' : '');
    return '<span class="tb-dot ' + cls + '"></span>';
  }).join('');
  document.getElementById('tutorial-bar-code-wrap').classList.toggle('tb-no-target', !step.target);
  document.getElementById('tutorial-bar-code').innerHTML = tutorialCodeHtml(step);
  document.getElementById('tutorial-bar-action-hint').textContent = step.actionHint || '';
  document.getElementById('tutorial-bar-back').disabled = activeTutorial.stepIdx === 0;
  refreshTutorialHighlight();
  renderTutorialChecklist();
}

function renderTutorialChecklist() {
  var step = currentTutorialStep();
  if (!step) return false;
  var program = tutorialCompileQuiet(codeInput.value);
  var reqsOk = tutorialRequiresMet(program, step.requires || []);
  lastTutorialReqsOk = reqsOk;
  document.getElementById('tutorial-bar-checks').innerHTML = (step.requires || []).map(function (req) {
    var ok = !!(program && tutorialRequirementMet(program, req));
    return '<div class="tb-check ' + (ok ? 'tb-ok' : '') + '"><span class="tb-check-icon"></span><span>' + tutorialRequirementLabel(req) + '</span></div>';
  }).join('');
  document.getElementById('tutorial-bar-code').innerHTML = tutorialCodeHtml(step);
  // The reference panel is only a guide. Keep the action prompt honest about the
  // student's real Code Box, which may still be empty when a step first appears.
  if (step.action === 'run' && !reqsOk) {
    document.getElementById('tutorial-bar-action-hint').textContent = 'Type all three lines into the Code Box, then press Run.';
  } else if (step.action === 'run') {
    document.getElementById('tutorial-bar-action-hint').textContent = 'All three lines are in your Code Box - press Run to try the sequence.';
  } else if (step.actionHint) {
    document.getElementById('tutorial-bar-action-hint').textContent = step.actionHint;
  }
  updateTutorialNextButton(reqsOk);
  syncTutorialCodeModal(); // covers both a step change (renderTutorialStep calls this at the
                           // end) and every keystroke (codeInput's own input listener calls
                           // this directly) - the pop-out never needs its own separate sync calls.
  return reqsOk;
}

function updateTutorialNextButton(reqsOk) {
  var step = currentTutorialStep();
  var nextBtn = document.getElementById('tutorial-bar-next');
  if (!step || !nextBtn) return;
  if (!step.action) {
    nextBtn.disabled = !reqsOk;
    nextBtn.textContent = (activeTutorial.stepIdx === TUTORIALS[activeTutorial.tutIdx].steps.length - 1) ? 'Finish ✓' : 'Next ▶';
  } else {
    // Action-gated steps only ever advance via the real run-btn/machine-btn listeners
    // below - the Next button itself stays disabled the whole step, so there's exactly
    // one way through: actually doing the real game action with the right code typed.
    nextBtn.disabled = true;
    nextBtn.textContent = 'Waiting for you to ' + (step.action === 'run' ? 'press ▶ Run' : 'place the machine') + '...';
  }
}

function goToTutorialStep(delta) {
  if (!activeTutorial) return;
  var tut = TUTORIALS[activeTutorial.tutIdx];
  var next = activeTutorial.stepIdx + delta;
  if (next < 0 || next >= tut.steps.length) return;
  activeTutorial.stepIdx = next;
  tutState[tut.id] = { stepIdx: next, completed: false };
  saveTutorialProgress();
  renderTutorialStep();
}
function advanceOrComplete() {
  var tut = TUTORIALS[activeTutorial.tutIdx];
  if (activeTutorial.stepIdx === tut.steps.length - 1) completeTutorial();
  else goToTutorialStep(1);
}
function completeTutorial() {
  var tut = TUTORIALS[activeTutorial.tutIdx];
  tutState[tut.id] = { stepIdx: tut.steps.length - 1, completed: true };
  saveTutorialProgress();
  document.getElementById('tutorial-bar-dots').innerHTML = tut.steps.map(function () { return '<span class="tb-dot tb-done"></span>'; }).join('');
  document.getElementById('tutorial-bar-title').textContent = 'Tutorial complete';
  document.getElementById('tutorial-bar-text').innerHTML = 'Nice work - that was a practice run in its own sandbox, so it never touched your real farm. Exit the tutorial to get back to it, or pick another tutorial from the list below.';
  document.getElementById('tutorial-bar-code').innerHTML = '';
  document.getElementById('tutorial-bar-checks').innerHTML = '';
  document.getElementById('tutorial-bar-action-hint').textContent = '';
  document.getElementById('tutorial-bar-back').disabled = true;
  var nextBtn = document.getElementById('tutorial-bar-next');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Finished ✓';
  closeTutorialCodeModal(); // no current step left for it to be a copy of
}

document.getElementById('tutorial-bar-next').addEventListener('click', function () {
  var step = currentTutorialStep();
  if (!step || step.action) return; // action-gated steps advance only via the real action below
  advanceOrComplete();
});
document.getElementById('tutorial-bar-back').addEventListener('click', function () { goToTutorialStep(-1); });
document.getElementById('tutorial-bar-exit').addEventListener('click', exitTutorial);
document.getElementById('tutorial-bar-toggle').addEventListener('click', function () {
  setTutorialCollapsed(!document.getElementById('tutorial-bar-panel').classList.contains('collapsed'));
});
codeInput.addEventListener('input', function () { if (activeTutorial) renderTutorialChecklist(); });

function showTutorialAttemptWarning(message) {
  var el = document.getElementById('tutorial-bar-attempt-warning');
  el.textContent = message;
  el.hidden = false;
}
function clearTutorialAttemptWarning() {
  document.getElementById('tutorial-bar-attempt-warning').hidden = true;
}

// Piggyback on the real Run button exactly the way the lesson-mission watcher already
// does above - a separate, later-registered listener, never touching runBtn's own
// click handler. Waits for isRunning to actually flip back to false (the real async
// run finishing) before checking the outcome.
runBtn.addEventListener('click', function () {
  if (!activeTutorial) return;
  var step = currentTutorialStep();
  if (!step || step.action !== 'run') return;
  if (!lastTutorialReqsOk) return;
  var waitForRun = setInterval(function () {
    if (isRunning) return;
    clearInterval(waitForRun);
    // The real Run handler only clears codeInput.value on its .then() success path - a
    // genuine PseudocodeError (its .catch() path) leaves the code in the box untouched.
    // Checking this catches real execution errors; it can't see a run that completed
    // without error but didn't achieve much (e.g. not enough money to buy anything) -
    // same limit every other step in this engine already accepts.
    if (codeInput.value.trim() !== '') {
      showTutorialAttemptWarning('That run hit an error - check the message below the Code Box, fix it, and press Run again.');
      return;
    }
    clearTutorialAttemptWarning();
    advanceOrComplete();
  }, 100);
});
// placeMachine() (called by the real machineBtn handler above) is synchronous, so by the
// time this later-registered listener runs, placement has already succeeded or failed.
// Comparing against tutorialMachineBaseline (captured when this step first rendered, not
// a fixed 0) is what makes this correct once earlier tutorials have already left their
// own machines on the field - machines.length being non-zero on its own proves nothing.
machineBtn.addEventListener('click', function () {
  if (!activeTutorial) return;
  var step = currentTutorialStep();
  if (!step || step.action !== 'machine') return;
  if (!lastTutorialReqsOk) return;
  if (machines.length <= tutorialMachineBaseline) {
    showTutorialAttemptWarning('That didn\'t place a machine - check the message below the Code Box (not enough coins? tile already occupied?), sort it out, and try again.');
    return;
  }
  clearTutorialAttemptWarning();
  advanceOrComplete();
});

if (!missionParam) renderTutorialPicker(); // hidden anyway in mission mode, but skip the work too

// Deep-link a specific tutorial from a lesson, the same way ?lessonMission= deep-links a
// mission - e.g. a Year 9 Sequence lesson links straight to ?tutorial=basic-auto-farm rather
// than sending the student to the picker to find it themselves. loadGame() (the student's
// normal free-play save) still runs first, same as ever - startTutorial() below snapshots
// whatever that restored and swaps in the tutorial's own fresh sandbox on top of it, so a
// deep-linked tutorial is always startable regardless of that save's state.
var tutorialParam = new URLSearchParams(window.location.search).get('tutorial');
if (tutorialParam && !missionParam) {
  var tutorialParamIdx = TUTORIALS.findIndex(function (t) { return t.id === tutorialParam; });
  if (tutorialParamIdx !== -1) startTutorial(tutorialParamIdx);
}

// ============================================================
// ANIMATION LOOP
// ============================================================
function resize() {
  var rect = canvas.parentElement.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / Math.max(1, rect.height);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
// App pages are created while hidden by the parent site. ResizeObserver
// catches the moment this iframe becomes visible; a window resize event does
// not reliably fire for that display:none -> visible transition.
if (window.ResizeObserver) {
  new ResizeObserver(function () { resize(); }).observe(canvas.parentElement);
}
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) requestAnimationFrame(resize);
});
resize();

var clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  var elapsed = clock.getElapsedTime();
  var perfNow = performance.now(); // transient animations (floating text)
  var wallNow = Date.now();        // persisted timing (plant growth)

  // WASD / arrow camera pan and Q/E/R/F rotation, scaled by delta time so
  // speed is framerate-independent and by zoom so pan feels the same close
  // up and far away.
  var dt = lastFrameMs ? Math.min(0.05, (perfNow - lastFrameMs) / 1000) : 0;
  lastFrameMs = perfNow;
  if (dt > 0) {
    var hv = cameraHorizontalVectors();
    var panX = 0, panZ = 0;
    if (heldKeys['w'] || heldKeys['ArrowUp']) panZ += 1;
    if (heldKeys['s'] || heldKeys['ArrowDown']) panZ -= 1;
    if (heldKeys['a'] || heldKeys['ArrowLeft']) panX -= 1;
    if (heldKeys['d'] || heldKeys['ArrowRight']) panX += 1;
    var rotX = 0, rotY = 0;
    if (heldKeys['q']) rotX += 1;
    if (heldKeys['e']) rotX -= 1;
    if (heldKeys['r']) rotY += 1;
    if (heldKeys['f']) rotY -= 1;
    var camChanged = false;
    if (panX !== 0 || panZ !== 0) {
      camState.target.addScaledVector(hv.right, panX * camState.radius * 1.5 * dt);
      camState.target.addScaledVector(hv.forward, panZ * camState.radius * 1.5 * dt);
      camChanged = true;
    }
    if (rotX !== 0) { camState.theta += rotX * 1.6 * dt; camChanged = true; }
    if (rotY !== 0) { camState.phi = Math.min(1.45, Math.max(0.35, camState.phi + rotY * 0.9 * dt)); camChanged = true; }
    if (camChanged) applyCameraState();
  }

  // Bob the player's arrow and every machine cursor gently so the scene
  // never looks totally static, even between actions.
  cursorGroup.position.y = 0.75 + Math.sin(elapsed * 3) * 0.06;
  cursorGroup.rotation.y = elapsed * 1.2;
  machines.forEach(function (m) {
    m.cursorMesh.position.y = 1.0 + Math.sin(elapsed * 3 + m.id) * 0.06;
    m.cursorMesh.rotation.y = elapsed * 1.6;
  });

  updateMachineScheduler(perfNow);
  flushMachineConsole(perfNow, false);
  if (hudDirty) { hudDirty = false; updateHUD(); }
  if (tileInfoDirty) { tileInfoDirty = false; updateTileInfoPanel(); }

  // Grow every planted sprite towards full size, and flag it ready once done.
  var anyGrowthChanged = false;
  for (var plantIndex = 0; plantIndex < plantedTiles.length; plantIndex++) {
    var tile = plantedTiles[plantIndex];
    var gx = tile.x, gz = tile.z;
    var plant = tile.plant;
    if (!plant) continue;
    var t = Math.min(1, (wallNow - plant.plantedAt) / plant.growMs);
    var eased = 1 - Math.pow(1 - t, 2);
    var scale = 0.12 + eased * 0.78;
    plant.sprite.scale.set(scale, scale, scale);
    plant.sprite.position.y = 0.02 + scale * 0.05;
    if (plant.pct && plant.pct.sprite) {
      plant.pct.sprite.position.y = plant.sprite.position.y + scale + 0.14;
      // Crops freeze at 100% once grown (unchanged) - a battery or fish's value keeps
      // moving after that, so its pill switches to showing that live value as a percentage
      // of its base price instead: >100 while climbing (or growing for a fish, which never
      // stops), a red-tinted <100 once a battery has decayed past its base price.
      var showPct, showWarn;
      if (t >= 1 && (BATTERIES[plant.type] || FISH[plant.type])) {
        var timedItem = lookupItem(plant.type);
        showPct = timedItem ? Math.round((currentSellValue(plant) / timedItem.sellPrice) * 100) : 100;
        showWarn = showPct < 100;
      } else {
        showPct = Math.round(t * 100);
        showWarn = false;
      }
      if (showPct !== plant.pct.lastPct || showWarn !== plant.pct.lastWarn) {
        drawPctLabel(plant.pct, showPct, showWarn);
        plant.pct.lastPct = showPct;
        plant.pct.lastWarn = showWarn;
      }
    }
    if (t >= 1 && !plant.ready) {
      plant.ready = true;
      anyGrowthChanged = true;
      if (gx === playerCursor.x && gz === playerCursor.z) updateTileInfoPanel();
    }
  }
  if (anyGrowthChanged) { /* nothing extra needed - tile info refreshes itself when relevant */ }

  updateFloatingTexts(perfNow);
  updateTutorialHighlightPulse(elapsed);
  renderer.render(scene, camera);
}
animate();

// Keep the tile info panel's growth percentage fresh even when nothing
// else changed, without re-rendering the whole panel every animation frame.
setInterval(updateTileInfoPanel, 500);

logConsole(restored ? 'Welcome back! Your farm was restored.' : 'Welcome to Pseudocode Farmer! Write pseudocode to buy, plant and sell - code beats the buttons (CALL Buy() is cheaper, CALL Sell() pays more).');
if (missionParam && lessonMissionConfig(missionParam)) startLessonMission(missionParam);
