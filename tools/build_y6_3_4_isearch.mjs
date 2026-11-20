// Builds LessonData/y6-3-4-isearch.json: Year 6, 6.3.4: Searching the Web (plan 2.4 iSearch: search engines keep and
// rank a list of web pages; clear search terms find things).
//   node tools/build_y6_3_4_isearch.mjs
// It writes the plenary drill y6-3-4-isearch and adds the lesson after y6-3-3-itrace in lessons.json.
// Do Now: 6.3.3 (read a trace; a free address and where a website is kept); the Extension reuses the y6-3-3-itrace drill.
// Activities: Search Engine Lab (pages SearchEngine/, registry id search-engine-lab), part=1 (Predict the Top Result)
// and part=2 (Find It, Fix the Search); the pictures of results are made by SearchEngine/engine.js itself, so the
// slides rank exactly as the lab does. Then 15 minutes of Network Help Desk lesson 2.4 (party server on the class LAN).
// Terms taught here, each on its own slide: search engine and search terms, rank, clear search terms.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const E = createRequire(import.meta.url)(path.join(ROOT, 'SearchEngine', 'engine.js'));
const ID = 'y6-3-4-isearch';
const AFTER = 'y6-3-3-itrace';
const P = 'y6-34';
const re = (source) => ({ __regex: true, source, flags: 'i' });
const facts = (items) => '<ul class="lesson-facts">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
const columns = (a, b) => `<div class="lesson-do-now-columns"><div>${a}</div><div>${b}</div></div>`;
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

// ---------------------------------------------------------------- pictures
const traceBox = (title, rows) => `<div style="font-family:var(--font-mono, monospace);font-size:17px;background:var(--surface-2);border:1px solid var(--line, var(--muted));border-radius:10px;padding:10px 14px;max-width:420px;margin:0 auto">` +
  `<div style="font-weight:700;margin-bottom:6px">${title}</div>` + rows.map(([n, name, a]) => `<div style="display:flex;gap:10px"><span style="width:22px">${n}.</span><span style="flex:1">${name}</span><span style="color:var(--brand);font-weight:700">${a}</span></div>`).join('') + '</div>';
