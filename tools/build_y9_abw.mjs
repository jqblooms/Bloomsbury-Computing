// Builds LessonData/y9-abw.json: Year 9, Anti-Bullying Week: Be an Upstander Online (James, 2026-11-16).
//   node tools/build_y9_abw.mjs
// It also writes the drills Drills/data/y9-abw.js (plenary) and y9-abw-ext.js (Do Now Extension), and adds an
// "Anti-Bullying Week" unit to Year 9 in lessons.json (after Pseudocode and Software Development).
// James: an online safety lesson, not a coding one ("don't force code where it doesn't belong"); fully suitable for
// Year 9 (13 to 14) and local norms; no staff or student names anywhere. So: no pseudocode, no names on any slide
// or in any drill (people are "a classmate", "the new student"), and the game draws its names at random each visit.
// The teaching is Upstander Lab 3D (pages UpstanderLab3D/, registry upstander-lab-3d), one mission per slide
// (?lesson=abw&mission=...), each followed by an own-words Explain It marked by Haiku (policy 2b).
// Safeguarding (a British school in Thailand with a UK-style safeguarding team: DSL and deputies): nothing asks about
// the student's own experiences; the last slide says where to get help by role only (form tutor, Head of Secondary, the
// DSL and deputies, someone at home) and says plainly that staff pass concerns on to the safeguarding team, so no
// slide promises secrecy.
// The Do Now is an online safety starter (the week's lesson stands apart from the scheme of work), so nothing is cited.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { flagged, verdict } from '../UpstanderLab3D/js/filter.js';
import { NAME_POOL } from '../UpstanderLab3D/js/story.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-abw', P = 'y9abw';
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
// James, 2026-11-16: "This lesson needs to be independent, completed without teacher intervention." So, as y10-3-1-l3
// (built to be done alone): no Think, Pair, Share (it is teacher-led), and every slide says what to do and when it is
// done. Support is signposted at the start as well as the end, because no adult is watching the room.
const todo = (t, done) => `<p class="lesson-lead"><strong>What to do:</strong> ${t}${done ? ' <strong>Done</strong> when ' + done : ''}</p>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
// The one exception to "save the evidence" (UK guidance on nude and sexual images of under-18s): never keep or share it.
const IMAGE_RULE = 'If it is a nude or sexual picture of anyone under 18, do not screenshot, save or forward it: tell a trusted adult straight away.';
// What Haiku does if a student writes about a real person or themselves (the lesson is done alone, so nobody reads the
// answer straight away): no marking, just a pointer to an adult. Added to every Explain It's guidance.
const DISCLOSURE = ' If the answer describes a real person, a real event or the student\'s own experience instead of the game, do not mark or comment on it: award 0 and reply only "Thank you. Please talk to your form tutor or the safeguarding team about this today."';
const SUPPORT = 'If anything in this lesson worries or upsets you, you can stop and talk to an adult you trust: your form tutor, your Head of Secondary or the safeguarding team.';

const steps = [];
function mcStep(id, label, items, todoText, done) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid, content: `<h2 class="lesson-h2">${label}</h2>` + todo(todoText, done) + `<div id="${cid}"></div>`, items };
}
function embed(id, label, appId, todoText, done, query) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + todo(todoText, done) + `<div id="${P}-${id}"></div>` }, query ? { embedQuery: query } : {});
}
const GAMES = [];
const CONTROLS = 'Walk with <strong>W A S D</strong> or the arrow keys, press <strong>Space</strong> to talk, <strong>1 2 3</strong> to choose, <strong>P</strong> for your phone. The <strong>!</strong> shows who to talk to next. Press <strong>Full screen</strong> for the best view.';
function game(id, label, mission, story) {
  GAMES.push(id);
  return embed(id, label, 'upstander-lab-3d', story + ' ' + CONTROLS, 'the game says <strong>Mission complete</strong>. Then press Next.', `lesson=abw&mission=${mission}`);
}
function explain(id, label, about, part) {
  return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` +
      todo('explain it in your own words, then press <strong>Check my answer</strong>. Read the feedback, improve your answer and check again.', 'you have full marks, or you have pressed <strong>Submit answer</strong> and marked it against the model answer.') +
      '<p class="lesson-lead small">Only write about the game here, not about yourself or anyone you know. ' + SUPPORT + '</p>' + `<div id="${P}-${id}"></div>`,
    items: [Object.assign({ id: `${id}-q`, aiModel: 'haiku', context: about + ' ' + part.prompt }, part, { guidance: part.guidance + DISCLOSURE })] };
}

