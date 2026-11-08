// Shared pieces for the Year 8 Unit 2 "Programming, Logic and Testing" builders (tools/build_y8_2_1.mjs,
// tools/build_y8_2_2.mjs). Same slide pieces and checks as tools/build_y8_3_2.mjs and tools/build_y8_rev2.mjs:
// EAL-light, a Think, Pair, Share under every heading, every slide program run through shared/pseudocode-engine.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { runPseudocode } = require(path.join(ROOT, 'shared', 'pseudocode-engine.js'));

export const re = (source, flags = 'i') => ({ __regex: true, source, flags });
export function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const codeLine = (l) => esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length));
// A boxed program. numbered: line numbers; hlLines: 1-based lines marked for a walkthrough.
export const code = (lines, numbered = false, hlLines = [], tight = false) => `<div class="lesson-code"${tight ? ' style="line-height:1.2;padding-top:8px;padding-bottom:8px"' : ''}>` +
  lines.map((l, i) => `<div class="lesson-code-line${hlLines.includes(i + 1) ? ' wt-hl' : ''}">${numbered ? (i + 1) + '&nbsp;&nbsp;' : ''}${codeLine(l)}</div>`).join('') + '</div>';
export const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
export const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
export const caption = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
export const note = (t) => `<div class="wt-note">${t}</div>`;
export const hl = (t) => `<span class="wt-hl">${t}</span>`;
export const mono = (t) => `<code>${esc(t)}</code>`;
export function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const tcell = 'padding:5px 10px;text-align:left;font-size:16px';
export const table = (head, rows) => '<table class="donow-table" style="width:100%">' +
  (head ? '<tr>' + head.map((h) => `<th style="${tcell}">${h}</th>`).join('') + '</tr>' : '') +
  rows.map((r) => '<tr>' + r.map((c) => `<td style="${tcell}">${c}</td>`).join('') + '</tr>').join('') + '</table>';
const flowBox = 'border:2px solid var(--brand);border-radius:10px;padding:8px 12px;background:var(--surface-2);font-size:16px;line-height:1.4';
export const box = (t) => `<div style="${flowBox}">${t}</div>`;
const acell = 'padding:5px 12px;text-align:center;font:700 17px var(--font-mono, monospace)';
export function arrayTable(name, values) {
  return `<p style="margin:0 0 6px"><strong>${name}</strong> already holds:</p><table class="donow-table" style="margin:0 0 8px">` +
    `<tr><th style="${acell};text-align:left">Index</th>${values.map((v, i) => `<td style="${acell};color:var(--muted)">${i + 1}</td>`).join('')}</tr>` +
    `<tr><th style="${acell};text-align:left">Value</th>${values.map((v) => `<td style="${acell}">${v}</td>`).join('')}</tr></table>`;
}

// Run a program (hidden setup lines first); every slide answer comes from here.
export function run(lines, inputs = [], setup = []) {
  const r = runPseudocode(setup.concat(lines).join('\n'), {}, 5000, inputs.map(String));
  if (r.error) throw new Error(`Program failed: line ${r.error.line}: ${r.error.message}\n${lines.join('\n')}`);
  return r;
}
export const outs = (lines, inputs, setup) => run(lines, inputs, setup).outputs.map((v) => typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v));
export function runError(lines) { return runPseudocode(lines.join('\n'), {}, 5000, []).error; }
export const fill = (name, type, values) => [`DECLARE ${name} : ARRAY[1:${values.length}] OF ${type}`]
  .concat(values.map((v, i) => `${name}[${i + 1}] <- ${type === 'STRING' ? '"' + v + '"' : v}`));

