'use strict';
// Clicking tiles, plant textures, planting, growing and selling, the CALL and function commands, floating text.
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

