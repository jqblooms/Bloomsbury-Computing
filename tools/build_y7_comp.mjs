// Builds LessonData/y7-comp-practice.json: Year 7, Competition Practice: Contest 2 Games (ACSL Junior Contest 2 at
// Year 7 level: prefix and postfix with small numbers, simple infix conversion, 4 and 5 bit strings with NOT, AND, OR,
// XOR and single shifts and circulates, short FOR loops). It also writes the lesson's two drills,
// Drills/data/y7-comp-practice-ext.js (the Do Now Extension: AND, OR, NOT and comparisons from the Year 7 Flowcharts
// unit) and Drills/data/y7-comp-practice.js (the plenary), and registers the lesson in a Year 7 "Competition Practice"
// unit of lessons.json.
//   node tools/build_y7_comp.mjs
// Mostly games: six slides are Comp Arcade games (CompArcadeY7/ in this repo, one app, embedQuery game=<name>), each
// posting its result as BC_APP_RESULT. Every expression, bit string and loop on a slide or a card is worked out by the
// same code the games run: NotationLab/core.js, BitFlicker/bits-core.js, shared/acsl-pseudocode.js and
// CompArcadeY7/js/gen.js, which the drill files carry a copy of. The Do Now flowchart is drawn and run by
// Drills/flowchart-core.js. ACSL terms and notation as in the acsl-c2 lessons. EAL-light: one idea a slide, plain short
// English, a teacher-only Think, Pair, Share under every heading that never gives a slide answer away.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FC = createRequire(import.meta.url)(path.join(ROOT, 'Drills', 'flowchart-core.js'));
const ID = 'y7-comp-practice';
const P = 'y7cp';
const re = (source, flags = 'i') => ({ __regex: true, source, flags });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// The engines, loaded once here exactly as the app and the drills load them.
const LIB_FILES = ['NotationLab/core.js', 'BitFlicker/bits-core.js', 'shared/acsl-pseudocode.js', 'CompArcadeY7/js/gen.js'];
const libSource = () => LIB_FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')).join('\n');
const lib = { console, Math, JSON };
lib.window = lib;
vm.createContext(lib);
vm.runInContext(libSource() + '\nthis.NC = NotationCore; this.B = BitCore; this.A = ACSLPseudo; this.G = CompGenY7;', lib);
const { NC, B, A, G } = lib;

// ---------------------------------------------------------------- slide pieces
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const mono = (s) => `<code style="font:700 1.02em var(--font-mono)">${esc(s)}</code>`;
const expr = (s, size = 1.4) => `<p style="font:700 ${size}rem/1.3 var(--font-mono);letter-spacing:.04em;margin:4px 0">${esc(s)}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
function table(head, rows, font = 16) {
  const cell = (t, h) => `<t${h} style="padding:3px 10px;text-align:left;font-size:${font}px">${t}</t${h}>`;
  return `<table class="donow-table" style="font-size:${font}px;width:100%"><thead><tr>${head.map((h) => cell(h, 'h')).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => cell(c, 'd')).join('')}</tr>`).join('')}</tbody></table>`;
}
const card = (title, body) => `<div style="padding:8px 12px;border-radius:10px;background:var(--surface-2)">${title ? `<p style="margin:0 0 4px;text-align:center"><strong>${title}</strong></p>` : ''}${body}</div>`;

const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${esc(heading)} part ${s}" autocomplete="off" spellcheck="false"></div>`;
  }).join('');
  const box = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} mark${parts.length > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, box) : box) };
}
function mcStep(id, label, heading, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `${extra}<div id="${cid}"></div>`, items };
}
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
// A Comp Arcade game on a slide: one app, the game picked by embedQuery. It posts BC_APP_RESULT, saved as the answer.
const game = (id, label, heading, lead, query) => Object.assign(embed(id, label, 'comp-arcade-y7', heading, lead), { embedQuery: query });

