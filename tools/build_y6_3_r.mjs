// Builds LessonData/y6-3-r.json: Year 6, 6.3.R: Computer Networks Review. A 60-minute lesson students work through
// on their own (no teacher in the room): the slides teach, then Data Bridge 3D does the practice.
//   node tools/build_y6_3_r.mjs
// It adds the lesson as the last lesson of the 6.3 Computer Networks unit in lessons.json (a small text edit, so a
// parallel edit elsewhere in the file is kept).
// Shape: two Do Now slides (6.3.1 to 6.3.3: follow the cables; packets and a trace), each with a Walk me through it on
// a different example; an Extension (the y6-3-2-iroute drill); a title slide; one slide per idea of 6.3.1 to 6.3.3
// (facts, a picture from that lesson and a quick check); how to play; Data Bridge 3D on set y6-networks; one slide per
// idea of 6.3.4 (pictures made by SearchEngine/engine.js, so they rank as the lab does); Data Bridge 3D on y6-search;
// Data Bridge 3D on y6-networks-revision (the longest); the plenary drill y6-3-3-itrace.
// A teacher-only Think, Pair, Share under every heading never gives a slide answer (tools/tps-leak-check.mjs in the shell).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E = createRequire(import.meta.url)(path.join(ROOT, 'SearchEngine', 'engine.js'));
const ID = 'y6-3-r';
const AFTER = 'y6-3-4-isearch';
const TITLE = '6.3.R: Computer Networks Review';
const P = 'y6-3r';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
function tps(question, answer, reveal = 'Show the answer') {
  return `<details class="lesson-tps"><summary><span class="lesson-tps-steps">Think <b>&rarr;</b> Pair <b>&rarr;</b> Share</span>` +
    `<span class="lesson-tps-q">${question}</span><span class="lesson-tps-reveal">${reveal}</span></summary><div class="lesson-tps-a">${answer}</div></details>`;
}
const why = (q, a) => tps(q, `<p>${a}</p>`);
function assert(ok, msg) { if (!ok) throw new Error('Check failed: ' + msg); }
const note = (t) => `<div class="wt-note">${t}</div>`;
const kw = (t) => `<span class="wt-hl">${t}</span>`;
const line = (t) => `<p style="margin:10px 0 0;text-align:center;font-size:20px;font-family:var(--font-mono, monospace)">${t}</p>`;
const num = (n) => '^\\s*' + String(n) + '\\s*$';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mins = (n) => `<strong>${n} minute${n === 1 ? '' : 's'}.</strong> `;

// ---------------------------------------------------------------- pictures (from the 6.3.1 to 6.3.4 builders)
const ADDR = (x, y, a) => a ? `<text x="${x}" y="${y}" text-anchor="middle" fill="var(--brand)" font-size="14" font-weight="700" font-family="var(--font-mono, monospace)">${a}</text>` : '';
const LAPTOP = (x, y, name, a) => `<g><rect x="${x - 24}" y="${y - 24}" width="48" height="32" rx="4" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><rect x="${x - 19}" y="${y - 19}" width="38" height="22" rx="2" fill="var(--brand-soft)"/><rect x="${x - 31}" y="${y + 8}" width="62" height="7" rx="3" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text>${ADDR(x, y + 52, a)}</g>`;
const PRINTER = (x, y, a) => `<g><rect x="${x - 15}" y="${y - 28}" width="30" height="15" rx="2" fill="#f4f6fa" stroke="var(--ink-soft)"/><rect x="${x - 28}" y="${y - 15}" width="56" height="28" rx="6" fill="var(--surface-3)" stroke="var(--ink-soft)" stroke-width="2"/><text x="${x}" y="${y + 34}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">Printer</text>${ADDR(x, y + 52, a)}</g>`;
const SWITCH = (x, y, name = 'Switch') => `<g><rect x="${x - 46}" y="${y - 14}" width="92" height="28" rx="5" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${x - 38 + i * 10}" y="${y - 5}" width="7" height="7" rx="1" fill="var(--surface)" stroke="var(--brand)"/>`).join('')}<text x="${x}" y="${y + 32}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const ROUTER = (x, y, name = 'Router') => `<g><line x1="${x - 20}" y1="${y - 12}" x2="${x - 26}" y2="${y - 30}" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/><line x1="${x + 20}" y1="${y - 12}" x2="${x + 26}" y2="${y - 30}" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/><rect x="${x - 34}" y="${y - 12}" width="68" height="24" rx="6" fill="#fde7c7" stroke="#c77700" stroke-width="2"/><circle cx="${x - 20}" cy="${y}" r="3" fill="#2f9e44"/><circle cx="${x - 10}" cy="${y}" r="3" fill="#2f9e44"/><text x="${x}" y="${y + 30}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="600">${name}</text></g>`;
const CABLE = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink-soft)" stroke-width="5" stroke-linecap="round"/>`;
const BOX = (x, y, w, h, label) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 5"/><text x="${x + 10}" y="${y + 20}" fill="var(--muted)" font-size="15" font-weight="700">${label}</text>`;
const TAG = (x, y, text) => `<g><rect x="${x - 80}" y="${y - 16}" width="160" height="32" rx="6" fill="var(--surface)" stroke="var(--brand)" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" fill="var(--ink)" font-size="15" font-weight="700" font-family="var(--font-mono, monospace)">${text}</text></g>`;
const PKT = (x, y, n, word) => `<g><rect x="${x - 34}" y="${y - 20}" width="68" height="40" rx="6" fill="var(--surface)" stroke="var(--brand)" stroke-width="2"/><circle cx="${x - 34}" cy="${y - 20}" r="12" fill="var(--brand)"/><text x="${x - 34}" y="${y - 15}" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${n}</text><text x="${x + 4}" y="${y + 6}" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="600">${word}</text></g>`;
const pic = (w, h, inner, caption, maxw = w) => `<figure style="margin:0;text-align:center"><svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${maxw}px;height:auto">${inner}</svg><figcaption style="font-size:15px;color:var(--muted)">${caption}</figcaption></figure>`;
const traceBox = (title, rows) => `<div style="font-family:var(--font-mono, monospace);font-size:17px;background:var(--surface-2);border:1px solid var(--line, var(--muted));border-radius:10px;padding:10px 14px;max-width:420px;margin:0 auto">` +
  `<div style="font-weight:700;margin-bottom:6px">${title}</div>` + rows.map(([n, name, a]) => `<div style="display:flex;gap:10px"><span style="width:22px">${n}.</span><span style="flex:1">${name}</span><span style="color:var(--brand);font-weight:700">${a}</span></div>`).join('') + '</div>';
