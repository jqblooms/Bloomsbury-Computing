// Circuit Siege: a local stand-in for shared/exam-game-client.js.
// Used only when that client did not load. Opened on its own (or with ?examStub=1) it serves practice
// questions marked locally; inside the site with no client it refuses, so no free coins.
(function () {
  'use strict';
  if (window.ExamGame) return;
  var standalone = window.parent === window || /[?&]examStub=1/.test(location.search);
  var bank = {};
  var n = 0;

  function toBin(v) { var u = (v + 256) % 256, s = u.toString(2); while (s.length < 8) s = '0' + s; return s; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function make() {
    var kind = rnd(0, 2), qid = 'stub-' + (++n), v;
    if (kind === 0) {
      v = -rnd(1, 127);
      bank[qid] = { want: toBin(v), marks: 2 };
      return { qid: qid, marks: 2, text: 'Convert the denary number ' + v + ' into an 8-bit two\'s complement binary number.\nShow your working.' };
    }
    if (kind === 1) {
      v = -rnd(1, 128);
      bank[qid] = { want: String(v), marks: 1 };
      return { qid: qid, marks: 1, text: 'The 8-bit two\'s complement binary number is:\n' + toBin(v) + '\nConvert it into denary.' };
    }
    v = rnd(1, 127);
    bank[qid] = { want: toBin(v), marks: 1 };
    return { qid: qid, marks: 1, text: 'Convert the denary number ' + v + ' into an 8-bit two\'s complement binary number.' };
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function refuse() { return Promise.reject(new Error('No answer from the site. Try again soon.')); }

  window.ExamGame = {
    isStub: true,
    sets: function () {
      if (!standalone) return refuse();
      return wait(150).then(function () { return [{ setId: 'twos-complement', title: 'Two\'s complement', count: 99 }]; });
    },
    next: function (setId, opt) {
      if (!standalone) return refuse();
      opt = opt || {};
      var out = [], total = 0, max = opt.maxMarks || 99, tries = 0;
      while (out.length < (opt.count || 1) && tries++ < 50) {
        var q = make();
        if (total + q.marks > max) continue;
        total += q.marks; out.push(q);
      }
      return wait(200).then(function () { return out; });
    },
    submit: function (qid, answer, attempt) {
      if (!standalone) return refuse();
      var item = bank[qid];
      return wait(500).then(function () {
        if (!item) throw new Error('That question has expired. Press Next.');
        var lines = String(answer || '').trim().split(/\s+/);
        var last = (lines[lines.length - 1] || '').replace(/\s/g, '');
        var all = String(answer || '').replace(/\s/g, '');
        var ok = last === item.want || all.slice(-item.want.length) === item.want;
        var marks = ok ? item.marks : (item.marks > 1 && /[01]{8}/.test(all) ? 1 : 0);
        return {
          marks: marks, max: item.marks, attempt: attempt, full: marks === item.marks,
          canRetry: attempt === 1 && marks < item.marks,
          feedback: ok ? 'Correct. Well done.' : marks ? 'Your working earns a mark. Check each bit of your final answer.' : 'Not yet. Write the place values -128, 64, 32, 16, 8, 4, 2, 1 and try again.'
        };
      });
    }
  };
})();
