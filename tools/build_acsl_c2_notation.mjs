// Builds LessonData/acsl-c2-notation.json: ACSL Junior Contest 2, Prefix, Infix and Postfix, its two drills
// (Drills/data/acsl-c2-notation.js, the plenary, and acsl-c2-notation-ext, the Do Now Extension), and registers the
// lesson first in the Competition section's "ACSL Junior Contest 2" unit of lessons.json.
//   node tools/build_acsl_c2_notation.mjs
// Every expression, value and conversion on a slide or a card comes from NotationLab/core.js (the same code the
// NotationLab app runs), and the drill files carry a copy of it, so a card's answer is computed when it is drawn.
// The questions are written for this site in the contest's style; the official samples are linked, never copied.
// Shape: EAL-light (one idea per slide, a teacher-only Think, Pair, Share under every heading that never gives a
// slide answer away, predict then check, compare slides), four NotationLab activities, checked practice, a drill
// plenary.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE_FILE = path.join(ROOT, 'NotationLab', 'core.js');
const NC = createRequire(import.meta.url)(CORE_FILE);
const ID = 'acsl-c2-notation';
const P = 'acn';
const POW = NC.POW;
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- slide pieces
const validators = {};
function checkStep(id, label, heading, lead, parts, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [1]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off" spellcheck="false"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} mark${parts.length > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
}
const num = (n) => `^\\s*${n < 0 ? '[-\\u2212]\\s*' + (-n) : n}\\s*\\.?\\s*$`;
const seq = (list) => NC.seqRe(list);
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
const lab = (id, label, heading, lead, query) => ({ id, label, type: 'embedded-app', appId: 'notation-lab', embedQuery: query,
  embedContainerId: `${P}-${id}`, content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
function mcStep(id, label, heading, lead, items, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `${extra}<div id="${cid}"></div>`, items };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// An expression in big monospace type.
const expr = (s, size = 1.5) => `<p style="font:700 ${size}rem/1.3 var(--font-mono);letter-spacing:.04em;margin:6px 0">${esc(s)}</p>`;
const mono = (s) => `<code style="font:700 1.02em var(--font-mono)">${esc(s)}</code>`;
const box = (title, body) => `<div style="display:flex;align-items:center;gap:14px;padding:4px 14px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2)"><b>${title}</b>${body}</div>`;
function table(head, rows, font = 16) {
  const cell = (t, h) => `<t${h} style="padding:3px 8px;text-align:left;font-size:${font}px">${t}</t${h}>`;
  return `<table class="donow-table" style="font-size:${font}px;width:100%"><thead><tr>${head.map((h) => cell(h, 'h')).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => cell(c, 'd')).join('')}</tr>`).join('')}</tbody></table>`;
}
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;
const big = (t) => `<div class="wt-big" style="font-family:var(--font-mono)">${t}</div>`;

// A stack trace as table rows: what was read, what the machine did, the stack after it (bottom to top).
function traceRows(list, form) {
  return NC.stackSteps(list, form).map((s) => [mono(s.token),
    s.kind === 'push' ? 'push it' : `pop ${s.first}, pop ${s.second}: ${esc(`${s.left} ${s.token} ${s.right} = ${s.value}`)}, push it`,
    mono(s.stack.join(' '))]);
}
// The operators moved to the front or end of their own brackets.
function moved(t, target) {
  if (!t.op) return t.v;
  const l = moved(t.l, target), r = moved(t.r, target);
  return '(' + (target === 'prefix' ? `${t.op} ${l} ${r}` : `${l} ${r} ${t.op}`) + ')';
}
// Grouping prefix or postfix back into infix, one operator at a time: each line is the row after one group.
function groupLines(list, form) {
  let items = list.map((tk) => ({ s: tk, val: !NC.isOp(tk) }));
  const lines = [];
  for (;;) {
    const i = items.findIndex((it, k) => !it.val && (form === 'postfix' ? items[k - 1]?.val && items[k - 2]?.val : items[k + 1]?.val && items[k + 2]?.val));
    if (i < 0) break;
    const a = form === 'postfix' ? i - 2 : i + 1;
    const g = { s: `(${items[a].s} ${items[i].s} ${items[a + 1].s})`, val: true };
    items = items.slice(0, Math.min(i, a)).concat([g], items.slice(Math.min(i, a) + 3));
    lines.push(items.map((x) => x.s).join(' '));
  }
  return lines;
}

// ---------------------------------------------------------------- the lesson's own expressions (all checked here)
const DN = [['9 - 5 + 3', 7], ['4 + 6 * 2', 16]];
for (const [s, v] of DN) assert(NC.evaluate(NC.parseInfix(s)) === v, 'do-now ' + s);
const WT = [['8 - 3 + 1', 6], ['2 + 4 * 3', 14]];
for (const [s, v] of WT) assert(NC.evaluate(NC.parseInfix(s)) === v, 'walkthrough ' + s);
const TEACH_POST = NC.parsePostfix('6 2 - 3 *');
assert(NC.evaluate(TEACH_POST) === 12, 'teach postfix');
const PC = [['8 3 - 2 *', 10], ['5 1 2 + 4 * + 3 -', 14]];
for (const [s, v] of PC) assert(NC.evaluate(NC.parsePostfix(s)) === v && NC.stackSteps(NC.tokens(s), 'postfix').slice(-1)[0].value === v, 'postfix check ' + s);
const TEACH_PRE = NC.parsePrefix('- * 3 4 5');
assert(NC.evaluate(TEACH_PRE) === 7, 'teach prefix');
const RC = [['+ 7 * 2 3', 13], ['* - 9 4 + 1 2', 15]];
for (const [s, v] of RC) assert(NC.evaluate(NC.parsePrefix(s)) === v && NC.stackSteps(NC.tokens(s), 'prefix').slice(-1)[0].value === v, 'prefix check ' + s);
assert(NC.evaluate(NC.parsePostfix('8 2 /')) === 4 && NC.evaluate(NC.parsePrefix('/ 8 2')) === 4, 'compare order');
const TEACH_CONV = NC.parseInfix('A + B * C');
const CONV = NC.parseInfix('(A - B) * C');
const CONV_POST = NC.toPostfix(CONV), CONV_PRE = NC.toPrefix(CONV);
assert(NC.show(CONV_POST) === 'A B - C *' && NC.show(CONV_PRE) === '* - A B C', 'convert check');
const POW_VAL = '1 + 2 ' + POW + ' 3 * 2';
assert(NC.evaluate(NC.parseInfix(POW_VAL)) === 17, 'power value');
const POW_CONV = NC.parseInfix('A * B ' + POW + ' 2');
assert(NC.show(NC.toPostfix(POW_CONV)) === 'A B 2 ' + POW + ' *', 'power convert');
const TEACH_BACK = NC.tokens('A B C * +');
assert(NC.toInfix(NC.parsePostfix(TEACH_BACK)) === 'A + B * C', 'back to infix');
const LONG = `- * + 3 4 2 / ${POW} 2 3 4`;
assert(NC.evaluate(NC.parsePrefix(LONG)) === 12 && NC.stackSteps(NC.tokens(LONG), 'prefix').slice(-1)[0].value === 12, 'long prefix');
const IMPL_TEACH = NC.parseInfix('3(A + 2B)');
assert(NC.toInfix(IMPL_TEACH) === '3 * (A + 2 * B)' && NC.show(NC.toPostfix(IMPL_TEACH)) === '3 A 2 B * + *', 'implied teach');
const IMPL = NC.parseInfix('4(B - 2C)');
const IMPL_POST = NC.toPostfix(IMPL), IMPL_PRE = NC.toPrefix(IMPL);
assert(NC.show(IMPL_POST) === '4 B 2 C * - *' && NC.show(IMPL_PRE) === '* 4 - B * 2 C', 'implied check');

// Think, Pair, Share under each heading: a why question; never a slide answer.
const TPS = {
  'do-now': ['Why do we need rules for which part of a sum to work out first?', 'Without rules, two people could work out the same sum in different orders and get different answers.'],
  'title': ['Your calculator works out long sums with brackets. How might it keep track of what to do next?', 'Talk about it in pairs. By the end of the lesson you will know one way computers do it.'],
  'why-brackets': ['Why does a calculator need rules or brackets to work out a sum?', 'The same numbers and operators can give different answers. The rules and brackets say which part to work out first.'],
  'three-forms': ['Why might "pre" and "post" be good names for two of these forms?', 'Pre means before and post means after: the operator comes before or after its two values.'],
  'forms-check': ['How can you tell the three forms apart at a glance?', 'Look at where the operators are: between the values, at the front, or at the end.'],
  'postfix-stack': ['Why must the first value popped go on the right?', 'It was pushed last, so it was written last. The value written first always goes on the left.'],
  'postfix-check': ['Why is the answer the last value left on the stack?', 'Every operator turns two values into one. When the last operator is done, only the answer is left.'],
  'prefix-stack': ['Why do we read prefix from the right?', 'Each operator comes before its values. Reading from the right, its values are already on the stack when we reach it.'],
  'compare-order': ['Why does the order of two values matter for - and /, but not for + and *?', '6 - 1 and 1 - 6 are different. 6 + 1 and 1 + 6 are the same.'],
  'prefix-check': ['In prefix, why is the operator at the very front the last one you work out?', 'We read from the right, so we reach the front last. It joins the two biggest parts.'],
  'activity-1': ['Why does the machine ask you which way round the two values go?', 'For - and / the order changes the answer. The machine only pops; you use the rule for the form.'],
  'to-post': ['Why put brackets round every operation first?', 'Then each operator has its own pair of brackets, so you know exactly which two values it joins.'],
  'convert-check': ['Why does postfix not need the brackets from (D + E) / F?', 'The order of the tokens already shows that + is worked out before /.'],
  'power': ['Why might the power arrow rank above *?', 'A power is repeated multiplication, so it is worked out before the * around it, just as * comes before +.'],
  'power-check': ['Why is 5 ' + POW + ' 2 not the same as 5 * 2?', '5 ' + POW + ' 2 means two copies of 5 multiplied together: 5 * 5.'],
  'convert-app': ['Why might it help to do a conversion in small steps and say the reason for each one?', 'You can check each step on its own. If you know why each step is right, you can convert any expression, not just one you have seen before.'],
  'activity-2': ['Why might it help to build a tree in the same order you would work the expression out?', 'Each operator needs its two values to be ready. Working in order means they are already built when you join them.'],
  'read-tree': ['Why might the walk go down the left side first, not the right?', 'We write from left to right, so the left value comes before the right value, just as it does in infix.'],
  'read-app': ['Why does a tree need no brackets?', 'Its shape already shows which two parts each operator joins.'],
  'to-infix': ['Why can we always find an operator with two values right next to it?', 'The first operator to work out has plain values beside it. After that, each group counts as one value.'],
  'group-app': ['Why does grouping give the brackets back?', 'Each group is one operator with its two values, so the brackets show what is worked out first.'],
  'acsl-prefix': ['Why write the stack down rather than keep it in your head?', 'A long expression has many values waiting. Writing them down keeps the order, so the right value goes on the left.'],
  'implied': ['Why write the hidden * before you convert?', 'Every operator must move. A * you cannot see is easy to leave out.'],
  'implied-check': ['How many operators are in 5(D + 3E)? Why?', 'Three: the + you can see, and two hidden *, one in 3E and one before the bracket.'],
  'practice': ['Why does a streak score more than the same answers with mistakes between them?', 'Contests reward accuracy. A streak shows you can do it every time, not just sometimes.'],
  'links': ['Why practise with real past contest questions?', 'You see the style and the length they use, so nothing surprises you on the day.'],
  'plenary': ['Why practise with new expressions every time?', 'If you can do any expression, you really know the method, not just one answer.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now: order of operations (a warm-up)
const wtExprs = (marks = []) => big(WT.map(([s], i) => (marks.includes(i) ? hl(esc(s)) : esc(s))).join('<br>'));
const WT_ORDER = { title: 'Walk me through it: order of operations', steps: [
  { text: 'These are the same kind of questions with different numbers. Work out one part at a time.', visual: wtExprs() },
  { text: '+ and - have the same rank. Work them from <strong>left to right</strong>: 8 - 3 first.', visual: big(`${hl('8 - 3')} + 1`) + note('8 - 3 = 5, so it becomes 5 + 1 = ' + hl('6')) },
  { text: '* ranks above +. Work out the <strong>*</strong> first, even though it is on the right.', visual: big(`2 + ${hl('4 * 3')}`) + note('4 * 3 = 12, so it becomes 2 + 12 = ' + hl('14')) },
  { text: 'Now do the same with your two: * and / first, then + and -, left to right.', visual: wtExprs([0, 1]) },
] };
steps.push(checkStep('do-now', 'Do Now: Order of Operations', 'Do Now: Order of Operations', '', [
  { label: `Work out ${DN[0][0]}`, answer: num(DN[0][1]), feedback: '+ and - have the same rank. Work from left to right.' },
  { label: `Work out ${DN[1][0]}`, answer: num(DN[1][1]), feedback: 'Which ranks higher, * or +? Work that part out first.' },
]));
steps[steps.length - 1].walkthrough = WT_ORDER;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-acsl-c2-notation-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these longer sums. Stuck? Switch on <strong>I need help</strong> to see a similar one worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Contest 2: Prefix, Infix and Postfix',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">ACSL Junior Division</p><h2 class="lesson-h2">Contest 2: Prefix, Infix and Postfix</h2><p>Competition</p></div>' +
    facts(['<strong>Today:</strong> three ways to write the same sum, and how a computer works it out.', '<strong>The big question:</strong> how can a computer work out a sum with no brackets at all?']) });

// ---------------------------------------------------------------- why brackets matter
steps.push(mcStep('why-brackets', 'Compare: Where Do the Brackets Go?', 'Compare: Where Do the Brackets Go?', '', [
  { prompt: 'Which one has the value 16?', options: ['5 + 3 * 2', '(5 + 3) * 2', 'Both of them'], correct: 1,
    explain: '(5 + 3) * 2 = 8 * 2 = 16. Without brackets, * comes first: 5 + 6 = 11. Brackets change the order, so they change the answer.' },
], columns(box('Sum 1', expr('5 + 3 * 2')), box('Sum 2', expr('(5 + 3) * 2')))));
assert(NC.evaluate(NC.parseInfix('(5 + 3) * 2')) === 16 && NC.evaluate(NC.parseInfix('5 + 3 * 2')) === 11, 'why-brackets');

// ---------------------------------------------------------------- the three forms
steps.push({ id: 'three-forms', label: 'Three Ways to Write It', content: '<h2 class="lesson-h2">Three Ways to Write It</h2>' +
  '<p class="lesson-lead">Every operator joins <strong>two values</strong>. The forms differ in where the operator goes.</p>' +
  table(['Form', 'The operator goes', 'A + B', '(A + B) * C'], [
    ['<strong>Infix</strong>', 'between the two values', mono('A + B'), mono('(A + B) * C')],
    ['<strong>Prefix</strong>', 'before the two values', mono(NC.show(NC.toPrefix(NC.parseInfix('A + B')))), mono(NC.show(NC.toPrefix(NC.parseInfix('(A + B) * C'))))],
    ['<strong>Postfix</strong>', 'after the two values', mono(NC.show(NC.toPostfix(NC.parseInfix('A + B')))), mono(NC.show(NC.toPostfix(NC.parseInfix('(A + B) * C'))))],
  ], 18) +
  facts(['Prefix and postfix <strong>never need brackets</strong>.', 'Computers like postfix: they work it out with a <strong>stack</strong>.']) });

steps.push(mcStep('forms-check', 'Your Turn: Which Form?', 'Your Turn: Which Form?', '', [
  { prompt: 'Which of these is postfix?', options: ['6 3 /', '/ 6 3', '6 / 3'], correct: 0,
    explain: 'In postfix the operator comes after its two values: 6 3 /.' },
  { prompt: 'Which is C * D written in prefix?', options: ['C D *', '* C D', 'C * D'], correct: 1,
    explain: 'In prefix the operator comes first, then the values in the same order: * C D.' },
]));

// ---------------------------------------------------------------- postfix with a stack
steps.push({ id: 'postfix-stack', label: 'Postfix: Use a Stack', content: '<h2 class="lesson-h2">Postfix: Use a Stack</h2>' +
  '<p class="lesson-lead">A <strong>stack</strong> is a pile. You <strong>push</strong> a value onto the top and <strong>pop</strong> a value off the top.</p>' +
  columns(facts(['Read from <strong>left to right</strong>.', 'A number: <strong>push</strong> it.', 'An operator: <strong>pop</strong> two values, work them out, push the answer.',
    'The <strong>first</strong> value popped goes on the <strong>right</strong>.', 'At the end, one value is left: the answer.']),
  expr(NC.show(NC.toPostfix(TEACH_POST)), 1.3) + table(['Read', 'Do', 'Stack'], traceRows(NC.toPostfix(TEACH_POST), 'postfix'), 15)) });

steps.push(checkStep('postfix-check', 'Your Turn: Postfix', 'Your Turn: Postfix', 'Predict each value. Write the stack down as you go.', [
  { label: `Work out ${PC[0][0]}`, answer: num(PC[0][1]), feedback: 'Push the numbers. At each operator pop two: the first one popped goes on the right.' },
  { label: `Work out ${PC[1][0]}`, answer: num(PC[1][1]), feedback: 'Keep going left to right. Three numbers can wait on the stack before an operator.' },
]));

// ---------------------------------------------------------------- prefix with a stack
steps.push({ id: 'prefix-stack', label: 'Prefix: Read from the Right', content: '<h2 class="lesson-h2">Prefix: Read from the Right</h2>' +
  '<p class="lesson-lead">Prefix uses the same stack, read the other way.</p>' +
  columns(facts(['Read from <strong>right to left</strong>.', 'A number: push it.', 'An operator: pop two values, work them out, push the answer.',
    'The <strong>first</strong> value popped goes on the <strong>left</strong>.']),
  expr(NC.show(NC.toPrefix(TEACH_PRE)), 1.3) + table(['Read', 'Do', 'Stack'], traceRows(NC.toPrefix(TEACH_PRE), 'prefix'), 15)) });

steps.push(mcStep('compare-order', 'Compare: Postfix and Prefix', 'Compare: Postfix and Prefix', '', [
  { prompt: 'What is the value of each one?', options: ['Postfix 4, prefix 0.25', 'Both are 4', 'Postfix 0.25, prefix 4'], correct: 1,
    explain: 'In both, 8 is written first, so it goes on the left: 8 / 2 = 4. Postfix pops 2 first (right); prefix, read from the right, pops 8 first (left).' },
], columns(box('Postfix', expr('8 2 /')), box('Prefix', expr('/ 8 2')))));

steps.push(checkStep('prefix-check', 'Your Turn: Prefix', 'Your Turn: Prefix', 'Read from the right. Predict, then check.', [
  { label: `Work out ${RC[0][0]}`, answer: num(RC[0][1]), feedback: 'Start at the right end. At each operator pop two: the first one popped goes on the left.' },
  { label: `Work out ${RC[1][0]}`, answer: num(RC[1][1]), feedback: 'Work out the two parts on the right first. The front operator joins them.' },
]));

steps.push(lab('activity-1', 'Activity 1: Stack Machine', 'Activity 1: Stack Machine',
  'Choose every step. A mistake costs a heart. Two clean expressions move you up a level.', 'mode=stack&pow=0'));

// ---------------------------------------------------------------- infix to prefix and postfix
const tcFull = NC.toInfix(TEACH_CONV, { full: true });
steps.push({ id: 'to-post', label: 'Infix to Prefix and Postfix', content: '<h2 class="lesson-h2">Infix to Prefix and Postfix</h2>' +
  '<p class="lesson-lead">Three steps, from the inside out.</p>' +
  '<ol class="lesson-facts"><li>Put <strong>brackets</strong> round every operation, in the order you work it out.</li>' +
  '<li><strong>Move</strong> each operator to the front (prefix) or the end (postfix) of its own brackets.</li><li><strong>Remove</strong> the brackets.</li></ol>' +
  table(['', 'Postfix', 'Prefix'], [
    ['1. Brackets', mono(tcFull), mono(tcFull)],
    ['2. Move', mono(moved(TEACH_CONV, 'postfix')), mono(moved(TEACH_CONV, 'prefix'))],
    ['3. Remove', mono(NC.show(NC.toPostfix(TEACH_CONV))), mono(NC.show(NC.toPrefix(TEACH_CONV)))],
  ], 17) + `<p class="lesson-lead" style="margin-top:8px">Infix: ${mono(NC.toInfix(TEACH_CONV))}</p>` });

steps.push(checkStep('convert-check', 'Your Turn: Convert', 'Your Turn: Convert', `Infix: ${mono(NC.toInfix(CONV))}. Spaces are optional.`, [
  { line: true, label: 'Write it in postfix.', answer: seq(CONV_POST), feedback: 'Brackets round every part first. Then move each operator to the end of its own brackets.' },
  { line: true, label: 'Write it in prefix.', answer: seq(CONV_PRE), feedback: 'Move each operator to the front of its own brackets. The values stay in the same order.' },
]));

// ---------------------------------------------------------------- the power arrow
steps.push({ id: 'power', label: 'The Power Arrow', content: `<h2 class="lesson-h2">The Power Arrow ${POW}</h2>` +
  `<p class="lesson-lead">${mono('A ' + POW + ' B')} means A to the power B. You can type it as ${mono('^')}.</p>` +
  facts([`${mono('2 ' + POW + ' 3')} = 2 * 2 * 2 = ${NC.evaluate(NC.parseInfix('2^3'))}`,
    `Order: brackets, then <strong>${POW}</strong>, then <strong>* and /</strong>, then <strong>+ and -</strong>.`,
    'Two of the same rank: work from left to right.',
    `Two arrows are the one exception: right to left. ${mono('2 ' + POW + ' 3 ' + POW + ' 2')} means ${mono('2 ' + POW + ' (3 ' + POW + ' 2)')}.`,
    `${mono('3 + 2 ' + POW + ' 3')} = 3 + 8 = ${NC.evaluate(NC.parseInfix('3 + 2^3'))}`]) });

steps.push(checkStep('power-check', 'Your Turn: The Power Arrow', 'Your Turn: The Power Arrow', `Type ${mono('^')} for ${mono(POW)} if you like.`, [
  { label: `Work out ${POW_VAL}`, answer: num(NC.evaluate(NC.parseInfix(POW_VAL))), feedback: `The arrow first, then *, then +.` },
  { line: true, label: `Write ${NC.toInfix(POW_CONV)} in postfix.`, answer: seq(NC.toPostfix(POW_CONV)), feedback: 'Bracket the arrow part first: it ranks highest.' },
]));

steps.push(lab('convert-app', 'Activity 2: Convert It', 'Activity 2: Convert It',
  'Convert one step at a time: brackets, move, remove. A conversion with a mistake does not count. Two with no mistakes in a row move you up a level.', 'mode=convert'));

steps.push(lab('activity-2', 'Activity 3: Tree Builder', 'Activity 3: Tree Builder',
  'Build the tree from the bottom up, in the order you would work it out. A tree with a mistake does not count. Two with no mistakes in a row move you up a level.', 'mode=tree'));

// ---------------------------------------------------------------- reading a tree (James 2026-10-27: building and
// reading a tree are now two activities, one idea each)
const READ_EX = NC.parseInfix('A * (B + C)');
function treePic(t, form) {
  const order = [], pos = new Map(), lines = [], dots = [];
  (function ino(n, d) { if (n.op) { ino(n.l, d + 1); order.push([n, d]); ino(n.r, d + 1); } else order.push([n, d]); })(t, 0);
  order.forEach(([n, d], i) => pos.set(n, { x: 30 + i * 44, y: 34 + d * 56 }));
  const read = form === 'prefix' ? (function pre(n) { return n.op ? [n, ...pre(n.l), ...pre(n.r)] : [n]; })(t) : (function post(n) { return n.op ? [...post(n.l), ...post(n.r), n] : [n]; })(t);
  (function draw(n) {
    const p = pos.get(n);
    if (n.op) [n.l, n.r].forEach((c) => { const q = pos.get(c); lines.push(`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="var(--line-strong)" stroke-width="2"/>`); draw(c); });
    dots.push(`<circle cx="${p.x}" cy="${p.y}" r="17" fill="var(--surface-2)" stroke="${n.op ? 'var(--brand)' : 'var(--line-strong)'}" stroke-width="2"/>` +
      `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central" fill="var(--ink)" style="font:700 17px var(--font-mono)">${esc(n.op || n.v)}</text>` +
      `<text x="${p.x}" y="${p.y - 24}" text-anchor="middle" fill="var(--good)" style="font:700 12px var(--font-body)">${read.indexOf(n) + 1}</text>`);
  })(t);
  const w = 60 + (order.length - 1) * 44, h = 68 + NC.depth(t) * 56;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Tree read in ${form}">${lines.join('')}${dots.join('')}</svg>`;
}
const readCol = (form) => `<div style="display:grid;justify-items:center;gap:4px;padding:6px 14px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2)">` +
  `<b>${form === 'prefix' ? 'Prefix' : 'Postfix'}</b>${treePic(READ_EX, form)}${mono(NC.show(form === 'prefix' ? NC.toPrefix(READ_EX) : NC.toPostfix(READ_EX)))}</div>`;
