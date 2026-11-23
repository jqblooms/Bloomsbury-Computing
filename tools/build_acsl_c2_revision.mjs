// Builds LessonData/acsl-c2-revision.json: ACSL Junior Contest 2 revision, Prefix, Infix and Postfix and Bit-String
// Flicking, one 55-minute lesson driven by Data Bridge. Registers it in the Competition section's ACSL Junior Contest 2
// unit, after acsl-c2-bits.
//   node tools/build_acsl_c2_revision.mjs
// Shape: two Do Now slides (one per topic, each with a Walk me through it on a similar question), the Contest Day Do Now
// Extension, a key-facts slide per topic, Data Bridge: Use Your Notes, then Data Bridge on the combined Exam Game set
// acsl-contest2 (shell ExamGameSetAcslContest2.gs: acsl-notation and acsl-bitstring) for most of the lesson, then the
// two topic drills as the plenary. A teacher-only Think, Pair, Share under every heading never gives a slide answer.
// Every value comes from NotationLab/core.js and BitFlicker/bits-core.js.
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, assert, re, facts, columns, why, makeSteps, writeLesson, registerLesson } from './acsl_c2_kit.mjs';

const require = createRequire(import.meta.url);
const NC = require(path.join(ROOT, 'NotationLab', 'core.js'));
const B = require(path.join(ROOT, 'BitFlicker', 'bits-core.js'));
const ID = 'acsl-c2-revision';
const P = 'acslrev';
const POW = NC.POW;
const { validators, checkStep, embed, T } = makeSteps(P);
const steps = [];
const mono = (t) => `<code style="font-family:var(--font-mono,monospace);font-weight:700">${t}</code>`;
const mins = (n) => `<strong>${n} minutes.</strong> `;
const num = (n) => `^\\s*${n}\\s*\\.?\\s*$`;
const bitsRe = (s) => '^\\s*' + s.split('').join('\\s*') + '\\s*\\.?\\s*$';
const pf = (s) => NC.evaluate(NC.parsePostfix(s));
const pr = (s) => NC.evaluate(NC.parsePrefix(s));
const ev = (s) => B.evaluate(s);
const note = (t) => `<div class="wt-note">${t}</div>`;
const big = (t) => `<div class="wt-big">${t}</div>`;
const stack = (items, hl) => '<div style="display:flex;gap:6px;justify-content:center;margin:6px 0">' +
  items.map((v, i) => `<span${hl && i === items.length - 1 ? ' class="wt-hl"' : ''} style="display:inline-block;min-width:38px;padding:6px 10px;border-radius:8px;background:var(--surface-3);text-align:center;font:700 20px var(--font-mono,monospace)">${v}</span>`).join('') +
  '</div>' + note('stack: bottom on the left, top on the right');
const table = (head, rows) => '<table style="border-collapse:collapse;width:100%;font-size:18px;line-height:1.4"><tr>' +
  head.map((h) => `<th style="padding:4px 8px;border-bottom:2px solid var(--line-strong);text-align:left">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:4px 8px;border-bottom:1px solid var(--line);vertical-align:top">${c}</td>`).join('') + '</tr>').join('') + '</table>';