// Answer patterns.
const numAns = (n) => `^\\s*(${n}|${['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'][n] || n})\\s*\\.?\\s*$`;
const sayAns = (w) => `^\\s*(say\\s*:?\\s*)?["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
const arrowAns = (w) => `^\\s*(the\\s+)?${w}(\\s+arrow)?\\s*\\.?\\s*$`;

// ---------------------------------------------------------------- flowcharts (the Do Now), as in build_y7_3_2.mjs
const THEME = '--fc-box:var(--surface-2);--fc-edge:var(--brand);--fc-term:var(--muted);--fc-ink:var(--ink);' +
  '--fc-dec:rgba(253,214,99,.12);--fc-dec-edge:var(--warn);--fc-arrow:var(--brand);--fc-label:var(--warn);--fc-badge:var(--warn);--fc-badge-ink:#1f1400';
function chart(flow, maxH = 300, hlBoxes = []) {
  let i = -1;
  const svg = FC.svg(flow, !!flow.numbered).replace(/<(rect|polygon) class="fc-[btd]"/g, (m) => {
    i++;
    return hlBoxes.includes(i) ? m + ' style="stroke:var(--warn);stroke-width:5;fill:rgba(253,214,99,.3)"' : m;
  });
  return `<div class="lesson-fc" style="${THEME};display:flex;justify-content:center">` +
    svg.replace('<svg ', `<svg style="max-width:100%;max-height:${maxH}px;height:auto" `) + '</div>';
}
function branch(question, trueBox, falseBox) {
  return { nodes: [{ id: 's', type: 'terminal', text: 'Start' }, { id: 'd', type: 'decision', text: question },
    { id: 't', type: 'io', text: trueBox }, { id: 'e', type: 'terminal', text: 'End' }, { id: 'f', type: 'io', text: falseBox }],
  edges: [{ from: 's', to: 'd', label: null }, { from: 'd', to: 't', label: 'True' }, { from: 't', to: 'e', label: null },
    { from: 'd', to: 'f', label: 'False' }, { from: 'f', to: 'e', label: null }] };
}

// ---------------------------------------------------------------- bit rows and mini stacks (pictures on slides)
function bitCell(b, mark) {
  const look = b === ' ' ? 'visibility:hidden' : b === '?' ? 'border:2px dashed var(--line-strong);color:var(--muted)' :
    'background:var(--surface-3);color:' + (b === '1' ? 'var(--syn-number)' : 'var(--muted)');
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:32px;border-radius:7px;font:700 19px var(--font-mono);${look}` +
    `${mark ? ';outline:2px solid var(--brand);outline-offset:1px' : ''}">${b === '?' || b === ' ' ? (b === '?' ? '?' : '') : b}</span>`;
}
function bitRow(label, s, marks = [], w = 92, noteText = '') {
  return `<div style="display:flex;align-items:center;gap:10px;margin:3px 0"><span style="min-width:${w}px;text-align:right;font:700 15px var(--font-mono);color:var(--syn-operator)">${label}</span>` +
    `<span style="display:inline-flex;gap:4px">${s.split('').map((b, i) => bitCell(b, marks.includes(i))).join('')}</span>` +
    (noteText ? `<span style="font-size:14px;color:var(--muted)">${noteText}</span>` : '') + '</div>';
}
const rule = (w = 92) => `<div style="height:2px;background:var(--line-strong);margin:2px 0 2px ${w + 10}px;max-width:160px"></div>`;
// The stack after each token, drawn as little piles from left to right.
function stackPics(list, form) {
  const steps = NC.stackSteps(list, form);
  const pile = (st) => `<div style="display:flex;flex-direction:column-reverse;gap:3px;min-height:104px;width:52px;padding:4px;border:2px solid var(--line-strong);border-top:0;border-radius:0 0 9px 9px;background:var(--surface-2)">` +
    st.map((v, i) => `<span style="display:flex;align-items:center;justify-content:center;height:28px;border-radius:6px;border:2px solid ${i === st.length - 1 ? 'var(--warn)' : 'var(--brand)'};font:700 16px var(--font-mono);color:var(--ink)">${v}</span>`).join('') + '</div>';
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;justify-content:center">` + steps.map((s) =>
    `<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><span style="font:700 18px var(--font-mono);color:${NC.isOp(s.token) ? 'var(--syn-operator)' : 'var(--syn-number)'}">${esc(s.token)}</span>` +
    pile(s.stack) + `<span style="font-size:13px;color:var(--muted);text-align:center;max-width:80px">${s.kind === 'push' ? 'push' : esc(`${s.left} ${s.token} ${s.right} = ${s.value}`)}</span></div>`).join('') + '</div>';
}

// Think, Pair, Share under each heading: one short why question, the answer hidden until the teacher clicks. On a
// check slide it never gives or presupposes an answer on that slide (tools/tps-leak-check.mjs in the shell).
const TPS = {
  'do-now': ['Why write 1 or 0 for each key before you use AND, OR or NOT?', 'Then each rule is easy to use: you look at two small values, not at words.'],
  'title': ['In a contest, why is it better to be careful than to be fast?', 'Each question has one answer and no part marks. One slip loses the whole question, so careful wins.'],
  'forms': ['Why might "pre" and "post" be good names for two of these ways?', 'Pre means before and post means after: the operator comes before or after its two values.'],
  'forms-check': ['How can you tell the three ways apart at a glance?', 'Look at where the operators are: between the values, at the front, or at the end.'],
  'stack': ['Why must the first number popped go on the right?', 'It was pushed last, so it was written last. The number written first always goes on the left.'],
  'game-stack': ['Why is the answer always the last number left on the stack?', 'Every operator turns two numbers into one. When the last operator is done, only the answer is left.'],
  'prefix': ['Why do we read prefix from the right?', 'Each operator comes before its numbers. Reading from the right, its numbers are already on the stack when we reach it.'],
  'prefix-check': ['In prefix, why does the first number popped go on the left?', 'We read from the right, so the left number is pushed last. The last one pushed is the first one popped.'],
  'convert': ['Why put brackets round every operation first?', 'Then each operator has its own pair of brackets, so you know exactly which two values it joins.'],
  'convert-check': ['Why does postfix not need the brackets from (D + E) / F?', 'The order of the tokens already shows that + is worked out before /.'],
  'bits': ['Why can you work out AND, OR and XOR one column at a time?', 'Each column only uses the two bits in that column. No column changes another one.'],
  'game-bits': ['Why does the board give you only one check?', 'So you work out every bit before you check, as in the contest, and do not just try switches until it works.'],
  'shifts': ['Why does a shift bring in a 0, but a circulate does not?', 'A shift loses the bit that falls off, so a 0 fills the gap. A circulate puts that same bit in the gap.'],
  'game-shifts': ['In a two-step question, why do you work out the brackets first?', 'The operator outside the brackets works on the answer of the brackets, so that answer must come first.'],
  'loops': ['Why does the loop stop after i = 4?', 'After i = 4, NEXT makes i = 5. That is past the end number 4, so the loop stops.'],
  'game-loop': ['Why predict before you watch the runner?', 'Predicting makes you trace the loop yourself. The run then shows if your trace was right.'],
  'quiz': ['Why talk with your team before you answer?', 'Two people check each other\'s working, so a slip is more likely to be caught.'],
  'contest': ['Why write your working on paper in a contest?', 'You can check each step again, and one slip early on is easy to find.'],
  'plenary': ['Why does a card need 3 right in a row, not just 1?', 'One right answer could be luck. Three in a row shows you can do it every time.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now (Year 7 Lesson 3): AND, OR, NOT in a decision
const DN = branch('Up AND Space pressed?', 'Say "Jump"', 'Say "Run"');
const said = (keys) => FC.run(DN, { keys }).said[0];
assert(said({ Up: 1, Space: 0 }) === 'Run' && said({ Up: 1, Space: 1 }) === 'Jump', 'do-now flowchart');
const DN_NOT = FC.run(branch('NOT Space pressed?', 'Say "A"', 'Say "B"'), { keys: { Space: 0 } }).said[0] === 'A' ? 'True' : 'False';
assert(DN_NOT === 'True', 'do-now NOT');
// Walk me through it: the same three kinds of question on another flowchart, with other words and other answers.
const WF = branch('Left OR Down pressed?', 'Say "Duck"', 'Say "Walk"');
const wSaid = (keys) => FC.run(WF, { keys }).said[0];
assert(wSaid({ Left: 0, Down: 1 }) === 'Duck' && wSaid({ Left: 0, Down: 0 }) === 'Walk', 'walkthrough flowchart');
const wNot = FC.run(branch('NOT Left pressed?', 'Say "A"', 'Say "B"'), { keys: { Left: 1 } }).said[0] === 'A' ? 'True' : 'False';
assert(wNot === 'False' && wNot !== DN_NOT, 'walkthrough NOT ends on the other arrow');
const WT_DONOW = { title: 'Walk me through it: AND, OR and NOT', steps: [
  { text: 'This is a different flowchart with the same kind of questions. First: Left is not pressed, and Down is pressed.', visual: chart(WF, 240) },
  { text: 'Write a value for each key: <strong>1</strong> for pressed, <strong>0</strong> for not pressed.', visual: chart(WF, 240, [1]) + note('Left = 0, Down = 1') },
  { text: 'OR gives 1 when <strong>at least one</strong> part is 1. Down is 1, so Left OR Down is 1.', visual: chart(WF, 240, [1]) + note('0 OR 1 = ' + hl('1')) },
  { text: '1 follows the True arrow. The sprite says <strong>Duck</strong>.', visual: chart(WF, 240, [2]) + note('Says: ' + hl('Duck')) },
  { text: 'Now neither key is pressed. 0 OR 0 is 0, so follow the other arrow. The sprite says <strong>Walk</strong>.', visual: chart(WF, 240, [4]) + note('0 OR 0 = 0: says ' + hl('Walk')) },
  { text: 'NOT swaps the value. A new decision, NOT Left pressed?, with Left pressed: Left is 1, so NOT Left is 0.', visual: note('Left = 1, NOT Left = ' + hl('0')) + note('0 follows the arrow for 0.') },
  { text: 'Now do your flowchart the same way: write 1 or 0 for each key, use the rule, then follow the arrow.', visual: chart(WF, 240) },
] };
steps.push(checkStep('do-now', 'Do Now: AND, OR, NOT', 'Do Now: AND, OR, NOT', 'From Lesson 3. Write 1 for pressed, 0 for not pressed.', [
  { label: 'Up pressed, Space not pressed. What does it say?', answer: sayAns('run'), feedback: 'Write 1 or 0 for each key. AND needs both to be 1. Then follow that arrow.' },
  { label: 'NOT Space pressed? Space not pressed. True or False?', answer: arrowAns('true'), feedback: 'Space is 0. NOT swaps the value. 1 follows one arrow, 0 the other.' },
], chart(DN, 250)));
steps[steps.length - 1].walkthrough = WT_DONOW;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y7-comp-practice-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on AND, OR, NOT and comparing numbers. Stuck? Switch on <strong>I need help</strong> to see a similar question worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Competition Practice: Contest 2 Games',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Competition Practice</p><h2 class="lesson-h2">Competition Practice: Contest 2 Games</h2><p>Year 7</p></div>' +
    facts(['<strong>Today:</strong> the three topics of the next contest, with a game for each one.',
      '<strong>Then:</strong> a team quiz and a mini contest with stars.',
      '<strong>The big question:</strong> how can a computer work out a sum that has no brackets?']) });

