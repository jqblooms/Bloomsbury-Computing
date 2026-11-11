// Exam Scripts: marking, the scaffold ladder, "secure" and which script comes next. No DOM here, so
// tools/test_exam_scripts.mjs can load it in node. The scripts themselves are in js/scripts.js.
var ES = (function () {
  'use strict';

  var SCRIPTS = (typeof ES_SCRIPTS !== 'undefined') ? ES_SCRIPTS : (typeof require === 'function' ? require('./scripts.js') : []);
  var BY_ID = {};
  SCRIPTS.forEach(function (s) { BY_ID[s.id] = s; });

  var TOP = 6;           // the last level: a blank box with a new question
  var BLANK = 5;         // levels 5 and 6 are written from a blank box
  var GAP = 2;           // a second blank pass needs at least this many other answers since the first
  var NEED_PASSES = 2;   // blank passes (spaced) to make a script secure
  var START_OPEN = 3;    // scripts open at the start; another opens when fewer than this are still below level 4
  var LEVELS = [null,
    { name: 'Copy', how: 'Copy the model answer. Type it yourself.' },
    { name: 'Fill the gaps', how: 'Type the whole answer. Fill in the missing words.' },
    { name: 'First letters', how: 'Type the whole answer. You have the first letter of each word.' },
    { name: 'Starters', how: 'Type the whole answer. Each point starts like this.' },
    { name: 'No help', how: 'Write the answer with no help.' },
    { name: 'New question', how: 'A new question. Write the answer with no help.' }
  ];
  var TOPICS = [
    { id: 'all', name: 'All scripts' },
    { id: 'robots', name: 'Robots, sensors and AI' },
    { id: 'cpu', name: 'The CPU' }
  ];
  // The order scripts open in: the two topics take turns.
  var ORDER = ['robot-chars', 'registers', 'automated', 'fetch', 'sensor-choice', 'alu', 'sensor-control', 'decode',
    'ai-meaning', 'cu', 'ml-meaning', 'execute', 'ml-improve', 'performance'];

  // ---------------------------------------------------------------- text
  function tokens(text) {
    return String(text || '').toLowerCase()
      .replace(/[’'`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim().split(' ').filter(Boolean);
  }
  function sentences(text) {
    return String(text || '').split(/[.!?;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  // One word of a stem against one word of the answer.
  function wordMatch(tok, stem) {
    if (stem === '#num') return /^[0-9]+$/.test(tok);
    if (tok === stem) return true;
    if (stem.length >= 4 && tok.indexOf(stem) === 0) return true;
    if (stem.length < 6 || tok.length < stem.length - 1) return false;
    var tol = stem.length >= 10 ? 2 : 1;
    for (var L = stem.length - 1; L <= stem.length + 1; L++) {
      if (lev(tok.slice(0, L), stem) <= tol) return true;
    }
    return false;
  }
  // Where a stem (one word or a phrase) first matches in a list of words at or after `from`, or -1.
  function find(toks, stem, from) {
    var words = stem.split(' ');
    for (var i = from || 0; i + words.length <= toks.length; i++) {
      var ok = true;
      for (var k = 0; k < words.length && ok; k++) ok = wordMatch(toks[i + k], words[k]);
      if (ok) return i;
    }
    return -1;
  }
  function findAny(toks, stems, from) {
    var best = -1;
    stems.forEach(function (s) { var at = find(toks, s, from); if (at >= 0 && (best < 0 || at < best)) best = at; });
    return best;
  }
  function stripPhrases(toks, strip) {
    if (!strip || !strip.length) return toks;
    var s = ' ' + toks.join(' ') + ' ';
    strip.forEach(function (p) { while (s.indexOf(' ' + p + ' ') >= 0) s = s.replace(' ' + p + ' ', ' '); });
    return s.trim().split(' ').filter(Boolean);
  }
  // How many of a point's groups one sentence holds (all of them = the point is met).
  function groupsHit(point, toks) {
    if (point.not && point.not.some(function (p) { return find(toks, p) >= 0; })) return { hit: 0, all: false };
    var hit = 0, pos = 0, all = true;
    point.g.forEach(function (group) {
      var at = findAny(toks, group, point.ord ? pos : 0);
      if (at >= 0) { hit++; if (point.ord) pos = at + 1; } else all = false;
    });
    return { hit: hit, all: all };
  }

  // ---------------------------------------------------------------- marking
  function pointsOf(script, vi) {
    var v = script.variants[vi || 0];
    return (v && v.points) || script.points;
  }
  function modelText(script, vi) {
    return script.variants[vi || 0].model.map(function (s) { return s.replace(/[\[\]|]/g, ''); }).join(' ');
  }
  function acceptedStems(script) {
    var out = [];
    script.variants.forEach(function (v, i) { pointsOf(script, i).forEach(function (p) { p.g.forEach(function (g) { out = out.concat(g); }); }); });
    return out;
  }
  // Marks an answer: { score, marks, full, met: [point ids], missing: [{ need, quote }], rival, empty }.
  // missing lists only as many points as the marks still needed, the model answer's own points first.
  function mark(script, vi, answer) {
    var marks = script.marks, pts = pointsOf(script, vi);
    var sents = sentences(answer).map(function (s) { return { text: s, toks: stripPhrases(tokens(s), script.strip) }; });
    if (!sents.length || !sents.some(function (s) { return s.toks.length; })) return { score: 0, marks: marks, full: false, met: [], missing: [], empty: true };
    if (script.rivals) {
      var acc = acceptedStems(script), mine = [];
      pts.forEach(function (p) { p.g.forEach(function (g) { mine = mine.concat(g); }); });
      var all = tokens(answer);
      var rival = script.rivals.filter(function (r) { return mine.indexOf(r) < 0 && find(all, r) >= 0; });
      if (rival.length && acc.length) {
        return { score: 0, marks: marks, full: false, met: [], rival: true, missing: [{ need: pts[0].need, quote: String(answer).trim().slice(0, 120), rival: true }] };
      }
    }
    var met = [], best = {};
    pts.forEach(function (p) {
      var top = null;
      sents.forEach(function (s) {
        var h = groupsHit(p, s.toks);
        if (h.all && met.indexOf(p.id) < 0) met.push(p.id);
        if (h.hit && (!top || h.hit > top.hit)) top = { hit: h.hit, text: s.text };
      });
      best[p.id] = top;
    });
    var score = Math.min(marks, met.length);
    var inModel = modelPoints(script, vi);
    var left = pts.filter(function (p) { return met.indexOf(p.id) < 0; });
    left.sort(function (a, b) { return (inModel.indexOf(a.id) < 0 ? 1 : 0) - (inModel.indexOf(b.id) < 0 ? 1 : 0); });
    var missing = left.slice(0, Math.max(0, marks - score)).map(function (p) {
      return { id: p.id, need: p.need, quote: best[p.id] ? best[p.id].text : '' };
    });
    return { score: score, marks: marks, full: score >= marks, met: met, missing: missing };
  }
  // The point ids the model answer itself earns, in order.
  function modelPoints(script, vi) {
    var pts = pointsOf(script, vi), out = [];
    script.variants[vi || 0].model.forEach(function (s) {
      var toks = stripPhrases(tokens(s.replace(/[\[\]|]/g, '')), script.strip);
      pts.forEach(function (p) { if (out.indexOf(p.id) < 0 && groupsHit(p, toks).all) out.push(p.id); });
    });
    return out;
  }

  // ---------------------------------------------------------------- scaffolds
  // Each model sentence as a line for the level: 1 the answer, 2 key words blanked, 3 starter and first letters,
  // 4 starter only. Levels 5 and 6 have no lines.
  function scaffold(script, vi, level) {
    if (level >= BLANK) return [];
    return script.variants[vi || 0].model.map(function (s) {
      var bar = s.indexOf('|');
      var starter = bar >= 0 ? s.slice(0, bar) : '';
      var rest = bar >= 0 ? s.slice(bar + 1) : s;
      starter = starter.replace(/[\[\]]/g, '');
      if (level === 1) return (starter + rest).replace(/[\[\]]/g, '');
      if (level === 2) return starter + rest.replace(/\[[^\]]*\]/g, '_____');
      if (level === 3) {
        return starter + rest.replace(/[\[\]]/g, '').replace(/[A-Za-z][A-Za-z'\-]*/g, function (w) { return w.charAt(0) + '__'; });
      }
      return starter.trim() + ' ...';
    });
  }

  // ---------------------------------------------------------------- state
  function blankScript() { return { level: 1, passes: [], secure: false, everSecure: false, last: -1, seen: 0, full: 0, missed: false, vseen: {} }; }
  function newState() { return { v: 1, n: 0, session: 1, open: [], scripts: {} }; }
  function fixState(s) {
    if (!s || typeof s !== 'object' || s.v !== 1) s = newState();
    if (!Array.isArray(s.open)) s.open = [];
    s.open = s.open.filter(function (id) { return BY_ID[id]; });
    if (!s.scripts || typeof s.scripts !== 'object') s.scripts = {};
    SCRIPTS.forEach(function (sc) {
      var r = s.scripts[sc.id];
      if (!r || typeof r !== 'object') r = s.scripts[sc.id] = blankScript();
      var b = blankScript();
      Object.keys(b).forEach(function (k) { if (r[k] === undefined || typeof r[k] !== typeof b[k]) r[k] = b[k]; });
      if (!Array.isArray(r.passes)) r.passes = [];
      r.level = Math.max(1, Math.min(TOP, Math.round(r.level) || 1));
    });
    s.n = Math.max(0, Math.round(s.n) || 0);
    s.session = Math.max(1, Math.round(s.session) || 1);
    return s;
  }
  function inTopic(id, topic) { return !topic || topic === 'all' || BY_ID[id].topic === topic; }
  function counts(state, topic) {
    var ids = SCRIPTS.map(function (s) { return s.id; }).filter(function (id) { return inTopic(id, topic); });
    return {
      total: ids.length,
      secure: ids.filter(function (id) { return state.scripts[id].secure; }).length,
      everSecure: ids.filter(function (id) { return state.scripts[id].everSecure; }).length,
      started: ids.filter(function (id) { return state.scripts[id].seen > 0; }).length
    };
  }
  function allSecure(state, topic) { var c = counts(state, topic); return c.secure === c.total; }

  // Opens scripts in ORDER: START_OPEN at first, then one more whenever fewer than START_OPEN open scripts in the
  // topic are still below level 4 and not secure.
  function openMore(state, topic) {
    for (;;) {
      var open = state.open.filter(function (id) { return inTopic(id, topic); });
      var working = open.filter(function (id) { var r = state.scripts[id]; return !r.secure && r.level < 4; });
      if (working.length >= START_OPEN) return;
      var next = ORDER.filter(function (id) { return inTopic(id, topic) && state.open.indexOf(id) < 0; })[0];
      if (!next) return;
      state.open.push(next);
    }
  }
  // The next script and variant. The weakest scripts come most often; a secure script still comes back now and
  // then; a script just answered waits for GAP other answers when there is anything else to do.
  function pick(state, topic, rnd) {
    rnd = rnd || Math.random;
    openMore(state, topic);
    var cands = state.open.filter(function (id) { return inTopic(id, topic); });
    var pool = cands.filter(function (id) { var r = state.scripts[id]; return r.last < 0 || state.n - r.last > GAP; });
    if (!pool.length) {
      var lastId = null, lastN = -2;
      cands.forEach(function (id) { if (state.scripts[id].last > lastN) { lastN = state.scripts[id].last; lastId = id; } });
      pool = cands.length > 1 ? cands.filter(function (id) { return id !== lastId; }) : cands;
    }
    var weights = pool.map(function (id) {
      var r = state.scripts[id];
      if (r.secure) return 0.4;
      return (TOP + 1 - r.level) + (r.missed ? 2 : 0);
    });
    var sum = weights.reduce(function (a, b) { return a + b; }, 0), x = rnd() * sum, at = 0;
    for (; at < pool.length - 1; at++) { x -= weights[at]; if (x < 0) break; }
    var id = pool[at];
    return { id: id, vi: pickVariant(state, id, rnd) };
  }
  function pickVariant(state, id, rnd) {
    var sc = BY_ID[id], r = state.scripts[id], list;
    if (sc.rotate) list = sc.variants.map(function (v, i) { return i; });
    else if (r.level >= TOP && sc.variants.length > 1) list = sc.variants.map(function (v, i) { return i; }).slice(1);
    else return 0;
    var least = Infinity, best = [];
    list.forEach(function (i) {
      var n = r.vseen[i] === undefined ? -1 : r.vseen[i];
      if (n < least) { least = n; best = [i]; } else if (n === least) best.push(i);
    });
    return best[Math.floor((rnd || Math.random)() * best.length)];
  }

  // Records an answer (full = full marks) and moves the ladder:
  //   full marks: up one level. At levels 5 and 6 it is a blank pass; a pass counts only when at least GAP other
  //   answers came after the last one. Two passes make the script secure.
  //   not full marks: down one level (not below 1); the passes so far are lost and a secure script is no longer secure.
  function record(state, id, vi, full) {
    var r = state.scripts[id];
    state.n++;
    r.seen++;
    r.last = state.n;
    r.vseen[vi || 0] = state.n;
    var out = { from: r.level, to: r.level, pass: false, notSpaced: false, secureNow: false, lost: false };
    if (full) {
      r.full++;
      r.missed = false;
      if (r.level >= BLANK) {
        var prev = r.passes[r.passes.length - 1];
        if (!prev || state.n - prev.n > GAP) { r.passes.push({ n: state.n, session: state.session }); out.pass = true; }
        else out.notSpaced = true;
        if (r.passes.length >= NEED_PASSES && !r.secure) { r.secure = true; r.everSecure = true; out.secureNow = true; }
      }
      r.level = Math.min(TOP, r.level + 1);
    } else {
      r.missed = true;
      r.level = Math.max(1, r.level - 1);
      if (r.secure) out.lost = true;
      r.secure = false;
      r.passes = [];
    }
    out.to = r.level;
    return out;
  }

  // One line for the teacher: secure count, then each script that has been started and is not secure.
  function summary(state) {
    var c = counts(state, 'all');
    var parts = SCRIPTS.filter(function (s) { var r = state.scripts[s.id]; return r.seen && !r.secure; })
      .map(function (s) { return s.title + ': level ' + state.scripts[s.id].level; });
    return c.secure + ' of ' + c.total + ' scripts secure.' + (parts.length ? ' Working on: ' + parts.join('; ') + '.' : '');
  }

  return {
    SCRIPTS: SCRIPTS, BY_ID: BY_ID, LEVELS: LEVELS, TOPICS: TOPICS, ORDER: ORDER, TOP: TOP, BLANK: BLANK, GAP: GAP, NEED_PASSES: NEED_PASSES,
    tokens: tokens, sentences: sentences, wordMatch: wordMatch, find: find, mark: mark, pointsOf: pointsOf, modelText: modelText,
    modelPoints: modelPoints, scaffold: scaffold, newState: newState, fixState: fixState, counts: counts, allSecure: allSecure,
    openMore: openMore, pick: pick, pickVariant: pickVariant, record: record, summary: summary
  };
})();
if (typeof module !== 'undefined') module.exports = ES;
