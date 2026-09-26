'use strict';

// ============================================================
// CONSTANTS
// ============================================================
var GRID_SIZE = 8;      // starting owned garden is GRID_SIZE x GRID_SIZE
var MAX_EXPANSION = 12; // garden can grow this many tiles beyond its start, in each direction
var TILE_SIZE = 1;
var HALF = (GRID_SIZE - 1) / 2;

// ============================================================
// VEGETABLE CATALOGUE - progression design
// ============================================================
// This shape is deliberate, not just "9 vegetables with numbers on them" -
// see the comments on each piece for why. In short, it borrows the two
// Cookie Clicker's actual economy (from its design docs): building base
// costs scale ~10-15x per tier, income (CpS) scales ~5-10x per tier, and
// the "payoff time" (cost / income) stays roughly constant so every tier
// is worth buying. That steep, smooth curve IS the pacing. Crucially,
// Cookie Clicker's per-building price escalation (x1.15 per owned) only
// works because its buildings produce PASSIVELY forever - this game's
// production is one-shot (buy seed -> plant -> sell), so a fixed seed cost
// and a fixed sell price keep the loop profitable forever, which is what
// lets a machine that repeatedly buys/plants/sells actually keep working.
// (The old "heat" price escalation was removed for exactly this reason: it
// made seeds cost more than they sold for after a few buys, so machines
// self-destructed economically.) So:
//
// 1. Tiers scale exponentially: seedCost x3 and growSeconds x1.13 per tier
//    (Cookie Clicker's ~10x, scaled down to fit one lesson) - the cost curve
//    is the pacing gate, grow time just makes automation worthwhile.
// 2. Each tier unlocks once you've EARNED enough coins total (lifetime
//    totalEarned, from any source). The exponential price curve is the
//    real gate - you can't afford the next tier until your income grows.
//
// `emoji` is a Twemoji (CC-BY 4.0) codepoint - loaded once per veggie and
// rasterised onto a small canvas so it works as a three.js texture
// regardless of the source SVG's own width/height quirks.
// https://github.com/twitter/twemoji
var VEGGIE_TIERS = [
  { name: 'Carrot',   emoji: '1f955' },
  { name: 'Potato',   emoji: '1f954' },
  { name: 'Tomato',   emoji: '1f345' },
  { name: 'Corn',     emoji: '1f33d' },
  { name: 'Broccoli', emoji: '1f966' },
  { name: 'Chili Pepper', emoji: '1f336' },
  { name: 'Eggplant', emoji: '1f346' },
  { name: 'Watermelon', emoji: '1f349' },
  { name: 'Golden Pineapple', emoji: '1f34d', tint: 0xffd863 },
  { name: 'Red Apple',   emoji: '1f34e' },
  { name: 'Green Apple', emoji: '1f34f' },
  { name: 'Pear',        emoji: '1f350' },
  { name: 'Tangerine',   emoji: '1f34a' },
  { name: 'Lemon',       emoji: '1f34b' },
  { name: 'Banana',      emoji: '1f34c' },
  { name: 'Strawberry',  emoji: '1f353' },
  { name: 'Grapes',      emoji: '1f347' },
  { name: 'Blueberries', emoji: '1fad0' },
  { name: 'Cherries',    emoji: '1f352' },
  { name: 'Peach',       emoji: '1f351' },
  { name: 'Melon',       emoji: '1f348' },
  { name: 'Mango',       emoji: '1f96d' },
  { name: 'Coconut',     emoji: '1f965' },
  { name: 'Kiwi',        emoji: '1f95d' },
  { name: 'Avocado',     emoji: '1f951' },
  { name: 'Cucumber',    emoji: '1f952' },
  { name: 'Leafy Green', emoji: '1f96c' },
  { name: 'Onion',       emoji: '1f9c5' },
  { name: 'Garlic',      emoji: '1f9c4' },
  { name: 'Sweet Potato', emoji: '1f360' },
  { name: 'Beans',       emoji: '1fad8' },
  { name: 'Peanut',      emoji: '1f95c' },
  { name: 'Mushroom',    emoji: '1f344' }
];