// ---------------------------------------------------------------- Do Now 1: notation (contest style, single digits)
const DN1 = { post: '8 2 3 * -', pre: '+ * 3 4 2' };
DN1.a = pf(DN1.post); DN1.b = pr(DN1.pre);
assert(DN1.a === 2 && DN1.b === 14, 'Do Now 1 values ' + DN1.a + ' ' + DN1.b);
// Walk me through it on similar expressions: postfix 9 4 1 + - and prefix - * 2 5 3.
const W1 = { post: '9 4 1 + -', pre: '- * 2 5 3' };
assert(pf(W1.post) === 4 && pr(W1.pre) === 7, 'walk 1 values');
const WT_NOTATION = { title: 'Walk me through it: the stack', steps: [
  { text: `<strong>A similar question.</strong> Work out the postfix ${mono(W1.post)}. Read from the <strong>left</strong>.`, visual: big(W1.post) },
  { text: 'A number: <strong>push</strong> it. Push 9, then 4, then 1.', visual: stack(['9', '4', '1'], true) },
  { text: '<strong>+</strong> is an operator: pop two values. The first one popped (1) goes on the <strong>right</strong>: 4 + 1 = 5. Push 5.', visual: stack(['9', '5'], true) },
  { text: '<strong>-</strong>: pop two. The first one popped (5) goes on the right: 9 - 5 = 4. One value is left: the answer is 4.', visual: stack(['4'], true) },
  { text: `<strong>Prefix.</strong> Work out ${mono(W1.pre)}. Read from the <strong>right</strong>. Push 3, then 5, then 2.`, visual: stack(['3', '5', '2'], true) },
  { text: '<strong>*</strong>: pop two. In prefix the first one popped (2) goes on the <strong>left</strong>: 2 * 5 = 10. Push 10.', visual: stack(['3', '10'], true) },
  { text: '<strong>-</strong>: pop two. The first one popped (10) goes on the left: 10 - 3 = 7. Now do the same with the expressions in your question.', visual: stack(['7'], true) },
] };
steps.push(checkStep('do-now', 'Do Now: Prefix and Postfix (1 of 2)', 'Do Now: Prefix and Postfix (1 of 2)',
  mins(4) + 'Use a stack. Write it down as you go.', [
    { label: `Work out the postfix ${mono(DN1.post)}`, answer: num(DN1.a), feedback: 'Read from the left. At an operator, pop two values: the first one popped goes on the right.' },
    { label: `Work out the prefix ${mono(DN1.pre)}`, answer: num(DN1.b), feedback: 'Read from the right. At an operator, pop two values: the first one popped goes on the left.' },
  ], '', ['Why does postfix never need brackets?', 'Each operator comes straight after the two values it works on, so the order of the work is already fixed by the order of the symbols.']));
steps[steps.length - 1].walkthrough = WT_NOTATION;

// ---------------------------------------------------------------- Do Now 2: bit strings
const DN2 = { a: 'RSHIFT-2 11011', b: '10010 OR 01101 AND 00111' };
DN2.ra = ev(DN2.a); DN2.rb = ev(DN2.b);
const W2 = { a: 'LCIRC-1 10110', b: '11001 XOR 00101 AND 01011' };
const W2t = B.trace(W2.b);
const WT_BITS = { title: 'Walk me through it: shifts and the order', steps: [
  { text: `<strong>A similar question.</strong> Work out ${mono(W2.a)}. Every bit moves 1 place left.`, visual: big(W2.a) },
  { text: 'The left bit (1) falls off. LCIRC is a <strong>circulate</strong>, so it comes back on the right. A shift would put a 0 there instead.', visual: big('0110 &larr; 1') },
  { text: `So ${mono(W2.a)} = ${mono(ev(W2.a))}.`, visual: big(ev(W2.a)) },
  { text: `<strong>The order.</strong> Work out ${mono(W2.b)}. The order is: brackets, NOT, shifts and circulates, AND, XOR, OR. So AND goes first, wherever it is in the line.`, visual: note('AND before XOR before OR') },
  { text: `AND first: ${mono(W2t[0].text)}. AND gives 1 only where both bits are 1.`, visual: big(W2t[0].result) },
  { text: `Then XOR: ${mono(W2t[1].text)}. XOR gives 1 where the bits are different. Now do the same with the expressions in your question.`, visual: big(W2t[1].result) },
] };
assert(W2t.length === 2 && W2t[0].op === 'AND', 'walk 2 order');
steps.push(checkStep('do-now-2', 'Do Now: Bit Strings (2 of 2)', 'Do Now: Bit Strings (2 of 2)',
  mins(4) + 'Every string has 5 bits. Type each answer as 5 bits.', [
    { label: `Work out ${mono(DN2.a)}`, answer: bitsRe(DN2.ra), feedback: 'Every bit moves 2 places right. The bits that fall off are lost. Zeros come in on the left.' },
    { label: `Work out ${mono(DN2.b)}`, answer: bitsRe(DN2.rb), feedback: 'AND comes before OR. Work the AND first, then the OR.' },
  ], '', ['Why must every answer here have exactly 5 bits?', 'Shifts and circulates keep the length of their string, and AND, OR and XOR give a string as long as the longer one.']));
