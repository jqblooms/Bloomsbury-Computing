'use strict';
// The Code Box: running the student's program, the console, the Run and Stop buttons.
// ============================================================
// PLAYER CODE BOX WIRING
// ============================================================
var codeInput = document.getElementById('code-input');
var codeBackdrop = document.getElementById('code-backdrop');
var codeEditorEl = document.querySelector('.code-editor');
var runBtn = document.getElementById('run-btn');
var machineBtn = document.getElementById('machine-btn');
var consoleOutput = document.getElementById('console-output');

// The code box is scratch space for a one-time task, not a saved script -
// Run executes whatever is in it and empties it straight away, exactly
// like handing in a single piece of work. A machine is the only place
// code actually keeps running: Place Machine also empties the box, but
// because the code has gone to live inside the machine (see placeMachine
// below), not because it's been thrown away. Typing is still normal;
// only copying/cutting/pasting text in or out of the box is blocked, so
// a solution can't be lifted from (or dropped into) it.
['copy', 'cut', 'paste', 'contextmenu'].forEach(function (evt) {
  codeInput.addEventListener(evt, function (e) { e.preventDefault(); });
});

// The textarea's text is transparent - the code is actually rendered by
// the backdrop <div> behind it, so an error line can be tinted red. Both
// layers share the same font/padding/line-height, so they stay in line;
// renderCodeBackdrop re-syncs the backdrop whenever the text changes.
var errorLine = 0; // 1-based line currently flagged as wrong; 0 = none

function renderCodeBackdrop() {
  var lines = codeInput.value.split('\n');
  codeBackdrop.innerHTML = lines.map(function (line, i) {
    var cls = (errorLine > 0 && i + 1 === errorLine) ? ' class="code-line error"' : ' class="code-line"';
    return '<div' + cls + '>' + (line ? escapeHtmlLocal(line) : '&nbsp;') + '</div>';
  }).join('');
}

function setCodeError(lineNo) {
  errorLine = lineNo || 0;
  renderCodeBackdrop();
  codeEditorEl.classList.add('has-error');
  var lh = parseFloat(getComputedStyle(codeInput).lineHeight) || 18;
  codeInput.scrollTop = Math.max(0, (errorLine - 1) * lh - codeInput.clientHeight / 2);
  codeBackdrop.scrollTop = codeInput.scrollTop;
}

function clearCodeError() {
  errorLine = 0;
  renderCodeBackdrop();
  codeEditorEl.classList.remove('has-error');
}

codeInput.addEventListener('input', function () { clearCodeError(); }); // typing invalidates the flagged line
codeInput.addEventListener('scroll', function () {
  codeBackdrop.scrollTop = codeInput.scrollTop;
  codeBackdrop.scrollLeft = codeInput.scrollLeft;
});

var machineLogQueue = [];
var machineLogByKey = {};
var lastMachineLogFlush = 0;

function appendConsoleRow(message, isError, isMachine, count, fragment) {
  var row = document.createElement('div');
  if (isError) row.className = 'err';
  else if (isMachine) row.className = 'machine-line';
  row.textContent = message + (count > 1 ? ' (x' + count + ')' : '');
  (fragment || consoleOutput).appendChild(row);
}

function logConsole(message, isError, isMachine) {
  if (isMachine) {
    var key = (isError ? '1|' : '0|') + message;
    var pending = machineLogByKey[key];
    if (pending) {
      pending.count++;
    } else if (machineLogQueue.length < 200) {
      pending = { message: message, isError: !!isError, count: 1 };
      machineLogByKey[key] = pending;
      machineLogQueue.push(pending);
    }
    return;
  }
  appendConsoleRow(message, isError, false, 1);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
  while (consoleOutput.children.length > 60) consoleOutput.removeChild(consoleOutput.firstChild);
}

function flushMachineConsole(now, force) {
  if (!machineLogQueue.length || (!force && now - lastMachineLogFlush < 250)) return;
  lastMachineLogFlush = now;
  var queue = machineLogQueue;
  machineLogQueue = [];
  machineLogByKey = {};
  var fragment = document.createDocumentFragment();
  queue.forEach(function (entry) {
    appendConsoleRow(entry.message, entry.isError, true, entry.count, fragment);
  });
  consoleOutput.appendChild(fragment);
  while (consoleOutput.children.length > 60) consoleOutput.removeChild(consoleOutput.firstChild);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function setRunningUI(running) {
  isRunning = running;
  runBtn.disabled = running;
  runBtn.textContent = running ? 'Running...' : 'Run';
}

runBtn.addEventListener('click', function () {
  if (isRunning) return;
  var source = codeInput.value;
  if (!source.trim()) { logConsole('Write some code first.', true); return; }
  var compiledProgram;
  try {
    compiledProgram = compile(source); // tokenise and validate once before execution
  } catch (e) {
    setCodeError(e.line || 1);
    logConsole(e.message || String(e), true);
    return;
  }
  clearCodeError();
  setRunningUI(true);
  runProgram(compiledProgram, playerCursor, function (msg, isErr) { logConsole(msg, isErr); }, 350)
    .then(function () {
      codeInput.value = '';
      renderCodeBackdrop();
      setRunningUI(false);
    })
    .catch(function (err) {
      setCodeError(err.line || 1);
      logConsole(err.message || String(err), true);
      setRunningUI(false);
    });
});

machineBtn.addEventListener('click', function () {
  if (isRunning) return;
  var source = codeInput.value;
  if (placeMachine(source)) {
    codeInput.value = ''; // handed off to the machine, not lost
    renderCodeBackdrop();
  }
});

// Capture lesson code before the normal Run handler clears the editor. The
// mission watcher checks the resulting garden after the run finishes.
runBtn.addEventListener('click', function () {
  if (!lessonMissionMode || !codeInput.value.trim()) return;
  lessonMissionPendingSource = codeInput.value;
  setTimeout(watchLessonRun, 0);
});

