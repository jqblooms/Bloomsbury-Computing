// Builds the Year 6 Term 1 Test: the test itself (written into the shell repo's TestBank.gs, between the y6-term1
// markers), the revision drill y6-term1-revision (from tools/y6_term1_kit.js) and the lesson y6-term1-test
// (20 minutes of revision, then a link to the Tests page).
//   node tools/build_y6_term1_test.mjs
// James, 2026-10-08: Year 6 answer with buttons only, every question shows a real Scratch script, prompts are
// short and plain, and the four options of each choice are hinge options (each wrong one is the answer a real
// mistake gives: a repeat counted one more, set read as change, a minus sign missed, x and y mixed up). Part 2 has
// students fix and change real Scratch games: the Scratch Challenges test-fix and test-change
// (assets/js/scratchcheck-challenges-c.js), marked by the share of checks passed. Every answer below comes from
// running the script in the kit's simulator.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- the kit (simulator and drill cards)
const kit = fs.readFileSync(path.join(ROOT, 'tools', 'y6_term1_kit.js'), 'utf8').replace(/\r\n/g, '\n');
const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
const { Y6, CARDS } = vm.runInContext('(function () {\n' + kit + '\nreturn { Y6: Y6, CARDS: CARDS };\n})()', ctx);
const { B, C } = Y6;

// ---------------------------------------------------------------- scripts and their answers
const pos = (x, y) => `x: ${x}, y: ${y}`;
const choice = (q) => Object.assign({ type: 'choice', marks: 1 }, q);

// a1 events: each event runs its own script.
const EVENTS = [[B.flag(), B.set('score', 0)], [B.click(), B.change('score', 1)], [B.key('space'), B.change('score', 5)]];
const a1 = Y6.run(EVENTS, ['flag', 'click', 'click', { key: 'space' }]).vars.score;
assert(a1 === 7, 'a1 ' + a1);

// a2 coordinates.
const MOVE = [[B.flag(), B.goto(-60, 30), B.changex(20), B.changey(-50)]];
const r2 = Y6.run(MOVE, ['flag']);
assert(r2.x === -40 && r2.y === -20, "a2");
// wrong: y sign missed (30 + 50), x and y mixed up (-60 - 50, 30 + 20), both signs missed (-60 - 20, 30 + 50)
const a2opts = [pos(-40, -20), pos(-40, 80), pos(-110, 50), pos(-80, 80)];

// a3 glide then change.
const GLIDE = [[B.flag(), B.goto(100, 0), B.glide(2, -100, 50), B.changey(20)]];
const r3 = Y6.run(GLIDE, ['flag']);
assert(r3.x === -100 && r3.y === 70, 'a3');
// wrong: last block missed, glide added to the start (100 - 100, 0 + 50 + 20), change put on x
const a3opts = [pos(-100, 70), pos(-100, 50), pos(0, 70), pos(-80, 50)];

// a4 repeat, then one block after the loop.
const LOOP = [[B.flag(), B.setx(0), B.repeat(4, [B.changex(15)]), B.changex(10)]];
const a4 = Y6.run(LOOP, ['flag']).x;
assert(a4 === 70, 'a4 ' + a4);
// wrong: one turn too many (85), block after the loop missed (60), the loop counted once (25)

// a5 set and change.
const VARS = [[B.flag(), B.set('score', 2), B.change('score', 3), B.set('score', 4), B.change('score', 1)]];
const a5 = Y6.run(VARS, ['flag']).vars.score;
assert(a5 === 5, 'a5 ' + a5);
// wrong: every block added (10), last block missed (4), second set missed (2 + 3 + 1 = 6)

// a6 if else with >, played four times.
const WIN = [[B.flag(), B.ifThen(C.gt('score', 10), [B.say('You win!')], [B.say('Try again')])]];
const a6 = [8, 10, 11, 15].filter((v) => Y6.run(WIN, ['flag'], { vars: { score: v } }).said === 'You win!').length;
assert(a6 === 2, 'a6 ' + a6);
// wrong: 10 counted as more than 10 (3)

// a7 next costume past the last costume.
const COSTUMES = ['walk1', 'walk2', 'walk3', 'walk4'];
const COS = [[B.flag(), B.costume('walk2'), B.repeat(3, [B.next(), B.wait(0.5)])]];
const a7 = Y6.run(COS, ['flag'], { costumes: COSTUMES }).costume;
assert(a7 === 'walk1', 'a7 ' + a7);
// wrong: no going back after the last costume (walk4), two turns (walk3), back where it started (walk2)