steps.push({ id: 'read-tree', label: 'Reading a Tree', content: '<h2 class="lesson-h2">Reading a Tree</h2>' +
  '<p class="lesson-lead">Walk round the outside of the tree. Start at the top and go down the left side.</p>' +
  columns(facts([
    'Each circle is a <strong>node</strong>. The two lines below an operator lead to its two <strong>branches</strong>.',
    '<strong>Prefix:</strong> read each node the <strong>first</strong> time you pass it. You reach an operator on the way down, so it comes <strong>before</strong> its two branches.',
    '<strong>Postfix:</strong> read each node the <strong>last</strong> time you pass it. You leave an operator on the way back up, so it comes <strong>after</strong> its two branches.',
    'Postfix is the order the Stack Machine needs: both values are pushed before their operator arrives.']),
  `<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${readCol('postfix')}${readCol('prefix')}</div>`) +
  `<p class="lesson-lead" style="margin-top:8px">The numbers show the reading order. Infix: ${mono(NC.toInfix(READ_EX))}</p>` });

steps.push(lab('read-app', 'Activity 4: Tree Reader', 'Activity 4: Tree Reader',
  'You are given a finished tree. Tap its nodes in postfix or prefix order. A tree with a mistake does not count. Two with no mistakes in a row move you up a level.', 'mode=read'));