// ---------------------------------------------------------------- Do Now: an online safety starter
steps.push(mcStep('do-now', 'Do Now: Is It Cyberbullying? (1 of 2)', [
  { prompt: 'A classmate shares an embarrassing photo of someone in a group chat, and others add laughing faces. Is this cyberbullying?',
    options: ['Yes: it is shared to hurt, and others join in', 'No: it is only a photo', 'No: nobody typed anything unkind'], correct: 0,
    explain: 'Sharing something to embarrass someone, with others joining in, is cyberbullying even without unkind words.' },
  { prompt: 'Two friends tease each other about a football match in a chat, and both of them find it funny. Is this cyberbullying?',
    options: ['Yes: any teasing online is bullying', 'No: both are joking, and both find it funny', 'Yes: it happened in a chat'], correct: 1,
    explain: 'Friendly teasing that both people enjoy is not bullying. It becomes bullying when it is meant to hurt, or keeps going when someone is upset.' },
], 'read each situation and choose the best answer. Stuck? Press <strong>Walk me through it</strong>.', 'you have answered both questions and read why.'));
steps[0].walkthrough = { title: 'Walk me through it: is it cyberbullying?', steps: [
  { text: '<strong>A similar situation.</strong> A student keeps posting comments under a classmate\'s videos saying the videos are rubbish.', visual: note('comment after comment') },
  { text: `Ask: is it ${kw('meant to hurt')}? Comments saying someone's work is rubbish, again and again, are meant to upset.`, visual: note('meant to hurt?') },
  { text: `Ask: is it ${kw('repeated')}, or ${kw('shared')} with others? Here it happens again and again, where everyone can see.`, visual: note('again and again, in public') },
  { text: `Ask: does the other person ${kw('find it funny')} too? The classmate is not laughing.`, visual: note('only one side is laughing') },
  { text: 'Meant to hurt, repeated and public, and not funny for both: this is cyberbullying.', visual: note('yes, cyberbullying') },
  { text: 'Now ask the same three questions about each situation on the slide.', visual: note('meant to hurt? &nbsp; repeated or shared? &nbsp; funny for both?') },
] };
steps.push(mcStep('do-now-2', 'Do Now: What Should You Do? (2 of 2)', [
  { prompt: 'Someone you do not know messages you and asks for a photo of you. What should you do?',
    options: ['Reply and ask who they are', 'Send a photo that does not show your face', 'Send nothing: save the chat, report, block, tell an adult'], correct: 2,
    explain: 'Never send photos to people you do not know. Do not reply or send anything. Save the chat, report and block them, and tell a trusted adult.' },
  { prompt: 'An account posts something unkind about you. What is the best first step?',
    options: ['Post something unkind back', 'Save the evidence before you do anything else', 'Delete your own account'], correct: 1,
    explain: 'Save the evidence first, privately. Then report, block, and tell a trusted adult. ' + IMAGE_RULE },
], 'choose the best first step for each situation. Stuck? Press <strong>Walk me through it</strong>.', 'you have answered both questions and read why.'));
steps[1].walkthrough = { title: 'Walk me through it: what should you do?', steps: [
  { text: '<strong>A similar situation.</strong> Someone keeps sending you unkind comments in a game chat.', visual: note('unkind game chat messages') },
  { text: `First, ${kw('do not reply')}. A reply can start an argument and make it worse.`, visual: note('1. do not reply') },
  { text: `Next, ${kw('save the evidence')}: a private screenshot to show an adult, never to share.`, visual: note('2. save it privately') },
  { text: `Then ${kw('report')} it in the game, and ${kw('block')} the sender.`, visual: note('3. report and block') },
  { text: `Last, ${kw('tell a trusted adult')}, so it can be stopped.`, visual: note('4. tell an adult') },
  { text: 'Now choose the answer on the slide that matches the safest first step.', visual: note('safest first step?') },
] };
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-abw-ext', '<strong>Extension, if you have time:</strong> decide what to do in each online safety situation.', 'you have tried a few cards. You can move on whenever you are ready.'));

