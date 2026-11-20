// Builds LessonData/y9-3-2-loops.json: Year 9, 3.2 Algorithms with Loops, its plenary drill (Drills/data/y9-3-2-loops.js),
// and registers the lesson in the Year 9 "Pseudocode and Software Development" unit after 3.1.
//   node tools/build_y9_3_2.mjs
// Objective (plan 3.2, 9CT.02): follow flowchart and pseudocode algorithms that use loops; trace how values change as
// a loop repeats. One idea: in a flowchart a loop is an arrow back to a decision, and a FOR loop does the same job;
// every pass changes the values, so trace one row at a time. Only what Year 9 has met: DECLARE, assignment, INPUT,
// OUTPUT, FOR ... TO ... NEXT, IF ... THEN ... ENDIF (THEN on the IF line), LENGTH, UCASE, LCASE. No WHILE or REPEAT.
// Every program on a slide is run in shared/pseudocode-engine.js, and every flowchart is run by flowRun below.
// Activities: two Trace Tables traces (a loop that outputs every pass, then a loop with an IF and inputs).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'y9-3-2-loops';
const P = 'y9l32';
const A = '&larr;';
const { runPseudocode } = createRequire(import.meta.url)(path.join(ROOT, 'shared', 'pseudocode-engine.js'));
const re = (source, flags = 'i') => ({ __regex: true, source, flags });
const esc = (s) => s.replace(/&(?!(larr|nbsp|amp|lt|gt);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function codeBlock(lines, numbered = false) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = esc(l.trim()).replace(/&lt;-/g, A);
    const n = numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : '';
    return '<div class="lesson-code-line">' + n + '&nbsp;'.repeat(lead) + text + '</div>';
  }).join('') + '</div>';
}
const label = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const table = (rows, head) => '<table class="donow-table" style="font-size:16px;width:100%">' +
  '<tr>' + head.map((h) => `<th style="padding:4px 10px;text-align:center">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="padding:4px 10px;text-align:center">${c}</td>`).join('') + '</tr>').join('') + '</table>';

function run(lines, inputs = []) {
  const r = runPseudocode(lines.join('\n'), {}, 20000, inputs.map(String));
  assert(!r.error, 'program runs: ' + (r.error && r.error.message) + '\n' + lines.join('\n'));
  return r.outputs.map(String);
}
const one = (lines, inputs) => { const o = run(lines, inputs); assert(o.length === 1, 'one output: ' + o.join()); return o[0]; };

// ---------------------------------------------------------------- flowcharts
// A loop flowchart: pre boxes, one decision (Yes runs the body, then the arrow goes back up; No goes right to post).
// Box kinds: term (Start, Stop), proc (do this), io (INPUT, OUTPUT). hl = index into [...pre, dec, ...body, ...post].
function flowSvg(f, hl = -1, maxH = 330) {
  const cx = 150, px = 345, bw = 170, bh = 32, gap = 16, dw = 168, dh = 58;
  const out = [];
  let k = 0;
  const style = (i) => i === hl ? 'fill:var(--brand-soft);stroke:var(--brand);stroke-width:3' : 'fill:var(--surface);stroke:var(--ink);stroke-width:1.6';
  const text = (x, y, t) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" style="fill:var(--ink);font:600 14px var(--font-mono, monospace)">${esc(t).replace(/&lt;-/g, '&#8592;')}</text>`;
  const line = (pts, head = true) => `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" style="fill:none;stroke:var(--ink);stroke-width:1.6"${head ? ' marker-end="url(#fa)"' : ''}/>`;
  function box(x, y, n) {
    const i = k++;
    let shape;
    if (n.k === 'term') shape = `<rect x="${x - 55}" y="${y}" width="110" height="${bh}" rx="16" style="${style(i)}"/>`;
    else if (n.k === 'io') shape = `<polygon points="${x - bw / 2 + 12},${y} ${x + bw / 2 + 6},${y} ${x + bw / 2 - 12},${y + bh} ${x - bw / 2 - 6},${y + bh}" style="${style(i)}"/>`;
    else shape = `<rect x="${x - bw / 2}" y="${y}" width="${bw}" height="${bh}" style="${style(i)}"/>`;
    out.push(shape + text(x, y + bh / 2, n.t));
  }
  let y = 6;
  f.pre.forEach((n, j) => { box(cx, y, n); y += bh; out.push(line([[cx, y], [cx, y + gap]])); y += gap; });
  const dy = y; const di = k++;
  out.push(`<polygon points="${cx},${dy} ${cx + dw / 2},${dy + dh / 2} ${cx},${dy + dh} ${cx - dw / 2},${dy + dh / 2}" style="${style(di)}"/>` + text(cx, dy + dh / 2, f.dec));
  y = dy + dh;
  out.push(line([[cx, y], [cx, y + gap]]) + `<text x="${cx + 8}" y="${y + 11}" style="fill:var(--muted);font:700 12px var(--font-body, sans-serif)">Yes</text>`);
  y += gap;
  f.body.forEach((n, j) => { box(cx, y, n); y += bh; if (j < f.body.length - 1) { out.push(line([[cx, y], [cx, y + gap]])); y += gap; } });
  out.push(line([[cx, y], [cx, y + 12], [14, y + 12], [14, dy + dh / 2], [cx - dw / 2, dy + dh / 2]]));
  const bottom = y + 16;
  // No: right from the decision, then down into the post column
  let py = dy + dh / 2;
  out.push(line([[cx + dw / 2, py], [px, py], [px, py + 30]]) + `<text x="${cx + dw / 2 + 12}" y="${py - 7}" style="fill:var(--muted);font:700 12px var(--font-body, sans-serif)">No</text>`);
  py += 30;
  f.post.forEach((n, j) => { box(px, py, n); py += bh; if (j < f.post.length - 1) { out.push(line([[px, py], [px, py + gap]])); py += gap; } });
  const H = Math.max(bottom, py + 6);
  return `<svg viewBox="0 0 440 ${H}" role="img" aria-label="Flowchart" style="display:block;width:100%;max-width:440px;max-height:${maxH}px;margin:0 auto">` +
    `<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--ink)"/></marker></defs>` + out.join('') + '</svg>';
}
// Runs a loop flowchart. Box text is Cambridge pseudocode (X <- expr, INPUT X, OUTPUT X); the decision is a condition.
function flowRun(f, inputs = []) {
  const v = {}; const outs = []; let yes = 0; const ins = inputs.slice();
  const val = (e) => Function(...Object.keys(v), `return (${e.replace(/<>/g, '!=').replace(/(^|[^<>!])=(?!=)/g, '$1==')});`)(...Object.values(v));
  const exec = (t) => {
    let m;
    if ((m = t.match(/^(\w+) <- (.+)$/))) v[m[1]] = val(m[2]);
    else if ((m = t.match(/^INPUT (\w+)$/))) v[m[1]] = Number(ins.shift());
    else if ((m = t.match(/^OUTPUT (.+)$/))) outs.push(String(val(m[1])));
  };
  f.pre.forEach((n) => n.k !== 'term' && exec(n.t));
  while (val(f.dec.replace(/\?$/, ''))) { yes++; f.body.forEach((n) => exec(n.t)); assert(yes < 100, 'flowchart stops'); }
  f.post.forEach((n) => n.k !== 'term' && exec(n.t));
  return { v, outs, yes };
}
const T = (t) => ({ k: 'term', t }), B = (t) => ({ k: 'proc', t }), IO = (t) => ({ k: 'io', t });

