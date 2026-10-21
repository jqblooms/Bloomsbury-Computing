// Builds LessonData/y7-3-2-plans.json: Year 7, 3.2 Project Plans (7P.07: explain the purpose of project plans for
// software development projects; identify the main stages or tasks a project plan should organise), its four
// drills (Drills/data/y7-3-2-ext.js, y7-3-2-order.js, y7-3-2-missing.js, y7-3-2-plans.js), and registers the lesson
// after y7-3-1-constructs in the Year 7 unit "Software Development and Physical Computing".
//   node tools/build_y7_3_2.mjs
// Same shape as tools/build_y7_3_1.mjs: EAL-light and Term 1b "why" (one idea per slide, a teacher-only Think, Pair,
// Share under every heading, compare slides). Year 7 has no exam board papers, so nothing carries a citation. The
// Do Now flowcharts are drawn and run by Drills/flowchart-core.js; every drill answer comes from the card's own data.
// The lesson is hands-on (James, 2026-10-21: "largely a copy/write activity"): nine slides are Project Planner
// activities (ProjectPlanner/ in this repo, one app, embedQuery activity=<name>), checked as the student works,
// with limited runs, checks or misses so they cannot be guessed, and each posts its result as the slide's answer.
// The order and missing drills stay in the Drills library; their why cards are "pick every true reason".
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-3-2-plans';
const P = 'y732';
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- pieces (as in build_y7_3_1.mjs)
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
function chart(flow, maxH = 400, hl = []) {
  let i = -1;
  const svg = FC.svg(flow, !!flow.numbered).replace(/<(rect|polygon) class="fc-[btd]"/g, (m) => {
    i++;
    return hl.includes(i) ? m + ' style="stroke:var(--warn);stroke-width:5;fill:rgba(253,214,99,.3)"' : m;
  });
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    svg.replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
}
function choice(pre, question, tBoxes, fBoxes) {
  const nodes = [{ id: 's', type: 'terminal', text: 'Start' }], edges = [];
  let last = 's';
  pre.forEach((b, i) => { nodes.push({ id: 'p' + i, type: b[0], text: b[1] }); edges.push({ from: last, to: 'p' + i, label: null }); last = 'p' + i; });
  nodes.push({ id: 'd', type: 'decision', text: question }); edges.push({ from: last, to: 'd', label: null });
  const pathOf = (boxes, tag, label) => {
    let prev = 'd';
    boxes.forEach((b, i) => { const id = tag + i; nodes.push({ id, type: b[0], text: b[1] }); edges.push({ from: prev, to: id, label: i ? null : label }); prev = id; });
    edges.push({ from: prev, to: 'e', label: null });
  };
  pathOf(tBoxes, 't', 'True');
  nodes.push({ id: 'e', type: 'terminal', text: 'End' });
  pathOf(fBoxes, 'f', 'False');
  return { nodes, edges };
}
const say = (w) => ['io', `Say "${w}"`];
const move = (n) => ['process', `Move ${n} steps`];
const TURN = ['process', 'Turn right 90 degrees'];
const CALL = (n) => ['call', `CALL ${n}`];
const numbered = (flow) => Object.assign(flow, { numbered: true });
const withSub = (main, name, sub) => Object.assign(main, { subs: { [name]: sub } });

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} mark${parts.length > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
const num = (n, unit = '') => `^\\s*(box\\s*)?${n}\\s*${unit ? `(${unit})?` : ''}\\s*$`;
const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
const boxText = (body) => `^\\s*["'\\u201c]?\\s*${body}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const paneTitle = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
// A Project Planner activity on a slide (ProjectPlanner/ in this repo: one app, the activity picked by embedQuery).
// Each activity posts its result as BC_APP_RESULT, which the slide saves as its answer (js/steps/embeds.html).
const app = (id, label, heading, lead, activity) => ({ id, label, type: 'embedded-app', appId: 'project-planner', embedQuery: `activity=${activity}`,
  embedContainerId: `${P}-${id}`, content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
// Two short boxes side by side (the compare slides).
const teamBox = (title, text) => `<div style="padding:8px 12px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2)"><b>${title}</b><br>${text}</div>`;
// Multiple choice: the step marks a click at once, one try (js/steps/quiz.html).
function mcStep(id, label, heading, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `${extra}<div id="${cid}"></div>`, items };
}
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;
// A plan as a table: rows of cells; an empty cell is drawn as a gap.
function table(head, rows) {
  const cell = (t, h) => `<t${h} style="padding:4px 8px;text-align:left;font-size:16px${t === '' ? ';background:rgba(253,214,99,.18)' : ''}">${t === '' ? '&nbsp;' : t}</t${h}>`;
  return `<table class="donow-table" style="font-size:16px;width:100%"><thead><tr>${head.map((h) => cell(h, 'h')).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => cell(c, 'd')).join('')}</tr>`).join('')}</tbody></table>`;
}
// Think, Pair, Share under each slide's heading: one short why question, answer hidden until the teacher clicks.
// On a check slide it never gives or presupposes an answer on that slide (tools/tps-leak-check.mjs in the shell).
const TPS = {
  'do-now': ['Why can one flowchart give different answers for different numbers?', 'A decision looks at the number. A different number can follow a different arrow.'],
  'do-now-2': ['Why put a job in a sub-routine, not draw its boxes again in Main?', 'You draw it once and CALL it as often as you need. To change it, you change one place.'],
  'title': ['Why might a team of good programmers still not finish a game on time?', 'Good work is not enough. They also need to know what to do, in what order, who does it and by when. Today we learn how.'],
  'project': ['Why split a big project into small tasks?', 'A small task is easy to start and easy to check. You can see what is done and what is still left.'],
  'stages': ['Look at what each stage needs. How does that tell you which stage can come first?', 'A stage can only start once a stage before it has given what it needs. Start with the stage that needs only an idea.'],
  'compare-order': ['You build a model without looking at the picture on the box. What might happen? Why?', 'Pieces can go in the wrong place, and you take it apart and start again. The picture shows how it fits before you begin.'],
  'order-check': ['"Draw" is often a Design word. Can a task that draws ever be a different stage? Why?', 'Yes. Drawing the levels on the computer, to make the game, is Build. The stage depends on what the whole task does.'],
  'activity-1': ['Why can two tasks sometimes swap places, but other tasks never can?', 'Two tasks that do not need each other can go in either order. A task that needs another one must wait for it.'],
  'what-plan': ['Why does every task get a deadline?', 'Everyone knows when their task must be finished. If every task is on time, the whole project is on time.'],
  'plan-check': ['Why does a plan say what each task needs?', 'So you know which task must be finished first, and what to have ready on the day.'],
  'compare-plans': ['Both teams had the same people and the same week. Why might one team finish and the other not?', 'Talk about it in pairs. Then check your idea with the question.'],
  'why-plan': ['Predict: which of these reasons stops two people doing the same job? Why?', 'Everyone knows who does what. Each task has one name next to it.'],
  'missing-check': ['Why check a plan before the project starts?', 'A gap is quick to put right on paper. Found in the middle of the project, the same gap costs days.'],
  'what-if': ['When one task is late, how do you find every task that has to wait?', 'Find the tasks that need it, then the tasks that need those. Then check what else the same person had to do.'],
  'activity-2': ['How do you choose which task to plan first? Why?', 'Start with the task that needs nothing. A task can only go on a day after every task it needs.'],
  'why-check': ['What makes an explanation worth 2 marks?', 'Two connected points: what the plan shows, and what that gives the team. Join them with "so".'],
  'practice': ['Why find every fault before you change anything?', 'One change can fix one fault and make a new one. When you can see them all, you can fix them together.'],
  'plenary': ['Why practise with a new project every time?', 'If you can plan any project, you really understand planning.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now 1 (3.1): sequence and selection together
// Shapes: 1 Start, 2 Move 20, 3 Say Ready, 4 decision, 5 Move 30, 6 End, 7 Say Try again.
const DN1 = numbered(choice([move(20), say('Ready')], 'Score > 40?', [move(30)], [say('Try again')]));
const dn1 = (v) => FC.run(DN1, { values: { Score: v } });
assert(dn1(55).steps === 50 && dn1(40).steps === 20 && dn1(40).said.join() === 'Ready,Try again', 'do-now 1');
// Walk me through it: the same three questions on another flowchart. Shapes (node order): 0 Start, 1 Move 10, 2 Say Go,
// 3 decision, 4 Move 25, 5 End, 6 Say Wait.
const W1 = numbered(choice([move(10), say('Go')], 'Coins > 15?', [move(25)], [say('Wait')]));
const w1a = FC.run(W1, { values: { Coins: 18 } }), w1b = FC.run(W1, { values: { Coins: 15 } });
assert(w1a.steps === 35 && w1b.steps === 10 && w1b.said.join() === 'Go,Wait', 'walkthrough 1');
const WT_BOTH = { title: 'Walk me through it: sequence and selection', steps: [
  { text: 'This is a different flowchart with the same kind of questions. We try Coins is 18, then Coins is 15.', visual: chart(W1, 300) },
  { text: 'Begin at <strong>Start</strong>. Box 2 moves 10 steps. Box 3 says "Go". These boxes run every time.', visual: chart(W1, 300, [1, 2]) + note('Steps so far: ' + hl('10')) },
  { text: 'Coins is 18. Is 18 bigger than 15? Yes, so it is <strong>True</strong>. Box 5 moves 25 more steps.', visual: chart(W1, 300, [3, 4]) + note('10 + 25 = ' + hl('35 steps')) },
  { text: 'Now Coins is 15. Is 15 bigger than 15? No. The same is not bigger, so it is <strong>False</strong>.', visual: chart(W1, 300, [3]) + note('15 &gt; 15? ' + hl('False')) },
  { text: 'The False arrow goes to box 7. It does not move the sprite. The steps stay at 10.', visual: chart(W1, 300, [6]) + note('Altogether: ' + hl('10 steps')) },
  { text: 'What does it say last? First box 3 said "Go". Then box 7 says "Wait". The last one is "Wait".', visual: chart(W1, 300, [2, 6]) + note('Said: Go, then ' + hl('Wait')) },
  { text: 'Now do the same with your flowchart: add the boxes before the decision, then follow one arrow.', visual: chart(W1, 300) },
] };
steps.push(checkStep('do-now', 'Do Now: Sequence and Selection', 'Do Now: Sequence and Selection', 'From 3.1. Begin at Start. Put the number into the decision.', [
  { label: 'Score is 55. How many steps altogether?', answer: num(50, 'steps?'), feedback: 'Add the Move box before the decision. Then put the number in and follow that arrow.' },
  { label: 'Score is 40. How many steps altogether?', answer: num(20, 'steps?'), feedback: 'Is 40 bigger than 40? Then follow that arrow. Does it move again?' },
  { label: 'Score is 40. What does the sprite say last?', answer: word('try\\s+again'), feedback: 'Follow the whole path for 40. Which Say box do you reach last?' },
], chart(DN1, 300)));
steps[steps.length - 1].walkthrough = WT_BOTH;

// ---------------------------------------------------------------- Do Now 2 (Lesson 4): sub-routines
const DN2 = withSub(FC.line([CALL('Hop'), move(10), CALL('Hop')]), 'Hop', FC.line([move(25), say('Hop')]));
const dn2 = FC.run(DN2);
assert(dn2.steps === 60 && dn2.said.join() === 'Hop,Hop', 'do-now 2');
// Walk me through it: the same three questions. Node order: Main 0 Start, 1 CALL, 2 Say Go, 3 CALL, 4 Move 5, 5 CALL,
// 6 End; then Skip 7 Start, 8 Move 15, 9 Turn, 10 End.
const W2 = withSub(FC.line([CALL('Skip'), say('Go'), CALL('Skip'), move(5), CALL('Skip')]), 'Skip', FC.line([move(15), TURN]));
const w2 = FC.run(W2);
assert(w2.steps === 50 && w2.said.join() === 'Go' && w2.trace.filter((t) => /^Turn/.test(t)).length === 3, 'walkthrough 2');
const WT_SUB = { title: 'Walk me through it: sub-routines', steps: [
  { text: 'This is a different flowchart with the same three questions. Main is on the left. The sub-routine Skip is on the right.', visual: chart(W2, 280) },
  { text: 'Begin at Main\'s Start. Box 1 is <strong>CALL Skip</strong>. Go to Skip and run all of it: Move 15 steps, then turn.', visual: chart(W2, 280, [1, 8, 9]) + note('Steps so far: ' + hl('15')) },
  { text: 'Skip reaches its End. Go back to Main, to the box <strong>just after</strong> the CALL.', visual: chart(W2, 280, [2]) + note('Next in Main: ' + hl('Say "Go"')) },
  { text: 'Each CALL runs all of Skip once. Main has 3 CALL boxes, so Skip runs 3 times.', visual: chart(W2, 280, [1, 3, 5]) + note('Skip runs ' + hl('3 times')) },
  { text: 'Turns: Skip has one Turn box. It runs 3 times, so the sprite turns 3 times.', visual: chart(W2, 280, [9]) + note('Turns: ' + hl('3')) },
  { text: 'Steps: 3 x 15 = 45 from Skip. Main has its own Move 5 steps too. 45 + 5 = 50.', visual: chart(W2, 280, [4, 8]) + note('Altogether: ' + hl('50 steps')) },
  { text: 'Now do the same with your flowchart: count the CALLs, then add every Move box.', visual: chart(W2, 280) },
] };
steps.push(checkStep('do-now-2', 'Do Now: Sub-routines', 'Do Now: Sub-routines', 'From Lesson 4. Begin at Main\'s Start.', [
  { label: 'How many steps does the sprite move altogether?', answer: num(60, 'steps?'), feedback: 'Each CALL runs all of Hop. Count the CALLs, then add the Move box in Main too.' },
  { label: 'How many times does the sprite say "Hop"?', answer: '^\\s*(2|two|twice)(\\s+times)?\\s*$', feedback: 'Hop has one Say box. How many times does Main CALL Hop?' },
  { line: true, label: 'Hop reaches its End the first time. Which box in Main runs next?', answer: boxText('move\\s*:?\\s*10(\\s*steps?)?'), feedback: 'Main carries on just after the first CALL. Write that whole box.' },
], chart(DN2, 250)));
steps[steps.length - 1].walkthrough = WT_SUB;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-3-2-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 3.1 and the Flowcharts unit. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: '3.2: Project Plans',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Software Development and Physical Computing</p><h2 class="lesson-h2">3.2: Project Plans</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> plan a software project before you build it.', '<strong>The big question:</strong> why does a team need a plan?']) });

// ---------------------------------------------------------------- what a project is
steps.push({ id: 'project', label: 'What Is a Software Project?',
  content: '<h2 class="lesson-h2">What Is a Software Project?</h2>' +
    '<p class="lesson-lead">A <strong>project</strong> is a big job with a goal and an end date.</p>' +
    facts([
      'A <strong>software project</strong> makes a program, an app or a game.',
      'Example: your team makes a Catch game for Sports Day, in one week.',
      'It is too big to do in one go. So we split it into <strong>tasks</strong>.',
      'A <strong>task</strong> is one small job, like "Draw the flowchart".',
    ]) });

// ---------------------------------------------------------------- the stages (Project Planner: stages)
// The student puts the five stages in an order that works (each card says what the stage needs and gives), runs
// it, then predicts where two broken orders get stuck. The app shows the stage row once the order works.
steps.push(app('stages', 'The Stages of a Software Project', 'The Stages of a Software Project',
  '', 'stages'));

steps.push(mcStep('compare-order', 'Compare: Design First or Build First?', 'Compare: Design First or Build First?',
  '', [
    { prompt: 'Both teams must make the fruit fall faster as the score goes up. Which team finishes first, and why?', options: ['Team Blue: the faster fruit was in its flowchart', 'Team Red: it started building on Day 1',
      'Team Blue: its game had fewer sprites to make', 'Team Red: it spent more days building'], correct: 0,
      explain: 'Team Blue. The design showed how the game must work before anyone built it, so it was built right first time. Team Red built it twice.' },
  ], columns(teamBox('Team Red: build first', 'Day 1 to 3: build. Day 4: the fruit never gets faster. Nobody planned it. Day 5 to 6: build it again.'),
    teamBox('Team Blue: design first', 'Day 1: draw the flowchart, with the faster fruit in it. Day 2 to 3: build. Day 4: test. Day 5: improve.'))));

steps.push(app('order-check', 'Your Turn: Which Stage Is It?', 'Your Turn: Which Stage Is It?',
  '', 'sort'));

steps.push(app('activity-1', 'Activity 1: Put the Tasks in Order', 'Activity 1: Put the Tasks in Order',
  '', 'order'));

// ---------------------------------------------------------------- what a plan lists
steps.push({ id: 'what-plan', label: 'What a Project Plan Lists',
  content: '<h2 class="lesson-h2">What a Project Plan Lists</h2>' +
    '<p class="lesson-lead">A <strong>project plan</strong> organises the tasks of a project. It lists:</p>' +
    table(['Part', 'It says', 'Example'], [
      ['<strong>Tasks</strong>', 'what to do', 'Draw the flowchart'],
      ['<strong>Order</strong>', 'what comes first', 'Task 2, after task 1'],
      ['<strong>Who</strong>', 'who does each task', 'Nat'],
      ['<strong>Deadline</strong>', 'when the task must be finished', 'Tuesday'],
      ['<strong>Needs</strong>', 'what the task needs', 'paper and a pencil'],
    ]) });

steps.push(app('plan-check', 'Your Turn: Read the Plan', 'Your Turn: Read the Plan',
  '', 'read'));

// ---------------------------------------------------------------- why plan
steps.push(mcStep('compare-plans', 'Compare: With a Plan, Without a Plan', 'Compare: With a Plan, Without a Plan',
  '', [
    { prompt: 'Both teams make a Catch game for Sports Day on Friday. Which part of Team Blue\'s plan stopped two people drawing the same fruit?', options: ['Every task has one name', 'Every task has a deadline', 'The tasks are in order', 'Each task says what it needs'], correct: 0,
      explain: 'One name on each task: everyone knows which jobs are theirs, so no job is done twice and none is forgotten.' },
  ], columns(teamBox('Team Red: no plan', 'Two people drew the same fruit. Nobody made the score: each thought another person would. Friday: no time to test, and the game broke.'),
    teamBox('Team Blue: a project plan', 'Every task has one name. Every task has a deadline. Thursday: test. Friday: the game worked.'))));

steps.push({ id: 'why-plan', label: 'Why Write a Project Plan?',
  content: '<h2 class="lesson-h2">Why Write a Project Plan?</h2>' +
    '<p class="lesson-lead">A project plan helps in four ways.</p>' +
    facts([
      'You know what to do <strong>first</strong>, and what has to wait.',
      'You <strong>finish on time</strong>: every task has a deadline.',
      '<strong>Nothing is forgotten</strong>: every task is on the list.',
      'In a team, everyone knows <strong>who does what</strong>.',
    ]) });

steps.push(app('missing-check', 'Your Turn: What Is Missing?', 'Your Turn: What Is Missing?',
  '', 'gaps'));

steps.push(app('what-if', 'What If? Predict, Then Run It', 'What If? Predict, Then Run It',
  '', 'whatif'));

steps.push(app('activity-2', 'Activity 2: Plan the Project', 'Activity 2: Plan the Project',
  '', 'build'));

steps.push(app('why-check', 'Explain: Why a Project Plan Is Useful', 'Explain: Why a Project Plan Is Useful',
  '', 'explain'));

// ---------------------------------------------------------------- practice: the hardest task
steps.push(app('practice', 'Practice: Find and Fix the Plan', 'Practice: Find and Fix the Plan',
  '', 'fix'));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Project Plans', 'drill-y7-3-2-plans', 'Plenary: Project Plans',
  'Stages, plans and why we plan. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '');
  t.content += tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, '50') && V('do-now', 0, '50 steps') && !V('do-now', 0, '20') && V('do-now', 1, '20') && !V('do-now', 1, '50') && V('do-now', 2, 'Try again') && V('do-now', 2, '"try again"') && !V('do-now', 2, 'Ready'), 'do-now marks');
