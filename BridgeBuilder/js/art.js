// Data Bridge art: every picture on the board, drawn in canvas code (no image files). game.js calls these.
// Static layers (sky, skyline, rack towers, terrain, grid dots) are drawn once per round to offscreen canvases.
// Each frame adds only the moving parts: blinking LEDs, the falling bit stream, drifting motes, beams, the truck, effects.
// No requestAnimationFrame: game.js's timer calls Art.tick() then draws. prefers-reduced-motion: no shake, fewer particles.
(function (root) {
  'use strict';
  var W = 960, H = 540, SC = 30, TOP_Y = 7, WORLD_W = 32, WHEEL_R = 0.45, AXLE = 2.4;
  var PAR = 60;            // parallax margin on each side of the far and mid layers
  var RM = false;
  try { RM = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  function sx(x) { return x * SC; }
  function sy(y) { return (TOP_Y - y) * SC; }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function rng(seed) { seed = (seed | 0) || 1; return function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgba(hex, a) { var c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mix(h1, h2, t) {
    var a = rgb(h1), b = rgb(h2), s = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(a[i] + (b[i] - a[i]) * t); s += (v < 16 ? '0' : '') + v.toString(16); }
    return s;
  }
  function rrect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }

  // ---------------------------------------------------------------- palettes (one per round theme)
  var PALS = [
    { sky: ['#040a16', '#0a1c30', '#10364a'], glow: '#38e1c6', far: '#0b1a2b', mid: '#0e2232', haze: '#0c2a38', stream: '#3ad6ff',
      metal: ['#46566b', '#263243', '#141b26'], rock: ['#2c3644', '#1b222c', '#10151c'], led: ['#3ddc84', '#38e1c6', '#ffb74d'] },
    { sky: ['#05061a', '#10173a', '#22306a'], glow: '#7aa2ff', far: '#0d1433', mid: '#111a3d', haze: '#16224f', stream: '#7d97ff',
      metal: ['#4a5476', '#272e4a', '#161a2c'], rock: ['#2e334c', '#1d2136', '#121522'], led: ['#7aa2ff', '#3ddc84', '#c4b5fd'] },
    { sky: ['#0b0712', '#26142c', '#55302c'], glow: '#ffb74d', far: '#1c1020', mid: '#231425', haze: '#40222a', stream: '#ffc061',
      metal: ['#564c5c', '#2e2834', '#1a161e'], rock: ['#3d3032', '#272023', '#171215'], led: ['#ffb74d', '#3ddc84', '#ff7a59'] },
    { sky: ['#020b08', '#072117', '#0f3c29'], glow: '#3ddc84', far: '#06170f', mid: '#0a2016', haze: '#0c301f', stream: '#4be08f',
      metal: ['#3f5349', '#212e28', '#121a16'], rock: ['#28362e', '#19231e', '#0f1612'], led: ['#3ddc84', '#a3e635', '#38e1c6'] },
    { sky: ['#08051a', '#1d0f3a', '#3a1856'], glow: '#e879f9', far: '#150c2b', mid: '#1b1036', haze: '#2c1549', stream: '#ec8cfa',
      metal: ['#51476a', '#2b2542', '#191528'], rock: ['#332b42', '#201b2e', '#13101c'], led: ['#e879f9', '#7aa2ff', '#3ddc84'] },
    { sky: ['#030d16', '#0a2638', '#175066'], glow: '#7fe3ff', far: '#08202e', mid: '#0b2838', haze: '#103d50', stream: '#a5f3ff',
      metal: ['#52677a', '#2a3a4a', '#17212c'], rock: ['#2e3e4a', '#1d2a33', '#121a21'], led: ['#7fe3ff', '#3ddc84', '#ffffff'] }
  ];
  function palette(n) { n = n | 0; return PALS[((n % PALS.length) + PALS.length) % PALS.length]; }

  // ---------------------------------------------------------------- shared sprites, patterns and gradients (made once)
  var K = null;
  var glowCache = {};
  function glow(col, r) {
    var key = col + r;
    if (glowCache[key]) return glowCache[key];
    var c = mk(r * 2, r * 2), g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(0.35, rgba(col, 0.35)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    return (glowCache[key] = c);
  }
  function kit() {
    if (K) return K;
    K = {};
    var c, g, i, gr;
    // hazard stripes
    c = mk(20, 20); g = c.getContext('2d');
    g.fillStyle = '#f2b632'; g.fillRect(0, 0, 20, 20);
    g.fillStyle = '#1b1d22';
    for (i = -2; i < 3; i++) { g.beginPath(); g.moveTo(i * 20, 20); g.lineTo(i * 20 + 10, 20); g.lineTo(i * 20 + 30, 0); g.lineTo(i * 20 + 20, 0); g.closePath(); g.fill(); }
    K.hazard = c;
    // wood grain (7 px tall, tiles along the beam)
    c = mk(120, 7); g = c.getContext('2d');
    gr = g.createLinearGradient(0, 0, 0, 7); gr.addColorStop(0, '#e2ad68'); gr.addColorStop(0.45, '#bf8240'); gr.addColorStop(1, '#7c4e20');
    g.fillStyle = gr; g.fillRect(0, 0, 120, 7);
    g.strokeStyle = 'rgba(92, 52, 16, .5)'; g.lineWidth = 0.7;
    for (i = 0; i < 4; i++) {
      g.beginPath();
      for (var x = 0; x <= 120; x += 4) { var yy = 1.3 + i * 1.5 + Math.sin((x / 120) * Math.PI * 2 * (i % 2 + 1) + i) * 0.45; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(80, 44, 12, .7)'; g.beginPath(); g.ellipse(74, 3.6, 3, 1.4, 0, 0, 7); g.stroke();
    K.wood = c;
    // asphalt (11 px tall)
    c = mk(64, 11); g = c.getContext('2d');
    gr = g.createLinearGradient(0, 0, 0, 11); gr.addColorStop(0, '#59606a'); gr.addColorStop(1, '#2c3138');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 11);
    var r = rng(77);
    for (i = 0; i < 150; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.22)'; g.fillRect(Math.floor(r() * 64), Math.floor(r() * 11), 1, 1); }
    K.asphalt = c;
    // joint bolt
    c = mk(16, 16); g = c.getContext('2d');
    g.fillStyle = '#20262f'; g.beginPath(); g.arc(8, 8, 6.4, 0, 7); g.fill();
    gr = g.createRadialGradient(6, 6, 0.5, 8, 8, 6); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, '#c3ceda'); gr.addColorStop(1, '#5d6b7c');
    g.fillStyle = gr; g.beginPath(); g.arc(8, 8, 5.2, 0, 7); g.fill();
    g.fillStyle = '#4a5666'; g.beginPath();
    for (i = 0; i < 6; i++) { var a = i * Math.PI / 3 + 0.5; if (i) g.lineTo(8 + Math.cos(a) * 2.6, 8 + Math.sin(a) * 2.6); else g.moveTo(8 + Math.cos(a) * 2.6, 8 + Math.sin(a) * 2.6); }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(6, 5, 2, 1);
    K.joint = c;
    // anchor plate: gold, bolted at the corners
    c = mk(28, 28); g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.45)'; rrect(g, 4, 5, 21, 21, 4); g.fill();
    gr = g.createLinearGradient(3, 3, 24, 24); gr.addColorStop(0, '#fff0b0'); gr.addColorStop(0.35, '#f5c23e'); gr.addColorStop(1, '#9a650c');
    g.fillStyle = gr; rrect(g, 3, 3, 21, 21, 4); g.fill();
    g.strokeStyle = '#6a440a'; g.lineWidth = 1.5; rrect(g, 3, 3, 21, 21, 4); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(6, 4.5); g.lineTo(21, 4.5); g.stroke();
    [[7, 7], [20, 7], [7, 20], [20, 20]].forEach(function (p) {
      g.fillStyle = '#5b3b08'; g.beginPath(); g.arc(p[0], p[1] + 0.6, 2, 0, 7); g.fill();
      g.fillStyle = '#e8e2cf'; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, 7); g.fill();
    });
    g.fillStyle = '#5b3b08'; g.beginPath(); g.arc(13.5, 13.5, 5, 0, 7); g.fill();
    gr = g.createRadialGradient(12.5, 12.5, 0.5, 13.5, 13.5, 4); gr.addColorStop(0, '#fff6d0'); gr.addColorStop(1, '#c98f1a');
    g.fillStyle = gr; g.beginPath(); g.arc(13.5, 13.5, 3.8, 0, 7); g.fill();
    K.anchor = c;
    // wheel (tyre, tread, rim, spokes); rotated as it is drawn
    var wr = WHEEL_R * SC, s = Math.ceil(wr * 2 + 4), m = s / 2;
    c = mk(s, s); g = c.getContext('2d');
    g.fillStyle = '#121418'; g.beginPath(); g.arc(m, m, wr, 0, 7); g.fill();
    g.fillStyle = '#2b3038';
    for (i = 0; i < 14; i++) { g.save(); g.translate(m, m); g.rotate(i * Math.PI / 7); g.fillRect(wr - 2.4, -1.4, 2.4, 2.8); g.restore(); }
    g.strokeStyle = '#30353e'; g.lineWidth = 1.5; g.beginPath(); g.arc(m, m, wr - 3.6, 0, 7); g.stroke();
    gr = g.createRadialGradient(m - 2, m - 2, 1, m, m, wr * 0.62); gr.addColorStop(0, '#f4f8fc'); gr.addColorStop(0.6, '#b4c0cd'); gr.addColorStop(1, '#6d7a8a');
    g.fillStyle = gr; g.beginPath(); g.arc(m, m, wr * 0.62, 0, 7); g.fill();
    g.strokeStyle = '#4b5563'; g.lineWidth = 1.6;
    for (i = 0; i < 5; i++) { var aa = i * Math.PI * 2 / 5; g.beginPath(); g.moveTo(m + Math.cos(aa) * 2, m + Math.sin(aa) * 2); g.lineTo(m + Math.cos(aa) * wr * 0.58, m + Math.sin(aa) * wr * 0.58); g.stroke(); }
    g.fillStyle = '#2b313a'; g.beginPath(); g.arc(m, m, 2.6, 0, 7); g.fill();
    g.fillStyle = '#e94b3c'; g.fillRect(m + wr * 0.38, m - 1, 2, 2);
    K.wheel = c; K.wheelHalf = m;
    // local-frame gradients for beams (the beam's top edge is y = 0)
    var t = mk(2, 2).getContext('2d');
    gr = t.createLinearGradient(0, 0, 0, 9); gr.addColorStop(0, '#9fb7cf'); gr.addColorStop(0.5, '#6d87a2'); gr.addColorStop(1, '#3c4e63');
    K.steel = gr;
    gr = t.createLinearGradient(0, -52, 0, -18); gr.addColorStop(0, '#4f8ff7'); gr.addColorStop(0.5, '#2563eb'); gr.addColorStop(1, '#1b3f99');
    K.cargo = gr;
    gr = t.createLinearGradient(0, -50, 0, -18); gr.addColorStop(0, '#ffd977'); gr.addColorStop(0.55, '#f2b632'); gr.addColorStop(1, '#b97b0c');
    K.cab = gr;
    gr = t.createLinearGradient(0, -46, 0, -34); gr.addColorStop(0, '#d8f1ff'); gr.addColorStop(1, '#3f86bd');
    K.glass = gr;
    var L = AXLE * SC;
    gr = t.createLinearGradient(L + 30, 0, L + 190, 0); gr.addColorStop(0, 'rgba(255, 240, 190, .32)'); gr.addColorStop(1, 'rgba(255, 240, 190, 0)');
    K.beam = gr;
    // the falling-bit stream strips
    K.strips = [];
    return K;
  }

  var STRESS = [];
  (function () {
    for (var i = 0; i <= 64; i++) {
      var s = i / 64, a = s < 0.5 ? [61, 220, 132] : [255, 214, 64], b = s < 0.5 ? [255, 214, 64] : [244, 67, 54], t = s < 0.5 ? s * 2 : (s - 0.5) * 2;
      STRESS.push('rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')');
    }
  })();
  function stressCol(s) { return STRESS[Math.round(Math.max(0, Math.min(1, s)) * 64)]; }

  // ---------------------------------------------------------------- static layers
  function paintSky(pal, r) {
    var c = mk(W, H), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, pal.sky[0]); gr.addColorStop(0.45, pal.sky[1]); gr.addColorStop(1, pal.sky[2]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // horizon glow
    gr = g.createRadialGradient(W / 2, 330, 20, W / 2, 330, 520);
    gr.addColorStop(0, rgba(pal.glow, 0.22)); gr.addColorStop(1, rgba(pal.glow, 0));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // stars
    for (var i = 0; i < 130; i++) {
      var x = r() * W, y = r() * 260, a = 0.15 + r() * 0.5;
      g.fillStyle = 'rgba(255,255,255,' + (a * (1 - y / 300)).toFixed(3) + ')';
      g.fillRect(x, y, r() < 0.1 ? 2 : 1, r() < 0.1 ? 2 : 1);
    }
    // a moon with circuit pads
    var mx = 120 + r() * 720, my = 52 + r() * 30;
    g.drawImage(glow(pal.glow, 70), mx - 70, my - 70);
    gr = g.createRadialGradient(mx - 8, my - 8, 2, mx, my, 24);
    gr.addColorStop(0, mix('#ffffff', pal.glow, 0.15)); gr.addColorStop(1, mix('#9aa8b8', pal.glow, 0.35));
    g.fillStyle = gr; g.beginPath(); g.arc(mx, my, 22, 0, 7); g.fill();
    g.strokeStyle = rgba(pal.sky[1], 0.35); g.lineWidth = 1.2; g.fillStyle = rgba(pal.sky[1], 0.35);
    g.beginPath(); g.moveTo(mx - 12, my - 4); g.lineTo(mx - 2, my - 4); g.lineTo(mx + 6, my + 4); g.lineTo(mx + 12, my + 4); g.stroke();
    g.beginPath(); g.moveTo(mx - 6, my + 10); g.lineTo(mx + 2, my + 10); g.lineTo(mx + 6, my + 14); g.stroke();
    [[mx - 12, my - 4], [mx + 12, my + 4], [mx - 6, my + 10], [mx + 4, my - 12]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 2, 0, 7); g.fill(); });
    // faint circuit traces across the sky
    g.lineWidth = 1.5;
    for (i = 0; i < 18; i++) {
      var tx = r() * W, ty = 20 + r() * 220, len = 40 + r() * 120, up = r() < 0.5 ? 18 : -18;
      g.strokeStyle = rgba(pal.glow, 0.07); g.fillStyle = rgba(pal.glow, 0.12);
      g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + len, ty); g.lineTo(tx + len + 18, ty + up); g.lineTo(tx + len + 50, ty + up); g.stroke();
      g.beginPath(); g.arc(tx, ty, 2.5, 0, 7); g.fill();
      g.beginPath(); g.arc(tx + len + 50, ty + up, 2.5, 0, 7); g.fill();
    }
    return c;
  }

  function paintFar(pal, r, leds) {
    var w = W + PAR * 2, c = mk(w, H), g = c.getContext('2d');
    var base = 330, x = -10;
    var col = mix(pal.far, pal.sky[2], 0.25);
    while (x < w) {
      var bw = 26 + r() * 60, bh = 50 + r() * 150, top = base - bh;
      g.fillStyle = col; g.fillRect(x, top, bw, H - top);
      g.fillStyle = rgba(pal.glow, 0.10); g.fillRect(x, top, bw, 1.5);
      if (r() < 0.35) {   // antenna with a red light
        var ax = x + bw * (0.3 + r() * 0.4);
        g.fillRect(ax, top - 18, 1.5, 18);
        g.fillStyle = col; g.fillRect(ax - 0.5, top - 18, 2.5, 18);
        if (leds.length < 70) leds.push({ x: ax + 0.75 - PAR, y: top - 19, col: '#ff5a4f', rate: 0.6 + r() * 0.5, ph: r(), duty: 0.35, a: 0.9, s: 2 });
      }
      // windows: dim rows of LED dots
      for (var wy = top + 8; wy < base + 30; wy += 7) {
        for (var wx = x + 4; wx < x + bw - 4; wx += 6) {
          var q = r();
          if (q < 0.2) { g.fillStyle = rgba(q < 0.06 ? '#ffffff' : pal.glow, 0.10 + r() * 0.18); g.fillRect(wx, wy, 2, 1.5); }
          else if (q > 0.993 && leds.length < 70) leds.push({ x: wx + 1 - PAR, y: wy + 0.75, col: pal.led[Math.floor(r() * pal.led.length)], rate: 0.3 + r() * 1.2, ph: r(), duty: 0.6, a: 0.6, s: 1.5 });
        }
      }
      x += bw + r() * 14;
    }
    // haze over the base so the skyline sits back
    var gr = g.createLinearGradient(0, base - 120, 0, base + 40);
    gr.addColorStop(0, rgba(pal.haze, 0)); gr.addColorStop(1, rgba(pal.haze, 0.85));
    g.fillStyle = gr; g.fillRect(0, base - 120, w, H - base + 120);
    return c;
  }

  function paintMid(pal, r, leds) {
    var w = W + PAR * 2, c = mk(w, H), g = c.getContext('2d');
    var x = -20 + r() * 30;
    while (x < w) {
      var tw = 44 + r() * 40, top = 150 + r() * 120;
      var gr = g.createLinearGradient(x, 0, x + tw, 0);
      gr.addColorStop(0, mix(pal.mid, '#ffffff', 0.06)); gr.addColorStop(0.5, pal.mid); gr.addColorStop(1, mix(pal.mid, '#000000', 0.35));
      g.fillStyle = gr; g.fillRect(x, top, tw, H - top);
      g.fillStyle = rgba(pal.glow, 0.28); g.fillRect(x, top, tw, 2);              // rim light
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 3, top + 2, tw - 6, 4);
      for (var y = top + 10; y < H; y += 12) {
        g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(x + 4, y, tw - 8, 1);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 4, y + 9, tw - 8, 1);
        if (r() < 0.55 && leds.length < 90) {
          var hz = 1 - Math.max(0, Math.min(1, (y - 300) / 200));
          if (hz > 0.15) leds.push({ x: x + 7 + Math.floor(r() * 3) * 5 - PAR, y: y + 5, col: pal.led[Math.floor(r() * pal.led.length)], rate: r() < 0.25 ? 0 : 0.4 + r() * 2.2, ph: r(), duty: 0.4 + r() * 0.5, a: 0.75 * hz, s: 2 });
        }
      }
      x += tw + 12 + r() * 70;
    }
    var hg = g.createLinearGradient(0, 260, 0, H);
    hg.addColorStop(0, rgba(pal.haze, 0)); hg.addColorStop(1, rgba(pal.haze, 0.95));
    g.fillStyle = hg; g.fillRect(0, 260, w, H - 260);
    return c;
  }

  // the bottomless gap: columns of 0s and 1s falling away, and a static mist band over their top
  var STREAM_TOP = 0, STRIP_H = 420;
  function strips(pal) {
    var key = pal.stream, out = [];
    if (kit().strips[key]) return kit().strips[key];
    for (var v = 0; v < 3; v++) {
      var c = mk(14, STRIP_H), g = c.getContext('2d'), r = rng(500 + v * 13);
      g.font = 'bold 12px monospace'; g.textBaseline = 'top';
      for (var y = 0; y < STRIP_H; y += 15) {
        if (r() < 0.18) continue;
        var head = r() < 0.06;
        g.fillStyle = head ? 'rgba(255,255,255,.95)' : rgba(pal.stream, (0.25 + r() * 0.75).toFixed(2));
        g.fillText(r() < 0.5 ? '0' : '1', 3, y);
      }
      out.push(c);
    }
    return (kit().strips[key] = out);
  }
  function paintStreamFx(pal) {
    var top = STREAM_TOP, c = mk(W, H - top + 60), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, H - top + 60);
    gr.addColorStop(0, rgba(pal.haze, 0)); gr.addColorStop(0.1, rgba(pal.haze, 0.95)); gr.addColorStop(0.3, rgba(pal.haze, 0.2));
    gr.addColorStop(0.7, rgba(pal.stream, 0.06)); gr.addColorStop(1, rgba(pal.stream, 0.28));
    g.fillStyle = gr; g.fillRect(0, 0, W, H - top + 60);
    return c;
  }

  // ---------------------------------------------------------------- terrain
  function polyArea(pts) { var a = 0; for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]; return a / 2; }
  function insidePoly(pts, x, y) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function inside(pts, px, py, m) {   // a screen point inside the polygon, with a margin in pixels
    var x = px / SC, y = TOP_Y - py / SC;
    if (!insidePoly(pts, x, y)) return false;
    if (!m) return true;
    m /= SC;
    return insidePoly(pts, x - m, y) && insidePoly(pts, x + m, y) && insidePoly(pts, x, y - m) && insidePoly(pts, x, y + m);
  }
  // runs of consecutive edges facing the same way: up (a surface), down (a ceiling) or side (a wall)
  function edgeRuns(pts) {
    var cw = polyArea(pts) < 0, runs = [], cur = null;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy);
      if (!l) continue;
      var nx = (cw ? -dy : dy) / l, ny = (cw ? dx : -dx) / l;
      var kind = ny > 0.55 ? 'up' : ny < -0.55 ? 'down' : 'side';
      if (cur && cur.kind === kind) cur.pts.push([sx(q[0]), sy(q[1])]);
      else { cur = { kind: kind, nx: nx, pts: [[sx(p[0]), sy(p[1])], [sx(q[0]), sy(q[1])]] }; runs.push(cur); }
    }
    return runs;
  }
  function polyPath(g, pts) {
    g.beginPath();
    for (var i = 0; i < pts.length; i++) { if (i) g.lineTo(sx(pts[i][0]), sy(pts[i][1])); else g.moveTo(sx(pts[i][0]), sy(pts[i][1])); }
    g.closePath();
  }
  function runPath(g, run) { g.beginPath(); g.moveTo(run.pts[0][0], run.pts[0][1]); for (var i = 1; i < run.pts.length; i++) g.lineTo(run.pts[i][0], run.pts[i][1]); }
  function strokeRuns(g, runs, kind, width, style) {
    g.lineWidth = width; g.strokeStyle = style;
    runs.forEach(function (rn) { if (rn.kind === kind) { runPath(g, rn); g.stroke(); } });
  }

  function addLed(leds, pts, x, y, pal, r, kind) {
    if (leds.length >= 190 || x < 2 || x > W - 2 || y < 2 || y > H - 2 || !inside(pts, x, y, 3)) return false;
    var col = kind === 'warn' ? '#ffb74d' : kind === 'bar' ? '#cfe8ff' : pal.led[r() < 0.6 ? 0 : Math.floor(r() * pal.led.length)];
    var steady = r() < 0.3;
    leds.push({ x: x, y: y, col: col, rate: steady ? 0 : 0.4 + r() * 2.6, ph: r(), duty: 0.35 + r() * 0.55, a: 1, s: kind === 'bar' ? 3 : 2.4 });
    return true;
  }

  function rackUnits(g, pts, cx0, cx1, by0, by1, pal, r, leds) {
    var panel = mix(pal.metal[1], pal.metal[0], 0.35), dark = pal.metal[2];
    var gr = g.createLinearGradient(cx0, 0, cx0 + 7, 0);
    gr.addColorStop(0, pal.metal[0]); gr.addColorStop(1, pal.metal[2]);
    g.fillStyle = gr; g.fillRect(cx0, by0, 7, by1 - by0);
    gr = g.createLinearGradient(cx1 - 7, 0, cx1, 0);
    gr.addColorStop(0, pal.metal[0]); gr.addColorStop(1, pal.metal[2]);
    g.fillStyle = gr; g.fillRect(cx1 - 7, by0, 7, by1 - by0);
    g.fillStyle = 'rgba(0,0,0,.55)';
    for (var hy = by0 + 4; hy < by1; hy += 9) { g.fillRect(cx0 + 2.5, hy, 2, 3); g.fillRect(cx1 - 4.5, hy, 2, 3); }
    var x = cx0 + 9, w = cx1 - cx0 - 18, y = by0 + 16;
    while (y < by1 && y < H + 10) {
      var q = r(), h = q < 0.32 ? 22 : q < 0.62 ? 18 : q < 0.82 ? 26 : 14;
      var hu = h - 3;
      g.fillStyle = panel; g.fillRect(x, y, w, hu);
      g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(x, y, w, 1);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x, y + hu - 1, w, 1);
      var i, n;
      if (q < 0.32) {            // drive bays
        n = Math.floor(w / 16);
        for (i = 0; i < n; i++) {
          var bx = x + 2 + i * 16;
          g.fillStyle = dark; g.fillRect(bx, y + 3, 13, hu - 6);
          g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx + 2, y + hu - 6, 6, 1);
          g.fillStyle = '#0a0d12'; g.fillRect(bx + 9, y + 5, 3, 3);
          addLed(leds, pts, bx + 10.5, y + 6.5, pal, r);
        }
      } else if (q < 0.62) {     // vents
        g.fillStyle = '#0a0d12';
        for (var vx = x + 24; vx < x + w - 4; vx += 5) g.fillRect(vx, y + 4, 2.5, hu - 8);
        g.fillRect(x + 5, y + hu / 2 - 1.5, 3, 3); g.fillRect(x + 12, y + hu / 2 - 1.5, 3, 3);
        addLed(leds, pts, x + 6.5, y + hu / 2, pal, r); addLed(leds, pts, x + 13.5, y + hu / 2, pal, r, r() < 0.3 ? 'warn' : '');
      } else if (q < 0.82) {     // switch: ports with a light over each
        n = Math.floor((w - 8) / 9);
        for (i = 0; i < n; i++) {
          var px = x + 5 + i * 9;
          g.fillStyle = '#0a0d12'; g.fillRect(px, y + 11, 7, 6);
          g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(px, y + 17, 7, 1);
          g.fillStyle = '#0a0d12'; g.fillRect(px + 2, y + 5, 3, 3);
          if (i % 2 === 0) addLed(leds, pts, px + 3.5, y + 6.5, pal, r);
        }
      } else {                   // blank plate with screws and a label
        g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(x + 5, y + hu / 2, 1.8, 0, 7); g.arc(x + w - 5, y + hu / 2, 1.8, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 14, y + 3, 22, hu - 6);
      }
      y += h;
    }
  }

  function rockFill(g, pts, bx0, bx1, by0, by1, pal, r, leds) {
    var gr = g.createLinearGradient(0, by0, 0, Math.min(by1, by0 + 360));
    gr.addColorStop(0, pal.rock[0]); gr.addColorStop(0.5, pal.rock[1]); gr.addColorStop(1, pal.rock[2]);
    g.fillStyle = gr; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    var i, x, y;
    for (i = 0; i < 70; i++) {    // stone blotches
      x = bx0 + r() * (bx1 - bx0); y = by0 + r() * Math.min(by1 - by0, 360);
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.16)';
      g.beginPath(); g.ellipse(x, y, 4 + r() * 14, 3 + r() * 8, r() * 3, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2;
    for (i = 0; i < 5; i++) {     // cracks
      x = bx0 + r() * (bx1 - bx0); y = by0 + 14 + r() * 200;
      g.beginPath(); g.moveTo(x, y);
      for (var k = 0; k < 4; k++) { x += (r() - 0.5) * 16; y += 6 + r() * 12; g.lineTo(x, y); }
      g.stroke();
    }
    // glowing circuit traces
    for (i = 0; i < 9; i++) {
      x = bx0 + 8 + r() * (bx1 - bx0 - 16); y = by0 + 20 + r() * Math.min(by1 - by0 - 30, 280);
      var seg = [[x, y]];
      for (k = 0; k < 3; k++) {
        if (k % 2 === 0) y += 14 + r() * 26; else x += (r() < 0.5 ? -1 : 1) * (10 + r() * 22);
        seg.push([x, y]);
      }
      g.lineCap = 'round'; g.lineJoin = 'round';
      [[5, rgba(pal.glow, 0.12)], [1.6, rgba(pal.glow, 0.6)]].forEach(function (st) {
        g.strokeStyle = st[1]; g.lineWidth = st[0]; g.beginPath(); g.moveTo(seg[0][0], seg[0][1]);
        for (var j = 1; j < seg.length; j++) g.lineTo(seg[j][0], seg[j][1]);
        g.stroke();
      });
      g.fillStyle = rgba(pal.glow, 0.8);
      g.beginPath(); g.arc(seg[0][0], seg[0][1], 2.4, 0, 7); g.fill();
      g.fillStyle = '#0a0d12'; g.beginPath(); g.arc(seg[seg.length - 1][0], seg[seg.length - 1][1], 2.6, 0, 7); g.fill();
      addLed(leds, pts, seg[seg.length - 1][0], seg[seg.length - 1][1], pal, r);
    }
  }

  function cables(g, run, r) {
    var top = run.pts[0][1] <= run.pts[run.pts.length - 1][1] ? run.pts[0] : run.pts[run.pts.length - 1];
    var bot = top === run.pts[0] ? run.pts[run.pts.length - 1] : run.pts[0];
    var len = bot[1] - top[1];
    if (len < 50) return;
    var o = run.nx > 0 ? 1 : -1, cols = ['#2f6fe0', '#e3b53b', '#d9534f', '#3dbb76'];
    for (var k = 0; k < 4; k++) {
      var y0 = top[1] + 12 + k * 3, y1 = Math.min(bot[1] - 6, y0 + 26 + k * 16 + r() * 16), sag = 8 + k * 3 + r() * 5;
      var x0 = top[0] + (bot[0] - top[0]) * ((y0 - top[1]) / len), x1 = top[0] + (bot[0] - top[0]) * ((y1 - top[1]) / len);
      [[5, 'rgba(0,0,0,.55)'], [3, cols[k]], [1, 'rgba(255,255,255,.35)']].forEach(function (st, si) {
        g.strokeStyle = st[1]; g.lineWidth = st[0];
        g.beginPath(); g.moveTo(x0, y0 + (si === 2 ? -0.8 : 0));
        g.bezierCurveTo(x0 + o * sag, y0 + (y1 - y0) * 0.3, x1 + o * sag, y1 - (y1 - y0) * 0.1, x1, y1 + (si === 2 ? -0.8 : 0)); g.stroke();
      });
    }
    // a clamp holding the bundle
    g.fillStyle = '#5c6675'; g.fillRect(top[0] + (o > 0 ? -2 : -5), top[1] + 9, 7, 14);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(top[0] + (o > 0 ? -2 : -5), top[1] + 9, 7, 1.5);
  }

  function paintTerrain(lv, pal, r, leds) {
    var c = mk(W, H), g = c.getContext('2d'), K = kit();
    var hz = g.createPattern(K.hazard, 'repeat');
    (lv.ground || []).forEach(function (gr) {
      var pts = gr.pts, box = gr.box || { x0: -99, x1: 99, y0: -99, y1: 99 };
      var style = box.y0 > 0.5 ? 'ceil' : (box.x0 > -1 && box.x1 < WORLD_W + 1) ? 'rock' : 'rack';
      var xs = pts.map(function (p) { return sx(p[0]); }), ys = pts.map(function (p) { return sy(p[1]); });
      var bx0 = Math.max(-10, Math.min.apply(null, xs)), bx1 = Math.min(W + 10, Math.max.apply(null, xs));
      var by0 = Math.max(-10, Math.min.apply(null, ys)), by1 = Math.min(H + 10, Math.max.apply(null, ys));
      if (bx1 <= bx0 || by1 <= by0) return;
      var runs = edgeRuns(pts);
      // soft shadow cast on the scenery behind
      g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 28; g.shadowOffsetY = 8;
      polyPath(g, pts); g.fillStyle = pal.metal[2]; g.fill(); g.restore();
      g.save(); polyPath(g, pts); g.clip();
      if (style === 'rock') rockFill(g, pts, bx0, bx1, by0, by1, pal, r, leds);
      else {
        var gr0 = g.createLinearGradient(0, by0, 0, by0 + 320);
        gr0.addColorStop(0, pal.metal[1]); gr0.addColorStop(1, pal.metal[2]);
        g.fillStyle = gr0; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
        var colW = 92, fromRight = box.x0 < 0, cnt = 0;
        for (var k = 0; k < 14; k++) {
          var cx0 = fromRight ? bx1 - (k + 1) * colW : bx0 + k * colW;
          if (fromRight ? cx0 + colW < bx0 : cx0 > bx1) break;
          rackUnits(g, pts, cx0, cx0 + colW, by0, by1, pal, r, leds); cnt++;
        }
      }
      // bevels: a dark inner edge everywhere, hazard stripes along every surface, a glow down the walls
      g.lineJoin = 'round'; g.lineCap = 'butt';
      strokeRuns(g, runs, 'side', 14, 'rgba(0,0,0,.35)');
      strokeRuns(g, runs, 'down', 16, '#0a0d13');
      strokeRuns(g, runs, 'up', 24, 'rgba(0,0,0,.55)');
      strokeRuns(g, runs, 'up', 15, hz);
      strokeRuns(g, runs, 'side', 5, rgba(pal.glow, 0.28));
      g.restore();
      // rim light on the outline
      g.lineJoin = 'round'; g.lineCap = 'round';
      strokeRuns(g, runs, 'up', 2.2, 'rgba(255,255,255,.75)');
      strokeRuns(g, runs, 'side', 1.6, rgba(pal.glow, 0.6));
      runs.forEach(function (rn) {
        if (rn.kind === 'side' && style !== 'rock') cables(g, rn, r);
        if (rn.kind === 'down') {   // under-lights along a ceiling
          for (var i = 0; i + 1 < rn.pts.length; i++) {
            var a = rn.pts[i], b = rn.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
            for (var d = 18; d < l - 10; d += 32) {
              var x = a[0] + (b[0] - a[0]) * d / l, y = a[1] + (b[1] - a[1]) * d / l - 4;
              g.fillStyle = '#05070a'; g.fillRect(x - 6, y - 2, 12, 4);
              addLed(leds, pts, x, y, pal, r, 'bar');
            }
          }
        }
      });
    });
    // the goal: a green data port on a mast at the far side
    if (lv.goal) {
      var gx = sx(lv.goal.x), gy = sy(lv.goal.y);
      g.drawImage(glow('#3ddc84', 34), gx - 34 + 10, gy - 64 - 34 + 8);
      g.fillStyle = '#2b313a'; g.fillRect(gx - 2, gy - 62, 4, 62);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(gx - 2, gy - 62, 1, 62);
      g.fillStyle = '#0d2a1b'; rrect(g, gx + 2, gy - 66, 26, 18, 4); g.fill();
      g.strokeStyle = '#3ddc84'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#3ddc84';
      g.beginPath(); g.moveTo(gx + 9, gy - 61); g.lineTo(gx + 21, gy - 57); g.lineTo(gx + 9, gy - 53); g.closePath(); g.fill();
      leds.push({ x: gx, y: gy - 64, col: '#3ddc84', rate: 1.2, ph: 0, duty: 0.5, a: 1, s: 3 });
    }
    // dim housings for every LED, so an LED that is off still shows
    leds.forEach(function (l) { g.fillStyle = '#05070a'; g.fillRect(l.x - 2, l.y - 2, 4, 4); g.fillStyle = rgba(l.col, 0.25); g.fillRect(l.x - 1.2, l.y - 1.2, 2.4, 2.4); });
    return c;
  }

  function paintGrid(ok) {
    var c = mk(W, H), g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,.30)';
    for (var gx = 0; gx <= WORLD_W; gx++) {
      for (var gy = TOP_Y - Math.floor(H / SC); gy <= TOP_Y; gy++) {
        if (ok(gx, gy)) { g.beginPath(); g.arc(sx(gx), sy(gy), 1.7, 0, 7); g.fill(); }
      }
    }
    return c;
  }

  // ---------------------------------------------------------------- the scene for a round
  // opts.gridOk(x, y): true where a build point may go (draws the build dots layer).
  function prepare(lv, opts) {
    opts = opts || {};
    kit();
    var pal = palette(lv.theme), seed = 101 + (lv.n || 1) * 977 + (lv.theme || 0) * 31;
    STREAM_TOP = Math.round(sy(-0.6));
    var sc = { lv: lv, pal: pal, farLeds: [], midLeds: [], leds: [], cols: [] };
    sc.sky = paintSky(pal, rng(seed));
    sc.far = paintFar(pal, rng(seed + 1), sc.farLeds);
    sc.mid = paintMid(pal, rng(seed + 2), sc.midLeds);
    sc.terrain = paintTerrain(lv, pal, rng(seed + 3), sc.leds);
    sc.strips = strips(pal);
    sc.streamFx = paintStreamFx(pal);
    sc.streamTop = STREAM_TOP;
    var r = rng(seed + 4);
    for (var x = 4; x < W; x += 20 + r() * 8) sc.cols.push({ x: x, v: Math.floor(r() * 3), sp: 40 + r() * 90, ph: r() * STRIP_H, a: 0.2 + r() * 0.5 });
    sc.grid = opts.gridOk ? paintGrid(opts.gridOk) : null;
    resetMotes(seed);
    return sc;
  }

  // ---------------------------------------------------------------- clock, motes and particles
  var T = { t: 0, last: 0, dt: 0, shake: 0, flash: 0, banner: null, sim: null, broken: null, state: '', ang: 0, lastX: null,
    lastMy: null, lastVy: 0, susp: 0, suspV: 0, ticker: '011010', tickAt: 0 };
  var MOTES = [];
  function resetMotes(seed) {
    var r = rng(seed + 9), n = RM ? 8 : 30;
    MOTES.length = 0;
    for (var i = 0; i < n; i++) MOTES.push({ x: r() * W, y: r() * H, vy: 6 + r() * 14, vx: (r() - 0.5) * 6, s: r(), glyph: r() < 0.35 ? (r() < 0.5 ? '0' : '1') : '', ph: r() * 6 });
  }
  var POOL = [], PI = 0, NP = 420;
  for (var pi = 0; pi < NP; pi++) POOL.push({ on: false, k: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, s: 1, col: '', rot: 0, vr: 0, len: 0, mat: '', st: null, gv: 0 });
  function spawn(k, x, y, vx, vy, life, s, col) {
    var p = POOL[PI]; PI = (PI + 1) % NP;
    p.on = true; p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.max = life; p.s = s; p.col = col; p.rot = 0; p.vr = 0; p.st = null;
    p.gv = k === 1 ? 260 : k === 2 ? 90 : k === 3 ? -10 : k === 4 ? 700 : k === 5 ? 180 : -30;
    return p;
  }
  var CONF = ['#f2b632', '#3ddc84', '#7aa2ff', '#e879f9', '#38e1c6', '#ff7a59', '#ffffff'];

  function tick() {
    var now = Date.now() / 1000;
    var dt = T.last ? Math.min(0.05, Math.max(0, now - T.last)) : 0.016;
    T.last = now; T.dt = dt; T.t += dt;
    for (var i = 0; i < MOTES.length; i++) {
      var m = MOTES[i]; m.y -= m.vy * dt * (RM ? 0.3 : 1); m.x += m.vx * dt;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.x < -10) m.x = W + 10; else if (m.x > W + 10) m.x = -10;
    }
    for (i = 0; i < NP; i++) {
      var p = POOL[i]; if (!p.on) continue;
      p.life -= dt; if (p.life <= 0 || p.y > H + 80) { p.on = false; continue; }
      p.vy += p.gv * dt;
      if (p.k === 2) { p.vx *= 0.985; p.vy = Math.min(p.vy, 140); }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    T.shake = T.shake > 0.2 ? T.shake * Math.exp(-dt * 5) : 0;
    T.flash = Math.max(0, T.flash - dt * 0.9);
    if (T.banner && T.t - T.banner.t0 > T.banner.dur) T.banner = null;
    if (T.t - T.tickAt > 0.14) {
      T.tickAt = T.t;
      var b = ''; for (var j = 0; j < 6; j++) b += Math.random() < 0.5 ? '0' : '1';
      T.ticker = b;
    }
    return dt;
  }
  function busy() {
    if (T.shake > 0 || T.flash > 0 || T.banner) return true;
    for (var i = 0; i < NP; i++) if (POOL[i].on) return true;
    return false;
  }

  // ---------------------------------------------------------------- per-frame scene drawing
  function drawLeds(g, list, ox, t) {
    for (var i = 0; i < list.length; i++) {
      var l = list[i], on = RM || !l.rate || ((t * l.rate + l.ph) % 1) < l.duty;
      if (!on) continue;
      var x = l.x + ox, y = l.y;
      if (x < -6 || x > W + 6) continue;
      g.globalAlpha = l.a * 0.8;
      g.drawImage(glow(l.col, 7), x - 7, y - 7);
      g.globalAlpha = l.a;
      g.fillStyle = l.col; g.fillRect(x - l.s / 2, y - l.s / 2, l.s, l.s);
    }
    g.globalAlpha = 1;
  }
  // focusX: the screen x the eye follows (the truck while it drives); the far layers slide a little against it
  function drawScene(g, sc, focusX) {
    var t = T.t, off = focusX == null ? 0 : (W / 2 - focusX);
    var fo = Math.max(-PAR, Math.min(PAR, off * 0.05)), mo = Math.max(-PAR, Math.min(PAR, off * 0.12));
    g.drawImage(sc.sky, 0, 0);
    g.drawImage(sc.far, -PAR + fo, 0);
    g.globalCompositeOperation = 'lighter';
    drawLeds(g, sc.farLeds, fo, t);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(sc.mid, -PAR + mo, 0);
    g.globalCompositeOperation = 'lighter';
    drawLeds(g, sc.midLeds, mo, t);
    g.globalCompositeOperation = 'source-over';
    // the falling bit stream
    var top = sc.streamTop;
    g.save(); g.beginPath(); g.rect(0, top, W, H - top); g.clip();
    for (var i = 0; i < sc.cols.length; i++) {
      var c = sc.cols[i], o = (t * c.sp * (RM ? 0.25 : 1) + c.ph) % STRIP_H, img = sc.strips[c.v];
      g.globalAlpha = c.a;
      g.drawImage(img, c.x, top + o - STRIP_H); g.drawImage(img, c.x, top + o);
    }
    g.globalAlpha = 1;
    g.restore();
    g.drawImage(sc.streamFx, 0, top - 30);
    // drifting motes
    g.globalCompositeOperation = 'lighter';
    g.font = 'bold 11px monospace'; g.textAlign = 'center';
    var gl = glow(sc.pal.glow, 6);
    for (i = 0; i < MOTES.length; i++) {
      var m = MOTES[i], a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + m.ph));
      g.globalAlpha = a;
      if (m.glyph) { g.fillStyle = sc.pal.glow; g.fillText(m.glyph, m.x, m.y); }
      else g.drawImage(gl, m.x - 6, m.y - 6);
    }
    g.globalAlpha = 1; g.textAlign = 'start';
    g.globalCompositeOperation = 'source-over';
    g.drawImage(sc.terrain, 0, 0);
    g.globalCompositeOperation = 'lighter';
    drawLeds(g, sc.leds, 0, t);
    g.globalCompositeOperation = 'source-over';
  }
  function drawGrid(g, sc) { if (sc.grid) g.drawImage(sc.grid, 0, 0); }
  // pts: world points a new beam could reach from the selected joint
  function drawValid(g, pts) {
    if (!pts || !pts.length) return;
    var a = RM ? 0.6 : 0.45 + 0.25 * Math.sin(T.t * 4);
    g.save(); g.strokeStyle = 'rgba(127, 227, 255,' + a.toFixed(3) + ')'; g.lineWidth = 1.6; g.beginPath();
    for (var i = 0; i < pts.length; i++) { var x = sx(pts[i].x), y = sy(pts[i].y); g.moveTo(x + 4.5, y); g.arc(x, y, 4.5, 0, 7); }
    g.stroke(); g.restore();
  }

  // ---------------------------------------------------------------- beams and joints
  var BH = { road: 11, wood: 7, steel: 9 };
  // A beam along +x from 0 to len, centred on y = 0 (the caller has translated and rotated).
  function beamLocal(g, len, mat, stress) {
    var h = BH[mat] || 7, a0 = g.globalAlpha, i;
    g.lineCap = 'round';
    g.strokeStyle = stress == null ? 'rgba(0,0,0,.6)' : stressCol(stress);
    g.lineWidth = h + (stress == null ? 3 : 7);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.stroke();
    g.translate(0, -h / 2);
    if (mat === 'road') {
      g.fillStyle = K.asphaltPat; g.fillRect(0, 0, len, h);
      g.fillStyle = '#d9dee5'; g.fillRect(0, 0, len, 2);
      g.fillStyle = '#e5534b'; for (i = 2; i < len - 4; i += 10) g.fillRect(i, 0, 5, 2);
      g.fillStyle = '#171b21'; g.fillRect(0, h - 2, len, 2);
      g.fillStyle = '#ffd54a'; for (i = 5; i < len - 8; i += 14) g.fillRect(i, h / 2 - 0.2, 7, 1.6);
      g.fillStyle = '#2d333c'; g.fillRect(0, 0, 2.5, h); g.fillRect(len - 2.5, 0, 2.5, h);
    } else if (mat === 'steel') {
      g.fillStyle = K.steel; g.fillRect(0, 0, len, h);
      g.fillStyle = '#c3d6ea'; g.fillRect(0, 0, len, 2.2);
      g.fillStyle = '#44576d'; g.fillRect(0, h - 2.2, len, 2.2);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, len, 0.9);
      for (i = 7; i < len - 4; i += 12) {
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(i - 1, h / 2, 2.4, 2);
        g.fillStyle = '#eef4fa'; g.fillRect(i - 1.2, h / 2 - 1.2, 2.2, 2.2);
      }
      g.fillStyle = '#2f3d4d'; g.fillRect(0, 0, 2.5, h); g.fillRect(len - 2.5, 0, 2.5, h);
    } else {
      g.fillStyle = K.woodPat; g.fillRect(0, 0, len, h);
      g.fillStyle = 'rgba(255,236,190,.45)'; g.fillRect(0, 0, len, 1);
      g.fillStyle = '#6a4116'; g.fillRect(0, 0, 3, h); g.fillRect(len - 3, 0, 3, h);
      g.fillStyle = '#d8c7a8'; g.fillRect(1, h / 2 - 0.8, 1.6, 1.6); g.fillRect(len - 2.6, h / 2 - 0.8, 1.6, 1.6);
    }
    if (stress != null) {
      g.globalAlpha = a0 * 0.38; g.fillStyle = stressCol(stress); g.fillRect(0, 0, len, h); g.globalAlpha = a0;
    }
    g.translate(0, h / 2);
  }
  function patterns(g) {
    if (!K.woodPat) { K.woodPat = g.createPattern(K.wood, 'repeat'); K.asphaltPat = g.createPattern(K.asphalt, 'repeat'); }
  }
  // a, b: world points. stress: null in build mode, 0..1 while the truck drives. alpha: ghost previews.
  function drawBeam(g, a, b, mat, stress, alpha) {
    kit(); patterns(g);
    var ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y), t;
    // Always draw from the left end, so the surface (road deck, kerbs, lanes, highlights) faces up whichever way it was built.
    if (bx < ax || (bx === ax && by > ay)) { t = ax; ax = bx; bx = t; t = ay; ay = by; by = t; }
    g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
    g.translate(ax, ay); g.rotate(Math.atan2(by - ay, bx - ax));
    beamLocal(g, Math.hypot(bx - ax, by - ay), mat, stress);
    g.restore();
  }
  function drawGhost(g, a, b, mat, bad) {
    drawBeam(g, a, b, mat, null, bad ? 0.35 : 0.72);
    g.save(); g.setLineDash([5, 5]); g.lineDashOffset = -T.t * 20; g.lineWidth = 1.5; g.lineCap = 'round';
    g.strokeStyle = bad ? 'rgba(242, 139, 130, .9)' : 'rgba(255, 255, 255, .8)';
    var ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y), l = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / l * 9, ny = (bx - ax) / l * 9;
    g.beginPath(); g.moveTo(ax + nx, ay + ny); g.lineTo(bx + nx, by + ny); g.moveTo(ax - nx, ay - ny); g.lineTo(bx - nx, by - ny); g.stroke();
    g.restore();
  }
  function drawNode(g, x, y, fixed, on) {
    kit();
    var px = sx(x), py = sy(y);
    if (fixed) {
      var p = RM ? 0.5 : (T.t * 0.7 + (x * 0.13)) % 1;
      g.save();
      g.globalAlpha = 0.55 * (1 - p); g.strokeStyle = '#ffd25a'; g.lineWidth = 2;
      g.beginPath(); g.arc(px, py, 11 + p * 9, 0, 7); g.stroke();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.2 * Math.sin(T.t * 3 + x);
      g.drawImage(glow('#f2b632', 18), px - 18, py - 18);
      g.restore();
      g.drawImage(K.anchor, px - 14, py - 14);
    } else {
      g.drawImage(K.joint, px - 8, py - 8);
    }
    if (on) {
      g.save(); g.strokeStyle = '#8ab4f8'; g.lineWidth = 3; g.globalAlpha = 0.8 + 0.2 * Math.sin(T.t * 6);
      g.beginPath(); g.arc(px, py, fixed ? 15 : 11, 0, 7); g.stroke(); g.restore();
    }
  }
  function label(g, x, y, text, col) {
    g.save(); g.font = 'bold 14px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var w = g.measureText(text).width + 18;
    x = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, x)); y = Math.max(16, y);
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8;
    g.fillStyle = 'rgba(8, 13, 24, .92)'; rrect(g, x - w / 2, y - 12, w, 24, 12); g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = col; g.globalAlpha = 0.6; g.lineWidth = 1.2; g.stroke(); g.globalAlpha = 1;
    g.fillStyle = col; g.fillText(text, x, y + 1); g.restore();
  }

  // ---------------------------------------------------------------- the truck
  function drawTruck(g, w0, w1, live) {
    kit();
    var x0 = sx(w0.x), y0 = sy(w0.y), x1 = sx(w1.x), y1 = sy(w1.y);
    var ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), wr = WHEEL_R * SC;
    var spin = live ? T.ang : 0, bob = live ? T.susp : 0, B = -wr - 6;
    g.save(); g.translate(x0, y0); g.rotate(ang);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(L / 2, wr + 2, L / 2 + 38, 4, 0, 0, 7); g.fill();
    // headlight beam
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = K.beam; g.beginPath(); g.moveTo(L + 30, -26 + bob); g.lineTo(L + 190, -60 + bob); g.lineTo(L + 190, 18 + bob); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.save(); g.translate(0, bob);
    // chassis
    g.fillStyle = '#22272f'; g.fillRect(-34, B, L + 66, 7);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-34, B, L + 66, 1);
    // cargo box
    var cx = -34, cw = L + 20, ct = -54, ch = B - ct;
    g.fillStyle = K.cargo; rrect(g, cx, ct, cw, ch, 3); g.fill();
    g.strokeStyle = '#0f2a66'; g.lineWidth = 1.5; g.stroke();
    for (var i = cx + 8; i < cx + cw - 4; i += 11) { g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(i, ct + 3, 1.5, ch - 6); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(i + 1.5, ct + 3, 1.5, ch - 6); }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx + 2, ct + 1, cw - 4, 1.5);
    // glowing DATA display
    var dx = cx + 8, dw = cw - 16, dy = ct + 6, dh = 22;
    g.fillStyle = '#04101e'; rrect(g, dx, dy, dw, dh, 3); g.fill();
    g.strokeStyle = 'rgba(127, 227, 255, .55)'; g.lineWidth = 1; g.stroke();
    g.shadowColor = '#7fe3ff'; g.shadowBlur = 8;
    g.fillStyle = '#bff3ff'; g.font = 'bold 12px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillText('DATA', dx + 6, dy + dh / 2 + 1);
    g.fillStyle = '#7fe3ff'; g.font = '9px monospace';
    g.fillText(T.ticker, dx + 41, dy + dh / 2 + 1);
    g.shadowBlur = 0; g.textBaseline = 'alphabetic';
    // cab
    g.fillStyle = K.cab; g.beginPath();
    g.moveTo(L - 12, B); g.lineTo(L - 12, -50); g.lineTo(L + 10, -50); g.lineTo(L + 24, -34); g.lineTo(L + 31, -30); g.lineTo(L + 31, B); g.closePath(); g.fill();
    g.strokeStyle = '#6b4708'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(L - 11, -49, 20, 1.5);
    g.fillStyle = K.glass; g.beginPath(); g.moveTo(L - 6, -46); g.lineTo(L + 8, -46); g.lineTo(L + 19, -34); g.lineTo(L - 6, -34); g.closePath(); g.fill();
    g.strokeStyle = '#3c2a06'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(L - 2, -36); g.lineTo(L + 5, -44); g.stroke();
    g.strokeStyle = 'rgba(60, 40, 6, .55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L - 8, -32); g.lineTo(L - 8, B); g.stroke();
    g.fillStyle = '#3c2a06'; g.fillRect(L - 4, -28, 6, 2);
    g.fillStyle = '#2a2f37'; g.fillRect(L + 27, B - 5, 7, 7);
    g.fillStyle = '#fff4c2'; g.fillRect(L + 28, -29, 3.5, 5);
    g.fillStyle = '#ff4d4d'; g.fillRect(-36, -28, 3, 6);
    // exhaust stack and antenna with a blinking tip
    g.fillStyle = '#6b7685'; g.fillRect(L - 16, -64, 3.5, 14);
    g.fillStyle = '#9aa6b4'; g.fillRect(L - 16, -64, 3.5, 1.5);
    g.strokeStyle = '#2b313a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(L + 2, -50); g.lineTo(L + 4, -62); g.stroke();
    if (RM || (T.t * 1.5) % 1 < 0.5) { g.globalCompositeOperation = 'lighter'; g.drawImage(glow('#3ddc84', 6), L - 2, -68); g.globalCompositeOperation = 'source-over'; }
    g.fillStyle = '#3ddc84'; g.fillRect(L + 3, -63.5, 2.5, 2.5);
    g.restore();
    // mudguards and wheels
    g.strokeStyle = '#1b2029'; g.lineWidth = 4; g.lineCap = 'butt';
    g.beginPath(); g.arc(0, bob * 0.3, wr + 3, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.beginPath(); g.arc(L, bob * 0.3, wr + 3, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    var m = K.wheelHalf;
    g.save(); g.rotate(spin); g.drawImage(K.wheel, -m, -m); g.restore();
    g.save(); g.translate(L, 0); g.rotate(spin); g.drawImage(K.wheel, -m, -m); g.restore();
    g.restore();
  }

  // ---------------------------------------------------------------- the drive: wheel spin, suspension, breaks, trail
  function resetSim() { T.sim = null; T.broken = null; T.state = ''; T.ang = 0; T.lastX = null; T.lastMy = null; T.lastVy = 0; T.susp = 0; T.suspV = 0; }
  function spawnBreak(a, b, mat, stress) {
    var ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y), mx = (ax + bx) / 2, my = (ay + by) / 2;
    var ang = Math.atan2(by - ay, bx - ax), half = Math.hypot(bx - ax, by - ay) / 2;
    // two halves fall away, each with a torn end
    var p1 = spawn(4, ax, ay, -30 - Math.random() * 30, -60, 2.2, 1, ''); p1.rot = ang; p1.vr = -2 - Math.random() * 2; p1.len = half; p1.mat = mat; p1.st = stress;
    var p2 = spawn(4, mx, my, 30 + Math.random() * 30, -70, 2.2, 1, ''); p2.rot = ang; p2.vr = 2 + Math.random() * 2; p2.len = half; p2.mat = mat; p2.st = stress; p2.s = -1;
    var n = RM ? 10 : 34;
    for (var i = 0; i < n; i++) {
      var aa = Math.random() * Math.PI * 2, v = 80 + Math.random() * 260;
      spawn(1, mx, my, Math.cos(aa) * v, Math.sin(aa) * v - 80, 0.4 + Math.random() * 0.6, 1.5 + Math.random() * 2, Math.random() < 0.7 ? '#ffcf5a' : '#ffffff');
    }
  }
  function celebrate(x, y) {
    var n = RM ? 30 : 110;
    for (var i = 0; i < n; i++) {
      var aa = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 160 + Math.random() * 340;
      var p = spawn(2, x, y, Math.cos(aa) * v, Math.sin(aa) * v, 2 + Math.random() * 1.6, 4 + Math.random() * 4, CONF[i % CONF.length]);
      p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 14;
    }
    for (i = 0; i < (RM ? 4 : 14); i++) {
      var a2 = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v2 = 140 + Math.random() * 220;
      var q = spawn(5, x, y, Math.cos(a2) * v2, Math.sin(a2) * v2, 2.4, 1, '#7fe3ff'); q.rot = (Math.random() - 0.5); q.vr = (Math.random() - 0.5) * 3;
    }
    T.banner = { text: 'Delivered', col: '#3ddc84', t0: T.t, dur: 3.4 };
  }
  function crash(strong) {
    if (!RM) T.shake = Math.max(T.shake, strong ? 13 : 8);
    T.flash = Math.max(T.flash, RM ? 0.18 : (strong ? 0.42 : 0.3));
  }
  // Call once per frame while the truck drives (after the physics steps, before drawing).
  function trackSim(sim) {
    if (!sim) return;
    if (T.sim !== sim) { resetSim(); T.sim = sim; T.broken = new Uint8Array(sim.B.length); T.state = sim.state; }
    var firstBreak = false;
    for (var i = 0; i < sim.B.length; i++) {
      var bm = sim.B[i];
      if (bm.broken && !T.broken[i]) { T.broken[i] = 1; if (!firstBreak) { firstBreak = true; crash(true); } spawnBreak(sim.P[bm.a], sim.P[bm.b], bm.mat, Math.min(1, bm.stress)); }
    }
    var w0 = sim.P[sim.wheels[0]], w1 = sim.P[sim.wheels[1]], dt = T.dt || 0.016;
    if (T.lastX != null) {
      var dx = w0.x - T.lastX; T.ang += dx / WHEEL_R;
      var my = (w0.y + w1.y) / 2, vy = (my - T.lastMy) / dt, acc = (vy - T.lastVy) / dt;
      T.suspV += (-260 * T.susp - 16 * T.suspV + acc * 0.9) * dt;
      T.susp = Math.max(-4, Math.min(4, T.susp + T.suspV * dt));
      T.lastVy = vy;
      // trail: dust behind the rear wheel and the odd spark of data
      var speed = Math.abs(dx) / dt;
      if (speed > 0.4 && (w0.contact || w1.contact) && Math.random() < (RM ? 0.15 : 0.7)) {
        var px = sx(w0.x) - 12, py = sy(w0.y) + WHEEL_R * SC - 3;
        spawn(3, px, py, -20 - Math.random() * 30, -10 - Math.random() * 15, 0.7 + Math.random() * 0.5, 3 + Math.random() * 3, 'rgba(170, 190, 215, .5)');
        if (Math.random() < 0.3) spawn(6, px, py - 8, -30 - Math.random() * 20, -30 - Math.random() * 30, 0.9, 1, sim.lv ? palette(sim.lv.theme).glow : '#7fe3ff');
      }
    }
    T.lastX = w0.x; T.lastMy = (w0.y + w1.y) / 2;
    if (sim.state !== T.state) {
      if (sim.state === 'won') celebrate(sx((w0.x + w1.x) / 2), sy((w0.y + w1.y) / 2) - 40);
      else if (sim.state === 'fell' && !firstBreak && !T.broken.some(function (v) { return v; })) crash(false);
      T.state = sim.state;
    }
  }

  // ---------------------------------------------------------------- effects drawing, camera shake, flash, banner
  function begin(g) {
    g.save();
    if (T.shake > 0.2) g.translate((Math.random() - 0.5) * 2 * T.shake, (Math.random() - 0.5) * 2 * T.shake);
  }
  function drawFx(g) {
    var i, p, a;
    for (i = 0; i < NP; i++) {
      p = POOL[i]; if (!p.on || p.k === 1 || p.k === 6) continue;
      a = Math.min(1, p.life / Math.min(0.6, p.max));
      g.globalAlpha = a;
      if (p.k === 2) {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.abs(Math.cos(p.rot * 1.7)) * 0.8 + 0.2);
        g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      } else if (p.k === 3) {
        var gr = 1 + (1 - p.life / p.max) * 1.5;
        g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.s * gr, 0, 7); g.fill();
      } else if (p.k === 4) {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        if (p.s < 0) { g.translate(p.len, 0); g.rotate(Math.PI); }
        beamLocal(g, p.len, p.mat, p.st);
        var h = (BH[p.mat] || 7) / 2;
        g.strokeStyle = '#ffd27a'; g.lineWidth = 1.5; g.beginPath();
        g.moveTo(p.len, -h); g.lineTo(p.len + 4, -h / 3); g.lineTo(p.len - 1, 0); g.lineTo(p.len + 5, h / 2); g.lineTo(p.len, h); g.stroke();
        g.restore();
      } else if (p.k === 5) {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.fillStyle = '#0b1c30'; rrect(g, -11, -7, 22, 14, 3); g.fill();
        g.strokeStyle = '#7fe3ff'; g.lineWidth = 1.2; g.stroke();
        g.beginPath(); g.moveTo(-11, -6); g.lineTo(0, 1); g.lineTo(11, -6); g.stroke();
        g.restore();
      }
    }
    g.globalCompositeOperation = 'lighter';
    g.font = 'bold 11px monospace';
    for (i = 0; i < NP; i++) {
      p = POOL[i]; if (!p.on || (p.k !== 1 && p.k !== 6)) continue;
      a = Math.min(1, p.life / Math.min(0.5, p.max));
      g.globalAlpha = a;
      if (p.k === 1) { g.drawImage(glow(p.col, 6), p.x - 6, p.y - 6); g.fillStyle = p.col; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
      else { g.fillStyle = p.col; g.fillText((i & 1) ? '1' : '0', p.x, p.y); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  function end(g) {
    g.restore();
    if (T.flash > 0) {
      g.fillStyle = 'rgba(244, 67, 54,' + T.flash.toFixed(3) + ')'; g.fillRect(0, 0, W, H);
    }
    var b = T.banner;
    if (b) {
      var e = T.t - b.t0, inT = Math.min(1, e / 0.35), outT = Math.max(0, Math.min(1, (b.dur - e) / 0.4));
      var y = -40 + (70 + 40) * (1 - Math.pow(1 - inT, 3));
      g.save(); g.globalAlpha = outT;
      g.font = '800 30px system-ui, sans-serif'; g.textBaseline = 'middle';
      var tw = g.measureText(b.text).width, w = tw + 92, x = (W - w) / 2;
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 18; g.shadowOffsetY = 4;
      var gr = g.createLinearGradient(0, y - 28, 0, y + 28); gr.addColorStop(0, '#1d7a4a'); gr.addColorStop(1, '#0f4a2c');
      g.fillStyle = gr; rrect(g, x, y - 28, w, 56, 28); g.fill();
      g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.strokeStyle = b.col; g.lineWidth = 2; g.stroke();
      g.fillStyle = b.col; g.beginPath(); g.arc(x + 32, y, 15, 0, 7); g.fill();
      g.strokeStyle = '#0f3d24'; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(x + 25, y); g.lineTo(x + 30, y + 6); g.lineTo(x + 39, y - 6); g.stroke();
      g.fillStyle = '#ffffff'; g.fillText(b.text, x + 58, y + 1);
      g.restore();
    }
  }

  root.Art = {
    setup: function (o) {
      o = o || {};
      if (o.W) W = o.W; if (o.H) H = o.H; if (o.SC) SC = o.SC; if (o.TOP_Y != null) TOP_Y = o.TOP_Y;
      if (o.WORLD_W) WORLD_W = o.WORLD_W; if (o.WHEEL_R) WHEEL_R = o.WHEEL_R; if (o.AXLE) AXLE = o.AXLE;
      K = null; glowCache = {};
    },
    reducedMotion: RM, palette: palette, stressCol: stressCol,
    prepare: prepare, tick: tick, busy: busy, drawScene: drawScene, drawGrid: drawGrid, drawValid: drawValid,
    drawBeam: drawBeam, drawGhost: drawGhost, drawNode: drawNode, drawTruck: drawTruck, label: label,
    trackSim: trackSim, resetSim: resetSim, celebrate: celebrate, crash: crash,
    begin: begin, drawFx: drawFx, end: end,
    _debug: function () { return T; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