// a8 broadcast: which hat block starts the Apple's new script when score reaches 10.
const STAGE = [B.flag(), B.waitUntil(C.eq('score', 10)), B.broadcast('level 2'), B.backdrop('Level 2')];
const hats = { 'when I receive [level 2]': B.receive('level 2'), 'broadcast [level 2]': null, 'when I receive [game over]': B.receive('game over'), 'when flag clicked': B.flag() };
const starts = (h, score) => !!h && Y6.run([STAGE, [h, B.say('faster')]], ['flag'], { vars: { score } }).said === 'faster';
const a8 = Object.keys(hats).filter((k) => starts(hats[k], 10) && !starts(hats[k], 0));
assert(a8.length === 1 && a8[0] === 'when I receive [level 2]', 'a8 ' + a8);

// a9 the bug: a hit should take 1 life; this script adds one.
const ROCK = (inner) => [[B.flag(), B.set('lives', 3), B.forever([B.ifThen(C.touching('Bowl'), [inner, B.goto(0, 180)])])]];
const hit = (inner) => Y6.run(ROCK(inner), ['flag', { tick: true }, { tick: true, touching: 'Bowl' }, { tick: true }, { tick: true, touching: 'Bowl' }]).vars.lives;
assert(hit(B.change('lives', 1)) === 5, 'a9 bug');
const a9fix = { 'change [lives] by (-1)': B.change('lives', -1), 'set [lives] to (-1)': B.set('lives', -1), 'change [score] by (-1)': B.change('score', -1), 'change [lives] by (0)': B.change('lives', 0) };
const a9 = Object.keys(a9fix).filter((k) => hit(a9fix[k]) === 1);
assert(a9.length === 1 && a9[0] === 'change [lives] by (-1)', 'a9 ' + a9);

// More questions (James, 2026-10-09: the test must last 30 minutes; the Year 7 one was over in 5).
// a10 two loops one after the other.
const LOOPS2 = [[B.flag(), B.set('score', 0), B.repeat(3, [B.change('score', 2)]), B.repeat(2, [B.change('score', 1)])]];
const a10 = Y6.run(LOOPS2, ['flag']).vars.score;
assert(a10 === 8, 'a10 ' + a10);
// wrong: second loop missed (6), each block counted once (3), one turn too many in each loop (4 x 2 + 3 x 1 = 11)

// a11 arrow keys: each key runs its own script.
const ARROWS = [[B.flag(), B.setx(0)], [B.key('right arrow'), B.changex(10)], [B.key('left arrow'), B.changex(-10)]];
const a11 = Y6.run(ARROWS, ['flag', { key: 'right arrow' }, { key: 'right arrow' }, { key: 'left arrow' }, { key: 'right arrow' }]).x;
assert(a11 === 20, 'a11 ' + a11);
// wrong: the left arrow counted as +10 (40), one right press missed (10), the signs swapped (-20)

// a12 an if inside a repeat.
const IFLOOP = [[B.flag(), B.set('lives', 3), B.set('score', 0), B.repeat(5, [B.change('score', 1), B.ifThen(C.gt('score', 3), [B.change('lives', -1)])])]];
const a12 = Y6.run(IFLOOP, ['flag']).vars.lives;
assert(a12 === 1, 'a12 ' + a12);
// wrong: > read as >= (scores 3, 4, 5: 0), the if counted once (2), the if never true (3)

// a13 a second bug: set where change is needed.
const APPLE = (inner) => [[B.flag(), B.set('score', 0), B.forever([B.ifThen(C.touching('Bowl'), [inner, B.goto(0, 180)])])]];
const catches = (inner) => Y6.run(APPLE(inner), ['flag', { tick: true }, { tick: true, touching: 'Bowl' }, { tick: true }, { tick: true, touching: 'Bowl' }, { tick: true, touching: 'Bowl' }]).vars.score;
assert(catches(B.set('score', 1)) === 1, 'a13 bug');
const a13fix = { 'change [score] by (1)': B.change('score', 1), 'set [score] to (0)': B.set('score', 0), 'change [lives] by (1)': B.change('lives', 1), 'change [score] by (-1)': B.change('score', -1) };
const a13 = Object.keys(a13fix).filter((k) => catches(a13fix[k]) === 3);
assert(a13.length === 1 && a13[0] === 'change [score] by (1)', 'a13 ' + a13);