// one search result, as Search Engine Lab shows it: rank, title, address, text, search terms marked
function mark(text, keys, title) {
  return String(text).split(/(\s+)/).map((w) => {
    const s = E.stem(w.toLowerCase().replace(/[^a-z0-9]/g, ''));
    return s && keys.includes(s) ? `<mark style="background:${title ? 'color-mix(in srgb, var(--brand) 25%, transparent)' : 'var(--warn-soft)'};color:inherit;font-weight:700;border-radius:3px;padding:0 2px">${esc(w)}</mark>` : esc(w);
  }).join('');
}
function resultCard(p, rank, keys, small) {
  return `<div style="border:1px solid var(--line);border-radius:10px;padding:${small ? '4px 8px' : '6px 10px'};display:grid;grid-template-columns:28px 1fr;gap:0 8px;margin:5px 0;background:var(--surface);text-align:left">` +
    `<div style="grid-row:1 / span 3;font:800 20px var(--font-mono, monospace);color:var(--brand);align-self:center;text-align:center">${rank}</div>` +
    `<div style="font-weight:700;font-size:${small ? 15 : 16}px">${mark(p.title, keys, true)}</div><div style="font:12px var(--font-mono, monospace);color:var(--good)">${esc(p.url)}</div>` +
    `<div style="font-size:${small ? 13 : 14}px;color:var(--ink-soft)">${mark(p.text, keys)}</div></div>`;
}
// the engine's own ranking for a search, top n, under a search box
function results(q, n, caption, opts = {}) {
  const s = E.search(q);
  const list = s.results.slice(0, n);
  return `<figure style="margin:0"><div style="display:flex;gap:8px;align-items:center;background:var(--surface-3);border-radius:10px;padding:5px 10px"><b style="color:var(--brand)">Seekit</b><span style="flex:1;background:var(--surface);border-radius:8px;padding:2px 8px;font-weight:600">${esc(q)}</span></div>` +
    (list.length ? list.map((r, i) => resultCard(r.page, opts.unranked ? '?' : i + 1, s.read.keys, opts.small)).join('') : `<p style="margin:8px 0;font-weight:700;color:var(--bad)">No results</p>`) +
    (caption ? `<figcaption style="font-size:15px;color:var(--muted);text-align:center">${caption}</figcaption>` : '') + '</figure>';
}
function pages(ids, keys, caption) {
  return `<figure style="margin:0">${ids.map((id) => resultCard(E.page(id), '?', keys, true)).join('')}<figcaption style="font-size:15px;color:var(--muted);text-align:center">${caption}</figcaption></figure>`;
}
// a search engine visits web pages and keeps a list of the words on them
const PAGEBOX = (x, y, title, lines) => `<g><rect x="${x}" y="${y}" width="150" height="74" rx="8" fill="var(--surface)" stroke="var(--ink-soft)" stroke-width="2"/><rect x="${x}" y="${y}" width="150" height="18" rx="8" fill="var(--surface-3)"/><text x="${x + 8}" y="${y + 36}" fill="var(--ink)" font-size="14" font-weight="700">${title}</text>${lines.map((l, i) => `<text x="${x + 8}" y="${y + 54 + i * 15}" fill="var(--ink-soft)" font-size="12">${l}</text>`).join('')}</g>`;
const listPic = `<figure style="margin:0;text-align:center"><svg viewBox="0 0 560 270" style="width:100%;max-width:560px;height:auto">` +
  PAGEBOX(10, 10, 'Tigers: Facts', ['Tigers live in Asia.']) + PAGEBOX(10, 98, 'Greenhill Library', ['Open 9 am to 5 pm.']) + PAGEBOX(10, 186, 'Easy Pizza Recipe', ['Bake for 15 minutes.']) +
  `<line x1="170" y1="135" x2="300" y2="135" stroke="var(--brand)" stroke-width="3"/><path d="M290 127 L304 135 L290 143 Z" fill="var(--brand)"/><text x="235" y="122" text-anchor="middle" fill="var(--brand)" font-size="14" font-weight="700">visits pages</text>` +
  `<line x1="168" y1="47" x2="300" y2="120" stroke="var(--brand)" stroke-width="2" stroke-dasharray="5 5"/><line x1="168" y1="223" x2="300" y2="150" stroke="var(--brand)" stroke-width="2" stroke-dasharray="5 5"/>` +
  `<rect x="310" y="20" width="240" height="230" rx="10" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/><text x="430" y="44" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="800">Its list</text>` +
  [['tiger', 'Tigers: Facts'], ['asia', 'Tigers: Facts'], ['library', 'Greenhill Library'], ['open', 'Greenhill Library'], ['pizza', 'Easy Pizza Recipe'], ['bake', 'Easy Pizza Recipe']].map(([w, p], i) =>
    `<text x="326" y="${74 + i * 28}" fill="var(--brand)" font-size="14" font-weight="700" font-family="var(--font-mono, monospace)">${w}</text><text x="400" y="${74 + i * 28}" fill="var(--ink)" font-size="14">${p}</text>`).join('') +
  `</svg><figcaption style="font-size:15px;color:var(--muted)">It visits web pages and keeps a list of their words</figcaption></figure>`;

// ---------------------------------------------------------------- step builders
const validators = {};
function checkStep(id, label, lead, parts, whyQ, extra = '') {
  const key = `${P}_${id}`.replace(/-/g, '_');
  const vid = `${P}-${id}`;
  validators[key] = parts.map((p, i) => ({ suffix: 'abcdefgh'[i], pattern: re(p.answer), feedback: p.feedback }));
  const inputs = parts.map((p, i) => {
    const s = 'abcdefgh'[i];
    return `<div class="lesson-do-now-response"><label for="${vid}-${s}">${p.label}</label>` +
      `<input id="${vid}-${s}" class="pseudocode-output-input lesson-exam-answer" data-answer-kind="short" data-answer-id="${id}-${s}" aria-label="${label} part ${s}" autocomplete="off"${p.text ? '' : ' inputmode="decimal"'}></div>`;
  }).join('');
  const card = `<div class="lesson-exam-card"><div class="lesson-do-now-responses">${inputs}</div>` +
    `<div class="lesson-do-now-actions"><button type="button" class="donow-btn" id="${vid}-check">Check answers</button><strong>Total: ${parts.length} marks</strong></div>` +
    `<div id="${vid}-feedback" class="pseudocode-feedback" role="status" aria-live="polite"></div></div>`;
  return { id, label, type: 'short-answer-validation', validatorId: vid, validatorKey: key,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + (extra ? columns(extra, card) : card) };
}
function mcStep(id, label, lead, items, whyQ, picture) {
  const cid = `${P}-${id}`;
  const body = picture ? `<div class="igame-two-col"><div>${picture}</div><div id="${cid}"></div></div>` : `<div id="${cid}"></div>`;
  return { id, label, type: 'multiple-choice', containerId: cid,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + body, items };
}
function embed(id, label, appId, lead, whyQ, embedQuery) {
  return Object.assign({ id, label, type: 'embedded-app', appId, embedContainerId: `${P}-${id}`,
    content: `<h2 class="lesson-h2">${label}</h2>` + why(whyQ[0], whyQ[1]) + (lead ? `<p class="lesson-lead">${lead}</p>` : '') + `<div id="${P}-${id}"></div>` }, embedQuery ? { embedQuery } : {});
}
function concept(id, label, tpsQ, tpsA, body) {
  return { id, label, content: `<h2 class="lesson-h2">${label}</h2>` + tps(tpsQ, tpsA, 'Show the answer') + body };
}
const steps = [];