// ---------------------------------------------------------------- back to infix
const backLines = groupLines(TEACH_BACK, 'postfix');
steps.push({ id: 'to-infix', label: 'Back to Infix', content: '<h2 class="lesson-h2">Back to Infix</h2>' +
  '<p class="lesson-lead">Find an operator with two values right next to it, and join the three into one group.</p>' +
  columns(facts(['<strong>Postfix:</strong> the two values are just <strong>before</strong> the operator.', '<strong>Prefix:</strong> the two values are just <strong>after</strong> it.',
    'A group counts as one value. Repeat until one group is left.', 'Last, remove brackets that change nothing.']),
  table(['Step', 'Row'], [['Start', mono(NC.show(TEACH_BACK))]].concat(backLines.map((l, i) => [`Group ${i + 1}`, mono(l)]),
    [['Remove', mono(NC.toInfix(NC.parsePostfix(TEACH_BACK)))]]), 16)) });

steps.push(lab('group-app', 'Your Turn: Group It', 'Your Turn: Group It',
  'Click an operator that has two values right next to it. From level 4, predict the infix first.', 'mode=group'));

// ---------------------------------------------------------------- contest style
steps.push(checkStep('acsl-prefix', 'Contest Style: A Long Prefix', 'Contest Style: A Long Prefix',
  'Contest questions use long expressions of single digits. Use the stack, from the right.', [
    { label: `Work out ${LONG}`, answer: num(NC.evaluate(NC.parsePrefix(LONG))), feedback: `Push from the right. ${POW} means a power. The first value popped goes on the left.` },
  ]));

