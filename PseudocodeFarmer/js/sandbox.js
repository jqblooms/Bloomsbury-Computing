'use strict';
// The tutorial sandbox: a fresh practice world for each machine tutorial.
// ============================================================
// TUTORIAL SANDBOX - each tutorial gets its own fresh, disposable practice world
// ============================================================
// Fixes a real problem: tutorials used to run directly in the student's own free-play farm,
// so a tutorial's requirements (enough coins, a clear home tile, no seed already in
// inventory before an IF/ELSE step that assumes there isn't one) routinely clashed with
// whatever state an earlier tutorial - or ordinary free play - had left behind. Now every
// tutorial starts from a small, deterministic world sized exactly for what it needs
// (tut.minMoney as a real starting balance, not just a worst-case threshold to clear before
// starting; empty inventory; an untouched tile grid), so it is always completable regardless
// of what the student has been doing. The world is a genuine practice sandbox - see the
// AskUserQuestion decision this was built against: what's built during a tutorial (a placed
// machine, planted crops) stays in the sandbox and does not carry over when the student
// leaves it, exactly the way a lesson mission never touches the free-play save either. The
// student's real farm is snapshotted once (enterTutorialSandbox) and restored byte-for-byte
// (exitTutorialSandbox) - it is never visible or mutable while any tutorial is active.
function resetTutorialWorld(tut) {
  // Every tutorial is written in Cambridge Pseudocode against Carrots specifically - force
  // the crop farm regardless of which farm type the student's real save was on, the same way
  // everything else here is reset to a known-good baseline rather than inherited. Set before
  // rebuildGarden() below, so fresh tiles get the right colour.
  currentFarmType = 'crops';
  clearWorldObjects();
  rebuildGarden(initialTileList());
  money = typeof tut.minMoney === 'number' ? tut.minMoney : 40;
  totalEarned = 0;
  farmEarned = 0;
  buildShop();
  inventory = {};
  soldCount = {};
  unlockedState = {};
  selectedMachineId = null;
  editingMachineCodeId = null;
  // Player "home" - the origin SetPosition(x, z) counts from - is always the fixed (0, 0)
  // corner in free play (see the playerCursor comment near its declaration), so leaving
  // homeX/homeZ untouched here keeps every tutorial's SetPosition offsets meaning exactly
  // what their instructions say, same as they always have.
  playerCursor.x = Math.floor(GRID_SIZE / 2);
  playerCursor.z = Math.floor(GRID_SIZE / 2);
  playerCursor.facing = 0;
  updatePlayerCursorPosition();
  updateFacingIndicator(playerFacingIndicator, playerCursor.facing);
  codeInput.value = '';
  clearCodeError();
  consoleOutput.innerHTML = '';
  machineLogQueue = [];
  machineLogByKey = {};
  gameStateDirty = false; // the sandbox never persists - see saveGame()'s tutorialMode guard
  lastHudSignature = '';
  lastTileInfoSignature = '';
  refreshUnlocks();
  updateHUD();
  updateTileInfoPanel();
}
// Enters tutorial mode if not already in it (snapshotting the real farm exactly once - a
// student can move straight from one tutorial to another via "Browse Tutorials" without ever
// returning to free play in between, and that must never re-snapshot an already-sandboxed
// world over the real one), then builds tut's fresh world.
function enterTutorialSandbox(tut) {
  if (!tutorialMode) {
    saveGame(true); // make sure the real save on disk is current before we leave it behind
    tutorialSavedRealState = serializeGameState();
    tutorialMode = true;
  }
  resetTutorialWorld(tut);
}
// Restores the student's real farm exactly as it was before any tutorial this session
// touched it. Safe to call even if a snapshot was somehow never taken (defensive - should
// never happen given enterTutorialSandbox always takes one first).
function exitTutorialSandbox() {
  if (!tutorialMode) return;
  var saved = tutorialSavedRealState;
  tutorialMode = false;
  tutorialSavedRealState = null;
  clearWorldObjects();
  if (saved) applyGameState(saved);
  else rebuildGarden(initialTileList());
  codeInput.value = '';
  clearCodeError();
  consoleOutput.innerHTML = '';
  machineLogQueue = [];
  machineLogByKey = {};
  gameStateDirty = false;
  lastHudSignature = '';
  lastTileInfoSignature = '';
  refreshUnlocks();
  updateHUD();
  updateTileInfoPanel();
}

