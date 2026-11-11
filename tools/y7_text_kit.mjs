// Shared pieces for the Year 7 Unit 2 Text-based Programming builders (tools/build_y7_2_1.mjs, build_y7_2_2.mjs):
// slide pieces in the shape of tools/build_y7_3_1.mjs, the lesson self-checks, Python (Skulpt) in Node to check
// every program and every drill answer, the drill writer and lessons.json registration.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const re = (source) => ({ __regex: true, source, flags: 'i' });
export function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- Python in Node (the same Skulpt as the pages)
const ctx = { console, setTimeout, clearTimeout, Promise }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
for (const f of ['skulpt.min.js', 'skulpt-stdlib.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', 'js', f), 'utf8'), ctx);
const Sk = ctx.Sk;
export async function py(code, inputs = []) {
  let out = '', k = 0;
  Sk.configure({ output: (t) => { out += t; }, read: (x) => { if (Sk.builtinFiles.files[x]) return Sk.builtinFiles.files[x]; throw new Error('nf ' + x); },
    inputfun: () => (k < inputs.length ? inputs[k++] : ''), inputfunTakesPrompt: true, __future__: Sk.python3, execLimit: 4000 });
  const lines = () => { const l = out.split('\n'); if (l[l.length - 1] === '') l.pop(); return l; };
  try { await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true)); return { out: lines() }; }
  catch (e) { return { out: lines(), error: String(e) }; }
}

// ---------------------------------------------------------------- slide pieces
export function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
export const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
export const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
export const paneTitle = (t) => `<p style="margin:0 0 6px;font-weight:700;text-align:center">${t}</p>`;
export const note = (t) => `<div class="wt-note">${t}</div>`;
export const hl = (t) => `<span class="wt-hl">${t}</span>`;
// A Python program as a code block; hlLines: line numbers (from 1) to mark (walkthroughs).
export function code(src, hlLines = []) {
  return '<div class="lesson-code" style="font-size:19px">' + src.split('\n').map((l, i) => {
    const lead = (l.match(/^ */) || [''])[0].length;
    const text = '&nbsp;'.repeat(lead) + esc(l.trim());
    return '<div class="lesson-code-line">' + (hlLines.includes(i + 1) ? hl(text) : text) + '</div>';
  }).join('') + '</div>';
}
// What the user types, for a program with input().
export const typedIn = (list) => `<p class="lesson-lead" style="margin-top:6px">The user types: ${list.map((t) => `<strong style="padding:1px 8px;border-radius:6px;background:rgba(253,214,99,.18)">${esc(t)}</strong>`).join(' then ')}</p>`;
// The screen: what print shows.
export const screen = (lines) => `<div style="padding:6px 12px;border-radius:10px;background:#10151f;color:#e8edf5;font:600 18px/1.5 var(--font-mono,monospace)">${lines.map((l) => `<div>${esc(l) || '&nbsp;'}</div>`).join('')}</div>`;
export const box = (title, text) => `<div style="padding:8px 12px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface-2)"><b>${title}</b><br>${text}</div>`;
export const table = (head, rows) => `<table class="donow-table" style="font-size:17px;width:100%"><thead><tr>${head.map((h) => `<th style="padding:6px 10px;text-align:left">${h}</th>`).join('')}</tr></thead>` +
  `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td style="padding:6px 10px;text-align:left">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

export function lessonKit(P) {
  const validators = {};
  function checkStep(id, label, heading, lead, parts, extra = '') {
    const key = `${P}_${id}`.replace(/-/g, '_');
    const vid = `${P}-${id}`;
    validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
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
  const embed = (id, label, appId, heading, lead, query) => Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` }, query ? { embedQuery: query } : {});
  const lab = (id, label, heading, lead, query) => embed(id, label, 'python-lab', heading, lead, query);
  function mcStep(id, label, heading, lead, items, extra = '') {
    const cid = `${P}-${id}`;
    return { id, label, type: 'multiple-choice', containerId: cid,
      content: `<h2 class="lesson-h2">${heading}</h2>` + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `${extra}<div id="${cid}"></div>`, items };
  }
  function selfMarked(id, label, heading, lead, items) {
    return { id, label, type: 'self-marked-response', containerId: `${P}-${id}`,
      content: `<h2 class="lesson-h2">${heading}</h2>${lead}<div id="${P}-${id}"></div>`, items };
  }
  return { validators, checkStep, embed, lab, mcStep, selfMarked };
}