// ---------------------------------------------------------------- title and the game
// The title slide carries the content note and the support routes up front: nobody is in the room to notice.
steps.push({ id: 'title', label: 'Be an Upstander Online',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Anti-Bullying Week</p><h2 class="lesson-h2">Be an Upstander Online</h2><p>Year 9</p></div>' +
    '<p class="lesson-lead"><strong>Today:</strong> what apps can and cannot stop, how fast a post spreads, and what an upstander does. You work through this lesson on your own: every slide says what to do, about how long it takes, and when you are done. The whole lesson takes about 55 minutes. Finished early? Try the <strong>Extension</strong> slides near the end.</p>' +
    '<p class="lesson-lead"><strong>Before you start:</strong> this lesson is about bullying online. ' + SUPPORT + ' You will not get in trouble for telling.</p>' +
    todo('read this slide, then press Next.') });

steps.push(game('game-filter', 'Mission 1: The Filter', 'filter', 'The class chat app hides messages with banned words. Collect messages from people around the school and test the filter on your phone.'));
steps.push(explain('explain-filter', 'Explain It: Can a Filter Stop It?',
  'In the game, the class chat app hid any message with LOSER, UGLY, STUPID or WEIRDO inside it. It hid harmless messages ("losers\' bracket", "stupid slow laptop") and let unkind ones through ("l0s3r", sarcasm, "everyone come to football, except" one person).',
  { prompt: 'In your own words, explain why a banned-word filter cannot stop all cyberbullying.', marks: 2,
    scheme: ['It only checks for banned words, not what the message means', 'Unkind messages with no banned word get through (sarcasm, leaving someone out, changed spellings)', 'Harmless messages that contain a banned word get hidden (false alarms)'],
    guidance: 'Any two points, one mark each, in the student\'s own words. An example counts as the point it shows. "It is not clever enough" alone earns nothing.',
    modelAnswer: 'It only looks for banned words, not meaning. So leaving someone out gets through, and "losers\' bracket" gets hidden.' }));

steps.push(game('game-spread', 'Mission 2: One Screenshot', 'spread', 'A classmate shared a screenshot of someone. Find out how far one post can travel.'));
steps.push(explain('explain-spread', 'Explain It: Why Deleting Is Not Enough',
  'In the game, every person who got the screenshot forwarded it to 2 new people: 1, 3, 7, 15 people, and 255 after 8 steps. Then the person who shared it first deleted their post.',
  { prompt: 'In your own words, explain why deleting a post does not stop it spreading.', marks: 2,
    scheme: ['Copies have already been forwarded / saved on other people\'s phones', 'Each person can forward it again, so it keeps spreading'],
    guidance: 'One mark for each point, in the student\'s own words. "It is on the internet forever" alone earns 1 mark only if it says copies exist elsewhere.',
    modelAnswer: 'Other people already have copies on their phones, and each of them can forward it again.' }));

steps.push(game('game-upstander', 'Mission 3: Be an Upstander', 'upstander', 'The class chat is ganging up on someone. Do the right things, in the right order.'));
steps.push(explain('explain-evidence', 'Explain It: Evidence First',
  'In the game, the right order in the chat was: do not reply, save the evidence (a private screenshot), report it, then block, and tell a trusted adult. The game would not let you block before saving, because blocking can hide the messages.',
  { prompt: 'In your own words, explain why you should save the evidence before you block someone.', marks: 2,
    scheme: ['Blocking can hide / remove the messages', 'An adult needs the evidence to see what happened and act on it'],
    guidance: 'One mark for each point, in the student\'s own words. Saving evidence means keeping it privately for an adult; an answer about sharing or posting the screenshot earns nothing.',
    modelAnswer: 'Blocking can hide the messages. An adult needs to see them to help.' }));