// a14 moving in a repeat.
const STEPS = [[B.flag(), B.goto(0, 0), B.repeat(3, [B.changey(10), B.changex(5)])]];
const r14 = Y6.run(STEPS, ['flag']);
assert(r14.x === 15 && r14.y === 30, 'a14');
// wrong: x and y mixed up, one turn too many, the loop counted once
const a14opts = [pos(15, 30), pos(30, 15), pos(20, 40), pos(5, 10)];

// ---------------------------------------------------------------- the test
const test = {
  id: 'y6-term1', title: 'Year 6 Term 1 Test', subtitle: 'Scratch: events, coordinates, loops, variables, decisions, costumes, messages and bugs', year: 'year6', minutes: 30,
  sections: [
    { title: 'Reading Scripts', questions: [
      choice({ id: 'a1', prompt: 'The player clicks the green flag. Then they click the sprite 2 times and press the space key once. What is score now?', blocks: Y6.text(EVENTS),
        options: ['7', '3', '2', '6'], answer: String(a1), scheme: 'Flag: 0. Two clicks: 1 + 1. Space: + 5. Total 7. (3 counts space as 1; 2 forgets space; 6 counts one click.)' }),
      choice({ id: 'a2', prompt: 'Where is the sprite when this script ends?', blocks: Y6.text(MOVE),
        options: a2opts, answer: pos(r2.x, r2.y), scheme: 'x: -60 + 20 = -40. y: 30 - 50 = -20.' }),
      choice({ id: 'a3', prompt: 'Where is the sprite when this script ends?', blocks: Y6.text(GLIDE),
        options: a3opts, answer: pos(r3.x, r3.y), scheme: 'glide ends at x: -100, y: 50. Then change y by 20 gives y: 70.' }),
      choice({ id: 'a4', prompt: 'What is x when this script ends?', blocks: Y6.text(LOOP),
        options: ['70', '85', '60', '25'], answer: String(a4), scheme: '4 turns of 15 = 60, then + 10 after the loop = 70.' }),
      choice({ id: 'a5', prompt: 'What is score when this script ends?', blocks: Y6.text(VARS),
        options: ['5', '10', '4', '6'], answer: String(a5), scheme: 'The second set gives 4 and throws away 5. Then + 1 = 5.' }),
      choice({ id: 'a6', prompt: 'The game is played 4 times. score is 8, then 10, then 11, then 15. How many times does the sprite say You win!?', blocks: Y6.text(WIN),
        options: ['2', '3', '1', '4'], answer: String(a6), scheme: '11 and 15. 10 is not more than 10.' }),
      choice({ id: 'a7', prompt: 'The sprite has 4 costumes: walk1, walk2, walk3, walk4. Which costume does it show when this script ends?', blocks: Y6.text(COS),
        options: ['walk1', 'walk4', 'walk3', 'walk2'], answer: a7, scheme: 'walk2, then walk3, walk4, and after the last costume back to walk1.' }),
      choice({ id: 'a8', prompt: 'In this Catch game, the Stage runs this script. When score reaches 10, the Apple should fall faster. Which hat block should start the Apple\'s new script?', blocks: Y6.text([STAGE]),
        options: Object.keys(hats), answer: a8[0], scheme: 'broadcast [level 2] sends the message; when I receive [level 2] starts when it arrives.' }),
      choice({ id: 'a9', prompt: 'This is the Rock in a Catch game. When the Rock touches the Bowl, lives should go down by 1. Which block should replace change [lives] by (1)?', blocks: Y6.text(ROCK(B.change('lives', 1))),
        options: Object.keys(a9fix), answer: a9[0], scheme: 'change [lives] by (-1). set would make lives -1 every time; score is the wrong variable; 0 changes nothing.' }),
      choice({ id: 'a10', prompt: 'What is score when this script ends?', blocks: Y6.text(LOOPS2),
        options: ['8', '6', '3', '11'], answer: String(a10), scheme: '3 turns of 2 = 6, then 2 turns of 1 = 2. Total 8.' }),
      choice({ id: 'a11', prompt: 'The player clicks the green flag. Then they press: right arrow, right arrow, left arrow, right arrow. What is x now?', blocks: Y6.text(ARROWS),
        options: ['20', '40', '10', '-20'], answer: String(a11), scheme: '0 + 10 + 10 - 10 + 10 = 20.' }),
      choice({ id: 'a12', prompt: 'What is lives when this script ends?', blocks: Y6.text(IFLOOP),
        options: ['1', '0', '2', '3'], answer: String(a12), scheme: 'score goes 1, 2, 3, 4, 5. Only 4 and 5 are more than 3, so lives goes down twice: 3 - 2 = 1.' }),
      choice({ id: 'a13', prompt: 'This is the Apple in a Catch game. Each time the Apple touches the Bowl, score should go up by 1. But score never goes past 1. Which block should replace set [score] to (1)?', blocks: Y6.text(APPLE(B.set('score', 1))),
        options: Object.keys(a13fix), answer: a13[0], scheme: 'change [score] by (1). set puts 1 in score every time, so it never goes past 1.' }),
      choice({ id: 'a14', prompt: 'Where is the sprite when this script ends?', blocks: Y6.text(STEPS),
        options: a14opts, answer: pos(r14.x, r14.y), scheme: '3 turns: y goes up 10 each turn (30), x goes up 5 each turn (15).' })
    ] },
    { title: 'Fix and Change a Game', questions: [
      // freeChecks: the arrow check already passes in the starter, so it earns nothing: 1 mark per bug fixed.
      { id: 'b1', type: 'scratch', marks: 2, freeChecks: 1, challenge: 'test-fix',
        prompt: 'Fix the Game: Meteor Dodge has 2 bugs. Open the game, find each bug and fix it. Press Check my project. Your best check counts.',
        scheme: 'Marked by the checker, 1 mark per bug fixed: a Meteor hit takes 1 life (bug: change [lives] by (1)); a Star adds 5 to score (bug: the Star changes lives). The arrow check passes at the start and earns nothing.' },
      { id: 'b2', type: 'scratch', marks: 3, challenge: 'test-change',
        prompt: 'Change the Game: Balloon Pop works. Open the game and make the 3 changes in the list. Press Check my project. Your best check counts.',
        scheme: 'Marked by the checker, 3 checks: each click on the red Balloon adds 2; the green flag sets time to 30; when score reaches 10 the backdrop switches to You Win.' }
    ] }
  ]
};

