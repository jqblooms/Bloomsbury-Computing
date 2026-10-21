// Shared pieces for the ACSL Contest 2 lesson builders (tools/build_acsl_c2_loops.mjs, tools/build_acsl_c2_contest.mjs):
// slide helpers in the site's lesson markup, the ACSL interpreter and generators loaded in node, drill writing with
// checks, and registration in the Competition section of lessons.json.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
export const ACSL = require(path.join(ROOT, 'shared', 'acsl-pseudocode.js'));

// The browser files the drills carry, loaded here too so the builder uses exactly the same code.
export const LIB_FILES = ['shared/acsl-pseudocode.js', 'LoopTracer/js/programs.js', 'LoopTracer/js/contest-gen.js'];
export function libSource() { return LIB_FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')).join('\n'); }
export function loadLibs() {
  const ctx = { console, Math, JSON };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(libSource() + '\nthis.ACSLLoops = ACSLLoops; this.ACSLGen = ACSLGen;', ctx);
  return ctx;
}

export const re = (source, flags = 'i') => ({ __regex: true, source, flags });
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
export const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
export const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
export const c = (s) => `<code>${esc(s)}</code>`;
// A boxed ACSL program with line numbers.
export const code = (lines, numbered = true) => '<div class="lesson-code">' +
  lines.map((l, i) => `<div class="lesson-code-line">${numbered ? String(i + 1).padStart(2, '0') + '&nbsp;&nbsp;' : ''}${esc(l).replace(/^( +)/, (m) => '&nbsp;'.repeat(m.length))}</div>`).join('') + '</div>';
export function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
export const why = (q, a) => tps(q, `<p>${a}</p>`);
export const table = (rows, head, style = '') => `<table class="donow-table" style="font-size:17px${style}"><tr>` + head.map((h) => `<th style="padding:6px 12px;text-align:center">${h}</th>`).join('') + '</tr>' +
  rows.map((r) => '<tr>' + r.map((x) => `<td style="padding:5px 12px;text-align:center">${x}</td>`).join('') + '</tr>').join('') + '</table>';

// Runs an ACSL program; throws if it fails.
export function run(lines, opts = {}) {
  const r = ACSL.run(Array.isArray(lines) ? lines.join('\n') : lines, opts);
  if (r.error) throw new Error(`Program failed on line ${r.error.line}: ${r.error.message}\n${lines.join ? lines.join('\n') : lines}`);
  return r;
}
export const out1 = (lines) => run(lines).outputs.join(' ');
// A trace table (Cambridge style: a row for each new value), from the interpreter's events.
export function traceRows(lines) {
  const ev = run(lines, { trace: true }).events.filter((e) => !(e.type === 'assign' && e.final));
  return ev.map((e) => e.type === 'output' ? { line: e.line, name: 'OUTPUT', value: e.value } : { line: e.line, name: e.name, value: ACSL.format(e.value) });
}
const compactTable = (rows, head) => table(rows, head).split('padding:5px 12px').join('padding:2px 10px').split('padding:6px 12px').join('padding:4px 10px');
export function traceTable(lines) {
  const rows = traceRows(lines);
  const cols = [];
  rows.forEach((r) => { if (r.name !== 'OUTPUT' && !cols.includes(r.name)) cols.push(r.name); });
  if (rows.some((r) => r.name === 'OUTPUT')) cols.push('OUTPUT');
  return compactTable(rows.map((r) => [String(r.line)].concat(cols.map((k) => (k === r.name ? (r.value === '' ? '""' : esc(r.value)) : '')))), ['Line'].concat(cols.map((k) => (k === 'OUTPUT' ? 'Output' : k))));
}

// ------------------------------------------------------------------ steps
export function makeSteps(P) {
  const validators = {};
  function checkStep(id, label, heading, lead, parts, extra = '', whyQ = null) {
    const key = `${P}_${id}`.replace(/-/g, '_');
    const vid = `${P}-${id}`;
    validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer, p.cs ? '' : 'i'), feedback: p.feedback, marks: p.marks || 1 }));
    const inputs = parts.map((p, i) => {
      const s = 'abcdefgh'[i];
      return `<div class="lesson-do-now-response${p.line ? ' is-line' : ''}"><label for="${vid}-${s}">(${s}) ${p.label} [${p.marks || 1}]</label>` +
        `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${heading} part ${s}" autocomplete="off"></div>`;
    }).join('');
    const total = parts.reduce((t, p) => t + (p.marks || 1), 0);
    const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
      `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${total} mark${total > 1 ? 's' : ''}</strong></div>` +
      `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
    return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
      content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') +
        (extra ? `<div class="lesson-do-now-columns"><div>${extra}</div>${card}</div>` : card) };
  }
  function embed(id, label, appId, heading, lead, whyQ, embedQuery) {
    const s = { id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
      content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` };
    if (embedQuery) s.embedQuery = embedQuery;
    return s;
  }
  function appLink(id, label, appId, heading, body, button, appQuery, whyQ) {
    const s = { id, label, type: 'app-link', appId, buttonId: `${P}-${id}-open`,
      content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + body + `<p><button type="button" class="donow-btn" id="${P}-${id}-open">${button}</button></p>` };
    if (appQuery) s.appQuery = appQuery;
    return s;
  }
  function mcStep(id, label, heading, lead, items, whyQ, extra = '') {
    const cid = `${P}-${id}`;
    return { id, label, type: 'multiple-choice', containerId: cid,
      content: `<h2 class="lesson-h2">${heading}</h2>` + (whyQ ? why(whyQ[0], whyQ[1]) : '') + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + extra + `<div id="${cid}"></div>`,
      items };
  }
  // Tests one validator part against a typed answer.
  const T = (id, i, s) => { const v = validators[`${P}_${id}`.replace(/-/g, '_')][i].pattern; return new RegExp(v.source, v.flags).test(s); };
  return { validators, checkStep, embed, appLink, mcStep, T };
}