var TIER_SEED_COST_BASE = 5;
var TIER_SEED_COST_GROWTH = 3.0;    // cost x3 per tier - clearly exponential, so the game doesn't finish instantly
var TIER_SELL_MARGIN_BASE = 1.8;    // sellPrice = seedCost * margin
var TIER_SELL_MARGIN_STEP = 0.08;   // margin improves slightly per tier
var TIER_GROW_SECONDS_BASE = 10;
var TIER_GROW_SECONDS_GROWTH = 1.13;   // grow time x1.13 per tier, so pricier seeds get meaningfully slower across 33 crops
var TIER_UNLOCK_EARNED_MULTIPLE = 8; // unlock i once totalEarned >= seedCost(i-1) * this (lifetime earnings, any source)

var VEGGIES = {};
VEGGIE_TIERS.forEach(function (t, i) {
  var seedCost = Math.round(TIER_SEED_COST_BASE * Math.pow(TIER_SEED_COST_GROWTH, i));
  var margin = TIER_SELL_MARGIN_BASE + i * TIER_SELL_MARGIN_STEP;
  var growSeconds = Math.round(TIER_GROW_SECONDS_BASE * Math.pow(TIER_GROW_SECONDS_GROWTH, i));
  VEGGIES[t.name] = {
    tier: i,
    emoji: t.emoji,
    tint: t.tint || null,
    seedCost: seedCost,
    sellPrice: Math.round(seedCost * margin),
    growSeconds: growSeconds,
    unlockEarned: i === 0 ? 0 : Math.round(VEGGIES[VEGGIE_TIERS[i - 1].name].seedCost * TIER_UNLOCK_EARNED_MULTIPLE)
  };
});
var VEGGIE_NAMES = VEGGIE_TIERS.map(function (t) { return t.name; });

// ============================================================
// FARM TYPES - "Sell the Farm" prestige unlock (see sellFarmUnlocked() below)
// ============================================================
// Once a farm type is fully built up (every tier unlocked and enough earned ON THAT FARM -
// see sellFarmUnlocked()), "Sell the Farm" appears: clear the current farm and start a new
// farm type completely from scratch (40 coins, tier 1 only), with a genuinely different
// mechanic as the reward rather than a carried-over fortune. Solar Farm reuses the exact same
// plant/grow/sell pipeline as crops (activeItems()/activeItemNames() below select which
// table is "live", same emoji-texture and shop code) - the genuinely different mechanic
// comes from one well-contained tweak in currentSellValue()/sellAt(): a battery's value
// keeps climbing for a while after it first finishes charging (patience pays off, unlike a
// crop which is always worth the same the moment it's grown), then decays if left forgotten
// far past that peak (so leaving one running forever is a real mistake, unlike a crop which
// never punishes being left alone).
var BATTERY_TIERS = [
  { name: 'AA Battery',     emoji: '1f50b' },
  { name: 'Power Bank',     emoji: '1f50c' },
  { name: 'Light Cell',     emoji: '1f4a1' },
  { name: 'Solar Cell',     emoji: '1f31e' },
  { name: 'Lightning Core', emoji: '26a1' },
  { name: 'Fusion Core',    emoji: '1f525' }
];
var BATTERY_TIER_SEED_COST_BASE = 40;
var BATTERY_TIER_SEED_COST_GROWTH = 3.2;
var BATTERY_TIER_SELL_MARGIN_BASE = 1.8;
var BATTERY_TIER_SELL_MARGIN_STEP = 0.1;
var BATTERY_TIER_GROW_SECONDS_BASE = 8;
var BATTERY_TIER_GROW_SECONDS_GROWTH = 1.2;
var BATTERY_TIER_UNLOCK_EARNED_MULTIPLE = 8;
// How a battery's live sell value moves over time, all expressed as multiples of its own
// charge time so the pacing scales with tier the same way growSeconds already does: value
// climbs from sellPrice up to a +50% peak by 1.5x charge time, holds there, then decays back
// down (never below a 20% floor) once left past 3x charge time.
var BATTERY_PEAK_BONUS = 0.5;
var BATTERY_PEAK_AT_MULTIPLE = 1.5;
var BATTERY_DECAY_STARTS_AT_MULTIPLE = 3;
var BATTERY_DECAY_FLOOR = 0.2;