// ---------------------------------------------------------------- slide helpers
const validators = {};
function checkStep(id, lbl, heading, lead, parts, whyQ = null, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer, p.flags == null ? 'i' : p.flags), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
  }).join('');
  const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label: lbl, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, card) : card) };
}
function mcStep(id, lbl, heading, lead, items, whyQ, extra = '') {
  const cid = `${P}-${id}`;
  return { id, label: lbl, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
      (extra ? columns(extra, `<div id="${cid}"></div>`) : `<div id="${cid}"></div>`), items };
}
function selfMarked(id, lbl, heading, lead, items, whyQ, extra = '') {
  return { id, label: lbl, type: 'self-marked-response', containerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + (extra ? columns(extra, `<div id="${P}-${id}"></div>`) : `<div id="${P}-${id}"></div>`), items };
}
function embed(id, lbl, appId, heading, lead, whyQ, query) {
  const s = { id, label: lbl, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
  if (query) s.embedQuery = query;
  return s;
}
const num = (n, unit = '') => `^\\s*${n}${unit ? `\\s*(${unit})?` : ''}\\s*\\.?\\s*$`;
const exact = (s) => `^\\s*["']?${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*\\.?\\s*$`;
const steps = [];
const note = (t) => `<div class="wt-note">${t}</div>`;
function codeWT(lines, hl = []) {
  return '<div class="lesson-code">' + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    return `<div class="lesson-code-line${hl.includes(i + 1) ? ' wt-hl' : ''}">` + String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' + '&nbsp;'.repeat(lead) + esc(l.trim()).replace(/&lt;-/g, A) + '</div>';
  }).join('') + '</div>';
}
const mins = (n, what) => `<strong>${n} minutes. What to do:</strong> ${what}`;

// ---------------------------------------------------------------- Do Now 1: LENGTH and UCASE (2.5)
const DN1P = ['DECLARE City : STRING', 'City <- "Songkhla"', 'OUTPUT LENGTH(City)', 'OUTPUT UCASE(City)'];
const DN1 = run(DN1P);
assert(DN1.join('|') === '8|SONGKHLA', 'Do Now 1 outputs');
const WT1P = ['DECLARE Town : STRING', 'Town <- "Pattani"', 'OUTPUT LENGTH(Town)', 'OUTPUT UCASE(Town)'];
assert(run(WT1P).join('|') === '7|PATTANI', 'walkthrough 1 outputs');
const WT1 = { title: 'Walk me through it: LENGTH and UCASE', steps: [
  { text: 'A similar program. Town holds "Pattani".', visual: codeWT(WT1P, [2]) },
  { text: 'Line 3: LENGTH counts every character between the quote marks: P, a, t, t, a, n, i.', visual: codeWT(WT1P, [3]) + note('7 characters') },
  { text: 'So line 3 outputs <strong>7</strong>.', visual: codeWT(WT1P, [3]) + note('Output: 7') },
  { text: 'Line 4: UCASE makes every letter a capital. Nothing else changes.', visual: codeWT(WT1P, [4]) + note('Pattani becomes PATTANI') },
  { text: 'So line 4 outputs <strong>PATTANI</strong>. Now do your program the same way.', visual: codeWT(WT1P, [4]) + note('Output: PATTANI') },
] };
steps.push(checkStep('do-now', 'Do Now: Question 1', 'Do Now: Strings', mins(3, 'from 2.5 String Manipulation. Type each output exactly.'), [
  { label: 'What does line 3 output?', answer: num(DN1[0], 'characters?'), feedback: 'Count every character of "Songkhla".' },
  { label: 'What does line 4 output? Use the right capital letters.', answer: exact(DN1[1]), flags: '', feedback: 'UCASE makes every letter a capital.' },
], ['Why does LENGTH("Hat Yai") give 7, not 6?', 'The space is a character too, so LENGTH counts it.'], codeBlock(DN1P, true)));
steps[steps.length - 1].walkthrough = WT1;

// ---------------------------------------------------------------- Do Now 2: a count with the value on the line (3.1)
const DN2P = ['DECLARE Mark : INTEGER', 'DECLARE Index : INTEGER', 'DECLARE Count : INTEGER', 'Count <- 0', 'FOR Index <- 1 TO 5', '    INPUT Mark', '    IF Mark >= 50 THEN', '        Count <- Count + 1', '    ENDIF', 'NEXT Index', 'OUTPUT Count'];
const DN2_IN = [45, 50, 72, 49, 50];
const DN2a = one(DN2P, DN2_IN), DN2b = one(DN2P.map((l) => l.replace('>= 50', '> 50')), DN2_IN);
assert(DN2a === '3' && DN2b === '1', 'Do Now 2 outputs');
const WT2P = ['DECLARE Mark : INTEGER', 'DECLARE Index : INTEGER', 'DECLARE Count : INTEGER', 'Count <- 0', 'FOR Index <- 1 TO 4', '    INPUT Mark', '    IF Mark >= 40 THEN', '        Count <- Count + 1', '    ENDIF', 'NEXT Index', 'OUTPUT Count'];
const WT2_IN = [40, 25, 40, 12];
assert(one(WT2P, WT2_IN) === '2' && one(WT2P.map((l) => l.replace('>= 40', '> 40')), WT2_IN) === '0', 'walkthrough 2 outputs');
const WT2 = { title: 'Walk me through it: count the marks on the line', steps: [
  { text: 'A similar program. The user types 40, 25, 40, 12. Count starts at 0.', visual: codeWT(WT2P, [4]) + note('Count = 0') },
  { text: 'Pass 1: Mark = 40. Is 40 &gt;= 40? Yes: 40 is equal, and &gt;= includes equal. Count = 1.', visual: codeWT(WT2P, [6, 7, 8]) + note('Count = 1') },
  { text: 'Pass 2: Mark = 25. 25 &gt;= 40 is FALSE. Count stays 1.', visual: codeWT(WT2P, [6, 7]) + note('Count = 1') },
  { text: 'Pass 3: 40 again, TRUE: Count = 2. Pass 4: 12, FALSE. Line 11 outputs <strong>2</strong>.', visual: codeWT(WT2P, [7, 8, 11]) + note('Output: 2') },
  { text: 'With &gt; 40 instead, 40 &gt; 40 is FALSE, because 40 is not bigger than 40. No mark counts, so it outputs <strong>0</strong>. Now trace your program the same way.', visual: codeWT(WT2P.map((l) => l.replace('>= 40', '> 40')), [7]) + note('Output: 0') },
] };
steps.push(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: Marks on the Line', mins(3, `from 3.1. The user types ${DN2_IN.join(', ')}. Trace the program as it is written.`), [
  { label: 'What does the program output?', answer: num(DN2a), feedback: 'Check each mark against line 7. Is 50 &gt;= 50 TRUE?' },
  { label: 'Line 7 is changed to IF Mark &gt; 50 THEN. What does it output now?', answer: num(DN2b), feedback: 'Is 50 &gt; 50 TRUE? Check each mark again.' },
], ['A sign says "50 or more". Why does the program use &gt;= and not &gt;?', '"Or more" includes 50 itself. &gt; would leave out a mark of exactly 50.'], codeBlock(DN2P, true)));
steps[steps.length - 1].walkthrough = WT2;
steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y9-3-1-pseudocode', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from 3.1 Following and Correcting Pseudocode. Stuck? Switch on <strong>I need help</strong>.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Algorithms with Loops',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Pseudocode and Software Development</p><h2 class="lesson-h2">Algorithms with Loops</h2><p>Year 9, 3.2</p></div>' +
    facts(['<strong>Today:</strong> follow a loop in a flowchart and in pseudocode, and trace how the values change on every pass.',
      '<strong>You already know:</strong> FOR loops, IF, and trace tables.',
      '<strong>Activities:</strong> two trace tables, each harder than the last.']) +
    why('A flowchart has no FOR line. How could a flowchart still make steps repeat?', 'An arrow can point back up to an earlier box. Then those boxes run again.') });

