// Builds LessonData/y9-abw.json: Year 9, Anti-Bullying Week: Can Code Stop Cyberbullying? (James, 2026-11-16).
//   node tools/build_y9_abw.mjs
// It also writes the plenary drill Drills/data/y9-abw.js and adds an "Anti-Bullying Week" unit to Year 9 in
// lessons.json (after Pseudocode and Software Development).
// The teaching is Upstander Lab 3D (pages UpstanderLab3D/, registry upstander-lab-3d), a walk and talk game, one
// mission per slide (?lesson=abw&mission=...), each followed by an own-words Explain It marked by Haiku (policy 2b).
// The Do Now recaps 2.5 strings and 3.1 pseudocode; every output is worked out by shared/pseudocode-engine.js.
// Safeguarding: no slide or Explain It asks students about their own experiences; the last slide says where to get
// help. Year 9 has no exam board papers, so nothing is cited.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { flagged, verdict } from '../UpstanderLab3D/js/filter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const ID = 'y9-abw', P = 'y9abw';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
function tps(q, a) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${q}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${a}</p></div></details>`;
}
const why = (w) => tps(w[0], w[1]);
const run = (lines) => { const r = runPseudocode(lines.join('\n'), {}, 20000, []); if (r.error) throw new Error(r.error.message + '\n' + lines.join('\n')); return r.outputs.map(String); };
const code = (lines) => '<pre class="pseudocode-block">' + esc(lines.join('\n').replace(/<-/g, '←')) + '</pre>';
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const ARW = '';

// ---------------------------------------------------------------- step builders (as the other builders)
const validators = {}, steps = [];
function checkStep(id, label, lead, parts, whyQ, extra) {
  const key = `${P}_${id}`.replace(/-/g, '_'), vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcd'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => `<div class="lesson-do-now-response"><label for="${vid}-${'abcd'[i]}">${parts.length > 1 ? '(' + 'abcd'[i] + ') ' : ''}${p.label} [1]</label>` +
    `<input id="${vid}-${'abcd'[i]}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${'abcd'[i]}" aria-label="${label} part ${'abcd'[i]}" autocomplete="off"></div>`).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div><div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} mark${parts.length > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ) + `<p class="lesson-lead">${lead}</p>` + `<div class="lesson-do-now-columns"><div>${extra}</div><div>${card}</div></div>` };
}
function embed(id, label, appId, lead, whyQ, query) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ) + `<p class="lesson-lead">${lead}</p><div id="${P}-${id}"></div>` }, query ? { embedQuery: query } : {});
}
const GAMES = [];
function game(id, label, mission, lead, whyQ) { GAMES.push(id); return embed(id, label, 'upstander-lab-3d', lead + ' Press <strong>Full screen</strong> for the best view.', whyQ, `lesson=abw&mission=${mission}`); }
function explain(id, label, about, part, whyQ) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ) + '<p class="lesson-lead">Explain it in your own words. Press <strong>Check my answer</strong> to have it marked.</p>' + `<div id="${P}-${id}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part)] };
}

// ---------------------------------------------------------------- Do Now: 2.5 strings and 3.1 pseudocode
const DN1 = ['DECLARE Word : STRING', 'Word <- "Upstander"', 'OUTPUT UCASE(Word)', 'OUTPUT LENGTH(Word)'];
const dn1 = run(DN1);
assert(dn1[0] === 'UPSTANDER' && dn1[1] === '9', 'Do Now 1 ' + dn1);
steps.push(checkStep('do-now', 'Do Now: Strings (1 of 2)', 'Recap of 2.5 String Manipulation. What does this program output?', [
  { label: 'The first OUTPUT', answer: '^\\s*"?\\s*UPSTANDER\\s*"?\\s*\\.?\\s*$', feedback: 'UCASE changes every letter to a capital letter.' },
  { label: 'The second OUTPUT', answer: '^\\s*9\\s*\\.?\\s*$', feedback: 'LENGTH counts every character in the string.' },
], ['Why do programs often change text to capitals before comparing it?', 'Then "Hi", "HI" and "hi" all count as the same word.'], code(DN1)));
steps[0].walkthrough = { title: 'Walk me through it: UCASE and LENGTH', steps: [
  { text: '<strong>A similar question.</strong> Word holds "Kind".', visual: code(['Word <- "Kind"', 'OUTPUT UCASE(Word)', 'OUTPUT LENGTH(Word)']) },
  { text: `${kw('UCASE')} changes every lower case letter to a capital. "Kind" becomes "KIND".`, visual: note('K i n d &rarr; K I N D') },
  { text: 'Letters that are already capitals stay the same.', visual: note('K stays K') },
  { text: `${kw('LENGTH')} counts the characters, one at a time: K, i, n, d.`, visual: note('1 2 3 4') },
  { text: 'So this program outputs KIND, then 4.', visual: note('KIND &nbsp; 4') },
  { text: 'Now do the same for the question: capitals first, then count every character.', visual: note('UCASE &nbsp; then LENGTH') },
] };