var BATTERIES = {};
BATTERY_TIERS.forEach(function (t, i) {
  var seedCost = Math.round(BATTERY_TIER_SEED_COST_BASE * Math.pow(BATTERY_TIER_SEED_COST_GROWTH, i));
  var margin = BATTERY_TIER_SELL_MARGIN_BASE + i * BATTERY_TIER_SELL_MARGIN_STEP;
  var growSeconds = Math.round(BATTERY_TIER_GROW_SECONDS_BASE * Math.pow(BATTERY_TIER_GROW_SECONDS_GROWTH, i));
  BATTERIES[t.name] = {
    tier: i,
    emoji: t.emoji,
    tint: t.tint || null,
    seedCost: seedCost,
    sellPrice: Math.round(seedCost * margin),
    growSeconds: growSeconds,
    unlockEarned: i === 0 ? 0 : Math.round(BATTERIES[BATTERY_TIERS[i - 1].name].seedCost * BATTERY_TIER_UNLOCK_EARNED_MULTIPLE)
  };
});
var BATTERY_NAMES = BATTERY_TIERS.map(function (t) { return t.name; });

// Aquarium: fish grown in tiled "tanks" (reusing the same tile grid - see AQUARIUM_TILE_TINT
// in the tile-rendering section for the watery colour swap), the third farm type. Its own
// distinct mechanic - see currentSellValue() below - is patience with NO downside: a fish's
// value keeps climbing the whole time it's left in the tank, approaching a cap and slowing
// down but never decaying, unlike a battery. Between crops (flat), batteries (climbs then
// punishes neglect) and fish (climbs forever, never punishes), all three "what does time do
// to a grown thing's value" answers a Cambridge pseudocode student could reasonably design
// are now each their own farm type.
var FISH_TIERS = [
  { name: 'Goldfish',      emoji: '1f41f' },
  { name: 'Blowfish',      emoji: '1f421' },
  { name: 'Tropical Fish', emoji: '1f420' },
  { name: 'Squid',         emoji: '1f991' },
  { name: 'Octopus',       emoji: '1f419' },
  { name: 'Shark',         emoji: '1f988' }
];
var FISH_TIER_SEED_COST_BASE = 35;
var FISH_TIER_SEED_COST_GROWTH = 3.1;
var FISH_TIER_SELL_MARGIN_BASE = 1.8;
var FISH_TIER_SELL_MARGIN_STEP = 0.1;
var FISH_TIER_GROW_SECONDS_BASE = 9;
var FISH_TIER_GROW_SECONDS_GROWTH = 1.2;
var FISH_TIER_UNLOCK_EARNED_MULTIPLE = 8;
// A fish's value approaches a cap of sellPrice x (1 + FISH_CAP_BONUS) but never quite
// reaches it - each FISH_GROWTH_HALFLIFE_MULTIPLE x growMs of extra time closes half the
// remaining gap to the cap, so it's always worth a LITTLE more to wait, with steeply
// diminishing returns rather than a hard "stop waiting now" line like a battery has.
var FISH_CAP_BONUS = 1.5;
var FISH_GROWTH_HALFLIFE_MULTIPLE = 2;

var FISH = {};
FISH_TIERS.forEach(function (t, i) {
  var seedCost = Math.round(FISH_TIER_SEED_COST_BASE * Math.pow(FISH_TIER_SEED_COST_GROWTH, i));
  var margin = FISH_TIER_SELL_MARGIN_BASE + i * FISH_TIER_SELL_MARGIN_STEP;
  var growSeconds = Math.round(FISH_TIER_GROW_SECONDS_BASE * Math.pow(FISH_TIER_GROW_SECONDS_GROWTH, i));
  FISH[t.name] = {
    tier: i,
    emoji: t.emoji,
    tint: t.tint || null,
    seedCost: seedCost,
    sellPrice: Math.round(seedCost * margin),
    growSeconds: growSeconds,
    unlockEarned: i === 0 ? 0 : Math.round(FISH[FISH_TIERS[i - 1].name].seedCost * FISH_TIER_UNLOCK_EARNED_MULTIPLE)
  };
});
var FISH_NAMES = FISH_TIERS.map(function (t) { return t.name; });