const chain = (labels, caption) => {
  const xs = labels.map((_, i) => 40 + i * 92);
  let s = '';
  for (let i = 0; i + 1 < labels.length; i++) s += CABLE(xs[i], 60, xs[i + 1], 60);
  labels.forEach((l, i) => { s += (i === 0 || i === labels.length - 1) ? LAPTOP(xs[i], 60, l) : ROUTER(xs[i], 60, l); });
  return pic(xs[xs.length - 1] + 40, 110, s, caption);
};
// search results, as Search Engine Lab shows them
function mark(text, keys, title) {
  return String(text).split(/(\s+)/).map((w) => {
    const s = E.stem(w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    return s && keys.includes(s) ? `<mark style="background:${title ? 'color-mix(in srgb, var(--brand) 25%, transparent)' : 'var(--warn-soft)'};color:inherit;font-weight:700;border-radius:3px;padding:0 2px">${esc(w)}</mark>` : esc(w);
  }).join('');
}
function resultCard(p, rank, keys) {
  return `<div style="border:1px solid var(--line);border-radius:10px;padding:4px 8px;display:grid;grid-template-columns:28px 1fr;gap:0 8px;margin:5px 0;background:var(--surface);text-align:left">` +
    `<div style="grid-row:1 / span 3;font:800 20px var(--font-mono, monospace);color:var(--brand);align-self:center;text-align:center">${rank}</div>` +
    `<div style="font-weight:700;font-size:15px">${mark(p.title, keys, true)}</div><div style="font:12px var(--font-mono, monospace);color:var(--good)">${esc(p.url)}</div>` +
    `<div style="font-size:13px;color:var(--ink-soft)">${mark(p.text, keys)}</div></div>`;
}
function results(q, n, caption) {
  const s = E.search(q);
  return `<figure style="margin:0"><div style="display:flex;gap:8px;align-items:center;background:var(--surface-3);border-radius:10px;padding:5px 10px"><b style="color:var(--brand)">Seekit</b><span style="flex:1;background:var(--surface);border-radius:8px;padding:2px 8px;font-weight:600">${esc(q)}</span></div>` +
    s.results.slice(0, n).map((r, i) => resultCard(r.page, i + 1, s.read.keys)).join('') +
    (caption ? `<figcaption style="font-size:15px;color:var(--muted);text-align:center">${caption}</figcaption>` : '') + '</figure>';
}
const pages = (ids, keys, caption) => `<figure style="margin:0">${ids.map((id) => resultCard(E.page(id), '?', keys)).join('')}<figcaption style="font-size:15px;color:var(--muted);text-align:center">${caption}</figcaption></figure>`;
const PAGEBOX = (x, y, title, lines) => `<g><rect x="${x}" y="${y}" width="150" height="74" rx="8" fill="var(--surface)" stroke="var(--ink-soft)" stroke-width="2"/><rect x="${x}" y="${y}" width="150" height="18" rx="8" fill="var(--surface-3)"/><text x="${x + 8}" y="${y + 36}" fill="var(--ink)" font-size="14" font-weight="700">${title}</text>${lines.map((l, i) => `<text x="${x + 8}" y="${y + 54 + i * 15}" fill="var(--ink-soft)" font-size="12">${l}</text>`).join('')}</g>`;
const listPic = `<figure style="margin:0;text-align:center"><svg viewBox="0 0 560 270" style="width:100%;max-width:440px;height:auto">` +
  PAGEBOX(10, 10, 'Tigers: Facts', ['Tigers live in Asia.']) + PAGEBOX(10, 98, 'Greenhill Library', ['Open 9 am to 5 pm.']) + PAGEBOX(10, 186, 'Easy Pizza Recipe', ['Bake for 15 minutes.']) +
  `<line x1="170" y1="135" x2="300" y2="135" stroke="var(--brand)" stroke-width="3"/><path d="M290 127 L304 135 L290 143 Z" fill="var(--brand)"/><text x="235" y="122" text-anchor="middle" fill="var(--brand)" font-size="14" font-weight="700">visits pages</text>` +
  `<line x1="168" y1="47" x2="300" y2="120" stroke="var(--brand)" stroke-width="2" stroke-dasharray="5 5"/><line x1="168" y1="223" x2="300" y2="150" stroke="var(--brand)" stroke-width="2" stroke-dasharray="5 5"/>` +
  `<rect x="310" y="20" width="240" height="230" rx="10" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/><text x="430" y="44" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="800">Its list</text>` +
  [['tiger', 'Tigers: Facts'], ['asia', 'Tigers: Facts'], ['library', 'Greenhill Library'], ['open', 'Greenhill Library'], ['pizza', 'Easy Pizza Recipe'], ['bake', 'Easy Pizza Recipe']].map(([w, p], i) =>
    `<text x="326" y="${74 + i * 28}" fill="var(--brand)" font-size="14" font-weight="700" font-family="var(--font-mono, monospace)">${w}</text><text x="400" y="${74 + i * 28}" fill="var(--ink)" font-size="14">${p}</text>`).join('') +
  `</svg><figcaption style="font-size:15px;color:var(--muted)">It visits web pages and keeps a list of their words</figcaption></figure>`;

// ---------------------------------------------------------------- step builders
const validators = {};
const steps = [];
function checkStep(id, label, lead, parts, whyQ, extra) {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label}</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off" inputmode="decimal"></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} marks</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + `<div class="lesson-do-now-columns"><div>${extra}</div><div>${card}</div></div>` };
}
function mcStep(id, label, lead, items, whyQ, left) {
  const cid = `${P}-${id}`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + `<div class="igame-two-col"><div>${left}</div><div id="${cid}"></div></div>`, items };
}
// one idea: the facts and a picture on the left, a quick check on the right
const READ = 'Read the left side. Then answer the questions on the right, and read the reason after each answer.';
const teach = (id, label, n, list, picture, items, whyQ) => mcStep(id, label, mins(n) + READ, items, whyQ, facts(list) + picture);
function embed(id, label, appId, lead, whyQ, embedQuery) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + `<p class="lesson-lead">${lead}</p>` + `<div id="${P}-${id}"></div>` }, embedQuery ? { embedQuery } : {});
}
const KEYS = 'W A S D walk, B build, E use. RED light: hold Space. Stuck? Learn mode on the start screen.';
const bridge = (id, label, n, set, goal, lead, whyQ) => embed(id, label, 'bridge-builder-3d', mins(n) + lead + ' ' + KEYS, whyQ, `set=${set}&goal=${goal}`);