const WORDS = ['hello', 'ok', 'thanks', 'brilliant'];
const DN2 = ['DECLARE Words : ARRAY[1:4] OF STRING', 'DECLARE Count : INTEGER', 'DECLARE i : INTEGER',
  ...WORDS.map((w, i) => `Words[${i + 1}] <- "${w}"`), 'Count <- 0', 'FOR i <- 1 TO 4', '    IF LENGTH(Words[i]) > 4 THEN', '        Count <- Count + 1', '    ENDIF', 'NEXT i', 'OUTPUT Count'];
const dn2 = run(DN2);
assert(dn2.length === 1 && dn2[0] === String(WORDS.filter((w) => w.length > 4).length), 'Do Now 2 ' + dn2);
steps.push(checkStep('do-now-2', 'Do Now: Following Pseudocode (2 of 2)', 'Recap of 3.1 Following and Correcting Pseudocode. What does this program output?', [
  { label: 'The OUTPUT', answer: `^\\s*${dn2[0]}\\s*\\.?\\s*$`, feedback: 'Go through the array one word at a time. Add 1 to Count only when the word has more than 4 characters.' },
], ['Why do we trace a loop one value at a time?', 'Then we can see exactly when Count changes, and why.'], code(DN2)));
steps[1].walkthrough = { title: 'Walk me through it: a loop over an array', steps: [
  { text: '<strong>A similar question.</strong> The array holds "hi", "great", "no". Count goes up when a word has more than 2 characters.', visual: note('"hi" &nbsp; "great" &nbsp; "no"') },
  { text: `Count starts at ${kw('0')}.`, visual: note('Count = 0') },
  { text: '"hi" has 2 characters. 2 is not more than 2, so Count stays 0.', visual: note('hi: 2 &rarr; no change') },
  { text: '"great" has 5 characters. 5 is more than 2, so Count becomes 1.', visual: note('great: 5 &rarr; Count = 1') },
  { text: '"no" has 2 characters, so Count stays 1. The loop ends and the program outputs 1.', visual: note('OUTPUT 1') },
  { text: 'Now do the same for the question: one word at a time, count the characters, compare with 4.', visual: note('LENGTH &gt; 4 ?') },
] };
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-3-1-ext', '<strong>Extension:</strong> finished the Do Now? Try these pseudocode cards from 3.1. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new values?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title and the game
steps.push({ id: 'title', label: 'Can Code Stop Cyberbullying?',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Anti-Bullying Week</p><h2 class="lesson-h2">Can Code Stop Cyberbullying?</h2><p>Year 9</p></div>' +
    '<p class="lesson-lead"><strong>Today:</strong> test a filter, see how fast a post spreads, and learn what an upstander does.</p>' +
    why(['Why might a school want a computer to check messages?', 'There are too many messages for people to read them all.']) });

steps.push(game('game-filter', 'Mission 1: The Filter', 'filter', 'Niran wrote a filter for the class chat. Collect messages from people around the school and test it on your phone.',
  ['Before you play: what kind of unkind message might a word filter miss?', 'Take a few guesses, then test them in the game.']));