steps.push({ id: 'implied', label: 'Contest Style: Hidden Multiplication', content: '<h2 class="lesson-h2">Contest Style: Hidden Multiplication</h2>' +
  '<p class="lesson-lead">In contests, a number written next to a letter or a bracket means <strong>multiply</strong>.</p>' +
  facts([`${mono('2B')} means ${mono('2 * B')}.`, `${mono(NC.toInfix(IMPL_TEACH, { implied: true }))} means ${mono(NC.toInfix(IMPL_TEACH))}.`,
    'Write the hidden * first, then convert as usual.']) +
  table(['', ''], [
    ['Contest form', mono(NC.toInfix(IMPL_TEACH, { implied: true }))],
    ['With every *', mono(NC.toInfix(IMPL_TEACH))],
    ['Brackets', mono(NC.toInfix(IMPL_TEACH, { full: true }))],
    ['Postfix', mono(NC.show(NC.toPostfix(IMPL_TEACH)))],
  ], 17) });

steps.push(checkStep('implied-check', 'Your Turn: Hidden Multiplication', 'Your Turn: Hidden Multiplication', `Infix: ${mono(NC.toInfix(IMPL, { implied: true }))}. Spaces are optional.`, [
  { line: true, label: 'Write it in postfix.', answer: seq(IMPL_POST), feedback: 'Write in every hidden * first. There are two.' },
  { line: true, label: 'Write it in prefix.', answer: seq(IMPL_PRE), feedback: 'Bracket every part, then move each operator to the front.' },
]));