// ---------------------------------------------------------------- Do Now 1: follow the cables (6.3.1 and 6.3.2)
const dnNets = pic(560, 290, BOX(10, 10, 300, 270, 'Home') + BOX(400, 10, 150, 270, 'School') +
  CABLE(150, 150, 60, 60) + CABLE(150, 150, 60, 235) + CABLE(150, 150, 240, 235) + CABLE(150, 150, 350, 150) + CABLE(475, 150, 475, 235) +
  SWITCH(150, 150) + ROUTER(350, 150) + SWITCH(475, 150) + LAPTOP(60, 60, 'Ben') + LAPTOP(240, 60, 'Dev') + LAPTOP(60, 235, 'Ana') + PRINTER(240, 235) + LAPTOP(475, 235, 'Chi'),
  'Follow the cables', 460);
steps.push(mcStep('do-now', 'Do Now: Follow the Cables (1 of 2)', mins(4) + 'From 6.3.1 and 6.3.2. Look at the cables in the picture, then answer.', [
  { prompt: 'Can Ben print on the Printer?', options: ['Yes', 'No'], correct: 0,
    explain: 'Ben, then the switch, then the Printer. They are all plugged into the same switch.' },
  { prompt: 'Can Dev print on the Printer?', options: ['Yes', 'No'], correct: 1,
    explain: 'Dev has no cable. Nothing joins Dev to the switch, so nothing can travel from Dev.' },
  { prompt: 'Can Ana send Chi at school a message?', options: ['Yes', 'No'], correct: 1,
    explain: 'Ana, the switch, then the router. No cable goes from the router to the school switch, so the message cannot get to school.' },
], ['Why might a school put every laptop on a network?', 'So people can communicate and share, for example one printer for the whole class.'], dnNets));
const wtNets = pic(560, 290, BOX(10, 10, 300, 270, 'Library') + BOX(400, 10, 150, 270, 'Shop') +
  CABLE(150, 150, 60, 60) + CABLE(150, 150, 60, 235) + CABLE(150, 150, 240, 235) + CABLE(150, 150, 350, 150) + CABLE(350, 150, 475, 150) + CABLE(475, 150, 475, 235) +
  SWITCH(150, 150) + ROUTER(350, 150) + SWITCH(475, 150) + LAPTOP(60, 60, 'Jo') + LAPTOP(240, 60, 'Max') + LAPTOP(60, 235, 'Sam') + PRINTER(240, 235) + LAPTOP(475, 235, 'Kim'),
  'A different picture', 420);