steps.push(explain('explain-filter', 'Explain It: Can a Filter Stop It?',
  "In the game, Niran's filter flagged any message with LOSER, UGLY, STUPID or WEIRDO inside it. It flagged harmless messages (\"losers' bracket\", \"stupid slow laptop\") and missed unkind ones (\"l0s3r\", sarcasm, \"everyone except Sam\").",
  { prompt: 'In your own words, explain why a keyword filter cannot catch all cyberbullying.', marks: 2,
    scheme: ['It only checks for blocked words / letters, not what the message means', 'Unkind messages with no blocked word get through (sarcasm, leaving someone out, changed spellings)', 'Harmless messages that contain a blocked word get flagged (false alarms)'],
    guidance: 'Any two points, one mark each, in the student\'s own words. An example counts as the point it shows. "It is not clever enough" alone earns nothing.',
    modelAnswer: 'It only looks for blocked words, not meaning. So "everyone except Sam" gets through, and "losers\' bracket" gets flagged.' },
  ['Why do people have to test a program with real data?', 'Real data has cases the programmer never thought of.']));

steps.push(game('game-spread', 'Mission 2: One Screenshot', 'spread', 'Krit posted a screenshot of Sam. Find out how far one post can travel.',
  ['Before you play: if everyone forwards a post to 2 new people, how fast does it grow?', 'Say a guess, then check it in the game.']));
steps.push(explain('explain-spread', 'Explain It: Why Deleting Is Not Enough',
  'In the game, every person who got the screenshot forwarded it to 2 new people: 1, 3, 7, 15 people, and 255 after 8 steps. Then Krit deleted his post.',
  { prompt: 'In your own words, explain why deleting a post does not stop it spreading.', marks: 2,
    scheme: ['Copies have already been forwarded / saved on other people\'s phones', 'Each person can forward it again, so it keeps spreading (it doubles each step)'],
    guidance: 'One mark for each point, in the student\'s own words. "It is on the internet forever" alone earns 1 mark only if it says copies exist elsewhere.',
    modelAnswer: 'Other people already have copies on their phones, and each of them can forward it again.' },
  ['Why does doubling grow so fast?', 'Each step adds more new people than all the steps before it put together.']));

steps.push(game('game-upstander', 'Mission 3: Be an Upstander', 'upstander', 'The class chat is piling on Sam. Do the right things, in the right order.',
  ['Before you play: what is the difference between a bystander and an upstander?', 'A bystander sees it and does nothing. An upstander does something to help.']));
steps.push(explain('explain-evidence', 'Explain It: Evidence First',
  'In the game, the right order in the chat was: do not reply, save the evidence (a private screenshot), report it, then block, and tell a trusted adult. Blocking before saving lost the messages.',
  { prompt: 'In your own words, explain why you should save the evidence before you block someone.', marks: 2,
    scheme: ['Blocking can hide / remove the messages', 'An adult needs the evidence to see what happened and act on it'],
    guidance: 'One mark for each point, in the student\'s own words. Saving evidence means keeping it privately for an adult; an answer about sharing or posting the screenshot earns nothing.',
    modelAnswer: 'Blocking can hide the messages. An adult needs to see them to help.' },
  ['Why is replying in the chat a bad idea, even to defend someone?', 'It can start an argument and give the people being unkind more attention.']));

steps.push(embed('plenary', 'Plenary: Upstander Drill', 'drill-y9-abw', 'Filters, false alarms and misses, how far posts spread, and what an upstander does. Your progress is saved.',
  ['Why practise with new messages every time?', 'Then you know how the filter works, not just the game\'s messages.']));

