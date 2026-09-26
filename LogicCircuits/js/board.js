// The gate palette, placing gates and dragging them.
// ===================== UI SETUP =====================
function buildPalette() {
  const palette = document.getElementById('palette');
  palette.innerHTML = '<div class="palette-label">GATES</div>';
  Object.keys(GATE_DEFS).forEach(type => {
    const def = GATE_DEFS[type];
    const div = document.createElement('div');
    div.className = 'palette-gate';
    div.innerHTML = makeGateSVG(type, def.color, true) +
      ``;
    div.addEventListener('mousedown', e => startPaletteDrag(e, type));
    palette.appendChild(div);
  });
}

function buildIONodes() {
  const container = document.getElementById('canvas-nodes');
  const wrap = document.getElementById('canvas-wrap');
  const h = wrap.clientHeight;
  const inputs = INPUTS_LABELS.slice(0, state.numInputs);
  const spacing = h / (inputs.length + 1);

  // Clear old IO nodes
  container.querySelectorAll('.io-node').forEach(n => n.remove());

  inputs.forEach((label, i) => {
    const y = spacing * (i + 1);
    const div = document.createElement('div');
    div.className = 'io-node input-node';
    div.id = `input_${label}`;
    div.style.top = (y - 7) + 'px';
    div.innerHTML = `<div class="io-label">${label}</div>
      <div class="io-anchor" data-nodeid="input_${label}" data-port="0" data-type="output" title="Drag to connect"></div>`;
    container.appendChild(div);
  });

  // Output node
  const outDiv = document.createElement('div');
  outDiv.className = 'io-node output-node';
  outDiv.id = 'output_Q';
  outDiv.style.top = (h/2 - 7) + 'px';
  outDiv.style.flexDirection = 'row-reverse';
  outDiv.innerHTML = `<div class="io-label">Q</div>
    <div class="io-anchor" data-nodeid="output_Q" data-port="0" data-type="input" title="Connect here"></div>`;
  container.appendChild(outDiv);

  setupAnchorDrag();
}

// ===================== DRAGGING FROM PALETTE =====================
let dragGhost = null;
let ghostType = null;

function startPaletteDrag(e, type) {
  e.preventDefault();
  ghostType = type;
  dragGhost = document.createElement('div');
  dragGhost.className = 'drag-ghost';
  dragGhost.innerHTML = makeGateSVG(type, GATE_DEFS[type].color);
  dragGhost.style.left = e.clientX + 'px';
  dragGhost.style.top = e.clientY + 'px';
  document.body.appendChild(dragGhost);

  document.addEventListener('mousemove', onPaletteDragMove);
  document.addEventListener('mouseup', onPaletteDragEnd);
}

function onPaletteDragMove(e) {
  if (!dragGhost) return;
  dragGhost.style.left = e.clientX + 'px';
  dragGhost.style.top = e.clientY + 'px';
  const bin = document.getElementById('bin');
  const br = bin.getBoundingClientRect();
  const over = e.clientX > br.left && e.clientX < br.right && e.clientY > br.top && e.clientY < br.bottom;
  bin.classList.toggle('drag-over', over);
}

function onPaletteDragEnd(e) {
  document.removeEventListener('mousemove', onPaletteDragMove);
  document.removeEventListener('mouseup', onPaletteDragEnd);
  if (!dragGhost) return;
  dragGhost.remove(); dragGhost = null;
  document.getElementById('bin').classList.remove('drag-over');

  const wrap = document.getElementById('canvas-wrap');
  const wr = wrap.getBoundingClientRect();
  const insideCanvas = e.clientX > wr.left && e.clientX < wr.right && e.clientY > wr.top && e.clientY < wr.bottom;
  const x = (e.clientX - wr.left) / zoom;
  const y = (e.clientY - wr.top) / zoom;

  // Check if dropped on bin
  const bin = document.getElementById('bin');
  const br = bin.getBoundingClientRect();
  if (e.clientX > br.left && e.clientX < br.right && e.clientY > br.top && e.clientY < br.bottom) return;

  // Place gate if inside canvas
  if (insideCanvas) {
    placeGate(ghostType, x - GATE_DEFS[ghostType].w/2, y - GATE_DEFS[ghostType].h/2);
  }
}