// Rocket Yard: the fourth and final farm type. Mining is mechanically identical to growing a
// crop (flat sell value, no new curve needed - see currentSellValue()'s fallthrough) - the
// genuinely new thing isn't the economy, it's what the coins fund: a one-time capstone build
// (ROCKET_PARTS below) culminating in a real-time launch that keeps counting down whether or
// not the student has the page open, exactly like a plant's own growMs timer already does,
// just measured in hours instead of seconds. See the ROCKET BUILD section further down.
var FUEL_TIERS = [
  { name: 'Rock',       emoji: '1faa8' },
  { name: 'Crystal',    emoji: '1f48e' },
  { name: 'Uranium',    emoji: '1f9ea' },
  { name: 'Plasma',     emoji: '1f320' },
  { name: 'Antimatter', emoji: '1f30c' },
  { name: 'Star Fuel',  emoji: '1f680' }
];
var FUEL_TIER_SEED_COST_BASE = 45;
var FUEL_TIER_SEED_COST_GROWTH = 3.3;
var FUEL_TIER_SELL_MARGIN_BASE = 1.8;
var FUEL_TIER_SELL_MARGIN_STEP = 0.1;
var FUEL_TIER_GROW_SECONDS_BASE = 7;
var FUEL_TIER_GROW_SECONDS_GROWTH = 1.2;
var FUEL_TIER_UNLOCK_EARNED_MULTIPLE = 8;

var FUEL = {};
FUEL_TIERS.forEach(function (t, i) {
  var seedCost = Math.round(FUEL_TIER_SEED_COST_BASE * Math.pow(FUEL_TIER_SEED_COST_GROWTH, i));
  var margin = FUEL_TIER_SELL_MARGIN_BASE + i * FUEL_TIER_SELL_MARGIN_STEP;
  var growSeconds = Math.round(FUEL_TIER_GROW_SECONDS_BASE * Math.pow(FUEL_TIER_GROW_SECONDS_GROWTH, i));
  FUEL[t.name] = {
    tier: i,
    emoji: t.emoji,
    tint: t.tint || null,
    seedCost: seedCost,
    sellPrice: Math.round(seedCost * margin),
    growSeconds: growSeconds,
    unlockEarned: i === 0 ? 0 : Math.round(FUEL[FUEL_TIERS[i - 1].name].seedCost * FUEL_TIER_UNLOCK_EARNED_MULTIPLE)
  };
});
var FUEL_NAMES = FUEL_TIERS.map(function (t) { return t.name; });

// Registry of every farm type - 'crops' wraps the existing VEGGIES table so all behaviour is
// completely unchanged while it's active. currentFarmType selects which table
// activeItems()/activeItemNames() return; every function that used to reach for
// VEGGIES/VEGGIE_NAMES directly now goes through those two instead (see the git history of
// this section), so the exact same plant/grow/sell/shop/save code serves any farm type
// without duplicating it. lookupItem() resolves a name regardless of which type is
// currently active - needed for anything working from already-saved data (a planted tile, a
// save file) rather than "what's buyable right now".
var FARM_TYPES = {
  crops: {
    id: 'crops', title: 'Crop Farm', kind: 'crop', items: VEGGIES, itemNames: VEGGIE_NAMES,
    unitLabel: 'seed', unitLabelPlural: 'seeds', nameSuffix: ' Seeds', badgeColor: '#4c8bf5',
    shopTitle: 'Seed Shop', unlockNoun: 'vegetables', growNoun: 'crops', growVerb: 'grow', kindNounSingular: 'vegetable',
    plantVerb: 'Plant', placedNoun: 'crop', onTileVerb: 'growing',
    desc: 'Grow and sell vegetables, tier by tier.'
  },
  solar: {
    id: 'solar', title: 'Solar Farm', kind: 'battery', items: BATTERIES, itemNames: BATTERY_NAMES,
    unitLabel: 'battery', unitLabelPlural: 'batteries', nameSuffix: '', badgeColor: '#e0a53f',
    shopTitle: 'Battery Shop', unlockNoun: 'batteries', growNoun: 'batteries', growVerb: 'charge', kindNounSingular: 'battery',
    plantVerb: 'Place', placedNoun: 'battery', onTileVerb: 'charging',
    desc: 'Charge batteries instead of growing crops. The longer you leave one past full charge, the more it earns - up to a point. Forget about it too long and it starts losing value, so timing the sell matters here in a way it never did on the crop farm.'
  },
  aquarium: {
    id: 'aquarium', title: 'Aquarium', kind: 'fish', items: FISH, itemNames: FISH_NAMES,
    unitLabel: 'fish', unitLabelPlural: 'fish', nameSuffix: '', badgeColor: '#1e8fa8',
    shopTitle: 'Fish Shop', unlockNoun: 'fish', growNoun: 'fish', growVerb: 'grow', kindNounSingular: 'fish',
    plantVerb: 'Place', placedNoun: 'fish', onTileVerb: 'swimming',
    desc: 'Raise fish in watery tiles instead of growing crops. A fish is never "wasted value" for waiting - it just keeps growing worth, forever, though more and more slowly the longer you leave it. There is no downside to patience here, unlike the Solar Farm.'
  },
  rocket: {
    id: 'rocket', title: 'Rocket Yard', kind: 'fuel', items: FUEL, itemNames: FUEL_NAMES,
    unitLabel: 'canister', unitLabelPlural: 'canisters', nameSuffix: '', badgeColor: '#6b4fa0',
    shopTitle: 'Fuel Depot', unlockNoun: 'fuel types', growNoun: 'fuel', growVerb: 'mine', kindNounSingular: 'type of fuel',
    plantVerb: 'Place', placedNoun: 'canister', onTileVerb: 'mining',
    desc: 'Mine and sell fuel instead of growing crops - then spend the coins building a real rocket. Once every part is bought and the tank is full, launch it: the flight itself takes real hours, counting down whether you\'re watching or not.'
  }
};
var currentFarmType = 'crops';
function activeItems() { return FARM_TYPES[currentFarmType].items; }
function activeItemNames() { return FARM_TYPES[currentFarmType].itemNames; }
function activeFarmType() { return FARM_TYPES[currentFarmType]; }
function lookupItem(name) { return VEGGIES[name] || BATTERIES[name] || FISH[name] || FUEL[name] || null; }