// ---------------------------------------------------------------- Do Now 1: read a trace (6.3.3)
const DN1 = { server: '198.51.100.20', routers: '3' };
const dnTrace = traceBox('Trace route to www.music.example', [[1, 'Home router', '192.168.1.1'], [2, 'Router A', '81.2.3.1'], [3, 'Router E', '81.2.3.5'], [4, 'Web server', DN1.server]]);
steps.push(mcStep('do-now', 'Do Now: Read the Trace (1 of 2)', 'Recap of 6.3.3. Read the trace.', [
  { prompt: 'What is the address of the web server that keeps www.music.example?', options: ['81.2.3.5', '192.168.1.1', DN1.server], correct: 2,
    explain: 'The last hop is the web server: ' + DN1.server + '. The other hops are routers.' },
  { prompt: 'How many routers are on the way to the web server?', options: ['4', DN1.routers, '2'], correct: 1,
    explain: 'Home router, Router A, Router E: 3 routers. Hop 4 is the web server.' },
], ['Why does each hop in a trace show an address, and not only a name?', 'Data finds each device by its address, so the address shows exactly which device the data went through.'], dnTrace));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: reading a trace', steps: [
  { text: '<strong>A similar trace.</strong> 1. Home router 192.168.0.1, 2. Router K 62.1.1.1, 3. Web server 203.0.113.50.', visual: note('3 hops') },
  { text: 'Which hop keeps the website? Look at the <strong>last</strong> hop.', visual: line('3. Web server ' + kw('203.0.113.50')) },
  { text: 'Now count the routers. Skip the last hop: it is not a router.', visual: line(kw('Home router') + ', ' + kw('Router K')) },
  { text: 'Here that is 2 routers. Now read the Do Now trace in the same way: last hop first, then count the routers before it.', visual: note('last hop, then count the routers') },
] };

// ---------------------------------------------------------------- Do Now 2: addresses (6.3.3)
steps.push(checkStep('do-now-2', 'Do Now: Addresses (2 of 2)', 'Recap of 6.3.3. Type your answers.', [
  { label: 'Ben and Chi both have the address 10.0.0.4. Ana has 10.0.0.6. Type a new address for Chi. Keep 10.0.0. at the start.', text: true,
    answer: '^\\s*10\\.0\\.0\\.(?!4\\s*$)(?!6\\s*$)(25[0-4]|2[0-4]\\d|1\\d\\d|[1-9]\\d?)\\s*$', feedback: 'Keep 10.0.0. at the start. The last number must be 1 to 254, and not one that is taken already.' },
  { label: 'You open www.music.example. What kind of computer sends you its pages? Type two words.', text: true,
    answer: '^\\s*(a\\s+|the\\s+)?web\\s*-?\\s*servers?\\s*$', feedback: 'Think of the last hop of a trace. What keeps a website?' },
], ['Why does data need to carry an address at all?', 'So the switches and routers know which device it is for, and send it the right way.']));
steps[steps.length - 1].walkthrough = { title: 'Walk me through it: a free address', steps: [
  { text: '<strong>A similar question.</strong> Mai and Tom both have 172.16.0.8. Lee has 172.16.0.5. Give Tom a new address.', visual: note('taken: 172.16.0.8 and 172.16.0.5') },
  { text: 'Keep the start the same. Only the last number changes.', visual: line('172.16.0.' + kw('?')) },
  { text: 'List the last numbers that are taken already.', visual: line('taken: ' + kw('8') + ' and ' + kw('5')) },
  { text: 'Pick any other number from 1 to 254, like 20.', visual: line('172.16.0.' + kw('20')) },
  { text: '<strong>Where a website comes from.</strong> Think of Visit a Website in the 3D lab: which device did you walk to, to find the website\'s address with ipconfig?', visual: note('the computer that keeps the website') },
] };

steps.push(embed('do-now-ext', 'Extension: Do Now Challenge', 'drill-' + AFTER,
  '<strong>Extension:</strong> finished the Do Now? Try more questions from last lesson. Stuck? Turn on <strong>I need help</strong>.',
  ['Why practise last lesson before we learn something new?', 'Today builds on websites and web servers. If you remember them, today is easier.']));

