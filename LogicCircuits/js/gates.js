// Gate drawings (SVG) and canvas zoom.
// ===================== GATE SVG DEFINITIONS =====================
const GATE_DEFS = {
  AND: { color: '#e8eaed', inputs: 2, w: 70, h: 50 },
  OR:  { color: '#e8eaed', inputs: 2, w: 70, h: 50 },
  NOT: { color: '#e8eaed', inputs: 1, w: 60, h: 40 },
};

// ===================== CANVAS ZOOM =====================
// The zoom layer sits inside canvas-wrap and is the only thing scaled;
// canvas-wrap itself stays unscaled so its getBoundingClientRect() keeps
// working as the stable "local coordinate origin" every drag/wire
// calculation is built on. Any place that turns clientX/clientY into a
// position on the canvas has to divide by zoom to convert screen pixels
// into the zoom layer's local units.
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
let zoom = 1;

function setZoom(z) {
  zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  const layer = document.getElementById('canvas-zoom-layer');
  if (layer) layer.style.transform = 'scale(' + zoom + ')';
  const slider = document.getElementById('zoom-slider');
  if (slider) slider.value = Math.round(zoom * 100);
  const label = document.getElementById('zoom-val');
  if (label) label.textContent = Math.round(zoom * 100) + '%';
  drawWires();
}

function initZoomControl() {
  const wrap = document.getElementById('canvas-wrap');
  const slider = document.getElementById('zoom-slider');
  const inBtn = document.getElementById('zoom-in-btn');
  const outBtn = document.getElementById('zoom-out-btn');
  const resetBtn = document.getElementById('zoom-reset-btn');

  slider.addEventListener('input', () => setZoom(slider.value / 100));
  inBtn.addEventListener('click', () => setZoom(zoom + 0.1));
  outBtn.addEventListener('click', () => setZoom(zoom - 0.1));
  resetBtn.addEventListener('click', () => setZoom(1));

  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const step = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + step);
  }, { passive: false });
}

function makeGateSVG(type, color, small = false) {
  const scale = small ? 0.75 : 1;
  const w = GATE_DEFS[type].w * scale;
  const h = GATE_DEFS[type].h * scale;
  const s = `<svg width="${w}" height="${h}" viewBox="0 0 ${GATE_DEFS[type].w} ${GATE_DEFS[type].h}" xmlns="http://www.w3.org/2000/svg">
    ${gateShape(type, color)}
  </svg>`;
  return s;
}

function gateShape(type, color) {
  switch(type) {
    case 'AND': return `
      <path d="M10 8 L30 8 Q50 8 50 25 Q50 42 30 42 L10 42 Z" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="16" x2="10" y2="16" stroke="${color}" stroke-width="1.5"/>
      <line x1="0" y1="34" x2="10" y2="34" stroke="${color}" stroke-width="1.5"/>
      <line x1="50" y1="25" x2="60" y2="25" stroke="${color}" stroke-width="1.5"/>`;
    case 'OR': return `
      <path d="M10 8 Q20 8 35 8 Q55 8 58 25 Q55 42 35 42 Q20 42 10 42 Q18 30 18 25 Q18 20 10 8 Z" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="16" x2="13" y2="16" stroke="${color}" stroke-width="1.5"/>
      <line x1="0" y1="34" x2="13" y2="34" stroke="${color}" stroke-width="1.5"/>
      <line x1="58" y1="25" x2="68" y2="25" stroke="${color}" stroke-width="1.5"/>`;
    case 'NOT': return `
      <path d="M8 5 L48 20 L8 35 Z" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <circle cx="51" cy="20" r="4" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="20" x2="8" y2="20" stroke="${color}" stroke-width="1.5"/>
      <line x1="55" y1="20" x2="60" y2="20" stroke="${color}" stroke-width="1.5"/>`;
    case 'NAND': return `
      <path d="M10 8 L30 8 Q50 8 50 25 Q50 42 30 42 L10 42 Z" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <circle cx="54" cy="25" r="4" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="16" x2="10" y2="16" stroke="${color}" stroke-width="1.5"/>
      <line x1="0" y1="34" x2="10" y2="34" stroke="${color}" stroke-width="1.5"/>
      <line x1="58" y1="25" x2="70" y2="25" stroke="${color}" stroke-width="1.5"/>`;
    case 'NOR': return `
      <path d="M10 8 Q20 8 35 8 Q55 8 58 25 Q55 42 35 42 Q20 42 10 42 Q18 30 18 25 Q18 20 10 8 Z" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <circle cx="62" cy="25" r="4" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="16" x2="13" y2="16" stroke="${color}" stroke-width="1.5"/>
      <line x1="0" y1="34" x2="13" y2="34" stroke="${color}" stroke-width="1.5"/>
      <line x1="66" y1="25" x2="70" y2="25" stroke="${color}" stroke-width="1.5"/>`;
    case 'XOR': return `
      <path d="M13 8 Q23 8 38 8 Q58 8 61 25 Q58 42 38 42 Q23 42 13 42 Q21 30 21 25 Q21 20 13 8 Z" fill="#1d2128" stroke="${color}" stroke-width="2"/>
      <path d="M8 8 Q16 25 8 42" fill="none" stroke="${color}" stroke-width="2"/>
      <line x1="0" y1="16" x2="16" y2="16" stroke="${color}" stroke-width="1.5"/>
      <line x1="0" y1="34" x2="16" y2="34" stroke="${color}" stroke-width="1.5"/>
      <line x1="61" y1="25" x2="70" y2="25" stroke="${color}" stroke-width="1.5"/>`;
  }
}

// Anchor positions relative to gate top-left
function getAnchors(type) {
  const scale = 1;
  switch(type) {
    case 'AND':  return { inputs: [{x:0,y:16},{x:0,y:34}], output: {x:60,y:25} };
    case 'OR':   return { inputs: [{x:0,y:16},{x:0,y:34}], output: {x:68,y:25} };
    case 'NOT':  return { inputs: [{x:0,y:20}],             output: {x:60,y:20} };
    case 'NAND': return { inputs: [{x:0,y:16},{x:0,y:34}], output: {x:70,y:25} };
    case 'NOR':  return { inputs: [{x:0,y:16},{x:0,y:34}], output: {x:70,y:25} };
    case 'XOR':  return { inputs: [{x:0,y:16},{x:0,y:34}], output: {x:70,y:25} };
  }
}