steps.at(-1).walkthrough = { title: 'Walk me through it: following the cables', steps: [
  { text: '<strong>A different picture.</strong> Do the same steps with the Do Now picture.', visual: wtNets },
  { text: 'Can Sam print? Start at Sam. Follow his cable to the switch. Is the Printer plugged into the same switch? Then the data can get there.', visual: line('Sam &rarr; Switch &rarr; ' + kw('Printer')) },
  { text: 'Can Max print? Start at Max and look for his cable. There is no cable, so nothing can leave Max.', visual: line('Max &rarr; ' + kw('?')) },
  { text: 'Can Jo send Kim at the shop a message? Kim is on another network. Follow the cables from Jo to the switch, then to the router. Is there a cable from the router to the shop switch?', visual: line('Jo &rarr; Switch &rarr; Router &rarr; ' + kw('Shop switch') + ' &rarr; Kim') },
  { text: 'Now look at the Do Now picture. Start at the sender. Follow each cable, one step at a time. Check every step has a cable.', visual: note('start at the sender, follow every cable') },
] };

// ---------------------------------------------------------------- Do Now 2: packets and a trace (6.3.2 and 6.3.3)
const DN2 = { missing: 2, routers: 4, server: '198.51.100.30' };
const dnTrace = traceBox('Trace route to www.zoo.example', [[1, 'Home router', '192.168.1.1'], [2, 'Router A', '81.2.3.1'], [3, 'Router F', '81.2.3.6'], [4, 'Router G', '81.2.3.7'], [5, 'Web server', DN2.server]]);
steps.push(checkStep('do-now-2', 'Do Now: Packets and Traces (2 of 2)', mins(4) + 'From 6.3.2 and 6.3.3. Type your answers, then press Check answers.', [
  { label: 'A photo is split into packets numbered 1 to 6. Packets 1, 3, 4 and 6 arrive. How many packets are missing?', answer: num(DN2.missing), feedback: 'Write the numbers 1 to 6. Which ones did not arrive?' },
  { label: 'Read the trace. How many routers are on the way to the web server?', answer: num(DN2.routers), feedback: 'Count only the routers. The last hop is not a router.' },
  { label: 'Type the address of the web server that keeps www.zoo.example.', answer: '^\\s*198\\.51\\.100\\.30\\s*$', feedback: 'Which hop is the web server? Copy its address exactly, dots and all.' },
], ['Why does each packet have a number on it?', 'Packets can take different routes and arrive in a different order. The numbers let the computer at the end put them back together.'], dnTrace));
steps.at(-1).walkthrough = { title: 'Walk me through it: packets and traces', steps: [
  { text: '<strong>A similar question.</strong> Packets numbered 1 to 7 are sent. Packets 1, 2, 3, 4, 6 and 7 arrive.', visual: note('sent: 1 to 7') },
  { text: 'Write every number from 1 to 7. Cross out each packet that arrived. The numbers left are missing.', visual: line('1 2 3 4 ' + kw('5') + ' 6 7') },
  { text: 'Only packet 5 is left, so ' + kw('1') + ' packet is missing.', visual: line('missing: ' + kw('1')) },
  { text: '<strong>A similar trace.</strong> Which hop keeps the website? Look at the <strong>last</strong> hop.', visual: traceBox('Trace route to www.art.example', [[1, 'Home router', '192.168.0.1'], [2, 'Router K', '62.1.1.1'], [3, 'Router M', '62.1.1.3'], [4, 'Web server', '203.0.113.50']]) + line('web server: ' + kw('203.0.113.50')) },
  { text: 'Now count the routers. Skip the last hop: it is not a router.', visual: line(kw('Home router') + ', ' + kw('Router K') + ', ' + kw('Router M') + ': 3 routers') },
  { text: 'Now do the Do Now in the same way: cross out what arrived, then read the last hop, then count the routers before it.', visual: note('cross out, last hop, count the routers') },
] };

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-y6-3-2-iroute',
  '<strong>Extension:</strong> only if you finished the Do Now early. More questions on routers and packets. Stuck? Turn on <strong>I need help</strong>. When the Do Now time is up, press Next.',
  ['Why practise old questions before the new slides?', 'Each new slide builds on the last lessons. If you remember them, the new slides are easier.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: TITLE,
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">6.3 Computer Networks</p><h2 class="lesson-h2">Computer Networks Review</h2><p>Year 6, 6.3.R</p></div>' +
    why('Why read every slide carefully today?', 'Nobody is there to explain it. The slide is your teacher today, so everything you need is on it.') +
    facts([mins(1) + '<strong>Today you work on your own.</strong> The slides teach you. Read each one, do what it says, then press Next.',
      'Each slide says how many minutes it takes. Look at the clock.',
      'Then you play <strong>Data Bridge 3D</strong>: answer questions to earn coins, then build bridges.',
      '<strong>Stuck in the game?</strong> Press <strong>Learn mode</strong> on its start screen. It shows a worked example and gives free help.',
      '<strong>Notes:</strong> press the pen icon at the top. Write down every fact you get wrong.',
      '<strong>Done:</strong> you reach the last slide and finish the drill.']) });