// ---------------------------------------------------------------- title
steps.push({ id: 'title', label: 'Searching the Web',
  content: '<div class="lesson-title-slide"><p class="lesson-title-kicker">6.3 Computer Networks</p><h2 class="lesson-h2">Searching the Web</h2><p>Year 6</p></div>' +
    facts(['<strong>Today:</strong> how a search finds a few web pages out of millions.', 'Why some pages come first.', 'Then help customers who cannot find things, at the <strong>Network Help Desk</strong>.']) +
    why('There are millions of web pages. Predict: how could a computer find the few pages about tigers in less than a second?', 'It cannot read millions of pages each time you ask. It must get ready before you ask.') });

// ---------------------------------------------------------------- search engine (and search terms)
steps.push(concept('concept-engine', 'What Is a Search Engine?',
  'Predict: when you search for tiger, does the computer read every web page in the world, right then? Why, or why not?',
  '<p>No. That would take far too long. It has already visited the pages and kept a list of their words, so it only looks in its list.</p>',
  columns(facts(['A <strong>search engine</strong> is a website that finds web pages for you.', 'The words you type are your <strong>search terms</strong>.',
    'It visits web pages all the time and keeps a <strong>list</strong> of the pages and the words on them.', 'When you search, it looks in its list. It does not read every page again.',
    'It visits the pages again and again, to keep its list up to date.']), listPic)));

steps.push(mcStep('predict-engine', 'Predict: Where Does It Look?', '', [
  { prompt: 'You search for pizza. Where does the search engine look?', options: ['At every web page, one by one, right then', 'In its list of web pages and their words', 'Inside your own laptop'], correct: 1,
    explain: 'It looks in its list. It made the list before you asked, so the search is fast.' },
  { prompt: 'A new web page about pandas went online one minute ago. Why might a search not find it yet?', options: ['The search engine has not visited it, so it is not in the list', 'Web pages about pandas are not allowed', 'The internet is too full today'], correct: 0,
    explain: 'The search engine only finds pages in its list. It adds a new page when it visits it.' },
], ['Your school library has a computer that finds books. What would it need to know about each book?', 'The book\'s title, the words it is about, and where it is kept.']));

// ---------------------------------------------------------------- rank
const RANK_Q = 'zoo ticket';
steps.push(concept('concept-rank', 'Best Match First',
  'Predict: you search for zoo ticket. One page has both words. One has only one of them. Which should come first, and why?',
  '<p>The page with both words. It matches more of what you asked for.</p>',
  columns(facts(['The search engine finds every page in its list that has your search terms.', 'Then it puts them in order, best match first. This is called <strong>ranking</strong>. The page at the top is ranked 1st.',
    'Pages with <strong>more</strong> of your search terms come first.', 'If two pages have the same number, a search term in the <strong>title</strong> counts more than one in the text.']),
  results(RANK_Q, 3, 'Search terms marked: blue in a title, yellow in the text', { small: true }))));
{ // the concept picture shows rule 1 then rule 2
  const r = E.search(RANK_Q).results;
  assert(r[0].matched === 2 && r[1].matched === 1 && r[2].matched === 1 && r[1].score > r[2].score, 'rank picture shows both rules');
}

const PR_Q = 'football saturday', PR_IDS = ['training', 'swimlessons', 'football'];
steps.push(mcStep('predict-rank', 'Predict: Which Is Ranked 1st?', '', [
  { prompt: 'Which page will be ranked 1st?', options: ['Football Training for Children', 'Swimming Lessons for Children', 'Greenhill Football Club: Results'], correct: 2,
    explain: 'Greenhill Football Club: Results has both search terms: football and Saturday.' },
  { prompt: 'Why is Football Training for Children ranked above Swimming Lessons for Children?', options: ['It has more search terms', 'Its search term is in the title', 'It is a newer page'], correct: 1,
    explain: 'Each has one search term. Football is in the training page\'s title, and Saturday is only in the swimming page\'s text.' },
], ['Why does a search engine put the best match at the top, and not at the bottom?', 'Most people only read the first few results. The page they want should be where they look first.'], pages(PR_IDS, E.read(PR_Q).keys, 'Search: <b>' + PR_Q + '</b>. Not in rank order.')));
{
  const r = E.search(PR_Q).results.filter((x) => PR_IDS.includes(x.page.id)).map((x) => x.page.id);
  assert(r.join() === 'football,training,swimlessons', 'predict-rank order ' + r);
}

steps.push(embed('activity-1', 'Activity 1: Predict the Top Result', 'search-engine-lab',
  '<strong>About 5 minutes.</strong> Read the search terms and the three pages. Click the page you predict will be ranked 1st. Get 3 right in a row.',
  ['Why predict before you see the ranking?', 'You find out if you really know the rules, and do not only watch.'], 'part=1'));

