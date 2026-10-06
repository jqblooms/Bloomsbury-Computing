// Slide keys, passed from an app on a lesson slide up to the site.
// An app inside a slide has its own document, so while it has focus (drills and
// apps focus their own answer box as they load) the site never sees the keys.
// This sends them to the site as BC_NAV_KEY; the site decides what each does
// (js/pages.html). Does nothing when the app is opened on its own.
// - PageUp and PageDown (the classroom clicker) always go to the site.
// - ArrowLeft and ArrowRight go to the site too, unless the student is typing
//   (a text box, a list, a slider) or the app used the key itself. Apps that
//   play with the arrow keys (the Scratch editor, FlowScratch, Bug Hunt,
//   Pseudocode Farmer) keep them.
// - Tab is left to the app (it moves between controls).
(function () {
  'use strict';
  if (window.parent === window) return;
  function send(e) {
    try { window.parent.postMessage({ type: 'BC_NAV_KEY', key: e.key, shiftKey: e.shiftKey }, '*'); } catch (err) {}
  }
  window.addEventListener('keydown', function (e) {
    if ((e.key !== 'PageUp' && e.key !== 'PageDown') || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    send(e);
  }, true);

  var keepsArrows = /\/(scratch|FlowScratch|BugHunt|PseudocodeFarmer)\//i.test(location.pathname);
  if (keepsArrows) return;
  function typing(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return true;
    if (tag === 'INPUT') return !/^(button|submit|reset|checkbox|image|file|color)$/i.test(el.type || 'text');
    var role = el.getAttribute('role');
    return role === 'slider' || role === 'listbox' || role === 'textbox' || role === 'spinbutton';
  }
  // Listened for last (bubble phase on the window), so an app that handles the
  // arrows itself has already called preventDefault and keeps them.
  window.addEventListener('keydown', function (e) {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.defaultPrevented || typing(e.target)) return;
    e.preventDefault();
    send(e);
  });
})();
