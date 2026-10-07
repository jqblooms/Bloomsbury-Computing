// Builds the Year 7 Term 1 Test: the test itself (written into the shell repo's TestBank.gs, between the y7-term1
// markers) and the lesson y7-term1-test (20 minutes on the y7-flowcharts-recap drill, then a link to the Tests page).
//   node tools/build_y7_term1_test.mjs
// James, 2026-10-07: "the same way the year 9 one is set up". Mixed difficulty so results spread into a curve: an
// accessible band (symbols, reading), a middle band (key-press loops, AND, OR, NOT, comparisons with the equal case,
// CALL) and a stretch band (sub-routines run several times, predicting a change, direction after turns, explaining a
// loop), weighted to the class data's weakest topics (loops 57%, predicting sub-routines 64%). Every flowchart is drawn
// by Drills/flowchart-core.js and every answer comes from running it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = path.resolve(ROOT, '..', '..', 'Apps Script', 'bloomsbury-computing-main');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
const chart = (flow, maxH = 340) => `<div class="test-fc" style="${THEME};display:flex;justify-content:center">` +
  FC.svg(flow, !!flow.numbered).replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
const say = (w) => ['io', `Say "${w}"`];
const withSub = (main, name, sub) => Object.assign(main, { subs: { [name]: sub } });
const numbered = (flow) => Object.assign(flow, { numbered: true });
function branch(question, trueBox, falseBox) {
  return { nodes: [
    { id: 's', type: 'terminal', text: 'Start' }, { id: 'd', type: 'decision', text: question },
    { id: 't', type: trueBox[0], text: trueBox[1] }, { id: 'e', type: 'terminal', text: 'End' }, { id: 'f', type: falseBox[0], text: falseBox[1] },
  ], edges: [
    { from: 's', to: 'd', label: null }, { from: 'd', to: 't', label: 'True' }, { from: 'd', to: 'f', label: 'False' },
    { from: 't', to: 'e', label: null }, { from: 'f', to: 'e', label: null },
  ] };
}
function keyLoop(key, step) {
  return { nodes: [
    { id: 's', type: 'terminal', text: 'Start' }, { id: 'd', type: 'decision', text: key + ' pressed?' },
    { id: 'm', type: 'process', text: 'Move ' + step + ' steps' },
  ], edges: [
    { from: 's', to: 'd', label: null }, { from: 'd', to: 'm', label: 'True' }, { from: 'm', to: 'd', label: null }, { from: 'd', to: 'd', label: 'False' },
  ] };
}
const dirName = (d) => { d = ((d % 360) + 360) % 360; return d > 180 ? d - 360 : d; };

// ---------------------------------------------------------------- flowcharts and their answers
const F1 = numbered(FC.line([['process', 'Move 30 steps'], say('Hello'), ['process', 'Move 20 steps'], say('Bye')]));
const r1 = FC.run(F1); assert(r1.steps === 50 && r1.said.join() === 'Hello,Bye', 'F1');
const F2 = numbered(keyLoop('Right arrow', 10));
const r2 = FC.run(F2, { presses: [1, 1, 0, 1] }); assert(r2.steps === 30, 'F2 ' + r2.steps);
const F3 = branch('Up AND Right pressed?', say('Jump'), say('Wait'));
const r3a = FC.run(F3, { keys: { Up: 1, Right: 0 } }).said[0], r3b = FC.run(F3, { keys: { Up: 1, Right: 1 } }).said[0];
assert(r3a === 'Wait' && r3b === 'Jump', 'F3');
const F4 = branch('Left OR Down pressed?', say('Go'), say('Stop'));
const r4a = FC.run(F4, { keys: { Left: 0, Down: 1 } }).said[0], r4b = FC.run(F4, { keys: { Left: 0, Down: 0 } }).said[0];
assert(r4a === 'Go' && r4b === 'Stop', 'F4');
const F5 = branch('NOT Space pressed?', say('Ready'), say('Fire'));
const r5 = FC.run(F5, { keys: { Space: 1 } }).said[0]; assert(r5 === 'Fire', 'F5 ' + r5);
const F6 = branch('Score > Target?', say('Win'), say('Try again'));
const r6 = FC.run(F6, { values: { Score: 50, Target: 50 } }).said[0]; assert(r6 === 'Try again', 'F6');
const F7 = withSub(FC.line([['call', 'CALL Clap'], ['process', 'Move 10 steps'], ['call', 'CALL Clap']]), 'Clap', FC.line([say('Clap')]));
const r7 = FC.run(F7); assert(r7.said.filter((w) => w === 'Clap').length === 2 && r7.steps === 10, 'F7');
const F8 = withSub(FC.line([['call', 'CALL Hop'], ['call', 'CALL Hop'], ['call', 'CALL Hop']]), 'Hop', FC.line([['process', 'Move 20 steps'], say('Hop')]));
const r8 = FC.run(F8); assert(r8.steps === 60, 'F8');
const F8b = withSub(FC.line([['call', 'CALL Hop'], ['call', 'CALL Hop'], ['call', 'CALL Hop']]), 'Hop', FC.line([['process', 'Move 30 steps'], say('Hop')]));
assert(FC.run(F8b).steps === 90, 'F8b');
const F9 = withSub(FC.line([['process', 'Move 10 steps'], ['call', 'CALL Corner'], ['process', 'Move 10 steps'], ['call', 'CALL Corner']]), 'Corner', FC.line([['process', 'Turn right 90 degrees']]));
const r9 = dirName(FC.run(F9).direction); assert(r9 === -90, 'F9 ' + r9);