const qs = test.sections.flatMap((s) => s.questions);
const TOPIC = {
  a1: 'Events', a2: 'Coordinates and motion', a3: 'Coordinates and motion', a4: 'Loops', a5: 'Variables', a6: 'Decisions',
  a7: 'Costumes and messages', a8: 'Costumes and messages', a9: 'Fixing bugs', b1: 'Fixing bugs', b2: 'Changing a game',
  a10: 'Loops', a11: 'Events', a12: 'Decisions', a13: 'Fixing bugs', a14: 'Loops'
};
qs.forEach((q) => { assert(TOPIC[q.id], 'topic for ' + q.id); q.topic = TOPIC[q.id]; });
test.topicDrills = {
  'Events': 'y6-icontrol-l1', 'Coordinates and motion': 'y6-icontrol-l1', 'Loops': 'y6-igame-l2', 'Variables': 'y6-iplan-l3', 'Decisions': 'y6-iplan-l3',
  'Costumes and messages': 'y6-icode-l4', 'Fixing bugs': 'y6-bughunt-l46', 'Changing a game': 'y6-recap-l45', '*': 'y6-idebug-l6'
};
Object.values(test.topicDrills).forEach((d) => assert(fs.existsSync(path.join(ROOT, 'Drills', 'data', d + '.js')), 'drill ' + d));
assert(new Set(qs.map((q) => q.id)).size === qs.length, 'unique ids');
qs.filter((q) => q.type === 'choice').forEach((q) => {
  assert(q.options.length === 4 && new Set(q.options).size === 4 && q.options.includes(q.answer), 'hinge has 4 options ' + q.id);
  assert(q.blocks && q.blocks.split('\n').filter((l) => l.trim() && !/^(end|else)$/.test(l)).length <= 7, 'script of at most 7 blocks ' + q.id);
  const longer = q.options.filter((o) => o.length >= q.answer.length).length;
  assert(longer > 1, "the right answer is the only longest option " + q.id);
});
// The right answer sits in a different place across the questions (options are also shuffled per student).
const places = new Set(qs.filter((q) => q.type === 'choice').map((q) => q.options.indexOf(q.answer)));
const total = qs.reduce((t, q) => t + q.marks, 0);
assert(!/[–—]/.test(JSON.stringify(test)), 'dash in test');
assert(!JSON.stringify(test).includes('<' + '?'), 'template tag in test');

