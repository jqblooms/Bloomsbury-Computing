'use strict';
// The HUD and the shop, including the mystery row.
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
      row.querySelector('.locked-msg').textContent = unlockProgressMessage(name);
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
    msgEl.textContent = pct + '% revealed. Keep earning on this farm to unlock it.';
    return;
  }
  nameEl.textContent = mysteryArmed ? 'Click again to confirm' : 'Sell the Farm!';
  btnEl.disabled = false;
  btnEl.textContent = mysteryArmed ? 'Confirm' : 'Buy';
  msgEl.textContent = 'Unlocked! This clears the farm and starts a brand-new kind of farm from scratch - 40 coins, tier 1, a whole new mechanic.';
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

