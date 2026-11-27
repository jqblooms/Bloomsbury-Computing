// Builds LessonData/y9-3-r.json: Year 9, 3.R: Pseudocode and Loops Review, a 60-minute lesson the students do on their
// own (no teacher in the room), and registers it as the last lesson of the Year 9 "Pseudocode and Software Development"
// unit, after y9-3-2-loops.
//   node tools/build_y9_3_r.mjs
// Shape: two Do Now slides (3.1 follow and correct, 3.2 a loop with an IF), each with a Walk me through it on a different
// program that never shows the answer; a title slide that says how today works; a short walk-through of 3.1 (one idea a
// slide, predict then the reason is shown), then Data Bridge 3D on set y9-pseudocode; the same for 3.2 and set y9-loops;
// a long Data Bridge 3D slide on the combined set y9-term1b-revision (shell ExamGameSetY9Term1bRevision.gs); then the
// 3.2 plenary drill. Programs, examples and wording come from tools/build_y9_3_1.mjs and tools/build_y9_3_2.mjs.
// A teacher-only Think, Pair, Share under every heading never gives a slide answer.
// Every pseudocode output comes from shared/pseudocode-engine.js, every flowchart is run by flowRun below.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, assert, facts, columns, note, tps, table, outs, num, makeLesson, plain, checkLesson } from './y8_unit2_kit.mjs';