// ---------------------------------------------------------------- watch a flowchart loop (stepper)
const F1 = { pre: [T('Start'), B('Total <- 0'), B('Count <- 1')], dec: 'Count <= 3?', body: [B('Total <- Total + Count'), B('Count <- Count + 1')], post: [IO('OUTPUT Total'), T('Stop')] };
const F1R = flowRun(F1);
assert(F1R.outs.join() === '6' && F1R.yes === 3 && F1R.v.Count === 4, 'F1 runs');
// node index: 0 Start, 1 Total<-0, 2 Count<-1, 3 decision, 4 Total<-Total+Count, 5 Count<-Count+1, 6 OUTPUT, 7 Stop
const tr = (rows) => table(rows.map((r) => r.map((c) => c === '' ? '&nbsp;' : c)), ['Total', 'Count', 'Count &lt;= 3?', 'Output']);
const SH = (hl, say, rows) => `<p style="margin:0 0 6px;font-size:17px">${say}</p>` + columns(flowSvg(F1, hl, 300), tr(rows));
const r0 = [['0', '', '', '']], r1 = r0.concat([['', '1', '', '']]);
const watchSteps = [
  { title: 'The shapes', html: SH(-1, 'Oval: Start or Stop. Box: do this. Slanted box: INPUT or OUTPUT. Diamond: a <strong>decision</strong>, a question with the answer Yes or No.', []) },
  { title: 'Set the start values', html: SH(1, 'Total &larr; 0, then Count &larr; 1. Write each new value in the trace table.', r1), note: 'Say what the decision will answer before you press Next.' },
  { title: 'Pass 1', html: SH(3, 'Is Count &lt;= 3? Count is 1, so Yes. Follow the Yes arrow down.', r1.concat([['', '', 'Yes', '']])) },
  { title: 'Pass 1', html: SH(4, 'Total &larr; Total + Count: 0 + 1 = 1.', r1.concat([['', '', 'Yes', ''], ['1', '', '', '']])) },
  { title: 'Pass 1', html: SH(5, 'Count &larr; Count + 1: Count is now 2. The arrow goes <strong>back up</strong> to the decision. That arrow is the <strong>loop</strong>.', r1.concat([['', '', 'Yes', ''], ['1', '2', '', '']])) },
  { title: 'Pass 2', html: SH(5, 'Is 2 &lt;= 3? Yes. Total = 1 + 2 = 3. Count = 3. Back up again.', r1.concat([['', '', 'Yes', ''], ['1', '2', 'Yes', ''], ['3', '3', '', '']])), note: 'Predict pass 3 before you press Next.' },
  { title: 'Pass 3', html: SH(5, 'Is 3 &lt;= 3? Yes, 3 is equal. Total = 3 + 3 = 6. Count = 4. Back up.', r1.concat([['', '', 'Yes', ''], ['1', '2', 'Yes', ''], ['3', '3', 'Yes', ''], ['6', '4', '', '']])) },
  { title: 'The loop stops', html: SH(3, 'Is 4 &lt;= 3? <strong>No</strong>. Follow the No arrow out of the loop.', r1.concat([['', '', 'Yes', ''], ['1', '2', 'Yes', ''], ['3', '3', 'Yes', ''], ['6', '4', 'No', '']])) },
  { title: 'Output', html: SH(6, 'OUTPUT Total: 6. Three passes, and one more check that said No.', r1.concat([['', '', 'Yes', ''], ['1', '2', 'Yes', ''], ['3', '3', 'Yes', ''], ['6', '4', 'No', '6']])) },
];
steps.push({ id: 'watch', label: 'Watch a Flowchart Loop', type: 'stepper', stepperId: `${P}-watch`, stepperSteps: watchSteps,
  content: '<h2 class="lesson-h2">Watch a Flowchart Loop</h2>' +
    why('Predict before you start: how many times will the arrow go back up? Why?', 'Three times. Count is 1, 2 and 3 when the answer is Yes. When Count is 4 the answer is No, so it leaves the loop.') +
    `<p class="lesson-lead">${mins(5, 'press <strong>Next step</strong>. Before each press, say what happens next.')}</p><div id="${P}-watch"></div>` });

// ---------------------------------------------------------------- explain it (Haiku)
steps.push(selfMarked('explain-loop', 'Explain It: How a Flowchart Loops', 'Explain It: How a Flowchart Loops', mins(3, 'answer in your own words. Use Check my answer, improve it, then check again.'), [
  { id: 'explain-flow-loop', prompt: 'Explain how this flowchart repeats its steps, and how it knows when to stop. [2]', marks: 2, aiModel: 'haiku',
    scheme: ['After the last box in the loop the arrow goes back (up) to the decision, so the boxes run again / repeat',
      'The decision checks Count each time; while the answer is Yes it repeats, and when the answer is No (Count is more than 3 / Count is 4) it leaves the loop / stops'],
    guidance: 'One mark for each point. Credit the ideas in the student\'s own words: an arrow or line going back (to the question / diamond / decision) for point 1; the question or decision answering No, or Count getting too big, for point 2. Do not accept "it loops" or "it repeats" alone for point 1.',
    context: 'The flowchart: Start, Total <- 0, Count <- 1, then a decision "Count <= 3?". Yes leads to Total <- Total + Count, then Count <- Count + 1, then an arrow back up to the decision. No leads to OUTPUT Total, then Stop. The class watched it run: Count was 1, 2 and 3 on the Yes passes, then 4 gave No and it output 6.',
    modelAnswer: 'After Count <- Count + 1 the arrow goes back up to the decision, so the boxes run again. When Count is 4, Count <= 3 is No, so it leaves the loop.' },
], ['Why does Count have to change inside the loop?', 'If Count never changed, the decision would give the same answer every time.'], flowSvg(F1, -1, 300)));