// Patterns for typed answers.
export const numRe = (n) => `^\\s*${n < 0 ? '[-−]\\s*' : ''}${String(Math.abs(n)).replace('.', '\\.')}\\s*$`;
export const wordRe = (w) => `^\\s*${w}\\s*$`;

// ------------------------------------------------------------------ drills
// The drill page loads the data file on its own, so each file carries the interpreter and the generators inside its
// own function scope. Every card is drawn many times here; check-site then grades them all.
export function drillFile(id, header, body) {
  return `${header}\n(function () {\n${libSource()}\n${body}\n})();\n`;
}
export function writeDrill(id, src) {
  assert(!/[–—]|&mdash;|&ndash;/.test(src), id + ': em or en dash');
  const ctx = { console, Math, JSON };
  ctx.window = ctx; ctx.global = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'Drills', 'helpers.js'), 'utf8'), ctx);
  let drill = null;
  ctx.DrillData = { register: (rid, d) => { assert(rid === id, 'registered id ' + rid); drill = d; } };
  vm.runInContext(src, ctx);
  assert(drill && drill.cards.length, id + ' has cards');
  const cats = new Set(drill.categories.map((x) => x[0]));
  for (const card of drill.cards) {
    assert(cats.has(card.category), `${id} ${card.id}: category`);
    const draws = card.randomize ? Array.from({ length: 80 }, () => card.randomize()) : [card];
    for (const d of draws) {
      const kw = (d.keywords || card.keywords || []);
      assert(d.answers && d.answers.length && (d.distractors || card.distractors || []).length >= (/^(TRUE|FALSE)$/.test(d.answers[0]) ? 1 : 2), `${id} ${card.id}: answers and distractors`);
      assert(kw.some((k) => k.test(d.answers[0])), `${id} ${card.id}: answer ${d.answers[0]} fails its keyword`);
      for (const w of d.distractors || card.distractors) assert(!kw.some((k) => k.test(w)), `${id} ${card.id}: distractor ${w} passes for ${d.answers[0]}`);
      assert(!/[–—]/.test(JSON.stringify(d)), `${id} ${card.id}: dash`);
      const ex = d.example || card.example;
      if (ex) {
        const a = String(d.answers[0]).toLowerCase();
        const whole = new RegExp('(^|[^a-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
        assert(!(a.length >= 3 && whole.test(ex.toLowerCase()) && !whole.test(String(d.prompt || card.prompt).toLowerCase())), `${id} ${card.id}: example contains the answer ${a}`);
      }
      const wk = d.working || card.working;
      if (wk) {
        const a = String(d.answers[0]).trim();
        const pat = new RegExp('(^|[^\\w.-])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w|\\.\\d)', 'i');
        if (!pat.test(String(d.prompt || card.prompt))) for (const s of wk) assert(!pat.test(s), `${id} ${card.id}: working shows ${a}: ${s}`);
      }
    }
  }
  fs.writeFileSync(path.join(ROOT, 'Drills', 'data', id + '.js'), src);
  console.log(`${id}: ${drill.cards.length} cards`);
  return drill;
}