steps.push(lab('practice', 'Practice: Convert Race', 'Practice: Convert Race',
  '90 seconds of mixed questions. Get 6 right in a row in one race to pass.', 'mode=race'));

steps.push({ id: 'links', label: 'Try Real Contest Questions', content: '<h2 class="lesson-h2">Try Real Contest Questions</h2>' +
  '<p class="lesson-lead">The official ACSL pages explain this topic and show real contest questions.</p>' +
  facts([
    '<a href="http://www.categories.acsl.org/wiki/index.php?title=Prefix/Infix/Postfix_Notation" target="_blank" rel="noopener">ACSL wiki: Prefix, Infix and Postfix Notation</a>: the rules, with worked examples.',
    '<a href="http://datafiles.acsl.org/samples/contest2/2junior.pdf" target="_blank" rel="noopener">Junior Contest 2 sample</a>: two of its five questions are on this topic. Try them.',
    'In the contest: a single answer, no calculator. Write the stack down as you go.']) });

steps.push(embed('plenary', 'Plenary: Prefix, Infix and Postfix', 'drill-acsl-c2-notation', 'Plenary: Prefix, Infix and Postfix',
  'Evaluate, convert and convert back. New expressions every time. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '');
  t.content += tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
assert(V('do-now', 0, '7') && !V('do-now', 0, '1') && V('do-now', 1, '16') && !V('do-now', 1, '20'), 'do-now marks');
assert(V('postfix-check', 0, '10') && !V('postfix-check', 0, '-10') && V('postfix-check', 1, '14'), 'postfix marks');
assert(V('prefix-check', 0, '13') && V('prefix-check', 1, '15') && !V('prefix-check', 1, '-15'), 'prefix marks');
for (const s of ['A B - C *', 'AB-C*', 'a b - c *', 'A,B,-,C,*']) assert(V('convert-check', 0, s), 'convert postfix accepts ' + s);
for (const s of ['* - A B C', '*-ABC', '* - a b c']) assert(V('convert-check', 1, s), 'convert prefix accepts ' + s);
for (const s of ['A B C - *', 'A - B * C', '- * A B C', 'A B * C -']) assert(!V('convert-check', 0, s) && !V('convert-check', 1, s), 'convert rejects ' + s);
assert(V('power-check', 0, '17') && !V('power-check', 0, '19') && V('power-check', 1, 'A B 2 ' + POW + ' *') && V('power-check', 1, 'AB2^*') && !V('power-check', 1, 'A B * 2 ^'), 'power marks');
assert(V('acsl-prefix', 0, '12') && !V('acsl-prefix', 0, '-12'), 'long prefix marks');
assert(V('implied-check', 0, '4B2C*-*') && V('implied-check', 0, '4 b 2 c * - *') && !V('implied-check', 0, '4 B 2 C - *') && V('implied-check', 1, '*4-B*2C') && !V('implied-check', 1, '* 4 - B 2 C'), 'implied marks');
// Feedback nudges and never contains an accepted answer.
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 8); b++) {
    const run = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
    assert(!rx.test(run), `feedback leaks the answer: ${k}${p.suffix} "${run}"`);
  }
}
const plain = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&rarr;/g, '->').replace(/\s+/g, ' ').trim();
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };
for (const s of steps.filter((x) => x.validatorKey)) {
  const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, 'i'));
  const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
  if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
  for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
}
// Multiple choice: the TPS never contains the right option.
for (const s of steps.filter((x) => x.type === 'multiple-choice')) {
  const t = plain(s.content.match(/<details class="lesson-tps">([\s\S]*?)<\/details>/)[1]);
  for (const it of s.items) assert(!t.includes(it.options[it.correct]), `${s.id}: TPS contains the right option`);
}
// The walkthrough shows the method with other numbers and never a Do Now answer.
{
  const a = plain(JSON.stringify(WT_ORDER.steps.map((x) => x.text + ' ' + x.visual)));
  assert(!/\b7\b|\b16\b|\b20\b/.test(a), 'do-now walkthrough contains a Do Now answer');
  assert(!DN.some(([s]) => a.includes(s)), 'walkthrough repeats a Do Now question');
}
// A Think, Pair, Share on every slide except the Extension.
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it (the title slide only names today's topic).
const TEACH = [[/\b(prefix|postfix|infix)\b/i, 'three-forms'], [/\bstacks?\b/i, 'three-forms'], [/\b(push|pop)(ped|s)?\b/i, 'postfix-stack'], [/\u2191|power arrow/i, 'power'],
  [/hidden \*|hidden multiplication/i, 'implied']];
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    TEACH.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
// No dashes, no emoji, no copied ACSL wording markers.
{
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/[\u{1F300}-\u{1FAFF}]/u.test(all), 'emoji found');
}