// ---------------------------------------------------------------- check: follow a flowchart loop
const F2 = { pre: [T('Start'), B('Total <- 0'), B('Count <- 1')], dec: 'Count <= 4?', body: [B('Total <- Total + 3'), B('Count <- Count + 1')], post: [IO('OUTPUT Total'), T('Stop')] };
const F2R = flowRun(F2);
assert(F2R.yes === 4 && F2R.outs.join() === '12' && F2R.v.Count === 5, 'F2 runs');
steps.push(checkStep('check-flow', 'Check: Follow the Flowchart', 'Check: Follow the Flowchart', mins(4, 'follow the flowchart. Write a trace table in your book if it helps.'), [
  { label: 'How many times is the answer to the decision Yes?', answer: num(F2R.yes, 'times?'), feedback: 'Count is 1 at the start. The answer is Yes while Count &lt;= 4.' },
  { label: 'What is output?', answer: num(F2R.outs[0]), feedback: 'Total goes up by 3 on every Yes pass.' },
  { label: 'What is Count when the loop stops?', answer: num(F2R.v.Count), feedback: 'The loop stops at the first No. What is Count then?' },
], ['A loop like this one has no Count &larr; Count + 1 box. Why would it never stop?', 'Count would stay the same, so the decision would give the same answer every time.'], flowSvg(F2, -1, 330)));

// ---------------------------------------------------------------- compare: flowchart and FOR
const FOR1 = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
assert(one(FOR1) === F1R.outs[0], 'FOR1 matches F1');
steps.push({ id: 'compare-for', label: 'Compare: Flowchart and FOR Loop',
  content: '<h2 class="lesson-h2">Compare: Flowchart and FOR Loop</h2>' +
    tps('Predict: do A and B output the same? Why does B have no line Count &larr; Count + 1?',
      `<p>Both output <strong>${F1R.outs[0]}</strong>. The FOR loop does the Count jobs for you.</p>` +
      table([['Count &larr; 1', 'FOR Count &larr; 1'], ['Count &lt;= 3?', 'TO 3'], ['Count &larr; Count + 1, arrow back up', 'NEXT Count']], ['A: flowchart', 'B: FOR loop']), 'Show the worked answer') +
    columns(label('A') + flowSvg(F1, -1, 290), label('B') + codeBlock(FOR1, true) +
      facts(['FOR sets the start value, checks the last value and adds 1 at NEXT.', 'Same steps, same values, same output.'])) });

// ---------------------------------------------------------------- hinge
const F3 = { pre: [T('Start'), B('Count <- 2')], dec: 'Count <= 6?', body: [IO('OUTPUT Count'), B('Count <- Count + 1')], post: [T('Stop')] };
const F3R = flowRun(F3);
const F3FOR = ['DECLARE Count : INTEGER', 'FOR Count <- 2 TO 6', '    OUTPUT Count', 'NEXT Count'];
assert(F3R.outs.join() === run(F3FOR).join() && F3R.outs.join() === '2,3,4,5,6', 'F3 matches its FOR');
const LT = { pre: [T('Start'), B('Count <- 1')], dec: 'Count < 6?', body: [IO('OUTPUT Count'), B('Count <- Count + 1')], post: [T('Stop')] };
assert(flowRun(LT).outs.join() === run(['DECLARE Count : INTEGER', 'FOR Count <- 1 TO 5', '    OUTPUT Count', 'NEXT Count']).join(), 'Count < 6 is 1 TO 5');
steps.push(mcStep('hinge', 'Hinge Question: Match the FOR Line', 'Hinge Question: Match the FOR Line', mins(3, 'choose, then check.'), [
  { prompt: 'Which FOR line does the same as this flowchart?', options: ['FOR Count ← 1 TO 6', 'FOR Count ← 2 TO 6', 'FOR Count ← 2 TO 7', 'FOR Count ← 2 TO 5'], correct: 1,
    explain: 'Count starts at 2. The answer is Yes up to and including 6, because 6 &lt;= 6 is TRUE. So 2 TO 6.' },
  { prompt: 'Another flowchart sets Count ← 1. Its decision is Count < 6? Which FOR line does the same?', options: ['FOR Count ← 1 TO 5', 'FOR Count ← 1 TO 6', 'FOR Count ← 0 TO 5', 'FOR Count ← 1 TO 7'], correct: 0,
    explain: '6 &lt; 6 is FALSE, so the last Yes pass is Count = 5. So 1 TO 5.' },
], ['Why check the first value and the last value of Count separately?', 'A loop can be wrong at either end. Checking both ends shows exactly which values of Count run the loop.'], flowSvg(F3, -1, 300)));

// ---------------------------------------------------------------- trace: one row each pass
const SC = ['DECLARE Score : INTEGER', 'DECLARE Count : INTEGER', 'Score <- 20', 'FOR Count <- 1 TO 4', '    Score <- Score - Count', 'NEXT Count', 'OUTPUT Score'];
const SCv = []; { let s = 20; for (let c = 1; c <= 4; c++) { s -= c; SCv.push(s); } }
assert(one(SC) === String(SCv[3]) && SCv.join() === '19,17,14,10', 'Score trace');
steps.push({ id: 'trace-rows', label: 'Trace: One Row Each Pass',
  content: '<h2 class="lesson-h2">Trace: One Row Each Pass</h2>' +
    tps('Predict the last two rows. Why does Score go down by a different amount each pass?',
      `<p>Count is 3, then 4, so Score goes 17, 14, 10. It takes away Count, and Count is one more on every pass.</p>` +
      table([['', '20', ''], ['1', '19', ''], ['2', '17', ''], ['3', '14', ''], ['4', '10', ''], ['', '', '10']], ['Count', 'Score', 'Output']), 'Show the worked answer') +
    columns(codeBlock(SC, true),
      table([['', '20', ''], ['1', '19', ''], ['2', '17', ''], ['3', '?', ''], ['4', '?', ''], ['', '', '?']], ['Count', 'Score', 'Output']) +
      facts(['Write a new row each time a value changes.', 'Use the value from the row above, never the start value.'])) });