assert(V('do-now-2', 0, '60') && V('do-now-2', 0, '60 steps') && !V('do-now-2', 0, '35') && V('do-now-2', 1, '2') && V('do-now-2', 1, 'twice') && V('do-now-2', 1, 'two times') && !V('do-now-2', 1, '1'), 'do-now-2 marks');
assert(V('do-now-2', 2, 'Move 10 steps') && V('do-now-2', 2, 'move 10') && !V('do-now-2', 2, 'CALL Hop') && !V('do-now-2', 2, 'Move 25 steps'), 'do-now-2 box');
// Feedback nudges and never contains an accepted answer (every 1 to 6 word run is tested against its own pattern).
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) {
    const run = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
    assert(!rx.test(run), `feedback leaks the answer: ${k}${p.suffix} "${run}"`);
  }
}
const plain = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };
for (const s of steps.filter((x) => x.validatorKey)) {
  const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, 'i'));
  const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
  if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
  for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
}
// The self-marked slide's TPS never states the model answer's ideas.
assert(!/who does|on time|forgot/i.test(TPS['why-check'].join(' ')), 'why-check TPS gives the model answer');
// The walkthroughs show the method with other numbers and never the Do Now answers.
{
  const a = plain(JSON.stringify(WT_BOTH.steps.map((x) => x.text + ' ' + x.visual))).toLowerCase();
  assert(!/\b50\b|\b20\b|\b40\b|\b55\b|try again/.test(a), 'do-now walkthrough leaks an answer');
  const b = plain(JSON.stringify(WT_SUB.steps.map((x) => x.text + ' ' + x.visual))).toLowerCase();
  assert(!/\b60\b|\b2\b|\btwo\b|twice|move 10/.test(b), 'sub-routine walkthrough leaks an answer');
  assert(!/Score|Try again|Ready|Hop/.test(JSON.stringify([WT_BOTH, WT_SUB])), 'walkthrough charts reuse the Do Now chart');
}
// Every slide asks a why: a Think, Pair, Share on every slide except the Extension.
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it (the title slide only names today's topic).
const TEACH = [[/\bprojects?\b/i, 'project'], [/\btasks?\b/i, 'project'], [/\bstages?\b/i, 'stages'], [/\bproject plans?\b/i, 'what-plan'], [/\bdeadlines?\b/i, 'what-plan']];
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    TEACH.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
// No dashes, no citations, no game mention, Year 7 words only.
{
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478/.test(all), 'citation found');
  assert(!/mario|party/i.test(all), 'game mention');
  assert(!/\b(variable|counter|assign\w*|WHILE|REPEAT|FOR|IF|THEN|ELSE)\b/.test(all), 'a word Year 7 has not met');
}