const lesson = { id: ID, label: 'Contest 2: Prefix, Infix and Postfix', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drills
// The drill cards, written out as source into each data file after a copy of NotationLab/core.js.
function drillPrelude() {
  var NC = NotationCore, POW = NC.POW;
  var FOUR = ["+", "-", "*", "/"], ALL = FOUR.concat([POW]);
  function size(n) { return Array.isArray(n) ? n[0] + Math.floor(Math.random() * (n[1] - n[0] + 1)) : n; }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numRe(v) { return new RegExp("^\\s*" + (v < 0 ? "[-\\u2212]\\s*" + (-v) : String(v)) + "\\s*$"); }
  // A tree from NC.randomTree that passes test (tries again until it does).
  function draw(o, test) {
    for (var k = 0; k < 500; k++) { var t = NC.randomTree(Object.assign({}, o, { n: size(o.n) })); if (!test || test(t)) return t; }
    return NC.randomTree(Object.assign({}, o, { n: size(o.n) }));
  }
  // Wrong numbers: the listed slips first, then values close by. Whole numbers only, never the answer.
  function wrongNums(v, slips) {
    var out = [];
    slips.concat([v + 1, v - 1, v + 2, v - 2, v + 3, v * 2, v + 10]).forEach(function (c) {
      if (typeof c === "number" && isFinite(c) && Math.round(c) === c && c !== v && out.indexOf(String(c)) < 0 && out.length < 3) out.push(String(c));
    });
    return out;
  }
  // Wrong answers as text: distinct, none accepted by the answer's own pattern.
  function wrongText(answer, rx, cands) {
    var out = [];
    cands.forEach(function (c) { if (c && c !== answer && out.indexOf(c) < 0 && !rx.test(c) && out.length < 3) out.push(c); });
    return out;
  }
  // Infix read strictly from left to right, brackets kept but no ranks: the slip a wrong option shows.
  function flatParse(list) {
    var p = 0;
    function prim() { var t = list[p]; if (t === "(") { p++; var e = ex(); p++; return e; } p++; return NC.leaf(t); }
    function ex() { var l = prim(); while (p < list.length && NC.isOp(list[p])) { var op = list[p++]; l = NC.node(op, l, prim()); } return l; }
    return ex();
  }
  function swapAt(t, k) {
    var i = -1;
    return (function go(n) {
      if (!n.op) return NC.leaf(n.v);
      i++;
      if (i === k) return NC.node(n.op, go(n.r), go(n.l));
      var l = go(n.l); return NC.node(n.op, l, go(n.r));
    })(t);
  }
  function mirror(n) { return n.op ? NC.node(n.op, mirror(n.r), mirror(n.l)) : NC.leaf(n.v); }
  function moved(t, target) {
    if (!t.op) return t.v;
    var l = moved(t.l, target), r = moved(t.r, target);
    return "(" + (target === "prefix" ? t.op + " " + l + " " + r : l + " " + r + " " + t.op) + ")";
  }
  function groupLines(list, form) {
    var items = list.map(function (tk) { return { s: tk, val: !NC.isOp(tk) }; }), lines = [];
    for (var guard = 0; guard < 20; guard++) {
      var i = -1;
      for (var k = 0; k < items.length && i < 0; k++) {
        if (items[k].val) continue;
        var ok = form === "postfix" ? (k >= 2 && items[k - 1].val && items[k - 2].val) : (k + 2 < items.length && items[k + 1].val && items[k + 2].val);
        if (ok) i = k;
      }
      if (i < 0) break;
      var a = form === "postfix" ? i - 2 : i + 1, from = Math.min(i, a);
      var g = { s: "(" + items[a].s + " " + items[i].s + " " + items[a + 1].s + ")", val: true };
      items = items.slice(0, from).concat([g], items.slice(from + 3));
      lines.push("Group: " + items.map(function (x) { return x.s; }).join(" "));
    }
    return lines;
  }

  // ------------------------------------------------ evaluate prefix or postfix
  var WORK = {
    postfix: ["Read from left to right. Push each number. At an operator, pop two values, work them out and push the answer.",
      "The first value popped goes on the right: A B - means A - B."],
    prefix: ["Read from right to left. Push each number. At an operator, pop two values, work them out and push the answer.",
      "The first value popped goes on the left: - A B means A - B."]
  };
  function stepText(s) {
    return s.kind === "push" ? "Push " + s.value + "." : "Pop " + s.first + ", pop " + s.second + ": " + s.left + " " + s.token + " " + s.right + " = " + s.value + ". Push it.";
  }
  function evalGen(form, o) {
    return function () {
      var t = draw(o), list = form === "prefix" ? NC.toPrefix(t) : NC.toPostfix(t), v = NC.evaluate(t);
      var steps = NC.stackSteps(list, form), swapped = NC.stackSteps(list, form, true).slice(-1)[0].value;
      var before = steps.length > 1 ? steps[steps.length - 2].stack : [];
      return { key: list.join(""), prompt: "Work out the value of this " + form + " expression.\n" + NC.show(list), answer: String(v), re: numRe(v),
        wrong: wrongNums(v, [swapped, before[before.length - 1]]), steps: steps.map(stepText), working: WORK[form],
        note: "The stack ends with one value: " + v + "." };
    };
  }
  // ------------------------------------------------ infix to prefix or postfix
  function convGen(target, o) {
    return function () {
      var t = draw({ n: o.n, ops: o.ops, letters: true, mustUse: o.mustUse, digitChance: o.implied ? 0.45 : 0 }, function (x) {
        var plain = NC.toInfix(x), shown = NC.toInfix(x, { implied: !!o.implied });
        if (o.brackets && plain.indexOf("(") < 0) return false;
        if (o.noBrackets && plain.indexOf("(") >= 0) return false;
        if (o.implied && (shown === plain || !/[A-H]/.test(shown))) return false;
        return true;
      });
      var list = target === "prefix" ? NC.toPrefix(t) : NC.toPostfix(t), ans = NC.show(list), rx = new RegExp(NC.seqRe(list), "i");
      var of = function (x) { return NC.show(target === "prefix" ? NC.toPrefix(x) : NC.toPostfix(x)); };
      var flat = flatParse(NC.tokens(NC.toInfix(t)));
      var vals = list.filter(function (x) { return !NC.isOp(x); }), ops = NC.tokens(NC.toInfix(t)).filter(function (x) { return NC.isOp(x); });
      var cands = [of(flat), NC.show(target === "prefix" ? NC.toPostfix(t) : NC.toPrefix(t)), of(mirror(t)),
        NC.show(target === "prefix" ? ops.concat(vals) : vals.concat(ops)), of(swapAt(t, 0)), of(swapAt(t, 1)), NC.show(list.slice().reverse())];
      var shown = NC.toInfix(t, { implied: !!o.implied }), steps = [];
      if (o.implied) steps.push("Write in the hidden *: " + NC.toInfix(t));
      steps.push("Brackets round every operation: " + NC.toInfix(t, { full: true }));
      steps.push("Move each operator to the " + (target === "prefix" ? "front" : "end") + " of its brackets: " + moved(t, target));
      steps.push("Remove the brackets.");
      return { key: ans, prompt: "Write this infix expression in " + target + ".\n" + shown, answer: ans, re: rx, wrong: wrongText(ans, rx, cands),
        steps: steps, format: "Type the " + target + " expression. Spaces are optional.",
        working: ["Put brackets round each operation, in the order you would work it out." + (o.implied ? " Write in every hidden * first." : ""),
          "Move each operator to the " + (target === "prefix" ? "front" : "end") + " of its own brackets, then remove the brackets."],
        note: "Brackets: " + NC.toInfix(t, { full: true }) + ". " + target.charAt(0).toUpperCase() + target.slice(1) + ": " + ans + "." };
    };
  }
  // ------------------------------------------------ prefix or postfix back to infix
  function backGen(from, o) {
    return function () {
      var t = draw({ n: o.n, ops: o.ops, letters: true, mustUse: o.mustUse }, function (x) { return NC.toInfix(x).indexOf("(") >= 0 || !o.brackets; });
      var list = from === "prefix" ? NC.toPrefix(t) : NC.toPostfix(t), ans = NC.toInfix(t), rx = new RegExp(NC.infixRe(t), "i");
      var cands = [NC.toInfix(mirror(t))];
      for (var k = 0; k < NC.opCount(t); k++) cands.push(NC.toInfix(swapAt(t, k)));
      cands.push(NC.tokens(NC.toInfix(t)).filter(function (x) { return x !== "(" && x !== ")"; }).join(" "));
      var steps = groupLines(list, from);
      steps.push("Remove brackets that change nothing.");
      return { key: list.join(""), prompt: "Write this " + from + " expression in infix.\n" + NC.show(list), answer: ans, re: rx,
        wrong: wrongText(ans, rx, cands), steps: steps, format: "Type the infix expression, with brackets where they are needed.",
        working: ["Find an operator with two values just " + (from === "postfix" ? "before" : "after") + " it. Join the three into one bracketed group.",
          "A group counts as one value. Repeat until one group is left, then remove brackets that change nothing."],
        note: "Fully bracketed: " + NC.toInfix(t, { full: true }) + ". Infix: " + ans + "." };
    };
  }
  // ------------------------------------------------ order of operations (the Do Now Extension)
  function leftToRight(list) {
    var vals = [], ops = [];
    list.forEach(function (x) { if (NC.isOp(x)) ops.push(x); else if (x !== "(" && x !== ")") vals.push(Number(x)); });
    var v = vals[0];
    for (var i = 0; i < ops.length; i++) v = NC.apply(ops[i], v, vals[i + 1]);
    return v;
  }
  function rightToLeft(list) {
    var vals = [], ops = [];
    list.forEach(function (x) { if (NC.isOp(x)) ops.push(x); else if (x !== "(" && x !== ")") vals.push(Number(x)); });
    var v = vals[vals.length - 1];
    for (var i = ops.length - 1; i >= 0; i--) v = NC.apply(ops[i], vals[i], v);
    return v;
  }
  // The order the parts are worked out, one line per operator: the part, its value, and the sum after it.
  function orderLines(t) {
    var lines = [], cur = NC.clone(t);
    for (var guard = 0; guard < 10 && cur.op; guard++) {
      var path = (function find(n) { if (n.l.op) return find(n.l); if (n.r.op) return find(n.r); return n; })(cur);
      var val = NC.apply(path.op, Number(path.l.v), Number(path.r.v));
      var part = path.l.v + " " + path.op + " " + path.r.v;
      path.v = String(val); delete path.op; delete path.l; delete path.r;
      lines.push(part + " = " + val + (cur.op ? ", so it becomes " + NC.toInfix(cur) : "."));
    }
    return lines;
  }
  var ORDER_WORK = ["Brackets first. Then * and /. Then + and -.", "Two of the same rank: work from left to right."];
  function orderGen(o, test) {
    return function () {
      var t = draw({ n: o.n, ops: o.ops, max: 60, noNeg: true }, function (x) {
        var list = NC.tokens(NC.toInfix(x)), v = NC.evaluate(x);
        return test(x, list) && Math.abs(v) <= 60;
      });
      var list = NC.tokens(NC.toInfix(t)), v = NC.evaluate(t);
      return { key: NC.toInfix(t), prompt: "Work out " + NC.toInfix(t), answer: String(v), re: numRe(v),
        wrong: wrongNums(v, [leftToRight(list), rightToLeft(list)]), steps: orderLines(t), working: ORDER_WORK,
        note: NC.toInfix(t) + " = " + v + "." };
    };
  }
  var hasBr = function (x, list) { return list.indexOf("(") >= 0; };
  var ranks = function (x) { var r = {}; NC.toPrefix(x).forEach(function (k) { if (NC.isOp(k)) r[NC.PREC[k]] = 1; }); return Object.keys(r).length; };

  // `example` is another draw of the same kind with a different answer that appears nowhere in it, worked through.
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      for (var i = 0; i < 120 && !ex; i++) {
        var e = gen(), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
        if (e.key !== c.key && String(e.answer) !== String(c.answer) && (String(c.answer).length < 3 || !mentions.test(text))) ex = e;
      }
      var example = !ex ? null : "A similar question:\n" + ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong,
        example: example, working: c.working, note: c.note, format: c.format };
    } };
  }
}