function renderTutorialPicker() {
  var list = document.getElementById('tutorial-picker-list');
  if (!list) return;
  list.innerHTML = TUTORIALS.map(function (tut, i) {
    var prog = tutState[tut.id];
    var status = '';
    if (prog && prog.completed) status = '<span class="tut-card-status">Done</span>';
    else if (prog && prog.stepIdx > 0) status = '<span class="tut-card-status tut-inprogress">Step ' + (prog.stepIdx + 1) + '/' + tut.steps.length + '</span>';
    return '<button type="button" class="tut-card" data-tut="' + i + '">' +
      '<span class="tut-card-badge" style="background:' + tut.color + '">' + escapeHtmlLocal(tut.title.charAt(0)) + '</span>' +
      '<span class="tut-card-body"><span class="tut-card-title">' + escapeHtmlLocal(tut.title) + '</span>' +
      '<span class="tut-card-desc">' + escapeHtmlLocal(tut.desc) + '</span></span>' + status + '</button>';
  }).join('');
  list.querySelectorAll('.tut-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var tutIdx = parseInt(card.dataset.tut, 10);
      startTutorial(tutIdx);
      closeTutorialModal();
    });
  });
  var doneCount = TUTORIALS.filter(function (t) { return tutState[t.id] && tutState[t.id].completed; }).length;
  var summary = document.getElementById('tutorial-picker-summary');
  if (summary) summary.textContent = TUTORIALS.length + ' tutorial' + (TUTORIALS.length === 1 ? '' : 's') + ' · ' + doneCount + ' completed';
}

// Modal (same "browse all tutorials" pattern as PyScratch's own tutorial pick modal in
// assets/js/pyscratch.js) rather than a permanently-expanded sidebar list.
function openTutorialModal() {
  renderTutorialPicker();
  document.getElementById('tutorial-modal-overlay').classList.add('open');
}
function closeTutorialModal() {
  document.getElementById('tutorial-modal-overlay').classList.remove('open');
}

// Pop-out code window - a 1:1 live copy of the current tutorial step's reference code
// (same diff colouring: grey/old, amber/new, green/typed) that floats free of the sidebar
// and can be dragged anywhere, the same idea as PyScratch's own draggable code window. It
// never has its own state - openTutorialCodeModal() and every place that already updates
// #tutorial-bar-code's content (renderTutorialStep, renderTutorialChecklist) also mirror
// that same innerHTML in here, so the two are never out of sync.
function syncTutorialCodeModal() {
  var modal = document.getElementById('tutorial-code-modal');
  if (!modal.classList.contains('open')) return;
  document.getElementById('tutorial-code-modal-body').innerHTML = document.getElementById('tutorial-bar-code').innerHTML;
}
function openTutorialCodeModal() {
  var step = currentTutorialStep();
  var tut = activeTutorial ? TUTORIALS[activeTutorial.tutIdx] : null;
  document.getElementById('tutorial-code-modal-title').textContent = (tut ? tut.title + ' - ' : '') + (step ? step.title : 'Code');
  document.getElementById('tutorial-code-modal').classList.add('open'); // before sync - sync no-ops while not open
  syncTutorialCodeModal();
}
function closeTutorialCodeModal() {
  document.getElementById('tutorial-code-modal').classList.remove('open');
}
document.getElementById('tutorial-code-expand').addEventListener('click', openTutorialCodeModal);
document.getElementById('tutorial-code-modal-close').addEventListener('click', closeTutorialCodeModal);

