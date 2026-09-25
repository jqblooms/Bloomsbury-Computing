// The drills engine. Drills/index.html loads helpers.js, the one data file
// for the drill in its ?drill= parameter, then this file, which renders
// that drill (Learn/Quiz, typed or multiple choice, code and exam modes) and
// reports quiz progress to the shell with BC_DRILL_PROGRESS.
(function () {
  "use strict";
  var DRILLS = window.DrillData.drills;
  // ============================================================
  // ENGINE
  // ============================================================
  var DEFAULT_SHOW = 6;
  var MASTERY_STREAK = 3;
  var HELP_MS = 1000;
  var ADVANCE_MS = 1000; // auto-advance delay after a card is marked, either mode
  var TEXT_HELP_MS = 2500; // text mode help reveal has no options to flash, so it gets a bit longer
  var TEXT_WRONG_ADVANCE_MS = 3500; // text mode: linger longer on a wrong answer so it can be memorised

  var params = new URLSearchParams(location.search);
  var drillId = params.get("drill") || "y10-1-1-numbers";
  // embed=1: this drill is sitting inside a lesson slide (a Plenary step of
  // type 'embedded-app' in the main site), not on its own page. The slide
  // already shows the lesson title, so the drill's own header is hidden,
  // and the page reports its height to the parent (see the boot section)
  // so the lesson can size the iframe instead of guessing.
  var isEmbedded = params.get("embed") === "1";
  if (isEmbedded) document.body.classList.add("is-embed");
  var drill = DRILLS[drillId];
  if (!drill) {
    document.getElementById("drill-title").textContent = "Drill not found";
    document.getElementById("setup-card").innerHTML = '<p class="setup-lead">There is no drill called "' + escapeHtml(drillId) + '". Open it again from the Drills menu.</p>';
    return;
  }
  // Each drill declares its own categories, in display order.
  var CATEGORY_LABELS = {};
  var CATEGORY_ORDER = drill.categories.map(function (pair) {
    CATEGORY_LABELS[pair[0]] = pair[1];
    return pair[0];
  });
  var cardsById = {};
  drill.cards.forEach(function (c) { cardsById[c.id] = c; });
  var isCodeDrill = !!drill.codeDrill;
  var isExamSet = !!drill.isExamSet;
  var CODE_MASTERY_STREAK = 3;
  var CODE_HELP_MS = 4000; // a whole reference program takes longer to read than one flashed MC option

  var els = {
    title: document.getElementById("drill-title"),
    sub: document.getElementById("drill-sub"),
    setupCard: document.getElementById("setup-card"),
    setupCategory: document.getElementById("setup-category"),
    setupCount: document.getElementById("setup-count"),
    setupCountField: document.getElementById("setup-count-field"),
    setupPool: document.getElementById("setup-pool"),
    setupPoolField: document.getElementById("setup-pool-field"),
    setupAnswerMode: document.getElementById("setup-answermode"),
    setupAnswerModeField: document.getElementById("setup-answermode-field"),
    setupStartLearn: document.getElementById("setup-start-learn"),
    setupStartQuiz: document.getElementById("setup-start-quiz"),
    setupContinue: document.getElementById("setup-continue"),
    setupResumeNote: document.getElementById("setup-resume-note"),
    runArea: document.getElementById("run-area"),
    scopeLabel: document.getElementById("scope-label"),
    changeSelectionBtn: document.getElementById("change-selection-btn"),
    modebar: document.getElementById("modebar"),
    modeLearn: document.getElementById("mode-learn"),
    modeQuiz: document.getElementById("mode-quiz"),
    noticeLearn: document.getElementById("notice-learn"),
    noticeQuiz: document.getElementById("notice-quiz"),
    noticeCode: document.getElementById("notice-code"),
    noticeExam: document.getElementById("notice-exam"),
    progress: document.getElementById("progress"),
    progressLabel: document.getElementById("progress-label"),
    progressFill: document.getElementById("progress-fill"),
    stage: document.getElementById("stage"),
    masteryOverview: document.getElementById("mastery-overview")
  };
  els.title.textContent = drill.title;
  els.sub.textContent = drill.subtitle || "";
  document.title = "Drill: " + drill.title;

  var RUN_KEY = "bc_drill_" + drillId + "_run";
  var EVER_KEY = "bc_drill_" + drillId + "_ever";

  function loadEver() {
    try { return JSON.parse(localStorage.getItem(EVER_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveEver(obj) {
    try { localStorage.setItem(EVER_KEY, JSON.stringify(obj)); } catch (e) {}
  }
  var everMastered = loadEver(); // { cardId: true }

  // Code drills master a question TYPE rather than each authored card.
  // Store those durable mastery units alongside ordinary card mastery, but
  // under a namespaced key so the two models can never collide.
  function codeMasteryKey(category) { return "code-category:" + category; }
  function codeCategoryEverMastered(category) { return !!everMastered[codeMasteryKey(category)]; }
  function allCodeCategories() {
    var seen = {};
    drill.cards.forEach(function (card) { if (card.category) seen[card.category] = true; });
    return CATEGORY_ORDER.filter(function (cat) { return !!seen[cat]; });
  }
  var CODE_STATS_KEY = "bc_drill_" + drillId + "_code_stats";
  function loadCodeStats() {
    try { return JSON.parse(localStorage.getItem(CODE_STATS_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveCodeStats() {
    try { localStorage.setItem(CODE_STATS_KEY, JSON.stringify(codeStats)); } catch (e) {}
  }
  var codeStats = loadCodeStats();

  // ---- topic (category) + how-many-cards picker ----
  // A student can drill one topic at a time and a chosen number of cards,
  // so mastery can be built a few cards at a time rather than always facing
  // the whole set. `category: "all"` means every card in the drill.
  function categoryCardIds(category) {
    if (!category || category === "all") return drill.cards.map(function (c) { return c.id; });
    return drill.cards.filter(function (c) { return c.category === category; }).map(function (c) { return c.id; });
  }
  function categoryLabel(category) {
    if (!category || category === "all") return "All topics";
    return CATEGORY_LABELS[category] || category;
  }
  // Round-number choices up to the pool size, plus the exact pool size
  // itself (as "All") if it isn't already one of them.
  function countChoicesFor(poolSize) {
    var steps = [5, 10, 15, 20, 25, 30, 40, 50].filter(function (n) { return n < poolSize; });
    steps.push(poolSize);
    return steps;
  }

  // The "Which cards?" pool (James): a run draws only from cards the
  // student has NOT yet mastered by default, so already-mastered cards are
  // left alone until everything is done; a student can instead choose the
  // already-mastered pool to revise, or everything. "Mastered" here is the
  // persisted everMastered state - the same one the mastery bars and the
  // teacher's dashboard read - not this run's own streaks. An empty pool
  // (nothing mastered yet, or everything mastered) falls back to all cards
  // rather than starting a run with nothing in it.
  function poolCardIds(category, pool) {
    var ids = categoryCardIds(category);
    if (pool === "mastered") ids = ids.filter(function (id) { return everMastered[id]; });
    else if (pool === "unmastered") ids = ids.filter(function (id) { return !everMastered[id]; });
    return ids.length ? ids : categoryCardIds(category);
  }
  function poolLabel(pool) {
    if (pool === "mastered") return "already mastered";
    if (pool === "unmastered") return "not yet mastered";
    return "all cards";
  }

  // run state - reset whenever the mode, topic or card count changes
  var run = null;
  function freshRun(mode, category, count, answerMode, poolChoice) {
    var pool = poolCardIds(category, poolChoice);
    var size = (count && count < pool.length) ? count : pool.length;
    var queue = (count && count < pool.length) ? sample(pool, size) : shuffle(pool);
    return {
      mode: mode,
      category: category || "all",
      pool: poolChoice || "all",
      count: size,
      answerMode: answerMode === "text" ? "text" : "mc",
      queue: queue,
      streak: {},            // cardId -> consecutive correct this run
      masteredThisRun: {},   // cardId -> true
      seenInLearn: {},       // cardId -> true (met at least once this run, in Learn mode)
      attempts: {},          // cardId -> total answers this run
      wrong: {}              // cardId -> wrong answers this run
    };
  }
  function persistRun() {
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (e) {}
  }
  function loadRun() {
    try {
      var r = JSON.parse(localStorage.getItem(RUN_KEY) || "null");
      if (r && r.mode && Array.isArray(r.queue)) {
        // Saves from before the topic/card-count picker existed had no
        // category/count - they were always the whole drill.
        if (!r.category) r.category = "all";
        if (!r.count) r.count = drill.cards.length;
        if (r.answerMode !== "text") r.answerMode = "mc";
        // Saves from before the "Which cards?" pool picker drew from every card.
        if (r.pool !== "mastered" && r.pool !== "unmastered") r.pool = "all";
        return r;
      }
    } catch (e) {}
    return null;
  }


  // ---- text-mode grading: whole-word keyword matching, never substring ----
  // "byte" must not match inside "kibibyte", and "2" must not match inside
  // "12" - so we tokenize into whole [a-z0-9]+ runs, never do indexOf on raw
  // strings. A leading minus before a number (as in "-128") is folded into
  // its own token ("neg128") before tokenizing, so "128" (unsigned) and
  // "-128"/"negative 128"/"minus 128" (signed) are never confused.
  var TEXT_FILLER = { a: 1, an: 1, the: 1, is: 1, are: 1, of: 1, to: 1, in: 1, on: 1, for: 1, and: 1, or: 1, it: 1, its: 1, this: 1, that: 1, by: 1, be: 1, as: 1, so: 1, than: 1, then: 1 };
  // A student typing "two" instead of "2" (or vice versa) is giving the
  // same answer, so number words fold to the same digit token as their
  // numeral form - both sides of a match run through this, so a card
  // answer written either way still lines up with either way of typing it.
  var NUM_WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var NUM_SCALES = { hundred: 100, thousand: 1000 };
  function collapseNumberWords(tokens) {
    var out = [];
    var i = 0;
    while (i < tokens.length) {
      var t = tokens[i];
      if (NUM_WORDS.hasOwnProperty(t) || NUM_SCALES.hasOwnProperty(t)) {
        var total = 0, current = 0, j = i;
        while (j < tokens.length) {
          var w = tokens[j];
          if (NUM_WORDS.hasOwnProperty(w)) {
            current += NUM_WORDS[w];
            j++;
          } else if (NUM_SCALES.hasOwnProperty(w)) {
            current = (current || 1) * NUM_SCALES[w];
            if (w === "thousand") { total += current; current = 0; }
            j++;
          } else if (w === "and" && j + 1 < tokens.length && (NUM_WORDS.hasOwnProperty(tokens[j + 1]) || NUM_SCALES.hasOwnProperty(tokens[j + 1]))) {
            j++;
          } else {
            break;
          }
        }
        total += current;
        if (out.length && out[out.length - 1] === "neg") {
          out.pop();
          out.push("neg" + total);
        } else {
          out.push(String(total));
        }
        i = j;
      } else {
        out.push(t);
        i++;
      }
    }
    return out;
  }
  // A very light plural stemmer - "components" must match a card answer
  // written as "component", and vice versa, or a fair paraphrase gets
  // marked wrong for a difference that has nothing to do with the answer
  // being right. Deliberately crude (strip a trailing "s") rather than a
  // full stemming library - this is short exam vocabulary, not prose, and
  // numbers are left untouched so "128"/"neg128" are never touched by it.
  function stem(tok) {
    if (/^[a-z]+[0-9]+$/.test(tok) || /^[0-9]+$/.test(tok)) return tok;
    if (tok.length > 4 && /ies$/.test(tok)) return tok.slice(0, -3) + "y"; // carries -> carry
    if (tok.length > 5 && /(ch|sh|x|s|z)es$/.test(tok)) return tok.slice(0, -2); // switches -> switch
    if (tok.length > 4 && /[a-z]s$/.test(tok) && !/ss$/.test(tok)) return tok.slice(0, -1); // components -> component
    return tok;
  }
  function tokenize(text) {
    var s = String(text == null ? "" : text).toLowerCase();
    s = s.replace(/\u2212/g, "-"); // the real minus sign used in card text, vs the ASCII hyphen a student types
    s = s.replace(/\bnegative\b/g, " neg ").replace(/\bminus\b/g, " neg ");
    // A hyphen immediately after a digit is a RANGE separator ("0-9",
    // "0-15", "1-9 and A-F"), not a minus sign - only a hyphen at the start
    // of the string or after whitespace/another operator is really negating
    // the number that follows. Without the "not preceded by a digit" guard
    // here, "0-9" tokenized as "0" + "neg9" instead of "0" + "9", silently
    // breaking matchAnswer for every card whose answer names a digit range
    // (a real, confirmed bug - found via a Node harness auditing every
    // card's own answers against matchAnswer, not a hypothetical).
    s = s.replace(/(^|[^0-9])-\s*(\d+)/g, "$1 neg$2 ");
    s = s.replace(/\bneg\s+(\d+)/g, " neg$1 ");
    var raw = s.match(/[a-z0-9]+/g) || [];
    return collapseNumberWords(raw).map(stem);
  }
  // Cards can carry an explicit `keywords` field describing exactly what
  // counts as a correct typed answer. Each alternative can be either:
  //   altPhrasing: [ requirement, requirement, ... ]        (AND - every requirement needed)
  //   requirement: [ token, token, ... ]                    (OR - any one synonym token)
  // ...or, when some words genuinely matter more than others (not every
  // word in a card's answer is equally essential - a hedge like "simply"
  // or a supporting clause like "so data or precision can be lost" is not
  // the same as the core word "lost"):
  //   { required: [ requirement, ... ], optional: [ token, ... ], need: N,
  //     excluded: [ token, ... ] }
  //   - every `required` requirement (same OR-of-synonyms shape as above)
  //     must be met - these are the words that actually carry the answer.
  //   - `optional` is a supporting pool; only `need` of them (default 0)
  //     have to also show up, so this can even be omitted/empty for a
  //     single-concept answer where the required word(s) ARE the answer.
  //     Also useful to disambiguate a required word from an unrelated
  //     distractor that happens to share it (e.g. "language" alone matches
  //     a wrong "it's a programming language" answer too - requiring one
  //     supporting word like "cover"/"every"/"symbol" rules that out).
  //   - `excluded` (optional) fails the alt outright if any of its tokens
  //     is present, however well `required`/`optional` matched - a wrong,
  //     negated answer often still contains the required word ("less
  //     accurate" still contains "accurate"; "nothing is ever lost" still
  //     contains "lost").
  //   ...or a plain RegExp, tested against the raw typed answer directly -
  //   the one thing none of the bag-of-words shapes above can express,
  //   since they only check whether a word is present, never its position.
  //   Needed when two cards' correct answers use exactly the same words in
  //   a different order/pairing ("Write 1, carry 0" vs "Write 0, carry 1" -
  //   any keyword-presence check accepts either for both, since the word
  //   SET is identical either way).
  //   keywords: [ altPhrasing, altPhrasing, ... ]           (OR - any one alt is enough)
  // If a card has no `keywords` yet, fall back to requiring the non-filler
  // whole words from one of its `answers` strings - safe (still whole-word,
  // still neg-number aware) even before keywords are written. A short
  // answer (1-2 keywords) still needs all of them, but a longer explanatory
  // answer only needs a handful of its keywords (half, capped at 4), not
  // every single one typed back verbatim - a fair, compressed paraphrase
  // of a long answer should still pass. An
  // answer like "Kibibyte (KiB)" splits into two separate alternatives
  // (the full word, or just the abbreviation) rather than requiring both -
  // a student who types either one has clearly given the right answer.
  function keywordsForCard(card) {
    if (card.keywords) return card.keywords;
    var alts = [];
    (card.answers || []).forEach(function (ans) {
      var m = /^(.*?)\(([^)]+)\)\s*$/.exec(ans);
      var phrases = m ? [m[1], m[2]] : [ans];
      phrases.forEach(function (phrase) {
        // Deduplicated - a word the answer happens to say twice (e.g. "...
        // lost, so data or precision can be lost") is one concept, not two,
        // and should not inflate how many DIFFERENT keywords are required.
        var seen = {};
        var toks = tokenize(phrase).filter(function (t) {
          if (TEXT_FILLER[t] || seen[t]) return false;
          seen[t] = true;
          return true;
        });
        if (!toks.length) return;
        var need = toks.length <= 2 ? toks.length : Math.min(4, Math.max(2, Math.ceil(toks.length * 0.5)));
        alts.push({ tokens: toks, need: need });
      });
    });
    return alts;
  }
  // Exact typed-answer matching for cards the word-bag fallback can't grade
  // fairly. Case, spaces and commas don't matter, nor does a trailing full
  // stop or semicolon, so "0 0 0 1", "0001" and "0, 0, 0, 1" are the same
  // answer - but the order and every symbol do.
  function strictNormalize(s, keepCase) {
    var out = String(s == null ? "" : s).replace(/−/g, "-").replace(/[\s,]+/g, "").replace(/[.;]+$/, "");
    return keepCase ? out : out.toLowerCase();
  }
  // A card with no explicit `keywords` uses the auto-derived word bag, which
  // only checks which words are present. That can't grade an answer whose
  // meaning is its order or its symbols: a truth-table column ("0 0 0 1"
  // vs "0 1 0 0"), a query result list, "Age < 4" vs "Age > 4", or an
  // answer that is only filler/symbols ("AND", "<>") and so leaves an empty
  // bag. The card's own distractors reveal this - if the bag accepts one of
  // them, or has nothing to match at all, the card falls back to exact
  // matching instead. Cards the bag already grades correctly are untouched.
  function usesStrictMatch(card) {
    if (card.keywords) return false;
    var alts = keywordsForCard(card);
    if (!alts.length) return true;
    return (card.distractors || []).some(function (d) { return bagMatch(alts, d); });
  }
  function matchAnswer(card, rawInput) {
    if (usesStrictMatch(card)) {
      // Case only counts when the card itself tests it - one of its wrong
      // options is an answer in different case ("STO305" vs "Sto305").
      var answers = card.answers || [];
      var keepCase = (card.distractors || []).some(function (d) {
        return answers.some(function (a) { return a !== d && strictNormalize(a) === strictNormalize(d); });
      });
      var typed = strictNormalize(rawInput, keepCase);
      return !!typed && answers.some(function (a) { return strictNormalize(a, keepCase) === typed; });
    }
    return bagMatch(keywordsForCard(card), rawInput);
  }
  function bagMatch(alts, rawInput) {
    var have = {};
    tokenize(rawInput).forEach(function (t) { have[t] = true; });
    return alts.some(function (alt) {
      // A plain RegExp alternative tests the raw typed answer directly, in
      // order - the one case none of the bag-of-words shapes above can
      // handle. "Write 1, carry 0" and "Write 0, carry 1" contain exactly
      // the same words, just swapped, so no amount of required/optional
      // keyword presence can tell them apart - only checking that the
      // right digit comes before "carry" and the right digit comes after
      // actually can.
      if (alt instanceof RegExp) return alt.test(rawInput);
      // Explicit `keywords` (card.keywords, when present) stay an exact
      // OR-of-AND-of-OR-synonyms match - every requirement must be met.
      if (Array.isArray(alt)) {
        return alt.every(function (synonyms) {
          return synonyms.some(function (tok) { return !!have[tok]; });
        });
      }
      // Required + weighted-optional alternative - some words really are
      // the answer (every `required` entry must be met, same OR-of-
      // synonyms shape as above) while the rest are just supporting detail
      // (only `need` of `optional` has to also show up, default 0). Lets a
      // card say "the word 'lost' really is the whole answer" instead of
      // the auto-derived fallback's everything-counts-equally threshold.
      // `excluded` (optional) is the other direction - a required word can
      // also show up inside a wrong, negated answer ("less accurate" still
      // contains "accurate"; "nothing is ever lost" still contains "lost"),
      // so any excluded token present fails the whole alt regardless of
      // what else matched.
      if (alt.required || alt.optional || alt.excluded) {
        if ((alt.excluded || []).some(function (t) { return !!have[t]; })) return false;
        var reqMet = (alt.required || []).every(function (synonyms) {
          return synonyms.some(function (tok) { return !!have[tok]; });
        });
        if (!reqMet) return false;
        var optCount = (alt.optional || []).filter(function (t) { return have[t]; }).length;
        return optCount >= (alt.need || 0);
      }
      // Auto-derived fallback alternatives are threshold-based: enough of
      // the keywords, not literally every one.
      var count = alt.tokens.filter(function (t) { return have[t]; }).length;
      return count >= alt.need;
    });
  }

  // ---- progress reporting to the shell (quiz mode only) ----
  function report(cardId) {
    var card = cardsById[cardId];
    if (!card) return;
    // Report the exact instance the student actually just answered (its real
    // randomised prompt), not the card's static template - `current` is
    // always the card this report() call is about, since it only ever fires
    // right after that same card was checked.
    var liveCard = current && current.cardId === cardId ? resolveCard(card, current.instance) : card;
    var s = run.streak[cardId] || 0;
    var masteredRun = !!run.masteredThisRun[cardId];
    var ever = !!everMastered[cardId];
    var att = run.attempts[cardId] || 0;
    var wr = run.wrong[cardId] || 0;
    var total = drill.cards.length;
    var everCount = Object.keys(everMastered).length;
    // "Category: <label> ·" is a stable, parseable prefix - the admin tab
    // (which only ever sees this summary string plus the questionId/label,
    // never the drill's own content object) reads it back out to group
    // attempts/mastery by topic. Keep the exact "Category: X ·" shape if
    // this ever changes.
    var summary = "Category: " + categoryLabel(card.category) + " · Quiz · streak " + s + "/" + MASTERY_STREAK +
      " · " + att + " attempt" + (att === 1 ? "" : "s") + " (" + (att - wr) + " right, " + wr + " wrong)" +
      " · mastered this run: " + (masteredRun ? "yes" : "no") +
      " · ever mastered: " + (ever ? "YES" : "no") +
      " · overall " + everCount + "/" + total + " cards ever mastered" +
      (everCount === total ? " · TRUE MASTERY ACHIEVED" : "");
    try {
      window.parent.postMessage({
        type: "BC_DRILL_PROGRESS",
        drillId: drillId,
        drillLabel: drill.title,
        cardId: cardId,
        cardPrompt: liveCard.prompt,
        category: card.category || null,
        categoryLabel: categoryLabel(card.category),
        streak: s,
        masteredThisRun: masteredRun,
        everMastered: ever,
        attempts: att,
        wrong: wr,
        everCount: everCount,
        total: total,
        trueMastery: everCount === total,
        summary: summary
      }, "*");
    } catch (e) {}
  }

  // ---- option set for one appearance of a card ----
  function buildOptionSet(card) {
    var show = card.show || DEFAULT_SHOW;
    var correct, pool;
    if (card.type === "multi") {
      var maxCorrect = Math.min(card.answers.length, show - 2);
      var k = 1 + Math.floor(Math.random() * Math.max(1, maxCorrect));
      correct = sample(card.answers, k);
      pool = correct.concat(sample(card.distractors, show - correct.length));
    } else {
      correct = sample(card.answers, 1);
      pool = correct.concat(sample(card.distractors, show - 1));
    }
    return { options: shuffle(pool), correct: correct, multi: card.type === "multi" };
  }

  // ============================================================
  // RENDER
  // ============================================================
  var current = null; // { cardId, set, checked, helpTimer }

  // Switching Learn<->Quiz keeps the current topic/card-count selection but
  // always starts a fresh run (see freshRun) - the anti-cheat rule James
  // asked for. Choosing a new topic or count from the setup panel (see
  // startRun below) also always starts fresh, for the same reason.
  function applyModeUI(mode) {
    els.modeLearn.classList.toggle("is-active", mode === "learn");
    els.modeQuiz.classList.toggle("is-active", mode === "quiz");
    els.noticeLearn.style.display = mode === "learn" ? "" : "none";
    els.noticeQuiz.style.display = mode === "quiz" ? "" : "none";
    els.progress.style.display = mode === "quiz" ? "flex" : "none";
  }

  function setMode(mode, opts) {
    opts = opts || {};
    var switching = run && run.mode !== mode;
    if (switching || !run) {
      run = freshRun(mode, run ? run.category : "all", run ? run.count : null, run ? run.answerMode : "mc");
      persistRun();
    }
    applyModeUI(mode);
    updateScopeLabel();
    if (switching && !opts.silent) toast("Run reset - switching modes clears this run. Your overall mastery is kept.");
    nextCard();
  }

  function updateScopeLabel() {
    if (!run) return;
    var poolNote = run.pool && run.pool !== "all" ? " (" + poolLabel(run.pool) + ")" : "";
    els.scopeLabel.textContent = categoryLabel(run.category) + " · " + run.count + " card" + (run.count === 1 ? "" : "s") + " this run" + poolNote;
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#1f2733;color:#fff;padding:10px 16px;border-radius:10px;font-weight:600;font-size:.85rem;z-index:50;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:90%;text-align:center";
    document.body.appendChild(t);
    setTimeout(function () { t.style.transition = "opacity .4s"; t.style.opacity = "0"; }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }

  function updateProgress() {
    var total = run.count;
    var mastered = Object.keys(run.masteredThisRun).length;
    els.progressLabel.textContent = mastered + " / " + total + " mastered this run";
    els.progressFill.style.width = (total ? Math.round(mastered / total * 100) : 0) + "%";
  }

  function nextCard() {
    if (isCodeDrill) { nextCodeCard(); return; }
    if (isExamSet) { nextExamCard(); return; }
    if (current && current.advanceTimer) clearTimeout(current.advanceTimer);
    persistRun();
    if (run.mode === "quiz") {
      updateProgress();
      if (!run.queue.length) return renderDone();
    }
    if (!run.queue.length) { // learn mode ran dry - reshuffle everything
      run.queue = shuffle(drill.cards.map(function (c) { return c.id; }));
    }
    var cardId = run.queue.shift();
    // A card with a `randomize` function gets a fresh instance (new numbers,
    // sometimes a whole new scenario) on every single draw - see
    // resolveCard() just below. Anti-cheat, the same problem
    // randomizeSetup() already solves for type:'code' cards: without this,
    // a card's prompt/answer never changes, so a class shares the one right
    // answer instead of the underlying reasoning (James, 2026-09-16:
    // "students are memorising answers for code-based questions").
    var instance = cardsById[cardId].randomize ? cardsById[cardId].randomize() : null;
    var card = resolveCard(cardsById[cardId], instance);
    var set = buildOptionSet(card);
    current = { cardId: cardId, instance: instance, set: set, checked: false, helpTimer: null };
    renderCard();
  }

  // Merges one freshly-generated instance (prompt/answers/keywords/
  // distractors/note for THIS draw) over a randomized card's static base -
  // every other plain-mode function reads through this instead of
  // `cardsById[current.cardId]` directly, so buildOptionSet/matchAnswer/
  // renderCard/onHelp/submitAnswer all automatically grade and display the
  // SAME draw's values with no further changes needed anywhere else. A
  // card with no `randomize` function passes through completely unchanged.
  function resolveCard(card, instance) {
    if (!instance) return card;
    return {
      id: card.id,
      category: card.category,
      type: card.type,
      show: card.show,
      prompt: instance.prompt,
      answers: instance.answers,
      keywords: instance.keywords,
      distractors: instance.distractors,
      note: instance.note != null ? instance.note : card.note,
      hint: instance.hint != null ? instance.hint : card.hint,
      diagram: instance.diagram != null ? instance.diagram : card.diagram,
      legend: instance.legend != null ? instance.legend : card.legend
    };
  }

  function renderCard() {
    var card = resolveCard(cardsById[current.cardId], current.instance);
    var set = current.set;
    var learn = run.mode === "learn";
    // Multi-answer cards always stay multiple choice, even in text mode -
    // grading several free-typed answers reliably is a much harder problem
    // than grading one, so only single-answer cards get the text input.
    var textMode = run.answerMode === "text" && !set.multi;

    var kind = set.multi ? "Pick every correct answer, then submit" : (textMode ? "Type your answer" : "Pick an answer");
    var streakHtml = "";
    if (run.mode === "quiz") {
      var s = run.streak[current.cardId] || 0;
      var dots = "";
      for (var i = 0; i < MASTERY_STREAK; i++) dots += '<i class="' + (i < s ? "on" : "") + '"></i>';
      streakHtml = '<span class="streakdots" title="Streak toward mastery">' + dots + "</span>";
    }

    // The answer is never shown up front, in either mode - learn mode's
    // only reveal is the "I need help" flash (see onHelp), so a student
    // has to actually try before seeing anything.
    var optsHtml = set.options.map(function (opt, idx) {
      return '<label class="opt" data-opt="' + idx + '">' +
        '<input type="' + (set.multi ? "checkbox" : "radio") + '" name="opt" value="' + idx + '">' +
        "<span>" + escapeHtml(opt) + "</span></label>";
    }).join("");
    var bodyHtml = textMode ?
      ('<input type="text" class="text-answer-input" id="text-answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer...">' +
        (learn ? '<div class="help-box" id="help-box"></div>' : "")) :
      ('<div class="options">' + optsHtml + "</div>");

    // A single-answer card marks itself the instant an option is clicked -
    // there is nothing to "submit" when there is only one thing to pick, so
    // no Check button for these at all (James: "students should not have to
    // submit a single answer"). A multi-answer card still needs an explicit
    // Submit, since the student has to finish picking several options
    // first. Either way, once marked, it moves on by itself - no "click
    // Next" step either.
    var promptHasCode = card.prompt.indexOf("\n") !== -1;
    els.stage.innerHTML =
      '<div class="card">' +
      flowchartCardExtraHtml(card) +
      '<p class="prompt' + (promptHasCode ? " has-code" : "") + '">' + escapeHtml(card.prompt) + streakHtml + "</p>" +
      '<div class="hint-kind">' + kind + "</div>" +
      bodyHtml +
      '<div class="feedback" id="fb"></div>' +
      '<div class="actions">' +
      (textMode ? '<button type="button" class="btn" id="submit-btn">Check</button>' : (set.multi ? '<button type="button" class="btn" id="submit-btn">Submit</button>' : "")) +
      (learn ? '<button type="button" class="btn ghost" id="help-btn">I need help</button>' : "") +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn ghost" id="restart-btn" title="Wipe this run and start it again">Restart run</button>' +
      "</div></div>";

    if (textMode) {
      var textInput = els.stage.querySelector("#text-answer");
      textInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submitAnswer(); }
      });
      textInput.focus();
    } else {
      var optionEls = els.stage.querySelectorAll(".opt");
      Array.prototype.forEach.call(optionEls, function (el) {
        el.addEventListener("click", function () {
          if (current.checked) return;
          var input = el.querySelector("input");
          if (!set.multi) {
            input.checked = true;
            el.classList.add("is-picked");
            submitAnswer(); // single answer: picking it IS submitting it
          } else {
            setTimeout(function () { el.classList.toggle("is-picked", input.checked); }, 0);
          }
        });
      });
    }

    var submitBtn = els.stage.querySelector("#submit-btn");
    if (submitBtn) submitBtn.addEventListener("click", submitAnswer);
    var helpBtn = els.stage.querySelector("#help-btn");
    if (helpBtn) helpBtn.addEventListener("click", onHelp);
    els.stage.querySelector("#restart-btn").addEventListener("click", function () {
      if (current.advanceTimer) clearTimeout(current.advanceTimer);
      run = freshRun(run.mode, run.category, run.count, run.answerMode);
      persistRun();
      toast("Run restarted.");
      nextCard();
    });
  }

  function onHelp() {
    // Learn mode's ONLY reveal, anywhere: flash the correct answer for a
    // bit, then hide it again completely - the answer is never shown
    // otherwise, not even on a card's first appearance. Recorded on the
    // current card so advance() can bring it back round sooner for a quick
    // second look, rather than losing it in the full deck for a while.
    current.usedHelp = true;
    var set = current.set;
    var card = resolveCard(cardsById[current.cardId], current.instance);
    var textMode = run.answerMode === "text" && !set.multi;
    if (textMode) {
      var box = els.stage.querySelector("#help-box");
      if (!box) return;
      // A card can supply a short `hint` (a handful of words) for this
      // flash specifically - James, 2026-09-16: "example answers from
      // 'I need help' are still painfully verbose, way too much to read
      // and remember in a couple of seconds." The full answers array
      // still backs grading and the wrong-answer feedback (which stays on
      // screen, not a timed flash) - only this quick reveal prefers the
      // short version when a card has one.
      box.textContent = card.hint || set.correct.join(" / ");
      box.classList.add("show");
      if (current.helpTimer) clearTimeout(current.helpTimer);
      current.helpTimer = setTimeout(function () {
        if (current.checked) return;
        box.classList.remove("show");
      }, TEXT_HELP_MS);
      return;
    }
    var optionEls = els.stage.querySelectorAll(".opt");
    Array.prototype.forEach.call(optionEls, function (el, idx) {
      if (set.correct.indexOf(set.options[idx]) !== -1) el.classList.add("is-answer");
    });
    if (current.helpTimer) clearTimeout(current.helpTimer);
    current.helpTimer = setTimeout(function () {
      if (current.checked) return;
      Array.prototype.forEach.call(els.stage.querySelectorAll(".opt"), function (el) {
        el.classList.remove("is-answer");
      });
      // Shuffle the visible order once the flash is gone, so a student
      // cannot just remember "3rd from the top" without reading any text.
      set.options = shuffle(set.options);
      renderCard();
    }, HELP_MS);
  }

  function submitAnswer() {
    if (current.checked) return;
    var set = current.set;
    var card = resolveCard(cardsById[current.cardId], current.instance);
    var textMode = run.answerMode === "text" && !set.multi;
    var right;
    var fb;

    if (textMode) {
      var input = els.stage.querySelector("#text-answer");
      var value = input.value;
      if (!value.trim()) { toast("Type an answer first."); return; }
      // A student who reads the "I need help" flash naturally types the
      // hint text back - James, 2026-09-16: "short hints from 'i need
      // help' are not recognised as correct answers when typed." The
      // hint is a paraphrase, not guaranteed to satisfy the card's own
      // keyword regex (built against `answers`), so it needs its own
      // explicit, loose (punctuation/case/whitespace-insensitive) check
      // rather than editing every affected regex by hand.
      right = matchAnswer(card, value) || (!!card.hint && normalizeLoose(value) === normalizeLoose(card.hint));
      current.checked = true;
      if (current.helpTimer) clearTimeout(current.helpTimer);
      input.disabled = true;
      var box = els.stage.querySelector("#help-box");
      if (box) box.classList.remove("show");
      fb = els.stage.querySelector("#fb");
      fb.className = "feedback show " + (right ? "ok" : "no");
      fb.innerHTML = (right ? "Correct." : "Not quite - the correct answer is: " + escapeHtml(set.correct[0])) +
        (card.note && run.mode === "learn" ? '<span class="note">' + escapeHtml(card.note) + "</span>" : "");
    } else {
      var picked = [];
      Array.prototype.forEach.call(els.stage.querySelectorAll("input"), function (inp, idx) {
        if (inp.checked) picked.push(set.options[idx]);
      });
      if (!picked.length) { toast("Pick an answer first."); return; }

      var correctSet = set.correct.slice().sort().join("");
      var pickedSet = picked.slice().sort().join("");
      right = correctSet === pickedSet;

      current.checked = true;
      if (current.helpTimer) clearTimeout(current.helpTimer);

      var optionEls = els.stage.querySelectorAll(".opt");
      Array.prototype.forEach.call(optionEls, function (el, idx) {
        el.classList.add("is-locked");
        el.classList.remove("is-picked", "is-answer");
        el.querySelector("input").disabled = true;
        var opt = set.options[idx];
        var isCorrect = set.correct.indexOf(opt) !== -1;
        var wasPicked = picked.indexOf(opt) !== -1;
        if (isCorrect) el.classList.add("is-correct");
        else if (wasPicked) el.classList.add("is-wrong");
      });

      fb = els.stage.querySelector("#fb");
      fb.className = "feedback show " + (right ? "ok" : "no");
      fb.innerHTML = (right ? "Correct." : "Not quite - the correct answer" + (set.correct.length > 1 ? "s are" : " is") + " highlighted in green.") +
        (card.note && run.mode === "learn" ? '<span class="note">' + escapeHtml(card.note) + "</span>" : "");
    }

    var submitBtn = els.stage.querySelector("#submit-btn");
    if (submitBtn) submitBtn.disabled = true;
    var helpBtn = els.stage.querySelector("#help-btn");
    if (helpBtn) helpBtn.disabled = true;

    // ---- scoring ----
    if (run.mode === "quiz") {
      run.attempts[current.cardId] = (run.attempts[current.cardId] || 0) + 1;
      if (right) {
        run.streak[current.cardId] = (run.streak[current.cardId] || 0) + 1;
        if (run.streak[current.cardId] >= MASTERY_STREAK) {
          run.masteredThisRun[current.cardId] = true;
          if (!everMastered[current.cardId]) { everMastered[current.cardId] = true; saveEver(everMastered); }
          fb.innerHTML = "Mastered! Three in a row - this card is done for this run." +
            (card.note && run.mode === "learn" ? '<span class="note">' + escapeHtml(card.note) + "</span>" : "");
        }
      } else {
        run.wrong[current.cardId] = (run.wrong[current.cardId] || 0) + 1;
        run.streak[current.cardId] = 0;
      }
      report(current.cardId);
      persistRun();
      updateProgress();
    }

    // Moves on by itself - a bit later for a text-mode wrong answer so it
    // has time to actually be memorised, otherwise the usual short delay.
    if (current.advanceTimer) clearTimeout(current.advanceTimer);
    var delay = (textMode && !right) ? TEXT_WRONG_ADVANCE_MS : ADVANCE_MS;
    current.advanceTimer = setTimeout(advance, delay);
  }

  function advance() {
    var learn = run.mode === "learn";
    if (learn) {
      run.seenInLearn[current.cardId] = true;
      if (current.usedHelp) {
        // Used help on this one - bring it back after just one more
        // question for a quick second look, instead of losing it
        // somewhere in the full deck for a while.
        var pos = Math.min(1, run.queue.length);
        run.queue.splice(pos, 0, current.cardId);
      } else {
        run.queue.push(current.cardId);
      }
    } else {
      if (!run.masteredThisRun[current.cardId]) {
        // not mastered yet - send it to the back of the queue
        run.queue.push(current.cardId);
      }
    }
    nextCard();
  }

  function renderDone() {
    // "True mastery" (the whole drill, all topics) is a different thing
    // from just finishing the run's own chosen subset - a student who
    // picked 10 cards from one topic has completed THIS RUN, not
    // necessarily every card in the drill. Both get reported; only the
    // whole-drill case is called "true mastery".
    var drillTotal = drill.cards.length;
    var everCount = Object.keys(everMastered).length;
    var wholeDrill = run.category === "all" && run.count >= drillTotal;
    var trueMastery = everCount >= drillTotal;
    // A run over a smaller "how many cards this run?" pick than the whole
    // topic finishes just as cheerfully as a full one - but any card left
    // outside that pick can never count until a later run actually draws
    // it, so the topic's own mastery bar can look permanently "stuck"
    // below 100% for a reason that has nothing to do with getting anything
    // wrong. Spell that out here rather than leaving it to look like a bug
    // (James: a student's completed run left their topic mastery bar
    // reading 83%, which looked broken until this was traced to exactly
    // this - the run only ever covered 5 of the topic's 6 cards).
    var topicTotal = categoryCardIds(run.category).length;
    var topicPartial = run.category !== "all" && run.count < topicTotal;
    els.stage.innerHTML =
      '<div class="done">' +
      '<div class="big">🎉</div>' +
      (trueMastery ? "<h2>True mastery!</h2>" : "<h2>Run complete!</h2>") +
      "<p>You mastered every card in <strong>" + escapeHtml(categoryLabel(run.category)) + "</strong> (" + run.count + " card" + (run.count === 1 ? "" : "s") + ") this run.</p>" +
      "<p>Overall you have mastered " + everCount + " of " + drillTotal + " cards in " + escapeHtml(drill.title) + (trueMastery ? " - every card, TRUE MASTERY." : ".") + "</p>" +
      (topicPartial
        ? '<p class="done-partial-note">This run only covered ' + run.count + " of the " + topicTotal + " cards in " +
          escapeHtml(categoryLabel(run.category)) + " - the mastery bar for this topic will stay below 100% until another run (pick \"All (" +
          topicTotal + ")\") reaches the rest.</p>"
        : "") +
      '<div class="actions" style="justify-content:center">' +
      '<button type="button" class="btn" id="again-btn">Run it again</button>' +
      '<button type="button" class="btn ghost" id="done-change-btn">Choose a different topic</button>' +
      "</div></div>";
    els.stage.querySelector("#again-btn").addEventListener("click", function () {
      run = freshRun("quiz", run.category, run.count, run.answerMode);
      persistRun();
      updateScopeLabel();
      nextCard();
    });
    els.stage.querySelector("#done-change-btn").addEventListener("click", openSetup);
    try {
      window.parent.postMessage({
        type: "BC_DRILL_PROGRESS", drillId: drillId, drillLabel: drill.title,
        cardId: "__run_complete__", cardPrompt: "Run complete",
        streak: MASTERY_STREAK, masteredThisRun: true, everMastered: trueMastery,
        attempts: 0, wrong: 0, everCount: everCount, total: drillTotal, trueMastery: trueMastery,
        summary: "Completed a run (" + categoryLabel(run.category) + ", " + run.count + " cards) - every card in this run mastered. Overall " + everCount + "/" + drillTotal + " cards ever mastered" + (trueMastery ? " · TRUE MASTERY ACHIEVED" : "") + "."
      }, "*");
    } catch (e) {}
  }

  // ============================================================
  // SETUP PANEL - pick a topic and how many cards, then start
  // ============================================================
  function populateCategorySelect(selected) {
    var options = ['<option value="all">All topics (' + drill.cards.length + ")</option>"];
    CATEGORY_ORDER.forEach(function (cat) {
      var n = categoryCardIds(cat).length;
      if (!n) return;
      options.push('<option value="' + cat + '">' + escapeHtml(CATEGORY_LABELS[cat] || cat) + " (" + n + ")</option>");
    });
    els.setupCategory.innerHTML = options.join("");
    els.setupCategory.value = selected || "all";
    if (els.setupCategory.selectedIndex === -1) els.setupCategory.value = "all";
  }
  function populateCountSelect(category, selectedCount, pool) {
    var poolSize = poolCardIds(category, pool).length;
    var choices = countChoicesFor(poolSize);
    els.setupCount.innerHTML = choices.map(function (n) {
      var label = n >= poolSize ? "All (" + poolSize + ")" : n + " cards";
      return '<option value="' + n + '">' + label + "</option>";
    }).join("");
    var wanted = selectedCount && choices.indexOf(selectedCount) !== -1 ? selectedCount : poolSize;
    els.setupCount.value = wanted;
  }
  // "Which cards?" - counts shown live so a student can see how many are
  // left. Defaults to the not-yet-mastered pool while any remain (James:
  // ignore already-mastered questions until they are all done), and to
  // everything once the whole topic is mastered. A pool with nothing in it
  // is disabled rather than hidden, so the reason it can't be picked is
  // visible ("Already mastered (0)").
  function populatePoolSelect(category, selected) {
    if (!els.setupPool) return;
    var ids = categoryCardIds(category);
    var mastered = ids.filter(function (id) { return everMastered[id]; }).length;
    var unmastered = ids.length - mastered;
    els.setupPool.innerHTML =
      '<option value="unmastered"' + (unmastered ? "" : " disabled") + ">Not yet mastered (" + unmastered + ")</option>" +
      '<option value="mastered"' + (mastered ? "" : " disabled") + ">Already mastered (" + mastered + ")</option>" +
      '<option value="all">All cards (' + ids.length + ")</option>";
    var wanted = selected || (unmastered ? "unmastered" : "all");
    if (wanted === "unmastered" && !unmastered) wanted = "all";
    if (wanted === "mastered" && !mastered) wanted = "all";
    els.setupPool.value = wanted;
  }

  // A per-topic mastery summary shown right on the setup screen, so a
  // student can see where they actually stand before picking what to work
  // on next - "5/9 mastered (59%)" for every topic in this drill, using
  // the exact same persisted `everMastered` state (localStorage, synced to
  // the server the moment a card is mastered) that the admin dashboard's
  // own per-student view is built from, so what a student sees here and
  // what a teacher sees for them should always agree. Code drills persist
  // one mastery unit per question type because three varied correct answers
  // master the type, rather than one specific authored card.
  function renderMasteryOverview() {
    if (!els.masteryOverview) return;
    var rowsHtml = CATEGORY_ORDER.filter(function (cat) { return categoryCardIds(cat).length; }).map(function (cat) {
      var ids = categoryCardIds(cat);
      var total = isCodeDrill ? 1 : ids.length;
      var masteredCount = isCodeDrill
        ? (codeCategoryEverMastered(cat) ? 1 : 0)
        : ids.filter(function (id) { return everMastered[id]; }).length;
      var pct = total ? Math.round(masteredCount / total * 100) : 0;
      var complete = total > 0 && masteredCount >= total;
      return '<div class="mastery-row">' +
        '<div class="mastery-row-top"><span class="mastery-label">' + escapeHtml(categoryLabel(cat)) + '</span>' +
        '<span class="mastery-pct">' + pct + '%</span></div>' +
        '<div class="mastery-bar"><div class="mastery-bar-fill' + (complete ? ' is-complete' : '') + '" style="width:' + pct + '%"></div></div>' +
        '<div class="mastery-sub">' + masteredCount + ' / ' + total + (isCodeDrill ? ' type mastered' : ' mastered') + (complete ? ' - complete!' : '') + '</div>' +
        '</div>';
    }).join("");
    els.masteryOverview.innerHTML = rowsHtml
      ? '<div class="mastery-overview-title">Your mastery so far</div>' +
        '<p class="mastery-overview-note">From Quiz mode only - 3 correct in a row, no help. Learn mode never counts here.</p>' +
        rowsHtml
      : "";
  }
  // Whether `r` is a saved run actually worth resuming - i.e. the student
  // has answered at least one card in it. A run that was only ever loaded
  // (never answered) is indistinguishable from starting fresh, so there is
  // nothing to offer a Continue button for.
  function runHasProgress(r) {
    if (!r || r.codeDrill) return false;
    var att = r.attempts || {};
    return Object.keys(att).some(function (id) { return att[id] > 0; });
  }
  // Shows/hides the Continue button and resume note, and relabels the
  // Start buttons to "Restart" whenever there is a matching in-progress
  // run - so a student who comes back to setup (e.g. via "Change topic /
  // cards") gets an explicit choice between Continue and Restart instead
  // of "Start" silently wiping their streaks the way it used to (James:
  // progress on binary addition was lost this way - a student needs
  // Continue or Restart, never just Start, whenever there is something to
  // lose). Only offered when the dropdowns still match the saved run's own
  // topic/count - changing either means "Start" should mean starting that
  // new selection fresh, not secretly resuming the old one.
  function refreshResumeUI() {
    if (isCodeDrill || isExamSet) return;
    var resumable = runHasProgress(run) &&
      run.category === els.setupCategory.value &&
      (!els.setupPool || (run.pool || "all") === els.setupPool.value) &&
      String(run.count) === String(els.setupCount.value);
    if (els.setupContinue) els.setupContinue.style.display = resumable ? "" : "none";
    els.setupStartLearn.textContent = resumable ? "Restart in Learn mode" : "Start in Learn mode";
    els.setupStartQuiz.textContent = resumable ? "Restart in Quiz mode" : "Start in Quiz mode";
    if (els.setupResumeNote) {
      if (resumable) {
        var doneCount = Object.keys(run.masteredThisRun || {}).length;
        els.setupResumeNote.style.display = "";
        els.setupResumeNote.textContent = "You have an unfinished " + (run.mode === "learn" ? "Learn" : "Quiz") +
          " run in progress (" + doneCount + " / " + run.count + " mastered this run so far). " +
          "Continue to pick up where you left off, or Restart to wipe it and begin again.";
      } else {
        els.setupResumeNote.style.display = "none";
      }
    }
  }
  function openSetup() {
    els.runArea.style.display = "none";
    els.setupCard.style.display = "";
    populateCategorySelect(run ? run.category : "all");
    populatePoolSelect(run ? run.category : "all", run ? run.pool : null);
    populateCountSelect(run ? run.category : "all", run ? run.count : null, els.setupPool ? els.setupPool.value : "all");
    renderMasteryOverview();
    if (isExamSet) {
      // A real exam question is a one-shot attempt, not something to
      // master via repetition - no MC/Text choice, no pool picker, no
      // resume (same reasoning as code drills: this is a one-sitting
      // activity). Learn/Quiz are both real here, but mean something
      // different: Quiz hides nothing, Learn is identical except it also
      // never disables a wrong box before its own per-part feedback
      // shows the correct value straight away (there is no putative
      // "help" to withhold for a real exam question - the point is
      // practising the actual paper, not memorising towards mastery).
      els.setupAnswerModeField.style.display = "none";
      if (els.setupPoolField) els.setupPoolField.style.display = "none";
      els.setupStartLearn.style.display = "none";
      els.setupStartQuiz.textContent = "Start";
      if (els.setupContinue) els.setupContinue.style.display = "none";
      if (els.setupResumeNote) els.setupResumeNote.style.display = "none";
      if (els.masteryOverview) els.masteryOverview.style.display = "none";
      return;
    }
    if (isCodeDrill) {
      // No MC/Text choice (there is only one way to answer a code card) and
      // no card-count limit (mastery needs every variant of a type
      // available, see startCodeRun) - but Learn mode DOES apply here now:
      // "I need help" reveals the reference pseudocode for a few seconds,
      // same idea as the MC/text engine's own help flash, just with nothing
      // to click since there's no fixed option set. Code runs are never
      // persisted (see startCodeRun), so there is nothing to resume.
      els.setupAnswerModeField.style.display = "none";
      els.setupCountField.style.display = "none";
      // Code drills persist mastery per question TYPE, not per card, so a
      // per-card mastered/unmastered pool has nothing to filter on.
      if (els.setupPoolField) els.setupPoolField.style.display = "none";
      els.setupStartLearn.style.display = "";
      els.setupStartLearn.textContent = "Start in Learn mode";
      els.setupStartQuiz.textContent = "Start in Quiz mode";
      if (els.setupContinue) els.setupContinue.style.display = "none";
      if (els.setupResumeNote) els.setupResumeNote.style.display = "none";
      return;
    }
    // "Type the answer" is the default for a student who has never chosen
    // before - James: make text mode the default over multiple choice.
    // A student who already picked one explicitly (run.answerMode set)
    // still gets their own last choice remembered, same as before.
    els.setupAnswerMode.value = run ? run.answerMode : "text";
    if (els.setupAnswerMode.selectedIndex === -1) els.setupAnswerMode.value = "text";
    refreshResumeUI();
  }
  // Resumes the saved run exactly as it was left - same queue position,
  // streaks, and mastered-this-run state - never rebuilding it via
  // freshRun(). Used both by the Continue button and at boot when a saved
  // run is found.
  function resumeRun() {
    if (!run) { openSetup(); return; }
    els.setupCard.style.display = "none";
    els.runArea.style.display = "";
    applyModeUI(run.mode);
    updateScopeLabel();
    nextCard();
  }
  function startRun(mode) {
    var category = els.setupCategory.value;
    var count = Number(els.setupCount.value) || null;
    if (isCodeDrill) { startCodeRun(category, mode); return; }
    if (isExamSet) {
      startExamRun(category, count);
      els.setupCard.style.display = "none";
      els.runArea.style.display = "";
      els.noticeLearn.style.display = "none";
      els.noticeQuiz.style.display = "none";
      if (els.noticeCode) els.noticeCode.style.display = "none";
      els.noticeExam.style.display = "";
      els.progress.style.display = "none";
      els.modeLearn.style.display = "none";
      els.modeQuiz.style.display = "none";
      nextExamCard();
      return;
    }
    var answerMode = els.setupAnswerMode.value;
    var poolChoice = els.setupPool ? els.setupPool.value : "all";
    run = freshRun(mode, category, count, answerMode, poolChoice);
    persistRun();
    els.setupCard.style.display = "none";
    els.runArea.style.display = "";
    applyModeUI(mode);
    updateScopeLabel();
    nextCard();
  }

  // ============================================================
  // CODE DRILL (type: 'code' cards only) - James: "Code and regular
  // drills should be separate options" and "mastery should be based on
  // types of questions... three of the same TYPE of question correct,
  // rather than three of the exact same question." So this whole section
  // is a parallel, self-contained run loop next to the MC/text one above,
  // not a branch inside it - it tracks a streak per CATEGORY (a "type" of
  // question, e.g. "Writing an Assignment") instead of per card, and each
  // turn draws a random card from whichever categories still need work,
  // so getting three DIFFERENT instances of the same type right in a row
  // masters that type, never the same literal question three times.
  // Never persisted across reloads (unlike the MC/text runs above) -
  // writing code is a one-sitting activity, not something to resume days
  // later, so there is no localStorage save here at all.
  function startCodeRun(category, mode) {
    // Deliberately ignores the card-count picker (hidden for code drills
    // anyway): a type can only be mastered if every one of its authored
    // variants is available to draw from, so the run always includes the
    // FULL set of cards in the chosen topic, never a trimmed sample.
    // Learn mode never touches categoryStreak/masteredCategories at all
    // (see submitCodeAnswer) - nextCodeCard()'s existing "skip mastered
    // categories" filter then naturally becomes "every category stays in
    // rotation forever", which is exactly Learn mode's unlimited-practice
    // behaviour, with no extra branching needed there.
    mode = mode === "learn" ? "learn" : "quiz";
    var pool = categoryCardIds(category);
    run = {
      codeDrill: true,
      mode: mode,
      category: category || "all",
      count: pool.length,
      pool: pool,
      categoryStreak: {},     // category -> consecutive correct (quiz mode only)
      masteredCategories: {}, // category -> true once it reaches CODE_MASTERY_STREAK (quiz mode only)
      lastCardId: null
    };
    els.setupCard.style.display = "none";
    els.runArea.style.display = "";
    els.modebar.style.display = "none";
    // Reuses the regular engine's own Learn-mode notice ("nothing is
    // recorded here... press I need help") - it's generic enough to apply
    // here too, so no code-specific Learn copy was needed.
    els.noticeLearn.style.display = mode === "learn" ? "" : "none";
    els.noticeQuiz.style.display = "none";
    els.noticeCode.style.display = mode === "quiz" ? "" : "none";
    els.progress.style.display = mode === "quiz" ? "flex" : "none";
    updateScopeLabel();
    if (mode === "quiz") updateCodeProgress();
    nextCodeCard();
  }

  // All distinct categories actually present in this run's pool, so the
  // "types mastered" count only ever counts types that exist here.
  function codeRunCategories() {
    var seen = {};
    run.pool.forEach(function (id) { seen[cardsById[id].category] = true; });
    return Object.keys(seen);
  }

  function updateCodeProgress() {
    var cats = codeRunCategories();
    var masteredCount = cats.filter(function (c) { return run.masteredCategories[c]; }).length;
    els.progressLabel.textContent = masteredCount + " / " + cats.length + " types mastered";
    els.progressFill.style.width = (cats.length ? Math.round(masteredCount / cats.length * 100) : 0) + "%";
  }

  // A card's `setup` is regenerated on every draw so a student cannot just
  // memorise/hardcode the one known right-hand number instead of writing
  // real logic that actually uses the given variables - confirmed as a
  // real gaming risk before this existed (e.g. "Total <- 7" alone, using
  // neither A nor B, always graded correct for code-assign-1's fixed
  // setup). Stays in the same rough range as the card's own authored
  // example and is always at least 1, never 0 - the only setup value ever
  // used as a divisor (Count, in code-assign-4) is safe under that same
  // floor, so no card-specific handling is needed.
  function randomizeSetup(card) {
    var base = card.setup || {};
    var out = {};
    Object.keys(base).forEach(function (k) {
      var orig = base[k];
      if (typeof orig !== "number") { out[k] = orig; return; }
      var ceiling = Math.max(orig * 2, 10);
      out[k] = 1 + Math.floor(Math.random() * ceiling);
    });
    return out;
  }

  function nextCodeCard() {
    if (current && current.advanceTimer) clearTimeout(current.advanceTimer);
    var byCategory = {};
    run.pool.forEach(function (id) {
      var cat = cardsById[id].category;
      if (run.masteredCategories[cat]) return;
      (byCategory[cat] = byCategory[cat] || []).push(id);
    });
    var cats = Object.keys(byCategory);
    if (!cats.length) { renderCodeDone(); return; }
    var cat = cats[Math.floor(Math.random() * cats.length)];
    var candidates = byCategory[cat];
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    // A category with more than one card avoids showing the exact same
    // one twice running, for variety - not a correctness requirement,
    // just a nicer feel.
    if (candidates.length > 1 && pick === run.lastCardId) {
      pick = candidates[Math.floor(Math.random() * candidates.length)];
    }
    run.lastCardId = pick;
    current = { cardId: pick, checked: false, setup: randomizeSetup(cardsById[pick]) };
    renderCodeCard();
  }

  function codeGivenHtml(vars) {
    vars = vars || {};
    var parts = Object.keys(vars).map(function (k) { return k + " ← " + JSON.stringify(vars[k]).replace(/"/g, ""); });
    return parts.length ? "Given: " + parts.join(", ") : "";
  }

  function renderCodeCard() {
    var card = cardsById[current.cardId];
    var learn = run.mode === "learn";
    // Streak dots track progress toward MASTERY, which only ever happens
    // in Quiz mode (see submitCodeAnswer) - showing them in Learn mode
    // would just be a permanent, meaningless "0/3".
    var streakHtml = "";
    if (!learn) {
      var s = run.categoryStreak[card.category] || 0;
      var dots = "";
      for (var i = 0; i < CODE_MASTERY_STREAK; i++) dots += '<i class="' + (i < s ? "on" : "") + '"></i>';
      streakHtml = '<span class="streakdots" title="Streak toward mastering this type of question">' + dots + "</span>";
    }
    var given = codeGivenHtml(current.setup);
    var promptHasCode = card.prompt.indexOf("\n") !== -1;

    els.stage.innerHTML =
      '<div class="card">' +
      flowchartCardExtraHtml(card) +
      '<p class="prompt' + (promptHasCode ? " has-code" : "") + '">' + escapeHtml(card.prompt) + streakHtml + "</p>" +
      (given ? '<div class="code-given">' + escapeHtml(given) + "</div>" : "") +
      '<textarea class="code-textarea" id="code-input" spellcheck="false" autocomplete="off" placeholder="Type your pseudocode here..."></textarea>' +
      (learn ? '<div class="code-help-box" id="code-help-box"></div>' : "") +
      '<div id="code-result"></div>' +
      '<div class="actions">' +
      '<button type="button" class="btn" id="code-check-btn">Run and check</button>' +
      (learn ? '<button type="button" class="btn ghost" id="code-help-btn">I need help</button>' : "") +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn ghost" id="restart-btn" title="Wipe this run and start it again">Restart run</button>' +
      "</div></div>";

    var input = document.getElementById("code-input");
    input.focus();
    document.getElementById("code-check-btn").addEventListener("click", submitCodeAnswer);
    var helpBtn = document.getElementById("code-help-btn");
    if (helpBtn) helpBtn.addEventListener("click", onCodeHelp);
    els.stage.querySelector("#restart-btn").addEventListener("click", function () {
      startCodeRun(run.category, run.mode);
      toast("Run restarted.");
    });
  }

  function onCodeHelp() {
    // Learn mode's only reveal, same rule as everywhere else in Drills -
    // the answer is never shown unless a student explicitly asks for it,
    // and it hides itself again rather than staying up. Shows the
    // reference PSEUDOCODE, not just its result, since seeing the actual
    // working is the point of asking for help on a code card.
    var card = cardsById[current.cardId];
    var box = document.getElementById("code-help-box");
    if (!box) return;
    box.innerHTML = "<pre>" + escapeHtml(card.reference) + "</pre>";
    box.classList.add("show");
    if (current.helpTimer) clearTimeout(current.helpTimer);
    current.helpTimer = setTimeout(function () {
      if (current.checked) return;
      box.classList.remove("show");
    }, CODE_HELP_MS);
  }

  function formatVarsForDisplay(vars, names) {
    return names.map(function (n) { return n + " = " + JSON.stringify(vars[n]); }).join(", ");
  }

  // Reports one stable record per question type. This keeps the student bars
  // and teacher dashboard on the same four mastery units instead of treating
  // the sixteen authored variants as sixteen separately mastered questions.
  function reportCode(card, right) {
    var cat = card.category;
    var streak = run.categoryStreak[cat] || 0;
    var masteredThisRun = !!run.masteredCategories[cat];
    var masteredEver = codeCategoryEverMastered(cat);
    var allCats = allCodeCategories();
    var catsTotal = allCats.length;
    var catsMastered = allCats.filter(codeCategoryEverMastered).length;
    var stat = codeStats[cat] || { attempts: 0, wrong: 0 };
    var summary = "Category: " + categoryLabel(cat) + " · Code · streak " + streak + "/" + CODE_MASTERY_STREAK +
      " · " + stat.attempts + " attempt" + (stat.attempts === 1 ? "" : "s") + " (" + (stat.attempts - stat.wrong) + " right, " + stat.wrong + " wrong)" +
      " · type mastered this run: " + (masteredThisRun ? "yes" : "no") +
      " · ever mastered: " + (masteredEver ? "YES" : "no") +
      " · overall " + catsMastered + "/" + catsTotal + " types ever mastered" +
      (catsMastered === catsTotal ? " · TRUE MASTERY ACHIEVED" : "");
    try {
      window.parent.postMessage({
        type: "BC_DRILL_PROGRESS",
        drillId: drillId,
        drillLabel: drill.title,
        cardId: "__code_category__" + cat,
        cardPrompt: categoryLabel(cat),
        category: cat,
        categoryLabel: categoryLabel(cat),
        streak: streak,
        masteredThisRun: masteredThisRun,
        everMastered: masteredEver,
        attempts: stat.attempts,
        wrong: stat.wrong,
        everCount: catsMastered,
        total: catsTotal,
        trueMastery: catsMastered === catsTotal,
        summary: summary
      }, "*");
    } catch (e) {}
  }

  function submitCodeAnswer() {
    if (current.checked) return;
    var card = cardsById[current.cardId];
    var input = document.getElementById("code-input");
    var code = input.value;
    if (!code.trim()) { toast("Write some pseudocode first."); return; }

    // Uses THIS DRAW's randomised setup (current.setup), not the card's own
    // fixed template - see randomizeSetup(). Grading student code and the
    // reference solution against the same freshly-drawn values each time
    // is what makes hardcoding the answer stop working.
    var setupVars = current.setup || card.setup || {};
    var studentResult = PseudocodeEngine.runPseudocode(code, setupVars);
    var resultEl = document.getElementById("code-result");
    var right = false;
    var message = "";

    if (studentResult.error) {
      message = "Line " + studentResult.error.line + ": " + studentResult.error.message;
    } else {
      var referenceResult = PseudocodeEngine.runPseudocode(card.reference, setupVars);
      var checkVars = card.checkVars || [];
      var varsMatch = checkVars.every(function (v) { return studentResult.vars[v] === referenceResult.vars[v]; });
      var outputsMatch = !card.checkOutput || JSON.stringify(studentResult.outputs) === JSON.stringify(referenceResult.outputs);
      right = varsMatch && outputsMatch;
      if (right) {
        message = "Correct.";
      } else {
        var bits = [];
        if (checkVars.length) bits.push("Your code left " + formatVarsForDisplay(studentResult.vars, checkVars) + ".");
        if (card.checkOutput) bits.push("Your OUTPUT was " + JSON.stringify(studentResult.outputs) + ".");
        message = "Not quite. " + bits.join(" ") + " Check your working and try again.";
      }
    }

    current.checked = true;
    input.disabled = true;
    document.getElementById("code-check-btn").disabled = true;
    if (current.helpTimer) clearTimeout(current.helpTimer);
    var helpBoxEl = document.getElementById("code-help-box");
    if (helpBoxEl) helpBoxEl.classList.remove("show");
    var helpBtnEl = document.getElementById("code-help-btn");
    if (helpBtnEl) helpBtnEl.disabled = true;
    resultEl.className = "code-result " + (right ? "ok" : "no");
    resultEl.innerHTML = escapeHtml(message);

    // Mastery, admin reporting, and the progress bar are all a Quiz-mode
    // concept, exactly like the regular MC/text engine - Learn mode here
    // "records nothing" too, same rule stated in noticeLearn's own text.
    var cat = card.category;
    if (run.mode === "quiz") {
      var stat = codeStats[cat] || { attempts: 0, wrong: 0 };
      stat.attempts++;
      if (!right) stat.wrong++;
      codeStats[cat] = stat;
      if (right) {
        run.categoryStreak[cat] = (run.categoryStreak[cat] || 0) + 1;
        if (run.categoryStreak[cat] >= CODE_MASTERY_STREAK) {
          run.masteredCategories[cat] = true;
          everMastered[codeMasteryKey(cat)] = true;
          saveEver(everMastered);
          resultEl.innerHTML = "Correct! " + escapeHtml(categoryLabel(cat)) + " mastered for this run - three right in a row.";
        }
      } else {
        run.categoryStreak[cat] = 0;
      }
      saveCodeStats();
      reportCode(card, right);
      updateCodeProgress();
    }

    // Moves on by itself, same as every other card type in this app - no
    // manual click needed (James: this used to require clicking "Next
    // question" every time). A wrong answer lingers longer since its
    // message has more to read (what the student's code actually left
    // behind), same idea as TEXT_WRONG_ADVANCE_MS elsewhere. The button
    // stays only as a "don't want to wait" skip, not a requirement.
    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn";
    nextBtn.textContent = "Next question";
    nextBtn.style.marginTop = "10px";
    nextBtn.addEventListener("click", function () {
      if (current.advanceTimer) clearTimeout(current.advanceTimer);
      nextCodeCard();
    });
    resultEl.appendChild(document.createElement("br"));
    resultEl.appendChild(nextBtn);

    if (current.advanceTimer) clearTimeout(current.advanceTimer);
    current.advanceTimer = setTimeout(nextCodeCard, right ? ADVANCE_MS : TEXT_WRONG_ADVANCE_MS);
  }

  function renderCodeDone() {
    els.stage.innerHTML =
      '<div class="done"><div class="big">🎉</div><h2>Every type mastered!</h2>' +
      "<p>You wrote correct code for every type of question, three times in a row, for " + escapeHtml(categoryLabel(run.category)) + ".</p>" +
      '<div class="actions" style="justify-content:center">' +
      '<button type="button" class="btn" id="code-again-btn">Run it again</button>' +
      '<button type="button" class="btn ghost" id="code-change-btn">Choose a different topic</button>' +
      "</div></div>";
    document.getElementById("code-again-btn").addEventListener("click", function () { startCodeRun(run.category, run.mode); });
    document.getElementById("code-change-btn").addEventListener("click", openSetup);
  }


  // ============================================================
  // EXAM QUESTIONS (drill.isExamSet cards only) - James: "an Exam
  // Questions tab next to the Drills tab, drill-style attempts of real
  // exam questions, multi-mark questions split into separate answer
  // boxes marked individually, never multiple marks for the same
  // point." A parallel, self-contained run loop next to the MC/text and
  // code-drill ones above, for the same reason code drills got their
  // own loop: the shape of a card (one real question, several DISTINCT
  // marking points, each its own box) doesn't fit the flashcard
  // MC/text engine, and "mastery via 3-in-a-row" doesn't make sense for
  // a one-shot real exam question either - a real paper question is
  // attempted once per sitting, not drilled to a streak. Never
  // persisted across reloads, same "one-sitting activity" reasoning as
  // code drills.
  //
  // Card shape: { id, category, source, marks, stem, parts: [{ label,
  // correctAnswer, acceptedAnswers? }] } - every part is its OWN distinct fact from the
  // real question (never the same point asked twice), each worth 1
  // mark unless the card's own `marks` and part count genuinely imply
  // otherwise (all real cards shipped with this feature are 1 mark per
  // part, matching how they're actually marked in the original exam).
  function startExamRun(category, count) {
    var ids = shuffle(categoryCardIds(category).slice());
    if (count && count < ids.length) ids = ids.slice(0, count);
    run = {
      examSet: true,
      category: category,
      queue: ids,
      totalCards: ids.length,
      cardIndex: 0,
      scoreMarks: 0,
      totalMarks: 0
    };
  }

  function examNormalize(v) {
    return String(v == null ? "" : v).trim().toUpperCase();
  }

  function nextExamCard() {
    if (current && current.advanceTimer) clearTimeout(current.advanceTimer);
    if (!run.queue.length) { renderExamDone(); return; }
    var cardId = run.queue.shift();
    run.cardIndex++;
    current = { cardId: cardId, checked: false };
    renderExamCard();
  }

  function examPartHtml(part, idx) {
    return '<div class="exam-part" data-part-idx="' + idx + '">' +
      '<label class="exam-part-label" for="exam-part-input-' + idx + '">' + escapeHtml(part.label) + "</label>" +
      '<input type="text" class="exam-part-input" id="exam-part-input-' + idx + '" autocomplete="off" spellcheck="false">' +
      '<div class="exam-part-feedback"></div>' +
      "</div>";
  }

  function renderExamCard() {
    var card = cardsById[current.cardId];
    els.stage.innerHTML =
      '<div class="card exam-card">' +
      '<p class="exam-progress">Question ' + run.cardIndex + " of " + run.totalCards + "</p>" +
      '<p class="prompt">' + escapeHtml(card.stem) + "</p>" +
      '<div class="exam-parts">' + card.parts.map(examPartHtml).join("") + "</div>" +
      '<p class="exam-source">' + escapeHtml(card.source) + "</p>" +
      '<div id="exam-summary" class="exam-card-summary"></div>' +
      '<div class="actions">' +
      '<button type="button" class="btn" id="exam-check-btn">Check answers</button>' +
      '<span class="spacer"></span>' +
      '<button type="button" class="btn ghost" id="exam-restart-btn" title="Wipe this run and start it again">Restart run</button>' +
      "</div></div>";
    var firstInput = els.stage.querySelector(".exam-part-input");
    if (firstInput) firstInput.focus();
    document.getElementById("exam-check-btn").addEventListener("click", submitExamCard);
    els.stage.querySelector("#exam-restart-btn").addEventListener("click", function () {
      startExamRun(run.category, run.totalCards);
      nextExamCard();
      toast("Run restarted.");
    });
  }

  function reportExamCard(card, marksEarned, marksTotal) {
    var summary = "Category: " + categoryLabel(card.category) + " · Exam question · " +
      marksEarned + " / " + marksTotal + " marks · " + card.source;
    try {
      window.parent.postMessage({
        type: "BC_DRILL_PROGRESS",
        drillId: drillId,
        drillLabel: drill.title,
        cardId: card.id,
        cardPrompt: card.stem,
        category: card.category,
        categoryLabel: categoryLabel(card.category),
        correct: marksEarned === marksTotal,
        marksEarned: marksEarned,
        marksTotal: marksTotal,
        isExamSet: true,
        summary: summary
      }, "*");
    } catch (e) {}
  }

  function submitExamCard() {
    if (current.checked) return;
    var card = cardsById[current.cardId];
    var allOk = true;
    var marksEarned = 0;
    card.parts.forEach(function (part, idx) {
      var input = document.getElementById("exam-part-input-" + idx);
      var raw = input ? input.value : "";
      var accepted = [part.correctAnswer].concat(part.acceptedAnswers || []);
      var ok = accepted.some(function (answer) { return examNormalize(raw) === examNormalize(answer); });
      if (ok) marksEarned++; else allOk = false;
      var partEl = els.stage.querySelector('.exam-part[data-part-idx="' + idx + '"]');
      partEl.classList.toggle("is-correct", ok);
      partEl.classList.toggle("is-wrong", !ok);
      if (input) input.disabled = true;
      var fb = partEl.querySelector(".exam-part-feedback");
      fb.textContent = ok ? "Correct." : "Correct answer: " + part.correctAnswer;
    });
    current.checked = true;
    run.scoreMarks += marksEarned;
    run.totalMarks += card.parts.length;
    reportExamCard(card, marksEarned, card.parts.length);
    var summaryEl = document.getElementById("exam-summary");
    summaryEl.innerHTML = '<p class="exam-card-score">' + marksEarned + " / " + card.parts.length + " marks" +
      (allOk ? " - full marks." : "") + "</p>";
    document.getElementById("exam-check-btn").style.display = "none";
    current.advanceTimer = setTimeout(nextExamCard, allOk ? 1200 : 3200);
  }

  function renderExamDone() {
    var pct = run.totalMarks ? Math.round((run.scoreMarks / run.totalMarks) * 100) : 0;
    els.stage.innerHTML =
      '<div class="card">' +
      '<p class="prompt">Run complete</p>' +
      '<p class="exam-final-score">' + run.scoreMarks + " / " + run.totalMarks + " marks (" + pct + "%)</p>" +
      '<div class="actions">' +
      '<button type="button" class="btn" id="exam-again-btn">Do it again</button>' +
      '<button type="button" class="btn ghost" id="exam-change-btn">Choose a different topic</button>' +
      "</div></div>";
    document.getElementById("exam-again-btn").addEventListener("click", function () {
      startExamRun(run.category, run.totalCards);
      nextExamCard();
    });
    document.getElementById("exam-change-btn").addEventListener("click", openSetup);
  }

  // ============================================================
  // BOOT
  // ============================================================
  els.setupCategory.addEventListener("change", function () {
    populatePoolSelect(els.setupCategory.value, els.setupPool ? els.setupPool.value : null);
    populateCountSelect(els.setupCategory.value, null, els.setupPool ? els.setupPool.value : "all");
    refreshResumeUI();
  });
  if (els.setupPool) els.setupPool.addEventListener("change", function () {
    populateCountSelect(els.setupCategory.value, null, els.setupPool.value);
    refreshResumeUI();
  });
  if (els.setupCount) els.setupCount.addEventListener("change", refreshResumeUI);
  els.setupStartLearn.addEventListener("click", function () { startRun("learn"); });
  els.setupStartQuiz.addEventListener("click", function () { startRun("quiz"); });
  if (els.setupContinue) els.setupContinue.addEventListener("click", resumeRun);
  els.changeSelectionBtn.addEventListener("click", openSetup);
  els.modeLearn.addEventListener("click", function () { setMode("learn"); });
  els.modeQuiz.addEventListener("click", function () { setMode("quiz"); });

  // When embedded in a lesson slide, tell the parent how tall the page is
  // whenever that changes (setup screen -> card -> feedback -> done screen
  // are all different heights). Same TT_CONTENT_HEIGHT message shape the
  // lesson's initEmbeddedAppStep already listens for from Trace Tables, so
  // nothing new is needed on the lesson side to size this iframe.
  if (isEmbedded) {
    var lastEmbedHeight = 0;
    var embedWrap = document.querySelector(".wrap") || document.body;
    var postEmbedHeight = function () {
      // Measure the content container, not the document: both
      // documentElement.scrollHeight and (in Chrome) body.scrollHeight are
      // clamped to the viewport when the content is shorter than it, so
      // they never changed between the setup screen and a card and every
      // post after the first was suppressed by the "same as last" check.
      var rect = embedWrap.getBoundingClientRect();
      var h = Math.ceil(rect.height + rect.top + window.scrollY);
      if (h === lastEmbedHeight) return;
      lastEmbedHeight = h;
      try { window.parent.postMessage({ type: "TT_CONTENT_HEIGHT", height: h }, "*"); } catch (e) {}
    };
    if (window.ResizeObserver) new ResizeObserver(postEmbedHeight).observe(embedWrap);
    else setInterval(postEmbedHeight, 500);
    window.addEventListener("load", postEmbedHeight);
    postEmbedHeight();
  }

  var restored = loadRun();
  if (restored) {
    run = restored;
    resumeRun();
  } else {
    openSetup();
  }
})();
