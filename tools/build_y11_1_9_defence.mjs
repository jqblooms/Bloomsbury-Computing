// Builds LessonData/y11-1-9-defence.json: Year 11, Two's Complement Defence, straight after y11-1-9-twos.
//   node tools/build_y11_1_9_defence.mjs
// A practice lesson: Do Now (1.8 recap, real question), the Do Now Extension (drill y11-1-8-shifts), How to Play,
// the tower-defence game (TowerDefence/, registry tower-defence, ?set=twos-complement) and the 1.9 plenary drill.
// The game's questions are real 0478 two's complement parts plus a few in the same style; they live server side in
// the shell's ExamGame.gs (answers and mark schemes never reach the browser), marked by Haiku with a code fallback.
// Do Now: 0478/11 November 2024 Q3(c)(iii): logical right shift of two places on 01111001, mark scheme 00011110.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y11-1-9-defence';
const P = 'y11-19d';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const cite = (ref) => `Cambridge IGCSE ${ref}.`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
function tps(question, answer) {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">Show the answer</span></summary><div class="lesson-tps-a"><p>${answer}</p></div></details>`;
}
const pvs = (n) => Array.from({ length: n }, (_, i) => 2 ** (n - 1 - i));
const val = (b) => [...b].reduce((t, c) => t * 2 + (c === '1' ? 1 : 0), 0);
const spaced = (b) => b.replace(/(.{4})(?=.)/g, '$1 ');
const shr = (b, n) => '0'.repeat(n) + b.slice(0, b.length - n);
const TH = (w, f) => `padding:6px 4px;min-width:${w}px;text-align:center;font-weight:700;font-size:${f}px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line-strong)`;
const HL = ';background:var(--brand-soft);color:var(--brand-dark);outline:3px solid var(--brand);outline-offset:-3px';
const OUTSIDE = ';border:2px dashed var(--bad, var(--danger, #b42318));color:var(--bad, var(--danger, #b42318))';
const MONO = 'font-family:var(--font-mono, monospace)';
const big = (t) => `<div style="text-align:center;${MONO};font-size:30px;font-weight:700;letter-spacing:3px">${t}</div>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px">${t}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;

function bitTable(bits) {
  const w = 46, th = TH(w, 14);
  const td = (c) => `padding:6px 4px;min-width:${w}px;height:36px;text-align:center;font:700 18px var(--font-mono, monospace);border:1px solid var(--line-strong)` + (c === '0' ? ';color:var(--muted-2)' : '');
  const lab = (t) => `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>`;
  return `<table style="border-collapse:collapse;margin:0 auto"><tr>${lab('Place value')}${pvs(8).map((p) => `<th style="${th}">${p}</th>`).join('')}</tr>` +
    `<tr>${lab('Bit')}${[...bits].map((c) => `<td style="${td(c)}">${c}</td>`).join('')}</tr></table>`;
}
// A logical right shift of n places, as in 1.8: the bits lost on the right, 0s in on the left.
function shiftTable(bits, n, { show = true } = {}) {
  const res = shr(bits, n), lost = bits.slice(bits.length - n), w = 38, th = TH(w, 13);
  const base = `padding:4px 3px;min-width:${w}px;text-align:center;border:1px solid var(--line-strong);height:30px;font:700 19px var(--font-mono, monospace)`;
  const lab = (t) => `<th style="${th};text-align:right;padding-right:10px;min-width:0">${t}</th>`;
  const outs = (fill) => Array.from({ length: n }, (_, i) => `<td style="${base}${OUTSIDE}">${fill ? lost[i] : ''}</td>`).join('');
  const outHead = Array.from({ length: n }, () => `<th style="${th}${OUTSIDE}">lost</th>`).join('');
  const reg = (b, after) => [...b].map((c, i) => `<td style="${base}${after && i < n ? HL : c === '0' ? ';color:var(--muted-2)' : ''}">${c}</td>`).join('');
  const blank = [...bits].map(() => `<td style="${base}"></td>`).join('');
  const row = (t, mid, side) => `<tr>${lab(t)}${mid}${side}</tr>`;
  return `<table style="border-collapse:collapse;margin:0 auto">` + row('Place value', pvs(8).map((p) => `<th style="${th}">${p}</th>`).join(''), outHead) +
    row('Before', reg(bits, false), outs(false)) + row('After', show ? reg(res, true) : blank, outs(show)) + '</table>';
}
function wtRight(bits, n) {
  const res = shr(bits, n);
  const out = [
    { text: `<strong>A similar question.</strong> A logical right shift of two places is performed on the binary number ${bits}.`, visual: big(spaced(bits)) },
    { text: 'Write the bits under their place values. Leave a row for the bits after the shift.', visual: shiftTable(bits, n, { show: false }) },
  ];
  for (let k = 1; k <= n; k++) {
    const gone = bits[bits.length - k];
    out.push({ text: `Place ${k}: every bit moves 1 place right. The ${gone} at the right end ${kw('is lost')}. A ${kw('0 comes in')} on the left.`, visual: shiftTable(bits, k) });
  }
  out.push({ text: `The register still holds 8 bits: ${spaced(res)}.`, visual: line(kw(spaced(res))) });
  out.push({ text: 'Now do the same for the question. One place at a time: bits that move out are lost, 0s fill the gap. Count 8 bits at the end.', visual: note('two places right &nbsp; lost on the right &nbsp; 0s in on the left') });
  return { title: 'Walk me through it: logical right shift', steps: out };
}

const steps = [];
const validators = {};

// ---------------------------------------------------------------- Do Now: 1.8 Logical Shifts (real question)
const DN = { bits: '01111001', n: 2, ms: '00011110', wt: '11010110' };
assert(shr(DN.bits, DN.n) === DN.ms, 'do now answer matches the mark scheme');
assert(shr(DN.wt, DN.n) !== DN.ms, 'walkthrough uses other bits');
{
  const vid = `${P}-do-now`, key = `${P}_do_now`.replace(/-/g, '_');
  validators[key] = [{ suffix: 'a', pattern: re(`^\\s*(=\\s*)?${[...DN.ms].join('\\s*')}(\\s*(in\\s+)?(binary|base\\s*2))?\\s*\\.?\\s*$`),
    feedback: 'Move every bit one place right at a time. Bits pushed out of the register are lost; 0s fill the gap on the left. Type all 8 bits.' }];
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses"><div class="lesson-do-now-response"><label for="${vid}-a">The 8 bits after the shift [1]</label>` +
    `<input id="${vid}-a" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="do-now-a" aria-label="Do Now: Logical Shifts part a" autocomplete="off"></div></div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: 1 mark</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  steps.push({ id: 'do-now', label: 'Do Now: Logical Shifts', type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: '<h2 class="lesson-h2">Do Now: Logical Shifts</h2>' +
      tps('Why are the bits that move out of the register lost?', 'The register has only 8 places, so there is nowhere to keep them.') +
      `<p class="lesson-lead">Recap of 1.8 Logical Shifts. ${cite('0478/11, November 2024, Question 3(c)(iii)')} A logical right shift of two places is performed on the binary number ${DN.bits}. Give the binary number after the logical right shift of two places is performed.</p>` +
      `<div class="lesson-do-now-columns"><div>${bitTable(DN.bits)}</div><div>${card}</div></div>`,
    walkthrough: wtRight(DN.wt, DN.n) });
  // The walkthrough never shows the Do Now answer.
  const wtText = JSON.stringify(steps[0].walkthrough).replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  assert(!wtText.includes(DN.ms), 'walkthrough shows the answer');
}

steps.push({ id: 'do-now-ext', label: 'Extension: Do Now Challenge', type: 'embedded-app', appId: 'drill-y11-1-8-shifts', embedContainerId: `${P}-do-now-ext`,
  content: '<h2 class="lesson-h2">Extension: Do Now Challenge</h2>' +
    tps('Why does each card use new numbers?', 'Then you practise the method, not one answer.') +
    '<p class="lesson-lead"><strong>Extension:</strong> finished the Do Now? Try these logical shift cards from 1.8. Stuck? Switch on <strong>I need help</strong>.</p>' +
    `<div id="${P}-do-now-ext"></div>` });

// ---------------------------------------------------------------- How to play (one short slide)
steps.push({ id: 'how-to-play', label: 'How to Play',
  content: '<h2 class="lesson-h2">Circuit Siege: How to Play</h2>' +
    tps('Why does the exam give a mark for the working?', 'It shows the examiner your method, so you can still earn a mark after a small slip.') +
    '<ol class="lesson-facts" style="font-size:22px;line-height:1.6">' +
    '<li>Answer two\'s complement exam questions to earn coins for your towers.</li>' +
    '<li>Type your <strong>working</strong> and your <strong>answer</strong> in the box, like in the exam.</li>' +
    '<li>Not full marks? Read the help, then try once more. A second try earns half.</li>' +
    '</ol>' });

// ---------------------------------------------------------------- the game
steps.push({ id: 'game', label: 'Play: Circuit Siege', type: 'embedded-app', appId: 'tower-defence', embedQuery: 'set=twos-complement',
  embedContainerId: `${P}-game`,
  content: '<h2 class="lesson-h2">Play: Circuit Siege</h2>' +
    tps('Why check an answer by working backwards?', 'If it does not give the number you started with, you know there is a slip to find.') +
    `<div id="${P}-game"></div>` });

// ---------------------------------------------------------------- plenary: the 1.9 drill
steps.push({ id: 'plenary', label: 'Plenary: Two\'s Complement Drill', type: 'embedded-app', appId: 'drill-y11-1-9-twos', embedContainerId: `${P}-plenary`,
  content: '<h2 class="lesson-h2">Plenary: Two\'s Complement Drill</h2>' +
    tps('Why practise with new numbers every time?', 'Then you know the method, not just one answer.') +
    '<p class="lesson-lead">Read two\'s complement, make negative numbers and positive numbers. Your progress is saved.</p>' +
    `<div id="${P}-plenary"></div>` });

const all = JSON.stringify({ steps, validators });
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/mario|\bdecimal\b/i.test(all), 'never named');
{
  const v = validators[`${P}_do_now`.replace(/-/g, '_')][0].pattern;
  const r = new RegExp(v.source, v.flags);
  assert(r.test('00011110') && r.test('0001 1110') && !r.test('00111100') && !r.test('11110'), 'do now validator');
}

const lesson = { id: ID, label: "1.9: Two's Complement Defence", steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ---------------------------------------------------------------- register: after y11-1-9-twos in lessons.json
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = /\n([ \t]*)"y11-1-9-twos"/.exec(raw);
    assert(m && raw.split('"y11-1-9-twos"').length === 2, 'lessons.json anchor');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const out = raw.split('"y11-1-9-twos"').join(`"y11-1-9-twos",${eol}${m[1]}"${ID}"`);
    JSON.parse(out);
    fs.writeFileSync(lp, out);
  }
}
console.log(`${ID}: ${steps.length} steps`);
