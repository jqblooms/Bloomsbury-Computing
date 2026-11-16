// Logic test for Upstander Lab 3D (pages UpstanderLab3D/): the filter, every message's result, random names, and
// the story's rules (no fixed names, no dashes or emoji, every wrong choice has a reason, no code).
//   node tools/test_upstander.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { flagged, verdict, BLOCKED } from '../UpstanderLab3D/js/filter.js';
import { MESSAGES, MISSIONS, ROLES, CHAT, CHAT_ACTIONS, IDLE, NAME_POOL, NAMES, randomiseNames, fill } from '../UpstanderLab3D/js/story.js';
import { peopleAfter, SPREAD_Q } from '../UpstanderLab3D/js/phone.js';

// The filter: banned words anywhere inside the message, any capitals.
assert.equal(flagged('LoSeR'), true);
assert.equal(flagged("losers' bracket"), true, 'a word inside a longer word is still hidden (a false alarm)');
assert.equal(flagged('l0s3r'), false, 'numbers for letters get past it (a miss)');
assert.equal(flagged('LOOOSER'), false, 'a new spelling gets past it');
assert.equal(flagged('ur such a l0s3r', BLOCKED.concat('L0S3R')), true, 'banning L0S3R catches that one spelling');
assert.deepEqual(BLOCKED, ['LOSER', 'UGLY', 'STUPID', 'WEIRDO']);

// Random names: a fresh draw every visit, all different, from the pool; staff are roles with no name.
const draws = new Set();
for (let i = 0; i < 20; i++) {
  const n = randomiseNames();
  const kids = Object.entries(n).filter(([id]) => !ROLES[id].staff).map(([, v]) => v);
  assert.equal(new Set(kids).size, kids.length, 'names repeat in one visit');
  kids.forEach((k) => assert.ok(NAME_POOL.includes(k), k + ' is not from the pool'));
  assert.equal(n.coun, 'Safeguarding Lead', 'staff have a role, not a name');
  draws.add(JSON.stringify(n));
}
assert.ok(draws.size > 15, 'names are not random enough');
assert.equal(new Set(NAME_POOL).size, NAME_POOL.length, 'pool has repeats');
// Made-up names only: none of the real names or Thai nicknames used before, no Thai insult or rude sound, no English
// word that could mock the person targeted.
const REAL = ['Arin', 'Bo', 'Cai', 'Dara', 'Eli', 'Fai', 'Gem', 'Hana', 'Ira', 'Jun', 'Kai', 'Lani', 'Mika', 'Nori', 'Oak', 'Pax', 'Quinn', 'Rin',
  'Sol', 'Tam', 'Uma', 'Wren', 'Yuki', 'Sky', 'Fin', 'Niran', 'Leo', 'Mali', 'Ava', 'Krit', 'Ploy', 'Ben', 'Sam', 'Max', 'Mint', 'Ice', 'Bank'];
for (const n of NAME_POOL) {
  assert.ok(!REAL.includes(n), n + ' is a real name or nickname');
  assert.ok(n.length >= 4, n + ' is short enough to be a real nickname');
  assert.ok(!/^(ai|ee|i-)/i.test(n), n + ' starts with an insulting Thai prefix');
  assert.ok(!/kuay|kwai|hia|hee|yed|maa|sat|ass|sex|gay|tit|fat|poo|pee|kill|vex|cum|dum|ugl|los|stup|weird/i.test(n), n + ' contains a rude or mocking sound');
}
assert.ok(NAME_POOL.length >= Object.keys(ROLES).length * 4, 'pool too small to randomise');

