// Builds LessonData/acsl-c2-bits.json: ACSL Junior Contest 2, Bit-String Flicking. It also writes the lesson's two
// drills, Drills/data/acsl-c2-bits.js (the topic drill and plenary) and Drills/data/acsl-c2-bits-ext.js (the Do Now
// Extension), and checks every card over many random draws.
//   node tools/build_acsl_c2_bits.mjs
// Every bit string on a slide and every drill answer is worked out by BitFlicker/bits-core.js (the same evaluator the
// Bit Flicker app uses; it is copied into the topic drill). The questions are written for this site in the ACSL style;
// the official wiki page and sample contest are linked on the last slide before the plenary.
// The lesson is not put under a year group: the Competition section of LessonData/lessons.json lists it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const B = require(path.join(ROOT, 'BitFlicker', 'bits-core.js'));
const CORE = fs.readFileSync(path.join(ROOT, 'BitFlicker', 'bits-core.js'), 'utf8').replace(/\r\n/g, '\n')
  .replace(/^if \(typeof module[^\n]*\n?/m, '').trim();
const ID = 'acsl-c2-bits';
const P = 'acslbits';
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const ev = (s) => B.evaluate(s);

// ---------------------------------------------------------------- slide helpers (as tools/build_y10_2_3_l2.mjs)
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
const predict = (q, a) => tps(q, a, 'Show the worked answer');
const code = (t) => `<code style="font-family:var(--font-mono,monospace);font-weight:700">${t}</code>`;

// Bit cells. '?' is an empty box to predict, ' ' an invisible cell that lines up a shorter string.
function cell(b, hl) {
  const base = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:7px;font:700 20px var(--font-mono,monospace);';
  let look;
  if (b === '?') look = 'border:2px dashed var(--line-strong);color:var(--muted)';
  else if (b === ' ') look = 'visibility:hidden';
  else look = 'background:var(--surface-3);color:' + (b === '1' ? 'var(--syn-number)' : b === '*' ? 'var(--brand)' : 'var(--muted)');
  return `<span style="${base}${look}${hl ? ';outline:2px solid var(--brand);outline-offset:1px' : ''}">${b === ' ' || b === '?' ? (b === '?' ? '?' : '') : b}</span>`;
}
function row(label, s, opt = {}) {
  const cells = s.split('').map((b, i) => cell(b, (opt.hl || []).includes(i))).join('');
  return `<div style="display:flex;align-items:center;gap:10px;margin:4px 0"><span style="min-width:${opt.w || 100}px;text-align:right;font:700 15px var(--font-mono,monospace);color:var(--ink-soft)">${label}</span>` +
    `<span style="display:inline-flex;gap:4px">${cells}</span>${opt.note ? `<span style="font-size:15px;color:var(--muted)">${opt.note}</span>` : ''}</div>`;
}
const line = (w = 100) => `<div style="height:2px;background:var(--line-strong);margin:3px 0 3px ${w + 10}px;max-width:200px"></div>`;
const card = (title, body) => `<div style="padding:10px 14px;border-radius:10px;background:var(--surface-2)">${title ? `<p style="margin:0 0 6px;text-align:center"><strong>${title}</strong></p>` : ''}${body}</div>`;
const twoCols = (a, b) => `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start">${a}${b}</div>`;
const threeCols = (a, b, c) => `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start">${a}${b}${c}</div>`;
const q5 = '?????';
const blanks = (n) => '?'.repeat(n);
const pad = (s, L) => ' '.repeat(L - s.length) + s;

// A typed bit string or pattern: spaces between bits are fine, "x =" in front is fine.
const bitsRe = (s) => '^\\s*(x\\s*=\\s*)?' + s.split('').map((c) => (c === '*' ? '\\*' : c)).join('\\s*') + '\\s*\\.?\\s*$';
const numRe = (n) => `^\\s*${n}\\s*(values?)?\\s*\\.?\\s*$`;

const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">(${s}) ${p.label}</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const box = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, box) : box) };
}
function mcStep(id, label, heading, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`, items };
}
function embed(id, label, appId, heading, lead, whyQ, embedQuery) {
  const s = { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
  if (embedQuery) s.embedQuery = embedQuery;
  return s;
}
function concept(id, label, tpsHtml, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tpsHtml + body };
}
const steps = [];

// ---------------------------------------------------------------- Walk me through it
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
function pvTable(bits, hl = []) {
  const pv = [16, 8, 4, 2, 1];
  const td = (t, i, head) => `<td style="padding:6px 12px;text-align:center;border:1px solid var(--line-strong);${head ? 'color:var(--muted);' : 'font:700 20px var(--font-mono,monospace);'}"${hl.includes(i) ? ' class="wt-hl"' : ''}>${t}</td>`;
  return `<table style="border-collapse:collapse;margin:6px auto"><tr>${pv.map((p, i) => td(p, i, true)).join('')}</tr><tr>${pv.map((p, i) => td(bits[i] == null ? '&nbsp;' : bits[i], i, false)).join('')}</tr></table>`;
}
// Do Now 1: 5-bit binary to denary, and denary to 5-bit binary. Worked with 10011 (19) and 13 (01101).
const DN1 = { bin: '01011', den: 22 };
DN1.binAns = parseInt(DN1.bin, 2);
DN1.denAns = B.pad(DN1.den.toString(2), 5);
const WT_BINARY = { title: 'Walk me through it: 5-bit binary', steps: [
  { text: '<strong>A similar question.</strong> What is <strong>10011</strong> in denary?', visual: '<div class="wt-big">10011</div>' },
  { text: 'Write the 5 place values. Start with 1 on the right. Each one is double the one next to it.', visual: pvTable([]) },
  { text: 'Write each bit under its place value.', visual: pvTable(['1', '0', '0', '1', '1']) },
  { text: 'Add the place values that have a <strong>1</strong> under them: 16 + 2 + 1 = 19.', visual: pvTable(['1', '0', '0', '1', '1'], [0, 3, 4]) },
  { text: '<strong>The other way.</strong> Write 13 as 5 bits. Start on the left. Does 16 fit into 13? No: write 0.', visual: pvTable(['0'], [0]) + note('Left: 13') },
  { text: 'Does 8 fit into 13? Yes: write 1. 13 - 8 = 5. Does 4 fit into 5? Yes: write 1. 5 - 4 = 1.', visual: pvTable(['0', '1', '1'], [1, 2]) + note('Left: 1') },
  { text: 'Does 2 fit into 1? No: write 0. Does 1 fit into 1? Yes: write 1. Nothing is left.', visual: pvTable(['0', '1', '1', '0', '1'], [3, 4]) + note('Left: 0') },
  { text: 'Read the bits from left to right: <strong>01101</strong>. Keep the 0 at the front: the answer must have 5 bits. Now do the same with the numbers in your question.', visual: pvTable(['0', '1', '1', '0', '1'], [0, 1, 2, 3, 4]) },
] };
// Do Now 2: single bits with AND, OR and NOT (met in Years 7 to 9). Worked with P = 0, Q = 1, R = 1.
const DN2 = { A: 1, B: 0, C: 1 };
const and1 = (a, b) => a & b, or1 = (a, b) => a | b, not1 = (a) => 1 - a;
DN2.ans = [or1(DN2.B, DN2.C), not1(and1(DN2.A, DN2.C))];
const lamp = (name, v, hl) => `<span style="display:inline-block;margin:0 8px;text-align:center"><span${hl ? ' class="wt-hl"' : ''} style="display:inline-block;padding:6px 14px;border-radius:8px;background:var(--surface-3);font:700 20px var(--font-mono,monospace)">${v}</span><br><span style="color:var(--muted)">${name}</span></span>`;
const lamps = (hl = []) => `<div style="text-align:center">${lamp('P', 0, hl.includes('P'))}${lamp('Q', 1, hl.includes('Q'))}${lamp('R', 1, hl.includes('R'))}</div>`;
const WT_LOGIC = { title: 'Walk me through it: AND, OR and NOT', steps: [
  { text: '<strong>A similar question.</strong> P = 0, Q = 1 and R = 1.', visual: lamps() },
  { text: 'AND gives 1 only when <strong>both</strong> bits are 1. P AND Q: P is 0, so the answer is 0.', visual: lamps(['P', 'Q']) + note('P AND Q = 0') },
  { text: 'OR gives 1 when <strong>at least one</strong> bit is 1. P OR R: R is 1, so the answer is 1.', visual: lamps(['P', 'R']) + note('P OR R = 1') },
  { text: 'NOT gives the <strong>opposite</strong> bit. NOT P: P is 0, so the answer is 1.', visual: lamps(['P']) + note('NOT P = 1') },
  { text: 'Brackets first. NOT (Q AND R): Q AND R is 1, because both are 1. Then NOT 1 is 0.', visual: lamps(['Q', 'R']) + note('NOT (Q AND R) = 0') },
  { text: 'Now use A, B and C from your question. Read each bit, then use the rule for each word.', visual: note('read the bits, then the rule') },
] };

// ---------------------------------------------------------------- Do Now
steps.push(checkStep('do-now', 'Do Now: 5-bit Binary (1 of 2)', 'Do Now: 5-bit Binary (1 of 2)',
  'Warm-up from binary numbers. Every bit string today has a fixed number of bits.', [
    { label: `What is ${code(DN1.bin)} in denary?`, answer: numRe(DN1.binAns), feedback: 'Write 16, 8, 4, 2, 1 above the bits. Add the place values with a 1.' },
    { label: `Write ${DN1.den} as a 5-bit binary number.`, answer: bitsRe(DN1.denAns), feedback: 'Start at 16. Does it fit? Write 1 or 0, take it away, then try 8, 4, 2, 1.' },
  ], ['Why does a 5-bit number need a 0 at the front when it is small?', 'Every number must use all 5 places, so the empty places on the left are written as 0.']));
steps[steps.length - 1].walkthrough = WT_BINARY;
steps.push(checkStep('do-now-2', 'Do Now: AND, OR, NOT (2 of 2)', 'Do Now: AND, OR, NOT (2 of 2)',
  `Warm-up from logic. A = ${DN2.A}, B = ${DN2.B} and C = ${DN2.C}. Give each answer as one bit.`, [
    { label: 'B OR C', answer: numRe(DN2.ans[0]), feedback: 'OR needs at least one bit to be 1.' },
    { label: 'NOT (A AND C)', answer: numRe(DN2.ans[1]), feedback: 'Work out the brackets first, then use NOT.' },
  ], ['Why do we work out the brackets before the NOT?', 'NOT needs one bit to work on. The brackets make that bit first.']));
steps[steps.length - 1].walkthrough = WT_LOGIC;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-acsl-c2-bits-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions on binary numbers and on AND, OR and NOT. Stuck? Switch on <strong>I need help</strong>.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Bit-String Flicking',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">ACSL Junior Contest 2</p><h2 class="lesson-h2">Bit-String Flicking</h2><p>Competition</p></div>' +
    facts(['<strong>Today:</strong> change a row of bits with operators, work out long expressions, and solve for x.', '<strong>In the contest:</strong> two of the five short questions are on this topic.']) +
    why('A bit can only be 0 or 1. Why is a row of bits so useful to a computer?', 'Each bit can stand for one thing that is on or off, so one short row can hold many facts at once.') });

// ---------------------------------------------------------------- why flick bits
const FLAGS = ['Sound', 'Music', 'Hints', 'Dark', 'Fast'];
const FLAG_BITS = '10110';
const flagTable = `<table style="border-collapse:collapse;margin:6px auto"><tr>${FLAGS.map((f) => `<td style="padding:4px 8px;color:var(--muted);text-align:center;font-size:15px">${f}</td>`).join('')}</tr>` +
  `<tr>${FLAG_BITS.split('').map((b) => `<td style="text-align:center;padding:2px 4px">${cell(b)}</td>`).join('')}</tr></table>`;
steps.push(concept('concept-why', 'Why Flick Bits?',
  predict('Predict: a game keeps five settings in one row of five bits. Why is that better than five words like ON and OFF?',
    '<p>Five bits take far less space than five words.</p><p>One operation can check or change <strong>all five settings at once</strong>.</p>'),
  columns(facts(['Computers keep on and off settings as bits called <strong>flags</strong>: 1 is on, 0 is off.', 'A <strong>mask</strong> is a bit string that picks which bits to keep, change or switch on.', 'Pictures are rows of bits too. Moving every bit one place moves the picture.', '<strong>Bit-string flicking</strong> means changing bit strings with operators.']),
    card('Game settings', flagTable + `<p style="margin:6px 0 0;text-align:center;font-size:15px">Sound on, Music off, Hints on, Dark on, Fast off</p>`))));

// ---------------------------------------------------------------- NOT
const NOT_EX = '10110';
steps.push(concept('concept-not', 'NOT: Flip Every Bit',
  predict(`Predict: what is ${code('NOT ' + NOT_EX)}? Why is it the same length?`,
    `<p>${code('NOT ' + NOT_EX + ' = ' + ev('NOT ' + NOT_EX))}</p><p>Each bit is flipped where it is. No bit is added or taken away.</p>`),
  columns(facts(['<strong>NOT</strong> works on one bit string.', 'Every 1 becomes 0. Every 0 becomes 1.', 'The answer has the same number of bits.']),
    card('Predict', row('start', NOT_EX) + line() + row('NOT', q5)))));

// ---------------------------------------------------------------- AND, OR, XOR
const LA = '11010', LB = '10011';
const opCol = (op, rule) => card(op, row('', LA, { w: 30 }) + row('', LB, { w: 30 }) + line(30) + row('', q5, { w: 30 }) + `<p style="margin:6px 0 0;font-size:15px;text-align:center">${rule}</p>`);
steps.push(concept('concept-and-or-xor', 'AND, OR, XOR: Column by Column',
  predict(`Predict all three answers for ${code(LA)} and ${code(LB)}. Why can you work one column at a time?`,
    `<p>AND: ${code(ev(LA + ' AND ' + LB))}. OR: ${code(ev(LA + ' OR ' + LB))}. XOR: ${code(ev(LA + ' XOR ' + LB))}.</p><p>Each column only uses the two bits in that column. No column changes another.</p>`),
  threeCols(opCol('AND', '1 only if <strong>both</strong> bits are 1'), opCol('OR', '1 if <strong>at least one</strong> bit is 1'), opCol('XOR', '1 if the bits are <strong>different</strong>')) +
  facts(['AND with a mask <strong>keeps</strong> the bits under a 1 and clears the rest.', 'OR with a mask <strong>switches on</strong> the bits under a 1.', 'XOR with a mask <strong>flips</strong> the bits under a 1.'])));

const CL = { a: 'NOT 01101', b: '10101 AND 11100', c: '10101 OR 01100', d: '11011 XOR 10110' };
steps.push(checkStep('check-logic', 'Check: Four Operators (1 of 2)', 'Check: Four Operators (1 of 2)', 'Type each answer as 5 bits.', [
  { label: code(CL.a), answer: bitsRe(ev(CL.a)), feedback: 'Flip every bit.' },
  { label: code(CL.b), answer: bitsRe(ev(CL.b)), feedback: 'A 1 only where both bits are 1.' },
], ['Why does AND with a mask clear some bits but never set a new 1?', 'AND needs both bits to be 1, so a 0 in the mask always gives 0, and a 1 in the mask only keeps what was there.']));
steps.push(checkStep('check-logic-2', 'Check: Four Operators (2 of 2)', 'Check: Four Operators (2 of 2)', 'Type each answer as 5 bits.', [
  { label: code(CL.c), answer: bitsRe(ev(CL.c)), feedback: 'A 1 where at least one bit is 1.' },
  { label: code(CL.d), answer: bitsRe(ev(CL.d)), feedback: 'A 1 where the two bits are different.' },
], ['How can you check an XOR answer once you have it?', 'XOR the answer with the second string. You should get the first string back.']));

// ---------------------------------------------------------------- shifts
const SH = '10111';
steps.push(concept('concept-shift', 'Shifts: Bits Fall Off',
  predict(`Predict: what are ${code('LSHIFT-2 ' + SH)} and ${code('RSHIFT-1 ' + SH)}? Why do zeros appear?`,
    `<p>${code('LSHIFT-2 ' + SH + ' = ' + ev('LSHIFT-2 ' + SH))} and ${code('RSHIFT-1 ' + SH + ' = ' + ev('RSHIFT-1 ' + SH))}.</p><p>The string keeps its length, so the empty places at the other end are filled with zeros.</p>`),
  columns(facts([`${code('LSHIFT-n')} moves every bit <strong>n places left</strong>.`, 'The first n bits <strong>fall off</strong>. They are lost.', 'n zeros come in on the right.', `${code('RSHIFT-n')} does the same to the right.`, 'The length never changes.']),
    card('Predict', row('start', SH) + line() + row('LSHIFT-2', q5) + row('RSHIFT-1', q5)))));

// ---------------------------------------------------------------- circulates
const CI = '10111';
steps.push(concept('concept-circ', 'Circulates: Bits Wrap Round',
  predict(`Predict: what are ${code('LCIRC-2 ' + CI)} and ${code('RCIRC-1 ' + CI)}? Why are there no new zeros?`,
    `<p>${code('LCIRC-2 ' + CI + ' = ' + ev('LCIRC-2 ' + CI))} and ${code('RCIRC-1 ' + CI + ' = ' + ev('RCIRC-1 ' + CI))}.</p><p>No bit is lost. A bit that falls off one end comes back on the other end.</p>`),
  columns(facts([`${code('LCIRC-n')} moves every bit <strong>n places left</strong>.`, 'A bit that falls off the left end <strong>comes back</strong> on the right.', `${code('RCIRC-n')} does the same to the right.`, 'Nothing is lost, so the number of 1s stays the same.']),
    card('Predict', row('start', CI) + line() + row('LCIRC-2', q5) + row('RCIRC-1', q5)))));

// ---------------------------------------------------------------- compare shift and circ
const CM = '11001';
steps.push(concept('compare-shift-circ', 'Compare: LSHIFT-2 and LCIRC-2',
  predict(`Predict both answers for ${code(CM)}. Which bits are the same in both? Why are the last two different?`,
    `<p>${code('LSHIFT-2 ' + CM + ' = ' + ev('LSHIFT-2 ' + CM))} and ${code('LCIRC-2 ' + CM + ' = ' + ev('LCIRC-2 ' + CM))}.</p><p>The first three bits are the same: they moved the same way. At the right end, the shift brings in zeros, but the circulate brings back the two bits that fell off.</p>`),
  twoCols(card('LSHIFT-2', row('start', CM, { w: 60 }) + line(60) + row('', q5, { w: 60 }) + '<p style="margin:6px 0 0;text-align:center">The two bits that fall off are <strong>lost</strong>.</p>'),
    card('LCIRC-2', row('start', CM, { w: 60 }) + line(60) + row('', q5, { w: 60 }) + '<p style="margin:6px 0 0;text-align:center">The two bits that fall off <strong>come back</strong>.</p>'))));

// ---------------------------------------------------------------- big counts
const BIG = { s: '10110', op: 'RCIRC', n: 12 };
BIG.r = BIG.n % 5;
steps.push(concept('concept-big', 'Big Counts: Go Round Again',
  predict(`Predict: what is ${code(BIG.op + '-' + BIG.n + ' ' + BIG.s)}? Why do you not need to make ${BIG.n} moves?`,
    `<p>After 5 moves, 5 bits are back where they started. ${BIG.n} = 2 &times; 5 + ${BIG.r}, so it is the same as ${code(BIG.op + '-' + BIG.r)}.</p><p>${code(BIG.op + '-' + BIG.n + ' ' + BIG.s + ' = ' + ev(BIG.op + '-' + BIG.n + ' ' + BIG.s))}</p>`),
  columns(facts(['A circulate of <strong>5 places</strong> on 5 bits brings every bit back to the start.', 'So take away 5 as many times as you can. Only the <strong>remainder</strong> matters.', `Example: on 5 bits, ${code('LCIRC-7')} is the same as ${code('LCIRC-2')}.`, `A shift of 5 or more on 5 bits leaves ${code('00000')}: every bit has fallen off.`]),
    card('Predict', row('start', BIG.s, { w: 90 }) + line(90) + row(BIG.op + '-' + BIG.n, q5, { w: 90 })))));
assert(ev('LCIRC-7 01101') === ev('LCIRC-2 01101'), 'LCIRC-7 is LCIRC-2 on 5 bits');

const CS = { a: 'LSHIFT-1 01101', b: 'RSHIFT-3 11010', c: 'RCIRC-2 10011', d: 'LCIRC-23 01101' };
steps.push(checkStep('check-shift', 'Check: Shifts and Circulates (1 of 2)', 'Check: Shifts and Circulates (1 of 2)', 'Type each answer as 5 bits.', [
  { label: code(CS.a), answer: bitsRe(ev(CS.a)), feedback: 'Every bit moves 1 left. A zero comes in on the right.' },
  { label: code(CS.b), answer: bitsRe(ev(CS.b)), feedback: 'Every bit moves 3 right. Three zeros come in on the left.' },
], ['Why must a shift answer always have the same number of bits as the start?', 'Every bit that falls off one end is replaced by a zero at the other end.']));
steps.push(checkStep('check-shift-2', 'Check: Shifts and Circulates (2 of 2)', 'Check: Shifts and Circulates (2 of 2)', 'Type each answer as 5 bits.', [
  { label: code(CS.c), answer: bitsRe(ev(CS.c)), feedback: 'The last 2 bits wrap round to the front.' },
  { label: code(CS.d), answer: bitsRe(ev(CS.d)), feedback: 'Take away 5 as many times as you can first.' },
], ['Why can a circulate never change how many 1s a string has, but a shift can?', 'A circulate brings every bit back on the other end. A shift loses bits and brings in zeros.']));

// ---------------------------------------------------------------- activity 1
steps.push(embed('activity-1', 'Activity 1: Flick Lab', 'bit-flicker', 'Activity 1: Flick Lab',
  '<strong>Predict</strong>: set every bit, then Check. <strong>Target</strong>: plan every move, then Run. Wrong answers cost a life.',
  ['Why does a target round make you plan every move before you run it?', 'You must predict each step in your head, the way you will in the contest, instead of trying buttons until it works.'], 'mode=lab'));

// ---------------------------------------------------------------- precedence
const ladder = ['NOT', 'LSHIFT, RSHIFT, LCIRC, RCIRC', 'AND', 'XOR', 'OR'];
const ladderHtml = '<ol style="margin:0;padding-left:26px;font-size:18px;line-height:1.9">' + ladder.map((t, i) => `<li><strong style="font-family:var(--font-mono,monospace)">${t}</strong>${i === 0 ? ' (first)' : i === ladder.length - 1 ? ' (last)' : ''}</li>`).join('') + '</ol>';
const PR = '11010';
steps.push(concept('concept-precedence', 'Which Operator Goes First?',
  predict(`Predict: in ${code('NOT LSHIFT-1 ' + PR)}, which operator goes first? Why?`,
    `<p>${code('LSHIFT-1')} goes first: it is next to the bits. ${code('LSHIFT-1 ' + PR + ' = ' + ev('LSHIFT-1 ' + PR))}, then ${code('NOT')} gives ${code(ev('NOT LSHIFT-1 ' + PR))}.</p>`),
  columns(card('The order', ladderHtml),
    facts(['<strong>Brackets</strong> are always worked first.', 'Then go down the list: NOT first, OR last.', 'Two of the same, like AND and AND: work <strong>left to right</strong>.', 'NOT and the shifts sit in front of their bits. A chain of them works <strong>right to left</strong>: the one next to the bits goes first.']))));

const CP = { a: '10110', b: '01100', c: '00111' };
CP.src = `${CP.a} OR ${CP.b} AND ${CP.c}`;
CP.wrong = ev(`(${CP.a} OR ${CP.b}) AND ${CP.c}`);
CP.right = ev(CP.src);
assert(CP.wrong !== CP.right, 'precedence compare must differ');
steps.push(concept('compare-precedence', 'Compare: Left to Right or By the Order?',
  predict(`Predict: Ana works ${code(CP.src)} from left to right. Ben uses the order. Who is right? Why?`,
    `<p>Ben. AND comes before OR, so ${code(CP.b + ' AND ' + CP.c + ' = ' + ev(CP.b + ' AND ' + CP.c))} first, then ${code(CP.a + ' OR ' + ev(CP.b + ' AND ' + CP.c) + ' = ' + CP.right)}.</p><p>Ana gets ${code(CP.wrong)}: the same bits, a different order, a different answer.</p>`),
  `<p class="lesson-lead" style="text-align:center">${code(CP.src)}</p>` +
  twoCols(card('Ana: left to right', row('step 1', q5, { w: 60, note: 'OR first' }) + row('step 2', q5, { w: 60, note: 'then AND' })),
    card('Ben: by the order', row('step 1', q5, { w: 60, note: 'AND first' }) + row('step 2', q5, { w: 60, note: 'then OR' })))));

const MCP1 = '11010 XOR 01101 AND 10011', MCP2 = 'NOT RCIRC-2 01101 OR 10000';
assert(B.ready(B.parse(MCP1)).map(B.opName).join() === 'AND', 'mc 1 first op');
assert(B.ready(B.parse(MCP2)).map(B.opName).join() === 'RCIRC-2', 'mc 2 first op');
steps.push(mcStep('check-precedence', 'Check: Which Goes First? (1 of 2)', 'Check: Which Goes First? (1 of 2)', '', [
  { prompt: `In ${MCP1}, which operator is worked first?`, options: ['XOR', 'AND', 'Both at once', 'The leftmost one'], correct: 1,
    explain: 'AND comes before XOR in the order, wherever it is in the line.' },
], ['Why does the contest need an agreed order for the operators?', 'Without one, two people could work out one expression in two ways, with two different results.']));
steps.push(mcStep('check-precedence-2', 'Check: Which Goes First? (2 of 2)', 'Check: Which Goes First? (2 of 2)', '', [
  { prompt: `In ${MCP2}, which operator is worked first?`, options: ['RCIRC-2', 'NOT', 'OR', 'The leftmost one'], correct: 0,
    explain: 'NOT and RCIRC-2 are a chain in front of the bits. The one next to the bits goes first.' },
], ['Why can a wrong first step never be put right later in the working?', 'Every later step uses its result, so the mistake is carried all the way to the end.']));

// ---------------------------------------------------------------- padding
const PD = { a: '101', b: '11011' };
PD.src = `${PD.a} AND ${PD.b}`;
steps.push(concept('concept-padding', 'Different Lengths',
  predict(`Predict: what is ${code(PD.src)}? Where do the missing bits go, and why there?`,
    `<p>Pad ${code(PD.a)} to ${code(B.pad(PD.a, 5))}: zeros on the <strong>left</strong>, so its value stays the same. Then ${code(B.pad(PD.a, 5) + ' AND ' + PD.b + ' = ' + ev(PD.src))}.</p>`),
  columns(facts(['AND, OR and XOR need two strings of the <strong>same length</strong>.', 'Pad the shorter string with <strong>zeros on the left</strong>.', 'The answer has the length of the longer string.', 'NOT, shifts and circulates <strong>keep</strong> the length of their own string.']),
    card('Predict', row('', pad(PD.a, 5)) + row('AND', PD.b) + line() + row('', q5)))));

// ---------------------------------------------------------------- activity 2
steps.push(embed('activity-2', 'Activity 2: Precedence Pile-up', 'bit-flicker', 'Activity 2: Precedence Pile-up',
  'Click the operator that is worked <strong>next</strong>, then set its answer. A wrong choice costs a life.',
  ['Why does each step shrink the expression?', 'Each operator and its bits are replaced by one answer, so there is less left to work out.'], 'mode=pile'));

// ---------------------------------------------------------------- a contest-style expression
const MX = 'NOT (LCIRC-2 10101 XOR RSHIFT-1 01110) AND 11011';
const MXT = B.trace(MX);
assert(MXT.length === 5, 'mixed trace has 5 steps');
steps.push(concept('concept-mixed', 'A Contest-Style Expression',
  predict('Predict the five steps in order before you work any of them out. Why is NOT not the first step?',
    '<ol style="margin:0;padding-left:22px">' + MXT.map((s) => `<li>${code(s.text)}</li>`).join('') + '</ol><p>NOT works on the whole bracket, so the bracket must be finished first.</p>'),
  `<p class="lesson-lead" style="text-align:center;font-size:20px">${code(MX)}</p>` +
  columns(facts(['<strong>1.</strong> Find the brackets. Work inside them first.', '<strong>2.</strong> Inside, do NOT, shifts and circulates first.', '<strong>3.</strong> Then AND, then XOR, then OR.', '<strong>4.</strong> Write every step on its own line.']),
    card('Steps', MXT.map((s, i) => row('step ' + (i + 1), q5, { w: 60, note: s.op })).join('')))));

const XM = { a: 'RCIRC-3 (01101 AND 11011) OR LSHIFT-2 10011', b: 'NOT 10110 XOR 01100 AND LCIRC-7 10011' };
steps.push(checkStep('check-mixed', 'Check: Contest-Style Expressions', 'Check: Contest-Style Expressions', 'Write each step on paper first. Type each answer as 5 bits.', [
  { label: code(XM.a), answer: bitsRe(ev(XM.a)), feedback: 'Brackets first, then the two shifts, then OR.' },
  { label: code(XM.b), answer: bitsRe(ev(XM.b)), feedback: 'NOT and LCIRC-7 first (LCIRC-7 is LCIRC-2 on 5 bits), then AND, then XOR.' },
], ['Why is writing every step on its own line worth the time in a contest?', 'One slip early on spoils every step after it. A written step can be checked again quickly.']));

// ---------------------------------------------------------------- solving for x
const FX1 = { m: '10110', r: '00110' };
FX1.sols = B.solve('x AND ' + FX1.m, FX1.r, 5);
FX1.pat = B.pattern(FX1.sols);
assert(FX1.pat === '0*11*', 'FX1 pattern ' + FX1.pat);
steps.push(concept('concept-findx', 'Solve for x: The Mask Hides Some Bits',
  predict(`Predict: which 5-bit values of x make ${code('x AND ' + FX1.m + ' = ' + FX1.r)} true? Why can some bits of x be anything?`,
    `<p>Under each 1 in the mask, x must equal the answer bit. Under each 0, AND gives 0 whatever x is, so that bit is <strong>*</strong>.</p><p>x = ${code(FX1.pat)}: ${FX1.sols.length} values (${FX1.sols.join(', ')}).</p>`),
  columns(facts(['A <strong>*</strong> means "this bit can be 0 or 1".', 'Go column by column. Ask: which bits of x give the answer bit?', 'AND with 0 always gives 0: x can be anything there.', 'OR with 1 always gives 1: x can be anything there.', 'Each * doubles the number of answers.']),
    card(code('x AND ' + FX1.m + ' = ' + FX1.r), row('mask', FX1.m, { w: 70 }) + row('answer', FX1.r, { w: 70 }) + line(70) + row('x', q5, { w: 70 })))));

const FX2 = { k: 2, m: '01001', r: '11101' };
FX2.lhs = `(LCIRC-${FX2.k} x) OR ${FX2.m}`;
FX2.sols = B.solve(FX2.lhs, FX2.r, 5);
FX2.pat = B.pattern(FX2.sols);
FX2.ypat = B.pattern(B.solve('x OR ' + FX2.m, FX2.r, 5));
assert(FX2.pat && FX2.ypat && B.shift('RCIRC', FX2.k, FX2.ypat) === FX2.pat, 'FX2 undo the circulate');
steps.push(concept('concept-findx-2', 'Solve for x: Undo the Circulate',
  predict(`Predict: solve ${code(FX2.lhs + ' = ' + FX2.r)}. Why do you undo the circulate last?`,
    `<p>First find what ${code('LCIRC-' + FX2.k + ' x')} must be: ${code(FX2.ypat)}. That bracket is the last thing done to x, so it is the last thing to undo.</p><p>Undo LCIRC-${FX2.k} with RCIRC-${FX2.k}, stars and all: x = ${code(FX2.pat)}.</p>`),
  columns(facts(['Work from the <strong>outside in</strong>: undo the last operator first.', `Call the bracket y. Solve ${code('y OR ' + FX2.m + ' = ' + FX2.r)} column by column.`, 'Then undo the circulate: move the pattern back the other way. The stars move too.', 'Test one answer at the end to be sure.']),
    card(code(FX2.lhs + ' = ' + FX2.r), row('y', q5, { w: 40, note: 'first' }) + row('x', q5, { w: 40, note: 'then undo' })))));

const CF = { a: 'x OR 01010', ar: '11011', b: '(RCIRC-1 x) AND 11001', br: '01001' };
CF.aPat = B.pattern(B.solve(CF.a, CF.ar, 5));
CF.bSols = B.solve(CF.b, CF.br, 5);
CF.bPat = B.pattern(CF.bSols);
assert(CF.aPat && CF.bPat, 'check findx patterns');
steps.push(checkStep('check-findx', 'Check: Solve for x', 'Check: Solve for x', 'x has 5 bits. Use * for a bit that can be 0 or 1.', [
  { label: `Solve ${code(CF.a + ' = ' + CF.ar)}`, answer: bitsRe(CF.aPat), feedback: 'Under a 1 in the mask, x can be anything. Under a 0, x must equal the answer bit.' },
  { label: `Solve ${code(CF.b + ' = ' + CF.br)}`, answer: bitsRe(CF.bPat), feedback: 'Solve for the bracket first, then undo RCIRC-1 with LCIRC-1.' },
  { label: 'How many values of x make part (b) true?', answer: numRe(CF.bSols.length), feedback: 'Each * can be 0 or 1. Each * doubles the count.' },
], ['How can you check a pattern answer without trying every value?', 'Test one value that fits the pattern, then change one * bit and test again.']));

// ---------------------------------------------------------------- practice
steps.push(embed('practice', 'Practice: Find X', 'bit-flicker', 'Practice: Find X',
  'Find <strong>every</strong> x. Use * for any bit. Two free tests, then one Check per puzzle.',
  ['Why is testing one value of x not enough to answer the question?', 'One value can work while others work too. The question asks for every value, so you need the pattern.'], 'mode=findx'));

// ---------------------------------------------------------------- the real thing
steps.push({ id: 'links', label: 'Try the Real Thing',
  content: '<h2 class="lesson-h2">Try the Real Thing</h2>' +
    why('Why practise on real contest papers as well as on these games?', 'The contest has its own wording and layout. Seeing it before the day means no surprises.') +
    columns(facts(['The ACSL wiki page explains every operator with more examples.', 'The sample Junior contest has two bit-string questions. Time yourself: about 6 minutes each.', 'Check every answer by working it out a second way.']),
      '<ul class="lesson-facts">' +
      '<li><a href="http://www.categories.acsl.org/wiki/index.php?title=Bit-String_Flicking" target="_blank" rel="noopener">ACSL wiki: Bit-String Flicking</a></li>' +
      '<li><a href="http://datafiles.acsl.org/samples/contest2/2junior.pdf" target="_blank" rel="noopener">Sample Junior Contest 2 (PDF)</a></li></ul>') });

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Bit-String Flicking', 'drill-acsl-c2-bits', 'Plenary: Bit-String Flicking',
  'Answer until every card is mastered. Type bits with or without spaces.'));

// ---------------------------------------------------------------- lesson checks
{
  const s = JSON.stringify(WT_BINARY);
  assert(!s.includes(DN1.denAns) && !new RegExp('\\b' + DN1.binAns + '\\b').test(s.replace(/<[^>]+>/g, ' ')), 'binary walkthrough leaks an answer');
  assert(DN1.binAns === 11 && DN1.denAns === '10110', 'Do Now values');
  assert(DN2.ans.join() === '1,0', 'Do Now 2 answers ' + DN2.ans.join());
  // Terms are never used before the slide that teaches them.
  const at = (id) => steps.findIndex((x) => x.id === id);
  const teach = [[/\bXOR\b/, 'concept-and-or-xor'], [/SHIFT/, 'concept-shift'], [/CIRC/, 'concept-circ'], [/\bmask\b/i, 'concept-why'], [/\bpad/i, 'concept-padding'], [/\*/, 'concept-findx']];
  steps.forEach((st, i) => {
    const text = (st.content + JSON.stringify(st.items || '') + JSON.stringify(st.walkthrough || '')).replace(/<[^>]+>/g, ' ');
    teach.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${st.id} uses ${rx} before ${from}`));
  });
  // Every answer on a check slide passes its own pattern; a wrong one fails.
  Object.entries(validators).forEach(([k, parts]) => parts.forEach((p) => assert(p.pattern.source.length > 6, k)));
  const vt = (key, i, yes, no) => {
    const rx = new RegExp(validators[key][i].pattern.source, 'i');
    yes.forEach((s) => assert(rx.test(s), `${key}[${i}] rejects "${s}"`));
    no.forEach((s) => assert(!rx.test(s), `${key}[${i}] accepts "${s}"`));
  };
  vt('acslbits_check_shift_2', 1, [ev(CS.d), ev(CS.d).split('').join(' '), ' ' + ev(CS.d) + ' '], [ev('LCIRC-2 01101'), ev('RCIRC-3 01101')]);
  vt('acslbits_check_findx', 0, [CF.aPat, CF.aPat.split('').join(' '), 'x = ' + CF.aPat], [CF.aPat.replace(/\*/g, '0'), CF.ar]);
  vt('acslbits_do_now', 1, ['10110', '1 0 1 1 0'], ['1011', '010110']);
}