// ---------------------------------------------------------------- three ways to write a sum
const F1 = NC.parseInfix('7 - 2'), F2 = NC.parseInfix('(A + B) * C');
steps.push({ id: 'forms', label: 'Three Ways to Write a Sum', content: '<h2 class="lesson-h2">Three Ways to Write a Sum</h2>' +
  '<p class="lesson-lead">An <strong>operator</strong> is + - * or /. It joins <strong>two values</strong>. The three ways put the operator in different places.</p>' +
  table(['Way', 'The operator goes', 'Example', 'With brackets'], [
    ['<strong>Infix</strong>', 'between the two values', mono(NC.toInfix(F1)), mono(NC.toInfix(F2))],
    ['<strong>Prefix</strong>', 'before the two values', mono(NC.show(NC.toPrefix(F1))), mono(NC.show(NC.toPrefix(F2)))],
    ['<strong>Postfix</strong>', 'after the two values', mono(NC.show(NC.toPostfix(F1))), mono(NC.show(NC.toPostfix(F2)))],
  ], 18) +
  facts(['All three mean the same sum: 7 - 2.', 'Prefix and postfix <strong>never need brackets</strong>.', 'Computers like postfix. Next you will see why.']) });
assert(NC.show(NC.toPostfix(F1)) === '7 2 -' && NC.show(NC.toPrefix(F2)) === '* + A B C', 'forms table');

steps.push(mcStep('forms-check', 'Your Turn: Which Way?', 'Your Turn: Which Way?', '', [
  { prompt: 'Which of these is postfix?', options: ['- 9 4', '9 4 -', '9 - 4'], correct: 1, explain: 'In postfix the operator comes after its two values: 9 4 -.' },
  { prompt: 'Which is A * B written in prefix?', options: ['* A B', 'A B *', 'A * B'], correct: 0, explain: 'In prefix the operator comes first, then the values in the same order: * A B.' },
]));

// ---------------------------------------------------------------- postfix with a stack
const TEACH_POST = NC.tokens('6 2 - 4 *');
assert(NC.evaluate(NC.parsePostfix(TEACH_POST)) === 16, 'teach postfix');
steps.push({ id: 'stack', label: 'Postfix: Use a Stack', content: '<h2 class="lesson-h2">Postfix: Use a Stack</h2>' +
  '<p class="lesson-lead">A <strong>stack</strong> is a pile. You <strong>push</strong> a number onto the top. You <strong>pop</strong> a number off the top.</p>' +
  columns(facts(['Read from <strong>left to right</strong>.', 'A number: <strong>push</strong> it.', 'An operator: <strong>pop</strong> two numbers, work them out, push the answer.',
    'The <strong>first</strong> number popped goes on the <strong>right</strong>.', 'At the end one number is left: the answer.']),
  card(esc(NC.show(TEACH_POST)), stackPics(TEACH_POST, 'postfix'))) });

