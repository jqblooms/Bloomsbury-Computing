// Fact rounds for Data Bridge (James 2026-11-26): one short Fact Chain activity per Data Bridge round, in place of
// the exam round. Pure logic (no page), so the site's Data Bridge, the multiplayer one and the 3D one can share it.
// Matching is FactChain/js/logic.js (never copied here). Tested by tools/test_fact_chain.mjs.
//
// Stages cycle as the rounds go up: Fill the gaps A (1 gap), B (2 gaps), C (the whole line), Put it in order,
// Spot the mistake, Quick-fire, From memory. A stage the pack has no content for is skipped.
// A round is a few items, one per screen. Each item is worth `w` units (From memory: one unit per fact found).
// Coins: the first pass pays rate = pool / units for each unit right. A pass with any mistake must be done again
// (a mistake never completes a round); the first clean pass after that pays half rate for the units missed the
// first time. Play redoes the same items in a new order; Learn swaps each missed item for a new one of the same kind.
(function (root) {
  'use strict';
  var L = root.FactChainLogic || (typeof require === 'function' ? require('./logic.js') : null);

  var STAGES = ['gap0', 'gap1', 'gap2', 'order', 'spot', 'quick', 'recall'];
  var NAMES = { gap0: 'Fill the gaps', gap1: 'Fill the gaps', gap2: 'Write the fact', order: 'Put it in order',
    spot: 'Spot the mistake', quick: 'Quick-fire', recall: 'From memory' };
  var HOW = {
    gap0: 'Type the missing word in each fact.',
    gap1: 'Type the missing words in each fact.',
    gap2: 'Write the next fact in the chain.',
    order: 'Put the facts in the right order.',
    spot: 'One word or phrase is wrong. Type the right word.',
    quick: 'Answer each question.',
    recall: 'Write facts from memory, one per line.'
  };

  function rand(rnd) { return (rnd || Math.random)(); }
  function pickInt(n, rnd) { return Math.floor(rand(rnd) * n); }

  // The stages this pack has content for, in cycle order.
  function stagesFor(pack) {
    var n = pack && pack.chain ? pack.chain.length : 0;
    return STAGES.filter(function (s) {
      if (s === 'order') return L.sequences(pack).length > 0;
      if (s === 'spot') return !!(pack.spot && pack.spot.length);
      if (s === 'quick') return !!(pack.quick && pack.quick.length);
      return n >= 1;
    });
  }
  // Round n (1, 2, ...) of the game: its stage.
  function stageFor(pack, n) {
    var list = stagesFor(pack);
    return list[(Math.max(1, n) - 1) % list.length];
  }

  // A run of `size` chain lines next to each other, starting at a random line.
  function windowAt(len, size, rnd) {
    size = Math.min(size, len);
    var start = pickInt(len - size + 1, rnd), out = [];
    for (var i = 0; i < size; i++) out.push(start + i);
    return out;
  }
  function sample(n, k, rnd) { return L.shuffle(range(n), rnd).slice(0, Math.min(k, n)); }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  // The items of one round: { stage, pack, items: [item] }.
  //   gap:    { kind: 'gap', k: 0 | 1 | 2, line, w: 1 }
  //   order:  { kind: 'order', lines: [chain index], start: [positions shuffled], w: 1 }
  //   spot:   { kind: 'spot', i, w: 1 }      quick: { kind: 'quick', i, w: 1 }
  //   recall: { kind: 'recall', need, w: need }   (any `need` chain lines, written from memory)
  function build(pack, stage, rnd) {
    var n = pack.chain.length, items = [];
    if (/^gap/.test(stage)) {
      var k = Number(stage.slice(3));
      windowAt(n, k === 2 ? 3 : 4, rnd).forEach(function (i) { items.push({ kind: 'gap', k: k, line: i, w: 1 }); });
    } else if (stage === 'order') {
      // Only a real sequence (pack.sequences), a run of up to 4 of its steps; one item per sequence.
      L.sequences(pack).forEach(function (seq) {
        var lines = windowAt(seq.length, 4, rnd).map(function (j) { return seq[j]; });
        items.push({ kind: 'order', lines: lines, start: L.shuffleOrder(lines.length, rnd), w: 1 });
      });
    } else if (stage === 'spot') {
      sample(pack.spot.length, 4, rnd).forEach(function (i) { items.push({ kind: 'spot', i: i, w: 1 }); });
    } else if (stage === 'quick') {
      sample(pack.quick.length, 4, rnd).forEach(function (i) { items.push({ kind: 'quick', i: i, w: 1 }); });
    } else if (stage === 'recall') {
      var need = Math.min(3, n);
      items.push({ kind: 'recall', need: need, w: need });
    }
    return { stage: stage, pack: pack.id, items: items };
  }
  function units(items) { return items.reduce(function (a, it) { return a + (it.w || 1); }, 0); }

  // Learn mode: a new item of the same kind in place of a missed one (one not already in the round), or the same item
  // when the pack has no other.
  function swap(pack, round, idx, rnd) {
    var it = round.items[idx], taken = {};
    round.items.forEach(function (x) { taken[key(x)] = 1; });
    var pool = [];
    if (it.kind === 'gap') pool = range(pack.chain.length).map(function (i) { return { kind: 'gap', k: it.k, line: i, w: 1 }; });
    else if (it.kind === 'spot') pool = range(pack.spot.length).map(function (i) { return { kind: 'spot', i: i, w: 1 }; });
    else if (it.kind === 'quick') pool = range(pack.quick.length).map(function (i) { return { kind: 'quick', i: i, w: 1 }; });
    else if (it.kind === 'order') {
      var size = it.lines.length;
      pool = [];
      L.sequences(pack).forEach(function (seq) {
        if (seq.length < size) return;
        range(seq.length - size + 1).forEach(function (s) {
          var lines = range(size).map(function (j) { return seq[s + j]; });
          pool.push({ kind: 'order', lines: lines, start: L.shuffleOrder(size, rnd), w: 1 });
        });
      });
    }
    pool = pool.filter(function (x) { return !taken[key(x)]; });
    if (!pool.length) return reshuffle(it, rnd);
    return pool[pickInt(pool.length, rnd)];
  }
  function key(it) { return it.kind + ':' + (it.kind === 'gap' ? it.line : it.kind === 'order' ? it.lines[0] : it.kind === 'recall' ? '' : it.i); }
  function reshuffle(it, rnd) {
    var c = JSON.parse(JSON.stringify(it));
    if (c.kind === 'order') c.start = L.shuffleOrder(c.lines.length, rnd);
    return c;
  }
  // Play mode: the same items again in a new order (an order item gets a new shuffle).
  function again(round, rnd) {
    return L.shuffle(round.items, rnd).map(function (it) { return reshuffle(it, rnd); });
  }

  // ---------------------------------------------------------------- what a screen shows
  // The fact before a line, as the cue for "Write the next fact" (null for the first line).
  function cueLine(pack, line) { return line > 0 ? pack.chain[line - 1] : null; }
  // The chain line(s) an item is about: the Learn mode "worked example" is the chain line itself.
  function exampleLines(pack, it) {
    if (it.kind === 'gap') return [pack.chain[it.line]];
    if (it.kind === 'order') return it.lines.map(function (i) { return pack.chain[i]; });
    if (it.kind === 'spot') { var s = pack.spot[it.i]; return [{ text: s.model || s.fix[0], code: s.code }]; }
    if (it.kind === 'quick') { var q = pack.quick[it.i]; return [{ text: q.model || q.accept[0], code: q.code }]; }
    return pack.chain.slice();
  }

  // ---------------------------------------------------------------- marking (keywords; Haiku is the page's job)
  // gap: answer is [typed box texts] for k 0 and 1, or the typed line for k 2. Answers { right, boxes }.
  function markGap(pack, it, answer) {
    var line = pack.chain[it.line];
    if (it.k >= 2) return { right: L.lineFound(line, answer), boxes: null };
    var parts = (L.blanks(line, it.k) || []).filter(function (x) { return x.type === 'gap'; });
    var boxes = parts.map(function (x, j) { return L.gapRight(line, x.gap, (answer || [])[j]); });
    return { right: boxes.length > 0 && boxes.every(Boolean), boxes: boxes };
  }
  // order: answer is the chain indexes in the order the student put them. Answers { right, wrong }.
  function markOrder(it, answer) {
    var sorted = it.lines.slice(), wrong = 0;   // it.lines is in its true order (a run of a pack.sequences list)
    sorted.forEach(function (v, k) { if ((answer || [])[k] !== v) wrong++; });
    return { right: !wrong, wrong: wrong };
  }
  function markSpot(pack, it, text) { return L.hasAny(text, pack.spot[it.i].fix); }
  function markQuick(pack, it, text) { return L.hasAny(text, pack.quick[it.i].accept); }
  // recall: { found: [chain index], unmatched: [written lines], count } (count is at most need).
  function markRecall(pack, it, text) {
    var res = L.recall(pack.chain, text), found = [];
    res.found.forEach(function (f, i) { if (f) found.push(i); });
    return { found: found, unmatched: res.unmatched, count: Math.min(it.need, found.length) };
  }

  // The drillCheck body for a typed answer the keywords rejected (Drills/ai-check.js DrillAiCheck.ask).
  // Card ids: Fact Chain's own (quick id, line<n>), plus spot<n> and order<n>.
  function aiBody(pack, it, answer) {
    var base = { drillId: 'factchain-' + pack.id, hint: '', answer: String(answer || '') };
    if (it.kind === 'gap') {
      var line = pack.chain[it.line];
      if (it.k >= 2) {
        var cue = cueLine(pack, it.line);
        return Object.assign(base, { cardId: 'line' + (it.line + 1), answers: [line.text], note: line.text,
          prompt: 'A student learning facts about ' + pack.title + ' was asked to write the next fact in a chain' +
            (cue ? ' after: "' + cue.text + '"' : ' (the first fact)') + '. Does the student answer state this fact (the same meaning, any wording)? The fact: ' + line.text });
      }
      var blanked = (L.blanks(line, it.k) || []).map(function (x) { return x.type === 'gap' ? '___' : x.text; }).join('');
      return Object.assign(base, { cardId: 'line' + (it.line + 1), answers: [line.text], note: line.text,
        prompt: 'A student filled the gaps in this fact: "' + blanked + '". Does the completed sentence state the same fact as: ' + line.text });
    }
    if (it.kind === 'spot') {
      var s = pack.spot[it.i];
      return Object.assign(base, { cardId: 'spot' + (it.i + 1), answers: s.fix.slice(0, 6), note: s.model || '',
        prompt: 'This statement has one wrong word or phrase: "' + s.wrong + '". The student typed the right word or phrase to put in its place.' });
    }
    if (it.kind === 'quick') {
      var q = pack.quick[it.i];
      return Object.assign(base, { cardId: q.id, prompt: q.q, answers: q.accept.slice(0, 6), note: q.model || '' });
    }
    return null;
  }
  // From memory: one check per fact not yet found, against the lines the keywords matched to nothing (like Fact Chain).
  function recallAiBodies(pack, it, res) {
    var extra = res.unmatched.join('\n').slice(0, 500), out = [];
    if (!extra) return out;
    pack.chain.forEach(function (c, i) {
      if (res.found.indexOf(i) >= 0 || out.length >= 8) return;
      out.push({ line: i, body: { drillId: 'factchain-' + pack.id, cardId: 'line' + (i + 1), answers: [c.text], note: c.text, hint: '', answer: extra,
        prompt: 'A student wrote facts about ' + pack.title + ' from memory, one per line. Does the student answer state this fact (the same meaning, any wording)? The fact: ' + c.text } });
    });
    return out;
  }

  // ---------------------------------------------------------------- coins
  function rate(pool, allUnits) { return allUnits > 0 ? pool / allUnits : 0; }
  function firstPay(r, rightUnits) { return Math.round(r * rightUnits); }
  function redoPay(r, missedUnits) { return Math.round(r * missedUnits * 0.5); }

  // ---------------------------------------------------------------- topics (Data Bridge's picker)
  // Topic ids: 'facts:<group>' (every pack in the group) and 'facts:<pack>'. Only loaded packs are listed.
  function topics(index, loaded) {
    var out = [], groups = (index && index.groups) || {};
    Object.keys(groups).forEach(function (gid) {
      var g = groups[gid], have = g.packs.filter(function (id) { return loaded[id]; });
      if (!have.length) return;
      if (have.length > 1) out.push({ setId: 'facts:' + gid, title: 'All facts: ' + (g.title || gid), year: g.year || '', unit: 'Fact Chain', facts: true, count: have.length });
      have.forEach(function (id) { out.push({ setId: 'facts:' + id, title: loaded[id].title || id, year: loaded[id].year || g.year || '', unit: 'Fact Chain', facts: true, count: 1 }); });
    });
    return out;
  }
  // The packs a topic id stands for (loaded ones only), and the group a pack belongs to.
  function packsFor(index, loaded, topicId) {
    var id = String(topicId || '').replace(/^facts:/, ''), groups = (index && index.groups) || {};
    if (groups[id]) return groups[id].packs.filter(function (p) { return loaded[p]; }).map(function (p) { return loaded[p]; });
    return loaded[id] ? [loaded[id]] : [];
  }
  function groupOf(index, packId) {
    var groups = (index && index.groups) || {};
    return Object.keys(groups).filter(function (g) { return groups[g].packs.indexOf(packId) >= 0; })[0] || '';
  }
  function isFacts(topicId) { return /^facts:/.test(String(topicId || '')); }
  // Round n of a topic with several packs: the packs take turns, starting at a random one for each game.
  function packForRound(list, n, seed) { return list[((seed || 0) + Math.max(1, n) - 1) % list.length]; }

  // ---------------------------------------------------------------- code lines (optional `code` on chain lines, spot, quick)
  // Drawn as the site's exam code block (shared/exam-question.js .eq-code) when that file is loaded.
  function codeHtml(lines) {
    if (!Array.isArray(lines) || !lines.length) return '';
    var Q = root.BCExamQuestion;
    if (Q && Q.html && Q.render && typeof document !== 'undefined') {
      if (!document.getElementById('bc-eq-style')) Q.render(document.createElement('div'), { blocks: [{ type: 'code', lines: [''] }] });
      return '<div class="fc-code">' + Q.html([{ type: 'code', lines: lines.map(String) }]) + '</div>';
    }
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    return '<pre class="fc-code eq-code">' + lines.map(esc).join('\n') + '</pre>';
  }

  var api = { STAGES: STAGES, NAMES: NAMES, HOW: HOW, stagesFor: stagesFor, stageFor: stageFor, build: build, units: units,
    swap: swap, again: again, cueLine: cueLine, exampleLines: exampleLines, markGap: markGap, markOrder: markOrder,
    markSpot: markSpot, markQuick: markQuick, markRecall: markRecall, aiBody: aiBody, recallAiBodies: recallAiBodies,
    rate: rate, firstPay: firstPay, redoPay: redoPay, topics: topics, packsFor: packsFor, groupOf: groupOf, isFacts: isFacts,
    packForRound: packForRound, codeHtml: codeHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FactRounds = api;
})(typeof window !== 'undefined' ? window : globalThis);
