'use strict';
// The rocket yard: parts, launch and the flight.
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
    arrivedEl.innerHTML = '<span class="arrived-anim"><svg class="rocket-svg" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M12 2c3 2.5 4.5 6 4.5 10.5L14.5 16h-5l-2-3.5C7.5 8 9 4.5 12 2z" fill="#e8eaed"/><circle cx="12" cy="9" r="2" fill="#8ab4f8"/><path d="M9.5 16 7 19l-.5-4.5L8.5 12zM14.5 16l2.5 3 .5-4.5-2-2.5z" fill="#f28b82"/><path d="M10.5 17h3l-1.5 4z" fill="#fdd663"/></svg></span>' +
      '<div class="arrived-title">You reached space!</div>' +
      '<div class="rocket-note">Every part built, every hour of the flight real - your rocket made it.</div>' +
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
      '<div class="rocket-flight-track"><span class="stars"></span><span class="rocket-icon" style="bottom:' + (4 + pct * 1.1) + 'px"><svg class="rocket-svg" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path d="M12 2c3 2.5 4.5 6 4.5 10.5L14.5 16h-5l-2-3.5C7.5 8 9 4.5 12 2z" fill="#e8eaed"/><circle cx="12" cy="9" r="2" fill="#8ab4f8"/><path d="M9.5 16 7 19l-.5-4.5L8.5 12zM14.5 16l2.5 3 .5-4.5-2-2.5z" fill="#f28b82"/><path d="M10.5 17h3l-1.5 4z" fill="#fdd663"/></svg></span></div>' +
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
    buyBtn.className = 'rocket-action-btn is-secondary';
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
    resetBtn.textContent = 'Click again to confirm';
    resetBtn.classList.add('armed');
    clearTimeout(resetArmTimer);
    resetArmTimer = setTimeout(function () {
      resetArmed = false;
      resetBtn.textContent = 'Reset Game';
      resetBtn.classList.remove('armed');
    }, 3000);
  } else {
    clearTimeout(resetArmTimer);
    resetArmed = false;
    resetBtn.textContent = 'Reset Game';
    resetBtn.classList.remove('armed');
    resetGame();
  }
});