// ---------------------------------------------------------------- 6.3.1 to 6.3.3, one idea a slide
const shared = pic(380, 200, CABLE(190, 110, 60, 40) + CABLE(190, 110, 320, 40) + CABLE(190, 110, 60, 170) + CABLE(190, 110, 320, 170) +
  SWITCH(190, 110) + LAPTOP(60, 40, 'Ana') + LAPTOP(320, 40, 'Ben') + LAPTOP(60, 170, 'Chi') + PRINTER(320, 170), 'Every device plugged into a switch', 340);
steps.push(teach('net-network', 'Networks and Switches', 2, [
  'A <strong>network</strong> is two or more computers that are <strong>joined together</strong>, by cables or by Wi-Fi.',
  'Networks let people <strong>communicate</strong> (messages, video calls) and <strong>share</strong> (files, a printer).',
  'A laptop has <strong>one network socket</strong>. A <strong>switch</strong> has many, so every device plugs into the switch.'], shared, [
  { prompt: 'Four laptops must be joined. Each has one network socket. What do you need?', options: ['A switch', 'A longer cable', 'A second printer'], correct: 0,
    explain: 'A switch has many sockets, so every laptop can plug into it.' },
  { prompt: 'A class has 20 laptops on a network and one printer. Why is this better than 20 printers?', options: ['It costs less: they all share one printer', 'The printer prints faster', 'The laptops do not need charging'], correct: 0,
    explain: 'Sharing one printer over the network means the school buys one printer, not twenty.' },
], ['Why is "the laptops are next to each other" not enough to make a network?', 'Being close does not join them. Data can only travel if there is a cable or Wi-Fi between them.']));

steps.push(teach('net-router', 'Routers and the Internet', 2, [
  'A switch joins the devices <strong>inside one</strong> network. A <strong>router</strong> joins <strong>networks</strong> together.',
  'The <strong>internet</strong> is many networks joined to each other by routers, all round the world.',
  'The path data takes is its <strong>route</strong>. Each router receives the data, then sends it on to the next one.'],
  chain(['Ana', 'Home', 'A', 'C', 'School', 'Ben'], 'Ana &rarr; Home router &rarr; Router A &rarr; Router C &rarr; School router &rarr; Ben'), [
  { prompt: 'Which joins the home network to the school network?', options: ['A router', 'A switch', 'A printer'], correct: 0,
    explain: 'A router joins different networks and passes data between them. A switch works inside one network.' },
  { prompt: 'Look at the picture. How many routers does the message pass through, from Ana to Ben?', options: ['6', '3', '4'], correct: 2,
    explain: 'Home router, Router A, Router C, School router: 4. Ana and Ben are laptops, not routers.' },
], ['Why can a message not go along one cable from Bangkok to London?', 'No one cable goes that far. So data travels a long way one step at a time.']));

const orderPic = pic(470, 175, `<text x="10" y="22" fill="var(--muted)" font-size="15" font-weight="700">They arrive:</text>` + PKT(60, 55, 3, 'pizza') + PKT(170, 55, 1, 'We') + PKT(280, 55, 4, 'today') + PKT(390, 55, 2, 'like') +
  `<text x="10" y="112" fill="var(--muted)" font-size="15" font-weight="700">Sorted by number:</text>` + PKT(60, 145, 1, 'We') + PKT(170, 145, 2, 'like') + PKT(280, 145, 3, 'pizza') + PKT(390, 145, 4, 'today'), 'The numbers put the message back in order', 420);
steps.push(teach('net-packets', 'Data in Packets', 2, [
  'Data is split into small parts called <strong>packets</strong>. Routers send and receive data as packets.',
  'Each packet has a <strong>number</strong>. Packets can take different routes, so they can arrive in a different order.',
  'The computer at the end sorts them by number. If one packet is lost, only that one is sent again.'], orderPic, [
  { prompt: 'These packets arrive: 2 "is", 3 "fun", 1 "Coding". What is the message?', options: ['is fun Coding', 'Coding is fun', 'fun is Coding'], correct: 1,
    explain: 'Sort by number: 1 Coding, 2 is, 3 fun.' },
  { prompt: 'One packet of a photo is lost on the way. What happens?', options: ['The photo is lost forever', 'The whole photo is sent again', 'Only that packet is sent again'], correct: 2,
    explain: 'Each packet travels on its own, so only the lost packet needs to be sent again.' },
], ['Why is a big photo sent as many small packets, and not in one piece?', 'Many people can share the same cables, taking turns, so nobody waits behind one huge photo.']));

