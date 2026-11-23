// Tests the Practice Sets scheduler (MasterySets/js/scheduler.js) by simulation.
// Run: node tools/test_mastery_scheduler.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const S = require('../MasterySets/js/scheduler.js');

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL ' + m); } };
const qidsOf = (n, p) => Array.from({ length: n }, (_, i) => p + (i + 1));
const SIZES = [10, 10, 10, 10, 7];
const SETS = SIZES.map((n, i) => qidsOf(n, 's' + (i + 1) + 'q'));

// Plays the open set; rightFn(qid, shownCount, turn) says whether the answer gets full marks. Returns the shown list.
function play(state, rightFn, limit = 500) {
  const idx = state.setIdx, shown = [];
  while (!state.sets[idx].done && shown.length < limit) {
    const n = S.next(state, SETS[idx]);
    shown.push(n);
    S.answer(state, SETS[idx], rightFn(n.qid, shown.filter((x) => x.qid === n.qid).length, shown.length - 1, n.review));
  }
  return shown;
}
// Fewest other questions shown between two showings of the same question after a right answer.
function gaps(shown, rights) {
  const out = [];
  shown.forEach((s, i) => {
    if (!rights[i]) return;
    const j = shown.findIndex((x, k) => k > i && x.qid === s.qid);
    if (j > 0) out.push(j - i - 1);
  });
  return out;
}

// 1. All right first time: each question seen exactly twice, gaps of at least 3, no reviews, every set opens in order.
{
  const st = S.create(SIZES);
  SIZES.forEach((n, i) => {
    ok(st.setIdx === i, 'set ' + (i + 1) + ' is open');
    const shown = play(st, () => true);
    const count = {};
    shown.forEach((s) => { count[s.qid] = (count[s.qid] || 0) + 1; });
    ok(shown.length === 2 * n, 'set ' + (i + 1) + ': ' + shown.length + ' shown, want ' + 2 * n);
    ok(Object.values(count).every((c) => c === 2) && Object.keys(count).length === n, 'set ' + (i + 1) + ': each seen twice');
    ok(!shown.some((s) => s.review), 'set ' + (i + 1) + ': no reviews');
    ok(Math.min(...gaps(shown, shown.map(() => true))) >= 3, 'set ' + (i + 1) + ': gap >= 3');
    ok(st.sets[i].done, 'set ' + (i + 1) + ' done');
  });
  ok(st.finished, 'all five sets finished');
  ok(st.answers === 2 * 47, 'answers counted');
}

// 2. One wrong answer: back after exactly 3 others, then needs 3 right in a row.
{
  const st = S.create(SIZES);
  const rightFn = (qid, nth) => !(qid === 's1q2' && nth === 1);
  const shown = play(st, rightFn);
  const at = shown.map((s, i) => (s.qid === 's1q2' ? i : -1)).filter((i) => i >= 0);
  ok(at[1] - at[0] - 1 === 3, 'wrong answer back after exactly 3 others (got ' + (at[1] - at[0] - 1) + ')');
  ok(at.length === 4, 's1q2 shown 4 times: 1 wrong then 3 right (got ' + at.length + ')');
  ok(st.sets[0].q.s1q2.need === 3 && st.sets[0].q.s1q2.m === 1, 'needs 3, mastered');
  ok(st.setIdx === 1, 'set 2 opens after set 1');
}

// 3. A wrong in the middle of a 3-streak resets it again; wrong answers always come back after exactly 3 others.
{
  const st = S.create(SIZES);
  st.setIdx = 0;
  let calls = 0;
  const wrongs = new Set([0, 5, 9, 14, 22]);   // shown positions answered wrong
  const shown = [];
  while (!st.sets[0].done && shown.length < 400) {
    const n = S.next(st, SETS[0]);
    const right = !wrongs.has(calls);
    shown.push({ ...n, right });
    S.answer(st, SETS[0], right);
    calls++;
  }
  shown.forEach((s, i) => {
    if (s.right) return;
    const j = shown.findIndex((x, k) => k > i && x.qid === s.qid);
    ok(j - i - 1 === 3, 'wrong at ' + i + ' (' + s.qid + ') back after ' + (j - i - 1));
  });
  ok(Math.min(...gaps(shown, shown.map((s) => s.right))) >= 3, 'gaps after right answers >= 3');
  // every mastered question ended with need right answers in a row
  SETS[0].forEach((q) => {
    const seq = shown.filter((s) => s.qid === q && !s.review).map((s) => s.right);
    let streak = 0; seq.forEach((r) => { streak = r ? streak + 1 : 0; });
    const need = seq.includes(false) ? 3 : 2;
    ok(streak >= need, q + ' mastered with ' + streak + ' in a row, needs ' + need);
  });
}

// 4. Sets unlock in order only; the last set has 7; a set does not finish while any question is unmastered.
{
  const st = S.create(SIZES);
  for (let i = 0; i < 4; i++) { play(st, () => true); ok(st.setIdx === i + 1, 'after set ' + (i + 1) + ' set ' + (i + 2) + ' opens'); }
  const last = new Set();
  let n;
  for (let k = 0; k < 7; k++) { n = S.next(st, SETS[4]); last.add(n.qid); S.answer(st, SETS[4], true); }
  ok(last.size === 7 && [...last].every((q) => q.startsWith('s5q')), 'last set shows its 7 questions');
  ok(!st.finished, 'not finished after one round of the last set');
  play(st, () => true);
  ok(st.finished && st.setIdx === 4, 'finished on the last set');
}

// 5. End of a set: one question left keeps its gap through reviews of mastered ones; a wrong review resets it.
{
  const st = S.create(SIZES);
  const rightFn = (qid, nth) => !(qid === 's1q10' && nth <= 2);
  const shown = play(st, rightFn);
  const rights = shown.map((s, i) => rightFn(s.qid, shown.slice(0, i + 1).filter((x) => x.qid === s.qid).length));
  ok(Math.min(...gaps(shown, rights)) >= 3, 'gaps kept at the end of a set');
  ok(shown.some((s) => s.review), 'reviews fill the gap at the end');
  const st2 = S.create(SIZES);
  let reviewWrong = false;
  play(st2, (qid, nth, turn, review) => {
    if (qid === 's1q10' && nth <= 2) return false;
    if (review && !reviewWrong) { reviewWrong = qid; return false; }
    return true;
  });
  ok(reviewWrong && st2.sets[0].q[reviewWrong].need === 3, 'a wrong review resets the question');
}

// 6. Reload: the question on show stays until it is answered; repair keeps a saved state.
{
  const st = S.create(SIZES);
  const a = S.next(st, SETS[0]);
  const saved = S.repair(JSON.parse(JSON.stringify(st)), SIZES);
  ok(S.next(saved, SETS[0]).qid === a.qid, 'same question after reload');
  ok(saved.sets[0].turn === 1, 'turn not counted twice');
  ok(S.progress(S.create(SIZES), SETS) === 0, 'progress of a new state');
}

console.log(fails ? fails + ' of ' + checks + ' checks FAILED' : 'All ' + checks + ' scheduler checks passed.');
process.exit(fails ? 1 : 0);
