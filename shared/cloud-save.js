// Keeps an app's progress on the student's account, through the Bloomsbury
// Computing site, so it follows them to any computer. The app keeps using
// its own browser storage exactly as before; this file mirrors the chosen
// storage keys. Load it BEFORE the app's own scripts:
//
//   <script>window.BC_CLOUD_SAVE = {
//     app: 'hexmachine',                        // must be in APP_SAVE_APPS (Progress.gs)
//     keys: ['pylearn_hex_machine_v1'],         // exact storage keys, and/or
//     patterns: ['^binaryGame_scores_lvl\\d+$'], // regular expressions
//     merge: [['_scores_lvl', 'topScores']]     // optional: [key fragment, rule]
//   };</script>
//   <script src="../shared/cloud-save.js"></script>
//
// When the page opens inside the site it asks for the account's copy. Where
// the account's copy is newer than this browser's (or this browser had
// nothing before the page opened), it's written into storage and the page
// reloads once so the app starts from it; keys with a merge rule are
// combined instead. After that, changes are noticed every few seconds and
// sent to the site. Opened on its own, or signed out, it does nothing.
(function () {
  "use strict";
  var cfg = window.BC_CLOUD_SAVE;
  if (!cfg || !cfg.app || window.parent === window) return;

  var META_KEY = "bc_cloud_meta:" + cfg.app;
  var RELOAD_FLAG = "bc_cloud_restored:" + cfg.app;
  var POLL_MS = 4000;
  var keys = cfg.keys || [];
  var patterns = (cfg.patterns || []).map(function (p) { return new RegExp(p); });
  var mergeRules = cfg.merge || [];

  function tracked(key) {
    return keys.indexOf(key) !== -1 || patterns.some(function (re) { return re.test(key); });
  }
  function readState() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (tracked(k)) out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }
  function readMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function writeMeta(savedAt) { try { localStorage.setItem(META_KEY, JSON.stringify({ savedAt: savedAt })); } catch (e) {} }
  function post(msg) { try { window.parent.postMessage(msg, "*"); } catch (e) {} }
  function parse(s, fallback) { try { var v = JSON.parse(s); return v == null ? fallback : v; } catch (e) { return fallback; } }

  // ---- merge rules: combine two copies of one key instead of picking one ----
  function unionList(a, b) {
    var seen = {}, out = [];
    parse(a, []).concat(parse(b, [])).forEach(function (item) {
      var sig = JSON.stringify(item);
      if (!seen[sig]) { seen[sig] = true; out.push(item); }
    });
    return out;
  }
  var MEDAL_RANK = { gold: 3, silver: 2, bronze: 1 };
  var RULES = {
    // Blitz per-level best scores: both lists, best five.
    topScores: function (a, b) {
      return JSON.stringify(unionList(a, b).sort(function (x, y) { return (y.score || 0) - (x.score || 0); }).slice(0, 5));
    },
    // Blitz exam histories: both lists, latest ten.
    recentExams: function (a, b) {
      return JSON.stringify(unionList(a, b).sort(function (x, y) { return String(x.date || "").localeCompare(String(y.date || "")); }).slice(-10));
    },
    // PyBot medals: per level, the better medal and fewer lines; this
    // browser's code where it has some.
    bestLevels: function (a, b) {
      var local = parse(a, { levels: {} }), cloud = parse(b, { levels: {} });
      var levels = {};
      [cloud.levels || {}, local.levels || {}].forEach(function (src) {
        Object.keys(src).forEach(function (id) {
          var cur = levels[id] || {}, next = src[id] || {};
          var merged = Object.assign({}, cur, next);
          if ((MEDAL_RANK[cur.medal] || 0) > (MEDAL_RANK[next.medal] || 0)) merged.medal = cur.medal;
          if (cur.lines && next.lines) merged.lines = Math.min(cur.lines, next.lines);
          else merged.lines = cur.lines || next.lines;
          if (!next.code && cur.code) merged.code = cur.code;
          levels[id] = merged;
        });
      });
      return JSON.stringify(Object.assign({}, cloud, local, { levels: levels }));
    }
  };
  function ruleFor(key) {
    for (var i = 0; i < mergeRules.length; i++) {
      if (key.indexOf(mergeRules[i][0]) !== -1 && RULES[mergeRules[i][1]]) return RULES[mergeRules[i][1]];
    }
    return null;
  }

  // What this browser held before the app itself ran: an app that writes a
  // default save as it starts must not count as "newer" than the account.
  var initial = readState();
  var hadLocal = Object.keys(initial).length > 0;
  var lastJson = JSON.stringify(initial);
  var checked = false;

  function send(urgent) {
    var state = readState();
    if (Object.keys(state).length) post({ type: "BC_APP_STATE_SAVE", app: cfg.app, state: state, urgent: !!urgent });
  }

  function poll() {
    var json = JSON.stringify(readState());
    if (json === lastJson) return;
    lastJson = json;
    if (!checked) return; // counted once the account's copy has been checked
    writeMeta(Date.now());
    send(false);
  }

  function restore(cloud, cloudAt) {
    var localAt = readMeta().savedAt || 0;
    var cloudNewer = !hadLocal || cloudAt > localAt;
    var changed = false;
    Object.keys(cloud).forEach(function (k) {
      if (!tracked(k) || typeof cloud[k] !== "string") return;
      var localValue = hadLocal ? initial[k] : undefined;
      var rule = ruleFor(k);
      var next;
      if (localValue == null) next = cloud[k];
      else if (rule) next = rule(localValue, cloud[k]);
      else next = cloudNewer ? cloud[k] : localValue;
      if (next !== localStorage.getItem(k)) {
        try { localStorage.setItem(k, next); changed = true; } catch (e) {}
      }
    });
    lastJson = JSON.stringify(readState());
    writeMeta(cloudNewer ? cloudAt : Date.now());
    return changed;
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var data = event.data;
    if (!data || data.type !== "BC_APP_STATE" || data.app !== cfg.app || checked) return;
    checked = true;
    if (!data.signedIn || data.error) return;
    var cloud = data.state && typeof data.state === "object" ? data.state : null;
    var cloudAt = data.savedAt ? Date.parse(data.savedAt) || 0 : 0;
    if (cloud && Object.keys(cloud).length) {
      var changed = restore(cloud, cloudAt);
      // Send the combined copy back so the account has everything too.
      if (hadLocal) send(true);
      if (changed) {
        var already = false;
        try { already = sessionStorage.getItem(RELOAD_FLAG) === "1"; sessionStorage.setItem(RELOAD_FLAG, "1"); } catch (e) {}
        if (!already) location.reload();
      }
    } else if (Object.keys(readState()).length) {
      writeMeta(Date.now());
      send(true);
    }
  });

  post({ type: "BC_APP_STATE_REQUEST", app: cfg.app });
  setInterval(poll, POLL_MS);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { poll(); if (checked) send(true); }
  });
  window.addEventListener("pagehide", function () { poll(); if (checked) send(true); });
})();
