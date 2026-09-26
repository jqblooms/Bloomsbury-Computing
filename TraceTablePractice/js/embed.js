// Progress reporting to the site, the teacher auto-fill, and the embed API for lesson steps.
// ======================================================
// PROGRESS REPORTING (to the Bloomsbury Computing admin panel)
// ======================================================
// Reports progress up to the parent, which persists it to the Progress
// sheet, so a teacher sees it live in the admin dashboard instead of a
// student having to generate and hand in a PDF. Same postToParent pattern
// as Binary Blitz / Python Game.
function postToParent(payload) {
  if (window.parent !== window) {
    window.parent.postMessage(payload, '*');
  }
}

function reportPracticeProgress(id, title, isCorrect) {
  postToParent({ type: 'TT_PROGRESS', kind: 'practice', practiceId: id, title: title, correct: isCorrect });
}

function reportGeneratorProgress() {
  postToParent({ type: 'TT_PROGRESS', kind: 'generator', score: genStats.score, maxStreak: genStats.maxStreak });
}

// ======================================================
// HIDDEN DEVELOPER AUTO-FILL (SHIFT + DEV)
// ======================================================
let devCodeBuffer = "";
window.addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key.length === 1) {
      devCodeBuffer += e.key.toUpperCase();
      if (devCodeBuffer.endsWith("DEV")) {
          executeDevAutoFill();
          devCodeBuffer = "";
      }
  } else if (!e.shiftKey) {
      devCodeBuffer = "";
  }
});

function executeDevAutoFill() {
  if (document.getElementById('page-prac').classList.contains('active')) {
      for (let i = 0; i <= 6; i++) {
          if (document.getElementById(`prac${i}-area`).classList.contains('active')) {
              devFillEntry(`prac${i}`, pracData[i]);
              checkPractice(i);
              return;
          }
      }
  }
  else if (document.getElementById('page-gen').classList.contains('active') && genQuestion) {
      devFillEntry('gen', genQuestion);
      checkGeneratedPractice();
  }
}

function devFillEntry(prefix, data) {
  const view = codeView(data);
  if (currentPracticeMode === 'code') {
    const textarea = document.getElementById(`${prefix}-textarea`);
    if (textarea) {
      textarea.value = view.code.join('\n');
      syncEditorGutter(prefix);
      saveCodeAnswer(prefix, textarea.value);
    }
  } else {
    devFillTable(prefix, data.cols, view.answers);
  }
}

function devFillTable(prefix, cols, answers) {
  const totalRows = answers.length + EXTRA_ROWS;
  for(let r = 0; r < totalRows; r++) {
      const row = answers[r] || {};
      cols.forEach(k => {
          const td = document.getElementById(`${prefix}-r${r}-${k}`);
          if (td && td.querySelector('input')) {
              td.querySelector('input').value = row[k] !== undefined ? row[k] : '';
          }
      });
  }
}

// ======================================================
// EMBED API (for embedding a single algorithm inside a Bloomsbury
// Computing lesson step, instead of the whole app). Two ways to select
// what shows: a built-in algorithm by view+index (`?embed=1&view=
// walkthrough&idx=0`, same indices the Walkthrough/Practice picker
// buttons use), or a fully custom algorithm posted from the parent lesson
// after the iframe loads. Same postMessage-bridge shape as PyBot's own
// embed API (`initEmbedListener()` in pybot.html) - kept deliberately
// similar so a lesson author already familiar with one recognises the
// other.
// ======================================================
const CUSTOM_WALK_IDX = 100;
const CUSTOM_PRAC_IDX = 100;

// The Practice tab has one hand-authored `<div id="pracN-area">` per
// built-in algorithm (see the HTML above); a custom algorithm has no such
// markup to reuse, so this builds one on demand, in the exact shape
// `renderPracEntry`/`checkPractice` already expect. Only ever runs once
// per page load (a second custom algorithm on the same embed reuses the
// same slot and DOM), so this never grows unbounded.
function ensurePracArea(idx) {
  if (document.getElementById(`prac${idx}-area`)) return;
  const page = document.getElementById('page-prac');
  const area = document.createElement('div');
  area.id = `prac${idx}-area`;
  area.className = 'prac-area';
  area.innerHTML =
    `<div class="grid"><div>` +
    `<div id="prac${idx}-context" class="context-box"></div>` +
    `<div id="prac${idx}-code" class="code-container"></div>` +
    `</div><div>` +
    `<div id="prac${idx}-table-wrap"></div>` +
    `<button class="btn btn-primary mt-4 check-btn" onclick="checkPractice(${idx})">Check Answers</button>` +
    `<div id="prac${idx}-result" class="result-badge"></div>` +
    `</div></div>`;
  page.appendChild(area);
}