// ---------------------------------------------------------------- the test
const shapeOpts = ['Start/End', 'Process', 'Input or output', 'Decision'];
const test = {
  id: 'y7-term1', title: 'Year 7 Term 1 Test', subtitle: 'Flowcharts: reading, loops, decisions and sub-routines', year: 'year7', minutes: 30,
  sections: [
    { title: 'Reading Flowcharts', questions: [
      { id: 'a1', type: 'choice', marks: 1, prompt: 'Which shape is used for a decision?', options: ['Diamond', 'Rectangle', 'Parallelogram', 'Rounded rectangle'], answer: 'Diamond' },
      { id: 'a2', type: 'choice', marks: 1, prompt: 'Which box begins and finishes every flowchart?', options: shapeOpts, answer: 'Start/End' },
      { id: 'a3', type: 'choice', marks: 1, prompt: 'Look at the flowchart. What type of box is box 2?', svg: chart(F1), options: shapeOpts, answer: 'Process' },
      { id: 'a4', type: 'choice', marks: 1, prompt: 'Look at the same flowchart. What type of box is box 3?', svg: chart(F1), options: shapeOpts, answer: 'Input or output' },
      { id: 'a5', type: 'short', input: 'number', marks: 1, prompt: 'How many steps does the sprite move in total?', svg: chart(F1), accept: [String(r1.steps)], scheme: '30 + 20 = 50' },
      { id: 'a6', type: 'choice', marks: 1, prompt: 'What does the sprite say last?', svg: chart(F1), options: ['Bye', 'Hello', 'Move 20 steps', 'End'], answer: 'Bye' },
      { id: 'a7', type: 'choice', marks: 1, prompt: 'How many arrows come out of a decision box?', options: ['2: True and False', '1', '3', '0'], answer: '2: True and False' }
    ] },
    { title: 'Loops and Decisions', questions: [
      { id: 'b1', type: 'short', input: 'number', marks: 1, prompt: 'The right arrow is: pressed, pressed, not pressed, pressed. How many steps does the sprite move?', svg: chart(F2), accept: [String(r2.steps)], scheme: '3 presses x 10 steps. Not pressed moves nothing.' },
      { id: 'b2', type: 'choice', marks: 1, prompt: 'The key is not pressed. Where does the False arrow go?', svg: chart(F2), options: ['Back to box 2, the decision', 'To End', 'To box 3, Move 10 steps', 'Back to Start'], answer: 'Back to box 2, the decision' },
      { id: 'b3', type: 'choice', marks: 1, prompt: 'Up is pressed. Right is not pressed. What does the sprite say?', svg: chart(F3), options: ['Wait', 'Jump'], answer: r3a },
      { id: 'b4', type: 'choice', marks: 1, prompt: 'Up is pressed. Right is pressed. What does the sprite say?', svg: chart(F3), options: ['Jump', 'Wait'], answer: r3b },
      { id: 'b5', type: 'choice', marks: 1, prompt: 'Left is not pressed. Down is pressed. What does the sprite say?', svg: chart(F4), options: ['Go', 'Stop'], answer: r4a },
      { id: 'b6', type: 'choice', marks: 1, prompt: 'Neither key is pressed. What does the sprite say?', svg: chart(F4), options: ['Stop', 'Go'], answer: r4b },
      { id: 'b7', type: 'choice', marks: 1, prompt: 'Space is pressed. What does the sprite say?', svg: chart(F5), options: ['Fire', 'Ready'], answer: r5 },
      { id: 'b8', type: 'choice', marks: 1, prompt: 'Score is 50. Target is 50. What does the sprite say?', svg: chart(F6), options: ['Try again', 'Win'], answer: r6 },
      { id: 'b9', type: 'short', input: 'number', marks: 1, prompt: 'How many times does the sprite say "Clap"?', svg: chart(F7), accept: ['2'], scheme: 'Main calls Clap twice.' }
    ] },
    { title: 'Sub-routines and Explaining', questions: [
      { id: 'c1', type: 'short', input: 'number', marks: 1, prompt: 'How many steps does the sprite move in total?', svg: chart(F8), accept: [String(r8.steps)], scheme: 'Hop runs 3 times: 3 x 20 = 60.' },
      { id: 'c2', type: 'short', input: 'number', marks: 1, prompt: 'Hop is changed to Move 30 steps. How many steps does the sprite move now?', svg: chart(F8), accept: ['90'], scheme: '3 x 30 = 90. One change in the sub-routine changes every CALL.' },
      { id: 'c3', type: 'choice', marks: 1, prompt: 'Why use a sub-routine here?', svg: chart(F8), options: ['It is written once and can run many times', 'It makes the sprite move faster', 'It stops the flowchart', 'It asks the user a question'], answer: 'It is written once and can run many times' },
      { id: 'c4', type: 'choice', marks: 1, prompt: 'The sprite starts facing right (90). Which direction is it facing at the end?', svg: chart(F9), options: ['-90', '90', '180', '0'], answer: String(r9), scheme: 'Right 90, then down 180, then left -90.' },
      { id: 'c5', type: 'long', marks: 2, prompt: 'Look at the key-press flowchart again. Explain why the False arrow goes back to the decision box.', svg: chart(F2),
        scheme: 'One mark each:\n- so the key is checked again (and again / keeps checking)\n- so the sprite moves when the key is pressed later / it waits for the key' }
    ] }
  ]
};
const qs = test.sections.flatMap((s) => s.questions);
assert(new Set(qs.map((q) => q.id)).size === qs.length, 'unique ids');
qs.filter((q) => q.type === 'choice').forEach((q) => assert(q.options.includes(q.answer), 'answer in options ' + q.id));
const total = qs.reduce((t, q) => t + q.marks, 0);

