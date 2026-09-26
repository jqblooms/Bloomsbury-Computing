// Dragging and drawing wires.
// ===================== WIRE DRAGGING =====================
let wireDrawing = null;

function getAnchorPos(nodeId, port, portType) {
  const wrap = document.getElementById('canvas-wrap');
  const wr = wrap.getBoundingClientRect();
  const id = String(nodeId);

  if (id.startsWith('input_')) {
    const el = document.getElementById(id);
    if (!el) return null;
    const anchor = el.querySelector('.io-anchor');
    const ar = anchor.getBoundingClientRect();
    return { x: (ar.left - wr.left) / zoom + 7, y: (ar.top - wr.top) / zoom + 7 };
  }
  if (id === 'output_Q') {
    const el = document.getElementById('output_Q');
    if (!el) return null;
    const anchor = el.querySelector('.io-anchor');
    const ar = anchor.getBoundingClientRect();
    return { x: (ar.left - wr.left) / zoom + 7, y: (ar.top - wr.top) / zoom + 7 };
  }

  // Gate anchor
  const gate = state.placedGates.find(g => String(g.id) === id);
  if (!gate) return null;
  const anchors = getAnchors(gate.type);
  if (portType === 'output') {
    return { x: gate.x + anchors.output.x, y: gate.y + anchors.output.y };
  } else {
    const a = anchors.inputs[port];
    if (!a) return null;
    return { x: gate.x + a.x, y: gate.y + a.y };
  }
}

function setupAnchorDrag() {
  document.getElementById('canvas-nodes').querySelectorAll('.io-anchor').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      const nodeId = el.dataset.nodeid;
      const port = parseInt(el.dataset.port);
      const type = el.dataset.type; // 'output' = can start wire, 'input' = endpoint
      startWireDrag(e, nodeId, port, type);
    });
  });
}

function startWireDrag(e, fromId, fromPort, fromType) {
  e.preventDefault();
  wireDrawing = { fromId, fromPort, fromType };
  const wrap = document.getElementById('canvas-wrap');
  const wr = wrap.getBoundingClientRect();

  // Create preview SVG
  const previewSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
  previewSVG.setAttribute('class','wire-preview');
  previewSVG.style.position = 'absolute';
  previewSVG.style.top = '0'; previewSVG.style.left = '0';
  previewSVG.style.width = '100%'; previewSVG.style.height = '100%';
  previewSVG.style.pointerEvents = 'none';
  previewSVG.style.zIndex = '5';
  document.getElementById('canvas-zoom-layer').appendChild(previewSVG);

  const previewPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  previewPath.setAttribute('stroke','#e8eaed');
  previewPath.setAttribute('stroke-width','2');
  previewPath.setAttribute('fill','none');
  previewPath.setAttribute('stroke-dasharray','6 3');
  previewSVG.appendChild(previewPath);

  // Highlight valid anchors
  highlightValidAnchors(fromType, fromId);

  function onMove(ev) {
    const mx = (ev.clientX - wr.left) / zoom;
    const my = (ev.clientY - wr.top) / zoom;
    const startPos = fromType === 'output'
      ? getAnchorPos(fromId, fromPort, 'output')
      : getAnchorPos(fromId, fromPort, 'input');
    if (!startPos) return;
    const d = bezierPath(startPos.x, startPos.y, mx, my);
    previewPath.setAttribute('d', d);
  }

  function onUp(ev) {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    previewSVG.remove();
    clearHighlights();

    // Find what we dropped on
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!target) { wireDrawing = null; return; }

    const anchor = target.closest('[data-type]');
    if (!anchor) { wireDrawing = null; return; }

    const toType = anchor.dataset.type;
    const toNodeId = anchor.dataset.nodeid || anchor.dataset.gateid || null;
    const toPort = parseInt(anchor.dataset.port || 0);

    // Must connect output -> input or input -> output
    if (fromType === toType) { wireDrawing = null; return; }
    if (toNodeId === null) { wireDrawing = null; return; }

    let from, to, fromP, toP;
    if (fromType === 'output') {
      from = fromId; fromP = fromPort;
      to = toNodeId; toP = toPort;
    } else {
      from = toNodeId; fromP = toPort;
      to = fromId; toP = fromPort;
    }

    // Reject: circuit input node cannot connect directly to output node or another input node
    const fromIsInputNode = String(from).startsWith('input_');
    const toIsOutputNode = String(to) === 'output_Q';
    const toIsInputNode = String(to).startsWith('input_');
    if (fromIsInputNode && toIsOutputNode) { wireDrawing = null; return; }
    if (toIsInputNode) { wireDrawing = null; return; }

    // Remove existing wire to same input
    state.wires = state.wires.filter(w => !(w.toId === to && w.toPort === toP));

    state.wires.push({ fromId: from, fromPort: fromP, toId: to, toPort: toP });
    wireDrawing = null;
    drawWires();
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function highlightValidAnchors(fromType, fromId) {
  const targetType = fromType === 'output' ? 'input' : 'output';
  document.querySelectorAll(`[data-type="${targetType}"]`).forEach(el => {
    const nodeId = el.dataset.nodeid || el.dataset.gateid || '';
    // Input nodes cannot connect directly to output_Q or other input nodes
    const srcIsInput = String(fromId).startsWith('input_');
    if (srcIsInput && (nodeId === 'output_Q' || String(nodeId).startsWith('input_'))) return;
    el.classList.add('highlight');
  });
}
function clearHighlights() {
  document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
}

function bezierPath(x1,y1,x2,y2) {
  const cx = (x1+x2)/2;
  return `M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`;
}

// ===================== WIRE RENDERING =====================
function drawWires() {
  const svg = document.getElementById('circuit-canvas');
  svg.innerHTML = '';
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');

  for (const wire of state.wires) {
    const from = getAnchorPos(wire.fromId, wire.fromPort, 'output');
    const to = getAnchorPos(wire.toId, wire.toPort, 'input');
    if (!from || !to) continue;

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', bezierPath(from.x, from.y, to.x, to.y));
    path.setAttribute('stroke', '#e8eaed');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.8');
    svg.appendChild(path);

    // Dot at start/end
    [from, to].forEach(pt => {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r','3');
      c.setAttribute('fill','#e8eaed');
      svg.appendChild(c);
    });
  }
  if (window.refreshSupportPlan) refreshSupportPlan();
}
