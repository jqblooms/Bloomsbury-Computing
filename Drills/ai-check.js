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

  // One request to the shell through the Exam Game relay: resolves with the op's result, rejects with a message.
  function request(op, payload, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var w = root.window || root;
      if (!w.parent || w.parent === w) { reject(new Error('Open this drill from the site to ask for help.')); return; }
      var reqId = 'dh' + (++seq) + '-' + Date.now(), done = false, timer = null;
      function finish(err, v) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        w.removeEventListener('message', onMsg);
        if (err) reject(err); else resolve(v);
      }
      function onMsg(e) {
        var d = e.data;
        if (!d || d.type !== 'BC_EXAM_GAME_RESULT' || d.reqId !== reqId || e.source !== w.parent) return;
        if (d.ok) finish(null, d.result);
        else finish(new Error(String(d.error || 'Help is busy. Try again in a minute.')));
      }
      w.addEventListener('message', onMsg);
      timer = setTimeout(function () { finish(new Error('Help is busy. Try again in a minute.')); }, timeoutMs || 20000);
      try { w.parent.postMessage({ type: 'BC_EXAM_GAME_REQUEST', reqId: reqId, op: op, payload: payload }, '*'); }
      catch (err) { finish(new Error('Help is busy. Try again in a minute.')); }
    });
  }

  // The api shared/exam-help.js uses for a drill card ("I need help", aiHelp: true). ctx(qid) gives the card:
  // { cardId, prompt, answers, note, hint }. Answers, note and hint go to the shell only for its reveal check.
  // The relay drops a request over 5000 characters of JSON, so the parts are cut to fit.
  function helpApi(drillId, ctx) {
    return {
      helpGet: function (qid) {
        var c = ctx(qid) || {};
        return request('drillHelpGet', { drillId: cut(drillId, 80), cardId: cut(c.cardId, 80) }, 20000);
      },
      help: function (qid, question, answer) {
        var c = ctx(qid) || {};
        var body = {
          drillId: cut(drillId, 80), cardId: cut(c.cardId, 80), prompt: cut(c.prompt, 1500),
          answers: (Array.isArray(c.answers) ? c.answers : []).slice(0, 6).map(function (a) { return cut(a, 150); }),
          note: cut(c.note, 900), hint: cut(c.hint, 200), question: cut(question, 300), answer: cut(answer, 300)
        };
        while (JSON.stringify(body).length > 4800 && body.note.length) body.note = body.note.slice(0, Math.max(0, body.note.length - 200));
        return request('drillHelp', body, 60000);
      }
    };
  }

  root.DrillAiCheck = { decide: decide, ask: ask, request: request, helpApi: helpApi, TIMEOUT_MS: TIMEOUT_MS };
})(typeof window !== 'undefined' ? window : globalThis);