function plenaryCards() {
  return [
    card("ep-1", "ev-post", evalGen("postfix", { n: 2, ops: ["+", "-", "*"], max: 60, noNeg: true })),
    card("ep-2", "ev-post", evalGen("postfix", { n: 3, ops: FOUR, max: 80, noNeg: true })),
    card("ep-3", "ev-post", evalGen("postfix", { n: 4, ops: FOUR, max: 99 })),
    card("ep-4", "ev-post", evalGen("postfix", { n: [4, 5], ops: ALL, mustUse: [POW], max: 150 })),
    card("er-1", "ev-pre", evalGen("prefix", { n: 2, ops: ["+", "-", "*"], max: 60, noNeg: true })),
    card("er-2", "ev-pre", evalGen("prefix", { n: 3, ops: FOUR, max: 80, noNeg: true })),
    card("er-3", "ev-pre", evalGen("prefix", { n: [4, 5], ops: ALL, mustUse: [POW], max: 150 })),
    card("er-4", "ev-pre", evalGen("prefix", { n: [6, 7], ops: ALL, max: 150 })),
    card("tp-1", "to-pre", convGen("prefix", { n: 2, ops: FOUR, noBrackets: true })),
    card("tp-2", "to-pre", convGen("prefix", { n: [2, 3], ops: FOUR, brackets: true })),
    card("tp-3", "to-pre", convGen("prefix", { n: [3, 4], ops: ALL, mustUse: [POW] })),
    card("tp-4", "to-pre", convGen("prefix", { n: [3, 4], ops: FOUR, implied: true })),
    card("to-1", "to-post", convGen("postfix", { n: 2, ops: FOUR, noBrackets: true })),
    card("to-2", "to-post", convGen("postfix", { n: [2, 3], ops: FOUR, brackets: true })),
    card("to-3", "to-post", convGen("postfix", { n: [3, 4], ops: ALL, mustUse: [POW] })),
    card("to-4", "to-post", convGen("postfix", { n: [3, 4], ops: FOUR, implied: true })),
    card("ti-1", "to-in", backGen("postfix", { n: 2, ops: FOUR })),
    card("ti-2", "to-in", backGen("prefix", { n: [2, 3], ops: FOUR, brackets: true })),
    card("ti-3", "to-in", backGen("postfix", { n: [3, 4], ops: FOUR, brackets: true })),
    card("ti-4", "to-in", backGen("prefix", { n: [3, 4], ops: ALL, mustUse: [POW] }))
  ];
}
function extCards() {
  var mixed = function (x, list) { return !hasBr(x, list) && ranks(x) === 2 && leftToRight(list) !== NC.evaluate(x); };
  var chain = function (x, list) { return !hasBr(x, list) && ranks(x) === 1 && rightToLeft(list) !== NC.evaluate(x); };
  var brack = function (x, list) { return hasBr(x, list) && leftToRight(list.filter(function (k) { return k !== "(" && k !== ")"; })) !== NC.evaluate(x); };
  var longer = function (x, list) { return ranks(x) === 2 && leftToRight(list) !== NC.evaluate(x); };
  return [
    card("ox-1", "ox-rank", orderGen({ n: 2, ops: ["+", "*"] }, mixed)),
    card("ox-2", "ox-rank", orderGen({ n: 2, ops: ["-", "*"] }, mixed)),
    card("ox-3", "ox-rank", orderGen({ n: 2, ops: FOUR }, mixed)),
    card("ox-4", "ox-left", orderGen({ n: 2, ops: ["+", "-"] }, chain)),
    card("ox-5", "ox-left", orderGen({ n: 2, ops: ["*", "/"] }, chain)),
    card("ox-6", "ox-left", orderGen({ n: 3, ops: ["+", "-"] }, chain)),
    card("ox-7", "ox-brackets", orderGen({ n: 2, ops: FOUR }, brack)),
    card("ox-8", "ox-brackets", orderGen({ n: 3, ops: FOUR }, brack)),
    card("ox-9", "ox-long", orderGen({ n: 3, ops: FOUR }, longer)),
    card("ox-10", "ox-long", orderGen({ n: 4, ops: FOUR }, longer))
  ];
}