// Dragging: same pointerdown/pointermove/pointerup + pointer-capture pattern already used
// elsewhere in this file for camera panning. Once dragged even once, position switches from
// the initial centred transform to an explicit left/top so it stays exactly where dropped.
(function setupTutorialCodeModalDrag() {
  var modal = document.getElementById('tutorial-code-modal');
  var head = document.getElementById('tutorial-code-modal-head');
  var dragState = null;
  head.addEventListener('pointerdown', function (e) {
    if (e.target.closest('#tutorial-code-modal-close')) return;
    var rect = modal.getBoundingClientRect();
    dragState = { id: e.pointerId, startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    modal.style.transform = 'none';
    head.setPointerCapture && head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener('pointermove', function (e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    var nextLeft = dragState.left + (e.clientX - dragState.startX);
    var nextTop = dragState.top + (e.clientY - dragState.startY);
    // Keep at least a corner of the header on-screen so it can never be dragged somewhere unreachable.
    nextLeft = Math.max(-modal.offsetWidth + 60, Math.min(window.innerWidth - 60, nextLeft));
    nextTop = Math.max(0, Math.min(window.innerHeight - 40, nextTop));
    modal.style.left = nextLeft + 'px';
    modal.style.top = nextTop + 'px';
  });
  function endDrag(e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    dragState = null;
  }
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);
})();

// ── Pop-out Code Box ─────────────────────────────────────────────────
// Unlike the tutorial reference code's pop-out above (a read-only 1:1 COPY,
// re-synced on every change), this one relocates the REAL .code-editor node
// - the live #code-backdrop/#code-input pair - into the floating window and
// back again, never a clone. Every existing bit of wiring (typing, scroll
// sync, error-line highlighting, and the Run/Place Machine buttons, which
// only ever read codeInput.value) already works on that exact element
// regardless of which parent currently contains it, so none of it needs to
// know or care that the box moved. codeEditorHomeParent/NextSibling
// remembers exactly where it came from so closing puts it back in the same
// spot, not just "somewhere in #code-panel".
var codeModal = document.getElementById('code-modal');
var codeModalBody = document.getElementById('code-modal-body');
var codeEditorHomeParent = codeEditorEl.parentNode;
var codeEditorHomeNextSibling = codeEditorEl.nextSibling;
function openCodeModal() {
  codeModalBody.appendChild(codeEditorEl);
  codeModal.classList.add('open');
  codeInput.focus();
}
function closeCodeModal() {
  if (codeEditorHomeNextSibling && codeEditorHomeNextSibling.parentNode === codeEditorHomeParent) {
    codeEditorHomeParent.insertBefore(codeEditorEl, codeEditorHomeNextSibling);
  } else {
    codeEditorHomeParent.appendChild(codeEditorEl);
  }
  codeModal.classList.remove('open');
}
document.getElementById('code-expand').addEventListener('click', function () {
  if (codeModal.classList.contains('open')) closeCodeModal(); else openCodeModal();
});
document.getElementById('code-modal-close').addEventListener('click', closeCodeModal);
(function setupCodeModalDrag() {
  var modal = codeModal;
  var head = document.getElementById('code-modal-head');
  var dragState = null;
  head.addEventListener('pointerdown', function (e) {
    if (e.target.closest('#code-modal-close')) return;
    var rect = modal.getBoundingClientRect();
    dragState = { id: e.pointerId, startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
    modal.style.left = rect.left + 'px';
    modal.style.top = rect.top + 'px';
    modal.style.transform = 'none';
    head.setPointerCapture && head.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  head.addEventListener('pointermove', function (e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    var nextLeft = dragState.left + (e.clientX - dragState.startX);
    var nextTop = dragState.top + (e.clientY - dragState.startY);
    nextLeft = Math.max(-modal.offsetWidth + 60, Math.min(window.innerWidth - 60, nextLeft));
    nextTop = Math.max(0, Math.min(window.innerHeight - 40, nextTop));
    modal.style.left = nextLeft + 'px';
    modal.style.top = nextTop + 'px';
  });
  function endDrag(e) {
    if (!dragState || dragState.id !== e.pointerId) return;
    dragState = null;
  }
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);
})();

document.getElementById('tutorial-picker-open').addEventListener('click', openTutorialModal);
document.getElementById('tutorial-modal-close').addEventListener('click', closeTutorialModal);
document.getElementById('tutorial-modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeTutorialModal(); // click on the dark backdrop, not the card itself
});
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('tutorial-modal-overlay').classList.contains('open')) closeTutorialModal();
});