// ---------------------------------------------------------------- activity 1: Trace Tables, output on every pass
const ACT1 = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'Number <- 3', 'FOR Count <- 1 TO 4', '    Number <- Number + Count', '    OUTPUT Number', 'NEXT Count'];
const ACT1o = run(ACT1);
assert(ACT1o.join() === '4,6,9,13', 'activity 1 outputs');
const rows1 = [{ Line: '3', Number: '3', Count: '', Output: '' }];
ACT1o.forEach((o, i) => {
  rows1.push({ Line: '4', Number: '', Count: String(i + 1), Output: '' });
  rows1.push({ Line: '5', Number: o, Count: '', Output: '' });
  rows1.push({ Line: '6', Number: '', Count: '', Output: o });
});
steps.push({ id: 'activity-1', label: 'Activity 1: Trace Every Pass', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-1`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Trace Every Pass',
    context: 'Trace the loop. Write a new row each time a value changes. This loop outputs on every pass.',
    code: ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'Number = 3', 'for Count in range(1, 5):', '    Number = Number + Count', '    print(Number)'],
    cols: ['Line', 'Number', 'Count', 'Output'],
    answers: rows1,
  },
  content: '<h2 class="lesson-h2">Activity 1: Trace Every Pass</h2>' +
    why('Why does this trace table have four values in the Output column, not one?', 'The OUTPUT line is inside the loop, so it runs on every pass.') +
    `<p class="lesson-lead">${mins(7, 'fill in the trace table, then check it. <strong>Done</strong> when every row is right.')}</p><div id="${P}-embed-1" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- check: a loop with an IF inside
const IFP = ['DECLARE Count : INTEGER', 'DECLARE Total : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 6', '    IF Count > 3 THEN', '        Total <- Total + Count', '    ENDIF', 'NEXT Count', 'OUTPUT Total'];
const IFa = one(IFP), IFb = one(IFP.map((l) => l.replace('Count > 3', 'Count >= 3')));
assert(IFa === '15' && IFb === '18', 'IF loop outputs');
steps.push(checkStep('check-if', 'Check: A Loop with an IF', 'Check: A Loop with an IF', mins(4, 'trace the loop. Check the IF line on every pass.'), [
  { label: 'How many times does line 6 run?', answer: num(3, 'times?'), feedback: 'Line 6 runs only when Count &gt; 3 is TRUE. Which values of Count from 1 to 6 are bigger than 3?' },
  { label: 'What does the program output?', answer: num(IFa), feedback: 'Add up only the values of Count that are bigger than 3.' },
  { label: 'Line 5 is changed to IF Count &gt;= 3 THEN. What does it output now?', answer: num(IFb), feedback: 'Now 3 counts too. Is 3 &gt;= 3 TRUE?' },
], ['A loop runs 10 times and its IF is TRUE 4 times. Why does the line inside the IF run only 4 times?', 'The loop reaches the IF on every pass, but the line inside it runs only when the condition is TRUE.'], codeBlock(IFP, true)));

// ---------------------------------------------------------------- activity 2: Trace Tables, IF and inputs
const ACT2_IN = [28, 30, 33, 25, 31];
const ACT2 = ['DECLARE Temp : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Hot : INTEGER', 'Hot <- 0', 'FOR Count <- 1 TO 5', '    INPUT Temp', '    IF Temp >= 30 THEN', '        Hot <- Hot + 1', '    ENDIF', 'NEXT Count', 'OUTPUT Hot'];
const ACT2o = one(ACT2, ACT2_IN);
assert(ACT2o === '3', 'activity 2 output');
const rows2 = [{ Line: '4', Temp: '', Count: '', Hot: '0', Output: '' }];
{ let hot = 0;
  ACT2_IN.forEach((t, i) => {
    rows2.push({ Line: '5', Temp: '', Count: String(i + 1), Hot: '', Output: '' });
    rows2.push({ Line: '6', Temp: String(t), Count: '', Hot: '', Output: '' });
    if (t >= 30) { hot++; rows2.push({ Line: '8', Temp: '', Count: '', Hot: String(hot), Output: '' }); }
  });
  rows2.push({ Line: '9', Temp: '', Count: '', Hot: '', Output: String(hot) });
  assert(String(hot) === ACT2o, 'rows2 total'); }
steps.push({ id: 'activity-2', label: 'Activity 2: Trace the Hot Days', type: 'embedded-app', appId: 'trace-table-practice', embedContainerId: `${P}-embed-2`,
  embedQuery: 'view=practice&lang=cambridge&support=1', embedView: 'practice',
  algorithm: {
    title: 'Trace the Hot Days',
    context: `This program counts the hot days: 30 degrees or more. The user types ${ACT2_IN.join(', ')}. Trace it. Write a row for Hot only when Hot changes.`,
    code: ['DECLARE Temp : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Hot : INTEGER', 'Hot = 0', 'for Count in range(1, 6):', '    Temp = int(input())', '    if Temp >= 30:', '        Hot = Hot + 1', 'print(Hot)'],
    cols: ['Line', 'Temp', 'Count', 'Hot', 'Output'],
    answers: rows2,
  },
  content: '<h2 class="lesson-h2">Activity 2: Trace the Hot Days</h2>' +
    why('Why must you check the IF line on every pass, even when the last answer was No?', 'Each pass has a new input, so the condition can give a different answer each time.') +
    `<p class="lesson-lead">${mins(6, 'harder: an IF and five inputs. Fill in the trace table, then check it. <strong>Done</strong> when every row is right.')}</p><div id="${P}-embed-2" class="lesson-embed"></div>` });

// ---------------------------------------------------------------- exam-style question
const F4 = { pre: [T('Start'), B('Total <- 0'), B('Count <- 1')], dec: 'Count <= 5?', body: [IO('INPUT Mark'), B('Total <- Total + Mark'), B('Count <- Count + 1')], post: [IO('OUTPUT Total'), T('Stop')] };
assert(flowRun(F4, [3, 4, 5, 6, 7]).outs.join() === '25', 'F4 totals five marks');
steps.push(selfMarked('exam-flow', 'Exam-Style Question: A Flowchart Loop', 'Exam-Style Question: A Flowchart Loop', mins(4, 'answer both parts in full sentences. Use Check my answer.'), [
  { id: 'flow-purpose', prompt: '(a) State the purpose of this flowchart. [2]', marks: 2,
    scheme: ['It inputs 5 marks / five numbers', 'It adds them up / finds the total and outputs the total'],
    guidance: 'One mark for each point. Point 1 needs the number of inputs (5) or "five marks". Do not accept "it loops" or "it adds" alone.',
    modelAnswer: 'It inputs 5 marks and outputs their total.' },
  { id: 'flow-count-why', prompt: '(b) Explain why the box Count ← Count + 1 is needed. [2]', marks: 2,
    scheme: ['Count goes up by 1 on each pass / it counts how many marks have been input', 'So Count reaches 6 and the decision gives No, so the loop stops after 5 marks / without it the loop never stops'],
    guidance: 'One mark for each point. Accept "so the loop ends" with a reason linked to Count for point 2. Do not accept "to add 1" alone.',
    modelAnswer: 'It adds 1 to Count on each pass. When Count reaches 6 the decision is No, so the loop stops.' },
], ['Part (a) has 2 marks. How do you plan the answer?', 'Say what goes in and what comes out: one mark for each.'], flowSvg(F4, -1, 360)));

// ---------------------------------------------------------------- plenary
steps.push(embed('plenary', 'Plenary: Algorithms with Loops Drill', 'drill-y9-3-2-loops', 'Plenary: Algorithms with Loops Drill',
  mins(6, 'answer every card. Get each card right 3 times in a row. Stuck? Switch on <strong>I need help</strong>. Your progress is saved.'),
  ['Why do the cards ask for a value after one pass, not just the output?', 'You must see what every pass does. A wrong value in one pass makes every value after it wrong.']));

// ---------------------------------------------------------------- lesson self-checks
const V = (k, i, s) => { const v = validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern; return new RegExp(v.source, v.flags).test(s); };
assert(V('do-now', 0, '8') && !V('do-now', 0, '7') && V('do-now', 1, 'SONGKHLA') && V('do-now', 1, '"SONGKHLA"') && !V('do-now', 1, 'Songkhla'), 'do-now');
assert(V('do-now-2', 0, '3') && !V('do-now-2', 0, '2') && V('do-now-2', 1, '1') && !V('do-now-2', 1, '3'), 'do-now-2');
assert(V('check-flow', 0, '4 times') && !V('check-flow', 0, '5') && V('check-flow', 1, '12') && V('check-flow', 2, '5') && !V('check-flow', 2, '4'), 'check-flow');
assert(V('check-if', 0, '3') && V('check-if', 1, '15') && !V('check-if', 1, '21') && V('check-if', 2, '18') && !V('check-if', 2, '15'), 'check-if');
{ const t = JSON.stringify(WT1.steps); assert(!/\b8\b|SONGKHLA|Songkhla/.test(t), 'walkthrough 1 shows a Do Now answer'); }
{ const t = WT2.steps.map((x) => x.text).join(' '); assert(!/\b(3|1)\b/.test(t.replace(/Pass \d/g, '').replace(/Count = 1/g, '').replace(/stays 1/g, '')) && !/\b50\b/.test(t), 'walkthrough 2 shows a Do Now answer'); }
const mcCorrect = steps.filter((s) => s.type === 'multiple-choice').flatMap((s) => s.items.map((i) => i.correct));
assert(new Set(mcCorrect).size > 1, 'MC correct positions vary');
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
const text = (s) => JSON.stringify([s.content, s.items || '', s.walkthrough || '', s.stepperSteps || '', s.algorithm || '']);
const firstAt = (rx) => steps.findIndex((s) => rx.test(text(s)));
const at = (id) => steps.findIndex((s) => s.id === id);
assert(firstAt(/decision/i) === at('watch'), 'decision before it is taught');
assert(firstAt(/flowchart/i) >= at('title'), 'flowchart in the Do Now');
const all = JSON.stringify(steps) + JSON.stringify(validators);
assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV|SUBSTRING)\b/.test(all), 'a construct Year 9 has not met');
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'em or en dash');