const ID = 'y9-3-r';
const AFTER = 'y9-3-2-loops';
const P = 'y9l3r';
const TITLE = '3.R: Pseudocode and Loops Review';
const { validators, checkStep, embed, V } = makeLesson(P);
const steps = [];
const mins = (n, what) => `<strong>${n} minute${n === 1 ? '' : 's'}. What to do:</strong> ${what}`;
const why = (q, a) => tps(q, `<p>${a}</p>`);
const addTps = (s, q, a) => { s.content = s.content.replace('</h2>', '</h2>' + why(q, a)); return s; };
const A = '&larr;';
const esc = (s) => String(s).replace(/&(?!(larr|nbsp|amp|lt|gt);)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// A boxed program with 01, 02 line numbers (as in the 3.1 and 3.2 lessons); hlLines are 1-based lines to highlight.
function code(lines, hlLines = [], tight = false) {
  return `<div class="lesson-code"${tight ? ' style="line-height:1.2;padding-top:6px;padding-bottom:6px"' : ''}>` + lines.map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    return `<div class="lesson-code-line${hlLines.includes(i + 1) ? ' wt-hl' : ''}">` + String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' +
      '&nbsp;'.repeat(lead) + esc(l.trim()).replace(/&lt;-/g, A) + '</div>';
  }).join('') + '</div>';
}
const tip = (lines) => `<p style="margin:8px 0 0;font-size:17px;line-height:1.45">${lines.join('<br>')}</p>`;
const label = (t) => `<p style="margin:4px 0 2px;font-weight:700">${t}</p>`;
const one = (lines, inputs) => { const o = outs(lines, inputs); assert(o.length === 1, 'one output: ' + o.join()); return o[0]; };
// A one-question predict slide: the reason (explain) shows once the student has chosen.
function mc(id, heading, lead, item, whyQA, left = '', above = '', top = '') {
  const cid = `${P}-${id}`;
  return { id, label: heading, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${heading}</h2>` + why(whyQA[0], whyQA[1]) + `<p class="lesson-lead">${lead}</p>` +
      (left ? columns(left, `${above}<div id="${cid}"></div>`) : `${top}<div id="${cid}"></div>`), items: [item] };
}

// ---------------------------------------------------------------- flowcharts (from tools/build_y9_3_2.mjs)
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
  f.pre.forEach((n) => { box(cx, y, n); y += bh; out.push(line([[cx, y], [cx, y + gap]])); y += gap; });
  const dy = y; const di = k++;
  out.push(`<polygon points="${cx},${dy} ${cx + dw / 2},${dy + dh / 2} ${cx},${dy + dh} ${cx - dw / 2},${dy + dh / 2}" style="${style(di)}"/>` + text(cx, dy + dh / 2, f.dec));
  y = dy + dh;
  out.push(line([[cx, y], [cx, y + gap]]) + `<text x="${cx + 8}" y="${y + 11}" style="fill:var(--muted);font:700 12px var(--font-body, sans-serif)">Yes</text>`);
  y += gap;
  f.body.forEach((n, j) => { box(cx, y, n); y += bh; if (j < f.body.length - 1) { out.push(line([[cx, y], [cx, y + gap]])); y += gap; } });
  out.push(line([[cx, y], [cx, y + 12], [14, y + 12], [14, dy + dh / 2], [cx - dw / 2, dy + dh / 2]]));
  const bottom = y + 16;
  let py = dy + dh / 2;
  out.push(line([[cx + dw / 2, py], [px, py], [px, py + 30]]) + `<text x="${cx + dw / 2 + 12}" y="${py - 7}" style="fill:var(--muted);font:700 12px var(--font-body, sans-serif)">No</text>`);
  py += 30;
  f.post.forEach((n, j) => { box(px, py, n); py += bh; if (j < f.post.length - 1) { out.push(line([[px, py], [px, py + gap]])); py += gap; } });
  const H = Math.max(bottom, py + 6);
  return `<svg viewBox="0 0 440 ${H}" role="img" aria-label="Flowchart" style="display:block;width:100%;max-width:440px;max-height:${maxH}px;margin:0 auto">` +
    `<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--ink)"/></marker></defs>` + out.join('') + '</svg>';
}
function flowRun(f, inputs = []) {
  const v = {}; const o = []; let yes = 0; const ins = inputs.slice();
  const val = (e) => Function(...Object.keys(v), `return (${e.replace(/<>/g, '!=').replace(/(^|[^<>!])=(?!=)/g, '$1==')});`)(...Object.values(v));
  const exec = (t) => {
    let m;
    if ((m = t.match(/^(\w+) <- (.+)$/))) v[m[1]] = val(m[2]);
    else if ((m = t.match(/^INPUT (\w+)$/))) v[m[1]] = Number(ins.shift());
    else if ((m = t.match(/^OUTPUT (.+)$/))) o.push(String(val(m[1])));
  };
  f.pre.forEach((n) => n.k !== 'term' && exec(n.t));
  while (val(f.dec.replace(/\?$/, ''))) { yes++; f.body.forEach((n) => exec(n.t)); assert(yes < 100, 'flowchart stops'); }
  f.post.forEach((n) => n.k !== 'term' && exec(n.t));
  return { v, outs: o, yes };
}
const T = (t) => ({ k: 'term', t }), B = (t) => ({ k: 'proc', t }), IO = (t) => ({ k: 'io', t });

