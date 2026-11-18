// Data Bridge teacher mode: the Shift + D, E, V unlock, the teacher check, and the guard that keeps teacher play
// out of the student's save and the lesson slide. No DOM work here, so tools/test_bridge_teacher.mjs runs it in node.
(function (root) {
  'use strict';
  var SEQ = ['d', 'e', 'v'], WINDOW_MS = 2000;

  // Answer boxes, inputs and editable text: typing there never counts towards the unlock.
  function isTextTarget(t) {
    if (!t) return false;
    var tag = String(t.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') return !/^(button|submit|reset|checkbox|radio|range|color|file|image)$/i.test(String(t.type || 'text'));
    if (t.isContentEditable) return true;
    try { if (t.closest && t.closest('[contenteditable], .bc-answer-box')) return true; } catch (e) {}
    return false;
  }

  // Calls onMatch when Shift is held and D, E, V are typed in order within ms (2 s). Feed it keydown events.
  // It never calls preventDefault, so PageUp and PageDown (the classroom clicker) and all other keys pass through.
  function makeDetector(onMatch, ms) {
    var i = 0, t0 = 0;
    ms = ms || WINDOW_MS;
    return function (e, now) {
      if (!e || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Shift') return false;
      if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || isTextTarget(e.target)) { i = 0; return false; }
      now = now == null ? Date.now() : now;
      var k = String(e.key || '').toLowerCase();
      if (i > 0 && now - t0 > ms) i = 0;
      if (k === SEQ[i]) { if (i === 0) t0 = now; i++; }
      else if (k === SEQ[0]) { i = 1; t0 = now; }
      else i = 0;
      if (i === SEQ.length) { i = 0; onMatch(); return true; }
      return false;
    };
  }

  // Resolves true for a teacher. Standalone (opened outside the site, or the practice stub where nothing is recorded)
  // is always allowed; embedded asks the shell (Exam Game op whoami). Any error or a missing answer is a no.
  function gate(opts) {
    if (opts && opts.standalone) return Promise.resolve(true);
    return Promise.resolve().then(function () { return opts.ask(); })
      .then(function (r) { return !!(r && r.teacher === true); }, function () { return false; });
  }

  // Asks the shell who is signed in, through the same relay as the Exam Game client.
  function askWhoami(win, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var reqId = 'bbtm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      var timer = setTimeout(function () { win.removeEventListener('message', on); reject(new Error('timeout')); }, timeoutMs || 15000);
      function on(e) {
        var d = e.data;
        if (!d || d.type !== 'BC_EXAM_GAME_RESULT' || d.reqId !== reqId || e.source !== win.parent) return;
        clearTimeout(timer); win.removeEventListener('message', on);
        if (d.ok) resolve(d.result); else reject(new Error(d.error || 'no'));
      }
      win.addEventListener('message', on);
      try { win.parent.postMessage({ type: 'BC_EXAM_GAME_REQUEST', reqId: reqId, op: 'whoami', payload: {} }, '*'); }
      catch (err) { clearTimeout(timer); win.removeEventListener('message', on); reject(err); }
    });
  }

  // Progress writes (the saved game, best, done) and the lesson result go through this. While teacher mode is on
  // they are dropped, so teacher play never changes the student's save or completes a slide.
  function makeGuard(real) {
    var on = false;
    return {
      on: function () { return on; },
      set: function (v) { on = !!v; },
      store: function (k, v) { if (!on) real.store(k, v); },
      post: function (msg) { if (!on) real.post(msg); }
    };
  }

  root.BBTeacher = { makeDetector: makeDetector, isTextTarget: isTextTarget, gate: gate, askWhoami: askWhoami, makeGuard: makeGuard, WINDOW_MS: WINDOW_MS };
})(typeof window !== 'undefined' ? window : globalThis);