// Rotate each choice's options so the right answer is not always first in the bank.
qs.filter((q) => q.type === 'choice').forEach((q, i) => {
  const k = i % 4; q.options = q.options.slice(k).concat(q.options.slice(0, k));
});
assert(new Set(qs.filter((q) => q.type === 'choice').map((q) => q.options.indexOf(q.answer))).size > 1 || places.size > 1, 'answer positions vary');

// ---------------------------------------------------------------- write it into TestBank.gs
const bankPath = path.join(SHELL, 'TestBank.gs');
let bank = fs.readFileSync(bankPath, 'utf8');
const crlf = bank.includes('\r\n'); bank = bank.replace(/\r\n/g, '\n');
const BEGIN = '  // BEGIN y6-term1 (generated by the pages repo tools/build_y6_term1_test.mjs; edit that, not this)';
const END = '  // END y6-term1';
const block = BEGIN + '\n  ' + JSON.stringify(test) + ',\n' + END;
if (bank.includes(BEGIN)) bank = bank.replace(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END), () => block);
else bank = bank.replace('var TEST_BANK = [\n', () => 'var TEST_BANK = [\n' + block + '\n');
fs.writeFileSync(bankPath, crlf ? bank.replace(/\n/g, '\r\n') : bank);

// ---------------------------------------------------------------- the revision drill
// Never the test's own scripts: no card may draw the same blocks as a test question.
const testScripts = new Set(qs.filter((q) => q.blocks).map((q) => q.blocks));
for (let i = 0; i < 400; i++) CARDS.forEach((c) => { const d = c.randomize(); assert(!testScripts.has(d.blocks), 'card ' + c.id + ' draws a test script'); });
const DRILL = 'y6-term1-revision';
const drillJs = `// Year 6 Term 1 Test Revision
// Loaded by Drills/index.html?drill=${DRILL}
// Generated by tools/build_y6_term1_test.mjs from tools/y6_term1_kit.js: edit those, then run the builder.
// Revision before the Year 6 Term 1 Test: one card kind for each kind of test question, with new values on every
// draw. Every card has a "Walk me through it" in Learn mode's help: a similar script, one block at a time.
DrillData.register(${JSON.stringify(DRILL)}, {
  title: "Year 6 Term 1 Test Revision",
  subtitle: "Scratch: events, coordinates, loops, variables, decisions, costumes, messages and bugs",
  // Buttons for every card, numbers too: Year 6 never has to guess a typed answer's wording.
  choiceOnly: true,
  categories: [["events","Events"],["motion","Coordinates and Motion"],["loops","Loops"],["variables","Variables"],["decisions","Decisions"],["looks","Costumes and Messages"],["bugs","Fixing Bugs"]],
  cards: (function () {
${kit}
    return CARDS;
  })()
});
`;
assert(!/[–—]/.test(drillJs), 'dash in drill');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', DRILL + '.js'), drillJs);