steps.push(embed('plenary', 'Plenary: Upstander Drill', 'drill-y9-abw', 'answer the cards on filters, how far posts spread, and what an upstander does. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.',
  'you have mastered every card (3 right in a row), or 5 minutes before the end of the lesson. Then press Next: <strong>Where to Get Help</strong> comes next.'));

// The help slide comes straight after the plenary, before the extensions, so every student reaches it (review: many
// would stop at the end of the plenary and never see it).
steps.push({ id: 'help', label: 'Where to Get Help',
  content: '<h2 class="lesson-h2">Where to Get Help</h2>' + todo('read this slide before you finish.', 'you have read it. That is the end of the main lesson: if you still have time, try the Extension slides next.') +
    '<p class="lesson-lead">If anything online is worrying you, or someone you know:</p>' +
    '<ul class="lesson-facts"><li>Talk to <strong>any adult in school</strong> you trust: your <strong>form tutor</strong>, your <strong>Head of Secondary</strong>, or the <strong>safeguarding team</strong> (the <strong>Designated Safeguarding Lead</strong> and the deputies). Or talk to someone at home.</li>' +
    '<li>Staff will listen, and they will pass what you tell them to the safeguarding team so you get the right help.</li>' +
    '<li><strong>Save</strong> the messages, <strong>report</strong> and <strong>block</strong>. Do not reply. You can tell an adult even if you have not saved anything.</li>' +
    '<li>' + IMAGE_RULE + '</li><li>You will not get in trouble for telling.</li></ul>' });

// ---------------------------------------------------------------- extensions for fast finishers (James: the lesson must
// fill 55 minutes, with appropriate extensions available)
steps.push(game('ext-challenge', 'Extension: The Squad Chat Challenge', 'challenge', '<strong>Extension, if you finish early.</strong> A new student is being left out of a game squad chat. This time there are no hints and no <strong>!</strong>: work out what to do yourself. Aim for 3 stars.'));
steps.push(explain('ext-design', 'Extension: Design a Safer App',
  'This extension asks students to suggest an app feature that could help reduce cyberbullying and to explain one limitation of it. In the game they met a banned-word filter (false alarms and misses), forwarding (copies spread fast), and saving evidence, reporting and blocking.',
  { prompt: 'Suggest one feature a chat app could add to help stop cyberbullying. Explain how it would help, and one limitation it would have.', marks: 3,
    scheme: ['A sensible feature (for example a report button, a "pause before posting" prompt, limits on forwarding, human moderators, privacy settings for who can message or add you)',
      'How the feature helps (what it prevents or makes easier, linked to the feature)',
      'A limitation of that feature (for example people can get round it, it can raise false alarms, it relies on someone reporting, it cannot understand meaning, it can be slow)'],
    guidance: 'One mark for each point, in the student\'s own words. The limitation must be about the feature they suggested. A feature that harms privacy or punishes people without checking (for example "read everyone\'s messages", "ban anyone reported") earns the feature mark only if the student also names that problem as its limitation.',
    modelAnswer: 'A "pause before posting" prompt when a message looks unkind. It gives people a moment to change their mind. But it cannot spot unkind messages that use kind words.' }));

// The title slide, with its content note and support routes, comes first: before the Do Now, which is already about
// bullying (the lesson is done alone, so nobody else can give that warning).
steps.unshift(steps.splice(steps.findIndex((s) => s.id === 'title'), 1)[0]);