// The lesson iframe is a fixed CSS height that this page cannot see or set
// itself, so instead of guessing one height for every algorithm (a 3-row
// sequence and a 13-row practice table need very different amounts), this
// reports the real content height once and the parent resizes the iframe
// to match.
//
// Deliberately measured ONCE per algorithm, not kept live with an ongoing
// observer: a lesson slide must not visibly change size while a student is
// using it (see measureFinalWalkHeight/measureFinalPracHeight below,
// which measure against the *finished* state of the widget, not whatever
// happens to be on screen the instant this runs), so nothing here ever
// reports again after that single measurement - not stepping through a
// walkthrough, not pressing Check Answers, nothing. The embed's own
// language/mode toggles are hidden (see `.header-left`/`.language-picker`
// in the CSS above) specifically so nothing a student can do inside the
// embed could change its height after this point either.
function reportEmbedHeight() {
  if (window.parent === window) return;
  window.parent.postMessage({ type: 'TT_CONTENT_HEIGHT', height: document.body.scrollHeight }, '*');
}

// Space Mono/DM Sans (this page's whole font stack) load from Google
// Fonts and can still be downloading the instant a step first selects
// its algorithm. Measuring before they finish reports a height based on
// the browser's fallback font, not the real one - found live: a real
// lesson slide with content cut off, the monospace code lines had
// re-wrapped taller once the real font swapped in, well after the
// (deliberately one-shot, see reportEmbedHeight's own comment above)
// height report had already fired and nothing was watching any more to
// catch it.
//
// document.fonts.ready alone was not enough - confirmed live, still
// growing a second later even after waiting on it. The Google Fonts
// <link> above uses `display=swap`, and .ready only knows to wait for
// @font-face rules the CSSOM has already discovered; if that stylesheet
// itself is still loading (its own network request, separate from the
// font files) when .ready is checked, there is nothing registered yet
// for it to wait for, so it resolves as a same-tick no-op instead of
// actually waiting. Two attempts: the fast path (fonts.ready + two
// animation frames, usually enough on its own) and an unconditional
// safety-net re-run ~900ms later that catches a slower download. Both
// only ever run in the first second or so after an algorithm is first
// selected, before a student could plausibly have started interacting
// with the widget, so this doesn't reopen the door to resizing mid-use.
function afterFontsSettle(fn) {
  var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  ready.then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(fn); });
  });
  setTimeout(fn, 900);
}

// Walkthrough tables build up one row at a time as the student presses
// Step Forward - measuring right now would report whatever's on screen
// at this instant (often nothing yet), not the full size the table will
// reach once fully stepped through. Fills every row in temporarily, off
// the back of the same call, measures, then puts the empty table back
// exactly as resetWalk() left it, so the walkthrough still starts empty
// for the student.
function measureFinalWalkHeight(idx) {
  afterFontsSettle(function () {
    const algo = walkData[idx];
    const view = codeView(algo);
    const tbody = document.getElementById('walk-tbody');
    if (!tbody) { reportEmbedHeight(); return; }
    const saved = tbody.innerHTML;
    tbody.innerHTML = view.answers.map(row =>
      `<tr>${algo.cols.map(c => `<td>${row[c] || ''}</td>`).join('')}</tr>`
    ).join('');
    reportEmbedHeight();
    tbody.innerHTML = saved;
  });
}