// ---------------------------------------------------------------- drills
const drillHead = (id, about) => `// ACSL Junior Contest 2: Bit-String Flicking. ${about}\n// Loaded by Drills/index.html?drill=${id}\n// Generated by tools/build_acsl_c2_bits.mjs: edit that, then run it.\n`;
const catsSrc = (categories) => `[\n${categories.map((c) => '    ' + JSON.stringify(c)).join(',\n')}\n  ]`;

// ---- The topic drill and plenary. Every answer comes from BitCore (BitFlicker/bits-core.js, copied in).
function topicCards(B) {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(l) { return l[Math.floor(Math.random() * l.length)]; }
  function bits(L) { var s; do { s = ""; for (var i = 0; i < L; i++) s += Math.random() < 0.5 ? "1" : "0"; } while (!/0/.test(s) || !/1/.test(s)); return s; }
  function bitRe(s) { return new RegExp("^\\s*(x\\s*=\\s*)?" + s.split("").map(function (c) { return c === "*" ? "\\*" : c; }).join("\\s*") + "\\s*\\.?\\s*$", "i"); }
  function numRe(n) { return new RegExp("^\\s*" + n + "\\s*(values?)?\\s*\\.?\\s*$", "i"); }
  function opRe(op) { var m = /^(\w+)-(\d+)$/.exec(op); return m ? new RegExp("^\\s*" + m[1] + "\\s*-?\\s*" + m[2] + "\\s*\\.?\\s*$", "i") : new RegExp("^\\s*" + op + "\\s*\\.?\\s*$", "i"); }
  function flip(s, i) { return s.slice(0, i) + (s[i] === "1" ? "0" : s[i] === "0" ? "1" : "0") + s.slice(i + 1); }
  // Three wrong answers of the same length: the given mistakes first, then single-bit slips.
  function wrongs(ans, list) {
    var out = [];
    list.forEach(function (c) { if (c && c.length === ans.length && c !== ans && out.indexOf(c) < 0) out.push(c); });
    for (var g = 0; out.length < 3 && g < 60; g++) { var f = flip(ans, rnd(0, ans.length - 1)); if (out.indexOf(f) < 0 && f !== ans) out.push(f); }
    return out.slice(0, 3);
  }
  // A worked example on fresh values that never contains the card's answer.
  function exampleFor(ans, make) { var e; for (var i = 0; i < 80; i++) { e = make(); if (e.indexOf(ans) < 0) return e; } return e; }
  function cols(op, a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i] + " " + op + " " + b[i] + " = " + B.binop(op, a[i], b[i]));
    return out.join(", ");
  }
  var RULE = { AND: "AND gives 1 only where both bits are 1.", OR: "OR gives 1 where at least one bit is 1.", XOR: "XOR gives 1 where the two bits are different." };
  function binCard(id, op) {
    return { id: id, category: "ops", format: "Type 5 bits", randomize: function () {
      var a = bits(5), b = bits(5), ans = B.binop(op, a, b);
      var others = ["AND", "OR", "XOR"].filter(function (o) { return o !== op; }).map(function (o) { return B.binop(o, a, b); });
      return { prompt: "What is " + a + " " + op + " " + b + "?", answers: [ans], keywords: [bitRe(ans)], distractors: wrongs(ans, others.concat([B.not(ans)])),
        example: exampleFor(ans, function () { var p = bits(5), q = bits(5); return "Example: " + p + " " + op + " " + q + ".\nStep 1: line the strings up, one above the other.\nStep 2: " + RULE[op] + "\nStep 3: column by column: " + cols(op, p, q) + ".\nSo the answer is " + B.binop(op, p, q) + "."; }),
        working: ["Line up the two strings and go one column at a time.", RULE[op]],
        note: a + " " + op + " " + b + " = " + ans + ". " + RULE[op] };
    } };
  }
  function moveCard(id, op, lo, hi) {
    return { id: id, category: "moves", format: "Type 5 bits", randomize: function () {
      var s = bits(5), n = rnd(lo, hi), ans = B.shift(op, n, s);
      while (ans === s) { s = bits(5); ans = B.shift(op, n, s); }
      var other = { LSHIFT: "LCIRC", RSHIFT: "RCIRC", LCIRC: "LSHIFT", RCIRC: "RSHIFT" }[op], back = { LSHIFT: "RSHIFT", RSHIFT: "LSHIFT", LCIRC: "RCIRC", RCIRC: "LCIRC" }[op];
      var rule = /SHIFT/.test(op) ? "Bits that fall off are lost, and zeros come in on the other end." : "Bits that fall off one end come back on the other end.";
      return { prompt: "What is " + op + "-" + n + " " + s + "?", answers: [ans], keywords: [bitRe(ans)], distractors: wrongs(ans, [B.shift(other, n, s), B.shift(back, n, s), B.shift(op, n + 1, s)]),
        example: exampleFor(ans, function () { var e = bits(5), k = rnd(1, 3), dir = op.charAt(0) === "L" ? "left" : "right";
          return "Example: " + op + "-" + k + " " + e + ".\nStep 1: every bit moves " + k + " place" + (k > 1 ? "s" : "") + " " + dir + ".\nStep 2: " + rule + "\nSo " + op + "-" + k + " " + e + " = " + B.shift(op, k, e) + "."; }),
        working: ["Which way do the bits move, and how far?", rule],
        note: op + "-" + n + " " + s + " = " + ans + ". " + rule };
    } };
  }
  function bigCircCard(id) {
    return { id: id, category: "moves", format: "Type 5 bits", randomize: function () {
      var op = pick(["LCIRC", "RCIRC"]), n, s = bits(5), ans;
      do { n = rnd(6, 29); } while (n % 5 === 0);
      ans = B.shift(op, n, s);
      while (ans === s) { s = bits(5); ans = B.shift(op, n, s); }
      var r = n % 5, back = op === "LCIRC" ? "RCIRC" : "LCIRC";
      return { prompt: "On 5 bits, what is " + op + "-" + n + " " + s + "?", answers: [ans], keywords: [bitRe(ans)],
        distractors: wrongs(ans, [B.shift(back, r, s), B.shift(op, r + 1, s), B.shift(op === "LCIRC" ? "LSHIFT" : "RSHIFT", r, s)]),
        example: exampleFor(ans, function () { var e = bits(5), k; do { k = rnd(6, 29); } while (k % 5 === 0 || k === n); var o = pick(["LCIRC", "RCIRC"]);
          return "Example: " + o + "-" + k + " " + e + ".\nStep 1: every 5 moves bring 5 bits back to the start.\nStep 2: " + k + " = " + Math.floor(k / 5) + " x 5 + " + (k % 5) + ", so do " + o + "-" + (k % 5) + ".\nSo the answer is " + B.shift(o, k, e) + "."; }),
        working: ["Every 5 moves bring 5 bits back to where they started.", "Take away 5 as many times as you can. Circulate by what is left."],
        note: n + " = " + Math.floor(n / 5) + " x 5 + " + r + ", so " + op + "-" + n + " is " + op + "-" + r + ": " + ans + "." };
    } };
  }
  function evalCard(id, category, make, why) {
    return { id: id, category: category, format: "Type the bits", randomize: function () {
      var t, ans, wrong;
      for (var g = 0; g < 200; g++) { t = make(); ans = B.evaluate(t.src); wrong = t.wrong ? B.evaluate(t.wrong) : null; if (!t.wrong || wrong !== ans) break; }
      var steps = B.trace(t.src);
      return { prompt: "What is " + t.src + "?", answers: [ans], keywords: [bitRe(ans)], distractors: wrongs(ans, [wrong].concat(t.more || [])),
        example: exampleFor(ans, function () { var e = make(), tr = B.trace(e.src); return "Example: " + e.src + ".\n" + tr.map(function (s, i) { return "Step " + (i + 1) + ": " + s.text; }).join("\n") + "\nSo the answer is " + B.evaluate(e.src) + "."; }),
        working: why,
        note: steps.map(function (s) { return s.text; }).join("; ") + "." };
    } };
  }
  function solveCard(id, make, nudges) {
    return { id: id, category: "solve", format: "Type 5 bits, using * for any bit", randomize: function () {
      var t, sols, pat;
      for (var g = 0; g < 300; g++) { t = make(); sols = B.solve(t.lhs, t.rhs, 5); pat = B.pattern(sols); if (pat && sols.length > 1 && sols.length < 32 && (!t.stars || /\*/.test(pat))) break; }
      return { prompt: "x has 5 bits. Find every x with " + t.lhs + " = " + t.rhs + ". Use * for a bit that can be 0 or 1.", answers: [pat], keywords: [bitRe(pat)],
        distractors: wrongs(pat, (t.wrongs ? t.wrongs(pat) : []).concat([pat.replace(/\*/g, "0"), pat.replace(/\*/g, "1")])),
        example: exampleFor(pat, function () { var e = make(), es = B.solve(e.lhs, e.rhs, 5), ep = B.pattern(es); for (var k = 0; k < 50 && !ep; k++) { e = make(); es = B.solve(e.lhs, e.rhs, 5); ep = B.pattern(es); }
          return "Example: " + e.lhs + " = " + e.rhs + ".\n" + e.how(ep) + "\nSo x = " + ep + " (" + es.length + " value" + (es.length > 1 ? "s" : "") + ")."; }),
        working: nudges,
        note: "x = " + pat + ": " + (sols.length <= 8 ? sols.join(", ") : sols.length + " values") + "." };
    } };
  }
  var BINS = ["AND", "OR", "XOR"], PREC = { AND: 3, XOR: 2, OR: 1 };
  function twoOps() { var o1, o2; do { o1 = pick(BINS); o2 = pick(BINS); } while (PREC[o2] <= PREC[o1]); return [o1, o2]; }
  function un() { var o = pick(["NOT", "LSHIFT", "RSHIFT", "LCIRC", "RCIRC"]); return o === "NOT" ? "NOT" : o + "-" + rnd(1, 3); }
  return [
    // ------------------------------------------------ one operator
    { id: "o-not", category: "ops", format: "Type 5 bits", randomize: function () {
        var s = bits(5), ans = B.not(s);
        return { prompt: "What is NOT " + s + "?", answers: [ans], keywords: [bitRe(ans)], distractors: wrongs(ans, [s, s.split("").reverse().join(""), B.shift("LCIRC", 1, ans)]),
          example: exampleFor(ans, function () { var e = bits(5); return "Example: NOT " + e + ".\nStep 1: NOT works on one string, one bit at a time.\nStep 2: each 1 becomes 0 and each 0 becomes 1.\nSo NOT " + e + " = " + B.not(e) + "."; }),
          working: ["NOT works on each bit by itself.", "Each bit becomes the opposite bit."],
          note: "NOT flips every bit: " + s + " becomes " + ans + "." };
      } },
    binCard("o-and", "AND"),
    binCard("o-or", "OR"),
    binCard("o-xor", "XOR"),
    // ------------------------------------------------ shifts and circulates
    moveCard("m-lshift", "LSHIFT", 1, 3),
    moveCard("m-rshift", "RSHIFT", 1, 3),
    moveCard("m-lcirc", "LCIRC", 1, 4),
    moveCard("m-rcirc", "RCIRC", 1, 4),
    bigCircCard("m-big"),
    { id: "m-mod", category: "moves", format: "Type a number", randomize: function () {
        var op = pick(["LCIRC", "RCIRC"]), L = pick([5, 5, 6, 7]), n;
        do { n = rnd(L + 1, 4 * L + 3); } while (n % L === 0);
        var r = n % L;
        var wr = [];
        [r + 1, r - 1, L - r, Math.floor(n / L)].forEach(function (v) { if (v > 0 && v !== r && wr.indexOf(String(v)) < 0) wr.push(String(v)); });
        return { prompt: "A bit string has " + L + " bits. " + op + "-" + n + " gives the same answer as " + op + "-? Give the smallest number.", answers: [String(r)], keywords: [numRe(r)], distractors: wr.slice(0, 3),
          example: "Example: a string has 8 bits. What is RCIRC-19 the same as?\nStep 1: every 8 moves bring 8 bits back to the start.\nStep 2: 19 = 2 x 8 + 3.\nSo RCIRC-19 is the same as RCIRC-3.",
          working: ["How many moves bring every bit back to the start?", "Take that number away as many times as you can. What is left?"],
          note: n + " = " + Math.floor(n / L) + " x " + L + " + " + r + ", so " + op + "-" + n + " is the same as " + op + "-" + r + "." };
      } },
    // ------------------------------------------------ different lengths
    { id: "p-pad", category: "pad", format: "Type 5 bits", randomize: function () {
        var op = pick(BINS), a = bits(5), b = "1" + (rnd(0, 1) ? bits(2) : (Math.random() < 0.5 ? "0" : "1")), ans = B.binop(op, a, b), right = (b + "00000").slice(0, 5);
        return { prompt: "What is " + a + " " + op + " " + b + "?", answers: [ans], keywords: [bitRe(ans)], distractors: wrongs(ans, [B.binop(op, a, right)]),
          example: exampleFor(ans, function () { var e = bits(5), f = "1" + bits(2), o = pick(BINS); return "Example: " + e + " " + o + " " + f + ".\nStep 1: " + f + " is shorter, so pad it with zeros on the LEFT: " + B.pad(f, 5) + ".\nStep 2: " + RULE[o] + "\nSo the answer is " + B.binop(o, e, f) + "."; }),
          working: ["The two strings are different lengths. Where do the extra zeros go?", "Pad the shorter one with zeros on the left, then go column by column."],
          note: b + " is padded on the left to " + B.pad(b, 5) + ". Then " + a + " " + op + " " + B.pad(b, 5) + " = " + ans + "." };
      } },
    evalCard("p-keep", "pad", function () {
      var a = "1" + bits(rnd(2, 3)), n = rnd(1, 2), b = bits(5), op = pick(["OR", "XOR"]);
      return { src: "LSHIFT-" + n + " " + a + " " + op + " " + b, wrong: "LSHIFT-" + n + " " + B.pad(a, 5) + " " + op + " " + b };
    }, ["The shift works on the short string first. It keeps its own length.", "Only then pad the shift's answer with zeros on the left."]),
    // ------------------------------------------------ order of operators
    { id: "r-first", category: "prec", format: "Type the operator, like AND or LCIRC-2", randomize: function () {
        var src, tree, ready, names;
        for (var g = 0; g < 300; g++) {
          var ops = [pick(BINS), pick(BINS)], parts = [bits(5), bits(5), bits(5)];
          if (Math.random() < 0.6) { var k = rnd(0, 2); parts[k] = un() + " " + parts[k]; }
          src = parts[0] + " " + ops[0] + " " + parts[1] + " " + ops[1] + " " + parts[2];
          tree = B.parse(src); ready = B.ready(tree).map(B.opName);
          names = [];
          (function walk(n) { if (n.t === "bits") return; if (n.t === "bin") { walk(n.a); names.push(n.op); walk(n.b); } else { names.push(B.opName(n)); walk(n.a); } })(tree);
          var unique = names.filter(function (x, i) { return names.indexOf(x) === i; });
          if (ready.length === 1 && names[0] !== ready[0] && unique.length === names.length) break;
        }
        var ans = ready[0], wr = names.filter(function (x) { return x !== ans; });
        ["OR", "XOR", "AND"].forEach(function (x) { if (wr.length < 3 && wr.indexOf(x) < 0 && x !== ans) wr.push(x); });
        return { prompt: "Which operator is worked first in " + src + "?", answers: [ans], keywords: [opRe(ans)], distractors: wr.slice(0, 3),
          example: "Example: 10110 XOR 01011 OR NOT 11001.\nStep 1: the order is NOT, then shifts and circulates, then AND, then XOR, then OR.\nStep 2: the highest here is NOT, so NOT goes first, even though it is not on the left.",
          working: ["Do not just start on the left.", "Order: NOT, then SHIFT and CIRC, then AND, then XOR, then OR."],
          note: ans + " is highest in the order here, so it goes first." };
      } },
    evalCard("r-two", "prec", function () {
      var o = twoOps(), a = bits(5), b = bits(5), c = bits(5);
      return { src: a + " " + o[0] + " " + b + " " + o[1] + " " + c, wrong: "(" + a + " " + o[0] + " " + b + ") " + o[1] + " " + c };
    }, ["Do not just work left to right.", "AND goes before XOR, and XOR goes before OR."]),
    evalCard("r-unary", "prec", function () {
      var o = twoOps(), a = bits(5), b = bits(5), c = bits(5), u = un();
      var parts = [a, b, c], k = rnd(0, 2);
      parts[k] = u + " " + parts[k];
      return { src: parts[0] + " " + o[0] + " " + parts[1] + " " + o[1] + " " + parts[2], wrong: "(" + parts[0] + " " + o[0] + " " + parts[1] + ") " + o[1] + " " + parts[2] };
    }, ["NOT, shifts and circulates go first, on the bits right next to them.", "Then AND, then XOR, then OR."]),
    evalCard("r-chain", "prec", function () {
      var s = bits(5), n = rnd(1, 2), sh = pick(["LSHIFT", "RSHIFT"]), first = Math.random() < 0.5;
      return first ? { src: "NOT " + sh + "-" + n + " " + s, wrong: sh + "-" + n + " NOT " + s } : { src: sh + "-" + n + " NOT " + s, wrong: "NOT " + sh + "-" + n + " " + s };
    }, ["Two operators sit in front of the bits. Which one is right next to the bits?", "Work right to left: the one next to the bits goes first."]),
    evalCard("r-brackets", "prec", function () {
      var o = twoOps(), a = bits(5), b = bits(5), c = bits(5), u = pick(["NOT", "LCIRC-" + rnd(1, 4), "RSHIFT-" + rnd(1, 2)]);
      return { src: u + " (" + a + " " + o[0] + " " + b + ") " + o[1] + " " + c, wrong: u + " " + a + " " + o[0] + " " + b + " " + o[1] + " " + c };
    }, ["Brackets first, even before NOT and the shifts.", "Then the operator in front of the bracket, then the rest in the order."]),
    // ------------------------------------------------ solving for x
    solveCard("s-and", function () {
      var m = bits(5), x0 = bits(5);
      return { lhs: "x AND " + m, rhs: B.binop("AND", x0, m), stars: true,
        how: function (p) { return "Step 1: where the mask has a 1, x must equal the answer bit.\nStep 2: where the mask has a 0, AND always gives 0, so x can be anything: *."; },
        wrongs: function (p) { return [B.binop("AND", x0, m)]; } };
    }, ["Go column by column. Where the mask has a 0, does x matter?", "Under a 1 in the mask, x must equal the answer bit. Under a 0, x is *."]),
    solveCard("s-or", function () {
      var m = bits(5), x0 = bits(5);
      return { lhs: "x OR " + m, rhs: B.binop("OR", x0, m), stars: true,
        how: function (p) { return "Step 1: where the mask has a 0, x must equal the answer bit.\nStep 2: where the mask has a 1, OR always gives 1, so x can be anything: *."; } };
    }, ["Go column by column. Where the mask has a 1, does x matter?", "Under a 0 in the mask, x must equal the answer bit. Under a 1, x is *."]),
    solveCard("s-circ", function () {
      var m = bits(5), x0 = bits(5), k = rnd(1, 3), op = pick(["LCIRC", "RCIRC"]), b = pick(["AND", "OR"]);
      var undo = op === "LCIRC" ? "RCIRC" : "LCIRC";
      return { lhs: "(" + op + "-" + k + " x) " + b + " " + m, rhs: B.binop(b, B.shift(op, k, x0), m), stars: true,
        how: function (p) { return "Step 1: call the bracket y. Solve y " + b + " " + m + " column by column: y = " + B.shift(op, k, p) + ".\nStep 2: undo " + op + "-" + k + " with " + undo + "-" + k + ". The stars move with the bits."; },
        wrongs: function (p) { return [B.shift(op, k, p), B.shift(op, 2 * k, p)]; } };
    }, ["Work from the outside in. First find what the whole bracket must be.", "Then undo the circulate: move the pattern back the other way, stars and all."]),
    solveCard("s-shift", function () {
      var m = bits(5), x0 = bits(5), k = rnd(1, 2), op = pick(["LSHIFT", "RSHIFT"]);
      return { lhs: "(" + op + "-" + k + " x) OR " + m, rhs: B.binop("OR", B.shift(op, k, x0), m), stars: true,
        how: function (p) { return "Step 1: the bits of x that " + op + "-" + k + " pushes off can be anything: they never reach the answer.\nStep 2: for the other bits, line each one up with where it lands, and solve column by column."; },
        wrongs: function (p) { return [B.shift(op, k, p)]; } };
    }, ["Some bits of x fall off in the shift. Can they change the answer?", "Bits that fall off are *. Match every other bit with the place it moves to."]),
    { id: "s-xor", category: "solve", format: "Type 5 bits", randomize: function () {
        var m = bits(5), x0 = bits(5), r = B.binop("XOR", x0, m);
        while (r === m || x0 === r) { x0 = bits(5); r = B.binop("XOR", x0, m); }
        return { prompt: "x has 5 bits. Find x with x XOR " + m + " = " + r + ".", answers: [x0], keywords: [bitRe(x0)], distractors: wrongs(x0, [B.not(x0), B.binop("AND", m, r), B.binop("OR", m, r)]),
          example: exampleFor(x0, function () { var e = bits(5), y = bits(5), er = B.binop("XOR", y, e); return "Example: x XOR " + e + " = " + er + ".\nStep 1: XOR gives 1 where the bits are different.\nStep 2: so x is 1 where the mask and the answer are different: x = " + e + " XOR " + er + ".\nSo x = " + y + "."; }),
          working: ["XOR gives 1 where the two bits are different.", "Column by column: is x the same as the mask bit, or different from it?"],
          note: "x = " + m + " XOR " + r + " = " + x0 + ". XOR undoes itself." };
      } },
    { id: "s-count", category: "solve", format: "Type a number", randomize: function () {
        var m, x0, sols, pat;
        do { m = bits(5); x0 = bits(5); sols = B.solve("x AND " + m, B.binop("AND", x0, m), 5); } while (sols.length < 2);
        pat = B.pattern(sols);
        var n = sols.length, stars = pat.split("*").length - 1, wr = [];
        [stars, n * 2, n / 2, 32 - n].forEach(function (v) { if (v >= 1 && v !== n && wr.indexOf(String(v)) < 0) wr.push(String(v)); });
        return { prompt: "x has 5 bits. How many values of x make x AND " + m + " = " + B.binop("AND", x0, m) + " true?", answers: [String(n)], keywords: [numRe(n)], distractors: wr.slice(0, 3),
          example: "Example: x AND 11001 = 01000.\nStep 1: solve it: x = 01**0.\nStep 2: each * can be 0 or 1. Two stars give 2 x 2 = 4 values.\nSo 4 values of x work.",
          working: ["Find the pattern first, using * for any bit.", "Each * can be 0 or 1, so each * doubles the count."],
          note: "x = " + pat + ". " + stars + " star" + (stars > 1 ? "s" : "") + ", so " + n + " values." };
      } }
  ];
}

