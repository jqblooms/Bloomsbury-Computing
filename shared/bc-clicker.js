// Classroom clicker keys, passed from an app on a lesson slide up to the site.
// An app inside a slide has its own document, so while it has focus (drills and
// apps focus their own answer box as they load) the site never sees the
// clicker's keys. This sends PageUp, PageDown and Tab to the site as
// BC_NAV_KEY; the site decides what each does (js/pages.html). PageUp and
// PageDown are only for slides here, so the app ignores them; Tab still moves
// between the app's own controls. Does nothing when the app is opened on its own.
(function () {
  'use strict';
  if (window.parent === window) return;
  var KEYS = { PageUp: true, PageDown: true, Tab: true };
  window.addEventListener('keydown', function (e) {
    if (!KEYS[e.key] || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== 'Tab') e.preventDefault();
    try { window.parent.postMessage({ type: 'BC_NAV_KEY', key: e.key, shiftKey: e.shiftKey }, '*'); } catch (err) {}
  }, true);
})();