const addrPic = pic(480, 300, CABLE(240, 150, 70, 50) + CABLE(240, 150, 410, 50) + CABLE(240, 150, 70, 210) + CABLE(240, 150, 410, 210) +
  SWITCH(240, 150) + LAPTOP(70, 50, 'Ana', '10.0.0.5') + LAPTOP(410, 50, 'Ben', '10.0.0.8') + LAPTOP(70, 210, 'Chi', '10.0.0.4') + PRINTER(410, 210, '10.0.0.7'), 'Each device has its own address', 380);
steps.push(teach('net-address', 'Every Device Has an Address', 2, [
  'Every device on a network has its own <strong>address</strong>, a number like 192.168.1.3. On the internet it is called an <strong>IP address</strong>.',
  'Data carries the address of the device it is going to. Two devices must never have the same address.',
  'In a <strong>terminal</strong>, type <strong>ipconfig</strong> to see a computer\'s IP address.'], addrPic, [
  { prompt: 'Look at the picture. A message goes to 10.0.0.4. Which device gets it?', options: ['Ana', 'Chi', 'The Printer'], correct: 1,
    explain: 'Chi\'s address is 10.0.0.4, so the message goes to Chi.' },
  { prompt: 'Ben and Dev both have the address 10.0.0.8. A message goes to 10.0.0.8. What happens?', options: ['Ben gets it, because he was first', 'It goes to both, much faster', 'The network cannot tell which one it is for'], correct: 2,
    explain: 'Two devices with one address: the network cannot tell which one the data is for.' },
], ['A pizza is going to a house on a long street. Why does the driver need the house number, not only the street name?', 'Many houses are on one street. The number picks out exactly one house.']));

const WEB = { server: '203.0.113.25' };
const webTrace = traceBox('Trace route to www.park.example', [[1, 'Home router', '192.168.1.1'], [2, 'Router A', '81.2.3.1'], [3, 'Router B', '81.2.3.2'], [4, 'Web server', WEB.server]]);
steps.push(teach('net-web', 'Websites, the Web and Traces', 2, [
  'A <strong>website</strong> is kept on a <strong>web server</strong>: a computer on the internet with its own address.',
  'The <strong>World Wide Web</strong> is all the web pages kept on web servers. The internet carries them to you.',
  'A <strong>trace</strong> lists each hop on the way to a website: every router, then its web server last.'], webTrace, [
  { prompt: 'Read the trace. What is the address of the web server that keeps www.park.example?', options: ['192.168.1.1', '81.2.3.2', WEB.server], correct: 2,
    explain: 'The last hop is the web server: ' + WEB.server + '. The other hops are routers.' },
  { prompt: 'What is the World Wide Web?', options: ['All the networks joined by routers', 'All the web pages kept on web servers', 'One very big computer'], correct: 1,
    explain: 'The web is the web pages. The networks and routers are the internet, which carries the pages.' },
], ['Roads and shops: why are the roads not the same thing as the shops?', 'The roads carry you to the shops. The shops hold the things you want.']));

// ---------------------------------------------------------------- how to play, then Data Bridge 3D on networks
steps.push({ id: 'how-to-play', label: 'How to Play Data Bridge 3D',
  content: '<h2 class="lesson-h2">How to Play Data Bridge 3D</h2>' +
    why('Why does a wrong answer in the game still help you learn?', 'The game shows the reason. If you write it in your notes, you get it right next time.') +
    `<p class="lesson-lead">${mins(1)}Read the steps. The next slide is the game.</p>` +
    '<ol class="lesson-facts" style="font-size:21px;line-height:1.55">' +
    '<li><strong>Answer the question</strong> in the side panel. Right answers earn coins.</li>' +
    '<li><strong>Walk</strong> with W A S D. Press <strong>B</strong> to build the bridge with your coins. Press <strong>E</strong> to use things.</li>' +
    '<li><strong>Ride the cart</strong> across. When the light is <strong>RED</strong>, hold <strong>Space</strong> to stay in the cart.</li>' +
    '<li>The bridge breaks? Answer a new question for more coins, then build again.</li>' +
    '<li><strong>Stuck?</strong> Press <strong>Learn mode</strong> on the start screen. It shows a worked example and gives free help. Then go back to Play.</li>' +
    '<li><strong>Done:</strong> your cart crosses 2 bridges. Then keep playing until the time is up.</li></ol>' });