function startTutorial(tutIdx) {
  var tut = TUTORIALS[tutIdx];
  if (!tut) return;
  var saved = tutState[tut.id];
  var stepIdx = (saved && !saved.completed) ? Math.min(saved.stepIdx, tut.steps.length - 1) : 0;
  activeTutorial = { tutIdx: tutIdx, stepIdx: stepIdx };
  enterTutorialSandbox(tut); // swaps in this tutorial's own fresh, guaranteed-workable world
  document.body.classList.add('tutorial-active'); // disables the shop Buy / ground Sell shortcuts
  var panel = document.getElementById('tutorial-bar-panel');
  panel.classList.add('active');
  panel.classList.add('just-started');
  setTimeout(function () { panel.classList.remove('just-started'); }, 1700);
  setTutorialCollapsed(false);
  renderTutorialStep();
}
function exitTutorial() {
  activeTutorial = null;
  exitTutorialSandbox(); // hands the student's real farm back exactly as they left it
  document.body.classList.remove('tutorial-active');
  document.getElementById('tutorial-bar-panel').classList.remove('active');
  closeTutorialCodeModal(); // no current step left for it to be a copy of
  clearTutorialHighlights(); // no current step left for a highlight ring to belong to either
  renderTutorialPicker();
}
function setTutorialCollapsed(collapsed) {
  var panel = document.getElementById('tutorial-bar-panel');
  var toggle = document.getElementById('tutorial-bar-toggle');
  panel.classList.toggle('collapsed', collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
}

// --- Live per-character diff for a tutorial's "new" reference lines, ported from
// Pseudocode Blitz's Support Mode hint system (its hintLineCharStatuses/stringLiteralMask).
// Replaces the old all-or-nothing check (a line stayed flat amber until an exact copy of
// its full text appeared anywhere in codeInput.value, and could never show a mistake) with
// a per-character comparison against the student's line at the same position: matched
// characters turn green as they're typed, a genuine wrong character turns red, anything
// not reached yet stays amber.
function tutorialStringLiteralMask(text) {
  var mask = new Array(text.length).fill(false);
  var inString = false;
  for (var i = 0; i < text.length; i++) {
    if (text[i] === '"') { inString = !inString; mask[i] = true; }
    else mask[i] = inString;
  }
  return mask;
}
function tutorialLineCharStatuses(targetLine, studentLine) {
  var caseSensitive = tutorialStringLiteralMask(targetLine);
  var student = String(studentLine || '');
  return targetLine.split('').map(function (ch, i) {
    if (i >= student.length) return 'pending';
    var typed = student[i];
    var match = caseSensitive[i] ? typed === ch : typed.toUpperCase() === ch.toUpperCase();
    return match ? 'match' : 'mismatch';
  });
}
function tutorialNewLineHtml(targetLine, studentLine) {
  var statuses = tutorialLineCharStatuses(targetLine, studentLine);
  return targetLine.split('').map(function (ch, i) {
    var cls = statuses[i] === 'match' ? 'tc-match' : statuses[i] === 'mismatch' ? 'tc-mismatch' : 'tc-pending';
    return '<span class="' + cls + '">' + escapeHtmlLocal(ch) + '</span>';
  }).join('');
}
// Builds the full reference-code block for the current step. Student lines are matched to
// target lines by position among non-blank lines only (mirroring compile(), which skips
// blank lines outright) - so a stray blank line the student adds doesn't throw every later
// line's diff out of alignment.
function tutorialCodeHtml(step) {
  if (!step.target) return '';
  var newSet = {};
  (step.newLines || []).forEach(function (l) { newSet[l] = true; });
  var studentLines = codeInput.value.split('\n').filter(function (l) { return l.trim() !== ''; });
  var studentIdx = 0;
  return step.target.split('\n').map(function (line) {
    var isNew = !!newSet[line];
    var html = isNew ? tutorialNewLineHtml(line, studentLines[studentIdx]) : escapeHtmlLocal(line);
    if (line.trim() !== '') studentIdx++;
    return '<span class="tb-line ' + (isNew ? 'new' : 'old') + '" data-line="' + escapeHtmlLocal(line) + '">' + html + '</span>';
  }).join('');
}

function renderTutorialStep() {
  if (!activeTutorial) return;
  var tut = TUTORIALS[activeTutorial.tutIdx];
  var step = tut.steps[activeTutorial.stepIdx];
  document.getElementById('tutorial-bar-name').textContent = tut.title;
  document.getElementById('tutorial-bar-stepcount').textContent = 'Step ' + (activeTutorial.stepIdx + 1) + '/' + tut.steps.length;
  if (step.action === 'machine') tutorialMachineBaseline = machines.length;
  document.getElementById('tutorial-bar-attempt-warning').hidden = true;
  document.getElementById('tutorial-bar-title').textContent = step.title;
  document.getElementById('tutorial-bar-text').innerHTML = step.text;
  document.getElementById('tutorial-bar-dots').innerHTML = tut.steps.map(function (s, i) {
    var cls = i < activeTutorial.stepIdx ? 'tb-done' : (i === activeTutorial.stepIdx ? 'tb-cur' : '');
    return '<span class="tb-dot ' + cls + '"></span>';
  }).join('');
  document.getElementById('tutorial-bar-code-wrap').classList.toggle('tb-no-target', !step.target);
  document.getElementById('tutorial-bar-code').innerHTML = tutorialCodeHtml(step);
  document.getElementById('tutorial-bar-action-hint').textContent = step.actionHint || '';
  document.getElementById('tutorial-bar-back').disabled = activeTutorial.stepIdx === 0;
  refreshTutorialHighlight();
  renderTutorialChecklist();
}

function renderTutorialChecklist() {
  var step = currentTutorialStep();
  if (!step) return false;
  var program = tutorialCompileQuiet(codeInput.value);
  var reqsOk = tutorialRequiresMet(program, step.requires || []);
  lastTutorialReqsOk = reqsOk;
  document.getElementById('tutorial-bar-checks').innerHTML = (step.requires || []).map(function (req) {
    var ok = !!(program && tutorialRequirementMet(program, req));
    return '<div class="tb-check ' + (ok ? 'tb-ok' : '') + '"><span class="tb-check-icon"></span><span>' + tutorialRequirementLabel(req) + '</span></div>';
  }).join('');
  document.getElementById('tutorial-bar-code').innerHTML = tutorialCodeHtml(step);
  // The reference panel is only a guide. Keep the action prompt honest about the
  // student's real Code Box, which may still be empty when a step first appears.
  if (step.action === 'run' && !reqsOk) {
    document.getElementById('tutorial-bar-action-hint').textContent = 'Type all three lines into the Code Box, then press Run.';
  } else if (step.action === 'run') {
    document.getElementById('tutorial-bar-action-hint').textContent = 'All three lines are in your Code Box - press Run to try the sequence.';
  } else if (step.actionHint) {
    document.getElementById('tutorial-bar-action-hint').textContent = step.actionHint;
  }
  updateTutorialNextButton(reqsOk);
  syncTutorialCodeModal(); // covers both a step change (renderTutorialStep calls this at the
                           // end) and every keystroke (codeInput's own input listener calls
                           // this directly) - the pop-out never needs its own separate sync calls.
  return reqsOk;
}

function updateTutorialNextButton(reqsOk) {
  var step = currentTutorialStep();
  var nextBtn = document.getElementById('tutorial-bar-next');
  if (!step || !nextBtn) return;
  if (!step.action) {
    nextBtn.disabled = !reqsOk;
    nextBtn.textContent = (activeTutorial.stepIdx === TUTORIALS[activeTutorial.tutIdx].steps.length - 1) ? 'Finish' : 'Next';
  } else {
    // Action-gated steps only ever advance via the real run-btn/machine-btn listeners
    // below - the Next button itself stays disabled the whole step, so there's exactly
    // one way through: actually doing the real game action with the right code typed.
    nextBtn.disabled = true;
    nextBtn.textContent = 'Waiting for you to ' + (step.action === 'run' ? 'press Run' : 'place the machine') + '...';
  }
}

function goToTutorialStep(delta) {
  if (!activeTutorial) return;
  var tut = TUTORIALS[activeTutorial.tutIdx];
  var next = activeTutorial.stepIdx + delta;
  if (next < 0 || next >= tut.steps.length) return;
  activeTutorial.stepIdx = next;
  tutState[tut.id] = { stepIdx: next, completed: false };
  saveTutorialProgress();
  renderTutorialStep();
}
function advanceOrComplete() {
  var tut = TUTORIALS[activeTutorial.tutIdx];
  if (activeTutorial.stepIdx === tut.steps.length - 1) completeTutorial();
  else goToTutorialStep(1);
}
function completeTutorial() {
  var tut = TUTORIALS[activeTutorial.tutIdx];
  tutState[tut.id] = { stepIdx: tut.steps.length - 1, completed: true };
  saveTutorialProgress();
  document.getElementById('tutorial-bar-dots').innerHTML = tut.steps.map(function () { return '<span class="tb-dot tb-done"></span>'; }).join('');
  document.getElementById('tutorial-bar-title').textContent = 'Tutorial complete';
  document.getElementById('tutorial-bar-text').innerHTML = 'Nice work - that was a practice run in its own sandbox, so it never touched your real farm. Exit the tutorial to get back to it, or pick another tutorial from the list below.';
  document.getElementById('tutorial-bar-code').innerHTML = '';
  document.getElementById('tutorial-bar-checks').innerHTML = '';
  document.getElementById('tutorial-bar-action-hint').textContent = '';
  document.getElementById('tutorial-bar-back').disabled = true;
  var nextBtn = document.getElementById('tutorial-bar-next');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Finished';
  closeTutorialCodeModal(); // no current step left for it to be a copy of
}

document.getElementById('tutorial-bar-next').addEventListener('click', function () {
  var step = currentTutorialStep();
  if (!step || step.action) return; // action-gated steps advance only via the real action below
  advanceOrComplete();
});
document.getElementById('tutorial-bar-back').addEventListener('click', function () { goToTutorialStep(-1); });
document.getElementById('tutorial-bar-exit').addEventListener('click', exitTutorial);
document.getElementById('tutorial-bar-toggle').addEventListener('click', function () {
  setTutorialCollapsed(!document.getElementById('tutorial-bar-panel').classList.contains('collapsed'));
});
codeInput.addEventListener('input', function () { if (activeTutorial) renderTutorialChecklist(); });

function showTutorialAttemptWarning(message) {
  var el = document.getElementById('tutorial-bar-attempt-warning');
  el.textContent = message;
  el.hidden = false;
}
function clearTutorialAttemptWarning() {
  document.getElementById('tutorial-bar-attempt-warning').hidden = true;
}

// Piggyback on the real Run button exactly the way the lesson-mission watcher already
// does above - a separate, later-registered listener, never touching runBtn's own
// click handler. Waits for isRunning to actually flip back to false (the real async
// run finishing) before checking the outcome.
runBtn.addEventListener('click', function () {
  if (!activeTutorial) return;
  var step = currentTutorialStep();
  if (!step || step.action !== 'run') return;
  if (!lastTutorialReqsOk) return;
  var waitForRun = setInterval(function () {
    if (isRunning) return;
    clearInterval(waitForRun);
    // The real Run handler only clears codeInput.value on its .then() success path - a
    // genuine PseudocodeError (its .catch() path) leaves the code in the box untouched.
    // Checking this catches real execution errors; it can't see a run that completed
    // without error but didn't achieve much (e.g. not enough money to buy anything) -
    // same limit every other step in this engine already accepts.
    if (codeInput.value.trim() !== '') {
      showTutorialAttemptWarning('That run hit an error - check the message below the Code Box, fix it, and press Run again.');
      return;
    }
    clearTutorialAttemptWarning();
    advanceOrComplete();
  }, 100);
});
// placeMachine() (called by the real machineBtn handler above) is synchronous, so by the
// time this later-registered listener runs, placement has already succeeded or failed.
// Comparing against tutorialMachineBaseline (captured when this step first rendered, not
// a fixed 0) is what makes this correct once earlier tutorials have already left their
// own machines on the field - machines.length being non-zero on its own proves nothing.
machineBtn.addEventListener('click', function () {
  if (!activeTutorial) return;
  var step = currentTutorialStep();
  if (!step || step.action !== 'machine') return;
  if (!lastTutorialReqsOk) return;
  if (machines.length <= tutorialMachineBaseline) {
    showTutorialAttemptWarning('That didn\'t place a machine - check the message below the Code Box (not enough coins? tile already occupied?), sort it out, and try again.');
    return;
  }
  clearTutorialAttemptWarning();
  advanceOrComplete();
});

if (!missionParam) renderTutorialPicker(); // hidden anyway in mission mode, but skip the work too

// Deep-link a specific tutorial from a lesson, the same way ?lessonMission= deep-links a
// mission - e.g. a Year 9 Sequence lesson links straight to ?tutorial=basic-auto-farm rather
// than sending the student to the picker to find it themselves. loadGame() (the student's
// normal free-play save) still runs first, same as ever - startTutorial() below snapshots
// whatever that restored and swaps in the tutorial's own fresh sandbox on top of it, so a
// deep-linked tutorial is always startable regardless of that save's state.
var tutorialParam = new URLSearchParams(window.location.search).get('tutorial');
if (tutorialParam && !missionParam) {
  var tutorialParamIdx = TUTORIALS.findIndex(function (t) { return t.id === tutorialParam; });
  if (tutorialParamIdx !== -1) startTutorial(tutorialParamIdx);
}

