/**
 * binary-mining-module.js
 *
 * Binary Mine: a 2D mining game that teaches binary addition (Year 8 Binary L3).
 *
 * Every element is a positive whole number (its value). Combining two elements
 * is binary addition, and the sum is a new element. To mine a block of value V
 * you must own a qualifying pickaxe: an element equal to V (exact), or one
 * whose bit length is at least bits(V) + 2 (brute force). Crafting uses up both
 * inputs (addition conserves value), so mining is the only source of new
 * value, which keeps the climb honest.
 *
 * The craft table is the teaching surface: the student works out the binary
 * sum column by column. Support mode (shared/bc-support.js) shows how, and
 * shows less as they get sums right: the full working, then only the carries,
 * then the rule, then nothing.
 *
 * Progress is kept in localStorage (pylearn_mining_v1) and mirrored to the
 * student's account by shared/cloud-save.js.
 *
 * Mounted with window.initBinaryMiningGame(containerId). DOM ids start bmg-.
 */
(function () {

  // ---- Tunables ----
  var COLS = 8;
  var SKY_ROWS = 2;
  var START_DEPTH = 5;          // mine rows unlocked at the start
  var MAX_VIS_ROWS = 13;        // the grid scrolls beyond this many rows
  var CELL = 40;
  var SEED = 20260629;          // one shared world, identical for every player
  var BRUTE_BITS = 2;           // a pickaxe brute-mines anything <= bits(pick) - 2
  var START_INV = { 1: 5 };     // five Hydrogen to start

  // Depth is endless. Row d draws values from a band whose centre grows about
  // 1.55x per row, so values pass 118 into invented elements the deeper you go.
  function depthCentre(d) { return Math.max(1, Math.round(Math.pow(1.55, d))); }
  function bandForDepth(d) {
    if (d <= 1) return [1, 2];
    var c = depthCentre(d);
    return [Math.max(1, Math.round(c * 0.7)), Math.round(c * 1.35)];
  }
  function digCost(depth) { return Math.max(5, Math.round(depthCentre(depth + 1) * 2)); }

  var LS_KEY = 'pylearn_mining_v1';

  // ---- Element identity ----
  var REAL_NAMES = ['',
    'Hydrogen','Helium','Lithium','Beryllium','Boron','Carbon','Nitrogen','Oxygen','Fluorine','Neon',
    'Sodium','Magnesium','Aluminium','Silicon','Phosphorus','Sulfur','Chlorine','Argon','Potassium','Calcium',
    'Scandium','Titanium','Vanadium','Chromium','Manganese','Iron','Cobalt','Nickel','Copper','Zinc',
    'Gallium','Germanium','Arsenic','Selenium','Bromine','Krypton','Rubidium','Strontium','Yttrium','Zirconium',
    'Niobium','Molybdenum','Technetium','Ruthenium','Rhodium','Palladium','Silver','Cadmium','Indium','Tin',
    'Antimony','Tellurium','Iodine','Xenon','Caesium','Barium','Lanthanum','Cerium','Praseodymium','Neodymium',
    'Promethium','Samarium','Europium','Gadolinium','Terbium','Dysprosium','Holmium','Erbium','Thulium','Ytterbium',
    'Lutetium','Hafnium','Tantalum','Tungsten','Rhenium','Osmium','Iridium','Platinum','Gold','Mercury',
    'Thallium','Lead','Bismuth','Polonium','Astatine','Radon','Francium','Radium','Actinium','Thorium',
    'Protactinium','Uranium','Neptunium','Plutonium','Americium','Curium','Berkelium','Californium','Einsteinium','Fermium',
    'Mendelevium','Nobelium','Lawrencium','Rutherfordium','Dubnium','Seaborgium','Bohrium','Hassium','Meitnerium','Darmstadtium',
    'Roentgenium','Copernicium','Nihonium','Flerovium','Moscovium','Livermorium','Tennessine','Oganesson'
  ];
  var REAL_SYMBOLS = ['',
    'H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca',
    'Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr',
    'Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd',
    'Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg',
    'Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm',
    'Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og'
  ];
  var PROC_PRE = ['Cry','Nov','Lum','Vor','Zeph','Pyr','Aur','Quar','Xan','Therm','Gly','Obs','Vex','Tor','Kry','Mag','Sol','Neb','Drac','Fyr'];
  var PROC_MID = ['a','o','i','y','e','ae','io','ou'];
  var PROC_SUF = ['lite','rium','ite','on','ide','ux','ar','yx','ium','ane','ol','yte'];
  var COLOR_OVERRIDE = { 26: '#a8a8a8', 29: '#c87533', 47: '#c8c8d0', 79: '#ffd34d', 80: '#b8c0c8', 82: '#6e7b8b', 6: '#3a3a44' };

  function hash32(n) {
    n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
    return (n >>> 0);
  }
  function bits(v) { return v.toString(2).length; }
  function binStr(v) { return v.toString(2); }
  function elementName(v) {
    if (v >= 1 && v < REAL_NAMES.length) return REAL_NAMES[v];
    var a = hash32(v * 3 + 1), b = hash32(v * 7 + 2), c = hash32(v * 13 + 3);
    return PROC_PRE[a % PROC_PRE.length] + PROC_MID[b % PROC_MID.length] + PROC_SUF[c % PROC_SUF.length];
  }
  function elementSymbol(v) {
    if (v >= 1 && v < REAL_SYMBOLS.length) return REAL_SYMBOLS[v];
    var n = elementName(v);
    return n.charAt(0).toUpperCase() + (n.charAt(1) || '').toLowerCase();
  }
  function elementColor(v) {
    if (COLOR_OVERRIDE[v]) return COLOR_OVERRIDE[v];
    return 'hsl(' + (hash32(v * 2654435761) % 360) + ',68%,57%)';
  }
  var CRAFT_VERBS = ['Imbued', 'Forged', 'Tempered', 'Charged', 'Veined', 'Crusted', 'Bound', 'Fused'];
  function pickaxeName(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    return elementName(lo) + '-' + CRAFT_VERBS[hash32(lo * 31 + hi) % CRAFT_VERBS.length] + ' ' + elementName(hi) + ' Pickaxe';
  }

  // ---- Game state ----
  var g = null;
  function freshState() {
    return {
      inv: Object.assign({}, START_INV),  // value -> count
      money: 0,
      best: 1,
      depth: START_DEPTH,
      discovered: { 1: true },
      mined: {},      // "x,y" -> true
      placed: {},     // "x,sN" -> value, built in the sky
      shop: {},       // value -> count, sold and buyable back at 2x
      selected: 1,
      slotA: null,
      slotB: null,
      craftGuess: null,
      craftCarry: null,
      dragVal: null,
      saveTimer: null,
      resetArmed: false
    };
  }
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (!raw) return false;
      g.inv = raw.inv || Object.assign({}, START_INV);
      g.money = raw.money || 0;
      g.best = raw.best || 1;
      g.depth = raw.depth || START_DEPTH;
      g.discovered = raw.discovered || { 1: true };
      g.mined = raw.mined || {};
      g.placed = raw.placed || {};
      g.shop = raw.shop || {};
      g.selected = raw.selected || bestOwned() || 1;
      return true;
    } catch (e) { return false; }
  }
  function save() {
    clearTimeout(g.saveTimer);
    g.saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          inv: g.inv, money: g.money, best: g.best, depth: g.depth,
          discovered: g.discovered, mined: g.mined, placed: g.placed, shop: g.shop, selected: g.selected
        }));
      } catch (e) {}
    }, 400);
  }

  // ---- Helpers ----
  function G(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function have(v) { return (g.inv[v] || 0) > 0; }
  function bestOwned() {
    var best = 0;
    Object.keys(g.inv).forEach(function (k) { if (g.inv[k] > 0 && +k > best) best = +k; });
    return best;
  }
  function ownedValues() {
    return Object.keys(g.inv).map(Number).filter(function (v) { return g.inv[v] > 0; }).sort(function (a, b) { return a - b; });
  }
  function discoveredCount() { return Object.keys(g.discovered).length; }
  function cellValue(x, y) {
    if (y === 0) return (x % 2 === 0) ? 1 : 2;  // a gentle first row
    var band = bandForDepth(y + 1);
    return band[0] + (hash32((x + 1) * 92837 + (y + 1) * 689287 + SEED) % (band[1] - band[0] + 1));
  }
  function canMine(v) {
    var owned = ownedValues();
    for (var i = 0; i < owned.length; i++) {
      if (owned[i] === v || bits(owned[i]) >= bits(v) + BRUTE_BITS) return true;
    }
    return false;
  }
  function gainElement(v, n) {
    g.inv[v] = (g.inv[v] || 0) + (n || 1);
    if (!g.discovered[v]) g.discovered[v] = true;
    if (v > g.best) g.best = v;
  }

  // ---- Support mode ----
  var Support = window.BCSupport || null;
  var addFader = Support ? Support.fader('binarymine:add') : null;
  function supportReveal() { return Support && Support.isOn() && addFader ? addFader.reveal() : 0; }

  function toast(msg, kind) {
    var el = G('bmg-toast'); if (!el) return;
    el.textContent = msg;
    el.className = 'bmg-toast show ' + (kind || 'good');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.className = 'bmg-toast'; }, 2200);
  }

  // ---- Styles, on the site theme (shared/bc-theme.css) ----
  function injectStyle() {
    if (G('bmg-style')) return;
    var s = document.createElement('style');
    s.id = 'bmg-style';
    s.textContent = [
      '.bmg-wrap{max-width:1180px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:14px;color:var(--ink)}',
      '.bmg-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px}',
      '.bmg-top{display:flex;align-items:center;gap:10px 12px;flex-wrap:wrap;padding:12px 16px}',
      '.bmg-stat{display:inline-flex;align-items:baseline;gap:6px;padding:6px 12px;border-radius:10px;background:var(--surface-2);font-size:13px;color:var(--muted)}',
      '.bmg-stat b{color:var(--ink);font:700 15px var(--font-mono)}',
      '.bmg-actions{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;align-items:center}',
      '.bmg-toast{font-size:13px;font-weight:500;opacity:0;transition:opacity .2s}',
      '.bmg-toast.show{opacity:1}.bmg-toast.good{color:var(--good)}.bmg-toast.warn{color:var(--warn)}.bmg-toast.bad{color:var(--bad)}',
      '.bmg-cols{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}',
      '.bmg-h{margin:0 0 10px;font:700 16px var(--font-display);color:var(--ink)}',
      '.bmg-note{margin-top:8px;color:var(--muted);font-size:12px;line-height:1.5}',
      '.bmg-grid{display:grid;gap:0;border-radius:10px;overflow-x:hidden;overflow-y:auto;border:1px solid var(--line-strong);user-select:none}',
      '.bmg-cell{position:relative;display:flex;align-items:center;justify-content:center}',
      '.bmg-cell.sky{background:linear-gradient(#141a26,#11161f);border:1px solid #0c1017;cursor:crosshair}',
      '.bmg-cell.sky:hover{background:#1b2230}',
      '.bmg-cell.dug{background:#0b0d11;border:1px solid #090b0e}',
      '.bmg-cell.ore,.bmg-cell.built{border:1px solid rgba(0,0,0,.35);cursor:pointer}',
      '.bmg-cell .shade{position:absolute;inset:0;pointer-events:none}',
      '.bmg-cell.locked .shade{box-shadow:inset 0 0 0 2px rgba(0,0,0,.5)}',
      '.bmg-cell .lock{position:absolute;right:2px;bottom:1px;width:10px;height:10px;z-index:1;color:rgba(0,0,0,.65)}',
      '.bmg-cell .sym{position:relative;z-index:1;font:800 13px var(--font-body);color:#0a0f1a;text-shadow:0 1px 0 rgba(255,255,255,.35)}',
      '.bmg-slot{position:relative;width:42px;height:42px;border-radius:9px;background:var(--surface-3);border:1px solid var(--line-strong);box-sizing:border-box;cursor:pointer}',
      '.bmg-slot:hover{border-color:var(--muted-2)}',
      '.bmg-slot.sel{box-shadow:0 0 0 2px var(--brand);border-color:var(--brand)}',
      '.bmg-slot.bmg-drop{background:var(--brand-soft-strong)}',
      '.bmg-item{position:absolute;inset:3px;border-radius:6px;display:flex;align-items:center;justify-content:center;user-select:none}',
      '.bmg-item[draggable=true]{cursor:grab}.bmg-item[draggable=true]:active{cursor:grabbing}',
      '.bmg-sym{font:800 13px var(--font-body);color:#0a0f1a;text-shadow:0 1px 0 rgba(255,255,255,.4)}',
      '.bmg-count{position:absolute;right:-2px;bottom:-5px;padding:0 3px;border-radius:5px;background:var(--bg);color:var(--ink);font:700 11px var(--font-mono)}',
      '.bmg-inv{display:grid;grid-template-columns:repeat(8,42px);gap:4px;max-height:196px;overflow-y:auto;padding:2px}',
      '.bmg-selbar{display:flex;align-items:center;gap:10px;margin-top:10px;min-height:32px;font-size:14px}',
      '.bmg-swatch{width:22px;height:22px;flex-shrink:0;border-radius:6px}',
      '.bmg-craft{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
      '.bmg-bin{font:700 14px var(--font-mono);color:var(--ink-soft)}',
      '.bmg-arrow{font-size:22px;color:var(--muted)}',
      '.bmg-sum{display:inline-block;margin:8px 0;padding:8px 12px 10px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)}',
      '.bmg-row{display:flex;align-items:center}',
      '.bmg-gut{display:inline-flex;width:20px;height:30px;align-items:center;justify-content:center;font:700 16px var(--font-mono);color:var(--muted)}',
      '.bmg-dig{display:inline-flex;width:26px;height:30px;margin:0 1px;align-items:center;justify-content:center;font:700 17px var(--font-mono);color:var(--ink)}',
      '.bmg-bit{display:inline-flex;width:26px;height:30px;margin:0 1px;align-items:center;justify-content:center;box-sizing:border-box;border-radius:6px;border:1px solid var(--line-strong);background:var(--surface-3);color:var(--muted);font:700 16px var(--font-mono);cursor:pointer}',
      '.bmg-bit:hover{border-color:var(--brand)}',
      '.bmg-bit.on{background:var(--brand-soft-strong);border-color:var(--brand);color:var(--brand-dark)}',
      '.bmg-bit.carry{width:26px;height:22px;font-size:12px}',
      '.bmg-rule{height:2px;background:var(--muted-2);margin:4px 0}',
      '.bmg-model{display:inline-flex;width:26px;height:18px;margin:0 1px;align-items:center;justify-content:center;font:600 12px var(--font-mono);color:var(--muted-2);user-select:none}',
      '.bmg-model.ok{color:var(--good)}.bmg-model.no{color:var(--bad)}',
      '.bmg-hint{display:none;margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--brand-soft);color:var(--brand-dark);font-size:13px;line-height:1.45;user-select:none}',
      '.bmg-hint.show{display:block}',
      '.bmg-tough{display:none;margin-bottom:12px;padding:12px;border-radius:12px;background:var(--bad-soft);border:1px solid var(--bad-line)}',
      '.bmg-tough.show{display:block}',
      '.bmg-tough-head{display:flex;justify-content:space-between;align-items:center;color:var(--bad);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}',
      '.bmg-recipe{display:block;width:100%;margin-top:6px;padding:7px 10px;border-radius:8px;border:1px solid var(--line-strong);background:var(--surface-2);text-align:left;cursor:pointer;color:var(--ink)}',
      '.bmg-recipe.ok{border-color:var(--good-line)}',
      '.bmg-recipe code{font-size:13px}',
      '.bmg-recipe small{display:block;margin-top:2px;color:var(--muted);font-size:12px}',
      '.bmg-recipe.ok small{color:var(--good)}',
      '.bmg-x{border:0;background:transparent;color:var(--muted);font-size:16px;cursor:pointer;padding:2px 6px;border-radius:6px}',
      '.bmg-x:hover{background:var(--surface-3);color:var(--ink)}',
      '.bmg-msg{font-size:13px;color:var(--bad)}',
      '.bmg-overlay{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--scrim)}',
      '.bmg-modal{width:100%;max-height:86vh;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line-strong);border-radius:20px;box-shadow:var(--shadow-3)}',
      '.bmg-modal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line)}',
      '.bmg-modal-head b{font:700 18px var(--font-display)}',
      '.bmg-modal-head span{margin-left:8px;color:var(--muted);font-size:13px}',
      '.bmg-modal-body{padding:14px 18px;overflow-y:auto}',
      '.bmg-journal{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}',
      '.bmg-jcard{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)}',
      '.bmg-shoprow{display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:6px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line)}',
      '.bmg-tile{width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:7px;font-weight:800;color:#0a0f1a}',
      '.bmg-reset.armed{border-color:var(--bad-line);color:var(--bad);background:var(--bad-soft)}'
    ].join('');
    document.head.appendChild(s);
  }

  var LOCK_SVG = '<svg class="lock" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="4.5" width="7" height="5" rx="1" fill="currentColor"/><path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

  function itemHTML(v, count, drag) {
    return '<div class="bmg-item"' + (drag ? ' draggable="true"' : '') + ' data-val="' + v + '" ' +
      'title="' + esc(elementName(v)) + ': ' + binStr(v) + '" style="background:' + elementColor(v) + '">' +
      '<span class="bmg-sym">' + esc(elementSymbol(v)) + '</span>' +
      ((count && count > 1) ? '<span class="bmg-count">' + count + '</span>' : '') +
    '</div>';
  }

  // ---- Crafting slots ----
  function slotClick(which) {
    var cur = (which === 'A') ? g.slotA : g.slotB;
    if (cur) { if (which === 'A') g.slotA = null; else g.slotB = null; }
    else if (g.selected && have(g.selected)) { if (which === 'A') g.slotA = g.selected; else g.slotB = g.selected; }
    g.craftGuess = null; g.craftCarry = null; renderCraft();
  }
  function slotDrop(which, val) {
    if (val == null || !have(val)) return;
    if (which === 'A') g.slotA = val; else g.slotB = val;
    g.craftGuess = null; g.craftCarry = null; renderCraft();
  }

  // ---- The mine ----
  function renderGrid() {
    var wrap = G('bmg-grid'); if (!wrap) return;
    var html = '';
    for (var sy = 0; sy < SKY_ROWS; sy++) {
      for (var sx = 0; sx < COLS; sx++) {
        var skey = sx + ',s' + sy;
        var pv = g.placed[skey];
        html += pv
          ? '<div class="bmg-cell built" data-kind="placed" data-key="' + skey + '" title="' + esc(elementName(pv)) + ': click to pick up" style="background:' + elementColor(pv) + '"><span class="sym">' + esc(elementSymbol(pv)) + '</span></div>'
          : '<div class="bmg-cell sky" data-kind="sky" data-key="' + skey + '" title="Right-click to build with your selected element"></div>';
      }
    }
    for (var y = 0; y < g.depth; y++) {
      for (var x = 0; x < COLS; x++) {
        var key = x + ',' + y;
        if (g.mined[key]) { html += '<div class="bmg-cell dug"></div>'; continue; }
        var v = cellValue(x, y);
        var minable = canMine(v);
        html += '<div class="bmg-cell ore' + (minable ? '' : ' locked') + '" data-kind="mine" data-key="' + key + '" title="' + esc(elementName(v)) + (minable ? '' : ': too tough for now') + '" style="background:' + elementColor(v) + '">' +
          '<span class="shade" style="background:rgba(0,0,0,' + Math.min(0.5, y * 0.04) + ')"></span>' +
          '<span class="sym">' + esc(elementSymbol(v)) + '</span>' + (minable ? '' : LOCK_SVG) + '</div>';
      }
    }
    wrap.innerHTML = html;
  }

  // ---- Inventory ----
  function renderInv() {
    var el = G('bmg-inv'); if (!el) return;
    var vals = ownedValues();
    var slots = Math.max(32, Math.ceil(vals.length / 8) * 8);
    var html = '';
    for (var i = 0; i < slots; i++) {
      var v = vals[i];
      html += '<div class="bmg-slot' + (v === g.selected ? ' sel' : '') + '"' + (v != null ? ' data-inv="' + v + '"' : '') + '>' + (v != null ? itemHTML(v, g.inv[v], true) : '') + '</div>';
    }
    el.innerHTML = html;
  }
  function renderSelected() {
    var el = G('bmg-selbar'); if (!el) return;
    var v = g.selected;
    if (!v || !have(v)) {
      el.innerHTML = '<span style="color:var(--muted);font-size:13px">Click an element to select it. Then sell it, or right-click the sky to build with it.</span>';
      return;
    }
    el.innerHTML = '<span class="bmg-swatch" style="background:' + elementColor(v) + '"></span>' +
      '<b>' + esc(elementName(v)) + '</b><code>' + binStr(v) + '</code><span style="color:var(--muted)">&times;' + g.inv[v] + '</span>' +
      '<button id="bmg-sell" class="bc-btn is-tonal" style="margin-left:auto">Sell for ' + v + '</button>';
    G('bmg-sell').onclick = sellSelected;
  }
  function renderStats() {
    var el = G('bmg-stats'); if (!el) return;
    function stat(label, val, title) { return '<span class="bmg-stat"' + (title ? ' title="' + esc(title) + '"' : '') + '>' + label + ' <b>' + val + '</b></span>'; }
    el.innerHTML = stat('Money', g.money) + stat('Depth', g.depth) +
      stat('Best', esc(elementSymbol(g.best)) + ' ' + binStr(g.best), elementName(g.best)) + stat('Found', discoveredCount());
  }

  // ---- Mining, and what to do when a block is too tough ----
  function tryMine(key) {
    if (g.mined[key]) return;
    var parts = key.split(','), v = cellValue(+parts[0], +parts[1]);
    if (!canMine(v)) { showTough(v); return; }
    g.mined[key] = true;
    gainElement(v, 1);
    if (!have(g.selected)) g.selected = v;
    toast('+ ' + elementName(v) + ' (' + binStr(v) + ')');
    renderGrid(); renderInv(); renderSelected(); renderStats();
    clearTough();
    save();
  }
  function recipePairs(v) {
    var pairs = [];
    for (var a = 1; a <= Math.floor(v / 2); a++) {
      var b = v - a;
      if (g.discovered[a] && g.discovered[b]) pairs.push([a, b]);
    }
    function craftable(p) { return (p[0] === p[1]) ? (g.inv[p[0]] || 0) >= 2 : have(p[0]) && have(p[1]); }
    pairs.sort(function (p, q) {
      var pc = craftable(p) ? 0 : 1, qc = craftable(q) ? 0 : 1;
      if (pc !== qc) return pc - qc;
      return (q[0] * q[1]) - (p[0] * p[1]);
    });
    return { pairs: pairs, craftable: craftable };
  }
  function showTough(v) {
    var el = G('bmg-tough'); if (!el) return;
    var rp = recipePairs(v);
    var list = rp.pairs.slice(0, 5).map(function (p) {
      var ok = rp.craftable(p);
      return '<button class="bmg-recipe' + (ok ? ' ok' : '') + '" data-a="' + p[0] + '" data-b="' + p[1] + '">' +
        '<code>' + binStr(p[0]) + ' + ' + binStr(p[1]) + '</code>' +
        '<small>' + esc(pickaxeName(p[0], p[1])) + (ok ? ': you have both' : ': you need ' + esc(elementName(have(p[0]) ? p[1] : p[0]))) + '</small></button>';
    }).join('') || '<div style="margin-top:6px;color:var(--muted);font-size:13px">No known recipes yet. Mine softer blocks to discover more elements.</div>';
    el.innerHTML = '<div class="bmg-tough-head"><span>Too tough to mine</span><button class="bmg-x" id="bmg-tough-x" aria-label="Close">&times;</button></div>' +
      '<div style="margin:6px 0 2px;font-size:14px;color:var(--ink-soft)">You need a stronger pickaxe. Combine two elements to make <b>' + esc(elementName(v)) + '</b>, then mine it:</div>' + list +
      '<div style="margin-top:8px;color:var(--muted);font-size:12px">Pick a recipe, then work out the binary sum yourself in the crafting table.</div>';
    el.classList.add('show');
    G('bmg-tough-x').onclick = clearTough;
    Array.prototype.forEach.call(el.querySelectorAll('.bmg-recipe'), function (btn) {
      btn.onclick = function () {
        g.slotA = +btn.dataset.a; g.slotB = +btn.dataset.b; g.craftGuess = null; g.craftCarry = null;
        renderCraft();
        var sa = G('bmg-slotA'); if (sa) sa.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    });
  }
  function clearTough() { var el = G('bmg-tough'); if (el) { el.classList.remove('show'); el.innerHTML = ''; } }

  // ---- Selling, buying back, digging, building ----
  function buybackCost(v) { return v * 2; }
  function sellSelected() {
    var v = g.selected;
    if (!have(v)) return;
    g.inv[v]--; if (g.inv[v] <= 0) delete g.inv[v];
    g.money += v;
    g.shop[v] = (g.shop[v] || 0) + 1;
    toast('Sold ' + elementName(v) + ' for ' + v, 'warn');
    if (!have(v)) g.selected = bestOwned() || 1;
    renderInv(); renderSelected(); renderStats(); renderGrid(); renderDig();
    save();
    checkGameOver();
  }
  function buyBack(v) {
    var cost = buybackCost(v);
    if (!(g.shop[v] > 0) || g.money < cost) return false;
    g.money -= cost;
    g.shop[v]--; if (g.shop[v] <= 0) delete g.shop[v];
    gainElement(v, 1);
    g.selected = v;
    toast('Bought back ' + elementName(v) + ' for ' + cost);
    renderInv(); renderSelected(); renderStats(); renderGrid(); renderDig();
    save();
    return true;
  }
  function renderDig() {
    var b = G('bmg-dig'); if (!b) return;
    var cost = digCost(g.depth);
    b.textContent = 'Dig deeper: ' + cost + ' money';
    b.disabled = g.money < cost;
    b.title = g.money >= cost ? 'Unlock the next, richer layer of ore' : 'Sell elements to afford ' + cost;
  }
  function digDeeper() {
    var cost = digCost(g.depth);
    if (g.money < cost) return;
    g.money -= cost;
    g.depth += 1;
    toast('Layer ' + g.depth + ' unlocked.');
    renderGrid(); renderStats(); renderDig();
    var grid = G('bmg-grid'); if (grid) grid.scrollTop = grid.scrollHeight;
    save();
    checkGameOver();
  }
  function placeAt(key) {
    var v = g.selected;
    if (!have(v)) { toast('Select an element to build with first', 'bad'); return; }
    g.placed[key] = v;
    g.inv[v]--; if (g.inv[v] <= 0) delete g.inv[v];
    if (!have(v)) g.selected = bestOwned() || g.selected;
    renderGrid(); renderInv(); renderSelected();
    save();
    checkGameOver();
  }
  function pickUp(key) {
    var v = g.placed[key]; if (!v) return;
    delete g.placed[key];
    gainElement(v, 1);
    renderGrid(); renderInv(); renderSelected();
    save();
  }

  // ---- The crafting table: binary addition ----
  function additionRows(a, b) {
    // One spare column for a carry out, so the width never gives away whether there is one.
    var width = Math.max(bits(a), bits(b)) + 1;
    return { sum: a + b, width: width, aB: a.toString(2).padStart(width, '0'), bB: b.toString(2).padStart(width, '0') };
  }
  // The carry into each column (index 0 is the leftmost), worked right to left.
  function carriesFor(r) {
    var out = new Array(r.width).fill(0), carry = 0;
    for (var i = r.width - 1; i >= 0; i--) {
      out[i] = carry;
      var s = (+r.aB[i]) + (+r.bB[i]) + carry;
      carry = s >= 2 ? 1 : 0;
    }
    return out;
  }
  function renderCraft() {
    var slotA = G('bmg-slotA'), slotB = G('bmg-slotB'), out = G('bmg-slotOut');
    var entry = G('bmg-craft-entry');
    if (!slotA) return;
    var a = g.slotA, b = g.slotB;
    slotA.innerHTML = a ? itemHTML(a, 0, false) : '';
    slotB.innerHTML = b ? itemHTML(b, 0, false) : '';
    slotA.classList.toggle('sel', !!a);
    slotB.classList.toggle('sel', !!b);
    G('bmg-binA').textContent = a ? binStr(a) : '';
    G('bmg-binB').textContent = b ? binStr(b) : '';
    var hintEl = G('bmg-add-hint');

    if (!a || !b) {
      out.innerHTML = '';
      entry.innerHTML = '<div style="color:var(--muted);font-size:13px">Drag two elements into the slots (or click a slot to drop your selected one), then add their binary codes.</div>';
      hintEl.classList.remove('show');
      return;
    }
    var canDo = (a === b) ? (g.inv[a] || 0) >= 2 : have(a) && have(b);
    var r = additionRows(a, b), W = r.width;
    if (!g.craftGuess || g.craftGuess.length !== W) g.craftGuess = new Array(W).fill(0);
    if (!g.craftCarry || g.craftCarry.length !== W) g.craftCarry = new Array(W).fill(0);
    out.innerHTML = '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 20px var(--font-mono);color:var(--muted)">?</span>';

    var reveal = supportReveal();
    var sumBits = r.sum.toString(2).padStart(W, '0');
    var carries = carriesFor(r);
    function digitRow(str, sign) {
      var s = '<div class="bmg-row"><span class="bmg-gut">' + sign + '</span>';
      for (var i = 0; i < W; i++) s += '<span class="bmg-dig">' + str[i] + '</span>';
      return s + '</div>';
    }
    // Support: a faded model under the carry row and the answer row, each
    // digit coloured as the student's own matches it or not.
    function modelRow(model, guess) {
      var s = '<div class="bmg-row"><span class="bmg-gut"></span>';
      for (var i = 0; i < W; i++) {
        var cls = guess[i] === +model[i] ? ' ok' : ' no';
        s += '<span class="bmg-model' + cls + '">' + model[i] + '</span>';
      }
      return s + '</div>';
    }
    var carryRow = '<div class="bmg-row"><span class="bmg-gut"></span>';
    for (var c = 0; c < W; c++) carryRow += '<span class="bmg-bit carry' + (g.craftCarry[c] ? ' on' : '') + '" data-carry-i="' + c + '" title="Carry">' + g.craftCarry[c] + '</span>';
    carryRow += '</div>';
    var ansRow = '<div class="bmg-row"><span class="bmg-gut"></span>';
    for (var j = 0; j < W; j++) ansRow += '<span class="bmg-bit' + (g.craftGuess[j] ? ' on' : '') + '" data-answer-i="' + j + '">' + g.craftGuess[j] + '</span>';
    ansRow += '</div>';

    entry.innerHTML =
      '<div style="font-size:13px;color:var(--ink-soft)">Add the two binary numbers, column by column, right to left. Click a box to flip it between 0 and 1.</div>' +
      '<div class="bmg-sum">' +
        (reveal > 0.5 ? modelRow(carries.join(''), g.craftCarry) : '') + carryRow +
        digitRow(r.aB, '') + digitRow(r.bB, '+') +
        '<div class="bmg-rule" style="width:' + (20 + W * 28) + 'px"></div>' +
        ansRow + (reveal > 0.9 ? modelRow(sumBits, g.craftGuess) : '') +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button id="bmg-craftbtn" class="bc-btn"' + (canDo ? '' : ' disabled') + '>Craft</button>' +
        '<button id="bmg-craftclear" class="bc-btn is-text">Clear</button>' +
        '<span id="bmg-craft-msg" class="bmg-msg"></span>' +
      '</div>' +
      (canDo ? '' : '<div class="bmg-msg" style="margin-top:6px">You need both ingredients to craft this.</div>');

    if (reveal > 0.9) hintEl.innerHTML = 'The faded digits are the working: the carry into each column, and the answer. Each answer digit is carry + top + bottom.';
    else if (reveal > 0.5) hintEl.innerHTML = 'The faded row shows the carries. For each column: carry + top + bottom. 0 or 1 write it; 2 write 0 carry 1; 3 write 1 carry 1.';
    else if (reveal > 0.1) hintEl.innerHTML = 'Start at the right. 1 + 1 = 10 in binary: write 0 and carry 1 into the next column.';
    else hintEl.innerHTML = '';
    hintEl.classList.toggle('show', !!hintEl.innerHTML);

    Array.prototype.forEach.call(entry.querySelectorAll('.bmg-bit'), function (cell) {
      cell.onclick = function () {
        if (cell.dataset.carryI != null) { var k = +cell.dataset.carryI; g.craftCarry[k] = g.craftCarry[k] ? 0 : 1; }
        else { var i = +cell.dataset.answerI; g.craftGuess[i] = g.craftGuess[i] ? 0 : 1; }
        renderCraft();
      };
    });
    G('bmg-craftbtn').onclick = function () { doCraft(a, b, r); };
    G('bmg-craftclear').onclick = function () { g.slotA = null; g.slotB = null; g.craftGuess = null; g.craftCarry = null; renderCraft(); };
  }
  function doCraft(a, b, r) {
    var canDo = (a === b) ? (g.inv[a] || 0) >= 2 : have(a) && have(b);
    if (!canDo) return;
    var supported = Support && Support.isOn() && addFader;
    if (parseInt(g.craftGuess.join(''), 2) !== r.sum) {
      if (supported) addFader.wrong();
      var m = G('bmg-craft-msg');
      if (m) m.textContent = 'Not quite. Add column by column from the right, and try again.';
      renderCraftHintOnly();
      return;
    }
    if (supported) addFader.correct();
    g.inv[a]--; if (g.inv[a] <= 0) delete g.inv[a];
    g.inv[b]--; if (g.inv[b] <= 0) delete g.inv[b];
    gainElement(r.sum, 1);
    g.selected = r.sum;
    g.slotA = null; g.slotB = null; g.craftGuess = null; g.craftCarry = null;
    toast('Crafted ' + elementName(r.sum) + '!');
    clearTough();
    renderGrid(); renderInv(); renderSelected(); renderStats(); renderCraft();
    var out = G('bmg-slotOut');
    if (out) { out.innerHTML = itemHTML(r.sum, 0, false); setTimeout(function () { if (g.slotA == null && g.slotB == null) out.innerHTML = ''; }, 800); }
    save();
    checkGameOver();
  }
  // After a wrong craft, redraw with the (possibly stronger) support but keep the message.
  function renderCraftHintOnly() {
    var msg = G('bmg-craft-msg') ? G('bmg-craft-msg').textContent : '';
    renderCraft();
    var m = G('bmg-craft-msg'); if (m) m.textContent = msg;
  }

  // ---- Journal: every element discovered, with its denary value ----
  function openOverlay(id, width, headHtml, bodyHtml) {
    var old = G(id); if (old) old.remove();
    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'bmg-overlay';
    overlay.innerHTML = '<div class="bmg-modal" style="max-width:' + width + 'px" role="dialog" aria-modal="true">' +
      '<div class="bmg-modal-head"><div>' + headHtml + '</div><button class="bc-btn is-outline" data-close>Close</button></div>' +
      '<div class="bmg-modal-body">' + bodyHtml + '</div></div>';
    document.body.appendChild(overlay);
    function close() { overlay.remove(); document.removeEventListener('keydown', onEsc); }
    function onEsc(e) { if (e.key === 'Escape') close(); }
    overlay.querySelector('[data-close]').onclick = close;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onEsc);
    return overlay;
  }
  function openJournal() {
    var vals = Object.keys(g.discovered).map(Number).sort(function (a, b) { return a - b; });
    var realCount = vals.filter(function (v) { return v < REAL_NAMES.length; }).length;
    var cards = vals.map(function (v) {
      var owned = g.inv[v] || 0, real = v < REAL_NAMES.length;
      return '<div class="bmg-jcard"><div style="display:flex;align-items:center;gap:8px">' +
        '<span class="bmg-tile" style="background:' + elementColor(v) + '">' + esc(elementSymbol(v)) + '</span>' +
        '<div style="min-width:0"><div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(elementName(v)) + '</div>' +
        '<div style="font-size:12px;color:' + (real ? 'var(--good)' : '#c58af9') + '">' + (real ? 'Element ' + v : 'Invented') + '</div></div></div>' +
        '<div style="display:flex;justify-content:space-between;font:13px var(--font-mono)"><span style="color:var(--warn)">' + binStr(v) + '</span><span style="color:var(--muted)">= ' + v + '</span></div>' +
        '<div style="font-size:12px;color:var(--muted)">' + (owned ? 'In stock: ' + owned : 'Not in stock') + '</div></div>';
    }).join('');
    openOverlay('bmg-journal', 800, '<b>Element Journal</b><span>' + vals.length + ' discovered: ' + realCount + ' real, ' + (vals.length - realCount) + ' invented</span>',
      '<div class="bmg-journal">' + cards + '</div>');
  }

  // ---- Shop: buy back what you sold, at twice the price ----
  function openShop() {
    function rowsHtml() {
      var vals = Object.keys(g.shop).map(Number).filter(function (v) { return g.shop[v] > 0; }).sort(function (a, b) { return a - b; });
      var rows = vals.map(function (v) {
        var cost = buybackCost(v);
        return '<div class="bmg-shoprow"><span class="bmg-tile" style="background:' + elementColor(v) + '">' + esc(elementSymbol(v)) + '</span>' +
          '<span style="flex:1;min-width:0"><b>' + esc(elementName(v)) + '</b> <code>' + binStr(v) + '</code> <span style="color:var(--muted)">&times;' + g.shop[v] + '</span></span>' +
          '<button class="bc-btn is-tonal bmg-buyback" data-v="' + v + '"' + (g.money >= cost ? '' : ' disabled') + '>Buy back: ' + cost + '</button></div>';
      }).join('');
      return rows || '<div style="color:var(--muted);font-size:14px">You have not sold anything yet. Sell elements you no longer need, then buy them back here if you change your mind.</div>';
    }
    var overlay = openOverlay('bmg-shop', 540, '<b>Shop</b><span>Buy back at twice the sale price. You have ' + g.money + ' money.</span>', rowsHtml());
    function wire() {
      Array.prototype.forEach.call(overlay.querySelectorAll('.bmg-buyback'), function (btn) {
        btn.onclick = function () {
          if (!buyBack(+btn.dataset.v)) return;
          overlay.querySelector('.bmg-modal-body').innerHTML = rowsHtml();
          overlay.querySelector('.bmg-modal-head span').textContent = 'Buy back at twice the sale price. You have ' + g.money + ' money.';
          wire();
        };
      });
    }
    wire();
  }

  // ---- Game over: a real dead end ----
  function totalItemCount() { var n = 0; Object.keys(g.inv).forEach(function (k) { n += g.inv[k]; }); return n; }
  function anyVisibleMineable() {
    for (var y = 0; y < g.depth; y++) for (var x = 0; x < COLS; x++) {
      if (!g.mined[x + ',' + y] && canMine(cellValue(x, y))) return true;
    }
    return false;
  }
  function anyAffordableBuyback() {
    return Object.keys(g.shop).some(function (k) { return g.shop[k] > 0 && buybackCost(+k) <= g.money; });
  }
  function isHardLocked() {
    return !anyVisibleMineable() && totalItemCount() < 2 && g.money < digCost(g.depth) && !anyAffordableBuyback();
  }
  function renderAll() { renderGrid(); renderInv(); renderSelected(); renderStats(); renderCraft(); renderDig(); }
  function doReset() {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    g = freshState();
    renderAll();
    save();
  }
  function checkGameOver() {
    if (!isHardLocked() || G('bmg-gameover')) return;
    var overlay = openOverlay('bmg-gameover', 400, '<b>Out of moves</b>',
      '<p style="margin:0 0 12px;color:var(--ink-soft);font-size:14px;line-height:1.5">There is no ore you can mine, nothing to craft or buy back, and not enough money to dig deeper. Here is how far you got:</p>' +
      '<div style="display:grid;gap:6px;margin-bottom:14px;font-size:14px">' +
        '<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Best element</span><b>' + esc(elementName(g.best)) + ' (' + binStr(g.best) + ')</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Discovered</span><b>' + discoveredCount() + '</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Depth reached</span><b>' + g.depth + '</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Money</span><b>' + g.money + '</b></div>' +
      '</div><button id="bmg-gameover-reset" class="bc-btn">Start again</button>');
    G('bmg-gameover-reset').onclick = function () { overlay.remove(); doReset(); };
  }

  // ---- Mount ----
  window.initBinaryMiningGame = function (containerId) {
    var wrap = G(containerId); if (!wrap) return;
    injectStyle();
    g = freshState();
    load();
    g.selected = have(g.selected) ? g.selected : (bestOwned() || 1);

    var GRIDW = COLS * CELL;
    wrap.innerHTML =
      '<div class="bmg-wrap">' +
        '<div class="bmg-card bmg-top">' +
          '<div id="bmg-stats" style="display:flex;gap:8px;flex-wrap:wrap"></div>' +
          '<span id="bmg-toast" class="bmg-toast" aria-live="polite"></span>' +
          '<div class="bmg-actions"><span id="bmg-support"></span>' +
            '<button id="bmg-shop-btn" class="bc-btn is-outline">Shop</button>' +
            '<button id="bmg-journal-btn" class="bc-btn is-outline">Journal</button>' +
          '</div>' +
        '</div>' +
        '<div class="bmg-cols">' +
          '<div class="bmg-card" style="flex:0 0 auto">' +
            '<h2 class="bmg-h">The Mine</h2>' +
            '<div id="bmg-grid" class="bmg-grid" style="grid-template-columns:repeat(' + COLS + ',' + CELL + 'px);grid-auto-rows:' + CELL + 'px;max-height:' + (MAX_VIS_ROWS * CELL) + 'px"></div>' +
            '<button id="bmg-dig" class="bc-btn" style="width:' + GRIDW + 'px;margin-top:10px;min-height:40px"></button>' +
            '<div class="bmg-note" style="max-width:' + GRIDW + 'px">Click ore to <b>mine</b> it. Right-click the sky to <b>build</b>. <b>Dig deeper</b> for richer ore.</div>' +
          '</div>' +
          '<div class="bmg-card" style="flex:1;min-width:340px;max-width:520px">' +
            '<div id="bmg-tough" class="bmg-tough" aria-live="polite"></div>' +
            '<h2 class="bmg-h">Crafting</h2>' +
            '<div class="bmg-craft">' +
              '<div style="display:flex;flex-direction:column;gap:4px">' +
                '<div style="display:flex;align-items:center;gap:8px"><div class="bmg-slot" id="bmg-slotA" title="First element"></div><span id="bmg-binA" class="bmg-bin"></span></div>' +
                '<div style="color:var(--muted);font-weight:700;padding-left:16px;line-height:.8">+</div>' +
                '<div style="display:flex;align-items:center;gap:8px"><div class="bmg-slot" id="bmg-slotB" title="Second element"></div><span id="bmg-binB" class="bmg-bin"></span></div>' +
              '</div>' +
              '<div class="bmg-arrow" aria-hidden="true">&#10142;</div>' +
              '<div class="bmg-slot" id="bmg-slotOut" title="Result"></div>' +
            '</div>' +
            '<div id="bmg-craft-entry" style="margin-top:10px"></div>' +
            '<div id="bmg-add-hint" class="bmg-hint" aria-live="polite"></div>' +
            '<h2 class="bmg-h" style="margin-top:18px">Inventory</h2>' +
            '<div id="bmg-inv" class="bmg-inv"></div>' +
            '<div id="bmg-selbar" class="bmg-selbar"></div>' +
            '<div style="text-align:right;margin-top:10px"><button id="bmg-reset" class="bc-btn is-outline bmg-reset">Reset mine</button></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var grid = G('bmg-grid');
    grid.addEventListener('click', function (e) {
      var cell = e.target.closest('.bmg-cell'); if (!cell) return;
      if (cell.dataset.kind === 'mine') tryMine(cell.dataset.key);
      else if (cell.dataset.kind === 'placed') pickUp(cell.dataset.key);
    });
    grid.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var cell = e.target.closest('.bmg-cell');
      if (cell && cell.dataset.kind === 'sky') placeAt(cell.dataset.key);
    });
    var inv = G('bmg-inv');
    inv.addEventListener('click', function (e) {
      var s = e.target.closest('.bmg-slot[data-inv]'); if (!s) return;
      g.selected = +s.dataset.inv;
      renderInv(); renderSelected();
    });
    inv.addEventListener('dragstart', function (e) {
      var it = e.target.closest('.bmg-item'); if (!it) return;
      g.dragVal = +it.dataset.val;
      try { e.dataTransfer.setData('text/plain', it.dataset.val); e.dataTransfer.effectAllowed = 'copy'; } catch (_e) {}
    });
    [['A', G('bmg-slotA')], ['B', G('bmg-slotB')]].forEach(function (p) {
      var which = p[0], slot = p[1];
      slot.addEventListener('dragover', function (e) { e.preventDefault(); slot.classList.add('bmg-drop'); });
      slot.addEventListener('dragleave', function () { slot.classList.remove('bmg-drop'); });
      slot.addEventListener('drop', function (e) {
        e.preventDefault(); slot.classList.remove('bmg-drop');
        slotDrop(which, g.dragVal != null ? g.dragVal : parseInt(e.dataTransfer.getData('text/plain'), 10));
        g.dragVal = null;
      });
      slot.addEventListener('click', function () { slotClick(which); });
    });
    G('bmg-dig').onclick = digDeeper;
    G('bmg-journal-btn').onclick = openJournal;
    G('bmg-shop-btn').onclick = openShop;
    // Two clicks to reset: a browser confirm() is blocked inside the site's frames.
    var resetBtn = G('bmg-reset'), resetTimer = null;
    resetBtn.onclick = function () {
      if (!g.resetArmed) {
        g.resetArmed = true;
        resetBtn.classList.add('armed');
        resetBtn.textContent = 'Click again to reset everything';
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { g.resetArmed = false; resetBtn.classList.remove('armed'); resetBtn.textContent = 'Reset mine'; }, 3000);
        return;
      }
      clearTimeout(resetTimer);
      doReset();
      var btn = G('bmg-reset'); btn.classList.remove('armed'); btn.textContent = 'Reset mine';
    };
    if (Support) {
      Support.mountToggle(G('bmg-support'), 'Support');
      Support.onChange(function () { renderCraft(); });
    }
    renderAll();
    checkGameOver();
    if (window.__markStepComplete) { try { window.__markStepComplete(); } catch (e) {} }
  };
})();
