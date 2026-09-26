// Checking a circuit, scoring, and the teacher dev mode.
// ===================== QUESTION + SCORING =====================
function loadQuestion() {
  const difficulty = Math.floor(state.score / 3);
  const q = generateQuestion(state.numInputs, difficulty);
  state.currentQuestion = q;
  document.getElementById('question-text').textContent = `Q = ${exprToString(q.expr)}`;
}

function clearCircuit() {
  state.placedGates = [];
  state.wires = [];
  document.getElementById('canvas-nodes').querySelectorAll('.placed-gate').forEach(el => el.remove());
  document.getElementById('circuit-canvas').innerHTML = '';
}

function checkAnswer() {
  if (!state.currentQuestion) return;
  const { expr, inputs } = state.currentQuestion;
  const truth = getTruthTable(expr, inputs);
  const correct = evaluateCircuit(truth, inputs);

  if (correct) {
    state.score++;
    state.streak++;
    updateScoreDisplay();

    // Check level up
    const newInputs = 2 + Math.floor(state.score / 7);
    const capped = Math.min(newInputs, INPUTS_LABELS.length);
    if (capped > state.numInputs) {
      state.numInputs = capped;
      document.getElementById('inputs-val').textContent = state.numInputs;
      showLevelup();
    } else {
      showToast('CORRECT!', 'correct');
      setTimeout(() => nextQuestion(), 900);
    }
  } else {
    state.streak = 0;
    updateScoreDisplay();
    showToast('WRONG, TRY AGAIN', 'wrong');
  }
}

function nextQuestion() {
  clearCircuit();
  buildIONodes();
  loadQuestion();
  updateProgress();
}

function updateScoreDisplay() {
  document.getElementById('score-val').textContent = state.score;
  document.getElementById('streak-val').textContent = state.streak;
  updateProgress();
}

function updateProgress() {
  const pct = ((state.score % 7) / 7) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function showToast(msg, cls) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${cls}`;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 1800);
}

function showLevelup() {
  const el = document.getElementById('levelup');
  document.getElementById('levelup-msg').textContent =
    `Input ${INPUTS_LABELS[state.numInputs-1]} added! Circuits just got more complex.`;
  el.classList.add('show');
}

function dismissLevelup() {
  document.getElementById('levelup').classList.remove('show');
  showToast('CORRECT!', 'correct');
  setTimeout(() => nextQuestion(), 300);
}

// ===================== DEV MODE =====================
let devKeyBuffer = '';
let devKeyTimer = null;

document.addEventListener('keydown', e => {
  if (!e.shiftKey) { devKeyBuffer = ''; return; }
  devKeyBuffer += e.key.toUpperCase();
  clearTimeout(devKeyTimer);
  devKeyTimer = setTimeout(() => devKeyBuffer = '', 1500);
  if (devKeyBuffer.endsWith('DEV')) {
    devKeyBuffer = '';
    openDevPanel();
  }
});

function openDevPanel() {
  const existing = document.getElementById('dev-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = [
    'position:fixed','top:50%','left:50%','transform:translate(-50%,-50%)',
    'background:#1d2128','border:2px solid #c9cdd4','border-radius:8px',
    'padding:24px 28px','z-index:9999','box-shadow:0 8px 32px rgba(0,0,0,0.25)',
    'font-family:Roboto,sans-serif','min-width:260px'
  ].join(';');
  panel.innerHTML =
    '<div style="font-weight:700;font-size:1rem;margin-bottom:4px;">Dev Mode</div>' +
    '<div style="font-size:0.8rem;color:#9aa0a6;margin-bottom:16px;">Current score: <strong>' + state.score + '</strong>, inputs: <strong>' + state.numInputs + '</strong></div>' +
    '<label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px;">Set score:</label>' +
    '<input id="dev-score-input" type="number" min="0" value="' + state.score + '" style="width:100%;padding:8px;font-size:1rem;border:2px solid #3b424e;border-radius:4px;box-sizing:border-box;margin-bottom:12px;"/>' +
    '<div style="display:flex;gap:8px;">' +
    '<button id="dev-apply-btn" style="flex:1;padding:9px;background:#8ab4f8;color:#1d2128;border:none;border-radius:5px;font-weight:700;cursor:pointer;font-size:0.9rem;">Apply</button>' +
    '<button id="dev-cancel-btn" style="flex:1;padding:9px;background:#2b3039;color:#c9cdd4;border:none;border-radius:5px;font-weight:700;cursor:pointer;font-size:0.9rem;">Cancel</button>' +
    '</div>';

  document.body.appendChild(panel);
  document.getElementById('dev-apply-btn').addEventListener('click', applyDevScore);
  document.getElementById('dev-cancel-btn').addEventListener('click', function() { panel.remove(); });
  const input = document.getElementById('dev-score-input');
  input.focus();
  input.select();
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') applyDevScore();
    if (e.key === 'Escape') panel.remove();
  });
}

function applyDevScore() {
  const val = parseInt(document.getElementById('dev-score-input').value);
  if (isNaN(val) || val < 0) return;
  document.getElementById('dev-panel').remove();

  state.score = val;
  state.streak = 0;
  state.numInputs = Math.min(2 + Math.floor(val / 7), INPUTS_LABELS.length);

  document.getElementById('score-val').textContent = state.score;
  document.getElementById('streak-val').textContent = state.streak;
  document.getElementById('inputs-val').textContent = state.numInputs;
  updateProgress();
  nextQuestion();
  showToast('DEV: score ' + val + ', ' + state.numInputs + ' inputs', 'correct');
}