// ---------------------------------------------------------------- clear search terms
steps.push(concept('concept-terms', 'Clear Search Terms',
  'Look at the two searches. Ana wants to fix her computer mouse. Predict: which search is better for her, and why?',
  '<p>fix mouse. The word mouse alone has two meanings, an animal and a computer mouse, so the animal page comes first.</p>',
  columns(facts(['<strong>Clear search terms</strong> are a few key words that the page you want has.', 'Leave out small words like how, the, is and I. Almost every page has them, so they do not help.',
    'Spell them right. No page has the word libary.', 'A word with two meanings needs one more word: mouse, or fix mouse?']),
  results('mouse', 2, '', { small: true }) + results('fix mouse', 1, '', { small: true }))));
assert(E.rankOf('mouse', 'housemouse') === 1 && E.rankOf('fix mouse', 'fixmouse') === 1 && E.read('libary').unknown.length === 1, 'terms picture');

steps.push(mcStep('predict-terms', 'Predict: Which Search?', '', [
  { prompt: 'Mai wants to know when Greenhill Zoo opens. Which search terms are clearest?', options: ['when does it open please', 'zoo opening times', 'open'], correct: 1,
    explain: 'zoo opening times: three key words that the zoo page has. The others have small words, or one word many pages have.' },
  { prompt: 'Tom searched for vulcano facts. Why does the volcano page not come first?', options: ['A word is spelt wrong', 'It has too many words', 'Facts has two meanings'], correct: 0,
    explain: 'No page has the word vulcano. Spelt right, volcano facts finds it.' },
  { prompt: 'Chi searched for mouse. She wants to buy a computer mouse. What should she do?', options: ['Add the word please', 'Add a word like buy or computer', 'Nothing: mouse is clear'], correct: 1,
    explain: 'mouse has two meanings. buy mouse or computer mouse picks the right one.' },
], ['A friend types a whole long sentence into a search engine. Why might it still work some of the time?', 'The search engine leaves out the small words. The key words that are left may be enough.']));
assert(E.rankOf('zoo opening times', 'zoo') === 1 && E.rankOf('volcano facts', 'volcano') === 1 && E.rankOf('vulcano facts', 'volcano') !== 1 && E.rankOf('buy mouse', 'buymouse') === 1, 'predict-terms answers');

steps.push(embed('activity-2', 'Activity 2: Find It, Then Fix the Search', 'search-engine-lab',
  '<strong>About 6 minutes.</strong> Find It: type clear search terms, open the page that answers the question, then type the answer. Then Fix the Search: say what is wrong with a search, and type a better one. 3 in a row for each.',
  ['Why is a wrong page a mistake, even if you find the right one later?', 'Reading the titles first saves time. A good searcher picks the right page the first time.'], 'part=2'));

// ---------------------------------------------------------------- check
const CQ = 'greenhill zoo ticket';
{
  const r = E.search(CQ).results;
  assert(r[0].page.id === 'zoo' && r[1].page.id === 'pool' && r[2].page.id === 'bus', 'check ranking ' + r.slice(0, 3).map((x) => x.page.id));
  assert(r[0].matched > r[1].matched && r[1].matched === r[2].matched && r[1].score > r[2].score, 'check ranks decided by the rules');
}
const CHK_TERMS = '^(?!.*\\b(a|an|the|how|do|does|when|what|is|are|i|it|please|to|at|for|of|in|on|time\\s+does)\\b)(?=.*\\bzoo\\b)(?=.*\\b(open|opens|opening|times?|hours?|closes?|closing)\\b)\\s*[a-z]+(\\s+[a-z]+){0,3}\\s*$';
// ---------------------------------------------------------------- Try it on the real web (James 2026-11-20: simple, hands-on)
steps.push({ id: 'real-search', label: 'Try It: Search the Real Web',
  content: '<h2 class="lesson-h2">Try It: Search the Real Web</h2>' +
    why('Why write down the number of results for each search?', 'So you can compare your searches and see what changed.') +
    '<p class="lesson-lead"><strong>About 6 minutes.</strong> Open a new tab and use the school search engine. Write the answers in your notes (the pen icon at the top).</p>' +
    '<ol class="lesson-facts" style="font-size:21px;line-height:1.55">' + "<li><strong>Search:</strong> tigers. Under the search box it says <em>About ... results</em>. Write the number in your notes.</li>" + "<li><strong>Search:</strong> tigers facts for kids. Write the number of results. Is it bigger or smaller?</li>" + "<li><strong>Search:</strong> tigrs (spelt wrong). What does the search engine do? Write it down.</li>" + "<li><strong>Your turn:</strong> search for something you like. Write your search terms and the number of results.</li>" + '</ol>' });
