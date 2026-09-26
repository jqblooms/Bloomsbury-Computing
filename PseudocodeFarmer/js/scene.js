'use strict';
// The 3D scene: renderer, lights, ground tiles, buying tiles, the cursor, the camera controls.
// ============================================================
// THREE.JS SCENE SETUP
// ============================================================
var canvas = document.getElementById('three-canvas');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
// The site background, so the lit farm sits on the dark page.
scene.background = new THREE.Color(0x0f1115);
scene.fog = new THREE.Fog(0x0f1115, 14, 30);

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
  new THREE.MeshStandardMaterial({ color: 0x2e2620, roughness: 1 })
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
    canvasHintEl.textContent = 'Click to buy this tile (' + nextTileCost() + ' coins)';
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

