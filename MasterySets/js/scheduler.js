// Practice Sets scheduler (James 2026-11-23). Pure logic, no page: tested by tools/test_mastery_scheduler.mjs.
// - The sets are done in order; a set opens when every question in the one before is mastered.
// - A question is mastered after 2 right answers in a row (full marks). After a right answer it does not come back
//   until at least 3 other questions have been shown.
// - A wrong answer (anything less than full marks) resets it: it comes back exactly 3 questions later and now needs
//   3 right in a row.
// - Which question next: a reset question whose 3 others have been shown; then unseen questions in set order; then
//   any question that may come back, the one waiting longest first. When the only questions left must still wait,
//   a mastered question is shown again to fill the gap (a review: right keeps it mastered, wrong resets it).
// State (saved on the server as JSON, MasterySets.gs reads setIdx, answers, sets[i].done and sets[i].q[qid].m):
//   { v, setIdx, answers, finished, sets: [{ done, turn, cur, rev, q: { qid: { need, streak, m, at, shown, last, back } } }] }
(function (root) {
  'use strict';
  var GAP = 3;   // other questions shown before a question may come back

  function create(setSizes) {
    return { v: 1, setIdx: 0, answers: 0, finished: false, sets: setSizes.map(function () { return { done: false, turn: 0, cur: null, rev: false, q: {} }; }) };
  }
  function rec(set, qid) {
    return set.q[qid] || (set.q[qid] = { need: 2, streak: 0, m: 0, at: 0, shown: 0, last: -1, back: false });
  }
  // Makes a saved state safe to use with these sets (missing parts filled in).
  function repair(state, setSizes) {
    var s = state && typeof state === 'object' && Array.isArray(state.sets) ? state : create(setSizes);
    while (s.sets.length < setSizes.length) s.sets.push({ done: false, turn: 0, cur: null, rev: false, q: {} });
    s.setIdx = Math.max(0, Math.min(setSizes.length - 1, Math.floor(Number(s.setIdx) || 0)));
    s.answers = Math.max(0, Math.floor(Number(s.answers) || 0));
    s.sets.forEach(function (x) { x.q = x.q && typeof x.q === 'object' ? x.q : {}; x.turn = Math.max(0, Math.floor(Number(x.turn) || 0)); });
    return s;
  }

  // The question to show now for the open set (qids in set order). Keeps showing the same one until it is answered.
  function next(state, qids) {
    var set = state.sets[state.setIdx];
    if (set.cur && qids.indexOf(set.cur) >= 0) return { qid: set.cur, review: !!set.rev };
    var t = set.turn, pick = null, review = false, i, r;
    var open = qids.filter(function (id) { return !rec(set, id).m; });
    if (!open.length) return null;
    // 1. a reset question whose gap is over
    open.forEach(function (id) { r = rec(set, id); if (r.back && r.at <= t && (!pick || r.at < rec(set, pick).at)) pick = id; });
    // 2. unseen, in order
    if (!pick) for (i = 0; i < open.length && !pick; i++) if (!rec(set, open[i]).shown) pick = open[i];
    // 3. may come back, waiting longest first
    if (!pick) open.forEach(function (id) { r = rec(set, id); if (r.at <= t && (!pick || r.at < rec(set, pick).at)) pick = id; });
    // 4. a review of a mastered question, so the gap is kept
    if (!pick) {
      qids.forEach(function (id) { r = rec(set, id); if (r.m && r.at <= t && (!pick || r.last < rec(set, pick).last)) pick = id; });
      if (pick) review = true;
    }
    // 5. nothing else can be shown: the open question that has waited longest
    if (!pick) open.forEach(function (id) { if (!pick || rec(set, id).at < rec(set, pick).at) pick = id; });
    r = rec(set, pick);
    r.shown++; r.last = t;
    set.turn = t + 1; set.cur = pick; set.rev = review;
    return { qid: pick, review: review };
  }

  // Records the mark for the question on show. full: full marks. Answers { mastered, setDone, finished }.
  function answer(state, qids, full) {
    var set = state.sets[state.setIdx], qid = set.cur;
    if (!qid) return null;
    var r = rec(set, qid);
    if (full) {
      r.streak++;
      r.back = false;
      if (r.streak >= r.need) r.m = 1;
    } else {
      r.streak = 0; r.need = 3; r.m = 0; r.back = true;
    }
    r.at = r.last + GAP + 1;
    state.answers++;
    set.cur = null; set.rev = false;
    var setDone = qids.every(function (id) { return rec(set, id).m; });
    if (setDone) {
      set.done = true;
      if (state.setIdx < state.sets.length - 1) state.setIdx++;
      else state.finished = true;
    }
    return { qid: qid, mastered: !!r.m, need: r.need, streak: r.streak, setDone: setDone, finished: !!state.finished };
  }

  function masteredCount(state, qids, idx) {
    var set = state.sets[idx == null ? state.setIdx : idx];
    if (set.done) return qids.length;
    return qids.filter(function (id) { return set.q[id] && set.q[id].m; }).length;
  }
  // How far on a state is: questions mastered in all sets, then answers (the further copy wins between computers).
  function progress(state, setQids) {
    var n = 0;
    setQids.forEach(function (qids, i) { if (state.sets[i]) n += masteredCount(state, qids, i); });
    return n * 100000 + (state.answers || 0);
  }

  var api = { GAP: GAP, create: create, repair: repair, next: next, answer: answer, masteredCount: masteredCount, progress: progress };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MasteryScheduler = api;
})(this);
