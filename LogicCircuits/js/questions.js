// Question generation and evaluating the student circuit.
// ===================== QUESTION GENERATION =====================
const INPUTS_LABELS = ['A','B','C','D','E','F'];

let state = {
  score: 0,
  streak: 0,
  numInputs: 2,
  currentQuestion: null,
  placedGates: [],   // {id, type, x, y}
  wires: [],         // {fromId, fromPort, toId, toPort}
  nextId: 1,
  draggingGate: null,
  draggingWire: null,
  selectedGate: null,
};

// Expression tree node
function exprNode(op, left, right) { return {op, left, right}; }
function leafNode(name) { return {op:'VAR', name}; }
function notNode(child) { return {op:'NOT', child}; }

function generateQuestion(numInputs, difficulty) {
  const inputs = INPUTS_LABELS.slice(0, numInputs);
  // difficulty 0-2: simple, 3-5: medium, 6+: complex
  let expr;
  if (difficulty < 2) {
    const ops = ['AND','OR'];
    const op = ops[Math.floor(Math.random()*ops.length)];
    const a = inputs[0], b = inputs[1];
    if (numInputs === 1) {
      expr = notNode(leafNode(a));
    } else {
      expr = exprNode(op, leafNode(a), leafNode(b));
    }
  } else if (difficulty < 5) {
    const op1 = ['AND','OR'][Math.floor(Math.random()*2)];
    const op2 = ['AND','OR'][Math.floor(Math.random()*2)];
    const useNot = Math.random() > 0.5;
    const a = inputs[0], b = inputs[1];
    const c = inputs[Math.min(2, numInputs-1)];
    if (numInputs >= 3) {
      if (useNot) {
        expr = exprNode(op1, notNode(leafNode(a)), exprNode(op2, leafNode(b), leafNode(c)));
      } else {
        expr = exprNode(op1, exprNode(op2, leafNode(a), leafNode(b)), leafNode(c));
      }
    } else {
      if (useNot) {
        expr = exprNode(op1, notNode(leafNode(a)), leafNode(b));
      } else {
        expr = notNode(exprNode(op2, leafNode(a), leafNode(b)));
      }
    }
  } else {
    const available = inputs.slice();
    // Pool that cycles through inputs without repeating until all used
    const pool = available.slice().sort(() => Math.random() - 0.5);
    let poolIdx = 0;
    function nextInput() {
      if (poolIdx >= pool.length) {
        // Reshuffle but avoid repeating last used
        const last = pool[pool.length - 1];
        pool.sort(() => Math.random() - 0.5);
        if (pool[0] === last && pool.length > 1) { pool.push(pool.shift()); }
        poolIdx = 0;
      }
      return pool[poolIdx++];
    }
    function randomExpr(depth) {
      if (depth === 0) return leafNode(nextInput());
      const useNot = depth > 1 && Math.random() > 0.6;
      if (useNot) return notNode(randomExpr(depth - 1));
      const ops = ['AND','OR'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      const left = randomExpr(depth - 1);
      const right = randomExpr(depth - 1);
      return exprNode(op, left, right);
    }
    expr = randomExpr(Math.min(3, Math.floor(difficulty / 2)));
  }
  // Regenerate if any gate has the same input on both sides
  if (hasSelfComparison(expr)) return generateQuestion(numInputs, difficulty);
  return { expr, inputs };
}

// Check if any node has the same variable on both sides (e.g. A OR A)
function hasSelfComparison(expr) {
  if (!expr || expr.op === 'VAR') return false;
  if (expr.op === 'NOT') return hasSelfComparison(expr.child);
  // Both sides are plain variables and identical
  if (expr.left.op === 'VAR' && expr.right.op === 'VAR' && expr.left.name === expr.right.name) return true;
  return hasSelfComparison(expr.left) || hasSelfComparison(expr.right);
}

function exprToString(expr, topLevel = true) {
  if (!expr) return '?';
  if (expr.op === 'VAR') return expr.name;
  if (expr.op === 'NOT') {
    const child = exprToString(expr.child, false);
    return `NOT ${child}`;
  }
  const left = exprToString(expr.left, false);
  const right = exprToString(expr.right, false);
  const str = `${left} ${expr.op} ${right}`;
  return topLevel ? str : `(${str})`;
}

function evaluateExpr(expr, vals) {
  if (expr.op === 'VAR') return vals[expr.name];
  if (expr.op === 'NOT') return !evaluateExpr(expr.child, vals);
  const l = evaluateExpr(expr.left, vals);
  const r = evaluateExpr(expr.right, vals);
  switch(expr.op) {
    case 'AND':  return l && r;
    case 'OR':   return l || r;
    case 'NAND': return !(l && r);
    case 'NOR':  return !(l || r);
    case 'XOR':  return l !== r;
  }
}

function getTruthTable(expr, inputs) {
  const rows = [];
  const n = inputs.length;
  for (let i = 0; i < (1<<n); i++) {
    const vals = {};
    inputs.forEach((inp, j) => vals[inp] = !!(i & (1<<(n-1-j))));
    rows.push({ vals, out: evaluateExpr(expr, vals) });
  }
  return rows;
}

// ===================== CIRCUIT EVALUATION =====================
// Evaluate the user's placed circuit against all truth table rows
function evaluateCircuit(truthTable, inputs) {
  // Build adjacency: for each node's input port, what is connected?
  // Nodes: input_A, input_B, ..., gate_N, output_Q
  // Wire: {from: nodeId+port, to: nodeId+port}

  let allCorrect = true;
  for (const row of truthTable) {
    const result = simulateCircuit(row.vals);
    if (result === null || result !== row.out) { allCorrect = false; break; }
  }
  return allCorrect;
}

function simulateCircuit(inputVals) {
  const signals = {};

  // Input signals
  Object.keys(inputVals).forEach(k => {
    signals[`input_${k}_out`] = inputVals[k];
  });

  const maxPasses = state.placedGates.length + 2;
  for (let pass = 0; pass < maxPasses; pass++) {
    for (const gate of state.placedGates) {
      const numIn = GATE_DEFS[gate.type].inputs;
      const inVals = [];
      for (let p = 0; p < numIn; p++) {
        const wire = state.wires.find(w => String(w.toId) === String(gate.id) && w.toPort === p);
        if (!wire) { inVals.push(null); continue; }
        const sig = getSignalFrom(wire.fromId, wire.fromPort, signals);
        inVals.push(sig);
      }
      if (inVals.includes(null)) continue;
      signals[`gate_${gate.id}_out`] = computeGate(gate.type, inVals);
    }
  }

  const outWire = state.wires.find(w => String(w.toId) === 'output_Q');
  if (!outWire) return null;
  return getSignalFrom(outWire.fromId, outWire.fromPort, signals);
}

function getSignalFrom(fromId, fromPort, signals) {
  const id = String(fromId);
  if (id.startsWith('input_')) return signals[`${id}_out`];
  return signals[`gate_${id}_out`];
}

function computeGate(type, inputs) {
  const [a, b] = inputs;
  switch(type) {
    case 'AND': return a && b;
    case 'OR':  return a || b;
    case 'NOT': return !a;
  }
}
