// Network Help Desk art, all drawn in canvas code (no image files): the cast's portraits with moods, and the network
// devices for the computer's network map. Flat illustration with a dark outline and one soft shadow tone per colour.
const INK = '#1d1a26';

// ---------------------------------------------------------------- the cast
// skin, hair colour, hair style, clothes, accent, extra (hat, glasses, headset...), background
export const CAST = {
  baker:     { skin: '#e8b48f', hair: '#3b2418', style: 'bun',    top: '#f4efe6', accent: '#d97a3a', extra: 'chef',      bg: '#f7c873', name: 'Maria' },
  librarian: { skin: '#7a4a2e', hair: '#1c1410', style: 'short',  top: '#5a6e9a', accent: '#c94a4a', extra: 'glasses',   bg: '#a8c3e8', name: 'Mr Okafor' },
  barista:   { skin: '#f0c9a0', hair: '#14121a', style: 'fringe', top: '#2f7a5a', accent: '#f1e2c4', extra: 'apron',     bg: '#b6e3c6', name: 'Jin' },
  vet:       { skin: '#b27552', hair: '#20140f', style: 'pony',   top: '#3fa3a3', accent: '#dfe7ea', extra: 'stetho',    bg: '#9fe0dc', name: 'Dr Patel' },
  secretary: { skin: '#f2cfae', hair: '#231a1a', style: 'bob',    top: '#b5557a', accent: '#f3ece3', extra: 'pearls',    bg: '#f2b8cc', name: 'Mrs Wong' },
  supplies:  { skin: '#a8714f', hair: '#1a1210', style: 'buns',   top: '#3d4a5c', accent: '#d8f04a', extra: 'vest',      bg: '#ffd9a8', name: 'Priya' },
  builder:   { skin: '#f0c0a0', hair: '#8a5a3a', style: 'beard',  top: '#e86a2a', accent: '#f2e94a', extra: 'hardhat',   bg: '#ffe08a', name: 'Mr Hughes' },
  internet:  { skin: '#5e3b28', hair: '#120c0a', style: 'curly',  top: '#6b4fc4', accent: '#ffffff', extra: 'headset',   bg: '#cbbcff', name: 'Sam' },
  techlead:  { skin: '#e2a982', hair: '#4a2f22', style: 'messy',  top: '#2e3440', accent: '#ff8f3f', extra: 'hoodie',    bg: '#9ad0ff', name: 'Alex' },
};
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
}
function blob(g, fill, line, draw, w = 4) { g.beginPath(); draw(); g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = line; g.stroke(); }
const ell = (g, x, y, rx, ry, rot = 0) => () => g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
function rr(g, x, y, w, h, r) { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/** A head and shoulders in a 200 x 200 box at (x, y) scaled to size. mood: calm, worried, happy, talk. */
export function portrait(g, look, x, y, size, mood = 'calm', round = true) {
  const c = CAST[look] || CAST.techlead;
  g.save(); g.translate(x, y); g.scale(size / 200, size / 200);
  if (round) { g.beginPath(); g.arc(100, 100, 100, 0, Math.PI * 2); g.clip(); }
  // background with a soft sunburst
  g.fillStyle = c.bg; g.fillRect(0, 0, 200, 200);
  g.globalAlpha = 0.18; g.fillStyle = '#ffffff';
  for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(100, 120); g.arc(100, 120, 160, i * Math.PI / 6, i * Math.PI / 6 + Math.PI / 14); g.closePath(); g.fill(); }
  g.globalAlpha = 1;
  // shoulders and clothes
  blob(g, c.top, INK, () => { g.moveTo(18, 205); g.bezierCurveTo(22, 150, 55, 138, 100, 138); g.bezierCurveTo(145, 138, 178, 150, 182, 205); g.closePath(); });
  g.fillStyle = shade(c.top, -0.18); g.beginPath(); g.moveTo(100, 140); g.bezierCurveTo(140, 140, 170, 152, 176, 205); g.lineTo(150, 205); g.bezierCurveTo(146, 168, 128, 150, 100, 146); g.closePath(); g.fill();
  // neck
  blob(g, shade(c.skin, -0.12), INK, () => rr(g, 86, 112, 28, 34, 10), 3);
  // clothes details
  if (c.extra === 'apron' || c.extra === 'chef') { blob(g, c.extra === 'chef' ? '#ffffff' : c.accent, INK, () => { g.moveTo(70, 205); g.lineTo(74, 150); g.lineTo(126, 150); g.lineTo(130, 205); g.closePath(); }, 3); }
  if (c.extra === 'vest') { g.fillStyle = c.accent; g.fillRect(40, 160, 24, 45); g.fillRect(136, 160, 24, 45); g.fillStyle = '#c9c9c9'; g.fillRect(40, 178, 24, 6); g.fillRect(136, 178, 24, 6); }
  if (c.extra === 'hardhat') { g.fillStyle = c.accent; g.fillRect(44, 165, 20, 40); g.fillRect(136, 165, 20, 40); }
  if (c.extra === 'hoodie') { blob(g, shade(c.top, 0.12), INK, () => { g.moveTo(60, 150); g.quadraticCurveTo(100, 175, 140, 150); g.quadraticCurveTo(100, 160, 60, 150); }, 3); g.strokeStyle = c.accent; g.lineWidth = 3; g.beginPath(); g.moveTo(92, 160); g.lineTo(90, 185); g.moveTo(108, 160); g.lineTo(110, 185); g.stroke(); }
  if (c.extra === 'pearls') { g.fillStyle = c.accent; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.0875); g.beginPath(); g.arc(100 + Math.cos(a) * 26, 140 + Math.sin(a) * 10, 3.4, 0, 7); g.fill(); } }
  if (c.extra === 'stetho') { g.strokeStyle = '#2b2b33'; g.lineWidth = 4; g.beginPath(); g.moveTo(78, 140); g.quadraticCurveTo(70, 180, 92, 188); g.moveTo(122, 140); g.quadraticCurveTo(130, 175, 112, 186); g.stroke(); g.fillStyle = '#c0c6cc'; g.beginPath(); g.arc(100, 190, 7, 0, 7); g.fill(); g.stroke(); }
  if (c.extra === 'glasses' || c.look === 'librarian') { g.fillStyle = c.accent; g.beginPath(); g.moveTo(88, 146); g.lineTo(100, 152); g.lineTo(88, 158); g.closePath(); g.moveTo(112, 146); g.lineTo(100, 152); g.lineTo(112, 158); g.closePath(); g.fill(); }
  // hair behind the head
  const hairBack = { bun: () => g.arc(100, 40, 22, 0, 7), pony: () => { g.ellipse(140, 95, 16, 40, 0.3, 0, 7); }, bob: () => rr(g, 52, 50, 96, 82, 30), buns: () => { g.arc(58, 50, 16, 0, 7); g.moveTo(158, 50); g.arc(142, 50, 16, 0, 7); }, curly: () => g.arc(100, 68, 52, 0, 7) }[c.style];
  if (hairBack) blob(g, c.hair, INK, () => { g.beginPath(); hairBack(); });
  // head
  blob(g, c.skin, INK, ell(g, 100, 82, 40, 46));
  g.fillStyle = shade(c.skin, -0.1); g.beginPath(); g.ellipse(112, 92, 26, 34, 0, -0.6, 1.9); g.fill();
  // ears
  blob(g, c.skin, INK, ell(g, 60, 86, 8, 11), 3); blob(g, c.skin, INK, ell(g, 140, 86, 8, 11), 3);
  // hair on top
  const hairTop = {
    short: () => { g.moveTo(60, 80); g.bezierCurveTo(58, 36, 142, 36, 140, 80); g.bezierCurveTo(128, 58, 72, 58, 60, 80); },
    bun: () => { g.moveTo(58, 86); g.bezierCurveTo(54, 30, 146, 30, 142, 86); g.bezierCurveTo(130, 54, 70, 54, 58, 86); },
    fringe: () => { g.moveTo(58, 86); g.bezierCurveTo(52, 24, 150, 26, 142, 86); g.lineTo(134, 70); g.lineTo(120, 74); g.lineTo(106, 64); g.lineTo(90, 72); g.lineTo(74, 64); g.closePath(); },
    pony: () => { g.moveTo(58, 88); g.bezierCurveTo(52, 28, 148, 28, 142, 88); g.bezierCurveTo(124, 50, 80, 50, 58, 88); },
    bob: () => { g.moveTo(56, 120); g.bezierCurveTo(44, 26, 156, 26, 144, 120); g.lineTo(134, 120); g.bezierCurveTo(140, 66, 104, 56, 98, 62); g.bezierCurveTo(80, 62, 62, 76, 66, 120); g.closePath(); },
    buns: () => { g.moveTo(58, 86); g.bezierCurveTo(54, 32, 146, 32, 142, 86); g.bezierCurveTo(124, 60, 76, 60, 58, 86); },
    beard: () => { g.moveTo(62, 74); g.bezierCurveTo(62, 40, 138, 40, 138, 74); g.bezierCurveTo(120, 60, 80, 60, 62, 74); },
    curly: () => { for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * 0.11); g.moveTo(100 + Math.cos(a) * 44 + 14, 74 + Math.sin(a) * 40); g.arc(100 + Math.cos(a) * 44, 74 + Math.sin(a) * 40, 14, 0, 7); } },
    messy: () => { g.moveTo(58, 84); g.lineTo(54, 56); g.lineTo(70, 62); g.lineTo(72, 36); g.lineTo(90, 50); g.lineTo(100, 30); g.lineTo(112, 50); g.lineTo(130, 36); g.lineTo(130, 60); g.lineTo(146, 56); g.lineTo(142, 84); g.bezierCurveTo(126, 60, 74, 60, 58, 84); },
  }[c.style];
  if (hairTop) blob(g, c.hair, INK, () => { g.beginPath(); hairTop(); });
  if (c.style === 'beard') blob(g, c.hair, INK, () => { g.beginPath(); g.moveTo(64, 92); g.bezierCurveTo(66, 140, 134, 140, 136, 92); g.bezierCurveTo(124, 112, 76, 112, 64, 92); });
  // face
  const eyeY = 86, browY = mood === 'worried' ? 72 : 74;
  g.fillStyle = INK;
  for (const ex of [84, 116]) {
    if (mood === 'happy') { g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.arc(ex, eyeY + 3, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else { g.beginPath(); g.ellipse(ex, eyeY, 5.5, 7, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex + 2, eyeY - 3, 2, 0, 7); g.fill(); g.fillStyle = INK; }
  }
  g.lineWidth = 4; g.strokeStyle = shade(c.hair, 0.05); g.lineCap = 'round';
  g.beginPath();
  if (mood === 'worried') { g.moveTo(74, browY + 2); g.lineTo(92, browY - 3); g.moveTo(126, browY + 2); g.lineTo(108, browY - 3); }
  else { g.moveTo(75, browY); g.quadraticCurveTo(84, browY - 5, 93, browY); g.moveTo(107, browY); g.quadraticCurveTo(116, browY - 5, 125, browY); }
  g.stroke();
  // cheeks
  g.fillStyle = 'rgba(232, 96, 96, 0.28)'; g.beginPath(); g.ellipse(76, 102, 9, 5, 0, 0, 7); g.ellipse(124, 102, 9, 5, 0, 0, 7); g.fill();
  // nose
  g.strokeStyle = shade(c.skin, -0.35); g.lineWidth = 3; g.beginPath(); g.moveTo(100, 90); g.quadraticCurveTo(96, 101, 102, 103); g.stroke();
  // mouth
  g.strokeStyle = INK; g.lineWidth = 3.5;
  if (mood === 'happy') { blob(g, '#7a2b34', INK, () => { g.moveTo(86, 110); g.quadraticCurveTo(100, 128, 114, 110); g.closePath(); }, 3); }
  else if (mood === 'talk') { blob(g, '#7a2b34', INK, ell(g, 100, 114, 8, 6), 3); }
  else if (mood === 'worried') { g.beginPath(); g.moveTo(89, 118); g.quadraticCurveTo(100, 110, 111, 118); g.stroke(); }
  else { g.beginPath(); g.moveTo(90, 112); g.quadraticCurveTo(100, 118, 110, 112); g.stroke(); }
  // extras on the head
  if (c.extra === 'glasses') { g.strokeStyle = '#2a2a2a'; g.lineWidth = 3.5; g.beginPath(); g.arc(84, 86, 12, 0, 7); g.moveTo(128, 86); g.arc(116, 86, 12, 0, 7); g.moveTo(96, 86); g.lineTo(104, 86); g.stroke(); }
  if (c.extra === 'hoodie') { g.strokeStyle = '#1a1a1a'; g.lineWidth = 3.5; g.beginPath(); rr(g, 70, 76, 26, 20, 6); rr(g, 104, 76, 26, 20, 6); g.moveTo(96, 84); g.lineTo(104, 84); g.stroke(); }
  if (c.extra === 'chef') blob(g, '#ffffff', INK, () => { g.moveTo(66, 52); g.lineTo(134, 52); g.lineTo(130, 34); g.bezierCurveTo(150, 22, 138, -2, 118, 8); g.bezierCurveTo(110, -8, 88, -8, 82, 8); g.bezierCurveTo(62, -2, 50, 22, 70, 34); g.closePath(); });
  if (c.extra === 'hardhat') { blob(g, c.accent, INK, () => { g.moveTo(54, 60); g.bezierCurveTo(56, 12, 144, 12, 146, 60); g.closePath(); }); blob(g, shade(c.accent, -0.15), INK, () => rr(g, 46, 56, 108, 10, 5), 3); }
  if (c.extra === 'headset') { g.strokeStyle = '#222'; g.lineWidth = 6; g.beginPath(); g.arc(100, 80, 46, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); blob(g, '#2a2a33', INK, () => rr(g, 48, 74, 14, 26, 6), 3); blob(g, '#2a2a33', INK, () => rr(g, 138, 74, 14, 26, 6), 3); g.lineWidth = 4; g.beginPath(); g.moveTo(56, 98); g.quadraticCurveTo(64, 120, 86, 118); g.stroke(); g.fillStyle = '#2a2a33'; g.beginPath(); g.arc(88, 118, 4, 0, 7); g.fill(); }
  if (c.extra === 'pearls') { g.fillStyle = c.accent; g.beginPath(); g.arc(61, 98, 3.5, 0, 7); g.arc(139, 98, 3.5, 0, 7); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- the network devices (for the computer's map)
const DEV = { laptop: '#4f6bd8', desktop: '#3c4a63', tablet: '#e0577a', printer: '#8a96a8', switch4: '#2f9e76', switch8: '#1f7d5d', wifi: '#f59f30', router: '#7d5bd6', socket: '#c0c6d0' };
export function deviceColour(kind) { return DEV[kind] || '#888'; }
/** One device drawn at (x, y) about s pixels across, from above at a slight angle. */
export function device(g, kind, x, y, s, opts = {}) {
  g.save(); g.translate(x, y); const k = s / 64; g.scale(k, k); g.lineJoin = 'round';
  const line = '#141826', c = DEV[kind] || '#888', lw = 3;
  // drop shadow
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(2, 24, 30, 8, 0, 0, 7); g.fill();
  switch (kind) {
    case 'laptop':
      blob(g, shade(c, -0.25), line, () => rr(g, -28, 4, 56, 18, 4), lw);
      blob(g, '#dfe4ee', line, () => rr(g, -24, -26, 48, 32, 4), lw);
      g.fillStyle = opts.on ? '#7fd3ff' : '#3a4560'; g.fillRect(-20, -22, 40, 24);
      g.fillStyle = shade(c, 0.3); g.fillRect(-22, 8, 44, 3); g.fillRect(-22, 14, 44, 3);
      break;
    case 'desktop':
      blob(g, '#dfe4ee', line, () => rr(g, -26, -28, 44, 34, 4), lw);
      g.fillStyle = opts.on ? '#7fd3ff' : '#3a4560'; g.fillRect(-22, -24, 36, 26);
      blob(g, shade(c, -0.1), line, () => { g.moveTo(-8, 6); g.lineTo(0, 6); g.lineTo(4, 16); g.lineTo(-12, 16); g.closePath(); }, lw);
      blob(g, c, line, () => rr(g, 20, -24, 12, 44, 3), lw);
      g.fillStyle = '#7dffa8'; g.fillRect(23, -18, 6, 3);
      break;
    case 'tablet':
      blob(g, c, line, () => rr(g, -18, -26, 36, 50, 7), lw);
      g.fillStyle = opts.on ? '#7fd3ff' : '#3a4560'; g.fillRect(-13, -20, 26, 36);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 20, 2.4, 0, 7); g.fill();
      break;
    case 'printer':
      blob(g, '#f4f6fa', line, () => rr(g, -16, -30, 32, 16, 2), lw);
      blob(g, c, line, () => rr(g, -28, -18, 56, 30, 6), lw);
      blob(g, shade(c, -0.25), line, () => rr(g, -22, 6, 44, 12, 3), lw);
      blob(g, '#ffffff', line, () => rr(g, -14, 10, 28, 12, 1), 2);
      g.fillStyle = '#7dffa8'; g.fillRect(16, -12, 6, 4);
      break;
    case 'switch4': case 'switch8': {
      const n = kind === 'switch8' ? 8 : 4, w = kind === 'switch8' ? 64 : 48;
      blob(g, c, line, () => rr(g, -w / 2, -12, w, 26, 5), lw);
      for (let i = 0; i < n; i++) {
        const px = -w / 2 + 6 + i * ((w - 12) / n), used = i < (opts.used || 0);
        g.fillStyle = '#10141c'; g.fillRect(px, -4, (w - 12) / n - 2, 10);
        g.fillStyle = used ? '#7dffa8' : '#2a3a2f'; g.fillRect(px + 1, -9, 3, 3);
      }
      break;
    }
    case 'wifi':
      blob(g, '#f4f6fa', line, () => g.ellipse(0, 6, 22, 12, 0, 0, 7), lw);
      g.fillStyle = c; g.beginPath(); g.arc(0, 6, 5, 0, 7); g.fill();
      g.strokeStyle = c; g.lineWidth = 4; g.lineCap = 'round';
      for (const r of [12, 20, 28]) { g.beginPath(); g.arc(0, 0, r, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
      break;
    case 'router':
      g.strokeStyle = line; g.lineWidth = 4; g.beginPath(); g.moveTo(-16, -4); g.lineTo(-22, -30); g.moveTo(16, -4); g.lineTo(22, -30); g.stroke();
      g.fillStyle = line; g.beginPath(); g.arc(-22, -30, 3.5, 0, 7); g.arc(22, -30, 3.5, 0, 7); g.fill();
      blob(g, c, line, () => rr(g, -28, -8, 56, 24, 7), lw);
      for (let i = 0; i < 4; i++) { g.fillStyle = i < 3 ? '#7dffa8' : '#ffd166'; g.beginPath(); g.arc(-16 + i * 9, 4, 2.6, 0, 7); g.fill(); }
      break;
    case 'socket':
      blob(g, c, line, () => rr(g, -16, -16, 32, 32, 6), lw);
      g.fillStyle = '#1b2230'; g.fillRect(-8, -5, 16, 12);
      g.fillStyle = '#4b5568'; g.font = '700 9px system-ui'; g.textAlign = 'center'; g.fillText('WEB', 0, -8);
      break;
  }
  g.restore();
}