// ---------------------------------------------------------------- Do Now 1 (3.1): follow it exactly, then correct it
const DN1 = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 6', '    Total <- Total + 2', 'NEXT Count', 'OUTPUT Total'];
const DN1fix = DN1.map((l, i) => i === 4 ? '    Total <- Total + Count' : l);
assert(one(DN1) === '12' && one(DN1fix) === '21', 'do-now 1 outputs');
const WDN1 = ['DECLARE Sum : INTEGER', 'DECLARE Num : INTEGER', 'Sum <- 0', 'FOR Num <- 2 TO 4', '    Sum <- Sum + 10', 'NEXT Num', 'OUTPUT Sum'];
assert(one(WDN1) === '30' && one(WDN1.map((l, i) => i === 4 ? '    Sum <- Sum + Num' : l)) === '9', 'walk 1 outputs');
const WT1 = { title: 'Walk me through it: follow it, then find the error', steps: [
  { text: 'This is a different program. It <strong>should</strong> add up 2, 3 and 4. Follow what each line <strong>says</strong>, not what it should do.', visual: code(WDN1) },
  { text: 'Sum is set to 0 once, before the loop.', visual: code(WDN1, [3]) + note('Sum = 0') },
  { text: 'The loop runs with Num = 2, then Num = 3, then Num = 4. On each pass the line inside the loop adds 10. It never uses Num.', visual: code(WDN1, [4, 5]) + note('Sum = 10, then 20, then 30') },
  { text: 'As written, it outputs 30. It should output 2 + 3 + 4 = 9. The value first goes wrong on the line inside the loop.', visual: code(WDN1, [5, 7]) + note('Output as written: 30') },
  { text: 'The fix: that line must add the loop variable, not a fixed number. Trace again to prove it gives 9. Now do the same steps with your program.', visual: code(WDN1, [5]) },
] };
steps.push(addTps(checkStep('do-now', 'Do Now: Question 1', 'Do Now: Follow It, Then Correct It',
  mins(4, 'from 3.1. The program <strong>should</strong> add up 1, 2, 3, 4, 5 and 6. First follow it exactly as it is written. Stuck? Press <strong>Walk me through it</strong>. <strong>Done</strong> when Check answers gives 3 marks.'), [
  { label: 'What does it output, exactly as written?', answer: num(12), feedback: 'Do not add what it should add. Follow line 5 on every pass: what does it really add?' },
  { line: true, label: 'Which line causes the wrong result? Give the line number.', answer: '^\\s*(line\\s*)?0?5\\s*\\.?\\s*$', feedback: 'Find the line where Total first gets a wrong value.' },
  { line: true, label: 'Write the correct line.', answer: '^\\s*total\\s*(<-|\\u2190|&larr;)\\s*(total\\s*\\+\\s*count|count\\s*\\+\\s*total)\\s*$', feedback: 'On each pass Total must keep what it had and add the loop variable.' },
], code(DN1)), 'Why must you follow what each line says, and not what the program should do?', 'The computer only does what the lines say. You can only see an error if you trace what really happens.'));
steps.at(-1).walkthrough = WT1;

// ---------------------------------------------------------------- Do Now 2 (3.2): a loop with an IF
const DN2 = ['DECLARE Count : INTEGER', 'DECLARE Total : INTEGER', 'Total <- 0', 'FOR Count <- 2 TO 8', '    IF Count >= 6 THEN', '        Total <- Total + Count', '    ENDIF', 'NEXT Count', 'OUTPUT Total'];
const DN2gt = DN2.map((l) => l.replace('>= 6', '> 6'));
assert(one(DN2) === '21' && one(DN2gt) === '15', 'do-now 2 outputs');
const WDN2 = ['DECLARE Num : INTEGER', 'DECLARE Sum : INTEGER', 'Sum <- 0', 'FOR Num <- 1 TO 5', '    IF Num >= 4 THEN', '        Sum <- Sum + Num', '    ENDIF', 'NEXT Num', 'OUTPUT Sum'];
const WDN2gt = WDN2.map((l) => l.replace('>= 4', '> 4'));
assert(one(WDN2) === '9' && one(WDN2gt) === '5', 'walk 2 outputs');
const WT2 = { title: 'Walk me through it: a loop with an IF', steps: [
  { text: 'This is a different program. Num goes from 1 to 5. Check the IF line on every pass.', visual: code(WDN2, [4, 5]) + note('Sum = 0') },
  { text: 'While Num is less than 4, Num &gt;= 4 is FALSE. The line inside the IF does not run, so Sum stays 0.', visual: code(WDN2, [5]) + note('Sum = 0') },
  { text: 'Num = 4: 4 &gt;= 4 is TRUE, because 4 is equal to 4. Sum = 0 + 4 = 4. Num = 5: TRUE again. Sum = 4 + 5 = 9.', visual: code(WDN2, [5, 6]) + note('The IF was TRUE 2 times. Sum = 9') },
  { text: 'The loop ends, and the last line outputs Sum.', visual: code(WDN2, [9]) + note('Output: 9') },
  { text: 'With &gt; 4, the pass with Num = 4 is FALSE: 4 is not more than 4. Only 5 is added, so it outputs 5. Now trace your program the same way.', visual: code(WDN2gt, [5]) + note('Output: 5') },
] };
steps.push(addTps(checkStep('do-now-2', 'Do Now: Question 2', 'Do Now: A Loop with an IF',
  mins(4, 'from 3.2. Trace the loop. Check the IF line on every pass. Stuck? Press <strong>Walk me through it</strong>. <strong>Done</strong> when Check answers gives 3 marks.'), [
  { label: 'How many times does line 6 run?', answer: num(3), feedback: 'Line 6 runs only when the IF on line 5 is TRUE. Check every Count from 2 to 8.' },
  { label: 'What does the program output?', answer: num(21), feedback: 'Add up only the values of Count where the IF is TRUE.' },
  { line: true, label: 'Line 5 is changed to IF Count &gt; 6 THEN. What does it output now?', answer: num(15), feedback: 'Is 6 &gt; 6 TRUE? Check the value on the line again.' },
], code(DN2)), 'Why do you check the IF line again on every pass of the loop?', 'The loop variable changes on every pass, so the condition can be TRUE on one pass and FALSE on the next.'));
steps.at(-1).walkthrough = WT2;