steps.push({ id: 'real-picture', label: 'Try It: Find a Picture for Your Notes',
  content: '<h2 class="lesson-h2">Try It: Find a Picture for Your Notes</h2>' +
    why('Why add the search terms you used under your picture?', 'So you, or a friend, can find the same picture again.') +
    '<p class="lesson-lead"><strong>About 5 minutes.</strong> Find a picture of an animal and put it in your notes.</p>' +
    '<ol class="lesson-facts" style="font-size:21px;line-height:1.55">' + "<li>Search for an animal, for example <strong>red panda</strong>. Click <strong>Images</strong>.</li>" + "<li>Right-click a picture and choose <strong>Copy image</strong>.</li>" + "<li>Open your notes (the pen icon at the top). Press <strong>Ctrl + V</strong> to paste the picture.</li>" + "<li>Under the picture, type the search terms you used.</li>" + '</ol>' });

// ---------------------------------------------------------------- Network Help Desk (party server on the class network)
steps.push({ id: 'help-desk', label: 'Network Help Desk: Search Calls',
  content: '<h2 class="lesson-h2">Network Help Desk: Search Calls</h2>' +
    why('Why tell the customer better search terms, and not only the answer?', 'Next time they can find it on their own.') +
    '<p class="lesson-lead"><strong>About 12 minutes.</strong> Customers phone you. They cannot find something on the web. Use today\'s lesson to help them.</p>' +
    '<ol class="lesson-facts" style="font-size:20px;line-height:1.5">' +
    '<li><strong>Open a new tab.</strong> Type the class game address your teacher shows on the board. Type your name.</li>' +
    '<li><strong>Take the two training calls first.</strong> Do what the arrow shows.</li>' +
    '<li><strong>Read the customer\'s search.</strong> What is wrong with it: too few words, a spelling mistake, or a word with two meanings?</li>' +
    '<li><strong>Search on the desk computer</strong> with clear search terms. Open the page that answers the customer.</li>' +
    '<li><strong>Tell the customer</strong> the answer and the better search terms, then explain why their search did not work.</li>' +
    '<li>Calling the Tech Lead for help costs points. Try first, then ask.</li></ol>' });

steps.push(embed('plenary', 'Plenary: Searching the Web Drill', 'drill-' + ID,
  '<strong>About 4 minutes.</strong> Search engines, ranking and clear search terms. Your progress is saved.',
  ['Why does the drill bring back a question you got wrong?', 'Getting it right again later shows you remember it, not that you guessed once.']));