const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };
const coreSrc = fs.readFileSync(CORE_FILE, 'utf8').replace(/\r\n/g, '\n').replace(/^if \(typeof module[^\n]*\n?/m, '');
const DRILLS = [
  ['acsl-c2-notation', 'Plenary: evaluate prefix and postfix with a stack, convert infix to prefix and postfix, and convert back to infix.',
    'ACSL Contest 2: Prefix, Infix and Postfix', 'ACSL Junior Division',
    [['ev-post', 'Evaluate Postfix'], ['ev-pre', 'Evaluate Prefix'], ['to-pre', 'Infix to Prefix'], ['to-post', 'Infix to Postfix'], ['to-in', 'Back to Infix']], plenaryCards],
  ['acsl-c2-notation-ext', 'Do Now Extension: order of operations with + - * / and brackets (the warm-up before prefix and postfix).',
    'ACSL Contest 2 Extension: Order of Operations', 'Do Now Extension',
    [['ox-rank', '* and / Before + and -'], ['ox-left', 'Left to Right'], ['ox-brackets', 'Brackets First'], ['ox-long', 'Longer Sums']], extCards],
];
for (const [id, about, title, subtitle, cats, fn] of DRILLS) {
  const src = `// ACSL Junior Contest 2: Prefix, Infix and Postfix. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_acsl_c2_notation.mjs: edit that, then run it. The cards carry a copy of NotationLab/core.js,\n` +
    `// so every expression and answer is computed when the card is drawn.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {\n${coreSrc}\n${body(drillPrelude)}\n${body(fn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  if (id.endsWith('-ext')) assert(!/\b(prefix|postfix|stack)\b/i.test(body(extCards)), 'the Extension uses a lesson term');
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does: its answer and its spacing variants pass, no distractor passes,
// no working step or example gives the answer away, and every card has a worked example.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const id of DRILLS.map((d) => d[0])) {
    const ctx = { console, Math, DrillData: { register: (k, d) => { ctx.out = d; ctx.key = k; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(ctx.key === id, `${id} registers as ${ctx.key}`);
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
    for (const card of d.cards) {
      for (let n = 0; n < 200; n++) {
        const r = { ...card, ...card.randomize() };
        const pass = (s) => r.keywords.some((k) => k.test(String(s).replace(/\s*\.+\s*$/, '')));
        const ans = String(r.answers[0]);
        for (const v of [ans, ans.toLowerCase(), ans.toUpperCase(), ans + '.', '  ' + ans + '  ', ans.replace(/\s+/g, ''), ans.replace(/\s([=+\-*/<>]=?)\s/g, '$1')]) assert(pass(v), `${id} ${card.id}: "${v}" fails (answer ${ans})`);
        if (/\u2191/.test(ans)) assert(pass(ans.replace(/\u2191/g, '^')), `${id} ${card.id}: ^ for the arrow fails`);
        assert(r.distractors.length === 3 && new Set(r.distractors).size === 3 && !r.distractors.includes(ans), `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        for (const w of r.distractors) assert(!pass(w), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        assert(r.working && r.working.length >= 2, `${id} ${card.id}: needs two nudges`);
        if (!inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
        assert(r.example, `${id} ${card.id}: no worked example`);
        const whole = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
        assert(!(ans.length >= 3 && whole.test(r.example.toLowerCase()) && !whole.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        const shown = JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors, r.answers]);
        assert(!/[\u2013\u2014]/.test(shown), `${id} ${card.id}: dash`);
        if (id.endsWith('-ext')) assert(!/\b(prefix|postfix|stack)\b|\u2191/i.test(shown), `${id} ${card.id}: uses a lesson term`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: read it just before writing, change only
// the Competition section's Contest 2 unit, and write it back in the same format.
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const all = JSON.parse(raw);
const comp = all.years.find((y) => y.id === 'competition');
const unit = comp && comp.units.find((u) => /Contest 2/.test(u.title));
if (!unit) console.log('No Competition "Contest 2" unit in lessons.json yet: the lesson is not registered.');
else {
  if (!unit.lessons.includes(ID)) {
    unit.lessons.unshift(ID);
    const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : '');
    assert(fs.readFileSync(lp, 'utf8') === raw, 'lessons.json changed while building: run the builder again');
    fs.writeFileSync(lp, out);
  }
  console.log(`registered in "${unit.title}": [${unit.lessons.join(', ')}]`);
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