// ---- The Do Now Extension: 5-bit binary and single-bit AND, OR and NOT (from Years 7 to 9). Nothing from this lesson.
function extCards() {
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(l) { return l[Math.floor(Math.random() * l.length)]; }
  function b5(n) { return ("00000" + n.toString(2)).slice(-5); }
  function numRe(n) { return new RegExp("^\\s*" + n + "\\s*\\.?\\s*$", "i"); }
  function bitRe(s) { return new RegExp("^\\s*" + s.split("").join("\\s*") + "\\s*\\.?\\s*$", "i"); }
  function nums(ans, list) { var out = []; list.forEach(function (v) { v = String(v); if (v !== String(ans) && Number(v) >= 0 && out.indexOf(v) < 0) out.push(v); }); return out.slice(0, 3); }
  function bitList(ans, list) { var out = []; list.forEach(function (v) { if (v !== ans && v.length === ans.length && out.indexOf(v) < 0) out.push(v); }); return out.slice(0, 3); }
  function pv(s) { var p = [16, 8, 4, 2, 1], t = []; s.split("").forEach(function (b, i) { if (b === "1") t.push(p[i]); }); return t; }
  var AND = function (a, b) { return a & b; }, OR = function (a, b) { return a | b; };
  return [
    { id: "x-01", category: "bin", format: "Type a number", randomize: function () {
        var n = pick([9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 25, 26, 27, 28, 29, 30]), s = b5(n);
        return { prompt: "What is " + s + " in denary?", answers: [String(n)], keywords: [numRe(n)], distractors: nums(n, [n + 1, n - 1, parseInt(s.split("").reverse().join(""), 2), n + 16 > 31 ? n - 8 : n + 16]),
          example: "Example: 10101.\nStep 1: write the place values 16, 8, 4, 2, 1 above the bits.\nStep 2: add the place values that have a 1: 16 + 4 + 1.\nSo 10101 is 21.",
          working: ["Write the place values above the bits: one on the right, doubling to the left.", "Add only the place values that have a one under them."],
          note: s + " = " + pv(s).join(" + ") + " = " + n + "." };
      } },
    { id: "x-02", category: "bin", format: "Type 5 bits", randomize: function () {
        var n = pick([17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]), s = b5(n);
        return { prompt: "Write " + n + " as a 5-bit binary number.", answers: [s], keywords: [bitRe(s)], distractors: bitList(s, [b5(n - 1), b5(n + 1), s.split("").reverse().join(""), b5(n ^ 2)]),
          example: "Example: 19.\nStep 1: 16 fits: write 1, 3 is left.\nStep 2: 8 and 4 do not fit: write 0, 0. 2 fits: write 1, 1 is left. 1 fits: write 1.\nSo 19 is 10011.",
          working: ["Start at 16. Does it fit? Write 1 and take it away, or write 0.", "Then try 8, 4, 2 and 1 the same way."],
          note: n + " = " + pv(s).join(" + ") + ", so " + s + "." };
      } },
    { id: "x-03", category: "bin", format: "Type 5 bits", randomize: function () {
        var n = pick([1, 2, 3, 4, 5, 7]), s = b5(n);
        return { prompt: "Write " + n + " as a 5-bit binary number. Keep all 5 bits.", answers: [s], keywords: [bitRe(s)], distractors: bitList(s, [(n.toString(2) + "00000").slice(0, 5), b5(n + 1), b5(n * 2)]),
          example: "Example: 6.\nStep 1: 16 and 8 do not fit: write 0, 0.\nStep 2: 4 fits, 2 fits, 1 does not: write 1, 1, 0.\nSo 6 is 00110: the zeros on the left keep it 5 bits long.",
          working: ["Small numbers still need all 5 places.", "The empty places on the LEFT are zeros."],
          note: n + " needs only a few bits, so zeros fill the left: " + s + "." };
      } },
    { id: "x-04", category: "bin", format: "Type a number", randomize: function () {
        var i = rnd(0, 4), pvs = [16, 8, 4, 2, 1], ans = pvs[i], names = ["first", "second", "third", "fourth", "fifth"];
        return { prompt: "In a 5-bit binary number, what is the place value of the " + names[i] + " bit from the left?", answers: [String(ans)], keywords: [numRe(ans)], distractors: nums(ans, [pvs[4 - i], ans * 2, ans === 1 ? 3 : ans / 2]),
          example: "Example: in a 4-bit number, the place values from the left are 8, 4, 2, 1.\nSo the second bit from the left is worth 4.",
          working: ["Start on the right with one. Each place to the left doubles.", "Write all five place values, then count from the left."],
          note: "The place values from the left are 16, 8, 4, 2, 1." };
      } },
    { id: "x-05", category: "bin", format: "Type a number", randomize: function () {
        var L = pick([3, 4, 6, 7]), ans = Math.pow(2, L) - 1;
        return { prompt: "What is the largest number that " + L + " bits can hold?", answers: [String(ans)], keywords: [numRe(ans)], distractors: nums(ans, [ans + 1, Math.pow(2, L - 1), L * 2]),
          example: "Example: 5 bits.\nStep 1: the largest uses every bit: 11111.\nStep 2: 16 + 8 + 4 + 2 + 1 = 31.\nSo 5 bits can hold up to 31.",
          working: ["The largest number has every bit set to one.", "Add up all the place values."],
          note: L + " bits all set to 1 is " + ans + "." };
      } },
    { id: "x-06", category: "logic", format: "Type 1 or 0", randomize: function () {
        var a = rnd(0, 1), b = rnd(0, 1), ans = AND(a, b);
        return { prompt: "A = " + a + " and B = " + b + ". What is A AND B?", answers: [String(ans)], keywords: [numRe(ans)], distractors: [String(1 - ans)],
          example: "Example: P = 1 and Q = 1.\nStep 1: AND needs both bits to be on.\nStep 2: P is on and Q is on.\nSo P AND Q = 1.",
          working: ["AND needs both bits to be on.", "Is A on? Is B on? Are both on?"],
          note: "AND gives 1 only when both are 1." };
      } },
    { id: "x-07", category: "logic", format: "Type 1 or 0", randomize: function () {
        var a = rnd(0, 1), b = rnd(0, 1), ans = OR(a, b);
        return { prompt: "A = " + a + " and B = " + b + ". What is A OR B?", answers: [String(ans)], keywords: [numRe(ans)], distractors: [String(1 - ans)],
          example: "Example: P = 0 and Q = 0.\nStep 1: OR needs at least one bit to be on.\nStep 2: neither P nor Q is on.\nSo P OR Q = 0.",
          working: ["OR needs at least one bit to be on.", "Is A on? Is B on? Is either one on?"],
          note: "OR gives 1 when at least one is 1." };
      } },
    { id: "x-08", category: "logic", format: "Type 1 or 0", randomize: function () {
        var a = rnd(0, 1), b = rnd(0, 1), c = rnd(0, 1), op = pick(["AND", "OR"]), inner = op === "AND" ? AND(a, b) : OR(a, b), ans = 1 - inner;
        return { prompt: "A = " + a + ", B = " + b + ". What is NOT (A " + op + " B)?", answers: [String(ans)], keywords: [numRe(ans)], distractors: [String(1 - ans)],
          example: "Example: P = 1, Q = 0. NOT (P OR Q).\nStep 1: brackets first. P OR Q: P is on, so it is 1.\nStep 2: NOT gives the opposite bit.\nSo NOT (P OR Q) = 0.",
          working: ["Work out the brackets first.", "Then NOT gives the opposite bit."],
          note: "A " + op + " B = " + inner + ", and NOT " + inner + " = " + ans + "." };
      } },
    { id: "x-09", category: "logic", format: "Type 1 or 0", randomize: function () {
        var a = rnd(0, 1), b = rnd(0, 1), c = rnd(0, 1), ans = OR(AND(a, b), c);
        return { prompt: "A = " + a + ", B = " + b + ", C = " + c + ". What is (A AND B) OR C?", answers: [String(ans)], keywords: [numRe(ans)], distractors: [String(1 - ans)],
          example: "Example: P = 0, Q = 1, R = 0. (P AND Q) OR R.\nStep 1: brackets first. P AND Q: P is off, so it is 0.\nStep 2: then 0 OR R: R is off too.\nSo the answer is 0.",
          working: ["Work out the brackets first.", "Then use OR with C."],
          note: "A AND B = " + AND(a, b) + ", then " + AND(a, b) + " OR " + c + " = " + ans + "." };
      } },
    { id: "x-10", category: "bin", format: "Type the bits", randomize: function () {
        var a, b; do { a = rnd(3, 30); b = rnd(3, 30); } while (b === a || a === 17 || b === 17);
        var sa = b5(a), sb = b5(b), ans = a > b ? sa : sb;
        return { prompt: "Which is bigger: " + sa + " or " + sb + "?", answers: [ans], keywords: [bitRe(ans)], distractors: [ans === sa ? sb : sa],
          example: "Example: 01110 or 10001?\nStep 1: compare the bits from the left. The first place where they differ decides.\nStep 2: the first bit: 0 against 1. The 16 is only in 10001.\nSo 10001 is bigger, even though it has fewer 1s.",
          working: ["Compare from the left: the first place where the bits differ decides.", "Or change both to denary and compare."],
          note: sa + " is " + a + " and " + sb + " is " + b + "." };
      } }
  ];
}