// ---------------------------------------------------------------- plenary drill
const card = (id, category, prompt, answers, distractors, noteText, working) => ({ id, category, prompt, answers, distractors, working, note: noteText });
const cards = [
  card('e-what', 'engine', 'What is a search engine?', ['A website that finds web pages for you'], ['A router that joins two networks', 'A cable that carries web pages', 'A program that prints web pages'], 'A search engine finds web pages for you, from its list.', ['Think of Seekit in the lab.', 'What did it do when you typed words?']),
  card('e-list', 'engine', 'When you search, where does the search engine look?', ['In its list of web pages and their words'], ['At every web page, one by one, right then', 'Inside your laptop', 'In the router'], 'It looks in its list. It made the list before you asked.', ['Think of the picture of pages and the list.', 'Does it read every page each time?']),
  card('e-visit', 'engine', 'How does a search engine make its list?', ['It visits web pages and keeps their words'], ['People post it every page on paper', 'It asks every laptop for its files', 'It guesses the words on each page'], 'It visits web pages all the time and keeps a list of the pages and their words.', ['What does it do all the time?', 'What does it keep from each page?']),
  card('e-new', 'engine', 'A web page went online one minute ago. Why might a search not find it yet?', ['It is not in the search engine\'s list yet'], ['New pages are not allowed', 'The internet is too full', 'Its words are too long'], 'The search engine adds a page to its list when it visits it.', ['Where does the search engine look?', 'Has it visited the new page yet?']),
  card('e-update', 'engine', 'Why does a search engine visit the same pages again and again?', ['To keep its list up to date when pages change'], ['To make the pages load slower', 'To count how many people read them', 'To delete old web pages'], 'Pages change, and new ones appear, so it visits again to keep its list up to date.', ['Do web pages ever change?', 'What would happen to an old list?']),
  card('e-terms', 'engine', 'What are search terms?', ['The words you type into a search engine'], ['The pages at the top of the results', 'The addresses of web servers', 'The rules of a search engine'], 'Search terms are the words you type.', ['What do you type into the search box?', 'Those words have a name.']),
  card('r-what', 'rank', 'What does a search engine do when it ranks the results?', ['Puts them in order, best match first'], ['Deletes the pages it does not like', 'Puts them in order, newest page first', 'Sorts them by the length of the title'], 'Ranking puts the results in order, best match first.', ['Think of Predict the Top Result.', 'Which page comes at the top?']),
  card('r-more', 'rank', 'Search: zoo bus. Page A has zoo and bus. Page B has only zoo. Which is ranked higher?', ['Page A'], ['Page B', 'They are the same'], 'Pages with more of the search terms come first.', ['Count the search terms on each page.', 'Which has more?']),
  card('r-title', 'rank', 'Two pages each have the search term tiger once. Which is ranked higher?', ['The one with tiger in its title'], ['The one with tiger in its text', 'The one with the longest text', 'The one with the shortest title'], 'Same number of search terms: a term in the title counts more than one in the text.', ['Both have the same number of terms.', 'Where is the word on each page?']),
  card('r-first', 'rank', 'A page is at the top of the results. What rank is it?', ['1st'], ['Last', '10th', '0'], 'The page at the top is ranked 1st, the best match.', ['Count from the top.', 'The best match is at the top.']),
  card('r-count', 'rank', 'Search: greenhill zoo ticket. Greenhill Zoo: Tickets and Opening Times has all three words. Greenhill Bus Times has two. Which is ranked 1st?', ['Greenhill Zoo: Tickets and Opening Times'], ['Greenhill Bus Times'], 'The zoo page has more of the search terms, so it is ranked 1st.', ['Count the search terms on each page.', 'More terms means a better match.']),
  card('r-none', 'rank', 'A page has none of your search terms. Where is it in the results?', ['It is not in the results'], ['It is ranked 1st', 'It is ranked last', 'It is in the middle'], 'Only pages with at least one search term are in the results.', ['Does the page match anything you typed?', 'Think of the pages that did not appear in the lab.']),
  card('t-best', 'terms', 'Which search terms are clearest for: When does Greenhill Library close?', ['library opening times'], ['when does it close please', 'close', 'how do I find out about the library'], 'A few key words the page has, no small words.', ['Leave out the small words.', 'Which words would the library page have?']),
  card('t-small', 'terms', 'Why leave out small words like how, the and is?', ['Almost every page has them, so they do not help'], ['They are spelt wrong', 'Search engines cannot read them', 'They make the page slower'], 'Small words are on almost every page, so they do not pick out the page you want.', ['Are these words on many pages or few?', 'Do they help pick one page?']),
  card('t-spell', 'terms', 'Sam searched for tigre and got no results. What is wrong?', ['A word is spelt wrong'], ['Too few words', 'A word has two meanings', 'The internet is down'], 'No page has the word tigre. Spelt right, tiger finds a page.', ['Look at each word.', 'Is every word spelt right?']),
  card('t-meaning', 'terms', 'Ana searched for mouse. She wants to fix her computer mouse. What should she do?', ['Add a word, like fix mouse'], ['Search for mouse again', 'Add the word please', 'Use a bigger screen'], 'mouse has two meanings. One more word picks the right one.', ['What else can mouse mean?', 'Which word would only the page she wants have?']),
  card('t-vague', 'terms', 'Mrs Lee searched for times. She wants the dentist\'s opening times. What is wrong?', ['Too few words: many pages have it'], ['A word is spelt wrong', 'Too many small words', 'The word times has no meaning'], 'Many pages have times. dentist opening times picks the right one.', ['How many pages have the word times?', 'Which word would only her page have?']),
  card('t-fix', 'terms', 'Which search finds the page Football Training for Children first?', ['football training children'], ['football', 'how do I play please', 'footbal training'], 'Key words from the page, spelt right, no small words.', ['Which words are in its title?', 'Check the spelling.']),
];
assert(E.rankOf('library opening times', 'library') === 1 && E.rankOf('football training children', 'training') === 1 && E.rankOf('football', 'training') !== 1, 'drill terms cards');
const drill = { title: 'Year 6, 6.3.4: Searching the Web', subtitle: 'Search engines, ranking and clear search terms', choiceOnly: true,
  // Haiku second check on typed answers and a Next question button after each card (James 2026-11-20).
  aiFallback: true, waitForNext: true,
  categories: [['engine', 'Search Engines'], ['rank', 'Ranking'], ['terms', 'Clear Search Terms']], cards };
cards.forEach((c) => {
  assert(c.answers.length && c.distractors.length >= 1 && c.working.length === 2, `card ${c.id} shape`);
  c.answers.forEach((a) => assert(!c.distractors.some((d) => d.toLowerCase() === a.toLowerCase()), `card ${c.id}: answer is a distractor`));
});
const drillSrc = `// Year 6, 6.3.4: Searching the Web. Plenary: search engines, ranking and clear search terms.\n// Loaded by Drills/index.html?drill=${ID}\n// Generated by tools/build_y6_3_4_isearch.mjs: edit that, then run it.\n` +
  `DrillData.register(${JSON.stringify(ID)}, ${JSON.stringify(drill, null, 1)});\n`;