// ===================== GATE PLACEMENT =====================
function placeGate(type, x, y) {
  const id = 'g' + state.nextId++;
  const gate = { id, type, x, y };
  state.placedGates.push(gate);
  renderGate(gate);
  drawWires();
}

function renderGate(gate) {
  const container = document.getElementById('canvas-nodes');
  const def = GATE_DEFS[gate.type];
  const anchors = getAnchors(gate.type);

  const div = document.createElement('div');
  div.className = 'placed-gate';
  div.id = `gate_${gate.id}`;
  div.style.left = gate.x + 'px';
  div.style.top = gate.y + 'px';

  // Build SVG with anchor circles
  const svgW = def.w + 20;
  const svgH = def.h + 10;

  let anchorsSVG = '';
  anchors.inputs.forEach((a, i) => {
    anchorsSVG += `<g class="gate-anchor" data-gateid="${gate.id}" data-port="${i}" data-type="input">
      <circle cx="${a.x}" cy="${a.y}" r="9" fill="transparent" stroke="none"/>
    </g>`;
  });
  const out = anchors.output;
  anchorsSVG += `<g class="gate-anchor" data-gateid="${gate.id}" data-port="0" data-type="output">
    <circle cx="${out.x}" cy="${out.y}" r="9" fill="transparent" stroke="none"/>
  </g>`;

  div.innerHTML = `<svg width="${def.w + 15}" height="${def.h}" viewBox="0 0 ${def.w + 15} ${def.h}" xmlns="http://www.w3.org/2000/svg">
    ${gateShape(gate.type, def.color)}
    ${anchorsSVG}
  </svg>`;

  // Gate dragging
  div.addEventListener('mousedown', e => {
    if (e.target.closest('.gate-anchor')) return;
    startGateDrag(e, gate);
  });

  // Anchor wiring
  div.querySelectorAll('.gate-anchor').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      const port = parseInt(el.dataset.port);
      const type = el.dataset.type;
      const id = el.dataset.gateid; // keep as string
      startWireDrag(e, id, port, type);
    });
  });

  container.appendChild(div);
}

// ===================== GATE DRAGGING =====================
function startGateDrag(e, gate) {
  e.preventDefault();
  const wrap = document.getElementById('canvas-wrap');
  const wr = wrap.getBoundingClientRect();
  const startX = (e.clientX - wr.left) / zoom - gate.x;
  const startY = (e.clientY - wr.top) / zoom - gate.y;

  function onMove(ev) {
    gate.x = (ev.clientX - wr.left) / zoom - startX;
    gate.y = (ev.clientY - wr.top) / zoom - startY;
    const el = document.getElementById(`gate_${gate.id}`);
    if (el) { el.style.left = gate.x + 'px'; el.style.top = gate.y + 'px'; }
    drawWires();

    // Check bin
    const bin = document.getElementById('bin');
    const br = bin.getBoundingClientRect();
    const over = ev.clientX > br.left && ev.clientX < br.right && ev.clientY > br.top && ev.clientY < br.bottom;
    bin.classList.toggle('drag-over', over);
  }

  function onUp(ev) {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.getElementById('bin').classList.remove('drag-over');

    const bin = document.getElementById('bin');
    const br = bin.getBoundingClientRect();
    if (ev.clientX > br.left && ev.clientX < br.right && ev.clientY > br.top && ev.clientY < br.bottom) {
      deleteGate(gate.id);
    }
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function deleteGate(id) {
  const sid = String(id);
  state.placedGates = state.placedGates.filter(g => String(g.id) !== sid);
  state.wires = state.wires.filter(w => String(w.fromId) !== sid && String(w.toId) !== sid);
  const el = document.getElementById(`gate_${id}`);
  if (el) el.remove();
  drawWires();
}