// ------------------------------------------------------------------ lesson files
export function writeLesson(id, label, steps, validators) {
  const all = JSON.stringify(steps) + JSON.stringify(validators);
  assert(!/[–—]|&mdash;|&ndash;/.test(all), id + ': em or en dash');
  assert(!/mario/i.test(all), id + ': game mention');
  const ids = steps.map((s) => s.id);
  assert(new Set(ids).size === ids.length, id + ': duplicate step ids');
  fs.writeFileSync(path.join(ROOT, 'LessonData', id + '.json'), JSON.stringify({ id, label, steps, validators, pseudocodeValidators: {} }, null, 1) + '\n');
}
// Adds the lesson to the Competition section's ACSL Junior Contest 2 unit, in contest order. A small text edit:
// lessons.json is shared by several builders, so only that one list is rewritten.
const ORDER = ['acsl-c2-notation', 'acsl-c2-bits', 'acsl-c2-loops', 'acsl-c2-contest'];
export function registerLesson(id) {
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  const at = raw.indexOf('"id": "competition"');
  if (at < 0) { console.log('lessons.json has no competition section: ' + id + ' not registered'); return false; }
  const unitAt = raw.indexOf('ACSL Junior Contest 2', at);
  assert(unitAt > 0, 'the ACSL Junior Contest 2 unit is in lessons.json');
  const open = raw.indexOf('"lessons": [', unitAt) + '"lessons": ['.length;
  const close = raw.indexOf(']', open);
  const inner = raw.slice(open, close);
  const list = JSON.parse('[' + inner + ']');
  if (list.includes(id)) return true;
  list.push(id);
  const rank = (x) => { const k = ORDER.indexOf(x); return k < 0 ? ORDER.length : k; };
  list.sort((a, b) => rank(a) - rank(b));
  const indent = (raw.slice(0, open).match(/\n([ \t]*)[^\n]*$/) || ['', ''])[1];
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const text = nl + list.map((x) => indent + '  "' + x + '"').join(',' + nl) + nl + indent;
  fs.writeFileSync(lp, raw.slice(0, open) + text + raw.slice(close));
  return true;
}

// Card helpers every acsl-c2 drill starts with (inside the drill file, after the generators).
export const DRILL_HEAD = String.raw`
  function numKw(n) { return new RegExp("^\\s*" + (n < 0 ? "[-−]\\s*" : "") + String(Math.abs(n)).replace(".", "\\.") + "\\s*$"); }
  function wrongNums(ans, list) {
    var out = [];
    list.concat([ans + 1, ans - 1, ans + 2, ans * 2]).forEach(function (x) {
      var s = ACSLPseudo.format(x);
      if (x === ans || !isFinite(x) || out.indexOf(s) !== -1 || out.length >= 3 || s === ACSLPseudo.format(ans)) return;
      out.push(s);
    });
    return out;
  }
  function val(e) { return ACSLPseudo.evalExpr(e); }
  function runOut(lines) { var r = ACSLPseudo.run(lines.join("\n")); if (r.error) throw new Error(r.error.message); return r.outputs[0]; }
  var R = ACSLLoops.R, pick = ACSLLoops.pick;
  var FORMAT = { "bits-eval": "Type 5 bits", "bits-solve": "Type 5 characters: 0, 1 or *", "to-postfix": "Type the postfix expression", "to-prefix": "Type the prefix expression" };
  // A card drawn from the generators: the question, the answer, slips as wrong options, a worked example.
  // kinds may be a list: each draw picks one of them.
  function genCard(id, category, kinds) {
    return { id: id, category: category, randomize: function () {
      var kind = typeof kinds === "string" ? kinds : pick(kinds);
      var q = ACSLGen.question(kind);
      var d = { prompt: q.prompt + "\n" + q.code, answers: [q.answer], keywords: [q.keyword], distractors: q.distractors,
        example: q.example, working: q.working, note: q.why.join("\n") };
      if (FORMAT[kind]) d.format = FORMAT[kind];
      return d;
    } };
  }
  // How many times a loop body runs, worked out by adding a counter to the loop.
  function turns(head) { return Number(runOut(["n = 0", head, "  n = n + 1", "NEXT " + head.split(" ")[1], "OUTPUT n"])); }`;