// ---------------------------------------------------------------- the lesson
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const LID = 'y6-term1-test';
const steps = [
  { id: 'title', label: 'Term 1 Test',
    content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Year 6 Scratch</p><h2 class="lesson-h2">Term 1 Test</h2><p>Year 6</p></div>' +
      facts(['<strong>First:</strong> 25 minutes of practice: cards, then two Scratch games.', '<strong>Then:</strong> a 30-minute test on this website.',
        '<strong>Topics:</strong> events, x and y, loops, variables, if blocks, costumes, messages, fixing bugs.']) +
      tps('Which Scratch blocks do you find hardest?', 'Practise those cards most in the next 12 minutes.') },
  { id: 'revision', label: 'Revision Practice', type: 'embedded-app', appId: 'drill-' + DRILL, embedContainerId: 'y6t1-revision',
    content: '<h2 class="lesson-h2">Revision Practice</h2>' + tps('A repeat (4) loop has one change x by (10) inside. How much does x change?', 'By 40: the block inside runs 4 times, 10 each time.') +
      '<p class="lesson-lead">12 minutes. Read each script one block at a time. Stuck? Switch on I need help and press Walk me through it.</p><div id="y6t1-revision"></div>' },
  { id: 'warm-up', label: 'Warm Up: Fix a Game', type: 'app-link', appId: 'scratchchallenges', appQuery: 'challenge=hunt-meteor-steer&lesson=' + LID, buttonId: 'y6t1-warm-up-btn',
    content: '<h2 class="lesson-h2">Warm Up: Fix a Game</h2>' + tps('How do you find a bug?', 'Play the game. Say what should happen and what does happen. Find the block that does the wrong thing. Change one thing, then test again.') +
      '<div class="igame-two-col"><div class="lesson-flow-task"><h3>Fix it</h3>' + facts(['Play the game first.', 'Find the block that does the wrong thing.', 'Fix it, then press <strong>Check my project</strong>.']) + '</div>' +
      '<div class="lesson-app-link"><p>6 minutes. The test has a game like this to fix.</p><button type="button" class="donow-btn" id="y6t1-warm-up-btn">Open Meteor Dodge</button></div></div>' },
  { id: 'warm-up-2', label: 'Warm Up: Change a Game', type: 'app-link', appId: 'scratchchallenges', appQuery: 'challenge=practice-change&lesson=' + LID, buttonId: 'y6t1-warm-up-2-btn',
    content: '<h2 class="lesson-h2">Warm Up: Change a Game</h2>' + tps('You need score to go up by 10, not 5. Which block do you change?', 'The change [score] by block in the script that runs when the sprite is clicked. Change only its number.') +
      '<div class="igame-two-col"><div class="lesson-flow-task"><h3>Change it</h3>' + facts(['Read the list of changes.', 'Find the script that does that part of the game.', 'Change one thing, then press <strong>Check my project</strong>.']) + '</div>' +
      '<div class="lesson-app-link"><p>7 minutes. The test has a game like this to change.</p><button type="button" class="donow-btn" id="y6t1-warm-up-2-btn">Open Balloon Pop</button></div></div>' },
  { id: 'how-it-works', label: 'How the Test Works',
    content: '<h2 class="lesson-h2">How the Test Works</h2>' + tps('In Part 2, you fix a bug and press Check my project. One check is still red. What do you do?', 'Read what the checker saw. Play that part of the game, fix the block, and press Check my project again. Your best check counts.') +
      facts(['You have <strong>30 minutes</strong> from when you press <strong>Start</strong>.',
        '<strong>Part 1:</strong> read each script and press your answer.',
        '<strong>Part 2:</strong> two Scratch games. Fix the bugs in one. Make changes to the other.',
        'In Part 2, press <strong>Check my project</strong>. Your <strong>best check</strong> counts.',
        'Your answers <strong>save automatically</strong>. Press <strong>Hand in</strong> when you finish.']) },
  { id: 'test', label: 'The Test', type: 'app-link', appId: 'tests', buttonId: 'y6t1-open-test',
    content: '<h2 class="lesson-h2">The Test</h2>' + tps('You finish early. What should you do?', 'Check every answer. Read each script again, one block at a time. Play your games again.') +
      '<p class="lesson-lead">Wait until your teacher says the test is open. Then press the button, and press Start.</p><p><button type="button" class="donow-btn" id="y6t1-open-test">Open the test</button></p>' }
];
assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash in lesson');
fs.writeFileSync(path.join(ROOT, 'LessonData', LID + '.json'), JSON.stringify({ id: LID, label: 'Term 1 Test', steps, validators: {}, pseudocodeValidators: {} }, null, 1) + '\n');
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find((y) => y.id === 'year6').units.find((u) => u.code === '6.2');
if (!unit.lessons.includes(LID)) unit.lessons.push(LID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
const outJson = JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : '');
fs.writeFileSync(lp, raw.includes('\r\n') ? outJson.replace(/\n/g, '\r\n') : outJson);
console.log(`y6-term1: ${qs.length} questions, ${total} marks; drill ${DRILL}: ${CARDS.length} cards; lesson ${LID}; unit: ${unit.lessons.join(', ')}`);