// Typed-answer patterns.
export const num = (n) => { const s = String(n).replace('.', '\\.'); return `^\\s*${s}${String(n).includes('.') ? '0*' : '(\\.0+)?'}\\s*[.!]?\\s*$`; };
export const word = (w) => `^\\s*["'\\u201c]?\\s*${w}\\s*["'\\u201d]?\\s*[.!]?\\s*$`;
export const NO = "^\\s*(no|nope|not\\s+needed|it\\s+does\\s*n[o']?t(\\s+need\\s+it)?|it\\s+is\\s*n[o']?t\\s+needed)\\s*[.!]?\\s*$";
export const YES = "^\\s*(yes|yeah|it\\s+does)\\s*[.!]?\\s*$";

export function makeLesson(P) {
  const validators = {};
  function checkStep(id, label, heading, lead, parts, extra = '') {
    const key = `${P}_${id}`.replace(/-/g, '_');
    const vid = `${P}-${id}`;
    validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer, p.flags ?? 'i'), feedback: p.feedback }));
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
  const embed = (id, label, appId, heading, lead) => ({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` });
  function mcStep(id, label, heading, lead, items, extra = '') {
    const cid = `${P}-${id}`;
    return { id, label, type: 'multiple-choice', containerId: cid,
      content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `${extra}<div id="${cid}"></div>`, items };
  }
  function selfMarked(id, label, heading, lead, items) {
    return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
      content: `<h2 class="lesson-h2">${heading}</h2>${lead}<div id="${P}-${id}"></div>`, items };
  }
  const V = (k, i, s) => new RegExp(validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.source, validators[`${P}_${k}`.replace(/-/g, '_')][i].pattern.flags).test(s);
  return { validators, checkStep, embed, mcStep, selfMarked, V };
}

export const plain = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&larr;/g, '<-').replace(/\s+/g, ' ').trim();
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };

// The standing checks every Unit 2 lesson passes before it is written.
export function checkLesson(steps, validators, { teach = [], noTps = [] } = {}) {
  for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
    const rx = new RegExp(p.pattern.source, p.pattern.flags), w = p.feedback.split(/\s+/);
    for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) {
      const runW = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
      assert(!rx.test(runW), `feedback leaks the answer: ${k}${p.suffix} "${runW}"`);
    }
  }
  for (const s of steps.filter((x) => x.validatorKey)) {
    const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, v.pattern.flags));
    const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
    if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
    for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
  }
  for (const s of steps.filter((x) => x.type === 'multiple-choice')) {
    const t = plain((s.content.match(/<details class="lesson-tps">([\s\S]*?)<\/details>/) || ['', ''])[1]).toLowerCase();
    for (const it of s.items) {
      const right = it.options[it.correct];
      assert(!t.includes(plain(right).toLowerCase()), `${s.id}: TPS gives "${right}"`);
      const others = it.options.filter((o, i) => i !== it.correct).map((o) => plain(o).length);
      assert(plain(right).length <= 1.15 * Math.max(...others), `${s.id}: the right option is clearly the longest`);
    }
  }
  for (const s of steps) if (!noTps.includes(s.id)) assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: s.content, items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => { assert(at(from) >= 0, 'teach slide ' + from); assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`); });
  });
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478|0860/.test(JSON.stringify(steps)), 'citation found');
  assert(!/mario|party/i.test(all), 'game mention');
}

// ---------------------------------------------------------------- drills
export const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };

// Card helpers that run in the drill page (PseudocodeEngine and drillPick are loaded before the data file).
export function drillKit() {
  function run(lines, inputs) {
    var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, (inputs || []).map(String));
    if (r.error) throw new Error(r.error.message + "\n" + lines.join("\n"));
    return r.outputs.map(function (v) { return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v); });
  }
  function runErr(lines) { var r = PseudocodeEngine.runPseudocode(lines.join("\n"), {}, 5000, []); return r.error; }
  function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function numRe(n) { var s = String(n); return new RegExp("^\\s*" + escRe(s) + (s.indexOf(".") < 0 ? "(\\.0+)?" : "0*") + "\\s*[.!]?\\s*$"); }
  function textRe(t, strictCase) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + escRe(t) + "\\s*[\"'\\u201d]?\\s*[.!]?\\s*$", strictCase ? "" : "i"); }
  function others(ans, list) {
    var out = [];
    var n = Number(ans), extra = isNaN(n) ? [] : [n + 1, n + 2, n * 2, n + 3, n + 10].map(function (x) { return Math.round(x * 100) / 100; });
    list.concat(extra).forEach(function (v) { v = String(v); if (v !== String(ans) && v.toLowerCase() !== String(ans).toLowerCase() && out.indexOf(v) < 0 && out.length < 3 && v !== "NaN" && !(Number(v) < 0)) out.push(v); });
    return out;
  }
  function numbered(lines) { return lines.map(function (l, i) { return (i + 1) + "  " + l; }).join("\n"); }
  // A typed card with a worked example: another draw of the same kind, with a different answer and program.
  function card(id, category, gen, extra) {
    var c0 = { id: id, category: category, randomize: function () {
      var c = gen(), ex = null;
      var mentions = new RegExp("(^|[^a-z0-9])" + escRe(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      var mine = c.prompt.split("\n").map(function (l) { return l.replace(/^\d+\s+/, "").trim().toLowerCase(); }).filter(function (l) { return l.length > 12; });
      for (var i = 0; i < 200 && !ex; i++) {
        var e = gen(), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
        var shared = mine.filter(function (l) { return text.indexOf(l) >= 0; }).length;
        if (shared < 3 && String(e.answer).toLowerCase() !== String(c.answer).toLowerCase() &&
          (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) ex = e;
      }
      var example = ex ? "A similar question:\n" + ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer : null;
      var out = { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong, example: example, working: c.working, note: c.note };
      if (c.format) out.format = c.format;
      return out;
    } };
    if (extra) Object.keys(extra).forEach(function (k) { c0[k] = extra[k]; });
    return c0;
  }
  // Pick the answer that earns the mark, then type it. The answer's ideas are marked by a keyword pattern.
  function why(id, category, gen) {
    return { id: id, category: category, pickThenType: true, randomize: function () {
      var c = gen();
      return { prompt: c.prompt, answers: [c.answer], keywords: [c.re], distractors: c.wrong, working: c.working, example: c.example, note: c.note };
    } };
  }
}

// Writes Drills/data/<id>.js from a card function, then draws every card many times as check-site does.
export function writeDrill({ id, header, title, subtitle, cats, parts, cardsFn, codeDrill = false, builder, typedNoExample = [] }) {
  const src = `// ${header}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by ${builder}: edit that, then run it. Every program answer is worked out by the pseudocode engine when the card is drawn.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    (codeDrill ? '  codeDrill: true,\n' : '') +
    `  categories: [\n${cats.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {${parts.join('\n')}\n${body(cardsFn)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
  const ctx = { console, Math, drillPick: (l) => l[Math.floor(Math.random() * l.length)] };
  ctx.DrillData = { register: (k, d) => { ctx.out = d; ctx.key = k; } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared', 'pseudocode-engine.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
  vm.runInContext(src, ctx);
  const d = ctx.out;
  assert(ctx.key === id, `${id} registers as ${ctx.key}`);
  assert(d.cards.every((c) => d.categories.some((k) => k[0] === c.category)), `${id} card categories`);
  assert(new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} card ids are unique`);
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const card of d.cards) {
    if (codeDrill) {
      for (let n = 0; n < 60; n++) {
        const typed = typeof card.inputs === 'function' ? card.inputs({}) : card.inputs;
        const r = ctx.PseudocodeEngine.runPseudocode(card.reference, card.setup || {}, 5000, typed);
        assert(!r.error, `${id} ${card.id}: reference fails: ${r.error && r.error.message}`);
        assert(r.outputs.length >= 1, `${id} ${card.id}: reference outputs nothing`);
        for (const c of card.mustBeConstant || []) assert(r.constants.includes(c), `${id} ${card.id}: reference has no CONSTANT ${c}`);
      }
      // A program that hard-codes one draw's output must fail on other draws.
      const draws = new Set();
      for (let n = 0; n < 40; n++) { const typed = typeof card.inputs === 'function' ? card.inputs({}) : card.inputs; draws.add(JSON.stringify(ctx.PseudocodeEngine.runPseudocode(card.reference, {}, 5000, typed).outputs)); }
      assert(draws.size >= 2, `${id} ${card.id}: inputs give only ${draws.size} different outputs`);
      continue;
    }
    for (let n = 0; n < 300; n++) {
      const r = { ...card, ...card.randomize() };
      const pass = (s) => r.keywords.some((k) => k.test(s));
      const ans = String(r.answers[0]);
      assert(pass(ans), `${id} ${card.id}: own answer "${ans}" fails`);
      for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
      assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length && !r.distractors.map(String).includes(ans), `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
      if (ans.length > 20) assert(ans.length <= 1.12 * Math.max(...r.distractors.map((w) => String(w).length)), `${id} ${card.id}: the answer is clearly the longest option ("${ans}")`);
      const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
      assert(r.working && r.working.length === 2, `${id} ${card.id}: two nudges`);
      if (!inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
      if (!typedNoExample.includes(card.id)) assert(r.example, `${id} ${card.id}: no worked example`);
      if (r.example) {
        const ex = r.example.toLowerCase(), a = ans.toLowerCase();
        const wholeRe = new RegExp('(^|[^a-z0-9])' + escRe(a) + '($|[^a-z0-9])');
        assert(!(a.length >= 3 && wholeRe.test(ex) && !wholeRe.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
        const copied = r.prompt.split('\n').filter((l) => l.trim().length > 12 && ex.includes(l.trim().toLowerCase()));
        assert(copied.length < 3, `${id} ${card.id}: example repeats ${copied.join(' / ')}`);
      }
      assert(!/[\u2013\u2014]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors])), `${id} ${card.id}: dash`);
    }
  }
  console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
  return d;
}

// Registers a lesson in Year 8's "Programming, Logic and Testing" unit (made after "Data Models and Collection" the
// first time). lessons.json is shared with builders running at the same time: re-read it just before writing.
export function registerY8Unit2(id, after) {
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (raw.includes(`"${id}"`)) return;
  let out;
  if (!raw.includes('"title": "Programming, Logic and Testing"')) {
    const m = /\n([ \t]*)"y8-3-2-data"(\r?\n)([ \t]*)\](\r?\n)([ \t]*)\},/.exec(raw);
    assert(m, 'y8-3-2-data ends the Data Models and Collection unit');
    const [, li, nl, bi, , ui] = m;
    const unit = `${ui}{${nl}${bi}"code": "",${nl}${bi}"title": "Programming, Logic and Testing",${nl}${bi}"lessons": [${nl}${li}"${id}"${nl}${bi}]${nl}${ui}},`;
    out = raw.slice(0, m.index + m[0].length) + nl + unit + raw.slice(m.index + m[0].length);
  } else {
    const m = new RegExp(`\\n([ \\t]*)"${after}"(\\r?\\n)`).exec(raw);
    assert(m, `${after} is in lessons.json`);
    out = raw.slice(0, m.index) + `\n${m[1]}"${after}",${m[2]}${m[1]}"${id}"${m[2]}` + raw.slice(m.index + m[0].length);
  }
  const all = JSON.parse(out);
  const unit = all.years.find((y) => y.id === 'year8').units.find((u) => u.lessons.includes(id));
  assert(unit && unit.title === 'Programming, Logic and Testing', 'registered in the Unit 2 unit');
  assert(fs.readFileSync(lp, 'utf8') === raw, 'lessons.json changed while building: run the builder again');
  fs.writeFileSync(lp, out);
}