steps.push(bridge('bridge-networks', 'Data Bridge 3D: Networks', 9, 'y6-networks', 2,
  'Questions from 6.3.1 to 6.3.3. Done: 2 bridges crossed, or the time is up. Then press Next.',
  ['Why read the whole question before you answer, even when you want to build?', 'A quick wrong answer earns fewer coins. Reading it all first earns more.']));

// ---------------------------------------------------------------- 6.3.4, one idea a slide
steps.push(teach('search-engine', 'What Is a Search Engine?', 2, [
  'A <strong>search engine</strong> is a website that finds web pages for you. The words you type are your <strong>search terms</strong>.',
  'It visits web pages all the time and keeps a <strong>list</strong> of the pages and the words on them.',
  'When you search, it looks in its list. It does not read every page again.'], listPic, [
  { prompt: 'You search for tiger. Where does the search engine look?', options: ['At every web page, one by one, right then', 'Inside your own laptop', 'In its list of web pages and their words'], correct: 2,
    explain: 'It looks in its list. It made the list before you asked, so the search is fast.' },
  { prompt: 'A new web page about red pandas went online a minute ago. Why might a search not find it yet?', options: ['The search engine has not visited it, so it is not in the list', 'Web pages about red pandas are not allowed', 'The internet is too full today'], correct: 0,
    explain: 'The search engine only finds pages in its list. It adds a new page when it visits it.' },
], ['There are millions of web pages. Why can a search still take less than a second?', 'The hard work was done before you asked, so there is much less to do when you search.']));

const RQ = 'zoo ticket', RIDS = ['bus', 'zoo', 'pool'];
{
  const r = E.search(RQ).results.slice(0, 3);
  assert(r.map((x) => x.page.id).join() === 'zoo,pool,bus', 'rank order ' + r.map((x) => x.page.id));
  assert(r[0].matched === 2 && r[1].matched === 1 && r[2].matched === 1 && r[1].score > r[2].score, 'rank slide shows both rules');
  assert(E.page('pool').title.toLowerCase().includes('ticket') && !E.page('bus').title.toLowerCase().includes('zoo'), 'pool wins on the title');
}
steps.push(teach('search-rank', 'Best Match First', 2, [
  'The search engine puts the pages in order, best match first. This is called <strong>ranking</strong>.',
  'Pages with <strong>more</strong> of your search terms come first.',
  'Same number? A search term in the <strong>title</strong> counts more than one in the text.'],
  pages(RIDS, E.read(RQ).keys, 'Search: <b>' + RQ + '</b>. Not in rank order. Search terms are marked.'), [
  { prompt: 'Which page will be ranked 1st?', options: [E.page('bus').title, E.page('zoo').title, E.page('pool').title], correct: 1,
    explain: E.page('zoo').title + ' has both search terms: zoo and ticket.' },
  { prompt: 'The other two pages each have one search term. Why is the Swimming Pool page ranked above the Bus Times page?', options: ['It has more search terms', 'Its search term is in the title', 'It is a newer page'], correct: 1,
    explain: 'Ticket is in the Swimming Pool page\'s title. Zoo is only in the Bus Times page\'s text.' },
], ['Why does a search engine put the best match at the top, and not at the bottom?', 'Most people only read the first few results. The page they want should be where they look first.']));

assert(E.rankOf('library opening times', 'library') === 1 && E.rankOf('fix mouse', 'fixmouse') === 1 && E.rankOf('mouse', 'fixmouse') !== 1, 'search-terms answers');
steps.push(teach('search-terms', 'Clear Search Terms', 2, [
  '<strong>Clear search terms</strong> are a few key words that the page you want has.',
  'Leave out small words like how, the, is and I. Spell the words right.',
  'A word with two meanings needs one more word.'], results('mouse', 3, 'Kim wants to fix her computer mouse. She searched for mouse.'), [
  { prompt: 'Ben wants to know when Greenhill Library opens. Which search terms are clearest?', options: ['library opening times', 'when does it open please', 'open'], correct: 0,
    explain: 'library opening times: three key words that the library page has. The others have small words, or one word that many pages have.' },
  { prompt: 'Look at Kim\'s search. What should she search for instead?', options: ['the mouse please', 'fix mouse', 'mouse mouse'], correct: 1,
    explain: 'mouse has two meanings, an animal and a computer mouse. One more word, fix, picks the right page.' },
], ['Why do small words like the and is not help a search?', 'Almost every page has them, so they do not pick out the page you want.']));

steps.push(bridge('bridge-search', 'Data Bridge 3D: Searching the Web', 10, 'y6-search', 2,
  'Questions from 6.3.4. Done: 2 bridges crossed, or the time is up. Then press Next.',
  ['Why use Learn mode when you are stuck, and not guess?', 'A guess teaches you nothing. A worked example shows you how to do the next one.']));

// ---------------------------------------------------------------- the longest game: every topic
steps.push(bridge('bridge-final', 'Data Bridge 3D: All of Computer Networks', 11, 'y6-networks-revision', 3,
  'Questions on every topic. Cross as many bridges as you can. Stop 4 minutes before the end and press Next.',
  ['Why practise every topic together at the end?', 'Mixed questions make you choose which fact to use. That is how a test asks them.']));