steps.push({ id: 'help', label: 'Where to Get Help',
  content: '<h2 class="lesson-h2">Where to Get Help</h2>' + why(['Why is telling an adult not "snitching"?', 'It is how bullying actually stops, and it protects the person being targeted.']) +
    '<p class="lesson-lead">If anything online is worrying you, or someone you know:</p>' +
    '<ul class="lesson-facts"><li>Talk to your <strong>form tutor</strong>, <strong>any teacher you trust</strong>, or the <strong>school counsellor</strong>.</li>' +
    '<li><strong>Save</strong> the messages, <strong>report</strong> and <strong>block</strong>. Do not reply.</li><li>You will not get in trouble for telling.</li></ul>' });

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
[['UPSTANDER', 'upstander', '"UPSTANDER"'], ['9']].forEach((ys, i) => ys.forEach((y) => assert(T('do-now', i, y), 'do-now ' + i + ' rejects ' + y)));
['Upstander', 'UPSTANDER9'].forEach((n) => assert(!T('do-now', 1, n), 'do-now 1 accepts ' + n));
assert(T('do-now-2', 0, '3') && !T('do-now-2', 0, '4') && !T('do-now-2', 0, '2'), 'do-now-2 marking');
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
steps.filter((s) => s.walkthrough).forEach((s) => V(s.id).forEach((v, i) => s.walkthrough.steps.forEach((w, n) => assert(!new RegExp(v.pattern.source, 'i').test(plain(w.text)), `${s.id} walkthrough ${n} gives part ${i}`))));
assert(!/UPSTANDER|\b9\b/.test(JSON.stringify(steps[0].walkthrough)), 'Do Now 1 walkthrough shows the answer');
assert(!/\b3\b/.test(JSON.stringify(steps[1].walkthrough)), 'Do Now 2 walkthrough shows the answer');
GAMES.forEach((id) => { const i = steps.findIndex((s) => s.id === id); assert(steps[i + 1].type === 'self-marked-response' && steps[i + 1].items[0].aiModel === 'haiku', id + ' is followed by a Haiku Explain It'); });
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// safeguarding: nothing asks about the student's own experiences
assert(!/\b(have you ever|your own experience|tell us about a time|happened to you|were you)\b/i.test(JSON.stringify(steps)), 'a slide asks about the student\'s own life');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

