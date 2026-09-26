'use strict';
// Resizing, the animation loop and starting the game.
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