steps.push(game('game-stack', 'Game 1: Stack Stacker', 'Game 1: Stack Stacker',
  'Push or pop at each token, then type each answer. A mistake costs a heart. Win 2 rounds to go up a level.', 'game=stack&form=postfix'));

// ---------------------------------------------------------------- prefix
const TEACH_PRE = NC.tokens('+ * 2 3 4');
assert(NC.evaluate(NC.parsePrefix(TEACH_PRE)) === 10, 'teach prefix');
steps.push({ id: 'prefix', label: 'Prefix: Read from the Right', content: '<h2 class="lesson-h2">Prefix: Read from the Right</h2>' +
  '<p class="lesson-lead">Prefix uses the same stack. Read it the other way.</p>' +
  columns(facts(['Read from <strong>right to left</strong>.', 'A number: push it.', 'An operator: pop two numbers, work them out, push the answer.',
    'The <strong>first</strong> number popped goes on the <strong>left</strong>.']),
  card(esc(NC.show(TEACH_PRE)) + ' <span style="font-weight:400;color:var(--muted)">(read from the right)</span>', stackPics(TEACH_PRE, 'prefix'))) });

const PC = [['- 8 3', 5], ['+ 2 * 3 4', 14]];
for (const [s, v] of PC) assert(NC.evaluate(NC.parsePrefix(s)) === v, 'prefix check ' + s);
steps.push(checkStep('prefix-check', 'Your Turn: Prefix', 'Your Turn: Prefix', 'Read from the right. Use the stack on paper.', [
  { label: `Work out ${mono(PC[0][0])}`, answer: numAns(PC[0][1]), feedback: 'Push from the right. At the operator, the first number popped goes on the left.' },
  { label: `Work out ${mono(PC[1][0])}`, answer: numAns(PC[1][1]), feedback: 'Start at the right end. Work out the * part first, then the front operator.' },
]));

// ---------------------------------------------------------------- infix to postfix and prefix
const TEACH_CONV = NC.parseInfix('A + B * C');
const tcFull = NC.toInfix(TEACH_CONV, { full: true });
steps.push({ id: 'convert', label: 'Infix to Postfix and Prefix', content: '<h2 class="lesson-h2">Infix to Postfix and Prefix</h2>' +
  '<p class="lesson-lead">Three steps. Remember: * and / are worked out before + and -.</p>' +
  '<ol class="lesson-facts"><li>Put <strong>brackets</strong> round every operation, in the order you work it out.</li>' +
  '<li><strong>Move</strong> each operator to the end (postfix) or the front (prefix) of its own brackets.</li><li><strong>Remove</strong> the brackets.</li></ol>' +
  table(['Infix: ' + mono(NC.toInfix(TEACH_CONV)), 'Postfix', 'Prefix'], [
    ['1. Brackets', mono(tcFull), mono(tcFull)],
    ['2. Move', mono(G.moved(TEACH_CONV, 'postfix')), mono(G.moved(TEACH_CONV, 'prefix'))],
    ['3. Remove', mono(NC.show(NC.toPostfix(TEACH_CONV))), mono(NC.show(NC.toPrefix(TEACH_CONV)))],
  ], 17) });

const CV1 = NC.parseInfix('A * B + C'), CV2 = NC.parseInfix('A * (B + C)');
const CV1_POST = NC.toPostfix(CV1), CV2_PRE = NC.toPrefix(CV2);
assert(NC.show(CV1_POST) === 'A B * C +' && NC.show(CV2_PRE) === '* A + B C', 'convert check');
steps.push(checkStep('convert-check', 'Your Turn: Convert', 'Your Turn: Convert', 'Spaces are optional.', [
  { line: true, label: `Write ${mono(NC.toInfix(CV1))} in postfix.`, answer: NC.seqRe(CV1_POST), feedback: 'Brackets round the * part first. Then move each operator to the end of its own brackets.' },
  { line: true, label: `Write ${mono(NC.toInfix(CV2))} in prefix.`, answer: NC.seqRe(CV2_PRE), feedback: 'The brackets are worked out first. Move each operator to the front of its own brackets.' },
]));

// ---------------------------------------------------------------- bit strings: NOT, AND, OR, XOR
const BA = '1100', BB = '1010';
const opCard = (op, ruleText) => card(op, bitRow('', BA, [], 40) + bitRow(op, BB, [], 40) + rule(40) + bitRow('', B.evaluate(`${BA} ${op} ${BB}`), [], 40) +
  `<p style="margin:4px 0 0;font-size:14px;text-align:center">${ruleText}</p>`);
steps.push({ id: 'bits', label: 'Bit Strings: NOT, AND, OR, XOR', content: '<h2 class="lesson-h2">Bit Strings: NOT, AND, OR, XOR</h2>' +
  `<p class="lesson-lead">A <strong>bit string</strong> is a row of bits, like ${mono('10110')}. Work one column at a time. <strong>XOR</strong> is new.</p>` +
  `<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">` +
  card('NOT', bitRow('NOT', BA, [], 40) + rule(40) + bitRow('', B.evaluate('NOT ' + BA), [], 40) + '<p style="margin:4px 0 0;font-size:14px;text-align:center">flips <strong>every</strong> bit</p>') +
  opCard('AND', '1 only if <strong>both</strong> are 1') + opCard('OR', '1 if <strong>at least one</strong> is 1') + opCard('XOR', '1 if they are <strong>different</strong>') + '</div>' +
  facts(['The answer has the same number of bits.', 'XOR: 1 and 0 give 1. Two the same give 0.']) });
assert(B.evaluate(`${BA} XOR ${BB}`) === '0110' && B.evaluate(`${BA} AND ${BB}`) === '1000' && B.evaluate(`${BA} OR ${BB}`) === '1110', 'bit cards');

steps.push(game('game-bits', 'Game 2: Bit Switch Board', 'Game 2: Bit Switch Board',
  'Flip the switches to show the answer, then press Check. One check each round. Win 2 rounds to go up a level.', 'game=bits&ops=logic'));