const lesson = { id: ID, label: '3.2: Algorithms with Loops', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ================================================================= the plenary drill
function DRILL_PLENARY() {
// Year 9, 3.2: Algorithms with Loops (the lesson's plenary)
// Loaded by Drills/index.html?drill=y9-3-2-loops
// Generated by tools/build_y9_3_2.mjs: edit that, then run it.
// Four categories, mirroring the lesson: counting the passes, matching a flowchart loop to a FOR line, tracing the
// values, and loops with an IF. Every output comes from running the card's program in shared/pseudocode-engine.js.
DrillData.register("y9-3-2-loops", {
  title: "Year 9, 3.2: Algorithms with Loops",
  subtitle: "Follow flowchart and FOR loops, and trace the values on every pass",
  choiceOnly: true,
  // Haiku second check on typed answers the keyword check rejects; each card waits for Next question.
  aiFallback: true,
  waitForNext: true,
  categories: [
    ["lp-pass", "Count the Passes"],
    ["lp-match", "Flowchart to FOR"],
    ["lp-trace", "Trace the Values"],
    ["lp-if", "Loops with IF"]
  ],
  cards: (function () {
    var A = "←";
    function show(lines) { return lines.join("\n").replace(/<-/g, A); }
    function numbered(lines) { return lines.map(function (l, i) { return (i < 9 ? "0" : "") + (i + 1) + " " + l; }); }
    function run(lines, inputs) {
      var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String));
      if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
      return r.outputs.map(String);
    }
    function others(ans, list) {
      var outv = [], a = String(ans);
      list.concat([Number(ans) + 1, Number(ans) - 1, Number(ans) + 2, Number(ans) + 3]).forEach(function (v) {
        var s = String(v);
        if (s !== a && Number(v) >= 0 && outv.indexOf(s) === -1 && outv.length < 3) outv.push(s);
      });
      return outv;
    }
    function forRe(s, e) { return new RegExp("^\\s*for\\s+count\\s*(<-|←|<--|=)\\s*" + s + "\\s+to\\s+" + e + "\\s*\\.?\\s*$", "i"); }
    function forLine(s, e) { return "FOR Count " + A + " " + s + " TO " + e; }
    function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    return [
      // ------------------------------------------------ Count the Passes
      { id: "p-runs", category: "lp-pass", randomize: function () {
          var s = ri(1, 4), e = s + ri(3, 7), lines = ["DECLARE Count : INTEGER", "DECLARE Total : INTEGER", "Total <- 0", "FOR Count <- " + s + " TO " + e, "    Total <- Total + 2", "NEXT Count", "OUTPUT Total"];
          var n = e - s + 1;
          return { prompt: "How many times does line 5 run?\n" + show(numbered(lines)), answers: [String(n)], keywords: [drillNumberRe(n)],
            distractors: others(n, [e - s, e, n + 1]),
            working: ["Write the values Count takes, from the first to the last.", "Count them. Both ends are included."], note: "Count takes every value from " + s + " to " + e + ": that is " + n + " passes." };
        } },
      { id: "p-stop", category: "lp-pass", randomize: function () {
          var s = ri(1, 3), e = s + ri(2, 6), lt = Math.random() < 0.4, ans = lt ? e : e + 1;
          var dec = lt ? "Count < " + e + "?" : "Count <= " + e + "?";
          return { prompt: "A flowchart sets Count " + A + " " + s + ". Its decision is " + dec + " Yes runs the loop, which ends with Count " + A + " Count + 1 and an arrow back to the decision. What is Count when the decision first says No?",
            answers: [String(ans)], keywords: [drillNumberRe(ans)], distractors: others(ans, [ans - 1, ans + 1, s]),
            working: ["The loop keeps going while the answer is Yes.", "Find the first value of Count that makes the decision No."], note: "The first value that gives No is " + ans + "." };
        } },
      { id: "p-why", category: "lp-pass", pickThenType: true,
        prompt: "Why does a flowchart loop need the box Count ← Count + 1?",
        answers: ["So Count changes and the decision becomes No, so the loop stops"],
        keywords: [/^(?=.*\b(stop|stops|end|ends|finish|finishes|forever|never|leave|leaves|exit|exits)\b)(?=.*\b(count|counter|decision|no|change|changes|increase|increases|bigger|grows)\b)/i],
        distractors: ["So the output is one bigger", "So Count starts at 1", "So Total is added up first"],
        working: ["What would happen to Count if that box was taken out?", "Would the decision ever give a different answer?"],
        note: "Count must change, or the decision gives the same answer every time and the loop never stops." },
      // ------------------------------------------------ Flowchart to FOR
      { id: "m-le", category: "lp-match", randomize: function () {
          var s = ri(1, 4), e = s + ri(3, 6);
          var ds = [forLine(s, e + 1), forLine(s, e - 1), forLine(s === 1 ? 0 : 1, e)];
          return { prompt: "A flowchart sets Count " + A + " " + s + ". Its decision is Count <= " + e + "? The loop adds 1 to Count each pass. Which FOR line does the same?",
            answers: [forLine(s, e)], keywords: [forRe(s, e)], distractors: ds,
            working: ["The first value is the one Count is set to.", "Is Count = " + e + " a Yes or a No for Count <= " + e + "?"], note: "<= " + e + " includes " + e + ", so " + s + " TO " + e + "." };
        } },
      { id: "m-lt", category: "lp-match", randomize: function () {
          var s = ri(1, 3), e = s + ri(4, 7);
          var ds = [forLine(s, e), forLine(s, e + 1), forLine(s - 1, e - 1)];
          return { prompt: "A flowchart sets Count " + A + " " + s + ". Its decision is Count < " + e + "? The loop adds 1 to Count each pass. Which FOR line does the same?",
            answers: [forLine(s, e - 1)], keywords: [forRe(s, e - 1)], distractors: ds,
            working: ["Is Count = " + e + " a Yes or a No for Count < " + e + "?", "The last Yes pass is the last value in the FOR line."], note: e + " < " + e + " is FALSE, so the last pass is " + (e - 1) + ": " + s + " TO " + (e - 1) + "." };
        } },
      { id: "m-back", category: "lp-match", pickThenType: true,
        prompt: "In a flowchart loop, why does the arrow after the last box go back to the decision?",
        answers: ["So the decision is checked again, to see if the steps repeat"],
        keywords: [/^(?=.*\b(check|checks|checked|ask|asks|asked|test|tests|tested|question)\b)(?=.*\b(again|repeat|repeats|another|next|each)\b)/i],
        distractors: ["So the flowchart can end", "So Count goes back to 1", "So the output is shown first"],
        working: ["What happens at the decision each time the arrow reaches it?", "How does the flowchart know whether to run the boxes again?"],
        note: "The arrow takes it back to the decision, which is checked again: Yes repeats the boxes, No leaves the loop." },
      // ------------------------------------------------ Trace the Values
      { id: "t-add", category: "lp-trace", randomize: function () {
          var s = ri(0, 10), k = ri(2, 6), n = ri(3, 5);
          var lines = ["DECLARE Total : INTEGER", "DECLARE Count : INTEGER", "Total <- " + s, "FOR Count <- 1 TO " + n, "    Total <- Total + " + k, "NEXT Count", "OUTPUT Total"], o = run(lines)[0];
          return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [s + k * (n - 1), k * n, s + k * (n + 1)]),
            working: ["Write Total after each pass in a trace table.", "Total starts at " + s + " and changes once per pass."], note: s + " + " + n + " lots of " + k + " = " + o + "." };
        } },
      { id: "t-pass", category: "lp-trace", randomize: function () {
          var s = ri(10, 30), n = 4, p = ri(2, 3), v = s, vals = [];
          for (var c = 1; c <= n; c++) { v = v - c; vals.push(v); }
          var lines = ["DECLARE Score : INTEGER", "DECLARE Count : INTEGER", "Score <- " + s, "FOR Count <- 1 TO " + n, "    Score <- Score - Count", "NEXT Count", "OUTPUT Score"];
          var ans = vals[p - 1];
          return { prompt: "What is Score at the end of pass " + p + "?\n" + show(numbered(lines)), answers: [String(ans)], keywords: [drillNumberRe(ans)],
            distractors: others(ans, [s - p, vals[p - 2], vals[p]]),
            working: ["Pass 1 has Count = 1, pass 2 has Count = 2.", "Take Count away from the Score in the row above."], note: "Score goes " + s + ", " + vals.join(", ") + ". After pass " + p + " it is " + ans + "." };
        } },
      { id: "t-out", category: "lp-trace", randomize: function () {
          var s = ri(1, 9), k = ri(2, 3);
          var lines = ["DECLARE Number : INTEGER", "DECLARE Count : INTEGER", "Number <- " + s, "FOR Count <- 1 TO 4", "    Number <- Number + Count", "    OUTPUT Number", "NEXT Count"], o = run(lines), ans = o[k - 1];
          return { prompt: "Line 6 outputs a value on every pass. What is value number " + k + " that it outputs?\n" + show(numbered(lines)), answers: [ans], keywords: [drillNumberRe(Number(ans))],
            distractors: others(ans, [o[k - 2], o[k], s + k]),
            working: ["Number changes before it is output on each pass.", "Pass " + k + " adds Count = " + k + " to the Number from pass " + (k - 1) + "."], note: "It outputs " + o.join(", ") + ". Value " + k + " is " + ans + "." };
        } },
      { id: "t-two", category: "lp-trace", randomize: function () {
          var a = ri(1, 5), b = ri(1, 4);
          var lines = ["DECLARE A : INTEGER", "DECLARE B : INTEGER", "DECLARE Count : INTEGER", "A <- " + a, "B <- " + b, "FOR Count <- 1 TO 3", "    A <- A + B", "    B <- B + 1", "NEXT Count", "OUTPUT A"], o = run(lines)[0];
          return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [a + 3 * b, Number(o) - b - 2, Number(o) + b + 3]),
            working: ["Use a trace table with a column for A and a column for B.", "B changes on every pass, so A gets a bigger amount each time."], note: "A: " + a + ", " + (a + b) + ", " + (a + 2 * b + 1) + ", " + o + "." };
        } },
      // ------------------------------------------------ Loops with IF
      { id: "i-count", category: "lp-if", randomize: function () {
          var t = drillPick([40, 50, 60]), ge = Math.random() < 0.5, op = ge ? ">=" : ">";
          var ins = [t, t - ri(1, 9), t + ri(1, 20), t, t - ri(10, 20)].sort(function () { return Math.random() - 0.5; });
          var lines = ["DECLARE Mark : INTEGER", "DECLARE Index : INTEGER", "DECLARE Count : INTEGER", "Count <- 0", "FOR Index <- 1 TO 5", "    INPUT Mark", "    IF Mark " + op + " " + t + " THEN", "        Count <- Count + 1", "    ENDIF", "NEXT Index", "OUTPUT Count"], o = run(lines, ins)[0];
          return { prompt: "The user types " + ins.join(", ") + ". What does the program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [ge ? 1 : 3, 5, 2]),
            working: ["Check each mark against line 7, one pass at a time.", "Is " + t + " " + op + " " + t + " TRUE?"], note: t + " " + op + " " + t + " is " + (ge ? "TRUE" : "FALSE") + ". It outputs " + o + "." };
        } },
      { id: "i-sum", category: "lp-if", randomize: function () {
          var n = ri(5, 7), t = ri(2, n - 2), ge = Math.random() < 0.5, op = ge ? ">=" : ">";
          var lines = ["DECLARE Count : INTEGER", "DECLARE Total : INTEGER", "Total <- 0", "FOR Count <- 1 TO " + n, "    IF Count " + op + " " + t + " THEN", "        Total <- Total + Count", "    ENDIF", "NEXT Count", "OUTPUT Total"], o = run(lines)[0];
          var other = 0, all = 0; for (var c = 1; c <= n; c++) { all += c; if (ge ? c > t : c >= t) other += c; }
          return { prompt: "What does this program output?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [other, all, Number(o) - n]),
            working: ["Write the values of Count that make line 5 TRUE.", "Add up only those values."], note: "Count " + op + " " + t + " is TRUE for " + (ge ? t : t + 1) + " to " + n + ", so Total is " + o + "." };
        } },
      { id: "i-runs", category: "lp-if", randomize: function () {
          var n = ri(6, 10), t = ri(2, n - 2), ge = Math.random() < 0.5, op = ge ? ">=" : ">";
          var lines = ["DECLARE Count : INTEGER", "DECLARE Hits : INTEGER", "Hits <- 0", "FOR Count <- 1 TO " + n, "    IF Count " + op + " " + t + " THEN", "        Hits <- Hits + 1", "    ENDIF", "NEXT Count", "OUTPUT Hits"], o = run(lines)[0];
          return { prompt: "How many times does line 6 run?\n" + show(numbered(lines)), answers: [o], keywords: [drillNumberRe(Number(o))],
            distractors: others(o, [n, ge ? Number(o) - 1 : Number(o) + 1, n - t + (ge ? 0 : 1)]),
            working: ["The IF line is checked on every pass. The line inside it runs only when it is TRUE.", "Which values from 1 to " + n + " make Count " + op + " " + t + " TRUE?"], note: "Count " + op + " " + t + " is TRUE " + o + " times, so line 6 runs " + o + " times." };
        } },
      { id: "i-why", category: "lp-if", pickThenType: true,
        prompt: "A loop runs 8 times. Why might the line inside its IF run fewer than 8 times?",
        answers: ["The IF is checked every pass, but the line inside runs only when the condition is TRUE"],
        keywords: [/^(?=.*\b(only|when|if)\b)(?=.*\b(true|condition|yes|met)\b)/i],
        distractors: ["The loop stops early when the IF is FALSE", "The IF line is checked only once", "NEXT skips every other pass"],
        working: ["Is the IF line reached on every pass?", "What decides whether the line inside it runs?"],
        note: "The loop reaches the IF on all 8 passes, but the line inside runs only on the passes where the condition is TRUE." }
    ];
  })()
});
}

