// Exam Game client: exam questions and AI marking for any embedded game (first used by TowerDefence/).
// The game never sees answers or mark schemes: every call goes to the shell by postMessage
// (BC_EXAM_GAME_REQUEST -> BC_EXAM_GAME_RESULT), which runs ExamGame.gs as the signed-in student.
//   ExamGame.sets()                           -> Promise [{ setId, title, count }]
//   ExamGame.next(setId, { count, maxMarks }) -> Promise [{ qid, text, marks }]
//   ExamGame.submit(qid, answer, attempt)     -> Promise { marks, max, feedback, canRetry, attempt, full }
// Stub mode (no shell): ?examStub=1, ExamGame.useStub(true), or automatically when the page is not in a frame.
// Three practice questions, marked by checking the final number only.
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var stub = params.get('examStub') === '1' || window.parent === window;
  var pending = {}, seq = 0;

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'BC_EXAM_GAME_RESULT' || e.source !== window.parent || !pending[d.reqId]) return;
    var p = pending[d.reqId];
    delete pending[d.reqId];
    clearTimeout(p.timer);
    if (d.ok) p.resolve(d.result); else p.reject(new Error(d.error || 'Something went wrong.'));
  });

  function request(op, payload) {
    if (stub) return Promise.resolve().then(function () { return STUB[op](payload || {}); });
    return new Promise(function (resolve, reject) {
      var reqId = 'eg' + (++seq) + '-' + Date.now();
      pending[reqId] = { resolve: resolve, reject: reject, timer: setTimeout(function () {
        delete pending[reqId];
        reject(new Error('No answer from the site. Check you are signed in, then try again.'));
      }, op === 'submit' ? 45000 : 20000) };
      try { window.parent.postMessage({ type: 'BC_EXAM_GAME_REQUEST', reqId: reqId, op: op, payload: payload || {} }, '*'); }
      catch (err) { delete pending[reqId]; reject(err); }
    });
  }

  // ---------------------------------------------------------------- stub (local testing only)
  var STUB_QS = [
    { qid: 'stub-1', marks: 2, text: 'Practice question\nGive the two\'s complement 8-bit binary integer for the denary number -6.\nShow all your working.', bin: '11111010' },
    { qid: 'stub-2', marks: 2, text: 'Practice question\nConvert the two\'s complement 8-bit binary integer 11110000 to denary.\nShow all your working.', den: -16 },
    { qid: 'stub-3', marks: 1, text: 'Practice question\nGive the two\'s complement 8-bit binary integer for the denary number 9.', bin: '00001001' }
  ];
  var stubOpen = {}, stubTurn = 0;
  function lastBits(t) { var m = String(t).replace(/([01]{4})\s([01]{4})/g, '$1$2').match(/[01]{8}/g); return m ? m[m.length - 1] : ''; }
  function lastInt(t) { var m = String(t).replace(/−/g, '-').match(/-?\d+/g); return m ? Number(m[m.length - 1]) : NaN; }
  var STUB = {
    sets: function () { return [{ setId: 'twos-complement', title: 'Two\'s Complement (practice)', count: STUB_QS.length }]; },
    next: function (p) {
      var n = Math.max(1, Math.min(10, Number(p.count) || 1)), out = [];
      var pool = STUB_QS.filter(function (q) { return q.marks <= (Number(p.maxMarks) || 99); });
      if (!pool.length) pool = STUB_QS;
      for (var i = 0; i < n; i++) { var q = pool[stubTurn++ % pool.length]; out.push({ qid: q.qid, text: q.text, marks: q.marks }); }
      return out;
    },
    submit: function (p) {
      var q = STUB_QS.filter(function (x) { return x.qid === p.qid; })[0];
      if (!q) throw new Error('That question does not exist.');
      var attempt = Number(p.attempt) === 2 ? 2 : 1;
      if (attempt === 2 && !stubOpen[q.qid]) throw new Error('There is no second try on this question.');
      var right = q.bin ? lastBits(p.answer) === q.bin : lastInt(p.answer) === q.den;
      var work = /\+|flip|add\s*1/i.test(String(p.answer));
      var marks = right ? (q.marks === 2 && !work ? 1 : q.marks) : (q.marks === 2 && work ? 1 : 0);
      var full = marks >= q.marks, canRetry = attempt === 1 && !full;
      if (canRetry) stubOpen[q.qid] = 1; else delete stubOpen[q.qid];
      return { marks: marks, max: q.marks, attempt: attempt, full: full, canRetry: canRetry,
        feedback: full ? 'Correct. Full marks. (practice marking)' : 'You earned ' + marks + ' of ' + q.marks + '. Show your working (flip and add 1, or the place values with -128) and give the final answer. (practice marking)' + (canRetry ? ' Try again: a second try earns half.' : '') };
    }
  };

  window.ExamGame = {
    sets: function () { return request('sets'); },
    next: function (setId, opts) {
      opts = opts || {};
      return request('next', { setId: String(setId || ''), count: opts.count, maxMarks: opts.maxMarks });
    },
    submit: function (qid, answer, attempt) {
      return request('submit', { qid: String(qid || ''), answer: String(answer == null ? '' : answer), attempt: attempt === 2 ? 2 : 1 });
    },
    useStub: function (on) { stub = on !== false; },
    isStub: function () { return stub; }
  };
})();
