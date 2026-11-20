// Checks Search Engine Lab (SearchEngine/): every Predict round is decided by the ranking rules (never by list order),
// every Fix the Search starts broken and can be fixed with at most 4 key words, every Find It page can be found in
// the top 3 with a short clear search, and every answer pattern accepts its own model answer.
//   node tools/test_search_engine.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const E = require(path.join(ROOT, 'SearchEngine', 'engine.js'));
const html = fs.readFileSync(path.join(ROOT, 'SearchEngine', 'index.html'), 'utf8');
const grab = (name) => (0, eval)('(' + html.match(new RegExp('var ' + name + ' = (\\[[\\s\\S]*?\\n  \\]);'))[1] + ')');
const PREDICT = grab('PREDICT'), FIND = grab('FIND'), FIX = grab('FIX');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };

// Predict: the winner beats the runner-up on matched terms or on title score, not on list order
PREDICT.forEach((r) => {
  const res = E.search(r.q).results.filter((x) => r.ids.includes(x.page.id));
  ok(res.length >= 2, `predict "${r.q}" has at least 2 matching pages`);
  const [a, b] = res;
  ok(a.matched > b.matched || a.score > b.score, `predict "${r.q}": ${a.page.id} beats ${b.page.id} only by list order`);
  ok(E.read(r.q).unknown.length === 0 && E.read(r.q).small.length === 0, `predict "${r.q}" uses clear words`);
});
// Fix: the bad search does not rank the target 1st; a short good search exists (try pairs of words from the title)
FIX.forEach((r) => {
  ok(E.rankOf(r.bad, r.id) !== 1, `fix "${r.bad}" already ranks ${r.id} 1st`);
  const rd = E.read(r.bad);
  if (r.fault === 'spelling') ok(rd.unknown.length > 0, `fix "${r.bad}" has a misspelt word`);
  else ok(rd.unknown.length === 0, `fix "${r.bad}" has no misspelt word`);
  const tw = E.words(E.page(r.id).title).filter((w) => !E.SMALL.includes(w));
  let good = '';
  for (let i = 0; i < tw.length && !good; i++) for (let j = i + 1; j < tw.length && !good; j++) if (E.rankOf(tw[i] + ' ' + tw[j], r.id) === 1) good = tw[i] + ' ' + tw[j];
  ok(good, `fix "${r.bad}": no two title words rank ${r.id} 1st`);
});
// Find: two title words put the page in the top 3; answers accept the model answer
FIND.forEach((r) => {
  const tw = E.words(E.page(r.id).title).filter((w) => !E.SMALL.includes(w));
  let found = false;
  for (let i = 0; i < tw.length; i++) for (let j = i + 1; j < tw.length; j++) { const k = E.rankOf(tw[i] + ' ' + tw[j], r.id); if (k >= 1 && k <= 3) found = true; }
  ok(found, `find ${r.id} reachable`);
  ok(r.ans.test(r.say.toLowerCase()), `find ${r.id} accepts "${r.say}"`);
  ok(E.page(r.id).text.toLowerCase().includes(r.say.toLowerCase().replace(/^every /, '').split(' ')[0]), `find ${r.id}: answer is on the page`);
});
// spot checks of the rules taught on the slides
ok(E.rankOf('tiger facts', 'tiger') === 1, 'tiger facts');
ok(E.read('how do I find tigers').keys.join() === 'tiger', 'small words left out');
ok(E.read('libary').unknown.length === 1, 'misspelt word flagged');
ok(E.rankOf('fix mouse', 'fixmouse') === 1 && E.rankOf('house mouse', 'housemouse') === 1, 'mouse meanings');
console.log(fails ? fails + ' failure(s)' : `search engine: all checks pass (${PREDICT.length} predict, ${FIND.length} find, ${FIX.length} fix)`);
process.exit(fails ? 1 : 0);
