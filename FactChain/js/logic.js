// Fact Chain pure logic (no page): answer matching, gap fading, recall marking, pack checks and progress numbers.
// Tested by tools/test_fact_chain.mjs. Packs: FactChain/PACK-FORMAT.md.
// Matching is by whole words, case-insensitive, punctuation ignored. A word of 5 or more letters may have one typo
// (one letter added, missing, changed or two swapped); a plural s or es is ignored. Short words (MAR, MDR, PC) must be exact.
(function (root) {
  'use strict';

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[‘’]/g, "'").replace(/&/g, ' and ')
      .replace(/(\d),(?=\d{3}\b)/g, '$1')
      .replace(/[^a-z0-9.' ]+/g, ' ').replace(/\.(?!\d)/g, ' ').replace(/'/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  function words(s) { var n = norm(s); return n ? n.split(' ') : []; }
  // A word and its singular forms (buses: bus, buse; registers: register).
  function forms(w) {
    var f = [w];
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) f.push(w.slice(0, -1));
    if (w.length > 4 && /es$/.test(w)) f.push(w.slice(0, -2));
    return f;
  }
  // Words one letter apart that mean different things: never a typo of each other.
  var NO_FUZZ = /^(million|billion|trillion|thousand|millions|billions)$/;
  // At most one edit (Damerau: insert, delete, change, swap two next to each other).
  function oneEdit(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0;
    while (i < la && i < lb && a[i] === b[i]) i++;
    if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }
  function wordMatch(typed, want) {
    if (typed === want) return true;
    var fa = forms(typed), fb = forms(want);
    if (fa.some(function (x) { return fb.indexOf(x) >= 0; })) return true;
    if (/\d/.test(want) || /\d/.test(typed) || NO_FUZZ.test(want) || NO_FUZZ.test(typed)) return false;
    return want.length >= 5 && typed.length >= 4 && fa.some(function (x) { return fb.some(function (y) { return oneEdit(x, y); }); });
  }
  // Does the text contain the phrase as whole words, in order, next to each other?
  function hasPhrase(text, phrase) {
    var t = Array.isArray(text) ? text : words(text), p = words(phrase);
    if (!p.length) return false;
    for (var i = 0; i + p.length <= t.length; i++) {
      var k = 0;
      while (k < p.length && wordMatch(t[i + k], p[k])) k++;
      if (k === p.length) return true;
    }
    return false;
  }
  function hasAny(text, list) {
    var t = words(text);
    return (list || []).some(function (a) { return hasPhrase(t, a); });
  }

  // Everything accepted for one gap of a chain line: the gap text and its accept list.
  function gapAccepts(line, gap) {
    var extra = line && line.accept && line.accept[gap];
    return [gap].concat(Array.isArray(extra) ? extra : extra ? [extra] : []);
  }
  // One gap box: right when it holds an accepted answer and not much more (at most 3 extra words).
  function gapRight(line, gap, typed) {
    var t = words(typed);
    if (!t.length) return false;
    return gapAccepts(line, gap).some(function (a) { return hasPhrase(t, a) && t.length <= words(a).length + 3; });
  }
  // A written line holds the whole fact when every gap (or one of its accepts) is in it.
  function lineFound(line, written) {
    var t = words(written);
    if (!t.length || !line || !line.gaps || !line.gaps.length) return false;
    return line.gaps.every(function (g) { return gapAccepts(line, g).some(function (a) { return hasPhrase(t, a); }); });
  }

  // Fading: round 0 blanks the first gap of each line, round 1 the first two, round 2 the whole line.
  // Answers [{ type: 'text', text } | { type: 'gap', gap, n }] for drawing, or null for the whole line (round 2).
  function blanks(line, round) {
    if (round >= 2) return null;
    var gaps = (line.gaps || []).slice(0, round + 1), text = String(line.text), spans = [];
    gaps.forEach(function (g) {
      var at = text.toLowerCase().indexOf(String(g).toLowerCase());
      if (at < 0) return;
      if (spans.some(function (s) { return at < s.end && at + g.length > s.start; })) return;
      spans.push({ start: at, end: at + g.length, gap: g });
    });
    spans.sort(function (a, b) { return a.start - b.start; });
    var out = [], pos = 0;
    spans.forEach(function (s, i) {
      if (s.start > pos) out.push({ type: 'text', text: text.slice(pos, s.start) });
      out.push({ type: 'gap', gap: s.gap, n: i });
      pos = s.end;
    });
    if (pos < text.length) out.push({ type: 'text', text: text.slice(pos) });
    return out;
  }

  // From memory: each chain line is found when one written line holds it. Answers { found: [bool], unmatched: [text] }
  // (unmatched: written lines that found nothing, for the Haiku second check).
  function recall(chain, text) {
    var lines = String(text || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    // A student may write several facts on one line joined by full stops: each sentence counts as a line too.
    var parts = [];
    lines.forEach(function (l) { parts.push(l); l.split(/(?<=[.;])\s+/).forEach(function (s) { if (s && s !== l) parts.push(s); }); });
    var used = {};
    var found = chain.map(function (c) {
      for (var i = 0; i < parts.length; i++) if (lineFound(c, parts[i])) { used[parts[i]] = 1; return true; }
      return false;
    });
    var unmatched = lines.filter(function (l) { return !used[l] && !l.split(/(?<=[.;])\s+/).some(function (s) { return used[s]; }); });
    return { found: found, unmatched: unmatched };
  }

  function shuffle(list, rnd) {
    var a = list.slice(), r = rnd || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // A shuffle that is never the right order (when there are 2 or more).
  function shuffleOrder(n, rnd) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    if (n < 2) return idx;
    var s;
    do { s = shuffle(idx, rnd); } while (s.every(function (v, k) { return v === k; }));
    return s;
  }

  // The rounds of a pack, in order. Spot and quick only when the pack has them.
  function rounds(pack) {
    var r = ['see', 'gap0', 'gap1', 'gap2', 'order', 'recall'];
    if (pack.spot && pack.spot.length) r.push('spot');
    if (pack.quick && pack.quick.length) r.push('quick');
    return r;
  }

  // A pack file is usable when it has an id and a chain whose lines each have text and at least one gap found in it.
  function packProblems(pack) {
    var p = [];
    if (!pack || typeof pack !== 'object') return ['not a pack'];
    if (!pack.id) p.push('no id');
    if (!Array.isArray(pack.chain) || pack.chain.length < 2) p.push('no chain');
    else pack.chain.forEach(function (c, i) {
      if (!c || !c.text || !Array.isArray(c.gaps) || !c.gaps.length) p.push('line ' + (i + 1) + ' has no gaps');
      else c.gaps.forEach(function (g) { if (String(c.text).toLowerCase().indexOf(String(g).toLowerCase()) < 0) p.push('line ' + (i + 1) + ' gap "' + g + '" not in text'); });
    });
    (pack.quick || []).forEach(function (q, i) { if (!q || !q.id || !q.q || !Array.isArray(q.accept) || !q.accept.length) p.push('quick ' + (i + 1) + ' incomplete'); });
    (pack.spot || []).forEach(function (s, i) { if (!s || !s.wrong || !Array.isArray(s.fix) || !s.fix.length) p.push('spot ' + (i + 1) + ' incomplete'); });
    return p;
  }

  // The facts a pack holds: its chain lines plus its quick-fire questions.
  function factsIn(pack) { return pack.chain.length + (pack.quick ? pack.quick.length : 0); }

  // Saved progress for one student and group (the server reads packs[id].mastered, .facts, .step and answers):
  //   { v, answers, booted, packs: { id: { step, mastered, facts, chainDone, quick, best, runs } } }
  function create() { return { v: 1, answers: 0, booted: false, packs: {} }; }
  function repair(state) {
    var s = state && typeof state === 'object' && state.packs && typeof state.packs === 'object' ? state : create();
    s.answers = Math.max(0, Math.floor(Number(s.answers) || 0));
    Object.keys(s.packs).forEach(function (id) {
      var p = s.packs[id];
      if (!p || typeof p !== 'object') { delete s.packs[id]; return; }
      p.step = Math.max(0, Math.floor(Number(p.step) || 0));
      p.facts = Math.max(0, Math.floor(Number(p.facts) || 0));
      p.mastered = !!p.mastered;
    });
    return s;
  }
  function packRec(state, id) {
    return state.packs[id] || (state.packs[id] = { step: 0, mastered: false, facts: 0, chainDone: false, quick: null, best: null, runs: 0 });
  }
  // How far on a copy is: facts, then rounds done, then answers (the further copy wins between computers).
  function progress(state) {
    var f = 0, st = 0;
    Object.keys(state.packs || {}).forEach(function (id) { f += state.packs[id].facts || 0; st += state.packs[id].step || 0; });
    return f * 1e8 + st * 1e5 + (state.answers || 0);
  }

  var api = { norm: norm, words: words, oneEdit: oneEdit, wordMatch: wordMatch, hasPhrase: hasPhrase, hasAny: hasAny,
    gapAccepts: gapAccepts, gapRight: gapRight, lineFound: lineFound, blanks: blanks, recall: recall, shuffle: shuffle,
    shuffleOrder: shuffleOrder, rounds: rounds, packProblems: packProblems, factsIn: factsIn, create: create, repair: repair,
    packRec: packRec, progress: progress };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FactChainLogic = api;
})(this);