const lesson = { id: ID, label: '3.2: Project Plans', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drills
// Project planning: shared by the two activities and the plenary, written out as source into each data file.
function planPrelude() {
  var PEOPLE = ["Ploy", "Nat", "Mint", "Ben", "Fah", "Tom", "Pim", "Sam"];
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  var STAGES = ["Decide", "Design", "Build", "Test", "Improve"];
  var STAGE_ALT = { Decide: "decid\\w*|what\\s+it\\s+must\\s+do", Design: "design\\w*|draw\\w*(\\s+the)?\\s+flowchart|(the\\s+)?flowchart",
    Build: "build\\w*|built|make|making|made", Test: "test\\w*", Improve: "improv\\w*|fix\\w*" };
  var PROJECTS = [
    { name: "a Catch game for Sports Day", short: "Catch game", tasks: ["Write what the game must do", "Draw the flowchart for catching", "Make the game on the computer", "Play the game to find mistakes", "Fix the mistakes, add a score"] },
    { name: "a Space Quiz for Year 5", short: "Space Quiz", tasks: ["Write the questions it must ask", "Draw the flowchart for one question", "Make the quiz on the computer", "Ask Year 5 to try the quiz", "Fix the questions that went wrong"] },
    { name: "a Maze game for the school fair", short: "Maze game", tasks: ["List what the maze must do", "Draw the flowchart for the arrow keys", "Make the maze and the sprite", "Play every level to find mistakes", "Fix the walls, make it harder"] },
    { name: "a Times Table app for Year 3", short: "Times Table app", tasks: ["Write what the app must check", "Draw the flowchart for one answer", "Make the app on the computer", "Try right and wrong answers", "Fix what went wrong, add sounds"] },
    { name: "a Birthday Card animation", short: "Birthday Card", tasks: ["Write what the card must show", "Draw the flowchart for the animation", "Make the card on the computer", "Watch it run, check every part", "Fix the mistakes, add music"] }
  ];
  var LETTERS = "ABCDE";

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function range(a, b, step) { return drillRange(a, b, step); }
  function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function letterRe(l) { return new RegExp("^\\s*(task\\s*)?" + l + "\\s*[.!]?\\s*$", "i"); }
  function lettersRe(list) { return new RegExp("^\\s*" + list.map(function (l) { return "(task\\s*)?" + l; }).join("\\s*(,|;|->|then|and|\\s)?\\s*(then\\s+)?") + "\\s*[.!]?\\s*$", "i"); }
  function taskNumRe(n) { return new RegExp("^\\s*(task\\s*)?(number\\s*)?" + n + "\\s*[.!]?\\s*$", "i"); }
  function stageRe(s) { return new RegExp("^\\s*(the\\s+)?(" + STAGE_ALT[s] + ")(\\s+(task|stage))?\\s*[.!]?\\s*$", "i"); }
  function nameRe(w) { return new RegExp("^\\s*" + esc(w) + "\\s*[.!]?\\s*$", "i"); }
  function others(ans, list) { return shuffled(list.filter(function (x) { return x !== ans; })).slice(0, 3); }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // Tasks of one project, shuffled and lettered: lines to show, and the letters in the right order.
  function lettered(p, n) {
    var idx = [], order, k;
    for (k = 0; k < n; k++) idx.push(k);
    do { order = shuffled(idx); } while (order.join() === idx.join());
    var lines = order.map(function (si, i) { return LETTERS[i] + ": " + p.tasks[si]; });
    var right = idx.map(function (si) { return LETTERS[order.indexOf(si)]; });
    return { lines: lines, right: right, letterOf: function (si) { return LETTERS[order.indexOf(si)]; }, letters: LETTERS.slice(0, n).split("") };
  }
  // A full plan: five tasks in order, four people (the builder also improves), one day each.
  function plan() {
    var p = pick(PROJECTS), team = shuffled(PEOPLE).slice(0, 4);
    var rows = p.tasks.map(function (t, i) { return { n: i + 1, stage: STAGES[i], task: t, who: team[i === 4 ? 2 : i], day: DAYS[i] }; });
    return { p: p, rows: rows, team: team };
  }
  function planLines(rows) {
    return rows.map(function (r) { return r.n + ". " + r.task + ". Who: " + (r.who || "___") + ". Deadline: " + (r.day || "___") + "."; }).join("\n");
  }

  // `example` is another draw of the same kind, from a different project, with a different answer that appears
  // nowhere in it, worked through step by step.
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      for (var i = 0; i < 80 && !ex; i++) {
        var e = gen(), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
        if (e.project !== c.project && String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || !mentions.test(text))) ex = e;
      }
      var example = !ex ? null : "A similar question:\n" + ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
        example: example, working: c.working, note: c.note };
    } };
  }
  // A why card: pick every true reason (a "multi" card, always buttons, never a written sentence). Each draw shows
  // 1 to 3 true reasons among plausible wrong ones of the same kind and length, so it cannot be guessed.
  function why(id, category, gen) {
    return { id: id, category: category, type: "multi", show: 5, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: c.answers, distractors: c.wrong, working: c.working, note: c.note };
    } };
  }
  function explain(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: [c.answer], keywords: [c.re], distractors: c.wrong, working: c.working, note: c.note };
    } };
  }
  // A plan with one task per day, Monday to Friday, people shuffled: lines to show.
  function dayPlan() {
    var p = pick(PROJECTS), team = shuffled(PEOPLE).slice(0, 3);
    var rows = p.tasks.map(function (t, i) { return { n: i + 1, stage: STAGES[i], task: t, who: team[i % 3], day: DAYS[i], d: i }; });
    return { p: p, rows: rows, team: team };
  }
  function taskName(r) { return "Task " + r.n + ": " + r.task; }


  // ---------------------------------------------------------------- put the tasks in order
  function orderAllGen(n) {
    return function () {
      var p = pick(PROJECTS), L = lettered(p, n), ans = L.right.join(", ");
      var swap = function (a, b) { var r = L.right.slice(), t = r[a]; r[a] = r[b]; r[b] = t; return r.join(", "); };
      var wrong = [swap(1, 2), swap(2, 3), L.right.slice().reverse().join(", "), swap(0, 1), L.letters.join(", ")].filter(function (w, i, all) { return w !== ans && all.indexOf(w) === i; }).slice(0, 3);
      return { project: p.short, prompt: "Project: " + p.name + ". Put the tasks in order. Type the letters.\n" + L.lines.join("\n"), answer: ans, re: lettersRe(L.right), wrong: wrong,
        steps: ["Decide comes first: task " + L.right[0] + " says what it must do.", "Then Design (" + L.right[1] + "), Build (" + L.right[2] + "), Test (" + L.right[3] + ")" + (n === 5 ? ", Improve (" + L.right[4] + ")." : ".")],
        working: ["Find the task that says what it must do. That comes first.", "Next is the flowchart, then making it, then trying it" + (n === 5 ? ", then fixing it." : ".")],
        note: "Decide, Design, Build, Test" + (n === 5 ? ", Improve" : "") + ": " + ans + "." };
    };
  }
  function orderFirstGen() {
    var p = pick(PROJECTS), L = lettered(p, 5), ans = L.letterOf(0);
    return { project: p.short, prompt: "Project: " + p.name + ". Which task must come first? Type its letter.\n" + L.lines.join("\n"), answer: ans, re: letterRe(ans), wrong: others(ans, L.letters),
      steps: ["The first stage is Decide: what must it do?", "Task " + ans + ": " + p.tasks[0] + "."],
      working: ["Before you can draw or make anything, what must you know?", "Find the task that says what it must do."],
      note: "Task " + ans + " comes first: " + p.tasks[0] + "." };
  }
  function orderNextGen() {
    var p = pick(PROJECTS), L = lettered(p, 5), k = range(0, 3), x = L.letterOf(k), ans = L.letterOf(k + 1);
    return { project: p.short, prompt: "Project: " + p.name + ". Which task comes straight after task " + x + "? Type its letter.\n" + L.lines.join("\n"), answer: ans, re: letterRe(ans), wrong: others(ans, L.letters),
      steps: ["Task " + x + " is the " + STAGES[k] + " stage.", "Straight after " + STAGES[k] + " comes " + STAGES[k + 1] + ".", "The " + STAGES[k + 1] + " task is " + ans + ": " + p.tasks[k + 1] + "."],
      working: ["Which stage is task " + x + "? Decide, Design, Build, Test or Improve?", "Which stage comes straight after that one? Find its task."],
      note: STAGES[k] + " then " + STAGES[k + 1] + ": task " + ans + "." };
  }
  function orderBeforeGen() {
    var p = pick(PROJECTS), L = lettered(p, 5), k = range(1, 4), x = L.letterOf(k), ans = L.letterOf(k - 1);
    return { project: p.short, prompt: "Project: " + p.name + ". Which task must be finished before task " + x + " can start? Type its letter.\n" + L.lines.join("\n"), answer: ans, re: letterRe(ans), wrong: others(ans, L.letters),
      steps: ["Task " + x + " is the " + STAGES[k] + " stage.", STAGES[k] + " uses what " + STAGES[k - 1] + " made.", "The " + STAGES[k - 1] + " task is " + ans + ": " + p.tasks[k - 1] + "."],
      working: ["Which stage is task " + x + "?", "What does that stage need before it can start? Find the stage just before it."],
      note: STAGES[k - 1] + " comes just before " + STAGES[k] + ": task " + ans + "." };
  }
  function stageOfGen() {
    var p = pick(PROJECTS), k = range(0, 4), ans = STAGES[k];
    return { project: p.short, prompt: "Project: " + p.name + ". Which stage is this task: \"" + p.tasks[k] + "\"?", answer: ans, re: stageRe(ans), wrong: others(ans, STAGES),
      steps: ["Decide: what it must do. Design: the flowchart. Build: make it.", "Test: try it. Improve: fix it."],
      working: ["Does the task say what it must do, draw, make, try or fix?", "In order the stages are: what it must do, the flowchart, make it, try it, fix it. Which one is this?"],
      note: "\"" + p.tasks[k] + "\" is the " + ans + " stage." };
  }

  // ---------------------------------------------------------------- explain the order
  function whyTestGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". Why must \"" + p.tasks[2] + "\" come before \"" + p.tasks[3] + "\"? Pick every true reason.",
      answers: ["You cannot test something that is not made yet", "The test tries out what the build has made"],
      wrong: ["Testing is quick, so it is best left until last", "The tester is busy at the start of the week", "Making things is more fun, so it goes first", "The computer must be on before any test starts"],
      working: ["What does the test task try out?", "Can you try out something that is still not there?"],
      note: "You can only test what has been built. Build comes first." };
  }
  function whyDesignGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". Why draw the flowchart before making the " + p.short + "? Pick every true reason.",
      answers: ["It shows how it must work before you make it", "A mistake on paper is quicker to fix than in the game"],
      wrong: ["The teacher gives more marks for a nice drawing", "The computer cannot open a game without a flowchart", "Drawing is more fun than typing, so it goes first", "A flowchart makes the finished game run faster"],
      working: ["What does the flowchart show the team?", "What happens if you find a mistake after the whole thing is made?"],
      note: "The flowchart shows how it must work. A mistake on paper is quick to fix, so you do not build it twice." };
  }
  function whyWrongGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". A team started to make it before they wrote what it must do. What is likely to go wrong? Pick every likely problem.",
      answers: ["They may make something nobody wanted", "They may have to build it all again", "They may leave out a part it needed"],
      wrong: ["They will finish too early and get bored", "The computer will run the game too fast", "They will have too many people to test it", "The flowchart will be too long to draw"],
      working: ["If nobody wrote what it must do, how do they know what to make?", "What must they do when they find it is not what was wanted?"],
      note: "Without the list, they may make the wrong thing, and then build it again." };
  }

  // ---------------------------------------------------------------- find the gap in a plan
  function missWhoGen() {
    var P = plan(), k = range(0, 4); P.rows[k].who = "";
    return { project: P.p.short, prompt: "Project: " + P.p.name + ". Which task has nobody to do it? Type its number.\n" + planLines(P.rows), answer: k + 1, re: taskNumRe(k + 1), wrong: others(k + 1, [1, 2, 3, 4, 5]),
      steps: ["Read the Who part of each task.", "Task " + (k + 1) + " has a gap after Who."],
      working: ["Read only the Who part of each line.", "Which line has a gap where a name should be?"],
      note: "Task " + (k + 1) + " has no name, so nobody knows it is their job." };
  }
  function missWhenGen() {
    var P = plan(), k = range(0, 4); P.rows[k].day = "";
    return { project: P.p.short, prompt: "Project: " + P.p.name + ". Which task has no deadline? Type its number.\n" + planLines(P.rows), answer: k + 1, re: taskNumRe(k + 1), wrong: others(k + 1, [1, 2, 3, 4, 5]),
      steps: ["Read the Deadline part of each task.", "Task " + (k + 1) + " has a gap after Deadline."],
      working: ["Read only the Deadline part of each line.", "Which line has a gap where a day should be?"],
      note: "Task " + (k + 1) + " has no deadline, so nobody knows when it must be finished." };
  }
  function missStageGen() {
    var P = plan(), k = range(1, 4), ans = STAGES[k];
    var rows = P.rows.filter(function (r, i) { return i !== k; }).map(function (r, i) { return { n: i + 1, task: r.task, who: r.who, day: r.day }; });
    return { project: P.p.short, prompt: "Project: " + P.p.name + ". One stage is missing from this plan. Which stage?\n" + planLines(rows), answer: ans, re: stageRe(ans),
      wrong: others(ans, STAGES.filter(function (s, i) { return i !== k; })),
      steps: ["Write the stage of each task in the plan.", "Say the five stages in order. One of them has no task."],
      working: ["Does each task say what it must do, draw it, make it, try it, or fix it?", "There are five stages in order. Which job has no task in this plan?"],
      note: "The plan has no task for " + ans + "." };
  }
  function lateGen() {
    var P = plan(), k = range(0, 4), who = P.rows[k].who, day = P.rows[k].day;
    return { project: P.p.short, prompt: "Project: " + P.p.name + ". " + who + " is ill on " + day + ". Which task could miss its deadline? Type its number.\n" + planLines(P.rows),
      answer: k + 1, re: taskNumRe(k + 1), wrong: others(k + 1, [1, 2, 3, 4, 5]),
      steps: ["Find every task that " + who + " does.", "Task " + (k + 1) + " is " + who + "'s, and its deadline is " + day + "."],
      working: ["Find every task with this person's name.", "Which of those tasks must be finished on the day they are ill?"],
      note: "Task " + (k + 1) + " belongs to " + who + " and is due on " + day + "." };
  }

  // ---------------------------------------------------------------- why it matters
  function whyWhoGen() {
    var P = plan(), k = range(0, 4);
    return { prompt: "Project: " + P.p.name + ". In the plan, nobody is down for \"" + P.rows[k].task + "\". Why is that a problem? Pick every true reason.",
      answers: ["Nobody knows it is their job", "The task might never be done"],
      wrong: ["The plan will look too short", "The computer needs a name on every line", "Every task must have two names", "The task will be done far too early"],
      working: ["Whose job is it now?", "What happens to a job that is nobody's?"],
      note: "With no name, nobody knows it is their job, so it may never be done." };
  }
  function whyWhenGen() {
    var P = plan(), k = range(0, 3);
    return { prompt: "Project: " + P.p.name + ". In the plan, \"" + P.rows[k].task + "\" has no deadline. Why is that a problem? Pick every true reason.",
      answers: ["Nobody knows when it must be finished", "The tasks after it may have to wait", "The whole project could be late"],
      wrong: ["The task becomes too hard to do", "The person forgets the name of the task", "The task will be done twice over", "The flowchart cannot be drawn at all"],
      working: ["What does a deadline tell the person?", "What can happen to the tasks after it?"],
      note: "Nobody knows when it must be finished, so it can run late, and every task after it waits." };
  }
  function whyTestMissingGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". The plan has no Test stage. Why is that a problem? Pick every true reason.",
      answers: ["Mistakes may not be found", "It may not work when people use it"],
      wrong: ["The plan will need more paper", "The team will finish far too early", "It will have too many sprites", "Nobody will know who builds it"],
      working: ["What does the Test stage find?", "What happens to those if nobody looks for them?"],
      note: "Without testing, mistakes are not found, so it may not work when people use it." };
  }
  function whyPlanGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". Why does the team write a project plan before it starts? Pick every true reason.",
      answers: ["Everyone knows what to do and when", "Nothing is forgotten or done twice", "It is more likely to finish on time"],
      wrong: ["The computer runs the program faster", "The game will have no mistakes at all", "The sprites look better in the game", "The teacher can give the team a score"],
      working: ["What does a plan list for each task?", "What does that stop going wrong?"],
      note: "A plan shows what to do, who does it and by when, so nothing is forgotten and the project is on time." };
  }
  function whyDeadlineGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". Why does every task in the plan need a deadline? Pick every true reason.",
      answers: ["Everyone knows when their task must be done", "So the whole project can finish on time"],
      wrong: ["The tasks can then be done in any order", "Two people can then do each of the tasks", "The computer can then print the plan", "Nobody ever has to wait for anyone"],
      working: ["What does a deadline tell the person doing the task?", "What happens to the project if every task is on time?"],
      note: "Everyone knows when their task must be done, so the whole project is on time." };
  }
  function whyNameGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". Two people made the same sprite, and nobody made the score. How would a project plan stop this? Pick every true reason.",
      answers: ["Each task has one name, so nothing is done twice", "Every task has someone, so nothing is forgotten"],
      wrong: ["It makes the sprites look better, so nobody redoes them", "It makes the game run faster, so the score is quicker", "It gives the game a higher score at the end", "It tells the team which day of the week it is"],
      working: ["What does a plan put next to every task?", "If every task has one name, what cannot happen?"],
      note: "Each task has one name, so nothing is done twice and nothing is forgotten." };
  }

  // ---------------------------------------------------------------- harder plan cards: what if, a fault, at the same time
  function slipGen() {
    var P = dayPlan(), k = range(2, 3), r = P.rows[k];
    var late = P.rows.filter(function (x) { return x.d >= k; });
    return { prompt: "Project: " + P.p.name + ". Each task needs the one before it.\n" + planLines(P.rows) + "\n" + r.who + " is ill on " + r.day + ", so task " + r.n + " moves to the next day. Which tasks will now finish later? Pick every one.",
      answers: late.map(taskName), wrong: P.rows.filter(function (x) { return x.d < k; }).map(taskName).concat(["None of the tasks", "Only the last task"]),
      working: ["The ill person's task moves one day later.", "Which tasks need that one, or need a task that needs it?"],
      note: "Task " + r.n + " is late, and every task after it waits for it." };
  }
  var FAULTS = ["One person has two tasks on one day", "A task is due before what it needs is ready", "A task is due after the project deadline", "A task has nobody to do it"];
  function faultGen() {
    // In this plan every task needs the one before it, so two tasks on one day would also break the order: the
    // clash is not drawn here, only offered as a wrong option.
    var P = dayPlan(), kind = range(1, 3), k, rows = P.rows.map(function (r) { return Object.assign({}, r); });
    if (kind === 3) { k = range(0, 4); rows[k].who = ""; }
    else if (kind === 1) { k = range(1, 3); rows[k].day = rows[k - 1].day; rows[k].who = P.team.filter(function (w) { return w !== rows[k - 1].who && w !== rows[k].who; })[0] || rows[k].who; }
    else { k = 4; rows[k].day = "next Monday"; }
    var why = ["", "Task " + (k + 1) + " is due the same day as task " + k + ", which it needs.", "Task 5 is due next Monday, after the Friday deadline.", "Task " + (k + 1) + " has nobody in Who."][kind];
    return { prompt: "Project: " + P.p.name + ". Each task needs the one before it. The project deadline is Friday.\n" + planLines(rows) + "\nWhat is wrong with this plan?",
      answers: [FAULTS[kind]], wrong: FAULTS.filter(function (f, i) { return i !== kind; }).concat(["A stage has no task in the plan"]),
      working: ["Check each task: is its person free that day?", "Is it after the task it needs, and is it in time for the deadline?"],
      note: why };
  }
  function parallelGen() {
    var p = pick(PROJECTS), d = range(1, 2), other = d === 1 ? 2 : 1;
    var extra = { "Catch game": "Draw the fruit and basket on paper", "Space Quiz": "Plan the score screen on paper", "Maze game": "Sketch the maze levels on paper",
      "Times Table app": "Plan the buttons on paper", "Birthday Card": "Draw the pictures on paper" }[p.short];
    var tasks = [p.tasks[0], p.tasks[1], extra, p.tasks[2], p.tasks[3]];
    var lines = tasks.map(function (t, i) { return LETTERS[i] + ": " + t; });
    var me = d === 1 ? tasks[1] : tasks[2], ans = d === 1 ? tasks[2] : tasks[1];
    return { prompt: "Project: " + p.name + ". Two people can work on the same day. Which task can be done on the same day as \"" + me + "\"? Pick every one.\n" + lines.join("\n"),
      answers: [ans], wrong: [tasks[0], tasks[3], tasks[4], "None of the other tasks"],
      working: ["Two tasks can be on the same day only if neither needs the other.", "What does this task need? Which other task needs the same thing, and nothing else?"],
      note: "\"" + me + "\" and \"" + ans + "\" both need only the list, so two people can do them on the same day." };
  }

  // ---------------------------------------------------------------- what a plan lists
  function columnGen() {
    var kind = range(0, 2), vals;
    if (kind === 0) vals = shuffled(PEOPLE).slice(0, 3);
    else if (kind === 1) vals = DAYS.slice(range(0, 2)).slice(0, 3);
    else vals = shuffled(["paper", "a computer", "the flowchart", "a pencil", "the test notes", "headphones"]).slice(0, 3);
    var ANS = ["Who does each task", "The deadline", "What each task needs"];
    var RE = [/\b(who|person|people|names?)\b/i, /\b(deadlines?|when|days?|dates?)\b/i, /\b(needs?|needed|things|equipment|what\s+(is|they|you)\s+need\w*)\b/i];
    return { project: kind, prompt: "One part of a project plan says: " + vals.join(", ") + ". What does this part show?", answer: ANS[kind], re: RE[kind],
      wrong: ANS.filter(function (a, i) { return i !== kind; }).concat(["The order of the tasks"]),
      steps: ["A plan lists: the tasks, their order, who does each one, the deadline, and what each task needs.", "Ask: are these names, days, or things?"],
      working: ["Are these names, days, or things you use?", "A plan lists tasks, order, who, deadline and needs. Which part uses words like these?"],
      note: vals.join(", ") + ": " + lower(ANS[kind]) + "." };
  }
  function deadlineGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". A task in its plan has a deadline. What is a deadline?",
      answers: ["The day a task must be finished by"],
      wrong: ["The person who must do the task", "The last task in the whole plan", "Something the task needs to start", "The day the whole team first meets"],
      working: ["In a plan, a deadline is a day like Tuesday.", "What must happen to the task by that day?"],
      note: "A deadline is when the task must be finished." };
  }
  function listsGen() {
    var p = pick(PROJECTS);
    return { prompt: "Project: " + p.name + ". A project plan lists the tasks. Name one other thing it lists.",
      answer: "Who does each task",
      re: /\b(who|person|people|names?|deadlines?|when|order|first|needs?|needed|dates?|days?)\b/i,
      wrong: ["The colour of each sprite", "The score of the game", "How fast the computer is"],
      working: ["Think of a plan as a table. The first column is the task.", "What do the other columns say about each task?"],
      note: "A plan lists the tasks, their order, who does each one, the deadline and what each task needs." };
  }
}
// The Do Now Extension: 3.1 card kinds (copied from tools/build_y7_3_1.mjs) and Flowcharts unit card kinds (copied
// from Drills/data/y7-3-1-ext.js).
function flowPrelude() {
  var FC = FlowchartCore;
  var WORDS = ["Hello", "Ready", "Go", "Done", "Hi", "Stop", "Yes", "Bye", "Wave", "Jump", "Clap", "Spin"];
  var NAMES = ["Score", "Coins", "Points", "Speed", "Mark"];
  var KEYS = [["Up arrow", "Up"], ["Down arrow", "Down"], ["Left arrow", "Left"], ["Right arrow", "Right"], ["Space", "Space"]];
  var DIRS = [["right", 90], ["left", -90], ["up", 0], ["down", 180]];
  var SEQ_RE = /^\s*(it\s+needs\s+)?(an?\s+)?(sequence|steps\s+in\s+order)(\s+construct)?\s*[.!]?\s*$/i;
  var SEL_RE = /^\s*(it\s+needs\s+)?(an?\s+)?(selection|decision)(\s+construct)?\s*[.!]?\s*$/i;
  var TURN = ["process", "Turn right 90 degrees"];

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function range(a, b, step) { return drillRange(a, b, step); }
  function shuffled(list) { return list.slice().sort(function () { return Math.random() - 0.5; }); }
  function words(n) { return shuffled(WORDS).slice(0, n); }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numRe(n, unit) {
    var body = (n < 0 ? "[-\\u2212]\\s*" : "") + Math.abs(n);
    return new RegExp("^\\s*(box\\s*)?" + body + "\\s*" + (unit ? "(" + unit + ")?" : "") + "\\s*$", "i");
  }
  function wordRe(w) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + esc(w).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"); }
  function sayRe(w) { return new RegExp("^\\s*(say\\s*:?\\s*)?[\"'\\u201c]?\\s*" + esc(w).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*$", "i"); }
  function moveRe(n) { return new RegExp("^\\s*move\\s*:?\\s*" + n + "(\\s*steps?)?\\s*$", "i"); }
  function orderRe(list) {
    return new RegExp("^\\s*" + list.map(function (w) { return "[\"'\\u201c]?" + esc(w) + "[\"'\\u201d]?"; }).join("\\s*(,|;|then|and|\\s)\\s*(then\\s+)?") + "\\s*\\.?\\s*$", "i");
  }
  function others(ans, list) { return drillWrongNumbers(ans, list.concat([ans + 10, ans + 20, ans - 10, ans + 1]).filter(function (v) { return v !== ans && v > 0; }), 3); }
  function keyWord(v) { return v ? "pressed" : "not pressed"; }
  function say(w) { return ["io", "Say \"" + w + "\""]; }
  function move(n) { return ["process", "Move " + n + " steps"]; }
  function point(d) { return ["process", "Point in direction " + d]; }
  function numbered(f) { f.numbered = true; return f; }
  function withSub(main, name, sub) { main.subs = {}; main.subs[name] = sub; return main; }
  function choice(pre, question, tBoxes, fBoxes) {
    var nodes = [{ id: "s", type: "terminal", text: "Start" }], edges = [], last = "s";
    pre.forEach(function (b, i) { nodes.push({ id: "p" + i, type: b[0], text: b[1] }); edges.push({ from: last, to: "p" + i, label: null }); last = "p" + i; });
    nodes.push({ id: "d", type: "decision", text: question }); edges.push({ from: last, to: "d", label: null });
    function path(boxes, tag, label) {
      var prev = "d";
      boxes.forEach(function (b, i) { var id = tag + i; nodes.push({ id: id, type: b[0], text: b[1] }); edges.push({ from: prev, to: id, label: i ? null : label }); prev = id; });
      edges.push({ from: prev, to: "e", label: null });
    }
    path(tBoxes, "t", "True");
    nodes.push({ id: "e", type: "terminal", text: "End" });
    path(fBoxes, "f", "False");
    return { nodes: nodes, edges: edges };
  }
  function keyLoop(key, dir, step) {
    return { nodes: [
      { id: "s", type: "terminal", text: "Start" }, { id: "d", type: "decision", text: key + " pressed?" },
      { id: "p", type: "process", text: "Point in direction " + dir }, { id: "m", type: "process", text: "Move " + step + " steps" }
    ], edges: [
      { from: "s", to: "d", label: null }, { from: "d", to: "p", label: "True" }, { from: "p", to: "m", label: null },
      { from: "m", to: "d", label: null }, { from: "d", to: "d", label: "False" }
    ] };
  }
  function seqProblem() {
    var d = pick(DIRS), n = range(10, 50, 10), m = range(10, 50, 10), w = words(2), form = range(0, 3), boxes, text;
    if (form === 0) { boxes = [point(d[1]), move(n)]; text = "Point in direction " + d[1] + ", then move " + n + " steps."; }
    else if (form === 1) { boxes = [say(w[0]), move(n), say(w[1])]; text = "Say \"" + w[0] + "\", then move " + n + " steps, then say \"" + w[1] + "\"."; }
    else if (form === 2) { boxes = [move(n), TURN, move(m)]; text = "Move " + n + " steps, turn right 90 degrees, then move " + m + " more steps."; }
    else { boxes = [point(d[1]), move(n), say(w[0])]; text = "Point in direction " + d[1] + ". Move " + n + " steps. Then say \"" + w[0] + "\"."; }
    return { text: text, boxes: boxes };
  }
  function selProblem(compareOnly) {
    var w = words(2), form = range(0, 3), sp = { w1: w[0], w2: w[1] };
    if (!compareOnly && Math.random() < 0.35) {
      var k = pick(KEYS); sp.kind = "key"; sp.key = k; sp.q = k[0] + " pressed?";
      sp.cond = (k[1] === "Space" ? "Space" : "the " + k[0]) + " is pressed";
      sp.decRe = new RegExp("^\\s*(is\\s+)?(the\\s+)?" + esc(k[1]) + "(\\s+(arrow|key|bar))?(\\s+key)?\\s+(is\\s+)?pressed\\s*\\??\\s*$", "i");
      var other = pick(KEYS.filter(function (x) { return x[1] !== k[1]; }));
      sp.wrongDec = [other[0] + " pressed?", "NOT " + sp.q, "Say \"" + w[0] + "\""];
    } else {
      sp.kind = "compare"; sp.name = pick(NAMES); sp.k = range(10, 60, 10); sp.op = pick([">", "<"]);
      sp.q = sp.name + " " + sp.op + " " + sp.k + "?";
      sp.cond = sp.name + " is " + (sp.op === ">" ? "bigger" : "smaller") + " than " + sp.k;
      var rev = sp.op === ">" ? "<" : ">", big = sp.op === ">" ? "(bigger|greater|more|larger)" : "(smaller|less|lower)", nm = esc(sp.name);
      sp.decRe = new RegExp("^\\s*(is\\s+)?(" + nm + "\\s*" + sp.op + "\\s*" + sp.k + "|" + sp.k + "\\s*" + rev + "\\s*" + nm + "|" + nm + "\\s+(is\\s+)?" + big + "\\s+than\\s+" + sp.k + ")\\s*\\??\\s*$", "i");
      sp.wrongDec = [sp.name + " " + rev + " " + sp.k + "?", sp.name + " = " + sp.k + "?", "Say \"" + w[0] + "\""];
    }
    var W1 = "say \"" + w[0] + "\"", W2 = "say \"" + w[1] + "\"";
    if (form === 0) { sp.text = "If " + sp.cond + ", " + W1 + ". Otherwise " + W2 + "."; sp.clues = ["if", "otherwise"]; }
    else if (form === 1) { sp.text = "S" + W1.slice(1) + " only when " + sp.cond + ". Otherwise " + W2 + "."; sp.clues = ["only when", "otherwise"]; }
    else if (form === 2) { sp.text = "If " + sp.cond + ", " + W1 + ". If not, " + W2 + "."; sp.clues = ["if", "if not"]; }
    else { sp.text = "S" + W1.slice(1) + " if " + sp.cond + ". Otherwise " + W2 + "."; sp.clues = ["if", "otherwise"]; }
    sp.flow = function () { return choice([], sp.q, [say(w[0])], [say(w[1])]); };
    sp.opts = function (v) { if (sp.kind === "key") return { presses: [v] }; var o = { values: {} }; o.values[sp.name] = v; return o; };
    sp.value = function () {
      if (sp.kind === "key") return range(0, 1);
      return pick([sp.k, sp.k + range(1, 15), sp.k - range(1, 9), sp.k + range(1, 15), sp.k - range(1, 9)]);
    };
    sp.given = function (v) { return sp.kind === "key" ? (sp.key[1] === "Space" ? "Space" : "The " + sp.key[0]) + " is " + keyWord(v) + "." : sp.name + " is " + v + "."; };
    return sp;
  }
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null, exSteps = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      [function (s) { return s; }, function (s) { return s.replace(/ The sprite has moved \d+ steps so far\./, ""); }].forEach(function (tidy) {
        for (var i = 0; i < 80 && !ex; i++) {
          var e = gen(), st = e.steps.map(tidy);
          var text = ((e.flow ? FC.describe(e.flow) : "") + " " + e.prompt + " " + st.join(" ") + " " + e.answer).toLowerCase();
          if (String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) { ex = e; exSteps = st; }
        }
      });
      var example = !ex ? null : (ex.flow ? "A similar flowchart: " + FC.describe(ex.flow) + "\n" : "A similar question:\n") +
        ex.prompt + "\n" + exSteps.join("\n") + "\nAnswer: " + ex.answer;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
        flow: c.flow, example: example, working: c.working, note: c.note, trace: c.steps };
    } };
  }

  // ---------------------------------------------------------------- 3.1
  function whichGen() {
    var seq = Math.random() < 0.5, p = seq ? seqProblem() : selProblem();
    return { flow: null, prompt: "Problem: " + p.text + "\nWhich construct does it need: sequence or selection?", answer: seq ? "Sequence" : "Selection", re: seq ? SEQ_RE : SEL_RE,
      wrong: [seq ? "Selection" : "Sequence", "Sub-routine", "Key-press loop"],
      steps: seq ? ["Look for a clue word: if, only when, otherwise. There is none.", "Nothing depends on a number or a key. Every box runs every time, in order."]
        : ["Look for a clue word. This problem says \"" + p.clues[0] + "\".", "What happens depends on " + (p.kind === "key" ? "a key" : p.name) + ", so a decision must choose the path."],
      working: ["Look for a clue word: if, only when, otherwise.", "Does what happens depend on a number or a key? Then a decision must choose the path."],
      note: seq ? "No clue word: the same boxes run every time, in order. Sequence." : "The clue word \"" + p.clues[0] + "\" shows a choice. A decision chooses the path: selection." };
  }
  function clueGen() {
    var p = selProblem(), alts = p.clues.concat(p.clues.indexOf("only when") >= 0 ? ["only", "when"] : []);
    return { flow: null, prompt: "Problem: " + p.text + "\nWhich word in the problem shows that it needs a decision?", answer: p.clues[0],
      re: new RegExp("^\\s*[\"'\\u201c]?\\s*(" + alts.map(function (c) { return esc(c).replace(/ /g, "\\s+"); }).join("|") + ")\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"),
      wrong: ["then", "say", "is"],
      steps: ["Read the whole problem.", "\"" + p.clues[0] + "\" shows the sprite does not always do the same thing."],
      working: ["Find the part of the problem that asks about a number or a key.", "Which word tells you the sprite does not always do the same thing?"],
      note: "\"" + p.clues.join("\" and \"") + "\" show a choice, so the problem needs a decision." };
  }
  function runGen() {
    var p = selProblem(), v = p.value(), flow = p.flow(), r = FC.run(flow, p.opts(v)), ans = r.said[0];
    return { flow: flow, prompt: p.given(v) + " What does the sprite say?", answer: ans, re: wordRe(ans), wrong: [ans === p.w1 ? p.w2 : p.w1, "True", "False"],
      steps: [r.trace[1], "Say \"" + ans + "\"."],
      working: ["Put the number or the key into the decision. Is it True or False?", "Follow that arrow to its Say box."],
      note: r.trace[1] };
  }
  function decGen() {
    var p = selProblem(), flow = numbered(choice([], "?", [say(p.w1)], [say(p.w2)]));
    return { flow: flow, prompt: "Problem: " + p.text + "\nWrite the decision for box 2.", answer: p.q, re: p.decRe, wrong: p.wrongDec,
      steps: ["The clue word \"" + p.clues[0] + "\" shows the problem needs a decision.", "It asks about " + (p.kind === "key" ? "the key" : p.name) + ": " + p.q, "True path: Say \"" + p.w1 + "\". False path: Say \"" + p.w2 + "\"."],
      working: ["Find the part after the clue word. It is the question the decision asks.", p.kind === "key" ? "Write the key, then the word pressed, then a question mark." : "Write the name, the sign, then the number. > is bigger than, < is smaller than."],
      note: "Box 2 is " + p.q + " Its True arrow goes to Say \"" + p.w1 + "\"." };
  }
  function bothStepsGen() {
    var pre = range(10, 40, 10), name = pick(NAMES), k = range(10, 50, 10), extra = range(10, 30, 10), w = pick(WORDS);
    var flow = choice([move(pre), say(w)], name + " > " + k + "?", [move(extra)], [say("Try again")]);
    var v = pick([k, k + range(1, 9), k - range(1, 9)]), vals = {}; vals[name] = v;
    var r = FC.run(flow, { values: vals });
    return { flow: flow, prompt: name + " is " + v + ". How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
      wrong: others(r.steps, [pre + extra, pre, extra, pre * 2]), steps: r.trace,
      working: ["The boxes before the decision run every time.", "Then put the number into the decision and follow only that path."],
      note: "The Move before the decision always runs. " + r.trace[3] + " So " + r.steps + " steps." };
  }

  // ---------------------------------------------------------------- the Flowcharts unit
  function readOrderGen() {
    var w = words(3), a = range(10, 50, 10), b = range(10, 50, 10);
    var flow = FC.line(shuffled([move(a), move(b)]).concat([say(w[0])]).concat(shuffled([say(w[1]), say(w[2])])));
    var r = FC.run(flow, {}), ans = r.said.join(", ");
    return { flow: flow, prompt: "Write everything the sprite says, in order.", answer: ans, re: orderRe(r.said),
      wrong: [r.said.slice().reverse().join(", "), r.said.slice(1).concat(r.said.slice(0, 1)).join(", "), r.said.slice(0, 2).join(", ")],
      steps: r.trace, working: ["Begin at Start and follow the arrows, one box at a time.", "Write each Say box as you reach it. Move boxes say nothing."],
      note: "In order: " + ans + "." };
  }
  function loopStepsGen() {
    var k = pick([["Right arrow", 90], ["Left arrow", -90], ["Up arrow", 0], ["Down arrow", 180]]), step = pick([5, 15, 20, 25]);
    var n = range(5, 6), presses = [];
    for (var i = 0; i < n; i++) presses.push(Math.random() < 0.55 ? 1 : 0);
    if (presses.indexOf(1) < 0) presses[0] = 1;
    if (presses.indexOf(0) < 0) presses[n - 1] = 0;
    var flow = keyLoop(k[0], k[1], step), r = FC.run(flow, { presses: presses });
    var count = presses.filter(Boolean).length;
    return { flow: flow, prompt: "The key is checked " + n + " times: " + presses.map(keyWord).join(", ") + ". How many steps does the sprite move?",
      answer: r.steps, re: numRe(r.steps, "steps?"), wrong: others(r.steps, [step * n, step * (count + 1), step * (n - count), r.steps + step, step, r.steps + 2 * step, r.steps + 3 * step]), steps: r.trace,
      working: ["Pressed follows True: Point, then Move once.", "Not pressed follows False: straight back, no move. Count the presses, then multiply."],
      note: count + " presses x " + step + " steps = " + r.steps + " steps." };
  }
  function compareSayGen() {
    var t = pick([["Score", "Target", "Win", "Try again"], ["Coins", "Price", "Buy", "Save up"], ["Points", "Goal", "Level up", "Keep going"]]);
    var op = pick([">", "<", "=", "<>"]), a = range(10, 40), b = pick([a, a, a + range(1, 5), a - range(1, 5)]);
    var flow = choice([], t[0] + " " + op + " " + t[1] + "?", [say(t[2])], [say(t[3])]);
    var vals = {}; vals[t[0]] = a; vals[t[1]] = b;
    var r = FC.run(flow, { values: vals }), ans = r.said[0];
    return { flow: flow, prompt: t[0] + " is " + a + ". " + t[1] + " is " + b + ". What does the sprite say?",
      answer: ans, re: wordRe(ans), wrong: [ans === t[2] ? t[3] : t[2], "True", "False"],
      steps: [r.trace[1], "Say \"" + ans + "\"."],
      working: ["Put the two numbers into the question. Is it 1 or 0?", "> bigger than, < smaller than, = the same, <> not the same. Check equal numbers carefully."],
      note: r.trace[1] };
  }
  function callStepsGen() {
    var m, k, extra;
    do { m = range(10, 40, 10); k = range(2, 3); extra = range(10, 30, 10); } while (m * k + extra === 90);
    var name = pick(["DrawSide", "Step", "Hop"]);
    var sub = FC.line([move(m), TURN]);
    var boxes = []; for (var i = 0; i < k; i++) boxes.push(["call", "CALL " + name]);
    boxes.splice(1, 0, move(extra));
    var flow = withSub(FC.line(boxes), name, sub), r = FC.run(flow, {});
    return { flow: flow, prompt: "How many steps does the sprite move altogether?", answer: r.steps, re: numRe(r.steps, "steps?"),
      wrong: others(r.steps, [m * k, m + extra, r.steps + m, m * (k + 1) + extra]), steps: r.trace,
      working: ["Each CALL runs every box in the sub-routine once.", "Add the steps from every CALL, then the Move box in Main."],
      note: name + " moves " + m + " steps and is CALLed " + k + " times, plus " + extra + " steps in Main: " + r.steps + " steps." };
  }
  function callNextGen() {
    var w = words(3), name = pick(["Wave", "Flash", "Spin"]), m = range(20, 40, 10);
    if (w.indexOf(name) >= 0) w[w.indexOf(name)] = "Ok";
    var sub = FC.line([say(w[0]), move(10)]);
    var mid = Math.random() < 0.5 ? move(m) : say(w[1]);
    var flow = withSub(FC.line([say(w[2]), ["call", "CALL " + name], mid, ["call", "CALL " + name]]), name, sub);
    var mm = /^Move (\d+) steps$/.exec(mid[1]), ss = /^Say "(.*)"$/.exec(mid[1]);
    return { flow: flow, prompt: name + " reaches its End the first time. Which box in Main runs next? Write the whole box.", answer: mid[1],
      re: mm ? moveRe(mm[1]) : sayRe(ss[1]), wrong: ["Say \"" + w[2] + "\"", "CALL " + name, "Start"],
      steps: ["Main runs Say \"" + w[2] + "\", then CALL " + name + ".", name + " runs from its own Start to its End.", "Main carries on just after the first CALL: " + mid[1] + "."],
      working: ["When a sub-routine ends, Main carries on just after the CALL, not at Main's Start.", "Find the first CALL in Main. Write the box just after it."],
      note: "After " + name + " ends, Main carries on with " + mid[1] + "." };
  }
}
const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };

function extCards() {
  return [
    card("x-which", "x-31", whichGen),
    card("x-clue", "x-31", clueGen),
    card("x-run", "x-31", runGen),
    card("x-decision", "x-31", decGen),
    card("x-both", "x-31", bothStepsGen),
    card("x-read-order", "x-l12", readOrderGen),
    card("x-loop-steps", "x-l12", loopStepsGen),
    card("x-compare-say", "x-l3", compareSayGen),
    card("x-call-steps", "x-l4", callStepsGen),
    card("x-call-next", "x-l4", callNextGen)
  ];
}
function orderCards() {
  return [
    card("or-all-4", "or-all", orderAllGen(4)),
    card("or-all-5", "or-all", orderAllGen(5)),
    card("or-first", "or-next", orderFirstGen),
    card("or-next", "or-next", orderNextGen),
    card("or-before", "or-next", orderBeforeGen),
    why("or-why-test", "or-why", whyTestGen),
    why("or-why-design", "or-why", whyDesignGen),
    why("or-why-wrong", "or-why", whyWrongGen)
  ];
}
function missingCards() {
  return [
    card("mi-who-1", "mi-gap", missWhoGen),
    card("mi-who-2", "mi-gap", missWhoGen),
    card("mi-when", "mi-gap", missWhenGen),
    card("mi-stage", "mi-gap", missStageGen),
    card("mi-late", "mi-read", lateGen),
    why("mi-why-who", "mi-why", whyWhoGen),
    why("mi-why-when", "mi-why", whyWhenGen),
    why("mi-why-test", "mi-why", whyTestMissingGen)
  ];
}
function plenaryCards() {
  return [
    card("pl-column", "pl-what", columnGen),
    why("pl-deadline", "pl-what", deadlineGen),
    explain("pl-lists", "pl-what", listsGen),
    card("pl-order", "pl-stages", orderAllGen(5)),
    card("pl-next", "pl-stages", orderNextGen),
    card("pl-before", "pl-stages", orderBeforeGen),
    card("pl-stage-of", "pl-stages", stageOfGen),
    card("pl-who", "pl-read", missWhoGen),
    card("pl-when", "pl-read", missWhenGen),
    card("pl-missing", "pl-read", missStageGen),
    card("pl-late", "pl-read", lateGen),
    why("pl-slip", "pl-read", slipGen),
    why("pl-fault", "pl-read", faultGen),
    why("pl-parallel", "pl-stages", parallelGen),
    why("pl-why-plan", "pl-why", whyPlanGen),
    why("pl-why-test", "pl-why", whyTestGen),
    why("pl-why-design", "pl-why", whyDesignGen),
    why("pl-why-name", "pl-why", whyNameGen),
    why("pl-why-deadline", "pl-why", whyDeadlineGen)
  ];
}