// ---------------------------------------------------------------- shifts and circulates
const SH = '10011';
const shiftRows = [['LSHIFT-1', 'the left bit falls off, a 0 comes in on the right'], ['RSHIFT-1', 'the right bit falls off, a 0 comes in on the left'],
  ['LCIRC-1', 'the left bit comes back on the right'], ['RCIRC-1', 'the right bit comes back on the left']];
const shown = shiftRows.map(([op]) => B.evaluate(op + ' ' + SH));
assert(new Set(shown).size === 4 && shown.join() === '00110,01001,00111,11001', 'shift examples');
steps.push({ id: 'shifts', label: 'Shifts and Circulates', content: '<h2 class="lesson-h2">Shifts and Circulates</h2>' +
  '<p class="lesson-lead">These move every bit one place. The number after the dash says how many places.</p>' +
  columns(card('Start: ' + mono(SH), bitRow('start', SH, [], 92) + rule(92) +
    shiftRows.map(([op], i) => bitRow(op, shown[i], op.charAt(0) === 'L' ? [SH.length - 1] : [0], 92)).join('')),
  facts(['<strong>Shift</strong> (LSHIFT, RSHIFT): the bit that falls off is <strong>lost</strong>. A 0 comes in at the other end.',
    '<strong>Circulate</strong> (LCIRC, RCIRC): the bit that falls off <strong>comes back</strong> at the other end.',
    `${mono('LSHIFT-2')} moves 2 places: do LSHIFT-1 twice.`, 'The answer always has the same number of bits.'])) });

steps.push(game('game-shifts', 'Game 3: Shift Switch Board', 'Game 3: Shift Switch Board',
  'The same board with shifts and circulates. Level 4 has two steps: set both rows. One check each round.', 'game=bits&ops=shift'));

// ---------------------------------------------------------------- FOR loops (ACSL pseudocode)
const LOOP = ['c = 0', 'FOR i = 1 TO 4', '  c = c + 2', 'NEXT i', 'OUTPUT c'];
const LR = A.run(LOOP.join('\n'), { trace: true });
assert(!LR.error && LR.outputs[0] === '8', 'loop example');
const lapRows = LR.events.filter((e) => e.type === 'assign' && e.name === 'c' && e.line === 3).map((e, k) => [String(k + 1), String(k + 1), String(e.value)]);
const codeBox = (lines) => '<div class="lesson-code">' + lines.map((l, i) => `<div class="lesson-code-line">${String(i + 1).padStart(2, '0')}&nbsp;&nbsp;${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length * 2))}</div>`).join('') + '</div>';
const STEP_VALS = A.run(['FOR i = 1 TO 9 STEP 2', '  OUTPUT i', 'NEXT i'].join('\n')).outputs.join(', ');
assert(STEP_VALS === '1, 3, 5, 7, 9', 'step values');
steps.push({ id: 'loops', label: 'FOR Loops in Contest Code', content: '<h2 class="lesson-h2">FOR Loops in Contest Code</h2>' +
  columns(codeBox(LOOP) + facts([`${mono('FOR i = 1 TO 4')} gives i the values 1, 2, 3, 4.`, 'The lines between <strong>FOR</strong> and <strong>NEXT</strong> run once for each value.',
    `${mono('STEP 2')} adds 2 each time: ${mono('FOR i = 1 TO 9 STEP 2')} gives ${STEP_VALS}.`, `${mono('OUTPUT c')} shows the value of c.`]),
  table(['Turn', 'i', 'c after line 3'], [['start', '', '0']].concat(lapRows), 16) + `<p class="lesson-lead" style="margin-top:6px">Output: <strong>${LR.outputs[0]}</strong></p>`) });

steps.push(game('game-loop', 'Game 4: Loop Runner', 'Game 4: Loop Runner',
  'Predict first, then lock it in. The runner does one lap for every turn of the loop. Win 2 rounds to go up a level.', 'game=loop'));

// ---------------------------------------------------------------- the team quiz and the mini contest
steps.push(game('quiz', 'Team Quiz Board', 'Team Quiz Board',
  'Teacher: run this on the projector. Teams talk, then answer out loud. Show the answer, then give the points.', 'game=quiz'));
steps.push(game('contest', 'Mini Contest', 'Mini Contest',
  'Five questions in five minutes, like the real contest. Write your working on paper. Hand in to see your stars.', 'game=contest&minutes=5'));

steps.push(embed('plenary', 'Plenary: Contest 2 Drill', 'drill-y7-comp-practice', 'Plenary: Contest 2 Drill',
  'Get 3 right in a row on a card to master it. New numbers every time. Your progress is saved.'));

