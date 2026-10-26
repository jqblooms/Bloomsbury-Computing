// Builds LessonData/y8-comp-practice.json: Year 8, Competition Practice: Contest 2 Games (ACSL Junior Contest 2:
// prefix, infix and postfix; bit-string flicking; What Does This Program Do? loops), its two drills
// (Drills/data/y8-comp-practice-ext.js, the Do Now Extension, and y8-comp-practice.js, the plenary), and registers
// the lesson in a "Competition Practice" unit at the end of Year 8 in lessons.json.
//   node tools/build_y8_comp.mjs
// James, 2026-10-26: competition practice week, "fun and engaging with lots of games". One 55-minute lesson that is
// mostly games: a Do Now with a Walk me through it, the Extension, then for each topic a short trick slide (the rule
// and a why) and a game from the Competition Arcade (CompArcadeY8/, registry id comp-arcade-y8, one game per slide by
// embedQuery mode=<name>, each posting BC_APP_RESULT), a teacher-run Team Quiz Board, a timed Mini Contest, and a
// drill plenary. Every value on a slide is worked out here with the Competition lessons' own code (NotationLab/core.js,
// BitFlicker/bits-core.js, shared/acsl-pseudocode.js), and the drills carry CompArcadeY8/gen.js, the generators the
// games use, so a card's answer is computed when it is drawn. Questions are original, in the contest's style.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const NC = require(path.join(ROOT, 'NotationLab', 'core.js'));
const BC = require(path.join(ROOT, 'BitFlicker', 'bits-core.js'));
const ACSL = require(path.join(ROOT, 'shared', 'acsl-pseudocode.js'));
const ID = 'y8-comp-practice';
const P = 'y8cp';
const POW = NC.POW;
const re = (source) => ({ __regex: true, source, flags: 'i' });
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The browser files the drills carry (and the games load), run here too so the builder uses exactly the same code.
const LIBS = ['shared/acsl-pseudocode.js', 'LoopTracer/js/programs.js', 'NotationLab/core.js', 'BitFlicker/bits-core.js', 'CompArcadeY8/gen.js'];
const libSource = () => LIBS.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')).join('\n');

// ---------------------------------------------------------------- slide pieces
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
const mono = (s) => `<code style="font:700 1.02em var(--font-mono)">${esc(s)}</code>`;
const expr = (s) => `<p style="font:700 1.45rem/1.3 var(--font-mono);letter-spacing:.04em;margin:2px 0 8px">${esc(s)}</p>`;
const note = (t) => `<div class="wt-note">${t}</div>`;
const hl = (t) => `<span class="wt-hl">${t}</span>`;
const big = (t) => `<div class="wt-big" style="font-family:var(--font-mono)">${t}</div>`;
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const cell = 'padding:4px 10px;text-align:left;font-size:16px;vertical-align:top';
const table = (head, rows) => '<table class="donow-table" style="width:100%">' +
  (head ? '<tr>' + head.map((h) => `<th style="${cell}">${h}</th>`).join('') + '</tr>' : '') +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="${cell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';
// A boxed ACSL program with line numbers.
const code = (lines) => '<div class="lesson-code">' + lines.map((l, i) => `<div class="lesson-code-line">${String(i + 1).padStart(2, '0')}&nbsp;&nbsp;${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length))}</div>`).join('') + '</div>';

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
const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
  content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