// ---------------------------------------------------------------- answer patterns (regex source strings)
export const num = (n) => `^\\s*${String(n).replace('.', '\\.')}\\s*$`;
// A printed line: optional quote marks round it, any case, spaces as typed.
export const outRe = (s) => `^\\s*["'\\u201c]?\\s*${s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}\\s*["'\\u201d]?\\s*$`;
export const TYPE_RE = {
  // Fair EAL forms too: "integer number", "real number", "it is a string" (review, 2026-11-11).
  int: '^\\s*(it\\s+is\\s+|it\'?s\\s+)?(an?\\s+)?(integer|int)(\\s*\\(\\s*int\\s*\\))?(\\s+number)?(\\s+data\\s+type)?\\s*\\.?\\s*$',
  float: '^\\s*(it\\s+is\\s+|it\'?s\\s+)?(an?\\s+)?(real|float)(\\s*\\(\\s*float\\s*\\))?(\\s+number)?(\\s+data\\s+type)?\\s*\\.?\\s*$',
  str: '^\\s*(it\\s+is\\s+|it\'?s\\s+)?(an?\\s+)?(string|str)(\\s*\\(\\s*str\\s*\\))?(\\s+data\\s+type)?\\s*\\.?\\s*$',
};

// ---------------------------------------------------------------- lesson self-checks
const plain = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pieces = (t) => { const set = new Set([t]); t.split(/(?<=[.!?])\s+/).forEach((s) => { set.add(s); set.add(s.replace(/[.!?]$/, '')); }); t.split(/[,;:.!?()]/).forEach((s) => set.add(s.trim())); t.split(/\s+/).forEach((s) => set.add(s.replace(/^["']|["'.,!?:;]+$/g, ''))); return [...set].filter(Boolean); };
export function checkLesson(steps, validators, { teach = [], walkLeaks = {} } = {}) {
  // Feedback nudges never contain an accepted answer.
  for (const [k, parts] of Object.entries(validators)) for (const p of parts) {
    const rx = new RegExp(p.pattern.source, 'i'), w = p.feedback.split(/\s+/);
    for (let a = 0; a < w.length; a++) for (let b = a + 1; b <= Math.min(w.length, a + 6); b++) {
      const run = w.slice(a, b).join(' ').replace(/[.,:?]+$/, '');
      assert(!rx.test(run), `feedback leaks the answer: ${k}${p.suffix} "${run}"`);
    }
  }
  // TPS and walkthrough text fails the slide's own marking.
  for (const s of steps.filter((x) => x.validatorKey)) {
    const pats = validators[s.validatorKey].map((v) => new RegExp(v.pattern.source, 'i'));
    const texts = [...s.content.matchAll(/<details class="lesson-tps">([\s\S]*?)<\/details>/g)].map((m) => plain(m[1]));
    if (s.walkthrough) s.walkthrough.steps.forEach((w) => texts.push(plain(w.text + ' ' + w.visual)));
    for (const t of texts) for (const pc of pieces(t)) pats.forEach((rx, i) => assert(!rx.test(pc), `${s.id}: TPS or walkthrough passes part ${'abcd'[i]}: "${pc}"`));
  }
  for (const [id, rx] of Object.entries(walkLeaks)) {
    const s = steps.find((x) => x.id === id);
    assert(s && s.walkthrough, 'walkthrough on ' + id);
    assert(!rx.test(plain(JSON.stringify(s.walkthrough.steps.map((x) => x.text + ' ' + x.visual)))), `${id} walkthrough leaks an answer`);
  }
  for (const s of steps) if (s.id !== 'do-now-ext') assert(s.content.includes('lesson-tps'), 'Think, Pair, Share on ' + s.id);
  const at = (id) => steps.findIndex((s) => s.id === id);
  steps.forEach((s, i) => {
    if (s.id === 'title') return;
    const text = JSON.stringify({ l: s.label, c: plain(s.content), items: s.items, wt: s.walkthrough, v: s.validatorKey ? validators[s.validatorKey].map((v) => v.feedback) : null });
    teach.forEach(([rx, from]) => { assert(at(from) >= 0, 'no slide ' + from); assert(!rx.test(text) || i >= at(from), `${s.id} uses ${rx} before ${from}`); });
  });
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(all), 'dash found');
  assert(!/Cambridge|0478|0860/.test(all), 'citation found');
  assert(!/mario|party/i.test(all), 'game mention');
}

// ---------------------------------------------------------------- drills
// Card helpers written into each drill file (the drill runs them). A card kind is gen() returning
// { prompt, answer, re, wrong, steps, working, note, py: { code, inputs } }; `example` is another draw of the same
// kind with a different answer that appears nowhere in it, worked through step by step (as in build_y7_3_1.mjs).
export function prelude() {
  var NAMES = ["Mia", "Tom", "Ana", "Ben", "Lily", "Sam", "Nok", "Kai"];
  var FOODS = ["cake", "rice", "soup", "pie", "tea", "jam"];
  var VARS = ["score", "coins", "lives", "points", "steps", "gems"];
  var TYPE_RE = { int: /^\s*(it\s+is\s+|it'?s\s+)?(an?\s+)?(integer|int)(\s*\(\s*int\s*\))?(\s+number)?(\s+data\s+type)?\s*\.?\s*$/i, float: /^\s*(it\s+is\s+|it'?s\s+)?(an?\s+)?(real|float)(\s*\(\s*float\s*\))?(\s+number)?(\s+data\s+type)?\s*\.?\s*$/i, str: /^\s*(it\s+is\s+|it'?s\s+)?(an?\s+)?(string|str)(\s*\(\s*str\s*\))?(\s+data\s+type)?\s*\.?\s*$/i };
  var TYPE_NAME = { int: "Integer", float: "Real", str: "String" };
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffled(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  // How Python prints a Real: always with a decimal point.
  function real(x) { var s = String(Math.round(x * 1000) / 1000); return s.indexOf(".") < 0 ? s + ".0" : s; }
  function dec() { return pick(["0.5", "1.5", "2.5", "3.5", "4.5", "0.25", "1.25", "2.75"]); }
  function outRe(s) { return new RegExp("^\\s*[\"'\\u201c]?\\s*" + esc(String(s).trim()).replace(/ /g, "\\s+") + "\\s*[\"'\\u201d]?\\s*$", "i"); }
  function uniq(ans, re, list) { var out = []; list.forEach(function (x) { x = String(x); if (x !== String(ans) && !re.test(x) && out.indexOf(x) < 0 && out.length < 3) out.push(x); }); return out; }
  function card(id, category, gen) {
    return { id: id, category: category, randomize: function () {
      var c = gen(), ex = null, own = c.prompt.split("\n").slice(1);
      function shared(e) { return e.prompt.split("\n").slice(1).filter(function (l) { return own.indexOf(l) >= 0; }).length; }
      var mentions = new RegExp("(^|[^a-z0-9.])" + esc(String(c.answer).toLowerCase()) + "($|[^a-z0-9])");
      for (var i = 0; i < 80 && !ex; i++) {
        var e = gen(), text = (e.prompt + " " + e.steps.join(" ") + " " + e.answer).toLowerCase();
        if (String(e.answer) !== String(c.answer) && shared(e) < 2 && (String(c.answer).length < 3 || mentions.test(c.prompt.toLowerCase()) || !mentions.test(text))) ex = e;
      }
      var example = ex ? "A similar question:\n" + ex.prompt + "\n" + ex.steps.join("\n") + "\nAnswer: " + ex.answer : null;
      return { prompt: c.prompt, answers: [String(c.answer)], keywords: [c.re], distractors: c.wrong, example: example, working: c.working, note: c.note, format: c.format, py: c.py };
    } };
  }
  // A why card: pick the reason, then type it. The example is a similar why question with a different answer.
  function why(id, category, prompt, answer, re, wrong, example, working, note) {
    return { id: id, category: category, prompt: prompt, answers: [answer], keywords: [re], distractors: wrong, pickThenType: true, example: example, working: working, note: note };
  }
}
export const body = (fn) => { const s = fn.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); };

// Writes Drills/data/<id>.js, then draws every card many times: its answer passes, no distractor passes, no worked
// example or working nudge gives the answer away, and every program on a card prints that answer in real Python.
export async function writeDrill({ id, builder, about, title, subtitle, categories, cards, draws = 150 }) {
  const src = `// ${about}\n// Loaded by Drills/index.html?drill=${id}\n` +
    `// Generated by tools/${builder}: edit that, then run it. Every answer on a program card is checked by running\n// the program in Python (Skulpt) when the builder runs.\n` +
    `DrillData.register(${JSON.stringify(id)}, {\n  title: ${JSON.stringify(title)},\n  subtitle: ${JSON.stringify(subtitle)},\n` +
    `  categories: [\n${categories.map((c) => '    ' + JSON.stringify(c).replace(/","/g, '", "')).join(',\n')}\n  ],\n` +
    `  cards: (function () {${body(prelude)}\n${body(cards)}\n  })()\n});\n`;
  assert(!/[\u2013\u2014]|&mdash;|&ndash;/.test(src), `dash in drill ${id}`);
  assert(!/mario|party/i.test(src), `drill ${id} mentions the game`);
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
  const c2 = { console, Math, DrillData: { register: (k, d) => { c2.out = d; c2.key = k; } } };
  vm.createContext(c2);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), c2);
  vm.runInContext(src, c2);
  const d = c2.out, escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert(c2.key === id && d.cards.every((c) => d.categories.some((k) => k[0] === c.category)) && new Set(d.cards.map((c) => c.id)).size === d.cards.length, `${id} cards`);
  for (const card of d.cards) for (let n = 0; n < (card.randomize ? draws : 1); n++) {
    const r = { ...card, ...(card.randomize ? card.randomize() : {}) };
    const pass = (s) => r.keywords.some((k) => k.test(s));
    const ans = String(r.answers[0]);
    assert(pass(ans) && pass(ans.toLowerCase()), `${id} ${card.id}: own answer "${ans}" fails`);
    for (const w of r.distractors) assert(!pass(String(w)), `${id} ${card.id}: distractor "${w}" passes (answer ${ans})`);
    assert(r.distractors.length >= 3 && new Set(r.distractors.map(String)).size === r.distractors.length, `${id} ${card.id}: distractors ${JSON.stringify(r.distractors)}`);
    assert(r.example && r.working && r.working.length >= 2, `${id} ${card.id}: help`);
    const inPrompt = new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(r.prompt);
    if (!inPrompt) for (const w of r.working) assert(!new RegExp('(^|[^\\w.-])' + escRe(ans) + '(?!\\w|\\.\\d)', 'i').test(w), `${id} ${card.id}: working shows "${ans}": ${w}`);
    const whole = new RegExp('(^|[^a-z0-9.])' + escRe(ans.toLowerCase()) + '($|[^a-z0-9])');
    assert(!(ans.length >= 3 && whole.test(r.example.toLowerCase()) && !whole.test(r.prompt.toLowerCase())), `${id} ${card.id}: example contains "${ans}"`);
    if (card.pickThenType) {
      const lens = [ans, ...r.distractors].map((s) => s.length);
      assert(Math.max(...lens) <= Math.min(...lens) * 1.6, `${id} ${card.id}: a length tell ${lens}`);
    }
    if (r.py && n < 25) {
      const res = await py(r.py.code, r.py.inputs || []);
      if (r.py.type) assert(!res.error && res.out.at(-1) === r.py.type, `${id} ${card.id}: ${r.py.code} is ${res.out.at(-1)}`);
      else if (r.py.error) assert(res.error, `${id} ${card.id}: ${r.py.code} should stop with an error`);
      else assert(!res.error && res.out.join('\n') === ans, `${id} ${card.id}: Python printed ${JSON.stringify(res.out)} not "${ans}" for ${r.py.code}`);
    }
    assert(!/[\u2013\u2014]/.test(JSON.stringify([r.prompt, r.note, r.working, r.example, r.distractors])), `${id} ${card.id}: dash`);
  }
  console.log(`${id}: ${d.cards.length} cards in ${d.categories.length} categories, all draws pass`);
}

// ---------------------------------------------------------------- register the lesson
// lessons.json is shared with other builders running at the same time: read it just before writing, change only
// Year 7, and write it back in the same format. The unit sits after the 3.x unit (taught in that order).
export function register(id) {
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  const all = JSON.parse(raw);
  const y7 = all.years.find((y) => y.id === 'year7');
  const UNIT = 'Text-based Programming';
  let unit = y7.units.find((u) => u.title === UNIT), changed = false;
  if (!unit) {
    unit = { code: '7P', title: UNIT, lessons: [] };
    const after = y7.units.findIndex((u) => u.title === 'Software Development and Physical Computing');
    y7.units.splice(after >= 0 ? after + 1 : y7.units.length, 0, unit); changed = true;
  }
  if (!unit.lessons.includes(id)) { unit.lessons.push(id); unit.lessons.sort(); changed = true; }
  if (changed) {
    const indent = (raw.match(/\n( +)"/) || [, '  '])[1];
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(all, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
  }
  return y7.units.map((u) => u.title + ' [' + u.lessons.join(', ') + ']').join('; ');
}
export function writeLesson(id, label, steps, validators) {
  fs.writeFileSync(path.join(ROOT, 'LessonData', id + '.json'), JSON.stringify({ id, label, steps, validators, pseudocodeValidators: {} }, null, 1) + '\n');
}