// Every slide but the Extension gets its Think, Pair, Share under the heading (the title slide: at the end).
for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], TPS[st.id][1]));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '') + tps(TPS.title[0], TPS.title[1]);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => { const v = validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern; return new RegExp(v.source, v.flags).test(s); };
for (const [k, i, ok, bad] of [
  ['do-now', 0, ['Run', 'run', 'Say "Run"', '"Run"', 'run.'], ['Jump', 'Walk', 'True']],
  ['do-now', 1, ['True', 'true', 'the True arrow', 'True arrow'], ['False', 'Run', '1']],
  ['prefix-check', 0, ['5', ' 5 ', 'five', '5.'], ['-5', '11', '6']],
  ['prefix-check', 1, ['14', 'fourteen'], ['20', '10', '24']],
  ['convert-check', 0, ['A B * C +', 'AB*C+', 'a b * c +', 'A,B,*,C,+', 'A B x C +'], ['A B C + *', 'A * B C +', '+ * A B C', 'A B C * +']],
  ['convert-check', 1, ['* A + B C', '*A+BC', '* a + b c'], ['+ * A B C', 'A B C + *', '* + A B C', '* A B + C']],
]) {
  for (const s of ok) assert(V(k, i, s), `${k} ${i} accepts ${s}`);
  for (const s of bad) assert(!V(k, i, s), `${k} ${i} rejects ${s}`);
}
const plain = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&rarr;/g, '->').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };
// Feedback nudges and never contains an accepted answer.
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, p.pattern.flags), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 8); b++) assert(!rx.test(w.slice(a, b).join(' ').replace(/[.,:?]+$/, '')), `feedback leaks: ${k}${p.suffix}`);
}
// No Think, Pair, Share passes a check on its own slide; the Do Now walkthrough never says a Do Now word answer.
for (const s of steps.filter((x) => x.validatorKey)) {
  const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, v.pattern.flags));
  const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
  for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS passes part ${'abcd'[i]}: "${pc}"`));
}
assert(!/\b(run|jump)\b/i.test(plain(JSON.stringify(WT_DONOW.steps.map((x) => x.text + ' ' + x.visual)))), 'walkthrough says a Do Now answer');
for (const s of steps.filter((x) => x.type === 'multiple-choice')) {
  const t = plain(s.content.match(/<details class="lesson-tps">([\s\S]*?)<\/details>/)[1]);
  for (const it of s.items) assert(!t.includes(it.options[it.correct]), `${s.id}: TPS contains the right option`);
}
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it (the title slide only names the day).
const TEACH = [[/\b(prefix|postfix|infix)\b/i, 'forms'], [/\boperators?\b/i, 'forms'], [/\bstacks?\b/i, 'stack'], [/\b(push|pop)(ped|s)?\b/i, 'stack'],
  [/\bbit strings?\b|\bXOR\b/i, 'bits'], [/\b(LSHIFT|RSHIFT|LCIRC|RCIRC)|\bshifts?\b|\bcirculates?\b/i, 'shifts'], [/\b(FOR|NEXT|STEP|OUTPUT)\b/, 'loops']];
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    TEACH.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
{
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all), 'emoji found');
  assert(!/mario|party/i.test(all), 'game mention');
  assert(new Set(steps.map((s) => s.id)).size === steps.length, 'duplicate step ids');
}
const lesson = { id: ID, label: 'Competition Practice: Contest 2 Games', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drills
// The Extension: AND, OR, NOT and comparisons from the Year 7 Flowcharts unit (before any lesson term).
function extCards() {
  var KEYS = [["Up", "Right"], ["Space", "Enter"], ["Left", "Down"], ["A", "B"]];
  var SAYS = [["Jump", "Walk"], ["Fire", "Wait"], ["Slide", "Stand"], ["Go", "Stop"]];
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function bit() { return Math.random() < 0.5 ? 1 : 0; }
  function pressed(v) { return v ? "pressed" : "not pressed"; }
  function bitKw(v) { return new RegExp("^\\s*" + v + "\\s*\\.?\\s*$"); }
  function wordKw(w) { return new RegExp("^\\s*(say\\s*:?\\s*)?[\"'\\u201c]?\\s*" + w + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", "i"); }
  function arrowKw(w) { return new RegExp("^\\s*(the\\s+)?" + w + "(\\s+arrow)?\\s*\\.?\\s*$", "i"); }
  var RULES = { AND: "AND is 1 only when both parts are 1.", OR: "OR is 1 when at least one part is 1.", NOT: "NOT swaps the value: 1 becomes 0, 0 becomes 1." };
  function ex(lines) { return "A similar question:\n" + lines.join("\n"); }
  // A card about two keys and one word: values are drawn, the answer is worked out by the rule.
  function two(id, op) {
    return { id: id, category: "x-logic", randomize: function () {
      var k = pick(KEYS), a = bit(), b = bit(), v = op === "AND" ? a & b : a | b;
      var e = pick(KEYS.filter(function (x) { return x !== k; })), ea = bit(), eb = bit(), ev = op === "AND" ? ea & eb : ea | eb;
      return { prompt: k[0] + " is " + pressed(a) + ". " + k[1] + " is " + pressed(b) + ". What is " + k[0] + " " + op + " " + k[1] + "? Type 1 or 0.",
        answers: [String(v)], keywords: [bitKw(v)], distractors: [String(1 - v)], format: "Type 1 or 0",
        example: ex([e[0] + " is " + pressed(ea) + ". " + e[1] + " is " + pressed(eb) + ".", "Write the values: " + e[0] + " = " + ea + ", " + e[1] + " = " + eb + ".", RULES[op], e[0] + " " + op + " " + e[1] + " = " + ev + "."]),
        working: ["Write 1 for pressed and 0 for not pressed.", RULES[op]], note: k[0] + " = " + a + ", " + k[1] + " = " + b + ". " + RULES[op] + " Answer: " + v + "." };
    } };
  }
  function notCard(id) {
    return { id: id, category: "x-logic", randomize: function () {
      var k = pick(KEYS)[0], a = bit(), v = 1 - a, e = pick(KEYS)[1], ea = bit();
      return { prompt: k + " is " + pressed(a) + ". What is NOT " + k + "? Type 1 or 0.", answers: [String(v)], keywords: [bitKw(v)], distractors: [String(a)], format: "Type 1 or 0",
        example: ex([e + " is " + pressed(ea) + ".", "Write the value: " + e + " = " + ea + ".", RULES.NOT, "NOT " + e + " = " + (1 - ea) + "."]),
        working: ["Write 1 for pressed and 0 for not pressed.", RULES.NOT], note: k + " = " + a + ", so NOT " + k + " = " + v + "." };
    } };
  }
  // Brackets first: NOT (A AND B), A AND NOT B, (A OR B) AND C, A OR B OR C.
  function mixCard(id, kind) {
    function work(a, b, c) {
      if (kind === "notand") return { v: 1 - (a & b), steps: ["Brackets first: A AND B = " + (a & b) + ".", "NOT swaps it: " + (1 - (a & b)) + "."] };
      if (kind === "andnot") return { v: a & (1 - b), steps: ["NOT first: NOT B = " + (1 - b) + ".", "A AND " + (1 - b) + " = " + (a & (1 - b)) + "."] };
      if (kind === "orand") return { v: (a | b) & c, steps: ["Brackets first: A OR B = " + (a | b) + ".", (a | b) + " AND C = " + ((a | b) & c) + "."] };
      return { v: a | b | c, steps: ["OR is 1 when at least one part is 1.", "A OR B OR C = " + (a | b | c) + "."] };
    }
    var TEXT = { notand: "NOT (A AND B)", andnot: "A AND NOT B", orand: "(A OR B) AND C", or3: "A OR B OR C" };
    return { id: id, category: "x-mixed", randomize: function () {
      var a = bit(), b = bit(), c = bit(), w = work(a, b, c), ea, eb, ec, ew;
      do { ea = bit(); eb = bit(); ec = bit(); ew = work(ea, eb, ec); } while (ea === a && eb === b && ec === c);
      var vals = function (x, y, z) { return "A = " + x + ", B = " + y + (kind === "orand" || kind === "or3" ? ", C = " + z : "") + "."; };
      return { prompt: vals(a, b, c) + " What is " + TEXT[kind] + "? Type 1 or 0.", answers: [String(w.v)], keywords: [bitKw(w.v)], distractors: [String(1 - w.v)], format: "Type 1 or 0",
        example: ex([vals(ea, eb, ec) + " What is " + TEXT[kind] + "?"].concat(ew.steps)),
        working: ["Work out the brackets first. NOT goes with the value just after it.", "AND needs both to be 1. OR needs at least one 1. NOT swaps."],
        note: w.steps.join(" ") };
    } };
  }
  // A decision with a word on each arrow.
  function sayCard(id, op) {
    return { id: id, category: "x-decide", randomize: function () {
      var k = pick(KEYS), s = pick(SAYS), a = bit(), b = bit(), v = op === "AND" ? a & b : a | b, ans = v ? s[0] : s[1];
      var e = pick(KEYS.filter(function (x) { return x !== k; })), es = pick(SAYS.filter(function (x) { return x !== s; })), ea = bit(), eb = bit(), ev = op === "AND" ? ea & eb : ea | eb;
      return { prompt: "Decision: " + k[0] + " " + op + " " + k[1] + " pressed? True: Say \"" + s[0] + "\". False: Say \"" + s[1] + "\".\n" + k[0] + " is " + pressed(a) + ". " + k[1] + " is " + pressed(b) + ". What does the sprite say?",
        answers: [ans], keywords: [wordKw(ans)], distractors: [v ? s[1] : s[0], "True", "False"],
        example: ex(["Decision: " + e[0] + " " + op + " " + e[1] + " pressed? True: Say \"" + es[0] + "\". False: Say \"" + es[1] + "\".", e[0] + " = " + ea + ", " + e[1] + " = " + eb + ".", e[0] + " " + op + " " + e[1] + " = " + ev + ".", ev + " follows the " + (ev ? "True" : "False") + " arrow: Say \"" + (ev ? es[0] : es[1]) + "\"."]),
        working: ["Write 1 for pressed and 0 for not pressed.", RULES[op] + " 1 follows True, 0 follows False."], note: k[0] + " = " + a + ", " + k[1] + " = " + b + ": " + v + ", so the sprite says " + ans + "." };
    } };
  }
  // Comparisons: is the decision True or False? The value is often on the line.
  function cmpCard(id, op) {
    var NAMES = ["Score", "Coins", "Lives", "Points"];
    function test(x, n) { return op === ">" ? x > n : op === "<" ? x < n : op === "=" ? x === n : x !== n; }
    var WORD = { ">": "bigger than", "<": "smaller than", "=": "the same as", "<>": "not the same as" };
    return { id: id, category: "x-decide", randomize: function () {
      var name = pick(NAMES), n = 10 + Math.floor(Math.random() * 40), x = pick([n, n, n + 1 + Math.floor(Math.random() * 5), n - 1 - Math.floor(Math.random() * 5)]);
      var ans = test(x, n) ? "True" : "False";
      var en = n + 7, ex2 = pick([en, en + 2, en - 3]), eans = test(ex2, en) ? "True" : "False";
      return { prompt: "Decision: " + name + " " + op + " " + n + "? " + name + " is " + x + ". Which arrow does it follow, True or False?",
        answers: [ans], keywords: [arrowKw(ans)], distractors: [ans === "True" ? "False" : "True"],
        example: ex(["Decision: Points " + op + " " + en + "? Points is " + ex2 + ".", "Is " + ex2 + " " + WORD[op] + " " + en + "? " + (eans === "True" ? "Yes" : "No") + ".", "So it follows the " + eans + " arrow."]),
        working: ["Put the number into the question. Is it " + WORD[op] + " " + n + "?", "Check equal numbers carefully: the same is not bigger and not smaller."],
        note: name + " is " + x + ". Is " + x + " " + WORD[op] + " " + n + "? " + (ans === "True" ? "Yes" : "No") + ": " + ans + "." };
    } };
  }
  return [two("x-and", "AND"), two("x-or", "OR"), notCard("x-not"), mixCard("x-notand", "notand"), mixCard("x-andnot", "andnot"),
    mixCard("x-orand", "orand"), mixCard("x-or3", "or3"), sayCard("x-say-and", "AND"), sayCard("x-say-or", "OR"), cmpCard("x-cmp-gt", ">"), cmpCard("x-cmp-lt", "<")];
}

// The plenary: the lesson's four topics, drawn from CompGenY7 (the same code as the games).
function plenaryCards() {
  var G = CompGenY7;
  function card(id, category, kind, level, extra) {
    return { id: id, category: category, randomize: function () {
      var k = typeof kind === "string" ? kind : G.pick(kind), q = G.question(k, level, extra), e = G.similar(k, level, q, extra);
      var shown = q.show.type === "code" ? q.show.lines.join("\n") : q.show.text;
      var exShown = e ? (e.show.type === "code" ? e.show.lines.join("\n") : e.show.text) : "";
      return { prompt: q.prompt + "\n" + shown, answers: [q.answer], keywords: [q.re], distractors: q.wrong,
        example: e ? "A similar question:\n" + e.prompt + "\n" + exShown + "\n" + e.steps.join("\n") + "\nAnswer: " + e.answer : null,
        working: q.working, note: q.note, format: q.format };
    } };
  }
  return [
    card("pp-post-1", "pp", "postfix", 1), card("pp-post-2", "pp", "postfix", 2), card("pp-post-3", "pp", "postfix", 3),
    card("pp-pre-1", "pp", "prefix", 1), card("pp-pre-2", "pp", "prefix", 2),
    card("cv-post-1", "cv", "to-postfix", 1), card("cv-post-2", "cv", "to-postfix", 2), card("cv-post-3", "cv", "to-postfix", 3),
    card("cv-pre-1", "cv", "to-prefix", 1), card("cv-pre-2", "cv", "to-prefix", 2),
    card("bt-not", "bt", "bits-not", 1), card("bt-andor", "bt", ["bits-and", "bits-or"], 2), card("bt-xor", "bt", "bits-xor", 2),
    card("bt-shift", "bt", ["bits-lshift", "bits-rshift"], 2), card("bt-circ", "bt", ["bits-lcirc", "bits-rcirc"], 2), card("bt-two", "bt", "bits-two", 2),
    card("lp-1", "lp", "loop", 1, { ask: "output" }), card("lp-2", "lp", "loop", 2), card("lp-3", "lp", "loop", 3, { ask: "turns" }), card("lp-4", "lp", "loop", 4)
  ];
}

const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };
const libForDrill = LIB_FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n').replace(/^if \(typeof module[^\n]*\n?/m, '')).join('\n');
const DRILLS = [
  ['y7-comp-practice-ext', 'Do Now Extension: AND, OR, NOT and comparisons in decisions, from the Year 7 Flowcharts unit.',
    'Year 7 Extension: AND, OR, NOT and Comparisons', 'Competition Practice Do Now Extension',
    [['x-logic', 'AND, OR, NOT'], ['x-mixed', 'Brackets and NOT'], ['x-decide', 'Decisions']], extCards, false],
  ['y7-comp-practice', 'Plenary: prefix and postfix with a stack, infix to postfix and prefix, bit strings, and FOR loops.',
    'Year 7: Contest 2 Practice', 'Competition Practice',
    [['pp', 'Prefix and Postfix'], ['cv', 'Infix to Postfix and Prefix'], ['bt', 'Bit Strings'], ['lp', 'FOR Loops']], plenaryCards, true],
];
for (const [id, about, title, subtitle, cats, fn, withLib] of DRILLS) {
  const src = `// Year 7, Competition Practice. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_y7_comp.mjs: edit that, then run it.` + (withLib ? ` The cards carry a copy of NotationLab/core.js,\n// BitFlicker/bits-core.js, shared/acsl-pseudocode.js and CompArcadeY7/js/gen.js, so every answer is computed when the\n// card is drawn, by the same code as the Comp Arcade games.\n` : ` Every answer is worked out from the card's own values.\n`) +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {\n${withLib ? libForDrill + '\n' : ''}${body(fn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src.replace(/^\/\/.*$/gm, '')), `drill ${id} mentions the game`);
  if (!withLib) assert(!/\b(prefix|postfix|infix|stack|bit string|XOR|LSHIFT|RSHIFT|LCIRC|RCIRC|FOR|NEXT|STEP)\b/.test(body(fn)), 'the Extension uses a lesson term');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does: its answer passes, no distractor passes, no working step or