// How long each slide takes a Year 9 working alone (James: a full 55-minute lesson, with extensions). Shown on every
// slide's What to do line. Core route about 55 minutes; extensions are for fast finishers.
const MINS = { title: 2, 'do-now': 3, 'do-now-2': 3, 'game-filter': 11, 'explain-filter': 4, 'game-spread': 7, 'explain-spread': 4,
  'game-upstander': 10, 'explain-evidence': 4, plenary: 6, help: 1, 'do-now-ext': 5, 'ext-challenge': 8, 'ext-design': 6 };
const EXTENSIONS = ['do-now-ext', 'ext-challenge', 'ext-design'];
for (const s of steps) {
  assert(MINS[s.id], 'no time for ' + s.id);
  s.content = s.content.replace('<strong>What to do:</strong>', `<strong>What to do</strong> (about ${MINS[s.id]} minute${MINS[s.id] === 1 ? '' : 's'}${EXTENSIONS.includes(s.id) ? ', extension' : ''}):`);
}
{
  const core = steps.filter((s) => !EXTENSIONS.includes(s.id)).reduce((t, s) => t + MINS[s.id], 0);
  const ext = EXTENSIONS.reduce((t, id) => t + MINS[id], 0);
  assert(core >= 52 && core <= 58, 'core route is ' + core + ' minutes, not about 55');
  assert(ext >= 15, 'extensions give fast finishers ' + ext + ' minutes');
  console.log(`timing: core ${core} minutes, extensions ${ext} more`);
}

