// Haiku second check for typed drill answers (drills with aiFallback: true in their register options).
// The keyword check marks first. A keyword pass is final. A keyword fail asks the shell (op drillCheck,
// ExamGame.gs / DrillCheck.gs) whether an examiner would still give the mark; only a "no" from Haiku is
// wrong. No answer within TIMEOUT_MS, no shell, not signed in or any error keeps the keyword result.
//   DrillAiCheck.decide(keywordRight, enabled, ask) -> Promise<boolean>   (ask: () => Promise<boolean>)
//   DrillAiCheck.ask(payload)                       -> Promise<boolean>   (true only for a Haiku "correct")
(function (root) {
  'use strict';
  var TIMEOUT_MS = 15000;
  var seq = 0;
  var cut = function (s, n) { return String(s == null ? '' : s).slice(0, n); };

  function decide(keywordRight, enabled, ask) {
    if (keywordRight || !enabled || typeof ask !== 'function') return Promise.resolve(!!keywordRight);
    var p;
    try { p = ask(); } catch (e) { return Promise.resolve(false); }
    return Promise.resolve(p).then(function (v) { return v === true; }, function () { return false; });
  }

  function ask(payload) {
    return new Promise(function (resolve) {
      var w = root.window || root;
      if (!w.parent || w.parent === w) { resolve(false); return; }
      var reqId = 'dc' + (++seq) + '-' + Date.now(), done = false, timer = null;
      function finish(v) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        w.removeEventListener('message', onMsg);
        resolve(v);
      }
      function onMsg(e) {
        var d = e.data;
        if (!d || d.type !== 'BC_EXAM_GAME_RESULT' || d.reqId !== reqId || e.source !== w.parent) return;
        finish(!!(d.ok && d.result && d.result.correct === true));
      }
      w.addEventListener('message', onMsg);
      timer = setTimeout(function () { finish(false); }, TIMEOUT_MS);
      var p = payload || {};
      var body = {
        drillId: cut(p.drillId, 80), cardId: cut(p.cardId, 80), prompt: cut(p.prompt, 1500),
        answers: (Array.isArray(p.answers) ? p.answers : []).slice(0, 6).map(function (a) { return cut(a, 150); }),
        note: cut(p.note, 600), hint: cut(p.hint, 200), answer: cut(p.answer, 500)
      };
      try { w.parent.postMessage({ type: 'BC_EXAM_GAME_REQUEST', reqId: reqId, op: 'drillCheck', payload: body }, '*'); }
      catch (err) { finish(false); }
    });
  }

  root.DrillAiCheck = { decide: decide, ask: ask, TIMEOUT_MS: TIMEOUT_MS };
})(typeof window !== 'undefined' ? window : globalThis);