const DRILLS = [
  ['y7-3-2-ext', 'Do Now Extension: choosing constructs (3.1) and the Flowcharts unit. Every card has a worked example on another draw.',
    'Year 7 Extension: 3.1 and the Flowcharts Unit', '3.2 Do Now Extension',
    [['x-31', 'Sequence and Selection (3.1)'], ['x-l12', 'Reading and Loops (Lessons 1, 2)'], ['x-l3', 'Comparisons (Lesson 3)'], ['x-l4', 'Sub-routines (Lesson 4)']], extCards, flowPrelude],
  ['y7-3-2-order', 'Activity 1: put a project\'s tasks in order, find the task that comes next or before, and say why the order matters.',
    'Year 7, 3.2: Put the Tasks in Order', 'The stages of a project',
    [['or-all', 'Put the Tasks in Order'], ['or-next', 'Which Comes Next?'], ['or-why', 'Why This Order?']], orderCards, planPrelude],
  ['y7-3-2-missing', 'Activity 2: find the task with no person, no deadline, or the missing stage in a plan, and say why it matters.',
    'Year 7, 3.2: What Is Missing from This Plan?', 'Find the gap',
    [['mi-gap', 'Find the Gap'], ['mi-read', 'Read the Plan'], ['mi-why', 'Why It Matters']], missingCards, planPrelude],
  ['y7-3-2-plans', 'Plenary: what a project plan lists, the stages in order, reading a plan, and why we plan.',
    'Year 7, 3.2: Project Plans', 'Plans, stages and why',
    [['pl-what', 'What a Plan Lists'], ['pl-stages', 'Stages in Order'], ['pl-read', 'Read the Plan'], ['pl-why', 'Why Plan?']], plenaryCards, planPrelude],
];
for (const [id, about, title, subtitle, cats, fn, pre] of DRILLS) {
  const src = `// Year 7, 3.2 Project Plans. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_y7_3_2.mjs: edit that, then run it. Every answer comes from the card's own data` +
    (pre === flowPrelude ? `,\n// or from running the card's own flowchart (Drills/flowchart-core.js), in Year 7's words.\n` : `, in Year 7's words.\n`) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {${body(pre)}\n${body(fn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  const code = src.replace(/^\/\/.*$/gm, '');
  // The Extension comes before every 3.2 term; Activity 1 comes before "project plan" and "deadline".
  if (id === 'y7-3-2-ext') assert(!/\b(projects?|plans?|stages?|deadlines?|tasks?)\b/i.test(code), 'the Extension uses a 3.2 term');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does: its answer passes, no distractor passes, no working step or
// example gives the answer away, and every Extension card has a worked example.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const id of DRILLS.map((d) => d[0])) {
    const ctx = { console, Math, DrillData: { register: (k, d) => { ctx.out = d; ctx.key = k; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'flowchart-core.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(ctx.key === id, `${id} registers as ${ctx.key}`);
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
    for (const card of d.cards) {
      for (let n = 0; n < 300; n++) {
        const r = { ...card, ...card.randomize() };
        if (card.type === 'multi') {
          // Pick every true reason: enough wrong ones to fill the five options, none also true, no length tell.
          const all = r.answers.concat(r.distractors).map(String);
          assert(r.answers.length >= 1 && r.answers.length <= 3 && r.distractors.length >= 4 && new Set(all).size === all.length, `${id} ${card.id}: options ${JSON.stringify(all)}`);
          const longest = Math.max(...r.distractors.map((w) => String(w).length));
          // Options that are the plan's own task names are as long as the tasks are.
          if (!/^pl-(slip|parallel)$/.test(card.id)) for (const a of r.answers) assert(String(a).length <= 1.15 * longest, `${id} ${card.id}: "${a}" is clearly the longest option`);
          assert(r.working && r.working.length >= 2 && !r.working.some((w) => r.answers.some((a) => w.includes(a))), `${id} ${card.id}: nudges`);
          assert(!/[\u2013\u2014]/.test(JSON.stringify(r)), `${id} ${card.id}: dash`);
          if (id === 'y7-3-2-order') assert(!/\b(project plans?|deadlines?)\b/i.test(JSON.stringify([r.prompt, r.answers, r.distractors, r.working, r.note])), `${id} ${card.id}: uses a term before it is taught`);
          continue;
        }
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
        assert(pass(ans.toLowerCase()) || /^[\d, ]+$/.test(ans) || /["]/.test(ans), `${id} ${card.id}: "${ans}" in lower case fails`);
        // No length tell: a sentence answer is never clearly the longest option.
        if (ans.length > 20 && r.distractors?.length) assert(ans.length <= 1.12 * Math.max(...r.distractors.map((w) => String(w).length)), `${id} ${card.id}: the answer is clearly the longest option ("${ans}")`);
        for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
        assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length && !r.distractors.map(String).includes(ans), `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        if (r.working && !inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
        if (r.example) {
          const whole = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
          assert(!(ans.length >= 3 && whole.test(r.example.toLowerCase()) && !whole.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        }
        if (id === 'y7-3-2-ext') assert(r.example, `${id} ${card.id}: no worked example`);
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: needs two nudges`);
        const shown = JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors, r.answers]);
        assert(!/[\u2013\u2014]/.test(shown), `${id} ${card.id}: dash`);
        // Activity 1 comes before the slide that teaches "project plan" and "deadline".
        if (id === 'y7-3-2-order') assert(!/\b(project plans?|deadlines?)\b/i.test(shown), `${id} ${card.id}: uses a term before it is taught`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: read it just before writing, change only
// Year 7, and write it back in the same format.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const y7 = all.years.find((y) => y.id === 'year7');
const unit = y7.units.find((u) => u.lessons.includes('y7-3-1-constructs'));
assert(unit, 'the unit with y7-3-1-constructs');
if (!unit.lessons.includes(ID)) {
  unit.lessons.splice(unit.lessons.indexOf('y7-3-1-constructs') + 1, 0, ID);
  const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const out = JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : '');
  // Re-read just before writing: if another builder changed the file meanwhile, stop rather than overwrite it.
  assert(fs.readFileSync(lp, 'utf8') === raw, 'lessons.json changed while building: run the builder again');
  fs.writeFileSync(lp, out);
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; unit: ${unit.title} [${unit.lessons.join(', ')}]`);
