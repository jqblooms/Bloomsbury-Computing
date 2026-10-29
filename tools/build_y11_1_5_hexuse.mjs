// Builds LessonData/y11-1-5-hexuse.json: Year 11, 1.5: Why Hexadecimal Is Used (syllabus 0478 1.1: why hexadecimal
// is used, and where: MAC addresses, colour codes, error codes and more). The fifth lesson of the 2026-27 Year 11 plan,
// after y11-1-4-hexconv.
//   node tools/build_y11_1_5_hexuse.mjs
// It also writes the plenary drill y11-1-5-hexuse and adds the lesson to Year 11's "1.1 Number Systems" unit, straight
// after y11-1-4-hexconv. The Do Now Extension reuses the 1.4 plenary drill (y11-1-4-hexconv: the topic so far).
// Core idea: the computer always stores binary; hexadecimal is only how binary is SHOWN to people, because it is shorter.
// Real questions, each answer checked against its mark scheme in Desktop\0478 Past Papers\extract:
//   Do Now:   0478/12 June 2023 Q2(d) (301 = 12D); 0478/12 March 2024 Q8(a)(i) (236 = EC);
//             0478/12 June 2022 Q2(a) (2F, 15, D6 to 8-bit binary)
//   Exam:     0478/11 June 2024 Q2(a) (statement C is incorrect); 0478/12 June 2021 Q1(b) and (c);
//             0478/12 June 2023 Q2(c); 0478/12 November 2021 Q1(d)(i) and (ii); 0478/11 November 2022 Q3(a) and (e);
//             0478/13 June 2024 Q3(c) and (d); 0478/12 June 2022 Q2(b)
// Written parts are self-marked-response items with the real mark scheme points as `scheme` and its rules as
// `guidance`, so they are AI-marked (Marking.gs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-5-hexuse';
const P = 'y11-15h';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }

// ---------------------------------------------------------------- number work
const val = (b) => [...b].reduce((t, c) => t * 2 + (c === '1' ? 1 : 0), 0);
const hv = (h) => parseInt(h, 16);
const toHex = (n) => n.toString(16).toUpperCase();
const nib = (d) => hv(d).toString(2).padStart(4, '0');
const h2b = (h) => [...h].map(nib).join('');
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
const HEX_TAIL = '(\\s*(in\\s+)?(hexadecimal|base\\s*16))?\\s*\\.?\\s*$';
const hexAns = (h) => '^\\s*(=\\s*)?(?:0\\s*)*' + [...h.replace(/^0+(?=.)/, '')].join('\\s*') + HEX_TAIL;
const BIN_TAIL = '(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$';
const binFull = (b) => `^\\s*${[...b].join('\\s*')}${BIN_TAIL}`;
const num = (n) => `^\\s*(=\\s*)?0*${n}(\\s*(in\\s+)?(denary|base\\s*10))?\\s*\\.?\\s*$`;