// No fixed names anywhere in the game's text: every person is a {role} token.
const src = ['story.js', 'main.js', 'talk.js', 'phone.js', 'world.js', 'filter.js'].map((f) => fs.readFileSync(new URL('../UpstanderLab3D/js/' + f, import.meta.url), 'utf8')).join('\n');
const text = (fs.readFileSync(new URL('../UpstanderLab3D/js/story.js', import.meta.url), 'utf8').split('export const NAME_POOL')[0]) + src.split('export const NAMES')[1];
for (const old of ['Niran', 'Leo', 'Mali', 'Ava', 'Krit', 'Ploy', 'Ben', 'Sam']) assert.ok(!new RegExp('\\b' + old + '\\b').test(src.replace(/NAME_POOL = \[[^\]]*\]/, '')), 'fixed name ' + old + ' in the game');
assert.ok(!/\b(DECLARE|ENDIF|ENDFUNCTION|RETURNS)\b/.test(src) && !/pseudocode|coding club|CONTAINS\(/i.test(src), 'code in the online safety game');

// The seven messages: what the class rep is told at the end must match.
const v = MESSAGES.map((m) => verdict(flagged(fill(m.text)), m.unkind));
const counts = { 'false-alarm': 2, missed: 3, right: 2 };
for (const [k, n] of Object.entries(counts)) assert.equal(v.filter((x) => x === k).length, n, k);
const report = MISSIONS[0].talk.rep({ ...MISSIONS[0].fresh(), met: true, tested: Object.fromEntries(MESSAGES.map((m) => [m.id, 1])) });
assert.match(report[0].choices.find((c) => c.ok).t, /two messages that were not unkind, and let three unkind ones through/);
assert.ok(report.some((L) => (L.choices || []).some((c) => /Three unkind messages/.test(c.why || ''))));
// a name in a message can never change the filter's result
for (let i = 0; i < 20; i++) { randomiseNames(); MESSAGES.forEach((m, k) => assert.equal(verdict(flagged(fill(m.text)), m.unkind), v[k], 'name changes ' + m.id)); }

// Telling an adult never needs evidence first (UK practice): with nothing saved, the right choice is still taken.
for (const id of ['upstander', 'challenge']) {
  const m = MISSIONS.find((x) => x.id === id), S = m.fresh();
  const lines = m.talk.coun(S), c = lines[0].choices.find((x) => x.ok);
  assert.ok(c && !c.check, id + ': telling the adult is gated');
  c.act(S); assert.equal(S.told, true, id + ': telling without evidence does not count');
  assert.ok(lines.some((L) => /right to come/.test(L.say || '')), id + ': the adult does not welcome a tell without evidence');
  assert.ok(!/save the evidence on your phone first/i.test(JSON.stringify(lines)), id + ': evidence demanded before telling');
}

// The spread: 2^n - 1 after step n, and the answers the phone accepts.
assert.deepEqual([1, 2, 3, 4, 8].map(peopleAfter), [1, 3, 7, 15, 255]);
for (const q of SPREAD_Q) assert.equal(peopleAfter(q.step), q.answer);

// The story: conversations with real roles, a reason for every wrong choice, no dashes, emoji or pronouns for people.
const bad = /[\u2013\u2014]|\p{Extended_Pictographic}/u;
for (const m of MISSIONS) {
  for (const [id, f] of Object.entries(m.talk)) {
    assert.ok(ROLES[id], m.id + ': ' + id + ' is not a role');
    for (const L of f(m.fresh()) || []) {
      assert.ok(!bad.test(L.say), m.id + '/' + id + ': dash or emoji');
      for (const c of L.choices || []) {
        if (!c.ok) assert.ok(c.why && c.why.length > 20, m.id + '/' + id + ': no reason for "' + c.t + '"');
        assert.ok(!bad.test(c.t + (c.why || '')), m.id + '/' + id + ': dash or emoji');
        assert.ok(!/\b(he|she|him|her|his|hers)\b/i.test(c.t + ' ' + (c.why || '') + ' ' + L.say), m.id + '/' + id + ': a pronoun for a person: ' + c.t);
      }
    }
  }
}
assert.ok(!bad.test(JSON.stringify({ MESSAGES, CHAT, CHAT_ACTIONS, IDLE })), 'dash or emoji in the story');
for (const a of CHAT_ACTIONS) if (!a.ok || a.needs) assert.ok(a.why, a.id + ' needs a reason');
void NAMES; void text;
console.log('Upstander Lab 3D: all checks passed.');