// ---------------------------------------------------------------- self-checks
assert(steps[0].id === 'title', 'the content note comes first');
assert(steps.findIndex((s) => s.id === 'help') === steps.findIndex((s) => s.id === 'plenary') + 1, 'help comes straight after the plenary, before the extensions');
assert(steps.slice(steps.findIndex((s) => s.id === 'help') + 1).every((s) => /Extension/.test(s.label)), 'only extensions after the help slide');
assert(/nude or sexual/.test(steps.find((s) => s.id === 'help').content), 'the help slide has the image rule');
steps.filter((s) => s.type === 'self-marked-response').forEach((s) => assert(/do not mark or comment on it/.test(s.items[0].guidance), s.id + ' has no disclosure rule for Haiku'));
assert(!/save the evidence (on your phone )?first, so you can show/i.test(JSON.stringify(steps)), 'telling an adult made to wait for evidence');
GAMES.forEach((id) => { const i = steps.findIndex((s) => s.id === id); assert(steps[i + 1].type === 'self-marked-response' && steps[i + 1].items[0].aiModel === 'haiku', id + ' is followed by a Haiku Explain It'); });
// done alone: every slide says what to do, nothing needs a teacher (no Think, Pair, Share, no "your teacher")
for (const s of steps) {
  assert(/<strong>What to do<\/strong> \(about \d+ minutes?(, extension)?\):/.test(s.content), 'no What to do (with its time) on ' + s.id);
  assert(!/lesson-tps|your teacher|ask (the|your) teacher|teacher will/i.test(s.content), s.id + ' needs a teacher');
}
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => assert(s.items.length <= 2, s.id + ' has more than two questions'));
// support is signposted before any content about bullying, and on every Explain It
assert(/stop and talk to an adult you trust/.test(steps.find((s) => s.id === 'title').content), 'support on the title slide');
steps.filter((s) => s.type === 'self-marked-response').forEach((s) => assert(/not about yourself/.test(s.content) && /safeguarding team/.test(s.content), s.id + ' support note'));
assert(new Set(steps.filter((s) => s.items && s.type === 'multiple-choice').flatMap((s) => s.items.map((it) => it.correct))).size > 1, 'MC correct positions vary');
const all = JSON.stringify(steps);
// safeguarding and James's rules: nothing about the student's own life, no names, no code
assert(!/\b(have you ever|your own experience|tell us about a time|happened to you|were you)\b/i.test(all), 'a slide asks about the student\'s own life');
for (const n of NAME_POOL.concat(['Niran', 'Leo', 'Mali', 'Ava', 'Krit', 'Ploy', 'Ben', 'Sam'])) assert(!new RegExp('\\b' + n + '\\b').test(all), 'a name on a slide: ' + n);
assert(!/DECLARE|ENDIF|pseudocode|UCASE|LENGTH\(|coding/.test(all), 'code in the online safety lesson');
assert(!/\b(secret|keep it between us|won.t tell anyone|confidential)\b/i.test(all), 'a slide promises secrecy');
assert(/Designated Safeguarding Lead/.test(steps.find((s) => s.id === 'help').content), 'the help slide names the safeguarding team');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');

// ---------------------------------------------------------------- drills (plenary and Do Now Extension)
const POOL = [
  ['nice goal today!', false], ['you are so stupid', true], ['this game is stupid hard', false], ['nobody wants you here', true],
  ['ur so ugIy', true], ['my handwriting is so ugly today lol', false], ['go away weirdo', true], ['what a weird day', false],
  ['everyone sit together except the new student', true], ['great work on the project', false], ['l0ser', true], ['our team was the biggest loser at quiz night, lol', false],
];
const SITUATIONS = [
  ['A stranger online asks for a photo of you.', 'Send nothing: save the chat, report, block and tell an adult', ['Send a photo without your face', 'Ask them to prove who they are']],
  ['A group chat is ganging up on a classmate.', 'Do not join in: save the evidence, report it and tell an adult', ['Add a laughing face so you fit in', 'Leave the chat and forget about it']],
  ['Someone sends you an embarrassing photo of a classmate.', 'Do not forward it, and tell an adult', ['Forward it to one close friend', 'Post it so the classmate sees it']],
  ['You see a classmate is upset after unkind comments online.', 'Check they are OK and help them tell an adult', ['Tell them to ignore it', 'Ask what they did to cause it']],
  ['A friend wants your password to help you in a game.', 'Do not share it, even with friends', ['Share it if they promise not to tell', 'Write it in the group chat']],
  ['A new student is being left out of a game squad on purpose.', 'Invite them in and tell an adult about the chat', ['Say they should practise more', 'Stay out of it']],
];
const INJECT = { POOL, SITUATIONS };
function abwCards(which) {
  var BLOCKED = ["LOSER", "UGLY", "STUPID", "WEIRDO"];
  function flagged(t) { var u = t.toUpperCase(); return BLOCKED.some(function (w) { return u.indexOf(w) >= 0; }); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  var POOL = [] /*POOL*/, SITUATIONS = [] /*SITUATIONS*/;
  var YES = /^\s*(yes|y|hidden|it is hidden)\s*\.?\s*$/i, NO = /^\s*(no|n|not hidden|let through|it gets through)\s*\.?\s*$/i;
  var RULE = "The chat app hides a message if LOSER, UGLY, STUPID or WEIRDO is anywhere inside it, in any capitals.";
  function flagCard() {
    var p = drillPick(POOL), f = flagged(p[0]);
    return { prompt: RULE + ' Is "' + p[0] + '" hidden? Type yes or no.', answers: [f ? "yes" : "no"], keywords: [f ? YES : NO], distractors: [f ? "no" : "yes"],
      working: ["Read the message in capitals.", "Look for each banned word anywhere inside it, even inside a longer word."],
      note: '"' + p[0].toUpperCase() + '" ' + (f ? "contains a banned word." : "contains none of the banned words.") };
  }
  var V = { right: /^\s*(right|correct)\s*\.?\s*$/i, alarm: /^\s*(a\s+)?false\s*alarm\s*\.?\s*$/i, miss: /^\s*(a\s+)?miss(ed)?\s*\.?\s*$/i };
  function verdictCard() {
    var p = drillPick(POOL), f = flagged(p[0]), k = f === p[1] ? "right" : f ? "alarm" : "miss", word = { right: "Right", alarm: "False alarm", miss: "Missed" };
    return { prompt: RULE + ' "' + p[0] + '" is ' + (p[1] ? "unkind" : "not unkind") + '. Did the filter get it right, raise a false alarm, or miss it? Type right, false alarm or missed.',
      answers: [word[k]], keywords: [V[k]], distractors: ["Right", "False alarm", "Missed"].filter(function (x) { return x !== word[k]; }),
      working: ["First work out if the filter hides it.", "If hidden and unkind match (both yes or both no), the filter did its job. If not, which mistake did it make?"],
      note: (f ? "Hidden" : "Let through") + " and " + (p[1] ? "unkind" : "not unkind") + "." };
  }
  function spreadCard() {
    var n = rnd(3, 8), v = Math.pow(2, n) - 1;
    return { prompt: "Step 1: one person shares a screenshot. At every step, everyone who just got it forwards it to 2 new people. How many people have it after step " + n + "?",
      answers: [String(v)], keywords: [new RegExp("^\\s*" + v + "\\s*(people)?\\s*\\.?\\s*$", "i")], distractors: drillWrongNumbers(v, [Math.pow(2, n), 2 * n, Math.pow(2, n - 1), v - 1], 3),
      working: ["Write down the new people at each step: 1, 2, 4, 8 ...", "Add up all the new people, one step at a time."],
      note: "1 + 2 + 4 + ... doubling for " + n + " steps gives " + v + "." };
  }
  function situation(s, i) {
    return { id: "sx-" + (i + 1), category: "sx-what", prompt: s[0] + " What is the best thing to do?", answers: [s[1]], distractors: s[2], pickThenType: true,
      working: ["Which choice keeps everyone safest?", "Does it involve a trusted adult?"], note: s[1] + "." };
  }
  function word(id, prompt, answer, re, distractors, working, note) { return { id: id, category: "ab-words", prompt: prompt, answers: [answer], keywords: [re], distractors: distractors, working: working, note: note }; }
  function why(id, prompt, answer, distractors, note, working) { return { id: id, category: "ab-why", prompt: prompt, answers: [answer], distractors: distractors, note: note, working: working, pickThenType: true }; }
  if (which === "ext") return SITUATIONS.map(situation).concat([
    word("sx-7", "Someone sees bullying and does something to help. What are they called?", "Upstander", /^\s*(an\s+)?upstander\s*\.?\s*$/i, ["Bystander", "Moderator"],
      ["They stand up for the person targeted.", "It is the opposite of a bystander."], "An upstander acts to help; a bystander watches and does nothing."),
    word("sx-8", "Before you block someone who is being unkind, what should you do first?", "Save the evidence", /^\s*(save|keep|screenshot)\b.*\b(evidence|messages?|screenshot|it)\b|^\s*screenshot\s*(it)?\s*\.?\s*$/i, ["Reply to them", "Forward it to friends"],
      ["Blocking can hide the messages.", "What would an adult need to see?"], "Save the evidence first (privately), then report and block, and tell a trusted adult. Never save or share a nude or sexual picture of anyone under 18: tell an adult instead.")
  ]).map(function (c) { if (c.category === "ab-words") c.category = "sx-words"; return c; });
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
      ["Blocking can hide the messages.", "What would an adult need to see?"], "Save the evidence first (privately), then report and block, and tell a trusted adult. Never save or share a nude or sexual picture of anyone under 18: tell an adult instead."),
    why("ab-10", "Why can a banned-word filter not stop all cyberbullying?", "It checks for words, not what a message means",
      ["It runs too slowly", "It only works in capitals", "It cannot read long messages"], "Leaving someone out uses no banned word, but it is still unkind.", ["What does the filter actually look for?", "Can an unkind message use only kind words?"]),
    why("ab-11", "Why does deleting a post not stop it spreading?", "Other people already have copies they can forward",
      ["Deleted posts come back after a day", "The app keeps the original", "Only the first person can forward it"], "Copies on other phones stay, and each can be forwarded again.", ["Where else is the post now?", "Can those people still send it?"]),
    why("ab-12", "Why should you not reply when a group chat gangs up on someone?", "Replying can make it worse and gives it more attention",
      ["Replies are always deleted", "It uses up your data", "The filter will hide you"], "Do not reply: save, report, block and tell an adult.", ["What happens when people get a reaction?", "What would help the person targeted more?"]),
    why("ab-13", "Why is telling a trusted adult important?", "An adult can act to stop it and protect the person targeted",
      ["It gets the bullies in trouble online", "Adults can delete every copy", "Then you do not need to save evidence"], "Adults can step in, and you will not get in trouble for telling.", ["Who can actually stop it?", "What can a student not do alone?"]),
  ];
}
const DRILLS = [
  ['y9-abw', 'Year 9: Be an Upstander Online', 'plenary', [['ab-filter', 'The Filter'], ['ab-spread', 'How Far It Spreads'], ['ab-words', 'Upstanders'], ['ab-why', 'Why It Matters']]],
  ['y9-abw-ext', 'Year 9: Online Safety Situations', 'ext', [['sx-what', 'What Should You Do?'], ['sx-words', 'Upstanders']]],
];
for (const [id, title, which, cats] of DRILLS) {
  let body = abwCards.toString();
  Object.entries(INJECT).forEach(([k, v]) => { body = body.split(`[] /*${k}*/`).join(JSON.stringify(v)); });
  const src = `// Year 9 Anti-Bullying Week (online safety): ${which === 'ext' ? 'Do Now Extension' : 'plenary'} drill.\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_y9_abw.mjs: edit that, then run it.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: "Anti-Bullying Week",\n  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ],\n  cards: (${body})(${JSON.stringify(which)})\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), 'dash in drill ' + id);
  for (const n of NAME_POOL.concat(['Niran', 'Leo', 'Mali', 'Ava', 'Krit', 'Ploy', 'Ben', 'Sam'])) assert(!new RegExp('\\b' + n + '\\b').test(src.replace(/^\/\/.*$/gm, '')), 'a name in drill ' + id + ': ' + n);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
  // draw every card many times: own answer passes and is right, distractors fail, working never gives the answer
  const vm = await import('node:vm');
  const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
  vm.runInContext(src, ctx);
  const d = ctx.out;
  assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), id + ' card categories');
  assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, id + ' card ids');
  for (const card of d.cards) for (let n = 0; n < (card.randomize ? 300 : 1); n++) {
    const r = card.randomize ? { ...card, ...card.randomize() } : card, ans = String(r.answers[0]);
    assert(r.working && r.working.length >= 2 && r.distractors.length >= 1, card.id + ' working and distractors');
    if (r.pickThenType) { assert(!r.distractors.includes(ans), card.id + ' answer is a distractor'); continue; }
    const pass = (s) => r.keywords.some((k) => k.test(s));
    assert(pass(ans) && pass(ans.toLowerCase()), card.id + ': own answer fails: ' + ans);
    r.distractors.forEach((x) => assert(!pass(x), card.id + ': distractor passes: ' + x));
    let m;
    if ((m = /Is "(.*)" hidden\?/.exec(r.prompt))) assert(ans === (flagged(m[1]) ? 'yes' : 'no'), card.id + ' flag ' + m[1]);
    if ((m = /^.*"(.*)" is (unkind|not unkind)\. Did the filter/.exec(r.prompt))) {
      const v = verdict(flagged(m[1]), m[2] === 'unkind');
      assert(ans === { right: 'Right', 'false-alarm': 'False alarm', missed: 'Missed' }[v], card.id + ' verdict ' + m[1]);
    }
    if ((m = /after step (\d+)\?/.exec(r.prompt))) assert(+ans === 2 ** +m[1] - 1, card.id + ' spread');
    r.working.forEach((w) => assert(!new RegExp('(^|\\W)' + ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\W|$)', 'i').test(w), card.id + ': working shows the answer: ' + w));
  }
  console.log(id + ' drill: ' + d.cards.length + ' cards');
}

assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify({ id: ID, label: 'Anti-Bullying Week: Be an Upstander Online', steps, validators: {}, pseudocodeValidators: {} }, null, 1) + '\n');

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