// Practice mode's table is already full-size the moment it renders
// (EXTRA_ROWS included) - the only part not yet on screen is the Check
// Answers result badge, so this reserves room for that too, the same
// "measure the finished state" idea as the walkthrough version above.
function measureFinalPracHeight(idx) {
  afterFontsSettle(function () {
    const badge = document.getElementById(`prac${idx}-result`);
    if (!badge) { reportEmbedHeight(); return; }
    const savedClass = badge.className;
    const savedText = badge.textContent;
    badge.className = 'result-badge show pass';
    badge.textContent = '✓ Perfect! 0/0 correct.';
    reportEmbedHeight();
    badge.className = savedClass;
    badge.textContent = savedText;
  });
}

function selectBuiltInEmbed(view, idx) {
  if (view === 'practice') {
    showPage('prac', document.getElementById('tab-prac'));
    showPrac(idx, null);
    measureFinalPracHeight(idx);
  } else {
    showPage('walk', document.getElementById('tab-walk'));
    selectWalkAlgo(idx, null);
    measureFinalWalkHeight(idx);
  }
}

// `algorithm` matches the same {context, code, cols, answers} shape every
// built-in algorithm above already uses (see e.g. `algo0Cols`/
// `algo0Answers`) - there is no code interpreter here deriving a trace
// automatically, so the parent lesson supplies the fully worked-out
// answer key, not just the code.
function loadCustomAlgorithm(payload) {
  const algorithm = payload && payload.algorithm;
  if (!algorithm || !Array.isArray(algorithm.code) || !Array.isArray(algorithm.cols) || !Array.isArray(algorithm.answers)) return;
  const entry = {
    context: algorithm.context || '',
    code: algorithm.code,
    cols: algorithm.cols,
    answers: algorithm.answers,
    title: algorithm.title || 'Custom algorithm'
  };
  if (payload.view === 'practice') {
    pracData[CUSTOM_PRAC_IDX] = entry;
    ensurePracArea(CUSTOM_PRAC_IDX);
    renderPracEntry(`prac${CUSTOM_PRAC_IDX}`, entry);
    showPage('prac', document.getElementById('tab-prac'));
    showPrac(CUSTOM_PRAC_IDX, null);
    measureFinalPracHeight(CUSTOM_PRAC_IDX);
  } else {
    walkData[CUSTOM_WALK_IDX] = entry;
    showPage('walk', document.getElementById('tab-walk'));
    selectWalkAlgo(CUSTOM_WALK_IDX, null);
    measureFinalWalkHeight(CUSTOM_WALK_IDX);
  }
}

function initEmbed() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('embed') !== '1') return;
  document.body.classList.add('tt-embed');

  // Default code language is otherwise whatever this browser last used
  // across the whole site (or Python, the very first time) - wrong for a
  // lesson written entirely in Cambridge pseudocode, so the embedding
  // lesson sets it explicitly instead of inheriting stale/default state.
  const lang = params.get('lang');
  if (lang === 'cambridge' || lang === 'python') setCodeLanguage(lang);

  // A lesson step opts a specific embed into Support Mode by adding
  // `support=1` to its embedQuery - there's no toggle to find inside an
  // embed (the whole header, this button included, is hidden by
  // body.tt-embed above), so this is the only way in. Set before
  // selectBuiltInEmbed/loadCustomAlgorithm render anything below, since
  // buildStudentTableHtml reads isSupportMode at render time.
  if (params.get('support') === '1') { supportForcedByLesson = true; isSupportMode = true; }

  // Force trace mode regardless of this browser's last-used state: every
  // embed is built around one specific task (trace a table), and the
  // "Write the code" mode is a different exercise with its own editor UI
  // that (found live, from a real Y11 lesson) does not finish
  // initialising correctly the first time a step lands in that mode
  // without a language/mode switch happening afterwards to trigger a
  // re-render. Simplest real fix: an embed never starts in that mode, and
  // - since the toggle is hidden (see `.header-left`/`.language-picker`
  // in the CSS above) - a student can never switch into it either, so the
  // broken path is simply unreachable here rather than patched around.
  setPracticeMode('trace');

  const view = params.get('view') === 'practice' ? 'practice' : 'walkthrough';
  const idxParam = params.get('idx');
  if (idxParam !== null) selectBuiltInEmbed(view, parseInt(idxParam, 10));

  window.addEventListener('message', (e) => {
    const msg = e.data || {};
    if (msg.type === 'TT_LOAD_ALGORITHM') loadCustomAlgorithm(msg.data || {});
  });
}