// ---------------------------------------------------------------- plenary drill
const POOL = [
  ['nice goal today!', false], ['you are so stupid', true], ['this game is stupid hard', false], ['nobody wants you here', true],
  ['ur so ugIy', true], ['the ugly sweater party is friday', false], ['go away weirdo', true], ['what a weird day', false],
  ['everyone sit together except Ben', true], ['great work on the project', false], ['l0ser', true], ['our team was the biggest loser at quiz night, lol', false],
];
POOL.forEach(([t]) => assert(!/[–—]/.test(t), 'dash in pool'));
const INJECT = { POOL };
function abwCards() {
  var BLOCKED = ["LOSER", "UGLY", "STUPID", "WEIRDO"];
  function flagged(t) { var u = t.toUpperCase(); return BLOCKED.some(function (w) { return u.indexOf(w) >= 0; }); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var POOL = [] /*POOL*/;
  var YES = /^\s*(yes|y|flagged|it is flagged)\s*\.?\s*$/i, NO = /^\s*(no|n|passed|not flagged|it passes)\s*\.?\s*$/i;
  var RULE = "The filter flags a message if LOSER, UGLY, STUPID or WEIRDO is anywhere inside it (after UCASE).";
  function flagCard() {
    var p = drillPick(POOL), f = flagged(p[0]);
    return { prompt: RULE + ' Is "' + p[0] + '" flagged? Type yes or no.', answers: [f ? "yes" : "no"], keywords: [f ? YES : NO], distractors: [f ? "no" : "yes"],
      working: ["Change the whole message to capitals first.", "Look for each blocked word anywhere inside it, even inside a longer word."],
      note: '"' + p[0].toUpperCase() + '" ' + (f ? "contains a blocked word." : "contains none of the blocked words.") };
  }
  var V = { right: /^\s*(right|correct)\s*\.?\s*$/i, alarm: /^\s*(a\s+)?false\s*alarm\s*\.?\s*$/i, miss: /^\s*(a\s+)?miss(ed)?\s*\.?\s*$/i };
  function verdictCard() {
    var p = drillPick(POOL), f = flagged(p[0]), k = f === p[1] ? "right" : f ? "alarm" : "miss", word = { right: "Right", alarm: "False alarm", miss: "Missed" };
    return { prompt: RULE + ' "' + p[0] + '" is ' + (p[1] ? "unkind" : "not unkind") + '. Did the filter get it right, raise a false alarm, or miss it? Type right, false alarm or missed.',
      answers: [word[k]], keywords: [V[k]], distractors: ["Right", "False alarm", "Missed"].filter(function (x) { return x !== word[k]; }),
      working: ["First work out if the filter flags it.", "If flagged and unkind match (both yes or both no), the filter did its job. If not, which mistake did it make?"],
      note: (f ? "Flagged" : "Not flagged") + " and " + (p[1] ? "unkind" : "not unkind") + "." };
  }
  function spreadCard() {
    var n = rnd(3, 8), v = Math.pow(2, n) - 1;
    return { prompt: "Step 1: one person posts a screenshot. At every step, everyone who just got it forwards it to 2 new people. How many people have it after step " + n + "?",
      answers: [String(v)], keywords: [new RegExp("^\\s*" + v + "\\s*(people)?\\s*\\.?\\s*$", "i")], distractors: drillWrongNumbers(v, [Math.pow(2, n), 2 * n, Math.pow(2, n - 1), v - 1], 3),
      working: ["Write down the new people at each step: 1, 2, 4, 8 ...", "Add up all the new people, one step at a time."],
      note: "1 + 2 + 4 + ... doubling for " + n + " steps gives " + v + "." };
  }
  function word(id, prompt, answer, re, distractors, working, note) { return { id: id, category: "ab-words", prompt: prompt, answers: [answer], keywords: [re], distractors: distractors, working: working, note: note }; }
  function why(id, prompt, answer, distractors, note, working) { return { id: id, category: "ab-why", prompt: prompt, answers: [answer], distractors: distractors, note: note, working: working, pickThenType: true }; }
  return [
    { id: "ab-01", category: "ab-filter", randomize: flagCard },
    { id: "ab-02", category: "ab-filter", randomize: flagCard },
    { id: "ab-03", category: "ab-filter", randomize: verdictCard },
    { id: "ab-04", category: "ab-filter", randomize: verdictCard },
    { id: "ab-05", category: "ab-spread", randomize: spreadCard },
    { id: "ab-06", category: "ab-spread", randomize: spreadCard },
    word("ab-07", "Someone sees bullying and does something to help. What are they called?", "Upstander", /^\s*(an\s+)?upstander\s*\.?\s*$/i, ["Bystander", "Moderator"],
      ["Think of the game's title.", "They stand up for the person targeted."], "An upstander acts to help; a bystander watches and does nothing."),
    word("ab-08", "Someone sees bullying and does nothing. What are they called?", "Bystander", /^\s*(a\s+)?bystander\s*\.?\s*$/i, ["Upstander", "Reporter"],
      ["They are standing by.", "They watch but do not help."], "A bystander watches; an upstander helps."),
    word("ab-09", "When you see cyberbullying in a chat, what should you do before you block anyone?", "Save the evidence", /^\s*(save|keep|screenshot)\b.*\b(evidence|messages?|screenshot|it)\b|^\s*screenshot\s*(it)?\s*\.?\s*$/i, ["Reply to them", "Forward it to friends"],
      ["Blocking can hide the messages.", "What would an adult need to see?"], "Save the evidence first (privately), then report and block, and tell a trusted adult."),
    why("ab-10", "Why can a keyword filter not catch all cyberbullying?", "It checks for words, not what a message means",
      ["It runs too slowly", "It only works in capitals", "It cannot read long messages"], "\"everyone except Sam\" has no blocked word, but it leaves Sam out.", ["What does the filter actually look for?", "Can an unkind message use only kind words?"]),
    why("ab-11", "Why does deleting a post not stop it spreading?", "Other people already have copies they can forward",
      ["Deleted posts come back after a day", "The app keeps the original", "Only the first person can forward it"], "Copies on other phones stay, and each can be forwarded again.", ["Where else is the post now?", "Can those people still send it?"]),
    why("ab-12", "Why should you not reply to a pile-on in a chat?", "Replying can make it worse and gives it more attention",
      ["Replies are always deleted", "It uses up your data", "The filter will flag you"], "Do not reply: save, report, block and tell an adult.", ["What happens when people get a reaction?", "What would help the person targeted more?"]),
    why("ab-13", "Why is telling a trusted adult important?", "An adult can act to stop it and protect the person targeted",
      ["It gets the bullies in trouble online", "Adults can delete every copy", "Then you do not need to save evidence"], "Adults can step in, and you will not get in trouble for telling.", ["Who can actually stop it?", "What can a student not do alone?"]),
  ];
}
{
  let body = abwCards.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  const src = `// Year 9 Anti-Bullying Week: plenary drill (filter, spread, upstander words, why).\n// Loaded by Drills/index.html?drill=y9-abw\n// Generated by tools/build_y9_abw.mjs: edit that, then run it.\n` +
    `DrillData.register("y9-abw", {\n  title: "Year 9: Can Code Stop Cyberbullying?",\n  subtitle: "Anti-Bullying Week",\n  categories: [\n    ["ab-filter", "The Filter"],\n    ["ab-spread", "How Far It Spreads"],\n    ["ab-words", "Upstanders"],\n    ["ab-why", "Why It Matters"]\n  ],\n  cards: (${body})()\n});\n`;
  assert(!/[–—]|&mdash;|&ndash;/.test(src), 'dash in drill');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', 'y9-abw.js'), src);
  // draw every card many times: own answer passes and is right, distractors fail, working never gives the answer
  const vm = await import('node:vm');
  const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
  vm.runInContext(src, ctx);
  const d = ctx.out;
  assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), 'card categories');
  for (const card of d.cards) for (let n = 0; n < (card.randomize ? 300 : 1); n++) {
    const r = card.randomize ? { ...card, ...card.randomize() } : card, ans = String(r.answers[0]);
    assert(r.working && r.working.length >= 2 && r.distractors.length >= 1, card.id + ' working and distractors');
    if (r.pickThenType) { assert(!r.distractors.includes(ans), card.id + ' answer is a distractor'); continue; }
    const pass = (s) => r.keywords.some((k) => k.test(s));
    assert(pass(ans) && pass(ans.toLowerCase()), card.id + ': own answer fails: ' + ans);
    r.distractors.forEach((x) => assert(!pass(x), card.id + ': distractor passes: ' + x));
    let m;
    if ((m = /Is "(.*)" flagged\?/.exec(r.prompt))) assert(ans === (flagged(m[1]) ? 'yes' : 'no'), card.id + ' flag ' + m[1]);
    if ((m = /^.*"(.*)" is (unkind|not unkind)\. Did the filter/.exec(r.prompt))) {
      const v = verdict(flagged(m[1]), m[2] === 'unkind');
      assert(ans === { right: 'Right', 'false-alarm': 'False alarm', missed: 'Missed' }[v], card.id + ' verdict ' + m[1]);
    }
    if ((m = /after step (\d+)\?/.exec(r.prompt))) assert(+ans === 2 ** +m[1] - 1, card.id + ' spread');
    r.working.forEach((w) => assert(!new RegExp('(^|\\W)' + ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\W|$)', 'i').test(w), card.id + ': working shows the answer: ' + w));
  }
  console.log('y9-abw drill: ' + d.cards.length + ' cards');
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify({ steps, validators })), 'dash found');
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify({ id: ID, label: 'Anti-Bullying Week: Can Code Stop Cyberbullying?', steps, validators, pseudocodeValidators: {} }, null, 1) + '\n');

// ---------------------------------------------------------------- register: a Year 9 "Anti-Bullying Week" unit
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw), y9 = data.years.find((y) => y.id === 'year9');
    const at = y9.units.findIndex((u) => u.title === 'Pseudocode and Software Development');
    assert(at >= 0, 'Year 9 pseudocode unit');
    y9.units.splice(at + 1, 0, { code: '', title: 'Anti-Bullying Week', lessons: [ID] });
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
  }
}
console.log(`${ID}: ${steps.length} steps`);