steps[steps.length - 1].walkthrough = WT_BITS;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-acsl-c2-contest-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these contest questions. Stuck? Switch on <strong>I need help</strong>.',
  ['Why do contest questions mix the topics?', 'In the contest you do not know which topic comes next, so you must spot the type of question first.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Contest 2 Revision: Notation and Bit Strings',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">ACSL Junior Contest 2</p><h2 class="lesson-h2">Contest 2 Revision: Notation and Bit Strings</h2><p>Competition</p></div>' +
    why('Four of the five contest questions are on these two topics. Why is a quick, sure method worth more than a clever one?', 'Each question has one answer and no part marks, so one slip loses the whole point. A method you can repeat step by step makes slips rare.') +
    facts([mins(1) + '<strong>Today:</strong> the key facts for both topics, then contest questions in a game.', '<strong>In the contest:</strong> two questions on prefix, infix and postfix and two on bit-string flicking.']) });

// ---------------------------------------------------------------- key facts: notation
const KF_POST = '6 2 + 3 *', KF_PRE = '* + 6 2 3';
assert(pf(KF_POST) === 24 && pr(KF_PRE) === 24, 'key facts example');
steps.push({ id: 'facts-notation', label: 'Key Facts: Prefix, Infix and Postfix',
  content: '<h2 class="lesson-h2">Key Facts: Prefix, Infix and Postfix</h2>' +
    why('Prefix and postfix use the same stack. What changes between them, and why?', 'The reading direction and the side the first popped value goes on. Prefix puts the operator before its values, so it is read from the other end.') +
    `<p class="lesson-lead">${mins(3)}Add anything you had forgotten to your notes.</p>` +
    columns(table(['Form', 'The operator goes', 'Example'], [
      ['Infix', 'between the two values', mono('(6 + 2) * 3')],
      ['Prefix', 'before the two values', mono(KF_PRE)],
      ['Postfix', 'after the two values', mono(KF_POST)],
    ]) + facts([`<strong>Order in infix:</strong> brackets, then ${mono(POW)} (power), then * and /, then + and -.`, 'Two of the same rank: left to right. Two power arrows: right to left.', 'A number next to a letter or a bracket means multiply: 2B is 2 * B.']),
    facts(['<strong>Postfix:</strong> read from the <strong>left</strong>. A number: push it. An operator: pop two, work them out, push the answer. The first value popped goes on the <strong>right</strong>.',
      '<strong>Prefix:</strong> read from the <strong>right</strong>, the same stack. The first value popped goes on the <strong>left</strong>.',
      '<strong>Infix to prefix or postfix:</strong> put brackets round every operation, move each operator to the front (prefix) or the end (postfix) of its brackets, then remove the brackets.'])) });

// ---------------------------------------------------------------- key facts: bit strings
const KF = { s: '10110', m: '01100' };
steps.push({ id: 'facts-bits', label: 'Key Facts: Bit-String Flicking',
  content: '<h2 class="lesson-h2">Key Facts: Bit-String Flicking</h2>' +
    why('Why can a * in a solve-for-x answer stand for more than one value of x?', 'A * bit can be 0 or 1 and the expression is still true, so each * doubles the number of values the pattern stands for.') +
    `<p class="lesson-lead">${mins(3)}Add anything you had forgotten to your notes.</p>` +
    columns(table(['Operator', 'What it does'], [
      ['NOT', 'flips every bit'],
      ['AND', '1 only where both bits are 1'],
      ['OR', '1 where at least one bit is 1'],
      ['XOR', '1 where the two bits are different'],
      ['LSHIFT-n, RSHIFT-n', 'move every bit n places; bits fall off and zeros come in'],
      ['LCIRC-n, RCIRC-n', 'move every bit n places; bits that fall off come back at the other end'],
    ]),
    facts(['<strong>The order:</strong> brackets, NOT, shifts and circulates, AND, XOR, OR. Two of the same: left to right. A chain like NOT LSHIFT-1: the one next to the bits goes first.',
      '<strong>Different lengths:</strong> pad the shorter string with zeros on the left.',
      '<strong>Big counts:</strong> on 5 bits a circulate of 5 changes nothing, so use only the remainder.',
      '<strong>Solve for x:</strong> go column by column. Write <strong>*</strong> for a bit that can be 0 or 1. Undo the last operator first.'])) });

