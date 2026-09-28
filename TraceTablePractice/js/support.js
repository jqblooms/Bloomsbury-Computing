// Support mode for Fill the table: faded answers under each cell, fading as tables come out right.
// ======================================================
// SUPPORT MODE (Fill the Table only)
// ======================================================
// Mirrors PseudocodeBlitz's own Support Mode: a greyed-out hint of the
// correct answer sits under each cell, colored per-character against
// what the student has actually typed (green = matches, red = doesn't,
// grey = not typed yet - never colored ahead of what's really there,
// same fix that PseudocodeBlitz's own hint highlighter needed live). As
// a student strings together correct Check Answers presses, less of the
// remaining hints are shown, fading the scaffolding out rather than
// pulling it away all at once. "Write the code" mode is deliberately
// left alone - it already has its own operator-hint panel
// (buildCodeHintsHtml above), a different kind of scaffold for a
// different exercise.
// Support mode (shared/bc-support.js) is off whenever the page opens and
// comes on only when the student clicks Support. In an embed the header
// is hidden, so a lesson that wants it offers the switch with support=1
// (embed.js).
let isSupportMode = false; // always off when the page opens; on only when clicked
const SUPPORT_STAGE_EVERY = 3;
const SUPPORT_MAX_STAGE = 3;
let supportStreak = 0;
// How many times the hint has been stepped down (0 = full hint, 3 = none
// left). Tracked as an integer stage rather than repeatedly subtracting
// 1/3 from a fraction, which never lands on exactly 0 due to float drift.
let supportStage = 0;

function applySupportMode(on) {
  isSupportMode = !!on;
  syncSupportModeButton();
  if (currentPracticeMode === 'trace') {
    pracData.forEach((data, index) => renderPracEntry(`prac${index}`, data));
    if (genQuestion) renderPracEntry('gen', genQuestion);
  }
}

function toggleSupportMode() {
  if (window.BCSupport) { window.BCSupport.set(!isSupportMode); return; } // onChange below applies it
  applySupportMode(!isSupportMode);
}
if (window.BCSupport) window.BCSupport.onChange(applySupportMode);

function syncSupportModeButton() {
  const btn = document.getElementById('support-mode-btn');
  if (!btn) return;
  btn.textContent = isSupportMode ? 'On' : 'Off';
  btn.classList.toggle('active', isSupportMode);
  btn.setAttribute('aria-pressed', isSupportMode ? 'true' : 'false');
}

// How much of one cell's correct answer to reveal, as a prefix - shrinks
// as the streak below grows, reaching '' (no hint at all) once the
// fraction bottoms out at 0.
function revealedCellText(expected) {
  const fraction = Math.max(0, 1 - supportStage / SUPPORT_MAX_STAGE);
  if (!expected || fraction <= 0) return '';
  const len = Math.max(1, Math.round(expected.length * fraction));
  return expected.slice(0, Math.min(expected.length, len));
}

function cellHintHtml(expected, typed) {
  const revealed = revealedCellText(expected);
  const typedLower = typed.toLowerCase();
  const revealedLower = revealed.toLowerCase();
  let html = '';
  for (let i = 0; i < revealed.length; i++) {
    if (i < typed.length) {
      const ok = typedLower[i] === revealedLower[i];
      html += `<span class="tt-hint-char ${ok ? 'tt-hint-ok' : 'tt-hint-bad'}">${escapeHtml(revealed[i])}</span>`;
    } else {
      html += `<span class="tt-hint-char">${escapeHtml(revealed[i])}</span>`;
    }
  }
  for (let i = revealed.length; i < expected.length; i++) {
    html += `<span class="tt-hint-blank" aria-hidden="true"></span>`;
  }
  return html;
}

function renderCellHint(td) {
  const hint = td.querySelector('.tt-hint');
  if (!hint) return;
  const expected = td.dataset.expected || '';
  if (!expected) { hint.innerHTML = ''; return; }
  const input = td.querySelector('input');
  hint.innerHTML = cellHintHtml(expected, input ? input.value : '');
}

function onSupportCellInput(input) {
  if (!isSupportMode) return;
  const td = input.closest('td');
  if (td) renderCellHint(td);
}

function refreshSupportHints() {
  document.querySelectorAll('.trace-table td[data-expected]').forEach(renderCellHint);
}

// Called once per Check Answers press in trace mode (checkPractice in
// practice.js, checkGeneratedPractice in generator.js). A fully-correct
// table advances the streak and, every SUPPORT_STAGE_EVERY in a row, fades
// the hints down another stage; anything else resets the streak without
// pulling the fade back the other way. Checking the same table twice
// counts once.
let lastSupportCheck = null;
function recordSupportOutcome(isCorrect) {
  if (!isSupportMode) return;
  const signature = Array.from(document.querySelectorAll('.trace-table td[data-expected]'))
    .map(td => td.dataset.expected + '=' + ((td.querySelector('input') || {}).value || '')).join('|');
  if (signature === lastSupportCheck) return;
  lastSupportCheck = signature;
  if (isCorrect) {
    supportStreak++;
    if (supportStreak % SUPPORT_STAGE_EVERY === 0 && supportStage < SUPPORT_MAX_STAGE) {
      supportStage++;
    }
  } else {
    supportStreak = 0;
  }
  refreshSupportHints();
}