// ---------------------------------------------------------------- title: how today works
steps.push({ id: 'title', label: TITLE,
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Pseudocode and Software Development</p><h2 class="lesson-h2">Pseudocode and Loops Review</h2><p>Year 9, 3.R</p></div>' +
    why('Why is it useful to review two lessons before you learn something new?', 'New work builds on old work. A gap you fix now will not stop you later.') +
    facts([mins(1, 'read this slide, then press Next.'),
      '<strong>Today you work on your own.</strong> The slides teach you. Read each slide, answer it, then press Next.',
      '<strong>Part 1:</strong> 3.1 Following and Correcting Pseudocode, then <strong>Data Bridge 3D</strong>. <strong>Part 2:</strong> 3.2 Algorithms with Loops, then Data Bridge 3D. Then more Data Bridge 3D.',
      '<strong>Stuck in Data Bridge 3D?</strong> On the start screen press <strong>Start Learn mode</strong>. It shows a worked example and gives free help. It does not count, so go back to Play when you can.',
      '<strong>Notes:</strong> press the <strong>pen icon</strong> at the top. Write down every mistake and the reason.']) });

// ---------------------------------------------------------------- 3.1 walk-through
const L1 = ['DECLARE A : INTEGER', 'DECLARE B : INTEGER', 'A <- 6', 'B <- A', 'A <- A + 3', 'OUTPUT B'];
assert(one(L1) === '6', 'lines output');
steps.push(mc('t31-lines', '3.1: One Line at a Time', mins(1, 'follow the program one line at a time, then choose. <strong>Done</strong> when you have read the reason.'),
  { prompt: 'Predict: what does line 6 output?', options: ['6', '9', '0'], correct: 0,
    explain: 'Line 4 copies 6 into B. Line 5 changes only A, so B is still 6.' },
  ['Why does a line change only the variable on the left of the arrow?', 'The arrow means: work out the right side, then store the result in the variable on the left. No other variable is touched.'],
  code(L1) + tip(['One line at a time, from the top.', 'A line changes <strong>only</strong> the variable on the left of the arrow.'])));

const OA = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'Number <- 2', 'FOR Count <- 1 TO 3', '    Number <- Number * 3', '    OUTPUT Number', 'NEXT Count'];
const OB = ['DECLARE Number : INTEGER', 'DECLARE Count : INTEGER', 'Number <- 2', 'FOR Count <- 1 TO 3', '    Number <- Number * 3', 'NEXT Count', 'OUTPUT Number'];
assert(outs(OA).join() === '6,18,54' && outs(OB).join() === '54', 'order outputs');
steps.push(mc('t31-order', '3.1: Inside or After the Loop?', mins(2, 'only one line has moved. Predict, then read the reason. <strong>Done</strong> when you can say what A and B output.'),
  { prompt: 'Predict: how many numbers does program A output?', options: ['3', '1', '4'], correct: 0,
    explain: 'In A, OUTPUT is inside the loop, so it runs on every pass: 6, 18, 54. In B, it is after NEXT, so it runs once: 54.' },
  ['Why can moving just one line change what a program does?', 'The computer follows the lines in order. A line in a new place runs at a different time, or a different number of times.'],
  label('Program A') + code(OA, [], true) + label('Program B') + code(OB, [], true)));

