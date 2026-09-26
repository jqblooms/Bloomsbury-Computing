'use strict';
// Saving the farm to the student's account through the site.
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
        upgradeHtml = '<button type="button" class="machine-action-btn is-primary" id="machine-upgrade-btn">Upgrade to Level ' + nextLevel.level + ' (' + nextLevel.price + 'c)</button>';
      }
      tileInfoEl.className = 'show';
      tileInfoEl.innerHTML = '<b>Machine #' + selected.id + ' · Level ' + levelConfig.level + '</b> (pink cursor) &middot; ' +
        machineRateLabel(selected) + ' &middot; cursor at (' + selected.cursor.x + ', ' + selected.cursor.z + ')' +
        '<pre class="machine-code-preview">' +
        (selected.code.trim() ? escapeHtmlLocal(selected.code) : '<span class="empty">(no code yet - press Edit code)</span>') + '</pre>' +
        '<div class="machine-actions">' +
          '<button type="button" class="machine-action-btn is-primary" id="machine-edit-btn">Edit code</button>' +
          upgradeHtml +
          '<button type="button" class="machine-action-btn is-danger" id="machine-sell-btn">Sell for ' + refund + 'c</button>' +
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
      valueHint = '<br><span class="value-hint bad">This has been sitting too long and lost value - sell it now.</span>';
    } else if (phase === 'peak') {
      valueHint = '<br><span class="value-hint warn">At its best value right now - sell before it starts losing value.</span>';
    } else if (phase === 'climbing' && BATTERIES[tile.plant.type]) {
      valueHint = '<br><span class="value-hint good">Still climbing towards its best value - wait a little longer for more, or sell now.</span>';
    } else if (phase === 'climbing' && FISH[tile.plant.type]) {
      valueHint = '<br><span class="value-hint good">Its value only ever grows the longer it stays here - no rush to sell.</span>';
    }
    tileInfoEl.innerHTML = 'A fully grown <b>' + tile.plant.type + '</b> is here!' +
      '<br><button type="button" class="sell-btn">Sell for ' + liveValue.toLocaleString() + ' coins</button>' +
      '<br><span class="value-hint muted">Tip: CALL Sell() pays ' + Math.round(liveValue * CODE_SELL_BONUS).toLocaleString() + ' coins.</span>' +
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