// ---------------------------------------------------------------- pictures
const MONO = 'font-family:var(--font-mono, monospace)';
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
function nibTable(bits) {
  const groups = []; for (let i = 0; i < bits.length; i += 4) groups.push(bits.slice(i, i + 4));
  const th = TH(34, 14);
  const cell = (t) => `<td style="padding:5px 3px;min-width:34px;text-align:center;font:700 20px var(--font-mono, monospace);border:1px solid var(--line-strong)${t === '0' ? ';color:var(--muted-2)' : ''}">${t}</td>`;
  const gap = '<td style="width:14px;border:0"></td>';
  const head = groups.map(() => [8, 4, 2, 1].map((p) => `<th style="${th}">${p}</th>`).join('')).join(gap);
  const body = groups.map((g) => [...g].map(cell).join('')).join(gap);
  const dig = groups.map((g) => `<td colspan="4" style="padding:5px;text-align:center;font:700 24px var(--font-mono, monospace);border:1px solid var(--line-strong)${HL}">${toHex(val(g))}</td>`).join(gap);
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${head}</tr><tr>${body}</tr><tr>${dig}</tr></table>`;
}
const big = (t) => `<div style="text-align:center;${MONO};font-size:34px;font-weight:700;letter-spacing:4px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const box = (t) => `<div style="display:grid;gap:6px;padding:10px 12px;border-radius:10px;background:var(--surface-2)">${t}</div>`;
const boxTitle = (t) => `<div style="font-weight:700;font-size:17px">${t}</div>`;
const boxLine = (t) => `<div style="font-size:16px">${t}</div>`;
const monoLine = (t, size = 22) => `<div style="text-align:center;${MONO};font-size:${size}px;font-weight:700;word-break:break-word">${t}</div>`;
const swatch = (hex) => `<div style="display:flex;align-items:center;gap:10px;justify-content:center"><span style="display:inline-block;width:46px;height:46px;border-radius:8px;border:1px solid var(--line-strong);background:#${hex}"></span>` +
  `<span style="${MONO};font-size:26px;font-weight:700">#${hex}</span></div>`;

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, heading, lead, parts, whyQ, extra = '', grid = 0) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => Object.assign({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }, p.marks > 1 ? { marks: p.marks } : {}));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    const lab = parts.length > 1 ? `(${s}) ${p.label}` : p.label;
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${lab} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const gridStyle = grid ? ` style="display:grid;grid-template-columns:repeat(${grid}, minmax(0, 1fr));column-gap:28px"` : '';
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses"${gridStyle}>${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${cid}"></div>`, items };
}
// A written exam part, AI-marked against the real mark scheme points.
function written(id, label, lead, items, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'self-marked-response', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p><div id="${cid}"></div>`, items };
}
function embed(id, label, appId, lead, whyQ) {
  return { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the worked answer') + body };
}
function clickMatch(id, label, lead, pairs, whyQ) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'click-match', containerId: cid, items: pairs.map((p) => ({ id: p[0], left: p[1], right: p[2] })),
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` +
      `<div class="icontrol-match" id="${cid}"><svg class="icontrol-match-svg" aria-hidden="true"><defs><marker id="icontrol-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"></path></marker></defs></svg>` +
      `<div class="icontrol-match-col click-match-left"></div><div class="icontrol-match-col click-match-right"></div></div><div class="icontrol-match-status" id="${cid}-status" role="status" aria-live="polite"></div>` };
}
const steps = [];

// ---------------------------------------------------------------- Do Now 1 (1.4): denary to hexadecimal
// Mark schemes: 0478/12 June 2023 Q2(d) 12D; 0478/12 March 2024 Q8(a)(i) EC.
const D2H_FB = 'Divide by 16. The whole number is the left digit, the remainder is the right digit. Whole number more than 15? Divide again.';
const WT_DN1 = { title: 'Walk me through it: denary to hexadecimal', steps: [
  { text: '<strong>A similar question.</strong> Convert the denary number 180 to hexadecimal.', visual: big('180') },
  { text: 'Divide by 16: 180 &divide; 16 = 11 remainder 4. 11 sixteens, 4 left over.', visual: line(kw('180 &divide; 16 = 11 remainder 4')) },
  { text: 'The whole number, 11, is the left digit. 11 is one digit: B. The remainder 4 is the right digit.', visual: line('11 = B, 4 = 4') },
  { text: 'So 180 is <strong>B4</strong>. Check: 11 &times; 16 + 4 = 180.', visual: big('B4') },
  { text: 'A bigger number: 330 &divide; 16 = 20 remainder 10. 20 is more than 15, so divide 20 by 16 again: 1 remainder 4.', visual: line(kw('20 &divide; 16 = 1 remainder 4')) },
  { text: 'Read the digits: 1, then 4, then the first remainder 10 = A. So 330 is <strong>14A</strong>. Check: 256 + 64 + 10 = 330.', visual: big('14A') },
  { text: 'Now do the same for the question: divide by 16, keep each remainder, and change 10 to 15 into A to F.', visual: note('divide &rarr; remainder &rarr; A to F &rarr; check') },
] };
assert(toHex(180) === 'B4' && toHex(330) === '14A' && toHex(301) === '12D' && toHex(236) === 'EC', 'Do Now 1 values');
steps.push(checkStep('do-now', 'Do Now: Denary to Hexadecimal (1 of 2)', 'Do Now: Denary to Hexadecimal (1 of 2)',
  'Recap of 1.4 Hexadecimal Conversions. (a) ' + cite('0478/12, March 2024, Question 8(a)(i)') + ' (b) ' + cite('0478/12, June 2023, Question 2(d)') + ' Convert each denary number to hexadecimal.', [
    { label: '236', answer: hexAns('EC'), feedback: D2H_FB },
    { label: '301', answer: hexAns('12D'), feedback: D2H_FB, marks: 2 },
  ], ['Why does a remainder of 13 become one letter?', 'One column can hold only one digit, so 13 is written as D.'], '', 2));
steps[steps.length - 1].walkthrough = WT_DN1;

// ---------------------------------------------------------------- Do Now 2 (1.4): 0478/12 June 2022 Q2(a)
// Mark scheme: 2F 0010 1111; 15 0001 0101; D6 1101 0110 (a mark for each nibble).
const DN2 = ['2F', '15', 'D6'];
const WT_DN2 = { title: 'Walk me through it: hexadecimal to binary', steps: [
  { text: '<strong>A similar question.</strong> Give the 8-bit binary value for the hexadecimal pair 9C.', visual: big('9C') },
  { text: 'Each hexadecimal digit becomes 4 bits, with place values 8, 4, 2, 1.', visual: note('1 digit &rarr; 4 bits') },
  { text: '9 = 8 + 1, so 9 is 1001.', visual: line(kw('9 = 8 + 1 = 1001')) },
  { text: 'C = 12 = 8 + 4, so C is 1100.', visual: line(kw('C = 12 = 8 + 4 = 1100')) },
  { text: 'Put the nibbles side by side in the same order: <strong>1001 1100</strong>.', visual: nibTable(h2b('9C')) },
  { text: 'A small digit still needs 4 bits: 3 is 0011, never 11.', visual: line('3 = 0011') },
  { text: 'Now do the same for each pair: each digit, 4 bits, in order.', visual: note('digit &rarr; 8 4 2 1 &rarr; side by side') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Colour Code to Binary (2 of 2)', 'Do Now: Colour Code to Binary (2 of 2)',
  'Recap of 1.4. ' + cite('0478/12, June 2022, Question 2(a)') + ' Hexadecimal is used for HTML colour codes. An HTML colour code is #2F15D6. Each pair of digits is stored as binary in an 8-bit register. Give the 8-bit binary value that would be stored for each pair of hexadecimal digits.',
  DN2.map((h) => ({ label: h, answer: binFull(h2b(h)), marks: 2, feedback: 'Write every digit as 4 bits (8, 4, 2, 1), even 1. Keep the digits in order.' })),
  ['Why is the colour stored in binary, when the code is written in hexadecimal?', 'The computer can only store and process binary. The hexadecimal code is for the person writing it.'], swatch('2F15D6'), 3));
steps[steps.length - 1].walkthrough = WT_DN2;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y11-1-4-hexconv',
  '<strong>Extension:</strong> finished the Do Now? Try these conversions. Stuck? Switch on <strong>I need help</strong>.',
  ['Why does each card use new numbers?', 'Then you practise the method, not one answer.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Why Hexadecimal Is Used',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">1.1 Number Systems</p><h2 class="lesson-h2">Why Hexadecimal Is Used</h2><p>Year 11</p></div>' +
    facts(['<strong>Today:</strong> why people write binary as <strong>hexadecimal</strong>.', 'Where hexadecimal is used: MAC addresses, colour codes, error codes and more.', 'How to write the reasons so they earn the marks.']) +
    why('If the computer works in binary, why would anyone write numbers in another system?', 'People find long binary numbers hard to read, so they write them in a shorter way.') });

// ---------------------------------------------------------------- the computer stores binary
const MAC = '00:1A:2B:3C:4D:5E';
const MACBIN = MAC.split(':').map((p) => spaced(h2b(p))).join('  ');
steps.push(concept('concept-binary', 'The Computer Only Stores Binary',
  'A computer stores the colour #2F15D6. Predict: what is really inside the computer, and who is the hexadecimal for?',
  '<p>Inside the computer it is only binary: 24 bits. The hexadecimal #2F15D6 is how it is <strong>shown</strong> to a person.</p>',
  columns(facts(['The computer <strong>always</strong> stores and processes <strong>binary</strong>.', 'Hexadecimal is how binary is <strong>shown to people</strong>.',
    'One digit = 4 bits, so hexadecimal is <strong>4 times shorter</strong>.', 'It does <strong>not</strong> save memory, make files smaller or make the computer faster.']),
    '<div style="display:grid;gap:8px">' + box(boxTitle('What the computer stores (24 bits)') + monoLine(spaced(h2b('2F15D6')), 18)) +
    box(boxTitle('What a person reads (6 digits)') + monoLine('2F15D6')) + '</div>')));

steps.push(mcStep('predict-memory', 'Predict: Does Hexadecimal Save Memory?', '', [
  { prompt: 'A memory address is shown as A2F instead of 101000101111. How much memory does the address take up inside the computer?', options: ['Less, because A2F has fewer digits', 'The same: it is still stored as 12 bits', 'More, because letters take more space'], correct: 1,
    explain: 'The computer stores the same 12 bits either way. A2F is only a shorter way to show them to a person.' },
  { prompt: 'Which statement about hexadecimal is true?', options: ['The CPU processes hexadecimal faster than binary', 'Hexadecimal makes a file smaller', 'Hexadecimal is easier for people to read than binary'], correct: 2,
    explain: 'The computer only uses binary, so hexadecimal cannot change speed or file size. It helps the person reading the number.' },
], ['Why can a different way of writing a number not change how much memory it uses?', 'The computer stores the bits, not the way we write them. The same bits use the same memory.']));

// ---------------------------------------------------------------- why shorter helps: copy a MAC address
const SLIP = (() => { const b = h2b('3C4D'); return b.slice(0, 9) + (b[9] === '1' ? '0' : '1') + b.slice(10); })();
steps.push(concept('compare-copy', 'Compare: Which Is Easier to Copy?',
  'Ana copies a value in binary. Sam copies the same value in hexadecimal. Each makes one slip. Predict: whose slip is easier to spot, and why?',
  '<p>Sam\'s. His value is only 4 digits, so one wrong digit stands out. Ana\'s is 16 bits of 1s and 0s that all look alike.</p>',
  facts(['Fewer digits = <strong>quicker</strong> to read, write and type.', 'Fewer digits = <strong>less chance of a mistake</strong>.', 'A mistake is <strong>easier to spot</strong>, so debugging is easier.', 'It takes up <strong>less space on the screen</strong>.']) +
  columns(box(boxTitle('Ana (binary)') + boxLine('Value:') + monoLine(spaced(h2b('3C4D')), 18) + boxLine('Ana wrote:') + monoLine(spaced(SLIP), 18) + boxLine('Can you see the slip?')),
    box(boxTitle('Sam (hexadecimal)') + boxLine('Value:') + monoLine('3C4D') + boxLine('Sam wrote:') + monoLine('3C4B') + boxLine('The last digit is wrong.')))));

// 0478/11 June 2024 Q2(a). Mark scheme: C.
steps.push(mcStep('exam-1', 'Exam Question: Which Statement Is Incorrect?',
  cite('0478/11, June 2024, Question 2(a)') + ' Hypertext markup language (HTML) colour codes can be represented as hexadecimal. Tick one box to show which statement about the hexadecimal number system is <strong>incorrect</strong>.', [
    { prompt: 'Which statement about the hexadecimal number system is incorrect?', options: ['It uses the values 0 to 9 and A to F.', 'It can be used as a shorter representation of binary.', 'It is a base 10 system.', 'It can be used to represent error codes.'], correct: 2,
      explain: 'Hexadecimal is base 16. Denary is the base 10 system.' },
  ], ['Why is hexadecimal called base 16?', 'It has 16 digits, 0 to 9 and A to F, and each column is worth 16 times the one to its right.']));

// 0478/12 June 2021 Q1(b). Mark scheme: any two from easier/quicker to read/write/understand; easier/quicker to
// identify errors/debug; takes up less screen/display space; less chance of making an error.
const REASONS = ['Easier or quicker to read, write or understand', 'Easier or quicker to identify errors or debug', 'Takes up less screen or display space', 'Less chance of making an error', 'It is a shorter representation of binary'];
const REASON_GUIDE = 'Any two from the list, one mark each. Two different points are needed: "easier to read" and "quicker to read" are the same point. No mark for saying it uses less memory, makes files smaller, or that the computer processes it faster or understands it: the computer only uses binary.';
steps.push(written('exam-2', 'Exam Question: Two Benefits',
  cite('0478/12, June 2021, Question 1(b)') + ' Write two different benefits. Each one is a separate mark.', [
    { id: 'benefits', prompt: 'Give two benefits, to users, of converting binary values to hexadecimal.', marks: 2, scheme: REASONS.slice(0, 4), guidance: REASON_GUIDE,
      modelAnswer: 'It is easier for users to read and understand. There is less chance of making an error.' },
  ], ['Why does the question say "to users", and not "to the computer"?', 'The computer still works in binary. Only the person reading the number gains anything.']));

// 0478/12 June 2023 Q2(c). Mark scheme: easier/quicker to understand/read/write; easier/quicker to debug; less likely
// to make a mistake; shorter representation // takes up less screen space.
steps.push(written('exam-3', 'Exam Question: Why a Programmer Uses It',
  cite('0478/12, June 2023, Question 2(c)') + ' The same reasons earn the marks in many papers. Write two different ones.', [
    { id: 'programmer', prompt: 'Give two reasons why a programmer may use hexadecimal to represent binary numbers.', marks: 2, scheme: ['Easier or quicker to understand, read or write', 'Easier or quicker to debug', 'Less likely to make a mistake', 'Shorter representation of binary or takes up less screen space'], guidance: REASON_GUIDE,
      modelAnswer: 'It is a shorter representation of binary. It is easier to debug.' },
  ], ['Why is a shorter number easier to debug?', 'With fewer digits to check, a wrong digit is quicker to find.']));

// ---------------------------------------------------------------- where it is used
steps.push(concept('concept-uses', 'Where Hexadecimal Is Used',
  'Every use below is a long binary value that a person has to read or type. Predict: which of these have you seen before?',
  '<p>Colour codes in web pages, MAC addresses on a network, and error codes on a screen are the ones most people have seen.</p>',
  columns(facts(['<strong>HTML colour codes</strong>: #FF8000 (red, green, blue).', '<strong>MAC addresses</strong>: 00:1A:2B:3C:4D:5E (48 bits).', '<strong>Error codes</strong>: 404, 12B.',
    '<strong>Memory addresses</strong> and <strong>memory dumps</strong>.', '<strong>Assembly language</strong> (low-level programming).', '<strong>IP addresses</strong> (IPv6) and <strong>URLs</strong>.']),
    '<div style="display:grid;gap:8px">' + box(boxTitle('A MAC address in binary') + monoLine(MACBIN, 14)) + box(boxTitle('The same MAC address in hexadecimal') + monoLine(MAC)) + '</div>')));

// ---------------------------------------------------------------- activity 1: match each value to its use
steps.push(clickMatch('activity-1', 'Activity 1: What Is This Value?',
  'Click a value on the left, then click where hexadecimal is being used on the right.', [
    ['m-colour', '#FF8000 in a web page', 'HTML colour code'],
    ['m-mac', '00:1A:2B:3C:4D:5E on a network card', 'MAC address'],
    ['m-error', '"Error 12B: hardware fault"', 'Error code'],
    ['m-mem', 'A2F, where a program variable is kept', 'Memory address'],
    ['m-ip', '2001:0DB8:85A3::8A2E:0370:7334', 'IP address (IPv6)'],
    ['m-dump', 'Rows of values like 3C 4D 5E 00, copied from RAM to find a bug', 'Memory dump'],
  ], ['Why is a MAC address written in hexadecimal, and not binary?', 'It is 48 bits long. In hexadecimal it is only 12 digits, so it is easier to read and copy.']));

// 0478/12 June 2021 Q1(c). Mark scheme: any three from MAC address, URL, assembly language, error codes // error
// messages, IP addresses, locations in memory, memory dumps.
const USES = ['MAC address', 'URL', 'Assembly language', 'Error codes or error messages', 'IP addresses', 'Locations in memory (memory addresses)', 'Memory dumps'];
const USE_GUIDE = 'One mark for each different use from the list. HTML colour codes are in the question, so they earn no mark here. A use that only says "programming" or "computers" earns no mark.';
steps.push(written('exam-4', 'Exam Question: Three Other Uses',
  cite('0478/12, June 2021, Question 1(c)') + ' The question already gives colour codes, so they do not count.', [
    { id: 'uses', prompt: 'Hexadecimal is used to represent Hypertext Markup Language (HTML) colour codes in computer science. Identify three other ways that hexadecimal is used in computer science.', marks: 3, scheme: USES, guidance: USE_GUIDE,
      modelAnswer: 'MAC addresses. Error codes. Memory dumps.' },
  ], ['Why would HTML colour codes earn no mark here?', 'The question says "other" ways, and colour codes are already in the question.']));

// 0478/12 November 2021 Q1(d)(i), (ii). Mark scheme: (i) HTML colour codes; error messages. (ii) assembly
// code/language; memory address locations; error messages; memory dump.
steps.push(written('exam-5', 'Exam Question: Websites and Low-Level Programming',
  cite('0478/12, November 2021, Question 1(d)') + ' Match each use to the place in the question.', [
    { id: 'web', prompt: '(i) Give one way that hexadecimal is used in website development.', marks: 1, scheme: ['To represent HTML colour codes', 'In error messages'],
      guidance: 'Any one point from the list. The use must belong to website development.', modelAnswer: 'To represent HTML colour codes.' },
    { id: 'lowlevel', prompt: '(ii) Give one way that hexadecimal is used in low-level programming.', marks: 1, scheme: ['Assembly code or language', 'Memory address locations', 'In error messages', 'Memory dump'],
      guidance: 'Any one point from the list. HTML colour codes earn no mark here: they belong to website development.', modelAnswer: 'Memory address locations.' },
  ], ['Why might the same answer earn a mark in one part but not the other?', 'Each part names a different place. The use you give must belong to that place.']));

// ---------------------------------------------------------------- activity 2: read a colour code
const COL = 'FF8000';
const pair = (i) => COL.slice(i * 2, i * 2 + 2);
assert(hv(pair(0)) === 255 && hv(pair(1)) === 128 && hv(pair(2)) === 0, 'colour values');
steps.push(concept('concept-colour', 'How a Colour Code Works',
  'A colour code has 3 pairs of digits: red, green and blue. Predict: why is the largest pair FF, and what is FF in denary?',
  '<p>Each pair is 2 digits, so 8 bits. The largest 8-bit value is 1111 1111, which is FF, which is 255.</p>',
  columns(facts(['<strong>#RRGGBB</strong>: the first pair is red, then green, then blue.', 'Each pair is <strong>8 bits</strong>: 00 (none) to FF (255, full).', '#FF0000 is full red. #000000 is black. #FFFFFF is white.',
    'Hexadecimal is used because 6 digits are easier to read and type than 24 bits.']),
    '<div style="display:grid;gap:8px">' + swatch('FF0000') + swatch('000000') + swatch('FFFFFF') + swatch(COL) + '</div>')));

steps.push(checkStep('activity-2', 'Activity 2: Read a Colour Code', 'Activity 2: Read a Colour Code',
  'The colour code #FF8000 is orange. Convert each pair to denary, then say which colour has the most light.', [
    { label: 'Red pair, FF, in denary', answer: num(255), feedback: 'F = 15. 15 &times; 16 + 15.' },
    { label: 'Green pair, 80, in denary', answer: num(128), feedback: '8 &times; 16 + 0.' },
    { label: 'Blue pair, 00, in denary', answer: num(0), feedback: 'No sixteens and no ones.' },
    { label: 'Which colour (red, green or blue) has the most light?', answer: '^\\s*(the\\s+)?red(\\s+pair)?\\s*\\.?\\s*$', feedback: 'The biggest denary value has the most light.' },
    { label: 'Give the colour code for full blue only.', answer: '^\\s*#?\\s*0\\s*0\\s*0\\s*0\\s*F\\s*F\\s*$', feedback: 'Red 00, green 00, blue FF, in that order.' },
  ], ['Why do two hexadecimal digits fit exactly in one 8-bit register?', 'Each digit is 4 bits, and 2 &times; 4 = 8.'], swatch(COL)));

// ---------------------------------------------------------------- error codes: 0478/11 November 2022 Q3(a) and (e)
// Mark schemes: (a) 0100 0000 0100; (e) any two from easier for user to read/recognise/understand; takes up less
// space on a display.
assert(h2b('404') === '010000000100', '404 in binary');
steps.push(checkStep('exam-6', 'Exam Question: Error Codes (1 of 2)', 'Exam Question: Error Codes (1 of 2)',
  cite('0478/11, November 2022, Question 3(a)') + ' Error codes for a computer are often displayed as hexadecimal values. Each error code is stored in a 12-bit register. The error code 404 means \'file not found\'.', [
    { label: 'Give the 12-bit binary value that would be stored for the hexadecimal error code 404.', answer: binFull(h2b('404')), marks: 2, feedback: 'Each digit is 4 bits, even 0: 0 is 0000.' },
  ], ['Why does the computer need 12 bits for a three digit error code?', 'Each digit is 4 bits, and 3 &times; 4 = 12.']));

steps.push(written('exam-7', 'Exam Question: Error Codes (2 of 2)',
  cite('0478/11, November 2022, Question 3(e)') + ' Look back at your 12 bits for 404. Then write two different reasons.', [
    { id: 'error-reasons', prompt: 'Give two reasons why error codes are represented in hexadecimal, instead of binary.', marks: 2, scheme: ['It is easier for the user to read, recognise or understand', 'It takes up less space on a display'], guidance: REASON_GUIDE,
      modelAnswer: 'It is easier for the user to recognise. It takes up less space on a display.' },
  ], ['Why is 404 easier to remember than 010000000100?', 'It is 3 digits instead of 12 bits, so there is much less to hold in your head.']));

// ---------------------------------------------------------------- 0478/13 June 2024 Q3(c), (d)
// Mark schemes: (c) any one from easier/quicker to read/understand/debug; shorter representation // less screen
// space. (d) any two from HTML colour codes, URL, memory dump, IP address, MAC address, assembly language, error
// codes/messages, ASCII/Unicode.
steps.push(written('exam-8', 'Exam Question: Memory Addresses',
  cite('0478/13, June 2024, Question 3(c) and (d)') + ' A programmer is creating a computer game. One character is not moving correctly, so the programmer needs to debug the program. To do this they look at addresses that are locations in memory. The addresses are displayed as hexadecimal numbers, for example A2F.', [
    { id: 'addr-reason', prompt: '(c) Give one reason why the addresses are displayed in hexadecimal instead of binary.', marks: 1, scheme: ['It is easier or quicker to read, understand or debug', 'It is a shorter representation of binary or takes up less screen space'], guidance: REASON_GUIDE.replace('Any two from the list, one mark each. Two different points are needed: "easier to read" and "quicker to read" are the same point. ', 'Any one point from the list. '),
      modelAnswer: 'It is easier to debug.' },
    { id: 'addr-uses', prompt: '(d) Identify two other ways that hexadecimal is used in computer science.', marks: 2, scheme: ['HTML colour codes', 'URL', 'Memory dump', 'IP address', 'MAC address', 'Assembly language', 'Error codes or messages', 'ASCII or Unicode'],
      guidance: 'One mark for each different use from the list. Memory addresses are in the question, so they earn no mark here.', modelAnswer: 'MAC addresses. HTML colour codes.' },
  ], ['Why does seeing addresses in hexadecimal help someone debug a game?', 'They can read and compare short addresses quickly, so they find the wrong one sooner.']));

// 0478/12 June 2022 Q2(b). Mark scheme: any two from IP address, error messages/codes, assembly language // low-level
// language, URL // web address, memory dumps, locations in memory.
steps.push(written('exam-9', 'Exam Question: Two Other Examples',
  cite('0478/12, June 2022, Question 2(b)') + ' Two uses are already in the question, so they do not count.', [
    { id: 'other-two', prompt: 'HTML colour codes and Media Access Control (MAC) addresses are two examples of where hexadecimal is used in Computer Science. Give two other examples of where hexadecimal can be used in Computer Science.', marks: 2,
      scheme: ['IP address', 'Error messages or codes', 'Assembly language or low-level language', 'URL or web address', 'Memory dumps', 'Locations in memory'],
      guidance: 'One mark for each different use from the list. HTML colour codes and MAC addresses are in the question, so they earn no mark.', modelAnswer: 'Error codes. Memory dumps.' },
  ], ['Why should you read the whole question before you write your list?', 'The question may already use some answers. Those earn no marks.']));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Why Hexadecimal Is Used Drill', 'drill-y11-1-5-hexuse',
  'Reasons and uses from real exam papers. Pick the answer that earns the mark, then type it. Your progress is saved.',
  ['Why does the same reason earn marks on so many papers?', 'Every paper asks why people use hexadecimal, and the reason is always the same: it is easier for people.']));

// ---------------------------------------------------------------- plenary drill: pick then type, real papers
const NOT_REASON = ['It takes up less storage space in memory', 'The computer can process it faster', 'It uses fewer bits to store the data', 'It is the number system the CPU uses',
  'It makes the file size smaller', 'The computer understands hexadecimal directly', 'It is more secure than binary', 'It is quicker for the processor to calculate'];
const R_WORK = ['The computer always stores and processes binary, so hexadecimal cannot save memory, make files smaller or run faster.',
  'Hexadecimal only changes how binary is shown to people. One digit stands for 4 bits, so the value is shorter for a person to read, write and check.'];
const U_WORK = ['Look for a long binary value that a person has to read or type: an address, a code or a dump of memory.',
  'Check the question: any use it already names earns no mark.'];
const card = (id, cat, prompt, answers, distractors, noteText, working) => ({ id, category: cat, prompt, answers, distractors, note: noteText, working, pickThenType: true });
const cards = [
  card('r-01', 'reasons', 'Give one benefit, to users, of converting binary values to hexadecimal.', ['It is easier to read and understand', 'It is quicker to write', 'There is less chance of making an error', 'It takes up less screen space', 'It is easier to identify errors'],
    NOT_REASON, 'From Cambridge IGCSE 0478/12, June 2021, Question 1(b).', R_WORK),
  card('r-02', 'reasons', 'Give one reason why a programmer may use hexadecimal to represent binary numbers.', ['It is a shorter representation of binary', 'It is easier to debug', 'It is less likely a mistake is made', 'It is quicker to read and write'],
    NOT_REASON, 'From Cambridge IGCSE 0478/12, June 2023, Question 2(c).', R_WORK),
  card('r-03', 'reasons', 'Error codes for a computer are often displayed as hexadecimal values.\nGive one reason why error codes are represented in hexadecimal, instead of binary.', ['It is easier for the user to recognise', 'It takes up less space on a display', 'It is easier for the user to understand'],
    NOT_REASON, 'From Cambridge IGCSE 0478/11, November 2022, Question 3(e).', R_WORK),
  card('r-04', 'reasons', 'A programmer debugs a game by looking at memory addresses, displayed as hexadecimal numbers such as A2F.\nGive one reason why the addresses are displayed in hexadecimal instead of binary.', ['It is easier to debug', 'It takes up less screen space', 'It is quicker to read', 'It is a shorter representation of binary'],
    NOT_REASON, 'From Cambridge IGCSE 0478/13, June 2024, Question 3(c).', R_WORK),
  card('r-05', 'reasons', 'A memory address is displayed as A2F instead of 101000101111.\nHow many bits does the computer use to store this address?', ['12'],
    ['3', '4', '6'], 'The computer stores the same bits either way: 3 digits of 4 bits each.', ['Hexadecimal only changes how the value is shown. The computer still stores binary.', 'Each hexadecimal digit stands for 4 bits. Count the digits.']),
  card('u-01', 'uses', 'Hexadecimal is used to represent HTML colour codes.\nIdentify one other way that hexadecimal is used in computer science.', ['MAC address', 'Error codes', 'Memory dumps', 'Assembly language', 'IP addresses', 'Locations in memory', 'URL'],
    ['HTML colour codes', 'Storing text files', 'Making images smaller', 'Running programs faster', 'Encrypting data', 'Saving storage space'], 'From Cambridge IGCSE 0478/12, June 2021, Question 1(c).', U_WORK),
  card('u-02', 'uses', 'Give one way that hexadecimal is used in website development.', ['To represent HTML colour codes', 'In error messages'],
    ['Assembly language', 'Memory dumps', 'Making web pages load faster', 'Saving storage space'], 'From Cambridge IGCSE 0478/12, November 2021, Question 1(d)(i).', ['Think of something a web designer types into a web page.', 'It sets how something on the page looks.']),
  card('u-03', 'uses', 'Give one way that hexadecimal is used in low-level programming.', ['Assembly code', 'Memory address locations', 'Memory dump', 'In error messages'],
    ['HTML colour codes', 'Making programs run faster', 'Saving storage space', 'Compressing files'], 'From Cambridge IGCSE 0478/12, November 2021, Question 1(d)(ii).', ['Low-level programming works close to the hardware and the memory.', 'Think of values a programmer reads when looking inside memory.']),
  card('u-04', 'uses', 'HTML colour codes and MAC addresses are two examples of where hexadecimal is used in Computer Science.\nGive one other example of where hexadecimal can be used in Computer Science.', ['IP address', 'Error codes', 'Assembly language', 'URL', 'Memory dumps', 'Locations in memory'],
    ['MAC address', 'HTML colour codes', 'Storing images', 'Speeding up the CPU', 'Saving storage space', 'Encrypting passwords'], 'From Cambridge IGCSE 0478/12, June 2022, Question 2(b).', U_WORK),
  card('u-05', 'uses', 'Which of these is a MAC address?', ['00:1A:2B:3C:4D:5E'],
    ['#FF8000', '192.168.0.1', 'A2F'], 'A MAC address is 48 bits, shown as 6 pairs of hexadecimal digits.', ['A MAC address is 48 bits long.', 'Each pair of hexadecimal digits is 8 bits. Count the pairs.']),
  card('u-06', 'uses', 'Which statement about the hexadecimal number system is incorrect?', ['It is a base 10 system'],
    ['It uses the values 0 to 9 and A to F', 'It can be used as a shorter representation of binary', 'It can be used to represent error codes'], 'From Cambridge IGCSE 0478/11, June 2024, Question 2(a).', ['Count the digits hexadecimal uses: 0 to 9 and A to F.', 'The base is the number of digits.']),
  card('u-07', 'uses', 'An HTML colour code is #FF8000.\nWhich colour pair has the value 128 in denary?', ['Green'],
    ['Red', 'Blue', 'None of them'], 'The pairs are red FF (255), green 80 (128), blue 00 (0).', ['The pairs are in the order red, green, blue.', 'Convert each pair: digit times 16, plus the second digit.']),
];
const drill = { title: 'Year 11, 1.5: Why Hexadecimal Is Used', subtitle: 'Cambridge IGCSE Computer Science 0478', categories: [['reasons', 'Why Hexadecimal Is Used'], ['uses', 'Where Hexadecimal Is Used']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 3 && c.working.length >= 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id} answer is a distractor: ${a}`));
});
const drillSrc = `// Year 11, 1.5: Why Hexadecimal Is Used. Plenary: reasons and uses from real exam papers.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y11_1_5_hexuse.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now', 0, ['EC', 'ec', ' E C ', '0EC'], ['CE', 'E', '236']);
ok('do-now', 1, ['12D', '12d', '1 2 D'], ['D21', '12', '301']);
ok('do-now-2', 0, ['00101111', '0010 1111'], ['101111', '11110010']);
ok('do-now-2', 1, ['00010101', '0001 0101'], ['10101']);
ok('do-now-2', 2, ['11010110', '1101 0110'], ['01101101']);
ok('activity-2', 0, ['255'], ['256', 'FF']);
ok('activity-2', 1, ['128'], ['80', '8']);
ok('activity-2', 2, ['0', '00'], ['1']);
ok('activity-2', 3, ['red', 'Red', 'the red pair'], ['green', 'blue']);
ok('activity-2', 4, ['#0000FF', '0000ff', '# 00 00 FF'], ['#FF0000', '00FF00']);
ok('exam-6', 0, ['010000000100', '0100 0000 0100'], ['10000000100', '0100 0100']);
assert(!/[–—]|&mdash;|&ndash;/.test(JSON.stringify(steps) + drillSrc), 'dash found');
{ const all = JSON.stringify(steps) + drillSrc.split(ID).join(''); const BAD = /mario|\bdecimal\b|\bhex\b|two.s complement|overflow/i.exec(all);
  assert(!BAD, 'later or banned term: ' + (BAD ? all.slice(Math.max(0, BAD.index - 60), BAD.index + 30) : '')); }

const lesson = { id: ID, label: '1.5: Why Hexadecimal Is Used', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after y11-1-4-hexconv in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-4-hexconv"/.exec(raw);
    assert(m && raw.split('"y11-1-4-hexconv"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-4-hexconv"').join(`"y11-1-4-hexconv",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, drill ${cards.length} cards`);