// ---------------------------------------------------------------- Data Bridge
steps.push({ id: 'how-to-play', label: 'Data Bridge: Use Your Notes',
  content: '<h2 class="lesson-h2">Data Bridge: Use Your Notes</h2>' +
    why('Why answer from your notes, and not from memory alone?', 'Checking your notes while you answer fixes a gap before it costs you a point in the contest.') +
    `<p class="lesson-lead">${mins(1)}</p>` +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li><strong>Open your notes</strong> with the pen icon at the top. Keep paper for the stack and the bit columns.</li>' +
    '<li><strong>Answer the contest questions</strong> on notation and bit strings to earn coins, then build a bridge to get the truck across.</li>' +
    '<li><strong>Type bit strings</strong> with or without spaces. For solve for x, use * or list every value.</li>' +
    '<li><strong>If the bridge breaks</strong>, answer new questions to earn coins, then try the same level again.</li></ol>' });
steps.push({ id: 'game', label: 'Play: Data Bridge', type: 'embedded-app', appId: 'bridge-builder', embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Data Bridge</h2>' +
    why('Why write the stack or the columns on paper even in a game?', 'Each step on paper can be checked. A step done only in your head is easy to slip on and hard to find again.') +
    `<p class="lesson-lead">${mins(31)}Earn coins with contest questions on both topics, then build. Stop when your teacher starts the plenary.</p><div id="${P}-game"></div>`,
  embedQuery: 'set=acsl-contest2&goal=3' });

// ---------------------------------------------------------------- plenary: the two topic drills
steps.push(embed('plenary', 'Plenary: Prefix, Infix and Postfix (1 of 2)', 'drill-acsl-c2-notation', 'Plenary: Prefix, Infix and Postfix (1 of 2)',
  mins(4) + 'New expressions every time. Your progress is saved.',
  ['Which step of the stack method do you check most carefully, and why?', 'The order of the two popped values, because a minus or a divide gives a different answer when the two values swap.']));
steps.push(embed('plenary-2', 'Plenary: Bit-String Flicking (2 of 2)', 'drill-acsl-c2-bits', 'Plenary: Bit-String Flicking (2 of 2)',
  mins(4) + 'Type bits with or without spaces. Your progress is saved.',
  ['Which bit-string mistake will you watch for in the contest, and why?', 'Each person names their own, for example working left to right instead of by the order, because one early slip spoils every later step.']));

// ---------------------------------------------------------------- checks
{
  assert(T('do-now', 0, '2') && T('do-now', 1, '14') && !T('do-now', 0, '-2') && !T('do-now', 1, '20'), 'Do Now 1 patterns');
  assert(T('do-now-2', 0, DN2.ra) && T('do-now-2', 0, DN2.ra.split('').join(' ')) && !T('do-now-2', 0, ev('RCIRC-2 11011')), 'Do Now 2a pattern');
  assert(T('do-now-2', 1, DN2.rb) && !T('do-now-2', 1, ev('(10010 OR 01101) AND 00111')), 'Do Now 2b pattern');
  assert(ev('(10010 OR 01101) AND 00111') !== DN2.rb, 'Do Now 2b punishes left to right');
  // A walkthrough never shows its Do Now's answers.
  const plain = (o) => JSON.stringify(o).replace(/<[^>]+>/g, ' ');
  [DN2.ra, DN2.rb].forEach((a) => assert(!plain(WT_BITS).includes(a), 'bits walkthrough shows ' + a));
  assert(!/(^|[^\d])14([^\d]|$)/.test(plain(WT_NOTATION)), 'notation walkthrough shows 14');
  // Minutes: every timed slide states its minutes; the lesson fits 55.
  const total = steps.reduce((t, s) => { const m = /<strong>(\d+) minutes?\.<\/strong>/.exec(s.content); return t + (m && s.id !== 'do-now-ext' ? Number(m[1]) : 0); }, 0);
  assert(total === 55, 'minutes add to ' + total);
  assert(!/data bridge|mario/i.test(steps.find((s) => s.id === 'title').label), 'title names a game');
  steps.forEach((s) => assert(/class="lesson-tps"/.test(s.content), s.id + ' has no Think, Pair, Share'));
}

writeLesson(ID, 'Contest 2 Revision: Notation and Bit Strings', steps, validators);
registerLesson(ID);
console.log(`${ID}: ${steps.length} steps; Do Now ${DN1.a}, ${DN1.b}, ${DN2.ra}, ${DN2.rb}`);
