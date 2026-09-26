// Support mode (shared/bc-support.js): the build plan beside the palette.
// One step per gate, innermost brackets first, each ticked off as soon as a
// gate on the board gives that part of the expression for every input. It
// fades as circuits come out right: every step with its inputs, then the
// gate types in order, then only the rule. A wrong submit shows one input
// row where the circuit and the expression disagree.
const Support = window.BCSupport || null;
const supportFader = Support ? Support.fader('logiccircuits:build') : null;
let lastSupportCircuit = null;
let supportMismatch = '';

function supportOn() { return !!(Support && Support.isOn()); }

// The expression's gates in the order they are built.
function planSteps(expr) {
  const steps = [];
  function walk(node) {
    if (node.op === 'VAR') return node.name;
    if (node.op === 'NOT') {
      const inner = walk(node.child);
      steps.push({ node, op: 'NOT', ins: [inner] });
    } else {
      const l = walk(node.left), r = walk(node.right);
      steps.push({ node, op: node.op, ins: [l, r] });
    }
    return '(' + steps.length + ')';
  }
  walk(expr);
  return steps;
}

// Every signal on the board for one row of inputs (the same passes as
// simulateCircuit).
function boardSignals(inputVals) {
  const signals = {};
  Object.keys(inputVals).forEach(k => { signals[`input_${k}_out`] = inputVals[k]; });
  for (let pass = 0; pass < state.placedGates.length + 2; pass++) {
    for (const gate of state.placedGates) {
      const inVals = [];
      for (let p = 0; p < GATE_DEFS[gate.type].inputs; p++) {
        const wire = state.wires.find(w => String(w.toId) === String(gate.id) && w.toPort === p);
        inVals.push(wire ? getSignalFrom(wire.fromId, wire.fromPort, signals) : null);
      }
      if (inVals.some(v => v === null || v === undefined)) continue;
      signals[`gate_${gate.id}_out`] = computeGate(gate.type, inVals);
    }
  }
  return signals;
}

function stepsBuilt(steps, rows) {
  const perRow = rows.map(row => boardSignals(row.vals));
  return steps.map(step => state.placedGates.some(gate => gate.type === step.op &&
    rows.every((row, i) => perRow[i][`gate_${gate.id}_out`] === evaluateExpr(step.node, row.vals))));
}

function refreshSupportPlan() {
  const panel = document.getElementById('build-plan');
  if (!panel) return;
  const q = state.currentQuestion;
  const reveal = supportOn() && supportFader && q ? supportFader.reveal() : 0;
  if (!reveal) { panel.hidden = true; panel.innerHTML = ''; return; }
  const steps = planSteps(q.expr);
  const rows = getTruthTable(q.expr, q.inputs);
  const built = stepsBuilt(steps, rows);
  let html = '<div class="palette-label">BUILD PLAN</div>';
  if (reveal > 0.9) {
    html += '<ol>' + steps.map((s, i) => '<li class="' + (built[i] ? 'is-done' : '') + '"><b>' + s.op + '</b> gate with ' +
      s.ins.join(', ') + (i === steps.length - 1 ? ', into Q' : '') + '</li>').join('') + '</ol>' +
      '<p class="plan-note">Each number is the output of that step.</p>';
  } else if (reveal > 0.5) {
    html += '<ol>' + steps.map((s, i) => '<li class="' + (built[i] ? 'is-done' : '') + '"><b>' + s.op + '</b></li>').join('') + '</ol>' +
      '<p class="plan-note">Brackets first. Which inputs go into each?</p>';
  } else {
    html += '<p class="plan-note">Brackets first: one gate for each AND, OR and NOT (' + steps.length + ' here).</p>';
  }
  if (supportMismatch && circuitSignature() === lastSupportCircuit) html += '<p class="plan-check">' + supportMismatch + '</p>';
  panel.innerHTML = html;
  panel.hidden = false;
}

function circuitSignature() {
  return JSON.stringify([state.placedGates.map(g => [g.id, g.type]), state.wires]);
}

// Called by checkAnswer. Submitting the same circuit twice counts once, and
// the disagreeing row shows until the circuit changes.
function recordSupportSubmit(correct) {
  supportMismatch = '';
  if (!supportOn() || !supportFader) return;
  const circuit = circuitSignature();
  if (circuit !== lastSupportCircuit) {
    lastSupportCircuit = circuit;
    if (correct) supportFader.correct(); else supportFader.wrong();
  }
  if (!correct) {
    const q = state.currentQuestion;
    const row = getTruthTable(q.expr, q.inputs).find(r => simulateCircuit(r.vals) !== r.out);
    if (row) {
      const got = simulateCircuit(row.vals);
      const ins = q.inputs.map(k => k + ' = ' + (row.vals[k] ? 1 : 0)).join(', ');
      supportMismatch = 'When ' + ins + ', Q should be ' + (row.out ? 1 : 0) + '. ' +
        (got === null || got === undefined ? 'Nothing reaches Q yet.' : 'Your circuit gives ' + (got ? 1 : 0) + '.');
    }
  }
  refreshSupportPlan();
}

function initSupport() {
  if (!Support) return;
  document.querySelectorAll('.support-slot').forEach(el => { if (!el.firstChild) Support.mountToggle(el, 'Support'); });
  Support.onChange(() => { supportMismatch = ''; refreshSupportPlan(); });
}
initSupport();