const topicSrc = drillHead(ID, 'Topic drill and plenary: single operators, shifts and circulates (big counts too), different lengths, the order of operators, and solving for x with *. Every answer comes from BitCore.') +
  `DrillData.register(${JSON.stringify(ID)}, {\n  title: "ACSL: Bit-String Flicking",\n  subtitle: "NOT, AND, OR, XOR, shifts, circulates, the order and solving for x",\n  categories: ${catsSrc([
    ['ops', 'NOT, AND, OR, XOR'], ['moves', 'Shifts and circulates'], ['pad', 'Different lengths'], ['prec', 'The order of operators'], ['solve', 'Solve for x']])},\n` +
  `  cards: (function () {\n${CORE}\n  return (${topicCards.toString()})(BitCore);\n  })()\n});\n`;
const extSrc = drillHead(ID + '-ext', 'Do Now Extension: 5-bit binary and single-bit AND, OR and NOT. Every card has a worked example and two nudges.') +
  `DrillData.register(${JSON.stringify(ID + '-ext')}, {\n  title: "ACSL Bits: Do Now Challenge",\n  subtitle: "5-bit binary, and AND, OR and NOT on single bits",\n  categories: ${catsSrc([['bin', '5-bit binary'], ['logic', 'AND, OR and NOT']])},\n` +
  `  cards: (${extCards.toString()})()\n});\n`;