// Progression is deliberately linear and only ever reveals ONE step ahead - crops ->
// solar -> aquarium -> rocket, in that fixed order - so "Sell the Farm" can never spoil
// what's two farm types away. farmTypesDiscovered is the only thing that gates what the
// panel is allowed to show; it only ever grows (switching to a type adds it, nothing ever
// removes one), so a type already seen stays revisitable, but nothing further ahead leaks
// early.
var FARM_TYPE_SEQUENCE = ['crops', 'solar', 'aquarium', 'rocket'];
function nextFarmTypeInSequence(id) {
  var idx = FARM_TYPE_SEQUENCE.indexOf(id);
  return (idx === -1 || idx === FARM_TYPE_SEQUENCE.length - 1) ? null : FARM_TYPE_SEQUENCE[idx + 1];
}
var farmTypesDiscovered = ['crops'];

// The milestone: every item on the current farm type is unlocked, AND coins earned ON THIS
// FARM (farmEarned, reset to 0 every time you Sell the Farm) are at least
// SELL_FARM_EARN_MULTIPLE times what unlocking that final item cost. A fixed anchor (the
// final tier's own unlock threshold is already enormous on the x3-per-tier curve), so it
// still needs real progression through the tiers and can't be cheesed by grinding cheap
// early items - and, crucially, it uses farm-scoped earnings, not lifetime, so arriving on a
// new farm type with an inherited fortune does NOT instantly re-satisfy it. It can't flicker
// (farmEarned only moves up between resets) and can't be dodged by never spending.
//
// James, twice:
//  1. (~2.76 quintillion lifetime earned, all 33 crops unlocked, still "0% revealed") the
//     original gate was bestSale * 100,000. The comment that picked 100,000 assumed a
//     top-tier sale was "tens of trillions"; it's actually ~4e16 (tier 32 on the x3 curve),
//     so the real target landed near 4e21 - ~1,500x out of reach for a finished crop tree.
//  2. (game-breaking) switching to the lifetime-earned anchor then meant a rich player
//     arriving on Solar/Aquarium already cleared that farm's (smaller) threshold from
//     inherited earnings alone, so Sell the Farm was immediately available again and again -
//     click through every farm type in seconds. farmEarned fixes exactly this: it starts at
//     0 on each new farm and you have to actually build the place up before selling it.
var SELL_FARM_EARN_MULTIPLE = 10;
var bestSaleValue = 0; // still tracked (saved, shown in a few places) but no longer gates the unlock
function sellFarmUnlocked() {
  var names = activeItemNames();
  var lastName = names[names.length - 1];
  var lastItem = lastName && activeItems()[lastName];
  if (!lastItem || !isUnlocked(lastName)) return false;
  return farmEarned >= lastItem.unlockEarned * SELL_FARM_EARN_MULTIPLE;
}
// The value a plant/battery/fish would sell for RIGHT NOW. Crops are flat once ready (grown
// is grown, unchanged from before this feature). A battery's value is time-dependent even
// after it's ready, and so is a fish's - see the FARM TYPES comment above for the shape of
// each curve.
function currentSellValue(plant) {
  var item = lookupItem(plant.type);
  if (!item) return 0;
  var elapsedMs = Date.now() - plant.plantedAt;
  var growMs = plant.growMs;
  if (elapsedMs <= growMs) return item.sellPrice; // not ready - callers already block selling this
  if (BATTERIES[plant.type]) {
    var peakAt = growMs * BATTERY_PEAK_AT_MULTIPLE;
    var decayAt = growMs * BATTERY_DECAY_STARTS_AT_MULTIPLE;
    var peakValue = item.sellPrice * (1 + BATTERY_PEAK_BONUS);
    if (elapsedMs <= peakAt) {
      var climbFrac = (elapsedMs - growMs) / (peakAt - growMs);
      return Math.round(item.sellPrice + (peakValue - item.sellPrice) * climbFrac);
    }
    if (elapsedMs <= decayAt) return Math.round(peakValue);
    var decaySpan = Math.max(1, decayAt - peakAt);
    var decayFrac = Math.min(1, (elapsedMs - decayAt) / decaySpan);
    var floorValue = item.sellPrice * BATTERY_DECAY_FLOOR;
    return Math.round(peakValue - (peakValue - floorValue) * decayFrac);
  }
  if (FISH[plant.type]) {
    // Approaches (but never quite reaches) a cap: every FISH_GROWTH_HALFLIFE_MULTIPLE x
    // growMs of extra time closes half the remaining gap to the cap. No decay, ever.
    var capValue = item.sellPrice * (1 + FISH_CAP_BONUS);
    var halfLifeMs = growMs * FISH_GROWTH_HALFLIFE_MULTIPLE;
    var agingFrac = 1 - Math.pow(0.5, (elapsedMs - growMs) / halfLifeMs);
    return Math.round(item.sellPrice + (capValue - item.sellPrice) * agingFrac);
  }
  return item.sellPrice;
}
// Which part of its value curve a ready plant is currently in - lets UI text be precise
// instead of just comparing the live value to the base price, which would wrongly tell a
// battery sitting exactly at its peak plateau to "wait for more" when waiting longer does
// nothing until decay eventually starts. 'flat' for crops (always). A battery is 'climbing'
// (still short of its peak), 'peak' (at its best value - decay hasn't started yet), or
// 'decaying' (already past its best). A fish is always 'climbing' once ready - it has no
// peak/decay phase of its own, see currentSellValue().
function sellValuePhase(plant) {
  if (FISH[plant.type]) return 'climbing';
  if (!BATTERIES[plant.type]) return 'flat';
  var elapsedMs = Date.now() - plant.plantedAt;
  var growMs = plant.growMs;
  var peakAt = growMs * BATTERY_PEAK_AT_MULTIPLE;
  var decayAt = growMs * BATTERY_DECAY_STARTS_AT_MULTIPLE;
  if (elapsedMs <= peakAt) return 'climbing';
  if (elapsedMs <= decayAt) return 'peak';
  return 'decaying';
}

// Writing pseudocode should always beat reaching for a button - that is
// the whole point of the game. Code Buy("...") costs less than the shop
// button, and code Sell() pays more than the on-tile sell button, so the
// fastest way to progress is always to type the command instead of
// clicking the UI. Both constants are here (not buried in the command
// handlers) so they can be tuned for balance without hunting for them.
var CODE_BUY_DISCOUNT = 0.8;   // code Buy("...") pays 80% of the shop button price
var CODE_SELL_BONUS = 1.5;     // code Sell() pays 150% of the tile sell button

function twemojiUrl(codepoint) {
  return 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/' + codepoint + '.svg';
}

// Turtle-style facing, index into this array: 0 = up (north), 1 = right
// (east), 2 = down (south), 3 = left (west) - "up" here means the same
// direction MoveUp already moves in, so MoveForward with facing 0
// behaves exactly like the original MoveUp did.
var FACING_VECTORS = [ { dx: 0, dz: -1 }, { dx: 1, dz: 0 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 } ];