// example gives the answer away, and every card has a worked example and two nudges.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const id of DRILLS.map((d) => d[0])) {
    const ctx = { console, Math, JSON, DrillData: { register: (k, d) => { ctx.out = d; ctx.key = k; } } };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(ctx.key === id, `${id} registers as ${ctx.key}`);
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
    for (const c of d.cards) {
      for (let n = 0; n < 150; n++) {
        const r = { ...c, ...c.randomize() };
        const pass = (s) => r.keywords.some((k) => k.test(String(s).replace(/\s*\.+\s*$/, '')));
        const ans = String(r.answers[0]);
        for (const v of [ans, ans.toLowerCase(), ans + '.', '  ' + ans + '  ', ans.replace(/\s+/g, '')]) assert(pass(v), `${id} ${c.id}: "${v}" fails (answer ${ans})`);
        assert(r.distractors.length >= 1 && new Set(r.distractors).size === r.distractors.length && !r.distractors.includes(ans), `${id} ${c.id}: distractors ${JSON.stringify(r.distractors)}`);
        if (id === 'y7-comp-practice') assert(r.distractors.length === 3, `${id} ${c.id}: three distractors`);
        for (const w of r.distractors) assert(!pass(w), `${id} ${c.id}: distractor "${w}" passes (answer ${ans})`);
        assert(r.working && r.working.length >= 2, `${id} ${c.id}: needs two nudges`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        if (!inPrompt && ans.length > 1) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${c.id}: working shows "${ans}": ${w}`);
        assert(r.example, `${id} ${c.id}: no worked example`);
        const whole = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
        assert(!(ans.length >= 3 && whole.test(r.example.toLowerCase()) && !whole.test(r.prompt.toLowerCase())), `${id} ${c.id}: example contains "${ans}"`);
        assert(!/[\u2013\u2014]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors, r.answers])), `${id} ${c.id}: dash`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with builders running at the same time: re-read it just before writing and splice in only a
// Year 7 "Competition Practice" unit at the end of Year 7's units. Nothing else in the file is touched.
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  const parsed = JSON.parse(raw);
  const y7 = parsed.years.find((y) => y.id === 'year7');
  if (y7.units.some((u) => u.lessons.includes(ID))) console.log('already registered in Year 7');
  else {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const at = raw.indexOf('"id": "year7"');
    const next = raw.indexOf('"id": "', at + 5);
    const close = raw.lastIndexOf(eol + '      ]', next);
    assert(at > 0 && next > at && close > at, 'found the end of Year 7\'s units');
    const unit = [',', '        {', '          "code": "",', '          "title": "Competition Practice",', '          "lessons": [', `            "${ID}"`, '          ]', '        }'].join(eol);
    const out = raw.slice(0, close) + unit + raw.slice(close);
    const check = JSON.parse(out);
    assert(check.years.find((y) => y.id === 'year7').units.at(-1).lessons[0] === ID, 'registered');
    assert(fs.readFileSync(lp, 'utf8') === raw, 'lessons.json changed while building: run the builder again');
    fs.writeFileSync(lp, out);
    console.log('registered in Year 7, unit "Competition Practice"');
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
