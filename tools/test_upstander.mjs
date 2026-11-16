// Logic test for Upstander Lab 3D (pages UpstanderLab3D/): the filter, every message's result, and the story's
// rules (no dashes or emoji, every wrong choice has a reason, every person in a conversation exists).
//   node tools/test_upstander.mjs
import assert from 'node:assert/strict';
import { flagged, verdict, BLOCKED } from '../UpstanderLab3D/js/filter.js';
import { MESSAGES, MISSIONS, PEOPLE, CHAT, CHAT_ACTIONS, IDLE } from '../UpstanderLab3D/js/story.js';
import { peopleAfter, SPREAD_Q } from '../UpstanderLab3D/js/phone.js';

// The filter: blocked words anywhere inside the message, in capitals.
assert.equal(flagged('LoSeR'), true);
assert.equal(flagged("losers' bracket"), true, 'a word inside a longer word is still flagged (a false alarm)');
assert.equal(flagged('l0s3r'), false, 'numbers for letters get past it (a miss)');
assert.equal(flagged('LOOOSER'), false, 'a new spelling gets past it');
assert.equal(flagged('ur such a l0s3r', BLOCKED.concat('L0S3R')), true, "Niran's fix catches that one spelling");
assert.deepEqual(BLOCKED, ['LOSER', 'UGLY', 'STUPID', 'WEIRDO']);

// The seven messages: what Niran is told at the end must match ("flagged two ... not unkind, and missed three").
const v = MESSAGES.map((m) => verdict(flagged(m.text), m.unkind));
const counts = { 'false-alarm': 2, missed: 3, right: 2 };
for (const [k, n] of Object.entries(counts)) assert.equal(v.filter((x) => x === k).length, n, k);
const report = MISSIONS[0].talk.niran({ ...MISSIONS[0].fresh(), met: true, tested: Object.fromEntries(MESSAGES.map((m) => [m.id, 1])) });
const said = report[0].choices.find((c) => c.ok).t;
assert.match(said, /two messages that were not unkind, and missed three/, 'Niran\'s report matches the results');
assert.ok(report.some((L) => (L.choices || []).some((c) => /Three unkind messages/.test(c.why || ''))), 'the miss count in the reasons');
assert.equal(new Set(MESSAGES.map((m) => m.from)).size, 7, 'one message from each of seven people');

// The spread: 2^n - 1 after step n, and the answers the phone accepts.
assert.deepEqual([1, 2, 3, 4, 8].map(peopleAfter), [1, 3, 7, 15, 255]);
for (const q of SPREAD_Q) assert.equal(peopleAfter(q.step), q.answer);

// The story: every conversation is with a real person, every wrong choice says why, no dashes, no emoji.
const all = JSON.stringify({ MESSAGES, CHAT, CHAT_ACTIONS, IDLE, PEOPLE }) + MISSIONS.map((m) => m.intro + m.title).join(' ');
for (const m of MISSIONS) {
  for (const [id, f] of Object.entries(m.talk)) {
    assert.ok(PEOPLE[id], m.id + ': ' + id + ' is not a person');
    const lines = f(m.fresh()) || [];
    for (const L of lines) for (const c of L.choices || []) {
      if (!c.ok) assert.ok(c.why && c.why.length > 20, m.id + '/' + id + ': no reason for "' + c.t + '"');
      assert.ok(!/[–—]|\p{Extended_Pictographic}/u.test(c.t + (c.why || '') + L.say), m.id + '/' + id + ': dash or emoji');
    }
  }
}
assert.ok(!/[–—]|\p{Extended_Pictographic}/u.test(all), 'dash or emoji in the story');
for (const a of CHAT_ACTIONS) if (!a.ok || a.needs) assert.ok(a.why, a.id + ' needs a reason');
console.log('Upstander Lab 3D: all checks passed.');