const BA = ['DECLARE Age : INTEGER', 'INPUT Age', 'IF Age > 13 THEN', '    OUTPUT "Join"', 'ELSE', '    OUTPUT "Too young"', 'ENDIF'];
const BB = BA.map((l) => l.replace('> 13', '>= 13'));
assert(one(BA, [13]) === 'Too young' && one(BB, [13]) === 'Join' && one(BA, [20]) === one(BB, [20]) && one(BA, [5]) === one(BB, [5]), 'boundary outputs');
steps.push(mc('t31-line-value', '3.1: The Value on the Line', mins(2, 'predict, then read the reason. <strong>Done</strong> when you can say why A and B are different.'),
  { prompt: 'Predict: the user types 13. What does program A output?', options: ['Too young', 'Join', 'Join and Too young'], correct: 0,
    explain: '13 > 13 is FALSE: 13 is not more than 13, so A outputs Too young. In B, 13 >= 13 is TRUE, so B outputs Join.' },
  ['Why test the value exactly on the line, and not only values far from it?', 'Values far from the line give the same result in both programs. Only the value on the line shows the difference.'],
  label('Program A') + code(BA, [], true) + label('Program B') + code(BB, [], true)));

const FX = ['DECLARE Price : INTEGER', 'DECLARE Count : INTEGER', 'DECLARE Total : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '    INPUT Price', '    Total <- Price', 'NEXT Count', 'OUTPUT Total'];
const FXfix = FX.map((l, i) => i === 6 ? '    Total <- Total + Price' : l);
assert(one(FX, [7, 5, 9]) === '9' && one(FXfix, [7, 5, 9]) === '21', 'correct outputs');
steps.push(mc('t31-correct', '3.1: Four Steps to Correct a Program', mins(2, 'purpose: input three prices and output their total. The user types 7, 5, 9. It outputs 9, not 21. Use the four steps, then choose. <strong>Done</strong> when you have read the reason.'),
  { prompt: 'Which line causes the wrong result?', options: ['Line 7', 'Line 9', 'Line 4', 'Line 6'], correct: 0,
    explain: 'Line 7 stores only the new Price, so the old total is lost. Line 9 only shows it. Fix: Total ← Total + Price. A new trace outputs 21.' },
  ['Why must you know the purpose of a program before you can correct it?', 'An error is a difference between what a program does and what it should do. Without the purpose there is nothing to compare with.'],
  code(FX) + tip(['<strong>1 Purpose:</strong> what should it output?', '<strong>2 Trace:</strong> follow it exactly as written.', '<strong>3 Find:</strong> the first line that makes a value go wrong.', '<strong>4 Fix and prove:</strong> change that line, then trace again.'])));

// ---------------------------------------------------------------- Data Bridge 3D helper
const HOW = 'Answer the question in the side panel to earn coins. <strong>W A S D</strong> walk, <strong>B</strong> build, <strong>E</strong> use, in the cart hold <strong>Space</strong> on <strong>RED</strong>. Stuck? <strong>Start Learn mode</strong>.';
const db3d = (id, heading, n, set, goal, done, whyQA) => {
  const s = embed(id, heading, 'bridge-builder-3d', heading, mins(n, `${HOW} ${done}`));
  s.embedQuery = `set=${set}&goal=${goal}`;
  return addTps(s, whyQA[0], whyQA[1]);
};
steps.push(db3d('db-pseudocode', 'Data Bridge 3D: Following and Correcting Pseudocode', 12, 'y9-pseudocode', 2,
  '<strong>Done</strong> when you cross 2 gaps in Play. At 13:48, press Next.',
  ['Why trace a program on paper before you type your answer?', 'Each step on paper can be checked. A step done only in your head is easy to get wrong.']));

// ---------------------------------------------------------------- 3.2 walk-through
const F1 = { pre: [T('Start'), B('Total <- 0'), B('Count <- 1')], dec: 'Count <= 3?', body: [B('Total <- Total + 4'), B('Count <- Count + 1')], post: [IO('OUTPUT Total'), T('Stop')] };
const r1 = flowRun(F1);
assert(r1.yes === 3 && r1.outs.join() === '12' && r1.v.Count === 4, 'flowchart 1');
steps.push(mc('t32-flow', '3.2: A Loop in a Flowchart', mins(2, 'follow the flowchart. Say the value of Count and Total each time you reach the decision. Then choose. <strong>Done</strong> when you have read the reason.'),
  { prompt: 'Predict: what is output?', options: ['12', '16', '4'], correct: 0,
    explain: 'Yes for Count = 1, 2 and 3: three passes, adding 4 each time. Then 4 <= 3 is No, so it outputs 12.' },
  ['Why does the arrow go back to the decision, and not back to Start?', 'Going back to Start would set the values back to their start values. The decision checks whether to run the boxes one more time.'],
  flowSvg(F1, -1, 300) + tip(['The arrow back up to the decision makes the <strong>loop</strong>.', '<strong>Yes:</strong> run the boxes again. <strong>No:</strong> leave the loop.'])));

const F2 = { pre: [T('Start'), B('Count <- 3')], dec: 'Count <= 7?', body: [IO('OUTPUT Count'), B('Count <- Count + 1')], post: [T('Stop')] };
const F2P = ['DECLARE Count : INTEGER', 'FOR Count <- 3 TO 7', '    OUTPUT Count', 'NEXT Count'];
assert(flowRun(F2).outs.join() === outs(F2P).join() && outs(F2P).join() === '3,4,5,6,7', 'flowchart 2 matches FOR');
assert(outs(F2P.map((l) => l.replace('3 TO 7', '3 TO 8'))).length === 6, 'FOR 3 TO 8 runs once more');
const CF = { pre: [T('Start'), B('Total <- 0'), B('Count <- 1')], dec: 'Count <= 3?', body: [B('Total <- Total + Count'), B('Count <- Count + 1')], post: [IO('OUTPUT Total'), T('Stop')] };
const CFP = ['DECLARE Total : INTEGER', 'DECLARE Count : INTEGER', 'Total <- 0', 'FOR Count <- 1 TO 3', '    Total <- Total + Count', 'NEXT Count', 'OUTPUT Total'];
assert(flowRun(CF).outs.join() === one(CFP), 'worked flowchart matches FOR');
steps.push(mc('t32-for', '3.2: Flowchart and FOR Loop', mins(2, 'use the table to match a flowchart to a FOR loop, then choose. <strong>Done</strong> when you have read the reason.'),
  { prompt: 'A flowchart sets Count ← 3, asks Count <= 7? and adds 1 each pass. Which FOR line matches?', options: ['FOR Count ← 3 TO 7', 'FOR Count ← 1 TO 7', 'FOR Count ← 3 TO 8'], correct: 0,
    explain: '7 <= 7 is TRUE, so the last pass is 7: 3 TO 7. 3 TO 8 runs once too many.' },
  ['Why can one FOR line replace three boxes in a flowchart?', 'A FOR loop does the three jobs for you: it sets the start value, checks the last value, and adds 1 at NEXT.'],
  table(['<b>Flowchart</b>', '<b>FOR loop</b>'], [['Count &larr; 1', 'FOR Count &larr; 1 ...'], ['Count &lt;= 3?', '... TO 3'], ['Count &larr; Count + 1', 'NEXT Count'], ['Total &larr; Total + Count', 'Total &larr; Total + Count']]) +
    tip(['Same steps, same values, same output.'])));

const TR = ['DECLARE Score : INTEGER', 'DECLARE Count : INTEGER', 'Score <- 30', 'FOR Count <- 1 TO 4', '    Score <- Score - Count', 'NEXT Count', 'OUTPUT Score'];
const TR3 = outs(['DECLARE Score : INTEGER', 'DECLARE Count : INTEGER', 'Score <- 30', 'FOR Count <- 1 TO 3', '    Score <- Score - Count', 'NEXT Count', 'OUTPUT Score'])[0];
assert(TR3 === '24' && one(TR) === '20', 'trace outputs');
const tcell = 'padding:3px 10px;text-align:center';
const traceTable = '<table class="donow-table" style="font-size:16px;width:100%"><tr>' + ['Count', 'Score', 'Output'].map((h) => `<th style="${tcell}">${h}</th>`).join('') + '</tr>' +
  [['', '30', ''], ['1', '29', ''], ['2', '27', ''], ['3', '?', ''], ['4', '?', '?']].map((r) => '<tr>' + r.map((c) => `<td style="${tcell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';
steps.push(addTps(checkStep('t32-trace', '3.2: One Row Each Pass', '3.2: One Row Each Pass',
  mins(3, 'finish the trace table in your head or on paper. Write a new row each time a value changes. Use the value in the row above. <strong>Done</strong> when Check answers gives 2 marks.'), [
  { label: 'What is Score after the pass where Count is 3?', answer: num(24), feedback: 'Start from the row above (27), then take away Count.' },
  { label: 'What does the program output?', answer: num(20), feedback: 'Do one more pass, with Count = 4. OUTPUT is after NEXT, so it runs once.' },
], columns(code(TR), traceTable)), 'Why use the value in the row above, and not the start value?', 'Each pass changes Score, so the next pass starts from the new value.'));

steps.push(db3d('db-loops', 'Data Bridge 3D: Algorithms with Loops', 12, 'y9-loops', 2,
  '<strong>Done</strong> when you cross 2 gaps in Play. At 14:07, press Next.',
  ['Why write a trace table for a loop, even for a short one?', 'Every pass changes the values. A table keeps each value in its own row, so none is lost or mixed up.']));
steps.push(db3d('db-review', 'Data Bridge 3D: Pseudocode and Loops', 9, 'y9-term1b-revision', 3,
  '3.1 and 3.2 mixed. Cross 3 gaps, then keep going. At 14:16, press Next.',
  ['Why mix questions from two lessons, and not do one lesson at a time?', 'In a test the topics come mixed. Choosing the right method yourself is part of the skill.']));

// ---------------------------------------------------------------- plenary
steps.push(addTps(embed('plenary', 'Plenary: Algorithms with Loops Drill', 'drill-y9-3-2-loops', 'Plenary: Algorithms with Loops Drill',
  mins(4, 'answer every card. Get each card right 3 times in a row. Stuck? Switch on <strong>I need help</strong>. Your progress is saved. <strong>Done</strong> when the lesson ends.')),
  'Which mistake from today will you watch for next time, and why?', 'Each person names their own, for example &gt; and &gt;= on the line, because one value can change the output.'));

// ---------------------------------------------------------------- checks
assert(V('do-now', 0, '12') && !V('do-now', 0, '21') && V('do-now', 1, '5') && V('do-now', 1, 'line 05') && !V('do-now', 1, '4'), 'do-now marks');
assert(V('do-now', 2, 'Total <- Total + Count') && V('do-now', 2, 'total ← count + total') && !V('do-now', 2, 'Total <- Total + 2'), 'do-now fix marks');
assert(V('do-now-2', 0, '3') && V('do-now-2', 1, '21') && !V('do-now-2', 1, '35') && V('do-now-2', 2, '15') && !V('do-now-2', 2, '21'), 'do-now-2 marks');
assert(V('t32-trace', 0, '24') && V('t32-trace', 1, '20') && !V('t32-trace', 1, '24'), 'trace marks');
// The walkthroughs never show a Do Now answer (line numbers 01, 02 in the code boxes are not answers).
{
  const wt = (w) => plain(JSON.stringify(w.steps.map((x) => x.text + ' ' + x.visual.replace(/\d\d&nbsp;&nbsp;/g, ''))));
  assert(!/\b12\b|\b21\b|\b5\b|Total|Count \+|\+ Count/.test(wt(WT1)), 'walkthrough 1 leaks an answer');
  assert(!/\b3\b|\b21\b|\b15\b|Count|Total/.test(wt(WT2)), 'walkthrough 2 leaks an answer');
}
{
  // The kit's standing checks (TPS and walkthrough leaks, feedback leaks, MC option lengths, dashes, citations, game names),
  // run on a copy with the code-box line numbers removed from the walkthroughs.
  const copy = JSON.parse(JSON.stringify(steps));
  copy.forEach((s) => s.walkthrough && s.walkthrough.steps.forEach((w) => { w.visual = w.visual.replace(/\d\d&nbsp;&nbsp;/g, ''); }));
  checkLesson(copy, validators);
}
const total = steps.reduce((t, s) => { const m = /<strong>(\d+) minutes?\./.exec(s.content); assert(m, s.id + ' has no minutes'); return t + Number(m[1]); }, 0);
assert(total === 60, 'minutes add to ' + total);
assert(!/data bridge/i.test(TITLE), 'title names a game');
const all = JSON.stringify({ steps, validators });
assert(!/[–—]|&mdash;|&ndash;|mario|[\u{1F300}-\u{1FAFF}☀-➿]/iu.test(all), 'dash, emoji or game mention');
assert(!/WHILE|REPEAT|\/\//.test(all.replace(/https?:/g, '')), 'WHILE, REPEAT or // found');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
for (const s of steps) for (const m of s.content.matchAll(/lesson-code">([\s\S]*?)<\/div><\/div>/g)) {
  const txt = plain(m[1]).replace(/\b\d\d /g, ' ');
  for (const v of txt.matchAll(/\b([A-Z][A-Za-z]*) (?:<-|←)/g)) assert(new RegExp('DECLARE ' + v[1] + ' :').test(txt), `${s.id}: ${v[1]} used without DECLARE`);
}

fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify({ id: ID, label: TITLE, steps, validators, pseudocodeValidators: {} }, null, 1) + '\n');

// Register: the last lesson of "Pseudocode and Software Development", after y9-3-2-loops (a small text edit, re-read now).
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const at = raw.indexOf('"title": "Pseudocode and Software Development"');
    assert(at > 0, 'Pseudocode and Software Development unit');
    const m = new RegExp(`"${AFTER}"(\\r?\\n)([ \\t]*)\\]`).exec(raw.slice(at));
    assert(m && !raw.slice(at + 1, at + m.index).includes('"title"'), AFTER + ' is the last lesson of the unit');
    const ind = (/\n([ \t]*)"y9-3-2-loops"/.exec(raw.slice(at)) || [])[1];
    const insertAt = at + m.index + `"${AFTER}"`.length;
    fs.writeFileSync(lp, raw.slice(0, insertAt) + `,${m[1]}${ind}"${ID}"` + raw.slice(insertAt));
    const unit = JSON.stringify(JSON.parse(fs.readFileSync(lp, 'utf8')));
    assert(unit.includes(`"${AFTER}","${ID}"]`), 'registered');
  }
}
console.log(`${ID}: ${steps.length} steps, ${total} minutes`);
steps.forEach((s) => console.log(`  ${s.id.padEnd(16)} ${(/<strong>(\d+) minutes?\./.exec(s.content) || [])[1]}  ${s.label}${s.appId ? '  [' + s.appId + (s.embedQuery ? ' ' + s.embedQuery : '') + ']' : ''}`));