// A Competition Arcade game on a slide: it posts its result as BC_APP_RESULT, saved as the slide's answer. The game's
// own start screen says how to play, so the slide carries no lead and the game gets the room.
const game = (id, label, mode, lead, extraQuery = '') => ({ id, label, type: 'embedded-app', appId: 'comp-arcade-y8', embedQuery: `mode=${mode}${extraQuery}`,
  embedContainerId: `${P}-${id}`, content: `<h2 class="lesson-h2">${label}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
const num = (n) => `^\\s*${n < 0 ? '[-\\u2212]\\s*' + (-n) : n}\\s*\\.?\\s*$`;
const bitsPat = (b) => `^\\s*${b.split('').join('\\s*')}\\s*\\.?\\s*$`;

// ---------------------------------------------------------------- the lesson's own values (all worked out here)
const DN_POST = '7 3 2 * +';
const DN_POST_VAL = NC.evaluate(NC.parsePostfix(DN_POST));
assert(DN_POST_VAL === 13, 'do-now postfix');
const DN_BITS = 'LCIRC-2 10011';
const DN_BITS_VAL = BC.evaluate(DN_BITS);
assert(DN_BITS_VAL === '01110', 'do-now bits');
const WT_POST = '4 5 2 * +';
assert(NC.evaluate(NC.parsePostfix(WT_POST)) === 14, 'walkthrough postfix');
const WT_STEPS = NC.stackSteps(NC.tokens(WT_POST), 'postfix');
const WT_BITS = 'LCIRC-2 11010';
const WT_BITS_VAL = BC.evaluate(WT_BITS);
assert(WT_BITS_VAL === '01011' && BC.evaluate('LCIRC-1 11010') === '10101', 'walkthrough bits');
const T1_POST = '6 2 4 + *';
assert(NC.evaluate(NC.parsePostfix(T1_POST)) === 36, 'trick 1 postfix');
const T1_CONV = NC.parseInfix('(A + B) * C');
assert(NC.show(NC.toPostfix(T1_CONV)) === 'A B + C *' && NC.show(NC.toPrefix(T1_CONV)) === '* + A B C', 'trick 1 convert');
assert(NC.evaluate(NC.parsePostfix('8 2 /')) === 4 && NC.evaluate(NC.parsePrefix('/ 8 2')) === 4, 'trick 1 order');
assert(BC.evaluate('LCIRC-5 10110') === '10110', 'trick 2 circulate');
assert(BC.evaluate('LSHIFT-2 10110') === '11000' && BC.evaluate('RCIRC-1 10110') === '01011' && BC.evaluate('101 AND 11011') === '00001', 'trick 2 examples');
const T3_PROG = ['p = 1', 'FOR i = 1 TO 4', '  p = p * i', 'NEXT i', 'OUTPUT p'];
const T3_OUT = ACSL.run(T3_PROG.join('\n')).outputs.join(' ');
assert(T3_OUT === '24', 'trick 3 program');
assert(ACSL.run(['c = 0', 'FOR i = 1 TO 3', '  FOR j = 1 TO 4', '    c = c + 1', '  NEXT j', 'NEXT i', 'OUTPUT c'].join('\n')).outputs[0] === '12', 'trick 3 nested');

// ---------------------------------------------------------------- Think, Pair, Share: one why question per slide
// On the Do Now (the only check slide) it never gives or presupposes an answer there (tools/tps-leak-check.mjs).
const TPS = {
  'do-now': ['Why write each new bit string out in full, even for one small step?', 'Every bit stays in its place, so a slip shows up straight away and you can check each step.'],
  'title': ['A contest gives a point only for an exact answer. Why do speed and care both matter?', 'Time is short, but one wrong digit or bit scores nothing. Fast and careful wins.'],
  'trick-notation': [`Predict the value of ${mono(T1_POST)}. Why does postfix never need brackets?`,
    `${mono(T1_POST)} is 6 * (2 + 4) = 36. An operator always uses the two values just before it, so the order of the tokens already shows what is worked out first.`],
  'tower': ['Why is a streak worth more than the same right answers with mistakes in between?', 'A contest rewards being right every time. A streak shows your method works every time, not just by luck.'],
  'trick-bits': [`Predict: what is ${mono('LCIRC-5 10110')}? Why?`, `${mono('10110')} again. In a 5-bit string, each bit moves 5 places and wraps all the way round to where it started.`],
  'heist': ['After a miss, the lock says how many bits are right, not which ones. Why is that still useful?', 'It shows how close you are. Check each step again, starting with the easy slips: a shift the wrong way, or the order of operators.'],
  'trick-loops': ['Predict what this program outputs. Why does p start at 1, not 0?', `It outputs ${T3_OUT}: 1 * 1 * 2 * 3 * 4. Anything times 0 is 0, so a product that started at 0 would stay 0.`],
  'detective': ['Why is a trace table better than doing the loop in your head?', 'Each row records one change. You never lose track of which turn you are on, and you can check every step.'],
  'board': ['Why should your team agree on one answer before the reveal?', 'Explaining your method to each other catches slips. If two methods disagree, one has a mistake.'],
  'contest': ['Why answer the questions you are sure of first?', 'Every question is worth one point. Bank the sure points first, so a hard question cannot use up all your time.'],
  'plenary': ['Why practise with new values every time?', 'If you can do any expression or program, you know the method, not just one answer.'],
};

const steps = [];

// ---------------------------------------------------------------- Do Now: postfix and a circulate (from the Contest 2 lessons)
const WT_DN = { title: 'Walk me through it: postfix and circulates', steps: [
  { text: 'These are the same kinds of question with different values. Use the same steps on yours.', visual: big(esc(WT_POST)) + big(esc(WT_BITS)) },
  { text: 'Postfix: read from the <strong>left</strong>. Push each number onto the stack.', visual: big(`${hl('4 5 2')} * +`) + note('Stack: ' + WT_STEPS[2].stack.join(' ')) },
  { text: '<strong>*</strong> pops two numbers. The first one popped goes on the <strong>right</strong>: 5 * 2 = 10. Push 10.', visual: big(`4 ${hl('5 2 *')} +`) + note('Stack: ' + WT_STEPS[3].stack.join(' ')) },
  { text: '<strong>+</strong> pops 10, then 4: 4 + 10 = 14. One number is left on the stack. That is the value.', visual: big(`${hl('4')} (10) ${hl('+')}`) + note('Value: ' + WT_STEPS[4].value) },
  { text: 'LCIRC-2: every bit moves 2 places <strong>left</strong>. The 2 bits that fall off the left end come back on the right.', visual: big(`${hl('11')}010`) },
  { text: `So LCIRC-2 11010 = ${WT_BITS_VAL}. The string keeps its length. Now do the same with yours.`, visual: big(`010${hl('11')}`) },
] };
// The recap line and both expressions sit beside the answer card, so the slide still fits with the Think, Pair, Share
// and the teacher's Reveal answers panel both open.
steps.push(checkStep('do-now', 'Do Now: Contest 2 Warm-up', 'Do Now: Contest 2 Warm-up', '', [
  { label: 'The value of postfix expression (a)', answer: num(DN_POST_VAL), feedback: 'Use a stack. An operator uses the two numbers just before it.' },
  { label: 'The new bit string for (b)', answer: bitsPat(DN_BITS_VAL), feedback: 'Move every bit 2 places left. Bits that fall off the left end come back on the right.' },
], '<p class="lesson-lead" style="margin:0 0 6px">From Contest 2: Prefix, Infix and Postfix, and Bit-String Flicking.</p>' +
  '<p style="margin:0">(a) Postfix</p>' + expr(DN_POST) + '<p style="margin:0">(b) Bit string</p>' + expr(DN_BITS)));
steps[steps.length - 1].walkthrough = WT_DN;

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y8-comp-practice-ext', 'Extension: Do Now Challenge',
  '<strong>Extension:</strong> finished the Do Now? Try these questions from all three Contest 2 topics. Stuck? Switch on <strong>I need help</strong> to see a similar one worked through.'));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Competition Practice: Contest 2 Games',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">Year 8</p><h2 class="lesson-h2">Competition Practice: Contest 2 Games</h2><p>ACSL Junior Division</p></div>' +
    facts(['<strong>Today:</strong> five games on the three Contest 2 topics: prefix, infix and postfix; bit strings; loops.',
      '<strong>Points:</strong> one try per question, new values every round, harder as you go.',
      '<strong>The big question:</strong> why does each trick work?']) });

// ---------------------------------------------------------------- trick 1: notation
steps.push({ id: 'trick-notation', label: 'Trick 1: Stacks and Brackets', content: '<h2 class="lesson-h2">Trick 1: Stacks and Brackets</h2>' +
  table(['Task', 'The trick', 'Example'], [
    ['<strong>Postfix value</strong>', 'Read from the <strong>left</strong>. Push each number. An operator pops two: the first one popped goes on the <strong>right</strong>.', mono('8 2 /') + ' = 8 / 2'],
    ['<strong>Prefix value</strong>', 'Read from the <strong>right</strong>. Push each number. An operator pops two: the first one popped goes on the <strong>left</strong>.', mono('/ 8 2') + ' = 8 / 2'],
    ['<strong>Infix to postfix</strong>', 'Put brackets round every operation. Move each operator to the <strong>end</strong> of its own brackets.', mono('(A + B) * C') + '<br>' + mono(NC.show(NC.toPostfix(T1_CONV)))],
    ['<strong>Infix to prefix</strong>', 'The same, but move each operator to the <strong>front</strong> of its own brackets.', mono('(A + B) * C') + '<br>' + mono(NC.show(NC.toPrefix(T1_CONV)))],
  ]) + facts([`${mono(POW)} is a power (type ^). It goes before * and /. ${mono('3(A + B)')} means ${mono('3 * (A + B)')}.`]) });

steps.push(game('tower', 'Game 1: Expression Tower', 'tower'));

// ---------------------------------------------------------------- trick 2: bit strings
const ORDER = '<ol style="margin:0;padding-left:24px;font-size:17px;line-height:1.7"><li>Brackets</li><li><strong>NOT</strong>, <strong>LSHIFT</strong>, <strong>RSHIFT</strong>, <strong>LCIRC</strong>, <strong>RCIRC</strong>: start with the one next to the bits</li><li><strong>AND</strong></li><li><strong>XOR</strong></li><li><strong>OR</strong></li></ol>';
steps.push({ id: 'trick-bits', label: 'Trick 2: Flick Bits in the Right Order', content: '<h2 class="lesson-h2">Trick 2: Flick Bits in the Right Order</h2>' +
  columns('<p style="margin:0 0 4px"><strong>The order</strong></p>' + ORDER + facts(['Shorter string? Pad it with zeros on the <strong>left</strong>.']),
    table(['Operator', 'What it does', 'On 10110'], [
      ['NOT', 'flips every bit', mono(BC.evaluate('NOT 10110'))],
      ['AND, OR, XOR', 'column by column: AND needs both 1, OR needs at least one 1, XOR needs them different', mono('101 AND 11011') + ' = ' + mono(BC.evaluate('101 AND 11011'))],
      ['LSHIFT-2', '2 bits fall off the left, 2 zeros come in on the right', mono(BC.evaluate('LSHIFT-2 10110'))],
      ['RCIRC-1', '1 bit falls off the right and comes back on the left', mono(BC.evaluate('RCIRC-1 10110'))],
    ])) });

steps.push(game('heist', 'Game 2: Bit Heist', 'heist'));

// ---------------------------------------------------------------- trick 3: loops
steps.push({ id: 'trick-loops', label: 'Trick 3: Trace Like a Detective', content: '<h2 class="lesson-h2">Trick 3: Trace Like a Detective</h2>' +
  columns(facts([
    'A <strong>total</strong> starts at 0 and adds a value each turn. A <strong>counter</strong> adds 1. A <strong>product</strong> starts at 1.',
    `${mono('FOR i = 1 TO 9 STEP 2')}: i is 1, 3, 5, 7, 9. ${mono('NEXT i')} adds the step.`,
    `${mono('WHILE')} checks its condition before every turn.`,
    '<strong>Nested loops:</strong> the inner loop runs all the way through for every turn of the outer loop.',
    `${mono('%')} gives the remainder. ${mono('int(x)')} drops the decimal part. ${mono('abs(x)')} removes a minus sign. ${mono('&&')} means both are true.`]),
    code(T3_PROG) + '<p class="lesson-lead" style="margin-top:6px">Trace it: a column for each variable, a new row each time a value changes.</p>') });

steps.push(game('detective', 'Game 3: Loop Detective', 'detective'));

steps.push(game('board', 'Team Quiz Board', 'board'));

steps.push(game('contest', 'Mini Contest', 'contest', '', '&minutes=8'));

steps.push(embed('plenary', 'Plenary: Contest 2 Drill', 'drill-y8-comp-practice', 'Plenary: Contest 2 Drill',
  'Get each card right 3 times in a row to master it. New values every time. Your progress is saved.'));

for (const st of steps) if (TPS[st.id]) st.content = st.content.replace('</h2>', '</h2>' + tps(TPS[st.id][0], `<p>${TPS[st.id][1]}</p>`, /Predict/.test(TPS[st.id][0]) ? 'Show the worked answer' : 'Show the answer'));
{
  const t = steps.find((s) => s.id === 'title');
  t.content = t.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/, '');
  t.content += tps(TPS.title[0], `<p>${TPS.title[1]}</p>`);
}

// ---------------------------------------------------------------- self-checks
const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, 'i').test(s);
for (const s of ['13', ' 13 ', '13.']) assert(V('do-now', 0, s), 'do-now (a) accepts ' + s);
for (const s of ['12', '14', '20', '27', '3']) assert(!V('do-now', 0, s), 'do-now (a) rejects ' + s);
for (const s of ['01110', '0 1 1 1 0', ' 01110.']) assert(V('do-now', 1, s), 'do-now (b) accepts ' + s);
for (const s of ['1110', '11100', '01101', '10011', '00111', '10001']) assert(!V('do-now', 1, s), 'do-now (b) rejects ' + s);
// Feedback nudges and never contains an accepted answer.
for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
  const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
  for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) assert(!rx.test(w.slice(a, b).join(' ').replace(/[.,:?]+$/, '')), `feedback leaks: ${k}${p.suffix}`);
}
const plain = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&rarr;/g, ' ').replace(/\s+/g, ' ').trim();
// The Do Now's Think, Pair, Share and walkthrough never give an answer the slide accepts.
{
  const s = steps.find((x) => x.id === 'do-now');
  const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, 'i'));
  const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
  s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
  for (const t of texts) {
    const pieces = new Set([t, ...t.split(/[,;:.!?()]/).map((x) => x.trim()), ...t.split(/\s+/)]);
    for (const pc of pieces) pats.forEach((rx, i) => assert(!rx.test(pc), `do-now TPS or walkthrough passes part ${'ab'[i]}: "${pc}"`));
  }
  const all = plain(JSON.stringify(s.walkthrough));
  assert(!/\b13\b|01110|10011|7 3 2/.test(all), 'walkthrough shows the Do Now');
}
// Every slide asks a why: a Think, Pair, Share on every slide except the Extension.
for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
// No term before the slide that teaches it. The Do Now recaps the Contest 2 lessons (postfix, LCIRC), and the title
// only names today's topics.
const TEACH = [[/\bprefix\b|\binfix\b|\bstack\b|\bpush|\bpop/i, 'trick-notation'], [/\bXOR\b|\bRCIRC|\bLSHIFT|\bRSHIFT|\bAND\b|\bOR\b|\bNOT\b/, 'trick-bits'],
  [/\bFOR\b|\bWHILE\b|\bNEXT\b/, 'trick-loops'], [/trace table|\bnested\b|\bcounter\b|\bproduct\b/i, 'trick-loops']];
{
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title' || s.id === 'do-now') return;
    const text = plain(s.label + ' ' + s.content.replace(/<details class="lesson-tps">[\s\S]*?<\/details>/g, '')) + ' ' + plain((s.content.match(/<details class="lesson-tps">([\s\S]*?)<\/details>/) || ['', ''])[1]);
    TEACH.forEach(([rx, from]) => assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`));
  });
}
{
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/mario|party/i.test(all), 'game mention');
  assert(!/<\?/.test(all), 'template tag');
  const ids = steps.map((s) => s.id);
  assert(new Set(ids).size === ids.length, 'duplicate step ids');
}
const lesson = { id: ID, label: 'Competition Practice: Contest 2 Games', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');

// ======================================================================== drills
// Each drill file carries the interpreter, the cores and CompArcadeY8/gen.js inside its own function scope.
const DRILL_HEAD = String.raw`
  var pick = Y8Gen.pick;
  // A card drawn from the games' generators: the question, the answer, real slips as wrong options, a similar
  // question worked through as the example, and two nudges.
  function card(id, category, kinds, levels) {
    return { id: id, category: category, randomize: function () {
      var q = Y8Gen.question(typeof kinds === "string" ? kinds : pick(kinds), pick(levels));
      return { prompt: q.ask + "\n" + q.show, answers: [q.answer], keywords: [q.keyword], distractors: q.distractors,
        example: q.example, working: q.working, note: q.why.join("\n"), format: q.format };
    } };
  }
  // Pick every true reason: buttons, never typed.
  function why(id, prompt, answers, wrong, note) {
    return { id: id, category: "pl-why", type: "multi", show: 5, prompt: prompt, answers: answers, distractors: wrong, note: note,
      working: ["Test each option against a small example you can work out.", "A reason is true only if it is true every time, not just for one example."] };
  }`;
const EXT_CARDS = String.raw`
  return [
    card("x-post", "x-notation", "post-eval", [1, 2]),
    card("x-pre", "x-notation", "pre-eval", [1, 2]),
    card("x-to-post", "x-notation", "to-post", [1, 2]),
    card("x-to-pre", "x-notation", "to-pre", [1, 2]),
    card("x-logic", "x-bits", "bits-logic", [1, 2]),
    card("x-shift", "x-bits", "bits-shift", [1, 2]),
    card("x-chain", "x-bits", "bits-chain", [1]),
    card("x-total", "x-loops", "loop", [1]),
    card("x-step", "x-loops", "loop", [2]),
    card("x-nested", "x-loops", "loop", [4])
  ];`;
const PLEN_CARDS = String.raw`
  return [
    card("pl-post", "pl-notation", "post-eval", [2, 3]),
    card("pl-pre", "pl-notation", "pre-eval", [2, 3]),
    card("pl-pow", "pl-notation", ["post-eval", "pre-eval"], [4]),
    card("pl-to-post", "pl-notation", "to-post", [2, 3]),
    card("pl-to-pre", "pl-notation", "to-pre", [2, 3]),
    card("pl-convert-hard", "pl-notation", ["to-post", "to-pre"], [4]),
    card("pl-logic", "pl-bits", "bits-logic", [2, 3]),
    card("pl-logic-hard", "pl-bits", "bits-logic", [4]),
    card("pl-shift", "pl-bits", "bits-shift", [2]),
    card("pl-shift-chain", "pl-bits", "bits-shift", [3, 4]),
    card("pl-chain", "pl-bits", "bits-chain", [2, 3]),
    card("pl-chain-hard", "pl-bits", "bits-chain", [4]),
    card("pl-for", "pl-loops", "loop", [1]),
    card("pl-step", "pl-loops", "loop", [2]),
    card("pl-while", "pl-loops", "loop", [3]),
    card("pl-nested", "pl-loops", "loop", [4]),
    card("pl-if", "pl-loops", "loop", [5]),
    why("pl-why-postfix", "Why does a postfix expression never need brackets? Pick every true reason.",
      ["Each operator uses the two values just before it", "The token order shows what is worked out first"],
      ["Postfix can only use the + and * operators", "The values are always written in order of size", "The stack puts the brackets back in for you", "Postfix is always worked out from the right"],
      "An operator in postfix always takes the two values just before it, so the order of the tokens already shows what is worked out first."),
    why("pl-why-pop", "In postfix, why does the first number popped go on the right? Pick every true reason.",
      ["It was pushed last, so it was written last", "For - and / the order changes the answer"],
      ["The stack is always read from the bottom up", "The first number popped is always the bigger", "Postfix expressions are read from the right", "The answer to a postfix sum is never negative"],
      "The stack gives back the last number pushed first. That number was written last, so it goes on the right. 8 - 2 and 2 - 8 are different."),
    why("pl-why-circ", "Why does LCIRC-5 on a 5-bit string give the same string? Pick every true reason.",
      ["Each bit moves 5 places and wraps all the way round", "A circulate never loses a bit off either end"],
      ["Zeros come in on the right to fill the gaps", "LCIRC only ever moves the first bit of the string", "A 5-bit string is too short to be moved at all", "NOT is worked out first, so it undoes the move"],
      "A circulate puts every bit that falls off back on the other end. After 5 moves in 5 bits, every bit is back where it started."),
    why("pl-why-loops", "Why do these loops start or count the way they do? Pick every true reason.",
      ["A product starts at 1 because times 0 stays 0", "An inner loop runs fully for each outer turn"],
      ["A total starts at 1 so that it is never empty", "WHILE checks its condition after each turn", "NEXT i always adds 2 to the loop variable", "A counter adds the value of i on every turn"],
      "Anything times 0 is 0, so a product starts at 1. A nested loop restarts its inner loop on every turn of the outer loop.")
  ];`;
const DRILLS = [
  ['y8-comp-practice-ext', 'Do Now Extension: all three Contest 2 topics, at the easier levels.', 'Year 8 Extension: Contest 2 Challenge', 'Competition Practice Do Now Extension',
    [['x-notation', 'Prefix, Infix and Postfix'], ['x-bits', 'Bit Strings'], ['x-loops', 'Loops']], EXT_CARDS],
  ['y8-comp-practice', 'Plenary: prefix, infix and postfix, bit strings, loops, and why each trick works.', 'Year 8: Competition Practice, Contest 2', 'Contest 2 games',
    [['pl-notation', 'Prefix, Infix and Postfix'], ['pl-bits', 'Bit Strings'], ['pl-loops', 'Loops'], ['pl-why', 'Why?']], PLEN_CARDS],
];
for (const [id, about, title, subtitle, cats, cards] of DRILLS) {
  const src = `// Year 8, Competition Practice: Contest 2 Games. ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/build_y8_comp.mjs: edit that (or CompArcadeY8/gen.js), then run it. Every answer is worked out when the card is drawn.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {\n${libSource()}\n${DRILL_HEAD}\n${cards}\n  })()\n});\n`;
  assert(!/[–—]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
}

// Draw every card many times, as check-site does: its answer passes, no distractor passes, no working step or
// example gives the answer away or copies the question, and every card has a worked example.
{
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [id] of DRILLS) {
    const ctx = { console, Math, JSON };
    ctx.window = ctx; ctx.globalThis = ctx;
    ctx.DrillData = { register: (k, d) => { ctx.out = d; ctx.key = k; } };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), 'utf8'), ctx);
    const d = ctx.out;
    assert(ctx.key === id, `${id} registers as ${ctx.key}`);
    assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
    assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
    for (const card of d.cards) {
      if (card.type === 'multi') {
        assert(card.answers.length >= 2 && card.distractors.length >= 4, `${id} ${card.id}: options`);
        const longest = Math.max(...card.distractors.map((w) => w.length));
        for (const a of card.answers) assert(a.length <= 1.25 * longest, `${id} ${card.id}: "${a}" is clearly the longest option`);
        continue;
      }
      for (let n = 0; n < 150; n++) {
        const r = { ...card, ...card.randomize() };
        const pass = (s) => r.keywords.some((k) => k.test(s));
        const ans = String(r.answers[0]);
        assert(pass(ans) && pass(' ' + ans + ' ') && pass(ans + '.') && pass(ans.toLowerCase()), `${id} ${card.id}: own answer "${ans}" fails`);
        for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
        assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
        const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
        if (!inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
        assert(r.working.length === 2 && r.example, `${id} ${card.id}: two nudges and an example`);
        const ex = r.example.toLowerCase();
        const wholeRe = new RegExp('(^|[^a-z0-9])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
        assert(!(ans.length >= 3 && wholeRe.test(ex) && !wholeRe.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        const copied = r.prompt.split('\n').filter((l) => l.trim().length > 12 && ex.includes(l.trim().toLowerCase()));
        assert(copied.length < 3, `${id} ${card.id}: example copies the question`);
        assert(!/[–—]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors])), `${id} ${card.id}: dash`);
      }
    }
    console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  }
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: a surgical edit (a new last unit in Year 8),
// re-reading the file just before writing so another builder's change is never lost.
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    const y8 = raw.indexOf('"id": "year8"'), y9 = raw.indexOf('"id": "year9"');
    assert(y8 > 0 && y9 > y8, 'Year 8 and Year 9 in lessons.json');
    const block = raw.slice(y8, y9);
    const m = /\}(\r?\n)([ \t]*)\](\r?\n)[ \t]*\}\s*,\s*\{\s*$/.exec(block);
    assert(m, 'the end of the Year 8 units list');
    const at = y8 + m.index + 1;
    const ind = m[2] + '  ';
    const unit = `,${nl}${ind}{${nl}${ind}  "code": "",${nl}${ind}  "title": "Competition Practice",${nl}${ind}  "lessons": [${nl}${ind}    "${ID}"${nl}${ind}  ]${nl}${ind}}`;
    const out = raw.slice(0, at) + unit + raw.slice(at);
    JSON.parse(out);
    assert(fs.readFileSync(lp, 'utf8') === raw, 'lessons.json changed while building: run the builder again');
    fs.writeFileSync(lp, out);
  }
  const all = JSON.parse(fs.readFileSync(lp, 'utf8'));
  const unit = all.years.find((y) => y.id === 'year8').units.find((u) => u.lessons.includes(ID));
  assert(unit, 'registered under Year 8');
  console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator set; unit: ${unit.title} [${unit.lessons.join(', ')}]`);
}