// ---------------------------------------------------------------- write it into TestBank.gs
const bankPath = path.join(SHELL, 'TestBank.gs');
let bank = fs.readFileSync(bankPath, 'utf8');
const BEGIN = '  // BEGIN y7-term1 (generated by the pages repo tools/build_y7_term1_test.mjs; edit that, not this)';
const END = '  // END y7-term1';
const block = BEGIN + '\n  ' + JSON.stringify(test) + ',\n' + END;
if (bank.includes(BEGIN)) bank = bank.replace(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END), () => block);
else bank = bank.replace('var TEST_BANK = [\n', () => 'var TEST_BANK = [\n' + block + '\n');
fs.writeFileSync(bankPath, bank);

// ---------------------------------------------------------------- the lesson
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const LID = 'y7-term1-test';
const steps = [
  { id: 'title', label: 'Term 1 Test',
    content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Computational Thinking</p><h2 class="lesson-h2">Term 1 Test</h2><p>Year 7</p></div>' +
      facts(['<strong>First:</strong> 20 minutes of revision practice.', '<strong>Then:</strong> a 30-minute test on this website.', '<strong>Topics:</strong> reading flowcharts, key-press loops, AND, OR and NOT, sub-routines.']) +
      tps('Which topic do you find hardest?', 'Practise that topic most in the next 20 minutes.') },
  { id: 'revision', label: 'Revision Practice', type: 'embedded-app', appId: 'drill-y7-flowcharts-recap', embedContainerId: 'y7t1-revision',
    content: '<h2 class="lesson-h2">Revision Practice</h2>' + tps('A key-press loop: the key is not pressed. Where does the arrow go?', 'Back to the decision, to check the key again.') +
      '<p class="lesson-lead">20 minutes. Practise every topic. Follow each flowchart one box at a time.</p><div id="y7t1-revision"></div>' },
  { id: 'how-it-works', label: 'How the Test Works',
    content: '<h2 class="lesson-h2">How the Test Works</h2>' + tps('Your answers save as you type. Why does that help?', 'If the computer crashes, you lose nothing. Open the site again and carry on.') +
      facts(['You have <strong>30 minutes</strong> from when you press <strong>Start</strong>.', 'Your answers <strong>save as you type</strong>.', 'During the test you <strong>cannot open the rest of the website</strong>.',
        'The notepad works, but it starts <strong>empty</strong>. Your old notes come back after the test.', 'Press <strong>Hand in</strong> when you finish. When time runs out, it hands in for you.']) },
  { id: 'test', label: 'The Test', type: 'app-link', appId: 'tests', buttonId: 'y7t1-open-test',
    content: '<h2 class="lesson-h2">The Test</h2>' + tps('You finish early. What should you do?', 'Check every answer. Follow each flowchart again, one box at a time.') +
      '<p class="lesson-lead">Wait until your teacher says the test is open. Then press the button, and press Start.</p><p><button type="button" class="donow-btn" id="y7t1-open-test">Open the test</button></p>' }
];
fs.writeFileSync(path.join(ROOT, 'LessonData', LID + '.json'), JSON.stringify({ id: LID, label: 'Term 1 Test', steps, validators: {}, pseudocodeValidators: {} }, null, 1) + '\n');
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const unit = all.years.find((y) => y.id === 'year7').units.find((u) => u.title === 'Term 1 Exam Revision');
if (!unit.lessons.includes(LID)) unit.lessons.push(LID);
const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
fs.writeFileSync(lp, JSON.stringify(all, null, indent) + (raw.endsWith('\n') ? '\n' : ''));
console.log(`y7-term1: ${qs.length} questions, ${total} marks; lesson ${LID}; unit: ${unit.lessons.join(', ')}`);