// ---------------------------------------------------------------- self-checks
const V = (k) => validators[`${P}_${k}`.replace(/-/g, '_')];
const T = (k, i, s) => new RegExp(V(k)[i].pattern.source, 'i').test(s);
const ok = (k, i, yes, no) => { yes.forEach((s) => assert(T(k, i, s), `${k}[${i}] rejects "${s}"`)); no.forEach((s) => assert(!T(k, i, s), `${k}[${i}] accepts "${s}"`)); };
ok('do-now-2', 0, ['10.0.0.9', ' 10.0.0.200 ', '10.0.0.1', '10.0.0.44'], ['10.0.0.4', '10.0.0.6', '10.0.0.0', '10.0.0.255', '10.0.0.300', '10.0.1.9', '192.168.1.9', '10.0.0']);
ok('do-now-2', 1, ['web server', 'a web server', 'Web Server', 'webserver', 'web servers'], ['server', 'router', 'website', 'web']);
// removed with the check slide: ok('check-search', 0, ['3', ' 3 '], ['2', '1', '13']);
// removed with the check slide: ok('check-search', 1, ['zoo opening times', 'Greenhill zoo opening times', 'zoo open', 'greenhill zoo times', 'zoo hours'],
// removed with the check slide:   ['when does the zoo open', 'zoo', 'opening times', 'greenhill zoo opening times today please', 'zoo ticket', 'library opening times']);
// the typed search answers really work in the engine
['zoo opening times', 'Greenhill zoo opening times', 'zoo open', 'greenhill zoo times'].forEach((q) => assert(E.rankOf(q, 'zoo') === 1, 'check answer ranks the zoo 1st: ' + q));
// the Do Now walkthroughs never highlight the Do Now's own answers or use its names
steps.filter((s) => s.walkthrough).forEach((s) => {
  const hl = JSON.stringify(s.walkthrough).match(/wt-hl\\?">([^<]*)</g) || [];
  hl.forEach((h) => assert(![DN1.server, '>3<', 'web server'].some((n) => h.toLowerCase().includes(n.toLowerCase())), 'walkthrough highlights a Do Now answer: ' + h));
  assert(!/\b(Ben|Chi|Ana)\b|music\.example|10\.0\.0/.test(JSON.stringify(s.walkthrough.steps)), 'walkthrough uses the Do Now names');
  assert(!/web server/i.test(JSON.stringify(s.walkthrough.steps.slice(-1))), 'walkthrough gives the web server answer');
});
const all = JSON.stringify(steps) + JSON.stringify(drill);
assert(!/[–—]|&mdash;|&ndash;/.test(all), 'dash found');
assert(!/mario|google|\bURL\b|\bLAN\b|\bDNS\b|algorithm|crawler|spider|keyword/i.test(all), 'a term this lesson does not teach');
// each new term is taught on its own slide: nothing before that slide may use it (pictures included)
[['concept-engine', /search engine|search terms?/i], ['concept-rank', /\brank/i], ['concept-terms', /clear search|small words|two meanings/i]].forEach(([at, rx]) => {
  const k = steps.findIndex((s) => s.id === at);
  assert(k > 0, 'slide ' + at);
  const before = JSON.stringify(steps.slice(0, k));
  const m = rx.exec(before);
  assert(!m, rx + ' used before ' + at + ': ' + (m ? before.slice(Math.max(0, m.index - 80), m.index + 20) : ''));
});

const lesson = { id: ID, label: '6.3.4: Searching the Web', steps, validators, pseudocodeValidators: {} };
fs.writeFileSync(path.join(ROOT, 'LessonData', ID + '.json'), JSON.stringify(lesson, null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'Drills', 'data', ID + '.js'), drillSrc);

// ---------------------------------------------------------------- register: after 6.3.3 in the 6.3 unit
{
  const lp = path.join(ROOT, 'LessonData', 'lessons.json');
  const raw = fs.readFileSync(lp, 'utf8');
  if (!raw.includes(`"${ID}"`)) {
    const data = JSON.parse(raw);
    const y6 = data.years.find((y) => y.id === 'year6');
    const u = y6 && y6.units.find((x) => x.lessons.includes(AFTER));
    assert(u, '6.3 unit with ' + AFTER);
    u.lessons.splice(u.lessons.indexOf(AFTER) + 1, 0, ID);
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(lp, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
  }
}
console.log(`${ID}: ${steps.length} steps, ${Object.keys(validators).length} validator sets, drill ${cards.length} cards`);