const DRILL_DIR = path.join(ROOT, 'Drills', 'data');
function writeDrill(id, fn) {
  const src = fn.toString();
  const body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}')).replace(/^\r?\n/, '').replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n';
  assert(!/[–—]|&mdash;|&ndash;/.test(body), `em or en dash in ${id}`);
  assert(!/\b(WHILE|ENDWHILE|REPEAT|UNTIL|STEP|MOD|DIV|SUBSTRING)\b/.test(body), `a construct Year 9 has not met in ${id}`);
  fs.writeFileSync(path.join(DRILL_DIR, id + '.js'), body);
  return body;
}
const drillSrc = { 'y9-3-2-loops': writeDrill('y9-3-2-loops', DRILL_PLENARY) };
const registered = {};
const ctx = vm.createContext({ console, Math, JSON, DrillData: { register: (id, d) => { registered[id] = d; } } });
ctx.window = ctx;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
for (const [id, src] of Object.entries(drillSrc)) vm.runInContext(src, ctx, { filename: id + '.js' });
const typedMatch = (card, s) => (card.keywords || []).some((k) => k.test(s));
{
  const d = registered['y9-3-2-loops'];
  for (const card of d.cards) {
    for (let t = 0; t < (card.randomize ? 300 : 1); t++) {
      const c = card.randomize ? { ...card, ...card.randomize() } : card;
      const where = `y9-3-2-loops ${card.id}`;
      assert(c.prompt && c.answers && c.answers.length && c.keywords && c.keywords.length, where + ' fields');
      assert(typedMatch(c, c.answers[0]), `${where}: own answer "${c.answers[0]}" fails its keywords`);
      assert(c.distractors && c.distractors.length === 3, `${where}: three distractors (${c.distractors})`);
      for (const x of c.distractors) assert(!typedMatch(c, x) && x !== c.answers[0], `${where}: distractor "${x}" passes`);
      assert(new Set(c.distractors).size === 3, `${where}: repeated distractor`);
      assert(c.working && c.working.length === 2, where + ' two working nudges');
      const ansRe = new RegExp('(^|[^\\w.-])' + String(c.answers[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w|\\.\\d)');
      if (!ansRe.test(c.prompt)) for (const w of c.working) assert(!ansRe.test(w), `${where}: working shows the answer: ${w}`);
    }
  }
  const card = (cid) => d.cards.find((c) => c.id === cid);
  const ok = (cid, s) => typedMatch(card(cid), s);
  for (const s of ['so Count gets bigger and the loop stops', 'so Count changes and the loop ends', 'otherwise the decision never says no and it loops forever']) assert(ok('p-why', s), 'p-why accepts ' + s);
  for (const s of ['to add 1', 'so count is bigger', 'so the loop stops']) assert(!ok('p-why', s), 'p-why rejects ' + s);
  for (const s of ['so the decision is checked again', 'to ask the question again', 'so it can test whether to repeat']) assert(ok('m-back', s), 'm-back accepts ' + s);
  for (const s of ['to go back', 'so it repeats']) assert(!ok('m-back', s), 'm-back rejects ' + s);
  for (const s of ['it only runs when the condition is true', 'the line runs only if it is TRUE']) assert(ok('i-why', s), 'i-why accepts ' + s);
  for (const s of ['the loop is shorter', 'because of the IF']) assert(!ok('i-why', s), 'i-why rejects ' + s);
}

// ================================================================= register the lesson after 3.1
const lp = path.join(ROOT, 'LessonData', 'lessons.json');
const raw = fs.readFileSync(lp, 'utf8');
const allL = JSON.parse(raw);
const indent = (raw.match(/\n( +)"/) || [, ' '])[1];
const nl = raw.includes('\r\n') ? '\r\n' : '\n';
const y9 = allL.years.find((y) => y.id === 'year9');
const unit = y9.units.find((u) => u.title === 'Pseudocode and Software Development');
assert(unit && unit.lessons.includes('y9-3-1-pseudocode'), 'the 3.1 unit is missing');
if (!unit.lessons.includes(ID)) unit.lessons.splice(unit.lessons.indexOf('y9-3-1-pseudocode') + 1, 0, ID);
fs.writeFileSync(lp, JSON.stringify(allL, null, indent).replace(/\n/g, nl) + (/\r?\n$/.test(raw) ? nl : ''));
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets; drills: ` +
  Object.entries(registered).map(([k, d]) => `${k} (${d.cards.length})`).join(', ') + `; unit: ${unit.lessons.join(', ')}`);
