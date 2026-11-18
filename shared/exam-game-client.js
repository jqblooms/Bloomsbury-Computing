// Exam Game client: exam questions and AI marking for any embedded game (first used by TowerDefence/).
// The game never sees answers or mark schemes: every call goes to the shell by postMessage
// (BC_EXAM_GAME_REQUEST -> BC_EXAM_GAME_RESULT), which runs ExamGame.gs as the signed-in student.
//   ExamGame.sets()                           -> Promise [{ setId, title, count }]
//   ExamGame.next(setId, { count, maxMarks }) -> Promise [{ qid, text, marks }]  (picked here from the questions file)
//   ExamGame.warm(setId)                      -> starts the one history read for the set (also warms the relay)
//   ExamGame.submit(qid, answer, attempt, image) -> Promise { marks, max, feedback, canRetry, attempt, full }
//     image: optional pen working, a base64 PNG without the data: prefix ('' for none). AI marking only.
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
  var stubOpen = {}, stubTurn = 0, stubLast = null;
  function lastBits(t) { var m = String(t).replace(/([01]{4})\s([01]{4})/g, '$1$2').match(/[01]{8}/g); return m ? m[m.length - 1] : ''; }
  function lastInt(t) { var m = String(t).replace(/−/g, '-').match(/-?\d+/g); return m ? Number(m[m.length - 1]) : NaN; }
  var STUB = {
    sets: function () { return [{ setId: 'twos-complement', title: 'Two\'s Complement (practice)', count: STUB_QS.length }]; },
    history: function () { return { seen: {}, score: {}, tries: {} }; },
    next: function (p) {
      var n = Math.max(1, Math.min(10, Number(p.count) || 1)), out = [];
      var pool = STUB_QS.filter(function (q) { return q.marks <= (Number(p.maxMarks) || 99); });
      if (!pool.length) pool = STUB_QS;
      for (var i = 0; i < n; i++) { var q = pool[stubTurn++ % pool.length]; out.push({ qid: q.qid, text: q.text, marks: q.marks }); }
      return out;
    },
    submit: function (p) {
      var q = STUB_QS.filter(function (x) { return x.qid === p.qid; })[0];
      // With ?examFile=1 the questions come from the file; the stub cannot mark those, so it gives 0 and says so.
      if (!q) { stubLast = { qid: p.qid, answer: String(p.answer || ''), answerChars: String(p.answer || '').length, imageChars: 0 }; return { marks: 0, max: 1, attempt: Number(p.attempt) === 2 ? 2 : 1, full: false, canRetry: Number(p.attempt) !== 2, feedback: 'Practice marking only marks the three practice questions.' }; }
      stubLast = { qid: p.qid, answerChars: String(p.answer || '').length, imageChars: p.image ? String(p.image).length : 0 };
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

  // ---------------------------------------------------------------- questions from the file, rounds picked here
  // shared/exam-game-questions.json (built by tools/build_exam_game_questions.mjs: qid, text and marks only) gives the
  // sets and texts at once, so a round needs no server call. The student's history comes ONCE per set from the server
  // ('history'), with a copy kept in localStorage per set as the fallback; each submit result updates it. The pick
  // follows the server's rules (examGameNext_ in ExamGame.gs): no repeats until the pool is used up, then weakest first.
  var QFILE_G = '66c66727';
  var base = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, '') : '../shared/';
  })();
  var useFile = !stub || params.get('examFile') === '1';
  var filePromise = null, hist = {}, histPromise = {}, histAt = {};

  function loadFile() {
    if (!filePromise) {
      var url = base + 'exam-game-questions.json?v=' + encodeURIComponent(params.get('bcv') || '') + '&g=' + QFILE_G;
      filePromise = fetch(url, { cache: 'default' }).then(function (r) {
        if (!r.ok) throw new Error('questions file ' + r.status);
        return r.json();
      }).then(function (d) {
        if (!d || !Array.isArray(d.sets) || !d.sets.length) throw new Error('questions file empty');
        return d;
      });
      filePromise.catch(function () { filePromise = null; });
    }
    return filePromise;
  }
  function fileSet(d, setId) { return d.sets.filter(function (s) { return s.setId === setId; })[0] || null; }

  function histKey(setId) { return 'bc-eg-hist:' + setId; }
  function cleanHist(h) {
    h = h && typeof h === 'object' ? h : {};
    return { seen: h.seen && typeof h.seen === 'object' ? h.seen : {}, score: h.score && typeof h.score === 'object' ? h.score : {},
      tries: h.tries && typeof h.tries === 'object' ? h.tries : {} };
  }
  function saveHist(setId) { try { localStorage.setItem(histKey(setId), JSON.stringify(hist[setId])); } catch (e) {} }
  // Starts the history read for a set (once); it also warms the shell relay and Apps Script before the first submit.
  function loadHist(setId) {
    if (!histPromise[setId]) {
      var local = null;
      try { local = JSON.parse(localStorage.getItem(histKey(setId)) || 'null'); } catch (e) {}
      if (!hist[setId]) hist[setId] = cleanHist(local);
      histPromise[setId] = request('history', { setId: setId }).then(function (h) {
        hist[setId] = cleanHist(h);
        saveHist(setId);
        return hist[setId];
      }, function () { histPromise[setId] = null; return hist[setId]; });
    }
    return histPromise[setId];
  }
  // Waits for the server history at most `ms`; after that the local copy is used.
  function histWithin(setId, ms) {
    return Promise.race([loadHist(setId), new Promise(function (res) { setTimeout(function () { res(hist[setId]); }, ms); })]);
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(set, h, count, maxMarks) {
    var pool = set.questions.filter(function (q) { return q.marks <= maxMarks; });
    if (!pool.length) pool = set.questions.slice();
    var weakFirst = function (list) {
      return shuffle(list.slice()).sort(function (a, b) {
        var sa = h.score[a.qid] == null ? -1 : h.score[a.qid], sb = h.score[b.qid] == null ? -1 : h.score[b.qid];
        return sa - sb;
      });
    };
    var unseen = pool.filter(function (q) { return !h.seen[q.qid]; });
    var everSeen = pool.every(function (q) { return h.score[q.qid] != null || h.tries[q.qid]; });
    var picked = (everSeen ? weakFirst(unseen) : shuffle(unseen)).slice(0, count);
    if (picked.length < count) {
      h.seen = {};
      var ids = picked.map(function (q) { return q.qid; });
      picked = picked.concat(weakFirst(pool.filter(function (q) { return ids.indexOf(q.qid) < 0; })).slice(0, count - picked.length));
    }
    picked.forEach(function (q) { h.seen[q.qid] = 1; });
    return picked.map(function (q) { return { qid: q.qid, text: q.text, marks: q.marks }; });
  }

  var qidSet = {};

  if (useFile) loadFile();   // starts at once, so the set list and the first round need no wait

  window.ExamGame = {
    sets: function () {
      if (!useFile) return request('sets');
      return loadFile().then(function (d) {
        return d.sets.map(function (s) { s.questions.forEach(function (q) { qidSet[q.qid] = s.setId; }); return { setId: s.setId, title: s.title, count: s.questions.length }; });
      }, function () { return request('sets'); });
    },
    // Fetches the student's history for the set and warms the relay; call it at game start and while a wave runs.
    // Again while a wave runs (at most once a minute) so Apps Script is warm before the round's first submit.
    warm: function (setId) {
      if (!useFile || !setId) return;
      setId = String(setId);
      if (histPromise[setId] && Date.now() - (histAt[setId] || 0) > 60000) histPromise[setId] = null;
      if (!histPromise[setId]) histAt[setId] = Date.now();
      loadHist(setId);
    },
    next: function (setId, opts) {
      opts = opts || {};
      setId = String(setId || '');
      var count = Math.max(1, Math.min(10, Math.floor(Number(opts.count) || 1)));
      var maxMarks = Number(opts.maxMarks) > 0 ? Number(opts.maxMarks) : 99;
      var server = function () { return request('next', { setId: setId, count: opts.count, maxMarks: opts.maxMarks }); };
      if (!useFile) return server();
      return loadFile().then(function (d) {
        var set = fileSet(d, setId);
        if (!set) return server();
        set.questions.forEach(function (q) { qidSet[q.qid] = setId; });
        return histWithin(setId, 1500).then(function () {
          var h = hist[setId] || (hist[setId] = cleanHist(null));
          var out = pick(set, h, count, maxMarks);
          saveHist(setId);
          return out;
        });
      }, server);
    },
    // image: the pen working as a base64 PNG without the data: prefix, or '' for none.
    submit: function (qid, answer, attempt, image) {
      var p = { qid: String(qid || ''), answer: String(answer == null ? '' : answer), attempt: attempt === 2 ? 2 : 1 };
      if (typeof image === 'string' && image) { p.image = image; p.imageType = 'image/png'; }
      return request('submit', p).then(function (res) {
        var setId = qidSet[p.qid], h = setId && hist[setId];
        if (h && res) {
          h.seen[p.qid] = 1;
          if (p.attempt === 1) {
            var max = Number(res.max) || 1;
            h.score[p.qid] = Math.round((Number(res.marks) || 0) / max * 100) / 100;
            h.tries[p.qid] = (Number(h.tries[p.qid]) || 0) + 1;
          }
          saveHist(setId);
        }
        return res;
      });
    },
    // Stub only: what the last submit sent ({ qid, answerChars, imageChars }).
    lastStubSubmit: function () { return stubLast; },
    useStub: function (on) { stub = on !== false; },
    isStub: function () { return stub; },
    usesFile: function () { return useFile; }
  };
})();