steps.push(embed('plenary', 'Plenary: Addresses and the Web Drill', 'drill-y6-3-3-itrace',
  mins(4) + 'Answer a batch of five. Three right in a row masters a card. Your progress is saved for your teacher. Done: the lesson is over.',
  ['Which fact from today will you check in your notes first, and why?', 'Each person names their own, for example the one they got wrong in the game, because it is the one they do not know yet.']));

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now-2', 0, ['2', ' 2 '], ['4', '6', '12']);
ok('do-now-2', 1, ['4'], ['5', '3', '14']);
ok('do-now-2', 2, ['198.51.100.30', ' 198.51.100.30 '], ['81.2.3.7', '198.51.100.3', '198.51.100.300', '198x51x100x30']);
// the MC answers are what the pictures show
assert(steps.find((s) => s.id === 'do-now').items.map((i) => i.correct).join() === '0,1,1', 'do-now answers');
// the walkthroughs never use the Do Now names or highlight a Do Now answer
steps.filter((s) => s.walkthrough).forEach((s) => {
  const w = JSON.stringify(s.walkthrough.steps);
  assert(!/\b(Ana|Ben|Chi|Dev)\b|zoo\.example|198\.51\.100\.30/.test(w), s.id + ' walkthrough uses the Do Now');
  (w.match(/wt-hl\\?">([^<]*)</g) || []).forEach((h) => assert(!/>(2|4)</.test(h) && !/\bYes\b|\bNo\b/.test(h), s.id + ' walkthrough highlights a Do Now answer: ' + h));
});
const total = steps.reduce((t, s) => { const m = /<strong>(\d+) minutes?\.<\/strong>/.exec(s.content); return t + (m ? Number(m[1]) : 0); }, 0);
assert(total === 60, 'minutes add to ' + total);
const db = steps.filter((s) => s.appId === 'bridge-builder-3d');
assert(db.length === 3 && db.map((s) => s.embedQuery).join('|') === 'set=y6-networks&goal=2|set=y6-search&goal=2|set=y6-networks-revision&goal=3', 'Data Bridge 3D sets');
const dbMins = db.map((s) => Number(/<strong>(\d+) minutes/.exec(s.content)[1]));
assert(dbMins[2] === Math.max(...steps.map((s) => Number((/<strong>(\d+) minutes/.exec(s.content) || [0, 0])[1]))), 'the last game has the most minutes');
// the 3D app is 640 tall: a game slide has only a heading, the TPS, one lead and the embed
db.forEach((s) => { const lead = /<p class="lesson-lead">([\s\S]*?)<\/p>/.exec(s.content)[1].replace(/<[^>]+>/g, ''); assert(lead.length <= 210, s.id + ' lead too long: ' + lead.length); });
assert(!/data bridge|mario/i.test(TITLE), 'title names a game');
steps.forEach((s) => assert(/class="lesson-tps"/.test(s.content), s.id + ' has no Think, Pair, Share'));
steps.filter((s) => s.id !== 'do-now-ext').forEach((s) => assert(/<strong>\d+ minutes?\.<\/strong>/.test(s.content), s.id + ' has no minutes'));
const all = JSON.stringify({ steps, validators });
assert(!/[–—]|&mdash;|&ndash;|mario/i.test(all), 'dash or game mention');
assert(!/\bURL\b|\bLAN\b|\bWAN\b|\bDNS\b/i.test(all), 'a term the unit does not teach');
assert(new Set(steps.map((s) => s.id)).size === steps.length, 'step ids unique');
steps.filter((s) => s.type === 'multiple-choice').forEach((s) => s.items.forEach((i, k) => assert(i.correct >= 0 && i.correct < i.options.length && new Set(i.options).size === i.options.length, s.id + ' item ' + k)));

fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify({ id: ID, label: TITLE, steps, validators, pseudocodeValidators: {} }, null, 1) + '\n');

// ---------------------------------------------------------------- register: last in the 6.3 unit (a small text edit)
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const m = new RegExp(`"${AFTER}"(\\r?\\n)([ \\t]*)\\]`).exec(raw);
    assert(m, AFTER + ' is not the last lesson of its unit');
    const at = m.index + `"${AFTER}"`.length;
    const ind = /\n([ \t]*)"[^"\n]*"\s*$/.exec(raw.slice(0, at))[1];
    fs.writeFileSync(lp, raw.slice(0, at) + `,${m[1]}${ind}"${ID}"` + raw.slice(at));
  }
  const data = JSON.parse(fs.readFileSync(lp, 'utf8'));
  const u = data.years.find((y) => y.id === 'year6').units.find((x) => x.code === '6.3');
  assert(u && u.lessons.at(-1) === ID && u.lessons.at(-2) === AFTER, '6.3 unit order ' + (u && u.lessons));
}
console.log(`${ID}: ${steps.length} steps, ${total} minutes`);