const DRILLS = [[ID, topicSrc], [ID + '-ext', extSrc]];
for (const [id, src] of DRILLS) {
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times: its answer passes, no distractor passes, no example or nudge gives the answer away,
// and every bit answer agrees with an independent check.
{
  const vm = await import('node:vm');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, DrillData: { register: (k, d) => { ctx.out = d; } } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids unique`);
    for (const c of d.cards) {
      for (let n = 0; n < 500; n++) {
        const r = c.randomize ? { ...c, ...c.randomize() } : c;
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans), `${id} ${c.id}: own answer "${ans}" fails`);
        [ans.toLowerCase(), ans + '.', ' ' + ans + ' '].concat(/^[01*]{3,}$/.test(ans) && !/number/i.test(r.format || '') ? [ans.split('').join(' ')].concat(id === ID ? ['x = ' + ans] : []) : []).forEach((v) => assert(pass(v), `${id} ${c.id}: variant "${v}" fails`));
        (r.distractors || []).forEach((x) => assert(!pass(x), `${id} ${c.id}: distractor "${x}" passes`));
        assert((r.distractors || []).length >= 1 && new Set(r.distractors).size === r.distractors.length, `${id} ${c.id}: distractors ${r.distractors}`);
        if (/^[01*]{3,}$/.test(ans) && !/number/i.test(r.format || '')) assert(r.distractors.every((x) => x.length === ans.length), `${id} ${c.id}: distractor length tell`);
        const whole = new RegExp('(^|[^a-z0-9])' + esc(ans.toLowerCase()) + '($|[^a-z0-9])');
        if (r.example && ans.length >= 3) assert(!whole.test(r.example.toLowerCase()) || whole.test(r.prompt.toLowerCase()), `${id} ${c.id}: example contains "${ans}": ${r.example}`);
        const pat = new RegExp('(^|[^\\w.-])' + esc(ans.trim()) + '(?!\\w|\\.\\d)', 'i');
        if (!pat.test(r.prompt)) r.working.forEach((w) => assert(!pat.test(w), `${id} ${c.id}: working shows "${ans}": ${w}`));
        assert(r.example && r.working && r.working.length === 2, `${id} ${c.id}: example and two nudges`);
        // Independent check of the topic drill: brute force from the prompt itself.
        if (id === ID) {
          let m;
          if ((m = /^What is (.+)\?$/.exec(r.prompt)) || (m = /^On 5 bits, what is (.+)\?$/.exec(r.prompt))) assert(B.evaluate(m[1]) === ans, `${c.id}: ${m[1]} is not ${ans}`);
          if ((m = /Find every x with (.+) = ([01]+)\./.exec(r.prompt))) {
            const sols = B.solve(m[1], m[2], 5);
            assert(B.expand(ans).join() === sols.join(), `${c.id}: pattern ${ans} does not match ${sols}`);
          }
          if ((m = /Find x with (.+) = ([01]+)\./.exec(r.prompt))) assert(B.solve(m[1], m[2], 5).join() === ans, `${c.id}: x`);
          if ((m = /Which operator is worked first in (.+)\?$/.exec(r.prompt))) assert(B.ready(B.parse(m[1])).map(B.opName).join() === ans, `${c.id}: first`);
        }
      }
    }
    console.log(`${id}: ${d.cards.length} cards`);
  }
}

assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps)), 'dash found');
const lesson = { id: ID, label: 'ACSL Contest 2: Bit-String Flicking', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets`);
